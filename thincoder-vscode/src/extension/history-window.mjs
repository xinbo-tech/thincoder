/**
 * history-window.mjs — 人读线惰性窗口面（端壳转口）
 *
 * W6（CONTEXT-COMPACTION 单元）改指：窗口算法面 = 核单源
 * （`@thincoder/core/history-window.mjs`——#123「VSC 的 history-window 拆面按核内
 * 结构归位」随 S1 已落，179 行；纯函数零宿主依赖）。本档保留为端壳转口：本端消费方
 * （`session-io.mjs` 的 import + re-export）路径不变，双实现副本退场（F9 残留删净）。
 *
 * 窗口语义（规则 1–6 / turnStart / 全历史配对 / 跨页防双显）见核档头注与
 * `docs/design/SESSION-RESTORE-PARITY.md`；本档不再复述（D2 不重述）。
 */
export { historyWindow, HISTORY_PAGE_SIZE, isRealUserMsg } from "@thincoder/core/history-window.mjs"
