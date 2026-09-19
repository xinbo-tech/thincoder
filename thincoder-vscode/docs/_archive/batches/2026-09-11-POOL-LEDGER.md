# 批次记录（本仓份）— POOL-LEDGER（2026-09-11）

> 搬迁注记：本档 = CLI 仓批次记录 `2026-09-11-POOL-LEDGER（CLI 仓）` 的**本仓份拆出承载档**
> （LEDGER-SELF-CONTAINED 批——拆分：两端均有实施面，各仓持其份；文字**逐字搬运、零改写**——D10；对端份留源档）。
> 对端（CLI 仓）源档对端份已**切除**（2026-09-12）——追溯锚 = 源档档首移出清单 + 源档 blob SHA
> 拆分判据 = `LEDGER-SELF-CONTAINED（CLI 仓）§8.3` 表（本仓份 **5** 条目 = §2 受影响文件表 VSC 行）；源档 blob SHA = 15a6afcca693。
> 源档案内锚：§2 逐行（`:189` 起对端档带仓前缀）+ §5「11 档 + 1 披露档」。

## 本仓份（逐字自源档搬运）

| 文件 | 性质 | as-of 行数 | 预计增量 | 超档处置 / 拆分计划 |
|---|---|---|---|---|
| `thincoder-vscode/docs/TODO.md` | 修改 | 40 | +≤70（建需求池组 + 技术组按 (b) 重排） | 同上；**不入 eng-coder `files`**——由 eng-designer 落笔 |
| `thincoder-vscode/src/prompts/discipline-engineering.md` | 修改 | 229 | +≤12（VSC 端原文自持，语义同源） | 提示词文件——**落笔归 eng-coder**（入其 `files`）；**不设 byte-identical 依赖** |
| `thincoder-vscode/docs/design/prompts/discipline-engineering.md` | 修改 | 156 | +≤12 | 同上；入 eng-coder `files` |
| `thincoder-vscode/src/prompts/persona-eng-designer.md` | 修改 | 56（同上） | 同上（端原文自持——「不触碰本仓 `docs/TODO.md`」） | 同上；不设 byte-identical 依赖 |
| `thincoder-vscode/docs/design/prompts/persona-eng-designer.md` | 修改 | 54（同上） | 同上 | 同上 |

> 台账引用改指说明（任务书 T6）：本档内原指 CLI 仓台账的引用随拆分为**本仓 `docs/TODO.md`**——指针形态照 `LEDGER-SELF-CONTAINED（CLI 仓）§8.7` 处置（台账面物理落笔归主 agent）。
> 行数 as-of 源档交付日（2026-09-11）。
