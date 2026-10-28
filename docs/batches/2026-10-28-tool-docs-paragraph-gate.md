# 2026-10-28 · tool-docs-paragraph-gate
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-28 · 来源 = 用户 2026-10-28 11:15 逐字「就这么做」—— 批准「29 档一次全改 + 同批撤豁免」；用户 11:14 逐字「不不不！你这是继续开口子，为什么要豁免「已登记的长段」？」—— 否决了父侧「先修判据、后修内容」的中间态方案。。
> 台账 = #1868（PROMPT-SYSTEM · 归批）。前情 = 2026-10-27-tool-docs-judge-scope（已收口 2026-10-27）—— 该批给 `thincoder-core/tool-docs/**` 加了「只判锚、不判段长」的豁免。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-28
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 本批范围（父侧 2026-10-28 11:1x）

**撤销 `thincoder-core/tool-docs/**` 的段长豁免，并把该面 29 档的 40 个超标段改到合规。**

**⇒ 两件事同批做完，不留中间态。**

### 1.2 为什么撤豁免（父侧自认，不是别人塞的）

**该豁免是 `2d247b33`（`#1849`，2026-10-27）加的，commit message 逐字：**

> **「`thincoder-core/tool-docs/**` 是档注进 tool 定义、读者是模型的面。段判据（「文字太长，难于阅读」）的理由句说的是人读不动，在这个面上不成立」**

**⇒ 它跟同一档的 `:40` 那句**自相矛盾**：**

> **`Line length — a prompt-face file (thincoder-core/prompts/**) is judged line by line: the model reads raw text, so…`**

**★ 同一个事实（模型读 raw text），对 `prompts/**` 推出「逐行判」，对 `tool-docs/**` 却推出「不判」。两条相反的判据，一条理由。**

**⇒ 用户 2026-10-28 11:14 裁定：**「不不不！你这是继续开口子」** —— 父侧随后提的「改成仅豁免已登记长段」也是变相开口子，一并否决。**

**★ 纪律依据**：`An exemption you grant yourself keeps a wrong rule alive because you wrote it` —— 自己开的门，门是错的时候要撤。

### 1.3 豁免不撤的代价（`#1849` 的现场，如实记）

**该批 commit 记：**

> **「54 档里 37 条段命中落 28 档，整个面改不干净 —— 改一句文档就被自己的门拦下（`#1847` 现场：`append §5` 与 `close` 双双被拒）」**

**⇒ 那不是「豁免的理由」，那是**症状**：29 档本身不合规，门一开就全红。**

**★ 所以顺序只能是：**先改内容，再撤豁免**。父侧先前提的「先修判据」顺序是错的（那会把症状盖住，问题留到下一次）。**

### 1.4 真实工作量（**以引擎读数为准** —— 父侧手算出错，已在本节更正）

