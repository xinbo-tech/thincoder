# 2026-11-01 · line-ref-prompt-holes
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-11-01 · 来源 = 用户 2026-11-01 20:52「不能用行号做引用」+ 20:55「口子清干净了吗？」+ 20:56「开啊！」。
> 台账 = #1965（PROMPT-SYSTEM · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-11-01
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

## 1. 讨论与结论（主 agent）

**覆盖账 = #1965**

### 1.1 用户令（逐字三条）

> 20:52：「**我不管原来是怎么样的，细则是怎么说的，我只有一个强制性要求：不能用行号做引用**」
> 20:55：「**你用机械拦，拦得住吗？你提示词和文档里的口子清干净了吗？**」
> 20:56：「**开啊！**」

### 1.2 规范档已经禁了，提示词还在命令

`docs/core/design/DOC-DISCIPLINE.md:49` 起（父侧已落）：指规则 ⇒ 节名 + 逐字引文；指代码 ⇒ 符号名；读数 ⇒ 量法 + 日期，不配行号。

**而提示词面 21 处在教相反的事**（本会话实测，扫 `thincoder-core/prompts` 与 `thincoder-core/tool-docs`）：

```
thincoder-core/prompts/advisor-design.md        3 处（含「Cite with the exact file:line format」）
thincoder-core/prompts/advisor-round1.md        2 处
thincoder-core/prompts/advisor-round2.md        2 处
thincoder-core/prompts/advisor-round3.md        2 处
thincoder-core/prompts/common.md                4 处（证据纪律四条主句）
thincoder-core/prompts/consult-base.md          1 处
thincoder-core/prompts/discipline-normal.md     1 处
thincoder-core/prompts/persona-eng-designer.md  3 处（含「coordinates YOU write must carry file:line」）
thincoder-core/prompts/persona-engineering.md   3 处
thincoder-core/tool-docs/notify_parent.md       1 处
thincoder-core/tool-docs/question.md            1 处
```

**最刺眼的一处**：`persona-eng-designer` 命令设计席「你写的坐标必须带 `file:line`」，**而设计席写的正是规范档**。**⇒ 一边禁、一边命令，模型照它读到的那一个办。**

### 1.3 为什么不做机械闸（已撤销的那条路）

**挡不住绕行，只挡老实人。** 本仓已有判据：`docs/core/design/TOOLS.md` §6.4 —— 文本匹配拦截被否定（安全剧场）。**且提示词还在命令写行号，闸建多严密都会被照办、被拒、再绕。**

**⇒ 真防线 = 提示词里不留口子。** 本批就做这件事。

### 1.4 替换成什么（三种形，按引用对象分）

| 原来 | 换成 | 读者拿它查什么 |
|---|---|---|
| 引文档里的规则 | **档 + 逐字引文** | 这句话还在不在 |
| 引代码里的东西 | **符号名**（函数 / 常量 / 导出名） | 这个名字还声明不声明 |
| 报一个读数 | **量法 + 日期** | 当时怎么量的 |

**证据纪律不削弱**：原来要「可核查」，现在还是要 —— **只是把「位置」换成「内容」**（逐字引文比行号更能证明你说的是那一句）。

### 1.5 边界

- **只动提示词面与工具描述面**（中文正本在设计档里同拍改）+ 批档 §2/§5。
- **存量文档里一万多处行号引用不在本批**（用户 20:54 明示「没要求现在就扫存量」）。
- **改完要保证证据纪律语义等价**：每一处替换后，读者仍能独立核到同一件事。

### 1.6 设计席任务（父侧口述落档 · 排队中，起来先读本节）

**一句话**：**把那 21 处「必须写 `file:line`」的指令，换成不依赖位置的三种形；证据纪律的力度一点不能降。**

**为什么这件事比机械闸重要**：闸挡不住绕行；**提示词是模型真会照办的东西**。同一句话（`docs/core/design/DOC-DISCIPLINE.md` 说禁、`thincoder-core/prompts/persona-eng-designer.md` 说必写），**模型照后者办** —— 本会话已实测过多次。

### 1.7 你要判的三件

**① 证据纪律怎么在不写行号的前提下仍然可核。**
现在是「cite `file:line`」——**可核 = 读者能自己走过去看**。换成「档 + 逐字引文」后，**读者拿引文在档里搜**，同样能核、而且不怕漂。**你要给出这套替换的判据句，并说明它在哪一类断言上会变弱**（诚实地写，别写成没有代价）。

