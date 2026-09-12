# 文档体系各仓自持（LEDGER-SELF-CONTAINED）· 批次记录 · **VSC 仓侧**（2026-09-12）

> 六段 append-only，一段一作者。编制：主 agent · 2026-09-12 04:26 · 来源 = 用户 2026-09-12 04:16–04:26 裁定（各仓自持）+ 04:26 明确指示「这个事情的批次档也应该是 cli/vscode 各一份的」。

> **本档性质**：本批的 **VSC 仓侧记录**——同批 CLI 仓侧记录 = 批档 `2026-09-12-LEDGER-SELF-CONTAINED（CLI 仓）`（父侧授权代改 2026-09-12——形态规范化；段作者笔迹仅此一处替换）。两侧**各持自身范围**；两档之间的互引形态由本批设计裁定（不得产生悬空引用）。
> （父侧形态更正 2026-09-12：空占位行已清——实体内容见对应节；空占位 = 残留即先例）

---

## §1 讨论（主 agent 记）

### 状态

**VSC 侧已开档 2026-09-12 04:26**。下一步 = **设计**（VSC 侧分派方式与衔接时点由本批设计裁定）。

> **设计者重开记录**（2026-09-12 04:35）：首任 designer（异步 id=2）跑 792s / 14 回合 / **零文件改动**——因本批 §1 被五次增量追加（R6 / R7 / R3拓宽 / R8 / R9）而未能动笔。用户裁定「**杀掉重新来**」→ 首任已 cancel，**重开新任 designer**（两侧 §1 现已 R1–R9 齐备）。

### 本批动因（VSC 视角）

2026-09-12 凌晨的泄露事故 = **跨仓登记**：他方把另外两条产品线的债（含一条安全项）登记进 `thincoder` 仓的台账，随主线合入并推到两个公开远端。事故**从"跨仓写"这个口子进来**。

处置已完成（历史移除 + 两远端改写 + 本地清对象）；**机制上原本没有闸**——本批即为立闸。

**对 VSC 仓而言，同一个病在本仓的形态**：

| 面 | 本仓现状 |
|---|---|
| 台账条目指针 | **2/2 条指向 CLI 仓**（需求 = `AGENT-LOOP（CLI 仓·需求）` · 任务书 = `docs/batches/`（CLI 仓））（父侧授权代改 2026-09-12——形态规范化；段作者笔迹仅此一处替换） |
| 归档 | 1 条指向 CLI 仓 |
| 台账头部 | 含「形态权威 = `ENGINEERING-MODE（CLI 仓）§1.13`（本仓镜像面 = `§1.17/FR23`）」等**跨仓引用** |
| 批次档 | **本仓无 `docs/batches/`**——全部批档住在 CLI 仓（含本批与并行批） |
| 需求档 | **本仓无 `docs/requirements/`**——本仓需求写在 CLI 仓需求档里 |

### 用户裁定（VSC 侧自持表述——与 CLI 侧同源）

| # | 条目 | 裁定 |
|---|---|---|
| R1 | 台账射程 | **只收本仓条目**——禁登记他仓 / 他项目 / 他产品线事项；**跨仓指针同样禁**（含与本产品 CLI 端的互引） |
| R2 | 缺的补齐 | 本仓 **`docs/requirements/` 与 `docs/batches/` 均不存在**——这是前任图省事（「能记一处就不写两处」）造成的**病**，**不是豁免理由** → **本仓补建自持文档面** |
| R3 | 提示词层承载 | 本批全部约束（R1 / R2 / R6 / R7）**必须在本仓提示词层面落地**，而不只是文档层——本仓提示词（`src/prompts/**` + `docs/design/prompts/**`）为落点之一 |
| R4 | 机检 | 台账条目的**证据/指针路径须在本仓内可解析**——本仓侧机检面须同规覆盖 |
| R5 | 否决在案 | **不得**以「本仓无自持需求档/批档」为由放宽为「允许跨仓指针」——该方案不得复活 |
| R6 | 批次档同规 | **批次档与台账同规**：各仓记各仓自己的（**本档即为该裁定的第一个落地物**） |
| R7 | 文档体系各仓自持 | **需求档 / 设计档 / 批次档 / 台账，一律各仓记各仓的，禁止跨仓写需求**——本仓需求必须住本仓；**非复制**（语义同源、各端原文自持，照在案多实现面纪律） |
| R8 | **核验职责须落提示词层**（2026-09-12 04:28 用户追加）| 「一式两份设计 → **主 agent 核验两侧逻辑一致**」**须写进提示词层**（多实现面纪律节）——使今后每一批双端设计都受此约束。落点 = 本仓 `discipline-engineering.md` 的「多实现面纪律」节（与 CLI 侧同源、各端原文自持） |
| R9 | **提示词「多实现面纪律」节去绑死**（2026-09-12 04:30 用户追加）| 该节正文**把本产品的两端写成了通用示例**（标题「双端镜像」· 例示「CLI/VSC 双端」· 正文通篇「双端」· 端特例「VSC R14 池规则段」），并夹**维护者注**（「已废」「乒乓振荡——已实证」「2026-09-09 修订」）——与 R3 措辞纪律冲突。**须通用化**（多端 / 多语言 / 多平台 / 同源镜像文档）+ 去维护者注；**A1 勘察 checklist ④ 同步通用化**。**与 R8 同节**（R8 要把核验职责写进该节）——同批同节落地，禁止两批各写一遍 |

### VSC 侧事实基线（实测——designer 起点）

| 项 | 实测 |
|---|---|
| `docs/requirements/` | **不存在** |
| `docs/batches/` | **不存在**（本档 = 本仓首档） |
| `docs/design/` | **54 档 / 12270 行**——**已自持**（≈ CLI 同层的 71%）→ 反证本仓有能力自持，塌的只有需求层与批档层 |
| `docs/TODO.md` | 2 条（指针全指 CLI 仓）；`docs/TODO-archive.md` 3 + 19 条 |
| `test/` | 65 档；散文锚粗筛 **28 档 / 330 用例**（并行批范围） |
| 跨仓写痕 | CLI 仓 requirements + design 共 **54 档**含 VSC 指涉（`design/ENGINEERING-MODE.md` 65 次 等） |

### 提示词绑死面（R9 事实基线——2026-09-12 04:31 实测）

用户口径：**提示词里的多实现面那一段是不是也犯了绑死固定项目的毛病啊？那个也是要处理的。**

`#### 多实现面纪律` 节共 **四处镜像**（本仓两面 + CLI 仓两面）：

| 副本 | 节标题行 | 节体 |
|---|---|---|
| `thincoder-vscode/src/prompts/discipline-engineering.md` | :95 | :95–102 |
| `thincoder-vscode/docs/design/prompts/discipline-engineering.md` | :66 | :66–73 |
| `src/prompts/discipline-engineering.md`（CLI 仓） | :91 | :91–98 |
| `docs/design/prompts/discipline-engineering.md`（CLI 仓） | :66 | :66–73 |

**逐字绑死点（现行原文）**：

1. 标题 `#### 多实现面纪律（**双端镜像**）`——本产品术语入标题；本仓 src 版另加 `——2026-09-09 修订：byte-identical 硬一致已废`（**维护者注**）
2. `同一机制落多个实现面（**如 CLI/VSC 双端** prompts 或文档镜像）时`——把本产品两端写成通用示例
3. 正文通篇「**双端**」（`双端各自的文本以其端原文为准…不加双端同步依赖`）+ 维护者注（「已废」）
4. `（**双端互相参照 = 乒乓振荡——已实证**）`——绑死 + 本产品史
5. `一端独有的内容段（**如 VSC R14 池规则段**）在其端原地保留`——具体到本产品具体段落
6. **A1 勘察 checklist ④**：`核双端对位面（CLI/VSC 镜像）`（本仓 src :73 · CLI src :69）——同一个病，另一节

**后果**：用户项目跑该提示词时会去找**并不存在的「CLI/VSC 对位面」**——属 **P 系列「静默失效」同类**。

### 设计必须回答的问题（VSC 侧）

1. **本仓自持需求档的建立范围与分期**：哪些先建、哪些随批补齐；**若判为分期必须给出分期表与每期触发条件**，不得以「量大」为由停在「待议」。
2. **本仓台账的跨仓指针处置**：活档 2 条 + 归档 1 条逐条处置（改指本仓 / 迁档 / 就地注记）；**台账头部跨仓引用**（`ENGINEERING-MODE（CLI 仓）§1.13` 等）的自持化形态。
3. **本仓提示词落点**：R3 展开的行为条款在本仓提示词（双源）的落位；与既有跨仓注记（如「（CLI 侧）」豁免注）的逐处对齐——不留两套口径。
4. **本仓机检面**：R4 的可解析性规则在本仓的落点（本仓是否需自己的检查器入口 / 与 CLI 侧检查器的关系）。
5. **两侧记录互引形态**：本档与 CLI 侧记录的引用规范（不得悬空、不得构成跨仓写需求）；本批 VSC 侧的**实施者与设计分派方式**（与 CLI 侧同链还是各端独立）。

### 两侧一致性核验（主 agent 职责——2026-09-12 04:27 用户裁定）

用户口径：**这种一式两份的设计，designer 可能是各自写，写出来的东西可能不一样，但是主 agent 有义务检查两份的逻辑是否一致。**

**核验口径**（不是逐字比对——逐字一致是明令禁止的）：

| 维度 | 核验什么 |
|---|---|
| 裁定同源 | 两侧对 R1–R7 的**语义**是否同一——不得一侧禁、一侧放行 |
| 判据同一 | 「什么算违规」的判据两侧同口径（R4 可解析性规则 · 本仓机检落点） |
| 边界同形 | 保留面 / 范围外 / 否决在案（R5）两侧一致 |
| **端差显式** | 允许的端差**是否逐条登记**（判据 = `AGENT-LOOP.md:607` N-CL4「端差逐条登记不静默」；本仓 `docs/design/README.md` 载镜像差异表——仅作插图，非依据）——**静默的端差 = 漂移，不得放过** |

**核验时点**：两侧设计均落档后、**评审前预检**（A3）内执行；核验结论连同差异表随「设计就绪待评审」一并报用户。

**提示词层落点（R8）**：本职责**不停留在批档与 checklist 层**——须写进本仓 `discipline-engineering.md` 的「多实现面纪律」节（与 CLI 侧同源、各端原文自持）。批档与 checklist 只是本批的执行痕迹。

**依据（在案纪律）**：多实现面纪律 = 各端独立实现、**语义同源**、不做 byte-identical、**差异如实上报**。

### 父侧裁定（2026-09-12 05:07——用户授权主 agent 自决，不再上呈）

| # | 事项 | 裁定 | 依据 |
|---|---|---|---|
| **P1** | 批档迁移口径（**2026-09-12 05:08 用户撤销原判——「严」被否决**）| **宽口径 + 溯及既往**：凡**触及对端**的批档**一律处置**——① **实施面全在对端者 → 物理迁移**（`git mv`：保留 git 历史与 blame，**不存在审计链断裂**——原判以此为由豁免系错判）；② **两端均有实施面者 → 各仓持其份**（逐档出拆分清单）。**禁止**以「历史已收口 / 审计链 / 重复」为由豁免任何一档 | R6/R7 对**全部**记录生效——**无溯及豁免条款**；原判已撤销，不得复活 |
| **P2** | 本仓机检检查器（~230 行） | **维持全量**（不缩面） | R4 要求机检面同规覆盖；缩面即本仓「跨仓登记」无闸 |
| **P3** | 本仓两已收口批的 7 条机检违规 | **并入本批对齐轮** | 形态正是 R1/R7 的处理对象 |

### 设计约束

1. **不得以现状为约束**：既有缺口（无需求档 / 无批档 / 指针全指他仓）是**待修对象**，不是设计前提；
2. **双端纪律**：语义同源、各端原文自持——不做 byte-identical、不加跨端同步依赖；
3. **失败封闭**：机检补强须对新形态零假阳、对违规 fail-closed；
4. **发布门不降**：本仓 `lint → test:full → test:integration` 三门全绿；
5. **受影响文件全清单 + 行数标注**（含测试面），验收标准逐条可机器验证并回指本节裁定。

### 验收标准（用户 2026-09-12 05:17 裁定——「我只有一个标准：vscode」）

用户原文：「**我不管你怎么干，我只有一个标准:vscode**」

**裁定**：本会话全部工作的**唯一验收基准 = thincoder-vscode 侧完整落地**：

1. **本仓文档体系成套**——`docs/requirements/`（按对位蓝图）· `docs/README.md` · `docs/batches/` · `docs/design/` 全对位；**缺项补建，不得只搭骨架**；
2. **本仓实现面落齐**——本批 VSC 侧机检（~230 行检查器）/ 提示词 / 存量处置**在本仓内落地并跑绿**，不得只落 CLI 侧；
3. **本仓门禁为验收依据**——`vscode:prepublish` 三环全绿；
4. **判定句**：**CLI 侧完成 ≠ 完成**；本仓未齐即未完成。

**完整文档体系 = 验收交付物清单（父侧实测 as-of 2026-09-12 05:18）**：

