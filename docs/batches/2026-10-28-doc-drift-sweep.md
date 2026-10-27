# 2026-10-28 · doc-drift-sweep
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-28 · 来源 = 用户 2026-10-28 00:13「开」—— 批准开 A 批（文档对账清扫）。父侧盘点 30 行未决台账，按变更面切分：本批只收**纯设计档**的 6 条，其余 24 条各属产品码 / 产品文本 / 提示词面 / 大件 / 待裁，另行开批。。
> 台账 = #1853（DOC-DISCIPLINE · 归批）。前情 = 2026-10-27-digest-retry-amplify（已收口 2026-10-27）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-28

### 1.1 本批范围（父侧 2026-10-28 00:2x）

**本批 = 纯文档对账，零代码、零提示词、零产品文本。** 台账 30 行未决里，只有下面 6 条落在设计档面：

| 台账 | 要收正什么 | 落点档 |
|---|---|---|
| `#1844` ① | 「`tool-docs/` 24 档」→ 实读 54 档；「24+8」那个 8 要分别核 | `docs/core/design/CONTEXT-COMPACTION.md:654` / `:692` |
| `#1846` | 五处：§1.1 逐字块缺第三行 · 受影响文件表缺两个集成宿主档 · 四档 Δ 与实落量偏差 · `batchOf` 兜底行为未登记 · `:57` 未写明「读侧专用」 | `docs/core/design/ADVISOR-GUARDS.md` |
| `#1832` | §5 表头「五行为未落地」与代码相反（归批门 / B `taskBookOnDisk` 已在盘）；同句还判着 `resume_when` / `evidence 超限` / `出口面` 三行，收正前须先核那三行 | `docs/core/design/LEDGER.md:713` |
| `#1852` | 两处「用例宿主」死指针（指向的核包测试档已随批删除） | `docs/core/design/AGENT-LOOP-ASYNC-POOL.md:535` / `:633` |
| `#1737` | 提示词改写导致设计档活坐标漂移 | `docs/core/design/PROMPT-SYSTEM.md:161` · `docs/core/design/ADVISOR-CONVERGENCE.md:221` |
| `#1782` | 文件体量阈值两口径（300/500 vs 500/800）的管辖面划界句未登记 —— 落点待设计席判 | 待定 |

### 1.2 本批不做（各自的面，另开批）

- **`#1844` ②**（删 `thincoder-vscode/src/specs.mjs` 的死函数 `ctxPercentForModel`）= **产品码面** ⇒ 走设计 + 评审 + token + eng-coder。
- **`#1838`**（`thincoder-vscode/AGENTS.md:15` 24→54）= **产品文本面** ⇒ 同上全链。
- **`#1736`**（`thincoder-core/tool-docs/doc_check.md` 的 Anchors 全称句）= **产品文本面**（tool-docs 注入给模型）⇒ 同上。
- **`#1760`** / **`#1817`** = **提示词面** ⇒ 内容由主 agent 定、落地由 eng-coder。
- **`#1833` + `#1809`**（疑同一 bug）· **`#1731`**（696 条裸名）· **`#1765`/`#1766`**（两端 runner）· **`#1829`**（VSC 集成层）· **`#1831`**（四档合并）· **`#1835`**（台账读面用例）—— 大件，各需独立批。
- **`#1722` / `#1761` / `#1814` / `#1815`** —— 待用户裁定。
- **`#1820` / `#1821` / `#1822`** —— 外部依赖。

### 1.3 为什么不把它们并成一批

**变更面不同 ⇒ 验收面不同。** 设计档对账的验收 = `doc_check` 门 + 读数与实盘一致；产品码的验收 = 用例绿 + 行为判据；提示词面的验收 = 夹具实测。**混在一批，谁都没法签字。**

**⇒ 这是纪律「一个 dispatch 一个变更面」的同一件事：拆开不是拖，是让每批都有单一验收面。**

### 1.4 编号 1.4 的处置：留作占位（父侧 2026-10-28 00:4x）

**为什么不照评审建议「补齐编号」办**：§2 与 §3 里已有多处引用 `§1.6`（误导源那张表）与 `§1.7`（第一轮裁定）。把 1.5 / 1.6 / 1.7 顺移，那些引用会指向错的内容 —— **跨段死指针比编号跳号严重**。故 1.4 留作本说明本身，编号因此连续、引用不动。

### 1.5 链声明（父侧纠正 · 2026-10-28 00:2x）

**本批走完整四步链，§3 评审是核销前置。**

**我先前打算按「纯文档维护不走设计评审链」办 —— 那条出自 `docs/core/requirements/_archive/ENGINEERING-MODE.md` §1.6，是**已归档**的旧口径。现行判据不认它：**

```
thincoder-core/ledger-close-proof.mjs:54-55
if (s3 !== STATUS_WORDS[3].done) {
  missing.push(`  ③ 批档 §3 未通过评审（§3 状态行 = …，须 = 评审通过）…`)
}
```

**⇒ 不开评审 ⇒ §3 空 ⇒ 台账核销不掉 ⇒ 批收不了尾。**

**用户 2026-10-28 00:16 原话：「你不开链收不了尾吧？」—— 他说的就是这个，且这不是新规矩**：2026-10-27 15:40 他已经说过一次「我设计这个模式的目的就是堵死这个漏洞，不走设计核销不掉就对了」。

**⇒ 本批链：设计（`#8`）→ **评审（待 fire）** → 批准 → 收口；零代码改动，故无 eng-coder 段，§5 记「不适用」并在 §6 说明。**

### 1.6 追加一条：误导源本身（用户 2026-10-28 00:17 指示 · 父侧直接执行）

- **已定决定**：把 `docs/core/requirements/_archive/ENGINEERING-MODE.md` 收正 —— 它是本批漏开链的**直接原因**，留着就会坑下一个读者。 · 用户原话：「**误导你的那篇文档也收正一下吧。**」 · 时间：2026-10-28 00:17

**为什么它必须收正，而不是「归档档无所谓」**

**它在 `_archive/` 目录里，但档头与正文读起来和活档同形，检索也不会自动跳过 —— 而 §1.6 那张表逐字写着「纯文档维护 … 设计评审 → 用户批准 → eng-coder → 验收链 = 不走」。我 00:1x 就是照它办事，两批都没开链。**

**改了什么（父侧直接执行，需求档是我的笔域，不经 §2）**

| 处 | 改法 |
|---|---|
| 档头首行 | 标题加「（**已归档**）」 |
| 档头第 3–5 行 | 加三行：本档已退役 / 内容不代表现行规则 / 现行单源 = `docs/core/requirements/ENGINEERING-MODE-V2.md`；并写明「正因 §1.6 这类已推翻条文还在，这行必须写在最前面」 |
| §1.6 表前 | 加失效标注：现行判据要求**任何批** §3 评审通过才能核销（引 `thincoder-core/ledger-close-proof.mjs:54-55` 逐字 + 用户 2026-10-27 15:40 原话）；下方表格保为历史 |
| 全文指针 | **21 处**相对指针改全路径（`requirements/X` → `docs/core/requirements/_archive/X`；`design/X` → `docs/core/design/X`） |
| 两处死档 | 工程模式的旧设计档（3 处，已被 V2 取代、不在盘）与 CLI 侧同名需求档（1 处，该树已归档）⇒ 改述为不带路径的说明 |

