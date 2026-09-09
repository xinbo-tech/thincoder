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
import { backgroundStatus } from "./suspension.mjs"
import { describeBlockers } from "../agent-tools/subagent-scheduler.mjs" // F-3（QUEUED-VISIBILITY——等待态活派生——叶子模块——无环）

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
  // slotStamp（MODEL-MERGE-SESSION——panel-chat 会话复合落槽值 { activeProvider, activeModel }
  // ——随 agentState spread——override 回合不落槽：stamp 恒为会话模型而非 per-message 试运行值）
  const { cwd, p, fullHistory, history, providerName, turnSlot, distillSlot, autoTurn, askInPanel, slotStamp } = deps
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

// ─── F-3 pool snapshot（QUEUED-VISIBILITY——2026-09-09）───────────────────────
// webview reload 冷启快照重推（挂在 webviewReady 响应——panel-messages.mjs）：
// live 池行（queued/running）以**既有消息形状重放**——queued 行 = refreshQueuedRows
// 载荷形（id/role/status/position/waiting/reason——等待态/位置在此活算——引擎同源
// describeBlockers + 池 Map 序过滤计数）；running 行 = started 事件形（id/role/
// status/startedAt/model/pool:true——块重建 + running ⏹ 门控面）。webview 端
// activity.js 现消费路径承接——**非新消息类型——数据通道零新建**。空池 → 零消息。
const SNAPSHOT_ROLES = new Set(["explore", "plan", "coder", "eng-coder", "advisor"])

/** 重放 live 池快照。lines = { history, fullHistory, cwd }（panel._liveLines /
 *  panel._susp.lines 同形——与 cancelSubagent 路由同一锚点）。 */
export function postPoolSnapshot(panel, lines) {
  const wv = panel?._panel?.webview
  const history = lines?.history
  if (!wv || !(history?._asyncSubagents instanceof Map)) return
  const parent = { history, cwd: lines.cwd || process.cwd() }
  const rows = []
  // queued 行：position/waiting 引擎同源（refreshQueuedRows——subagent 池全量
  // queued 过滤计数——含非 family 角色（escalate——等待头同样可见））。
  let pos = 0
  for (const e of history._asyncSubagents.values()) {
    if (e.status !== "queued") continue
    pos++
    const blk = describeBlockers(parent, e, e._auto?.() ?? false)
    const row = { id: e.id, role: e.role, status: "queued", position: pos }
    if (blk.kind !== "slot") {
      row.waiting = blk.kind === "depc" ? "dependency-cancelled" : "waiting-deps"
      row.reason = blk.detail
    }
    rows.push(row)
  }
  // running 行：family 角色（建块面 = started 事件——非 family 的块由内容流承载——
  // 下个 chunk 自然重建——同步子代理同语义）。
  for (const map of [history._asyncSubagents, history._asyncAdvisors]) {
    if (!(map instanceof Map)) continue
    for (const e of map.values()) {
      if (e.status !== "running" || !SNAPSHOT_ROLES.has(e.role)) continue
      rows.push({ id: e.id, role: e.role, status: "started", startedAt: e.startedAt ?? undefined, model: e.model ?? null, pool: true })
    }
  }
  // 双池共号源——id 升序 ≈ 原始 spawn/到达序——活动区块序复刻。
  rows.sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0))
  for (const row of rows) wv.postMessage({ type: "subagent", ...row })
}
