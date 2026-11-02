# 2026-11-02 · review-ledger-link
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-11-02 · 来源 = 用户 2026-11-02 10:23 提问「**台账呢？文档评审时是否有台账的关联？**」→ 10:24 裁「**A**」（现在补：点火时校验台账行在未决态）。
> 台账 = #1988（ENGINEERING-MODE · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-11-02
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

## 1. 讨论（主 agent）

- **已定决定**：**设计评审点火时校验账链** —— 批档除了「可读」，还必须有未决台账行指着它。 · 用户原话：「**台账呢？文档评审时是否有台账的关联？**」→ 裁「**A**」（现在补） · 时间：2026-11-02 10:23 / 10:24

- **覆盖账** = `#1988`

### 依据：断口在哪（父侧实读，2026-11-02）

| 环节 | 与台账的关系 | 出处 |
|---|---|---|
| `batch create` | **原子**：建档 + 开行（`在途` + `task_book` 指针）同一笔事务 | `thincoder-core/agent-tools/batch-ledger-bind.mjs`（`applyRowUpdateTx` 迁 在途 + 写 task_book） |
| **设计评审点火** | **零** | `thincoder-core/agent-tools/design-token.mjs` 全档 `ledger` **零命中** |
| **评审 pass 签 token** | **零** | 同上 |
| 台账侧改行 | **零** —— 不看批档是否还在飞 | `thincoder-core/ledger.mjs` 与 `thincoder-core/agent-tools/ledger.mjs`：`findInFlightBatch` / `在飞` 均**零命中**；`thincoder-core/ledger-cmd.mjs` 只有 `taskBookOnDisk`（在盘读数），不是门 |
| `batch close` | 有：覆盖行转「条件」并重锚 | 本批收口回执 |

**⇒ 链断在中间，两头都不查。**

### 由此长出的三种状态（前两条父侧推断，未跑过）

| # | 情形 | 后果 | 验证状态 |
|---|---|---|---|
| 1 | 台账行被撤回 / 核销，批档还开着 | 评审照发、token 照签、代码照改 —— 做的工作没有账挂着 | **未验证** |
| 2 | 行的 `task_book` 被改成另一本批档 | 收口重锚按指针走 ⇒ 结错账 | **未验证** |
| 3 | 批档 reopen 后行不动 | 有意如此，不算口子 | — |

**⇒ 设计席须自己验证 1 ∥ 2 能不能真跑出来，别照抄我的推断。**

### 要判的岔口（交设计席）

**① 补在哪一头。** 两条路：
- **点火时校验**（本批口径）：`batchDoc` 可读 **且** 有未决行指着它；
- **台账侧禁止**：行被结 / 被撤时，若其 `task_book` 指向在飞批档 ⇒ 拒。

**⇒ 我倾向点火时校验**，理由：台账侧那条会与既有「兜底核销」（条目已完成、挂靠批未收口）正面冲突，为它开例外又是口子。**但这是设计席判，要给依据。**

**② 普通模式怎么办。** `docs/core/design/LEDGER-SELF-CONTAINED.md` §5.5 判「台账射程」在 normal 模式**不适用**（normal 纪律档无台账面），而普通模式同样发设计评审（收口评审走同一通道）⇒ **同一道门在普通模式不是「不适用」，是「永远不满足」**。这条必须给出口，且不能是「普通模式豁免」那种口子。

**③ 「未决态」是哪几态。** 四态（待讨论 / 待设计 / 在途 / 待核销）还是只认 `在途`。**给判据，不要给枚举完事。**

### 边界

- 只补**点火那一刻**的账链检查；不改台账状态机 ∥ 不改六态表 ∥ 不改 `batch close` 的重锚语义。
- **与 `#1987` 的关系**：那条管授权（token 有没有人收），本批管账（活有没有人挂着）。别把 `#1987` 的收尾搅进来。
- 提示词面若要一句话，交设计席判。

- **已定决定**：**台账规则两模式同一套，差别只在约束强度** —— 工程模式靠机制（机械拦），普通模式靠自觉（不设机械门，规则照旧）。**不得把「普通模式没有机械门」读成「普通模式没有这条规则」。** · 用户原话：「**我没有说过台账在普通模式不适用！我的说法一直是同一套规则，不同的约束强度，功能模式靠机制，普通模式靠自觉，你们不要自己给自己开口子。**」 · 时间：2026-11-02 10:27

### 由此暴露的既有错话（本批须收正）

| 档 | 逐字 | 判 |
|---|---|---|
| `docs/core/design/LEDGER-SELF-CONTAINED.md` §5.5 | 「台账射程（§5.2 条 1） \| 适用 \| **不适用** \| 台账是**工程模式机制**——normal 纪律档无台账面」 | **错**。与 `docs/core/requirements/NORMAL-MODE.md` §5.6「管理工作的逻辑两模式**同一套**（批次档 + 台账 + 收口）；差别只在**约束强度**」正面冲突 |
| `docs/core/requirements/NORMAL-MODE.md` §5.6 | 同上逐字 | **对**，本批以它为准 |

**⇒ 父侧在本节首版把 §5.5 当成了既有事实，据此去设计「普通模式怎么绕」——那正是用户指出的「自己给自己开口子」。已纠正：§5.5 须改对，不是另写一条覆盖它。**

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成 · 2026-11-02（修正轮：§3 十一条逐条落定）

## 本批条目（覆盖 = 台账 `#1988`）

| # | 条目 | 覆盖点 | 验收回指 |
|---|---|---|---|
| E1 | **点火账链门** | 设计评审点火时，批档除「可读」外还须有未决台账行的 `task_book` 指着它；不满足即拒发 | `docs/core/design/ADVISOR-GUARDS.md` §2 第 7 条 · A-AG27 · C1 / C2 |
| E2 | **判据单源** | 「指着本档」= `resolveBatchRows` 同址选行；「未决」= `PENDING_STATUSES` 四态 | 同条「判据三件」· C3 / C4 |
| E3 | **两模式同判：门不读模式位** | 任何设计评审都要有未决行指着它的批档；工程 / 普通同一道门、同一判据、同一拒文，代码零模式分支 | 同条「两模式同判」段 · C5 |
| E4 | **门只判点火** | 结算面（`settleDesignReview`）零台账读；点火后撤行 = 已知残余（登记在案，不设第二道门） | 同条「门只判点火」＋「残余」· C6 |
| E5 | **§5.5 / D7 错话收正 + 账链例外** | 「台账是工程模式机制」三处收正；并写明账链 = 两模式同一道机械门 | `docs/core/design/LEDGER-SELF-CONTAINED.md` §5.5 · D7 · C7 |
| E6 | **失败四形全落拒** | 无项目根 / 库不在盘 / 坏档 / 零行 ⇒ 一律拒；零路径落放行 | 同条「失败路径全落拒」· C8 / C9 |
| E7 | **点火判据顺序成链** | 类型门 → 准入门 → 批档可读 → 账链 → 文档范围 | 同条顺序表 · C10 |
| E8 | **集成面处置** | 6-1…6-5 ∥ 24-1…24-3 夹具补账；17-3 新行；17-1 ∥ 17-2 **零改**（17-1 不经点火面、17-2 不携 `batchDoc`） | 同档 §1.3 delta · §12「夹具处置」· C11 |

**明确不在本批**：台账侧禁止（不改 `ledgerClose` / `ledger update` / `ledgerCloseBatch`）· 不改六态表与迁移表 · 不改 `batch close` 重锚 · 不做「批档 reopen ⇒ 自动补行」· 不为 `已核销` 造新的回退边 · `#1987`（授权面）不在本批。

## 设计档落点（本次已落）

- `docs/core/design/ADVISOR-GUARDS.md` §2 第 7 条 = **机制单源**：门位 / 点火判据顺序表 / 判据三件（各带来源）/ 读序 / 失败四形 / 分支依据表 / 可达性表 / 拒文逐字 / 残余登记 / 拒因三问 / 三问（新档）/ 实现落点 / 边界。
- `docs/core/design/ADVISOR-GUARDS.md` §1.3 = 本门的集成 delta（破行、零改、17-3）；§10 = A-AG27 验收；§12 = 夹具处置与缝（原「工具面不读台账」那句已改）。
- `docs/core/design/BATCH-RECORD.md` §1.3 · §4.2 = 点火契约的一行指针（可读之外还要有账），细则指回第 7 条，不复述。
- `docs/core/design/LEDGER-SELF-CONTAINED.md` §5.5 · D7 = 错话收正 + 账链例外（判据 = 用户 2026-11-02 10:27 原话 + `docs/core/requirements/NORMAL-MODE.md` §5.6）。
- `docs/core/design/LEDGER.md` **未触**：判据只引不改——选行单源 `resolveBatchRows`、未决四态 `PENDING_STATUSES` 均住代码。
- `test/RTM.md` **待父侧落** 17-3 编号（`test/**` 面不属设计席写域）；设计侧已定其交互 / 结果 / 入口 / 回指。

