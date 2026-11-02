# 2026-11-02 · status-word-window-close
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-11-02 · 来源 = 用户 2026-11-02 01:32「你拿1975-77这三项试试新代码呗」—— 取台账 #1977（段头区收窄的两个残余方向）；条件未自然触发，本次由用户显式指定提前处置。
> 台账 = #1977（TOOLS · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-11-02
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

## 1. 讨论（主 agent）

- **已定决定**：本批处置 `#1977` 记下的两个残余方向，并判定「缺省读面要不要一起收窄」。 · 用户原话：「**你拿1975-77这三项试试新代码呗**」 · 时间：2026-11-02 01:32

### 现状（#1972 已落的形态）

段级状态行的**写面**与**触发读面**已收窄到段头区（`## §N` 之后、下一个 `^#{2,}` 之前）；两条计划 ③ 读同一区。**但缺省读面仍按段内首命中** —— `§5` 写入门 ∥ 收口门 §3 状态词臂 ∥ 核销门③ ∥ 签发面判据 2 ∥ `batch/list` 列举面 ∥ §1 冻结判据，六处。

### 两个残余方向（#1977 记的）

| 方向 | 描述 | 存量 |
|---|---|---|
| A · 读 | 从未被置位过的 §3，若块正文引述了 `**状态行**：评审通过`，缺省读面仍读到那行 | 未知，需现量 |
| B · 触发面与门面不对称 | 段头区无状态行、唯一那行落在 `### 轮次 …` 之下时，打回重置的 ③ 读到「无状态行」⇒ 不落字；门面读缺省 ⇒ 读到那行 | **3 档 / 258 段**，三档 §1 均 `已收口` ⇒ 实际影响 0 |

### 本批要裁的（设计席给结论，不预设）

1. **A 方向现量** —— 全仓（扣 `docs/batches/**` 与 `_archive`）有多少份 §3 是「段头区无状态行 + 区外有 `**状态行**：` 行」。**这是决定收不收的前提。**
2. **收窄缺省读面的代价** —— #1972 当时判「259 档 / 1551 段受影响（64 段状态行在标题行之后）⇒ 风险大于收益」。**那个数是不是还在**，以及**收窄后哪些门会改判**。
3. **B 方向的两条路**：① 段头区为空时回落缺省读（#1972 拒绝过，因为它把方向 A 的通道还给触发面）；② 收窄门面读区（一次性把两边拉齐）。**选哪条、为什么。**

### 一条硬约束（上批的教训）

**不许为「救少量实例」而把已经堵上的窟窿重新打开。** 若某个补法会让「正文引述行可以冒充段级状态行」重新成立，**它就不成立** —— 除非同时给出更强的拦法。

### 边界

- 只动状态行的读写面与其门面判据；**不改任何段的语义、不改批档结构**；
- **批档自身（`docs/batches/**`）零改**（过程档，不参与读数）；
- 发现别的问题报上来，不代改。

## §2 批次任务与设计（eng-designer）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试覆盖 / 验收对照 / 关键决策 / 上抛项>

**状态行**：设计完成 2026-11-02（收尾轮：终止态两条出口（冻结门 ∥ 段绑定拒面）同口径逐字；受影响坐标改符号名，不带行号）

## 本批条目（覆盖）

**覆盖账 = #1977**（本档接管该行；本批无第二条台账行）。

| # | 条目 | 判据出处 |
|---|---|---|
| R1 | 方向 A 现量：全仓（扣 `docs/batches/**` 与 `_archive`）§3「段头区无状态行 ∧ 区外有 `**状态行**：` 行」的份数 | §2 下方读数表 |
| R2 | #1972 的 259 档 / 1551 段 / 64 段读数是否仍在 | §2 下方读数表 |
| R3 | 三条候选路线择一，并给出理由 | 设计档 `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` §4 决策 26 |
| R4 | 收窄缺省读面的改判清单（哪些档、改成什么、有无一份会因此收不了口） | 同档 §2.5「改判清单」+「不许回落」 |
| R5 | 一条硬约束入档：不许为救少量实例把已堵的窟窿重新打开 | 同档 §4 决策 26 的「被拒 · 路线②」+ §2.5「不许回落（边界）」 |

## 设计档落点

`docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md`：§2.5（定位面单源表 · 代价 · 改判清单 · 方向 A 读数 · 边界）· §4 决策 25 收正 + 决策 26（新）· §5 R24（新）· §6 用例表两行（新）· §3 档位结论句收正。**需求档零改**：本条收窄的是设计档已定的定位面，需求层无新条目。

## 机制设计（结论）

段级状态行的**取值区只有一个 = 段头区**：六处门面（`§5` 写入门判据 1 · 收口门 §3 臂 · 核销门③ · 签发面判据 2 · `batch/list` 列举面 · §1 冻结判据——冻结判据已含在六处内）· 写面 1 · 触发读面 2（打回重置 ∥ 通过置位）· `§1` 重开原文读面 1 = **10 处收窄**，另有 1 处有意不收窄（`sectionHasStatusLine`，段内宽读）；`readSectionStatusWord` 的 `region` 参数退场。

- **§1 的存在性网有意不收窄**：`sectionHasStatusLine` 判「有没有」（段内宽读），与 `readBatchStatusLine` 判「值是什么」（段头区）合起来才是 fail-closed。一并收窄会把「有行 ⇒ 关门」改成「无行 ⇒ 放行」。
- **实现时序**：本轮只定判据，代码由下一轮实施；判据以设计档 §2.5 单源表为准。

### 读数（本轮实测，量法写死）

- **域** = 仓内全部 `.md`；非批档域 = 再扣 `docs/batches/**` 与 `_archive`。**归属键** = 一个 `## §N` 段（N 单数位）。**围栏内算**（读面不认围栏）。**取值面** = 直调 `readSectionStatusWord(src, seg, "section")` vs `("header")`。

| 读数 | 值 |
|---|---|
| 批档域档数 / `## §N` 段数 | 262 档 / 1567 段 |
| 段头区无行 ∧ 区外有行（全段位） | 63 段（§3=3 · §5=8 · §4=15 · §6=37 · §1=0 · §2=0） |
| 两区取值不等的段 = 真正的改判面 | 11 段（§3 三档 + §5 八档） |
| 非批档域 §3 同形命中（方向 A 的域） | **0 段** |
| 落在围栏内的区外状态行 | 0 段 |

- **#1972 的读数**：259 档 / 1551 段 / 64 段 ⇒ 现盘 262 / 1567 / 63。档 +3、段 +16 = 本批之后新增的批档；**命中 −1 = 已落的写面收窄在起作用**——`status` 的每次写把状态行补进段头区（`updateSectionStatusLine`），该段随即离开「段头区无行 ∧ 区外有行」这一类 ⇒ 残余池随正常写入自行衰减。
- **63 与 11 的差**：§4 / §6 无 `STATUS_WORDS` 条目，任何区都返回「无状态词」⇒ 那 52 段不构成读数。**#1972 的「64 段受影响」按全段位记，把不改判的 §4 / §6 也算了进去，代价被高估约 5.7 倍。**
- **方向 A 的实例 = 0（按下列判别依据读，不是独立的一次量）**：三处 §3 的行都紧跟 `### 轮次 N（评审子代理）` 块首、括注写的是本轮结论（`docs/batches/2026-10-28-product-text-sweep.md:320`→`:322` · `docs/batches/2026-10-28-rule-writing-sweep.md:224`→`:226` · `docs/batches/2026-10-28-sse-first-chunk-idle.md:158`→`:160`，逐条实读）；工具从不往轮次块里写 ⇒ 块内行必为手写，「真状态行 vs 引述」只能由散文判。**读数取 0 或 3 都不改路线 ③**（决定与读数解耦）。
- **段头区内多行 ⇒ 读面取区内首命中（登记，批档零改）**：本档 `§2` 即为该形——段头区先有骨架残留 `**状态行**：（eng-designer 写入时更新）`、其后才是 `设计完成（…）` ⇒ 该段读 `null`；处置定义 = 设计档 `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` §2.5「区内多行 ⇒ 取区内首命中」。