**② 三份 advisor 提示词 + consult-base 是同一段句子复制了四份。**
改的时候**是同句同改，还是收成一处再引用**？**给判断与理由** —— 复制四份的东西改一次还要改四次，这本身就是漂移源。

**③ 工具描述面（`notify_parent` ∥ `question`）的「carry the evidence you already checked」怎么办。**
那两句是**上游通道**的话，说的是「别让父级替你重读」。换成引文形还成立吗？**成立就换；不成立就说清为什么这两处要区别对待，以及那个区别不构成「开口」的理由。**

### 1.8 边界

- 写域 = `docs/core/design/PROMPT-SYSTEM.md`（中文正本）+ 批档 §2。**提示词本体零触**（实施轮落英文面）。
- **本批只清「教人写行号」的指令，不清已写下的引用** —— 存量扫不扫是另一件事，用户已明示现在不做。
- 裸档名写仓根完整路径；gate 带 `target`。

### 1.9 交回来

① 21 处逐处的「原形 → 新形」② 证据纪律的替换判据句 + 它会变弱在哪 ③ ②③ 两问的判 ④ gate 首行。

### 1.10 用户补正（逐字 · 覆盖 §1.5 的措辞）

> 20:57：「**不要判据只看新增行！**」

**⇒ 判据是全局的。** 已落 `docs/core/design/DOC-DISCIPLINE.md`（父侧笔）：

> **存量同属违规**：写进档的行号引用，不论哪一轮写下的，都受这条约束，不得以「存量 / 入基线 / 以前就这样」申请合规地位。**分轮清理是排队问题，不是判据问题** —— 把判据写成「只判新增」本身就是最坏的一种开口，因为从此新增与存量都各有一半不算数。

**§1.5 第二句的原话「存量文档里一万多处行号引用不在本批」只是排队事实，不是判据边界** —— 本批排的是「先清提示词口子」，不是「只清新增」。

**对设计席的约束因此加一条**：**写判据句时，主语是「写进档的行号引用」，不带任何按时间 / 按轮次 / 按是否新增的限定词。** 一处都别加 —— 加了就是开口。

### 1.11 撤掉我自己造的口子（父侧 · 覆盖 §1.7③ 与 §1.5）

**用户 20:57：「你为啥老开口子！」**

**今天的形状是这样的**：每说完一条规则，下一句就是「除了…」。数一遍：

| # | 我写下的口子 | 处置 |
|---|---|---|
| 1 | 稳定文件可用行号 · 勘察读数可标 as-of 保留行号 | 已删（20:52 用户令后） |
| 2 | 判据只看新增行 | 已删（20:57 用户令后） |
| 3 | 本批「只清教人写行号的指令，不清已写下的引用」 | **改成：本批的清理顺序是提示词优先；「先」不是「只」** |
| 4 | 给设计席的「工具描述面若不能照改，说清为什么两处要区别对待」 | **删。这就是在请它造一个口子** |

**③ 重写（覆盖 §1.7 第三问）**：

> **`thincoder-core/tool-docs/notify_parent.md` 与 `thincoder-core/tool-docs/question.md` 那两处，与其余 19 处照同一形改。**
> **改不动的，停下来报我 —— 不要自行给这两处造一套「上游通道例外」。**

**判据句仍然只有一条，主语是「写进档的行号引用」**：不带「新增 / 存量 / 上游 / 读数例外」任何限定词。

**为什么这次不再补一句解释**：我今天每补一句解释，就多一个可以被当成出口的句子。**规则写成一句话，剩下的由我盯着。**

### 1.12 父侧直接落笔（2026-11-01 21:00 · 21 处 → 0 处）

**用户 20:58：「必须给我清干净！」** ⇒ 不派设计席等，父侧直接改。

**读数（同一条抽取，改前 → 改后）**：

```
改前：thincoder-core/prompts + thincoder-core/tool-docs 共 21 处 file:line 类指令
改后：0 处
diff：13 档 · 42 insertions / 41 deletions
```

**替换形（三种，按对象分）**：

