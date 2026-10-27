# 2026-10-28 · fixture-predicate-guard
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-28 · 来源 = 用户 2026-10-28 01:42 逐字「清，另外后续的活也干起来」—— 授权把账上余项推起来。本批只收台账 `#1857`（摘要请求识别谓词无长期守卫）。。
> 台账 = #1862（TESTING · 归批）。前情 = 2026-10-28-retransmit-forensics（已收口 2026-10-28）—— 夹具拆档落地处。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-28
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 本批范围（父侧 2026-10-28 01:4x）

**一条台账项：`#1857` —— 摘要请求识别谓词无长期守卫。**

### 1.2 缺口是什么（沿 `#1857` 的原判）

**`test/integration/fixtures/anthropic-endpoint.mjs` 里的 `isSummaryRequest` + `SUMMARY_SIG` 是 `#1833` 那次假红的根因修复**（夹具原本按**请求序号**认摘要请求，请求序一变就误判，把产品的红伪装成夹具的红）。

**⇒ 但现行三例**从不走真支**：三例各自断言「零摘要请求」，即压缩支在本套件配置下不触发。**

**★ 谓词若被改坏，没有任何一条用例会红。**

### 1.3 为什么现在做（而不是当初就立常驻用例）

**C 批收口时的判是「不立常驻用例」** —— 理由是「那是夹具内部记账，不是业务可观察结果」。那条判据仍然成立：**常驻集成用例只从两条长出来（真实业务场景 / 生产中真出现过的问题），它两条都不占。**

**⇒ 但「不立常驻集成用例」不等于「完全无守卫」。**

**★ 一旦夹具本体已拆成可 import 的独立档（C 批做的），一条**直驱断言**就成立了 —— 不启端点、不起流，只调谓词本身。**

**⇒ 这是单测面的活，不是集成面。**

### 1.4 本批要判的事

1. **谓词现在能不能被直驱调用**（`isSummaryRequest` 是否已 `export`、入参形态是什么）。
2. **一条最小断言够不够**：造「摘要请求形」⇒ 谓词真；造「普通对话形」⇒ 谓词假。
3. **这条断言放哪**：本批单测档（收口随批删）∥ 还是有长期宿主？**父侧倾向「本批单测档 + 收口删」，并把「谓词逻辑」本身当成 fixture 档的稳定面** —— 因为直驱一个纯函数不需要常驻件；真坏了，下一个动它的人会看见 diff。

**★ 若设计席判「必须常驻」，须给出宿主与理由**；按纪律，常驻件要有业务场景或生产问题支撑，不能只为「怕它坏」。

### 1.5 父侧定的边界

- **只碰测试面**（`test/integration/fixtures/anthropic-endpoint.mjs` 与新建的单测档），**不碰产品码**。
- **不改谓词逻辑本身**（除非发现它真的有 bug —— 那种情形停下上抛）。
- **不改场景档的三例断言**（那三例是 RTM 故事 1 的验收面，语义未变）。

## §2 批次任务与设计（eng-designer）
**状态行**：✅ 设计完成 2026-10-28（五形用例 · 设计档夹具段收正两段 · 集成索引零增量 · 无常驻守卫为已定取舍）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试覆盖 / 验收对照 / 关键决策 / 上抛项>

### 2.1 本批条目（覆盖）

| # | 条目 | 覆盖 | 本批交付 |
|---|---|---|---|
| 1 | 台账 `#1857`——摘要请求识别谓词无长期守卫 | 全部 | ① 一条直驱核对（批内单测档，零留存）；② 设计档收正「判别的输入必须是产物提示词本体」（`docs/core/design/PROVIDER.md` §6 夹具段） |

**不在本批**：场景档三例断言（语义未变，一字不改）· 谓词逻辑本身（现态正确，见 2.3）· 产品码 · RTM。

### 2.2 设计档落点

`docs/core/design/PROVIDER.md` §6「摘要请求的识别（夹具侧规则）」段，正文 `:1345`「覆盖现状」句后新增两段：① 判别的输入取自产物提示词本体；② 反支两形不得省。

**为什么不另起一档**：该夹具的设计单源已在这段（单源纪律）；另起一档 = 同一机制两处描述，两处会漂。

### 2.3 现状与可直驱性（本席实读 + 实跑读数）