## 机制设计（摘要；细则 = `docs/core/design/ADVISOR-GUARDS.md` §2 第 7 条）

**门位**：`type="design"` ⇒ 准入门判定块之后、`const documents = args.documents || null` 之前（`thincoder-core/agent-tools/advisor.mjs`）。批档的绝对路径在本门就要用 ⇒ `resolveBatchDocPath` 提前调一次，既有绑定行复用该值（不第二次解析）。

**判据**：`resolveBatchRows` 选出的本档行里，是否 ≥1 行状态 ∈ `PENDING_STATUSES`。否 ⇒ 拒发 + `criterion=batchdoc-no-ledger` + `_advisorRefusals` 登记（零实例 / 零 token / 零槽 / 零 LLM）。

**读序**：`resolveLedgerRoot(批档绝对路径, 会话锚)` → `openLedger(根, { boundary })`（`create` 缺省 false——不建库）→ `resolveBatchRows(db, 根, 批档绝对路径)` → 未决过滤 → `db.close()`。

**失败四形全落拒**：无根 ⇒ `reason=no-ledger-root`；库不在盘 ∥ 非台账库 ⇒ `reason=no-pending-row`（零行可判）；坏档 ⇒ 门内 catch ⇒ `reason=ledger-unreadable`；读成功零行 ⇒ `reason=no-pending-row`。`if (!db) 放行` 与 throw 外逸都不算答案。

**零模式位**：门内不读 `ctx.agent.config?.agent?.engineering`——无模式分支、无豁免分支。普通模式照规则走即满足（F-N2.2；`batch create` 建档与开行同一笔）。

**可达性三径**（父侧 §1 表第 1、2 条标「未验证」，本席坐实到代码）：① 行被撤回——`ledger-write-ops.mjs:152-166` 撤回不设机检，**可达**；② 核销后重开——`ledger-close-proof.mjs:50-52` 放行核销 + §4.18-B 重开零触台账，**可达**；③ 指针改挂他档——`ledger-write-ops.mjs:80-91` 臂② 只判新指针，**可达**。

**反证**：§1 表第 3 条（reopen 后行不动）经复核为**非口子**——行仍 `待核销`（未决）⇒ 门放行。

## 三件岔口的判（依据逐条在 §2 第 7 条）

| 岔口 | 判 | 一句话依据 |
|---|---|---|
| ① 补哪一头 | **点火时校验** | 台账侧那条与「兜底核销」正面冲突（`docs/core/design/BATCH-RECORD.md` §5.2 · BR-17 要结行），例外一开 = 门破；且要在 DB 写径里读批档 §1 |
| ② 普通模式 | **同一道门，同判** | 用户 2026-11-02 原话「做了就要守规矩，否则把帐弄乱了」；普通模式有批档（F-N2.2），`batch create` 与开行同一笔（`batch-ledger-bind.mjs:147-161` 无模式位） |
| ③ 未决态 | **`PENDING_STATUSES` 四态** | 判据 = 「这条账还欠一次结账」；产品的未决定义已存在一处（`ledger-db.mjs:134`）；只认 `在途` 会把合法在途态 `待核销` 判成无账 |

## 受影响文件与层级结论

| 文件 | 动作 | 层 |
|---|---|---|
| `thincoder-core/agent-tools/advisor.mjs` | 账链门调用 + 拒文构造 + `resolveBatchDocPath` 提前解析 | 产品码 |
| `thincoder-core/agent-tools/batch-ledger-link.mjs`（新） | 判据函数：根解析 → 开库 → `resolveBatchRows` → 未决过滤 → 四形拒 | 产品码 |
| `test/integration/review-doc-scope.test.mjs` | 夹具改：批档入项目根 + 种未决行 + 台账缝；头注那句「工具面不读台账」改写（6-1…6-5 断言逐字不变） | 测试 |
| `test/integration/advisor-record-gate.test.mjs` | 新增 17-3；17-1 ∥ 17-2 零改 | 测试 |
| `test/integration/review-standards-injection.test.mjs` | 24-1…24-3 夹具补账（携 `batchDoc` 走同一道点火面、夹具缺未决行）——断言逐字不变 | 测试 |
| `test/RTM.md` | 17-3 编号先落（父侧） | 测试索引 |
| `thincoder-core/prompts/discipline-normal.md` | `## Work management (batch record + ledger + closeout)` 节：①加账链一句，②节头句补分句（两处逐字稿 = `docs/core/design/LEDGER-SELF-CONTAINED.md` §5.6；落笔 = eng-coder） | 提示词面 |
| `docs/batches/2026-11-02-review-ledger-link.test.mjs` | 当批单测（收口随批删） | 测试 |
| `docs/core/design/ADVISOR-GUARDS.md` · `docs/core/design/BATCH-RECORD.md` · `docs/core/design/LEDGER-SELF-CONTAINED.md` | 设计落点（本次已写） | 文档 |

**层级结论**：无文件跨层。新增判据档与 `advisor.mjs` 同层（产品码）；三个集成用例档与当批单测同层（测试）。

**依赖方向**：`batch-ledger-link.mjs` 动态 import `../ledger.mjs`（与 `thincoder-core/agent-tools/batch-ledger-bind.mjs:124` 同一手法——`node:sqlite` 静态引会破 W8 契约②），不引 `advisor.mjs`、不引 `batch-lifecycle.mjs`。

## 验收对照（逐条回指 §2 第 7 条）

**机检命令**：`node --test docs/batches/2026-11-02-review-ledger-link.test.mjs`。

**台账缝**：`_setLedgerDirForTest(临时目录)`（`thincoder-core/ledger-db.mjs:33`）+ `_resetLedgerDirForTest()` 复位。

**种行走写面**：`ledgerAdd({ cwd, row, boundary })`（`thincoder-core/ledger-cmd.mjs:144`，它自己开库）→ `ledgerUpdate({ cwd, id, patch: { status, task_book }, boundary })`（同档 `:168`）——不另开库、不直写 SQL。

| # | 条目 | 判据 | 机检形 |
|---|---|---|---|
| C1 | E1 | 无未决行 ⇒ 拒发 | 返回串含 `criterion=batchdoc-no-ledger` ∧ `reason=no-pending-row` ∧ `Nothing was sent`；`_advisorRefusals` 已登记；`_engDesignTokens.size === 0` |
| C2 | E1 | `create` 的档（行 `在途`）⇒ 放行 | 返回串不含该拒因（零回归锚） |
| C3 | E2 | 行 `在途 → 待核销` ⇒ 放行 | 同 C2 断言 |
| C4 | E2 | 行 `已废弃` / `已核销` ⇒ 拒 | 同 C1 断言 |
| C5 | E3 | 门零模式分支 | 新增代码对 `agent.engineering` 零命中（内置 grep 工具读数）；普通模式无未决行 ⇒ 拒因形态与 C1 逐字相同 |
| C6 | E4 | 结算面零改 | `git diff --stat thincoder-core/agent-tools/design-token.mjs` 为空 |
| C7 | E5 | §5.5 / D7 错话不再出现，且例外判据行不再给普通侧开口 | 逐行扫 `docs/core/design/LEDGER-SELF-CONTAINED.md`：① 首格为 `例外判据（§5.3 条 1–3）` 的行，其普通模式列不含 `不适用`；② 首格以 `账链（批档须挂未决行）` 开头的行含 `同一道机械门`；③ 全档 `不设机械门` ∥ `由纪律承担` 零命中 |
| C8 | E6 | 批档不在任何项目内 ⇒ 拒 | 临时根下的夹具批档（无 manifest）⇒ `reason=no-ledger-root`，零实例 / 零 token |
| C9 | E6 | 库不在盘 ∥ 坏档 ⇒ 拒，**不 throw** | 缝内不建库 ⇒ `reason=no-pending-row`；把库文件写成垃圾字节 ⇒ `reason=ledger-unreadable`，调用返回拒串、不抛异常 |
| C10 | E7 | 顺序链 | 未携 `batchDoc` ⇒ 只报 `batchdoc-missing`（不出 `batchdoc-no-ledger`）；携了不可读 ⇒ throw（文案逐字），不出 `batchdoc-no-ledger` |
| C11 | E8 | 集成面 | 6-1…6-5 ∥ 24-1…24-3 ∥ 17-1…17-3 全绿；`Record:` 行读数与 `reason` 三值在位 |

**集成面（RTM delta）**：

