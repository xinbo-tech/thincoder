# 2026-10-26 · 核销机检
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-26 · 来源 = 用户 2026-10-26 11:54「给台账核销加机检，核销时需要凭 designToken 和批档校验，并且要检查批档是否执行完毕」。
> 台账 = #1807（LEDGER · 归批）。前情 = 2026-10-26-doc-check-sentence-fix.md（已收口 2026-10-26）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-26
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**需求来源**：用户 2026-10-26 11:54（逐字）

> 鉴于你走轻通道经常跳过全链，所以，我希望给台账核销加机检，核销时需要凭 designToken 和批档校验，并且要检查批档是否执行完毕。

11:58 补（逐字）：

> 轻通道直改以后，代码和文档会失步，所以才必须走 eng-designer 补齐文档，明白这道理了吗？这个最好也补在提示词里关于轻通道收口要走全链的 why 里。

11:59 答边界（逐字）：

> 存量不管，只管新增。

**需求档落点**：`docs/core/requirements/ENGINEERING-MODE-V2-SPEC-LEDGER.md` §② 功能点 11（F-LX4）+ 验收 AC-M2-34 / AC-M2-35（父侧已写）。

**这条链本来就是一体的**

台账行 	ask_book → 批档 → 批档收口（含设计评审）→ 收口时 token 已签发。

所以核销只验一件事：**该行的批档走完了这条链**。落到机判是两问——

- 批档在盘且 §1 = 已收口：链走到了终点；
- 该批档在 token 槽有归属记录：终点处确实签发过凭证。

前一条问「走完没有」，后一条问「凭证是不是真的」。同一件事的两面，不是两组独立条件。

**已核实的现状事实（父侧实读，设计席可直接用）**

- `design-slots` 当前 21 槽，`batch=—` 全空——历史 design 评审的 `documents` 里没放批档，归属不成立。**这是存量，按用户令不动。**
- `batchAbsPath`（`thincoder-core/agent-tools/design-slots.mjs:100-115`）：文档集里**恰好一份**批档 ⇒ 返回其绝对路径；不含 ∥ 多份 ⇒ `null`（机制明写「不猜」）。
- `readBatchStatusLine` 住 `thincoder-core/agent-tools/batch-skeleton.mjs`（`agent/light-round.mjs:22` 已在用）。
- 现有镚：`ROUND_MARKER = "收尾链待跑"`（`ledger-db.mjs:139`），消费面 `agent/light-round.mjs`（开笔前）+ `ledger-cmd.mjs`（核销标记门）。**本批不动它**——它管开笔前，本项管核销时。

**边界**

- 只对**新增**核销生效；存量已核销行不回改。
- 归属判据沿用现有 `batchAbsPath`，**不新增输入**（多份 = 无归属 = 拒，不猜）。
- 不改「收尾链待跑」现有机械牙。
- 不改六态迁移表。
- 本批含提示词 why 一句（`thincoder-core/prompts/persona-engineering.md` 轻通道收口段），其余提示词零触。

**要求设计席回答的**

1. 三件校验落在哪个函数（`ledgerClose` ∥ `ledger-cmd.mjs` 入口 ∥ 两者）？为什么选那里。
2. ③ 的反查怎么走：从批档路径找 token 槽，还是从槽找批档？槽是内存 Map + 持久化文件两形，读哪个。
3. 拒写时的报错文案（要点名缺哪件，且不泄露 token 值）。
4. 存量零影响的实现保证（怎么做到「只管新增」）。
5. 提示词 why 落在哪一节、怎么写（英文面，落笔是 eng-coder）。

**口径更正（父侧 · 用户 2026-10-26 12:06 指出）**

> 你只要管「已核销」就可以了，为啥要管是从哪里到「已核销」？控制好目的地就行了，管来源干嘛？凭空增加一堆复杂度。

**上一版把「三条来源路径」当成了要处理的问题**，需求档括注里还列了「勾销 ∥ 追认 ∥ update 迁移——共三径」。那是管来源。

**正确口径：只管目的地。**

写 `已核销` 的 SQL 全仓只有两处（实读）：

| 位置 | 所在函数 |
|---|---|
| `thincoder-core/ledger-cmd.mjs:242` | `applyRowUpdate`（update 的迁移） |
| `thincoder-core/ledger-cmd.mjs:277` | `applyRowClose`（close） |

**闸挂在这两处写库之前、判目标值 = `已核销` 即可**——不管调用方是谁、从哪个状态来。

需求档已删括注，改为「凡写入 `已核销` 的语句，写库前先校验三件」。

**这条更正对设计的实质影响 = 零**（设计席本来就挂在两处逐行函数上），但**理由要改**：不是「为了收拢三条路」，而是「所有写 `已核销` 的 SQL 就这两处，挂上即全覆盖」。

**修正轮后两处待裁 · 父侧处置**

**① `ledger-migrate.mjs:206` 的 INSERT——设计席加限定，我认可。**

它指出：「写 `已核销` 的 SQL 只有两处」字面上是假的——migrate 的逐列拷行也能把 `已核销` 行进新库。

加的限定是「**不入本闸**：它不判状态、只搬存量，与『存量不管』同向」。

**认可理由**：用户令是「存量不管，只管新增」。migrate 搬的正是存量；把它拉进闸，等于要让历史数据过一遍新凭证——那恰恰是用户令排除的东西。

**② 机制本体落 §2 还是搬设计档——收口轮定，本批不搬。**

设计席指出同族先例（`docs/batches/2026-10-25-closeout-marker-gate.md:44`）明写「机制本体住 `docs/core/design/LIGHT-CHANNEL.md` §2.5，§2 只引不抄（D2）」。

**父侧判断**：D2 是对的——批档可整体删除，机制本体住那里等于把规则放在一次性载体上。但**搬是收口轮「设计形式化」那一步的活**（§2 设计席写入板设计档），本批设计段只给方案。已记入收口待办。

**评审第 1 轮裁决（父侧 · 2026-10-26 12:27）**

评审 VERDICT: changes-required（2 🔴 · 10 🟡 · 3 🔵），全文在 §3。父侧裁决：

| # | 级别 | 评审发现 | 裁决 |
|---|---|---|---|
| 2 | 🔴 | 存量已核销行的字段补丁会被闸拦（`to = patch.status ?? row.status`，`ledger-cmd.mjs:222`），与 AC-M2-35 原「逐字相同」相抵 | **Not an issue（用户裁定）**：用户 11:59「存量不管，只管新增」+ 12:27「我已经说过了，存量不考虑」。**AC-M2-35 已按此改写**——存量行被拦属已知且接受，不设豁免、不做兼容分支。评审的技术判断成立，但方向由用户定。 |
| 1 | 🔴 | 设计缺集成测试设计段（未从 `test/RTM.md` 出发） | **接受，待修**。本次改的是业务可观察结果（核销会被拒），不能用「无影响」豁免。 |

**🟡 待处置**：10 条，其中实质三条——③ 会话作用域（跨会话收口会永久拒、文案指错方向）· 拒写文案硬写 `ledgerClose：`（从 update 路径进来会显示错函数名）· 追认核销后果未披露（待讨论行可无 `task_book`，新闸下永远核销不了）。其余七条是文档面完整性（先例行 · 勘察行 · 受影响文件行数全错 · 机制本体落点 · 模板项缺失 · 验收缺两行 · 计数不一致）。

**修正轮后父侧处置（2026-10-26 12:35）**

**① RTM 的 `10-3` 行——已由父侧贴入。**

落点 = `test/RTM.md:118`（故事 10 表，`10-2` 之后）。编号即用例号，`test('10-3 …')` 同号。

这一步必须在写用例标题**之前**做——编号先定，标题后写，是 RTM 的既有纪律。

**② 跨会话接手 × ③ 的射程——选 A。**

设计席给的 A = 「接手须重跑一次评审且 `documents` 带该批档」；B = ③ 改读全槽并集（要再造「哪份槽权威」的判据）。

**选 A 的理由**：B 会引入第二套权威判据，与 §10「槽为权威」相抵——为一个恢复便利去扩机制，正是用户 2026-10-17「不希望让机制进一步复杂化」禁的那类。A 的代价（接手时重跑一次评审）是显性动作，且评审本就要在收口时跑——不额外加机制。

**③ 两组裸名锚缺（`:429` / `:433`）——父侧改不了。**

那两处在 §3（评审段），本席无写权。它们会在文档门里持续报 `锚·档缺`。

处置：**记为已知项**，随第 2 轮评审重写 §3 时由评审自行修正；若第 2 轮仍留，收口轮由父侧在 §6 记明（§3 是 append-only，旧行改不掉）。

