/**
 * spawn-child.mjs — 生成侧统一子代理管线（AGENT-LOOP-SUBAGENT.md §6.7.2）。
 *
 * 收编 subagent/escalate/consult 三份机械同构的重复实现：
 *   - allocRelay / emitRelayModel: relay 取号段 ∥ 出生声明（`[model]`）发射段——两段分离
 *                          （#133 序修：装配面只取号，宣告归 SYNC-CANCEL 单点 arm）；
 *                          makeRelay = 两段组合（escalate / consult 调用点零改）
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
import { relayPrefixOf } from "./relay-prefix.mjs"
import { appendCappedText } from "../text-budget.mjs"
// 第 27 批 §12.3①：relay 前缀文法单一权威模块（`src/agent/relay-prefix.mjs`）——
// 生成侧枢纽再导出（TUI/ACP 消费方可经此导入；消费方按 §12.3① 直连模块亦可）。
export { RELAY_PREFIX_RE, parseRelayPath, relayPrefixOf } from "./relay-prefix.mjs"

/** 事件 token 哨兵串（D1）——LLM 正常内容混淆概率极低；字段分隔用 RS (\x1e)。 */
export const EVENT_SENTINEL = "⟦ev⟧"
const RS = "\x1e"

// 报告文本锚点（turn-cap / stopped-by-user）2026-09-20 下沉零依赖叶 `child-marks.mjs`（端壳
// 需**静态**导入锚点做块头注记判定，而本档静态链经核 agent 栈可达 `node:sqlite` ⇒ 端壳静态
// 闭包禁达，W8 契约②；先例 = `relay-prefix.mjs` 同因下沉）。本行再导出 ⇒ 既有 import 面
// （核 agent-tools 族 / CLI `tool-events.mjs:31`）零改。
export { TURN_CAP_MARK, STOPPED_MARK } from "./child-marks.mjs"

/**
 * D-E3 工程子代理内部 spawn 机械门（AGENT-LOOP-SUBAGENT.md §6.7.6 后备 +
 * ENGINEERING-MODE.md §2.15 D）：eng-coder（偏差审计）与 **eng-designer（自己勘察）**
 * 同为受限通道——depth>0 且父角色 ∈ 集合时，内部 spawn 只允许 role='explore'、
 * async 强制同步。
 * **审计预算（6）只计 eng-coder**（designer 勘察非审计——designer 父路径校验通过后
 * 返回 null：不计数、且调用方以 `engAuditAttempt !== null` 为审计任务书注入开关——
 * 非 null 会把审计范围误注进勘察任务书）。
 * 返回 null = 非工程子代理上下文（不加限制）或 designer 勘察路径（无须计数）；
 * 返回审计尝试序号 = eng-coder 审计通过。
 * schema 层过滤（setup.mjs 受限变体）只是给模型的参数提示——本函数是机械强制。
 */
export const ENG_AUDIT_SPAWN_LIMIT = 6 // 允许 6 次审计 spawn；第 7 次拒绝
export function gateEngCoderSpawn(parent, depth, role, async) {
  const parentRole = parent?._role
  if ((depth ?? 0) <= 0 || (parentRole !== "eng-coder" && parentRole !== "eng-designer")) return null
  if (role !== "explore") {
    throw new Error(`${parentRole} subagents may only spawn role='explore' — internal spawns exist solely for read-only work (the eng-coder divergence audit / the designer's own survey)`)
  }
  if (async === true) {
    throw new Error(`${parentRole} internal spawns are sync-only — the child's report must return before the next protocol step; async spawn is only available at the top level`)
  }
  // designer 勘察路径：校验通过即返回 null（非审计——不计数、不触发审计任务书注入）
  if (parentRole === "eng-designer") return null
  const attempt = (parent._engAuditSpawns ?? 0) + 1
  if (attempt > ENG_AUDIT_SPAWN_LIMIT) {
    throw new Error("correction-round limit exceeded — deliver a stalled report (max 5 fix rounds; the 7th audit spawn is refused mechanically)")
  }
  parent._engAuditSpawns = attempt
  return attempt
}

/**
 * relay **取号段**（无 io）：counter 挂在 parent agent 上，多轮/并行子代理互不冲突。
 * 与发射段分离（#133）：sync 装配面只取号——出生声明（`[model]`）由 SYNC-CANCEL 单点
 * `armSyncChildAbort` 在 registry 写入之后当场宣告（序即契约——先登记、后宣告）。
 * @returns {string} relayPrefix，形如 "coder#3/"
 */
export function allocRelay(parent, label) {
  parent._subAgentCounter = (parent._subAgentCounter ?? 0) + 1
  return relayPrefixOf(label, parent._subAgentCounter)
}

/**
 * relay **出生声明段**：`[model]` 元数据 token 发射（显示层据此更新区块头部，不进内容流）。
 * `[model]` 文法单源本函数——异步支同形字面在 `subagent-run.mjs`（观察项，未并）。
 */
