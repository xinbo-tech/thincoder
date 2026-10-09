# 2026-10-09 · design-precedent-survey
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-09 · 来源 = 用户 2026-10-09 21:09「我希望提示词系统强化一下，设计一个功能时应该先看一下项目中相似或者同类的功能是怎么做的，不要每次都别出心裁。」——需求点落 METHODOLOGY F2-6（设计前置 = 同类先例勘察）。
> 台账 = #1159（core · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-10
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**来源**：用户 2026-10-09 21:09「我希望提示词系统强化一下，设计一个功能时应该先看一下项目中相似或者同类的功能是怎么做的，不要每次都别出心裁。」——需求点落 `docs/core/requirements/METHODOLOGY.md` §2.1 **F2-6**（设计前置 = 同类先例勘察：对齐优先 ∥ 有意偏离须显式理由；判定句 = 设计档含「同类先例」行 + 评审可核）。

**本批射程**（三段落点）：① 纪律层设计步（行为面——`docs/core/design/prompts/discipline-engineering.md` 设计步子条）；② 设计者档 8 项 item 1（交付物面——`docs/core/design/prompts/persona-eng-designer.md`）；③ 评审维度（核查面——`docs/core/design/ADVISOR-CONVERGENCE.md` §14 + A-AC15 + `advisor-design` 评审标准第 9 条）。

**边界**：零新机制（只增一条设计前置纪律 ∥ 一条评审维度）；提示词实体落笔 = 实施轮（eng-coder——CN+EN 双面，落形口径「产品代码」）；与 F7-2（方案与理由）互邻（先例 = 选型的输入面）；细节 = 批档 §2。

**授权口径**：用户 21:10「刚才说的哪些都点火开工吧」——全链自动（代点火 ∥ 代签 ∥ 派发；自缚三条在案）。

**台账行**：#1159。

**§1 补记（收口时 · 2026-10-10 · 主 agent）**：本段正文（`:9-17`）已载来源 / 射程 / 边界 / 授权口径 / 台账行；模板占位行（`:7`）留档（append-only——以本注代填；沿 §2.10「以派单代」先例）。另：授权口径行（`:15`）所载「全链自动（代点火 ∥ 代签 ∥ 派发；自缚三条在案）」与 2026-10-10 03:07 用户「墙上两条都走，全自动」口径同族（会话级全自动授权——自缚：新范围/口径裁决 ⇒ 停 ∥ 破坏性 ⇒ 停）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（初始轮 · 2026-10-09 · 落点与逐字块见 §2.1–§2.10（逐字块 §2.5；实施轮 = 提示词双面落笔））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

（设计轮 · 初始 · eng-designer · 2026-10-09——逐字目标形六块在 §2.5；本节为设计正文）

### 2.1 本批条目（覆盖 ∥ 不覆盖）

**覆盖（1 条）——F2-6 · 设计前置 = 同类先例勘察**
- 需求 = `docs/core/requirements/METHODOLOGY.md:39`（§2.1 基本流程 · 台账 #1159）；判定句 =「设计档含『同类先例』行（先例坐标 + 对齐 ∥ 偏离理由）；设计评审可核」。
- 内容 = 设计任一功能前先勘同类 / 相似功能的现行做法（实现坐标 ∥ 设计档对应节 ∥ 先例批）——对齐优先；有意偏离 ⇒ 显式理由；默认「别出心裁」= 违规。
- 实施面 = 提示词双面（zh 正本 ∥ en 运行面）+ 评审维度随正（载体 `docs/core/design/ADVISOR-CONVERGENCE.md`）。

**明确不在本批**
- F7-2 方案选型对比纪律本体——只在互邻句中指认（**不复活候选对比要求**；其需求面状态见 §2.10 发现 2）；
- #1157 两缺句（异批——零交叉）；
- 提示词文件**落笔**（= 实施轮 eng-coder；本批只出逐字目标形）；
- `thincoder-core/prompts/**` 直改（禁触面——零触碰）。

### 2.2 面判定与落点表（本轮两类动作：落笔 ∥ 出逐字块）

| # | 落点 | 面 | 本轮动作 | 执行者 |
|---|---|---|---|---|
| L1 | `docs/core/design/ADVISOR-CONVERGENCE.md` | 设计档面（机制权威） | **本轮已落**：§14 新节（`:430-437`）+ 档头维度指针（`:17`）+ §12 A-AC15（`:413`）+ 变更记录（`:441`） | eng-designer（本席） |
| L2 | `docs/core/design/prompts/discipline-engineering.md` | 提示词面 · zh 正本 | 逐字目标形（块 ①） | eng-designer 笔 |
| L3 | `thincoder-core/prompts/discipline-engineering.md` | 提示词面 · en 运行面（产品码） | 逐字目标形（块 ②） | 实施轮（eng-coder） |
| L4 | `docs/core/design/prompts/persona-eng-designer.md` | 提示词面 · zh 正本 | 逐字目标形（块 ③） | eng-designer 笔 |
| L5 | `thincoder-core/prompts/persona-eng-designer.md` | 提示词面 · en 运行面（产品码） | 逐字目标形（块 ④） | 实施轮（eng-coder） |
| L6 | `docs/core/design/prompts/advisor-design.md` | 提示词面 · zh 正本 | 逐字目标形（块 ⑤） | eng-designer 笔 |
| L7 | `thincoder-core/prompts/advisor-design.md` | 提示词面 · en 运行面（产品码） | 逐字目标形（块 ⑥） | 实施轮（eng-coder） |

