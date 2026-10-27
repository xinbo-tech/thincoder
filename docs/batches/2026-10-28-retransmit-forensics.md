# 2026-10-28 · retransmit-forensics
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-28 · 来源 = 用户 2026-10-28 00:18「合吧」—— 批准把 `#1833`（`tool_use` 响应丢弃后请求重发）与 `#1809`（400 后三次重发）合成一批查。父侧开批时已把两条都核到事实层（见 §1），本批因此从「查 bug」变成「结账 + 补验证」。。
> 台账 = #1855（TESTING · 归批）。前情 = 2026-10-28-doc-drift-sweep（进行中）∥ 2026-10-28-product-text-sweep（进行中）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-28
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 开批时父侧已把两条核到事实层（所以本批不是「查 bug」）

**用户批准的是「合成一批查」，但开批前的三小时里两条的性质已经查清 —— 一条是夹具缺陷（已修），一条是机制已退场（待复现）。**

#### `#1833` —— **不是产品 bug，是测试夹具的序号假设错了，且已修**

**逐字证据**（`test/integration/anthropic-tool-roundtrip.test.mjs:95-109`，现行文本）：

```
/**
 * 摘要请求的识别锚 = `SUMMARIZE_PROMPT` 首句（`thincoder-core/context.mjs:20` 起那段指令的唯一开局句）。
 * 压缩摘要在压缩前不存在，只能按**请求内容**认——不用序号：压缩随时可能插在某次对话之前，
 * 「第 1 个请求必是对话」这一序号假设曾把产品的红伪装成夹具的红（`#1833` 失真链）。
 */
const SUMMARY_SIG = "The conversation above is our work log so far"
```

**⇒ 机理：夹具原先按「第 1 个请求必是对话」认请求；而**压缩摘要请求可能插在对话之前** ⇒ 夹具把摘要请求当成对话请求派工具 ⇒ 后续判定全乱 ⇒ 3/3 红。产品侧的 `tool_use` 从未丢失。**

**⇒ 该修复已随 `8ed4bd04` 提交（新增 `SUMMARY_SIG` + `isSummaryRequest`，改按请求内容认摘要）。**

**⇒ 实测：`node --test test/integration/anthropic-tool-roundtrip.test.mjs` × 3 次 = 9/9 pass；全量集成 67/67。**

#### `#1809` —— 机制疑已退场，待复现

**原记录**：三次 400 各 +23,762 tokens（674,867 → 698,629 → 722,391）**≈ 一份 digest 报告**；400 判不可重试（`thincoder-core/provider/errors.mjs:37` 逐字 `if (status >= 400 && status < 500 && status !== 429 && !RETRYABLE_STATUS.has(status)) return true`）⇒ 不是 `requestWithRetry`，是**新开发送**；疑 digest/自动轮。

**⇒ 而 `#1850` 批（2026-10-27 收口）已把 digest 重投机制**整体退场**：`DA_RETRY_LIMIT` / `_daRetry` / `_daFailures` / `_daEmptyRounds` 删除，报告只投一次，未签收满 4 轮升级披露且**升级后零自动投递**（活码 0 命中，`67/67` 集成）。

**⇒ 所以「每次 ≈ 一份 digest 报告的新开发送」这条路径，机制上已不存在。**

### 1.2 本批要做的两件事

| # | 做什么 | 为什么不是「顺手核销」 |
|---|---|---|
| 1 | 给 `#1833` 的结账写**可复核的判据**（不是「现在绿了」） | 「绿」可以来自夹具改错方向 —— 要证的是**夹具的认法正确**：造一个「摘要在前」的请求序，夹具必须仍认得出对话请求 |
| 2 | 给 `#1809` 写**复现或判死的路径** | 「机制已退场」是推理，不是读数。要么造出 400 且观察不再重发，要么留下可执行的复现步骤给下一次 |

### 1.3 本批不做

- **不改** `test/integration/anthropic-tool-roundtrip.test.mjs` 的认法（除非 §1.2 第 1 项的用例证伪它）。
- **不动** `#1850` 已收口的 digest 面。
- **不碰** A 批（`2026-10-28-doc-drift-sweep`）与 B 批（`2026-10-28-product-text-sweep`）的文件。

### 1.4 链声明

**四步链全走**；§3 评审为核销前置（`thincoder-core/ledger-close-proof.mjs:54-55`）。本批以判据与验证为主，若 §2 结论为「无需改码」，§5 记「不适用」并在 §6 说明。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（fix 轮：§3 轮次 1 的 13 条已逐条处置——§6.3 拆两判据 ∥ §6.28 补先例与三问行 ∥ AC-2 ∥ AC-3 重写；无产品码改动）

### 2.1 本批条目（覆盖 = 2，逐条指回 §1.2）

| # | 条目 | 判据面（谁验、怎么验） |
|---|---|---|
| E-1 | `#1833` 结账判据：证明**夹具的认法**正确，而不是「现在绿了」 | 设计 `docs/core/design/PROVIDER.md` §6.28 → 探针 RB-1 / RB-2 |
| E-2 | `#1809` 判死或复现：给出可执行路径 | 设计 `docs/core/design/PROVIDER.md` §6.3（发送次数读法）→ 探针 RB-3 / RB-4 |

- **不在本批**（沿用 §1.3）：不改夹具认法的语义；不动 `#1850` 已收口的 digest 面；不碰 A 批 / B 批的文件。
- **需求层核查**：本批不新增需求条目、不改 Function Spec 五元素——判据面即台账两行的验收句（`#1833` 的 `resume_when` 与 `#1809` 的现象描述，原文见 §1.1）。核查结论 = 可设计，无需求上抛。

### 2.2 设计档落点

- **`docs/core/design/PROVIDER.md` §6.3（发送次数读法）**：拆成两处再发、各带前置条件——① 图像拒绝自愈：**T1 首撞** ∥ **T2 同态重复**（streak ≥ 1），两判据都要求历史含 image part（判据单源 = 同档 §6.26）② 越窗自适应：压一次 + 重发一次（机制单源 = `docs/core/design/CONTEXT-COMPACTION.md` §6.17）。并给三个可复核读数：普通 400 = 1 ∥ 越窗 400 = 3（回合请求 2）∥ 图像自愈 = 2。
- **`docs/core/design/PROVIDER.md` §6.28**：夹具段「回两个回合」收正为三态（`tool_use` / 文本 / 摘要）；识别按内容认、不按序号的害处；夹具本体位置与**搬迁范围**（搬哪几个符号）；覆盖现状；本轮补「先例与公开来源」块（最近先例 ∥ 夹具层级先例 ∥ 公开来源核查 ∥ 三问行）。
- **`test/RTM.md` delta = 三节皆「无」**：
  - **故事 1**（对话里用工具）：`#1833` 的红出在夹具的识别规则上，不在产品行为上；1-1 / 1-2 / 1-3 断言的三项业务结果一字未变。
  - **故事 11**（超窗守卫）：RB-4 借它的判据形（`test/integration/context-overflow-guard.test.mjs:162-163` 的 `compressCalls` ∥ `turnCalls` 分列，`:297` 的 `turnCalls === 2`），不改它的场景与断言。
  - **故事 18**（后台报告只投一次）：`#1809` 的解释面读的就是既有 18-1 已验的退场结果（`test/RTM.md:221`），本批不新增断言。
