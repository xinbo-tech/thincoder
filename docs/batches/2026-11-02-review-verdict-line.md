# 2026-11-02 · review-verdict-line
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-11-02 · 来源 = 来源 = 2026-11-02 13:46 用户「你这做的什么玩意儿啊！连个基本的业务闭环都做不到？！」→ 13:48「那你这个修改开工了吗？！」（追问 #1994 是否真开工）。
> 台账 = #1994（ENGINEERING-MODE · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-11-02
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

## 讨论：一行签字，磨掉三轮评审

**用户原话**（2026-11-02 13:46）：「**你这做的什么玩意儿啊！连个基本的业务闭环都做不到？！**」· 13:48「**那你这个修改开工了吗？！**」

### 现场（本会话实读）

同一批（`docs/batches/2026-11-02-batch-spec-in-place.md`）连撞两轮：

- **第 4 轮**：§3 块里写的是 `**结论** = VERDICT: pass` —— 混合形，两种合法写法（独立行 `VERDICT: pass` ∥ `结论：通过`）都不命中。
- **第 5 轮**：§3 整块**连 `VERDICT` 字样都没有** —— 裁定行只存在于评审的聊天回复里。
- **两轮的后果**：实施席 `batch append §5` 被段序门拒两次（`§3 最近一轮轮次块 … 块内裁定 = 无裁定行`），整轮实施记录写不进去。
- **第 6 轮**：父侧在派单里加「append 后 `read` 读回自证」，才第一次写进去。

### 根因（一句话）

**批复面看的是评审的回复文本（`rawResult`），消费面看的是 §3 的块正文 —— 两个面、两份文本，中间没有人对账。**

**⇒ 结果：签发面放行了（token 发出），批档门却拒（块内没有可认的裁定行）。**

### 关键事实（决定了修法）

- **能写 §3 的只有评审实例，而它结算后就不在了。**
- **段序门只有在实施席要写 §5 时才报错** —— 那一刻评审早已结束，错误对**唯一能修它的人**不可见。

### 三条路，我的倾向写在第三条

- **甲**：评审消息模板写死「§3 正文最后一行恰为 `VERDICT: pass`」。**成本最低，但今晚已经证明靠不住** —— 喊了两轮没做到，靠的是自觉。
- **乙**：门放宽，接纳混合形。**否决** —— 门的作用就是掐住「块里没有可认的裁定」。
- **丙（倾向）**：**在写的时候就掐** —— 评审实例 `append §3` 时，若正文既不含 pass 锚也不含 changes 锚，**当场拒写**，拒文点明「加一行 `VERDICT: pass` 或 `VERDICT: changes-required`」。

**⇒ 丙的好处：错误暴露在**还有修它的人在场的那一刻**，而不是几十分钟后由一个无权修改的实施席报出来。**

**⇒ 丙与甲不冲突：丙是机械兜底，甲是提示；但丙落地后，甲就不必再当防线。**

### 已定决定

- **处置 = 立批**（用户 13:48 追问即开工令）。
- **不复用 `#1990` 的批档** —— 那是批档写入语义，这是评审裁定面的门；不同物（用户「不要自己给自己开口子」的口径：一个新问题一个新批）。

### 未验项（设计必答）

- `append §3` 的写入路径上，**能不能判出「这一笔是评审实例写的」**（身份/绑定信息是否在手）。判不出，丙就落不了地 —— 那要退到甲+更强的读回。
- 拒写会不会把**已有的合法形**误伤（例如 `结论：通过` 这种写法、或纯正文块）。

## 父侧裁定（设计席首轮上抛 O1–O4，2026-11-02 13:56）

**O4 —— 已由父侧实测：无旁路。**

读数在 `thincoder-core/advisor/loop.mjs` 的 `advisorToolsFor(agent, reviewType, batchDoc)`：

- 基础集 = `readTool` ∥ `globTool` ∥ `grepTool` ∥ `lsTool` ∥ `lspTool` ∥ `advisorCodeSearchTool`
- 设计评审绑了批档时追加 `batchTool(batchDoc, { review: true })`
- **没有** `write` / `edit` / `bash` / `apply_patch`

**⇒ 它唯一能写批档的路就是 `batch append`，而那正是本闸所挂处。**

设计里的 O4 行改成本条读数（带量法：档名 + 符号名），不再标「待验」。

**O1 —— 裁：修，两个分支同判。**

现状 = `VERDICT: 通过。`（带句号）命中，`结论：通过。`（带句号）不命中。

同一个锚、两个分支，对同一语义给出两种结论 ⇒ 给 `结论` 分支补可选尾句号，与 `VERDICT` 分支对齐。

**注意是「对齐」不是「放宽」**：混合形（`**结论** = VERDICT: pass`）不许顺手放进去 —— 那不是句号问题，是把两种写法混成第三种。

**O2 —— 裁：保留**（写时也拒「两者同携」）。理由 = 同一判据同一结论；写时放过、`§5` 门再拒，是把同一个错分成两次报。

**O3 —— 裁：保留**（存量无裁定块不回填，沿用「重跑一轮评审」处置）。

**交回要求**：O1 的锚改动前后，对 `结论：通过。` 与 `VERDICT: 通过。` 两个输入给**四格真值表**，并给出「混合形仍不命中」的读数；O4 的读数说明落在 §2 哪一节。

## 父侧裁定（第 1 轮评审 2🔴 6🟡 3🔵，2026-11-02 14:06）

**🔴1（放行面写成 pass-only）—— 裁：改，只拒两格。**

现状 §2.6.1 写「放行面 = 恰好一格：`verdictGapOf(本笔正文) === null`」⇒ 判打回的一笔写不进去。

这与它自己的三处相反：F1「（无裁定行 ∥ 两者同携）⇒ 拒写」· R2「`VERDICT: changes-required` 四笔各写入」· 拒文括注「(块内裁定 = 无裁定行 | 两者同携)」。

⇒ 而 `test/RTM.md` 的 14-8 就要求「同一批判 `changes-required` 并 append `§3` 打回」。

**改**：放行面 = 只拒 `「无裁定行」` 与 `「两者同携」`；`§2.6` 门表那句、`docs/core/design/BATCH-RECORD.md` §4.4 括注同笔对齐；R2 / R27 保留；§9 的 delta 加一条 14-8 回归支。

**🔴2（tier 结论答错问题）—— 裁：改，逐档点名。**

「无文件跨 tier——改动全在 `thincoder-core` 单一实现面」答的是面，判据要的是档位。

同一张表自报 `thincoder-core/agent-tools/batch.mjs` 516 行（>500）、`thincoder-core/agent-tools/batch-skeleton.mjs` 496 行 —— 再加 `verdictGapOf` 必越线。

**改**：结论行改成逐档点名「哪几档越线 + 各自拆单法」；删表内「实测行数」列（判据要结论不要尺寸）；与在飞批 `docs/batches/2026-11-02-batch-spec-in-place.md` 对同一档的「不新增导出 + 净负」计划对齐。

**🟡3（判据不是真单源）—— 裁：让它真单源。**

`thincoder-core/agent-tools/design-token.mjs` 的 `verdictGateFailure` 仍自己写组合序。**改成走 `verdictGapOf`**，但**返回串保持现有词汇**（`changes-required` ∥ `no-pass-line`），不换对外说法。

**🟡4（通道闭集不全）—— 裁：补行 + 改表名。**

文件工具直写那条旁路已被 `docs/core/design/BATCH-RECORD.md` §4.19 登记为「登记即终局」，§4.2 也写「主 agent（depth 0）不受该门约束」。

⇒ 补一行，并把表名改成「工具面闭集」。

**🟡5（R5 机检不到）—— 裁：改取证形。** 经 `assertSectionFiveGate` 的拒文括注断言，或在 R5 写死取证形。

**🟡6（O1 只补了一半）—— 裁：打回分支补同一句尾句号。**

`结论：不通过。` 现在读成「无裁定行」⇒ 新闸误拒真打回，且 `statusResetPlan` 不触发（状态行停在 `评审通过`）。这与「同一锚两分支两结论」那条理由完全同形。

**🟡7（两者同携无场景）—— 裁：落程序不变量。** 按 `docs/core/design/BATCH-RECORD.md` §4.19 的体例写一行。

**🟡8（14-1 改写未重写四列）—— 裁：补四列**（交互 ∥ 业务结果 ∥ 进入口 ∥ 服务条目 = R4 + 本批 R1）。

**🔵9 / 🔵10 / 🔵11 —— 一并改**：§2.6.1 的回指改指 §2.6 的「不对称」条；闸的判定输入写死为净化后的 `body`；`verdictGapOf` 补 `none found` 三答形。

**交回**：逐条「编号 → 改法 → 后原句」，重点给 🔴1 的放行面新句、🔴2 的结论行新句、🟡6 的锚改动前后四格真值表（含打回分支）。

## 父侧裁定（第 2 轮评审 🔴1 5🟡 2🔵，2026-11-02 14:12）

**🔴1（放行面残留两处旧句）—— 裁：删旧句，不留并存。**

新增的「只拒两格」是对的，但**旧句没删**，两句相隔两行：

- `docs/core/design/BATCH-RECORD.md` §4.4：「`§3` 的追加若无裁定行（pass 锚 ∧ 无打回锚 之外的一切形），**写不进去**」
- 本档 §2 F1：「`append §3` 的正文裁定读数 ≠ pass（无裁定行 ∥ 两者同携）⇒ 拒写」

