# 2026-10-27 · advisor-face-fixes
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-27 · 来源 = 台账 #1841（评审交卷不查 §3 状态行）+ #1839（槽「批」旁列取不到 batchDoc）合并 · 用户 2026-10-27 18:48「对评审是不是也应该机械检查一下啊！」· 18:58「三笔都处理了。」。
> 台账 = #1843（ENGINEERING-MODE · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-27
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 这一批治两个「机制自己说谎」的毛病

**用户 2026-10-27 18:48 原话：「对评审是不是也应该机械检查一下啊！」** —— 那句话指向下面第一笔。

**两笔合批的理由**：都落在 `advisor` 面（评审结算 / 槽清单），文件不重叠（`advisor-settle.mjs` ∥ `design-slots.mjs` + `advisor-async.mjs`），可以一个设计席一次写完。

### 1.2 第一笔 · 评审交卷时不查 §3 状态行（原 `#1841`）

**现象**：评审给了 `VERDICT: pass`，但没写 §3 状态行。**今天五次**。

**为什么这会让错误传到别人身上**：

```
评审交卷（无人查）
  → 签发 token
  → 派实施
  → 实施写 §5 → 被拒（"§3 状态行须 = 评审通过"）
```

**代价落在实施席。今天两次是 coder 白写一次 §5 全文**（`#13` / `#17` 各一次），另几次是我自己返工发补录评审。

**代码实读（位置错）**：`thincoder-core/agent-tools/batch.mjs:102-106` 给评审实例的写权是 §3：

```js
function allowedSegment(agent, review, engineering) {
  if (review) return 3
```

**⇒ 评审**能**写状态行（有权限），只是**没人查它写没写**。检查只在 `§5` 写入门和核销门（`ledger-close-proof.mjs:53-55`）—— 都在下游。

**改法**：`advisor-settle.mjs` 结算时判两件：

- 绑了 `batchDoc` ⇒ §3 必须被写过（有轮次块）
- 判 pass ⇒ §3 状态行必须是 `评审通过`

**不满足** ⇒ 该轮判「评审未完成」、不签 token、回执点名漏项。

**这与 `docs/core/requirements/ADVISOR-CONVERGENCE.md` 的 F11「未完成即不签发」同族** —— F11 治的是「截断尾不签 token」，本笔治的是「交卷不完整不签 token」。

### 1.3 第二笔 · 槽「批」旁列取不到 `batchDoc`（原 `#1839`）

**现象**：`design-slots` 列出的 24 枚槽，「批」列全是 `—`。`batch close` 时回执写「消费 0 枚 · 留槽无归属 25 枚」。

**代码实读（根因）**：

`thincoder-core/agent-tools/design-slots.mjs:58` 定义「批」旁列的来源 ——

> `docSetKey`（被审文档绝对路径集 JSON）中 `batches/` 段档取 basename

而 `thincoder-core/agent-tools/advisor.mjs:161-162` ——

```js
if (args.batchDoc !== undefined && args.batchDoc !== null) {
  resolved.run.batchDoc = resolveBatchDocPath(agent.cwd, args.batchDoc)
```

**⇒ `batchDoc` 落在 `run.batchDoc`，**不并进 `documents`** ⇒ 不进 `docSetKey`。**

**⇒ 只有当 `documents` 里恰好含批档路径时，「批」列才有值。而我这些轮次的 `documents` 全是设计档。**

**三个后果**（都有今日实测）：

1. `batch close` 的「消费 N 枚」从未生效 —— 每次回执都是 0
2. 槽敞到 TTL 7 天 —— 25 枚无归属
3. 父侧每轮手抄 token（我刚做过两次）

**改法二选一**（设计定）：

- **A**：`batchDoc` 并入 `documents` 再算 `docSetKey`
- **B**：旁列直落 `run.batchDoc` 绝对路径（`docs/core/design/DESIGN-TOKEN-SETTLEMENT.md` 已设计旁列，只差真来源）

**我倾向 B** —— 原因写在 §2 里让设计席判：`docSetKey` 的语义是「被审文档集」，把批档塞进去会改变这个键的含义，可能让两个不同批但同设计档的评审被判成同一 scope（`advisor-async.mjs:109` 用它判「同 scope 已有在跑评审」）。

**⇒ 这是我给的倾向，不是裁定。设计席若不认同，给理由推翻它。**

### 1.4 边界（不做）

- **不改 `batch.mjs` 的段白名单** —— 评审本来就该写 §3，问题不是权限是检查
- **不改 token 的 TTL 语义**
- **不动 `docs/core/design/BATCH-RECORD.md` 的六段结构**

### 1.5 完成判据（两条，都要能复现）

| # | 判据 | 怎么验 |
|---|---|---|
| 1 | 复现「判 pass 不写 §3 状态行」⇒ 结算点当场拒并点名；补写状态行后同轮放行 | 单测：桩评审回 pass 但不碰 §3；断言结算回执含拒因；再跑一次带状态行 ⇒ 放行 |
| 2 | 带 `batchDoc` 的评审结束后，`design-slots` 的「批」列显示批档 basename（不再 `—`） | 集成：真起一轮带 `batchDoc` 的评审 ⇒ 读 `design-slots` 输出断言 |

### 1.6 已定决定

- **已定决定**：**存量 24 枚 `batch=—` 的旧槽不追、不归位、不清 —— 只保证新签的槽能正确落批。** · 用户原话：「**那些旧token就不管了，管好新的就行。**」 · 时间：2026-10-27 19:02

**这条裁定的落地影响**（写给实施席与收口侧）：

- **完成判据只认「新评审」** —— §1.5 判据 ② 的验证方式是**真起一轮带 `batchDoc` 的评审**再读 `design-slots`，不是去修复历史槽。存量 24 枚让它们按 TTL（7 天）自然过期即可。
- **`consumeBatchDesignTokens` 不需要补历史数据** —— 它的判据是「槽的批次归属旁列」，旁列以后才会有值；旧槽没值就消费不到，这是被接受的代价，不是缺陷。
- **收口时不必额外清一批** —— 之前提的「要不要额外清 25 枚」这个问题，已因此裁定作废，不再作为待办。

**为什么不追**：修历史槽要么补 `docSetKey`（那是伪造评审时的输入），要么按 `designId` 反查 `_advisorRuns`（重启即失、且只对当日进程有效）。两种做法的产出都不比「让它过期」更有价值，而都要新增一条只在迁移期走一次的路径。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（第三轮修正：轮次 2 的 findings 3 / 13 / 14 / 15 / 16 已逐条落，见 §2.13）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试覆盖 / 验收对照 / 关键决策 / 上抛项>

**状态行**：设计完成

### 2.1 本批条目（覆盖）

| # | 条目 | 需求来源 | 设计判据（单一权威源） | 单测 | 集成（RTM） |
|---|---|---|---|---|---|
| R1 | 设计评审结算点判「§3 落地」：绑了批档的评审，判 pass 必须 §3 有轮次块且状态行 = `评审通过`，否则不签 token、回执点名 | 台账 `#1841` · 用户 2026-10-27 18:48 原话 | `docs/core/design/ADVISOR-GUARDS.md` §1.1 ∥ §1.2 | U-1～U-6 | 故事 17：17-1 ∥ 17-2 |
| R2 | 设计槽的批归属派生补上 `run.batchDoc`（清点「批」列不再 `—`；`batch close` 的「消费 N 枚」真正生效） | 台账 `#1839` · §1.3 | `docs/core/design/DESIGN-TOKEN-SETTLEMENT.md` §10（批次标识的来源）∥ §9（「批」列来源） | U-7 ∥ U-8（含既有 U-BG16 ∥ U-BG8 修订） | 故事 10：**10-1 改写** + **10-4 新增** |

**不在本批（边界，逐条）**：不改 `batch.mjs` 的段白名单（评审本就有 §3 写权，问题不是权限）· 不动 `§5` 写入门与核销机检（第二道线保留）· 不动 token TTL 语义 · 不动 BATCH-RECORD 六段结构 · 不动 `consume-design` 选择器语义 · 不清旧的无归属槽（既有 `consume-design expired:true` 处置，§10 已登记）· 不动 `docSetKey` 的定义。

### 2.2 核对：§1 的代码读数（本席实读）

| §1 的说法 | 实读 | 结论 |
|---|---|---|
| `batch.mjs:102-106` 评审写权 = §3 | `thincoder-core/agent-tools/batch.mjs:102-106` 逐字：`function allowedSegment(agent, review, engineering) {` / `if (review) return 3` | ✅ 一致 |
| `advisor.mjs:161-162` 把 `batchDoc` 落 `run.batchDoc` | 实际 `:161-163`：`if (args.batchDoc !== undefined && args.batchDoc !== null) {` / `resolved.run.batchDoc = resolveBatchDocPath(agent.cwd, args.batchDoc)` | ✅ 一致（行号差 1，内容同） |
| `design-slots.mjs:58` 「批」列来源 = `docSetKey` 的 `batches/` 段档 | 派生说明在 `:56-59` 注释，实现 `batchOf` 在 `:60`、`batchBasename` 在 `:81` | ✅ 一致 |
| `advisor-async.mjs:109` 用 `docSetKey` 判同 scope | `:109` 逐字 `if (r.reviewType === "design" && r.open && r.docSetKey === key) return r` | ✅ 一致 |
| 核销门 `ledger-close-proof.mjs:53-55` | 文件在 `thincoder-core/ledger-close-proof.mjs`（**不在** `agent-tools/` 下）；`:53-55` 即 §3 状态行判据 | ⚠️ 行号对、**路径少一层目录** |
| 「检查只在 §5 写入门与核销门」 | `§5` 门 = `thincoder-core/agent-tools/batch-closeout.mjs:103-111` `assertSectionFiveGate`（`batch.mjs:237` 在 `n === 5` 时调）；核销门 = 上条 | ✅ 一致（补全 §5 门的坐标） |

**§1 说法之外、由本席实读补齐的三点**：

1. **旁列机制已经存在并且已经在写**——`_engDesignTokenBatches`（`design-token.mjs:173-182`）在 settle 同拍写旁列，`unionBatches`（`design-slots.mjs:47`）读它，`consumeBatchDesignTokens`（`batch-lifecycle.mjs`）收口时按它消费。⇒ R2 **不是新机制，是一个派生源缺口**：唯一要改的是「旁列的值从哪来」。
2. **同步轨也走同一个结算函数**——`advisor.mjs:245` 直接调 `settleDesignReview`；异步轨经 `settleAdvisorRun`（`advisor-settle.mjs:155`）调同一个。⇒ R1 的门只要落进 `settleDesignReview` 一处，两轨同时生效，`settleAdvisorRun` **零改**。
3. **`settleDesignReview` 已有两道拒签闸**（`incomplete` 未完成、§5.2 裁定行）——R1 的门是同形的第三道，可完全复用其形态（`{passed:false}` + 恒定标记 + 槽零写 + 实例不关）。

