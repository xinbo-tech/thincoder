# 结构债评估与清理路线图（STRUCTURE-DEBT）

> 板块：结构债（横切——跨多板块的架构/文档/状态债评估与清理）。权威源指向：`docs/README.md` 地图登记 + 本文档（路线图）。
> 状态：**评估 2026-09-07 fresh scan 完成**；清理按分批推进（每批独立走设计→评审→eng-coder）。
> 范围：thincoder（CLI）+ thincoder-vscode（VSC）双树。不属单一功能板块，独立成档。


> 需求层（2026-09-10 拆分批）：本板块需求见 `../requirements/STRUCTURE-DEBT.md`——本档保留设计与测试细节。

## 1. 目的

记录跨双仓的**结构债（屎山度）评估**与**分批清理路线**。结构债病痛与治疗时机错开（平时无症状、撞上才暴露），靠文档显式追踪防止"挂账不处理"。每批独立立项（设计→评审→实现），本档是分批入口路由。

## 2. 评估方法（2026-09-07 fresh scan——第二次评估）

只读 thorough：双树逐目录字节探针 → ≥14KB 源码 offset 探针取精确行数 → 状态层/工具层 grep 全树。排除无关树（ai-gateway/kimi-code/oh-my-pi/thin4/thin5）。**已消解项不计债**：测试清零（.test.mjs=0）、verify 通用门禁重构、TOOLS.md 重写、多数文件尺寸债。


## 3. 前身评估：第一次屎山度扫描（2026-09-07 初——会话落盘补记）

> 2026-09-08 补落盘：第一次评估（7 proxy + Top-8 原始清单）当时只留会话历史（slot 27），未成文档（拟落本档时被另一实例占 docs 区搁置）。本节为历史完整性——原始 Top-8 与本节第二次 Top-8 是**两套不同清单**（第一次 = proxy 视角：状态搬运/token/文档为主；第二次 = 2026-09-07 fresh 重排）。消解追溯见下表。

### 第一次 7 proxy 严重度（原报告）

| Proxy | 严重度 | 核心发现 |
|---|---|---|
| 1. 状态搬运 | 高 | `_engDesignToken(s)` 摊 9+ 文件；async 结果 5 容器跨 ~12 文件；`_sessionSignal` 四处复制 |
| 2. torn-state guard | 高(token)/中 | mirror∈slots 不变量、`token-ttl.mjs` 整模块 = 防"同进程不可能撕裂"的状态 |
| 3. 过度防御 | 中-高 | 70+ 处兜底；abort 双保险在 execute/system/shared 三处重复 |
| 4. 债注记密度 | 极高（文档） | AGENT-LOOP.md 536KB 单文档、~59 份碎片文档、历史批注只增不减 |
| 5. 超大文件 | 代码低/测试高/文档极高 | src 已拆小；测试 26(CLI)+17(vscode) 个 >500 行未拆（后测试清零消解） |
| 6. 命名漂移 | 中-高 | `_engDesignReviewed` 注释与实现不符；recent_changes vs recent-changes；agent/history 混用 |
| 7. 同型补丁家族 | 高 | token/async 生命周期/工程模式双归属/`_permQueue`×3/`_inheritedGuard` 全同型 |

### 第一次 Top-8 原始清单 + 消解追溯（2026-09-08 核）

