# 2026-10-28 · product-text-sweep
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-28 · 来源 = 用户 2026-10-28 00:14「第二批能开就开吧」。B 批 = 产品面收正 3 条（2 条产品文本 + 1 条产品码死件），与 A 批并行（文件不重叠）。。
> 台账 = #1854（DOC-DISCIPLINE · 归批）。前情 = 2026-10-28-doc-drift-sweep（进行中——A 批只收纯设计档 6 条，本批收它剩下的产品面 3 条）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-28
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 本批范围（三条，同属「读数与死件收正」，但落三个不同的包）

| 台账 | 问题 | 落点 |
|---|---|---|
| `#1838` | 写「`thincoder-core/tool-docs/` **24 档**工具描述」——实读 **54**（同句前半「`thincoder-core/prompts/` 16 档」实读 16 ✓，只有这个数漂了） | `thincoder-vscode/AGENTS.md:15` |
| `#1736` | `thincoder-core/tool-docs/doc_check.md` 的 Anchors 全称句仍绝对化（类名九名闭集 + 占位词干族不判）—— 该档的 Anchors 节在 `#1849` 批认定只判锚不判段，但「锚判据本身覆盖什么」这句没随 `isToolDocFace` 落地收正 | `thincoder-core/tool-docs/doc_check.md` |
| `#1844` ② | `ctxPercentForModel` 是**死函数**（零调用者，4 处全在定义与注释），且注释自陈它是 double-report 端差源 ⇒ 保留即活反例（下一个人读到会以为端侧算百分比可以） | `thincoder-vscode/src/specs.mjs:81-84` |

### 1.2 父侧已核（开工前）

- **`ctxPercentForModel` 零调用者** —— `thincoder-vscode/**` 全扫 4 处命中，全部是 `specs.mjs` 的 `:9` / `:11` / `:81`（定义）/ `:89`（注释提到它），**无一处调用**。
- **`AGENTS.md:15` 的 24 是孤例** —— 同句「`prompts/` 16 档」实读 16 ✓，只有 `tool-docs` 那个数漂了（54）。⇒ 不是整句过期，是一个数。

### 1.3 边界

- **不改** `thincoder-vscode/src/specs.mjs` 的 `ctxUsageForHistory`（`:94`，单源 `historyReading`）—— 那是现役件，动它就不是「收正」了。
- **不改** `thincoder-core/tool-docs/doc_check.md` 的 Face scope 条（`#1849` 批刚落的）—— 只收正 Anchors 全称句。
- **不碰** A 批（`2026-10-28-doc-drift-sweep`）的六个设计档。

### 1.4 验收面（三条各一）

- **`#1838`**：`doc_check` 门（该档在盘可解析）+ 改述后**不再含绝对值 24**（改法：去掉数字写「按目录实读」或写「工具描述目录」，**不要 24→54 换数字** —— 下次工具增减又是同一处漂）。
- **`#1736`**：`doc_check` 门 + Anchors 句与 `thincoder-core/doc-check/anchors.mjs` 的实判面一致（读代码核，不凭句）。
- **`#1844`②**：`node --check thincoder-vscode/src/specs.mjs` + 该包既有测试绿 + 全仓 `ctxPercentForModel` **0 命中**。

### 1.5 链声明（父侧纠正 · 2026-10-28 00:2x）

**本批走完整四步链，§3 评审是核销前置。**

**判据不是习惯，是机制** —— `thincoder-core/ledger-close-proof.mjs:54-55` 逐字要求「该批档 §3 状态行 = 评审通过」，缺一即拒：

```
③ 批档 §3 未通过评审（§3 状态行 = （无状态行），须 = 评审通过）：重开该档补评审结论，或另起批次
```

**⇒ 不开评审 ⇒ 核销不掉 ⇒ 收不了尾。**用户 2026-10-28 00:16「你不开链收不了尾吧？」指的正是这条。

**本批链：设计（`#9`）→ **评审（待 fire）** → 批准 → eng-coder（本批含产品码 ⇒ 有实施段）→ 收口。**

**与 A 批的差别**：A 批零代码 ⇒ 无 §5；本批有 `#1844`② 删死函数 ⇒ 有 §5，且产品码面须设计Token 才能派 eng-coder。

### 1.6 父侧更正：§1.2 的「24 是孤例」不成立（设计席 `#9` 指出 · 2026-10-28 00:19）

**§1.2 我写：「`AGENTS.md:15` 的 24 是孤例 —— 同句「`prompts/` 16 档」实读 16 ✓，只有 `tool-docs` 那个数漂了（54）⇒ 不是整句过期，是一个数。」**

**这句错在「孤例」两个字。** 设计席实读后发现同一档 **`:136`** 也写着 `tool-docs` 24 档 —— 所以是**两处**，不是一处。

**⇒ 影响**：§1.4 的验收句原本只盯着 `:15`，照它验完，`:136` 那处会漏。设计席已按「该档不再含绝对值 24」把两处一并收（§2 2.3②），验收句因此仍然成立 —— 但**成立的理由和我写的不一样**：不是「只有一个数漂了」，是「两处都漂，一起收」。

**⇒ 我错在哪**：我查了 `:15` 那一行，看到同句的 16 是对的，就下了「孤例」的结论 —— 而「孤例」是个**全档判断**，我却只读了一行。这正是我今天反复犯的同一件事：拿局部读数去支持一个全域结论。

**⇒ 处置**：§1.2 原文保留（记录当时的判断），以本段为准。设计席的扩面是对的。

### 1.7 第一轮评审裁定（父侧 2026-10-28 00:2x）

**评审判 changes-required（🔴 2 · 🟡 4 · 🔵 2）。八条全数接受，派修正轮。**

| # | 级别 | 裁 | 理由 |
|---|---|---|---|
| 1 | 🔴 | **Fixed** | 验收把整包套件当检查：`cd thincoder-vscode; npm test` 跑 5 档，而**那 5 档无一引用 `thincoder-vscode/src/specs.mjs`**。⇒ 跑完什么也证明不了，却把发布门写成了每轮成本。 |
| 2 | 🔴 | **Fixed** | 设计只改 `docs/vsc/design/WEBVIEW.md` §4.6 的 `:83`/`:89`，漏了同档 `:734`（D-W33 仍写 `:94`/`:100`）。删 11 行后该件是 90 行 ⇒ 那两个坐标越过 EOF。同一个派生单点两处给不同坐标，而两道门都抓不到。 |
| 3 | 🟡 | **Fixed** | 新句「the seven operand names listed above」指反了：七个名字的清单在同档 `thincoder-core/tool-docs/doc_check.md:20`（在 5–10 行**之后**），且 `:13`–`:17` 的「Operand names」块已逐名列过一遍。 |
| 4 | 🟡 | **Fixed** | §1.4 写「全仓 0 命中」，而 §2.5 ③ 自陈记录面（`docs/batches/**` · 归档）留历史行 ⇒ 全仓不可达；且 ③ 含 `docs/core/design`，而 `docs/core/design/API-CONTRACT.md:4590` 要到 ④ 重生成后才清。 |
| 5 | 🟡 | **Fixed** | §2.8 给了「破 0 · 冗余 0 · 缺 0」的合规理由，但没起自 `test/RTM.md`、无逐行读数（VS Code 节 `:223`–`:228` 现为空表；唯一的百分比故事 = `16-1`，属 CLI 端）。 |
| 6 | 🟡 | **Fixed** | §4.6 有一行未结的措辞账（`docs/batches/2026-10-27-design-drift-close.md:273` 要求「随下次触碰该档收窄」），而本批正是在触碰该档；删该函数不结这条账。 |
| 7 | 🔵 | **Fixed** | `docs/core/design/API-CONTRACT.md` 的 delta 描述不全：实为「删 1 行 + 重锚 5 行」（`:17`→`:16` · `:62`→`:61` · `:71`→`:70` · `:94`→`:83` · `:100`→`:89`）。 |
| 8 | 🔵 | **Fixed** | §2 有两条状态行（`:63` 占位 + `:66` 真值）。 |

**评审也做了正面核验，逐条列下**：

