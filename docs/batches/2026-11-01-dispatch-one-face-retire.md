# 2026-11-01 · dispatch-one-face-retire
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-11-01 · 来源 = 用户 2026-11-01 19:30 逐字「你那条一批活只改一类面的约束去掉了吗？」+ 19:31「你不去掉他改别的有用吗？」。
> 台账 = #1961（PROMPT-SYSTEM · 归批）。前情 = #1960touched-means-fix（`docs/batches/2026-11-01-touched-means-fix.md`，进行中）。
## §1 讨论（主 agent）
**状态行**：🔄 进行中（…）
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

## 1. 讨论与结论（主 agent）

**覆盖账 = #1961** · **前情 = `docs/batches/2026-11-01-touched-means-fix.md`（进行中）**

### 1.1 用户裁定（逐字）

> 19:30：「**你那条一批活只改一类面的约束去掉了吗？**」
> 19:31：「**你不去掉他改别的有用吗？**」

### 1.2 这条约束现在长在哪（父侧实扫）

```
thincoder-core/prompts/persona-engineering.md:361-362
  "Dispatch size discipline (pre-flight · one dispatch, one change face)"
  "Three gates: >15 files ⇒ split · spanning faces ⇒ split by face · ..."

docs/core/design/PROMPT-SYSTEM.md:1917
  「派单尺寸 / 按面拆分（≤15 文件 · 一面一单）」
```

### 1.3 它今天的账单（不是理论，是今天这一天）

2026-11-01 受影响文件表清账批（38 档 **全在同一变更面上**）：

- **被拆成 11 轮设计席派单** —— 每轮都要重写 §2、重跑门、动一次坐标；
- **`#35` 整整一轮花在清不相干的问题上**；
- **`§2.0a` 插块把其后每条坐标顶偏 9 行**（评审抓出来的）；
- **它的名义收益「单一验收面」，本批一次都没用上。**

### 1.4 为什么这条是错的（道理）

**验收面由「这一批要验什么」定，不由「这一批碰了几类文件」定。**

「碰了几类文件」只是**验收面的代理指标**。代理在今天代理错了：38 档同属文档面，**它们要验的本来就是同一件事**（这一类账有没有退干净），拆开不产生第二个验收面，只产生十一次重复劳动与十一次漂移机会。

### 1.5 去掉什么、留什么

- **去掉**：`spanning faces ⇒ split by face` 与「一面一单」这个说法。
- **留**：`>15 files ⇒ split` 这条**保留**，但理由要换成它真正的用处 —— **不是「面要单一」，是「一单要小到能一次说清、文件冲突检测才有意义」**（`files` 参数本来就是为冲突检测而设，不是为了切面）。
- **留**：每条派单仍须声明 `files`（写域）与验收面 —— **验收面照写，只是不再由「面数」决定拆不拆。**

### 1.6 边界

- **只改这一条**，不顺手改派单纪律其余各条。
- **提示词是产品代码面** ⇒ 内容由本席出（提供逐字替换块），落笔走实施轮。
- 设计面记录 = `docs/core/design/PROMPT-SYSTEM.md` 对应节。

### 1.7 §1.2 两处读数失真的收正（父侧 · 2026-11-01 20:05）

**触发**：设计席（`#62`）如实上报「§1.2 的两处读数与现盘不符，住 §1 你的段，本席零触」。

**父侧实读收正**：

| 原 §1.2 所记 | 现盘实读 | 说明 |
|---|---|---|
| `docs/core/design/PROMPT-SYSTEM.md:1917`「派单尺寸 / 按面拆分（≤15 文件 · 一面一单）」 | `:1928` 逐字 `\| 本档 §6.9 派单尺寸（尺寸闸） \| 派单自身是否合法（`files` ≤15 档） \| …` | 原坐标早空，且内容已由设计席改为「尺寸闸」，**不再含「按面拆分」字样** |
| 提示词原文 `Three gates: >15 files ⇒ split · spanning faces ⇒ split by face · ...` | `thincoder-core/prompts/persona-engineering.md:362` 逐字 `**Three gates, every one of them**: **>15 files ⇒ split** · **spanning faces ⇒ split by face** · **an undecided call inside the implementation face ⇒ settle it first**` | 原记录是缩写，非逐字；**且漏了第三闸**，正是本轮 🔴#1 的来源 |