| # | 债 | 状态（2026-09-08） |
|---|---|---|
| 1 | `_engDesignToken(s)`+TTL+序列化 → 单一会话级 owner | ✅ 完成（token 结算根治双端——CLI a7e78b0/08cabb9 + VSC 159a39f + consume 落盘） |
| 2 | async 结果 5 容器生命周期 → 单一 owner | ✅ 消解（async-settle.mjs 统一——CLI 2de2a04 + VSC 5a85a20 = 本节第二次 Top-8 #2/批 E） |
| 3 | AGENT-LOOP.md 536KB + 59 份文档瘦身 | ✅ 完成（CLI+VSC 文档批 + ARCHITECTURE 拆分）——剩余格式债见第二次 #1/批 A |
| 4 | 跨树去重（agentState vs engTokenSlotFields） | ⏳ 未做（#2 消解后大半解决——需核剩余） |
| 5 | 工程模式布尔双归属合并 | ⏳ 未做（ENG-SESSION-PROVIDER-CLEANUP 部分处理） |
| 6 | 同物多名统一 | 🔄 部分（token 镜像退役消解部分；scope/layer 统一 2026-09-08 同类） |
| 7 | `_permQueue`/`_sessionSignal` 收 helper | 🔄 部分（consult `_sessionSignal` 兜底并入 buildChildSignal 2026-09-08；`_permQueue` 未） |
| 8 | 防御三工具去重 + TUI 兜底收敛 | ⏳ 未做 |

**第一次 vs 第二次清单关系**：第一次聚焦**状态归属架构**（token/async 容器/同型补丁——多被 2026-09-08 前的双端机制统一消解）；第二次（本节 §4）重排后聚焦**文档格式债 + 容器分叉 + `_` 字段摊平**——两清单有交叠（async 容器、命名漂移/同物多名），第二次为现行路线（§7 分批 A-F）。



## 4. 已消解（勿当债）

- 测试文件全清零（.test.mjs=0，按需新加政策）
- verify 工具本体重构为通用门禁（CLI 280/VSC 322 行）
- TOOLS.md 重写干净（13.2KB，唯一格式干净大件）
- 早期文件尺寸债大部消散（agent.mjs 530→396、session-slots 拆分等）
- **async 状态容器统一（2026-09-08——第二次 Top-8 #2/批 E）**：CLI async-settle.mjs（settleAsyncEntry 四族单点 + pending 单容器 + 池 accessor + buildChildSignal）+ VSC 镜像——双查询/双删/容器名分叉消解
- **async settle 去重（2026-09-08——第二次 Top-8 #7/批 C）**：settle→pending+waiter 唤醒逻辑四族收口 settleAsyncEntry 单点

## 5. Top-8 结构债（2026-09-07 实测）

### #1 设计文档单行整节坏格式（🔴 高 · 最高债）

**现象**：设计文档 markdown 结构性损坏——整节/表/规则压成单行，标题被吞进正文。
- `AGENT-LOOP.md` 537.8KB（全树最大，比多数源码大 10×）——数百超长单行挤节
- ~~地图档（`docs/design/` 的 README）L1/2/39/43（CLI）+ L1 整文件（VSC）——地图自身违反自己定的格式纪律~~ **已消解（2026-09-10 文档重组批）**：CLI 侧地图已无 >300 字符行（DOC-REWRITE 批已重排），且地图职能上移 `docs/README.md`——债对象不存在
- `docs/TODO.md` 单行巨型条目
- VSC `ARCHITECTURE/RELEASE/ESCALATE/PHILOSOPHY/COMPETITIVE_ANALYSIS/CONSULTATION/SETTINGS/REQUIREMENTS/TURN-CAP-CONTINUE/TODO` 多文档 L1 整文件压一行
- CLI `ADVISOR-CONVERGENCE/ACP-CLIENT` 等标题被吞进 prose/表格

**样板**：TOOLS.md 重写（2026-09-07）——按行拆章节、空行隔离表格/标题/规则/变更记录。

### #2 双端 async 状态容器分叉（🔴 高 · 最重状态债）

**现象**：CLI agent 对象进程常驻挂池/pending 于 agent.*；VSC agent per-run 重建、池/pending 挂共享 history 数组 + alias。
- 双查询：`history?._X ?? agent._X`（advisor-async/consult/scheduler/wait_for）
- 双删：`_asyncAdvisors?.delete` ×2（advisor-async:272-279 同文件 4 行重复删）
- 容器名分叉：VSC 单独 `_pendingAdvisorResults` vs CLI 折叠进 `_pendingAsyncResults`；VSC 5 pending 族 vs CLI 3
- 共享工具 thincoder-core/tools/ops.mjs:157-162 被迫写死双载体分支