`:90`（§1）的裸名已改为路径限定。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（修正轮 1 定稿：集成 delta（RTM 10-3）+ ③ 会话射程 + 拒因分类（fnName ∥ 非批档）+ 行数重测）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试覆盖 / 验收对照 / 关键决策 / 上抛项>


### 本批条目（覆盖）

| # | 条目 | 来源 | 覆盖 |
|---|---|---|---|
| 1 | F-LX4 核销机检三件——① 批档在盘 ② 该档 §1 = `已收口` ③ 该批档在 design token 槽的批次归属有记录；缺一即拒并报明缺哪件 | 需求档 §② 功能点 11 | 本批 |
| 2 | AC-M2-34 三件校验四态对照（缺①②③各一次 + 全过一次） | 需求档 ④ | 本批 |
| 3 | AC-M2-35 存量不回改（机检只作用于新增核销路径） | 需求档 ④ | 本批 |
| 4 | 提示词 why 一句——`thincoder-core/prompts/persona-engineering.md` 轻通道收口段（英文正文由 eng-coder 落） | 用户 11:58 补 | 本批 |

**本批不覆盖**：`收尾链待跑` 标记的现有机械牙 · 六态迁移表 · 存量已核销行回改 · `design-slots` 存量 21 槽归属补录（用户令「存量不管」）· `query` 读数面 · UI（本项无 UI 面）。

### 目标态

**所有写入 `已核销` 的路径先过同一道机检**：三件全过才写行，缺一即拒、拒因逐项点名、行零改。

**判据单源**：一个断言函数 `assertCloseOutProof({ agent, base, row })`，住 `ledger-cmd.mjs`，与既有 `assertTaskBookGate`（:152）／`assertBatchArg`（:311）同族——本档的写门断言都住这层。

**判据只有一条：目标值 = `已核销`。** 闸挂在写库之前、判目标值——不管调用方是谁、从哪个状态来。

**挂在哪：写这个值的 SQL，本仓产品源码只有两处**（实读 = `grep "UPDATE items SET status"` 的两命中）：

| 写 `已核销` 的 SQL | 所在函数 |
|---|---|
| `thincoder-core/ledger-cmd.mjs:242` | `applyRowUpdate`（单行 ∥ 批量共函数） |
| `thincoder-core/ledger-cmd.mjs:277` | `applyRowClose`（单行 ∥ 批量共函数） |

两处都挂上 = 全覆盖。将来加第三条写这个值的 SQL 也不会漏：实施自查句 = `grep "UPDATE items SET status"` 是否仍只有这两处，不是「枚举所有调用路径」——漏掉的是那条 SQL，不是某个调用方。

`ledger-cmd.mjs:15-16` 的注释记着既有核销标记门同样挂在这两处：现状旁证，不是本机检的判据。

**不入本闸的一处**：`ledger-migrate.mjs:206` 的 INSERT 逐列拷行、能把 `已核销` 行带进新库——它不判状态、只搬存量，按用户令「存量不管」，不进门。

**判序（`applyRowClose` 内）**：源态判（既有 :268）→ 标记门（既有 :270，逐字不动）→ **机检（新）** → 值计算 → 追认门 → 拒面② → UPDATE。

机检放在标记门之后：标记是零成本的字符串判，先报它更省一次磁盘 I/O；两者都拒时，先看到的是那条今晚已经在用的、更可操作的提示。

**`applyRowUpdate` 内同形**：迁移表判 → 既有标记门（:227）→ **机检（新，仅当结果态 = `已核销`）** → 落笔。

### 五个问题的答复

**① 三件校验落在哪个函数**

落两条逐行共函数（上表），不落 `ledgerClose` 单点，也不落工具面。理由三条：

- **判据跟着 SQL 走，不跟着函数名走**：`:242` 与 `:277` 是写这个值的全部 SQL——只挂 `ledgerClose`，`:242` 那处就无闸裸写。谁调、从哪个源态进来，都在同一道闸下。
- **判据四份**：挂工具面 `ledger-tools.mjs`（:308 / :309 / :314 / :315 四个 action 调用点）⇒ 单行 × 批量 × 四调用点各判一次，判据散成四份。两份逐行函数各判一次就够。
- **库函数面**：`ledgerClose` 等是导出的库函数（`ledger.mjs:157` re-export），直接调用它的代码（含以后的测试与脚本）不经工具面。挂在逐行函数上，谁调都过闸。

**新增参数**：两处逐行函数与四个导出（`ledgerClose` / `ledgerCloseBatch` / `ledgerUpdate` / `ledgerUpdateBatch`）各收一个 `agent`，由工具面传 `ctx.agent`（`ledger-tools.mjs:30` 已在读 `ctx?.agent?.cwd`，同一来源，零新输入）。`base` 取既有 `baseOf(cwd, boundary)`（:45），与 `resolveBatchRows` 同一解析基准。

**② ③ 的反查方向**

**从槽找批档（值扫）**，不是从批档找槽。方向的由数据形决定，不是选出来的：

- 内存形 = `_engDesignTokenBatches`，`Map(designId → 批档绝对路径)`（`design-slots.mjs:49-50`）。
- 落盘形 = 槽文件 `engDesignTokenBatches`，`{ 返回形与注释逐字）。

**键是 designId，值是批档路径**——所以「该批档有没有归属」只能是「有没有哪个 value 等于它」，一次值扫。

**读哪个**：读 `unionBatches(agent, { strict: true })`（`design-slots.mjs:47`），不新写读取器。它 = 内存 Map 先行 ∪ 槽文件旁列覆盖（槽为权威，与 `unionSlots` 同形，D-S3 同源），纯读零写。两形都读到——**不能只读文件**：settle 签发那一刻归属先写内存、落盘在调用方（`design-token.mjs:176-182`），只读文件会漏掉刚签发的那一拍，而那正是核销最需要看见的归属。

**比较用 `batchPathKey`**（`design-slots.mjs:121`），不做串等值：行侧 `task_book` 剥段号（`filePartOf` :41）后经 `resolveDeclaredRef(base, part)` 解析为绝对路径，与旁列值两侧都过 `batchPathKey` 归一（分隔符 + win32 大小写）。同址两种写法不算两份——与 `batchAbsPath`（:100）的「不猜」判据同源。

**`strict: true` 不是可选**：读不到槽 ≠ 没有归属。清点面宽容（读不到 ⇒ 空集 ⇒ 显示 `—`）是显示面该有的降级；核销面读不到 ⇒ **拒**——`token-ttl.mjs:212-219` 已立此判据（「无法判定归属 = 无法证明清账」）。这是业务门：证明不了就不许过，不是默认通过。

**③ 拒写文案（点名缺哪件，不泄露 token 值）**

**一次报全缺项**，不逐次挤牙膏：三件各判、收齐后一次抛，编号点名。

```
ledgerClose：核销机检未过（行 <id> 零改）——缺：① ② ③
  ① 批档不在盘（task_book = <行内值>）：先补指针，或恢复该档
  ② 批档未收口（<批档绝对路径> §1 = open|unknown）：先跑收口全链把该批收口
  ③ 该批档无 design token 归属：先跑设计评审——评审通过才签发 token
```

缺件那几行才出现，缺哪条列哪条。③ 的读失败单独一形，与「无归属」分清：

```
  ③ 读不到 token 槽归属（<原因>）：核销被拒、行零改；修好槽文件或权限后重试
