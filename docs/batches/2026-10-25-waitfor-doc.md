# 2026-10-25 · wait_for 工具说明收正：删「等子代理/评审」推荐用法
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-25 · 来源 = 用户 2026-10-25 16:12「是不是应该在wait_for的工具说明里加上一些提示，避免被滥用？」——实读 `thincoder-core/tool-docs/wait_for.md:1` 把「async subagent/consult settling」列为推荐用法。
> 台账 = #1788（TOOLS · 归批）。前情 = 无（独立轻通道轮）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-25

**已定决定**：wait_for 工具说明**不得**把「等子代理/评审报告」列为用法；这类状态有投递通道，等待 = 结束这一轮。 · 用户原话：「是不是应该在wait_for的工具说明里加上一些提示，避免被滥用？」 · 时间：2026-10-25 16:12

> 不适用：§2 —— 无机制设计：本笔 = 工具说明文本收正（删一条错误推荐 + 加反例），无接口 / 无行为变更。
> 不适用：§3 —— 无设计可评：同上；判据来源 = 本项目纪律「子代理/评审报告自带投递通道，等待 = 结束本回合」（`thincoder-core/prompts/common.md` 并行调用原则段）。

## §2 批次任务与设计（eng-designer）
**状态行**：（eng-designer 写入时更新）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试覆盖 / 验收对照 / 关键决策 / 上抛项>
## §3 设计评审（评审子代理）
## §4 用户批准（主 agent）

**状态行**：已批准 2026-10-25（用户原话「是不是应该在wait_for的工具说明里加上一些提示，避免被滥用？」＝准；收尾令「那收口吧」）

**批准范围**：`thincoder-core/tool-docs/wait_for.md` 全文收正——删「async subagent/consult settling」推荐用法；三个 agent 内部条件标 discouraged 并给理由；补「will this state announce itself to me anyway?」自检句。

## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）

## 验证与收口（轻通道轮 2026-10-25）

**改前 → 改后（`thincoder-core/tool-docs/wait_for.md`）**：

| 面 | 改前 | 改后 |
|---|---|---|
| 用法引导（`:1`） | 「Use it ONLY for genuinely asynchronous waits: **an async subagent/consult still settling**, a file appearing, a port opening」 | 「Use it only for states that **cannot announce themselves**: a file appearing, a port opening, a background bash or browser task finishing」 |
| 反例 | 无 | 「**Never use it to wait for a subagent or a review report.** … the act of waiting for one is simply ending the turn」+ 实测读数（2 次等待 ≈ 4.5 分钟 / 210 轮询） |
| 条件列表 | 三条件平铺 | `advisor settled` ∥ `subagent id:N done` 标 **discouraged** + 理由；`consult done` 补「仅在同步调用方无法推进时」 |
| 自检句（Notes 末） | 只拦同步工具 | 「Before calling it, ask: **will this state announce itself to me anyway?** If yes, end the turn and let it arrive」 |

**机检读数**：`doc_check`（本档）= **0 命中**（改前 2 处段长命中：`:5` 614 字符 · `:16` 332 字符，已按陈述边界拆段）；最长行 262 / 行数 34。

**过程披露（父侧直笔）**：本笔为轻通道 -- 父侧直接编辑（缺陷修复：说明文本与项目纪律相反）。**第一笔 `write` 整文件覆盖时冲掉了参数 / 返回 / 注意三段**，当即重写补回并复读校验——三段现均在位（`Parameters` / `Returns` / `Notes` grep 命中），机检零命中。

**测试行**：① 本笔无单测档（纯文本说明改动，无代码路径）· ② 集成集现量 **19 例 / 窗口 50–100**，本笔无增删。

**遗留**：条件本体（`advisor settled` / `subagent id:N done`）仍在实现中——是否删除属产品代码改动，本笔只收正说明。另一批再议。
