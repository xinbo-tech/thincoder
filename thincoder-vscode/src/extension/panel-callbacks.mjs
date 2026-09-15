/**
 * panel-callbacks.mjs — runAgent 回调装配（webview 桥接面——2026-09-05 实践轮自
 * panel-chat.mjs runPanelChatImpl 按「骨干—细节两层」提取：回调工厂是独立决策
 * （25 个 onX 的 webview 桥协议——白名单字段/超时截断/压缩生命周期/子代理载荷），
 * 从 405 行回合驱动器提出后，impl 主干 = 阶段调用序列。闭包变量参数化：桥接目标
 * panel + 阶段产物（cwd/p/lines/槽位/autoTurn）作 deps——verbatim 移动，语义零变。
 */

import { ctxPercentForModel } from "../specs.mjs"
import { extractFileLinks } from "./file-links.mjs"
import { permissionGate, batchPermissionGate } from "./permission-gate.mjs"
import { notifyCompletionIfUnfocused } from "./notify.mjs"
import { toolPanelPayload } from "./panel-toolpanel.mjs"
import { backgroundStatus } from "./suspension.mjs"
import { logEvent } from "@thincoder/core/log.mjs"
// W15（R5 · 事件中继面）：核 relay 前缀解析（`role#id/` 文法单一权威——零依赖）。
import { parseRelayPath } from "@thincoder/core/agent/relay-prefix.mjs"
// F1（2026-09-16 缺陷修复——承 `docs/batches/2026-09-16-vsc-autoapprove-misalign.md` §2 F1）：child
// 权限通道供给面复用核 `makeChildPermission`（announce → ask → 清态语义单源 + owner label 与活动
// 块同源 KD-8）——叶子档（零依赖、静态链不达 node:sqlite）⇒ 静态引入安全。
import { makeChildPermission } from "@thincoder/core/agent-tools/child-permission.mjs"

// ─── W15（2026-09-15 · R5「⏹ queued 等待头回收」+ W13 观察项收口）事件中继面 ───────────
// 核异步族（spawn/settle/cancel）经 `ctx.callbacks.onToken` 发 **relay 前缀 ⟦ev⟧ 事件 token**
// （TUI routeSubToken 消费面；`subagent-run.mjs:143` `⟦ev⟧async` · `subagent-scheduler.mjs:337`
// `⟦ev⟧queued` · `subagent-async.mjs:262` `⟦ev⟧cancelled` · `async-settle.mjs:228/262/264`
// `⟦ev⟧stopped/⟦ev⟧settled/⟦ev⟧done` · 核 `agent.mjs:207` 子代 `⟦ev⟧turn`）。VSC 消费面 =
// `{type:"subagent", …}` 状态消息（webview `activity.js` `applySubagentStatus`）——原 W12/W13
// 镜像删旧后该转换面缺失（事件以裸文本泄漏 / ⏹ queued 取消无等待头回收事件）。
//
// `relaySubagentEventToken` = 转换单点：识别（relay 前缀 + ⟦ev⟧/[model] 形态）即**消费**
// （返回 true——不再以裸 token 文本泄漏）；未识别 → false（调用方原样转发）。两类调用面：
//   ① 面板 `onToken` 包装（buildPanelCallbacks）——运行期事件流；
//   ② ⏹/取消路径的合成 callbacks（panel-messages `cancelSubagent`——核 `executeCancelAction`
//      的 `⟦ev⟧cancelled` + `refreshQueuedTokens` 中继）。
// `⟦ev⟧async` → 记 pending（started 载荷 pool:true 判定）；尾随 `[model]` → `started` 载荷
// （model 入块头）。pending 表挂 panel 弱映射（多面板互不串味）。
const _relayAsyncPending = new WeakMap() // panel → Set<`role#id`>

/** 事件 token → webview 活动区状态消息（映射表：queued / cancelled / stopped / settled /
 *  done / turn / async+[model]）。识别返回 true；未知形态（非本面事件）返回 false。 */