**面判定说明**：提示词双面——zh 正本（`docs/core/design/prompts/**`，文档面 / 非运行期）∥ en 运行面（`thincoder-core/prompts/**`，产品码面）；承双面流程先例 `docs/batches/2026-09-20-consistency-sync-batch.md` §2.4 / §5.1——设计轮只出逐字目标形（落批档 §2）；**落笔按面分述**：zh 正本三档（L2 / L4 / L6）= **eng-designer 笔** ∥ en 运行面三档（L3 / L5 / L7）= **实施轮 eng-coder**——承 `docs/core/requirements/ENGINEERING-MODE-V2.md` §13.1 D1（`:602`）∥ §7.3 红线（`:365`，2026-09-26 裁定）；措辞若主 agent 另裁 ⇒ 以裁定为准（同先例 ④ 句）。

### 2.3 同类先例（本设计自用 F2-6——先例坐标 + 对齐 ∥ 偏离理由）

- **先例 ① F-R24（行数标注核查）落地链**（需求 `docs/core/requirements/METHODOLOGY.md:68-69` ∥ 维度权威 `docs/core/design/ADVISOR-CONVERGENCE.md` §9（`:365-372`）∥ 执行 `docs/core/design/prompts/advisor-design.md`:21（维度 8）∥ 设计档结构条款 `docs/core/design/prompts/persona-eng-designer.md`:64（8 项 item 3））。**对齐**：本批全链同形——需求（F2-6 在册）→ 维度权威节（§14）→ 评审提示词维度（第 9 条）→ 设计档结构条款（item 1）。
- **先例 ② 提示词双面流程**（`docs/batches/2026-09-20-consistency-sync-batch.md` §2.4 / §5.1：zh 正本 ∥ en 运行面；设计轮出逐字目标形、实施轮落笔）。**对齐**：本批提示词六档零落笔、出逐字块（§2.5）。
- **先例 ③ ADVISOR-CONVERGENCE 维度增补形**（§9：权威链注 + 「标准维度补一条」+ §12 A-AC 行随补——`ADVISOR-CONVERGENCE.md`:365-372 ∥ `:408-409`（A-AC10 / A-AC11））。**对齐**：§14 同形 + A-AC15。
- **有意偏离（1 处，显式理由）**：§14 **节号尾置**（列于 §13 之后）而非紧随 §9——理由：紧随 §9 需重排 §10–§13，违反本批「不动其他节」约束，且使既有指针（档头 `:17`、他批引 §12 等）失据；代价 = 评审维度两节不相邻（可读性微降——已登记）。

### 2.4 机制设计（三段）

**① 设计纪律（行为面）** → `discipline-engineering.md` 基本流程「2. **设计**」条目（新子条首条；插于现 `:36` 步骤句之后、`:37`「- 设计 = 对需求的检验…」之前）：先例勘察 + 对齐优先 + 偏离显式理由 + 零先例显式声明 + 默认「别出心裁」= 违规。
**放置理由**：F2-6 ∈ METHODOLOGY §2.1 基本流程（与 F2-1 / F2-4 同族——族例之细则落纪律层设计步，`METHODOLOGY.md:34` 引 `discipline-engineering.md:8`）；该档消费方 = 主会话 · 工程模式 + eng-coder + eng-designer 全装配（主 agent 需见——核验设计稿 / 派单面）。
**被否**：单落 `persona-eng-designer.md`（主 agent 全装配不可见——流程面失锚）。

**② 设计档交付物（形态面）** → `persona-eng-designer.md` 文档结构「8 项」item 1（现 `:62`）：设计档结构增**「同类先例」一行**（先例坐标 + 对齐 ∥ 偏离理由）。
**放置理由**：判定句「设计档含『同类先例』一行」= 设计档交付物形态——F-R24a 同型（行数标注义务落 8 项 item 3）；与 ① 零重复（行为 ∥ 形态两半，各归其位）；保 8 项计数不变（就地扩 item 1，不重排——「不动其他节」）。
**被否**：全并入 ①（设计档完整性清单〔8 项「缺一项即不完备」〕不含该行——判定句失锚）；单设第 9 项（计数 8→9 连带改面 + 重排风险）。

**③ 评审维度（核查面）** → `ADVISOR-CONVERGENCE.md` **§14 同类先例核查（设计评审维度）**（本轮已落，`:430-437`；承 §9 维度增补形）+ `advisor-design.md` 评审标准**第 9 条**（逐字块 ⑤ / ⑥）。
- **与方案选型对比互邻**（F2-6 边界）：先例 = 对比的输入面——对比在场（候选 ≥2）时先例即其判据输入；**本维度只核「同类先例」行，不引入候选对比要求**（互邻句落 §14 + 本 §2；**不入提示词面**——避与「列候选对比」退役句族混，该纪律 2026-09-17 已废）。
- **「显式理由」判据（可核形）**：**指认所勘先例 + 说清既有形为何不适用**——缺任一即未显式（只说「更好 / 更新 / 更简」而没说清既有形为何不适 = 未给）；**无同类先例可勘 ⇒ 显式声明**（不得静默省行）。
- **被否**：并入既有维度（#3 方法论合规 / #8 行数标注）——独立断言面须独立可核问（承 #8 单列先例）。

### 2.5 逐字目标形（六块——CN 正本逐字 ∥ EN 目标形；实施轮逐字落笔）

