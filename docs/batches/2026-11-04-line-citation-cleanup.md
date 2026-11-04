# 2026-11-04 · line-citation-cleanup
> 六段，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 每段只有一个作者：作者的段可 `append` 加内容、可就地改（`edit`，§4.19）；非作者一概拒。
> 编制：主 agent · 2026-11-04 · 来源 = 用户 2026-11-04 18:27「哎，说了多少次，不能用行号做引用，我们还有用行号做引用吗？」。
> 台账 = #2037（docs · 归批）。前情 = docs/batches/2026-11-04-timer-marker-text.md（已收口 2026-11-04）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-11-04
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

## 已定决定

- **已定决定**：**当前不清理存量行号引用**（全仓存量清账不是现在做的事）；改为**把这条要求交给评审门**——评审时检查行号引用。 · 用户原话：「我现在不着急清旧账，我是觉得应该把这个要求交给advisor，让他评审的时候检查一下。」 · 时间：2026-11-04 18:30
- **已定决定**：行号不得作引用（本轮更早的裁定，逐字）：「哎，说了多少次，不能用行号做引用，我们还有用行号做引用吗？」 · 时间：2026-11-04 18:27

## 现场实读（开工前定位）

- **项目自定的评审判据档不存在**（`.thincoder/` 下现只有交付清单与若干 tmp 日志）⇒ advisor 当前只用内置默认判据，项目自定判据一条都没注入过。落点 = 新建 `.thincoder/advisor.md`。
- **成文约定与用户裁定冲突**：`docs/vsc/design/VSC-MIGRATION.md` §1.3 引-3 明写「代码坐标 = 仓根相对路径 + `:行`」。**不改这条，评审判据立了也会被下一个人照约定写回来。**
- **存量规模**：`docs/` 全域 26,454 处行号引用 / 419 档；本批动过的三档 = `docs/cli/design/TUI.md` 72 ∥ `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` 128 ∥ `docs/vsc/design/WEBVIEW-PROTOCOL.md` 319。
- **真实代价已抽验**：`docs/vsc/design/WEBVIEW-PROTOCOL.md` §12 抽三处，一处（`thincoder-vscode/webview/chat-messages.js` 的第 102 行）现指向一个孤立 `}`——行号漂移不报错，读者照空壳读。
- **无产出脚本**：全仓扫描确认没有任何脚本生成 `docs/vsc/design/WEBVIEW-PROTOCOL.md` 的 §12/§13 对表（此前我猜「可能是脚本产出」，查实为错，是手写表）。

## 本批范围（三件）

1. **L1 · 清掉上一批自己引入的行号引用**：`2026-11-04-timer-marker-text` 那批在设计档与协议档新写进去的几处（处数以该提交 diff 实读为准，不写估算数）——自己刚犯的不能留着。
2. **L2 · advisor 设计评审提示词加第 13 条判据**：落点 = `thincoder-core/prompts/advisor-design.md` 的 `## Review Criteria`（现 12 条，加第 13 条）；设计面 = `docs/core/design/ADVISOR-GUARDS.md` §3.1；判据正文见本节「提示词正文」块（父侧定稿，实施席逐字照抄）。
3. **L3 · 修成文约定的自相矛盾**：`docs/vsc/design/VSC-MIGRATION.md` §1.3 引-3 的「形态」格改「仓根相对路径 + 符号名」——它现在写的是「路径 + `:行`」，与 `docs/core/design/DOC-DISCIPLINE.md` §1 D4 细则「路径后面不接行号」正面相反；不改，第 13 条立了也会被照约定写回来。

## 落点更正（用户 18:32 澄清）

- **用户原话**：「我不是这意思，我的意思是改advisor的提示词，让它检查这个。」 · 时间：2026-11-04 18:32
- **落点 = 评审判据清单本身**，不是项目侧配置文件：`thincoder-core/prompts/advisor-design.md` 的 `## Review Criteria` 现列 12 条，新增第 13 条。（`advisor-round1/2/3.md` 是流程与判定，不含判据清单，不动。）

## 提示词正文（父侧定稿 · 实施席逐字照抄，不得改写措辞）

**提示词是产品码**：里面不许出现本项目的路径、目录约定或档名——那些是项目自己的规则，住项目档，随使用者的仓而定。所以第 13 条只讲通用原理，不带任何例外清单。

```text
13. **Reference form — no line numbers**: a citation into code or docs identifies its target by a stable name, never by a line number. `path:123` and `line 123` both drift the moment a line is inserted above, and the drift is silent — the reader lands on an unrelated line and cannot tell. Name the symbol (function / constant / field / message / section heading); when no symbol exists, name the file together with the section heading that owns it.
```

**项目自己的细则不进提示词**：本项目对归档档、对当次命令输出这类情形的处置，不住提示词——**第 13 条对被审档一律同判，不设例外**；项目若给某一类另立规则，那是项目标准档的事，与产品提示词无关。

**为什么不分本轮/存量**：`docs/core/design/DOC-DISCIPLINE.md` D4 细则原文写死「存量同属违规——写进档的行号引用不论哪一轮写下的都受这条约束，不得以『存量／入基线』申请合规地位」，清法 = 分批推进。**评审只管判，清账的节奏归用户的会话安排。**（我先前把用户 18:30 的「不着急」误读成评审判据要分档，已按 18:33 的原话改正。）

## 评审轮 1 裁定与派单（父侧 · 2026-11-04 19:03）

结论 `changes-required`（🔴 1 · 🟡 6 · 🔵 2），九条**全接受**，逐条处置如下。设计席按 #1–#7 修，修完回写 §2 并复述读数。

| # | 裁定 | 要求 |
|---|---|---|
| 1 🔴 | 接受 | **AC3 恒红**：它量的是修复前的提交，那批 `^+` 行永不变。改成**对当前档面**的量法——以 §5 逐处清单为清单，逐处回读现盘该行 / 该格不再出现坐标；AC3 里的 `<该提交>` 占位写死指向，不留给实施席判。 |
| 2 🟡 | 接受 | 三档写死：档集改为「该提交改动的档全集」的读数（`git show --name-only`），或注明三档来历可复跑。 |
| 3 🟡 | 接受 | 续行缩进两处相反（§3.1「3 空格」∥ §2.4「4 空格」∥ §3.1 围栏块是 4）：**统一 4 空格**，删掉「3 空格」那句；「与 2–12 条同形」改「与 10–12 条同形」。 |
| 4 🟡 | 接受 | C4 把归档档处置推给 `docs/core/design/DOC-DISCIPLINE.md` §1 D4 细则，可那里只有清账口径（域 ∥ 围栏），没有「这种情形判不判」的判据句。**删掉「项目标准档另有处置」这句断言**，如实写成「无例外、被审档一律同判」；C5 的围栏一形同法处理（围栏是命令字面，按清账口径不计数，但不是免判）。 |
| 5 🟡 | 接受 | 第 13 条正文三份：§1 两份逐字相同 ＋ §3.1 一份，而 §2.2 写「唯一副本」。**§1 留一份即可**（父侧改），§2.2 的断言随 §1 一处成立。 |
| 6 🟡 | 接受 | §2.5 处置表与 D4 五种落法不同套：补 D4 有而表里缺的两类（数据档键 ⇒ 键名路径 + 所在节；同档自指 ⇒ 节名 + 逐字引文），并把「引文内坐标」标成规则而非落法。 |
| 7 🟡 | 接受 | §10 验收总表补一行（回指「参照形态判据（提示词第 13 条）」），或把 AC13-* 并进 A-AG 序列——取其一。 |
| 8 🔵 | 接受 | publicRepos 读数强度统一（§7 写实读、§3.1 写 unverified）——取一个口径，全档同。 |
| 9 🔵 | 接受 | AC6 全档 `>300 行 = 0` 补基线读数（实施轮首动作前复测），或改判「不增加」。 |