export function emitRelayModel(emit, relayPrefix, model) {
  emit?.(relayPrefix + "[model]" + (model ?? ""))
}

/**
 * 取号 + 发射**组合**（语序与拆分前逐字等价）：escalate / consult 两调用点零改
 * （`subagent-actions.mjs` / `consult.mjs`）；subagent sync 分支改用 `allocRelay` 单独取号。
 * @returns {string} relayPrefix，形如 "coder#3/"
 */
export function makeRelay(parent, label, emit, model) {
  const relayPrefix = allocRelay(parent, label)
  emitRelayModel(emit, relayPrefix, model)
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
 * §27 R23 D-R23c1：包装产物在 onToken 上留 `_relayPrefix` 标记——同步收尾段据此
 * 判定"ctx.callbacks 已是嵌套 wrapper"（本 spawn 处于更深一层——eng-coder 内
 * explore）→ emitNestedChildEvent 补发射内层完成事件（T-R23c.2b 断言源）。
 */
export function wrapChildCallbacks(relayPrefix, parentCallbacks = {}) {
  const mark = (fn) => { fn._relayPrefix = relayPrefix; return fn }
  const wrapped = {
    onToken: parentCallbacks.onToken
      ? mark((t) => parentCallbacks.onToken(relayPrefix + stripEventToken(String(t))))
      : null,
    onReasoning: parentCallbacks.onReasoning
      ? mark((t) => parentCallbacks.onReasoning(relayPrefix + t))
      : null,
    onToolCall: parentCallbacks.onToolCall
      ? mark((name, args) => parentCallbacks.onToolCall(relayPrefix + name, args))
      : null,
    onToolOutput: parentCallbacks.onToolOutput
      ? mark((name, chunk) => parentCallbacks.onToolOutput(relayPrefix + name, chunk))
      : null,
  }
  return wrapped
}

/**
 * §27 R23 D-R23c1（生成侧补发射——评审 #1 🅰）：sync spawn 同步收尾时若父回调已是
 * 嵌套 wrapper（onToken 带 `_relayPrefix` 标记——即本 spawn 的父本身是子代理，如
 * eng-coder 内 explore 审计）→ 发内层 done/stopped 事件（带完整嵌套前缀——wrapper
 * 链自动补外层前缀）→ 主 TUI routeSubToken 路由到子块定格。非嵌套（depth-0 直连主
 * 回调——无标记）不发——完成冻结仍走既有 onToolResult/subKey 路径（零行为变化）。
 * @returns {boolean} true = 已发射（嵌套上下文）
 */
export function emitNestedChildEvent(ctx, relayPrefix, kind) {
  const onToken = ctx?.callbacks?.onToken
  if (typeof onToken?._relayPrefix !== "string" || !onToken._relayPrefix) return false
  if (kind !== "done" && kind !== "stopped") return false
  onToken(`${relayPrefix}⟦ev⟧${kind}\x1e0\x1e0\x1e${kind}\x1e`)
  return true
}

/** 捕获额度（TUI-OOM-ROOTCAUSE——AGENT-LOOP.md §6.15：滞后水位截断）：
 *  `_capturedOutput` 是子代理流式文本的第二份全量拷贝（原无上限——勘察 C2）；超 hard 即
 *  裁至头 16K + 标记 + 尾 48K（摊还 O(1)）——消费面读时已各自 slice(0, 2000/4000)，头尾
 *  保真覆盖；停止报告内联场景出现截断标记（可断言——D-SM1）。纯函数本体住
 *  src/text-budget.mjs（与 TUI 面共用——D2 单源）。 */
export const CAPTURE_CAP_OPTS = {
  hard: 131_072,
  head: 16_384,
  tail: 49_152,
  marker: "… [captured output truncated: N chars omitted] …",
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
  // TUI-OOM-ROOTCAUSE（§23.3.1）：捕获滞后水位截断——超 CAPTURE_CAP_OPTS.hard 裁至
  // 头 + 标记 + 尾（_capturedOutput 有界；续跑同闭包累积，语义一致）。
  const capture = callbacks?.onToken
    ? (t) => { output = appendCappedText(output, stripEventTokensForCapture(String(t)), CAPTURE_CAP_OPTS); child._capturedOutput = output; callbacks.onToken(t) }
    : (t) => { output = appendCappedText(output, stripEventTokensForCapture(String(t)), CAPTURE_CAP_OPTS); child._capturedOutput = output }
  // §27 R23 D-R23c1（评审 🔴 修复——2026-09-07）：capture 是子代理 runAgent/dispatch ctx
  // 实际收到的 onToken——嵌套 wrapper 标记（wrapChildCallbacks `_relayPrefix`）必须随
  // capture 透传，否则 eng-coder 内 explore 同步收尾的 emitNestedChildEvent 判定恒 false
  // （生成侧补发射结构性不可达——T-R23c.2b 真实路径回归）。
  if (callbacks?.onToken?._relayPrefix) capture._relayPrefix = callbacks.onToken._relayPrefix
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