**块 ①（L2 · zh 正本 `docs/core/design/prompts/discipline-engineering.md`）**
落点：基本流程「2. **设计**」之下、现 `:37`「   - 设计 = 对需求的检验…」行之前（成为设计步子条首条）。新增行（逐字）：
```text
   - **同类先例勘察（设计前置）**：设计任一功能前，先勘**同类 / 相似功能的现行做法**（实现坐标 ∥ 设计档对应节 ∥ 先例批）——**对齐优先**（沿既有形：组件 ∥ 布局 ∥ 判据 ∥ 用词）；有意偏离 ⇒ 设计里**显式理由**（说清既有形为何不适用）；无同类先例可勘 ⇒ 显式声明；默认「别出心裁」= 违规。
```

**块 ②（L3 · en 运行面 `thincoder-core/prompts/discipline-engineering.md`）**
落点：同位（现 `:37` "   - Design = a check on requirements…" 之前）。新增行（逐字）：
```text
   - **Closest-precedent survey (design precondition)**: before designing any feature, survey how **similar / same-kind features currently do it** (implementation coordinates ∥ the matching design-doc section ∥ precedent batches) — **align first** (follow the existing shape: component ∥ layout ∥ criteria ∥ wording); an intended deviation ⇒ an **explicit rationale** in the design (state why the existing form does not apply); where no precedent exists ⇒ declare it explicitly; **diverging for its own sake = a violation**.
```

**块 ③（L4 · zh 正本 `docs/core/design/prompts/persona-eng-designer.md` `:62`）**
就地替换（item 1）：
改前（逐字）：`1. **方案与理由**——设计层直陈「决定 + 理由」，不再要求候选枚举（该纪律已废）`
改后（逐字）：
```text
1. **方案与理由**——设计层直陈「决定 + 理由」；**同类先例**一行（先例坐标 + 对齐 ∥ 偏离理由）；不再要求候选枚举（该纪律已废）
```

**块 ④（L5 · en 运行面 `thincoder-core/prompts/persona-eng-designer.md` `:62`）**
就地替换（item 1）：
改前（逐字）：`1. **Approach & rationale** — the design layer states「decision + rationale」directly; candidate enumeration is no longer required (that discipline is retired)`
改后（逐字）：
```text
1. **Approach & rationale** — the design layer states「decision + rationale」directly; a **closest-precedent** line (precedent coordinates + alignment ∥ deviation rationale); candidate enumeration is no longer required (that discipline is retired)
```

**块 ⑤（L6 · zh 正本 `docs/core/design/prompts/advisor-design.md`）**
落点：评审标准新条目 9——插于现 `:21`（第 8 条）之后、`:23`「**补充检查项…**」之前。新增行（逐字）：
```text
9. **同类先例核查** — 查设计档是否含**「同类先例」行**：先例坐标（实现坐标 ∥ 设计档对应节 ∥ 先例批）+ 对齐 ∥ 偏离理由。**有意偏离 ⇒ 理由须显式**（指认所勘先例、说清既有形为何不适用——缺任一即未显式）；**无同类先例可勘 ⇒ 显式声明**（不得静默省行）。
```

**块 ⑥（L7 · en 运行面 `thincoder-core/prompts/advisor-design.md`）**
落点：item 8 句末（"…stated in this bullet."）之后、`## Output Format` 之前——**自成新行**（现档 item 8 与该标题同行密排）。新增行（逐字）：
```text
9. **Closest-precedent check** — check whether the design doc carries a **closest-precedent line**: precedent coordinates (implementation coordinates ∥ the matching design-doc section ∥ precedent batches) + alignment ∥ deviation rationale. **For an intended deviation the rationale must be explicit** (it names the surveyed precedent and states why the existing form does not apply — missing either = not explicit); **where no precedent exists, an explicit declaration** is required (never silently skip the line).
```

**落笔注（实施轮守则）**：① 六块逐字照落、零字改（含全角标点与 `∥` / `⇒` / `——`）；② 缩进与同族子条同形（zh 三空格 + `- `；en 同）；③ **零夹带**——不动其他节、不新增内容锚测试（2026-09-18 裁定）；④ 落笔后逐块 grep 回读（D6）并跑 `node scripts/doc-check.mjs`。

### 2.6 变更记录逐档一行（CN 侧）
- `docs/core/design/ADVISOR-CONVERGENCE.md`：**本轮已落**（`:441`，逐字）：「- 2026-10-09（**设计前置先例勘察批（design-precedent-survey）· 设计轮 · eng-designer**——承 `docs/batches/2026-10-09-design-precedent-survey.md` §2 · 台账 #1159 · 需求 F2-6）：新增 **§14**（同类先例核查——设计评审维度：先例行核对 · 偏离理由显式判据 · 无先例显式声明 · 与方案选型对比互邻）；档头维度指针随正；§12 增 A-AC15。明细 = 批档 §2。」
- CN 侧提示词三档（`discipline-engineering.md` / `persona-eng-designer.md` / `advisor-design.md`）：**无变更记录节**（实读；承 09-20 先例）——留痕 = 本批档 §2 + 实施轮 §5；**不新增档体结构**（「不动其他节」）。EN 面同（n/a）。

