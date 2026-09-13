# 批次记录（本仓份）— VSC-ASYNC-VISIBILITY（2026-09-11）

> 搬迁注记：本档 = CLI 仓批次记录 `2026-09-11-VSC-ASYNC-VISIBILITY（CLI 仓）` 的**本仓份拆出承载档**
> （LEDGER-SELF-CONTAINED 批——拆分：两端均有实施面，各仓持其份；文字**逐字搬运、零改写**——D10；对端份留源档）。
> 对端（CLI 仓）源档对端份已**切除**（2026-09-12）——追溯锚 = 源档档首移出清单 + 源档 blob SHA
> 拆分判据 = `LEDGER-SELF-CONTAINED（CLI 仓）§8.3` 表（本仓份 **16** 条目——条目 A（纯本仓）+ 条目 B 本仓半边）；源档 blob SHA = ef9b8c7b55ca。
> 源档案内锚：§2 `:122` / `:123`（条目 A 纯对端 / 条目 B 双端）。

## 本仓份（逐字自源档搬运）

**条目 A（纯本仓——受影响文件）**：

`webview/activity.js`(204,+45) · `webview/state.js`(113,+3) · `webview/streaming.js`(244,±5) ·
`src/extension/panel-callbacks.mjs`(148,+30) · `src/extension/panel-messages.mjs`(455,+14) · `src/extension/panel-session.mjs`(332,+8) ·
`src/extension/chat-panel.mjs`(414,+3) · `src/extension/suspension.mjs`(313,+22) · `test/async-visibility.test.mjs`(新,+170) ·
`test/files.mjs`(49,+1) · `test/activity-flow.test.mjs`(300,+40) · `docs/design/WEBVIEW.md`(339,+197)。

**条目 B（双端——14 项 = 12 改 + 2 增，代码面 ~+90 行）**：

VSC：`src/agent-tools/subagent-actions.mjs`(337,+55) · `src/agent-tools/subagent.mjs`(380,+4) · `src/tools/wait_for.mjs`(195,+10) · `test/subagent-observe-send.test.mjs`(167,+45) · `test/wait-for-advisor-pool.test.mjs`(新,+60) · `test/files.mjs`(49,+1) · `docs/design/AGENT-LOOP.md`(506,+14)。

**验收标准（源档——本仓相关）**：AC-A1（T-V1 双 id 双块计数 2）· AC-A2（T-V2 重名接管 + `takeover` 痕迹）·
AC-A3（T-V4/T-V5 never-born 补桩行 + 不补桩行（含 answered / queued-cancel））· AC-A4（T-V3 清屏后再断言 → `pool === true` + ⏹ 在 + 位置断言流尾）·
AC-A5（T-V6/T-V7 队列按序 flush + 溢出丢最旧留痕）· AC-A6（`postPoolSnapshot`/`SNAPSHOT_ROLES` grep 零命中）·
AC-A7（VSC run-fast 全绿 + 新档在册 + CLI 零代码改动）· AC-A8（文档面 + 宽度新增超宽 0）。

> 行数 as-of 源档交付日（2026-09-11）；现文行数以各档现态为准。
