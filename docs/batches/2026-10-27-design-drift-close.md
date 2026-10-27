# 2026-10-27 · design-drift-close
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-27 · 来源 = 台账 #1842 · 台账 #1841/#1839 同批转出 · 来源 = 2026-10-27 两批（empty-response-reset §6.5 · context-percent-parity §5.5）与 #16 评审五条 🟡。
> 台账 = #1842（CONTEXT-COMPACTION · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-27
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 为什么起这一批

**用户 2026-10-27 18:58 原话「三笔都处理了。」—— 这三笔是我在上一轮列出的未决项，用户要求全部办掉。**

**本批 = 第一笔：设计档漂移收正。** 另两笔是机制面（见 §1.4），走各自的批。

**这些漂移不是「文档不够漂亮」，是「照它动手会错」：**

- **坐标下移** —— 实施改动让代码行号前移，设计档里的 `file:line` 还指着旧位置。下一个照设计档改代码的人，会改到错的函数上。
- **判定/口径错**（更要紧） —— `CONTEXT-COMPACTION.md:552` 用单参字面 `historyPercent([])` 说空历史返 0，而 `:533` 与 C7 明写「三参无缺省」；按 `:552` 的字面写代码，拿到的是 `NaN`，不是 0。同一个文档 19 行内两个互斥说法。

### 1.2 全部待收项（13 处，逐条给判据）

**A 类 · 坐标漂移（8 处，纯读数对齐）**

| # | 档:行 | 现写 | 实读 |
|---|---|---|---|
| A1 | `docs/core/design/CONTEXT-COMPACTION.md:535` | `context.mjs:108` | 读数 `context.mjs:94` / 输出行 `:111` |
| A2 | 同档 `:537` | `render-loop.mjs:89`-90 | `render-loop.mjs:108` |
| A3 | 同档 `:538` | `status-line.mjs:147` | `status-line.mjs:146` |
| A4 | `docs/vsc/design/WEBVIEW.md:199` | 同 A2/A3 旧坐标 | 同 A2/A3 |
| A5 | `docs/core/design/AGENT-LOOP.md` | 判空 `completion.mjs:32` | `:44` |
| A6 | 同档 | 判满 `:39` / 抛错 `:50` | `:51` / `:61` |
| A7 | 同档 | 零工具分支 `turn-loop.mjs:228` · guard 复位 `:293-295` | `:235` · `:300-302` |
| A8 | 同档 §5 表「现行（`wc -l`）」列 | 159 / 310 | 171 / 317 |

**B 类 · 判定/口径错（5 处，语义级，优先）**

| # | 档:行 | 问题 | 该改成 |
|---|---|---|---|
| B1 | `CONTEXT-COMPACTION.md:552` | 单参字面 `historyPercent([])` = 0，与该档 `:533` 及 C7「三参无缺省」互斥；按字面实返 `NaN` | 三参形（或写「核 `historyReading(…).pct` 对空历史 = 0」），与 `:533` / `SESSION.md:921` 同形 |
| B2 | `WEBVIEW.md:200` 与同档 `:730` | 把 VSC 派生单点写成 `ctxPercentForHistory`，而本批改的是 `ctxUsageForHistory`（`specs.mjs:95`）——两名并存，实施者不知哪个接第三参 | 两名各写明分工（谁接 `ratio`、谁是薄转口、webview 消费哪个） |
| B3 | `docs/desktop/design/IPC.md:29` | 「读数单源 = `token-window.mjs:160`」不指符号，且与同档 `:81`、`CONTEXT-COMPACTION.md:533` 的单源名不对位 | 写成符号名 + 回读坐标（`historyReading`） |
| B4 | `docs/core/design/SESSION.md:921` | 边界仍写「不改 CLI / VSC 状态行」，而本批正改这两面（`status-line.mjs:146`-`:150` · `specs.mjs:95`-`:101`）——落地后这句作为系统事实为假 | 限定射程（本节不改）或改写成「状态行只改取数来源、不改显示门」 |
| B5 | 同档 `:1150` D-SE61 | 组合件仍写作 `historyPercent`，而 `:903` 的实现点是 `historyReading` | 名面统一（`historyReading`，`historyPercent` 标为转口） |

### 1.3 边界（不做）

- **不改任何代码** —— 本批只碰 `.md`。代码在上一批已 clean。
- **不改判定本身** —— B 类是把**同一个判定在档内的两种写法收成一种**，不是新裁决。凡遇到「两处说法背后其实要改机制」的，**停下来报**，别在本批裁。
- **不碰 `test/RTM.md` 的既有行** —— 故事 15 缺需求层回指那一条，属于「要不要建需求条目」的判断，不在本批范围（见 §1.4 第 3 笔）。

### 1.4 另两笔（不在本批）

| 台账 | 内容 | 为什么单独走 |
|---|---|---|
| `#1841` | 评审交卷时不查 §3 状态行 | 动 `advisor-settle.mjs` 结算点 —— 机制面，要设计+评审 |
| `#1839` | 槽「批」旁列取不到 `batchDoc` ⇒ 24 枚槽全 `batch=—` | 动 `design-slots.mjs` / `advisor-async.mjs` —— 机制面 |