- **破行 = 6-1 ∥ 6-2 ∥ 6-3 ∥ 6-4 ∥ 6-5**（`test/integration/review-doc-scope.test.mjs`）：夹具批档建在 `tmpdir()` 内、无项目根 ⇒ 全被 `no-ledger-root` 拒；处置 = 批档进该例项目根 + 种未决行 + 台账缝，断言逐字不变。
- **破行 = 24-1 ∥ 24-2 ∥ 24-3**（`test/integration/review-standards-injection.test.mjs`）：夹具已在该例临时项目根内，缺台账缝与未决行 ⇒ `no-pending-row`；处置 = 种未决行 + 台账缝，断言逐字不变。
- **零改 = 17-1 ∥ 17-2**：17-1 全程不经工具层（直调 `settleDesignReview`、`run` 自造）⇒ 点火面不在路径上；17-2 夹具恰恰不携 `batchDoc`（断言 = `criterion=batchdoc-missing`）⇒ 停在准入门（顺序表第 2 行）——给它补 `batchDoc` 会把「不携批档 ⇒ 拒发」这条用例的意义翻掉。
- **零改 = 10-1 ∥ 10-4**：两例直调 `settleDesignReview`（`settleWithBatchDoc` 自造 `run`），不经点火面。
- **新增 = 17-3**：本门自己的业务行（批档的未决行被撤后发评审 ⇒ 拒；另一本带未决行的批档 ⇒ 放行）；编号先落 `test/RTM.md` 故事 17，用例标题照 `test('17-3 …')` 同号。

## 关键决策（含被否）

| # | 决策 | 被否 / 依据 |
|---|---|---|
| KD-1 | 门落**点火面**，台账侧零改 | 被否 = 台账侧禁止（与兜底核销正面冲突；把文档依赖塞进 DB 事务路径） |
| KD-2 | 「未决」= `PENDING_STATUSES` 四态（复用产品既有定义） | 被否 = 只认 `在途`（会把合法在途态 `待核销` 判成无账；另立词表 = 漂移源） |
| KD-3 | 门读**同址**（`resolveBatchRows`），不读串等值 | 同一批档三种指针写法并存，串等值会漏行（`thincoder-core/ledger-write-ops.mjs:182-188`） |
| KD-4 | 结算面不加第二道门 | 批档一收口即冻结 ⇒ 评审写不进 §3 ⇒ §1.1 已拦；再加一道 = 同一件事的第二个口子 |
| KD-5 | 门**两模式同判**，代码零模式分支 | 用户 2026-11-02 裁定；被否 = 「门只装工程模式 / 普通模式由纪律承担」（= 开口子：账是同一个账） |
| KD-6 | 失败四形**全落拒**，reason 三值（不另立 criterion） | 被否 = `if (!db) 放行`（把「读不到」判成「不必看」，与 §1.1 `batch-unreadable` 反着走）· throw 外逸（点火崩、拒发不登记）· 另立三个 criterion（先例 = §12 的 criterion 恒定 + reason 分叉） |
| KD-7 | 夹具种行走**台账写面**，不直写 SQL | `在途` 必挂 `task_book` 这类 CHECK 正是被测前提的一半；直写 SQL 会把门的前提换了 |
| KD-8 | 判据函数**另立新档** `batch-ledger-link.mjs` | 三问：`resolveBatchRows` 复用（选行单源）；`batch-ledger-bind.mjs` 的 `ledgerBindBatch` = 写面绑定，读面判据塞进去会与建档绑行共用出口；`node:sqlite` 只能动态引（W8 契约②） |

## 上抛项

- **[上抛·待裁]** `已核销` 的行被重开批档「甩下」后**无回退边**（`已核销 → 已废弃` 为唯一出边）⇒ 修法只有另起批档；同理 `batch` 工具**没有**「给已有批档补挂一行」的 action（只有 `create` 绑行）。本批按边界不做，建议父侧记一条台账行：`batch` 增「现役档挂行」动作。
- **[上抛·待裁]** 点火后撤行 = 已知残余（门只判点火，不判结算）。本批按 KD-4 不堵；是否另立批次补第二道门，请父侧裁。
- **[上抛·待裁]** `test/RTM.md` 故事 17 的 **17-3** 编号需父侧先落（`test/**` 面不属设计席写域）；设计侧交互 / 结果 / 入口 / 回指已定。
- **[上抛·知会]** §5.5 收正同时改了同源的两处表述（台账射程行 / 台账头部自持行）与落点结论——同一类错「台账在普通模式只是纪律」，一并收正。
- **[上抛·知会]** 需求档侧未触：`docs/core/requirements/NORMAL-MODE.md` §5.6 原文即正确口径，且其括注「（参数契约 + 账链）」正是本批判据原话。

## 修正轮 2（§3 轮次 4–8 逐条落定 · eng-designer）

**落点一律仓根完整路径**。逐条：编号 → 改法 → 落点。

- **🔴1（17-1 ∥ 17-2 判「破行」错）** → 该格整格改写为「零改」，并写明两条各不经过门的理由；受影响文件表与 RTM delta 同步。落点 = `docs/core/design/ADVISOR-GUARDS.md` §1.3「账链门的集成 delta」表第 1 行 · 本节 E8 行 · 受影响文件表第 4 行 · 「集成面（RTM delta）」第 2 条。
  - 逐字：`| 零改 | 17-1 ∥ 17-2 | 17-1 全程不经工具层（直调 settleDesignReview、run 自造）⇒ 点火面不在其路径上；17-2 夹具恰恰不携 batchDoc ⇒ 停在准入门（顺序表第 2 行），到不了账链门 |`
- **🔴1 半句（「挡在 batchdoc-missing 之前」与顺序表相左）** → 该半句随整格删除；优先级改按顺序表写成链。落点 = 同表第 1 行（已删）+ `docs/core/design/ADVISOR-GUARDS.md` §12 拒因优先级句，逐字改为 `batchdoc-missing → batchdoc-no-ledger → scope-not-doc ∥ no-project-root`。
- **🔴2（§5.5「例外判据」行仍判普通侧不适用）** → 判据列改「适用 ∥ 适用」，理由换成「三条管的是规则与例外本身，不是某一模式专属机制」。落点 = `docs/core/design/LEDGER-SELF-CONTAINED.md` §5.5 表末行。
- **🟡3（C7 的 grep 面跑不出来）** → 改成逐行锚定形：① 首格为 `例外判据（§5.3 条 1–3）` 的行不含 `不适用`；② 首格以 `账链（批档须挂未决行）` 开头的行含 `同一道机械门`；③ 全档 `不设机械门` ∥ `由纪律承担` 零命中。落点 = 本节验收对照表 C7 行。
- **🟡4 ∥ 🟡5（夹具配方写成工具形 + 多一步开库）** → 按签名改写，并去掉多余开库、补 `assertTaskBookGate` 判据。落点 = `docs/core/design/ADVISOR-GUARDS.md` §12「夹具处置」第 3 条 · 本节「台账缝」句。
  - 逐字（节内）：`ledgerAdd({ cwd, row, boundary })`（`thincoder-core/ledger-cmd.mjs:144`，它自己开库）→ `ledgerUpdate({ cwd, id, patch: { status, task_book }, boundary })`（同档 `:168`）。
- **🟡6 ∥ 🟡7（读序开库会写库，引的那一支不可达）** → 读序第 2 步改 `openLedger(derived.root, { readOnly: true, boundary })`；失败表「非台账库」行注明 items 探针只在 `openReadOnly` 内可达。落点 = `docs/core/design/ADVISOR-GUARDS.md` §2 第 7 条「读序」第 2 步 · 「失败路径」表第 2 行。
- **🟡8（`no-pending-row` 两件事一个值）** → 拒文 `Record:` 行补 `db:` 项（`open` ∥ `not on disk` ∥ `unreadable`），并加一段说明它决定 Fix 1 能不能选。落点 = `docs/core/design/ADVISOR-GUARDS.md` §2 第 7 条「拒文（逐字）」`Record:` 行 + 其下新增段。
- **🟡9（落点结论与落点表不一致）** → 结论句收窄到实际落地的三条，并登记条 1 / 条 5 普通侧不另设落地句；§5.6 落点表补第 6 行（normal 纪律档 Work management 节）。落点 = `docs/core/design/LEDGER-SELF-CONTAINED.md` §5.5 落点结论 · §5.6 表。
- **🟡10（测试档头注旧话 + 拒因优先级缺账链一环）** → 头注改写写进动作范围；优先级句补账链一环。落点 = `docs/core/design/ADVISOR-GUARDS.md` §12「夹具处置」第 5 条 · §12 拒因优先级句 · 本节受影响文件表第 3 行。
- **🟡11（normal 纪律档 Work management 节头句未动）** → 补分句，逐字稿落 §5.6；落笔仍归 eng-coder。落点 = `docs/core/design/LEDGER-SELF-CONTAINED.md` §5.6 逐字稿 ② · 本节受影响文件表第 6 行。
- **🔵13（节名按盘上字面）** → 受影响文件表该行改 `## Work management (batch record + ledger + closeout)`。
- **🔵12（4 与 5 同不满足时报 4）** → 只登记、零改。残余：批档与文档都在别处时，回执点名「账」而真因是「文档不在本项目」——两者同不满足时顺序表第 4 行先报，读数需并看 `Record:` 的 `ledger base` 项。