**方向**：统一 session-scoped 单载体容器 + 只读 accessor（吸收 alias），命名对齐双端。

### #3 `_` 状态字段摊平面对象 + 手写生命周期（🟠 中高）

**现象**：createAgent 一次性初始化 ~30 `_` 字段 + 运行期动态 ~30，无 schema/封装，摊 ≥18 文件读写。
- reset（`src/session.mjs:424-446` 逐字段清）/继承（agent.mjs:134 for-8 键手抄）靠手写清单
- 新增/漏删字段即状态泄漏

**方向**：归组为 run-scoped / session-scoped / guard 三 capsule，reset/继承收进 capsule 方法。

### #4 eng-token TTL 双端分叉重复（🟠 中高 · 镜像固有）

**现象**：CLI 集中 token-ttl.mjs；VSC 无法 import，在 advisor-async/advisor/subagent-spawn-gate/eng/run-helpers 4+ 文件重实现 + 自有槽持久化。
**方向**：若双端继续分离，把 token 语义段抽双端逐字锚文档统一照抄 + 镜像断言。

### #5 CLI system.mjs 506 行塞 4 工具（🟡 中）

**现象**：一个文件塞 bash+glob+grep+ls 四工具 + gitGuardSnapshot，超 500 硬限；VSC 已拆 shell.mjs/search.mjs，CLI 未拆。
**方向**：按 VSC 现行拆分形态拆（bash 族/搜索族）。

### #6 工具寄生/名不符实（🟡 中低）

**现象**：CLI questionTool 寄生 git.mjs:351（VSC 已拆 question.mjs）；VSC more-file.mjs 塞 insert_after/apply_patch/ls/delete 四工具。
**方向**：question 归位独立；more-file 更名/再拆；对齐双端镜像。

### #7 async settle 逻辑重复（🟡 中低）

**现象**：settle→pending+waiter 唤醒+`_asyncSettleSeq` 同构逻辑 4 文件重复（subagent-run:181/advisor-async:480/escalate-async:271/consult:140）；kill-tree ×3；abort 双保险（`thincoder-core/tools/bash.mjs:136`——原 `system.mjs:150-182`，档已拆：2026-09-08 工具面拆分）。
**方向**：抽共享 settle 收尾 helper。

### #8 跨仓复制漂移（🟠 中 · 架构伞项）

**现象**：state/tools/prompts/advisor 层双端整片存在，靠镜像锚/fork；#2/#4/#6 是复制漂移的具体表现。
**方向**：维持语义锚文档为唯一权威源 + 双端镜像断言，收缩自由复制面。

## 6. 源码 >500 行清单（实测，仅 2 处）

| 文件 | 行数 | 状态 |
|---|---|---|
| ~~CLI src/tools/system.mjs 506~~ | **已拆**（2026-09-08 批 3——bash.mjs 269 + search.mjs 237 + question.mjs——见 #5 核销） | — |
| CLI `thincoder-core/agent-tools/advisor-async.mjs` | 538 | 超硬限（最近 R13/§24 增量推过限）——本批 R13 相关设计已在动，拆分宜随 R13 后续批处理 |

advisory 400-500 带（均 <500 不触发硬限，记录观察）：
- CLI：advisor/run 499、session 483、session-slots 476、memory/core 300（delete 族 2026-09-08 拆分 delete.mjs 234）、docs 414（>300 建议线——memory 工具层 2026-09-08 406→414 既有债）、subagent-actions 463、file 443、acp 443、consult 443、shared 447、config 428、dispatch 435
- VSC：subagent 488、file-edit 456（2026-09-08 hashline-edit.mjs 拆分后 452）、subagent-async 451、execute-tools 439、suspension 422

## 7. 分批清理路线

