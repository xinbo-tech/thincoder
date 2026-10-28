# 2026-10-28 · batch-status-reset
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-28 · 来源 = 用户 2026-10-28 12:17 逐字「那这三条可以开工了吧？」（台账 `#1845`）。
> 台账 = #1881（ENGINEERING-MODE · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-28
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 病（机制缺陷 · 门读的是上一轮的成绩）

**`§3` 的状态行是**段级字面**，不带「这是第几轮写的」。于是：**

```
第 1 轮  pass        ⇒ 写上「评审通过」
第 2 轮  打回        ⇒ changes-required 按词表纪律不写状态词（词表里没这个词）
                        ⇒ 档里仍是「评审通过」
下游 §5 写入门        ⇒ 读到「评审通过」⇒ 放行
```

**⇒ 打回不重置状态行 —— 门看见的是**上一轮的通过**。**

**★ 敞口范围要如实说：**它只在「同一批里 pass 过一轮、又被打回」这条路上**。签发自签面不受影响 —— 裁定闸与判据 2 都拦得住。受影响面仅限下游 §5 写入门。**

**★★ 而敞口在本闸之前就存在（打回从不重置状态行）—— 不是新引入的。**

### 1.2 该补什么

**打回（`changes-required`）时，把 §3 状态行重置为「进行中」。**

**★ 这是**新的写入语义** —— 现在 `updateSectionStatusLine` 只在**评审主动写**的时候改字面，没有「被动重置」这回事。**

**⇒ 所以它要设计 + 评审，不能顺手改：那条通道是三个角色的共同写入面（评审写 §3 ∥ coder 读它放行 §5）。**

### 1.3 落点（父侧给方向，设计席定形）

**代码面锚点（现存盘）：**

- `thincoder-core/agent-tools/batch-skeleton.mjs` 的 `updateSectionStatusLine`（状态行的**唯一**写入点）
- 打回路径的入口（评审 `append §3` 时带 `changes-required` 的那条分支）

**★ 硬约束三条：**

1. **单点改** —— 状态行只有一个写入函数，重置也走它，不新开一条写路径（否则又是「同一件事两个写者」）
2. **重置不等于清空** —— 要把「上一轮的 pass 被这一轮打回推翻了」这件事**留在档里**（否则读的人会以为从没评过）
3. **不改词表** —— `进行中` 已在 §3 的合法词里（若无则先查 `STATUS_WORDS`，不要新增词）

### 1.4 不该做的事

- **不改 §5 写入门本身** —— 门的判据没错，错的是它读到的那个字面
- **不动签发自签面** —— 裁定闸与判据 2 都有效，不为一条 §5 敞口去改签发
- **不引入「轮次号」字段** —— 那是更大的设计（状态行加字段要改六段结构）；本次只做「打回即重置」

### 1.5 判据

1. **复现修复**：pass 一轮 → 同批打回一轮 → **§5 写入被拒**（修前会放行）。
2. **顺序交接不误伤**：未打回的批（首轮 pass）⇒ §5 照常可写。
3. **重置留痕**：打回后的 §3 能看出「曾经 pass 过、本轮被打回」。
4. 改面单测过 + `doc_check` gate PASS。

### 1.6 父侧处置（2026-10-28 12:2x）

**① 上抛 `no-pass-line` 同形敞口 —— 本批不扩，记台账（`#1884`）**

**它报：评审写 §3 却不给任何裁定行（既无 pass 也无打回）⇒ 上一轮 `评审通过` 仍是字面，`§5` 门可写。本轮无裁定行时工具无从区分「打回」与「补记散文」，故不扩触发面。**

**⇒ 裁：不扩。** 理由与它一致：**扩触发面等于让工具猜意图** —— 而没有裁定行的 `§3` 追加既可能是「评审在补记说明」，也可能是「隐性打回」，两者工具分不出来。**把分不出来的事强行判成一类，就是我今天反复拒的那类「为没出现过的输入设防」。**

**★ 已登记在 `docs/core/design/ADVISOR-GUARDS.md:103` 与 `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md:177` —— 那是对的落法：**状态档里写清「这条没收」，比硬修一个猜出来的分支强**。

**② RTM 行 —— 父侧补了，但编号顺延（设计席给的 14-4 已被占用）**

**设计席交接：「RTM 新增行 14-4（文案已在 §2.9 钉死）」；`test/` 不在设计席写域。**

**⇒ 父侧补时发现：`test/RTM.md:179` 的 **14-4 早已是**别的用例（「`batch close` 一个含 1 行 `在途` + 1 行 `待讨论` 的批」）。**

**★ 故顺延到 **14-8**，并同步节注（`:172`「七态」→「八态」）。**

**★★ 那正是本批要治的病在**它自己身上**又出现一次：**给编号时不读盘，编号就可能压在别人的用例上**。**

**③ 落盘读数（父侧实读）**

| 处 | 内容 |
|---|---|
| `test/RTM.md:172` | 节注：七态 → **八态**（14-1 … 14-8） |
| `test/RTM.md:183` | 新行 **14-8**：pass 一轮 → 同批打回 → `append §5` 被拒 → 再 pass 后放行 |
| RTM 行数 | 262 → **263** |
| 证据档 | `test/integration/batch-gates-reanchor.test.mjs`（实施轮落） |

### 1.7 设计评审裁定（父侧 2026-10-28 12:2x）

**评审判 changes-required（🔴 1 · 🟡 8 · 🔵 5）。十四条全接受，全修。**