### 改判清单

| 段位 | 档数 | 收窄后 | 现成本 |
|---|---|---|---|
| §3 | 3 | `评审通过` → 空 | `docs/batches/2026-10-28-product-text-sweep.md`（#1854 `已核销`）· `docs/batches/2026-10-28-rule-writing-sweep.md`（#1912 `已核销`）· `docs/batches/2026-10-28-sse-first-chunk-idle.md`（#1859 `已核销`），三档 `§1` 均 `已收口` ⇒ **0** |
| §5 | 8 | `实施完成` → 空 | 只 `batch/list` 列举面（无门读 §5 状态词）⇒ 少一个词，无门后果 |
| §1 · §2 | 0 | — | 不改判 |

**会收不了口的是谁**：收口本身不会（三档早已收口、台账行已核销）。会的是**重开之后**——重开这三档再收口 / 再核销，须一轮携 pass 裁定行的评审；置位会把状态行写进段头区 ⇒ 自愈，不是人工补字。

## 受影响文件（下一轮实施面；本轮零触代码）

| 文件 | 变化 |
|---|---|
| `thincoder-core/agent-tools/batch-skeleton.mjs` | `readSectionStatusWord` 去 `region` 参数、只读段头区；`readBatchStatusLine` 改读段头区；`sectionHasStatusLine` **零改**；`statusResetPlan` / `statusPassPlan` 的 `"header"` 实参删去 |
| `thincoder-core/agent-tools/batch-closeout.mjs` | `assertSectionFiveGate` / `assertCloseoutGates` 的 §3 读面随单源转；调用面不改签名 |
| `thincoder-core/ledger-close-proof.mjs` | `assertCloseOutProof` 的 §3 读面随单源转 |
| `thincoder-core/agent-tools/design-token.mjs` | 判据 2 读面随单源转，判据与拒因零改 |
| `thincoder-core/agent-tools/batch-read.mjs` | `listBatchRecords` 读面随单源转 |
| `thincoder-core/agent-tools/batch-reopen.mjs` | `readBatchStatusLineRaw` 改读段头区（回执原文取真段级行） |

**档位结论**：各档均不跨档位——改动量 = 每个读面一处取值区裁剪 + 一处实参删除。

- **落法做成净负**：`thincoder-core/agent-tools/batch-skeleton.mjs` 删 `region` 形参 + 删其 JSDoc 段 ⇒ 改后行数不高于改前（改前实测 500 行）。
- **三处 `readBatchStatusLine` 消费面本轮零改、行为不变**（判据 = §1 段位现量 0），实施轮逐处复读：`thincoder-core/agent/live-batch.mjs:71` · `thincoder-core/agent-tools/batch-lifecycle.mjs:118` / `:234` / `:283` · `thincoder-core/agent-tools/batch.mjs:211`；`thincoder-core/ledger-close-proof.mjs:50` 同此。

## 验收对照（每条可机检）

| 条目 | 判据 |
|---|---|
| R1 | 本轮一次实测（2026-11-02）的读数 ⇒ 非批档域 §3 命中 = 0；批档域 = 3（档名逐个等于上表）；复跑形 = 设计档 §2.5「复跑形（`region` 退场后）」 |
| R2 | 同上一次实测 ⇒ 批档域档数 / 段数 / 命中数 = 262 / 1567 / 63 |
| R3 | 设计档 §4 有决策 26，且其「被拒」段逐字含路线① ∥ 路线② 两条及各自理由 |
| R4 | 夹具 = §3 段头区无行 + 块正文一行 `**状态行**：评审通过`：`append §5` 拒（`R-G2`）· `close` 拒 · `ledger close` 拒（`R-L3`）· 派评审拒签（`status-not-passed`）· `batch list` 该档 §3 空；同档落一笔携 `VERDICT: pass` 的 §3 ⇒ 段头区出现 `**状态行**：评审通过`、五处翻绿、引述行字节不变（设计档 §5 R24 同一判据） |
| R5 | 全仓 `readSectionStatusWord` **与** `readBatchStatusLine` 的调用点：无 `"section"` 实参、无 `"header"` 实参、无 `region` 形参（两处读面同一次 grep）；`sectionHasStatusLine` 仍在段内宽读（改后 R4 夹具的 ④ 仍拒，而 §1 有正文状态行时冻结门照跑）；`thincoder-core/agent-tools/batch-skeleton.mjs` 行数不高于改前（改前实测 500 行） |

## 关键决策

1. **选路线 ③（收窄六处门面 + 写面 1 + 触发读面 2 + `§1` 重开原文读面 1 = 10 处，不选 ① / ②）**。理由与两条被拒路线 = 设计档 §4 决策 26。一句话：**门面与写面必须读同一区**——③ 把窟窿的另一半堵上，② 才是把它重新打开。
2. **`region` 参数退场，不是改默认值**：收窄后 `section` 无消费者；留一个可选宽读 = 留一条按需把引述行读成结论的入口。
3. **§1 存在性网不收窄**：判「有没有」宽读、判「值是什么」窄读，两者合起来才是 fail-closed。
4. **成本处置**：三档 §3 现成本 0（已收口 + 行已核销），重开后由置位自愈；不做存量档回填（批档是过程档、零改）。
5. **改动做成净负**：删 `region` 形参、删其 JSDoc 段、删两处 `"header"` 实参 ⇒ `thincoder-core/agent-tools/batch-skeleton.mjs` 行数不高于改前（改前 500 行）；不靠「注释行等量压缩」凑预算。判据 = 设计档 §5 R24 第 ⑧ 格。

## 上抛项

- **段头区的行分不出是谁写的（已立台账 #1980，父侧裁）**：评审手写进段头区的行与工具写的行同形同值。本条定的是「住哪」不是「谁写的」；要判作者需给工具写过的行加标记（更强的拦法）——属新语义，本批不动。

### 第 3 轮修正（现行文字 = 本节）

- **受影响文件与逐坐标清单 = 设计档 `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` §3**：一处坐标一行。`readBatchStatusLine` = **4 档 8 个调用点**（`thincoder-core/agent/live-batch.mjs:71` · `thincoder-core/agent-tools/batch-lifecycle.mjs:103` / `:118` / `:234` / `:264` / `:283` · `thincoder-core/agent-tools/batch.mjs:211` · `thincoder-core/ledger-close-proof.mjs:50`）；`readBatchStatusLineRaw`（`thincoder-core/agent-tools/batch-reopen.mjs:44`）改读段头区、`sectionHasStatusLine`（`thincoder-core/agent-tools/batch-skeleton.mjs:457`）零改，两者各自单列。重开合取只有一个坐标 = `thincoder-core/agent-tools/batch-lifecycle.mjs:234`。本节只引该表，不复录坐标。
- **命中 −1 的成因 = 推断（未逐段取证）**：机制与取证形见设计档 §2.5，不作读数用。
- **R1 / R2 / R3 / R5 的判据不变**；**R4 的判据追加一格**：收窄的终态（`§1` 状态行落在段头区外 ⇒ 值读 `unknown`）其拒文点名唯一出路，判据 = 设计档 §5 R26。
- **重开整链的夹具面**：改判清单三档本体的行是 `已核销` 终态（重开不回收）⇒ 再结账须另立新行；整链夹具因此用新档自开行（`在途` → `待核销` → 回收 `在途`），判据 = 设计档 §5 R25。
- **27-1 现态**：`test/RTM.md` 在册、「待执行」，用例本体随实施轮落（可跑文件 = `test/integration/batch-status-auto-set.test.mjs`）。