### 2.3 机制设计

**R1 · 结算点「§3 落地门」**（设计单源 `docs/core/design/ADVISOR-GUARDS.md` §1.1）

- **前置条件**：`run.batchDoc` 非空（没绑批档的评审零判零阻——零回归）。这是判据的条件，不是「实现时记得跳过」。
- **两判**：① §3 段内至少一个工具戳轮次块（`### 轮次 N（评审子代理）`，正则单源 `ROUND_HEADING_RE` 提为 `batch-skeleton.mjs` 导出）；② `readSectionStatusWord(src, 3)` = `评审通过`（读侧含旧字面 `评审完成` 等义）。
- **位置**：`design-token.mjs` `settleDesignReview`，嵌在 §5.2 裁定闸之后、写槽 / 关实例 / `persistEngTokens` 之前。同步 ∥ 异步两轨共用。
- **失败**：`{passed:false}` + 恒定标记（reason 三值：`no-section3-block` / `status-not-passed` / `batch-unreadable`）；槽零写、实例不关、可补写后重评。`settlementCriterion` 不新增值（与 §5.2 裁定闸同形：标记即回执）。
- **批档读不到** ⇒ 照拒（`batch-unreadable`）——与 §10「读不到 ≠ 没有」同判据方向。

**R2 · 批归属派生两源定序**（设计单源 `docs/core/design/DESIGN-TOKEN-SETTLEMENT.md` §10）

- `batchAbsPathOfRun(run)`：`run.batchDoc` 非空 ⇒ `resolve()` 它；否则 `batchAbsPath(run.docSetKey)`；否则 `null`。**不在两源间做取舍**——主源在手就不查兜底。
- 三处消费同一派生：settle 写旁列（`design-token.mjs`）、清点面兜底（`design-slots.mjs` `batchOf`）、既有 `batchAbsPath` 保持不变（它是二源里的那个「源」，不是二源的上层）。
- **被拒方案 A（并进 `documents` 再算 `docSetKey`）**：`docSetKey` 同时是评审实例键（同 scope 复用 `advisor-async.mjs:109`、在跑判定 `runningAdvisorOfScope`、陈旧与 D5 冻结窗口的 scope）。批档入集 ⇒ 同一份设计档在两个批里是两个 scope：新批修轮另起实例（轮次 / prior 复位）、在跑判定失效（可并发两份同档评审）、冻结窗口判据范围被悄悄改写。`docSetKey` 的含义是「被审文档集」——批档是被审对象的归属，不是被审对象。
- **不改 §1 倾向 B 的方向，但补回它砍掉的一半**：只用 `run.batchDoc` 会把「批档写进 `documents`」这个已验收的调用形（U-BG1 ∥ U-BG8 ∥ RTM 10-1）降成无归属——那是把一条今天能用的路径改差。故取「B + 保留兜底」。

**为什么门必须在结算点（不是「加一个检查」）**——`docs/core/design/ADVISOR-GUARDS.md` §1.2 四条，摘要：

1. 门在**状态产生处**，不在后果显形处：授权在 settle 产生，§3 是结论在批档上的落地，同一拍比对得出真伪。
2. 位置判据 = **拒绝时能不能把状态退回去**：settle 拒 = 不签发不写槽、实例仍 open、补一行即可重评；派发后拒 = 一次 spawn + 一次白写 §5（§1 记两例）。
3. 判据只用**手上已有的事实**（`run.batchDoc` 同实例同栈可读）；另取一源就成第二真源。
4. 不适用的边界写成**前置条件**（`run.batchDoc` 非空），不靠实现时记得。

### 2.4 受影响文件与测试覆盖

| # | 文件 | 现行行数 | 预计 Δ | 改动面 |
|---|---|---|---|---|
| 1 | `thincoder-core/agent-tools/design-token.mjs` | 200 | +28 | `settleDesignReview` 增 §3 落地门（读档 + 两判 + 标记常量 + import）；批归属派生改调 `batchAbsPathOfRun` |
| 2 | `thincoder-core/agent-tools/design-slots.mjs` | 305 | +16 | 新增导出 `batchAbsPathOfRun(run)`；`batchOf` 改走同一派生（`run.batchDoc` 优先） |
| 3 | `thincoder-core/agent-tools/batch-skeleton.mjs` | 本轮未整档实读（实施轮 `wc -l` 复读） | +12 | `ROUND_HEADING_RE` ∥ 段内轮次块计数提为导出单源；`batch.mjs` 私有区反向 import（现行私有 `roundCount` 随之收口） |
| 4 | `thincoder-core/agent-tools/batch.mjs` | 350 | ±0～−6 | 私有 `ROUND_HEADING_RE` / `roundCount` 改取 skeleton 导出（§3 写入面语义零变） |
| 5 | `docs/core/design/ADVISOR-GUARDS.md` | 513 → +45 | 本批已落 | §1.1（判据）∥ §1.2（检查点定位判据） |
| 6 | `docs/core/design/DESIGN-TOKEN-SETTLEMENT.md` | 435 → 本批已落 | — | §9「批」列来源 ∥ §10 批次标识两源定序 + KD-BG10 + U-BG16 + A7 + 集成 delta |
| 7 | `test/RTM.md` | 229 | +3 行 / 改写 1 行 | 故事 17（17-1 ∥ 17-2 两行新建）+ 10-1 改写 + 10-4 新增——**编号已在本档定死，实施轮逐字落** |
| 8 | `docs/batches/2026-10-27-advisor-face-fixes.test.mjs` | 0（未建） | 新建 | 本批单测 U-1～U-8（收口即删） |

500 软线：四档产品码均未触（最大 `batch-skeleton.mjs` 待实测）；`batch-lifecycle.mjs` 本批零改（其拆分触发条件不因本批变化）。

**本批单测用例**（落 `docs/batches/2026-10-27-advisor-face-fixes.test.mjs`，直接调函数、零 LLM）：

| # | 类 | 输入 | 期望 |
|---|---|---|---|
| U-1 | 正常 | 临时批档（§3 有轮次块、状态行 = 评审通过）+ `run.batchDoc` 指向它 + 回显 token 且带 `VERDICT: pass` ⇒ `settleDesignReview` | `passed:true`；槽写入；输出的 approvedSuffix 在位 |
| U-2 | 错误（本批主症） | 同上夹具，但 §3 **无状态行**（有轮次块） | `passed:false`；输出含 `review record incomplete` 与 `status-not-passed`；`agent._engDesignTokens` 零该 designId |
| U-3 | 错误 | §3 状态行 = `进行中` | 同 U-2（`status-not-passed`）；指名当前值 |
| U-4 | 错误（补写后放行） | U-2 的夹具补写状态行 = 评审通过，同 run 再 settle 一次 | `passed:true`（同 run 可重评——实例未关）；槽写入 |
| U-5 | 错误 | §3 只有状态行、无轮次块 | `passed:false`；reason = `no-section3-block` |
| U-6 | 边界（零回归） | `run.batchDoc = null` + 回显 + `VERDICT: pass` | `passed:true`——本门不适用 |
| U-7 | 正常（生产形） | `run = {designId, batchDoc: <abs>, docSetKey: <设计档集>}` ⇒ 写旁列后读 `design-slots` | `_engDesignTokenBatches.get(designId) === abs`；清点行 `batch=<basename>` |
| U-8 | 边界（兜底零回归） | `run.batchDoc = null`、`docSetKey` 含批档 | 旁列 = 该批档（既有 U-BG1 ∥ U-BG8 语义零变） |

**RTM 增量**（编号在此定死，实施轮逐字落 `test/RTM.md` 与用例标题）：

| 行 | 动作 | 内容 |
|---|---|---|
| 10-1 | **改写** | 入口形由「`documents` 带批档」改为 `batchDoc` 带批档（生产形）；断言逐字不变。原写法只覆盖兜底派生，正好绕开了本批缺陷——这是「既有用例没抓住」的那处 |
| 10-4 | **新增** | 以 `batchDoc` 跑一次设计评审后调 `design-slots` ⇒ 该行 `batch=<basename>`（今天 24 枚全 `—`） |
| 17-1 | **新增**（新故事 17「评审没写进批档就不算过」） | 带 `batchDoc` 的设计评审回 pass 但不写 §3 ⇒ 无 token、输出含 `review record incomplete`、同 designId 的 eng-coder spawn 被机械拒；补写 §3 后重评 ⇒ 签发 |
| 17-2 | **新增** | 不带 `batchDoc` 的设计评审回 pass ⇒ 照常签发（本门不适用——零回归的业务可观测面） |

### 2.5 验收对照（每条回指条目，机可验）

| 条目 | 验收判据 | 命令 / 判读 |
|---|---|---|
| R1-a | 判 pass 而 §3 状态行缺失 ⇒ 结算当场拒、不签 token、回执点名 | `node --test docs/batches/2026-10-27-advisor-face-fixes.test.mjs` 中 U-2 ∥ U-3 ∥ U-4 |
| R1-b | §3 无轮次块同样拒；未绑批档零回归 | 同命令 U-5 ∥ U-6 |
| R1-c | 端到端：拒后 spawn 被拒、补写后放行 | 集成 17-1（父侧收口轮跑） |
| R2-a | 带 `batchDoc` 的评审 settle 后旁列有值且清点「批」列 = basename | 同命令 U-7 |
| R2-b | 兜底派生零回归 | 同命令 U-8（并跑既有 U-BG1 ∥ U-BG8 夹具形） |
| R2-c | 端到端：收口「消费 1 枚」、清点显名 | 集成 10-1（改写后）∥ 10-4 |

**§1.5 两条判据的可判性复核**：

① 判据 1 **可判** —— `settleDesignReview` 是纯函数面入口（输入 = run + token + 回执文本，读档走临时夹具），桩评审无需 LLM，断言点是返回值与槽 Map，机可验。本席把它拆成 U-2/U-3/U-5 三格（缺状态行 / 状态行非 pass / 无轮次块），比原表述多覆盖一形态。

② 判据 2 原写「真起一轮评审」= **不可判**（要真 LLM）。改为两层可判形 —— write 面 U-7（settle 旁列）+ 读面 U-7（清点行），业务可观测的那半交给集成 10-4（夹具驱动、父侧收口轮跑），不把「真起一轮」写进验收命令。

### 2.6 关键决策