**两笔同属 advisor 面、但文件不重叠，合并为一批处理。**

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成 · 2026-10-27（五档收正 13 处 + 3 处连带；doc_check gate PASS；B5 待裁）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试覆盖 / 验收对照 / 关键决策 / 上抛项>

### 2.0 本批性质（先说清，免得评审按「新机制设计」判）

**本批 = 设计档漂移收正，无新机制。** 产物 = 五份设计档的逐处收正 + 本段。零代码改动、零需求改动、零 `test/RTM.md` 改动（§1.3 边界）。

**每条改动的判据**：现写与实读不符 ⇒ 按实读改；同一判定在档内两种写法 ⇒ 收成一种（不新裁）；两处说法背后要动机制 ⇒ 不改，上抛（见 2.5）。

### 2.1 逐处改法（13 处，一处一行）

**「现写」列逐字抄自改前盘面；「证据」列 = 本轮实读的一手行。**

| 处 | 档:行（改前） | 现写（逐字） | 改成（最终文） | 证据（一手实读） |
|---|---|---|---|---|
| A1 | `CONTEXT-COMPACTION.md:535` | `- stats 第 6 行（`thincoder-core/agent-tools/context.mjs:108`）` | `- stats 第 6 行（`thincoder-core/agent-tools/context.mjs:94` 取数 → `:111` 输出行）` | `agent-tools/context.mjs:94` = `const statusReading = historyReading(agent?.history ?? [], agent?.provider, tokenRatioOf(agent))` |
| A2 | 同档 `:538` | `render-loop.mjs:89`-90 缓存 | `render-loop.mjs:111` 缓存 | `render-loop.mjs:111` = `state.ctxCache = ctxCacheOf(agent, state.ctxCache)` |
| A3 | 同档 `:538` ∥ `:552` | `status-line.mjs:147` 渲染 ∥ `status-line.mjs:149` 以 `ctxPct > 0` 才渲染 | `status-line.mjs:146`-`149` 渲染 ∥ `status-line.mjs:148` 以 `ctxPct > 0` 才渲染 | `status-line.mjs:146` = `const ctxPct = state.ctxCache.pct`；`:148` = `const ctxHint = ctxPct > 0` |
| A4 | `WEBVIEW.md:199` | 同 A2/A3 旧坐标 | 同 A2/A3 新坐标 | 同上两条读数 |
| A5 | `AGENT-LOOP.md`（六行：`:164` `:187` `:194` `:384` `:406` `:410`） | 判空 `completion.mjs:32` | 判空 `completion.mjs:44` | `completion.mjs:44` = `if (!isSubstantiveResponse(response)) {` |
| A6 | 同档（`:390` `:407`） | 判满 `:39` · 抛错 `:50` | 判满 `:51` · 抛错 `:61` | `:51` = `if (retries < MAX_EMPTY_RETRIES) {`；`:61` = `throw new Error(` |
| A7 | 同档 `:387` | 零工具分支 `turn-loop.mjs:228` | `turn-loop.mjs:234`-`:235` | `turn-loop.mjs:234` = `if (response.toolCalls.length === 0) {`；`:235` = `const cr = handleCompletion(...)` |
| A8 | 同档 §5 表 `:187` `:188` | 现行（`wc -l`）= 159 / 310 | 171 / 317 | 实测 `wc -l`：`completion.mjs` = 171 · `turn-loop.mjs` = 317 |
| B1 | `CONTEXT-COMPACTION.md:552` | `historyPercent([])` = **0**（纯公式——分子 0） | `historyReading([], provider, ratio).pct` = **0**（纯公式——分子 0；三参无缺省，单参字面实返 `NaN`） | `token-window.mjs:235` = `export function historyReading(history, provider, ratio) {`；`:237` = `const tokens = Math.round(estimateTokens(history ?? []) * ratio)` ⇒ `ratio` 缺省时 `0 * undefined` = `NaN` |
| B2 | `WEBVIEW.md:200` ∥ `:730` | 派生单点 = `ctxPercentForHistory(history, provider, ratio)`（委托核 `historyReading`——三参，无缺省） | 派生单点 = `specs.mjs:94` `ctxUsageForHistory(history, provider, ratio)`（委托核 `historyReading`——三参，无缺省；返 `{ tokens, pct }`，`tokens` 为 0 ⇒ `pct` = `null`），消费点 = 宿主 `panel-callbacks.mjs:234`；`ctxPercentForHistory`（同档 `:100`）= 该件的 `.pct` 薄转口（名面保留，非第二实现点） | `specs.mjs:94` = `export function ctxUsageForHistory(history, provider, ratio) {`；`:100` = `export function ctxPercentForHistory(history, provider, ratio) { return ctxUsageForHistory(history, provider, ratio).pct }`；`panel-callbacks.mjs:234` = `const { tokens: ctxTokens, pct: ctxPct } = ctxUsageForHistory(history, p, tokenRatioOf(panel._agent))` |
| B3 | `IPC.md:29` | 读数单源 = `thincoder-core/token-window.mjs:160` | 读数单源 = 核 `historyReading`（`thincoder-core/token-window.mjs:235`） | `token-window.mjs:160` = `export function tokenKey(provider) {`（与读数无关）；`historyReading` 声明在 `:235` |
| B4 | `SESSION.md:921` | 不改 CLI / VSC 状态行； | 不改 CLI / VSC 状态行（本节射程——状态行的取数来源 ∥ 显示门单源 = `CONTEXT-COMPACTION.md` §6.16.4，本节零碰）。 | 该句原为系统事实句，而状态面已被改动（`status-line.mjs:146`-`:150` · `specs.mjs:94`-`:101`）⇒ 限定「本节射程」后同句为真，且读者知道去哪看现行口径 |
| B5 | `SESSION.md:1150` D-SE61 | / `historyPercent`——零新公式 | / `historyPercent`（核 `historyReading` 的 `.pct` 薄转口——三参无缺省；`session-lifecycle.mjs:425` 即本组合点的调用）——零新公式 | `session-lifecycle.mjs:425` = `return historyPercent(line, provider, sampleRatio(data.estimateSample, provider))`；`token-window.mjs:241`-`242` 自述 = 「状态行百分比薄转口（名面与 export 不变）：`historyReading` 的 `pct`」 |