- 谓词已导出、纯函数、无 I/O、无异步：`test/integration/fixtures/anthropic-endpoint.mjs:76`（`isSummaryRequest`）· `:73`（`SUMMARY_SIG`）。入参 = 请求体的 `messages` 数组 ⇒ **起端点、起流都不必要**。
- 夹具对每个请求都调它：`:104`（`body.messages` 非数组兜 `[]`）→ `:106`。
- 产物提示词在本仓、可直接 import：`thincoder-core/context.mjs:20` 的 `SUMMARIZE_PROMPT`（实测该档可被 node 直接 import，导出 `SUMMARIZE_PROMPT`）。
- **实跑基线（2026-10-28 设计轮，node 直驱，非推断）**：`SUMMARIZE_PROMPT.startsWith(SUMMARY_SIG)` = `true`；`isSummaryRequest` 六形读数 = 字符串形（真提示词）`true` · text 块形（真提示词）`true` · 普通对话 `false` · 末条只有 `tool_result` 块 `false` · `[]` `false` · SIG 只在更早消息 `false`。
- 结论：**一条直驱断言成立，不必起端点**；谓词现态正确，无 bug ⇒ 不触发「停下上抛」。

### 2.4 关键决策：输入取产物提示词本体（判别力所在）

若用例手抄一份 `SUMMARY_SIG` 当输入，判断者与判据是同一条字面 ⇒ 用例恒绿，提示词改了也看不出，等于自证。**输入取 `SUMMARIZE_PROMPT` 的实际导出** ⇒ 提示词一旦改写，用例当场红，红在真问题上（夹具认不出真摘要请求 = `#1833` 那类失真红的前置条件）。

### 2.5 用例表（批内单测档 `docs/batches/2026-10-28-fixture-predicate-guard.test.mjs`）

| # | 类 | 输入 | 期望 | 依据 |
|---|---|---|---|---|
| U-1 | 真支 | `[{role:"user", content: SUMMARIZE_PROMPT}]` | `true` | 真提示词直取（`thincoder-core/context.mjs:20`）· 主判别断言 |
| U-2 | 真支 · 另一种形 | `[{role:"user", content:[{type:"text", text: SUMMARIZE_PROMPT}]}]` | `true` | 夹具两形皆判（`test/integration/fixtures/anthropic-endpoint.mjs:78-81`） |
| U-3 | 反支 | 普通对话（`user:"hi"` + `assistant:"hello"`） | `false` | 谓词不得恒真 |
| U-4 | 反支 · 边界 | 末条 = `[{type:"tool_result", tool_use_id:"t1", content:"ok"}]` | `false` | 真实形态：工具回合请求走同一判定点（`:106`） |
| U-5 | 反支 · 边界 | `[]` | `false`，不抛 | `body.messages` 缺失时 `:104` 兜 `[]` 后仍调 `:106` ⇒ 真实可达 |

**不写的一形（有意）**：「SIG 只在更早消息、末条为普通问句 ⇒ false」。真实流量里 `SUMMARIZE_PROMPT` 只作为压缩请求的末条出现，`at(-1)` 与「任一消息含」两种实现都正确 ⇒ 断言它会钉死一种实现而不保护任何行为。

### 2.6 受影响文件与行数（node 实读，2026-10-28）

| 文件 | 现量 | Δ | 说明 |
|---|---|---|---|
| `docs/batches/2026-10-28-fixture-predicate-guard.test.mjs` | 新档 | ≈ +45 | 五例直驱，`node --test` 直达；**收口随批删**（零留存，`docs/core/design/TESTING.md` §3.5 门兜底） |
| `docs/core/design/PROVIDER.md` | 1408 → 1412 | +2 段（+4 行，已落） | §6 夹具段收正（2.2） |
| `test/integration/fixtures/anthropic-endpoint.mjs` | 132 | 0 | 谓词现态正确，零改 |
| `test/integration/anthropic-tool-roundtrip.test.mjs` | 290 | 0 | 三例断言一字不改 |
| `test/RTM.md` | 263 | 0 | 无行增 / 改 / 删（2.8） |

**命名**：单测档名 = 本批档 stem + `.test.mjs`（与 `docs/core/design/TESTING.md` §3.5 的最长前缀归属判据对齐）。

### 2.7 关键决策记录