**⇒ 改**：这两句各自换成「只拒两格」形。**⇒ 不许写成「旧句 + 补一句新的」—— 两句话都对的时候，读者只能靠运气选。**

**N1（映射改了签发面返回串）—— 裁：保住现行为。**

设计写「其余两值（`无裁定行` ∥ `两者同携`）映回 `no-pass-line`」。

但盘上现文是 `if (VERDICT_CHANGES_LINE.test(rawResult)) return "changes-required"` —— **两者同携今天返回的是 `changes-required`**。

⇒ 按新映射会变成 `no-pass-line`，而同一段又承诺「返回串词汇不动」。

**⇒ 改**：`两者同携` 映回 `changes-required`（保住今天的行为）；要改就说清并进 D6。

**N2（同携那笔的旧期望未收）—— 裁：标层。**

设计档 §2.5 定序表与 §6 用例表还写着「携打回（无论是否同携 pass）⇒ 重置」，而本批新增的 §6 行写「同携 ⇒ 拒」。

**⇒ 改**：在 §2.5 那两行与 §6 旧行旁标明「`append §3` 已写不进去，此支只经计划函数直调可达」。

**N3（骨架拆单法没标归属）—— 裁：加一句。**

拆单法指向新档 `thincoder-core/agent-tools/batch-verdict.mjs`，但受影响文件表 7 档里没有它，而 §2.6 又说锚块住 `batch-skeleton.mjs`。

**⇒ 改**：照 `batch.mjs` 那行的写法加「归属下一批，本批不动导出面」。

**N4 / N5 —— 一并改**：打回形「三格」补齐 `VERDICT: 不通过`（四处对四处）；「没有第二份组合序」改成「另有三处自带同序组合（`statusPassPlan` 等），登记为已知第四处」。

**交回**：逐条「编号 → 改法 → 后原句」；🔴1 要给出改后那两句的全文，并说明旧句已删（不是并存）。

## 父侧裁定（实施后上抛，2026-11-02 14:30）

**上抛 3（拒文自身可触发本闸）—— 裁：必须修，我实测过。**

不接受「optional」定级。实跑读数（父侧）：

- 拒文里两行示例 `  VERDICT: pass` ∥ `  VERDICT: changes-required` 各自被锚命中
- `verdictGapOf(拒文)` = **两者同携**
- 更狠的一格：评审在 §3 里引用这段拒文**并自己另写一行 `VERDICT: pass`** ⇒ 仍判**两者同携 ⇒ 拒写**

**⇒ 不是「可能被拒」，是**引了就永远写不进去** —— 想解释这道闸的人，正好被它挡在门外。**

**改法**：`R-G3` 的两行示例改成**同一句内联**（例如「put exactly one of `VERDICT: pass` ∥ `VERDICT: changes-required` on its own line」），**两个词仍在文里（可复制），但不再各占独立行**。

**⇒ 别用「加缩进 / 加列表符」绕** —— 那会让照抄示例的模型写出一行不命中的东西，变成死循环。

**上抛 1（设计档三处漂移）—— 裁：一并改。**

① `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` §2.5 的「`batch-closeout.mjs` 的 import 面零改」已不成立（该档已改调 `verdictGapOf`）；② `statusPassPlan` ∥ `verdictGateFailure` 两处坐标因插入 `verdictGapOf` 已后移；③ §2.6.1 引的「`§2.6` 判据 3」不存在（§2.6 只有判据 1 / 2）。

**上抛 2（`API-CONTRACT` 生成区）—— 父侧跑生成器**，不派给你。

**上抛 4（tier 实测 524 ∥ 531）—— 记：仍按「归属下一批」**，不改结论。

## 父侧裁定（R9 第二格口径，2026-11-02 14:39）

**实施席报：R9 第二格「纯文本原样引用拒文 + 自写一行 `VERDICT: pass` ⇒ 写入」实测不成立。**

实测读数（父侧复跑）：`§3` 闸放行（`null`），但**文档机检门**拒 —— 拒文首行 337 字 > 300。

**⇒ 那是既有文档门挡的，与本闸无关。本闸要防的那件事已经解开。**

**裁定：R9 第二格改成「围栏引用写入」。**

理由：引用一段工具原文，本来就该用围栏；把验收写成「纯文本原样粘贴」，等于要求一条与既有文档纪律相抵的行为。

**⇒ 不改拒文长度** —— 563 字是工具消息，不是文档段落；为迁就引用方式去改一句已经逐字钉死的拒文，是本末倒置。

**⇒ 顺带记一条**：这是「同一件东西两种口径」的又一例 —— 拒文是**工具消息**（按消息计），被引进**文档**时（按段落计），两套阈值各管各的。判据本身没错，写 R9 时没想这一层。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成 2026-11-02（R9 第二格改围栏引用写入：拒文 563 字符 / 首行 337 越既有文档机检门的段落阈值 300，纯文本粘贴撞的是那道门而非本闸；设计档 §2.6.1 读数 ∥ §4 决策 27 ∥ §5 R27 ∥ §6 用例行同笔对齐，新增 D8（引用形 = 围栏，拒文长度不动））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试覆盖 / 验收对照 / 关键决策 / 上抛项>

### 一、五要素

**模块目标**：评审写 `§3` 时若没把裁定行写进块正文，在**写的那一刻**就拒下，而不是等实施席开 `§5` 时由一个无权补行的人把它报出来。

**功能点**

- **F1 写时拒**：`append §3` 的正文裁定读数 ∈ {`无裁定行`, `两者同携`} ⇒ 拒写；判打回的一笔（`VERDICT: changes-required` ∥ `结论：不通过`）照写；零字节落盘、轮次号不消耗。
- **F2 判据复用**：判定走 `thincoder-core/agent-tools/batch-skeleton.mjs` 锚块新增的纯函数 `verdictGapOf(text)`，与 `§5` 门、签发面同源——不新写第二套判据（存量另有一处自带同序组合 `statusPassPlan`，已登记在 `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` §2.6.1，本批不动）。
- **F3 拒文自明**：拒文自带两选一的两个词（内联在同一句里，**不各占独立一行**）与混形反例，一份无上下文的评审读完即知该往哪写。**且拒文自身不构成裁定行**——以代码围栏引用拒文全文、另写一行 `VERDICT: pass` 的一笔仍写得进去（理由与读数见「九、上抛 3」；判据 = R9）。
- **F4 锚形对齐（两锚）**：两个裁定锚的中文分支尾句号可省可带——pass 侧 `结论：通过。` 与 `VERDICT: 通过。` 同判 pass，打回侧 `结论：不通过。` 同判打回（缺它则新闸误拒一笔真打回，且状态行不重置）；英文形不带句号；混合形仍不认。签发面同读一锚，`design-token.mjs` 改调 `verdictGapOf`（返回串词汇不动）。

**边界（本批不做）**

- 不放宽段序门：`§5` 写入门判据一字不动。
- 不动 token 签发面的对外说法：`thincoder-core/agent-tools/design-token.mjs` 的 `verdictGateFailure` 改调 `verdictGapOf`，拒因词表（`changes-required` ∥ `no-pass-line`）逐字不动；它的行为随锚对齐与判据单源而变（见 D6）。
- 不认混合形：`**结论** = VERDICT: pass` 仍拒——它不是句号问题，是把两种写法混成第三种。
- 英文 `pass` 形不接受尾句号（`VERDICT: pass。` 不识别，与改前一致）。
- 工具不替评审补裁定行（补结论是评审的判断，不是工具默认值）。
- 不动 `docs/batches/2026-11-02-batch-spec-in-place.md` 的 §2 / §5（那是另一本账）。

**验收**：逐条见下「三、验收对照」，机检文件 = `docs/batches/2026-11-02-review-verdict-line.test.mjs`（收口时删除，零留存）。

命令：`node --test docs/batches/2026-11-02-review-verdict-line.test.mjs`。

**依赖**

- 上游：`batch-skeleton.mjs` 锚块的两条锚（`VERDICT_PASS_LINE` / `VERDICT_CHANGES_LINE`）；`batch-closeout.mjs` 的 `lastRoundVerdictGap`（同一判据的既有消费者）。
- 下游：`§5` 写入门行为不变，但它的拒因在上游被拦掉；评审席的代价 = 一笔重发。

### 二、最近先例三问

- **住哪**：`append §3` 的拒面家族住在 `thincoder-core/agent-tools/batch.mjs` 的 `appendBatchRecord`（同族现形 = `if (n === 5) assertSectionFiveGate(src)`）；判定函数住 `batch-skeleton.mjs` 的锚块；块内裁定的读法住 `batch-closeout.mjs` 的 `lastRoundVerdictGap`。
- **叫什么（逐字）**：`assertSectionFiveGate` / `lastRoundVerdictGap` / `statusPassPlan` / `statusResetPlan`。新符号取同族形 `verdictGapOf`（判定）+ 拒面内联调用（不新开 `assert*` 包装，一个消费者不配一个名字）。
- **谁用**：`appendBatchRecord` 是唯一新调用点；既有消费者两个（`§5` 门、签发闸）。

**对齐 ∥ 偏离**：对齐——同一对锚、同一「先打回后 pass」的判定序、同一段键定位风格。偏离——不复用 `lastRoundVerdictGap` 本体，因为它收的是「块文本」且带 `null` 分支；写时手上是「本笔正文」，为复用而把未落盘文本伪装成块，会把 `null` 语义带进来。故把判定下沉成 `verdictGapOf(text)`，两面同读，谁也不新写判据。

