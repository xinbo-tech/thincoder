# 2026-11-01 · claim-existing-debt
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-11-01 · 来源 = 用户 2026-11-01 02:38「开」（承接父侧「要不要开批做这两条」）；用户 02:36 追问「你这个清账轮开新帐的毛病也已经犯了很多次了…是提示词还有什么地方需要完善吗？」。
> 台账 = #1927（BATCH-RECORD · 归批）。前情 = 2026-11-01-prompt-unit-test-location（已收口 2026-11-01）—— 该批收口时父侧把 `#1924` 又开成 `#1926`，本批治这个。
## §1 讨论（主 agent）
**状态行**：已收口 2026-11-01
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

## 1. 讨论（主 agent）

### 1.1 一句话

**开批是为了做一条已经在池里的债 ⇒ 必须接手那一行；`batch create` 不许在「同板未决行存在」时静默开新行。**

### 1.2 病（父侧实测 · 同一形状五个实例）

| # | 实例 |
|---|---|
| 1–4 | `#1912` 建批时工具自动开了新行，而 **`#1900` / `#1909` / `#1910` / `#1911` 四条旧行**同面未决 ⇒ 事后并入批级行（`#1900` 的 evidence 逐字：「同一件事两套账」） |
| **5** | **今晚**：`#1924` 由父侧在 `#1923` 收口时登记；之后开 `#1926` 去执行它时**又开了一行** ⇒ `#1924` 只能按「重复行」撤回 |

**后果**：同一笔债两个持有者 —— 收口时两行都得处置，其中一行**永远闭不成「已核销」**，只能「已废弃」。**账上多一条撤销记录，等于多一笔要读的噪音。**

### 1.3 为什么提示词治不了（诊断）

**规则在场**：池里只有 1 条覆盖行 ⇒ 必须 `ledger:"#N"` 接手。**但它写在「台账」节**，而违规发生在**开批那一秒** —— 那一刻的心思是「我要做一件新事」，不是「这是不是我十天前写的欠条」。

**提示词里唯一的扫描义务**是「批点火前扫台账 —— **合并能合并的需求点**」：**它扫的是需求池，不是我自己写下的欠条。**

**根本**：**这条纪律没有兜底结构**。项目自己的判据（`docs/core/design/TESTING.md` §3.5 收口门立论）：*每条纪律必须能回答「靠哪个结构兜底」—— 没有结构的纪律 = 靠自觉，而自觉不会跑门。* **今晚的 `#1925` 我做对了，但那是因为刚被自己坑过（记忆），不是机制。**

### 1.4 两条修法（都要）

**① 结构兜底 —— `batch create` 省略 `ledger` 时不许静默开新行。**

**判据（父侧拟定，设计席可优化）**：省略 `ledger` ⇒ 若该 `board` 下存在未决行（`待讨论` / `待设计` / `在途` / `待核销`），**拒绝并列出候选**，要求显式二选一：
- `ledger:"#N"` —— 接手那一行（正常路径）；
- `newDebt: true`（或等价显式旗）—— 声明「这确实是一件新事」，并**在 §1 记一句为什么它不是已有那几条**。

**为什么用「显式旗」而不是「标题模糊匹配」**：模糊匹配有假阳（同一板下两条不同的事会被判重），**假阳会让机制被绕过或误伤**；显式旗零假阳，且**把决定逼到开批那一秒**。`board` 为空的行不参与（无从判面），但要**如实说明没判**。

**② 提示词一句（`thincoder-core/prompts/persona-engineering.md` 台账节）**：

> **开批是为了做一条已在池里的债 ⇒ 接手那一行，不开新行。** 新行只在池里没有这条债时开。
> 为什么：同一笔债两个持有者 ⇒ 收口时两行都得处置，其中一行永远闭不成「已核销」，只能撤回 —— 账上多一条撤销记录，就是多一笔要读的噪音。

**两句分工**：结构兜底管「开不出来」（机械）；提示词管「知道该接谁」（判断）。

### 1.5 边界（不做）

- **不改 `ledger` 工具**（`ledger add` 的查重纪律已在，本次病不在登记面）
- **不动收口 reanchor 逻辑**（那是「本批在途行」的处置，不是开批面）
- **不追溯修历史行**（`#1924` 已按撤回处理，不再翻）
- **不给 `batch create` 加「同标题相似度」匹配**（§1.4 已说明假阳代价）

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（修正轮 3：父侧裁的四件已逐条落，表见 §8 修正轮 3）

## 1. 四条判断（父侧要答的四题）

**① 判据落在哪一层 —— 落核内的 `ledgerBindBatch`（`thincoder-core/ledger-write-ops.mjs:211`），一处，不落工具层、不落 `ledgerAdd`。**

- 门要看的是**库里的行**（同面未决行 + 候选清单），这份事实只在台账侧；工具层要判就得自己开库，等于把写门搬到两个地方。
- 与 §6.1 写门同形：门住核内单源，消费侧一律动态 import `thincoder-core/ledger.mjs`（`batch-ledger-bind.mjs:108` 实读）⇒ 门不可绕过；`batch` 工具层只增**声明 + 透传**，零逻辑。`ledgerBindBatch` 的唯一调用点 = `batch-ledger-bind.mjs:133`，即 create 路径。
- **不落 `ledgerAdd`**：`ledger add` 是显式登记面——清账轮一轮登记两三条新发现是合法动作，落在 add 上会把合法登记判红；§1.5 也明写不改 `ledger` 工具。门只此一处。
- **判点坐标形**（修正轮 #5）：`ledgerBindBatch` 体内、`openLedger(cwd, { create: true })` **之前**；判前取集走读形开户（`create` 缺省 `false`，库档不在即返 `null`——`thincoder-core/ledger-db.mjs:258` 实读）⇒ 判与取集都不建库档。

**② 旗的名字与语义 —— 名保留 `newDebt`，形从布尔改成「非空字符串 = 一句理由」。**

- 布尔零成本 ⇒ 恒填 `true` 即绕过，判据不痛（这正是父侧第 2 问的自答条件）。改成一句理由：决定被逼到开批那一秒，且这句话**有具名读面**。
- 理由落**本笔新开行的 `evidence`**（前缀 `新事理由：`），不落 §1：批档可整体删除，只活在 §1 里的理由跟着消失；台账行比档活得久（同判例 = `docs/core/design/LEDGER.md` §1.1「行 `evidence` 一行指针」）。
- **读面与时点**（修正轮 #4）：读者 = 本批收口那一笔的主 agent；时点 = 本批收口 ⇒ 回执引一行 `新事理由（#<id>）：<理由原文>`，只引不写、行改写语义零动。残余明示：一句废话照样能过，本设计不 claim 更强。
- 与既有参数的关系：`ledger:"#N"` 在时本节**零判**（接手路径零回归）；`board` 决定判哪一面；`prev` / `date` / `topic` / `source` 零涉。`newDebt` 与 `ledger` 同携 ⇒ 拒（语义互斥）；空串 / 全空白 ⇒ 按未给判。

**③ 拒绝文本 —— 逐行列候选 · 英文 · 三件可读性（修正轮 #3 · #9）。**

逐字（单源 = `docs/core/design/LEDGER.md` §6.3）：

```text
batch: <n> unsettled row(s) already exist on this face — create refuses to open a new ledger row silently (face = <board ∥ no board>). Either take one over with ledger:"#<id>", or declare a genuinely new debt with newDebt:"<one line: why it is not one of these>". Candidates:
  #<id> <status> <title>
… <M> more not listed — read the rest with the ledger tool (action query, board:"<board>").
Nothing was written.
```

- **排序即判据**：`id` 升序 = 最老欠条优先（与 `docs/core/design/LEDGER.md` §3.7 出口面 `aged` 同轴）。
- **上限**：至多 10 行；超出出计数句 `… <M> more not listed`。
- **自取命令**：拒文尾附 `ledger(query)` + `board` 过滤，截断后仍可自助。

**④ 先例 —— 照 `topic-style fail-closed` 体例。** 既有形 = 缺 `source` 即拒、拒文点名字段 + 给修法 + 收尾 `Nothing was written.`（`thincoder-core/agent-tools/batch-ledger-bind.mjs:91`）。新拒文同形同前缀（`batch:`）、同样点名 + 给两条出路 + 收尾同一句。

## 2. 本批覆盖的条目

| # | 条目 | 落点（单源） |
|---|---|---|
| R1 | **结构兜底**：`batch` create 省略 `ledger` ∧ 同面（本笔 `board`；未给 ⇒ `board IS NULL` 面）存在未决行 ⇒ 必须 `ledger:"#N"` 接手 ∥ `newDebt:"<理由>"` 声明新事，两者皆无 ⇒ 拒并列候选；**描述面**（`batch.mjs` 两参描述 ∥ `thincoder-core/tool-docs/batch.md` 首行 ∥ `parseLedgerNo` 拒文尾句）同改条件形 | `docs/core/design/LEDGER.md` §6.3（机制 · 集成设计 · 逐字文案）· AC-M2-37（同档 §8）· 用例 T125–T132 |
| R2 | **提示词一句**：开批是为了做一条已在池里的债 ⇒ 接手那一行，不开新行 | `docs/core/design/PROMPT-SYSTEM.md` §6.59（设计面）· D-PS52（同档 §7）· 条文落 `thincoder-core/prompts/persona-engineering.md`（实施轮） |

**本批不做**（§1.5 边界照抄不重述）：不改 `ledger` 工具 · 不动收口 reanchor 的行改写 · 不追溯历史行 · 不做标题相似度匹配。补一条本席自定边界：**不给 `ledger add` 加同面判**（理由见判断①）。

## 3. 机制设计（要点，判据与逐字文案单源在 `docs/core/design/LEDGER.md` §6.3）

- **面 = 本笔 `board`**（等值口径复用同档 §7.1 `board` 过滤）；未给 ⇒ 「无板面」`board IS NULL`。**不是「面空 ⇒ 不判」**：每次 create 必判一面，面名写进回执。
- **判点** = `ledgerBindBatch` 体内 · 写形开户之前；取集走读形开户（不建库档）。
- **零写二件**（可断言）：无行写入 · 无批档写入（拒笔在事务开户之前返回——`ledger-write-ops.mjs:215` / `:223` 都在写形开户之后）。**不 claim「库档不新建」**：要拒须同面已有未决行 ⇒ 库档必已在盘（`ledger-db.mjs:258`），放行案又照常建库 ⇒ 两形不可分辨。**不在零写之内**：`docs/batches/` 空目录可能已被 `batch-ledger-bind.mjs:117` 的 `mkdirSync` 建出（如实记）。
- **候选行集** = `ledgerQuery` 取未决四态全行，核内按面与状态筛（零新 SQL、零新导出）；`id` 升序 · 至多 10 行 · 超出给计数句 + 自取命令。
- **回执增量**（成功路径）：面名 + 本面未决数 + **他面未决读数**——免得把「本面无候选」读成「池子空」；`n = 0` 也打（父侧裁定；需求档 AC-M2-37 ⑤ 同句）。
- **描述面**（修正轮 #1 · 强度收正 #N3）：`thincoder-core/agent-tools/batch.mjs:306` 现文无条件（`Omit it and create opens a NEW ledger row in the same call`），门一落即与 §6.3 相反 ⇒ **四处**描述同改条件形，逐字单源 = §6.3；验收 = T130（四处**整串等值**：`batch.mjs` 两处各整串 ∥ `thincoder-core/tool-docs/batch.md` 首两段分别整串 ∥ `parseLedgerNo` 以 `<raw>` 槽代入后整串 `===`；不另设片段锁）。

