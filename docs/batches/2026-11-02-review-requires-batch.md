# 2026-11-02 · review-requires-batch
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-11-02 · 来源 = 用户 2026-11-02 09:52 逐字「**不应该允许批外文档评审，这是个漏洞。**」→ 09:55 裁「**A**」（一刀切：设计评审一律必须绑批档）。
> 台账 = #1987（ENGINEERING-MODE · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-11-02
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

## 1. 讨论（主 agent）

- **已定决定**：**设计评审一律必须绑批档** —— `advisor(type=design)` 未携 `batchDoc` ⇒ 拒发（一刀切，不留批外口子）。 · 用户原话：「**不应该允许批外文档评审，这是个漏洞。**」→ 选「**A**」 · 时间：2026-11-02 09:52 / 09:55

- **覆盖账** = `#1987`

### 依据：六枚无主 token 槽的实测（父侧本会话）

| 事实 | 读数 / 出处 |
|---|---|
| 六枚槽全部 `batch=—`、`live`、挂了 5.6–5.7 天 | `subagent(action:'design-slots')` 两次实读 |
| 批归属只有两个派生源，两者皆无 ⇒ `null`（不猜） | `thincoder-core/agent-tools/design-slots.mjs` 的 `batchAbsPathOfRun` |
| 未绑批档 ⇒ 关档消费**不适用**（零回归，不是放宽） | `thincoder-core/agent-tools/design-token.mjs` 的前置句 |
| spawn 只校验、不消费（fix round 要复用同一 token） | `thincoder-core/agent-tools/subagent-spawn.mjs` |
| 于是批外 token 的关闭者只剩：**父侧显式 `consume-design`** ∥ **TTL 7 天** | `thincoder-core/token-ttl.mjs` |

**⇒ 授权发得出去、收不回来 —— 这就是那个洞。**

### 为什么是 A（一刀切）而不是 B（留口子 + 记账）

**B 就是「记账代替动作」的老路**：承认这东西存在，再用一条台账行把它看住。**而今晚刚立的判据说池子收活儿不收问题。**

**⇒ 一刀切之后无主槽**没有产生源**：每场设计评审都绑批档，关档即自动收槽。**

### 代价（必须摊在桌面上）

**落完之后，「只想让人看一眼某份档」必须先开批档。** 三处现状因此改变：

| 场景 | 现在 | 落完后 |
|---|---|---|
| 审一份需求档（无实现轮） | 可直接发 | 须先 `batch create` |
| 审一份独立设计档（不属任何实现批） | 可直接发 | 同上 |
| 工程工具面的批 | 已在批内 | 不变 |

**⇒ `batch create` 是一条命令，不贵；但它把「看一眼」变成「先建一本账」。** **⇒ 用户已明示接受这个代价（选 A）。**

### 需求面已落（父侧笔，本轮）

`docs/core/requirements/ENGINEERING-MODE-V2-SPEC-REVIEW-CREDENTIAL.md`：

- ② 功能点新增第 6 条（设计评审必绑批档，带理由）；
- 第 4 条「（微调，本模块唯一差异）」改为「（微调一）」—— 现在有两处微调，原措辞已不成立；
- ④ 验收新增 `AC-M6-6`（拒发且槽数不变）。

### 边界

- **只改准入判据**：`advisor(type=design)` 的 `batchDoc` 必填化 + 拒文。
- **不改** TTL、不改 consume 语义、不改 spawn 门、不改 §3 词表。
- **不动**：批内评审的任何既有行为（今天所有批内评审照旧）。
- **提示词面是否加一句**：交设计席判（父侧派单纪律已要求带批档，但那不是机制）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（修正轮 1–3 共 23 条逐条已落（轮次 3 VERDICT pass：🟡4 · 🔵2 全落）；提示面终稿 = 2.14.1；工具面 4 处 + 提示面 1 处待 eng-coder 落笔（清单 = 2.14.2））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试覆盖 / 验收对照 / 关键决策 / 上抛项>

## 2. 批次任务与设计（eng-designer）

**状态行**：设计完成（2026-11-02）

### 2.1 本批条目（覆盖需求）

| # | 覆盖 | 需求回指 |
|---|---|---|
| 1 | 设计评审准入：`advisor(type="design")` 未携 `batchDoc` ⇒ 拒发，零实例 / 零 token / 零槽 / 零 LLM | 需求档 ② 第 6 条 · `AC-M6-6` |
| 2 | 结算面兜底：实例无批档绑定 ⇒ 判据 1 以 `no-batch-binding` 照拒、零签发 | 需求档 ② 第 6 条 · 设计档 `docs/core/design/ADVISOR-GUARDS.md` §1.1 判据前置 |
| 3 | 文档面同步：`docs/core/design/BATCH-RECORD.md` 四处旧判据改写 | 需求档 ② 第 6 条 |
| 4 | 工具面 / 提示面同步：四处描述改为必填式（逐字终稿见 2.4） | 需求档 ② 第 6 条 |

**明确不在本批**：`#1940`（无设计档的批评对象面——另一件事）· TTL · consume 语义 · spawn 门 · §3 词表 · 批内评审既有行为 · 路径解析与文案（`resolveBatchDocPath` ∥ `batchDocBases`）· `docSetKey`。

### 2.2 设计档落点

| 档 | 改动面 |
|---|---|
| `docs/core/design/ADVISOR-GUARDS.md` | §2 新增第 4 条（准入门：判据 / 分支依据表 / 拒文逐字 / 最相近先例 / 与结算面另一半的关系 / 边界）；§1.1 判据前置改写；§1.3 行 17-2 改写；§10 新增 `A-AG26`、改写 `A-AG23` |
| `docs/core/design/BATCH-RECORD.md` | 四处：必传句（原「不强制必传」）、调用侧句（原「不得因缺此参数拒绝评审」）、BR-7 用例行、收口评审对接口的括注 |

**单源**：准入门判据与拒文住 `docs/core/design/ADVISOR-GUARDS.md` §2 第 4 条；`docs/core/design/BATCH-RECORD.md` 只写参数面「必填」并回指，不重述拒文。

### 2.3 三件的判与理由

**① 拒在哪一层 —— 判：准入面 + 结算面两处，一个判据两个错因，不合并。**

| 层 | 错因 | 返回 |
|---|---|---|
| `advisor` 工具入参门（类型门之后、文档范围解析之前） | 你忘了带 | 拒发串（`criterion=batchdoc-missing`），零实例 / 零槽 / 零 LLM |
| 结算面 `settleDesignReview` 判据 1 前置 | 你带了，绑定没传到实例（接线故障） | `{passed:false}` + 恒定标记（`no-batch-binding`），槽零写、实例不翻 open |

只挡准入不成立：唯一「有授权、无归属」的产出是 token，而它在结算面产生。
同步路径与异步路径是两条绑定传递通道（`callbacks.batchDoc` ∥ 池条目 `run.batchDoc`），接线一断，只挡准入就无人报错。依据不是想象——六枚 `batch=—` 的槽是已发生的生产事实（§1 依据表）。
只挡结算也不成立：评审白跑一次 LLM，且模型拿到「跑完了没凭证」，比「你忘了带」难修。

**② 那条「未绑 ⇒ 本门不适用（零回归，不是放宽）」—— 判：改掉并删除。**

它成立的前提是「批外评审是合法调用形」。本判据把那个前提撤了，它从「不适用的边界」退化成「不存在的情形」。
留着的代价：下一次重构读到的是「有一种合法调用不带批档」——这正是本批要堵的洞的成文依据。
处置：`docs/core/design/ADVISOR-GUARDS.md` §1.1 判据前置 + `A-AG23` 一并改写；`thincoder-core/agent-tools/design-token.mjs` 里「未绑 ⇒ 跳过本门」改为「无绑定 ⇒ 拒签发」。
**找不到「仍未绑且合法」的情形**：代码评审不签设计 token，不需要这个口子。

**③ 提示词面 / 工具面 —— 判：要改，四处逐字终稿见 2.4。**

机制一律必填之后，任何条件式的「有批次档在飞时必传」都在教旧做法。三处是模型实际读到的文本（工具描述、参数描述、类型门拒文的用途行）。

**一处纠正**：`thincoder-core/prompts/discipline-engineering.md` 的「发起评审节」不存在——实读该档，`advisor` / `批次档` / `设计评审` / `design review` 零命中，`batchDoc` 仅见第 266 行「one batch = one implementation round」（与本判据无关）。该档无可同步的纪律句，本批不动它。

### 2.4 逐字终稿（四处待 eng-coder 落笔；三处已落，列此备核）

| # | 坐标 | 改成（逐字终稿） |
|---|---|---|
| 1 | `docs/core/design/BATCH-RECORD.md:77` | 已落：`batchDoc` = **必填**，未传 ⇒ `advisor` 拒发（回指 `docs/core/design/ADVISOR-GUARDS.md` §2 第 4 条）；传了须可读；`type="code"` 不受本门约束 |
| 2 | `docs/core/design/BATCH-RECORD.md:106` | 已落：设计评审一律必传 `batchDoc`（含普通面收口评审）；没有批档在飞 ⇒ 先 `batch create` 再发起 |
| 3 | `docs/core/design/BATCH-RECORD.md:140`（BR-7） | 已落：设计评审不带 `batchDoc` ⇒ 拒发（零实例 / 零槽 / 零 LLM）；带不可读 ⇒ throw；代码评审工具集不含 `batch` |
| 4 | `thincoder-core/tool-docs/advisor.md:3` | 「`type="design"` — design review: reviews design / requirement documents BEFORE implementation. Pass `documents=[...]` and `batchDoc` — the batch record this review belongs to. **`batchDoc` is required**: a design review without it is refused before launch, because the token it would mint has no batch to close it.」 |
| 5 | `thincoder-core/agent-tools/advisor.mjs:85`（属性描述） | 「Design review only, REQUIRED: the batch record this review belongs to — the reviewer then also gets the `batch` write channel to record its findings + verdict. A design review without it is refused at launch (a token with no batch has no closer); a path that does not resolve to a readable file is refused. Relative paths resolve against the session cwd first, then candidate project roots (project-root-relative e.g. `<repo>/docs/batches/…`, or absolute). Code reviews do not pass it.」 |
| 6 | `thincoder-core/advisor/notice.mjs:81`（类型门用途行） | 「`• type="design"` — design review: reviews design / requirement documents; pass `documents=[...]` (the explicit list) and `batchDoc` — required, the batch record this review belongs to.」 |
| 7 | `thincoder-core/agent-tools/advisor.mjs:174-177`（注释） | 「准入门：`type="design"` 且 `batchDoc` 缺失 / 空 ⇒ 拒发（判据与拒文 = `docs/core/design/ADVISOR-GUARDS.md` §2 第 4 条）；携了则须可读（同族判据）。绑定落 `resolved.run`（评审实例键）。」 |

**拒文逐字**（落 `thincoder-core/agent-tools/advisor.mjs`，与类型门同族形态）：