### 收尾轮修正（现行文字 = 设计档 §2.5 与 §3）

父侧裁定两件（第三件 `batch-reopen.mjs` 的区界复写认取舍、不动），落点全在设计档 `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md`，本批代码零触。

**① 终止态的两条出口同口径（判据 = 设计档 §5 R26）**

- 收窄造出的终态（某档 `§1` 状态行落在段头区外 ⇒ 值读 `unknown`）有两处拒文，读同一个值、判同一件事：
  冻结门 = `thincoder-core/agent-tools/batch-lifecycle.mjs` 的 `assertGateOpen`；段绑定拒面 = `thincoder-core/agent-tools/batch.mjs` 的 `append` 轨。
- 段绑定拒面现文教人「让建档人再写一次状态行」——对这个终态是假出路：写出的新行仍落在区外，用户照做一次、再撞一次。故措辞写死成同一句真话（点名「行在段头区外」+「移进 `## §1` 段头区」），逐字两条 = 设计档 §2.5「冻结门拒文 ∥ 段绑定拒面拒文」两段。
- 射程 = 一条用户可见的字符串：不新增分支、不改判据、不改判序、不改拒因；两出口只差首行标签与主语。落笔 = 实施轮下一笔（`thincoder-core/agent-tools/batch.mjs` 的 `append` 轨 `unknown` 分支）。
- 判据（R26 已扩到两出口）：同一夹具下 `status` 写 `§1` 拒 ∧ 绑定调用方 `append` 拒；两条拒文逐字含那两句；全仓 `.mjs` 实走 `Ask the record's creator to set the §1 status line` 命中 = 0；行移进段头区后同一 `status` 写通过。

**② 受影响坐标改符号名（不带行号）**

- 理由：行号随任何一笔注释增删漂移，而这一整批治的正是「同一事实两处写、一处漂」。坐标一律 = 仓根全路径 + 符号名 / 调用形。
- 设计档 §3 改面：受影响表 4 行（`thincoder-core/agent/live-batch.mjs` · `thincoder-core/agent-tools/batch-lifecycle.mjs` · `thincoder-core/agent-tools/batch.mjs` · `thincoder-core/ledger-close-proof.mjs`）→ 符号名 + 调用形；「8 个调用点」表由「坐标（含行号）」改为「所在符号」；`readBatchStatusLineRaw` ∥ `sectionHasStatusLine` 两行去行号；「重开合取只有一处」去行号（`status` 轨的 `… === "closed"` 一处）。
- 未改（本笔射程外，登记）：设计档 §2.1 / §2.10 / §2.5 / §3 表里仍有非本组读面的行号（如 `dispatch.mjs:115`、`batch-skeleton.mjs:164` / `:202` / `:176`、`batch-closeout.mjs:29` / `:105`、`batch.mjs:243`）——同一类漂移，留给下一次收正，不在本笔擅自扩面。

**③ 本段自身的同形实例已消**

- 本档 `§2` 段头区原有两条 `**状态行**：`（骨架残留 + 结论行）⇒ 读面取区内首命中 = 残留行 ⇒ 该段读 `null`。残留行已删，本段现读 `设计完成`。设计档 §2.5「区内多行 ⇒ 取区内首命中」的形状登记不变。

## §3 设计评审（评审子代理）
**状态行**：评审通过



### 轮次 1（评审子代理）

**对象**：段头区收窄的两个残余方向（台账 `#1977`）—— 定「缺省读面要不要一起收窄」。审阅面 = 批档 `§2` + 设计档 `§2.5` / `§4` 决策 25–26 / `§5` R24 / `§6` 两行 / `§3` 档位结论句。

### 五问逐条

- **① 方向 A 的现量（0 段）判为「解释」而非「量」**。三档形态我逐条实读，与设计席所述同形：`docs/batches/2026-10-28-rule-writing-sweep.md` 的 `### 轮次 2（评审子代理）` 之下紧跟 `**状态行**：评审通过`；`docs/batches/2026-10-28-sse-first-chunk-idle.md` 的 `### 轮次 1（评审子代理）` 之下 `**状态行**：评审通过（轮次 2 回评：…）`；`docs/batches/2026-10-28-product-text-sweep.md` 同形。
- **凭「它在轮次块里」不够。** 工具从不往块里写（`updateSectionStatusLine` 只改段头区；设计档自述「工具写的每一条段级状态行都落在这里」）⇒ 块内那一行必为手写；手写行是「真状态行」还是「引述」只能由散文判。
- 而设计档同节自认「已登记残余（不在本条射程）：段头区里的行分不出**是谁写的**」⇒ 把「块里 = 真状态行」与「引述行零实例」当成两条独立读数，实为同一份字节的两种说法。**不升 🔴**：③ 把两个方向一起关掉，读数 0 或 3 都不改决定。
- **② 纠正的方向对，遗留一个数没对齐**。实读 `thincoder-core/agent-tools/batch-skeleton.mjs`：`STATUS_WORDS` 只有 `1` / `2` / `3` / `5` 四项，`readSectionStatusWord` 首句即 `if (!words) return "无状态词"` ⇒ §4（15 段）/ §6（37 段）任何区都不成读数，52 段可扣；63−52 = 11，63/11 ≈ 5.7，自洽。
- 遗留：`259 档 / 1551 段 / 64 段 ⇒ 现盘 262 / 1567 / 63`，段数 +16 而命中数 −1；句中「形状不变，增量全来自本批之后新增的批档」只解释了增，没解释减。
- 可解释的成因就在本批自己身上：写面已收窄，任何一次 `status` 写都把行补进段头区 ⇒ 该段自行离开「段头区无行」类。写明它有用——它意味着残余池会随正常写入自行衰减。
- **③ 路线 ③ 正确；`sectionHasStatusLine` 例外也正确**。例外有代码实证：`thincoder-core/agent-tools/batch-lifecycle.mjs` 的 close 路径 `if (readBatchStatusLine(src) !== "open" && sectionHasStatusLine(src, 1)) assertGateOpen(src)`，而 `assertGateOpen` 对 `unknown` 抛「状态行不可解析或缺失」（fail-closed）；两者一并收窄会变成「无行 ⇒ 跳过门 ⇒ 放行」，正是设计席所写那条方向。**但该例外带出一个设计未写的终态**（见下表 #4）。
- **④ 「重开之后自愈」：机制成立，但不是验过的**。成立面：`statusPassPlan` 的 ③ 与 `done` 比、`updateSectionStatusLine` 缺行即在段头后补出，R4 / R24⑥ 已写成验收；重开侧 `readBatchStatusLine` 读 §1，三档 `§1` 的 `已收口` 行都在段头区（实读一致）⇒ 合取成立。未成立面：本轮零触代码，`收窄 → 重开 → 补一轮携 pass 的评审 → 再收口` 整链没有任何验收行走过（R4 走的是 append-then-green，不是 reopen-then-append），也没有一条可跑的命令。
- **⑤ 硬约束守住了**。仍宽读的只剩 `sectionHasStatusLine`（存在性；消费面 fail-closed ⇒ 宽读只多关门、不多放门）；`readSectionStatusWord` / `readBatchStatusLine` / `readBatchStatusLineRaw` 全落段头区；核销面经 `thincoder-core/ledger-close-proof.mjs` 与 `ledger-write-ops.mjs` 的机检同一条调用，全仓 grep 未发现第七处自解析状态行。⇒ **没有一条路径能让正文引述行被读成段级状态行的「值」**；唯一残余是它把 §1 推入 fail-closed（多拒一次写），方向偏安全。