| # | 决策 | 理由 | 被否方案 |
|---|---|---|---|
| D-1 | 守卫形态 = **批内单测档**（零留存，收口删） | 被守对象是夹具内部记账，不是业务可观察结果；常驻集成行须占「真实业务场景 / 生产真问题」两条入口之一，本项两条都不占——该判已写在 `docs/core/design/PROVIDER.md:1345` | ① 新建常驻集成行：无入口，立出来就是无场景的常驻件；② 把单测档当常驻件留着：单测档零留存是纪律（`docs/core/design/TESTING.md:55`），改名留存 = 同一件换名 |
| D-2 | 用例输入 = **产物 `SUMMARIZE_PROMPT` 本体** | 手抄 `SUMMARY_SIG` 让用例自证（2.4） | 手抄 SIG 造「摘要形」：恒绿 |
| D-3 | 夹具本体与场景档 **零 diff** | 谓词现态六形全对（2.3 实跑）；「不改工作正常的东西」 | 往夹具里加自检：夹具是测试资产，核对逻辑住用例档更可读、且不新增被测面上的活码 |
| D-4 | 判断力读数 = **中和后转红 + 逐字节还原** | 一条全绿的用例不证明它抓得住东西；本仓惯例即「中和 ⇒ 转红 ⇒ 还原」 | 只报「5/5 pass」 |

### 2.8 集成测试设计（从索引出发，答增量）

读 `test/RTM.md` 现状（19 节故事 · 263 行）：**本批零行增 / 零行改 / 零行删**。

理由 = 本批不改任何业务可观察结果：夹具本体零 diff（D-3）· 场景档三例断言一字不改 · 产品码零 diff ⇒ 故事 1 的 1-1 / 1-2 / 1-3 三行断言一字不动。

真支若将来要落常驻集成面，入口是「一段对话里压缩真的发生」这个业务场景；持有该断言的既有行在 `test/RTM.md` 故事 11（摘要请求恰 1，状态 `待执行`，宿主 `test/integration/context-overflow-guard.test.mjs`，不共用本夹具）—— 不属本批面，本批不为它加行、也不替它排期。

### 2.9 边界（本批不做）

- 不改谓词逻辑、不改 `SUMMARY_SIG`；发现真 bug 则停手上抛（**未发现**）。
- 不改场景档三例断言、不改产品码、不动 RTM。
- 不新建常驻用例；不把单测档转成集成件（两层永不互转）。
- 不给夹具加任何自检 / 断言机制。

### 2.10 验收对照

| AC | 判据（机检） | 回指 |
|---|---|---|
| AC-1 | `node --test docs/batches/2026-10-28-fixture-predicate-guard.test.mjs` ⇒ 5/5 pass | 条目 1 · 2.5 用例表 |
| AC-2 | 判断力：`isSummaryRequest` 中和为恒 `false` ⇒ U-1 / U-2 红；中和为恒 `true` ⇒ U-3 / U-4 / U-5 红；还原后夹具档 `sha256` 与改前逐字节相同 | 条目 1 · D-4 |
| AC-3 | `git diff --stat -- test/integration/fixtures/anthropic-endpoint.mjs test/integration/anthropic-tool-roundtrip.test.mjs` 无输出 | 2.9 边界 |
| AC-4 | 读数记入 §5 后删档；收口时 `ls docs/batches/*.test.mjs` = 0 件 | 零留存（`docs/core/design/TESTING.md` §3.5） |
| AC-5 | `doc_check(mode:"gate")` 对本批档 + `docs/core/design/PROVIDER.md` = PASS | 2.2 |

**集成半不在本批跑**：集成集是收口门（父侧），本批的改面判据只有 AC-1（本批单测档）。

### 2.11 残余与上抛

- **残余（不阻塞）**：本批证明的是「今天判得对 + 提示词漂移会红」；单测档随批删后仍无常驻守卫，下一次改动者只看得见 diff。这是 `#1857` 的固有取舍（两条入口都不占），不是本批缺陷——若要常驻，须先有「压缩真的发生」那个业务场景落成集成行。
- **待裁项：无**。设计轮未撞上需求缺口 / 两处描述冲突 / 归属不清。

## §3 设计评审（评审子代理）
**状态行**：评审通过


### 轮次 1（评审子代理）

**评审范围**：`docs/batches/2026-10-28-fixture-predicate-guard.md` §2 · `docs/core/design/PROVIDER.md:1337`–`:1363`（§6 夹具段）。目标 = 台账 `#1857` / `#1862` 的夹具识别谓词直驱守卫。