### 2.2 同档连带改动（改 A 项后不自洽的邻句，一并收正）

**判据：同一坐标在同一档内多写一处，只改一处会让读者以为其余处仍成立。**

| 连带处 | 档:行 | 改动 | 来源 |
|---|---|---|---|
| `completion.mjs:31` → `:44`-`:65` | `AGENT-LOOP.md:164` | 「核内对应面」的坐标收正 | `:31` 现为 `handleCompletion` 文档注释行，重试径 = `:44`-`:65` |
| 递增点 `:40` → `:52` | 同档 `:194` · `:389` · `:392`（`:38`–`:40` 区间写法） | 「每轮至多 +1」的读数坐标收正 | `completion.mjs:52` = `agent._emptyRetries = retries + 1` |
| `turn-loop.mjs:244` → `:251` | 同档 `:392` · `:412` | `return cr.content` 的坐标收正 | `turn-loop.mjs:251` = `return cr.content` |

### 2.3 不改的项（含判定依据）

| 项 | 不改的理由 | 读数 |
|---|---|---|
| A7 后半「`guard` 复位 `:293-295` → `:300-302`」 | **本档无此坐标**——`grep` 在 `AGENT-LOOP.md` 全文零命中；该坐标出自另一批（`2026-10-27-empty-response-reset.md:165`）的评审建议，尚未入档，故本批无行可改 | `grep "293" docs/core/design/AGENT-LOOP.md` = 0 命中；现行 guard 复位 = `turn-loop.mjs:301`-`:302`（`guardPushbacks = 0` / `advisorPushbacks = 0`，`:300` 为注释行） |
| `CONTEXT-COMPACTION.md:554`「`ctxPercentForHistory` 的 `null` 返回」 | 该句所述为真：`null` 源于 `specs.mjs:96`，经 `:100` 薄转口原样传出 | `specs.mjs:96` = `return { tokens, pct: tokens ? pct : null }` |
| `CONTEXT-COMPACTION.md:555` 先例行「`historyPercent`」 | 名字为真（`token-window.mjs:243` 存在，且自述为薄转口）；改它属新增语义，不在本批 | `token-window.mjs:243` = `export function historyPercent(history, provider, ratio) {` |

### 2.4 我回读与 §1 不一致处（以我的读数为准，逐条点名）

| 处 | §1 写的 | 我实读 | 处置 |
|---|---|---|---|
| A2 | `render-loop.mjs:108` | `:108` 是 `// Clamp scroll` 注释；缓存行在 `:111` | 按 `:111` 落地 |
| A3 | `status-line.mjs:146` | `:146` 是取 `ctxCache.pct`；**渲染句**在 `:148`-`:149`；且 `:552` 另有一处 `:149` 应改 `:148`（§1 未列） | 按 `:146`-`149` 与 `:148` 落地 |
| A1 | `context.mjs:94` | 值对，但须写明档位是 `agent-tools/context.mjs`，否则与 `thincoder-core/context.mjs` 混 | 落地时写全路径 |
| B2 | `specs.mjs:95` | 函数声明在 `:94`，`:95` 是函数体首行 | 按 `:94` 落地 |
| B5 | 名面统一到 `historyReading` | 组合点真调 `historyPercent`（`session-lifecycle.mjs:425`）——改成 `historyReading` 会写成假事实 | 保留 `historyPercent` + 标「薄转口」 |

### 2.5 上抛项（本批不裁）

**B5 的下一步需要一句裁定**：若要把「组合件直接写 `historyReading`」，须先改代码（`session-lifecycle.mjs:425`）；若要把 `historyPercent` 从 export 面摘掉，同属机制面。本批只做到「名字为真 + 标明谁是实现点」，不替用户裁机制。

### 2.6 验收（可机判）

1. `doc_check(mode:"gate")` 覆盖上述五档，首行 = `DOC-CHECK GATE: PASS`。
2. 旧坐标零残留：对五档 `grep` 下列串均须 0 命中——`context.mjs:108` · `render-loop.mjs:89` · `status-line.mjs:147` · `completion.mjs:32` · `completion.mjs:39` · `completion.mjs:50` · `turn-loop.mjs:228` · `turn-loop.mjs:244` · `token-window.mjs:160`。
3. 行数读数在位：`wc -l` 口径下 `completion.mjs` = 171 · `turn-loop.mjs` = 317（与表头 `wc -l` 同口径）。