## 4. 受影响文件（含档位结论）

| 文件 | 动作 | 面 |
|---|---|---|
| `docs/core/design/LEDGER.md` | §6.3 重写（判点坐标 · 零写二件 · 候选三件 · 理由读面 · 描述面逐字 · 集成六列表 · 先例/勘察两行）· §8 AC-M2-37 · 用例 T125–T132 · §9 边界半句 | 设计档（本席·已落） |
| `docs/core/design/PROMPT-SYSTEM.md` | §6.59（集成设计改指单源 · 拒文语种收正）· §7 D-PS52 | 设计档（本席·已落） |
| `thincoder-core/ledger-write-ops.mjs` | `ledgerBindBatch` 门体（读形取集 + 同面查 + 拒 + 理由入 `evidence` + 回执键） | 产品代码 |
| `thincoder-core/agent-tools/batch-ledger-bind.mjs` | 透传 `newDebt` · 回执串带增量行 · **`parseLedgerNo` 拒文尾句改条件形（`:55`）** | 产品代码 |
| `thincoder-core/agent-tools/batch.mjs` | 参数声明 `newDebt`（`:304` 邻位）· **收正 `ledger` 描述为条件形（`:306`）** | 产品代码 |
| `thincoder-core/agent-tools/batch-lifecycle.mjs` | 收口回执串两路各追加理由引文段（`:265` ∥ `:294`）· `reanchorOnClose`（`:344`）取本批行、随返回形带回理由 | 产品代码 |
| `thincoder-core/agent-tools/batch-closeout.mjs` | 新增 `newDebtReasonReceiptLine`（`reanchorReceiptLine` 邻位 `:122`——纯格式化、零库访问） | 产品代码 |
| `thincoder-core/tool-docs/batch.md` | **收正首行 create 括注为条件形（两段 · 段间一空行）** · 补 `newDebt` 一条 | 产品代码（模型可见文本） |
| `thincoder-core/prompts/persona-engineering.md` | §6.59 I1 两行逐字 | 产品代码（提示词面） |
| `test/RTM.md` | 13-1 题设补前提「同面无未决行」· 新增 13-4 行 | 集成索引 |
| `docs/batches/2026-11-01-claim-existing-debt.test.mjs` | 新建（T125–T132 · 一次性 · 收口即删） | 单测档 |

**档位结论**（修正轮 #8 · 修正轮 2 补两档）：本批无一档越 500 顾问线 ⇒ 无拆分义务。

- 实测读数（`node` 读行数）：`batch.mjs` 357 · `ledger-write-ops.mjs` 299 · `batch-ledger-bind.mjs` 167 · `thincoder-core/tool-docs/batch.md` 55 · `test/RTM.md` 304 · `batch-lifecycle.mjs` 355 · `batch-closeout.mjs` 137（后两档 = 修正轮 2 新增）。
- `thincoder-core/prompts/persona-engineering.md` 490 **+2 ⇒ 492**——距顾问线 8 行，下次动该档须重测。

## 5. 验收对照（回指本批条目）

| 条目 | 判据（可机检） |
|---|---|
| R1 | `node --test docs/batches/2026-11-01-claim-existing-debt.test.mjs` ⇒ T125–T132 全绿（含 T130 描述面 · T131 截断与序 · T132 理由读面）；外加 `node --check` 三个改动的 `.mjs` 档。判据本体 = `docs/core/design/LEDGER.md` §8 AC-M2-37 |
| R2 | 提示词落笔断言：全档扫词面锚 `takes over that row` ≥1，且插入处两行与 `docs/core/design/PROMPT-SYSTEM.md` §6.59 围栏块逐行 `===`；`doc_check(mode:"gate")` 首行 `PASS`。判据本体 = 同档 §6.59 A1–A5 |

**未做**：全量套件不属本批（父侧收口门）；集成面 = RTM 13-1 改 ∥ 13-4 增（用例落 `test/integration/batch-ledger-bind.test.mjs`，父侧收口跑）。

## 6. 关键决策

| # | 决策 | 理由 |
|---|---|---|
| G1 | 门落 `ledgerBindBatch`，不落 `ledgerAdd` ∥ 工具层 | 库事实在台账侧；与 §6.1 写门同形 = 门住核内单源不可绕；`ledger add` 是显式登记面（清账轮多条登记合法） |
| G2 | `newDebt` = 非空字符串，不取布尔 | 布尔恒填即绕过；一句理由把决定逼到开批那一秒 |
| G3 | 理由落行 `evidence`（前缀 `新事理由：`），不落 §1 | 批档可整体删除；台账行活得比档久 |
| G4 | 未给 `board` ⇒ 判「无板面」，不静默放行 | 父侧价值条②；「不判」与「判了空」在回执上长得一样，必须可分辨 |
| G5 | 回执附「他面未决 N 条」读数 | 免得把「本面无候选」读成「池子空」 |
| G6 | 不做标题相似度匹配 | 假阳 ⇒ 机制被绕过 ∥ 误伤（§1.4） |
| G7 | 判点前移到**写形开户之前**（读形取集） | 拒笔须在事务开户之前返回（`BEGIN IMMEDIATE` = `thincoder-core/ledger-write-ops.mjs:215`、行 INSERT = `:223`，两者都在写形开户之后）⇒「无行写入」由结构挣得、不靠判后回滚；「库档不新建」不入零写（理由 = `docs/core/design/LEDGER.md` §6.3） |
| G8 | 候选至多 10 行 + `id` 升序 + 自取命令 | 「读者一眼见该接哪行」是两句分工的立足点；无上限时面内 20+ 行即被候选淹掉（评审 #3） |
| G9 | 理由读面 = 本批收口回执引一行（只引不写） | 评审 #4：没有读者与时点的「可核对」是句乐观断言；挂既有清单同一段 = 零新清单、零写 |
| G10 | 描述面算本次落笔（三处条件形逐字） | 模型每次调 `batch create` 读的就是那几句；门与被读契约相反等于机制写在没人看的地方（评审 #1 唯一 🔴） |

## 7. 上抛项（父侧处置）

1. 〔**已落 · 父侧本轮补齐**〕`docs/core/requirements/ENGINEERING-MODE-V2-SPEC-LEDGER.md:98` **AC-M2-37** 现载 ①–⑦（本席修正轮 2 实读该行）：① 拒 + 逐行候选 · ② 放行二径（`ledger:"#N"` ∥ `newDebt:"<一句理由>"`）· ③ 同携拒 · ④ 无板面必判并写明 · ⑤ 无同面未决行 ⇒ 门不拒、行照开、回执多一行（面名 + 0 行 + 他面读数）· ⑥ **描述面同步**（四处条件形）· ⑦ **新事理由读面**（收口回执引一行）。用例列 = T125–T132。逐条与 `docs/core/design/LEDGER.md` §6.3 同句（⑥ ↔ 描述面围栏块 · ⑦ ↔ 理由读面段）。同文件 `:96` / `:97` = AC-M2-34 / AC-M2-35，无 AC-M2-36（本席未改该档，写域非本席）。
2. 〔**知会**〕拒文取英文（与 `batch` 既有拒文同语域）；上轮「与既有拒文同语（中文）」的理由已删。
3. 〔**知会**〕`test/RTM.md` 不在本席申报写域，13-1 改 ∥ 13-4 增留给实施轮；号已先定（13-4）。

## 8. 修正轮（评审轮次 1 · 13 条逐条处置 · 改哪档:哪节）

🔴 1 · 🟡 9 · 🔵 3 全接；未采纳的建议见末行。

| # | 处置 | 落点 |
|---|---|---|
| 🔴1 | 描述面收正为条件形 + 加描述文本验收 T130 | `docs/core/design/LEDGER.md` §6.3「模型可见描述面」（四段围栏逐字）· 同档 §8 AC-M2-37「描述面」句 · 同档 §8 用例 T130 · 本节 §4 两行动作改写 · 本节 §6 G10 |
| 🟡2 | 保留回执增量（`n = 0` 也打）；「门不拒 / 行照开 / 其余逐字等价」写死 | `docs/core/design/LEDGER.md` §6.3「回执增量」段 · 同档 §8 AC-M2-37 · 用例 T125 · 本节 §7 项 1 按现盘重读改写 |
| 🟡3 | 候选三件：排序即判据（`id` 升序 = 最老欠条优先，同 §3.7 `aged` 轴）· 上限 10 行 + 计数句 · 自取命令 | `docs/core/design/LEDGER.md` §6.3「候选行集与次序」· 同节拒文围栏 · 同档 §8 用例 T131 |
| 🟡4 | 理由读面与时点：行 `evidence` 前缀 `新事理由：` ⇒ 本批收口回执引一行（只引不写）；残余明示 | `docs/core/design/LEDGER.md` §6.3「理由的读面与时点」· 同档 §8 AC-M2-37 · 用例 T132 · 本节 §1 判断② |
| 🟡5 | 判点改坐标形；零写窄化为三件（「库档不新建」由读形取集挣得） | `docs/core/design/LEDGER.md` §6.3「判点」「零写 = 三件」· 同档 §8 AC-M2-37 · 本节 §1 判断① 末条 · 本节 §6 G7 |
| 🟡6 | 集成设计搬进机制单源档、六列形 + delta 结论；提示词档改指向 | `docs/core/design/LEDGER.md` §6.3「集成测试设计」· `docs/core/design/PROMPT-SYSTEM.md` §6.59「集成测试设计」一行 |
| 🟡7 | 单测夹具口径（临时项目树 + `_setLedgerDirForTest` + `ledger.mjs` 动态 import + `try/finally` 双复原） | `docs/core/design/LEDGER.md` §8 用例表「夹具口径（本案八例共用）」 |
| 🟡8 | 档位结论一行（无一档越 500；`thincoder-core/prompts/persona-engineering.md` 492 距线 8 行、下次动它须重测） | 本节 §4「档位结论」 |
| 🟡9 | 拒文改英文（同 `batch` 既有语域）；上抛项里的假理由删、换真理由 | `docs/core/design/LEDGER.md` §6.3 拒文与回执三段围栏 · 同档 §8 用例 T126 / T130 · `docs/core/design/PROMPT-SYSTEM.md` §6.59 上抛项 1 · 本节 §7 项 2 |
| 🟡10 | §2 卫生：重复状态行与模板占位删净，只留一行 | 本档 §2 状态行 |
| 🔵11 | §6.3 补先例行（先例 / 对齐 / 偏离）+ 勘察证据行 | `docs/core/design/LEDGER.md` §6.3 末两节 |
| 🔵12 | §6.3 边界与 §9 补「接手不改行标题 ⇒ 指错行是可见的错账」 | `docs/core/design/LEDGER.md` §6.3 边界 · 同档 §9「开批同面判不做」行 |
| 🔵13 | 无动作（6b 分支核对通过，读数已在评审表内） | — |

