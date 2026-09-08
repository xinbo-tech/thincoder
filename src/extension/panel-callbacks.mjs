/**
 * panel-callbacks.mjs — runAgent 回调装配（webview 桥接面——2026-09-05 实践轮自
 * panel-chat.mjs runPanelChatImpl 按「骨干—细节两层」提取：回调工厂是独立决策
 * （25 个 onX 的 webview 桥协议——白名单字段/超时截断/压缩生命周期/子代理载荷），
 * 从 405 行回合驱动器提出后，impl 主干 = 阶段调用序列。闭包变量参数化：桥接目标
 * panel + 阶段产物（cwd/p/lines/槽位/autoTurn）作 deps——verbatim 移动，语义零变。
 */

import { ctxPercentForModel } from "../config.mjs"
import { extractFileLinks } from "./file-links.mjs"
import { permissionGate, batchPermissionGate } from "./permission-gate.mjs"
import { notifyCompletionIfUnfocused } from "./notify.mjs"
import { toolPanelPayload } from "./panel-toolpanel.mjs"

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

/**
 * runAgent 回调装配（2026-09-05 module-split：verbatim 自 runPanelChatImpl——语义零变）。
 * 内部闭包：totalUsage（跨 onUsage 调用累计）+ lastAgentState（onComplete 写 →
 * onDistilled 读——agent.mjs 的 onDistilled 无参调用，持久化字段随闭包携带）。
 * deps：cwd（toolResult linkify）/ p（usage ctxPct）/ lines（onComplete/onDistilled 落盘）/
 * providerName / turnSlot / distillSlot（落盘槽位 + AC6 槽守卫）/ autoTurn（digest 无通知）。
 */
export function buildPanelCallbacks(panel, deps) {
  const { cwd, p, fullHistory, history, providerName, turnSlot, distillSlot, autoTurn, askInPanel } = deps
  // Token stream is forwarded live to the webview; the assistant reply is persisted by runAgent's
  // pushReal into fullHistory (no separate accumulation needed here).
  // Accumulate token usage across all LLM calls in this turn (matches CLI)
  const totalUsage = { prompt_tokens: 0, completion_tokens: 0, prompt_cache_hit_tokens: 0, prompt_cache_miss_tokens: 0 }
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
    onSubagent: (info) => panel._panel?.webview.postMessage({ type: "subagent", ...info }),
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
      panel._saveLines(fullHistory, history, { activeProvider: providerName, ...agentState }, turnSlot)
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
      try { panel._saveLines(fullHistory, history, { activeProvider: providerName, ...lastAgentState }, distillSlot) }
      catch (e) { console.error("[chat-panel] distill save failed:", e.message) }
    },
    onPermissionRequired: permissionGate(panel),
    // §16 D-B1: same-response non-readonly tools ask ONCE (approveAll / oneByOne / deny).
    onBatchPermissionRequest: batchPermissionGate(panel),
    onQuestion: (question, options) => askInPanel(question, options),
    // §17: async settle events wake the suspension driver (no-op when it isn't parked —
    // panel._suspWake is set only while the driver waits for the next settle).
    onAsyncSettled: () => panel._suspWake?.(),
  }
}