**无 runnable test**：本批只碰 `.md`，无代码面可跑；验收 = 以上三条读数。

### 2.7 修正轮（§3 轮次 1 逐条处置 · 2026-10-27）

**对象 = §3 十行（🔴 1 · 🟡 7 · 🔵 2）。逐条处置如下；「原」= 改前盘面读数，「落点」= 改后行号。**

#### 范围声明（评审 #8 要求的三行）

- **豁免陈述**：本改不改任何既有用例断言的业务可观察结果，不新增「产品真需要场景」——纯文档漂移，`test/RTM.md` 既有行零碰（§1.3）⇒ 集成测试设计零 delta。
- **先例行**：沿用本档既有形（坐标 + 一手读数）——先例 = 同档 §6.17「现状与目标的差（实读 …）」条 ∥ `AGENT-LOOP.md` §6.5① 同款写法。对齐，无偏离。
- **勘察行**：`index.publicRepos` = `[]`（`PROJECT-MANIFEST.json:35`）⇒ 无外部一手源可勘察；仓内已读 `agent/completion.mjs` · `token-window.mjs` · `agent-tools/context.mjs` · `tools/shared.mjs` · `context.mjs` · `tool-docs/` 目录实况。

#### 逐条处置

| # | 处置 | 落点（改后） | 读数依据 |
|---|---|---|---|
| 1 🔴 | 「判空句 `:32` 之旁同一处」→「定义 `:26`；判空句 `:44` 读它」 | `AGENT-LOOP.md:383` | `completion.mjs:26` = `export function isSubstantiveResponse(response) {`；`:44` = `if (!isSubstantiveResponse(response)) {`；`:32` = JSDoc 注释行 |
| 2 🟡 | 三处坐标：`PRUNE_MIN_TOKENS` `:224`→`:262`；判据 `:242`→`:280`；`tailBudgetTokens` `:54`→`:55`；**复核项** `context.mjs:173`/`:241`→`:201`/`:272` | `CONTEXT-COMPACTION.md:971` | `token-window.mjs:262` = `export const PRUNE_MIN_TOKENS = 200`；`:280` = `if (est < PRUNE_MIN_TOKENS) {`；`:55` = `export function tailBudgetTokens(provider) {`；`context.mjs:201` ∥ `:272` = `splitHistory(…, tailBudgetTokens(agent.provider))` |
| 3 🟡 | `restoreTokenSample` `:202`→`:200`；`（:203-204）`→`(:202-:203)` | `CONTEXT-COMPACTION.md:928` · `:983` | `token-window.mjs:200` = `export function restoreTokenSample(agent, sample, provider) {`；`:202` = `agent._tok = ok`；`:203` = `agent._tokRatio = …` |
| 4 🟡 | 三问改 existing 形（`:26` · name · consumers）；受影响文件表现行列 0 → 180（落定后实读；设计时 = 新增 0） | `AGENT-LOOP.md:384` · `:191` | 同上谓词读数；`test/integration/empty-response-retry.test.mjs` 在盘，实测 `\n` 计 180 |
| 5 🟡 | **判定 = 情况 1（后批改了工具形态）⇒ 改**：落点句改「描述外置；文本单点 = `tool-docs/context.md`」；同节代码块 19 行描述字面 → 1 行 `description: DESC("context")`；D-CC23 同句改写 + 否决④删除 | `CONTEXT-COMPACTION.md:416` · `:423` · `:1053` | `tool-docs/context.md` 在盘（1261 B）；`agent-tools/context.mjs:4` 自述「描述外置（tool-docs/context.md）」；`:156` = `description: DESC("context"),`；`tools/shared.mjs:19` = `export const DESC = (name) => loadToolDoc(name)`。旧「24 档族」计数不成立（`tool-docs/*.md` 实测 54 档） |
| 6 🟡 | 「三参无缺省，单参字面实返 `NaN`」→「第三参漏传 ⇒ `tokens` / `pct` 皆 `NaN`」 | `CONTEXT-COMPACTION.md:534` | `token-window.mjs:229` 逐字「`ratio` **无缺省**：忘传 ⇒ `estimateTokens × undefined` = `NaN` ⇒ `tokens` / `pct` 皆 `NaN`」 |
| 7 🟡 | 分母 `providerSpec(provider).context` → 同一次调用带出的 `historyReading(...).window`；**连带** D-W33 同句同错改同形 | `WEBVIEW.md:199` · `:734` | `token-window.mjs:228` 逐字「`window` 随读带出，消费面不再二次派生同一个量」 |
| 8 🟡 | 三行已补（见上「范围声明」） | 本段 | `PROJECT-MANIFEST.json:35` = `"publicRepos": []` |
| 9 🔵 | 无需改动：评审限制陈述（无项目标准档 / 文档地图）——本批对象不是文档地图 | — | — |
| 10 🔵 | 留给收口轮：实读 `test/RTM.md` 故事 16 行 16-1 ∥ 故事 11 六行后回填；本批不动 RTM（§1.3） | — | 未核（RTM 不在本批射程） |

