# 2026-10-28 · 行号引用重锚
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-28 · 来源 = 台账核账（2026-10-28 12:5x）：`#1867` —— `docs/core/**` 里引 `thincoder-core/prompts/persona-engineering.md` 行号的行，父侧现扫 **148 行**（行内历史记 39+37=76，三组数全过期）。用户 12:57 逐字「后面有真活的五条也处理掉啊！」= 开这批。。
> 台账 = #1894（core · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-28
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 本批做什么（`#1867` · 行号引用重锚）

**用户逐字**：「后面有真活的五条也处理掉啊！」（2026-10-28 12:57）。

**事实（父侧 2026-10-28 12:5x 实扫，非行内旧数）**：`docs/core/**` 里含 `thincoder-core/prompts/persona-engineering.md:<行号>` 的行 = **148 行**。行内历史记「39 处」、修正轮又报「37 处」，**三组数全部过期**。

**⇒ 本批第一步不是改，是重新建立清单**：现扫 148 行、逐行判它属哪一类，再决定各处下场。

### 1.2 处置口径（两类，下场不同）

| 类 | 例 | 下场 |
|---|---|---|
| **决策登记 / 边界陈述** | 记「某规则落在该档 `:N`」 | 该指向**现状** ⇒ 坐标必须收正 |
| **勘察记录（as-of）** | 记「2026-10-XX 实读该档 `:N` 是 X」 | 该指向**当时** ⇒ 保留原坐标，另标时点 |

**★ 这个判法在本会话已验证可用**（`#1871` 修正轮在 `:4884`-`:4983` 那 6 处勘察面上用过）：**混着改会删错东西** —— 决策登记改成旧号 = 指着不存在的位置；勘察记录改成新号 = 篡改历史记录。

### 1.3 边界

- **域**：`docs/core/**`（含 `requirements/` 与 `design/`）；**`docs/batches/**` 不在此列**（过程档，历史行号本就该留旧值）。
- **不是一律 +N**：`thincoder-core/prompts/persona-engineering.md` 的位移是**分段**的（行内记 +1/+2/+3/+4/+5 五段）—— 凡照「一律 +5」改的都会错，这条已在行内写死。
- **改完要复扫**：按当刻实读的 148 行为基线，改后同式再扫一遍，报前后读数。

### 1.4 四项上抛的裁定（父侧 2026-10-28 13:0x）

| # | 上抛 | 裁 |
|---|---|---|
| **U1** | 需求档 9 行（`docs/core/requirements/ENGINEERING-MODE-V2.md` 八行 + `docs/core/requirements/LIGHT-CHANNEL.md` 一行）设计席无写权（D1） | **我落，不分权** —— 但**不在现在落**：要等实施轮给出「行 → 新号」清单，我逐行改。**理由：需求档是主 agent 的笔，这条不因「只是改个号」而例外**（改号也是改需求档的规范面） |
| **U2** | 148 行里 1 行不带 `thincoder-core/prompts/` 路径段（`docs/core/design/ANCHOR-DEBT-REPAIR.md:362`） | **实施轮补路径段** —— 它已计入 148，不改判据也不漏计 |
| **U4** | 逐行判类表本轮未成表，只给判据 + 4 条实证 | **接受** —— 成表是实施轮首件，父侧按 §2.2 / §2.3 抽验。**`docs/core/design/PROMPT-SYSTEM.md` 那 117 行不能按「整档算历史」推断**（设计席这句对：只能逐行定） |
| **U3** | 裸 `:NN` 续引形（同段后只写 `:331` ∥ `:345`）不在本批正则射程 | **不扩，记台账** —— 扩射程 = 改判据，那是另一件事；而**不改判据就纳入，等于让它悄悄漏检** |

**★ U4 那句我要单独表扬**：设计席主动写「117 行**多数疑为** B 类」并拒绝按整档推断 —— **它没有把「看起来都像」当成「都是」。** 今晚这类赌注已经栽过好几次。

### 1.5 本批最值钱的一条：分段表被证伪

**设计席实测出两处位移远超行程记的分段表**：`docs/core/design/PROMPT-SYSTEM.md:1518` 引的「欠账入清单」原记 `:96`，该规则现居 **`:188`（+92）**；同档 `:1132` 引 `:151`，该句现居 **`:323`（+172）**。

**⇒ 而 §1.2 写的「不是一律 +N，位移是分段的 +1/+2/+3/+4/+5」是从旧账里抄来的** —— 它描述的是**某一次**插入的位移，不是现在的累计位移。**

**★★ 这条对本批是决定性的：**按分段表算术换算会大面积改错。** 所以设计席的方法（引文锚 → 语义锚 → 版本锚，禁算术）不是保守，是**唯一可行**。

### 1.6 设计评审裁定（父侧 2026-10-28 13:0x）

**评审判 changes-required（🔴 2 · 🟡 7 · 🔵 2）。十二条全接受（含父侧另发现的一条），走修正轮。**

| # | 级 | 裁 | 处置 |
|---|---|---|---|
| 1 | 🔴 | **Fixed** —— AC-1 与 E5 相抵：E5 允许「删坐标」，C 行多为整行唯一引用 ⇒ 删后不再命中同式正则，复扫必 &lt; 148；AC-1 写死 148 且不标时点 ⇒ **交付态读数无定值** | AC-1 拆两条并标时点：改前 148 行 / 153 处；交付态 = 148 −（判类表「删坐标」行数），并要求表内记下被删行以便对账 |
| 2 | 🔴 | **Fixed** —— A/B/C 不互斥且无优先级 ⇒ 整批方向由实施席自拍。**父侧实证**：`docs/core/design/PROMPT-SYSTEM.md:1099` 引文 `Credentials never land in docs` **零命中**，该规则活在 `thincoder-core/prompts/persona-engineering.md:323`（`Credential values stay out of docs`）⇒ 按 2.2 判 C（删）、按 2.3 语义锚判 A（改指同一条）——**同一条规则两个相反下场** | 2.2 补优先级表：`as-of` ∥ 日期 ∥ 轮次标记在场 ⇒ B；无标记且引文锚或**语义锚**唯一命中现存句 ⇒ A（落点表里的行同判，不因「在表里」自动降 B）；两锚皆不成立 ⇒ C。AC-2 对同时满足两档特征的行报红 |
| 3 | 🟡 | **Fixed** —— C 类两条下场无选择规则 | 加一行：「同义句有唯一命中 ⇒ 改指（记旧引文 + 新引文）；否则删坐标（记旧引文 + 0 命中读数）」，并明示覆盖 `:1099` |
| 4 | 🟡 | **Fixed** —— AC-3 空锚恒真、不判「唯一命中」 | AC-3 增判：anchor 非空 ∧ 该串全档命中数 = 1；A→C 降级单独成 AC 行 |
| 5 | 🟡 | **Fixed** —— 判类表列契约未定形（列名散见 `:91` ∥ `:95` ∥ `:131` ∥ `:133`）；AC-2 漏 E2 的「各恰一行」 | 定死列集（档 / 行号 / 旧坐标 / 新坐标 / action / anchor / 备注）；AC-2 增判 `(档, 行号)` 去重后 = 148 |
| 6 | 🟡 | **Fixed** —— 标「实读」的引文转写错（`:83` 写 `(parent-side rules)`） | 逐字改；并写死「进判类表的实读引文一律逐字复制、不手打」 |
| 7 | 🟡 | **Fixed** —— 缺公共源勘察证据行 | 补该行（无相关也照写） |
| 8 | 🟡 | **Fixed** —— 集成面 `none` 有理由但无 RTM 读数 | 补 RTM 读数行 + 一句「无一行断言跨档行号」 |
| 9 | 🔵 | **Fixed** —— 先例行无「偏离」句 | 补偏离存根或改指先例批产出的设计档节 |
| 10 | 🔵 | **Fixed** —— AC-6 抓不到算术改错（算错也 ≤ 上限且非空） | 改成算术反证机检行：`:96` / `:151` 两条已知位移，记「分段表 delta 落点不载 anchor」为必红项 |
| 11 | 🟡 | **Fixed** —— 「多处同号冲突 ⇒ 停下重判」分支无场景 | 把 `docs/core/design/PROMPT-SYSTEM.md:1099` ∥ `:1132`（同指新号 `:323`、引文不同）作为场景引文 |
| **12** | 🟡 | **Fixed（父侧另发现）** —— `:120` 记「被引档现状 = 481 行」，**父侧实读 = 480 行**（`thincoder-core/prompts/persona-engineering.md`）。AC-6 的 `N ≤ 481` 也随之下修 | 改 480，AC-6 上限同改 |

**★ 第 2 条是本批真正的命门：**三档判据各说各的、没给优先级，148 行里绝大多数落在「既像 A 又像 B」的落点表里 —— **实施席按哪条走，整批结果就不同，而机检还全绿。**

### 1.7 修正轮上抛裁定（父侧 2026-10-28 13:0x）

**批准它的收窄。** AC-1b 的算法从「148 − 删坐标行数」改成「删后零引用的行数」，并要求同时报两个数对账。

**理由（它给的，我核过）**：**153 = 148 + 5 —— 有 5 行各带 2 处以上引用。落在这些行上的删坐标不会让该行掉出复扫。** 原算法在这 5 行上会算错，改成「删后零引用」才经得起反例。

**★ 它另外自己纠的两处，我记为「超预期」**：

- **9 档「现行数」整列都用 `split('\n').length`（各多 1）**，已按本仓口径 `-1` 改齐（5199 / 1031 / 463 / 1739 / 503 / 1214 / 364 / 1156 / 139）。**我只点了被引档 481 那一格，它查出同一处病在 10 格上。**
- **「470 → 475 → 478 → 481」的历史链**违「只写现状」，已删 —— 这条我派单时没提。

### 1.8 第 2 轮评审裁定（父侧 2026-10-28 13:1x）

**裁决 = pass（🔴 0 · 🟡 4 · 🔵 2）。上轮 11 条全 Fixed，已逐条实读证实。**

| # | 级 | 裁 | 处置 |
|---|---|---|---|
| N1 | 🟡 | **Fixed（本轮）** —— `:136` 的 C 例与 `:119` 序 2 相抵：该行 `备注` 列即被引档 `thincoder-core/prompts/persona-engineering.md:108` 的逐字句 ⇒ 语义锚唯一命中 ⇒ 依表应判 A | 改 C 例，或明写「`备注` 列的非引文形不参与语义锚命中」 |
| N2 | 🟡 | **Fixed（本轮 · 必改）** —— 2.4 表三格仍多 1（`docs/core/design/LIGHT-CHANNEL.md` 503 · `docs/core/design/MANIFEST.md` 1214 · `docs/core/requirements/LIGHT-CHANNEL.md` 139），与本节自己声明的 `split('\n').length - 1` 口径不符 ⇒ **AC-8 交付态必假红** | `node` 复算三档后改齐 502 / 1213 / 138 |
| N3 | 🟡 | **Fixed（本轮）** —— `:187`「5 行各带 2 处以上引用」实为 **4 行**（`:2102` ∥ `:4624` ∥ `:4921` ∥ `:5031`），5 是额外处数不是行数 | 改「4 行共带 5 处额外引用」 |
| N4 | 🟡 | **Fixed（本轮）** —— AC-3 的「命中数 = 1」与 2.3 的「多处命中取小节内那处 + 记理由」相抵 | AC-3 补「多命中 ⇒ 加长锚至唯一，或按 2.3 记取值理由后放行」 |
| N5 | 🔵 | **接受（不改）** —— 序 1 无 AC 断言、AC-2b 靠实施席自报 | 记进 §6 收口作为已知残余；理由：**序 1 的标记识别是机械串扫，实施席自报 + 父侧抽验已够；再加一条 AC 只会把判据堆高，不增信息** |
| N6 | 🔵 | **Fixed（本轮）** —— 2.4.1 的 `anchor` 列把两种形并列给两类 | 拆成「A = 唯一命中串；C 改指 = 旧引文 + 新引文」 |

**★ N2 是本轮最要命的一条**：它不是「数字不好看」，是**交付门会假红** —— 实施席改对了，AC-8 却红，然后**去改一个本来没问题的东西**。这种判据最伤：它让人不信门。

### 1.9 修正轮上抛裁定（父侧 2026-10-28 13:1x）：**N2 撤回，我错了**

**`#78` 顶回 N2 的理由成立。父侧用 `node` 实量复核（不是读工具）：**