- **不补异常行**：`test/RTM.md:237-243` 的「异常与更正」更正的是**已交付行**；`#1833` 的 3/3 失真红从未落在已签行上（1-1 / 1-2 / 1-3 的对错判据没被迫改），故不补。
- **加行的取舍**：为夹具内部记账加一行集成用例 = 断言测试自己的账，不是业务可观察结果 ⇒ 不加；守卫走一次性探针 + 台账登记（见 2.7 U-1）。

### 2.3 机制设计

**D-1（E-1 · 夹具拆档，认法逐字不动）**

- 现状：夹具（假端点 + 摘要识别谓词）与三个场景同住 `test/integration/anthropic-tool-roundtrip.test.mjs`（实读 407 行）。
- 阻点：本套件配置的固定开销吃掉压缩线，压缩支不触发（三例各断言「零摘要请求」）⇒ 识别谓词在场景里**从不走真支**，而它又不可 import ⇒ 直接读不到。
- 设计：把夹具本体（`fakeAnthropic` + `isSummaryRequest` + `SUMMARY_SIG` + SSE 与块助手）**逐字**搬到 `test/integration/fixtures/anthropic-endpoint.mjs`，场景档改为 import。
- 边界：搬 = 逐字搬，语义零变；场景档只删本地副本、改 import，三例断言一字不改。不新建桩——新桩测的是副本，副本与真身会漂移。
- 先例与三问行落 `docs/core/design/PROVIDER.md` §6.28「先例与公开来源」（对齐 = `context-overflow-guard.test.mjs:162-163` 的请求分类计数；偏离 = 本节按请求内容认，不按调用相位标记）。

**D-2（E-2 · 判死 = 行为读数为判据，读码为清点）**

- ① **行为读数（主判）**：普通 400 ⇒ 上游回合请求恰 **1**；越窗 400 ⇒ 回合请求恰 **2**（RB-3 ∥ RB-4）。两次读数同时证明「计数器确实在数」与「普通 400 不重发」。
- ② **活码清点（旁证）**：四符号活码面 0 命中（AC-3）——该机制不在码里。
- ③ **再发路径清点（旁证）**：400 之后的发送面只有两处（§6.3 新行），各有前置条件。
- **复现清单**（下次观测到「400 后请求数 > 1」时按序查）：先判报文形态是否越窗 → 再判该会话历史是否含 image part（图像自愈支）→ 两者皆否 ⇒ `#1809` 机制回潮，按 §1.1 的 token 增量签名（每次 ≈ 一份报告量）比对。
- **未决面（`unverified`）**：`#1809` 那次会话的历史是否含 image part，本批无读数——所以「历史含图否」是复现清单的必查项，不是已排除项。

### 2.4 探针设计（一次性单测，收口删）

落点 `docs/batches/2026-10-28-retransmit-forensics.test.mjs`，跑法 `node --test <该档>`。

| 用例 | 输入 | 期望（读到的数） |
|---|---|---|
| RB-1 | 向真夹具依次发 [摘要请求体, 对话请求体] | 第 1 个 `summary === true` 且回文本；第 2 个 `summary === false` 且**回 `tool_use`**；`rejections` 空 |
| RB-2 | 同 RB-1，夹具派工具的条件临时改回序号形（`requests.length === 1`；现行形 = `:144` 的 `dialogueRequests === 1`） | RB-1 转红（对话请求只拿到文本）⇒ 判据有判别力 |
| RB-3 | agent 级：自备桩对每个对话请求回普通 400（报文非越窗、历史无图） | **回合请求**（`summary === false`）恰 **1**；run 抛出可见错误（文本含该 400） |
| RB-4 | 同 RB-3，报文改越窗形态 | **回合请求**恰 **2**（首 400 + 重试后 200）· 摘要请求恰 1 · 全部请求 3；用户拿到答复 |

- **计数的面写死 = 回合请求**，摘要请求单列——分类形照 `context-overflow-guard.test.mjs:162-163`（`compressCalls` ∥ `turnCalls`）。这同时回答「全部请求是 2 还是 3」：全部 = 3，回合 = 2。
- **桩对摘要请求的处置**：复用搬出的 `isSummaryRequest`（按内容认）·摘要请求回一段摘要文本、不计入回合请求。不新写判据。
- **AC-2 的中立化不碰产品常量**：`RETRYABLE_STATUS` 是 `thincoder-core/provider/rate.mjs` 的模块常量（`errors.mjs:10` 导入、`:37` 消费），无注入点；为一条探针给它加 setter 就是改产品码，违背 2.5「产品码 0」。改用**差分对照**：RB-3 ∥ RB-4 共用同一桩与同一计数器，RB-4 读到 2 即证该计数器在数，RB-3 读到 1 于是可信。
- **顺序**（收口前置）：§5 跑 AC-1 留读数 → 删探针档 → 收口（探针档在盘时收口被拒，判据 = `test/RTM.md:88` 7-4）。

### 2.5 受影响文件与测试覆盖

| 档 | 现行行数 | 预期 Δ | 说明 |
|---|---|---|---|
| `test/integration/fixtures/anthropic-endpoint.mjs` | 无 | 新 ~135（预估） | 夹具本体逐字搬入（**设计先行、本批 §5 落地**；`docs/core/design/PROVIDER.md` §6.28 的现在时描述的是本批目标形态，若最终不拆档该句同批回收） |
| `test/integration/anthropic-tool-roundtrip.test.mjs` | 407（实读） | −≈122 / +1 | 删本地副本 + 改 import；三例断言零改 |
| `docs/batches/2026-10-28-retransmit-forensics.test.mjs` | 无 | 新 ~110（预估） | 探针 RB-1–RB-4，收口删（零留存） |
| `docs/core/design/PROVIDER.md` | 1403（实读） | 本席已落 | 上一轮 1378 → 1386；本轮 +17（§6.3 一行拆九 ∥ §6.28 搬迁范围一段 ∥ 先例与公开来源块 ∥ 一段间空行） |
| 产品码 | — | **0** | 无产品码改动 ⇒ §5 记「不适用」，由 §6 说明 |