- `thincoder-vscode/src/specs.mjs` = 101 行，`ctxUsageForHistory` 在 `:94`、`ctxPercentForHistory` 在 `:100`。
- ⇒ 设计的 `−11` / `101→90` / `:83` / `:89` **算术全对**。
- `thincoder-core/tool-docs/doc_check.md` = 79 行，被替换的 `:5`–`:10` 恰是 Anchors 段（6 → 11 行 = +5 ✓）。
- `thincoder-vscode/AGENTS.md` = 138 行，`24` 只在 `:15` / `:136`。
- `docs/vsc/design/WEBVIEW.md` = 829 行。

**⇒ 修正轮只动判据与坐标说明，不动已落的产品文本置换稿。**

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（修正轮按 §3 八条已落（2026-10-28）· 现行设计文本 = §2.10 起的 A 段）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试覆盖 / 验收对照 / 关键决策 / 上抛项>


### 2.1 覆盖条目与变更面

| # | 台账 | 收正什么 | 落点档 | 变更面 |
|---|---|---|---|---|
| 1 | `#1736` | `doc_check` 描述档的 Anchors 全称句（现写「every documentation pointer … must resolve」，实判面 = 抽取后幸存的 token） | `thincoder-core/tool-docs/doc_check.md` | 产品文本面（注入给模型的工具描述） |
| 2 | `#1838` | `tool-docs/` 档数的绝对值两处退役（不换数字） | `thincoder-vscode/AGENTS.md` | 产品文本面 |
| 3 | `#1844`② | 删死函数 `ctxPercentForModel`（零调用者 · 注释自陈 double-report 端差源） | `thincoder-vscode/src/specs.mjs` | 产品码面 |

**前提更正（实读推翻 §1.2）**：§1.2 记「`AGENTS.md:15` 的 24 是孤例」。实读该档 `:136` 同写「`tool-docs/` 24」（打包断言行 `postpackage`）。⇒ 本批 `#1838` 收两处，验收判据「该档不再含绝对值 24」按全档判。

**原话依据**：§1.4 `#1838` 的改法明写「去掉数字写『按目录实读』或写『工具描述目录』，不要 24→54 换数字」——本设计两处同法。

### 2.2 设计档落点

- **不新建档**：三条都是现役件的收正，落点 = 各自现役档原位（现存档更新，不新起实体）。
- **设计侧已落（本会话笔）**：`docs/vsc/design/WEBVIEW.md` §4.6 两处——派生单点坐标 `:94`→`:83`，名字分工句删去 `ctxPercentForModel` 一名及其理由残留。
- **`docs/core/design/API-CONTRACT.md` 不手改**：符号表在生成块内（`scripts/api-contract.mjs:17` `MARK_BEGIN`），删码后跑 `node scripts/api-contract.mjs` 重生成，该行自然消失。手改生成块 = 下次重生成即回滚。

### 2.3 机制设计与先例

**最近先例（对齐 ∥ 偏离）**：`docs/core/design/DOC-DISCIPLINE.md` §3.20「抽取面三免（类名 ∥ 占位 ∥ 操作数）」= 同一判据句的设计单源，`#1849` 批已落。**对齐** = 本批只让描述档的句子追上它；**偏离** = 无。

**公共源勘察证据行**：`PROJECT-MANIFEST.json` 的 `index.publicRepos` 实读 = `[]`（本会话 `manifest read`）⇒ 工作目录树内无独立公共文档仓，**已查、无相关公共源可引**。

#### ① `#1736` — Anchors 句的射程收正

**实判面（读码，不凭句）**：`thincoder-core/doc-check/anchors.mjs` 在判指针前先剥三类，剥完才解析：

- 类名免（`:28`–`:31` `FILENAME_CLASSES`，九名闭集）· 占位免（`:34`–`:36` `PLACEHOLDER_STEMS` + `:127` `stem.length <= 1`）· 操作数免（`:45`–`:49` `CANON_OPERANDS` 七名，仅提示词面剥）。
- 剥离后仍逃不掉的照判：`:127` 两免只挡上述闭集，闭集外的同形名照报 `档缺`——描述档现文「every … must resolve」若被读成「闭集内的名也算」，判据就被读宽了。

**落地文本（eng-coder 逐字替换 `thincoder-core/tool-docs/doc_check.md` 第 5–10 行的 Anchors 段）**：

```text
- Anchors — a documentation pointer (a `*.md` token, optionally carrying directory segments, optionally followed by a section
  indicator `§N` / `§N.M` / `§N.M.K`) must resolve: the file must exist on disk (`档缺` when it does not), and when a section
  indicator is given the target file must carry a heading numbered with it (`节缺` when it does not). Line-number coordinates

  (`<doc>:12`) are not section references and are not judged as such. Files inside fenced code blocks and executable lines
  (command / pattern code spans) are skipped whole.
- **The reach is what survives extraction, not every `.md` token.** Three name families are never extracted, so they are never
  judged: **conventional file names** used to say which files get read (`AGENTS.md`, `SKILL.md`, `project_rules.md`, `todo.md`
  and the rest of that closed set), **placeholder stems** (single letters plus the usual sample words — `x.md`, `file.md`,
  `foo.md`, `example.md`), and — on the prompt face only — the seven operand names listed above. A `.md` token outside those
  families is judged even when misspelled: a wrong name reports `档缺`, never a pass.
```

**为什么这样写（不写九名计数、不写闭集全表）**：

- 树上的计数会漂（本批另两条正是漂出来的）⇒ 闭集点族名、不点个数；数「共几名」是 `docs/core/design/DOC-DISCIPLINE.md` §3.20 的事，描述档不重述（D2 单一权威源）。
- 描述档的读者是模型，它要判的是「我写的这个名字会不会被查」——给出族名 + 每族两个示例即可判，全表只增 token 成本。

#### ② `#1838` — `tool-docs/` 档数两处退役

两处都改成「按目录实读」，一处不写数：

| 行 | 改法 |
|---|---|
| `:15` | `（\`thincoder-core/prompts/\` 槽位档 + \`thincoder-core/tool-docs/\` 工具描述目录——两者档数按目录实读，不写死数字）` |
| `:136` | `prompt-face completeness (\`prompts/\` + \`tool-docs/\` 全档——档数硬等 \`EXPECT\`（\`scripts/check-vsix.mjs\`）+ 档名集合 + 逐档 sha256)` |

**为什么连 `prompts/` 的 16 一起收**：同句同病——两个数都是「目录里现在有几档」的抄本，工具一增减就漂。此句的原意是「运行期提示词面在核内落地」，不是报数；去掉数字，句意不减。

**为什么 `:136` 指向 `EXPECT` 而不是删掉档数语义**：那一行的语义是「打包时断言提示词面完备」，档数硬等是断言的实质（`check-vsix.mjs:37` `EXPECT`）。删数字可以，删「硬等」不行——硬等的值由脚本持，档数只在那一处落。

#### ③ `#1844`② — 删死函数 `ctxPercentForModel`

**删除点（四段，合计 −11 行）**：

| 位置（改前） | 动作 |
|---|---|
| `:9` 头部块 `- \`ctxPercentForModel\`（面板上下文占比派生…）；` | 整行删 |
| `:11` 头部块句尾 `；\`ctxPercentForModel\` 保留给 provider 报告值消费面）。` | 改为 `）。`（行数不变） |
| `:76`–`:85` 该函数的 docblock + 函数体 + 其后空行 | 整段删 |
| `:89`–`:90` `ctxUsageForHistory` 注释里提该函数的两行 | 同 2 行改写：保留「曾 double-report」这层 why，去掉已不存在的函数名 |

**保读面**：`:13` 的 `providerSpec` import 与 `:17` 的再出口**不动**——`providerSpec` 另有消费面（`docs/core/design/API-CONTRACT.md:4587` 记该再出口），本批只删那个只用它算百分比的外部函数。

**为什么删而不是留**：零调用者在仓内已实证（`grep -rn ctxPercentForModel thincoder-vscode/src` = 4 处，全在定义与注释）。留着它 + 自带「这是 double-report 差源」的注释 = 活的反例：下一个人读到，会以为端侧自己算百分比是可以的先例。

