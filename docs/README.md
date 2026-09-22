# 项目文档（Project docs — thincoder 合并仓）

> 本目录 = **基准层**（项目级唯一权威层——跨两产品的文档：台账 · 板块档 · 批次档；**提示词正本** = `core/design/prompts/`）。
> 产品 `docs/**` = **v1 参照历史**（**保留 ≠ 维护**——不参与内容同步；其中属项目级的旧档按 §2 政策**被触碰时随批迁**——D-C14）——
> **VSC 树**（`thincoder-vscode/docs/**`）**已归档**（`_archive/`——2026-09-18 v1 文档退役批**轮 A** 已落）；**CLI 树**（`thincoder-cli/docs/**`）**已归档**（`_archive/`——同批**轮 B** 已落；**phase-1 三档按父侧裁定暂留原地**——§3）——**两树退役至此闭合**（状态见 §2）。
> 建档：2026-09-13（用户裁定：「逐步在根仓建立起全套的文档体系，项目目录里的先保留做参照，不要一下子全改掉，免得没法回顾」）。

## 1. 本层内容

| 类 | 位置 | 形态 |
|---|---|---|
| 发布流程 · 需求（统一面） | `docs/RELEASE.md` | 2026-09-20 用户裁定迁根（原 `core/requirements/`）+ **三端合一**（23:23「把各端的 release.md 整合成一个」⇒ CLI 链设计档并回 ✗ 单档承载）——**总发布计划**（三发布单元：核 / CLI / VSC · 顺序 = 核 → CLI → VSC） |
| 台账（项目级唯一真相） | SQLite——用户数据目录键控库 `~/.thincoder/ledger/<sha1(项目根)>.db`（2026-09-17 落点裁定：不在项目目录） | ✅ 唯一台账面 = SQLite（`/ledger` 查询）；`TODO.md` · `TODO-archive.md` = 退役历史（md 形态，无机械校验） |
| 板块档（需求 / 设计） | `core/requirements/` · `core/design/` | ✅ 核心统一已迁入（2026-09-13）；后续新板块档直接落此。**子系统档（设计 / 需求各 15 档）见 §4** |
| 批次档 | `batches/` | ✅ 核心统一已迁入（2026-09-13） |
| 部分档（CLI / VSC 面） | `cli/requirements/` · `cli/design/` · `vsc/requirements/` · `vsc/design/` | ✅ 三部分落点齐（`core/` · `cli/` · `vsc/`）——**10 档**（`cli/` 2 · `vsc/` 8；2026-09-15 建）；逐档登记见 §4 |

## 2. 迁移政策（2026-09-13 用户裁定——「逐步建立 · 旧档留参照 · 不一刀切」；2026-09-14 层级裁定——根仓 `docs/` = 基准层，产品 `docs/**` = 迁移期保留的参照历史）

1. **新项目级档一律落本层**——此后新板块的需求 / 设计 / 批次档直接建在 `docs/` 下，不再落产品树。
2. **旧档不批量搬**——保留原地作**参照**；**被触碰时随批迁**（一次一档或一批）；迁移 = `git mv` + 改引用 + 机检 + 与触发批同提交。
3. **不复制**——同一档同一时间只有一份实体（迁移是**移动**不是拷贝），避免双权威源。
4. **产品级档留各产品树**；**哪些旧档属项目级随触碰逐个判定**（判定依据：是否跨两产品被引用）。
5. 迁移动作的验收 = 仓根机检（`node scripts/doc-check.mjs`——单引擎：锚 + 行宽）exit 0，且**零悬空锚**。
6. **三部分落点规划**（core / CLI / VSC）——目标结构 / 命名规则 / 归属判据 / 交叉引用形态 = `core/design/DOC-SYSTEM.md`（2026-09-14 建档）；
   本节政策（逐档随批迁 / 不复制 / 旧档留参照）不变，迁入时的**落点与档名**按该档 §4–§6 判定。

