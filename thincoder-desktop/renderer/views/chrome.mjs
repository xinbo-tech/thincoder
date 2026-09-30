/**
 * chrome.mjs — 中区外壳留守面（`docs/desktop/design/UI.md` §1 布局行 · `docs/desktop/design/RENDERER.md` §1.1 ·
 * `docs/desktop/design/PROJECT.md` §4.2 状态行族档）：状态行三再出口 + 位标词键表 + 忙态 ∕ 挂起窗两判据。
 *   ① 状态行：语义单源 = `renderer/views/statusline.mjs`（D17 / D22 · 承载段构树 + 薄挂载）；本档**同名再出口**
 *      （`statusModel` / `statusTree` / `mountStatus` —— 消费面零改）。
 *   ② 位标词键表 `BADGE_WORD`（码 → 词键 —— 单一持有点）：两消费面 = 会话控制条目位标（`renderer/mount-sessions.mjs`）
 *      ∕ 状态行跨会话告警位（`renderer/views/statusline.mjs`）—— 同源同词（词键沿 `tab.badge.*` 族）。
 *   ③ 忙态 ∕ 挂起窗两判据（`busyOf` / `suspActiveOf`）—— 消费面逐件见函数注。
 * 零 `node:` / 零裸包（渲染面静态闭包判据）。
 */
// 同名 re-export（消费面零改 —— 导入路径与名面保持；语义单源 = 状态行族档）。
export { mountStatus, statusModel, statusTree } from "./statusline.mjs"

/** 位标词键表（码 → 词键 —— 单一持有点，两消费面同引）：`approval` = 宿主新键（核无审批词条 —— KD-c）；
 *  `running` / `done` = 核状态词族键（词形单源）；`idle` **无词条**（零节点）。会话模型轮 R13：标签条面裁撤
 *  退场 ⇒ 本表迁入本档（两消费面 = 会话控制条目位标 ∕ 状态行告警位）。 */
export const BADGE_WORD = Object.freeze({
  approval: "tab.badge.approval",
  running: "sub.running",
  done: "sub.done",
})

/** 忙态判据（P23 —— 本会话位标含 `running`；与输入区忙态同式 —— `renderer/mount-composer.mjs` `isBusy`，两面各持一份
 *  同形判据，避免跨面向下依赖）。 */
export function busyOf(state, key) {
  const codes = key === null || key === undefined ? null : state?.tabBadges?.[key]
  return Array.isArray(codes) && codes.includes("running")
}

/** 挂起窗判据（「消费前流内零块」批 · 挂起窗径批 ∥ 窗队列批）：本键挂起窗活跃（`ev:susp` 置位标）。
 *  两消费面同源：出泡抑制面（`renderer/mount-composer.mjs` `onUserEcho` 判据 = `busyOf ∨ 本件`）· 忙态域
 *  `susp` 支（`renderer/composer-sync.mjs` `turnState` 改用本件——零行为变，消重复直读）。 */
export function suspActiveOf(state, key) {
  return key === null || key === undefined ? false : state?.susp?.[key]?.active === true
}