**未改的三处（评审判过、不构成问题）**：账链门两模式同判的机制面（E3 ∥ 两模式同判段 ∥ A-AG27 ∥ KD-5 ∥ 岔口②）；6-1…6-5 夹具改法；10-1 ∥ 10-4 零改。

**本次改动文件**：`docs/core/design/ADVISOR-GUARDS.md` §1.3 · §2 第 7 条 · §12；`docs/core/design/LEDGER-SELF-CONTAINED.md` §5.5 · §5.6；本节。

## 修正轮 3（实施席交回的三处文档漂移 · eng-designer）

**写域 = `docs/core/design/ADVISOR-GUARDS.md` ＋本节。三条都是文档随实现收正——零新语义、零代码面、零扩面。代码面实读：`thincoder-core/agent-tools/advisor.mjs:98-99`（`reason=` 与 `db:` 的实落形）· `thincoder-core/agent-tools/batch-ledger-link.mjs:62`（`db: "not-on-disk"`）∥ `:90`（无根 ⇒ `—`）。**

### ① 拒文两形并存 —— 收成实施席实落的 `reason=`

- **原现文**：`Why: the record says the work is in flight, the ledger says whose work it is — and no unsettled row points at this record (reason: {no-pending-row|no-ledger-root|ledger-unreadable}).`
- **改后形**：`Why: … and no unsettled row points at this record (reason={no-pending-row|no-ledger-root|ledger-unreadable}).`
- **落点** = `docs/core/design/ADVISOR-GUARDS.md` §2 第 7 条「拒文（逐字）」块的 `Why:` 行（现档内只此一形）。
- **同档另两处 `reason: ` 形零改**：§1 未签发提示 ∥ §1.1 记录不合格提示——`thincoder-core/agent-tools/design-token.mjs:136` ∥ `:172` 实读即 `reason: ${…}`，与文本相符，不算同类漂移。

### ② 破行格漏 24-1 ∥ 24-2 ∥ 24-3 —— 补上，射程同扩

- **原现文**：`| 破行（夹具·既有行） | 6-1 ∥ 6-2 ∥ 6-3 ∥ 6-4 ∥ 6-5 | 处置见 §12「夹具处置」 |`
- **改后形（逐字，已落设计档）**：`| 破行（夹具·既有行） | 6-1 ∥ 6-2 ∥ 6-3 ∥ 6-4 ∥ 6-5（`test/integration/review-doc-scope.test.mjs`）· 24-1 ∥ 24-2 ∥ 24-3（`test/integration/review-standards-injection.test.mjs`） | 两档同因——携 `batchDoc` 走点火面、夹具无未决台账行：6-1…6-5 的批档建在 `tmpdir()` 内、不在任何项目内 ⇒ `reason=no-ledger-root`；24-1…24-3 夹具已在该例临时项目根内，缺的是台账缝与未决行 ⇒ `reason=no-pending-row`。处置见 §12「夹具处置」（断言逐字不变） |`
- **两档的成因不同，故分开写**：24 档夹具已在临时项目根内（`test/integration/review-standards-injection.test.mjs:9` 逐字「夹具 = 系统临时域（项目根 + 数据档 + 设计档 + 六段批档 + 临时台账库目录…）」），无根这一形不成立；缺的是台账缝与未决行。
- **落点 a** = `docs/core/design/ADVISOR-GUARDS.md` §1.3「账链门（§2 第 7 条）的集成 delta」表的破行行（上格）。
- **落点 b** = 同档 §12「夹具处置」第 5 条之后新增一段：`**同配方适用于 24-1 ∥ 24-2 ∥ 24-3**（`test/integration/review-standards-injection.test.mjs`）：…缺的是上面第 2、3 步（台账缝 + 种未决行）…三例断言逐字不变。`
- **落点 c（本节受影响文件表补一行）**：`| `test/integration/review-standards-injection.test.mjs` | 夹具改：24-1 ∥ 24-2 ∥ 24-3 批档进该例项目根 + 种未决行 + 台账缝；头注补拒因优先级事实（三例断言逐字不变） | 测试 |`
- **落点 d（本节验收对照表 C11 改后形）**：`| C11 | E8 | 集成面 | 6-1…6-5 ∥ 24-1…24-3 ∥ 17-1…17-3 全绿；`Record:` 行读数与 `reason` 三值在位 |`
- **射程说明**：C11 原文只列 6-1…6-5 ∥ 17-1…17-3；24-1…24-3 同在本门点火面上，故一并入判据。这三例的读数已在 §5 实跑（3 pass / 0 fail）。

### ③ `Record:` 行的 `db:` 补「无根」态

- **原现文**：`Record: … · db: {open at <file> | not on disk at <file> | unreadable at <file>} · rows whose task_book resolves here: {N} (unsettled: {M}).`
- **改后形**：`… · db: {open at <file> | not on disk at <file> | unreadable at <file> | —} · rows …`
- **新增说明段（逐字）**：`` `—` 与 `reason=no-ledger-root` 配对读：批档不在任何项目内 ⇒ 没有库位可点名，`ledger base` 与 `db` 同时记 `—`。四形终局不变（仍拒），差别只在读数。「有根、库不在盘」是 `not on disk` 那一形，两者不混。 ``
- **落点** = 同条「拒文（逐字）」的 `Record:` 行 + 其下 `db:` 说明段之后的新段。
- **四形终局不变**：无根仍 `no-ledger-root` 拒；`—` 只让回执可判「没有库位」与「有库、行没了」两件事。

### 本次改动文件

- `docs/core/design/ADVISOR-GUARDS.md` §1.3（破行行）· §2 第 7 条（`Why:` 行 · `Record:` 行 · 新增 `db: —` 段）· §12（夹具处置新增同配方段）。
- 本节（修正轮 3）。

**未落**：受影响文件表与 C11 的表体行——本节以「落点 c / 落点 d」给出改后逐字形，表体由父侧在此段之上并入（第 4 行以后的重排属父侧笔域）。

**同轮更正（坐标归属）**：修正轮 3 开头那行代码面实读里，`db: "not-on-disk"` 出自 `thincoder-core/agent-tools/batch-ledger-link.mjs:62`，而「无根 ⇒ `—`」那半句的 `:90` 属 `thincoder-core/agent-tools/advisor.mjs`（同一实读，两处坐标不同档）——上文并列写易误读为同档。

## §3 设计评审（评审子代理）
**状态行**：评审通过（第 3 轮：上轮 12 件 Fixed 11 · Accepted 1 · Unfixed 0；新增 🟡1 · 🔵1（均不阻断））



### 轮次 1（评审子代理）

**评审对象**：账链门（点火时校验批档的未决台账行）。

**评审面（四档全读）**：`docs/batches/2026-11-02-review-ledger-link.md` §2 ·
`docs/core/design/ADVISOR-GUARDS.md` §2 第 6/7 条 ·
`docs/core/design/LEDGER-SELF-CONTAINED.md` §5.5 · D7 ·
`docs/core/requirements/NORMAL-MODE.md` §5.6。

**代码实读（判据所需，非改动）**：`thincoder-core/agent-tools/advisor.mjs`（319 行，与设计「现 319 行」相符）·
`thincoder-core/ledger-db.mjs` · `thincoder-core/ledger-write-ops.mjs` ·
`thincoder-core/agent-tools/batch-ledger-bind.mjs` · `test/integration/review-doc-scope.test.mjs` · `test/RTM.md`。

**限制声明**：无项目标准档、无文档地图 ⇒ 文档归属按 Project Guide 与四档互指判。

| # | 类别 | 级 | 问题（摘要） | 建议（摘要） |
|---|---|---|---|---|
| 1 | 集成验收 | 🔴 | delta 判「既有行不破、新增行 = 无」，事实不成立 | 逐行点名被破行；补集成用例档 |
| 2 | 文档归属 | 🔴 | §5.5 / D7 写普通侧「不设机械门」，与第 7 条相左 | 补账链例外；扩 C7 的 grep 面 |
| 3 | 可行性 | 🔴 | 新依赖无失败分支：无根 / 无库返 null、坏档 throw | 定死 fail-closed 照拒；点名根解析单源 |
| 4 | 清晰度 | 🟡 | 两道门顺序只由插入点隐含 | 写死判定顺序链 |
| 5 | 验收 | 🟡 | 未点名可跑命令；台账态构造法与缝未说 | 写死单测命令 + 缝名；改 §12 那句 |
| 6 | 引证保真 | 🟡 | 引需求档「参数契约不分模式」非原文 | 引文改逐字，带「（参数契约 + 账链）」 |
| 7 | 既有件 | 🟡 | 新档无三问答案（已有同向桥件） | 补 existing / none found 一句 |
| 8 | 层级结论 | 🟡 | 结论行含尺寸与预期增量；测试档未判层 | 只留结论；测试档纳入 |
| 9 | 残余登记 | 🟡 | 点火后撤行 ⇒ token 照签，残余未登记 | 边界加一行残余登记 |
| 10 | 拒文 | 🟡 | Fix 1 的 `id:<N>` 无来源 | 补 id 来源（批档头部 / 查询式） |
| 11 | 先例 | 🔵 | 第 7 条未记先例批那一脚 | 补一句查询结论 |