```text
Advisor: launch refused — a design review must carry `batchDoc`: the batch record this review belongs to. {标识行 criterion=batchdoc-missing}
Why: the token a design review issues is closed by its batch — closing that record consumes it. A review with no batch mints a token nothing can close: it rides the 7-day TTL and nothing else. Refusing the review at launch is how that token never exists.
Expected form 1 — project-root-relative: docs/batches/<batch>-<topic>.md (resolved against the session project root).
Expected form 2 — absolute: D:\repo\docs\batches\<batch>-<topic>.md (used as-is).
No batch record in flight: create one first — batch({action:"create", …}) — one command; the record is the premise of the review, not paperwork.
Nothing was sent: no review instance, no round consumed, no design token minted, no LLM call.
```

### 2.5 旧账推翻（本批是反向裁定，必须写明）

| # | 旧决定（逐字） | 当时的判据 | 今天为何不成立 | 推翻后变了什么 |
|---|---|---|---|---|
| 1 | `docs/batches/2026-10-17-prompt-why-form.md`「无批次档的在途设计评审不受阻（**不得因缺此参数拒绝评审**）」 | 批档是**可选挂载**，缺它只是少一条 §3 写入通道，门面零回归 | 批归属是关档消费的唯一钥匙；批外 token 无第二个关闭者（六枚 `batch=—` 槽挂 5.6–5.7 天） | 批外设计评审从「照常跑」变为「拒发」 |
| 2 | `docs/batches/2026-10-28-memory-to-mechanism.md`「**未绑批档 = 门不适用**、零读零写零崩。这是**已定义行为**，不是兜底分支」 | 同上：未绑是可定义的行为面 | 未绑不再是可达调用形；保留它等于把「批外合法」写进规范面 | 该形从「已定义行为」变为「接线故障 ⇒ 拒签发」 |

两笔旧账的历史记录按原样保留（批档是过程档，不回改）；**规范面只写今天成立的那一条**。

### 2.6 五处新增坐标逐条判（不动也是结论）

| # | 坐标与现文 | 判 | 理由 |
|---|---|---|---|
| ① | `docs/core/design/BATCH-RECORD.md:396` 收口评审对接口括注「`batchDoc` 传参纪律 = §4.5 调用侧句（有档在飞必须传）」 | **改**——括注改为「一律必传——未携即拒发」 | 它引的正是本批改掉的旧纪律；不改则档内自相矛盾 |
| ② | `thincoder-core/agent-tools/advisor.mjs` 入口注释「若传则须可读 … 不强制必传」 | **改**——见 2.4 行 7 | 代码注释是面；不改则下一个读代码的人看到旧规 |
| ③ | `docs/core/requirements/NORMAL-MODE.md` 边界句「不新增工程三门（设计令牌 ∥ spawn 强制 `batchDoc` ∥ 写文件门禁）」 | **不改** | 本批改的是**同一个评审工具的参数契约变严**，不是「工程专属门被移植」。评审工具只有一套，`batchDoc` 的参数契约不分模式；spawn 依旧只在工程模式强制 |
| ④ | `docs/core/requirements/NORMAL-MODE.md` F-N2.2「普通模式使用批次档——一交付目标 = 一批档」 | **不改** | 普通面本来就有批档 ⇒ 新判据在普通面不会无档可挂；这条正面支撑新判据 |
| ⑤ | `docs/core/design/PROMPT-SYSTEM.md`「收口评审通道 = 设计评审通道（`advisor` `type:"design"` + 本档 `batchDoc`）」 | **不改** | 它写的是通道选择与「带哪本档」，不含「可不带」；收口评审因此自动吃新判据，无需改写 |

③ 的口径一句话（若要在 `docs/core/requirements/NORMAL-MODE.md` 留痕，可用此句）：「设计评审的参数契约收严（`batchDoc` 必填）不是工程三门移植——评审工具只有一个，模式不改变它的参数契约；spawn 强制 `batchDoc` 仍为工程专属。」

### 2.7 受影响文件表（含测试覆盖）

| 文件 | 面 | 改动 |
|---|---|---|
| `thincoder-core/agent-tools/advisor.mjs` | 产品代码 | 新增准入判据（类型门后、文档范围解析前）+ 拒文族 + `_advisorRefusals` 登记；属性描述与入口注释改必填式 |
| `thincoder-core/agent-tools/design-token.mjs` | 产品代码 | 判据 1 前置：`run.batchDoc` 空 ⇒ `passed:false` + `no-batch-binding`（替换「跳过本门」） |
| `thincoder-core/tool-docs/advisor.md` | 产品代码（工具描述面） | 第 3 行改必填式（2.4 行 4） |
| `thincoder-core/advisor/notice.mjs` | 产品代码（提示面） | 类型门用途行改必填（2.4 行 6） |
| `docs/core/design/ADVISOR-GUARDS.md` | 设计档 | 已落（2.2） |
| `docs/core/design/BATCH-RECORD.md` | 设计档 | 已落（2.2）+ 2.6 ① 括注 |
| `test/RTM.md` | 集成索引 | 行 `17-2` 改写为「不带 `batchDoc` ⇒ 拒发、槽数不变、spawn 被拒」 |
| `test/integration/advisor-record-gate.test.mjs` | 集成用例 | 用例 `17-2` 改写（现断言「照常签发」，改判据后必红） |
| `docs/batches/2026-11-02-review-requires-batch.test.mjs` | 本批单测（收口即删） | 见 2.8 |

**层级结论**：不跨层——准入判据住工具入参层，兜底住结算层，两者读同一实例字段 `run.batchDoc`，不新增跨层数据流。
**零改动面**：路径解析与文案 · `batchDocForReview`（实例键派生）· 批归属派生（`design-slots.mjs`）· spawn 门 · TTL。

### 2.8 验收对照（逐条机判）

| # | 判据 | 机检方式 |
|---|---|---|
| 1 | 不传 `batchDoc` 发 `advisor(type="design")` ⇒ 回执以 `Advisor: launch refused` 开头、含 `batchDoc` 必填句、含两种期望形 | 单测：调 `advisorTool.execute({type:"design", documents:[…]}, ctx)` ⇒ 断言三串 |
| 2 | 拒发后槽数不变、`_advisorRefusals` 已登记、零 token | 单测：跑前跑后 `agent._engDesignTokens?.size ?? 0` 相等 + `_advisorRefusals.has(toolCallId)` |
| 3 | 携了可读 `batchDoc` 的设计评审零回归 | 单测：回执首行非 `Advisor: launch refused` |
| 4 | `type="code"` 不携 `batchDoc` 不被本门拒 | 单测：拒因 ≠ `batchdoc-missing` |
| 5 | 结算面：`run.batchDoc` 空 ⇒ `passed:false` 且回执含 `no-batch-binding`、槽零写 | 单测：`settleDesignReview(agent, {batchDoc:null, …}, token, 回显+VERDICT pass 文本)` |
| 6 | 集成面：`17-2` 新形 | `node --test test/integration/advisor-record-gate.test.mjs`（父侧收口跑） |

**本批单测命令**：`node --test docs/batches/2026-11-02-review-requires-batch.test.mjs`（收口即删）。
**集成面**：本批改的是既有行的业务可观察结果 ⇒ 改写 `17-2`，不新增行；故事 17 标题与既有 4 行编号不变。

### 2.9 关键决策

| # | 决策 | 被否的方案与理由 |
|---|---|---|
| KD1 | 两处设口（准入 + 结算），两个错因两句话 | 只准入：接线一断洞复现且无人报；只结算：评审白跑、错因含糊 |
| KD2 | 删「未绑 ⇒ 本门不适用」，改为 `no-batch-binding` 照拒 | 留它 = 把「批外评审合法」写进规范面，正是本批要撤的前提 |
| KD3 | 拒文含可执行的下一步（没有批档 ⇒ 先 `batch create`） | 只列两种期望形：用户知道怎么传，不知道没有档时怎么办 |
| KD4 | 不动 `resolveBatchDocPath` 文案 | 它是四处调用点共用面（`batch` 工具也用）；改它会把「无批档时省略」的建议从别的工具面一并抹掉 |
| KD5 | 不把 `batchDoc` 写进 JSON Schema 的 `required` | 它只对 `type="design"` 必填；schema 层必填会同时约束代码评审 |

### 2.10 上抛项

| # | 项 | 状态 |
|---|---|---|
| 1 | 提示面坐标「`thincoder-core/prompts/discipline-engineering.md` 的发起评审节」不存在（实读零命中） | 已记录，无需回复 |
| 2 | `docs/core/requirements/NORMAL-MODE.md` 边界句的留痕（2.6 ③ 的口径句）是否要由父侧落进该档 | 待父侧裁 |

### 2.11 修正轮（评审轮次 1 —— 🔴4 · 🟡7 · 🔵2 逐条落地，2026-11-02）

**本节口径**：2.1 条目表与 2.3 ① 的「结算臂」已被 🔴1 推翻，以本节为准；设计档面（`docs/core/design/ADVISOR-GUARDS.md` / `docs/core/design/BATCH-RECORD.md`）同轮改毕。