```

**不泄露是结构性的，不是「读了不打印」**：机检只经 `readEngTokenBatchesFromSlot` / `_engDesignTokenBatches` 读**旁列**（designId → 批档路径），**从不读 token 值那一面**（`_engDesignTokens` / `readEngTokensFromSlot` 不入本函数）。文案里出现的只有行 id、`task_book` 值、批档路径——都是行里本来就有的，无一是凭证。

**④ 存量零影响的保证**

三句可检验的：

- **不可达**：机检只在 `结果 status === 已核销` ∧ `源态 ∈ {待讨论, 待设计, 待核销}` 时进入。已核销行没有任何合法迁移能再写 `已核销`（`ALLOWED_MIGRATIONS["已核销"] = ["已废弃"]`，`ledger-db.mjs:163`；`applyRowClose` :268 同判）⇒ 存量已核销行**结构上进不了机检**，不是靠约定的「先判一下」。
- **零面**：不改 schema、不回填、不动 `query` 行集、不动 `DATA_COLUMNS`、不动迁移表 ⇒ 存量行字节零变，读数面零变。
- **实测**：存量夹具（含当前 21 槽 `batch=—` 的归属现状）跑 `close` ⇒ 库文件 byte-identical，拒因与上线前逐字同（口径 = AC-M2-35「一切行为与上线前逐字相同（含源态门报错原文）」）。

**⑤ 提示词 why 落哪**

**落点**：`thincoder-core/prompts/persona-engineering.md` 轻通道收口段**步骤清单末尾**——`:248` 那句 `Closeout-chain segment map: §2 design formalization · §3 independent review · §4 approval · §6 closeout settlement; …` 之后，空行之前。现状 `:239-248` 通篇只列步骤与触发点，**没有一个字讲为什么**，核销凭证也就没有理由挂在这一步上。

**要表达的意思**（英文正文由 eng-coder 落，不超过两句）：

1. 轻通道直改只动代码、不动设计档——改完两者必然失步，而这一轮里没有任何别的动作会把它们拉回同步。
2. 收口全链就是那个动作：eng-designer 把代码现态写回设计档 → 设计评审 → 批准。跳过它，设计档继续描述代码**以前**的样子，之后每个读者都跟着那份描述走错地方。

只补 why，不重述步骤（步骤已在 :248）；不点名任何工具、不写路径——提示词面不落文档引用。

### 受影响文件（行数为本席实测）

| 文件 | 现行数 | 变更 | 面 |
|---|---|---|---|
| `thincoder-core/ledger-cmd.mjs` | 378 | 新增 `assertCloseOutProof`（约 30 行）+ 两处逐行函数调用点 + 四导出签名收 `agent` 透传 | 产品源码 |
| `thincoder-core/ledger-tools.mjs` | 317 | :308 / :309 / :314 / :315 四调用点补 `agent: ctx.agent` | 产品源码 |
| `thincoder-core/prompts/persona-engineering.md` | 468 | :248 后 +2 句 why（英文） | 提示词（eng-coder 落） |
| 本批单测档（eng-coder 建、收口删） | — | 四态对照 + 存量复跑 | 测试 |

**只读复用、零改**：`agent-tools/design-slots.mjs`（267 行，`unionBatches` :47 · `batchPathKey` :121）· `agent-tools/batch-skeleton.mjs`（229 行，`readBatchStatusLine` :122）· `token-ttl.mjs`（298 行，`readEngTokenBatchesFromSlot` :221）。三处都是既有单源，本批不新写解析器。

### 验收对照

| 判据 | 怎么判 | 回指 |
|---|---|---|
| 缺 ① | 行 `task_book` 指向已清档 ⇒ 拒，文案含 `① 批档不在盘`，行 status 未变 | AC-M2-34 |
| 缺 ② | 批档在盘但 §1 = `进行中`／无状态行 ⇒ 拒，文案含 `② 批档未收口`，行未变 | AC-M2-34 |
| 缺 ③ | 批档已收口、槽归属无此行 ⇒ 拒，文案含 `③ 无 design token 归属`，行未变 | AC-M2-34 |
| 全过 | 三件齐 ⇒ 写行成功，`closed_at` 非空 | AC-M2-34 |
| 三路都过闸 | 同一缺件夹具分别经 close 单行 / close 批量 / update 迁移 ⇒ 三路同拒 | AC-M2-34 |
| 存量不回改 | 存量已核销行复跑 close ⇒ 库 byte-identical，拒因与上线前逐字同 | AC-M2-35 |

**跑法**：`node --test <本批单测档>`（本批自测面；集成半在父侧收口报）。

### 关键决策（被拒的选项）

- **拒：只挂 `ledgerClose`** —— `:242` 那处写 `已核销` 的 SQL 就无闸裸写（判据是目标值，闸须覆盖写这个值的每一处）。
- **拒：挂工具面 `ledger-tools.mjs`** —— 判据散成六份；且库函数被直接调用时绕过。
- **拒：③ 改成「读 design-slots 文件」而不收 `agent`** —— 会漏内存里刚签发、尚未落盘的归属（settle 同拍写内存）。签名改一处远比丢一拍归属便宜。
- **拒：③ 用 designId 反查** —— 旁列方向固定（designId → 批档），反查没有第二个数据形支撑。
- **拒：逐次挤牙膏式拒因** —— 一次报全缺项；逐次报会让修复变成「补一件、再发现一件」的多轮循环，今晚已经为同类循环付过代价。

### 边界（不做什么）

- 不改 `ROUND_MARKER` 的现有机械牙（它管开笔前，本项管核销时）；不改六态迁移表；不新增输入参数（归属判据沿用 `batchAbsPath` 语义：不含 ∥ 多份 = 无归属 = 拒）。
- 不读、不写、不回显任何 token 值。
- 不回改存量行、不做存量归属补录、不改 `query` 读数面、不动 `design-slots` 清点输出形。

### 修正轮 1 定稿（评审 §3 十五条 · 父侧裁决 2026-10-26 12:27）

**本节是现行判据面**：上文与之冲突处，以本节为准。

#### 一、处置表

| # | 级别 | 处置 |
|---|---|---|
| 1 | 🔴 | 修——补「集成测试设计（RTM delta）」，见 §二 |
| 2 | 🔴 | 驳回（用户令）——判据仍单条：目标值 = `已核销`。存量行被拦属**已知且接受**，不设豁免、不做兼容分支；原「结构上不可达」论证已删，见 §七 |
| 3 | 🟡 | 修——断言收 `fnName`，拒因前缀取调用方函数名，见 §四 ② |
| 4 | 🟡 | 修——③ 会话射程前提 + 「本会话槽无归属」子形与恢复路径，见 §三 |
| 5 | 🟡 | 修——③ 读失败分支给复现命令并进验收表，见 §三 + §六 |
| 6 | 🟡 | 修——行数全部重测、Δ 改 `≤+N`，见 §五 |
| 7 | 🟡 | 修——补先例行，见 §五 |
| 8 | 🟡 | 修——补勘察证据行，见 §五 |
| 9 | 🟡 | 修——`docs/core/design/LEDGER.md` 进受影响面并点名目标节，见 §五 |
| 10 | 🟡 | 修——追认核销后果披露 + `task_book` 空 ∥ 非批档各有拒因形，见 §四 ③④ |
| 11 | 🟡 | 修——补模板两项（设计档落点 §五 · 上抛项 §八） |
| 12 | 🟡 | 修——验收表补两行，见 §六 |
| 13 | 🔵 | 修——判据份数统一为**四**，见 §七 |
| 14 | 🔵 | 修——边界写明陈旧批内测试档不在射程，见 §七 |
| 15 | 🔵 | 修——批量径一次读入，见 §四 ⑤ |

#### 二、集成测试设计（RTM delta）

**起点**：`test/RTM.md`——CLI 端 10 个业务故事，最近者 = 故事 10「收口即清账」（`:109`，现有两行 10-1 ∥ 10-2）。

**三答**

- **破 0 行**：故事 7 三行（`test/RTM.md:86-88`）判批档收口门；故事 10 两行（`:116-117`）判批档收口消费 token。本闸挂在台账 `close` / `update` 的逐行写库前，这两条通路都不经它 ⇒ 五行零打断。
- **冗余 0 行**：无既有行评测「台账核销 ⇒ 逐项校验三件」——故事 10 两行入口均为 `batch close`，不以 `ledger close` 为入口。
- **缺 1 行**：故事 10 增 `10-3`。

**新行（编号先落 `test/RTM.md`，用例标题 `test('10-3 …')` 同号）**

| 编号 | 怎么做 | 怎么算通过 | 结果 | 执行日期 | 执行人 | 异常 | 证据 |
|---|---|---|---|---|---|---|---|
| 10-3 | 工程模式夹具里造三行 `待核销`：a 行 `task_book` 指向「已收口 ∧ 槽内有归属」的批档；b 行指向「未收口」的批档；c 行指向「已收口但槽内无归属」的批档。三行各跑一次 `thincoder ledger close --id <行>` | a 行核销成功（`status = 已核销`，`closed_at` 非空）；b / c 行被拒，回执分别点名缺 ② ∥ 缺 ③，且两行 `status` 仍 `待核销`、`closed_at` 仍空 | 待执行 | — | — | — | `test/integration/ledger-close-proof.test.mjs` |

**该行评测什么**

- **组件交互**：台账工具面（`ledger` close）↔ 批档解析（在盘 + §1 状态行）↔ design token 槽（批次归属并集）。
- **业务可观察结果**：核销被拒 ∥ 核销成功（`closed_at` 落值），且拒因点名缺哪一件。
- **入口**：`thincoder ledger close`（用户可径）。
- **回指**：需求档功能点 11 · AC-M2-34。

**既有行零打断**：故事 7 与故事 10 的现有行不被本改动打断（理由见上「破 0 行」）。

#### 三、③ 的会话射程（评审 #4）

**前提（写死）**：③ 只读**当前会话槽**——`currentSlotNoReadOnly`（`thincoder-core/token-ttl.mjs:184-189`）取 `agent._slot`，未钉槽取 manifest `active`。核销会话与签发会话的槽号不同 ⇒ 读不到那段旁列。

**③ 的成因有两个，文案不得只写一个**

- **A 真无归属**：本会话槽可读，旁列里没有该批档 ⇒ 该批评审的 `documents` 未带批档（或从未评审）。
- **B 会话射程**：本会话无槽号 ∥ 旁列为空 ⇒ 归属在别的会话槽里。恢复 = 回到持有该槽的会话核销，或先续接该槽。

**拒因文案（③ 三形，逐字）**

```
  ③ 本会话槽内无该批档的归属：先确认是否换了会话——在跑该批设计评审的会话里核销；
     确无归属 ⇒ 那次评审的 documents 未带该批档，须重跑
  ③ 本会话无槽号（manifest 无 active）：核销须在持有该批归属的会话里跑
  ③ 读不到 token 槽归属（<原因>）：核销被拒、行零改；修好槽文件或权限后重试