**删后坐标（设计侧已按此改 `docs/vsc/design/WEBVIEW.md` §4.6）**：`101 − 11 = 90` 行；`ctxUsageForHistory` → `:83`；`ctxPercentForHistory` → `:89`。eng-coder 落地后回读 `grep -n "export function ctx" thincoder-vscode/src/specs.mjs` 核这两值，不符则同轮改 `docs/vsc/design/WEBVIEW.md` §4.6 的两处坐标。

### 2.4 受影响文件与测试覆盖

| 档 | 改前 | 增量 | 说明 |
|---|---|---|---|
| `thincoder-core/tool-docs/doc_check.md` | ≈79 行 | +5 | Anchors 段改写 + 新增「射程 = 抽取后幸存者」五句 |
| `thincoder-vscode/AGENTS.md` | 138 行 | ±0 | 两处行内改（`:15` / `:136`） |
| `thincoder-vscode/src/specs.mjs` | 101 行 | −11 | 死函数整段 + 两处提及 |
| `docs/vsc/design/WEBVIEW.md` | 829 行 | ±0 | §4.6 两处行内改（已落） |
| `docs/core/design/API-CONTRACT.md` | 生成面 | −1 | 重生成后该符号行消失，手不改 |

**测试面**：本批不新增单元测试档——无新行为可断（两条文本收正无运行面、一条是死件删除）。

- 反馈回路 = `node --check thincoder-vscode/src/specs.mjs` + `thincoder-vscode` 包既有 5 档（`thincoder-vscode/test/files.mjs` 登记清单，`npm test` 单入口）。
- 判据面读数 = `doc_check` gate（两条文本）与 `grep` 零命中（死件）。这两类都不留下需要长期盯住的运行面。

### 2.5 验收对照（逐条指回 §1.4，均机器可判）

| # | 台账 | 判据 | 判法 |
|---|---|---|---|
| 1 | `#1736` | 描述档过文档纪律门 ∧ 句子与实判面一致 | ① `doc_check(mode:"gate", docs:["thincoder-core/tool-docs/doc_check.md"])` 首行 `PASS`；② 逐族对读三族 vs `thincoder-core/doc-check/anchors.mjs` 的 `FILENAME_CLASSES` / `PLACEHOLDER_STEMS` + `stem.length<=1` / `CANON_OPERANDS`——零遗漏、零加宽 |
| 2 | `#1838` | 该档过门 ∧ 不再含绝对值 24 | ① 同上 gate 对 `thincoder-vscode/AGENTS.md`；② `grep -n "24" thincoder-vscode/AGENTS.md` ⇒ 0 命中（两处已改） |
| 3 | `#1844`② | 语法过 ∧ 既有测试绿 ∧ 产品面 0 命中 | ① `node --check thincoder-vscode/src/specs.mjs` exit 0；② `cd thincoder-vscode; npm test` 5 档全绿；③ `grep -rn ctxPercentForModel thincoder-vscode/src thincoder-vscode/test thincoder-vscode/AGENTS.md docs/vsc docs/core/design` ⇒ 0；④ `node scripts/api-contract.mjs` 后同 grep 对该档仍 0 |

**③ 的射程说明（判据诚实面）**：冻结存量不入判——`thincoder-vscode/docs/_archive/**`（归档不作现状依据）与 `docs/batches/**`（过程记录）里仍有该符号的历史行，改它们等于改历史。

**④ 由 eng-coder 执行**：生成器住在 `scripts/api-contract.mjs`，重生成是改动后的必要动作，不属用户指令面。

### 2.6 关键决策（含被否）

- **#1838 不换数字**：`24→54` 只是把这次漂换成下次漂。§1.4 明令同法，本设计两处都写「按目录实读」。
- **#1736 不写闭集全表与计数**：D2 单一权威源——全表与个数住 `docs/core/design/DOC-DISCIPLINE.md` §3.20；描述档写全表既重述又引入新的漂点，且读者是模型，判「这名字会不会被查」只需族名。
- **#1844② 不做「只删注释、留函数」**：函数留着仍可被再调用，而它的注释自陈是 double-report 差源——留 = 把反例摆在盘上。
- **`docs/core/design/API-CONTRACT.md` 不做手改**：生成块手改 → 下次重生成回滚，等于给下一个人留一个「为什么改了又回来」的谜。
- **`docs/vsc/design/WEBVIEW.md` §4.6 的边界不动**：「不改 CLI / 不改 ≥80 阈值 / 不引入核改动」三句与本批无关，零触碰。

### 2.7 边界（本批不做）

- 不动 `ctxUsageForHistory`（现役件，`historyReading` 单源）。
- 不改 `doc_check` 的 Face scope 条（`#1849` 批刚落的「工具描述面只判锚不判段」）。
- 不改 `thincoder-core/doc-check/anchors.mjs` 的判据本身——本批只收正它的描述句。
- 不碰 A 批（`2026-10-28-doc-drift-sweep`）的六个设计档。
- 不动 `thincoder-vscode/docs/_archive/**` 与 `docs/batches/**` 里的历史行。

### 2.8 集成测试差量

**破 0 · 冗余 0 · 缺 0，不新增行。** 判据 = 集成用例只从两条长出来：产品真需要的业务场景、生产真出现过的问题——两条都不成立。

- 本批三条里，两条只改文档文本（无运行面），一条删的是零调用者的死函数（删前就不产生任何结果）。
- 因此集成索引里没有一行断言的结果被本批改变，也没有一行因本批而冗余；「这面没人看着」不构成建用例的理由，若将来要盯，走台账。

### 2.9 上抛项

- **`[上抛·待裁]` 设计单源少一名**：`docs/core/design/DOC-DISCIPLINE.md:1155` 写「六个 CANON 操作数」并列出六名；实现 `thincoder-core/doc-check/anchors.mjs:45`–`49` 是**七名**（第七名 = 集成索引那档的裸名，2026-10-22 随锚面扩入），描述档现文也写 seven。⇒ 同一机制两处不一致，我判不到该并入哪批（不在 §1.1 三条落点内，且该档改一处要带全档 gate）。**未改**，留主 agent 裁决。
- **`[上抛·知会]` 前提更正**：§1.2「24 是孤例」不成立（`:136` 同有 24）。`#1838` 已按 §1.4 的判据把两处一起收；若主 agent 只要 `:15`，则 §1.4「该档不再含绝对值 24」这条验收须改。
- **`[上抛·知会]` 落地分工**：三条落点分别是产品文本面两条、产品码面一条 ⇒ 全部由 eng-coder 落地；设计席本会话只改设计面（`docs/vsc/design/WEBVIEW.md` §4.6）。

### 2.10 修正轮（round 2 · 按 §3 八条整改）

**轮次口径**：修正轮只动判据、坐标与措辞，不带新语义。下表给落点；其后的 A 段就是该条的**现行文本**，前文同号段落自此作废。

| # | 级别 | 改了什么 | 落点 |
|---|---|---|---|
| 1 | 🔴 | 验收去掉整包套件 `npm test`；判据换为 `node --check` + 生成器重跑 + 作用域 grep + 坐标回读；写明「无可运行测试断言被删件 ⇒ 判据 = 实跑的检查与结果」 | §2.5-A 第 3 行 |
| 2 | 🔴 | 设计档改写面补第三处：D-W33 两坐标；已落盘（本会话笔） | §2.2-A · §2.5-A 第 3 行 ④ |
| 3 | 🟡 | 置换稿末句「listed above」指反 ⇒ 改为下指 `Operand names` 块，且不复述七名 | §2.3-①-A |
| 4 | 🟡 | 「全仓 0 命中」收窄为作用域 grep；重生成排在 grep 之前（`docs/core/design/API-CONTRACT.md:4590` 才清） | §2.5-A 第 3 行 ②③ + 射程说明 |
| 5 | 🟡 | §2.8 起点改为 `test/RTM.md`，补逐行读数 | §2.8-A |
| 6 | 🟡 | §2.6 写明 `docs/vsc/design/WEBVIEW.md:199` / D-W33 外延过宽那条账本批是否收窄 | §2.6-A |
| 7 | 🔵 | `docs/core/design/API-CONTRACT.md` 差量改述为「删 1 行 + 重锚 5 行」并逐坐标列明 | §2.4-A |
| 8 | 🔵 | §2 只留一条状态行 | 段首状态行 |