**勘察证据**：查过仓内两本设计档（`docs/core/design/BATCH-RECORD.md` §4.1 ∥ §4.4、`docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` §2.5 ∥ §2.6）与评审消息模板里的 VERDICT 句；仓外公开源无对应物（这是本仓批档机制）——查过，无相关。

**数据事实检查**：本批机制不需要读数据（「谁能写 §3」由三张段白名单与 `allowedSegment` 判定，均已在代码里读实）。存量侧的唯一事实沿用既有记载：盘上无裁定行的旧块不回填，处置见 `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` §2.6「不对称」条。

### 三、工具面闭集表（工具通道里谁写得到 §3）

| 通道 | 写得到 §3 | 处置 + 理由 |
|---|---|---|
| 设计评审实例（`batch` 以 `review: true` 绑定） | 能 | **已接**——`allowedSegment` 判 `review` ⇒ 3；闸挂在此 |
| 主 agent（depth 0 append） | 不能 | 不适用——`DEPTH0_SEGMENTS.append` 工程 `[1,4,6]` ∥ 普通 `[1,2,4,5,6]`，两集均无 3 |
| eng-designer ∥ eng-coder | 不能 | 不适用——`SEGMENT_BY_ROLE` = §2 ∥ §5 |
| coder（普通模式，携绑定） | 不能 | 不接——`SEGMENT_BY_ROLE_NORMAL` = §5；它写不到 §3 |
| `batch edit` | 不能 | 不接——`edit` 段域只有 §2（`docs/core/design/BATCH-RECORD.md` §4.19） |
| 主 agent ∥ 携绑定子代理直写本档文件（`write` / `edit` 工具） | 能 | 不接——工具面之外的另一条通道，已登记（`docs/core/design/BATCH-RECORD.md` §4.19「旁路仍在」，处置 = 登记即终局：不补门、不另裁；§4.2 记「主 agent（depth 0）不受该门约束」）。本闸的靶 = 结算离场的评审，那条通道上动手的人还在场、能当场补行 |
| 评审实例直写文件（`write`/`edit` 工具） | 不能 | 不适用——**装配面实测无旁路**：评审工具集 = 只读六件 + 设计评审绑本档时追加的 `batch`（append/status），不含 `write`/`edit`/`bash`/`apply_patch` ⇒ 它唯一能写批档的路就是 `append`。读数 = `thincoder-core/advisor/loop.mjs` `advisorToolsFor` |

⇒ 闸挂在**段键** `n === 3` 上，不挂身份旗标：段键是「谁能写这一段」的机械事实，将来身份面扩权自动被覆盖；旗标是装配面事实，改装配漏挂一处就静默失效。

规范形（判据 / 拒文逐字 / 存量处置）= `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` §2.6.1；本表是任务面的处置清单，规则以该节为准。

### 四、受影响文件（tier 结论）

| 文件 | 改什么 |
|---|---|
| `thincoder-core/agent-tools/batch.mjs` | `appendBatchRecord` 增段键 `n === 3` 的拒面（位次 = 既有拒因之后、文档机检门之前） |
| `thincoder-core/agent-tools/batch-skeleton.mjs` | 锚块新增纯函数 `verdictGapOf(text)`；两个裁定锚的中文分支补可选尾句号（两锚同判） |
| `thincoder-core/agent-tools/batch-closeout.mjs` | `lastRoundVerdictGap` 改调 `verdictGapOf`（零行为变，字符串逐字不变） |
| `thincoder-core/agent-tools/design-token.mjs` | `verdictGateFailure` 改调 `verdictGapOf`（返回串词汇不动：`changes-required` ∥ `no-pass-line`） |
| `thincoder-core/tool-docs/batch.md` | `text` 参数描述补一句：`§3` 语义须带裁定行（提示面） |
| `thincoder-core/advisor/messages.mjs` | 评审消息模板补一句同义提示（提示面，非防线） |
| `test/integration/batch-gates-reanchor.test.mjs` | 故事 14-1 用例改写（见设计档 §9 delta） |
| `docs/batches/2026-11-02-review-verdict-line.test.mjs` | 本批单测档（收口删除） |

**tier 结论（逐档点名）**：跨 500 软线的实现档 = `thincoder-core/agent-tools/batch.mjs` ∥ `thincoder-core/agent-tools/batch-skeleton.mjs`；其余档在线上内，零拆分义务。

- `batch.mjs`：本批只加一条拒面、不新增导出 ⇒ 与在飞批 `docs/batches/2026-11-02-batch-spec-in-place.md` 对同档的拆分计划同向（拆分点 = 抽 `thincoder-core/agent-tools/batch-edit.mjs` 承 `edit` 面四件，台账 #1996，归属下一批）。本批不动该档的导出面，拆完两批一起回到线下。
- `batch-skeleton.mjs`：本批新增 `verdictGapOf` 一个导出 ⇒ 过线。拆单法 = 把锚块（`_V_PRE` ∥ `_V_SUF` ∥ 两个裁定锚 ∥ `verdictGapOf` ∥ `lastRoundBlock`）抽成零依赖叶档 `thincoder-core/agent-tools/batch-verdict.mjs`，骨架档与三个消费者改 import ⇒ 本档回到线下，新档远在线上内。**该拆单归属下一批**（口径同 `batch.mjs` 那条）：本批不建 `batch-verdict.mjs`、不搬锚块——`verdictGapOf` 落在骨架档锚块内，越线状态由下一批的搬档收回线下。
- 端侧不跨档：`batch` 工具只有 `thincoder-core/agent-tools/` 一份实现，CLI ∥ VSC ∥ desktop 零改。

### 五、验收对照（逐条可机检）

| 条目 | 判据 |
|---|---|
| R1 无裁定行拒写 | 评审 append 一笔无裁定行的 §3 ⇒ 拒，错误串含 `§3 append refused`；档字节逐字节不变；轮次块数与写前相等（`nextRoundNumber` 未消耗） |
| R2 合法形放行 | `VERDICT: pass` ∥ `结论：通过` ∥ `结论：通过。` ∥ `VERDICT: changes-required` ∥ `结论：不通过。` 五笔各写入，块数各 +1（打回那笔同笔重置 `§3` 状态行，写前 = `评审通过` 时） |
| R3 混形拒 | 正文 `**结论** = VERDICT: pass` ⇒ 拒（非独立整行） |
| R4 两者同携拒 | 一笔同携 pass 与打回两行 ⇒ 拒，错误串含 `两者同携` |
| R5 判据单源 | `grep -rn "export const VERDICT_PASS_LINE" thincoder-core` = 1 命中；`thincoder-core/agent-tools/design-token.mjs` 内 `VERDICT_CHANGES_LINE.test` ∥ `VERDICT_PASS_LINE.test` 的组合序命中 = 0（改调 `verdictGapOf`）；取证形（`lastRoundVerdictGap` 未导出，故经两道门的拒文对账）= 同携正文喂 `append §3` ⇒ `R-G3` 拒文括注含 `两者同携`，同一正文写成一份 §3 末块再 `append §5` ⇒ `R-G2b` 拒文括注同值 |
| R6 拒文自明 | 错误串同时含 `VERDICT: pass` ∥ `VERDICT: changes-required` ∥ `no round number was consumed` |
| R7 零回归 | `node --test test/integration/batch-gates-reanchor.test.mjs` 绿（父侧收口跑）；eng-designer §2 ∥ eng-coder §5 ∥ depth-0 §1 三笔写入不受本闸影响（单测断言） |
| R8 尾句号同判（两锚） | 单测直接读锚：pass 侧 `结论：通过。` ∥ `VERDICT: 通过。` 皆命中；打回侧 `结论：不通过。` ∥ `VERDICT: 不通过。` 皆命中（改前读数见下表）；混合形 `**结论** = VERDICT: pass` 改前改后皆不命中；`结论：未通过。` ∥ `我们未通过。` 不命中；`结论：不通过。` 的一笔经 §3 闸写入且状态行重置为 `进行中（第 N 轮打回）` |

**锚改动四格真值表**（输入 × 改前/改后；改前读数 = 本轮对盘上两条锚正则的实读）：

| 输入 | 读哪条锚 | 改前（盘上） | 改后（应为） |
|---|---|---|---|
| `结论：通过。` | `VERDICT_PASS_LINE` | 不命中 | 命中 |
| `VERDICT: 通过。` | `VERDICT_PASS_LINE` | 命中 | 命中 |
| `结论：不通过。` | `VERDICT_CHANGES_LINE` | 不命中 | 命中 |
| `VERDICT: 不通过。` | `VERDICT_CHANGES_LINE` | 不命中 | 命中 |

**旁证两格（改后皆为不命中）**：混合形 `**结论** = VERDICT: pass`（改前也不命中——混合形不是句号问题）；`结论：未通过。`（整行锚不对句中提及做模糊匹配，否则「未通过」会被放过）。
**改后连带两处行为**：`结论：不通过。` 的一笔不再读成「无裁定行」⇒ 不被新闸误拒，且 `statusResetPlan` 同笔重置；`结论：通过。` 的回执签发面也签得出凭证。

### 六、关键决策（含被拒，规范形 = 设计档 §2.6.1）