| # | 裁 | 改法 | 落点 |
|---|---|---|---|
| 🔴1 | 结算臂无场景 ⇒ 撤分支，改程序不变量 | `run.batchDoc` 空 ⇒ `settleDesignReview` 入口 `throw`（点名设计评审实例无批档绑定 + designId），零槽写、不返回判决、无对外拒因值；`no-batch-binding` 退场，不进需求条目、不进 AC | `docs/core/design/ADVISOR-GUARDS.md` §1.1 触发条件 1 · `A-AG23` · §2 第 6 条「结算面没有第二个拒发口」 |
| 🔴2 | 「普通模式批无设计评审 ⇒ 不可达」是错事实 | 改为：普通面收口评审走同一条设计评审通道（`docs/core/design/BATCH-RECORD.md` §4.16）⇒ 本门同判，发起前须先有批档并携 `batchDoc` | `docs/core/design/ADVISOR-GUARDS.md` §1.2 边界句 |
| 🔴3 | 类型门逐字块仍条件式 | 逐字块该行对齐 §2.4 行 6 必填式（`and batchDoc — required, …`）；该坐标补进 2.6 | `docs/core/design/ADVISOR-GUARDS.md` §2 第 4 条逐字块 · 本档 2.6 新增行 |
| 🔴4 | 6-1–6-4 必红，破行清单只列 10-1 ∥ 10-4 | 取「夹具补可读 `batchDoc`」（断言逐字不变）；所在测试档 = `test/integration/review-doc-scope.test.mjs`（6-1–6-5）；同档登记拒因优先级事实 | `docs/core/design/ADVISOR-GUARDS.md` §12 破行条 · 本档 2.7 测试面 |
| 🟡5 | 编号碰撞 | 新条目改号 **§2 第 6 条**；三处「§2 第 4 条」指针改「§2 第 6 条」；先例行「§2 第 2 条」改「§2 第 4 条」 | 同档 §1.1 · §2 第 6 条 · `docs/core/design/BATCH-RECORD.md` §4.2 |
| 🟡6 | 缺档位结论 | 补贴线判（node 实读，as-of 2026-11-02）：`thincoder-core/agent-tools/advisor.mjs` 281 · `thincoder-core/agent-tools/design-token.mjs` 269 · `thincoder-core/advisor/notice.mjs` 142 · `test/integration/advisor-record-gate.test.mjs` 120 · `test/integration/review-doc-scope.test.mjs` 187 —— 皆远低于 500 软线 ⇒ **都不跨，零拆分义务** | 本档 2.7 |
| 🟡7 | 缺公开源核查 + 先例批 | 补两行：公开源核查（`index.publicRepos` = `[]`，已查无）；先例批（查 `docs/batches/**` 逐字 `typeGateCriterion` 零命中——已查无，先例以实现档为准） | `docs/core/design/ADVISOR-GUARDS.md` §2 第 6 条 |
| 🟡8 | `batchdoc-missing` 缺三问 | 补 **none found**（查 `criterion=` 枚举 ∥ `_advisorRefusals` ∥ `settlementCriterion`，无同义既有名）；该字面并入 `criterion` 枚举（对象标识行字段行同笔改） | 同档 §2 第 6 条 · §2 第 5 条字段枚举 |
| 🟡9 | 需求档 ①「唯一微调」 | 父侧笔已改为两处微调；本席核对：① 两处 = 评审对象来源读 `docRoot` ∥ 设计评审必绑批档，与 ② 的「微调一 / 第二处微调」对得上 | `docs/core/requirements/ENGINEERING-MODE-V2-SPEC-REVIEW-CREDENTIAL.md`（父侧笔，本席零改） |
| 🟡10 | 豁免句只落一面 + 两处过时 | 设计侧孪生句补进 `docs/core/design/BATCH-RECORD.md` §8 边界 10；2.6 ③ 结论更新为「需求档边界句不动，两面豁免句均已落」（原判「不改」只指需求档面）；2.10 #2 关闭 | `docs/core/design/BATCH-RECORD.md` §8 · 本档 2.6 ③ · 2.10 |
| 🟡11 | 「兜底来源残余」已不可达 | 删残余面，改为一句：兜底来源只供归属派生、不供本门触发；「批档写进 `documents`、不传 `batchDoc`」这条形已在准入门拒发 | `docs/core/design/ADVISOR-GUARDS.md` §1.2 残余条 |
| 🔵12 | 槽数两个读面 | 权威面 = 槽存储本体 `agent._engDesignTokens`；`subagent(action:'design-slots')` 清点读同一 Map（`thincoder-core/agent-tools/design-slots.mjs` 的 `:38` 实读）⇒ 2.8 判据 2 读 `.size` 与外显清点同源，不需另立验收格 | 同档 `A-AG26` · 本档 2.8 判据 2 |
| 🔵13 | 门位坐标不一致 | 实现面单值插入点 = `thincoder-core/agent-tools/advisor.mjs:114`（`const reviewType = args.type` 之后、范围解析之前——as-of 实读，符号锚优先）；注释随插入点、不另立坐标（2.4 行 7 原注释坐标 `:174-177` 作废） | 本档 2.4 行 7 · `docs/core/design/ADVISOR-GUARDS.md` §2 第 6 条 |

**修正后的条目表（取代 2.1）**：三件——① 设计评审准入门（`batchDoc` 必填 ⇒ 拒发，零实例 / 零 token / 零槽 / 零 LLM）；② 文档面同步（`docs/core/design/ADVISOR-GUARDS.md` + `docs/core/design/BATCH-RECORD.md` 旧判据改写）；③ 工具面 / 提示面同步（四处描述改必填式，逐字终稿 = 2.4 行 4–7）。结算面不再是独立条目——它是同一判据的程序不变量（🔴1）。

**修正后的测试面（取代 2.7 的测试行）**：本批单测 `docs/batches/2026-11-02-review-requires-batch.test.mjs`（收口即删）；集成面改两档——`test/integration/advisor-record-gate.test.mjs` 的 17-2（断言改判据后必红）∥ `test/integration/review-doc-scope.test.mjs` 的 6-1–6-5（只补夹具，断言零改）。

**上抛项（取代 2.10）**：#1（提示面坐标「发起评审节」不存在）已记录、无需回复；**#2 关闭**——`docs/core/requirements/NORMAL-MODE.md` 的豁免句由父侧落，设计侧孪生句本批补进 `docs/core/design/BATCH-RECORD.md` §8 边界 10。

### 2.12 修正轮（评审轮次 2 —— 🔴1 Unfixed · 🟡#14 · 🟡#15 · 🔵#16 逐条落地，2026-11-02）

**本节口径**：2.8 判据 5 已被本节推翻，以本节为准（2.11 的取代清单漏了 2.8，本节补上）。2.6 ∥ 2.7 的对应落笔同样以本节为准——**两节正文未改**（§2 是 append-only，故 🟡15 的「二选一」取 ②）。

| # | 裁 | 改法 | 落点 |
|---|---|---|---|
| 🔴1 | 2.8 判据 5 仍在认证已退场的分支（与 2.11 自己写的「`no-batch-binding` 退场，不进需求条目、不进 AC」相反） | 作废原判据 5（「`passed:false` 且回执含 `no-batch-binding`、槽零写」），改判为**程序不变量**：`run.batchDoc` 空 ⇒ `settleDesignReview` 入口 `throw`（串点名设计评审实例无批档绑定 + designId）、零槽写、不返回判决、无对外拒因值。机检 = 同调用 `settleDesignReview(agent, {batchDoc:null, …}, token, 回显+VERDICT pass 文本)` ⇒ 断言 throw 且错串含 designId、槽数不变、无签发 | 本档 2.8 判据 5（以本节为准）· `docs/core/design/ADVISOR-GUARDS.md` §1.3 单测表 U-6 行（**已落**：改判 throw） |
| 🟡14 | A7 是同一句的第三份副本，仍是条件式 | 内容格改必填式（「设计评审**一律必传** `batchDoc`——未携即拒发；没有批档在飞 ⇒ 先 `batch create`」）；逐字源格从「纪律层发起评审节」（§2.3 ③ 实读该节不存在）改到真正的家：本档 §4.5 调用侧句 ∥ `thincoder-core/prompts/persona-engineering.md` 的 Review convergence 节发起评审纪律句 | `docs/core/design/BATCH-RECORD.md` §6.2 A7 行（**已落**） |
| 🟡14 附带 | 上述逐字源自身仍携旧口径：实读 `thincoder-core/prompts/persona-engineering.md:280` 「Design review while a batch record is in flight: **must pass `batchDoc`**」+ `:281` 「an in-flight design review without a batch record is **not blocked**」 | 同一判据的第五处落点（提示面）⇒ 逐字终稿见 2.12.1；落笔方 = eng-coder（提示面属产品代码，设计席不写） | 本档 2.12.1（列此备核） |
| 🟡15 | 2.11 声称的两处落笔未实落（2.6 缺类型门逐字块那格、③ 的判仍旧；2.7 无贴线判行） | 取 ②：**2.6 ∥ 2.7 的对应落笔以 2.11 ∥ 2.12 为准，两节正文未改**。应含内容 = 2.12.2（2.6 缺的两格 + ③ 的判更新）∥ 2.12.3（2.7 贴线判行） | 本档 2.12.2 · 2.12.3 |
| 🔵16-1 | 「同档 6-5 同形」是全档对 6-5 的唯一记载，断言面不可核 | 补实读：`test/integration/review-doc-scope.test.mjs:166` 起，用例 `6-5 会话锚 = 非项目目录（根无档、下辖 1 个项目）⇒ 当场拒发（no-project-root），不把下辖项目当根`；断言 = 回执含 `criterion=scope-not-doc` ∥ `reason=no-project-root` ∥ `→ (no base) ∥ reason=no-project-root` ∥ 文案报锚态 `Session anchor is workspace (` ∥ 期望形两句 ∥ 不以该下辖项目为基面解析 ∥ `_advisorRefusals.has("t5")` ∥ 零评审实例 ∥ 零请求 | 本档 2.12 · `docs/core/design/ADVISOR-GUARDS.md` §12 破行条 |
| 🔵16-2 | 6-1 补 `batchDoc` 后的连带面未登记 | 登记：同例此后也进 `§3 落地门`（`batch` 工具挂载条件 = `docs/core/design/BATCH-RECORD.md` §4.3 ⇒ 回执多一条记录面标记）；6-1 三条断言（回执无 `scope-not-doc` ∥ 假端点收 1 个请求 ∥ 回执含固定文本）逐字不变 | 本档 2.12 · `docs/core/design/ADVISOR-GUARDS.md` §12 破行条 |

#### 2.12.1 提示面第五处：逐字终稿（`thincoder-core/prompts/persona-engineering.md` 第 280–281 行，两句并一句）

```text
- Design review: **`batchDoc` is required** (the batch record path) — a review without it is refused at launch (a token with no batch has no closer: it would ride the 7-day TTL and nothing else), and the reviewer thereby gets the `batch` tool write channel to write the findings table + VERDICT + counts **verbatim** into batch record §3;
  no batch record in flight ⇒ create one first — `batch({action:"create", …})` — the record is the premise of the review, not paperwork.
```

原两句一并删除——`:281` 的「not blocked」是 2026-10-17 那笔旧判据的提示面副本，本批已反向裁定（§2.5 行 1）。

#### 2.12.2 2.6 的应含内容（表题应作「**七处**新增坐标逐条判（不动也是结论）」）

- **⑥ `docs/core/design/ADVISOR-GUARDS.md` §2 第 4 条 类型门逐字块的 `• type="design"` 用途行** —— 判**改**：对齐必填式（与 2.4 行 6 是同一行，**已落**）。
- **⑦ `docs/core/design/BATCH-RECORD.md` §6.2 A7 锚行** —— 判**改**：条件式改一律必传（🟡14，**已落**）。
- **③ 的判更新**：需求档边界句**不改**（判据面 = 需求档本身）。豁免句两面均已落——需求面 `docs/core/requirements/NORMAL-MODE.md` §5.6 ∥ 设计侧 `docs/core/design/BATCH-RECORD.md` §8 边界 10。原判「不改」只指需求档面，不是「两面都不落」。

#### 2.12.3 2.7 的贴线判行（500 软线 / 800 硬限）

| 文件 | 行数 | 判 |
|---|---|---|
| `thincoder-core/agent-tools/advisor.mjs` | 281 | 低于 500 软线 |
| `thincoder-core/agent-tools/design-token.mjs` | 269 | 低于 500 软线 |
| `thincoder-core/advisor/notice.mjs` | 142 | 低于 500 软线 |
| `test/integration/advisor-record-gate.test.mjs` | 120 | 低于 500 软线 |
| `test/integration/review-doc-scope.test.mjs` | 187 | 低于 500 软线 |

**结论：五档都不跨 ⇒ 零拆分义务**（as-of 2026-11-02 `node` 实读，读法 = `readFileSync(...).split('\n').length`）。

**本节零新增语义**：四条全部是评审轮次 2 的裁定落地——无新判据、无新分支、无新条目。

#### 2.12.4 🔴1 的同族活字（2.7 受影响文件表的 `design-token.mjs` 行）

2.7 那张表里还有一行在认证同一个已退场的分支（逐字：「判据 1 前置：`run.batchDoc` 空 ⇒ `passed:false` + `no-batch-binding`（替换「跳过本门」）」）。

**以本节为准，该行改读**：`design-token.mjs` 的判据 1 前置 = `run.batchDoc` 空 ⇒ `settleDesignReview` 入口 `throw`（程序不变量，点名校验失败的评审实例 + designId）；「跳过本门」的旧分支与 `no-batch-binding` 一并退场。

处置同 2.12 口径：§2 append-only，该行正文未改，读者以本行为准。