**教训（写进本档，不进我的记性）**：**§1 的「父侧实扫」同样是读数，一样会漂、一样会缩写失真。** 我拿一份缩写的回忆当实扫结果写进批档，评审照它判，就差一点让第三闸被删掉。

**处置**：`§1.2` 原文不回改（§1 是 append-only 记录面），以本行为准；后续引用一律按现盘重读。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（2026-11-01 · 修正轮已落）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试覆盖 / 验收对照 / 关键决策 / 上抛项>

## 2. 批次任务与设计（eng-designer）

**覆盖账 = #1961**（PROMPT-SYSTEM · 归批）。前情 = #1960（`docs/batches/2026-11-01-touched-means-fix.md`，进行中）。

**任务一句话**：删掉「一次派单只跨一个变更面」这条纪律——`thincoder-core/prompts/persona-engineering.md` 的两行换成四行；`files` ≤15 档保留，理由换成它真正的用处；验收面照写，但不再由「面数」决定拆不拆；未决口径先裁这一闸保留（自占一行）。

### 2.1 本批条目（覆盖 1 条）

| # | 条目 | 判据来源 | 状态 |
|---|---|---|---|
| 1 | 派单尺寸纪律去掉「一面一单 / one change face」 | 设计 §6.64 ∥ §6.9 | 待实施 |

### 2.2 设计档落点（人读权威 · 均已在盘）

- `docs/core/design/PROMPT-SYSTEM.md` §6.9（`:261` 标题 · `:266` 机制 ①② · `:268` why · `:272`–`:277` 英文逐字围栏块，内容四行 = `:273`-`:276`）——机制面单源。
- `docs/core/design/PROMPT-SYSTEM.md` §6.64（`:5301` 起）——本批的判 ∥ 验收 ∥ 用例 ∥ 决策 ∥ 上抛项。
- 回收面已在盘（行号 = 修正轮现盘）：§6.39 对照行（`:1928`）与用例 C4（`:1940`）· §6.56 A6（`:4396`）· §7 D-PS10（`:4760`）——三处回收（§6.39 ∥ §6.56 ∥ D-PS10），加上一条新决策行 D-PS56（`:4809`）。

### 2.3 逐字替换块（实施席照此落笔 · 四行，各 ≤300 字符）

替换对象 = `thincoder-core/prompts/persona-engineering.md` 的两行：`- **Dispatch size discipline (pre-flight · one dispatch, one change face)**: …` 与紧随的 `  **Three gates, every one of them**: …`（行号 as-of 设计轮 = `:361`-`:362`）。

整体换成下面四行，一条规则一行、不串分号；缩进照写（首行无缩进，后三行两空格）。第三行 = 原 `Three gates` 那句里的「未决口径先裁」闸——它不属尺寸面、也不属验收面，自占一行。

```text
- **Dispatch size discipline (pre-flight)**: a dispatch's `files` list is ≤15 files — small enough to state in one line and for the conflict detector to mean something. Size is about saying it clearly, not about cutting the work into faces.
  **Acceptance surface**: every dispatch still states what it will be verified against. The acceptance surface follows the work you are shipping — it is never derived from how many kinds of file you happen to touch.
  **Settle it first**: an undecided call inside the implementation face gets decided before the dispatch goes out — leaving "it depends" to the implementer makes them come back and ask, and the round pays for a decision you could have made now.
  **The why**: a batch that touches one face is still one batch. A real case: 38 documents, one face, split into 11 design rounds — eleven rewrites of the same task book, eleven chances for coordinates to drift, and not one extra thing verified.
```

