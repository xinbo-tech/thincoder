# Advisor 评审链边缘守卫（ADVISOR-GUARDS）· 设计

> 板块：advisor 评审链——**边缘守卫族**：不完整判定族 · 凭证链启动/全程守卫 · 类型门（顶层 `type` 必填 + 声明一致性）· 对象标识行（文案单源）· 引文解析候选链 · 参照形态判据（提示词第 13 条）· 预算硬墙与提示 · 冻结窗口 · 同步面记账 · 失败结算结论 · 预算跟随模型窗口 · 估算加权 · 设计评审准入门（`batchDoc` 必填）。
> 收敛协议本体（轮次 / 会话隔离 / prior / citations / guard / 响应表 / 需求契合 / 行数核查）= `docs/core/design/ADVISOR-CONVERGENCE.md`——本档不重述（D2 单一权威源）。
> 需求层指针 = `docs/core/requirements/ADVISOR-CONVERGENCE.md`（该板块需求档——现状绝对路径）。
> 判据指针：归属与命名 = `docs/core/design/DOC-SYSTEM.md` §5.1 / §6。
## 1. 不完整判定族（A 族——单谓词）

**判定信号 = 宿主尾族（截断尾 + 机械失败尾）**（宿主生成，唯一确定性来源；模型自报“未完成”属自然语言——**不纳入**，语义判据边界不动）。

**谓词（单源）**：`advisorIncompleteMarker(text) → kind | null`——**块首行**逐字前缀（六 kind）：

| kind | 行前缀（逐字） | 生成点 |
|---|---|---|
| `context_limit` | `Advisor: context window limit reached (N tokens).` | `thincoder-core/advisor/compaction.mjs:98` |
| `turn_cap` | `Advisor: stopped after 100 tool rounds` | `thincoder-core/advisor/loop.mjs:119` |
| `timeout` | `Advisor: review timeout after {S}s.` | `thincoder-core/advisor/loop.mjs`（另两处同判）；尾文案居 `thincoder-core/advisor/compaction.mjs` |
| `empty` | `Advisor: empty response — review was inconclusive` | `thincoder-core/advisor/loop.mjs:197` |
| `interrupted` | `Advisor: interrupted.` | `thincoder-core/advisor/loop.mjs:98`（另 :186 同判） |
| `review_failed` | `Advisor: review failed` | `thincoder-core/advisor/run.mjs:195`（catch 内字符串 resolve——不 throw） |

**匹配规则**：**块首行扫描**（按空行分块，逐块取首行 trim 后测前缀）——时间线渲染以空行连接时间线与尾 ⇒ 六条尾均以块首行形态落地（`review_failed` 为独立返回串 = 文本首行）；
**不得**只测首行（既有失败串锚只认 `^` 前缀，即漏「时间线 + 尾」形态）。
**负向精度**：引文中同串的**非块首形态**（围栏内行 / 表格行 / 引用行）**不得**判 incomplete；块首裸行引用同串的残余误报方向安全（fail-closed——多付一轮重跑，如实登记）。

**三个消费点（同谓词）**：

1. **设计结算**：`incomplete` 非空 ⇒ **一律 `passed:false`**——剥除全部凭证回显 → 追加未签发提示（逐字见下）→ 不写槽、不关实例（可重评）。
2. **代码完成守卫**：结算的失败判决用同谓词——截断/失败评审不置「评审已覆盖」位。
3. **报告提示**：结算输出携带提示 + 恢复指引（父侧据此决定重跑范围）。

**未签发提示（逐字——机器可 grep）**：

```text
评审未完成——token 未签发 (review incomplete — no design token issued; reason: {kind})
以更小范围重跑设计评审（逐档 / 逐节拆分，或拆到两次评审），或调大 agent.advisor.timeoutMs 后重试；补充检查未完成的部分不得按已核处理。
```

**边界**：正常通过路径（无截断尾 + 凭证回显）；prior 存储规则不变（评审形态输出仍可作 round 2+ 的 prior——提示随文可见）。同步路径的 prior 镜像：未完成时覆写为**清洗后**输出（防未注册凭证进 prior）。

### 1.1 结算点记录面判据（§3 落地门——同族：未完成即不签发）

**最相近先例**：同一函数的两道既有拒签闸——§5.2 裁定闸（`thincoder-core/agent-tools/design-token.mjs:220-224`）∥ 未完成闸（同档 `:167-174`）。对齐 = 同一返回形 `{passed:false, output}`、同一恒定标记形态、同一「槽零写 + 实例保持 open」处置；偏差 = 本闸要读一次批档（前两闸只用手上已有的回执文本），因此把「读的失败」也纳入判据（`batch-unreadable`）。

**公开源核查**：项目声明 `PROJECT-MANIFEST.json` 的 `index.publicRepos` = `[]` ⇒ 无公开源档可查（已查无）。

**触发条件（两件，都写在判据前置上，不靠实现时记得跳过）**——两件之前另有三条早退，顺序即判据位置：① 参数守卫（同档 `:163-165`：无 token ∥ 非串）② 未完成闸（`:167-174`）③ 回显闸（`:180-183`）。任一早退 ⇒ 本门零判、不 throw、零签发——「宿主截断 + 未绑」这一形因此是正常的「评审未完成」拒签，不是接线故障。

1. **绑了批档（程序不变量——不是拒发分支）**——`run.batchDoc` 非空（`batchDoc` 参数经 `resolveBatchDocPath` 解析出的绝对路径，落在 `resolved.run.batchDoc`）。设计评审必携 `batchDoc`（准入门，判据 = §2 第 6 条）⇒ 结算面上「未绑」不再是可达调用形，只能是绑定没传到实例的接线故障 ⇒ `settleDesignReview` 在 `boundBatch` 判定处断言并 **throw**（串点名设计评审实例无批档绑定 + designId；位置见下条——不是函数首行：未回显时既有 M1 先判，触发条件 2 在前），零槽写、不返回判决、**不设对外拒因值**。为什么不是带拒文的拒发分支：没有场景的拒发分支就是给没发生过的情形配文案（本批 🔴1 裁定）——接线 bug 该炸得响，不该伪装成一条给用户看的拒因。
   - **断言位置 = 槽写之前**：判据在 `boundBatch` 判定处，早于写槽——`thincoder-core/agent-tools/design-token.mjs:188` `const boundBatch = typeof run?.batchDoc === "string" && run.batchDoc.trim() ? run.batchDoc : null`；写槽在 `:240` `agent._engDesignTokens.set(run.designId, designToken)`。异常落在槽写之后 = 没拦：token 已在槽里，授权照发。
   - **异常不许在结算面被接住后继续**：结算调用点 `thincoder-core/agent-tools/advisor-settle.mjs:155` `const settled = settleDesignReview(agent, run, entry.designToken, result, { incomplete })` 外面没有 `try/catch`（邻近唯一的 try 包的是 `:166` 的 `persistEngTokens(agent)`）。实现若补一个 catch 后继续 ⇒ 控制流落到 `set(...)` ⇒ token 照签、不报错、只留一条日志：机制成空壳，且比跳门更隐蔽。
   - **异步轨的后果 = 进程退出，不是一条回给调用方的报错**：`settleAsyncEntry` 在 `thincoder-core/agent-tools/advisor-async.mjs:445-453` 的 `.finally(...)` 回调里调 `onAccounting`（→ `settleAdvisorRun` → `settleDesignReview`）；`thincoder-core/agent-tools/async-settle.mjs:293` 的 `onAccounting?.(parent, entry)` 外层无 `try/catch`，且该 `.finally` 派生的 promise 无处理器 ⇒ throw 变 `unhandledRejection` ⇒ `thincoder-cli/bin/thincoder.mjs:107-108` 的 `process.on("unhandledRejection", …)` → `handleFatal` 写崩溃记录 + `exitSoon(1)`（`:103`）。**这是有意的**：接线故障要炸得响；紧邻就有 catch-and-continue 先例（`thincoder-core/agent-tools/advisor-settle.mjs:165-169` 的 catch → `logEvent` 后继续），照抄即空壳。
2. **回显有效 token**——结算已过回显闸（同档 `:180-183`）。未回显 ⇒ 走既有 M1 拒签，记录面零判（连凭据本身都没有，报「记录不合格」会把真因盖掉）。

**判据（两条，第二条只在签发路径上判）**：

1. **§3 写进了本轮的轮次块**（**无条件**——两种判决都判）——§3 段内轮次块数 **> 点火基线**。基线 = 评审实例绑定批档时读该档记下的 `run.section3BlocksAtStart`；块计数与模板正则单源 = `countRoundBlocks(src)` ∥ `ROUND_HEADING_RE`（`thincoder-core/agent-tools/batch-skeleton.mjs` 导出；写入面 `thincoder-core/agent-tools/batch.mjs` 的私有 `ROUND_HEADING_RE` ∥ `roundCount` 改取同一导出）。块数不增 ⇒ 本轮一字未写进 §3。**changes-required 轮同判**：打回的评审，其发现正是修正轮的输入——比 pass 轮更需要落在档上。
2. **§3 状态行 = `评审通过`**（只在签发路径上判——裁定闸判 pass 之后）——读**段级**状态行 `readSectionStatusWord(src, 3)`（`batch-skeleton.mjs:194`；词表 `STATUS_WORDS[3].done`；旧字面 `评审完成` **只在读侧等义**（`STATUS_WORD_ALIASES[3]`——`batch-skeleton.mjs:49` 注释：写侧词表零别名，旧字面写不进去、词表外拒）——同档 `:42-55`）。**读面与写面同形**：状态行只有段级一处写面（`updateSectionStatusLine`，同档 `:164-182`——段内首个 `**状态行**：` 行原位改写，缺则插在段头之后）——写这个字的是工具：`append §3` 那一笔随裁定行置位 ∥ 重置（单源 = `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` §2.5）；`status` 动作是同面上的可选手写口，评审身份不必用。轮次块只由工具戳 `### 轮次 N（评审子代理）` 标题、块内无状态行落点 ⇒ 读「块内状态行」是读一行没人写的字，判据会退化成永假。该段级读也**正是下游判据读的那一处**（`§5` 写入门 `thincoder-core/agent-tools/batch-closeout.mjs:105`）——另读一处即成第二真源（D2）。

**判定位置**：`settleDesignReview`（`thincoder-core/agent-tools/design-token.mjs:162`）——**两次评估、一次读档**。

读档 + 判据 1 嵌在回显闸（`:180-183`）之后、裁定闸（`:220-224`）之前。判据 2 用同一次读档的结果，嵌在裁定闸之后、写槽（`:239-240`）、`run.open = false`（`:256`）、`settleAdvisorRun` 落盘之前。本节行号 = as-of 2026-11-02 实读；落笔以符号锚为准（`const boundBatch` ∥ `agent._engDesignTokens.set(` ∥ `run.open = false`）。

同步轨与异步轨同调此函数（`advisor.mjs` 结算调用点 ∥ `advisor-settle.mjs:155`），无第二处实现。

**失败形态**：`{passed:false}` + 恒定标记（机器可 grep；reason 三值）：

```text
评审记录不合格——token 未签发 (review record incomplete — no design token was issued; reason: no-section3-block | status-not-passed | batch-unreadable)
补写该批档 §3（发现 + VERDICT —— 状态行由工具随块落）后重跑设计评审；未补写不得按已核处理。
证据：{evidence}
```

**第三行条件在**——`evidence` 非空才出（单源 `thincoder-core/agent-tools/design-token.mjs:136` `REVIEW_RECORD_MARK`）；空 ⇒ 整行不出。各判据的证句：`no-section3-block` = 「§3 轮次块 N 块、点火基线 M 块——本轮未写进 §3」（`:209`）· `batch-unreadable` = `批档读不到: <code>`（`:197`）或「点火基线缺失（批档在点火时不可读）」（`:203`）· `status-not-passed` 同形携当前状态词。

槽零写、`run.open` 不翻（补写 §3 后可重评——块与状态行同轮到位）。`settlementCriterion`（§7）不新增判据值——本闸与裁定闸同形：标记即回执，不进失败结论块。**两拒的射程**：`no-section3-block` 与 `batch-unreadable` 落在裁定闸之前 ⇒ changes-required 轮也会拿到它们；`status-not-passed` 只在签发路径上出现。

**拒因命名三问**：`no-section3-block` ∥ `status-not-passed` ∥ `batch-unreadable` —— **none found**：查 `thincoder-core/**` 的既有拒因词表（`settlementCriterion` 值集 `no-pass-line` ∥ `changes-required` ∥ 六 kind；`criterion=` 枚举；`_advisorRefusals` 判据名），无同义既有名可复用 ⇒ 三个新字面，形态沿既有英短横分词，落 `reason=` 位、不进 `criterion` 枚举。

**pass 与 changes-required 由谁给出**：判决值来自结算侧已有的裁定闸 `verdictGateFailure`——对回执里的 `VERDICT:` 行做整行逐字判定（`thincoder-core/agent-tools/design-token.mjs:109-117`），**不解析评审正文**，与 F-A13「不解析评审正文判定 pass」同向。本门只读**状态行字面**，不产生第二处判决。

**词表不补 changes-required 字面**：§3 只留一个完成词 `评审通过`——`changes-required` 不写状态词（「评审没通过」= 评审未完成，`batch-skeleton.mjs:50-52` 逐字登记）。

**changes-required 的结算形态**：判据 1 照判（未写 §3 ⇒ `no-section3-block` 拒签，回执点名）；判据 2 不参与。裁定闸早退 ⇒ 槽零写、实例保持 open ⇒ 修正轮在同一实例上推进轮次（F-A1 / F-A2 零改）。

**批档读不到（点火 ∥ 结算两个时点）⇒ reason = `batch-unreadable`，照拒。复现路径**：绑 `batchDoc` 起一次设计评审 → 回执含 token 回显与 `VERDICT: pass` → 结算前把该批档移走（或改成不可读）→ 结算 ⇒ 回执含 `batch-unreadable`、零签发、槽零写、实例仍 open；恢复该档后同实例重评可过。第二形 = 点火时档已不可读 ⇒ 基线 `null` ⇒ 同一 reason。判据方向 = 「绑了批档却验不了记录」不得当「没有记录要验」（与 §10 同向）。

### 1.2 为什么判定点必须在这里（检查点定位判据——同类检查照此判）

**判据一：门在状态产生处，不在后果显形处。** 授权（token / 槽）在 settle 产生；§3 是评审结论在批档上的落地。两者在这一拍都是「刚产生的东西」，比对得出真伪。下游的 `§5` 写入门与核销机检判的是同一事实，但那一刻 coder 的工作已经做完、拒的是别人的劳动。

**判据二：位置对不对，看拒绝时能不能把状态退回去。** settle 时拒绝 = 不签发、不写槽、实例保持 open ⇒ 补一行 §3 即可重评，成本一轮。派发后拒绝 = 一次 spawn + 一次白写 §5 全文（本仓已发生两例：评审交卷未写 §3，实施席写完 §5 被门拒绝，整段重写）。

**判据三：判据只用手上已有的事实。** `run.batchDoc` 是同一评审实例上的绑定值，与结算同栈可读。判据若另取一个来源（反查台账、扫盘找「在飞的批」），它就成了第二个真源，两个来源迟早不一致。

**判据四：不适用的边界写成前置条件，不写成心情。** 未绑批档必须在判据的**条件**上表达（`run.batchDoc` 非空），不能靠「实现时记得跳过」——后者在第一次重构时消失。

**边界**：不改 `batch.mjs` 的段白名单（评审本就该写 §3，问题不是权限）；不动 `§5` 写入门与核销机检（第二道线保留）；不动 token TTL 语义；普通面收口评审走同一条设计评审通道（`docs/core/design/BATCH-RECORD.md` §4.16）⇒ 本门对普通批同判，发起前须先有批档并携 `batchDoc`（未携 ⇒ 准入门拒发）。