**口径 = 相邻非空正文行合并成段；空行 / 表格行 / 标题 / 列表项 / 引用块 / 围栏代码（``` ``` ``` 与 `~~~` **两种**）断开。阈值 = 300 字符。**

**★ 父侧脚本的围栏判据只认三反引号、漏了波浪号 ⇒ 少扣一段。下表已是引擎读数。**

| 项 | 读数 |
|---|---|
| 超标段总数 | **39** |
| 受影响档 | **29 / 54** |
| 可纯拆（段内多句） | **37** |
| 需重写（单句超 300） | **2** |

**★ 最重的四段（整段到底）：**

| 档 | 段首行 | 字数 | 句数 |
|---|---|---|---|
| `timer` | `:1` | **1662** | 13 |
| `settings` | `:1` | 1418 | 8 |
| `edit` | `:1` | 1394 | 7 |
| `verify` | `:1` | 1284 | 8 |

**★ 字数以引擎/实跑读数为准（父侧手算的 1674 ∥ 1423 多算了句间分隔，见 §1.7）。**

**⇒ 这四段都是**一整段到底**（非空行 = 1 或 6-13 行），要按句意找分点。**

**★ 段数最多的档：`subagent` **8 段**（`:11` `:14` `:17` `:20` `:34` `:39` `:52` `:56`）· `doc_check` 3 段（`:12` `:21` `:62`）· `read_history` 3 段（`:3` `:5` `:7`）。**

### 1.5 两段需重写（拆不开，得改句子）

| 档 | 段首行 | 字数 | 现状 |
|---|---|---|---|
| `git` | `:3` | 340 | 单句「**Route to git instead of bash** — every sub-command maps to ...」 |
| `read_history` | `:7` | 314 | 单句「检索/记忆族选哪个：查**本会话**说过/裁定过 → read_history（默认）；…」 |

**⇒ 这两段是**单句超 300**，插空行拆不开 —— 要断句或改写。**改的是句子结构，不是语义。**

### 1.6 实施拆两个 dispatch（纪律：一个 dispatch ≤15 文件）

**29 档 > 15 ⇒ 必须拆。父侧按段数 + 依赖分：**

- **dispatch 甲（15 档 / 21 段）**：`subagent`(8) · `doc_check`(3) · `read_history`(3) · `timer` · `settings` · `edit` · `verify` · `git`(需重写) · `memory` · `task` · `ssh` · `doc_search` · `goal` · `lint`
- **dispatch 乙（14 档 / 19 段）**：其余（`skill` `execute` `plan` `code_search` `consult_start` `consult_stop` `manifest-read` `manifest` `recent_changes` `browser` `read_image` `repo_outline` `delete` `fetch` `websearch`）

**★ 分组可调，但两个 dispatch 的改动面**必须不重叠**（同档只进一个）。**

### 1.7 设计席两条上抛的裁定（父侧 2026-10-28 11:3x）

| # | 上抛 | 裁 |
|---|---|---|
| 1 | **需求档未随动**：`docs/core/requirements/DOC-CHECK.md` F3 尾仍写「判据适用面分层：工具描述面只判锚、不判段长」，`test/RTM.md` 引它 ⇒ 三方不同源 | **父侧已同批改完（三处，见 1.8）。** |
| 2 | **§1.4 计数差 1**：设计席用引擎 `checkParagraphs` 实跑得 **39 段 / 29 档**，§1.4 记 40 段；差项 = `thincoder-core/tool-docs/doc_check.md:21`，落在 `~~~text` 围栏内，引擎不计段。最长段 = `thincoder-core/tool-docs/timer.md:1` **1662 字符**（§1.4 记 1674） | **按 39 为准。**父侧脚本的围栏判据只认三反引号、漏了波浪号 `~~~` ⇒ 40 与 1674 都是父侧的错。**§1.4 的两处数字以本节为准。** |

### 1.8 需求档与 RTM 的三处改述（父侧笔，同轮已落）

**用户 11:14 裁定撤豁免后，需求档那句就是错的 —— 留着才是三方不同源。**

| 处 | 改前 | 改后 |
|---|---|---|
| `docs/core/requirements/DOC-CHECK.md:20`（F3 尾） | 「**判据适用面分层**：工具描述面只判锚、不判段长——该面的读者是模型…在这个面上不成立」 | 「**判据不分适用面**：两条判据对所有档一律判，工具描述面同样受段长约束——该面的读者虽然是模型，但长段里的细节照样被跳过；**分面豁免曾使 29 档 39 段长期超标而无人发现**」 |
| `test/RTM.md:80`（第 7 节节注） | 「工具描述面只判锚、不判段长（该面读者是模型，段判据的理由句不成立）」 | 「**两条判据不分适用面，工具描述面同样受段长约束**」 |
| `test/RTM.md:81`（九态行序，7-9 态） | 「7-9 错误（工具描述面：**段不拦**、锚仍拦——收口拒因只点名锚）」 | 「7-9 错误（工具描述面：**锚与段两条同时拦**）」 |
| `test/RTM.md:93`（用例 7-9） | 「拒因**只点名锚**那条；同档 400 字符段**零命中**」 | 「拒因**锚与段两条同时点名**；只删裸档名后仍拒（段那条）；**拆成两段后放行**」 |

**★ 为什么需求档现在改不是抢跑**：用户 11:14 的裁定是**需求变化**，不是设计选择 —— 需求档写的是「引擎判什么」，那条判据已经被判死，留一天就误导一天。

### 1.9 设计席改的文档纪律设计档条 7，父侧已亲验

**`docs/core/design/DOC-DISCIPLINE.md:960` 条 7 重写为「**不分面（段判据对所有面一律判）**：段判据无读者面例外——`thincoder-core/prompts/**` 逐行裸判，其余面（含 `thincoder-core/tool-docs/**`）按段判。」**—— 对。**

**四条支撑齐**：`:962` 依据（引用户 11:14 逐字）∥ `:964` 不分层的判据（锚 ∥ 计数 ∥ 行为不变量，害跟读者是谁无关）∥ `:966` 与 ⑤不分域的关系 ∥ `:968` 两条通路一处落（工具与 batch 门同取 `checkParagraphs`）。`:970` 面谓词只剩 `isPromptFace`；`:972` 十名谓词表删 `isToolDocFace`。

**★ 它顺手收了一处旧账**：`:956` 条 5 原是无射程绝对句，现补「读者面不分层——工具描述面同样判段长（条 7）」—— 那是上一批（`#1849`）评审提过但未收的 🟡。

### 1.10 设计评评审裁定（父侧 2026-10-28 11:2x）

**评审判 changes-required（🔴 3 · 🟡 6 · 🔵 4）。十三条全数接受，全部要修，无 Deferred。**

**★ 三个 🔴 各自是一类病：**

| # | 级 | 病 | 处置 |
|---|---|---|---|
| 1 | 🔴 | **同一机制在一档里两说** —— `docs/core/design/DOC-DISCIPLINE.md:1000` 还写「工具描述面：段不拦、锚仍拦、收口拒因只点名锚」，与同档 `:960`（不分面）和 `test/RTM.md:93`（锚与段两条同时点名）相抵。**而 §2.2 的「五处随动」既漏了它、又列了一处空改（`:2580` 再出口缝名单，该档全文零命中 `isToolDocFace`，名单住 `:2578` 且本无此名）** | 按 D8 删该分句并改述；随动项从 `:2580` 改到 `:1000` |
| 2 | 🔴 | **描述面残留第二处豁免** —— `thincoder-core/tool-docs/doc_check.md:62`「a tool-description file is anchor-judged only」；§2.6 只删 `:35-39`，E2 验收用 `grep "Face scope"` 看不见 `:62` ⇒ **设计自己的 A-DD35 判据⑤（描述面与实际行为不得相抵）在自己的改法下不可达** —— 文件改完还会告诉模型「本面不判段」 | `:62` 列入删改面；E2 验收改为「该档无 anchor-judged only 类绝对句」 |
| 3 | 🔴 | **一档两主** —— §2.9 甲列 `doc_check(2)`、引擎 dispatch 也含 E2 同档，而同一行断言「与甲乙无文件重叠」**是假的**；且该档的 480 / 375 两段（§2.5）在 §2.6 该行未列 ⇒ E2 验收「0 命中」在所列改法下不可达；「3 档」也没含缝档 `scripts/doc-check-paragraph.mjs`（E1 验收要求它零命中） | **整档归引擎 dispatch**（含两段拆分）；按 D3 重数（4 档） |

**★ 六条 🟡 里两条我要特别记：**

- **🟡 5（why 缺口）**：条 7 的 `:964` 只论证了锚 ∥ 计数两条「害与读者无关」的理由，**没给「段判据对模型有什么害」**——而这正是本批要推翻的那条。需求档 `docs/core/requirements/DOC-CHECK.md:20` 有那句（「长段里的细节照样被跳过」），设计档没承。⇒ 补进去，否则下次改判据的人只能靠裁定权威复辩。
- **🟡 6（先例行缺失）**：§3.18 没有「同类先例」行，而同档 §3.19 `:1080` 就有（「同形先例 = §3.15 条目 N」）。**这条我要认**：`#1849` 那批加豁免时我认可了它的写法，**撤的时候却没人要求同一套证据形式**。⇒ 补一行。

**★ 四条 🔵 也全修**（数字漂移 · 坐标漂 · API-CONTRACT 生成区未列 · 执行顺序论证偏重）。

**⇒ 🔵 13 它给了个硬补充**：「引擎 + 缝档必须同 dispatch 落 —— 缝档还 re-export 已删名时，模块链接即抛，`doc_check` 与 batch 门同时坏」。**那是原子性约束，比「先清账再写 §5」硬得多。**

### 1.11 它独立复现了父侧的错，记下

**它实读 `thincoder-core/tool-docs/doc_check.md` `:17`-`:27` 的 `~~~text` 围栏 + 引擎 `paragraph.mjs:31` 认 `~{3,}` ⇒ `:21` 不计段。**

**⇒ 39 段口径成立，父侧 §1.4 的 40 与 1674 都是错的。**

**★ 而且它还补了一处父侧没查的**：`:12` 那个 480 字段的读数与引擎合并规则一致（`:11` 是列表项 ⇒ 断开；`:12`-`:15` 合并）——**两端独立算出同一个数。**

### 1.12 修正轮结果（父侧验收 2026-10-28 11:3x）

**13 条全落，无 Deferred。§2 追加 2.12 定稿节（含受影响表 ∥ dispatch 四组 ∥ 验收更正 ∥ 读数复跑 ∥ KD6 更正）。**

### 1.13 §1.4 父侧已自改（我的笔）

**设计席上抛的第 10 条，我直接改了 §1.4 那张表：**

| 处 | 改前 | 改后 |
|---|---|---|
| 超标段总数 | 40 | **39** |
| 可纯拆 | 38 | **37** |
| `timer:1` 字数 | 1674 | **1662** |
| `settings:1` 字数 | 1423 | **1418** |
| 口径句 | 「围栏代码断开」 | 「围栏代码（三反引号与 `~~~` **两种**）断开」 |

**★ 根因写在节题里了：父侧脚本的围栏判据只认三反引号、漏了波浪号。**

### 1.14 评审那三处「差 1」，是评审错了

**评审 §3 第 4 条报「`batch-close-gate.test.mjs` 实测 346 行」「`scripts/doc-check-paragraph.mjs` 8 行」，第 10 条又隐含 `paragraph.mjs` 149。**

**⇒ 父侧实核（`split('\n').length - 1`，与 `\n` 计数一致，三档末字符都是换行）：**

| 档 | 评审说 | 实为 |
|---|---|---|
| `thincoder-core/doc-check/paragraph.mjs` | 149 | **148** |
| `test/integration/batch-close-gate.test.mjs` | 346 | **345** |
| `thincoder-core/tool-docs/doc_check.md` | 84（§2.6 原记） | **83** |

**★ 设计席报的三个数（148 / 345 / 83）全对，评审各多算 1 —— 它把「读到的最后一行号」当成了行数。**

**⇒ 那正是「行数有两把尺」的老问题；本档统一用 `split('\n').length - 1`，已在 §1.4 口径句写明。**

### 1.15 一条要纠正的：红绿对的口径

**设计席在 2.12.5 登记「撤豁免前跑 = 0 段（先红）· 清账后跑 = 0 段（绿）」。**

**⇒ 那不是红绿对 —— 两个都是 0。**

**★ 真正的红绿对是：**

| 态 | 读数 | 意义 |
|---|---|---|
| **红** | **撤豁免后、清账前** ⇒ 39 段 / 29 档 | 病显形 |
| **绿** | 清账后 ⇒ 0 段 / 0 档 | 病治好 |

**★★ 「撤豁免前 = 0」是**豁免生效**的读数，它是「病被盖住」的证据，不是红。**

**⇒ 复评时让评审验这个口径。**

### 1.16 已定决定：本批收口也走整批令

**- 已定决定**：用户的「自动跑完」覆盖本批剩余链路（三席交付 → 父侧验收 → 收口），不再逐步请示。 · 用户原话：「自动跑完」 · 时间：2026-10-28 11:40

**⇒ 依据 = `docs/core/requirements/ENGINEERING-MODE-V2.md` §13.14（FR36）。**

**★ 本批剩余：**`#17` 引擎席 ∥ `#18` 甲 13 档 ∥ `#19` 乙 15 档 交付后，父侧验 29 档 0 命中 + 54 档锚段行全 0，然后收口。

**★ 一条已记的核项**：被改的那份工具描述档现 **85 行**，设计说改后 **83** —— 段判据是 **0**（硬判据达成），行数差 2 待查（是多加空行还是设计估错）。

## §2 批次任务与设计（eng-designer）
**状态行**：✅ 设计完成 · 2026-10-28
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试覆盖 / 验收对照 / 关键决策 / 上抛项>

**状态行**：✅ 设计完成 · 2026-10-28（eng-designer）

### 2.1 本批条目（覆盖）

| # | 条目 | 判据源 |
|---|---|---|
| E1 | 撤面豁免（引擎）：段判据不再跳过 `thincoder-core/tool-docs/**` | §1.1 · `docs/core/design/DOC-DISCIPLINE.md` §3.18 条 7 |
| E2 | 模型可见描述同拍：删 `thincoder-core/tool-docs/doc_check.md` 的 Face scope 豁免句 | E1 + A-DD35 ⑤ |
| E3 | 该面 29 档 39 段清到 0（本席实测读数，非转述） | §1.4 |
| E4 | 集成验收表面同步：`test/RTM.md` 第 7 节 7-9 行改判 + 节注删豁免句 | E1 |

**不在本批**：阈值（`paragraphMax` / `lineMax` = 300）一字不改；区带豁免（`paragraphExemptZones` = `[]`）不动；`docs/**` 面判据行为零改。

### 2.2 设计档落点（已落盘 · 本批）

**`docs/core/design/DOC-DISCIPLINE.md` §3.18 条 7 重写为「不分面」**：段判据无读者面例外；面谓词只剩 `isPromptFace`（提示词面逐行判）。依据 = 同一事实（模型读原始文本）曾被推出两条相反判据 + 用户 2026-10-28 11:14 裁定。

**同档随动五处已改**：`:159`（影响面句）· `:956`（不分域条尾句）· `:1124`（§3.20 判据 ② 面射程行）· `:2340`（A-DD27 ④）· `:2580`（再出口缝名单，删 `isToolDocFace`）。

**判据面重写**：A-DD35 五条（工具描述面同判段长 / 夹具先落盘 / 锚照判 / 全档读数 0 / 描述面同拍）；DD-137–DD-140 四行改判。`isToolDocFace` 在该档零在册。

**落点读数（本席实跑）**：`doc_check` report（清单 = 该档）⇒ 命中 0 条（锚 0 · 文字太长 0 · 行太长 0）。

### 2.3 机制设计（目标态）

**一句话**：段判据对所有面一律判；工具描述面无谓词、无豁免口、无「只判锚」这一层。

**引擎改动**（`thincoder-core/doc-check/paragraph.mjs`）：删谓词 `isToolDocFace`（现 `:51-56`）与 `checkParagraphs` 的跳过支（现 `:111-114`）；档头注释 `:8-9` 与注释序 `:85` 同删。面谓词族 11 名 → 10 名。

**缝档改动**（`scripts/doc-check-paragraph.mjs`）：再出口名单删 `isToolDocFace` 一名，其余零改（薄档 · 零逻辑不变）。

**两条通路同生效**：`doc_check` 工具与 `batch` 门的 gate 同取 `checkParagraphs`，无第二处面判定要改。

### 2.4 清账标准（39 段的改法）

**判据**：每段 `[...line].length` 求和 ≤ 300（CJK 计 1）。改完即跑 `doc_check` report（清单 = 该档）⇒ 0 命中；这是唯一判准，不靠估字数。

**手段**：句界插空行拆段；单句本身超 300 者，在从句界（`, ; — :` 处）断成两句另起。

**禁**：删事实、改语义、改命令 / 参数 / 坐标 / 码段字面、动围栏与表格结构、缩短到失义。

**工具面同规**：本批对 29 档只做「分段 + 断句」，行为描述不改义——工具描述是模型可见契约。

### 2.5 本席实测读数（`checkParagraphs` 引擎，2026-10-28）

**合计 39 段 / 29 档**。§1.4 记 40 段 / 29 档，差 1 条 = `thincoder-core/tool-docs/doc_check.md:21`：本席实测该行落在 `:17`–`:27` 的 `~~~text` 围栏内，引擎不计段——按引擎读数为准（见 2.10 上抛项）。

| 档 | 段数 | 段首行（字数） |
|---|---|---|
| `thincoder-core/tool-docs/subagent.md` | 8 | `:11`(359) `:14`(377) `:17`(460) `:20`(460) `:34`(552) `:39`(995) `:52`(620) `:56`(627) |
| `thincoder-core/tool-docs/read_history.md` | 3 | `:3`(527) `:5`(685) `:7`(314) |
| `thincoder-core/tool-docs/doc_check.md` | 2 | `:12`(480) `:62`(375) |
| `thincoder-core/tool-docs/timer.md` | 1 | `:1`(1662) |
| `thincoder-core/tool-docs/edit.md` | 1 | `:1`(1394) |
| `thincoder-core/tool-docs/settings.md` | 1 | `:1`(1418) |
| `thincoder-core/tool-docs/verify.md` | 1 | `:1`(1284) |
| `thincoder-core/tool-docs/consult_start.md` | 1 | `:3`(701) |
| `thincoder-core/tool-docs/memory.md` | 1 | `:8`(629) |
| `thincoder-core/tool-docs/task.md` | 1 | `:1`(616) |
| `thincoder-core/tool-docs/ssh.md` | 1 | `:34`(536) |
| `thincoder-core/tool-docs/doc_search.md` | 1 | `:1`(510) |
| `thincoder-core/tool-docs/goal.md` | 1 | `:1`(498) |
| `thincoder-core/tool-docs/lint.md` | 1 | `:1`(489) |
| `thincoder-core/tool-docs/skill.md` | 1 | `:1`(471) |
| `thincoder-core/tool-docs/execute.md` | 1 | `:1`(421) |
| `thincoder-core/tool-docs/plan.md` | 1 | `:1`(416) |
| `thincoder-core/tool-docs/code_search.md` | 1 | `:1`(384) |
| `thincoder-core/tool-docs/consult_stop.md` | 1 | `:1`(378) |
| `thincoder-core/tool-docs/manifest-read.md` | 1 | `:1`(359) |
| `thincoder-core/tool-docs/recent_changes.md` | 1 | `:1`(357) |
| `thincoder-core/tool-docs/browser.md` | 1 | `:1`(356) |
| `thincoder-core/tool-docs/read_image.md` | 1 | `:1`(353) |
| `thincoder-core/tool-docs/repo_outline.md` | 1 | `:1`(343) |
| `thincoder-core/tool-docs/git.md` | 1 | `:3`(340) |
| `thincoder-core/tool-docs/delete.md` | 1 | `:1`(330) |
| `thincoder-core/tool-docs/fetch.md` | 1 | `:1`(325) |
| `thincoder-core/tool-docs/manifest.md` | 1 | `:10`(314) |
| `thincoder-core/tool-docs/websearch.md` | 1 | `:1`(311) |

**段数最多三档**：`thincoder-core/tool-docs/subagent.md`(8) · `thincoder-core/tool-docs/read_history.md`(3) · `thincoder-core/tool-docs/doc_check.md`(2)。

### 2.6 受影响文件（全量）

**产品面（3 档）**：`thincoder-core/doc-check/paragraph.mjs`（现 149 行，预期 −6~−8）· `scripts/doc-check-paragraph.mjs`（−1 名）· `thincoder-core/tool-docs/doc_check.md`（现 84 行；删 `:35-39` Face scope 段 5 行，段落判据句补「全部面同判」一句）。

**文本面（29 档）**：2.5 表所列——只加空行 / 断句，行数增、不改义。逐档改后行数登记入 §5。

**测试与验收面（2 档）**：`test/integration/batch-close-gate.test.mjs`（7-9 改判）· `test/RTM.md`（7-9 行 + 第 7 节节注 `:80`）。

**改面单元测试档**：`docs/batches/2026-10-28-tool-docs-paragraph-gate.test.mjs`（随批删，零留存）。

### 2.7 验收对照（逐条回指 2.1）

| 条目 | 验收 | 判定 |
|---|---|---|
| E1 | `isToolDocFace` 在 `thincoder-core/doc-check/paragraph.mjs` 与 `scripts/doc-check-paragraph.mjs` 零命中；两档 `node --check` 过 | 引擎面已无面例外 |
| E1 | 夹具：`thincoder-core/tool-docs/a.md` 一段 400 字 ⇒ 段判据 1 条 | 面不再被跳过 |
| E2 | `grep -c "Face scope"` 于 `thincoder-core/tool-docs/doc_check.md` = 0；该档自身 `doc_check` report 0 命中 | 描述面与实际行为同拍 |
| E3 | `doc_check` gate（清单 = 该面 54 档）⇒ 锚 0 ∧ 段 0 ∧ 行 0 | 39 段清到 0 |
| E4 | `test/RTM.md` 7-9 行改判落地 ∧ 第 7 节节注 `不判段长` 零命中 | 验收表与新行为一致 |
| 单测 | `node --test docs/batches/2026-10-28-tool-docs-paragraph-gate.test.mjs` ⇒ 3 例绿：400 字一段在 tool-docs 面 1 条 ∥ 同内容在 `docs/core/design` 面 1 条 ∥ 拆两段各 ≤300 ⇒ 0 条 | 正反两读 |

**集成面（RTM 增量）**：改 1 行、删 1 句、新增 0 行。7-9 改判 = 夹具含 `thincoder-core/tool-docs/x.md`（400 字一段 + 一个解析不到的裸档名）⇒ 收口被拒且**锚与段两条同时点名**；只删裸档名 ⇒ 仍拒（段）；拆段后 ⇒ 放行。节注 `:80` 删「工具描述面只判锚、不判段长」一句。

### 2.8 关键决策

| # | 决策 | 理由（含被否方案） |
|---|---|---|
| KD1 | 撤豁免与清账**同批**落，不留中间态 | 用户 11:15 逐字「就这么做」；先改判据后改内容 = 掩盖症状（否：父侧原「先修判据」序） |
| KD2 | 判定用引擎读数，不用人工估字数 | 估字数必漂；引擎读数可复跑（39 段就是读数） |
| KD3 | 先拆段、只在单句超 300 时断句 | 拆段零语义风险；断句才动句子结构，用量最小（否：一律重写） |
| KD4 | 阈值 300 与区带常量一字不改 | 豁免与阈值是两件事；动阈值会连 `docs/**` 面一起松 |
| KD5 | RTM 7-9 改判而非删行 | 该行是撤豁免后的反证位：400 字段必须被拦 |
| KD6 | 推进顺序：各 dispatch 先改完所属 29 档、再写 §5 | 撤豁免后门会判本次 run 触达档；先清账则 §5 不被自己的门拦（`#1847` 现场的教训） |

### 2.9 dispatch 拆分（三批互不重叠；甲乙各 ≤15 档）

- **甲（14 档 / 24 段）**：`thincoder-core/tool-docs/subagent.md`(8) · `thincoder-core/tool-docs/read_history.md`(3) · `thincoder-core/tool-docs/doc_check.md`(2)
- 续甲：`thincoder-core/tool-docs/timer.md` · `thincoder-core/tool-docs/edit.md` · `thincoder-core/tool-docs/settings.md` · `thincoder-core/tool-docs/verify.md`
- 续甲：`thincoder-core/tool-docs/consult_start.md` · `thincoder-core/tool-docs/memory.md` · `thincoder-core/tool-docs/task.md` · `thincoder-core/tool-docs/ssh.md`
- 续甲：`thincoder-core/tool-docs/doc_search.md` · `thincoder-core/tool-docs/goal.md` · `thincoder-core/tool-docs/lint.md`
- **乙（15 档 / 15 段）**：`thincoder-core/tool-docs/skill.md` · `thincoder-core/tool-docs/execute.md` · `thincoder-core/tool-docs/plan.md` · `thincoder-core/tool-docs/code_search.md`
- 续乙：`thincoder-core/tool-docs/consult_stop.md` · `thincoder-core/tool-docs/manifest-read.md` · `thincoder-core/tool-docs/manifest.md` · `thincoder-core/tool-docs/recent_changes.md`
- 续乙：`thincoder-core/tool-docs/browser.md` · `thincoder-core/tool-docs/read_image.md` · `thincoder-core/tool-docs/repo_outline.md` · `thincoder-core/tool-docs/delete.md`
- 续乙：`thincoder-core/tool-docs/fetch.md` · `thincoder-core/tool-docs/websearch.md` · `thincoder-core/tool-docs/git.md`

**引擎改动（E1 / E2）单独一个 dispatch**（3 档，含单测档），与甲乙无文件重叠；甲 / 乙 / 引擎三者先后无约束。KD6 只约束同一 dispatch 内的顺序：先清账、后写 §5。

### 2.10 上抛项

**[上抛·待裁] 计数差 1 条**：§1.4 记「40 段」，本席引擎实测 39 段 / 29 档；差项 = `thincoder-core/tool-docs/doc_check.md:21`（落 `:17`–`:27` 围栏内，不计段）。本席按 39 设计与验收；若 §1 计数要改，由主 agent 落笔。

**[上抛·待裁] 需求档未随动**：`docs/core/requirements/DOC-CHECK.md` 的 F3「判据适用面分层」仍是现行需求（`test/RTM.md:93` 引它），而本批撤的正是这条。需求档 = 主 agent 笔 —— 不随动则 §2 / 设计档 / 需求档三方不同源，请裁定同批改述。

**其余**：无。设计档已落盘、无未决项。

### 2.11 补充（设计档随动收尾 · 2026-10-28）

- **生成区不手改**：`docs/core/design/API-CONTRACT.md` §1 是生成区（`BEGIN GENERATED`），其 `isToolDocFace` 两行（`:108` 导出名单 ∥ `:1302` 符号行）由生成器随源码再生成。本批实施轮删掉谓词后**重跑生成器**，两行随之消失；手改会在下次生成被覆盖，且与源不符。
- **描述面删改口径（`thincoder-core/tool-docs/doc_check.md`）**：删 `:35-39` 整条 Face scope（含 `this file included` 与 `read by the model, which carries no such burden` 两句）。
- 同档 `:29-34` 的段落判据句补一句：判据适用于全部面，工具描述档在内（英文运行面，落笔 = eng-coder）。
- `Parameters and scope` 段的 `no exempt zones` 保持原样：区带常量仍是空集，本条不动。

**设计档复核读数（本席实跑）**：`doc_check` gate（清单 = `docs/core/design/DOC-DISCIPLINE.md` + 本批档）⇒ `DOC-CHECK GATE: PASS`，0 段命中。

### 2.12 修轮（§3 十三条逐条处置 · 2026-10-28）

**口径**：十三条全收、无 Deferred（§1.10 裁定）。本节为定稿值，取代 §2.2 / §2.4 / §2.5 / §2.6 / §2.7 / §2.9 的同项登记。

| # | 级 | 处置 | 落点 |
|---|---|---|---|
| 1 | 🔴 | 删旧分句，改述为「锚与段两条同时拦、拆段后放行」；随动项从空坐标改到真坐标 | `docs/core/design/DOC-DISCIPLINE.md:1004` |
| 2 | 🔴 | 第二处豁免句列入删改面；E2 验收改为「无 anchor-judged only 类绝对句」 | `thincoder-core/tool-docs/doc_check.md:62` · 本节 2.12.3 |
| 3 | 🔴 | 该档整档归引擎 dispatch（含 `:12` 480 ∥ `:62` 375 两段拆分）；档数按 D3 重数 | 本节 2.12.2 |
| 4 | 🟡 | 两档补现读数与结构；`thincoder-core/doc-check/paragraph.mjs` 增量按删点重算 | 本节 2.12.1 |
| 5 | 🟡 | 条 7 补「段判据的害同样不分层」一句，与需求档 F3 尾同源 | `docs/core/design/DOC-DISCIPLINE.md:968` |
| 6 | 🟡 | 条 7 补「同类先例」行（先例 + 对齐 ∥ 偏离） | `docs/core/design/DOC-DISCIPLINE.md:964` |
| 7 | 🟡 | 断句从句界补全角标点 | 本节 2.12.4 |
| 8 | 🟡 | 附判集来源与可复跑命令；并登记撤豁免前的同命令读数（0 段） | 本节 2.12.5 |
| 9 | 🟡 | E4 改记「已在位，实施轮只核对」；`test/RTM.md` 三处标已落 | 本节 2.12.3 · 2.12.1 |
| 10 | 🔵 | §1.4 的 settings 1423 与 timer 1674 以本节 2.12.5 读数为准；§1.4 本表 = 主 agent 笔，见 2.12.7 | 本节 2.12.5 · 2.12.7 |
| 11 | 🔵 | 删「`:2580` 再出口缝名单」空改项（该档全文零命中该名），改记 `:1000`→现 `:1004` | 本节 2.12.2 · 上表第 1 行 |
| 12 | 🔵 | `docs/core/design/API-CONTRACT.md` 生成区入受影响表并写明重跑命令 | 本节 2.12.1 |
| 13 | 🔵 | KD6 补「引擎与缝档必须同 dispatch 落」；顺序句改述为「省一次拒写」 | 本节 2.12.6 |

#### 2.12.1 受影响文件（全量 · 34 档）

| 档 | 现读数（本席实测） | 变化 |
|---|---|---|
| `thincoder-core/doc-check/paragraph.mjs` | 148 行 | **−13**：删谓词块 `:51-57`（6 行 + 空行）· 注释 `:85` · 跳过支 `:111-114` · `:7-9` 三面切块改两面（−1） |
| `scripts/doc-check-paragraph.mjs` | 8 行 | 再出口名单删 `isToolDocFace` 一名；结构不变 |
| `thincoder-core/tool-docs/doc_check.md` | 83 行 | 删 `:35-39` 整条 Face scope · 改 `:62` 分句 · `:29-34` 段补「全部面同判」一句；另拆 `:12`(480) ∥ `:62`(375) 两段 |
| `docs/core/design/API-CONTRACT.md` | 生成区 4609 行 | **不手改**：重跑 `node scripts/api-contract.mjs --write` ⇒ `:108` 名单删一名、`:1302` 符号行消失 |
| `test/integration/batch-close-gate.test.mjs` | 345 行（7-9 = `:311-343`） | 7-9 改判：现断言「恰 1 条、零段命中」改为「锚与段同时点名 · 只删裸档名仍拒 · 拆段放行」；结构不变 |
| `test/RTM.md` | — | **已落（§1.8）**：`:80` 节注 ∥ `:81` 九态行 ∥ `:93` 用例；实施轮只核对 |
| `docs/batches/2026-10-28-tool-docs-paragraph-gate.test.mjs` | 新建 | 3 例（正反两读）；随批删，零留存 |
| `thincoder-core/tool-docs/**` 其余 28 档 | 见 2.12.5 | 只加空行 / 断句，行为描述不改义 |

**行数说明**：`thincoder-core/doc-check/paragraph.mjs` 的 −13 由删点逐项相加得出（6 + 1 + 1 + 4 + 1），原记「−6~−8」漏算了注释块与空行。

#### 2.12.2 dispatch 拆分（四组 · 文件面零重叠）

| 组 | 档（段数） | 档数 · 段数 |
|---|---|---|
| 甲 | `thincoder-core/tool-docs/subagent.md`(8) · `thincoder-core/tool-docs/read_history.md`(3) · `thincoder-core/tool-docs/timer.md` · `thincoder-core/tool-docs/edit.md` · `thincoder-core/tool-docs/settings.md` · `thincoder-core/tool-docs/verify.md` · `thincoder-core/tool-docs/consult_start.md` · `thincoder-core/tool-docs/memory.md` · `thincoder-core/tool-docs/task.md` · `thincoder-core/tool-docs/ssh.md` · `thincoder-core/tool-docs/doc_search.md` · `thincoder-core/tool-docs/goal.md` · `thincoder-core/tool-docs/lint.md` | 13 · 22 |
| 乙 | `thincoder-core/tool-docs/skill.md` · `thincoder-core/tool-docs/execute.md` · `thincoder-core/tool-docs/plan.md` · `thincoder-core/tool-docs/code_search.md` · `thincoder-core/tool-docs/consult_stop.md` · `thincoder-core/tool-docs/manifest-read.md` · `thincoder-core/tool-docs/manifest.md` · `thincoder-core/tool-docs/recent_changes.md` · `thincoder-core/tool-docs/browser.md` · `thincoder-core/tool-docs/read_image.md` · `thincoder-core/tool-docs/repo_outline.md` · `thincoder-core/tool-docs/git.md`（需断句） · `thincoder-core/tool-docs/delete.md` · `thincoder-core/tool-docs/fetch.md` · `thincoder-core/tool-docs/websearch.md` | 15 · 15 |
| 引擎 | `thincoder-core/doc-check/paragraph.mjs` · `scripts/doc-check-paragraph.mjs` · `thincoder-core/tool-docs/doc_check.md`（整档归此席，含两段拆分） · `docs/batches/2026-10-28-tool-docs-paragraph-gate.test.mjs`（新建） · `docs/core/design/API-CONTRACT.md`（生成器重跑） | 5 · 2 |
| 验收 | `test/integration/batch-close-gate.test.mjs`——依赖引擎 dispatch 落地后改判 | 1 · 0 |

**计数核对（D3）**：13 + 15 + 5 + 1 = **34 档**（= 2.12.1 表行数，含「其余 28 档」整行）；22 + 15 + 2 + 0 = **39 段**（= 2.12.5 读数）。各组 ≤15 档。

#### 2.12.3 验收对照（更正行 · 其余同 §2.7）

| 条目 | 验收（更正后） | 判定 |
|---|---|---|
| E2 | `grep -c "anchor-judged only"` 与 `grep -c "Face scope"` 于 `thincoder-core/tool-docs/doc_check.md` **各 0** ∧ 该档 `doc_check` report 0 命中 ∧ 其段判据句明写「全部面同判」 | 描述面与实际行为同拍（A-DD35 ⑤ 可达） |
| E3 | `doc_check` report / gate（清单 = `git ls-files thincoder-core/tool-docs` 全部 54 档）⇒ 锚 0 ∧ 段 0 ∧ 行 0 | 39 段清到 0 |
| E4 | `test/RTM.md` 三处已在位（实施轮只核对）；集成用例改判落在 `test/integration/batch-close-gate.test.mjs` 7-9 | 验收表与新行为一致 |

**E2 的判据为何改了**：原验收只 `grep "Face scope"`，而 `:62` 那句独立成句，删了 Face scope 条仍留在档里——验收会在描述面仍说「本面不判段」时判绿。

#### 2.12.4 清账手段（补全角）

**拆段**：在句界插空行，使每段 `[...line].length` 求和 ≤ 300（CJK 计 1）。

**断句**：单句本身超 300 者，按句中**已有分隔符**断开——半角 `, ; — :` 与全角 `，；：——` 同等。原记只列半角，而 `thincoder-core/tool-docs/read_history.md:7` 用全角「：」「；」，照原口径无从下手。

**禁**：删事实、改语义、改命令 / 参数 / 坐标 / 码段字面、动围栏与表格结构、缩短到失义。

#### 2.12.5 读数与复跑（可复查）

判集来源 = `git ls-files thincoder-core/tool-docs` ⇒ 54 档；口径 = `checkParagraphs({paragraphMax:300, lineMax:300, exemptZones:[], files})`；cwd = 仓根。

**撤豁免前（本席 2026-10-28 实跑）**：同命令 ⇒ **段命中 0 / 0 档**——面谓词把整面跳过，这就是本批要治的症状。

**基线（绕开面谓词的同内容镜像，等价于撤豁免后的判法）**：**39 段 / 29 档**。逐档见 §2.5 表，该表读数与本次实跑逐项相符——含 `thincoder-core/tool-docs/settings.md:1` = **1418**、`thincoder-core/tool-docs/timer.md:1` = **1662**。

**落点**：清账后同命令 ⇒ 0 段 / 0 档。

#### 2.12.6 KD6 更正

**原子性约束（硬）**：引擎谓词删除与缝档 `scripts/doc-check-paragraph.mjs` 的名单删除**必须同一 dispatch 落盘**——缝档 re-export 一个已删名时，模块链接即抛，`doc_check` 与 batch 门同时坏。

**顺序（软）**：各组先改完所属档、再写 §5，省掉 §5 被自己的门拒写一次；反向代价是同轮可修的拒写，不是不可逆损失。

#### 2.12.7 上抛

**[上抛·待裁] §1.4 两处数字**：settings 1423（实测 1418）、timer 1674（实测 1662）。§1 是主 agent 笔，本节不改；若要对齐，由主 agent 在该表加一行「以 2.12.5 为现读数」。

**其余**：无。§2.2 的随动项已按第 11 条更正，设计档三处已就地改定。

## §3 设计评审（评审子代理）
**状态行**：✅ 评审通过 · 2026-10-28（轮次 2 复评：第一轮 13 条全数处置（12 Fixed · 1 Accepted），遗留 🔴 0 · 遗留 🟡 0，新增 🔵 3）



### 轮次 1（评审子代理）

**判定对象**：`docs/batches/2026-10-28-tool-docs-paragraph-gate.md` §2 设计 ∥ `docs/core/design/DOC-DISCIPLINE.md` §3.18 条 7 / §5 A-DD35 ∥ `docs/core/requirements/DOC-CHECK.md` ∥ `test/RTM.md`。

| # | 类 | 级 | 问题 | 建议 |
|---|---|---|---|---|
| 1 | 文档归属 | 🔴 | `docs/core/design/DOC-DISCIPLINE.md:1000` 仍写「工具描述面：段不拦、锚仍拦、收口拒因只点名锚」，与同档 `:960` 条 7、`test/RTM.md:93`「锚与段两条同时点名」同一机制两说（§2.2 的五处随动未含此行） | 按 D8 删该分句、改述为「锚与段两条同时拦、拆段后放行」，与 `:960` 同源 |
| 2 | 需求覆盖 | 🔴 | 描述面残留第二处豁免句 `thincoder-core/tool-docs/doc_check.md:62`「a tool-description file is anchor-judged only」；§2.6 只删 `:35-39`，E2 验收用 `grep "Face scope"` 抓不到 `:62`；故本设计自写的 A-DD35 判据 ⑤「描述面与实际行为不得相抵」在本文改法下不可达 | 把 `:62` 该分句列入删改面，E2 验收改为「该档无 anchor-judged only 类绝对句」，判据 ⑤ 的判法同步 |
| 3 | 可行性 | 🔴 | `thincoder-core/tool-docs/doc_check.md` 有两个所有席：§2.9 甲含 `doc_check(2)`，同节「引擎改动（E1 / E2）…3 档」含同档，而 `:241` 断言「与甲乙无文件重叠」；该档 480 ∥ 375 两段（§2.5）在 §2.6 该行未列 ⇒ E2 验收（该档 0 命中）在所列改法下不成立；「3 档」也未含缝档 `scripts/doc-check-paragraph.mjs`（E1 验收要求它零命中） | 该档归唯一席（建议整档归引擎 dispatch），其两段拆段并入；dispatch 档数按 D3 重算（4 档） |
| 4 | 受影响文件标注 | 🟡 | §2.6 两档缺行数/增量：`test/integration/batch-close-gate.test.mjs`（实测 346 行 · 7-9 在 `:313-343`）∥ `scripts/doc-check-paragraph.mjs`（实测 8 行）；`thincoder-core/doc-check/paragraph.mjs` 增量「−6~−8」与所述删点（`:51-56` ∥ `:111-114` ∥ `:8-9` ∥ `:85`）实计 ≈ −13 不符 | 两档补「现 N 行 · 结构不变」；`paragraph.mjs` 增量按删点重算 |
| 5 | 依据充分性 | 🟡 | 条 7 ②（`:964`）只给锚 ∥ 计数两条「害与读者无关」的理由，未给段判据对模型的害；需求档 `docs/core/requirements/DOC-CHECK.md:20` 载有该理由（长段里的细节照样被跳过），设计档未承 | ② 补一句模型侧段害，与需求档同源；否则下个改判据的人只能靠裁定权威复辩 |
| 6 | 最接近先例 | 🟡 | §3.18 无「同类先例」行；同档 §3.19 `:1080` 有该行形（§3.7 条目 H → §3.15 条目 N）。本次是撤自己开的面豁免，与条目 N 收窄同形 | 条 7 补一行：先例坐标 + 对齐 ∥ 偏离理由 |
| 7 | 清晰性 | 🟡 | 断句从句界写作 `, ; — :`（半角），而两处单句超长项含中文（`thincoder-core/tool-docs/read_history.md:7` 用「：」「；」） | 枚举补全角 `，；：——`，或改述「按句中已有分隔符断」 |
| 8 | 可复跑性 | 🟡 | §2.5 只写「`checkParagraphs` 引擎实跑」，未给可复跑调用（判集是哪 54 档、`exemptZones` 取值）；KD2 主张「引擎读数可复跑」，但清单本身未登记 | 附可复跑命令（`doc_check` report + 清单来源）+ 读数摘要 |
| 9 | 文档状态 | 🟡 | §2.1 E4 ∥ §2.6 把 `test/RTM.md` 列为实施轮改动面，而 §1.8 记父侧已改完（实测 `:80` `:81` `:93` 已是新文本） | E4 改记「已在位，实施轮只核对」；§2.6 该行标「已落」 |
| 10 | 数字漂移 | 🔵 | §1.4 的 settings 1423 与 §2.5 的 1418 两读并存；§1.7 只裁了 40→39 与 1674→1662 | §1.4 整表标「以 §2.5 为现读数」 |
| 11 | 坐标漂移 | 🔵 | §2.2 称「`:2580` 再出口缝名单，删 `isToolDocFace`」，实测该档全文零命中该名（名单住 `:2578` 且本无此名）⇒ 该「随动」是空改，真正需随动的 `:1000` 反而不在列 | 删该随动项、更正坐标，改记 `:1000` |
| 12 | 清单外档 | 🔵 | `docs/core/design/API-CONTRACT.md` 生成区（`:108` 导出名单 ∥ `:1302` 符号行）会随源码变，却不在 §2.6 受影响表；重跑命令未点名（住该档 `:12`：`node scripts/api-contract.mjs --write`） | §2.6 补该档一行并写明重跑命令 |
| 13 | 执行顺序 | 🔵 | KD6（先清账再写 §5）在引擎改动落地后确有必要；反向代价 = §5 append 被拒、同轮可修，不是不可逆陷阱。真正硬约束是引擎 + 缝档同批落（否则缝档自删名 ⇒ 模块链接即抛，`doc_check` 与 batch 门同时坏），而 §2.9「3 档」未含缝档 | KD6 补「引擎与缝档必须同 dispatch 落」；顺序句改述为「省一次拒写」 |

**计数**：🔴 3 · 🟡 6 · 🔵 4。

**已独立核实**（口径 ①）：`thincoder-core/tool-docs/doc_check.md:21` 确在 `:17`–`:27` 的 `~~~text` 围栏内，引擎 `fenceMark` 认 `~{3,}`（`thincoder-core/doc-check/paragraph.mjs:31`）⇒ 该行不计段，39 段口径成立；`:12` 段合 `:12`–`:15`（`:11` 为列表项断段）与引擎断段规则一致，读数自洽。

**未能核实**：其余 38 段的全量与字数（引擎与 54 档不在本轮审查面，标 `unverified`）；文档地图缺失、无项目标准档 ⇒ 归属判据按 AGENTS.md 降级判定。

VERDICT: changes-required

### 轮次 2（评审子代理）

**轮次 2 复评**：只验第一轮 13 条（🔴 3 · 🟡 6 · 🔵 4）的修正事实，按轮次衰减不搜新缺陷。审查面 = 批次档 §2.12 ∥ `docs/core/design/DOC-DISCIPLINE.md` §3.18 条 7 ∥ `docs/core/requirements/DOC-CHECK.md` F3 ∥ `test/RTM.md` 第 7 节。

| 原# | 级 | 项 | 状态 | 本轮证据 |
|---|---|---|---|---|
| 1 | 🔴 | 同档旧分句「段不拦、锚仍拦」 | Fixed | `docs/core/design/DOC-DISCIPLINE.md:1004`「工具描述面：锚与段两条同时拦、拆段后放行」；全档 grep `只判锚` ∥ `不判段` ∥ `段不拦` ⇒ 零命中（余下命中项均为「同判段长」句或史实谓词 `:962`） |
| 2 | 🔴 | 描述面第二处豁免句 | Fixed | 该句仍在盘（实施轮才删）；`thincoder-core/tool-docs/doc_check.md:62`「a tool-description file is anchor-judged only」已列入 §2.12.1 该档行「改 `:62` 分句」，E2 验收改 `anchor-judged only` 与 `Face scope` 各 0（§2.12.3）——该判据能抓到这一句 |
| 3 | 🔴 | `thincoder-core/tool-docs/doc_check.md` 一档两主 | Fixed | §2.12.2 引擎组含该档「整档归此席，含两段拆分」；甲 13 档不再含它；引擎组 = 5 档（含缝档 `scripts/doc-check-paragraph.mjs`） |
| 4 | 🟡 | 受影响文件缺行数/增量 | Fixed | §2.12.1：engine 148 行 · **−13**（6+1+1+4+1 逐项可核）· 缝档 8 行「结构不变」· 描述档 83 行 · 集成测试 345 行（7-9 = `:311-343`） |
| 5 | 🟡 | 条 7 缺模型侧段害 | Fixed | `docs/core/design/DOC-DISCIPLINE.md:968`「段判据的害同样不分层：长段里的细节照样被跳过…」 |
| 6 | 🟡 | 条 7 缺同类先例行 | Fixed | `:964` 先例 = §3.15 条目 N，对齐 ∥ 偏离各一句 |
| 7 | 🟡 | 断句只列半角分隔符 | Fixed | §2.12.4「按句中已有分隔符断开——半角 … 与全角 … 同等」 |
| 8 | 🟡 | 判集来源与可复跑 | Fixed | §2.12.5 判集 = `git ls-files thincoder-core/tool-docs`（54 档）· 口径 = `checkParagraphs({paragraphMax:300, lineMax:300, exemptZones:[], files})` · cwd = 仓根 |
| 9 | 🟡 | E4 与「已在位」不一致 | Fixed | §2.12.3 E4「三处已在位（实施轮只核对）」；`test/RTM.md:80` ∥ `:81` ∥ `:93` 实读已是新文本 |
| 10 | 🔵 | 数字漂移 | Fixed | §1.13 父侧已改 §1.4（39 ∥ 1662 ∥ 1418），与 §2.12.5 一致 |
| 11 | 🔵 | `:2580` 空改坐标 | Accepted | §2.2 该行仍在盘——段 append-only，不能回溯改写；§2.12 首句已记「取代 §2.2 / §2.4 / §2.5 / §2.6 / §2.7 / §2.9 的同项登记」，优先级有明文 |
| 12 | 🔵 | 生成区未列 | Fixed | §2.12.1 补 `docs/core/design/API-CONTRACT.md` 行 + 写明重跑命令 |
| 13 | 🔵 | KD6 只论证顺序 | Fixed | §2.12.6 硬约束 = 引擎与缝档同 dispatch 落（模块链接即抛）；顺序句改述为「省一次拒写」 |

**三项重点验的答复**

① 三条 🔴 真消除：证据见上表 1–3，均为「改法 + 判据」双落，不是只改措辞。

② 行数口径是我错：上轮 149 / 346 / 84 = read 工具的**末行号**；三档末字符均为换行 ⇒ `split('\n').length - 1` 比末行号少 1。本轮实读 engine 档末两行为 `}` 与空行 ⇒ 换行数 148。设计席 148 / 345 / 83 正确，§2.12.1 已采纳。

③ 红绿对以父侧口径为准：红绿必须**同命令 ∥ 同夹具 ∥ 只差一处变更**。撤豁免前 = 0 是「豁免生效、病被盖住」，与清账后 0 同读 ⇒ 不成对，不能当红。红 = 撤豁免后、清账前 = 39 段 / 29 档；绿 = 清账后 = 0。现 §2.12.5 已按此分层（0 记作症状 ∥ 39 记作「等价于撤豁免后的判法」∥ 0 作落点），口径一致。

**新增（🔵 · 不阻断）**

| # | 级 | 问题 | 建议 |
|---|---|---|---|
| N1 | 🔵 | §2.12.2「**计数核对（D3）**：13 + 15 + 5 + 1 = **34 档**（= 2.12.1 表行数，含「其余 28 档」整行）」—— 2.12.1 的独立档实为 35（7 名档 + 28），差项 = `test/RTM.md`（标已落、不入组） | 删「= 2.12.1 表行数」或改「34 + 已落 1 = 35」 |
| N2 | 🔵 | §2.12.7 仍出「**[上抛·待裁] §1.4 两处数字**」，而 §1.13 已由父侧改完 §1.4 表（39 ∥ 1662 ∥ 1418） | 标「已解决（§1.13）」，避免留一条已闭的待裁项 |
| N3 | 🔵 | §1.15 引 2.12.5 作「撤豁免前跑 = 0 段（先红）」，现 2.12.5 无此表述且把该 0 标为「症状」——引文目标已不存在；且真红读数（撤豁免后、清账前）只能实施轮实跑取得，E3 未要求登记 | E3 加一句：实施轮把「撤豁免后、清账前」的同命令读数登记入 §5（§7 先红判据同规） |

**计数**（本轮）：遗留 🔴 0 · 遗留 🟡 0；新 🔵 3。原 13 条 = 12 Fixed + 1 Accepted（append-only 无回溯）。

**未逐条复跑的项**：39 段的其余 38 行与字数（引擎与 54 档不在本轮审查面）标 `unverified`；差项 `:21`（围栏内不计段）与 `:12` 合并规则上轮已双端复核，本轮维持。

VERDICT: pass

## §4 用户批准（主 agent）

### 4.1 用户批准（2026-10-28 11:3x）

**用户逐字**：「就这么做。」（11:15）—— 批准「29 档一次全改 + 同批撤豁免」；此前 11:14 逐字「不不不！你这是继续开口子，为什么要豁免「已登记的长段」？」—— 否决了「先修判据、后修内容」的中间态方案，并定下「工具说明不能豁免」。

**⇒ 批准面 = §2.12 定稿（4 组 dispatch · 39 段清账 · 引擎面不分层）+ 两轮评审结论（第 1 轮 13 条 → 修正 → 第 2 轮 pass）。**

### 4.2 实施拆三席（依 §2.12.2，父侧照单派）

| 席 | 档 | 段 | 说明 |
|---|---|---|---|
| **甲** | 13 | 22 | `thincoder-core/tool-docs/` 下 13 档（`subagent` 8 段 · `read_history` 3 段 · 其余各 1） |
| **乙** | 15 | 15 | `thincoder-core/tool-docs/` 下另 15 档（各 1 段） |
| **引擎** | 5 | 2 | `thincoder-core/doc-check/paragraph.mjs` 删 `isToolDocFace` ∥ `scripts/doc-check-paragraph.mjs` 缝档 ∥ `thincoder-core/tool-docs/doc_check.md` 整档（含 `:12`/`:62` 两段拆分 + `:35-39` 删除 + `:62` 分句改写 + `:29-34` 补句）∥ `test/integration/batch-close-gate.test.mjs` 7-9 改判 ∥ `docs/core/design/API-CONTRACT.md` 重跑生成器 |

**★ 三者先后无约束** —— 清账与撤豁免互不依赖，且改动面不重叠（描述档中的那一份整档只归引擎席）。

**★ 引擎席的原子性**：`paragraph.mjs` 与缝档**必须同一次落完** —— 缝档还 re-export 已删名时，模块链接即抛，`doc_check` 与 `batch` 门同时坏（§2.12.6）。

**★ 批档不进 `files`**：它是流程档，三个席各自 append §5，文件级冲突检测不该被它串行化。

### 4.3 父侧要做的三件（实施后）

1. **先红读数登记**：引擎席落定后、清账前，实跑一次取真红（预期 39 段 / 29 档），记入 §6。
2. **收口门**：三个席全落、29 档全 0 命中后，跑 `doc_check` gate（清单 = 54 档）⇒ 锚 0 ∧ 段 0 ∧ 行 0。
3. **被改的那份描述档自身**：撤豁免后它要判自己 —— 顺序必须是「先改到 0 命中，再写 §5」（§2.12.6）。

## §5 实施记录（eng-coder）
**状态行**：✅ 实施完成 · 2026-10-28（甲席 13 档 / 22 段清零；audit clean · advisor pass）



### 5.1 落地面（四档 · 行数口径 = `split('\n').length - 1`）

| 档 | 变化 | 行数 | 现场读数 |
|---|---|---|---|
| `thincoder-core/doc-check/paragraph.mjs` | 删 `isToolDocFace` 谓词块 ∥ 其档注 ∥ `checkParagraphs` 的跳过支 ∥ 头部「三面切块」改「两面」 | 148 → **135**（−13，与 §2.12.1 逐项相符） | `node --check` 过 · 导出 12 名 · **面谓词只剩 `isPromptFace`** |
| `scripts/doc-check-paragraph.mjs` | 再出口名单删 `isToolDocFace` 一名（**父侧直笔**，非本席笔） | 8 → 8 | `node --check` 过 · 新进程导入缝档**零链接错**（原子性成立） |
| `thincoder-core/tool-docs/doc_check.md` | 删 Face scope 条 ∥ 段落判据条补「无面豁免」句（含模型侧害的因）∥ `:12` 段拆 ∥ 删面限定残句 | 83 → **85** | 该档 `doc_check` report ⇒ **命中 0 条**（锚 0 · 段 0 · 行 0） |
| `test/integration/batch-close-gate.test.mjs` | 7-9 改判：锚与段两条同时点名 ∥ 只删裸档名仍拒（段）∥ 拆段后放行 | 345 → **355** | 全档 `node --test` ⇒ **8/8 pass** |
| `docs/core/design/API-CONTRACT.md` | 重跑 `node scripts/api-contract.mjs --write`（生成区唯一笔） | 17+ / 14− | `isToolDocFace` 两行（`:108` 名单 ∥ `:1302` 符号行）**消失**；`--check` ⇒ 骨架零漂移（4609 条 · 926 档） |

### 5.2 验收（逐条回指 §2.1 / §2.12.3）

| 条目 | 读数 | 判 |
|---|---|---|
| E1 | `isToolDocFace` 在 `thincoder-core/doc-check/paragraph.mjs` ∥ `scripts/doc-check-paragraph.mjs` ∥ 集成档 **零命中**；两档 `node --check` 过；缝档新进程导入零链接错 | ✅ |
| E1 夹具 | 400 字一段落 `thincoder-core/tool-docs/a.md` ⇒ 段判据 **1 条**（temp 域夹具，见 5.5） | ✅ |
| E2 | `anchor-judged only` = 0 ∥ `Face scope` = 0 ∥ 该档 report 0 命中 ∥ 段落判据句明写工具描述档同判（「No face is exempt」） | ✅ |
| E3 | 全面 54 档 ⇒ 锚 0 ∥ 段 **37**（28 档）；本席两档已 0 —— 余 37 段全落甲/乙席 28 档内（22 + 15 = 37，与 §2.12.2 逐项相符） | ⚠️ 域外 |
| E4 | `test/RTM.md:80` / `:81` / `:93` 三处已是新文本（父侧已落，本席只核对）；用例侧改判落在集成档 7-9 | ✅ |

### 5.3 判别力（同夹具 · 同配置 · 只换引擎）

夹具 = 临时域里的 `thincoder-core/tool-docs/a.md`，内容 = 标题 + 400 个「长」字；配置 = `{paragraphMax:300, lineMax:300, exemptZones:[], files:[该档]}`。

| 引擎 | 读数 |
|---|---|
| HEAD 版（面豁免在） | **`[]`** —— 400 字段被整面跳过，病看不见 |
| 现盘版（撤豁免后） | **1 条**：`{line:3, len:400, clazz:"文字太长，难于阅读"}` |

⇒ 红绿对成立：红 = 同一夹具在旧引擎下 0 条（病被盖住），绿 = 新引擎命中后把内容改到 0 条。

### 5.4 决策透明表

| # | 事项 | 处置 ∥ 原因 |
|---|---|---|
| 1 | `thincoder-core/doc-check/paragraph.mjs` 的正文**不是本席落的笔**：11:34:24 另一席写入（8982 字节），同期也改了 `thincoder-core/tool-docs/doc_check.md` | 逐行核过 §2.12.1 四个删点 + `node --check` + 新进程导入，**判定正确 ⇒ 保留不重做**；已上抛父侧，父侧裁定他席停手 |
| 2 | 11:33 本席用**行号**批删四处，把该档改成语法坏档（`node --check` 报 `:104`） | 当场 `git checkout` 复原（10375 字节、check 过）后重来 —— **教训：同档多处删改用内容锚，不用行号** |
| 3 | `thincoder-core/tool-docs/doc_check.md` 里另一席留的「No face exemption」独立条 | 按 §2.12.1「删整条 Face scope + 段判据句补一句」**收形**：并入段落判据条，害的因（长段藏后文、模型同样受害）随句带过；另删 `:63`「to the doc's face」残句（面分层已不存在，留着即示范错形） |
| 4 | API-CONTRACT 重跑连带吸收 4 行**他批未重跑**的漂移（`SUMMARY_SIG` ∥ `isSummaryRequest` ∥ `fakeAnthropic` ∥ `parseGeminiStream`） | 生成器唯一笔的必然结果，非手改；如实登记 |
| 5 | E3 的 37 段落在甲/乙席 28 档内 | 本席**零触**（父侧已点名域界）；收口门按全面判，须那两席清完才成立 |

### 5.5 改面单测（随批删 · 零留存）

`docs/batches/2026-10-28-tool-docs-paragraph-gate.test.mjs`（59 行 · 3 例），命令 `node --test docs/batches/2026-10-28-tool-docs-paragraph-gate.test.mjs` ⇒ **3/3 pass**（U-1 工具描述面 400 字一段 ⇒ 段判据 1 条、定位 `:3`；U-2 同内容落 `docs/core/design` 面 ⇒ 1 条；U-3 拆两段各 200 ⇒ 0 条）。读数已记，档**已删**（零留存）。

### 5.6 留给父侧的两件

① `test/RTM.md:93` 的 7-9 行状态列仍写「待执行」，而该用例现跑绿 —— 状态列是父侧笔，本席未动。
② 收口门的 E3 全面读数依赖甲/乙席清账；本席面两档已 0。

### 5.7 审计轮 ∥ 代码评审轮（本批同会话内跑完）

**内部审计轮（只读 explore，对照 §2）1 轮**：🔴 0 · 🟡 1 · 🔵 3，另「清单外改动 = 零」与 (i)(ii)(iii) 三项逐条给坐标。

**代码评审轮（`advisor` · `type="code"`）1 轮：VERDICT pass** —— 🔴 0 · 🟡 2 · 🔵 4；它另复核三件：缝档再出口 11 名逐名在盘（模块链接不抛）、两条通路同取 `checkParagraphs`、`thincoder-core/tool-docs/doc_check.md` 最大两段 232 ∥ 224 字均 ≤ 300。

**当轮采纳并已修（3 条）**：

| # | 来源 | 问题 | 修法 |
|---|---|---|---|
| ① | 审计 🟡 ∥ 评审 🟡 | `thincoder-core/tool-docs/doc_check.md` 的 480 字段当初由他席按**句腰**切开（新段以「and the rest of that closed set),」「and — on the prompt face only」开头），与 §2.12.4「在句界插空行」不符 | 重切到分隔符 / 句号边界：三段各 **161 ∥ 209 ∥ 111** 字，段尾分别落在 `),` ∥ `lists.` ∥ `pass.` |
| ② | 评审 🟡 | 同档段判据射程写成「on any face」，而引擎对提示词面只走逐行判（`thincoder-core/doc-check/paragraph.mjs:100` 的 `continue`），设计档亦把提示词面划在外（`docs/core/design/DOC-DISCIPLINE.md:960`「其余面（含 `thincoder-core/tool-docs/**`）按段判」）⇒ 描述面与实际行为相抵，正是本批 E2 / A-DD35 ⑤ 要治的形 | 射程收窄为「on every non-prompt face」；**载体未换**——「全部面同判」仍由 `No face is exempt` 句承载（§2.12.3 E2 判据不动） |
| ③ | 评审 🔵 | `test/integration/batch-close-gate.test.mjs` 档头枚举漏 7-9 | 档头用例表补 7-9 + 一行夹具形（两条判据同判 · 只修锚仍拒 · 拆段后放行） |

**未采纳 / 报父侧（4 条，均非本席笔或预存）**：

- 🟡 `test/RTM.md:93` 结果列仍「待执行」——父侧笔，§5.6 ① 已上抛。
- 🔵 夹具名对不上：`test/RTM.md:93` 写 `x.md`，而实测夹具名是 `probe`（集成档 7-9 在系统临时域里现建，不落仓）——RTM 侧改述为宜（父侧笔）。
- 🔵 `thincoder-core/doc-check/paragraph.mjs:94` 的 `catch { continue }`（读不到的档当干净）——预存，设计档 A-DD35 ① 已登记并要求夹具先落盘，本批未改。
- 🔵 §2.12.1 该行写集成档「结构不变」，而实落是新增 7-9 一例（+10 行）——§5.1 已按实读记 345 → 355。

**轮次与终态**：审计 1 轮 · 评审 1 轮 · 自修 3 条 · **终态 = clean（🔴 遗留 0）**。修后复跑：`thincoder-core/tool-docs/doc_check.md` 报告 **0 命中**（84 行）；集成档 **8/8 pass**；`anchor-judged only` ∥ `Face scope` 各 **0**。

### 5.7 乙席落地面（15 档 · 段判据清账 · 2026-10-28）

**派单域** = `thincoder-core/tool-docs/` 下 15 档，派单明确「一个不多、一个不少」。判据 = 相邻非空正文行合并成段、`[...line].length` 求和 > 300 即命中。

**口径**：行数 = `split('\n').length - 1`（§1.14 统一尺）；段长 = 引擎 `checkParagraphs` 读数。

| 档 | 行数 HEAD → 现 | 段长 HEAD → 现 |
|---|---|---|
| `thincoder-core/tool-docs/skill.md` | 5 → **7** | 471 → **253** |
| `thincoder-core/tool-docs/execute.md` | 13 → **15** | 421 → **212** |
| `thincoder-core/tool-docs/plan.md` | 5 → **7** | 416 → **228** |
| `thincoder-core/tool-docs/code_search.md` | 0 → **2** | 384 → **194** |
| `thincoder-core/tool-docs/consult_stop.md` | 2 → **4** | 378 → **267** |
| `thincoder-core/tool-docs/manifest-read.md` | 8 → **9** | 359 → **277** |
| `thincoder-core/tool-docs/manifest.md` | 29 → **31** | 314 → **273** |
| `thincoder-core/tool-docs/recent_changes.md` | 0 → **2** | 357 → **283** |
| `thincoder-core/tool-docs/browser.md` | 48 → **50** | 356 → **234** |
| `thincoder-core/tool-docs/read_image.md` | 8 → **10** | 353 → **230** |
| `thincoder-core/tool-docs/repo_outline.md` | 0 → **2** | 343 → **238** |
| `thincoder-core/tool-docs/git.md` | 28 → **30** | 340 → **256** |
| `thincoder-core/tool-docs/delete.md` | 15 → **16** | 330 → **260** |
| `thincoder-core/tool-docs/fetch.md` | 13 → **15** | 325 → **243** |
| `thincoder-core/tool-docs/websearch.md` | 18 → **20** | 311 → **249** |

**合计**：15 段 → **0 段**；每档 +1~+2 行，新增行**全为空行**（`code_search` / `recent_changes` / `repo_outline` 三档 HEAD 无末行换行，故按统一尺记 0）。

### 5.8 验收读数（本席自跑）

- `doc_check` report（清单 = 本席 15 档）⇒ **命中 0 条**（锚 0 · 文字太长 0 · 行太长 0）。
- 引擎直调 `checkParagraphs({paragraphMax:300, lineMax:300, exemptZones:[], files})` ⇒ **0 段**；本席面最大段 = `thincoder-core/tool-docs/recent_changes.md` `:1` = **283**，次大 `thincoder-core/tool-docs/manifest-read.md` `:5` = **277**。
- HEAD 复跑对照：逐档 HEAD 段长与 §2.5 登记值**逐项相同**（471 / 421 / 416 / 384 / 378 / 359 / 314 / 357 / 356 / 353 / 343 / 340 / 330 / 325 / 311）⇒ 判集与口径可复跑，读数不是估字数。
- 文本等价：`git show HEAD:<档>` 与现盘逐档比对（非空行以单空格相连、空白折叠后逐字比）⇒ **15/15 完全相同** —— 只插空行、零增删字。
- 围栏平衡：15 档围栏标记数全为 0 或成对 ⇒ 不存在「围栏未闭合至档尾免」造成的假绿。

### 5.9 决策透明表

- ① 拆法 = 句界插空行：15 档中 14 档是多句段，插空行即足，**零断句**。
- ② `thincoder-core/tool-docs/git.md` `:3`（340 字单句）按 §2.12.4 在**已有 `:` 处**断开：前段 = `**Route to git instead of bash** — every sub-command maps to the same-named action:`（83），后段 = 子命令清单（256）。合回一段即 339 > 300，故不可合。
- ③ `thincoder-core/tool-docs/manifest.md` `:10` 的段句界跨行（首句止于行中）⇒ 在「…resolve against it.」后断开，「A workspace target」起为下一段（原属同一硬折行段）。
- ④ 每档只拆到两段即止（或沿用原段界）—— KD3「先拆段、断句最小化」，空行能少则少。
- ⑤ 域界面：只写本席 15 档；引擎档 ∥ 缝档 ∥ 描述档 ∥ 集成档 ∥ 甲席 13 档 ∥ 需求与设计档**零笔**。
- ⑥ 三处缩进续行（`thincoder-core/tool-docs/manifest.md` `:7`–`:8` = 180 ∥ `:12`–`:14` = 211）被引擎计入段、现合规；此处**不能用插空行再降**（插空行会把后半句从 bullet 剥离），本轮不动，留备忘。

### 5.10 自审 ∥ 评审核 ∥ 终态

| 环节 | 轮次 | 结论 |
|---|---|---|
| 内部 explore 分歧审计（对 §2 逐档复算） | 1 | **CLEAN（0 blocking）**；其审计侧局限（无 git 工具、未能跑 diff）已由本席 `git show` 逐档比对补齐 |
| 内部 advisor 代码评审（`type=code`） | 1 | **pass** —— 🔴 0 · 🟡 0 · 🔵 4 |
| 修复轮 | **0** | 4 条 🔵 全为备案项，无 must-fix |
| 终态 | — | **clean** |

### 5.11 对 4 条 🔵 的答复

| # | 建议 | 处置 |
|---|---|---|
| 1 | `thincoder-core/tool-docs/git.md` `:5` 成孤立片段，可选把 `:3` 收成完整句 | **不改**：两侧现为 83 ∥ 256，合并即 339 > 300；在 `:` 断开是 §2.12.4 授权的改法 |
| 2 | `thincoder-core/tool-docs/manifest.md` `:7` 缩进续行计入段、插空行不可再降 | **备案不动**：现 180 合规；后手若需再压，用改写/重排 |
| 3 | `thincoder-core/tool-docs/recent_changes.md` `:1` 余量仅 17 | **备案不动**：本轮合规；今后加内容先在该段末句前插空行 |
| 4 | 15 档改后行数须登记入 §5 | **已落**：见本节 5.7 表 |

### 5.12 观测（非本席验收面）

读数时点全 54 档 ⇒ **0 段 / 0 档**；甲席 13 档已落（`thincoder-core/tool-docs/subagent.md` 995→298 ∥ `thincoder-core/tool-docs/timer.md` 1662→271）。此为父侧收口面读数，本席不作验收依据。

### 5.1 甲席交付范围（13 档 · 22 段）

**写域 = 派单指定的 13 档**（均在 `thincoder-core/tool-docs/` 下）：`subagent`(8 段) · `read_history`(3 段) · `timer` · `edit` · `settings` · `verify` · `consult_start` · `memory` · `task` · `ssh` · `doc_search` · `goal` · `lint`（后 11 档各 1 段）。合计 **22 段 = §2.12.2 甲组读数**。

**未碰**：`thincoder-core/doc-check/paragraph.mjs` 与 `thincoder-core/tool-docs/doc_check.md`（引擎席）· `scripts/doc-check-paragraph.mjs`（父侧）· `test/integration/batch-close-gate.test.mjs` 与 `docs/core/design/API-CONTRACT.md`（引擎席）· 乙席 15 档。全仓 `isToolDocFace` 本席零写入。

### 5.2 红绿读数（同命令 · 同判集 · 只差「清账」一处）

口径 = `checkParagraphs({paragraphMax:300, lineMax:300, exemptZones:[], files})`；判集 = 上述 13 档；cwd = 仓根。

| 态 | 读数 | 说明 |
|---|---|---|
| **红**（撤豁免后、清账前） | **22 段 / 13 档** | 本席 2026-10-28 11:36 实跑；此时引擎谓词已删（全仓 `isToolDocFace` 零命中）⇒ 真红 |
| **绿**（清账后） | **0 段 / 13 档** | 同命令复跑 |

**红读数逐档**：`subagent` 8 · `read_history` 3 · 其余 11 档各 1（timer · edit · settings · verify · consult_start · memory · task · ssh · doc_search · goal · lint）。

**口径声明**：§2.12.5 把「撤豁免前 = 0 段」记为症状、不是红；本席登记的是「撤豁免后、清账前」的真红，即评审轮次 2 的 N3 要求那一项。

### 5.3 逐档改后读数（行数式 = `split('\n').length - 1`，§1.14 口径）

| 档 | 段数 | 改后行数 | 最长段（改后） |
|---|---|---|---|
| `subagent` | 8 | 88 | 288 |
| `read_history` | 3 | 19 | 283 |
| `timer` | 1 | 20 | 271 |
| `edit` | 1 | 35 | 275 |
| `settings` | 1 | 14 | 290 |
| `verify` | 1 | 13 | 277 |
| `consult_start` | 1 | 9 | 291 |
| `memory` | 1 | 14 | 245 |
| `task` | 1 | 9 | 276 |
| `ssh` | 1 | 49 | 294 |
| `doc_search` | 1 | 5 | 213 |
| `goal` | 1 | 8 | 210 |
| `lint` | 1 | 11 | 287 |

**两点说明**：① `verify` 与 `doc_search` 两档改前末字符不是换行，故该式改前读数记 0（评审轮次 2 已确认「末行号 vs 行数」这把尺差 1 的老问题）；现 13 档均以换行收尾。② `ssh` 行数 51→49 是重排五行为两段所致，非删行。

### 5.4 改法口径（§2.12.4）与禁项守全

**手段**：多句段在句界插空行；单句本身超 300 者，在句中**已有**分隔符处换行（半角 `, ; — :` 与全角 `，；：——` 同等）。**只增删空白，不改一个字面**。

**逐档自证**：13 档去掉全部空白后与 `git show HEAD:` 版本逐字符相等 —— 即无删字、无增字、无调序。

**禁项**：未删事实、未改语义、未动命令 / 参数 / 坐标 / 码段字面、未动围栏与表格结构。前后计数对照：围栏行 0→0、表格行 0→0、四空格以上缩进 0→0（13 档全部）。

### 5.5 验收读数（本席实跑）

| 判项 | 命令 / 方式 | 结果 |
|---|---|---|
| 段判据 | `checkParagraphs({paragraphMax:300,lineMax:300,exemptZones:[],files})`，判集 = 13 档 | **0 命中 / 13 档**；最长段 294（`ssh`） |
| 三判据合跑 | `doc_check` report（清单 = 本席 13 档） | **命中 0 条**（锚 0 · 文字太长 0 · 行太长 0） |
| 字面无损 | `git show HEAD:` 版本 vs 现文，去空白比对 | 13 档全部相等 |
| 结构不变 | 围栏 / 表格 / 深缩进行计数 | 全部 0→0 |

### 5.6 审计与评审轮次 · 终态

**audit（explore 只读，1 轮）**：`AUDIT VERDICT: clean` —— 四类偏差（半途、静默简化、文档漂移、清单外）零。它同时如实标了两项在它的装配面不可测（无 git / 无 execute）：与 HEAD 的空白对照、结构前后计数。**该两项由本席以 5.4 / 5.5 的读数自证，不留在「未测」。**

**advisor code review（1 轮）**：`VERDICT: pass`，无 🔴，🟡 1 · 🔵 3。

🟡 已当场修好（纯空行移动，字面零改）：`edit` 档的段界原落在 `then fuzzy match` 之后（非分隔符），现移到已有逗号 `after trimming,` 之后；`subagent` 档的段界原落在 `refused with expired named` 之后，现移到已有逗号 `is refused,` 与已有分号 `optional for one;` 之后 —— 修后该段 204 / 159 / 188 字符，均 ≤300。

🔵 之二（`subagent` 档 `:46`+`:47` 合并 ≈298，贴线 2 字符）随本次修正消失：该档最长段由 298 降为 288。

**终态 = clean**（修正轮 1 轮；遗留 🔴 0 · 遗留 🟡 0）。

### 5.7 未消残余（交父侧；不在本席写域，本批不改）

1. **列表项长块 5 条**：`memory` 档 `:5`（约 490 字）· `memory` 档 `:7`（约 498 字）· `subagent` 档 `:6` · `:8` · `:33` 仍 ≥300 字符，靠引擎「列表项不计入段且断段」通过。它们不是本席造的（原档同形，引擎改前读数里列表项从不命中）。**收口读数须限定为「非列表正文段 0 命中」**，不可转述为「该面已无长块」（同 §1.15 的「病被盖住」纪律）。

2. **`read_history` 档 `:17` 段尾为全角「；」**：原 314 字单句是用空行切开、未重写为两句。该分隔符在 §2.12.4 集内，判合规；重写属改字面，本批禁项内不做。

### 5.8 本节自跑门读数

`doc_check` gate（清单 = 本席 13 档）⇒ `DOC-CHECK GATE: PASS`，命中 0 条（锚 0 · 段 0 · 行 0）。

## §6 验证与收口（父代理）

### 6.1 父侧亲测（2026-10-28 11:5x，`node` 实跑）

| 验收 | 父侧读数 | 判 |
|---|---|---|
| 锚判据（54 档） | **0 命中** | ✅ |
| 段判据（54 档） | **0 命中 / 0 档** | ✅ |
| 谓词面 | `thincoder-core/doc-check/paragraph.mjs` **135 行**（148−13）· `isToolDocFace` 源码 **0 次** · `isPromptFace` 仍在 | ✅ |
| 描述档自身 | 行 84（设计估 83）· 段 **0** · `Face scope` 0 · `anchor-judged only` 0 · `non-prompt face` 1 | ✅ |
| **判别力（真红）** | 400 字单段夹具 ⇒ **1 条命中 `{line:3, len:400}`** —— 病显形，不是判据变松 | ✅ |
| **内容零语义（28 档）** | 「去掉所有空白后，改前 vs 改后逐字相等」= **28/28 ✓** | ✅ |
| 唯一内容变了的档 | `thincoder-core/tool-docs/doc_check.md` —— **有意**（删 Face scope 条 · 删 `anchor-judged only` · 补「No face exemption」句） | ✅ |
| 行数变化合理性 | `edit` +16 · `subagent` +23 · `read_history` +13 · `verify` +13（原为 0 行 = 整段到底）；`ssh` **−2** = 原档把一句折成 4 行，重排后按句界拆（内容不变） | ✅ |

### 6.2 一句必须写清的收口口径（甲席上抛，父侧实测采纳）

**「54 档 0 命中」的意思是「**非列表正文段** 0 命中」，**不是**「该面已无长块」。**

**★ 父侧实测：列表项中 >300 字符的行还有 **23 条**（最长 `thincoder-core/tool-docs/glob.md:4` = 728 字符）—— 它们靠引擎「列表项结构性断段、不入段判据」通过，与表格行同理。**

**⇒ 那是**机制设计**（列表项与表格行都结构性不可折行），不是缺陷、也不立债。**

**★★ 但这个区分必须写着：**把「0 命中」说成「没有长块」，就是本批要治的「病被盖住」换了个地方。****

**★ 对照读数：**非列表项中 >300 字符的行 = 0** —— 该判的都清了。**

### 6.3 未覆盖面

1. **`thincoder-core/tool-docs/manifest.md` 两处缩进续行**（`:7`-`:8` ∥ `:12`-`:14`）余量是死的 —— 插空行会剥离列表项后半句。**记台账 `#1872`**（现值 180 ∥ 211，暂时安全）。
2. **列表项长块 23 条**不入段判据 —— 机制设计，不立债，但口径已在 6.2 写清。
3. **`read_history:17` 段尾是全角「；」** —— 原 314 字单句用空行切开、未重写为两句；该分隔符在 §2.12.4 集合内，判合规；重写属改字面，本批禁项。

### 6.4 结算清单

- **§2 ↔ 设计档对账**：§2.12 定稿（4 组 dispatch）↔ 三席实际写域（引擎 4 档 + 甲 13 + 乙 15），逐项相符。
- **前批遗留交叉核**：`#1868` 由本批结清。
- **修正轮落地前提**：第 1 轮 13 条已修 + 第 2 轮 pass；实施期无修正轮（三席各自 clean）。
- **用户面同步**：**有** —— 工具描述对模型的行为变了（该面从此受段判据约束），但**无用户可见入口**（工具描述是模型读的），故记「无用户可见面」。
- **台账沉降**：`#1868` 结清；`#1872`（续行）新行。
- **§5 处置**：有实施内容（引擎 4 档 + 28 档拆段），不适用「不适用」判。
- **`test/RTM.md:93` 结果列**：改判已落（锚与段两条同时点名），**结果列仍「待执行」** —— 父侧笔，本轮不改（该节 7-4/7-6/7-7/7-8 同为「待执行」，属既有登记形态）。
