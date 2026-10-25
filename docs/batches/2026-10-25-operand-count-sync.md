# 2026-10-25 · 操作数族判据源同步：六名 → 七名（五处机械改）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-25 · 来源 = 台账 #1775（操作数族判据源五处仍写「六名」——代码已七名，判据源同步归另批）。
> 台账 = #1775（PROMPT-SYSTEM · 归批）。前情 = 2026-10-25-stale-runner-refs.md（已收口 2026-10-25）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-25

**本批 = 一笔**：操作数族判据源同步（六名 → 七名）。

| 落点 | 改了什么 |
|---|---|
| `thincoder-core/tool-docs/doc_check.md:12-18` | Six→Seven + RTM.md 入列 + 全免说明 |
| `docs/core/design/PROMPT-SYSTEM.md:186` | 操作数族清单加 RTM.md |
| `docs/core/design/PROMPT-SYSTEM.md:193` | J1 白名单加 RTM.md |
| `docs/core/design/PROMPT-SYSTEM.md:195` | J3「六名」改「七名」 |
| `docs/core/design/PROMPT-SYSTEM.md:4138` | D-PS6 保留面清单加 RTM.md |

**核销**：#1775。

> 不适用：§2 —— 机械修正（一词改+一名增），无设计席段
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
| `tool-docs/doc_check.md:12` | "Seven names count as operands" |
| `tool-docs/doc_check.md:18` | `RTM.md` 入列 |
| `PROMPT-SYSTEM.md:186` | 操作数族清单含 `RTM.md` |
| `PROMPT-SYSTEM.md:193` | J1 白名单含 `RTM.md` |
| `PROMPT-SYSTEM.md:195` | J3「七名」 |
| `PROMPT-SYSTEM.md:4138` | D-PS6 保留面含 `RTM.md` |

**核销**：#1775。
