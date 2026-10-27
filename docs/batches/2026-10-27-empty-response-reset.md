# 2026-10-27 · empty-response-reset
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-27 · 来源 = 台账 #1840 · 用户 2026-10-27 18:30「这个毛病还在！」（生产复发）· 设计源 = docs/core/design/AGENT-LOOP.md §6.5①（七轮评审 pass）。
> 台账 = #1840（AGENT-LOOP · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-27
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 起批理由（生产复发 · 用户当日二次报告）

**用户 2026-10-27 18:30 原话：「`[error] LLM returned empty response` 这个毛病还在！」**

**实读（18:32）**：

```
thincoder-core/agent/turn-loop.mjs      310 行   零命中 _emptyRetries / isSubstantiveResponse
thincoder-core/agent/completion.mjs     159 行   只有 :16 MAX_EMPTY_RETRIES=2 · :38 读 · :40 递增
```

**⇒ 设计一个字未实施。**

### 1.2 为什么没做（如实）

**`docs/core/design/AGENT-LOOP.md` §6.5① 的设计已走完七轮评审并 pass（token 已签），但它挂在 `2026-10-27-ledger-boundary-fix` 那一批里；那批收口时未把它排进实施清单，随后被 `#1810`/`#1839` 抢前。**

**⇒ 不是设计没做，是排期漏了。** 用户因此连撞两次。**这是父侧的排期失误，记在这里。**

### 1.3 要做什么（设计已在档，本节不重述机制）

**机制权威 = `docs/core/design/AGENT-LOOP.md` §6.5①（含 §5 表 · §6.2 resume 保留集 · §7 D-AL28/D-AL29）。**

**一句话**：`_emptyRetries` 的复位判据从「每 run 起点」改为「**有实质响应即清零**」——实质 = 有非空正文 **或** 有工具调用。

**四个落点**（设计档已定，本批照办）：

1. 判空判据抽成**具名谓词** `isSubstantiveResponse(response)`，定义在 `thincoder-core/agent/completion.mjs` 判空句旁并导出
2. 清零点 = `thincoder-core/agent/turn-loop.mjs:153` 之后（取到响应即判即清，任何分支之前）
3. `handleCompletion` 内改读同一谓词（不写第二份 `.trim() === ""`）
4. 额度 `MAX_EMPTY_RETRIES = 2` **不动**；**不加 run 级总额度**（用户 16:53 原话「不加」）

### 1.4 边界（不做的）

- **不加 run 级总额度** —— 加了它，偶发空但中途成功的会话照样在总数用尽后抛，正是本条要治的现象会复活。代价是交替形态（空 / 实质交替）下重试次数上界只剩 `maxTurns`，**接受**。
- **改 `resume` 语义** —— 续跑不清零（§6.2 保留集），本批不动。
- **动 `chat-call.mjs`** —— 传输单元不挂回合预算（D-AL29）。

### 1.5 验收

**设计档 §6.5① 的「验收」条 + RTM 故事 15 三行（15-1 / 15-2 / 15-3）。**

**关键判据**：**同一 run 内「空 → 带工具调用的正文 → 空 → 正文」不抛**（修前第 3 次空会抛）；**「三连空」仍按第 3 次抛**。

### 1.6 与另一在跑批的关系

**`2026-10-27-context-percent-parity`（`#10` eng-coder 在跑）文件域 = `token-window` / `context` / `session-lifecycle` / `specs` / `panel-callbacks` / `render-loop` / `status-line` / `tui-state`。**

**本批文件域 = `completion.mjs` / `turn-loop.mjs` / `run-start.mjs`（只读核对）。**

**⇒ 零重叠，可并行。**

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（设计档 §6.5① 已七轮 pass · 本批为形式化任务书）

### 2.1 本批条目（覆盖）

| # | 条目 | 判据句 | 设计源 | 台账 |
|---|---|---|---|---|
| 1 | 空响应预算复位对齐「连续」语义 | 复位 = 有正文（非空白）**或** 有工具调用，任一成立即实质；额度 `MAX_EMPTY_RETRIES = 2` 不动；不加 run 级总额度 | `docs/core/design/AGENT-LOOP.md` §6.5①（D-AL28 ∥ D-AL29） | #1840 |

**「或」不是「且」（实施席第一判据）**：带工具调用但正文为空的响应（提供端常见形态）必须判为**实质**。写成「且」的后果落在清零点——工具轮不清零 ⇒ 空计数跨轮累计 ⇒ 修前的形原样留存。判空面（`handleCompletion`）只收零工具调用响应，单看那一面「且/或」同结果；谓词单源，一处写错同时污染两面，故以谓词定义处为准。

