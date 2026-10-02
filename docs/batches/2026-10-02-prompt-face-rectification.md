# 2026-10-02 · prompt-face-rectification
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-02 · 来源 = 用户 2026-10-02 17:44「需求和待办赶紧开批」+ 台账 #800 ∥ #727 ∥ #814（三行在册——提示词/机制入文面）。
> 台账 = #800 ∥ #727 ∥ #814（提示词面收正 · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-02
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**来源**：用户 2026-10-02 17:44「需求和待办赶紧开批」+ 台账 #800 ∥ #727 ∥ #814（提示词面收正）。

**设计轮落定核读 + 上抛处置（2026-10-02 18:1x · 父侧）**：三件定形 ✓（① #800 = `common.md` 双面 +1 段（公共层「语言纪律」节内增列——KD-1；否决邻位新节 ∥ 纪律层 ∥ 人格层）；② #727 = 需求 §2.3 +1 条 ∥ 判定句半句 ∥ §4 +⑥ + persona 双面 +1 行（K14）；③ #814 = 裁「同步」——discipline 双面表头/计数/D8 行）；设计档三档已落（`PROMPT-SYSTEM.md` §6.13 + D-PS14–16 ∥ `LIGHT-CHANNEL.md` §3/§4⑥/K14 ∥ `DOC-DISCIPLINE.md` D8 块）；机检 = `prompt-refs-check` 零命中 ∥ `doc-check` 基线零新增（含一条工具陷阱实录——见 U5）。**U1/U2 = 父侧笔已落**（需求块定形四处：落点句 / 边界 / 验收 / 实现序 ∥ 需求 §2.3 条 + 判定句半句 + §4⑥）。**U3 = 父侧随批落**（`docs/core/requirements/ENGINEERING-MODE-V2.md` §13.1 + 映射行 `:571` 同步 D1–D8——「主 agent 域」兑现；§2.7 ③c 的「在册待办」项至此消解）。**U4 = 随批收正**（设计档 `LIGHT-CHANNEL.md:4 ∥ :143` 回指范围 ①–④ ⇒ ①–⑥）。**U5 工具陷阱 = 在册**（`doc-check` 缺省 root = cwd——非仓根运行假红 8125；台账行在册）。**候用户点火评审**。

**授权（2026-10-02 19:30 · 用户「全自动」）**：本批转**全链自动**（代点火 ∥ 修正派发 ∥ §4 代签 ∥ 实施派发 ∥ 收口核销——自缚三条：① 代签仅当三条件齐备（评审 pass 0🔴 ∧ 修正落地核验 ∧ token 签发）；② 新范围 ∥ 用户口径裁决 ⇒ 停、只摆那一条；③ 破坏性/不可逆 ⇒ 停）。**设计评审代点火中**（报告到达 ⇒ 逐条裁定 → 修正（如有）→ 代签 → 实施 → 核验 → 收口）。

**评审 #18（轮 1）= pass**（🔴0 ∥ 🟡3 ∥ 🔵3——§3 在册）；**六条全修于本轮（父侧笔 · 可 revert）**：① 🟡 DOC-DISCIPLINE 三处（`:5` ∥ `:12` ∥ `:33`）⇒ D1–D8 现态 + 「同步已落」；② 🟡 需求 `PROMPT-SYSTEM.md:65` 行 1 补「面向用户的表述（说人话）」面；③ 🟡 #800 登记块自 §2.4 移入 §2.3（层级与落点同层——块现 `:99-104`）；④ 🔵 块状态词收口（「待讨论」⇒「入批」∥「定形 = 设计轮」⇒「定形已落」）+ 变更行（`:253`）；⑤ 🔵 需求行 6 补「失效表达必删」（D8 语义——`common.md` 实核属实）；⑥ 🔵 设计 `LIGHT-CHANNEL.md:71` 补全续笔半句 + 设计 `PROMPT-SYSTEM.md:349`「已落」校准。**§4 代签 + 实施派发（eng-coder——六档落笔）。**