#### 2.2-A 设计档落点（现行）

- **不新建档**：三条都是现役件收正，落点 = 各自现役档原位（现存档更新，不新起实体）。
- **设计侧已落（本会话两笔）**：`docs/vsc/design/WEBVIEW.md` §4.6 —— 派生单点坐标 `:94`→`:83`（`:202`）、名字分工句坐标 `:100`→`:89`（`:204`），并删去 `ctxPercentForModel` 一名与其理由残留；D-W33（`:734`）两坐标同步 `:94`→`:83` · `:100`→`:89`。
- **落盘读数**：`grep -n "specs\.mjs:" docs/vsc/design/WEBVIEW.md` ⇒ 恰 2 行（`:202` / `:734`），仅出现 `:83` 与 `:89`，无 `:94` / `:100` 残值。
- **`docs/core/design/API-CONTRACT.md` 不手改**：符号表在生成块内（`scripts/api-contract.mjs:17` `MARK_BEGIN`），删码后跑 `node scripts/api-contract.mjs` 重生成，该行自然消失。手改生成块 = 下次重生成即回滚。

#### 2.3-①-A `thincoder-core/tool-docs/doc_check.md` `:5`–`:10` 置换稿（现行）

eng-coder 用下面这块**整体替换** `thincoder-core/tool-docs/doc_check.md` 的 `:5`–`:10`（六行 ⇒ 十一行，+5）。与首轮稿的唯一差别 = 末句指向：七名清单不在该位置之上，而在其**下**的 `Operand names` 块（`:13`–`:22`），故改为下指，且不再复述七名（该块已逐名列过一遍）。

```text
- Anchors — a documentation pointer (a `*.md` token, optionally carrying directory segments, optionally followed by a section
  indicator `§N` / `§N.M` / `§N.M.K`) must resolve: the file must exist on disk (`档缺` when it does not), and when a section
  indicator is given the target file must carry a heading numbered with it (`节缺` when it does not). Line-number coordinates

  (`<doc>:12`) are not section references and are not judged as such. Files inside fenced code blocks and executable lines
  (command / pattern code spans) are skipped whole.
- **The reach is what survives extraction, not every `.md` token.** Three name families are never extracted, so they are never
  judged: **conventional file names** used to say which files get read (`AGENTS.md`, `SKILL.md`, `project_rules.md`, `todo.md`
  and the rest of that closed set), **placeholder stems** (single letters plus the usual sample words — `x.md`, `file.md`,
  `foo.md`, `example.md`), and — on the prompt face only — the seven operand names the `Operand names` block below
  lists. A `.md` token outside those families is judged even when misspelled: a wrong name reports `档缺`, never a pass.
```

**门面安全（实读核，替换后不新增 `档缺`）**：这块新增文字里的 `.md` token 只有两类——`AGENTS.md` / `SKILL.md` / `project_rules.md` / `todo.md` 属类名族（`thincoder-core/doc-check/anchors.mjs:28`–`:31` 不抽），`x.md` / `file.md` / `foo.md` / `example.md` 属占位词干族（同档 `:34`–`:36` 不抽）。

另有 `*.md` 与裸 `.md` 两形：抽取正则要求 `.md` 之前至少一个名字字符，二者都不构成 token。

#### 2.4-A 受影响文件表（现行，仅列改动的两行）

| 档 | 改前 | 增量 | 说明 |
|---|---|---|---|
| `thincoder-vscode/src/specs.mjs` | 101 行 | −11 | `:9` 整行删 · `:11` 句尾改 `）。`（行数不变）· `:76`–`:85` 十行整段删 · `:89`–`:90` 两行改写 ⇒ 删后 90 行，`ctxUsageForHistory` `:83`、`ctxPercentForHistory` `:89` |
| `docs/core/design/API-CONTRACT.md` | 生成面 | 删 1 行 + 重锚 5 行 | 重生成后 `ctxPercentForModel` 符号行消失，同块五处坐标随移：`:17`→`:16` · `:62`→`:61` · `:71`→`:70` · `:94`→`:83` · `:100`→`:89`；手不改 |

（其余三档行不变：`thincoder-core/tool-docs/doc_check.md` ≈79 行 +5 · `thincoder-vscode/AGENTS.md` 138 行 ±0 · `docs/vsc/design/WEBVIEW.md` 829 行 ±0。）

#### 2.5-A 验收对照（现行，逐条指回 §1.4，均机器可判）

| # | 台账 | 判据 | 判法 |
|---|---|---|---|
| 1 | `#1736` | 描述档过文档纪律门 ∧ 句子与实判面一致 | ① `doc_check(mode:"gate", docs:["thincoder-core/tool-docs/doc_check.md"])` 首行 `PASS`；② 三族逐族对读 `thincoder-core/doc-check/anchors.mjs`：类名族 `:28`–`:31`（九名闭集）· 占位族 `:34`–`:36` + `:127` `stem.length <= 1` · 操作数族 `:45`–`:49`（七名，仅提示词面）——零遗漏、零加宽 |
| 2 | `#1838` | 该档过门 ∧ 不再含绝对值 24 | ① 同上 gate 对 `thincoder-vscode/AGENTS.md`；② `grep -n "24" thincoder-vscode/AGENTS.md` ⇒ 0 行（改前实读 = `:15` / `:136` 两处） |
| 3 | `#1844`② | 语法过 ∧ 生成面清 ∧ 作用域 0 命中 ∧ 坐标对 | ① `node --check thincoder-vscode/src/specs.mjs` exit 0；② `node scripts/api-contract.mjs`；③ **在 ② 之后**跑 `grep -rn ctxPercentForModel thincoder-vscode/src thincoder-vscode/test thincoder-vscode/webview thincoder-vscode/AGENTS.md docs/vsc docs/core/design scripts` ⇒ 0 命中；④ 回读 `grep -n "export function ctx" thincoder-vscode/src/specs.mjs` ⇒ `:83` / `:89`，且 `grep -n "specs\.mjs:" docs/vsc/design/WEBVIEW.md` ⇒ 2 行、值同为 `:83` / `:89` |

**射程与顺序（判据诚实面）**：

- **无可运行测试断言被删件**：`thincoder-vscode/test/**` 全档不含 `specs`（本会话 `grep "specs" thincoder-vscode/test` = 0 命中）⇒ 判据 = 上表实跑的检查与结果。整包 `npm test` 是发布门，留给收口轮整包跑，不列本批验收。
- **「全仓 0 命中」收窄为 ③ 的作用域**：该名全仓实读 24 处（本会话 `grep`，修正落盘前）—— `thincoder-vscode/src/specs.mjs` 4（`:9` / `:11` / `:81` / `:89`，即本批删除面）· `docs/core/design/API-CONTRACT.md:4590` 1（②重生成后消失）· 批档 15（本档 11 + 其余 4）· `thincoder-vscode/docs/_archive/design/PROVIDER.md:417` 1 · 仓根构建日志 3。4 + 1 + 15 + 1 + 3 = 24。
- **冻结存量不入判**：批档（过程记录）、`_archive`（归档不作现状依据）、仓根构建日志（`_f10f11-vsc-after.log:232` / `_f10f11-vsc-baseline.log:231` / `_fix88-vsc-wrap.log:245`）—— 改它们等于改历史。故 §1.4 的「全仓 0 命中」按 ③ 的作用域读。

#### 2.6-A 未结措辞账的处置（`docs/batches/2026-10-27-design-drift-close.md:273`）

该行记「`docs/vsc/design/WEBVIEW.md:199` / D-W33 外延过宽（端侧另有取用）」，去向写「台账，随下次触碰该档收窄」。本批确实触碰了该档，故必须表态：