**拒文逐字（英文 · 单源 = `docs/core/design/LEDGER.md` §6.3）**

```text
batch: <n> unsettled row(s) already exist on this face — create refuses to open a new ledger row silently (face = <board ∥ no board>). Either take one over with ledger:"#<id>", or declare a genuinely new debt with newDebt:"<one line: why it is not one of these>". Candidates:
  #<id> <status> <title>
… <M> more not listed — read the rest with the ledger tool (action query, board:"<board>").
Nothing was written.
```

同携拒（两旗并用）：

```text
batch: newDebt and ledger are mutually exclusive — take over a debt already in the pool with ledger:"#N"; declare a new debt with newDebt:"<reason>". Both together is ambiguous. Nothing was written.
```

**未采纳的评审建议**：无（13 条全落；#4 按父侧倾向取「点名读面」方案而非「残余入边界」——成本 = 一个 `evidence` 前缀约定 + 收口回执一行引文，零写零新清单）。

### 修正轮 2（评审轮次 2 · 六条逐条处置 · 改哪档:哪行）

🔴 1 · 🟡 3 · 🔵 2 全接。上轮 13 条已由评审轮次 2 逐条验收全闭（Fixed 12 · Accepted 1）。

| # | 处置 | 落点 |
|---|---|---|
| 🔴N1 | 收口回执引文补落点三件（数据 ∥ 格式器 ∥ 拼装）+ 受影响表补两档 | `docs/core/design/LEDGER.md` §6.3「落点（坐标）」段 · 本档 §4 两行（`batch-lifecycle.mjs` ∥ `batch-closeout.mjs`） |
| 🟡N2 | 零写三件 ⇒ 二件；「库档不新建」改明示不 claim（拒案必有库、放行案必建库 ⇒ 两形不可分辨）；判点理由改为「拒在事务开户之前返回」 | `docs/core/design/LEDGER.md` §6.3 判点理由段 ∥ 零写二件段 ∥ 「不 claim」段 · 同档 §8 AC-M2-37 · 用例 T126 · 夹具口径 · 本档 §3 ∥ §6 G7 |
| 🟡N3 | T130 四处统一整串等值（`parseLedgerNo` 是模板串——以 `<raw>` 槽代入后整串等值，强度已写进 AC） | `docs/core/design/LEDGER.md` §8 AC-M2-37 描述面句 · 用例 T130 |
| 🟡N4 | 上抛项 1 按现盘重写（AC-M2-37 现载 ①–⑦ · 用例 T125–T132） | 本档 §7 项 1 |
| 🔵N5 | 无板面自取句变体（不带 `board`）+ T129 夹具改 11 条以触发截断 | `docs/core/design/LEDGER.md` §6.3 计数句段 · 用例 T129 |
| 🔵N6 | 用例号漂移收正 T125–T129 ⇒ T125–T132 | `docs/core/design/PROMPT-SYSTEM.md` 本节受影响表 |

**N1 的形选择**：数据取在既有收口单源 `reanchorOnClose`（该处已动态 import `ledger.mjs`——零新增读取面），格式器另立纯函数 — 不把引文拼装塞进 `reanchorReceiptLine`（该函数的入参形 = `ledgerReanchorBatch` 返回形，混入第二种数据即破 §6.2 的回执单源）。

**未采纳的评审建议**：无。

### 修正轮 3（父侧裁定 · 四件逐条落 · 改哪档:哪行）

撞墙实测（父侧自跑）：§6.3 描述面围栏第三段 510 字符 > 文档门段落限 300；`thincoder-core/tool-docs/batch.md` 是正文面（非提示词面，围栏内文字不豁免）⇒ 照抄必红，实施席 §5.5 第 1 条据此扣住。

| # | 处置 | 落点 |
|---|---|---|
| ① | 围栏第三段拆两段：段间一空行，不删字、不换词；拆点 = `at creation;` 之后（前段 = 工具是什么 + `create` 做什么，后段 = 省略 `ledger` 的条件形 + 两条出路）。实测两段 = **261 ∥ 248** 字符（node 读行长） | `docs/core/design/LEDGER.md` §6.3 描述面围栏第三段（`:1105` ∥ `:1107`）+ 段前标签改「第 1–3 行」（`:1102`）+ 段后「第三段拆两段的原因」一行（`:1116`） |
| ② | AC 描述面句跟改：`batch.mjs` 两处各整串 `===` 其段 ∥ `thincoder-core/tool-docs/batch.md` 首两段**分别**整串 `===` 第三段的两半 ∥ `parseLedgerNo` 第四段以 `<raw>` 代入后整串 `===` | 同档 §8 AC-M2-37 描述面句（`:1309`） |
| ③ | T130 第三处改两段形（首两段分别 `===` 围栏第三段的两半；段间空行计入，整串比对非子串） | 同档 §8 用例 T130（`:1419`） |
| ④ | 旧无条件句负向锁整条删（整串等值已令旧句不可能存在；再加正则锁是重复，且 `[^.]*` 跨度覆盖新条件句 ⇒ 假红）；AC 补一句「描述面由这几处整串等值守，不另设片段锁」 | 同档 §8 用例 T130（`:1419` 删）· AC-M2-37（`:1309` 补句） |

**接缝选点与理由**：断在 `台账 header line at creation;` 之后——前段收在「工具是什么 + `create` 做什么（含两个可选参数填档头）」，后段起于「省略 `ledger` 的条件形与两条出路」。父侧建议的 `(face = …).` 断点在本段不存在（那是拒文围栏的形，不是描述面第三段），故另选；两段 261 ∥ 248，均 ≤300。

**实施轮待办**（本席只落设计面）：`thincoder-core/tool-docs/batch.md` 首行 ⇒ 首两段（段间一空行，整串照围栏第三段两半）；T130 第三处断言改两段形、负向锁删净。§5.5 第 1∥2 条据此解扣。

**需求档核对（知会 · 本席无写权）**：`docs/core/requirements/ENGINEERING-MODE-V2-SPEC-LEDGER.md:98` AC-M2-37 ⑥ 与用例列读作「四处同步为条件形 + 整串等值」，两段形与之同义（两半各整串等值 ⇒ 该处整串等值）⇒ 需求档零改。

**未采纳**：无。

## §3 设计评审（评审子代理）
**状态行**：评审通过（轮次 4 · 上轮 19 条全闭（Fixed 18 · Accepted 1）· 新增 🔴 0 · VERDICT: pass）



### 轮次 1（评审子代理）

