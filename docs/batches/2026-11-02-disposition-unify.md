# 2026-11-02 · disposition-unify
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-11-02 · 来源 = 用户 2026-11-02 03:58「**统一一下，明确当场修。**」—— 三处并列的处置规则互相抵消，导致「越修越多的池子」。
> 台账 = #1986（ENGINEERING-MODE · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-11-02
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

## 1. 讨论（主 agent）

- **已定决定**：把三处并列而互相抵消的「处置规则」统一成一条，并**把「当场修」写明确**。 · 用户原话：「**统一一下，明确当场修。**」 · 时间：2026-11-02 03:58

### 病灶（三处逐字，父侧本会话实读）

| 位置 | 原文要点 |
|---|---|
| `thincoder-core/prompts/persona-engineering.md` 第 194 行 | 「**Fix in place first**: one-off small-form items (wording / coordinates / indexes / cleanup) from reviews or sweeps get fixed on the spot」 |
| `thincoder-core/prompts/persona-engineering.md` 第 190 行 | 「**Debts must be visible**: surface every debt on the todo list, never leave it in prose.」 |
| `thincoder-core/prompts/discipline-engineering.md` 第 144 行 | 「**Out-of-scope items are not recorded** …… ⇒ not written into the report, **not booked to the ledger, not reported upward, not acted on**.」 |

**⇒ 三条并列，没有一句说谁让谁。**

### 后果（本会话实测）

一条**写域外**的坐标过期（`#1979`）同时命中三条：按 194 该当场修，按 144 该不记不动，按 190 该上账。

**⇒ 三条都没做成：没修（不在写域）、没丢（它是真的）、记了账（违反 144 的唯一被明文禁止项）。**

**⇒ 池子从 51 涨到 52 —— 关掉八本批档，净增一条。**

### 同族两笔（不是债，是被塞错桶的问题）

| 行 | 为什么不是债 |
|---|---|
| `#1978` | 原文「是否要统一语义未定」—— **要用户拍板，不是要人开工** |
| `#1980` | 原文「要判作者须给工具写过的行加标记，属新语义」—— **同上** |

### 统一后的判据（父侧起草，交设计席定形）

- **一条核实过的问题，只有三个去处，按写域优先分**：
  - **写域内 ∧ 小样**（措辞 / 坐标 / 索引 / 清理）⇒ **当场修** —— 记了账的小修等一个可能永远不来的批次。
  - **写域内 ∧ 大件**（要单独一轮 / 有前置条件 / 要设计）⇒ 进池，且必须带确定批次。
  - **写域外** ⇒ **不修、不记、不报** —— 等那一批碰它时按「触达即全清」办。
- **要用户拍板的不进池**：当场问。**池子收「活儿」，不收「问题」**。
- **优先级一句**：**写域边界优先于「当场修」与「债必须可见」** —— 边界是契约，那两条是习惯。

### 边界

- **只改这几句**：`thincoder-core/prompts/persona-engineering.md` 的 190 / 194 / 195 三行合一条 ∥ `thincoder-core/prompts/discipline-engineering.md` 第 144 行补一句射程回指。
- **不建新机制、不加新工具、不加校验闸** —— 本次只把三句说成一句。
- **`thincoder-core/prompts/persona-eng-designer.md` 第 36 行同句**：是否同步，交设计席判（它是子代理面，射程可能不同）。

### 1.4 父侧裁三条上抛（2026-11-02 04:03）

**① 需求档载不载 —— 本轮不载。**

- **理由**：这两条都是「提示词该怎么写」的落笔纪律，不是产品能力。需求档记「要什么」，这里没有新增「要什么」。
- **它们的家**：设计档 `docs/core/design/PROMPT-SYSTEM.md` 的两处（设计席已落）。
- **何时再议**：第一次因为这两条判据改判（即出现「按它办会出错」的实例）时，再把它们升进需求档。

**② `#1978` ∥ `#1980` —— 建议撤回，两笔都不是「活儿」。**

| 行 | 我的判 | 理由 |
|---|---|---|
| `#1978` | **撤回** | 两个函数不同义是**能力差异**，不是缺陷；合并会抹掉尾切片那条强化。文档在上一批已按「两条陈述」改正，债已经不存在 |
| `#1980` | **撤回** | 至今零实例误判；两个活实例都无害。要判作者须给工具写过的行加标记 = 新语义，收益（防一个没发生过的误读）低于代价 |

**⇒ 撤回不是丢弃：理由与现场都在这两行的 evidence 里，谁要捡起来随时能捡。**

**③ 英文终稿由 eng-coder 按中文逐字落笔 —— 知会，照办。**

### 一处设计席自己改了我措辞的地方（我认）

它把「写域」定义成**本轮任务书声明的文件面**，而不是「归我路由的一切」。

**⇒ 它的理由对**：取后者，他仓 / 他席的措辞级小修全落进「进池」，池子照旧上涨 —— 病原地复活。

**⇒ 前者与 `thincoder-core/prompts/discipline-engineering.md` 的「scope = the task book」同一坐标，三条规则才可能由一条取代。**

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（修正轮 2：父侧四件全部落设计面（两处锚修复 · 过期读数改关系句 · 落点 3/4 终稿+A7/A8），门 PASS）

### 1. 本批条目（覆盖）

| # | 条目 | 判据 / 终稿落点 | 台账 |
|---|---|---|---|
| 1 | 处置规则统一（三处并列而相抵 ⇒ 一条判据 · 三个去处 · 写域先判 · 拍板门先于写域） | `docs/core/design/PROMPT-SYSTEM.md` §6.8 | `#1986` |
| 2 | 档引形态写进提示词（引任何 `.md` 一律仓根完整路径） | `docs/core/design/PROMPT-SYSTEM.md` §6.68 | `#1986` |

**两条的共性（一句）**：**规则必须落在干活的人会看的那一层——设计档约束评审，提示词约束落笔。**

**修正轮覆盖（评审编号 → 落点）**

| 编号 | 落点 |
|---|---|
| 🔴1 🔴2 🔴3 🟡6 🟡7 🟡8 🟡9 🟡10 🟡11 | `docs/core/design/PROMPT-SYSTEM.md` §6.8（重写：判据含拍板门 · 两处落点逐字终稿 + 参考译 · A1–A6 · 用例表 · 决策表 · 三段 · 集成与 RTM · 何时重开） |
| 🔴4 | §6.8「写域两类席各取各的」段 + K2 |
| 🟡5 | §6.8 K4：`thincoder-core/prompts/discipline-engineering.md` 零改 |
| 🔵12 🔵13 🔵14 | §6.68（RTM 读数行 · A2 量法写死 · 参考译保留「整段」） |
| 🔵15 | 无需动作（评审席独立复核了档位结论） |

### 2. 本批不做

- 不动需求层（`docs/core/requirements/` 下任何档）——主 agent 笔域；「何时重开」只落 §6.8 一行（父侧裁定）。
- 不改台账机制本体（写命令 / 六态迁移 / 门）。
- 不新增机检门、不设豁免；不动 `thincoder-core/doc-check/` 的门判据。
- 不加第三个桶、不建体系；不新增节（两笔都落在既有节内）。
- 不动 `docs/core/design/DOC-DISCIPLINE.md` §1 D4 与 `docs/core/design/LEDGER.md` §3 的判据本体。
- 不动 `thincoder-core/prompts/` 本体——英文终稿由 eng-coder 按 §6.8 / §6.68 的中文终稿逐字译落笔。
- **零改 `thincoder-core/prompts/discipline-engineering.md`**（§6.8 K4：`not acted on` 已覆盖「动手」）。