**实施轮核读（父侧 · 2026-10-02 19:5x）**：六档落笔与坐标逐处实读相符（读数 = **127 ∥ 169 ∥ 192 ∥ 192 ∥ 171 ∥ 179**；十处落点逐条视读 ✓——说人话段 ∥ 轮次界双面行 ∥ D1–D8 表头/计数/D8 行）；一次性比对 **6/6 逐字全等**（实施舱实跑）；`prompt-refs-check` **零命中**（父侧复跑）；六档外零改（git diff = +1 行 ×2 档 direct 佐证）。**代码评审 🟡1（persona 缩进形态）= 裁「保持现状」**（验收 = 围栏块逐字优先；如设计面后裁改缩进 ⇒ 单行随正——登记不阻）；🔵1 = 非缺陷（同面重复——#814 裁定内）；fix round 0 ∥ 终态 clean。**范围外注记受理**：批档 §2.4/§2.7 过时陈述 = 记录面 as-of（不动）；`requirements/PROMPT-SYSTEM.md:103` 字面自引用 = 探伤级零动作；persona 双面 `##` 计数 16/17 = 预存在形态差（非本批；在册）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（三件逐件定形（§2.2）∥ 双面逐字草案（§2.3 围栏块 A–C）∥ 一致化清单（§2.4）∥ 设计档三档已在盘（§2.5）；上抛 3；机检读数：refs 零命中 ∥ doc-check 121/105/0（基线 Δ0——本批 authored 零新增））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**本批 = 提示词面收正批 · 设计轮（不实施）**——三件并批：#800（面向用户的表述纪律入提示词）∥ #727（「轮次界 = 收口」入文）∥ #814（D8 同步裁决 + 落文）。件源核对：三行 `task_book` 均指本档 ✓；#818 批（轻通道扩容）已收口——其**批档**冻结只读（`docs/batches/2026-10-02-light-channel-expansion.md`——本批零写）；活档（需求 ∥ 提示词 ∥ 设计）为落笔面。

**任务书依据**：spawn 派单 + 台账三行（届盘实读；§1 讨论段届盘 = 模板占位——主 agent 段待落）。

### 2.0 任务书（覆盖 ∥ 边界）

- **轮次 = initial**；本批覆盖 = 三件（逐件定形 = §2.2；逐字草案 = §2.3；一致化清单 = §2.4；验收 = §2.7）：
  ① **#800** 面向用户的表述纪律（说人话 · 少术语黑话）入提示词——落点定形 = **公共层「语言纪律」节内增列**（双面）；
  ② **#727**「轮次界 = 收口」入文——**需求 §2.3 +1 条 + 判定句半句 + §4 ⑥**（主 agent 笔）∥ **提示词「派发与收尾纪律」节内 +1 行**（双面）；
  ③ **#814** D8 同步裁决——裁定 = **同步**：提示词清单位列 **D1–D8**（表头 ∥ 计数句 ∥ +D8 行——双面）。
- **本批不做（边界）**：产品码零触 ∥ #818 批档零触（记录冻结）∥ **越三件扩改**（需求侧 D8 同步 = `docs/core/requirements/ENGINEERING-MODE-V2.md` §13.1——在册（`docs/core/design/DOC-DISCIPLINE.md:33`）主 agent 域，本批零触）∥ 既有提示词条款零改写（#814 清单位面 = 唯一许可面——表头 / 计数句 / +1 行）∥ 不改 D1–D7 行语义 ∥ 不新增节 ∥ 不新增机检门。
- **笔路（落笔归实施轮）**：CN 正本（`docs/core/design/prompts/**`）= 设计档行 = eng-designer 笔；EN 运行面（`thincoder-core/prompts/**`）= eng-coder 落笔（M9 翻译回写、非 cp）；需求面 = 主 agent 笔（逐字 = §2.3）；设计档登记 = 本席（已在盘——§2.5）。
- **测试面**：批内件 = 无（提示词 / 文档文本笔——承 #725 先例）；机检 = `node scripts/prompt-refs-check.mjs`（零命中）∥ `node scripts/doc-check.mjs`（本批 authored 零新增）；仓套件 = 父侧收口一次。

### 2.1 现状实读（三件 · 届盘 file:line 证据）

① **#800**：需求块 `docs/core/requirements/PROMPT-SYSTEM.md:126-131`（落点草案 = 「公共层『语言纪律』节增列或邻位新节」〔定形由设计轮〕· 验收草案 :130）；CN `docs/core/design/prompts/common.md:3-5` ∥ EN `thincoder-core/prompts/common.md:3-6`——语言纪律节现两句 / 三句（语言 ∥ 术语原文 ∥ 产物惯例），无表述纪律句。
② **#727**：规则现仅设计档 `docs/core/design/LIGHT-CHANNEL.md:71`（§2.3 末条——零改）；需求 `docs/core/requirements/LIGHT-CHANNEL.md:54-62`（§2.3——无该条；判定句 :62 无续笔归属半句）；提示词 CN `docs/core/design/prompts/persona-engineering.md:82-90` ∥ EN `thincoder-core/prompts/persona-engineering.md:85-91`（轻通道块——「轮次 = 批档一本」/「收口触发」/「跨会话接手」在盘，无该句）。
③ **#814**：设计档 D1–D8 = `docs/core/design/DOC-DISCIPLINE.md:10-33`（D8 行 :23 ∥ 细则 :25-33 ∥「需求侧同步」行 :33——**提示词面去向零载**）；提示词 CN `docs/core/design/prompts/discipline-engineering.md:151-161` ∥ EN `thincoder-core/prompts/discipline-engineering.md:158-169`（清单 D1–D7）；**D8 语义已在提示词面** = CN `docs/core/design/prompts/common.md:34` ∥ EN `thincoder-core/prompts/common.md:39`（「文档写作纪律」节——2026-09-18 裁定句）——所缺 = **清单位同步**（表头 / 计数句 / 行）。