| 档 | `split()` | `split-1` | 换行数 | 末字符 | 2.4 表值 | 判 |
|---|---|---|---|---|---|---|
| `docs/core/design/LIGHT-CHANNEL.md` | 504 | **503** | 503 | `\n` | 503 | ✓ |
| `docs/core/design/MANIFEST.md` | 1215 | **1214** | 1214 | `\n` | 1214 | ✓ |
| `docs/core/requirements/LIGHT-CHANNEL.md` | 140 | **139** | 139 | `\n` | 139 | ✓ |
| `docs/core/design/PROMPT-SYSTEM.md` | 5200 | **5199** | 5199 | `\n` | 5199 | ✓ |
| `thincoder-core/prompts/persona-engineering.md` | 481 | **480** | 480 | `\n` | 480 | ✓ |

**⇒ 9 格全部正确，N2 不成立（撤回）。** 建议值 502 / 1213 / 138 是把 `split-1` 再减一次 —— **多减一次，会让本来对的值变错、让 AC-8 真红。**

**★ 错因要说清，因为它会重犯**：**评审和我都拿「读工具报的行号」当行数。** 读工具对 `thincoder-core/prompts/persona-engineering.md` 报到 481（末行空），对 `docs/core/design/LIGHT-CHANNEL.md` 报到 503 —— **同一把尺子在不同档上给出的基准不一致**，于是「9 格里 3 格差 1」。

**★★ 定则（已并入 `#1900`）：行数一律用 `node` 的 `split('\n').length - 1` 量，不用读工具行号判；且量数命令必须写进判据，让别人能复跑。** `#78` 做的正是这件事：AC-8 现在自带一行可复跑的 `node -e`，并写明「换成 `split().length` 读出的值不许用来判」。

**其余四条的核**：N1 已落（且它举出**本轮无 C 实例**——`:1092`/`:1093`/`:1098`/`:1099` 四行语义锚全命中，全归 A）· N3 已落（4 行 / 额外 5 处）· N4 已落（多命中两条路）· N6 已落（"anchor" 列拆三类）。**连带修了 K4 同一前提的第二落点**（原「0 命中已证目标句可消失」）。

### 1.10 用户裁定：史实保留无据 —— 与「只留现状、历史必删」相反

- **已定决定**：状态档里**不保留历史读数**（读数表 / 沿革 / 变更记录 / 时点陈述一律清），只留当前状态；理由是 RAG 污染 · 用户原话：「如果不是旧批档，史实保留就不是我的要求，相反，我的明确说的是只保留当前状态，历史都要清除，避免造成RAG」 · 时间：2026-10-28 13:30

**⇒ 据此撤回父侧 13:2x 给实施席的裁定 ②。** 我此前把 `docs/core/design/DOC-DISCIPLINE.md` §3.8 条目 I 的「B 史实保留 ⇒ 零触碰」当成判据，据此判 `docs/core/design/ANCHOR-DEBT-REPAIR.md` 的三行读数为「不许动」。

**★ 那是**自加规矩与用户裁定相抵**：**

- 用户既有裁定（同档 §4.5.8 引原文）：**「被改掉的错误会在 RAG 场景下成为污染」「RAG 污染是个非常大的问题」**
- 而条目 I 却给「读数表行」开了「零触碰（不改字、不加标记）」的口子

**两者不能同时成立**：一条说「历史必须清」，另一条说「历史行不许动」。**按指令优先序，用户的话高于项目档 ⇒ 条目 I 的 B 类分支要改，不是照它办。**

**处置（本批内）：** `docs/core/design/ANCHOR-DEBT-REPAIR.md` 那三行**读数控**按「历史必删」处理 —— 删掉，不做「改指现行档」也不做「零触碰」。**删掉之后门的锚命中随之消失，`#1901` 那个「门判整档 vs 存量债」的死结也就不需要靠存量基线去解了。**

**★ 我要记下的是这个错法，不是这个错**：**我引用了一条项目档里的规矩，却没有先问「这条规矩和用户说过的哪句话相抵」。** 上一轮我刚在 `#1901` 里把「门和规矩对撞」摊出来，转头自己又拿一条自加规矩去判事 —— **规矩越齐，越要问它从哪来。**

### 1.11 设计席三条上抛的裁定（父侧 · 2026-10-28 13:37）

**① 整张读数面按用户裁定删 —— 裁定「删」，但不进本批。**

**为什么删**：该档两线已收口（`#40` ∥ `#26` 核销在册），而它自报的合计 **833** 与当刻实测 **47877** 差两个数量级、口径也已换（引擎族变了）⇒ 表上的数既不是现状、又长得像现状。**这正是用户裁定要清的那一形。**

**为什么不进本批**：用户 13:34 定了顺序 —— **先清规矩，残留后清**。本批是「行号引用重锚」，把 200 行读数面删在这里，顺序就反了（残留清早了，规矩还没删，下一批又写回来）。**⇒ 记入「残留批」的首项，规矩批（`#1903`）落地后即开。**

**② 表体 ≠ 合计（改前就有：81 行 vs 声称 85 档；差 +4 档 · +4 / 0 / +11 / +15）—— 不修，随 ① 一并消失。**

**修它等于给一个马上要删的面做算术。** 而这条恰好是个证据：**该面早就对不上自己的账 —— 一个连合计都不等的读数表，留着它只会让人以为数是真的。**

**③ 被删 4 处的族归属（P1 假设）—— 不问，随 ① 一并消失。**

**④ C 类处置与用户裁定不相抵 —— 确认保留。** 父侧复核：C 类说的是「需求档谁落笔（D1 写权）」，不是「历史留不留」，两者不同轴。

**⑤ 父侧数字之误**：我报 TOOLS `1790 行 / +48 空行`，设计席实测 `1792 / +50`。**是实施席 `#83` 在两次测量之间又落了两处拆段**（我刚复量：现盘 **1792 行 / 441 空行 / 超长段 0**）。**读数取后者的** —— 记录一条：**同一档被两个席同时动时，任何一方报的行数只在自己那一笔前后成立。**

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（第 2 轮评审：N1 / N3 / N4 / N6 已落；N2 经实测否证（2.4 表三格行数本就正确，改法是给 AC-8 加机检命令使其可自证）；N5 按父侧裁不改、残余留 §6；判类表仍交实施轮首件）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试覆盖 / 验收对照 / 关键决策 / 上抛项>

**设计落点说明**：本批是坐标债收正，不新增机制 ⇒ 设计落 §2，不新建设计档。前例 = `docs/batches/2026-10-16-p4-code-face-ref-cleanup.md` §2（同类坐标收正批，设计即在 §2）。对齐与偏离见 K5。

### 2.1 本批条目（覆盖）

**需求源**：批档 §1（用户 2026-10-28 12:57 逐字「后面有真活的五条也处理掉啊！」）+ 台账 `#1894`（core · 归批）+ 前批留账 `#1867`。**无新增需求档条目**——本批处置的是同一事实的坐标面，不立新需求。

| # | 条目 | 判据（机检口径） | 落点 |
|---|---|---|---|
| E1 | **清单重建**：`docs/core/**` 里引被引档行号的行重新逐行成清单 | 改前基线 = 148 行 / 153 处（逐档计数见 2.4）；交付态读数按 AC-1b 记账 | 本 §2.4（读数已入） |
| E2 | **逐行判类**：每行判定 A ∥ B ∥ C（优先级见 2.2） | 148 行各恰一行记录；`(档, 行号)` 去重后 = 148；三类计数之和 = 148 | 实施轮首件：判类表（落 §5，列契约见 2.4.1） |
| E3 | **A 类收正**：坐标改成现状号 | 每条新号 N′ 满足：anchor 非空 ∧ 该串全档唯一命中 ∧ 第 N′ 行含 anchor | 判类表 + 复扫读数 |
| E4 | **B 类保号标时**：原坐标不动，补时点标记 | B 类行前后行号集合逐项相等（零改） | 同上 |
| E5 | **C 类处置**：目标句已不在档的引用（不猜新号） | 每条有处置，且由 2.2.1 的选择规则决定：改指（旧引文 + 新引文）∥ 删坐标（旧引文 + 0 命中读数） | 同上 |
| E6 | **复扫与前后读数** | 复扫读数入 §5；门禁按 2.5 AC-7 | §5 / §6 |

### 2.2 判类判据（E2 的唯一标准 · 带优先级）

**总口径取自批档 §1.2**：决策登记 / 边界陈述指向**现状** ⇒ 坐标必须收正；勘察记录（as-of）指向**当时** ⇒ 保留原坐标、另标时点。混改两头都错。

**三档特征**（实读该行文字判，不看关键词命中）：

| 类 | 识别特征 | 下场 |
|---|---|---|
| **A** 决策登记 / 边界陈述 | 告诉读者「某规则 / 某机制 / 某同源成文现在落在该档第几行」；读者会照它去找 | 改成现状号（2.3） |
| **B** 勘察记录 as-of | 行内自带读数时点：`as-of` ∥ `本次读数` ∥ `实读` ∥ 日期 ∥ 批档轮次 | 号不动；缺时点标记的补一个（K6 词形） |
| **C** 目标句已不在档 | A 类的引用，但其引文全档 0 命中、语义锚也定不到现存句 ⇒ 无号可指 | 改指 ∥ 删坐标（选择规则见 2.2.1） |

**三档不互斥 ⇒ 按序取第一条命中（优先级，不得跳序）**：

| 序 | 判据（同时满足） | 判 |
|---|---|---|
| 1 | 行内载时点标记（`as-of` ∥ 日期 ∥ `实读` ∥ `本次读数` ∥ 批档轮次） | **B** |
| 2 | 无时点标记，且引文锚或语义锚在现档**唯一命中**一句现存内容 | **A** |
| 3 | 两个锚都不成立（引文全档 0 命中 ∧ 语义无对应句） | **C** |

**两档特征同时在场**（例：一行既有 `as-of 本次读数`，又引一句今天仍在档的原文）⇒ 按序 1 取 B，并在判类表 `备注` 列写明「按 2.2 序 1 取 B」的一句判定；不许按「引文命中」改号。**落点表 / 读数表里的行同判**：在表里不自动降 B，按同一优先级逐行定。

**语义锚也算锚**（序 2 的关键）：

- `docs/core/design/PROMPT-SYSTEM.md:1099` 引 `:151`、引文 `Credentials never land in docs` 在被引档全档 **0 命中**（本席本轮实读）。
- 该条规则活在 `thincoder-core/prompts/persona-engineering.md:323`：`- **Credential values stay out of docs**: a token or designId value written into a design doc …`。
- 同档 `:1132` 引同一旧号 `:151`，引文 `Credential values stay out of docs: …`，新号同为 `:323`。

⇒ **`:1099` 按引文判会落 C（删坐标），按语义锚判落 A（改指 `:323`）—— 本批一律取 A**：规则还活着，删坐标就是删活指针。判 C 只在语义锚也定不到现存句时才成立（2.2.1）。

**A / B / C 的四个已核实例**（本席本轮实读，供实施轮对齐口径）：

- **A 例**：`docs/core/design/TOOLS.md:323` 写「提示词侧同源成文 = `thincoder-core/prompts/persona-engineering.md:45`」——第 45 行实读 = `- **Nothing important stays in your head**: …`，与项目根解析无关；该串全档唯一命中即第 45 行 ⇒ 坐标指的规则与行内说法不符，属 A 类，按语义锚重定。
- **A 例（位移远超分段表）**：`docs/core/design/PROMPT-SYSTEM.md:1518` 引「欠账入清单」为 `:96`——第 96 行实读 = `> **The user's next explicit instruction resumes advancement**…`；该规则现居第 188 行（`- **Debts go on the list**: …`），引文锚唯一命中 ⇒ 真号 188（+92）。同档 `:1132` 引 `:151`，第 151 行实读 = `## Dispatch & close discipline (parent-side rounds)`，该句现居第 323 行（+172）。
- **语义锚实例（`docs/core/design/PROMPT-SYSTEM.md:1092`）**：该行引 `:61` = `walk DOWN, never up`——该串在被引档全档 **0 命中**，但该行 `备注` 列的 `walking up lands the manifest in an unrelated enclosing project` 在被引档 **1 命中**（`thincoder-core/prompts/persona-engineering.md:108` = `**Project-root judgment walks DOWN** — walking up lands the manifest in an unrelated enclosing project; direct child directories only, no recursion.`）⇒ 语义锚命中 ⇒ **A 类**，改指 `:108`。同形再一例：同表 `:1093` 引 `Never brick the session`（0 命中），该规则活在 `thincoder-core/prompts/persona-engineering.md:120` `**Bricking the session is not an option any project state overrides**`（该行 `备注` 句在该行逐字）⇒ A，改指 `:120`。
- **C 类的成立条件（本轮无实例）**：判 C 须两锚皆空。本轮实读 4 行里 `引文 0 命中` 的 3 行（`:1092` ∥ `:1093` ∥ `:1098` 的 `Never let a design token expire` → 同档 `design token is short-lived`）语义锚全部命中现存句 ⇒ 全落 A；`:1099` 同理（`:323`）。⇒ **引文 0 命中是 C 的必要条件，不是充分条件**；实施轮只对「引文 0 命中 ∧ 语义锚也定不到现存句」的行判 C，并在 `备注` 记两锚落空读数（AC-3b）。
- **B 例**：`docs/core/design/ANCHOR-DEBT-REPAIR.md:362` 引 `thincoder-core/prompts/persona-engineering.md:100` 作行宽读数（「最长 1486 字符」）——是那一轮的测量记录，时点标记在场 ⇒ B 类，号不动。