| 批 | 债 | 规模 | 建议时序 |
|---|---|---|---|
| 批 A | #1 文档格式债（双端 ~70 坏格式文档重写为人类可读） | **超大** | 本档 §8 详列分批；已启（归档 8 文件已移） |
| 批 B | #5 system.mjs 拆分 + #6 工具归位 | 中 | 独立清理批（TOOLS.md 尾 TODO 已记"拆分会动整个工具组"） |
| 批 C | #7 settle 逻辑去重 + abort 去双保险 | 小中 | 抽 helper |
| 批 D | #3 `_` 字段归组 capsule | 大 | 高收益，需设计（状态归属重构） |
| 批 E | #2 async 容器统一单载体 | 大 | 最深状态债，需设计（可能依赖批 D） |
| 批 F | #4 token TTL 双端对齐 + #8 镜像锚纪律 | 中 | 维持纪律防退化 |

每批独立走工程模式（设计→评审→eng-coder）。本档只路由，不承载单批设计正文（设计落各自板块文档或批专属设计文档）。

## 8. 批 A——文档格式债清理计划（2026-09-07 用户裁定推进；**2026-09-08 执行后状态**）

> **执行核销（2026-09-08）**：A1-A8（CLI）+ V1-V5（VSC）**已全部执行完毕**——CLI 经 DOC-REWRITE/DOC-REWRITE-LARGE eng-coder 批 + VSC 经 DOC-REWRITE-VSC + DOC-REORG-VSC 第 1-8 批（含 96KB ARCHITECTURE 拆薄枢纽 + 11 机制档）。下表为**原规划**（历史）。
> **净剩余核销（批 2 DOC-CLEANUP-BATCH——2026-09-08 执行完毕）**：VERIFY-DOCONLY.md 并入 VERIFY-REDESIGN.md 变更记录后归档 `_archive/`（README 地图/SETTINGS-TOOL 先例同步清）；docs/guides/ides.md 与 VSC docs/CAPABILITY_GAP.md demux 干净格式（含 memory 旧裸工具名/过期路径修正）；
> `>300` 长单行双端清零（CLI 6 档 15 行 + VSC 2 档 2 行——:269 恰 300 不超）；docs/TODO.md 两长行折行；TOOLS.md:4 悬空指针改 EDIT-HELPERS.md；AGENT-LOOP.md:94 旧名清扫 + §12.2 补 R7f 豁免注；VSC 根 METHODOLOGY.md:5 悬空修正（该档已退役——PROMPT-SYSTEM 施工① VSC 镜像批）。

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
| V4 | CONSULTATION.md、ESCALATE.md + docs/COMPETITIVE_ANALYSIS.md（VSC 仓） | 协作/参考 |
| V5 | VSC docs/TODO.md | 根 docs |

**每子批交付**：eng-coder 重写该批文件为可读（保留当前机制 + 折叠历史），git mv 任何发现应归档的到 _archive。验收 = 人类可读判据 4 条 + node --check 无关（纯 md）+ lint。双端同文件域不重叠故可并行 eng-coder。

## 变更记录

- 2026-09-08：第一次屎山度评估补落盘（原只留会话 slot 27）——新增 §3 前身评估节（7 proxy + 原始 Top-8 + 消解追溯——两套清单关系）；§4 已消解补 async 容器统一/async settle 去重（今日交付）；重编号 §5-§8；§6 advisory 带拆行。

- 2026-09-07：立项。fresh scan（explore）完成——双树结构债评估 + top-8 + 已消解项核实。落本档。结构债此前已部分登记 docs/TODO.md（system.mjs 拆分、verify.mjs 拆分等），本档为横切总账。
- 2026-09-07：批 A 启动（文档格式债）。归档 8 文件移 _archive（纯历史/被取代）。§8 落详细分批计划（CLI A1-A8 + VSC V1-V5 + 人类可读判据 4 条 + 处置分类）。用户裁定：处置 = 被取代归档 / 已实现保留重写；方法 = TOOLS.md 样板统一。