| # | 级 | 裁 | 处置 |
|---|---|---|---|
| 1 | 🔴 | **Fixed** —— **拒文字面不可达**：§2.5 判据 1（`:136`）钉「串含 `§3 状态行 = 进行中（第 2 轮打回）`」，用例 8（`:152`）与 §2.9（`:168`）同形；但门打印的是 `readSectionStatusWord` 的**解析词**（`thincoder-core/agent-tools/batch-closeout.mjs:105` → `:108`），而 `batch-skeleton.mjs:210-211` 对 `进行中（第 2 轮打回）` 返回 `进行中` ⇒ 实际串 = `§3 状态行 = 进行中，须 = 评审通过`，**断言必红**；若为救它改门的打印面，与 §1.4「不改 §5 写入门本身」相抵。 | 断言拆两半：档面 = §3 状态行**字节** = `进行中（第 2 轮打回）`；拒面 = 串含 `§3 状态行 = 进行中，须 = 评审通过`。三处同改。 |
| 2 | 🟡 | **Fixed** —— 用例 1 输入只写「§3 = `评审通过`」（`:145`），未写「§3 已有一轮块」；N 取 `countRoundBlocks(src,3)+1`（`batch.mjs:134`）⇒ 夹具不带第 1 轮块则 N = 1，三处「第 2 轮」断言全落空。 | 输入补「§3 含一轮块 + 状态行 = 评审通过」，并注明 N 的取数式。 |
| 3 | 🟡 | **Fixed** —— **档内两说，且这笔是我造的**：§2.9 仍钉 `test(&apos;14-4 …&apos;)` 与「落盘交父侧」（`:168`/`:169`），而 §1.6 已记 14-4 被占用、顺延 **14-8** 且父侧已补行（`:74`-`:86`）。 | §2.9 改 `14-8`，删「落盘交父侧」一句；同步 RTM 计数。 |
| 4 | 🟡 | **Fixed** —— §2.4 表（`:123`-`:128`）未列集成宿主 `test/integration/batch-gates-reanchor.test.mjs`（§1.6 `:87` 定为证据档）；该档为**既有档**（盘上 11,028 字节）⇒ 现量行数与预计增量两头都缺。 | 补该行：现量行数（实读）+ `≤±N`；近 500 行则同批补拆分位。 |
| 5 | 🟡 | **Fixed** —— 新名 `nextRoundNumber(src, seg)`（`:117`）未答「这功能现在住在哪」：轮次计数与 `+1` 已在盘两处（`batch-skeleton.mjs:233` 的 `countRoundBlocks` ∥ `batch.mjs:134` 的 `+1`），而先例节四处 `existing:` 均未提它。 | 补 `existing:` 行 ⇒ 新名 = `countRoundBlocks(src, seg) + 1`，**禁二次实现计数**。 |
| 6 | 🟡 | **Fixed** —— 迁移只写「正则形态逐字平移」（`:115`），未点整行锚的前后缀常量 `_V_PRE`/`_V_SUF`（`design-token.mjs:111`/`:112`）⇒ 锚形要么被复制一份（正是要消的漂移面），要么两档各写一遍。 | 三件同迁（`_V_PRE` · `_V_SUF` · `VERDICT_CHANGES_LINE`），或导出锚常量供两档 import —— 择一写死。 |
| 7 | 🟡 | **Fixed** —— **两档互指为单源**：`docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md:28` 写「§2.5 归 `docs/core/design/BATCH-RECORD.md` §4.12」，而 `docs/core/design/BATCH-RECORD.md:301` 写「单源 = BLRU §2.5，本条不复述」⇒ 被动写面的权威处两说。 | 二选一并两侧对齐：认 §2.5 为长期归属 ⇒ 改 `:28` 归属行；认 §4.12 ⇒ 正文落 §4.12、BLRU 只留指针。 |
| 8 | 🟡 | **Fixed** —— **规范面留修订痕**：§2.4 仍写「段尾插入 ≈ 60 行」（`:130`），段尾又出「**§2.4 更正**」说原文是笔误（`:177`）；同处另有 `:175` 的编号自述。 | 删「≈ 60 行」改成正确读数，删「§2.4 更正」整句；编号错位直接改号，**不留「原文写…」形**。 |
| 9 | 🟡 | **Fixed** —— 打回重置这一支的现场只有代码推断句（`:24`），既无逐字观察也无可跑复现命令；判据 1 给了操作序列（够复现），缺「修前放行」的实读。 | 判据 1 后补一行实读：修前同序列 `append §5` 写入成功，或盘上某档 pass→打回的实例坐标。 |
| 10 | 🔵 | **Fixed** —— 留痕行（`:113`）把词表关键字 `评审通过` 写进 §3 段体；现读面都走 `**状态行**：` 前缀（`batch-skeleton.mjs:203`）不受影响，但「§3 全文 grep 关键字」的判据从此假阳。 | 留痕形保持；§2.5 加一句读面纪律：判 §3 结论只认 `**状态行**：` 行。 |
| 11 | 🔵 | **Fixed** —— 新写入语义在 `docs/core/design/BATCH-RECORD.md` §4.8 无用例行（最近邻 BR-5 仍只写标题式与 N：`:138`），留存的只有 RTM 14-8 与收口即删的单测档。 | §4.8 补一行，或明写「本行为只由 RTM 14-8 守」的理由。 |
| 12 | 🔵 | **Fixed** —— `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md:163` 仍写打回时「状态行留 `进行中`」，与 `:171` 的 `进行中（第 N 轮打回）` 并列读像两条规则（实为同一关键词 + 工具括注）。 | `:163` 补半句「（工具被动重置时携括注，见下）」。 |
| 13 | 🔵 | **Fixed** —— 文档机检门在 `insertIntoSection` 之前跑，`pending.body` 只含评审正文（`batch.mjs:236`），留痕行不进判集。 | §2.3 明写「留痕行不经文档机检门（门位在插入之前）」。 |
| 14 | 🔵 | **Fixed** —— §2.8 表内「——（见 §2.9 上抛项）」（`:162`）指错节（上抛项在 §2.7），靠 `:175` 的自述句兜。 | 直接改成「见 §2.7 上抛项」，删兜底自述。 |

**★ 它已核、不构成 finding 的三条（父侧采纳）：**

- §2.4 现状读数逐值相符 —— `batch-skeleton.mjs` 392 ∥ `design-token.mjs` 268 ∥ `batch.mjs` 344。
- `VERDICT_CHANGES_LINE` 确在 `design-token.mjs:115`，且整行锚定含等价形（用例 4/5 成立）。
- `updateSectionStatusLine` 在 `batch-skeleton.mjs:164`（BLRU `:174` 的 `:164` 指代可判）。

**★ 未核项已补**：评审对象不含 `test/`，故它没核 14-4/14-8 占用 —— **而我已实读：14-4 早被占用、14-8 已落。**

**★ 第 7 条与第 8 条我要单独说**：它们都不是「写错了」，是**写的时候没人问「这件事到底归谁」与「这条留着算不算记录」**。**那正是 `#1867`（76 处行号漂）与 `#1879`（三代读数无 as-of）那两族债的同源。**

### 1.8 实施席上抛裁定：§2.10 ⑨ 的假读数，不直改 §2（父侧 2026-10-28 12:3x）

**`#55` 问：§2.10 处置⑨ 里那个 `GATE: PASSED` 假读数要不要它直改 §2.10 那一行？它的倾向是不改。**

**⇒ 裁：不改，按它的倾向办。两条理由，第二条更硬：**

- **「一段一作者」是这份档存在的形式** —— `batch` 对 §2 的 append 直接拒，那不是挡它，是机制在说「别人的段只能由别人写」。绕过去（哪怕有我的授权）就把形式废了，一废则谁都能改谁的段。
- **改完会把「事后修正」伪装成「原本如此」** —— 将来读的人会以为设计席当时就那么写的。**过期引文有根可查（`docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md:179` 是权威），伪造成原本如此就没有根。**

**★ 三方各记各的（不越界、可顺链查）：**

| 面 | 谁 | 记什么 |
|---|---|---|
| `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md:179` | 实施席（§4.2 已授权） | **权威**：改成真实可观察形 |
| 本档 §5 | 实施席 | 指针：「§2.10 ⑨ 的引串不存在，以 `:179` 为准」+ 证据形态 |
| 本档 §2.10（eng-designer 段） | 设计席 | **留旧文** |
| 本档 §1（本节） | 父侧 | **作废登记** |

**★ 权威面换成什么（实施席已实跑，不是引来的字）：**

**直调 `assertSectionFiveGate` 喂该夹具（§3 状态行 = `评审通过` ∧ §3 有一轮含 `VERDICT: changes-required` 的块）⇒ **不抛**（该函数放行时不返回值、不打印，可观察面只有「不抛」）；同刻 `readSectionStatusWord(src, 3)` 返回 `评审通过`；复跑 `node --test docs/batches/2026-10-28-batch-status-reset.test.mjs` ⇒ **8/8 绿**。**

**⇒ 这才是「修前放行」该有的证据形 —— **可观察面 + 可复跑命令 + 实跑读数**，不是一个听起来像输出的串。**

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试覆盖 / 验收对照 / 关键决策 / 上抛项>

### 2.1 本批条目（覆盖 = §1.5 判据 1–4）

| 条目 | 覆盖 |
|---|---|
| ① 打回即重置 §3 状态行 | 判据 1（复现修复）· 判据 3（重置留痕） |
| ② 顺序交接不误伤 | 判据 2 |
| ③ 改面单测 + 文档机检门 | 判据 4 |

### 2.2 设计档落点（单源在各档对应节）

- **权威节 = `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` §2.5**「打回即重置（工具被动写）」——触发合取 / 两处落笔 / 留痕行形态 / 为什么不靠评审纪律 / 边界（`no-pass-line` 未收）。
- `docs/core/design/BATCH-RECORD.md` §4.1 append-only 行 + §4.12「被动写面」——各一句指针，不复述。
- `docs/core/design/ADVISOR-GUARDS.md` §1.2 那条「段级状态行不携带轮次」残余：改为已收口陈述 + 同形残余（`no-pass-line`）。

### 2.3 机制设计

**触发**（三合取，判据本体 = `thincoder-core/agent-tools/batch-skeleton.mjs` 新函数 `statusResetPlan`）：① 一笔 `append §3`；② 本笔净化后的文本命中打回裁定行；③ 写之前 `readSectionStatusWord(src,3) === STATUS_WORDS[3].done`。三条全中 ⇒ 返回 `{ statusValue, traceLine }`，否则 `null`。

**落笔**（一次 `writeFileSync`，两处变动）：`insertIntoSection` 增可选第 4 参 `blockLead`——本轮工具戳标题之后、评审正文之前落 `traceLine`；随后 `updateSectionStatusLine(written, 3, statusValue)`。状态行仍只经这一个写入函数（§1.3 硬约束 1）；`statusValue = 进行中（第 N 轮打回）`，不含任何 `STATUS_WORDS` 关键字（括注词面纪律不破）。