### 2.7 受影响文件与测试面
| 文件 | 面 | 预期 Δ | 落点 | 执行者 |
|---|---|---|---|---|
| `docs/core/design/ADVISOR-CONVERGENCE.md` | 设计档 | 471 → 483 行（+12——实读 as-of 本轮） | §14 `:430-437` · 档头 `:17` · A-AC15 `:413` · 变更记录 `:441` | 本席（**已落**） |
| `docs/core/design/prompts/discipline-engineering.md` | 提示词 zh | +1 行 | `:36` 后（块①） | eng-designer 笔 |
| `thincoder-core/prompts/discipline-engineering.md` | 提示词 en | +1 行 | `:36` 后（块②） | 实施轮（eng-coder） |
| `docs/core/design/prompts/persona-eng-designer.md` | 提示词 zh | ±0（就地替换） | `:62`（块③） | eng-designer 笔 |
| `thincoder-core/prompts/persona-eng-designer.md` | 提示词 en | ±0（就地替换） | `:62`（块④） | 实施轮（eng-coder） |
| `docs/core/design/prompts/advisor-design.md` | 提示词 zh | +1 行 | `:21` 后（块⑤） | eng-designer 笔 |
| `thincoder-core/prompts/advisor-design.md` | 提示词 en | +1 行 | `:10` 后、`## Output Format` 前（块⑥） | 实施轮（eng-coder） |

**执行者按面分述**（zh 正本 = eng-designer 笔 ∥ en 运行面 = 实施轮 eng-coder）——承 `docs/core/requirements/ENGINEERING-MODE-V2.md` §13.1 D1（`:602`）∥ §7.3 红线（`:365`，2026-09-26 裁定）。

**测试面**：零代码面；**不新增内容锚断言**（2026-09-18 裁定——新增断言只允许行为面与结构机检面）；实施轮验证 = ① 六块逐字在位（UTF-8 感知 `node` 扫描——不用 `findstr`）② 既有提示词面测试零回归（`thincoder-core` 套件）③ `node scripts/doc-check.mjs` EXIT 0。

### 2.8 验收对照（逐条回指 F2-6）
| # | F2-6 要件 | 载体 | 判据 | 本批读数 |
|---|---|---|---|---|
| A1 | 设计档含「同类先例」行（先例坐标 + 对齐 ∥ 偏离理由） | §14 `:436` + 块③（8 项 item 1） | 落档后 zh / en 两面逐字在位 | **本轮**：§14 已落 ✓；块③ 待实施轮 |
| A2 | 设计评审可核（评审维度随正） | §14 `:430-437` + 块⑤ / ⑥ | 评审标准第 9 条在位（两面）；§12 A-AC15 `:413` 在册 | **本轮**：§14 + A-AC15 已落 ✓；块⑤ / ⑥ 待实施轮 |
| A3 | 设计前置勘察 + 对齐优先 + 偏离显式理由（纪律面） | 块① / ② | 两面逐字在位 | 待实施轮 |
| A4 | 机检 | `node scripts/doc-check.mjs` | EXIT 0 | **本轮实跑**（落笔后）：`OK(锚): 0 条悬空` ∧ `OK(行宽)` ∧ exit 0 |
| A5 | 本设计自用（首用示范） | §2.3 | 含「同类先例」行（先例坐标 + 对齐 ∥ 偏离理由） | **本轮** ✓ |

### 2.9 关键决策记录（决定 / 理由 / 被否）
| # | 决定 | 理由（证据） | 被否 |
|---|---|---|---|
| D1 | 三段拆分：行为 → 纪律层设计步；形态 → 8 项 item 1；核查 → §14 + 第 9 条 | 与 F-R24 链同形（§2.3 先例①）；行为 / 形态 / 核查各归其位、零重复 | 单落任一处（§2.4 被否行） |
| D2 | 评审维度 = 新增第 9 条（不并入既有维度） | 独立断言面须独立可核问（承 #8 单列先例） | 并入 #3 方法论合规 / #8 行数标注 |
| D3 | 互邻句落 §14 + §2，**不入提示词面** | 2026-09-17 裁定「提示词内不得要求列候选对比」；提示词面现仅存退役声明句（`docs/core/design/PROMPT-SYSTEM.md:659` / `:701`） | 入提示词面（与退役句族混） |
| D4 | §14 尾置（`:430`，不重排 §10–§13） | 「不动其他节」+ 既有指针不失据 | 紧随 §9（需重排） |
| D5 | 「显式理由」判据 = 指认所勘先例 + 说清既有形为何不适用（缺任一即未显式） | 判定句「为何既有形不适用」——可核形 | 「说了理由即可」宽形（不可核） |
| D6 | 零先例 ⇒ 显式声明（设计补全） | 判定句「设计档含…一行」须有零形态出口——防「省行」歧义 | 零先例免写（判定句无出口——留 §2.10 裁撤口） |