### 2.13 修正轮（小轮——父侧 2026-11-02 10:12 派单两件；同一批 🔴1 的收口，零新判据）

**派单边界**：写域 = `docs/core/design/ADVISOR-GUARDS.md` + 本档 §2。不碰 `thincoder-core/prompts/`（提示面是产品代码，落笔方 eng-coder）。

#### 2.13.1 提示面终稿（取代 2.12.1——目标态 ∥ 理由 ∥ 边界三件齐）

**落笔坐标** = `thincoder-core/prompts/persona-engineering.md` 的 `## Review convergence` 节第 280–281 行：两句并一句，原两句整段删除。

```text
- Design review: **`batchDoc` is required** (the batch record path) — a review without it is refused at launch and nothing is sent.
  Why: the review's conclusion only counts once it is written into that record's §3, and the token the review mints is closed by the same record. A review with no batch mints a token nothing can close — the authorization goes out and never comes back, riding the 7-day TTL and nothing else.
  No batch record in flight — that does not block the review: create one first, `batch({action:"create", …})`, one command; the record is the premise of the review, not paperwork. The reviewer thereby gets the `batch` tool write channel to write the findings table + VERDICT + counts **verbatim** into §3.
```

**三件各在哪**：

| 件 | 落在 | 逐字锚 |
|---|---|---|
| 目标态 | 首行 | `a review without it is refused at launch and nothing is sent` |
| 理由 | `Why:` 行 | 结论只有写进该档 §3 才算数；token 由同一本档收口 ⇒ 批外签发 = 授权发得出去、收不回来（只剩 7 天 TTL） |
| 边界 | 第三行 | 没有批档不构成阻塞——先 `batch({action:"create", …})` 再发，一条命令 |

**原 `:281` 那条「理由」一并处理**：它写的是「拒绝它就等于让无批档的评审永远跑不起来」。今天成立的判据是「评审照跑，起点是先把档建出来」——「跑不起来」不成立，代价只有一条命令（§1 已记用户明示接受）。原句整句删除，不留「已撤 / 作废」痕迹（提示面是模型读的活文本，历史不进该面）。

#### 2.13.2 断言位置与异常外逸（已落 `docs/core/design/ADVISOR-GUARDS.md`）

| 落点 | 加了什么 |
|---|---|
| §1.1 触发条件 1（两条 bullet） | 断言位置 = `boundBatch` 判定处、早于写槽；异常不许在结算面被接住后继续 |
| §10 `A-AG23` | 同上，写成机检形：断言在槽写之前 ∥ 异常外逸不接 ∥ `run.batchDoc` 置 `null` 后结算 ⇒ 抛错、`agent._engDesignTokens` 计数不变 |
| §1.3 单测表 U-6 行 | 复现形 + 反断言（**不得**把「返回 `passed:false`」当期望——那是被裁掉的分支） |
| 档头板块行 | 补「设计评审准入门（`batchDoc` 必填）」——枚举此前漏了这一族（D3 计数/枚举同步，非新语义） |

**依据（父侧读码 ∥ 本席同轮实读，逐字）**：

| # | 事实 | 逐字 |
|---|---|---|
| 1 | 门是条件式 | `thincoder-core/agent-tools/design-token.mjs:188` `const boundBatch = typeof run?.batchDoc === "string" && run.batchDoc.trim() ? run.batchDoc : null` |
| 2 | 未绑 ⇒ 整段跳过 | 同档 `:190` `if (boundBatch) {` |
| 3 | 槽写在门之后 | 同档 `:240` `agent._engDesignTokens.set(run.designId, designToken)` |
| 4 | 结算调用点无 try/catch | `thincoder-core/agent-tools/advisor-settle.mjs:155` `const settled = settleDesignReview(agent, run, entry.designToken, result, { incomplete })`；邻近唯一的 try 包的是 `:166` 的 `persistEngTokens(agent)` |
| 5 | 旧口径仍活在代码注释里 | `thincoder-core/agent-tools/design-token.mjs:159` `未绑批档 ⇒ 本门不适用（零回归——条件写在前置上，不是实现时跳过）。`（同判 `:186`——落笔面见 2.12.4） |

**⇒ 未绑 = 跳门 = 一路走到 `set(...)` = token 照签、无记录**——六枚 `batch=—` 的成因（§1 依据表）。

**为什么位置与传播要写死**：断言落在槽写之后 = 没拦（token 已在槽里）；异常被 catch 后继续 = 落回 `set(...)` ⇒ token 照签、不报错、只留一条日志。那比跳门更坏——跳门的后果还能从清点面读出（六枚 `batch=—` 槽就是这么被发现的），catch 后继续把「失败发生过」也抹掉了。

#### 2.13.3 本节零新增语义

条目表 ∥ 测试面（2.11 校正后的两段）∥ `docs/core/design/ADVISOR-GUARDS.md` §2 第 6 条判据——零改。本节只把 🔴1 已裁的「结算面程序不变量」说到可落笔的粒度：位置、传播、机检形。

### 2.14 修正轮（评审轮次 3 —— VERDICT pass · 🟡4 · 🔵2 逐条落地，2026-11-02）

**本节口径**：2.9 的 KD1 ∥ KD2 已被 2.11 🔴1 ∥ 2.12 取代（本节 🟡1）；2.13.1 提示面终稿的第三行已被 2.14.1 取代。**本节零新增语义**——六条全是评审轮次 3 的裁定落地：无新判据、无新分支、无新条目。

| # | 裁 | 改法 | 落点 |
|---|---|---|---|
| 🟡1 | 2.9 的 KD1 ∥ KD2 会把裁掉的分支复活 | **点名取代**：KD1「两处设口（准入 + 结算），两个错因两句话」∥ KD2「删「未绑 ⇒ 本门不适用」，改为 `no-batch-binding` 照拒」已由 2.11 🔴1 ∥ 2.12 取代——结算面**无拒因、无文案**，是程序不变量 throw（`run.batchDoc` 空 ⇒ `settleDesignReview` 入口 throw，串点名实例 + designId）。2.9 正文不改（append-only 口径同 2.12.4） | 本节 |
| 🟡2 | 异步轨的「炸得响」= 进程退出，未写 | 「异常外逸不接」补异步轨：`settleAsyncEntry` 在 `thincoder-core/agent-tools/advisor-async.mjs:445-453` 的 `.finally(...)` 回调里调 `onAccounting`；`thincoder-core/agent-tools/async-settle.mjs:293` 的 `onAccounting?.(parent, entry)` 外层零 `try/catch`、派生 promise 无处理器 ⇒ throw = `unhandledRejection` ⇒ `thincoder-cli/bin/thincoder.mjs:107-108` → `handleFatal` 写崩溃记录 + `exitSoon(1)`（`:103`）⇒ **进程退出，不是一条回给调用方的报错**。「不得补 catch 后继续」保留（先例 = `thincoder-core/agent-tools/advisor-settle.mjs:165-169` 的 catch → `logEvent` 后继续） | `docs/core/design/ADVISOR-GUARDS.md` §1.1 触发条件 1 第三条 bullet · §10 `A-AG23`（**已落**） |
| 🟡3 | 同档两套行号指同一行给两种含义（§1.1「写槽（`:171-182`）、`run.open = false`（`:188`）」vs 2.13.2「`:188` `const boundBatch`」） | 取 **刷新到 as-of 实读**（不取「删号」：同段其余坐标仍按行号引，只删一处会造出两套口径）。as-of 2026-11-02 实读：函数入口 `:162` · 参数守卫 `:163-165` · 未完成闸 `:167-174` · 回显闸 `:180-183` · `const boundBatch` `:188` · 裁定闸 `:220-224` · 写槽 `:239-240` · `run.open = false` `:256`；并写明「落笔以符号锚为准」 | 同档 §1.1 先例行 · 触发条件 2 · 判定位置段（**已落**） |
| 🟡4 | 机检形读法跑不起来（字段无初值 ⇒ `.size` 先抛 TypeError） | `agent._engDesignTokens.size` → `agent._engDesignTokens?.size ?? 0`（与 2.8 判据 2 同一读法）。依据 = `thincoder-core/agent.mjs:64-66` 逐字「no field initializer」，创建点 = `thincoder-core/agent-tools/design-token.mjs:239` 的 `??=`、在 throw 点 `:188` 之后；夹具里显式种一张空 Map 亦成立 | 同档 §1.3 U-6 行 · §10 `A-AG23`（**已落**） |
| 🔵5 | 提示面终稿第三行仍携「does not block the review」 | 删该半句，改无条件步骤（逐字终稿见 2.14.1）；落笔方 = eng-coder（提示面属产品代码，设计席不写） | 本档 2.14.1（列此备核） |
| 🔵6 | 触发条件枚举漏未完成闸 | §1.1 触发条件头补三条早退（顺序即判据位置）：参数守卫 `:163-165` ∥ 未完成闸 `:167-174` ∥ 回显闸 `:180-183`；任一早退 ⇒ 本门零判、不 throw、零签发——「宿主截断 + 未绑」这一形是正常的「评审未完成」拒签，不是接线故障 | 同档 §1.1 触发条件头（**已落**） |

#### 2.14.1 提示面终稿（取代 2.13.1 的第三行；目标态 ∥ 理由 ∥ 边界三件不变）

**落笔坐标** = `thincoder-core/prompts/persona-engineering.md` 的 `## Review convergence` 节第 280–281 行：两句并一句，原两句整段删除。

```text
- Design review: **`batchDoc` is required** (the batch record path) — a review without it is refused at launch and nothing is sent.
  Why: the review's conclusion only counts once it is written into that record's §3, and the token the review mints is closed by the same record. A review with no batch mints a token nothing can close — the authorization goes out and never comes back, riding the 7-day TTL and nothing else.
  No batch record in flight ⇒ create one first, `batch({action:"create", …})` — one command; the record is the premise of the review, not paperwork. The reviewer thereby gets the `batch` tool write channel to write the findings table + VERDICT + counts **verbatim** into §3.
```

**与 2.13.1 的唯一差别**：第三行删掉「that does not block the review」——那句仍是「不阻塞」读法，模型只读这一行时可被读成许可（评审轮次 3 🔵5）。目标态（首行 `refused at launch and nothing is sent`）∥ 理由（`Why:` 行）∥ 边界（第三行 = 无条件步骤，一条命令）三件不变。

#### 2.14.2 实现面待落清单（本批终稿的完整面，交 eng-coder）

| 面 | 坐标 | 终稿 |
|---|---|---|
| 工具描述 | `thincoder-core/tool-docs/advisor.md:3` | 2.4 行 4 |
| 属性描述 | `thincoder-core/agent-tools/advisor.mjs:85` | 2.4 行 5 |
| 类型门用途行 | `thincoder-core/advisor/notice.mjs:81` | 2.4 行 6 |
| 入口注释 | `thincoder-core/agent-tools/advisor.mjs`（插入点同笔、居其上方） | 2.4 行 7 + 2.11 🔵13 的单值插入点 `advisor.mjs:114` |
| 提示面 | `thincoder-core/prompts/persona-engineering.md:280-281` | **2.14.1**（取代 2.13.1） |

## §3 设计评审（评审子代理）
**状态行**：评审通过



### 轮次 1（评审子代理）