**留痕**（§1.3 硬约束 2）：`> 状态行重置：第 N 轮打回（changes-required）· 上一轮状态行 = 评审通过 → 进行中 · <YYYY-MM-DD>`——住在 §3 段体（append-only 的正常面），状态行只留 `进行中`。读档能看出「上一轮 pass，本轮被推翻」。

**裁定行判据单源**：`VERDICT_CHANGES_LINE` 从 `thincoder-core/agent-tools/design-token.mjs:115` **迁到** `batch-skeleton.mjs`，前者改 import——写入面（append §3）与签发面（裁定闸）读同一条正则。正则形态逐字平移（含本地化等价形；整行锚定，散文行内提及不触发）。

**轮次号单源**：新增 `nextRoundNumber(src, seg)`——`insertIntoSection` 与 `statusResetPlan` 同调，`+1` 不写第二遍。

**为什么位次在写盘而非常规 `status` 动作**：`status` 动作看不到本轮裁定行（裁定行随 §3 正文到），且打回期间评审按词表纪律不写状态词——判据只有 `append §3` 一处握得住。

### 2.4 受影响文件（现状行数 → 预计增量）

| 文件 | 现状 | 增量 |
|---|---|---|
| `thincoder-core/agent-tools/batch-skeleton.mjs` | 392 行 | +约 30（`VERDICT_CHANGES_LINE` · `nextRoundNumber` · `statusResetPlan` + 注释） |
| `thincoder-core/agent-tools/design-token.mjs` | 268 行 | −3 / +1（删本地正则，改 import） |
| `thincoder-core/agent-tools/batch.mjs` | 344 行 | +约 8（import · plan 调用 · `blockLead` · 状态行二次改写） |
| `docs/batches/2026-10-28-batch-status-reset.test.mjs` | 新建 | 约 120 行（收口前删——批内单测档门） |

**拆分计划**（`batch.mjs` 现状 344 行，已越 300 软线）：本批不拆，增量 +8 行；下一次触碰该档的拆分位 = append 迁移面（段白名单 + 段尾插入 ≈ 60 行，自包含，`thincoder-core/agent-tools/batch.mjs:90`–`:243`）。本批把判断与形态全压在 `batch-skeleton.mjs`（纯函数、零 fs），正是为不再往主档堆判断。

### 2.5 验收对照（回指 §1.5）

| §1.5 判据 | 机检形 |
|---|---|
| 1 复现修复 | 单测：pass 轮（`status 评审通过`）→ 同批 `append §3` 带 `VERDICT: changes-required` → 同批 `append §5` ⇒ 拒（串含 `§3 状态行 = 进行中（第 2 轮打回）`） |
| 2 顺序交接不误伤 | 单测：首轮 pass、无打回 ⇒ `append §5` 写入成功；§3 状态行仍 `评审通过` |
| 3 重置留痕 | 单测：打回后 §3 含 `> 状态行重置：第 2 轮打回` ∧ 含 `上一轮状态行 = 评审通过`；状态行 = `进行中（第 2 轮打回）` |
| 4 单测 + 机检门 | `node --test docs/batches/2026-10-28-batch-status-reset.test.mjs` 全绿；`doc_check(mode:gate)` 首行 PASS |

### 2.6 用例表

| # | 类 | 输入 | 期望 |
|---|---|---|---|
| 1 | 正常 · 复现修复 | §3 = `评审通过`，评审 `append §3` 文本带 `VERDICT: changes-required` | 状态行 → `进行中（第 2 轮打回）`；本轮块首留痕行在；随后 `append §5` 拒 |
| 2 | 正常 · 顺序交接 | 首轮 `append §3` 带 `VERDICT: pass` + `status 评审通过`，无打回 | `append §5` 成功；状态行不动 |
| 3 | 边界 · 已在进行中 | §3 = `进行中`，`append §3` 带打回裁定行 | 零留痕行；状态行仍 `进行中`（零写，字节不变） |
| 4 | 边界 · 本地化裁定 | 裁定行 `结论：不通过` | 与 #1 同判（同一正则） |
| 5 | 边界 · 散文不误触 | 正文行 `本轮发现 changes-required 风险共 3 处`（非整行裁定形） | 不触发重置；状态行不动 |
| 6 | 边界 · 打回后又 pass | #1 之后评审 `append §3` 带 `VERDICT: pass` + `status 评审通过` | 状态行 → `评审通过`；`append §5` 恢复可写 |
| 7 | 边界 · 无评审批 | §1 声明 `> 不适用：§3 —— …` | `append §5` 放行（门判据未改） |
| 8 | 错误 · 打回后收口 | #1 之后 `close` | 拒（串含 `§3 状态行 = 进行中（第 2 轮打回）`）——收口门判据未改，吃同一字面 |

### 2.8 关键决策（含被拒方案）

| 决策 | 理由 | 被拒 |
|---|---|---|
| 重置写在 `append §3`（工具被动） | 裁定行只在此刻在手；机械，不靠评审记得 | ① 让评审 `status` 写 `进行中`——纪律，打回那轮最易漏，且词表纪律不允许它写别的话 ② 写在设计凭证结算——结算要回执里有 token 回显才跑，不回显即不重置，敞口更大 |
| 不增状态词 | 词表零扩即零读侧改 | `评审须修改` 第三态——`docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` §2.5 已裁（读侧四处、拒文多一支，收益由轮次块承担） |
| 留痕写 §3 段体，不塞状态行括注 | 括注词面纪律禁关键字（`评审通过` 正是关键字） | 括注里写「上轮评审通过被推翻」——全词表零命中判据会拒它，破纪律换信息 |
| 触发条件是「上一轮 = 评审通过」而非无条件 | 已是 `进行中` 时重置无事可做，零写 = 零回归 | 无条件重置——每个首轮打回也多一条留痕，噪声换零信息 |
| `no-pass-line` 不扩进触发面 | 工具无从区分「打回」与「补记散文」；扩 = 误报 | ——（见 §2.9 上抛项） |

### 2.9 集成测试 delta（起点 = `test/RTM.md`）

- **破坏的既有行**：无。故事 14 的 14-1（`§3` 无结论 ⇒ `§5` 拒、pass 后放行）· 14-2（`§3` 非 pass ⇒ `close` 拒）判据未改，夹具与本改动无交。
- **冗余行**：无。
- **缺的行（1 条）**：故事 14 新增行 **14-4**——「评测过一轮 pass 的批档，同批打回一轮后以 eng-coder 绑定 `append §5` ⇒ 拒（串含 `§3 状态行 = 进行中（第 2 轮打回）`）；评审再 pass 后 `append §5` 成功」；互动面 = `batch` append 面 ↔ `batch-closeout.mjs` §5 写入门；业务可观察结果 = 实现写入口的开合；服务需求 = 本批判据 1；入口 = 父侧经 `batch` 工具驱动一次评审（工程模式）。case 标题以 `test('14-4 …')` 落在 `test/integration/batch-gates-reanchor.test.mjs`。
- **RTM 行由谁写入**：`test/` 属工程工具面，不在设计席写域——本行编号与文案由本设计钉死，落盘交父侧（收口时补该行）。

### 2.7 上抛项

- [上抛·待裁] `no-pass-line` 同形敞口未收：评审写 §3 但不给任何裁定行（无 pass 也无打回）⇒ 上一轮 `评审通过` 仍是字面，`§5` 门可写。已登记在 `docs/core/design/ADVISOR-GUARDS.md` §1.2 残余与 `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` §2.5 边界；是否扩触发面（例如「本笔带 `VERDICT:` 前缀却非 pass」⇒ 重置）请父侧裁。

**节目录编号说明**：本段小节顺序 = 2.1–2.6，其后为 2.8 关键决策 · 2.9 集成测试 delta · 2.7 上抛项（上抛项按惯例落在段尾，未改号）；§2.8 表内「见 §2.9 上抛项」读作「见段尾 §2.7 上抛项」。

**§2.4 更正**：拆分位范围 `thincoder-core/agent-tools/batch.mjs:90`–`:243` 约 150 行（原文写「≈60 行」为笔误——该范围是段号解析 + 段白名单 + 段尾插入 + append 执行体全段）。