| 原 | 现 |
|---|---|
| `cite file:line` | `the file path plus the exact words you read` |
| `coordinates YOU write must carry file:line` | `must carry their source — the file path plus the exact words, or a symbol name` |
| `Detail = what changed and where (file:line)` | `(the file path plus the exact words, or the symbol name)` |
| `take each entry's coordinate — its file:line` | `take each entry's source — the exact words at their path, or the symbol it names` |

**每处都带上了理由句**（不是只删不留）：`A line number is a citation of nothing: it is a function of how many lines sit above it, so any edit above silently moves it — the reader follows it and lands on something else without knowing.`

**`thincoder-core/tool-docs/grep.md` 那一处**：它不是引用指令，是工具输出格式的事实描述。**改成同一事实的另一种说法**（「each matching line, each preceded by its file path and line number」），**让读的人知道输出长什么样，但不给出一个可以直接抄去当引用的 token**。

### 1.13 这一步之后，口子变成了什么样

**提示词面上不再有任何一句教模型写行号。** 剩下的是存量（`docs/**` 一万多处 + 生成区 4,631 处）—— 那是**已经写下的**，不是**还在教人写的**。

**两者的区别就是这批的意义**：教人写的那 21 处不除，清多少存量都会再生。

### 1.14 收口说明（2026-11-01 21:33 · 父侧）

**本批的活完成了，但它的设计面被另一批接走并重写。**

- **活**：提示词面 + 工具描述面 `file:line` 类指令 **21 处 → 0 处**（父侧直落，13 档 / 42 insertions · 41 deletions，读数见 §1.12）。
- **设计面**：§6.66 原按旧理由（「行号是行数的函数、读者会找错」）写成；**用户 21:08 ∥ 21:09 推翻了那条理由**，改「扇出成本」。
- **接手批** = `docs/batches/2026-11-01-prompt-system-lineref-rework.md`（台账 `#1966`）：**整节重写 §6.66**，并已过设计评审（轮次 1→2→3）。

**⇒ 本批不再单独评审设计**：同一份设计已被 `#1966` 的三轮评审覆盖，再评一次是拿同一对象走两遍。

> 不适用：§3 —— 设计面已由 `docs/batches/2026-11-01-prompt-system-lineref-rework.md` 整节重写并经三轮评审；本批无独立评审对象。

**重开记录**：2026-11-01 · 原收口 2026-11-01 · 理由 = 评审收尾需写 §3（本轮两次写入因冻结被拒）：§1.14 把「不适用 §3」落在 §1，§3 本体至今空白，台账 #1965 核销机检因此过不去。重开只为补 §3 记录 + 状态行，随后立即再收口。 · 操作者 = 主 agent
## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（设计档 §6.66 + §7 D-PS58 已落；提示词面残留两处待实施轮，需求面 D4 行相冲突已上抛）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试覆盖 / 验收对照 / 关键决策 / 上抛项>

## 2. 批次任务与设计（eng-designer）

**覆盖账 = #1965** · 设计档落点 = `docs/core/design/PROMPT-SYSTEM.md` §6.66 ∥ §7 D-PS58。

### 2.1 本批覆盖

| # | 本批条目 | 需求面 | 设计档落点 | 覆盖状态 |
|---|---|---|---|---|
| 1 | 提示词面证据形 = 三形替换（档 + 逐字引文 ∥ 符号名 ∥ 量法 + 日期）；行号不作引用形 | `docs/core/requirements/ENGINEERING-MODE-V2.md` 的 D4 行 —— **与本批判据句相反，待父侧裁**（设计档 §6.66 上抛 1） | 设计档 §6.66 ∥ §7 D-PS58 | 设计完成 · 提示词面 21 处父侧已落，残留两处待实施轮 |
| 2 | 同句复制五份的处置（同句同改 ∥ 收成一处再引用） | 同上 | 设计档 §6.66「同句复制五份的处置」 | 已判：同句同改，设计档不记第三份；防线 = 收口一次逐字节读数 |
| 3 | 工具描述面两处（`thincoder-core/tool-docs/notify_parent.md` ∥ `thincoder-core/tool-docs/question.md`）的同一形改法 | 同上 | 设计档 §6.66「两处工具描述」 | 已判：同形照改、不设例外；两处现盘已是新形 |

### 2.2 本批不做（边界）

存量文档里的行号引用（排队的先后，不是判据边界）· 不改 `docs/core/design/DOC-DISCIPLINE.md` 的 D4 细则语义 · 不新增机检门、不设豁免 · 提示词本体本设计轮零笔 · 需求档零笔（主 agent 笔域）· 工具参数说明里的 `line` / `offset` / `after_line`（工具契约，不是引用形态）。

