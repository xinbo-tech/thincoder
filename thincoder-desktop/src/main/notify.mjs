/**
 * notify.mjs — 完成提示面**端胶水**（机制单源 = `docs/desktop/design/PROJECT.md` §2 KD-35；词键注 = `docs/desktop/design/IPC.md` §1）。
 * **R6 上提随动（处理流批 · 2026-09-28）**：策略体（失焦门 + 载荷成形 + 词键）上提核件
 * `@thincoder/core/notify-policy.mjs`（上提源 = 本档现状超集 —— 纯搬零语义改；对位锚 = VSC
 * `thincoder-vscode/src/extension/notify.mjs:9-18`（迁移前坐标）+ `panel-callbacks.mjs:236`）——本档只留 re-export
 * （`agent-host.mjs` 注入面 ∕ 用例 import 面零改）；**parity-b4 · D3**：档②（后台消化轮起跑）去——单档 `turnDone`。
 * 平台落子装配（`notify` ∕ `focused` ∕ `reveal` 三件 —— 宿主通知构造 ∕ 焦态 ∕ 聚焦）留端：
 * `thincoder-desktop/src/main/main.mjs`。
 * 原「词键持有面 = 主进程自持」句随上提改归属（核件持有）。
 */
export { NOTIFY_TEXTS, createNotifier } from "@thincoder/core/notify-policy.mjs"