### 3. 受影响文件（含档位结论）

| 文件 | 面 | 改什么 | 谁落 |
|---|---|---|---|
| `thincoder-core/prompts/persona-engineering.md` | 提示词（产品代码面） | `### Debts, ledger upkeep, and the closeout sweep` 节内三条换一条（英文终稿 5 行：规则 + 四个续行；§6.8 落点 1） | eng-coder |
| `thincoder-core/prompts/persona-engineering.md` | 提示词 | `## Batch-record lifecycle` 节末加一条，标题 `(five rules)` ⇒ `(six rules)`（§6.68） | eng-coder |
| `thincoder-core/prompts/persona-eng-designer.md` | 提示词 | `Consistency surface` 条加写域限定（§6.8 落点 2） | eng-coder |
| `docs/core/design/PROMPT-SYSTEM.md` | 设计档（本席笔域） | §6.8 重写 · §6.68 收正三处 | 已落 |
| `docs/batches/2026-11-02-disposition-unify.md` | 批档 | 本段 §2（本席笔域） | 已落 |

**档位结论**：表内全为 `.md` 档，无文件跨档位。

`thincoder-core/prompts/persona-engineering.md` 一笔两处改（处置条 + 批档生命周期节），由单席一次落笔，无文件重叠冲突。

### 4. 验收对照（回条目）

| # | 条目 | 验收（机检） |
|---|---|---|
| 1 | 处置统一 | `docs/core/design/PROMPT-SYSTEM.md` §6.8 A1–A6（A1 三条旧规则各 0 命中 · A2 新规则 1 命中且节对 · A3 写域限定 1 命中且条对 · A4 纪律档零改 · A5 行宽与结构 · A6 交付门） |
| 2 | 档引形态 | `docs/core/design/PROMPT-SYSTEM.md` §6.68 A1–A5（A1 逐字 1 命中且节对 · A2 `^\d+\.` 行数 6 且标题 `(six rules)` · A3 行宽 · A4 无档引用 · A5 交付门） |

**改动面无单测档**（纯文本改动、无运行期行为）：验收 = 实施席实跑的三条读数——① 三档逐行 `[...line].length > 300` ⇒ 0；② §6.8 A2 ∥ A3 与 §6.68 A1 的命中数各如该节所写；③ `node scripts/prompt-refs-check.mjs` 命中集合无新增（集合判，不按数字判）。

集成面：`docs/core/design/PROMPT-SYSTEM.md` §6.8 ∥ §6.68 各一段判 `none` —— 破行 0 / 冗余 0 / 新增 0（两笔都不改业务可观察结果）。

### 5. 关键决策（摘要 · 细节见 `docs/core/design/PROMPT-SYSTEM.md` §6.8 决策表）

- **K1 三条换一条，不加第四条**：用户裁定是「统一」不是「加一条」。
- **K2 写域 = 这一笔的落笔面**：实施席取任务书 `files`，主 agent 取本席笔域档；取 `files` 字段则主 agent 写域为空集，取「归本席路由的一切」则病原地复活。
- **K3 `Debts must be visible` 不留成并列条**：两半各有去向（上账 → 第二去处；`never leave it in prose` → 第二去处的措辞）。
- **K4 纪律档零改**：`not acted on` 已覆盖「动手」，「也不当场修」是同一禁令的第二份写法。
- **K5 设计席面加写域限定、不搬三去处**：同族病在该面成立，收窄一处即闭合。
- **K6 池面 triage 原位保留**：「清旧条目」与「新问题往哪去」是两根轴。
- **K7 拍板门先于三去处**：处置权不在本席时，写域判据没有可判的对象。
- **K8（条目 2）落人格档批档生命周期节而不是纪律档**：这是「怎么落笔」，纪律档管「怎么判」。

### 6. 上抛项

1. 〔待裁 · 父侧〕§6.8 K4 —— `thincoder-core/prompts/discipline-engineering.md` 零改，取评审 🟡5 的路 ①（撤掉「也不当场修」半句）；父侧若要路 ②（保留但换理由），本席按新理由改写该落点并同步 §6.8。
2. 〔待裁 · 需求面〕「何时重开」已落 §6.8 一行，未上需求档（父侧 §1.4 ① 裁定）；需求层是否另有承载由父侧定。
3. 〔知会 · 英文终稿〕英文以 §6.8 / §6.68 参考译为起点，实施席须按中文终稿逐字核；语义不得偏离中文终稿。
4. 〔知会 · 台账同族两笔〕`#1978` ∥ `#1980` —— 父侧已裁撤回（本档 §1.4 ②）；它们与新判据同类：要拍板的「问题」，不进池。

### 修正轮 2（2026-11-02 · 父侧四件 · 实施轮自报）

**落点**：`docs/core/design/PROMPT-SYSTEM.md` §6.8 ∥ §6.20 ∥ §6.23 ∥ §6.68。交付门 `DOC-CHECK GATE: PASS`。

**① §6.20 落点锚悬空** —— 「落点」行原用 `Fix in place first` 条后定位，该条本批已删。改为内容锚：`Disposition routing (one criterion, three destinations, write domain first)` 条及其 `**Why**` 续行之后的新 bullet；不引已删句、不留行号。

**② §6.23 落点锚悬空** —— 同形同改（同一节、同一定位来源）。改写后该段一度 304 字符越过段落判据，已删去与前句重复的节名，现 ≤300（门 PASS）。

**③ §6.68 过期读数** —— 「落点」段改写成不随时点过期的形：「改前 `(five rules)` ⇒ 落笔后 `(six rules)`」，并写死此后只看关系（标题数目字 = 该节内以 `^\d+\.` 起首的行数，A2），不再写当前读数。同笔把该节勘察证据行的「节标题逐字」标注为落笔前态，不再是自称现状的过期读数。

**④ 落点 3（设计席面第二处无条件「当场修」）** —— `thincoder-core/prompts/persona-eng-designer.md` 的 `Revision-style-expression check` 条加写域限定，复用 `Consistency surface` 条那半句的形。

**⑤ 落点 4（台账生命周期第 4 条与新判据相交）** —— `thincoder-core/prompts/persona-engineering.md` 的 `## Ledger (requirement pool / tech todos) — batching & lifecycle` 节内第 4 条收窄为「新债 = 要自己一轮 / 有前置条件 / 要设计」，并加一句回指处置分派；不复制判据。

**逐字终稿 + 参考译**：均住 `docs/core/design/PROMPT-SYSTEM.md` §6.8（中文 = 规范面，英文 = 参考译），验收 = 该节 A7 ∥ A8。落点表已加两行（3 ∥ 4），给出档、逐字定位、动作。

**同笔更正两处（四件之外，但不改则本节自我矛盾）**

- K5 原写「收窄一处即闭合」；实施轮复核已证该面有两处无条件「当场修」⇒ K5 改为「两处各加同一条限定才闭合」。
- A3 原判 `inside your write domain` ⇒ 1；落点 3 落笔后应为 2 ⇒ A3 改写为 2 并点名两条。

**行宽读数（本席本轮 `node` 实录，判据 300）**：落点 3 中文 48 ∥ 英文 180；落点 4 中文 75 ∥ 47、英文 194 ∥ 204 —— 全 ≤300，英文最宽 204，余量 96。

**集成测试设计**：`none` —— 两笔都不改业务可观察结果、不新增业务场景，与 §6.8 ∥ §6.68 已判的 `none` 同判；`test/RTM.md` delta = 破行 0 / 冗余 0 / 新增 0。