**⇒ 三条实测读数合起来否掉两种便宜做法**：位移既不是「一律 +5」，也不是「按分段表套」（本例 +92 ∥ +172，远超该表）。**唯一可用的判法是内容锚**（2.3）。

### 2.2.1 C 类两条下场的选择规则

- **同义句唯一命中 ⇒ 改指**：`anchor` 列同时记旧引文与新引文，`新坐标` 填该句所在行。
- **否则删坐标**：`anchor` 列记旧引文 + 「全档 0 命中」读数，`新坐标` 填 `—`；`备注` 列记被删的坐标字面，供 AC-1b 对账。

**明示覆盖 `:1099` 这一形**：它的语义对应句唯一命中在 `thincoder-core/prompts/persona-engineering.md:323` ⇒ 走「改指」。按 2.2 它本就归 A；若实施席把它判成 C，本规则仍只许改指，不许删。

### 2.3 A 类收正方法（内容锚，逐条可复核）

对每个 A 类引用，按下列顺序取一个锚，锚必须写进判类表的 `anchor` 列：

1. **引文锚**（首选）：行内已给出被引句 / 短语 ⇒ 在现档全文找该串，唯一命中即新号。
2. **语义锚**：无引文但描述了规则内容 ⇒ 按该描述在现档定位对应行；多处命中时取同一小节内的那处，并在 `备注` 列记一句取值理由。
3. **版本锚**（前两者都不成立时）：以该行写下时的档版本为基准做逐行对齐，基准的 commit 记进 `备注` 列（列集固定，见 2.4.1）。

**进判类表的引文一律从被引档逐字复制**：用 `node` 读出的原行整行比对，不手打、不凭记忆改字。AC-3 判的是整串 `includes`，手打的引文与被引行差一个词即必假。逐字复制的范本：`:151` = `## Dispatch & close discipline (parent-side rounds)`（本席本轮实读）。

**三条硬约束**：

- **不许用算术**：任何 `oldN + Δ` 换算都必须由 1 / 2 / 3 之一证实后才写，否则视为猜。
- **锚填不出 ⇒ 该行转 C 类**，不许留原号充数（原号指错比缺号更贵：读者会照着去读，读到别的规则）；降级在 `备注` 列明写 `A→C 降级` 并记两锚落空的读数（AC-3b）。
- **多处同号冲突**：两个 A 类引用算出同一新号却指向不同规则 ⇒ 至少一处锚取错，停下重判并在表内记冲突行号。**场景（本席本轮实读）**：`docs/core/design/PROMPT-SYSTEM.md:1099` ∥ `:1132` 同指 `:151`、同落新号 `:323`、引文彼此不同（前者 `Credentials never land in docs` 全档 0 命中；后者 `Credential values stay out of docs: …` 逐字在位）。判法：逐条验引文后，同号同规则 ⇒ 合法（两条引文都指向同一现存句，`:1099` 记旧引文改指）；同号不同规则 ⇒ 冲突，停下重判。

### 2.4 受影响文件与测试覆盖

**实测基线（本席本轮 `node` 实扫，正则 `persona-engineering\.md:\d+`，扫 `docs/core/**` 下 127 个文档档）**：命中 **148 行 / 153 处**，分布 9 档。与 §1 记「148 行」对得上。

**行数口径**：全表 `split('\n').length - 1`（本仓既有口径）。10 档均以换行结尾，按 `split('\n').length` 读会各多 1。

**复算读数（2026-10-28 · 本席 `node` 实读）**：

- `split('\n').length - 1` = 5199 / 1031 / 463 / 1739 / 503 / 1214 / 364 / 1156 / 139 ⇒ 与下表 `现行数` 列**逐格相等**（AC-8 的机检命令实跑同读数）。
- 同档 `split('\n').length` = 5200 / 1032 / 464 / 1740 / 504 / 1215 / 365 / 1157 / 140。
- 9 档换行符计数与 `split-1` 全等（均以换行结尾 ⇒ 行数 = 换行符数）⇒ 拿 `split()` 的读数再减 1，会把 `design/LIGHT-CHANNEL` ∥ `design/MANIFEST` ∥ `requirements/LIGHT-CHANNEL` 读成 502 / 1213 / 138，与盘不符（多减了一次）。

| 档 | 命中行 | 处数 | 现行数 | 预期 Δ |
|---|---|---|---|---|
| `docs/core/design/PROMPT-SYSTEM.md` | 117 | 122 | 5199 | 行数 ±0 |
| `docs/core/design/AGENT-LOOP-SUBAGENT.md` | 10 | 10 | 1031 | 行数 ±0 |
| `docs/core/design/ADVISOR-CONVERGENCE.md` | 4 | 4 | 463 | 行数 ±0 |
| `docs/core/design/TOOLS.md` | 4 | 4 | 1739 | 行数 ±0 |
| `docs/core/design/LIGHT-CHANNEL.md` | 2 | 2 | 503 | 行数 ±0 |
| `docs/core/design/MANIFEST.md` | 1 | 1 | 1214 | 行数 ±0 |
| `docs/core/design/ANCHOR-DEBT-REPAIR.md` | 1 | 1 | 364 | 行数 ±0 |
| `docs/core/requirements/ENGINEERING-MODE-V2.md` | 8 | 8 | 1156 | 行数 ±0（主 agent 笔，见 U1） |
| `docs/core/requirements/LIGHT-CHANNEL.md` | 1 | 1 | 139 | 行数 ±0（同上） |
| **合计** | **148** | **153** | — | — |

**被引档现状**：`thincoder-core/prompts/persona-engineering.md` = **480 行**（同口径）。该档仍在增行 ⇒ 任何分段表都只能是线索（K2）。

**两个读数要分开记**：9 档**档行数** ±0（A 换号、B 补标记、C 删坐标都是同行内改写，不许新增 / 删除行；出现行数漂移 = 改了语义，须停下重判）；**命中行数**会下降（C 行删掉整行唯一一处引用后，该行不再命中同式正则）⇒ 交付态按 AC-1b。

**153 = 148 + 5**：**4 行共带 5 处额外引用**——`docs/core/design/PROMPT-SYSTEM.md:2102`（2 处）∥ `:4624`（3 处）∥ `:4921`（2 处）∥ `:5031`（2 处）⇒ 额外 = 1 + 2 + 1 + 1 = 5（本席本轮实扫）。删坐标落在这 4 行上时，该行仍会命中 ⇒ AC-1b 的计数须扣「删后该行零引用」的行，不能按「删坐标行数」直减。

#### 2.4.1 判类表列契约（E2 交付形 · 列集固定）

| 列 | 内容 |
|---|---|
| `档` | 命中行所在文档，仓根相对路径 |
| `行号` | 该行现号（改前号，非改后号） |
| `旧坐标` | 行内写的旧号（裸数字） |
| `新坐标` | A 类 = 现状号；B 类 = 与旧坐标相同；C 类 = 改指的新号 ∥ `—`（删坐标） |
| `action` | `A` ∥ `B` ∥ `C` |
| `anchor` | A = 被引档唯一命中串；C 改指 = 旧引文 + 新引文；C 删坐标 = 旧引文 + 全档 0 命中读数；B = 空（时点标记写 `备注`） |
| `备注` | 按优先级取值的判定句、版本锚 commit、`A→C 降级` 标记、被删坐标字面 |

**一行 = 原档一处命中行**，`(档, 行号)` 唯一（AC-2c）。列不许增删——版本锚的 commit、双档判定、删坐标字面一律进 `备注`。

**测试覆盖**：本批纯文档面，无可跑的产物测试。验收 = 一次性 `node` 复扫（不留存脚本）+ `doc_check(mode:"gate")`；两项读数入 §5，父侧 §6 复跑。

**集成面 = none**：无用户可见业务结果变化，既有集成用例断言的业务可观察结果零改，无新增场景。

- **公共源勘察**：`PROJECT-MANIFEST.json` 的 `index.publicRepos` = `[]`（本席本轮回读）⇒ 本仓无独立公共源文档仓可勘，已查、无相关。
- **RTM 读数**：`test/RTM.md` = 284 行 / `## ` 5 段 / `###` 21 / 表行 104；含 `persona-engineering` 的行 = 0，含 `.md:<行号>` 形的行 = 0 ⇒ **无一行断言跨档行号**，无行需增删改。

### 2.5 验收对照（逐条机检，回指 2.1）

| AC | 判据（命令 → 期望读数） | 回指 |
|---|---|---|
| AC-1a | 改前基线（时点 = 2026-10-28 本席实扫）：同式复扫 → `148` 行 / `153` 处；逐档计数与 2.4 表逐格相等 | E1 |
| AC-1b | 交付态：复扫行数 = `148 −（删坐标后该行零引用的行数）`；判类表逐行记下被删行（档 / 行号 / 旧坐标字面）⇒ 两读数可对账；`删坐标行数` 与 `删后零引用行数` 两个数都写进 §5（153 = 148 + 5，见 2.4） | E1 / E5 |
| AC-2 | `action` 列 ∈ {A, B, C}；三类计数之和 = 148 | E2 |
| AC-2b | 两档特征同时在场的行逐行列名：每行 `备注` 须有「按 2.2 序 1 取 B」判定句；缺句 ⇒ 红 | E2 |
| AC-2c | `(档, 行号)` 去重后 = 148（各恰一行） | E2 |
| AC-3 | 每条 A 行：`anchor` 非空 ∧ 该串在被引档全档命中数 = 1 ∧ `prompt[N′-1].includes(anchor)` = true（失配 = 0）。**多命中放行两条路**：① 加长锚至唯一 ⇒ 按上判；② 不加长 ⇒ 按 2.3 在 `备注` 记取值理由（取同小节内哪一处、为什么），`备注` 无该句才红 | E3 |
| AC-3b | `备注` 含 `A→C 降级` 的行单列；每行须同时有 ① 旧引文逐字 ② 引文全档命中数 = 0 读数 ③ 语义锚落空判定句；三者缺一 ⇒ 红；降级行只计入 C 类 | E3 / E5 |
| AC-4 | B 类行的坐标列前后集合逐项相等（差异 = 0） | E4 |
| AC-5 | 每条 C 行有处置记录：改指行 `anchor` 同时含旧引文与新引文；删坐标行含旧引文 + 0 命中读数，`备注` 记被删坐标字面 | E5 |
| AC-6 | 复扫每条引用 `N ≤ 480` 且该行非空（越界 / 空行 = 0）。**算术反证（必红项）**：`thincoder-core/prompts/persona-engineering.md` 第 96 行不载 `Debts go on the list`、第 151 行不载 `Credential values stay out of docs`（本席本轮实读，两条均不载）⇒ 按分段表 delta（≤151 段 = 0）落的号必不过 AC-3 | E3 / E5 |
| AC-7 | `doc_check(mode:"gate")` 对 7 档设计档 → 首行 `DOC-CHECK GATE: PASS` | E6 |
| AC-8a | **坐标收正相**（8 档，除 `docs/core/design/TOOLS.md`）：档行数与 2.4 表 `现行数` 列逐格相等（口径 `split('\n').length - 1`，±0）。**机检命令**（仓根跑）：`node -e "for (const f of [8 档路径]) console.log(f, require('fs').readFileSync(f,'utf8').split('\n').length - 1)"` ⇒ 逐格相等；**同一命令换成 `split('\n').length` 读出的值不许用来判**（各多 1，均以换行结尾） | E6 |
| AC-8b | **拆段相**（`docs/core/design/TOOLS.md` · 拆段经父侧授权）：不判行数，判两个读数 —— ① **归一化逐字相等**：改前（`git show HEAD:<档>`）与现盘各去全部空白与数字后逐字相等（实测 127460 = 127460）② **空行增量**（实测 391 → 441，+50；非空行净 +3）。行数仅作参考读数（实测 1739 → 1792），不作判据 | E6 |