| KD | 决策 | 依据 / 被拒方案 |
|---|---|---|
| D-1 | §3 落地门落 `settleDesignReview`（两轨共用单点） | 同步轨 `advisor.mjs:245` ∥ 异步轨 `advisor-settle.mjs:155` 同调此函数 ⇒ 一处实现、零分叉。被拒：分别落两轨（两份判据必漂） |
| D-2 | 门只判**签发路径**（回显 + 裁定 pass + 未完成非空时本门不到） | 不签发的路径本就不产生授权，判它只增噪声。与 F11/§1 族同向（未完成即不签发） |
| D-3 | 不往 `settlementCriterion` 加判据值 | 该门与 §5.2 裁定闸同形（标记即回执）；加值 = 给「记录不合格」造一个与「评审失败」混用的分类 |
| D-4 | 批归属 = `batchDoc` 优先 + `docSetKey` 兜底，三处同派生 | 见 §2.3 R2；被拒方案 A 的理由 = `docSetKey` 兼实例键 |
| D-5 | `ROUND_HEADING_RE` / 轮次块计数提为 `batch-skeleton.mjs` 导出 | 读侧单源（骨架档 = 段面读判据的家）；被拒：在 `design-token.mjs` 内联第二份正则（§3 写入面与判定面必漂） |
| D-6 | 未绑批档 ⇒ 门不适用 | 零回归；条件写在判据前置上（不是跳过） |

### 2.7 上抛项 / 未决

- **[上抛·待裁] 需求档条目缺位**：R1 在 `docs/core/requirements/ADVISOR-CONVERGENCE.md` 无对应 F 点，R2 在 `docs/core/requirements/DESIGN-TOKEN-SETTLEMENT.md` 无对应条目（F-D7 只覆盖批归属的存储与消费，未覆盖「归属从哪来」）。按 D1 需求档归主 agent，本席不写。建议文本：R1 → 「F-AC-新：绑批档的设计评审，判 pass 时必须已把结论写进该档 §3，否则不签发 token」；R2 → 「F-D7 补句：批归属来源 = 评审实例的 `batchDoc` 绑定优先，被审文档集里的批档兜底」。缺位不放行设计本身（设计判据已在设计档落地），但三链（§2 ↔ 设计档 ↔ 需求档）本批两侧齐、需求侧缺一格。
- **[上抛·知会] `test/RTM.md` 由实施轮落**：编号 10-1（改写）∥ 10-4 ∥ 17-1 ∥ 17-2 已在本档定死；RTM 属测试索引面，按 §10 先例由 eng-coder 实施轮逐字落。若父侧要求设计轮当场落，请派回。
- **已知代价（如实登记）**：R1 的门只在评审**经工具链结算**时生效。直接改批档、或绕过 settle 的路径不受判——与今日一致（评审自报 pass 的信任面本就不变，核销门同样以 §3 字面为准）。
- **`batch-skeleton.mjs` 行数未实读**：本席只按符号读该档（`STATUS_WORDS` / `readSectionStatusWord`），未整档 `wc -l`；实施轮须先复读再判 500 软线余量。

### 2.8 行数读数复测（同轮实测——§2.4 表的行数列以本段为准）

口径 = `split("\n").length − 1`（与 `thincoder-core/test/core-hygiene.test.mjs` 同源）：

| 文件 | 现行 | 备注 |
|---|---|---|
| `thincoder-core/agent-tools/design-token.mjs` | 200 | 未改（待改 +28 ⇒ ≈228） |
| `thincoder-core/agent-tools/design-slots.mjs` | 305 | 未改（待改 +16 ⇒ ≈321） |
| `thincoder-core/agent-tools/batch-skeleton.mjs` | 367 | 未改（待改 +12 ⇒ ≈379；未触 500 软线） |
| `thincoder-core/agent-tools/batch.mjs` | 349 | 未改（±0～−6 ⇒ ≈343–349） |
| `docs/core/design/ADVISOR-GUARDS.md` | 546 | 本批已改（改前 513 ⇒ +33） |
| `docs/core/design/DESIGN-TOKEN-SETTLEMENT.md` | 452 | 本批已改（改前 435 ⇒ +17） |
| `test/RTM.md` | 228 | 未改（实施轮 +3 行 / 改写 1 行 ⇒ ≈231） |

§2.4 表 #3 的「本轮未整档实读」由本段填实（367）；#4 ∥ #5 ∥ #7 的行数列同以本段读数为准。四档产品码改动后均未触 500 软线，`batch-lifecycle.mjs` 零改。

### 2.9 修正轮（评审 §3 轮次 1 · 13 条逐条处置）

**前情的更正**：§2.3 / §2.4 的两处设计在修正轮被改写——① §3 落地门原写「两件同判」未限定签发路径；② 原判据 1 只要求「至少一个轮次块」，本轮认定缺失。以下各条即改后现状，前文对应段落已就地改写（不留旧文）。

| # | 严重度 | 处置 | 落点 |
|---|---|---|---|
| 1 | 🔴 | pass 条件化：触发条件拆成两件（绑批档 + 走签发路径），判据前缀写明「只在签发路径上判」；changes-required 的结算形态单列一段（裁定闸早退 ⇒ 槽零写、实例保持 open、修正轮同实例推进轮次）；词表**不补** changes-required 字面并给理由 | `docs/core/design/ADVISOR-GUARDS.md` §1.1（触发条件 2 ∥ 判据前置句 ∥ 「changes-required 的结算形态」段 ∥ 「词表不补 changes-required 字面」段） |
| 2 | 🔴 | 第①笔的 RTM delta 三答补齐：新增 §1.3（17-1 ∥ 17-2 两行 + 破行 / 冗余 / 缺失）；破行 = 10-1 ∥ 10-4 夹具须让评审写 §3 | `docs/core/design/ADVISOR-GUARDS.md` §1.3 ∥ `docs/core/design/DESIGN-TOKEN-SETTLEMENT.md` §10 的 10-1 / 10-4 行 |
| 3 | 🔴 | 验收面补齐：A-AG22（门本体）∥ A-AG23（前置零回归）∥ A-AG24（读不到）；单测 U-1–U-10（见 §2.10） | `docs/core/design/ADVISOR-GUARDS.md` §10 表 |
| 4 | 🟡 | 「本轮」认定：点火基线 `run.section3BlocksAtStart`（评审实例绑批档时读该档记下）+ 判据改读**最新轮次块**的状态行 | `docs/core/design/ADVISOR-GUARDS.md` §1.1 判据 1 ∥ 2 |
| 5 | 🟡 | 签发档跟正：F1 ∥ AC-M6-1 加「另须过 §3 落地门」指针（不复述，D2） | `docs/core/design/DESIGN-TOKEN-SETTLEMENT.md` §8 F1 ∥ AC-M6-1 |
| 6 | 🟡 | 写入面词表归属：`STATUS_WORDS[3].done = 评审通过` 为唯一完成词（`thincoder-core/agent-tools/batch-skeleton.mjs:45`），旧字面 `评审完成` 读侧等义（同档 `:53-55`），changes-required 不写状态词（同档 `:50-52`）——本档写入这两处读数 | `docs/core/design/ADVISOR-GUARDS.md` §1.1 判据 2 ∥ 「词表不补…」段 |
| 7 | 🟡 | `batch-unreadable` 给可复现路径两形（结算前移走批档 ∥ 点火时已不可读 ⇒ 基线 null） | `docs/core/design/ADVISOR-GUARDS.md` §1.1 末段 |
| 8 | 🟡 | 编号断链统一：`U-7` = `U-BG16`、`U-8` = `U-BG8`（编号以设计档为准）；受影响文件行改 `U-BG1–U-BG16` | `docs/core/design/DESIGN-TOKEN-SETTLEMENT.md` §10「编号对齐」段 ∥ 受影响文件表第 10 行 |
| 9 | 🟡 | 补「最相近先例」∥「公开源核查」两行（先例 = 同函数两道既有拒签闸；公开源 = `index.publicRepos` 空） | `docs/core/design/ADVISOR-GUARDS.md` §1.1 首两段 |
| 10 | 🟡 | 三问答案补齐：新名 3 个（`batchAbsPathOfRun` ∥ `unionBatches` ∥ `mergeEngTokenBatchesForSave`）+ 三个 reason 字面 | `docs/core/design/DESIGN-TOKEN-SETTLEMENT.md` §10 三问表 +3 行 ∥ `docs/core/design/ADVISOR-GUARDS.md` §1.1「拒因命名三问」 |
| 11 | 🟡 | 残余登记：`docSetKey` 兜底可得批归属而记录门只认 `run.batchDoc`；不扩触发面的理由一并写明 | `docs/core/design/ADVISOR-GUARDS.md` §1.2 三条边界 bullet |
| 12 | 🔵 | 行数自测：`split("\n").length − 1` 实测 `docs/core/design/ADVISOR-GUARDS.md` = 546（改前）；§12 表该行不再记本档行数（本档随其它节增删，写死必漂） | `docs/core/design/ADVISOR-GUARDS.md` §12 受影响文件表 |
| 13 | 🔵 | 规范面去历史：受影响表头 `本批 Δ（改前 → 现）` → `本笔 Δ`，四处「改前 → 现」lineage 清除；坐标按本轮实测收正（`token-ttl.mjs`：`persistEngTokens:304` ∥ `anyLiveDesignSlot:282` ∥ `engTokenSlotFields:117` ∥ `readEngTokensFromSlot:195`） | `docs/core/design/DESIGN-TOKEN-SETTLEMENT.md` §2 / §4 / §6.1 / §10 受影响表 ∥ 三问表 |

### 2.10 修正轮后的用例面（本批单测，落 `docs/batches/2026-10-27-advisor-face-fixes.test.mjs`）