- **兜底来源只供归属派生，不供本门触发**：批归属可由 `docSetKey` 里的批档兜底派生（单源 = `docs/core/design/DESIGN-TOKEN-SETTLEMENT.md` §10），而本门只认 `run.batchDoc`——需求 F-A13 的字面即 `batchDoc`，把 `documents` 里的批档也算触发面 = 同一事实两个触发判据。
- 原「批档写进 `documents`、不传 `batchDoc` ⇒ 本门不适用」的残余面**已由准入门关闭**：该调用形在 `advisor` 入参门即被拒发（§2 第 6 条）⇒ 不存在「绑定的门开、槽却带归属」的可达情形。
- **段级状态行不携带「哪一轮写的」——由打回重置收口（2026-10-28）**：判据 2 仍读段级字面，但打回那一轮不再把上一轮的 `评审通过` 留在档里——`batch` 的 `append §3` 带打回裁定行且写之前状态行 = `评审通过` ⇒ 同一笔写盘里重置为 `进行中（第 N 轮打回）` + 本轮块首留痕行。对称的另一半 = 通过那一轮：同一笔 `append §3` 只携 pass 裁定行且写前状态行 ≠ `评审通过` ⇒ 同一笔置成 `评审通过`，无留痕行（块自己就是那条记录）。下游 `§5` 写入门（`thincoder-core/agent-tools/batch-closeout.mjs:105`）因此读到的是「评审未完成」。判据 / 形态单源 = `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` §2.5。
- **无裁定行的那一笔（拒面判据已定，代码随本批落）**：打回那一轮的文本连裁定行都没有（设计凭证侧判 `no-pass-line`）⇒ 打回重置不触发，`§3` 留上一轮的 `评审通过`。触发面**不**扩——工具手上只有文本，无从区分「打回」与「补记散文」，扩面就是按意图猜。
  洞由 `§5` 写入门堵上（判据 / 拒文已定，代码随本批落）：门除状态词外，还要求 `§3` 最近一轮轮次块**自己**携 pass 裁定（判据 2 / 拒文 `R-G2b` = `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` §2.6）。
  所以「写 `§3` 要带裁定行」是任何一笔的必做，补记与打回同一条处置——写一行裁定的代价与补记一段散文相同。

### 1.3 集成验收（起点 = `test/RTM.md` 故事 17「评审没写进批档就不算过」——delta 三答）

| 编号 | 组件间交互 | 业务可观察结果 | 入口 | 回指 |
|---|---|---|---|---|
| 17-1 | 结算面（`settleDesignReview`）⟷ 批档 §3 读写 ⟷ spawn 门 | 带 `batchDoc` 的设计评审回 pass 但 §3 未写 ⇒ 无 token、回执含 `review record incomplete`；同 designId 的 eng-coder spawn 被机械拒；补写 §3 后重评 ⇒ 签发 | 父侧发设计评审（工程模式 depth-0）→ 读回执 → 派 eng-coder | F-A13 · A-AG22 |
| 17-2 | 准入面（`advisor` 工具入参门）⟷ 槽清点 ⟷ spawn 门 | 不带 `batchDoc` 的设计评审 ⇒ 拒发：回执点名 `batchDoc` 必填；跑前跑后槽数不变；随后 eng-coder spawn 因无授权被机械拒 | 父侧不带 `batchDoc` 发一次设计评审 → 读回执 → 清点槽 | AC-M6-6 · A-AG26 |

- **破行（改写）**：10-1 ∥ 10-4——两行的夹具都以 `batchDoc` 起评审并断言「签发一枚槽」，而本门落地后夹具必须让该评审把 §3 写进批档（轮次块携 `VERDICT: pass`——状态行由工具随块置位），否则签发面被本门挡住、断言不可达。改写只动夹具，断言逐字不变（单源 = `docs/core/design/DESIGN-TOKEN-SETTLEMENT.md` §10 的 10-1 ∥ 10-4 行）。
- **冗余**：无——17-1（判 pass 未落地 ⇒ 拒签发）∥ 17-2（未携批档 ⇒ 拒发）判两拍，与 10-1（收口消费）∥ 10-4（清点显名）不重叠。
- **缺失**：17-1 ∥ 17-2（本门此前无行）；编号已先落 `test/RTM.md` 故事 17，用例标题照 `test('17-1 …')` 同号逐字。
- **不在本批变更面**：`batch-unreadable`（A-AG24）不单立集成行——它是同一入口下的拒形，业务可观察结果与 17-1 同形（无 token + 回执点名），差别只在 reason 值，由单测守。

**账链门（§2 第 7 条）的集成 delta**：

| 类别 | 行 | 判 |
|---|---|---|
| 零改 | 17-1 ∥ 17-2 | 17-1 全程不经工具层（直调 `settleDesignReview`、`run` 自造）⇒ 点火面不在其路径上；17-2 夹具恰恰不携 `batchDoc`（断言 = `criterion=batchdoc-missing`）⇒ 停在准入门（顺序表第 2 行），到不了账链门 |
| 破行（夹具·既有行） | 6-1 ∥ 6-2 ∥ 6-3 ∥ 6-4 ∥ 6-5（`test/integration/review-doc-scope.test.mjs`）· 24-1 ∥ 24-2 ∥ 24-3（`test/integration/review-standards-injection.test.mjs`） | 两档同因——携 `batchDoc` 走点火面、夹具无未决台账行：6-1…6-5 的批档建在 `tmpdir()` 内、不在任何项目内 ⇒ `reason=no-ledger-root`；24-1…24-3 夹具已在该例临时项目根内，缺的是台账缝与未决行 ⇒ `reason=no-pending-row`。处置见 §12「夹具处置」（断言逐字不变） |
| 零改 | 10-1 ∥ 10-4（`test/integration/batch-close-token-consume.test.mjs`） | 两例直调 `settleDesignReview`（`settleWithBatchDoc` 自造 `run`），不经点火面 ⇒ 本门不在其路径上 |
| 冗余 | 无 | 17-3 判「账不在 ⇒ 拒发」，17-1 判「判 pass 未落地 ⇒ 拒签发」——两拍不同 |
| 缺失 | 17-3 | 本门此前无行 |

**17-3（编号先落 `test/RTM.md` 故事 17——`test/**` 面不属设计席写域，父侧落笔；用例档 = `test/integration/advisor-record-gate.test.mjs`）**：

| 编号 | 组件间交互 | 业务可观察结果 | 入口 | 回指 |
|---|---|---|---|---|
| 17-3 | 点火面（`advisor` 账链门）⟷ 台账库 ⟷ 批档 | 批档的未决行已被撤（`已废弃`）⇒ 携该 `batchDoc` 发设计评审被拒发：回执含 `criterion=batchdoc-no-ledger` ∧ `reason=no-pending-row` ∧ `Record:` 读数 `unsettled: 0`；零实例 / 零 token / 零 LLM。反证格 = 另一本带未决行的批档发同调用 ⇒ 放行 | 父侧发设计评审（depth-0）→ 读回执 | E1 · A-AG27 |

**当批单测**（宿主档 = `docs/batches/2026-10-27-advisor-face-fixes.test.mjs`；验收命令 `node --test docs/batches/2026-10-27-advisor-face-fixes.test.mjs`，收口即删）。下表 = 本笔（§3 落地门）的用例；同档 U-7 ∥ U-8 属另一笔（批归属派生），判据单源 = `docs/core/design/DESIGN-TOKEN-SETTLEMENT.md` §10 的 U-BG16 ∥ U-BG8：

| # | 守什么 |
|---|---|
| U-1 ∥ U-4 ∥ U-6 | 放行面：正常签发 ∥ 补写后同实例重评放行 ∥ 结算面程序不变量：实例无批档绑定 ⇒ `settleDesignReview` **throw**（串含 designId）、零槽写、不返回判决、无对外拒因值。**复现形**：取一个已点火实例，`run.batchDoc = null` 后调 `settleDesignReview(agent, run, token, 回显 + VERDICT pass 文本)` ⇒ 断言异常外逸（错串含 designId）∧ `agent._engDesignTokens?.size ?? 0` 前后相等；读法依据 = 该字段无初值（`thincoder-core/agent.mjs:64-66` 逐字「no field initializer」），创建点是 `thincoder-core/agent-tools/design-token.mjs:239` 的 `??=`、在 throw 点 `:188` 之后 ⇒ 最小夹具上裸 `.size` 先抛 TypeError、错因错位；夹具里显式种一张空 Map 亦成立；**反断言**：不得把「返回 `passed:false`」当期望（被裁掉的分支） |
| U-2 ∥ U-3 ∥ U-5 | 判据 2 与判据 1 的拒绝：缺状态行 ∥ 状态行非 pass ⇒ `status-not-passed`；无轮次块 ⇒ `no-section3-block` |
| U-9 ∥ U-10 | 判据 1 的「本轮」与读失败：上一轮已有块 ∥ 本轮一字未写 ⇒ `no-section3-block`；点火基线 `null` ∥ 结算时档被移走 ⇒ `batch-unreadable` |
| U-11 ∥ U-12 | 射程回归：changes-required 已写 §3 ⇒ 裁定闸标记（不是记录不合格）∥ changes-required **未**写 §3 ⇒ `no-section3-block` |

**落点坐标（单源）**：读档 + 判据 1（回显闸后、裁定闸前）+ 判据 2（裁定闸后）+ 标记常量 = `thincoder-core/agent-tools/design-token.mjs`；`batchAbsPathOfRun` 两源定序导出 · 清点面 `batchOf` 取同一派生 = `thincoder-core/agent-tools/design-slots.mjs`；

导出 `ROUND_HEADING_RE` ∥ `countRoundBlocks`（读侧单源）= `thincoder-core/agent-tools/batch-skeleton.mjs`；私有正则 / 计数取该导出（写入面语义零变）= `thincoder-core/agent-tools/batch.mjs`。

绑批档时读点火基线（`run.batchDoc` 落点同拍；读不到 ⇒ `section3BlocksAtStart = null`）= `thincoder-core/agent-tools/advisor.mjs`；集成宿主 = `test/integration/batch-close-token-consume.test.mjs`（10-1 ∥ 10-4）∥ `test/integration/advisor-record-gate.test.mjs`（17-1 ∥ 17-2）。

## 2. 凭证链启动 / 全程守卫（B 族）

1. **构建自愈**（评审消息构建）：user 消息构建改为「内层构建 + 尾包」形态——设计评审且已签发凭证、而输出不含凭证信号时，**追加批准信号块**。覆盖所有出口（含代码形态分支降级态与 legacy 收敛分支），不改任何分支的既有语义。
2. **启动断言（fail-closed）**（评审发起之前）：设计评审时校验——① 本次已签发凭证（非空）；② 凭证信号逐字在请求内。违反 ⇒ 返回拒绝报告（**不发请求**）：

```text
Advisor: design review launch refused — {reason: no design token was minted | the request does not carry the approval signal}. Nothing was sent: a request that asks the reviewer to echo a token it cannot see would break the credential chain. Re-run advisor(type='design') to mint a fresh token.
```

   可见性与记账：拒绝报告前缀 = 稳定契约（同步工具面据此登记拒发；异步结算面据此不置「评审已覆盖」位）。**可达性如实注**：工具路径恒签发凭证 ⇒ 该拒绝为**直接调用方兜底**（防御纵深），正常链不可达。
3. **压缩定锚**：压缩触发时（首条 user 消息被丢弃的同一动作内）把 `pinned` 简报作为一条 user 消息**重新挂回**。`pinned` 由评审参数（非模型输出）构建，逐字形态：

```text
[review brief — re-attached after context compaction; the original review request is no longer in the context]
{对象声明块（若有）}
## Documents to Review
- {doc} — Read this file in full
{## Approval Signal 块（design + token 时）}
```

   边界：重复压缩允许重复挂回（幂等可读，不做存在性判定）；`pinned` 不含项目指南 / 方法论 / 文档地图（重内容可弃）；压缩触发阈值与 abort 阈值零改。

**4. 类型门（F30——顶层 `type` 必填 + 声明一致性校验 · fail-closed）**：点火参数顶层 `type` **必须逐字 ∈ {`"code"`, `"design"`}**——缺失 / `null` / 空串 / 非法值 / 非字符串（`args.type ∉ {"code","design"}`）⇒ **拒绝启动 + 指引**。

**冲突分支（判定句 ②）**：顶层 `type` 显式合法 ∧ `object.type`（调用方自述的评审类型——工具 schema `thincoder-core/agent-tools/advisor.mjs:49`）声明为**另一合法值** ⇒ **同拒**（判据名 `type-object-conflict`；指引两路：改顶层 `type` / 改 `object.type` 声明）——闭合「声明面与实际轨不一致」这最后一孔。
`object.type === "design"` 而顶层缺/非法的形 = 本条**自然子集**（同一判定，不另立第二条规则）。

- **判定点** = 工具层**最早**（`thincoder-core/agent-tools/advisor.mjs:90`——`typeGateCriterion` 调用，拒发返回 `:93`；先于范围判定 / 实例解析）——类型诊断优先于范围诊断（真因不被次要报错掩盖）；拒发登记 = `_advisorRefusals`（不置 called / 不耗轮次 / **零实例** / **零 token** / **零 LLM**）。
- **声明面双保险**：工具 schema 同轮增 `required: ["type"]`（同档 `parameters`）——模型侧的第一道提示；**强制仍只在判定面**（provider 不保证执行 `required`，而旧缺省路径已撤——声明与判定不互相依赖）。
- **前缀（新设——与启动断言前缀分列）**：`Advisor: launch refused`。本条拒绝**与轨无关**（缺 `type` 的 code 调用同拒）⇒ **不复用**设计专用的 `ADVISOR_LAUNCH_REFUSAL_PREFIX`
  （`Advisor: design review launch refused`，`thincoder-core/advisor/run.mjs:23`——其面 = 设计评审缺 token / 缺 Approval Signal，语义仍为设计专用）。
- **消费面**：工具层拒发走 `_advisorRefusals` 标记（不经前缀串判定）；前缀消费面 = `thincoder-core/agent-tools/advisor.mjs:250` · `thincoder-core/agent-tools/advisor-settle.mjs:147`。
- **逐字**：

```text
Advisor: launch refused — the tool call must carry an explicit type at the top level, one of the two legal values below. [type={code|design|absent|invalid} · scope={范围摘要|none} · round=— · criterion={type-missing|type-invalid|type-object-conflict}]
Why: {第二行分叉——逐字四形态见下（三判据名分支 + 对象声明追加行）}

  • type="code"   — code review: reviews the code you changed; pass paths=[...] to scope files/directories (documents=[...] adds acceptance-criteria context).

  • type="design" — design review: reviews design / requirement documents; pass documents=[...] (the explicit list) and batchDoc — required, the batch record this review belongs to.
Nothing was sent: no review instance, no round consumed, no design token minted, no LLM call.
```

   `Why:` 四形态（逐字——按判定分叉；`{received}` / `{declared}` = 实收值原样回显）：

   - `type-missing`（缺失 / `null` / 空串）：`Why: the call carried no type at the top level — an omitted type must not silently fall back to the code track (that is how a design review becomes a code review without anyone noticing).`
   - `type-invalid`（非空非法值 / 非字符串）：`Why: "{received}" is not one of the two legal values — there is no closest-match guessing and no silent fallback.`
   - `type-object-conflict`（顶层显式合法值 ≠ `object.type` 声明值——**指引两路逐字在位**：改顶层 / 改声明）：`Why: the top-level type="{received}" disagrees with the object declaration object.type="{declared}" — align them: set the top-level type to "{declared}", or change the object.type declaration to "{received}".`
   - **对象声明追加行（归位——附于未定轨两分支，仅当 `object.type === "design"` 声明在位；不是独立判据名）**：`The object declaration says type="design"; the declaration describes the review target, it does not select the review track.`