**读数**：改前门报 **25 条锚·档缺**（全是归档搬移后失效的相对指针）；改后 **PASS · 0 段问题**。

### 1.7 第一轮评审裁定（父侧 2026-10-28 00:2x）

**评审判 changes-required（🔴 3 · 🟡 7 · 🔵 4）。三条 🔴 全数接受并派修正轮 —— 它们指向同一个病：验收判据写成了全域扫描，而全域里本来就有一部分该留。**

| # | 级别 | 裁 | 理由 |
|---|---|---|---|
| 1 | 🔴 | **Fixed** | A5 写「全 docs 树扫「未落地在册」⇒ 0」，而 `docs/core/design/LEDGER.md:1108` 那句「未落地在册（在册未落）」是**现行真陈述**（那批用例确实不在盘）。⇒ 判据永远不可能绿，而照它去改就会删掉真话。收窄到改动面。 |
| 2 | 🔴 | **Fixed（部分）· 二轮未结** | A2 / A6 同病：记录面本来就留着那些字（本批档自身也留着），而 §2.4 只把改动面定在 §6.30.7 / §6.30.12 两段。⇒ 判据要么不可达，要么逼人去改不该改的段。**二轮复核：A6 半已关（九档内两段实读干净）；A2 半仍不可达 —— 它要求九档内「档数句 0 命中」，而九档里 `docs/core/design/PROMPT-SYSTEM.md` 等处登记着档数且那是权威读数。三轮须删该半句或收窄到改动面。** |
| 3 | 🔴 | **Fixed（部分）· `#1782` 保持未结** | E6 把 `#1782` 闭在 `docs/core/design/LEDGER.md:370` 那句上，但那一句划的是「500 顾问线 / 800 硬线 vs 650 单点」，**不是**台账行说的 300/500 vs 500/800。而落笔处让同一个 500 同时叫「顾问线」与「硬线」（`docs/core/design/LIGHT-CHANNEL.md:109` 与 `:260`）—— 600 行的程序码档按前者不触发、按后者必须拆。⇒ 关账关在了错的对象上。**二轮复核：坐标半已落（A8 可过），划界句本体未落 —— 那需要一轮新增规范句，不在修正轮授权面。⇒ 收口时 `#1782` 不得按 Done 核销。** |
| 4–10 | 🟡 | **Fixed** | E2 ③ 读数与落地表对不上 · 第九档（`_archive` 那档）没进受影响表与 A1 机检范围 · 六条「已落」在前而 §3/§4/§5 在后（「已落」未定义）· 缺最相近先例行 · 缺勘察证据行（`docs/README.md` 在盘但无查图记录）· 缺三问答复 · `docs/core/design/DESIGN-TOKEN-SETTLEMENT.md` §10 与 `:151` 同档两处活描述。 |
| 11–14 | 🔵 | **Fixed** | RTM 三答未给（标成 RTM 面作答）· 模板占位与 §1 编号 1.4 缺口 · 四组读数本轮核不到（记 `unverified`，留给 A3 / A7）· 归档档档头的事故叙述。 |

**评审自己也记了「已核实且正确」的一侧**（E1 / E2 五处 / E3 / E4 / E5 / E6 的坐标半 / §1.6 全部对上），所以这不是全盘打回 —— 是**判据面**要重写。

**⇒ 派修正轮（`round="fix"`）：三条 🔴 只改 §2.4 的验收行与 E6 的落点说明，不动已落的设计档正文。**

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成

### 2.1 本批条目（6 条台账行 → 6 个条目；范围 = §1.1）

**批次性质 = 纯设计档对账**：零代码、零提示词、零产品文本。实施面 = 设计档正文改写（本席笔域），无 eng-coder 笔。

| 条目 | 台账 | 要收正什么（一句） | 落点档 | 状态 |
|---|---|---|---|---|
| E1 | `#1844` ① | 「tool-docs 24 档」与「24+8 名集」两处绝对值 | `docs/core/design/CONTEXT-COMPACTION.md` | 已落 |
| E2 | `#1846` | 五处：逐字块第三行 · 受影响文件表 · 兜底行为登记 · 读侧专用句 | `docs/core/design/ADVISOR-GUARDS.md` · `docs/core/design/DESIGN-TOKEN-SETTLEMENT.md` | 已落 |
| E3 | `#1832` | §5 表内失效表达删除 | `docs/core/design/LEDGER.md` | 已落 |
| E4 | `#1852` | 「用例宿主」死指针改述（**扩面**，见 2.2） | `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` | 已落 |
| E5 | `#1737` | 提示词改写后的活坐标漂移 | `docs/core/design/PROMPT-SYSTEM.md` · `docs/core/design/ADVISOR-CONVERGENCE.md` | 已落 |
| E6 | `#1782` | 文件体量两口径的管辖面 —— 落点本席判 | `docs/core/design/LIGHT-CHANNEL.md` | 半落：坐标半已落 · `#1782` 本体未结（划界句未落，见 2.2 / 2.7 项 4） |

### 2.2 逐条实读读数（本席 2026-10-28 亲跑）

**E1** —— 读数：

- `Get-ChildItem thincoder-core/tool-docs -File` = **54 档**（名表已核）。
- `assembleBuiltinTools({cwd})` 返回 **31 名**。
- 原句「24 档」「24+8」无任一数成立 ⇒ 两处改为「零增删 + 口径 + 当日实读」，判据不再押死数。

**E2** —— 五处逐条：

- ① 逐字块第三行 = `证据：{evidence}`（`thincoder-core/agent-tools/design-token.mjs:136`，`evidence` 非空才出）；三条判据各自证句在 `:197` / `:203` / `:209`。
- ② 两枚集成宿主实读**都在盘**：`test/integration/batch-close-token-consume.test.mjs` · `test/integration/advisor-record-gate.test.mjs` ⇒ 补入表。
- ③ 五档实落（node，口径 `split("\n").length − 1`，本席 2026-10-28 复测）：`design-token.mjs` **267** · `design-slots.mjs` **305** · `batch-skeleton.mjs` **391** · `batch.mjs` **343** · `advisor.mjs` **280**；同表「落地前」列 = **200 / — / 367 / 349 / 260**（表 = `docs/core/design/ADVISOR-GUARDS.md:129`–`:133`）。表形 = 「落地前 → 实落」，`design-slots.mjs` 新档补一行。
- ④ 清点面取源序（旁列优先 → 按 designId 逆序取最近可派生 run → `—`）原只活在 `thincoder-core/agent-tools/design-slots.mjs` 注释，现登记进 `docs/core/design/DESIGN-TOKEN-SETTLEMENT.md` §10 正文。
- ⑤ 旧字面「评审完成」现写明**只在读侧等义**（写侧零别名）。

