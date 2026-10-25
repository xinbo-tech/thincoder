# 2026-10-25 · 验收命令补相关子集形（三面同改）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-25 · 来源 = 台账 #1772（替换形单档 ⇒ 多档 ∥ 子集——评审 #59 🟡① 延后项）。
> 台账 = #1772（TESTING · 归批）。前情 = 2026-10-25-operand-count-sync.md（已收口 2026-10-25）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-25

**本批 = 一笔**：验收命令句补「相关子集」形（三面同改 + 设计档逐字块同步）。

| 落点 | 改了什么 |
|---|---|
| `thincoder-core/prompts/discipline-engineering.md:198` | `the changed-face unit test file (\`node --test <file>\`)` → `the changed-face unit test file or files (\`node --test <file> [<file> ...]\`)` |
| `thincoder-core/prompts/advisor-design.md:60` | 同上 |
| `thincoder-core/prompts/persona-eng-designer.md:115` | 同上 |
| `docs/core/design/PROMPT-SYSTEM.md` §6.51 B1a/B1b/B1c 逐字块 | 同步改 |

**核销**：#1772。

> 不适用：§2 —— 缺陷修复面（实现与需求 F1 背离），父侧直接执行，无设计席段
> 不适用：§3 —— 轻通道（机械修正，无新语义），无设计评审
> 不适用：§4 —— 轻通道收口（批准面 = 本笔披露行，无独立设计待批）
## §2 批次任务与设计（eng-designer）
**状态行**：（eng-designer 写入时更新）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试覆盖 / 验收对照 / 关键决策 / 上抛项>
## §3 设计评审（评审子代理）
## §4 用户批准（主 agent）
## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）

## 验证与收口

**父侧复核**（逐条实读）：

| 落点 | 现文 |
|---|---|
| `discipline-engineering.md:198` | `the changed-face unit test file or files (\`node --test <file> [<file> ...]\`)` |
| `advisor-design.md:60` | 同上 |
| `persona-eng-designer.md:115` | 同上 |
| `PROMPT-SYSTEM.md` 逐字块 ×7 处 | 全部同改 |

**doc_check 产品门**：四面零命中。

**核销**：#1772。