### 本轮发现（🔴 0 · 🟡 9 · 🔵 3）

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Requirements / 证据 | 🟡 | 「方向 A 的实例 = 0」与「三处 = 评审当时写进块里的真状态行」是同一份字节的两次表述：工具从不往轮次块里写 ⇒ 块内行必为手写，而手写行是真状态行还是引述只能由散文判，设计档又自认「段头区里的行分不出是谁写的」。故 A=0 是解释，不是可复核的量。 | 把三处逐条判别依据写进读数表（块首第一行 + 括注即本轮结论），并把 A=0 标注为「按此解释」；同时写明「读数取 0 或 3 不改 ③ 的决定」，把决定与该读数解耦。 |
| 2 | Clarity / 读数对齐 | 🟡 | `262 / 1567 / 63` 对 `259 / 1551 / 64`：档 +3、段 +16 有解释，命中 −1 无解释；「增量全来自本批之后新增的批档」只覆盖增量。 | 补一句 −1 的成因（已落地的写面收窄：任何 `status` 写把行补进段头区 ⇒ 该段自动离开该类），并说明残余池随正常写入自行衰减。 |
| 3 | Acceptance | 🟡 | R1 / R2 写「复跑量法」，而量法本身 = `readSectionStatusWord(src, seg, "section")` vs `("header")`；`region` 正是本批要删的那个参数，删后两调同值、量法不可复跑。R1–R5 也未点任何可跑的文件或命令，`reopen → 补 pass 轮 → 再收口` 更无验收行。 | R1 / R2 改记为「本轮一次实测（记日期）」，或给删参后仍可复跑的对比形（与本地 `ZONE_END_RE` 复写版比对）；补一条验收行点名改动面测试文件（现盘相关档 = `test/integration/batch-status-auto-set.test.mjs`），并加一条 `reopen → append §3 携 pass → close` 的整链断言。 |
| 4 | Feasibility / 新终态 | 🟡 | 值读收窄 + 存在性网宽读 ⇒ 若某档 `§1` 状态行落在段头区外，值读成 `unknown`：status 路径 `if (!reopen) assertGateOpen(src)` 拒、close 路径 `readBatchStatusLine(src) !== "open" && sectionHasStatusLine(src, 1)` 也拒，而重开合取要 `readBatchStatusLine(src) === "closed"`（`unknown` 永不满足）⇒ 连「补出段头区那一行」的 `status` 写都被同一道门拦下，工具面无出路。今日 0 实例（`§1 = 0`）。 | 在边界或验收里写明这个终态与恢复路径（唯一出路 = 主 agent 手改档，把 `§1` 状态行移进段头区），并说明为何不值得为它加回落。 |
| 5 | Clarity / 受影响文件 | 🟡 | `readBatchStatusLine` 的收窄改动它的全部消费面，表里却只有 `batch-skeleton.mjs` 一行；实际消费点还有 `thincoder-core/agent/live-batch.mjs` 的 `if (readBatchStatusLine(src) === "open") return { open: true, error: null }`、`batch-lifecycle.mjs` 的 `const gate = readBatchStatusLine(src)` 与重开合取、`batch.mjs` 的 `const status = readBatchStatusLine(src)`；R5 只 grep `readSectionStatusWord` 的调用点。 | 受触表白名单补这三档为「零改、行为不变（判据 = §1 现量 0）、实施轮逐处复读」；R5 的 grep 同时覆盖两处读面。 |
| 6 | Clarity / 计数 | 🟡 | 批档 `§2` 写「六处门面（… · §1 冻结判据）与 §1 自有的两条读面（重开回执读原文）」，而 `§1 冻结判据` 已计在六处之内 ⇒ 实际新增的是 1 条（重开原文）；设计档决策 26 标题同形含此歧义，单源表实为 10 行收窄 + 1 行有意不收窄。 | 三处改成同一个数并一次写完（例：六处门面 + 1 条 `§1` 重开原文读面 = 7 处，`§1` 冻结判据已含在六处内），使实施清单与 R5 的 grep 逐条对得上。 |
| 7 | Document ownership / 档面洁净 | 🟡 | 设计档 `§2.5` 的「通过即置位 · 三合取 ③」仍写成 `readSectionStatusWord(src, 3, "header") !== STATUS_WORDS[3].done`，而同节另一处写「`statusResetPlan` / `statusPassPlan` 的显式 `"header"` 实参随之删去」⇒ 同一节内一条规范句描述的是删参前的调用形，落地后读者与用例会照它写。 | 把该 ③ 改成删参后的形（`readSectionStatusWord(src, 3) !== STATUS_WORDS[3].done`），与同节「`region` 参数退场」同笔对齐。 |
| 8 | Clarity / 单源句 | 🟡 | 「段级状态行 = **段头区**内那一行 `**状态行**：`」（单数）未定「区内两行」的处置，而读面取区内首个命中（`lines.map(...).find(Boolean)`）。本档 §2 正是该形：段头区内先有骨架残留 `**状态行**：（eng-designer 写入时更新）`、其后才是 `**状态行**：设计完成（2026-11-02 · 结论 = 选路线 ③；代码零触，下一轮实施）` ⇒ 该段读成 `null`，结论行对每个读面都不可见。 | 单源表补一行定义「区内多行」的处置（取首行 ⇒ 写入面须在有第二行时报错或合并；或取末行），并把本档 §2 的同形现状作为该条第一个实例记在读数表旁（批档零改，只登记）。 |
| 9 | Methodology / 先例 | 🟡 | 决策 26 没有「最近先例」行：本档既有该纪律（档级一处、`§2.5` 的 `statusResetPlan` 一处），而本决策的直接先例 = 同档决策 25（写面收窄），对齐 / 偏离未成句。 | 给决策 26 补一行：先例 = 本档决策 25（写面已落段头区）；对齐 = 同一定位面与同一个 `ZONE_END_RE`；偏离 = 本决策把门面与 `§1` 第 7 处读面一并拉过去，并让 `region` 退场。 |
| 10 | Scope / 上抛处置 | 🟡 | 上抛项「段头区的行分不出是谁写的」只落在设计档「已登记残余（不在本条射程）」与批档 `[上抛·待裁]`，没有台账行 ⇒ 任何在飞扫描都扫不到它；且它不是假设形——本档 §2 已给出一个活实例（手写行 vs 工具插入点，读面取到的是残留行）。 | 另立一条台账行（新债，不带 `ledger` 自开）：标题「段头区状态行的作者不可判」，`evidence` 指到本档 §2 的那个实例与设计档残余句。理由：设计档的残余句没有主人，台账是唯一枚举面。 |
| 11 | 档位结论 | 🔵 | 实测六档均 ≤ 500（见下），「各档均不跨档位」成立；但 `batch-skeleton.mjs` 恰在软线，全部余量就是设计档那句「注释行等量压缩抵掉净增」。 | 把这次改动做成净负（删参数 + 删其 JSDoc 段），别用「等量压缩」当承诺；R5 之外加一条「该档行数不高于改前」的读数。 |
| 12 | 档面滞后 | 🔵 | 设计档 `§9` 的「通过即置位」块仍把 `27-1` 列在「新增行（编号先定在 `test/RTM.md`，再写用例标题）」之下，而 `test/RTM.md` 已实载该行（`| 27-1 | 带 `batchDoc` 绑定的设计评审对**骨架原形批档**…`，状态 `待执行`）⇒ 该块与它声称已读的 RTM 不同步（不影响本轮「破 0 / 冗余 0 / 缺 0」的结论）。 | 把该块改为「27-1 已在册（`待执行`）」；后续 delta 块一律先读 RTM 现状再写「新增」。 |

