/**
 * settings-modal.mjs — 设置组弹窗**宿主**（D39 ∥ D38 · 2026-10-02 · 台账 #817；决策单源 = `docs/desktop/design/SETTINGS.md`
 * §1 **KD-68**）：单例弹层（背板 + 居中卡 —— 挂 `document.body`，沿 `renderer/settings-confirm.mjs` 先例）+ 建 ∕ 刷
 * ∥ 关三件。树面住 `renderer/views/settings.mjs` `settingsModalTree`（本档同名 re-export —— 单源单份，零第二实现；
 * 三关 handler（背板 ∥ ✕ ∥ 卡内 Esc）在树面；Esc 拦截 = `stopPropagation` ⇒ 不连带触 F-Esc 闸（页保持开））。
 *   ① **刷新 = 换卡**（卡根整体替换 —— 组名面 ∥ 内容 ∥ 属性（`aria-label`）随新树；卡片根捕获 ∕ 复填归装配面
 *      「第二闸」（`renderer/mount-settings.mjs`），卡根读面 = `settingsModalNode`）；背板首挂一次（其 handler 无内容依赖）。
 *   ② **初始焦点 = ✕**（+50ms —— 沿确认件先例：`setTimeout(() => face?.card.querySelector?.(".settings-close")?.focus?.(), 50)`）；
 *      零焦点陷阱（边界 —— 沿确认件 ∥ 现状；Tab 可出卡）。
 *   ③ **关 = 两件同清 + 子确认层同清**（`closeSettingsConfirm` —— 弹窗退场 ⇒ 叠于其上的删除确认同清；沿
 *      `closeSettings` 同形）；无弹窗 ⇒ 零动作。宿主缺 `append` 面 ⇒ 记错零动作（零静默 —— 沿确认件同形）。
 * 纪律：零 `node:` ∕ 零裸包（渲染面静态闭包判据）；DOM 构造唯一 = `dom.mjs` `build`。
 */
import { build } from "./dom.mjs"
import { closeSettingsConfirm } from "./settings-confirm.mjs"
import { settingsModalTree } from "./views/settings.mjs"

// 树面 re-export（单源 = `views/settings.mjs`；宿主文件导出面同姓名 —— 消费面两处可取，零第二实现）。
export { settingsModalTree }

/** 现态弹框（宿主 → `{ backdrop, card }`；单例 —— 同刻至多一框）。 */
let face = null

/** 现卡根（装配面第二闸捕获 ∕ 在途判据面）：无弹窗 ⇒ `null`。 */
export function settingsModalNode() {
  return face === null ? null : face.card
}

/** 挂 ∕ 刷（单例）：`tree = null` ⇒ 退场清件（返回 `null`）；否则首挂建两件（背板 + 卡，初始焦点 = ✕）∕
 *  刷新换卡（`replaceWith` —— 保 DOM 位序于背板之后）；返回卡根（复填面）。 */
export function renderSettingsModal(tree) {
  if (tree === null || tree === undefined) {
    closeSettingsModalHost()
    return null
  }
  const body = typeof document !== "undefined" ? document.body ?? document.documentElement : null
  if (body === null || typeof body.append !== "function") {
    console.error("[renderer] settings modal: overlay host unavailable")
    return null
  }
  const card = build(tree.card)
  if (face === null) {
    const backdrop = build(tree.backdrop)
    body.append(backdrop)
    body.append(card)
    face = { backdrop, card }
    setTimeout(() => { face?.card.querySelector?.(".settings-close")?.focus?.() }, 50)
  } else {
    face.card.replaceWith(card)
    face.card = card
  }
  return card
}

/** 关（单例）：两件同清 + 子确认层同清；无弹窗 ⇒ `false`（零动作）。 */
export function closeSettingsModalHost() {
  if (face === null) return false
  face.card.remove()
  face.backdrop.remove()
  face = null
  closeSettingsConfirm()
  return true
}