**评审对象** = 批档 §2 设计（准入收紧：`advisor(type=design)` 未携 `batchDoc` ⇒ 拒发）。

**范围五档**：

- `docs/batches/2026-11-02-review-requires-batch.md`
- `docs/core/design/BATCH-RECORD.md`
- `docs/core/design/ADVISOR-GUARDS.md`
- `docs/core/requirements/ENGINEERING-MODE-V2-SPEC-REVIEW-CREDENTIAL.md`
- `docs/core/requirements/NORMAL-MODE.md`

**五问判答（摘要）**

- **A 两处拒是否都必要**：准入门有场景——批档 §1 依据表「六枚槽全部 `batch=—`、`live`、挂了 5.6–5.7 天」（两次 `subagent(action:'design-slots')` 实读）。
  结算臂的承重事实「两条绑定传递通道（`callbacks.batchDoc` ∥ 池条目 `run.batchDoc`）」只在批档 §2.3 出现一次；`docs/core/design/ADVISOR-GUARDS.md` 只认 `run.batchDoc` / `resolved.run.batchDoc`，无代码原文引用。
  六枚 `batch=—` 的读数无法区分「没带」与「带了没挂上」⇒ 见 #1。
- **B 删「未绑 ⇒ 不适用」是否误伤代码评审**：不误伤。类型门枚举闭合（`docs/core/design/ADVISOR-GUARDS.md` §2「**判定枚举（闭合——三条判据名）**」）；代码评审不进 `settleDesignReview`（同档 §7 契约二「`no_credential` | **设计专属**（凭证面——代码轨不可达）」）⇒ 无「既非设计也非代码」的无主情形。
- **C 五处坐标 / NORMAL-MODE 那句**：区分立得住——三门是模式化强制面（token 门 / spawn 门 / 写文件门），评审工具只有一套、参数契约不分模式。
  补的半句（「评审工具的 `batchDoc` 参数契约收严不在此列」）对 `batchDoc` 够用，但它只落一面 ⇒ 见 #10。
- **D 集成面**：除 17-2，还有 `docs/core/design/ADVISOR-GUARDS.md` §12 自述的驱动面 `advisorTool.execute({ type: "design", async: false, documents }, …)`（**不携 `batchDoc`**）所支撑的故事 6 四行 6-1–6-4 ⇒ 见 #4。
- **E 旧账推翻**：批档 §2.5 四列表足用（旧判据逐字 / 当时的判据 / 今天为何不成立 / 推翻后变了什么），另有句「两笔旧账的历史记录按原样保留（批档是过程档，不回改）；**规范面只写今天成立的那一条**」；住批档（记录面）不犯 R2。

| # | Category | Severity | Issue | Suggestion |
|---|---|---|---|---|
| 1 | Branch provenance (6b) | 🔴 | 结算面 `no-batch-binding` 臂没有场景。批档 §2.3 给的是结构论证（「接线一断，只挡准入就无人报错」）+ 六枚 `batch=—` 槽，但同一条读数也完全由「没带 batchDoc」解释（§1 依据表正如此归因），**读数无法区分两个错因**；全档无该臂的观测（数据/日志/用户报告）或复现路径。需求侧也只写拒发（`docs/core/requirements/ENGINEERING-MODE-V2-SPEC-REVIEW-CREDENTIAL.md` ② 第 6 条「`advisor(type=design)` 未携 `batchDoc` ⇒ 拒发」），该行为改动无条目、无 AC 覆盖。 | 二选一：给出该臂的场景（生产形复现路径，或「绑定没到实例」的一次实读/日志）并纳入批档 §2.3 依据表；或撤掉该臂，把 `run.batchDoc` 为空当程序不变量（throw / 断言），不做带拒文的拒发分支。若保留，需求侧补条目 ∥ AC 覆盖「带了但绑定没到实例」，并补一档异步轨（`async: true`）验收——绑定正走另一条通道。 |
| 2 | Document ownership | 🔴 | 同机制两处两种说法：`docs/core/design/ADVISOR-GUARDS.md` §1.2 边界句「普通模式批无设计评审 ⇒ 不可达」vs `docs/core/design/BATCH-RECORD.md` §4.16「**收口评审对接口（V3 假阳面消解）**：普通面收口评审 = **设计评审通道**（`advisor` `type:"design"`…）」+ `docs/core/requirements/NORMAL-MODE.md` F-N2.3「**收口一次**走文档规范化 + 独立评审」。普通面恰恰有设计评审，且本批之后它不携 `batchDoc` 就拒发——该句在本批之后载着错误事实，而批档 §2.6 五处坐标未含它。 | 改写该句到本批之后成立的形态，或将其登记为批档 §2.6 的待改坐标并给出判据：普通面收口评审走设计评审通道 ⇒ 须先有批档并携 `batchDoc`。若坚持「不可达」，须说明普通面哪一步不产生设计评审。 |
| 3 | Document ownership | 🔴 | 同一行的两份文本：`docs/core/design/ADVISOR-GUARDS.md` §2 类型门「**逐字**」块仍写「pass documents=[...] (the explicit list) — plus batchDoc **when a batch record is in flight**」，而批档 §2.3 ③ 判「任何条件式的「有批次档在飞时必传」都在教旧做法」、§2.4 行 6 已把同一行在 `thincoder-core/advisor/notice.mjs:81` 改成必填式。改一处留一处 ⇒ 本批之后「拒文/判据的单源档」（批档 §2.2「**单源**：准入门判据与拒文住 `docs/core/design/ADVISOR-GUARDS.md` §2 第 4 条」）自己教旧做法。 | 把 §2 类型门逐字块的该行与 §2.4 行 6 逐字对齐，并把该坐标补进批档 §2.6 坐标表——这与 §2.4 行 6 是同一行，不是新判据。 |
| 4 | Integration-test design | 🔴 | 破行答案不全。`docs/core/design/ADVISOR-GUARDS.md` §1.3「**破行（改写）**」只列 10-1 ∥ 10-4，批档 §2.7 测试面只列 `test/integration/advisor-record-gate.test.mjs` 的 17-2。但同档 §12「**用例设计（实现面——四条用例怎么搭）**」自述驱动面 = `advisorTool.execute({ type: "design", async: false, documents }, { agent, _toolCallId: "t<N>" })`（不携 `batchDoc`）：6-1 断言「回执非拒（无 `scope-not-doc`）」+「假端点收 **1** 个请求」、6-2/6-3/6-4 断言 `criterion=scope-not-doc` ∥ `reason=no-project-root`——新门位于「类型门之后、文档范围解析之前」，`batchdoc-missing` 抢先 ⇒ 这四行必红或断言不可达。所在测试档不在批档 §2.7 表内（具体档名本次范围不可读 ⇒ unverified）。 | 把故事 6 的 6-1–6-4 纳入破行清单：夹具补可读 `batchDoc` 并列出所在测试档；或在档内登记「本批改变拒因优先级：`batchdoc-missing` 先于 `scope-not-doc` / `no-project-root`」并给出这四条的改写形。 |
| 5 | Clarity | 🟡 | 编号碰撞：`docs/core/design/ADVISOR-GUARDS.md` §2 同时存在「**4. 类型门（F30——顶层 `type` 必填 + 声明一致性校验 · fail-closed）**」与新增「4. **设计评审必携批档（准入门——AC-M6-6）**」，后者还排在「**5. 对象标识行（F31——三类文案单源）**」之后；三处指针「§2 第 4 条」（同档 §1.1 触发条件 1、`docs/core/design/BATCH-RECORD.md` §4.2、§2 本条内）各有两解，而新增条目「最相近先例」又把类型门写成「类型门（§2 第 2 条 …）」。 | 一条判据的判据与拒文全靠「§2 第 N 条」定位 ⇒ 给新条目一个不冲突的号并同步全部指针；同时把先例行里的「§2 第 2 条」对齐到该条实际号。 |
| 6 | Affected-file tier check | 🟡 | 批档 §2.7 只有「**层级结论**：不跨层——准入判据住工具入参层，兜底住结算层…」——回答的是架构分层，不是文件层级；全表没有一句「哪些文件跨 500/800 线（或都不跨）」。项目自己的体例是先写贴线结论（`docs/core/design/BATCH-RECORD.md` §4.17「**贴线判（500 软线 / 800 硬限）**：…⇒ **零拆分义务**」）。 | 补一行结论：逐源/测试文件（`advisor.mjs` ∥ `design-token.mjs` ∥ `notice.mjs` ∥ 两个测试档）判是否跨线，跨者附拆分计划，都不跨就明写「都不跨」。**限制**：代码面不在本次评审范围，我无法量行数（unverified）。 |
| 7 | Survey evidence / precedent | 🟡 | 新增条目无「公开源核查」行（`docs/core/design/ADVISOR-GUARDS.md` §1.1 有「**公开源核查**：项目声明 `PROJECT-MANIFEST.json` 的 `index.publicRepos` = `[]` ⇒ 无公开源档可查（已查无）」），批档 §2 也无「勘察证据」行（`docs/core/design/BATCH-RECORD.md` §4.17 / §4.18 有体例）；「最相近先例」有实现坐标 + 设计档节 + 对齐/偏差理由，但缺先例批坐标（`docs/core/design/ADVISOR-GUARDS.md` §12 有「先例批 = #921」）。 | 在新增条目内补一行公开源核查（结论是「无相关」也照记）与先例批坐标；不另起文件。 |
| 8 | Existing piece | 🟡 | 新拒因字面 `criterion=batchdoc-missing`（`docs/core/design/ADVISOR-GUARDS.md` A-AG26 ∥ §2 逐字块 ∥ §2.4 行 4/6/7）没有三问答案（住哪 / 逐字名 / 谁），而同档 §1.1 为三个新字面写了「**拒因命名三问**：… **none found**：查 `thincoder-core/**` 的既有拒因词表…」。 | 给 `batchdoc-missing` 补一行三问（`existing: …` / `none found: …` / `existing but unusable: …`），查面与同档 §1.1 同（`criterion=` 枚举 + `_advisorRefusals` 判据名）。 |
| 9 | Document ownership (state) | 🟡 | 需求档 ① 仍写「唯一微调 = 评审对象清单来源改读 manifest `docRoot`」，而 ② 已有两处微调（「**（微调一）评审对象来源 = manifest `docRoot`（声明面）**」+「**设计评审必绑批档（本模块第二处微调 …）**」）——同档两处说法不一致；批档 §1「**需求面已落（父侧笔，本轮）**」只记 ②/④ 三处，没记 ①。 | 把 `docs/core/requirements/ENGINEERING-MODE-V2-SPEC-REVIEW-CREDENTIAL.md` ① 的「唯一微调」同步成两处形态（或改为指向 ② 的第二处），并把 ① 补进批档 §1 的需求面落笔清单。 |
| 10 | Document ownership | 🟡 | 收严的豁免句只落一面：`docs/core/requirements/NORMAL-MODE.md` §5.6「**评审工具的 `batchDoc` 参数契约收严不在此列**」已落，而设计侧孪生句 `docs/core/design/BATCH-RECORD.md` §8 边界 10「不新增工程机械门到普通面（设计令牌 ∥ spawn 强制 `batchDoc` ∥ 写文件门禁——三者在普通面**不新增**…）」无对应半边；另批档 §2.6 ③ 仍判「**不改**」、§2.10 上抛项 2 仍写「待父侧裁」，与该句已落不同拍。 | 把 §2.6 ③ 的结论与 §2.10 #2 更新为「约束不变、已补一句豁免」；并判断 `docs/core/design/BATCH-RECORD.md` §8 边界 10 是否同补同句，否则下一轮易把「spawn 强制 `batchDoc` 不移植」读成「`batchDoc` 参数不强制」。 |
| 11 | Document ownership | 🟡 | `docs/core/design/ADVISOR-GUARDS.md` §1.2「**兜底来源不触发本门（残余，如实登记）**：… 残余面 = 「批档写进 `documents`、不传 `batchDoc`」的调用形…」——本批之后该调用形在准入门即被拒发，不再是可达调用形（正是 KD2 要撤的那类陈述），批档 §2.6 坐标表未含它。 | 与同档 §1.1 同批处置：删掉或改写该残余登记，说明「批档写进 `documents`、不传 `batchDoc`」这条形已被准入门关闭。 |
| 12 | Acceptance | 🔵 | `AC-M6-6` 的机检面是 `subagent(action:'design-slots')` 计数，批档 §2.8 判据 2 的机检读 `agent._engDesignTokens?.size ?? 0`——同一事实两个读面，档里未说哪个权威。 | 指明单测读的是槽存储本体、与外显清点同源（或补一条外显清点验收格）。 |
| 13 | Clarity | 🔵 | 门位坐标不一致：批档 §2.3 ① 给相对位置（「类型门之后、文档范围解析之前」），§2.4 行 7 给注释坐标 `thincoder-core/agent-tools/advisor.mjs:174-177`；而同档 `docs/core/design/ADVISOR-GUARDS.md` §12 记类型门在 `:90`、拒发返回 `:93`、design 拒发块在 `:114-146`（代码面本次不可读 ⇒ unverified）。 | 给实现面一个插入点坐标，注释坐标另行标注，避免实现席按 `:174-177` 落块。 |

