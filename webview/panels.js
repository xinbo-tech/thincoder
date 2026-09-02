/**
 * panels.js — side panels: task progress, subagents/consultants, goal.
 * Owns the auto-clean interval and the taskProgress / subagent / goal /
 * suspension message handlers.
 */
import { ctx, S } from "./state.js"
import { t } from "./i18n.js"
import { escHtml } from "./ui.js"
import { setLoading } from "./loading.js"
import { renderStatusBar } from "./status-bar.js"

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
    const statusCls = s.status === "started" ? "started"
      : (s.status === "done" || s.status === "answered") ? "done"
      : s.status === "settled" ? "settled"
      : s.status === "terminated" ? "terminated"
      : "error"
    const statusText = s.status === "started" ? t("sub.running")
      : s.status === "answered" ? t("consult.answered")
      : s.status === "settled" ? t("sub.awaitingDigest")
      : s.status === "terminated" ? t("consult.terminated")
      : s.status === "failed" ? t("consult.failed")
      : s.status
    // Rows with a model tag (consult, escalate) show it so parallel consultants and
    // the flown-in escalate are distinguishable (three-way review 2026-08-16 — surgeon
    // rows rendered as a bare "surgeon" even though the event carries the model).
    const label = s.model ? `${s.role} · ${s.model}` : s.role
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
    if ((s.status === "error" || s.status === "failed") && s.doneAt && now - s.doneAt > lingerErr) delete S._subagentMap[id]
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

/** Collapse one subagent/escalate activity block (by role + id). Block keys:
 *  subagents `sub:${role}#${id}`, escalate `sub:escalate ${tag} #${id}` (tag = model)
 *  — match by role prefix + `#${id}` suffix (ids are unique per turn via
 *  _subIdCounter). Kept in the conversation (expandable) — never removed. */
function collapseSubBlocks(role, id) {
  for (const [name, block] of S._subBlocks) {
    if (name.startsWith(`sub:${role}`) && name.endsWith(`#${id}`)) {
      block.open = false
    }
  }
}

/** subagent message: track lifecycle; collapse activity blocks on terminal state. */
export function handleSubagentMessage(m) {
  if (m.status === "started") {
    S._subagentMap[m.id] = { role: m.role, status: "started", startedAt: m.startedAt || Date.now(), tool: null, model: m.model ?? null }
  } else {
    const s = S._subagentMap[m.id]
    if (s) { s.status = m.status; s.doneAt = Date.now(); if (m.error) s.error = m.error; if (m.replyPreview) s.replyPreview = m.replyPreview }
    // Consult terminal state → collapse its activity block (consult-UI review 2026-08-15;
    // the "collapses when done" comment was a promise the code never kept).
    if (m.role === "consult" && m.model && m.status !== "started") {
      const block = S._subBlocks.get(`sub:consult ${m.model} #${m.sessionId}`)
      if (block) block.open = false
    }
    // Subagent/escalate terminal state → collapse the activity block too
    // (2026-09-02 fix round: the subagent block had no completion state — it
    // stayed "live" until the turn ended. CLI parity with the ⟦ev⟧done freeze:
    // done = collapsed, kept in the conversation, expandable — not removed.
    // The done notification fires at child settle (subagent.mjs runChild), so
    // this collapses the moment the child completes — no turn-end wait.)
    // §17 D-S8: a "settled" notification (child finished while the suspension
    // session is active) does NOT collapse — the block stays live with the
    // "done · awaiting digestion" intermediate state (panel row); the session-exit
    // freeze (handleSuspensionMessage active:false + freeze) collapses it.
    // done AND error are terminal — both collapse immediately (regression guard:
    // ui.test.mjs "error 终态同样折叠").
    if (m.role !== "consult" && (m.status === "done" || m.status === "error")) {
      collapseSubBlocks(m.role, m.id)
    }
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
    S._suspCounts = { running: m.running ?? 0, queued: m.queued ?? 0, pending: m.pending ?? 0 }
  } else {
    S._suspCounts = null
    if (m.freeze) {
      for (const [id, s] of Object.entries(S._subagentMap)) {
        if (s.status !== "settled") continue
        s.status = "done"
        s.doneAt = Date.now()
        collapseSubBlocks(s.role, id)
      }
    }
  }
  renderSubagentPanel()
  renderStatusBar()
  // Re-derive send/abort button visibility from the current loading state — entering
  // suspension shows Stop (abort the background session), exiting hides it again.
  setLoading(ctx, ctx.isRunning)
}

/** goal message: refresh the goal panel + status badge. */
export function handleGoalMessage(m) {
  S._goalInfo = m
  renderGoalPanel()
  renderStatusBar()
}
