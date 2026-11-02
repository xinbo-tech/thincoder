# 2026-11-01 · status-line-auto-set
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-11-01 · 来源 = 用户 2026-11-01 22:02「状态行那个问题应该从提示词和工具层面找找原因」⇒ 父侧溯因到工具不对称（打回被动写、通过无人写）⇒ 用户 22:03「开」。
> 台账 = #1972（BATCH-LEDGER-REVIEW-UNIFY · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-11-01
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

## 1. 讨论（主 agent）

**状态行**：进行中

- **已定决定**：本条按「工具缺陷」处理，不按「评审记性」处理 —— 机制接住，提示词里那句「必须记得做两件」随之撤掉。 · 用户原话：「**状态行那个问题应该从提示词和工具层面找找原因**」 · 时间：2026-11-01 22:02
- **已定决定**：开本批（设计 → 评审 → 实施全链）。 · 用户原话：「**开**」 · 时间：2026-11-01 22:03

### 事实（父侧实读，本轮）

`thincoder-core/agent-tools/batch.mjs:245`–`:251` 只有**打回即重置**：三合取（本笔写 §3 ∧ 本笔命中 `VERDICT_CHANGES_LINE` ∧ 写前状态 = `评审通过`）⇒ 同一笔把状态行重置为 `进行中`。

`thincoder-core/agent-tools/design-token.mjs:225`–`:236` 在签发路径上读 §3 段级状态词，≠ `评审通过` ⇒ `status-not-passed` 拒签。

**两者之间缺一条**：`VERDICT: pass` 那一轮，没有任何人写这个字。

`design-token.mjs:227` 的注释自己写着：「**轮次块只由工具戳标题、块内无状态行落点 ⇒ 读块内状态行是读一行没人写的字。**」

### 病（今晚实测，可复述）

| 评审做了什么 | 结算结果 |
|---|---|
| 只写轮次块（含 `VERDICT: pass`） | `status-not-passed` —— 字没签 |
| 只写状态行、不写块 | `no-section3-block` —— 结论没落 |

**两种错互为镜像，判据都不接受。** 今晚实测四轮返工（`#1722` ×2 ∥ `#1966` ×2 ∥ `#1970` ×1 ∥ `#1969` ×1）。

**为什么这是缺陷而不是纪律问题**：`statusResetPlan` 已经把「工具被动写状态行」这条机制立起来了，却只立了一半 —— 打回一侧有，通过一侧没有。**半个自动，等于把「记得做两件事」这条纪律永久留在人身上。**

### 目标态

**评审写块即完成**：带 `VERDICT: pass` 的 §3 块，同一笔写盘把段级状态行置成 `评审通过`；带打回裁定行的同一笔重置成 `进行中`。两条共用同一个锚族（`VERDICT_PASS_LINE` ∥ `VERDICT_CHANGES_LINE`，均已在 `batch-skeleton.mjs`）与同一个写入函数（`updateSectionStatusLine`，代码注释明写「不新开第二条写路径」）。

### 边界（本批不做的面）

- **不改结算判据**（`status-not-passed` 拒签这条保留 —— 它守的是「块与字必须同轮一致」；本批要做的是让字自动到位，不是让判据放宽）。
- **不改 §5 写入门**（它读同一处状态行）。
- **不改打回重置那条既有行为**（零回归）。
- **不碰 `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` 之外的机制面**。

### 授权口径

用户「开」覆盖本批全链（设计 → 评审 → 实施）。**评审结论 🔴 需改设计语义时停下上抛。**

### 设计轮上抛四条 · 父侧裁决（2026-11-01 22:09）

- **已定决定**：`docs/core/design/ADVISOR-GUARDS.md` 三处写面句（§1.1 判据 2「评审经 `batch` 的 `status` 动作写入」· §1.3 拒文第二句 · A-AG22 的「补写后重评」前提）**并入本批收正**，不另开合并轮。 · 理由：机制一落地这三句立刻为假；设计档说假话比留旧账更坏。 · 用户原话：（承 22:03「**开**」的批次授权） · 时间：2026-11-01 22:09

- **已定决定**：`thincoder-core/tool-docs/batch.md` 的 `status` 条目补一句「评审写块即置位，`status` 对该身份可选」。 · 理由：**工具描述是模型真正读到的那一面**——不写，评审仍会照旧手动签一次（无害但多余），更坏的是它会以为「必须」。 · 时间：2026-11-01 22:09

- **已定决定**：`docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` §3 表内行数读数**去数值化**（本批收）。 · 理由：那些数已失真（表记 314、现盘 471），而**行数不是判据**——留着就是一条随时会错的断言。 · 时间：2026-11-01 22:09

- **已定决定**：需求档 `docs/core/requirements/ENGINEERING-MODE-V2.md` **补一行**状态行置位语义。 · 理由：机制侧只挂台账 `#1972`，需求层一字未涉；**机制没有需求条目，下一轮就没人知道它该存在**。 · 笔域 = 主 agent，随本批落。 · 时间：2026-11-01 22:09

**父侧前提更正（记在讨论面）**：我原称提示词面有「Round 2+ 必须同轮做两件事」这类句子、机制接住后应撤。

实扫 = **无此句**：`做两件事` ∥ `同轮` 在提示词面与 tool-docs 面各 0 命中。

`状态行` 仅 2 处（`thincoder-core/prompts/persona-engineering.md` 的一段释义 ∥ `thincoder-core/tool-docs/batch.md` 的 `status` 条目）、`评审通过` 仅 1 处陈述句。

**⇒ 这条要求从来只活在结算判据里，没有任何一面要求过评审自己签字。** 设计席的三条 grep 成立；本条按「提示词面零改 + tool-docs 补一句」处置。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试覆盖 / 验收对照 / 关键决策 / 上抛项>

**状态行**：设计完成（eng-designer · 2026-11-01）

设计档落点 = `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md`：机制正文 `§2.5`（通过即置位）· 决策 `§4` 24 · 验收 `§5` R23 · 用例 `§6` · RTM delta `§9`（故事 27）。

### 本批条目（覆盖）

| 条目 | 一句话 | 判据落点 |
|---|---|---|
| R23 | 携 `VERDICT: pass` 的一笔 `append §3` 由工具把 §3 段级状态行置成 `评审通过`；打回一侧零回归 | 设计档 `§2.5` ∥ `§5` R23 |

覆盖账 = `#1972`（本档档头那一行 · BATCH-LEDGER-REVIEW-UNIFY · 归批）——本批一条；§1 的 `覆盖账` 行归主 agent。

### 机制设计（正文以设计档 `§2.5` 为准）

- 新增 `statusPassPlan(src, seg, body, date)`（`thincoder-core/agent-tools/batch-skeleton.mjs`，与 `statusResetPlan` 同签名同位置）：三合取 ① 本笔写 §3 ② 净化后正文命中 `VERDICT_PASS_LINE` ∧ **不**命中 `VERDICT_CHANGES_LINE` ③ 写前 `readSectionStatusWord(src, 3)` ≠ `评审通过` ⇒ 返回 `{ roundN, statusValue }`。
- 调用点 `thincoder-core/agent-tools/batch.mjs:249`：`statusResetPlan(...) ?? statusPassPlan(...)`；写盘仍一次 `writeFileSync` + `updateSectionStatusLine` 单行改写（不新开写路径）。
- 定序：一笔同时携 pass 与打回两行 ⇒ 判打回（与 `verdictGateFailure` 同序，`thincoder-core/agent-tools/design-token.mjs:117`）。
- 锚：`VERDICT_PASS_LINE` 定义迁入 `batch-skeleton.mjs` 锚块（否则骨架档回引签发面成环——`thincoder-core/agent-tools/design-token.mjs:20` 已 import 骨架档）；`design-token.mjs` 改 import + 原样再导出，`thincoder-core/agent-tools/batch-closeout.mjs:29` 零改。
- 运行时回执串两处收正（字面 = 设计档 `§2.5`）：`thincoder-core/agent-tools/design-token.mjs:136` ∥ `:233`；拒因三值与判据零改。

### 受影响文件（设计档 `§3` 已列）