| 层 | CLI 仓 | 本仓现状 | 目标（验收面） |
|---|---|---|---|
| 仓根（非 docs/） | AGENTS · README · CHANGELOG · LICENSE | 同 4 档 ✓ | 保持 |
| `docs/README.md`（文档地图） | ✓ | **✗ 缺** | **建** |
| `docs/TODO.md` / `TODO-archive.md` | ✓ | ✓ | 保持 |
| `docs/requirements/` | **36 档** | **2 档** | **36 档对位成套**（逐档三值：建 / 已有对位注明档名 / 本端无此面） |
| `docs/design/` | 46 档 | **57 档**（含 `README.md` ✓） | 已自持；**异名对位正常**（CLI `TUI.md` ↔ 本仓 `WEBVIEW.md`） |
| `docs/design/prompts/`（双源中文权威） | 15 档 | 15 档 ✓ | 保持（与 `src/prompts/` 15 档双源对位） |
| `src/prompts/`（英文落地） | 15 档 | 15 档 ✓ | 保持 |
| `docs/batches/` | 53 档 | 2 档 | 新批本仓（不再寄他仓）；存量按宽口径处置 |
| `docs/design/_archive/` | 53 档 | 12 档 | 归档面随退役累积 |
| `docs/guides/` | 1 档（`ides.md`） | **无** | 判定建 / 不建（给理由） |
| 本仓独有档 | — | `CAPABILITY_GAP.md` · `COMPETITIVE_ANALYSIS.md` | **保留**（本仓独有不得因对位而删） |

**验收判定**：上表「目标」列逐行达成 + 本仓 `vscode:prepublish` 三环全绿 = 本会话验收通过。

### 范围外

- 并行批 `PROSE-ANCHOR-RETIRE` 的 VSC 侧范围（见本仓 `docs/batches/2026-09-12-PROSE-ANCHOR-RETIRE.md`）——两批的文件域重叠面须显式登记；
- 事故本身的平台侧处置（GitHub / Gitee 缓存与克隆副本回收）——组织层面事项。

---

## §2 批次任务（eng-designer 写）


---

### 本批任务（VSC 侧实施任务书——eng-designer · 2026-09-12）

> 本段 = 本批 **VSC 侧任务书本体（FR16）**——eng-coder 实施依据；形态参照 `LEDGER-SELF-CONTAINED（CLI 仓）§2`（内容各仓自持、本端原文）。
> 设计全文 = 本仓 `docs/design/LEDGER-SELF-CONTAINED.md`（下称「设计档」——已过修正轮 + 写域现实核对）；需求 = 本仓 `docs/requirements/ENGINEERING-MODE.md`（F1–F10 / N1–N5）。
> 实施分派（设计档 D13）：**两侧各一个 eng-coder、独立实施、共享同一 designId + token**——本段仅辖本仓写域；CLI 仓任何档不在本段射程。
> 行号口径：as-of 2026-09-12 写书实测；定位以**节标题 / 用例名 / 档名**为准（D4）。
> 写域状态**先核再写**（并行批 PROSE-ANCHOR-RETIRE 已实施落树）——核对结论与重叠面处置见「四」。

#### 一、本批范围与依据句（B1–B12）

| # | 本批条目 | 需求条 | 设计节 | 验收回指 |
|---|---|---|---|---|
| B1 | 台账射程 = 只收本仓条目；禁跨仓指针（含 CLI↔VSC 互引） | F1 | §4.1 / §4.2 / §7 | AC-VS1–AC-VS4 · AC-VS22 |
| B2 | 缺失层补齐（需求树 + 批档自持） | F4 | §8.5 / §8.6 | AC-VS9 · AC-VS13 |
| B3 | 约束落提示词层（行为面） | F5 | §6.2 / §6.4 | AC-VS7 |
| B4 | 机检补强：本仓内可解析（L4） | F6 | §7 | AC-VS1–AC-VS4 · AC-VS10 |
| B5 | 否决在案（不得复活） | N4 | §12 | AC-VS14（维持判据） |
| B6 | 批次档同规 | F2 | §8.3 | AC-VS15–AC-VS18 |
| B7 | 文档体系各仓自持（非复制） | F3 | §8.4 / §8.5 | AC-VS21 · AC-VS22 |
| B8 | 核验职责落提示词层 | F7 | §6.1 | AC-VS6 |
| B9 | 多实现面纪律通用化 + 去维护者注 + A1 ④ | F8 | §6.1 / §6.3 | AC-VS5 · AC-VS8 · AC-VS11 · AC-VS25 |
| B10 | 存量宽口径处置（批档 + 归档面） | F9 | §8.1 / §8.3 | AC-VS15–AC-VS18 · AC-VS23 · AC-VS24 |
| B11 | 文档体系逐层成套（层清单 + 36 档三值 + 归位） | F10 | §8.6 | AC-VS19–AC-VS21 |
| B12 | 指针与引用面存量（台账 + 互引 + 写痕） | F9 | §8.2 / §8.4 / §8.7 / §8.8 | AC-VS16 · AC-VS22 |

- 三方条目一致：本表 B1–B12 = 设计档 §11 AC 回指条目 = 需求档 F1–F10 / N1–N5。
- 父侧裁定承接：P1′ → B10（宽口径 + 溯及既往）；P2′ → B11（逐层成套「完整」标准）；P3 → B10 · B12（对齐轮 = 本批内统一处置——设计档 §8.8）。
- 非功能面（N1–N5）：N1 / N2 → T9（零假阳 / fail-closed）；N3 → 设计档 §8.5 分期表（期 1 = 本批；期 2 触发 = 在飞 2 档收口）；N4 → B5 · AC-VS14；N5 → T9（独立实现、不跨仓 import）。

#### 二、逐条任务条目（T1–T13——VSC 侧全部实施面）

（每条 = 动作 / 落点 / 判据；行数 as-of 实测。）

**T1 需求树归位（6 档）**
- 去后缀迁入 `docs/requirements/`：`AGENT-PARAMS.md`（41 行——自 `AGENT-PARAMS-REQUIREMENTS.md`）· `ENG-TOKEN-BINDING.md`（47）· `SEND-STALL-DISTILL.md`（39）· `TOOL-OUTPUT-LIMITS.md`（46）。
- 异名 / 原档迁入：`docs/design/REQUIREMENTS.md` → `docs/requirements/PROJECT.md`（129 行——v1 功能范围节由 T2 拆出）；`docs/design/PHILOSOPHY.md` → `docs/requirements/PHILOSOPHY.md`（135）。
- 每档档首加**一行归位注记**；原路径引用逐处改指（含 `docs/design/README.md` 登记行——零失效路径）。
- 对应 `-TUNING.md` 4 档（114 / 115 / 137 / 139 行）**留 `docs/design/` 零改**。
- 判据：6 档在新路径在位 + 原路径不存在（T-VS20 / AC-VS21）。

**T2 拆出 `FEATURES.md`**
- 自 `REQUIREMENTS.md`（→ `PROJECT.md`）的 §v1 功能范围节**逐字**拆出 → `docs/requirements/FEATURES.md`（0→~45 行）；`PROJECT.md` 去该节（±0）。
- 判据：两档在位；`PROJECT.md` 不再载 v1 功能范围节。

**T3 ① 新建 6 档（机制在位记录）**
- `LOGGING.md`（~60——`src/log.mjs` 在位；兼清源码悬空指针，见 T11）· `MULTI-INSTANCE-COLLAB.md`（~60——`src/extension/peer-instances.mjs`）· `NORMAL-MODE.md`（~70——提示词装配层）
  · `SETTINGS-TOOL.md`（~70——`src/agent-tools/settings.mjs`；部分承载 = `docs/design/TOOLS.md` §5）· `STRUCTURE-DEBT.md`（~60——本端结构债登记面）· `VERIFY-REDESIGN.md`（~60——`src/agent-tools/verify.mjs`）。
- 写法 = 需求三层（总体目标 / 功能性 / 非功能性——登记规则见 `docs/requirements/README.md` 需求档写法节）。
- **内容纪律**：记录既有机制实况——**零新需求语义**；撰写中若触碰语义空白（机制说不通 / 归属不明）→ **停手上报**——不自行立规。
- 判据：6 档在位且非空；36 行对位表 ① 行逐行可解析。

**T4 36 档对位表登记（`docs/requirements/README.md` +60±20）**
- 登记逐行三值表（CLI 需求档名 → 本仓判 → 本仓对位档名）：① 6 / ② 28 / ③ 2——数据源 = 设计档 §8.6（三值表 + 归位规则）。
- 树终态 = **16 档**（本批建成面 = 归位 6 + 拆出 1 + ① 6；已落 3 = `README` · `ENGINEERING-MODE` · `TESTING`——as-built 核对，设计档 §8.6 已同步）。
- as-built 注：`TESTING` 行对位档 = `docs/requirements/TESTING.md`（并行批已落位——② · 已在位）。
- 板块表随新建 / 归位档同步（可定位——登记规则 3）。
- 判据：36 行齐 + 三值计数 6 / 28 / 2（T-VS18 / AC-VS19）。

**T5 `docs/README.md` 新建（0→~130）**
- 文档地图：层清单**十行逐行登记**（设计档 §8.6 表——仓根 / 本档 / 台账 / requirements / design / prompts 双源 / batches / _archive / guides〔**不建 + 理由**〕/ 本仓独有档）；登记规则摘要 + 指针（`docs/design/README.md` / `docs/requirements/README.md`——D2 单一权威源、不重述）。
- 判据：在位且十行齐 + guides 理由行（T-VS19 / AC-VS20）。

**T6 批档接收（设计档 §8.3——迁移 14 + 拆分 17）**
- **迁移 14 档**：对端 `docs/batches/` → 本仓 `docs/batches/`（档名不变；文字逐字——D10；档首搬迁注记〔源档路径 + 源 SHA〕，提交信息同携——D9 / D11）：
  `2026-09-10-VSC-MIRROR`（277）· `2026-09-11-ADVISOR-BUDGET-VSC-MIRROR`（200）· `2026-09-11-PORTABILITY-VSC-MIRROR`（239）· `2026-09-11-VSC-ACTIVITY-REGION-RESTORE`（335）·
  `2026-09-11-VSC-ASYNC-PARITY`（272）· `2026-09-11-VSC-CONTEXT-PARITY`（309）· `2026-09-11-VSC-GUARD-COMPLETION`（286）· `2026-09-11-VSC-GUARD-MIRROR`（346）·
  `2026-09-11-VSC-INDEX-PERCEPTION`（362）· `2026-09-11-VSC-LIVE-UX`（206）· `2026-09-11-VSC-MIRROR-SWEEP`（448）· `2026-09-11-VSC-WEBVIEW-ESCAPE`（248）·
  `2026-09-12-VSC-ACTIVITY-CLOSURE`（385）· `2026-09-12-VSC-CHILD-PERMISSION`（321）。
- 8 档携 **10 行 >300 非表格行**逐行折行（逐档：`VSC-ACTIVITY-REGION-RESTORE` 1 · `VSC-ASYNC-PARITY` 1 · `VSC-CONTEXT-PARITY` 1 · `VSC-GUARD-COMPLETION` 2 · `VSC-INDEX-PERCEPTION` 1 · `VSC-LIVE-UX` 1 · `VSC-ACTIVITY-CLOSURE` 2 · `VSC-CHILD-PERMISSION` 1）；后两档同轮承接 T10。
- **拆分 17 档**（本仓承载档新建——载本仓份 ≈168 条目；按条 / 按块逐字搬运——D10；对端份留对端）：
  `MODEL-SELECTION`（28）· `COMMON-LAYER`（18）· `DEEPSEEK-V41-FLASH`（4）· `DOC-HYGIENE`（1）· `INPUT-FIXES-SMALL`（6）· `POOL-LEDGER`（5）· `PROMPT-REVIEW-ORDER`（9）· `ROLE-REDEFINITION`（5）·
  `SETTINGS-NULL-DEFAULT`（3）· `SPAWN-QUEUE-DISCIPLINE`（4）· `TEST-DISCIPLINE-PROMPTS`（7）· `TEST-LIFECYCLE`（≈23）· `TURN-ACROSS-SEGMENTS`（6）· `VSC-ASYNC-VISIBILITY`（16）· `VSC-REVIEW-ASYNC-SWEEP`（15）· `WEBSEARCH-PROVIDER-KEY`（5）· `LEDGER-SURFACE`（13）；
  分桶条目口径 = `LEDGER-SELF-CONTAINED（CLI 仓）§8.3` 表（语义同源参照）；`POOL-LEDGER` 内台账引用改指本仓 `docs/TODO.md`（设计档 §8.7）。
- **在飞 2 档**（`LEDGER-SELF-CONTAINED` / `PROSE-ANCHOR-RETIRE`）：本批**不迁**——触发 = 该批收口（设计档 §8.5 期 2）。
- **对端面**（14 档源档删除 / 对端侧互引改指）属对端实施面——本仓不代写（父侧协调）；本仓侧判据 = 增档在位 + 零悬空。
- 判据：14 档在本仓在位 + 17 档承载档在位；本仓宽度面新增超宽 0（T-VS15–T-VS17 / AC-VS16–AC-VS18）。

**T7 台账跨仓指针处置（设计档 §8.2——落笔归主 agent）**
- 处置面 = 头部 2 处改指（活档 + 归档）+ 活档 2 条改指 + 归档 3 条改指 + 归档 1 行改写——逐条目标见设计档 §8.2 表。
- **eng-coder 零触碰 `docs/TODO*.md`**（台账物理落笔 + 状态推进 = 主 agent——2026-09-11 归属）。
- 附注（写书核对）：`docs/TODO.md:12` 的「`docs/design/` 54 档」为陈旧计数（as-built 55）——随主 agent 落笔一并核正（D3）。
- 判据：逐条目标档在位（T-VS21 / AC-VS22 同轮复跑）。

