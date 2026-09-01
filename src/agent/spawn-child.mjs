/**
 * spawn-child.mjs — 生成侧统一子代理管线（AGENT-LOOP.md §7.2 D3）。
 *
 * 收编 subagent/escalate/consult 三份机械同构的重复实现：
 *   - makeRelay:           _subAgentCounter + relayPrefix 生成 + `[model]` 元数据 token 发送
 *   - wrapChildCallbacks:  onToken/onReasoning/onToolCall/onToolOutput 前缀包装
 *                          （onToolOutput 复用 dispatch.mjs 的 onOutput 管线，D1；
 *                          LLM 文本 token strip ⟦ev⟧ 哨兵——防伪造，D7）
 *   - runWithContinue:     turn-cap ContinueError 循环骨架（askContinue 差异点经参数注入）
 *   - ensureChildApiKey:   provider.apiKey trim/检查（apiKey 检查 ×3 合并）
 *   - clampEffort:         effort 枚举钳制（enum 外丢弃——行为与 escalate/consult 现状逐字一致）
 *
 * 不收编（防过度抽象，留在各工具内）：角色过滤/overlay/git 注入、subagent 专属
 * （报告契约 MIN_REPORT_CHARS、mergeChildMutations）、escalate 专属（touched-files、
 * effortNote）、consult 专属（session 队列、watchdog、main_history 工具）。
 */
import { specForModel } from "../config.mjs"
import { ContinueError } from "../agent.mjs"

/** 事件 token 哨兵串（D1）——LLM 正常内容混淆概率极低；字段分隔用 RS (\x1e)。 */
export const EVENT_SENTINEL = "⟦ev⟧"
const RS = "\x1e"

/** turn-cap 降级文案的公共锚点：subagent/escalate 的 onDeclined 文案必含此子串，
 *  消费端（TUI tool-events onToolResult）用 includes() 检测"工作可能不完整"语义。
 *  单源化（2026-08-30 评审）：文案演进只改这里，消除文案与检测正则的漂移面。 */
export const TURN_CAP_MARK = "stopped: turn cap reached"

/**
 * 构造 relay 前缀 + 发送 `[model]` 元数据 token（显示层据此更新区块头部，
 * 不进内容流）。counter 挂在 parent agent 上，多轮/并行子代理互不冲突。
 * @returns {string} relayPrefix，形如 "coder#3/"
 */
export function makeRelay(parent, label, emit, model) {
  parent._subAgentCounter = (parent._subAgentCounter ?? 0) + 1
  const relayPrefix = `${label}#${parent._subAgentCounter}/`
  emit?.(relayPrefix + "[model]" + (model ?? ""))
  return relayPrefix
}

/**
 * strip ⟦ev⟧ 哨兵序列：子 agent 的 LLM 文本 token 若以事件哨兵开头，剥除之
 * （模型伪造事件 token 的风险面收窄到"仅生成侧发出口"，D7）。
 * **良构事件放行**（事件与内容共用 onToken 通道的必然结果）：真正由 runAgent
 * depth>0 / dispatch 发出的 turn/approval 事件 token（形如
 * `⟦ev⟧turn\x1e{n}\x1e{max}\x1e{phase}\x1e{detail}`）必须原样通过——只有非良构的
 * `⟦ev⟧…`（模型伪造）才剥为普通文本。
 * 已知限制（round2 #7）：单 chunk 匹配，哨兵串切在 chunk 边界（⟦e + v⟧）漏剥——
 * 残危害由消费端 sanitizeDisplay 兜底，外观级；不引入跨 chunk carry-over 缓冲。
 */
// Single source for the event grammar branch lists (consult P3, 2026-08-30):
// stripEventToken (display) and stripEventTokensForCapture (capture) shared them
// literally — extending the event set meant touching both regexes.
// "done" = §15 D-A3 async-child completion event (emitted by the parent's
// turn-end collection, not by children — listed so the grammar stays honest).
const EVENT_PHASE = "turn|approval|done"
const EVENT_TYPE = "llm|tool|approval|done"
const WELL_FORMED_EVENT = new RegExp(`^${EVENT_SENTINEL}(${EVENT_PHASE})${RS}[^${RS}]*${RS}[^${RS}]*${RS}(${EVENT_TYPE})${RS}`)
export function stripEventToken(text) {
  if (!text.startsWith(EVENT_SENTINEL)) return text
  if (WELL_FORMED_EVENT.test(text)) return text // 真事件（生成侧发出），放行
  return text.slice(EVENT_SENTINEL.length) // 模型伪造的哨兵串 → 剥为普通文本
}

/**
 * Review #4: 事件 token 整体剥除——用于捕获进父 LLM 历史的 output（partial
 * 输出/空报告 fallback）。与 stripEventToken（显示路径，放行真事件供头部消费）
 * 不同：partial 输出不需要事件语义，RS 控制字符对父 LLM 是纯噪音。
 * detail 字段可选（turn 事件 detail 为空且带收尾 RS；approval 事件 detail 为
 * 工具名、无收尾 RS）——round2 复核缺口修复：此前正则要求收尾 RS，approval 的
 * detail 会作为裸工具名残留在 partial 输出里。
 */