### 计数与裁定

- **🔴 0 · 🟡 9 · 🔵 3**。
- 无 🔴：设计档与批档同在盘、判据单源、受影响文件面齐（除 #5 的白名单）、RTM delta 有理由、硬约束守住；🟡 均为可改进项，不挡本轮。
- 受触六档实测行数（本轮自量）：`thincoder-core/agent-tools/batch-skeleton.mjs` 500 · `design-token.mjs` 269 · `batch-closeout.mjs` 222 · `batch-reopen.mjs` 142 · `ledger-close-proof.mjs` 63 · `batch-read.mjs` 37 ⇒ 均 ≤ 500。

**VERDICT: pass**

### 轮次 2（评审子代理）

**对象**：第 2 轮 —— 只核上轮 12 条（🔴 0 · 🟡 9 · 🔵 3）的修正，不重开判据、不挖新问题。审阅面 = 批档 `docs/batches/2026-11-02-status-word-window-close.md` + 设计档 `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md`（全档）。代码档不在本次审阅面 ⇒ 涉及代码的断言一律标 unverified。

### 逐条核对（上轮 12 条）

- **🟡1**：改写够诚实（设计档逐条点名三处并加了「为什么是解释而不是量」）；免责句本身成立（③ 关两个方向，A 的量只定代价）。**但被 §1 的前提句抵消**（见表 #1）。
- **🟡2**：是推断，且没标 —— 全文只有机制句，没有点名从 64 掉到 63 的那一段（见表 #2）。
- **🟡3**：R1/R2 已改成「2026-11-02 一次实测 + 复跑形」，但复跑形不足以复现 11（表 #3）；R25 末断言不可判（表 #4）；R24 ⑦ 点名了文件，但与 §9 的「27-1 = 新增行」互相矛盾（表 #5）。
- **🟡4**：「今日 0 实例」有量（`§1` 段位现量 0 段，2026-11-02），这一半成立；**登记不够**：无验收行、§7 边界不在、拒文不写唯一出路（表 #6）。
- **🟡5**：白名单仍不闭合 —— 总词「三处」对 4 档 6 个调用点，且重开合取出现两个坐标（`batch-lifecycle.mjs:462` vs `:234`）（表 #7）；R5 的两处 grep 能守住大半，但漏第三个读面名（表 #12）。
- **🟡6**：1+2+6+1 = 10 对；11 行单源表逐行对得上（写面 1 · 触发 2 · 门面 6 · §1 重开原文 1 = 10 + 第 11 行有意不收窄）。**导语仍自相矛盾**（表 #8）。
- **🟡7**：已修；全档 grep 后除「删参描述」与「本轮量法」两句外，无带 `"header"` / `"section"` 实参的规范调用形 ⇒ 本条闭。
- **🟡8**：取首行 + 登记的取舍站得住（不加分支、读写面同取首行、遮蔽方向 fail-closed）；登记不完整（同形计数「未量」、无信号）（表 #9）。
- **🟡9**：已补，对齐 / 偏离成句；缺第三个坐标（先例批次）（表 #10）。
- **🟡10（顺带）**：「已立台账 #1980，父侧裁」已记成已决句；台账行本体不在审阅面 ⇒ unverified，不另立条。
- **🔵11**：档位结论改成「落法做成净负」+ R24 ⑧ 都在，够；「改前实测 500 行」是作者设计时读数，代码档不在本次审阅面 ⇒ 无法复核，unverified。
- **🔵12**：「历史 delta 块不追改」把那句失效指令留在规范面，与 R24 ⑦ 撞成一处矛盾 ⇒ 并入表 #5。
- **另两处**：R4「四处 → 五处」只改了一处（表 #11）；上抛项已改已决句（见 🟡10）。