**本轮不做**（明确划出，防顺手扩）：不改 `thincoder-core/prompts/advisor-design.md`（实施席的笔）、不改规则本体（只引不改——#4 的处置是删断言而非给规则档加判据）、不清任何存量坐标、不动 §1 的已定决定段。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（评审轮 1 九条已逐条处置（#1–#7 派单内；#8/#9 落在本席笔域，一并落）：AC3 改对当前档面量 ∥ 档集改命令读数 ∥ 续行统一 4 空格 ∥ C4/C5 改「无例外同判」∥ 唯一副本改「规范单源 + 批档一次性转载」∥ §2.5 对齐 D4 五法 ∥ §10 补 A-AG28 ∥ publicRepos 统一实读 ∥ AC6 改「不增加」）


### 2.1 本批条目（覆盖）

用户裁定三条（§1 已定决定逐字）：18:27「哎，说了多少次，不能用行号做引用，我们还有用行号做引用吗？」⇒ 行号不得作引用；18:30「我现在不着急清旧账，我是觉得应该把这个要求交给advisor，让他评审的时候检查一下。」⇒ 不清旧账，交给评审门；18:32「我不是这意思，我的意思是改advisor的提示词，让它检查这个。」⇒ 落点是提示词。三件：

| 编号 | 条目 | 判据 |
|---|---|---|
| L1 | 清掉上一批（`2026-11-04-timer-marker-text`）自己引入的行号坐标——自己刚犯的不留 | 射程档（`git show --name-only 3cb41a64` 的读数，见 §2.3）按逐处清单逐处回读现盘 ⇒ 坐标残留 **0 处**（量法见 2.7 AC3） |
| L2 | 把「行号不作引用、坐标写符号名」立成**设计评审提示词第 13 条**（`thincoder-core/prompts/advisor-design.md` 的 `## Review Criteria`） | 第 13 条逐字块在盘（规范单源 = `docs/core/design/ADVISOR-GUARDS.md` §3.1）∧ 该节整数编号条数 = 13（量法见 2.7 AC1 ∥ AC2） |
| L3 | 修 `docs/vsc/design/VSC-MIGRATION.md` §1.3 引-3 与 D4 细则的矛盾——该行把「仓根相对路径 + `:行`」写成规定形 | 该行「形态」格不再出现「+ `:行`」形，改为符号名形（量法见 2.7 AC8） |

依据 `docs/core/design/DOC-DISCIPLINE.md`「行号一律不作引用形态（强制 · 无例外）」。

**为什么三件一起**：只清 L1，下一批照写；只立 L2，用户眼前的错还留着；只做 L1 + L2，成文约定仍把行号写成规定形，下一个照约定写作的人照样写回来。三件是同一笔账的三个面：**清手边 · 立判据 · 拆回潮源**。

### 2.2 设计档落点

**无新增设计档。** L2 的机制设计住 `docs/core/design/ADVISOR-GUARDS.md` §3.1（新设小节：参照形态判据——设计评审提示词第 13 条）。提示词正文的**规范单源** = 该节围栏块；批档 §1 的定稿块是同一份的一次性转载（批档收口可整档删除 ⇒ 不成第二真源），实施席逐字照 §3.1 落。

判据本体的规范来源 = `docs/core/design/DOC-DISCIPLINE.md` §1 D4 细则（D2 单源——`docs/core/design/ADVISOR-GUARDS.md` §3.1 与本节都不复述其语义，只引）。

L1 的换形落法住本批 §2.5（逐类处置表 + 四条不许），不另立设计档：它是对既有规则的一次执行，不是新机制。

**为什么不落项目侧判据档（`.thincoder/advisor.md`）**：用户 18:32 逐字把落点定在提示词；且项目侧档按 cwd 命中，换一个 cwd 就失效，而提示词随产品走。

本席实读的注入面：`thincoder-core/advisor/history.mjs` 的 `loadAdvisorMd(cwd)` 读 `cwd/.thincoder/advisor.md`，读不到才回落 `DEFAULT_CRITERIA`；`thincoder-core/advisor/messages.mjs` 把它作为**用户消息**里的 `## Review Criteria` 块推进——它不取代提示词，也不保证在场。

### 2.3 L1 清账射程（上一批自引入的那几处）

**射程 = 上一批提交 `3cb41a64` 的 diff 里的新增 / 改动行**，不按支、不按面扩：射程内非本批落笔处的坐标一处不动。

- **档集 = 命令读数（可复跑）**：`git show --name-only 3cb41a64` ⇒ 七档——`docs/cli/requirements/TUI.md` ∥ `docs/cli/design/TUI.md` ∥ `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` ∥ `docs/vsc/design/WEBVIEW-PROTOCOL.md` ∥ 前情批档 ∥ 两档产品码。扣批档（一次性过程档，`docs/core/design/DOC-DISCIPLINE.md` §1 D4「域与围栏」：域 = 跟踪面 `*.md`，扣 `docs/batches/**`）与两档产品码（代码面，零笔）⇒ **射程 = 四档文档**。
- **逐处清单的取法** = `git show 3cb41a64 --unified=0 -- docs/` 只取 `^+` 行，跑 2.7 AC7 的抽取式。本席 2026-11-04 复跑读数 = 两档命中：`docs/cli/design/TUI.md` 四行（坐标五处）∥ `docs/vsc/design/WEBVIEW-PROTOCOL.md` 一行（一处，行内另带 `:84` 一类承名坐标）；`docs/core/design/AGENT-LOOP-ASYNC-POOL.md` ∥ `docs/cli/requirements/TUI.md` 的 `^+` 行零坐标。
- **实施轮复跑同一命令补全**：承名坐标（一个档名带多个号，如 `:84` ∥ `:62` ∥ `:51-60`）按 `docs/core/design/DOC-DISCIPLINE.md` §1 D4「续接形」逐号计作多处；逐处清单与处数以 §5 读数为准，本档读数只作初版清单。

### 2.4 L2 判据设计（要点；机制全文 = `docs/core/design/ADVISOR-GUARDS.md` §3.1）

1. **形态**：行号不作引用——指规则 / 判据 ⇒ 档名 + 节名 + 逐字引文；指代码件里的东西 ⇒ 符号名；读数 ⇒ 量法 + 量取日期。
2. **一个问句，不分档**：只问被审文档里有没有行号引用——没有「本轮新增 / 存量」两档，没有计数汇总行。依据 `docs/core/design/DOC-DISCIPLINE.md`「存量同属违规」：判据面没有可申请豁免的存量，清账快慢是排期。
3. **提示词不带例外清单，判据本身无例外**：第 13 条只讲通用原理——项目自己的路径 / 目录约定 / 档名一律不进产品提示词（提示词随产品走，规则随使用者的仓而定）。判据面不给任何一档开口子：项目归档档里有行号引用照报；引一段命令输出里自带的 `file:line` 是引文字面（逐字不动、不计入清账面），但照报。
4. **与既有两句不同轴**：提示词 `## Your role` 第 2 条与 `## Citation Discipline` 管评审席**自己**怎么写引用；第 13 条管**被审文档**里的引用形态——既有两句一字不动。
5. **严重度不新造**：第 13 条不指定 🔴/🟡 档位，沿用提示词既有的严重度定义表。
6. **落点**：`thincoder-core/prompts/advisor-design.md` 的 `## Review Criteria` 节末（第 12 条之后、`## Output Format` 之前），编号 `13.`，续行 **4 空格**（对齐 `N. ` 之后的文字——与 10–12 条同形）。

**提示词正文** = §1 定稿逐字，规范单源 = `docs/core/design/ADVISOR-GUARDS.md` §3.1 围栏块（§1 的块是同一份的一次性转载，批档收口可整档删除）。实施轮逐行照落：不改写措辞、不合并成一行（提示词面逐行判据每行 300 字符，拆点只落在句边界，句内文字一字不动）。

