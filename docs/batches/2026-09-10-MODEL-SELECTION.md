# 批次记录（本仓份）— MODEL-SELECTION（2026-09-10）

> 搬迁注记：本档 = CLI 仓批次记录 `2026-09-10-MODEL-SELECTION（CLI 仓）` 的**本仓份拆出承载档**
> （LEDGER-SELF-CONTAINED 批——拆分：两端均有实施面，各仓持其份；文字**逐字搬运、零改写**——D10；对端份留源档）。
> 对端（CLI 仓）源档对端份已**切除**（2026-09-12）——追溯锚 = 源档档首移出清单 + 源档 blob SHA
> 回注（2026-09-12）：对端（CLI 仓）源档对应块**已补切**（本档逐字承载在先——对齐核验 2 处逐字相等 · 源档 blob SHA 双向一致；实证见 `LEDGER-SELF-CONTAINED（CLI 仓）§5` 记录）。
> 拆分判据 = `LEDGER-SELF-CONTAINED（CLI 仓）§8.3` 表（本仓份 **28** 条目 = VSC 源 18 + VSC 测试 10）；源档 blob SHA（切除前）= f121fb82bf68。
> 源档案内锚：§2「VSC 源 / VSC 测试」块 + §5 分提交（对端主体提交 `9299661`）。

## 本仓份（逐字自源档搬运）

**VSC 源（18 文件，其中新增 1）**：

- `src/config-presets.mjs`(41) · `src/config-migrate.mjs`(161,+25) · `src/config-io.mjs`(438,±5) · `src/provider.mjs`(456,−15) · `src/provider/list-models.mjs`（新增 ~95）· `src/provider/transports/openai.mjs`(±0 文案)
- `src/advisor/provider.mjs`(39) · `src/agent-tools/subagent.mjs`(358) · `src/extension/settings.mjs`(332,+20) · `src/extension/provider-flows.mjs`(193,+15) · `src/extension/settings-panel-write.mjs`(134,+10) · `src/extension/vision-channel.mjs`(23,+5)
- `src/extension/panel-chat.mjs`(499,核查) · `src/extension/turn-model.mjs`(28,核查) · `src/extension/presets.mjs` / `panel-messages.mjs`(454) / `panel-session.mjs`(333)（头注/注释）· `webview/settings-providers.js`(264,+20)

**VSC 测试（10 文件）**：`test/config-merge.test.mjs`(126 重写) · `test/provider-admission.test.mjs`（新增）· `test/provider-model-guard.test.mjs`(149 改) · `test/image-downgrade.test.mjs`(120 改) ·
  `config-io-panel`(101) / `config-softfail`(114) / `settings-panel`(87) / `chat-panel`(621)（核查） · `test/files.mjs` + `smoke-provider.mjs`（注册表/smoke 核查）。

**本仓侧验收面（源档 §2 验收标准中本仓相关行）**：

- AC-1 内 VSC 静态候选来源清除：`cd thincoder-vscode && grep -rn "configCandidates" src/` → 空（标识符只在 VSC 仓——现状 `settings.mjs:301-317` 命中；CLI 仓无此名）。
- AC-6：VSC `resolveDefaultModel` 新回退链断言；`fullStatus` 拉取失败 = 渠道不可选断言（明示原因；无 fallback 候选）。

> **§2 补承载（收尾轮 · 2026-09-12）**：来源 = 对端源档 `2026-09-10-MODEL-SELECTION（CLI 仓）` §2 修正轮块——本批点名、本仓份未逐字携带的 2 处（落点句 + AC-10 行）；**逐字搬运、零改写**（D10）。
> 源档 blob SHA（as-of 本迁入轮）= `c8953eeb5368`；行区间 = `:330` · `:349`（本迁入轮实测，以本值为准；对端记录所载 = `:332`/`:349`——`:332` 为逐条落点表前引导行，落点句本体 = `:330`）。
> 读法：以下 2 行系对端档视角原文——`../design/PROVIDER.md`（指对端设计档）、「上表」「本小节」均属对端档语境。

> 落点 = `../design/PROVIDER.md` 与 `PROVIDER（VSC 仓）` 两档；**本小节声明对 §2 上文的修正**——上表与本小节不一致处，以本小节 + 两设计档为准。

| AC | 回指 | 验证（机器可判） |
|---|---|---|
| AC-10 | R10 | VSC 仓 `node --test test/model-picker-fallback.test.mjs` 全绿（T29——未命中零 `selectModel` / `selectReasoning` post = 会话槽零写；显示与状态回落会话槽复合（== prefs 复合）；命中分支同值回写仍在）；`npm test` 全绿（新档已注册 `test/files.mjs`）。 |
