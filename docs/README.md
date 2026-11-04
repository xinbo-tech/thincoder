# 项目文档（Project docs — thincoder 合并仓）

> 本目录 = **基准层**（项目级唯一权威层——跨两产品的文档：台账 · 板块档 · 批次档；**提示词 = `thincoder-core/prompts/`**（产品代码面 · 唯一副本；本目录下无提示词档））。
> 产品 `docs/**` = **v1 参照历史**（**保留 ≠ 维护**——不参与内容同步；其中属项目级的旧档按 §2 政策**被触碰时随批迁**——D-C14）——
> **VSC 树**（`thincoder-vscode/docs/**`）**已归档**（`_archive/`——2026-09-18 **轮 A** 已落）；**CLI 树**（`thincoder-cli/docs/**`）**已归档**（`_archive/`——同批**轮 B** 已落；**phase-1 三档按父侧裁定暂留原地**——§3）——**两树退役至此闭合**（状态见 §2）。
> 建档：2026-09-13（用户裁定：「逐步在根仓建立起全套的文档体系，项目目录里的先保留做参照，不要一下子全改掉，免得没法回顾」）。

## 1. 本层内容

| 类 | 位置 | 形态 |
|---|---|---|
| 发布流程 · 需求（统一面） | `docs/RELEASE.md` | 2026-09-20 用户裁定迁根（原 `core/requirements/`）+ **三端合一**（23:23「把各端的 release.md 整合成一个」⇒ CLI 链设计档并回 ✗ 单档承载）——**总发布计划**（**四发布单元**：核 / CLI / VSC / 桌面〔阶段一：Windows 安装包 ∥ 官网托管——2026-10-01 入主线；**阶段二：自动更新 feed ∥ 官网桌面面——2026-10-02**〕· 顺序 = 核 → CLI → VSC → 桌面〔桌面按需〕） |
| 测试环境运维（内部机器） | `TEST-ENV-ECS.md` | 2026-10-10 建（用户令「每次这么盲人摸象摸一遍不是个办法」）——ECS 测试箱（ha-proxy · `10.0.0.5`）的访问 ∥ 布局 ∥ 更新部署 ∥ 自检探针 ∥ 回滚 ∥ 坑；与产品侧部署档的分工见该档头 |
| 台账（项目级唯一真相） | SQLite——用户数据目录键控库 `~/.thincoder/ledger/<sha1(项目根)>.db`（2026-09-17 落点裁定：不在项目目录） | ✅ 唯一台账面 = SQLite（`/ledger` 查询）；`TODO.md` · `TODO-archive.md` = 退役历史（md 形态；**已排除在锚检查之外**——`PROJECT-MANIFEST.json` 的 `checkConfig.anchors.exclude`） |
| 板块档（需求 / 设计） | `core/requirements/` · `core/design/` | ✅ 核心统一已迁入（2026-09-13）；后续新板块档直接落此。**子系统档（设计 / 需求各 15 档）见 §4** |
| 批次档 | `batches/` | ✅ 核心统一已迁入（2026-09-13） |
| 部分档（各端面） | `cli/requirements/` · `cli/design/` · `vsc/requirements/` · `vsc/design/` · `desktop/requirements/` · `desktop/design/` · `render-core/design/` · `server/requirements/` · `server/design/` | ✅ **六部分**落点齐（`core/` · `cli/` · `vsc/` · `desktop/` · `render-core/` · `server/`）——**部分档 194**（`core/` 110 = 设计 61 + 需求 49 · `cli/` 17 = 设计 11 + 需求 6 · `vsc/` 10 = 设计 7 + 需求 3 · `desktop/` 25 = 设计 15 + 需求 10 · `render-core/` 1 = 设计 1 · `server/` 31 = 设计 30 + 需求 1）；desktop 设计**十五档**住 `desktop/design/`（档名见目录列举）；desktop 需求**十档**住 `desktop/requirements/`（一档顶层 + 九域卷）；render-core 设计**一档**住 `render-core/design/`；server 设计**三十档**住 `server/design/`（顶层 2 + 十二域，域内含子档）。**逐名清单 = 各目录文件列举**——地图只登记落点与计数，不复制目录内容。 |

## 2. 迁移政策（2026-09-13 用户裁定——「逐步建立 · 旧档留参照 · 不一刀切」；2026-09-14 层级裁定——根仓 `docs/` = 基准层，产品 `docs/**` = 迁移期保留的参照历史）