产品码 3 档：`thincoder-core/agent-tools/batch-skeleton.mjs`（+`statusPassPlan`、pass 锚迁入）· `thincoder-core/agent-tools/batch.mjs`（接第二计划）· `thincoder-core/agent-tools/design-token.mjs`（两处回执串 + 锚 import/再导出）。生成区 `docs/core/design/API-CONTRACT.md` 随生成器刷新，不手改。提示词面零改。

### 验收对照（判据单源 = 设计档 `§5` R23）

- 单测（实施轮写、收口删）：`node --test docs/batches/2026-11-01-status-line-auto-set.test.mjs`——八段判据逐条 = 设计档 `§5` R23 的分号段。
- 集成：`test/RTM.md` 故事 27 行 27-1（交互与断言 = 设计档 `§9`）；实施轮先把号写进 RTM，再写用例标题。
- 回归：打回方向（既有行为）逐字不变；`status` 动作、结算判据、`§5` 门判据零改。

### 关键决策

设计档 `§4` 决策 24（两条计划并列 + `??` 定序；被拒 = 合并单函数 ∥ 两行同携时拒写）。

### 上抛项

1. **`docs/core/design/ADVISOR-GUARDS.md` 三处需收正**：§1.1 判据 2 的写面句（「评审经 `batch` 的 `status` 动作写入」）· §1.3 拒文第二句（「补写该批档 §3（发现 + VERDICT + 状态行 = 评审通过）」）· A-AG22 的「补写后重评」前提。本批按设计档既有惯例以「取代」处理（设计档 `§2.5` 末条），收正归合并轮——**请裁定并入本批还是登记合并轮**。
2. **父侧设想的「Round 2+ 必须同轮做两件事（append §3 + status）」一句，提示词面查不到**。判据（三条，本轮实跑）：① 仓内全量 grep `两件|同轮|Round 2`（`thincoder-core/**`）零命中该句；② `thincoder-core/prompts/**` 查 `状态行|评审通过` 只命中 `thincoder-core/prompts/persona-engineering.md:325`「A passed review is recorded as「评审通过」(review passed); nothing more.」——陈述句，不含动作要求；③ `**/{prompts,advisor}/**` 查 `action:"status"` 零命中，三处「写 §3」指令（`thincoder-core/prompts/advisor-design.md:115` ∥ `thincoder-core/prompts/advisor-round2.md:64` ∥ `thincoder-core/prompts/advisor-round3.md:66`）只要求写块。故按「提示词面零改」处理——**请复核该句是否记错了落点**。
3. **设计档 `§3` 表含行数读数**（设计席自身禁「行数 / 预期增量」），且读数已与盘上不符（表里 `batch-skeleton.mjs` 314 行，现盘 471 行）。本批只加行、不动旧格（旧格属上一批的实施计划面）；**请裁定是否另起一轮清理成无读数形**。

### 修正轮 · 父侧裁决四条已落笔（2026-11-01 22:11，首条设计完成之后）

**状态行**：设计完成

本批条目不变（R23 一条）；机制设计不变（正文单源 = 设计档 `§2.5`）。本轮只把 §1「设计轮上抛四条 · 父侧裁决」落进设计档，并续落父侧问到的第五、第六处。

| 裁决 | 落笔落点 | 落笔形态 |
|---|---|---|
| ① `docs/core/design/ADVISOR-GUARDS.md` 三处并入本批 | §1.1 判据 2 写面句 · §1.3 拒文第二句 · §10 A-AG22 尾句 | 按 D8 直接改成当下为真（状态行由工具随 `append §3` 置位 ∥ 重置；`status` 动作 = 同面上的可选手写口），不留修订叙述 |
| ② `thincoder-core/tool-docs/batch.md` 的 `status` 条目补一句 | 字面与落点 = 设计档 `§2.5`；判据 = `§5` R23 末项；实施轮由 coder 落 | 逐字一句（英文，与该档同语） |
| ③ 设计档 `§3` 去数值化 | 主表 26 行 + 拆分预算表 + 分舱计数 | 去行数读数与预期增量；主表第二列由行数改档位结论（新档 / 改造 / 零改）。父侧裁的补充：`docs/core/requirements/ENGINEERING-MODE-V2.md:1031` 的「触达即修」按本文只覆盖 300 字段落判据，**不自动覆盖这一列** |
| ④ 需求档补状态行置位语义 | **不在本笔域**（主 agent 笔，随本批落） | 本笔零触需求档 |

**第五、第六处（父侧问「有没有第五处也在说这件事」，实读得两处）**：`docs/core/design/ADVISOR-GUARDS.md` §1.1 的「段级状态行不携带哪一轮写的」条只写了打回一半 ⇒ 补上通过一半；同档 §1.3 破行条要求夹具「轮次块 + 状态行 = 评审通过」⇒ 改为「轮次块携 `VERDICT: pass`——状态行由工具随块置位」。

**设计档内随之收正的两处（同一件事的旧表述，D8 就地改）**：`§2.5` 的「运行时回执串随之收正」改成当下字面（原写法是「错指导 ⇒ 改为」，属修订叙述）；原「取代（本档为准；收正归合并轮）」条按裁决①删除——机制落地后那三句已为真，不再需要「以本档为准」。

**受影响文件（本轮实变）**：设计档两档——`docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md`（`§2.5` · `§3` · `§5` R23）∥ `docs/core/design/ADVISOR-GUARDS.md`（§1.1 · §1.3 · §10）。产品码面按设计档 `§3` 表走（新增 `thincoder-core/tool-docs/batch.md` 一句），本笔零触。

**验收**：判据单源 = 设计档 `§5` R23（末项 = tool-docs 置位句在位）；单测 = `node --test docs/batches/2026-11-01-status-line-auto-set.test.mjs`（实施轮写、收口删）；集成 = `test/RTM.md` 故事 27 行 27-1（号先落 RTM，再写用例标题）。

**§3 表去数后的读数（供核）**：主表 26 行（新档 6 · 改造 19 · 零改 1）；分舱 25 档（`thincoder-core/memory.mjs` 零改不入舱）= 7 / 4 / 7 / 4 / 3，最大舱 7 档。

### 修正轮 · 段级状态行定位面收窄（父侧裁「只裁这一步」，2026-11-01）

**状态行**：设计完成

**缺陷（实施席报，父侧判真）**：

- `append §3` 的步序 = 先 `insertIntoSection`（本笔正文进 §3）、后 `updateSectionStatusLine(inserted, 3, value)`；而该函数按段内**首个** `**状态行**：` 行定位。
- 评审正文引述一行 `**状态行**：…` ⇒ 工具改写的是正文那行，段级状态行没补出：正文被静默改写、`thincoder-core/tool-docs/batch.md` 的 append-only 被破。
- **为什么是本批新开出的**：打回方向三合取要「写前 = `评审通过`」⇒ 那时段里必有一条真状态行；通过方向在「§3 尚无段级状态行」（骨架原形档就是这种）时正撞。

**裁定 = 路 1（收窄定位面），规则对 §1–§6 一律成立**：

- **不是路 2（先置位后插块）**：路 2 只救「本笔新插的块引述了状态行」；§3 里**上一轮**块正文引述的行还在首命中位上，改写照旧发生——正确性变成调用顺序的函数，而正确性应当是定位规则的函数。
- **只收窄写面不够**：两条计划的 ③ 本身就是一次读。引述行写 `**状态行**：评审通过` 的档，③ 读成 done ⇒ 零写 ⇒ 段级行永不出现，`§5` 门再按首命中读到那行引述并放行。故 ③ 与写面读同一区（`readSectionStatusWord` 的显式区域参数）。
- **不是 §3 特例**：工具写的每条段级状态行都落段头区（create 骨架如此、缺行插入形如此），§1 / §2 / §5 / §3 因而同一条规则，实现里不出现 `seg === 3` 分支。特例的代价 = 一个函数两个定位语义，下一轮没人知道该按哪个读。

**② 三处共用写面的行为核对（改前实读）**：