- **判定枚举（闭合——三条判据名）**：`type-missing` = 缺失 / `null` / 空串 / 纯空白串；`type-invalid` = 非空且不在枚举内的值 / 非字符串（`"Code"`、`"design "`、数字、布尔、对象、数组等）；`type-object-conflict` = 顶层显式合法值 ∧ `object.type` 声明为**另一**合法值（`object.type` 缺失 / 非字符串 / 非枚举值 / 与顶层同值 ⇒ **不触发**）。三路**同一条拒绝**（前缀 / 指引 / 登记一致），仅标识行与第二行分叉。
- **边界（勿越）**：显式 `type="code"` / `type="design"` ∧ `object.type` 未声明 / 与顶层一致 / 非枚举值 ⇒ **照常受理**（`object` 只描述评审对象，**不选轨**）；只认逐字枚举值（不做 trim / 大小写 / 近似推断）。
  **一致性校验 ≠ 让 `object` 声明块选轨**——冲突判定**不改用** `object.type` 定轨、不推断「调用方大概想要哪一轨」，只在两声明对不上时拒绝（拒因 = 声明面自相矛盾）；可比对的域 = 两个**合法轨值**，非法声明值不构成轨矛盾。
  **窄读法**：冲突域 = 两个合法轨值之间；`object.type` 为**非合法值**（`"foo"` / 数字 / 非字符串）⇒ **不构成矛盾、照常受理**（`object` 非选轨面）——本文档判定枚举与需求档括注**同射程**（无并存读法）。

  **不设内防线**（`runAdvisorReview(agent, reviewType, …)` 的位置参不属本判定面——其两条内部调用者均在工具层判定**之后**，直接调用方一律显式传值，实测零缺省；登记见 §11）。
- **调用面（F30 判定句 ③——盘点零残留 · 口径可复核）**：全仓 advisor 发起点盘点（口径命令 + 命中清单逐条 + 落笔级 + 零残留判据）。实测：提示词 / 纪律档文本**零旧缺省依赖**（advisor 调用形命中 2 处，均为槽位头注自述，非调用指令）；代码内调用点与用例 / 夹具**逐处显式 `type`**（`advisorTool.execute(` 12 处零缺省）。
- **冲突分支静态面零破坏（实测）**：三树 `*.mjs` 内 advisor 调用点**零 `object` 声明**——`object` 仅见于工具 schema `thincoder-core/agent-tools/advisor.mjs:46` 与描述 `:55`（`object.type` 的消费面 = 评审消息注入 `thincoder-core/advisor/messages.mjs:34`——只描述评审对象、不选轨）；夹具 `object: null` = 池条目字段而非调用声明 ⇒ 冲突判定只可能命中运行期自造的声明对。

**5. 对象标识行（F31——三类文案单源）**：失败结论 / 范围拒回 / 类型门拒回三类文案的**首行**载对象标识四项（承 F29）：`[type={code|design|absent|invalid} · scope={范围摘要|none} · round={N}/uncapped|— · criterion={判据名}]`。

- **统一形态**：拒回族 = **既有稳定前缀逐字 + 标识块**（前缀仍在行首——向后可搜索；F31 两句同时满足）；失败结论族 = 既有结算正文逐字下沉为块体，块首行为标识行（§7）。
- **字段**（四项）：
  - `type` = 实际评审轨（`code` / `design`）；拒回面**未定轨**记 `absent`（缺失 / `null` / 空串）或 `invalid`（非法值）；**冲突拒回**记**顶层实收值**（`code` / `design`——与 `criterion=type-object-conflict` 配对读，未定轨）；**失败结论族**记**实际评审轨**（两轨共用——§7 契约二）。
  - `scope` = 范围摘要（首路径 + `+N more`；无范围记 `none`）。
  - `round` = 拒回族记**本次发起将使用的轮次号**（**恒记 `{N}/uncapped`**——机制真相；判定先于实例解析时记 `—`）；**失败结论族记本次已结算尝试号**（与尝试表 `#` 同值——§7 契约二）。
  - `criterion` = 触发判据名（拒回族：`type-missing` / `type-invalid` / `type-object-conflict` / `scope-missing` / `scope-not-doc` / `scope-in-flight` / `batchdoc-missing`；失败族：§7 判据名表）。
- **载面（枚举闭合——四项）**：① 范围缺失（`thincoder-core/agent-tools/advisor.mjs`）
  ② 范围非法（同档——`criterion=scope-not-doc`：文档不受理 ⇒ 拒发；判据 / 文案 / 拒因三值 = §12——逐文档载「解析后绝对路径 ∥ 拒因」+ 期望形两句）
  ③ 同 scope 在跑（`thincoder-core/agent-tools/advisor-async.mjs`）④ **类型门拒回**（§2.4——缺 `type` / 非法值 / 与 `object` 声明冲突）。
- **cap 文案**：机制不产生该文案。
- **不载面（登记）**：async 误用拒回（depth>0 + `async:true`）· 启动断言拒回（无 token / 无 Approval Signal——其前缀已是稳定契约面）· 池队列 ack（非拒回）。
- **边界**：不改判定语义；不把文案扩为长报告（标识行恰一行）。

**6. 设计评审必携批档（准入门——AC-M6-6）**：`advisor` 执行体在类型门之后（§2 第 4 条）、文档范围解析之前判一条——`type="design"` 且 `batchDoc` 缺失 ∥ `null` ∥ 空串 ∥ 纯空白 ⇒ **拒发**，`criterion = batchdoc-missing`，登记 `agent._advisorRefusals`（未发起的调用不得满足「评审已覆盖」位）。

**为什么**：设计评审签出的 token 由关档收口，而关档只认批归属（`thincoder-core/agent-tools/design-slots.mjs` 的 `batchAbsPathOfRun`——`run.batchDoc` 优先、文档集批档兜底）。批外签发的授权没有第二个关闭者：spawn 只校验不消费（fix round 要复用同一 token，这是对的设计），关档消费对无归属的槽不适用，只剩父侧显式 `consume-design` 与 7 天 TTL。**⇒ 堵法不是加一个关闭者，是让这种授权根本发不出去。**

**分支依据**（每个分支一条实读，无实读的删掉）：

| 分支 | 输入 | 依据 |
|---|---|---|
| 拒（缺失 ∥ 空值） | 无 `batchDoc` 键 ∥ `undefined` ∥ `null` ∥ `""` ∥ 纯空白 | 六枚无主槽实测：`batch=—`、挂 5.6–5.7 天、无第二个关闭者（本批 §1 依据表） |
| 放行 | 携值且可读 | 既有解析单源 `resolveBatchDocPath`——批内设计评审今天照此跑，零回归 |
| 不适用 | `type="code"` | 代码评审不签设计 token，无授权可收 |
| 既有拒（不改） | 携了但不可读 | `resolveBatchDocPath` 的 `batchDoc is not a readable file: …` 文案逐字 |

**拒文（逐字）**：

```text
Advisor: launch refused — a design review must carry `batchDoc`: the batch record this review belongs to. {标识行 criterion=batchdoc-missing}
Why: the token a design review issues is closed by its batch — closing that record consumes it. A review with no batch mints a token nothing can close: it rides the 7-day TTL and nothing else. Refusing the review at launch is how that token never exists.
Expected form 1 — project-root-relative: docs/batches/<batch>-<topic>.md (resolved against the session project root).
Expected form 2 — absolute: D:\repo\docs\batches\<batch>-<topic>.md (used as-is).
No batch record in flight: create one first — batch({action:"create", …}) — one command; the record is the premise of the review, not paperwork.
Nothing was sent: no review instance, no round consumed, no design token minted, no LLM call.
```

**最相近先例**：类型门（§2 第 4 条 · `thincoder-core/advisor/notice.mjs` 的 `buildTypeGateRefusal`）。对齐 = 同一前缀 + `Why` + 两个期望形 + `Nothing was sent` 收尾 + 标识行 + 拒发登记；偏差 = 本门判据是「参数在不在」而非「值合不合法」，因此多一句可执行的下一步（没有批档 ⇒ 先建档），而不是只列两个合法值。

**先例批**：查 `docs/batches/**` 的逐字 `typeGateCriterion` 零命中、类型门 F30 的落地批坐标未登记（已查无）⇒ 先例坐标只以实现档 `thincoder-core/advisor/notice.mjs` 的 `buildTypeGateRefusal` 与本档 §2 第 4 条为准。

**公开源核查**：项目声明 `PROJECT-MANIFEST.json` 的 `index.publicRepos` = `[]` ⇒ 无公开源档可查（已查无）。

**拒因命名三问**：`batchdoc-missing` —— **none found**。查面 = `thincoder-core/**` 的既有拒因词表：`criterion=` 枚举（`type-missing` ∥ `type-invalid` ∥ `type-object-conflict` ∥ `scope-missing` ∥ `scope-not-doc` ∥ `scope-in-flight`）· `_advisorRefusals` 判据名 · `settlementCriterion` 值集——无同义既有名可复用。

**处置**：新字面，形态沿既有英短横分词，进 `criterion` 枚举（与类型门三值同面）。

**落点坐标（实现面单值）**：插入点 = `thincoder-core/agent-tools/advisor.mjs:114`（`const reviewType = args.type` 之后、`resolveReviewDocPaths` 调用之前——as-of 2026-11-02 实读；符号锚为准：`typeGateCriterion` 判定块之后 ∥ 文档范围解析之前）；注释与插入点同笔、居其上方，**不另立坐标**。

**结算面没有第二个拒发口**：准入门保证评审实例必带绑定 ⇒ 「带了但没挂上实例」是接线 bug，不是一种要体面回显的输入 ⇒ 结算面以程序不变量抛错（§1.1 触发条件 1），不设拒因值、不写拒文（本批 🔴1 裁定）。

**边界**：不改 `resolveBatchDocPath` / `batchDocBases`（`BATCH-RECORD.md` §4.15 的路径机制）· 不改 TTL ∥ consume 语义 ∥ spawn 门 ∥ §3 词表 · 批内设计评审行为零变。

**7. 设计评审必须挂着未决台账行（账链门——点火面）**：`type="design"` ∧ `batchDoc` 已解析为绝对路径且可读 ⇒ 点火拍查一次账：**该批档还有没有至少一行未决台账行的 `task_book` 指着它**。查不出「有」⇒ 拒发，`criterion = batchdoc-no-ledger`，登记 `agent._advisorRefusals`（同第 6 条：未发起的调用不得满足「评审已覆盖」位）。

**为什么补这一门**：第 6 条只要求「参数在 + 路径可读」，账侧从头到尾不问。批档说的是「活还在飞」，台账说的是「这活挂在谁名下」——中间这一段没人查，于是行被撤回 ∥ 被结 ∥ 被改挂之后，评审照发、token 照签，收口时重锚不到任何行。

**点火判据顺序（顺序即判据位置——逐对写谁抢谁）**：

| # | 判定 | 条件 | 结果 |
|---|---|---|---|
| 1 | 类型门（§2 第 4 条） | `type ∉ {code,design}` | 拒发 `type-missing` ∥ `type-invalid` ∥ `type-object-conflict` |
| 2 | 准入门（§2 第 6 条） | `design` ∧ `batchDoc` 缺失 / `null` / 空串 / 纯空白 | 拒发 `batchdoc-missing` |
| 3 | 批档可读（`resolveBatchDocPath` 既有解析） | 携了但不可读 | 既有 throw（文案逐字，§2 第 6 条「既有拒」行） |
| 4 | **账链门（本条）** | 第 3 步已得绝对路径 | 拒发 `batchdoc-no-ledger` |
| 5 | 文档范围（§12） | — | 拒发 `scope-not-doc` |
| 6 | 实例解析 / 绑定 / 签发 / LLM | — | — |

- 1 与 2 同缺 ⇒ 报 1（类型诊断优先，§2 第 4 条既有）。
- 2 与 4 同不满足 ⇒ 报 2 且**只报 2**：没有 `batchDoc` 就没有可判的档，账链门对它零判。
- 3 与 4 同不满足 ⇒ 走 3 的 throw，**不是** `batchdoc-no-ledger`：可读是账链的前提，前提坏先报前提。
- 4 与 5 同不满足 ⇒ 报 4（账是前提，文档是内容）。

**判据三件（每件给来源，不靠枚举了事）**：

- **「指着本档」怎么算**：`resolveBatchRows`（`thincoder-core/ledger-write-ops.mjs:185`——批→行集选行单源）。`task_book` 的文件部分经 `resolveDeclaredRef` 解析为与本档**同一绝对路径**；判同址、不判串等值（同一批档的三种指针写法并存，串等值会漏行）。
- **「未决」是哪几态、凭什么**：`PENDING_STATUSES`（`thincoder-core/ledger-db.mjs:134`）= 待讨论 / 待设计 / 在途 / 待核销。**判据不是「哪几态看着在干活」，是「这条账还欠一次结账」**——产品的「未决」定义已存在一处，本门复用它；另立一张表 = 第二份词表（漂移源，判据同 `BATCH-RECORD.md` D-BR19）。已核销 / 已废弃 = 归档 = 账已结 ⇒ 门拒，这正是门要拦的那一态。
- **为什么不收窄成只认「在途」**：`在途 → 待核销` 在收口之前就能发生——收口重锚把本批 `在途` 行转 `待核销`（`thincoder-core/ledger-cmd.mjs:316`），迁移表也允许单行 `ledger update` 走这一边（`thincoder-core/ledger-db.mjs:165`）。「批还开着、行已 待核销」是合法在途态（活干完、待结账），只认 `在途` 会把这一态判成无账。

**读序（单源调用，零自写 SQL、零新词表）**：

1. `const derived = resolveLedgerRoot(batchDocAbs, agent.cwd)`——根判据单源（`thincoder-core/ledger-db.mjs:96`；`target` = 批档绝对路径，`boundary` = 会话锚，同一函数的两个入参，见其 docblock「动作目标路径 ∥ 会话锚（必传）」）。
2. `const db = openLedger(derived.root, { readOnly: true, boundary: agent.cwd })`——`readOnly`（`thincoder-core/ledger-db.mjs:247` 签名含该参、`:259` 转入 `openReadOnly`）= 只读句柄 + 零 DDL / ALTER / `markSchemaVersion`：本门**不建库，也不改库**。
   `create` 缺省 false 只管「不建」，单靠它开库仍会补表补列——那是写。
3. `resolveBatchRows(db, derived.root, batchDocAbs)`——选行单源；`base` = `derived.root`（与 `assertBatchArg` 同用法）。
4. `.filter((r) => PENDING_STATUSES.includes(r.status))`。
5. `db.close()`（读句柄，`finally` 里关）。

**失败路径全落「拒」——零路径落「放行」**（每一形一条实读）：

| 形 | 实读 | 判 |
|---|---|---|
| 无项目根 | `resolveLedgerRoot` 返 `null`（`thincoder-core/ledger-db.mjs:100`） | 拒，reason `no-ledger-root` |
| 库不在盘 ∥ 非台账库 | `openLedger` 返 `null`（`ledger-db.mjs:255` 无根、`:258` `if (!existsSync(file) && !create) return null`；非台账库 = `openReadOnly` 的 items 探针 `ledger-db.mjs:221`——`readOnly: true` 才进这一支） | 拒，reason `no-pending-row`（零行可判 = 这条账不存在）；Record 行的 db 项分开报两种成因 |
| 坏档 ∥ 目录不在 | `throw new Error(\`台账库打开失败：${file}（${e.message}）\`)`（`ledger-db.mjs:226` / `:269`）∥ `项目目录不存在：…`（`:250`） | 门内 catch ⇒ 拒，reason `ledger-unreadable` |
| 读成功 | 第 3、4 步行数 | 0 行 ⇒ 拒 `no-pending-row`；≥1 行 ⇒ 放行 |

