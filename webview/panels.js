/**
 * panels.js — side panels: task progress, subagents/consultants, goal.
 * Owns the auto-clean interval and the taskProgress / subagent / goal /
 * suspension message handlers.
 * R22: activity-BLOCK lifecycle (create/header/freeze/⏹/ticker) moved to
 * activity.js — this module keeps the ROW panel (#subagent-panel rows) and
 * calls activity.* for block-side effects (one-way import, no cycle).
 */
import { ctx, S } from "./state.js"
import { t } from "./i18n.js"
import { escHtml } from "./ui.js"
import { setLoading } from "./loading.js"
import { renderStatusBar } from "./status-bar.js"
import { applySubagentStatus, freezeSettledBlocks } from "./activity.js"

export function renderTaskPanel() {
  const panel = document.getElementById("task-panel")
  if (!S._taskProgress || !S._taskProgress.items || S._taskProgress.items.length === 0) {
    panel.style.display = "none"
    return
  }
  const allDone = S._taskProgress.items.every((item) => item.status === "done")
  if (allDone && panel.style.display !== "block") {
    // Don't show — badge already says ✓N/N, no need for the panel
    return
  }
  const icons = { pending: "○", in_progress: "◉", done: "✓" }
  panel.innerHTML = `<div class="panel-desc">${t("panel.taskDesc") || "Tracks multi-step work — created and updated by the agent"}</div>` +
    S._taskProgress.items.map((item) =>
    `<div class="task-item">
      <span class="task-mark">${icons[item.status] || " "}</span>
      <span class="task-title">${escHtml(item.title)}</span>
      <span class="task-status">${item.status === "in_progress" ? t("task.in_progress") : item.status}</span>
    </div>`
  ).join("")
  panel.style.display = "block"
}

export function renderSubagentPanel() {
  const panel = document.getElementById("subagent-panel")
  const subs = Object.values(S._subagentMap)
  if (subs.length === 0) { panel.style.display = "none"; return }
  const consults = subs.filter((s) => s.role === "consult")
  const consultProgress = consults.length > 0
    ? ` · 👥 ${consults.filter((s) => s.status === "answered").length}/${consults.length} ${t("consult.answered")}`
    : ""
  panel.innerHTML = `<div class="panel-desc">${t("panel.subDesc") || "Background sub-tasks — explore, plan, or implement independently"}${consultProgress}</div>` +
    subs.map((s) => {
    // Consult states get their own colors + labels (answered was rendering as red "error")
    // §17: "settled" = the child finished while the suspension session is active —
    // "done · awaiting digestion" intermediate state, stays in the panel until the
    // pool drains (the session-exit freeze then flips it to done).
    // §20 D-SD3b: "queued" rows = scheduler wait states (spawn-return visibility —
    // waiting-deps reason / slot position in the tool column; no ⏹ — never started).
    const statusCls = s.status === "started" ? "started"
      : (s.status === "done" || s.status === "answered") ? "done"
      : s.status === "queued" ? "queued"
      : s.status === "settled" ? "settled"
      : s.status === "terminated" ? "terminated"
      : s.status === "cancelled" ? "cancelled" // §19.5 D-M6（stopped 冻结——行态灰色）
      : "error"
    const statusText = s.status === "started" ? t("sub.running")
      : s.status === "answered" ? t("consult.answered")
      : s.status === "queued" ? (t("sub.queued") || (s.waiting === "dependency-cancelled" ? "dependency cancelled" : "queued"))
      : s.status === "settled" ? t("sub.awaitingDigest")
      : s.status === "terminated" ? t("consult.terminated")
      : s.status === "failed" ? t("consult.failed")
      : s.status === "cancelled" ? (t("sub.cancelled") || "cancelled") // §19.5
      : s.status
    // Rows with a model tag (consult, escalate) show it so parallel consultants and
    // the flown-in escalate are distinguishable (three-way review 2026-08-16 — surgeon
    // rows rendered as a bare "surgeon" even though the event carries the model).
    // §20: queued rows show the wait annotation in the tool column
    // （waiting for:/dependency cancelled: 恒标——slot 等位 `queued · position N`）。
    const label = s.model ? `${s.role} · ${s.model}` : (s.status === "queued" ? `${s.role} · ${s.waiting ?? "waiting"}` : s.role)
    // answered consults carry a collapsible preview of the reply (review D10)
    const preview = s.role === "consult" && s.replyPreview
      ? `<details class="consult-reply"><summary>${t("consult.replyPreview") || "view reply"}</summary><pre>${escHtml(s.replyPreview)}</pre></details>`
      : ""
    return `<div class="sub-item">
      <span class="sub-role">${escHtml(label)}</span>
      <span class="sub-tool">${s.tool ? escHtml(s.tool) : ""}</span>
      <span class="sub-status ${statusCls}">${statusText}</span>
      ${preview}
    </div>`
  }).join("")
  panel.style.display = "block"
}

