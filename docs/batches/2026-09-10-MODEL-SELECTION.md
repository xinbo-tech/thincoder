# 批次记录（本仓份）— MODEL-SELECTION（2026-09-10）

> 搬迁注记：本档 = CLI 仓批次记录 `thincoder/docs/batches/2026-09-10-MODEL-SELECTION.md` 的**本仓份拆出承载档**
> （LEDGER-SELF-CONTAINED 批——拆分：两端均有实施面，各仓持其份；文字**逐字搬运、零改写**——D10；对端份留源档）。
> 拆分判据 = `LEDGER-SELF-CONTAINED（CLI 仓）§8.3` 表（本仓份 **28** 条目 = VSC 源 18 + VSC 测试 10）；源档 blob SHA = f121fb82bf68。
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