> **退役状态（2026-09-18 · v1 文档退役批（台账 #22）· 轮 A 已落）**：`thincoder-vscode/docs/**` 136 活档已 `git mv` 入 `thincoder-vscode/docs/_archive/<原相对路径>`（恒等映射 · 正文一字未改）——VSC 树自本政策第 4 / 5 条的「随批迁」路径转为**归档形退役**（保留语义不变；执行记录 = `docs/batches/2026-09-18-v1-retire.md` §5）；
> `thincoder-cli/docs/**`（**轮 B · 已落 2026-09-18**）——**139 活档**同法 `git mv` 入 `thincoder-cli/docs/_archive/<原相对路径>`（恒等映射 · 正文一字未改 · `R` 对 139 / 错配 0）；
> **三档暂留原地**（`batches/` · `design/` · `requirements/` 各 1 档——父侧裁定，见 §3 与 `core/design/DOC-MIGRATION.md` §10.3 已结清块）；执行记录 = 同批档 §5。**两树退役闭合**（VSC 轮 A 136 + CLI 轮 B 139）。

## 3. 待迁清单（现状）

| 档 | 现址 | 状态 |
|---|---|---|
| 核心统一（phase 2）· 需求 / 设计 / 批次 | 原 `thincoder-cli/docs/{requirements,design,batches}/` → 现 **`docs/core/{requirements,design}/` · `docs/batches/`** | ✅ **已迁入**（2026-09-13——`git mv` 三档 + 17 处引用改写；三机检绿；2026-09-14 板块档再迁入 `docs/core/`） |
| 两仓合并（phase 1）· 需求 / 设计 / 批次 | `thincoder-cli/docs/{requirements,design,batches}/TWO-REPO-MERGE*` | **参照**——已闭环批；引用面大（约 40 处，含两产品文档树与脚本头注），**暂留原地**，被触碰时再议 |

## 4. 子系统设计档（核心统一拆分——2026-09-13）

**依据** = 用户 2026-09-13 裁定（「不是，我们不是让它拆开的吗？！怎么还是写在一个文件里？！」「以后维护怎么办？」——批次档 `batches/2026-09-13-CORE-UNIFICATION.md` §1）。
**命名与落点** = 板块镜像形态（`core/requirements/<板块>.md` ↔ `core/design/<板块>.md`，**同板块名**）：本节各档 = `core/design/` 侧；`core/requirements/` 侧（同名）**已建齐**（15 档——2026-09-13 需求侧拆分轮，与本节各档**逐一同名成对**；登记表见 `core/requirements/CORE-UNIFICATION.md` §5）。

| 子系统 | 设计档（`core/design/`） | 覆盖裁决行 | 行数 |
|---|---|---|---|
| 记忆系统（记忆库 + 代码 / 文档索引 + 嵌入） | `MEMORY.md` | #75 · #82 · #133–#137 · #168 | 8 |
| 会话与历史 | `SESSION.md` | #89 · #123–#127 | 6 |
| 配置系统 | `CONFIG.md` | #74 · #77 · #79 · #80 · #87 · #128–#132 · #177 | 11 |
| 工具系统（实现面 + 描述面 + 注册表 + agent-tools） | `TOOLS.md` | #10–#29 · #52–#70 · #83–#86 · #88 · #90–#92 · #96 · #97 · #178 · #179 | 51 |
| 提示词系统（槽位 / 工具描述 / 中文设计档） | `PROMPT-SYSTEM.md` | #2–#9 · #30–#39 · #43–#47 · #50 · #51 · #117–#122 | 31 |
| agent 主循环与子代理 | `AGENT-LOOP.md` | #76 · #78 · #94 · #98–#103 · #111–#113 · #149–#158 · #165 · #166 · #169 · #175 · #176 · #184 | 28 |
| 评审 · 会诊 · 飞刀 | `CONSULTATION.md` | #1 · #40 · #41 · #93 · #95 · #104–#110 · #159–#161 | 15 |
| 供应商与模型 | `PROVIDER.md` | #114 · #115 · #138–#143 | 8 |
| MCP 客户端 | `MCP.md` | #81 · #144–#148 | 6 |
| 轨迹存储 | `TRACES.md` | #116 | 1 |
| 检查点与 git 面 | `CHECKPOINT.md` | #48 · #49 · #167 | 3 |
| 上下文压缩 · 标题 · 文本额度 | `CONTEXT-COMPACTION.md` | #162–#164 | 3 |
| 诊断日志 | `LOGGING.md` | #42 | 1 |
| 文案与本地化 | `I18N.md` | #185 | 1 |
| 工作区约定（技能 / 规则 / 同伴 / 台账） | `WORKSPACE.md` | #71–#73 · #170–#174 | 8 |
| **合计** | —— | —— | **181**（另 4 行 = 端特有桶 #180–#183，住工作流档 §2.5） |

