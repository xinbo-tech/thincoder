/**
 * i18n-en.mjs — 控制台文案表·English（webui/WEBUI.md §2.2——KD-SV-26 ∥ 聚合门面 KD-SV-51——2026-10-08 结构轮拆表 ∥ 2026-10-11 沙盒族再拆（#1270））：五部件
 * 展开合体 + `Object.freeze`——`EN` 导出名不变（`i18n.mjs` 与门禁断言件取件面零改）；部件 = `i18n-en-{shell,me,admin,sandbox,system}.mjs`
 * （域界 = 键首段前缀——`.one` 变体随基键；`admin.sandbox.*` 族域界 = 键二级前缀（#1270）；键序 = 原档相对序）。本档 = en 族（零 CJK——零 CJK 机检口径 §6 AC-14：
 * 扫描面按前缀排除 `i18n-zh*` ∥ `i18n-en*`）。
 */
import { EN_SHELL } from "./i18n-en-shell.mjs"
import { EN_ME } from "./i18n-en-me.mjs"
import { EN_ADMIN } from "./i18n-en-admin.mjs"
import { EN_SANDBOX } from "./i18n-en-sandbox.mjs"
import { EN_SYSTEM } from "./i18n-en-system.mjs"

export const EN = Object.freeze({ ...EN_SHELL, ...EN_ME, ...EN_ADMIN, ...EN_SANDBOX, ...EN_SYSTEM })