四行字符数 = 240 ∥ 215 ∥ 244 ∥ 245（设计轮 `node` 实算）。本块的唯一权威副本 = `docs/core/design/PROMPT-SYSTEM.md` §6.9 围栏块；此处为任务书抄件，落笔以设计档为准。

### 2.4 受影响文件（6 档 · 两层面）

| 档 | 改什么 | 笔主 / 面 |
|---|---|---|
| `thincoder-core/prompts/persona-engineering.md` | 两行（`:361`-`:362`）换四行；492 ⇒ 494 行；其余零改 | 实施轮 · 产品代码面（提示词） |
| `docs/core/design/PROMPT-SYSTEM.md` | §6.9 计数句 `:270` + 围栏块 `:272`-`:277`（内容四行 `:273`-`:276`）· §6.64 · §7 D-PS56 | 本席 · 设计档面 |
| `docs/core/design/TOOLS.md` | `:1774` 标题 · `:1781` 依据句（§2.8 ∥ §2.9） | 本席 · 设计档面 |
| `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` | `:634` 分舱依据句（§2.10） | 本席 · 设计档面 |
| `docs/core/requirements/ENGINEERING-MODE-V2.md` | `:333`-`:335` 三行（尺寸上限 ∥ 跨面不构成拆单理由 ∥ 预检两闸） | 主 agent · 需求档面（已随正） |
| 本批档 `docs/batches/2026-11-01-dispatch-one-face-retire.md` | §2 全轮 | 本席 · 记录面 |

层级结论：六档全为 `.md` 文本（提示词 ∥ 设计 ∥ 需求 ∥ 批档），零包结构 ∥ 接口 ∥ 数据形状改动 ⇒ 不跨 tier，无拆分计划。提示词档虽属产品代码面，本批只动其文本行，不碰任何导出面。

### 2.5 验收（回指 设计 §6.64 A1–A6）

| # | 判据 | 命令 / 读数 |
|---|---|---|
| A1 | 落点四行与 §6.9 围栏块逐行相等 | `node` 逐行 `===`；该档行数 492 ⇒ 494（**计数式** = 去掉档尾换行后按 `\n` 切分的元素数；按物理行算则两端各 +1，同式子同法） |
| A2 | 旧说法清零 | `node` 扫 `thincoder-core/prompts/`：`one change face` ∥ `spanning faces` ∥ `split by face` 各 0 命中（设计轮读数 = 1 ∥ 2 ∥ 1，全部落在本批替换的两行内） |
| A3 | 行宽 | 四行各 ≤300（240 ∥ 215 ∥ 244 ∥ 245）；全档 `>300` = 0（现盘 492 行 / 最长 300） |
| A4 | 引用锁零新 | `node scripts/prompt-refs-check.mjs` 命中数与改前同（改前读数由实施席实跑报 §5） |
| A5 | 文档纪律 | `doc_check(mode:"gate", target:"D:/teamcode/thincoder")` 首行 `PASS` |
| A6 | 第三闸在位 | `thincoder-core/prompts/persona-engineering.md` 第 3 行逐字含 `an undecided call inside the implementation face`（设计轮实读：全 16 档该串改前 1 处 = 被替换的 `:362`，改后 1 处 = 第 3 行本身） |

验收面 = 本批改动面（六档）的读数，逐档可机判；不跑全套，不新增单测档（纯文本改动、无可断言的行为导出值——设计 §6.64 集成测试设计 = `none`）。

### 2.6 禁止范围（携后果）

- **不动该档其它行**：同节 `Structure decisions belong to design / dispatch` ∥ `A task book is a table, not prose` ∥ 禁令携后果三条照旧。顺手改 = 这些既有条款的当前形态与设计档对账被打散，评审分不出哪条是本批的。
- **不动 `docs/core/requirements/ENGINEERING-MODE-V2.md`**（需求档 = 主 agent 笔域，见 2.7 第 1 条）：动它 = 同一批里落了一条主 agent 未批准的需求改写。
- **不动 `docs/core/design/PROMPT-SYSTEM.md`**（设计面已收口、待评审冻结）：实施轮改它 = 评审对象在评审期内变动。
- **不新增机检、不设豁免**（设计 §6.64 K4）：面数从来不是机械可判的量。

