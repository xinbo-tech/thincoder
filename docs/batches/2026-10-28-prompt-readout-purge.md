# 2026-10-28 · prompt-readout-purge
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-28 · 来源 = 用户 2026-10-28 15:31「先评估一下，看看会产生什么影响再决定」→ 15:32「a」。
> 台账 = #1907（core · 归批）。前情 = 2026-10-28-rule-write-why（已收口 2026-10-28）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-28
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

## 1. 讨论（主 agent）

**状态行**：进行中（待设计）

### 1.1 一句话

**删掉提示词里「要求把读数写进文档」的那几处。纯删除，不新增任何规则。**

- **已定决定**：走 **A 案**（改三处的行数要求 + 一处半句；`thincoder-core/prompts/advisor-design.md:34` 的评审检查保留但改为「现量即用、不落档」）· 用户原话：「a」 · 时间：2026-10-28 15:32

### 1.2 为什么这批在最上游

**今天一整天的读数空耗，源头在这里**：规矩（`#1905`）、清账（`#1904`）都在下游堵，而**设计席每一轮照这三处办事，都会把行数写回设计档**。

**不过期这一头**：`docs/core/design/TESTING.md` 里已有「既有读数债」（归 `#1904`），**这批不清存量，只断新增**。

### 1.3 四处（父侧 15:31 评估所得 · 逐字）

| # | 处 | 现文 | 改成 |
|---|---|---|---|
| ① | `thincoder-core/prompts/persona-eng-designer.md:140` | `3. **Affected-file list** — source/test files with current line counts + expected deltas; cross-file-limit files carry a **split plan**` | 去「current line counts + expected deltas」；保留「哪些档」与「超限档带拆分计划」 |
| ② | `thincoder-core/prompts/persona-eng-designer.md:91` | `- ② Full affected-file list + line counts?` | 去 `+ line counts` |
| ③ | `thincoder-core/prompts/advisor-design.md:34` | `8. **Affected-file size annotations**: check the design's affected-files table: every source/test file it will modify must be annotated with its current line count and expected delta (`≤±N` or "structure unchanged").` | **保留这条检查**，改为「现量即用」：作者量、作者判 tier、**不把行数写进设计档** |
| ④ | `thincoder-core/prompts/persona-eng-designer.md:87` | `3. **Claims ↔ measurements**: every number and every "all / none / every" in your text is a **freshly measured reading** — a number recalled from memory or derived on paper is a claim, not a reading.` | **删「every number」那半**；**留**「all / none / every」那半 |

### 1.4 取舍理由（父侧 15:31 评估 · 三条）

**① 为什么留 `thincoder-core/prompts/advisor-design.md:34`（评审检查）而不是一起删**：

**删了它，评审还要自己量才能判 `thincoder-core/prompts/advisor-design.md:36`–`:37` 的 tier（>500 / >800 行）。** 一个改动今天走 2–5 轮评审 ⇒ **量 1 次变 N 次**，那是加法不是减法。

**改成「现量即用、不落档」之后**：**量还是量一次，但量到的东西不进文档** ⇒ 没有可以被后来人误引的旧数，也没有把 1 次变 N 次。

**② 为什么 `thincoder-core/prompts/persona-eng-designer.md:87` 只删半句**：

那半句治的是**过度声称**（「全都」「没有一个」「每一个」），与读数无关。**整条删掉会连带扔掉一个有用的约束。**

**③ 为什么删了不会丢「量级感」**：

**真正需要量级的人是评审判 tier 的那一刻，他自己会量；后来读档的人要的是「改了哪些地方」**，而那个数他自己会变。

**替代形**：受影响文件表写「新增几档 ∥ 改哪几处 ∥ 哪一档超限（带拆分计划）」。

### 1.5 影响面（父侧机检 · 这批是自足的）

```
全仓扫「line count」：
  要求写它的         = 3 处（本批三处）+ 1 处只作硬限举例（thincoder-core/prompts/discipline-engineering.md:129，不受影响）
测试断言它           = 0
代码解析它           = 0
设计档里有这条规矩   = 0（它只活在提示词里）
```

**⇒ 删它不碰坏任何机制，无跨档连带。**

### 1.6 不在本批

- **存量读数**（各档 as-of 与计数表）→ `#1904`
- **三个免检装置** → `#1904`
- `thincoder-core/prompts/discipline-engineering.md:129` 的「line counts」是**硬限举例**，不是要求，不动
- `docs/core/design/TESTING.md` 的 §3.5 ∥ §11.8 行数表 → `#1904`

### 1.7 第 1 轮评审的两个 🔴 成立 —— 父侧 15:31 的评估错了（停在用户裁定前）

**评审说「前提不成立」，父侧逐行核实：对。**

**这条义务不止住在提示词，需求层与设计层各有一份现行判据**（父侧实读，逐行）：

| 层 | 处 | 原文 |
|---|---|---|
| 需求 | `docs/core/requirements/METHODOLOGY.md:84` | F-R24a「设计文档「受影响文件」表对每个将改的源 / 测试文件标注 `当前行数 + 预计增量`」；判定句「设计文档受影响文件表含当前行数 + 预计增量（评审维度核查）」 |
| 需求 | `docs/core/requirements/METHODOLOGY.md:85` | F-R24b「权威载体 = `docs/core/design/ADVISOR-CONVERGENCE.md`」 |
| 需求 | `docs/core/requirements/ENGINEERING-MODE-V2.md:270` | 模块设计内容 ③「受影响文件全清单（源/测试标当前行数 + 预计增量）」 |
| 需求 | 同档 `:354` ∥ `:370` | 开工前自检 ②「受影响文件全清单 + 行数标注（代码面标行数，文档面豁免）」 |
| 设计 | `docs/core/design/ADVISOR-CONVERGENCE.md:362` | §9 逐字要求同一件事；`:401` A-AC11「行数标注核查维度在位」 |
| 设计 | `docs/core/design/DOC-DISCIPLINE.md:266` | 「源 / 单元测试档的『当前行数 + 预计增量 + 拆分计划』三件——**不得误删**」 |
| 设计 | 同档 `:268` | 新落笔批次档受影响文件表**保留该两列** |

**⇒ 只改提示词 = 造出「需求档要求写、提示词禁止写」的两处相反描述。**

**父侧 15:31 的错因（记下来，这是同一个病的第三次）**：**用 `line count` 这个英文串去扫，而承载这条义务的档写的是中文**「当前行数」「预计增量」「行数标注」⇒ 扫出 0 命中，于是宣布「它只活在提示词里」。

**★ 漏检的方向恰好是我想看到的结论** —— 这正是「否定结论要换词重搜」那条记忆说的形。

### 1.8 这件事的规模已经变了，须用户裁定

**本批原本定形为「删提示词四处（纯提示词面）」。现在的事实是**：要真的删掉「写读数」这条义务，得动**四层**：

```
需求层   docs/core/requirements/METHODOLOGY.md:84 ∥ :85
         docs/core/requirements/ENGINEERING-MODE-V2.md:270 ∥ :354 ∥ :370
设计层   docs/core/design/ADVISOR-CONVERGENCE.md §9 ∥ A-AC11
         docs/core/design/DOC-DISCIPLINE.md §3.7（:266 ∥ :268）
提示词   persona-eng-designer.md:140 ∥ :91 ∥ :87
         advisor-design.md:34
```

**而这正是那条「最上游」的东西** —— **每一份设计档的「受影响文件（当前行数 + Δ）」都从 F-R24a 长出来。** 今天所有对不上的数（1790∥1792、1318∥1334、−18 行失真…）源头都在它。

**两条路，代价不同，请裁**：

| 路 | 内容 | 后果 |
|---|---|---|
| **A′（推荐）** | **把义务从「写数」改成「判档」**：F-R24a 改为「受影响文件表列文件名 + 是否超档；**tier 在评审当刻现量**，结论（哪些档超档、各自拆分计划）落档，数不落档」，四处同口径收正 | 数彻底不落档；tier 判据保住（评审现量）；**但需求层改判据 = 契约变更，须你点头** |
| **B′** | 只改提示词，需求层留原样 | **不成立** —— 两处相反描述，判据红。等于没做 |

**在裁定前：不开实施、不收口。** `#106` 的设计按现形不能落。

### 1.9 用户裁定 A′（2026-10-28 15:44）

- **已定决定**：删掉「受影响文件表写 `当前行数 + 预计增量`」这条义务，改为「**判档**：写文件名 + 是否超档，tier 由评审当刻现量，**结论落档、数不落档**」；四层同口径收正 · 用户原话：「可以」 · 时间：2026-10-28 15:44

**本批范围由「提示词四处（纯提示词面）」扩为「四层同口径」**：

| 层 | 处 | 谁落 |
|---|---|---|
| 需求 | `docs/core/requirements/METHODOLOGY.md:84`（F-R24a 正文 + 判定句）· `:85`（F-R24b 权威载体句） | **主 agent（父侧）** |
| 需求 | `docs/core/requirements/ENGINEERING-MODE-V2.md:270`（模块设计内容 ③）· `:354` · `:370` | **主 agent（父侧）** |
| 设计 | `docs/core/design/ADVISOR-CONVERGENCE.md` §9（`:356`–`:363`）· A-AC11（`:401`） | eng-designer |
| 设计 | `docs/core/design/DOC-DISCIPLINE.md` §3.7（`:266` ∥ `:268`） | eng-designer |
| 提示词 | `thincoder-core/prompts/persona-eng-designer.md:140` ∥ `:91` ∥ `:87` · `thincoder-core/prompts/advisor-design.md:34` | eng-coder（产品面，须 token） |

**保留不动的部分（这条需求当年的目的，一点没丢）**：

- **tier 判据照旧**：`>300` advisory ∥ `>500` 必拆 ∥ `>800` 硬限 ∥ 函数档 `300+` 行 = 第一判据 —— **全部保留，一字不改**
- **拆分计划照写**：超档档在设计里带拆分计划
- **新建档照判**：`>500` 不允许诞生
- **文档档零标注义务**：不变

**改的只有一处**：**「把量到的数抄进文档」这个动作** ⇒ 改成「**量出来只用来判档，判完就丢**」。

**★ 因果（本批的 why）**：**读数是一次测量、测量带时刻。抄进档的那一刻，它从「某刻的事实」变成「看起来像知识的一句话」；而它明天就旧 —— 今天每一个对不上的数（`1790∥1792` · `1318∥1334` · `#95` 的「delta 表失真」 · `#103` 的「26 增 / 6 删」）都出自这一条。**

### 1.10 父侧笔误更正：「三层」→「四面」（2026-10-28 16:00）

**§1.8 写的「四层」在正文里列成了三段（需求 / 设计 / 提示词）—— 数对不上列举。**

**以 `docs/core/design/DOC-DISCIPLINE.md:313` 的 D-DD16 为准，四面 =**

1. **需求档判定句**（`docs/core/requirements/METHODOLOGY.md:84` ∥ `:85` · `docs/core/requirements/ENGINEERING-MODE-V2.md:270` ∥ `:354` ∥ `:370`）
2. **设计档维度句**（`docs/core/design/ADVISOR-CONVERGENCE.md` §9 ∥ A-AC11 · `docs/core/design/DOC-DISCIPLINE.md` §3.7 · `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.30.6）
3. **提示词面**（`thincoder-core/prompts/persona-eng-designer.md` ∥ `thincoder-core/prompts/advisor-design.md`）
4. **批次档 §2 受影响文件表**（本批自身适用 —— 已删「行变」列）

**★ 第 4 面是评审 #110 的 🟡#7 逼出来的**：**设计席的规矩自己也要落在设计席自己的表上** —— 否则「不写读数」的第一份反例就是本批自己的批档。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（修正轮 4：评审 §3 轮次 3 的 🔴3 + 🟡4 逐条处置（A1/A2 改判据形为改前三句原句 · ADVISOR :17/:358 删「本档不重述」并改指 §9 抽查条 · A-DD15 后半句同为尺寸档位结论 · A5 加路径限 · 命名定「尺寸档位」避开产品档位义）；A3b 加宽扫描新显影 17 行、义务句仍 0；交付门 6 档 PASS）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试覆盖 / 验收对照 / 关键决策 / 上抛项>

### 2.0 一句话与轮次

**轮次** = initial（设计轮，零实施）。**面** = 产品码面（提示词 = 产品文本），实现归 eng-coder + designToken。**坐标口径** = 仓根相对、行号 = 2026-10-28 现盘实读。

**本批 = 删掉提示词里「要求把读数（行数 / 增量）写进设计档」的那几处。纯删除，零新增规则，零运行时行为。**

### 2.1 覆盖条目（回指台账 #1907 · 改前 / 改后逐字）

**① `thincoder-core/prompts/persona-eng-designer.md:140`**（设计档 9 项之「受影响文件表」）

改前：

```text
3. **Affected-file list** — source/test files with current line counts + expected deltas; cross-file-limit files carry a **split plan**
```

改后：

```text
3. **Affected-file list** — source/test files; cross-file-limit files carry a **split plan**
```

删 = `with current line counts + expected deltas`；留 = 「哪些档」+ 超限档带拆分计划。逐字删、零加词。

**② `thincoder-core/prompts/persona-eng-designer.md:91`**（pre-review 检查 ②）

改前：

```text
     - ② Full affected-file list + line counts?
```

改后：

```text
     - ② Full affected-file list?
```

**③ `thincoder-core/prompts/advisor-design.md` 第 8 条整块（`:34`–`:39`）**（设计评审判据 8）

改前：

```text
8. **Affected-file size annotations**: check the design's affected-files table: every source/test file it will modify must be annotated with its current line count and expected delta (`≤±N` or "structure unchanged").
   **Pure `.md` documents are exempt** from that annotation.
   **Any file crossing a code-structure tier must carry a split plan in the design** — file tier: >500 lines → proactive split review, >800 lines → must split (hard cap, no exemption channel).
   **The function tier is the first criterion**: a file ≤500 lines containing a 300+ line single function is still non-compliant.
   **Tier authority**: the code-structure criteria stated in this bullet.
   **Spot-check**: sample the annotated numbers and verify them against the files.
```

改后（7 行，较改前 +1 行——首条超 300 字符，须拆行；提示词面行宽 ≤300 是 `doc_check` 的既有判据）：

```text
8. **Affected-file size check**: every source/test file in the design's affected-files table gets its tier judged from a fresh measurement — the author's at design time, the reviewer's when it checks.
   **Neither the size nor an expected delta goes into the design document**: the conclusion does (which files cross a tier, each with its split plan).
   **Pure `.md` documents are exempt** from that tier judgment.
   **Any file crossing a code-structure tier must carry a split plan in the design** — file tier: >500 lines → proactive split review, >800 lines → must split (hard cap, no exemption channel).
   **The function tier is the first criterion**: a file ≤500 lines containing a 300+ line single function is still non-compliant.
   **Tier authority**: the code-structure criteria stated in this bullet.
   **Spot-check**: sample the table's source/test files, size each one yourself, and verify its tier claim.
```

块内三处动的逐条对位：

- 题名 `size annotations` ⇒ `size check`：被删的正是「注解」这个动作，题名留旧词会指一件不存在的事（全仓 grep `size annotations` = 只此一处字面）。
- 豁免句的 `that annotation` ⇒ `that tier judgment`：不改则指一个已删的要求（悬空指代）。
- spot-check 的对象由「已注明的数」改为「档的 tier 主张」：留旧文则指向已被删掉的数（悬空）；删掉则评审只能全表自重（见 2.2 的计量账）。

`:36`–`:37`（tier 定义）与 `:38` 的 tier 权威句一字不动。

**④ `thincoder-core/prompts/persona-eng-designer.md:87`**（写后自检第 3 道）

改前：

```text
     3. **Claims ↔ measurements**: every number and every "all / none / every" in your text is a **freshly measured reading** — a number recalled from memory or derived on paper is a claim, not a reading.
```

改后：

```text
     3. **Claims ↔ measurements**: every "all / none / every" in your text is a **freshly measured reading** — a number recalled from memory or derived on paper is a claim, not a reading.