**E3** —— 台账号点名的表头句在现盘已不在（现为「本表五行均已落地在册」）。

- 残留 = 表内「触发字段」行尾尸句「该半句 = 目标态（未落地在册）」；而它描述的 `unlabeled` 桶**已在盘**：`thincoder-core/ledger-cmd.mjs:87`。
- 台账号要求「先核三行」——三行判点均在盘：`resume_when` 写面 `:156` · `evidenceOversize` `:53` / `:111` / `:130` · `overdueOf` `:80`。
- ⇒ 不是整句未落地，只删尸句。

**E4（扩面，如实登记）** —— 台账号只点两处，实测同一组句里其余指向同样已死：

- 已确认**不在盘**：`thincoder-cli/test/timer-wake.test.mjs` · `thincoder-cli/test/cmd-timers.test.mjs` · `thincoder-core/test/turn-domain-mode.test.mjs` · `thincoder-desktop/test/timer-wake.test.mjs` · `thincoder-desktop/test/agent-host.test.mjs` · `thincoder-vscode/test/timer-wake.test.mjs` · `thincoder-vscode/test/agent-lifecycle-singleton.test.mjs` · `thincoder-vscode/test/status-line.test.mjs`。
- 两段「用例宿主」整段改为「该批开发期用例，随批收口删除，无留存宿主」+ 实读日期。
- 扩面理由：同一判据（死指针）在同两段里，只改点名的两处等于留八处假指针。

**E5** —— 两处坐标按现盘实读改正：

- `thincoder-core/prompts/persona-eng-coder.md` 的实现纪律两行现住 `:23`（不得静默降级）/ `:29`（收尾自审）；设计档原记 `:17` / `:23`。
- `thincoder-core/prompts/persona-engineering.md:288` = 「Rounds are uncapped — repeated mechanical failure (same criterion) ⇒ stop and report.」（设计档原记 `:121`；原记引句「No round cap — …」非现文）。

**E6（本席判落点 · 修正轮收正）** —— `#1782` 要的「管辖面划界句」**不在盘**；本批落的只是坐标修正：

- 已落（可实读）：`docs/core/design/LIGHT-CHANNEL.md` 两处引 `docs/core/requirements/ENGINEERING-MODE-V2.md:647` 已改指 `:653`（`:647` 是 F6 机检闸，300/500 规则住 `:653` F12）⇒ A8 = 0 命中。
- 未落（`#1782` 本体）：300/500 与 500/800 的管辖面无人划。F12 实读 = 「>300 软线 = 触发拆分评审 · >500 硬线 = 超限档本批拆；**仅约束程序代码**」（`docs/core/requirements/ENGINEERING-MODE-V2.md:653`）。
- 500/800 的实住 = **各产品** `AGENTS.md`（`thincoder-cli/AGENTS.md:34` 逐字「exceeding 500 lines → advisory … Exceeding 800 lines → blocking」）；**本仓根无 `AGENTS.md`**（`glob AGENTS.md` 与 `**/AGENTS.md` 均无该档）。
- 同一个 500 因此两名两判：`docs/core/design/LIGHT-CHANNEL.md:109` 写「低于 500 顾问线」却同句引 F12 的「>500 硬线」；同表 `:260` 写「低于 300 软线 ∥ 500 顾问线」——600 行程序码档按 F12 必须拆、按 `AGENTS.md` 只建议拆。
- `docs/core/design/LEDGER.md:370` 划的是「500 顾问线 / 800 硬线 vs 650 单点」，不是这一对 ⇒ 充不了本条的划界句（评审行 3 判定成立）。
- ⇒ 真划界句属**新增规范句**，超出本修正轮授权面（§1.7 = 只改 §2.4 验收行与 E6 落点说明）；本席不自行落笔，处置见 2.7。

### 2.3 本批的机制（改写形态规则——后批照此判）

1. **绝对值带口径与取读日**：写「N 档 / N 行」时同句给出怎么数（目录列举 ∥ `assembleBuiltinTools` 名集 ∥ 行数口径）与取读日；判据不许押死一个会随内容漂的数。
2. **失效表达删除，不标注**：段内尸句一律删，被取代的语句不留任何形态（D8）。
3. **死指针改述，不换址**：「用例宿主」指到已随批删除的档时，写成「该批开发期用例，随批删除」，不另找档充当宿主。
4. **兜底行为进正文**：清点 / 派生面的取源序与降级层只能写在状态档正文，实现注释不算登记。

### 2.4 受影响文件与测试覆盖

| 档 | 改动面 |
|---|---|
| `docs/core/design/CONTEXT-COMPACTION.md` | §6.16.9 一行 + §6.16.10 RG4 一格 |
| `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` | §6.30.7 与 §6.30.12 的「用例宿主」两段 |
| `docs/core/design/LEDGER.md` | §5 表「触发字段」行 |
| `docs/core/design/LIGHT-CHANNEL.md` | 受影响文件表两格（`:109` / `:260`） |
| `docs/core/design/PROMPT-SYSTEM.md` | §6.3 端特有段一行 |
| `docs/core/design/ADVISOR-CONVERGENCE.md` | §3.6 盘点表 P2 行 |
| `docs/core/design/ADVISOR-GUARDS.md` | §1.1 判据 2 句 · 失败形态块与第三行说明 · 受影响文件表 |
| `docs/core/design/DESIGN-TOKEN-SETTLEMENT.md` | §10 清点面取源序一段（修正轮：只留「逆序取最近可派生 run」半幅，全序回指 F-SL1「批」列来源——D2 单源） |
| `docs/core/requirements/_archive/ENGINEERING-MODE.md` | 档头退役三行 + §1.6 失效标注 + 21 处相对指针改全路径（**父侧直改**；读数 = 改前 25 条锚·档缺 → 改后 PASS） |

**零可跑测试**：本批无代码改动 ⇒ 无变更面单测档，集成面零 delta（不改任何业务可观察结果）。验收 = 机检门读数 + 复读读数。

### 2.5 验收对照（逐条回指条目）