### 2.3 受影响文件（完整清单 + 档位结论）

| # | 档 | 面 | 本轮动作 | 档位结论 |
|---|---|---|---|---|
| 1 | `docs/core/design/PROMPT-SYSTEM.md` | 设计档 | 本席落（§6.66 + §7 D-PS58） | 未跨档位 |
| 2 | `thincoder-core/prompts/persona-plan.md` | 提示词面（产品代码） | 实施轮落 H1 | 未跨档位 |
| 3 | `thincoder-core/prompts/advisor-round2.md` ∥ `thincoder-core/prompts/advisor-round3.md` | 提示词面 | 实施轮落 H2 | 未跨档位 |
| 4 | `thincoder-core/prompts/advisor-design.md` ∥ `thincoder-core/prompts/advisor-round1.md` ∥ `thincoder-core/prompts/consult-base.md` | 提示词面 | 只核（验收 5 的逐字节相等） | 未跨档位 |
| 5 | `thincoder-core/tool-docs/notify_parent.md` ∥ `thincoder-core/tool-docs/question.md` | 工具描述面 | 零笔（已换形） | 未跨档位 |
| 6 | `docs/batches/2026-11-01-line-ref-prompt-holes.md` | 批档 | 本段 | — |

### 2.4 验收（回指设计档 §6.66，逐条可机判）

| # | 验收 | 判法 / 读数 | 回指 |
|---|---|---|---|
| 1 | 判据句在场、不带限定词 | 扫 `写进档的行号引用一律不是引用形态` ≥1；该句扫 `新增|存量|上游|读数例外` ⇒ 0 | 设计档 §6.66 A1 |
| 2 | 提示词面 `file:line` 清零 | 域 = `thincoder-core/prompts` + `thincoder-core/tool-docs`，扫字面 ⇒ 0 | 设计档 §6.66 A2 |
| 3 | H1 指令形清除 | 扫 `file paths and line numbers` ⇒ 0 | 设计档 §6.66 A2 |
| 4 | H2 举例无坐标 token | `thincoder-core/prompts/advisor-round2.md` ∥ `thincoder-core/prompts/advisor-round3.md` 举例行扫 `\.mjs:\d` ⇒ 0 | 设计档 §6.66 A3 |
| 5 | 五份复制逐字节相等 | `node` 各取含 `An assertion has two sources only` 的一行，逐字节比较 ⇒ 全等 | 设计档 §6.66 A4 |
| 6 | 文档纪律 | `doc_check(mode:"gate", target:"D:/teamcode/thincoder")` 首行 `PASS` | 设计档 §6.66 A5 |

**测试覆盖**：本批零代码档、无可断言的行为导出值 ⇒ 不建改面单测档；验收读数 = 上表 2 与 5 的两条 `node` 一行，实施轮报 §5。集成测试设计 `none`（理由 = 设计档 §6.66 同项）。

### 2.5 上抛项

1. 〔待裁 · 需求面与判据句相反〕`docs/core/requirements/ENGINEERING-MODE-V2.md` 的 D4 行仍写「射程 = 指针：实施坐标 / 盘点 as-of 读数 / 评审证据引文各归其面，不在本条射程内」——与判据句及设计档 D4 细则（指代码写符号名 · 读数不配行号）描述同一机制而内容相反。需求档 = 主 agent 笔域，本席零触。
2. 〔待落 · 提示词面两处〕H1（`thincoder-core/prompts/persona-plan.md:25` 指令形）∥ H2（`thincoder-core/prompts/advisor-round2.md:46` ∥ `thincoder-core/prompts/advisor-round3.md:48` 举例形）——父侧口径为「21 → 0、零处存活」，本席实读为 2 处形态存活。
3. 〔知会〕设计档 §7 编号落 D-PS58；可由父侧收口时改。

## §3 设计评审（评审子代理）
**状态行**：评审通过



### 轮次 1（评审子代理）

### 收尾确认（重开后补写 · 评审子代理）

**对象**：本批 §1.14 声明「设计面已由 `#1966` 整节重写并经三轮评审，本批 §3 不适用」+ §6 的交付读数。判据 = 两项成立即通过。

**① `#1966` 确实重写了同一节 —— 成立**