1. **新项目级档一律落本层**——此后新板块的需求 / 设计 / 批次档直接建在 `docs/` 下，不再落产品树。
2. **旧档不批量搬**——保留原地作**参照**；**被触碰时随批迁**（一次一档或一批）；迁移 = `git mv` + 改引用 + 机检 + 与触发批同提交。
3. **不复制**——同一档同一时间只有一份实体（迁移是**移动**不是拷贝），避免双权威源。
4. **产品级档留各产品树**；**哪些旧档属项目级随触碰逐个判定**（判定依据：是否跨两产品被引用）。
5. 迁移动作的验收 = **源面核**（逐处：引用可解析——目标档 + 节在盘；行宽无 >300 字符单行；受影响档清单逐档比对）——**读数器禁调**（用户 2026-10-15 12:10 令「不再跑、不再引其读数、不再以其红 / 绿作任何判据」），机检读数不作判据。
6. **五部分落点规划**（core / CLI / VSC / desktop / render-core）——目标结构 / 命名规则 / 归属判据 / 交叉引用形态 = `core/design/DOC-SYSTEM.md`（2026-09-14 建档；2026-09-25 桌面端设计轮收正为四部分；2026-09-27 布局收正轮收正为五部分——模块镜像裁定）；
   本节政策（逐档随批迁 / 不复制 / 旧档留参照）不变，迁入时的**落点与档名**按该档 §4–§6 判定。

> **退役状态（2026-09-18 · v1 文档退役（台账 #22）· 轮 A 已落）**：`thincoder-vscode/docs/**` 136 活档已 `git mv` 入 `thincoder-vscode/docs/_archive/<原相对路径>`（恒等映射 · 正文一字未改）——VSC 树自本政策第 4 / 5 条的「随批迁」路径转为**归档形退役**（保留语义不变；执行记录 = 该批记录）；
> `thincoder-cli/docs/**`（**轮 B · 已落 2026-09-18**）——**139 活档**同法 `git mv` 入 `thincoder-cli/docs/_archive/<原相对路径>`（恒等映射 · 正文一字未改 · `R` 对 139 / 错配 0）；
> **三档暂留原地**（`batches/` · `design/` · `requirements/` 各 1 档——父侧裁定，见 §3；迁移期该块已结清、台账退役）；执行记录 = 该批记录。**两树退役闭合**（VSC 轮 A 136 + CLI 轮 B 139）。

## 3. 待迁清单（现状）

| 档 | 现址 | 状态 |
|---|---|---|
| 核心统一（phase 2）· 需求 / 设计 / 批次 | 原 `thincoder-cli/docs/{requirements,design,batches}/` → 现 **`docs/core/{requirements,design}/` · `docs/batches/`** | ✅ **已迁入**（2026-09-13——`git mv` 三档 + 17 处引用改写；源面核过；2026-09-14 板块档再迁入 `docs/core/`） |
| 两仓合并（phase 1）· 需求 / 设计 / 批次 | `thincoder-cli/docs/{requirements,design,batches}/TWO-REPO-MERGE*` | **参照**——已闭环；引用面大（约 40 处，含两产品文档树与脚本头注），**暂留原地**，被触碰时再议 |

## 4. 子系统设计档（核心统一拆分——2026-09-13）

**依据** = 用户 2026-09-13 裁定（「不是，我们不是让它拆开的吗？！怎么还是写在一个文件里？！」「以后维护怎么办？」）。
**命名与落点** = 板块镜像形态（`core/requirements/<板块>.md` ↔ `core/design/<板块>.md`，**同板块名**）：本节各档 = `core/design/` 侧；`core/requirements/` 侧（同名）**已建齐**（15 档——2026-09-13 需求侧拆分轮，与本节各档**逐一同名成对**；登记表见 `core/requirements/CORE-UNIFICATION.md` §5）。