**实读核实（非推断）**：
- 谓词坐标与形态：`test/integration/fixtures/anthropic-endpoint.mjs:73`（`SUMMARY_SIG`）· `:76`（导出、纯、无 I/O）· `:78`（字符串支）· `:104`（非数组兜 `[]`）· `:106`（逐请求调用）。
- 判据与产物同源链成立：`thincoder-core/context.mjs:20` 导出 `SUMMARIZE_PROMPT`，其首段逐字含 `:73` 的 `SUMMARY_SIG`（`startsWith` 真）；真实压缩请求末条 = `{ role: "user", content: instruction }`（`thincoder-core/compress-form.mjs:22`）⇒ U-1 的场景有出处。
- 五形读数自代码可推：U-1/U-2 ⇒ true；U-3/U-4/U-5 ⇒ false 且不抛（`[]` ⇒ `at(-1)` undefined ⇒ 空串 `includes` false）。
- 行数逐条对表（判据 8 抽检）：夹具 132 ✓ · `test/integration/anthropic-tool-roundtrip.test.mjs` 290 ✓ · `test/RTM.md` 263 ✓ · `docs/core/design/PROVIDER.md`（read 行号 1411 / `wc` 口径 1412）✓ —— 与批次档 §2.6 表一致。
- §2.8 的 RTM 事实：故事 1 的 1-1/1-2/1-3 在 `test/RTM.md:16-18`（宿主 = 场景档）；故事 11 的 11-1…11-9 在 `test/RTM.md:133-142`（宿主 = `test/integration/context-overflow-guard.test.mjs`）✓ 与「不共用本夹具」一致。
- 落点合规：批次单测档住 `docs/batches/`、名随批次档、零留存、不进任何门 —— `docs/core/design/TESTING.md:55` ∥ `docs/core/design/TESTING.md:96` ∥ `docs/core/design/TESTING.md:141` ✓；`test/integration/fixtures/anthropic-endpoint.mjs:4-5` 头注已预告「批次探针」消费面 ✓。
- 依赖路由：`thincoder-core` 内零 `@thincoder/*` 裸说明符（grep 零命中）⇒ 批内档相对取件不撞 `docs/core/design/TESTING.md:77` 的取件路由坑。

**成立的两个判**：① 用例真能变红——输入取产物本体（不手抄 SIG）使提示词漂移即红，AC-2 的常量中和双向可证判断力；② 不立常驻件——被守对象是夹具内部记账，不占「真实业务场景 / 生产真问题」两条入口，且单测档零留存是纪律（`docs/core/design/TESTING.md:55`），该判已写在 `docs/core/design/PROVIDER.md:1345`。集成节（批次档 §2.8）从 RTM 出发答零增量，理由属唯一合法理由。

**未判 🔴 的三条边界**：不碰产品码 ✓（§2.9 · AC-3）· 不改谓词逻辑 ✓（`test/integration/fixtures/anthropic-endpoint.mjs:76-82` 现态正确）· 不改场景档三例 ✓（`test/integration/anthropic-tool-roundtrip.test.mjs:287` 等断言行零改，AC-3 机检）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Closest-precedent check | 🟡 | 批次设计无 closest-precedent 行：无先例实现坐标 ∥ 无对位设计节 ∥ 无对齐·偏离说明，只有 D-4 的「本仓惯例」（批次档 `:106`）——惯例不是坐标 | 补一行：先例坐标（如 `docs/core/design/PROVIDER.md:1320`–`:1363` 的单元/集成分工与两段式收正）+ 对齐点 + 偏离理由 |
| 2 | Survey-evidence check | 🟡 | 无 survey-evidence 行（查过哪些公共源文档 ∥ none relevant）；同档 `docs/core/design/PROVIDER.md:325` 有该行体例可照 | 补一行：`index.publicRepos` 实读结论 + 「无外部源可对位」的明示 |
| 3 | Branch provenance · Clarity | 🟡 | U-2 才是夹具真实收到的形（`docs/core/design/PROVIDER.md:1244` 的 R2 把字符串 content 转成 `[{type:"text", text}]`；谓词的字符串支 = `test/integration/fixtures/anthropic-endpoint.mjs:78`），但用例表把 U-1 标成「主判别断言」（批次档 `:79`） | 对调标注：U-2 = 夹具真实形（场景 = `thincoder-core/compress-form.mjs:22` → R2 转换），U-1 = 转换前的产物形（到不了本夹具，仍留作纯函数断言） |
| 4 | Branch provenance | 🟡 | U-3 的依据是原则（「谓词不得恒真」批次档 `:81`），未给场景坐标；U-4/U-5 都给了（批次档 `:82` ∥ `:83`） | 补 U-3 的场景 = 夹具默认对话支 `test/integration/fixtures/anthropic-endpoint.mjs:116-118`（非摘要请求一律走这支） |
| 5 | Existing-piece check | 🟡 | 新档名前无三问行（`existing:` / `none found:` / `existing but unusable:`）；批次档 §2.6 只给名与落点，D-1 只否了两个方案 | 补三问行：既有测试档能否宿主该断言（`test/integration/anthropic-tool-roundtrip.test.mjs` = existing but unusable——两层永不互转） |
| 6 | Requirements coverage | 🟡 | §2.8/§2.11 未认 `test/RTM.md:139` 的 11-6（状态 `待执行`，`缺口来源 = 台账 #1833`，断言摘要请求 0）——同一条分类判据在业务面的既有旁证行；D-1 的判因此缺一条可审计的业务旁证 | 点名 11-6 及其 `待执行` 状态：既给 D-1 留旁证，也给本条一个常驻去向（先执行 11-6，再议常驻） |
| 7 | Doc-state dangling | 🔵 | 夹具头注已声明消费面含「批次探针」（`test/integration/fixtures/anthropic-endpoint.mjs:4-5`），AC-4 删档后该消费面在盘上不存在；AC-3 又把该档锁成零 diff | 明示认账（一行：头注描述的是当轮一次性消费面），或在 AC-3 的锁里开一条纯注释豁免 |
| 8 | Acceptance strength | 🔵 | 五形区分不了 `includes` 与 `startsWith` / `some(m => …)`——AC-2 只证「常量中和会红」；批次档 §2.5 已正确拒掉「SIG 只在更早消息」那形（该拒是对的，补形会违 6b） | 记为残余即可（写清「算子级变异不在守卫面」），不要求补形 |

