/**
 * plan.mjs — 计划卡面（`docs/desktop/design/UI.md` §1 计划面行）：**核件直消费 + 端壳**
 * （「桌面处理流 · VSC 对齐」批 R1 #3 · KD-F1）——面板体与**显隐判据**单源 = 核包 `cards/panel.mjs`
 * （`renderTaskPanel` / `taskPanelVisible` —— VSC ∕ 桌面同一文件；VSC 壳 = `webview/panels.js:15-17`）。
 *   **纯呈现 · 零出口**（`ev:task` 消费 —— 挂载面 = `thincoder-desktop/renderer/mount-cards.mjs`）。
 *   ① 核 `renderTaskPanel(progress, { shown })` ⇒ `{ el, visible }` 两态：`visible` 真 ⇒ 端以核体元素装卡
 *      （卡根 = 端壳装饰 `div.plan-card[data-card="task"]` —— 核体为 `DocumentFragment`，无根元素可挂锚）；
 *      假 ⇒ `null`（**卡不在场** —— 零节点 · 零擦除）；
 *   ② **可见判据随核**（① 消除 —— 与 VSC 同）：无 items ⇒ 不显示；全 done 且当前**未显示** ⇒ 不新示
 *      （badge 已表达 ✓N/N）；全 done 且**已在显示** ⇒ 照常重渲（`shown` = 挂载面现读）；其余 ⇒ 显示；
 *   ③ **同 key 就地替换**（同回合同 key 新载荷整卡替换，不叠卡）—— 归挂载面帧内幂等（等值 ⇒ 零 DOM 写）。
 * 核体内文案经核 i18n（`panel.taskDesc` / `task.in_progress` —— 值 = VSC locales 逐字）；本档零文案。
 */
import { renderTaskPanel } from "/rc/cards/panel.mjs"

/** 切片形归一（端壳适配 —— 核卡入参形 = `{ items, … }` 载体；桌面 `tasks` 切片 = **items 数组**
 *  （写者 = `renderer/questions.mjs` `onTask`：`tasks[key] = ev.items`；同源读面 = `views/statusline.mjs`
 *  `Array.isArray(list)` 直读 · `renderer/page-read.mjs` 页读播种同形））：数组 ⇒ `{ items: list }`；
 *  载体形（已含 `items`）直通；余 ⇒ 原样交核（核判据自持「无 items ⇒ 不显示」——禁假造）。 */
function progressOf(slice) {
  return Array.isArray(slice) ? { items: slice } : slice
}

/** 计划卡（核体直取 + 端壳装饰）：`progress` = `ev:task` 载荷（**items 数组**或载体形 —— 本档归一）；
 *  `shown` = 本卡当前是否在显示（挂载面现读 —— 判据输入面；缺省 `false` = 未示）。不可见 ⇒ `null`（卡不在场 —— 零节点）。 */
export function planCardNode(progress, { shown = false } = {}) {
  const { el, visible } = renderTaskPanel(progressOf(progress), { shown })
  if (visible !== true || el === null || el === undefined) return null
  const card = document.createElement("div")
  card.className = "plan-card"
  card.setAttribute("data-card", "task")
  card.append(el)
  return card
}