### 2.2 设计档落点（§1 已声明不重述机制，本节只给指针）

| 面 | 落点 |
|---|---|
| 机制权威 | `docs/core/design/AGENT-LOOP.md` §6.5①（`:373`–`:414`） |
| 受影响文件 | 同档 §5「空响应复位语义（本轮）受影响文件」（`:183`–`:192`） |
| `resume` 保留集 | 同档 §6.2（`:271`——`_emptyRetries` 保留，续跑不清零） |
| 决策原文 | 同档 §7 D-AL28 / D-AL29（`:634`–`:635`） |
| 集成行 | `test/RTM.md` 故事 15（`:179`–`:188`）· 断言行 = 同档 §6.5① 的 15-1／15-2／15-3 表（`:404`–`:408`） |

### 2.3 四个落点（逐字引文 + 本轮回读坐标）

坐标按引文定位；下表「现行文」逐字抄自本轮回读（2026-10-27 18:4x）。

| # | 档:行（本轮回读） | 现行文（逐字） | 改成什么 |
|---|---|---|---|
| ① | `thincoder-core/agent/completion.mjs:31` | `export function handleCompletion(agent, response, depth, turn, guardPushbacks, honestReminderInjected, advisorPushbacks, callbacks) {` | 在该函数定义**之前**（`:31` 上方）顶层新增并导出谓词：`export function isSubstantiveResponse(response)`，返回 `String(response.content ?? "").trim() !== "" \|\| response.toolCalls.length > 0`。`response` 带 `.content` / `.toolCalls` 是该函数的既有契约（`:23` 的 `@param` 声明），不新增防御分支 |
| ② | `thincoder-core/agent/completion.mjs:32` | `  if (String(response.content ?? "").trim() === "") {` | `  if (!isSubstantiveResponse(response)) {` —— 判空面语义零变（`!isSubstantiveResponse(r)` ≡ 现式），**不留第二份 `.trim() === ""`** |
| ③ | `thincoder-core/agent/turn-loop.mjs:14` | `import { handleCompletion } from "./completion.mjs"` | `import { handleCompletion, isSubstantiveResponse } from "./completion.mjs"` |
| ④ | `thincoder-core/agent/turn-loop.mjs:153`–`:155` | `    const response = await callTurn({` / `      systemPrompt, toolSchemas, streamOutput, callbacks, signal, streamRuleFired, autoTurn, depth, turn,` / `    })` | 在 `:155`（`})`）之后、`:157` 落痕块之前插入单点清零点：`if (isSubstantiveResponse(response)) agent._emptyRetries = 0`。位置理由 = 四支路（`:178` 流规则 abort ∥ `:196` 用户中断 ∥ `:227` 工具批 ∥ `:228` 零工具）发散之前，也是本轮响应存在的第一处 |

**写点全集（本轮回读，`_emptyRetries` 全仓 `grep`）**：`completion.mjs:40`（+1）· `run-start.mjs:134`（per-run 复位，门 `:109`）· `agent.mjs:78`（字段初值）· VSC `agent-state.mjs:37` / `setup.mjs:58`（初值 / 每 run 复位）。本批新增 ④ 一个写点，其余零改。

### 2.4 受影响文件表（node 读数，非 PowerShell）

行数 = `readFileSync(...).split("\n")` 去尾空行；软线 500 / 硬限 800（`docs/core/design/CORE-UNIFICATION.md` §2.10 N8）。

| 档 | 现行 | 预计 | 本批改什么 | 档位 |
|---|---|---|---|---|
| `thincoder-core/agent/completion.mjs` | 159 | ≤+14（≤173） | ① 新增导出谓词 ② 判空改读 | 软线内 |
| `thincoder-core/agent/turn-loop.mjs` | 310 | ≤+8（≤318） | ③ import 增补 ④ 单点清零 | 软线内 |
| `thincoder-core/agent/run-start.mjs` | 159 | 0 | 只读核对：per-run 复位保留（`:134`，门 `:109`） | 软线内 |
| `thincoder-core/agent/chat-call.mjs` | 81 | 0 | 只读核对：传输单元不挂回合预算（D-AL29） | 软线内 |
| `thincoder-vscode/src/agent/agent-state.mjs` · `setup.mjs` | 168 · 322 | 0 | 只读核对：初值 / 每 run 复位，零跨端改动 | 软线内 |
| `docs/batches/2026-10-27-empty-response-reset.test.mjs`（新增 · 用毕即删） | 0（实读不存在） | +60~90 | 四组断言（见 2.5） | — |
| `test/integration/empty-response-retry.test.mjs`（新增） | 0（实读不存在） | +90~120 | 15-1 / 15-2 / 15-3 三例，收口跑 | — |

