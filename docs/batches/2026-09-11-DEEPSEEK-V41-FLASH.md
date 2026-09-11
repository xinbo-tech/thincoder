# 批次记录（本仓份）— DEEPSEEK-V41-FLASH（2026-09-11）

> 搬迁注记：本档 = CLI 仓批次记录 `thincoder/docs/batches/2026-09-11-DEEPSEEK-V41-FLASH.md` 的**本仓份拆出承载档**
> （LEDGER-SELF-CONTAINED 批——拆分：两端均有实施面，各仓持其份；文字**逐字搬运、零改写**——D10；对端份留源档）。
> 拆分判据 = `LEDGER-SELF-CONTAINED（CLI 仓）§8.3` 表（本仓份 **4** 条目 = VSC 源 2 + VSC 测试 2）；源档 blob SHA = 18f93661d7e9。
> 源档案内锚：§2「受影响文件」表 `:137`。

## 本仓份（逐字自源档搬运）

| 端 | 文件 | 改动要点 |
|---|---|---|
| VSC 源 | `thincoder-vscode/src/config.mjs` | 同 CLI 行集（多 `reasoningEffortDefault`） |
| VSC 源 | `thincoder-vscode/src/config-presets.mjs` | 预设改值 |
| VSC 测试 | `thincoder-vscode/test/config-merge.test.mjs` | 预设值断言新增（T37） |
| VSC 测试 | `thincoder-vscode/test/image-downgrade.test.mjs` | 镜像行字段 + 视觉判据放行（T36） |

> 文档面（双端 `PROVIDER.md`）已由 designer 落档——**不在 coder 写域**；发现文档与实现不符 → 报告，勿径改。

**本仓侧验收面（源档 AC 中本仓相关行）**：AC-11 后半（`cd thincoder-vscode && node --test test/image-downgrade.test.mjs` 全绿）· AC-15 双端 config-merge 全绿 · AC-16 双端宽度机检新增 0 · AC-17 双端 `npm test` 全绿。