- **D1 写时拒 ∥ 提示词再叮嘱**：取写时拒。提示词是自觉，两轮没做到就是证据；写时拒是机械面。
- **D2 写时拒 ∥ 放宽段序门**：被拒。门的作用就是掐住「块里没有可认的裁定」。
- **D3 判据 = 现象投影**：每笔 §3 自成一块 ⇒ 写前**净化后正文**（`sanitizeText` 之后的 `body`，落档的就是它）≡ 写后末块，两个时点判的是同一份文本的同一格。
- **D4 两者同携写时也拒（程序不变量）**：纳入。盘上无此形样本、`test/RTM.md` 也无——它是一处自相矛盾的回执（门判打回、状态行判打回、签发面判打回），唯一效果是让人猜哪一行算数。故按程序不变量落：`verdictGapOf` 第四格由写面与 `§5` 门同判，复现路径 = 单测喂一笔同携正文，断言两处同值。
- **D5 段键 ∥ 身份旗标**：取段键（理由见上）。
- **D6 锚形对齐（父侧 O1 ∥ 评审 🟡6 裁定 · 修）**：两锚的中文分支尾句号可省可带，与英文分支同判。代价 = 签发面与状态机行为随之变（三处同读一锚；`verdictGateFailure` 本批改调 `verdictGapOf`）：`结论：通过。` 的回执此后也签得出凭证，`结论：不通过。` 此后判打回并重置状态行。被拒 = 维持不对称、只在工具描述里写「结论形不带句号」（同一语义两套结论，靠记忆）；被拒 = 顺带认混合形。
- **被拒 · 在 `status` 动作上加判据**：`status` 写不产生轮次块，缺陷不在那里。

### 七、父侧裁定（2026-11-02 13:56，四项全落）

- **O1 修**：pass 锚中文分支补可选尾句号，两分支同判。落点 = 功能点 F4 · 验收 R8（含四格真值表）· 决策 D6 · `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` §2.6 判据单源条 ∥ §4 决策 26。
- **O2 保留**：两者同携写时即拒（D4 不动）。
- **O3 保留**：存量无裁定块不回填，沿用「重跑一轮评审」。
- **O4 实测无旁路**：`thincoder-core/advisor/loop.mjs` `advisorToolsFor` 的 `tools` 初值 = `readTool` ∥ `globTool` ∥ `grepTool` ∥ `lsTool` ∥ `lspTool` ∥ `advisorCodeSearchTool(agent)`，`reviewType === "design" && batchDoc` 时追加 `batchTool(batchDoc, { review: true })`——无 `write` / `edit` / `bash` / `apply_patch`。落点 = 设计档 §2.6.1 通道闭集表末行 ∥ `docs/core/design/BATCH-RECORD.md` §4.3。

### 八、设计落点

- 机制 + 判据 + 拒文逐字 + 通道闭集 = `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` §2.6（门表新增一行 + pass 锚两分支同判条）∥ §2.6.1（新节）∥ §4 决策 25 ∥ 26 ∥ §5（验收 R27）∥ §6（用例 6 行）∥ §9（RTM delta）。
- 工具契约面（fail-closed 行 + §3 内容要求 + 评审面写旁路实测）= `docs/core/design/BATCH-RECORD.md` §4.1 ∥ §4.3 ∥ §4.4。

### 九、父侧裁定（实施后上抛，2026-11-02 14:30）

**上抛 3（拒文自身可触发本闸）—— 已修，是必修不是 optional。**

改法 = `R-G3` 的两个裁定词内联成一句：两个词仍在文里（照抄的人要能复制），但不再各占独立一行。

拒文新形逐字 = `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` §2.6.1。

**本节取读数**（对**落盘**的拒文跑真函数：`verdictGapOf` 由 `thincoder-core/agent-tools/batch-skeleton.mjs` import，拒文从设计档围栏里按行切出，不是手抄）：

| 输入 | 改前 | 改后（落盘拒文实测） |
|---|---|---|
| 拒文全文自读 | `两者同携` | `无裁定行` |
| 拒文全文 + 自写一行 `VERDICT: pass` | `两者同携` | `null`（本闸放行；入档的引用形见「十、R9」） |
| 拒文全文 + 自写一行 `VERDICT: changes-required` | —— | `VERDICT: changes-required`（打回照写） |

**两种绕法不取（父侧明令）**：加缩进 ∥ 加列表符 —— 照抄示例写出的行不命中整行锚 ⇒ 补一行永不生效，变成死循环。

**⇒ 交回实施席**：`thincoder-core/agent-tools/batch.mjs` 的常量 `SECTION3_VERDICT_GAP_ERROR` 按新逐字形替换（本席不碰代码）。旧形的那三行示例就是本条的成因。

**上抛 1（设计档三处漂移）—— 已改，逐条点名：**

| # | 漂移 | 改后 |
|---|---|---|
| ① | §2.5 写「`batch-closeout.mjs` 的 import 面零改」 | 已改：`lastRoundVerdictGap` 同改调 `verdictGapOf`，不再 import 两条裁定锚 ⇒ 它的 import 面随判据单源而变，不是零改 |
| ② | `statusPassPlan` ∥ `verdictGateFailure` 两处坐标后移 | 已改：两处行号全撤、改写成符号名。顺带撤掉 §2.5「为什么打回优先」条里 `design-token.mjs:117` 那个行号，并把「判序住 `verdictGateFailure`」改成「判序只住 `verdictGapOf`」——判序本批已挪档，旧句与实现相反 |
| ③ | §2.6.1 引「`§2.6` 判据 3」不存在 | 已改：改指 §2.6 判据 2（末块裁定行），即该句实际依赖的那一条 |

**上抛 4（tier 实测 524 ∥ 531）—— 记，结论不变。**

`batch-skeleton.mjs` 524 行 ∥ `batch.mjs` 531 行，均越 500 软线；维持「拆单归属下一批」，本批不建 `batch-verdict.mjs`、不搬锚块。

尺寸明细留在 §5；本档不设尺寸列（判据要结论不要尺寸）。

**上抛 2（`API-CONTRACT` 生成区）—— 不属本席**：生成区是生成器唯一笔，父侧跑。

### 十、本轮的验收增量（并入「五、验收对照」，编号续 R8）

| 条目 | 判据 |
|---|---|
| R9 拒文不自触发 | 对落盘的 `R-G3` 全文跑 `verdictGapOf` ⇒ `无裁定行`（非 `两者同携`）；以**代码围栏**引用 `R-G3` 全文 + 另写一行 `VERDICT: pass` 的一笔经 `append §3` ⇒ 写入（块 +1）。改前同两格 = `两者同携` ∥ `两者同携`（拒写） |

**⇒ R9 为什么必须有**：F3 与 R6 都只判「词在不在」，两个词各占一行同样满足那两条，却让引用拒文的一笔永远写不进去。

判据判不到的后果，正是本批要防的那一类。R9 判的是「词在，且不构成裁定行」。

**R9 第二格的引用形 = 代码围栏**：`R-G3` 全文 563 字符、首行 337 字符；`append` 的落盘路径上除 `§3` 闸还有既有文档机检门（段落长度阈值 300，门位在本闸之后、写盘之前）。纯文本粘贴那一笔本闸已放行（`null`），仍被它拒（`命中 1 条`，块数 0）；围栏内不计段落 ⇒ 围栏引用即写入、块 +1。

⇒ 挡它的不是本闸，也不是「引用拒文的人被它挡在门外」的残留：引用一段工具原文本来就该用围栏，把验收写成「纯文本原样粘贴」等于要求一条与既有文档纪律相抵的行为。

⇒ 拒文长度不动：它是**工具消息**，按消息计；引它进**文档**时按段落计——两套阈值各管各的，为迁就一种引用方式去改一句已逐字钉死的拒文，是本末倒置。

### 十一、关键决策续（接「六、关键决策」）

**D7 拒文两个词内联 ∥ 各占一行 ∥ 加缩进隔开 —— 取内联。**

理由：两个词得留着（照抄的人要能复制），但不能各占整行（各占整行时拒文自读「两者同携」，引用它的那一笔永远写不进去）。

被拒 = 加缩进 ∥ 列表符：照抄示例的行不命中整行锚 ⇒ 死循环。被拒 = 删掉两个词：拒文不再自明。

代价 = 拒文不再有两行逐字示例，照抄者自己把词写成整行——那正是拒文第一句所要求的。

**D8 引用拒文的形：代码围栏 ∥ 纯文本粘贴 ∥ 缩短拒文 —— 取围栏。**

理由：同一件东西两种口径——拒文是**工具消息**（按消息计），被引进**文档**时按段落计（阈值 300），而 `R-G3` 首行 337 字符。围栏内不计段落，两个阈值各管各的，判据本身没错。

被拒 = 纯文本粘贴作验收形（要求一条与既有文档纪律相抵的行为）；被拒 = 改拒文长度（563 字符是工具消息，为迁就引用方式去改一句逐字钉死的拒文，本末倒置）。代价 = 引用者多写一对围栏标记。

## §3 设计评审（评审子代理）
**状态行**：评审通过



### 轮次 1（评审子代理）

**评审轮次**：第 1 轮 · 全量（设计评审）· 读数全部取自盘上实读。

**计数**：🔴 2 · 🟡 6 · 🔵 3

| # | Category | Severity | Issue | Suggestion |
|---|---|---|---|---|
| 1 | Requirements | 🔴 | 放行面只认 pass，判打回的一笔写不进 | 放行面改成只拒两格 |
| 2 | Tier | 🔴 | tier 结论答的是面不是档位 | 逐档点名 + 拆单法 |
| 3 | Clarity | 🟡 | 「判据只此一份」overstated | 接线或登记残余 |
| 4 | Clarity | 🟡 | 闭集漏掉文件工具旁路 | 补一行 + 改表名 |
| 5 | Acceptance | 🟡 | R5 后半机检不到 | 改取证形 |
| 6 | Requirements | 🟡 | O1 只补 pass 分支句号 | 一并补或写理由 |
| 7 | Branch provenance | 🟡 | 同携分支无场景 | 按 §4.19 体例补 |
| 8 | Integration test | 🟡 | 14-1 改写后四列未重写 | 补四列 |
| 9 | Doc hygiene | 🔵 | 交叉引用指错节 | 改指 §2.6 |
| 10 | Clarity | 🔵 | 闸输入未点名 | 写死为净化后 body |
| 11 | Existing-piece | 🔵 | 新名缺 none-found 三答 | 补一行 |