| # | 类 | 输入 | 期望 |
|---|---|---|---|
| U-1 | 正常 | 临时批档 §3 有 1 轮次块 + 状态行 `评审通过`；`run.section3BlocksAtStart = 0`；回显 token + `VERDICT: pass` | `passed:true`；槽写入；approvedSuffix 在位 |
| U-2 | 错误（主症） | 同夹具，§3 有块无状态行 | `passed:false`；含 `review record incomplete` 与 `status-not-passed`；槽零写 |
| U-3 | 错误 | 状态行 = `进行中` | 同 U-2；回执指名当前值 |
| U-4 | 错误→放行 | U-2 的档补写状态行后同 run 再 settle | `passed:true`（同实例可重评） |
| U-5 | 错误 | §3 只有状态行、无轮次块 | `no-section3-block` |
| U-6 | 边界（零回归） | `run.batchDoc = null` + 回显 + `VERDICT: pass` | `passed:true`——门不适用 |
| U-7 | 正常（生产形，= 设计档 `U-BG16`） | `run = {designId, batchDoc, docSetKey}` ⇒ settle 后读清点 | 旁列 = 该绝对路径；清点行 `batch=<basename>` |
| U-8 | 边界（兜底零回归，= 设计档 `U-BG8`） | `run.batchDoc = null`、`docSetKey` 含批档 | 旁列 = 该批档 |
| U-9 | 错误（finding 4 回归） | §3 已有上一轮的块 + `评审通过`；本次一字未写（基线 = 1，结算时块数仍 1） | `passed:false` + `no-section3-block` |
| U-10 | 错误（读不到，finding 7） | 点火基线 `null`（档不可读）∥ 结算时档被移走 | `passed:false` + `batch-unreadable` |
| U-11 | 边界（changes-required，finding 1 回归） | 绑批档 + 回显 + `VERDICT: changes-required` | `passed:false` + 裁定闸标记（**不是**「记录不合格」）；`run.open` 仍 true；槽零写 |

**验收命令**：`node --test docs/batches/2026-10-27-advisor-face-fixes.test.mjs`。

### 2.11 受影响文件（修正轮后，行数口径 `split("\n").length − 1`，本轮实测）

| # | 文件 | 现行 | 预计 Δ | 改动面 |
|---|---|---|---|---|
| 1 | `thincoder-core/agent-tools/design-token.mjs` | 200 | +34 | §3 落地门（两判 + 标记常量 + 两个 import）；批归属派生改调 `batchAbsPathOfRun` |
| 2 | `thincoder-core/agent-tools/design-slots.mjs` | 305 | +18 | 新增导出 `batchAbsPathOfRun`；`batchOf` 走同一派生 |
| 3 | `thincoder-core/agent-tools/batch-skeleton.mjs` | 367 | +24 | 导出 `ROUND_HEADING_RE` ∥ `countRoundBlocks` ∥ `readLatestRoundStatusWord`（读侧单源） |
| 4 | `thincoder-core/agent-tools/batch.mjs` | 349 | −6～0 | 私有正则 / 计数改取 skeleton 导出（写入面语义零变） |
| 5 | `thincoder-core/agent-tools/advisor.mjs` | 260 | +6 | `batchDoc` 落 `run` 时读基线 ⇒ `run.section3BlocksAtStart`（读不到 ⇒ `null`）——**修正轮新增的第 5 档**（finding 4 的直接后果） |
| 6 | `docs/core/design/ADVISOR-GUARDS.md` | 546（改前实测） | 本批已落 | §1.1 ∥ §1.2 残余 ∥ §1.3 ∥ A-AG22–24 ∥ §12 表行 |
| 7 | `docs/core/design/DESIGN-TOKEN-SETTLEMENT.md` | 452（改前实测） | 本批已落 | §8 F1 ∥ AC-M6-1 ∥ §10 三问表 ∥ 用例表 ∥ 集成行夹具句 ∥ 受影响表 |
| 8 | `test/RTM.md` | 228 | +3 行 / 改写 1 行 | 10-1 改写 ∥ 10-4 ∥ 17-1 ∥ 17-2（编号已定死，实施轮逐字落） |
| 9 | `docs/batches/2026-10-27-advisor-face-fixes.test.mjs` | 0 | 新建 | U-1–U-11（收口即删） |

500 软线：五档产品码改后最大 `batch-skeleton.mjs` ≈391，均未触线；`batch-lifecycle.mjs` 本批零改。

### 2.12 上抛项（修正轮后）

- **[上抛·待裁] 需求档三处待主 agent 落**：① R1 在 `docs/core/requirements/ADVISOR-CONVERGENCE.md` 已有 F-A13（`:167`）——修正轮补读后确认**已在档**，原 §2.7 的「缺位」一条对 R1 不成立，撤回；② R2 在 `docs/core/requirements/DESIGN-TOKEN-SETTLEMENT.md` 仍无「归属从哪来」的条目（F-D7 只覆盖存储与消费）；③ 同档 `:23` 把函数面用例写作 `U-7`，设计侧编号为 `U-BG16`（设计档已声明同一用例，需求侧待对齐）。
- **[上抛·知会] `test/RTM.md` 由实施轮落**：10-1（改写）∥ 10-4 ∥ 17-1 ∥ 17-2 编号已定死；实施轮须同时改 10-1 ∥ 10-4 的夹具（让评审写 §3），否则两行断言不可达。
- **已知代价（如实登记）**：门只在评审经工具链结算时生效；绕过 settle 的路径不受判（与今日一致）。兜底来源（`docSetKey` 带批档）可得批归属而不触发本门，已登记在 `docs/core/design/ADVISOR-GUARDS.md` §1.2。

### 2.13 第三轮修正（评审 §3 轮次 2 · findings 3 / 13 / 14 / 15 / 16 逐条落）

**本轮改判两处设计**（前文已就地改写，不留旧文）：① 判据 1 改为**无条件**（前移到裁定闸之前、两轨同判），判据 2 只在签发路径上判——主 agent 裁定，理由 = changes-required 的发现正是修正轮的输入；② 判据 2 的读面由「最新轮次块的状态行」改为**段级**状态行——原写法要读一行没人写的字（写入面核实见下表 #15）。

| # | 严重度 | 处置 | 落点 |
|---|---|---|---|
| 14 | 🔴 | 射程统一：判据 1 无条件（回显闸后、裁定闸前，两轨同判）；判据 2 只在裁定 pass 之后判；A-AG22 ∥ A-AG23 措辞与触发条件同射程（A-AG23 原来只豁免判据 2，与「本门不可达」对不上）；「changes-required 的结算形态」段同步改写；失败形态段补两拒射程。需求 F-A13 不改（主 agent 裁定：它写的就是无条件） | `docs/core/design/ADVISOR-GUARDS.md` §1.1 触发条件 2 ∥ 判据 1/2 ∥ 失败形态末句 ∥ changes-required 段 ∥ A-AG22 ∥ A-AG23 |
| 15 | 🟡 | **写入面核实（本轮实读）**：状态行**只有段级一处写面**——`updateSectionStatusLine`（`thincoder-core/agent-tools/batch-skeleton.mjs:164-182`）在 `## §N` 段内改写首个 `**状态行**：` 行、缺则插在段头之后；评审经 `batch` 的 `status` 动作写 §3 走的就是它。**轮次块由工具戳 `### 轮次 N（评审子代理）` 标题，块内无状态行落点**——本批 §3 自身两轮均无块内状态行，即现场证据。⇒ 判据 2 改读段级 `readSectionStatusWord(src, 3)`（同档 `:194`），读面与写面同形；并给出「段级正是下游 `§5` 写入门读的那一处（`thincoder-core/agent-tools/batch-closeout.mjs:105`），另读一处即成第二真源」的理由。原处方 `readLatestRoundStatusWord` **退场** | `docs/core/design/ADVISOR-GUARDS.md` §1.1 判据 2 |
| 3（残余） | 🟡 | ① 单测用例点名 + 宿主档 + 验收命令落入 §1.3；② 本笔受影响文件表（现量 + Δ + 500 软线判读）落入 §1.3，五档（含 `advisor.mjs`）逐行 | `docs/core/design/ADVISOR-GUARDS.md` §1.3「当批单测」∥「受影响文件（本笔）」 |
| 13 | 🔵 | 坐标按本轮实测收正：`token-ttl.mjs` `persistEngTokens:304`（原记 `:233`）· `readEngTokensFromSlot:195`（原记 `:164`）；`design-token.mjs` `buildApprovedSuffix:28`（原记 `:22`）∥ `settleDesignReview:141`（原记 `:82`）；裁定闸统一 `:165-169`；两档 `test/RTM.md` 行不再记行数（记死必漂——本轮实测 228，两处旧读数 107 / 148 均不符） | `docs/core/design/DESIGN-TOKEN-SETTLEMENT.md` §3 ∥ §6.3 两行 ∥ §10 受影响表；`docs/core/design/ADVISOR-GUARDS.md` §12 表 RTM 行 |
| 16 | 🔵 | 「新建」档的现行行数列统一 0（原 158 / 486 是落成后的读数却被摆在现行列） | `docs/core/design/DESIGN-TOKEN-SETTLEMENT.md` §10 受影响表第 9 ∥ 10 行 |

**用例面收正**：U-1–U-11 保留原义；**新增 U-12** = changes-required 且未写 §3 ⇒ `no-section3-block`（判据 1 无条件的回归面）；U-11 仍守「已写 §3 的 changes-required 轮拿裁定闸标记」。U-9 ∥ U-10 语义不变。

**对 §2.11 表的收正（一处）**：第 3 行原写 `batch-skeleton.mjs` 导出 `ROUND_HEADING_RE ∥ countRoundBlocks ∥ readLatestRoundStatusWord`——`readLatestRoundStatusWord` 随 finding 15 退场，本批只导出前两个（+24 行估计随之略降，以实施轮实测为准）。

**本轮读数**（口径 `split("\n").length − 1`，改后实测）：`docs/core/design/ADVISOR-GUARDS.md` 580 → **602**；`docs/core/design/DESIGN-TOKEN-SETTLEMENT.md` 457 → **457**（只改坐标与行数列，零增删）；`test/RTM.md` **228**（本轮未改）。

**新增残余登记（本批不改，须另裁）**：判定 §3 状态行的段级字面不携带「哪一轮写的」——某批 §3 已由一轮 pass 写成 `评审通过`，另起一轮打回（按词表纪律不写状态词）后，该字面仍是上一轮的值，下游 `§5` 写入门（`batch-closeout.mjs:105`）照旧放行。敞口在本闸之前就存在（打回从不重置状态行）；「打回时重置 §3 状态行」是新的写入语义，已登记在 `docs/core/design/ADVISOR-GUARDS.md` §1.2 残余 bullet（含复现路径），不在本批实施。

## §3 设计评审（评审子代理）
**状态行**：评审通过



### 轮次 1（评审子代理）

### 设计评审（两笔：#1841 结算点 §3 落地门 · #1839 批归属两源定序）