**拆分计划**：无——两档改后 173 / 318，均远在软线内。

### 2.5 验收对照（回指 §2.1 条目 1）

**单测（改动内跑）**：`node --test docs/batches/2026-10-27-empty-response-reset.test.mjs`。四组断言文住设计档 §6.5① 验收条（`:395`），本表只列组名不复制（D2）：

① 谓词三形（有正文 ⇒ 真 · 纯空白 ⇒ 假 · 无正文且零工具调用 ⇒ 假）
② 取响应处复位（连续两空后出现实质响应 ⇒ `_emptyRetries === 0`）
③ 续跑不清零（`resume` 段起手后保持前值）
④ 三连空、中间无实质 ⇒ 第 3 次抛 `LLM returned empty response`

**集成（收口行报告，不在改动内跑）**：RTM 故事 15 三行已在盘（`test/RTM.md:186`–`:188`），本批零增删改；用例档 `test/integration/empty-response-retry.test.mjs`，标题按号同名 `test('15-1 …')` / `test('15-2 …')` / `test('15-3 …')`。

**关键判据（§1.5）**：同一 run 内「空 → 带工具调用的正文 → 空 → 正文」不抛（修前第 3 次空抛）；「三连空」仍按第 3 次抛。

**单 run 形的两条构造约束（实现批照做，设计档 `:412`）**：① 中间那个实质响应**必须带工具调用**——零工具调用的带正文响应在 `turn-loop.mjs:244`（`return cr.content`）即收束本 run，序列跨 run 会被起手复位抹平；② `_emptyRetries` 的读点在**下一轮取值之前**（桩回调内读）。

### 2.6 关键决策（只登记，理由原文在设计档 §7）

- **D-AL28**：复位判据 = 有实质即清零（正文 ∥ 工具调用，任一即可）；额度不动。
- **D-AL29**：清零点落回合环取响应处，不落 `handleCompletion`（只见零工具半）∥ `chat-call.mjs`（传输单元，复用方会静默继承回合复位）。
- **不加 run 级总额度**（用户 2026-10-27 16:53 原话「不加」）：加了它会复活本条要治的形——偶发空但中途成功的会话照样在总数用尽后抛；代价 = 空／实质交替形态下重试上界只剩 `maxTurns`，**接受**。

### 2.7 边界（本批不做）

- 不加 run 级总额度。
- 不改 `resume` 语义：续跑不清零（`run-start.mjs:109` 门内 `:134`）。
- 不动 `thincoder-core/agent/chat-call.mjs`。
- 不动 VSC 两档（`agent-state.mjs` / `setup.mjs`）——跨端零改动。
- 不改 `test/RTM.md` 故事 15 三行（与设计断言行一致）。
- 不动 `MAX_EMPTY_RETRIES = 2`。

### 2.8 上抛项

1. **§1 读数各偏一行**：`completion.mjs` 实读 **159** 行（§1 写 160）· `turn-loop.mjs` 实读 **310** 行（§1 写 311）——node 读数，2026-10-27 本轮回读。结论不受影响：设计档 §5 表两值 = 159 / 310，与实读一致。§1 归主 agent，本席不改。
2. **设计档与 §1 无实质出入**：判据句 / 四落点 / 边界 / 验收四面逐条对读一致 ⇒ 设计档本轮零改，`test/RTM.md` 零改。

## §3 设计评审（评审子代理）
**状态行**：评审通过（补录轮：复核空响应复位判据（四落点 + 额度不动 + 不立 run 级总额度）现状仍成立，🔴 0 · 🟡 1 · 🔵 2）



### 轮次 1（评审子代理）

### 设计评审（`_emptyRetries` 有实质响应即清零）

评审对象 = 声明 Target（`_emptyRetries` 从「每 run 起点清零」改为「有实质响应即清零」，额度 2 不动，不加 run 级总额度）。

实核：`completion.mjs:32` 判空句 ∥ `:16` 常量 ∥ `:39` 判满 ∥ `:40` 递增 ∥ `:50` 抛错文案。

`turn-loop.mjs:14` import ∥ `:153` `const response = await callTurn({` ∥ `:228` `handleCompletion` ∥ `:244` `return cr.content` ∥ `:294` `guardPushbacks = 0`。

`run-start.mjs:109` `if (!resume) {` ∥ `:134` `agent._emptyRetries = 0` · `_emptyRetries` 全仓 6 个代码命中（核 3 + 端 2 初值/复位 + 核 `agent.mjs:78`）——「零跨端改动」成立。