- 同节号、同节名：`docs/core/design/PROMPT-SYSTEM.md` §6.66 标题逐字「提示词面证据形：引用钉内容，不钉位置（扇出成本判据 · 两种引用形 + 一条读数规则）」。
- 来历 = 新理由 + 接手账：该节「来源」行逐字引用户 21:08「他这个理由不对！因为如果用行号做引用，原文改了，引用他的文件就都得改！工作量大过天！」∥ 21:09「而且改一处，后续的所有位置都漂移，大量的引用文件都要改！」，收尾即「台账 `#1966`」。
- 判据句是扇出形、不是旧的「读者会找错」形：「判据句」引用块逐字「**引用只钉内容，不钉位置。** 行号钉的是位置：上面插一行，它以下整片引用同时失效——代价不落在某一次读错上，落在每一次改动上」；配套「行号形有两笔代价，判据只立在第一笔上」两笔代价表 + K3 逐字「第一笔（扇出）立判据，第二笔（静默）降为补充」。
- 「实测」表在场、逐行带量法与日期：标题逐字「实测（本席本轮 `node` 实算 · 2026-11-01）」，下五行读数（1,195 处 / 101 档 · 381 处 / 14 档 · 4,037 处 / 81 档 · 4,633 行 · 0 处）。
- 批档 §2 的三项判在重写后的节里都有落点：「清单的维护面」逐字「五份保留是硬约束不是偏好：五个槽位各自独立装配」；证据形清单 D 组含 `thincoder-core/tool-docs/notify_parent.md` ∥ `thincoder-core/tool-docs/question.md`（处置列「合规，零改」）。

**② 本批 §6 的读数不是空话 —— 成立（一处对不上账）**

- 21 → 0 有读数 + diff + 两次实扫：§6.1 代码块逐字「改前 = 21 处 · 改后 = 0 处」「diff = 13 档 · 42 insertions / 41 deletions」，紧接逐字「交付时父侧实扫两次（改完一次、清工具描述面那条之后复扫一次）」。
- 两个补扫点有名有逐字前后形：§6.2 的 `thincoder-core/prompts/persona-plan.md` 那条「`cite real file paths and line numbers` → `... and the exact words you read`」，与两档 advisor 的举例「`run.mjs:180: …` → 去可抄坐标」。
- 13 档可对上：§1.2 逐档清单 11 档 + §1.12 的 `thincoder-core/tool-docs/grep.md` 一处 + §6.2 的 `thincoder-core/prompts/persona-plan.md` 一档 = 13，与 §6.1 的 diff 档数自洽。
- 「改后 = 0」有独立旁证（非本批自证）：§6.66 验收 A2 逐字「70 档扫正则 `file:[0-9]` ⇒ **0**（本席本轮实扫 = 0）」。
- 对不上账的一处：§1.2 逐档清单相加 = 23，而句头与 §1.12 / §6.1 写 21 —— 见下表第 1 条。