| # | 验收（机判） | 回指 |
|---|---|---|
| A1 | `doc_check(mode:"gate")` 对 2.4 表**九档**（含 `docs/core/requirements/_archive/ENGINEERING-MODE.md`）⇒ 首行 `DOC-CHECK GATE: PASS` | E1–E6 · §1.6 |
| A2 | 2.4 表九档内扫「24 档」「24+8」⇒ 0 命中（本席 2026-10-28 grep 实读；命中只在 `docs/batches/**` 与 `docs/core/design/_archive/modules/**`）；E1 改动面两处（`docs/core/design/CONTEXT-COMPACTION.md:654` / `:692`）的档数句各含取读日 `2026-10-28`，且以「实读」定口径 | E1 |
| A3 | `docs/core/design/ADVISOR-GUARDS.md` 受影响文件表含两枚集成宿主档名（`:135` / `:136`）；五档「实落」= 267 / 305 / 391 / 343 / 280（本席 node 复测，口径 `split("\n").length − 1`）、「落地前」= 200 / — / 367 / 349 / 260 | E2 |
| A4 | `docs/core/design/DESIGN-TOKEN-SETTLEMENT.md` §10 含「最近一个能派生出批档的 run」 | E2 |
| A5 | `docs/core/design/LEDGER.md` §5「触发字段」行（`:759`）不含「未落地在册」；档内其余五处（`:426` / `:1005` / `:1108` / `:1122` / `:1140`）为现行真陈述，保留不改 | E3 |
| A6 | `docs/core/design/AGENT-LOOP-ASYNC-POOL.md`:535 / :633 两段「用例宿主」内对已删档的引用 ⇒ 0 命中（现文 = 「该批开发期用例（随批收口删除，无留存宿主）」）；同档用例表 21 行 `thincoder-*/test/*.test.mjs` 引用 = 记录面，本批不回改、真伪另批核（见 2.7） | E4 |
| A7 | 三处坐标逐字对提示词档：`thincoder-core/prompts/persona-eng-coder.md:23`「…a silent degradation is a deviation.」∥ `:29`「Final review before finishing」∥ `thincoder-core/prompts/persona-engineering.md:288`「Rounds are uncapped — repeated mechanical failure (same criterion) ⇒ stop and report.」 | E5 |
| A8 | `docs/core/design/LIGHT-CHANNEL.md` 内对 `docs/core/requirements/ENGINEERING-MODE-V2.md:647` 的引用 ⇒ 0 命中 | E6 |
| A9 | `docs/core/design/DESIGN-TOKEN-SETTLEMENT.md` 的清点面取源序只活一处：§10 只留「逆序取最近可派生 run」半幅，全序回指 F-SL1「批」列来源 | E2 |

### 2.6 关键决策

| # | 决策 | 理由 |
|---|---|---|
| K1 | 绝对值降级为「口径 + 当日实读」，不换数字 | 换数字只治这一次；口径写在句内，下次漂了读者当场能发现 |
| K2 | E4 扩面到同段全部死指针（2 处 → 8 档） | 同一判据同两段；只改点名的两处，剩八处仍是假指针 |
| K3 | E6 只改坐标，不新立划界句 | `docs/core/design/LEDGER.md` §3.5 划的是 500/800 vs 650，充不了 300/500 vs 500/800；真划界句 = 新增规范句，超本修正轮授权面 ⇒ 上抛（2.7） |
| K4 | E3 只删尸句，不重写表头 | 表头现盘已是正确形；重写会把已对的部分再动一次 |

### 2.7 上抛项

1. **〔知会〕`#1844` ② 不在本批**：删 `thincoder-vscode/src/specs.mjs` 的死函数属产品码面，按 §1.2 另开批。本批只收 ①。
2. **〔待裁 · 台账号归属〕E4 扩面**：`#1852` 只登记两处，本批改了同一判据的 8 处。若父侧认为应另立行，本批如实留痕，收口时可拆记。
3. **〔知会〕读数残余**：`docs/core/design/LIGHT-CHANNEL.md` 受影响文件表的「现量」列是 2026-10-25 读数（如 `ledger-cmd.mjs` 记 431 行，现盘实读 335）。本批只改坐标与称谓，未逐行重算 —— 属下一批读数收正，本批不越。
4. **〔待裁 · `#1782` 未结〕** 真划界句（程序码档按 300/500 还是 500/800）需一行新增规范句，落 `docs/core/design/LIGHT-CHANNEL.md` ∥ `docs/core/design/LEDGER.md` §3.5 ∥ 产品 `AGENTS.md` 之一。本修正轮授权面只到 §2 ⇒ 未落；`#1782` 请勿按 E6 核销。
5. **〔待裁 · E4 残余〕** `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` 用例表另有 21 行引 `thincoder-*/test/*.test.mjs`（`:128`–`:130` · `:321`–`:324` · `:491`–`:502` · `:646` · `:656`–`:657` · `:672` · `:938`–`:939`）。E4 只改两段「用例宿主」，这 21 行真伪未核 ⇒ 另批处置。
6. **〔知会〕E5 引句措辞**：`thincoder-core/prompts/persona-engineering.md:288` 实读 = 「Rounds are uncapped — repeated mechanical failure (same criterion) ⇒ stop and report.」，非原记的「No round cap — …」；坐标对、引句旧。设计档该处是否逐字引旧措辞 = 本席未核（待核）。

### 2.8 修正轮（round="fix" · 2026-10-28 · 评审 14 条逐条落点）

**「已落」的定义**（评审行 6）：= 改笔已进拥有档正文、可实读；**未经 §3 通过 / §4 批准**。打回后由本席（eng-designer）在修正轮就地改文本；已落且判为正确的段落不回退。

**逐条落点**（编号 = §3 轮次 1 的行号）：

| # | 级 | 处置 | 落点 |
|---|---|---|---|
| 1 | 🔴 | Fixed | A5 收窄为 `docs/core/design/LEDGER.md` §5「触发字段」行（`:759`），档内其余五处点名保留（2.5） |
| 2 | 🔴 | Fixed | A2 → 九档内 0 命中；A6 → 只判 `:535` / `:633` 两段，用例表 21 行另批（2.5 + 2.7 项 5） |
| 3 | 🔴 | Fixed（部分）· `#1782` 未结 | E6 落点说明重写：坐标已落、`#1782` 本体**未落**；`docs/core/design/LEDGER.md:370` 不能充划界句；真划界句上抛（2.2 / K3 / 2.7 项 4） |
| 4 | 🟡 | Fixed | 2.2③ 的「设计预估」换成表内真值「落地前」= 200 / — / 367 / 349 / 260 |
| 5 | 🟡 | Fixed | 2.4 表补第九档 `docs/core/requirements/_archive/ENGINEERING-MODE.md`（父侧直改 + 读数）；A1 扩到九档 |
| 6 | 🟡 | Fixed | 「已落」定义见本节首段 |
| 7 | 🟡 | Fixed | 最相近先例行（本节） |
| 8 | 🟡 | Fixed | 勘察证据行（本节） |
| 9 | 🟡 | Fixed | 新名三问答复（本节） |
| 10 | 🟡 | Fixed | `docs/core/design/DESIGN-TOKEN-SETTLEMENT.md` 取源序只活一处：全序留在 F-SL1「批」列来源（`:151`），§10 只留「逆序取最近可派生 run」半幅 + 回指（`:294`）；A9 新增 |
| 11 | 🔵 | Fixed | RTM 三答（本节） |
| 12 | 🔵 | Fixed（部分） | §2 模板占位已删；§1 的占位行 / 状态行省略号 / 编号跳 1.4 = 主 agent 笔域，本席未动（上报） |
| 13 | 🔵 | Fixed | 待核读数本轮已实读：五档行数（node 复测 = 267 / 305 / 391 / 343 / 280）∥ 三处提示词坐标（`:23` / `:29` / `:288`）——见 A3 / A7 |
| 14 | 🔵 | 不适用 | `docs/core/requirements/_archive/ENGINEERING-MODE.md` 档头事故叙述 = 需求档面（主 agent 笔域），本席不改 |