**其它板块（非核心统一拆分）**：`core/design/DOC-SYSTEM.md` + `core/requirements/DOC-SYSTEM.md`——文档体系（`docs/` 的 core / CLI / VSC 三部分落点规划）；2026-09-14 建档，**只做规划、不执行迁移**。

**迁移批迁入档（2026-09-15——非核心统一拆分）**：按 §2 政策「逐档随批迁」自产品树迁入（B 式重建——源档留原地作参照历史），落点按 `core/design/DOC-SYSTEM.md` §5.1 判据（P1 统一面 ⇒ `core/` · P2 产品面 ⇒ `cli/` ∥ `vsc/`）：
- `core/design/` **5 档**：`ARCHITECTURE.md` · `PORTABILITY.md` · `STRUCTURE-DEBT.md` · `TWO-REPO-MERGE.md` · `DOC-MIGRATION.md`（迁移台账——承 `core/design/DOC-SYSTEM.md` §11 拆分规划）；
- `core/requirements/` **3 档**：`PHILOSOPHY.md` · `RELEASE.md` · `TWO-REPO-MERGE.md`；
- `cli/` **2 档**：`design/RELEASE.md` · `requirements/FEATURES.md`（P2）；
- `vsc/` **8 档**：`design/` = `VSC-MIGRATION.md` · `SETTINGS.md` · `PROJECT-SWITCHER.md` · `WEBVIEW.md` · `WEBVIEW-PROTOCOL.md` · `WEBVIEW-INPUT.md`；`requirements/` = `VSC-MIGRATION.md` · `WEBVIEW.md`。

**`core/design/` 其余 32 档（工具 · 机制 · 流程面——批 11 补登 · 判据 = `core/design/DOC-MIGRATION.md` §9.3 A21 · 计数随批收正 2026-09-22）**：
- 文件 / 编辑工具面 **7 档**：`APPLY-PATCH.md` · `EDIT.md` · `EDIT-HELPERS.md` · `HASHLINE-EDIT.md` · `INSERT-AFTER.md` · `TOOL-OUTPUT-LIMITS.md` · `WRITE.md`；
- 顾问 / 协作 / 子代理面 **9 档**：`ADVISOR-CONVERGENCE.md` · `ADVISOR-GUARDS.md` · `AGENT-LOOP-ASYNC-POOL.md` · `AGENT-LOOP-SUBAGENT.md` · `AGENT-LOOP-UPSTREAM.md` · `ESCALATE.md` · `MULTI-INSTANCE-COLLAB.md` · `PROXY.md` · `SEND-STALL-DISTILL.md`；
- 令牌 / 参数 / 设置面 **5 档**：`AGENT-PARAMS.md` · `DESIGN-TOKEN-SETTLEMENT.md` · `ENG-TOKEN-BINDING.md` · `SETTINGS-TOOL.md` · `VERIFY-REDESIGN.md`；
- 流程 / 文档机制面 **11 档**：`ANCHOR-DEBT-REPAIR.md` · `BATCH-RECORD.md` · `DOC-CODE-RECONCILE.md` · `DOC-DISCIPLINE.md` · `ENGINEERING-MODE-V2.md` · `ENGINEERING-MODE.md` · `LEDGER.md` · `LEDGER-SELF-CONTAINED.md` · `MANIFEST.md` · `TESTING.md` · `TURN-CAP-CONTINUE.md`；
- **计数核对（复跑 as-of 2026-09-22 · structure-debt 批 · 档面车道）**：`core/design/` 实档 **54** = 本图登记 **53** + **待补登 1**（`MODEL-SPECS.md`——他批新档，归属面待其批登记；本批不代裁）。
  （前值 **51 = 51** 为 as-of 2026-09-17 读数；此后实增三档：`MODEL-SPECS.md`（他批）+ 本批三分面 `AGENT-LOOP-ASYNC-POOL.md` · `AGENT-LOOP-UPSTREAM.md`——后两档本行同批登记。）