审读面（4 档全文）：`docs/core/design/ADVISOR-GUARDS.md` · `docs/core/design/DESIGN-TOKEN-SETTLEMENT.md` · `docs/core/requirements/ADVISOR-CONVERGENCE.md` · `docs/core/requirements/DESIGN-TOKEN-SETTLEMENT.md`。代码坐标未复读（越出评审面）——涉码断言标 `unverified`。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Requirements | 🔴 | §1.1 把 §3 状态行判据写成**无条件**（`docs/core/design/ADVISOR-GUARDS.md:47` 判据（两件同判）；`:50` 状态行 = `评审通过`），而需求侧限定为 pass 时才成立（`docs/core/requirements/ADVISOR-CONVERGENCE.md:167` 判 pass 时 §3 状态行必须为 `评审通过`）。按现文，任何绑了 `batchDoc` 的 **changes-required** 评审都会以「评审记录不合格——token 未签发」形态结算且「槽零写、实例不关」（`:61`）——修正轮循环拿不到轮次进位（F-A2 / F-A1 轮次衰减），且回执把一份完整评审说成记录不完整。同时读侧词表只有 `评审通过` / 旧字面 `评审完成`（`:50`），没有表达「已评审、changes-required」的字面，与 F-A13「不解析评审正文判定 pass（只读状态行字面）」形成张力：本门若要对 pass 条件化，设计需说明结算点如何得知本次判决 | 把第 2 条判据的适用面写清（pass 时校验 `评审通过`；changes-required 时该门不适用或其期望字面另定），并写明该情形下实例关停与轮次进位的行为 |
| 2 | Integration-test design | 🔴 | 第①笔改的是业务可观察结果（结算发放/拒发凭证 ⇒ spawn 放行/机械拒），但两档都没有针对它的 RTM delta：`docs/core/design/ADVISOR-GUARDS.md:517` 的集成验收段起点是「`test/RTM.md` 故事 6」（收面放宽那一笔），`docs/core/design/DESIGN-TOKEN-SETTLEMENT.md:363` 的集成段只覆盖收口消费；§3 落地门没有「破行 / 冗余 / 缺失」三答，也没有交互组件 · 业务结果 · 进入口 · 回指四列 | 从 `test/RTM.md` 起读为第①笔补一段 delta：哪条既有行的业务结果被改写、缺哪条（编号先落 RTM）、每行的组件交互与业务可观察结果与回指（F-A13） |
| 3 | Acceptance criteria | 🔴 | 第①笔无验收面：`docs/core/design/ADVISOR-GUARDS.md:422-444` 的 A-AG1–A-AG21 无一回指 F-A13 / §1.1；无单测用例（三个 reason 值 `no-section3-block` / `status-passed` 侧的拒形、`槽零写`、`实例不关`、`补写后重评` 均无用例编号），可机判的只有恒定标记串（`:57-58`） | 补 A-AG 行 + 当批单测用例（三条 reason 各一 + 补写后放行 + 变更请求轮的行为），并给出本笔的验收命令（改后单测档，`node --test <file>`） |
| 4 | Requirements | 🟡 | 第 1 条判据只要求「§3 段内至少一个工具戳轮次块」（`docs/core/design/ADVISOR-GUARDS.md:49`），第 2 条读侧把旧字面 `评审完成` 当等义（`:50`）⇒ 同一批档上一轮留下的轮次块与状态行可在**本轮一字未写**的情况下同时满足两件判据。需求侧字面是「该档 §3 必须已被**本轮**写过」（`docs/core/requirements/ADVISOR-CONVERGENCE.md:167`） | 写明「本轮」如何认定（轮次块计数 / 最新块轮次号 / 本轮戳），使复评不得凭旧记录过门 |
| 5 | Document ownership | 🟡 | 持有「评审通过 ⇒ 签发凭证」这一机制叙述的档是 `docs/core/design/DESIGN-TOKEN-SETTLEMENT.md`（§8 F1 `:122` ∥ AC-M6-1 `:132`），该档未随本笔收正、也无指向 §1.1 的指针 ⇒ 只读该档的人仍会按「pass 即签发」发布为无附加前置条件 | 在 §8 F1 / AC-M6-1 加一行指针（签发条件另含 §3 落地门，判据单源 = `docs/core/design/ADVISOR-GUARDS.md` §1.1），D2 不重述 |
| 6 | Feasibility | 🟡 | §1.1 的判据字面 = `评审通过`，但写入面是否有该状态词未在任何被审档内交代：`:75` 的边界只免了「段白名单」，没交代 `batch` 状态行写入面的合法词表。若写入面只认另一字面，本门永不可达（声明侧记「今日已卡五次」正为此形态）——`unverified`（写入面词表在被审面外） | 写明状态行的合法词表归属（哪一侧是权威、`评审通过` 是否已可写），并让拒形文案给出可执行的字面 |
| 7 | Branch provenance | 🟡 | `batch-unreadable` 分支没有真实观察，也没有可复现路径——`:63` 只给「与 §10『读不到 ≠ 没有』同一判据方向」的判据类比。按 6b 严格读法这是「说不出场景的分支」；反方向（把读不到当没有记录）严格更坏，故不阻断，但该分支四件伴生物（提示 / 文案 / 跨端一致 / 测试材料）无场景可验 | 记一条可复现路径（点火后把批档移走 / 改不可读 → 结算 → 应得 `batch-unreadable` 且零签发），或说明该状态与既有 `batch-unreadable` 类同的处置 |
| 8 | Traceability | 🟡 | 需求侧把第②笔的函数面用例点名为「U-7 函数面」（`docs/core/requirements/DESIGN-TOKEN-SETTLEMENT.md:23`），设计侧用例叫 `U-BG16` 且全文无 U-7；同一张受影响文件表仍写「当批单测 U-BG1–U-BG15」（`docs/core/design/DESIGN-TOKEN-SETTLEMENT.md:392`），而其下用例表已含 U-BG16（`:416`）——两套编号并存，需求到用例的回指断链 | 统一一处编号（需求侧改为 U-BG16 或设计侧声明 U-7 = U-BG16），并把受影响文件行改为覆盖 U-BG16 的读数 |
| 9 | Closest precedent / survey | 🟡 | §1.1 / §1.2 无「最相近先例」行（先例坐标 + 对齐 ∥ 偏差理由）也无「公开源核查」行，而同档其它节均带（`:349-351` ∥ `:462-466`）⇒ 本笔是否勘过先例不可区分 | 补一行先例坐标（被仿形的 §5.2 裁定闸 / `settleDesignReview` 既有拒形）与对齐、偏差理由；补公开源核查结论（无公开源也照记） |
| 10 | Existing-piece check | 🟡 | 第②笔新引入的名字有三个未带三问答案：`batchAbsPathOfRun`（`docs/core/design/DESIGN-TOKEN-SETTLEMENT.md:272`）、`unionBatches`（`:318`）、`mergeEngTokenBatchesForSave`（`:300`），而三问表（`:355-361`）只覆盖另外五个；第①笔的三个 reason 字面（`docs/core/design/ADVISOR-GUARDS.md:57`）同样无三问答案 | 逐个补 `existing:` / `none found:` / `existing but unusable:` 三形之一（名称逐字 + 所在 + 消费者） |
| 11 | Scope | 🟡 | 同一轮把 `docSetKey` 兜底确立为一线归属来源（`docs/core/design/DESIGN-TOKEN-SETTLEMENT.md:275`），但 §3 落地门的触发条件只认 `run.batchDoc`（`docs/core/design/ADVISOR-GUARDS.md:45`）⇒ 「批档写进 `documents`」这一已验收调用形（`:278` U-BG1 ∥ U-BG8 ∥ RTM 10-1）下，记录门不适用、槽仍带批归属。需求侧字面就是 batchDoc，故不阻断，但残余未在边界段登记 | 在 `:75` 边界段如实登记该残余（兜底来源可得批归属 ⇒ 记录门不覆盖），并说明为何不扩触发面 |
| 12 | Numeric drift | 🔵 | 本档自述受影响文件行写「现量 511」（`docs/core/design/ADVISOR-GUARDS.md:510`），实际读盘 547 行——本轮新增的 §1.1 / §1.2（`:43-75`）未进注记，spot-check 对不上 | 把该校正为改后读数或说明该行只覆盖收面那一笔 |
| 13 | Doc hygiene | 🔵 | `docs/core/design/DESIGN-TOKEN-SETTLEMENT.md:383` 受影表列名「本批 Δ（改前 → 现）」与 `:392`「440 → 486 为 U-BG15 落成后读数，预估 394」把已落地历史写在规范面；同档同一函数在 `:16`/`:63`（`persistEngTokens` `:233`）与 `:300`（`:335-340`）、`anyLiveDesignSlot` 在 `:33`（`:211`）与 `:270`（`:275`）、`engTokenSlotFields` 在 `:29`（`:112`）与 `:298`（`:117`）坐标互不一致（`:394` 已声明 as-of 口径，故记 Note） | 规范面只留「现量 + 预计 Δ」；代码坐标按符号名为准并收正一处读数 |

计数：🔴 3 · 🟡 8 · 🔵 2。阻断项 = 第①笔的判据适用面（finding 1）+ 第①笔的集成 delta 与验收面（findings 2 · 3）。第②笔（两源定序）本体在档：KD-BG10 记录两路否决、两条分支各有出处（`:278`）、集成 10-1 护行与缺失行 10-4 已给、验收命令 = 当批单测档（`:435`）。

VERDICT: changes-required

### 轮次 2（评审子代理）

### 第二轮复评（13 条逐条复核 + 新增项）

审读面 = 4 档全文（design/ADVISOR-GUARDS · design/DESIGN-TOKEN-SETTLEMENT · requirements/ADVISOR-CONVERGENCE §8 · requirements/DESIGN-TOKEN-SETTLEMENT）。代码坐标未复读（越出评审面），涉码断言标 unverified。