### 2.7 上抛项（父侧处置）

1. **〔待父侧落 · 阻断实施〕需求档与用户裁定相反**：`docs/core/requirements/ENGINEERING-MODE-V2.md:332`-`:333` 仍写「一舱一单面：`files` 声明面 **≤15 档且不跨变更面**——跨面 ⇒ **按面拆舱**」。需求档 = 主 agent 笔域，本席零触；须在实施轮之前随正，否则实施席面前摆着两处相反的现行要求。
2. 〔知会 · 射程外悬空〕`docs/core/design/TOOLS.md:1781` 以「跨面 ⇒ 按面拆」作两个变更面不合并的依据 ⇒ 本条删后该理由悬空。不在本批射程（父侧限定只动设计档 + 批档），本席只报不改。
3. 〔知会 · 编号〕§7 本席落 D-PS56（顺 D-PS55 下一位）；编号可由父侧收口时改。

### 2.8 回收：`docs/core/design/TOOLS.md:1781` 的悬空依据（eng-designer · 2026-11-01 第二轮 · 就地改，已落）

**条目**：§2.7 上抛项 2 那处——`docs/core/design/TOOLS.md` 「实施拆分（两舱）」块末句，拿本批已删的规矩（跨面 ⇒ 按面拆）当两舱不合并的依据。父侧本轮裁定射程 = 该一处 + 本节追加。

**原逐字（改前）**：

> 不合并的理由：两个变更面各自有独立验收面（文本子串 vs 单测分支），且按派单尺寸纪律「跨面 ⇒ 按面拆」；两舱文件不重叠，可并行派工，`dependsOn` 不需要。

**改后逐字（现盘 `docs/core/design/TOOLS.md:1781` · 95 字符）**：

> 不合并的理由：两舱文件集不重叠 ⇒ 可并行派工、`dependsOn` 不需要——`files` 本就是调度通道（冲突检测用），不是切面依据；验收面是同一份 A1–A5，两舱各读其中一部分。

**判（三选一 = 第 1 类：结论仍成立，只是理由写错了）**

| # | 依据 | 实读 |
|---|---|---|
| 1 | 派工结论不动 —— 拆分是已发生的调度事实 | 该机制已在盘：`thincoder-core/agent-tools/subagent-spawn.mjs:423`（`export function designTokenRefusal`）∥ `:434`（`export function gateDesignToken`）|
| 2 | 删掉「各自有独立验收面（文本子串 vs 单测分支）」= 代理指标换了说法 | 同节 `docs/core/design/TOOLS.md:1749`-`:1755` 的 A1–A5 是**一份**验收表；两舱各读其中一部分（`:1778` 舱 A = `A1 + §6.35 A1–A4` ∥ `:1779` 舱 B = `A2 / A4 / A5`），并无第二份验收面 |
| 3 | 删掉「按派单尺寸纪律『跨面 ⇒ 按面拆』」= 依据已删 | 该规矩由用户 2026-11-01 19:30 / 19:31 裁定删除，设计面落 `docs/core/design/PROMPT-SYSTEM.md` §6.9 ∥ §6.64 |
| 4 | 留下的真理由可自证 | 两舱文件集不重叠（舱 A 三档 vs 舱 B 一档 + 单测档，交集为空）⇒ 并行调度成立；`files` 是调度通道（冲突检测用），与新规「尺寸只关一单说不说得清」同向；本批派单量 = 4 档，尺寸闸未触发 |

**同根残留（报父侧 · 本席未改 · 非阻断）**

| # | 坐标 | 现文 | 不改的理由 |
|---|---|---|---|
| R1 | `docs/core/design/TOOLS.md:1774` | `**实施拆分（两舱 · 按面）**：` | 标题记的是那一批**实际怎么拆的**（已发生的事实），不是现行处方；改它 = 给一次已发生的调度换说法 |
| R2 | 同档 `:1776` | 表头 `| 舱 | 变更面 | 文件 | 验收 |` | 同上：列名描述那批两舱各住哪类面，是记录不是判据 |