**交付门**：`doc_check(mode:"gate", docs:["docs/core/design/PROMPT-SYSTEM.md"])` ⇒ 首行 `DOC-CHECK GATE: PASS`（0 段命中）；本段自身亦过门。

**待裁（父侧）**

1. 评审 §3 轮 2 的 N3 仍未落：参考译比中文终稿少两处例子，第二条路「明写例子只住规范面」应落 §6.8 一行，但不在这四件里，本轮未动手。要落则一句：「参考译只译判据句，例子只住规范面」。
2. 落点 3 ∥ 落点 4 是设计面终稿，真闭合要等 eng-coder 按参考译落 EN 并跑 A7 ∥ A8；本席未触 `thincoder-core/prompts/`。
3. 实施轮 §5 §8 的 🟡1 ∥ 🟡2 由本轮的落点 3 ∥ 落点 4 承接，落笔后即可销。

## §3 设计评审（评审子代理）
**状态行**：评审通过（第 2 轮：只核上轮十五条，逐条已闭（未闭 0）· 新增 🔴 0 / 🟡 1 可选 / 🔵 2 · VERDICT: pass）



### 轮次 1（评审子代理）

**评审对象**：处置分派三处合并 + 档引形态写进提示词（两条）· 状态 = 待评审 · 评审面 = `docs/batches/2026-11-02-disposition-unify.md`（全文） + `docs/core/design/PROMPT-SYSTEM.md`（§6.8 ∥ §6.68 及全档交叉核）· 判据来源 = 本记录声明的 review criteria

| # | 类别 | 严重度 | 问题 | 建议 |
|---|---|---|---|---|
| 1 | 覆盖率 / 可实施性 | 🔴 | §6.8 只有判据句 + 两条附属判断：无逐字终稿、无参考译、未点名三档提示词要换哪几行；而批档 §2 写「`docs/core/design/PROMPT-SYSTEM.md` §6.8（含三处逐字终稿 + 参考译）」。实读全档「参考译」「逐字终稿」只出现于 §6.68 ⇒ 条目 1 无文可落 | 按 §6.68 同构补齐 §6.8：逐字定位 + 中文终稿 + 英文参考译围栏块；或改批档 §2 的实情并给出真正承载面 |
| 2 | 验收 | 🔴 | 批档 §2 把条目 1 判成「§6.8 A1–A6」（并引 `and not fixed either` 等串），§6.8 无验收表、全档 A1–A6 段均属他节 ⇒ 引用空号，条目 1 无可执行验收 | 在 §6.8 写 A1–A6 表（各给判法与读数）；英文串先在围栏块定形再被引用 |
| 3 | 集成测试设计 | 🔴 | §6.8 整节无集成测试设计段、无 `test/RTM.md` delta；同批 §6.68 有该段（判 `none`）⇒ 条目 1 设计不完整（RTM 结论只见于批档 §2 一行「集成面：…破行 0 / 冗余 0 / 新增 0」） | 补该段：先读 `test/RTM.md` → 点名近面故事与行 → 按「不改业务可观察结果、不新增业务场景」写 `none`，或给缺行编号 |
| 4 | 写域定义（同一机制两处相抵） | 🔴 | §6.8「写域 = 本轮任务书声明的文件面（与 … `files` 声明的「写域」同名同物）」与原句「**The files declaration lists only the implementer's write domain** (source, test, design-doc files) — project process files (requirement pool / changelog / task-list family) stay out of it.」相抵：批档 / 台账 / 需求池全落写域外，而它们正是主 agent 笔域（本批 §2 自写「主 agent 笔域」）；且 depth-0 主 agent 无「本轮任务书」，写域在它身上无值可取 | 改成两类席都成立的一句（实施席 = 任务书 `files`；主 agent = 本席笔域档），给一个主 agent 落例，并写清与 `files` 条的关系是「同坐标」还是「同字段」 |
| 5 | 判据依据（题 B） | 🟡 | 「144 只禁记、没禁修」与原句相抵：该条列四项禁令，`not acted on` 覆盖「动手」；`#1979` 实录「没修」= 合于 144 ⇒ 「也不当场修」是同一禁令的第二份写法，不是补溃口 | ① 撤掉这半句（写域限定落在「Fix in place first」一侧即闭合）；或 ② 保留但换理由（同族面复述，只读纪律档的人也看得到）并在 §6.8 记下该理由 |
| 6 | 覆盖 / 优先级（题 A） | 🟡 | 判据自称「只有三个去处」，附属判断①「要用户拍板的不进池——当场问」是第四条路且与三去处无先后：写域内∧小样∧要拍板（修还是问）、写域外∧要拍板（不报还是问）均无答案；附属②只排了「写域边界优先于『当场修』与『债必须可见』」 | 把「当场问」并进同一条判据并给一条优先级（建议先于三去处：它是停止处置），或升为第四去处并改掉「三个去处」的措辞 |
| 7 | 依据出处 | 🟡 | 写域外那支的回收路径挂在「等那一批碰它时按「触达即全清」办」，而「触达即全清」在 `docs/core/design/` 与需求档零命中，只见于本节与批档（`docs/batches/2026-11-02-bare-name-pointer-unify.md`）⇒ 一支去处只有记录面依据 | 就地写一句它是什么，或写出它的规范面档与节；否则该支在规范面无法被核、也不敢被删 |
| 8 | 条目覆盖 | 🟡 | 被整条撤掉的「Debts must be visible」有两半语义：上账（= 第二去处）与「never leave it in prose」；批档 K3 只交代前一半 ⇒ 后一半无承接，§6.8 未说撤去哪 | 写一句哪半被判据吸收、哪半连理由一起撤；或把「不留散文」并进「进池」那支的措辞 |
| 9 | 分支场景（判据 6b） | 🟡 | 三支里「写域外」有实例（`#1979`）、「要拍板」有两笔（`#1978` / `#1980`）；「写域内∧小样 ⇒ 当场修」与「写域内∧大件 ⇒ 当轮进池并带确定批次」零实例，尤其新增的「带确定批次」没有一条「进池未带批次」的实录或复现路径 | 每支补一条实例；或明写该支为既有条原样保留并给出旧条原文（场景沿用旧条） |
| 10 | 先例 ∥ 勘察 ∥ 既有件（判据 9/10/11） | 🟡 | §6.8 缺「先例 ∥ 偏离」「勘察证据行」「既有件三问」三段（§6.68 三段齐）⇒ 同批两节标准不一，条目 1 的「零新名 / 复用旧句」无任何读数支撑 | 按 §6.68 三段形补齐；无相关公共源也照写「已查，无相关」 |
| 11 | 需求面裁定（§1.4 ①） | 🟡 | 「不是产品能力」可辩，但条目 1 改了用户可观察结果：写域外的发现从此不修不记不报（此前至少以台账行出现，现在无任何出口）；「何时再议」只写在批档（记录面，收口即封），规范面零承载 ⇒ 判错时只靠有人翻旧批档或用户撞第二次 | 裁定保留，但写成一句落规范面（需求档一句，或 §6.8 一行「何时重开」），记录面只留指针；把「改了用户能看到什么」写明作为复盘入口 |
| 12 | 集成测试（条目 2） | 🔵 | §6.68 用了允许的那一条理由，但没点名 RTM 近面故事、无 `test/RTM.md` 读数（同档 §6.66 有 RTM 读数段与「近面无涉——故事 7 ∥ 故事 21」形） | 补一行 RTM 近面读数与「不涉」理由，形照 §6.66 |
| 13 | 验收量法 | 🔵 | §6.68 A2 判「该节 bullet 条数 = 6」，而该节是 `1.`–`5.` 编号条（§6.68 勘察行自写「其下五条以 `1.`–`5.` 起」，提示词面现读 `## Batch-record lifecycle (five rules)`）⇒ bullet 与编号两种量法得两个读数 | A2 写死量法（如「以 `^\d+\.` 起首的行数 = 6」），与标题判各自独立 |
| 14 | 参考译（题 D） | 🔵 | 只能核条目 2（条目 1 的参考译不存在，见 #1）：一条规则 + 一句 why + 一句后果，一支不多不少，无增限定词；唯一微差 = 中文「整段零字节落盘」的「整段」译作 `nothing lands at all` 后丢失 | 落笔时保留「整段」分量（如 `the whole segment lands as zero bytes`），或明写 `nothing lands at all` 即此义；不必扩意 |
| 15 | 档位抽查（判据 8） | 🔵 | 本席独立量：受影响文件表全是 `.md`（四笔提示词 + 设计档 + 批档；`scripts/prompt-refs-check.mjs` 只执行不改），按 AGENTS.md「**Documents (`.md`) are under no size obligation**」免档位判定 ⇒ §2「档位结论：无文件跨档位。」成立 | 无需动作（登记本席的独立复核） |