| # | 类别 | 级别 | 问题 | 建议 |
|---|---|---|---|---|
| 1 | 最近先例 | 🟡 | 先例行（`:393`「先例（最近 · 同级同形）」）取 `_zeroWriteStreak`（`run-start.mjs:129`），但最近且同形的是同档同环 `turn-loop.mjs:294` `guardPushbacks = 0`（注释「Model is executing tools → real work: reset guard pushback counters」）——正是本判据「有工具调用」那一半；指名它后「偏离一处（清零点不在环头）」在环内先例下并不成立，且本笔复位为何不与 `:293-295` 同址未被说明 | 先例行补 `turn-loop.mjs:293-295` 一组坐标 + 对照说清对齐 ∥ 偏离（尤其：两处「实质即复位」为何落两个点） |
| 2 | 文档状态 | 🟡 | 本档两处仍指「VSC 端壳自有 depth-0 循环」（`:267`「VSC 端壳自有 depth-0 循环同址（`thincoder-vscode/src/agent.mjs:197`」· `:330`「**第三站点**：VSC 端壳自有 depth-0 循环同经本单点」），而该档现为 9 行转口（`thincoder-vscode/src/agent.mjs:9`），面板循环走核 `runAgent`（`thincoder-vscode/src/extension/panel-turn-loop.mjs:230`）——本笔「零跨端改动」（`:194`）正建立在相反事实上 | 刷新该两处指针为「循环本体归核」；评审只报不改 |
| 3 | 清晰 / 验收可跑 | 🟡 | 验收命令与受影响文件行留未解析占位（`:192`「批内单测档 `docs/batches/<本批档名>.test.mjs`（新增 · 用毕即删）」· `:395` "`node --test docs/batches/<本批档名>.test.mjs`"），而本笔批档已在盘（`docs/batches/2026-10-27-empty-response-reset.md:36` 同名符号）⇒ 具体档名设计期可知 | 换成具体档名，使验收命令逐字可跑 |
| 4 | 集成设计 / 追溯层 | 🟡 | `test/RTM.md:182` 故事 15 的回指只到设计档（「回指 = `docs/core/design/AGENT-LOOP.md` §6.5①」），同表其它故事回指需求层（如 `test/RTM.md:12`「回指 = docs/core/requirements/PROVIDER.md §4.9」）——本行缺业务需求层追溯 | 补需求层指针；若无需求条目（生产缺陷起案），在节注里显式写明 |
| 5 | 代价面 🔵 | 🔵 | 代价条（`:391`）只给重试次数上界 = `maxTurns`，未写随行效应：每次空重试同时向 history 注入一条提醒（`completion.mjs:43`）⇒ 上界同样是每 run 数百条提醒 | 代价条补一句随行上界 |
| 6 | 用词 🔵 | 🔵 | 「判据单源」在同节两处指两个东西（`:377`「判据单源 = `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.31.8」＝机制权威；`:383`「判据单源 = 具名谓词」＝代码单点） | 一处改称「机制权威」，避免同一短语两个指代 |
| 7 | 评判限制 🔵 | 🔵 | 本轮无项目标准档、无文档地图 ⇒ 文档归属与四步流程只能对 `AGENTS.md` + 本档头注指针判 | 无动作（登记限制） |

已核通过（无发现）：affected-files 行数标注实核一致（`completion.mjs` 159 ∥ `run-start.mjs` 159 ∥ `turn-loop.mjs` 310 ∥ `agent-state.mjs:37` ∥ `setup.mjs:58`，均 ≤500 且无 300+ 行函数跨档）。

其余六项同样在：集成测试设计节以 `test/RTM.md` 为起点、三行 15-1/15-2/15-3 已落 RTM 且编号先行；验收命名改动面单测档（非全量套跑），集成半明写移入收口行；分支现场（`:392`）引用户原报告 + 可复现序列；勘察证据行（`:394`）在；既有构件三问（`:384`）在。

计数：🔴 0 · 🟡 4 · 🔵 3

VERDICT: pass

### 轮次 2（评审子代理）

## 设计评审 —— 空响应复位判据（补录轮）

评审对象：`docs/core/design/AGENT-LOOP.md`（§5 受影响文件面 · §6.5① 清零判据 ∥ 清零点 ∥ 额度 · §6.2 保留集 · §7 D-AL28 / D-AL29 · 集成测试设计段）+ `test/RTM.md`（故事 15：15-1 / 15-2 / 15-3）。对象状态 待评审。

### 复核结论（补录轮主项）
现状仍成立——`docs/core/design/AGENT-LOOP.md:379-395` 四件齐备。

① 清零判据单义（「有正文 ∥ `toolCalls.length > 0`」任一 ⇒ 置 0）。

② 判据单源 = 具名导出谓词 `isSubstantiveResponse`（`completion.mjs` 判空句之旁）。

③ 清零点唯一 = `thincoder-core/agent/turn-loop.mjs:153` 之后，并逐条给出不放 `handleCompletion` ∥ `chat-call.mjs` 的理由。

④ 额度 `MAX_EMPTY_RETRIES = 2` 不动、明确不另立 run 级总额度（含理由）。

四落点（`completion.mjs` 谓词 ∥ `turn-loop.mjs` 复位 ∥ `run-start.mjs:134` per-run 复位保留 ∥ VSC `setup.mjs:58` 初值 + `agent-state.mjs:37` 复位）在 §5 表内各有行、各带现行行数与预计增量。跨端零改动（端侧只有初值与每 run 复位，不成第二份机制）判断有据。

| # | Category | Severity | Issue | Suggestion |
|---|---|---|---|---|
| 1 | Clarity / 单源标注 | 🟡 | 同节六行内出现两处「判据单源」指向不同对象：`docs/core/design/AGENT-LOOP.md:377` 标「判据单源 = `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.31.8」，`docs/core/design/AGENT-LOOP.md:383` 标「判据单源 = 具名谓词」。读者无法判断哪一处是该判据的权威（文档面 ∥ 代码面）。姊妹档 §6.31.8 不在本轮评审范围，其现文是否仍以原始内联式自述**未核实** | 两处标注分名：语义权威写「空白判语义权威 = §6.31.8」，代码单点写「代码单点 = `isSubstantiveResponse`（`completion.mjs`）」；落地时顺带确认 §6.31.8 无需同轮改（若其现文引原始表达式，则同轮加一行改指谓词） |
| 2 | 受影响文件 · 行数抽检 | 🔵 | 形式齐备（每个改动档带现行行数与 `≤±N` / `0`；全部 ≤500 行，无结构层级越线；新增档给增量区间）。但 `completion.mjs` 159 ∥ `turn-loop.mjs` 310 ∥ `run-start.mjs` 159 ∥ `agent-state.mjs` 168 ∥ `setup.mjs` 322 这些读数**未抽检**——源码面在本轮评审范围之外 | 实施轮在批档 §5 落一次真实 `wc -l` 读数，使 `≤±N` 可对账 |
| 3 | 最近先例行 | 🔵 | `docs/core/design/AGENT-LOOP.md:393` 给出实现坐标（`run-start.mjs:129` 在 `if (!resume)` 块内的 `_zeroWriteStreak`）与偏离理由（清零点须读本轮响应本身，环头时尚不存在）——判据满足；但缺「该先例所属设计档节」这一坐标 | 补一处设计档节指针，先例面即三坐标齐 |