父侧若要连这两处一并收（把它们判为处方而非记录），一句话即可，本席下一轮照办——本席不自行扩射程。

**验收（父侧裁定面）**

| # | 判据 | 读数 |
|---|---|---|
| A6 | 该档旧依据清零 | `node` 扫 `docs/core/design/TOOLS.md`：`跨面 ⇒ 按面拆` = 0 ∥ `独立验收面` = 0 ∥ `按派单尺寸纪律` = 0（本轮实跑） |
| A7 | 改动面单点化 | 该档 1799 行 ⇒ 1799 行（单行换单行，行数 ±0）；除 `:1781` 外零改 |
| A8 | 行宽 ∥ 文档纪律 | 改后 `:1781` = 95 字符（≤300）；`doc_check(mode:"gate", target:"D:/teamcode/thincoder")` 首行 `DOC-CHECK GATE: PASS` |

**§2.8 更正一笔（本席自查 · 计数）**

2.8 判表第 4 行写「本批派单量 = 4 档」是错的。

逐行数该块 `docs/core/design/TOOLS.md:1778`-`:1779` 两行：

- 舱 A 三档 = `thincoder-core/tool-docs/subagent.md` ∥ `thincoder-core/agent-tools/subagent.mjs:146` ∥ `thincoder-core/prompts/persona-engineering.md`；
- 舱 B 两档 = `thincoder-core/agent-tools/subagent-spawn.mjs` ∥ 本批单测档；
- 合计 = **5 档**。

结论不变：5 ≤15，尺寸闸未触发；两舱文件集交集仍为空。

### 2.9 父侧裁定 R1 ∥ R2 的落笔（eng-designer · 2026-11-01 第三轮）

**射程**：`docs/core/design/TOOLS.md:1774` 一行 + 本节追加。R2 零触，该档其余零触。

**R1 = 收（父侧判为处方，非记录）**

| 面 | 逐字 |
|---|---|
| 改前（`:1774`） | `**实施拆分（两舱 · 按面）**：` |
| 改后（现盘 `:1774` · 22 字符） | `**实施拆分（两舱 · 文件集不重叠）**：` |

父侧判据（两句，逐字要点）：① 标题里还把「按面」摆成组织原则 —— 纪律已删，状态档里的一个标题教下一个读者「该按面拆」；② 标题本身也不准确 —— 真驱动是两舱文件集不重叠 ⇒ 可并行调度，即同节 `:1781` 已改对的那句。

**R2 = 判留（父侧判为记录，非处方）**：`docs/core/design/TOOLS.md:1776` 表头 `| 舱 | 变更面 | 文件 | 验收 |` 原样保留。判据 = 它标的是那一批实际沿哪条面界拆的事实，「描述一个已发生的划分」与「要求以后都这样划」是两回事；按面拆要命的不是「面」这个词，是拿它当拆单依据。

**验收读数（本轮实跑）**

| # | 判据 | 读数 |
|---|---|---|
| A9 | 该行逐字对上 | `:1774` = `**实施拆分（两舱 · 文件集不重叠）**：`，22 字符（≤300） |
| A10 | 单点化 | 该档 1799 行 ⇒ 1799 行（单行换单行 ±0）；除 `:1774` 外零改 |
| A11 | 旧依据仍清零 | `node` 扫该档：`跨面 ⇒ 按面拆` = 0 ∥ `独立验收面` = 0 ∥ `按派单尺寸纪律` = 0 |
| A12 | 无同根悬空近邻 | 该档余下三处 `按面` 指别事（`git-run` 超时常量缺省 · 装配层按面裁表两处），与本纪律无关 |
| A13 | 文档纪律 | `doc_check(mode:"gate", target:"D:/teamcode/thincoder", docs=[docs/core/design/TOOLS.md, 本批档])` 首行 `DOC-CHECK GATE: PASS`（0 段有问题） |