| 子系统 | 设计档（`core/design/`） | 覆盖裁决行 | 行数 |
|---|---|---|---|
| 记忆系统（记忆库 + 代码 / 文档索引 + 嵌入） | `core/design/MEMORY.md` | #75 · #82 · #133–#137 · #168 | 8 |
| 会话与历史 | `core/design/SESSION.md` | #89 · #123–#127 | 6 |
| 配置系统 | `core/design/CONFIG.md` | #74 · #77 · #79 · #80 · #87 · #128–#132 · #177 | 11 |
| 工具系统（实现面 + 描述面 + 注册表 + agent-tools） | `core/design/TOOLS.md` | #10–#29 · #52–#70 · #83–#86 · #88 · #90–#92 · #96 · #97 · #178 · #179 | 51 |
| 提示词系统（槽位 / 工具描述） | `core/design/PROMPT-SYSTEM.md` | #2–#9 · #30–#39 · #43–#47 · #50 · #51 · #117–#122 | 31 |
| agent 主循环与子代理 | `core/design/AGENT-LOOP.md` | #76 · #78 · #94 · #98–#103 · #111–#113 · #149–#158 · #165 · #166 · #169 · #175 · #176 · #184 | 28 |
| 评审 · 会诊 · 飞刀 | `core/design/CONSULTATION.md` | #1 · #40 · #41 · #93 · #95 · #104–#110 · #159–#161 | 15 |
| 供应商与模型 | `core/design/PROVIDER.md` | #114 · #115 · #138–#143 | 8 |
| MCP 客户端 | `core/design/MCP.md` | #81 · #144–#148 | 6 |
| 轨迹存储 | `core/design/TRACES.md` | #116 | 1 |
| 检查点与 git 面 | `core/design/CHECKPOINT.md` | #48 · #49 · #167 | 3 |
| 上下文压缩 · 标题 · 文本额度 | `core/design/CONTEXT-COMPACTION.md` | #162–#164 | 3 |
| 诊断日志 | `core/design/LOGGING.md` | #42 | 1 |
| 文案与本地化 | `core/design/I18N.md` | #185 | 1 |
| 工作区约定（技能 / 规则 / 同伴 / 台账） | `core/design/WORKSPACE.md` | #71–#73 · #170–#174 | 8 |
| **合计** | —— | —— | **181**（另 4 行 = 端特有桶 #180–#183，住工作流档 §2.5） |

**其它板块（非核心统一拆分）**：`core/design/DOC-SYSTEM.md` + `core/requirements/DOC-SYSTEM.md`——文档体系（`docs/` 的 core / CLI / VSC / desktop / render-core 五部分落点规划）；2026-09-14 建档，**只做规划、不执行迁移**。

**迁移迁入档（2026-09-15——非核心统一拆分）**：按 §2 政策「逐档随批迁」自产品树迁入（B 式重建——源档留原地作参照历史），落点按 `core/design/DOC-SYSTEM.md` §5.1 判据（P1 统一面 ⇒ `core/` · P2 产品面 ⇒ `cli/` ∥ `vsc/`）：
- `core/design/` **4 档**：`core/design/ARCHITECTURE.md` · `core/design/PORTABILITY.md` · `core/design/STRUCTURE-DEBT.md` · `core/design/TWO-REPO-MERGE.md`；
- `core/requirements/` **2 档**：`core/requirements/PHILOSOPHY.md` · `core/requirements/TWO-REPO-MERGE.md`（`RELEASE.md` 同批迁入后 2026-09-20 再迁根 = `docs/RELEASE.md`——§1 首行）；
- `cli/` **14 档**——设计 9 住 `cli/design/`（其中 `cli/design/CLI-DEBT.md` 与 `cli/design/CLI-ENTRY.md` 为 2026-09-25 新建的非迁移档，载体收口 = 台账 #340 ∥ #350）；需求 5 住 `cli/requirements/`（P2——2026-09-15 首迁 2 档后历批续迁；`RELEASE.md` 已随三端合一迁根 = `docs/RELEASE.md`——2026-09-20）。**逐名清单见目录列举**；
- `vsc/` **10 档**：`design/` = `vsc/design/VSC-MIGRATION.md` · `vsc/design/SETTINGS.md` · `vsc/design/PROJECT-SWITCHER.md` · `vsc/design/WEBVIEW.md` · `vsc/design/WEBVIEW-PROTOCOL.md` · `vsc/design/WEBVIEW-INPUT.md` · `vsc/design/VSC-DEBT.md`；`requirements/` = `vsc/requirements/VSC-MIGRATION.md` · `vsc/requirements/WEBVIEW.md` · `vsc/requirements/PROJECT.md`。