**① 集成 delta 失真（🔴）**

设计 §2 判：「既有行不破、不改」——同句续「新增行 = **无**」。

反向事实一：`test/integration/review-doc-scope.test.mjs` 头注
「故五例的夹具一律补一份可读 `batchDoc`」；夹具注释
「内容不参与本档断言（假端点不读它），但它必须是一个可读文件。」。

⇒ 6-1…6-5 点火携的批档零未决行 ⇒ 落门即被拒。

⇒ 6-1「回执非拒」与 6-2 / 6-3 的 `reason` 断言全部不可达。

反向事实二：`test/RTM.md` 故事 17 节注只列 §1.1 ∥ §1.3 ∥ §2 第 6 条 ⇒ 本门无行可承担。

**② 模式措辞相左（🔴）**

`docs/core/design/ADVISOR-GUARDS.md` §2 第 7 条：
「任何设计评审，都要有未决台账行指着它的批档；没有就拒发」；
「工程模式与普通模式跑**同一道门、同一判据、同一拒文**，代码里没有模式分支」。

`docs/core/design/LEDGER-SELF-CONTAINED.md` §5.5：
「**不设机械门**——由纪律承担」；落点结论「工程侧另有机械门，普通侧只有纪律」；
D7「普通侧不设机械门、由纪律承担」。

⇒ 同一问题（普通模式的账链有无机械门）两处两答。

⇒ C7 的机检形只查「不适用 / 无台账面」⇒ 照此写法可整批通过。

另：第 7 条「普通模式不装这道门，普通模式的账就会乱」宜补「若」字。

**③ 失败分支缺（🔴）**

设计：「判据函数：解析账本根 → 开库 → `resolveBatchRows` → 未决过滤」；分支依据表四行无此支。

`thincoder-core/ledger-db.mjs` 的 `openLedger`：
「if (!existsSync(file) && !create) return null」；
「return null // 读面空账」；「throw new Error(`台账库打开失败：${file}（${e.message}）`)」。

⇒ 无根 / 无库 / 非台账档返 null ⇒ 最自然的 `if (!db) 放行` 即口子。

⇒ 坏档 throw ⇒ 点火即崩。两条都不是要的答案，设计未给判据。

**④ 顺序（🟡）**

设计：「插入点 = `thincoder-core/agent-tools/advisor.mjs` 第 6 条的判定块之后、
`const documents = args.documents || null` 之前」⇒ 顺序只隐含在此。

**⑤ 验收（🟡）**

同族有先例可照：`docs/core/design/ADVISOR-GUARDS.md` §1.3
「验收命令 `node --test docs/batches/2026-10-27-advisor-face-fixes.test.mjs`」。

同档 §12：「不用 `_setLedgerDirForTest`（工具面不读台账——先例同档未设）」⇒ 本批落地后即为假话。

**⑥ 引证（🟡）**

`docs/core/design/ADVISOR-GUARDS.md` 转述：
「（同口径 = `docs/core/requirements/NORMAL-MODE.md` §5.6 范围边界
「评审工具只有一套，参数契约不分模式」）」。

`docs/core/requirements/NORMAL-MODE.md` 原文：
「评审工具只有一套，发起时要什么条件不分模式」；
「**评审工具的发起判据（参数契约 + 账链）两模式同判，不在此列**」。

⇒ 转述漏掉「账链」这个本批立足点。

**⑦ 既有件（🟡）**

`thincoder-core/agent-tools/batch-ledger-bind.mjs`：
「const { ledgerBindBatch, resolveLedgerRoot } = await import("../ledger.mjs")」。

⇒ 同向桥件已在，设计只把它当「手法先例」，未答「为何不落此档」。

**⑧ 层级（🟡）**

设计：「现 319 行 + ≈40 ⇒ ≈360 行，500 软线之内 ⇒ 零拆分义务」。

复核：`thincoder-core/agent-tools/advisor.mjs` 实为 319 行 ⇒ 结论站得住。

但读数与预期增量不必入档；新测试档层级未判。

**⑨ 残余（🟡）**

`docs/core/design/ADVISOR-GUARDS.md`：「**门只判点火，不判结算**」；可达性表第 1 条
「在途行可直撤，批档照开」。

⇒ 点火后撤行：token 照签、收口重锚落空，残余未登记。

**⑩ 拒文（🟡）**

第 7 条：「Fix 1 (the row was archived, still recoverable): ledger({action:"update", id:<N>, status:"在途"})」。

已核 `thincoder-core/ledger-db.mjs` 的 `ALLOWED_MIGRATIONS`：「"待核销": ["已核销", "在途", "已废弃"]」。

⇒ 回退边成立，只缺 id 来源（此刻指本档的行数 = 0）。

**⑪ 先例批（🔵）**

`docs/core/design/ADVISOR-GUARDS.md`：「**最相近先例**：本档 §2 第 6 条」；先例批那句只在第 6 条（「已查无」）。

**判过、不构成问题**：零模式位机制面干净——E3 ∥「零模式位」∥ C5 ∥ KD-5 ∥ 岔口② 五处同口径。

`thincoder-core/agent-tools/batch-ledger-bind.mjs` 的 `mode` 只进 `batchSkeleton`、`ledgerBindBatch` 无该参。

⇒「照规则走即满足」成立；分支依据表无「不设机械门」残留行；先例偏差句无模式句。

公开源核查行在位；拒因命名三问在位；拒文三出口齐且与第 6 条的「先建档」不打架。

**计数**：🔴 3 · 🟡 7 · 🔵 1
**阻断项**：集成 delta 失真 ∥ §5.5-D7 与第 7 条相左 ∥ 新依赖无失败分支。
VERDICT: changes-required

### 轮次 2（评审子代理）

**限制**：无项目标准档、无文档地图。

**17-3 是否必要**：必要。

- 本批唯一在业务入口（父侧发设计评审）可观察的新结果 = 「账不在 ⇒ 拒发」。
- 不立行则该结果的验收只剩当批单测（收口即删）。
- 反证格（另一本带未决行的批档 ⇒ 放行）防「全拒也算过」。
- 编号依赖已由设计侧在受影响文件表与上抛项登记，按协调项走。

**层级 spot-check（自测）**：三个源 / 测试档均 ≤500 行 ⇒「无文件跨层」结论成立。

- `thincoder-core/agent-tools/advisor.mjs` = 319 行。
- `test/integration/review-doc-scope.test.mjs` = 216 行。
- `test/integration/advisor-record-gate.test.mjs` = 135 行。

### 轮次 3（评审子代理）

**上轮 11 条落定情况（逐条复核）**

- 🔴2 主体已收正：`不设机械门` ∥ `由纪律承担` 两词在设计档 LEDGER-SELF-CONTAINED
  全档零命中；「账链例外」段在位；其引文与需求档 NORMAL-MODE §5.6 逐字相符。
- 🔴3 四形终局全落拒：无根 ⇒ null ⇒ 拒；库不在盘 ⇒ null ⇒ 拒；
  坏档 ⇒ 抛 ⇒ 门内 catch ⇒ 拒；读成功零行 ⇒ 拒。零放行路径。
- 顺序表六行 + 四条「谁抢谁」在位。
- 验收命令与 `_setLedgerDirForTest` 缝在位。
- 三问答案（`existing` ∥ `existing but unusable`）在位。
- 层级只留结论；残余登记在位；Fix 1 的 id 来源在位；先例批「已查无」在位。
- 🔴1 的 6-1…6-5 处置按代码核得过；17-1 ∥ 17-2 那一格见下表第 1 行。

### 轮次 4（评审子代理）

| # | 类别 | 级 | 问题 | 建议 |
|---|---|---|---|---|
| 1 | 集成验收 | 🔴 | 17-1 ∥ 17-2「破行」不成立：17-1 不经工具层（直调 `settleDesignReview`），17-2 恰恰不携 `batchDoc` ⇒ 停在准入门，两者都到不了账链门 | 按实读判这两行为零改，删掉该格 |
| 2 | 集成验收 | 🔴 | 同格还写「挡在 … `batchdoc-missing` 之前」，与顺序表「2 与 4 同不满足 ⇒ 报 2 且只报 2」相左 | 删该半句，或按顺序表改写 |
| 3 | 文档归属 | 🔴 | 设计档 LEDGER-SELF-CONTAINED §5.5「例外判据（§5.3 条 1–3）」行仍判普通侧「不适用（默认）」 | 三条款两模式同判，或把该行移出模式覆盖表 |
| 4 | 文档归属 | 🔴 | 同行的判据列理由 =「条款 2 属工程模式档面机制；条款 1 / 3 随同节落工程侧」——正是本批已收正的同一类理由 | 删该理由；不得把「工程侧承担」写成普通侧不适用 |
| 5 | 验收 | 🟡 | C7 的 grep 面跑不出来：`无台账面` 命中「⇒ 头部规则无「无台账面」可言」（否定引），`不适用` 命中「例外判据」行 | 改行锚定 / 白名单形，或只测「账链」行 |