**AC-8 两相分开的 why**：拆段只动空白，字符一个没改（归一化后逐字相等）；用行数判会把做对的事判成红 —— **判据写成会假红的形，比没判据更坏**，它教人不信门（先例 = `#1894` 评审让改三处本没问题的行数，`node` 一量全是评审错）。

**需求档 2 档 9 行**不在本席落笔面（U1）：其 AC 由主 agent 落笔后按同一 AC-3 / AC-4 / AC-5 判。

### 2.6 关键决策

| # | 决策 | 理由（含实测依据） |
|---|---|---|
| K1 | **不采用「一律 +5」** | 前批父侧实测：位移分段 = 152–162 +1 · 163–174 +2 · 175–183 +3 · 184–214 +4 · 215 及以后 +5 · 151 及以前 0。照 +5 改会把前三段 17 处全指错 |
| K2 | **分段表只作线索，不作判据** | 该表早于本批的多次插入；本席本轮实测已有 +92（`:96`→`:188`）与 +172（`:151`→`:323`）两例 ⇒ 真位移可远超该表 |
| K3 | **A / B 两类下场相反** | 批档 §1.2 口径，且同会话 `#1871` 修正轮在勘察面已验过：决策登记改旧号 = 指着不存在的位置；勘察记录改新号 = 篡改历史记录 |
| K4 | **C 类不猜号；两锚皆空才判 C** | 本轮实读的 0 命中行语义锚全部命中现存句（`:1092` → `:108`；`:1099` → `:323`）⇒ **引文 0 命中证明不了规则已死**，它只证明「这句话的措辞不在了」；故先试语义锚，两锚皆空才判 C，判 C 后按 2.2.1 选改指或删 |
| K5 | **设计落 §2，不新建设计档** | 本批零机制新增；新档自身又会带入新坐标，与「减少坐标债」相抵。**对齐** = 前例 `docs/batches/2026-10-16-p4-code-face-ref-cleanup.md` §2 的形（射程 · 分档判据 · 逐条验收 · 判类清单落 §5）。**偏离** = ① 前例射程是代码六目录 + `bench` 并明排除 `docs/**`，本批射程恰是 `docs/core/**` 文档面本身；② 前例 F3 定「改后形 = 符号名 / 节名，禁换成新行号」，本批 A 类**改的就是行号**——被引处是散文行，无符号名可指，节名粒度过粗（一节装多条规则，指到节等于不指） |
| K6 | **B 类标记复用现状词形** | 不造新词：`as-of 本次读数` / `as-of <日期>` 两形现档已有先例（本席在 `docs/core/design/PROMPT-SYSTEM.md` 第 4921 行附近读到 `行号 as-of 本次读数`） |
| K7 | **判类表落 §5，不落设计档** | 148 行逐行表是一次性过程记录；写进设计档会把一次性清单变成长期维护面 |
| K8 | **优先级 = 时点标记 > 内容锚** | 时点标记是作者自陈「这是那一刻的读数」，改号即篡改记录；无标记的行才是「指向现状」的登记。两档特征同时在场时，标记是对该行性质的直接陈述，锚只说明「有一句像的话今天还在」——前者更近作者意图，故取 B |

### 2.7 边界（本批不做）

- 不动 `docs/batches/**`（过程档，历史行号本就该留旧值）；不动产品码与提示词档。
- 不改任何规则语义：只动坐标与 as-of 标记。改写措辞 = 越界，须另开批。
- 不重写历史读数（B 类一律保号，哪怕该读数今天已不成立）。
- 不收正裸 `:NN` 续引形（同段后续引用只写 `:331` 之形）—— 它不在本批正则射程内（U3）。
- 判类表列集固定，不许增列（2.4.1）；版本锚 commit、双档判定、被删坐标字面一律进 `备注`。

### 2.8 上抛项（处置状态）

| # | 事项 | 处置 |
|---|---|---|
| **U1** | **需求档面 9 行（2 档）本席无落笔权** | 父侧自落、不分权（§1.4）⇒ 实施轮交出「行 → 新号」清单后，由父侧逐行改；本席不改需求档 |
| **U2** | 1 行不带前缀（`docs/core/design/ANCHOR-DEBT-REPAIR.md` 第 362 行只写档名短形 + `:100`，缺 `thincoder-core/prompts/` 路径段） | 一致性面，已计入 148；实施轮补全路径段（D4 要求带路径段），随 E4 一并落 |
| **U3** | 裸 `:NN` 续引形（例：同段后写 `:331` ∥ `:345`）不在本批射程 | 不扩射程，另批（§1.4）；本批不纳入、不静默漏检 |
| **U4** | 判类表（148 行）本轮未成表 | 接受（§1.4）；成表归实施轮首件，父侧按 2.2 / 2.3 抽验 |

**实施轮的判类边界**：`docs/core/design/PROMPT-SYSTEM.md` 的 117 行逐行按 2.2 优先级定 —— 不因「在落点表 / 读数表里」自动降 B，也不按「整档算历史」推断。

## §3 设计评审（评审子代理）
**状态行**：评审通过（第 2 轮：上轮 11 条全 Fixed；本轮新增 🔴0 / 🟡4 / 🔵2，均已写入 §3）



### 轮次 1（评审子代理）

**评审对象**：`docs/batches/2026-10-28-line-ref-reanchor.md` §2（方法 + 验收 8 条）。
**范围限制**：无项目标准档（方法论按 Project Guide + 评审判据判）· 文档地图缺（Document ownership 判据降级，按 AGENTS.md 定位判）。

### 重点验五件的结论

**① 148 / 153 基线可复现 —— 是，逐格相等。**
- 同式重扫：`docs/core` 下 `.md` = **127 档**（design 75 + requirements 52，与 2.4 一致）；命中 **148 行 / 153 处 / 9 档**，逐档计数与 2.4 表逐格相等（117 · 10 · 4 · 4 · 2 · 1 · 1 · 8 · 1）。
- 153 处 = 148 + 4（`docs/core/design/PROMPT-SYSTEM.md:2102/4624/4921/5031` 各 2 处）+ 1（`:4624` 3 处）。被引档实读 **481 行**，与 2.4 一致。
- 两条位移实证成立：`:96` → `:188`（+92，该行 = `- **Debts go on the list**…`）· `:151` → `:323`（+172，该行 = `- **Credential values stay out of docs**…`）。
- C 例成立：`walk DOWN, never up` 在被引档 **0 命中**。A 例成立：`docs/core/design/TOOLS.md:323` 引 `:45`，该行实读 = `**Nothing important stays in your head**…`。
- 唯一缺陷是引文转写错（findings #6），结论不受影响。

**② 三档互斥 —— 不互斥，已在盘找到实证行。** 见 findings #2 / #3。

**③ C 类处置 —— 定到两条路（删坐标 ∥ 改指现存同义句），但取哪条无规则。** 见 findings #3。

**④ 禁算术的反证用例 —— 未成显式反例，只到「AC-3 通用锚门」这一层。** 见 findings #4 / #10。

**⑤ U1 的「行 → 新号」输出形 —— 只可推断，未定形。** 见 findings #5。

### findings

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Acceptance | 🔴 | AC-1 与 E5 相抵：E5 允许「删坐标」，C 行删后不再命中同式正则 ⇒ 复扫必 < 148；AC-1 写死 148 且无时点 | AC-1 拆两条并标时点：改前 148 行 / 153 处；交付态 = 148 − 删坐标行数，并令判类表记下被删行以便对账 |
| 2 | Requirements | 🔴 | A / B / C 不互斥且无优先级；AC-2 只判成员 + 求和，判错方向也过机检 | 2.2 补优先级表：无 as-of 标记且锚唯一命中 ⇒ A（落点表行同判）；标记在场 ⇒ B；两锚皆空 ⇒ C |
| 3 | Clarity | 🟡 | C 类两条下场无选择规则；`:1099` 的规则仍活着，走「删坐标」即删活指针 | 加一行：有唯一同义句 ⇒ 改指；否则删坐标。两条都记旧引文 |
| 4 | Acceptance | 🟡 | AC-3 空锚下恒真（`includes("")`），且不判 2.3 要求的「唯一命中」 | AC-3 增判 anchor 非空 + 全档命中数 = 1；A→C 降级单独成 AC |
| 5 | Clarity | 🟡 | 判类表列集未声明 ⇒ U1 要的「行 → 新号」无定式；AC-2 丢了 E2 的「各恰一行」 | 定死列集（档 / 行号 / 旧坐标 / 新坐标 / action / anchor / 备注）+ 二元组去重后 = 148 |
| 6 | Evidence | 🟡 | 标「实读」的引文被转写错（`:151` 的括注），照抄进 anchor 列则 AC-3 必假 | 改成 `(parent-side rounds)`；并写死「实读引文逐字复制」 |
| 7 | Methodology | 🟡 | 无公共源勘察证据行 | 补一行；答案「无相关」也照写 |
| 8 | Integration | 🟡 | 「集成面 = none」缺 RTM 读数支撑（豁免理由本身成立） | 补 RTM 读数一行 + 一句「无一行断言跨档行号」 |
| 9 | Precedent | 🔵 | 先例在场但无「偏离」一句，且先例是批次档 | 补偏离存根或改指设计档节 |
| 10 | Acceptance | 🔵 | AC-6（`N ≤ 481` 且非空）对算错的号同样成立 ⇒ 禁算术无显式反证 | 改成一机检行：分段表 delta 的落点不载 anchor ⇒ 算术路必红 |
| 11 | Branch | 🟡 | 2.3 的「同号冲突 ⇒ 停下重判」分支无场景 | 用 `:1099` ∥ `:1132` 这一对作场景引文 |

### findings 的证据行

- **#1**：E5 = `docs/batches/2026-10-28-line-ref-reanchor.md:67`；AC-1 = 同档 `:130`；「行数 ±0」= 同档 `:122`；§1.3 只要求报前后读数 = 同档 `:30`。
- **#2**：落点表自述 = `docs/core/design/PROMPT-SYSTEM.md:1107`（「组文案表（逐字 · 实施轮照抄；唯一副本 = 本节）」）；行区 = 同档 `:1092`–`:1101`。
- **#2**：B 特征 = 设计档 `:77`；A 特征 = `:76`；本设计的 C 例 = `:84`（点名的 `:1092` 就在该区内）。
- **#2**：`docs/core/design/PROMPT-SYSTEM.md:1099` 引 `:151` 的 `Credentials never land in docs` 实扫 **0 命中**；同族 `:1132` 引 `:151` 的 `Credential values stay out of docs: …` 现居被引档 `:323`。
- **#2**：AC-2 = 设计档 `:131`（只判 `action ∈ {A,B,C}` + 三类求和 = 148）。
- **#3**：两条下场 = 设计档 `:67` / `:78`；K4 = `:148`。
- **#4**：AC-3 = 设计档 `:132`；唯一命中 = `:93`；锚填不出转 C = `:100`。
- **#5**：列名三处 = 设计档 `:91` / `:95` / `:131` / `:133`；U1 的「行 → 新号」= `:36`；E2 = `:64`。
- **#6**：设计档 `:83` 记 `## Dispatch & close discipline (parent-side rules)`；被引档实读第 151 行 = `## Dispatch & close discipline (parent-side rounds)`。
- **#8**：豁免理由 = 设计档 `:124`；同族写形 = `docs/core/design/PROMPT-SYSTEM.md:4938`。
- **#9**：先例 = 设计档 `:55` / `:149`。
- **#10**：AC-6 = 设计档 `:135`。
- **#11**：分支 = 设计档 `:101`。
- **#7**：同族写形 = `docs/core/design/PROMPT-SYSTEM.md:4988`（公共源勘察行）。
- **文件数标注抽查（判据 8）**：9 档全为 `.md`（免标注）；2.4 现行数抽查 `docs/core/design/PROMPT-SYSTEM.md` = 5200 行 ✅ · `docs/core/design/ANCHOR-DEBT-REPAIR.md` = 365 行 ✅ · `docs/core/design/LIGHT-CHANNEL.md` = 503–504 行 ✅。

### 计数

🔴 2 · 🟡 7 · 🔵 2 —— 合计 11 条。**VERDICT: changes-required**（无「评审通过」状态行：VERDICT 非 pass）

### 轮次 2（评审子代理）