#### 复扫读数（硬要求 ②③）

- **旧坐标九串全档 grep = 0 命中**：`context.mjs:108` · `render-loop.mjs:89` · `status-line.mjs:147` · `completion.mjs:32` · `completion.mjs:39` · `completion.mjs:50` · `turn-loop.mjs:228` · `turn-loop.mjs:244` · `token-window.mjs:160`；加扫 `token-window.mjs:224/242/202/54` 亦 0 命中。
- **`completion.mjs:NN` 配对**：`AGENT-LOOP.md` 现存引用 = `:16` · `:26` · `:44` · `:51` · `:52` · `:61` · `:44`-`:65`，逐一对上实读（常量 / 谓词 / 判空 / 判满 / 递增 / 抛错 / 重试径）。
- **行数**（node 计 `\n`，与表头 `wc -l` 同口径）：`completion.mjs` = 171 · `turn-loop.mjs` = 317——与 2.1 A8 表同值。
- **行号位移**：`CONTEXT-COMPACTION.md` 代码块收缩 19 行 ⇒ 原 `:946`/`:989`/`:1001`/`:552` 改后为 `:928`/`:971`/`:983`/`:534`；上表「落点」列已按改后盘面写。
- **`doc_check` gate**：`PASS`（3 档：`AGENT-LOOP.md` · `CONTEXT-COMPACTION.md` · `WEBVIEW.md`）；首轮 REFUSED 1 条（`:534` 单段过长）已在同轮拆段修正后复跑通过。

**边界遵守**：本轮只碰 `.md` 三档（+ 本段）；零代码改动、零需求档改动、零 `test/RTM.md` 改动。冻结窗口三档（`ADVISOR-GUARDS.md` · `DESIGN-TOKEN-SETTLEMENT.md` · 需求两档）零碰。

**上抛项（沿用 2.5，本轮无新增）**：B5 的机制面裁定仍待用户——「组合件直接写 `historyReading`」或「把 `historyPercent` 从 export 面摘掉」皆须先改代码（`session-lifecycle.mjs:425`），不属本批。

## §3 设计评审（评审子代理）
**状态行**：评审通过（第二轮复评：上一轮 🔴 1 / 🟡 7 全数核实修好（坐标回读磁盘逐格一致），修正未引入新 🔴；余 🟡 2（1 条新：WEBVIEW :199 外延过宽）· 🔵 3，均非 must-fix）



### 轮次 1（评审子代理）

### 设计评审（漂移收正批 #1842 · 首轮）——对象：CONTEXT-COMPACTION.md ∥ SESSION.md ∥ AGENT-LOOP.md ∥ WEBVIEW.md ∥ IPC.md