export function stripEventTokensForCapture(text) {
  if (!String(text).includes(EVENT_SENTINEL)) return text
  return String(text).replace(new RegExp(`${EVENT_SENTINEL}(${EVENT_PHASE})${RS}[^${RS}]*${RS}[^${RS}]*${RS}(${EVENT_TYPE})(?:${RS}[^${RS}]*)?`, "g"), "")
}

/**
 * 子 agent 回调前缀包装：`role#id/` 前缀转发给父回调。
 * - onToken 先剥伪造的 ⟦ev⟧ 哨兵（D7），再带前缀转发。
 * - onToolOutput 带**已加前缀**的 name 走父 onToolOutput（name 形如
 *   "coder#1/bash"，消费端剥前缀路由进对应区块；chunk 对象/裸串原样透传）。
 * 父回调缺省时不包装（headless 嵌入）。
 */
export function wrapChildCallbacks(relayPrefix, parentCallbacks = {}) {
  const wrapped = {
    onToken: parentCallbacks.onToken
      ? (t) => parentCallbacks.onToken(relayPrefix + stripEventToken(String(t)))
      : null,
    onReasoning: parentCallbacks.onReasoning
      ? (t) => parentCallbacks.onReasoning(relayPrefix + t)
      : null,
    onToolCall: parentCallbacks.onToolCall
      ? (name, args) => parentCallbacks.onToolCall(relayPrefix + name, args)
      : null,
    onToolOutput: parentCallbacks.onToolOutput
      ? (name, chunk) => parentCallbacks.onToolOutput(relayPrefix + name, chunk)
      : null,
  }
  return wrapped
}

/**
 * 子 agent provider API key 检查：trim 后非空才保留；缺失返回 null（调用方
 * 按各自业务语汇报错——subagent 抛出 / escalate·consult 返回 Error 文本）。
 */
export function ensureChildApiKey(provider) {
  provider.apiKey = provider.apiKey?.trim() || null
  return provider.apiKey ? provider : null
}

/**
 * effort 枚举钳制：pool 配置的 effort 超出模型的 reasoningEffortEnum 时
 * 丢弃（provider/core.mjs 会在每次 chat 抛错——候选未起飞先坠机）。enum 外
 * 丢弃即"provider 预设默认也可能是该 override 模型的 enum 外值"的同款防御。
 * @returns {boolean} true = effort 保留；false = effort 被 clamp 丢弃（调用方决定是否拼 effortNote）
 */
export function clampEffort(provider, model, effort) {
  if (!effort) return true
  const enumList = specForModel(model).reasoningEffortEnum
  if (enumList && !enumList.includes(effort)) {
    delete provider.reasoningEffort
    return false
  }
  provider.reasoningEffort = effort
  return true
}

/**
 * turn-cap continue 循环骨架（TURN-CAP-CONTINUE.md）：ContinueError → 询问
 * 继续（askContinue 回调，差异点注入）→ resume:true 重跑（保留 history 与
 * mutation 记账、刷新 turn 预算）；拒绝/headless → 按 onDeclined 降级返回。
 * 非 ContinueError 错误原样抛出（dispatch.mjs 转 Error 工具结果——行为不变）。
 *
 * @param {Function} runner  — async (child, input, callbacks, opts) => result
 * @param {object}   child   — createAgent 返回的子 agent 对象
 * @param {string}   input   — 任务文本
 * @param {object}   callbacks — 子 agent callbacks（含 onPermissionRequest 等）
 * @param {object}   runOpts — { depth, maxTurns, signal }（resume 由本函数管理）
 * @param {object}   hooks   — { askContinue(err) => Promise<boolean>（必需）,
 *                             onDeclined(err, output) => string（拒绝降级）}
 */
export async function runWithContinue(runner, child, input, callbacks, runOpts, { askContinue, onDeclined }) {
  let output = ""
  // Review #4 fix: strip sentinel/control chars from the capture — `output` feeds
  // onDeclined's partial-output return, which lands in the PARENT LLM history where
  // the display-layer sanitizeDisplay backstop does not apply.
  const capture = callbacks?.onToken
    ? (t) => { output += stripEventTokensForCapture(String(t)); child._capturedOutput = output; callbacks.onToken(t) }
    : (t) => { output += stripEventTokensForCapture(String(t)); child._capturedOutput = output }
  for (let resume = false; ; resume = true) {
    try {
      return await runner(child, input, { ...callbacks, onToken: capture }, { ...runOpts, resume })
    } catch (e) {
      if (!(e instanceof ContinueError)) throw e
      const go = await askContinue(e)
      if (go) continue
      return onDeclined(e, output)
    }
  }
}