### 2.4′ L3 约定行改形（`docs/vsc/design/VSC-MIGRATION.md` §1.3 引-3）

现状 = 该行的「形态」格把「仓根相对路径 + `:行`」写成**规定形**，与用户 18:27 令、与 `docs/core/design/DOC-DISCIPLINE.md` §1 D4 细则直接相反（§1 现场实读第 2 条同读）。

**为什么同批修**：这一行是成文约定里的规定形。不改它，第 13 条立了，下一个照约定写作的人照样写回来。依据 `docs/core/design/DOC-DISCIPLINE.md`「行号一律不作引用形态（强制 · 无例外）」——约定档与规则档相反，改约定档，不动规则档。

**改形目标（逐字——实施轮照落该行两格）**：

| # | 被引对象 | 形态 | 机检行为 |
|---|---|---|---|
| **引-3** | 代码坐标 | 仓根相对路径 + **符号名**（函数 / 常量 / 导出名；不写行号） | V5-A 按仓根解析（`resolveFile` 候选①）——产品树相对写法迁出后即失效，故一律改写；行号不作引用形态（路径后不接行号，读数写量法与日期） |

**一处一改，其余不动**：本席本轮扫该档的 `:行` / 行号 / 坐标 ⇒ 仅引-3 一行命中；该行外零改。

### 2.5 换形怎么落（L1 / L3 逐处用；逐类处置，不新造第六种）

| 对象类（`docs/core/design/DOC-DISCIPLINE.md` §1 D4 的四类 → 五法） | 落法 | 本批实例形态 |
|---|---|---|
| 规则 / 判据 / 约束 | **档名 + 节名 + 逐字引文** | 会话流镜像分支那条：坐标删掉，句内 `startsWith("[System reminder:")` 的逐字引文即定位物（档名与节名随句在位） |
| 代码件里的东西（函数 / 常量 / 导出名；表内「发点 / 消费点」格同判这一列） | **符号名**（留仓根全路径，删坐标尾）；无符号名可指 ⇒ 删坐标留档名 | 某档的行号坐标 ⇒ 该档的 `buildStatusLine`；协议档 §3.2 ∥ §6.1 的 timer 行落这一列（`postStatusText` 一类） |
| 报一个量（宽度 / 处数 / 行数） | **量法 + 量取日期** | 「文字形宽于符号形 5 显示列」⇒ 补量法（`stringWidth` 直算）与量取日期 |
| 数据档 / 配置档里的一个键 | **键名路径 + 所在节** | 射程内本席读数零命中；实施轮复跑若遇上该类，照此列落 |
| 同档自指 | **节名 + 逐字引文**（档名可省） | 同上：射程内零命中，备而不用 |

**引文内坐标不是第六种落法，是一条规则**：被引对象自述句里带的号是引文的字面 ⇒ 逐字不动（`docs/core/design/DOC-DISCIPLINE.md` §1 D4「引文内坐标照引」）；射程内遇上就照此不动，并逐处登记 §5。

**四条不许**：① 不许**改指**（把坐标从一档换到另一档的行号——依据同档「改指不等于换形」）；② 不许**按位移重算**行号；③ 不许顺手改语义（换形 = 减法，句内其余逐字不变）；④ 不许新增任何坐标。

**元陈述照写**：句子在说「这一面有行号引用正在清」「该行现在多长」时，「行号」「坐标」这些词照写，但不带具体坐标（依据同档「提到 ≠ 引用」及其后一句）。

### 2.6 受影响文件与测试覆盖

| 档 | 面 | 本批动作 | 笔权 |
|---|---|---|---|
| `thincoder-core/prompts/advisor-design.md` | 产品代码面（提示词档） | `## Review Criteria` 节末加第 13 条（逐行照落规范单源 = `docs/core/design/ADVISOR-GUARDS.md` §3.1 围栏块） | eng-coder |
| `docs/core/design/ADVISOR-GUARDS.md` | 设计档 | §3.1 新设小节（已落） | eng-designer |
| `docs/vsc/design/VSC-MIGRATION.md` | 设计档 | §1.3 引-3 两格改形（§2.4′） | eng-designer |
| `docs/cli/design/TUI.md` ∥ `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` ∥ `docs/vsc/design/WEBVIEW-PROTOCOL.md` | 设计档 | L1 逐处换形（射程 = §2.3；三档是本席读数里进改动面的档，射程第四档 `docs/cli/requirements/TUI.md` 零命中不改） | eng-designer |

**tier 结论**：零源档、零测试档——六档全在文档与提示词面；提示词档是 `.md` 文本档，评审维度 8 对纯 `.md` 豁免分层判 ⇒ **无档跨层，无拆单**。

**测试覆盖**：本改动没有可跑的业务面（判据文本 + 文档换形）⇒ 不建单元测试档。判据 = §2.7 的机检行与 `doc_check` 读数，实施轮实跑并把命令与结果记 §5。

### 2.7 验收对照（逐条回指 L1 / L2 / L3）

| # | 判据 | 量法（可复现） | 回指 |
|---|---|---|---|
| AC1 | L2 落地块逐行相等 | `node` 逐行 `===`：提示词落地块与 `docs/core/design/ADVISOR-GUARDS.md` §3.1 围栏块整行相等（首末行含） | L2 |
| AC2 | L2 编号与位置 | 节切（`## Review Criteria` 起、至下一个 `^## ` 止）内 `^[0-9]+\. \*\*` 计数 = **13**（`6b.` 不占整数编号）；第 13 条在 `## Output Format` 之前 | L2 |
| AC3 | L1 当前档面零残留 | 以 §5 逐处清单为清单（初版 = §2.3 本席读数；实施轮复跑 `git show 3cb41a64 --unified=0 -- docs/` 补全），逐处取该处的坐标字面（`档名:行` ∥ 承名形 `:行`）在现盘该档全文 `includes` ⇒ **命中 0**；命中逐处点名档 + 命中行首 40 字 | L1 |
| AC4 | L1 除坐标片段外正文逐字不变 | 逐档 diff 人判：每个 hunk 只含坐标删除 / 换符号名片段；逐处落法登记 §5 | L1 |
| AC5 | L2 分档未回来 | 落地块扫 `pre-existing` ∥ `one count line` ∥ `the round did not touch` ⇒ **0** | L2 |
| AC6 | 提示词面行宽 | 落地块逐行 ≤300；`thincoder-core/prompts/advisor-design.md` 的 `>300` 行数 = 基线读数（实施轮首动作前复测，记 §5），判据 = 实施后**不增加** | L2 |
| AC7 | 全批零新增坐标 | `git diff` 的 `^+` 行内行号坐标 = **0**。抽取式 = 档名 token（`…/x.md`、`…/x.mjs` 一类，后接 `:` 加数字）与行号（`:` 紧跟数字，可带 `-` 区间）两个正则，命中即点名 | L1 L2 L3 |
| AC8 | L3 约定行改形 | `docs/vsc/design/VSC-MIGRATION.md` 引-3 行的「形态」格不含「+ `:行`」形、含「符号名」；该档扫 `:行` ⇒ **0** | L3 |
| AC9 | 引文内坐标零动 | 被引对象自述句内的坐标逐字保留（与 §5 登记对照） | L1 |
| AC10 | 文档门 | `doc_check({mode:"gate", docs:[§2.6 六档]})` 首行 `PASS` | L1 L2 L3 |

AC3 ∥ AC7 的抽取式（实施轮照跑；逐处清单与读数记 §5，档不落仓）：档名 token = 带扩展名的文件 token（可带目录段），其后紧跟 `:` 与数字即一处；`:` 与数字之间无空白，数字可带 `-` 区间。

### 2.8 关键决策（含否决项）