- **本批不收窄该句**。收窄「`providerSpec(provider).context` 只在核单点出现」是对设计档规范句的语义改判，超出 §1.1 三条的落点；修正轮不带新语义。
- **本批确实改变了该账的事实面**：两个反例之一 `ctxPercentForModel` 随本批删除而消失。
- **另一个仍在**：`thincoder-vscode/src/extension/provider-context.mjs:38` 仍 `context: providerSpec(entry).context` —— 设置面把核解析值透传出去（不算百分比），不是百分比第二式；但它确实在端侧取了该量，故 `:199` 那句的外延仍未收窄。
- **处置**：台账原行留着不动；收窄拟稿上抛主 agent 裁（§2.11）。下一人读这段即可判「还没消、消到什么程度」。

#### 2.8-A 集成测试差量（起点 = `test/RTM.md`，本会话实读）

- **起点读数**：该档 253 行；VS Code 端节 = `:223`–`:228`（标题 `:223` · 「**尚无集成用例**——本端集成层尚未建立」`:225` · 空表头 `:227`–`:228`，零用例行）。
- **本端唯一百分比相关故事** = §16「状态行百分比与压缩判据同尺」的 `16-1`（`:202`）—— 它是 CLI 端用例（进入口 = CLI 恢复带样本的会话；证据档 `test/integration/context-percent-calibrated.test.mjs`），断言状态行与 `stats` 同值，不涉及 VSC 端任何一行。
- **据此**：现有用例断言的业务可观测结果无一被本批改变 ⇒ 破 0；VSC 节本为零行 ⇒ 冗余 0；两条建用入口（产品真需要的业务场景 ∥ 生产真出现过的问题）都不成立 ⇒ 缺 0。**不新增行。**

#### 2.11 上抛项（修正轮）

- **`[上抛·待裁]` 收窄拟稿（承 §2.6-A）**：建议把 `docs/vsc/design/WEBVIEW.md` §4.6 `:199` 与 D-W33 的「`providerSpec(provider).context` 只在核单点出现」改为「历史读数口径的分母只在核单点出现；端侧只在设置面直取该值透传（`thincoder-vscode/src/extension/provider-context.mjs:38`），不在此派生百分比」。**本批未改**——它动的是规范句语义，须主 agent 决定并入本批还是另起批次。
- **`[上抛·知会]` §1.4「全仓 0 命中」已按作用域收窄**（读数见 §2.5-A 射程说明）：全仓不可达，冻结存量的历史行不入判。
- **`[上抛·知会]` §2.9 首条（`docs/core/design/DOC-DISCIPLINE.md` 记「六个 CANON 操作数」vs 实现七名）仍在等裁**，本批未动，与本修正轮无关。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**状态行**：评审通过（第 3 轮回评：第一轮 8 条 = 7 Fixed + 1 Accepted，🔴 0 · 🔵 2（2026-10-28））

审查对象 = 本批 §2 设计面（`#1736` / `#1838` / `#1844`②）+ 设计席本会话笔的 `docs/vsc/design/WEBVIEW.md`。
审查限制：审查上下文未提供文档地图与项目标准档 ⇒ 文档归属按 `thincoder/docs/` 现址判，方法学按批档 §1–§2 与 Project Guide 判。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | 验收（acceptance） | 🔴 | 第 3 条验收写成整包套件跑：批档 `tests/…` 行 —— 见 §2.5 第 3 行「`cd thincoder-vscode; npm test` 5 档全绿」，§2.4「反馈回路 = `node --check thincoder-vscode/src/specs.mjs` + `thincoder-vscode` 包既有 5 档（… `npm test` 单入口）」同句；实读 `thincoder-vscode/test/files.mjs` 五档无一引用 `specs.mjs` / `ctxUsageForHistory` / `ctxPercentForHistory`（test 树全扫 0 命中）⇒ 这半条与本改动零关系，是发布门槛被写成了本轮成本 | 验收行换成改动面检查：`node --check thincoder-vscode/src/specs.mjs` + `node scripts/api-contract.mjs`（重生成后回读）+ 已有三条作用域 grep；并写明「无可运行测试断言该删除件 ⇒ 判据 = 实跑的检查与结果」，把 `npm test` 从验收行移出（需要时留给收口轮整包跑） |
| 2 | 文档归属（ownership） | 🔴 | 同一机制两处两个坐标：`docs/vsc/design/WEBVIEW.md:202` 已改「**派生单点** = `thincoder-vscode/src/specs.mjs:83`」，而 `docs/vsc/design/WEBVIEW.md:734`（D-W33）仍写「派生单点 = `thincoder-vscode/src/specs.mjs:94` `ctxUsageForHistory`…`ctxPercentForHistory`（`:100`）」；批档 `docs/batches/2026-10-28-product-text-sweep.md:83` 只声「§4.6 两处——派生单点坐标 `:94`→`:83`」。实读 `thincoder-vscode/src/specs.mjs` 101 行、`:94` / `:100` 为现址；−11 行后 = 90 行 ⇒ D-W33 两坐标越档尾（悬空）。本批判据抓不到：描述档新句自陈「Line-number coordinates…are not section references and are not judged as such」，验收 ③ 只 grep 符号名不 grep 坐标 | §2.2 / §2.4 的 `docs/vsc/design/WEBVIEW.md` 改写面补第三处（D-W33 的两个坐标 + `ctxPercentForHistory` 那句），并把「落盘后 `grep -n \"specs.mjs:\" docs/vsc/design/WEBVIEW.md` 两处 = `:83` / `:89`」写进验收 |
| 3 | 清晰（landing text） | 🟡 | 新句指向反了且与既有块重复：批档 `docs/batches/2026-10-28-product-text-sweep.md:111`「and — on the prompt face only — the seven operand names listed above」——七名清单在 `thincoder-core/tool-docs/doc_check.md:20`（“Operand names.” 块，:13–:17），位于被替换的 5–10 行**之下**；读者自上而下读先遇「listed above」而无清单，且该块已逐字列七名（描述重复） | 把「listed above」改为指向下方该块（或直接删这半句，交「Operand names」块自述）；顺带核一眼替换后上下文是否仍成句 |
| 4 | 验收（verifiability） | 🟡 | 验收范围与顺序两处不自洽：§1.4 写「全仓 `ctxPercentForModel` **0 命中**」，而 §2.5 ③ 只扫五个作用域、§2.5 射程说明自陈 `docs/batches/**` 与 `thincoder-vscode/docs/_archive/**` 留存历史行 ⇒ “全仓 0” 不可达；另 ③ 的作用域含 `docs/core/design`，可 `docs/core/design/API-CONTRACT.md:4590`「\| `ctxPercentForModel` \| `thincoder-vscode/src/specs.mjs:81` \|」要到 ④ 重生成才消失 ⇒ ③ 在 ④ 之前必红 | 验收口径统一为 §2.5 的作用域 grep，并在行内注明「API-CONTRACT 该行由 ④ 重生成后消失」；§1.4 的“全仓”按此收窄 |
| 5 | 集成测试差量 | 🟡 | §2.8 给了「**破 0 · 冗余 0 · 缺 0，不新增行。**」与正当理由，但未起点于 `test/RTM.md`、无一行读数作凭：实读该表 252 行，VS Code 端故事表（:223–:228）现为零行，唯一百分比相关故事 = §16 的 `16-1`（:202，CLI 面）；本改动动的是 VSC 产品码 ⇒ 差量判断成立，但评审看不到“读过”的痕迹 | §2.8 补一行读数：点明所查 RTM 故事/行（§16 `16-1` 与本端空表 :223–:228），据此写「0 破 ∥ 0 冗余 ∥ 0 缺」 |
| 6 | 协调项（R5） | 🟡 | 本批触碰的 §4.6 上挂着一条未了的措辞账：`docs/batches/2026-10-27-design-drift-close.md:273` 要求「随下次触碰该档收窄」§4.6 那句「`providerSpec(provider).context` 只在核单点出现，端侧不二次派生同一个量」；删掉 `specs.mjs:83` 后该断言仍过宽——`thincoder-vscode/src/extension/provider-context.mjs:38` 仍「context: providerSpec(entry).context」 | §2.6 边界段写明该行是否随本批收窄、抑或另立账；不写则下一人无从判它是否已消 |
| 7 | 准确（delta 描述） | 🔵 | §2.4 说 `docs/core/design/API-CONTRACT.md`「−1 · 重生成后该符号行消失」，实读生成块 `:4587`–`:4592` 六行皆带 `src/specs.mjs` 坐标 ⇒ 重生成是「删 1 行 + 改锚 5 行」（`:17`→`:16` · `:62`→`:61` · `:71`→`:70` · `:94`→`:83` · `:100`→`:89`），行数仍 −1 | 描述改成「删 1 行 + 五处坐标随重生成移动」，免落地席按“只少一行”对 diff |
| 8 | 文档卫生（R7c） | 🔵 | 本档 §2 有两条状态行：`:63` 仍「**状态行**：（eng-designer 写入时更新）」，`:66` 才是「设计完成（…）」 | 留一条（`:63` 的占位态删去或并入真状态行） |