**设计评审 · 第 1 轮**（对象 = 批档 §2 设计 + `docs/core/design/LEDGER.md` §6.3 / §8 AC-M2-37 / §9 + `docs/core/design/PROMPT-SYSTEM.md` §6.59 / D-PS52）

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Document ownership | 🔴 | 设计留下「同一机制两处说法」：`thincoder-core/agent-tools/batch.mjs:306` 逐字 `Omit it and create opens a NEW ledger row in the same call`（无条件形），而 `docs/core/design/LEDGER.md:1002` 定的是条件形（省略 `ledger` ∧ 同面有未决行 ⇒ 拒）。受影响面只写加东西：本档 `:105` = 「参数声明 `newDebt`（`:304` 邻位）」、`:106` = 「工具描述补 `newDebt` 一条」——没有一行是收正既有句。落笔后模型每次调 `batch create` 读到的仍是旧无条件描述，与新门相反 | 两行动作改写为「参数声明 `newDebt` · 收正 `ledger` 描述为条件形（同面无未决行 ⇒ 开新行；否则拒 ∥ 二选一并列候选）」· `thincoder-core/tool-docs/batch.md:1` 同步（现文同样只说 `optional ledger / board`）；验收加一条描述文本断言（与 A1 同形：词面锚 + 整行等值） |
| 2 | Requirements coverage | 🟡 | 成功路径回执增量的射程与需求档 AC 相抵：`docs/core/design/LEDGER.md:1033` 与 `:1196`（AC-M2-37「回执携面名 + 面内未决数 + 他面未决读数」）· 用例 `:1296`（T125「回执「本面未决 0 行」」）都是无条件打；而 `docs/core/requirements/ENGINEERING-MODE-V2-SPEC-LEDGER.md:98` 的 AC-M2-37 ⑤ 逐字为 `无同面未决行时行为与既有逐字等价`。另：本档 `:135` 逐字 `该档在盘现止于 AC-M2-36（本席本轮 grep 实读）`——盘面实读该档有 AC-M2-34（`:96`）· AC-M2-35（`:97`）· AC-M2-37（`:98`），无 AC-M2-36，上抛项 1 的读数与现盘不符 | 二者择一定稿后写死：或把回执增量收窄到 `n > 0` 半幅（`n = 0` 面逐字等价），或把 ⑤ 改写成「门不拒、行照开；回执多一行面名 + 面内未决 0」· 上抛项 1 按现盘重读改写（AC 已在册 ⇒ 该条改「已落，需核 ⑤ 措辞」） |
| 3 | Acceptance criteria | 🟡 | 父侧第 3 问（候选多了会不会淹掉「该接哪行」）只答了形、没答量：`docs/core/design/LEDGER.md:1030` 逐字 `候选逐行形 =  #<id> <status> <title>`（行集序 = `id` 升序）——零上限、零排序理由、零兜底指路；而 `docs/core/design/PROMPT-SYSTEM.md:5237` 的分工句逐字 `拒文自带候选清单，读者一眼见该接哪行`，其立足点正是「候选表可读」。本仓一批 14 行是实测量级（`docs/core/design/LEDGER.md:288`），面内 20+ 行时拒文即被候选淹掉 | 定三件写进 §6.3：① 上限（>N 行截断 + 明写「余 M 行未列」）；② 排序即判据（`id` 升序 = 最老欠条优先，与 §3.7 出口面 `aged` 同轴——现在是隐式序、无人知道它可当推荐）；③ 拒文尾附一句自取命令（`ledger(query)` + `board` 过滤），截断后仍可自助 |
| 4 | Requirements coverage | 🟡 | 父侧第 2 问的后半（「还能再紧吗」）答了「不取布尔」，没答「填一句废话怎么办」的结构面：`docs/core/design/LEDGER.md:1022` 逐字 `这句话下一读者可核对`——没有读者、没有时点。理由落新行 `evidence`（`:1020`），而读行的既有面是 `#<id> <出口态> <title>`（`docs/core/design/LEDGER.md:458` 逐字 `逐行 "#<id> <出口态> <title>"`），`evidence` 不在其中 ⇒ 核对仍靠自觉，正是本批 §1.3 判为不成立的那一类 | 点名唯一读面与时点（例：批收口回执对本批 `newDebt` 生的行加一句理由引文；或 §3.7 出口清单该行带「新事理由」列）；若接受残余，把「残余 = 一句无人核对的话，本批不治」写进 §6.3 边界，不留成一句乐观断言 |
| 5 | Feasibility | 🟡 | 「零写」与门的位置对不上盘面：`docs/core/design/LEDGER.md:1026` 逐字 `只读判在 "BEGIN" 之前（判过才开户）`，但 `thincoder-core/ledger-write-ops.mjs:212` 逐字 `const db = openLedger(cwd, { create: true, boundary })` 先于 `:215` `db.exec("BEGIN IMMEDIATE")`（`create: true` 惰性建库档）；`thincoder-core/agent-tools/batch-ledger-bind.mjs:117` `mkdirSync(dirname(abs), { recursive: true })` 又先于 `:133` 的 `ledgerBindBatch` 调用。而 `docs/core/design/LEDGER.md:1196` 写 `零写 = 档不建、账不动` | 把判点写成坐标形（`ledgerBindBatch` 体内 · `openLedger` 之后 · `BEGIN IMMEDIATE` 之前），并把「零写」窄化为可断言三件：无行写入 · 无批档写入 · 库档不新建（`docs/batches/` 目录与惰性库档二项的既存属实测事实，与其让断言悬着，不如写进 AC） |
| 6 | Acceptance criteria | 🟡 | 集成测试设计有、但不成表且住错档：`docs/core/design/PROMPT-SYSTEM.md:5298`–`:5302` 给了改 13-1 · 增 13-4 · 13-2/13-3 不变（RTM 实读 `test/RTM.md:165`–`:167` 确在盘、13-4 号空着），delta 三问答了；但每行不点「评的组件交互」「业务可观察入口」「回指需求」，而本档先例是六列表（`docs/core/design/LEDGER.md:698`）。且本仓先例明写集成用例设计住机制的单源设计档（`docs/core/design/LEDGER.md:738` 逐字 `集成用例设计写在该机制的单源设计档里，RTM 只留编号与回指`），本节却住提示词档，§6.3 里一份没有 | 在 `docs/core/design/LEDGER.md` §6.3 补集成节，按 §3.8 六列形：13-1 改 ∥ 13-4 增两行各给交互链（`batch` create → `batch-ledger-bind` → `ledgerBindBatch` → `ledgerQuery`）· 断言（拒文列该行 / 理由入 `evidence`）· 入口（主 agent `batch` create）· 回指（AC-M2-37）；`docs/core/design/PROMPT-SYSTEM.md` §6.59 那三行改指向它 |
| 7 | Clarity | 🟡 | 单测档夹具未定形，而 create 路径先卡项目根：T125–T129（`docs/core/design/LEDGER.md:1296`–`:1300`）只说靶向单跑，未说夹具；实读 `thincoder-core/agent-tools/batch-ledger-bind.mjs:110`–`:112`（`if (!root) throw …`）⇒ create 需要可推导项目根（带 `PROJECT-MANIFEST.json` 的目录），台账库要注入临时目录。缺这一行，五个用例在 setup 就红，且库目录不复原会污染同进程后续用例 | 用例节加一行夹具口径：临时项目树（`PROJECT-MANIFEST.json`）+ `_setLedgerDirForTest` 注入 + `try/finally` 双复原 + `ledger.mjs` 动态 import（与 `docs/core/design/LEDGER.md:777`–`:781` 同形） |
| 8 | Affected-file tier | 🟡 | 受影响表无行数、无档位结论：本档 `:111` 的「档位结论」讲的是写域 / 席，不是行数档位；`docs/core/design/LEDGER.md:349` 那张行数单源表不覆盖本次三档。本席实测（`read` 尾行读数）：`thincoder-core/agent-tools/batch.mjs` 357 · `thincoder-core/ledger-write-ops.mjs` 299 · `thincoder-core/agent-tools/batch-ledger-bind.mjs` 167 · `thincoder-core/tool-docs/batch.md` 55 · `thincoder-core/prompts/persona-engineering.md` 490（+2 ⇒ 492）· `test/RTM.md` 304 ⇒ 无一档越 500 / 800，无拆分义务 | 把这一行结论写进 §4（一句话：本批无档越 500 顾问线，无拆分计划），并注明 `thincoder-core/prompts/persona-engineering.md` 落笔后 492，距顾问线 8 行——下一次动该档要重测 |
| 9 | Requirements coverage | 🟡 | 拒文语种的理由与盘面相反：本档 `:136` 逐字 `〔知会〕拒文取中文（与 "batch" 既有拒文同语）`，实读既有拒文是英文——`thincoder-core/agent-tools/batch-ledger-bind.mjs:91` 逐字 `batch: create requires source — the record's origin line (来源 = …)`（同形 `:87` / `:94` / `:111` / `:123`），工具描述面亦英文（`thincoder-core/tool-docs/batch.md:1`）。理由假 ⇒ 模型可见文案的语域决策没有依据 | 二选一后写死：要么拒文改英文（与工具面同语域），要么保留中文并把理由换成真理由（例：中文便于用户直读拒文），同步改 §6.3 逐字与 T126 断言；上抛项 2 的「同语」句删 |
| 10 | Doc hygiene | 🟡 | §2 状态行两次出现且模板占位未消：本档 `:57` 与 `:60` 各一行 `**状态行**：设计完成`，`:58` 仍是 `<§2 模板占位：本批条目（覆盖） / 设计档落点 / …>` | 删一行状态行、占位行删除（内容已在 §1–§7），并确认工具 `status` 写的是保留下来的那一行 |
| 11 | Methodology compliance | 🔵 | 机制档本节未带本档通行的两行：`docs/core/design/LEDGER.md` §3.3–§3.9 各节均有「先例行（对齐 ∥ 偏离）」+「勘察证据行」，§6.3（`:998`–`:1037`）只有「边界」与「指针」。先例与勘察证据现分别只在本档 `:80`（实现坐标 `batch-ledger-bind.mjs:91`）与 `docs/core/design/PROMPT-SYSTEM.md:5291`–`:5296`（含 `publicRepos = []` 结论） | `docs/core/design/LEDGER.md` §6.3 补两行：先例 = 本档 §6.1 写门体例 + 缺 `source` 即拒的 `batch` 既有体例（含批号 / 节坐标）；勘察证据 = 已读公共源 + `publicRepos = []` 结论（照 §3.7 形） |
| 12 | Clarity | 🔵 | 门的另一条出路无同类检查，设计只说「不判」：`docs/core/design/LEDGER.md:1035` 逐字 `不判 "ledger" 已给的接手笔`；实读 `thincoder-core/ledger-write-ops.mjs:228`–`:243` 对 `待讨论` / `待设计` 行无条件接管 ⇒ 被拒一方只要随便指一条同面未决行的号，门即放行，而新批档与那行主题无关 | 边界已声明即不必加判；建议在 §6.3 边界那一行补半句「接手不改行标题 ⇒ 指错行是可见的错账（不是静默）」，让后来者知道这个出口的代价落在哪 |
| 13 | Methodology compliance | 🔵 | 6b 分支出处核对（通过，记读数）：主场景在本档 `:19` 有五实例 + `#1900` 的 evidence 逐字；「无板面」支（`docs/core/design/LEDGER.md:1004`）无具体实例，依据是 `board` 为可选参数（`thincoder-core/agent-tools/batch.mjs:308`–`:310` 逐字 `omitted, the row is a tech_todo`）——产品真实支持的输入形，非无场景分支 | 无动作；「无板面」支若后续有实例，把实例补进 §6.3 面那一行 |

**计数**：🔴 1 · 🟡 9 · 🔵 3（共 13）。

**四个重点的判定**（点数读数，逐条一行）：

- ① 门不可绕过 = **成立**：`ledgerBindBatch` 是 create 路径唯一建档建行入口（`thincoder-core/ledger-write-ops.mjs:211`），行 INSERT 只在其事务内 `:223`，唯一调用点 `thincoder-core/agent-tools/batch-ledger-bind.mjs:133`，`thincoder-core/agent-tools/batch.mjs:344` 是唯一 create 分派。
- ① 的残余 = 落点精度未定（#5：`openLedger` / `mkdirSync` 都在门前）。
- ② 布尔改一句理由 = 比布尔紧；残余「一句废话」设计已如实认（`docs/core/design/PROMPT-SYSTEM.md:5270`），缺的是核对的结构面（#4）。
- ③ 候选淹掉 = **未答**（#3）：只给逐行形与 `id` 升序，无上限无理由。
- ④ 两句分工 = **清楚**（`docs/core/design/PROMPT-SYSTEM.md:5237` 逐字），但其立足点「读者一眼见该接哪行」依赖 ③。

VERDICT: changes-required

### 轮次 2（评审子代理）

**设计评审 · 第 2 轮（修正轮逐条验收）**

对象 = `docs/batches/2026-11-01-claim-existing-debt.md` §2（含 §8 处置表）· `docs/core/design/LEDGER.md` §6.3 / §8 AC-M2-37 / 用例 T125–T132 / §9 · `docs/core/design/PROMPT-SYSTEM.md` §6.59 / D-PS52。

**上轮 13 条逐条验收（本轮实读坐标）**