### 2.6 验收对照（逐条指回 2.1）

| AC | 判据（机检） | 指回 |
|---|---|---|
| AC-1 | `node --test docs/batches/2026-10-28-retransmit-forensics.test.mjs` ⇒ RB-1–RB-4 全绿（4/4） | E-1 + E-2 |
| AC-2 | 差分对照：RB-2 改回序号形 ⇒ RB-1 红；RB-4 读到回合请求 2（计数器在数）而 RB-3 读到 1（普通 400 不重发）；恢复后全绿 | E-1 + E-2 |
| AC-3 | 四符号 grep 于**活码面** = `thincoder-core/**` ∥ `thincoder-cli/**` ∥ `thincoder-vscode/**` ∥ `thincoder-desktop/**` ∥ `thincoder-render-core/**` ∥ `thincoder-server/**` 的 `*.mjs` / `*.js`（排除 `node_modules` ∥ `dist` ∥ `build`）⇒ **0 行**。**排除面与理由**：记录面与设计档必然逐字列出四符号（本档 §1.1 ∥ §2.3），把 `*.md` 纳入判据则恒有命中、判据自相矛盾 ⇒ 判据只判活码面 | E-2 |
| AC-4 | `node --test test/integration/anthropic-tool-roundtrip.test.mjs` ⇒ **3/3 pass**（拆档后行为零变） | E-1 |
| AC-5 | `doc_check(mode:"gate")` 对 `docs/core/design/PROVIDER.md` ∥ 本批档 ⇒ PASS | 2.2 |

### 2.7 关键决策与上抛

- **K-1 搬真身，不造新桩**：新桩测的是副本，副本与真身同源漂移后读数全废。已排除的反面 = 在探针里造一条合成请求管线（约 30 行，成本更低）——那要重写识别规则，正是 §1.3 禁的改认法。
- **K-2 不为夹具认法立常驻集成行**：它是夹具内部记账，不是业务可观察结果；立行即「断言测试自己的账」。
- **K-3 判死以行为读数为判据**：读码是清点、是旁证，不是判据（改述理由：① 与 ③ 都是读码，判死唯一的读数是 RB-3 / RB-4）。
- **K-4 语义面零动**：认法逐字不动；digest 面零动（§1.3）。
- **K-5 中立化不碰产品码**：加注入缝 = 为一枚探针改产品码（见 2.4）；差分对照同样有判别力，且产品码保持 0。

- **U-1 [上抛·待裁]**：夹具认法自此无长期守卫。建议父侧记一行台账：`trigger=条件`，`resume_when` = 「下一次改动夹具、或再出现无解释的假红时」，判据 = 同一请求序（摘要在前）下首个非摘要请求拿到 `tool_use`。本席不立文件（K-2）、不写台账（子代理只读）。
- **U-2 [上抛·知会]**：设计档 §6.28 已如实写明该识别支在现行三例从不走真支。若评审判这构成「零用例面」并要求补常驻行，处置归父侧；本席判不补，理由 K-2。

### 2.8 本轮实测读数（处置依据，均为本席本轮亲跑）

- 四符号活码面：`DA_RETRY_LIMIT|_daRetry|_daFailures|_daEmptyRounds` 于六个源码目录的 `*.mjs` / `*.js` ⇒ **0 行**（命令见 AC-3）。
- `test/integration/` 实读 **19 档**，无 `fixtures/` 子目录；全仓 `*.mjs` 路径含 `fixtures` 者 **0**。
- `errors.mjs:10` 导入 `RETRYABLE_STATUS`（住 `rate.mjs`）、`:37` 消费 ⇒ 无注入点。
- `docs/core/design/CONTEXT-COMPACTION.md:707` = `### 6.17 请求预算单源（窗口 ∥ 实发 max_tokens ∥ 压缩线 ∥ 守卫）` ⇒ 越窗指针落这里。
- `context-overflow-guard.test.mjs:162-163` = `compressCalls` ∥ `turnCalls` 分列；`:297` = `turnCalls(s.stub).length, 2`。
- 行数：`test/integration/anthropic-tool-roundtrip.test.mjs` = 407 · `docs/core/design/PROVIDER.md` = 1403 · `test/RTM.md` = 252。

### 2.9 评审 13 条逐条处置

| # | 处置 | 落点 |
|---|---|---|
| 1 | AC-3 收窄到活码面，写明排除面与理由 | 2.6 AC-3 · 2.8 |
| 2 | §6.3 新行拆 T1 / T2 两判据，两者都要求历史含 image part | `docs/core/design/PROVIDER.md` §6.3 |
| 3 | 越窗指针改跨档形 `docs/core/design/CONTEXT-COMPACTION.md` §6.17 | 同上 |
| 4 | RB-4 写死计数面 = 回合请求（2）·全部请求 3；写明桩对摘要请求复用 `isSummaryRequest` | 2.4 |
| 5 | 不走产品常量注入缝；改差分对照（RB-4 证计数器在数） | 2.4 · 2.6 AC-2 · K-5 |
| 6 | K-3 改述为「行为读数为判据、读码为清点」；「历史含图否」列为复现必查项并记 `unverified` | 2.3 D-2 · 2.7 K-3 |
| 7 | 补先例行（最近先例 ∥ 夹具层级先例） | `docs/core/design/PROVIDER.md` §6.28「先例与公开来源」 |
| 8 | 补公开来源核查行 | 同上 |
| 9 | 补三问行（新夹具档 = `none found`；搬迁符号名不改） | 同上 |
| 10 | RTM 三节逐节写 delta（故事 1 / 11 / 18），并引 `test/RTM.md:221` | 2.2 |
| 11 | 确认「设计先行、§5 落地」；§2.5 该档现行行数已记「无」 | 2.5 |
| 12 | 明写「不补异常行」及理由 | 2.2 |
| 13 | 写明顺序：§5 跑 AC-1 留读数 → 删探针档 → 收口 | 2.4 末条 |

## §3 设计评审（评审子代理）
**状态行**：评审通过（轮次 3 核验：prior 16 条 = Fixed 13 · Unfixed 3（🔵 2 · 🟡 1，均非阻塞），新增 🔴 0）



### 轮次 1（评审子代理）