### 2.2 裁定与落点（逐件定形 · 四问）

**① #800 → 公共层「语言纪律」节内增列（既有节内——不新增节）**
- 四问：表述面 = 「怎么说」——两模式逐句都要的协作基础，受众 = 全角色（两模式 + 全部子代理——子代理面 = 面向父代理）⇒ 公共层；`common.md` 恒第二位 = 唯一全覆盖面；与「语言纪律」（用哪种语言 + 术语原文）同节同轴（节内第三句——管表述）。
- 否决「邻位新节」：零收益 + `##` 块计数扰动（需求档「14 节」计数面 ∥ 块计数面连带）；否决「落纪律层 ∥ 人格层」：受众不齐（子代理缺位 / 仅主 agent——#800 需求块明书「子代理语境 = 面向父代理」）。
- 落点：CN `docs/core/design/prompts/common.md` §语言纪律节内（现 :5 后增 1 段）∥ EN `thincoder-core/prompts/common.md`（现 :6 后增 1 段）。

**② #727 → 需求 §2.3 邻位 +1 条 ∥ 提示词「派发与收尾纪律」+1 行（双面）**
- 设计句已在位（`docs/core/design/LIGHT-CHANNEL.md:71`——零改）；本批 = 入文两面定形（续笔归属两半句：收口前新笔同轮 ∥ 收口后另起新轮新档）。
- 落点：需求 `docs/core/requirements/LIGHT-CHANNEL.md` §2.3（现 :57 后增 1 条；判定句 :62 增半句；§4 增 ⑥——主 agent 笔）∥ CN `docs/core/design/prompts/persona-engineering.md`（现 :87 后增 1 行——「轮次 = 批档一本」与「收口触发」之间）∥ EN `thincoder-core/prompts/persona-engineering.md`（现 :88 后增 1 行）。
- 否决「只落需求」（跨会话续笔的提示词依据仍缺——#727 立案原状）·「只落提示词」（需求 ∥ 设计 ∥ 提示词三面不同步——立案前提即「仅设计档载」）·「落 discipline-engineering「轮次形」」（受众 = 子代理——轮次归属 = 主 agent 写权独属动作；子代理不路由本通道）。

**③ #814 → 裁定「同步」——提示词清单位列 D1–D8（双面）**
- 裁定理由：清单位 = 运行期可读的 D 族全表（设计族 = D1–D8——跨档同数为簿记面所需）；D8 语义已住公共层（全模式覆盖不损——清单行 = 同族行式，非详述）；缺位 = #814 立案的滞后本体（表头 / 计数句 七 vs 设计档 八）。
- 落点：CN `docs/core/design/prompts/discipline-engineering.md`（:151 表头 `（D1–D7）`→`（D1–D8）`；:152「七条」→「八条」；:161 后增 D8 行）∥ EN `thincoder-core/prompts/discipline-engineering.md`（:158 / :159 同形；:169 后增 D8 行）。
- 否决「不同步」：跨档计数并存 = 滞后本体（清单位读者无从判 D8 是否属族；「理由入档」无承载面）。
- 连带登记：`docs/core/design/DOC-DISCIPLINE.md` D8 块补「提示词面同步」行（本席已落——§2.5）；需求侧 §13.1 仍 D1–D7（在册 = 主 agent 域——本批零触）。

### 2.3 逐字草案（一次性材料——落地档 ↔ 本块一次性比对基线；CN 正本 ∥ EN 运行面）

围栏块 A（#800）：

```text
A. #800 —— common.md「语言纪律」节内增列 1 段：
[CN 追加段]（docs/core/design/prompts/common.md——现第 5 行后）
**说人话**：面向用户（子代理 = 面向父代理）的回复与汇报以**可读可复述**为标尺——**内部术语 / 代号 / 行话不得裸用**（出现时随文一句白话解释）；复杂机制先白话打底、再按需给精确细节。文档 / 代码 / 评审表按各自惯例，不受此限。
[EN 追加段]（thincoder-core/prompts/common.md——现第 6 行后）
**Speak plainly**: replies and reports to the user (for a subagent, the parent is the user) must be **readable and repeatable back** — **internal terms / codenames / jargon must not be used bare** (follow each with a one-line plain explanation); ground complex mechanisms in plain words first, then give precise details as needed. Docs / code / review tables follow their own conventions.
```

围栏块 B（#727）：

