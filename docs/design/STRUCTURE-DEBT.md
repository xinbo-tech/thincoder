# 结构债评估与清理路线图（STRUCTURE-DEBT）

> 板块：结构债（横切——跨多板块的架构/文档/状态债评估与清理）。权威源指向：`docs/design/README.md` 地图登记 + 本文档（路线图）。
> 状态：**评估 2026-09-07 fresh scan 完成**；清理按分批推进（每批独立走设计→评审→eng-coder）。
> 范围：thincoder（CLI）+ thincoder-vscode（VSC）双树。不属单一功能板块，独立成档。

## 1. 目的

记录跨双仓的**结构债（屎山度）评估**与**分批清理路线**。结构债病痛与治疗时机错开（平时无症状、撞上才暴露），靠文档显式追踪防止"挂账不处理"。每批独立立项（设计→评审→实现），本档是分批入口路由。

## 2. 评估方法（2026-09-07 fresh scan）

只读 thorough：双树逐目录字节探针 → ≥14KB 源码 offset 探针取精确行数 → 状态层/工具层 grep 全树。排除无关树（ai-gateway/kimi-code/oh-my-pi/thin4/thin5）。**已消解项不计债**：测试清零（.test.mjs=0）、verify 通用门禁重构、TOOLS.md 重写、多数文件尺寸债。

## 3. 已消解（勿当债）

- 测试文件全清零（.test.mjs=0，按需新加政策）
- verify 工具本体重构为通用门禁（CLI 280/VSC 322 行）
- TOOLS.md 重写干净（13.2KB，唯一格式干净大件）
- 早期文件尺寸债大部消散（agent.mjs 530→396、session-slots 拆分等）

## 4. Top-8 结构债（2026-09-07 实测）

### #1 设计文档单行整节坏格式（🔴 高 · 最高债）

**现象**：设计文档 markdown 结构性损坏——整节/表/规则压成单行，标题被吞进正文。
- `AGENT-LOOP.md` 537.8KB（全树最大，比多数源码大 10×）——数百超长单行挤节
- `docs/design/README.md` L1/2/39/43（CLI）+ L1 整文件（VSC）——地图自身违反自己定的格式纪律
- `docs/TODO.md` 单行巨型条目
- VSC `ARCHITECTURE/RELEASE/ESCALATE/PHILOSOPHY/COMPETITIVE_ANALYSIS/CONSULTATION/SETTINGS/REQUIREMENTS/TURN-CAP-CONTINUE/TODO` 多文档 L1 整文件压一行
- CLI `ADVISOR-CONVERGENCE/ACP-CLIENT` 等标题被吞进 prose/表格

**样板**：TOOLS.md 重写（2026-09-07）——按行拆章节、空行隔离表格/标题/规则/变更记录。

### #2 双端 async 状态容器分叉（🔴 高 · 最重状态债）

**现象**：CLI agent 对象进程常驻挂池/pending 于 agent.*；VSC agent per-run 重建、池/pending 挂共享 history 数组 + alias。
- 双查询：`history?._X ?? agent._X`（advisor-async/consult/scheduler/wait_for）
- 双删：`_asyncAdvisors?.delete` ×2（advisor-async:272-279 同文件 4 行重复删）
- 容器名分叉：VSC 单独 `_pendingAdvisorResults` vs CLI 折叠进 `_pendingAsyncResults`；VSC 5 pending 族 vs CLI 3
- 共享工具 ops.mjs:157-162 被迫写死双载体分支

**方向**：统一 session-scoped 单载体容器 + 只读 accessor（吸收 alias），命名对齐双端。

### #3 `_` 状态字段摊平面对象 + 手写生命周期（🟠 中高）

**现象**：createAgent 一次性初始化 ~30 `_` 字段 + 运行期动态 ~30，无 schema/封装，摊 ≥18 文件读写。
- reset（session.mjs:424-446 逐字段清）/继承（agent.mjs:134 for-8 键手抄）靠手写清单
- 新增/漏删字段即状态泄漏

**方向**：归组为 run-scoped / session-scoped / guard 三 capsule，reset/继承收进 capsule 方法。

### #4 eng-token TTL 双端分叉重复（🟠 中高 · 镜像固有）