**R2 的「变更面」列一个残留在盘，本席零改**：`:1776` 表头是本档唯一仍写「变更面」的一行；父侧已判为记录，本席照判据留。

### 2.10 修正轮：评审 §3 轮次 1（changes-required）逐条落笔

**射程**：9 条里本席落 #1 ∥ #2 ∥ #3 ∥ #4 ∥ #6 ∥ #7 ∥ #8 ∥ #9；#5（§1.2 父侧实扫坐标失真）住主 agent 段，本席零触。

| 号 | 等级 | 改在哪 | 改后逐字 / 读数 |
|---|---|---|---|
| #1 | 🔴 | 设计档 §6.9 围栏块 `:272`-`:277`（内容四行 `:273`-`:276`）· `:270` 计数句 · §6.64 `:5310` 补「留：未决口径先裁」· A1 ∥ A3 ∥ A6 · 本档 §2.3 ∥ §2.4 ∥ §2.5 | 第 3 行 = `  **Settle it first**: an undecided call inside the implementation face gets decided before the dispatch goes out — leaving "it depends" to the implementer makes them come back and ask, and the round pays for a decision you could have made now.`（244 字符）；四行 = 240 ∥ 215 ∥ 244 ∥ 245；该档 492 ⇒ 494 |
| #2 | 🔴 | 设计档 §6.64 标题 · 上抛项 1 | 标题现读 `两行换四行 · 需求档已随正`；上抛项 1 枚举改 `docs/core/requirements/ENGINEERING-MODE-V2.md:333`-`:335` |
| #3 | 🟡 | `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md:634` | `**分舱（该批的调度选择：舱内文件集不重叠 ⇒ 可并行；舱间按依赖排序）**：22 档分五舱；表里「面」列记的是各舱实际落在哪类档上，是记录、不是拆单依据。`（78 字符） |
| #4 | 🟡 | 本档 §2.4 | 六档表 + 层级结论按全集重述（六档全 `.md` ⇒ 不跨 tier） |
| #6 | 🟡 | 本档 §2 状态行 | 两条 ⇒ 一条（`:57`）；括注里那句自我更正确认进 §2.2 第三条 |
| #7 | 🔵 | 本档 §2.2 | §6.64 坐标 = `:5301`；回收面五处按现盘重读 `:1928` ∥ `:1940` ∥ `:4396` ∥ `:4760` ∥ `:4809` |
| #8 | 🔵 | 设计档 §6.64 A1 · 本档 §2.5 A1 | 计数式 = 去掉档尾换行后按 `\n` 切分的元素数（现盘 492 / 物理切分 493；改后 494 / 495，两端同法） |
| #9 | 🔵 | 判 = 不加 | `docs/core/design/TOOLS.md:1781` 的真依据已写定；`:1776` 表头与「面」字上轮已判记录（`:1774` 收 / `:1776` 留）⇒ 再补「该批的调度选择」= 同一句说第二遍（D2）；本轮父侧边界也只列本档 ∥ BATCH-LEDGER ∥ 批档 §2 |

**#3 的判据（记录 ∥ 处方）**：该批 22 档里的新 / 改档全部在盘（`skip-dirs.mjs` ∥ `agent/write-face.mjs` ∥ `agent-tools/batch-ledger-bind.mjs` ∥ `batch-closeout.mjs` ∥ `batch-reopen.mjs` ∥ `agent/live-batch.mjs` 逐档 `fs.existsSync` 实读，全 EXISTS）⇒ 分舱是已发生的调度选择，属记录。

旧括注引的需求档句已退场（死指针），「舱内不跳面」是那条已退规则留下的处方句 ⇒ 两处都换掉，表与「面」列原样留（同 `:1776` 判据）。

**偏差一笔（#2 枚举范围）**：父侧给 `:333`-`:334`；本席实读改动区 = `:333`-`:335`——第三条 `预检两闸`（含「未决口径 ⇒ 先裁」）也在改动区内，故枚举写到 `:335`。