汇总：🔴 2 · 🟡 4 · 🔵 2。

VERDICT: changes-required

### 轮次 2（评审子代理）

### 设计评审 第 2 轮（只验第一轮 8 条）

**状态行**：评审通过（🔴 0 · 待修 🟡 0 · 🔵 2）

**审查对象**：`docs/batches/2026-10-28-product-text-sweep.md` §2 设计面（`#1736` / `#1838` / `#1844`②，现行文本 = §2.10 起的 A 段）+ `docs/vsc/design/WEBVIEW.md` 落盘面。

**审查限制**：上下文未提供文档地图与项目标准档 ⇒ 文档归属按现址判、方法学按批档 §1–§2 判；本轮只验第一轮 8 条与其修正引入项。

| # | Orig# | File | Severity | Status | Notes |
|---|-------|------|----------|--------|-------|
| 1 | 1 | 批档 §2.5-A | — | Fixed | 整包套件已出验收：现行判法为「① `node --check thincoder-vscode/src/specs.mjs` exit 0；② `node scripts/api-contract.mjs`；③ **在 ② 之后**跑 grep ⇒ 0 命中；④ 回读」。射程段明写「无可运行测试断言被删件」与「整包 `npm test` …不列本批验收」。实读 `scripts/` 与 `thincoder-vscode/webview/` 对该名 0 命中 ⇒ 新增的两段作用域可达 |
| 2 | 2 | `docs/vsc/design/WEBVIEW.md` | — | Fixed | 实读 `:202`「**派生单点** = `thincoder-vscode/src/specs.mjs:83` `ctxUsageForHistory`」与 `:734`（D-W33）「派生单点 = `thincoder-vscode/src/specs.mjs:83` `ctxUsageForHistory`…`ctxPercentForHistory`（`:89`）」；该档 `specs.mjs:` 恰 2 行，值仅 `:83` / `:89`，无 `:94` / `:100` 残值 |
| 3 | 3 | 批档 §2.3-①-A | — | Fixed | 置换稿末句改为下指：「the seven operand names the `Operand names` block below」+ 次行「lists.」，且不再复述七名；该块在 `thincoder-core/tool-docs/doc_check.md:13`–`:22`，确在被替换的 `:5`–`:10` 之下 |
| 4 | 4 | 批档 §2.5-A | — | Fixed | 重生成排在作用域 grep 之前；作用域明列且不含 `docs/batches/**` / `_archive` / 仓根日志；射程段给逐处读数与「冻结存量不入判」。§1.4 原句仍写「全仓」，已由 §2.11「上抛·知会」收窄（§1 非设计席可改） |
| 5 | 5 | 批档 §2.8-A | — | Fixed | 起点已改为 `test/RTM.md` 并给逐行读数；实质结论经本轮实读复核成立（VS Code 端节仍零用例行）。坐标漂值另列 N1 |
| 6 | 6 | 批档 §2.6-A · §2.11 | 🟡 | Accepted | 有理由的非修：收窄 `:199` 规范句 = 语义改判、超出 §1.1 三条落点；删除只消掉两个反例之一，`thincoder-vscode/src/extension/provider-context.mjs:38` 仍在；台账原行不动 + 收窄拟稿上抛待裁。理由成立，闭项 |
| 7 | 7 | 批档 §2.4-A | — | Fixed | 差量改述为「删 1 行 + 重锚 5 行」并逐坐标列明（`:17`→`:16` · `:62`→`:61` · `:71`→`:70` · `:94`→`:83` · `:100`→`:89`），与实读算术一致 |
| 8 | 8 | 批档 §2 | — | Fixed | §2 段首仅一条状态行（`:88`），占位状态行已去 |
| N1 | (new) | 批档 §2.8-A | 🔵 | New | 坐标已漂：实读 `test/RTM.md` = 263 行，VS Code 端节在 `:233`–`:238`（设计写「该档 253 行 … `:223`–`:228`」，那里现是第 19 个故事）。实质结论不受影响——该节仍「**尚无集成用例**——本端集成层尚未建立」+ 空表头零行 |
| N2 | (new) | 批档 §2.5-A | 🔵 | New | 「该名全仓实读 24 处 … 批档 15（本档 11 + 其余 4）」是修正落盘前读数；现同一份批档自身即 15 处，全仓 = 28。作用是证明「全仓 0」不可达，故不影响判据 |

**正面核验（本轮实读）**：`thincoder-vscode/AGENTS.md` 的 `24` 仅 `:15` / `:136` 两处 ⇒ 验收 ②「grep ⇒ 0 行」改后可达；`thincoder-vscode/src/specs.mjs` 该名 4 处（`:9` / `:11` / `:81` / `:89`）与设计的删除面一致；`docs/core/design/API-CONTRACT.md:4590` 仍是删前状态，与「② 之后才清」的顺序自洽。

汇总：🔴 0 · 🟡 1（Accepted，不拦）· 🔵 2。

VERDICT: pass

### 轮次 3（评审子代理）

### 设计评审 第 3 轮（复核第一轮 8 条 · 补 §3 段级状态行）

审查对象 = 本批 §2 设计面（现行文本 = §2.10 起的 A 段）∥ `docs/vsc/design/WEBVIEW.md` 落盘面。
本轮只复核第一轮 8 条及其修正引入项，不搜新问题。