**现象**：CLI 集中 token-ttl.mjs；VSC 无法 import，在 advisor-async/advisor/subagent-spawn-gate/eng/run-helpers 4+ 文件重实现 + 自有槽持久化。
**方向**：若双端继续分离，把 token 语义段抽双端逐字锚文档统一照抄 + 镜像断言。

### #5 CLI system.mjs 506 行塞 4 工具（🟡 中）

**现象**：一个文件塞 bash+glob+grep+ls 四工具 + gitGuardSnapshot，超 500 硬限；VSC 已拆 shell.mjs/search.mjs，CLI 未拆。
**方向**：按 VSC 先例拆（bash 族/搜索族）。

### #6 工具寄生/名不符实（🟡 中低）

**现象**：CLI questionTool 寄生 git.mjs:351（VSC 已拆 question.mjs）；VSC more-file.mjs 塞 insert_after/apply_patch/ls/delete 四工具。
**方向**：question 归位独立；more-file 更名/再拆；对齐双端镜像。

### #7 async settle 逻辑重复（🟡 中低）

**现象**：settle→pending+waiter 唤醒+`_asyncSettleSeq` 同构逻辑 4 文件重复（subagent-run:181/advisor-async:480/escalate-async:271/consult:140）；kill-tree ×3；abort 双保险（system.mjs:150-182）。
**方向**：抽共享 settle 收尾 helper。

### #8 跨仓复制漂移（🟠 中 · 架构伞项）

**现象**：state/tools/prompts/advisor 层双端整片存在，靠镜像锚/fork；#2/#4/#6 是复制漂移的具体表现。
**方向**：维持语义锚文档为唯一权威源 + 双端镜像断言，收缩自由复制面。

## 5. 源码 >500 行清单（实测，仅 2 处）

| 文件 | 行数 | 状态 |
|---|---|---|
| CLI `src/tools/system.mjs` | 506 | 超硬限——见 #5 |
| CLI `src/agent-tools/advisor-async.mjs` | 538 | 超硬限（最近 R13/§24 增量推过限）——本批 R13 相关设计已在动，拆分宜随 R13 后续批处理 |

advisory 400-500 带（CLI advisor/run 499、session 483、session-slots 476、memory/core 300（delete 族 2026-09-08 拆分 delete.mjs 234）、docs 414（>300 建议线——memory 工具层 2026-09-08 改动后 406→414，既有债观察）、subagent-actions 463、file 443、acp 443、consult 443、shared 447、config 428、dispatch 435；VSC subagent 488、file-edit 456、subagent-async 451、execute-tools 439、suspension 422）——均 <500 不触发硬限，记录观察。

## 6. 分批清理路线

| 批 | 债 | 规模 | 建议时序 |
|---|---|---|---|
| 批 A | #1 文档格式债（双端 ~70 坏格式文档重写为人类可读） | **超大** | 本档 §7 详列分批；已启（归档 8 文件已移） |
| 批 B | #5 system.mjs 拆分 + #6 工具归位 | 中 | 独立清理批（TOOLS.md 尾 TODO 已记"拆分会动整个工具组"） |
| 批 C | #7 settle 逻辑去重 + abort 去双保险 | 小中 | 抽 helper |
| 批 D | #3 `_` 字段归组 capsule | 大 | 高收益，需设计（状态归属重构） |
| 批 E | #2 async 容器统一单载体 | 大 | 最深状态债，需设计（可能依赖批 D） |
| 批 F | #4 token TTL 双端对齐 + #8 镜像锚纪律 | 中 | 维持纪律防退化 |

每批独立走工程模式（设计→评审→eng-coder）。本档只路由，不承载单批设计正文（设计落各自板块文档或批专属设计文档）。

## 7. 批 A——文档格式债清理计划（2026-09-07 用户裁定推进）

**目标**：双端全部坏格式设计文档重写为**人类可读** markdown（领导审核级）。方法 = TOOLS.md 样板（用户裁定"统一"）：**保留当前机制正文，历史变更流水账折叠/精简**。

**人类可读验收判据**：①无 >300 字符单行；②markdown 结构正确（表格/标题/列表/规则用空行 + 换行正确分隔，标题不被吞进正文）；③历史逐批记录（需求/设计/测试/核销考古）折叠为当前态 + 一句变更记录；④文档与实现漂移处更新。