`if (!db) 放行` 是口子：它把「账读不到」判成「账不必看」。本档 §1.1 的方向相反——「绑了批档却验不了记录」照拒（`batch-unreadable`），不当「没有记录要验」。
`throw` 外逸也不是答案：点火崩在工具层，用户拿到栈而不是拒因，且 `_advisorRefusals` 不登记 ⇒ 拒发与「评审已覆盖」位混同。

**为什么门在点火这一头，不在台账那一头**：台账侧要动三处写径（`ledgerClose` ∥ `ledger update` ∥ `ledgerCloseBatch`），而它们正是既有「兜底核销」的落点——条目已实质完成、而挂靠批未收口（`BATCH-RECORD.md` §5.2 · BR-17）。门一立，这条正路当场被拒，为它开例外就等于门当场破了。台账侧还要在 DB 写径里读批档 §1 判「批是否在飞」，把文档依赖塞进事务路径。点火头只需一次读，且门落在「活有没有人挂着」这个前提本身上。

**门只判点火，不判结算**：结算面（`settleDesignReview`）保持零台账读。理由 = 评审期间批档可能被收口、行被结；而批档一收口就冻结，评审写不进 §3 ⇒ 结算面的 §3 落地门（§1.1）已经把它拦下，账链门再判一次只是同一件事的第二个口子。

**残余（已知未堵，登记在案）**：点火之后、结算之前把行撤掉 ∥ 改挂 ⇒ token 照签、本批收口重锚落空——可达径 1 / 1b / 2 在点火后同样成立。不设第二道门（见上条）。兜底面 = 收口拍：`resolveBatchRows` 取空集时父侧看到「本批零行」，`assertCloseOutProof`（`thincoder-core/ledger-close-proof.mjs:37-62`）在结账口读批档事实。这是一条已知残余，不是已堵的洞。

**两模式同判——本门不读模式位**：任何设计评审，都要有未决台账行指着它的批档；没有就拒发。工程模式与普通模式跑**同一道门、同一判据、同一拒文**，代码里没有模式分支。

**为什么不分模式**：账是给后面的事看的——没有账，收口时就不知道这活结没结、结在谁头上。普通模式**若**不装这道门，普通模式的账就会乱，而**账是同一个账**。用户的判据（2026-11-02）：**「模型不自觉可以不走挂账，不做评审，但是做了就要守规矩，否则把帐弄乱了。」**——不想挂账，那就别做评审；做了评审，就要挂。**判据是「做了没做」，不是「什么模式」。**

**这不是「给普通模式搬一道工程门」**：账这条针对的是「做评审」，那三条工程门（设计令牌 ∥ spawn 强制档绑定 ∥ 写门）针对的是「改代码」——普通模式仍然没有那三条。

判据 = `docs/core/requirements/NORMAL-MODE.md` §5.6 范围边界逐字：「评审工具只有一套，发起时要什么条件不分模式」；同段括注逐字：「**评审工具的发起判据（参数契约 + 账链）两模式同判，不在此列**」——本门正是那句括注里的「账链」。

**门恒可满足（两模式同因）**：`batch create` 是模式无关的原子动作——建档与开行同一笔（`thincoder-core/agent-tools/batch-ledger-bind.mjs:147-161`：`ledgerBindBatch` 传参里无模式位；`:119` 的 `mode` 只决定骨架取形）⇒ 正常链上本门恒放行，零回归。

**分支依据**（每个分支一条实读）：

| 分支 | 输入 | 依据 |
|---|---|---|
| 放行 | 本档 ≥1 行 ∈ `PENDING_STATUSES` | 建档原子开行（`thincoder-core/agent-tools/batch-ledger-bind.mjs:149-161`）⇒ 正常链恒满足，零回归 |
| 拒（零未决行） | 本档行全在归档态 ∥ 零行 | 可达三径见下表（1 / 1b / 2） |
| 拒（无项目根） | `resolveLedgerRoot` 返 `null`（批档不在任何已注册项目内 ∥ 会话锚外） | `thincoder-core/ledger-db.mjs:100`（`owningProject` 无归属即 `null`） |
| 拒（账读不到） | `openLedger` 返 `null` ∥ throw | `ledger-db.mjs:255` / `:258` / `:221` / `:226` / `:269` / `:250` |
| 不适用 | `type="code"` | 代码评审不签设计 token，无授权可收、无账可挂 |
| 既有拒（不改） | `batchDoc` 携了但不可读 | `resolveBatchDocPath` 文案逐字（顺序表第 3 行） |

**可达性（「行被弄走了」三条径——父侧推断，本席坐实到代码）**：

| # | 情形 | 可达径（实读） | 判 |
|---|---|---|---|
| 1 | 行被撤回 | 撤回（→ `已废弃`）不设机检（`thincoder-core/ledger-write-ops.mjs:152-166`「撤回不拦」）⇒ 在途行可直撤，批档照开 | **可达** |
| 1b | 行已核销后批档重开 | 核销由 `assertCloseOutProof` 放行（批档须已收口——`thincoder-core/ledger-close-proof.mjs:50-52`）；重开径零触台账（`BATCH-RECORD.md` §4.18-B）⇒ 收口 → 核销 → 重开三步即得 | **可达** |
| 2 | `task_book` 改挂他档 | `ledger update` 写门只判**新**指针可解析且在盘（`thincoder-core/ledger-write-ops.mjs:80-91` 臂②），不判旧批档是否在飞 ⇒ 在途行可改挂 | **可达**；后果 = 本批收口重锚取行集（`resolveBatchRows`）漏掉该行，行留在 `在途`，另一本档收口时被重锚成 `条件` |
| 3 | 批档重开后行不动 | 有意如此（`BATCH-RECORD.md` §4.18-B） | **非口子**——行仍在 `待核销`（未决）⇒ 门放行 |

**拒文（逐字）**：

```text
Advisor: launch refused — a design review needs its batch record to carry an unsettled ledger row. [type=design · scope={范围摘要} · round=— · criterion=batchdoc-no-ledger]
Why: the record says the work is in flight, the ledger says whose work it is — and no unsettled row points at this record (reason={no-pending-row|no-ledger-root|ledger-unreadable}).
Record: {batchDoc 绝对路径} — ledger base: {derived.root | —} · db: {open at <file> | not on disk at <file> | unreadable at <file> | —} · rows whose task_book resolves here: {N} (unsettled: {M}).
Fix 1 (the row was archived, still recoverable): ledger({action:"update", id:<N>, status:"在途"}) — 待核销 → 在途 是六态唯一的回退边; then ledger({action:"update", id:<N>, task_book:"<仓根相对指针>"}). Row is 已核销 / 已废弃 ⇒ that edge is gone, use Fix 2.
Fix 2 (this record is the right home, no row can come back): start a new record — batch({action:"create", …}) opens its ledger row in the same call — and launch the review under it.
Fix 3 (this record is finished): close it, and launch the review under the record that owns the work.
Nothing was sent: no review instance, no round consumed, no design token minted, no LLM call.
```

`id:<N>` 的来源 = 该批档头部 `台账 = #N` 那一行（`batch create` 写的；本批档自己就是这么来的）。指针被改挂之后按 `task_book` 查不到它，所以 id 从头部取，不从 Record 读数取。

`db:` 一项决定 Fix 1 能不能选。`not on disk`（也是 `no-pending-row` 的一种）时库里没有可改的行——`id:<N>` 取自档头也改不到，该走 Fix 2；`open` 且 `unsettled: 0`（行被撤 ∥ 被结）才是 Fix 1 的场景。两件事共用 `reason=no-pending-row`，靠这一项分开。

`—` 与 `reason=no-ledger-root` 配对读：批档不在任何项目内 ⇒ 没有库位可点名，`ledger base` 与 `db` 同时记 `—`。四形终局不变（仍拒），差别只在读数。「有根、库不在盘」是 `not on disk` 那一形，两者不混。

**最相近先例**：本档 §2 第 6 条（`batchDoc` 准入门）。对齐 = 同一 `Advisor: launch refused` 前缀 + `Why` + 可执行下一步 + `Nothing was sent` 收尾 + 标识行 + `_advisorRefusals` 登记。

偏差 = 判据从「参数在不在」进到「账在不在」，因此拒文多一行 `Record:` 读数值（让下一步可判：是行丢了，还是挂错了档）；并且判据面多一次台账读（第 6 条只读参数与文件系统）。两门的模式射程相同——都没有模式位。

**reason 为什么另立三值而不另立 criterion**：先例 = 本档 §12（`criterion=scope-not-doc` 恒定，`ambiguous-path` / `dangling-path` ∥ `outside-project` ∥ `not-doc-file` 四个 `reason` 值）——同一个拒发口、同一个修法面，差别只在「哪条前提没满足」时，用 reason 分叉而不是造三个 criterion。

**台账侧的最近先例** = `assertCloseOutProof`（`thincoder-core/ledger-close-proof.mjs:37-62`）——同为「写之前拿批档事实对一次账」，方向相反（它在结账口读批档，本门在发证口读台账）。

**先例批**：查 `docs/batches/**` 的逐字 `batchdoc-no-ledger` 只有本批 §2 自身命中 ⇒ **已查无先例批**；先例坐标只以实现档 §2 第 6 条与 `assertCloseOutProof` 为准。

**公开源核查**：`PROJECT-MANIFEST.json` 的 `index.publicRepos` = `[]`（实读）⇒ 无仓外声明源可查，已查无。

**拒因命名三问**：`batchdoc-no-ledger` —— **none found**。查面 = 既有 `criterion=` 枚举（`type-missing` ∥ `type-invalid` ∥ `type-object-conflict` ∥ `scope-missing` ∥ `scope-not-doc` ∥ `scope-in-flight` ∥ `batchdoc-missing`）∥ `_advisorRefusals` 判据名 ∥ `settlementCriterion` 值集。形态沿既有英短横分词。

**三问（新档 `thincoder-core/agent-tools/batch-ledger-link.mjs`）**：`existing: thincoder-core/ledger-write-ops.mjs · name: "resolveBatchRows" · consumers: 收口重锚（`thincoder-core/ledger-cmd.mjs`）/ `batch` 系写入`——选行判据直接复用它，不重写。

`existing but unusable: thincoder-core/agent-tools/batch-ledger-bind.mjs · name: "ledgerBindBatch" · failed on: 写面绑定 ≠ 读面判据`——它的入参是行号 + 批档、出参是写入结果，回答的是「把这行绑给这本档」，不是「有没有行指着这本档」；把读判据塞进去，会让「建档时绑行」与「点火时读账」两件事共用一个出口。

另立新档的理由 = `node:sqlite` 只能动态引（W8 契约②——`thincoder-core/agent-tools/batch-ledger-bind.mjs:124` 的 `await import("../ledger.mjs")` 同一手法），且该判据要能在无工具上下文的单测里直调。

**落点坐标（实现面单值）**：插入点 = `thincoder-core/agent-tools/advisor.mjs` 的准入门判定块之后（符号锚：`if (reviewType === "design" && missingBatchDoc(args.batchDoc))` 块之后 ∥ `const documents = args.documents || null` 之前）。

批档的绝对路径在本门就要用 ⇒ `resolveBatchDocPath` 从既有绑定行（`resolved.run.batchDoc = resolveBatchDocPath(agent.cwd, args.batchDoc)`）**提前到本门之前调一次**，绑定行复用该值（**不第二次解析**）。代码评审不走本门，绑定行对 `type="code"` 仍走原解析——行为零变。

**一处已知行为变更**（有意）：设计评审携**不可读** `batchDoc` 时，那个 throw 由「文档范围解析之后」提前到「文档范围解析之前」——文案与函数逐字零变，只是两处都坏时先报谁。理由 = 批档是本评审的前提，前提坏先报前提。

**边界**：不改台账状态机 ∥ 不改六态表 ∥ 不改 `batch close` 的重锚语义 ∥ 不改 `resolveBatchRows` 选行集 ∥ 不为「行被结后想复原」造新的台账回退边 ∥ 不做「批档一被 reopen 就自动补行」（reopen 不动台账是 `BATCH-RECORD.md` §4.18-B 的既有裁定）。

## 3. 引文解析候选链（C 族）

`verifyCitations(text, cwd, opts)`（`opts.scope` = 评审对象声明路径列表；签名向后兼容——opts 可省 ⇒ 旧行为）。

**候选根派生（纯路径，零扫描）**——对每条声明路径 `s`（cwd 相对或绝对）：

1. `cwd`（保留——绝对路径与工作区根相对路径保持不变）；
2. `segs = relative(cwd, resolve(cwd, s))` 非 `..` 开头时：**声明仓根**（`cwd/segs[0]`）与**声明文件目录 / 声明目录本身**。

**逐引文解析**：按候选顺序试 `resolve(root, file)`；命中判据三条件全中——① realpath 在 cwd 内（**围栏不变**）；② 可读；③ 该行内容包含引文**任一内容候选**（c1 原捕获 ∥ c2 反复剥「引号族（`"` `'` `“”` `「」` `『』`）+ 空白」的先导/尾随 ∥ c3 首个引号字符后段 ∥ c4 首个成对引号段内层文本——任一候选为所引行**连续子串**即中；零模糊、零内容级归一；派生候选下限 2 字符）。命中记录所用根。

**失败原因四类（报告可判）**：无任何候选文件存在 ⇒ `file unreadable`；存在但内容不符 ⇒ `content mismatch @ {解析到的相对路径}`；越围栏 ⇒ `path traversal`（不变）；
**非连续引文**（引文内容含省略号 `…` / `...` 且**全部候选未中**——缩略形，非所引行的连续子串）⇒ `not a contiguous citation (ellipsis) @ {相对路径} — quote one contiguous excerpt`——**形状不符与内容造假分列**

（省略号禁用于承担判断面）。**判定优先级：含省略号且全部候选未中 ⇒ 非连续引文类——先于 `content mismatch` 判定**（候选命中先于本分类；两表述同时成立时以此为准；判据同 A-AG16 ∥ A-AG18 ∥ F34 判定句①）。
报告头行 `[host-verified] N/M citations match current file state.` 零改；命中判据 = **装饰剥离候选集**（c1–c4——所引行**连续子串** `includes`；零模糊匹配、零内容级归一）；判定面 = 失败分类与候选构成。

**引证形状写作禁则（评审提示词面——逐字建议，内容权在主 agent）**：四面（round1 / round2 / round3 / design，各 EN ⊗ CN）Host verification / Citation 段追加：

```text
EN: Never abbreviate a quote with an ellipsis ("…" or "...") — a citation must be one CONTIGUOUS substring of the cited line;
an abbreviated quote is reported as a non-contiguous citation (quote one contiguous excerpt instead).
CN: 引证内禁用省略号（`…` / `...`）——引证必须是所引行的**一段连续子串**；缩略引文会被报为「非连续引文」（改引一段连续原文）。
```

逐字例随动（示例自身不得违规；`thincoder-core/advisor/convergence.mjs` 同笔）：

```text
run.mjs:180: timeoutId = setTimeout(...)  ⇒  run.mjs:180: timeoutId = setTimeout(() => {
```

**归宿面（不可验证 ⇒ 有结论——F28/F29 邻域，零新判定族）**：未通过机械核验的引用**不能支撑打回**（本体零改）；其条目不得悬置——每轮以明列 Status 收束（`Unfixed` 携状态 ∥ 经争议窗收口；`docs/core/design/ADVISOR-CONVERGENCE.md` §2.5），评审收尾时未验证条目逐一明列、**不得静默丢条目**；评审**不完整**（宿主截断族）⇒ 失败结论块逐次产出（§7——零改复核）。