**计数**：🔴 4 · 🟡 7 · 🔵 2（共 13）。
**限制**：本次范围无项目标准档、无文档地图 ⇒ 方法学与归属面按 Project Guide + 判据判；代码/测试档不在范围内，凡涉源码事实均标 unverified。

VERDICT: changes-required

### 轮次 2（评审子代理）

**评审对象** = 批档 §2 设计（准入收紧：`advisor(type=design)` 未携 `batchDoc` ⇒ 拒发）——第 2 轮，只核上轮 13 条 + 修正带出的新问题。

**范围五档**：

- `docs/batches/2026-11-02-review-requires-batch.md`
- `docs/core/design/BATCH-RECORD.md`
- `docs/core/design/ADVISOR-GUARDS.md`
- `docs/core/requirements/ENGINEERING-MODE-V2-SPEC-REVIEW-CREDENTIAL.md`
- `docs/core/requirements/NORMAL-MODE.md`

**五问判答（摘要）**

- **A**：①不可达成立——准入门在文档范围解析之前，异步面「只取 `.resolved.values()`」⇒ 同吃该门；②`throw` 由谁接住（父侧 ∥ 异步结算）、用户看到什么，全档未写，代码面不可读 ⇒ `unverified`；③§1.1 与 `A-AG23` 已无「对外拒因值」措辞（`不设对外拒因值` ∥ `无对外拒因值`），**但残留另在两处**（见 #1）。
- **B**：6-2 ∥ 6-3 ∥ 6-4 在点火前就被拒 ⇒ 补可读 `batchDoc` 不改其命中的判据与 `requests.length === 0`；6-1 三条断言（无 `scope-not-doc` ∥ 假端点收 1 个请求 ∥ 含固定文本）仍成立，唯一变化 = 该例此后也进 `§3 落地门`；6-5 的断言不在任何在范围档内 ⇒ `unverified`（见 #16）。
- **C**：两面同义同射程——需求侧「**评审工具的 `batchDoc` 参数契约收严不在此列**……是两件事」∥ 设计侧「**同句的另一半**……**不在此列**……`spawn` 强制 `batchDoc` 仍为工程专属」⇒ 已对齐（#10 关闭）。
- **D**：2.11 点名了 2.1 ∥ 2.3 ① ∥ 2.4 行 7 ∥ 2.7 测试行 ∥ 2.10，**没点名 2.8**（验收表仍认证退场行为，见 #1）；2.6 的两处「已落」声称未实落（见 #15）。
- **E**：§2.5 四列表 + 「两笔旧账的历史记录按原样保留（批档是过程档，不回改）；**规范面只写今天成立的那一条**」——够用，且住记录面不犯 R2。

| # | Orig# | File | Severity | Status | Notes |
|---|---|---|---|---|---|
| 1 | 🔴1 | `docs/batches/2026-11-02-review-requires-batch.md` ∥ `docs/core/design/ADVISOR-GUARDS.md` | 🔴 | Unfixed | 改法落了主面，但两处活字仍认证已退场的拒因分支：批档 2.8 判据 5「结算面：`run.batchDoc` 空 ⇒ `passed:false` 且回执含 `no-batch-binding`、槽零写」，与 2.11 自己的裁定「`no-batch-binding` 退场，不进需求条目、不进 AC」相反；同档 §1.3 单测表 U-6 格仍写「结算时无绑定 ⇒ `no-batch-binding` 零签发」，而同档 §1.1 已写「`settleDesignReview` 入口断言并 **throw**……**不设对外拒因值**」。2.11 的取代清单不含 2.8 ⇒ 验收表会把被裁掉的行为认证成验收项。 |
| 2 | 🔴2 | `docs/core/design/ADVISOR-GUARDS.md` | Fixed | 边界句已改：「普通面收口评审走同一条设计评审通道（`docs/core/design/BATCH-RECORD.md` §4.16）⇒ 本门对普通批同判，发起前须先有批档并携 `batchDoc`（未携 ⇒ 准入门拒发）。」 |
| 3 | 🔴3 | `docs/core/design/ADVISOR-GUARDS.md` | Fixed | 逐字块已对齐必填式：「`• type="design"` — design review: reviews design / requirement documents; pass documents=[...] (the explicit list) and batchDoc — required, the batch record this review belongs to.」，条件式半句零残留。 |
| 4 | 🔴4 | `docs/core/design/ADVISOR-GUARDS.md` ∥ 批档 | Fixed | §12 破行已补：「**破行（夹具——准入门带来的拒因优先级）**：6-1 ∥ 6-2 ∥ 6-3 ∥ 6-4（所在档 `test/integration/review-doc-scope.test.mjs`，同档 6-5 同形）……处置 = **夹具补可读 `batchDoc`**（四例断言逐字不变）；拒因优先级事实同档登记」。 |
| 5 | 🟡5 | `docs/core/design/ADVISOR-GUARDS.md` | Fixed | 新条目改号「**6. 设计评审必携批档（准入门——AC-M6-6）**」，排在 5 之后；指针同步：「判据 = §2 第 6 条」∥ 先例行「类型门（§2 第 4 条 …）」∥ `docs/core/design/BATCH-RECORD.md`「判据 / 拒文 = `docs/core/design/ADVISOR-GUARDS.md` §2 第 6 条」。 |
| 6 | 🟡6 | `docs/batches/2026-11-02-review-requires-batch.md` | Fixed | 结论已在 2.11 行内（`281 · 269 · 142 · 120 · 187` ⇒ 「**都不跨，零拆分义务**」）；但落点列写的「本档 2.7」并无该行（见 #15）。 |
| 7 | 🟡7 | `docs/core/design/ADVISOR-GUARDS.md` | Fixed | 「**先例批**：查 `docs/batches/**` 的逐字 `typeGateCriterion` 零命中……」+「**公开源核查**：项目声明 `PROJECT-MANIFEST.json` 的 `index.publicRepos` = `[]` ⇒ 无公开源档可查（已查无）。」两行在位。 |
| 8 | 🟡8 | `docs/core/design/ADVISOR-GUARDS.md` | Fixed | 「**拒因命名三问**：`batchdoc-missing` —— **none found**。查面 = …… `criterion=` 枚举……· `_advisorRefusals` 判据名 · `settlementCriterion` 值集」，且已并入 `criterion` 枚举行。 |
| 9 | 🟡9 | `docs/core/requirements/ENGINEERING-MODE-V2-SPEC-REVIEW-CREDENTIAL.md` | Fixed | ① 已改：「**两处微调**：① 评审对象清单来源改读 manifest `docRoot`……② 设计评审必绑批档（见 ② 第 6 条）」，与 ② 的「（微调一）」∥「（本模块第二处微调 ……）」对得上。 |
| 10 | 🟡10 | `docs/core/design/BATCH-RECORD.md` | Fixed | 设计侧半边已落：「**同句的另一半**：设计评审的 `batchDoc` 参数契约收严（未携即拒发）**不在此列**——评审工具只有一套，模式不改变它的参数契约；spawn 强制 `batchDoc` 仍为工程专属（需求面同句 = `docs/core/requirements/NORMAL-MODE.md` §5.6）。」 |
| 11 | 🟡11 | `docs/core/design/ADVISOR-GUARDS.md` | Fixed | 残余条已改写：「原「批档写进 `documents`、不传 `batchDoc` ⇒ 本门不适用」的残余面**已由准入门关闭**：该调用形在 `advisor` 入参门即被拒发（§2 第 6 条）」。 |
| 12 | 🔵12 | `docs/core/design/ADVISOR-GUARDS.md` | Fixed | A-AG26 已写权威面：「**槽数读面单源 = `agent._engDesignTokens`**（槽存储本体；`subagent(action:'design-slots')` 清点读同一 Map——`thincoder-core/agent-tools/design-slots.mjs:38` 实读）」。 |
| 13 | 🔵13 | `docs/core/design/ADVISOR-GUARDS.md` | Fixed | 已给单值插入点：「**落点坐标（实现面单值）**：插入点 = `thincoder-core/agent-tools/advisor.mjs:114`……注释与插入点同笔、居其上方，**不另立坐标**」。 |
| 14 | (new) | `docs/core/design/BATCH-RECORD.md` | 🟡 | New | 同一句的第三份副本仍条件式：§6.2 锚表「\| A7 \| **调用侧句**（有批次档在飞时发起设计评审必须传 `batchDoc`）\| 纪律层发起评审节 \|」，而 §4.5 已改「**调用侧**：设计评审**一律必传 `batchDoc`**」。本批 §2.3 ③ 判「任何条件式的「有批次档在飞时必传」都在教旧做法」，2.6 坐标表未收此格。 |
| 15 | (new) | `docs/batches/2026-11-02-review-requires-batch.md` | 🟡 | New | 2.11 声称的本档落笔有两处未实落：2.6 仍题「### 2.6 五处新增坐标逐条判（不动也是结论）」且只有 ①②③④⑤ 五格（无类型门逐字块那格），③ 的判仍为「**不改**」；2.7 仍只有「**层级结论**：不跨层——准入判据住工具入参层，兜底住结算层……」（无贴线判行）。 |
| 16 | (new) | `docs/core/design/ADVISOR-GUARDS.md` §12 ∥ 批档 2.11 | 🔵 | New | 「同档 6-5 同形」是全档对 6-5 的唯一记载 ⇒ 其断言面不可核（`unverified`）；另 6-1 补 `batchDoc` 后同例也进 `§3 落地门`（挂载面 = §4.3），三条断言不受影响但回执会多一条记录面标记。 |

