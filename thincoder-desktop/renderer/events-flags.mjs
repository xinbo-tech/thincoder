/**
 * events-flags.mjs — 模式位切片归约出档（输入面板上提批 `2026-09-28-desktop-input-vsc-align.md` §2.4 Q8 ∕
 * §2.7 拆档计划「裁定②本批承接」）：三件自 `renderer/events.mjs` 迁入 —— 该档 498 行距 500 硬限余 2，
 * 新增 `ev:flags` 归约须先出档（出档 = 硬需求，非预案）。
 *
 * 面（迁入面语义零变）：
 *   ① `applyFlags(state, key, flags)`——模式位切片写**纯动作**（状态栏对齐批：页读径 `renderer/page-read.mjs`
 *      ∕ 出站回执 `renderer/mount-pool.mjs` ∕ 本批 `session:flags` 回执三径同点；`flags` 非载体 ⇒ 零写）；
 *   ② `sameRecord(a, b)`——读数同值判（浅比；`events.mjs` 四读数槽 ∕ 页读径两处共用 —— 单一实现零副本，
 *      故随本档同迁并原位 re-export）；
 *   ③ `onFlags(state, ev)`——`ev:flags` 归约（**本批承接新面**）：载荷 `{ key, flags }`（宿主产 —— 工具驱动
 *      翻转 ∕ `session:flags` 写回执后），`flags` 形判与逐项布尔门 = `applyFlags` 同源（零第二判据）。
 *
 * 依赖单向：本档零外引（`events.mjs` 反向引本档三件 + re-export 两件保名面）——无环。
 * 纪律：零 DOM / 零 IPC（平 node 直测）；文案零硬编码（本档不出词）。
 */

/** 模式位载荷键白名单（回执 `flags` 四布尔 —— `docs/desktop/design/IPC.md` §2「模式位投影注」项 2 四键）。 */
const FLAG_FIELDS = ["planMode", "autoApprove", "advisorGuard", "engineering"]

/** 对象读数同值判（浅比 —— 键数 + 逐键 `Object.is`）：读数槽同值 ⇒ 原引用（零重绘）。
 *  **共用件**：页读径 `applyFlags`（`renderer/page-read.mjs`）与归约面读数槽（`renderer/events.mjs`）同引 —— 单一实现零副本。 */
export function sameRecord(a, b) {
  if (a === null || typeof a !== "object" || b === null || typeof b !== "object") return false
  const keys = Object.keys(a)
  if (keys.length !== Object.keys(b).length) return false
  return keys.every((key) => Object.is(a[key], b[key]))
}

/** 模式位切片写（**纯动作** —— 状态栏对齐批 · `docs/desktop/design/IPC.md` §2「模式位投影注」项 4/5）：
 *  页读（`renderer/page-read.mjs` `applyPage`）· 出站回执（`renderer/mount-pool.mjs` `submitVerdict`）·
 *  `session:flags` 回执（`renderer/mount-composer.mjs`）**三径同点** —— 切片变 ⇒ 状态行重挂。
 *  `flags` 缺席 / 非载体 ⇒ **零写**（禁假造）；逐项只收严格布尔（非布尔 ⇒ 该键不落）；同值 ⇒ **原引用**（零重绘）。 */
export function applyFlags(state, key, flags) {
  if (flags === null || typeof flags !== "object" || Array.isArray(flags)) return state
  if (typeof key !== "string" || key === "") return state
  const record = {}
  for (const field of FLAG_FIELDS) if (typeof flags[field] === "boolean") record[field] = flags[field]
  const table = state.sessionFlags ?? {}
  if (sameRecord(table[key], record)) return state
  return { ...state, sessionFlags: { ...table, [key]: record } }
}

/** `ev:flags` 归约（本档承接面）：写者单源 = `applyFlags`（形判 ∕ 布尔门 ∕ 同值短路三面同源）。
 *  主档 `renderer/events.mjs` `reduce` 分派一行（`:case "ev:flags"`——注册面）；本档零分派表。 */
export function onFlags(state, ev) {
  return applyFlags(state, ev?.key, ev?.flags)
}