| # | Category | Severity | Issue | Suggestion |
|---|---|---|---|---|
| 1 | Clarity（读数可复现） | 🟡 | §1.2 的逐档清单逐字为「`thincoder-core/prompts/advisor-design.md` 3 处 · `thincoder-core/prompts/advisor-round1.md` 2 处 · `thincoder-core/prompts/advisor-round2.md` 2 处 · `thincoder-core/prompts/advisor-round3.md` 2 处 · `thincoder-core/prompts/common.md` 4 处 · `thincoder-core/prompts/consult-base.md` 1 处 · `thincoder-core/prompts/discipline-normal.md` 1 处 · `thincoder-core/prompts/persona-eng-designer.md` 3 处 · `thincoder-core/prompts/persona-engineering.md` 3 处 · `thincoder-core/tool-docs/notify_parent.md` 1 处 · `thincoder-core/tool-docs/question.md` 1 处」= 相加 **23**；而同一句句头逐字「**而提示词面 21 处在教相反的事**」，§1.12「改前：… 共 21 处 file:line 类指令」与 §6.1「改前 = 21 处」也写 21，设计档 §7 D-PS58 亦写「提示词面 21 处父侧已落」。按清单复算得 23、按标题读得 21，下一个人无法重算这批的招牌读数。 | 二者择一改齐：把清单处数改到合计 21 并注明差额去向（哪两处不算「指令」），或把句头 / §1.12 / §6.1 / D-PS58 的读数改成 23；同时在 §6.1 的读数块内写清计数口径（「处」= 行命中 ∥ 指令条数）。 |
| 2 | Clarity（验收可判性） | 🟡 | §6.66 验收 A3 逐字「70 档扫 `fabricated or stale` ⇒ **0**（改前 2 处…）」，而同节「勘察证据行」逐字「`fabricated or stale` = **2**」、上抛项 3 登记「B 组 2 处…**改**：理由换成扇出形…待落」；A4 同样写「`every citing file` ⇒ **4**（改前 2 …）」而证据行写「`every citing file` = **2**」。A2 / A9 明标「本席本轮实扫」，A3 / A4 未标 ⇒ 收口人照表读会记「A3 已清零」，照盘上读仍是 2 处旧理由。 | A3 / A4 的读数加时点限定（如「B 组落笔后 ⇒ 0 / 4；现值见「勘察证据行」= 2 / 2，落笔见上抛项 3」），或把验收列拆成「目标读数 / 当前读数」两列，使收口人不会把未落笔的项记成已达标。 |
| 3 | Document ownership（跨档回指错位） | 🟡 | §2.4 验收表的 A 编号与内容错位：验收 4「H2 举例无坐标 token」回指「§6.66 A3」，而 A3 是「旧理由清零」；验收 5「五份复制逐字节相等」回指「A4」，而五份逐字节是 A5；验收 6「文档纪律」回指「A5」，而是 A7。验收 1 的判法逐字要求「扫 `写进档的行号引用一律不是引用形态` ≥1」，该串在 `docs/core/design/PROMPT-SYSTEM.md` 已 0 命中——§6.66 判据句已换成扇出形，现 A1 扫的是「块内逐字含 `引用只钉内容，不钉位置`」。 | 重写 §2.4 的「回指」列与验收 1 的扫描串对齐现设计档（A1–A9 编号 + 现行判据句），或加一行「本表按重写前 §6.66 写就，现行判法以设计档 A1–A9 为准」。 |
| 4 | Clarity（记录面读数形） | 🔵 | §6.1 的读数块只有数（`改前 = 21 处 · 改后 = 0 处` · `13 档 · 42 insertions / 41 deletions`），量法散在 §6.2 散文「第一次扫描用的是 `file:line` 字面」，日期只在档头；对照 §6.66 用例 C3 给批档定的读数形「合规：量法 + 日期，住记录面」。 | §6.1 块内补一行量法与日期（扫描域 + 正则 / 计数口径 + `node` 实算 · 2026-11-01），使读数可被下一个人重算。 |
| 5 | Document ownership（数值漂移） | 🔵 | 生成区读数两处不等：§6.3 第 1 条逐字「生成区 4,631 处全消」vs §6.66「实测」表逐字「**4,633 行**（`git diff --numstat` = 4633 / 4633）」。 | 以 `git diff --numstat` 的 4,633 统一，或在批档那处注明是行数口径。 |
| 6 | Doc hygiene | 🔵 | §6.66 上抛项 4 逐字「本节是对既有 §6.66 的重写，不新增 §7 机制条目（同一机制、同一编号，换的是判据所立的代价）」把变更史留在设计档的规范面；变更史属记录面（§7 D-PS58 行已在，不新增条目的信息可由编号本身承担）。 | 收口时把「重写 / 换的是哪一笔代价」移入批档记录面，设计档只留「同一编号、无 §7 新条目」一句。 |
| 7 | Feasibility（前提不可核） | 🔵 | §1.14 逐字「已过设计评审（轮次 1→2→3）」的核对对象 = `docs/batches/2026-11-01-prompt-system-lineref-rework.md` 的 §3，不在本轮评审范围 ⇒ **unverified**；① 的成立不依赖它（靠 §6.66 本体）。 | 无需动作，仅记明该项未核。 |

**计数**：🔴 0 · 🟡 3 · 🔵 4。

**成立项汇总**：① 成立（#1966 重写了同一节，判据句 = 扇出成本，来源逐字记 21:08 ∥ 21:09）· ② 成立（§6 读数有数、有 diff、有两个补扫点、13 档自洽，且有 §6.66 A2 的独立旁证）。

**未取证项**：`docs/batches/2026-11-01-prompt-system-lineref-rework.md` 的 §3 三轮评审记录（不在本轮范围，未读）——`unverified`。