**计数**：🔴 0 · 🟡 6 · 🔵 2。

VERDICT: pass

## §4 用户批准（主 agent）

### 4.1 用户批准（2026-10-28 01:47）

**用户逐字**：「都自动跑完」—— 整批令覆盖本批全链（FR36）。

**⇒ 本批批准面 = §2 设计（五形用例 + 不立常驻件的判 + 零改动边界）+ 评审 pass 结论。**

### 4.2 评审 🟡 的父侧裁决（8 条：6 🟡 + 2 🔵）

**评审 pass（🔴 0），故这批全是改进项，不阻断实现。逐条裁：**

| # | 级 | 裁 | 理由 |
|---|---|---|---|
| 1 | 🟡 | **接受，收口时补** | 缺「最相近先例」行。**这是方法论缺行，不影响用例正确性**；派修正轮要排队等 `docs/core/design/MODEL-SPECS.md` 释放，为一行先例不值得卡实现。 |
| 2 | 🟡 | **接受，收口时补** | 缺「勘察证据」行。同上。 |
| 3 | 🟡 | **接受，但由父侧记** | **评审这一条最有价值**：`docs/core/design/PROVIDER.md:1244` 的 R2 规则在发送前把字符串 `content` 转成 `[{type:"text", text}]` ⇒ **夹具真实收到的是 U-2 的形，不是 U-1**。而 §2.5 把 U-1 标成「主判别断言」。**⇒ 两种形都断言 `true`，用例结果不受影响；但标注会误导后来读者。已在 §4.3 记明，不改设计（改要等修正轮）。** |
| 4 | 🟡 | **接受，收口时补** | U-3 缺场景坐标（其余四形都有）。 |
| 5 | 🟡 | **接受，收口时补** | 缺既有件三问行。**评审已给出答案**（既有测试档 `existing but unusable` —— 集成面与单测面永不互转），补一行即可。 |
| 6 | 🟡 | **接受，但由父侧记** | **评审第二条有价值的**：`test/RTM.md:139` 的 **11-6**（状态 `待执行`，缺口来源 = 台账 `#1833`，断言「摘要请求 0」）就是这条谓词在**业务面**的既有旁证 —— 分类错了，那一行的业务结果会红。**⇒ 这条既给 D-1 的判一个可审计的业务见证，也给 `#1857` 一条常驻去向。已在 §4.3 记明。** |
| 7 | 🔵 | **接受** | 夹具头注 `:4-5` 声明消费面含「批次探针」，AC-4 删档后该消费面在盘上不存在。**⇒ 按评审建议：收口时在 AC-3 的零 diff 锁里开一个纯注释豁免，或明示认账。** |
| 8 | 🔵 | **接受，记为残余** | 五形区分不了 `includes` 与 `startsWith` / `some(...)` —— 算子级变异不在守卫面。**评审也确认 §2.5 拒掉「SIG 只在更早消息」那形是对的**（补那形会违场景来源判据）。 |

### 4.3 父侧记下的两条（不进设计，但进账）

**① U-1 / U-2 的真实可达性**：夹具在本仓只经 `docs/core/design/PROVIDER.md:1244` 的 R2 转换收请求 ⇒ **`content` 到夹具时已是块数组**，谓词 `test/integration/fixtures/anthropic-endpoint.mjs:78` 的字符串支在本夹具上不可达。**U-1 断言的仍是真提示词（纯函数面成立），只是它不是夹具的真实输入形。** 后续读者看 §2.5 时要知道这点。