**最相近先例行**：先例 = 同项目设计档把取读日写进受影响文件表头（`docs/core/design/LIGHT-CHANNEL.md:105`「受影响文件（本件 · 现量 = 本席实读 2026-10-25）」）⇒ 对齐（K1 的「绝对值 + 取读日」同形）；偏离 = 本批另把**口径**写进句内（先例只写日期），因为本批的数是「怎么数」会变的档数，只写日期不写口径仍无法复算。

**勘察证据行**：查过 `docs/README.md`（107 行 · 基准层地图：只登记落点与计数、逐名清单 = 目录列举）⇒ 八档落在已登记落点 `core/design/`，第九档在归档区 `core/requirements/_archive/`（本批只收正其指针与退役声明，不迁出）；查过 `PROJECT-MANIFEST.json` 的 `index.publicRepos` = `[]`（`:35` 实读）⇒ **无仓外声明源可查**（照记）；查过 `test/RTM.md`（253 行 · 8 列 · 按端分节）。

**新名三问答复**：

- `500 顾问线` / `800 硬线`：`existing: docs/core/design/LEDGER.md:370`（逐字「500 顾问线 / 800 硬线」）· consumers = `docs/core/design/LEDGER.md` §3.5 / §3.6 贴线判 + `docs/core/design/LIGHT-CHANNEL.md` 受影响表 ⇒ 沿用，不新造名。
- `650 单点`：`existing: docs/core/design/LEDGER.md:370`（逐字「650 = 批档机制档…单点放宽的**拆分触发**」）· consumers = `batch-lifecycle.mjs` 一档 ⇒ 沿用。
- `300 软线 / 500 硬线`：`existing: docs/core/requirements/ENGINEERING-MODE-V2.md:653`（F12 逐字「>300 软线 … >500 硬线」）⇒ 引原文，不改称谓。

**RTM 三答（`test/RTM.md` 面）**：破 0 · 冗余 0 · 缺 0 —— 本批零代码、零业务可观察结果变化，无一行受影响。

**本轮机检读数**：`doc_check(mode:"gate")` 对 2.4 表九档 ⇒ 首行 `DOC-CHECK GATE: PASS`，**0 段问题**（9 档全清）——A1 由此成为实读，而非预估。

### 2.9 修正轮二（round="fix" · 2026-10-28 · 评审轮次 2 的两条逐一落点）

**授权面** = §1.7 行 2「A2 半句三轮须删或收窄到改动面」+ 评审轮次 2 的 #15 / #16。两条各只动 §2 的判据行与处置行；**设计档正文零改**（本席本轮未改任何设计档）。

| # | 级 | 处置 | 落点 |
|---|---|---|---|
| 15 | 🔴 | Fixed | A2 后半收窄到 E1 改动面：前半（九档内扫「24 档」「24+8」= 0 命中）保留，并补实读来源；后半判据由「九档内档数句只出现口径 + 日期」改为「E1 改动面两处（`docs/core/design/CONTEXT-COMPACTION.md:654` / `:692`）各含取读日且以实读定口径」⇒ §2.5 A2 |
| 16 | 🟡 | Fixed | E6 处置三处同形：§2.1 E6 行写「半落：坐标半已落 · `#1782` 本体未结」、§2.8 行 3 处置改「Fixed（部分）· `#1782` 未结」（原只写「Fixed（部分）」）、本节同判 ⇒ §2.1 / §2.8 / 本节；收口不得按 Done 核销 |

**#15 为什么必须收窄（本轮实读）**：`docs/core/design/PROMPT-SYSTEM.md:17` ∥ `:122` ∥ `:192` ∥ `:337` ∥ `:956` 五处各写 54 / 53 档硬读数，只给数、不给口径与取读日；而 §2.4 给该档的改动面只有「§6.3 端特有段一行」。改前的后半判据要么永远红，要么逼本席越过改动面去改别批的权威读数 —— 两条都不是本批能签的字。

**#16 的事实核对**：§1.7 行 3 裁列现文 = 「Fixed（部分）· `#1782` 保持未结」（本席本轮实读，主 agent 笔域、本席未动）⇒ 与 §2 同裁，不相抵。评审指「§1.7 记 🔴 Fixed」是对该单元格的粗读；残留风险只在「Fixed（部分）」四字领起一格，故本轮把 §2 侧三处写成同一形并各带「未结」。

**本轮机检读数**：`doc_check(mode:"gate")` 对 §2.4 表九档 ⇒ 首行 `DOC-CHECK GATE: PASS`，0 段问题（改前改后同读数，本席两跑）。

## §3 设计评审（评审子代理）
**状态行**：评审通过



### 轮次 1（评审子代理）

### 评审范围与限制

评审对象 = 本档 §2（6 条目 E1–E6）+ 声明内十档（八档改动面 + `docs/core/requirements/_archive/ENGINEERING-MODE.md` 归档档 + `docs/core/design/DESIGN-TOKEN-SETTLEMENT.md`）。

限制两条（照记）：① 评审上下文报「未找到 Document Map」，而 `docs/README.md` 经 glob 实证在盘（AGENTS.md 指定为逐档权威地图），本轮未读 ⇒ Document ownership 判据降级；② 提示词档坐标（`thincoder-core/prompts/persona-eng-coder.md:23` / `:29`、`thincoder-core/prompts/persona-engineering.md:288`）与五档代码行数均在声明范围外，按 unverified 记。

