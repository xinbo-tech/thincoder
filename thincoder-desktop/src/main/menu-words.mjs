/**
 * menu-words.mjs — 应用菜单**维护面词表**（#533 —— 台账「桌面 Maintenance 菜单文案补 zh/en」；内容权 = 主 agent）：
 *   与右键编辑菜单词表（`src/main/context-menu.mjs` —— 经渲染面宿主表 `menu.edit.*` 键取值）**分档**：菜单面不同
 *   （应用菜单 ∕ 右键菜单）· 值源形不同（主进程自持常量对 ∕ 宿主表词键投影）—— 两词表两事不混、词面零交集
 *   （单源 = 维护面词值只住本档）。
 *   `menuLabels(locale)` = 纯函数（零 `electron` ∕ 零 `node:` ⇒ 平 node 直测）：语言经核归一（`zh-CN` ⇒ `zh`；
 *   缺 ∕ 空 ∕ 未知 ⇒ en —— 沿 `context-menu.mjs` 同款归一）；返回键集 = `{ maintenance, cleanUp, rebuildIndex }`。
 *   **zh 词值已裁**（#533 上抛 1 裁定：按 en 项语义直译；组名随译 = 是）⇒ 本表值级更新已落（结构 ∕ 接线零改；en
 *   现值逐字 = 迁移前 `window.mjs` 字面，回归面）。`File ∕ Edit ∕ View ∕ Window` 四组零动（组名 = `window.mjs` 字面 ∕ 组内条目 = 系统 role）。
 */
import { normalizeLocale } from "@thincoder/core/i18n.mjs"

/** 维护面三项词（en 现值 = 迁移前 `window.mjs` `buildMenu` 字面逐字；zh = 语义直译值（#533 裁定））。 */
const WORDS = Object.freeze({
  en: Object.freeze({
    maintenance: "Maintenance",
    cleanUp: "Clean up session data…",
    rebuildIndex: "Rebuild session index",
  }),
  zh: Object.freeze({
    maintenance: "维护",
    cleanUp: "清理会话数据…",
    rebuildIndex: "重建会话索引",
  }),
})

/** 维护面词读数（消费面 = `src/main/window.mjs` `buildMenu`）：解析序 = 当前语言 → en 回落（缺槽 ∕ 未来新语种）。 */
export function menuLabels(locale) {
  return WORDS[normalizeLocale(locale)] ?? WORDS.en
}