**#1 明细（阻断）**

`docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` §2.6.1 原文：

「放行面 = 恰好一格：`verdictGapOf(本笔正文) === null`（含 pass 锚 ∧ 不含打回锚）」

§2.6 门表同句：

「本笔正文的裁定读数须 = pass 且不含打回（`verdictGapOf`，与下一行判据 ② 同一函数）；否则当场拒」

该函数值域同节自述四格：

`null ∥ 无裁定行 ∥ VERDICT: changes-required ∥ 两者同携`

⇒ 一笔只携 changes-required 的 §3 追加读数 ≠ null ⇒ 当场拒写。

同档另有四处说的是相反的话：

- F1：「（无裁定行 ∥ 两者同携）⇒ 拒写」
- R2：「`VERDICT: changes-required` 四笔各写入，块数各 +1」
- R27：同 R2 语句
- `R-G3` 拒文括注：「(块内裁定 = 无裁定行 | 两者同携)」

`docs/core/design/BATCH-RECORD.md` §4.4 也把判据抄成 pass-only：

「（pass 锚 ∧ 无打回锚 之外的一切形）」

这不是措辞问题。`test/RTM.md` 14-8 要求「同一批判 `changes-required` 并 append `§3` 打回」。

工件 = `test/integration/batch-gates-reanchor.test.mjs` 那一笔，正文 `VERDICT: changes-required`。

其注释原文：「第 2 轮：同一批判 changes-required ⇒ 工具同笔重置状态行 + 本轮块首留痕」。

pass-only 落地后这笔被拒 ⇒ §2.5「打回即重置」不再触发。

且 §9「**冗余的行 = 无**：14-8（打回重置）与 27-1（一笔签完）的每一笔 `§3` 都自带裁定行，行为不变」变假。

⇒ 破的行从 1 行变 2 行，与本批 delta 自述相反。

建议：放行面写成只拒两格（无裁定行 ∥ 两者同携），判打回照写。

§2.6 门表与 `docs/core/design/BATCH-RECORD.md` §4.4 括注同句改；R2 / R27 不动，另加 14-8 回归支。

**#2 明细（阻断）**

§2「四、受影响文件」结论行原文：

「**tier 结论**：无文件跨 tier——改动全在 `thincoder-core` 单一实现面」

这句答的是「面」，不是档位。

同表自己写着两处越线：

- `thincoder-core/agent-tools/batch.mjs` 实测 516 行（>500 软线）
- `thincoder-core/agent-tools/batch-skeleton.mjs` 496 行，加 `verdictGapOf` 后必越线

同仓注释亦写「骨架档距 500 软线 6 行」，即此档本就在线边。

两档都无拆单法 ⇒ 结论行与事实相反。

另：判据要的是结论，不是行数——表内「实测行数（改前）」列应删。

协同面：在飞批 `docs/batches/2026-11-02-batch-spec-in-place.md` 对同档计划「不新增导出」+ 净负行数。

本批「新增 `verdictGapOf`」与该计划正面相抵，两批同落必越线。

建议：结论行逐档点名，各给拆单法（拒面家族迁出 ∥ 锚块迁出成叶档），先与在飞批对齐。

**#3 明细**

§2.6.1 原文：「共读方三处：`§5` 写入门（`lastRoundVerdictGap`）、本闸、签发闸经 import 的同一对锚 ⇒ 判据只此一份」

前两处同读函数成立。签发面在 `thincoder-core/agent-tools/design-token.mjs`：

`verdictGateFailure` 仍是 `if (VERDICT_CHANGES_LINE.test(rawResult)) return "changes-required"`，其后 `return VERDICT_PASS_LINE.test(rawResult) ? null : "no-pass-line"`。

组合序自己写了一遍（`statusPassPlan` 同理）⇒ 三面同读的只是锚正则，「同一判据」实际三处。

建议：让 `verdictGateFailure` 也走 `verdictGapOf`，或在 §2.6.1 明写这一处残余（体例 = §2.6「不对称」条）。

**#4 明细**

表名「通道闭集（谁写得到 `§3`）」，结论「段键是「谁能写这一段」的机械事实」。

表只枚举工具面六行。`docs/core/design/BATCH-RECORD.md` §4.19 已登记另一条：

「旁路仍在」（用文件工具直写本档别人段，无机械面），处置 = 「登记即终局」。

§4.2 亦写「主 agent（depth 0）不受该门约束」。

⇒ 主 agent ∥ 携绑定子代理经文件工具仍能写出无裁定的 §3 块，「闭集」不成立。

闸本身仍值得挂（它的靶 = 结算离场的评审），故不挡。建议补一行并把表名收成「工具面闭集」。

**#5 明细**

R5 后半「`lastRoundVerdictGap` 与本闸对同一文本给出同值」机检不到。

该函数在 `thincoder-core/agent-tools/batch-closeout.mjs` 里是 `function lastRoundVerdictGap(block)`，未导出。

建议改成经 `assertSectionFiveGate` 的拒文括注断言，或在 R5 写明取证形。

**#6 明细**

O1 只给 pass 分支补尾句号。打回锚现文：

`_V_PRE + "(?:VERDICT:[ \t]*(?:changes-required|不通过|需修改)|结论[:：][ \t]*(?:不通过|需修改|changes-required))" + _V_SUF`

故 `结论：不通过。` 既不是打回也不是 pass ⇒ 读成「无裁定行」。

两处后果：新闸当场误拒（明明是打回）；`statusResetPlan` 不触发，状态行仍留 `评审通过`。

O1 的理由（同一锚两分支两结论）对打回分支逐字适用。

建议一并补可选尾句号，或在 §2.6 写清为何打回分支不补。

**#7 明细**

「两者同携」写时拒的分支只有对称理由（D4「消费面本就判打回」），无实读读数、无复现路径。

`test/RTM.md` 与盘上工件里也没有同携样本。

建议按 `docs/core/design/BATCH-RECORD.md` §4.19 体例补一行：有场景 ⇒ 复现路径；无场景 ⇒ 落程序不变量。

**#8 明细**

§9 的 14-1 改写只给散文三段，未重写该行四列（交互 ∥ 业务可观察结果 ∥ 进入口 ∥ 服务条目）。

改写后第一支的交互已是 `batch append §3` ↔ §3 写入闸、服务的是本批 R1，行内仍记 R4。

建议在该行注明改写后四列（服务条目 = R4 + 本批 R1）。

**#9 明细**

§2.6.1 末句「（残余登记见本节「不对称」条）」——该条在 §2.6，不在 §2.6.1。

**#10 明细**

§2.6.1 只写「本笔正文」，可读成 `args.text`；落档的是净化后 `body`。

`sanitizeText` 会丢自带轮次标题 ∥ 凭证行 ⇒ D3 的「写前正文 ≡ 写后末块」只对净化后文本成立。

**#11 明细**

新名 `verdictGapOf` 缺「先查再建」三答式。现盘唯一同义件 = 未导出的 `lastRoundVerdictGap`。

建议补 `none found: 组合序现只住未导出的 lastRoundVerdictGap`。

**复核读数（供父侧对账）**

- O4 无旁路成立。`thincoder-core/advisor/loop.mjs` 的 `advisorToolsFor` = 只读六件；`reviewType === "design" && batchDoc` 时追加 `batchTool(batchDoc, { review: true })`；无 `write` / `edit` / `bash`。
- 段键正确。`allowedSegment` 对 review 返 3；`DEPTH0_SEGMENTS.append` 工程 [1,4,6] ∥ 普通 [1,2,4,5,6] 均无 3；`edit` 段域只 §2。
- 每笔 §3 自成一块成立。`insertIntoSection` 对 seg 3 恒盖 `### 轮次 N（评审子代理）` ⇒ 「先追加正文再补裁定」不是合法流程。
- O1 四格读数成立（改前盘上）。pass 锚 = `_V_PRE + "(?:VERDICT:[ \t]*(?:pass|通过|通过。)|结论[:：][ \t]*(?:通过|pass))" + _V_SUF` ⇒ `VERDICT: 通过。` 命中 ∥ `结论：通过。` 不命中 ∥ 混合形不命中。
- 14-1 现场成立：`方案可行，另附两条补记。` 经工具写入 `test/integration/batch-gates-reanchor.test.mjs`。但「破的行 = 14-1」在 pass-only 放行面下漏了 14-8（见 #1）。
- 单测档落点合规。`thincoder-core/agent-tools/batch-unit-test-gate.mjs` 认 `docs/batches/*.test.mjs`，归属判据 = 批档 stem 前缀 ⇒ 收口门前须删。
- 验收不点全量套件：只跑单测档 + 一个集成档，合规。
- 硬要求（普通模式不装门 ∥ 不适用 ∥ 由纪律承担 作为免于校验的理由）：本轮扫描未命中；§2.6 门表模式列 = 「两模式」，且给了机制理由。

VERDICT: changes-required

### 轮次 2（评审子代理）

