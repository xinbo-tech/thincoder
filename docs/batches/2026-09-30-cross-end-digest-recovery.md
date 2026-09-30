# 2026-09-30 · 跨端消化面恢复
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-30 · 来源 = 台账 #726（#719 设计轮 U1 承接：跨端对齐义务——CLI ∥ VSC 的消化生命周期面（痕 ∥ 归档块）恢复呈现；用户可见端差默认消灭）+ 用户 2026-09-30 18:24「挂账那些也都处理掉」+ 18:28「自动跑完」。侦察（explore id=4 · 2026-09-30 18:30）= VSC：live 归档既有（`webview/activity.js:99-110`），但会话数据面无记录写入/读取（`record:append` 仅桌面）⇒ 面板重开 ∥ reload 后痕与归档块全失（重建只认 user/assistant/tool——`webview/ui.js:159-165`）；CLI：痕 = `pushLine` 瞬态、块 = 冻结载体行（内存）⇒ 重启 ∥ `/session` 后全失（`historyToLines` 无 records 分支——`startup.mjs:22-116`）。共享面 = 核读缝 `historyWindow {records:true}` + `pushReal` 半载体写 + 记录存储绑定；端侧重建器 = 各端自做。。
> 台账 = #726（SESSION · 归批）。前情 = docs/batches/2026-09-30-digest-persistence.md §2.七 U1（已收口 2026-09-30）。
## §1 讨论（主 agent）
**状态行**：进行中（需求三档落 ✓（core F-S7 ∥ VSC F-W1/I-7 ∥ CLI F18）· 设计轮派发（eng-designer #8））
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**来源**：台账 #726（#719 · U1 承接）+ 用户 2026-09-30 18:24 ∥ 18:28 令。

**侦察落定（explore id=4 · 18:30）**：**VSC** = live 归档既有（`thincoder-vscode/webview/activity.js:99-110`），但会话数据面**无记录写入 ∥ 无读取**（`record:append` 全仓仅桌面）⇒ 面板重开 ∥ reload 后痕与归档块全失（恢复重建只认 user/assistant/tool——`webview/ui.js:159-165`）；**CLI** = 痕 `pushLine` 瞬态（`src/tui/suspension-drive.mjs:85-101`）、块 = 内存载体行（`src/tui/subagent-freeze.mjs:82-97`）⇒ 重启 ∥ `/session` 后全失（`historyToLines` 无 records 分支——`src/tui/startup.mjs:22-116`；正文消息本身在）。**共享面** = 核读缝 `historyWindow {records:true}`（`thincoder-core/history-window.mjs:117/175-178`）+ `pushReal` 半载体写（`thincoder-core/context.mjs:93-103`）+ 记录存储绑定（`session-store.mjs:361`——CLI 已绑 ∥ VSC 未绑）；**端侧重建器 = 各端自做**（桌面 `page-read.mjs` 折叠/位次算法是否上提 render-core = 设计第一分叉）。

**需求已落三档（父侧笔）**：core `docs/core/requirements/SESSION.md` §4.4 **F-S7**（记录两族入存储 + 读面 opt-in + 默认关负控）∥ VSC `docs/vsc/requirements/WEBVIEW.md` **F-W1 扩展** + **I-7 收窄**（未归档块口径）∥ CLI `docs/cli/requirements/TUI.md` **F18** + 变更记录。

**范围（本批）**：两端**写面 + 读面 + 重建器**（机制承接 #719 语义）；**机制单源位置 = 设计轮裁定**（现单源住桌面设计档 `docs/desktop/design/RENDERER.md` §1.1）。**边界**：桌面零触；呈现语义零改（形态既有）；两条在册容差（跨页截断轮 ∥ 归档快照晚一拍）承接后沿用 ∥ 收正 = 设计裁。

**下一手**：设计轮（本档 §2）→ 评审 → 批准 → 实施（两端舱）。

## §2 批次任务与设计（eng-designer）
**状态行**：（eng-designer 写入时更新）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>
## §3 设计评审（评审子代理）
## §4 用户批准（主 agent）
## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）