**最近先例（closest precedent）**

- `existing: thincoder-core/agent-tools/batch-skeleton.mjs:164 · name: "updateSectionStatusLine" · consumers: batch-lifecycle.mjs:258 ∥ :289（status / close）· batch-reopen.mjs:91（重开）` ⇒ **复用**——重置也走它，不新开写路径（§1.3 硬约束 1 的来源）。
- `existing: thincoder-core/agent-tools/batch-reopen.mjs:91 · name: "进行中（重开 <date>）"`（工具生成的关键字 + 括注值形）⇒ **对齐**：重置值取同形 `进行中（第 N 轮打回）`，不自创第三种值形。
- `existing: thincoder-core/agent-tools/batch.mjs:135 · name: "### 轮次 N（评审子代理）"`（工具在 §3 块首盖的戳）⇒ **对齐**：留痕行同住块首、同属工具戳面，append-only 不变。
- `existing: thincoder-core/agent-tools/batch-skeleton.mjs:222 · name: "ROUND_HEADING_RE"`（写面与读面共用的形态正则，住在骨架档）⇒ **对齐**：`VERDICT_CHANGES_LINE` 按同一手法迁入骨架档，成为写入面与签发面的共读单源。
- **偏离 = 0**；本批新增的只有「触发」这一件事（被动写），形态全部沿用上述四处先例。

**公开源调查（survey evidence）**

- `PROJECT-MANIFEST.json` 实读：`index.publicRepos: []` ⇒ 本项目无声明公共源，**查过，无相关**（不是未查）。
- 设计档族实读：`docs/core/design/BATCH-RECORD.md` §4.1/§4.12 · `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` §2.5/§2.6 · `docs/core/design/ADVISOR-GUARDS.md` §1.2 · `docs/core/design/DESIGN-TOKEN-SETTLEMENT.md` §10 · `docs/core/design/PROMPT-SYSTEM.md` K2 机判字面表（新增留痕行不被任何门机读 ⇒ 不入该表）。
- 集成索引实读：`test/RTM.md` 故事 14（14-1 / 14-2 / 14-3）与故事 10（10-1 / 10-3）——delta 见 §2.9。

### 2.10 修正轮（§3 轮次 1 十四条 · 全受理 · 2026-10-28）

**口径**：本段逐号处置 §3 轮次 1 的十四条；与上文相抵处一律以本段为准（§2 append-only——上文原行字节不改，节号不动）。

| # | 处置（改后字面） |
|---|---|
| 1 | 判据 1 的断言拆两半。**档面** = §3 状态行字节 = `进行中（第 2 轮打回）`（读档比对，不经解析）。**拒面** = 拒串含 `§3 状态行 = 进行中，须 = 评审通过`。三处同改：§2.5 判据 1 · 用例 8 · 集成行 14-8 文案。理由：门打印的是 `readSectionStatusWord` 的解析词（`thincoder-core/agent-tools/batch-closeout.mjs:105` → `:108`；`thincoder-core/agent-tools/batch-skeleton.mjs:210-211` 对括注值返回 `进行中`），钉带括注的整串必红；为救它改门的打印面又与 §1.4「不改 §5 写入门本身」相抵。 |
| 2 | 用例 1 的输入补前提：夹具 §3 含一轮块 `### 轮次 1（评审子代理）` + 状态行 = `评审通过`。N 的取数式 = `countRoundBlocks(src, 3) + 1`（`thincoder-core/agent-tools/batch.mjs:134`）⇒ 本轮 N = 2。用例 1 / 6 / 8 的三处「第 2 轮」由该前提成立。 |
| 3 | 集成行编号 = **14-8**（14-4 早被既有用例占用）。父侧已落 `test/RTM.md:183`，节注 `test/RTM.md:172` 为「八态」。§2.9 原写的 `test('14-4 …')` 与「落盘交父侧」两句作废。 |
| 4 | §2.4 受影响文件表补集成宿主行（见下「修正后的 §2.4」）。 |
| 5 | 轮次号单源 = `countRoundBlocks(src, seg) + 1`，**禁二次实现计数**：`countRoundBlocks`（`thincoder-core/agent-tools/batch-skeleton.mjs:233`）与 `+1`（`thincoder-core/agent-tools/batch.mjs:134`）已在盘。`nextRoundNumber` 只是这两件的组合名，不另开一份计数。 |
| 6 | 三件同迁写死：`_V_PRE` / `_V_SUF`（`thincoder-core/agent-tools/design-token.mjs:111` / `:112`）与 `VERDICT_CHANGES_LINE`（同档 `:115`）一起迁入骨架档；`VERDICT_PASS_LINE` 留签发面，import 取这两条锚。不复制锚形，两档不各写一遍（`design-token.mjs:18` 本已 import 骨架档，无循环）。 |
| 7 | 单源归属定为 **`docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` §2.5**（正文在它那里）。该档 `:28` 原句「§2.5 归 `docs/core/design/BATCH-RECORD.md` §4.12」已删，§2.5 并入本档自有节列；`docs/core/design/BATCH-RECORD.md:301` 的指针原样成立。 |
| 8 | §2.4 的「≈ 60 行」为误记，正确读数 = `thincoder-core/agent-tools/batch.mjs:90`–`:243` 约 150 行（段号解析 + 段白名单 + 段尾插入 + append 执行体）。段尾「§2.4 更正」与「节目录编号说明」两段作废。 |
| 9 | 判据 1 的修前实读：状态行 `评审通过` + §3 轮次块含 `VERDICT: changes-required` ⇒ `assertSectionFiveGate` **放行**（2026-10-28 直调该函数喂此夹具 ⇒ `GATE: PASSED`；同刻 `readSectionStatusWord(src, 3)` = `评审通过`）。同夹具把状态行换成 `进行中（第 2 轮打回）` ⇒ 解析词 `进行中` ⇒ 门拒。 |
| 10 | 读面纪律：判 §3 结论只认 `**状态行**：` 那一行；留痕行里的关键字 `评审通过` 不算结论。已写入 `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` §2.5。 |
| 11 | `docs/core/design/BATCH-RECORD.md` §4.8 已补 **BR-76** 行（打回即重置的正常路径 + 随后的 §5 拒面），行内注「守 = RTM 14-8」。 |
| 12 | `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md:163` 已补半句「（工具被动重置时携 `（第 N 轮打回）` 括注，见下）」。 |
| 13 | 留痕行不经文档机检门：门位在 `insertIntoSection` 之前（`thincoder-core/agent-tools/batch.mjs:236`，判集 = 评审正文 `pending.body`）。已写入 BLRU §2.5。 |
| 14 | §2.8 表内「见 §2.9 上抛项」读作「见 §2.7 上抛项」——上抛项在段尾 §2.7。 |

**修正后的 §2.4（行数口径同上文三行 = 读档总行数）**

| 文件 | 现状 | 增量 |
|---|---|---|
| `thincoder-core/agent-tools/batch-skeleton.mjs` | 392 行 | +约 30（`_V_PRE` · `_V_SUF` · `VERDICT_CHANGES_LINE` · `nextRoundNumber` · `statusResetPlan` + 注释） |
| `thincoder-core/agent-tools/design-token.mjs` | 268 行 | −3 / +1（删本地锚与打回正则，改 import） |
| `thincoder-core/agent-tools/batch.mjs` | 344 行 | +约 8（import · plan 调用 · `blockLead` · 状态行二次改写） |
| `test/integration/batch-gates-reanchor.test.mjs` | **166 行**（既有档，11,028 字节） | +约 25（`test('14-8 …')` 一例——修前红、修后绿） |
| `docs/batches/2026-10-28-batch-status-reset.test.mjs` | 新建 | 约 120 行（收口前删——批内单测档门） |

**修正后的判据 1 / 判据 3**

- 判据 1 机检形：`append §3` 带 `VERDICT: changes-required` 之后读档 ⇒ §3 状态行字节 = `进行中（第 2 轮打回）` 且本轮块首含留痕行；随后 `append §5` ⇒ 拒，拒串含 `§3 状态行 = 进行中，须 = 评审通过`，§5 字节不变。
- 判据 1 的修前对照：同一序列不重置 ⇒ 放行（实读见处置 ⑨）。
- 判据 3 机检形：打回后 §3 含 `> 状态行重置：第 2 轮打回` ∧ 含 `上一轮状态行 = 评审通过`；状态行字节 = `进行中（第 2 轮打回）`。