**评审轮次**：第 2 轮（只核第 1 轮 11 条 + 本轮修正带出的新问题；读数全部取自本轮实读）

**计数**：🔴 1 · 🟡 5 · 🔵 2

| # | Orig | 档 | Severity | Status | 一句话 |
|---|---|---|---|---|---|
| 1 | 1 | `docs/core/design/BATCH-RECORD.md` §4.4 ∥ `docs/batches/2026-11-02-review-verdict-line.md` §2 F1 | 🔴 | Unfixed（规范层已改，两处 pass-only 残留） | 同档仍有两句说「只认 pass」 |
| 2 | 2 | `docs/batches/2026-11-02-review-verdict-line.md` §2 四 | 🟡 | Fixed | 逐档点名 + 两档各有拆单法，行数列已删 |
| 3 | 3 | `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` §2.6.1 | 🟡 | Fixed | 签发面 `verdictGateFailure` 改调 `verdictGapOf` |
| 4 | 4 | 同上 §2.6.1 工具面闭集表 | 🟡 | Fixed | 表名已收、旁路行已补且带登记依据 |
| 5 | 5 | `docs/batches/2026-11-02-review-verdict-line.md` §2 五 R5 | 🟡 | Fixed | 取证形已写死，两条 grep 判据可判定 |
| 6 | 6 | 同上 R8 ∥ 设计档 §2.6 | 🟡 | Fixed | 四格读数与本轮盘上两锚实测一致 |
| 7 | 7 | 同上 §2 D4 ∥ 设计档 §2.6.1 | 🟡 | Fixed | 程序不变量 + 复现路径，合 §4.19 体例 |
| 8 | 8 | 设计档 §9 | 🟡 | Fixed | 14-1 四列已补，与 `test/RTM.md` 行对得上 |
| 9 | 9 | 设计档 §2.6.1 | 🔵 | Fixed | 回指改到 §2.6「不对称（已登记残余）」 |
| 10 | 10 | 设计档 §2.6.1 | 🔵 | Fixed | 判定输入写死为净化后 `body` |
| 11 | 11 | 设计档 §2.6.1 | 🔵 | Fixed | `existing` ∥ `existing but unusable` ∥ `none found` 三行齐 |
| N1 | 新 | 设计档 §2.6.1 映射句 | 🟡 | New | 同携格映射会改签发面的返回串 |
| N2 | 新 | 设计档 §2.5 定序表 ∥ §6 用例表 | 🟡 | New | 同携那笔现在写不进去了，旧期望未收 |
| N3 | 新 | `docs/batches/2026-11-02-review-verdict-line.md` §2 四 | 🟡 | New | 骨架拆单法未标「归属下一批」 |
| N4 | 新 | 设计档 §2.6 | 🔵 | New | 打回形「三格」漏一格 |
| N5 | 新 | 设计档 §2.6.1 | 🔵 | New | 「没有第二份组合序」不实 |

**#1 明细（阻断，Status = Unfixed）**

规范层确实改成「只拒两格」了，三处都读了：

- 设计档 §2.6.1：「**放行面 = 只拒两格**」+「其余两值（`null` ∥ `「VERDICT: changes-required」`）⇒ 照写」。
- 设计档 §2.6 门表该行：「读数 ∈ {`无裁定行`, `两者同携`} ⇒ 当场拒，`VERDICT: changes-required` 照写」。
- `docs/core/design/BATCH-RECORD.md` §4.4 新增句：「本闸**只拒两格**：「无裁定行」∥「两者同携」；判打回的一笔照写。」

但第 1 轮指出的那两句 pass-only 原句仍在盘上，一句都没改写：

`docs/core/design/BATCH-RECORD.md` §4.4（新句上面两行）原文：

「`§3` 的追加若无裁定行（pass 锚 ∧ 无打回锚 之外的一切形），**写不进去**。」

同一节隔两行就是「只拒两格…判打回的一笔照写」⇒ 同一份判据在同节给了两个放行面。

`docs/batches/2026-11-02-review-verdict-line.md` §2 F1 原文：

「`append §3` 的正文裁定读数 ≠ pass（无裁定行 ∥ 两者同携）⇒ 拒写」

「≠ pass」按字面把 `VERDICT: changes-required` 算进拒面，而本批 R2 要求那笔写进去。

两处都是父侧裁定「§4.4 括注同笔对齐」点名要改的那一笔，改法只补了新句、没替换旧句。

后果不是措辞：实施席照 §4.4 与本档 F1 落笔 ⇒ 打回那笔被拒 ⇒ `test/RTM.md` 14-8 第一笔写不进去，「打回即重置」不触发。

⇒ 修法只有两处：§4.4 那句括注换成两格形；F1 的「≠ pass」换成两格形。

**N1 明细**

设计档 §2.6.1 给 `verdictGateFailure` 的映射是：

「`「VERDICT: changes-required」` 映回 `changes-required`，`null` 映回 `null`，其余两值映回 `no-pass-line`」

「其余两值」= 「无裁定行」+「两者同携」。

盘上现状（本轮实读 `thincoder-core/agent-tools/design-token.mjs`）：

`:119` = `if (VERDICT_CHANGES_LINE.test(rawResult)) return "changes-required"`

`:120` = `return VERDICT_PASS_LINE.test(rawResult) ? null : "no-pass-line"`

⇒ 同携两行的一笔，今天是 `changes-required`；按上面映射会变成 `no-pass-line`。

这落在 `VERDICT_GATE_MARK(reason)` 的结论文案里，是用户可见串。

设计档同处又写「返回串词汇不动」「对外说法（拒因枚举）零改」⇒ 两句话不能同真。

⇒ 要让现状零变，同携格该映回 `changes-required`；要改行为，就在 D6 里明写这一格。

**N2 明细**

设计档 §2.5 定序表两行原文仍写：「携打回裁定行（无论是否同携 pass 行）」⇒ 重置 ∥ 零写。

§6 用例表也仍有一行：「一笔同携 pass 与打回两行 | 判打回（重置），不置位」。

而本批 §6 同一张表新增的一行是：「`append §3` 一笔同携 pass 与打回两行 | 拒」。

⇒ 同一输入在同一张表里两个期望，读者分不出「哪一层」。

建议：在那两行注明「写面已拒；本条只由计划函数直调取证（无工具入口）」。

**N3 明细**

`docs/batches/2026-11-02-review-verdict-line.md` §2 四 的骨架拆单法说：

「拆单法 = 把锚块（`_V_PRE` ∥ `_V_SUF` ∥ 两个裁定锚 ∥ `verdictGapOf` ∥ `lastRoundBlock`）抽成零依赖叶档 `thincoder-core/agent-tools/batch-verdict.mjs`」

但同节受影响文件表只有 7 档，没有 `batch-verdict.mjs`；设计档 §2.6 通篇仍写「锚块住 `thincoder-core/agent-tools/batch-skeleton.mjs`」。

`batch.mjs` 那条明写「归属下一批」，骨架这条没写 ⇒ 读成立即执行，则与上面两面相抵。

建议：补一句归属（同 `batch.mjs` 那条）。

**N4 / N5 明细**

N4：设计档 §2.6 原文「打回形三格同判：`结论：不通过` ∥ `结论：不通过。` ∥ `VERDICT: 不通过。`」——pass 侧列四格（含不带句号的 `VERDICT: 通过`），打回侧漏掉不带句号的 `VERDICT: 不通过`；行为不错，清点不齐。

N5：设计档 §2.6.1 原文「三处共读同一个函数，没有第二份组合序」——`statusPassPlan` 仍自带「pass ∧ 非打回」的组合序（本轮实读 `thincoder-core/agent-tools/batch-skeleton.mjs` 的 `:331` ∥ `:332`）。那是决策 24 拒合并的代价，登记一句即可，别写成「没有」。

**复核读数（本轮实读，供父侧对账）**

- O1 四格成立（盘上两锚 = `thincoder-core/agent-tools/batch-skeleton.mjs` 的 `:277`–`:283`）：`VERDICT: 通过。` 命中（`通过。` 分支）∥ `结论：通过。` 不命中（`_V_SUF` 不吃 `。`）∥ `结论：不通过。` 不命中 ∥ `VERDICT: 不通过。` 不命中。旁证 `结论：未通过。` ∥ 混合形 `**结论** = VERDICT: pass` 皆不命中。
- R5 两条判据可判定：`design-token.mjs` 里 `.test` 调用点只有 `:119` ∥ `:120` 两处（改调后 grep = 0 可达）；`export const VERDICT_PASS_LINE` 全仓单点导出。
- 14-1 / 14-8 现场成立：`test/RTM.md:178` 的 14-1 第二步要「拒文逐字 = `R-G2b`，块内裁定 = 无裁定行」（夹具经工具写无裁定块）；14-8（`:185`）第一笔就是「同一批判 `changes-required` 并 append `§3` 打回」⇒ 正是 #1 的后果面。
- 硬要求（普通模式不装门 ∥ 不适用 ∥ 由纪律承担 作为免于校验的理由）：本轮新增文字里未命中。§2.6.1 表内「不适用」六格都带机械依据（段白名单 ∥ `allowedSegment` ∥ 装配面实测），不是纪律豁免。

VERDICT: changes-required

### 轮次 3（评审子代理）

**评审轮次**：第 3 轮（只核第 2 轮那 6 条：🔴1 ∥ 🟡3 ∥ 🔵2；读数全部取本轮实读）

**计数**：🔴 0 · 🟡 0 · 🔵 0 · 6 条全闭