```text
B. #727 —— 需求条 ∥ 提示词行：
[B1 CN 需求] 新增条（docs/core/requirements/LIGHT-CHANNEL.md §2.3——「启动即挂账」条后）
- **轮次界 = 收口（2026-10-02 入文）**：收口前的新笔 = 本轮续笔（同轮记录）；**收口后新笔另起新轮新档**（承批次档生命周期「条目集变更 ⇒ 另起新批」）。
[B2 CN 需求] 判定句半句（§2.3 判定句尾追加）
；**续笔归属可抽查**（收口前新笔同轮 ∥ 收口后另起新轮新档）
[B3 CN 需求] §4 新增 ⑥ 行
| ⑥ | 收正增量（2026-10-02）：「轮次界 = 收口」（§2.3）落需求 ∥ 提示词双面后，按 ①–④ 同构判据核（收正批 = docs/batches/2026-10-02-prompt-face-rectification.md；台账 #727）。 |
[B4 CN 提示词] 新增行（docs/core/design/prompts/persona-engineering.md——现 :87「轮次 = 批档一本」行后）
**轮次界 = 收口**：收口前的新笔 = 本轮续笔；收口后新笔另起新轮新档。
[B5 EN 提示词] 新增行（thincoder-core/prompts/persona-engineering.md——现 :88「The round = one batch record」行后）
**Round boundary = closeout**: new pens before the closeout stay in the round; after the closeout, new pens start a new round and a new record.
```

围栏块 C（#814）：

```text
C. #814 —— 清单位同步（表头 ∥ 计数句 ∥ +D8 行）：
[C1 CN] docs/core/design/prompts/discipline-engineering.md
- :151 表头：### 文档更新纪律（D1–D7） ⇒ ### 文档更新纪律（D1–D8）
- :152 计数句：…文档更新纪律七条： ⇒ …文档更新纪律八条：
- :161 后新增行：
8. **D8 失效表达必删** — 规范面（功能点 / AC / 判据句 / 纪律句 / 边界 / 现状陈述）内失效的表达（被判否 / 对象消失 / 被取代）⇒ **删除**——不留 `~~划改~~` / 不写「原记 X ⇒ 收正 Y」/ 不留「已作废」挂尸；历史归**记录面**。
[C2 EN] thincoder-core/prompts/discipline-engineering.md
- :158 表头：### Doc update discipline (D1–D7) ⇒ ### Doc update discipline (D1–D8)
- :159：Seven doc-update disciplines: ⇒ Eight doc-update disciplines:
- :169 后新增行：
8. **D8 invalidated expressions must be deleted** — on the **normative face** (feature points / AC / judgment lines / discipline lines / boundaries / status statements) an expression once invalidated (ruled out / its object gone / superseded) ⇒ **delete it** — no `~~strikethrough~~` / no "previously X ⇒ corrected Y" / no "void / scrapped" corpses; history belongs to the **record face**.
```

### 2.4 一致化清单（随动面——逐件）

- **① #800**：CN / EN `common.md` 各 +1 段（草案 A）∥ 需求块定形更新（`docs/core/requirements/PROMPT-SYSTEM.md:126-131`——「〔定形由设计轮〕」→ 定形句 + 验收定形；主 agent 笔）∥ 块计数无涉（零 `##` 新增）∥ `prompt-refs-check` 零命中 ∥ CN 新行 ≤300。
- **② #727**：需求 §2.3 条 + 判定句半句 + §4 ⑥（主 agent 笔）∥ CN / EN persona 各 +1 行（草案 B4 / B5）∥ 设计面：`docs/core/design/LIGHT-CHANNEL.md` §3 枚举补 + §4 ⑥ + §7 K14 + §8（本席已落）∥ `docs/core/design/PROMPT-SYSTEM.md` §6.12 枚举补 + §6.13 + D-PS15（本席已落）∥ 三链一致（批档 §2 条目 = 设计验收 = 需求 §2.3 / §4⑥）。
- **③ #814**：CN / EN `discipline-engineering.md` 表头 / 计数句 / D8 行（草案 C）∥ `docs/core/design/DOC-DISCIPLINE.md` D8 块 + 变更记录（本席已落）∥ `docs/core/design/PROMPT-SYSTEM.md` §6.13 + D-PS16（本席已落）∥ 需求侧 §13.1（+ 映射行 `:571`）仍 D1–D7——在册主 agent 域、本批零触 ∥ 归档 / 史面（`thincoder-cli/docs/_archive/**` ∥ 批档面）零触。

### 2.5 设计档落点（本席笔——**本轮已在盘**）

- `docs/core/design/PROMPT-SYSTEM.md`：**§6.13 新增**（三件登记）∥ §6.12 分层归属枚举补「轮次界 = 收口」∥ §6.1 应用实例补 ∥ §7 D-PS14 / D-PS15 / D-PS16 ∥ 变更记录行。
- `docs/core/design/LIGHT-CHANNEL.md`：§3 落点枚举补 ∥ §4 ⑥ ∥ §7 K14 ∥ §8 变更记录行。
- `docs/core/design/DOC-DISCIPLINE.md`：D8 块「提示词面同步」行 ∥ 变更记录行。

### 2.6 受影响文件（现行数 = 落笔前读数 → 预计 Δ；笔路）