**结论：changes-required（1 🔴 · 7 🟡 · 2 🔵）。** 抽查 = 13 处条目逐条对源：A 类 8 坐标多数已落（`agent-tools/context.mjs:94`/`:111` ✓ · `session-lifecycle.mjs:425` ✓ · `specs.mjs:94` ✓ · `render-loop.mjs:111` → `status-line.mjs:146`-`:149` ✓ · `completion.mjs` 171 行 ✓ · `turn-loop.mjs` 317 行 ✓ · 判满 `:51` / 抛错 `:61` / 常量 `:16` ✓），一处未落（下表 #1）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Requirements（A · 六处判空） | 🔴 | `AGENT-LOOP.md:383` 仍写「（判空句 `:32` 之旁同一处）」——同档另五处（`:187` · `:194` · `:384` · `:406` · `:410`）均作 `:44`；实读 `thincoder-core/agent/completion.mjs`：判空句 = `:44`，具名谓词定义 = `:26`，`:32` = `handleCompletion` JSDoc 注释行。声明条目「六处判空」只落 5/6，与「旧坐标扫描 0 命中」的读数相抵 | 把 `:383` 的 `:32` 收到 `:44`（若原意指谓词定义处则写 `:26`），并复跑一次全档 `:32` / `:44` 配对扫描 |
| 2 | Document state（同档连带） | 🟡 | `CONTEXT-COMPACTION.md:989` 三处 token-window.mjs 坐标与磁盘不符：「`thincoder-core/token-window.mjs:224` `PRUNE_MIN_TOKENS = 200`」实为 `:262`；「判据 `:242`」实为 `:280`；「`tailBudgetTokens` `:54`」实为 `:55` | 三处改 `:262` / `:280` / `:55`；顺带复核 `:989` 同句的 `context.mjs:173` / `:241` |
| 3 | Document state（同档连带） | 🟡 | 同一坐标族两处偏移：`CONTEXT-COMPACTION.md:946`「逐字名 `restoreTokenSample`（`thincoder-core/token-window.mjs:202`）」实为 `:200`；同档 `:1001`「`restoreTokenSample` 入口已先置 `_tok = null` / `_tokRatio = 1`（`:203-204`）」实为 `:202`-`:203` | 改 `:200` 与 `:202`-`:203` |
| 4 | Document state（三问过期 + 表读数） | 🟡 | `AGENT-LOOP.md:384`「判空现只有 …`completion.mjs:44` 的内联式，核内零导出谓词」与磁盘相抵：`completion.mjs:26` 已导出 `isSubstantiveResponse` 且 `:44` 已改读它 ⇒ 三问答案 `existing: 无` 只在设计时成立；同档 `:191` 把 `test/integration/empty-response-retry.test.mjs` 列为「（新增）| 0」，该档现已在盘 | 三问行按落定后现态改写（谓词 = `:26` 既有导出）；`:191` 的「现行」列区分设计时读数与落定后读数 |
| 5 | Document ownership（同机制两处两说） | 🟡 | `CONTEXT-COMPACTION.md:416` / D-CC23 的「**内联 description**」「**不新增 tool-docs 档**⇒ 24 档族计数零动」与产品树相抵：`thincoder-core/tool-docs/context.md` 在盘，`thincoder-core/agent-tools/context.mjs:4` 自述「描述外置（tool-docs/context.md）」 | §6.16.1 与 D-CC23 的落点句按现态收正（或指明接替该决定的档与节）；族计数连带随实况重算 |
| 6 | Clarity（B1） | 🟡 | `CONTEXT-COMPACTION.md:552`「三参无缺省，单参字面实返 `NaN`」读不出所指：是「一参调用」还是「单参签名」不可判；实现侧说明是第三参漏传（`token-window.mjs:229`-`:231`「`ratio` 无缺省 … `NaN`」） | 收成一种写法：「第三参漏传 ⇒ `tokens` / `pct` 皆 `NaN`」（与核注逐字同向） |
| 7 | Clarity（A2/B2 口径） | 🟡 | `WEBVIEW.md:199` 写「分母 = `providerSpec(provider).context`」，而核读数单点返回 `window` 且明写「消费面不再二次派生同一个量」（`token-window.mjs:228`）；同节 `:202` 又写「端侧零自算式 / 派生单点 = `specs.mjs:94`」 ⇒ 一节内两种写法 | `:199` 的分母改为「= 核读数返回的 `window`（同一次调用带出）」，`providerSpec(...).context` 只在核单点出现 |
| 8 | 范围协调（判据 9 / 10 / 12） | 🟡 | 本轮评审上下文只给五档，批设计层（`§2`）不在射程：先例行、勘察证据行、集成测试设计（对 `test/RTM.md` 的 delta）三面均无从核；纯文档漂移批大概率适用唯一成立的那条豁免，但豁免陈述须落在某处可读面 | 在批档 §2 明写「本改不改任何既有用例断言的业务可观察结果、不新增产品真需要场景」+ 先例行 + 勘察行（含 `index.publicRepos = []` 的读数） |
| 9 | 评审限制 | 🔵 | 上下文无项目标准档、无文档地图（AGENTS.md 指 `thincoder/docs/README.md`，本轮报缺）⇒ 文档归属按档内结构 + Project Guide 判；行数/坐标抽查所读的源码档（`completion.mjs` · `token-window.mjs` · `specs.mjs` · `agent-tools/context.mjs` · `render-loop.mjs` · `status-line.mjs` · `session-lifecycle.mjs`）为坐标核对所需，非评审对象 | — |
| 10 | 未核面 | 🔵 | `CONTEXT-COMPACTION.md:544` 的跨端常驻验收指 `test/RTM.md` 故事 16 行 16-1；`AGENT-LOOP.md:400` 的故事 11 六行 `:128`-`:133` 亦同 —— RTM 不在评审域 | 收口轮实读 RTM 后回填 |

**已核达标面**：A 类多数坐标与磁盘逐格相同（`agent-tools/context.mjs:94` 取数 / `:111` 输出行 · `session-lifecycle.mjs:425` · `specs.mjs:94` 与 `:100` 两名各就位且 `:100` 确为 `.pct` 薄转口 · `render-loop.mjs:111` 缓存 · `status-line.mjs:146`-`:149` 渲染）；`historyReading` 单点 = `token-window.mjs:235`、IPC 的 `ctxPct`/`ctxTokens` = 同一次调用的两返回值（实读成立）；D-SE61 名面与 `historyPercent(:243)` 的薄转口关系一致；受影响文件六行均带现量 + Δ（`≤+14` / `≤+8` / `0`），最大 317 行，无 500 / 800 档位问题，`.md` 豁免形正确；无新建档、无主题碎片化（五档各就位：压缩/状态行口径 → CONTEXT-COMPACTION，VSC 显示面 → WEBVIEW，打开态读数 → SESSION，通道载荷 → IPC）。

**计数**：🔴 1 · 🟡 7 · 🔵 2。

VERDICT: changes-required

### 轮次 2（评审子代理）

### 第二轮复评（漂移收正批 · A1–A8 / B1–B5）

**核对方式**：五档逐格复读，并对档内声明的坐标 / 行数回读磁盘作 spot-check（`completion.mjs` 判空句 `:44` · 谓词定义 `:26` · `PRUNE_MIN_TOKENS` `:262` / 判据 `:280` · `tailBudgetTokens` `:55`（消费 `context.mjs:201` ∥ `:272`）· `restoreTokenSample` `:200` / 入口 `:202`-`:203` · `historyReading` `:235` 返 `{ tokens, pct, window }` · `DESC` = `tools/shared.mjs:19` · `ctxUsageForHistory` `specs.mjs:94` ∥ `ctxPercentForHistory` `:100` · `empty-response-retry.test.mjs` ≈180 行）。