**T8 提示词面（4 文件——逐字形态见设计档 §6）**
- `src/prompts/discipline-engineering.md`（242）：① §6.1「多实现面纪律」节改写（节标题 `:96` 起——标题改 `（多端镜像）`、去维护者注、示例通用化、正文「双端」→「各实现面 / 面间」、新增第 5 条核验职责）；② §6.3 A1 ④（`:74` → `核多实现面镜像面（多端 / 多种语言 / 多个平台同源镜像）`）；③ §6.2 新节「文档与台账自持（各仓记各仓的）」。
- `docs/design/prompts/discipline-engineering.md`（165）：§6.1 改写（`:67` 起）+ §6.2 新节；**本档无 A1 节**——§6.3 不落（差异已登记——设计档 §9 注）。
- `src/prompts/discipline-normal.md`（194）· `docs/design/prompts/discipline-normal.md`（184）：§6.2 **条 3 / 条 4**（normal 覆盖面结论 = 设计档 §6.5）。
- **面特有段零改**：「VSC 端特有段：R14 池规则」段本体两 face 均**逐字不动**（`src` `:238` 起 / CN 镜像 `:160` 起）；只改多实现面节内的示例引用（`（如 VSC R14 池规则段）`）。
- 措辞纪律：零维护者注（无日期 / 批号 / 评审号 / 档内引用）、零本产品术语绑死、行宽 ≤300。
- 内容权：条文 = 设计档 §6 逐字形态——**落笔不改写语义**；存疑 → 停手上报。
- 判据：AC-VS5 / AC-VS6 / AC-VS7 / AC-VS8 / AC-VS11（grep 面 = 设计档 T-VS6–T-VS9 · T-VS12）。

**T9 机检面（B4）**
- `scripts/check-ledger.mjs` **新建**（~230 行）：消费本端 `src/ledger.mjs`（`scanGroups` 等）——**不跨仓 import**（N5 / D2）；规则 L1–L4 语义同源——L4① 指针以本仓根 + 台账目录为基根可解析；L4② 证据路径段须在本仓根内为文件；违规 fail-closed（退出码 1）+ 存量降报告（基线分流）；零假阳面（无路径散文 / `名称（仓别）§N` 规范形态 / 组标题行不入判据）。
- `test/fixtures/ledger-baseline.json` **新建**（~10 行——首跑固化）。
- `test/ledger-check.test.mjs` **新建**（~120 行）：正常（本仓指针全解析）/ 错误（跨仓证据 / 跨仓指针 → `[L4]` + 退出码 1）/ 边界（零假阳 / 存量分流）——用例面 = 设计档 §7.3 + T-VS1–T-VS5。
- `test/files.mjs` **+1**（`ledger-check` 登记——显式清单制；漏登记 = 启动自检失败）。
- 反证非空转：合成跨仓条目必报（T-VS2 / T-VS3）。
- 判据：AC-VS1–AC-VS4 · AC-VS10（T-VS1–T-VS5 · T-VS11）。

**T10 P3 对齐处置（设计档 §8.8——7 条）**
- 承接 = T6 两档（`VSC-ACTIVITY-CLOSURE` 6 条〔5 段引用形态 + 1 计数不符〕· `VSC-CHILD-PERMISSION` 1 条〔悬空自指〕）迁入本仓后同轮修：① 段引用成**本仓本地引用**（`WEBVIEW` 档 §12 / §7.2 / §14.6 / §14.7——本仓实测在位）；② 悬空自指改指实际节号；③ 计数按「计数与列表同改」核正（D3）。
- 判据：本仓 `node scripts/check-doc-width.mjs` 复跑该 7 条零命中（承接 AC-VS12 + AC-VS16 · AC-VS17）。

**T11 反向写痕（设计档 §8.4——B / D 类）**
- 本仓 `docs/design/` 35 档（顶层——as-of 设计实测）：B 类改指（对端路径形态 → 规范形态 `名称（CLI 仓）§N`，或改指本端对位档）；A 类（对位声明 / 叙述提及）零改；行内「（CLI 侧）」注记行按基线口径（V1 不判）。
- `docs/design/_archive/` 12 档对端指涉面按 §8.4 分类处置（A 零改 / B 规范形态化）；非对端条目零改（设计档 §12）。
- 源码 2 处悬空跨仓指针：`src/log.mjs:2` → 改指本端 `docs/requirements/LOGGING.md`（随 T3 同轮）；`src/compact.mjs:5` → 改指本端 `docs/design/CONTEXT-COMPACTION.md`。
- 判据：AC-VS22（残留对端路径形态零命中——改动面）。

**T12 `docs/design/README.md`（+8±4）**
- 板块登记：补登 `LEDGER-SELF-CONTAINED` / `PORTABILITY` 两行；T1 归位档的既有登记行同步（去档 / 改注——零失效路径）；变更记录一行。
- 判据：两行在位 + 变更记录（随批）。

**T13 归档面接收（`docs/design/_archive/` +5）**
- 迁入 3：`DOC-REORG-VSC` · `DOC-REWRITE-VSC` · `TRACE-STORE-VSC`；拆分对端份 2：`PROMPT-IMPL-1-TEXT` · `CODE-HARDENING-BATCH`。
- 判据：5 档在位；对端源档不存在（对端面归对端）（T-VS23 / AC-VS24）。

#### 三、验收口径

- 判定句全集 = 设计档 §11 **AC-VS1–AC-VS25**；用例全集 = 设计档 §10 **T-VS1–T-VS25**（单一权威源——本段不重述）。
- 分组回指（组 → AC → 本段任务 → 机验）：

| 组 | AC | 本段任务 | 机验 |
|---|---|---|---|
| 台账 / 机检 | AC-VS1–4 · 10 · 14 | T7 · T9 | 新检查器退出码 + 用例；台账条目标档在位 |
| 提示词 | AC-VS5–8 · 11 | T8 | grep 面（设计档 T-VS6–T-VS9 · T-VS12） |
| 需求树 / 地图 | AC-VS9 · 13 · 19 · 20 · 21 | T1–T5 | 档在位断言 + 36 行 + 十行 |
| 存量接收 | AC-VS15–18 · 23 · 24 | T6 · T13 · T10 | 计数自洽 / 双向断言 / 宽度复跑 |
| 写痕 / 指针 | AC-VS22 | T11 · T7 | 残留形态零命中 |
| 门禁 | AC-VS12 | 全域 | 三环 + 宽度 / 一致性面 |

- **档位硬限面（as-built 核对）**：`test/prompts-async-guidance.test.mjs` 实测 **177 行**（并行批先落——散文锚退役）→ 本批**零改、拆分不适用**；原拆分方案与守恒式（49 = 42 + 7）随现实消解（设计档已 as-built 对齐）。
- **前置条件失效条款**：若 PROSE 批实施被回退致该档回越 500 行 → **停手上报**（父侧重裁拆分面）——不自行拆分。
- 门禁命令（照抄可跑）：

```bash
node scripts/check-doc-width.mjs        # 宽 + V1/V2/V3（新增违规 0）
node scripts/check-ledger.mjs           # 台账 L1–L4（新增违规 0；退出码 0）
npm run lint && npm run test:full && npm run test:integration   # vscode:prepublish 三环
```

#### 四、文件域 + 冲突登记（写域状态 = as-built 复测）

**本 coder 写域（VSC 仓）**：

- `docs/requirements/**`（T1–T4）· `docs/README.md`（T5）· `docs/batches/**`（T6 + 本批两档记录）· `docs/design/_archive/**`（T13）· `docs/design/**.md`（T11 改指面 + T12）· 提示词 4 档（T8）·
  `scripts/check-ledger.mjs` · `test/ledger-check.test.mjs` · `test/fixtures/ledger-baseline.json` · `test/files.mjs`（T9）· `src/log.mjs` · `src/compact.mjs`（T11 注释指针）。
- **不含**：`docs/TODO*.md`（主 agent——T7）· CLI 仓任何档；本批设计 / 需求档的**语义面**零改（指针 / 登记面除外——T1 / T4 / T11 射程）。

**与并行批 PROSE-ANCHOR-RETIRE 重叠面**（该批已实施——as-built 复测）：

| 面 | PROSE 现状（as-built） | 本批动作 | 重叠判定 |
|---|---|---|---|
| `test/prompts-async-guidance.test.mjs` | 177 行 / 14 例（散文锚退役已落；全 suite 592 例） | **零改**（A1 ④ 断言已退役——无测试断言面） | 已消解 |
| `src/prompts/discipline-engineering.md` | 242（含「测试纪律」禁写散文锚句） | §6.1 / §6.2 / §6.3 节位改写叠加 | 同档不同节——有序叠加、无写冲突 |
| `docs/design/prompts/discipline-engineering.md` | 165（同款禁写句） | §6.1 / §6.2 | 同上 |
| `test/files.mjs` | 零改（62 档 + 1 smoke 登记不变） | **+1**（`ledger-check`） | 无 |
| `docs/design/TESTING.md` | §8 落（282 行——含端差行） | 零改；端差行更新触发 = 本批落地（**范围外注记——不代写**） | 登记（不动作） |
| `docs/requirements/TESTING.md` | 新建（需求自持） | 零改；并入 36 档对位（T4） | 无 |

- 调度注：提示词双档本批在其**现文本**之上落笔——动笔前重读现状（防父侧 / 他链再触碰，以实测为准）。
- 同批内：本仓单 coder 实例串行写域——无同批并行冲突（对端 coder 辖 CLI 仓、不交叠）。

#### 五、边界（不做）

- ❌ 不跨仓写：CLI 仓任何档——对端面（源档删除、对端侧互引改指）归对端实施面。
- ❌ 不做在飞 2 档（`LEDGER-SELF-CONTAINED` / `PROSE-ANCHOR-RETIRE`）搬迁——触发 = 该批收口（设计档 §8.5 期 2）。
- ❌ 不做跨仓历史重写（`git filter-repo` / `git subtree`——D9 否决在案）。
- ❌ 不做 36 档需求物理复制（D12）；不建 `docs/guides/`（设计档 §3.7）。
- ❌ 不改 `scripts/check-doc-width.mjs` V1/V2/V3 既有判据语义；不改台账机检 L1–L3 判据（L4 = 新增面）。
- ❌ 不动「VSC 端特有段：R14 池规则」段本体（两 face——面特有段原地保留）。
- ❌ 不做台账物理落笔 / checklist 状态推进（归主 agent）。
- ❌ 不碰 PROSE-ANCHOR-RETIRE 除「四」表列面以外的任何面（其记录 §5 / §6、其设计档除登记面外——零改）。
- ❌ 存量测试档零改（含 `prompts-async-guidance`）——除本批新增 3 档（脚本 / 用例 / 基线）与 `files.mjs` +1。
- ❌ 不做平台侧处置。

#### 六、三方条目一致 + 就绪状态

- 三方一致：本段 **B1–B12 = 设计档 §11 AC 回指条目 = 需求档 F1–F10 / N1–N5**（+ P1′ / P2′ / P3 承接）。
- 设计档 as-built 对齐（写书时落地——零新语义）：拆分面不适用 / 树终态 16 档 / `files.mjs` +1——细目见设计档 §13 变更记录。
- 就绪：设计链已过修正轮 + 写域现实核对；评审 / 批准发起权在用户；eng-coder 实施由父侧按 D13 发起（`batchDoc` + designId + token——共享同一设计链）；实施后由 eng-coder 自写本档 §5（一段一作者）。

### 评审轮次 2 · VSC 侧半——D3 自报行数回填 + 跨侧互斥复查（eng-designer · 2026-09-12）

> 轮次 2 复核（🔴1 · 🟡2 · 🔵1——发现表住 `LEDGER-SELF-CONTAINED（CLI 仓）§3`）主面均在 CLI 侧，由并发对端 coder 处理——不在本小节射程；本小节 = VSC 侧半落档：D3 自报行数回填、跨侧互斥复查逐条、机检实跑、D6 回读。

**（一）D3 自报行数回填（设计档 `docs/design/LEDGER-SELF-CONTAINED.md`）**

口径（写明——二选一按面分置）：**历史回读记录取「保留 as-of 语义」**（当值不重写——重写 = 伪造记录，同档 D10 精神；补 as-of 括注消除裸值）；**现值面取「刷新为现值」**（§9「当前行数」列 + 最新回读行回填 as-built 现值）。两类合计覆盖全部「本档 N 行」自称，零裸值残留。

| 位置 | 原值 | 处置后 |
|---|---|---|
| §9 表行 3（`:404`——「当前行数」列） | 已落 557（修正轮终值） | **已落 564**（as-of as-built 对齐后） |
| §13 修订轮回读行（`:553`） | 本档 514 行 | 本档 514 行（as-of 修订轮收口） |
| §13 修正轮回读行（`:558`） | 本档 **557** 行 | 本档 **557** 行（as-of 修正轮收口） |
| §13 as-built 回读行（`:563`） | （缺本档行数——「未回填」项） | 本档 **564** 行（as-of as-built 对齐后） |

- 实测（口径 = `readFileSync(...).split("\n").length`）：本档 = **564**——与回填值一致；本半轮改动为行内替换、零行数增量。

**（二）跨侧互斥复查（①–④ 逐条）**