| # | 档 | 现行数（行） | Δ | 面 | 笔 |
|---|---|---|---|---|---|
| 1 | `docs/core/design/prompts/common.md` | 126 | +1 | CN 正本 | 实施轮 |
| 2 | `thincoder-core/prompts/common.md` | 168 | +1 | EN 运行面 | 实施轮 |
| 3 | `docs/core/design/prompts/persona-engineering.md` | 191 | +1 | CN 正本 | 实施轮 |
| 4 | `thincoder-core/prompts/persona-engineering.md` | 191 | +1 | EN 运行面 | 实施轮 |
| 5 | `docs/core/design/prompts/discipline-engineering.md` | 170 | +1（表头 / 计数句两处改写） | CN 正本 | 实施轮 |
| 6 | `thincoder-core/prompts/discipline-engineering.md` | 178 | +1（同两处改写） | EN 运行面 | 实施轮 |
| 7 | `docs/core/requirements/LIGHT-CHANNEL.md` | 88 | +1 条 + 半句 + ⑥ 行 | 需求面 | 主 agent |
| 8 | `docs/core/requirements/PROMPT-SYSTEM.md` | 252 | 0 净（块内改写） | 需求面 | 主 agent |
| 9 | `docs/core/design/PROMPT-SYSTEM.md` | 567 | +≈21（本轮已落） | 设计面 | 本席 |
| 10 | `docs/core/design/LIGHT-CHANNEL.md` | 201 | +≈6（本轮已落） | 设计面 | 本席 |
| 11 | `docs/core/design/DOC-DISCIPLINE.md` | 1635 | +≈3（本轮已落） | 设计面 | 本席 |

### 2.7 验收对照（回指三件——机判 / 可核逐条）

- **① #800**：a) 双面在位且与 §2.3-A 逐字全等（一次性比对——落地档 ↔ 围栏块）；b) `node scripts/prompt-refs-check.mjs` 零命中；c) 需求块定形在盘（:126-131 无「草案 / 定形由设计轮」残句）；d) `doc-check` 本批 authored 零新增。
- **② #727**：a) 需求 §2.3 条 + 判定句半句 + §4 ⑥ 在盘（主 agent 落）；b) 双面提示词行在位 + 逐字全等（§2.3-B4 / B5）；c) 设计枚举两处对齐（`LIGHT-CHANNEL.md` §3 ∥ `PROMPT-SYSTEM.md` §6.12——两处同 10 项）；d) `prompt-refs-check` 零命中。
- **③ #814**：a) 两档表头 / 计数句现列 D1–D8 + D8 行在位（逐字 = §2.3-C）；b) `DOC-DISCIPLINE.md` D8 块「提示词面同步」行在盘；c) `prompt-refs-check` 零命中；d) 需求侧 §13.1 = 在册待办（非本批判据——本批不判其闭合）。

### 2.8 关键决策（本条 = 索引；全文 = 设计档）

- KD-1 = #800 落点「公共层节内增列」（否决邻位新节 / 纪律层 / 人格层）——→ `docs/core/design/PROMPT-SYSTEM.md` §7 D-PS14；
- KD-2 = #727 落点「需求 §2.3 + persona 双面」（否决只落一面 / 纪律层）——→ 同档 D-PS15 ∥ `docs/core/design/LIGHT-CHANNEL.md` §7 K14；
- KD-3 = #814 裁定「同步」（否决不同步）——→ 同档 D-PS16。

### 2.9 上抛项（主 agent 域——需求笔清单）

- **U1（需求笔 · #800）**：`docs/core/requirements/PROMPT-SYSTEM.md:126-131` 块定形——「（#800 · 待讨论…）」态 → 定形态：① 落点句改定形（「公共层『语言纪律』节增列」——逐字见 §2.3-A）；② 验收句定形（建议：双面在位 + 逐字比对 + `prompt-refs-check` 零命中 + 行为面 = 会话抽查观察项）；③ 可选：功能点①「增列或邻位新节」收定为「增列」。
- **U2（需求笔 · #727）**：`docs/core/requirements/LIGHT-CHANNEL.md` 三处——§2.3 新增条 ∥ 判定句半句 ∥ §4 ⑥（逐字 = §2.3-B1 / B2 / B3）。
- **U3（提醒 · 非本批）**：#814 需求侧同步（`docs/core/requirements/ENGINEERING-MODE-V2.md` §13.1 仍 D1–D7 + 映射行 `:571`）——在册（`DOC-DISCIPLINE.md:33`「需求侧同步 = 主 agent 域」）；本批零触；是否随本批一并落 = 主 agent 裁。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**设计评审 · 发现表（🔴 0 ∥ 🟡 3 ∥ 🔵 3）**