export function renderGoalPanel() {
  const panel = document.getElementById("goal-panel")
  if (!S._goalInfo) { panel.style.display = "none"; return }
  const g = S._goalInfo
  const statusCls = g.status === "active" ? "active" : g.status === "done" ? "done" : "cancelled"
  panel.innerHTML = `<div class="panel-desc">${t("panel.goalDesc") || "Long-running objective — runs until complete or cancelled"}</div>
    <div class="goal-section">
    <div class="goal-label">${t("goal.objective")}</div>
    <div class="goal-value">${escHtml(g.objective || "")}</div>
  </div>
  <div class="goal-section">
    <div class="goal-label">${t("goal.criteria")}</div>
    <div class="goal-value">${escHtml(g.criteria || "—")}</div>
  </div>
  <span class="goal-status-badge ${statusCls}">${g.status}</span>`
  panel.style.display = "block"
}

export function clearPanels() {
  // R22: activity blocks are NOT reset here (send/queue-time — live children of
  // the running turn must keep their blocks; finish()/clearMessages reset them).
  S._subagentMap = {}
  S._goalInfo = null
  S._taskProgress = null
  S._taskStatus = null
  document.getElementById("subagent-panel").style.display = "none"
  document.getElementById("goal-panel").style.display = "none"
  document.getElementById("task-panel").style.display = "none"
}

function autoCleanPanels() {
  // Remove finished subagents/consultants after a short linger
  const now = Date.now()
  for (const [id, s] of Object.entries(S._subagentMap)) {
    // consult cards linger 60s — the answered reply preview is the consultation's core
    // output; 3s (plain subagents) would delete it before the user looks up.
    const linger = s.role === "consult" ? 60000 : 3000
    const lingerErr = s.role === "consult" ? 60000 : 5000
    if ((s.status === "done" || s.status === "answered" || s.status === "terminated") && s.doneAt && now - s.doneAt > linger) delete S._subagentMap[id]
    if ((s.status === "error" || s.status === "failed" || s.status === "cancelled") && s.doneAt && now - s.doneAt > lingerErr) delete S._subagentMap[id]
  }
  renderSubagentPanel()
  // Refresh elapsed seconds while a turn is running (CLI 1s ticker parity)
  if (S._turnStart) renderStatusBar()
}

// Auto-clean panel entries (done subagents after 3s, tool panels after 10s)
// Panel cleanup interval. The webview has no teardown path today (it lives for
// the panel's lifetime and dies with it), but the ID is captured so a future
// dispose/visibility-hidden handler can clear it.
const _panelTimer = setInterval(autoCleanPanels, 2000)
// Webview lifetime == panel lifetime, but clear on unload so a future
// teardown/dispose path cannot leak the interval.
window.addEventListener("unload", () => clearInterval(_panelTimer))

/** taskProgress message: update the badge text + panel. */
export function handleTaskProgress(m) {
  const p = m.pending ?? 0, ip = m.inProgress ?? 0, d = m.done ?? 0
  S._taskProgress = m
  if (m.total > 0) S._taskStatus = `✓${d}/${m.total}${ip > 0 ? ` ·${ip}` : ""}${p > 0 ? ` …${p}` : ""}`
  else S._taskStatus = null
  renderTaskPanel()
  renderStatusBar()
}

// ─── B1: 活动块 DOM 生命周期（create/header/freeze/⏹/elapsed ticker/冻结 preview）
// 整体在 activity.js（ensureBlock/applySubagentStatus/freezeBlock/freezeSettledBlocks/
// resetActivity）——行面板与活动块解耦：本文件只管 #subagent-panel 行 + 桥消息路由。

/** subagent message: track lifecycle (rows); block-side effects delegate to
 *  activity.applySubagentStatus (B1 — live blocks are born at the #messages
 *  stream tail and freeze IN PLACE on terminal states; §17 settled stays live
 *  in the flow with the awaiting-digestion header until digest done / exit). */