| 上轮# | 状态 | 坐标 |
|---|---|---|
| 🔴1 描述面 | Fixed | `docs/core/design/LEDGER.md:1075`–`:1099` 四处围栏 + AC `:1292` 描述面句 + T130 `:1399`；本档 `:118` / `:119` 动作改「收正为条件形」 |
| 🟡2 回执增量射程 | Fixed | 需求档 `docs/core/requirements/ENGINEERING-MODE-V2-SPEC-LEDGER.md:98` ⑤ 已写「门不拒、行照开；回执多一行」；`docs/core/design/LEDGER.md:1073` 同句；本档 `:152` 上抛项按现盘重写 |
| 🟡3 候选上限与序 | Fixed | `docs/core/design/LEDGER.md:1047` 排序即判据 · `:1048` 至多 10 行 · 围栏 `:1057` 计数句 + 自取命令 · T131 `:1400` |
| 🟡4 理由读面与时点 | Fixed | `docs/core/design/LEDGER.md:1032`–`:1043`（读者 = 收口主 agent · 只引不写 · 残余明示）· AC `:1292` · T132 `:1401` · G9 本档 `:147` |
| 🟡5 判点与零写 | Fixed | `docs/core/design/LEDGER.md:1008` 判点坐标 · `:1010` 读形开户（实读 `thincoder-core/ledger-db.mjs:258` 逐字 `if (!existsSync(file) && !create) return null` ⇒ 「读形不建库档」有实读支撑）· `:1012` 零写三件 |
| 🟡6 集成设计落位 | Fixed | `docs/core/design/LEDGER.md:1103`–`:1111` 六列 + delta 结论；`docs/core/design/PROMPT-SYSTEM.md:5298` 改指向单源 |
| 🟡7 单测夹具 | Fixed | `docs/core/design/LEDGER.md:1392` 夹具口径（临时项目树 + `PROJECT-MANIFEST.json` + `_setLedgerDirForTest` + 动态 import + `try/finally` 双复原） |
| 🟡8 档位结论 | Fixed | 本档 `:124` 一行结论 + 六档读数（与评审核对一致） |
| 🟡9 拒文语种与理由 | Fixed | 拒文/回执/描述面全英文（`docs/core/design/LEDGER.md:1050` · `:1055` · `:1064` · `:1070` · `:1080` · `:1092` · `:1098`）；本档 `:153` 与 `docs/core/design/PROMPT-SYSTEM.md:5317` 改为英文 + 实读依据 |
| 🟡10 §2 卫生 | Fixed | 本档 `:57` 单行状态行，模板占位已消 |
| 🔵11 先例/勘察两行 | Fixed | `docs/core/design/LEDGER.md:1113`–`:1121`（含 `publicRepos` = `[]` 结论） |
| 🔵12 接手出口代价半句 | Fixed | `docs/core/design/LEDGER.md:1127` + §9 `:1433` |
| 🔵13 6b 分支核对 | Accepted | 无动作，理由成立（上轮即为「通过、记读数」，无缺陷可修） |

**本轮新发现（修正引入）**

| # | Severity | 坐标 | 问题 |
|---|---|---|---|
| N1 | 🔴 | `docs/core/design/LEDGER.md:1034` 逐字 `收口回执对本批行（ledgerBatchRows——任意状态）中 evidence 含 新事理由： 者，引一行`；本档 `:112`–`:122` 受影响文件表 | 收口回执引文无落点文件：收口回执由 `thincoder-core/agent-tools/batch-lifecycle.mjs` 组装（实读 `:265` / `:294` 回执串 = gate + designTokens + reanchor 段，`reanchorReceiptLine` 来自 `thincoder-core/agent-tools/batch-closeout.mjs`），两档均不在受影响表内；`docs/core/design/LEDGER.md` §6.3 其余各件皆给坐标（`:1008` / `:1095` / `:1077`），唯此件零坐标，而 AC `:1292` 与 T132 `:1401` 要对它断言 |
| N2 | 🟡 | `docs/core/design/LEDGER.md:1012` 逐字 `③ 台账库档不新建（夹具从「无库」起，拒后库档仍不在盘）` + T126 `:1395` | 零写 ③ 断言自空：「从无库起」则无未决行可列 ⇒ 门不拒；要拒就须库里已有 2 条行 ⇒ 库档已在盘 ⇒ 「库档不新建」恒真。二者不能同拍 |
| N3 | 🟡 | `docs/core/design/LEDGER.md:1292` 逐字 `= 条件形逐字，与 §6.3 围栏块相等` vs T130 `:1399` | AC 声称四处围栏「相等」，T130 仅对 `thincoder-core/tool-docs/batch.md` 首行做整行 `===`；`batch.mjs` 两参描述走正则/子串、`parseLedgerNo` 走子串 ⇒ 三处可漂而 T130 仍绿 |
| N4 | 🟡 | `docs/core/design/LEDGER.md:1292` 描述面句 vs 需求档 `docs/core/requirements/ENGINEERING-MODE-V2-SPEC-LEDGER.md:98` | 描述面（🔴1 的修法本体）无需求侧痕迹：需求 AC-M2-37 无描述面条目，用例列止于 T125–T129；本档 `:152` 上抛项 1 标「已落 · 待核」但未点这条 |
| N5 | 🔵 | `docs/core/design/LEDGER.md:1057` 逐字 `… <M> more not listed — read the rest with the ledger tool (action query, board:"<board>").` + T129 `:1398` | 无板面支无自取变体：面 = `no board` 时该句里的 `board:"<board>"` 无值可填（`docs/core/design/LEDGER.md` §7.1 board 过滤 = 原值等值） |
| N6 | 🔵 | `docs/core/design/PROMPT-SYSTEM.md:5306` 逐字 `| docs/core/design/LEDGER.md | §6.3 + AC-M2-37 + T125–T129 + §9 边界 |` | 用例号漂移：设计侧已 T125–T132 |

**四个重点（本轮读数）**：① 门不可绕过 = 成立且落点已精确（`docs/core/design/LEDGER.md:1008` 判点坐标；`thincoder-core/ledger-db.mjs:258` 读形实读支撑）。② 一句理由 = 有读面、残余已明示。③ 候选淹掉 = 已答（上限 10 + 序即判据 + 自取命令），只余无板面变体（N5）。④ 两句分工 = 清楚，且其立足点已由 ③ 的实现支撑（`docs/core/design/PROMPT-SYSTEM.md:5237`）。

**计数**：上轮 13 条全闭（Fixed 12 · Accepted 1）· 本轮新 🔴1 · 🟡3 · 🔵2（共 6）。

VERDICT: changes-required

### 轮次 3（评审子代理）

**设计评审 · 第 3 轮（修正轮 2 验收 · 只验轮次 2 的 19 条 = 上轮 13 + N1–N6）**

对象 = `docs/batches/2026-11-01-claim-existing-debt.md` §2（含 §3 ∥ §4 ∥ §7 ∥ §8 处置表）· `docs/core/design/LEDGER.md` §6.3 ∥ §8 AC-M2-37 ∥ 用例 T125–T132 ∥ §9 · `docs/core/design/PROMPT-SYSTEM.md` §6.59 ∥ §7 D-PS52。

**上轮 13 条（复验现盘 · 全部仍成立）**

| # | Orig# | File | Severity | Status | Notes |
|---|-------|------|----------|--------|-------|
| 1 | 🔴1 描述面 | `docs/core/design/LEDGER.md` | 🔴 | Fixed | 四处围栏 `:1093` ∥ `:1099` ∥ `:1105` ∥ `:1111` 在盘；本档 `:114` ∥ `:117` ∥ `:118` 动作句在盘 |
| 2 | 🟡2 回执增量射程 | `docs/core/design/LEDGER.md` | 🟡 | Fixed | `:1086` 「门不拒、行照开 … 回执只多这一行」；需求档 `:98` ⑤ 同句 |
| 3 | 🟡3 候选限与序 | `docs/core/design/LEDGER.md` | 🟡 | Fixed | `:1058` 排序即判据 · `:1059` 至多 10 行 · `:1068` 计数句 + 自取命令 · T131 `:1416` |
| 4 | 🟡4 理由读面与时点 | `docs/core/design/LEDGER.md` | 🟡 | Fixed | `:1036`-`:1054`（读者 ∥ 时点 ∥ 引文 ∥ 残余明示）；T132 `:1417` |
| 5 | 🟡5 判点与零写 | `docs/core/design/LEDGER.md` | 🟡 | Fixed | `:1008` 判点坐标 · `:1010` 读形开户 · `:1014` 零写二件 · `:1016` 不 claim 段 · `:1018` 目录如实记 |
| 6 | 🟡6 集成设计落位 | `docs/core/design/LEDGER.md` | 🟡 | Fixed | `:1118`-`:1124` 六列 + delta 结论；提示词档 `:5298` 改指向 |
| 7 | 🟡7 单测夹具 | `docs/core/design/LEDGER.md` | 🟡 | Fixed | `:1405`-`:1408` 夹具口径 + 库档起态两类 |
| 8 | 🟡8 档位结论 | `docs/batches/2026-11-01-claim-existing-debt.md` | 🟡 | Fixed | `:126` 结论行 + `:128` 七档读数 + `:129` 距线 8 行 |
| 9 | 🟡9 拒文语种与理由 | `docs/core/design/LEDGER.md` | 🟡 | Fixed | 拒文 ∥ 回执 ∥ 描述面全英文；`docs/core/design/PROMPT-SYSTEM.md:5317` 英文 + 实读依据 |
| 10 | 🟡10 §2 卫生 | `docs/batches/2026-11-01-claim-existing-debt.md` | 🟡 | Fixed | `:57` 单行状态行，模板占位已消 |
| 11 | 🔵11 先例/勘察两行 | `docs/core/design/LEDGER.md` | 🔵 | Fixed | `:1126`-`:1134`（含 `publicRepos` = `[]` 结论） |
| 12 | 🔵12 接手出口代价半句 | `docs/core/design/LEDGER.md` | 🔵 | Fixed | `:1140` + §9 `:1449` |
| 13 | 🔵13 6b 分支核对 | — | 🔵 | Accepted | 无动作（上轮即「通过、记读数」） |

**轮次 2 的六条（N1–N6）**

| # | Orig# | File | Severity | Status | Notes |
|---|-------|------|----------|--------|-------|
| 14 | N1 收口回执落点 | `docs/core/design/LEDGER.md` | 🔴 | Fixed | 四件凑齐：数据 `:1046`（`reanchorOnClose` = `thincoder-core/agent-tools/batch-lifecycle.mjs:344`）：344 `async function reanchorOnClose(abs, boundary) {`，同一处动态 import `:346` ⇒ 加取本批行可行；格式器 `:1047`（`:122` `export function reanchorReceiptLine(result) {`，该档 137 行 = 本档 `:128` 读数一致）；拼装 `:1048`（`batch-lifecycle.mjs:265` ∥ `:294` 两路回执串实读 = gate ∥ designTokens ∥ reanchor 三段相接）；降级 `:1049`（同 `failed` 降级，实读 catch 在 `:350`-`:353`）。受影响表两行在盘 = 本档 `:119` ∥ `:120` ⇒ T132 有码可测 |
| 15 | N2 零写自空 | `docs/core/design/LEDGER.md` | 🟡 | Fixed | `:1014` `**零写 = 二件（可断言）**：① 无台账行写入` + `:1016` 不 claim 段（理由 = 无档即空账 ⇒ 门必放行）+ `:1408` 夹具库档起态（拒案在盘 ∥ 放行案可空）+ T126 `:1411` 二件。三处自洽。**残留见下表 R1** |
| 16 | N3 T130 强度 | `docs/core/design/LEDGER.md` | 🟡 | Fixed | AC `:1305` 四处整串等值 + T130 `:1415` 四处 `===`；可执行性已核：`thincoder-core/agent-tools/batch-ledger-bind.mjs:55` 唯一插值槽 = `${JSON.stringify(raw)}` ⇒ `<raw>` 槽代入后整串等值成立 |
| 17 | N4 需求侧痕迹 | `docs/core/requirements/ENGINEERING-MODE-V2-SPEC-LEDGER.md` | 🟡 | Fixed | `:98` 现载 ①–⑦（⑥ 描述面四处条件形 ∥ ⑦ 收口回执引一行）+ 用例列 T125–T132；本档 `:157` 上抛项 1 的读数与盘面一致 |
| 18 | N5 无板面自取句 | `docs/core/design/LEDGER.md` | 🔵 | Fixed | `:1072` 无板面变体（不带 `board`）；T129 `:1414` 11 条触发截断 + 自取句不带 `board` |
| 19 | N6 用例号漂移 | `docs/core/design/PROMPT-SYSTEM.md` | 🔵 | Fixed | `:5306` 现为 T125–T132 |

