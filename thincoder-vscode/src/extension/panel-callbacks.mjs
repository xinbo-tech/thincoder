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
  return {
    onToken: (tok) => { panel._panel?.webview.postMessage({ type: "token", text: tok }) },
    onReasoning: (r) => { panel._panel?.webview.postMessage({ type: "reasoning", text: r }) },
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
    onToolCall: (n, a, id) => panel._panel?.webview.postMessage({ type: "toolCall", name: n, args: JSON.stringify(a, null, 2), id }),
    onToolResult: (n, r, id) => {
      const text = (r || "").slice(0, 64 * 1024)
      // Verified workspace-real paths ride along so the webview can linkify them.
      const links = extractFileLinks(cwd, text)
      panel._panel?.webview.postMessage({ type: "toolResult", name: n, text, id, links })
    },
    // Live output streaming (bash etc.) — chunks append to the running tool card.
    onToolOutput: (n, chunk, id) => panel._panel?.webview.postMessage({ type: "toolOutput", name: n, text: chunk, id }),
    onToolPanel: (name, chunk) => panel._panel?.webview.postMessage(toolPanelPayload(name, chunk)),
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
}