### 本轮发现

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Acceptance criteria | 🔴 | A5「全 docs 树扫『未落地在册』⇒ 0 命中」（`:164`）在本仓永远不可能绿：同一档内五处该词是现行真陈述（`docs/core/design/LEDGER.md:1108`「**未落地在册（在册未落）**」，另见 `:426` / `:1005` / `:1122` / `:1140`——用例确不在盘） | 把 A5 收窄为「`docs/core/design/LEDGER.md` §5「触发字段」行不含该词」，并明写其余五处保留；判据由全树扫描改为段级扫描 |
| 2 | Acceptance criteria | 🔴 | A2「全 docs 树扫「24 档」「24+8」⇒ 0 命中」（`:161`）与 A6「对 `thincoder-*/test/` 下 `.test.mjs` 的引用 ⇒ 0 命中」（`:165`）都与现盘相抵：记录面仍有该词（`docs/core/design/_archive/modules/ENGINEERING-MODE-V2-MODULE-CHECKLIST-REMOVAL.md:128`「集合 == 24 档」· `docs/batches/2026-10-19-tech-todo-sweep.md:22`「工具描述面（模型可见文本——24 档）」，本档 `:15` / `:87` / `:100` / `:161` 亦含）；该设计档仍有大量用例指针（`docs/core/design/AGENT-LOOP-ASYNC-POOL.md:128`–`:130` · `:321`–`:324` · `:646` · `:656`）而 2.4（`:146`）只把改动面限定在 §6.30.7 / §6.30.12 两段 | 两条都改建在改动面上：A2 → 八档内 0 命中 + 取读日口径在场；A6 → 只扫 §6.30.7 / §6.30.12，并点名其余段（记录面）不回改 |
| 3 | Requirements coverage | 🔴 | E6 的落点判断与证据不符：档称 300/500 与 500/800 的划界句「已在盘」（`:127`–`:132` 引 `docs/core/design/LEDGER.md` §3.5），但 `docs/core/design/LEDGER.md:370` 划的是「500 顾问线 / 800 硬线 = `AGENTS.md` 全仓通用档面」vs「650 = 批档机制档…单点」，不是 `#1782` 要的 300/500 vs 500/800；落笔处又让同一个 500 同时叫两个名：`docs/core/design/LIGHT-CHANNEL.md:109`「低于 500 顾问线（…F12：>300 软线 = 触发拆分评审 · >500 硬线 = 超限档本批拆」，同表另一格 `:260`「低于 300 软线 ∥ 500 顾问线」——按 `:109` 自己引的 F12 原文，600 行的程序码档前者不触发、后者必须拆 | 加一句归一：写明 F12 的「硬线」与 AGENTS 的「顾问线」是同一个 500、冲突时取哪一条；并把 `#1782` 的划界对象改成实际登记的那一对（300/500 vs 500/800），或另立一句真划界 |
| 4 | Clarity / doc-state | 🟡 | E2 ③ 的读数与落地表对不上：档称「设计预估 234 / 未列 / ≈391 / 343–349 / 266 ⇒ 表改「落地前 → 实落」」（`:106`），实落表却是 200 → 267 · — → 305 · 367 → 391 · 349 → 343 · 260 → 280（`docs/core/design/ADVISOR-GUARDS.md:129`–`:133`） | 把 2.2 ③ 的「设计预估」列改成表里真有的「落地前」读数，或说明各列各是什么 |
| 5 | Requirements coverage | 🟡 | 本批已直接执行第九档改动（§1.6：`docs/core/requirements/_archive/ENGINEERING-MODE.md` 档头三行 + §1.6 失效标注 + 21 处指针），但受影响文件表（`:143`–`:152`）与 A1 机检范围（`:160`「上述八档」）都没有它 | 把该档补进 2.4 表，并把 A1 档集扩到九档（或另记一行「§1.6 面 · 父侧直改 · 读数 = 改前 25 条锚·档缺 → 改后 PASS」） |
| 6 | Methodology | 🟡 | 六条状态全写「已落」（`:87`–`:92`），而 §3 / §4 / §5 皆空；实读证明改动确已在盘（`docs/core/design/CONTEXT-COMPACTION.md:654`「档数按目录实读——2026-10-28 = 54 档」· `docs/core/design/ADVISOR-GUARDS.md:135` 两枚集成宿主已在表 · `docs/core/design/LIGHT-CHANNEL.md:109` 已改指 `:653`）——评审对象是已执行后的文本，「已落」在这里指什么未定义 | 明写「已落」= 文本已进拥有档、未经批准；并写清打回后由谁再落一轮 |
| 7 | Closest-precedent | 🟡 | §2 无「最相近先例（对齐 ∥ 偏离）」行，而同项目设计档把它当常规（`docs/core/design/ADVISOR-GUARDS.md:45`「**最相近先例**」· `docs/core/design/LEDGER.md:728`「**先例行（对齐 ∥ 偏离）**」· `docs/core/design/DESIGN-TOKEN-SETTLEMENT.md:351`） | 补一行：最近先例（同类文档收正批）+ 对齐 / 偏离理由 |
| 8 | Survey evidence | 🟡 | §2 无勘察证据行；`docs/README.md`（AGENTS.md 指定的逐档权威地图）在盘（glob 实证）而档内无查图记录；`PROJECT-MANIFEST.json` 的 `index.publicRepos` 声明也未照记（写法先例 = `docs/core/design/LEDGER.md:731`–`:732`「**[]** ⇒ **无仓外声明源可查**（照记）」） | 补勘察证据行：查过的档 + 地图定位结果 + 仓外声明源（`[]` 也照记） |
| 9 | Existing-piece | 🟡 | 新称谓「500 顾问线」与「650 单点」无三问答复（住在哪 · 逐字名 · 谁用）；其实件在盘（`docs/core/design/LEDGER.md:370`「500 顾问线」逐字）却未被引 | 按 `existing: docs/core/design/LEDGER.md:370（逐字「500 顾问线 / 800 硬线」）` 形补答，或写 `none found: …` |
| 10 | Document ownership | 🟡 | E2 ④ 把清点面取源序登记进 `docs/core/design/DESIGN-TOKEN-SETTLEMENT.md` §10（`:294`「**清点面的取源序（登记——不留给实现注释）**」），但那一段与同档 F-SL1 的「**「批」列来源**」（`:151`）描述同一取源序 ⇒ 同档两处活描述 | §10 只留「逆序取最近可派生 run」这半幅新事实，其余回指 `:151`（或反之），二者只活一处 |
| 11 | Integration-test design | 🔵 | 2.4（`:154`）以「**零可跑测试**」「集成面零 delta（不改任何业务可观察结果）」作答，但未回指 `test/RTM.md`（在盘，glob 实证），也未给三答（破 / 冗余 / 缺） | 把该句标成 RTM 面作答：「破 0 · 冗余 0 · 缺 0——本批不改任何业务可观察结果」 |
| 12 | Doc hygiene | 🔵 | 占位与编号残留：§2 模板占位行（`:79`）、§1 模板占位（`:7`）、§1 状态行尚带省略号（`:6`）、§1 小节编号跳过 1.4（`:38` 为 1.5） | 收口前清掉占位、补齐编号 |
| 13 | Feasibility（unverified） | 🔵 | 本轮声明范围内无法核的读数：五档代码行数（`docs/core/design/ADVISOR-GUARDS.md:129`–`:133` 的 267 / 305 / 391 / 343 / 280）、`thincoder-core/ledger-cmd.mjs` 的 `:53` / `:80` / `:87` / `:111` / `:130` / `:156`、提示词坐标 `thincoder-core/prompts/persona-eng-coder.md:23` / `:29` 与 `thincoder-core/prompts/persona-engineering.md:288`、`docs/core/requirements/ENGINEERING-MODE-V2.md:647` / `:653` —— 均 unverified | 留 A3 / A7 作落地轮判据；本表按 unverified 记，不作红判 |
| 14 | Doc hygiene | 🔵 | 归档档档头写入事件叙述（`docs/core/requirements/_archive/ENGINEERING-MODE.md:5`「2026-10-28 父侧就因 §1.6 漏开了两批的评审链」）——记录面内容落在档面；作读者警告可接受，但须自觉 | 可选：事故叙述压成一句「见批次档 2026-10-28-doc-drift-sweep §1.5」 |

