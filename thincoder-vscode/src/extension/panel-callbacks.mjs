/**
 * panel-callbacks.mjs — runAgent 回调装配（webview 桥接面——2026-09-05 实践轮自
 * panel-chat.mjs runPanelChatImpl 按「骨干—细节两层」提取：回调工厂是独立决策
 * （25 个 onX 的 webview 桥协议——白名单字段/超时截断/压缩生命周期/子代理载荷），
 * 从 405 行回合驱动器提出后，impl 主干 = 阶段调用序列。闭包变量参数化：桥接目标
 * panel + 阶段产物（cwd/p/lines/槽位/autoTurn）作 deps——verbatim 移动，语义零变。
 * 四档结构拆分批（2026-09-18 · VSC-DEBT §12.2.3）：relay 中继面 + 任务可见性族投递队列迁出至
 * `panel-subagent-relay.mjs`——本档按既有导出名转口（消费档 import 面零改）；`onSubagent` /
 * `onSubagentApproval` 两装配点改委托该档转口（R-4）。
 */

import { ctxPercentForHistory } from "../specs.mjs"
// X6（显示面消差批 §2.2）：sync 完成注记锚（turn-cap / stopped-by-user）——核零依赖叶
// （`child-marks.mjs`；静态引入安全：该叶零 import ⇒ 端壳静态闭包不达 node:sqlite——W8 契约②）。
import { TURN_CAP_MARK, STOPPED_MARK } from "@thincoder/core/agent/child-marks.mjs"
// X2（显示面消差批 §2.1）：advisor 生效模型解析——核单源（CLI `tool-events.mjs:131` 同函数；try/catch 降 null；静态链不达 node:sqlite）。
import { resolveAdvisorProvider } from "@thincoder/core/advisor/run.mjs"
import { extractFileLinks } from "./file-links.mjs"
import { permissionGate, batchPermissionGate } from "./permission-gate.mjs"
import { notifyCompletionIfUnfocused } from "./notify.mjs"
import { backgroundStatus } from "./suspension.mjs"
// W15（R5 · 事件中继面）：核 relay 前缀解析（`role#id/` 文法单一权威——零依赖）。
import { parseRelayPath } from "@thincoder/core/agent/relay-prefix.mjs"
// F1（2026-09-16 缺陷修复——承 `docs/batches/2026-09-16-vsc-autoapprove-misalign.md` §2 F1）：child
// 权限通道供给面复用核 `makeChildPermission`（announce → ask → 清态语义单源 + owner label 与活动
// 块同源 KD-8）——叶子档（零依赖、静态链不达 node:sqlite）⇒ 静态引入安全。
import { makeChildPermission } from "@thincoder/core/agent-tools/child-permission.mjs"

// ─── 投递面转口（四档拆分批 2026-09-18 · VSC-DEBT §12.2.3）：既有导出名零改 ──────────────
// relay 中继面 + 任务可见性族投递队列迁出至 `panel-subagent-relay.mjs`（逐字搬迁 + 1-hop
// 解析面结构约定 R-1–R-6）；此处只 import 回调装配面消费件（`buildPanelCallbacks`）。
import { relaySubagentEventToken, relaySubagentContentChunk, emitToolPanel, postSubagentStatus, postSubagentApproval } from "./panel-subagent-relay.mjs"
// 消费档 import 行逐字不变（KD-12）：`relaySubagentEventToken`（panel-messages.mjs:28 · 测试 2 档）·
// `postSubagentEvent` / `flushSubagentOutbox` / `WV_OUTBOX_MAX`（suspension.mjs:27 · 测试 3 档）·
// `emitToolPanel` / `relaySubagentContentChunk`（外部零消费）· `queuedInfoOf`（#118 R2——
// suspension.mjs 重生投影读同一转口面）。
export { relaySubagentEventToken, relaySubagentContentChunk, emitToolPanel, postSubagentEvent, flushSubagentOutbox, WV_OUTBOX_MAX, queuedInfoOf } from "./panel-subagent-relay.mjs"

