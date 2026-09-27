/**
 * panel.mjs — 任务 / 目标面板构件（核化 `webview/panels.js:16` / `:39` 的面板体与显隐判据——
 * 判定表 §3 行 27「拆」；§4 行 20 机制「计划 / 任务面板」）。挂起 / 回合态 / 目标消息分流与
 * DOM 写入（`panel.replaceChildren` / `style.display`）留端。
 *
 * 输出形态 = **DOM 构件**（KD-RC-3：DOM 构件 + 纯函数——端不经 innerHTML 注入，核内自组节点）；
 * 体 HTML 串为本件内部实现面（模板字面逐字承源档，含空白文本节点——DOM 逐字节对齐）。返回
 * `{ el: DocumentFragment|null, visible }`：`visible` 真 ⇒ 端接管 `el`（`replaceChildren`）并显示；
 * 假 ⇒ 端只隐藏（保留原内容——与源档「空 / 全完成不新示」同形，不擦既有内容）。
 * 显隐判据另导出为纯函数（`taskPanelVisible` / `goalPanelVisible`——平 node 直测面）。
 */
import { esc as escHtml } from "../md.mjs"
import { t as coreT } from "../i18n.mjs"

/** 任务面板显隐判据（纯函数——承 `panels.js:18-26`）：无 items ⇒ 不显示；全 done 且当前未显示
 *  ⇒ 不新示（badge 已表达 ✓N/N）；全 done 且已在显示 ⇒ 照常重渲。 */
export function taskPanelVisible(progress, shown = false) {
  const items = progress?.items
  if (!items || items.length === 0) return false
  const allDone = items.every((item) => item.status === "done")
  if (allDone && shown !== true) return false
  return true
}

/** 目标面板显隐判据（纯函数——承 `panels.js:41`）：`goal` 空 ⇒ 不显示。 */
export function goalPanelVisible(goal) {
  return !!goal
}

/** 任务面板体 HTML（内部面——逐字承 `panels.js:28-36`）；`progress` = taskProgress 消息
 *  （`{ items, total, … }`）。 */
function taskPanelHtml(progress, t) {
  const icons = { pending: "○", in_progress: "◉", done: "✓" }
  return `<div class="panel-desc">${t("panel.taskDesc") || "Tracks multi-step work — created and updated by the agent"}</div>` +
    progress.items.map((item) =>
    `<div class="task-item">
      <span class="task-mark">${icons[item.status] || " "}</span>
      <span class="task-title">${escHtml(item.title)}</span>
      <span class="task-status">${item.status === "in_progress" ? t("task.in_progress") : item.status}</span>
    </div>`
  ).join("")
}

/** 目标面板体 HTML（内部面——逐字承 `panels.js:44-53`）。 */
function goalPanelHtml(goal, t) {
  const statusCls = goal.status === "active" ? "active" : goal.status === "done" ? "done" : "cancelled"
  return `<div class="panel-desc">${t("panel.goalDesc") || "Long-running objective — runs until complete or cancelled"}</div>
    <div class="goal-section">
    <div class="goal-label">${t("goal.objective")}</div>
    <div class="goal-value">${escHtml(goal.objective || "")}</div>
  </div>
  <div class="goal-section">
    <div class="goal-label">${t("goal.criteria")}</div>
    <div class="goal-value">${escHtml(goal.criteria || "—")}</div>
  </div>
  <span class="goal-status-badge ${statusCls}">${goal.status}</span>`
}

/** HTML 串 → DocumentFragment（零包裹层：子节点与 innerHTML 解析同构——含空白文本节点）。 */
function fragmentOf(html) {
  const tpl = document.createElement("template")
  tpl.innerHTML = html
  return tpl.content
}

/** 任务面板（`deps.shown` = 面板当前是否显示）。 */
export function renderTaskPanel(progress, deps = {}) {
  const t = deps.t ?? coreT
  if (!taskPanelVisible(progress, deps.shown === true)) return { el: null, visible: false }
  return { el: fragmentOf(taskPanelHtml(progress, t)), visible: true }
}

/** 目标面板。 */
export function renderGoalPanel(goal, deps = {}) {
  const t = deps.t ?? coreT
  if (!goalPanelVisible(goal)) return { el: null, visible: false }
  return { el: fragmentOf(goalPanelHtml(goal, t)), visible: true }
}