export function relaySubagentEventToken(panel, tok) {
  const text = String(tok ?? "")
  if (!text.includes("⟦ev⟧") && !text.includes("[model]")) return false
  const path = parseRelayPath(text)
  if (!path) return false
  const hash = path.head.indexOf("#")
  const role = path.head.slice(0, hash)
  const id = Number(path.head.slice(hash + 1))
  const rest = path.rest
  const emit = (payload) => { postSubagentEvent(panel, { type: "subagent", role, id, ...payload }); return true }
  if (rest.startsWith("⟦ev⟧async")) {
    let set = _relayAsyncPending.get(panel)
    if (!set) { set = new Set(); _relayAsyncPending.set(panel, set) }
    set.add(path.head)
    return true // [model] 随行补发 started
  }
  if (rest.startsWith("[model]")) {
    const pool = _relayAsyncPending.get(panel)?.delete(path.head) === true
    return emit({ status: "started", pool, model: rest.slice("[model]".length) || null, startedAt: Date.now() })
  }
  if (rest.startsWith("⟦ev⟧queued")) {
    // 载荷：⟦ev⟧queued \x1e kind \x1e position \x1e queued \x1e detail（subagent-scheduler 发射面）
    const parts = rest.split("\x1e")
    const kind = parts[1]
    const detail = parts.slice(4).join("\x1e")
    return emit({
      status: "queued",
      position: Number(parts[2]) || null,
      waiting: kind === "slot" ? null : (kind === "depc" ? "dependency-cancelled" : "waiting-deps"),
      reason: kind === "slot" ? null : (detail || null),
    })
  }
  if (rest.startsWith("⟦ev⟧cancelled")) {
    // 核仅在 queued 取消路径发（subagent-async executeCancelAction——出队即终态）
    return emit({ status: "cancelled", was: "queued" })
  }
  if (rest.startsWith("⟦ev⟧stopped")) return emit({ status: "cancelled" }) // 运行中取消 → 冻结 stopped
  if (rest.startsWith("⟦ev⟧settled")) return emit({ status: "settled" })
  if (rest.startsWith("⟦ev⟧done")) return emit({ status: "done" })
  if (rest.startsWith("⟦ev⟧turn")) {
    const parts = rest.split("\x1e")
    return emit({ status: "turn", turn: Number(parts[1]) || 0, maxTurns: Number(parts[2]) || 0 })
  }
  if (rest.startsWith("⟦ev⟧")) return true // 其余核事件（approval 等——VSC 另有通道）：消费不泄漏
  return false
}

// ─── W15 内容中继面（2026-09-16 子代理面板通道恢复批——子代理内容回流 `sub:` 块）────────
// 核迁移版子代回调（`wrapChildCallbacks`——`thincoder-core/agent/spawn-child.mjs:131-148`）带
// relay 前缀（`role#id/`）到达端壳；事件面（`relaySubagentEventToken`）只吃 `⟦ev⟧`/`[model]`，
// 其余前缀 chunk（text / think / tool 调用行 / tool 输出行）原走主流 ⇒ 面板通道缺生产者
//（迁前端侧自持面丢失——子代理内容被塞进主会话流）。本面 = **内容分流单点**：前缀 chunk →
// `toolPanel` `sub:<role>#<id>` 载荷（webview `activity.js` 子代理块接收面；文法与 CLI
// `routeSub*` 同源——`thincoder-core/agent/relay-prefix.mjs`）。次序：事件面先吃、内容面后判
//（`onToken` 内——事件面 return 之后、主流 postMessage 之前）；前缀由核逐 chunk 重加 ⇒
// 端侧逐 chunk 独立解析（无跨 chunk 重组、无半前缀）。

/** `toolPanel` 载荷发射单点：`buildPanelCallbacks` 的 `onToolPanel` 处理器与
 *  `relaySubagentContentChunk` 共用——全档唯一 `toolPanelPayload` 构造点（§3.1 三落点②）。 */
export function emitToolPanel(panel, name, chunk) {
  panel._panel?.webview.postMessage(toolPanelPayload(name, chunk))
}

/** 子代内容 chunk 分流：relay 前缀（含嵌套链——D-M8 子标）→ 面板载荷。无前缀 → false
 *  （调用方原样转发）。face ∈ text / think / toolCall / toolOutput（四路调用面）：
 *  toolCall = CLI 同构（工具名 + args JSON ≤120；结构化 tool/cmd 随行）；toolOutput = 输出行。 */
export function relaySubagentContentChunk(panel, face, a, b) {
  const path = parseRelayPath(String(a ?? ""))
  if (!path) return false
  const sub = path.inner.length > 0 ? path.inner.join("/") : undefined // D-M8 嵌套子标
  let chunk
  if (face === "toolCall") {
    const argsJson = JSON.stringify(b) || ""
    chunk = { kind: "tool", text: `${path.rest} ${argsJson.slice(0, 120)}`, tool: path.rest,
      cmd: typeof b?.command === "string" ? b.command : undefined, sub }
  } else if (face === "toolOutput") {
    chunk = { kind: "tool", text: typeof b === "string" ? b : String(b?.text ?? ""), sub }
  } else {
    chunk = { kind: face === "think" ? "think" : "text", text: path.rest, sub }
  }
  emitToolPanel(panel, "sub:" + path.head, chunk)
  return true
}

// ─── 任务可见性族投递队列（2026-09-11 第 10 批——WEBVIEW.md §5.1.4 第 1 条）———
/** 队列上界（§5.1.4 第 1 条——溢出丢最旧 + 留痕）。 */
export const WV_OUTBOX_MAX = 200