**② `#1857` 的常驻去向**：`test/RTM.md:139` 的 11-6 一旦从 `待执行` 转绿，这条谓词的失败就会以业务结果的形式出现（分类错 ⇒ 摘要请求 > 0 ⇒ 11-6 红）。**⇒ `#1857` 收口时按此写：本批证明「今天判得对 + 提示词漂移会红」，常驻面靠 11-6 落地。**

## §5 实施记录（eng-coder）

**状态行**：✅ 实施完成 2026-10-28（五例直驱 5/5 · 双向中和转红 · 夹具逐字节还原 · 单测档读数后随批删）

### 5.1 交付摘要

条目 1（台账 `#1857`）= 单件交付：新建批内单元测试档 `docs/batches/2026-10-28-fixture-predicate-guard.test.mjs`（51 行 · 设计估 ≈+45），五例直驱夹具识别谓词 `isSummaryRequest`，不起端点、不起流、不碰产品码。

夹具本体 ∥ 场景档三例断言 ∥ 产品码 ∥ `test/RTM.md` **零 diff**（AC-3 实测无输出）。

设计档那段（`docs/core/design/PROVIDER.md` §6.28 的 `:1347` ∥ `:1349` 两段）设计轮已落，本席实读在位、未改一字。

### 5.2 交付表（逐条对 §2.5 / §2.10）

| # | 要求点 | 状态 | 落点 ∥ 读数 |
|---|---|---|---|
| 1 | §2.5 五例 U-1…U-5（真支两形 + 反支三形） | ✅ Done | 单测档五条 `test()`：U-1 字符串形真提示词 ⇒ `true` · U-2 text 块形真提示词 ⇒ `true` · U-3 普通两轮 ⇒ `false` · U-4 末条只 `tool_result` 块 ⇒ `false` · U-5 `[]` ⇒ `false` 且 `doesNotThrow` |
| 2 | D-1 守卫形态 = 批内单测档、零留存 | ✅ Done | 住 `docs/batches/`、名 = 本批档 stem + `.test.mjs`（最长前缀归属成立）；读数后删档（见 5.3 AC-4） |
| 3 | D-2 输入取产物提示词本体（不手抄 `SUMMARY_SIG`） | ✅ Done | 只 import `SUMMARIZE_PROMPT`（`thincoder-core/context.mjs:20`）；全档无手抄 SIG 字面 |
| 4 | D-3 夹具本体 ∥ 场景档零 diff | ✅ Done | AC-3 实测无输出（见 5.3） |
| 5 | §2.9 边界（不改谓词 ∥ 不碰产品码 ∥ 不动 RTM ∥ 不新建常驻件） | ✅ Done | 边界内零越界；唯一临时改动 = AC-2 中和探针，已逐字节还原（见 5.4） |
| 6 | 残余认账（§2.11） | ✅ Done | 见 5.6 |

### 5.3 AC 实测读数（2026-10-28 · 本机 node v24.19.0）

| AC | 命令 | 读数 |
|---|---|---|
| AC-1 | `node --test docs/batches/2026-10-28-fixture-predicate-guard.test.mjs` | `ℹ tests 5` · `ℹ pass 5` · `ℹ fail 0` · exit 0 |
| AC-2 方向一 | 谓词中和为恒 `false`（`return false`）后同上命令 | U-1 ∥ U-2 **红**，U-3 ∥ U-4 ∥ U-5 绿 ⇒ `pass 3` · `fail 2` · exit 1 |
| AC-2 方向二 | 谓词中和为恒 `true`（`return true`）后同上命令 | U-3 ∥ U-4 ∥ U-5 **红**，U-1 ∥ U-2 绿 ⇒ `pass 2` · `fail 3` · exit 1 |
| AC-2 还原 | `Get-FileHash … -Algorithm SHA256` | 改前 `88E6A8E4A1C243235233A4F327BD89A68E930319478E0151CE7428C67E0B48D1`；还原后**同值** ⇒ 逐字节相同 |
| AC-2 复原复跑 | 还原后同上命令 | `ℹ tests 5` · `ℹ pass 5` · `ℹ fail 0` · exit 0 |
| AC-3 | `git diff --stat -- test/integration/fixtures/anthropic-endpoint.mjs test/integration/anthropic-tool-roundtrip.test.mjs` | 无输出 |
| AC-5 | `doc_check(mode:"gate")` 范围 = 本批档 + `docs/core/design/PROVIDER.md` | `DOC-CHECK GATE: PASS` · 0 段有问题（2 档全清） |