| # | Category | Severity | Issue | Suggestion |
|---|---|---|---|---|
| 1 | Document ownership（跨档状态滞后） | 🟡 | D8 同步落定后，设计侧对「需求侧状态」的三处陈述未随动：`thincoder/docs/core/design/DOC-DISCIPLINE.md:5`（§13.1 指针句「文档更新纪律 D1–D7」）· `:12`（「需求侧权威——现列 D1–D7；D8 为设计侧新增，需求侧同步 = 主 agent 域」）· `:33`（「§13.1 现列 D1–D7」）；需求档现态 = `thincoder/docs/core/requirements/ENGINEERING-MODE-V2.md:590`（「§13.1 文档更新纪律 D1–D8」）+ `:603`（D8 行，含「2026-10-02 同步」注）+ `:571`（§12 继承表亦 D1–D8）。同类：`thincoder/docs/core/design/PROMPT-SYSTEM.md:349`（「需求侧 D8 同步（…）不入本批」）与需求侧已落并存；设计自述「需求侧状态零改」（`DOC-DISCIPLINE.md:1638`）。 | 三处（`:5` / `:12` / `:33`）按需求档现态收正（D1–D8；pending 限定句改「已落 + 出处」形或删）；`PROMPT-SYSTEM.md:349` 的「不入本批」限定同轮校准；时点可并入 D7 核销同步清单随收尾轮、或随设计面收正轮落地。 |
| 2 | Requirements（公共层大纲随动缺口） | 🟡 | #800「语言纪律」节内增列未安排需求侧 §2.3 大纲行 1 随动——`thincoder/docs/core/requirements/PROMPT-SYSTEM.md:65`（行 1）现述未覆盖新增「面向用户的表述（说人话）」面；增补块自述与之分层 = 不同面（`:128`「与本表行 1 管『用哪种语言 + 术语保留原文』分层」）；同族先例 = 行 8（`:72` 冲突句入行）· 行 10（`:74` 红线 +〔2026-09-20 增补②〕）均随增列随动。设计侧 `thincoder/docs/core/design/PROMPT-SYSTEM.md:343`（落点句）∥ D-PS14（`:368`）未涉。 | 行 1 按同族形随动（补「面向用户的表述（说人话）」面）；或记录「大纲不随动」的裁定理由并留验收面。 |
| 3 | Document ownership（层归属） | 🟡 | #800 需求池登记块位列 §2.4 纪律层（`requirements/PROMPT-SYSTEM.md:99` 节头 ∥ 块体 `:126`–`:131`），其落点为公共层「语言纪律」（§2.3 面——`:128` 自述）；同族先例 = 红线增补块入 §2.3（`:94`–`:97`）· 人格层增补块入 §2.2（`:50` 起）——层级与落点同层；本块层级不符。 | 移至 §2.3 公共层邻位（与「语言纪律」面同层）；或注明跨层登记的裁定理由（防读者按 §2.3 面找不到该增补）。 |
| 4 | Doc hygiene（登记块收口面） | 🔵 | #800 块状态面：块首「（#800 · 待讨论——…）」（`:126`）∥ 块尾「已入批（…；实施 = 该批实施轮）」（`:131`）互抵；块内「（定形 = 设计轮——…）」（`:128`）与块自设验收「本块无『草案 / 定形由设计轮』残句」（`:130`）存字面张力；本档变更记录末行 = 2026-09-30（`:251`），无本块登记行（同族均有一行——`:236` ∥ `:244`）。 | 收口时同轮校状态词（「待讨论」⇒ 现行为）与验收句字面（残句核读）；补变更记录行或记并账理由。 |
| 5 | Clarity（落据可核性） | 🔵 | D8 落据句「D8 语义已住公共层『文档写作纪律』」（`DOC-DISCIPLINE.md:34` ∥ 设计 `PROMPT-SYSTEM.md:339` ∥ `:370` D-PS16）在需求侧无可见对应——`requirements/PROMPT-SYSTEM.md:70`（行 6 大纲）仅载「禁脚本代笔 + 语义合并」；`common.md` 现文不在本评审射程（未核）。 | 落笔前核 `common.md` 该节现文：属实则行 6 随动（先例同 #2）；不实则补语义面或收正落据句。 |
| 6 | 一致性（低优先） | 🔵 | 设计 `thincoder/docs/core/design/LIGHT-CHANNEL.md:71` 规则句仅载「收口后新笔另起新轮新档」半句；「收口前的新笔 = 本轮续笔」半句仅住需求档（`requirements/LIGHT-CHANNEL.md:58`）——设计 §4⑥（`:152`）以「续笔两半句逐字」为对照面，设计自述 §2.3 本轮零改（`:205`）。 | 实施轮对账以需求档两半句为准；后续设计修订轮可补全设计句（本轮零改已声明 ⇒ 低优先）。 |

**计数**：🔴 0 ∥ 🟡 3 ∥ 🔵 3

VERDICT: pass

## §4 用户批准（主 agent）