**证据（逐字，全部本席实读）**

- `thincoder-core/prompts/persona-engineering.md` — "**Fix in place first**: one-off small-form items (wording / coordinates / indexes / cleanup) from reviews or sweeps get fixed on the spot — a booked small fix waits for a round that may never come."
- 同一档 — "**Debts must be visible**: surface every debt on the todo list, never leave it in prose." ∥ "**Only real debts enter the pool**: needs its own round / conditional / needs design." ∥ "## Batch-record lifecycle (five rules)"
- 同一档（`files` 条）— "**The files declaration lists only the implementer's write domain** (source, test, design-doc files) — project process files (requirement pool / changelog / task-list family) stay out of it."
- `thincoder-core/prompts/discipline-engineering.md` — "**Out-of-scope items are not recorded**: anything seen outside that scope (other modules, other batches / layers / docs outside this repo, inconsistencies noticed in passing) ⇒ not written into the report, not booked to the ledger, not reported upward, not acted on."
- `docs/core/design/PROMPT-SYSTEM.md` §6.8 — "一条核实过的问题只有三个去处，写域先判。" ∥ "**两条附属判断**：① **要用户拍板的不进池**——当场问；池子收「活儿」，不收「问题」。" ∥ "写域外 ⇒ 不修、不记、不报——等那一批碰它时按「触达即全清」办。" ∥ "写域 = 本轮任务书声明的文件面（与 `thincoder-core/prompts/persona-engineering.md` 派单面 `files` 声明的「写域」同名同物）"
- `docs/core/design/PROMPT-SYSTEM.md` §6.68 — "**逐字终稿（中文 = 规范面 · 唯一副本 = 本节）**" ∥ "**参考译（英文 · 实施席按中文终稿逐字译）**" ∥ "`Cite any \`.md\` by its full path from the repo root`: a bare name resolves only inside its own directory and is missing across directories — written bare, the gate refuses the write on the spot and nothing lands at all."
- `docs/batches/2026-11-02-disposition-unify.md` §1 — "按 194 该当场修，按 144 该不记不动，按 190 该上账。" ∥ "记了账（违反 144 的唯一被明文禁止项）"
- 同一记录 §2 — "`docs/core/design/PROMPT-SYSTEM.md` §6.8（含三处逐字终稿 + 参考译）" ∥ "英文终稿由 eng-coder 按 §6.8 / §6.68 的中文终稿逐字译落笔" ∥ "§6.8 A1–A6：A1 三条旧规则各 0 命中 · A2 新规则 1 命中且节对"
- `docs/batches/2026-11-02-bare-name-pointer-unify.md` — "**「触达即全清」**：本批既然碰这个档，就把它清干净再走。"
- （`scripts/prompt-refs-check.mjs` 只被执行、不被改；三档提示词本席未改、未越界评审。）

**计数**：🔴 4 · 🟡 7 · 🔵 4（共 15 条）

VERDICT: changes-required

### 轮次 2（评审子代理）

**本轮结论**：上轮十五条逐条已闭（🔴1–4 已修 · 🟡5–11 已闭 · 🔵12–15 已修/无需动作）——**未闭 0 条**；新 🔴 0 条。

| # | 上轮# | 严重度 | 状态 | 说明（本轮实读，`docs/core/design/PROMPT-SYSTEM.md` §6.8 ∥ §6.68 + 批档全文） |
|---|---|---|---|---|
| 1 | 🔴1 | 🔴 | ✅ 已修 | §6.8 现有两处落点的逐字终稿 + 参考译：中文围栏块 3 行（起「处置分派（一条判据 · 三个去处 · 写域先判）」）+ 英文围栏块 5 行 + 落点 2 中英各 1 行 + 落点表两条（`thincoder-core/prompts/persona-engineering.md` ∥ `thincoder-core/prompts/persona-eng-designer.md`）；第三处（`## Batch-record lifecycle`）= §6.68 ⇒ 与批档 §2「含三处逐字终稿 + 参考译」不再相抵 |
| 2 | 🔴2 | 🔴 | ✅ 已修 | §6.8 现有 A1–A6 表（各给判法/读数）；批档 §2 验收对照引的「§6.8 A1–A6」逐项对得上（A1 三条旧规则各 0 · A2 新规则 1 且节对 · A3 写域限定 1 且条对 · A4 纪律档零改 · A5 行宽与结构 · A6 交付门） |
| 3 | 🔴3 | 🔴 | ✅ 已修 | §6.8 现有「**集成测试设计**：`none` —— …」与「**RTM 读数**（本席本轮 `node` 实算 · 2026-11-02）：`test/RTM.md` 353 行 … 近面无涉——故事 7…· 故事 17…」；与 §6.68 的 RTM 读数逐项一致（353 / 5 / 28 / 156） |
| 4 | 🔴4 | 🔴 | ✅ 已修 | 写域改为「**写域 = 这一笔的落笔面**：实施席取任务书 `files` 声明的文件；主 agent 取本席笔域档（批档 / 台账 / 需求档 / 设计档 / 提示词）」；新增「写域两类席各取各的（与既有 `files` 条的关系）」段：既有条逐字 + 关系 = 「同坐标、不同字段」+ 落例（「写本批 §1 时在本批档里看见一个错字 ⇒ 写域内 ∧ 小样 ⇒ 当场修」）+ 反例（「在一本已收口的旧批档里看见一个错字 ⇒ …不修、不记、不报」） |
| 5 | 🟡5 | 🟡 | ✅ 已闭（取路 ①） | K4 改成正解并携读数：「该条四项禁令里 `not acted on` 已覆盖「动手」…不是补溃口」；§2「本批不做」记「**零改 `thincoder-core/prompts/discipline-engineering.md`**（§6.8 K4：`not acted on` 已覆盖「动手」）」；A4 判该半句 0 命中 |
| 6 | 🟡6 | 🟡 | ✅ 已修 | 判据首句即拍板门并自带先后：「一条核实过的问题先过拍板门——…它挡住本轮时，写域外也照问」；K7「拍板门写成先于三个去处的一格」+ C4 ∥ C5 覆盖原先无答案的两个组合（写域内∧小样∧要拍板、写域外∧要拍板） |
| 7 | 🟡7 | 🟡 | ✅ 已修 | 就地定义段在场：「**「触达即全清」是什么（就地定义 · 无规范面出处可指）**：某一批的任务书一旦把某档列进写域，该档里同类的过期措辞 / 坐标 / 索引就在那一笔里一并收正，不留给下一批。」 |
| 8 | 🟡8 | 🟡 | ✅ 已修 | 两半去向写明：「**「债必须可见」两半去哪了**：上账那一半 = 第二个去处（落一行台账）；`never leave it in prose` 那一半并入第二个去处的措辞」；判据第二去处亦写「不留散文」 |
| 9 | 🟡9 | 🟡 | ✅ 已闭 | 两支按上轮给的替代形闭合：既有件三问写 `existing` = `Fix in place first` 条 ∥ `Only real debts enter the pool` 条，「两个去处就是这两条…不新造动作」；勘察证据行逐字给旧条；用例表 C1（小样）/ C2（大件）给两支场景形 |
| 10 | 🟡10 | 🟡 | ✅ 已修 | 「**先例 ∥ 偏离**」「**既有件三问（新增名）**」「**勘察证据行（本席实读 · 2026-11-02）**」三段齐，形与 §6.68 同（含「公共源勘察：项目 manifest 的 `index.publicRepos` 实读 = `[]`…已查，无相关。」） |
| 11 | 🟡11 | 🟡 | ✅ 已闭（残留 = 父侧上抛） | 「**何时重开（父侧「不上需求档」裁定的落点）**」与「**这一条改了用户能看到什么**」两段均在；需求层是否另载已成 §2 上抛 2（待裁 · 需求面） |
| 12 | 🔵12 | 🔵 | ✅ 已修 | §6.68 现有「**RTM 读数**（本席本轮 `node` 实算 · 2026-11-02）：…近面无涉——故事 7…· 故事 8…」 |
| 13 | 🔵13 | 🔵 | ✅ 已修 | §6.68 A2 写死量法：「判法只认一种量法：该节内以 `^\d+\.` 起首的行数 = **6**（`1.`–`6.`）…不按 bullet 数」 |
| 14 | 🔵14 | 🔵 | ✅ 已修 | §6.68 参考译尾句改回「…and the whole segment lands as zero bytes.」 |
| 15 | 🔵15 | 🔵 | ✅ 无需动作（独立复核成立） | §2「**档位结论**：表内全为 `.md` 档，无文件跨档位。」受影响文件五行全是 `.md` |

