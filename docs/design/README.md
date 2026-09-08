# ThinCoder 设计文档地图（docs/design/）

> 本文件是 `docs/design/` 的板块登记表与归属规则——写/改设计文档前**先查这里**。
> 文档格式债清理批 A1（2026-09-07）：归档 8 文件移 `_archive/`，地图更新引用；格式正常化。

## 核心纪律

**一个板块一个文档**；功能点并入所属板块文档（不新建）；新板块才新建并在此登记；同一机制只在一处详述（权威源），其余文档引用、不复制。

## 板块 → 文档映射

| 板块 | 文档文件 | 备注 |
|---|---|---|
| 架构 | `ARCHITECTURE.md` | 权威源。`ARCHITECTURE-v2.md`（v2 草案，未启动）已移 `_archive/` |
| 需求与决策 | `REQUIREMENTS.md` | 需求讨论与决策记录 |
| 功能全览 | `FEATURES.md` | 基于代码现状梳理 |
| 三观（提示词根基） | `PHILOSOPHY.md` | |
| 方法论 | `METHODOLOGY.md` | 与仓库根 METHODOLOGY.md 对应 |
| 会话 | `SESSION.md` | |
| 上下文压缩 | `CONTEXT-COMPACTION.md` | |
| 路线图（历史） | `_archive/ROADMAP-0.9.0.md` | 0.9.0 已发布，历史路线图已归档 |
| 发布流程 | `RELEASE.md` | npm 发布流程 + 踩坑记录 |
| CLI Lint 引入 | ~~`CLI-LINT-*.md`~~ | 已移 `_archive/`——被 TOOLS.md §10.2 取代（eslint 删除） |
| Design Token 硬化 | `ENG-TOKEN-BINDING-REQUIREMENTS.md`、`ENG-TOKEN-BINDING-TUNING.md` | v2 收窄：安全修复 + TTL 7 天可配 |
| 覆盖率缺口修复 | `_archive/COVERAGE-GAPS-REQUIREMENTS.md`、`_archive/COVERAGE-GAPS-TUNING.md` | 已移 `_archive/`——测试清零政策取代（锁测试断言产物已删） |
| 轮末蒸馏异步化 | `SEND-STALL-DISTILL-REQUIREMENTS.md`、`SEND-STALL-DISTILL-TUNING.md` | 已完成专题记录 |
| 工具移除 | `_archive/SLEEP-REMOVAL-REQUIREMENTS.md`、`_archive/SLEEP-REMOVAL-TUNING.md` | 已移 `_archive/`——sleep 删除被 wait_for（TOOLS.md §16）取代 |
| 工具输出限制 | `TOOL-OUTPUT-LIMITS-REQUIREMENTS.md`、`TOOL-OUTPUT-LIMITS-TUNING.md` | 落盘阈值/显示层 |
| Agent 运行参数 | `AGENT-PARAMS-REQUIREMENTS.md`、`AGENT-PARAMS-TUNING.md` | 评审超时/轮次上限 |
| Agent 循环 | `AGENT-LOOP.md` | 权威源。`TURN-CAP-CONTINUE.md`（撞墙可继续，已实现专题）同板块独立保留 |
| 子代理观测/注入 | `SUBAGENT-OBSERVE-SEND.md` | 父侧 observe(查进度)+send(注入引导) 运行中子代理；VSC 同名对应——同机制各自独立 |
| async 结果容器统一 | `ASYNC-RESULT-CONTAINER.md` | settle 共享 helper/pending 单容器+role/池 accessor/buildChildSignal；VSC 同名对应——同机制各自独立 |
| eng 会话态/provider 清理 | `ENG-SESSION-PROVIDER-CLEANUP.md` | Top-8 #5/#6/#8 攒批——eng 会话态统一（双归属/死代码/命名漂移）+ provider 防御三件套去重；两实现线文件零冲突可并行 |
| 编辑工具（板块） | `EDIT.md`、`HASHLINE-EDIT.md`、`INSERT-AFTER.md`、`APPLY-PATCH.md`、`WRITE.md` + `EDIT-HELPERS.md`（共享 helper） | 每工具一档（2026-09-08 重组——TOOLS.md §6 退地图）。edit：按行号改+模糊匹配+替换即删；原 EDIT-TOOL-IMPROVEMENT/EOL-REQUIREMENTS/EOL-DESIGN 已并档归档。VSC 同名对应——同机制各自独立 |
| memory 工具完善 | `MEMORY.md` §6.2（delete 工具语义修正/layer 统一段——2026-09-08 并入所属板块文档，原 MEMORY-TOOL-SCOPE-FIX.md 作废删除） | scope 参数改名 layer + delete layer 可选 + 工具描述重写；VSC 同名对应——同机制各自独立 |
| 工程模式 | `ENGINEERING-MODE.md` | 权威源。`ENGINEERING-WORKLOOP.md`（已固化进 engineering.md）已移 `_archive/` |
| 评审收敛 | `ADVISOR-CONVERGENCE.md` / `ADVISOR-VERDICT-TEMPLATE.md`（裁决行模板——L50——2026-09-09） | |
| 设计评审凭证结算 | `DESIGN-TOKEN-SETTLEMENT.md` | async 评审 token 结算根治（settle 当场落盘/门禁读权威/废旧镜像）；VSC 同名对应——同机制各自独立 |
| 工具系统 | `TOOLS.md` | 权威源。`MCP.md`（MCP 机制规范）、`SETTINGS-TOOL.md`（settings 工具）同板块独立保留；`VERIFY-REDESIGN.md`（verify 重构——doc-only 快路径已由本档 D-V5 接管，前身 `VERIFY-DOCONLY.md` 并入后归档） |
| Checkpoint 事故恢复 | `CHECKPOINT.md` | 快照/回滚机制 + 两端存储统一 |
| 诊断事件日志 | `LOGGING.md` | 常驻事件骨架日志 |
| TUI | `TUI.md` | 权威源。`TUI-INPUT-BOX.md`、`TUI-TOOL-OUTPUT.md` 同板块独立保留 |
| 记忆 | `MEMORY.md` | |
| Provider | `PROVIDER.md` | |
| Proxy | `PROXY.md` | |
| 提示词架构 | `PROMPT-DECOUPLING.md` | |
| ACP 协议 | `ACP-CLIENT.md` | |
| 会诊 | `CONSULTATION.md` | |
| 飞刀 | `ESCALATE.md` | |
| 评估 | `_archive/EVALUATION.md`、`_archive/COMPETITIVE-CLI-2026.md` | 均为竞评快照（时点数据，勿引用为现状）——已移 `_archive/` |
| 参考项目分析 | ~~`KIMI-CODE-PROMPT-ANALYSIS.md`/`TTSR-ANALYSIS.md`~~ | 已移 `_archive/` |
| 测试基建 | `TESTING.md` | 测试分层纪律/库存治理 |
| 多实例协作感知 | `MULTI-INSTANCE-COLLAB.md` | 多副本 agent 协作感知 |
| 结构债 | `STRUCTURE-DEBT.md` | 结构债评估与清理路线图（横切） |
| 结构债批执行 | `STRUCTURE-DEBT.md` §7（分批路线——批档清单）+ 批专属档（本行自登记例：`STRUCTURE-DEBT-BATCH-5-6.md`——2026-09-08 批） | 横切结构债每批独立成档（文档批/代码批同规格）；不逐档裸列（批量清单指 §7——免重复漂移）——新批档落档时同步本行 |