| # | 决策 | 否决的替代 | 理由 |
|---|---|---|---|
| K1 | 换形，不重锚 | 按位移量把旧号重算成新号 | 号指向位置不指向内容，插一行即全漂；重算 = 同一笔成本再付一次 |
| K2 | L2 落提示词，不落项目侧判据档 | 新建 `.thincoder/advisor.md` 当判据档 | 用户 18:32 逐字「改advisor的提示词，让它检查这个」；且项目侧档按 cwd 命中，换 cwd 即失效，提示词随产品走 |
| K3 | 判据不分「本轮新增 / 存量」 | 存量只报计数（上一轮设计席的写法） | 与 D4 细则直接冲突；依据 `docs/core/design/DOC-DISCIPLINE.md`「存量同属违规」——判据面没有可申请豁免的存量 |
| K4 | 引文内坐标逐字不动 | 连引文一起改 | 改它即改引文，读者与原档对不上（依据同档「引文内坐标照引」） |
| K5 | 不改规则档 `docs/core/design/DOC-DISCIPLINE.md` | 顺手把规则档里的 as-of 坐标一并清 | 规则档是判据的家，本批只引不改；改它即改判据本体，是另一笔 |
| K6 | L3 同批修 | 另开一批 | 不回潮源，第 13 条立了也会被照约定写回来；该行一改一处，边际成本近零 |
| K7 | 不新造严重度 | 给第 13 条指定 🔴 | 第 13 条只给「一处一行」的发现形态；档位由既有体系判，两处并存即两个标准 |

**最近先例**：`docs/core/design/ADVISOR-GUARDS.md` §3「引证形状写作禁则（评审提示词面）」——同一面（评审提示词的引用形态）、同一写法（规范单源住设计面 + 逐字围栏块 + 实施席照落）。对齐 = 两处同形。

偏离 = 第 13 条不取 `docs/core/design/ADVISOR-CONVERGENCE.md` §17 那一族的「设计评审维度」节形（那一族都指向一条义务，第 13 条不新增义务）——理由全文 = `docs/core/design/ADVISOR-GUARDS.md` §3.1。

**既有件三问**：`existing: docs/core/design/DOC-DISCIPLINE.md` §1 D4 细则 · `name:`「行号一律不作引用形态（强制 · 无例外）」· `consumers:` 文档作者 / 设计评审席 / 设计席 ⇒ 判据本体逐字沿用，零新造。

**勘察证据行**（本席本轮实读）：

- 落点与目标面：`thincoder-core/prompts/advisor-design.md` 的 `## Review Criteria` 现 12 个整数编号条 + `6b.` 一条；`docs/vsc/design/VSC-MIGRATION.md` §1.3 扫 `:行` / 行号 / 坐标 ⇒ 仅引-3 一行命中。
- 判据本体：`docs/core/design/DOC-DISCIPLINE.md` §1 D4 细则（两句逐字见 `docs/core/design/ADVISOR-GUARDS.md` §3.1）。
- 注入面：`thincoder-core/advisor/history.mjs` 的 `loadAdvisorMd` 与 `thincoder-core/advisor/messages.mjs` 的判据注入点。
- 公共源：本席 `manifest read` = `state=workspace`（`D:\teamcode` 下辖两项目），未取得仓外声明源列表；本仓 `index.publicRepos` 标 `unverified`（既有设计档同读为 `[]`）。

**数据事实**：本设计对数据无断言（不涉行数 / 枚举 / 字段）。唯一量 = 提示词节内整数编号条数（AC2）与 diff 新增行坐标数（AC3 ∥ AC7），由实施轮实跑取得，非纸面推演。

**分支依据**：本批不新增任何输入 / 状态分支（纯文本判据 + 文档换形）⇒ 无分支表。

### 2.9 边界（本批不做）

- 不清全仓旧账（用户 18:30「我现在不着急清旧账」——清账节奏是排期，不是判据面的事）。
- 射程档内非本批落笔处的坐标一处不动（射程 = §2.3 的命令读数与逐处清单）。
- `docs/core/design/DOC-DISCIPLINE.md` 自身（规则档，本批只引不改）；需求档（主 agent 笔域）；本批档之外的批档（他作者段）。
- 不动 `thincoder-core/prompts/advisor-round1.md` ∥ `thincoder-core/prompts/advisor-round2.md` ∥ `thincoder-core/prompts/advisor-round3.md` ∥ `thincoder-core/prompts/consult-base.md`（第 13 条只进设计评审）。
- 不改 `thincoder-core/advisor/history.mjs` 的 `DEFAULT_CRITERIA`，不新建 `.thincoder/advisor.md`。
- 代码件注释里的坐标、`scripts/**` 的行号读数：代码面，零笔。
- 不新增机检器、不改 `doc_check` 两条判据的语义、不设豁免。

### 2.10 上抛（知会）

**〔上抛·知会〕L1 的处数以 diff 读数为准。** §1 记「约 8 处」，上一轮设计席记「三处 + 两处」；本席 2026-11-04 复跑 `git show 3cb41a64 --unified=0 -- docs/` 得两档命中（命令与明细见 §2.3），仍以实施轮复跑读数为准——逐处清单与处数记 §5。

### 2.11 集成测试差量（`test/RTM.md`）

**破 0 行 · 冗余 0 行 · 缺 0 行。** 理由（两条入口逐条核）：① 不改任何既有用例断言的业务可观察结果——本批是判据文本 + 文档坐标换形，产品行为一字不动；② 未新增业务上真需要的场景——用户报告的问题是真的，但它的可观察结果落在评审输出文本与文档形态上，不在业务结果上。

**近面无涉**：故事 7「收口只判本批改过的档」（本批不新增门、不改段判据）∥ 故事 17「评审没写进批档就不算过」（本批不动评审席的 §3 写入行为）。

### 2.12 落地读数（设计席本条 · 2026-11-04 · L1 ∥ L3 ∥ 条数随动）

**档集复跑**（口径 = §2.3）：

- `git show --name-only 3cb41a64` ⇒ 七档（批档 ∥ 四档文档 ∥ 两档产品码），与本节记载一致。
- `git show 3cb41a64 --unified=0 -- docs/` 的 `^+` 行按 §2.7 末段口径抽取 ⇒ **射程四档命中 2 档 / 5 行 / 8 处坐标**（6 处名形 + 2 处承名形）。
- 两档命中 = `docs/cli/design/TUI.md`（4 行 5 处）∥ `docs/vsc/design/WEBVIEW-PROTOCOL.md`（1 行 3 处，含承名形 `buildStatusLine` `:84` 与 `⏰N` 段 `:62`）。
- 零命中 = `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` ∥ `docs/cli/requirements/TUI.md`（其 `^+` 行不带坐标）。

**逐处换形清单**（落法列 = §2.5；符号名逐处实读在盘）：

| # | 档 | 原形 | 现形 | 落法 |
|---|---|---|---|---|
| 1 | `docs/cli/design/TUI.md` | `async-discard.mjs:55` ∥ `subagent-blocks.mjs:81` | `thincoder-core/agent-tools/async-discard.mjs` 的 `discardable` ∥ `thincoder-cli/src/tui/subagent-blocks.mjs` 的 `ensureSubTaskKey` | 符号名 |
| 2 | 同上 | `subagent-scheduler.mjs:357-359` | `subagent-scheduler.mjs`（函数名 `refreshQueuedTokens` 句内已在） | 删坐标尾留档名 |
| 3 | 同上 | `thincoder-cli/src/tui/tool-events.mjs:448` | `thincoder-cli/src/tui/tool-events.mjs` 的 `onTurnEnd` 回调 | 符号名 |
| 4 | 同上 | `thincoder-cli/src/tui/status-line.mjs:63-64` | `thincoder-cli/src/tui/status-line.mjs`（`statusMax` 句内已在） | 删坐标尾留档名 |
| 5 | `docs/vsc/design/WEBVIEW-PROTOCOL.md` | `status-line.mjs:174`（`buildStatusLine` `:84`） | `thincoder-cli/src/tui/status-line.mjs` 的 `timerHint`（`buildStatusLine` 内） | 符号名 |
| 6 | 同上 | `status-bar.js` `⏰N` 段（`:62` 起） | `status-bar.js` `⏰N` 段 | 删坐标尾留档名 |