**取舍**：只按“声明范围 + 内容判据”扩充候选根——命中内容仍须**逐字连续子串**（候选仅剥外层装饰 / 取引号内文——**零模糊、零内容级归一**；不会因同名文件误命中：内容必须逐字包含）；残余如实报告：引用声明范围外、且其仓根不在声明范围时仍判 unreadable。
### 3.1 参照形态判据（设计评审提示词第 13 条——行号不作引用）

**权威链（单向）**：规则本体 = `docs/core/design/DOC-DISCIPLINE.md` §1 D4 细则（人读权威，本节不重述、不改其语义）；
执行面 = 设计评审提示词 `thincoder-core/prompts/advisor-design.md` 的 `## Review Criteria` 第 13 条（模型读）；
机械面 = §3 的候选链——宿主仍只核「引文是否为所引行的**连续子串**」，**不判形态**：形态由评审席按第 13 条判。

**判据（逐字——规范单源 = 本节；批档 §1 的定稿块是同一份的一次性转载，批档收口可整档删除，不成第二真源；落笔面 = 产品代码面，eng-coder 照落：不改写措辞、不合并成一行）**：

```text
13. **Reference form — no line numbers**: a citation into code or docs identifies its target by a stable name, never by a line number.
    `path:123` and `line 123` both drift the moment a line is inserted above, and the drift is silent — the reader lands on an unrelated line and cannot tell.
    Name the symbol (function / constant / field / message / section heading); when no symbol exists, name the file together with the section heading that owns it.
```

**写成三行、不写成一行**：提示词面逐行判据（每行 ≤300 字符）——一整段写下来必然超宽被交付门拒；拆点落在句边界，每一行自身是一个完整句，句内文字逐字不动。

**一个问句，不分档**：评级只问「被审文档里有没有行号引用」——**没有**「本轮新增 / 存量」两档，**没有**「存量只报计数」的汇总行。
依据 `docs/core/design/DOC-DISCIPLINE.md`「行号一律不作引用形态（强制 · 无例外）」∥ 同档「存量同属违规」——判据面上没有可申请豁免的存量；清账快慢是**排期**，不是判据的分档。

**一处一行，不另立判据句**：发现表的行形已由同一提示词的 `## Output Format` 规定（一行一条发现）——第 13 条只给「什么算发现」，不重述输出形。

**提示词不带例外清单**：第 13 条只讲通用原理——项目自己的路径、目录约定与档名不进产品提示词（提示词随产品走，规则随使用者的仓而定）。

**无例外——被审档一律同判**：第 13 条不给任何一档开口子，项目归档档（`**/_archive/**`）里有行号引用照报。判据面上没有第二处答案：`docs/core/design/DOC-DISCIPLINE.md` §1 D4 细则给的是**清账口径**（域 ∥ 围栏），不是免判口径 ⇒ 不拿它当例外依据。

**围栏里的命令字面**：评审席引一段当次命令输出、其中打印了 `file:line`——那枚号是引文的字面（D4「引文内坐标照引」：逐字不动）；清账面上它不计入（D4「围栏内不计入清账面」），但**不是免判**：它仍是行号引用，按第 13 条照报一行发现。

**与既有两句不同轴（不复制措辞）**：同一提示词 `## Your role` 第 2 条的「Never cite a line number」与 `## Citation Discipline` 的「A line number is not a citation」管评审席**自己**怎么写引用；第 13 条管**被审文档**里的引用形态（判据面）。同一件事的两个面——既有两句一字不动，第 13 条不重述它们的理由，只给判红形态。

**落点（实现面单值）**：`thincoder-core/prompts/advisor-design.md` 的 `## Review Criteria` 节末——第 12 条之后、`## Output Format` 之前，编号 `13.`，条目内续行 **4 空格**、与 10–12 条同形（2–9 条是一位数编号，`N. ` 之后的对齐位本就不同；实读 2026-11-04：该档第 10–12 条的续行行首均为 4 空格）。

**严重度不新造**：第 13 条不指定 🔴/🟡 档位，沿用提示词既有的严重度定义表——判据说「是发现、一处一行」，档位照既有体系判。

**关联（约定面回潮源）**：`docs/vsc/design/VSC-MIGRATION.md` §1.3 引-3 现把「仓根相对路径 + `:行`」写成**规定形**——不改它，第 13 条立了也会被下一个照约定写作的人写回来。该行的替换形本批一并落（设计见批档 §2），本节不重述。

**最相近先例**：本档 §3 的「引证形状写作禁则（评审提示词面——逐字建议）」——同一面（评审提示词的引用形态）、同一写法（规范单源住设计面 + 逐字围栏块 + 实施席照落）。对齐 = 两处同形。

偏离 = **不取** `docs/core/design/ADVISOR-CONVERGENCE.md` §17 那一族的「`## N. xxx（设计评审维度）`」节形（§9 ∥ §14 ∥ §15 ∥ §16 ∥ §17 同形）。理由 = 那一族的权威链都指向一条**义务**（设计档须含某段 ∥ 某行：先例行、勘察证据行、分支出处、集成测试段、尺寸档位），而第 13 条不新增任何义务——它禁的是一种引用形态，规则本体已在 D4 细则里。放进义务族会让读者以为设计档多了一个必填段。

**既有件三问**：`existing: docs/core/design/DOC-DISCIPLINE.md` §1 D4 细则 · `name: "行号一律不作引用形态（强制 · 无例外）"` · `consumers: 文档作者 / 设计评审席 / 设计席` ⇒ 判据本体逐字沿用，零新造。

**勘察证据行（本席实读 · 2026-11-04）**：

- 落点档实读：`thincoder-core/prompts/advisor-design.md` 的 `## Review Criteria` 节现 12 个整数编号条目（1–6 ∥ 7–12）加 `6b.` 一条字母后缀条目；节后即时 `## Output Format`。
- 判据本体实读：`docs/core/design/DOC-DISCIPLINE.md` 的 D4 细则含上述两句逐字。
- 注入面实读：`thincoder-core/advisor/history.mjs` 的 `loadAdvisorMd(cwd)` 读 `cwd/.thincoder/advisor.md`，读不到才回落 `DEFAULT_CRITERIA`（一份五条代码评审清单）；`thincoder-core/advisor/messages.mjs` 把该值作为 `## Review Criteria` 块推进**用户消息**。⇒ 工作区根 `D:\teamcode\.thincoder\advisor.md` 实存，但它是用户消息里的附加块，**不取代**提示词（系统面）⇒ 改提示词在该 cwd 同样生效。
- 公共源：本仓 `PROJECT-MANIFEST.json` 的 `index.publicRepos` = `[]`（实读 2026-11-04：该键值为空数组）⇒ 无仓外声明源可查（已查无）；口径与 §2 第 7 条同——两处同为实读。
- 近面涉否：`test/` 下无档引用 `advisor-design` 的判据条数 ⇒ 本笔不破既有用例的夹具。

**验收（AC13-1 … AC13-6 · 每条写清跑什么、期望什么）**：

| # | 判据 | 量法 |
|---|---|---|
| AC13-1 | 落笔块逐行相等 | `node` 逐行 `===`：`thincoder-core/prompts/advisor-design.md` 落地块与本节围栏块整行相等（首末行含） |
| AC13-2 | 编号与位置 | 节切（`## Review Criteria` 至下一个 `^## `）内 `^[0-9]+\. \*\*` 计数 = **13**（`6b.` 不占整数编号）；第 13 条在 `## Output Format` 之前 |
| AC13-3 | 分档未回来 | 落地块扫 `pre-existing` ∥ `one count line` ∥ `the round did not touch` ⇒ **0** |
| AC13-4 | 行宽 | 落地块逐行 ≤300；该档 `>300` 行数**不增加**（基线 = 实施轮首动作前复测，读数记 §5） |
| AC13-5 | 提示词不带项目细则 | 落地块扫 `docs/` ∥ `_archive` ∥ `thincoder-` ⇒ **0** |
| AC13-6 | 交付门 | `doc_check(mode:"gate")` 首行 `PASS` |

**用例表（正常 / 边界 / 错误）**：

| # | 场景 | 输入 / 动作 | 期望 |
|---|---|---|---|
| C1 | 正常 · 被审文档用行号定位代码 | 设计档写「路径 + `:行`」形的坐标 | 出一行发现：路径 + 该坐标逐字 + 应改用的符号名 |
| C2 | 正常 · 无符号可指 | 被引对象是一个整段规则 | 判据给的第二形：文件路径 + 所属节标题；仍不带行号 |
| C3 | 边界 · 一次文档十二处 | 同一份设计档十二处行号引用 | **十二行**发现，不折成一行计数 |
| C4 | 边界 · 归档档 | 被审档是项目归档档，档内有行号引用 | 无例外、同判：出一行发现；提示词面零字（不列业务归档例外清单） |
| C5 | 边界 · 围栏里的命令字面 | 评审席引一段命令输出，其中打印了 `file:line` | 引文字面逐字不动（D4「引文内坐标照引」）；不计入清账面（D4「围栏内不计入清账面」）但不是免判——照报一行发现 |
| C6 | 错误 · 拿旧分档读 | 只报新增处、存量报一个数 | 判违规：分档已删，AC13-3 红 |

**集成测试差量（起点 = `test/RTM.md`）**：**破 0 行 · 冗余 0 行 · 缺 0 行**。理由（两条入口逐条核）：① 不改任何既有用例断言的业务可观察结果——第 13 条是评审席读的判据文本，产出是模型写的发现表，无业务入口可机判；② 未新增业务上真需要的场景——用户报告的问题是真的（行号漂移，本仓已发生），但它的可观察结果落在评审输出文本上，不在业务结果上。近面无涉：故事 7「收口只判本批改过的档」∥ 故事 17「评审没写进批档就不算过」（本笔不新增门、不动评审席的 §3 写入行为）。

**受影响档与分层结论**：`thincoder-core/prompts/advisor-design.md`（提示词档 = 产品代码面的 `.md` 文本档，评审维度 8 对纯 `.md` 豁免分层判）· 本节自身（设计档）· 测试档 **0** ⇒ **无档跨层，无拆单**。

**数据事实**：本设计对数据无断言（不涉行数 / 枚举 / 字段）。唯一量 = 落笔后`## Review Criteria` 节的整数编号条数，由 AC13-2 实跑量取，非纸面推演。

**分支依据**：本笔不新增输入 / 状态分支（纯文本判据 + 一处约定行改写）⇒ 无分支表。

**UI / 交互决策**：无界面面——本笔只改模型读的提示词文本与设计档文字。

**边界（本节不做）**：

- 不改 `docs/core/design/DOC-DISCIPLINE.md` §1 D4 细则的语义；不新造严重度（沿用提示词的既有定义表）。
- 不改 `## Your role` 与 `## Citation Discipline` 的既有句（不同轴，见上）。
- 不新增机检门——宿主校验仍只核内容、不判形态。
- 不动 `thincoder-core/prompts/advisor-round1.md` ∥ `thincoder-core/prompts/advisor-round2.md` ∥ `thincoder-core/prompts/advisor-round3.md` ∥ `thincoder-core/prompts/consult-base.md`（第 13 条只进设计评审）。
- 判据只判、不排期（清账节奏归用户的会话排期）；本节与落笔块零行号坐标。

## 4. 预算硬墙 + 提示 + 结构化收尾（D 族）

1. **硬墙（per-call deadline）**：循环内每次模型调用计算 `remaining = timeoutMs - elapsed`；`remaining ≤ 0` 走既有超时尾；否则调用信号 = 复合中止信号（外层中断信号 + 剩余时间超时信号）。
   **墙判定绑信号状态（非异常名）**：每轮调用返回或抛错后——外层用户信号已中止 ⇒ 原样上抛（中断语义零变）；否则「复合信号已中止且用户信号未中止」⇒ 返回结构化超时尾——**两种运行时形态同判**：① **抛错**（接受中止类与超时类两种异常名——超时信号的 reason 是超时 DOMException）；② **不抛错而返回 partial 结果**——流已有内容时中断以 partial 透传，该形态**不得**按普通结果收尾。
2. **0.75 一次性预算提示**（同一检查点、每场评审至多一次；判定抽成纯函数便于机测）——注入一条 user 消息（逐字）：

```text
⏳ review budget: ~{pct}% consumed ({elapsed}s of {budget}s). Converge now: emit your findings table for the evidence you have verified, mark anything you could not verify explicitly as `unverified` (unverified evidence must not support a pass), and emit your verdict line.
```

3. **结构化超时尾**（前缀保持超时尾首句——判定族字面依赖；其后为新增统计与指引）：

```text
Advisor: review timeout after {S}s. Review incomplete — the wall-clock budget was exhausted; partial findings (if any) are above.
- rounds: {R} · tool calls: {T} · review text produced: {yes|no}
- budget: {S}s (agent.advisor.timeoutMs) — re-run with a narrower scope (split the review across fewer documents) or raise the budget.
```

   其余五条尾文案不变（判定族已覆盖）。

## 5. 冻结窗口边界（E 族——D5）

> D5 规则句（“评审在途不改被审文档”）的「在途」下界定义 + 在途写入拦截 = 本节。

**归因与实证**：评审实例**点火后、报告送达前**，父侧改被审文档 → 结算判陈旧 → **整轮作废**；pass 轮 = 凭证直接丢失。

**机制复核（陈旧判定的射程与时点——现行实现）**：

1. **起点** = 点火受理：异步启动快照序号——同批中先于点火的写不计、后于点火的写计入；
2. **评估面** = 设计评审声明文档集（即 documents 声明——含批次档）；
3. **判决** = 陈旧判定：序号大于点火序号的父侧变更命中声明文档集 → stale；
4. **判决时点** = 结算记账（评审 promise 收尾时调用）；读取的是**读取时刻**的变更日志；
5. **违规后果（既有行为——保留）** = stale 分支：剥凭证回显 + 「评审目标已变更——token 未签发」前缀、不签凭证、不计评审覆盖；
6. **父侧可观察下界** = **报告送达**（结算 → 挂起移交 → digest 注入 / 回合尾收集）**或取消·中止**。

**边界澄清**：**「子进程退出」不是窗口边界**——结算记账晚于进程收尾执行，且对父侧不可观察；窗口实际射程 = **点火 → 结算读取**。父侧唯一可观察的安全边界 = 报告送达。

**规则面选型**：取「定义落本档 + D5 行与提示词镜像登记待同步」（定义即时可落；同步面不撞在途链）；否决「直改机制档双档 + 提示词四镜像」（撞在途文件 + 提示词非本档写域）与「只保留父侧即时纪律、不落档」（下界仍不落机制权威面）。
**机制面选型**：取「**写前拦截** × 点火回执冻结句」（唯一预防级：在途写被拒 → 档不改 → 不 stale；判据与陈旧判定**同源** → 零误杀；与既有拒绝通道同形；逃生门 = cancel → 改 → 重发）。

否决：写后提示（写已落地 = 本轮必 stale；预防为零）· 仅回执冻结句（靠父侧临场兜）· 拦截 + 自动取消/自动重发（发起权在父/用户）。
**批次档是否从快照面豁免**：**不豁免**（事故保护对象恰是批次档——父侧最常写；评审员确实读批次档任务书）。否决档级豁免与节级豁免（变更记账为文件级，节级判定需引入解析/节快照新机制——成本高、易假阳）。

**契约（逐字）**：

（a）**窗口定义（下界定义句——机制权威表述）**：