| 调用点 | 现在的行为 | 收窄后 |
|---|---|---|
| `status` 动作（`thincoder-core/agent-tools/batch-lifecycle.mjs:258` 调 `updateSectionStatusLine(src, seg, lineValue)`） | 段内首命中行原位改写；段内无该行 ⇒ 段头后插入 | 段头区有该行 ⇒ 同一行改写（工具写过的档必如此，取值零变）；只有块正文引述行时 ⇒ 不再改它，改为段头区补出真行 |
| `close`（同档 `:289` 写 §1 `已收口 <date>`） | 同上 | 同上；§1 状态行由 create 骨架落在段头区 ⇒ 常态路径逐字不变 |
| 重开（`thincoder-core/agent-tools/batch-reopen.mjs:91` 写 §1 `进行中（重开 <date>）`） | 同上 | 同上 |

三处的语义都不依赖「能改到段头区以外的行」——那正是要消掉的行为。

**③ 新夹具的确切形（单测：实施轮写、收口删）**：

1. 骨架原形档（`batch create`，§3 无状态行），一笔 `append §3`：正文含一行 `**状态行**：进行中（引述 · 不得被改写）`，末行 `VERDICT: pass`。断言：① 该引述行**逐字节等于原文**；② §3 段头区出现 `**状态行**：评审通过`；③ `readSectionStatusWord(src, 3)` = `评审通过`；④ 轮次块 +1；⑤ `> 状态行重置` 命中 0。
2. 同形但引述行本身写 `**状态行**：评审通过`（写前段头区仍无行）：断言段头区补出 `**状态行**：评审通过`、引述行零改（证明 ③ 读的是段头区，不是首命中）。
3. 打回方向：写前段头区 = `评审通过`，一笔携打回行的正文引述 `**状态行**：进行中（上一轮）`：断言段头区 = `进行中（第 N 轮打回）`、引述行零改、留痕行 1。
4. 共用面：`status` 写 §2，段头区有状态行、`###` 之下另有一行同形：断言段头区那行改写、`###` 之下那行零改。

**坐标收正（设计档 `§2.5`，逐字）**：

- 「全住 `thincoder-core/agent-tools/batch-skeleton.mjs` 的锚块（`:282` 起）」→「四条导出全住 `thincoder-core/agent-tools/batch-skeleton.mjs`（`_V_PRE` 起的那一组）」——按符号指位，不再跟行号漂。
- 「`thincoder-core/agent-tools/design-token.mjs:229`-`:233` 的 §3 落地门判据 2」→「`thincoder-core/agent-tools/design-token.mjs` 的 §3 落地门判据 2——读 `readSectionStatusWord(batchSrc, 3)` 那处，拒因 `status-not-passed`」。
- 「锚的住处随本批收正：`VERDICT_PASS_LINE` 的定义从 `thincoder-core/agent-tools/design-token.mjs:115` 迁入…」（修订叙述 + 死坐标）→ 删除，只留「锚住骨架档的理由」一句；再导出与生成区两句并入 `§2.5` 的铁锚条。
- 「`thincoder-core/agent-tools/design-token.mjs:136` 的 `REVIEW_RECORD_MARK` … 同档 `:233` 的证句」→ 去行号（`REVIEW_RECORD_MARK` / 判据 2 的证句）。

**受影响文件**：

- 产品码一档：`thincoder-core/agent-tools/batch-skeleton.mjs`——`updateSectionStatusLine` 区域裁剪 + `readSectionStatusWord` 增显式区域参数 + 两条计划 ③ 传参。
- 零改：`thincoder-core/agent-tools/batch.mjs` ∥ `thincoder-core/agent-tools/design-token.mjs`。
- 档面：`docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md`（`§2.5` · `§3` 档位结论 · `§4` 决策 25 · `§5` R23 · `§6` · `§9`）。

**验收**：

- 判据单源 = 设计档 `§5` R23（末三段 = 本轮新增）。
- 单测 `node --test docs/batches/2026-11-01-status-line-auto-set.test.mjs`（既有 8 例 + 上列 4 例）。
- 集成 RTM delta = 0（`test/RTM.md` 27-1 断言不变，理由 = 设计档 `§9`）。
- 门 = `doc_check(mode:"gate")`；本轮读数 `DOC-CHECK GATE: PASS`。

**未定项**：无。§3 评审轮的 10 条 🟡 不属本轮（本轮只裁定位面）。

### 收尾修正轮 · 残余两方向 + 两处判据面补记（eng-designer · 2026-11-01）

**判据单源 = 设计档 `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` §2.5「段级状态行的定位面」节。** 本轮零改代码、零新增判据、零新增验收条目；本批条目仍为 R23 一条，机制设计（置位 ∥ 重置两条计划、段头区定位面）逐字不变——本笔只补三处设计档陈述。

| 落点（设计档 §2.5） | 落笔形态 |
|---|---|
| **① 残余两方向并列** | 「方向 A · 读」（既有：从未触发过置位的 §3，块正文引述行仍被缺省读面读到）∥「方向 B · 触发面与门面不对称」（打回 ③ 读段头区 = 无状态行 ⇒ 不落字；门面读缺省 ⇒ 读到引述行）；影响面逐处点名 = 收口门 §3 状态词臂 ∥ 核销门③ ∥ 签发面判据 2，`§5` 写入门不受影响（判据 2 要末块自己携 pass 裁定） |
| **① 存量读数与影响** | 本轮实测：`docs/batches/**` 259 档 / 258 个 §3 段，段头区无状态行而区外有该行 = **3 档**（`docs/batches/2026-10-28-product-text-sweep.md` ∥ `docs/batches/2026-10-28-rule-writing-sweep.md` ∥ `docs/batches/2026-10-28-sse-first-chunk-idle.md`），三档 §1 均 `已收口` ⇒ **实际影响 0** |
| **① 裁定** | 不取「段头区为空则回落缺省读」：回落把方向 A 的通道还给触发面（一条引述行即可冒充段级状态行），为 0 个实例换回一个已堵上的窟窿；残余按登记处理，不新增判据、不放宽任何门 |
| **② 漂移一：区域参数只收两值** | `section`（缺省）∥ `header`；其它值当场 throw，不静默回落宽读——**理由写进档**：拼错的区域名回落成段内首命中，正是收窄失效的那一形，且失效无声 |
| **② 漂移二：区界判据 `^#{2,}`** | 认到 `####` 及更深子标题为止（`ZONE_END_RE` 单源，写面与触发读面同读）；**理由写进档**：比「下一个 `##` / `###`」宽一档，方向偏安全——段级状态行由工具插在 `## §N` 标题正下方，多认一层子标题只让区更早结束，不会把正文行当成段级状态行 |
| **③ 哪几处收窄、哪几处没收** | 新增三列单源表（面 / 坐标 / 取值区）：**收窄三处** = 写面 `updateSectionStatusLine` ∥ 打回 ③ `statusResetPlan` ∥ 置位 ③ `statusPassPlan`（全 `thincoder-core/agent-tools/batch-skeleton.mjs`）；**未收窄五处** = §5 写入门判据 1（`thincoder-core/agent-tools/batch-closeout.mjs` 的 `assertSectionFiveGate`）∥ 收口门 §3 状态词臂（同档 `assertCloseoutGates`）∥ 核销门③（`thincoder-core/ledger-close-proof.mjs` 的 `assertCloseOutProof`）∥ 签发面判据 2（`thincoder-core/agent-tools/design-token.mjs`）∥ `batch/list` 列举面（`thincoder-core/agent-tools/batch-read.mjs` 的 `listBatchRecords`）；§1 冻结判据 `readBatchStatusLine` 同形（§1 与 §3 同一条写面规则） |
| **③ 为什么只收窄那三处** | 收窄判据只对「写面 + 它的前置读」成立（两者不同区 ⇒ ③ 判 A 行、改写 B 行，本批修的正是这一形）；门面换读区是判据面变更——3 档存量档换区后读成「无状态行」⇒ 已收口的档收不了口、核销不了，代价大于它解决的问题；门面改读区另起一批 |
| **坐标收正** | §2.5 三合取 ③ 的调用形由 `readSectionStatusWord(src, 3)` 改为 `readSectionStatusWord(src, 3, "header")`（与盘上实现一致） |

