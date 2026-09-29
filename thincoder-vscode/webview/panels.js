/**
 * panels.js — side panels: task progress, goal + suspension message handlers
 * and the subagent/turnState bridge routing.
 * SESSION-ACTIVITY-REVISED（行面板撤除）→ ACTIVITY-REWRITE-SIMPLE（2026-09-09）→
 * 活动区收口（2026-09-12——WEBVIEW.md §14）：簿记段全删——handleSubagentMessage 纯转发
 * applySubagentStatus；挂起退出 freeze 兜底保留（freezeLiveBlocks——区全体归档——§14 C-8）；
 * `_panelTimer` 同点刷 live 块头（§14 C-11④）。
 * R2 换接：面板**构树 + 显隐判据**单源 = 核包 `cards/panel.mjs`；本档留端 = 挂起 / 回合态 /
 * 目标消息分流与 DOM 写入（`replaceChildren` / `style.display`）。
 */
import { ctx, S } from "./state.js"
import { setLoading } from "./loading.js"
import { renderStatusBar } from "./status-bar.js"
import { applySubagentStatus, freezeLiveBlocks, refreshLiveHeaders } from "./activity.js"
import {
  taskPanelVisible, goalPanelVisible, renderTaskPanel as taskPanelFragment, renderGoalPanel as goalPanelFragment,
} from "../node_modules/@thincoder/render-core/cards/panel.mjs"

export function renderTaskPanel() {
  const panel = document.getElementById("task-panel")
  if (!taskPanelVisible(S._taskProgress, panel.style.display === "block")) {
    // 空 items ⇒ 隐；全完成且未显示 ⇒ 不动（badge 已表达 ✓N/N——不新示亦不擦既有内容）
    if (!S._taskProgress?.items?.length) panel.style.display = "none"
    return
  }
  panel.replaceChildren(taskPanelFragment(S._taskProgress, { shown: true }).el)
  panel.style.display = "block"
}

export function renderGoalPanel() {
  const panel = document.getElementById("goal-panel")
  if (!goalPanelVisible(S._goalInfo)) { panel.style.display = "none"; return }
  panel.replaceChildren(goalPanelFragment(S._goalInfo).el)
  panel.style.display = "block"
}

export function clearPanels() {
  // 活动块不由本函数重置（resetActivity 由回合中止/clearMessages 驱动）——只隐 goal/task。
  S._goalInfo = null
  S._taskProgress = null
  S._taskStatus = null
  document.getElementById("goal-panel").style.display = "none"
  document.getElementById("task-panel").style.display = "none"
}

// 状态行 elapsed 刷新（保留运行期驱动：usage/toolCall 消息之间有长工具批——elapsed 段
// 不得冻结）+ live 块头刷新（§14 C-11④——**不设运行态门**：`_turnState` 为 `susp` 的
// 纯池跑主场景照刷；无 live 块 = 零操作；renderStatusBar 维持既有 running 门不变）。
// 拍值 2s ⇒ **1s**（停滞轻显形批 2026-09-29——静默读数跳秒 1s 步进；单源 = `docs/cli/design/TUI.md` §7.7；
// 定时器**恒启**——`running` 门只作用状态行重挂 ⇒ 无子代理块的在飞回合照有帧）。
const _panelTimer = setInterval(() => {
  refreshLiveHeaders()
  if (S._turnState === "running") renderStatusBar()
}, 1000)
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

// ─── 桥消息路由：簿记 map 已删（ACTIVITY-REWRITE-SIMPLE——块 meta 事件字段自足——
// 生命周期与头词全在 activity.js）——本文件只管状态行刷新 + 挂起态。

/** subagent message: 纯转发——块侧效果全委 activity.js applySubagentStatus（queued
 *  等待头/started 翻 running/终态折叠——三态机）。 */
export function handleSubagentMessage(m) {
  applySubagentStatus(m)
}

/** AGENT-LOOP-ASYNC-POOL.md §6.8 D-S2/D-S8: the suspension-session message from the host — activates the
 *  background mode (input stays usable; Stop 语义 = susp 纯池跑不显——子代理停止靠逐块
 *  ⏹——无全停——池空自然消化完), updates the status-line counts, and on session exit
 *  archives the whole activity region into the conversation (CLI freezeAllSubTasks
 *  parity —— 无 digest 消费、不留悬空块；§14 C-8：live → 折叠、awaitingDigest → 归档）。 */
export function handleSuspensionMessage(m) {
  S._suspended = !!m.active
  if (m.active) {
    S._suspCounts = { running: m.running ?? 0, queued: m.queued ?? 0, pending: m.pending ?? 0, done: m.done ?? 0 }
  } else {
    S._suspCounts = null
    // X11（显示面消差批 §2.2）：`interrupted` = 会话中止事实（宿主 finally 判定）⇒ 未冻结块
    // 补 `— interrupted` 注记；缺省/false ⇒ 自然退出零注记（不伪造）。
    if (m.freeze) freezeLiveBlocks(m.interrupted === true)
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