```text
在途窗口（D5 冻结窗口）= 点火 → 结算：起点 = 异步评审启动受理（启动序号快照）；
终点 = 结算记账（陈旧判定读取父侧变更日志的时点）。父侧可观察下界 = 报告送达（digest 注入 / 回合尾收集）或取消·中止。
「子进程退出」不是窗口边界。窗口内父侧对被审文件集（设计评审 = 声明文档集 + 批次档）零写入；
违规后果 = 结算 stale → 不签发 token / 不计评审覆盖。
```

（b）**参与者义务**：

- **父侧**：① 点火后至报告送达 / 取消前，被审文件集（含批次档）零写入；② 有改动需求 → 先 cancel → 改动落地 → 重发评审；③ 收到陈旧结果按既有提示重跑，不按已评审处置。
- **宿主**：点火回执携带冻结句（设计评审）；结算前拦截父侧对被审文件集的写；陈旧结果照既有通道可见。
- **评审员**：零新增义务——§3 写入通道不受影响（评审员侧写不落父侧变更日志；段写入工具不在文件写工具表内）。

（c）**拦截与回执文案（逐字——实现 grep / 用例断言锚）**：

拒绝（写入预闸 → 工具结果；reason = 冻结窗口标记；路径为 cwd 相对）：

```text
Error: write refused — design review #{id} is in flight over {path} (D5 freeze window).
A write now would settle it stale — no token for a pass (the round is lost).
Wait for the report, or cancel the review first (subagent action:'cancel' id:'{id}') and re-launch after the change.
```

点火回执（设计评审 ack 追加；代码评审 ack 零改）：

```text
；D5 冻结窗口：被审文档（含批次档）在报告送达前零写入——在途写入会被拒绝，写入将使本轮结算为陈旧 (pass 不发 token)
```

（d）**实现要点（语义锚——防漂移）**：

- 拦截判据与陈旧判定**同源**（同一声明文档集 + 同一路径归一）；**仅扫 running 且未取消的设计条目标**（已结算 / 已取消条目不拦）。
- 工具面 = 文件写工具集（与变更记账同集——不记入日志的写面既不判陈旧也不拦）；目标路径经工具触碰路径提取（取不到路径不拦——同记账语义）。
- 落位 = 写入预闸（工程门后、只读/权限阶段之前）；拒绝渲染 = 既有 denied 通道。
- 保守残余（如实注）：回合中止后池清前的窗口可能拒一笔不致陈旧的写（保守方向）。

**参与者边界（写面一致性）**：拦集 = 预闸可见的父侧自身写面；判陈旧集另含预闸不可达的**子代理合入**写入——「致陈旧却没拦」只可出自不可达面；bash / 文件操作类盲区不记账不判陈旧。

**旧子 id 映射（引文相容——代码注释按「本节 E-x」引；子标源自归档 `thincoder-cli/docs/_archive/design/ADVISOR-CONVERGENCE.md` §14 的 E 族）**：E-1 问题陈述 → 本节「归因与实证」∕「机制复核」· E-2 方案选型 → 「规则面选型」∕「机制面选型」段 · E-3 契约五（逐字）→ 本节「契约（逐字）」（子标字母同对应：**E-3c** = (c) 拦截与回执文案 · **E-3d** = (d) 实现要点）·

E-5 关键决策记录 → 本节选型段（否决句）· E-6 后续登记项 → §11 边界 + 本节「参与者边界」尾注 · E-8 验收标准 → §10。

## 6. 同步面记账（F16——消费同谓词）

**问题**：同步记账无「未完成尾」判定——以宿主截断尾收尾的同步代码评审仍置「评审已覆盖」位（计“已覆盖” → guard 不重推）。

**判定点** = 工具结果记账的同步分支（拒发 / 异步 ack 两分支先行排除）；**谓词** = `advisorIncompleteMarker`（单源，与 §1 三个消费点同串）。

**置位规则（与异步结算面逐条 parity）**：

| 场景 | 「评审已覆盖」位 | 依据 |
|---|---|---|
| 干净结果（无截断尾） | **置真** | 既有语义 |
| 未完成尾 ∧ 代码评审 | **不置** | 本体——guard 可重推（防静默跳过） |
| 未完成尾 ∧ 设计评审 | **置真** | parity：设计评审无代码面 |
| 未完成尾 ∧ 类型不可判（无标记 / run 缺失的 legacy 直调） | **不置** | fail-closed：截断尾不得计「已覆盖」 |
| 拒绝报告 / 异步 ack | 两分支先行排除 | 既有语义 |

**边界**：轮次进位（含 legacy 分支）/ prior 规则 / 同步调用登记删除 / 拒发 / 异步 ack 语义——全数不动（未完成尝试耗预算；反复截断的出口 = **失败结论块（两轨共用——§7 契约二）** + guard 推回上限）。guard 推回上限本身的语义 = 两层口径（进展窗口 ≤3 条 ∥ 未评审周期 ≤5 条），权威面 `ADVISOR-CONVERGENCE.md` §6.4。

## 7. 失败结算结论

**契约一：结算判据名（纯函数单源、零状态）**：输入 = 一次结算的宿主可见事实；输出 = 判据名（`string`）或 `null`（无可报结论）。**零 LLM 输出解析**（N20）。

**优先级（自上而下，首个命中）**：

| # | 输入（结实事实现场） | 输出 | 语义依据 |
|---|---|---|---|
| 1 | 启动被拒（报告以拒绝前缀开头——未发起请求） | `null` | 无尝试发生（不产结论块） |
| 2 | 陈旧结算 | `stale` | 判据类 |
| 3 | 无报告（正常链不可达） | `no_report` | fail-closed：无报告不得计为可用 |
| 4 | 未完成尾且非 `interrupted` | 宿主尾 kind（五类） | 宿主截断尾（单谓词） |
| 5 | 未完成尾 = `interrupted` | `null` | 用户 / 系统中断——被丢弃的尝试（尾文案已可见） |
| 6 | pass 但槽落盘失败 | `no_credential` | 未产出可用凭证 |
| 7 | 其余（pass 且落盘成功 / changes-required） | `null` | 可用判决——无结论块 |

- **确定性**：全部输入为宿主状态——零 LLM 输出解析。
- **轨适用**：分类纯函数对**两轨同源**调用（设计轨 + 代码轨结算）——判据名可达面见契约二「轨」列（`no_credential` 设计专属；`stale` 两轨可判）。

**契约二：结论文案（逐字）**——判据名非空时，结算出口追加结论块（**块首行 = 对象标识行**；样式见 §2.5）：

**轨适用（两轨共用）**：结论块对 **code / design** 两轨同式适用（块首行 `type` = **实际评审轨**）；判据名可达面见下表「轨」列（`no_credential` = 设计专属）。代码轨反复截断 / 陈旧的出口 = 本结论块（不是尾文案本身）。

```text
Advisor: review failure — 本轮未产出可用结论 (no usable settlement) [type={type} · scope={范围摘要} · round={N}/uncapped · criterion={判据名}]
{既有结算正文——逐字保留（未签发提示 / 陈旧前缀 / D1 落盘失败提示）}
Failed attempts in this review instance (most recent last):
| # | outcome | meaning |
|---|---|---|
| {N} | {判据名} | {人读说明（下表逐字）} |
Options: 1. proceed as-is (no usable conclusion — design: no token, implementation stays gated; code: the code face stays unapproved) · 2. narrow or change the scope and re-run · 3. stop and report to the user
```

- **尝试表行 = 本次尝试**（`#` = 该实例的尝试序号）——**不设跨次记录的载体**（零载体）：反复性由父侧从逐次结论块读出（机制侧贡献 = 每次载 `criterion=`）。
- **`round` 值语义（与尝试表 `#` 同值）**：结论块在**结算出口**追加（此时 `thincoder-core/agent-tools/advisor-settle.mjs:136` 的 `run.round++` 已执行）⇒ `round` = 本次**已结算**尝试号（**不是**「下一轮将使用的编号」——§2.5 字段行的失败族读法即本条）；尝试表 `#` 记同值。**断言**：块首 `round=N` ∧ 尝试表 `#=N`（用例 T-AF16）。
- **选项三值**（承 F29）：继续（无可用结论——实现仍闩 / 该面仍未被评审覆盖） / 改变或缩小范围后重跑 / 停下上报——**均不自动执行**（发起权在父侧 / 用户）。
- **零凭证值**：块内零 token / designId 值（用例 UUID 形扫描零命中）。
- **零封禁**：结论块是出口，不是封禁——下一次发起照常受理。

**判据名 → 人读说明（逐字——上表第三列）**：

| 判据名 | 轨 | meaning |
|---|---|---|
| `timeout` | 两轨 | review exceeded the wall-clock budget (agent.advisor.timeoutMs) |
| `context_limit` | 两轨 | review exceeded the model context budget |
| `turn_cap` | 两轨 | review exceeded the tool-round limit |
| `empty` | 两轨 | the provider returned an empty response |
| `review_failed` | 两轨 | provider / transport error |
| `stale` | 两轨（设计另附「token 未签发」正文） | the reviewed target changed while the review was in flight |
| `no_credential` | **设计专属**（凭证面——代码轨不可达） | the token could not be written to the session ledger |
| `no_report` | 两轨 | the review settled without a report |

不设任何按计数拒发的预检；失败路径的出口 = 结论块（§7 契约二）+ 父侧纪律（`docs/core/design/ADVISOR-CONVERGENCE.md` §3.3）。

## 8. 预算跟随模型窗口

**契约（预算派生——纯函数语义）**：上下文预算常量族（模型规格与 provider 级上下文覆盖同源）**扣完成预留**（完成预留在窗口里占位 ⇒ **折入预算：压缩先行、不判死**；基数 = **可用窗口 = 窗口 − 完成预留**）：

```js
// 上下文预算：基数 = 可用窗口 = 窗口（模型规格表 × provider 级 context 覆盖）− 完成预留。
// 头寸用途 = chars/4 估算误差 + 响应/协议开销（内存不构成约束）；判死线仍是宿主机自限线，服务端窗口约束不变。
export const CONTEXT_LIMIT_RATIO = 0.8   // 判死线 = 可用窗口 × 0.8
const COMPACT_TRIGGER_RATIO = 0.8        // 压缩触发 = 判死线 × 0.8（既有关系零改）

export function advisorContextBudget(provider) {
  const spec = providerSpec(provider)
  const usable = Math.max(0, spec.context - outputReserve(provider, spec))
  const limit = Math.floor(usable * CONTEXT_LIMIT_RATIO)
  return { limit, compactAt: Math.floor(limit * COMPACT_TRIGGER_RATIO) }
}

// 完成预留（单源——评审两档与代理阈值两处消费面共用）：显式 `provider.maxTokens`（实发值）∥ 规格 `maxOutput` ∥ 0。
export function outputReserve(provider, spec) {
  const explicit = provider?.maxTokens
  if (Number.isFinite(explicit) && explicit > 0) return explicit
  return spec?.maxOutput ?? 0
}
```

| 输入（窗口 ∥ 完成预留） | 可用窗口 | 判死线 `limit` | 压缩触发 `compactAt` |
|---|---|---|---|
| 1_000_000 ∥ 128_000（大窗口 1M ∥ 规格 `maxOutput`） | 872_000 | **697_600** | **558_080** |
| 128_000 ∥ 32_000（常规 128K ∥ 规格 `maxOutput`） | 96_000 | **76_800** | **61_440** |
| 128_000 ∥ 32_000（未知模型名——回退默认规格） | 96_000 | **76_800** | **61_440** |
| 65_536 ∥ 32_000（provider 级 K 覆盖 64K） | 33_536 | **26_828** | **21_462** |
| 128_000 ∥ 32_000（`null` / 缺 model——总函数） | 96_000 | **76_800** | **61_440** |

- **回退链**：未知模型 → 一次性告警 + 默认规格；`provider` 为 `null` 时退化默认——派生不抛错。
- **量纲**：窗口为 tokens；provider 级 context 的 K 单位换算只发生在规格解析内（零重复转换）。
- **两档语义**：`compactAt` = 触发本地裁剪；`limit` = 压缩后仍超即判死（`context_limit`）。两者关系（×0.8）不变；上限来源 = **可用窗口 = 窗 − 预留**，「如何比较」不变。
- **循环侧消费（两处）**：循环体外一次性取预算（provider 全场不变）；两处比较点读 `compactAt` / `limit`。
- **完成预留（基数扣减项——单源 `outputReserve`）**：显式 `provider.maxTokens`（有限且 > 0——请求实发值 `thincoder-core/provider/core.mjs:187`）∥ 规格 `maxOutput` ∥ 0。
- **预留消费面（两处 · 同源）**：评审预算（`thincoder-core/advisor/compaction.mjs:34-39`）∥ 代理侧压缩阈值 `resolveCompactThreshold`（×0.6——`thincoder-core/config.mjs:116-120`；每回合压缩检查 / 展示面回退 `thincoder-core/token-window.mjs:151`）。
- **预留在窗口里占位**（provider 口径 = 输入 + `max_tokens` ≤ 窗）⇒ 折入预算，基数 = **可用窗口**（评审两档与代理阈值同基数口径——预留 0 ⇒ 比例关系整式逐值相等）。

**派生读数（逐行可复算）**：

- deepseek（1024K 覆盖 ∥ 预留 393,216）：评审 `compactAt` **419,430** ∥ 判死 **524,288** ∥ 代理阈值 **393,216**；
- 顶窗实证（输入 670,532）：`compactAt` **419,430** ⇒「早已触发」✓（压缩先行）；
- 跨模型（窗口 1_000_000 ∥ 规格 `maxOutput` 预留）：kimi-k3（预留 131,072）评审 `compactAt` **556,113** ∥ glm-5.3（预留 128,000）**558,080**。

- **与头寸用途句的关系**：本节「OOM 论证」第 4 点头寸用途不变——头寸 = 可用窗口与判死线之间的 20% 安全带（代理侧 40% 同），为估算误差 + 协议开销而留；基数 = 可用窗口（窗 − 预留），头寸比例与用途不动——**预留 ≠ 头寸**（预留 = 窗口里给输出留的实占位；头寸 = 基数与上限之间的余量）。

**OOM 论证**：

1. **内存量级不构成约束**：预算 1M tokens ↔ 估算口径约 4M 字符 ↔ JS 字符串约 8MB；单次请求 JSON 序列化为同量级瞬时副本 ⇒ 峰值远低于 Node 默认堆量级两个数量级。
2. **真正的内存边界已由他处承担**：单结果截断常量（字符级）；压缩后消息集 = system + 压缩注记 + 定锚简报 + 最近若干条——**与窗口无关的有界集**。
3. **大窗的真实代价是延迟与 token 额度**，不是 OOM：由墙钟预算与用户的模型选择承担——20% 头寸**不**为内存而留。
4. **头寸的真实用途**：① 扁平估算（chars/4）对 CJK 内容低估 3–4×；② 响应与协议开销；③ 压缩触发与判死线之间的安全带。

## 9. 估算加权（CJK）

**问题**：token 估算为扁平式（字符数 / 4），对 CJK 低估 3–4×——预算判死线与压缩触发因此偏松。消费点 = 两个守卫 + 判死尾计数 + 显示统计。

**选型**：取「**复用主循环的加权估算函数**」（叶子模块，仅依赖中止溯源档）——单源加权公式（与主循环同口径）；纯 ASCII 逐值相等；零新配置面。
否决：本档内联加权式（公式双源，漂移风险）· 全对齐上下文 walker（面大于需求）。

**契约**：

1. 估算函数的**内容项**改用加权估算——walker（content / tool_calls 两源）不变、计数口径不变；
2. **纯 ASCII 输入逐值不变**；CJK 字 = 1；
3. 消费点只随新估值自然生效；比例系数不变；
4. 判定族 / 六条尾文案 / prior 形态判定阈值谓词不受影响。