**工作流档** = `core/design/CORE-UNIFICATION.md`（注册表 · 事实基线 · 核形态 · 选型 · 分段执行 · 决策 · 验收 · 契约策略 · 测试）——子系统档由它索引、**不复制**其内容（D2 单一权威源）；裁决行的**列定义**亦住该档 §2.5。

**两产品旧子系统档的处置（建议 · 未代裁）**：按本层 §2 迁移政策「**旧档不批量搬 · 保留原地作参照 · 被触碰时随批迁**」——各子系统于 **S2 迁移该子系统时**逐档 `git mv` 入本层（一次一档 + 引用改写 + 机检），并在产品地图撤登记行。

## 5. 与产品文档地图的关系

- CLI 产品地图 = `thincoder-cli/docs/README.md`（**CLI 产品**的文档入口）——它此前登记了项目级板块（历史原因：合并前无项目级层）；板块迁入本层后，其登记行**撤除**（该板块不再属 CLI 产品树——本层为唯一登记处）。
- VSC 产品地图 = `thincoder-vscode/docs/README.md`（VSC 产品入口）。
- 本层**不进**两产品的文档域扫描；本层自带机检覆盖（`node scripts/doc-check.mjs`，扫描域 = `docs`）；台账核销面 = `/ledger`（`thincoder-core/ledger.mjs`）。
- **三部分不各设地图**——本 README = 三部分（`core/` · `cli/` · `vsc/`）的唯一地图（目标结构 `core/design/DOC-SYSTEM.md` §4）；`cli/` · `vsc/` 两产品面档所对应的产品树旧档（`thincoder-cli/docs/**` · `thincoder-vscode/docs/**`）= 迁移期参照历史（§2 政策——保留 ≠ 维护）。

## 变更记录

- 2026-09-22：**structure-debt 批（三分面）登记 + 计数收正**——§4「顾问 / 协作 / 子代理面」**7 → 9 档**（+ `AGENT-LOOP-ASYNC-POOL.md` · `AGENT-LOOP-UPSTREAM.md`）；「其余」组标题计数随批收正（27 → 32）；计数核对行收正为 **实档 54 = 登记 53 + 待补登 1**（`MODEL-SPECS.md`——他批）。

- 2026-09-20：**发布计划档迁根登记**（用户裁定「release.md 不应该放在那个目录里，应该直接放在 docs 目录下」）——原 `docs/core/requirements/RELEASE.md` 迁根为总发布计划 ✗ CLI 链设计档同批同迁（后随三端合一并回 ✗ 详见发布计划档变更记录）；§1 内容表补一行。
- 2026-09-20：**三端合一登记**（用户 23:23「把各端的 release.md 整合成一个」）——CLI 链设计细目并回总发布计划 ✗ 单档承载 ✗ 地图改单行。

- 2026-09-18：**v1 文档退役批（台账 #22）· 轮 A 落笔**——首部层级定位 + §2 补**退役状态**注（VSC 树已归档 `_archive/`；CLI 树轮 B 待执行）；本档其余不变。