VERDICT: pass

## §4 用户批准（主 agent）

## 4. 用户批准（主 agent）

**依据 = 用户 2026-11-01 20:47 整批令（逐字）**：「**那你把这三批都处理了吧**」。

**覆盖面**：`#1733` ∥ `#1867` ∥ `#1722` 三批；本批为随后由用户 20:55「**你提示词和文档里的口子清干净了吗？**」+ 20:56「**开啊！**」直接指示的续批。

**批准对象 = 清口子这件事本身**（21 处教人写行号的指令），**不含设计面**（设计面归 `#1966` 的评审链）。

## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）

## 6. 验证与收口（主 agent）

### 6.1 交付读数

```
thincoder-core/prompts/** + thincoder-core/tool-docs/**：`file:line` 类指令
改前 = 21 处 · 改后 = 0 处
diff = 13 档 · 42 insertions / 41 deletions
```

**交付时父侧实扫两次**（改完一次、清工具描述面那条之后复扫一次）。

### 6.2 补扫（设计席 `#8` 抓到的两处遗漏）

**第一次扫描用的是 `file:line` 字面，扫不到散文化的写法** —— 设计席报出两处，父侧已落：

- `thincoder-core/prompts/persona-plan.md` 的 `cite real file paths and line numbers` → `... and the exact words you read`。
- `thincoder-core/prompts/advisor-round2.md` ∥ `thincoder-core/prompts/advisor-round3.md` 的举例 `run.mjs:180: …` → 去可抄坐标。

**这条教训写进了 `#1966` 的判据**：**机器数得出字面，数不出说法。**

### 6.3 未做（如实登记）

1. **存量未清**：`docs/**` 活档的行号引用（设计面 + 需求面）不在本批 —— 用户 20:54 明示「没要求现在就扫存量」。**分期表在 `#1966` 的上抛项 2。**
2. **生成器那一处已单独做**：`scripts/api-contract.mjs` 去行号（改一行，`docs/core/design/API-CONTRACT.md` 生成区 4,631 处全消），**未走本批的评审链**（工程工具面机械改，父侧直落）。
3. **承名形漏扫**：本批与后续批的「0 处」读数都只覆盖窄形（档名紧贴 `:` + 数字）；**承名形（`（`:141`）`）另有一批残量**，已在 `#1867` 的修正轮里清（那是子代理打回来的，属它的功劳）。

### 6.4 收口链核对

- **§2 ↔ 设计档**：本批的设计面不适用（见 §1.14），无一致性可核。
- **台账**：`#1965` → 已核销。
- **暂缓批复核**：无暂缓批。

### 6.5 评审 `#30` 抓的「21 vs 23」—— 父侧处置（2026-11-01 21:38）

**评审指**：§1.2 逐档清单相加 = 23，而句头 / §1.12 / §6.1 / 设计档 D-PS58 都写 21。

**父侧复核结果：这条我复现不出来，如实标 unverified，不编第三个数。**

**为什么复现不出来**：**改前扫描的那一读没有留量法**（只留了逐档处数），而**现在的工作树里混着今天好几批的改动** —— `git diff --numstat` 显示 `thincoder-core/tool-docs/subagent.md` 7/3、`thincoder-core/prompts/discipline-engineering.md` 4/0（后者是 `#1722` 本轮的插入），**被删行无法再归因到本批**。按「被删行含指令形」粗扫得 32 行命中，**这个数把别批的改动也算了进去，不能用**。

**处置**：

1. **本批的验收不建立在前置读数上** —— 验收面是**后置读数**：`file:[0-9]` 在 70 档里 = 0（`docs/core/design/PROMPT-SYSTEM.md` §6.66 验收 A2，独立于本批自证）。**21 还是 23 不改变这个结论。**
2. **§1.2 的句头与明细并存，标为已知不一致**，**不就地改数**：**改哪一边都是我猜** —— 句头若对则明细有一处重复计，明细若对则句头漏计两处；两种改法都会留下一个假数。
3. **下一批的同族工作**（期一 ∥ 期二 ∥ 期三）**扫描时留量法**（正则 + 扫描域 + 日期，写进读数行），**这是本条的真正教训**：**一个没留量法的读数，事后就是一个不能复核的数。**

**⇒ 这条按「已记、未消」留在本档，不按已消处理。**