**用例**：纯 ASCII 400 字符 → 100；CJK 字 ×400 → 400；混合 200 ASCII + 200 CJK → 250。

## 10. 验收标准（逐条回指需求）

| # | 验收标准（机器可验） | 回指 |
|---|---|---|
| A-AG1 | 六 kind 判定族全覆盖（含 `review_failed`）；块首行扫描；引文同串非块首不误判 | 不完整判定族 |
| A-AG2 | 三个消费点共用同谓词；未签发提示逐字可 grep；正常通过路径零回归 | 同上 |
| A-AG3 | 凭证链守卫：启动断言违反 ⇒ 拒绝报告且**不发请求**；拒绝前缀为稳定契约 | 凭证链 |
| A-AG4 | 压缩定锚：压缩触发时 `pinned` 重新挂回；重复压缩幂等 | 凭证链 |
| A-AG5 | 引文候选链：候选根序派生；失败原因四类（逐字分类 = §3）；围栏不变 | 引文解析 |
| A-AG6 | 预算硬墙：墙判定绑信号状态；两种运行时形态（抛错 / partial 不抛错）同判；0.75 提示每场至多一次 | 预算 |
| A-AG7 | 冻结窗口：拦截判据与陈旧判定同源；被拒写入零落地；逃生门指引含 cancel；回执冻结句逐字 | 冻结窗口 |
| A-AG8 | 同步面记账 parity 四行；拒绝 / 异步 ack 两分支零改 | 同步面 |
| A-AG9 | 失败结算结论：判据名优先级七行（纯函数）；判据名非空 ⇒ 结论块在位（标识行 + 含义 + 选项）；零凭证值 | 失败结论 |
| A-AG10 | 预算派生两档（基数 = 可用窗口 = 窗 − 完成预留）：五组输入 → 五组输出与表逐值相等；预留解析单源（显式 `maxTokens` ∥ 规格 `maxOutput` ∥ 0）；回退链不抛错 | 预算跟随 |
| A-AG11 | 估算加权：纯 ASCII 逐值相等（零回归）；CJK 与混合用例逐值相等 | 加权 |
| A-AG12 | 零计数载体 + 零封禁：无计数 Map 载体 / 无停止谓词 / 无两级检查点；同 doc-set 第 4 次及以后发起照常受理 | 失败结论 |
| A-AG13 | 类型门（F30）：`args.type ∉ {code,design}`（缺失 / `null` / 空串 / 非法值 / 非字符串）⇒ 拒发串（前缀 + 两合法值各一行用途 + 标识行）+ `_advisorRefusals` 登记，零实例 / 零 token；显式 `code` / `design` ∧ `object.type` 未声明 / 一致 / 非枚举值 ⇒ 照常；**冲突对**（顶层显式合法值 ≠ `object.type` 的另一合法值）⇒ 同拒（`criterion=type-object-conflict` + 两路指引） | 类型门 |
| A-AG14 | 对象标识行（F31）：三类文案首行载四项（type / scope / round / criterion）；既有稳定前缀逐字在位；类型门拒回 `type=absent\|invalid`（冲突拒回记顶层实收值 `code\|design`）；失败结论块 `type` = 实际评审轨（两轨共用） | 对象标识行 |
| A-AG15 | 调用面零残留（F30 判定句 ③）：`advisor.mjs` 源内 `args.type \|\| "code"` 零命中 + 声明面三处 type `(default)` 旧句零命中；三树 `advisorTool.execute(` / `runAdvisorReview(` / `prepareAdvisorMessages(` 调用点逐处显式；**声明一致零残留**——三树 `*.mjs` 调用点 `object` 声明零命中（静态面；结构断言 + 口径命令可重跑） | 类型门 |
| A-AG16 | 引证形状分类：省略号引文（**候选全未中**——A-AG18）⇒ 非连续引文类（含改法），不再报 content mismatch；非省略号不匹配 ⇒ mismatch 照旧；报告头行零改（命中判据 = A-AG18 增量）；四面禁则 + 示例替形在位（`setTimeout(...)` 示例零残留） | 引文解析 |
| A-AG17 | 归宿面：未验证引用不支撑打回（既有断言零改）；「不得静默丢条目」收尾句在位；不完整 ⇒ 失败结论块（A-AG9 覆盖） | 引文解析 / 失败结论 |
| A-AG18 | 引文**装饰剥离候选集**：包裹引号 ∥ 行内注记装饰的引文 ⇒ 候选（c1 原捕获 ∥ c2 反复剥引号族 + 空白 ∥ c3 首个引号字符后段 ∥ c4 首个成对引号段内层文本；派生候选下限 2 字符）任一为所引行连续子串即 matched（零模糊、零内容级归一）；候选命中先于省略号分类（引号外语义省略形 ⇒ matched；引号内省略形 ⇒ 非连续引文类照判）；失败四类 / 报告头行 / 围栏零改 | 引文解析 |
| A-AG19 | 文档路径解析单一规则（§12）：相对形按会话项目根解析（子目录锚同判）；绝对形照用；锚为 `workspace` 且传相对形 ⇒ 拒（`criterion=scope-not-doc` ∥ `reason=ambiguous-path`）∥ 锚为 `none` ⇒ 拒（同 criterion ∥ `reason=dangling-path`）；相对形 `..` 越根 ⇒ 拒（同 criterion ∥ `reason=outside-project`） | 路径解析 |
| A-AG20 | 受理面 = 项目内现存 `.md`：仓根级文档与 `docRoot` 树外仓内文档均受理；项目外 / 非 `.md` / 不存在 ⇒ 拒（`criterion=scope-not-doc` ∥ `reason=outside-project` ∥ `not-doc-file`），文案载「解析后路径 ∥ 拒因」+ 期望形两句，零实例 / 零 token / 零 LLM | 收面放宽 |
| A-AG21 | 零试探残留：`thincoder-core/**` 源内 `candidateRoots` / `sessionReviewRoots` / `scope-doc-ambiguous` 零命中；返回形属性访问 `\.attempted\b` 零命中（口径命令见 §12「消费点与编辑点」）；返回形无 `ambiguous` / `candidates` 键；冻结窗 `docAbs` 仍取 `resolved`（放宽受理的文档在冻结面内） | 路径解析 |
| A-AG22 | §3 落地门（F-A13）：绑 `batchDoc` 且结算已过回显闸 ⇒ ① **无条件**判 §3 轮次块数 > 点火基线（changes-required 轮同判）② 走签发路径时判段级状态行 = `评审通过`；不满足 ⇒ `{passed:false}` + 恒定标记（`no-section3-block` ∥ `status-not-passed`），槽零写、实例不翻 open、补写 §3 块（携 `VERDICT: pass`——状态行随块由工具置位）后同实例可重评 | F-A13 |
| A-AG23 | 门的前置：结算时实例无批档绑定（`run.batchDoc` 空）= 程序不变量违反 ⇒ `settleDesignReview` **throw**（串点名接线故障 + designId），零槽写、不返回判决、**无对外拒因值**（准入门已保证该调用形不可达——§2 第 6 条）；**断言在槽写之前**（`boundBatch` 判定处，早于 `agent._engDesignTokens.set(...)`——落其之后 = 没拦）、**异常外逸不接**（结算调用点 `thincoder-core/agent-tools/advisor-settle.mjs:155` 零 `try/catch`，实现不得补 catch-and-continue——那会落回 `set(...)`，token 照签、零报错）；**异步轨同判**：结算跑在 `thincoder-core/agent-tools/advisor-async.mjs:445-453` 的 `.finally` 回调内，`thincoder-core/agent-tools/async-settle.mjs:293` 的 `onAccounting?.(parent, entry)` 零 `try/catch`、派生 promise 无处理器 ⇒ throw = `unhandledRejection` ⇒ `thincoder-cli/bin/thincoder.mjs:107-108` → `handleFatal` → `exitSoon(1)`，进程退出而非一条回给调用方的报错；紧邻的 catch-and-continue 先例 = `thincoder-core/agent-tools/advisor-settle.mjs:165-169`，照抄即空壳；**机检形**：已点火实例的 `run.batchDoc` 置 `null` 后结算 ⇒ 异常外逸（错串含 designId）+ `agent._engDesignTokens?.size ?? 0` 前后相等（字段无初值——`thincoder-core/agent.mjs:64-66` 逐字「no field initializer」，创建点在 throw 点 `:188` 之后的 `:239`）；未回显有效 token ⇒ 走既有 M1（记录面零判）；裁定非 pass（changes-required ∥ no-pass-line）⇒ 判据 1 照判、判据 2 不参与（结算在裁定闸早退，实例保持 open、轮次照常进位） | F-A13 |
| A-AG24 | `batch-unreadable`：点火时批档不可读（基线 `null`）∥ 结算时批档不可读 ⇒ 照拒、零签发、槽零写；恢复该档后同实例重评可过 | F-A13 |
| A-AG25 | 批归属「批」列派生（`thincoder-core/agent-tools/design-slots.mjs:61` 的 `batchOf`）：旁列有值 ⇒ 取该批档绝对路径的 basename；旁列缺失（旁列启用前签发的旧槽）⇒ 会话内评审实例注册表按 designId 命中的 run 逆序取最近一个能派生出批档的（`run.batchDoc` 优先、`docSetKey` 段档兜底）；皆不可得（跨重启 ∥ 模式重进 ∥ 注册表回收）⇒ `—`（如实降级，不猜一个批名）；与 settle 写旁列同一派生 `batchAbsPathOfRun`——清点面不拿另一个派生读同一事实 | 批归属 · 清点显名（U-7 ∥ U-8） |
| A-AG27 | 账链门（§2 第 7 条）：`type="design"` ∧ `batchDoc` 可读 ⇒ 本档须有 ≥1 行 ∈ `PENDING_STATUSES`（选行 = `resolveBatchRows` 同址，台账 `thincoder-core/ledger-write-ops.mjs:185`；未决 = `thincoder-core/ledger-db.mjs:134`）；不满足 ⇒ 拒发（`criterion=batchdoc-no-ledger`，`reason` 三值 `no-pending-row` ∥ `no-ledger-root` ∥ `ledger-unreadable`）+ `_advisorRefusals` 登记，零实例 / 零 token / 零槽 / 零 LLM；**失败路径全落拒、零路径落放行**（`if (!db)` 放行与 throw 外逸都不算答案）；**零模式位**（新增代码对 `agent.engineering` 零命中）⇒ 普通模式同判；结算面（`settleDesignReview`）零台账读 | E1 / E2 / E3 / E4 |
| A-AG26 | 设计评审准入门（AC-M6-6）：`advisor(type="design")` 未携 `batchDoc`（缺失 / `null` / 空串 / 纯空白）⇒ 拒发串（前缀 + `batchDoc` 必填句 + Why + 两种期望形 + 「先建档」下一步 + `Nothing was sent` 行 + 标识行 `criterion=batchdoc-missing`），登记 `agent._advisorRefusals`，零实例 / 零 token / 零槽 / 零轮次 / 零 LLM；携了但不可读 ⇒ 既有 `resolveBatchDocPath` 文案逐字（不改）；`type="code"` 不受本门约束；携了可读的设计评审零回归；**槽数读面单源 = `agent._engDesignTokens`**（槽存储本体；`subagent(action:'design-slots')` 清点读同一 Map——`thincoder-core/agent-tools/design-slots.mjs:38` 实读） | AC-M6-6 |
| A-AG28 | 参照形态判据（提示词第 13 条）：落地块与本节围栏块逐行相等；节内整数编号 = 13 ∧ 第 13 条在 `## Output Format` 之前；落地块零分档串、零项目细则字面、逐行 ≤300，该档 `>300` 行数不增加；无例外——归档档同判（判据 = 本节 AC13-1 … AC13-5） | 参照形态判据（提示词第 13 条） |

## 11. 边界

- 不改评审轮次语义（**无机械上限**——轮次衰减 / 会话隔离 / prior 注入 / 响应表按 `docs/core/design/ADVISOR-CONVERGENCE.md` 权威）。
- **不设会话级计数载体、不按计数拒发**（N20 / F28）；不改异步池上限（资源保护归调度域）。
- 不改陈旧判定 / 变更记账 / 结算语义本体；不引入节级快照、自动取消 / 自动重发。
- 不拦截代码评审的在途写（仅设计评审）；不覆盖 bash / 文件操作类写入面（登记）。
- 不碰在途链文件；不改判定族 / 六条尾文案 / 压缩阈值。
- **零 UI 面**（拒绝文案落工具结果、冻结句落工具返回——无渲染面改动）。
- **类型门登记（非发起点，判据见 §2.4 / §10 A-AG13）**：核记账面 `thincoder-core/agent/record-results.mjs`（判定后恒为枚举值）· CLI 显示面 `thincoder-core/tool-args.mjs:49`（`a.type ?? "review"` 渲染兜底——不参与发轨判定，被拒调用照原样渲染）。
  **对象声明面** `thincoder-core/agent-tools/advisor.mjs:66`（`object` schema——自述为调用方声明的评审类型，只描述评审对象、**不选轨**；一致性校验 = §2.4 冲突分支）。
- 不写实现代码（工具 / 守卫 / 检查点 = eng-coder 写域）。

## 12. 评审文档路径解析与受理面（范围门）

**单条规则（唯一）**——`resolveReviewDocPaths(documents, cwd)`（宿主 `thincoder-core/agent-tools/review-facts.mjs`）逐文档按下表判定（分支依据列 = 该分支为何存在）。

**最相近先例**：同一函数前身 = 四分支解析器 `thincoder-core/agent-tools/review-facts.mjs:72` ∥ 候选底座 `:148`；先例批 = #921（`thincoder-core/agent-tools/review-facts.mjs:6` 头注）。对齐 = 同一函数、同一返回形的 `resolved` / `invalid` 两段。

偏差 = 分支③候选试探 ∥ 分支④歧义归一 ∥ `scope-doc-ambiguous` 判据整条删除——用户 2026-10-25 11:41「为啥要试探？不能要求写对吗？」：路径要求写对，试探面无存在理由。

**解析面归口**：相对形的解析序改调统一解析层（`docs/core/design/PATH-RESOLUTION.md` §2.2，`order:"root-first"`——项目根先、引用方目录后，与旧序同序）；本表分支 1 / 2 的判据由该层的 `resolved` / `ambiguous` / `dangling` 结果态给出，本面不另判。跨仓形（`crossRepo`）**不进入本面**——本面受理面仍是「项目内现存 `.md`」，跨仓引用只开在文档锚面。

**公开源核查**：项目声明 `PROJECT-MANIFEST.json:35` 的 `index.publicRepos` = `[]` ⇒ 无公开源档可查；已查无。