**另核三件（问 → 答）**

1. **写域那个新定义能不能真判** —— 能。落例与反例给相反结论：「写本批 §1 时在本批档里看见一个错字 ⇒ 写域内 ∧ 小样 ⇒ 当场修」 vs 「在一本已收口的旧批档里看见一个错字 ⇒ 那本不是这一笔的落笔面 ⇒ 不修、不记、不报」；且「关系 = **同坐标、不同字段**」把与 `files` 条的边界说死，不再两读。
2. **「当场问」提到首句后，三个去处还成不成立** —— 成立。先后写在判据里（「先过拍板门…它挡住本轮时，写域外也照问」），与节标题「三个去处 · 写域先判 · 拍板门先于写域」对齐：门是门（停止处置），不是第四去处；实际出口 = 1 道门 + 3 个去处，措辞与结构一致。
3. **英文参考译数得清** —— 落点 1：中文 **3 行** / 英文 **5 行**，内容对应 = 拍板门 1 + 写域判据 2 + 写域定义 1 + 优先级 1；三个去处两语都各是一支（英文没有把「写域外」并进其他支，也没有多出第四支）。§6.68：中文 **1 行** / 英文 **1 行**。行号见上「说明」列的引文。

**新增（本轮修正带出来的，均非 must-fix）**

| N1 | (new) | `docs/batches/2026-11-02-disposition-unify.md` §1 ∥ §2 | 🟡 可选 | 记录面滞后：§1「边界」仍写「`thincoder-core/prompts/discipline-engineering.md` 第 144 行补一句射程回指」，§2 与 §6.8 K4 已改为零改；§6.8 上抛项 1 已把该分歧明文交父侧裁（「父侧若要 ②（保留但换理由），本席按新理由改写该落点并同步本节」）⇒ 按设计层优先，本条只作报告 |
| N2 | (new) | 同一记录 §1 ∥ `docs/core/design/PROMPT-SYSTEM.md` §6.8 | 🔵 | 读数漂移：§1 写「`thincoder-core/prompts/persona-eng-designer.md` 第 36 行同句」，§6.8 勘察行 = 「`Consistency surface` 条（本轮读数 = 该档第 47 行）」；落点按条文本锚定，实施无风险 |
| N3 | (new) | `docs/core/design/PROMPT-SYSTEM.md` §6.8 | 🔵 | 参考译比中文终稿少两处例子：中文「（语义往哪边走 / 两条判据谁让谁）」，英文只有 "must the user rule on it?"。实施席若照英文落笔，例子不进提示词面——要么把例子补进英文，要么明写「例子只住规范面」 |

**计数**：上轮 15 条 → 已闭 15 · 未闭 0；新增 🔴 0 · 🟡 1 · 🔵 2。

VERDICT: pass

## §4 用户批准（主 agent）

## 4. 用户批准（主 agent 记）

- **批准原话**：「**后续自动跑完**」 —— 即：批准本批按既定链路一次跑到底，中途不再逐步确认。 · 时间：2026-11-02 04:08
- **前序令（同日）**：「**别拆了，完整的做完，不要再搞什么花样了**」（07:17）∥「**统一一下，明确当场修**」（03:58）∥「**裸档名的问题为什么还没有解决**」（04:00）。

### 批准时的世界状态

| 面 | 状态 |
|---|---|
| §2 设计 | §6.8 重写（判据含拍板门 · 四个落点 · A1–A8 · 用例 · 决策 · 先例 ∥ 勘察 ∥ 既有件 · 集成与 RTM）∥ §6.68 一句 + 标题计数 |
| §3 评审 | 两轮：轮 1 changes-required（🔴4 · 🟡7 · 🔵4）→ 轮 2 **pass**（15 条全闭） |
| §5 实施 | 两轮：三处落笔 + 落点 3 ∥ 落点 4；A1–A8 全绿 |
| 交付门 | `DOC-CHECK GATE: PASS`（显式 3 档全清 · 0 段） |

## §5 实施记录（eng-coder）

**状态行**：✅ 实施完成 · 2026-11-02

**结论**：三处落笔全部落地，与设计英文终稿逐字相等；A1–A6 六项读数全部实跑通过；纪律档零改。自审两轮（分叉审计 + 独立代码评审）均无 🔴，终态 = clean。

### 1. 交付表（对任务书 §2 的两条条目）

| # | 状态 | 条目 | 落点 | 读数 |
|---|---|---|---|---|
| 1 | ✅ 完成 | 处置规则统一（三处并列 ⇒ 一条判据 · 三个去处 · 写域先判 · 拍板门先于写域） | `thincoder-core/prompts/persona-engineering.md`（删三条旧规则、原位置落 5 行新规则）∥ `thincoder-core/prompts/persona-eng-designer.md`（`Consistency surface` 条加写域限定） | A1 三条旧规则各 0 · A2 新规则 1 且节对 · A3 写域限定 1 且条对 |
| 2 | ✅ 完成 | 档引形态写进提示词（引任何文档一律写仓根完整路径） | `thincoder-core/prompts/persona-engineering.md` 的 `## Batch-record lifecycle` 节末新增第 6 条 + 标题 `(five rules)` ⇒ `(six rules)` | A1 逐字 1 且节对 · A2 该节 `^\d+\.` 行数 = 6 |

