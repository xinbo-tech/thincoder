# ThinCoder 设计文档地图（docs/design/）

> 本文件是 `docs/design/` 的板块登记表与归属规则——写/改设计文档前**先查这里**。
> 核心纪律：**一个板块一个文档**；功能点并入所属板块文档（不新建）；新板块才新建并在此登记；同一机制只在一处详述（权威源），其余文档引用、不复制。

## 板块 → 文档映射

| 板块 | 文档文件 | 备注 |
|---|---|---|
| 架构 | `ARCHITECTURE.md` | 权威源。`ARCHITECTURE-v2.md`（v2 团队记忆）同板块——**待合并（TODO）** |
| 需求与决策 | `REQUIREMENTS.md` | 需求讨论记录 |
| 功能全览 | `FEATURES.md` | |
| 三观（提示词根基） | `PHILOSOPHY.md` | |
| 方法论 | `METHODOLOGY.md` | 与仓库根 METHODOLOGY.md 对应 |
| 会话 | `SESSION.md` | |
| 上下文压缩 | `CONTEXT-COMPACTION.md` | |
| Agent 循环 | `AGENT-LOOP.md` | 权威源。`TURN-CAP-CONTINUE.md`（撞墙可继续）同板块——**待合并（TODO）** |
| 工程模式 | `ENGINEERING-MODE.md` | 权威源。`ENGINEERING-WORKLOOP.md`（工作循环）同板块——**待合并（TODO）** |
| 评审收敛 | `ADVISOR-CONVERGENCE.md` | |
| 工具系统 | `TOOLS.md` | 权威源。`MCP.md`（MCP 机制统一规范）、`VERIFY-DOCONLY.md`（verify 文档快路径）同板块——**待合并（TODO）** |
| TUI | `TUI.md` | 权威源。`TUI-INPUT-BOX.md`、`TUI-TOOL-OUTPUT.md` 同板块——**待合并（TODO）** |
| 记忆 | `MEMORY.md` | |
| Provider | `PROVIDER.md` | |
| Proxy | `PROXY.md` | |
| 提示词架构 | `PROMPT-DECOUPLING.md` | |
| ACP 协议 | `ACP-CLIENT.md` | |
| 会诊 | `CONSULTATION.md` | |
| 飞刀 | `ESCALATE.md` | |
| 评估 | `EVALUATION.md` | 权威源。`COMPETITIVE-CLI-2026.md`（竞争评估）同板块——**待合并（TODO）** |
| 路线图 | `ROADMAP-0.9.0.md` | |
| 参考项目分析 | `KIMI-CODE-PROMPT-ANALYSIS.md`、`TTSR-ANALYSIS.md` | 各自独立主题（不同参考项目），不合并 |

## 规则

1. **一个板块一个文档**：新功能点不新建文档，并入所属板块的现有文档（追加变更段或更新章节）。
2. **先查地图定位归属**：写文档前先查本表——找到所属板块就改该板块文档，**不得为既有板块新建文件**。
3. **新板块才新建**：确无归属的新板块才新建文档，并立即在本表登记。
4. **单一权威源**：同一机制只在一处详述；其余文档引用（指路），不复制内容——多处复制必然漂移矛盾。
5. **存量待合并**：表中标注"待合并（TODO）"的是存量碎片，合并不在此表范围内直接进行——统一记录于 `docs/TODO.md`。

## 变更记录

- 2026-08-21：初版（文档归属纪律，规格见 `AGENT-LOOP.md` §12）