**本轮新发现（修正残留 · 一条）**

| # | Orig# | File | Severity | Status | Notes |
|---|-------|------|----------|--------|-------|
| R1 | N2 | `docs/batches/2026-11-01-claim-existing-debt.md` | 🟡 | New | `:114` 仍写 `§6.3 重写（判点坐标 · 零写三件 · 候选三件` —— 与本档 `:105` `**零写二件**（可断言）` 及 `docs/core/design/LEDGER.md:1014` `**零写 = 二件（可断言）**：① 无台账行写入` 相反（N2 的收正未传到受影响表该行）。建议把该括注改为「零写二件」。单源已定（§6.3）⇒ 按 doc-state 矛盾报 🟡，不阻落笔 |

**四个重点（本轮读数）**：① 门不可绕过 = 成立（判点 `docs/core/design/LEDGER.md:1008`；读形开户 `:1010`）。② 一句理由 = 有读面、时点、残余明示（`:1036`-`:1054`）。③ 候选淹掉 = 已答（上限 10 ∥ 序即判据 ∥ 自取命令 ∥ 无板面变体）。④ 两句分工 = 清楚（`docs/core/design/PROMPT-SYSTEM.md:5237`），立足点已由 ③ 落地支撑。

**计数**：上轮 19 条全闭（Fixed 18 · Accepted 1）· 本轮新 🔴 0 · 🟡 1 · 🔵 0。

VERDICT: pass

### 轮次 4（评审子代理）

**设计评审 · 第 3 轮（修正轮 2 验收 · 只验第 2 轮 19 条：上轮 13 条 + N1–N6）**

对象 = `docs/batches/2026-11-01-claim-existing-debt.md` §2 · `docs/core/design/LEDGER.md` §6.3 / §8 AC-M2-37 / T125–T132 / §9 · `docs/core/design/PROMPT-SYSTEM.md` §6.59 / D-PS52。本轮全部文件重读（无沿用快照）。

| # | Orig# | File | Severity | Status | Notes（本轮实读证据） |
|---|-------|------|----------|--------|------|
| 1 | 🔴1 描述面 | `docs/core/design/LEDGER.md` | 🔴 | Fixed | 四处条件形围栏在盘（`:1093` / `:1099` / `:1105` / `:1111`）；`docs/batches/2026-11-01-claim-existing-debt.md:117`–`:118` 动作面写「改条件形」 |
| 2 | 🟡2 回执增量射程 | `docs/core/design/LEDGER.md` | 🟡 | Fixed | `:1086` `n = 0` 半幅逐字：门不拒、行照开、回执只多这一行；需求档 `:98` ⑤ 同句 |
| 3 | 🟡3 候选限与序 | `docs/core/design/LEDGER.md` | 🟡 | Fixed | `:1058` 排序即判据 · `:1059` 至多 10 行 · `:1068` 计数句 + 自取命令 · T131 `:1416` |
| 4 | 🟡4 理由读面与时点 | `docs/core/design/LEDGER.md` | 🟡 | Fixed | `:1036`–`:1054` 读者 / 时点 / 引文形 / 残余明示；T132 `:1417` |
| 5 | 🟡5 判点与零写 | `docs/core/design/LEDGER.md` | 🟡 | Fixed | `:1008` 判点坐标 · `:1010` 读形开户 · `:1014` 零写二件 · `:1016` 不 claim · `:1018` 空目录如实记 |
| 6 | 🟡6 集成设计落位 | `docs/core/design/LEDGER.md` | 🟡 | Fixed | `:1118`–`:1124` 六列 + delta；`docs/core/design/PROMPT-SYSTEM.md:5298` 改指单源 |
| 7 | 🟡7 单测夹具 | `docs/core/design/LEDGER.md` | 🟡 | Fixed | `:1405`–`:1408` 夹具口径 + 库档起态两类 |
| 8 | 🟡8 档位结论 | `docs/batches/2026-11-01-claim-existing-debt.md` | 🟡 | Fixed | `:126` 结论 + `:128` 七档读数 + `:129` 距线 8 行 |
| 9 | 🟡9 拒文语种 / 理由 | `docs/core/design/LEDGER.md` | 🟡 | Fixed | 拒 / 回执 / 描述全英文；`docs/core/design/PROMPT-SYSTEM.md:5317` 真理由（实读坐标） |
| 10 | 🟡10 §2 卫生 | `docs/batches/2026-11-01-claim-existing-debt.md` | 🟡 | Fixed | `:57` 单行状态行，模板占位已清 |
| 11 | 🔵11 先例 / 勘察 | `docs/core/design/LEDGER.md` | 🔵 | Fixed | `:1126`–`:1134` 先例 / 对齐 / 偏离 + 勘察证据行（含 `publicRepos` = `[]`） |
| 12 | 🔵12 接管出口代价 | `docs/core/design/LEDGER.md` | 🔵 | Fixed | `:1140` 与 §9 `:1449` 同句 |
| 13 | 🔵13 6b 分支核对 | — | 🔵 | Accepted | 无动作（读数已在评审表内）——第 2 轮已接受，本轮不再重开 |
| 14 | N1 收口回执落点 | `docs/core/design/LEDGER.md` | 🔴 | Fixed | 四件凑得起来：数据 `:1046` → 实读 `thincoder-core/agent-tools/batch-lifecycle.mjs:344` 的 `async function reanchorOnClose(abs, boundary) {`（同处 `:346` 已动态 import `../ledger.mjs`）· 格式器 `:1047` → 实读 `thincoder-core/agent-tools/batch-closeout.mjs:122` 的 `export function reanchorReceiptLine(result) {`（该档尾 137 行，与 `:128` 读数一致）· 拼装 `:1048` → 实读 `thincoder-core/agent-tools/batch-lifecycle.mjs:265` / `:294` 两路尾段均以 `gateReceiptLine` + `designTokensReceiptLine` + `reanchorReceiptLine` 收尾 · 降级 `:1049` 同该函数 catch。受影响表 `:119` / `:120` 在盘 ⇒ T132 有可测对象 |
| 15 | N2 零写自空 | `docs/core/design/LEDGER.md` | 🟡 | Fixed | `:1014` `**零写 = 二件（可断言）**：① 无台账行写入（库内行数 ∥ 逐列字节等值）· ② 无批档写入（批档目录无新档）。` + `:1016` 不 claim 段 + `:1408` 库档起态两类 + T126 `:1411`；本档 `:105` 与 `:114` 两处均「零写二件」，**上轮 §2:114 「零写三件」已无残留** |
| 16 | N3 T130 强度 | `docs/core/design/LEDGER.md` | 🟡 | Fixed | AC `:1305` 四处整串等值 + T130 `:1415`；可执行性实读 `thincoder-core/agent-tools/batch-ledger-bind.mjs:55`：唯一插值槽 = `${JSON.stringify(raw)}` ⇒ 以 `<raw>` 槽代入 `JSON.stringify(<传入字面>)` 后整串 `===` 成立 |
| 17 | N4 需求侧痕迹 | `docs/core/requirements/ENGINEERING-MODE-V2-SPEC-LEDGER.md` | 🟡 | Fixed | 实读 `:98` 现载 ①–⑦（⑥ 描述面四处 · ⑦ 理由读面）+ 用例列 T125–T132；`:96` / `:97` = AC-M2-34 / AC-M2-35、无 AC-M2-36 ⇒ 本档 `:157` 读数与现盘一致 |
| 18 | N5 无板面自取句 | `docs/core/design/LEDGER.md` | 🔵 | Fixed | `:1072` 无板面变体，自取句不带 `board`；T129 `:1414` 未决 11 条 ⇒ 截断 |
| 19 | N6 用例号漂移 | `docs/core/design/PROMPT-SYSTEM.md` | 🔵 | Fixed | 实读 `:5306` = §6.3 + AC-M2-37 + T125–T132 + §9 边界 |

**焦点读数**：① R1（上轮 `docs/batches/2026-11-01-claim-existing-debt.md:114` 仍「零写三件」）已闭——本轮实读该行为「§6.3 重写（判点坐标 · 零写二件 · 候选三件 · 理由读面 …）」，与 `docs/core/design/LEDGER.md:1014` 及本档 `:105` 同档；② 上轮 19 条无回退（逐条证据见上表）；③ N1 四件在盘可凑、N3 强形可执行。

**计数**：上轮 19 条全闭（Fixed 18 · Accepted 1）· 新增 🔴 0 · 🟡 0 · 🔵 0 ⇒ 无未闭 🔴。

VERDICT: pass

## §4 用户批准（主 agent）

## 4. 用户批准（主 agent）

**状态行**：已批准 2026-11-01

### 4.1 批准依据（用户原话 · 逐字）

**「开」**（2026-11-01 02:38）—— 回应父侧那句「**要不要开批做这两条？你说。**」

**这一句 = 本批的整条链 go-ahead**（设计 → 评审 → 实施 → 收口）。父侧在它之前已把两件事摊开落字，用户看过才说的「开」：

1. **结构兜底**：`batch create` 省略 `ledger` 且同面有未决行 ⇒ 不静默开新行，列候选 + 要求显式二选一；
2. **提示词一句**：开批是为做一条已在池里的债 ⇒ 接手那一行。

### 4.2 缘起（用户 02:36 的追问，逐字）

**「你这个清账轮开新帐的毛病也已经犯了很多次了，我记得之前处理过这个问题，这次你咋又犯了呢？是提示词还有什么地方需要完善吗？」**

**父侧当时的实证（台账查得）**：同一形状五个实例 —— `#1912` 建批时自动开了新行而 `#1900` / `#1909` / `#1910` / `#1911` 四条旧行同面未决（事后并入）；**今晚** `#1924` 由父侧在 `#1923` 收口时登记，开 `#1926` 执行它时又开了一行 ⇒ `#1924` 只能按重复撤回。

