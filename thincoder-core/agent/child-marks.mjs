/**
 * child-marks.mjs — 子代理报告文本锚点（机器检出子串——单一权威源）。
 *
 * 收编自 `spawn-child.mjs`（2026-09-20 端差·显示面消差批 §2.2 X6 实现轮）：端壳侧需**静态**
 * 导入锚点做块头注记判定，而 `spawn-child.mjs` 静态链经核 agent 栈可达 `node:sqlite`
 * ⇒ 端壳静态闭包禁达（W8 契约②；`thincoder-vscode/test/engine-floor-guard.test.mjs`
 * fail-closed 红）⇒ 锚点下沉**零依赖叶**（先例 = `relay-prefix.mjs` 同因下沉）。`spawn-child.mjs`
 * 原样再导出 ⇒ 既有 import 面（核 agent-tools 族 / CLI `tool-events.mjs`）零改。
 *
 * 语义：消费端用 `includes()` 检出锚点 ⇒ 合成块头注记（"work may be partial"）——两端各一处：
 * CLI = `thincoder-cli/src/tui/tool-events.mjs:217`；端壳 = `thincoder-vscode/src/extension/
 * panel-callbacks.mjs`（onToolResult）。文案演进只改这里（与检测判据单源——消除文案/判据漂移面）。
 *
 * 零 import——任意层可引、无环。
 */

/** turn-cap 降级文案的公共锚点：subagent/escalate 的 onDeclined 文案必含此子串
 *  （`subagent-async.mjs` 折叠 partial / `escalate-async.mjs` 同族）。 */
export const TURN_CAP_MARK = "stopped: turn cap reached"

/** SYNC-CANCEL（L52）：sync spawn ⏹ 定向中止折叠报告的公共锚点（`buildSyncStoppedReport`）；
 *  消费端用 `includes()` 检测"用户定向中止——工作可能不完整"语义（块冻结标 stopped 而非
 *  done——R6）。与 TURN_CAP_MARK 同族单源纪律。 */
export const STOPPED_MARK = "stopped by user"