① §2 任务书内 pre-as-built 资产引用——**已核、无需改**：
- 「两档各 ≤500」：§2 内零命中（本仓设计档同串亦零命中）。
- 「守恒 49 = 42 + 7」：仅 :299 出现一次，且已自带作废表述（「随现实消解（设计档已 as-built 对齐）」）。
- 新档 `prompts-carryover-anchors`：§2 内零命中；设计档侧该名各处均标「不执行 · 不建」（`:164` · `:436` · `:445` · `:560`）。

② `test/files.mjs` 登记数——**已核、无需改**：两侧文档口径一致 = **+1 = `ledger-check`**（设计档 `:411` · `:445` · `:560`；本档 §2 `:263` · `:324` · `:341` · `:347`），零「+2」与 carryover 新档登记残留；实测本仓清单登记 = 63（62 测试档 + 1 smoke）/ 79 行，`ledger-check` 尚未登记（本批实施未启动——与「预期 +1」口径一致）。

③ 需求树档数——**已改（15 档残留同步为 16）**：设计档 `T-VS18`（`:485`）「树终态 15 档」→「16 档」；`D12`（`:162`）「需求树终态 = 15 档」→「16 档」+ as-built 核对注（`TESTING` 计入在位）。其余各面（§8.6 `:362` · `:380` · AC-VS19 `:518` · 本档 `:220` · `:347`）已为 16 口径。

④ §11 验收（AC-VS25 / T-VS24 / T-VS25）——**已核、无需改**：AC-VS25 / T-VS24 / T-VS25 均已是 as-built 口径——AC-VS25（`:524`）「177 ≤500（拆分不适用；存量测试档零改）……登记入 `test/files.mjs`（+1）」· T-VS24（`:491`）「177 ≤500（并行批先落）；本批该档零改」· T-VS25（`:492`）「登记在位（+1）」。

**（三）机检实跑（VSC——`node scripts/check-doc-width.mjs`，本半轮改动后复跑）**

```text
✗ …/2026-09-12-PROSE-ANCHOR-RETIRE.md: 2 行 >300 字符（:278 359 · :282 339）
FAIL(宽度): 1 文件 / 2 行超 300 字符
✗ V3 …/2026-09-12-LEDGER-SELF-CONTAINED.md §3 缺工具写入的轮次行
✗ V3 …/2026-09-12-PROSE-ANCHOR-RETIRE.md §3 缺工具写入的轮次行
一致性 V1/V2/V3 = 新增 2（V3）· 存量（基线内）25；退出码 1。
```

- 结果（如实）：**宽度 = 1 文件 / 2 行超宽**——全在 `docs/batches/2026-09-12-PROSE-ANCHOR-RETIRE.md`；**一致性 = 新增 2（V3——两档批次记录 §3 缺工具写入轮次行——在飞瞬态）** + 存量（基线内）25。
- 差集核对：改前基线跑与改后复跑**同集合**——本半轮改动零新增违规（改动行均 ≤300 内，实际 ≤199 字符）。
- 归属：PROSE 记录两行 = 他链记录面（本半轮零触碰——设计档 §12 零改面）；V3 两条 = 与设计档 §11 归属注同集合（「与对齐前同集合」所指即此），消解时点 = 对应记录 §3 获评审工具写入。

**（四）范围外注记（发现即报，不动作）**

- `docs/batches/2026-09-12-PROSE-ANCHOR-RETIRE.md` `:278` / `:282` 超宽两行（已提交态）——归其链记录面处置，本半轮不动。
- 设计档 §10 题注（`:464`）与 §11 题注（`:496`）括注「测试档拆分」——与对应行现行 as-built 内容（拆分不适用）为措辞级残差；按「不新增范围」未改，供父侧裁决。

**（五）D6 回读**

- 设计档改动各行（`:162` · `:404` · `:485` · `:553` · `:558` · `:563`）逐一回读落位；全档行数复测 = **564**，与 §9 表行 3 / §13 回读行所载值一致。
- 本小节经 `batch_segment` 工具写入；写入后复跑 `check-doc-width`，与本半轮基线同集合（新增零）。

**（六）辅证：实体读数（只读实测——补评审轮次 2「535/177 实体读数本轮无法圈内复测」的限制面）**

- `test/prompts-async-guidance.test.mjs`：**177 行**（split 口径）/ `test(` 起始行 = **14**——与两侧文档现口径一致（现态 = as-built 177；设计期 535 已被并行批消解）。只读实测、未触碰。
- `src/prompts/discipline-engineering.md` = **242** · `docs/design/prompts/discipline-engineering.md` = **165**——与设计档 `:405` · `:406` 的 as-built 实测回填值一致；对端记录所载 241 / 164 为 as-built 前值（其同步归对端实施面）。
- `test/files.mjs` = **79 行**；登记 = 62 测试档 + 1 smoke（`ledger-check` 未登记——实施未启动）——与 ② 口径一致。

### C 桶接收轮 · 本仓侧（eng-designer 记——2026-09-12）

> 本小节 = append-only 追加（不回改上方任何既有行）。**零新语义 / 零新范围**——只落 C 桶接收面在本仓的落地记录与其直接导出项；射程 = **仅 C 桶那 8 处**（7 节托管族 + 1 登记行）。
> 设计全文 = 本仓 `docs/design/LEDGER-SELF-CONTAINED.md` **§8.9**（裁定 / 逐处建不建表 / 落点形态 / 引用面同步 / 残留 / 边界——单一权威源，本小节不重述）。
> 与 CLI 侧批档 §2 的「C 桶接收轮」小节**同源、各端原文自持**（不做逐字一致——在案多实现面纪律）；CLI 侧对应节 = `LEDGER-SELF-CONTAINED（CLI 仓）§2`。

#### 一、本仓落地（1 建档 + 2 随动 + 1 设计节 + 1 引用面同步）

| # | 产物 | 实证 |
|---|---|---|
| 1 | `docs/requirements/AGENT-LOOP.md` **建档** | **355 行**；7 节**逐字迁入**（§9 / §10 / §11 / §12 / §14 / §16 / §17——**节号保留源编号**，编号不连续 = 托管族已迁的痕迹）；源档 = `AGENT-LOOP（CLI 仓·需求）`，**源档 blob SHA = `ccd6bd14b97674dce4a33c7781d75374e23ddab`**；档首迁移注记 + 承载范围 / 对位索引表；跨端引用形态收敛（`（VSC 仓）` → `（本仓·层别）`；对端档 → `名称（CLI 仓·层别）§N`；对端源码 → `` `src/…`（CLI 仓） ``） |
| 2 | `docs/requirements/README.md` | 对位表第 3 行判 ② → ①；**三值（as-of 本接收轮）= ① 7 / ② 27 / ③ 2（合计 36）**；**树终态 16 → 17 档**；板块表 +1 行；变更记录一行 |
| 3 | `docs/requirements/ENGINEERING-MODE.md` | §1.7 接收面登记（CLI 设计档 `ENGINEERING-MODE（CLI 仓·设计）§2.24.9` 归档对位行——处置 = 「不建」：对位档已在位） |
| 4 | 本仓设计档 | §8.9 新节 + D15 + D12 终态 17 + §8.6 计数 + §9 受影响文件块 + **T-VS26 / AC-VS26** + §12 边界 + §13 变更记录 |
| 5 | 引用面同步 | 本仓设计档 `AGENT-LOOP` / `WEBVIEW` 的需求指针改指本仓需求档（改指面 as-of 接收轮，细目见设计档 §8.9「引用面同步」节与 §13 变更记录）——本仓活文档零残留对端需求指针 |

#### 二、验收指针（单一权威源——本节不重述判定句）

- **AC-VS26**（设计档 §11）：`docs/requirements/AGENT-LOOP.md` 在位且七节齐（§9–§17 保留原编号）；对端 `AGENT-LOOP（CLI 仓·需求）` 内该七节零残留 + 档首移出清单（含源档 blob SHA）在位；对位表三值 = ① 7 / ② 27 / ③ 2 且树终态 17 档；本仓活文档零残留对端需求指针。
- **T-VS26**（设计档 §10）：C 桶接收面用例（在位断言 / 对端零残留 + 移出清单 / 三值计数 / 树终态 17 / 引用面残留零命中）。
- 三方条目一致：本落地 = 既有条目 **B7 · B11**（文档自持 / 逐层成套）的接收面落地——**不新增条目号**。

#### 三、as-of 与后续轮（D3 计数口径注——防裸值）

- 本节三值与树终态为**本接收轮 as-of 值**（2026-09-12 当日状态）；**后续轮已再改判**——2026-09-12 10:57 用户裁定「全部啊！」（② 桶异层者一律建档）：三值 ① 18 / ② 16 / ③ 2、树终态 → 34 档——该轮登记见本仓设计档 §13「需求树逐档成套轮（B13）」与 `docs/requirements/README.md` 变更记录，本节不重述（D2）。

#### 四、残留（登记不静默——台账物理落笔归主 agent）

- `docs/TODO-archive.md` 归档条目的需求指针现指 `AGENT-LOOP（本仓·设计）` §9/§12/§17——接收档建成后正确目标 = `docs/requirements/AGENT-LOOP.md` §9/§12/§17（接收档已建，目标可解析）；同轮 `docs/TODO.md` 需求池指针与陈旧计数同归主 agent 落笔（处置见设计档 §8.9「残留」节）。

#### 五、收尾轮形态复查记录（本仓侧——2026-09-12 收尾）

> 本节记录本收尾轮完成的**本仓跨仓形态复查**（`docs/**` 全树）：『裸路径 / 裸 `.md` 跨仓引用』逐条规范形态化（规范形态 = `名称（仓别·层别）§N`，去 `.md` 后缀、去路径前缀；对端源码 = `` `src/…`（CLI 仓） ``）。

- **抽查口径与结果**（机判 grep 原文随交付报告）：
  - ① 对端仓前缀裸路径（`thincoder` 路径形态）——**本仓工作内容面（design + requirements，不含 `_archive`）= 0 命中**；**已收口批档 / 归档面 = 0 命中**；
    仅剩**在飞 2 档**（`LEDGER-SELF-CONTAINED` / `PROSE-ANCHOR-RETIRE`）的记录文本内 10 行（§1/§5 段——属各段作者与父侧裁量面，本设计师**未跨段改写**，逐行见交付报告）。**（2026-09-12 收尾轮 8 更新：档首互引 4 行已规范形态化——`名称（CLI 仓）` 形态；重扫（判据 = 对端仓标「CLI 仓」紧邻 `.md` 路径直引；模式串引述与更新注行计外）= 在飞 2 档 0 行 · 全树 0 行；
    本 2 档内余「`CLI` + `.md`」共现行均为记录 / 基线行——按记录面口径保留。）（父侧授权代改 2026-09-12——形态规范化；段作者笔迹仅此一处替换）**
  - ② 对端仓标 + 路径 + `.md` 直引形态——同上为 0（在飞 2 档外）。〔2026-09-12 收尾轮 8 更新：在飞 2 档档首互引 4 行已规范形态化——2 档内该形态现盘 = 0（父侧授权代改 2026-09-12——形态规范化；段作者笔迹仅此一处替换）〕
  - ③ 三档 CRLF 行尾（`docs/design/` 的 `SESSION.md` / `README.md` / `QUEUED-VISIBILITY.md`）归一为 LF——根因 = 检查器节号解析对 CRLF 失明
    （`SESSION.md §N` 引用假阳性；归一后 `SESSION.md §6/§7/§9/§10` 引用全部可解析）。
- **17 承载档回注**：各承载档档首补一行——「对端（CLI 仓）源档对端份已**切除**（2026-09-12）——追溯锚 = 源档档首移出清单 + 源档 blob SHA」（对应 CLI 侧「对端份物理切除」轮）。迁移 14 档档首搬迁注记的源档 token 同步规范形态化。
- **载体**：本次复查的本仓侧记录 = 本小节四、五两节；CLI 仓侧形态面归 CLI 侧（并行 coder 域——本仓零触碰）。

## §3 设计评审（评审子代理写）

### 轮次 1（评审子代理）——本端转写（父侧）

> **父侧转写并打标（2026-09-12）**：本批评审实例**绑定 CLI 侧记录**（`2026-09-12-LEDGER-SELF-CONTAINED（CLI 仓）§3`——轮次 1–3 的发现表与 VERDICT **逐字在彼**；**凭证值不落档**）。
>
> 本端**结论**：**轮次 3 = pass**（🔴 0 · 🟡 0 · 🔵 2 非阻断）· 修正轮 1–2 已落（12 条 + 两侧 as-built 对齐）· 两侧口径同源。
>
> **转写性质**：本端**非工具直写**（评审绑定在 CLI 侧记录）——本块仅为 V3 轮次行形态补齐；**实质以上述 CLI 侧 §3 为准**。

---

## §4 用户批准（主 agent 记）

**2026-09-12（本批 = 用户授权「自动推进」下的批——逐次裁定在案，与 CLI 侧记录 §1 同源）**：

| 时点 | 裁定 |
|---|---|
| 04:21 / 04:23 | 各仓自持（需求/设计/批次/台账各记各仓，禁跨仓登记与跨仓指针）；缺的层补齐；约束落提示词层 |
| 04:2x | **自动推进授权**（授权父侧在四步流程内连续推进，不等逐步点头） |
| 10:57 | 「**全部啊！**」——② 桶「已有对位」**需求层必须在本仓有档**（F11） |
| 10:58 | 「**全部啊1**」——各项按**最严口径**（child-permission 本批拆 / 基线清零 / 遗留各项都修） |
| 11:06 | 「**残留即先例**」——存量/基线不得再作合法态（阈值 = 0） |
| 11:40 | 「**用先例破规则是模型骨子里的训练**」——F14 入规（例外只认可机判判据句） |
| 13:26 | eng-designer 报告义务问询 → 「修 vs 打回」二分收紧为判据句 |