### 2. 改动明细（逐处逐字）

落点 1 —— `thincoder-core/prompts/persona-engineering.md` 的 `### Debts, ledger upkeep, and the closeout sweep` 节内：三条旧规则整行删除（`Debts must be visible` ∥ `Fix in place first` ∥ `Only real debts enter the pool`），在原位置落下面 5 行；紧随其后的 `**Why**` 续行原位保留：

```text
- **Disposition routing (one criterion, three destinations, write domain first)**: a verified problem asks one thing up front — must the user rule on it? Yes ⇒ ask now: never start the work, never book it (the pool takes work, not questions); blocks this round ⇒ ask even outside the write domain.
  It is work ⇒ judge the write domain: inside ∧ small form (wording / coordinates / indexes / cleanup) ⇒ fix it on the spot; inside ∧ large (its own round / a precondition / needs design) ⇒ book it this round as a ledger row naming the batch that takes it, never in prose;
  outside ⇒ not fixed, not booked, not reported — the batch that touches it corrects it then, clearing the whole file rather than leaving it to the next batch.
  **Write domain = what this stroke may write**: an implementer takes the files its task book's `files` declares; the main agent takes its own pen-domain documents (batch records / the ledger / requirement docs / design docs / prompts).
  The write-domain boundary outranks both "fix it on the spot" and "debts must be visible" — the boundary is a contract, those two are habits.
```

落点 2 —— `thincoder-core/prompts/persona-eng-designer.md` 的 `Consistency surface` 条整行替换为：

```text
  - **Consistency surface** (duplicate registrations / dead pointers / count/enumeration mismatches / form inconsistencies) → **inside your write domain** (the files this round's task book declares) you **may fix on the spot** (still reported one by one).
```

落点 3 —— `thincoder-core/prompts/persona-engineering.md` 的 `## Batch-record lifecycle` 节末新增：

```text
6. **Cite any `.md` by its full path from the repo root**: a bare name resolves only inside its own directory and is missing across directories — written bare, the gate refuses the write on the spot and the whole segment lands as zero bytes.
```

同笔改节标题：`## Batch-record lifecycle (five rules)` ⇒ `## Batch-record lifecycle (six rules)`。

### 3. 两处形态选择（不是改字）

- 落点 3 的列表标记：设计围栏块写 `- `，落地写 `6. ` —— 该节是编号条，而 A2 的量法 = 「节内以 `^\d+\.` 起首的行数 = 6」；句子的文字一个字符未改。
- 落点 2 的缩进：设计围栏块写 3 空格，落地保持该条原有的 2 空格 —— 它是 `The fix-vs-bounce split (tightened)` 下的子条，2 空格才与同级 `Semantics surface` 条平级；文字逐字未改。

### 4. N3 处置声明（父侧要求明报取哪一条路）

**落的是英文围栏块原文 —— 中文终稿里那两处例子（「语义往哪边走 / 两条判据谁让谁」）没有进提示词面。**

没取「把例子补进英文」那条路：第 1 行现为 297 字符，补进两处例子会越过提示词面 300 的行宽判据（A5 与交付门同判 300），要补必须重排该条五行 —— 那是改写，不是落笔。

N3 的第二条路（「明写例子只住规范面」）要落在设计档 §6.8，不在实施席笔域 ⇒ 留给设计席 / 父侧。

### 5. 验收读数（本轮实跑，不是声称）

| # | 判法 | 读数 |
|---|---|---|
| A1 | 扫三条旧规则 | `Debts must be visible` 0 ∥ `Fix in place first` 0 ∥ `Only real debts enter the pool` 0（改前各 1） |
| A2 | 新规则命中与节位 | 1 命中；所在 `### Debts, ledger upkeep, and the closeout sweep` 节 = 本轮读数起第 188 行、止于下一个 `^#` |
| A3 | 写域限定 | `inside your write domain` 在 `thincoder-core/prompts/persona-eng-designer.md` 1 命中，落在 `Consistency surface` 条内 |
| A4 | 纪律档零改 | `and not fixed either` 0；`Out-of-scope items are not recorded` 条逐字与改前相等 |
| A5 | 行宽与结构 | 新增行宽 297 ∥ 272 ∥ 159 ∥ 236 ∥ 142 ∥ 255 ∥ 241，全部 ≤300；两档 `>300` = 0；`##` / `###` = 17 / 5（改前 17 / 5）∥ 9 / 1（改前 9 / 1）；行数 495 ⇒ 498，净 +3 = 落点 1 的 +2（删 3 增 5）+ 落点 3 的 +1 |
| A6 | 交付门 | `doc_check(mode:"gate", target:"D:/teamcode/thincoder")` 首行 `DOC-CHECK GATE: PASS`，范围 = 本会话写过的 2 档 |
| 引用锁 | `node scripts/prompt-refs-check.mjs` | 命中 4 条，全在 `thincoder-core/agent-tools/advisor.mjs`，与本批改动的两档无关 ⇒ 集合无新增（该闸本身即为红，本批不改变它） |

### 6. 改动文件（写域 = 任务书声明面 + 本段）

- `thincoder-core/prompts/persona-engineering.md`（两笔：处置条三换一 · 生命周期节第 6 条与标题计数）
- `thincoder-core/prompts/persona-eng-designer.md`（一笔：写域限定）
- 本档 §5

写域外零改动；`thincoder-core/prompts/discipline-engineering.md` 本轮零改（K4）。

### 7. 单元测试 / 集成测试

- **无单测档**：本轮是纯提示词文本改动，没有运行期行为可测；验收 = 上表七项实跑读数（任务书 §2 已写明「改动面无单测档」）。
- **集成面 = none**：两笔都不改业务可观察结果、不新增业务场景；`test/RTM.md` delta = 破行 0 / 冗余 0 / 新增 0（设计两节各判 `none`，本席同判）。

### 8. 自审两轮与终态

| 轮 | 面 | 结论 |
|---|---|---|
| 1 | 分叉审计（只读子代理，按设计逐项核） | 七项全 compliant；四类偏差（PARTIAL / SILENT-SIMPLIFICATION / DOC-DRIFT / OUT-OF-LIST）零命中 · VERDICT: clean |
| 2 | 独立代码评审（advisor · code） | 🔴 0 · 🟡 3 · 🔵 3 · VERDICT: pass |
| 修正轮 | — | **0 轮**：三条 🟡 全部落在设计席 / 父侧笔域（设计覆盖面的裁，或记录面补写），改它们即第四处落笔，越过任务书的「三处落笔，不多不少」 |

**评审 🟡 三条（未修，附理由与去向）**

1. `thincoder-core/prompts/persona-eng-designer.md` 的 `Revision-style-expression check` 条仍是无条件的「当场修」——同一面上第二处未加写域限定，与设计 §6.8 K5「收窄一处即闭合」的断言不符 ⇒ 归设计席 / 父侧裁。
2. `thincoder-core/prompts/persona-engineering.md` 台账生命周期第 4 条「`New debt found` ⇒ book it the same day」与新判据第二个去处在小样面相交 ⇒ 归父侧裁（本批边界只含三处落笔）。
3. 本档 §5 原为空、交付读数无载体 ⇒ 本段即为补齐，不需另裁。

