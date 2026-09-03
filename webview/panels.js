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

// ─── §19.5 D-M7 子块 ⏹ 停止控件 + ⟦ev⟧stopped 冻结相位（AGENT-LOOP.md §19.5 D-M7/D-M8）───
// ⏹ 只在运行中子代理块标题行显示（T-M23）；点击 = postMessage cancelSubagent →
// extension 层定向 abort（不经模型回合——失控子代理时模型可能不可靠——chat.js 委托）。
// 块键 = async spawn 频道 `sub:role#id`（explore/plan/coder/eng-coder——池条目）；
// escalate/consult 块键含 model tag 且非池条目——无 ⏹。

/** 可取消块键解析：`sub:eng-coder#1` → { role, id }（CANCELABLE_BLOCK 匹配；其余 null）。 */
export function subBlockTarget(name) {
  const m = /^sub:(explore|plan|coder|eng-coder)#(\d+)$/.exec(String(name ?? ""))
  return m ? { role: m[1], id: Number(m[2]) } : null
}

/** 按 role+id 遍历匹配块（subagent 块键 = `sub:${role}#${id}` 后缀匹配——与
 *  collapseSubBlocks 同规则；escalate/consult 键不命中——无 ⏹）。 */
function eachSubBlock(role, id, fn) {
  for (const [name, block] of S._subBlocks) {
    if (name.startsWith(`sub:${role}`) && name.endsWith(`#${id}`)) fn(block)
  }
}

/** ⏹ 显示/移除（仅 running 态显示——done/error/settled/cancelled 后消失——T-M23）。
 *  按钮为块级 overlay（absolute 定位于标题行右缘——不落入 summary 文本——块键
 *  label 的 textContent 匹配与既有折叠测试零干扰；点击不触发 details 折叠翻转）。 */
export function updateBlockStopButtons(role, id, running) {
  eachSubBlock(role, id, (block) => {
    const btn = block.querySelector(".sub-stop-btn")
    if (running && !btn) {
      const b = document.createElement("button")
      b.className = "sub-stop-btn"
      b.type = "button"
      b.dataset.subId = String(id)
      b.dataset.subRole = role
      b.textContent = "⏹"
      b.title = t("sub.stopBtn") || "Stop this subagent"
      block.appendChild(b)
    } else if (!running && btn) {
      btn.remove()
    }
  })
}

/** ⟦ev⟧stopped 冻结相位（D-M6 cancelled settle → webview 端）：折叠 + ⏹ 移除 +
 *  标题行 stopped 标记（CLI 冻结标题 parity——区块保留可展开）。 */
export function freezeStoppedBlocks(role, id) {
  eachSubBlock(role, id, (block) => {
    block.open = false
    block.querySelector(".sub-stop-btn")?.remove()
    const summary = block.querySelector("summary")
    if (summary && !summary.querySelector(".sub-stopped")) {
      const tag = document.createElement("span")
      tag.className = "sub-stopped"
      tag.textContent = " · " + (t("sub.stopped") || "stopped")
      summary.appendChild(tag)
    }
  })
}

/** subagent message: track lifecycle; collapse activity blocks on terminal state. */
export function handleSubagentMessage(m) {
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
    S._subagentMap[m.id] = { role: m.role, status: "started", startedAt: m.startedAt || Date.now(), tool: null, model: m.model ?? null, pool: !!m.pool }
    // §19.5 D-M7: 仅池条目（async spawn——m.pool——cancel 路由可达）的块挂 ⏹；同步
    // spawn 的 started 无 pool 标记——不挂（无效 ⏹——审计 F1）。块创建时也已按行态装过
    // （streaming.js）——此处覆盖消息乱序/历史场景。
    if (m.pool) updateBlockStopButtons(m.role, m.id, true)
  } else {
    const s = S._subagentMap[m.id]
    if (s) { s.status = m.status; s.doneAt = Date.now(); if (m.error) s.error = m.error; if (m.replyPreview) s.replyPreview = m.replyPreview }
    // §19.5: ⏹ 在任何非 running 终态/冻结态消失（T-M23——done/冻结后不残留）。
    if (m.role !== "consult") updateBlockStopButtons(m.role, m.id, false)
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
    // §19.5 ⟦ev⟧stopped（D-M6 cancelled settle → 冻结相位）：区块以 interrupted 语义
    // 冻结——折叠 + 标题 stopped 标记（T-M22/T-M23 webview 断言）。
    // §20 D-SD3b：cancelled 带 was:"queued" = queued 取消（从未启动——无活动块可冻结）
    // → 行移除（不留 stopped 残行——CLI waiting 块移除同语义）。
    if (m.role !== "consult" && m.status === "cancelled") {
      if (m.was === "queued") {
        delete S._subagentMap[m.id]
      } else {
        freezeStoppedBlocks(m.role, m.id)
      }
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
    S._suspCounts = { running: m.running ?? 0, queued: m.queued ?? 0, pending: m.pending ?? 0, done: m.done ?? 0 }
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

/** goal message: refresh the goal panel + status badge. */
export function handleGoalMessage(m) {
  S._goalInfo = m
  renderGoalPanel()
  renderStatusBar()
}