/**
 * Ask a question in the panel (persistent in-chat card, never auto-dismisses) — shared
 * by the `question` tool and the turn-cap "Continue?" prompt. A native notification toast
 * (showInformationMessage) auto-dismisses after a while and resolves undefined, which can
 * leave the turn silently stopped with no way to continue or cancel.
 * Returns the per-turn ask function (bound to the panel's question queue + abort chain).
 */
export function makeAskInPanel(panel) {
  return (question, options) => new Promise((resolve) => {
    // C1（SESSION-FLOW-C F-C1d——修 H-D）：卡片带 promptId——webview 回传 → host 按 id 查队列
    // 条目（非无条件 shift——迟到/错序响应不 resolve 错队头）。id = panel 单调计数（每问自增）。
    panel._questionSeq = (panel._questionSeq ?? 0) + 1
    const id = panel._questionSeq
    const entry = { id, resolve }
    panel._questionQueue.push(entry)
    panel._setStatus("waiting")
    panel._panel?.webview.postMessage({ type: "question", question, options: options ?? null, promptId: id })
    // Stop must release the waiting turn — an unanswered question would otherwise keep the
    // loop hung on this promise forever (user presses Stop, UI stays "running").
    const onAbort = () => {
      const i = panel._questionQueue.indexOf(entry)
      if (i >= 0) panel._questionQueue.splice(i, 1)
      // promptId 随行——webview 据此移除对应卡片（questionCancelled case——chat.js）
      panel._panel?.webview.postMessage({ type: "questionCancelled", promptId: id })
      resolve(null)
    }
    if (panel._abortController?.signal.aborted) onAbort()
    else panel._abortController?.signal.addEventListener("abort", onAbort, { once: true })
  })
}

// ─── 状态文本 / digest cap 发射面（2026-09-12 活动区收口批——WEBVIEW.md §14 C-12/C-10）──
/** onWait → `statusText` 结构化载荷（C-12#1——纯函数，测试直驱面）：rate = TPM 限流等待（CLI
 *  相名 `gate` 一并映射——对位保留）；overloaded = 5xx 重试等待；retry = 429 限流；quota = 配额耗尽；`warn`（前置告警）与未知 → null。 */
export function statusTextPayload(info) {
  const phase = info?.phase
  if (phase === "rate" || phase === "gate") return { type: "statusText", kind: "rateWait", seconds: info.seconds }
  if (phase === "overloaded") return { type: "statusText", kind: "overloaded", seconds: info.seconds }
  if (phase === "retry") return { type: "statusText", kind: "rateLimited", seconds: info.seconds }
  if (phase === "quota") return { type: "statusText", kind: "quota", message: info.message }
  return null
}

/** digest turn-cap 行发射（C-10）：auto = AUTO 档续跑（CLI agent-turn.mjs:188）、stop = 手动档停止（:192）。 */
export function postDigestCap(panel, mode, turns) {
  panel._panel?.webview.postMessage({ type: "digest", status: "cap", mode, turns })
}

/** ⑥（2026-09-19）sync 子代理完成锚：`<role>#<id>` 键 → `done` 载荷（键文法单源 = `parseRelayPath`）。
 *  X6（显示面消差批 §2.2）：`note` = 块头注记（turn-cap / 停面——判据见 `syncNoteOf`；无注记 null）。 */
function settleSyncSubagent(panel, key, note) {
  const path = parseRelayPath(`${String(key)}/`)
  const hash = path && path.inner.length === 0 ? path.head.indexOf("#") : -1
  const id = hash > 0 ? Number(path.head.slice(hash + 1)) : NaN
  if (!Number.isFinite(id)) return
  postSubagentStatus(panel, { status: "done", role: path.head.slice(0, hash), id, note: note ?? null })
}

/** X6（显示面消差批 §2.2 · 判据与 CLI `tool-events.mjs:217` 同源同序）：sync 完成注记——
 *  turn-cap 锚 ⇒ `turn cap reached — work may be partial`；停面锚 ⇒ `stopped by user — work may be partial`；
 *  否则 null（零注记——**不伪造**）。锚常量 = 核单源（`child-marks.mjs`），禁字面复制。 */