**评审对象**：`docs/batches/2026-10-28-line-ref-reanchor.md` §2（修正轮后：上轮 11 条修复声称 + 两处自纠）。
**本轮实测面**：设计档全文 · 9 个受影响档尾行实读 · `thincoder-core/prompts/persona-engineering.md` 定点行 · 多引行复扫 · `test/RTM.md` 标题面。

### 逐条修复声称的验证结论

- **① AC-1 拆分 → Fixed**：`:214` = 「| AC-1a | 改前基线（时点 = 2026-10-28 本席实扫）：同式复扫 → `148` 行 / `153` 处…」；`:215` = 「| AC-1b | 交付态：复扫行数 = `148 −（删坐标后该行零引用的行数）`…两个数都写进 §5」⇒ 交付态有定值，与 E5 的「删坐标」不再相抵。
- **② 优先级表 → Fixed**：`:118` 序 1「行内载时点标记（`as-of` ∥ 日期 ∥ `实读` ∥ `本次读数` ∥ 批档轮次）」⇒ **B**；`:119` 无标记 + 唯一命中 ⇒ **A**；`:120` 两锚皆不成立 ⇒ **C**；`:122`「落点表 / 读数表里的行同判：在表里不自动降 B」；AC-2b = `:217`。序 1–3 是全覆盖全序 ⇒ 每行单一判落。
- **③ 2.2.1 → Fixed**：`:143`–`:144` 给出选择规则（同义句唯一命中 ⇒ 改指；否则删坐标）；`:146` 明示覆盖 `:1099`（只许改指，不许删）。
- **④ AC-3 → Fixed**：`:219` = 「`anchor` 非空 ∧ 该串在被引档全档命中数 = 1 ∧ `prompt[N′-1].includes(anchor)`」；A→C 降级独立成 AC-3b = `:220`。
- **⑤ 2.4.1 列契约 → Fixed**：`:193`–`:199` 七列（档 / 行号 / 旧坐标 / 新坐标 / action / anchor / 备注）；`(档, 行号)` 唯一 = `:201` + AC-2c = `:218`。
- **⑥ `:151` 引文 → Fixed**：设计 `:135` ∥ `:156` 写 `## Dispatch & close discipline (parent-side rounds)`；被引档实读第 151 行 = 「## Dispatch & close discipline (parent-side rounds)」逐字相同。
- **⑦ 勘察行 → Fixed**：`:207`（`index.publicRepos` = `[]` ⇒ 独立公共源仓无，已查无相关）。
- **⑧ RTM 读数 → Fixed**：`:208` 已落；标题面实读核对 `## ` = 5 ✓ · `###` = 21 ✓（表行 104 未独立复算）。
- **⑨ K5 偏离 → Fixed**：`:237` 给出 ① 射程不同 ② 前例 F3「禁换成新行号」本批必须破，方向与理由都在。
- **⑩ AC-6 → Fixed**：`:223` 增「算术反证（必红项）」，把 `:96` ∥ `:151` 两条已知位移定为必红行。
- **⑪ 冲突分支场景 → Fixed**：`:162` 用 `:1099` ∥ `:1132` 同指 `:323` 作场景，并给出「同号同规则 ⇒ 合法」的判法。
- **⑫ 被引档 480 → Fixed**：`:183` 记 480 行；实读该档末行为空行（481 行编号 ⇒ split-1 = 480）✓；AC-6 上限同改 `:223`。
- **自纠Ⓐ（9 档现行数）→ 6/9 与盘一致**：`5199` ✓ · `1031` ✓ · `463` ✓ · `1739` ✓ · `364` ✓ · `1156` ✓；余 3 格仍为未归一的 `split('\n').length` 值（见 N2）。
- **自纠Ⓑ（删历史链）→ Fixed**：`:183` 只留「= 480 行（同口径）· 该档仍在增行」，470→475→478→481 链已无残句。

### findings

| # | 性质 | 级 | Issue | Suggestion |
|---|------|----|-------|------------|
| N1 | 判据例 | 🟡 | `:136` 的 C 例与 `:119` 序 2 相抵：该行 备注 列即 `walking up lands the manifest in an unrelated enclosing project`，被引档 `thincoder-core/prompts/persona-engineering.md:108` 逐字载此句 ⇒ 语义锚命中 ⇒ 应判 A（改指 `:108`），不是 C | 改 C 例，或明写「备注 列的非引文形不参与语义锚命中」 |
| N2 | 读数 | 🟡 | 2.4 表三格与 `split('\n').length - 1` 口径不符、各多 1：`docs/core/design/LIGHT-CHANNEL.md` 503 · `docs/core/design/MANIFEST.md` 1214 · `docs/core/requirements/LIGHT-CHANNEL.md` 139 ⇒ AC-8 交付态必红 | 用 `node -e` 复算这三档，改齐 502 / 1213 / 138（另 6 格已核 ✓） |
| N3 | 读数 | 🟡 | `:187`「153 = 148 + 5 —— 5 行各带 2 处以上引用」：实测多引行 = **4**（`docs/core/design/PROMPT-SYSTEM.md:2102` ∥ `:4624` ∥ `:4921` ∥ `:5031`），5 是额外处数不是行数 | 改为「4 行共带 5 处额外引用」；AC-1b 算法本身不受影响 |
| N4 | 判据互抵 | 🟡 | AC-3 `:219` 的「命中数 = 1」与 2.3 `:153`「多处命中时取同一小节内的那处，并在 `备注` 列记一句取值理由」相抵（后者明许 A 类多命中） | AC-3 补一句「多命中 ⇒ 加长锚至唯一，或按 2.3 记取值理由后放行」 |
| N5 | 机检面 | 🔵 | 序 1（标记在场 ⇒ B）无任何 AC 断言；AC-2b 由实施席自报双档行名单，漏报即过 | 补 AC-2d：行内命中 `as-of` ∥ 日期 ∥ `实读` ∥ `本次读数` ∥ 批档轮次 ⇒ `action` 必须 = B |
| N6 | 措辞 | 🔵 | 2.4.1 `:198`「A / C 改指 = 被引档唯一命中串或「旧引文 + 新引文」」把两种形并列给两类，与 AC-3 的单串判法相抵 | 拆成「A = 唯一命中串；C 改指 = 旧引文 + 新引文」 |

### 计数

上轮 11 条：🔴 2 → Fixed · 🟡 7 → Fixed · 🔵 2 → Fixed（全闭环）。
本轮新增：🔴 0 · 🟡 4 · 🔵 2 —— 合计 6 条，均无「必须修」标记。

VERDICT: pass

## §4 用户批准（主 agent）

## 4. 用户批准（主 agent）

**状态行**：已批准 2026-10-28

### 4.1 批准依据

- **整批令**（2026-10-28 12:58 逐字「自动跑完」）：覆盖本批全链 —— 设计与评审之后的**实施启动**不需要再等一次点头；**四类硬边界仍回报**（修不了的 🔴 / 须偏离已批设计 / 用户叫停 / 范围变化）。
- **设计评审已通过**（§3 状态行：第 2 轮 `评审通过`，上轮 11 条全 Fixed，本轮新增 🔴 0）。

### 4.2 批准后用户另下的三次裁定（已落入 §1 与各档）

| 时间 | 用户原话 | 落点 |
|---|---|---|
| 13:06 | 「A」 | `#1899` —— `ledger/count` 的界改跟 `ledger/list`，`thincoder-cli/src/acp/read-data.mjs:77` 改一行 |
| 13:30 | 「如果不是旧批档，史实保留就不是我的要求，相反，我的明确说的是只保留当前状态，历史都要清除，避免造成RAG」 | §1.10；推翻父侧对 §3.8 条目 I「B 类零触碰」的援引 |
| 13:34 | 「开，先清理规矩，一定不要用修订式。」 | 开 `#1903`；并定下**规矩先、残留后**的顺序 |

### 4.3 批准范围之外（不在本批）

- 规矩面清理 → `#1903`
- 残留三件（ADB 读数面 / PROMPT-SYSTEM 三行 / 标记词表）→ `#1904`（须 `#1903` 落地后开）

## §5 实施记录（eng-coder）
**状态行**：实施完成 2026-10-28（148 行判类表 + A/B/C 处置入档；残余五条见 5.7、表内更正见 5.9，均在等父侧裁）



### 5.1 交付总账与读数（时点 2026-10-28）

**射程**：`docs/core/**` 内含「被引档路径 + `:行号`」式引用的行；行数口径 `split('\n').length - 1`（本仓既有口径；不用读工具行号判）。

| 读数 | 改前（AC-1a 时点） | 交付态（AC-1b） |
|---|---|---|
| 命中行 | **148** | **143** |
| 处数 | **153** | **148** |
| 档数 | 9 | 9 |

**交付态算式（AC-1b）**：148 − **4**（删坐标后该行零引用的行数 = 4；四条各只带 1 处引用）+ 0 − **1**（`docs/core/requirements/ENGINEERING-MODE-V2.md:1052` 由父侧改述为无坐标形）= **143**；处数同式 153 − 4 − 1 = **148**。

**逐档分布（改前 → 交付态）**：

- `docs/core/design/PROMPT-SYSTEM.md` 117→113 · `docs/core/design/AGENT-LOOP-SUBAGENT.md` 10→10
- `docs/core/design/ADVISOR-CONVERGENCE.md` 4→4 · `docs/core/design/TOOLS.md` 4→4
- `docs/core/design/LIGHT-CHANNEL.md` 2→2 · `docs/core/design/MANIFEST.md` 1→1 · `docs/core/design/ANCHOR-DEBT-REPAIR.md` 1→1
- `docs/core/requirements/ENGINEERING-MODE-V2.md` 8→7 · `docs/core/requirements/LIGHT-CHANNEL.md` 1→1

**判类计数（AC-2）**：A = **119** · B = **24** · C = **5** ⇒ 合计 **148**；`(档, 行号)` 去重后 = **148**（AC-2c）。**A→C 降级 = 0 行**（AC-3b 无行可列）。

**表列码（`备注` 列 · 本表自带定义，不另引他档）**：

- `A1` = 引文锚（行内引文在被引档唯一命中，7 行）
- `A2` = 语义锚（被引行逐字片段，全档唯一命中，88 行）
- `A3` = 原号即现状号（零改，锚唯一命中，23 行）
- `A0` = 非坐标（行内为扫描模式 `:2[3-9][0-9]`，正则在此截出 `:2`；零改，1 行）
- `B1` = 时点标记在场 ⇒ 按 2.2 序 1 取 B，号不动（16 行）；`B1*` = 标记与引文同时在档 ⇒ 按 2.2 序 1 取 B（8 行）
- `C1` = 删坐标（旧引文全档 0 命中，同义句不在被引档 ⇒ 无号可指，5 行）

**anchor 列的取法（可复核）**：`A` 行一律取「被引档目标行的逐字片段」，机检三件 —— 非空 ∧ 该串全档命中 = 1 ∧ `prompt[N-1]` 含该串，三条全绿 = 0 失配。行内自带引文的 7 行取引文锚；其余行内措辞与被引档已不同名，按 2.3 序 2 取语义锚。

**需求档 9 行（U1 · 非本席笔域）**：行 → 新号清单已交父侧，父侧已逐行落；本表照录其交付态读数，四行标 `父侧落笔（U1）`，其余 5 行为 B 类零改。

**`docs/core/design/TOOLS.md` 拆段（父侧本轮加派）**：两处长段各在两源行之间插一个空行（原 `:411` 段后 · 原 `:1691` 段后），**零字符改动、零调序**。

- 读数：1790 → **1792** 行（+2 空行）；非空行 **1352** 不变；去空白字符数 **132145** 不变；`doc_check` 单档报告 **2 → 0** 命中。

**测试面**：本批纯文档面，无可跑产物 —— 验证 = 一次性 `node` 复扫（不留存脚本）+ `doc_check`。单元测试档 **none**（无业务可观察结果变化，无既有集成用例断言跨档行号）。

### 5.2 判类表（E2 交付形 · 列集 = 2.4.1 七列 · 一行 = 原档一处命中行）

**口径两处更正（以本表为准）**：`A1` = **6** 行 · `A2` = **89** 行（5.1 记 7 / 88 是取锚首轮读数，收锚后复点为 6 / 89）；其余码计数不变 ⇒ A = 119（6 + 89 + 23 + 1）· B = 24 · C = 5。

**anchor 列**：`A` 行的锚已逐条机检（非空 ∧ 全档命中 = 1 ∧ `prompt[N-1]` 含该串），失配 **0**；表内截 46 字符，完整串 = 目标行逐字前缀。

**分段一：`docs/core/design/PROMPT-SYSTEM.md`（117 行）**

