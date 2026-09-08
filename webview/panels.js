/**
 * panels.js — side panels: task progress, goal + suspension message handlers
 * and the subagent/turnState bridge routing.
 * SESSION-ACTIVITY-REVISED（2026-09-09——F-3 行面板撤除——D-3 方案 A）：行面板 DOM 渲染
 * 面全删（queued/consult 载荷迁活动区：queued = 区内等待块头；consult = sub: 频道块 +
 * 冻结块 preview；👥 计数由状态行 _suspCounts 承担——autoClean linger 迁区内块生命周
 * 期——冻结块落流即永久可见）。S._subagentMap/handleSubagentMessage 状态簿记保留——
 * 供 activity.js 块 meta 水合（rowFor：model/pool/startedAt——freezeSettledBlocks 按
 * settled 行定位块）。
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
  // SESSION-ACTIVITY-REVISED: 活动块不由本函数重置（send/队列时间——live children 的
  // 块必须保留——resetActivity 由回合中止/clearMessages 驱动）；行面板元素已撤——只隐 goal/task。
  S._subagentMap = {}
  S._goalInfo = null
  S._taskProgress = null
  S._taskStatus = null
  document.getElementById("goal-panel").style.display = "none"
  document.getElementById("task-panel").style.display = "none"
}

// 状态行 elapsed 刷新（原 autoCleanPanels 2s 间隔随行面板撤除而收缩——保留运行期
// 驱动：usage/toolCall 消息之间有长工具批——elapsed 段不得冻结）。行簿记 linger 清理
// 已迁区内块生命周期（冻结落流——无需行级 autoClean）。
const _panelTimer = setInterval(() => { if (S._turnState === "running") renderStatusBar() }, 2000)
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

// ─── 桥消息路由：行面板 DOM 渲染已撤（SESSION-ACTIVITY-REVISED F-3）——簿记 map 与
// 活动块生命周期分离：本文件只管 _subagentMap 簿记（供块 meta 水合）+ 状态行刷新。

/** subagent message: 簿记更新（行面板撤后无行渲染——map 仍供 activity.rowFor 水合：
 *  family 行 id 键控；consult 行携 sessionId+model）；块侧效果委托 activity.js
 *  applySubagentStatus（D-4 queued 建区内等待块头 / freeze 落流锚 / settled 驻留区）。 */
export function handleSubagentMessage(m) {
  // Block-side effects FIRST (independent of the row bookkeeping below — a
  // chunk-only block without a row still freezes correctly).
  applySubagentStatus(m)
  if (m.status === "queued") {
    // §20 D-SD3b：排队 spawn 簿记（spawn 返回即见——queue 位置/waiting 标注只经
    // applySubagentStatus 直接取自消息进块头——簿记不存——防双源漂移——评审 🔵）。
    // 重复 queued 消息覆盖式更新；启动（started）后转 running；cancelled
    // （was:"queued"）移除簿记（不冻结——从未启动无冻结块）。
    const prev = S._subagentMap[m.id]
    S._subagentMap[m.id] = {
      role: m.role, status: "queued", startedAt: prev?.startedAt ?? Date.now(),
      model: null, pool: false,
    }
    return
  }
  if (m.status === "started") {
    S._subagentMap[m.id] = { role: m.role, status: "started", startedAt: m.startedAt || Date.now(), model: m.model ?? null, pool: !!m.pool, sessionId: m.sessionId ?? null }
    return
  }
  const s = S._subagentMap[m.id]
  if (s) { s.status = m.status; s.doneAt = Date.now(); if (m.error) s.error = m.error; if (m.replyPreview) s.replyPreview = m.replyPreview }
  // §20 D-SD3b：cancelled 带 was:"queued" = queued 取消（从未启动——无活动块可冻结）
  // → 簿记移除（不留 stopped 残行——CLI waiting 块移除同语义）。
  if (m.status === "cancelled" && m.was === "queued") {
    delete S._subagentMap[m.id]
  }
}

/** §17 D-S2/D-S8: the suspension-session message from the host — activates the
 *  background mode (input stays usable; Stop 语义 = SESSION-ACTIVITY-REVISED F-6——
 *  susp 纯池跑不显 Stop——子代理停止靠活动区逐块 ⏹——无全停——池空自然消化完), updates
 *  the status-line counts, and on session exit freezes the settled blocks into the
 *  conversation at their settle anchors (CLI freezeAllSubTasks parity — "done ·
 *  awaiting digestion" 驻留块落流折叠；报告 preview 随块入流）。 */
export function handleSuspensionMessage(m) {
  S._suspended = !!m.active
  if (m.active) {
    S._suspCounts = { running: m.running ?? 0, queued: m.queued ?? 0, pending: m.pending ?? 0, done: m.done ?? 0 }
  } else {
    S._suspCounts = null
    if (m.freeze) {
      // SESSION-ACTIVITY-REVISED F-4 兜底：区内 settled 驻留块按 settle 锚落流冻结
      // （done 形态——✓ 身份头 + preview——插 digest 报告前/锚被裁尾推退化——
      // freezeSettledBlocks 按 settled 行定位块——顺序先行）。
      freezeSettledBlocks()
      for (const [id, s] of Object.entries(S._subagentMap)) {
        if (s.status !== "settled") continue
        s.status = "done"
        s.doneAt = Date.now()
      }
    }
    // §20 D-SD3b：会话退出时移除残留 waiting 簿记（queued——池空/清池后无对应条目——
    // CLI freezeAllSubTasks 兜底清场的 webview 等价；自然退出池空本就无 queued 行——
    // no-op）。
    for (const id of Object.keys(S._subagentMap)) {
      if (S._subagentMap[id].status === "queued") delete S._subagentMap[id]
    }
  }
  renderStatusBar()
  // Re-derive send/abort button visibility from the current loading state —
  // 进出挂起刷新输入/按钮态（Stop 可见性本身 = S._turnState==="running" 派生——
  // loading.js——susp 不显——F-6）。
  setLoading(ctx, ctx.isRunning)
}

/**
 * C2 (SESSION-FLOW-C F-C2b/F-C2e——webview 单一 reducer) → F-6（SESSION-ACTIVITY-
 * REVISED——Stop running 派生——评审 #1）: {type:"turnState", state, counts?} —— host
 * _publishTurnState 单一广播的镜像侧。更新 S._turnState（idle/running/susp——
 * 派生：Stop 只在 running 显——susp 纯池跑不显——无全停——池空自然消化完；busy 判断）；
 * counts（host backgroundStatus 形 {running,queued,pending,done}——digest 间重发/
 * settle 触发点随广播到达）刷新 _suspCounts——webview 计数 = host 实际不陈旧。既有
 * _suspended 仍由 suspension 消息驱动（会话级语义不变）。每次广播后重绘状态行 + 重派
 * Stop 可见性。
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