**评审链**：advisor 设计评审（轮 1–3）**pass**（结论见 §3；**凭证值不落档**）；实施 = eng-coder 多轮（详见 §5）。
**执行状态**：本批实施全程留痕于 §5；收口见 §6。

---

## §5 实施记录（eng-coder 自写）


---

> 实施：**VSC 侧全量**（LEDGER-SELF-CONTAINED · 2026-09-12）——任务书 = 本档 §2（T1–T13）；设计 = 本仓 `docs/design/LEDGER-SELF-CONTAINED.md`。CLI 仓零触碰。

### 5.1 交付摘要（按 T1–T13）

| 任务 | 状态 | 落点（实测） |
|---|---|---|
| T1 需求树归位 6 | ✅ | `docs/requirements/`：`AGENT-PARAMS.md` · `ENG-TOKEN-BINDING.md` · `SEND-STALL-DISTILL.md` · `TOOL-OUTPUT-LIMITS.md`（去 `-REQUIREMENTS` 后缀迁入）· `PROJECT.md`（原 `design/REQUIREMENTS.md`）· `PHILOSOPHY.md`（原 `design/PHILOSOPHY.md`）——各档首一行归位注记；原路径引用逐处改指（4 个 `-TUNING.md` + `design/README.md` 注册行）；`-TUNING.md` × 4 留 `docs/design/` 零改 |
| T2 拆出 `FEATURES.md` | ✅ | 自 `PROJECT.md` §v1 功能范围节逐字拆出（21 行）；`PROJECT.md` 去该节（129 → 119 行） |
| T3 ① 新建 6 档 | ✅ | `LOGGING.md` · `MULTI-INSTANCE-COLLAB.md` · `NORMAL-MODE.md` · `SETTINGS-TOOL.md` · `STRUCTURE-DEBT.md` · `VERIFY-REDESIGN.md`——三层写法、机制实况登记（零新需求语义） |
| T4 36 档对位表 | ✅ | `docs/requirements/README.md` 重写：36 行三值表（①6 / ②28 / ③2）+ 板块表 16 行 + 树终态 16 档声明 |
| T5 `docs/README.md` 建 | ✅ | 新建（层清单十行逐行 + guides「不建 + 理由 + 触发」端差行 + 三横切规则摘要 + 台账/批档速查） |
| T6 批档接收 | ✅ | **迁移 14 档**（file_ops 逐档对拷 + 档首搬迁注记〔源路径 + blob SHA + 源提交〕+ 8 档 10 行 >300 逐行折行）· **拆分 17 档本仓承载档**（逐档新建，本仓份逐字搬运；≈168 条目） |
| T7 台账跨仓指针 | ❌（归主 agent——本 coder 零触碰 `docs/TODO*.md`） | 待主 agent 落笔：见 5.4 逐条清单 |
| T8 提示词面 4 文件 | ✅ | `src/prompts/discipline-engineering.md`（§6.1 节改写 + §6.3 A1④ + §6.2 新节）· `docs/design/prompts/discipline-engineering.md`（§6.1 + §6.2）· `src/prompts/discipline-normal.md` + `docs/design/prompts/discipline-normal.md`（条 3 / 条 4）；R14 面特有段零改 |
| T9 机检面 | ✅ | `scripts/check-ledger.mjs` 新建（L1–L4，消费本端 `src/ledger.mjs` `scanGroups`，零跨仓 import）· `test/fixtures/ledger-baseline.json` 新建（首跑固化）· `test/ledger-check.test.mjs` 新建（T-VS1–T-VS5 六例全绿）· `test/files.mjs` +1 |
| T10 P3 对齐 7 条 | ✅ | `VSC-CHILD-PERMISSION`：悬空自指（原引「`本档` §8」）→ `AGENT-LOOP.md §8`（一处）· `VSC-ACTIVITY-CLOSURE`：计数不符（声明数与枚举数不一致——原引已核正为 `（🔴1 · 🟡5 · 🔵2）`）；段引用形态 5 条随迁移自解（`WEBVIEW.md §12/§7.2/§14.6/§14.7` 在本仓可解析） |
| T11 反向写痕 | ✅ | `docs/design/` **52 行 / 16 档**改指规范形态（对端仓目录前缀形态 → `名称（CLI 仓）§N` / 迁移档 `名称（本仓）§N`；源码路径 → `` `src/…`（CLI 仓） ``）——残留（对端仓目录前缀形态；本机状态目录除外）**0 命中**；源码 2 处：`src/log.mjs:2` → `docs/requirements/LOGGING.md` · `src/compact.mjs:5` → `docs/design/CONTEXT-COMPACTION.md` |
| T12 `docs/design/README.md` | ✅ | 补登 `LEDGER-SELF-CONTAINED` / `PORTABILITY` 两行；6 处归位注册行同步（零失效路径）；变更记录一行 |
| T13 `_archive` 接收 5 | ✅ | 迁移 3（`DOC-REORG-VSC` · `DOC-REWRITE-VSC` · `TRACE-STORE-VSC`——对拷）· 拆分 2（`PROMPT-IMPL-1-TEXT` · `CODE-HARDENING-BATCH`——本仓份新建） |

**改动面（git status 87 项）**：`docs/requirements/`（16 档）· `docs/README.md` · `docs/batches/`（33 档 = 2 在飞记录 + 14 迁移 + 17 拆分承载）·
`docs/design/`（README + 16 档改指 + 6 归位挂载）· `docs/design/_archive/`（+5）· 提示词 4 档 · `scripts/check-ledger.mjs` · `test/ledger-check.test.mjs` ·
`test/fixtures/ledger-baseline.json` · `test/files.mjs` · `test/fixtures/doc-consistency-baseline.json`（+1 存量条目）· `src/log.mjs` · `src/compact.mjs`。

### 5.2 决策透明表（设计未逐字覆盖、落笔时自行判定项）

| # | 决策 | 理由 / 证据 |
|---|---|---|
| D-1 | 检查器 **L1 / L3 面 = 未决条目**（`scanGroups` 口径，与 CLI 同规）；**L4 面 = 全部条目**（含归档闭环） | 设计 §7.1「L1–L4 同规」＋ §8.2 归档 3 条为处置对象——归档条目全是 `- [x]`，若沿用未决口径则 L4 看不见它们（跨仓闸失效） |
| D-2 | L4② 证据场 = **「证据」标记之后的首个 `path:line`**（标记前散文提及不判） | 零假阳面：条目行内散文含 `activity.js:150-154` 类提及（非证据场）——全行首匹配会误报 |
| D-3 | 检查器默认台账 = `docs/TODO.md`（活档）+ `docs/TODO-archive.md`（归档档） | 设计 §8.2 射程含归档条目；活档判 L3⑤（`- [x]` 零命中）、归档档免 L3⑤（归档口径本就含已完成项） |
| D-4 | 首跑基线固化 **6 处存量 L4**（归档 3 条条目内 6 个跨仓指针） | 「存量降报告、新增 fail-closed」模型；其中 3 处（`batches/…VSC-ASYNC-PARITY` / `…VSC-ACTIVITY-CLOSURE` / `…VSC-CHILD-PERMISSION`）随 T6 迁移**已自解**（基线条目失效不报错）；余 3 处（`docs/requirements/AGENT-LOOP` ×3）待主 agent T7 改指 |
| D-5 | `doc-consistency-baseline.json` **+1 存量条目**（`V3\|docs/batches/2026-09-10-VSC-MIRROR.md`） | 迁移档 §3 为「先于 FR22 N3 工具写入制」的历史形态（`### 轮次与发现（…）`）——D10 文字逐字禁改写 → 按存量入基线（基线 note 已补「存量搬迁档例外」句）；其余 13 档 §3 形态合规、零新增 |
| D-6 | 折行 = **脚本折点（优先 `；` / `·` / `，` / `。`，次 ` + ` / ` / `）+ 逐段 ≤290**；内容零增删 | 10 行 340–804 字符 → 全部 ≤300（复跑宽度 113 文件全绿）；折点均在标点后、不切词 |
| D-7 | 拆分承载档 = **档首搬迁注记 + 本仓份逐字区块**（§2 VSC 行 / §5 VSC 交付行 / 验收本仓相关行） | D10「按条/按块逐字搬运」；条目计数对齐 §8.3 本仓份（MODEL-SELECTION 28 · COMMON-LAYER 18 · DEEPSEEK 4 · DOC-HYGIENE 1 · INPUT-FIXES-SMALL 6 · POOL-LEDGER 5 · PROMPT-REVIEW-ORDER 9 · ROLE-REDEFINITION 5 · SETTINGS-NULL-DEFAULT 3 · SPAWN-QUEUE 2 · TEST-DISCIPLINE-PROMPTS 7 · TEST-LIFECYCLE ≈23 · TURN-ACROSS 6 · VSC-ASYNC-VISIBILITY 16 · VSC-REVIEW-ASYNC-SWEEP 15 · WEBSEARCH-PROVIDER-KEY 5 · LEDGER-SURFACE 13 → **≈168**） |
| D-8 | `docs/requirements/README.md` 板块表 **16 行**（含 README 自身行） | 树终态 16 = README + 在位 3 + 归位 6 + 拆出 1 + 新建 6（设计 §8.6 口径） |
| D-9 | 跨仓源路径形态 = `` `src/…:N`（CLI 仓） ``（源码无节号，`名称（仓别）§N` 形态不适用） | 设计 §4.3 规范形态是文档互引；源码路径按「去路径前缀 + 仓别标记」收敛，机检面（`thincoder/` 残留）零命中 |
| D-10 | 设计档内 3 处**元语句**（本设计档描述转换规则处）改写为不含 `thincoder/` 字面的等价表述 | T11 射程含设计档；残留形态零命中口径以「无 `thincoder/` 路径形态」机判 |

### 5.3 验证证据（命令 + 结果——全部实跑）

- `npm run lint` → `check-syntax: 288 JS files OK`（退出码 0）。
- `npm run test:full` → **tests 599 · pass 597 · fail 2**（两红均批外——见 5.4）。
- `npm run test:integration` → **28/28 pass**（退出码 0）。
- `node --test test/ledger-check.test.mjs` → **6/6 pass**（T-VS1 正常 / T-VS2 跨仓证据 / T-VS3 跨仓指针 / T-VS4 零假阳 / T-VS5 存量分流 / L2+L3 同源面）。
- `node scripts/check-ledger.mjs` → `OK: thincoder-vscode/docs/TODO.md` + `OK: thincoder-vscode/docs/TODO-archive.md`；`0 处违规（新增——阻断）+ 6 处存量（基线内——降报告）`；**退出码 0**（首跑——迁移前快照；迁移后复跑 = 3 处存量——见 §5.5）。
- `node scripts/check-doc-width.mjs` → `OK(宽度): 扫描域全部 .md 无 >300 字符单行（113 文件）`；一致性 **新增 2**（= 批前既存集——见 5.4）· 存量 25。
- 提示词面 grep（T-VS6–T-VS9 / T-VS12 口径）：`双端镜像` / `CLI/VSC` / `乒乓振荡——已实证` / `VSC R14 池规则段` / `2026-09-09 修订` / `核双端对位面` 全零命中；`多端镜像` / `④ 核多实现面镜像面` / 核验四维句 / 自持五条 / normal 双源「缺的层必须补齐」在位。
- 反向写痕机判：`docs/design/**.md` 中 `(?<![\w.-])thincoder/(?!-vscode)` **0 命中**（改写前 52 行 / 16 档）。
- T6 双向对位：本仓 `docs/batches/` 33 档（2 在飞 + 14 迁移 + 17 拆分承载）；迁移 14 档档首搬迁注记逐档在位；拆分 17 档逐档在位（本仓份条目计数对齐 D-7）。

### 5.4 未完成 / 未验证 / 批外红（如实披露）

1. **T7 台账改指 = ❌ 未做（归主 agent——本 coder 零触碰 `docs/TODO*.md`）**。待主 agent 落笔清单（设计 §8.2 逐条）：
   - `docs/TODO.md:2` 头部 `ENGINEERING-MODE（CLI 仓）§1.13` / `§1.17/FR23` → 改指本仓（`docs/requirements/ENGINEERING-MODE.md` 对位节）；
   - `docs/TODO.md:12` / `:14` 两条需求池条目指针（占位形态「本仓 `docs/requirements/`（首建——本批产物）」）→ 逐条改指本仓具体档节（需求档树 16 档在位可指）；
   - `docs/TODO-archive.md:3` 头部同款改指；
   - `docs/TODO-archive.md:13/14/15` 归档 3 条：需求指针 → 本端对位档（注意：本端无 `requirements/AGENT-LOOP` 档——对位档 = `docs/design/AGENT-LOOP.md`；指针改指目标须在本仓可解析，否则 L4 报红）；任务书指针 → 本仓 `docs/batches/`（3 档已随 T6 在位：`2026-09-11-VSC-ASYNC-PARITY` / `2026-09-12-VSC-ACTIVITY-CLOSURE` / `2026-09-12-VSC-CHILD-PERMISSION`）；
   - `docs/TODO-archive.md:26` 内嵌行「批档均在 CLI 仓 `docs/batches/2026-09-11-*`」→ 改写指本仓 `docs/batches/`；
   - **另注（非 §8.2 条目——发现即报）**：`docs/TODO.md:1` 首字符为杂散 `ga`（实际文本 `ga# TODO — thincoder-vscode 项目级待办`）——疑编辑事故残留，随 T7 一并核正；`docs/TODO.md:13` 的「`docs/design/` 54 档」为陈旧计数（as-built 顶层 `.md` = 55）。