| # | Orig# | File | Severity | Status | Notes |
|---|-------|------|----------|--------|-------|
| 1 | 1 | 批档 §2.5-A | — | Fixed | 实读 `:289` 判法 = ① `node --check …` exit 0；② `node scripts/api-contract.mjs`；③ **在 ② 之后**跑作用域 grep ⇒ 0 命中；④ 坐标回读。`:293` 明写「整包 `npm test` 是发布门，留给收口轮整包跑，不列本批验收」 |
| 2 | 2 | `docs/vsc/design/WEBVIEW.md` | — | Fixed | 实读 `:202`「**派生单点** = `thincoder-vscode/src/specs.mjs:83` `ctxUsageForHistory(history, provider, ratio)`」与 `:734`（D-W33）「派生单点 = `thincoder-vscode/src/specs.mjs:83` `ctxUsageForHistory`，委托核 `historyReading`；`ctxPercentForHistory`（`:89`）」。本轮 grep 该档 `specs.mjs:` 恰 2 行，值仅 `:83` / `:89`，无 `:94` / `:100` 残值 |
| 3 | 3 | 批档 §2.3-①-A | — | Fixed | 实读 `:266`–`:267`：七名改为下指 `Operand names` 块（「the … block below ∕ lists.」），且不再复述七名；该块在被替换面 `:5`–`:10` 之下 |
| 4 | 4 | 批档 §2.5-A | — | Fixed | `:289` ② 排在 ③ 之前；③ 作用域明列且不含批档与归档；`:291`–`:295` 射程段把「全仓 0 命中」按 ③ 的作用域读。§1.4（`:32`）原句仍写「全仓」，已由 `:315` 上抛·知会收窄（§1 非设计席可改） |
| 5 | 5 | 批档 §2.8-A | — | Fixed | `:306`–`:310` 起点 = `test/RTM.md`，给逐行读数与破 ∕ 冗余 ∕ 缺三条结论。读数漂值见 N1 |
| 6 | 6 | 批档 §2.6-A · §2.11 | 🟡 | Accepted | 有理由的非修：`:301`「本批不收窄该句」——收窄 = 规范句语义改判、超出 §1.1 三条落点；`:302`–`:303` 记删除只消两个反例之一、`thincoder-vscode/src/extension/provider-context.mjs:38` 仍在；`:304` 台账原行不动 + `:314` 收窄拟稿上抛待裁 |
| 7 | 7 | 批档 §2.4-A | — | Fixed | `:279`「删 1 行 + 重锚 5 行」并逐坐标列明（`:17`→`:16` · `:62`→`:61` · `:71`→`:70` · `:94`→`:83` · `:100`→`:89`） |
| 8 | 8 | 批档 §2 | — | Fixed | 本轮 grep「**状态行**」：§2 内仅 `:88` 一条（`:6` 属 §1、`:322` ∕ `:346` 属 §3）；`:89` 是模板占位行，非状态行 |
| N1 | (new) | 批档 §2.8-A | 🔵 | New | 沿用上轮：`test/RTM.md` 本轮实读 = 263 行，VS Code 端节在 `:233`–`:238`（该节仍「**尚无集成用例**——本端集成层尚未建立」+ 空表头零行）。设计读数引 `docs/batches/2026-10-28-product-text-sweep.md:308`: - **起点读数**：该档 253 行；VS Code 端节 = `:223`–`:228` ⇒ 与现行档差 10 行。实质结论（破 0 ∕ 冗余 0 ∕ 缺 0）不受影响 |
| N2 | (new) | 批档 §2.5-A | 🔵 | New | 沿用上轮：设计读数引 `docs/batches/2026-10-28-product-text-sweep.md:294`: - **「全仓 0 命中」收窄为 ③ 的作用域** —— 该名全仓实读 24 处（本会话 `grep`，修正落盘前）。本轮 grep 本档自身已 15 处 ⇒ 「本档 11 + 其余 4」是落盘前读数；该句只用于证明「全仓 0」不可达 ⇒ 不影响 ③ 判据 |

汇总：🔴 0 · 🟡 1（Accepted，不拦）· 🔵 2。

VERDICT: pass

## §4 用户批准（主 agent）

### 4.1 用户批准（2026-10-28 00:49）

**用户逐字**：「都批，自动跑完」—— 覆盖 A / B / C / D 四批的批准门（FR36 整批令）。

**⇒ 本批批准面 = §2.5-A 三条落点（`thincoder-core/tool-docs/doc_check.md` 判面 · `thincoder-vscode/AGENTS.md` 档数退役 · 删 `ctxPercentForModel`）+ 五处门面强制修 + `docs/core/design/API-CONTRACT.md` 重生成。**

**⇒ 明确不在批准面内的一条**：删件后 `docs/core/design/MODEL-SPECS.md:1885` 与 `docs/core/design/CONTEXT-COMPACTION.md:520` / `:536` 两处坐标失真 —— 已记台账 `#1860`，本批不声称「设计面坐标已全对」。

## §5 实施记录（eng-coder）
**状态行**：实施完成 2026-10-28（三条全落 · 两档设计面坐标已裁定转另批 · 详见 5.4）



### 5.1 三条落地（逐条读数，均本轮实读）

| # | 台账 | 动作 | 落点 | 读数 |
|---|---|---|---|---|
| 1 | `#1736` | Anchors 段 `:5`–`:10` 六行整体置换为 §2.3-①-A 十一行（+5） | `thincoder-core/tool-docs/doc_check.md` | 该档 79 → 84 行；置换稿与 §2.3-①-A 逐字一致；新增 token 全落三免族（`AGENTS.md` / `SKILL.md` / `project_rules.md` / `todo.md` 属 `thincoder-core/doc-check/anchors.mjs:28`–`:31` 类名闭集；`x.md` / `file.md` / `foo.md` / `example.md` 属 `:34`–`:36` 占位词干）；`*.md` 与裸 `.md` 不构成 token ⇒ 本档门面零新增 `档缺` |
| 2 | `#1838` | 两处绝对档数退役，不换数字 | `thincoder-vscode/AGENTS.md` `:17` / `:138` | `grep "24"` 该档 **0 命中**；`:138` 指向的 `EXPECT` 实在盘（`thincoder-vscode/scripts/check-vsix.mjs:37` `const EXPECT = { prompts: 16, "tool-docs": 54 }`） |
| 3 | `#1844`② | 死函数 `ctxPercentForModel` 四段删除（`:9` 整行 · `:11` 句尾 · `:76`–`:85` 整段 · `:89`–`:90` 两行改写） | `thincoder-vscode/src/specs.mjs` | 101 → 90 行；末行 = `:89` `ctxPercentForHistory`；`ctxUsageForHistory` `:83`；保留面 `providerSpec` 的 import（`:12`）与再出口（`:16`）未动 |

**生成面重生成**（命令与设计字面不同，理由见 5.3 ①）：先 `--check` 取改前漂移 = 盘上 4609 行 ∕ 生成 4608 行（恰多出被删那一行）；再 `--write` ⇒ `WROTE(api-contract): 4606 条`；复跑 `--check` ⇒ `OK(api-contract): 骨架零漂移`（exit 0）。

**生成块差量** = 删 1 行 + 重锚 5 行，与 §2.4-A 预测逐个同值：`:17`→`:16` · `:62`→`:61` · `:71`→`:70` · `:94`→`:83` · `:100`→`:89`。块外零改动（git diff 逐行核）。

### 5.2 验收对照（§2.5-A 三行，逐项实跑）

| # | 判据 | 实跑结果 |
|---|---|---|
| 1 | ① `doc_check(mode:"gate")` 首行 PASS；② 三族逐族对读代码 | ① `DOC-CHECK GATE: PASS`（3 档全清）；② 类名九名闭集 · 占位（`stem.length <= 1` + 词干集）· 操作数七名仅提示词面——**零遗漏、零加宽** |
| 2 | ① 同 gate；② `grep "24"` ⇒ 0 行 | ① PASS；② 0 行（改前实读 = `:15` / `:136` 两处，与 §2.1 前提更正一致） |
| 3 | ① `node --check` exit 0；② 生成器；③ ② 之后作用域 grep ⇒ 0；④ 坐标回读 | ① exit 0；② 见 5.1；③ 七面（`thincoder-vscode/src` · `thincoder-vscode/test` · `thincoder-vscode/webview` · `thincoder-vscode/AGENTS.md` · `docs/vsc` · `docs/core/design` · `scripts`）**全 0 命中**；④ `export function ctx` ⇒ `:83` / `:89`，`docs/vsc/design/WEBVIEW.md` 的 `specs.mjs:` 恰 2 行、值仅 `:83` / `:89` |

**射程**：全仓该名只余冻结存量——`docs/batches/**`（过程记录）· `thincoder-vscode/docs/_archive/design/PROVIDER.md:417`（归档不作现状依据）· 仓根三份构建日志。改它们等于改历史。

**测试面**：`thincoder-vscode/test/**` 对 `specs` ∕ `ctxPercent` ∕ `ctxUsage` 零命中 ⇒ 无运行用例断言被删件（§2.5-A 自陈面成立）。整包 `npm test` 未跑，按 §2.5-A 留给收口轮发布门。另跑 `node scripts/check-syntax.mjs` ⇒ `144 JS files OK`。

### 5.3 偏差披露（两处）

#### ① 生成器命令少一个 `--write`（判据面，非语义面）

§2.2-A ∕ §2.5-A ② 写的是 `node scripts/api-contract.mjs`。实读 `scripts/api-contract.mjs:101` 该行 ⇒ `const mode = argv.includes("--check") ? "check" : argv.includes("--write") ? "write" : "stdout"`。

⇒ 无旗形只打印、**不落盘**；照抄则 `docs/core/design/API-CONTRACT.md:4590` 那行不消失，验收 ③ 必红。