/** 任务可见性族消息投递（subagent 族**唯一**入口——§5.1.4 第 1 条）：webview 就绪
 *  （panel._wvReady === true）→ 直投；否则入队（暗窗口零丢失——webviewReady 握手
 *  flush 补发）。上界 WV_OUTBOX_MAX——溢出丢最旧 + `ev:subdeliver` 留痕（入队/丢计数——
 *  NFR-A2）。返回是否直投。族边界（§5.1.4 第 1 条末段）：suspension.mjs
 *  reclaimDigestedBlocks 的 done 补发为**直投、不入队**（已消化块收尾，非出生事件）。 */
export function postSubagentEvent(panel, payload) {
  if (panel._wvReady === true) {
    panel._panel?.webview.postMessage(payload)
    return true
  }
  const q = (panel._wvOutbox ??= [])
  q.push(payload)
  let dropped = 0
  while (q.length > WV_OUTBOX_MAX) { q.shift(); dropped++ }
  if (dropped > 0) panel._wvOutboxDropped = (panel._wvOutboxDropped ?? 0) + dropped
  logEvent("ev:subdeliver", { action: "enqueue", status: payload?.status ?? null, queued: q.length, dropped: panel._wvOutboxDropped ?? 0 })
  return false
}

/** 就绪补发（§5.1.4 第 2 条——webviewReady case 两拍之一）：按入队序 flush + `ev:subdeliver`
 *  出队计数。清队后丢弃计数归零（下一窗口重新计）。返回补发条数。 */
export function flushSubagentOutbox(panel) {
  const q = panel._wvOutbox
  if (!Array.isArray(q) || q.length === 0) return 0
  const n = q.length
  for (const payload of q.splice(0)) panel._panel?.webview.postMessage(payload)
  logEvent("ev:subdeliver", { action: "flush", n, dropped: panel._wvOutboxDropped ?? 0 })
  panel._wvOutboxDropped = 0
  return n
}

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
    onSubagent: (info) => postSubagentEvent(panel, { type: "subagent", ...info }),
    // §18 C-8（child permission gate——2026-09-12）：审批态块头通知（child 权限通道
    // announce——tool 非空 = 等待审批 / null = 清态）——任务可见性族（outbox/flush 同通道）。
    onSubagentApproval: (info) => postSubagentEvent(panel, { type: "subagentApproval", ...info }),
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
      const ctxPct = ctxPercentForModel(u.prompt_tokens, p)
      panel._panel?.webview.postMessage({ type: "usage", usage: { ...totalUsage }, ctxPct })
    },
    onToolCall: (n, a, id) => {
      if (relaySubagentContentChunk(panel, "toolCall", n, a)) return
      panel._panel?.webview.postMessage({ type: "toolCall", name: n, args: JSON.stringify(a, null, 2), id })
    },
    onToolResult: (n, r, id) => {
      const text = (r || "").slice(0, 64 * 1024)
      // Verified workspace-real paths ride along so the webview can linkify them.
      const links = extractFileLinks(cwd, text)
      panel._panel?.webview.postMessage({ type: "toolResult", name: n, text, id, links })
    },
    // Live output streaming (bash etc.) — chunks append to the running tool card.
    onToolOutput: (n, chunk, id) => {
      if (relaySubagentContentChunk(panel, "toolOutput", n, chunk)) return
      panel._panel?.webview.postMessage({ type: "toolOutput", name: n, text: chunk, id })
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
  // key = relayPrefix 去尾 = `<role>#<id>`）· `escalate/${tool}`（飞刀写）· `continue`（撞帽续跑）。
  // 形态 = 按次解析归属键 ⇒ `makeChildPermission` 按次构造（announce → ask → 清态 + owner 归属——
  // 面板卡带 `coder#7` 归属、与活动块同源）；键不符（escalate/continue——核名不携 id）⇒ 回退面板
  // gate **原样名**询问（卡可达 · 无归属标签）；AUTO（live）⇒ 直返 true 零卡。缺失本供给 ⇒ 核
  // spawn 分支静默 `return false`、不出卡（`subagent-spawn.mjs:308-309`——手动档子代写症状源）。
  cbs.onPermissionRequest = async (name, args) => {
    if (panel._autoApprove) return true // live AUTO（`permissionGate` 同款 mid-turn 语义）
    const path = parseRelayPath(String(name ?? ""))
    if (path && path.inner.length === 0) {
      const hash = path.head.indexOf("#")
      const perm = makeChildPermission({
        ctx: { callbacks: cbs },
        id: Number(path.head.slice(hash + 1)),
        role: path.head.slice(0, hash),
        // 条目级 signal 无来源（核闭包不携——2.16 行 9 登记面，本批不修）⇒ null
        signal: null,
      })
      if (perm) return (await perm(path.rest, args, null)) === true
    }
    // 回退：面板 gate 原样名询问；无 gate（headless / AUTO 构建期）⇒ false（核分支同语义）
    const ask = cbs.onPermissionRequired
    return ask ? (await ask(name, args, null)) === true : false
  }
  return cbs
}