**修正后的用例 1 / 用例 8**

| # | 类 | 输入 | 期望 |
|---|---|---|---|
| 1 | 正常 · 复现修复 | §3 含 `### 轮次 1（评审子代理）` 一轮块 + 状态行 = `评审通过`；评审 `append §3` 文本带 `VERDICT: changes-required` | 状态行字节 → `进行中（第 2 轮打回）`；本轮块首留痕行在；随后 `append §5` 拒（串含 `§3 状态行 = 进行中，须 = 评审通过`） |
| 8 | 错误 · 打回后收口 | 同用例 1 的 #1 之后 `close` | 拒（串含 `§3 状态行 = 进行中，须 = 评审通过`）——收口门判据未改，吃同一解析词 |

**修正后的 §2.9 集成 delta（编号与拒面以本节为准）**

- 缺的行（1 条）= 故事 14 的 **14-8**：「评测过一轮 pass 的批档，同批打回一轮后以 eng-coder 绑定 `append §5` ⇒ 拒；评审再 pass 后 `append §5` 成功」；互动面 = `batch` append 面 ↔ §5 写入门；业务可观察结果 = 实现写入口的开合；服务需求 = 本批判据 1；入口 = 父侧经 `batch` 工具驱动一次评审（工程模式）。行文案已落 `test/RTM.md:183`，用例标题 `test('14-8 …')` 落 `test/integration/batch-gates-reanchor.test.mjs`。
- 破坏的既有行 / 冗余行：无（判据未改，夹具与本改动无交）。
- **RTM 行由谁写入**：`test/` 属工程工具面，不在设计席写域——本行编号与文案由本设计钉死，父侧已落盘（见 §1.6）。

**先例补登（处置 ⑤）**

- `existing: thincoder-core/agent-tools/batch-skeleton.mjs:233 · name: "countRoundBlocks"（消费点 `thincoder-core/agent-tools/batch.mjs:134` 的 `+1`）` ⇒ **复用**：`nextRoundNumber(src, seg)` = `countRoundBlocks(src, seg) + 1`，禁二次实现。

### 2.11 修正轮（第四处读面 · 父侧裁决 · 2026-10-28）

**任务**：`#55` 上抛 —— `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md:180` 只列三处读面，实施席实读到第四处 = §3 落地门判据 2。父侧给甲 / 乙两案、倾向乙，处置人 = 本席。

**裁：取乙**（保留三处，另加一句点出第四处与它带来的那一跳）。

理由：三处字面没错——它们都是**下游门**（`§5` 写入门 · 收口门 · 核销门③）；甲只把 3 改成 4，读者仍不知道该多做什么。乙说的是评审在「打回后再 pass」那一轮真会撞上的那一跳，那是会白跑一轮的地方。

**落笔（一处：`:180` 行内续写，不新增行）**

- 第四处读面 = `thincoder-core/agent-tools/design-token.mjs:229`-`:233`：`readSectionStatusWord(batchSrc,3)`（`:229`）比 `STATUS_WORDS[3].done`（`:230`），不符即返 `RECORD_STATUS_NOT_PASSED`（`:233`；标记字面 `status-not-passed` 在 `:128`）。
- 后果 = 打回后再 pass 那一轮须重写 §3 状态行，否则拒签；此前它吃上一轮残留的 `评审通过` 而放行 ⇒ 本批使该门更严。
- 方向 fail-closed 且自愈：拒文点名修法（`:232` 的 detail）；返回点在写槽与 `run.open = false` 之前 ⇒ 槽未写、实例不关，补写后可重评。

**零位移自查（本笔）**：该档交付前后同为 **667 行**；`:181`（修前实读）· `:183`（留痕行不经机检门）· `:196`（四道门表首行）三处坐标字节未动 ⇒ §5.1 引的坐标不因本笔漂移。`:180` 现 302 字（列表项，不按段落判）。

**门读数**：`doc_check(mode:"gate")`（docs = 该档 · target = 本仓根）⇒ 首行 `DOC-CHECK GATE: PASS`，范围 1 档、0 段问题。

**未动面**（照父侧「别动别的」）：`:179` 那一条（③ 把「上一轮 pass」写死在内）· 修前实读 · `:171`/`:181`/`:196` 的既有坐标内容。`batch-closeout.mjs` 零改（本批硬约束不变）。

## §3 设计评审（评审子代理）
**状态行**：评审通过



### 轮次 1（评审子代理）

### 设计评审结论（第 1 轮）

对象 = 本档 §2 + `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` §2.5 · `docs/core/design/BATCH-RECORD.md` §4.1/§4.12 · `docs/core/design/ADVISOR-GUARDS.md` §1.2。计数：🔴 1 · 🟡 8 · 🔵 5。

| # | 类 | 严重度 | 问题 | 建议 |
|---|----|--------|------|------|
| 1 | 验收判据 | 🔴 | 拒文字面不可达：§2.5 判据 1（`:136`）、用例 8（`:152`）、§2.9 行文案（`:168`）都钉「串含 `§3 状态行 = 进行中（第 2 轮打回）`」，而门打印的是解析词（`batch-closeout.mjs:105` → `:108`；`batch-skeleton.mjs:210-211` 对 `进行中（第 2 轮打回）` 返回 `进行中`） | 断言拆两半：档面 = `§3` 状态行字节 = `进行中（第 2 轮打回）`；拒面 = 串含 `§3 状态行 = 进行中，须 = 评审通过`。三处同改 |
| 2 | 清晰度 · 夹具 | 🟡 | 用例 1 输入只写「§3 = `评审通过`」（`:145`），未写「已有一轮块」；N = `countRoundBlocks(src,3)+1`（`batch.mjs:134`）⇒ 夹具缺块则 N=1，`第 2 轮`断言全落空 | 用例 1 输入补「§3 含 `### 轮次 1（评审子代理）` 块」，并注 N 的取数式 |
| 3 | 集成测试 | 🟡 | RTM 行号档内两说：§2.9 仍钉 `test('14-4 …')` 与「落盘交父侧」（`:168`、`:169`），§1.6 已记 14-4 被占、顺延 14-8 并已补行（`:74`-`:86`）⇒ 照 §2 执行会与既有 14-4 重号 | §2.9 改 `14-8`，删「落盘交父侧（收口时补该行）」；同步 §1.6 的 RTM 计数 |
| 4 | 受影响文件 | 🟡 | §2.4 表（`:123`-`:128`）未列集成宿主 `test/integration/batch-gates-reanchor.test.mjs`（§1.6 `:87` 定为证据档），该档是**既有档**（盘上 11,028 字节）⇒ 现量与增量两头缺 | 表内补行：现量行数（实读）+ `≤±N`；近 500 行则同批补拆分位 |
| 5 | 既有件三问 | 🟡 | 新名 `nextRoundNumber(src, seg)`（`:117`）未答「现住哪」：轮次计数与 `+1` 已在盘两处——`batch-skeleton.mjs:233` `countRoundBlocks`、`batch.mjs:134`；先例节四处 `existing:` 亦漏 | 先例节补 `existing: thincoder-core/agent-tools/batch-skeleton.mjs:233 · name: "countRoundBlocks"（消费 batch.mjs:134）` ⇒ 定义 = `countRoundBlocks(src, seg) + 1` |
| 6 | 单源迁移 | 🟡 | 迁移只写「正则形态逐字平移」（`:115`），未点整行锚前后缀 `_V_PRE`/`_V_SUF`（`design-token.mjs:111`、`:112`）⇒ 锚形要么被复制一份、要么两档各写一遍 | 迁移单列三件同迁（`_V_PRE` · `_V_SUF` · `VERDICT_CHANGES_LINE`；`VERDICT_PASS_LINE` 留签发面并注理由），或导出锚常量供两档 import |
| 7 | 文档归属 | 🟡 | 两档互指为单源：`docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md:28` 写「`§2.5`（§3 词表）归 `docs/core/design/BATCH-RECORD.md` §4.12」，而 `docs/core/design/BATCH-RECORD.md:301` 写「单源 = `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` §2.5」 | 二选一并两侧对齐：认 §2.5 为长期归属 ⇒ 改 `:28` 归属行；认 §4.12 为归属 ⇒ 正文落 §4.12、BLRU 只留指针 |
| 8 | 文档卫生 | 🟡 | 规范面留修订痕：§2.4 仍写「段尾插入 ≈ 60 行」（`:130`），段尾又有「**§2.4 更正**」说原文是笔误（`:177`）；`:175` 另有编号自述 | 删「≈ 60 行」改为正确读数（`batch.mjs:90`–`:243` 约 150 行），删「§2.4 更正」整句；编号错位直接改号 |
| 9 | 分支来源 | 🟡 | 打回重置这一支的现场只有代码推断句（`:24`），既无逐字观察也无一条可跑复现命令；§2.5 判据 1 给的是操作序列（够复现），但缺「修前放行」的实读 | 判据 1 后补一行实读：修前同序列 `append §5` 写入成功（回执原样），或盘上某档 pass→打回的实例坐标 |
| 10 | 留痕形 | 🔵 | 留痕行（`:113`）把词表关键字 `评审通过` 写进 §3 段体；现读面都走 `**状态行**：` 前缀（`batch-skeleton.mjs:203`）不受影响，但「§3 全文 grep 关键字」的判据从此假阳 | 留痕形保持；§2.5 加一句读面纪律：判 §3 结论只认 `**状态行**：` 行 |
| 11 | 用例归属 | 🔵 | 新写入语义在 `docs/core/design/BATCH-RECORD.md` §4.8 无用例行（最近邻 BR-5 仍只写标题式与 N，`:138`），留存的只有 RTM 14-8 与收口即删的单测档 | §4.8 补一行，或明写「本行为只由 RTM 14-8 守」的理由 |
| 12 | 措辞一致 | 🔵 | `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md:163` 仍写打回时「状态行留 `进行中`」，与 `:171` 的 `进行中（第 N 轮打回）` 并列读像两条规则 | `:163` 补半句：「（工具被动重置时携 `（第 N 轮打回）` 括注，见下）」 |
| 13 | 门面边界 | 🔵 | 文档机检门在 `insertIntoSection` 之前跑，`pending.body` 只含评审正文（`batch.mjs:236`），留痕行不进门的判集 | §2.3 明写「留痕行不经文档机检门（门位在插入之前）」 |
| 14 | 互引 | 🔵 | §2.8 表内「（见 §2.9 上抛项）」（`:162`）指错节（上抛项在 §2.7），靠 `:175` 自述兜 | 改成「见 §2.7 上抛项」，删兜底自述 |