function syncNoteOf(result) {
  const s = String(result ?? "")
  if (s.includes(TURN_CAP_MARK)) return "turn cap reached — work may be partial"
  if (s.includes(STOPPED_MARK)) return "stopped by user — work may be partial"
  return null
}

/** X2（显示面消差批 §2.1）：advisor 卡头 / 状态行补充字段——字面与判据同源 CLI `tool-events.mjs:131` /
 *  `:145` `:152`（`round = _advisorRound + 1`）；非 advisor 不调用 ⇒ 零字段。 */
function advisorMeta(panel) {
  const agent = panel?._agent
  let model = null
  try { model = resolveAdvisorProvider(agent).model ?? null } catch { model = null }
  return { round: (agent?._advisorRound ?? 0) + 1, model }
}

/**
 * runAgent 回调装配（2026-09-05 module-split：verbatim 自 runPanelChatImpl——语义零变）。
 * 内部闭包：totalUsage（跨 onUsage 调用累计）+ lastAgentState（onComplete 写 →
 * onDistilled 读——agent.mjs 的 onDistilled 无参调用，持久化字段随闭包携带）。
 * deps：cwd（toolResult linkify）/ p（usage ctxPct）/ lines（onComplete/onDistilled 落盘）/
 * providerName / turnSlot / distillSlot（落盘槽位 + AC6 槽守卫）/ autoTurn（digest 无通知）。
 */
