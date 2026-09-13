# 批次记录（本仓份）— LEDGER-SURFACE（2026-09-12）

> 搬迁注记：本档 = CLI 仓批次记录 `2026-09-12-LEDGER-SURFACE（CLI 仓）` 的**本仓份拆出承载档**
> （LEDGER-SELF-CONTAINED 批——拆分：两端均有实施面，各仓持其份；文字**逐字搬运、零改写**——D10；对端份留源档）。
> 对端（CLI 仓）源档对端份已**切除**（2026-09-12）——追溯锚 = 源档档首移出清单 + 源档 blob SHA
> 拆分判据 = `LEDGER-SELF-CONTAINED（CLI 仓）§8.3` 表（本仓份 **13** 条目 = §5 交付 21 档分端 VSC 13）；源档 blob SHA = bfe7936ea26e。
> 源档案内锚：§5 `:268` 交付 21 档分端（VSC 13 / CLI 8）。

## 本仓份（逐字自源档搬运）

**交付面（源档 §5——VSC 13 条目）**：

| # | 文件（VSC） | 说明 |
|---|---|---|
| 9 | `thincoder-vscode/src/ledger.mjs`（新，225 行） | VSC 独立实现、语义同源（不跨仓 import） |
| 10 | `thincoder-vscode/src/extension/ledger-surface.mjs`（新，111 行） | item（L1/tooltip/warningBackground/hide）+ post 门 + 送达门 + 周期 |
| 11 | `thincoder-vscode/src/extension/chat-panel.mjs`（422 行） | `_initStatusBar` 首行 initLedgerSurface（先于守卫——生产路径 `_statusBar` 由 extension.mjs 预置）+ dispose |
| 12 | `thincoder-vscode/src/extension/panel-messages.mjs`（499 行） | webviewReady 尾（openSessionContent 后）pushLedgerStartup |
| 13 | `thincoder-vscode/src/extension/panel-project.mjs`（93 行） | onProjectChanged 尾 refreshLedger(emit:false) |
| 14 | `thincoder-vscode/webview/chat.js`（~415 行） | `ledgerNotice` case + import |
| 15 | `thincoder-vscode/webview/ledger-line.js`（新，18 行） | 逐行 `.ledger-line [warn]` append |
| 16 | `thincoder-vscode/webview/chat.css`（~491 行） | `.ledger-line` / `.warn` 样式 |
| 17 | `thincoder-vscode/src/prompts/discipline-engineering.md`（240 行）+ `docs/design/prompts/…`（163 行） | 同 CLI D7 逐字 |
| 18 | `thincoder-vscode/test/ledger.test.mjs`（新，~250 行）+ `test/files.mjs`（78 行） | VSC 面用例 + 入册 |
| 19 | `thincoder-vscode/test/vscode-mock/index.mjs`（**声明外补丁**，~190 行） | 补 `createStatusBarItem`/`StatusBarAlignment`/`ThemeColor`/`MarkdownString`——T107 直驱 item 的前置（原 mock 无状态栏 API）；加性、既有用例零影响 |

**决策透明表（源档 §5——本仓相关行）**：

| # | 决策 | 理由 / 证据 |
|---|---|---|
| 5 | VSC init 放 `_initStatusBar()` **首行**（守卫前） | 生产路径 `extension.mjs:26` 预置 `_statusBar` → 放守卫后则永不执行 |
| 6 | dispose 挂 `process.on("exit", …)`（非 `cleanup()` 内） | `createExitCleanup` 在 tui-lifecycle（表外档）；退出语义等价 |
| 7 | 跨端键断言 `win32` 守卫 | VSC CI = ubuntu-latest；POSIX 下盘符规则不适用（`path.posix` 模拟实测会红） |

**验证证据（源档 §5/§6——本仓相关）**：

- `node --test test/ledger.test.mjs`（VSC，FULL）→ **11/11 pass**；VSC 快层 654 / 637 pass / **1 fail**（`context-parity T-CI-2a`——本机 `~/.thincoder/config.json` `agent.engineering=true` 环境态，非本批）；全量 651 pass / 同唯一红。
- VSC `node scripts/check-doc-width.mjs` → 新增 **0**。
- 收口（源档 §6）：VSC `ledger` 11 例 **0 fail**；`--summary` 族行 ✓（thincoder-vscode「3·9 可开批」✓）。
- 登记（源档 §6）：`panel-messages.mjs` **499 行**（距硬限 1 行）——下批触碰前先核（本仓技术待办）。