### 轮次 5（评审子代理）

| 6 | 可行性 | 🟡 | 夹具配方写的是工具形参数：`ledgerUpdate({ id, status: "在途", task_book: … })` | 函数签名是 `{ cwd, id, patch, … }`，照实写 `patch: { status, task_book }` |
| 7 | 可行性 | 🟡 | 配方里 `openLedger(… create: true)` 是多余一步——`ledgerAdd` 自开库 | 去掉该步，只留 `cwd` / `boundary` |
| 8 | 引证 | 🟡 | 失败表「非台账库」引「无 items 表 ⇒ 空账」，那一支只在 `openReadOnly` 内 | 读序加 `readOnly: true`（该支即可达、门零写），或删该引文 |
| 9 | 副作用 | 🟡 | 读序 `openLedger(root, { boundary })` 的 `readOnly` 缺省 false ⇒ 开库会 `exec(DDL)` / `ensureColumn` / `markSchemaVersion` | 如实注「门在点火拍会补表补列」，或改只读开库 |
| 10 | 失败语义 | 🟡 | `reason=no-pending-row` 同时盖「库不在盘」与「真没行」，`Record:` 行读数两者相同 | `Record:` 行加库在盘状态，让 Fix 1 / Fix 2 可选 |
| 11 | 失败语义 | 🟡 | 于是模型会把「库不在盘」读成「没行」，按 Fix 1 去 update 头部的 `id:<N>`（库里没有这行），或按 Fix 2 另起批档把一笔债劈成两笔 | 同第 10 行 |

### 轮次 6（评审子代理）

| 12 | 文档归属 | 🟡 | §5.5 落点结论写「条 1–5 两模式同一套规则，因此都进 normal 纪律档」；§5.6 落点表 normal 侧只列「新节 §5.2 条 2 / 条 3 / 条 4」⇒ 条 1、条 5、账链无落地行 | 补落点行，或把结论句收窄 |
| 13 | 文档归属 | 🟡 | 用例档头注仍写「`_setLedgerDirForTest`（工具面不读台账——先例同档未设）」——本批落地后即为假话 | 把该头注写进「夹具改」的动作范围 |
| 14 | 文档归属 | 🟡 | 普通纪律档 Work management 节头句「that side is backstopped by mechanical gates, this side is held by discipline」未动，而本批要往同一节加一条机械要求 | 该句补分句点名账链是这一侧的机械检查 |
| 15 | 顺序 | 🔵 | 4 与 5 同不满足时报 4：批档与文档都在别处时，回执点名「账」而真因是「文档不在本项目」 | 仅登记，不阻断 |
| 16 | 定位 | 🔵 | 受影响文件表写「工作管理」节，在盘上的节名是 `## Work management (batch record + ledger + closeout)` | 按盘上字面写节名 |

### 轮次 7（评审子代理）

**计数**：🔴 3 · 🟡 7 · 🔵 2（上表 16 行；🔴 = 第 1 / 2 同源一格的半句、第 3 / 4 同为「例外判据」行，按行计 4 格、按问题计 2 件）。

**阻断项（按问题计 2 件）**

1. 集成 delta 的 17-1 ∥ 17-2 破行判定不成立，且优先级句与顺序表相左。
2. §5.5「例外判据」行仍给普通侧开「不适用」的口子。

**判过、不构成问题**

- 账链门两模式同判的机制面干净：E3 ∥「两模式同判」段 ∥ A-AG27 ∥ KD-5 ∥ 岔口② 五处同口径。
- 「若」字已补；「普通模式仍然没有那三条」与需求档「不新增工程三门」同向，不是口子。
- 6-1…6-5 的夹具改法按代码核得过：本仓根 ⇒ `basis=ancestor` 取根；`p1/` ∥ `only/` ⇒ `basis=self` 取根，与文档解析锚态不矛盾。
- 6-1 的断言逐字不改站得住：放行路径不加回执行。
- 10-1 ∥ 10-4 零改成立（两例自造 `run` 直调 `settleDesignReview`）。

VERDICT: changes-required

### 轮次 8（评审子代理）

**计数更正**（上一条计数行写错，以此为准）

- 按问题计 = 🔴 2 · 🟡 8 · 🔵 2。
- 按上表行计 = 🔴 4 · 🟡 10 · 🔵 2（两条 🔴 各拆两行；🟡 第 6/7 行、第 10/11 行各为同一件）。

### 轮次 9（评审子代理）

**第 3 轮（只核上轮 12 件，不另找新问题）**

**复核面**：批次档 2026-11-02-review-ledger-link §2 · ADVISOR-GUARDS §1.3 ∥ §2 第 7 条 ∥ §10 ∥ §12 ·
设计档 LEDGER-SELF-CONTAINED §5.5 ∥ §5.6 ∥ D7。

**代码面实读（判据所需，非改动）**：thincoder-core/ledger-db.mjs（`resolveLedgerRoot` ∥ `openLedger` ∥
`openReadOnly` ∥ `ledgerDbPath` ∥ `PENDING_STATUSES`）· thincoder-core/ledger-write-ops.mjs（`resolveBatchRows`）·
thincoder-core/ledger-cmd.mjs（`ledgerAdd` ∥ `ledgerUpdate` 签名与返回）。

**A. 🔴1 的「零改」判得对。** 两行的实读与判一致：17-1 全程不经工具层（用例自造 `run` 直调
`settleDesignReview`），17-2 恰恰不携 `batchDoc` ⇒ 停准入门（顺序表第 2 行）。批次档 E8 ∥ 受影响文件表 ∥
RTM delta ∥ ADVISOR-GUARDS §1.3 四处的口径已一致。

**B. 🔴2 改得彻底。** 例外判据行 = 「适用 ∥ **适用**」，理由列换成「三条管的是「规则与例外」本身」；
全档 `不设机械门` ∥ `由纪律承担` ∥ `不适用` 三词**零命中**。同表别行不再给普通侧开「不适用」。

**C. 🟡3 的 C7 能机检。** 三条读数（本轮实跑）：
① 首格为 `例外判据（§5.3 条 1–3）` 的行，普通模式列**不含** `不适用`；
② 首格以 `账链（批档须挂未决行）` 开头的行**含** `同一道机械门`；
③ 全档 `不设机械门` = 0 命中 ∥ `由纪律承担` = 0 命中 ∥ `不适用` = 0 命中。

**D. `readOnly: true` 一支按代码复核成立。** `if (!existsSync(file) && !create) return null` 在
`if (readOnly) return openReadOnly(file)` **之前** ⇒ 库不在盘仍返 null；`openReadOnly` 零 DDL / 零 ALTER，
items 探针零写返 null；坏档抛 ⇒ 门内 catch ⇒ `ledger-unreadable`。C9 两断言站得住。

**E. 硬要求复扫**：三档内无「普通模式不装门 ∥ 不适用 ∥ 由纪律承担」作为免于校验的理由。
`普通侧靠纪律` 只作约束强度陈述，与用户「同一套规则、不同约束强度」同向；账链行标 `同一道机械门`。

### 轮次 10（评审子代理）

**本轮结论表（上轮 12 件逐条 + 新增 2 件）**