```

删 = `every number and `（连 and）；留「all / none / every」那半与整条尾句。尾句仍指同一件事：量化断言底下那个计数必须是现量，凭记忆或纸上推算得来的计数不算读数。

### 2.2 计量账（父侧点名要算的那笔）

**问题的形**：`:34` 若改写成「评审自己量」，是否把量数从「作者 1 次」变成「每评审轮 1 次」？

| 谁 | 何时 | 现文要求 | 改后要求 |
|---|---|---|---|
| 作者（设计席） | 设计轮，1 趟 | 量全表，把「现数 + Δ」抄进设计档 | 量全表（判 tier 必须量），只落结论：哪档超限 + 拆分计划 |
| 评审 | 每评审轮 | 抽样核对档里的数 ⇒ 也要量被抽到的那几档 | 抽样自量、核设计的 tier 主张 ⇒ 量同样大小的样本 |
| 实施席（eng-coder） | 实施轮 | 无要求（其提示词零处要求核 Δ——本轮复核） | 无要求 |
| 后来读者 / 收尾 | 之后 | 读到已过期的数 | 无数可读 |

**结论：不加倍。**

- 作者那一趟本来就为判 tier 而量（不量判不出 >500 / >800）；改后同一趟只少一道「抄进档」，且修正轮不再回填过期数（档里没有会变的数）⇒ 作者面净减。
- 评审那一趟由 spot-check 的抽样界住，样本量与现文相同（现文也是抽样核对，不是全表）。
- 会变成 N 倍的只有一种写法：要求评审**全表自重**。那才是加法，本设计不取。

**由此得一条硬约束**：`:39` 不能删。删了它，评审唯一安全的做法就是全表量一遍 ⇒ 正是父侧说的陷阱；留着但改指，成本仍是一份样本。

### 2.3 设计档落点

**无 —— 本批不写任何设计档 / 需求档。**

理由：这条要求的文本只活在两份提示词里。

全仓扫 `line count` ∥ `line counts` ∥ `current line count`（不分大小写，排除 `node_modules` / `_archive` / `.thincoder`）：`docs/**` 的命中全部落在 `docs/batches/**` 的一次性批档里，设计档与需求档零命中该要求的复述。

设计档自身的既有行数表属 `#1904` 的存量账（§1.6 已明），不在本批。

### 2.4 受影响文件与测试覆盖

| 档 | 面 | 改点 | 行变 |
|---|---|---|---|
| `thincoder-core/prompts/persona-eng-designer.md` | 提示词面（产品码面） | `:87` · `:91` · `:140` 三处行内改 | ±0 |
| `thincoder-core/prompts/advisor-design.md` | 提示词面（产品码面） | 第 8 条整块（`:34`–`:39`） | +1 行（首条因行宽拆成两行） |

**测试覆盖 = 无单元测试档。**

本批零运行时行为：没有任何可执行代码路径因它改变，可断言的只有提示词正文。

而「断言某段散文在 / 不在」正是测试纪律明禁的那一类（红于一次措辞微调、证不出任何行为）。

故本批验收 = 2.5 的四条机检读数，且不引入随批单测档（收口也就没有「单测档仍在盘」这一道）。

### 2.5 验收对照（每条可跑）

**A1 · 本批两档的读数清零**

改后，两份目标提示词里 `line count` ∥ `line counts` ∥ `current line count`（不分大小写）命中 = **0**。

```text
node -e "const fs=require('fs');const f=['thincoder-core/prompts/persona-eng-designer.md','thincoder-core/prompts/advisor-design.md'];let n=0;for(const p of f)fs.readFileSync(p,'utf8').split('\n').forEach((l,i)=>{if(/line counts?|current line count/i.test(l)){n++;console.log(p+':'+(i+1))}});console.log('hits='+n)"
```

**A2 · 提示词面命中集 = 非本批的三行**（改后）

全提示词面（`thincoder-core/prompts/**`）扫同一正则，命中集 =：

- `thincoder-core/prompts/discipline-engineering.md:129`（硬限举例，不是要求）
- `thincoder-core/prompts/discipline-normal.md:78`（normal 模式「不许按行数切模块」的散文）
- `thincoder-core/prompts/discipline-normal.md:79`（normal 模式「不许压注释换行数」的散文）

三行都不在本批，一字不动。

**A3 · 未触面字节不变**

`git diff --stat` = 恰 2 档；`git diff` 的块数 = 4（`:87` ∥ `:91` ∥ `:140` ∥ 第 8 条整块），块外零改。

**A4 · 逐字对位**

改后四处文本与本节 2.1 的「改后」代码块逐字相等（`node` 行扫描 substring 断言，结果须为 4/4）。

**A5 · 既有红不背账**（读数，非闸）

- `node scripts/prompt-refs-check.mjs`（仓根）改前读数：提示词面 70 档 ∥ 代码面 475 档 ∥ 命中 **10** 条，exit 1 = 既有红。
- 那 10 条全在 `thincoder-core/tool-docs/**` 与 `thincoder-core/agent-tools/**`，零在本批两档。
- 改后要求 = **命中集与改前逐条相同**（不是「为 0」——那条红不是本批造成的，也不由本批偿还）。

### 2.6 本批不做（边界）

- 不动 `thincoder-core/prompts/discipline-engineering.md:129`（硬限举例）。
- 不动 `thincoder-core/prompts/discipline-normal.md:78` ∥ `:79`（normal 模式散文）。
- 不动任何设计档 / 需求档（本批无落点，见 2.3）。
- 不清存量读数（各档 as-of 与计数表）→ `#1904`。
- 不加任何新规则；唯一的改写是 ③ 那处（父侧授权），新文本只为让评审仍能判 tier。
- 不动 `thincoder-core/prompts/advisor-design.md` 其余判据（1–7、9–12）。
- 不动 `thincoder-core/prompts/persona-eng-designer.md` 其余条目。
- 不写修订式、不留旧句：四处的旧文由本次替换直接消失。

### 2.7 关键决策

**KD-1 · `:34` 取「作者现量判 tier、结论落档、数不落档」+ 保留 spot-check 改指。**

- 拒案㈠整条删掉：评审随即失去 tier 判据，`:36`–`:37` 的 >500 / >800 拆分要求没人核，等于把一条硬限变成一句愿望。
- 拒案㈡写成「评审自己量」且不设界：2.2 已算，那是 N 倍加法。
- 取案理由 = 量还是量一次，量到的东西不进档 ⇒ 没有可被后来人误引的旧数，也没有把 1 次变 N 次。

**KD-2 · `:140` 取最小删法。**

只删 `with current line counts + expected deltas`：本批立身之本是纯删除，「哪些档 + 超限档带拆分计划」原样留住，一个词不加。

**KD-3 · `:87` 只删 `every number and `。**

那半句治的是「全都 / 没有一个 / 每一个」这类过度声称，与读数无关；整条删会连带扔掉一个有用的约束。

**KD-4 · 判据 8 题名改 `size check`**（原 `size annotations`）。

被删的动作就是「注解」，题名留旧词会指一件不存在的事。零机制读该题名（全仓 grep = 只此一处字面）。

**KD-5 · 不设单元测试档。**

可断言面是散文，断言散文违反测试纪律；验收改由 2.5 的机检读数承担。

**KD-6 · RTM delta = 破 0 ∥ 冗余 0 ∥ 新增 0**，三问答在 2.8。

### 2.8 RTM delta（读 `test/RTM.md` 后答）

`test/RTM.md` 现为 CLI 端 21 个故事节 + VS Code ∥ Desktop 两端「尚未建立集成层」。逐问：

- **破行 = 0**：现有各行断言的全是运行时业务结果（工具结果回放 / 浏览器等待窗 / 评审超时热改 / 批档与台账门 / 收口门 / 压缩与状态行 / 跨项目读账），没有一行读提示词正文或设计档文本，本批不改变任何一行的期望值。
- **冗余 = 0**：没有哪一行因本批失去意义。
- **缺失 = 0**：唯一候选场景是「设计轮不再把行数写进设计档」。它的可观察面是模型输出与档文，不是运行时结果，没有用户可进入的业务入口可供机器断言。集成用例只从两个入口长出（产品真需要的业务场景 / 生产真发生过的问题），且断言只骑行为不骑散文，故不立行。

该场景的登账面 = 本段 + 台账 `#1907`，不另立集成行。

### 2.9 上抛项（两条，均不阻塞本批落地）

**[上抛·待裁] ① 父侧给的验收式经实跑不成立。**

§1 的验收式 =「全仓扫 `line counts` ∥ `current line count` 的命中集 = {`thincoder-core/prompts/discipline-engineering.md:129`}」。

实跑读数（排除 `node_modules` / `_archive` / `.thincoder`，不分大小写）：

- 全仓 29 行命中。
- 提示词面 6 行：`:129` 之外还有 `thincoder-core/prompts/discipline-normal.md:78`（`line counts`）与 `:79`（`line count`）。
- 档面其余 = 批档记录行 + 代码注释 / tool-docs（如 `thincoder-core/tools/patch.mjs:115`），与本批无关。

本席据此把验收改为 A1（本批两档清零）+ A2（其余命中集逐条点名，三行非本批）。

若父侧要「提示词面只余 `:129`」，须连 normal 模式那两句一起动——那两句说的是「不许按行数切模块 / 不许压注释换行数」，不是这条要求，不属本批，故未动。

**[上抛·待裁] ② spot-check 那一行的改指属 ③ 的连带，请裁是否采纳。**

它是判据 8 的末行，对象「已注明的数」被 ③ 删掉，三种处置：

- 留旧文 = 悬空指代。
- 删掉 = 评审全表自重（2.2 的 N 倍）。
- 改指 = 同一份样本量的核对（**本席取**）。

它不在 §1.3 的四行清单里，故在此点名。若父侧判它超出四处，回落形态 = 删该行并认下评审全表自重的成本。

### 2.10 读数口径补注（自检所得）

**全仓命中数 29 是「本段落盘之前」的读数。** §2 正文引用了那几句被删的原文，本段落盘后批档自身会新增若干命中行，全仓复跑不会再得 29。

**判据不受影响**：A1 与 A2 的扫描面是提示词面（`thincoder-core/prompts/**`），不读 `docs/batches/**`；A2 的三行命中集在批档变化后仍是那三行。全仓数只作 2.3 与 2.9① 的现场证据，重跑时应按「排除 `docs/batches/**`」读。

**行为零变、源码零变**：本批只改两份提示词，`src/**` 与 `thincoder-*/src/**` 零触，故无任何运行时可断言面新增。

---

### 2.11 修正轮（round 2 · 用户裁 A′ 后的四层同口径）

**轮次** = 修正轮。**范围** = 需求层五处（主 agent 笔）+ 设计层两档（本席笔）+ 提示词面四处（eng-coder 笔）。

**改的只有一件事**：把「把量到的数抄进文档」这个动作，换成「量出来只用于判档，判完就丢」。

**上一版前提作废**：2.3 的「无设计档落点」不成立。承载这条义务的活档写的是中文（`当前行数` ∥ `预计增量` ∥ `行数标注`），英文串 `line count` 扫不到。2.3 以本段为准。

**不动**（这条需求当年的目的，一点没丢）：

- tier 数值 `>300` advisory ∥ `>500` 必拆 ∥ `>800` 硬限 ∥ 函数档 `300+` 行第一判据。
- 超档档带拆分计划；新建档 `>500` 不允许诞生；文档档零义务。

### 2.12 设计层落点（本席已落盘 · 12 处）

- **`docs/core/design/ADVISOR-CONVERGENCE.md:17`**——行数标注义务 → **判档义务（现量判档、行数与增量不落档）**。
- **`:356`**——§9 题名 `受影响文件行数标注核查` → **`受影响文件判档核查`**（题名留旧词会指一件已不存在的动作）。
- **`:358`**——权威链：`判档义务（限源 / 测试文件；量出来的数只用于判档，不落档）`。
- **`:362`**——维度本体：每档是否列出 + 是否带判档结论（超档者带拆分计划）；**判据 = 结论在位**，表内行数与增量不作判据依据。
- **`:363`**——`标注数值抽查` → **`判档结论抽查`**（一份样本、逐档自行现量）；`≥300 单体函数 / >500 / >800` 三句一字不动。
- **`:401`**——A-AC11：`判档核查维度在位（结论在位、数值不作判据；抽查自量）；函数档为第一判据`。
- **`docs/core/design/DOC-DISCIPLINE.md:266`**——代码面保留句：三件 → **判档结论与拆分计划**，另两项退场。
- **`:268`**——新落笔批次档同口径：源 / 单元测试档 **不列行数与预计增量**，只列文件名 + 判档结论；文档档零判档。
- **`:313`**——D-DD16：收正落点改为 **三面同口径**（原句「提示词改之无据」已不成立）。
- **`:318`**——`不列行数标注列` → `不列行数与增量列`。
- **`:2507`**——DD-30 期望列：`.mjs` 行标注仍在 → **判档结论仍在（表内无行数与增量数值）**。旧期望与新规则相反，不改即成反证。
- **另两档同形句（原拟上抛，因门债必须同轮清）**：见 2.18 末段。

### 2.13 需求层五处改后整行（交父侧照落 · 逐字可抄）

**① `docs/core/requirements/METHODOLOGY.md:84`（F-R24a）整行**

```text
| F-R24a | 设计文档「受影响文件」表列出每个将改的源 / 测试文件并判档：档位（>300 advisory / >500 必拆 / >800 硬限）由判档人当刻现量判定，**行数与预计增量不写进设计档**；判档结论落档（哪几档超档 + 各自拆分计划）；新建 / 迁移源 / 测试文件按 >500 不允许诞生判档 | 设计文档受影响文件表列文件名且每档带判档结论（超档者带拆分计划），**表中不含行数 / 增量数值**（评审维度核查）；新建档逐档 ≤500 | 文档档零判档义务（不判档 / 不写拆分计划）；设计只判档不触发拆分执行 |
```

**② `docs/core/requirements/METHODOLOGY.md:85`（F-R24b）整行**——只改维度名，余字逐字保留

```text
| F-R24b | advisor 设计评审维度补「受影响文件判档核查」 | 权威载体 = `docs/core/design/ADVISOR-CONVERGENCE.md`（只放挂钩指针，行为语义以彼为准） | 不复制评审维度正文（D2） |
```

**③ `docs/core/requirements/ENGINEERING-MODE-V2.md:270` 整行**——只改 ③

```text
**下层 · 模块设计（Module Design）**——对应一个 Function Spec，一个模块一份，交给 coder 实现。内容：① 问题陈述 ② 方案与理由（就方案本身说清为什么这么设计——**不强制列候选对比**） ③ 受影响文件全清单（文件名 + 判档结论：哪几档超档、各自拆分计划；行数与预计增量不落档） ④ 验收标准逐条回指 Function Spec（每条可机判）。
```

**④ `docs/core/requirements/ENGINEERING-MODE-V2.md:354` 整行**

```text
  - ② 受影响文件全清单 + 判档结论（超档者带拆分计划；行数与增量不落档；文档面零判档）？
```

**⑤ `docs/core/requirements/ENGINEERING-MODE-V2.md:370` 整行**

```text
- 受影响文件全清单 + 判档结论（超档者带拆分计划）
```

### 2.14 提示词面四处（eng-coder 笔 · ①②④ 照 2.1 不动，③ 修正）

**`thincoder-core/prompts/advisor-design.md` 第 8 条整块（`:34`–`:39`）改后：**

```text
8. **Affected-file size check**: every source/test file in the design's affected-files table gets its tier judged from a fresh measurement — the author's at design time, the reviewer's at check time.
   **Neither the size nor an expected delta goes into the design document**: the conclusion does (which files cross a tier, each with its split plan).
   **Pure `.md` documents are exempt** from that tier judgment.
   **Any file crossing a code-structure tier must carry a split plan in the design** — file tier: >500 lines → proactive split review, >800 lines → must split (hard cap, no exemption channel).
   **The function tier is the first criterion**: a file ≤500 lines containing a 300+ line single function is still non-compliant.
   **Tier authority**: the code-structure criteria stated in this bullet.
   **Spot-check**: sample the table's source/test files, size each one yourself, and verify its tier claim.
```

**行变修正（原 2.4 的理由与读数作废）**：

- Δ = **+1 行**，成因 = 新增「Neither the size nor an expected delta…」一条。
- **不是行宽拆行**：改后首条实测 **199 字符**、改前同条 216 字符（`node` 计长）⇒ 未超 300。
- 原句「首条超 300 字符须拆行」作废。

**①②④ 照 2.1 的改后块逐字**：

- `thincoder-core/prompts/persona-eng-designer.md:140` 去 `with current line counts + expected deltas`。
- 同档 `:91` 去 `+ line counts`。
- 同档 `:87` 只删 `every number and `。

### 2.15 上一轮评审 10 条的处置

| # | 结论 | 处置落点 |
|---|---|---|
| 1 🔴 | 成立，已解 | 用户裁 A′ ⇒ 范围扩四层；需求层五处整行见 2.13 |
| 2 🔴 | 成立，已解 | 设计层两档 12 处见 2.12 |
| 3 🟡 | 采纳 | 验收加中文形扫描（A3），英文三式保留 |
| 4 🟡 | 采纳 | 「纯删除」撤回；③ 明写为父侧授权的改写；全批口径 = 删抄数、留判档 |
| 5 🟡 | 采纳并读数化 | 首条 199 字符 ⇒ 不拆行；Δ+1 改由新增一条解释；A4 块收为此 7 行 |
| 6 🟡 | 采纳 | 先例行见 2.16 |
| 7 🟡 | 采纳 | 勘察证据行见 2.16 |
| 8 🔵 | 采纳（射程改写） | KD-4 依据改为「活机制面零处」：`size annotations` 只 `thincoder-core/prompts/advisor-design.md:34` 一处 |
| 9 🔵 | 采纳 | A5 收成按目录限定；批档自身写入不计入 |
| 10 🔵 | 正面读数留档 | 本席复核同意；`scripts/prompt-refs-check.mjs` 本席同样未跑 ⇒ 仍记 `unverified` |

### 2.16 两条方法学行（原缺）

**最接近先例行**：先例 = `docs/batches/2026-10-28-memory-to-mechanism.md:119`–`:124`（已逐处点名同一四处）。

- **对齐** = 逐处逐字对位删除，一处一块，块外零改。
- **偏离 ①** = `thincoder-core/prompts/persona-eng-designer.md:87` 只删半句（先例写整条）：那半句治过度声称，与读数无关。
- **偏离 ②** = ③ 取改写而非整条删：整条删则 `>500 / >800` 失去核查维度，硬限变成愿望。
- **偏离 ③** = 本批扩到需求 / 设计层：A′ 前只有提示词面可动。

**勘察证据行**：查过下列六档，结论 = **有相关**（处置见 2.12 / 2.13）：

- `docs/core/requirements/METHODOLOGY.md` · `docs/core/requirements/ENGINEERING-MODE-V2.md`。
- `docs/core/design/ADVISOR-CONVERGENCE.md` · `docs/core/design/DOC-DISCIPLINE.md`。
- `docs/core/design/ENGINEERING-MODE-V2.md` · `docs/core/design/STRUCTURE-DEBT.md`。

仓外声明源未查：本批无公共标准可依，规则全在本仓。

### 2.17 验收（改后逐条可跑 · 本席已跑基线）

**A1 · 本批两档英文读数清零**：目标两档内 `line counts?` ∥ `current line count`（不分大小写）命中 = **0**。

- 现测（改前）= **3** 行：`thincoder-core/prompts/persona-eng-designer.md:91` ∥ `:140` · `thincoder-core/prompts/advisor-design.md:34`。

**A2 · 提示词面英文命中集 = 非本批三行**：

- 现测 = **6** 行：本批 3 + `thincoder-core/prompts/discipline-engineering.md:129` + `thincoder-core/prompts/discipline-normal.md:78` ∥ `:79`。
- 改后须为 **3** 行（后三行），一字不动。

**A3 · 中文形扫描（评审 #3 补的这条）**：

- 域 = `docs/{core,cli,desktop,vsc,server}/{requirements,design}/**`（排除 `_archive`）；正则 `当前行数|预计增量|行数标注`。
- 现测：需求面 **5** 行（= 2.13 五行，父侧落笔后归 0）· 设计面 **38** 行。

改后判据按类点名，不是「为 0」：

- **义务句归 0**。设计面残留同类行只有两类：`docs/core/design/ADVISOR-CONVERGENCE.md:362` 是禁止句（「行数与增量不作判据依据」）；`docs/core/design/DOC-DISCIPLINE.md` 的 17 行是 sweep 正则 / 收正表 / 禁止句。
- **存量读数载体（不动，归清账批）21 行**：`docs/core/design/AGENT-LOOP-ASYNC-POOL.md:122` ∥ `:315` ∥ `:1060` ∥ `:1276` · `docs/core/design/AGENT-LOOP-SUBAGENT.md:208` · `docs/core/design/AGENT-LOOP-UPSTREAM.md:205` · `docs/core/design/BASH-EXECUTOR-FACE.md:92` · `docs/core/design/CORE-UNIFICATION.md:496` ∥ `:537` ∥ `:551` ∥ `:573` · `docs/core/design/DOC-SYSTEM.md:308` ∥ `:317` · `docs/core/design/MANIFEST.md:193` ∥ `:742` · `docs/core/design/MODEL-BENCH.md:707` · `docs/core/design/SESSION-OBSERVABILITY.md:123` · `docs/core/design/TIMEOUT-DIGEST.md:167` · `docs/cli/design/ACP-CLIENT.md:330` · `docs/vsc/design/VSC-DEBT.md:106` · `docs/vsc/design/WEBVIEW-INPUT.md:193`。
- **机制句 1 行（上抛，见 2.18）**：`docs/core/design/AGENT-LOOP-ASYNC-POOL.md:548`。
- 参照历史树 `thincoder-cli/docs/**` ∥ `thincoder-vscode/docs/**` = 不处置面，不入判。

命令（改后复跑；`utf8` 读，不用 `findstr`）：

```text
node -e "const fs=require('fs'),p=require('path');const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?(['node_modules','.git','_archive','.thincoder'].includes(e.name)?[]:walk(p.join(d,e.name))):(e.name.endsWith('.md')?[p.join(d,e.name)]:[]));const Z=/当前行数|预计增量|行数标注/;let n=0;for(const d of ['core','cli','desktop','vsc','server'])for(const s of ['requirements','design'])for(const f of walk('docs/'+d+'/'+s))fs.readFileSync(f,'utf8').split('\n').forEach((l,i)=>{if(Z.test(l)){n++;console.log(f+':'+(i+1))}});console.log('hits='+n)"
```

**A4 · 逐字对位**：提示词四处与 2.1（①②④）∥ 2.14（③）的改后块逐字相等，`node` 行扫描 substring 断言 **4/4**。

**A5 · 未触面零改**：`git diff --stat -- thincoder-core/prompts/ docs/core/design/ docs/core/requirements/` 的改动集 ⊆ 六档：

- `thincoder-core/prompts/persona-eng-designer.md` · `thincoder-core/prompts/advisor-design.md`。
- `docs/core/design/ADVISOR-CONVERGENCE.md` · `docs/core/design/DOC-DISCIPLINE.md` · `docs/core/design/ENGINEERING-MODE-V2.md` · `docs/core/design/STRUCTURE-DEBT.md`。

批档自身 §2 / §5 写入不计入。

**A6 · 交付门**：`doc_check(mode:"gate")` 判本批触碰的设计档 ⇒ 首行 `DOC-CHECK GATE: PASS`。

- 本席读数 = **PASS（2 档全清）**：`docs/core/design/ADVISOR-CONVERGENCE.md` · `docs/core/design/DOC-DISCIPLINE.md`。

**测量账（修正后仍不加倍）**：

- 作者一趟量全表并判档（判 tier 不量判不出）——改后同一趟少一道「抄进档」。
- 评审一趟由 `docs/core/design/ADVISOR-CONVERGENCE.md:363` 的抽样界住（一份样本，不是全表）。
- 实施席无该要求：`thincoder-core/prompts/persona-eng-coder.md` 同正则零命中。
- 会变成 N 倍的只有「评审全表自重」这一种写法，本设计不取。

### 2.18 上抛与移交

**[移交·父侧笔] 需求层五处**：改后整行见 2.13。本席不写需求档（红线）。

**[上抛·待裁] 一行机制句**：`docs/core/design/AGENT-LOOP-ASYNC-POOL.md:548` 的 A-TW5「受影响文件全清单（行数标注制）」。

- 它是**旧条目的验收载体**，改它等于改别条的验收，本席未动。
- 两条路：并进本批（本席笔面，一行）∥ 另起批。
- 本席倾向并进：留一行「行数标注制」在盘上，与 2.12 的落点相反。

**[知会·本席被迫扩面]** 2.12 末两档原拟上抛，因交付门把「本次触碰过的档」一并判 ⇒ 不改则追加永远被拒。

- `docs/core/design/ENGINEERING-MODE-V2.md:60`——`按 R24a 行数标注规则标注` → `现量判档得出，判档结论落设计档，数值不落档`。
- `docs/core/design/STRUCTURE-DEBT.md:38`——`源 / 测试文件行数标注` → `源 / 测试档现量判档、结论落档`。
- 同轮清掉的既有门债：该两档 6 段**只加空行分段 / 拆一段为两段**（零语义）+ `docs/core/design/STRUCTURE-DEBT.md:39` 的悬空指针补齐目录段。

### 2.19 RTM delta（复答，结论不变）

读 `test/RTM.md`：CLI 端 21 个故事节 + VS Code ∥ Desktop 两端「尚未建立集成层」。

- **破行 = 0**：现有各行断言运行时业务结果，零行读提示词正文或设计档文本。
- **冗余 = 0**。
- **新增 = 0**：唯一候选「设计轮不再把行数写进设计档」的可观察面是模型输出与档文，不是运行时结果；集成用例只从两个入口长出，断言只骑行为不骑散文。

该场景的登账面 = 本段 + 台账 `#1907`，不另立集成行。

### 2.20 本批不做（边界）

- 不动 tier 任何数值与拆分计划要求。
- 不动需求档（父侧笔）· 不动提示词（eng-coder 笔）· 不动 `scripts/**`。
- 不清存量读数（21 行已点名）→ 清账批。
- 不动 `thincoder-core/prompts/discipline-engineering.md:129` 与 `thincoder-core/prompts/discipline-normal.md:78` ∥ `:79`。
- 不加新机制、不写修订式、不留旧句。

### 2.21 并入一笔（用户裁 · `docs/core/design/AGENT-LOOP-ASYNC-POOL.md`）

**裁定**：用户 2026-10-28 15:48「并入本批」——§2.18 的 [上抛·待裁] 一行机制句并入本批，本席笔面。

**为什么并入（用户给的判据）**：验收条目写的是「这条机制现在该是什么样」；机制变了而条目不变，那条验收就成了「要求做已废止的事」。状态档里没有「别批的条目」这种豁免——一条陈述要么是现在的真话，要么该改。

#### ① A-TW5（`docs/core/design/AGENT-LOOP-ASYNC-POOL.md:548`）

改前：

```text
| A-TW5 | 受影响文件全清单（行数标注制） | §6.30.6（现行行数 + 实测增量逐行） |
```

改后：

```text
| A-TW5 | 受影响文件全清单（判档制） | §6.30.6（逐档文件名 + 判档结论，越档者带拆分计划；量出来的数只用于判档、不落档） |
```

对位：判据名 `行数标注制` ⇒ `判档制`（被删的正是「标注」这个动作，题名留旧词会指一件已废止的事）；指针 `§6.30.6` 原位保留（用户约束 ②）；括注改 A′ 口径（用户约束 ①）。

#### ② 载体节同轮收正（§6.30.6 · `:479`–`:516`）

用户约束 ② 的后半句：只改指针不改载体，载体还是旧口径。故 §6.30.6 同轮收正。

改前题名 ∥ 方法句 ∥ 表头：

```text
### 6.30.6 受影响文件清单（R24a）

**实施后重锚 as-of 2026-09-27（实测）**：代码行读数（清单表）= 实施终态实测（`wc -l` 语义；增量 = 终态 − 设计轮现行）；文档四行 = 实施零触，保持不动。

| 文件 | 现行行数 | 实测增量 | 说明 |
```

改后：

```text
### 6.30.6 受影响文件清单（R24a · 判档）

**清单口径**：逐档列文件名与判档结论——档位由判档人当刻现量，量出来的数只用于判档、不落档；越档者带拆分计划。文档行（本档 ∕ `docs/cli/design/TUI.md` ∕ `docs/core/design/TOOLS.md` ∕ `docs/core/design/CONFIG.md` ∕ `thincoder-cli/README.md`）为 `.md` ⇒ 零判档义务。

**判档结论（现量复判）**：表内源 ∕ 测试档无一越 `>300` advisory 线，`>500` 拆档线未触及 ⇒ 无拆分计划在册；越线判据 = 职责面，逐档理由见下「拆分结论」。

| 文件 | 说明 |
```

逐行处置：18 个源 / 测试档行 + 5 个 `.md` 档行全部保留，文件名与「说明」列逐字不动；两列数值（现行行数 ∥ 实测增量）整列退场。

拆分结论六条保留，只剥掉行号读数括注（`（341 → 362，+21）` 一类）；职责面理由（无新模块职责 ∥ 无新导出族 ∥ 同族先例坐标）逐字留。

四个单测档行补注「用例族 · 随批收口删除」——本席实读该四档不在盘（单测零留存的应有形），补注使读者不把「查不到该档」当缺陷。

「说明」列的既有描述不重新核验：它是一份已收口批次的实施记录，本笔只收正口径、不改写史实；其间的代码漂移不属本批射程。

#### ③ 逐档判档读数（现量 · `wc -l` 口径 · 数不落档）

表内 15 个源 / 测试档实测无一越 `>500`；最大者恰 `500`（`thincoder-core/agent/helpers.mjs`）= 未越线（`>500` 不含 500），不触发拆分计划。`thincoder-cli/README.md` 越 `>500` 但为 `.md` ⇒ 零判档义务。四个单测档不在盘（随批删除）。

判档结论据此落档 = 无拆分计划在册。

读数口径注：先按 `split('\n').length` 量得 `helpers.mjs` = 501，与 `wc -l` 口径差一（结尾换行）；改按换行数复量得 500，结论随之由「越线」翻为「恰线」。判档结论只认 `wc -l` 口径。

#### ④ 全档三式扫描（用户点名的读数）

正则 `行数标注|现行行数|实测增量`，域 = 本档全档（1316 行）：

- 改前 = **5 处**：`:483`（§6.30.6 表头）· `:548`（A-TW5）· `:643`（§6.30.13 表头）· `:1060` · `:1276`。
- 改后 = **3 处**：`:646`（§6.30.13 表头）· `:1063` · `:1279`。

余下三处的点名与理由：

| 处 | 是什么 | 为什么本批不动 |
|---|---|---|
| `:646` | §6.30.13（阶段 2 受影响文件清单）表头 | 同形表，但**无验收条目指向它**：受影响文件的判据只有 A-TW5 一行、指向 §6.30.6；§6.30.14 的 A-TW8–A-TW13 无一指它 ⇒ 它不承载现行判据，是一份已收口批次的实施记录 |
| `:1063` | 另一节的受影响文件表 | 同上：无判据指向 |
| `:1279` | 另一节的受影响文件表 | 同上 |

**这三处不是「对的」，是「不在本批射程」**：与 §6.30.6 同形，处置权归清账批 `#1904`。本批只动「判据指向的那一份载体」——留着它，A-TW5 就指着一份要求做已废止动作的节；余下三处没有这个引信。

#### ⑤ 对 §2.17 A5 的更正（追加 · 原行不改）

A5 的改动集由六档扩为**七档**，新增 `docs/core/design/AGENT-LOOP-ASYNC-POOL.md`。判据 = `git diff --stat` 的改动集 ⊆ 该七档 ∪ 批档。

#### ⑥ 对 §2.17 A3 的口径更正（追加）

A3 的正则 `当前行数|预计增量|行数标注` **扫不到 `现行行数` / `实测增量`**——与本批 §1.7 记录的那个病同形（用窄词扫，窄词之外的承载面看不见）。本档由此漏报三行（`:646` · `:1063` · `:1279`），A3 的存量点名表须并入这三处。

本席未跑全仓加宽扫描（域外，且属清账批射程）⇒ 全仓余量记 `unverified`。

#### ⑦ 交付门读数

`doc_check(mode:"gate")` · 清单 = 本批触碰的五档设计档：

- `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` · `docs/core/design/ADVISOR-CONVERGENCE.md` · `docs/core/design/DOC-DISCIPLINE.md`
- `docs/core/design/ENGINEERING-MODE-V2.md` · `docs/core/design/STRUCTURE-DEBT.md`

读数 = 首行 `DOC-CHECK GATE: PASS`，0 段命中。

#### ⑧ 本笔边界（不做）

不动 tier 数值 · 不动提示词 · 不动需求档 · 不动 §6.30.13 ∥ `:1063` ∥ `:1279` · 不动别档 · 不重新判已收口批次的实施史实。

#### ⑨ 自查更正（2.21 ③ 的计数）

2.21 ③ 首句「表内 15 个源 / 测试档实测」计数错，更正为 **14 个**。

对账：§6.30.6 表内源 / 测试档行 = **18**；其中 4 个单测档不在盘（随批收口删除）⇒ 实量 **14**；本席的量数脚本跑了 15 条路径 = 那 14 条 + `thincoder-cli/README.md`（`.md`，另计入零判档义务那一类，不是源 / 测试档）。

结论不变：14 档实测无一越 `>500`；最大者 `thincoder-core/agent/helpers.mjs` 恰 `500`（未越线）。判档结论仍 = 无拆分计划在册。

### 2.22 修正轮 3（评审 §3 轮次 2 · 15 条逐条处置）

**轮次** = 修正轮（逐号改，只改本段点名的面）。**范围** = 设计层四档 + 提示词层最终逐字 + 需求层逐字（交父侧）。

**本段起为唯一现行面**：§2.0 的「纯删除」· §2.3 的「无落点」· §2.4 的表 · §2.5 与 §2.17 的验收集 · §2.13 的需求层五行 · §2.12 的措辞——与本节并存时一律读本节。

**口径（取代 §2.0 首句）**：本批 = **以删为主 + 两处经父侧授权的补写**——③ 第 8 条改写（父侧裁）· 提示词两处补入「结论义务」半句（A′ 裁定「结论落档」的落地）。**零运行时行为、零新机制**。

#### 处置表（号 → 改了什么 → file:line）

| # | 结论 | 处置 |
|---|---|---|
| 1 🔴 | 成立，已改设计层 | `docs/core/design/ADVISOR-CONVERGENCE.md:362` 判据改**两条并列**：① 结论在位 ② 表内不出现行数 / 增量数值——**出现即报**；删「写与不写都不加分」。需求档 F-R24a 判定句按父侧裁**保留不动** |
| 2 🟡 | 采纳 | 提示词最终逐字进 §2.23③（含结论义务 + 不写数），不止「删到哪」 |
| 3 🟡 | 采纳 | 形态定死 = **表级一句**（越档者逐档拆分计划）：`docs/core/design/ADVISOR-CONVERGENCE.md:362`；`docs/core/design/AGENT-LOOP-ASYNC-POOL.md:483` 改题「档位结论（表级一句 · 现量复判）」，与该形态一致 |
| 4 🟡 | 采纳，改法不同于建议 | 不统一数值，改「本层不重述数值」：`docs/core/design/ADVISOR-CONVERGENCE.md:17` 的数值枚举改为指向纪律层；`:363` 三句一字不动；需求层五行同步去数值枚举。理由见 §2.26① |
| 5 🟡 | 采纳 | 验收集收成一套 = §2.25；§2.5 / §2.17 的 A 集作废 |
| 6 🟡 | 采纳 | A3 基线本席重测（§2.25 A3），并点名本批自己改写 / 新增的命中行归属 |
| 7 🟡 | 采纳 | 本批受影响文件表按新口径重述 = §2.24（删「行变」列，加「档位结论」列） |
| 8 🟡 | 采纳（择「改名」） | 机制侧「判档」全改「档位判定 / 档位结论」：`docs/core/design/ADVISOR-CONVERGENCE.md` 6 行（`:17` ∥ `:356` ∥ `:358` ∥ `:362` ∥ `:363` ∥ `:401`）· `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` 10 行（`:479` ∥ `:481` ∥ `:483` ∥ `:505`–`:509` ∥ `:511` ∥ `:551`）· `docs/core/design/ENGINEERING-MODE-V2.md:60` · `docs/core/design/STRUCTURE-DEBT.md:38` · `docs/core/design/DOC-DISCIPLINE.md` `:266` ∥ `:268` ∥ `:2507`；doc_check 义的「判档」（同档 13 行）一字不动。复核读数 = 机制四档「判档」余 **0 / 0 / 0 / 0** |
| 9 🟡 | 采纳 | `docs/core/design/DOC-DISCIPLINE.md:262` 改「两列**整列退场**，`.md` 行也不填 `—`」，与 `:266` ∥ `:268` 同形；连带 `:2088`（A-DD15 摘要同句）同改 |
| 10 🟡 | 采纳 | 四层枚举写死一处 = `docs/core/design/DOC-DISCIPLINE.md:313`（D-DD16）：① 需求档判定句 ② 设计档维度句 ③ 提示词面 ④ 批次档 §2 表。§1.8 的「三层」以该枚举为准（§1 = 主 agent 笔，本席不改） |
| 11 🟡 | 采纳 | 「纯删除」作废（本节首段）；口径见上 |
| 12 🔵 | 采纳 | KD-4 射程改「**活机制面**（提示词 ∥ 设计档 ∥ 需求档）零处」；仓面（批档、dist 产物）不主张零 |
| 13 🔵 | 采纳 | §2.3「无落点」作废，落点 = §2.12 + 本节 |
| 14 🔵 | 采纳 | `docs/core/design/AGENT-LOOP-ASYNC-POOL.md:643` 补一句口径说明（本节是已收口批次记录，现行口径见 §6.30.6），表本身不改 |
| 15 🔵 | 本席标注 | 范围外读数一律 `unverified`（提示词改后形 / RTM / `scripts/prompt-refs-check.mjs` / `git diff` 集） |

#### 2.23 四层最终逐字

**① 设计层（本席已落盘）**

| 处 | 改后要点 |
|---|---|
| `docs/core/design/ADVISOR-CONVERGENCE.md:17` | 档位义务（现量判定档位、行数与增量不落档）+ 判据数值 = 纪律层（本档不重述） |
| 同档 `:356` | 题名 = 受影响文件**档位**核查 |
| 同档 `:358` | 权威链：档位义务与档位判据 = 纪律层 |
| 同档 `:362` | 形态 = 表级一句；两条并列判据（结论在位 ∧ 数值出现即报）；`.md` 零档位义务 |
| 同档 `:363` | 档位结论抽查（一份样本、逐档自量）；三句 tier 判据一字不动 |
| 同档 `:401` | A-AC11 = 档位核查维度在位（结论在位 ∧ 表内无数值；抽查自量） |
| `docs/core/design/DOC-DISCIPLINE.md:262` | 取消面：两列整列退场，`.md` 行不填 `—` |
| 同档 `:266` | 保留面：源 / 测试档的档位结论与拆分计划，表级一句 |
| 同档 `:268` | 批次档同口径：表级一句档位结论、不列行数与预计增量 |
| 同档 `:313` | D-DD16 = 四面同口径枚举 |
| 同档 `:318` | 本节自适用：档位结论（表级一句）= 无源 / 测试档 ⇒ 无越档 |
| 同档 `:2088` | A-DD15 摘要同句改为整列退场 |
| 同档 `:2507` | DD-30 期望列 = 档位结论仍在（表级一句 + 越档者拆分计划） |
| `docs/core/design/AGENT-LOOP-ASYNC-POOL.md:479` ∥ `:481` ∥ `:483` ∥ `:505`–`:509` ∥ `:511` ∥ `:551` | 题名 / 清单口径 / 表级结论 / 五个 `.md` 行 / 拆分理由 / A-TW5 全改档位制 |
| 同档 `:643` | §6.30.13 口径说明（旧表形不作现行样式引用） |
| `docs/core/design/ENGINEERING-MODE-V2.md:60` · `docs/core/design/STRUCTURE-DEBT.md:38` | 同口径改词 |

**② 需求层（交父侧 · 逐字可抄）**

```text
| F-R24a | 设计文档「受影响文件」表列出每个将改的源 / 测试文件并判定档位：档位判据 = 纪律层代码结构判据节（本行不重述数值），由设计席当刻现量判定、评审轮现量复核；**行数与预计增量不写进设计档**；档位结论以一句表级结论落档（越档者逐档带各自拆分计划）；新建 / 迁移源 / 测试文件按同一判据判定（硬限不允许诞生） | 设计文档受影响文件表列文件名 + 一句表级档位结论（越档者逐档带拆分计划），**表中不含行数 / 增量数值**（评审维度核查）；新建档档位结论在位 | 文档档零档位义务（不定档位 / 不写拆分计划）；设计只判定档位、不触发拆分执行 |
| F-R24b | advisor 设计评审维度补「受影响文件档位核查」 | 权威载体 = `docs/core/design/ADVISOR-CONVERGENCE.md`（只放挂钩指针，行为语义以彼为准） | 不复制评审维度正文（D2） |
```

`docs/core/requirements/ENGINEERING-MODE-V2.md:270` 整行：

```text
**下层 · 模块设计（Module Design）**——对应一个 Function Spec，一个模块一份，交给 coder 实现。内容：① 问题陈述 ② 方案与理由（就方案本身说清为什么这么设计——**不强制列候选对比**） ③ 受影响文件全清单（文件名 + 一句表级档位结论：越档者逐档带拆分计划；行数与预计增量不落档） ④ 验收标准逐条回指 Function Spec（每条可机判）。
```

同档 `:354` 整行：

```text
  - ② 受影响文件全清单 + 一句表级档位结论（越档者逐档带拆分计划；行数与增量不落档；文档面零档位义务）？
```

同档 `:370` 整行：

```text
- 受影响文件全清单 + 一句表级档位结论（越档者逐档带拆分计划）
```

**③ 提示词层（eng-coder 笔 · 最终逐字，四处）**

`thincoder-core/prompts/persona-eng-designer.md:140`：

```text
3. **Affected-file list** — source/test files + one tier-conclusion line (which files cross a tier, each with a **split plan**); no line counts or expected deltas in the doc
```

同档 `:91`：

```text
     - ② Full affected-file list + its tier conclusion (no counts or deltas)?
```

同档 `:87`：只删 `every number and `，其余逐字保留（旧文见 §2.1④）。

`thincoder-core/prompts/advisor-design.md` 第 8 条整块（`:34` 起，7 行）：

```text
8. **Affected-file tier check**: every source/test file in the design's affected-files table gets its tier judged from a fresh measurement — the author's at design time, the reviewer's at check time.
   **Neither the size nor an expected delta goes into the design document**: the conclusion does — one line naming which files cross a tier, each with its split plan.
   **Pure `.md` documents are exempt** from that tier judgment.
   **Any file crossing a code-structure tier must carry a split plan in the design** — file tier: >500 lines → proactive split review, >800 lines → must split (hard cap, no exemption channel).
   **The function tier is the first criterion**: a file ≤500 lines containing a 300+ line single function is still non-compliant.
   **Tier authority**: the code-structure criteria stated in this bullet.
   **Spot-check**: sample the table's source/test files, size each one yourself, and verify the conclusion line against them.
```

逐行宽度由 `doc_check` 的提示词面行宽判据在实施轮 gate 判；本席未逐行量该七行 ⇒ 不主张「零超宽」，记 `unverified`。

**④ 批次档层**：本批受影响文件表 = §2.24（本节即该口径的首个适用实例）。

#### 2.24 本批受影响文件（新口径 · 无行变列）

| 档 | 面 | 改动点 | 档位结论 |
|---|---|---|---|
| `thincoder-core/prompts/persona-eng-designer.md` | 提示词面（产品码面） | `:87` ∥ `:91` ∥ `:140` 三处行内改 | `.md` ⇒ 零档位义务 |
| `thincoder-core/prompts/advisor-design.md` | 提示词面（产品码面） | 第 8 条整块改写 | `.md` ⇒ 零档位义务 |
| `docs/core/design/ADVISOR-CONVERGENCE.md` | 设计 | 6 处 | 同上 |
| `docs/core/design/DOC-DISCIPLINE.md` | 设计 | 7 处 | 同上 |
| `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` | 设计 | 11 处 | 同上 |
| `docs/core/design/ENGINEERING-MODE-V2.md` | 设计 | 1 处 | 同上 |
| `docs/core/design/STRUCTURE-DEBT.md` | 设计 | 1 处 | 同上 |

**档位结论（表级一句）**：表内 7 档全为 `.md`，无源 / 测试档、无函数可判 ⇒ 无越档、无拆分计划在册。

#### 2.25 唯一现行验收集（A1–A7）

**A1 · 提示词两档英文读数清零**（改后，eng-coder 落笔后跑）：目标两档 `line counts?` ∥ `current line count`（不分大小写）命中 = **0**。本席现测基线 = **3**：`thincoder-core/prompts/persona-eng-designer.md:91` ∥ `:140` · `thincoder-core/prompts/advisor-design.md:34`。

**A2 · 提示词面英文命中集 = 非本批三行**：现测 = **6**；改后须 = **3**（`thincoder-core/prompts/discipline-engineering.md:129` · `thincoder-core/prompts/discipline-normal.md:78` ∥ `:79`，一字不动）。

**A3 · 中文形扫描（按类点名，不判「为 0」）**：域 = `docs/{core,cli,desktop,vsc,server}/{requirements,design}/**`（排除 `_archive`），正则 `当前行数|预计增量|行数标注`。

- 本席现测（本节落盘后）：需求面 **2** 行（= §2.23② 待父侧落的 `docs/core/requirements/ENGINEERING-MODE-V2.md:270` ∥ `docs/core/requirements/METHODOLOGY.md:84`，落笔后归 0）· 设计面 **38** 行。
- 设计面 38 行按类点名：**义务句（要求作者写数）= 0**；表格表头 / 存量读数载体 **21** 行 → 清账批。
- 余 **17** 行全在 `docs/core/design/DOC-DISCIPLINE.md`：sweep 正则 / 收正表 / 取消面与保留面的禁止句 / 本节自述——属机制正文、非义务句。

存量读数载体 21 行（清账批，本批不动）：

```text
docs/core/design/AGENT-LOOP-ASYNC-POOL.md:122 · :315 · :1064 · :1280
docs/core/design/AGENT-LOOP-SUBAGENT.md:208 · docs/core/design/AGENT-LOOP-UPSTREAM.md:205
docs/core/design/BASH-EXECUTOR-FACE.md:92
docs/core/design/CORE-UNIFICATION.md:496 · :537 · :551 · :573
docs/core/design/DOC-SYSTEM.md:308 · :317 · docs/core/design/MANIFEST.md:193 · :742
docs/core/design/MODEL-BENCH.md:707 · docs/core/design/SESSION-OBSERVABILITY.md:123
docs/core/design/TIMEOUT-DIGEST.md:167 · docs/cli/design/ACP-CLIENT.md:330
docs/vsc/design/VSC-DEBT.md:106 · docs/vsc/design/WEBVIEW-INPUT.md:193
```

- 口径更正（承 §2.21⑥）：本正则扫不到「现行行数 / 实测增量」，全仓余量记 `unverified`。

**A4 · 逐字对位**：提示词四处改后与 §2.23③ 逐字相等（`node` 行扫描 substring 断言），判据 = **4/4**。

**A5 · 未触面零改**：`git diff --stat` 改动集 ⊆ **七档**（§2.24 表）∪ 批档自身；批档 §2 / §5 写入不计入。

**A6 · 交付门**：`doc_check(mode:"gate")` 判本批触碰的**五档设计档** ⇒ 首行 `DOC-CHECK GATE: PASS`。

**A7 · 档位结论在位（自适用）**：本批设计 / 批次档的受影响文件表带一句表级档位结论、表内无行数 / 增量数值——判据 = §2.24 表与 §2.23① 落点表可核读；`.md` 全档 ⇒ 结论 = 「无越档、无拆分计划」。

#### 2.26 自检结论与读数

**① 为什么第 4 条不统一数值**：数值在本仓有**两族并存**。

族一 = `300 / 500`：`docs/core/requirements/METHODOLOGY.md:44`（F3-1）∥ `docs/core/requirements/ENGINEERING-MODE-V2.md:670`（F12）∥ `docs/core/requirements/STRUCTURE-DEBT.md:32`–`:33`（N-SD1 / N-SD2）。

族二 = `500 / 800`：`thincoder-core/prompts/advisor-design.md:36` ∥ `docs/core/design/ADVISOR-CONVERGENCE.md:363`。

两族都是现行文本，**用户裁「tier 数值一字不改」**；机制文本重述任何一族都与另一族读起来相反 ⇒ 本层**只指纪律层，不重述**（D2：判据单源）。两族本身的张力 = 既有面、不属本批，见 §2.27 知会。

**② 四层一次摆（同一件事 = 判定档位、结论落档、数不落档）**：

- 需求层（§2.23②）：档位判据指纪律层 + 一句表级结论 + 表中无数值（评审维度核查）。
- 设计层（§2.23①）：`:362` 两条并列判据（结论在位 ∧ 数值出现即报）+ 形态 = 表级一句。
- 提示词层（§2.23③）：作者现量判档、结论一行、无数值进档（`advisor-design` 第 8 条）；设计席 9 项之 3 与预检 ② 同口径。
- 批次档层（§2.24）：本节自适用，表内无行变列。

**结论**：四层说的是同一件事，判据都指向同一处（纪律层档位判据）；「数值在场时怎么办」只有一种答法 = **报**（`docs/core/design/ADVISOR-CONVERGENCE.md:362` 与 F-R24a 判定句同向）。

**③ 三交叉自检**：① 本节引用的 `§N` 均在档（§2.22–§2.28 + 承引 §2.1 / §2.12 / §2.21）；② 表行数与正文声称对得上（§2.24 = 7 行、正文亦称七档；A3 分类 21 + 17 = 38 = 现测）；③ 断言带现测读数或标 `unverified`。

#### 2.27 上抛与移交

**[移交·父侧笔] 需求层五行**：§2.23②（F-R24a / F-R24b / `docs/core/requirements/ENGINEERING-MODE-V2.md` `:270` ∥ `:354` ∥ `:370`）。

**[移交·eng-coder 笔] 提示词四处**：§2.23③。

**[知会·父侧] 既有张力一条**：tier 数值两族并存（§2.26①），本批不处置；若要收敛成一族，须另起批并请用户裁。

**[知会·父侧] §1 段一行待随动**：§1.8 的「三层」与 §2 的「四层」以 `docs/core/design/DOC-DISCIPLINE.md:313` 的四面枚举为准（§1 = 主 agent 笔）。

#### 2.28 本批不做（边界，承 §2.20 全部，另加）

- 不动 tier 任何数值（两族皆不动）。
- 不动 doc_check 义下的「判档」词面（`docs/core/design/DOC-DISCIPLINE.md` 13 行）。
- 不清存量读数（A3 的 21 行）→ 清账批；不处置两族数值张力。
- 不动需求档（父侧笔）· 不动提示词正文（eng-coder 笔）· 不动 `scripts/**`。

#### 2.29 自查更正（§2.25 A3 的计数）

**§2.25 A3 报的设计面 38 行有误，更正为 39 行**（`改后` 现测；`改前` = 40 行——本批 `docs/core/design/ADVISOR-CONVERGENCE.md:362` 由「行数与预计增量不作判据依据」改为「行数 / 增量数值」后不再命中本正则，故减 1）。

**逐类对账**（同一正则、同一域，同轮复跑）：

- 存量读数载体 / 表头 **21** 行（§2.25 A3 已逐处点名）——清账批。
- `docs/core/design/DOC-DISCIPLINE.md` **18** 行（原记 17；`:2088` 改了「两列填 `—`」半句，但同句后段仍带「当前行数 + 预计增量 + 拆分计划」字面 ⇒ 仍命中，不改计数）。
- 21 + 18 = **39** = 现测。义务句仍为 **0**（结论不变）。

**三交叉自检第 2 项（表行数 ↔ 总额）由此关合**：本节此前的「38」是纸上相加（21 + 17），不是读数；现改按复跑读数落。

**提示词七行宽度已现量**（更正 §2.23③ 的 `unverified`）：`thincoder-core/prompts/advisor-design.md` 第 8 条七行 = **199 / 166 / 63 / 192 / 129 / 73 / 125** 字符，全部 ≤300；`thincoder-core/prompts/persona-eng-designer.md:140` = **173**、`:91` = **77**。⇒ 实施轮不引入超宽行（判据 = `doc_check` 提示词面行宽），本项从 `unverified` 升为**现量在位**。

### 2.30 修正轮 4（评审 §3 轮次 3 · 父侧裁定逐条落地）

**轮次** = 修正轮。**本段起为唯一现行面**：命名（§2.22–§2.29 的「档位」）与验收集形状（§2.25 的 A1 / A2 / A5）由本节取代；判据内容不变。

**口径（不变）**：删的只是「把量到的数抄进档」这个动作。尺寸档位照判，结论落档，数不落档；tier 数值与拆分计划一字不动。

**命名链条**：判档 → 档位判定 → **尺寸档位判定 / 尺寸档位结论**（本轮定名，理由见下 #7）。

#### ① 处置表（号 → 改了什么 → file:line）

| # | 裁定 | 处置 | 落点 |
|---|---|---|---|
| 1 🔴 | 改判据，不改文本 | A1 / A2 的判据形换成「改前三句原句」；提示词正文一字未动 | 本节 ② |
| 2 🔴 | 删「不重述」 | 尺寸档位义务仍归纪律层；**删掉「数值 = 纪律层」与「本档不重述」两处断言**，判据数值改指本节 §9 抽查条（该条确实载数值） | `docs/core/design/ADVISOR-CONVERGENCE.md:17` · 同档 `:358` |
| 3 🔴 | 改后半句 | A-DD15 后半句由「当前行数 + 预计增量 + 拆分计划」改为「**尺寸档位结论与拆分计划**抽样 ≥3 档仍在」 | `docs/core/design/DOC-DISCIPLINE.md:2088` |
| 4 🟡 | 加路径限 | A5 收成 `git diff --stat -- thincoder-core/prompts/ docs/core/design/`（需求层两档不参与） | 本节 ③ |
| 5 🟡 | 写可核判据 | 「四面同口径」的可核判据 = **需求层五行落盘后逐字 = §2.23②** | 本节 ③ |
| 6 🟡 | 改落点 | 判据数值落点 = `docs/core/design/ADVISOR-CONVERGENCE.md` §9 抽查条 ∥ `thincoder-core/prompts/advisor-design.md` 第 8 条的 tier 三行；不再指「纪律层代码结构判据节」（那节答不出 500 / 800） | `docs/core/design/ADVISOR-CONVERGENCE.md:358` · 本节 ④ |
| 7 🟡 | 二选一取前者 | 新名加限定词 **尺寸**，避开「产品档位」撞义 | 本节 ③ 命名行 + 全批改名 |

**连带改名（同一件事的收口，逐处已在盘）**：

- `docs/core/design/ADVISOR-CONVERGENCE.md:356` ∥ `:362` ∥ `:363` ∥ `:401`——题名 / 维度本体 / 抽查条 / A-AC11 同步改「尺寸档位」。
- `docs/core/design/AGENT-LOOP-ASYNC-POOL.md:479` ∥ `:481` ∥ `:483` ∥ `:505`–`:509` ∥ `:511` ∥ `:551` ∥ `:643`——同口径。
- `docs/core/design/DOC-DISCIPLINE.md:170` ∥ `:172`——§3.3 题名与登记句改「尺寸档位」（原「档位结论」与既有「尺寸档登记」同义，加限定词后与产品档位不再同名）。
- 同档 `:266` ∥ `:268` ∥ `:318` ∥ `:2507`——同口径改词。
- `docs/core/design/ENGINEERING-MODE-V2.md:60` · `docs/core/design/STRUCTURE-DEBT.md:38`——同口径改词。

**doc_check 义的「判档」一字未动**（`docs/core/design/DOC-DISCIPLINE.md` 的 13 行：`:1189` · `:1222` · `:1248` · `:1256` · `:1383` · `:1387` · `:1402` · `:1415` · `:1465` · `:1474` · `:1545` · `:1568` 等）——两个义自此不同名。

#### ② A1 / A2 新形（父侧裁定：改判据，不改提示词）

**判据测的是「要求写数的那句还在不在」，不是 `line counts` 这个串在不在。** 故判据 = 改前三句原句，命中须为 **0**：

```text
with current line counts + expected deltas
+ line counts
annotated with its current line count and expected delta
```

**A1（本批两档）**：上面三句在 `thincoder-core/prompts/persona-eng-designer.md` ∥ `thincoder-core/prompts/advisor-design.md` 的命中 = **0**。

- **现测（= 改前态，提示词 = eng-coder 笔，本轮未动）= 3**：
  - `thincoder-core/prompts/persona-eng-designer.md:91`（第 2 句）
  - `thincoder-core/prompts/persona-eng-designer.md:140`（第 1 句）
  - `thincoder-core/prompts/advisor-design.md:34`（第 3 句）

**A2（提示词面全域）**：同一三句在 `thincoder-core/prompts/**` 的命中 = **0**（改后）。

- 现测 = **3**（同上三行；那三行之外提示词面零命中）⇒ 实施后须归 0。
- 对照：**旧形**（`line counts?` ∥ `current line count` 不分大小写）现测 = **6** —— 除本批三行外还命中 `thincoder-core/prompts/discipline-engineering.md:129` · `thincoder-core/prompts/discipline-normal.md:78` ∥ `:79`。旧形改后恒为 3（本批 `:140` 改后句含 `no line counts`），**这就是父侧判它恒红的成因**；旧形作废。

**★ 现测与父侧预期的差额（据实报）**：父侧记「应 = 4 命中」，实测 **3**。第四处 `thincoder-core/prompts/persona-eng-designer.md:87` 的原句是「every number and every "all / none / every"…」，**不含任何行数串**，故不落在这三句里；它的删除由 A4 逐字对位覆盖（`every number and ` 消失）。

#### ③ 验收集（本节为唯一现行集，取代 §2.25 的 A1 / A2 / A5 形）

**A1 / A2** = ② 所述（判据 = 三句原句；现测 3 / 3；改后 0 / 0）。

**A3 · 中文形扫描（按类点名，不判「为 0」）**：域 = `docs/{core,cli,desktop,vsc,server}/{requirements,design}/**`（排除 `_archive`）。

- 正则三式（`当前行数|预计增量|行数标注`）**现测**：需求面 **2** 行（= §2.23② 待父侧落的两行，落笔后归 0）· 设计面 **38** 行（上轮记 39；本轮 A-DD15 改了后半句，该行不再命中本正则 ⇒ 减 1，逐行对得上）。
- 设计面 38 行分类：**义务句（要求作者写数）= 0** · 存量读数载体 / 表头 = 21 行（清账批，本节 ⑤ 已点名） · 余 17 行全在 `docs/core/design/DOC-DISCIPLINE.md`（sweep 正则 / 收正表 / 取消面与保留面的禁止句 / §3.3 自述）——机制正文，非义务句。

**A3b · 加宽扫描（承上轮 🔵#9 的覆盖缺口）**：正则加两式 `现行行数|实测增量`（旧窄词之外的承载面，正是 §1.7 记的那个病）。

- **现测 = 17 行新显影**，逐处属「存量读数载体 / 表头 / 报告面 as-of」，无一为义务句：`docs/core/design/AGENT-LOOP-ASYNC-POOL.md:647` · `docs/core/design/DESIGN-TOKEN-SETTLEMENT.md:226` ∥ `:386` · `docs/core/design/LEDGER.md:251` ∥ `:347` ∥ `:409` ∥ `:503` ∥ `:651` ∥ `:1057` · `docs/core/design/PROMPT-SYSTEM.md:788` ∥ `:1395` ∥ `:1476` ∥ `:1618` ∥ `:1797` · `docs/core/design/TOOLS.md:1758` · `docs/core/design/DOC-DISCIPLINE.md:1182` ∥ `:1423`。
- 结论不变：**义务句 = 0**；这 17 行归清账批，本批不动。

**A4 · 逐字对位**：提示词四处与 §2.23③ 逐字相等（`node` 行扫描 substring 断言）⇒ **4/4**。

**A5 · 未触面零改（加路径限）**：`git diff --stat -- thincoder-core/prompts/ docs/core/design/` 的改动集 ⊆ **五档设计档 + 两档提示词**（= §2.24 的七档）；需求层两档在路径限之外，父侧同批落笔不把这判据打红。

**A6 · 交付门**：`doc_check(mode:"gate")` 判本批触碰的**五档设计档** ⇒ 首行 `DOC-CHECK GATE: PASS`。

**A7 · 自适用**：本批受影响文件表 = §2.24（七档全 `.md` ⇒ 零尺寸档位义务；表内无行数 / 增量数值；表级结论 = 无越档、无拆分计划）。

#### ④ 交父侧：需求层五行（承 §2.23② · 仅判据落点按 #6 改，余字逐字不动）

**F-R24a 行内「档位判据 = 纪律层代码结构判据节（本行不重述数值）」改为**：

```text
档位判据数值 = `docs/core/design/ADVISOR-CONVERGENCE.md` §9「尺寸档位结论抽查」条 ∥ 设计评审提示词第 8 条的 tier 三行（本行不重述数值）
```

**其余四行（F-R24b · `docs/core/requirements/ENGINEERING-MODE-V2.md:270` ∥ `:354` ∥ `:370`）逐字同 §2.23②，仅维度名「判档」随本批改为「尺寸档位」**。

**「四面同口径」的可核判据（承 #5）= 上述五行落盘后逐字 = 本节 ④ + §2.23②**。父侧落笔前，本项按现盘读「三面成立、需求层待落」（事实，不是缺陷）。

**需求面现存的另外两行中文形命中**（A3 的 2 行）就落在这五处里；落笔后归 0。

#### ⑤ 本轮没做的（边界，承 §2.20 / §2.28）

- 不动提示词正文（eng-coder 笔，含 §2.23③ 的逐字）、不动需求档（父侧笔）、不动 tier 数值、不动 `scripts/**`。
- 不清存量读数（A3 的 21 行 + A3b 的 17 行）→ 清账批；不处置 tier 两族数值张力（§2.26①）。
- `docs/core/design/AGENT-LOOP-ASYNC-POOL.md:646`（§6.30.13 表头）与 `docs/core/design/LEDGER.md` 的「档位结论」义照旧——前者已带口径说明、后者的「档位结论」与本批新名同义（同义同件，不加限定词不撞义）。
- **上轮 🔵 三条的处置**：🔵#8（本节读数属记录面 as-of，不作样式引用）· 🔵#10 / 🔵#11 为正面读数与范围声明，无需动作；🔵#9 已由 A3b 承接。

#### ⑥ 自查（三交叉）

- **引用集 ↔ 标题集**：本节引用的 `§2.20` · `§2.22`–`§2.29` · `§3.3` · `§3.7` · `§9` · `§3.15` 均在档（`§9` = `docs/core/design/ADVISOR-CONVERGENCE.md` §9；`§3.3` / `§3.7` / `§3.15` = `docs/core/design/DOC-DISCIPLINE.md`）。
- **表行 ↔ 合计**：处置表 7 行 = 🔴3 + 🟡4，与评审轮次 3 的计数一致；A3 分类 21 + 17 = 38 = 现测；A3b 17 行逐处点名 = 计数的 17。
- **断言 ↔ 读数**：A1 / A2 的 3 / 3 / 6、A3 的 2 / 38、A3b 的 17 全为本轮现测（`node` 扫描，utf8 读）；未跑的一律未主张。

## §3 设计评审（评审子代理）
**状态行**：评审通过（第 4 轮：上轮 🔴3 全部 Fixed，新出 🔴0（🟡4 · 🔵4））



### 轮次 1（评审子代理）

**评审对象** = `docs/batches/2026-10-28-prompt-readout-purge.md` §2（design，待评审）。范围外未读源码面；提示词 / 需求 / 设计档按证据需要实读盘面（每条附 `file:line`）。无项目标准档、无文档地图 ⇒ 方法学按 Project Guide + 评审判据，Document ownership 按 AGENTS.md「Docs conflict → stop and report」判。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Requirements / Document ownership | 🔴 | 本批立身前提不成立：`docs/batches/2026-10-28-prompt-readout-purge.md:187`「这条要求的文本只活在两份提示词里」（同 `:59`「设计档里有这条规矩 = 0」）。需求层仍在逐字要求同一件事——`docs/core/requirements/METHODOLOGY.md:84`（F-R24a：「设计文档「受影响文件」表对每个将改的源 / 测试文件标注 `当前行数 + 预计增量`」，判定句「设计文档受影响文件表含当前行数 + 预计增量（评审维度核查）」）· `docs/core/requirements/ENGINEERING-MODE-V2.md:270`（模块设计内容 ③「受影响文件全清单（源/测试标当前行数 + 预计增量）」）· 同档 `:354` ∥ `:370`（pre-review 检查 ② 与证据行）。设计只改提示词、三处零触 ⇒ 落地后需求档要求写、提示词禁止写，同一机制两处相反，且 F-R24a 的判定句随之为红。 | 本批须在两条路里取一条并写清：① 同轮把 `docs/core/requirements/METHODOLOGY.md:84` ∥ `:85`（F-R24b 指向的权威）与 `docs/core/requirements/ENGINEERING-MODE-V2.md:270` ∥ `:354` ∥ `:370` 一并收正（需求档 = 主 agent 笔面，逐字给改后形 + 谁落）；② 若用户裁定只动提示词，则 §2 把「需求层暂留相反判据 + 到期条件 + 清账方」写成显式偏离并请裁。无论哪条，`:187` 与 §1.5 的「= 0」先改掉。 |
| 2 | Document ownership | 🔴 | 同一机制两处描述相反（机制级）：`docs/core/design/ADVISOR-CONVERGENCE.md:362` 把该评审维度逐字定为「每个将修改的源 / 测试文件标注 `当前行数 + 预计增量`」，`:358` 明写「核查维度行为语义 = 本节；执行实现 = 设计评审提示词的对应维度」，`:401` A-AC11 又把「行数标注核查维度在位」写成验收条；本批 ③ 改成「**Neither the size nor an expected delta goes into the design document**」（批档 `:130`）。另一处同形：`docs/core/design/DOC-DISCIPLINE.md:266`「源 / 单元测试档（`.mjs` / `.cjs`）的「当前行数 + 预计增量 + 拆分计划」三件——**不得误删**」∥ `:268`（新落笔批次档保留该两列）。 | 在 `docs/core/design/ADVISOR-CONVERGENCE.md` §9（`:356`–`:363`）+ A-AC11 与 `docs/core/design/DOC-DISCIPLINE.md` §3.7（`:266` / `:268`）给出改后形或显式收窄（形 = 「tier 在评审当刻自量、结论不落档」），使提示词与承载档说的是同一件事；只改提示词会把第二权威描述留在盘上。 |
| 3 | Acceptance | 🟡 | A1 / A2（`:210`–`:224`）只扫英文三式（`line count(s)` / `current line count`），而承载同一义务的活档用中文形（「当前行数 + 预计增量」/「行数标注」）⇒ 全绿也不能证明「不再要求写读数」在全链成立（此即 #1 前提失真的成因）。 | A1 / A2 加一条中文形扫描（`当前行数\|预计增量\|行数标注`，域 = 需求 / 设计档 live 面），期望读数按 #1 / #2 的处置写；英文三式保留。 |
| 4 | Scope | 🟡 | 自述「纯删除，零新增规则」（`:79` ∥ `:246`）与 ③ 新文相抵：`:129` 给作者加了新义务「gets its tier judged from a fresh measurement — **the author's at design time**, the reviewer's when it checks」——量数从「评审核」扩到「作者设计轮必须现量」，是加句不是删句。 | 把 ③ 明写为「父侧授权的改写」并从「纯删除」口径单列（或把 `the author's at design time` 改成不设新义务的表述），使自述与文本同拍。 |
| 5 | Clarity / Numeric | 🟡 | `:126` 记「改后（7 行，较改前 +1 行——**首条超 300 字符，须拆行**）」；本席手数 `:129` 那条 ASCII 首行约 **200** 字符（未跑机检 ⇒ 计数 `unverified`）⇒ 拆行理由很可能不成立，Δ=+1 亦非必然（行宽 300 = `docs/core/design/DOC-DISCIPLINE.md` §3.18 `lineMax`）。 | 补一条字符数读数改写该句；若未超 300，则 ③ 保持 6 行、§2.4 行变回 ±0、A4 的逐字块收成 6 行。 |
| 6 | Method / completeness | 🟡 | 缺「最接近先例」行（判据 9）。本批有直接先例：`docs/batches/2026-10-28-memory-to-mechanism.md:119`–`:124` 已逐处点名同一四处（`:121` ∥ `:122` ∥ `:123` ∥ `:124`）；先例行形 = `docs/batches/2026-10-18-out-of-scope-silence.md:128`。 | §2 补一行：先例坐标 + 对齐（逐处逐字对位删）/ 偏离（`:87` 只删半句而先例写整条；③ 取改写而非整条删）+ 偏离理由。 |
| 7 | Method / completeness | 🟡 | 缺「勘察证据」行（判据 10）：未记查过哪些公共源文档、有无相关——而「同一义务的其它承载面」（需求 / 设计档）正是本批最该记的一笔。 | §2 补一行：查过 `docs/core/requirements/METHODOLOGY.md` · `docs/core/requirements/ENGINEERING-MODE-V2.md` · `docs/core/design/ADVISOR-CONVERGENCE.md` · `docs/core/design/DOC-DISCIPLINE.md`；结论 = 有相关，处置见 #1 / #2。 |
| 8 | Clarity / Evidence scope | 🔵 | KD-4 的依据句「全仓 grep `size annotations` = 只此一处字面」（`:140`）按仓面不成立：该字面在多份批次档在盘（如 `docs/batches/2026-10-22-prompt-rewrite-cabin2.md:52`）。 | 射程写成「活机制面（提示词 / 设计 / 需求档）零处」，或给一次实数读数。 |
| 9 | Acceptance | 🔵 | A3「`git diff --stat` = 恰 2 档」（`:228`）未排除本实现轮对批档 §5 自身的写入（`thincoder/.git/` 实测在盘 ⇒ 命令可跑，但批档若受跟踪即成 3 档）。 | A3 收成 `git diff --stat -- thincoder-core/prompts/`，或写明批档 §5 写入不计入。 |
| 10 | Evidence（正面读数） | 🔵 | 已核通过项：四处改前列文与盘上逐字相符（`thincoder-core/prompts/persona-eng-designer.md:87` ∥ `:91` ∥ `:140`；`thincoder-core/prompts/advisor-design.md:34`–`:39`）；提示词面同正则命中恰 6 行 = 本批 4 + `thincoder-core/prompts/discipline-engineering.md:129` + `thincoder-core/prompts/discipline-normal.md:78` ∥ `:79`（A2 命中集成立）；`thincoder-core/prompts/persona-eng-coder.md` 零命中（§2.2「实施席无要求」成立）；`test/RTM.md` 21 个 CLI 故事节 + VS Code ∥ Desktop「尚无集成用例」（§2.8 前提成立，RTM delta = 破 0 ∥ 冗余 0 ∥ 新增 0 的理由合规）；两改档均 `.md` ⇒ 行数标注豁免、均 <500 无越线。A5 的 `scripts/prompt-refs-check.mjs` 读数（70 ∥ 475 ∥ 10 命中、exit 1）本席未跑 ⇒ `unverified`。 | — |

**计数**：🔴 2 · 🟡 5 · 🔵 3。两条 🔴 同根：本批把「写读数」当成提示词独有的一条，而它在需求层（F-R24a / F-R24b）与设计层（ADVISOR-CONVERGENCE §9 ∥ DOC-DISCIPLINE §3.7）各有一份现行判据；前提不改，改完即造两处相反描述。

VERDICT: changes-required

### 轮次 2（评审子代理）

**评审对象** = `docs/batches/2026-10-28-prompt-readout-purge.md` §2（design，待评审）。本轮重点 = 四层同口径：本席逐层实读需求层与设计层盘面，批档 §2 逐字核。

**口径限制**：提示词面（`thincoder-core/prompts/**`）不在本轮评审范围 ⇒ 其正文只按批档逐字引文核，盘面读数记 `unverified`。

**上轮两条 🔴 确认已收正（逐字在盘）**：

- 需求层五行 = `docs/core/requirements/METHODOLOGY.md:84` ∥ `:85` · `docs/core/requirements/ENGINEERING-MODE-V2.md:270` ∥ `:354` ∥ `:370`。
- 设计层 ADVISOR = `docs/core/design/ADVISOR-CONVERGENCE.md:17` ∥ `:356` ∥ `:358` ∥ `:362` ∥ `:363` ∥ `:401`。
- 设计层 DOC-DISCIPLINE = `docs/core/design/DOC-DISCIPLINE.md:266` ∥ `:268` ∥ `:313` ∥ `:318` ∥ `:2507`。
- 设计层 ASYNC-POOL = `docs/core/design/AGENT-LOOP-ASYNC-POOL.md:479`–`:483` ∥ `:551`。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Document ownership | 🔴 | 同一机制在权威面自相矛盾：`docs/core/design/ADVISOR-CONVERGENCE.md:362`「**判据 = 结论在位**：表内的行数与预计增量不作判据依据（写与不写都不加分）」——数值在场不加不减；而同档 `:17`「行数与增量不落档」、`docs/core/requirements/METHODOLOGY.md:84`「**表中不含行数 / 增量数值**（评审维度核查）」、`docs/core/design/DOC-DISCIPLINE.md:268`「**不列行数与预计增量**」、批档 `:460`「**Neither the size nor an expected delta goes into the design document**」四面一律禁止。F-R24b 定 §9 为行为语义权威 ⇒ 作者按 §9 落数值、评审按 §9 不报，而 F-R24a 判定句（机器可验 + 评审维度核查）当场判红 | 四面取一口径：或 §9 `:362` 补「表内出现行数 / 增量数值 ⇒ 报（与 F-R24a 判定句同口径）」；或 F-R24a 判定句删「表中不含行数 / 增量数值（评审维度核查）」并把 `docs/core/design/DOC-DISCIPLINE.md:268` 同步降为「不作判据」。同一轮只留一句 |
| 2 | Requirements coverage | 🟡 | A′ 把义务从「写数」改为「落判档结论」，但作者面提示词只剩纯删除：批档 `:165` 改后 = 「source/test files; cross-file-limit files carry a **split plan**」、`:181` 改后 = 「Full affected-file list?」——既无「每档带判档结论」，也无「数值不落档」；而 `docs/core/requirements/METHODOLOGY.md:84` 判定句与 `docs/core/design/ADVISOR-CONVERGENCE.md:362` 都要求结论在位。设计席照其人格档落笔，产出的表在评审维度上缺项 | `:140` 改后补半句「each file carries its tier conclusion（越档者另带拆分计划）；no sizes or deltas in the doc」，并在 `:91` 的 pre-review 检查 ② 同口径补 tier conclusions——否则「四层同口径」在模型实际读到的面不成立 |
| 3 | Clarity | 🟡 | 「每档带判档结论」无形态定义：`docs/core/requirements/METHODOLOGY.md:84` 与 `docs/core/design/ADVISOR-CONVERGENCE.md:362` 说逐档，而设计层自己的示范形 `docs/core/design/AGENT-LOOP-ASYNC-POOL.md:483`「表内源 ∕ 测试档无一越 `>300` advisory 线」是**表级**一句。评审按 §9:362 逐档核时，无从判「未越档档的结论」该长什么样 | 在 §9 `:362` 写明形态（逐行「未越档 / 越档 + 拆分计划」列，或明确「表级一句结论即可」），并让 `:483` 的示范与所选形态一致 |
| 4 | Document ownership | 🟡 | tier 语义跨层不一：`docs/core/requirements/METHODOLOGY.md:84` 新文写「>500 必拆」；`docs/core/design/ADVISOR-CONVERGENCE.md:17` 写「>500 主动拆 / >800 硬顶」、`:363` 写「文件档 >500 主动审视 / >800 必须拆」；`>300 advisory` 只在前者与 `docs/core/design/AGENT-LOOP-ASYNC-POOL.md:483` 出现，§9 两条无。「必拆」与「主动审视」是两个判据强度，而批档 `:404` 声明 tier 数值「一字不改」 | 三处取一形：要么全部「>300 advisory / >500 必拆 / >800 硬限」，要么把 F-R24a 的档位列改成与 §9 同词的「>500 主动审视、>800 必拆」——并把 `>300 advisory` 补进 §9（或从 F-R24a 撤下并说明它不属判档档位） |
| 5 | Acceptance | 🟡 | 两套验收并存且互斥：批档 `:299`「A3 · 未触面字节不变 — `git diff --stat` = 恰 2 档」vs `:678`「A5 的改动集由六档扩为**七档**」。§2.21⑤ 只更正了 §2.17 的 A5，§2.5 的 A3 留在原处 ⇒ 实施 / 收口照 §2.5 跑必红 | 收成单一验收集：§2.5 的 A3 行就地标「由 §2.17 A5（七档）取代」并只留唯一判据行，或让 §2.17 / §2.21 明写「本段验收集 = 唯一现行集」 |
| 6 | Acceptance / Evidence | 🟡 | A3 的基线读数不重现：批档 `:526` 记「设计面 **38** 行」；本席按 A3 同一正则（`当前行数\|预计增量\|行数标注`）实扫 `docs/core/design` = **37** 行、`docs/cli` + `docs/vsc` = **3** 行（合计 40，未计 `docs/desktop` ∥ `docs/server`）；且本批新增的 `docs/core/design/DOC-DISCIPLINE.md:266` ∥ `:268` · `docs/core/design/ADVISOR-CONVERGENCE.md:362` 自身命中该正则 ⇒ 改后只会更多 | 重取一次基线并把读数写成本轮实测；A3 的改后判据保持「按类点名」形，同时点明本批自己新增的命中行归哪一类（禁止句），否则「义务句归 0」无法复核 |
| 7 | Scope / self-application | 🟡 | 本批自己的受影响文件表违本批立的规则：批档 `:264` 表头「| 档 | 面 | 改点 | 行变 |」，`:266` 记 `±0`、`:267` 记 `+1 行（首条因行宽拆成两行）`——「行变」即预计增量，正是 `docs/core/design/DOC-DISCIPLINE.md:268`「**不列行数与预计增量**」禁止的列；且 `:267` 的成因已被 `:468`「原句「首条超 300 字符须拆行」作废」推翻（现因 = 新增一条） | §2.4 表按新口径重述：列 = 档 ∥ 面 ∥ 改点 ∥ 判档结论（`.md` ⇒ 零判档），删「行变」列；`+1 行` 的成因改按 `:470` 的现因写，或不写数 |
| 8 | Clarity | 🟡 | 一名两义：「判档」在本批新增文里指「代码结构档位判定」（`docs/core/requirements/METHODOLOGY.md:84` · `docs/core/design/ADVISOR-CONVERGENCE.md:356` ∥ `:362` · `docs/core/design/AGENT-LOOP-ASYNC-POOL.md:551`），而同批编辑的 `docs/core/design/DOC-DISCIPLINE.md` 早已用「判档」指 doc_check 的**被判文件**：`:1256`「N = 引擎实判档数」、`:1383`「范围只收窄被判档」、`:1402`「**不可判档的二因（闭集…）**」。两义共存于同一档，评审维度「判档核查」与「实判档数」互读 | 换掉其中一名：档位判定一侧用「档位判定 / 档位结论」，doc_check 一侧保留「判档」；或在 §9:362 与 F-R24a 首次出现处逐字定义「本条判档 = 代码结构档位判定，与 doc_check 的判档无关」 |
| 9 | Document ownership | 🟡 | `docs/core/design/DOC-DISCIPLINE.md` §3.7 内部两形并存：`:262` 说受影响文件表内 `.md` 行「形态 = 该两列填 `—`，**行保留**」（两列仍在）；`:266` ∥ `:268` 说源 / 测试档「两项退场」「**不列行数与预计增量**」（两列不在）。同一张表不可能对 `.md` 行留列、对源档去列 | 二选一并在同节写明：要么表内不再有该两列（`.md` 行也不填 `—`），要么保留列而全表填 `—`；`:262` 与 `:266` ∥ `:268` 的词必须同形 |
| 10 | Methodology (D3) | 🟡 | 计数与枚举不同步：批档 `:143` 状态行「A′ 四层同口径」、`:396`「范围 = 需求层五处 + 设计层两档 + 提示词面四处」，而 `:98`–`:103` 只列出三层（需求 / 设计 / 提示词），`docs/core/design/DOC-DISCIPLINE.md:313` 又写「三面同口径」。本轮的评审命题正是「四层摆在一起」，四层是哪四层在档里读不出来 | 把「四层」的枚举写死一处（例：需求档 ∥ 设计档 ∥ 提示词面 ∥ 批次档受影响表，与 `docs/core/design/DOC-DISCIPLINE.md:268` 的三 + 一批次档同口径），并把状态行、§1.8、§2.11、D-DD16 的计数一并改同 |
| 11 | Doc hygiene (R2) | 🟡 | 失效表达留在 §2 首句：批档 `:150` 仍写「**纯删除，零新增规则，零运行时行为**」，而 `:487` 的处置表称「「纯删除」撤回；③ 明写为父侧授权的改写」，`:460` 的 ③ 新文确实新增了一条禁止句。实施席读首句会以为 ③ 只做删词 | `:150` 就地收正为「以删为主 + ③ 一处经父侧授权的改写」，与 `:487` ∥ `:460` 同拍；不再出现「纯删除」 |
| 12 | Evidence scope | 🔵 | KD-4 的依据仍是旧形：批档 `:340`（全仓 grep 该字面只此一处），而 `:491` 称「KD-4 依据改为活机制面零处」。仓面实扫该字面不成立（`docs/batches/2026-10-15-doc-ref-direction-cleanup.md:2093` ∥ `docs/batches/2026-10-16-prompt-design-code-model.md:241` 等多份批档，另有 `thincoder-desktop/dist-r3/win-unpacked/resources/app.asar`） | 把 `:340` 的括注改成「活机制面（提示词 ∥ 设计档 ∥ 需求档）零处」，与 `:491` 一致——两处说的必须是同一件事 |
| 13 | Doc state | 🔵 | 批档 `:254` 仍写「**无 —— 本批不写任何设计档 / 需求档。**」，与 `:407`–`:420` 的十二处设计层落点相反；只在 `:400` 用散文判其作废，读到 §2.3 的人会照旧结论行事 | `:254` 就地改为指向 §2.12，使「落点在哪」只有一处答案 |
| 14 | Scope | 🔵 | `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` 同档三处同形表留旧列（`:646` ∥ `:1063` ∥ `:1279` 实扫命中「现行行数 / 实测增量 / 预计增量」），理由 = 「**无验收条目指向它**」（批档 `:670`–`:672`）。该理由只覆盖判据引用，不覆盖「照形模仿」这条入口 | 三处已在清账批在册的前提下，至少在 `:646` 的 §6.30.13 表头补一句「本表为已收口批次实施记录，现行口径见 §6.30.6（判档）」——一句话关掉模仿入口，不改表 |
| 15 | Unverified | 🔵 | 本轮范围外读数一律记 `unverified`：`test/RTM.md`（§2.8 ∥ §2.19 的「21 故事节 + 两端无集成层」）· `thincoder-core/prompts/**` 正文（`:165` ∥ `:181` ∥ `:222` 的改动前文与 A2 的「三行非本批」）· `scripts/prompt-refs-check.mjs` 的 70 ∥ 475 ∥ 10 读数 · `doc_check(mode:"gate")` 的 `PASS`（`:550` ∥ `:693`）· `git diff` 的七档改动集 | 已核读数：`docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.30.6 表内源 / 测试档 **18** 行、`.md` **5** 行、其中 4 个单测档 ⇒ 实量 14，与 `:703` 对账相符；`thincoder-core/agent/helpers.mjs` 末内容行 = `:499`，与 `:657`「只认 `wc -l` 口径 = 500」自洽；先例 `docs/batches/2026-10-28-memory-to-mechanism.md:121`–`:124` 逐处点名同一四处，与 `:497` 相符 |

**计数**：🔴 1 · 🟡 10 · 🔵 4。

**对「四层摆在一起是不是说的同一件事」的答**：绝大多数命题已同口径——「判档结论落档、数不落档」在需求层五行、设计层三档、提示词第 8 条逐字同形，tier 数值与拆分计划保留面一致。

**唯一不同口径的是「数值在场怎么办」**：权威面 §9:362 说「写与不写都不加分」，其余四面一律「不写 / 不列 / 不许进档」；F-R24a 的判定句又把「表中不含数值」写成评审可核查项。这不是措辞差，是判据方向相反——作者与评审各按一边都能自证合规。

**次要面**：作者面提示词在 A′ 后只做了删（新义务「落结论」没进人格档）· 「判档」一名两义 · tier 强度跨层不一 · 两套验收并存。

VERDICT: changes-required

### 轮次 3（评审子代理）

**评审对象** = `docs/batches/2026-10-28-prompt-readout-purge.md` §2（design，待评审）。本轮重点 = ① 上轮 🔴1 是否真收 ②「四面」是否同一件事 ③ 改名是否干净。范围外（提示词正文 / `test/RTM.md` / `scripts/**`）读数一律 `unverified`。

**① 上轮 🔴1（§9 判据方向反）**：盘面已收——`docs/core/design/ADVISOR-CONVERGENCE.md:362` 现为「**两条并列判据**：① **结论在位**；② **表内不出现行数 / 增量数值——出现即报**」，与 F-R24a 判定句（批档 §2.23②）同向；`docs/core/design/ADVISOR-CONVERGENCE.md:401` 的 A-AC11 同步。**通过**。

**② 四面是否同一件事**：成文本同口径（需求 / 设计 / 提示词 / 批次档四层都是「判档位、结论落档、数不落档」），但需求层**尚未落盘**（见 #5）。

**③ 改名是否干净**：doc_check 义的「判档」与代码结构义的「判档」已分开（实扫 `docs/core/design/ADVISOR-CONVERGENCE.md` 与 `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` 现盘「判档」余 0，成立）；新名与既有「产品档位」义相撞（见 #7）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Acceptance | 🔴 | A1／A2 的判据与本节自己规定的改后文本互斥：§2.23③ 给 `:140` 的改后句含 `no line counts or expected deltas in the doc`（批档 `:801`），而 A1 判据 = 目标两档 `line counts?` 命中 **0**（`:844`）、A2 判据 = 提示词面命中集须为 **3** 行（`:846`）⇒ 实施后 `thincoder-core/prompts/persona-eng-designer.md` 恒多 1 命中，A1 恒红、A2 恒为 4。该档现文两行即命中（`thincoder-core/prompts/persona-eng-designer.md:91` / `:140` 实读），判据按「机械清零」形写，无解释余量 | 二选一并同轮同形：① A1／A2 改判据形——只断言四处**改前原句**零命中（而非任意 `line counts?` 字面），或对否定句设排除；② `thincoder-core/prompts/persona-eng-designer.md:140` 改后句不提该字面（如 `no sizes or expected deltas in the doc`，与 ③ 的 `Neither the size nor…` 同词）。判据与文本必须互不拆台 |
| 2 | Document ownership | 🔴 | 同一机制（档位判据）在权威档内两处相反：`docs/core/design/ADVISOR-CONVERGENCE.md:17`「与档位判据（数值 = 纪律层代码结构判据节，本档不重述）」· 同档 `:358` 同句，而 `:363` 仍逐字载「文件档 >500 主动审视 / >800 必须拆」。批档 §2.23① 的两行亦自相反：`:754`「判据数值 = 纪律层（本档不重述）」∥ `:758`「三句 tier 判据一字不动」。F-R24b 定本档为行为语义权威（批档 `:775`）⇒ 读者取「数值在哪」得两个答案，而本批立身理由正是「同一机制不留两处相反描述」 | 取一形并写进 §2.23①：① 若 `:363` 三句保留（用户裁「tier 数值一字不改」），则 `:17`／`:358` 删「本档不重述」句，改为数值出处指向 §9 抽查条；② 若坚持「本档不重述」，则 `:363` 三句一并改指，并把该改与用户裁的冲明显式摆出待裁。同一轮只留一句 |
| 3 | Document ownership / Acceptance | 🔴 | `docs/core/design/DOC-DISCIPLINE.md` 的验收行与规范面相反：`:2088`（A-DD15）要求「源 / 单元测试档 `.mjs` 行「当前行数 + 预计增量 + 拆分计划」**抽样 ≥3 档仍在**」，而同档 `:262` 定「两列整列退场（`.md` 行也不填 `—`）」、`:266` 定「「当前行数 + 预计增量」两项退场」。两列既整列退场，A-DD15 抽样恒红；反之 A-DD15 成立即反证 `:266`。§2.23① 称 `:2088` 已改为「整列退场」（批档 `:765`），实读只改前半句；§2.29（`:922`）自记「同句后段仍带该字面」但只按正则计数处置，未按语义处置 | `docs/core/design/DOC-DISCIPLINE.md:2088` 后半句改为与新口径同形（源 / 单元测试档 `.mjs` 行的**档位结论与拆分计划**抽样 ≥3 档仍在；「当前行数 + 预计增量」两项退场），使 A-DD15 与 `:262`／`:266` 同形；§2.29 的「仍命中 ⇒ 不改计数」随之作废 |
| 4 | Acceptance | 🟡 | A5 的改动集声明漏了同批会落盘的档：§2.25 A5 = `git diff --stat` 改动集 ⊆ §2.24 七档 ∪ 批档（批档 `:871`），而 §2.27 把需求层五行交父侧**同批**落（`:900`）；现盘 `docs/core/requirements/METHODOLOGY.md:84` 已是 §2.13 形态（实读）⇒ 父侧落 §2.23② 后工作树必含需求两档，实施轮 A5 恒红 | A5 加路径限（`git diff --stat -- thincoder-core/prompts/ docs/core/design/`），或把需求两档并入声明集并注明笔属父侧 |
| 5 | Document state | 🟡 | 「四面同口径」目前在盘只成立三面：需求层仍是 §2.13 文本——`docs/core/requirements/METHODOLOGY.md:84` 现读「并判档：档位（>300 advisory / >500 必拆 / >800 硬限）由判档人当刻现量判定」，而 §2.23②（`:774`）已改「档位判据 = 纪律层代码结构判据节（本行不重述数值）」；同档 `:85` 维度名仍为「受影响文件判档核查」，与 §2.23② 的「档位核查」（`:775`）不同名。设计已声明该层为父侧笔（`:900`），此处只报状态差 | 落 §2.23② 时同轮落五行，并把「四面同口径」的可核判据写成「落盘后五行逐字 = §2.23②」，免验收时按在盘态判 |
| 6 | Clarity / Requirements | 🟡 | 档位判据的移交落点答不出数值：§2.23② 与 `docs/core/design/ADVISOR-CONVERGENCE.md:17`／`:358` 均写「档位判据 = 纪律层代码结构判据节」，而该节（`thincoder-core/prompts/discipline-normal.md` 的 Code structure judgment，`:74`–`:78`）无 `>500` / `>800`（同档 `50|100|300|500|800` 实扫只命中 `~100` 与 `≥300` 两处）；`docs/core/requirements/METHODOLOGY.md:44` 自陈「现行代码结构判据载体 = `thincoder-core/prompts/discipline-normal.md:53`」⇒ 四层一齐指向一个答不出「>500 是不是拆线」的节，而 §2.26① 又承认两族并存、本批不收敛 | 移交落点改成能答数值的那处（如 `docs/core/design/ADVISOR-CONVERGENCE.md:363` ∥ `thincoder-core/prompts/advisor-design.md:36`–`:37`），或就地写清「本批后数值单一来源 = X；两族张力 = §2.27 知会、另批裁」 |
| 7 | Clarity / Existing-piece | 🟡 | 改名未落「既有件」三问，且新名与既有义同档相撞：`docs/core/design/DOC-DISCIPLINE.md:2319`「谓词族单源 = 产品档位 `thincoder-core/doc-check/paragraph.mjs`」、同档 `:2560` 同句——「档位」在该档已指「产品档位（核内实现 vs 脚本缝）」，而本批新名「档位判定 / 档位结论」指行数档位。§2.22 只核了「判档」余 0，未核新名撞义 | 补既有件三问（`existing:` 产品档位义 ∥ `none found:` 行数档位义的既有名 ∥ 谁用），并二选一：新名写成「尺寸档位 / 结构档位」避开「产品档位」，或在该档首次出现处一句定义两者不同 |
| 8 | Self-application | 🔵 | §2.21③ 标题是「逐档判档读数（现量 · `wc -l` 口径 · 数不落档）」，正文却把逐档读数写进批档（`:666`「最大者恰 `500`」· `:670`「先按 `split('\n').length` 量得 `helpers.mjs` = 501」）；§2.29 亦落 7 个字符宽度读数（`:927`）。规则面只禁「受影响文件表」列数值（`docs/core/design/DOC-DISCIPLINE.md:268`）⇒ 不判违规，但本批 why 段（§1.9）明说「数抄进档即旧」，批档自身即成首个同形实例 | 保留结论、把逐档数值收成「已量不落」的说明，或注明该块为记录面读数（as-of）且不作样式引用 |
| 9 | Acceptance / Evidence | 🔵 | A3 的正则 `当前行数|预计增量|行数标注` 扫不到 `现行行数` / `实测增量`（§2.21⑥ 自记；`docs/core/design/AGENT-LOOP-ASYNC-POOL.md:647` 即属此类且未入点名表）；设计已如实记 `unverified` 余量，此处只登记覆盖缺口仍在 | 若要可核，把三式加宽为四式并把 `docs/core/design/AGENT-LOOP-ASYNC-POOL.md:647` 类行归入存量点名 |
| 10 | Evidence scope | 🔵 | §2.8／§2.19 的「21 个故事节 + 两端无集成层」本席未读 `test/RTM.md`（范围外）⇒ 记 `unverified`；另：本仓无 standards 档、无文档地图 ⇒ Document ownership 按 `AGENTS.md`「Docs conflict → stop and report」判，判据降级（与轮 1／2 同） | — |
| 11 | 已核通过项（正面读数） | 🔵 | 设计层落点与 §2.23① 逐处相符（`docs/core/design/ADVISOR-CONVERGENCE.md:17`／`:356`／`:358`／`:362`／`:363`／`:401` · `docs/core/design/DOC-DISCIPLINE.md:262`／`:266`／`:268`／`:313`／`:318`／`:2507` · `docs/core/design/AGENT-LOOP-ASYNC-POOL.md:479`／`:481`／`:483`／`:505`–`:509`／`:511`／`:551`／`:643` · `docs/core/design/ENGINEERING-MODE-V2.md:60`）；「判档」在 `docs/core/design/ADVISOR-CONVERGENCE.md` 与 `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` 现盘余 0（实扫成立）；`docs/core/design/DOC-DISCIPLINE.md:313` 的 D-DD16 四面枚举在位且与 §2.26② 同序；§2.24 自适用表无「行变」列、表级一句档位结论在位（上轮 🟡7 已收）；§2.16 先例行（先例坐标 + 三条偏离理由）与勘察证据行（六档 + 「有相关」）在位（判据 9／10 过）；本批七档全为 `.md` ⇒ 判据 8 的豁免成立、无越档 | — |

**计数**：🔴 3 · 🟡 4 · 🔵 4。

**结论（对应 trigger 三问）**：① 上轮 🔴1 已收（`docs/core/design/ADVISOR-CONVERGENCE.md:362` 两条并列判据在盘）；② 四面成文本同一件事、但需求层未落盘（#5）；③ 改名去掉了「判档」两义，却引入与「产品档位」的新撞义（#7）；本轮新出三条 🔴 全属「判据／文本互不拆台」面：#1 验收判据反打自己的改后句、#2 权威档内「不重述」与「一字不改」相反、#3 验收行与规范面相反。

VERDICT: changes-required

### 轮次 4（评审子代理）

**评审对象** = `docs/batches/2026-10-28-prompt-readout-purge.md` §2（design，待评审 · 修正轮 4 = §2.30）。本轮只核上轮 7 条 + 修正是否引入新 🔴。

范围外（`thincoder-core/prompts/**` 正文 / `test/RTM.md` / `scripts/**` / A-DD15 抽样坐标的目标节）读数一律 `unverified`。

**上轮 3 条 🔴 逐条复核（全收）**：

- 🔴1（A1／A2 反打自己的改后句）→ **Fixed**。§2.30 ② 把判据从「`line counts?` 字面清零」换成「改前三句原句」：「不是 `line counts` 这个串在不在」（批档 `:961`），并明写旧形为何恒红：「旧形改后恒为 3（本批 `:140` 改后句含 `no line counts`），**这就是父侧判它恒红的成因**；旧形作废。」（批档 `:979`）。改后句 `no line counts or expected deltas in the doc` 不再命中三句任一（含 `+ line counts` —— 无 `+` 前缀），判据与文本不再互斥。
- 🔴2（权威档内「不重述」与「一字不改」相反）→ **Fixed**。`docs/core/design/ADVISOR-CONVERGENCE.md:17` 现读「核查用的尺寸档位判据数值 = 本节 §9「尺寸档位结论抽查」条」——「本档不重述」已删；同档 `:358` 现读「**判据数值 = 本节「尺寸档位结论抽查」条**（函数档 `≥300` 行 · 文件档 `>500` 主动审视 · `>800` 必须拆）」。落点指向的条确实载数值（`:363`「文件档 >500 主动审视 / >800 必须拆」），读者取「数值在哪」只有一个答案。
- 🔴3（A-DD15 与规范面相反）→ **Fixed**。`docs/core/design/DOC-DISCIPLINE.md:2088` 现读「源 / 单元测试档 `.mjs` 行的**尺寸档位结论与拆分计划**抽样 ≥3 档仍在（坐标见下方码块）」，与同档 `:262`（两列整列退场）／`:266`（两项退场）不再相反。

**上轮 🟡4 逐条复核**：

- 🟡4（A5 无路径限）→ **Fixed**：批档 `:999`「**A5 · 未触面零改（加路径限）**：`git diff --stat -- thincoder-core/prompts/ docs/core/design/` 的改动集 ⊆ **五档设计档 + 两档提示词**」。
- 🟡5（需求层未落盘）→ **Accepted**：需求档 = 主 agent 笔（D1），逐字已交；批档 `:1015`「父侧落笔前，本项按现盘读「三面成立、需求层待落」（事实，不是缺陷）」，并把「落盘后五行逐字 = 本节 ④ + §2.23②」写成可核判据。
- 🟡6（落点答不出 500／800）→ **Fixed**：批档 `:1010`「档位判据数值 = `docs/core/design/ADVISOR-CONVERGENCE.md` §9「尺寸档位结论抽查」条 ∥ 设计评审提示词第 8 条的 tier 三行（本行不重述数值）」。
- 🟡7（新名撞「产品档位」）→ **Fixed 于机制面**：`docs/core/design/DOC-DISCIPLINE.md:170`／`:172`／`:266`／`:268`／`:318`／`:2507` · `docs/core/design/ADVISOR-CONVERGENCE.md:356`／`:362`／`:363`／`:401` · `docs/core/design/AGENT-LOOP-ASYNC-POOL.md:479`–`:483`／`:505`–`:509` 全带「尺寸」限定；需求层交接行未同改 ⇒ 本轮 #1。

| # | Orig# | File | Severity | Status | Notes |
|---|-------|------|----------|--------|-------|
| 1 | 7(残) | `docs/batches/2026-10-28-prompt-readout-purge.md` | 🟡 | New: F-R24a 交接行未随改名 | §2.30 只对另外四行下改名令——`:1013`「仅维度名「判档」随本批改为「尺寸档位」」；F-R24a 本体仍逐字同 §2.23② 的裸「档位」——`:774`「并判定档位」（同句还有「一句表级档位结论」「文档档零档位义务」）。而 `:935` 的命名链条声明全批定名 = 尺寸档位判定 ∥ 尺寸档位结论 ⇒ 父侧照此落盘后，同一需求表内 F-R24b 写「尺寸档位核查」、F-R24a 写「档位」，改名在需求层只落一半。建议：§2.30 ④ 补一句「F-R24a 内「档位」同改「尺寸档位」」，或明写故意留裸名 + 理由 |
| 2 | (new) | `docs/batches/2026-10-28-prompt-readout-purge.md` | 🟡 | New: 被取代段仍写「本档不重述」 | §2.30 ①#2 已把该断言删掉（`:942`「**删掉「数值 = 纪律层」与「本档不重述」两处断言**，判据数值改指本节 §9 抽查条」），但 §2.23① 落点表未同步——`:754`「判据数值 = 纪律层（本档不重述）」，与现盘 `docs/core/design/ADVISOR-CONVERGENCE.md:17` 相反。§2.30 的取代句（`:931`）只点「命名」与「验收集形状」，不覆盖这一行 ⇒ 实施席读 §2.23① 会得出与盘面相反的落点结论。建议：`:754` 就地改指 §2.30 ①#2，或把 `:931` 的取代射程写全 |
| 3 | (new) | `docs/core/design/DOC-DISCIPLINE.md` | 🟡 | New: 同义三名并存 | 改名在 §3.3 产生第三个近名：`:170`「### 3.3 尺寸档位结论」与 `:172`「段判据档尺寸档位登记 = **§3.15 尺寸档登记**」，而档头 / §3 枚举与 §3.15 用「尺寸档登记」（`:151`）。四处指同一登记机制、三种写法。建议：`:172` 回到既有「尺寸档登记」，§3.3 题名留「尺寸档位结论」 |
| 4 | 5 | `docs/core/requirements/METHODOLOGY.md` | 🟡 | Accepted（父侧笔 · 已记状态 + 可核判据） | 现盘仍为 §2.13 形：`docs/core/requirements/METHODOLOGY.md:84`「并判档：档位（>300 advisory / >500 必拆 / >800 硬限）由判档人当刻现量判定」，同档 `:85` 仍「受影响文件判档核查」；`docs/core/requirements/ENGINEERING-MODE-V2.md:270`／`:354`／`:370` 同。设计侧无可动笔面，逐字已交 + 可核判据在位 ⇒ 非零理由未修，收口 |
| 5 | 8 | `docs/batches/2026-10-28-prompt-readout-purge.md` | 🔵 | Accepted | 逐档读数仍在记录面（`:666` 一类）；`:1024`「🔵#8（本节读数属记录面 as-of，不作样式引用）」为有理由不修，规则面只禁受影响文件表列数值（`docs/core/design/DOC-DISCIPLINE.md:268`） |
| 6 | 9 | `docs/batches/2026-10-28-prompt-readout-purge.md` | 🔵 | Fixed | A3 覆盖缺口已收：`:992`「**A3b · 加宽扫描（承上轮 🔵#9 的覆盖缺口）**：正则加两式 `现行行数|实测增量`」，并逐处点名 17 行 |
| 7 | 10 | `docs/batches/2026-10-28-prompt-readout-purge.md` | 🔵 | Accepted | `test/RTM.md` 仍为范围外，未核 ⇒ 保持 `unverified`，无动作要求 |
| 8 | 11 | `docs/batches/2026-10-28-prompt-readout-purge.md` | 🔵 | Accepted | 正面读数项，无动作 |
| 9 | (new) | `docs/core/design/DOC-DISCIPLINE.md` | 🔵 | New: 抽样坐标仍是旧形（`unverified`） | `:2168`「**A-DD15 代码面保留抽样坐标**：`docs/core/design/CORE-UNIFICATION.md` §2.8.1 / §4.4.1 · …」——这些是存量节（在 §2.25 A3 的 21 行读数载体里），本批未回改 ⇒ 按新措辞现场复核会读到旧形「当前行数 + 预计增量 + 拆分计划」，而非「尺寸档位结论」。本席未读这些目标节（范围外）⇒ 记 `unverified`；若清账批承接，写一句归属即可 |
| 10 | (new) | `docs/core/design/ADVISOR-CONVERGENCE.md` | 🔵 | New: 同节两处同值复述 | `:358` 已带「（函数档 `≥300` 行 · 文件档 `>500` 主动审视 · `>800` 必须拆）」，`:363` 又逐字载「文件档 >500 主动审视 / >800 必须拆」——同值、不相反（不构成两处相反描述），但与 D2 单源有摩擦。建议：`:358` 只留指针，数值唯一处 = `:363` |

**计数**：🔴 0 · 🟡 4 · 🔵 4（上轮 3 条 🔴 全 Fixed；上轮 🟡：3 Fixed · 1 Accepted；上轮 🔵：1 Fixed · 2 Accepted）。

**新 🔴 判据（为何没有）**：三处修正都只作「判据形 / 落点 / 半句」的替换，未动 tier 数值、未新增运行时行为、未新增验收门槛。

盘面机制面（`docs/core/design/ADVISOR-CONVERGENCE.md:17`／`:358`／`:362`／`:363`／`:401` · `docs/core/design/DOC-DISCIPLINE.md:262`／`:266`／`:268`／`:2088`／`:2507`）彼此不再相反；本轮 4 条 🟡 均属命名 / 记录面滞后，不改变任何判据的方向。

VERDICT: pass

## §4 用户批准（主 agent）

## 4. 用户批准（主 agent）

**状态行**：已批准 2026-10-28

### 4.1 批准依据（用户原话 · 逐字）

- **「a」**（2026-10-28 15:32）—— 批准 **A′**：把「受影响文件表写 `当前行数 + 预计增量`」这条义务改成「判尺寸档位」；四处同口径收正。
- **「做减法比加法更重要」**（同日 14:20）—— 方向裁定：删掉产生读数的义务，而不是加检查器去管它。
- **「可以」**（同日 15:44）—— 确认扩到四层（需求 ∥ 设计 ∥ 提示词 ∥ 批次档表）。

### 4.2 批准范围

需求层 5 处 · 设计层 5 档 15 处 · 提示词 2 档 4 处 · 批档 §2.24 自适用。

### 4.3 明确不在本批

存量读数清账（`#1904`）· tier 数值两族并存（另批请裁）· `scripts/**` · 提示词面「无一越档」分支（§6.4 已登台账）。

## §5 实施记录（eng-coder）
**状态行**：实施完成（提示词四处逐字落地 · A1/A2 新形 0/0 · A4 4/4 · A6 PASS · 内审 none · 代码评审 pass（🔴0 🟡1 🔵4，无 must-fix））



### 5.1 交付摘要（提示词四处 · 逐字照 §2.23③）

**批次** = `2026-10-28-prompt-readout-purge` · 实施轮（eng-coder）。**笔面** = 产品码面（提示词 = 产品文本），designToken 在册。

**范围** = 批档 §2.23③ 的提示词四处。**零运行时行为、零新机制**；需求档（父侧笔）与设计档（设计席笔）不在本笔。

| # | 档:行 | 动作 | 改后逐字 |
|---|---|---|---|
| ① | `thincoder-core/prompts/persona-eng-designer.md:140` | 整行替换 | `3. **Affected-file list** — source/test files + one tier-conclusion line (which files cross a tier, each with a **split plan**); no line counts or expected deltas in the doc` |
| ② | 同档 `:91` | 整行替换（行首 6 空格保留） | `     - ② Full affected-file list + its tier conclusion (no counts or deltas)?` |
| ③ | 同档 `:87` | 只删 `every number and ` | `     3. **Claims ↔ measurements**: every "all / none / every" in your text is a **freshly measured reading** — a number recalled from memory or derived on paper is a claim, not a reading.` |
| ④ | `thincoder-core/prompts/advisor-design.md:34`–`:40` | 第 8 条整块改写（6 行 → 7 行） | 逐字见 §2.23③ 七行；题名 `Affected-file size annotations` ⇒ `Affected-file tier check`，spot-check 改指结论行 |

**改前四处**（本笔实读，逐字）：`with current line counts + expected deltas`（①）· `+ line counts`（②）· `every number and every "all / none / every"`（③）· `annotated with its current line count and expected delta` + `sample the annotated numbers`（④）。

### 5.2 验收读数（本笔实跑 · 一条一做法一结果）

| 项 | 命令 / 做法 | 结果 |
|---|---|---|
| A1 新形（§2.30② 三句原句 · 本批两档） | `node` utf8 行扫 substring | **0**（改前基线 3：`thincoder-core/prompts/persona-eng-designer.md:91` ∥ `:140` ∥ `thincoder-core/prompts/advisor-design.md:34`） |
| A2 新形（同三句 · `thincoder-core/prompts/**`） | 同法，域 16 档 | **0** |
| A2 旧形（`line counts?` ∥ `current line count`） | 同法 | **4**：`thincoder-core/prompts/discipline-engineering.md:129` · `thincoder-core/prompts/discipline-normal.md:78` ∥ `:79` · `thincoder-core/prompts/persona-eng-designer.md:140`（末行含 `no line counts`，即 `§2.30②:979` 判旧形作废的成因；前三条不属本批，一字未动） |
| A4 逐字对位 | `node` 行扫 substring，四处 | **4/4** |
| A5 未触面零改 | `git diff --stat -- thincoder-core/prompts/` | 恰 **2 档**（7 增 / 6 删），块数 4 |
| A5b 路径限全域 | `git diff --stat -- thincoder-core/prompts/ docs/core/design/` | **7 档** = §2.24 表（两档提示词 + 五档设计档），表外零改 |
| A6 交付门 | `doc_check(mode:"gate")`，清单 = 本笔两档 | 首行 `DOC-CHECK GATE: PASS`，0 段命中（2 档全清） |
| 行宽（提示词面判据） | `^.{301,}$` 逐行扫 | 两档零命中（最大 298 / 290）；第 8 条七行 = 199 / 166 / 63 / 192 / 129 / 73 / 125，与 `§2.29:927` 逐位相符 |
| 未回归 | `node scripts/prompt-refs-check.mjs` | 提示词面 70 档 ∥ 代码面 475 档 ∥ 命中 **10**、exit 1 = 既有红；10 条全在 `thincoder-core/tool-docs/**` 与 `thincoder-core/agent-tools/**`，两档目标零条 ⇒ 命中集与改前逐条相同 |
| 运行时冒烟（改后仍被加载） | `assemblePrompt('eng-designer')` ∥ `loadAdvisorPrompt` 读 `thincoder-core/prompts/advisor-design.md` | 装配 122865 字符、warnings 空、三处新文在装配体内、`every number and` 已不在；advisor 提示词 16333 字符，新第 8 条三句在体内，`size annotations` 与 `annotated with its current line count` 均不在 |

### 5.3 测试覆盖

**无单测档**（依 KD-5）：可断言面是散文，断言散文违反测试纪律；本批零运行时分支，无可执行面。

**收口测试行 · ①**：本批单测档 = 无；核对面 = 5.2 的 A1 / A2 / A4 / A6 四条机检 + 运行时装配冒烟。

**收口测试行 · ②**：集成用例集现况不变；本批新增 / 修订用例 **0**，依 §2.19 RTM delta（破 0 ∥ 冗余 0 ∥ 新增 0）。场景「设计轮不再把行数写进设计档」的可观察面是模型输出与档文，无用户可进入的业务入口 ⇒ 不立行。

### 5.4 决策披露（偏离 / 简化 / 未做）

**逐条状态**：四处全部 ✅ 完成，无 ⚠️ 简化、无 ❌ 未做。

**离单改动**：无 —— 本笔只动 §2.24 表内两档。

**未做（依设计，非缩水）**：不动 `thincoder-core/prompts/discipline-engineering.md:129`、`thincoder-core/prompts/discipline-normal.md:78` ∥ `:79`（硬限举例 / normal 散文）· 不动需求档与设计档 · 不动 `scripts/**` · 不留修订式旧句。

**口径提示（据实报，不改）**：旧形 A2 现测 4 ≠ 3，成因是 ① 的新句合法含 `no line counts`；`§2.30②` 已把判据换成三句原句并明写旧形作废 ⇒ 判据与文本同拍，未为凑绿改过措辞。

### 5.5 内部审计与代码评审（轮次与终态）

| 轮 | 面 | 结论 |
|---|---|---|
| 内审 1（explore · 对设计的偏离审计） | 四处逐字 ∥ §2.23③、A1 / A2 / A4 自跑、§2.24 表 ↔ 实改面、OFF-LIST 面 | **DIVERGENCE: none**；A5 与 A6 该装配无对应工具，记其自测缺口（本笔已跑，读数见 5.2） |
| 代码评审 1（advisor · type=code） | 两档全文 + 批档 §2 作验收语料 | **VERDICT: pass**；🔴 0 · 🟡 1 · 🔵 4 |

**自修轮次 = 0**（无 must-fix 项）。**终态 = `clean`**。

**评审 🟡1（不阻塞 · 上抛口径）**：提示词面缺「无一越档」分支，而 `docs/core/design/ADVISOR-CONVERGENCE.md:362` 与 `docs/core/requirements/METHODOLOGY.md:84` 要求结论句恒在位（含「无一越档」形）。

- 该文本系 §2.23③ 逐字 mandated，本笔不得自改一句；评审亦自判不阻塞交付。
- 处置归 §2.23③ 的笔，本笔只上抛，交付按设计原样。

**评审 🔵2–🔵5**：A3 扫描域不含提示词面（本笔实扫 = 0，无残留，仅「未测」）· 批档 §2.14 旧「改后」块与 §2.23③ 不同（§2.30 已判现行面唯一）· tier 两族数值并存（本批裁定不动）· 外层评审标准注入块仍带「行数标注」（位置 `unverified`，不属 KD-4 射程）。

## §6 验证与收口（父代理）

## 6. 验证与收口（父代理）

**状态行**：已收口 2026-10-28

### 6.1 交付事实（四面 · 各归各笔）

| 面 | 内容 | 笔 |
|---|---|---|
| 需求 | `docs/core/requirements/METHODOLOGY.md:84`（F-R24a 判尺寸档位 + 判据数值指 §9 抽查条）· `:85`（F-R24b 尺寸档位核查）· `docs/core/requirements/ENGINEERING-MODE-V2.md:270` ∥ `:354` ∥ `:370` | 父侧 |
| 设计 | 5 档 15 处（`ADVISOR-CONVERGENCE` §9 ∥ `:17` ∥ `:358` ∥ `:363` ∥ `:401` · `DOC-DISCIPLINE` `:170` ∥ `:172` ∥ `:262` ∥ `:266` ∥ `:268` ∥ `:2088` ∥ `:2507` · `AGENT-LOOP-ASYNC-POOL` §6.30.6 ∥ A-TW5 · `ENGINEERING-MODE-V2`（设计层）`:60` · `STRUCTURE-DEBT:38`） | eng-designer |
| 提示词 | `thincoder-core/prompts/persona-eng-designer.md:140` ∥ `:91` ∥ `:87` · `thincoder-core/prompts/advisor-design.md:34`–`:40` | eng-coder |
| 批档 | §2.24 受影响文件表自适用（新口径 · 无行变列） | eng-designer |

### 6.2 父侧独立复核（不采信报告 · 全部自跑）

```
:140  「source/test files + one tier-conclusion line …, no line counts or expected deltas in the doc」  ✓
:91   「     - ② Full affected-file list + its tier conclusion (no counts or deltas)?」               ✓ 缩进保留
:87   「every "all / none / every" …」——「every number and 」已删，尾句未动                              ✓
advisor :34–:40  七行块逐字 = 批档 §2.23③                                                          ✓
A1（三句原句）两档命中 = 0 ∥ 0                                                                      ✓
```

### 6.3 交付门

`doc_check(mode:"gate")` 两档 = **PASS**（行宽零超 300，最大 298）· `git diff --stat -- thincoder-core/prompts/` = 恰 **2 档**（7 增 / 6 删）· `prompt-refs-check` 与改前逐条相同（10 条全在 `tool-docs/**` ∥ `agent-tools/**`，两档目标零条）。

### 6.4 一条未收的 🟡（已登台账）

**提示词面缺「无一越档」分支**：`thincoder-core/prompts/persona-eng-designer.md:140` 与 `thincoder-core/prompts/advisor-design.md:35` 只写「越档者带拆分计划」，未写「无一越档也要给一句」；而 `docs/core/design/ADVISOR-CONVERGENCE.md:362` 与 F-R24a 判定句要求结论句**恒在位** ⇒ **全档无越档时，作者按提示词可略去该行，评审按 A-AC11 判「结论不在位」打回。**

**父侧处置：不改已批设计的逐字，登台账另轮补。** 理由：该文本是 §2.23③ 逐字 mandated，改它 = 偏离已批设计 ⇒ 走新批，不在收口轮偷改。

### 6.5 集成测试面

**本批零可执行业务面**（4 档文档 + 2 档提示词文本），**无集成用例新增或修订**，集成集规模不变（21 档 / 73 例）。**未做集成验证 —— 本批不含可执行业务面。**

### 6.6 收口判据

- chain：§1 讨论 ✅ · §2 设计 ✅ · §3 评审通过 ✅（第 4 轮 pass · `§3` 状态行已写）· §4 用户批准 ✅ · §6 本段 ✅
- 交付门 PASS · A1 / A4 / A6 全绿（父侧复核一致）
- 台账：`#1907` → 待核销 → 已核销；§6.4 的 🟡 另立一行