### 4.3 批准范围

结构兜底（`batch create` 同面判门）+ 提示词一句。**不改 `ledger` 工具**、**不动收口重锚逻辑**、**不追溯历史行**、**不加标题相似度匹配**（假阳会让机制被绕过）。

### 4.4 明确不在本批

- 清那 253（后实测 239 / 后续重测 144+182）处死测试坐标 —— **另批 `#1925`，本批期间并行在跑**。
- `batch create` 之后档头补填机制的重判（`#1937`）。
- AC-M2-36 三链断层（`#1935`，本批前既有）。

## §5 实施记录（eng-coder）

**状态行**：实施完成 2026-11-01

## 5.1 一句话

R1（结构兜底：`batch` create 省略 `ledger` 的同面判门 + `newDebt` + 理由读面）与 R2（提示词两行）已落并全绿；
描述面第三处（`thincoder-core/tool-docs/batch.md` 首行）与 T130 第三处断言按父侧裁定「先扣住」**未落**——等设计席把围栏段改成两段形。

## 5.2 逐档改动（改哪档:行 + 改了什么）

| # | 档 | 落点 | 改了什么 |
|---|---|---|---|
| 1 | `thincoder-core/ledger-write-ops.mjs` | `:22` · `:196`–`:252` · `:256`–`:331` | 引入 `PENDING_STATUSES`；新增同面判四件（`NEW_DEBT_EVIDENCE_PREFIX` · `SAME_FACE_LIST_LIMIT` · `faceOf` / `onSameFace` · `sameFaceRefusal` · `sameFaceScan`）；`ledgerBindBatch` 改为 **async** 并加门：参数面互斥先判（`ledger` 与 `newDebt` 同携 ⇒ 拒），`ledger` 在场 ⇒ 本节零判，否则读形取集 → 同面未决 > 0 且无理由 ⇒ 写形开户**之前**拒；新行 INSERT 增 `evidence` 列（声明新事时带 `新事理由：<理由>`）；返回形增 `sameFace` 读数 |
| 2 | `thincoder-core/agent-tools/batch-ledger-bind.mjs` | `:55` · `:60`–`:78` · `:112`–`:113` · `:149`–`:152` · `:175` | `parseLedgerNo` 拒文尾句改条件形（`<raw>` 槽仍唯一 = `${JSON.stringify(raw)}`）；新增 `normalizeNewDebt`（trim；空 / 全空白 ⇒ 未给）与 `sameFaceReceiptLine`（成功路径回执增量行）；透传 `newDebt`；create 的 JSDoc 同步条件形 |
| 3 | `thincoder-core/agent-tools/batch.mjs` | `:304`–`:311` | `ledger` 描述由旧**无条件**句收正为条件形（整串照 §6.3 围栏第一段）；新增 `newDebt` 参数声明（整串照第二段） |
| 4 | `thincoder-core/agent-tools/batch-lifecycle.mjs` | `:43` · `:265` · `:294` · `:344`–`:362` | `reanchorOnClose` 在同一处动态 import 内取本批行（`ledgerBatchRows`），筛出带前缀者随返回形带回（取不到 ⇒ 空集，不否决收口）；收口**两路**回执串各追加 `${newDebtReasonReceiptLine(reanchor)}`（位次 = 既有三段之后） |
| 5 | `thincoder-core/agent-tools/batch-closeout.mjs` | `:137`–`:171` | 新增 `newDebtReasonOf`（取文：`新事理由：` 之后至首个 `｜` 或串尾；无前缀 / 空 ⇒ `null`）与 `newDebtReasonReceiptLine`（纯格式化、零库访问、不改入参） |
| 6 | `thincoder-core/prompts/persona-engineering.md` | `:432`–`:433` | 两行逐字落（§6.59 I1 围栏块）：位置 = `:431`「**The same item** …」之后、`:434`「**One row = one settlement unit** …」之前；行宽 137 ∥ 202 字符 |
| 7 | `test/RTM.md` | `:160` · `:161` · `:165` · `:168` | 故事 13：目的行补「同面有未决行时新建须声明新事」；节注回指补 `docs/core/design/LEDGER.md` 机制单源 + **三态改四态**（D3 计数随动）；13-1 题设补前提「同面无未决行」；新增 13-4 行 |
| 8 | `test/integration/batch-ledger-bind.test.mjs` | `:38`–`:52` · `:105`–`:120` | 新增 13-4 用例（拒 ∥ 放行两臂 + 理由入 `evidence` + 本批收口回执引该理由一行）；夹具补 `closeCtxOf` / `fillChain` |
| 9 | `test/integration/batch-live-batch-lock.test.mjs` | `:84`–`:85` | **越出设计 §4 表**：12-3 夹具的第二本 `batch create`（同无板面已有在途行）在本门下落必被拒 ⇒ 补 `newDebt`，否则既有集成用例红 |
| 10 | `docs/batches/2026-11-01-claim-existing-debt.test.mjs` | 全档（新建） | 本批单测档 T125–T132（收口即删） |

**未动的档**：设计档 / 需求档 / `docs/core/prompts` / 别批档 / `ledger` 工具的入参与语义（`newDebt` 是 `batch` 工具参数，不是台账工具参数）。
**临时件**：诊断期写过两个探针件（临时目录下一个 Markdown 档、一个 `.mjs`），两次均已删除，现盘不在。

## 5.3 拒文与回执（逐字 · 已与设计档 §6.3 围栏块逐字比对一致）

同面拒（`ledger-write-ops.mjs` `sameFaceRefusal`；`<n>` = 本面未决数，候选至多 10 行，`id` 升序）：

```text
batch: <n> unsettled row(s) already exist on this face — create refuses to open a new ledger row silently (face = <board ∥ no board>). Either take one over with ledger:"#<id>", or declare a genuinely new debt with newDebt:"<one line: why it is not one of these>". Candidates:
  #<id> <status> <title>
… <M> more not listed — read the rest with the ledger tool (action query, board:"<board>").
Nothing was written.
```

无板面时计数句不带 `board`：`… <M> more not listed — read the rest with the ledger tool (action query).`

同携拒（单行）：`batch: newDebt and ledger are mutually exclusive — take over a debt already in the pool with ledger:"#N"; declare a new debt with newDebt:"<reason>". Both together is ambiguous. Nothing was written.`

成功回执增量（`batch-ledger-bind.mjs` `sameFaceReceiptLine`，独占一行）：

`same-face check: face = <board ∥ no board> · unsettled on this face = <n> (n = 0 ⇒ nothing to take over; n > 0 ⇒ declared a new debt: <reason>) · unsettled on other faces = <m> (a reading; never blocks).`

收口理由引文（`batch-closeout.mjs` `newDebtReasonReceiptLine`，一行一理由，换行起头）：`  新事理由（#<id>）：<理由原文>`

描述面三处（第四处按裁定扣住）已整串照 §6.3：`batch.mjs:306`（`ledger`）· `batch.mjs:310`（`newDebt`）· `batch-ledger-bind.mjs:55`（`parseLedgerNo` 尾句，`<raw>` 槽代 `JSON.stringify(<字面>)`）。

## 5.4 读数（机检 · 可复跑）

| 项 | 命令 | 结果 |
|---|---|---|
| 本批八例 | `node --test docs/batches/2026-11-01-claim-existing-debt.test.mjs` | **8/8 绿**（T125 · T126 · T127 · T128 · T129 · T130 · T131 · T132） |
| 集成 13 面（含新增 13-4） | `node --test test/integration/batch-ledger-bind.test.mjs` | **4/4 绿**（13-1 ∥ 13-2 ∥ 13-3 零回归 + 13-4） |
| 锁面回归（本门触达 create） | `node --test test/integration/batch-live-batch-lock.test.mjs` | **6/6 绿**（12-3 补 `newDebt` 后） |
| 收口面 / 重锚 / 核销 / 跨项目读 | 同形 `node --test` 四档 | **16/16 绿**（收口回执加零增量段不破既有断言） |
| 语法 | `node --check` × 六个 `.mjs`（本批改动五档 + 单测档） | 全 `OK` |
| 文档门 | `doc_check(mode:"gate")`，docs = `thincoder-core/prompts/persona-engineering.md` ∥ `test/RTM.md` | `DOC-CHECK GATE: PASS`（2 档全清） |

`doc_check: PASS (2 docs)`

行数读数（read 口径）：

| 档 | 行数 |
|---|---|
| `thincoder-core/ledger-write-ops.mjs` | 369 |
| `thincoder-core/agent-tools/batch.mjs` | 361 |
| `thincoder-core/agent-tools/batch-lifecycle.mjs` | 365 |
| `thincoder-core/agent-tools/batch-ledger-bind.mjs` | 184 |
| `thincoder-core/agent-tools/batch-closeout.mjs` | 171 |
| `thincoder-core/prompts/persona-engineering.md` | **492**（490+2，合 §6.59 A2） |
| `test/RTM.md` | 306 |
| `thincoder-core/tool-docs/batch.md` | 55（未动） |

无一档越 500 顾问线。

## 5.5 未做 / 偏离（逐条分「等设计席」与「我判断」）

| # | 项 | 归类 |
|---|---|---|
| 1 | **描述面第三处未落**：`thincoder-core/tool-docs/batch.md` 首行仍是旧形，T130 也只判三处整串等值 ⇒ AC-M2-37 ⑥「四处」**本轮未满足**，收口时不得宣称已满足 | **等设计席**（父侧裁定扣住）。实测依据：围栏第三段 510 字符 > 文档门段落限 300（探针实测 1 条「文字太长」），照抄则 §5 写不进来 |
| 2 | **T130 负向锁换了锁串**：设计写的负向正则按字面跑**会命中新文案**（`[^.]*` 跨度覆盖新条件句）⇒ 假红；实落改为锁旧句片段 `/trigger 归批\); pass an archived/` | **等设计席**改单源锁串；我判断「照抄正则 = 假红」不能作为可交付断言 |
| 3 | `ledgerBindBatch` 由同步改 **async** | **我判断**（无第二条路）：候选集按设计须走 `ledgerQuery`（零新 SQL），而 `ledger-cmd` 反向 import 本档（防环）：静态 import 成环，唯一可用形 = 体内动态 import。唯一调用点本就 `await`，JSDoc 已同步 |
| 4 | 接手路径（`ledger:"#N"`）回执**不带** `same-face check` 行 | **我判断**：§6.3 写「`ledger` 在场 ⇒ 本节零判（接手路径零回归）」；该行是门的读数，门没跑就没有读数。T128 ① 已把这条锁进断言 |
| 5 | `n = 0` 时回执括注里的理由槽渲染成 `—` | **我判断**：围栏未规定占位填法；`—` 是本仓「无值」既有形（档头 `台账 = #N（… · —）`）。T125 不锁该字面 |
| 6 | 集成用例 13-4 落 `test/integration/batch-ledger-bind.test.mjs` | **我判断（设计指定落点）**：设计 §6.3「集成测试设计」明写该档，但 §4 受影响文件表漏列 ⇒ 按设计落，如实记于此 |
| 7 | RTM 目的行与节注四态 | **我判断（D3 计数随动）**：§4 表只写「13-1 前提 + 13-4 行」，但加行不改态数是计数与列表脱钩 |
| 8 | `test/integration/batch-live-batch-lock.test.mjs` 12-3 补 `newDebt` | **我判断（不留断掉的调用方）**：不补则该集成用例在本门下落必红 |
| 9 | 全量套件未跑 | **我判断（父侧收口门）**：本席跑的是改动面（上面六条），全量归父侧 |