**`core/design/` 其余 40 档（工具 · 机制 · 流程面——批 11 补登 · 2026-10-07 补登记一档 · 2026-10-10 补登记一档 · 2026-10-13 补登记一档（`core/design/TEAM-LEDGER.md`——团队客户端面） · 判据 = `core/design/DOC-SYSTEM.md` §5.1（P1–P5 归属判据） · 计数随批收正 2026-11-03）**：
- 文件 / 编辑 / 执行工具面 **8 档**：`core/design/APPLY-PATCH.md` · `core/design/EDIT.md` · `core/design/EDIT-HELPERS.md` · `core/design/HASHLINE-EDIT.md` · `core/design/INSERT-AFTER.md` · `core/design/TOOL-OUTPUT-LIMITS.md` · `core/design/WRITE.md` · `core/design/BASH-EXECUTOR-FACE.md`（bash 执行器语义面——运行时探测与声明单源；2026-10-04 建档，2026-10-07 补登记）；
- 浏览器工具面 **1 档**：`core/design/BROWSER-TOOL.md`（浏览器工具——自启浏览器驱动面：十六动作契约（基线八 + 输入域八：press/hover/wheel/mouse/drag/touch/insert/clipboard）∥ 引用 / 几何机制 ∥ 会话模型 ∥ 写闸 ∥ 剪贴板面；2026-10-07 建档）；
- 顾问 / 协作 / 子代理面 **9 档**：`core/design/ADVISOR-CONVERGENCE.md` · `core/design/ADVISOR-GUARDS.md` · `core/design/AGENT-LOOP-ASYNC-POOL.md` · `core/design/AGENT-LOOP-SUBAGENT.md` · `core/design/AGENT-LOOP-UPSTREAM.md` · `core/design/ESCALATE.md` · `core/design/MULTI-INSTANCE-COLLAB.md` · `core/design/PROXY.md` · `core/design/SEND-STALL-DISTILL.md`；
- 令牌 / 参数 / 设置面 **5 档**：`core/design/AGENT-PARAMS.md` · `core/design/DESIGN-TOKEN-SETTLEMENT.md` · `core/design/ENG-TOKEN-BINDING.md` · `core/design/SETTINGS-TOOL.md` · `core/design/VERIFY-REDESIGN.md`；
- 流程 / 文档机制面 **10 档**：`core/design/ANCHOR-DEBT-REPAIR.md` · `core/design/BATCH-RECORD.md` · `core/design/DOC-CODE-RECONCILE.md` · `core/design/DOC-DISCIPLINE.md` · `core/design/ENGINEERING-MODE-V2.md` · `core/design/LEDGER.md` · `core/design/LEDGER-SELF-CONTAINED.md` ·
  `core/design/MANIFEST.md` · `core/design/TESTING.md` · `core/design/TURN-CAP-CONTINUE.md`；
- 基准测试 **2 档**：`core/design/MODEL-BENCH.md`（模型基准测试套件——独立评估面的设计档：对外部 provider 做性能评估，产物 = `bench/results/` 评估报告 = 产品输出，不打包进三端；2026-09-23 建档）· `core/design/MODEL-SPECS.md`（模型规格表设计档——bench 名单面规格行承载；2026-09-24 建行）；
- 团队客户端面 **2 档**：`core/design/TEAM.md`（团队客户端——登录与接入：`team` 段 ∥ 派生 provider 条目 ∥ 三端同构 ∥ 决策 D-TM1–6；2026-10-10 B1 建档）· `core/design/TEAM-LEDGER.md`（团队台账客户端面——核工具 `team_ledger` 端侧面单源；2026-10-13 建档）；
- 会话可观测 · 超时投递面 **2 档**：`core/design/SESSION-OBSERVABILITY.md`（槽事件 · 设计凭证丢弃报明 · 状态栏标题单行化——批档 `docs/batches/2026-10-24-session-events-and-title.md`）· `core/design/TIMEOUT-DIGEST.md`（超时旋钮与投递兜底——body 空闲可配 ∥ 子代理报告无条件落盘 ∥ 完成门认池；2026-10-24 建档，批档 `docs/batches/2026-10-24-timeout-and-digest.md`）；
- 提示词效果夹具 **1 档**：`core/design/PROMPT-FIXTURE.md`（副本 A/B 夹具——改前/改后副本跑同一批场景出读数与差异；不内置「有效」门槛；2026-10-26 建档，批档 `docs/batches/2026-10-26-prompt-fixture.md`）；
- **计数核对（按名对账）**：`core/design/` 实档 **63** = 本图登记 **63** + **待补登 0**（逐名相等）。

