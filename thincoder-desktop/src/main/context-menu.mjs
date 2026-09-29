/**
 * context-menu.mjs — 右键编辑菜单模板（复制面对齐批 · 需求 D27 · 单源 = `docs/desktop/design/UI.md` §1
 * 「本批注（复制面对齐 VSC · 2026-09-29）」项 1 ∕ `docs/desktop/design/PROJECT.md` §2 **KD-43**）：
 *   ① `contextMenuLabels(locale)` —— 文案四键现读（词面单源 = `renderer/i18n.mjs` `HOST_DICT` 两语；主进程
 *      直取渲染面宿主表之既有先例 = `src/main/attachments.mjs` —— 零第二词表）；语言经核归一（`zh-CN` ⇒ `zh`；
 *      缺 ∕ 空 ∕ 未知 ⇒ en），缺键回落键名自身（与渲染面 `t()` 同终态 —— 不静默变空串）。
 *   ② `contextMenuTemplate(params, labels)` —— 条目集随语境（`params` = `webContents` `context-menu` 事件载荷）：
 *      可编辑（`isEditable`）⇒ 剪切 ∕ 复制 ∕ 粘贴 ∕ 全选（序 = cut → copy → paste → selectAll）；
 *      非编辑 ∧ 选中（`selectionText` 非空）⇒ 复制 ∕ 全选；非编辑 ∧ 空选 ⇒ **空数组**（零菜单 —— 宿主不 popup）。
 * 行为 = Chromium role 四件（`cut` / `copy` / `paste` / `selectAll` —— 执行径 = 主进程 `webContents` 方法，
 * `contextIsolation` ∕ `sandbox` 下可用 —— 与既有键盘面 Ctrl+C/V 同径）；`enabled` 取 `params.editFlags` 对应值
 * （`canCut` / `canCopy` / `canPaste` / `canSelectAll` —— **缺键不禁用**：键缺席 = Electron 缺省可用）。
 * 文案 = 显式 `label`（**不采 role 默认文案** —— 实读 Electron v44.4.5 `menu-item-roles.ts`：默认文案 = 英文
 * 硬编码字面 ⇒ 直采即 en-only 债；本批只保新面两语随 `locale` 现读）。
 * 本档**纯面**（零 `electron` ∕ 零 `node:` ∕ 零模块态 ⇒ 平 node 直测：三语境条目集 ∕ `editFlags` 启用径 ∕
 * 两语词值）；落子（`context-menu` 事件 + `Menu.popup`）住 `src/main/window.mjs`；与同档 `buildMenu()` 两事不混
 * （应用菜单 = `win.setMenu` 固定组；右键菜单 = 每弹独立模板）。链接 ∕ 图片类条目**不落**（D27 射程外）。
 */
import { normalizeLocale } from "@thincoder/core/i18n.mjs"
// 词面单源：渲染面词表（主进程直取宿主表；零第二词表 —— 先例 = `src/main/attachments.mjs`）。
import { FALLBACK_LOCALE, HOST_DICT } from "../../renderer/i18n.mjs"

/** 词表键（键名登记面 = `renderer/i18n.mjs` `HOST_DICT`）：en = Cut ∕ Copy ∕ Paste ∕ Select All ∥ zh = 剪切 ∕ 复制 ∕ 粘贴 ∕ 全选。 */
const LABEL_KEYS = Object.freeze({ cut: "menu.edit.cut", copy: "menu.edit.copy", paste: "menu.edit.paste", selectAll: "menu.edit.selectAll" })

/** 条目表（role = 行为面 ∕ flag = `editFlags` 判据键）：条目序由 `contextMenuTemplate` 两语境各自落定。 */
const ITEMS = Object.freeze({
  cut: { role: "cut", flag: "canCut" },
  copy: { role: "copy", flag: "canCopy" },
  paste: { role: "paste", flag: "canPaste" },
  selectAll: { role: "selectAll", flag: "canSelectAll" },
})

/** 文案四键读数（项 1）：解析序 = 当前语言 → 缺省语言 → 键名自身（与渲染面 `t()` 同终态）。 */
export function contextMenuLabels(locale) {
  const table = HOST_DICT[normalizeLocale(locale)] ?? HOST_DICT[FALLBACK_LOCALE] ?? {}
  const read = (key) => {
    const hit = table[key] ?? HOST_DICT[FALLBACK_LOCALE]?.[key]
    return typeof hit === "string" ? hit : key
  }
  const labels = {}
  for (const [name, key] of Object.entries(LABEL_KEYS)) labels[name] = read(key)
  return labels
}

/** 条目集（项 1 · 纯函数）：语境判定 ⇒ 模板数组（元素 = `{ role, label, enabled? }` —— `Menu.buildFromTemplate` 直接消费）。
 *  `enabled` 仅当 `editFlags` 对应值为布尔时落键（缺键不禁用）；非编辑族序 = copy → selectAll。 */
export function contextMenuTemplate(params, labels) {
  const editable = params?.isEditable === true
  const selected = typeof params?.selectionText === "string" && params.selectionText !== ""
  if (!editable && !selected) return []
  const flags = params?.editFlags ?? {}
  const item = (name) => {
    const { role, flag } = ITEMS[name]
    const enabled = flags[flag]
    const label = labels?.[name]
    return { role, ...(typeof label === "string" ? { label } : {}), ...(typeof enabled === "boolean" ? { enabled } : {}) }
  }
  return editable ? [item("cut"), item("copy"), item("paste"), item("selectAll")] : [item("copy"), item("selectAll")]
}