## 5.6 过程与终态

- **内部审计**（explore 差异审计）：1 轮 · 三处描述面逐字全对 · 判点与零写二件成立 · 提 8 条（🔴0 · 🟡3 · 🔵5）。处置：13-4 补收口引文断言、RTM 错字、`board` 判等改严格等值（同 §7.1）、临时件确认已删；余下 = 本表第 1–2 条（等设计席）。
- **内部代码评审**（advisor · type=code）：1 轮 · `VERDICT: pass`（🔴 0 · 🟡 1 · 🔵 2）；🟡 即「描述面第三处待设计席」，与本表第 1 条同源；未采纳建议 = 无。
- **终态 = clean**（无未闭 🔴；唯一 🟡 是父侧裁定扣住并已排后续轮）。

### 5.7 修正轮 · 解扣补落（设计围栏改两段后照新形落两件 + 删旧负向锁）

**父侧本轮指令**：照 §2 修正轮 3 ① 的新形落两件、删旧负向锁；只动 `thincoder-core/tool-docs/batch.md` ∥ 本批单测档。同一 designToken，不重跑设计评审。

**逐档改动**

| # | 档 | 落点 | 改了什么 |
|---|---|---|---|
| 1 | `thincoder-core/tool-docs/batch.md` | `:1` ∥ `:2`（空行）∥ `:3` | 首行单段（旧无条件句，以 `at creation)` 收尾）拆成首两段：`:1` = 围栏第三段前一半（以 `at creation;` 收尾）· `:3` = 后一半（`ledger:"#N" takes over … ledger:"#<id>")`）——不删字、不换词 |
| 2 | `docs/batches/2026-11-01-claim-existing-debt.test.mjs` | `:71`–`:72` · `:75`–`:76` · `:182`–`:201` | 头部注记改「四处逐字 · 第三段 = 首两段」；新增 `FENCE_DOC_A` ∥ `FENCE_DOC_B`（照围栏两半逐字）；T130 标题与断言改四处整串等值形——新增第三处 = 该档首两段**分别** `===` 两半（用例自打段落切分：段间空行缺失 ⇒ 两半并一段 ⇒ 红）；删旧负向锁正则 + 删同段一条正向片段锁（理由见下） |

**两段实测长度（本席实跑 node 读行长）**：`261` ∥ `248` 字符，均 ≤300；`A + " " + B` = `510`，与拆前单段等长。整串等值实跑：首段 `===` 设计档 `:1105` **true** · 次段 `===` `:1107` **true**。

**T130 第三处的红绿对（新增处真守着，不是空绿）**

- 绿：现盘首两段与围栏两半整串相等。
- 红 1 · 旧形：首段换回旧单段句 ⇒ 首段 `!==` 前一半 ⇒ 红（旧无条件句若回潮即被拦）。
- 红 2 · 缺空行：两半之间去空行 ⇒ 并成一段 ⇒ 两处断言同时红（段间空行被计入，不是「靠子串过」）。

**删两处片段锁的理由（第二处超出父侧字面指令，如实记）**

- 父侧点名删的 `/trigger 归批\); pass an archived/`（负向锁）已删净。
- 同段另一条 `assert.match(props.ledger.description, /— but only when no unsettled row exists on the same face/)` 同为片段锁，而 AC-M2-37 已写死「描述面由这几处整串等值守，**不另设片段锁**」；整串等值 100% 覆盖其射程，保留即与 AC 相反且纯重复 ⇒ 一并删。**覆盖无损失**（同一处上一行 `assert.equal` 更强）。此为**我判断**，如父侧要保留该正向锁，回补一行即可。

**读数**

| 项 | 命令 | 结果 |
|---|---|---|
| 本批八例 | `node --test docs/batches/2026-11-01-claim-existing-debt.test.mjs` | **8/8 绿**（T125–T132） |
| 语法 | `node --check docs/batches/2026-11-01-claim-existing-debt.test.mjs` | 无输出（OK） |
| 文档门 | `doc_check(mode:"gate")`，docs = `thincoder-core/tool-docs/batch.md` | `DOC-CHECK GATE: PASS`（0 段有问题） |

`doc_check: PASS (1 doc)`

**AC-M2-37 ⑥ 现满足**：四处描述面（`batch.mjs` 的 `ledger` ∥ `batch.mjs` 的 `newDebt` ∥ `thincoder-core/tool-docs/batch.md` 首两段 ∥ `parseLedgerNo` 拒文尾句）均已整串等值，T130 四处全绿。

**§5.5 第 1 ∥ 2 条（上一轮登记的「未做」）现态 = 已关闭**：两条均由本节落净。§5.5 表内原文按 append-only 保留，收口以本节为准（父侧已声明本轮解扣）。

**越出申报写域的档**：无（只动申报的两档）。**未动**：设计档 / 需求档 / 其他代码与测试。

## §6 验证与收口（父代理）

## 6. 验证与收口（父代理）

**状态行**：已收口 2026-11-01

### 6.1 交付事实

**① 结构兜底 —— 同面判门落核内单点**（`thincoder-core/ledger-write-ops.mjs` `ledgerBindBatch` 体内 · 写形开户之前；工具层只透传 ⇒ 门不可绕过）。

**② 提示词一句**（`thincoder-core/prompts/persona-engineering.md:432`–`:433`）：开批是为做一条已在池里的债 ⇒ 接手那一行。

**③ 描述面四处同步为条件形**（本批唯一 🔴 两次都出在这里）：`thincoder-core/agent-tools/batch.mjs` 的 `ledger` / `newDebt` 描述 · `thincoder-core/tool-docs/batch.md` 首两段 · `thincoder-core/agent-tools/batch-ledger-bind.mjs` 的 `parseLedgerNo` 拒文尾句。

**④ 理由读面**：本批收口回执引一行（`thincoder-core/agent-tools/batch-lifecycle.mjs` 两路 + `thincoder-core/agent-tools/batch-closeout.mjs` 新增纯格式化函数），只引不写。

### 6.2 父侧收口读数（自跑，一次）

```
node --test docs/batches/2026-11-01-claim-existing-debt.test.mjs \
              test/integration/batch-ledger-bind.test.mjs \
              test/integration/batch-live-batch-lock.test.mjs
⇒ tests 18 · pass 18 · fail 0
```

**拆开**：本批八例 T125–T132 = 8 · 集成 13 面 = 4（13-1/2/3 零回归 + 13-4）· 锁面 = 6。

**机器核（父侧）**：设计围栏两半 261 ∥ 248 **=== 实现两段** 261 ∥ 248（逐行 `===`，段间空行在）；`batch.mjs` 旧无条件句**仍在但已接条件形**「— but only when no unsettled row exists on the same face」。

### 6.3 四轮评审轨迹（本批最值钱的是这两次驳回）

| 轮 | 结论 | 驳回了什么 |
|---|---|---|
| 1 | changes-required 🔴1 | **门落了、描述没改** —— 模型读到的仍是「省略就开新行」 |
| 2 | changes-required 🔴1 | **理由有读面、没人去组装那个回执** —— AC 与 T132 对着一片空气 |
| 3 | pass（漏写状态行 ⇒ 无 token） | — |
| 4 | pass + token | — |

**两次 🔴 是同一类病**：**机制本体写了，围着它的那一层没跟上。** 第一次是模型可见文本，第二次是回执的组装者。**两次都是「谁会去用它」没被问到。**

### 6.4 一处结构冲突与它的解法（记下来给后来人）

`thincoder-core/tool-docs/batch.md` 首段 510 字符 vs 文档机检段落上限 300 —— **两条都对，同时成立不可能。**

**解**：拆成两段（261 ∥ 248），**拼接校验 `A + " " + B === 原串` = true，纯空白位移，一字未增删。**

**为什么不压缩**：**那 510 字每个分句都是条件形的一部分，砍 210 字必砍掉某一支 —— 而砍掉的那支正是这个门存在的理由。**

**需求档同步**：`docs/core/requirements/ENGINEERING-MODE-V2-SPEC-LEDGER.md:98` ⑥ 已改写为「首两段（段间一空行，各 ≤300 字符——单段 510 会撞文档机检的段落上限）」，**把「为什么不能合回去」写进需求档本身**，免得下一个人重撞一次。

### 6.5 一条被删掉的断言，值得记

设计原本给 T130 配了一条「负向锁」正则。**实施席实跑发现它按字面会命中新文案 —— 因为新文案保留了旧句前缀。**

**父侧裁定：整条删掉。** 理由：**四处已由整串等值守，整串等值令旧句不可能存在；再加一条片段锁是重复，而这条重复恰恰是错的。**

**写进 AC 的判据句**：「描述面由这几处整串等值守，不另设片段锁」—— **让人知道这是有意为之，不是漏了。** **一条错的断言比没有断言更坏：它会让下一个人以为这里被守着。**

### 6.6 越出申报写域的两处（已披露，父侧采认）

- `test/integration/batch-ledger-bind.test.mjs` —— 设计 §6.3 指定落点，新增 13-4 用例。
- `test/integration/batch-live-batch-lock.test.mjs:84`–`:85` —— **不补 `newDebt` 则既有集成用例 12-3 在本门下落必红**（第二本 `create` 会被拒）。**这是「不修就连带弄坏别人」的连带，不是顺手扩边。**

### 6.7 未收项（全部已登账，指针在台账）

| 台账 | 内容 |
|---|---|
| `#1935` | AC-M2-36 只在设计档、需求档无此条（**本批前既有**断层） |
| `#1937` | `thincoder-core/tool-docs/batch.md:31` 的「after create 由主 agent 补档头」在门落之后部分不可达 |

### 6.8 收口判据

- chain：§1 · §2 · §3（四轮，终态 pass）· §4 · §5 · §6 全在。
- 验收：八例 8/8 · 集成本批新增 13-4 绿且 13-1/2/3 零回归 · 锁面 6/6 · 描述面四处整串等值（父侧复核 `===` 成立）。
- **零留存**：`docs/batches/2026-11-01-claim-existing-debt.test.mjs` 收口即删（已删）。
- 台账：`#1927` → 已核销。