**工作流档** = `core/design/CORE-UNIFICATION.md`（注册表 · 事实基线 · 核形态 · 选型 · 分段执行 · 决策 · 验收 · 契约策略 · 测试——**计入上条实档计数**）——子系统档由它索引、**不复制**其内容（D2 单一权威源）；裁决行的**列定义**亦住该档 §2.5。

**两产品旧子系统档的处置（建议 · 未代裁）**：按本层 §2 迁移政策「**旧档不批量搬 · 保留原地作参照 · 被触碰时随批迁**」——各子系统于 **S2 迁移该子系统时**逐档 `git mv` 入本层（一次一档 + 引用改写 + 机检），并在产品地图撤登记行。

**`core/requirements/` 登记（逐档 · 48）**：与 design 侧同形，分五组逐档列名（全 48 档）：

- 子系统档（与 design 侧同名成对）**15**：`core/requirements/AGENT-LOOP.md` · `core/requirements/CHECKPOINT.md` · `core/requirements/CONFIG.md` · `core/requirements/CONSULTATION.md` · `core/requirements/CONTEXT-COMPACTION.md` · `core/requirements/I18N.md` · `core/requirements/LOGGING.md` · `core/requirements/MCP.md` · `core/requirements/MEMORY.md` · `core/requirements/PROMPT-SYSTEM.md` · `core/requirements/PROVIDER.md` · `core/requirements/SESSION.md` · `core/requirements/TOOLS.md` · `core/requirements/TRACES.md` · `core/requirements/WORKSPACE.md`；
- 其它板块 / 迁入档 **3**：`core/requirements/DOC-SYSTEM.md` · `core/requirements/PHILOSOPHY.md` · `core/requirements/TWO-REPO-MERGE.md`；
- 工作流档 **1**：`core/requirements/CORE-UNIFICATION.md`（登记表 · 事实基线 —— 计入实档计数）；
- 工程模式 V2 面 **11**：`core/requirements/ENGINEERING-MODE-V2.md` + `ENGINEERING-MODE-V2-SPEC-{BATCH-SEGMENT,CHECKLIST-REMOVAL,DELEGATION,LEDGER,MACHINE-CHECK,MANIFEST,PROMPT-PIPELINE,REVIEW-CREDENTIAL,TEST-DISCIPLINE,WRITE-GATE}.md`；
- 其余机制 / 流程 / 文档面 **18**：`core/requirements/ADVISOR-CONVERGENCE.md` · `core/requirements/AGENT-PARAMS.md` · `core/requirements/BROWSER-TOOL.md` · `core/requirements/DESIGN-TOKEN-SETTLEMENT.md` · `core/requirements/DOC-CHECK.md` · `core/requirements/ENG-TOKEN-BINDING.md` · `core/requirements/ESCALATE.md` · `core/requirements/METHODOLOGY.md` · `core/requirements/MULTI-INSTANCE-COLLAB.md`
  余 9 档（`NORMAL-MODE` · `PORTABILITY` · `PROJECT` · `SEND-STALL-DISTILL` · `SETTINGS-TOOL` · `STRUCTURE-DEBT` · `TESTING` · `TURN-CAP-CONTINUE` · `VERIFY-REDESIGN`）同住 `core/requirements/`（档名见目录列举）。

**计数核对（按名对账）**：`core/requirements/` 实档 **48** = 本图登记 **48** + **待补登 0**（逐名相等）。

## 5. 与产品文档地图的关系

- CLI 产品地图 = 兄弟目录 `thincoder-cli/docs/` 下的 README（**CLI 产品**的文档入口）——它此前登记了项目级板块（历史原因：合并前无项目级层）；板块迁入本层后，其登记行**撤除**（该板块不再属 CLI 产品树——本层为唯一登记处）。
- VSC 产品地图 = 兄弟目录 `thincoder-vscode/docs/` 下的 README（VSC 产品入口）。
- 本层**不进**两产品的文档域扫描；本层自带**源面核**面（扫描域 = `docs`；**读数器禁调**——用户 2026-10-15 12:10 令）；台账核销面 = `/ledger`（`thincoder-core/ledger.mjs`）。
- **五部分不各设地图**——本 README = 五部分（`core/` · `cli/` · `vsc/` · `desktop/` · `render-core/`）的唯一地图（目标结构 `core/design/DOC-SYSTEM.md` §4）；`cli/` · `vsc/` 两产品面档所对应的产品树旧档（`thincoder-cli/docs/**` · `thincoder-vscode/docs/**`）= 迁移期参照历史（§2 政策——保留 ≠ 维护）。