| # | Orig# | File | Severity | Status | Notes |
|---|-------|------|----------|--------|-------|
| 1 | 1 | docs/core/design/ADVISOR-GUARDS.md | — | Fixed | 判据已条件化：`:51-52` 触发条件二「走的是签发路径」+ `:54`「只在签发路径上判」+ `:76` changes-required 结算形态 + `:74` 词表不补 changes-required 字面 |
| 2 | 2 | docs/core/design/ADVISOR-GUARDS.md | — | Fixed | 新增 §1.3（`:96-106`）起点 = RTM 故事 17，17-1 ∥ 17-2 四列在位，破行/冗余/缺失三答在位，用例标题同号逐字 |
| 3 | 3 | docs/core/design/ADVISOR-GUARDS.md | 🟡 | Unfixed | A-AG22–24（`:476-478`）已补齐验收面（三个 reason + 槽零写 + 实例不翻 open + 两前置零回归）；残余两项：① 单测用例未点名——`:106` 只写「由单测守」，无 U 编号、无宿主测试档；② 本笔实现文件无 现量/Δ 注记——`design-token.mjs` 的 +16 在另一档只记旁列写面（`:388`），`batch-skeleton.mjs`（`countRoundBlocks` / `ROUND_HEADING_RE` 新导出）、`batch.mjs`（`:46` ∥ `:126-128` 改取导出）、`advisor.mjs`（点火基线 `run.section3BlocksAtStart`）三档零注记，500 行档位无法判 |
| 4 | 4 | docs/core/design/ADVISOR-GUARDS.md | — | Fixed | `:56` 块数 > 点火基线（`run.section3BlocksAtStart`，单源 `countRoundBlocks`）+ `:57`「只认最新块」并明写段级读会被上一轮留下的字面满足 ⇒ 旧记录过门的孔已闭 |
| 5 | 5 | docs/core/design/DESIGN-TOKEN-SETTLEMENT.md | — | Fixed | `:122` F1 加「签发条件另含 §3 落地门（判据单源 = ADVISOR-GUARDS §1.1，D2 不复述）」；`:132` AC-M6-1 同步 |
| 6 | 6 | docs/core/design/ADVISOR-GUARDS.md | — | Fixed | `:57` 词表来源已点名（`STATUS_WORDS[3].done` + `STATUS_WORD_ALIASES[3]`，坐标 `batch-skeleton.mjs:42-55`）——词表权威面有了单一出处（常量实值 unverified） |
| 7 | 7 | docs/core/design/ADVISOR-GUARDS.md | — | Fixed | `:78` 补两形复现路径（结算前移走/改不可读；点火时不可读 ⇒ 基线 null）并进 A-AG24（`:478`）；`:45` 偏差理由登记「本闸要读一次批档」 |
| 8 | 8 | docs/core/design/DESIGN-TOKEN-SETTLEMENT.md | — | Fixed | 需求 `:23` 自注「原稿作 U-7，与设计侧同名」；设计 `:428`「编号对齐」句 + 受影响文件行改「U-BG1–U-BG16」（`:395`） |
| 9 | 9 | docs/core/design/ADVISOR-GUARDS.md | — | Fixed | `:45` 最相近先例（两道既有拒签闸坐标 + 对齐四项 + 偏差一项）；`:47` 公开源核查（`index.publicRepos` = []） |
| 10 | 10 | docs/core/design/DESIGN-TOKEN-SETTLEMENT.md | — | Fixed | 三问表补 `batchAbsPathOfRun`（`:362` existing but unusable）、`unionBatches`（`:363`）、`mergeEngTokenBatchesForSave`（`:364`）；拒因三值三问在 `:70` |
| 11 | 11 | docs/core/design/ADVISOR-GUARDS.md | — | Fixed | `:92-94` 兜底来源不触发本门登记为残余，并给「不扩触发面」的理由（F-A13 字面 = batchDoc） |
| 12 | 12 | docs/core/design/ADVISOR-GUARDS.md | — | Fixed | `:544` 改为「本行不记本档行数（记死必漂），行数以当轮实读为准」——原 511 的错读数已撤 |
| 13 | 13 | docs/core/design/DESIGN-TOKEN-SETTLEMENT.md ∥ docs/core/design/ADVISOR-GUARDS.md | 🔵 | Unfixed | 同档同一符号坐标仍互不一致：`persistEngTokens` `:90`（`token-ttl.mjs:233`）vs `:16`/`:63`/`:300`（`:304`）；`readEngTokensFromSlot` `:24`（`token-ttl.mjs:164`）vs `:63`/`:343`（`:195`）；`裁定闸` `:52`（`design-token.mjs:157-169`）vs `:45`/`:59`（`:165-169`）；`test/RTM.md` 现量 `docs/core/design/ADVISOR-GUARDS.md:547` = 107 vs `:393` = 148 |
| 14 | (new) | docs/core/requirements/ADVISOR-CONVERGENCE.md ∥ docs/core/design/ADVISOR-GUARDS.md | 🔴 | New: 修正把「§3 已被本轮写过」也挪进签发路径，与需求句一仍是无条件句相悖；同档 A-AG23 自身也与触发条件不同射程 | 需求 `:167`「结算时该档 §3 必须已被本轮写过」（无条件）· 边界列同「绑 `batchDoc` 且未写 §3 → 结算拒 + 回执点名」；设计 `:52`「裁定非 pass（changes-required ∥ no-pass-line）⇒ 结算已在裁定闸早退，本门不可达」（两条判据一并不可达）；而 `:477` A-AG23 只写「判据 2 不参与判定」。⇒ changes-required 轮未写 §3 不会被拒，与需求句一、与 A-AG23 自身射程都对不上（同一机制两处射程不同）。建议：把 F-A13 句一也条件化到签发路径（D>F，设计为准），或让判据 1 前移到裁定闸之前并对两轨生效——二者取一，并让 A-AG23 的措辞与触发条件同射程 |
| 15 | (new) | docs/core/design/ADVISOR-GUARDS.md | 🟡 | New: 判据 2 的「块内状态行」只给了读侧，写入面未点名 | `:57` 要「取 §3 段内最后一枚轮次块，读块内 `**状态行**：` 的取值」，`:74` 又定「§3 只留一个完成词 `评审通过`」，但两档都没写谁把这一行写进轮次块（是评审 append 正文自带，还是段级 status 写入面另有每轮落点）。若写入面只有段级状态行，则 `:57` 自己登记的「段级读会被上一轮留下的字面满足」正好把判据 2 变成永假/永真两态。建议补一句写入面坐标（unverified——`batch.mjs` / `batch-skeleton.mjs` 在被审面外） |
| 16 | (new) | docs/core/design/DESIGN-TOKEN-SETTLEMENT.md | 🔵 | New: 受影响文件表「现行行数 158 / 486」与「新建」并列 | `:394`「`test/integration/batch-close-token-consume.test.mjs` \| 158 \| 新建（本批）」· `:395`「`docs/batches/2026-10-26-pen-gate-batch-scope.test.mjs` \| 486 \| 新建（随批删）」——新建档同时给出既有行数；同档另一笔的同类行用 0 起（`docs/core/design/ADVISOR-GUARDS.md:548-549`）。建议统一「新建 ⇒ 0 / 预计读数」二选一 |

**复核结论**：13 条里 11 条 Fixed（#1–#12 除 #3 · #13）· #3 降级为 🟡 残余 · #13 为 🔵 残余。第②笔（两源定序）本体复核通过：KD-BG10 两条否决（`:455`）· 定序两条分支各带出处（`:278`）· U-BG16 生产形用例（`:419`）+ A7（`:438`）· 编号对齐（`:428`）· 10-1/10-4 夹具前置已同步（`:376-377`）· 验收命令 = 当批单测档（`:440`）。

**新增**：1 🔴（需求/设计射程不一致 + A-AG23 措辞）· 2 🟡 · 2 🔵。计数 = 🔴 1 · 🟡 2 · 🔵 2。

VERDICT: changes-required（本轮不置 §3 状态行 —— 结论为打回，置 `评审通过` 会把未过的评审记成通过）

未回显有效 token——未签发 (no valid token echo — no design token was issued)

### 轮次 3（评审子代理）

### 第三轮（修正后复评）

审读面：四档全文（`docs/core/design/ADVISOR-GUARDS.md` · `docs/core/design/DESIGN-TOKEN-SETTLEMENT.md` · `docs/core/requirements/ADVISOR-CONVERGENCE.md` · `docs/core/requirements/DESIGN-TOKEN-SETTLEMENT.md`）。代码坐标未复读（越出评审面）。

| # | Orig# | File | Severity | Status | Notes |
|---|-------|------|----------|--------|-------|
| 1 | 1 | docs/core/design/ADVISOR-GUARDS.md | — | Fixed | 触发条件两件（`:51` 绑批档 ∥ `:52` 回显有效 token）；`:54`「判据（两条，第二条只在签发路径上判）」；`:57` 判据 2 只在裁定闸之后；`:78` 词表不补 changes-required 字面 |
| 2 | 2 | docs/core/design/ADVISOR-GUARDS.md | — | Fixed | §1.3（`:101-111`）起点 = `test/RTM.md` 故事 17；17-1 ∥ 17-2 四列在位；破行（10-1 ∥ 10-4 夹具）∥ 冗余 ∥ 缺失三答在位；用例标题同号逐字 |
| 3 | 3 | docs/core/design/ADVISOR-GUARDS.md | 🟡 | Fixed | 当批单测表 U-1–U-12（`:115-120`，宿主档 + 验收命令点名）；受影响文件表（`:124-132`）四档产品码 现量/预计 Δ 齐（`design-token.mjs` 200 +34 ∥ `batch-skeleton.mjs` 367 +24 ∥ `batch.mjs` 349 −6～0 ∥ `advisor.mjs` 260 +6）+ `:132` 500 软线判读 |
| 4 | 4 | docs/core/design/ADVISOR-GUARDS.md | — | Fixed | `:56` 轮次块数 > 点火基线（`run.section3BlocksAtStart`，单源 `countRoundBlocks`）；`:57` 段级读同写面；`:99` 段级状态行不携带轮次的残余如实登记（理由 + 受影响面 + 本批不改） |
| 5 | 5 | docs/core/design/DESIGN-TOKEN-SETTLEMENT.md | — | Fixed | `:122` F1 加「签发条件另含 §3 落地门（判据单源 = ADVISOR-GUARDS §1.1——本档不复述，D2）」；`:132` AC-M6-1 同步 |
| 6 | 6 | docs/core/design/ADVISOR-GUARDS.md | — | Fixed | `:57` 词表权威面点名：`STATUS_WORDS[3].done` + `STATUS_WORD_ALIASES[3]`，坐标 `batch-skeleton.mjs:42-55`（常量实值未复读 = unverified） |
| 7 | 7 | docs/core/design/ADVISOR-GUARDS.md | — | Fixed | `:82` 两形复现路径（结算前移走 ∥ 点火时不可读 ⇒ 基线 `null`）＋ A-AG24（`:504`）＋ `:45` 偏差理由 |
| 8 | 8 | docs/core/requirements/DESIGN-TOKEN-SETTLEMENT.md ∥ docs/core/design/DESIGN-TOKEN-SETTLEMENT.md | — | Fixed | 需求 `:23`「`U-BG16`——原稿作 U-7，与设计侧同名」；设计 `:428`「编号对齐」句；受影响文件行 `:395`「U-BG1–U-BG16」 |
| 9 | 9 | docs/core/design/ADVISOR-GUARDS.md | — | Fixed | `:45` 最相近先例（`design-token.mjs:165-169` ∥ `:147-153`，对齐四项 + 偏差一项）；`:47` 公开源核查（`index.publicRepos` = `[]`） |
| 10 | 10 | docs/core/design/DESIGN-TOKEN-SETTLEMENT.md | — | Fixed | 三问表 `:362` `batchAbsPathOfRun` ∥ `:363` `unionBatches` ∥ `:364` `mergeEngTokenBatchesForSave`；拒因三值三问在 `docs/core/design/ADVISOR-GUARDS.md:74` |
| 11 | 11 | docs/core/design/ADVISOR-GUARDS.md | — | Fixed | `:96-98` 兜底来源不触发本门登记为残余（残余面 + 不扩触发面的理由） |
| 12 | 12 | docs/core/design/ADVISOR-GUARDS.md | — | Fixed | `:570`「本行不记本档行数：本档随其它节增删，记死必漂；行数以当轮实读为准」——511 错读数已撤 |
| 13 | 13 | 四档 | 🔵 | Fixed | 四处坐标全部收正（本轮实读核对）：`persistEngTokens` 全档 `:304`（design `:17`·`:63`·`:90`·`:300`）；`readEngTokensFromSlot` 全档 `:195`（`:24`·`:63`·`:343`·`:359`）；裁定闸 `:165-169` / 回显闸 `:159-162`（GUARDS `:45`·`:52`·`:59-61` 同形）；`test/RTM.md` 两档均改为不记行数（GUARDS `:573` ∥ design `:393`） |
| 14 | 14(new) | docs/core/design/ADVISOR-GUARDS.md ∥ docs/core/requirements/ADVISOR-CONVERGENCE.md | 🔴 | Fixed | 判据 1 改回无条件且两判决同判：`:56`「**无条件**——两种判决都判」+「changes-required 轮同判」；`:72` 射程句；`:80`「changes-required 的结算形态：判据 1 照判…判据 2 不参与」；A-AG22（`:502`）/ A-AG23（`:503`）与触发条件同射程——需求 F-A13 句一（`:167` 无条件「结算时该档 §3 必须已被本轮写过」）不再被设计收窄 |
| 15 | 15(new) | docs/core/design/ADVISOR-GUARDS.md | 🟡 | Fixed | 判据 2 写入面已点名并与读面同形：`:57` 读段级 `readSectionStatusWord(src, 3)`，写面单点 `updateSectionStatusLine`（`batch-skeleton.mjs:164-182`，评审经 `batch` 的 `status` 动作写入），并明写「轮次块只由工具戳标题、块内无状态行落点 ⇒ 读块内状态行是读一行没人写的字」 |
| 16 | 16(new) | docs/core/design/DESIGN-TOKEN-SETTLEMENT.md | 🔵 | Fixed | `:394` / `:395` 改为「0（新建）」，与同族 `docs/core/design/ADVISOR-GUARDS.md:130`（现量 0 → 新建）同口径；不再出现「新建档 + 既有读数」并列 |