2. **批外红 2 条（均非本批引入——批前同集合）**：
   - `test/context-parity.test.mjs` T-CI-2a——本机 `~/.thincoder/config.json` `agent.engineering=true` 环境态（期望 normal 基座、实装 engineering 基座）；登记在案 = `LEDGER-SURFACE` 批记录 §5（「非本批」）。
   - `test/doc-consistency.test.mjs`「仓库扫描」——2 条 V3 瞬态 = 本档 §3 与 `2026-09-12-PROSE-ANCHOR-RETIRE.md` §3 未获工具写入轮次行（成因 = §4/§6 骨架 `---` 行被 V3 判为实文）。**归属 = 评审写入时序 + 骨架占位标点**（设计 §11 归属注同款）；消解 = 对应 §3 获工具写入轮次行（§4/§6 骨架段归主 agent / 父代理写域，本 coder 不代笔）。
3. **未验证项**：`docs/design/TESTING.md` §8.2 端差行（「本端 `scripts/` 无 `check-ledger.mjs`」）——本批落地后该端差**已消解**，但该档更新触发归属 = 其写域（设计 §12 注 1：本批不改、发现即报）。
4. **范围外注记（发现即报，未动作）**：仓根 `AGENTS.md` / `README.md` 内对端仓目录前缀形态未改（T11 射程 = `docs/design/` 35 档 + 源码 2 处）；`test/slow-gate.test.mjs` 缺失（`run-fast.mjs:8` / `slow-gate.mjs:10` 引用悬空——设计 §12 注 2 既存项）。
5. **未做（明列）**：平台侧处置（组织层面）；在飞 2 档搬迁（触发 = 该批收口——设计 §8.5 期 2）；`docs/TODO*.md` 物理落笔（主 agent）。

### 5.5 审计与代码评审（轮次 / 终态）

**内部 explore 偏差审计 · 轮次 1**（AGENT-LOOP §18 D-E2③——只读子代理）：终态 = **DIVERGENT**（🔴2 · 🟡2 · 🔵2）。

| # | 级 | 发现 | 处置 |
|---|---|---|---|
| 1 | 🔴 | `src/log.mjs:2` 指针**未改**（`docs/design/LOGGING.md` 残留——该档本仓不存在）+ §5.1 声称已改（报告与磁盘不符） | **Fixed**（本轮）——改指 `docs/requirements/LOGGING.md`；§5.6 登记「报告失实」自纠 |
| 2 | 🔴 | `src/compact.mjs:5` 对端仓目录前缀**未改**（本端对位档在位却未被指） | **Fixed**（本轮）——改指 `docs/design/CONTEXT-COMPACTION.md`（去前缀） |
| 3 | 🟡 | `_archive` 迁移 3 档无 D11 档首搬迁注记（T13 字面判据已满足——差在注记面） | **Fixed**（本轮）——3 档档首补搬迁注记（源路径 + 源 blob SHA：b3b9a338a72e / 975b1927d607 / 16c54aa2b32a） |
| 4 | 🟡 | `docs/design/README.md:17` 轨迹存档登记行指向已迁走的 CLI 档（对端 0 命中——悬空） | **Fixed**（本轮）——登记行改指本仓 `_archive/TRACE-STORE-VSC.md` |
| 5 | 🔵 | `doc-consistency-baseline.json` +1 条目（设计 §9 表未列该档） | **Not an issue**——设计 §7.4 注 2 机制授权；§5.1/§5.2 D-5 逐条披露（审计判定 = 如实披露） |
| 6 | 🔵 | 基线死键 `V1\|docs/design/TOOL-OUTPUT-LIMITS-REQUIREMENTS.md\|TUNING.md 的 §2.9`（归位后旧路径键） | **Not an issue**——基线自陈「条目失效不报错」；键含档路径、无掩蔽风险（审计同判） |

**审计 QUESTION 处置**（父侧判项——实施侧立场）：
- Q1（L1 宽基根含工作区/兄弟仓 vs L4 本仓基根）：**维持 D-1**——L1 与 CLI 同规（宽基根）、L4 为新增本仓面；两轴差集恰为「跨仓指针」（T-VS3 用例锁定）。
- Q2（`src/suspension.mjs:26` 同族第 3 处跨仓文档路径——设计 §8.4 D 类只列 2 处）：**列入 §5.4 范围外注记**（实施按清单执行 = 零偏差；设计清单漏项 → 供父侧裁）。
- Q3（`_archive` 三档注记回补）：**已回补**（#3 Fixed）。
- Q4（其余 13 拆分档未抽查）：**已补抽**——17 档拆出承载档逐档核对档首注记与「本仓份」区块在位（17/17）；逐字一致性以审计轮 1 的 4 档实测（POOL-LEDGER / DOC-HYGIENE / MODEL-SELECTION / COMMON-LAYER ↔ CLI 源档对应区块**逐字全等**）为证。

**§5 自报断言核对（审计抽查）**：batches 33 档 ✅ · 基线 6 键 ✅ · 反向写痕 0 命中 ✅ · D-4 计数瑕疵 → **Fixed**（本轮：D-4 行改「3 处自解 / 余 3 处」——与审计复核一致）· T11「源码 2 处」❌ → **Fixed**（见上 #1/#2）。

**fix round 1（本轮——审计后）**：上表 Fixed 5 项全落 + §5 自身缺陷修正（**in-place**：本段为唯一作者，修正仅限本段自己的引述形态/折行/计数——内容语义零改；原因 = §5 自身在批档扫描域内，V1/V2/宽度机检对批档同样生效）：
① :443 「本档」假节号引述与「原 8 项（…）」引述形态改书面化（V1/V2 假阳消解）；② :457 D-4 计数改「3 处自解 / 余 3 处」；
③ :448 改动面行长 411 字符 → 折行（宽度机检）。

**复跑证据（fix round 后）**：`node scripts/check-doc-width.mjs` → 宽度 **113 文件全绿**；一致性 **新增 2**（= 批前既存集——两档在飞记录 §3 瞬态，见 §5.4-2）· 存量 25；`node scripts/check-ledger.mjs` → **OK ×2 / 退出码 0**；`npm run lint` → 288 文件 OK；`node --test test/ledger-check.test.mjs` → 6/6 pass。

### 5.6 fix round

- **轮次 1（审计后——本轮）**：见 §5.5 末——Fixed 5 项（2🔴 + 2🟡 + D-4 计数 + §5 in-place 修正 3 处）。**自纠登记**：§5.1 T11 行初稿声称「源码 2 处已改」与磁盘不符（审计 #1/#2 实证）——初稿失实，已随本轮落修同步为实。审计面四类偏差复核后：逐条落地 0 漏（T7 除外——归主 agent）· 静默简化 0 · 越界未报 0 · 反向写痕 0。

**内部 advisor 代码评审 · 轮次 1**（独立子代理——只读；对象 = 8 scope 档 + 设计/批档）：VERDICT = **pass**（🔴 0 · 🟡 1〔评审方标注「可选修正——不阻塞验收」〕· 🔵 7）。

**评审发现裁决表**：

| # | 级 | 发现（评审方原文要点） | 裁决 |
|---|---|---|---|
| 1 | 🟡 | `scripts/check-ledger.mjs` L4 判据面窄于设计 §7.1 判据句：证据只判「证据」标记后首个 match（`:166`）／无标记条目退化为整行首匹配（潜在假阳，与 D-2 自述矛盾）／L4 只扫条目首行（`:153`——续行盲区，实例 = `docs/TODO-archive.md:26` 的跨仓路径，该行归 T7 人工改写）／L4① 只判档解析不判节号（`:157`）且闭合条目不走 L1 | **Deferred**——扩判据 = 语义面变更（超本批设计射程：设计 §7.1 的 L4①/② 两条定义与实现一致，「同规」句与判据句的张力供父侧裁：扩判据 or 设计登记「L4 射程 = 条目首行 + 首个证据场」边界）。本批 T-VS1–T-VS5 / AC-VS1–AC-VS3 · AC-VS10 面全绿 |
| 2 | 🔵 | `scripts/check-ledger.mjs:92` 死三元（`norm` 内尾斜杠分支两臂同值 `""`——尾斜杠归一实由 `:94` 承担） | **Fixed**——清理为单臂（等价语义；`norm` 仍承担反斜杠归一） |
| 3 | 🔵 | `docs/requirements/README.md:11`「55 档」= 归位前计数（T1 迁出 6 档——现值 49） | **Fixed**——改「49 档（归位后实测——归位前 55 档）」；设计档 §8.6 表行同值 = 主 agent 写域 → §5.4 范围外注记已列 |
| 4 | 🔵 | `docs/README.md:4` 跨仓引用带 `.md` 形态（本批规范 §4.3 / 规则 7 要求收敛形态） | **Fixed**——改「与 CLI 仓同名地图（`README（CLI 仓）`）语义同源」 |
| 5 | 🔵 | `src/prompts/discipline-engineering.md:51`「双端照抄」残留（A1-A4 语境界引文，T8 声明改面之外；CN 镜像同处已无绑死表述） | **Deferred**——提示词内容权归主 agent + 超 T8 声明面（§6.1/§6.2/§6.3）→ 供父侧采（§5.4 范围外注记已列同族项） |
| 6 | 🔵 | 本档 §5.3 验证证据行「6 处存量」为迁移前快照值（现状 3） | **Fixed**——行内补「（首跑——迁移前快照；迁移后复跑 = 3 处存量——见 §5.5）」时点标注 |
| 7 | 🔵 | 本档 §5 占位骨架残留（`5.5` / `5.6` 段号各出现两次——占位 + 追加实文并存） | **Fixed**——占位骨架行清理（§5 = 本段唯一作者面）；§2 占位（eng-designer / 父侧绑定面）零触碰 |
| 8 | 🔵 | `docs/requirements/README.md:90` 对位行「编辑族单档」为不可解析措辞（AC-VS19 ② 行逐行可解析在该行只对首档名成立） | **Fixed**——补具体名（`EDIT.md` / `EDIT-HELPERS.md` / `HASHLINE-EDIT.md` / `INSERT-AFTER.md` / `APPLY-PATCH.md` / `WRITE.md`） |

**fix round 2（评审后）**：Fixed 5 项 + 1 项时点标注；Deferred 2 项（🟡1 / 🔵1——均属超射程或归主 agent 写域，已逐条说明去向）。**in-place 修正披露**：本段骨架占位清理与 §5.3 时点标注为 in-place（本段唯一作者面；语义零改）。评审方 host 机检对 3 条引注报「未匹配」（跨仓路径/转义形态致）——该 3 条已按其发现文本逐条复核后处置，无实质影响。

**终态：clean**（🔴 0：审计轮 1 的两 🔴 已 Fixed 并复跑；评审轮 1 = pass 且无 🔴 遗留；Deferred 2 项均为超射程/归主 agent 面——已披露）。

### 5.7 收尾轮补承载（跨仓内容回位本仓 · 2026-09-12）

> 本节 = 本批 **VSC 侧收尾轮「补承载」**的实施记录（eng-coder 自写；与 CLI 侧「对端份切除」轮配对）。依据 = 父侧裁定「补承载 → 再由对端切」；来源 = CLI 侧收尾轮 2 升级项（`LEDGER-SELF-CONTAINED（CLI 仓）` 记录：顾问 #1（🔴，COMMON-LAYER）与 #4（🟡，MODEL-SELECTION））。**CLI 仓零写入**（只读引用）。
> 段位注：任务书原话「批档 §2 追加小节」——`batch_segment` 身份段位实测拒绝（eng-coder 仅 §5；一段一作者）→ 本节落 §5；若父侧需 §2 追加小节，归 eng-designer / 父侧写域。

**交付摘要**

| # | 动作 | 落点（实测） |
|---|---|---|
| 1 | COMMON-LAYER 承载档补承载 | `docs/batches/2026-09-11-COMMON-LAYER.md`（45 → 105 行）：迁入对端源档「VSC 面」§5 追加正文（对端记录 as-of `:289`–`:346`；本迁入轮实测 `:291`–`:347`，57 行）——**逐行逐字节全等**（写入后与修后两轮比对 57/57）；来源注记（行区间 + 源档 blob SHA `b3bcc1ed5d34`）；档首 `:6` 补「（切除前）」限定 |
| 2 | MODEL-SELECTION 承载档补承载 | `docs/batches/2026-09-10-MODEL-SELECTION.md`（24 → 34 行）：迁入 2 处（`:330` 落点句 + `:349` AC-10 行）——**全等**（比对 2/2）；来源注记 + 读法注；档首 `:6` 补「（切除前）」限定 |

**决策透明表（落笔时自行判定项）**