**设计轮评审（对象 = `docs/batches/2026-10-28-retransmit-forensics.md` §2 ∥ `docs/core/design/PROVIDER.md` §6.3 ∥ §6.28 ∥ `test/RTM.md`；不改任何档）**

| # | Category | Severity | Issue | Suggestion |
|---|---|---|---|---|
| 1 | 验收 / Requirements | 🔴 | AC-3「四符号 grep 于 `*.mjs` / `*.js` / `*.md` ⇒ 0 行」不可满足：本档 §1.1 与 §2.3 D-2 ① 已逐字列四符号（`docs/batches/2026-10-28-retransmit-forensics.md:36` ∥ `:90`），`.md` 面恒有命中，「本席实测 0」与本档自述相矛盾 | 判据改为「活码面」范围（`thincoder-core/**` ∥ `thincoder-cli/src/**` 等源面），并显式写出排除面（记录面 ∥ 设计档）与排除理由 |
| 2 | Document ownership | 🔴 | 新增行 `docs/core/design/PROVIDER.md:99` 把图像拒绝自愈的前置条件写成「历史含 image part 且上一回合同类失败」；同档 §6.26 T1（`:1131`）规定首撞即愈（400 + 语义词 + 历史含图，不需 streak）⇒ 同一机制两处两种说法，且 D-2 ③ 正靠这句判 #1809 死 | 拆成两判据写（T1 首撞 ∥ T2 同态重复 streak ≥ 1，两者都需历史含图），或删括注只留「机制 = §6.26」 |
| 3 | Clarity（指针） | 🟡 | `docs/core/design/PROVIDER.md:99` 的「见 §6.17」按本档编号落到 §6.17 请求头装配（`docs/core/design/PROVIDER.md:722`）；越窗自适应的归主是另一档（`test/RTM.md:129` 回指 `docs/core/design/CONTEXT-COMPACTION.md` §6.17） | 按本档跨档惯例改写（`docs/core/design/PROVIDER.md:107` 的 `doc:…:§N` 形） |
| 4 | Clarity（可判性） | 🟡 | RB-4 期望「恰收 2 个请求（压一次 + 重试一次）」与它自称互证的 11-4a（`test/RTM.md:136`「压缩请求 1 · 回合请求 2」）不同数；且未说 RB-4 的桩是否复用搬出的 `isSummaryRequest` 应摘要请求——该点决定读数是 2 还是 3 | 写死「计数的面 = 回合请求」或「全部请求 = 3」，并写明桩对摘要请求的处置（复用谓词 ∥ 另给判据） |
| 5 | Feasibility（测试缝） | 🟡 | AC-2 要求「RB-3 侧临时允许重试 ⇒ RB-3 红」，但未给缝；`RETRYABLE_STATUS` 是模块常量（`docs/core/design/PROVIDER.md:96`），探针在不改产品码前提下无注入点 | 指名一个测试缝（模块级 setter 或参数覆盖 + `??` 默认回退，默认 null ⇒ 生产行为不变），并写恢复点 |
| 6 | Clarity（判死口径） | 🟡 | K-3 自述「判死靠计数，不靠读码」，其三层里 ①（四符号 grep）与 ③（再发路径清点）都是读码；③ 还断言 #1809 现象「不满足任一处的前置条件」，而该会话历史是否含图在评审面内无读数（`unverified`） | 改述为「行为读数为主判、读码为清点」，或补一条落得下读数的判据；「历史含图否」列为复现清单必查项 |
| 7 | Methodology（closest-precedent） | 🟡 | §2 与 `docs/core/design/PROVIDER.md` §6.3 ∥ §6.28 新增段均无先例行（先例坐标 + 对齐 ∥ 偏离理由） | 补一行：D-1 先例 = `test/integration/context-overflow-guard.test.mjs` 的 provider 桩 ∥ 同档 §6.27 的「夹具随 transport 档」形；D-2 先例 = §6.3 既有 400 分级行 |
| 8 | Methodology（survey-evidence） | 🟡 | 无 survey-evidence 行（查过哪些公开源档 ∥ 是否相关），而同档 §6.15 ∥ §6.17 均按惯例写了该行 | 补一行；结论即使是「无外部源文档可对位」也须落句 |
| 9 | Methodology（既有件三问） | 🟡 | 新名 `test/integration/fixtures/anthropic-endpoint.mjs` 与探针档名均无三问答复 | 逐名补 `existing:` ∥ `none found:` ∥ `existing but unusable:`；夹具目录是否已有同族件给出坐标或扫法 |
| 10 | Requirements（RTM delta） | 🟡 | §2.2 的 delta 只答了 `test/RTM.md` 故事 1；E-2 的读数借了故事 11（11-4a ∥ 11-4b）与故事 18（18-1），两者 delta 未落 | 三节逐节写 delta（本批全 = 无），并直接引 `test/RTM.md:221`（18-1）作 digest 面既有读数 |
| 11 | Note | 🔵 | `docs/core/design/PROVIDER.md:1329` 以现在时写夹具本体住新档，而 §2.5 记该档现行行数「无」 | 确认按「设计先行、§5 落地」收口；若最终不拆档，该句同批回收 |
| 12 | Note | 🔵 | `test/RTM.md:237-243` 的「异常与更正」面是否为 #1833 的 3/3 失真红补行，delta = 无 的决定里未表态 | §2.2 明写「不补异常行」及理由（1-1 ∥ 1-2 ∥ 1-3 既有结论未被迫改） |
| 13 | Note | 🔵 | 探针档与收口的先后未写死；`test/RTM.md:88`（7-4）表明该档在盘时收口被拒 | 写明顺序：§5 跑 AC-1 留读数 → 删探针档 → close |

**计数**：🔴 2 · 🟡 8 · 🔵 3

**限制声明**：无项目标准档、无文档地图（Document ownership 判据降级，按 `AGENTS.md` 与三档自述判）；设计引用的三个非 .md 源件不在评审文档面 ⇒ 其读数按 `unverified` 记，含 `test/integration/anthropic-tool-roundtrip.test.mjs` 的 407 行与「三例各断言零摘要请求」。`docs/core/design/PROVIDER.md` 的行数标注可复核：实读 1387 行（`wc -l` 计 1386）= 现行 1378 + 8，与 §2.5 一致。

VERDICT: changes-required

### 轮次 2（评审子代理）

**轮次 2 核验（只验 prior 表 13 条 + 校验设计对象变更后的自洽）**

