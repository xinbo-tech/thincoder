/**
 * goal.mjs — 目标卡面（R5 · 桌面功能对位批 · B10；`docs/desktop/design/UI.md` §1 状态栏行 ∕ 目标面板行）：
 * **核件直消费 + 端壳**（单源 = 核包 `cards/panel.mjs` `renderGoalPanel` / `goalPanelVisible` —— VSC ∕ 桌面
 * 同一文件；VSC 壳 = `webview/panels.js:30-35`）。**纯呈现 · 零出口**（`goal` 切片消费 —— 挂载面 =
 * `renderer/mount-cards.mjs`；写者 = 归约面 `ev:goal`）。
 *   ① 核 `renderGoalPanel(goal)` ⇒ `{ el, visible }` 两态：`visible` 真 ⇒ 端以核体元素装卡（卡根 = 端壳装饰
 *      `div.goal-card[data-card="goal"]` —— 核体为 `DocumentFragment`，无根元素可挂锚）；假 ⇒ `null`
 *      （**卡不在场** —— 零节点 · 零擦除）；
 *   ② **可见判据随核**（① 消除 —— 与 VSC 同）：`goalPanelVisible(goal)` = 非空 ⇒ 显示；
 *   ③ **状态行 🎯 徽标在场判据**（#7 —— VSC `status-bar.js:24` 同判）：核可见判据 ∧ `status === "active"`
 *      （`done` ∕ `blocked` ∕ `cancelled` ⇒ 零徽标；词面零改 —— 状态词由核体直出）。
 * 核体内文案经核 i18n（`panel.goalDesc` / `goal.objective` / `goal.criteria` —— 值 = VSC locales 逐字）；
 * 本档零文案。零 `node:` / 零裸包。
 */
import { goalPanelVisible, renderGoalPanel } from "/rc/cards/panel.mjs"

/** 目标卡（核体直取 + 端壳装饰）：`goal` = `goal` 切片记录（`{ status, objective, criteria }` —— 宿主桥按
 *  核 `agent.goal` 单源投影）；不可见 ⇒ `null`（卡不在场 —— 零节点）。 */
export function goalCardNode(goal) {
  const { el, visible } = renderGoalPanel(goal)
  if (visible !== true || el === null || el === undefined) return null
  const card = document.createElement("div")
  card.className = "goal-card"
  card.setAttribute("data-card", "goal")
  card.append(el)
  return card
}

/** 🎯 徽标在场判据（状态行**非段位元素** —— R5 · 修正 1 定形①：不入 `STATUS_SEGMENTS` 闭集）：
 *  核判据直取（`goalPanelVisible`）∧ `active` 态门（VSC `status-bar.js:24` 同判）；非载体 ∥ 他态 ⇒ `false`
 *  （零节点 —— 禁假造）。 */
export function goalBadgeVisible(goal) {
  return goalPanelVisible(goal) && goal?.status === "active"
}