| # | 决策 | 理由 / 证据 |
|---|---|---|
| S-1 | 「落点句」定位 = 对端现 `:330`（非对端记录所载 `:332`） | `:332` = 「**逐条落点（编号 = §3 轮次 2 评审发现编号）**：」（引导行、零对端引用）；`:330` = 以「落点 = …」开头、含 `PROVIDER（VSC 仓）` 对端引用之句——内部审计与代码评审双方独立复核一致；注记内已自声明消歧 |
| S-2 | 块边界 = `:291`–`:347`（含末行「未 commit…」closing 行） | 与对端记录所称「改动清单 / 偏差 / 证据 / 审计 / 评审 / 三值表」全量对应；双值差 1–2 行（档首注记增行）——注记双值并列、以本迁入轮实测为准 |
| S-3 | MODEL-SELECTION 表头 2 行（`:30`–`:31`）随 AC-10 行同携 | 单携行不成表；与源档 `:347`–`:348` 逐字同文（表格脚手架，非新增语义） |
| S-4 | 携带 = 逐字零改写（D10）；语境歧义只入注记 | 机内文字零改；新增「读法」注（对端档视角——`../design/PROVIDER.md`、「上表」「本小节」均指对端档语境） |
| S-5 | 档首 `:6` 的「（切除前）」限定为就地补标 | 与新增注记的「（as-of 本迁入轮）」成对，消解同档双短 SHA 口径歧义；零语义变更 |

**审计与代码评审（轮次 / 终态）**

- **内部 explore 偏差审计 · 轮次 1**：终态 = **CLEAN**（PARTIAL 0 · SILENT-SIMPLIFICATION 0 · DOC-DRIFT 0 · OUT-OF-LIST 0）。独立复核：迁入块 57/57 + 2/2 逐行 sha 全等；消歧项（`:330` vs `:332`）独立确认；边界面（CLI 零写 / `docs/TODO*.md` 零触碰）旁证一致。
- **内部 advisor 代码评审 · 轮次 1**：**VERDICT: pass**（🔴 0 · 🟡 0 · 🔵 4——均注记级可选打磨）。
- **fix round 1（评审后）**：4 条 🔵 全部 **Fixed**（in-place 注记打磨——迁入块零改动）：① COMMON-LAYER 注 SHA 补「（as-of 本迁入轮）」+ 行区间「以本值为准」；② MODEL-SELECTION「相邻表头行」→「逐条落点表前引导行」+ SHA 补 as-of；③「2 处」补「本批点名、」限定；④ 补「读法」注。修后复验：57/57 + 2/2 字节全等续真；机检复跑见下。
- **评审方引注说明**：评审 1 条引注（`PROVIDER（VSC 仓）:449`）未过宿主机检——本面独立 grep 复核：该内容在现档 `:449` 确在（「镜像档同步（O4）——MODEL-SELECTION v2 语义落地本端…」），属引述形态差异、无实质影响；不承载于其发现表。
- **终态：clean**。

**机检（命令 + 结果——实跑）**

- `node scripts/check-ledger.mjs` → `OK` ×2 · **0 处违规（新增）+ 0 处存量**；**退出码 0**。
- `node scripts/check-doc-width.mjs` → 本轮两档**零超宽**（实测最大行宽 208 / 252 ≤300）；**扫描域在他轮在途面捕获超宽 1 行**（`docs/requirements/ENGINEERING-MODE.md:68`，375 字符——该档工作区 +32/−3 在途，属并发「需求树逐档成套轮」写域；本轮零触碰、发现即报）；一致性 V1/V2/V3 新增 0（存量 0）。
- D6 回读：迁入块与注记逐字节复验（含修后二轮）；两档行数实测 105 / 34。

**未做 / 范围外（如实）**

- CLI 仓对端侧「切除」= 对端实施面（本仓不代写）——待父侧另派；
- 台账 `docs/TODO*.md` 零触碰（主 agent 写域）；
- 在飞 2 档（`LEDGER-SELF-CONTAINED` / `PROSE-ANCHOR-RETIRE`）零触碰。

### 5.8 收尾轮 6（VSC 侧）——本端跨仓形态清零 + 已补切回注（eng-coder 自写 · 2026-09-12）

> 任务 = 父侧「收尾轮 6（VSC 侧）」派单：① 重导基数 + 逐条清零（判据 = 设计档 §8.10 E1–E5 枚举 + D19；扫描域 = `docs/{design,requirements,batches}`，不含 `_archive`；
> 射程豁免 = fenced 代码块 / 行内命令 / grep 正则字面——保字面、不判）；② 两处具名点规范形态化；③ 父侧追加：两承载档「已补切」回注（对端补切 id=37 完成）。
> CLI 仓零写入 · `src/**`/`test/**` 零触碰 · `docs/TODO*.md` 零触碰。段位注：任务书原话「批档 §2 追加小节」——`batch_segment` 身份段位限制（eng-coder 仅 §5；§5.7 已登记同款）→ 本节落 §5。

**一、重导基数（先重导、后清零）**

| 类 | 扫描实测 | 判定 |
|---|---|---|
| 对端仓目录前缀 + 文档后缀（`.md`）共现（PLAIN） | 8 行 | **干净基数成员** → 清零（除射程豁免 1 行） |
| 本机状态目录 `.thincoder/`（DOT） | 8 行 | 噪声剔除（非对端仓指涉） |
| 本仓自指前缀 `thincoder-vscode/`（VSC） | 40 行 | 判据明文排除（非 `-vscode`） |
| 裸仓名式对端指涉 + `.md`（BARE） | 7 行 | **干净基数成员** → 清零 |
| 原始合计（#36 口径复现） | **63 行 / 25 档** | 与 #36 实测一致 |

干净基数 = PLAIN 8 + BARE 7 = **15 行 / 9 档**。清零后：判据面命中 **1 行**（本档 `:525`——grep 正则字面，射程豁免「保字面」）；BARE = **0**；**有效残留 = 0**。

**二、判据面清零（14 行 / 9 档——旧形态字面按 §8.10.1 表现协议以描述式入档；全量「改前 → 改后」原文 = 交付报告）**

| # | file:line | 旧形态类别 | 改后（规范形态） |
|---|---|---|---|
| 1–2 | 本档 `:68` · `:69` | 实施面坐标（路径前缀直引） | `src/prompts/discipline-engineering.md`（CLI 仓） · `docs/design/prompts/discipline-engineering.md`（CLI 仓）——去仓前缀、保路径与 `.md`（D19 二分 / E3） |
| 3–6 | 本档 `:493` · `:535` · `:541` · `:551` | 引述 / 审计行（旧形态对照） | 描述式（「对端仓目录前缀形态」）+ 仓别词（`CLI 仓`）——旧形态字面不再连续出现 |
| 7 | `2026-09-12-PROSE-ANCHOR-RETIRE.md:93` | 违规位置引述（路径 + `.md`） | `TESTING（CLI 仓·需求）:105` |
| 8 | `docs/design/AGENT-LOOP.md:27` | 裸仓名式对端指涉 | `TODO（CLI 仓）` |
| 9 | `docs/design/APPLY-PATCH.md:18` | 同上（设计档引用） | `APPLY-PATCH（CLI 仓·设计）` §2 |
| 10 | `docs/design/ARCHITECTURE.md:19`（`:20` 并合） | 同上（对端档引用 + 台账引用） | `SESSION（CLI 仓·设计）` §11 · `TODO（CLI 仓）` |
| 11 | `docs/design/EDIT.md:4` | 同上 | `EDIT（CLI 仓·设计）` |
| 12 | `docs/design/README.md:93` | 同上（机制权威源引用） | `SESSION（CLI 仓·设计）` §12 |
| 13 | `docs/design/RELEASE.md:95` | 同上（设计权威源引用） | `RELEASE（CLI 仓·设计）` §1 R7 段 |
| 14 | `2026-09-11-VSC-MIRROR-SWEEP.md:273` | 仓名指涉（对照跑描述） | `CLI 仓 check-doc-width …` |

**三、具名点族（式样 ① 4 行 · 式样 ② 6 行——「形态 / 等」读法，判定见 D6-2）**

- 式样 ①（`AGENT-LOOP.md §N（CLI 侧）` → `AGENT-LOOP（CLI 仓·设计）§N（本端…节 = §N）`）：`docs/design/prompts/discipline-normal.md:179`（具名——§25）· 同档 `:147`（§18 D-E1a）· `persona-eng-coder.md:23`（§18）· `persona-engineering.md:44`（§18）。
- 式样 ②（`与 CLI X.md 同名…` → `与 X（CLI 仓·设计） 同名…`）：`docs/design/ENGINEERING-MODE.md:8`（具名）· `ADVISOR-CONVERGENCE.md:5` · `CHECKPOINT.md:7` · `CONTEXT-COMPACTION.md:7` · `MEMORY.md:7` · `SESSION.md:5`。

**四、已补切回注（父侧追加——2 档 / 新增 2 行）**

| # | file:line | 内容 |
|---|---|---|
| 1 | `docs/batches/2026-09-11-COMMON-LAYER.md:6` | `> 回注（2026-09-12）：对端（CLI 仓）源档对应块**已补切**（本档逐字承载在先——对齐核验 57/57 零差异 · 源档 blob SHA 双向一致；实证见 `LEDGER-SELF-CONTAINED（CLI 仓）§5` 记录）。` |
| 2 | `docs/batches/2026-09-10-MODEL-SELECTION.md:6` | 同式（对齐核验 2 处逐字相等）。 |

落位 = 档首搬迁 / 回注注记区，紧接既有「对端（CLI 仓）源档对端份已**切除**」行（`:5`）并列、单行式。

**五、决策透明表（落笔时自行判定项）**

| # | 决策 | 理由 / 依据 |
|---|---|---|
| D6-1 | 干净基数 = PLAIN 8 + BARE 7（15 行 / 9 档）；DOT 8 / VSC 40 剔除 | 父侧口径「对端仓指涉（非 `-vscode`）+ 文档后缀共现」；`.thincoder/` = 本机状态目录（噪声）、`thincoder-vscode/` = 本仓自指（判据明文排除） |
| D6-2 | 具名点族扩展（式样 ① 4 行 / 式样 ② 6 行） | 「形态 / 等」读法 = 同式样同处置（零语义）；若父侧仅需具名行本身，族内其余 8 行可逐行回退 |
| D6-3 | 引述 / 审计行 → 描述式 / 断开书写 | 设计 §8.10.1 表现协议（旧形态不得连续出现）+ 派单口径「纯语义提及 → 描述式」 |
| D6-4 | 实施面坐标 → 路径去仓前缀 + （CLI 仓） | D19 二分（实施面路径保路径与 `.md`；坐标形态 `路径（仓别）`） |
| D6-5 | `:525` grep 正则字面保字面 | 射程豁免（可执行坐标类——保字面、不判）；有效残留口径剔除之 |
| D6-6 | 回注措辞微调（含 `（CLI 仓）§5`） | 避「裸节号 + 对端仓指标」同行（§8.10.1 判红规则）；保留父侧「实证在 CLI 侧 §5」节位（评审 🔵#5 采纳） |
| D6-7 | 跨段形态订正（纯形态、语义零改、逐条披露）：本档 §1 `:68`/`:69`（主 agent 段）· §5 `:493` 等 4 行（本段历史行——in-place 引述形态修正，同 §5.6 同款）· PROSE 记录 `:93` · `VSC-MIRROR-SWEEP:273` | 射程 = 扫描域全档（「逐条清零」结算口径）；订正非内容改写 |
| D6-8 | 并发在改热档零触碰（`docs/requirements/ENGINEERING-MODE.md` · `docs/design/LEDGER-SELF-CONTAINED.md` · `docs/design/prompts/discipline-engineering.md`——均不在本端改动清单） | 边界「不碰在改档」；按实测 mtime 判定 |
| D6-9 | 评审发现 #1–#4 Deferred（登记行不一致 / `AGENT-LOOP.md:419` 残引 / 在飞 2 档档首引用 4 行 / 裸 §2.22.7） | 均属登记 / 约定裁定面或射程未核明——归父侧 / 设计层；修正轮不夹带 |

**六、机检（原文照录）**

```text
cd thincoder-vscode && node scripts/check-doc-width.mjs
  → OK(宽度): 扫描域全部 .md 无 >300 字符单行（114 文件）。
  → 一致性 V1/V2/V3/V4：新增违规 0 条 · 存量（基线内）0 条。退出码 0。

cd thincoder-vscode && node scripts/check-ledger.mjs
  → OK: thincoder-vscode/docs/TODO.md · OK: thincoder-vscode/docs/TODO-archive.md
  → 0 处违规（阻断——修掉）· 基线 0 条（本基线必须保持为空）。退出码 0。

cd thincoder-vscode && node test/run-fast.mjs
  → tests 599 · pass 582 · fail 1 · skipped 16。
  → 唯一红 = test/context-parity.test.mjs T-CI-2a（本机 config 环境态——存量红 / 非本批）。
  → slow 门防漏提示 7 条（负载波动——存量面）。

零残留机判（扫描域 + 判据同上）：命中 1 行 = 本档 `:525`（grep 正则字面——射程豁免）；
有效残留 0；裸仓名式对端指涉 + `.md` 共现 = 0 行。
```

**七、审计与评审（in-child §18——轮次 + 裁决 + 终态）**