export function buildPanelCallbacks(panel, deps) {
  // slotStamp（MODEL-MERGE-SESSION——panel-chat 会话复合落槽值 { activeProvider, activeModel }
  // ——随 agentState spread——override 回合不落槽：stamp 恒为会话模型而非 per-message 试运行值）
  const { cwd, p, fullHistory, history, providerName, turnSlot, distillSlot, autoTurn, askInPanel, slotStamp } = deps
  // Token stream is forwarded live to the webview; the assistant reply is persisted by runAgent's
  // pushReal into fullHistory (no separate accumulation needed here).
  // Accumulate token usage across all LLM calls in this turn (matches CLI)
  const totalUsage = { prompt_tokens: 0, completion_tokens: 0, prompt_cache_hit_tokens: 0, prompt_cache_miss_tokens: 0, reasoning_tokens: 0 }
  // Agent state captured at onComplete, reused by the async onDistilled save — agent.mjs calls
  // onDistilled without args, so the persisted engineering fields ride the closure.
  let lastAgentState = {}
  const cbs = {
    onToken: (tok) => {
      // W15（事件中继面）：核 relay ⟦ev⟧ 事件 token → webview 活动区协议消息（识别即消费
      // ——不再以裸文本泄漏）；事件面之后 = 内容中继面（子代内容 chunk → 面板 `sub:` 频道——
      // 不再落主流）；其余普通 token 原样转发。
      if (relaySubagentEventToken(panel, tok)) return
      if (relaySubagentContentChunk(panel, "text", tok)) return
      panel._panel?.webview.postMessage({ type: "token", text: tok })
    },
    onReasoning: (r) => {
      if (relaySubagentContentChunk(panel, "think", r)) return
      panel._panel?.webview.postMessage({ type: "reasoning", text: r })
    },
    // Machine-only sub-turn boundary (advisor/verify/pending-task guard pushback
    // + continue): the webview resets its block pointers so the next reasoning/
    // content starts fresh — covers non-thinking models too (no reasoning stream
    // to trigger the webview's heuristic).
    onSubTurnBreak: () => { panel._panel?.webview.postMessage({ type: "turnBreak" }) },
    onTaskUpdate: (tasks) => {
      const done = tasks.filter((t) => t.status === "done").length
      const inProgress = tasks.filter((t) => t.status === "in_progress").length
      const pending = tasks.filter((t) => t.status === "pending").length
      panel._panel?.webview.postMessage({ type: "taskProgress", done, inProgress, pending, total: tasks.length, items: tasks })
    },
    onPlanMode: (active) => { panel._panel?.webview.postMessage({ type: "planMode", active }); panel._setPlanMode(active).catch(() => {}) },
    // #45（WEBVIEW-PROTOCOL.md §3.3）：工具驱动的模式 / 参数变更 → 端显示同步——两回调同指
    // 单一 sink `_pushSettingsLight()`（四快照重推；**零新增消息类型**）。发射源 = `agent.mjs`
    // 工具批后的同步 cell（mode 腿 = `eng` 工具翻转；参数腿 = 端侧 settings 包装置位）。
    onEngMode: () => { panel._pushSettingsLight() },
    onSettingsChanged: () => { panel._pushSettingsLight() },
    onSubagent: (info) => postSubagentStatus(panel, info),
    // §18 C-8（child permission gate——2026-09-12）：审批态块头通知（child 权限通道
    // announce——tool 非空 = 等待审批 / null = 清态）——任务可见性族（outbox/flush 同通道）。
    onSubagentApproval: (info) => postSubagentApproval(panel, info),
    // §14 C-12#1：onWait 相位 → statusText；§14 C-12#2：顶层逐轮帧 → turnFrame
    onWait: (info) => { const payload = statusTextPayload(info); if (payload) panel._panel?.webview.postMessage(payload) },
    onAgentTurn: (turn, maxTurns) => panel._panel?.webview.postMessage({ type: "turnFrame", turn, maxTurns }),
    // Compression lifecycle visibility (CONTEXT-COMPACTION §7 D-C1/D-C3): the webview
    // status line shows "Compressing context…" → "Compressed: N tokens freed (Xs)" /
    // "failed: <error>" / 3-failure degradation note. Only the lifecycle is surfaced —
    // the summary body never reaches the frontend.
    onCompressStart: (info) => panel._panel?.webview.postMessage({ type: "compress", status: "start", messages: info?.messages ?? null }),
    onCompress: (info) => panel._panel?.webview.postMessage({
      type: "compress",
      status: info?.mode === "fallback" ? "fallback" : "done",
      tokensFreed: info?.tokensFreed ?? null,
      elapsedMs: info?.elapsedMs ?? null,
      tailMessages: info?.tailMessages ?? null,
    }),
    onCompressFail: (err) => panel._panel?.webview.postMessage({ type: "compress", status: "failed", error: err?.message ?? String(err ?? "unknown error") }),
    onGoal: (info) => panel._panel?.webview.postMessage({ type: "goal", ...info }),
    onUsage: (u) => {
      totalUsage.prompt_tokens += u.prompt_tokens ?? 0
      totalUsage.completion_tokens += u.completion_tokens ?? 0
      totalUsage.prompt_cache_hit_tokens += u.prompt_cache_hit_tokens ?? 0
      totalUsage.prompt_cache_miss_tokens += u.prompt_cache_miss_tokens ?? 0
      totalUsage.reasoning_tokens += u.reasoning_tokens ?? 0 // C-12#6：✦ 段（transports 映射补全）
      // M2（§2.1）：分子 = 核 `estimateTokens(history)`（与 CLI 状态行同源同式——`render-frame.mjs:388-389`）。
      const ctxPct = ctxPercentForHistory(history, p)
      panel._panel?.webview.postMessage({ type: "usage", usage: { ...totalUsage }, ctxPct })
    },
    onToolCall: (n, a, id) => {
      if (relaySubagentContentChunk(panel, "toolCall", n, a)) return
      // X2：advisor 携 `round` + `model`（其余工具零字段——webview 无 round ⇒ 逐字节同修前）。
      const meta = n === "advisor" ? advisorMeta(panel) : null
      panel._panel?.webview.postMessage({ type: "toolCall", name: n, args: JSON.stringify(a, null, 2), id, ...(meta ?? {}) })
    },
    onToolResult: (n, r, id, subKey) => {
      // ⑥（2026-09-19）第 4 参 `_subagentKey` = sync 子代理完成锚（核 `dispatch.mjs:441` 传入；
      // 仅 sync 成功 / 折叠路径设置）⇒ 该参在即补 `done`（块冻结 + 归档落流——CLI `finishSubTaskKey`
      // 对位）；无该参（async ack / 普通工具）零动作。与内容面分流互不排斥（两事同点）。
      if (subKey) settleSyncSubagent(panel, subKey, syncNoteOf(r))
      // 第五路调用面：工具结果行按 relay 前缀分流（face = `toolResult`——命中则不入主流）。
      if (relaySubagentContentChunk(panel, "toolResult", n, r)) return
      // X5（§2.2）：切片点携**事实旗标**（静默发生在本行）；`String(r ?? "")` 取代 `(r || "")`：falsy
      // 非串结果（`0` / `false`）文本由空变 `"0"`（记录形——§2.10.8 #13）。
      const full = String(r ?? "")
      const text = full.slice(0, 64 * 1024)
      const truncated = full.length > text.length
      // Verified workspace-real paths ride along so the webview can linkify them.
      const links = extractFileLinks(cwd, text)
      panel._panel?.webview.postMessage({ type: "toolResult", name: n, text, id, links, truncated })
    },
    // Live output streaming (bash etc.) — chunks append to the running tool card.
    onToolOutput: (n, chunk, id) => {
      if (relaySubagentContentChunk(panel, "toolOutput", n, chunk)) return
      // M3（§2.2）：`[object Object]` —— 核 sync 评审 chunk = `{ kind, text }` 对象（`advisor/loop.mjs:82`
      // emit），无 relay 前缀 ⇒ 直通至此 ⇒ 对象入载荷。端边界归一（CLI 逐字先例 `tool-events.mjs:322-324`）：
      // 非串取 `.text`；`kind` 随行保留为可选字段（webview 现只消费 `text`——不新增消费面）。
      const text = typeof chunk === "string" ? chunk : String(chunk?.text ?? "")
      panel._panel?.webview.postMessage({ type: "toolOutput", name: n, text, kind: chunk?.kind ?? null, id })
    },
    onToolPanel: (name, chunk) => emitToolPanel(panel, name, chunk),
    onComplete: (content, agentState) => {
      lastAgentState = agentState ?? {}
      panel._saveLines(fullHistory, history, { ...slotStamp, ...agentState }, turnSlot)
      panel._panel?.webview.postMessage({ type: "complete" })
      panel._pushSessions()
      // Native notification when the user is in another window (no-op when focused).
      // §17: digests are system-driven turns — no completion notification per digest
      // (the user sees the summarized results when they return).
      if (!autoTurn) notifyCompletionIfUnfocused()
    },
    // Distillation finished and the machine line was REPLACED by the compressed version — the
    // onComplete save above holds the pre-shrink line, so persist again (FR3/AC5). Slot guard:
    // a session switch since this turn started means the shrink belongs to the OLD session —
    // never write it into the new one (AC6). Silent (N3): a save failure must not surface.
    onDistilled: () => {
      if (panel._slot !== distillSlot) return
      try { panel._saveLines(fullHistory, history, { ...slotStamp, ...lastAgentState }, distillSlot) }
      catch (e) { console.error("[chat-panel] distill save failed:", e.message) }
    },
    onPermissionRequired: permissionGate(panel),
    // §16 D-B1: same-response non-readonly tools ask ONCE (approveAll / oneByOne / deny).
    onBatchPermissionRequest: batchPermissionGate(panel),
    onQuestion: (question, options) => askInPanel(question, options),
    // §17: async settle events wake the suspension driver (no-op when it isn't parked —
    // panel._suspWake is set only while the driver waits for the next settle).
    // C2 (SESSION-FLOW-C F-C2e——触发点补)：挂起会话活跃期间（digest 间——轮末 282/300
    // 重发之间的窗口）每个 settle 都会改变池/待消化计数——即时重发到忙态单广播
    // （_publishTurnState 带 counts）——webview 计数 = host 实际，不陈旧。状态随当前
    // _turnState（会话用户回合/digest 执行中为 running——只刷计数不误翻状态）。
    onAsyncSettled: () => {
      panel._suspWake?.()
      const susp = panel._susp
      if (susp?.active) panel._publishTurnState?.(panel._turnState ?? "susp", backgroundStatus(susp.lines.history))
    },
  }
  // ─── F1（2026-09-16 缺陷修复——承批次档 §2 F1）：child 权限通道**端侧供给** ─────────────
  // 核 spawn / escalate / continue 三族经 `ctx.onPermissionRequest(name, args)` 询问（缝契约 =
  // `CORE-UNIFICATION.md` §2.13.3）：name = `${key}/${tool}`（子代写——`subagent-spawn.mjs:319`；
  // key = relayPrefix 去尾 = `<role>#<id>`）· `escalate#<id>/${tool}`（飞刀写）· `continue`
  // （撞帽续跑——归属键在 args.agent）。形态 = 按次解析归属键 ⇒ `makeChildPermission` 按次构造
  // （announce → ask → 清态 + owner 归属——面板卡带 `<role>#<id>` 归属、与活动块同源）；
  // 键不符（嵌套 relay 等）⇒ 回退面板 gate **原样名**询问（卡可达 · 无归属标签）；
  // AUTO（live）⇒ 直返 true 零卡。核分支：缺失本供给 ⇒ 核 spawn 分支静默 `return false`、
  // 不出卡（`subagent-spawn.mjs:308-309`——手动档子代写症状源）。
  // 残环批（2026-09-16——承 `docs/batches/2026-09-16-subagent-panel-residual-rings.md` §2）：
  // ① 条目级 signal 接回——按归属键 id 读池条目（与 ⏹ 路由同源同式：`panel._liveLines ??
  //    panel._susp?.lines` → `history._asyncSubagents.get(String(id))`）⇒ `signal: entry.controller.signal`
  //    ——gate 路径①（child abort）VSC 转实态（⏹ / `action:'cancel'` / 会话链中止一律 deny 释放 +
  //    `permissionWithdrawn`；迟到弹卡 sig 已 abort ⇒ 即释放）；② model 供给（`escalate <model> #<id>`）；
  // ③ continue 键形解析（「键形才归属」单规则——文法单源 `parseRelayPath`）。
  cbs.onPermissionRequest = async (name, args) => {
    if (panel._autoApprove) return true // live AUTO（`permissionGate` 同款 mid-turn 语义）
    // 归属键解析（单规则「键形才归属」——文法单源）：relay 名（`<role>#<id>/<tool>`）；
    // continue = 名锁死、键在 args.agent（全消耗才认——`zhipu:glm-5.2` 等非键形态回退）。
    let ownerKey = null
    let tool = null
    const path = parseRelayPath(String(name ?? ""))
    if (path && path.inner.length === 0) { ownerKey = path.head; tool = path.rest }
    else if (String(name) === "continue") {
      const p = parseRelayPath(String(args?.agent ?? "") + "/")
      if (p && p.inner.length === 0 && p.rest === "") { ownerKey = p.head; tool = "continue" }
    }
    if (ownerKey) {
      const hash = ownerKey.indexOf("#")
      const id = Number(ownerKey.slice(hash + 1))
      // 池条目两读（signal / model——读面与 ⏹ 路由同源；非池子代（sync / 嵌套回退）entry 缺失 ⇒ 双 null）
      const entry = (panel._liveLines ?? panel._susp?.lines)?.history?._asyncSubagents?.get(String(id))
      const perm = makeChildPermission({
        ctx: { callbacks: cbs },
        id,
        role: ownerKey.slice(0, hash),
        model: entry?.model ?? null,
        signal: entry?.controller?.signal ?? null,
      })
      if (perm) return (await perm(tool, args, null)) === true
    }
    // 回退：面板 gate 原样名询问；无 gate（headless / AUTO 构建期）⇒ false（核分支同语义）
    const ask = cbs.onPermissionRequired
    return ask ? (await ask(name, args, null)) === true : false
  }
  return cbs
}

