/**
 * theme.mjs — 主题三态面（D33 · 2026-09-30 · 台账 #743）：**chrome 级状态直写**（渲染面 ∥ 零 IPC ∥ 零 `events` 依赖；
 * 机制单源 = `docs/desktop/design/PROJECT.md` §2 KD-61 ∥ `docs/desktop/design/RENDERER.md` §1.4 ∥ `docs/desktop/design/UI.md` §1 本批注）。
 * 状态载体 = `documentElement` 的 `data-theme`（闭集 `system` ∥ `light` ∥ `dark`——缺省 ∥ 存储缺 ∥ 表外值 ⇒ `system`）；
 * 单写者 = 本档（`initTheme` 装配期一次 ∥ `setTheme` 出口径 —— `data-theme` 写径全仓仅此一处；同步直写不经帧）；
 * 「跟随系统」= 状态值一枚（非零态 —— 值面随系统解析，深浅翻转零 JS）。
 * 持久化 = 渲染面 `localStorage`（键 `thincoder.desktop.theme`——三值闭集串；端自有 UI 态类，先例 = `poolWidth`）：
 * 读 = 装配期一次（先于首绘可及面）∥ 写 = 每次点按即刻；读 ∥ 写皆捕获 + `console.error`（零静默）——
 * 读失败 ∥ 存储缺 ∥ 表外值 ⇒ `system`（降级，零写回）；写失败 ⇒ 本次会话内照常生效（fail-soft）。
 * 注入缝 `{ doc, storage }`（缺省 = `document` / `localStorage`）⇒ 平 node 直测；零 `store` ∥ 零 `events` 依赖；
 * 零 `node:` / 零裸包（渲染面静态闭包判据）。
 */

/** 存储键（KD-61 ④ · 三值闭集串）。 */
const KEY = "thincoder.desktop.theme"

/** 三态闭集（**序 = 控件序单源**：跟随系统 ∥ 亮色 ∥ 暗色 —— 缺省态居首；表外值 ⇒ `system`）。 */
export const THEMES = Object.freeze(["system", "light", "dark"])

/** 缺省存储（浏览器 `localStorage`；桌面 `app://` standard+secure ⇒ Web Storage 持久）。
 *  取面缺位 ∥ 访问抛 ⇒ `null`（视同无存储 —— fail-soft，零外写）。 */
function defaultStorage() {
  try {
    return globalThis.localStorage ?? null
  } catch (error) {
    console.error("[theme] localStorage unavailable:", error)
    return null
  }
}

/** 值归一（纯函数）：闭集内 ⇒ 原值；其余（缺 ∥ 非串 ∥ 表外）⇒ `system`。 */
function normalize(raw) {
  return THEMES.includes(raw) ? raw : "system"
}

/** 读存储（捕获 + 零静默）：缺 storage / 读抛 ⇒ `null`（降级 `system`）；表外值 ⇒ `null` + 记错（零静默，零写回）。 */
function readStored(storage) {
  if (!storage || typeof storage.getItem !== "function") return null
  try {
    const raw = storage.getItem(KEY)
    if (raw === null || raw === undefined) return null
    if (!THEMES.includes(raw)) {
      console.error(`[theme] stored value out of range: ${String(raw)}`)
      return null
    }
    return raw
  } catch (error) {
    console.error("[theme] theme read failed:", error)
    return null
  }
}

/** 写存储（捕获 + 零静默 —— fail-soft：写失败仅记错，本次会话内照常生效）。 */
function writeStored(storage, value) {
  if (!storage || typeof storage.setItem !== "function") return
  try {
    storage.setItem(KEY, value)
  } catch (error) {
    console.error("[theme] theme write failed:", error)
  }
}

/** 状态应用（**唯一写径**）：`documentElement` 的 `data-theme` 落地 —— 同步直写（不经帧）。 */
function applyTheme(doc, value) {
  doc.documentElement.dataset.theme = value
}

/** 装配入口（`renderer/app.mjs` 装配期一次）：读存储 ⇒ 归一 ⇒ 写 `data-theme` ⇒ 返落地值（先于首绘可及面）。
 *  读失败 ∥ 存储缺 ∥ 表外值 ⇒ `system`（降级）；**零写回**（未切过 ⇒ 存储零动）。 */
export function initTheme({ doc = globalThis.document, storage = defaultStorage() } = {}) {
  const value = normalize(readStored(storage))
  applyTheme(doc, value)
  return value
}

/** 出口（设置面三态钮 ⇒ 本径）：三值闭集校验 ⇒ 应用 + 落存储 ⇒ 返落地值；表外值 ⇒ `null` + 记错（零写零改）。 */
export function setTheme(value, { doc = globalThis.document, storage = defaultStorage() } = {}) {
  if (!THEMES.includes(value)) {
    console.error(`[theme] setTheme refused out-of-range value: ${String(value)}`)
    return null
  }
  applyTheme(doc, value)
  writeStored(storage, value)
  return value
}