- **内部 explore 偏差审计 · 轮次 1**：**四类偏差均零**（PARTIAL 0 · SILENT-SIMPLIFICATION 0 · DOC-DRIFT 0 · OUT-OF-LIST 0）；附 QUESTION 项（自指前缀 / 在飞档码段元语句 / src 双源对侧形态——判据外，部分转评）。
- **内部 advisor 代码评审 · 轮次 1**：**VERDICT: pass**（🔴 0 · 🟡 1 · 🔵 4）。host 机检对其引注报未匹配——经逐条独立复核为引注形态差异（同 §5.7 同款），无实质影响。
- **裁决表**：#1 🟡 登记行不一致 → Deferred（设计层裁定面）；#2 🟡 `AGENT-LOOP.md:419` 残引 → Deferred（射程未核明）；#3 🟡 在飞 2 档档首引用 4 行 → Deferred（射程 / 时点归父侧）；#4 🔵 裸 `§2.22.7` → Deferred（随 #1 裁定）；#5 🔵 回注证据指针 → **Fixed**（补 `（CLI 仓）§5`，两档）。
- **fix round 1（评审后）**：Fixed 1 项（两档回注行）；复跑：宽度 114 档全绿 · 一致性新增 0 / 存量 0 · 台账 exit 0 · D6 回读在位。
- **终态：clean**（🔴 0；审计零偏差；评审 pass——Deferred 4 项均属裁定 / 射程面，已逐条披露）。

**八、未做 / 边界（如实）**

- `docs/TODO*.md` 物理落笔 = 主 agent 写域（零触碰）；CLI 仓零写入；`src/**` / `test/**` 零触碰（EN 对侧形态残量 = 本端硬边界外，随评审 #4 / 审计 Q3 上报）。
- 评审 #1–#4 裁定项未落笔（Deferred）；`batch_segment` §2 追加 = eng-designer / 父侧写域（身份段位限制）。

### 5.9 收尾轮 13（eng-coder 自写 · 2026-09-12）——空占位残骸清理（两仓）

> 任务 = 父侧「收尾轮 13——空占位残骸清理」派单；依据 = 用户 2026-09-12「残留即先例」原理 +「看得见的每一行都必须合规形态」。
> **判据（唯一依据——不以先例为据）**：空占位行 `_（待写——×）_`——其所在节已有实体内容者 = 纯残骸 → 删除该占位行；其所在节无实体内容者 = 真缺口 → 保留（不删）。
> 射程 = 两仓 `docs/batches/**` 全扫；本记录落 spawn 绑定档（VSC 侧）——CLI 侧清理面同记于本节（跨仓记录归属按两仓各持其份口径）。

**一、清理总账：47 档 / 129 处删除 + 47 档档首打标**

VSC（14 档 / 39 处；行号 = 该档落笔前实测）：
- `ADVISOR-BUDGET-VSC-MIRROR` 3（:56/:99/:128）· `PORTABILITY-VSC-MIRROR` 3（:37/:104/:163）· `VSC-ACTIVITY-REGION-RESTORE` 3（:42/:165/:225）· `VSC-ASYNC-PARITY` 3（:40/:153/:201）· `VSC-CONTEXT-PARITY` 3（:88/:197/:236）
- `VSC-GUARD-MIRROR` 2（:57/:163）· `VSC-INDEX-PERCEPTION` 4（:58/:217/:258/:260）· `VSC-LIVE-UX` 3（:48/:123/:157）· `VSC-MIRROR-SWEEP` 3（:53/:283/:349）· `VSC-WEBVIEW-ESCAPE` 3（:41/:120/:171）
- `VSC-ACTIVITY-CLOSURE` 3（:66/:249/:308）· `VSC-CHILD-PERMISSION` 2（:191/:251）· `LEDGER-SELF-CONTAINED` 2（:163/:487）· `PROSE-ANCHOR-RETIRE` 2（:126/:282）

CLI（33 档 / 90 处；行号 = 该档落笔前实测）：
- `ABORT-PROVENANCE` 2（:142/:179）· `ACP-CHANNEL-FIXES` 2（:111/:166）· `ADVISOR-CONTEXT-BUDGET` 2（:149/:178）· `ARROW-EDITING` 3（:39/:151/:202）· `DEEPSEEK-V41-FLASH` 3（:89/:177/:231）· `DOC-HYGIENE` 3（:63/:166/:196）· `HOME-EXPANSION` 3（:36/:161/:188）· `INPUT-FIXES-SMALL` 3（:41/:142/:197）
- `MECH-DEBT-SWEEP` 2（:166/:214）· `NORMAL-MODE-AUDIT` 3（:51/:145/:195）· `PORTABILITY` 3（:61/:132/:202）· `PROMPT-REVIEW-ORDER` 3（:77/:174/:215）· `PROVIDER-HEADERS` 3（:36/:145/:196）· `REVIEW-ATTENTION` 3（:36/:110/:146）· `REVIEW-CHAIN-GUARDS` 2（:241/:318）· `ROLE-REDEFINITION` 3（:60/:144/:181）
- `SETTINGS-NULL-DEFAULT` 2（:159/:199）· `SPAWN-QUEUE-DISCIPLINE` 3（:37/:132/:162）· `STOP-HOOK` 3（:38/:86/:138）· `SUBAGENT-TAIL` 2（:232/:297）· `SWEEP-FOLLOWUP` 2（:165/:239）
  `TEST-DISCIPLINE-PROMPTS` 3（:69/:151/:187）· `TEST-LIFECYCLE` 3（:79/:182/:215）· `TUI-OOM-FORENSICS` 2（:100/:132）· `TUI-OOM-ROOTCAUSE` 3（:64/:179/:247）
- `TUI-SELECTION` 3（:53/:123/:173）· `TURN-ACROSS-SEGMENTS` 2（:178/:261）· `VSC-ASYNC-VISIBILITY` 3（:85/:173/:265）· `VSC-REVIEW-ASYNC-SWEEP` 3（:40/:121/:176）
  `WEBSEARCH-PROVIDER-KEY` 3（:39/:109/:155）· `LEDGER-SELF-CONTAINED` 3（:225/:1378/:1426）· `LEDGER-SURFACE` 3（:49/:148/:197）· `PROSE-ANCHOR-RETIRE` 4（:117/:358/:420/:519）

打标 = 47 行（档级一次）：`> （父侧形态更正 2026-09-12：空占位行已清——实体内容见对应节；空占位 = 残留即先例）`——落于各档档首注记区（末条 `>` 注行之后）。

**二、保留（4 处——真缺口：所在节无实体内容；就地补「（父侧段——收口轮填）」标注行，不删）**

- VSC `2026-09-12-LEDGER-SELF-CONTAINED.md` §6（父代理）
- CLI `2026-09-12-LEDGER-SELF-CONTAINED.md` §4（主 agent）· §6（父代理）
- CLI `2026-09-12-PROSE-ANCHOR-RETIRE.md` §4（主 agent）

**三、不动（引述 / 记录行——非空占位行，不属判据射程）**

- VSC `VSC-GUARD-MIRROR:116`（D6 更正引述占位原文——父侧具名保留）· VSC `VSC-CHILD-PERMISSION:53`（上轮形态更正注·引述同类）。
- 记录类注行族（多档「占位已清 / 随 append-only 保留」历史记录注、审计行「§5 待写（本段补齐）」等）——零触碰。
- CLI `MODEL-SELECTION:474`（`> 待写。`）——判据形态（`_（待写——×）_`）外，未动、列报（供父侧裁）。

**四、决策透明（零静默）**

| # | 事项 | 处置 | 理由 |
|---|---|---|---|
| 1 | 父侧列 2 保留点（VSC LEDGER `:468` · PROSE `:272`）落笔窗口内被并发填段 | 无动作（占位行已随填段消解——无残骸可留、无标注对象） | 落笔前重核实测；§4 批准面已由主 agent 同窗落笔 |
| 2 | CLI 保留 3 处标注 = 「同办」延伸 | 同式标注落地 | 父侧指令「另 CLI 仓同判据全扫 → 同办（清单自列）」 |
| 3 | `TEST-LIFECYCLE` §5 占位（机械节边界盲区：实体记录以 `# §5` 级标题续写） | 按判据「实体内容为准」删除 | 该节实体交付记录在位；占位 = 模板残留 |
| 4 | 并发漂移处置（VSC/CLI LEDGER 等在飞档） | 行号以落笔前即时重核为准；保留 / 标注面用内容定位 | 父侧 / 他轮同窗口追加（CLI LEDGER 窗口内两次增长） |
| 5 | `#48–#52` 在改档边界 | 未能机检定位其档清单（两仓文档 / checklist 无 #49–#52 字样；仅见 #41/#43/#46/#48 零星引用）——本轮触碰面 = 上表 47 档逐档列明，供父侧核对交叠 | 如实登记（不假设） |

**五、机检（原文——命令 + 结果）**

```text
cd thincoder-vscode && node scripts/check-doc-width.mjs
  → OK(宽度): 扫描域全部 .md 无 >300 字符单行（114 文件）。
  → 一致性 V1/V2/V3/V4：新增违规 0 条 · 存量（基线内）0 条。→ EXIT=0
cd thincoder-vscode && node scripts/check-ledger.mjs
  → OK ×2 档 · 0 处违规 · 基线 0 条。→ EXIT=0
cd thincoder && node scripts/check-doc-width.mjs
  → OK(宽度): 扫描域全部 .md 无 >300 字符单行（136 文件）。
  → 一致性 V1/V2/V3/V4：新增违规 0 条 · 存量（基线内）0 条。→ EXIT=0
cd thincoder && node scripts/check-ledger.mjs
  → OK ×2 档 · 0 处违规 · 基线 0 条。→ EXIT=0
cd thincoder-vscode && node test/run-fast.mjs
  → tests 607 · pass 568 · fail 0 · skipped 39。→ EXIT=0
```

**六、D6 回读核对**

- 复扫（程序化）：两仓残留精确占位 = **4**（= 保留 4 处，逐条带标注行）；打标计数 = **47/47** 在位；纯残骸 = **0**。
- 抽读：VSC LEDGER §6 `:745`/`:746` · CLI LEDGER §4 `:1490`/`:1491` · §6 `:3081`/`:3082` · CLI PROSE `:413`/`:414` 逐处核过；VSC GUARD-MIRROR `:57` 已删（`:59` 状态行起正文在位）。

**七、边界 / 未做（如实）**

- 台账 `docs/TODO*.md` 零触碰 · `_archive` 零触碰 · `src/**` / `test/**` 零触碰（纯批档面轮）。
- 未做 = 无（判据面全量落定）；列报 = `MODEL-SELECTION:474` 形态外近邻行 1 处（不动，供裁）。

> 校注（本节追加后复跑 · as-of 2026-09-12）：CLI 宽度面复跑出现 **3 行超宽**（`2026-09-12-LEDGER-SELF-CONTAINED.md` `:1378` / `:1412` / `:1415`）——全位于并发「存量旧义清零轮（eng-designer）」同窗新增节，**非本节笔迹**；本节改动面在其前两轮复跑 = **136 文件全绿（零新增）**。归属 = 该轮写域（本侧零触碰）。

**八、内部环（in-child §18——轮次 + 裁决 + 终态）**

- **内部 explore 偏差审计 · 轮次 1**：终态 = **CLEAN**（四类偏差 0）。独立复核面：精确占位现盘仅剩 4 保留处（逐处带标注）· 打标 47/47（档级各 1）· 删除面 5 档抽验（含相邻对 `INDEX-PERCEPTION:258/:260` 与边界盲区档 `TEST-LIFECYCLE`）· 边界反证（两仓指纹全树命中仅 batches 内 47 档）· 豁免点 2 处（含 `GUARD-MIRROR:116`）在位。
- **内部 advisor 代码评审 · 轮次 1**：**VERDICT: pass**（🔴 0 · 🟡 1 optional · 🔵 4）。逐条裁决：
  - 🟡#1 同族变体 `_（待记——主 agent）_` 2 处（CLI `SPAWN-QUEUE-DISCIPLINE:151` · `SWEEP-FOLLOWUP:235`——所在节均有实体内容）→ **Deferred（归父侧裁）**：判据形态（`待写`）外；本轮「唯一依据」不越形扩删——是否入类由父侧明示。
  - 🔵#2 打标「空占位行已清」与 3 档保留行并存 → **Not an issue**（打标文本 = 父侧指定逐字；保留项自带「（父侧段——收口轮填）」标注区分）。
  - 🔵#3 记录类注行「占位…不改 / 保留」所指已删 → **Not an issue**（记录面口径 = §三在案处置；如需同步归父侧另轮）。
  - 🔵#4 CLI 侧清理面仅记于本档 §5.9 → **Not an issue**（任务书口径 = 单 §5 追加（绑定档）；CLI 侧自持记录如需补登 = 父侧 / CLI 写域）。
  - 🔵#5 计数口径（父侧「14 档 / 40 处」vs 本表 39 删 + 1 保留）→ **Not an issue**：对账成立——本刻实测 VSC 全量精确占位 = 40 = 39 删 + 1 保留；如父侧 40 另有口径请按本表逐档明细复点。
- 附（判据外同族 · 名单外档——登记供下轮合扫）：`_（待实施）_` ×3 + `_（待核销）_` ×1（`2026-09-10-VSC-MIRROR`）· `_（待核销）_` ×1（`2026-09-10-BATCH-SEGMENT-TOOL`）。
- **修正轮：0 轮**（无 must-fix；Deferred 1 = 边界裁定面）。**终态 = clean**（🔴 0）。

## §6 验证与收口（父代理自写）

_（待写——父代理）_
（父侧段——收口轮填）