**§4 用户批准（主 agent 代签）**：**代签成立（2026-10-02 19:5x · 自动链授权内——用户 19:30「全自动」）**——三条件核：① **设计评审 pass** ✓（评审 #18 · 轮次 1：🔴0 ∥ 🟡3 ∥ 🔵3——§3 逐字在册）；② **修正落地并逐条核验** ✓（六条全修——见 §1；读回在案）；③ **token 已签发** ✓（凭据值不落档）。**实施派发** = eng-coder（六档提示词落笔——逐字 = §2.3 围栏块 A ∥ B ∥ C；EN 按 M9 翻译回写）。

## §5 实施记录（eng-coder）

**状态行**：实施完成（2026-10-02 · initial 轮 · eng-coder——六档逐字落笔（一次性比对 6/6）∥ 审计 CLEAN + 代码评审 pass（🟡1 非阻塞 Deferred ∥ 🔵1 记录）∥ fix round 0 ∥ 终态 clean）

**交付摘要（三件 → 六档 · 逐字 = §2.3 围栏块 A ∥ B ∥ C）**：

- ① **#800**：`docs/core/design/prompts/common.md` 现 :6 +1 段 ∥ `thincoder-core/prompts/common.md` 现 :7 +1 段（「语言纪律」节内增列——内容行 126 ⇒ 127 ∥ 168 ⇒ 169）。
- ② **#727**：`docs/core/design/prompts/persona-engineering.md` 现 :88 +1 行 ∥ `thincoder-core/prompts/persona-engineering.md` 现 :89 +1 行（「轮次 = 批档一本」与「收口触发」之间——191 ⇒ 192 两档同）。
- ③ **#814**：`docs/core/design/prompts/discipline-engineering.md` :151 表头（D1–D7 ⇒ D1–D8）∥ :152 计数句（七条 ⇒ 八条）∥ :162 +D8 行（170 ⇒ 171）∥ `thincoder-core/prompts/discipline-engineering.md` :158 / :159 / :170 同形（178 ⇒ 179）；**D1–D7 行零改**。

**六档逐档读数（落笔后 · D6 读回 · 内容行口径）**：

| # | 档 | 落笔前 | 落笔后 | 新增行坐标 | 读回 |
|---|---|---|---|---|---|
| 1 | `docs/core/design/prompts/common.md` | 126 | **127** | :6 | ✓ |
| 2 | `thincoder-core/prompts/common.md` | 168 | **169** | :7 | ✓ |
| 3 | `docs/core/design/prompts/persona-engineering.md` | 191 | **192** | :88 | ✓ |
| 4 | `thincoder-core/prompts/persona-engineering.md` | 191 | **192** | :89 | ✓ |
| 5 | `docs/core/design/prompts/discipline-engineering.md` | 170 | **171** | :162（另 :151 / :152 两处改写） | ✓ |
| 6 | `thincoder-core/prompts/discipline-engineering.md` | 178 | **179** | :170（另 :158 / :159 两处改写） | ✓ |

**机检读数（复跑 · 一次性比对）**：

- **一次性比对（落地档 ↔ §2.3 围栏块）**：6/6 逐字全等（byte-exact——含标点 / `⇒` / `~~` 全同）；表头 ∥ 计数句 4/4 与围栏块「⇒ 后」形全等。
- `node scripts/prompt-refs-check.mjs`：提示词面 84 档 · 代码面 409 档 · **命中 0**（OK——J1/J2/J3 三式零命中）。
- `node scripts/doc-check.mjs --root <仓根>`：**六档零新增行**（无 ✗ 行落到本批六档；列报中 prompts 相关行皆既有「报告面 · 不入闸」行——`common.md:73` / `persona-engineering.md:100` 等，非本批新增）；总数读数受并发写者扰动（as-of 三读：悬空 121 → 110 → 102 ∥ 行宽 107 → 106 → 105），非本批所致。
- **行宽**：CN 新行 125 ∥ 39 ∥ 142 字符（**≤300** ✓）；EN 新行 388 ∥ 389 字符（EN 面无宽度门——同档既有 >300 行各 8 ∥ 28 ∥ 21 行，形态一致）。
- **`##` 块计数**：14 ∥ 14 ∥ 16 ∥ 17 ∥ 8 ∥ 8——**前后零变（零新增）** ✓。

**决策透明表**：

| # | 决策 | 依据 / 理由 |
|---|---|---|
| 1 | persona 新行按围栏块原样落（**无 2 空格缩进**） | 验收 = 「与围栏块逐字全等」；邻行为缩进续行——如实披露，如需缩进 = 设计侧裁定（本轮零自创） |
| 2 | 表头替换用最小 token（`D7）`⇒`D8）` ∥ `D7)`⇒`D8)`） | 避免重打 en dash（U+2013——现文与围栏块同码位）；替换后逐字核对通过 |
| 3 | EN 面 = **M9 翻译回写**（围栏块 EN 稿逐字落，非 cp） | 派单口径 |
| 4 | 六档外零改动 | 设计档 ∥ 需求档 ∥ 批档 §1–§4 ∥ #818 批档零写；产品码零触 |