| # | 分支 | 判据 | 依据 |
|---|---|---|---|
| 1 | 相对形 | 基面 = **会话项目根** `projectRootView(cwd).root`（`thincoder-core/manifest-discovery.mjs:142`——`projectRootView` 的 `root` = `owningProject` 归属形的薄委托，`:108`；**仅归属命中**——发现读数只供 `workspace` 报明、不进 `root`）；`p = resolve(根, doc)`；`p` 越出根（`..` 逃逸）⇒ 拒（`outside-project`） | 用户 2026-10-25 11:41「不能要求写对吗？」——相对形只有唯一含义 = 项目根相对；根是基面不是起点 |
| 2 | 相对形 ∧ 判不出唯一基根 | `projectRootView` = `workspace` ⇒ 拒（`ambiguous-path`，文案报候选全列 + 期望形）∥ = `none` ⇒ 拒（`dangling-path`，文案报锚态 + 期望形） | 实景：本工作区锚 `D:\teamcode` 下辖两项目（`manifest read` 读数 `state=workspace`）——无唯一项目根，相对形确实无解，只能要求写对 |
| 3 | 绝对形 | 照用（零根试探、零拼接）；**归属判定以会话锚为界**——`owningProject(p, cwd)` 出界 ⇒ `null` ⇒ 拒（`outside-project`） | `docs/core/requirements/ADVISOR-CONVERGENCE.md:48` F18「绝对形照用」+ **「不受理工作目录以外的文档」**（用户 2026-10-25 19:18「评审怎么可能受理别的项目的文档？」）——绝对形自带基面，但不取消「必须在当前项目内」这一条 |
| 4 | 受理判据 | ① 现存普通文件；② 扩展名 `.md`（大小写不敏感）；③ 绝对形：`owningProject(p, cwd)` 非空（住在**当前项目**里）；相对形：分支 1 已限定在会话项目根内 | `criterion=scope-not-doc` 的指义 =「评审对象必须是文档」；本批放宽的是**位置**（`docRoot` 树内 → 项目内任意位置）——F18 边界句「不放开文件种类（非 `.md` 不受理——`scope-not-doc` 仍可达）」 |
| 5 | 不受理 | fail-closed 拒发：`criterion=scope-not-doc`，逐文档列「解析后绝对路径 ∥ 拒因」+ 期望形（项目根相对例 ∥ 绝对路径）；零实例 / 零 token / 零 LLM | F18 判定句「解析不出即拒并说清期望形」+ 同族既有拒发语义（§2.5 载面 ②） |

**拒因四值**（标识行恒 `criterion=scope-not-doc`——四值只作 `reason=`，不进 criterion 枚举）：`ambiguous-path`（相对形 ∧ 判不出唯一基根：工作区锚下辖 ≥1 项目）· `dangling-path`（相对形 ∧ 无项目根且零候选：`none` 态）· `outside-project`（相对形越根 ∥ 绝对形不住在任何项目里）· `not-doc-file`（有基根、档不存在 ∥ 非 `.md`）。

**词汇契约变更（旧 → 新）**：`no-project-root` 退役，按层的两个结果态拆成 `ambiguous-path`（有候选、判不出唯一）与 `dangling-path`（无根、零候选）。

受影响 = 本表分支 2 ∥ 拒因值集 ∥ A-AG19 ∥ 判别实现（`thincoder-core/agent-tools/review-facts.mjs`）∥ 拒发文案（`thincoder-core/agent-tools/advisor.mjs`）∥ 集成行 6-4 ∥ 6-5 的断言（`reason=no-project-root` 改 `reason=ambiguous-path`）。全表与变更理由 = `docs/core/design/PATH-RESOLUTION.md` §4 KD-8。

**拒因命名三问**：`ambiguous-path` / `dangling-path` 直接取统一解析层的两个结果态名（`docs/core/design/PATH-RESOLUTION.md` §2.1）——本面透传，不另造第三个词集。与既有态码 `'no-project'`（`docs/core/design/MANIFEST.md:124` 入口决策树）= **仍有意区分**——`no-project` 说「决策树无项目可落」（写 / 建档面），两个 `*-path` 词说「相对形判不出基根 ∥ 无基根可判」（评审读面）。

`outside-project` / `not-doc-file`：查过 `thincoder-core/**` 与 `MANIFEST.md` 态码表，**none found**（无同义既有名可复用）。

**返回形**：`{ resolved: Map<输入原样, 绝对路径>, invalid: Array<{doc, resolved, reason}> }`——零 `ambiguous` / 零 `candidates`：候选试探与歧义归一退场，`criterion=scope-doc-ambiguous` 随之退场（判据不再可达）。

**消费点与编辑点**（唯一调用方 = `thincoder-core/agent-tools/advisor.mjs:114-146` design 拒发块；编辑点一次列全）：

| # | 编辑点 | 动作 |
|---|---|---|
| 1 | `thincoder-core/agent-tools/advisor.mjs:62-66` | `documents` schema 描述改单一规则（相对形按会话项目根 / 绝对形照用 / 受理 = 项目内现存 `.md`）——删「会话 cwd 试探 + 候选项目根」半句 |
| 2 | `thincoder-core/agent-tools/advisor.mjs:114-119` | 注释块按 §12 单规则重写——删四分支描述与 `scope-doc-ambiguous` 字样（纯注释，零逻辑） |
| 3 | `thincoder-core/agent-tools/advisor.mjs:121` | 解构删 `ambiguous` / `candidates` |
| 4 | `thincoder-core/agent-tools/advisor.mjs:124-130` | 歧义拒发分支整段删除 |
| 5 | `thincoder-core/agent-tools/advisor.mjs:133-141` | 诊断尾改按新形渲染「逐文档：输入 → 解析后绝对路径 ∥ 拒因」+ 期望形两句；旧 `:135` 读 `v.attempted.length`——新形无该属性，不随改即抛 TypeError |

异步面 `thincoder-core/agent-tools/advisor-async.mjs:398-400` 只取 `.resolved.values()`，**零改**（不列编辑点）。

**零残留口径命令**（A-AG21 可重跑）：`rg -n --glob '*.mjs' -e 'candidateRoots|sessionReviewRoots|scope-doc-ambiguous' -e '\.attempted\b' thincoder-core` ⇒ 零命中（无 `rg` 时用同形 `grep -RInE`）。

**收面（仓根放宽）**：受理 = **项目内任意 `.md` 文档**——仓根级文档（项目根下直挂的 `.md`，典型如 `METHODOLOGY` 说明档）与非 `docRoot` 树下的仓内文档（如 `thincoder-core/tool-docs/advisor.md`）一律受理；`docRoot` 五键不再充当评审受理边界。`REVIEW_ROOT_KEYS` / `resolveReviewRootsFor` 保留（写门 `resolveReviewTargetPaths` 的面），评审受理不再消费。

**冻结窗同源**：在途设计评审的 docAbs（`thincoder-core/agent-tools/advisor-async.mjs:399`）取同一 `resolved` ⇒ 放宽受理的文档**同受 D5 冻结**（零新增代码；`inflightDesignReviewConflict` 判据不动）。

**集成验收（起点 = `test/RTM.md` 故事 6「设计评审的文档范围按项目根受理」——delta 三答）**

| 编号 | 组件间交互 | 业务可观察结果 | 入口 | 回指 |
|---|---|---|---|---|
| 6-1 | 工具层 `documents` 解析 ⟷ 评审实例点火 | 仓内非 `docRoot` 树下文档被受理，评审读得到该文档 | 会话内发起设计评审（depth-0） | F18 · A-AG20 |
| 6-2 | 解析 ⟷ 拒发通道 | 项目内代码文件 ⇒ 当场拒发（`criterion=scope-not-doc` ∥ `reason=not-doc-file` + 解析后路径 + 期望形），零实例 / 零 token | 同上 | F18 · A-AG20 |
| 6-3 | 解析 ⟷ 拒发通道 | 项目外绝对路径 ⇒ 当场拒发（`criterion=scope-not-doc` ∥ `reason=outside-project`） | 同上 | F18 · A-AG19 |
| 6-4 | 解析 ⟷ 拒发通道（分支 2） | workspace 锚 + 项目根相对形 ⇒ 当场拒发（`criterion=scope-not-doc` ∥ `reason=ambiguous-path`），文案报候选全列 + 期望形 | 同上 | F18 · A-AG19 |

- **破行（改写）**：6-1——原行未写锚态，而分支 2 让锚态决定成败（workspace 锚下相对形一律拒）⇒ 改写为「会话锚在项目内（cwd = 项目根或其子目录）」，否则同一行在 workspace 锚下假红。
- **破行（夹具——准入门带来的拒因优先级）**：6-1 ∥ 6-2 ∥ 6-3 ∥ 6-4（所在档 `test/integration/review-doc-scope.test.mjs`，同档 6-5 同形）——四例的驱动面 `advisorTool.execute({ type: "design", async: false, documents }, …)` 不携 `batchDoc`，而准入门（§2 第 6 条）位于文档范围解析之前 ⇒ 回执先得 `criterion=batchdoc-missing`：6-1 的「回执非拒」与 6-2 ∥ 6-3 ∥ 6-4 的 `criterion=scope-not-doc` ∥ `reason=ambiguous-path` 均不可达。处置 = **夹具补可读 `batchDoc`**（四例断言逐字不变）；拒因优先级事实同档登记：`batchdoc-missing` → `batchdoc-no-ledger` → `scope-not-doc` ∥ `ambiguous-path` / `dangling-path`，顺序即判据位置（§2 第 7 条顺序表：类型门之后、范围解析之前）。
- **破行（夹具——账链门带来的第二道前提，本批）**：6-1 ∥ 6-2 ∥ 6-3 ∥ 6-4 ∥ 6-5 五例。现夹具批档建在 `mkdtempSync(join(tmpdir(), …))`（同档 `batchRecordFixture`）——不在任何项目内 ⇒ `resolveLedgerRoot` 无根 ⇒ 五例全被 `reason=no-ledger-root` 拒，6-1 的「回执非拒」与 6-2 ∥ 6-3 ∥ 6-4 ∥ 6-5 的范围判据全部不可达。处置见下「夹具处置」（断言逐字不变）。
- **冗余**：无——6-1 ∥ 6-2 ∥ 6-3 ∥ 6-4 各判一类（受理 ∥ 非 `.md` ∥ 项目外 ∥ 锚无根），两两不重叠。
- **缺失**：6-4（`ambiguous-path`——分支 2 此前无行）；编号已先落 `test/RTM.md` 故事 6，用例标题照 `test('6-4 …')`。
- **不在本批变更面的两处**：§2.4 类型门本批零代码改动 ⇒ 不立行；§5 冻结窗本批零新增代码（`docAbs` 取同一 `resolved`），判据 / 文案 / 业务可观察结果均不改——放宽受理的文档只是进入既有冻结面，故不新立行。

**用例设计（实现面——四条用例怎么搭）**

夹具与驱动共一套：临时根 `mkdtempSync(join(tmpdir(), "tc-int-scope-"))`；模型侧 = `node:http` 本机假 OpenAI SSE 端点（回一段固定文本），请求体留档（`requests`）；`agent` = 最小对象 `{ config, provider: { ...entry, model }, cwd }`，`baseURL` 指向假端点——先例 `test/integration/advisor-timeout-hot.test.mjs:27-87`。

**驱动面** = 工具层 `advisorTool.execute({ type: "design", async: false, documents }, { agent, _toolCallId: "t<N>" })`：同步轨（范围判定在点火前）；`_advisorRefusals` 只在 `ctx._toolCallId` 给出时登记，故必须传。

**两个缝：一个不用、一个必须用**。

不用 `_setProjectRootForTest`：覆盖位短路 `projectRootView` ⇒ 6-4 的 workspace 态不可达。

**必须用** `_setLedgerDirForTest`（`thincoder-core/ledger-db.mjs:33`；re-export `thincoder-core/ledger.mjs:156`）：账链门落地后工具面**读**台账，夹具的账只能种在临时目录，不碰真实用户目录。先例 = `test/integration/batch-close-token-consume.test.mjs:78`；`after` 里 `_resetLedgerDirForTest()` 复位。

**夹具处置（账链门带来）**：每例的夹具批档放进**该例的项目根内**（6-1 / 6-2 / 6-3 = 本仓仓根下的临时子目录，`t.after` 删；6-4 反证格 = `p1/`；6-5 = `only/`），并在临时台账目录种一行 `在途`：

1. 批档内容不变（假端点不读它），只换位置。6-4 ∥ 6-5 的项目根 = 其下辖项目（`ws` / `box` 自身无档 ⇒ 无根），与文档解析的锚态（`ws` / `box`）不矛盾。
2. `const ledgerDir = mkdtempSync(join(tmpdir(), "tc-int-ledger-"))` → `_setLedgerDirForTest(ledgerDir)`；`after(() => _resetLedgerDirForTest())`。
3. 种行（**只走写面，不另开库**）：`ledgerAdd({ cwd: <项目根>, row: { … }, boundary: <会话锚> })`（`thincoder-core/ledger-cmd.mjs:144`——它自己 `openLedger(cwd, { create: true, boundary })`，前面再开一次库是多余一步），落 `待讨论`；再 `ledgerUpdate({ cwd: <项目根>, id, patch: { status: "在途", task_book: "<仓根相对指针>" }, boundary: <会话锚> })`（`thincoder-core/ledger-cmd.mjs:168`——第二个参数是 `patch`，状态与指针都装在它里面，不是平铺字段）。**不直写 SQL**——`在途` 必挂 `task_book` 这类 CHECK 正是被测前提的一半；指针须过 `assertTaskBookGate`（`thincoder-core/ledger-write-ops.mjs:80`）的可解析判据。
4. 五例断言逐字不变。
5. 同档头注改：`test/integration/review-doc-scope.test.mjs:11` 那句「`_setLedgerDirForTest`（工具面不读台账——先例同档未设）」本门落地后即为假话，改成「工具面读台账，夹具的账种在临时目录」。

**同配方适用于 24-1 ∥ 24-2 ∥ 24-3**（`test/integration/review-standards-injection.test.mjs`）：三例同样携 `batchDoc` 走点火面，夹具原本没有台账 ⇒ 落门即被 `reason=no-pending-row` 拒、一次模型请求也发不出（`endpoint.requests.length` 断言不可达）。该档夹具已在本例的临时项目根内 ⇒ 缺的是上面第 2、3 步（台账缝 + 种未决行），头注同案登记拒因优先级事实；三例断言逐字不变。

| 编号 | 夹具 | 驱动 | 断言点 |
|---|---|---|---|
| 6-1 | 真仓 = 本仓（`cwd` = 仓根，`PROJECT-MANIFEST.json` 恒在） | `documents = ["thincoder-core/tool-docs/advisor.md"]`（`docRoot` 树外、真实存在） | ① 回执非拒（无 `scope-not-doc`）；② 假端点收 **1** 个请求，请求体含该文档条目或解析后路径 ⇒ 判据「评审读得到」= 评审消息携带该文档；③ 回执含假端点固定文本（评审跑完，不是半途拒发） |
| 6-2 | 同 6-1 | `documents = ["thincoder-core/agent-tools/advisor.mjs"]` | 回执含 `criterion=scope-not-doc` ∧ `reason=not-doc-file` ∧ 解析后路径 ∧ 期望形两句；`_advisorRefusals.has("t2")`；假端点 `requests.length === 0`（零实例 / 零 token） |
| 6-3 | 临时根 `outside/x.md`（无 manifest / 无 `.git`）；项目侧同 6-1 | `documents = [<临时根>/outside/x.md]`（绝对形） | 同 6-2 形态，`reason=outside-project`；`requests.length === 0` |
| 6-4 | 临时根：无 manifest、无 `.git`；下辖 `p1/` ∥ `p2/` 各写一份最小 `PROJECT-MANIFEST.json`（五键 + `codePaths` + `index`，形同 `DEFAULT_MANIFEST`）；`cwd` = 临时根 | `documents = ["docs/a.md"]`（相对形） | `reason=ambiguous-path`；文案含候选全列 ∧ 期望形两句；`requests.length === 0`；**反证格**：`cwd` 换成 `p1/` 同调用 ⇒ 不再以 `ambiguous-path` 拒（基面已存在） |

**边界**：不改 `resolveBatchDocPath` / `batchDocBases`（batchDoc = 另一机制，`BATCH-RECORD.md` §4.15）· 不改 `docSetKey` · 不引入候选试探 ∥ 歧义归一 ∥ 新配置键 ∥ `index.docExtensions` 消费 · 不动轮次 / 陈旧判定 / 结算语义 · 零 UI 面。