**一处旧号已漂（在射程内，随换形一并消解）**：`thincoder-core/agent-tools/async-discard.mjs` 的原坐标 `:55` 落在 `subagentReminderText` 的模板串上。

该句所指的「零新谓词」判据本体，实读在 `discardable`——`entry.done !== true && entry.cancelled !== true && parentAborted(ctx, entry)`。这正是行号静默漂移的实例；换符号名后指对。

**L3 落地**（`docs/vsc/design/VSC-MIGRATION.md` §1.3 引-3）：

- 形态格：由「仓根相对路径 + `:行`（如 `thincoder-vscode/webview/ui.js:445`）」改为「仓根相对路径 + **符号名**（函数 / 常量 / 导出名——如 `thincoder-vscode/webview/ui.js` 的 `<函数名>`；不写行号）」。
- 机检行为格未动。

**条数随动**（`docs/core/design/PROMPT-SYSTEM.md`，§5 上抛一处，本席笔域）：该档引 `thincoder-core/prompts/advisor-design.md` 一行的括注由「设计评审 12 条」改「设计评审 13 条」——第 13 条已在盘（§5 读数），计数按 D3 随动。

**读数（本轮实跑）**：

| 判据 | 量法 | 结果 |
|---|---|---|
| AC3 | 上表 8 处坐标字面在现盘该档全文 `includes` | 命中 **0**（8 个字面逐个 false——6 处名形 + 2 处承名形） |
| AC7 | 本轮 `git diff -U0 -- docs/` 的 `^+` 行按 §2.7 末段口径抽取 | **0** 处（域 = 跟踪面，按 §2.3 扣 `docs/batches/**`；本批档为未跟踪档，不进 `git diff`） |
| AC8 | `docs/vsc/design/VSC-MIGRATION.md` 扫 `:行` | **0**；「符号名」1 命中 |
| AC10 | `doc_check({mode:"gate", docs:[§2.6 六档 + `docs/core/design/PROMPT-SYSTEM.md`]})` | 首行 `DOC-CHECK GATE: PASS` · 0 段命中（7 档全清） |

**AC4 ∥ AC9 的形态核对**：每个 hunk 只含坐标删除或换符号名片段，句内其余逐字不变；引文内坐标（第 13 条正文的 `path:123` ∥ `line 123`）本轮零触。

**射程外一处不动**：射程按 §2.3 定义 = 该提交的 `^+` 行。同档其余坐标（如 `docs/vsc/design/WEBVIEW-PROTOCOL.md` §6.1 表内他行的 `:23` ∥ `:51-60` ∥ `status-bar.js:59-60`）不属本批，一处未动。

## §3 设计评审（评审子代理）
**状态行**：评审通过（轮 2：轮 1 九条全数落定（🔴 1 已修），新发现 🔴 0 · 🟡 2 · 🔵 2）



### 轮次 1（评审子代理）

### 评审轮（设计评审 · 只读）

- **范围**：`docs/core/design/ADVISOR-GUARDS.md` §3.1。
- **范围**：批档 §1–§2；`docs/core/design/DOC-DISCIPLINE.md`（判据本体，只读比对）；`docs/vsc/design/VSC-MIGRATION.md` §1.3。
- **限制（如实登记）**：本轮无「项目标准档」文档 ⇒ 方法论合规按 AGENTS.md 判。
- **限制（如实登记）**：上下文内无 Document Map ⇒ 归属判据降级为「按 AGENTS.md + 评审维度 7 判」。
- **已核通过（不入表）· 分层结论**：§2.6 写「六档全在文档与提示词面」∧「无档跨层，无拆单」；抽验六档均 `.md`，符合维度 8 对纯 `.md` 的豁免。
- **已核通过（不入表）· 先例与勘察**：§2.8 有最近先例行（含偏离理由）∧ 勘察证据行；§3.1 各有一行，含 publicRepos 读数。
- **已核通过（不入表）· 既有件三问**：§2.8 写 `existing: docs/core/design/DOC-DISCIPLINE.md` §1 D4 细则；名称逐字「行号一律不作引用形态（强制 · 无例外）」已在盘。
- **已核通过（不入表）· 分支依据**：两处均声明本批不新增输入 / 状态分支，无分支表；与改动面（纯文本判据 + 文档换形）相符。
- **已核通过（不入表）· 集成差量**：§2.11 与 §3.1 各给「破 0 行 · 冗余 0 行 · 缺 0 行」，用允许的那一条理由，并点名近面故事。
- **已核通过（不入表）· 验收不含全量套件**：§2.6 写「本改动没有可跑的业务面 ⇒ 不建单元测试档」，改判 `doc_check` 读数。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Acceptance | 🔴 | L1 的完整性判据 AC3 指向修复前的提交，恒红。§2.3 定义「**射程 = 上一批提交 `3cb41a64` 对三档的 diff 里的新增 / 改动行**」，AC3 则量「`git show <该提交>` 对三档的 diff，只取 `^+` 行，跑 AC7 的抽取式 ⇒ 命中 **0**」。该提交的 `^+` 行是历史记录，本批把坐标改掉也一字不变 ⇒ 命中恒 >0。换成另一读法（`<该提交>` = 本批提交）则与 AC7「`git diff` 的 `^+` 行内行号坐标 = **0**」重合，只量「新写的坐标为零」而不量「该清掉的清干净没有」。AC4 只判 hunk 形态、AC7 只判新增、AC9 只判引文内坐标 ⇒ L1 的「自己刚犯的不留」没有一条能真量到的验收。 | 把 L1 的完整性判据改成对**当前档面**的量法：以 §5 逐处清单（该提交 diff 的点名处）为清单，逐处回读现盘那一行 / 那一格不再出现坐标；并把 AC3 里 `<该提交>` 这个占位写死指向（上一批提交 ∥ 本批提交），不留给实施席判。 |
| 2 | Requirements coverage | 🟡 | L1 的档集写死三档，验收只量这三档。§2.3 写「**三档** = `docs/cli/design/TUI.md` ∥ `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` ∥ `docs/vsc/design/WEBVIEW-PROTOCOL.md`（§1 现场实读所点，按上一批提交的落笔面）」，AC3 亦写「对三档的 diff」。若上一批提交在第四档也落了坐标，L1 与 AC3 都看不见，无一判据会报。 | 档集改成「该提交改动的档全集」的读数（`git show --name-only`）而不是三档字面；或把三档的来历写成该命令的读数并注明可复跑。 |
| 3 | Clarity | 🟡 | 同一件事（第 13 条落笔的续行缩进）两处说法相反。`docs/core/design/ADVISOR-GUARDS.md` §3.1 写「编号 `13.`，条目内续行 3 空格、与 2–12 条同形」；批档 §2.4 写「续行 **4 空格**（对齐 `N. ` 之后的文字——与 10–12 条同形）」。§3.1 自己的围栏块是 4 空格（「    `path:123` and `line 123` both drift」）⇒ 设计档内部，以及设计档↔批档，两处都不一致；实施席被要求「逐字照抄、不得改写措辞」，手上却是两个值。 | 统一为 4 空格（与围栏块及 AC1 ∥ AC13-1 的整行相等一致），删掉 §3.1 那句「3 空格」；同形范围改写「10–12 条」（2–9 条是一位数编号，缩进本就不同）。 |
| 4 | Requirements coverage | 🟡 | 第 13 条按训示不带例外清单，项目内两类处置被指给 D4 细则，可那一处没有对应判据。§3.1 C4 写「被审档是项目归档档，项目标准档对它另有处置…明细按项目标准档判（`docs/core/design/DOC-DISCIPLINE.md` §1 D4 细则）」。D4 细则可查到的只有清账口径：「**域与围栏**：域 = 本仓跟踪面 `*.md`，扣 `docs/batches/**`（一次性过程档）· `**/_archive/**` 与两参照历史树（只读红线）」与「**围栏内不计入清账面**」。两句说的都是「清账面怎么算」，不是「这种情形还判不判」⇒ 评审席照第 13 条读到归档档里的 `path:123`，规则面给不出答案（C5 的围栏一形同理，只有清账口径兜，没有判据句）。 | 二者取一：把这两类在 D4 细则落成明确判据句（判 ∥ 不判、判什么）；或删掉「项目标准档另有处置」这句断言，改成如实登记「无例外、归档档同判」，并在提示词面之外给出处置。 |
| 5 | Document ownership | 🟡 | 第 13 条正文在同一批里出现三份，与 §2.2 的断言相反。批档 §1 的两个 `text` 围栏块逐字相同（仅中间隔一段「项目自己的细则不进提示词」的说明），加 §3.1 围栏块共三份；而 §2.2 写「提示词正文的**唯一副本**也在该节围栏块」。日后只改一处即成两处相反描述（D2）。 | 批档 §1 保留一份（或两份都删、只留指针指 §3.1），使「唯一副本」这句成立。 |
| 6 | Clarity | 🟡 | §2.5 标题写「L1 / L3 逐处用；逐类处置，**不新造第六种**」，但表里的对象类与 `docs/core/design/DOC-DISCIPLINE.md` §1 D4 细则的五种落法不是同一套划分。表里多了「代码件里的一句话 / 一个判据字面 ⇒ **删坐标，句内已有的判据字面即定位物**」「表内「发点 / 消费点」格的坐标」「被引对象自述句里的坐标（引文内）」三类（末一类是规则，不是落法）；而 D4 细则五法里的「指数据档 / 配置档里的一个键 ⇒ **键名路径 + 所在节**」与「**同档自指** ⇒ **节名 + 逐字引文**」在表里没有行。若上一批的某处坐标属后两类，实施席没有落法可依。 | 表按 D4 五法逐行对齐（缺的两类补上）；或明写「本表 = D4 五法在本批落笔面的实例化，另有两类对象 D4 未覆盖」并登记覆盖差。 |
| 7 | Clarity | 🟡 | 新机制的验收只住在 §3.1（AC13-1…AC13-6），该档验收总表 `## 10. 验收标准（逐条回指需求）` 内没有它的行。A-AG1…A-AG27 逐条对得上 §1.1 ∥ §2.6 ∥ §2.7 ∥ §12 等节，唯独新增的 §3.1 不在册 ⇒ 同一档出现两套验收编号，查 §10 的人看不到第 13 条怎么验收。 | §10 补一行（回指写「参照形态判据（提示词第 13 条）」）；或把 AC13-* 并进 §10 的 A-AG 序列。 |
| 8 | Note | 🔵 | 同一档内 publicRepos 的读数强度不一致。§7 写「`PROJECT-MANIFEST.json` 的 `index.publicRepos` = `[]`（实读）」；新增 §3.1 勘察证据行写「本仓 `index.publicRepos` 本席未逐档实读 ⇒ 该条标 `unverified`，既有设计档同读为 `[]`」⇒ 读者判不出公开源到底查过没有。 | 两处取一个口径（都实读 ∥ 都标 unverified），与别的节同步。 |
| 9 | Note | 🔵 | AC6 写「提示词面行宽 \| 落地块逐行 ≤300；该档 `>300` 行 = **0**」——全档断言，设计未记该档基线读数。若该档现有一行 >300，这条与本题无关的红会让实施轮卡住。同类判据在同项目的写法是先取基线：`docs/core/design/DOC-DISCIPLINE.md` 写「基线 = 实施轮首动作前复测」。 | 记一次基线（实施轮首动作前跑一遍）；判据写「>300 行不增加」，或「= 0（基线已复测为 0）」。 |