**判断力结论**：五例不是「全绿地摆着」——常量中和两个方向各摘掉对应的一半用例，说明真支抓恒假、反支抓恒真。算子级变异（`includes` ∥ `startsWith`）与锚点改内句仍不在守卫面，见 5.6。

### 5.4 改动清单（逐档）

| 文件 | Δ | 说明 |
|---|---|---|
| `docs/batches/2026-10-28-fixture-predicate-guard.test.mjs` | 新档 51 行 | 设计 §2.6 列在册的新建件；读数留本段后删档 |
| `test/integration/fixtures/anthropic-endpoint.mjs` | 0（终态） | **临时**：AC-2 中和探针改 `:81` 两次（恒 `false` → 恒 `true`）并还原；还原后 `sha256` 与改前同值、`git diff` 无输出 ⇒ 终态零 diff |
| `docs/core/design/PROVIDER.md` | 0（本席） | §6.28 两段设计轮已落，本席只实读未改 |

**名单外改动**：无（临时中和探针就是 AC-2 本身要求的动作，终态零残留，非名单外新改面）。

### 5.5 自审与评审轮次

| 轮 | 面 | 结论 |
|---|---|---|
| 1 | 内部发散审计（read-only explore，对本批 §2 逐条对位） | 唯一发现 = 「§5 尚未写入」⇒ 由本段闭合；对 §2.5 五例输入 ∥ 期望 ∥ 标注 ∥ 落点 ∥ 头注坐标逐条判 ✅，无简化、无名单外改动 |
| 2 | 内部代码评审（advisor，code 面） | `VERDICT: pass` · 🔴 0 · 🟡 1（协调项 = §5 未写，由本段闭合）· 🔵 2（残余/风格，不阻塞） |
| 3 | 自修轮 | 0 轮（评审无必修项） |

**终态 = clean**。

### 5.6 残余（显式认账，不阻塞）

1. **本批固有取舍（§2.11）**：单测档随批删后仍**无常驻守卫**——被守对象是夹具内部记账，不占「真实业务场景 / 生产真问题」两条入口。本批证明的是「今天判得对 + 提示词漂移会红」，不是「以后坏了一定有人拦」。
2. **变异类未覆盖（评审 🔵 记入）**：五例抓不到「`SUMMARY_SIG` 被改锚成 `SUMMARIZE_PROMPT` 内部某句」——谓词是 `includes`（夹具 `:81`），锚改内句后五例仍全绿而误判面放宽。它与已认的算子级变异（`includes` ∥ `startsWith`）是**不同变异类**，故单列；补形会违 §2.5 的场景来源判据，不在本批加例。要守这一形，唯一合规路径 = 先有「压缩真的发生」的业务场景落成集成行（`test/RTM.md` 故事 11 的 11-6 现为 `待执行`）。
3. **U-5 双写（评审 🔵 记入）**：`doesNotThrow` 与随后的 `equal` 对同一输入调了两次函数；保留可读（「不抛」是 §2.5 U-5 期望的一半），非缺陷。

### 5.7 AC-4 删档读数（5.3 表末项的回指）

读数（AC-1 ∥ AC-2 双向 ∥ 还原 ∥ AC-3）先落 5.3，后删档——顺序即 AC-4 的要求。

| 判据 | 命令 | 读数 |
|---|---|---|
| 删档执行 | `delete docs/batches/2026-10-28-fixture-predicate-guard.test.mjs` | 已删 |
| 收口读数 | `ls docs/batches/*.test.mjs` | **0 件**（空集） |
| 本批归属件 | `ls docs/batches/2026-10-28-fixture-predicate-guard.test.mjs` | 0 件 |
| 删后复读 AC-3 ∥ 夹具 sha256 | `git diff --stat -- …` ∥ `Get-FileHash` | 均与 5.3 同值（无输出 ∥ `88E6A8…48D1`） |

**与本批 §6 `:278` 的一处口径差（提请父侧并档）**：§6 写「本批无产品码改动，§5 记『不适用』」，而 §2.10 AC-4 要求「读数记入 §5 后删档」。两者对 §5 的期待不同——本席按 AC-4 办了（§5 = 实施记录 5.1–5.7，含全部 AC 读数），§6 那句「§5 记不适用」因此已不成立，请父侧在 §6 侧改口径（§5 是别人的段，本席不改）。

## §6 验证与收口（父代理）

## 6.1 父侧核验（2026-10-28 01:5x，评审前自核）