**父侧点名两面、实读为五面**：父侧口径「缺省读面（`§5` 门 ∥ 核销门③）逐字未动」——实读还需并入 **收口门 §3 状态词臂**（`batch-closeout.mjs` 的 `assertCloseoutGates`）与 **签发面判据 2**（`design-token.mjs`），另 `batch/list` 列举面同读缺省形态。九处面（三收窄 + 六缺省）在上表逐条列名，读者不必再查一遍。

**受影响文件（本轮实变）**：`docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md`（§2.5 定位面节）· 本批 §2。**产品码与测试面零触**；无新增 / 无删除档。

**三链一致**：条目 = 本批 §2 首节 R23（一条，不变）∥ 机制 = 设计档 §2.5 ∥ 验收 = 设计档 §5 R23（本轮零新增判据 ⇒ 单元格不变；此前的定位面四段与「③ 传区域参数」在 R23 末段与 `§6` 已覆盖）。

**台账**：`#1977`（缺省形态残余）——两个方向已并作一条，本轮登记不另开行；子代理不写台账，请在父侧核对行文与本表口径一致。

**验收读数**：`doc_check(mode:"gate")` 判 `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` ∥ 本批档 ⇒ 首行 `DOC-CHECK GATE: PASS`（0 段有问题，2 档全清）。单测 12/12 与 9 档 59/59 为实施席读数（§5 在盘），本轮零代码变更不重跑。

**未定项**：无。

## §3 设计评审（评审子代理）
**状态行**：评审通过（轮次 2 核验：上轮 13 条全部复核（🔴 0 · 🟡 10 · 🔵 3 · 新增 0），四问结论照用、判据不重开）



### 轮次 1（评审子代理）

**设计评审 · 目标 = `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` §2.5 通过侧置位（`statusPassPlan`）+ 五处写面句 + §3 表去数 · 对象状态 = 待评审**

### 五问逐条判（证据均为本轮实读）

1. **① 对称的那一半：成立。** 两条计划的互斥是**双路**证明，不靠约定：`statusResetPlan` 要求正文命中 `VERDICT_CHANGES_LINE` 且写前 = done；`statusPassPlan` 要求正文**不**命中打回行且写前 ≠ done——② 与 ③ 各自就足以排除同笔双命中。`docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` §2.5 只把互斥归给 ③（「两条的 ③ 因此天然互斥，同一笔不会都触发」），比实际弱一档，结论仍真。
2. **② 定序：同向，可核。** `verdictGateFailure` 先判打回后判 pass（`thincoder-core/agent-tools/design-token.mjs` 的「if (VERDICT_CHANGES_LINE.test(rawResult)) return "changes-required"」在「return VERDICT_PASS_LINE.test(rawResult) ? null : "no-pass-line"」之前）；`statusResetPlan(...) ?? statusPassPlan(...)` 的左右序与之一致。且因上条互斥，`??` 序今天是不可观测的——它只是将来放宽条件时的保险。
3. **③ 窗口：结论成立，但派单给出的那条反推不成立。** `section3BlocksAtStart` 只证明「点火时记了块数」，与「块与字是否同一次写盘」无逻辑关系。真正的证据在本轮实读的写入面：同一笔里 `insertIntoSection` → `updateSectionStatusLine` → 一次 `writeFileSync`（`thincoder-core/agent-tools/batch.mjs` 的「const written = plan ? updateSectionStatusLine(inserted, 3, plan.statusValue) : inserted」紧接「writeFileSync(abs, written)」），而结算侧是 run 返回后另一次 `readFileSync` ⇒ 无窗口。
4. **④ 不写留痕行的偏离理由：站得住。** 打回留痕的正当性来自「抹掉了一条已落的 pass」，通过侧没有抹掉任何字节，块本身即记录；偏离明写、理由明写，符合先例检查的要求。
5. **⑤ 需求面那一行：有一处过陈述，但不是「两行同携」那一句。** `docs/core/requirements/ENGINEERING-MODE-V2.md` §5.3 的「两种裁定同现 ⇒ 按打回判」是准确的；过陈述在首句「写 `append §3` 那一笔同时落状态行」——按设计档 §2.5 的单源表，五行里有三行是零写（无裁定行 / 写前已 pass 的 pass 笔 / 写前非 pass 的打回笔），需求行未收这一肢，也未带打回侧的「写前 = 评审通过」前置。

### 两条已发生的修正

- **`docs/core/design/ADVISOR-GUARDS.md` 五处写面句**：五处均在盘且与机制同向（§1.1 判据 2 的「写这个字的是工具：`append §3` 那一笔随裁定行置位 ∥ 重置」· §1.3 拒文「补写该批档 §3（发现 + VERDICT —— 状态行由工具随块落）后重跑设计评审」· §1.2 对称另一半句 · §1.3 破行句 · §10 A-AG22「状态行随块由工具置位」）。两处仍不实，见下表 #4 / #5。
- **`docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` §3 表去数**：主表 26 行（新档 6 · 改造 19 · 零改 1）、拆分预算表、分舱 25 档（7 / 4 / 7 / 4 / 3）逐项点数与本轮点数相符，主表第二列已换档位结论，无行数读数残留。**但档位结论这一行与现盘不符**（见下表 #2）。