- **计数**：🔴 1 · 🟡 6 · 🔵 2 = 9 项。
- **结论**：L2 的判据正文与训示一致（纯产品级、无项目例外清单）；机制落点、先例行、勘察行、分层结论、集成差量均可接受。阻断项只有第 1 条——L1 的完整性没有一条能真的量到的验收。

VERDICT: changes-required

### 轮次 2（评审子代理）

### 评审轮 2（复验轮 1 的九条）

- **复验对象**：`docs/batches/2026-11-04-line-citation-cleanup.md` §1 裁定表（#1–#7 派单）+ §2 各小节（本轮重读全文）。
- **复验对象**：`docs/core/design/ADVISOR-GUARDS.md` §3.1 ∥ §10 A-AG28 ∥ §7 公开源核查（本轮重读）。
- **复验对象**：`docs/core/design/DOC-DISCIPLINE.md` §1 D1 ∥ D4 细则（判据本体，只读比对）。
- **复验对象**：`docs/vsc/design/VSC-MIGRATION.md` §1.3 引-3（本轮仍未改，L3 落笔在实施轮）。
- **限制（如实登记）**：本轮无 git 工具 ⇒ 提交 `3cb41a64` 与七档读数按设计席登记采信，本轮不复跑；`thincoder-core/prompts/advisor-design.md` 不在评审范围内 ⇒ 「落点档现 12 条」按登记采信。
- **结论**：轮 1 的 🔴 1 条已修（AC3 改量当前档面），🟡 6 条与 🔵 2 条全部落定；新发现无 🔴。