| # | 原# | 级 | 判 | 证据（本档逐字） |
|---|---|---|---|---|
| 1 | 🔴1 | 🔴 | Fixed | §1.3「零改 ∥ 17-1 ∥ 17-2 ∥ 17-1 全程不经工具层…17-2 夹具恰恰不携 `batchDoc` ⇒ 停在准入门」 |
| 2 | 🔴2 | 🔴 | Fixed | §5.5「例外判据（§5.3 条 1–3） ∥ 适用 ∥ **适用** ∥ 三条管的是「规则与例外」本身」 |
| 3 | 🟡3 | 🟡 | Fixed | C7 改逐行锚定三判据；三条读数见上 C 段 |
| 4 | 🟡4 | 🟡 | Fixed | §12「`ledgerUpdate({ cwd: <项目根>, id, patch: { status: "在途", task_book: … }, boundary: <会话锚> })`」 |
| 5 | 🟡5 | 🟡 | Fixed | §12「它自己 `openLedger(cwd, { create: true, boundary })`，前面再开一次库是多余一步」 |
| 6 | 🟡6 | 🟡 | Fixed | 读序第 2 步「`openLedger(derived.root, { readOnly: true, boundary: agent.cwd })`」 |
| 7 | 🟡7 | 🟡 | Fixed | 读序「单靠它开库仍会补表补列——那是写」；失败表「`readOnly: true` 才进这一支」 |
| 8 | 🟡8 | 🟡 | Fixed | 拒文「db: {open at <file> ∥ not on disk at <file> ∥ unreadable at <file>}」+「`db:` 一项决定 Fix 1 能不能选」 |
| 9 | 🟡9 | 🟡 | Fixed | 落点结论「落到 normal 纪律档的是条 2 / 条 3 / 条 4…条 1 / 条 5 普通侧不另设落地句」；§5.6 补第 6 行 |
| 10 | 🟡10 | 🟡 | Fixed | §12 夹具处置第 5 条「同档头注改」；优先级链「`batchdoc-missing` → `batchdoc-no-ledger` → `scope-not-doc`」 |
| 11 | 🟡11 | 🟡 | Fixed | §5.6 逐字稿 ②「this side is held by discipline — with one exception: the ledger chain」 |
| 12 | 🔵12 | 🔵 | Accepted | 批次档修正轮 2「只登记、零改」——理由成立：顺序表「4 与 5 同不满足 ⇒ 报 4」是有意裁定，且有 `Record:` 读数可并看 |
| 13 | 🔵13 | 🔵 | Fixed | 受影响文件表「`## Work management (batch record + ledger + closeout)` 节」 |
| 14 | (新) | 🟡 | New | 拒文 `db:` 三态的取值无读序步骤：读序五步无一产出 `<file>`；`openLedger` 返 null 不区分「库不在盘」与「非台账库」，而 `db:` 枚举只有 open ∥ not on disk ∥ unreadable——「非台账库」（文件在盘、无 items 表）无态可落。可取面 = `ledgerDbPath(cwd, boundary)`（已导出，无根抛），但设计未点名 |
| 15 | (新) | 🔵 | New | 失败表第 3 行仍并列引 `:269`（`openLedger` 写面 catch）——`readOnly: true` 下不可达；终局不变（`:226` 已足） |

### 轮次 11（评审子代理）

**计数**：上轮 12 件 → **Fixed 11 · Accepted 1 · Unfixed 0**。

- 🔴 2（均 Fixed，已对当前文件核实）· 🟡 8（均 Fixed）· 🔵 2（Fixed 1 · Accepted 1）。
- 新增 2 件：🟡 1（第 14 行，可选、不阻断）· 🔵 1（第 15 行）。

**判过、不构成问题（本轮复核）**

- 17-1 ∥ 17-2 零改四处口径一致（§1.3 表 ∥ 批次档 E8 ∥ 受影响文件表 ∥ RTM delta）。
- 优先级链「missing → no-ledger → scope-not-doc」与顺序表六行「逐对写谁抢谁」互不打架。
- 读序 readOnly 一支：库不在盘 ∥ 非台账库 ∥ 坏档 ∥ 零行四形终局全「拒」，零路径落放行。
- 6-1…6-5 夹具改法（本仓根 ⇒ `basis=ancestor`；`p1/` ∥ `only/` ⇒ `basis=self`）与文档解析锚态不矛盾。
- 种行走写面可做：`ledgerAdd` 返 `Number(r.lastInsertRowid)` ⇒ `id` 有源；`ledgerUpdate` 第二参是 `patch`。
- 三档内无「不适用 ∥ 不设机械门 ∥ 由纪律承担」作免于校验的理由（硬要求复扫零命中）。

VERDICT: pass

## §4 用户批准（主 agent）

**状态行**：用户批准 · 2026-11-02 11:43（设计评审第 3 轮 pass 后批准进入实施）

- **批准对象** = 本档 §2 的设计（E1–E8）：设计评审点火时，批档须挂至少一行未决台账行；查不出即拒发，零实例 ∥ 零 token ∥ 零 LLM。
- **用户原话**：「**派**」（2026-11-02 11:43，回答父侧「① 派 `#1988` 实施？」）。
- **批准前状态** = §3 末行 `VERDICT: pass`（第 3 轮，只核上轮 10 条，Fixed 11 ∥ Accepted 1 ∥ Unfixed 0），token 已签发。
- **执行** = 同轮 spawn `eng-coder`（designId ∥ designToken 逐字携、round = initial），§5 由其实施席落笔。

## §5 实施记录（eng-coder）

**状态行**：实施完成 · 2026-11-02

### 交付对照（条目 = §2 的 E1–E8）

| 条目 | 状态 | 落点 / 判据 |
|---|---|---|
| E1 点火账链门 | ✅ | `thincoder-core/agent-tools/advisor.mjs`（准入门判定块之后、`const documents = args.documents || null` 之前）+ 新档 `thincoder-core/agent-tools/batch-ledger-link.mjs` |
| E2 判据单源 | ✅ | 选行 = `resolveBatchRows`（`thincoder-core/ledger-write-ops.mjs`）同址；未决 = `PENDING_STATUSES`（`thincoder-core/ledger-db.mjs`）四态；零自写 SQL、零新词表 |
| E3 两模式同判 | ✅ | 新档与门块对 `engineering` **零命中**（grep 读数）；C5 以同根双 agent 比同一回执，逐字相等 |
| E4 门只判点火 | ✅ | `thincoder-core/agent-tools/design-token.mjs` 对 `ledger` **零命中**（实读）；本笔零改动（sha256 前 16 位 `f4769e090ea3f445` 开工前后同值） |
| E5 §5.5 / D7 收正 + 提示词面 | ✅ | 设计档收正由设计席已落；提示词面两处逐字稿落 `thincoder-core/prompts/discipline-normal.md`（`## Work management (batch record + ledger + closeout)` 节：①账链一句 ②节头句补分句），措辞逐字、只按 300 字符行线折行 |
| E6 失败四形全落拒 | ✅ | 无根 ⇒ `no-ledger-root`；库不在盘 ⇒ `no-pending-row`（`db: not on disk`）；坏档 ⇒ 门内 catch ⇒ `ledger-unreadable`；读成功零行 ⇒ `no-pending-row`。零路径落放行（无 `if (!db) 放行`、无 throw 外逸） |
| E7 点火判据顺序成链 | ✅ | 类型门 → 准入门 → `resolveBatchDocPath`（不可读走既有 throw）→ 账链门 → 文档范围；`resolveBatchDocPath` 提前调一次，绑定行复用同值不二次解析 |
| E8 集成面处置 | ✅ | 6-1…6-5 夹具改（断言逐字不变）· 17-1 ∥ 17-2 零改 · 新增 17-3 · **另有一档未列在 §2 受影面内，见决策披露 D3** |

### 改动文件（7 档；含 1 档表外）

| 文件 | 动作 |
|---|---|
| `thincoder-core/agent-tools/batch-ledger-link.mjs` | 新档：判据函数 `resolveBatchLedgerLink`（根解析 → 只读开库 → 选行 → 未决过滤 → 关库；台账链动态 import） |
| `thincoder-core/agent-tools/advisor.mjs` | 账链门调用 + 拒文构造 `buildBatchNoLedgerRefusal` + `resolveBatchDocPath` 提前解析（绑定行复用） |
| `test/integration/review-doc-scope.test.mjs` | 夹具改：批档进该例项目根 + 种未决行 + 台账缝；头注改写（旧话「工具面不读台账」退场）+ 副作用登记 |
| `test/integration/advisor-record-gate.test.mjs` | 新增 17-3（含反证格）；17-1 ∥ 17-2 零改 |
| `test/integration/review-standards-injection.test.mjs` | **表外**：24-1…24-3 夹具种未决行 + 台账缝（理由见 D3），三例断言逐字不变 |
| `thincoder-core/prompts/discipline-normal.md` | `## Work management` 节两处逐字稿落地 |
| `docs/batches/2026-11-02-review-ledger-link.test.mjs` | 当批单测（C1–C10；收口随批删） |

### 决策披露（3 件，均须父侧知道）

| # | 决定 | 为什么 / 影响面 |
|---|---|---|
| D1 | 拒文 `Why:` 行写 `(reason=${值})`，不写设计档逐字块的 `(reason: {值})` | 设计档自身两处两形：§2 第 7 条逐字块用 `(reason: )`，而 §1.3 的 17-3 行、§2 验收 C1/C8/C9 与 `test/RTM.md` 故事 17 都要求回执含 `reason=no-pending-row`（可 grep 形）。取后者，验收三面同时成立；**逐字块须设计席回填**（见上抛 U1） |
| D2 | 无项目根时 `Record:` 行写 `db: —` | 设计档 `db:` 三值都带 `<file>`，无根时没有库位可点名；`ledger base: —` 同因。四形终局不变（仍 `no-ledger-root` 拒） |
| D3 | 改 `test/integration/review-standards-injection.test.mjs`（§2 受影响文件表未列） | 24-1…24-3 携 `batchDoc` 走同一点火面，夹具原本无台账 ⇒ 落门即被 `no-ledger-root` 拒、`endpoint.requests.length` 断言不可达（实测 3 例红）。处置同 6-1…6-5：种未决行 + 台账缝，断言逐字不变 |

### 内部审计与代码评审轮次