### 2.10 上抛项与范围外注
1. 〔不阻断本批 · 报主 agent（其笔）〕**F7-1 边界列指针失据**：`docs/core/requirements/METHODOLOGY.md:76` 称「设计行为纪律四维（A1 / A3 / A4）」逐字锚句驻 `docs/core/design/prompts/discipline-engineering.md`「设计行为纪律四维」节；**实读该档无此节**——A1 / A3 / A4 现驻 `persona-eng-designer.md`（`:33` 勘察 checklist / `:40` 评审前预检 / `:7` 实践沉淀）与 `docs/core/requirements/ENGINEERING-MODE-V2.md:348-360`。未自行改（需求档笔 = 主 agent）。
2. 〔不阻断本批 · 报主 agent（其笔）〕**F7-2 需求面表述不一**：`METHODOLOGY.md:77`（候选 ≥2 → MUST 含「方案选型对比」子节）∥ `docs/core/requirements/ENGINEERING-MODE-V2.md:273`（不强制列候选对比；2026-09-17 裁定 + 提示词面已清零——`docs/core/design/PROMPT-SYSTEM.md:659`）。本批处置（不挑边、不复活对比纪律）：互邻句落 §14 + §2.3 / §2.4（先例 = 对比的输入面 + 「本维度只核同类先例行、不引入候选对比要求」）；提示词面不入「方案选型对比」字样。
3. 〔知会〕**批档 §1 未实填**（模板占位行在位）：本席按 spawn 派单（自含任务书要素）+ 需求 F2-6 + 台账 #1159 执行；建议主 agent 补 §1 或注「以派单代」。
4. 〔知会 · 裁撤口〕**「零先例显式声明」= 设计补全**（判定句可核所必需的零形态出口）：如主 agent 认其超 F2-6 字面 ⇒ 可裁撤（§14 `:436` + 块① / ⑤ 三处同步，1 行级）。
5. 〔观察 · 知会〕**写权表述两说并存**：`docs/core/requirements/ENGINEERING-MODE-V2.md:365`「中文设计档面（`docs/core/design/prompts/**`）其笔归设计轮（2026-09-26 裁定）」∥ 两面子代理人格档「提示词模板目录除外（含中文模板）不归你」（`docs/core/design/prompts/persona-eng-designer.md:15`）。本批按派单口径执行（设计轮只出逐字块、六档零落笔）；两者孰为准请主 agent / 评审留意。
6. 〔知会〕**EN 面注**：块④改前句中的 `「decision + rationale」` 角括号为现档原文逐字（非本席笔误）——落笔按块④「改后」形态。

**修正轮（2026-10-09 · 评审 #32 处置 · eng-designer）**：评审表 12 条（#1–#11 收正 · #12 非缺陷）+ 父侧随正项逐号落地——设计档面收正明细 = 修正轮报告「号 → 改动」表；§2.2 / §2.7「执行者」列按面分述改（zh 正本三行 = eng-designer 笔 ∥ en 三行 = 实施轮 eng-coder——承 `docs/core/requirements/ENGINEERING-MODE-V2.md` §13.1 D1（`:602`）∥ §7.3 红线（`:365`，2026-09-26 裁定））；另 #8 直落（CN `docs/core/design/prompts/advisor-design.md` 槽位注）；§2 状态行零改（父侧口径）。注：§2.2 / §2.7 表及说明为就地收正（非 append——父侧随正项）。

**CN 面落笔轮（2026-10-10 · 执行者 = eng-designer · 承 §4「CN 面块 ①③⑤ = 设计者笔（另轮）」· 台账 #1159）**

书源 = §2.5 三块逐字 + §2.6 变更记录口径。

**落笔摘要（三块 · 逐字零字改）**：
- 块① → `docs/core/design/prompts/discipline-engineering.md:37`——「2. **设计**」之下新增 1 行（设计步子条首条；三空格缩进同族形）；原 `:37`「设计 = 对需求的检验」顺延 `:38`。
- 块③ → `docs/core/design/prompts/persona-eng-designer.md:62`——8 项 item 1 就地替换（Δ ±0）；改前整句零残留。
- 块⑤ → `docs/core/design/prompts/advisor-design.md:22`——评审标准新增第 9 条（插于第 8 条与「补充检查项」之间；原空行顺延）。

**变更记录（CN 侧 · 逐档一行——承 §2.6：三档无变更记录节（复核实读），留痕 = 本批档 §2；不新增档体结构）**：
- 2026-10-10 · `docs/core/design/prompts/discipline-engineering.md`：+1 行（块①——同类先例勘察设计前置子条）。
- 2026-10-10 · `docs/core/design/prompts/persona-eng-designer.md`：±0（块③——8 项 item 1 增「同类先例」一行）。
- 2026-10-10 · `docs/core/design/prompts/advisor-design.md`：+1 行（块⑤——评审标准第 9 条）。
- `docs/core/design/ADVISOR-CONVERGENCE.md`：设计轮已落（§2.6 首条）——本轮零触。

**逐字核验（UTF-8 感知 node 扫描——判据 = §2.5 围栏逐块 literal 全行等值）**：
- 块① `:37` ∥ 块③ `:62` ∥ 块⑤ `:22` 各整行 1 处命中、零字差（含 `∥` / `⇒` / 全角标点）；块③改前整句 0 命中。
- 零夹带快照核：落笔前三档快照 vs 落笔后逐档行级 diff——恰三处改动（`37` 插 1 行 ∥ `62` 替 1 行 ∥ `22` 插 1 行），其余行零变（split-行 188→189 ∥ 80→80 ∥ 75→76）。

**机检与回归读数（cwd = `thincoder/`）**：
- `node scripts/doc-check.mjs` ⇒ `OK(锚): 0 条悬空` ∧ `OK(行宽)`（三新行 165 ∥ 73 ∥ 144 字符 < 300）∧ 行数面差异 0 条 ⇒ **EXIT 0**。
- 附注：落笔前基线一度为 `悬空 1`（`docs/core/design/TOOLS.md:923`——他批在途复锚，mtime 2026-10-10 03:12，非本笔写域）；落笔后复跑 `悬空 0`。
- `node scripts/prompt-refs-check.mjs` ⇒ `提示词面 82 档 · 代码面 439 档 · 命中 0` · EXIT 0。
- 批件单元 13/13 ∥ 12/12 pass（`2026-10-03-advisor-convergence.test.mjs` ∥ `2026-10-03-design-token-echo.test.mjs`——均直读 CN `advisor-design.md`）。
- `thincoder-core` 套件：空跑绿（`test manifest is empty`——2026-09-28 全清）。全仓套件未跑（父侧收口唯一跑点）。