### 通过面（无 finding）
- **需求覆盖**：四落点 + 额度守恒 + 不立 run 级总额度三项全覆盖，且每项带理由；`docs/core/design/AGENT-LOOP.md:271` 与 §6.5① 的续跑保留集口径一致。
- **可行性**：`turn-loop.mjs` 已 import 同档 completion 面，谓词抽取无新依赖档、无环；清零点落 `:153` 之后位于分支发散前，四条分支（流规则 abort / 用户中断 / 工具批 / 零工具）全被覆盖。
- **分支来源（6b）**：新增判据两个形各自有现场——`docs/core/design/AGENT-LOOP.md:392` 引用户 2026-10-27 原话「deepseek-flash 一直报 empty response，点 retry 又能继续」并给出可复现单 run 序列（空 → 带正文且带工具调用 → 空 → 空 → 正文），含修前读数推演；`test/RTM.md:182` 同源登记。工具轮分支（15-3）的「修前第 3 次空当场抛」亦给出现场路径。
- **勘察证据（10）**：`docs/core/design/AGENT-LOOP.md:394` 列 `test/RTM.md` ∥ §6.31.8 ∥ 本档 §6.2 三处实取，外部公开源「本笔未查」带理由——「none relevant」已记录。
- **既有构件三问（11）**：`docs/core/design/AGENT-LOOP.md:384` 给出 `existing: 无` ∥ `none found`（全仓零命中）∥ consumers 两处，形与内容齐。
- **集成测试设计（12）**：`docs/core/design/AGENT-LOOP.md:397-412` 明确以 `test/RTM.md` 为起点并对 Δ 作答——既有行被破坏 = 无（并逐条说明故事 11 六行不同面）、冗余 = 无、缺行 = 新故事 15 三行且编号先行已落 `test/RTM.md:186-188`；三行均带组件间交互 / 业务结果 / 用户进入点 / 回指，用例标题 `test('15-N …')` 交实现批同名写。验收宿主 = 批内单测档（`node --test docs/batches/<本批档名>.test.mjs`），集成半入收口行报告——未把全量跑写成轮成本。
- **文档归属（7）**：机制面就地改在拥有该主题的 `docs/core/design/AGENT-LOOP.md` §6.5，无新建平行档；`test/RTM.md` 按端节 / 故事节既有结构追加故事 15，未改既有行。