**计数**：16 项全部收口 —— Fixed 16（含上轮 🔴 1 · 🟡 2 · 🔵 2 全部收正）· Accepted 0 · Unfixed 0 · 新增 🔴 0 · 新增 🟡/🔵 0。

**说明**：上轮 #14（判据 1 被一并挪进签发路径 ⇒ 与 F-A13 句一相悖）按父侧裁定改为「判据 1 无条件、判据 2 只在签发路径」，A-AG22/23 与 §1.1 射程句同形，无并存读法。上轮 #15（块内状态行无人写）按写入面实况改回段级读，并把「打回不重置状态行」作为残余显式登记（`:99`，含理由与受影响面），属「携理由的不修」——按争议窗在第三轮收口。

VERDICT: pass

## §4 用户批准（主 agent）

- **批准**：用户 2026-10-27 18:58「三笔都处理了。」→ 19:19「派」。本批是三笔之一，批准随该令生效。
- **批准对象**：§2 设计（两笔：结算点 §3 落地门 · 批归属两源定序）+ §3 三轮评审结论（末轮 pass，16 条全 Fixed）+ §5 实施（12 个 U 全绿）。
- **批准前的门**：§3 状态行 = `评审通过`（第三轮由评审实例自己写成）· 文档门：批档 `DOC-CHECK GATE: PASS`（本轮清掉 48 条悬空锚，见 §6.4）· 四档设计 / 需求各自 gate PASS。
- **实施面**：§5 已由 eng-coder 落盘（`实施完成`），含父侧裁定后的补落（`batch.mjs:275` 一词）。

## §5 实施记录（eng-coder）
**状态行**：实施完成（两笔均落 + 父侧裁定后补落 batch.mjs:275 描述词；12 条单测全绿；终态 clean）



### 5.1 交付表（一条 = 一个 U；两笔 = R1 结算点 §3 落地门 ∥ R2 批归属两源定序）

| # | 条目 | 状态 | 落点 / 判据 |
|---|---|---|---|
| U-1 | 正常：§3 有轮次块 + 状态行 = `评审通过` ⇒ 签发（槽写入 + approvedSuffix 在位） | ✅ Done | `design-token.mjs` 判据 1（回显闸后、裁定闸前）+ 判据 2（裁定闸后） |
| U-2 | 本批主症：判 pass 但 §3 无状态行 ⇒ 拒签、回执含 `review record incomplete` + `status-not-passed`、槽零写 | ✅ Done | 同上（判据 2） |
| U-3 | §3 状态行 = `进行中` ⇒ 同 U-2，回执指名当前值 | ✅ Done | 拒回执第三行 `证据：§3 状态行 = 进行中；须 = 评审通过（段级状态行由 batch 的 status 动作写入）` |
| U-4 | 补写状态行后同一实例再 settle ⇒ 签发（实例未关） | ✅ Done | 拒签面 `run.open` 不翻 + 槽零写 |
| U-5 | §3 只有状态行、无轮次块 ⇒ `no-section3-block` | ✅ Done | 判据 1（段内轮次块计数，单源 `countRoundBlocks`） |
| U-6 | 未绑 `batchDoc` ⇒ 本门不适用，照常签发（零回归） | ✅ Done | 前置条件写在判据上（不是实现时跳过） |
| U-7 | 生产形：`run.batchDoc` 优先 ⇒ 旁列 = 批档绝对路径、清点「批」列 = basename（含旁列缺失时的同源兜底） | ✅ Done | `design-slots.mjs` `batchAbsPathOfRun` + `batchOf` 共用同一派生 |
| U-8 | 兜底零回归：`run.batchDoc = null`、`docSetKey` 含批档 ⇒ 旁列 = 该批档 | ✅ Done | 同上（第 2 源） |
| U-9 | 上一轮已有块且状态行已 pass、本轮一字未写 ⇒ `no-section3-block` | ✅ Done | 点火基线 `run.section3BlocksAtStart`（`advisor.mjs` 每轮发起刷新） |
| U-10 | 点火基线缺失 ∥ 结算时档被移走 ⇒ `batch-unreadable`（两支） | ✅ Done | 判据 1 的读失败形，照拒 |
| U-11 | changes-required 且已写 §3 ⇒ 裁定闸标记（**不是**记录不合格）、实例仍 open | ✅ Done | 判据 1 无条件、判据 2 只在签发路径 |
| U-12 | changes-required 且未写 §3 ⇒ `no-section3-block`（判据 1 无条件的回归防线） | ✅ Done | 同上 |

### 5.2 读数（命令 + 结果）

- `node --test docs/batches/2026-10-27-advisor-face-fixes.test.mjs` ⇒ **12 pass / 0 fail**
- `node --test test/integration/batch-close-token-consume.test.mjs` ⇒ **3 pass / 0 fail**（10-1 夹具改写为生产形 + 10-4 新增 + 10-2 零改）
- `node --test test/integration/advisor-record-gate.test.mjs` ⇒ **2 pass / 0 fail**（17-1 ∥ 17-2）
- 改动面回归（本笔触及共享面，实跑）⇒ 全绿：`batch-close-gate` 4 · `batch-gates-reanchor` 7 · `batch-ledger-bind` 3 · `batch-anchor-create` 2 · `batch-live-batch-lock` 6 · `ledger-close-proof` 1 · `review-doc-scope` 5
- `doc_check(mode:"gate", docs:["test/RTM.md"])` ⇒ `DOC-CHECK GATE: PASS`

### 5.3 判断力读数（把实现行中和掉 ⇒ 对应断言转红；复跑后始终 `restored: true`）

| 中和点 | 转红的 U |
|---|---|
| M1 判据 2 整段作废（`if (word !== …)` ⇒ `if (false)`） | U-2 · U-3 · U-4 |
| M2 判据 1 永不触发（`blocks <= 基线` ⇒ `blocks < 0`） | U-5 · U-9 · U-12 |
| M3 基线缺失分支作废 | U-10 |
| M4 读失败吞成「空档」（档不可读 ⇒ 空串） | U-10 |
| M5 派生丢主源（`batchAbsPathOfRun` 不读 `run.batchDoc`） | U-7 |
| M6 清点面兜底不共用派生（退回 `docSetKey` 单源） | U-7 |
| M7 轮次块计数恒 0 | U-1 · U-2 · U-3 · U-4 · U-7 · U-11 |

**U-12 特别读数**：M2 下 U-12 转红 ⇒ 该条确实量的是「判据 1 无条件」，不是空转（父侧裁定的射程经得起中和）。U-6 ∥ U-8 ∥ U-11 在任何中和下保持绿——它们守的就是零回归与射程边界。

### 5.4 改动面

**清单内**（7 档）：

- `thincoder-core/agent-tools/design-token.mjs`（+67）：§3 落地门两判 + 三拒因 + 恒定标记 + 证据行。
- `design-slots.mjs`（净 ±0）：新增 `batchAbsPathOfRun`、删已被它取代的私有 `batchBasename`、`batchOf` 改走同一派生。
- `batch-skeleton.mjs`（+24）：导出 `ROUND_HEADING_RE` ∥ `countRoundBlocks`，读侧单源。
- `batch.mjs`（−7）：私有正则 / `roundCount` 改取同一导出，**段白名单与写入语义零改**；另 `:275` 描述词随父侧裁定收正（见 §5.7）。
- `advisor.mjs`（+20）：`section3BlocksBaseline` + 绑批档同拍落 `run.section3BlocksAtStart`。
- `test/RTM.md`：10-1 改写 ∥ 10-4 ∥ 故事 17 两行。
- 新建 `docs/batches/2026-10-27-advisor-face-fixes.test.mjs`（U-1–U-12，收口即删）。

**清单外（逐条理由，均为 §7 所要求的「夹具必须让该评审把 §3 写进批档」的落点）**：
1. `test/integration/batch-close-token-consume.test.mjs` —— RTM 10-1 改写与 10-4 新增的宿主；原夹具走 `docSetKey` 兜底形且 §3 无轮次块，门落地后「签发一枚槽」的前置不可达。改法：夹具改走 `batchDoc` 生产形 + 点火基线取自盘上块数 + 评审轮内写入一轮次块；**10-1 ∥ 10-2 的断言逐字未改**。
2. `test/integration/advisor-record-gate.test.mjs`（新建）—— RTM 17-1 ∥ 17-2 的宿主。