**零夹带**：本轮仅三档三处改动；他批在途面（三档既有 M 态改动——槽位注 ∥ D1 写权分述行 ∥ 500/800 行限）零触碰；未新增内容锚测试（2026-09-18 裁定）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审范围**：`thincoder/docs/core/design/ADVISOR-CONVERGENCE.md` · `docs/core/design/prompts/discipline-engineering.md` · `docs/core/design/prompts/persona-eng-designer.md` · `docs/core/design/prompts/advisor-design.md`（四档全读）。**限制**：无项目标准档声明（方法论合规按 Project Guide + 范围内纪律档自设口径判）；无文档地图（文档归属维度降级）；需求档 / 批档 / 兄弟设计档 / 运行期孪生提示词不在范围，相关断言标 unverified。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Doc hygiene | 🟡 | §12 契约行回归锚段（:415-417）残留失效表达：`test/model-specs.test.mjs` 锚后即「（已随 2026-09-28 测试树全清退场——档不在盘）（迁移期引文）」，同段 `test/reasoning-echo-live.test.mjs` 又标「（缝式行为面 · 拟新增）」（:417），段末重复同一清退句——已死锚点与「待新增」工作单混列。读者会把已死条目重新读成待办（D8 直指场景）；「迁移期引文」标记的定义出处不在范围（unverified）。 | 规范面只留现行有效回归锚；失效锚点与「拟新增」标记按 D8 移除（历史归变更记录）；若「迁移期引文」系被定义的合法标记，不与该锚并列失效句，集中一处注明。 |
| 2 | Doc state | 🟡 | §3.7 ① P1 行（:227）与 §3.1（:165）对同一提示词状态两说：P1「现形态」= `Max 5 rounds total.`、行内 as-of 标 2026-09-29，处置列写「**已落**——§3.1 逐字句（父侧落笔 · 2026-09-18）」；§3.1 亦称「**已落笔**（2026-09-18——四处现文逐字同此）」。两者只有一可为真——按表读不出该行当前状态（运行期档不在范围，unverified）。 | 收正为单义：现形态改列现行句（as-of 与落笔日对齐），或处置改「未落」并说明 2026-09-29 复扫为何仍见旧句。 |
| 3 | Requirements coverage | 🟡 | §14 声明「执行实现 = 设计评审提示词的对应维度（承 F2-6）」（:432）、A-AC15 要求「设计评审提示词对应维度在位」（:413），但范围内两处落点均无对应内容：设计评审提示词维度表止于 8 维 + 修订式表达补充项、全文无「同类先例」（advisor-design.md:13-23）；工程纪律档设计步无先例勘察 / 对齐优先 / 偏离理由义务（discipline-engineering.md:37-39，仅 persona-eng-designer.md:33 有「读既有实现与先例」）。运行期孪生档不在范围（unverified）——未落 / 在途 / 漏落，本档内不可判定。 | 在 §14 权威链行与 A-AC15 注明落点文件 + 节与落地状态（未落 / 在途 / 已落），使批档受影响文件表与验收可对账。 |
| 4 | Clarity | 🟡 | §7.1 落点句「**落点**：四个工程纪律档副本（两端产品源 + 中文权威镜像）」（:352）未列文件 / 节，且括注枚举与「四个」不齐（两端产品源 + 中文权威镜像 = 3）——同档 §3.3「落位清单写全」（:178）标准在此未落实，落点集合不可机判（D3 / D4）。 | 落点写全到「文件:节」（与 §3.3 同形态），并让「四个」与枚举行一一对上。 |
| 5 | Doc state | 🟡 | §13「机制演进沿革」行称反转史「已收为一句（§3.2 动机）」（:426），但 §3.2（:170-174）三条只述失败路径 / 零载体，无任何 cap 沿革句——死指针；§3.5 锚漂移登记（:204）只声明收正 §3.5 表内两行，未覆盖此第三处 §3.2 语义引述。 | 该行改指真正承载句所在节，或补沿革句（按 §13 自身口径亦可删行）；同时把漂移登记范围与剩余位点对齐。 |
| 6 | Methodology | 🟡 | 提示词锚防回退的机检形态两处说法不一：§12:393「提示词锚（"Do NOT look for new issues"、证据规则句等）由各端 prompts 内容断言防回退」，而范围内容纪律档禁止「读非测试档断言『某句在场 / 缺席』的测试……（`includes` / 逐字子串 / 查句子的正则）」（discipline-engineering.md:102）；A-AC12 / A-AC13（:410 / :411）又要求「提示词逐字在位」「逐字可核」。若按纪律档字面执行，§12:393 与两 AC 的逐字口径在实现前需改口径（合法机检形态 = 行为面 / 结构机检面）。 | 统一口径：写明提示词内容锚是否属「结构机检面」及核对手段，或把 §12:393 与两 AC 的「逐字」要求改为行为面 / 结构面可检形态。 |
| 7 | Doc state | 🔵 | 同一坐标两说：persona-eng-coder 自修上限句在 §3.5 行 3 标 `…:26`（:202，运行期 + 中文正本两处同标 :26），§3.7 P6 却标 `…:22`（:232，两处同标 :22）——行号只作 as-of（D4），但同档两表互斥属形态不统一（两文件均不在范围，无法判谁为真，unverified）。 | 统一 as-of 行号或改用「文档:节」形态，避免两表各自为说。 |
| 8 | Doc hygiene | 🔵 | advisor-design.md:1 槽位注释括号不闭合（`槽位:[特殊-advisor-design 消费方:[…` 只闭一层），与另两档同位注释（discipline-engineering.md:1 · persona-eng-designer.md:1）的平衡形态不一致。 | 补齐缺失的 `]`，与另两档对齐。 |
| 9 | Doc hygiene | 🔵 | A-AC8「guard 公式**六条件**齐备才推回」（:406）与所列公式对不上：代码块 `if` 为 5 个合取（:310-314），另注「顶层、guard 开启、非工程模式」3 条前置（:309）——「六」在 5 与 8 之间无从枚举；D3（计数与列表同改）未满足。 | 计数与枚举对齐（写全条件清单，或去掉数字改「全条件齐备」）。 |
| 10 | Doc hygiene | 🔵 | 变更记录逆序：末条为 2026-09-20（:482），排在 2026-09-15 条（:480）之后——其余各条均新→旧，此条为孤例。 | 移入对应位置，保持新→旧次序。 |
| 11 | Doc hygiene | 🔵 | §13「变更记录流水（历史折叠）→ 时序日志——归 git 历史」（:425）与文末逐批追加的变更记录节（:439 起）互抵不清——读者无法判定本档变更记录是否属被排除面（措辞两可）。 | 明确该行射程（排除迁移前流水，还是禁止本档承载批号流水），与现状对齐。 |
| 12 | Acceptance | 🔵 | 受影响文件行数标注核查（评审第 8 维）在范围内不可执行：本批受影响文件表 / 用例表 / 验收标准按 §3.6（:212）委派批档 `docs/batches/2026-09-18-advisor-face.md` §2，批档不在评审范围——行数标注 / 拆分规划不可核（评审限制，非缺陷）。 | 评审时随设计档一并提供受影响文件表（或注明所在批档与 as-of），使行数标注 / 拆分规划可核。 |