### 本轮发现（🔴 0 · 🟡 9 · 🔵 3）

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | 证据 / 免责句 | 🟡 | 免责句与 §1 的前提句互相抵消：§2 新增「**读数取 0 或 3 都不改路线 ③**（决定与读数解耦）」，而 §1「本批要裁的」第 1 条仍写「**这是决定收不收的前提。**」——同一份批档一处说 A 的量决定收不收、一处说它不改决定。 | 二者留一：把 §1 第 1 条改成「A 的量只定代价大小，收不收由『触发面 ∥ 门面必须同区』决定」，或撤掉 §2 的解耦句。 |
| 2 | 读数成因 | 🟡 | 「命中 −1 = 已落的写面收窄在起作用」是推断，既未标为推断、也未逐段取证：只给了机制句，没点名那一个从 64 掉到 63 的段，也没有排除替代成因（手工改档 ∥ 档被删）；而同节别处要求「量法写死」「一次实测」。 | 标「推断（未逐段取证）」并给出取证形：列出 #1972 那 64 段中现在读不到的那一段（档名 + 段位 + `§1` 是否 `已收口`）；给不出就降为可能成因。 |
| 3 | 验收 / 复跑形 | 🟡 | 复跑形不足以复现 11：它只说「两处各取一次 `STATUS_LINE_RE` 值后比较」，而 11 还依赖两条没写的子句——（a）词条过滤（§4 / §6 无 `STATUS_WORDS` 条目，按裸文本比照样命中那 52 段 ⇒ 复跑得 63 而非 11）；（b）归一化（原量法比的是 `readSectionStatusWord` 的返回值，复跑比的是裸行文本；`评审完成` 别名与带括注的 `进行中（第 N 轮打回）` 两种比法可能不等）。另 `STATUS_LINE_RE` 怎么取（导出 ∥ 本地复写）未写。 | 复跑形补三句：词条过滤照「63 与 11 的差」那条；比较对象 = 词表归一后的值（或明说比裸文本并给出预期新数）；`STATUS_LINE_RE` 的取法。 |
| 4 | 验收 / R25 夹具 | 🟡 | R25 末断言不可判：「夹具 = `§2.5` 改判清单三档的同形 … 该档行的 `ledger close` 通过」——那三档的行按同节改判清单是 `已核销`，而 §2.13 定「`已核销`（核销后重开）**不动**，终态」、R15 断言「行零改」⇒ 照三档本体搭夹具，最后一步必不通过；换一笔新行搭夹具则能跑，但已不是「改判清单三档」的现成本面。夹具的行状态没写死，成与不成都取决于读法。 | R25 补一句夹具的行状态：新档自开行（`在途` → 收口 `待核销` → 重开回收 `在途`），并点明「三档本体的行是 `已核销`，再核销须另立新行（§2.13）」；改判清单那句「重开这三档再收口 / 再核销 … 自愈」同笔点明。 |
| 5 | 验收 / 27-1 现状 | 🟡 | 27-1 的现状在同一档里被写成两种：R24 ⑦ 用现在时写「其 27-1 行断言『评审写一笔即签字』」（即该文件今天已带这条断言），而 §9 把 27-1 列在「新增行（编号先定在 `test/RTM.md`，再写用例标题 …）」、落法写「由实施轮落（本档不改 `test/`）」；新加的「历史 delta 块不追改」句又把矛盾留在规范面。实施轮照 R24 ⑦ 跑会去跑一条今天不存在的断言。 | 把事实钉在一处：27-1 现态（`test/RTM.md` 在册 = 待执行，用例随实施轮落）；R24 ⑦ 改成「实施轮落的 `test/integration/batch-status-auto-set.test.mjs` 之 27-1 用例」；「不追改」句随之可删，或把 27-1 那块就地改成「已在册（待执行）」。 |
| 6 | 验收 / 终态登记 | 🟡 | 「收窄的一个终态（登记，不加回落）」只落在设计档 §2.5 段体：§7 边界无此条、§5 验收无此行；而用户真正看到的 `assertGateOpen` 拒文（「状态行不可解析或缺失」）不写唯一出路（手改档）⇒ 实施轮照现文落地 = 登记了，但被卡住的人在界面上仍无出路。「今日实例 = 0」有量，这一半成立。 | 补一条验收行断言该终态的拒文点名出路（「`§1` 状态行在段头区外，请移进段头区」），或在 §7 边界记一行；拒文不改则登记只服务读档的人。 |
| 7 | 受影响文件 / 白名单 | 🟡 | 白名单仍不闭合，计数也对不上枚举：① 「**三处 `readBatchStatusLine` 消费面**」后面枚举的是 4 档 6 个调用点（`thincoder-core/agent/live-batch.mjs:71` · `batch-lifecycle.mjs` `:118` / `:234` / `:283` · `batch.mjs:211`，另加 `ledger-close-proof.mjs:50`「同此」）；② 重开合取那一处给了两个坐标——§2.13 说布尔 `reopen` 在 `batch-lifecycle.mjs:462`，白名单写的是 `:234`（重开合取）⇒ 要么漏了 `:462`（`readBatchStatusLine(src) === "closed"`），要么同一处记了两遍。「有没有第七个消费方」因此答不了。 | 按「一处坐标 = 一行」重列（去掉「三处」这类总词，或让总词等于行数），并把 `batch-lifecycle.mjs:462` 单列一行；重开合取只留一个坐标。 |
| 8 | 计数 / 单源表导语 | 🟡 | 数全对了（1+2+6+1 = 10；11 行表逐行对得上：写面 1 · 触发 2 · 门面 6 · §1 重开原文 1 = 10，第 11 行 `sectionHasStatusLine` 有意不收窄），但导语仍自相矛盾：「**上表 10 处收窄、1 处有意不收窄，读的都是段头区**」——「1 处有意不收窄」读的是段内，却被这句一起算进「都读段头区」。上轮要修的「导语与末行矛盾」只修了一半。 | 导语去掉「读的都是段头区」或改成「前 10 行读段头区」；末句「第 11 行 … 有意留段内宽读」保留即自洽。 |
| 9 | 取舍 / 区内多行 | 🟡 | 「取首行 + 登记」的取舍站得住（不加分支、读写面同取首行、遮蔽方向 fail-closed），但登记不完整：后果已明写「该段对所有读面读成 `null`」，而该形的全仓计数写着「同形全仓计数未量」——同一节对方向 A 的要求是「解释不是量」，这里对一条正在生效的遮蔽形态却停在「未量」，且遮蔽时没有任何信号（本档 §2 自己就是实例：结论行对每个读面不可见）。 | 保留取首行，补两件：① 该形的全仓计数（同一次实测口径）；② 一条可观察信号（写面在区内已有第二行时报错或合并，或在 `batch list` ∥ 拒文里点名「段头区有多行」）。②与表 #6 是同一终态的两面，可并为一条。 |
| 10 | 先例行 | 🔵 | 「最近先例」已补、对齐 / 偏离已成句，但缺第三个坐标：给了实现坐标（`ZONE_END_RE`，`batch-skeleton.mjs:77`）与设计档坐标（决策 25 ∥ §2.5），没给先例批次号（#1972 就在同节对比里）。 | 先例行补「先例批 = #1972」，三个坐标齐。 |
| 11 | 计数 / 翻绿数 | 🔵 | 四处 → 五处只改了一处：批档 §2 R4 写「五处翻绿」，设计档 §6 用例表同一情形仍写「四处同刻翻绿」；R24 ⑥ 写「①–⑤ 全部翻绿」（五）。若「四处」指决策 26「被拒 · 路线①」里那四个读值门（不含 `batch/list`），那「五处」就把列举面算进了「翻绿」——两处必须同一套数的定义。 | 定一套：两处都写「①–⑤」（含 `batch/list`），或都写「四个读值门翻绿 + 列举面显示该词」，并把设计档 §6 那一行同笔对齐。 |
| 12 | 验收 / R5 grep 面 | 🔵 | R5 的「两处读面同一次 grep」盖住 `readSectionStatusWord` ∥ `readBatchStatusLine`，但单源表第 10 行的第三个读面名 `readBatchStatusLineRaw`（`batch-reopen.mjs`）不在 grep 面；「无 `region` 形参」是定义面的事实，调用点 grep 也照不出来。 | R5 的 grep 面加 `readBatchStatusLineRaw`，并把「`region` 形参已删」改成对 `batch-skeleton.mjs` 定义处的一次实读。 |

### 计数与裁定

- **🔴 0 · 🟡 9 · 🔵 3**。
- 无 🔴：上轮 12 条的修正在盘、方向对（🟡7 已闭，🟡1/2/3/4/5/6/8/9 的修正都落了笔），剩余九条均为「修正落了一半」或「一处没对齐」，不挡本轮；三条 🔵 是缺口与数定义。
- 复跑面：代码档不在本次审阅面 ⇒ 白名单完整性与「改前实测 500 行」两处记 unverified；项目无独立标准文档、无文档地图 ⇒ 方法学与档归属按 Project Guide（AGENTS.md）+ 判据判，已据此作答。

**VERDICT: pass**

## §4 用户批准（主 agent）

## 4. 用户批准（主 agent）

**批准对象**：段级状态行的读面收窄到段头区、与写面合成同一取值区；`region` 形参退场；两条用户可见拒文对齐。

**批准依据链（全部在盘可查）**：

| 环节 | 事实 |
|---|---|
| 设计评审 | 三轮；第 2 轮 `VERDICT: pass`（🔴 0 · 🟡 9 · 🔵 3），第 3 修正轮为实施清路 |
| —— 轮次块 | 批档 §3 的两轮块，含核验表 + 计数 + VERDICT |
| —— 签字 | §3 状态行 = `评审通过`（工具随 pass 轮次自动置位；第 2 轮的置位未被本轮写盘证明 —— 评审自己报「写前已是 `评审通过`，本笔不可能触发」） |
| 授权凭据 | 评审结算回执 `Approved. Pass this exact token to eng-coder` —— **凭据值按纪律不入档** |
| 用户批准 | 用户原话「**你拿1975-77这三项试试新代码呗**」（2026-11-02 01:32） |

**批准范围**：§2 所述读面收窄 + `region` 退场 + 两出口拒文对齐。**不在批准范围且已登记**：`batch-reopen.mjs` 的区界复写保留（§6.5）· 设计档内非本组读面的行号未收正（§6.5 清单）。

**一条如实记**：本批的 §3 自动置位**没有被独立证明过一次**——第 1 轮判 changes-required（不该置位），第 2 轮写前已是 `评审通过`（置位条件不成立）。**真正的首证在 `#1976`：评审从盘上字节读到状态行由同一次 append 补出。**

## §5 实施记录（eng-coder）
**状态行**：实施完成（2026-11-02 · 段头区收窄落地）


### 交付对照（判据单源 = 设计档 `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` §2.5 单源表 / §5 R24 · R26）