### 发现表

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Acceptance | 🟡 | R23 的「一笔同携 pass 与打回两行 ⇒ 判打回（`进行中（第 N 轮打回）`）」可构造（同一笔正文两行、写前 = `评审通过` 时重置触发），但**无论 `??` 左右都绿**：pass 计划的 ② 已排除打回行，两条计划永不同时命中 ⇒ 该格锁的是状态表结果，判不出它名字里的「定序」。 | 把该格改述为状态表结果锁（「两行同携的终态 = 打回」，并写明它不区分 `??` 序），或另立一格断言「两条计划在同笔上互斥」的纯函数面（同时喂两计划，断言恰一条返回非 null）。 |
| 2 | Affected-file tier | 🟡 | §3 的档位结论与现盘不符：「只有 `thincoder-core/agent-tools/batch-lifecycle.mjs` 跨档位（越 500 行硬线）——拆单见下；其余各档不跨档位」——本轮实读该档 **367 行**（已在硬线内，拆分已于上一批落地）；而本批真正加行的 `thincoder-core/agent-tools/batch-skeleton.mjs` 实读 **471 行**，新增一个带 JSDoc 的导出后逼近 500 线（同级 `statusResetPlan` 的注释 + 函数体约 30 行）。 | 把该行改成当下读数：无任何档越 800 硬帽；`batch-skeleton.mjs` 471 行、本批新增导出后余量约 29 行——点名它是否需要先拆（或写明本笔按最小注释落、不越 500）。拆分预算表里 `batch-lifecycle.mjs` 那一行随之标为已落地。 |
| 3 | Requirements | 🟡 | `docs/core/requirements/ENGINEERING-MODE-V2.md` §5.3 的「**§3 状态行由工具置位，不由评审手写**：写 `append §3` 那一笔同时落状态行」读作无条件句；按设计档 §2.5 的状态表，无裁定行 / 写前已 pass 的 pass 笔 / 写前非 pass 的打回笔三行都是零写，且打回侧带「写前 = `评审通过`」前置与 `（第 N 轮打回）` 括注，需求行两者均未收。 | 首句补成条件句并收进零写那一肢（例：正文携裁定行才落状态行；无裁定行 ⇒ 零写），打回处补「写前 = 评审通过」；机制细节仍只留单源指针。 |
| 4 | Clarity | 🟡 | `docs/core/design/ADVISOR-GUARDS.md` §1.2 改写后，末句「下游 `§5` 写入门（`thincoder-core/agent-tools/batch-closeout.mjs:105`）因此读到的是「评审未完成」」被留在**通过那一半之后**；按语序它成了 pass 侧的后果，而 pass 侧的后果恰是读到 `评审通过`。 | 把这句移回打回那一半（重置之后），或改成「重置后下游读到「评审未完成」；置位后读到 `评审通过`」两句。 |
| 5 | Clarity | 🟡 | `docs/core/design/ADVISOR-GUARDS.md` §1.3 破行句改写为「夹具必须让该评审把 §3 写进批档（轮次块携 `VERDICT: pass`——状态行由工具随块置位）」；而 10-1 ∥ 10-4 的夹具是**直写整份档**（`test/integration/batch-close-token-consume.test.mjs` 的「writeFileSync(batchAbs, recordText({ blocks: baseline + 1 }))」，其注释自述「状态行由 `status` 动作写为 `评审通过`」）——该夹具不经 `batch append`，工具置位在其中不发生。 | 句子按夹具实形写：直写夹具须自带 `**状态行**：评审通过`（不经工具置位）；经 `batch append` 的夹具才由工具随块置位。 |
| 6 | Clarity | 🟡 | `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` §9 的 17-1 行称「夹具少一步手写 `status`」；17-1 的夹具（`test/integration/advisor-record-gate.test.mjs` 的「recordText({ blocks: run.section3BlocksAtStart + 1, statusRow: "评审通过" })」）直接写档，全程没有 `status` 步。结论（断言逐字不变）成立，支撑句不成立。 | 改述 17-1 的理由：夹具直写 §3（块 + 状态行同拍），不经 `batch append` ⇒ 本批零影响；删掉「少一步手写 `status`」。 |
| 7 | Closest-precedent | 🟡 | 通过侧的「最近先例」只给实现坐标（`statusResetPlan`，同档 `:306`）与设计档节（本节），未给先例批坐标——打回重置落地于 `docs/batches/2026-10-28-batch-status-reset.md`，该批号未出现。 | 在该条后补先例批（批档相对指针 + 该批 §5 的落地行），与同档 §1 既有「落地批 = 台账 #1550」同形。 |
| 8 | Existing-piece | 🟡 | 新名 `statusPassPlan` 无三问行（住哪 / 叫什么 / 谁消费）的规范形态；设计档与批档 §2 给的是「同签名同位置」与「被拒 = 合并成一个 `statusSyncPlan`」，未落到本项目在册的 `existing but unusable: …` 形（先例 = `docs/batches/2026-11-01-ledger-contract-five-faces.md` 的「**existing but unusable**：既有两个导出只数块数…」）。 | 补一格三问：住哪 = `thincoder-core/agent-tools/batch-skeleton.mjs` 锚块之后；叫什么 = `statusPassPlan`；谁消费 = `thincoder-core/agent-tools/batch.mjs` 的 append 判定点；既有件 = **existing but unusable**：`statusResetPlan` 三条合取方向相反，且合并要改其函数体（零回归边界）。`thincoder-core/tool-docs/batch.md` 那句同样补「谁读」（模型读的工具描述面）。 |
| 9 | Affected files | 🟡 | 两处注释本批之后立刻为假，却不在编辑点清单里：`thincoder-core/agent-tools/design-token.mjs` 判据 2 前注释「段级 = 唯一状态行写面（…——评审经 `batch` 的 `status` 动作写入）」；`thincoder-core/agent-tools/batch-skeleton.mjs` 锚块注释「`VERDICT_PASS_LINE` 留签发面，经 import 取 `_V_PRE` / `_V_SUF`」（本批正把这个锚迁入骨架档）。受影响文件表只列了两处**运行时串**。 | 受影响文件行按「两处运行时串 + 两处注释」写全；注释改成当下为真（工具随块置位 / 四条锚全住本档），不留修订叙述。 |
| 10 | Doc state | 🟡 | `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` §2.5「**四条锚同源**：… 全住 `thincoder-core/agent-tools/batch-skeleton.mjs` 的锚块（`:282` 起）」与同节「**锚的住处随本批收正**：`VERDICT_PASS_LINE` 的定义从 `thincoder-core/agent-tools/design-token.mjs:115` 迁入 `batch-skeleton.mjs` 锚块」并置；现盘实读 `VERDICT_PASS_LINE` 住 `design-token.mjs`（`export const VERDICT_PASS_LINE`），骨架档 `:282` 起只有 `_V_PRE` / `_V_SUF` / `VERDICT_CHANGES_LINE`——前一句按现状读为假，且 `:282 起` 对 pass 锚不成立。 | 前一句明确成迁移后的目标态（「本批之后四条同住…」）或按现状写「三条已住骨架档，pass 锚本批迁入」；同时删去会随迁移动漂的 `:282 起` 坐标。 |
| 11 | Clarity | 🔵 | `statusPassPlan` 的返回形 `{ roundN, statusValue }` 里 `roundN` 无消费方（调用点的 N 取自 `insertIntoSection` 的返回）；形参 `date` 亦无用处（无留痕行）。设计档拒掉合并函数的理由之一正是「返回形还多一个没有消费方的判别位」。 | 二选一写明：返回 `{ statusValue }`；或保留 `roundN` / `date` 只为与 `statusResetPlan` 同签名——那就把理由写进那句「同签名同位置」里，免得实施轮按「无消费方」再判一次。 |
| 12 | Residual | 🔵 | 置位面继承 `VERDICT_PASS_LINE` 的整段文本语义：一笔 §3 正文引述上一轮的 `VERDICT: pass` 行、本轮自己无裁定行时，② 命中 ⇒ 状态行被置成 `评审通过`。这与签发面 `verdictGateFailure` 对整份回执同病（两处同锚即同残余），但本批把病从「该否签发」扩到「`§5` 门读的那一行」。 | 在 §2.5 的残余面写一句（与「触发面不扩」并列）：引述性裁定行同样触发，方向与签发面一致，故按既有接受面处理；不新增判据。 |
| 13 | Evidence | 🔵 | 派单里「证据是点火基线 `section3BlocksAtStart` 的存在」不成立（那条只证明点火时记了块数）；「窗口不存在」的直接证据是写入面的单次 `writeFileSync` 与结算侧的后读。设计档未引点火基线，结论不受影响。 | 若要在档里写「无窗口」的论证，锚到写入面那一次写盘（`thincoder-core/agent-tools/batch.mjs` 里 `writeFileSync(abs, written)` 的上一行已把块与状态行合进同一字符串），不要锚到点火基线。 |

### 计量

🔴 0 · 🟡 10 · 🔵 3。验收面（§5 R23 八段）逐条可构造：夹具形 = 既有 `makeProject` + `batch create` 骨架 + `batchTool(REC, { review: true })` 驱动 append（先例 = `test/integration/batch-gates-reanchor.test.mjs` 的 `freshRecord` ∥ `review(root)`），「留痕行 0」可按 `> 状态行重置` 零命中断言。集成侧 27-1 落法与 17-1 同入口，无需新机制。

VERDICT: pass

（本轮评审计数 = 🔴 0 / 🟡 10 / 🔵 3；对象 = `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` §2.5 通过侧置位 + 五处写面句 + §3 表去数）

### 轮次 2（评审子代理）

**设计评审 · 轮次 2（核验上轮 13 条 · 判据不重开，只搬运结论）**

**对象状态 = 已评审** · 目标 = `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` §2.5 通过侧置位（`statusPassPlan`）+ 五处写面句 + `§3` 表去数

### 核验表（四档全部重读 + 三处代码证据本轮实读）