- 2026-09-17：**新档登记 + 计数收正**（锚债修复批设计轮）——§4 登记 `core/design/ANCHOR-DEBT-REPAIR.md`（流程 / 文档机制面，同批补登 `MANIFEST.md` · `ENGINEERING-MODE-V2.md` 两档历史漏登）；§4 计数行收正为 **51 = 51**（前值 49 = 49 为 as-of 09-16 读数）。

- 2026-09-16：**`core/design/` 其余 27 档补登 + 计数收正**（批 11——承 `core/design/DOC-MIGRATION.md` §9.3 A21）；§4 同批加「计数核对」行（实档 **49** = 地图 **49** · 反向悬空 **0**——复跑 as-of 2026-09-16）。

- 2026-09-15：**地图补登记**（迁移批 / VSC 批随批核销）——§1 内容表补「部分档」行（`cli/` · `vsc/` 两新部分层）；§4 补「迁移批迁入档」登记（**18 档**：`core/design/` 5 · `core/requirements/` 3 · `cli/` 2 · `vsc/` 8）；§5 补三部分地图口径一行。

- 2026-09-14：新增「文档体系」板块——`core/design/DOC-SYSTEM.md`（设计）+ `core/requirements/DOC-SYSTEM.md`（需求）——`docs/` 的 **core / CLI / VSC 三部分落点规划**（命名规则 / 归属判据 / 交叉引用形态 / 机检引擎·路由切分与射程）；§2 增第 6 条指针；§4 登记一行。**只做规划，不执行迁移**。

- 2026-09-13：**子系统设计档拆分**（核心统一批——用户明令现做）：新增 §4「子系统设计档」登记表（15 档 / 覆盖 181 行）；原 §4「与产品文档地图的关系」顺延为 §5；§1 内容表同批注记。
- 2026-09-13：**首批迁入**——核心统一（phase 2）需求 / 设计 / 批次三档自 CLI 产品树 `git mv` 至本层（含 17 处引用改写：本板块自指 / 互指 11 处 → 根形态 · 引 phase 1 两档 5 处 → CLI 树形态 · 另 1 处）；CLI 产品地图登记行同批撤除；三机检 exit 0、零悬空锚。
- 2026-09-13：建档——根文档层 + 迁移政策（用户裁定「逐步建立全套文档体系、旧档先保留作参照」）；待迁清单初版（CORE 待迁 / TWO 参照）。
- 2026-09-13（概念纠正轮）：§4 注册表「提示词系统」行名改「中文设计档」（承批次档 §1 裁定——中文提示词档 = 设计文档；与 `core/design/CORE-UNIFICATION.md` §2.5 注册表逐字同源）。
- 2026-09-14（S1 收口轮）：§4 **requirements 侧说明收正**——需求侧子系统档**已建齐**（15 档，同名成对）；§1 内容表同步。
- 2026-09-14（层级口径轮 · eng-designer）：首部层级定位收正——本层 = **基准层**（项目级唯一权威层）；产品 `docs/**` = **迁移期保留的参照历史记录**（保留 ≠ 维护——D-C14）；§2 迁移政策（逐档随批迁）不变。
- 2026-09-14（**提示词正本位移 · 迁移批第 1 批**）：提示词正本 15 档 `git mv design/prompts/` → **`core/design/prompts/`**（落点判据 = `core/design/DOC-SYSTEM.md` §5.1 P1 统一面 · §4 去向表）；首部层级定位的路径指针同批改指（`:3`）；三机检 exit 0 · 零悬空锚。
- 2026-09-14（**板块档位移 · 迁移批第 2 批**）：根层 17 设计 + 17 需求板块档 `git mv` 入 **`core/design/` · `core/requirements/`**（落点判据 = `core/design/DOC-SYSTEM.md` §4 去向表 · §5.1 P1 统一面）；§1 表 / §3 待迁清单 / §4 登记与本节记录路径同批改指新址；`docs/` 根自此 = 流程面（台账 / 批次档 / 地图）+ `core/`。三机检 exit 0 · 零悬空锚。