**计数**：🔴 0 · 🟡 6 · 🔵 6（共 12 条）
**VERDICT: pass**

## §4 用户批准（主 agent）

**状态行**：✅ 已批准（2026-10-09 · 全链自动授权下代签）

- **授权依据**：用户 2026-10-09 21:10「刚才说的哪些都点火开工吧」（全链自动——代点火 ∥ 代签 ∥ 派发尽在其中；沿 2026-10-07「也自动跑完吧」先例）。
- **代签三条件核**（逐条）：
  ① **评审 pass**：设计评审轮 1 VERDICT = pass（🔴0 ∥ 🟡6 ∥ 🔵6——§3 轮次 1）。
  ② **修正轮落地并核过**（11 号 ⇒ 已 Fixed）：#1 回归锚段收正 `ADVISOR-CONVERGENCE.md:419` ∥ #2 P1 行单义化 `:229` ∥ #3 §14/A-AC15 落点+状态 `:434/:416` ∥ #4 §7.1 四文件:节 `:354-355` ∥ #5 §3.1 沿革句 `:160/:428/:206` ∥ #6 机检口径统一 `:396/:413/:414` ∥ #7 坐标「文档:节」形 `:204` ∥ #8 `docs/core/design/prompts/advisor-design.md:1` 括号闭合 ∥ #9 A-AC8 计数 `:409` ∥ #10 变更记录序 `:467` ∥ #11 §13 射程 `:427`；第 12 项（父侧裁定）执行者列按面分述 = 批档 §2.2/§2.7 两表（父侧回读 ✓）。**父侧抽核**：`:416/:419/:434/:409/:204` + `advisor-design.md:1` + 批档两表 —— 逐点实读命中；doc-check EXIT 0（修正轮读数）。
  ③ **token 已签发**（评审回执；designId `15cc1df3…`——凭据值不落档）。
- **批准**：本批设计集（先例勘察——三段 + 六块）＝ 准予实施；**实施按面分述**：CN 面块 ①③⑤ = 设计者笔（另轮——待 #37 评审冻结窗解除后派）∥ EN 面块 ②④⑥ = 实施轮 eng-coder（token 已握）。
- **不做项（披露）**：四条范围外注（EN/特殊槽位族 5 处 ∥ §3.7 P2–P4 与 R3 as-of 漂移）⇒ 台账 #1163/#1164 在册。

## §5 实施记录（eng-coder）
**状态行**：实施完成（EN 三块（②④⑥）逐字在位 · 审计 clean · 评审 pass · 待父侧收口）



（实施轮 · initial · eng-coder · 2026-10-09——EN 运行面三块（批档 §2.5 块 ②④⑥）逐字落笔；CN 面块 ①③⑤ 按批另轮）