| 档 | 行号 | 旧坐标 | 新坐标 | action | anchor | 备注 |
|---|---|---|---|---|---|---|
| `docs/core/design/PROMPT-SYSTEM.md` | 469 | :136 | :338 | A | `**Task books are re-derived, not transcribed**` | A2 |
| `docs/core/design/PROMPT-SYSTEM.md` | 520 | :93 | :383 | A | `**Merge what can be merged**` | A2 |
| `docs/core/design/PROMPT-SYSTEM.md` | 1092 | :61 | :108 | A | `walking up lands the manifest in an unrelated ` | A1 |
| `docs/core/design/PROMPT-SYSTEM.md` | 1093 | :65 | :120 | A | `a session can start in any directory, and kill` | A1 |
| `docs/core/design/PROMPT-SYSTEM.md` | 1094 | :67 | :125 | A | `**Writing it by hand splits the state from the` | A2 |
| `docs/core/design/PROMPT-SYSTEM.md` | 1095 | :87 | :168 | A | `**commit only your own work**` | A2 |
| `docs/core/design/PROMPT-SYSTEM.md` | 1096 | :130 | :286 | A | ``Deferred` fits 🟡/🔵 improvem` | A2 |
| `docs/core/design/PROMPT-SYSTEM.md` | 1097 | :137 | :295 | A | `with no reason there is nothing to evaluate, a` | A1 |
| `docs/core/design/PROMPT-SYSTEM.md` | 1098 | :148 | :315 | A | `**Letting one expire voids that authorization*` | A2 |
| `docs/core/design/PROMPT-SYSTEM.md` | 1099 | :151 | :323 | A | `**Credential values stay out of docs**` | A2 |
| `docs/core/design/PROMPT-SYSTEM.md` | 1100 | :197 | :404 | A | `**A tech todo must carry `trigger`**` | A2 |
| `docs/core/design/PROMPT-SYSTEM.md` | 1101 | :214 | :430 | A | `**Tech-todo specific**` | A2 |
| `docs/core/design/PROMPT-SYSTEM.md` | 1116 | :130 | :287 | A | `a dropped defect is one the user stays blind t` | A1 |
| `docs/core/design/PROMPT-SYSTEM.md` | 1132 | :151 | :323 | A | `**Credential values stay out of docs**` | A2 |
| `docs/core/design/PROMPT-SYSTEM.md` | 1134 | :61 | :108 | A | `**Project-root judgment walks DOWN**` | A2 |
| `docs/core/design/PROMPT-SYSTEM.md` | 1143 | :87 | :168 | A | `**commit only your own work**` | A2 |
| `docs/core/design/PROMPT-SYSTEM.md` | 1144 | :148 | :315 | A | `**Letting one expire voids that authorization*` | A2 |
| `docs/core/design/PROMPT-SYSTEM.md` | 1145 | :197 | :404 | A | `**A tech todo must carry `trigger`**` | A2 |
| `docs/core/design/PROMPT-SYSTEM.md` | 1236 | :99 | :99 | B | `—` | B1；标记 = 2026-10-21 |
| `docs/core/design/PROMPT-SYSTEM.md` | 1306 | :8 | :8 | B | `—` | B1；标记 = 实读 |
| `docs/core/design/PROMPT-SYSTEM.md` | 1341 | :8 | :8 | A | `**Without a batch-wide go-ahead**, revie` | A3 |
| `docs/core/design/PROMPT-SYSTEM.md` | 1349 | :149 | :319 | A | `**Only an explicit sign-off after review unloc` | A2 |
| `docs/core/design/PROMPT-SYSTEM.md` | 1357 | :55 | :97 | A | `> **Without a batch-wide go-ah` | A2 |
| `docs/core/design/PROMPT-SYSTEM.md` | 1367 | :8 | :8 | A | `**Without a batch-wide go-ahead**, revie` | A3 |
| `docs/core/design/PROMPT-SYSTEM.md` | 1368 | :149 | :319 | A | `- **Only an explicit sign-off after review unl` | A2 |
| `docs/core/design/PROMPT-SYSTEM.md` | 1370 | :55 | :97 | A | `> **Without a batch-wide go-ah` | A2 |
| `docs/core/design/PROMPT-SYSTEM.md` | 1455 | :140 | :140 | A | `**A section carrying only its heading and zero` | A3 |
| `docs/core/design/PROMPT-SYSTEM.md` | 1463 | :163 | :265 | A | `**Round field**` | A2 |
| `docs/core/design/PROMPT-SYSTEM.md` | 1475 | :163 | :265 | A | `**Round field**` | A2 |
| `docs/core/design/PROMPT-SYSTEM.md` | 1476 | :149 | :319 | A | `**Only an explicit sign-off after review unloc` | A2 |
| `docs/core/design/PROMPT-SYSTEM.md` | 1517 | :29 | :55 | A | `**The only exemption (doc/code consistency)**` | A2 |
| `docs/core/design/PROMPT-SYSTEM.md` | 1518 | :96 | :188 | A | `**Debts go on the list**` | A2 |
| `docs/core/design/PROMPT-SYSTEM.md` | 1553 | :29 | :55 | A | `**The only exemption (doc/code consistency)**` | A2 |
| `docs/core/design/PROMPT-SYSTEM.md` | 1564 | :96 | :188 | A | `**Debts go on the list**` | A2 |
| `docs/core/design/PROMPT-SYSTEM.md` | 1585 | :29 | :55 | A | `**The only exemption (doc/code consistency)**` | A2 |
| `docs/core/design/PROMPT-SYSTEM.md` | 1586 | :96 | :188 | A | `**Debts go on the list**` | A2 |
| `docs/core/design/PROMPT-SYSTEM.md` | 1638 | :96 | :188 | A | `**Debts go on the list**` | A2 |
| `docs/core/design/PROMPT-SYSTEM.md` | 1670 | :162 | :350 | A | `- **Where §2 and the design do` | A2 |
| `docs/core/design/PROMPT-SYSTEM.md` | 1671 | :168 | :350 | A | `- **Where §2 and the design do` | A2 |
| `docs/core/design/PROMPT-SYSTEM.md` | 1715 | :145 | :145 | A | `**Reopening restores writability and does not ` | A3 |
| `docs/core/design/PROMPT-SYSTEM.md` | 1722 | :162 | :350 | A | `- **Where §2 and the design do` | A2 |
| `docs/core/design/PROMPT-SYSTEM.md` | 1731 | :168 | :350 | A | `- **Where §2 and the design do` | A2 |
| `docs/core/design/PROMPT-SYSTEM.md` | 1739 | :162 | :341 | A | `**A landed design change propagates to the tas` | A2 |
| `docs/core/design/PROMPT-SYSTEM.md` | 1766 | :162 | :350 | A | `- **Where §2 and the design do` | A2 |
| `docs/core/design/PROMPT-SYSTEM.md` | 1767 | :168 | :350 | A | `- **Where §2 and the design do` | A2 |
| `docs/core/design/PROMPT-SYSTEM.md` | 1768 | :162 | :341 | A | `**A landed design change propagates to the tas` | A2 |
| `docs/core/design/PROMPT-SYSTEM.md` | 1777 | :162 | :350 | A | `- **Where §2 and the design do` | A2 |
| `docs/core/design/PROMPT-SYSTEM.md` | 1778 | :168 | :350 | A | `- **Where §2 and the design do` | A2 |
| `docs/core/design/PROMPT-SYSTEM.md` | 1779 | :180 | :364 | A | `**A task book is a table, not prose**` | A2 |
| `docs/core/design/PROMPT-SYSTEM.md` | 1780 | :149 | :304 | A | `**Fix rounds doc-first**` | A2 |
| `docs/core/design/PROMPT-SYSTEM.md` | 1832 | :162 | :341 | A | `**A landed design change propagates to the tas` | A2 |
| `docs/core/design/PROMPT-SYSTEM.md` | 1848 | :14 | :14 | B | `—` | B1；标记 = 2026-10-17 |
| `docs/core/design/PROMPT-SYSTEM.md` | 1852 | :14 | :18 | A | `**The go-ahead covers the approval gate**` | A2 |
| `docs/core/design/PROMPT-SYSTEM.md` | 1865 | :14 | :18 | A | `**The go-ahead covers the approval gate**` | A2 |
| `docs/core/design/PROMPT-SYSTEM.md` | 1875 | :8 | :8 | A | `**Without a batch-wide go-ahead**, revie` | A3 |
| `docs/core/design/PROMPT-SYSTEM.md` | 1883 | :59 | :97 | A | `> **Without a batch-wide go-ah` | A2 |
| `docs/core/design/PROMPT-SYSTEM.md` | 1905 | :14 | :18 | A | `**The go-ahead covers the approval gate**` | A2 |
| `docs/core/design/PROMPT-SYSTEM.md` | 1906 | :8 | :8 | A | `**Without a batch-wide go-ahead**, revie` | A3 |
| `docs/core/design/PROMPT-SYSTEM.md` | 1907 | :59 | :97 | A | `> **Without a batch-wide go-ah` | A2 |
| `docs/core/design/PROMPT-SYSTEM.md` | 1908 | :55 | :97 | A | `> **Without a batch-wide go-ah` | A2 |
| `docs/core/design/PROMPT-SYSTEM.md` | 1909 | :11 | :11 | A | `**Unlock and start**` | A3 |
| `docs/core/design/PROMPT-SYSTEM.md` | 1914 | :40 | :74 | A | `**Defaults stay in bounds**` | A2 |
| `docs/core/design/PROMPT-SYSTEM.md` | 2007 | :229 | :453 | A | `Submit and go — queuing is the mechanism's job` | A1 |
| `docs/core/design/PROMPT-SYSTEM.md` | 2009 | :40 | :74 | A | `**Defaults stay in bounds**` | A2 |
| `docs/core/design/PROMPT-SYSTEM.md` | 2031 | :229 | :459 | A | `**A perceived file overlap is a scheduling inp` | A2 |
| `docs/core/design/PROMPT-SYSTEM.md` | 2042 | :40 | :74 | A | `**Defaults stay in bounds**` | A2 |
| `docs/core/design/PROMPT-SYSTEM.md` | 2055 | :229 | :459 | A | `**A perceived file overlap is a scheduling inp` | A2 |
| `docs/core/design/PROMPT-SYSTEM.md` | 2056 | :40 | :74 | A | `**Defaults stay in bounds**` | A2 |
| `docs/core/design/PROMPT-SYSTEM.md` | 2057 | :175 | :442 | A | `**Declare spawn scheduling metadata in the tas` | A2 |
| `docs/core/design/PROMPT-SYSTEM.md` | 2102 | :229·:236 | :229·:236 | A | `**No pick ⇒ nothing moves**` | A3 |
| `docs/core/design/PROMPT-SYSTEM.md` | 2111 | :40 | :76 | A | `A batch-wide go-ahead puts the batch's whole s` | A1 |
| `docs/core/design/PROMPT-SYSTEM.md` | 2147 | :2 | :2 | A | `—` | A0 |
| `docs/core/design/PROMPT-SYSTEM.md` | 2163 | :36 | :68 | A | `**The ordinary reply text beats both bad choic` | A2 |
| `docs/core/design/PROMPT-SYSTEM.md` | 2209 | :36 | :68 | A | `**The ordinary reply text beats both bad choic` | A2 |
| `docs/core/design/PROMPT-SYSTEM.md` | 2310 | :5 | :5 | A | `## Firing-rights boundary: you` | A3 |
| `docs/core/design/PROMPT-SYSTEM.md` | 2333 | :107 | :225 | A | `put the route to the user as a **choice questi` | A2 |
| `docs/core/design/PROMPT-SYSTEM.md` | 2337 | :104 | :209 | A | `**Closing ledger sweep**` | A2 |
| `docs/core/design/PROMPT-SYSTEM.md` | 2349 | :104 | :215 | A | `**Closeout samples the pen lines**` | A2 |
| `docs/core/design/PROMPT-SYSTEM.md` | 2353 | :104 | :215 | A | `**Closeout samples the pen lines**` | A2 |
| `docs/core/design/PROMPT-SYSTEM.md` | 2382 | :104 | :215 | A | `**Closeout samples the pen lines**` | A2 |
| `docs/core/design/PROMPT-SYSTEM.md` | 2409 | :104 | :215 | A | `**Closeout samples the pen lines**` | A2 |
| `docs/core/design/PROMPT-SYSTEM.md` | 2504 | :104 | :215 | A | `**Closeout samples the pen lines**` | A2 |
| `docs/core/design/PROMPT-SYSTEM.md` | 2516 | :5 | :5 | A | `## Firing-rights boundary: you` | A3 |
| `docs/core/design/PROMPT-SYSTEM.md` | 2538 | :36 | :68 | A | `**The ordinary reply text beats both bad choic` | A2 |
| `docs/core/design/PROMPT-SYSTEM.md` | 2626 | :36 | :68 | A | `**The ordinary reply text beats both bad choic` | A2 |
| `docs/core/design/PROMPT-SYSTEM.md` | 2672 | :36 | :68 | A | `**The ordinary reply text beats both bad choic` | A2 |
| `docs/core/design/PROMPT-SYSTEM.md` | 2694 | :36 | :68 | A | `**The ordinary reply text beats both bad choic` | A2 |
| `docs/core/design/PROMPT-SYSTEM.md` | 2715 | :36 | :68 | A | `**The ordinary reply text beats both bad choic` | A2 |
| `docs/core/design/PROMPT-SYSTEM.md` | 3086 | :104 | :209 | A | `**Closing ledger sweep**` | A2 |
| `docs/core/design/PROMPT-SYSTEM.md` | 3103 | :104 | :209 | A | `**Closing ledger sweep**` | A2 |
| `docs/core/design/PROMPT-SYSTEM.md` | 3250 | :104 | :209 | A | `**Closing ledger sweep**` | A2 |
| `docs/core/design/PROMPT-SYSTEM.md` | 3269 | :104 | :104 | B | `—` | B1；标记 = 实读 |
| `docs/core/design/PROMPT-SYSTEM.md` | 3270 | :104 | :104 | B | `—` | B1；标记 = 实读 |
| `docs/core/design/PROMPT-SYSTEM.md` | 3747 | :345 | — | C | `旧引文 `**Verification = targeted unit tests for ` | C1 |
| `docs/core/design/PROMPT-SYSTEM.md` | 3800 | :345 | — | C | `旧引文 `**Verification = targeted unit tests for ` | C1 |
| `docs/core/design/PROMPT-SYSTEM.md` | 3857 | :345 | — | C | `旧引文 `**Verification = targeted unit tests for ` | C1 |
| `docs/core/design/PROMPT-SYSTEM.md` | 3868 | :345 | — | C | `旧引文 `**Verification = targeted unit tests for ` | C1 |
| `docs/core/design/PROMPT-SYSTEM.md` | 3886 | :345 | :345 | B | `—` | B1；标记 = 实读 |
| `docs/core/design/PROMPT-SYSTEM.md` | 4531 | :44 | :44 | A | `The call is the user's, the framing is yours` | A3 |
| `docs/core/design/PROMPT-SYSTEM.md` | 4532 | :45 | :45 | A | `Nothing important stays in your head` | A3 |
| `docs/core/design/PROMPT-SYSTEM.md` | 4533 | :47 | :47 | A | `A batch ends with its account, not with "done"` | A3 |
| `docs/core/design/PROMPT-SYSTEM.md` | 4624 | :45·:47·:44 | :45·:47·:44 | A | `**Nothing important stays in your head**` | A3 |
| `docs/core/design/PROMPT-SYSTEM.md` | 4921 | :335·:361 | :335·:361 | B | `—` | B1*；标记 = 2026-10-28；引文亦在档 |
| `docs/core/design/PROMPT-SYSTEM.md` | 4924 | :338 | :338 | B | `—` | B1*；标记 = as-of 本次读数；引文亦在档 |
| `docs/core/design/PROMPT-SYSTEM.md` | 4959 | :437 | :437 | B | `—` | B1*；标记 = as-of 本次读数；引文亦在档 |
| `docs/core/design/PROMPT-SYSTEM.md` | 4960 | :351 | :351 | B | `—` | B1；标记 = as-of 本次读数 |
| `docs/core/design/PROMPT-SYSTEM.md` | 4962 | :421 | :421 | B | `—` | B1*；标记 = as-of 本次读数；引文亦在档 |
| `docs/core/design/PROMPT-SYSTEM.md` | 4971 | :331 | :331 | A | `**`batchDoc` is mandatory**` | A3 |
| `docs/core/design/PROMPT-SYSTEM.md` | 4973 | :438 | :438 | B | `—` | B1*；标记 = as-of 本次读数；引文亦在档 |
| `docs/core/design/PROMPT-SYSTEM.md` | 4981 | :334 | :334 | B | `—` | B1*；标记 = as-of 本次读数；引文亦在档 |
| `docs/core/design/PROMPT-SYSTEM.md` | 5031 | :335·:337 | :335·:337 | B | `—` | B1*；标记 = 2026-10-28；引文亦在档 |
| `docs/core/design/PROMPT-SYSTEM.md` | 5080 | :335 | :335 | A | `**One batch record serves one spawn at a time*` | A3 |
| `docs/core/design/PROMPT-SYSTEM.md` | 5082 | :444 | :444 | A | `- **Spawn mirror tasks across ` | A3 |
| `docs/core/design/PROMPT-SYSTEM.md` | 5094 | :335 | :335 | A | `counting unit` | A3 |
| `docs/core/design/PROMPT-SYSTEM.md` | 5098 | :335 | :335 | B | `—` | B1；标记 = 实读 |
| `docs/core/design/PROMPT-SYSTEM.md` | 5153 | :104 | :104 | A | `Above the anchor, climbing wou` | A3 |
| `docs/core/design/PROMPT-SYSTEM.md` | 5157 | :438 | :438 | B | `—` | B1*；标记 = as-of 本次读数；引文亦在档 |