**计数**：本轮 = 上轮 13 条中 Fixed 12 · Unfixed 1（🔴1）· New 3（🟡2 · 🔵1）。
**限制**：代码 / 测试档不在本次评审范围，凡涉源码与用例事实均 `unverified`；本次范围无项目标准档、无文档地图 ⇒ 方法学与归属面按 Project Guide + 判据判。

VERDICT: changes-required

### 轮次 3（评审子代理）

**评审对象** = 批档 §2 设计（准入收紧：`advisor(type=design)` 未携 `batchDoc` ⇒ 拒发）——第 3 轮，只核两件：① 上轮 🔴1（验收表落后于裁定）是否真闭；② 小轮新增两条（断言位置 / 异常外逸）。代码面本轮可读（不在限制内）。

**范围三档**：

- `docs/batches/2026-11-02-review-requires-batch.md`
- `docs/core/design/ADVISOR-GUARDS.md`
- `docs/core/design/BATCH-RECORD.md`

**① 逐问核（四问全实读）**

- **§1.3 的 U-6 格还提不提 `no-batch-binding`**：不提。现文为「结算面程序不变量：实例无批档绑定 ⇒ `settleDesignReview` **throw**（串含 designId）、零槽写、不返回判决、无对外拒因值」，并带复现形与反断言。
- **批档 2.8 判据 5 的旧字**：正文仍在档（§2 append-only，字节未改）。但 2.12 的「本节口径」逐字引原判据 5 并写「作废原判据 5」，同表 🔴1 行给出改判（程序不变量 throw）与新机检形——**不是只说「以本节为准」**。2.13 不涉 2.8。
- **批档 2.7 受影响文件表的 `design-token.mjs` 行**：2.12.4 逐字引用该行旧字并给改读（「『跳过本门』的旧分支与 `no-batch-binding` 一并退场」）。
- **全档第三处**：`no-batch-binding` 共 5 处——2.1 条目表 · 2.3 ① 表 · 2.7 该行 · 2.8 判据 5 · 2.9 KD2。前四处各被 2.11 / 2.12 / 2.12.4 点名覆盖；**2.9 的 KD1 ∥ KD2 无任何后续节点名**（见 #1）。设计档两档全文零 `no-batch-binding`。

**② 逐条判**

- **断言位置 = `boundBatch` 判定处、早于 `set(...)`**：对。`thincoder-core/agent-tools/design-token.mjs:188` 的 `boundBatch` 早于 `:240` 的 `agent._engDesignTokens.set(run.designId, designToken)`。
- 且 `:188` 在未完成闸（`:167-174` 早退）与 M1 回显闸（`:180-183` 早退）之后 ⇒ **自我纠正成立**（落函数入口会盖掉未回显时的既有 M1）。
- **异常外逸**：两处结算调用点皆无 `try/catch`——`thincoder-core/agent-tools/advisor-settle.mjs:155` 直调 ∥ `thincoder-core/agent-tools/advisor.mjs:265` 直调（`thincoder-core/agent/dispatch-run.mjs:118-122` 是 `try/finally`，无 catch）。
- **该条不冗余**：紧邻就有 catch-and-continue 先例（`advisor-settle.mjs:167-169` catch → `logEvent` 后继续），实现面照抄即成空壳。但**异步轨的落点未写**（见 #2）。
- **`A-AG23` 机检形能不能真跑**：能——`settleDesignReview` 是导出函数，已有三档集成用例直调（`test/integration/advisor-record-gate.test.mjs` ∥ `batch-close-token-consume.test.mjs` ∥ `batch-status-auto-set.test.mjs`）；但 U-6 复现形的槽计数读法会先抛 TypeError（见 #4）。

**另请确认一件（分工与终稿）**

- **分工**：对。提示面归 eng-coder 有档内依据——`docs/core/design/BATCH-RECORD.md` §8 边界 2「不写提示词实体（内容依据 = 机制文档，落笔 = eng-coder）」∥ `docs/core/design/ADVISOR-GUARDS.md` §11「不写实现代码」。
- **提示面现状**：实读 `thincoder-core/prompts/persona-engineering.md` 第 280–281 行**仍是原两句逐字**（`must pass batchDoc` ∥ `an in-flight design review without a batch record is **not blocked**`）⇒ 声明的「一行都没写」成立。
- **终稿是否给了下一步**：给了（第三行 `create one first … one command`），不是只说不行——仅一处措辞残留见 #5。

| # | Category | Severity | Issue | Suggestion |
|---|---|---|---|---|
| 1 | Doc-state residue（①-Q4） | 🟡 | `docs/batches/2026-11-02-review-requires-batch.md` 2.9 两行仍把结算面写成带拒因的分支——逐字「| KD2 | 删「未绑 ⇒ 本门不适用」，改为 `no-batch-binding` 照拒 |」∥「| KD1 | 两处设口（准入 + 结算），两个错因两句话 |」——而 2.11 的裁定是「撤分支，改程序不变量」。2.11 点名 2.1 / 2.3 ①，2.12 点名 2.8，2.12.4 点名 2.7，**无一节点名 2.9**。§2 即任务书（`docs/core/design/BATCH-RECORD.md` §1「B11 **§2 即任务书**」），照 KD2 落笔就复活被裁掉的分支。 | 追加一行点名 2.9：KD1 ∥ KD2 已由 2.11 🔴1 ∥ 2.12 取代——结算面无拒因、无文案，是程序不变量 throw。只补取代关系，不改 2.9 正文（append-only 口径同 2.12.4）。 |
| 2 | Acceptance / 行为事实（②-Q2） | 🟡 | 「异常外逸不接」只写到结算面，**异步轨的落点与后果未写**：`thincoder-core/agent-tools/advisor-async.mjs:445-453` 的 `settleAsyncEntry(parent, entry, { onAccounting: () => settleAdvisorRun(parent, entry) })` 位于 `.finally(...)` 回调内且派生的 promise 无处理器 ⇒ 该 throw 变成 `unhandledRejection`。 | 在 `docs/core/design/ADVISOR-GUARDS.md` §1.1 触发条件 1 与 `A-AG23` 补一句异步轨后果（throw 从结算回调外逸 ⇒ 进程级 `unhandledRejection` ⇒ 进程退出），并保留「实现不得补 catch 后继续」的约束。 |
| 3 | Clarity（坐标漂移） | 🟡 | 同一档内两套坐标对同一行号给了两种含义：`docs/core/design/ADVISOR-GUARDS.md` §1.1「写槽（`:171-182`）、`run.open = false`（`:188`）」∥ 批档 2.13.2「`:188` `const boundBatch = …`」。按 as-of 本轮实读，`:171-182` 是 M1 回显闸区段、`:188` 是 `const boundBatch`、写槽在 `:239-240`、`run.open = false` 在 `:256`。相对次序句仍真、符号锚也真，但按行号落笔会把断言插到档自己禁止的位置（M1 之前）。 | 把 §1.1 判定位置段的行号刷新到本轮实读值，或删号只留符号锚（§2 第 6 条已写「符号锚为准」），两套坐标不要并存。 |
| 4 | Acceptance executability（②-Q3） | 🟡 | U-6 复现形的槽计数读法跑不起来：`agent._engDesignTokens` **无初值**（`thincoder-core/agent.mjs` 逐字「single-value `_engDesignToken` mirror retired (AC3 零写) — no field initializer」），其创建点在 `thincoder-core/agent-tools/design-token.mjs:239` 的 `??=`，**在 throw 点 `:188` 之后**。 | 最小夹具 agent 上 `agent._engDesignTokens.size` 先抛 TypeError，「错串含 designId」的断言因错因错位而红。U-6 复现形 ∥ `A-AG23` 机检形改用与批档 2.8 判据 2 同一读法（`?.size ?? 0`），或夹具里显式种一张空 Map。 |
| 5 | Prompt face（终稿措辞） | 🔵 | 终稿第三行逐字「No batch record in flight — that does not block the review: create one first, …」沿用「does not block」的读法；批档 2.12.1 已裁「原句整句删除」。后半句（`the record is the premise of the review`）能纠回来，但模型只读这一行时「不阻塞」可被读成许可。 | 去掉「that does not block the review」半句，直接写无条件步骤（没有批档 ⇒ 先 `batch({action:"create", …})` 一条命令），其余三件（目标态 / 理由 / 边界）保留。 |
| 6 | Clarity（触发条件枚举） | 🔵 | §1.1 把前置写成「触发条件（两件）」，但代码在 `boundBatch` 判定处之前有**三条**早退：`:163-165` 参数守卫、`:167-174` 未完成闸、`:180-183` M1。未完成闸未入枚举 ⇒ 「宿主截断 + 未绑」这一形按现文读不出（实为正常的「评审未完成」拒签，零槽写、不 throw）。 | 在触发条件 1 的括注补一句：未完成闸亦在断言之前 ⇒ 该形不 throw、不签发；或把「两件」改成「三处早退 + 一件前置」的枚举。 |

**计数**：🔴 0 · 🟡 4 · 🔵 2（共 6）。

**上轮 🔴1**：按其实质（验收表认证被裁掉的分支）**已闭**——2.8 判据 5 被逐字点名作废并给出新机检，§1.3 U-6 格改判 throw，两档规范面零 `no-batch-binding`；余留的 2.9 KD1 ∥ KD2 见 #1（裁决记录面，非验收面）。

**边界**：本轮按派单只核两件——条目表 ∥ 测试面 ∥ §2 第 6 条判据未复核（2.13.3 自述零改，采信）。

**限制**：本次范围无项目标准档、无文档地图 ⇒ 方法学与文档归属按 Project Guide + 判据判；本轮源码与提示面均已实读，无 `unverified` 项。

VERDICT: pass

## §4 用户批准（主 agent）

**状态行**：用户批准 · 2026-11-02（设计评审 pass 后批准进入实施）

- **批准对象** = 本档 §2 的设计：准入面 `advisor(type="design")` 必携 `batchDoc`；结算面 `run.batchDoc` 空 ⇒ `settleDesignReview` throw。
- **依据** = §3 末行 `VERDICT: pass`；通过之后才签发设计 token。
- **批准确实发生的证** = §5 已执行：无批准则 token 不可得，eng-coder spawn 被门机械拒。
- **用户原话在本轮上下文中未保留，不引用、不编造** —— 只记事实与依据。

## §5 实施记录（eng-coder）
**状态行**：实施完成（五处落笔 + 三条读数 + 测试面全绿（12/12）；审计 1 轮 1 修、代码评审 1 轮 pass（0 🔴 / 🟡1 已修 / 🔵2 交父侧））



### 5. 实施记录（eng-coder）

**任务书** = 本档 §2（含 2.11 / 2.12 / 2.13 / 2.14 / 2.14.1 / 2.14.2 全部修正轮）· **本轮零新语义**：只把 §2 已裁的判据落到代码与测试。

#### 5.1 五处落笔（逐处：改了什么 · 档 · 逐字）

