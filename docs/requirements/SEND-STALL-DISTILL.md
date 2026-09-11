# 探索蒸馏异步化 — 需求（VS Code 扩展）

> 归位注记：本档自 `docs/design/SEND-STALL-DISTILL-REQUIREMENTS.md` 归位入 `docs/requirements/`（文档体系各仓自持批 LEDGER-SELF-CONTAINED——纯需求档去 `-REQUIREMENTS` 后缀；对应 `-TUNING.md` 留 `docs/design/` 作设计档）。
> 板块：轮末探索蒸馏的**时序**——"何时等待 / 是否等待"（已实现专题，当前生效）。
> 蒸馏机制本体（`summarizeRunExplorations` 的替换规则与静默语义）归 CLI 端 `thincoder/docs/design/CONTEXT-COMPACTION.md`（本仓库无该文件，评审 #4）——本对文档只定蒸馏的触发与等待时序。
> 关联：`SEND-STALL-DISTILL-TUNING.md`（设计）、`README.md`（文档地图）。
> 状态：**已实现**（2026-08-25 评审修订后实施 + 2026-09-05 模块化；marketplace / Open VSX 0.1.49 发布）。
> 跨端：CLI（thincoder）有同语义独立需求文档（`SEND-STALL-DISTILL（CLI 仓）`），两端语义一致——蒸馏逻辑两仓库各有实现，**改动须两端同步（lockstep）**，单边改动会造成行为漂移。

## 总体目标

一轮会话最后一段输出渲染完成后，UI 仍僵持数秒到十几秒，send 按钮才出现。根因是轮末的"探索结果蒸馏"（`summarizeRunExplorations`）在最终回复之后、`onComplete`（webview 恢复按钮的唯一信号）之前**同步阻塞**执行——一次静默的第二次 LLM 调用。

目标是让 `onComplete` **先于**蒸馏发出、蒸馏异步完成、send 按钮立即恢复——同时保持蒸馏语义不变、磁盘会话仍为压缩版、失败仍静默。

## 功能需求

- **FR1 · send 按钮立即恢复**：作为用户，最后一轮输出结束后 send 按钮**立即**出现（<1s），不再等蒸馏。
  - 验收语义：`onComplete` 在蒸馏**之前**发出；蒸馏不阻塞回合结束。
- **FR2 · 蒸馏语义不变**：作为用户，探索摘要仍落入机器行，下一轮开始时上下文已压缩。
  - 验收语义：蒸馏 promise 在下一轮 `runAgent` 开始（push 用户输入**之前**）被 await；摘要必在下一轮 LLM 调用前就位。
- **FR3 · 磁盘仍为压缩版**：作为用户，磁盘上的会话最终仍是压缩版（与现状行为一致）。
  - 验收语义：蒸馏实际替换历史后触发 `onDistilled` → 再次 `_saveLines`（带 slot 校验防串会话）。
- **FR4 · 失败路径不变**：作为用户，蒸馏失败静默、原始探索结果保留，不影响回合结果与历史。
  - 验收语义：蒸馏 catch 吞掉返回 null（N3），不触发保存回调，历史保持原样。

## 非功能标准

- **N1 竞态安全**：蒸馏替换历史与下一轮 push 输入**互斥**——await 蒸馏必须在 `setupAgentRun`（push 输入）之前，否则新输入会被压缩替换清掉。
- **N2 数据一致性**：会话文件最终为压缩版（与现状一致）；用户快速连发下一条消息不丢输入、不丢摘要；切换会话不串写。
- **N3 可中止**：蒸馏使用 panel 生命周期专用 `distillSignal`（评审 #1，2026-08-25）——**仅 panel dispose / 会话切换时 abort**；用户 Stop（abort 运行 signal）不影响蒸馏——蒸馏异步在回合外，由下一轮开头 await 与保存回调兜底。
- **N4 两端一致**：CLI 与 VS Code 同一时序——结束信号 → 异步蒸馏 → 保存回调；同一挂载点语义（panel/distillState）。
- **N5 可测试**：竞态时序（连发消息）、保存回调触发、slot 校验、失败静默均有测试。

## 变更记录

- 2026-08-25：立项并实施（评审 #1 专用 distillSignal；评审 #2 depth 守卫）。marketplace / Open VSX 0.1.49。
- 2026-09-05：蒸馏发射提为 `fireEndOfRunDistill` 模块函数（run-stages.mjs），蒸馏本体随模块拆分迁 `src/explore-distill.mjs`。
- 2026-09-08：文档重写为人类可读当前态（批 V3b）——机制/时序不变，仅折叠实现流水并更新模块落点。