### 5.3 判类表（分段二：其余 8 档 · 31 行）

| 档 | 行号 | 旧坐标 | 新坐标 | action | anchor | 备注 |
|---|---|---|---|---|---|---|
| `docs/core/design/ADVISOR-CONVERGENCE.md` | 164 | :88 | :293 | A | `- Round decay: round 2 verifie` | A2 |
| `docs/core/design/ADVISOR-CONVERGENCE.md` | 203 | :50 | :135 | A | `**§5 fix-round cap = 5 rounds**` | A2 |
| `docs/core/design/ADVISOR-CONVERGENCE.md` | 221 | :288 | :293 | A | `- Round decay: round 2 verifie` | A2 |
| `docs/core/design/ADVISOR-CONVERGENCE.md` | 222 | :50 | :135 | A | `**§5 fix-round cap = 5 rounds**` | A2 |
| `docs/core/design/AGENT-LOOP-SUBAGENT.md` | 413 | :72 | :82 | A | `**spawn eng-designer**` | A2 |
| `docs/core/design/AGENT-LOOP-SUBAGENT.md` | 414 | :312 | :330 | A | `In engineering mode the spawn ` | A2 |
| `docs/core/design/AGENT-LOOP-SUBAGENT.md` | 415 | :325 | :345 | A | `**The task book is batch record §2**` | A2 |
| `docs/core/design/AGENT-LOOP-SUBAGENT.md` | 416 | :432 | :438 | A | `- `subagent(role="eng-coder", designId=<id-A>,` | A2 |
| `docs/core/design/AGENT-LOOP-SUBAGENT.md` | 448 | :324 | :324 | A | `- **Why**: a token written int` | A3 |
| `docs/core/design/AGENT-LOOP-SUBAGENT.md` | 691 | :439 | :442 | A | `**Declare spawn scheduling metadata in the tas` | A2 |
| `docs/core/design/AGENT-LOOP-SUBAGENT.md` | 916 | :335 | :335 | B | `—` | B1；标记 = 2026-10-28 |
| `docs/core/design/AGENT-LOOP-SUBAGENT.md` | 926 | :335 | :335 | A | `**One batch record serves one spawn at a time*` | A3 |
| `docs/core/design/AGENT-LOOP-SUBAGENT.md` | 967 | :336 | :336 | B | `—` | B1；标记 = 2026-10-28 |
| `docs/core/design/AGENT-LOOP-SUBAGENT.md` | 1011 | :335 | :335 | A | `**One batch record serves one spawn at a time*` | A3 |
| `docs/core/design/ANCHOR-DEBT-REPAIR.md` | 362 | :100 | :100 | B | `—` | B1；标记 = `实测`（读数记录）；见 5.7.3 |
| `docs/core/design/LIGHT-CHANNEL.md` | 209 | :218 | :233 | A | `**Start-up booking**` | A2 |
| `docs/core/design/LIGHT-CHANNEL.md` | 347 | :211 | :211 | B | `—` | B1；标记 = 实读 |
| `docs/core/design/MANIFEST.md` | 711 | :56 | :112 | A | `Several = a workspace, a norma` | A2 |
| `docs/core/design/TOOLS.md` | 323 | :45 | :108 | A | `**Project-root judgment walks DOWN**` | A2 |
| `docs/core/design/TOOLS.md` | 697 | :68 | :188 | A | `**Debts go on the list**` | A2 |
| `docs/core/design/TOOLS.md` | 703 | :68 | :188 | A | `**Debts go on the list**` | A2 |
| `docs/core/design/TOOLS.md` | 1657 | :163 | :331 | A | `**`batchDoc` is mandatory**` | A2 |
| `docs/core/requirements/ENGINEERING-MODE-V2.md` | 792 | :162 | :350 | A | `- **Where §2 and the design do` | A2；父侧落笔（U1） |
| `docs/core/requirements/ENGINEERING-MODE-V2.md` | 807 | :14 | :14 | B | `—` | B1；标记 = 2026-10-19 |
| `docs/core/requirements/ENGINEERING-MODE-V2.md` | 822 | :229 | :229 | B | `—` | B1；标记 = 2026-10-19 |
| `docs/core/requirements/ENGINEERING-MODE-V2.md` | 824 | :40 | :76 | A | `**A batch-wide go-ahead puts the batch's whole` | A2；父侧落笔（U1） |
| `docs/core/requirements/ENGINEERING-MODE-V2.md` | 829 | :40 | :76 | A | `**A batch-wide go-ahead puts the batch's whole` | A2；父侧落笔（U1） |
| `docs/core/requirements/ENGINEERING-MODE-V2.md` | 1032 | :104 | :104 | A | `Above the anchor, climbing wou` | A3 |
| `docs/core/requirements/ENGINEERING-MODE-V2.md` | 1038 | :104 | :104 | B | `—` | B1；标记 = 2026-10-22 |
| `docs/core/requirements/ENGINEERING-MODE-V2.md` | 1052 | :104 | — | C | `旧引文「:104 原文 1,486 字符一行」（该行今 212 字符）` | C1；父侧落笔（U1）；见 5.4 |
| `docs/core/requirements/LIGHT-CHANNEL.md` | 110 | :218 | :218 | B | `—` | B1；标记 = 2026-10-24 |

**合计复核（AC-2c）**：分段一 **117** 行 + 分段二 **31** 行 = **148** 行；`(档, 行号)` 无重复。

**分段二里 `docs/core/design/TOOLS.md` 的四行**：表内行号 = 拆段前号（`323` / `697` / `703` / `1657`）；该档交付后行号已整体后移，现为 `331` / `718` / `730` / `1710`（+8 / +21 / +27 / +53）。按现盘读引用请取后者。

### 5.4 C 类处置（5 行 · AC-5）

**四条删坐标（`docs/core/design/PROMPT-SYSTEM.md` 行 `3747` / `3800` / `3857` / `3868`）**：

- 被删坐标字面 = `:345`（每条行内只此一处引用）。
- 旧引文逐字 = `**Verification = targeted unit tests for the changed face (single files) only**` —— 在被引档全档 **0** 命中。
- 语义锚落空读数：该纪律的现行句并入测试纪律节（`thincoder-core/prompts/discipline-engineering.md`），**不在被引档内** ⇒ 被引档里无号可指。
- 处置 = 删坐标（按 2.2.1 的「同义句不在被引档 ⇒ 删坐标」；不猜新号）。

**一条父侧改述（`docs/core/requirements/ENGINEERING-MODE-V2.md:1052`）**：被删坐标字面 = `:104`；旧引文 = 「原文 1,486 字符一行」；该行今 = **212** 字符，被引档今日 `>300` 命中 = **0**（最长 300 = `:154`）。处置 = 父侧改写为无坐标形，本席未落笔。

### 5.5 B 类 24 行（号不动 · AC-4）

**判据**：B 类前后行号集合逐项相等，差异 = **0**（24 行逐行比对，旧坐标 = 新坐标）。

- 双档特征同时在档、按 2.2 序 1 取 B 的 8 行：`docs/core/design/PROMPT-SYSTEM.md` 的 `4921` · `4924` · `4959` · `4962` · `4973` · `4981` · `5031` · `5157`（备注均带「引文亦在档」）。
- 其余 16 行按行内时点标记取 B：日期 10 行 · `实读` 5 行 · `实测` 1 行。

### 5.6 验收对照读数（AC-1a … AC-8）

| AC | 期望 | 本席读数 | 判 |
|---|---|---|---|
| AC-1a | 改前 148 行 / 153 处，逐档与 2.4 表相等 | 148 / 153 · 九档逐格相等 | ✅ |
| AC-1b | 复扫 = 148 − 删后零引用行数，两数入 §5 | 143 = 148 − 4 − 1；删坐标行 **4** · 删后零引用行 **4** | ✅ |
| AC-2 | 三类计数之和 = 148 | A 119 + B 24 + C 5 = 148 | ✅ |
| AC-2b | 双档特征行逐行带「按 2.2 序 1 取 B」 | 8 行全带 | ✅ |
| AC-2c | `(档, 行号)` 去重 = 148 | 148（117 + 31） | ✅ |
| AC-3 | A 行 anchor 非空 ∧ 命中 = 1 ∧ 目标行含串 | 118 行全绿、失配 0；1 行例外（`docs/core/design/PROMPT-SYSTEM.md:2147` · A0 非坐标） | ⚠️ 见 5.7.2 |
| AC-3b | 降级行三件齐 | 降级行 **0** | ✅（无行可列） |
| AC-4 | B 类坐标前后相等 | 差异 0 | ✅ |
| AC-5 | C 行逐条有处置 + 0 命中读数 | 5 行逐条见 5.4 | ✅ |
| AC-6 | 每条 `N ≤ 480` 且该行非空 | 越界 **0**；空目 **3**（全 B 类） | ⚠️ 见 5.7.1 |
| AC-7 | 7 档设计档 `doc_check` = PASS | 本批所改 6 档 0 命中；含 `docs/core/design/ANCHOR-DEBT-REPAIR.md` 时 REFUSED 3 | ⚠️ 见 5.7.4 |
| AC-8 | 9 档现行数与 2.4 表逐格相等 | 8 档相等；`docs/core/design/TOOLS.md` 1739 → 1792 | ⚠️ 见 5.7.5 |

### 5.7 偏差与残余（须父侧裁 · 本席未自行改判据）

**5.7.1 AC-6 与 2.2 序 1 相抵（3 条 B 类空目）**

- `docs/core/design/PROMPT-SYSTEM.md:1848` → `:14`：行内记「被取代条文 = `:14`」，该行今日已空。
- `docs/core/requirements/ENGINEERING-MODE-V2.md:807` → `:14`：同上（被推翻的条文）。
- `docs/core/requirements/LIGHT-CHANNEL.md:110` → `:218`：行内记「规则早已写明（`:218-222`）」，该段今日已移。
- 三行都带时点标记 ⇒ 2.2 序 1 判 B、E4 禁改号；AC-6 要求「空行 = 0」⇒ 两条不能同时成立。本席按 2.2 / E4 执行（B 号不动），AC-6 对 A / C 行成立（= 0）。改哪一头，父侧裁。

**5.7.2 基线含 1 条正则伪命中**

- `docs/core/design/PROMPT-SYSTEM.md:2147` 行内写的是扫描模式 `:2[3-9][0-9]`，本批正则在此截出 `:2` ⇒ 无坐标可收，记 `A0` 零改。该行计入 148 与 AC-2，故 AC-3 对它无锚可判。

**5.7.3 `docs/core/design/ANCHOR-DEBT-REPAIR.md:362` 的 B 判据用词**

- 2.2 点名它为 B 例（「时点标记在场」），行内实际标记词是 `实测`，不在 2.2 的标记词表（`as-of` ∥ `本次读数` ∥ `实读` ∥ 日期 ∥ 批档轮次）。
- 本席按设计点名的 B 例取 B、号不动。若父侧改判 A，则该行读数「最长 1486 字符 = `:100`」今日不成立（该行 = **212** 字符）。

**5.7.4 AC-7：`docs/core/design/ANCHOR-DEBT-REPAIR.md` 三条锚红（非本批笔域）**

- 命中在 `:131` / `:161` / `:358`，三处都指 RELEASE 的两份档（`docs/cli/design/` 与 `docs/core/requirements/` 下各一份，两档均不在盘）。
- 该三行是设计席按用户 13:30 裁定待删的读数行；本批只改该档 `:362` 一处（U2 补路径段）。删后该档锚命中归零，AC-7 复跑即 PASS。

**5.7.5 AC-8：`docs/core/design/TOOLS.md` 行数破除 ±0（父侧授权的拆段动作）**

- 读数 1790 → **1792**（本轮两处各 +1）；较 2.4 表 +53 = 前轮拆段 +51 + 本轮 +2。
- 该动作由父侧本轮加派（拆长段 ⇒ 段长判据 0 命中），与 AC-8「行数 ±0」天然相抵；本席不为此回改任何档。

**5.7.6 设计档读数失真一条（漂移上报，未动笔）**

- `docs/core/design/PROMPT-SYSTEM.md` 的 `3086` / `3103` / `3250` 三行称样板是「1,486 字符一行」；被引档今日最长行 = **300**（`:154`），`:209` = **130** 字符。
- 本批只收坐标、不改措辞（§2.7 边界）⇒ 该三行的读数失真随交付上报，请父侧另批处置。

### 5.8 复跑命令 · 自检 · 终态

**一次性复扫（仓根跑 · 不留存脚本）**：`node` 扫 `docs/core` 下全部 Markdown 档（后缀判据 = 扩展名以 md 结尾），正则 = 「被引档路径 + `:` + 行号」，输出 = 命中行数 / 处数 / 逐档处数。

```js
const re = new RegExp('persona-engineering' + '[.]' + 'md' + ':(\\d+)', 'g')
```

**AC-8 复跑命令（与 2.4 同式，`split('\n').length - 1`）**：`node -e` 逐档读 9 档取 `split('\n').length - 1`，与 2.4 表逐格比对；换成 `split('\n').length` 的读数各多 1，不许用来判。

**自检（本席本轮逐项）**：

- 本轮只动两处空行（`docs/core/design/TOOLS.md` 的原 `:411` 段后 · 原 `:1691` 段后），零字符、零调序 ⇒ 去空白字符数 132145 前后相等。
- §5 各段写入均回执 PASS，读数 = 1826 / 13036 / 6988 字符；判类表落盘后回读比对（与生成件逐行一致）。
- 判类表 148 行逐行的 `(档, 行号)` 与改前基线清单同集合（基线清单 = 本批首件扫描读数）。
- 未改任何规则语义：A 类只换行号、B 类零改、C 类删坐标；无措辞改动。

**测试面**：单元测试档 **none**（纯文档面，无可跑产物；无业务可观察结果变化）。集成面 = **none**（`test/RTM.md` 含被引档名的行 = 0、含跨档行号形的行 = 0 ⇒ 无一行断言跨档行号）。

**审计与评审轮**：内部发散审计 **0 轮** · advisor 代码评审 **0 轮** —— 本批无代码产物，前轮改笔已由父侧逐项独立复核（父侧复核读数：148→144 行 / 153→149 处、`docs/core/design/ANCHOR-DEBT-REPAIR.md` numstat 1/1）。

**终态** = `clean`（残余五条见 5.7，均已上报、未自行处置）。

### 5.9 表内更正（append-only 补正 · 落盘后回读比对查出两处）

**更正 1 —— 5.2 表 `5094` 行的 anchor**：应作 `**One batch record serves one spawn at a time**`（全档命中 **1** ∧ 在 `:335`）。
表内原串 `counting unit` 全档唯一、但住 `:446`，不满足 AC-3 第三件 ⇒ 该行按本更正判绿。

**AC-3 全表回读复核读数（对已落盘的表逐行跑）**：A 行 **119** 条的 anchor 逐条机检 —— 合格 **117** · 原串不合格 **1**（`5094`，本条已补正）· 无锚 **1**（`A0`，见 5.7.2）。

**更正 2 —— 5.6 的 AC-6 空目计数**：全表空目 = **4** 条，不是 3 条 —— **3** 条 B 类（见 5.7.1）+ **1** 条 `A0`（`docs/core/design/PROMPT-SYSTEM.md:2147` → `:2`，见 5.7.2）。越界仍为 **0**。

## §6 验证与收口（父代理）

## 6. 验证与收口（父代理）

**状态行**：已收口 2026-10-28

### 6.1 交付事实

| 项 | 读数 |
|---|---|
| 改动档 | **12 档**（11 档 `docs/core/design/**` + 1 档 `docs/core/requirements/ENGINEERING-MODE-V2.md`） |
| 命中行 / 处 | **148 → 143 行** · **153 → 148 处** |
| 判类 | **A 119 · B 24 · C 5 = 148**（`(档, 行号)` 唯一 148） |
| 需求档 9 行 | 父侧落 **4 行**（三处改指 `:350` / `:76` / `:76`；一处改述去坐标），其余 5 行 B 保号 |

### 6.2 父侧独立复核（不采信报告）

| 复核项 | 方法 | 读数 |
|---|---|---|
| `docs/core/design/TOOLS.md` 拆段零改字 | 去空白 **去数字** 后逐字比对 | **127460 = 127460** 相等 |
| 同档行数 / 非空 / 段落命中 | `split('\n').length − 1` + 段落引擎 | **1792 行** · 非空 **1352** · 超长段 **0** |
| 同档增量自洽 | `git diff` 逐行 | `+59 / −6`；空行 391 → **441**（+50）；非空 1349 → 1352（+3） |
| 复扫 | 仓根 `docs/core` 走 `persona-engineering\.md:(\d+)` | **143 行 / 148 处**，与实施席读数一致 |
| `docs/core/design/ANCHOR-DEBT-REPAIR.md` 死锚 | 扫两串 | 各 **0** 命中（设计席已按用户裁定删除） |

### 6.3 doc-check 交付门

```
DOC-CHECK GATE: PASS
范围：显式 docs 12 档 · 结论：0 段有问题（12 档全清）
```

### 6.4 实施席五点上抛的处置

| # | 上抛 | 裁定 |
|---|---|---|
| 1 | AC-6（空行 = 0）与 §2.2 序 1 相抵（3 条 B 行指向今日空行） | **按 §2.2 执行**：B 类禁改号优先；**AC-6 的射程因此收窄为 A / C 行**（= 0）。判据与规矩相抵时，**改判据不改活** |
| 2 | AC-7 含 `docs/core/design/ANCHOR-DEBT-REPAIR.md` 时 REFUSED 3 | **已消解**：设计席按用户裁定删了那三行，现两串各 0 命中；交付门 12 档 PASS |
| 3 | AC-8 同档 1739 → 1792（+53） | **已改口径**：设计席就地拆成 AC-8a（坐标相判行数）∥ AC-8b（拆段相判归一化相等 + 空行增量） |
| 4 | `docs/core/design/ANCHOR-DEBT-REPAIR.md:362` 行内标记词是「实测」不在 §2.2 词表（「实读」） | **按设计点名的 B 判**：号不动。词表与实例不同名 ⇒ 记入残留批待并 |
| 5 | **设计档漂移**：`docs/core/design/PROMPT-SYSTEM.md` 的 `3086` / `3103` / `3250` 三行仍称样板「1,486 字符一行」，被引档今日最长行 **300** | **同一类，路由残留批**（与父侧判 `:1052` 同形）。**本批不动** —— 用户 13:34 定的顺序是规矩先、残留后 |

### 6.5 本批留给残留批的项（已登台账 `#1904`）

1. `docs/core/design/ANCHOR-DEBT-REPAIR.md` **整张读数面删除**（约 150–200 行）—— 用户裁定：该档两线已收口，表上 **833** 与当刻实测 **47877** 差两个数量级
2. `docs/core/design/PROMPT-SYSTEM.md` 三行「1,486 字符」失真读数
3. `docs/core/design/ANCHOR-DEBT-REPAIR.md` 标记词表与实例不同名（「实读」vs「实测」）

### 6.6 集成测试面

**本批零产品码**（12 档全为文档面），**无集成用例新增或修订**，集成集规模不变。**未做集成验证 —— 本批不含可执行业务面。**

### 6.7 收口判据

- chain 齐备：§1 讨论 ✅ · §2 批次任务与设计 ✅ · §3 设计评审 ✅（第 2 轮通过）· §4 用户批准 ✅ · §6 本段 ✅
- 交付门 `DOC-CHECK GATE: PASS`
- 台账：`#1894` → 待核销 → 已核销（证据 = 本档 §6）