```

**第三形的复现命令（本席未实跑，实施席按此取证）**：把该会话槽档置为不可读（Windows：`icacls <槽档> /deny %USERNAME%:R`），再跑 `thincoder ledger close --id <行>` ⇒ 严格读的抛因子上浮，行零改。

**为何不并进 A**：严格读下「读不到」与「没有」必须分开（`thincoder-core/token-ttl.mjs:212-219`：无法判定归属 = 无法证明清账）。把读失败说成没跑评审，修复方向就指错。

#### 四、机制修订（其余四条）

**① 判序不变**（close 径）：源态判 → 标记门 → **机检** → 值计算 → 追认门 → 拒面② → UPDATE。update 径：迁移表判 → 标记门 → **机检** → 写门 → 落笔。

**② 断言收 `fnName`**：签名 = `assertCloseOutProof(fnName, { agent, base, row, batches })`——与同族 `assertTaskBookGate(cwd, fnName, face, boundary)`（`thincoder-core/ledger-cmd.mjs:152`）∥ `assertBatchArg(fnName, base, batch)`（`:311`）同形，函数名首位。

- `applyRowUpdate` 传 `"ledgerUpdate"`；`applyRowClose` 传 `"ledgerClose"`（批量径沿用既有前缀，`:370` 已是 `ledgerClose`）。
- 拒因首行形：`<fnName>：核销机检未过（行 <id> 零改）——缺：…`。

**③ 追认核销的后果（披露）**：待讨论 / 待设计 → 已核销 也过本闸（判据 = 目标值）。而待讨论行可不携 `task_book`（写门臂①只覆盖 在途 / 待核销 / 归批，`thincoder-core/ledger-cmd.mjs:154`）⇒ 这类行在新闸下核销不了。

- 补救：先给该行挂批档（`update` 写 `task_book`），跑完该批全链，再核销。
- 不是缺陷：没有批档链就没有「全链跑过」的凭证；追认核销同样要凭证，AC-M2-14 ∥ AC-M2-21 的验收面不变。

**④ ① 与 ② 的拒因分类**：空指针不再打印「批档不在盘（task_book = null）」，单列一形：

```
  ① 行无 task_book 指针：追认核销须先挂批档（update 写 task_book），再跑全链
```

`task_book` 按定义即批档指针。指向普通档时单列一形（判别 = 档内有无 `## §1` 段头，与 `readBatchStatusLine` 同一正则）：

```
  ② 指针所指档不是批档（<绝对路径> 无 §1 段）：先把 task_book 改指批档
  ② 批档未收口（<绝对路径> §1 = open|unknown）：该批须先跑全链收口
```

判别式单源：`readBatchStatusLine`（`thincoder-core/agent-tools/batch-skeleton.mjs:122`）只回三值，分不出「无 §1」与「有 §1 未收口」。故在**同一档**加只读谓词 `isBatchRecord(src)`（复用该档段头正则，不新写第二份），`ledger-cmd.mjs` 只调谓词。

**⑤ 批量径一次读入**：`ledgerCloseBatch` 逐行循环（`:367-376`，持 `BEGIN IMMEDIATE`）不逐行重读槽——归属并集在 `BEGIN` **之前**读一次，行间复用（先例 = `thincoder-core/agent-tools/design-slots.mjs:157`「一次读入（逐行各读一次 = N 次文件解析）」）。

- 严格读抛 = 会话级条件、与行无关 ⇒ **整批在 BEGIN 之前拒**，不进 `skipped`（`skipped` 是逐行点名面——环境失败记成 N 条行拒因就是假账）。
- 单行两径各读一次。

#### 五、受影响文件（本席实测，修正轮重测）

| 文件 | 现行数 | 变更 | 面 |
|---|---|---|---|
| `thincoder-core/ledger-cmd.mjs` | 446 | ≤+45（断言 + 两处调用点 + 四导出收 `agent` 透传 + 一次读入改造） | 产品源码 |
| `thincoder-core/ledger-tools.mjs` | 358 | ≤+4（`:308/309/314/315` 四调用点补 `agent: ctx.agent`） | 产品源码 |
| `thincoder-core/agent-tools/batch-skeleton.mjs` | 306 | ≤+8（只读谓词 `isBatchRecord`，复用本档段头正则） | 产品源码 |
| `thincoder-core/prompts/persona-engineering.md` | 469 | +2（`:248` 后 why 两句，英文由实施席落） | 提示词 |
| 本批单测档（实施席建、收口删） | — | 新建 | 测试 |
| `docs/core/design/LEDGER.md` | 1120 | 本批零改；收口轮落 | 设计档 |

`thincoder-core/ledger-cmd.mjs` 收尾 446 + ≤45 ≤ 500，未越单档上限；实落超 500 ⇒ 主动拆分并报父侧。

**只读复用零改（行数同为本席实测）**：`thincoder-core/agent-tools/design-slots.mjs`（306 行：`unionBatches` :47 · `batchAbsPath` :100 · `batchPathKey` :121）· `thincoder-core/token-ttl.mjs`（371 行：`readEngTokenBatchesFromSlot` :221）。

**先例行（criterion 9）**

- `existing: thincoder-core/agent-tools/batch-lifecycle.mjs:558-564` · `name: "consumeBatchDesignTokens"` · `consumers: 批档收口两条通路（:483 ∥ :522）`——同一套判据：`unionBatches(agent, { strict: true })` 取并集 + `batchPathKey` 归一后值扫。本批**对齐**：并集函数、严格读、归一键三件全复用，不新写读取器。
- `existing: docs/batches/2026-10-25-closeout-marker-gate.md:44`（同族批次）——D2：机制本体住永久设计档，批档只引不抄。本批**偏离**：本体暂住本档，收口轮搬 `docs/core/design/LEDGER.md` §3。理由 = 父侧 §1 裁定（搬属收口轮「设计形式化」步），非能力 ∥ 契约失败。

**勘察证据行（criterion 10）**

- 查过：`docs/core/design/LEDGER.md`（ledger 机制本体；收口两源块 :139-145）· `docs/core/design/LIGHT-CHANNEL.md` §2.5（核销挂接先例）· `docs/batches/2026-10-25-closeout-marker-gate.md`（同族批次）。
- 代码面：`thincoder-core/agent-tools/design-slots.mjs` · `thincoder-core/token-ttl.mjs` · `thincoder-core/agent-tools/batch-lifecycle.mjs`。
- `index.publicRepos` = `[]`（manifest 实读）⇒ 工作目录内无独立文档仓，无外部源可引。

**设计档落点**

- **本批**：机制本体落本档（本修正轮节），批档是一次性载体——收口轮须搬出。
- **收口轮（父侧已记待办）**：`docs/core/design/LEDGER.md` §3（收口两源块 + 机检三件 + 判序 + 拒因文案逐字）；§3.1（`:160` 判序句补机检环）；§8（验收映射增 AC-M2-34 ∥ AC-M2-35 两行）；§9（边界增「存量行被拦属已知接受」句）。

#### 六、验收对照（现行全表）