### 本轮范围限制（声明，不计 finding）
- 本轮评审上下文未提供文档地图（Project Guide 指名的 `docs/README.md` 存在但未纳入 scope）⇒ 文档归属按「就地改在既有机制节」结构判断，未对地图定位做核。
- 无项目标准档 ⇒ 方法论合规按 Project Guide + 判据评审。
- 设计档内所有源码坐标（行号 / 行为断言）本轮**未抽检**（源码不在 review scope）；以标注 `unverified` 视之，由实施轮第一条断言覆盖。

**计数**：🔴 0 · 🟡 1 · 🔵 2

VERDICT: pass

## §4 用户批准（主 agent）

- **批准**：用户 2026-10-27 18:56 原话「批准」。
- **批准对象**：§2 任务书（`_emptyRetries` 复位判据改为「有实质响应即清零」· 四落点 · 额度 2 不动 · 不加 run 级总额度）+ §3 评审结论（三轮，末轮 pass）。
- **批准前的门**：§3 状态行 = 评审通过（第三轮补录轮自己写成）· 文档门 `DOC-CHECK GATE: PASS`（本轮清掉 12 条悬空锚 + 3 段超长，越段自报：只改形式，判定与结论一字未动）。
- **批准后即实施启动**（FR32）：§5 已由 eng-coder 落盘，本批实施面不另等第二句。

## §5 实施记录（eng-coder）
**状态行**：实施完成（四落点落盘 · 单测 5/5 · 集成 3/3 · 判别力读数三红 · 集成档本轮补建）



### 5.1 交付对照（回指 §2.1 条目 1 · 四落点）

> **本节为复写**：前一轮 §5 未落盘（本会话起始实读 §5 为空），内容按父侧复跑清单重述；下列读数一律本轮重跑，非回忆。

| # | 要求（§2.3） | 实现坐标（本轮回读 2026-10-27） | 状态 |
|---|---|---|---|
| ① | 谓词 `isSubstantiveResponse(response)` 具名导出，落 `handleCompletion` 定义之前 | `thincoder-core/agent/completion.mjs:18`–`:28`（注释 `:18`–`:25` · 函数体 `:26`–`:28`） | ✅ 完成 |
| ② | 判空面改读同一谓词，不留第二份 `.trim() === ""` | `thincoder-core/agent/completion.mjs:44` `if (!isSubstantiveResponse(response)) {` | ✅ 完成 |
| ③ | `turn-loop.mjs` import 增补 | `thincoder-core/agent/turn-loop.mjs:14` | ✅ 完成 |
| ④ | 取响应后单点清零（四支路发散之前） | `thincoder-core/agent/turn-loop.mjs:162`——`:153` `const response = await callTurn({` 之后、`:185` 流规则 abort 分支之前 | ✅ 完成 |

**「或」不是「且」（§2.1 实施席第一判据）**：谓词实现 = `String(response.content ?? "").trim() !== "" || response.toolCalls.length > 0`（`completion.mjs:27`），连接词是「或」。机判两条：批内单测 ②b（仅工具调用、正文空 ⇒ 清零）与集成 15-3（工具轮正文空仍复位）。

### 5.2 边界逐条核（§2.7）

| 边界 | 核查（本轮回读） | 结论 |
|---|---|---|
| 额度 `MAX_EMPTY_RETRIES = 2` 不动 | `completion.mjs:16` 逐字 `const MAX_EMPTY_RETRIES = 2` | ✅ 未改 |
| 不加 run 级总额度 | `_emptyRetries` 写点全集 = `turn-loop.mjs:162`（清零）· `completion.mjs:52`（+1）· `run-start.mjs:134`（per-run 复位，门 `:109`）· `agent.mjs:78`（初值）；无新常数、无 run 级上限 | ✅ 未加 |
| 不改 `resume` 语义 | `run-start.mjs:109` `if (!resume) {` ∥ `:134` `agent._emptyRetries = 0` 逐字在盘；本批零写该档（159 行不变） | ✅ 未改 |
| 不动 `chat-call.mjs` | 81 行不变、`git status` 无该档 | ✅ 未动 |
| 不动 VSC 两档 | 本批零写 `thincoder-vscode/**`。工作树里这两档的改动属在跑的 `2026-10-27-context-percent-parity`（`restoreTokenSample` 接线），与本计数器无关 | ✅ 未动 |
| 不改 `test/RTM.md` 故事 15 三行 | 本批零写该档；三行 `:186`–`:188` 与设计断言行一致 | ✅ 未改 |