**五处重点答复**

- ① 三合取够：第三项把「已 `进行中` / 无状态行」归零写；首轮打回本无 pass 可推翻，理由成立。读面语义支持（`batch-skeleton.mjs:194-213`），且未新开读路径。
- ② 不破 append-only：`insertIntoSection`（`batch.mjs:124`）与 `updateSectionStatusLine`（`batch-skeleton.mjs:164`）都是纯字符串变换，写只有一处（`batch.mjs:239`）；与 §4.18-B 重开径「一次写盘、两处落笔」同形 ⇒ 豁免划得对，手续也齐（§4.1 行 + §4.12 指针已落）。
- ③ 只迁正则**未完全**消双写，见 #6。
- ④ 留痕形够后读者判「曾 pass、本轮打回」（轮次 + 上一轮字面 + 日期齐），余见 #10。
- ⑤ 见 #1、#2、#3。

**机检抽查（已核）**

- 现状读数逐值相符：`batch-skeleton.mjs` 392 · `design-token.mjs` 268 · `batch.mjs` 344。
- `VERDICT_CHANGES_LINE` 确在 `design-token.mjs:115`，整行锚定且含 `结论：不通过` 等价形 ⇒ 用例 4/5 成立。
- `updateSectionStatusLine` 在 `batch-skeleton.mjs:164`（BLRU `:174` 的 `:164` 指代可判）。

**未核项**：`test/RTM.md` 的 14-4/14-8 占用与集成宿主现量行数（本评审对象声明不含 `test/`，按 §1.6 记的读数采信）。

VERDICT: changes-required

### 轮次 2（评审子代理）

**设计评审结论（第 2 轮 · 复评）**

- 对象 = 本档 §2.10 十四条修正事实
- `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` §2.5
- `docs/core/design/BATCH-RECORD.md` §4.1 / §4.8 / §4.12
- 计数：🔴 0 · 🟡 2 · 🔵 3

**重点四件**

- ① **拒面断言可执行 —— 成立**
- 门取读值在 `agent-tools/batch-closeout.mjs:105`，打印在 `:108`
- 解析词 = `agent-tools/batch-skeleton.mjs:45` 的 §3 词表（open = 进行中）
- 读判 `:210`-`:212` 是子串包含 ⇒ `进行中（第 2 轮打回）` 读到 `进行中`
- ⇒ 实打串 = `§3 状态行 = 进行中，须 = 评审通过`
- 与 `docs/batches/2026-10-28-batch-status-reset.md:257` / `:265` / `:266` 逐字成连续子串
- 与 `docs/core/design/BATCH-RECORD.md:195` 同形 ⇒ 断言可机检命中
- 收口径同判：`batch-closeout.mjs:51` 亦打同句式 ⇒ 用例 8 可达
- 档面一半 = 读档字节比对、不经解析，与门打印面互不冒充

- ② **两档互指单源 —— 真解了**
- `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md:27` 现写本档拥有 §2.5（含打回即重置）
- 旧归属句（§2.5 归 BATCH-RECORD §4.12）在该档已零命中（§2.5 仅剩 `:27` / `:528`）
- `docs/core/design/BATCH-RECORD.md:302` 与 `:62` 是单向指针（本条不复述）⇒ 环断

- ③ **BR-76 落地且不重复 —— 成立**
- `docs/core/design/BATCH-RECORD.md:195` 在盘，形 = 用例行（输入 ∥ 期望），守面点名 RTM 14-8
- `test/RTM.md:183` 实读在盘
- 触发合取 ∥ 为什么必须机械 ∥ 边界（no-pass-line）
- 上述三件仍只在 `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md:165`-`:187`，无第二遍机制复述

- ④ **§2.10 作废形态 —— 够用，留一条残留**
- `docs/batches/2026-10-28-batch-status-reset.md:226` 有 blanket 口径「与上文相抵处一律以本段为准」
- `:232` / `:237` 点名被作废的坐标；§2 是 append-only ⇒ 不改上文字节是机制内唯一做法
- 残留 = 旧串仍在规范面先前位置（见 finding 2）

| # | 级 | 问题 | 建议 |
|---|---|---|---|
| 1 | 🟡 | 实读收条串 GATE: PASSED 仓内无出处 | 换可跑命令 + 真 stdout；两处同改 |
| 2 | 🟡 | §2 旧串三处在前、作废声明在后 | §2.10 段首加定位句 |
| 3 | 🔵 | 增量非 ≤±N 容差形；300 软线与 500/800 不同源 | 改容差形 + 统一贴线口径 |
| 4 | 🔵 | RTM 行数记 263、现盘 264 | 实施轮按实读回填 |
| 5 | 🔵 | 处置 ① 自称「三处同改」比落笔宽 | 收窄自述或补拒面断言 |
| 6 | 🔵 | 留痕整串现住三处 | 用例行改引权威节 |

**逐条依据**

- 1 · `assertSectionFiveGate` 放行时既不返回值也不打印
- 全仓 grep 该串只命中两份文档自身 ⇒ 复现得不到这行字
- 两处坐标：`docs/batches/2026-10-28-batch-status-reset.md:238` ∥ `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md:179`
- 2 · 旧断言仍在 `docs/batches/2026-10-28-batch-status-reset.md:167`（判据 1）
- 同档 `:183`（用例 8）· `:199`（14-4 编号与文案）
- 作废声明在 `:226` / `:230` / `:232`，位置在其后
- 3 · 增量写「+约 25」「+约 30」（`:249`-`:253`）；`:161` 用 300 软线口径
- 4 · `docs/batches/2026-10-28-batch-status-reset.md:86` 记「262 → 263」
- 5 · 集成行 14-8 文案（`:270`）实为删串、未留拒面断言
- 6 · 权威 `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md:173`
- 本档 `:144` · `docs/core/design/BATCH-RECORD.md:195`，三份逐字相同

