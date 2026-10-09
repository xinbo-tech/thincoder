/**
 * i18n-zh.mjs — 控制台文案表·中文（webui/WEBUI.md §2.2——KD-SV-26 ∥ 聚合门面 KD-SV-51——2026-10-08 结构轮拆表）：四部件
 * 展开合体 + `Object.freeze`——`ZH` 导出名不变（`i18n.mjs` 与门禁断言件取件面零改）；部件 = `i18n-zh-{shell,me,admin,system}.mjs`
 * （域界 = 键首段前缀——`.one` 变体随基键；键序 = 原档相对序）。本档 = zh 族（唯一 CJK 载体——零 CJK 机检口径 §6 AC-14：
 * 扫描面按前缀排除 `i18n-zh*` ∥ `i18n-en*`）。
 */
import { ZH_SHELL } from "./i18n-zh-shell.mjs"
import { ZH_ME } from "./i18n-zh-me.mjs"
import { ZH_ADMIN } from "./i18n-zh-admin.mjs"
import { ZH_SYSTEM } from "./i18n-zh-system.mjs"

export const ZH = Object.freeze({ ...ZH_SHELL, ...ZH_ME, ...ZH_ADMIN, ...ZH_SYSTEM })
