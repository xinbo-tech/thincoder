# 文档体系各仓自持（LEDGER-SELF-CONTAINED）· 批次记录 · **VSC 仓侧**（2026-09-12）

> 六段 append-only，一段一作者。编制：主 agent · 2026-09-12 04:26 · 来源 = 用户 2026-09-12 04:16–04:26 裁定（各仓自持）+ 04:26 明确指示「这个事情的批次档也应该是 cli/vscode 各一份的」。

> **本档性质**：本批的 **VSC 仓侧记录**——同批 CLI 仓侧记录住 CLI 仓 `docs/batches/2026-09-12-LEDGER-SELF-CONTAINED.md`。两侧**各持自身范围**；两档之间的互引形态由本批设计裁定（不得产生悬空引用）。

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
| 台账条目指针 | **2/2 条指向 CLI 仓**（`需求 CLI 仓 docs/requirements/AGENT-LOOP.md` · `任务书 CLI 仓 docs/batches/…`） |
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
| `thincoder/src/prompts/discipline-engineering.md`（CLI） | :91 | :91–98 |
| `thincoder/docs/design/prompts/discipline-engineering.md`（CLI） | :66 | :66–73 |

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
| **端差显式** | 允许的端差**是否逐条登记**（本仓 `docs/design/README.md` 「镜像差异表」先例 · `AGENT-LOOP.md:607` N-CL4「端差逐条登记不静默」）——**静默的端差 = 漂移，不得放过** |

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

_（待写——eng-designer）_

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

## §3 设计评审（评审子代理写）

_（待写——评审子代理）_

---

## §4 用户批准（主 agent 记）

_（待写——主 agent）_

---

## §5 实施记录（eng-coder 自写）

_（待写——eng-coder）_

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
| T11 反向写痕 | ✅ | `docs/design/` **52 行 / 16 档**改指规范形态（`thincoder/…` → `名称（CLI 仓）§N` / 迁移档 `名称（本仓）§N`；源码路径 → `` `src/…`（CLI 仓） ``）——残留 `thincoder/`（非 `.thincoder/`）**0 命中**；源码 2 处：`src/log.mjs:2` → `docs/requirements/LOGGING.md` · `src/compact.mjs:5` → `docs/design/CONTEXT-COMPACTION.md` |
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
   - `docs/TODO-archive.md:26` 内嵌行「批档均在 `thincoder/docs/batches/2026-09-11-*`」→ 改写指本仓 `docs/batches/`；
   - **另注（非 §8.2 条目——发现即报）**：`docs/TODO.md:1` 首字符为杂散 `ga`（实际文本 `ga# TODO — thincoder-vscode 项目级待办`）——疑编辑事故残留，随 T7 一并核正；`docs/TODO.md:13` 的「`docs/design/` 54 档」为陈旧计数（as-built 顶层 `.md` = 55）。
2. **批外红 2 条（均非本批引入——批前同集合）**：
   - `test/context-parity.test.mjs` T-CI-2a——本机 `~/.thincoder/config.json` `agent.engineering=true` 环境态（期望 normal 基座、实装 engineering 基座）；先例登记 = `LEDGER-SURFACE` 批记录 §5（「非本批」）。
   - `test/doc-consistency.test.mjs`「仓库扫描」——2 条 V3 瞬态 = 本档 §3 与 `2026-09-12-PROSE-ANCHOR-RETIRE.md` §3 未获工具写入轮次行（成因 = §4/§6 骨架 `---` 行被 V3 判为实文）。**归属 = 评审写入时序 + 骨架占位标点**（设计 §11 归属注同款）；消解 = 对应 §3 获工具写入轮次行（§4/§6 骨架段归主 agent / 父代理写域，本 coder 不代笔）。
3. **未验证项**：`docs/design/TESTING.md` §8.2 端差行（「本端 `scripts/` 无 `check-ledger.mjs`」）——本批落地后该端差**已消解**，但该档更新触发归属 = 其写域（设计 §12 注 1：本批不改、发现即报）。
4. **范围外注记（发现即报，未动作）**：仓根 `AGENTS.md` / `README.md` 内 `thincoder/docs/...` 路径形态未改（T11 射程 = `docs/design/` 35 档 + 源码 2 处）；`test/slow-gate.test.mjs` 缺失（`run-fast.mjs:8` / `slow-gate.mjs:10` 引用悬空——设计 §12 注 2 既存项）。
5. **未做（明列）**：平台侧处置（组织层面）；在飞 2 档搬迁（触发 = 该批收口——设计 §8.5 期 2）；`docs/TODO*.md` 物理落笔（主 agent）。

### 5.5 审计与代码评审（轮次 / 终态）

**内部 explore 偏差审计 · 轮次 1**（AGENT-LOOP §18 D-E2③——只读子代理）：终态 = **DIVERGENT**（🔴2 · 🟡2 · 🔵2）。

| # | 级 | 发现 | 处置 |
|---|---|---|---|
| 1 | 🔴 | `src/log.mjs:2` 指针**未改**（`docs/design/LOGGING.md` 残留——该档本仓不存在）+ §5.1 声称已改（报告与磁盘不符） | **Fixed**（本轮）——改指 `docs/requirements/LOGGING.md`；§5.6 登记「报告失实」自纠 |
| 2 | 🔴 | `src/compact.mjs:5` 跨仓前缀 `thincoder/` **未改**（本端对位档在位却未被指） | **Fixed**（本轮）——改指 `docs/design/CONTEXT-COMPACTION.md`（去前缀） |
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

## §6 验证与收口（父代理自写）

_（待写——父代理）_