| # | Orig | 档 | Severity | Status | 一句话 |
|---|---|---|---|---|---|
| 1 | 🔴1 | `docs/core/design/BATCH-RECORD.md` §4.4 ∥ `docs/batches/2026-11-02-review-verdict-line.md` §2 F1 | 🔴 | Fixed | 两处旧句已删，只留两格形 |
| 2 | 🟡N1 | `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` §2.6.1 | 🟡 | Fixed | 同携映回 `changes-required`，盘上行为保住 |
| 3 | 🟡N2 | 同上 §2.5 ∥ §5 R23 ∥ §6 | 🟡 | Fixed | 四处同句同义，无漏标第五处 |
| 4 | 🟡N3 | `docs/batches/2026-11-02-review-verdict-line.md` §2 四 | 🟡 | Fixed | 已写「归属下一批，本批不建」 |
| 5 | 🔵N4 | `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` §2.6 | 🔵 | Fixed | 四处对四处，R27 五笔 ∥ 四笔数得上 |
| 6 | 🔵N5 | 同上 §2.6.1 | 🔵 | Fixed | 「没有第二份」已删，登记 `statusPassPlan` 一处 |

**逐条证据（本轮实读原文）**

- 🔴1：`docs/core/design/BATCH-RECORD.md` §4.4 现文 = 「`§3` 的追加若读成「无裁定行」∥「两者同携」，**写不进去**；判打回的一笔照写。」

  旧括注（pass 锚 ∧ 无打回锚 之外的一切形）本已不在盘上。

- 🔴1：`docs/batches/2026-11-02-review-verdict-line.md` §2 F1 现文 = 「`append §3` 的正文裁定读数 ∈ {`无裁定行`, `两者同携`} ⇒ 拒写；判打回的一笔…照写」——「≠ pass」已删。

- 🔴1 清场扫描：全仓 `*.md` 里旧串只剩 §1 裁决块与 §3 轮次块的引述（append-only 证据面，按 `docs/core/design/BATCH-RECORD.md` §4.1 不改），活判据面无残留。

- 🟡N1：§2.6.1 现文 = 「`null` 映回 `null`；`「VERDICT: changes-required」` ∥ `「两者同携」` 映回 `changes-required`（同携今天就走这一格）」；盘上 `thincoder-core/agent-tools/design-token.mjs` 现文 = `if (VERDICT_CHANGES_LINE.test(rawResult)) return "changes-required"` ⇒ 四格逐格同值。

- 🟡N2：§2.5 两行带「同携 pass 行那支已写不进去，只经计划函数直调可达」；§5 R23 带「计划函数直调取证，`append §3` 已写不进去」；§6 旧行带「`append §3` 已写不进去，此支只经计划函数直调可达」。

- 🟡N3：§2 四 现文 = 「**该拆单归属下一批**…本批不建 `batch-verdict.mjs`、不搬锚块」，与同节受影响文件表（无该档）∥ §2.6.1「锚块住骨架档」自洽。

- 🔵N4：§2.6 现文 pass 四格与打回四格各列四项；R27 的 pass 支列五项、打回支列四项——计数与条目数对得上。

- 🔵N5：§2.6.1 现文已无「没有第二份组合序」，改为「**登记残余（已知第四处，本批不动）**：`statusPassPlan` 仍把「命中 pass ∧ 不命中打回」逐条自写」；实读 `thincoder-core/agent-tools/batch-skeleton.mjs` 的 `statusResetPlan` 只测打回锚 + 状态词，`statusPassPlan` 测 pass ∧ 非打回 ⇒ 「一处」读数成立。

**硬要求扫描**：本轮三条档的新增文字里未出现「普通模式不装门 ∥ 不适用 ∥ 由纪律承担」作为免于校验的理由；§2.6 门表该闸的模式列 = 「两模式」。

VERDICT: pass

## §4 用户批准（主 agent）

**用户批准**（2026-11-02 15:40）：用户原话「**收口。**」——即对本批交付的批准与收口指令。

**批准内容**：`append §3` 写时闸（只拒两格）∥ `verdictGapOf` 判据单源 ∥ 两条裁定锚尾句号同判 ∥ 提示面两处。

**知情项（已在 §1 与 §6 记明）**：本批实施在会话整批推进下发起，未逐轮单独请批；本行是用户对交付的裁定，不是事后追认的补记。

## §5 实施记录（eng-coder）
**状态行**：实施完成（R1–R9 落 · 修正轮：拒文两词内联、与设计档围栏逐字节相同 · 单测 10/10 ∥ 集成 8/8 ∥ 1/1 ∥ 3/3 · doc_check PASS · R9 的纯文本引用那一格改撞文档机检门（337 字段落），已披露转父侧裁）



### 实施摘要（eng-coder · 2026-11-02）

**交付面** = §2 四 的 8 档，逐档一句：

- `thincoder-core/agent-tools/batch-skeleton.mjs`：锚块新增纯函数 `verdictGapOf`（四格；先打回、后 pass；非串 ⇒ `无裁定行`）；两锚中文分支补可选尾句号（`不通过。?` ∥ `需修改。?` ∥ `通过。?`），英文形不带。
- `thincoder-core/agent-tools/batch.mjs`：`appendBatchRecord` 新增段键 `n === 3` 的拒面（位次 = `§5` 门之后、文档机检门之前），判定输入 = 净化后 `body`；拒文 = `R-G3` 逐字常量 `SECTION3_VERDICT_GAP_ERROR`。
- `thincoder-core/agent-tools/batch-closeout.mjs`：`lastRoundVerdictGap` 的组合序换成 `return verdictGapOf(block)`；随之不再 import 两条裁定锚（注释同步收正）。
- `thincoder-core/agent-tools/design-token.mjs`：`verdictGateFailure` 改调 `verdictGapOf`，四格映回原有两个词（同携仍走 `changes-required`）；`export { VERDICT_PASS_LINE }` 保留。
- `thincoder-core/tool-docs/batch.md`：append 节补两段（§3 须带一行裁定、中文形与同义形一并点出；无裁定 ∥ 同携即拒且不消耗轮次号）。
- `thincoder-core/advisor/messages.mjs`：`buildDesignApprovalBlock` 补一句（同一条裁定行要进 §3，写面同判，拒则一字未落）。
- `test/integration/batch-gates-reanchor.test.mjs`：14-1 按 `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` §9 的三段形改写；14-8 作回归支未改；档头回指补 §2.6.1。
- `docs/batches/2026-11-02-review-verdict-line.test.mjs`：本批单测（R1–R8），收口删除（零留存）。

**契约面零改（本批边界）**：段序门判据与拒文字面、签发面拒因词表、状态行词表、冻结门、工具不代填裁定行——逐项未触。

### 验证读数（本席实跑）

- `node --test docs/batches/2026-11-02-review-verdict-line.test.mjs` ⇒ tests 10 ∥ pass 10 ∥ fail 0。
- `node --test test/integration/batch-gates-reanchor.test.mjs` ⇒ 8/8 pass（R7；父侧收口再跑一次为准）。
- `node --test test/integration/batch-status-auto-set.test.mjs` ⇒ 1/1 pass（27-1：一笔携 pass 即签字）。
- `node --test test/integration/advisor-record-gate.test.mjs` ⇒ 3/3 pass（17-1…17-3——签发面落在改动面上）。
- `node --check` 五档（`batch.mjs` ∥ `batch-skeleton.mjs` ∥ `batch-closeout.mjs` ∥ `design-token.mjs` ∥ `messages.mjs`）⇒ exit 0。
- R5 两条判据：`export const VERDICT_PASS_LINE` 全仓 1 命中（骨架档）；`design-token.mjs` 内锚 `.test` 组合序 0 命中。取证形 = 同携正文经 `append §3` 得 `两者同携`，同一正文直写成末块后经 `append §5` 的括注同值。
- `doc_check` 报告态对 `thincoder-core/tool-docs/batch.md` ∥ `test/RTM.md` ⇒ 0 命中。

### 锚改动四格真值表（改后实测，`node` 直读两条锚）

| 输入 | 读哪条锚 | 改前（盘上，§2 五 记） | 改后（实测） |
|---|---|---|---|
| `结论：通过。` | `VERDICT_PASS_LINE` | 不命中 | 命中 |
| `VERDICT: 通过。` | `VERDICT_PASS_LINE` | 命中 | 命中 |
| `结论：不通过。` | `VERDICT_CHANGES_LINE` | 不命中 | 命中 |
| `VERDICT: 不通过。` | `VERDICT_CHANGES_LINE` | 不命中 | 命中 |

**旁证（改前改后皆不命中）**：混合形 `**结论** = VERDICT: pass`（`**` 与 `：` 之间被 `结论` 夹开，非整行形）；`结论：未通过。`；`我们未通过。`；`VERDICT: pass。`（英文形不吃句号，与改前一致）。

**连带两处行为**（读数取自单测）：`结论：通过。` 的回执此后签得出凭证；`结论：不通过。` 的一笔判打回并同笔把 `§3` 状态行重置为 `进行中（第 1 轮打回）`。

### 审计与评审轮次、终态

- **内部偏离审计**（read-only explore，1 轮）：A–F 八项判定全 PASS；报 3 条偏离（两条设计档漂移 + 一条 RTM 四列缺一格），处置见下「披露」。
- **内部代码评审**（advisor `type=code`，1 轮）：🔴 0 ∥ 🟡 2（均 optional / coordination）∥ 🔵 5。
- **自修轮次 1 轮**：采纳 🔵5（`thincoder-core/tool-docs/batch.md` 补齐 `需修改` 同义形，并重跑 doc_check = 0 命中）；其余四条按「披露」处置。
- **终态 = `clean`**：无 🔴、无必修 🟡，收敛。