**同因连带（坐标下移 1 行）**：§6.9 围栏块 +1 行 ⇒ 该档 §6.39 ∥ §6.56 ∥ D-PS10 ∥ D-PS56 四处坐标各下移一行；§6.64 勘察证据行与 §2.2 已按现盘重读，不留在旧号上。此为 #7 一类的同根项，本席自查补收。

**读后自查（三交叉）**：

- 引用集 ↔ 标题集：本轮所引 §6.9 ∥ §6.39 ∥ §6.56 ∥ §6.64 ∥ §7 D-PS10 ∥ D-PS56 逐节在盘（`node` 逐节标题实读）。
- 表行 ↔ 汇总数：§2.4 表 6 行 ↔ 结论句「六档」；围栏块 4 行 ↔ 字符数 4 个读数。
- 断言 ↔ 实测：四行 240 ∥ 215 ∥ 244 ∥ 245；492 ⇒ 494；`:634` = 78 字符；`Settle it first` 提示词面改前 0 命中；`an undecided call inside the implementation face` 提示词面 = 1 处（`:362`）——全部本轮 `node` 实跑。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**设计评审（第 1 轮 · 对象 = 批档 §2 全轮 + `docs/core/design/PROMPT-SYSTEM.md` §6.9/§6.39/§6.56/§6.64/§7 + `docs/core/design/TOOLS.md` §8 拆分块）**

