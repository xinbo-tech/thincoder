# CHECKPOINT — 需求

> 板块：Checkpoint 事故恢复（快照/回滚保险）。需求层文档（docs/requirements/）。
> 状态：已实现（两端存储统一）。
> 来源：2026-09-10 自 `../design/CHECKPOINT.md` 抽取（需求层拆分批）——本档为需求权威；设计+测试见来源档。

## 1. 机制定位与总体目标

让 agent（及用户）在 git 破坏性操作造成**未提交改动丢失**后，**知道并能使用 checkpoint 机制恢复到操作前状态**。通过四层闭环：

1. **工具描述**（schema）——两端 git 工具的破坏性 action 描述写明"操作前自动快照、可 rewind 恢复"（F1）；
2. **工具输出提示**（checkpoint list）——查看快照列表时识别哪些对应刚发生的事故、可用 rewind 撤销（F2）；
3. **项目文档**（两端 AGENTS.md + 本权威文档）——有可指认的权威恢复流程，不依赖会话记忆（F3）；
4. **系统提示词建议文本**（平台层，交付用户）——agent 决策规则里存在"git 破坏性操作事故 → checkpoint rewind 优先"的映射（F4，见 §5.5）。

**缺口实证**（2026-09-01 02:17）：checkout 误丢弃未提交改动后，agent 检查了 `checkpoint list` 却未尝试 rewind，直接手动重建——说明恢复路径在工具描述与提示文案中完全缺失。机制由此扩展。

**范围**：用户裁定扩展 F5（两端 checkpoint 存储统一为全量副本）、F6（commit 后清空该项目 checkpoint）、F7（git 工具能力补齐）。其中"**不改动核心机制**"的保证**仅限定于 CLI 既有 `snapshotBefore` / `createCheckpoint` / `rewind` / `cat` / `versions` 的执行逻辑**——F5 是 VS Code 端镜像新建，不触及 CLI 既有实现。

**第二机制（commit 清理）**：commit 是该项目 checkpoint 的**生命周期终点**——commit 成功后**清空该项目（cwd）的全部 checkpoint，重新开始跟踪**。语义：commit = 安全点，所有未提交改动已进入 git 历史（commit + reflog 是更强的恢复手段），快照的临时保护使命结束；不再需要内容比较 / 时间窗口等"部分保留"判定（零误判风险）。详见 §3。

---

### 3.4 范围与接受风险

- 非 git cwd（`createNonGitCheckpoint` 变体）无 commit 概念——**不触发清理**（仅受 NF6 上限约束，D6）；
- 两端清理动作一致：删除 `~/.thincoder/checkpoints/{cwdHash12}/` 目录（存储统一后无需 stash 识别）；
- 清理发生在 commit 成功之后；**commit 失败 / 中断绝不触发清理**；
- 接受风险（用户已认可）：commit 后、下一次破坏性操作前，untracked 改动不在快照保护内（重新跟踪的窗口）——commit 是安全点，此窗口可接受。

---

### 非功能性约束（NF1–NF7）

| # | 约束 |
|---|---|
| NF1 | **描述精简**：schema 描述文本增量 ≤ 60 字符/处（保持工具描述可读性，不冗长） |
| NF2 | **核心机制不动**：CLI 既有 `snapshotBefore` / `createCheckpoint` / `rewind` / `cat` / `versions` 执行逻辑不改；唯一例外 = `createCheckpoint` 末尾追加 NF6 上限检查（新增机制非既有逻辑修改）；其余改动 = 描述字符串、输出提示行、文档 + F5–F7 新机制 |
| NF3 | **测试**：两端全量测试保持全绿；schema 描述 / 输出文本断言测试随改动更新 |
| NF4 | **幂等**：checkpoint list 提示行为单行、固定文本，不随调用次数累积 |
| NF5 | **双向生效**：CLI 与 VS Code 两端同步落地（共享事故场景，单端落地无效） |
| NF6 | **上限兜底**：不 commit 的 cwd 仍会累积——每 cwd 快照上限 **100** + **最旧淘汰**，防清理触发缺失时爆炸 |
| NF7 | **清理原子性**：commit 清理先于结果返回或异步执行均须保证——commit 失败/中断绝不触发清理；清理本身失败不阻断 commit 结果（best-effort，与 `snapshotBefore` 同哲学） |