| # | Orig# | File | Severity | Status | Notes |
|---|-------|------|----------|--------|-------|
| 1 | 1 | docs/batches/2026-11-04-line-citation-cleanup.md | 🔴 | Fixed | AC3 改口径为当前档面：「AC3 | L1 当前档面零残留 | 以 §5 逐处清单为清单（初版 = §2.3 本席读数；实施轮复跑 `git show 3cb41a64 --unified=0 -- docs/` 补全），逐处取该处的坐标字面（`档名:行` ∥ 承名形 `:行`）在现盘该档全文 `includes` ⇒ **命中 0**」。`<该提交>` 占位已消失、提交号写死为 `3cb41a64`，量的是修复后的现盘而非不可变的历史 diff；L1 条目判据同步改「按逐处清单逐处回读现盘 ⇒ 坐标残留 **0 处**（量法见 2.7 AC3）」。 |
| 2 | 2 | docs/batches/2026-11-04-line-citation-cleanup.md | 🟡 | Fixed | 档集改为命令读数：「**档集 = 命令读数（可复跑）**：`git show --name-only 3cb41a64` ⇒ 七档——…扣批档…与两档产品码（代码面，零笔）⇒ **射程 = 四档文档**」，四档里第四档 `docs/cli/requirements/TUI.md` 已入射程且在 §2.6 记「零命中不改」。 |
| 3 | 3 | docs/core/design/ADVISOR-GUARDS.md | 🟡 | Fixed | 「编号 `13.`，条目内续行 **4 空格**、与 10–12 条同形（2–9 条是一位数编号，`N. ` 之后的对齐位本就不同…）」——与批档 §2.4 的「续行 **4 空格**（对齐 `N. ` 之后的文字——与 10–12 条同形）」及 §3.1 围栏块的 4 空格三处一致。 |
| 4 | 4 | docs/core/design/ADVISOR-GUARDS.md | 🟡 | Fixed | 「**无例外——被审档一律同判**：第 13 条不给任何一档开口子，项目归档档（`**/_archive/**`）里有行号引用照报。判据面上没有第二处答案：…§1 D4 细则给的是**清账口径**（域 ∥ 围栏），不是免判口径 ⇒ 不拿它当例外依据。」——「项目标准档另有处置」的断言已删；C5 同步为「但**不是免判**：它仍是行号引用，按第 13 条照报一行发现」。 |
| 5 | 5 | docs/batches/2026-11-04-line-citation-cleanup.md | 🟡 | Fixed | §1 的重复围栏块已归一（「## 提示词正文（父侧定稿 · 实施席逐字照抄，不得改写措辞）」下只剩一个 `text` 块）；§2.2 改「提示词正文的**规范单源** = 该节围栏块；批档 §1 的定稿块是同一份的一次性转载（批档收口可整档删除 ⇒ 不成第二真源）」——断言与 §1 现状相符。 |
| 6 | 6 | docs/batches/2026-11-04-line-citation-cleanup.md | 🟡 | Fixed | §2.5 表已与 `docs/core/design/DOC-DISCIPLINE.md` §1 D4 细则五法逐行对齐（补「数据档 / 配置档里的一个键 | **键名路径 + 所在节**」「同档自指 | **节名 + 逐字引文**（档名可省）」），并加「**引文内坐标不是第六种落法，是一条规则**」。 |
| 7 | 7 | docs/core/design/ADVISOR-GUARDS.md | 🟡 | Fixed | §10 已补「A-AG28 | 参照形态判据（提示词第 13 条）：…（判据 = 本节 AC13-1 … AC13-5） | 参照形态判据（提示词第 13 条）」——验收总表重新收录该机制。 |
| 8 | 8 | docs/core/design/ADVISOR-GUARDS.md | 🔵 | Fixed | §3.1 勘察证据行改「本仓 `PROJECT-MANIFEST.json` 的 `index.publicRepos` = `[]`（实读 2026-11-04：该键值为空数组）…；口径与 §2 第 7 条同——两处同为实读」，与 §7「（实读）」同强度。 |
| 9 | 9 | docs/batches/2026-11-04-line-citation-cleanup.md | 🔵 | Fixed | AC6 改「`>300` 行数 = 基线读数（实施轮首动作前复测，记 §5），判据 = 实施后**不增加**」；`docs/core/design/ADVISOR-GUARDS.md` AC13-4 同口径，全档断言换成增量为零。 |
| N1 | (new) | docs/batches/2026-11-04-line-citation-cleanup.md | 🟡 | New: AC3 与 AC9/§2.5 的引文内口径相抵，承名形字面会假红 | AC3 要求「逐处取该处的坐标字面…在现盘该档全文 `includes` ⇒ **命中 0**」，而 §2.5 写「**引文内坐标不是第六种落法，是一条规则**：…逐字不动…射程内遇上就照此不动，并逐处登记 §5」、AC9 写「被引对象自述句内的坐标逐字保留（与 §5 登记对照）」——两类都进同一份 §5 清单 ⇒ 射程内若确有一处引文内坐标，AC3 与 AC9 必有一红。另：§2.3 自记「行内另带 `:84` 一类承名坐标」，两三字裸字面在同一档（该档数百处坐标）里做全文 `includes` 极易命中别处的同号 ⇒ 假红。建议把 AC3 的清单分两列（要清 ∥ 引文内保留）并把承名形按「档名 token + 续接号」整段取字面。 |
| N2 | (new) | docs/batches/2026-11-04-line-citation-cleanup.md | 🟡 | New: 射程含需求档而笔权不在本批（协调项，非缺陷） | 「⇒ **射程 = 四档文档**」含 `docs/cli/requirements/TUI.md`；`docs/core/design/DOC-DISCIPLINE.md` §1 D1 写「需求档（项目需求 + 功能规格）= 主 agent」∥「**父侧（主 agent）的落笔面 = 批次档 §1/§4/§6 · 台账 · 需求档**」，而 §2.6 的实施笔权是 eng-designer。设计席读数为该档零命中，但实施轮复跑若命中则该席无笔 ⇒ 需父侧接一笔。 |
| N3 | (new) | docs/core/design/ADVISOR-GUARDS.md | 🔵 | New: A-AG28 的判据指针自指且漏一条 | 「（判据 = 本节 AC13-1 … AC13-5）」——AC13-* 住在 §3.1，不在 §10「本节」；且 AC13-6（交付门 `doc_check` 首行 PASS）未列入。 |
| N4 | (new) | docs/batches/2026-11-04-line-citation-cleanup.md | 🔵 | New: AC7 的「行号」正则字面独立成立 | AC7 写「抽取式 = 档名 token…与行号（`:` 紧跟数字，可带 `-` 区间）两个正则，命中即点名」，而 `docs/core/design/ADVISOR-GUARDS.md` §3.1 围栏块与批档 §3 都含 `path:123` 字面 ⇒ 把第二个正则当独立正则跑，落地块必红。可过口径是 §2.7 末段「档名 token = 带扩展名的文件 token（可带目录段），其后紧跟 `:` 与数字即一处」（`path` 无扩展名 ⇒ 不命中）——建议两处写成同一条。 |

- **计数**：复验 9 条 = Fixed 9（🔴 1 · 🟡 6 · 🔵 2）；新发现 = 🔴 0 · 🟡 2 · 🔵 2。
- **裁定**：轮 1 的阻断项已消除，新发现均非必须修（🟡 为可选改进 / 协调项，🔵 为备注）。

VERDICT: pass

## §4 用户批准（主 agent）

## 用户批准

- **原话一**：「哎，说了多少次，不能用行号做引用，我们还有用行号做引用吗？」（2026-11-04 18:27）——立判据。
- **原话二**：「我现在不着急清旧账，我是觉得应该把这个要求交给advisor，让他评审的时候检查一下。」（18:30）——**存量不清，改评审判据**。
- **原话三**：「我不是这意思，我的意思是改advisor的提示词，让它检查这个。」（18:32）——**落点 = 提示词，不是项目配置档**。
- **原话四**：「卧槽！你为什么要把自己项目的特例进提示词？！_archive下这些为什么要在提示词里说？！」（18:57）——**提示词不带项目细则**。
- **原话五**：「自动跑完」（18:55）——整批令，覆盖批准门，批内全链自动跑完。

**批准范围**：`thincoder-core/prompts/advisor-design.md` 加第 13 条（纯产品级，无项目例外）∥ 清上一批自己引入的八处坐标 ∥ `docs/vsc/design/VSC-MIGRATION.md` §1.3 引-3 改形 ∥ `docs/core/design/PROMPT-SYSTEM.md` 条数随动 ∥ 设计面 `docs/core/design/ADVISOR-GUARDS.md` §3.1 与 §10 的 A-AG28。

**不在范围**：存量行号清账（用户明确不着急）、`docs/core/design/DOC-DISCIPLINE.md` 规则本体（只引不改）、其它端的文档。

## §5 实施记录（eng-coder）
**状态行**：实施完成 2026-11-04（L2 落盘（第 13 条三行逐字）；L1／L3 非本席笔域；审计 1 轮 + 代码评审 1 轮，终端 clean，1 项上抛）



### 实施（eng-coder · 本席笔域 = `thincoder-core/prompts/advisor-design.md`）

- **笔域如实登记**：本批 §2.6 表给本席一笔 —— `thincoder-core/prompts/advisor-design.md`（L2）。L1（三档设计档换形）与 L3（`docs/vsc/design/VSC-MIGRATION.md` 引-3）的笔权在 §2.6 表里是 eng-designer，另有 spawn 承笔；本席零触，本段也不代替那两笔的读数。
- **落笔**：`## Review Criteria` 节末、第 12 条之后、`## Output Format` 之前，插第 13 条三行；正文逐字 = `docs/core/design/ADVISOR-GUARDS.md` 的 §3.1 围栏块，续行 4 空格。未改写措辞、未合并成一行（设计原话：「逐行照落…不改写措辞、不合并成一行」）。
- **改动面**：`git diff -U0 -- thincoder-core/prompts/advisor-design.md` ⇒ `^+` 行 **3 行**、`^-` 行 **0 行**，零其他改动；该档 147 行 → 150 行。

### 验收读数（逐条命令 ∥ 结果）