| # | 类别 | 严重度 | 问题 | 建议 |
|---|---|---|---|---|
| 1 | 需求覆盖（静默丢条） | 🔴 | 替换块三行只留尺寸闸 ∥ 验收面 ∥ why，把 `thincoder-core/prompts/persona-engineering.md:362` 的第三闸 `an undecided call inside the implementation face ⇒ settle it first` 一并删掉；该句在 `thincoder-core/prompts/` 全 16 档唯一（实扫只有该行一处）。而 `docs/core/design/PROMPT-SYSTEM.md:266` 机制 ② 仍写「未决口径落在实施面内 ⇒ 先裁」，`docs/core/requirements/ENGINEERING-MODE-V2.md:334` 仍列为预检三闸之一 ⇒ 设计面留、提示词面丢。 | 二选一并写进 §6.64 的删/留清单与验收：① 目标形保留该闸（自占一行，合 FR46）；② 判定删除，则 `docs/core/design/PROMPT-SYSTEM.md:266`、需求档该行与 A2 清除面同步删除并写明理由。现形是两处口径不同而无一处记录该决定。 |
| 2 | 文档所有权（同一机制两处相反） | 🔴 | 需求档仍载已退场规矩：`docs/core/requirements/ENGINEERING-MODE-V2.md:333` 逐字含 `一舱一单面` 与 `跨面 ⇒ **按面拆舱**`；`:334` 逐字 `派单前**预检三闸**：档数 >15 ⇒ 拆 · 跨面 ⇒ 按面拆`。§6.64 上抛项 1（`docs/core/design/PROMPT-SYSTEM.md:5367`）只枚举 `:332`-`:333`，漏 `:334`；本轮实读盘上两处仍是旧文，父侧所述「已按新口径改成尺寸上限」未在盘。 | 需求档两条判据句改成尺寸上限 + 明写「跨面不构成拆单理由」，同时保留「未决口径 ⇒ 先裁」；上抛项 1 枚举改为 `:333`-`:334`，并把「需求档已随正」写成实施轮的前置读数。 |
| 3 | 勘察面（同族悬空依据漏扫） | 🟡 | 本批把 `docs/core/design/TOOLS.md:1781` 判为须收的悬空依据，却漏了同族另一处活档：`docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md:634` 逐字 `22 档按变更面分五舱，舱内不跳面，舱间按依赖排序`，其括注正引需求档 `:333`「一舱一单面 ≤15 档」为据。A6/A11 扫描域 = 单档，抓不到。 | 清零扫描扩到设计档面（`一舱一单面` ∥ `按变更面分舱` 两串），或列为上抛项并给判据（记录 ∥ 处方）。 |
| 4 | 清晰度（受影响文件表失真） | 🟡 | 批档 §2.4（`:96`）只列 1 档，层级结论（`:98`）逐字 `本批只跨产品代码面一层，不跨 tier`；但 §2.2 已含 `docs/core/design/PROMPT-SYSTEM.md` 六处、§2.8/§2.9 已含 `docs/core/design/TOOLS.md` 两处，实际改动面 ≥3 档、跨两层面。 | 受影响文件表补全（三档 + 本批档），层级结论按全表重写（三档均 `.md` ⇒ 行数档位不适用/不越档）。 |
| 5 | 证据准确性 | 🟡 | 批档 §1.2（`:22`-`:26`）当父侧实扫给出的读数与盘上不符：所引 `docs/core/design/PROMPT-SYSTEM.md:1917` 在盘为空行（该档现无「按面拆分 / 一面一单」字样，最接近的 `:1927` 已是回收后新句）；所引提示词句 `Three gates: >15 files ⇒ split` 亦非逐字（盘上 `:362` 为 `**Three gates, every one of them**: …`）。 | 两处按现盘改写：坐标取 `:1927` 与 `thincoder-core/prompts/persona-engineering.md:361`-`:362` 整行逐字，读数附时点。 |
| 6 | 记录态（状态行重复） | 🟡 | §2 内出现两行 `**状态行**：`（`:57` 与 `:60`），`:57` 括注且为自纠句式「四处回收 = 三处回收 + 一条新决策行」。 | 每段只留一行状态行；计数口径写进正文而非状态行括注。 |
| 7 | 坐标漂移 | 🔵 | 批档 §2.2（`:77`）写 §6.64 起于 `:5298`，实读标题在 `:5300`（`:5298` 是 §6.63 末行）。 | 改为 `:5300`，或依既有口径只给节名。 |
| 8 | 读数口径（行数） | 🔵 | A1（`:104`）断言 `该档行数 492 ⇒ 493`；按尾行读数该档已到 `:493`（尾随空行），两种计数法只差这一行口径。 | A1 写明计数式（如去尾换行后按换行切分），否则 +1 断言依赖约定。 |
| 9 | 判分界核对结论（`docs/core/design/TOOLS.md`） | 🔵 | 父侧「`:1774` 收 / `:1776` 留」站得住：`:1774` 是标题、读者当组织原则；`:1776` 表头 `| 舱 | 变更面 | 文件 | 验收 |` 记的是那一批已发生的划分；结论（不合并）仍成立。残余：`:1781` 说 `files` 不是切面依据，同块 `:1776`/`:1778`（`舱 A · 文本面`）仍以面命名；`:1781` 的 `验收面是同一份 A1–A5` 略去舱 A 的 `§6.35 A1–A4`。 | 判分界保留；`:1781` 可补一句该批这样拆属调度选择的记录口径，措辞与列名不冲突。 |

**四件审结论（逐条）**

- ① `docs/core/design/PROMPT-SYSTEM.md:266` 机制 ①② 与 `:268` why 确已拿下「按面拆」，理由换成尺寸闸真用处（小到一次说清 + 冲突检测有意义），不是同一错误的换词。
- ② §6.64 与 D-PS56 只记裁定、理由与规则同住提示词行，逐字块未在本档复制第二份（唯批档 §2.3 为任务书抄件，已自标以 §6.9 为准）。
- ③ `docs/core/design/TOOLS.md:1781` 换依据后结论仍成立；`:1774` 收 / `:1776` 留 的分界站得住。
- ④ 替换块三行与 §6.9 围栏块逐字一致；行宽 240 ∥ 215 ∥ 245（本席逐字复算，与档内读数同），各 ≤300。

**另判（需求档与设计面是否单源）**：否——见 #2，盘上未改且漏 `:334`。

**VERDICT: changes-required**

计数：🔴 2 ∥ 🟡 4 ∥ 🔵 4

## §4 用户批准（主 agent）
## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）
