# 探索蒸馏异步化 — 需求（CLI）

> 状态：待评审（2026-08-25）
> 关联：`docs/design/SEND-STALL-DISTILL-TUNING.md`（设计）、`docs/design/README.md`（文档地图）
> 范围：本仓库（thincoder CLI）；VS Code 扩展（thincoder-vscode）有同需求独立文档（`SEND-STALL-DISTILL-REQUIREMENTS.md`），两端语义一致
> ⚠️ **两端必须同步改（lockstep）**：蒸馏逻辑在两仓库各有实现，单边改动会造成行为漂移

## 1. 总体目标

一轮会话的最后一段输出渲染完成后，UI 仍僵持数秒到十几秒才恢复（VS Code 表现为 send 按钮延迟出现，CLI 表现为状态栏/输入框延迟恢复）。根因是轮末的"探索结果蒸馏"（`summarizeRunExplorations`）在最终回复之后、回合结束信号之前**同步阻塞**执行——一次静默的第二次 LLM 调用。目标是让回合结束信号**先于**蒸馏发出，蒸馏异步完成，UI 不再等待。

## 2. 功能用户故事（Functional）

| # | 用户故事 | 验收语义 |
|---|---|---|
| FR1 | 作为用户，我希望最后一轮输出结束后 UI **立即**恢复（CLI：状态栏回 Ready；VS Code：send 按钮出现），不再等蒸馏 | 回合结束信号（CLI：runAgent 返回；VS Code：`onComplete`）在蒸馏**之前**发出，蒸馏不阻塞 |
| FR2 | 作为用户，我希望蒸馏语义不变——摘要仍落入机器行，下一轮开始时上下文已压缩 | 蒸馏 promise 在下一轮 `runAgent` 开始（push 用户输入**之前**）被 await；摘要必在下一轮 LLM 调用前就位 |
| FR3 | 作为用户，我希望磁盘上的会话最终仍是压缩版（现状行为） | 蒸馏完成后触发一次保存回调（CLI：`onDistilled` → session 保存；VS Code：`onDistilled` → `_saveLines`） |
| FR4 | 作为用户，我希望失败路径不变——蒸馏失败静默，原始探索结果保留 | 蒸馏 catch 吞掉返回 null（N3），不影响回合结果与历史 |

## 3. 非功能标准（Non-functional）

| # | 维度 | 标准 |
|---|---|---|
| N1 | 竞态安全 | 蒸馏替换历史与下一轮 push 输入**互斥**：await 蒸馏必须在 `prepareRun`/`setupAgentRun`（push 输入）之前，否则新输入被压缩替换清掉 |
| N2 | 数据一致性 | 会话文件最终为压缩版（与现状一致）；用户快速连发下一条消息不丢输入、不丢摘要 |
| N3 | 可中止 | 蒸馏在回合外异步运行，由下一轮开头 await 与退出 flush（≤5s）兜底；不再声称用户 Stop 可中断——异步化后该保证结构性失效（评审 #2，2026-08-25），Stop 只中断回合本身 |
| N4 | 两端一致 | CLI 与 VS Code 同一时序：结束信号 → 异步蒸馏 → 保存回调；同一挂载点语义（agent/pendingDistill） |
| N5 | 可测试 | 竞态时序（连发消息）、保存回调触发、失败静默均有测试 |