### 9. 设计档漂移（触达即报 · 非本席笔域）

- `docs/core/design/PROMPT-SYSTEM.md` §6.20 ∥ §6.23 的落点用「`Fix in place first` 条后新 bullet」定位，该条本轮已删 ⇒ 两处锚点失效，需设计席改成内容锚。
- 同一档 §6.68「落点」段仍写「现读 `(five rules)`」，盘面已是 `(six rules)` ⇒ 成了过期读数，需设计席改成无时间性的判据句。

### 10. 修正轮：落点 3 ∥ 落点 4 落笔（2026-11-02 · 承接设计席修正轮 2 的两件）

**结论**：两处落笔全部落地，与 `docs/core/design/PROMPT-SYSTEM.md` §6.8「落点 3 参考译」∥「落点 4 参考译」两个围栏块**逐字节相等**（`node` 逐行 `===` 比对，不是眼看）；A7 ∥ A8 与上一轮 A1–A6 回归全部实跑通过；`thincoder-core/prompts/discipline-engineering.md` 本轮零改。

**交付表（对 §2 修正轮 2 的两件）**

| # | 状态 | 条目 | 落点 | 读数 |
|---|---|---|---|---|
| 1 | ✅ 完成 | 落点 3（设计席面第二处无条件「当场修」加写域限定） | `thincoder-core/prompts/persona-eng-designer.md` 的 `Revision-style-expression check` 条整行替换 | A7 全绿 |
| 2 | ✅ 完成 | 落点 4（台账生命周期第 4 条收窄为「新债 = 大件」+ 一句回指，不复制判据） | `thincoder-core/prompts/persona-engineering.md` 的 `## Ledger (requirement pool / tech todos) — batching & lifecycle` 节内生命周期第 4 条，整行换成两行 | A8 全绿 |

**承接上一段（§8）的两条 🟡**（§2 修正轮 2「待裁 3」的承接项）

| 上一段条目 | 承接者 | 落笔后状态 |
|---|---|---|
| §8 🟡1：`thincoder-core/prompts/persona-eng-designer.md` 的 `Revision-style-expression check` 条仍是无条件「当场修」 | 落点 3 | 已销（该条现含 `inside your write domain`） |
| §8 🟡2：`thincoder-core/prompts/persona-engineering.md` 台账生命周期第 4 条与新判据第二个去处相交 | 落点 4 | 已销（该条现为「新债 = 要自己一轮 / 有前置条件 / 要设计」+ 回指句） |
| §8 修正轮行写「0 轮」 | 本段 | 本段即该修正轮（1 轮）：上一段是「三处落笔」那一轮，本段承接设计席修正轮 2 新增的落点 3 ∥ 落点 4。**不回首改写上一段的结算行**（append-only 段纪律），在此记明取代关系 |

**改动明细（逐处逐字 · 与设计档围栏块逐字节相等）**

落点 3 —— `thincoder-core/prompts/persona-eng-designer.md`，条 = `Revision-style-expression check`，整行替换：

```text
- **Revision-style-expression check**: a consistency-surface item **inside your write domain** (the files this round's task book declares) ⇒ fix on the spot, still report each one.
```

落点 4 —— `thincoder-core/prompts/persona-engineering.md` 的 `## Ledger (requirement pool / tech todos) — batching & lifecycle` 节内生命周期第 4 条，整行替换为两行；第二行是 3 空格续行，与同节 `**A tech todo must carry \`trigger\`**` 续行同形；原 `trigger` 续行与 `- **Why book it**` 子条原位保留、零改：

```text
4. **A new debt is work needing its own round, a precondition, or design** (in-scope review findings / stop-and-report output / doc drift) ⇒ book it the same day, naming the batch that takes it.
   That is the disposition routing's second destination — same coordinate, criterion not restated here; a small-form item inside the write domain was already fixed on the spot and never reaches this line.
```

**形态选择：本轮无「形态换算」**——两处逐字节即落地形。

| 处 | 设计围栏块形 | 落地形 | 判 |
|---|---|---|---|
| 落点 3 | 0 空格 `- ` 顶层条 | 0 空格 `- `，与同档 `The sweep` ∥ `Delete on sight` 同级 | 同形，零调整 |
| 落点 4 | 第 1 行 `4. ` / 第 2 行 3 空格续行 | 同左；同节续行本就 3 空格 | 同形，零调整 |

**验收读数（本席本轮实跑）**

| # | 判法 | 读数 |
|---|---|---|
| A7 | `thincoder-core/prompts/persona-eng-designer.md` 扫 `inside your write domain` | **2**（`Consistency surface` ∥ `Revision-style-expression check` 各 1，两条都在各自条内）；旧形 `**Revision-style-expression check**: a consistency-surface item ·` ⇒ **0**；旧形实际盘面形（`… a consistency-surface item ⇒ fix on the spot`）改前 1 ⇒ 改后 **0**；该行宽 **180**；全档 `>300` = 0 |
| A8 | `thincoder-core/prompts/persona-engineering.md` 扫 `A new debt is work needing its own round, a precondition, or design` | **1**，落在 `## Ledger (requirement pool / tech todos) — batching & lifecycle` 节内；旧首句 `**New debt found**` 改前 1 ⇒ 改后 **0**；该条内 `disposition routing's second destination` = **1**；该条内 `small form (wording` = **0**（全档唯一命中在处置分派条内，是判据唯一副本，非本条）；该条两行宽 194 ∥ 204，其下 `trigger` 续行 210、`Why` 子条 130 未动 |
| 回归 A1 | 三条旧规则 | `Debts must be visible` 0 ∥ `Fix in place first` 0 ∥ `Only real debts enter the pool` 0 |
| 回归 A2 | 新判据在位且节对 | `Disposition routing (one criterion, three destinations, write domain first)` = **1**，在 `### Debts, ledger upkeep, and the closeout sweep` 节内（节切 = 该 `###` 到下一个 `^#`） |
| 回归 A3 | 设计席面写域限定 | `inside your write domain` = **2**，其中落在 `Consistency surface` 条内 1 |
| 回归 A4 | 纪律档零改 | `and not fixed either` = **0**；`Out-of-scope items are not recorded` 条逐字仍在；该档 mtime = 2026-11-01 21:35（早于本轮两档的 04:22:55），无本轮写入 |
| 回归 A5 | 行宽与结构 | 两档 `>300` = **0**；`thincoder-core/prompts/persona-engineering.md` 的 `##` / `###` / 行数 = 17 / 5 / 499（改前 17 / 5 / 498，净 +1 = 一条换两行）；`thincoder-core/prompts/persona-eng-designer.md` = 9 / 1 / 165（改前同，一条换一条） |
| 回归 A6 | 交付门 | `doc_check(mode:"gate", target:"D:/teamcode/thincoder")` 首行 `DOC-CHECK GATE: PASS`（3 档全清，0 段命中） |
| 生命周期节 | 标题与编号同拍 | `## Batch-record lifecycle (six rules)`；该节内以 `^\d+\.` 起首的行数 = **6** |
| 引用锁 | `node scripts/prompt-refs-check.mjs`（仓根实跑） | 命中 **4** 条，全在 `thincoder-core/agent-tools/advisor.mjs`（三条指 `docs/core/design/ADVISOR-GUARDS.md`、一条指 `docs/core/requirements/METHODOLOGY.md`），无一条指向本轮两档 ⇒ 集合无新增（该闸本身即为红，本批不改变它） |

**自审两轮与终态**