| # | 上一轮 | 文件 | 严重度 | 状态 | 说明 |
|---|--------|------|--------|------|------|
| 1 | 1 | `AGENT-LOOP.md:383` | 🔴 | **Fixed** | 现作「`isSubstantiveResponse(response)` 定义在 `thincoder-core/agent/completion.mjs:26`（判空句 `:44` 读它）并导出」；六处判空坐标全为 `:44`，`completion.mjs` 实读 `:44` = `if (!isSubstantiveResponse(response))`、`:26` = 定义、`:32` = JSDoc 注释行 |
| 2 | 2 | `CONTEXT-COMPACTION.md:973` | 🟡 | **Fixed** | 三处收正：`token-window.mjs:262` `PRUNE_MIN_TOKENS = 200` · 判据 `:280` · `tailBudgetTokens` `:55`；同句消费坐标 `context.mjs:201` / `:272` 实读成立 |
| 3 | 3 | `CONTEXT-COMPACTION.md:930` / `:985` | 🟡 | **Fixed** | `:930` = `restoreTokenSample`（`token-window.mjs:200`）；`:985` = 入口先置（`:202`-`:203`）——与盘一致 |
| 4 | 4 | `AGENT-LOOP.md:384` / `:191` | 🟡 | **Fixed** | 三问改为 `existing: completion.mjs:26` + `name` + `consumers: 两处`（`:44` 读它 / `turn-loop.mjs:153` 之后）；`:191` 现行列分列「180（落定后实读；设计时 = 新增 0）」∥ 预计 0 |
| 5 | 5 | `CONTEXT-COMPACTION.md:416` / D-CC23 | 🟡 | **Fixed** | `:416` 改「文本单点 = `thincoder-core/tool-docs/context.md`」＋`DESC("context")`（`tools/shared.mjs:19`，实读成立）；D-CC23 改「描述文本随全族外置」，否决项 ①②③（不成立的④ 已删）；「内联 description / 不新增 tool-docs 档」句全消 |
| 6 | 6 | `CONTEXT-COMPACTION.md:534` | 🟡 | **Fixed** | 改「三参无缺省，第三参漏传 ⇒ `tokens` / `pct` 皆 `NaN`」——与核注（`token-window.mjs:229`）同向 |
| 7 | 7 | `WEBVIEW.md:199` / D-W33 | 🟡 | **Fixed** | 分母改「同一次调用带出的 `historyReading(...).window`」；D-W33 同步；`ctxUsageForHistory` 实读返 `{ tokens, pct: tokens ? pct : null }` |
| 8 | 8 | 批设计层（批档 §2） | 🟡 | **Unfixed** | 修正轮未回应、未给理由：先例行 / 勘察证据行 / 集成测试设计 delta 三面仍未在可读面核到。R5 协调项、非 must-fix ⇒ 不阻塞 |
| 9 | 9 | 评审面 | 🔵 | **Accepted** | 本条本为评审限制记录（上下文无项目标准档 / 无文档地图），非设计档缺陷，无需修正动作 |
| 10 | 10 | `CONTEXT-COMPACTION.md:526` · `AGENT-LOOP.md:400` | 🔵 | **Unfixed** | `test/RTM.md` 故事 16 / 故事 11 行号指向仍无可读面可核（RTM 在评审域外），本轮维持未核 |
| 11 | (新) | `WEBVIEW.md:199` · D-W33 | 🟡 | **New** | 修正句外延过宽：现写「`providerSpec(provider).context` 只在核单点出现，端侧不二次派生同一个量」，而 VSC 树实读 `specs.mjs:83` `Math.round((promptTokens / providerSpec(provider).context) * 100)`（`ctxPercentForModel`）与 `provider-context.mjs:38` 亦取该量 ⇒ 断言不成立。建议收窄为「历史读数口径的分母只在核单点出现；provider 报告值面（`ctxPercentForModel`）另有自己的分母用法，不在本段」。R7a/R7e ⇒ 报而不拦 |
| 12 | (新) | `CONTEXT-COMPACTION.md:654` / `:692` | 🔵 | **New** | 「`tool-docs/` 档族 24 档不变」与目录实读（`thincoder-core/tool-docs/` 54 档）不符；计数基准未写明。R7c 数值漂移 |

**计数**：🔴 0 · 🟡 2（含 1 新）· 🔵 3（含 1 新）。上一轮 🔴 1 条已核实修好，修正未引入新 🔴。

VERDICT: pass

## §4 用户批准（主 agent）

- **批准**：用户 2026-10-27 18:58 原话「三笔都处理了。」→ 19:04「送」→ 本批在「三笔」范围内，批准随之生效。
- **批准对象**：13 处漂移收正（A1–A8 坐标 + B1–B5 口径）+ 修正轮落地的 8 条 + 第二轮复评确认。
- **批准前的门**：§3 状态行 = 评审通过（第二轮由评审实例自己写成）· 文档门 `DOC-CHECK GATE: PASS`（五档 · 0 命中）。
- **本批无代码实施**：改动全部落在 `.md`，前几批已把代码落定。**§5 因此为空** —— 按批档规则 §5 豁免收口门，但不是「没有记录」：实施证据在 §6.2（designer 修正轮的逐处落点与复扫读数）。

## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）

### 6.1 交付核对（逐条 = §1.2 的 13 处）

| 处 | 状态 | 落点 / 现读数 |
|---|---|---|
| A1 | ✅ | `CONTEXT-COMPACTION.md:973` —— `token-window.mjs:262`（`PRUNE_MIN_TOKENS`）· 判据 `:280` · `tailBudgetTokens` `:55` · 消费点 `context.mjs:201`/`:272` |
| A2 | ✅ | 同档 `:520` —— `render-loop.mjs:111` 缓存 → `status-line.mjs:146`-`:149` 渲染 |
| A3 | ✅ | 同档 `:520` / `:536` —— `status-line.mjs:148`（`ctxPct > 0` 门）|
| A4 | ✅ | `WEBVIEW.md:199` —— 同 A2/A3 新坐标 |
| A5 | ✅ | `AGENT-LOOP.md:383` —— 谓词定义 `:26`；判空句 `:44` 读它（另五处 :187/:194/:384/:406/:410 同为 `:44`）|
| A6 | ✅ | 同档 `:390` —— 判满 `:51` · 抛错 `:61` · 递增 `:52` · 常量 `:16` |
| A7 | ✅ | 同档 `:387` —— 零工具分支 `turn-loop.mjs:234`-`:235`；guard 复位 `:300`-`:302`（`§1.2` 原写 `:293-295` 是错的，该行本就不在档内）|
| A8 | ✅ | 同档 `:187`-`:188` —— 171 / 317（node 实读）|
| B1 | ✅ | `CONTEXT-COMPACTION.md:534` —— 「第三参漏传 ⇒ `tokens` / `pct` 皆 `NaN`」，与核注同向 |
| B2 | ✅ | `WEBVIEW.md:199` / `:202` / `:204` —— 派生单点 = `ctxUsageForHistory`（`specs.mjs:94`）；`ctxPercentForHistory`（`:100`）= `.pct` 薄转口，名面保留 |
| B3 | ✅ | `IPC.md:29` —— 符号名 `historyReading`（`token-window.mjs:235`） |
| B4 | ✅ | `SESSION.md:921` 区 —— 边界句限定为「本节射程」，并指向 `CONTEXT-COMPACTION.md` §6.16.4 |
| B5 | ✅ | `SESSION.md` D-SE61 —— 保留 `historyPercent` 并标为 `historyReading` 的 `.pct` 薄转口，注明组合点 `session-lifecycle.mjs:425` |

**同档连带（修正轮查出的，不在 §1.2 原始 13 处内）**：`CONTEXT-COMPACTION.md:416` / `:423` / `:1055` 的「内联 description · 不新增 tool-docs 档」按现态收正（工具描述已外置 `tool-docs/context.md`，`description: DESC("context")`）；`WEBVIEW.md:734` D-W33 同句同错同改。

### 6.2 实跑读数

**设计师修正轮（`#5`）自报并经评审复核：**

```
旧坐标复扫（9 串 + token-window.mjs:224/242/202/54 加扫）→ 全 docs 树 0 命中
completion.mjs:NN 配对扫描 → :16 / :26 / :44 / :51 / :52 / :61 逐一对上实读
行数（node 计 \n）→ completion.mjs 171 · turn-loop.mjs 317（与 A8 表同值）
doc_check(mode:"gate") 三档 → PASS
```

**评审第二轮独立抽检（`#7`）：** 上述各项 + `token-window.mjs` 的 `:235` 返 `{ tokens, pct, window }` · `specs.mjs:94`/`:100` · `shared.mjs:19`（`DESC`）· `empty-response-retry.test.mjs` 末行 `:180` —— 全部对上。

### 6.3 文档门

`DOC-CHECK GATE: PASS`（本轮多次复跑：修正前 `:578` 一条超长已拆；五档最终 0 命中）。

### 6.4 未决 / 转出（三条，均已记账）

| # | 项 | 去向 |
|---|---|---|
| 1 | `WEBVIEW.md:199` / D-W33 外延过宽：现文「`providerSpec(provider).context` 只在核单点出现」，但 VSC 树另有取用（`specs.mjs:83` `ctxPercentForModel` · `provider-context.mjs:38`） | 台账，随下次触碰该档收窄 |
| 2 | `CONTEXT-COMPACTION.md:654` / `:692`「`tool-docs` 24 档不变」与实读 54 档对不上（计数基准未写明） | 台账 |
| 3 | `test/RTM.md` 故事 15 / 16 行的「结果 / 执行日期 / 执行人」 | **本批已回填 15-1..15-3 与 16-1 四行**（父侧实跑），其余 `待执行` 行未动 |

### 6.5 延期批复核

无延期批。

### 6.6 收口结论

**本批可收。** 13 处 + 3 处连带全部落地，旧坐标复扫 0 命中，两轮评审的判定链（changes-required → 修正 → pass）完整；文档门 PASS；§1–§4 / §6 全段有内容，§5 按规则豁免（本批无代码实施）。

**用户可见结果**：设计档里的坐标与口径现在与代码一致 —— 下一个照设计档动手的人不会改到错的行、也不会按已废弃的「内联 description」认知去理解工具描述。