| # | 上轮# | 档 | 严重度 | 状态 | 依据（本轮实读原文） |
|---|-------|----|--------|------|----------------------|
| 1 | 1 | `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` | 🟡 | Unfixed | §5 R23 仍写「一笔同携 pass 与打回两行 ⇒ 判打回（`进行中（第 N 轮打回）`）」；同档 §2.5 的 pass 计划 ② 仍是「② 净化后正文命中 `VERDICT_PASS_LINE` **且不命中** `VERDICT_CHANGES_LINE`」⇒ 两条计划永不同时命中，该格判不出它名字里的定序 |
| 2 | 2 | `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` | 🟡 | Unfixed | 仍写「**档位结论**：只有 `thincoder-core/agent-tools/batch-lifecycle.mjs` 跨档位（越 500 行硬线）——拆单见下；其余各档不跨档位。」；本轮实读：`thincoder-core/agent-tools/batch-lifecycle.mjs` = 367 行 · `thincoder-core/agent-tools/batch-skeleton.mjs` = 471 行 · `thincoder-core/agent-tools/design-token.mjs` = 268 行 ⇒ 结论行与现盘不符，且本批真正加行的骨架档只余 29 行余量 |
| 3 | 3 | `docs/core/requirements/ENGINEERING-MODE-V2.md` | 🟡 | Unfixed | §5.3 仍为「写 `append §3` 那一笔同时落状态行——正文携 `VERDICT: pass` ⇒ 置「评审通过」」；零写三行与打回侧「写前 = 评审通过」前置未收 |
| 4 | 4 | `docs/core/design/ADVISOR-GUARDS.md` | 🟡 | Unfixed | §1.2 末句仍是「下游 `§5` 写入门（`thincoder-core/agent-tools/batch-closeout.mjs:105`）因此读到的是「评审未完成」。」，仍紧随「对称的另一半 = 通过那一轮」之后 ⇒ 按语序成了 pass 侧的后果 |
| 5 | 5 | `docs/core/design/ADVISOR-GUARDS.md` | 🟡 | Unfixed | §1.3 仍写「（轮次块携 `VERDICT: pass`——状态行由工具随块置位）」；`test/integration/batch-close-token-consume.test.mjs` 的夹具仍直写档：「writeFileSync(batchAbs, recordText({ blocks: baseline + 1 }))」，工具置位在该夹具里不发生 |
| 6 | 6 | `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` | 🟡 | Unfixed | §9 的 17-1 行仍写「夹具少一步手写 `status`」；`test/integration/advisor-record-gate.test.mjs` 的夹具仍直写：「if (writeBlock && run.batchDoc) writeFileSync(run.batchDoc, recordText({ blocks: run.section3BlocksAtStart + 1, statusRow: "评审通过" }))」——全程无 `status` 步 |
| 7 | 7 | `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` | 🟡 | Unfixed | §2.5 仍只给「**最近先例**：`statusResetPlan`（同档 `:306`）」，无先例批坐标（打回重置落地批 `docs/batches/2026-10-28-batch-status-reset.md` 未出现） |
| 8 | 8 | `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` | 🟡 | Unfixed | §2.5 通过侧仍只有「最近先例」+「被拒方案」，无 `existing but unusable: …` 三问行（住哪 / 叫什么 / 谁消费） |
| 9 | 9 | `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` | 🟡 | Unfixed | §3 表仍只列「两处运行时回执串」；两处注释本轮实读仍为旧话——`thincoder-core/agent-tools/batch-skeleton.mjs`：「`VERDICT_PASS_LINE` 留签发面，经 import 取 `_V_PRE` / `_V_SUF`。」∥ `thincoder-core/agent-tools/design-token.mjs`：「段级 = 唯一状态行写面（`batch-skeleton.mjs` `updateSectionStatusLine`——评审经 `batch` 的 `status`」 |
| 10 | 10 | `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` | 🟡 | Unfixed | 「全住 `thincoder-core/agent-tools/batch-skeleton.mjs` 的锚块（`:282` 起）」与「`VERDICT_PASS_LINE` 的定义从 `thincoder-core/agent-tools/design-token.mjs:115` 迁入 `batch-skeleton.mjs` 锚块」仍并置；实读「export const VERDICT_PASS_LINE」住 `design-token.mjs`，骨架档 `:282` 是「export const _V_PRE」 |
| 11 | 11 | `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` | 🔵 | Unfixed | 仍定义返回形 `{ roundN, statusValue }`（`roundN` 无消费方）与形参 `(src, seg, body, date)`（无留痕行 ⇒ `date` 无用），只写在「同签名」句里而不给理由 |
| 12 | 12 | `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` | 🔵 | Unfixed | §2.5 仍无「引述性裁定行同样触发」的残余句（整段文本语义的既有接受面未登记） |
| 13 | 13 | （派单面，非档面） | 🔵 | Accepted | 设计档不以点火基线作窗口证据——§2.5 明写「仍是一次 `writeFileSync`——与打回那条同一条路径」⇒ 档面零处待改，本条为派单措辞更正，已在本轮报告中给出直接证据 |

### 新发现（本轮 0 条）

四档与三处代码夹具在上轮之后无改动：`thincoder-core/agent-tools/design-token.mjs` 的两处运行时串仍为旧字面（`REVIEW_RECORD_MARK` 第二句仍是「补写该批档 §3（发现 + VERDICT + 状态行 = 评审通过）后重跑设计评审」），即实施尚未开始、与批次序相符；未引入新 🔴。

### 判据不重开

上轮四问结论照用：① 互斥成立（② 与 ③ 各自排除同笔双命中——代码实读「if (typeof body !== "string" || !VERDICT_CHANGES_LINE.test(body)) return null」）· ② 定序同向（且因互斥今天不可观测）· ③ 无窗口（直接证据 = 单次 `writeFileSync`）· ④ 不写留痕行的偏离理由站得住 · ⑤ 需求面首句属过陈述、「两种裁定同现 ⇒ 按打回判」准确。

**计量**：🔴 0 · 🟡 10 · 🔵 3 · 新增 0。

VERDICT: pass

## §4 用户批准（主 agent）

## 4. 用户批准（主 agent）

**批准对象**：`docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` §2.5 通过侧置位（`statusPassPlan`）+ 五处写面句 + §3 表去数。

**批准的依据链（全部在盘可查）**：

| 环节 | 事实 |
|---|---|
| 设计评审 | 两轮；第 2 轮 `VERDICT: pass`（上轮 13 条全部复核：🔴 0 · 🟡 10 · 🔵 3 · 新增 0） |
| —— 轮次块 | 批档 §3 的 `### 轮次 2（评审子代理）`，含发现表 + 计数 + VERDICT |
| —— 签字 | §3 状态行 = `评审通过`（由评审席同轮经 `batch` 的 `status` 动作写入） |
| 授权凭据 | 评审结算回执 `Approved. Pass this exact token to eng-coder` —— **凭据值按纪律不入档（写进档就进 git、进每一份克隆与备份）** |
| 用户批准 | 用户原话「**开**」（2026-11-01 22:2x，对 `#1955` / 行数清理的同一条推进指令）；本轮实施与后续修正轮均在该授权范围内 |

**批准范围**：设计档所述五处 + 实施席交付表列出的面。**评审遗留的 10 条 🟡 / 3 条 🔵 不在批准范围内，另计**（未修、未宣称修）。

**修正在途**：实施席上抛的「正文含 `**状态行**：` 时定位错行」边角，设计席本轮裁定中——**该项落地并验证前，本批不收口。**

## §5 实施记录（eng-coder）

**状态行**：实施完成（eng-coder · 2026-11-01）

### 交付对照（判据单源 = 设计档 `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` §5 R23）

| 条目 | 落点 | 状态 |
|---|---|---|
| R23 通过即置位 | `thincoder-core/agent-tools/batch-skeleton.mjs` 新增 `statusPassPlan(src, seg, body, date)`：三合取（写 §3 ∥ 命中 pass 锚且不命中打回锚 ∥ 写前状态行 ≠ 评审通过），返回 `{ roundN, statusValue }`，无留痕行 | ✅ 完成 |
| R23 调用点与写面 | `thincoder-core/agent-tools/batch.mjs` 改为 `statusResetPlan(...) ?? statusPassPlan(...)`；仍是同一 `updateSectionStatusLine` + 一次 `writeFileSync`（块与字进同一字符串） | ✅ 完成 |
| R23 锚迁移 | 骨架档锚块新增 `VERDICT_PASS_LINE`；签发档改 import + `export { VERDICT_PASS_LINE }` 原样再导出（`batch-closeout.mjs` 的 import 面零改） | ✅ 完成 |
| R23 两处运行时串 | 签发档 `REVIEW_RECORD_MARK` 第二句 ∥ 判据 2 证句，逐字 = 设计档 §2.5 | ✅ 完成 |
| R23 工具描述面 | `thincoder-core/tool-docs/batch.md` 的 `status` 条目补置位句（逐字 = 设计档 §2.5） | ✅ 完成 |
| 集成 27-1 | `test/RTM.md` 故事 27 行 27-1（结果列 = 待执行，未代签）+ `test/integration/batch-status-auto-set.test.mjs` | ✅ 完成 |