export function handleSubagentMessage(m) {
  // Block-side effects FIRST (independent of the row bookkeeping below — a
  // chunk-only block without a row still freezes correctly).
  applySubagentStatus(m)
  if (m.status === "queued") {
    // §20 D-SD3b：排队 spawn 行（spawn 返回即见——waiting 标注/等位——CLI waiting 块
    // 的 webview 行等价）。重复 queued 消息（位置/等待态刷新——cancel 前移/依赖终态
    // 转移）覆盖式更新行内容；启动（started）后行转 running——cancelled（was:"queued"）
    // 移除行（不冻结——从未启动无活动块）。
    const prev = S._subagentMap[m.id]
    S._subagentMap[m.id] = {
      role: m.role, status: "queued", startedAt: prev?.startedAt ?? Date.now(),
      // 等待标注显示于 tool 列：waiting for:/dependency cancelled: 原因恒标（不静默——
      // NF-SD）；slot 等位 = `queued · position N`。
      tool: m.reason ?? (m.position != null ? `queued · position ${m.position}` : "queued"),
      model: null, pool: false,
      position: m.position ?? prev?.position ?? null,
      waiting: m.waiting ?? prev?.waiting ?? null,
      reason: m.reason ?? prev?.reason ?? null,
    }
    renderSubagentPanel()
    renderStatusBar()
    return
  }
  if (m.status === "started") {
    S._subagentMap[m.id] = { role: m.role, status: "started", startedAt: m.startedAt || Date.now(), tool: null, model: m.model ?? null, pool: !!m.pool, sessionId: m.sessionId ?? null }
    // §19.5 D-M7: ⏹/块由 activity（applySubagentStatus——池条目建块 + refresh 装 ⏹）
    renderSubagentPanel()
    renderStatusBar()
    return
  }
  const s = S._subagentMap[m.id]
  if (s) { s.status = m.status; s.doneAt = Date.now(); if (m.error) s.error = m.error; if (m.replyPreview) s.replyPreview = m.replyPreview }
  // §20 D-SD3b：cancelled 带 was:"queued" = queued 取消（从未启动——无活动块可冻结）
  // → 行移除（不留 stopped 残行——CLI waiting 块移除同语义）。
  if (m.status === "cancelled" && m.was === "queued") {
    delete S._subagentMap[m.id]
  }
  renderSubagentPanel()
  renderStatusBar()
}

/** §17 D-S2/D-S8: the suspension-session message from the host — activates the
 *  background mode (input stays usable, Stop aborts the whole session), updates the
 *  status-line counts, and on session exit freezes the settled blocks into the
 *  conversation (CLI freezeAllSubTasks parity — "done · awaiting digestion" rows
 *  flip to done and collapse; the report summaries are already in the conversation). */
export function handleSuspensionMessage(m) {
  S._suspended = !!m.active
  if (m.active) {
    S._suspCounts = { running: m.running ?? 0, queued: m.queued ?? 0, pending: m.pending ?? 0, done: m.done ?? 0 }
  } else {
    S._suspCounts = null
    if (m.freeze) {
      // B1/§17.5.5 兜底：流内 settled 活动块原地冻结（done 形态——✓ 身份头 +
      // preview——块已出生在流内出生位），行随之翻 done（freezeSettledBlocks 按
      // settled 行定位块——顺序先行）。
      freezeSettledBlocks()
      for (const [id, s] of Object.entries(S._subagentMap)) {
        if (s.status !== "settled") continue
        s.status = "done"
        s.doneAt = Date.now()
      }
    }
    // §20 D-SD3b：会话退出（含 Stop 全停——池被清空）时移除残留 waiting 行（queued——
    // 池空/清池后无对应条目——CLI freezeAllSubTasks 兜底清场的 webview 等价；自然退出
    // 池空本就无 queued 行——no-op）。
    for (const id of Object.keys(S._subagentMap)) {
      if (S._subagentMap[id].status === "queued") delete S._subagentMap[id]
    }
  }
  renderSubagentPanel()
  renderStatusBar()
  // Re-derive send/abort button visibility from the current loading state — entering
  // suspension shows Stop (abort the background session), exiting hides it again.
  setLoading(ctx, ctx.isRunning)
}

/**
 * C2 (SESSION-FLOW-C F-C2b/F-C2e——webview 单一 reducer): {type:"turnState", state,
 * counts?} —— host _publishTurnState 单一广播的镜像侧。更新 S._turnState（idle/
 * running/susp——派生：Stop 常显 susp、busy 判断）；counts（host backgroundStatus
 * 形 {running,queued,pending,done}——digest 间重发/settle 触发点随广播到达）刷新
 * _suspCounts——webview 计数 = host 实际不陈旧。既有 _suspended 仍由 suspension
 * 消息驱动（会话级语义不变）。每次广播后重绘状态行 + 重派 Stop 可见性。
 */
export function handleTurnStateMessage(m) {
  S._turnState = m.state ?? S._turnState
  if (m.counts) {
    S._suspCounts = { running: m.counts.running ?? 0, queued: m.counts.queued ?? 0, pending: m.counts.pending ?? 0, done: m.counts.done ?? 0 }
  }
  renderStatusBar()
  setLoading(ctx, ctx.isRunning)
}

/** goal message: refresh the goal panel + status badge. */
export function handleGoalMessage(m) {
  S._goalInfo = m
  renderGoalPanel()
  renderStatusBar()
}