- **偏离审计**（只读子代理，对 §2 逐条比对）：1 轮。读数 = `DIVERGENCE FOUND: 3 (❌0 ⚠️2 📄1)`——两条 ⚠️ 即 D1 / D2，一条 📄 即 D3，**零未实现项**。
- **代码评审**（advisor `type="code"`，对象 = 门 + 判据档 + 三个用例档）：1 轮，`VERDICT: pass`（🔴 0 · 🟡 3 · 🔵 2）。
  - 已当场收掉 2 条 🔵：删掉零消费的死导出 `NO_LEDGER_REASONS`（三值口径留在 `refuse` 的注释里）；`test/integration/review-doc-scope.test.mjs` 头注补登「6-1…6-3 夹具落真实仓树、靠 `t.after` 清理」。
  - 余 3 条 🟡 均为文档面（D1 的逐字块、D3 的 delta 表缺 24 行、本档 §5 缺跑测读数）——前者两条是设计席笔，已上抛；第三条由本节与 §6 的读数落定。

### 验证读数（实跑，cwd = 仓根）

| 面 | 命令 | 读数 |
|---|---|---|
| 当批单测（C1–C10） | `node --test docs/batches/2026-11-02-review-ledger-link.test.mjs` | **8 pass / 0 fail** |
| 本门集成（17-1…17-3） | `node --test test/integration/advisor-record-gate.test.mjs` | **3 pass / 0 fail** |
| 受理面（6-1…6-5） | `node --test test/integration/review-doc-scope.test.mjs` | **5 pass / 0 fail** |
| 标准档注入（24-1…24-3） | `node --test test/integration/review-standards-injection.test.mjs` | **3 pass / 0 fail** |
| 扩面回归（14 档：advisor / review / batch / ledger 面） | `node --test test/integration/{advisor-record-gate,advisor-timeout-hot,review-doc-scope,review-standards-injection,batch-close-token-consume,batch-ledger-bind,batch-gates-reanchor,batch-status-auto-set,batch-live-batch-lock,batch-anchor-create,batch-close-gate,batchdoc-reuse-guard,ledger-close-proof,ledger-read-cross-project}.test.mjs` | **63 pass / 0 fail** |

- **修前红（实跑，证明门真在拦）**：夹具未改时 6-1…6-5 **五例全红**，回执 `reason=no-ledger-root`（与 §2 预测逐字相符）；24-1…24-3 **三例全红**（`一次评审 = 一次模型请求 0 !== 1`）。
- **C5 后半幅**（代码零模式位）：`thincoder-core/agent-tools/batch-ledger-link.mjs` 与 `thincoder-core/agent-tools/advisor.mjs` 对 `engineering` **零命中**（grep 读数）。
- **C6**（结算面零改）：`thincoder-core/agent-tools/design-token.mjs` sha256 前 16 位开工前 = 收工后 = `f4769e090ea3f445`。（`git diff --stat` 对该档非空，但那是本批之外的既有未提交改动；以哈希为据。）
- **C7**（设计档逐行三读数）：① 首格为 `例外判据（§5.3 条 1–3）` 的行 1 行、普通模式列**不含**「不适用」；② 首格以 `账链（批档须挂未决行）` 开头的行 1 行、**含**「同一道机械门」；③ 全档「不设机械门」= 0 ∥「由纪律承担」= 0 ∥「不适用」= 0。
- **真实链一次读数**（本仓真台账，只读）：本批档 `resolveBatchLedgerLink` ⇒ `ok: true · db: open · rows: 2 · unsettled: 2` ⇒ 正常链零回归。

### 上抛

- **[上抛·知会]** U1：设计档 §2 第 7 条「拒文（逐字）」块的 `(reason: {…})` 与 §1.3 的 17-3 行 ∥ §2 验收 C1 的 `reason=…` 两形并存；实现取后者。逐字块须设计席回填一处（改文或改判据，二选一），否则照逐字块比回执会判不符。
- **[上抛·知会]** U2：`docs/core/design/ADVISOR-GUARDS.md` §1.3 的破行格与 §2 受影响文件表都只列 6-1…6-5，实际还破了 24-1…24-3（见 D3）；两处各补一行，验收 C11 射程同扩。
- **[上抛·知会]** U3：`docs/core/design/API-CONTRACT.md` 的生成区与源不一致（实测漂移 6 行：本笔新增导出 2 行 + 他批既有 4 行）；重跑 `node scripts/api-contract.mjs --write` 即覆盖（生成区 = 生成器唯一笔，不属本席写域）。
- **[上抛·知会]** U4：`scripts/prompt-refs-check.mjs` 在本工作树上为红（4 条命中，全在 `thincoder-core/agent-tools/advisor.mjs` 的既有描述行与范围拒文行，逐字与 `HEAD` 版本同文）——本笔未新增命中，属他批在途状态，父侧收口跑全量时会看到。

### 测试线（收口随批删）

- 当批单测：`docs/batches/2026-11-02-review-ledger-link.test.mjs` —— 验证账链门判据 C1–C10（含 `batch create` 放行锚、四形全拒、坏档不抛）· 命令 `node --test docs/batches/2026-11-02-review-ledger-link.test.mjs` · **8 pass / 0 fail** · **收口删除**。
- 集成面：`test/integration/advisor-record-gate.test.mjs`（17-3 新增）· `test/integration/review-doc-scope.test.mjs`（6-1…6-5 夹具改）· `test/integration/review-standards-injection.test.mjs`（24-1…24-3 夹具改）——三档合跑 **11 pass / 0 fail**（上表分行读数）。
- 未做：全量套件不属本批（父侧收口门）；`test/RTM.md` 的 17-3 编号由父侧已先行落笔。

## §6 验证与收口（父代理）

**状态行**：验证通过 · 2026-11-02（发布门 95/95 · 当批单测 8/8 · 文档门 PASS）

### 6.1 三条读数（父侧实跑，不是转述）

| 读 | 命令 | 结果 |
|---|---|---|
| 发布门（全量集成 28 档） | `node --test <28 个 test/integration/*.test.mjs>` | **95 / 95 pass · 0 fail** |
| 当批单测 C1–C10 | `node --test docs/batches/2026-11-02-review-ledger-link.test.mjs` | **8 / 8 pass** |
| 文档门 | `doc_check(mode:"gate", docs=[本档 ∥ `docs/core/design/ADVISOR-GUARDS.md` ∥ `docs/core/design/LEDGER-SELF-CONTAINED.md` ∥ `thincoder-core/prompts/discipline-normal.md`])` | **PASS · 4 档全清** |

**⇒ 修前红的读数由实施席给：夹具未改时 6-1…6-5 五例全红（`no-ledger-root`）、24-1…24-3 三例全红（`no-pending-row`）。** **⇒ 这比「全绿」有用 —— 它证明门真在拦，不是恰好都过。**

### 6.2 实施席交回的三条偏离（逐条判）

- **① 拒文用 `reason=`，不照逐字块的 `(reason: …)`**：采纳。三面验收（C1 ∥ C8 ∥ C9 与故事 17-3）都要 `reason=`，只有那一块是另一形 ⇒ 少数面回填，设计席已改（`docs/core/design/ADVISOR-GUARDS.md` §2 第 7 条拒文块）。
- **② 无根时 `db:` 写 `—`**：采纳。无根根本没有库位可点名；四形终局不变（仍拒），差别只在读数。设计席已补 `—` 态与配对说明。
- **③ 多改了一个档（`test/integration/review-standards-injection.test.mjs`）**：采纳并补登。24-1…24-3 走同一道点火面、夹具缺未决行，不修就是三片红；该档已进 §2.3 受影响文件表，C11 射程同扩。

### 6.3 文档漂移与对账

- **`docs/core/design/ADVISOR-GUARDS.md` 三处**（拒文两形、破行格漏 24-1…24-3、`db:` 缺无根态）⇒ 设计席已收正，门 PASS。
- **`docs/core/design/API-CONTRACT.md`**：父侧跑 `node scripts/api-contract.mjs --write` 重生（工程工具面 · 机械重生成），生成区整区替换 +4642 ∥ −4633。
- **§5 的「7 档；含 1 档表外」与决策披露 D3 的「§2 受影响文件表未列」现在是旧话** —— 该档已由设计席补登进 §2.3。**§5 是证据面，不回改；差异记在这里**（§2 ↔ §5 对账项的本批落点）。
- **清单外零改动**：本笔动过的档 = §2.3 表内 9 行 + 3 本设计档 + 本档；无表外笔。

### 6.4 残余（登记，不阻断）

- `scripts/prompt-refs-check.mjs` 在本工作树为红（4 条命中，全在既有行、逐字与 HEAD 同文）—— 他批在途状态，与本笔无因果；收口跑全量时会看到，不在本批处置。
- 点火后撤行的残余（KD-4 不设第二道门）—— 已在设计侧登记在案，仍成立。

### 6.5 本条覆盖的台账行

`#1988`：在途 → 待核销 → 已核销。