**边界声明**：新行零文档引用（refs-check 复核在案）· 零 `##` 新增 · D1–D7 行语义零改 · 既有条款零改。

**审计 / 代码评审轮次与终态**：见下段（进行中）。

**审计 / 代码评审轮次与终态**：

- **内部偏离审计（explore 子代 · 只读）轮次 1**：结论 **CLEAN**——① 逐字复算 10 处落点全等（含 en dash ∥ `⇒` ∥ `~~`）；② 完整性（六档 + 设计三档 + 需求三面在盘）；③ 偏离扫描：未实现 0 ∥ 静默简化 0 ∥ 越界 0（三串新文本全仓检索仅命中预期档位；两 prompt 目录本轮被写文件恰六档）；④ 与设计档三处（`PROMPT-SYSTEM.md` §6.13 ∥ `LIGHT-CHANNEL.md` K14 ∥ `DOC-DISCIPLINE.md` D8 块）语义一致、零冲突；⑤ 表外改动：未发现。**发现 = 2 🔵（均六档之外）**：批档 §2.4:107 ∥ §2.7:135 记录面过时陈述（归属 §2/§6）+ `requirements/PROMPT-SYSTEM.md:103` 字面自引用（主 agent 域）——照实记录、本轮零动作。限制如实声明：审计装配无 execute/bash——脚本级机检以正则近似替代（两 prompt 目录 32 档 J1/J2/J3 近似复扫 0 命中，与实跑一致）。
- **advisor 代码评审（type=code）轮次 1**：**VERDICT pass**（🔴 0 ∥ 🟡 1 ∥ 🔵 1 + 核验记录 + 范围外注记 2）。**响应表**：

| # | Action | Detail |
|---|---|---|
| 1 | Deferred | 🟡 persona 新行零缩进（按围栏块逐字落——邻行为缩进续行）——裁定权 = 设计面（围栏 §2.3-B4/B5 ∥ 设计档落点句）；本轮零自创、已披露（本段决策表 #1）；若裁缩进 ⇒ 设计侧裁定后双面同笔（非本实施轮面） |
| 2 | Not an issue | 🔵 D8 同面重复（common 详述 ∥ 清单位行）——#814 裁定「同步」内（KD-3 ∥ D-PS16：清单行 = 同族行式）+ 提示词面禁带文档引用（无「只引用不重述」形态可用）⇒ 非缺陷；记录为可选优化 |

- **评审核验记录（非发现项）**：逐字全等 6/6 ∥ 表头 ∥ 计数句 4/4 ∥ 坐标与行数（127 ∥ 169 ∥ 192 ∥ 192 ∥ 171 ∥ 179）全同 ∥ D3 残句仅存归档面 ∥ 跨面计数（需求侧 D1–D8 已在盘）无并存 ∥ 机检口径核（refs 判据式 ∥ doc-check 域与行宽——CN 新行 125 ∥ 39 ∥ 142 ≤300、EN 不在扫描域）∥ 需求面回指三处同源。未核（如实）：D1–D7 行零改 = 行坐标算术旁证（追加式自洽），无逐字 diff 基线（评审装配无 git 工具）。
- **fix round**：**0**（两轮均无 must-fix；🟡/🔵 均非本轮可修面——裁定权归设计面 / 主 agent 域）。
- **终态：clean**（审计 CLEAN + 评审 pass；0 🔴 · 0 fix 轮；上抛/在场记录 = 2 🔵 六档外面，供 §6 与父侧处置）。

## §6 验证与收口（父代理）

**§6 验证与收口（2026-10-02 20:0x · 父侧）**

**核读**：六档落笔 = 父侧逐处实读相符（`:6` ∥ `:7` ∥ `:88` ∥ `:89` ∥ `:151/:152/:162` ∥ `:158/:159/:170`）；读数 = **127 ∥ 169 ∥ 192 ∥ 192 ∥ 171 ∥ 179**（内容行口径）。CN 新行 ≤300 ✓（125 ∥ 39 ∥ 142）；零 `##` 新增 ✓。

**复跑**：`prompt-refs-check` = **命中 0（OK）**（父侧亲跑）；一次性比对 = **6/6 逐字全等**（实施舱实跑——审计 CLEAN 复核）；行宽 ∥ 块计数前后零变。门读数（as-of 浮动——并发写者在飞）：悬空 **93** ∥ 行宽 **98**（多批并行面；本批六档零新增 ✗）。

**评审处置**：代码评审 🟡1 = **保持现状**（围栏块逐字优先——父裁）∥ 🔵1 = 非缺陷；审计轮 1 = CLEAN ∥ **fix round = 0** ∥ 终态 **clean**。

**结算**：**收口（2026-10-02）**——记录冻结；台账 **#800 ∥ #727 ∥ #814 核销**；**凭证链终态消费 ✓**（designId 值不落档）。真机面 = 无（提示词面——运行期随装配生效；用户面核 = 下轮对话自然视检）。