| # | 档 | 改了什么 | 逐字（落盘文本） |
|---|---|---|---|
| 1 | `thincoder-core/agent-tools/advisor.mjs` | 新增准入门判据 + 拒文族 + `_advisorRefusals` 登记；插入点 = `const reviewType = args.type` 之后、文档范围解析之前（2.11 🔵13 的符号锚）；同笔改属性描述与绑定处注释 | 判据：`if (reviewType === "design" && missingBatchDoc(args.batchDoc)) {`；首行：`Advisor: launch refused — a design review must carry \`batchDoc\`: the batch record this review belongs to. ${identity}`；标识行：`criterion: "batchdoc-missing"` · `round: "—"`；属性描述起句：`Design review only, REQUIRED: the batch record this review belongs to` |
| 2 | `thincoder-core/agent-tools/design-token.mjs` | 结算面「未绑 ⇒ 跳门」改**程序不变量 throw**；旧条件分支与 `no-batch-binding` 一并退场（判据 2 的 `if (batchSrc)` 也随之解开）；函数头 `@remarks` 改新口径 | `const boundBatch = typeof run?.batchDoc === "string" && run.batchDoc.trim() ? run.batchDoc : null` → `if (!boundBatch) {` → `throw new Error(\`design review settled with no batch-record binding ( ?? "(none)"}) …\`)` |
| 3 | `thincoder-core/tool-docs/advisor.md` | 第 3 行条件式改必填式（2.4 行 4） | `Pass \`documents=[...]\` and \`batchDoc\` — the batch record this review belongs to. **\`batchDoc\` is required**: a design review without it is refused before launch, because the token it would mint has no batch to close it.` |
| 4 | `thincoder-core/advisor/notice.mjs` | 类型门用途行同步必填式（2.4 行 6，与设计档逐字块单源） | `• type="design" — design review: reviews design / requirement documents; pass documents=[...] (the explicit list) and batchDoc — required, the batch record this review belongs to.` |
| 5 | `thincoder-core/prompts/persona-engineering.md` | `## Review convergence` 节第 280–281 行两句整段删除，换 2.14.1 三行终稿（不用 2.13.1） | 首行：`- Design review: **\`batchDoc\` is required** (the batch record path) — a review without it is refused at launch and nothing is sent.`；第二行 `Why:`；第三行 `No batch record in flight ⇒ create one first, \`batch({action:"create", …})\` — one command; …`（「that does not block the review」半句已无） |

**门首行（拒文首行逐字，实跑输出）**

```text
Advisor: launch refused — a design review must carry `batchDoc`: the batch record this review belongs to. [type=design · scope=docs/core/design/D.md · round=— · criterion=batchdoc-missing]
```

#### 5.2 三条读数（父侧要求，实跑）

临时读数脚本（系统临时目录，未入仓）驱动真工具：假 SSE 端点零外网。

```text
① 回执首行： Advisor: launch refused — a design review must carry `batchDoc`: the batch record this review belongs to. [type=design · scope=docs/core/design/D.md · round=— · criterion=batchdoc-missing]
① 回执行数： 6 · 含 batchdoc-missing： true
① 拒发登记 _advisorRefusals.has： true · 零实例： true
② 槽数 before → after： "design-slots: 0 slot(s) — 0 live / 0 expired" → "design-slots: 0 slot(s) — 0 live / 0 expired" · 相等： true
③ 回执不以拒发开头： true · 模型请求数： 1
③ 回执首行： No findings — clean pass.
③ 槽数 before → after： "design-slots: 0 slot(s) — 0 live / 0 expired" → "design-slots: 0 slot(s) — 0 live / 0 expired"
```

**②的读面** = `subagent(action:'design-slots')` 的同一实现（`executeDesignSlotsAction`），与 2.8 判据 2 的 `.size` 同源（2.11 🔵12）。**③另证**：评审消息未载 `batchDoc` 字面（`false`）——绑定的到达面是挂载的 `batch` 工具，不是提示正文，与改动前一致（非回归）。

#### 5.3 测试改动与结果

| 面 | 改了什么 | 命令 | 结果 |
|---|---|---|---|
| 本批单测（新建，收口即删） | `docs/batches/2026-11-02-review-requires-batch.test.mjs`：判据 1 四形态（缺 / null / 空串 / 纯空白）∥ 判据 1 附带（拒因优先级）∥ 判据 3（携可读档照常进下一道判据）∥ 判据 4（代码轨不受本门约束）∥ 判据 5（结算面 throw，按 2.12 裁定，反断言禁 `passed:false`） | `node --test docs/batches/2026-11-02-review-requires-batch.test.mjs` | 5 tests / 5 pass |
| 集成 17-2（改写） | 断言改判据后必红的旧行为：拒发首行 ∥ `criterion=batchdoc-missing` ∥ 两期望形 ∥ 建档下一步 ∥ 拒发登记 ∥ 槽数不变 ∥ 零实例 ∥ spawn 机械拒 | `node --test test/integration/advisor-record-gate.test.mjs` | 2 tests / 2 pass |
| 集成 6-1–6-5（只补夹具） | 夹具补可读 `batchDoc`（绝对路径形，workspace 锚同用）；**五例断言逐字未动**；档头登记「`batchdoc-missing` 先于 `scope-not-doc` ∥ `no-project-root`」事实（设计档 §12 破行条要求） | `node --test test/integration/review-doc-scope.test.mjs` | 5 tests / 5 pass |
| 邻面回归 | `review-standards-injection` ∥ `batch-close-token-consume` ∥ `batch-status-auto-set`（三档都直调结算 / 走设计评审通道，均携 `batchDoc` ⇒ 新 throw 不破行） | `node --test test/integration/review-standards-injection.test.mjs test/integration/batch-close-token-consume.test.mjs test/integration/batch-status-auto-set.test.mjs` | 7 tests / 7 pass |

**集成索引**：`test/RTM.md` 的 `17-2` 行改写为「不带 `batchDoc` ⇒ 当场拒发、槽数不变、零实例、零 LLM、spawn 机械拒」，`异常` 列载「修前红」；故事 17 的 `目的` / `节注`（两态行序 + 交互组件 + 机制单源）同笔同步。**未新增集成行**（本批改的是既有行的业务可观察结果）。

#### 5.4 审计与代码评审轮次（终态 = clean）

| 轮 | 面 | 结果 | 处置 |
|---|---|---|---|
| 1 | 内部 explore 偏差审计（对照 §2） | 机械四类（缺项 / 静默简化 / 文档漂移 / 批外改动）全清；**1 条**措辞漂移：`tool-docs/advisor.md` 第 3 行多带 `(the explicit list)`，与 2.4 行 4 的逐字终稿不符 | **Fixed**：删该三词，对齐 2.4 行 4 |
| 1 | 内部 advisor 代码评审（type=code） | pass · 0 🔴 · 🟡1 · 🔵2 | 🟡1 **Fixed**（见下）；🔵2 / 🔵3 见 5.5 |

**🟡1 修法**：`test/integration/advisor-record-gate.test.mjs` 的回合夹具原带 `run.batchDoc ? … : null` 假分支与注释「未绑批档 ⇒ 基线 null（无对象可判，本门不适用）」——正是 §2.5 行 2 撤掉的旧读法。改法 = 删假分支，夹具恒绑 `batchDoc`（未绑已是接线故障而非夹具形态），注释改为今天的语义；改后重跑该档 2/2 与 6-1–6-5 5/5 全绿。

**终态**：`clean`（审计 1 轮 + 代码评审 1 轮，均无未修 🔴；收尾后复跑 12/12 绿）。

#### 5.5 交父侧的两条（未改，按笔域与已裁口径）

- **🔵 设计档行号漂移**：`docs/core/design/ADVISOR-GUARDS.md` §1.1 / §10 `A-AG23` 记的 as-of 行号被本次插入的注释块顶偏（`const boundBatch`、写槽、`run.open = false` 三处符号位置下移）。该档自带「落笔以符号锚为准」，实现面零错 ⇒ 只作 doc hygiene，**设计席笔**，请父侧路由。
- **🔵 `resolveBatchDocPath` 文案**：其两条 throw 仍以「没批档就别传」收尾，在设计评审面已不可行（省略即拒发）。批档 §2.9 KD4 已明示不动该文案（四处调用点共用）⇒ **登记不改**。

#### 5.6 边界

**未碰**：TTL ∥ consume 语义 ∥ spawn 门 ∥ §3 词表 ∥ 批内评审既有行为 ∥ `resolveBatchDocPath` ∥ `batchDocBases` ∥ `docSetKey` ∥ 批归属派生。**批外改动**：无（九档全在 2.7 / 2.11 / 2.14.2 的清单内；读数脚本在系统临时目录，未入仓）。

**5.1 行 2 的逐字更正**（写入侧把模板插值段吃掉了，该格不完整，按代码原文补正）：

- 错串首段逐字（字面）：`design review settled with no batch-record binding ( ——其后的插值表达式是 `run?.designId` 配缺省 `"(none)"`；
- 错串尾段逐字（字面）：`) — a design review is launched with ` + `` `batchDoc` `` + ` required, so settling without it is a wiring fault, not an input to report.`
- 位置不变：该 `throw` 在 `const boundBatch = typeof run?.batchDoc === "string" && run.batchDoc.trim() ? run.batchDoc : null` 之后、写槽 `agent._engDesignTokens.set(run.designId, designToken)` 之前（同格前半段）。

## §6 验证与收口（父代理）

**状态行**：验证通过 · 2026-11-02（重启后实测三条 + 单测 5/5 + 集成 2/2）

### 6.1 重启后实测（进程 11:18 起，新模块在内存）

| 读 | 动作 | 结果 |
|---|---|---|
| 不携 `batchDoc` 发设计评审 | `advisor(type="design", documents=[…])`，不传 `batchDoc` | **拒发** · `criterion=batchdoc-missing` · `round=—` · `Nothing was sent: no review instance, no round consumed, no design token minted, no LLM call.` |
| 携 `batchDoc` 的正面路 | 同日 #17 ∥ #18 ∥ #21 ∥ #22 四次设计评审 | 均正常启动并签发 token ⇒ 本门不误伤 |
| 本批单测 | `node --test docs/batches/2026-11-02-review-requires-batch.test.mjs` | **5/5 pass**（判据 1∥2 · 1 附带 · 3 · 4 · 5） |
| 集成用例 | `node --test test/integration/advisor-record-gate.test.mjs` | **2/2 pass**（17-1 · 17-2） |

**重启前那条「没拦住」的成因已查明**：进程启动 09:47 早于代码落盘 10:22 ⇒ 进程内是旧模块。
**⇒ 重启后拦住了。本条结论不再挂 `unverified`。**

### 6.2 交回的两条 🔵

- **设计档行号漂移**（`docs/core/design/ADVISOR-GUARDS.md` §1.1 ∥ §10 `A-AG23`，被插入的注释块顶偏）⇒ 入台账，归设计档下一轮；本档不修（设计席笔）。
- **`resolveBatchDocPath` 文案** ⇒ **登记不改**：§2.9 KD4 已明示四处调用点共用该文案，改它等于动四个调用面的对外措辞；批准依据在，不重开。

### 6.3 本批单测档

**已删**（读数列在 6.1；`Delete on use` —— 收口即删，档不留可执行件）。

### 6.4 台账

`#1987`：在途 → 待核销 → 已核销。