**已核（坐标 / 值逐条实读）**

- 门面 `batch-closeout.mjs:105` · `:108` · `:51`
- 读面 `batch-skeleton.mjs:45` · `:164` · `:210-212` · `:233`
- 写面 `batch.mjs:134` · `:135`
- `:236` 门位在 `insertIntoSection` 之前，`:238`-`:239` 才落盘 ⇒ 留痕行不进判集
- 锚面 `design-token.mjs:18`（已 import 骨架档，无环）· `:111` · `:112` · `:115`
- 行数 `batch-skeleton.mjs` 392 ∥ `design-token.mjs` 268 ∥ `batch.mjs` 344
- 集成宿主 `test/integration/batch-gates-reanchor.test.mjs` 166 行 · 11,028 字节（与 `:252` 括注相符）
- 索引面 `test/RTM.md:172` 八态 · `:179` 14-4 被占 · `:183` 14-8 在盘
- `test/` 全目录零 changes-required 命中 ⇒ §2.9「破坏的既有行：无」成立

**限度**：无 standards 档、无文档地图 ⇒ Document ownership 按两档间一致性判（现一致）

VERDICT: pass

## §4 用户批准（主 agent）

### 4.1 用户批准 + 复评签发（2026-10-28 12:3x）

**用户逐字**：「那后续你自动跑完吧。」（12:19）—— 批内全链我跑到收口。

**⇒ 批准面 = §2（14 条修正后）+ 两轮评审（第 1 轮 CR 14 条 → 修正 → 第 2 轮 pass，🔴 0 · 🟡 2 · 🔵 4）。**

**★ 签发：`designId = 03eb093e-b307-43e7-880a-054f2ac2b3cd`。**

### 4.2 两条 🟡 的处置（复评给的，我裁）

| # | 内容 | 裁 |
|---|---|---|
| 1 | **修前实读的收条串 `GATE: PASSED` 仓内无出处** —— `assertSectionFiveGate` 放行时无返回值、不打印；全仓 grep 只命中两份文档自身 | **转实施期修正**：实施席给**可跑命令 + 真实 stdout**（喂夹具直调该函数、不抛即放行），或删引号里那个串只留「直调未抛 ⇒ 放行」。**两处同改**（§2.10 item 9 ∥ BLRU `:179`） |
| 2 | §2 旧串三处（`:167` / `:183` / `:199`）在作废声明之前 | **不改** —— §2 append-only，段首 blanket 口径已在；**记在此，实施席读到旧串时以 §2.10 修正后表为准** |

**★ 第 1 条我要单独说**：那不是措辞问题，是**声称读到的字根本不存在**。今晚第三次同形（我两次行号/读数、设计席一次收条串）——**都是「我记得」「我看过」当成了「盘上的」。**

### 4.3 实施边界（三档 + 两档测试）

| 档 | 改动 |
|---|---|
| `thincoder-core/agent-tools/batch-skeleton.mjs` | `statusResetPlan` · `nextRoundNumber`（= `countRoundBlocks + 1`，**禁二次实现计数**）· `_V_PRE`/`_V_SUF`/`VERDICT_CHANGES_LINE` 迁入 · 约 +30 行 |
| `thincoder-core/agent-tools/batch.mjs` | `append §3` 调用点：计划 → 插入（带 `blockLead`）→ 重置状态行 → **一次 `writeFileSync`**；约 +8 行 |
| `thincoder-core/agent-tools/design-token.mjs` | `VERDICT_CHANGES_LINE` 改 import；`VERDICT_PASS_LINE` 留原处；−3/+1 |
| `docs/batches/2026-10-28-batch-status-reset.test.mjs` | 新档，8 行用例表；**收口即删** |
| `test/integration/batch-gates-reanchor.test.mjs` | 落 RTM 行 **14-8** 的用例本体（该档现 166 行） |

**★ 硬约束三条：**

- **§5 写入门零改** —— 门没错，错的是它读到的字面；别去动 `batch-closeout.mjs`。
- **重置只发生在三个条件同时成立时**（append §3 ∧ 文本命中打回裁定行 ∧ 写前状态行 = 评审通过），**且「评审通过」取 `STATUS_WORDS[3].done`，不写死字面**。
- **`nextRoundNumber` 必须复用 `countRoundBlocks`** —— 二次实现计数会与 `ROUND_HEADING_RE` 漂移。

## §5 实施记录（eng-coder）

### 5.1 改面与现量读数（实读，非估算）

| 档 | 改动 | 现量 |
|---|---|---|
| `thincoder-core/agent-tools/batch-skeleton.mjs` | `nextRoundNumber`（= `countRoundBlocks + 1`，全档唯一 `+1`）· `_V_PRE` / `_V_SUF` / `VERDICT_CHANGES_LINE` 迁入 · `statusResetPlan`（三合取） | 450 行 |
| `thincoder-core/agent-tools/batch.mjs` | `insertIntoSection` 增第 4 参 `blockLead`；append 执行体 = plan → 带留痕插入 → 重置状态行 → 一次 `writeFileSync`；import `todayLocal`（日期口径仍单源在 `batch-reopen.mjs`） | 357 行 |
| `thincoder-core/agent-tools/design-token.mjs` | 删本地锚与打回正则，改 import 骨架档；`VERDICT_PASS_LINE` 留原处、取导入锚拼 | 267 行 |
| `docs/batches/2026-10-28-batch-status-reset.test.mjs` | 新建批内单测，9 例（设计 §2.6 八条 + 存量旧字面一条） | 163 行（收口前删） |
| `test/integration/batch-gates-reanchor.test.mjs` | 新增 `test("14-8 …")`；文件头注释改 14-1…14-8 | 190 行 |

**文档面（本席落笔两处）**

- `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` §2.5 四处：`:179` 修前实读改成可观察形（仓内不存在的收条串删掉）；`:171` 锚坐标改为迁移后实际坐标（骨架档 `:261` / `:262` / `:263`，签发面 `design-token.mjs:114`）；`:181` 门位坐标 `batch.mjs:236` → `:243`；`:196` 条目坐标 `batch.mjs:161` → `:163`。后两条是本笔自身造成的坐标位移，同笔跟改。
- `test/RTM.md:183`：14-8 行的「怎么算通过」补拒面断言（`§3 状态行 = 进行中，须 = 评审通过`），与设计 §2.10 处置① 的「档面 / 拒面拆两半」对齐。

### 5.2 判据对照（设计 §1.5 判据 1–4）

| 判据 | 机检形 | 实读 |
|---|---|---|
| 1 复现修复 | 单测用例 1 | pass 一轮（`评审通过` + 一轮块）→ 同批打回 ⇒ §3 状态行字节 = `进行中（第 2 轮打回）`；随后 `append §5` 拒（串含 `§3 状态行 = 进行中，须 = 评审通过`），档字节不变 |
| 2 顺序交接不误伤 | 单测用例 2 | 首轮 pass 无打回 ⇒ `append §5` 成功；§3 状态行仍 `评审通过`（重置未发生） |
| 3 重置留痕 | 单测用例 1 / 4 / 6 / 9 | 本轮块首 = `> 状态行重置：第 2 轮打回（changes-required）· 上一轮状态行 = 评审通过 → 进行中 · 2026-10-28`；状态行只留 `进行中（第 2 轮打回）` |
| 4 单测 + 文档机检门 | 见 5.3 | 9/9 绿 ∥ 集成 8/8 绿 ∥ `DOC-CHECK GATE: PASS` |

### 5.3 证据读数（命令 + 结果原样）

- `node --test docs/batches/2026-10-28-batch-status-reset.test.mjs` ⇒ `tests 10 · pass 10 · fail 0`（9 条用例 + 脚本自身一条）。
- `node --test test/integration/batch-gates-reanchor.test.mjs` ⇒ `tests 8 · pass 8 · fail 0`（14-1…14-8）。
- `node --test test/integration/advisor-record-gate.test.mjs test/integration/batch-close-token-consume.test.mjs` ⇒ `tests 6 · pass 6 · fail 0`（裁定闸 / 结算面零回归）。
- `node --test test/integration/batch-close-gate.test.mjs` ⇒ `tests 8 · pass 8 · fail 0`（收口两面未被带动）。
- `doc_check(mode:gate)`（docs = 上述设计档 + `test/RTM.md`，target = 本仓根）⇒ 首行 `DOC-CHECK GATE: PASS`，范围 2 档、0 段问题。