| # | Orig# | File | Severity | Status | Notes |
|---|-------|------|----------|--------|-------|
| 1 | 1 | `docs/batches/2026-10-28-retransmit-forensics.md` | 🔴 | Fixed | AC-3 已收窄为活码面：六个源码目录的 `*.mjs` / `*.js`（排除 `node_modules` ∥ `dist` ∥ `build`），并写明「**排除面与理由**：记录面与设计档必然逐字列出四符号」（`:131`）——原「`.md` 面恒有命中」的自相矛盾消 |
| 2 | 2 | `docs/core/design/PROVIDER.md` | 🔴 | Fixed | 新行拆成两判据：「① **图像拒绝自愈**（机制单源 = §6.26）：两判据任一成立即重发一次——**T1 首撞**」（`:101`），T2 亦写明 streak ≥ 1 ∧ 历史含图；与同档 §6.26（`:1143` ∥ `:1144`）逐条同形 |
| 3 | 3 | `docs/core/design/PROVIDER.md` | 🟡 | Fixed | 越窗指针改跨档形：「② **越窗 400 自适应**（机制单源 = `doc:docs/core/design/CONTEXT-COMPACTION.md:§6.17`）」（`:103`），不再落到同档 §6.17 请求头装配 |
| 4 | 4 | `docs/batches/2026-10-28-retransmit-forensics.md` | 🟡 | Fixed | RB-4 写死计数面：「**回合请求**恰 **2**（首 400 + 重试后 200）· 摘要请求恰 1 · 全部请求 3」（`:108`）；桩对摘要请求复用搬出的谓词（`:111`）。与 11-4a（`test/RTM.md:136`「压缩请求 1 · 回合请求 2」）同数 |
| 5 | 5 | `docs/batches/2026-10-28-retransmit-forensics.md` | 🟡 | Fixed | 不再要产品常量注入缝，改「改用**差分对照**：RB-3 ∥ RB-4 共用同一桩与同一计数器」（`:112`）+ K-5（`:141`）⇒ 产品码保持 0，R6「默认不动产品」的约束不被破 |
| 6 | 6 | `docs/batches/2026-10-28-retransmit-forensics.md` | 🟡 | Fixed | K-3 已改述「**K-3 判死以行为读数为判据**：读码是清点、是旁证，不是判据」（`:139`）；`#1809` 会话「历史是否含 image part」列复现必查项并记 `unverified`（`:96-97`） |
| 7 | 7 | `docs/core/design/PROVIDER.md` | 🟡 | Fixed | §6.28 新增「**最近先例（夹具形态）**：`existing: test/integration/context-overflow-guard.test.mjs:162-163」（`:1351`）+ 夹具层级先例（`:1352`，对齐 ∥ 偏离各一句） |
| 8 | 8 | `docs/core/design/PROVIDER.md` | 🟡 | Fixed | 补「**公开来源核查**：本节不引入新的上游请求形态，无新增外部源」（`:1353`），并落下核查面（仓根 `test/integration/` 实读 19 档） |
| 9 | 9 | `docs/core/design/PROVIDER.md` | 🟡 | Fixed | 补三问行「**三问行（既有件核对）**：`test/integration/fixtures/anthropic-endpoint.mjs` = `none found`」（`:1354`），搬迁符号名不改亦写明 |
| 10 | 10 | `docs/batches/2026-10-28-retransmit-forensics.md` | 🟡 | Fixed | RTM delta 已逐节：「**`test/RTM.md` delta = 三节皆「无」**」（`:74`），故事 1 ∥ 11 ∥ 18 各一节，故事 18 引 `test/RTM.md:221` |
| 11 | 11 | `docs/batches/2026-10-28-retransmit-forensics.md` | 🔵 | Fixed | §2.5 该行已注「设计先行、本批 §5 落地」（`:119`）并写明不拆档时同批回收 |
| 12 | 12 | `docs/batches/2026-10-28-retransmit-forensics.md` | 🔵 | Fixed | 已明写「- **不补异常行**：」（`:78`）及理由（失真红未落在已签行上） |
| 13 | 13 | `docs/batches/2026-10-28-retransmit-forensics.md` | 🔵 | Fixed | 顺序已写死「- **顺序**（收口前置）：§5 跑 AC-1 留读数 → 删探针档 → 收口」（`:113`） |
| 14 | (new) | `docs/batches/2026-10-28-retransmit-forensics.md` | 🔵 | New: 行数标注与实读不符 | `:153` 记「`docs/core/design/PROVIDER.md` = 1403 · `test/RTM.md` = 252。」；本轮实读 `docs/core/design/PROVIDER.md` = 1408 行、`test/RTM.md` = 263 行（`read` 行号口径）⇒ 漂移 5 ∥ 11 行；§2.5 的「1403（实读）」同病。处置 = 刷新两处读数（若 +5 是计数后又有改动，注一句时序即可） |
| 15 | (new) | `docs/core/design/PROVIDER.md` | 🟡（可选，不阻塞） | New: 陈旧读数与本档自述互斥 | `:1359`「无 `integration/` 目录 ⇒ 集成集 0 例，本表 3 例为其首批」——与同节 `:1347`（落点 = 仓根 `test/integration/` 常驻档、由 `test/run.mjs` 单层 glob 收集）及 `test/RTM.md:5`（本表只登记仓根集成用例）互斥，RTM 已列数十行集成用例（1-1..19-2）。处置 = 该行为批前旧文，本批改过本节 ⇒ 顺带改正读数 |
| 16 | (new) | `docs/core/design/PROVIDER.md` | 🔵（可选） | New: 同节两处写同一触发 | `:101` 已写 T1 ∥ T2 两判据，而 `:110`「- **400 图像语义 = 剥除自愈（非「立抛」）**」仍按 T1 单判据复述（带让位句「触发 / 处置全文 = §6.26」）⇒ 只读 `:110` 会漏 T2。处置 = `:110` 改指新行或将 T2 并入一句 |

**计数**：prior 13 条 = Fixed 13（🔴 2 + 🟡 8 + 🔵 3 全数处置，逐条对读现文）；本轮新增 🔴 0 · 🟡 1（可选）· 🔵 1 + 🔵 1（可选）。

**限制声明**：本仓无项目标准档、无文档地图（Document ownership 判据降级）；三个非 .md 源件不在评审文档面 ⇒ 其读数按 `unverified` 记（含 AC-3 的「活码面 0 行」与 `test/integration/anthropic-tool-roundtrip.test.mjs` 的 407 行）。

VERDICT: pass

### 轮次 3（评审子代理）

**轮次 3 核验（对象 = `docs/batches/2026-10-28-retransmit-forensics.md` §2 ∥ `docs/core/design/PROVIDER.md` §6.3 ∥ §6.26 ∥ §6.28 ∥ `test/RTM.md`；三档本轮全文重读，只验轮次 2 的 16 条，不改任何档）**

| # | Orig# | File | Severity | Status | Notes |
|---|-------|------|----------|--------|-------|
| 1 | 1 | `docs/batches/2026-10-28-retransmit-forensics.md` | 🔴 | Fixed | `:131` 现文「四符号 grep 于**活码面** = `thincoder-core/**`」并写明「**排除面与理由**：记录面与设计档必然逐字列出四符号」⇒ 原「`.md` 面恒有命中」的不可满足判据消 |
| 2 | 2 | `docs/core/design/PROVIDER.md` | 🔴 | Fixed | `:101` 现文「两判据任一成立即重发一次——**T1 首撞**」，T2 亦写明 streak ≥ 1 ∧ 历史含 image part，与同档 §6.26 `:1143` ∥ `:1144` 逐条同形 |
| 3 | 3 | `docs/core/design/PROVIDER.md` | 🟡 | Fixed | `:103` 越窗指针改跨档形，机制单源指向 `docs/core/design/CONTEXT-COMPACTION.md` §6.17，不再落到同档 §6.17 请求头装配 |
| 4 | 4 | `docs/batches/2026-10-28-retransmit-forensics.md` | 🟡 | Fixed | `:108` 写死「**回合请求**恰 **2**（首 400 + 重试后 200）· 摘要请求恰 1 · 全部请求 3」，与 `test/RTM.md:136`（11-4a「压缩请求 1 · 回合请求 2」）同数 |
| 5 | 5 | `docs/batches/2026-10-28-retransmit-forensics.md` | 🟡 | Fixed | `:112` 改用「差分对照」（RB-4 读到 2 即证计数器在数）+ `:141` K-5：不为一条探针给 `thincoder-core/provider/rate.mjs` 的模块常量加注入缝，产品码保持 0 |
| 6 | 6 | `docs/batches/2026-10-28-retransmit-forensics.md` | 🟡 | Fixed | `:139` 改述「**K-3 判死以行为读数为判据**：读码是清点、是旁证」；`:96-97` 把「历史含图否」列为复现必查项并记 `unverified` |
| 7 | 7 | `docs/core/design/PROVIDER.md` | 🟡 | Fixed | `:1349-1352` 新增「先例与公开来源」块：最近先例 = `test/integration/context-overflow-guard.test.mjs:162-163`，夹具层级先例 = 同档 §6.27，对齐 ∥ 偏离各一句 |
| 8 | 8 | `docs/core/design/PROVIDER.md` | 🟡 | Fixed | `:1353` 落「**公开来源核查**」行：结论 = 无新增外部源，核查面 = 仓根 `test/integration/` 实读 19 档 + `fixtures` 路径零命中 |
| 9 | 9 | `docs/core/design/PROVIDER.md` | 🟡 | Fixed | `:1354` 落「**三问行（既有件核对）**」：`test/integration/fixtures/anthropic-endpoint.mjs` = `none found` + 搬迁符号名不改 |
| 10 | 10 | `docs/batches/2026-10-28-retransmit-forensics.md` | 🟡 | Fixed | `:74-78` 逐节写 delta（故事 1 ∥ 11 ∥ 18），故事 18 直引 `test/RTM.md:221`（18-1 行） |
| 11 | 11 | `docs/batches/2026-10-28-retransmit-forensics.md` | 🔵 | Fixed | `:119` 注「设计先行、本批 §5 落地」并写明最终不拆档时该句同批回收 |
| 12 | 12 | `docs/batches/2026-10-28-retransmit-forensics.md` | 🔵 | Fixed | `:78` 明写「- **不补异常行**：」及理由（失真红未落在已签行上） |
| 13 | 13 | `docs/batches/2026-10-28-retransmit-forensics.md` | 🔵 | Fixed | `:113` 写死顺序：§5 跑 AC-1 留读数 → 删探针档 → 收口（判据 = `test/RTM.md:88` 7-4） |
| 14 | 14 | `docs/batches/2026-10-28-retransmit-forensics.md` | 🔵 | Unfixed | `:153` 仍记「`docs/core/design/PROVIDER.md` = 1403 · `test/RTM.md` = 252」；本轮实读 1408 ∥ 263 行 ⇒ 漂移 5 ∥ 11 行，未刷新（非阻塞） |
| 15 | 15 | `docs/core/design/PROVIDER.md` | 🟡（可选） | Unfixed | `:1359` 仍为「无 `integration/` 目录 ⇒ 集成集 0 例，本表 3 例为其首批」，与同节 `:1347`（落点 = 仓根 `test/integration/` 常驻档）及 `test/RTM.md:5` 互斥；未改（非阻塞） |
| 16 | 16 | `docs/core/design/PROVIDER.md` | 🔵（可选） | Unfixed | `:110` 仍按 T1 单判据复述（带让位句「触发 / 处置全文 = §6.26——本行不重述」），与 `:101` 的 T1 ∥ T2 并存；未改（非阻塞） |

**计数**：prior 16 条 = Fixed 13（🔴 2 · 🟡 8 · 🔵 3）· Unfixed 3（🔵 2 · 🟡 1——全部为非阻塞项，无处置理由）；本轮新增 🔴 0。

**限制声明**：三个非 .md 源件不在评审文档面（`test/integration/anthropic-tool-roundtrip.test.mjs` 的 407 行、`thincoder-core/provider/errors.mjs:37` 的判死行）⇒ 其读数按 `unverified` 记；本仓无项目标准档 ⇒ Document ownership 判据降级。

VERDICT: pass

## §4 用户批准（主 agent）

### 4.1 用户批准（2026-10-28 00:49）

**用户逐字**：「都批，自动跑完」—— 覆盖 A / B / C / D 四批的批准门（FR36 整批令）。

**⇒ 本批批准面 = §2.6 验收（AC-1…AC-5）+ 夹具拆档（`test/integration/fixtures/anthropic-endpoint.mjs`）+ 场景档改 import。产品码 0 改动，§5 记「不适用」。**

**⇒ 明确不在批准面内**：`#1809` 走哪条通道（RB-3 / RB-4 建在 OpenAI 形通道上，本批无读数覆盖，见 §6 未覆盖面）。

## §5 实施记录（eng-coder）

**状态行**：实施完成（内部核查两轮：探索审计 1 轮 = 实现面 0 偏差；代码评审 1 轮 6 条 → 本轮修 2 条，终态 clean）

### 5.1 交付内容（逐条指回 §2.1）

| # | 条目 | 落点 | 状态 |
|---|---|---|---|
| E-1 | `#1833` 结账判据：证**夹具的认法**正确，不是「现在绿了」 | 夹具拆档 `test/integration/fixtures/anthropic-endpoint.mjs`（新档 131 行）+ 探针 RB-1 ∥ RB-2 | ✅ Done |
| E-2 | `#1809` 判死：行为读数为判据 | 探针 RB-3 ∥ RB-4（同一桩面、差分对照） | ✅ Done |

### 5.2 改了哪几档（实际行数）

| 档 | Δ | 做了什么 |
|---|---|---|
| `test/integration/fixtures/anthropic-endpoint.mjs` | 新 131 行（预估 ~135） | 夹具本体逐字搬入：`jsonReply` / `sseReply` / `blocksOf` / `toolResultTexts` / `lastQuestion` / `replyText` / `messageStart` / `toolUseEvents` / `textEvents` / `SUMMARY_SIG` / `isSummaryRequest` / `fakeAnthropic` |
| `test/integration/anthropic-tool-roundtrip.test.mjs` | 407 → 289（−118） | 删本地副本、改 `import { fakeAnthropic }`、去掉不再用的 `node:http` import；三例断言一字未改 |
| `docs/batches/2026-10-28-retransmit-forensics.test.mjs` | 新 255 行（预估 ~110），**留读数后已删** | 一次性探针 RB-1–RB-4；按 §2.4 末条与 `test/RTM.md:88` 7-4，收口前删除，零留存 |
| 产品码 | 0 | 无产品码改动 ⇒ 本段记「不适用」，由 §6 说明（同 §2.5） |

**搬迁逐字性（机检，非自述）**：拿 `git show HEAD:` 的夹具块（118 行）与夹具档正文逐行比，唯一差异是 `SUMMARY_SIG` / `isSummaryRequest` / `fakeAnthropic` 三处加了 `export` 关键字（本档 12 行档头 + `node:http` import 是搬迁附带）。

### 5.3 验收读数（逐条对 §2.6，均为本席本轮亲跑）

| AC | 命令 / 读法 | 结果 |
|---|---|---|
| AC-1 | `node --test docs/batches/2026-10-28-retransmit-forensics.test.mjs` | **4/4 pass**（RB-1 / RB-2 / RB-3 / RB-4 全绿，733ms） |
| AC-2 | 同上（差分对照在用例内） | RB-2：序号形副本下 RB-1 的判据**转红**（对话请求零 `tool_use`，红在 `对话请求回 toolu_rb1 的 tool_use` 那句），且回读真身仍为按内容数 ⇒ 判据有判别力；RB-4 读到回合请求 **2**（计数器在数）而 RB-3 读到 **1**（普通 400 不重发）⇒ 两面都成立 |
| AC-3 | 四符号 `DA_RETRY_LIMIT|_daRetry|_daFailures|_daEmptyRounds` 扫六个源码目录的 `*.mjs` / `*.js`（排除 `node_modules` / `dist` / `build`） | **0 行 / 1107 档** |
| AC-4 | `node --test test/integration/anthropic-tool-roundtrip.test.mjs` | **3/3 pass**（1-1 978ms ∥ 1-2 827ms ∥ 1-3 3024ms，拆档后行为零变） |
| AC-5 | `doc_check(mode:"gate")` 对 `docs/core/design/PROVIDER.md` ∥ 本批档 | **PASS**（0 段命中，2 档全清） |

**RB 四例的读数原文（不是「绿了」，而是读到什么）**：

- RB-1：第 1 个请求 `summary === true` 且只回 text 块；第 2 个 `summary === false` 且回 `toolu_rb1` 的 `tool_use`；`rejections` 空。
- RB-2：同一请求序打给**序号形副本**，对话请求只拿到文本（零 `tool_use`）⇒ RB-1 的判据转红；真身零改（回读原分支串在位）。
- RB-3：普通 400 ⇒ 回合请求 **1**、摘要请求 0、错误浮出（文本含 `LLM API error 400` 与报文原串）。
- RB-4：越窗 400 ⇒ 回合请求 **2**（首 400 + 重试 200）、摘要请求 **1**、全部请求 **3**、用户拿到答复 `handled`。

### 5.4 决策披露（实现面的取舍，均非语义降级）

- **导出面 = 三符号**（`SUMMARY_SIG` ∥ `isSummaryRequest` ∥ `fakeAnthropic`）：§2.3 要求「搬」而未指定导出面；九个 SSE / 块助手留在档内私有，各有单点消费者。若后续有第二消费者，再逐个导出。
- **RB-2 的序号形改动落在夹具源码的临时副本上**（`mkdtemp` + 写副本 + 动态 import），不在真身上就地改再恢复：判据要证的是「若按序号认会怎样」，不是「仓库里改坏也能测」；副本形让 §2.6 AC-2 的「恢复后全绿」由构造满足，且夹具被重排时先断言靶点在位、当场给指向明确的红。
- **RB-3 ∥ RB-4 走 OpenAI 形通道**：`markContextOverflow` 全仓唯一落点在 `thincoder-core/provider/core.mjs:465`，越窗 typed 错误只在该通道产生；Anthropic 通道经 `thincoder-core/provider/retry.mjs:51` 的 4xx 门直接抛，不经越窗分类。
  **⇒ 读数覆盖面（`unverified`，须记明）**：`#1809` 那次会话走的是哪条通道，本批无读数；故 RB-3 只证「OpenAI 形通道上普通 400 不重发」，Anthropic 形通道的同形读数属未覆盖面（见 5.6）。
- **不为夹具认法立常驻集成行**（§2.7 K-2 沿用）：夹具内部记账不是业务可观察结果；守卫走一次性探针 + 台账登记（U-1）。

### 5.5 内部核查轮次与终态

- **探索审计（eng-coder 内部 spawn，只读）1 轮**：逐面对 §2.3 / §2.4 / §2.5 / §2.6 判——PARTIAL ∥ SILENT-SIMPLIFICATION ∥ OUT-OF-LIST 三类零发现；唯一实体项是设计档受影响文件行的陈旧读数（见 5.6 第 1 条），归属父侧。
- **代码评审（advisor type=code）1 轮 → 修 1 轮**：6 条（🟡 3 · 🔵 3），本轮处置两条并在改后重跑 AC-1（4/4）：
  - 已修：探针档头「两例共用同一桩与同一计数器」改为「同一桩实现与同一计数函数（各自一实例）」——原句对码不成立（每例各建一桩，`probeStub` 每例一次），差分对照的实质（同一谓词、同一计数面）不变。
  - 已修：RB-2 的两处 `.replace()` 之前先断言靶点串在夹具源里在位 ⇒ 夹具重排时红在手术点，不靠下游守卫兜。
  - 报告不改：§2.4 的 `:144` 是搬迁前坐标（现行形在夹具档：派工具条件一行），§2.5 / §2.8 的行数读数已漂（见 5.6 第 2 条），`test/integration/anthropic-tool-roundtrip.test.mjs` 首字节 U+FEFF 为**批前既有**（`git show HEAD:` 首字节同是 `ef bb bf`，非本轮引入，未动）。
- **终态：clean**（无未修的实现面问题；4 条报告项全部落在父侧 / 设计档一侧）。

### 5.6 报给父侧的漂移与待裁

1. **[上抛·知会] 设计档受影响文件行未同拍**：`docs/core/design/CONTEXT-COMPACTION.md:642` 仍记 `test/integration/anthropic-tool-roundtrip.test.mjs` = 407 行，实交 289 行。该档不在 §2.5 文件表内，按设计执行改不到它 ⇒ 归属父侧（或并入 A 批 `2026-10-28-doc-drift-sweep`）。
2. **[上抛·知会] 本批 §2 的行数读数已漂**：§2.5 / §2.8 记场景档 407（实交 289）、探针预估 ~110（实交 255）、夹具预估 ~135（实交 131）。§2 非本席笔域，读数以本段 5.2 为准。
3. **[上抛·知会] §2.4 的 `:144` 坐标已随搬迁失效**：那句指的是「夹具派工具条件」，现行位置在 `test/integration/fixtures/anthropic-endpoint.mjs` 的派工具分支行；按 `:144` 复跑会落到场景档的无关行。§2 非本席笔域。
4. **[上抛·知会] 设计档 §6.28「公开来源核查」行随本批落地变为不成立**：`docs/core/design/PROVIDER.md:1353` 现在时写「无 `fixtures/` 子目录」并「全仓 `*.mjs` 路径含 `fixtures` 者零命中」，本批起 `test/integration/fixtures/` 已在盘 ⇒ 与同节夹具位置句互斥。处置归父侧 / eng-designer（本席不改设计档）。
5. **[上抛·知会] AC-3 的判据面外有一处记录性命中**：四符号在 `test/integration/digest-empty-round.test.mjs:119` 的消息串里出现一次（`test/` 树不在 AC-3 判定的六源码目录内，判据不受影响）；复跑者若扫全仓会见到它，故记明。
6. **U-1（§2.7 已上抛，本席不动）**：夹具认法自此无长期守卫 —— 本席不立文件（K-2）、不写台账（子代理只读），请父侧按 §2.7 U-1 记 `trigger=条件` 行。
7. **`#1809` 的通道面未覆盖**：见 5.4 第三条。若父侧要覆盖 Anthropic 形通道，须另起一条读数（不在本批 §2.4 探针表内）。

### 5.7 收口顺序（按 §2.4 末条执行）

按「跑 AC-1 留读数 → 删探针档 → 收口」执行：本段读数在删档前取得；探针档 `docs/batches/2026-10-28-retransmit-forensics.test.mjs` 已删除，盘上零留存（收口门 7-4 不再拦）。两轮内部核查（审计 ∥ 代码评审）均在探针档在盘时进行 —— 即评审看到的是带探针的形态，删档后场景档与夹具档零改动。

## §6 验证与收口（父代理）

## 6.1 验证与收口（父侧 2026-10-28 00:5x）

### 6.2 交付对照

| # | 状态 | 条目 | 落地读数（父侧亲测，非引用） |
|---|---|---|---|
| E-1 | ✅ Done | `#1833` 结账：夹具认法可证 | `test/integration/fixtures/anthropic-endpoint.mjs` **132 行**（逐字搬，仅 `export` 三处不同）；场景档 407 → **290 行** |
| E-2 | ✅ Done | `#1809` 判死：行为读数 | 普通 400 回合请求恰 1 ∥ 越窗 400 回合请求恰 2（RB-3 / RB-4 实跑） |
| D-1 | ✅ Done | 夹具拆档 + 场景档改 import | import 三处；`node:http` 不再用已去 |
| D-2 | ✅ Done | 探针 RB-1–RB-4 留读数后删除 | `docs/batches/2026-10-28-retransmit-forensics.test.mjs` **已删（盘上零留存）** ✓ |
| §2.5 | ✅ 不适用 | 产品码 0 改动 | `git grep` 无产品码差分 |

### 6.3 机检读数（本轮实跑）

- 探针档已删（父侧 `fs.existsSync` 亲测）⇒ `test/RTM.md:88` 的 7-4 收口门不再拦。
- `doc_check(mode:"gate")` 三档 ⇒ **PASS · 0 段问题**。
- 两轮评审：changes-required（13 条）→ pass（第二轮判 pass 但未写 §3 状态行，重跑后签出）。

### 6.4 未覆盖面（如实，五条）

1. `docs/core/design/CONTEXT-COMPACTION.md:642` 仍记场景档 407 行（实交 290）—— 该档不在 §2.5 文件表，归父侧。
2. §2 的行数读数已漂（407→290；探针预估 ~110→实交 255；夹具预估 ~135→实交 132）。
3. §2.4 的 `:144` 是搬迁前坐标，现行派工具条件在夹具档内。
4. `docs/core/design/PROVIDER.md:1353` 的「无 `fixtures/` 子目录」随本批落地**变为不成立**，与同节夹具位置句互斥。
5. **`#1809` 走哪条通道无读数**：RB-3 / RB-4 建在 OpenAI 形通道（`markContextOverflow` 唯一落点 = `thincoder-core/provider/core.mjs:465`），覆盖该缺口须另起读数。

### 6.5 结算清单

- **§2 ↔ 设计档对账**：§2.6 五条验收逐条对现文，一致；§2.9 十三行处置表在。
- **前批遗留交叉核**：`#1833` 由本批结清（判据从「现在绿了」改为「夹具认法可证」）。
- **修正轮落地前提**：修正轮已落、复评 pass。
- **用户面同步**：无用户可见能力变化 ⇒ 一行「无」。
- **台账沉降**：`#1855` · `#1833`。**`#1857`**（夹具认法无长期守卫）已记、保持未结。
- **集成面**：RTM 故事 1 三行（1-1 / 1-2 / 1-3）语义未变，读数 3/3 绿。