| 判据 | 怎么判 | 回指 |
|---|---|---|
| 缺 ① | 行 `task_book` 指向已清档 ⇒ 拒，文案含 `① 批档不在盘`，行未变 | AC-M2-34 |
| 缺 ①（无指针） | 行 `task_book` 为空 ⇒ 拒，文案含 `① 行无 task_book 指针`，行未变 | AC-M2-34 |
| 缺 ② | 批档在盘但 §1 = `进行中` ∥ 无状态行 ⇒ 拒，文案含 `② 批档未收口`，行未变 | AC-M2-34 |
| 缺 ②（非批档） | `task_book` 指向无 `## §1` 段的普通档 ⇒ 拒，文案含 `② 指针所指档不是批档`，行未变 | AC-M2-34 |
| 缺 ③ | 批档已收口、槽内无此批归属 ⇒ 拒，文案含 `③ 本会话槽内无该批档的归属`，行未变 | AC-M2-34 |
| ③ 读失败 | 槽档不可读（`icacls` 去读权）⇒ 拒，文案含 `③ 读不到 token 槽归属`，行未变 | AC-M2-34 |
| 全过 | 三件齐 ⇒ 写行成功，`closed_at` 非空 | AC-M2-34 |
| 三路都过闸 | 同一缺件夹具分经 close 单行 ∥ close 批量 ∥ update 迁移 ⇒ 三路同拒 | AC-M2-34 |
| 存量被拦（已知接受） | 存档行纯字段补丁亦进闸并被拦——**不设用例**（AC-M2-35 方式列） | AC-M2-35 |
| 集成 | 见 §二：`test/integration/ledger-close-proof.test.mjs` 用例 `10-3` | AC-M2-34 |

**跑法**：本批自测面 = `node --test <本批单测档>`；集成行由父侧收口跑。

#### 七、边界（现行）

- **存量**：已核销行的纯字段补丁（`to = patch.status ?? row.status` ⇒ 目标值仍 `已核销`）会进闸并被拦——**已知且接受**（用户 11:59 ∥ 12:27）。不设豁免通道、不做兼容分支、不设用例。原「存量行结构上进不了机检」的论证作废——它被 `thincoder-core/ledger-cmd.mjs:222` 的取值形证伪。
- **判据份数 = 四**：挂工具面 `ledger-tools.mjs` 就是四个 action 调用点各判一次（单行 ∥ 批量 × update ∥ close）。
- **陈旧批内测试档不在射程**：`docs/batches/2026-10-25-closeout-marker-gate.test.mjs:76`（M2）在不传 `agent` 下核销，新闸下会红。该档是上批的一次性测试产物（不进 `npm test` 收集面），本批不修、不以其红绿为判据；处置 = 父侧另行列账（用毕即删的纪律）。
- **不入本闸**：`thincoder-core/ledger-migrate.mjs:206` 的 INSERT 只搬存量、不判状态，与「存量不管」同向。
- **零改**：`ROUND_MARKER` 现有机械牙 · 六态迁移表 · `query` 读数面 · `DATA_COLUMNS` · `design-slots` 清点输出形 · 不读不写不回显任何 token 值。

#### 八、上抛项

1. 〔父侧 · RTM 落行〕本席笔域 = 设计档 + 本档 §2，未动 `test/RTM.md`。请在写用例标题**之前**把 §二 的 `10-3` 行贴入故事 10 表（行文已备，编号即用例号）。
2. 〔父侧 · 待裁〕**跨会话接手 × ③ 的射程**：提示词既有的「跨会话接手跑全链」（`thincoder-core/prompts/persona-engineering.md:246-247`）在接手会话里跑，而归属住在签发会话的槽 ⇒ 不重跑评审则 ③ 恒拒。两条路：**A** 接受「接手须重跑一次设计评审且 `documents` 带该批档」（新会话新归属）；**B** ③ 改读全槽并集（新增数据形：扫全部槽档、且无权威判据）。本席倾向 A——它与严格读同源，B 要在「哪份槽权威」上再造一个判据。
3. 〔已裁 · 存档〕评审 #2 的技术判断成立，方向由用户令定（存量不考虑）：不修、不加分支。上抛关闭。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

### 设计评审（F-LX4 核销机检 · 需求档 §② 功能点 11 / AC-M2-34·35）

限制声明：评审上下文未提供项目标准档，亦无文档地图（`docs/README.md` 未在声明根下命中）——方法学合规按 AGENTS.md + 批档骨架模板判；文档归属按 `docs/core/design/LEDGER.md` 对照判。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Acceptance / Integration (crit.12) | 🔴 | 无集成测试设计段：§2 没有任何一段从 `test/RTM.md` 出发（现有 10 个 CLI 业务故事，最近者为故事 10「收口即清账」，`test/RTM.md:109`），故从未说明本改动对既有行是打断 / 冗余 / 缺失；唯一验收是 `node --test <本批单测档>`，并写「集成半在父侧收口报」（`2026-10-26-ledger-close-gate.md:224`）。本改动确实改动一个业务可观察结果（核销可被拒），「无影响」豁免不成立。 | 补一段先读 `test/RTM.md` 再给的 delta：故事 10 需新增的行（编号先落 RTM 再用同号做用例名）、每行评估的组件交互（台账工具 ↔ 批档 ↔ token 槽）、断言业务结果、用户入口（`thincoder ledger close` ∥ 批档 close 回执）、回指需求（F-LX4 / AC-M2-34）；并明说故事 7 / 10 既有行不被本改动打断。 |
| 2 | Requirements / Acceptance (crit.1,5) | 🔴 | 闸判据被写成两条互不相容的判据，「结构上不可达」的论证被代码证伪：`:116`「判据只有一条：目标值 = `已核销`」/ `:135`「仅当结果态 = `已核销`」 对立于 `:187`「机检只在 `结果 status === 已核销` ∧ `源态 ∈ {待讨论, 待设计, 待核销}` 时进入」。`applyRowUpdate` 取 `to = patch.status ?? row.status`（`ledger-cmd.mjs:222`），`to === row.status` 时跳过迁移表判（`:223`），批量选行不滤状态（`:321-324`）⇒ 对归档行的纯字段补丁会再写一次 `已核销`，目标值判据必然触发，与 AC-M2-35「存量已核销行的一切行为与上线前**逐字相同**」（`docs/core/requirements/ENGINEERING-MODE-V2-SPEC-LEDGER.md:97`）及 F-LX4 边界「只对**新增**核销生效」（`:58`）相冲。 | 在设计中只留一条判据（例如仅在行确实迁入 `已核销` 时进闸），写一次写清；同步收正 F-LX4 `:49`「凡写入 `已核销` 的语句」与 `:58` 边界的措辞；验收表补一行：归档行免状态补丁照过、逐字零变。 |
| 3 | Clarity / copy | 🟡 | 拒写文案硬写 `ledgerClose：`（`:169`），而同族断言一律收调用函数名（`assertTaskBookGate(cwd, fnName, …)` `ledger-cmd.mjs:152`、`assertBatchArg(fnName, …)` `:311`），update 径既有文案已写 `ledgerUpdate：`（`:224`）；`assertCloseOutProof({ agent, base, row })`（`:114`）无 fnName ⇒ update 径会报错函数名错位。 | 断言面收 `fnName`，文案按调用函数名前缀——与两个同族断言同形。 |
| 4 | Feasibility / ③ 数据源射程 | 🟡 | `unionBatches` 只读**当前会话槽**（`readEngTokenBatchesFromSlot` → `currentSlotNoReadOnly`，`token-ttl.mjs:184-189`、`:221`）：换到未续接的新会话里核销（例如跨会话接手收口）时旁列为空 ⇒ ③ 永久拒，而 ③ 文案说「先跑设计评审」（`:172`）——真因是会话射程，不是没跑评审。 | 写明前提（核销须在持有该归属的会话内跑），并给 ③ 一个「本会话无槽/旁列空」的独立子形与恢复路径；文案不得把唯一成因写成「没跑评审」。 |
| 5 | Branch provenance (crit.6b) | 🟡 | ③ 读失败分支（`:178`）没有点名场景：既无引用的观察（数据读数 ∥ 日志 ∥ 用户报告），也无复现命令；其唯一支撑是一条判真原则加 `token-ttl.mjs:212-219`。 | 给出场景（把槽文件弄成不可读 + 复现命令），或明写「沿用既有 fail-closed、无独立场景」——并按那条理由决定它是否进验收表。 |
| 6 | Affected-file annotations (crit.8) | 🟡 | 抽样核对六个数字全部不符：`ledger-cmd.mjs` 实为 446 行（设计 `:206` 写 378）· `ledger-tools.mjs` 实为 358（`:207` 写 317）· `thincoder-core/prompts/persona-engineering.md` 实为 469（写 468）· `design-slots.mjs` 实为 306（`:211` 写 267）· `batch-skeleton.mjs` 实为 306（写 229）· `token-ttl.mjs` 实为 371（写 298）。变更量亦非 `≤±N` 形（「约 30 行」）。 | 按现档重测并逐档给 `≤+N`；并记 446 + 本笔增量须 ≤ 500（30–45 行估计 ⇒ 476–491），越 500 须带主动拆分评审。 |
| 7 | Closest precedent (crit.9) | 🟡 | 无最近先例行。近乎同形的先例未被勘察：`consumeBatchDesignTokens`（`batch-lifecycle.mjs:558-564`）在批档收口时做同一值扫（`unionBatches(agent, {strict:true})` + `batchPathKey`）；另，同族批次 `2026-10-25-closeout-marker-gate.md:44` 的 D2（机制本体住永久档）在 §2 内无偏离理由。 | 补先例行：坐标 + 对齐（复用同一并集/严格读/`batchPathKey` 判据）+ 偏离理由（本轮机制本体留批档，理由 = 父侧 `:92` 的收口待办裁定）。 |
| 8 | Survey evidence (crit.10) | 🟡 | 无勘察证据行——没写查过哪些公开源档（尤独文档仓）、是否有相关内容。 | 补一行，哪怕结论是「无相关」。 |
| 9 | Document ownership (crit.7) | 🟡 | 机制本体只落在可整体删除的批档，拥有该主题的设计档 `docs/core/design/LEDGER.md`（持有核销拒因文案 `:140`∕`:144` 与判序）不在受影响文件表里 ⇒ 本批之后该档的判序与文案失步。父侧 `:92` 的延后裁定是有理由的裁定，本轮接受，但 §2 没给收口步一个落点坐标。 | 在受影响文件表里点名 `docs/core/design/LEDGER.md` 的目标节（机检清单 + 判序 + 拒因文案）为收口轮项，让延后有落点。 |
| 10 | Requirements coverage (crit.1) | 🟡 | 其余核销径的后果未交代：追认核销（待讨论/待设计 → 已核销，AC-M2-14 `:87`、AC-M2-21 `:91`）同样过闸，而待讨论行本不必携 `task_book`（`ledger-cmd.mjs:154`）⇒ 这类行从此无法核销；`task_book` 指向非批档的待核销行会吃到 ② 并显示「§1 = open\|unknown」（`:171`），而那份档根本不是批档。 | 把后果写明（没有批档链就不能核销，出路 = 先立批），并给「指针非批档」一个独立拒因行或明写「`task_book` 按定义即批档」；补 AC-M2-14 / AC-M2-21 的注。 |
| 11 | Methodology (crit.3) | 🟡 | §2 缺两项骨架模板项（`batch-skeleton.mjs:298` 列明）：**设计档落点** 与 **上抛项**——前者延后到 §1 `:92`，后者为空，而本表 #2 / #4 就是真实上抛项。 | 两行补齐：设计文本落点、父侧须裁的两项（闸判据取哪条；会话射程前提）。 |
| 12 | Acceptance (crit.5) | 🟡 | 验收表缺 ③ 读失败分支的行（该分支有自己的文案 `:178`），也缺 #2 里归档行免状态补丁那一行。 | 补这两行，或删去 ③ 的独立文案、让严格读自身错误面上浮。 |
| 13 | Note | 🔵 | 设计自身数字打架：「判据散成四份」（`:144`）vs「判据散成六份」（`:229`）。 | 取一个数。 |
| 14 | Note | 🔵 | 存量批档单测档会被打断：`docs/batches/2026-10-25-closeout-marker-gate.test.mjs:76` 在无 agent、无归属下核销。该仓单测不进 `npm test` 收集面（`test/run.mjs:4`），故无门受影响。 | 在边界里明写存量批档单测档是否在射程内；不在就写不在。 |
| 15 | Note | 🔵 | 槽读落在 `ledgerCloseBatch` 的逐行循环里（`:364-376`，持 `BEGIN IMMEDIATE`）——N 次文件解析在写锁内；`design-slots.mjs:157` 已有「一次读入（逐行各读一次 = N 次文件解析）」的先例。 | 每次调用只读一次并集（与批档 §1 行），行间复用。 |