### 交付摘要
- **块②** → `thincoder-core/prompts/discipline-engineering.md:37`——「2. **Design**」步骤句（`:36`）之后、原「Design = a check on requirements…」子条（现 `:38`）之前，成设计步子条首条（三空格缩进、同族形）。Δ = +1 行（现 196 内容行）。
- **块④** → `thincoder-core/prompts/persona-eng-designer.md:62`——「Design doc 8 items」item 1 就地替换（8 项计数零变；items 2–8 原位）；改前整句零残留（全档 0 命中）。Δ = ±0（79 内容行）。
- **块⑥** → `thincoder-core/prompts/advisor-design.md:11`——item 8 句末（`:10`）与 `## Output Format`（`:12`）之间自成新行；原密排行（item 8 与该标题同行）按令拆为三行。Δ = +2 行（46 内容行——见决策表 #1）。
- **逐字核验（UTF-8 感知 node 扫描——批档 §2.5 围栏逐块 literal 比对）**：块② `:37` ∥ 块④ `:62` ∥ 块⑥ `:11` 各整行 1 处命中（含 `∥` U+2225 / `⇒` U+21D2 / `—` U+2014 与全角「」——零字差）；块④改前句 0 命中。
- **机检读数（仓根）**：`node scripts/doc-check.mjs` EXIT 0（`OK(锚): 0 条悬空` ∧ `OK(行宽)` ∧ 行数面差异 0 条）；`node scripts/prompt-refs-check.mjs` EXIT 0（提示词面 82 档 · 代码面 439 档 · 命中 0）；`thincoder-core` 套件绿（在盘实空——2026-09-28 全清）；目标件批件测试 13/13 ∥ 12/12 pass（`docs/batches/2026-10-03-advisor-convergence.test.mjs` ∥ `docs/batches/2026-10-03-design-token-echo.test.mjs`）。全仓套件未跑（父侧收口唯一跑点）。
- **零夹带**：本轮仅三档三处改动（块②④⑥，git diff 逐档实读）；`advisor-design.md` 盘上另有别批在途改动（item 8 档位数 >500/>800——非本笔）；CN 面（`docs/core/design/prompts/**`）与别批在途文件零触碰；未新增内容锚测试（2026-09-18 裁定）。

### 决策透明表
| # | 决定 | 理由 | 被否 |
|---|---|---|---|
| 1 | 块⑥ 落形 = 拆原密排行（item 8 / item 9 / `## Output Format` 三行；物理 +2） | 落形令「自成新行」（批档 `:111`）+ 新增行逐字 ⇒ 密排行必须裂开；标题随落行首 = 拆行必然结果（内部审计独立同读：非偏差） | 保持密排（块⑥ 无法自成新行）；标题并入 item 9 行内（同违「自成新行」） |
| 2 | 物理 Δ=+2 与批档 §2.7 记该档「+1 行」不符——披露、不擅改批档 | §2.7 非本席写域；.md 行豁免行数标注，以落笔实测为准 | 静默（读数与标注对不上，收口对账失真） |

### 审计与代码评审轮次与终态
- **内部审计（explore · 轮 1）= clean**：四类偏差（部分实现 ∥ 静默简化 ∥ 文档漂移 ∥ 清单外改动）零发现——逐块逐字 ∥ 锚位 ∥ 缩进同族 ∥ 改前句零残留 ∥ 越界扫描（新内容唯一性 · CN 零泄漏 · 编辑点邻域完整）全部复核通过；fix round 0。
- **内部代码评审（advisor · code · 轮 1）= pass**：🔴 0 · 🟡 1 · 🔵 3。🟡#1 = 协调项（CN 面落笔轮次写权两说——`thincoder-core/prompts/persona-eng-designer.md:14` 写域句 ∥ 批档 `:50` 派发；非本批缺陷、非必须修、不阻断）；🔵#2 = §2.7 验证行口径（doc-check 不覆盖 EN 面 ∥ core 套件实空）；🔵#3 = §2.7 Δ 标注；🔵#4 = 设计者预检四项观察（可选）。无必须修项 ⇒ **fix round 0；终态 = clean（converged）**。
- **处置（响应表）**：🟡#1 认账披露（解决面 = 单源收口，本批「不动其他节」）；🔵#2/#3 上报（批档 §2 非本席写域）；🔵#4 记录不改（可选面，另批）。

## §6 验证与收口（父代理）

**收口日期**：2026-10-10 · **终态**：✅ 已收口（本档随本段冻结）

- **交付面**：EN 三块（②④⑥）= 实施轮 eng-coder（§5 实录——逐字在位 ∥ 审计 clean ∥ 评审 pass）∥ CN 三块（①③⑤）= 设计者笔（另轮 · 2026-10-10：`docs/core/design/prompts/discipline-engineering.md:37` ∥ `persona-eng-designer.md:62` ∥ `advisor-design.md:22`——逐字零字改 ∥ 快照 diff 恰三处 ∥ 批档 §2:166-192 追记）。
- **验证读数（2026-10-10 复跑）**：`node scripts/doc-check.mjs` **EXIT 0**（锚 0 悬空 ∥ 行宽 0）；`node scripts/prompt-refs-check.mjs` **EXIT 0**（82 档 ∥ 命中 0）；批件单元 `2026-10-03-advisor-convergence.test.mjs` **13/13** ∥ `2026-10-03-design-token-echo.test.mjs` **12/12**；`thincoder-core` 套件空跑绿（manifest empty）。**全仓套件 = 波尾单跑**（父侧；本夜多批共一跑——结果随波尾提交记）。集成面 = 不受影响（三档 `test/` 零引用；`prompt-refs-check` 零命中）。
- **评审面**：§3 = 评审 #32（12 条：1–11 收正 ∥ 12 非缺陷）+ 修正轮（§2:164）；CN 轮 = §4 已批准范围内执行（无需另评——执行者归属经 `ENGINEERING-MODE-V2.md:365` 口径，另见下）。
- **处置**：§2.10 上抛 F7-1/F7-2 = 报主 agent（其笔 · 在案）∥ §1 模板占位 ⇒ 本档 §1 补注代填（见该段）∥ **写权两说并存**（`ENGINEERING-MODE-V2.md:365` CN 设计档面其笔归设计轮 ∥ 两面子代理人格档「提示词模板目录除外」）⇒ 台账 **#1171**（归批：三说复核）。
- **台账**：#1159 → **已核销**（evidence = 本段）。
- **冻结**：本档随本段收口冻结——后续（含新发现）走新批新档。