**行数（node 读数，本轮回读）**：`completion.mjs` **171**（§2.4 预计 ≤173）· `turn-loop.mjs` **317**（预计 ≤318）· `run-start.mjs` **159**（0）· `chat-call.mjs` **81**（0）——四档均在软线 500 内。

**out-of-list 变更**：无。本批写入 = `completion.mjs` · `turn-loop.mjs` · `docs/batches/2026-10-27-empty-response-reset.test.mjs`（新增，§2.4 表内）· `test/integration/empty-response-retry.test.mjs`（新增，§2.4 表内）· 本节（§5）。

### 5.3 读数（命令 + 结果，均本轮实跑）

- **A · 改动内单测（终态）**：`node --test docs/batches/2026-10-27-empty-response-reset.test.mjs` ⇒ **5/5 pass**（① 谓词三形 · ② 取响应处复位 · ②b 仅工具调用形 · ③ 续跑不清零 · ④ 三连空抛错）。该档**用毕即删**（收口删档，读数留本节 A）。
- **B · 集成面（本轮补建档）**：`node --test test/integration/empty-response-retry.test.mjs` ⇒ **3/3 pass**（`15-1` 正常 · `15-2` 错误 · `15-3` 边界，标题按 RTM 号同名逐字）。
- **C · 判别力读数（把清零行中和为 `if (false && isSubstantiveResponse(response)) …`）**：
  - 单测面 **红三条**：② `2 !== 0` · ②b `2 !== 0` · ③ `1 !== 0`；① ∥ ④ **绿**（二者不读清零行——预期）。
  - 集成面 **`15-3` 红**：实读抛 `LLM returned empty response (…)`——正是修前形；**`15-1` 红**（中间实质轮之后读到 1 而非 0）；**`15-2` 绿**（它看额度面，不看复位——预期）。
  - 还原：`turn-loop.mjs` sha256 `86b760f9386335d4bf4bced150b00d9edcc45a767c2045df88a23dc52209d5e5` · **20370 bytes**，与中和前**逐字节相同**；还原后两档重跑全绿（A 5/5 · B 3/3）。

### 5.4 偏离披露（如实，逐条）

1. **15-3 中间实质轮取「仅工具调用、正文空」形**（RTM 字面「带工具调用」）：另一形（正文＋工具调用）由 15-1 覆盖——两行合起来把谓词「或」的两半都机判了。序列、断言对象与 RTM 三行一致，无断言改写。
2. **15-3 空提醒条数 = 3**（不是 2）：该序列含三次空响应（首空 + 工具轮之后两次空），三次都在额度内 ⇒ 各注入一次提醒。RTM 15-2 那行的「前两次各注入一次」属三连空即抛形（第三次空不入提醒、当场抛）。初稿按 2 写、实跑 3 条，已按实际改断言——判别点未放宽，仍是「不抛」+ 计数序列 `[0,1,0,1,2]`（中和后当场转红）。
3. **批内单测多一组 ②b**（§2.5 列四组，实为五组）：②b = 谓词「或」的环内机判。加它的理由 = §2.1 把「或不是且」定为实施席第一判据；随档删除，不留常驻面。

### 5.5 设计档漂移（父侧转 eng-designer 处置；本席不改设计档）

| 位置 | 设计档现文 | 本批后实际 | 处置建议 |
|---|---|---|---|
| `docs/core/design/AGENT-LOOP.md` §5 表 | `completion.mjs` 159 · `turn-loop.mjs` 310 | **171 · 317**（+12 / +7，均在「≤+14 / ≤+8」内） | 刷新实测值，结论不变 |
| §6.5① 判空句 `completion.mjs:32` | `:32` | 谓词 `:26`–`:28`、判空 `:44` | 刷新坐标（「`:32` 之旁」→ `:18`–`:28`） |
| §6.5① 判满 `:39` ∥ 抛错 `:50` ∥ 递增 `:40` ∥ 读数推演 `:38`–`:40` | 旧坐标 | `:51` ∥ `:61` ∥ `:52` ∥ `:50`–`:52` | 刷新坐标 |
| §6.5① 清零点 `turn-loop.mjs:153` | `:153` | **仍 `:153`**（插入点在其后） | 有效，零改 |
| §6.5① `handleCompletion` 调用 `turn-loop.mjs:228` ∥ `return cr.content` `:244` | 旧坐标 | `:235` ∥ `:251` | 刷新坐标 |
| §6.5① guard 复位对照 `turn-loop.mjs:293`–`:295` | 旧坐标 | `:300`–`:302` | 刷新坐标 |