## 归属规则

1. **一个板块一个文档**：新功能点不新建文档，并入所属板块的现有文档（追加变更段或更新章节）。
2. **先查地图定位归属**：写文档前先查本表——找到所属板块就改该板块文档，**不得为既有板块新建文件**。
3. **新板块才新建**：确无归属的新板块才新建文档，并立即在本表登记。
4. **单一权威源**：同一机制只在一处详述；其余文档引用（指路），不复制内容——多处复制必然漂移矛盾。
5. **存量碎片处理（2026-08-25 收口 + 2026-09-07 归档清理）**：方向性/时点/被取代文档移 `_archive/`；已实现专题独立保留。新增同主题内容须先查本表归属。
6. **文档人类可读（2026-09-07 防复发）**：写/改本文档映射内任一 `docs/design/` 文档须人类可读——**无 >300 字符单行**（整节/表/规则不得压成一行）、**markdown 结构正确**（标题/表格/代码块不被吞进正文，空行隔离节）、**变更记录折叠**（新变更落一行注记，不堆逐批需求/评审/测试流水账）。违反即文档格式债，与源码 500 行硬限同理。批量检查：`node scripts/check-doc-width.mjs`（扫 docs/design/ 无 >300 单行）。

## 变更记录

- 2026-08-21：初版（文档归属纪律）。
- 2026-08-24：新增「Agent 运行参数」「工具输出限制」。
- 2026-08-25：新增「轮末蒸馏异步化」「工具移除」「覆盖率缺口修复」「CLI Lint 引入」「发布流程」；ROADMAP-0.9.0 归档标注。
- 2026-09-01：新增「Checkpoint 事故恢复」。
- 2026-09-02：CLI Lint 板块标记被 TOOLS.md §10.2 取代。
- 2026-09-03：新增「诊断事件日志」。
- 2026-09-05：新增专题「settings 工具」。
- 2026-09-06：provider 数量修正（17→20）；新增「测试基建」「多实例协作感知」；SESSION.md §12；token 生命周期语义修订。
- 2026-09-07：新增「结构债」（STRUCTURE-DEBT.md）；verify 重构（VERIFY-REDESIGN.md）；**归档 8 文件移 `_archive/`**（ARCHITECTURE-v2/ROADMAP-0.9.0/COMPETITIVE-CLI-2026/KIMI-CODE-PROMPT-ANALYSIS/TTSR-ANALYSIS/ENGINEERING-WORKLOOP/CLI-LINT-REQUIREMENTS/CLI-LINT-TUNING）；地图格式正常化。
- 2026-09-07：归属规则加**规则 6（文档人类可读防复发）**——无 >300 字符单行 / markdown 结构正确 / 变更记录折叠；配 `scripts/check-doc-width.mjs` 批量检查。
- 2026-09-08：新增「结构债批执行」板块行——批专属档自登记（STRUCTURE-DEBT-BATCH-5-6；批量清单指 STRUCTURE-DEBT.md §7，不逐档裸列）。