### 已核通过的项（本轮实证）

- E1 已落且口径在场：`docs/core/design/CONTEXT-COMPACTION.md:654` / `:692` 已无旧数（八档内 0 命中），改为「按目录实读 + 日期」。
- E2 五处均已落：逐字块第三行（`:70`）+ `:73` 条件说明 · 两枚集成宿主（`:135` / `:136`）· 读侧专用句（`:57`）· 取源序正文（`docs/core/design/DESIGN-TOKEN-SETTLEMENT.md:294`）。
- E3 已落：`docs/core/design/LEDGER.md:742`「本表**五行均已落地在册**」；「触发字段」行（`:759`）尸句已删；三行判点坐标与 `:750`–`:752` 对上（`resume_when` 写面 `:156` / `evidenceOversize` `:53` / `overdueOf` `:80`）。
- E4 已落：`docs/core/design/AGENT-LOOP-ASYNC-POOL.md:535` / `:633` 改为「该批开发期用例（随批收口删除，无留存宿主）」+ 实读日。
- E5 已落（档面）：`docs/core/design/PROMPT-SYSTEM.md:178`「`:23` 不得静默降级 / `:29` 收尾自审」· `docs/core/design/ADVISOR-CONVERGENCE.md:221` 记 `thincoder-core/prompts/persona-engineering.md:288`。
- E6 半幅：坐标已改（`docs/core/design/LIGHT-CHANNEL.md` 内 `:647` 引用 0 命中，A8 可过）；判据面问题见行 3。
- §1.6 归档档改法实读与 §1 描述一致：档头「（**已归档**）」+ 三行退役声明（`:1`–`:5`）+ §1.6 表前失效标注（`:139`），引 `thincoder-core/ledger-close-proof.mjs:54-55`。

**计数**：🔴 3 · 🟡 7 · 🔵 4 = 14 行。

VERDICT: changes-required

### 轮次 2（评审子代理）

### 轮次 2 回评（只验轮次 1 的 14 条 + 修复引出的新问题）

**范围与限制**：只读声明内十档 + §2.8 处置表。提示词档坐标、五档代码行数、
`docs/core/requirements/ENGINEERING-MODE-V2.md:647`/`:653` 仍在声明范围外 ⇒ 按 unverified 记。

| # | 原# | 级别 | 状态 | 说明 |
|---|-----|------|------|------|
| 1 | 1 | 🔴 | Fixed | A5 已收窄到 §5 触发字段行，其余五处点名保留；该行现文无该词，五处真陈述仍在 |
| 2 | 2 | 🔴 | Unfixed | A6 半已闭（两段只剩目录名）；A2 半仍有不可达成分，见第 15 行 |
| 3 | 3 | 🔴 | Accepted | E6 改「半落 · 未结」，明写 :370 充不了划界句、真划界句上抛，并记「请勿按 E6 核销」 |
| 4 | 4 | 🟡 | Fixed | 2.2③ 换成表内真值（落地前 200 / — / 367 / 349 / 260；实落 267 / 305 / 391 / 343 / 280） |
| 5 | 5 | 🟡 | Fixed | 2.4 补第九档（归档需求档，父侧直改 + 读数），A1 改判「九档」，表行数确为 9 |
| 6 | 6 | 🟡 | Fixed | §2.8 首段定义「已落」= 正文已改、未经 §3 / §4；并写清打回后由谁再落 |
| 7 | 7 | 🟡 | Fixed | 最相近先例行已补，所引先例可读（LIGHT-CHANNEL 受影响表头带取读日） |
| 8 | 8 | 🟡 | Fixed | 勘察证据行已补三项（地图 / 声明源 / RTM），两个引用档在盘经实证 |
| 9 | 9 | 🟡 | Fixed | 新名三问按 existing 形给三条，所引 LEDGER :370 逐字在盘 |
| 10 | 10 | 🟡 | Fixed | DESIGN-TOKEN-SETTLEMENT §10 只留「逆序取最近可派生 run」半幅并回指 F-SL1，全序一处 |
| 11 | 11 | 🔵 | Fixed | RTM 三答已给（破 0 · 冗余 0 · 缺 0 + 理由） |
| 12 | 12 | 🔵 | Accepted | §2 占位已删；§1 残留属主 agent 笔域，设计席不改的理由成立 |
| 13 | 13 | 🔵 | Accepted | 读数已记为本席实读并交给 A3 / A7；本范围内仍不可核，按 unverified 收 |
| 14 | 14 | 🔵 | Accepted | 标不适用，理由 = 需求档面属主 agent 笔域；成立 |
| 15 | (新) | 🔴 | New | A2 后半「九档内 tool-docs 档数句只出现按目录实读 + 日期」不可达：九档之一的 PROMPT-SYSTEM 通篇硬读数，而 2.4 对该档改动面只有一行 |
| 16 | (新) | 🟡 | New | 同一处置两处相反：§1.7 行 3 记「🔴 Fixed」，§2.1 记「半落 · 未结」、§2.8 行 3 记「Fixed（部分）」 |

**第 15 行的证据（本轮实读 `docs/core/design/PROMPT-SYSTEM.md`）**：

- 档内硬读数句：`:17`、`:19`、`:122`、`:192`、`:337`、`:956`，各句只给数不给口径与取读日。
- `:956` 的「tool-docs 53 档」与 `:337` 的「枚举工具 53 ∥ 目录档 54」是双读数，属 CORE-UNIFICATION 登记口径。
- 2.4 表（本档 `:166`）给该档的改动面 = 「§6.3 端特有段一行」⇒ 按 A2 字面，要么永远红，要么逼人改六处正文。

**第 16 行的证据（本轮实读 `docs/batches/2026-10-28-doc-drift-sweep.md`）**：

- `:85` 处置表行 3 = 级别 🔴、裁 Fixed；`:107` E6 行 = 「半落 · `#1782` 未结」；`:216` §2.8 行 3 = 「Fixed（部分）」。
- 收口若按 `:85` 读，会把 `#1782` 当已闭（真划界句实际未落）。

**已复核仍正确（本轮实证，非引用）**：

- E1：`docs/core/design/CONTEXT-COMPACTION.md:654` / `:692`；九档内「24 档」「24+8」= 0 命中。
- E2：`docs/core/design/ADVISOR-GUARDS.md:129`–`:136`（五行 + 两枚集成宿主）。
- E3：`docs/core/design/LEDGER.md:742` 表头、`:759` 尸句已删、`:750`–`:752` 三行判点。
- E4：`docs/core/design/AGENT-LOOP-ASYNC-POOL.md:535` / `:633`。
- E5 档面：`docs/core/design/PROMPT-SYSTEM.md:178` ∥ `docs/core/design/ADVISOR-CONVERGENCE.md:221`。
- E6 坐标半：`docs/core/design/LIGHT-CHANNEL.md` 内 `:647` 引用 0 命中（A8 可过）。