| # | 量法（实跑） | 结果 |
|---|---|---|
| AC13-1 ∥ AC1 | `node` 逐行 `===`：落地块 vs 规范单源围栏块（首末行含） | `block equal: true` · `lines equal: true`（3 行） |
| AC13-2 ∥ AC2 | 节切 `## Review Criteria` 至下一个 `^## `，`^[0-9]+\. \*\*` 计数；再核第 13 条与 `## Output Format` 的先后 | 计数 = **13**（`6b.` 不占整数号）；第 13 条在 `## Output Format` 之前 = true |
| AC13-3 ∥ AC5 | 落地块扫 `pre-existing` ∥ `one count line` ∥ `the round did not touch` | **0** 命中（三项逐项 false） |
| AC13-5 | 落地块扫 `docs/` ∥ `_archive` ∥ `thincoder-` | **0** 命中（三项逐项 false） |
| AC13-4 ∥ AC6 | 落地块逐行宽度；全档 `>300` 行数（首动作前基线 ∥ 实施后） | 落地块最长行 **163** 字符（≤300）；基线 **0** → 实施后 **0**，不增加 |
| AC7 | `git diff -U0` 的 `^+` 行按 §2.7 末段口径抽取（带扩展名的文件 token + `:` + 数字，可带 `-` 区间） | **0** 命中 |
| AC10 ∥ AC13-6 | `doc_check({mode:"gate", docs:[§2.6 六档]})` | 首行 `DOC-CHECK GATE: PASS`，0 段命中（6 档全清） |

### 逐处登记与换形落法

- **本席射程内的换形处**：**0 处**——本笔只新增判据文本，不动任何既有坐标（§2.5 的逐类处置表在本笔无实例）。
- **引文内坐标（规则，非落法）**：第 13 条正文自带 `path:123` 与 `line 123` 两处示例字面，规范单源围栏块同字面 ⇒ 按 D4「引文内坐标照引」逐字不动，不计入清账面。
- **口径差如实登记（承 §3 轮 2 的 N4，未决）**：AC7 表内写两个正则（档名 token ∥ 「`:` 紧跟数字」），§2.7 末段写合并口径（带扩展名的文件 token + `:` + 数字）。按表内第二个正则**单跑**，落地块第 2 行的 `path:123` 会命中 **1 处**；按末段合并口径 ⇒ **0 处**。本席按合并口径判（`path` 无扩展名，不是文件 token），并把这个口径差留给父侧定：两处写成同一条，才不会出现「同一批一个绿一个红」。

### 决策披露

- 未改 §2.6 六档之外的任何档；未改 `.thincoder/advisor.md`、`thincoder-core/advisor/history.mjs`，也未改 `thincoder-core/prompts/advisor-round1.md` ∥ `thincoder-core/prompts/advisor-round2.md` ∥ `thincoder-core/prompts/advisor-round3.md` ∥ `thincoder-core/prompts/consult-base.md`（§2.9 边界逐条守）。
- 未建单元测试档：本笔无可跑的业务面（判据文本），验收 = 上表机检读数 + 交付门（§2.6「测试覆盖」同判）。

### 自审与评审轮次

- **内部发散审计（explore · 只读）1 轮**：结论 `DIVERGENCE: none`；项 1–12 逐条核（逐字相等 ∥ 编号位置 ∥ 续行 4 空格 ∥ 零项目细则 ∥ 行宽 ∥ `## Your role` 与 `## Citation Discipline` 未动 ∥ 四个同族提示词档零触 ∥ 未建 `.thincoder/advisor.md` ∥ 第 13 条不指定严重度 ∥ 三行不成一段 ∥ 越界面 ∥ 设计档漂移）。
- **advisor 代码评审 1 轮**：`VERDICT: pass` —— 🔴 **0** · 🟡 2 · 🔵 2。两条 🟡 的处置：① `docs/core/design/PROMPT-SYSTEM.md` 记「（设计评审 12 条）」随本笔变陈旧（现为 13）——设计档笔权在 eng-designer，本席不越笔，**上抛父侧**（见下）；② §5 缺实施读数——**本段即补**，已消解。两条 🔵（第 13 条不带「只管被审文档」的分界句 ∥ 该档续行缩进本就不统一）本席不落：前者分界住设计面、且本笔受「逐字照抄」约束；后者是本笔射程外的格式面。
- **终端状态**：`clean`（无 🔴 残留、无未消解的自审项）。

### 上抛

- **〔上抛·待裁〕判据条数读数陈旧一处**：`docs/core/design/PROMPT-SYSTEM.md` 现写「`thincoder-core/prompts/advisor-design.md`（设计评审 12 条）」，本笔落地后该节为 **13** 条整数编号（实测）。属设计档笔域（eng-designer / 父侧路由），本席未改；请父侧决定改这一处（或删去括注里的数目字，使其不再随条数漂移），并可知会 D3 计数随动的口径。

## §6 验证与收口（父代理）

## 验证与收口（父侧实跑 · 2026-11-04 19:17）

**父侧复验读数（不采信子代理报告，逐条重跑）**：

| 项 | 读数 |
|---|---|
| L2 提示词第 13 条 | `## Review Criteria` 节切 48 行 · 整数编号 **13** · 第 13 条在 `## Output Format` 之前 · 三行行宽 134 ∥ 158 ∥ 163 |
| L2 项目细则零渗 | 落地块扫 `docs/` ∥ `_archive` ∥ `thincoder-` ∥ `pre-existing` ∥ `one count line` ⇒ **全零** |
| L1 坐标清零 | 七处抽验（`tool-events.mjs:448` ∥ `async-discard.mjs:55` ∥ `subagent-blocks.mjs:81` ∥ `subagent-scheduler.mjs:357-359` ∥ `status-line.mjs:63` ∥ `status-line.mjs:174` ∥ `status-bar.js` 的 `:62`）⇒ **全部已清** |
| L3 引-3 改形 | 现文 =「仓根相对路径 + **符号名**（函数 / 常量 / 导出名——如 `thincoder-vscode/webview/ui.js` 的 `<函数名>`；不写行号）」 |
| 条数随动 | `docs/core/design/PROMPT-SYSTEM.md` 含「设计评审 13 条」= 真 ∥ 含「12 条」= 假 |

**实施席自报的实测（本节采信并已抽验）**：射程复跑 `git show 3cb41a64` ⇒ 七档，扣批档与两档产品码 = 四档；`^+` 行命中 **8 处坐标**（6 名形 ＋ 2 承名形，`docs/cli/design/TUI.md` 4 行 5 处 ∥ `docs/vsc/design/WEBVIEW-PROTOCOL.md` 1 行 3 处）。**处数在设计与实施两轮里出现过 6 / 8 两个读数，以实施轮实跑为准**——差异来自承名形（`:84` 一类）算不算一处，已由 §2.3 的「续接形」口径定死。

**真因实例（实施轮抓到，记此一笔）**：`async-discard.mjs:55` 那处坐标早已漂移——它指向的是一行模板串，而句子真正说的判据在 `discardable`。**换成符号名才指对。**这是本批要治理的失效模式的现场样本。

**未做（如实交代）**：

- **存量未清**：`docs/` 全域行号引用按用户 18:30 的口径不清（清账节奏归用户排期）；本批只清上一批自己引入的八处。
- **`docs/vsc/design/WEBVIEW-PROTOCOL.md` §6.1 表内他行**（`:23` ∥ `:51-60` ∥ `status-bar.js` 的 `:59-60`）属存量，未动。
- **AC7 口径差**（轮 2 的 N4）：实施席按 §2.7 末段的合并口径判 0 命中，并指出表内第二个正则单跑会命中落地块自己的示例字面 `path:123`——已在 §2 记明，本批未改表内措辞。

**集成测试面**：本批改的是判据与文档字面，产品运行期零改；仓库根全量集成未跑（无运行期变更可评），已按「本改动没有可跑的业务面」的口径登记。

**台账**：`#2037` → 见 ledger 调用。