### 5.5 审计 / 评审轮次与终态

- **内部偏离审计（explore，1 轮）**：无部分实现、无静默简化、无越界改动；1 条 🔵 文档漂移（`test/integration/advisor-record-gate.test.mjs` 未进设计档 / §2.11 的受影响文件表）。
- **独立代码评审（advisor code，2 轮）**：轮次 1 = `changes-required`（7 条：1 🟡 must-fix · 3 🟡 · 3 🔵）；已修 3 条（恒定标记逐字化 + 证据另起一行 · 标记点名状态行写入通道 · 清点面兜底注释与实现自洽）；轮次 2 = **pass**（三条修正逐条 Fixed，新增 1 条 🔵：`证据：` 第三行未进设计档 §1.1 的逐字块）。
- **终态**：`stalled` —— 唯一未修的是评审轮次 1 的行 1（`batch.mjs:275` 模型面 `value` 描述仍把 §3 完成词写作旧字面 `评审完成`，而写入面词表只有 `评审通过`，写旧字面即词表外拒）。**未自行修**的理由：§2.1 与父侧派单把 `batch.mjs` 本批改动面限定为「私有正则 / 计数改取骨架导出」一处，改描述会越出该边界；已按 [上抛·待裁] 交父侧定夺（一字之改，建议本批顺手改或记账）。

### 5.6 披露（如实登记，逐条）

1. **U-7 ∥ U-8 ∥ 集成 10-1 · 10-4 · 17-1 的夹具自带 `section3BlocksAtStart`**——设计表的用例输入只写 `run = {designId, batchDoc, docSetKey}`；门落地后该字段是「点火基线」，生产由 `advisor.mjs` 在绑批档时读盘写入。夹具补该字段 = 复刻生产形；不补则等于「点火时档不可读」⇒ `batch-unreadable`。
2. **17-1 ∥ 17-2 的驱动面 = 结算函数 + spawn 门解析**（不是工具包装层 + 假端点的整链）——两轨（`advisor.mjs` / `advisor-settle.mjs`）调的正是同一函数；业务可观察结果（无 token / spawn 机械拒 / 补写后签发）逐条断言。若父侧要求走过工具层，需另建假端点夹具。
3. **行数实测 vs 设计预估**（口径 `split("\n").length − 1`）：`design-token.mjs` 268（预估 200 +34）· `design-slots.mjs` 305（预估 305 +18）· `batch-skeleton.mjs` 392（预估 ≈391）· `batch.mjs` 342（预估 343–349）· `advisor.mjs` 281（预估 260 +6）。四档产品码均未触 500 软线；`batch-lifecycle.mjs` 零改。
4. **设计档引用的一处读数源在本仓不存在**：§2.8 称行数口径与 `thincoder-core/test/core-hygiene.test.mjs` 同源，该档（含 `thincoder-core/test/` 目录）不在本仓 ⇒ 口径直接按 `split("\n").length − 1` 取。

### 5.7 父侧裁定后的补落（`batch.mjs:275` 描述词）

**父侧 2026-10-27 裁定**：本批顺手改。派单原先把 `batch.mjs` 限定为「私有正则 / 计数改取导出」一处，父侧自认「那个限定我下窄了」。

**理由**：本批刚把 §3 状态行从「记录用字」变成结算判据，让一处已知误导的模型面描述活到下一批，等于让下一批评审先白跑一轮。

**改动（一行）**：`thincoder-core/agent-tools/batch.mjs:275` 的模型面 `value` 描述，§3 完成词 `评审完成` → `评审通过`。

段白名单、写入语义、`ROUND_HEADING_RE` 那处改动一律未动。

**为什么原来那句会害人（判断力读数——真调工具面，非只读常量）**

夹具 = 骨架产出的临时批档（评审身份 ⇒ 写域 §3），经 `batchTool(path, {review:true}).execute()` 调用：

| 读数 | 调用 | 结果 |
|---|---|---|
| 旧字面写不进去 | `action=status, segment=§3, value=评审完成` | **拒**：`status value "评审完成" is not in the legal keyword set for §3 (进行中 / 评审通过)`；档字节零变 |
| 新字面放行 | 同夹具，`value=评审通过` | **通过**；§3 状态行落 `评审通过` |
| 描述与词表对齐 | 由 `STATUS_WORDS` 拼期望子句，与描述子句逐字比 | 改后 true；中和（描述临时改回旧字面）⇒ false；恢复 ⇒ true 且全文字节还原 |

⇒ 结论与父侧预判一致：旧字面**写不进去**，`batch-skeleton.mjs:49` 的「写侧词表零别名」注释与实现相符，不是注释说谎。

**单测**：`node --test docs/batches/2026-10-27-advisor-face-fixes.test.mjs` ⇒ 12 pass / 0 fail（描述改动无行为面，此跑为回归读数）。

**清单外面（如实上抛，未改）**：`docs/cli/requirements/READ-DATA-INTERFACE.md:19`（FR3）同携旧字面 `§3 评审完成`——需求档按 D1 归主 agent；本批边界只到 `batch.mjs` 一行。

**终态**：`clean`——§5.5 记的 `stalled` 唯一未修项即本条，现已落。

## §6 验证与收口（父代理）

### 6.1 交付核对（逐条 = §1.5 两条完成判据）

| # | 状态 | 判据 | 证据 |
|---|---|---|---|
| 1 | ✅ 完成 | 复现「判 pass 不写 §3 状态行」⇒ 结算点当场拒并点名；补写后同轮放行 | U-2 / U-3 / U-4（`docs/batches/2026-10-27-advisor-face-fixes.test.mjs`）· 判断力：中和判据 2 整段 ⇒ U-2/U-3/U-4 转红 |
| 2 | ✅ 完成 | 带 `batchDoc` 的评审结束后，`design-slots` 的「批」列显示批档 basename（不再 `—`） | U-7（生产形：`run.batchDoc` 优先 ⇒ 旁列 = 批档绝对路径、清点 `batch=fixture.md`）· U-8（兜底零回归）· 判断力：派生丢主源 ⇒ U-7 转红 |

**外加第三笔（父侧裁定后补落）**：`batch.mjs:275` 的模型面 §3 值枚举 `评审完成` → `评审通过`。判断力三读：旧字面真调写入面 ⇒ 拒（`is not in the legal keyword set for §3 (进行中 / 评审通过)`，档字节零变）· 新字面放行 · 描述与 `STATUS_WORDS` 逐字对齐（中和后转 false，恢复后 true 且字节还原）。

### 6.2 实跑读数

```
node --test docs/batches/2026-10-27-advisor-face-fixes.test.mjs   → 12 pass / 0 fail
node --test test/integration/batch-close-token-consume.test.mjs   →  3 pass / 0 fail
node --test test/integration/advisor-record-gate.test.mjs         →  2 pass / 0 fail
node --test test/integration/batch-close-gate.test.mjs            →  4 pass / 0 fail
node --test test/integration/batch-gates-reanchor.test.mjs        →  7 pass / 0 fail
node --test test/integration/batch-ledger-bind.test.mjs           →  3 pass / 0 fail
node --test test/integration/batch-anchor-create.test.mjs         →  2 pass / 0 fail
node --test test/integration/batch-live-batch-lock.test.mjs       →  6 pass / 0 fail
node --test test/integration/ledger-close-proof.test.mjs          →  1 pass / 0 fail
node --test test/integration/review-doc-scope.test.mjs            →  5 pass / 0 fail
node --check × 5 档 → 全过
```

**判断力（七处中和，每处转红后按哈希确认原样还原）**：判据 2 整段作废 ⇒ U-2/U-3/U-4；判据 1 永不触发 ⇒ U-5/U-9/**U-12**；基线缺失分支作废 ⇒ U-10；读失败吞成空档 ⇒ U-10；派生丢主源 ⇒ U-7；清点面兜底不共用派生 ⇒ U-7；轮次块计数恒 0 ⇒ U-1/U-2/U-3/U-4/U-7/U-11。**U-6 ∥ U-8 ∥ U-11 在任何中和下保持绿 —— 零回归与射程边界该有的样子。**

### 6.3 文档门

`DOC-CHECK GATE: PASS`（批档，0 命中）。

### 6.4 越段自报

**48 条悬空锚全在 §2（设计席）与 §3（评审席），裸档名 / 缺 `docs/core/` 前缀。** 我（主 agent）越段补前缀（两轮共 47 处替换，含不带反引号的形），**判定与结论一字未动**。理由：`append-only + 段白名单` 使两席结束后该段无人可写，而文档门会拦死收口。先例 = 今日前三批同款。

**同时记录一条机制读数（eng-coder 实测）**：`batch append` 自带的门回执为 `DOC-CHECK GATE: PASS（0 档）· 范围 0 档` —— **它对记录一档都没判**。上面这条只有显式跑 `doc_check(mode:"gate", docs=[批档])` 才暴露。**该读数已转台账。**

### 6.5 未决 / 转出（已记账）

| # | 项 | 去向 |
|---|---|---|
| 1 | 设计档五处待收（§1.1 逐字块第三行 · 受影响文件表缺两集成宿主档 · 四档 Δ 与实落量偏差 · `batchOf` 兜底行为未登记 · `:57` 未写明「旧字面等义」只用于读侧） | `#1846` |
| 2 | §3 状态行不携带轮次（pass 过一轮后再打回 ⇒ 下游 §5 写入门仍放行） | `#1845` |
| 3 | 需求档同携旧字面：`docs/cli/requirements/READ-DATA-INTERFACE.md:19`（FR3）写 `§3 评审完成` | 同批转出，见 `#1846` |
| 4 | `batch append` 内置门「范围 0 档」= 未判 | 本轮转台账 |

### 6.6 延期批复核

无延期批。

### 6.7 收口结论

**本批可收。** 两笔交付判据均以「中和 ⇒ 转红」证成（不是只跑绿）；12 个 U + 7 处邻批回归全绿；门在一处两轨生效（`advisor-settle.mjs` 零改）；文档门 PASS；§1–§6 全段有内容。

**用户可见结果**：评审「判 pass 但没把结论写进批档 §3」这件事，现在会在结算点当场被拒并点名 —— 不再等到实施席写 §5 才爆、让无关的人白干。批收口时的「消费本批凭证」也第一次真能认出本批（`design-slots` 的「批」列不再恒为 `—`）。