| 轮 | 面 | 结论 |
|---|---|---|
| 1 | 分叉审计（只读 `explore` 子代理，按设计围栏块逐项核） | 七项全 compliant；PARTIAL 0 · SILENT-SIMPLIFICATION 0 · DOC-DRIFT 0 · OUT-OF-LIST 0 · VERDICT: clean |
| 2 | 独立代码评审（`advisor` · code） | 🔴 0 · 🟡 2 · 🔵 2 · VERDICT: pass |
| 修正轮 | — | **0 轮**：四条全部落在设计席笔域或记录面笔域，改它们即越过「按下发终稿逐字落笔」（A7 ∥ A8 判的就是那两串逐字） |

**终态 = clean。**

**评审四条的去向（本轮未修，附理由）**

| # | 判 | 内容摘要 | 为什么本轮不修 |
|---|---|---|---|
| 1 | 🟡 | `thincoder-core/prompts/persona-eng-designer.md` 落点 3 落出后，该条不再说它检查什么；同一面的 `**Delete on sight**: the swept expression is removed in the same pass.` 仍无写域限定 ⇒ 设计席 K5「两处各加同一条限定才闭合」按盘面读未闭合 | 语义面（设计档措辞），改它 = 偏离下发终稿；设计席笔域，上抛父侧 |
| 2 | 🟡 | 同一处置规则两条情态不一：`Consistency surface` 是 `you **may fix on the spot**`（许可），落点 3 是 `⇒ fix on the spot`（祈使） | 同上（两条都是设计席逐字终稿） |
| 3 | 🔵 | 「当轮进池」∥「当日记账」两时间词，指同一动作 | A8 判的就是 `naming the batch that takes it` 那一串；改即偏离 |
| 4 | 🔵 | §2「3. 受影响文件」表未列落点 4（正文修正轮 2 段⑤有载） | 记录面 §2 = eng-designer 段，非本席笔域；父侧收口时补 |

**单元测试 / 集成面**

- **无单测档**：纯提示词文本改动，无运行期行为可测；验收 = 上表实跑读数。
- **集成面 = none**：不改业务可观察结果、不新增业务场景，`test/RTM.md` delta = 破行 0 / 冗余 0 / 新增 0（与 §6.8 ∥ §6.68 两节同判）。

**改动文件（写域 = 任务书声明两档提示词 + 本档 §5）**

- `thincoder-core/prompts/persona-eng-designer.md`（一笔：落点 3）
- `thincoder-core/prompts/persona-engineering.md`（一笔：落点 4）
- `docs/batches/2026-11-02-disposition-unify.md` §5（本段）

写域外零改动；`thincoder-core/prompts/discipline-engineering.md` 本轮零改。

**设计档漂移（触达即报 · 非本席笔域）**

- `docs/core/design/PROMPT-SYSTEM.md` §6.8 A7 的旧形判法写作 `**Revision-style-expression check**: a consistency-surface item ·`，该串带一个 `·`，与落笔前盘面形（`… a consistency-surface item ⇒ fix on the spot`）不同 ⇒ 按字面扫，改前改后都是 0，这一格是空判。实质判法应取「旧形 = 无写域限定的那一句」，本段已按实质形给出前后读数（1 ⇒ 0）。需设计席改成内容锚。

## §6 验证与收口（父代理）

## 6. 验证与收口（主 agent）

### 交付读数（父侧独立复跑，不转述实施席）

| 面 | 读数 | 我的取法 |
|---|---|---|
| 新判据在位 | `Disposition routing (one criterion, three destinations, write domain first)` ⇒ **1** | `node` 扫档 |
| 旧三条清零 | `Debts must be visible` ∥ `Fix in place first` ∥ `Only real debts enter the pool` ⇒ **各 0** | 同上 |
| 档引句在位 | `thincoder-core/prompts/persona-engineering.md` 第 **149** 行：`6. **Cite any `.md` by its full path from the repo root**…` | 同上 |
| 标题计数同拍 | `## Batch-record lifecycle (six rules)`，该节 `^\d+\.` 起首行 = **6** | 同上 |
| 写域限定 | `thincoder-core/prompts/persona-eng-designer.md` 的 `inside your write domain` ⇒ **2**（`Consistency surface` ∥ `Revision-style-expression check`） | 同上 |
| 台账第 4 条收窄 | 起首 `4. **A new debt is work needing its own round, a precondition, or design**`；旧 `New debt found` ⇒ **0**；续行只回指不重述 | 同上 |
| 纪律档零改 | `and not fixed either` ⇒ **0** | 同上 |
| 交付门 | 四档 `DOC-CHECK GATE: PASS` · 0 段 | `doc_check` gate |

### 单元测试 / 集成测试

- **单元测试面 = 无**：纯提示词文本改动，零可跑行为。
- **集成测试面 = 不做差量**：`test/RTM.md` 破行 0 ∥ 冗余 0 ∥ 新增 0（不改业务可观察结果、不新增业务场景）。
- **本批未跑集成套件**：零代码 diff。

### 新规则的第一次自证（本批最实的读数）

实施席第一次写 §5 时用了**裸档名**，门**当场拒写**（`REFUSED（命中 5 条——锚·档缺）`，一个字未落），改成仓根完整路径后落盘。

**⇒ 那条规则落地 40 分钟内就按它自己写的方式生效了 —— 不是靠人记得，是靠门拒。**
**⇒ 同一道门在本记录上也拒了父侧两次（本节首版两个裸档名）；拒完照办即过。**

### 可接受残余（逐条带理由，不藏）

| # | 残余 | 为什么不修 |
|---|---|---|
| R1 | 英文参考译比中文终稿少两处例子（「语义往哪边走 / 两条判据谁让谁」） | 该行已 297 字符，补例子破 300 行宽判据；重排整条 = 改写不是落笔。例子是判据的**释例**，不是判据本体；中文规范面保留 |
| R2 | `Delete on sight` 条（「the swept expression is removed in the same pass」）无写域限定 | 上一句 `The sweep` 已把射程限在「while drafting / reconciling」= 本轮在写的档；且「算不算可修」由 `Revision-style-expression check` 条（已含写域限定）判。射程窄，不另开一轮 |
| R3 | 两条情态不一：`Consistency surface` 用 `you **may fix**`（许可），`Revision-style-expression check` 用 `⇒ fix`（祈使） | 同一机制、同一后果，情态差异不改判法；改它属措辞润色，非本批目标 |
| R4 | 批档 §2「受影响文件」表未列落点 4 | 修正轮 2 段⑤ 已载明；表是设计师段，父侧不改他人段 |

### 过程偏差（双方各一，按实记）

- **设计席**：两次用 `node` 直写盘改空行（零语义），未走 `edit` 工具 —— 违反「写文件走工具」。
- **父侧**：本会话被同一道门拒写**六次**（五次裸档名 + 一次未加列表标记的长段落），全部为同一类自伤。

### 收口链自检

| 项 | 结果 |
|---|---|
| §2 ↔ 设计档对账 | 四个落点逐处对上（§6.8 落点表 4 行 + §6.68 一处） |
| 先债交叉核对 | **有 5 笔挂在他档**（`#1940` `#1941` `#1967` `#1968` `#1971`），均有主、均由关档自动转「条件」，无悬空 |
| 修正轮落地前提 | 两轮修正全落且父侧独立复验 |
| 挂起清单复检 | 无 |
| 暂缓批复核 | 无 |

### 台账结算

- `#1986`（本批所开）：**已核销**。
- 本批未认领他人未决项，不涉及他行结算。