**设计席报的三条读数我逐条核过：**

1. **谓词已导出、纯函数** —— `test/integration/fixtures/anthropic-endpoint.mjs:76` `isSummaryRequest`、`:73` `SUMMARY_SIG` 均在盘。
2. **`SUMMARIZE_PROMPT.startsWith(SUMMARY_SIG)` = `true`** —— 这是它设计里最关键的一手：用例输入取**产品侧真字符串**（`thincoder-core/context.mjs:20`），不手抄 `SUMMARY_SIG`。手抄的话判断者与被判者同源，谓词改坏了用例照样绿 —— 那正是 `#1833` 那类失真红的前置。
3. **`docs/core/design/PROVIDER.md` 1408 → 1412（+4 行）** —— 它把设计档的 Δ 原写「+6」就地改成「+4」，我认可这个自正。

**⇒ 本批有实施内容（建单测档、跑读数、按 AC-4 删档），§5 = 实施记录（5.1–5.7，含全部 AC 读数）。本批 ✓ 产品码零改动 —— 两者不是一回事。**

**★ 口径已正（父侧 2026-10-28 01:5x）**：本节初稿曾写「§5 记『不适用』」，与本批 §2.10 的 AC-4「读数记入 §5 后删档」相反。**实施席按 AC-4 办并上抛，是对的** —— 删档后读数只有 §5 一个载体（`docs/core/design/TESTING.md:110`「批档 §5 留一行读数」）。

**⇒ 残余（不阻塞）**：单测档随批删后仍无常驻守卫；这是 `#1857` 的固有取舍（两条入口都不占），不是本批缺陷。

### 6.2 父侧亲测核验（2026-10-28 01:5x，非引用实施席报告）

| 项 | 父侧读数 |
|---|---|
| 批内单测档零留存 | `Get-ChildItem docs/batches/*.test.mjs` ⇒ **0 件** ✓ |
| 夹具档与场景档 0 diff | `git diff --stat -- test/integration/fixtures/anthropic-endpoint.mjs test/integration/anthropic-tool-roundtrip.test.mjs` ⇒ **无输出** ✓ |
| `docs/core/design/PROVIDER.md` 两段在位 | `:1347`「判别的输入取自产物提示词本体」· `:1349`「反支两形不得省」 ✓ |
| 门 | `doc_check(mode:"gate")` 两档 ⇒ **PASS · 0 段** |

### 6.3 一条口径冲突的裁定（实施席上抛）

**它报：§6 写「本批无产品码改动，§5 记『不适用』」，而 §2.10 的 AC-4 要求「读数记入 §5 后删档」——两侧相反。它按 AC-4 办，请父侧改 §6。**

**⇒ 裁：它做得对，§6 已正。**

**理由**：本批**有实施内容**（建单测档、跑五例、跑中和探针、按 AC-4 删档）—— 那都要落 §5。**「产品码零改动」与「§5 无内容」是两件事**，我初稿把二者混成一句了。

**★ 它没有自作主张去改 §6（我的笔域），而是按 AC-4 办完再上抛 —— 这是对的处置。**

### 6.4 结算清单

- **§2 ↔ 设计档对账**：§2.5 五例 ↔ `docs/core/design/PROVIDER.md:1347`/`:1349` 两段，一致。
- **前批遗留交叉核**：`#1857` 由本批结清；它同时给 `#1857` 留了常驻去向（`test/RTM.md:139` 的 11-6，现 `待执行`）。
- **修正轮落地前提**：无修正轮（评审 pass，6 条 🟡 中 4 条按 §4.2 留作收口补、2 条由父侧记）。
- **用户面同步**：无用户可见能力变化 ⇒ 一行「无」。
- **暂缓批复核**：无。
- **台账沉降**：`#1862`。

### 6.5 未覆盖面（如实，三条）

1. **零留存 ⇒ 无常驻守卫**：本批证明「今天判得对 + 提示词漂移会红」，**不证明「以后坏了一定有人拦」**。这是 `#1857` 的固有取舍（两条入口都不占）。
2. **变异类未覆盖（两种）**：① 算子级（`includes` → `startsWith` / `some(...)`）；② 锚级（`SUMMARY_SIG` 被改锚到 `SUMMARIZE_PROMPT` 内部某句 ⇒ 五例仍全绿而误判面放宽）。**补形会违 §2.5 的场景来源判据，故都不加例。**
3. **集成面未跑**：本批集成类 0 增 / 0 改 / 0 删；**未做集成测试验证，父侧收口那一次是唯一一次集成跑**。