计数：🔴 2 · 🟡 10 · 🔵 3。
VERDICT: changes-required

### 轮次 2（评审子代理）

限制声明（沿用第 1 轮）：评审上下文未提供项目标准档与文档地图；方法学合规按 AGENTS.md + 批档骨架模板判，文档归属按 `docs/core/design/LEDGER.md` 对照判。第 2 轮射程 = 第 1 轮 15 条是否落地 + 修复是否引入新问题；第 2 条按用户裁定不重开，只核设计是否已与 AC-M2-35 现行文对齐。

| # | Orig# | File | Severity | Status | Notes |
|---|-------|------|----------|--------|-------|
| 1 | 1 | docs/batches/2026-10-26-ledger-close-gate.md | 🔴 | Fixed | §二（`:297-320`）已从 `test/RTM.md` 出发：故事 10 在 `test/RTM.md:109`、现有两行 `:116-117`，新行 10-3 已在 `test/RTM.md:118`；破 0 / 冗余 0 / 缺 1 + 组件交互·业务结果·入口·回指齐备。故事 7（`test/RTM.md:86-88`）与故事 10 现有行零打断的理由成立（两径入口均 `batch close`，不经 `ledger close` / `update`）。 |
| 2 | 2 | docs/core/requirements/ENGINEERING-MODE-V2-SPEC-LEDGER.md | 🔴 | Accepted | 有理由的非修，方向由用户令定（11:59 ∥ 12:27），不重开技术判断。已核对齐：AC-M2-35 现行文（`:97`）「存量行（含已核销行的字段补丁）若被机检拦下，属已知且接受的行为，不设豁免通道、不做兼容分支」，设计 §七（`:428`）与验收表（`:421`）逐点对应，原「结构上不可达」论证已明写作废。`ledger-cmd.mjs:222` 的 `const to = patch.status ?? row.status` 本轮实读，证伪成立。残留只在需求档措辞，见 New N1。 |
| 3 | 3 | docs/batches/2026-10-26-ledger-close-gate.md | 🟡 | Fixed | §四 ②（`:348-351`）：签名 `assertCloseOutProof(fnName, { agent, base, row, batches })`，`applyRowUpdate` 传 `ledgerUpdate`、`applyRowClose` 传 `ledgerClose`；批量径既有前缀确为 `ledgerClose`（实读 `ledger-cmd.mjs:370`）。 |
| 4 | 4 | docs/batches/2026-10-26-ledger-close-gate.md | 🟡 | Fixed | §三（`:322-342`）：前提写死（只读当前会话槽）、成因 A/B 两分、③ 三形逐字文案、各带恢复路径；`currentSlotNoReadOnly` 坐标与原读一致。 |
| 5 | 5 | docs/batches/2026-10-26-ledger-close-gate.md | 🟡 | Fixed | §三 `:340` 给出复现命令（`icacls <槽档> /deny %USERNAME%:R` 后跑 `thincoder ledger close --id <行>`），并明写「本席未实跑，实施席按此取证」——无伪造观察；§六 `:418` 已补该分支验收行。 |
| 6 | 6 | docs/batches/2026-10-26-ledger-close-gate.md | 🟡 | Fixed | §五（`:380-391`）逐档重测并改 `≤+N`。抽样实读复核：`thincoder-core/ledger-cmd.mjs` 446 行 ✓、`thincoder-core/ledger-tools.mjs` 358 行 ✓、`thincoder-core/agent-tools/batch-skeleton.mjs` 306 行 ✓、`docs/core/design/LEDGER.md` 1120 行 ✓；`thincoder-core/prompts/persona-engineering.md` 469 · `design-slots.mjs` 306 · `token-ttl.mjs` 371 本轮未复测。补记：旧块 `:239-244` 仍携旧行数且把 batch-skeleton 记作零改，靠 `:275` 的「以本节为准」覆盖——实施席须读修正轮节。 |
| 7 | 7 | docs/batches/2026-10-26-ledger-close-gate.md | 🟡 | Fixed | §五 先例行（`:393-396`）：坐标 + 对齐（并集函数／严格读／`batchPathKey` 三件复用）+ 偏离理由（本体暂住批档，收口轮搬设计档，理由 = 父侧 `:92` 裁定）。 |
| 8 | 8 | docs/batches/2026-10-26-ledger-close-gate.md | 🟡 | Fixed | §五 勘察证据行（`:398-402`）三条 + `index.publicRepos = []`；实读 `PROJECT-MANIFEST.json:35` 确为 `"publicRepos": []`，证据为真。 |
| 9 | 9 | docs/batches/2026-10-26-ledger-close-gate.md | 🟡 | Fixed | §五（`:387`）+ 设计档落点（`:404-407`）点名目标节；实读 `docs/core/design/LEDGER.md`：§3 在 `:135`、判序句在 `:160`、§8 在 `:944`、§9 在 `:1094`，坐标全部成立。 |
| 10 | 10 | docs/batches/2026-10-26-ledger-close-gate.md | 🟡 | Fixed | §四 ③（`:353-356`）披露追认径后果 + 补救；§四 ④（`:358-371`）给出空指针与非批档两形拒因，判别谓词 `isBatchRecord` 复用 `batch-skeleton.mjs:123` 的 `/^## §1(?=\s|$)/m`（实读），不新写第二份；验收表 `:414` / `:416` 已补。附注：`AC-M2-14 ∥ AC-M2-21 的验收面不变` 对 AC 文本成立，但这两条 AC 的夹具（T33–T36 / U-LT1–U-LT4）重建时须补三件凭证，宜写一句。 |
| 11 | 11 | docs/batches/2026-10-26-ledger-close-gate.md | 🟡 | Fixed | 设计档落点（`:404-407`）与上抛项（§八 `:434-438`）两项模板项已补。附注：§八 第 1 / 2 项已由父侧处置（`§1:107-117`），见 New N4。 |
| 12 | 12 | docs/batches/2026-10-26-ledger-close-gate.md | 🟡 | Fixed | §六 `:418` 补 ③ 读失败行；`:421` 补存量被拦行并写「不设用例」，与 AC-M2-35 方式列（`:97`）同口径。 |
| 13 | 13 | docs/batches/2026-10-26-ledger-close-gate.md | 🔵 | Fixed | §七 `:429` 统一为「判据份数 = 四」并带解释；旧文 `:262` 的「六份」仍在，由 `:275` 的优先级句覆盖。 |
| 14 | 14 | docs/batches/2026-10-26-ledger-close-gate.md | 🔵 | Fixed | §七 `:430` 明写陈旧批内测试档不在射程、不进 `npm test` 收集面；`test/RTM.md:5` 本轮实读同口径（单元测试档不进本表，只登记 `test/integration/**`）。 |
| 15 | 15 | docs/batches/2026-10-26-ledger-close-gate.md | 🔵 | Fixed | §四 ⑤（`:373-376`）：并集在 `BEGIN` 之前读一次、行间复用；严格读抛 = 会话级条件、整批先拒、不记入 `skipped`；单行两径各读一次。`ledger-cmd.mjs:367-376` 的循环与 `BEGIN IMMEDIATE`（`:364`）本轮实读，先例 `design-slots.mjs:157` 同源。 |
| N1 | (new) | docs/core/requirements/ENGINEERING-MODE-V2-SPEC-LEDGER.md | 🟡 | New（report-and-pass） | 需求档两处旧措辞未随 AC-M2-35 改写收正，读者仍可读成「豁免」：`:58`「只对**新增**核销生效，存量已核销行不回改」与 `:87`「待讨论 / 待设计 → 已核销 **直通**（`evidence` 非空）」。不重开第 2 条判断（不设豁免、不加分支），只是给这两句补一限定（「并过 F-LX4 机检」），由父侧收口轮落；不阻塞。 |
| N2 | (new) | docs/batches/2026-10-26-ledger-close-gate.md | 🟡 | New（report-and-pass） | 受影响文件表缺集成用例档：§二 把 10-3 的证据写成「`test/integration/ledger-close-proof.test.mjs`」（`:311`），§五 表只列「本批单测档（实施席建、收口删）」（`:386`），未列该新建集成档、也未写谁建。`test/RTM.md` 已登记该证据档 ⇒ 实施面清单不完整，收口时易缺件。补一行（新建 / 归属）即可；不阻塞。 |
| N3 | (new) | docs/batches/2026-10-26-ledger-close-gate.md | 🔵 | New | `:187` 文本残缺：「落盘形 = 槽文件 `engDesignTokenBatches`，`{ 返回形与注释逐字）。」——落盘形描述被截断（疑为修正轮编辑事故）。机制仍可从 `:186` / `:189` 读出（键 = designId、值 = 批档路径、一次值扫），故仅记为卫生项。 |
| N4 | (new) | docs/batches/2026-10-26-ledger-close-gate.md | 🔵 | New | §八 上抛项已过期：第 1 项仍写「请在写用例标题**之前**把 §二 的 `10-3` 行贴入故事 10 表」（`:436`），而 `§1:107-111` 已贴入 `test/RTM.md:118`；第 2 项仍写「待裁」，而 `§1:113-117` 已选 A。建议 §2 追加一行处置或由 §6 记明，防重复贴行。 |

计数：第 1 轮 15 条 → 14 Fixed · 1 Accepted（#2，用户裁定）· 0 Unfixed；新发现 🔴 0 · 🟡 2 · 🔵 2。
VERDICT: pass

## §4 用户批准（主 agent）

**状态行**：已批准 2026-10-26

**批准依据**：设计评审第 2 轮 `VERDICT: pass`（第 1 轮 15 条 → 14 Fixed · 1 Accepted(#2 用户裁定) · 0 Unfixed；新发现 2 🟡 + 2 🔵，均非 must-fix）。用户 12:40「后续自动跑完吧」= 整批令，覆盖批准门（FR36）。

**批准范围**：§2 设计全文（三件机检 · 落两处写库 · 值扫反查 · 拒因分类 · 提示词 why）。

**实施面**（§2 §五 受影响文件表）

| 档 | 动作 |
|---|---|
| `thincoder-core/ledger-cmd.mjs` | 新增 `assertCloseOutProof` + 两处调用（`applyRowUpdate` / `applyRowClose`），`≤+45` |
| `thincoder-core/ledger-tools.mjs` | 四调用点透传 `agent`，`≤+4` |
| `thincoder-core/agent-tools/batch-skeleton.mjs` | 段头正则提取 + `isBatchRecord` 谓词，`≤+8` |
| `thincoder-core/prompts/persona-engineering.md` | 轻通道收口段补 why（英文，`+2`） |
| `test/integration/ledger-close-proof.test.mjs` | **新建**——RTM `10-3` 的证据档（评审 N2 点名的缺口） |
| 批内单元测试档 | 实施席建、收口删 |

**收口轮待办（不在实施面）**

1. 机制本体搬 `docs/core/design/LEDGER.md` §3 / §3.1 / §8 / §9（D2：批档可删，机制须住永久档）
2. 需求档 N1 措辞收正：F-LX4 `:58`「只对新增核销生效」与 AC-M2-14 `:87`「直通」补「并过 F-LX4 机检」限定
3. §2 的 N3（`:187` 文本残缺）· N4（§八 上抛项过期）由父侧在 §6 记明或请设计席追加

## §5 实施记录（eng-coder）
**状态行**：实施完成



### 交付摘要

核销机检（F-LX4）落地：写 `已核销` 的两处逐行共函数（`applyRowUpdate` / `applyRowClose`）在写库前判三件——① `task_book` 所指批档在盘 ② 该档 §1 = `已收口` ③ 该批档在 design token 槽的批次归属有记录。

缺一即拒、一次报全缺项、行零改；判据只有目标值一条（不判来源态）。

归属反查 = `unionBatches(agent, { strict: true })` 值扫 + `batchPathKey` 归一。严格读失败 ⇒ 必写 `已核销` 的批量径在 `BEGIN` 之前整批拒、不进 `skipped`。

③ 只读归属旁列，从不读 token 值面。

### 改动文件（读数口径 = `split('\n').length - 1`；设计口径 = 同值 +1）

| 档 | HEAD | 现 | Δ | 面 |
|---|---|---|---|---|
| `thincoder-core/ledger-cmd.mjs` | 445 | 454 | +9 | 产品：两处机检调用点 + 四导出收 `agent` + 批量径两次「一次读入」改造 |
| `thincoder-core/ledger-close-proof.mjs` | — | 80 | 新建 | 产品：机检本体 + 槽号分辨 + 读入辅助 + 指针值谓词（`filePartOf`/`namesPointer` 随迁） |
| `thincoder-core/agent-tools/batch-skeleton.mjs` | 305 | 313 | +8 | 产品：`SECTION_1_HEADER_RE` 单源常量 + `isBatchRecord` 谓词 |
| `thincoder-core/ledger-tools.mjs` | 357 | 357 | 0 | 产品：四调用点透传 `agent: ctx?.agent` |
| `thincoder-core/prompts/persona-engineering.md` | 468 | 470 | +2 | 提示词：`:248` 后补 why 两句（英文，无工具名无路径） |
| `test/integration/ledger-close-proof.test.mjs` | — | 141 | 新建 | 集成用例 `10-3`（RTM `:118`） |
| `docs/batches/2026-10-26-ledger-close-gate.test.mjs` | — | 297 | 新建 | 批内单测 U1–U13（收口删） |

**越出 §4 实施面的改动（1 项，已披露）**：新建产品档 `thincoder-core/ledger-close-proof.mjs`。依据 = §2 §五「实落超 500 ⇒ 主动拆分并报父侧」：机检本体内联会把 `ledger-cmd.mjs` 推过 500 顾问线，拆分后 454 行；`filePartOf`（§6.1 口径 1 单源）/`namesPointer` 随迁，`ledger-cmd` 反向 import，方向单向无环。**请父侧收口轮把该档补入 `docs/core/design/LEDGER.md` 受影响面与 §2 受影响文件表。**

### 验收读数（回指 §2 §六）

| 判据 | 读数 |
|---|---|
| 缺 ①（不在盘） | U2：拒因首行 `缺：①` + `① 批档不在盘（task_book = …）`；行 status 仍 `待核销`、`closed_at` 仍空 |
| 缺 ①（无指针） | U3：追认径拒 `① 行无 task_book 指针`；行仍 `待讨论` |
| 缺 ②（未收口） | U4：一次报全缺项 `缺：② ③`，② 行点名 `§1 = open`；③ 行同报 |
| 缺 ②（非批档） | U5：缺 `② 指针所指档不是批档（… 无 §1 段）`，③ 同报 |
| 缺 ③（无归属） | U6：缺 `③ 本会话槽内无该批档的归属` |
| 缺 ③（无槽号） | U7：缺 `③ 本会话无槽号（manifest 无 active）` |
| ③ 读失败 | U8：缺 `③ 读不到 token 槽归属（…）`；行零改 |
| 全过 | U1：`status = 已核销`、`closed_at` 非空 |
| 三路（四径）都过闸 | U11：close 单行 ∥ close 批量 ∥ update 单行 ∥ update 批量 同拒；批量径记 `skipped`、行零改 |
| 判据 = 目标值 | U12：撤回（→ 已废弃）零阻（批档未收口 ∧ 无归属也不进闸） |
| 存量不回改 | U13：已核销行复跑 close ⇒ 拒因逐字 = 上线前原句；库文件 byte-identical；行值逐字不变 |
| 集成 | 10-3：a 核销成功（`closed_at` 非空）· b 点名缺 ② · c 点名缺 ③；b/c 行零改 |

### 跑法与结果（原文）

- `node --test docs/batches/2026-10-26-ledger-close-gate.test.mjs` ⇒ `tests 13 · pass 13 · fail 0`
- `node --test test/integration/ledger-close-proof.test.mjs` ⇒ `tests 1 · pass 1 · fail 0`
- `node --test test/integration/*.mjs` ⇒ `tests 29 · pass 29 · fail 0`（既有不回归）
- `doc_check(mode:"gate", docs=["thincoder-core/prompts/persona-engineering.md"])` ⇒ `DOC-CHECK GATE: PASS`（0 命中）
- `node --check`（五档产品/测试档）⇒ Syntax OK

### 与设计的偏差（逐项披露）

1. **行数**：`ledger-cmd.mjs` 设计额度 ≤+45 —— 实落 +9（454）；机检本体住新拆分档（不在原受影响文件表，见上）。
2. **③ 读失败复现法**：设计给 `icacls` 去读权；单测改用「槽档位置落成目录 ⇒ `readFileSync` EISDIR」——同类（非 ENOENT 的 I/O 读失败）、跨平台可复现，断言面不变。
3. **`slotNoOf`**：`token-ttl.mjs currentSlotNoReadOnly` 未导出且本批零改，本档以同一取值式复述（`_slot` 优先、manifest `active`），注释点明同源；仅用于 ③ 两种成因分辨。
4. **update 批量·纯字段补丁径**：设计「严格读抛 ⇒ 整批拒、不进 skipped」按 close 批量径落实；纯字段补丁径为「读一次、不抛、逐行报 ③」——该支只对归档行触（存量已知接受），业务结果不变，代码注释如实写。
5. **①/② 无独立读失败形**：`readFileSync` 读失败（EACCES ∥ 共享冲突）原样抛出（fail-closed、事务回滚、行零改）；设计只为 ③ 立了读失败形，新增形属设计面，留收口轮裁。
6. **RTM `10-3` 入口句**：`thincoder ledger close --id <行>` 在仓内不存在（CLI `ledger` 只路由 migrate/audit，`thincoder-cli/src/command-table.mjs:160`）；集成用例走模型面 `ledger` 工具 close action（真用户可径）。RTM 行与 §2 §二入口措辞请父侧收口轮收正。

### 审计 ∥ 代码评审 · 修正轮 · 终端状态

- **内部审计（explore）1 轮**：must-fix 2 —— M1 `ledger-cmd.mjs` 越 500 未按设计拆分（已修：拆出 `ledger-close-proof.mjs`，454 行）· M2 RTM 入口句不存在（本席无笔域，上抛父侧）。报告项 R1–R4：R3（batch-skeleton +9 vs ≤+8）已修（压回 +8）；R1/R2/R4 记明并披露。
- **代码评审（advisor · type=code）1 轮**：`VERDICT: pass`（0 🔴 · 4 🟡 均非 must-fix · 4 🔵）。处置：🔵 死 import 已删 · 🔵 悬空注释已删 · 🔵 注释与代码相反已改正 · 🟡（①/② 读失败形 · 新档不在实施面 · 实施记录证据 · RTM 入口句）逐条披露，属设计面/父侧笔域。
- **修正轮 2 轮**（审计后拆分一轮 · 评审后注释/import 一轮），终端状态 = **clean**（本席笔域内无可修未修项）。

## §6 验证与收口（父代理）

**状态行**：已收口 2026-10-26

## 裁定：通过的核销机检

写 `已核销` 的两处写库共函数（`applyRowUpdate` / `applyRowClose`）在写库前判三件，缺一即拒、一次报全缺项、行零改：

1. `task_book` 所指批档在盘
2. 该档 §1 = `已收口`
3. 该批档在 design token 槽的批次归属有记录

**判据只有「目标值 = 已核销」一条**——不判来源态（用户 12:06 原话：「你只要管『已核销』就可以了，为啥要管是从哪里到『已核销』？」）。

## 验证读数（父侧实跑）

| 检查 | 命令 | 读数 |
|---|---|---|
| 批内单测 | `node --test docs/batches/2026-10-26-ledger-close-gate.test.mjs` | 13 / 13 通过 |
| 集成用例 | `node --test test/integration/ledger-close-proof.test.mjs` | 1 / 1 通过 |
| 集成套件 | `node test/run.mjs` | **33 / 33 通过** |
| 文档门 | `doc_check(mode:"gate")` | **PASS**（1 档全清） |

## 收口同步清单（D7）

| 项 | 结果 |
|---|---|
| §2 ↔ 设计档对账 | 一致。设计落点 / 三件判据 / 反查方向 / 拒因分类与实施一致 |
| 上批遗留交叉核 | 无 |
| 修正轮落地前置 | 两轮评审 15 条 + 修正轮全部落地（评审第 2 轮 `VERDICT: pass`） |
| 搁置清单复核 | 见下「未决项」三条 |
| 暂缓批复核 | 无暂缓批 |
| 用户文档面同步 | 无用户可见能力变更（纯内部闸） |
| 台账可见面 | 结算行见下 |

## 未决项（已入台账，不在本批）

| 行 | 内容 |
|---|---|
| `#1809` | 400 后三次重发的环路未定位（疑 digest 自动轮）——**与本批无关**，是上下文批查出的 |
| `#1810` | 修后 `stats` 与状态栏 `%` 分叉 |
| `#1811` | `shrinkOversized` 后基线未失效（读数偏高） |

**本批内产生、未处理的一条**：实施席越出 §4 实施面新建了 `thincoder-core/ledger-close-proof.mjs`（机检本体，为把 `ledger-cmd.mjs` 压在 500 行内）。依据 = §2 §五「实落超 500 ⇒ 主动拆分并报父侧」。**父侧追认**：拆分方向正确，454 行未越线；`docs/core/design/LEDGER.md` 的受影响面补记归收口轮。

## 一批一份的账

本批从 11:54 用户提出到 14:13 收口，2 小时 19 分。设计 2 轮 · 评审 2 轮 · 实施 1 轮。批档 600 行，未越界。

**这批最值钱的一处**：用户 12:06 那句「控制好目的地就行了，管来源干嘛」，把设计从「枚举三条来源路径」拉回「判目标值」——**一条规则代替一组情况**。