**处置分类（用户裁定 2026-09-07）**：
- **归档 _archive/**：纯历史/方向草案/参考分析/被取代（已移 8：ARCHITECTURE-v2、ROADMAP-0.9.0、COMPETITIVE-CLI-2026、KIMI-CODE-PROMPT-ANALYSIS、TTSR-ANALYSIS、ENGINEERING-WORKLOOP、CLI-LINT-REQUIREMENTS、CLI-LINT-TUNING）
- **保留 + 重写为可读**：所有当前生效设计文档，含已完成专题的 REQUIREMENTS/TUNING 对（已实现 = 独立保留，非被取代 = 不归档）

**CLI 批（docs/design/）**——按域分批，每批独立 eng-coder：

| 子批 | 文件 | 特征 |
|---|---|---|
| A1 | README.md（地图自坏）、REQUIREMENTS.md、FEATURES.md | 小，先清（领导最可能先看） |
| A2 | ARCHITECTURE.md、PHILOSOPHY.md、METHODOLOGY.md、PROXY.md | 架构/三观/方法论权威 |
| A3 | AGENT-LOOP.md、ENGINEERING-MODE.md、ADVISOR-CONVERGENCE.md、MULTI-INSTANCE-COLLAB.md | 机制权威（AGENT-LOOP 314KB 最大） |
| A4 | SESSION.md、CONTEXT-COMPACTION.md、MEMORY.md、PROVIDER.md、CONSULTATION.md、ESCALATE.md | 会话/记忆/Provider/协作 |
| A5 | TOOLS.md(已清)、MCP.md、CHECKPOINT.md、SETTINGS-TOOL.md、EDIT-TOOL-EOL-{REQ,DESIGN}、ACP-CLIENT.md | 工具/机制 |
| A6 | TUI.md、TUI-INPUT-BOX.md、TUI-TOOL-OUTPUT.md、PROMPT-DECOUPLING.md、VERIFY-DOCONLY.md | UI/提示词 |
| A7 | 已实现专题对：AGENT-PARAMS-{REQ,TUN}、TOOL-OUTPUT-LIMITS-{REQ,TUN}、COVERAGE-GAPS-{REQ,TUN}、SEND-STALL-DISTILL-{REQ,TUN}、SLEEP-REMOVAL-{REQ,TUN}、ENG-TOKEN-BINDING-{REQ,TUN}、EVALUATION.md、FEATURES.md、RELEASE.md | 已完成专题（保留重写为可读） |
| A8 | docs/TODO.md（巨型单行条目）、docs/guides/ides.md | 根 docs |

**VSC 批（thincoder-vscode/docs/design/）**——镜像：

| 子批 | 文件 | 特征 |
|---|---|---|
| V1 | README.md、ARCHITECTURE.md（**整文件 1 行 96KB 最极端**）、RELEASE.md、REQUIREMENTS.md | 大件/极端 |
| V2 | PHILOSOPHY.md、PROJECT-SWITCHER.md、TURN-CAP-CONTINUE.md、SETTINGS.md | 权威/专题 |
| V3 | 已完成专题对（AGENT-PARAMS/COVERAGE-GAPS/ENG-TOKEN-BINDING/SEND-STALL/SLEEP-REMOVAL/TOOL-OUTPUT-LIMITS）+ SETTINGS-PANEL/REORG/SUBMODEL/MODEL-PICKER-UNIFY/RESPONSES-TRANSPORT/webview-input-lag | 专题 |
| V4 | CONSULTATION.md、ESCALATE.md + docs/COMPETITIVE_ANALYSIS.md | 协作/参考 |
| V5 | VSC docs/TODO.md | 根 docs |

**每子批交付**：eng-coder 重写该批文件为可读（保留当前机制 + 折叠历史），git mv 任何发现应归档的到 _archive。验收 = 人类可读判据 4 条 + node --check 无关（纯 md）+ lint。双端同文件域不重叠故可并行 eng-coder。

## 变更记录

- 2026-09-07：立项。fresh scan（explore）完成——双树结构债评估 + top-8 + 已消解项核实。落本档。结构债此前已部分登记 docs/TODO.md（system.mjs 拆分、verify.mjs 拆分等），本档为横切总账。
- 2026-09-07：批 A 启动（文档格式债）。归档 8 文件移 _archive（纯历史/被取代）。§7 落详细分批计划（CLI A1-A8 + VSC V1-V5 + 人类可读判据 4 条 + 处置分类）。用户裁定：处置 = 被取代归档 / 已实现保留重写；方法 = TOOLS.md 样板统一。