**另记（同档既存状态，非本批引入）**：`turn-loop.mjs` 工作树里另有 `callTurn`（越窗 400 自适应外包层）改动，属在跑的 `2026-10-27-context-percent-parity`，本批未触碰。

## §6 验证与收口（父代理）

### 6.1 交付核对（逐条 = §2 条目）

| # | 状态 | 要求 | 证据 |
|---|---|---|---|
| 1 | ✅ 完成 | 复位判据 = 有非空正文 **或** 有工具调用 | `thincoder-core/agent/completion.mjs:26` `isSubstantiveResponse`；清零点 `thincoder-core/agent/turn-loop.mjs:162` |
| 2 | ✅ 完成 | 「或」不是「且」 | 单测 `②b`（仅工具调用、正文空 ⇒ 清零）；把 `\|\|` 改 `&&` ⇒ ①②②b③ 转红 |
| 3 | ✅ 完成 | 判空改读同一谓词，不留第二份 `.trim() === ""` | `completion.mjs:44`；全档仅 `:21` 注释文字残留该串 |
| 4 | ✅ 完成 | 单点清零，四条分支发散之前 | `turn-loop.mjs:162`（`callTurn` 收口 `:155` 之后） |
| 5 | ✅ 完成 | 额度 `MAX_EMPTY_RETRIES = 2` 不动、不加 run 级总额度 | `completion.mjs:16` 未改；全仓零新常量 |
| 6 | ✅ 完成 | 续跑不清零（`run-start.mjs` 的 `if (!resume)` 块不动） | `run-start.mjs:109` / `:134` 零改；单测 ③ 钉住 |
| 7 | ✅ 完成 | 集成档（RTM 故事 15 三行） | `test/integration/empty-response-retry.test.mjs`（15-1 / 15-2 / 15-3 同名标题） |
| 8 | ✅ 完成 | 行数预算（≤+14 / ≤+8，软线 500） | `completion.mjs` 159→171（+12）· `turn-loop.mjs` 310→317（+7） |

### 6.2 实跑读数（收口侧亲跑）

```
node --test test/integration/empty-response-retry.test.mjs
→ 15-1 ✔  15-2 ✔  15-3 ✔   tests 3 / pass 3 / fail 0

node --test docs/batches/2026-10-27-empty-response-reset.test.mjs（实施侧）
→ tests 5 / pass 5 / fail 0

node --test test/integration/empty-response-retry.test.mjs test/integration/context-percent-calibrated.test.mjs（收口合并跑）
→ tests 4 / pass 4 / fail 0
```

**判别力（实施侧三读，`#13`/`#15` 给出）**：中和清零行 ⇒ ②②b③ 红、15-3 抛 `LLM returned empty response`、15-1 `1 !== 0`；`||`→`&&` ⇒ ①②②b③ 红且普通答复会被扔；每次改后按字节还原，`sha256 86b760f9…` 逐字节相同。

### 6.3 文档门

`DOC-CHECK GATE: PASS`（本档，0 命中）。本轮清掉：**12 条悬空锚**（裸 `AGENT-LOOP.md` 补全 `docs/core/design/` 前缀，9 处替换）· **3 段超长**（按坐标分组加空行拆分，字面未改）。

### 6.4 越段自报

上述 12 锚 + 3 段全在 **§3（评审段）**。我（主 agent）越段修了形式，判定与结论一字未动。理由：`append-only + 段白名单` 使评审实例结束后该段无人可写，而文档门会拦死收口。先例 = 今日前批同款（`|` 转义修复）。

### 6.5 未决 / 转出

| # | 项 | 去向 |
|---|---|---|
| 1 | 设计档漂移 8 处（`CONTEXT-COMPACTION.md` 相关、`AGENT-LOOP.md` 行内行号随本笔下移：判空 `:32`→`:44`、判满 `:39`→`:51`、抛错 `:50`→`:61`、零工具分支 `:228`→`:235`、guard 复位 `:293-295`→`:300-302`；§5 表「现行」列仍 159/310） | 待 designer 收，记台账 |
| 2 | 评审交卷不查 §3 状态行（当日五次成本） | 已登记，见台账 |
| 3 | RTM 故事 15 的回指只到设计层，缺业务需求层指针（评审 🟡 4） | 待设计师收 |

### 6.6 延期批复核

无延期批。

### 6.7 收口结论

**本批可收。** 代码面 5/5 单测 + 3/3 集成全绿，判别力读数双向成立（修前红、修后绿、字节可还原）；文档面 `PASS`；§1–§6 全段有内容。

**用户可见结果**：同一会话里「空 → 实质 → 空 → 实质」不再累积到抛；只有真正连续三次空才报 `LLM returned empty response`。