处置：按设计陈明的意图跑 `--write`（§2.2-A 原话「删码后跑…重生成，该行自然消失」「手改生成块 = 下次重生成即回滚」），并先 `--check` 取改前读数留证。语义未变，命令字面与设计不同，故记此。

#### ② 门面强制修 · `thincoder-vscode/AGENTS.md` 五处（不在 §2.1 三条之内）

首次 gate 判 `DOC-CHECK GATE: REFUSED（锚 5 条 · 1 段文字太长，难于阅读）`。该档在交付门上整档判、且属本批产品文本面，故按「门命中同轮修」处置。改前改后形态：

```text
改前 :37        [ARCHITECTURE.md](../docs/core/design/ARCHITECTURE.md)   链接文字为裸名 ⇒ 判档缺
改前 :97-:103   WEBVIEW.md §8（裸名 ×4）
改前 :5         概览段单段超 300 字
改后 :39        反引号包全路径（本档 :22/:35 房规形）
改后 :99/:100/:101/:105   docs/vsc/design/WEBVIEW.md §8
改后 :5         概览段拆为两段
```

- 目标是真件：`docs/core/design/ARCHITECTURE.md:33` `## 3. 模块地图（当前态）` ∕ `:92` `### 3.1 VSC 壳层装配地图`；`docs/vsc/design/WEBVIEW.md:748` `## 8. UI / 交互决策落档`。
- 五处都是形态（指针全路径化、超长段拆分），不涉语义。代价 = 该档 138 → 139 行，与 §2.4-A「±0」不符，差的就是这次拆分。

### 5.4 收口口径（父侧裁定 2026-10-28）

- **不补不改**：`docs/core/design/MODEL-SPECS.md` 与 `docs/core/design/CONTEXT-COMPACTION.md` 两档不在本席笔域（前者设计面；后者 A 批 `#1853` 在持）。本批零触碰。
- **另记台账**：由父侧另批再锚（父侧已记）。
- **本批只声称**：§2 三条落点已落、验收按 §2.5-A 判法实跑全绿。
- **本批不声称**：设计面坐标已全对 —— 删件后 `docs/core/design/MODEL-SPECS.md:1885` 与 `docs/core/design/CONTEXT-COMPACTION.md:520` ∕ `:536` 两处坐标失真，待另批再锚。
- **验收面已知盲区（须带到收口）**：§2.5-A ④ 的坐标 grep 只覆盖 `docs/vsc`，③ 又按符号名 grep ⇒ 「只写坐标、不写符号名」的引用不在本批判据内，本次正是这样漏掉上两档的。下一批再删件时，坐标须按行号坐标类别扫全 `docs/` 树；本批只作读数记录，未扩面修。

### 5.5 评审轮次与终态

- **内部差异审计（explore · 第 1 轮）**：`VERDICT: CONVERGED`——五项目标项全 MATCH；另列两条设计侧记账漂移（AGENTS.md 行数与改动面未随门面修更新；`thincoder-vscode/src/specs.mjs` 「90 行」按内容行读是 89，坐标 `:83` / `:89` 两读法一致）。
- **内部代码评审（advisor · 第 1 轮）**：`VERDICT: changes-required`，🔴 1 · 🟡 3 · 🔵 2。🔴 = 5.4 那两档设计面坐标，逐字复核实为真；处置按父侧裁定（不直笔、另批再锚）。
- **终态：`clean`（三项交付面）· 一条已裁定外置**——三条实施项全落、验收全绿；未闭合面 = 两档设计面坐标，已由父侧裁定转另批，本批不越笔。

### 5.6 知会（两条，均未改）

- **措辞精度**：`thincoder-core/tool-docs/doc_check.md:11`「Three name families are never extracted」对类名族 ∕ 占位族不精确——两族实际先被抽出、再于 `thincoder-core/doc-check/anchors.mjs:127` 逐 token 跳过，只有操作数族是抽前剥除。行为结论（never judged）与代码一致，不构成加宽 ∕ 收窄；文本是设计稿原文，本席未改。
- **§N 不入节判**：门面修后 `§N` 落在 code span 之外，而 `thincoder-core/doc-check/anchors.mjs:24` 的节指示组只吃紧邻 `.md` 的空白 ⇒ 这些 §N 不经机检。本轮逐个手核在盘：ARCHITECTURE §3 ∕ §3.1 · WEBVIEW §8 · SESSION §6.10 · TESTING §10 ∕ §2.3 · WEBVIEW-PROTOCOL §2 · PROJECT-SWITCHER §4.1 · TOOLS §6.22。故 gate PASS 不可当「§ 坐标已核」引用。
- **`docs/core/design/DOC-DISCIPLINE.md:1155` 六名 vs 实现七名**：设计席已作 §2.9 首条上抛，本批未动；落地文本取与代码一致的七名一侧。

## §6 验证与收口（父代理）

## 6.1 验证与收口（父侧 2026-10-28 00:5x）

### 6.2 交付对照

| # | 状态 | 条目 | 落地读数（父侧亲测，非引用） |
|---|---|---|---|
| 1 | ✅ Done | `#1736` —— `doc_check` 判面改「抽取后幸存者」 | `thincoder-core/tool-docs/doc_check.md` **84 行**（改前 79），六行置换为十一行 |
| 2 | ✅ Done | `#1838` —— `thincoder-vscode/AGENTS.md` 档数退役，**不换数字** | 该档 `24` 零命中；`:138` 改指 `thincoder-vscode/scripts/check-vsix.mjs:37` 的 `EXPECT` |
| 3 | ✅ Done | `#1844`② —— 删死函数 `ctxPercentForModel` | `thincoder-vscode/src/specs.mjs` **90 行**（改前 101）；`:83` `ctxUsageForHistory` ∥ `:89` `ctxPercentForHistory` | 
| 4 | ✅ Done | 五处门面强制修（门命中同轮修） | `AGENTS.md` **140 行**（改前 138 + 2 处拆段） |
| 5 | ✅ Done | `docs/core/design/API-CONTRACT.md` 重生成 | 删 1 行 + 重锚 5 行（`:17`→`:16` · `:62`→`:61` · `:71`→`:70` · `:94`→`:83` · `:100`→`:89`） |

### 6.3 机检读数（本轮实跑）

- `git grep ctxPercentForModel -- "*.mjs" "*.js"` ⇒ **0 命中**（活码面清零）。
- `node scripts/api-contract.mjs --check` ⇒ 骨架零漂移。
- `node thincoder-vscode/scripts/check-syntax.mjs` ⇒ 144 JS files OK。
- `doc_check(mode:"gate")` 五档 ⇒ **PASS · 0 段问题**。
- 三轮评审：changes-required（8 条）→ pass（未签 token）→ **pass（已签）**。

### 6.4 未覆盖面（如实）

- **两处活设计档坐标失真**：`docs/core/design/MODEL-SPECS.md:1885`（其 `:96` 已越档尾）· `docs/core/design/CONTEXT-COMPACTION.md:520` / `:536`（仍写 `:94`）⇒ 台账 `#1860`，另批再锚。
- **验收面盲区（本批实证）**：§2.5-A ④ 的坐标 grep 只覆盖 `docs/vsc`，③ 按符号名 grep ⇒ 「只写坐标不写符号名」的引用不在本批判据内。下一批再删件，坐标须按行号类别扫全 `docs/` 树。
- **生成器偏差**：`scripts/api-contract.mjs` 无 `--write` 只打印不落盘，实施跑了 `--write` 并先留 `--check` 读数 —— 语义未变、命令字面不同，已披露。

### 6.5 结算清单

- **§2 ↔ 设计档对账**：§2.5-A 三条落点逐条对现文，一致。
- **前批遗留交叉核**：`#1838` / `#1844`② 两条旧账由本批结清（`#1844`① 由 A 批 `#1853` 结清）。
- **修正轮落地前提**：修正轮已落、已复评 pass。
- **用户面同步**：`thincoder-vscode/AGENTS.md` 是产品文本面，改动已随本批落；无 UI 变化。
- **台账沉降**：`#1854` · `#1838` · `#1844`。