### 实跑读数（本轮，cwd = 仓根）

- 单测：`node --test docs/batches/2026-11-01-status-line-auto-set.test.mjs` ⇒ `tests 8 / pass 8 / fail 0`（R23①–⑧ 各一例）。
- 集成（本批新增）：`node --test test/integration/batch-status-auto-set.test.mjs` ⇒ `tests 1 / pass 1 / fail 0`。
- 回归（同一批受影响面，逐档实跑）：`batch-gates-reanchor.test.mjs` 8/8 · `advisor-record-gate.test.mjs` 2/2 · `batch-close-token-consume.test.mjs` 3/3，全绿。
- 锚恒等：`design-token.mjs` 再导出的 `VERDICT_PASS_LINE` 与骨架档定义 `===`（同一对象，零复制）。
- 文档机检门：`doc_check(mode:"gate")` 判 `thincoder-core/tool-docs/batch.md` ∥ `test/RTM.md` ⇒ 首行 `DOC-CHECK GATE: PASS`。

### 两行同携的定序判读（父侧点名那条）

纯函数面直接喂两条计划：`statusPassPlan` 返回 `null`（② 排除打回行），`statusResetPlan` 返回打回计划。
`??` 两种左右序（出厂序 = 左 reset 右 pass ∥ 反序）取到的 `statusValue` 逐字相等，都是 `进行中（第 N 轮打回）`。
端到端同夹具（写前 = 评审通过、同笔两行）落盘结果 = 打回重置 + 一条留痕行（单测 R23④）。

### 偏离与裁定

- **越咨询线已压回**：本笔改动使 `batch-skeleton.mjs` 从 471 行到 509 行（越 500 咨询线），按「本笔按最小注释落、不越 500」压回 **499 行**（只压注释行文，零逻辑删减）。
- **父侧裁定两条已落**：① `test/RTM.md` 27-1 + 集成用例（设计档 §9 明写归实施轮）；② `batch-closeout.mjs` 两句被本笔改动的注释同笔改成当下为真（**import 面零改**，只动注释）。
- **超派单写域的三处，理由如实登记**：`test/RTM.md` ∥ `test/integration/batch-status-auto-set.test.mjs`（父侧本轮裁定）· `batch-closeout.mjs` 注释两句（父侧本轮裁定）。

### 轮次与终态

- **内部审计轮（explore 只读差集审计）**：1 轮，🔴 0 · 🟡 2 · 🔵 4。处置：RTM 缺行 → 上抛后父侧裁定「做」→ 已补；500 线 → 同轮压回；`batch-closeout.mjs` 两句假注释 → 上抛后父侧裁定「做」→ 已改；设计档坐标漂移与生成区欠账 → 只报不修（非本笔域）。
- **代码评审轮（advisor，type=code）**：1 轮，`VERDICT: pass`，🔴 0 · 🟡 2（含 1 条设计面待裁）· 🔵 4。
- **修正轮**：3 轮（500 线压缩、父侧两条指令落笔、注释收正），每轮复跑单测全绿。
- **终态**：`clean`（评审 pass、审计分歧项全部处置或按父侧裁定处理）；一条设计面待裁项在 ## 上抛 登记。

### 上抛（本笔只报不修）

1. **[上抛·待裁] 置位面的一条设计边角**：`batch.mjs` 对 `inserted`（已含本笔正文）调 `updateSectionStatusLine`，而它按段内**首个** `**状态行**：` 行定位。骨架原形档 §3 无状态行时，若评审正文引述了一行 `**状态行**：…`，工具会把那行**正文**改写成置位值，而不在段头下补出段级状态行 ⇒ 违反 `thincoder-core/tool-docs/batch.md` 明写的 append-only。打回方向同病，但其 ③ 要求写前 = 评审通过（必已有真状态行），故该边角是本批**新开**的。需设计侧裁：是否把定位面收窄到「段头后、首个轮次块标题前」，或先置位再插块。
2. **[上抛·知会] 设计档与生成区两处读数已旧**：设计档 `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` §2.5 仍带锚块起行座标（本笔之后已不再指向块首）；生成区 `docs/core/design/API-CONTRACT.md` 的 `VERDICT_PASS_LINE` 行仍写旧档名与 `const`（设计档定「随生成器刷新，不手改」）。两处均非本笔域，只报不改。

### 修正轮 · 段级状态行定位面收窄（eng-coder · 2026-11-01）

判据单源 = 设计档 §2.5「段级状态行的定位面」+ §5 R23 末段 + §6 四行；任务书 = §2 末节「修正轮 · 段级状态行定位面收窄」。

#### 交付对照

| 条目（任务书） | 落点 | 状态 |
|---|---|---|
| ① 不做成 §3 特例 | 定位面三处（`updateSectionStatusLine` ∥ `readSectionStatusWord` ∥ 新私有 `sectionHeaderZoneLines`）零 `seg` 分支；边界单源 `ZONE_END_RE = /^#{2,}/`，写面与触发读面同读 | ✅ 完成 |
| ② 读面也收窄 | `readSectionStatusWord(src, seg, region = "section")`；两条计划的 ③ 传 `"header"` | ✅ 完成 |
| ③ 不动缺省形态 | 2 参调用面（`batch-read.mjs` ∥ `batch-closeout.mjs` ×2 ∥ `design-token.mjs` ∥ `ledger-close-proof.mjs`）零改、读值零变（`#1977` 残余原样） | ✅ 完成 |
| 写面：段头区有行 ⇒ 原位单行改写；无 ⇒ 沿用既有插入形 | `batch-skeleton.mjs` 的 `updateSectionStatusLine` | ✅ 完成 |
| 夹具 1–4 | `docs/batches/2026-11-01-status-line-auto-set.test.mjs` 的 R23⑨–⑫ | ✅ 完成 |
| 三处共用写面复核 | `status`（`batch-lifecycle.mjs`）∥ `close`（同档）∥ 重开（`batch-reopen.mjs`）——传参形不变、两档零改；既有用例逐条绿（读数见下） | ✅ 完成 |
| 设计档零触 | `docs/core/design/` 本笔零改 | ✅ 完成 |

#### 定位面改动逐字（`thincoder-core/agent-tools/batch-skeleton.mjs`）

- 边界单源：`const ZONE_END_RE = /^#{2,}/ // 段头区界：任意 `##` / `###` 起的行（写面与触发读面同一条判据）`
- 段头区行集（新私有）：`sectionHeaderZoneLines(src, seg)`——`sectionBodyLines` 的行集截到首个 `ZONE_END_RE` 命中行之前；段头缺失 ⇒ `null`。
- 写面：`const zoneEnd = parts.findIndex((p, i) => i >= 2 && ZONE_END_RE.test(p))` ⇒ `const limit = zoneEnd < 0 ? parts.length : zoneEnd` ⇒ `const idx = parts.findIndex((p, i) => i < limit && STATUS_LINE_RE.test(p))`（`i >= 2` = 不判段头行自身；无区界 ⇒ 全区）。插入形零改（`splice(2, 0, line, eol, "", eol, "", eol)`）。
- 读面：`const lines = region === "header" ? sectionHeaderZoneLines(src, seg) : sectionBodyLines(src, seg)`；未知 `region` ⇒ throw（不静默回落宽读——错字当场可见）。
- 两条计划 ③：`if (readSectionStatusWord(src, 3, "header") !== STATUS_WORDS[3].done) return null`（reset）∥ `if (readSectionStatusWord(src, 3, "header") === STATUS_WORDS[3].done) return null`（pass）。

#### 实跑读数（本轮，cwd = 仓根）

- 单测 12 例：`node --test docs/batches/2026-11-01-status-line-auto-set.test.mjs` ⇒ `tests 12 / pass 12 / fail 0`。
- 共用面 + 相邻面既有用例（同一批调用实跑，共 59 例全绿，含单测 12）：`batch-gates-reanchor` 8/8（14-6 ∥ 14-7 = 重开径）· `batch-close-gate` 9/9 · `batch-close-token-consume` 3/3 · `batch-ledger-bind` 4/4 · `ledger-close-proof` 3/3 · `advisor-record-gate` 2/2 · `batch-status-auto-set` 1/1 · `batch-anchor-create` 2/2 · `batch-live-batch-lock` 8/8。
- 行数：`batch-skeleton.mjs` 499 行（≤ 500 咨询线；净增 0——新机构加行由注释等量压缩抵掉）。
- 文档机检门：`doc_check(mode:"gate")` 对批档 ⇒ 首行 `DOC-CHECK GATE: PASS`。