| 条目 | 落点与读数 | 状态 |
|---|---|---|
| R1 方向 A 现量 | 非批档域（扣 `docs/batches/**` 与 `_archive`）§3「段头区无行 ∧ 区外有行」实走全仓 `.md` = **0 段** | ✅ 完成 |
| R2 #1972 读数复核 | 同一量法复跑：**262 档 / 1567 段 / 命中 63**（§3=3 · §5=8 · §4=15 · §6=37）；两区取值不等 **11 段** = §3 三档 + §5 八档，逐档名与设计档改判清单一一对上 | ✅ 完成 |
| R3 三条路线择一 | 设计档 §4 决策 26 在盘（路线 ③；被拒段含路线① ∥ 路线②及各自理由）——本笔零改 | ✅ 完成 |
| R4 五处门面同拒 + 翻绿 | 批内单测档「R4 五处门面」例：`append §5` 拒（R-G2）· `close` 拒（R-G1）· `ledger close` 拒（R-L3）· 派评审拒签（`status-not-passed`）· `batch list` 该档 §3 空；同档落一笔携 `VERDICT: pass` 的 §3 ⇒ 段头区出现 `**状态行**：评审通过`、五处翻绿、引述行字节不变 | ✅ 完成 |
| R4 追加格（R26） | `§1` 状态行落在段头区外 ⇒ `status` 拒，拒文含「inside the section header zone」与「move it up under `## §1`」；把该行移进段头区后同一写通过；不加任何回落 | ✅ 完成 |
| R5 单源收窄 | `readSectionStatusWord(src, seg)` 只剩一个取值区；全仓 `.mjs` 实走：无 `"section"` / `"header"` 实参、无 `region` 形参；`readBatchStatusLine` 只收一个实参；`sectionHasStatusLine` 仍段内宽读；`thincoder-core/agent-tools/batch-skeleton.mjs` **494 行 ≤ 改前 500**（净负） | ✅ 完成 |

### 改动清单（逐档）

| 档 | 变化 |
|---|---|
| `thincoder-core/agent-tools/batch-skeleton.mjs` | `readSectionStatusWord` 删 `region` 形参（未知区拒绝支随之退场）⇒ 只读段头区；`readBatchStatusLine` 改由 `sectionHeaderZoneLines(src, 1)` 取段头区；`statusResetPlan` / `statusPassPlan` 的 `"header"` 实参删去；`sectionHasStatusLine` 零改 |
| `thincoder-core/agent-tools/batch-reopen.mjs` | `readBatchStatusLineRaw` 解析体收窄到 §1 段头区（回执原文取真段级行）；顺带删去档内死导入 `readBatchStatusLine` |
| `thincoder-core/agent-tools/batch-lifecycle.mjs` | `assertGateOpen` 的 `unknown` 拒文改为设计档 §2.5 / R26 逐字（点名「行在段头区外」与「移进段头区」）；顺带删去档内死导入 `STATUS_LINE_RE` / `sectionHeaderRe`，档头单源句同笔收正 |
| `docs/batches/2026-11-02-status-word-window-close.test.mjs` | 本批单元测试档（6 例）：R1 全仓读数 · R4 取值区两条 · R4 五处门面 · R26 终态拒文 · R5 形面。收口前删除，读数留本节 |

### 零代码改动的档（判据 = 调用形不带区域实参，取值区随单源收窄）

- `thincoder-core/agent-tools/batch-closeout.mjs`（§5 门判据 1 ∥ 收口门 §3 臂）· `thincoder-core/agent-tools/design-token.mjs`（签发面判据 2）· `thincoder-core/agent-tools/batch-read.mjs`（`batch/list` 列举面）· `thincoder-core/ledger-close-proof.mjs`（核销门③）：四处都写 `readSectionStatusWord(src, 3)`，`region` 退场后自动读段头区，签名与拒因零改。
- `readBatchStatusLine` 的 8 个消费点逐处复读：`thincoder-core/agent/live-batch.mjs:71` · `thincoder-core/agent-tools/batch-lifecycle.mjs:103` / `:120` / `:236` / `:266` / `:285` · `thincoder-core/agent-tools/batch.mjs:211` · `thincoder-core/ledger-close-proof.mjs:50`——调用形与三态返回值零变；`§1` 段位现量 0 段 ⇒ 行为不变。

### 读数（本轮实跑）

- 本批单元测试档：**6/6 绿** —— `node --test docs/batches/2026-11-02-status-word-window-close.test.mjs`（R1 全仓 census 0 命中 · R4 五处门面先拒后翻绿 · R26 拒文两句 · R5 形面）。
- 受影响集成面各跑一次，全绿：`test/integration/batch-status-auto-set.test.mjs` 1/1 · `test/integration/ledger-close-proof.test.mjs` 1/1 · `test/integration/batch-close-gate.test.mjs` 8/8 · `test/integration/batch-gates-reanchor.test.mjs` 9/9 · `test/integration/batch-live-batch-lock.test.mjs` 6/6 · `test/integration/advisor-record-gate.test.mjs` 2/2。
- 整包语法：`node thincoder-core/scripts/check-syntax.mjs` ⇒ **287 file(s) OK**。
- 集成集现量：`test/RTM.md` 在册 **87 行**（本批零新增行，设计档 §9 的答复 = 破 0 / 冗余 0 / 缺 0），在 ≈50–100 窗内。

### 决策与偏离（如实记）

- **`batch-reopen.mjs` 的区界就地复写（残余，未改）**：`readBatchStatusLineRaw` 用本地 `/^#{2,}/m` 切区，而这条判据的单源是骨架档的 `ZONE_END_RE`。设计档 §3 明写本批「不新开档、不新增导出」，导出该常量 = 越设计，故按「就地复写 + 同源注释」落；两侧今日同一条正则。留给后续收窄轮。
- **`thincoder-core/agent-tools/batch.mjs` 的第二条 `unknown` 拒文（面外，未改）**：子代理 append 面另有一份「状态行不可解析或缺失」串，未随本笔点名段头区（它给的出路仍是「让建档人再写一次状态行」）。设计档 §2.5 把 R26 的落点钉在 `assertGateOpen` 一处 ⇒ 本笔未越设计去改面外档。见下「上抛」。
- **R1 的 census 做成常驻断言（有意）**：批档 R1 的判据是「本轮一次实测」，本笔把它落成批内单测的一例（全仓 `.md` 实走），使读数可复跑；失败信息已标明「全仓读数，非代码回归」。该档收口即删，不留长期脆弱面。

### 内部审计与代码评审（终端态 = clean）

- **内部审计（只读 explore，对设计逐条核）**：**AUDIT: clean**，0 偏离。10 处读面逐处点名 · `sectionHasStatusLine` 未动 · 全仓 `region` 零命中 · `readBatchStatusLineRaw` 消费面唯一 · R26 拒文逐字对上 · 494 ≤ 500。
- **内部代码评审（advisor `type:"code"`）**：🔴 0 · 🟡 3 · 🔵 4，**VERDICT: pass**；判据面 = 三档代码 + 批内单测档，设计档与批档作背景。
- **修正轮 1 轮（3 条落地，2 条按设计不动并上抛）**：① 删两档死导入（`batch-lifecycle.mjs` 的 `STATUS_LINE_RE` / `sectionHeaderRe`、`batch-reopen.mjs` 的 `readBatchStatusLine`）并收正档头单源句；② R5 的调用点面由手写五档名单改成**全仓 `.mjs` 实走**（原名单恰好漏掉改动所在的 `batch-lifecycle.mjs` / `batch-reopen.mjs` / `batch.mjs` / `live-batch.mjs`）；③ R1 census 的失败信息标「全仓读数，非代码回归」。未改并上抛 = 上文两条残余（区界复写 ∥ 面外拒文）。
- **终端态**：clean（无未闭 🔴；余项均为父侧可裁的残余，已入下节）。

### 上抛

- **[上抛·待裁] `batch.mjs` 的 append 面拒文要不要对齐**：同一道「§1 状态行不可解析/缺失」门现有两条并存拒文，只有 `assertGateOpen` 那条点名段头区与出路。设计档 §2.5 只钉了这一处；对齐 = 改面外产品码 + 动设计档判据，属新语义，本批未做。
- **[上抛·知会] 设计档 §3 的行号坐标随本笔后移 2 行**：`readBatchStatusLine` 的四个消费点与 `readBatchStatusLineRaw` 因新增 / 调整注释各后移，表内「4 档 8 个调用点」与逐条调用形仍逐字成立。收正归设计档（eng-designer 笔）；本节坐标以本笔实读为准。
- **[上抛·知会] 本批单元测试档的删除时点**：收口门的零留存判据会因该档仍在盘而拒收口，故 `close` 之前必须先删 `docs/batches/2026-11-02-status-word-window-close.test.mjs`；读数已留本节。