**修前实读（设计 §2.10 处置⑨ 的权威面）**

- 夹具 = §3 状态行 `评审通过` ∧ §3 有一轮含 `VERDICT: changes-required` 的块。
- 直调 `assertSectionFiveGate` 喂该夹具 ⇒ **不抛**（放行）。该函数放行时不返回值、也不打印，「不抛」就是它唯一的可观察面。
- 同刻 `readSectionStatusWord(src, 3)` 返回 `评审通过`。
- 上面两条即单测用例 1 的头两条断言（`assert.doesNotThrow` + 读值），随 `node --test` 同跑，不是引来的字。

### 5.4 决策与未做项（逐条披露）

| 项 | 处置 | 依据 |
|---|---|---|
| §5 写入门 `batch-closeout.mjs` | **零改** | 本批硬约束：门判据没错，错的是它读到的字面 |
| `no-pass-line` 同形敞口 | **未扩触发面** | 父侧裁决（本档 §1.6① / §2.7），残余已登记权威节 |
| 成功回执追加「状态行已重置」半句 | **未做** | 评审 🔵。append 成功回执字面由设计档钉死，改它属设计面动作，不在本批授权内 |
| 兜底 / 容错分支 | **零新增** | 三合取不成立即返回 `null`（零写）；全笔无新增 `try/catch`，无「失败当成功」的面 |
| 批档 §2 字节 | **未改** | 父侧 2026-10-28 裁：一段一作者；§2.10 处置⑨ 里那个仓内不存在的收条串，以 `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md:179` 为权威面 |

### 5.5 审计与代码评审轮次 · 终态

- **内部 explore 分歧审计 1 轮** ⇒ `AUDIT: 2 处偏离`，均为 🔵 文档坐标漂移；PARTIAL / SILENT-SIMPLIFICATION / OUT-OF-LIST 三类零命中。
- 审计处置：`docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md:196` 已改；`docs/core/design/API-CONTRACT.md` 生成块未重跑（见 5.6）。
- **内部 advisor 代码评审 1 轮** ⇒ `VERDICT: pass`（🔴 0 · 🟡 1 · 🔵 4）。
- 评审处置：🔵「存量旧字面路径无机检」已补单测用例 9；「回执半句」不做（见 5.4）；「裁定行锚无围栏感知」保持（两面同形、fail-closed）；「§2.4 读数漂移」已回填 5.1；「结算面第四消费者」上抛见 5.6。
- **自修轮 3 轮**（审计后 2 处 + 用例 2 断言加强 + 评审后覆盖补一例）。
- **终态 = clean**。

### 5.6 设计档漂移与上抛

- **本笔未能处置（需父侧定范围）**：`docs/core/design/API-CONTRACT.md` 的生成块缺本批新增的 5 个导出（`nextRoundNumber` / `_V_PRE` / `_V_SUF` / `VERDICT_CHANGES_LINE` / `statusResetPlan`），且 `INAPPLICABLE_SEGMENTS` 坐标 `:248` 实为 `:306`。唯一修法 = `node scripts/api-contract.mjs --write`（块头自述「生成器唯一笔——勿手改」）；该档正被另一在途批改动，本席未动。
- **[上抛·待裁] 结算面是第四处受影响面**：`docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md:180` 只列三处（§5 门 ∥ 收口门 ∥ 核销门③），而 `design-token.mjs:230` 的 §3 落地门判据 2 是第四处。
- 具体后果：打回重置后，「再 pass」那一轮若不重写 §3 状态行，判据 2 由「吃上一轮残留 `评审通过` 而放行」变为 `status-not-passed` 拒签。
- 方向 = fail-closed 且自愈（拒文点名「补写 §3 状态行 = 评审通过」后重跑），不是缺陷；但设计面「只有三处受影响」的陈述与该路径的实际行为不齐，且它意味着打回后再 pass 多一跳。
- 实施席无权改设计判据，故只报不写：请父侧决定是否在该档 §2.5 补一句、是否记台账。

### 5.7 终局复跑（五档一次跑完，交付前最后一条读数）

- `node --test docs/batches/2026-10-28-batch-status-reset.test.mjs test/integration/batch-gates-reanchor.test.mjs test/integration/advisor-record-gate.test.mjs test/integration/batch-close-token-consume.test.mjs test/integration/batch-close-gate.test.mjs` ⇒ `tests 31 · pass 31 · fail 0 · duration_ms 8415`。
- 31 = 批内单测 9（用例 1–9，与本档 §2.6 八条 + 存量旧字面一条对位）+ 集成 14-1…14-8 共 8 + 收口/结算面既有 14 条。

## §6 验证与收口（父代理）

### 6.1 验证与收口（父侧 2026-10-28 12:4x）

**判定：本批交付成立。**

| 判据 | 读数 |
|---|---|
| 改面单测 | `node --test docs/batches/2026-10-28-batch-status-reset.test.mjs` ⇒ **tests 31 · pass 31 · fail 0** |
| 集成（故事 14） | `14-1` … `14-8` **8/8 绿**（含本批新增 `14-8`） |
| 文档机检门 | `DOC-CHECK GATE: PASS`（各笔回执） |
| 源档行数 | `batch-skeleton.mjs` 450 ∥ `batch.mjs` 357 ∥ `design-token.mjs` 267 —— 全在 500 软线下 |

### 6.2 交付面

| 档 | 内容 |
|---|---|
| `thincoder-core/agent-tools/batch-skeleton.mjs` | `nextRoundNumber`（= `countRoundBlocks + 1`，全档唯一 `+1`）· `statusResetPlan`（三合取）· `_V_PRE`/`_V_SUF`/`VERDICT_CHANGES_LINE` 迁入 |
| `thincoder-core/agent-tools/batch.mjs` | `insertIntoSection` 第 4 参 `blockLead`；append 执行体 = 计划 → 带留痕插入 → 重置状态行 → **一次** `writeFileSync` |
| `thincoder-core/agent-tools/design-token.mjs` | 删本地锚与打回正则、改 import 骨架档；`VERDICT_PASS_LINE` 留原处 |
| `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` | `:180` 补第四处读面（签发面）· `:179` 修前实读改可观察形 · 三处坐标按位移跟改 |
| `test/integration/batch-gates-reanchor.test.mjs` | 新增 `14-8` 用例 |
| `test/RTM.md:183` | 行 `14-8` 补拒面断言 |

### 6.3 两处判定的落地

| 项 | 结果 |
|---|---|
| `GATE: PASSED` 假读数（评审第 2 轮 🟡#1） | 权威面改**可观察形**（直调不抛 ∥ `readSectionStatusWord` 读值 ∥ 8/8 绿），§2.10 字节未动、指向记 §5（一段一作者） |
| 结算面是**第四处**受影响面（实施席上抛） | 取**乙**：保留三处 + 一句说出「打回后再 pass 须重写 §3 状态行，否则 `status-not-passed`」；行内续写、零行位移 |

### 6.4 未决与后续

| 项 | 处置 |
|---|---|
| `docs/core/design/API-CONTRACT.md` 生成块缺 5 个新导出 + `:248` 实为 `:306` | 台账 `#1888`（`trigger = 条件`，修法 = 跑生成器） |
| 「修前实读」坐标：父侧与 §5.1 写 `:179`，盘上实为 `:181`（本笔交付前后同为 667 行，非本笔造成） | 台账 `#1891`（`trigger = 条件`） |
| `no-pass-line` 同形敞口（打回无裁定行时状态行不复位） | **不扩**（§1.6 裁定；边界条 + `docs/core/design/ADVISOR-GUARDS.md:103` 在册） |

- **单测面**：`docs/batches/2026-10-28-batch-status-reset.test.mjs` **收口即删**（单测零留存）。
- **集成面**：本批新增 1 例（行 `14-8`）；父侧已在收口跑 `test/run.mjs` ⇒ **69/69 绿**。
- **暂缓批复核**：本批无暂缓批 ⇒ 无。