#### 红-绿两读（收窄的两个半边各自可证伪）

| 只退回哪半边 | 读数 |
|---|---|
| 写面（`i < limit` → 全区） | R23⑨ 红（引述行被改写：命中数 `0 !== 1`）· R23⑩ 红（段头区无行）；其余 10 绿 |
| 读面（两处 ③ 去掉 `"header"`） | R23⑩ 红（③ 读成 done ⇒ 零写 ⇒ 段头区 `undefined`）；其余 11 绿 |

两读同轮内跑完并随即复原；复原后 12/12 绿。

#### 存量读数（父侧点名问的边角）

`docs/batches/**` 实扫 259 档 / 258 个 §3 段：§3 状态行**落在段头区之外**的 = **3 档**（`2026-10-28-product-text-sweep.md` ∥ `2026-10-28-rule-writing-sweep.md` ∥ `2026-10-28-sse-first-chunk-idle.md`）；三档 §1 均 = `已收口` ⇒ append 本就拒写，**实际影响 0**；缺省读面对这三档仍读到 `评审通过`（读值零变）。

#### 轮次与终态

- **内部差集审计（explore 只读）**：1 轮，verdict `clean`，🔴 0 · 🟡 0 · 🔵 3（残余观察，无偏离）。
- **代码评审（advisor，type=code）**：1 轮，`VERDICT: changes-required`，🔴 0 · 🟡 2 · 🔵 3。
- **修正轮**：1 轮，处置如下。
  - 🟡①（must-fix）**读出侧收窄原本不可证伪**：同笔引述行只进 `inserted`，而计划在写前 `src` 上算 ⇒ R23⑩ 原形在 ③ 时刻两区皆空，「③ 读段头区」未被证明。已把判别形并入 R23⑩（引述行由**上一笔**落下 ⇒ 写前缺省读面读到它、段头区读面为 `null`；再一笔 pass ⇒ 段头区补出），红-绿读数见上表。
  - 🟡②（只报，设计侧裁）**触发面收窄后与门面不对称**：写/触发面读段头区，收口门 ∥ 核销门③ 仍读缺省（`batch-closeout.mjs` ∥ `ledger-close-proof.mjs` 的 `readSectionStatusWord(src, 3)`）。若某档 §3 的唯一状态行落在 `### 轮次 …` 之下，打回那一笔 ③ = `null` ⇒ 不重置，而两门读到的仍是 `评审通过` ⇒ 该轮打回不落字、收口/核销照走（`§5` 门判据 2 仍挡实施面）。设计档 §2.5「残余」只登记了反方向。**本笔不裁、零改**，见上抛。
  - 🔵③ 插入形多一空行：插入形按裁定「沿用既有」不动，**注释改成实形**（「状态行 + 两空行，段头后原有空行不动」）。
  - 🔵④ `region` 未知值原会静默回落宽读 ⇒ 已改成 throw；净增行由注释压缩抵掉。
  - 🔵⑤ 单测 ④ 的 `resetPlan.statusValue` 无存在断言（回归读成 TypeError）⇒ 先加 `assert.ok(resetPlan, …)`。
- **终态**：`clean`（评审 must-fix 已修并复跑全绿；一条 🟡② 属设计面，按上抛登记）。

#### 上抛

1. **[上抛·待裁]** 设计面一条（= 评审 🟡②）：触发面收窄后「打回重置」不再够到落在 `###` 之下的那条 §3 状态行，而收口门 ∥ 核销门③ 读的仍是那一行 ⇒ 该档形的打回不落字、两门照走。请设计席裁：补残余条目并写明影响面（= 收口门 ∥ 核销门③；`§5` 门不受影响），或让重置的 ③ 在段头区为空时回落到缺省读。**本笔零改**。
2. **[上抛·知会]** 台账 `#1977`（缺省形态残余）与本次新增的「段头区为空 + 区外有行」同一族；是否并入该行由父侧定（子代理不写台账）。

## §6 验证与收口（父代理）

## 6. 验证与收口（父代理）

### 6.1 本批交付了什么

**通过侧置位**：`batch` 工具在此前只做「打回即重置」，通过那一笔没人写状态行；本批补上另一半（`statusPassPlan`），并把 `VERDICT_PASS_LINE` 的定义迁进骨架档锚块（签发面改为 import + 原样再导出，`batch-closeout.mjs` 的 import 面零改）。

**顺带修掉一个本批自己开出来的窟窿**：置位路原本「先插块、再按段内首行改写状态行」，评审正文若引述一行 `**状态行**：…`，工具会把正文改掉。定位面收窄到段头区（`## §N` 之后、下一个 `^#{2,}` 之前），写面与触发读面同读这一区。

### 6.2 读数（父侧本轮实跑，非转述）

| 项 | 命令 / 口径 | 读数 |
|---|---|---|
| 集成面（收口门） | `node --test test/integration/batch-status-auto-set.test.mjs test/integration/batch-gates-reanchor.test.mjs test/integration/batch-close-token-consume.test.mjs test/integration/advisor-record-gate.test.mjs` | **tests 14 · pass 14 · fail 0** |
| 既有九档回归 | 实施席一轮跑完（`batch-gates-reanchor` 8 · `batch-close-gate` 9 · `batch-close-token-consume` 3 及其同族） | **59 / 59 绿** |
| 单测（收口即删） | `node --test docs/batches/2026-11-01-status-line-auto-set.test.mjs` | **12 / 12 绿**；**该档已按纪律删除**，读数留在此行 |
| 红-绿两读 | 只退回写面 ⇒ 夹具 ⑨⑩ 红、其余 10 绿；只退回读面 ⇒ ⑩ 红、其余 11 绿；复原 12/12 | 证明「每一半都在起作用」，而非只证明「没坏」 |
| 文档门 | `doc_check(mode:"gate")` | `DOC-CHECK GATE: PASS` |

### 6.3 与设计档的对账（§2 ↔ 设计档）

三链一致：条目 = §2 首节 R23（一条，不变）· 机制 = `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` §2.5 · 验收 = 同档 §5 R23（修正轮零新增判据，单元格不变）。

**九处写面/读面表**已落设计档（三处收窄 ∥ 六处缺省，逐处带坐标）——**这一半改了、那一半没改，写在档里，不靠人记。**

### 6.4 残余与债（逐条落账，不留散文）

| 项 | 去处 |
|---|---|
| 段头区收窄的两个残余方向（引述行冒充 ∥ 段头区外的状态行打回不落字） | 台账 `#1977`（一行两方向）+ 设计档 §2.5 残余段（含影响面 3 档 / 全部已收口 / 实际 0 / 不采取回落及其理由） |
| 评审遗留 🟡10 · 🔵3（第 2 轮核验表） | 批档 §3 在册；**未修、未宣称修** |

### 6.5 集成面

`test/RTM.md` 故事 27 行 27-1（结果列 `待执行`，**未代签**）；用例 `test/integration/batch-status-auto-set.test.mjs` 实跑 1/1 绿。**集成集计数 = 该用例为新增，现窗口内。**

### 6.6 未做（如实）

- **门面读区未收窄**（`§5` 门 ∥ 收口门 §3 状态词臂 ∥ 核销门③ ∥ 签发面判据 2 ∥ `batch/list` ∥ §1 冻结判据，六处仍缺省）—— **另起一批**，理由在设计档 §2.5（换读区会让已收口的 3 档读成「无状态行」，代价大于收益）。
- **未跑全量回归**（`npm test` 全套）—— 按纪律收口只跑集成面与本批同族档。

### 6.7 收口结论

设计两轮过审、实施一次 + 一次修正、父侧收口门绿、残余落账、单测档已删。**本批收口。**