### 零留存落地（本轮收尾）

- 本批单元测试档已于交付末删除：`docs/batches/2026-11-02-status-word-window-close.test.mjs`（读数已在「读数（本轮实跑）」一节，删除后盘上无该档 ⇒ 收口门的零留存判据成立）。
- 上节「上抛」第三条的删除时点因此已满足；父侧收口不必再删，直接跑收口链即可。

### 收尾笔：段绑定拒面拒文对齐（R26 两出口同口径）

- **改动**：`thincoder-core/agent-tools/batch.mjs` 的 `append` 轨 `status === "unknown"` 分支拒文换成设计档 §2.5「段绑定拒面拒文」逐字——删掉「让建档人再写一次状态行」这条假出路（写出的新行仍落在段头区外），改点名「行在段头区外」+「移进 `## §1` 段头区」。**一行改动**，无新增分支 / 判据 / 判序 / 拒因。
- **两出口同口径（实读比对）**：`assertGateOpen` 那条与本笔这条，剥去首行标签（`batch:` ∥ `batch_segment:`）与主语（`the record` ∥ `the bound batch record`）后**逐字相等**；长度差 20 = `"_segment"`(8) + `"bound batch "`(12)，无第二处差异。
- **可达性（实跑）**：`readBatchStatusLine` 喂两例 —— §1 状态行在段头区内 ⇒ `"open"`；只在 `###` 之下 ⇒ `"unknown"` ⇒ 该分支确会走到（本档取值 = `const status = readBatchStatusLine(src)`，判支 = `if (status === "unknown")`）。
- **读数 ①**：全仓 `**/*.mjs` grep `Ask the record's creator to set the §1 status line` ⇒ **0**。**非源码面的一句如实交代**：`thincoder-desktop/dist-r3/win-unpacked/resources/app.asar` 与 `dist-r4` 同路径两处预构建包里仍嵌着旧串——构建产物（非 `.mjs`、非本轮写域），下次打包自然消。R26 判据面 = 全仓 `.mjs`，成立。
- **读数 ②**：新措辞在该档命中 **1**（`thincoder-core/agent-tools/batch.mjs`）。全仓 `.mjs` 带该句中段 `inside the section header zone whose value contains` 的只有两档 = 本档 + `thincoder-core/agent-tools/batch-lifecycle.mjs`（冻结门），正是设计档 §2.5 定的两个出口，无第三份措辞。
- **读数 ③**：受影响集成面各跑一次，全绿 —— `test/integration/batch-status-auto-set.test.mjs` 1/1 · `batch-close-gate` 8/8 · `batch-gates-reanchor` 8/8 · `batch-live-batch-lock` 6/6 · `ledger-close-proof` 1/1（fail 全 0）。
- **语法**：`node thincoder-core/scripts/check-syntax.mjs` ⇒ **287 file(s) OK**。
- **一处读数更正（本节上文）**：上文「受影响集成面各跑一次，全绿」把 `test/integration/batch-gates-reanchor.test.mjs` 记为 9/9；该档实有 8 个顶层 `test(`（14-1…14-8），本轮实测 **8/8**。

## §6 验证与收口（父代理）

## 6. 验证与收口（父代理）

### 6.1 本批交付了什么

段级状态行的**读面**收窄到段头区，与写面合成同一个取值区；`region` 形参退场。`sectionHasStatusLine` **有意不收窄**（存在性网仍段内宽读，与判值面合成 fail-closed）。另收正两条用户可见拒文（`assertGateOpen` ∥ `batch.mjs` 的 `append` 轨），使新造的终态有真出路。

### 6.2 读数（父侧本轮实跑）

| 项 | 命令 / 口径 | 读数 |
|---|---|---|
| **集成面（收口门）** | `node --test "test/integration/*.test.mjs"` | **tests 94 · pass 94 · fail 0** |
| 单测（收口即删） | `node --test docs/batches/2026-11-02-status-word-window-close.test.mjs` | **6 / 6 绿**；该档**已删**（盘上已核） |
| 受影响集成面 | 五档各一次 | `batch-status-auto-set` 1/1 · `batch-close-gate` 8/8 · `batch-gates-reanchor` **8/8** · `batch-live-batch-lock` 6/6 · `ledger-close-proof` 1/1 |
| 语法面 | `node thincoder-core/scripts/check-syntax.mjs` | **287 file(s) OK** |
| R1 方向 A 现量 | 非批档域 §3「段头区无行 ∧ 区外有行」 | **0 段** |
| R2 全量复跑 | 同一量法 | **262 档 / 1567 段 / 命中 63**；两区取值不等 **11 段**，与改判清单一一对上 |
| R5 形面 | 全仓 `.mjs` 实走 | 无 `"section"` / `"header"` 实参、无 `region` 形参；`readSectionStatusWord.length = 2` |
| 档位 | `batch-skeleton.mjs` | **500 → 494**（净负，R24 ⑧ 达标） |

### 6.3 两处旧读数被实施轮改正（如实记账）

- **`batch-gates-reanchor` 记 9/9，实为 8 个顶层 `test(` ⇒ 8/8。** 实施轮在 §5 末尾 append 一行更正（未回改原句，append-only 纪律）。
- **「旧措辞死透」只对源码面成立**：`thincoder-desktop/dist-r3/win-unpacked/resources/app.asar` 与 `dist-r4` 同路径两处**预构建包**里仍嵌着旧串。它们是构建产物（非 `.mjs`），R26 的判据面写的就是「全仓 `.mjs`」，那一面成立；产物面要干净须重跑 desktop 打包，属另一件事。

### 6.4 过程中真修掉的两个实例

- **`#1980` 的第一个活实例**：本档 §2 段头区原有两条 `**状态行**：`（骨架残留 + 结论行）⇒ 读面取首命中 = 残留 ⇒ **该段读 `null`**；删掉残留后 §2 现读 `设计完成`。
- **拒文射程从一处扩到两出口**：同一道门原有两条并存拒文，`batch.mjs` 那条教人「让建档人再写一次状态行」——**对新终态是假出路**（写出的新行仍落在段头区外）。已对齐为同一句真话：剥去首行标签与主语后**逐字相等**，长度差 20 = 两个标签的字节数。

### 6.5 没做（如实）

- **`batch-reopen.mjs` 的 `/^#{2,}/m` 就地复写保留**：导出 `ZONE_END_JRE` 会违反 §3「不新增导出」⇒ 保留复写 + 同源注释，两侧今日同一条正则。**父侧裁：认这个取舍。**
- **设计档 §2.1 / §2.10 / §2.5 / §3 表里仍有非本组读面的行号**（`dispatch.mjs:115` · `batch-skeleton.mjs:164` / `:202` · `batch-closeout.mjs:29` / `:105` · `batch.mjs:243`）——同一类漂移，设计席**未擅自扩面**，已交出清单留待下一次收正。

### 6.6 集成面

本批**不新增、不改写**任何集成用例（设计档 §9 的答复 = 破 0 / 冗余 0 / 缺 0）；`test/RTM.md` 零改。

### 6.7 收口结论

设计三轮过审（9 🟡 → 9 🟡 → pass）、实施一轮 + 两轮修正、内部审计 `clean`、内部代码评审 `pass`（🔴 0）、父侧集成面 94/94、单测档已删、两处旧读数如实更正、三笔上抛全部处置或留清单。**本批收口。**
