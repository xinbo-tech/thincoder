# ThinCoder 设计文档地图（docs/design/）

> 本文件是 `docs/design/` 的板块登记表与归属规则——写/改设计文档前**先查这里**。
> 核心纪律：**一个板块一个文档**；功能点并入所属板块文档（不新建）；新板块才新建并在此登记；同一机制只在一处详述（权威源），其余文档引用、不复制。

## 板块 → 文档映射

| 板块 | 文档文件 | 备注 |
|---|---|---|
| 架构 | `ARCHITECTURE.md` | 权威源。`ARCHITECTURE-v2.md`（2026-08 方向性草案，v2 团队记忆，未启动）归档保留，不合并——启动 v2 时以其为输入 |
| 需求与决策 | `REQUIREMENTS.md` | 需求讨论记录 |
| 功能全览 | `FEATURES.md` | |
| 三观（提示词根基） | `PHILOSOPHY.md` | |
| 方法论 | `METHODOLOGY.md` | 与仓库根 METHODOLOGY.md 对应 |
| 会话 | `SESSION.md` | |
| 上下文压缩 | `CONTEXT-COMPACTION.md` | |
| 路线图（历史） | `ROADMAP-0.9.0.md` | 0.9.0 已发布过，历史路线图归档保留 |
| 发布流程 | `RELEASE.md` | npm 发布流程 + 踩坑记录（2026-08-25） |
| CLI Lint 引入 | `CLI-LINT-REQUIREMENTS.md`、`CLI-LINT-TUNING.md` | ~~ESLint 引入 + 21 error 清零（2026-08-25）~~——**被 TOOLS.md §10.2 取代（2026-09-02）**：ESLint 全套删除，改零依赖 check-syntax（node --check） |
| Design Token 硬化 | `ENG-TOKEN-BINDING-REQUIREMENTS.md`、`ENG-TOKEN-BINDING-TUNING.md` | v2 收窄：安全修复（双后门/复活陷阱）+ TTL 7 天可配（2026-08-25，v1 内容绑定被实况否决见文档考古） |
| 覆盖率缺口修复 | `COVERAGE-GAPS-REQUIREMENTS.md`、`COVERAGE-GAPS-TUNING.md` | 遗留测试覆盖收口（2026-08-25） |
| 轮末蒸馏异步化 | `SEND-STALL-DISTILL-REQUIREMENTS.md`、`SEND-STALL-DISTILL-TUNING.md` | send 按钮卡顿修复：结束信号先行、蒸馏异步（2026-08-25） |
| 工具移除 | `SLEEP-REMOVAL-REQUIREMENTS.md`、`SLEEP-REMOVAL-TUNING.md` | sleep 工具删除（2026-08-25） |
| 工具输出限制 | `TOOL-OUTPUT-LIMITS-REQUIREMENTS.md`、`TOOL-OUTPUT-LIMITS-TUNING.md` | 落盘阈值/显示层 16K→64K（2026-08-24） |
| Agent 运行参数 | `AGENT-PARAMS-REQUIREMENTS.md`、`AGENT-PARAMS-TUNING.md` | 评审超时/轮次上限调整（2026-08-24） |
| Agent 循环 | `AGENT-LOOP.md` | 权威源。`TURN-CAP-CONTINUE.md`（撞墙可继续，已实现专题）同板块独立保留——机制自成一体 |
| 工程模式 | `ENGINEERING-MODE.md` | 权威源。`ENGINEERING-WORKLOOP.md`（已固化进 engineering.md 提示词）同板块保留——历史决策记录 |
| 评审收敛 | `ADVISOR-CONVERGENCE.md` | |
| 工具系统 | `TOOLS.md` | 权威源。`MCP.md`（MCP 机制规范）、`VERIFY-DOCONLY.md`（doc-only 快路径）同板块独立保留——均为已实现专题 |
| Checkpoint 事故恢复 | `CHECKPOINT.md` | 快照/回滚机制 + 两端存储统一 + commit 清理（2026-09-01 定稿） |
| 编辑工具可靠性 | `EDIT-TOOL-EOL-REQUIREMENTS.md`、`EDIT-TOOL-EOL-DESIGN.md` | edit/apply_patch/hashline_edit/write 行尾语义 + edit 候选提示 + 编码探测（2026-08-26，走查痛点实证；两端实现） |
| TUI | `TUI.md` | 权威源。`TUI-INPUT-BOX.md`（输入框行为契约）、`TUI-TOOL-OUTPUT.md`（工具输出渲染）同板块独立保留——专题契约各自维护 |
| 记忆 | `MEMORY.md` | |
| Provider | `PROVIDER.md` | |
| Proxy | `PROXY.md` | |
| 提示词架构 | `PROMPT-DECOUPLING.md` | |
| ACP 协议 | `ACP-CLIENT.md` | |
| 会诊 | `CONSULTATION.md` | |
| 飞刀 | `ESCALATE.md` | |
| 评估 | `EVALUATION.md` | 权威源。`COMPETITIVE-CLI-2026.md`（2026-08-04 时点竞评快照）归档保留，不合并 |
| 路线图 | `ROADMAP-0.9.0.md` | |
| 参考项目分析 | `KIMI-CODE-PROMPT-ANALYSIS.md`、`TTSR-ANALYSIS.md` | 各自独立主题（不同参考项目），不合并 |

## 规则

1. **一个板块一个文档**：新功能点不新建文档，并入所属板块的现有文档（追加变更段或更新章节）。
2. **先查地图定位归属**：写文档前先查本表——找到所属板块就改该板块文档，**不得为既有板块新建文件**。
3. **新板块才新建**：确无归属的新板块才新建文档，并立即在本表登记。
4. **单一权威源**：同一机制只在一处详述；其余文档引用（指路），不复制内容——多处复制必然漂移矛盾。
5. **存量碎片处理（2026-08-25 收口）**：历史"待合并（TODO）"标注已全部处理——真碎片已合并（vscode Settings 6→1），方向性/时点文档明确为归档，已实现专题明确为独立保留。新增同主题内容须先查本表归属。

## 变更记录

- 2026-08-21：初版（文档归属纪律，规格见 `AGENT-LOOP.md` §12）
- 2026-08-24：新增板块「Agent 运行参数」（AGENT-PARAMS-*）与「工具输出限制」（TOOL-OUTPUT-LIMITS-*）
- 2026-08-25：新增板块「轮末蒸馏异步化」（SEND-STALL-DISTILL-*）、「工具移除」（SLEEP-REMOVAL-*）、「覆盖率缺口修复」（COVERAGE-GAPS-*）、「CLI Lint 引入」（CLI-LINT-*）与「发布流程」（RELEASE.md）；ROADMAP-0.9.0.md 归档标注（0.9.0 已过，现 0.12.x）
- 2026-09-01：新增板块「Checkpoint 事故恢复」（CHECKPOINT.md，需求+设计+测试三层定稿）
- 2026-09-02：CLI Lint 板块（CLI-LINT-*）标记**被 TOOLS.md §10.2 取代**——ESLint 全套删除，改零依赖 check-syntax（node --check）