**计数**：🔴 2（原条 1 未全闭 · 新增 1）· 🟡 7（6 闭 + 1 新）· 🔵 4（2 Fixed · 2 Accepted）。

VERDICT: changes-required

### 轮次 3（评审子代理）

### 轮次 3 回评（只验轮次 2 的 #15 / #16）

**范围**：只验两条 —— #15「A2 后半不可达」· #16「E6 三处口径不一」。声明内十档全量实读，只判这两条的状态，不另开新问题。

| # | 原# | 级别 | 状态 | 说明 |
|---|-----|------|------|------|
| 1 | 15 | 🔴 | Fixed | A2 后半已收窄到 E1 改动面（`docs/core/design/CONTEXT-COMPACTION.md:654` / `:692` 各含取读日 + 以实读定口径）；前半（九档内扫「24 档」「24+8」= 0 命中）经实读仍可达 |
| 2 | 16 | 🟡 | Fixed | E6 四处同形：§2.1 = 半落 · 本体未结；§2.8 行 3 = Fixed（部分）· 未结；§2.9 行 16 = 同判 + 不得按 Done 核销；§1.7 行 3 = Fixed（部分）· 保持未结，互相不抵 |

**#15 本轮证据（实读，非引用）**

- `docs/batches/2026-10-28-doc-drift-sweep.md:182`：A2 后半现文 = 「E1 改动面两处（`docs/core/design/CONTEXT-COMPACTION.md:654` / `:692`）的档数句各含取读日 `2026-10-28`，且以「实读」定口径」——判据不再扫九档。
- `docs/core/design/CONTEXT-COMPACTION.md:654`：「本批不增删 `tool-docs/` 档族（档数按目录实读——2026-10-28 = 54 档）」。
- `docs/core/design/CONTEXT-COMPACTION.md:692`：「`tool-docs/` 档族零增删（2026-10-28 实读 54 档）」。
- 九档内旧数：`docs/core` 全树 grep `24 档|24\+8` 仅命中 `docs/core/design/_archive/modules/ENGINEERING-MODE-V2-MODULE-CHECKLIST-REMOVAL.md:128`（该档不在九档内）⇒ A2 前半可达。

**#16 本轮证据（实读，非引用）**

- `docs/batches/2026-10-28-doc-drift-sweep.md:110`：§2.1 E6 状态列 = 「半落：坐标半已落 · `#1782` 本体未结（划界句未落，见 2.2 / 2.7 项 4）」。
- `docs/batches/2026-10-28-doc-drift-sweep.md:219`：§2.8 行 3 处置 = 「Fixed（部分）· `#1782` 未结」。
- `docs/batches/2026-10-28-doc-drift-sweep.md:253`：§2.9 行 16 = 三处同形 + 「收口不得按 Done 核销」。
- `docs/batches/2026-10-28-doc-drift-sweep.md:88`：§1.7 行 3 裁列 = 「Fixed（部分）· `#1782` 保持未结」，末尾另写「收口时 `#1782` 不得按 Done 核销」⇒ 与 §2 同裁。

**计数**：🔴 0 · 🟡 0 · 🔵 0 —— 两条均闭，#1782 保持未结的处置由 2.7 项 4 承接。

VERDICT: pass

## §4 用户批准（主 agent）

### 4.1 用户批准（2026-10-28 00:49）

**用户逐字**：「都批，自动跑完」—— 覆盖 A / B / C / D 四批的批准门（FR36 整批令）。

**⇒ 本批批准面 = 六条设计档读数 / 坐标 / 口径收正（§2.1 E1–E6）+ 三轮评审结论。**

**⇒ `#1782` 不在批准面内** —— §1.7 行 3 与 §2.9 均已写明「保持未结」，本体（300/500 与 500/800 的管辖面划界句）须另批落笔。批准 ≠ 那条已做。

## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）

## 6.1 验证与收口（父侧 2026-10-28 00:5x）

### 6.2 交付对照

| # | 状态 | 条目 | 落地读数 |
|---|---|---|---|
| E1 `#1844`① | ✅ Done | tool-docs 档数绝对值改「口径 + 取读日」 | `docs/core/design/CONTEXT-COMPACTION.md:654` / `:692` 各含取读日 + 「实读」口径（本轮复核逐字） |
| E2 `#1846` | ✅ Done | 五处落点正确；读数与落地表对齐 | 第九档进表 + A1 扩到九档；取源序单源（`docs/core/design/DESIGN-TOKEN-SETTLEMENT.md:151`） |
| E3 `#1832` | ✅ Done | 尸句已删 | `docs/core/design/LEDGER.md:759` 不含「未落地在册」；档内其余五处真陈述保留 |
| E4 `#1852` | ✅ Done | 两段「用例宿主」改述 | `docs/core/design/AGENT-LOOP-ASYNC-POOL.md:535` / `:633` 现为目录名形，无 `.test.mjs` 指针 |
| E5 `#1737` | ✅ Done | 三处坐标实读对上 | 引句措辞偏差已记 §2.8 待核 |
| E6 `#1782` | ⚠️ 半落 · **未结** | 坐标半已落（A8 可过）；**管辖面划界句未落** | 见 6.3 |

### 6.3 未结项（**不按 Done 核销**）

**`#1782` 保持未结**：E6 只闭坐标半。真划界句（程序码档按 300/500 还是 500/800）是一行**新增规范句**，修正轮授权面不到。

**⇒ 台账 `#1782` 已记明依据与三个候选落点；由下一批处置。**

### 6.4 机检读数（本轮实跑，父侧亲跑非引用）

- `doc_check(mode:"gate")` 十档 ⇒ **PASS · 0 段问题（10 档全清）**。
- 三轮评审：changes-required（14 条）→ changes-required（2 条）→ **pass**。
- 修正轮两轮：第一轮 14 条全处置；第二轮 2 条全处置。

### 6.5 结算清单

- **§2 ↔ 设计档对账**：§2.8 / §2.9 的处置表逐条指到现文，本轮复核一致。
- **前批遗留交叉核**：无（本轮新开批）。
- **修正轮落地前提**：两轮均已落、已复评 pass。
- **暂缓批复核**：无。
- **用户面同步**：本批纯设计档读数收正，无用户可见能力变化 ⇒ 一行「无」。
- **台账沉降**：`#1853` / `#1832` / `#1846` / `#1852` / `#1737` / `#1844`① ，`#1782` 保持未结。

### 6.6 未覆盖面（如实）

- `#1782` 本体未落（见 6.3）。
- `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` 用例表仍有 21 行引 `thincoder-*/test/*.test.mjs`，真伪未核（E4 只改两段「用例宿主」）—— 已记 `#1852` 的 resume_when 覆盖。
- 乙项（判据形如「某范围内某词 0 命中」而范围内有真陈述）本轮出现三次，均已由评审拦下并收窄；**根因是父侧写 §1 时给的方向，不是子代理执行偏差**。