### 披露（清单外 / 偏离 / 未做）

| 项 | 处置与理由 |
|---|---|
| **清单外改 `test/RTM.md`**（14-1 行重写 + 节注回指加 §2.6.1） | 已改并披露。`docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` §9 要求该行逐列重写；旧行写的是「让评审写一轮 `§3`（块内无裁定行）」，本批起该步被 `R-G3` 拒 ⇒ 留着就是一条跑不通的验收步骤。 |
| RTM 服务条目写 `R4 + R27`，非设计档 §9 的「R4 + 本批 R1」 | 有意保留 R27。`test/RTM.md` 是状态档，写「本批 R1」= 状态档引一次性批档，批档一删即悬空；R27 是设计档 §5 的持久键，指同一条判据。 |
| 设计档 §2.5 仍写「`batch-closeout.mjs` 的 import 面零改」 | 未改（设计档非本席笔）。实际该档已不 import 两条裁定锚——§2.6.1 要求它改调 `verdictGapOf`。请父侧转设计席订正。 |
| 设计档 §2.6.1 登记 `statusPassPlan` 坐标 `:331`-`:332`、§2.6 的 `verdictGateFailure` 坐标 `:116`-`:120` | 未改（同上）。插入 `verdictGapOf` 后两处坐标后移，现读 `:359`-`:360` ∥ `:124`。 |
| 设计档 §2.6.1「（`§2.6` 判据 3）」 | 悬空回指：§2.6 只有判据 1（状态词）与判据 2（末块裁定）。未改，转设计席。 |
| `docs/core/design/API-CONTRACT.md` 生成区 | 未跑生成器（生成区 = 生成器唯一笔、父侧执行）。实读 `--check` = DRIFT（盘上 4642 ∥ 生成 4647）；本笔贡献 1 行（`verdictGapOf`），余为他批在飞。收口前请父侧跑 `node scripts/api-contract.mjs --write --root .`。 |
| 代码评审 🟡2：一笔 §3 若原样引述 `R-G3` 拒文（拒文自带两行逐字裁定例）会被判「两者同携」而整笔拒写 | 未改。拒文由设计档钉死为逐字形，改一字即偏离；是否给这一格加提示属设计面判断，转父侧裁。 |
| 代码评审 🔵7：`verdictGapOf` 值域是中文自由串，写面按字面比较 | 未改。值域字面同样由设计档钉死；导常量属新面，宜随下一批搬档（`batch-verdict.mjs`）一并做。 |
| tier：`batch-skeleton.mjs` 实测 524 行、`batch.mjs` 531 行（>500 软线） | 已知欠账。拆单法已在 §2 四 登记并标「归属下一批」；本批骨架档只新增 1 个导出，`batch.mjs` 只加一条拒面。 |

### 未验项

- 未跑全量套件（不属本席验收面）；父侧收口那一跑为准。
- 他批在飞的改动与本笔同处一工作树，`git diff` 面不以本席为界——本席改动以上列 9 档为界。

### 修正轮：拒文两词内联（eng-coder · 2026-11-02）

**动的一处**：`thincoder-core/agent-tools/batch.mjs` 的常量 `SECTION3_VERDICT_GAP_ERROR` 换成设计档 §2.6.1 围栏里的逐字形——两个裁定词内联在同一句，`\n` 只分两行（拒因句 ∥ 本地化形与「一字未写」句）。

紧邻的文档注释同笔改写：点明「不各占独立一行」的成因，以及缩进 ∥ 列表符为何不取。

**取证形**：拒文不是手抄。从 `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` 里 `拒文（逐字，R-G3）：` 后那道围栏逐行切出，与源档字面量 `JSON.parse` 后比对 ⇒ `byteEqual: true`（563 字符；两行 337 ∥ 225）。

**三格复跑**（真函数 `verdictGapOf`，由 `thincoder-core/agent-tools/batch-skeleton.mjs` import）：

| 输入 | 读数 |
|---|---|
| 拒文自读 | `无裁定行` |
| 拒文 + 一行 `VERDICT: pass` | `null`（可写） |
| 拒文 + 一行 `VERDICT: changes-required` | `VERDICT: changes-required`（打回照写） |

**旧形对照**（同一处换回旧的两行示例）：自读 `两者同携`；加一行 `VERDICT: pass` 仍 `两者同携` —— 父侧读数复现。

**单测 R6 未动**：它断言的是稳定串（两个裁定词 ∥ `no round number was consumed` ∥ 混形反例），新逐字形三者皆含，10/10 照绿。

#### 勘误：上一轮披露表三行已过期（设计席已改完）

| 上一轮写的 | 现盘读数 |
|---|---|
| 设计档 §2.5 仍写「`batch-closeout.mjs` 的 import 面零改」 | 该句已不在盘上（该形 0 命中） |
| 设计档 §2.6.1 ∥ §2.6 的两处行号坐标后移未改 | 行号已全撤、改写符号名（`:331` ∥ `:116` 等 0 命中） |
| 设计档 §2.6.1 引「`§2.6` 判据 3」悬空 | 已改指判据 2（「判据 3」0 命中） |

#### 本轮发现（披露，未改）

**R9 第二格按纯文本原样引用时仍写不进去 —— 但拒因换了门**：`§3` 闸已放行，卡住它的是**文档机检门**（拒文首行 337 字 > 300 字段落阈值）。

读数：那一笔得 `DOC-CHECK GATE: REFUSED（命中 1 条——本次写入文本（1 处文字太长，难于阅读））`，块数 0。

同一笔改成代码围栏引用即写入、块 +1（机检门不吃围栏内的段落）⇒ 「引用这道拒文的人被它挡在门外」这层已解开：旧形是 `§3` 闸判 `两者同携`，现在是段落长度，属既有门、与本闸无关。

未改：改它要动设计档钉死的拒文逐字形（拆行 ∥ 缩短首行），属设计席的笔，转父侧裁。

**本轮验证读数**：

- `node --test docs/batches/2026-11-02-review-verdict-line.test.mjs` ⇒ 10/10 pass。
- `node --test test/integration/batch-gates-reanchor.test.mjs` ⇒ 8/8 pass（14-1 ∥ 14-8 的 pass 与打回两支都在）。
- `node --test test/integration/batch-status-auto-set.test.mjs` ⇒ 1/1 pass。
- `node --test test/integration/advisor-record-gate.test.mjs` ⇒ 3/3 pass。
- `node --check thincoder-core/agent-tools/batch.mjs` ⇒ exit 0。
- `batch.mjs` 现 532 行（本笔注释 +1 行）；tier 结论不变——拆单归属下一批。

## §6 验证与收口（父代理）

### 6.1 验证读数（父侧独立复跑，非转述）

| 面 | 命令 | 读数 |
|---|---|---|
| 集成 | `node --test test/integration/batch-gates-reanchor.test.mjs` ∥ `batch-status-auto-set` ∥ `advisor-record-gate` | 全部通过（含 14-1 改写三段、14-8 打回回归支） |
| 收口前终跑 | 上面三项 + `batch-edit-spec-section` + `edit-line-anchor` 同跑 | `tests 15 · pass 15 · fail 0` |
| 四格真值表 | 对落盘 `verdictGapOf` 真跑 | `结论：通过。` ∥ `VERDICT: 通过。` ∥ `结论：不通过。` ∥ `VERDICT: 不通过。` 皆命中；混合形不命中 |
| 拒文不自触发 | 拒文自读 ⇒ `无裁定行`；拒文 + 一行 `VERDICT: pass` ⇒ `null`（可写入） | 改前为 `两者同携` ∥ 仍 `两者同携`（死结已解） |
| 生成区 | `node scripts/api-contract.mjs --check --root .` | `OK（4642 条 · 942 档）· 骨架零漂移` |
| 文档门 | `doc_check(mode:"gate")` | 本批各笔 append 回执皆 `DOC-CHECK GATE: PASS` |

### 6.2 零留存

本批单测档 `docs/batches/2026-11-02-review-verdict-line.test.mjs` **已删**（收口即删，读数已入 §5 与上表）。

### 6.3 交付内容

- `thincoder-core/agent-tools/batch-skeleton.mjs`：新增 `verdictGapOf`（四格单源）；两条裁定锚中文分支尾句号可省可带。
- `thincoder-core/agent-tools/batch.mjs`：`append §3` 写时闸（只拒「无裁定行」∥「两者同携」，判打回的一笔照写）。
- `thincoder-core/agent-tools/batch-closeout.mjs` ∥ `design-token.mjs`：组合序改调 `verdictGapOf`。
- `thincoder-core/tool-docs/batch.md` ∥ `advisor/messages.mjs`：提示面。
- `test/integration/batch-gates-reanchor.test.mjs`：14-1 改写为三段；14-8 作回归支。

### 6.4 已知未决（不并入本批）

- 台账 `#1995`：`batch edit` 机检门判整段体（代码）vs 判 `newText`（设计档）—— 设计与代码说法不同，待代码收窄。
- 台账 `#1996`：`batch.mjs` 516 行越 500 软线，拆点 = 抽 `batch-edit.mjs`，归属下一批。
- 台账 `#1997`：会话内工具面未热更（盘上有 `edit`、进程内无）。

### 6.5 收口判定

四段皆带内容；单测档已删；集成面零红。**准予收口。**
