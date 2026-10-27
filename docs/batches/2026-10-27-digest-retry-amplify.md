# 2026-10-27 · digest-retry-amplify
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-27 · 来源 = 台账 #1850 · 用户 2026-10-27 20:44「那个重投机制感觉有问题啊！为啥经常多次投递？」· 20:48「重复投递的问题开始处理了吗？」· 根因实读 = `thincoder-core/agent/digest-account.mjs:55-58`（覆盖机检）与 `:93-96`（未覆盖 ⇒ `_daFailures += 1`；`output == null` 全条未覆盖）。
> 台账 = #1850（AGENT-LOOP · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-27
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 病：报告重投，越忙越投

**用户 2026-10-27 20:44 提出：「那个重投机制感觉有问题啊！为啥经常多次投递？」**

**机制本身没错 —— 它在正确工作。** `thincoder-core/agent/digest-account.mjs:55-58` 的覆盖机检 = 「输出文本内存在一行同时含 `[digest-ack` 与 `#<id>`」；`:79-82` 未覆盖 ⇒ `_daFailures += 1`，`≤ DA_RETRY_LIMIT`（`:27` = 2）⇒ 下一轮重投，超限升级为 `_unsettledDigests`。防的是「报告无声消失」（`:3` 挂 `#930`）。

**问题在 `:82` 这一句**：`output == null`（抛错 ∥ 撞帽 ∥ 未收口）⇒ **全条未覆盖（安全方向）**。

**⇒ 父侧一旦产生空回合，报告就被记成「没消化」而重投。**

### 1.2 实测：今日 20 次投递，13 次是回路产物

| 席 | 投递次数 |
|---|---|
| `#22` · `#24` | 各 4 次 |
| `#23` · `#26` | 各 3 次 |
| `#25` · `#27` · `#28` | 各 2 次 |

**逐条对时后，每次重复都对应一次父侧空回复（会话中出现多轮 `your last response was empty`）。**

**写了 ack 的回合全部正常销账；空掉的回合全部重投。**

### 1.3 形状：不是随机故障，是高负载时必然出现

**空回复发生在「刚收到报告、正要处理」那一刻 —— 推理负载最高的时点。**

**而那一刻恰恰是报告最多的时点。**

**⇒ 回路总在最忙的时候放大。** 今日 20:20–20:46 多席并跑窗口即为实证。

**★ 这一层对修法是硬约束**：**修法不得让高负载窗口里的报告更易丢失** —— 「假阴可重投」是安全方向，别为省投递把方向反了。

### 1.4 与 `#1840` 的关系：同一类病的第二层

| 层 | 症状 | 状态 |
|---|---|---|
| **第一层** | provider 返回空 content | `#1840` 已修（`isSubstantiveResponse` + 单点清零） |
| **第二层** | **父侧这一回合产生了空输出**（推理耗尽 ∥ 截断），机制把它记成「未消化」 | **本批** |

**⇒ 第一层治了，第二层没治 —— 而第二层今天放大了 13 次。**

### 1.5 两条候选修法（不要并举）

| 路 | 做什么 | 代价 |
|---|---|---|
| **甲** | 空回复不扣账（`output == null` 时不计 `_daFailures`，下轮仍重投） | 真·卡死的空回复会无限重投 ⇒ **须另设「连续空 N 次」的升级判据**，且 N 要留够（高负载会连空两三轮） |
| **乙** | 空回复即自愈（复刻 `#1840` 的形：空输出触发一次重生成，仍空才计账） | 要接进既有重生成面；代价是每轮多一次可能的模型调用 |

**★ 判据：选一条，并说明为什么另一条不够。约束 = 1.3 那条（别把安全方向反了）。**

### 1.6 边界（不做）

- **不改覆盖机检本身**（`coversDigestId` 的判据 = 一行含标记 + id，是对的）
- **不改 `DA_RETRY_LIMIT` 的语义**（重投次数上限仍存在）
- **不动「假阴可重投」的安全方向**

### 1.7 完成判据

| # | 判据 | 怎么验 |
|---|---|---|
| 1 | 父侧回合输出为空 ⇒ 该条 `_daFailures` **不变**（修前 +1） | 单测：夹具置 `output == null` 跑 `accountDigestRound` ⇒ `_daFailures` 前后相同 |
| 2 | 「连续空 N 次」仍会升级（不许变成永远不升级） | 单测：连置 N 次空 ⇒ 该条进 `_unsettledDigests` 且恰一条提醒 |
| 3 | 正常路径零回归 | 单测：写 ack 行 ⇒ 覆盖 + 离容器；不写 ack ⇒ 计一次失败（既有行为不变） |
| 4 | 高负载窗口不更易丢 | 单测：三轮连续空 ⇒ 报告仍在容器内（不丢），第四轮写 ack ⇒ 正常销账 |

### 1.8 父侧核结论（回答设计席 §2 上抛的那条分水岭）

**设计席上抛：「压缩是否保留报告正文」决定「甲是终形还是过渡形」，需读 `thincoder-core/agent-tools/context.mjs` 的压缩保留策略。**

**父侧实读三处，结论：甲即终形，丙方案（整删重投）不成立。**

**① 压缩确实会吃掉历史里那份。**

`thincoder-core/context.mjs:5-6` 逐字：「Compaction strategy: summarize everything before the tail into one LLM note, keep the latest N messages verbatim. NOTE: no dedicated head is kept (KEEP_HEAD = 0)」。

⇒ middle 换成一条摘要 note，只有 tail 的 N 条留原文。**注入的那条报告消息若落进 middle，正文就没了。**

**② 但重投不读历史 —— 它读 `e.report`。**

`thincoder-core/agent/run-start.mjs:52` `await injectAsyncResult(agent, e)`；`:55` 逐字：

> `releaseChildHold(e) // 仅释放 `childAgent`——`report` 保留至销账 / 升级（重投需原文）`

**⇒ 设计明确写了「`report` 保留……（重投需原文）」—— 重投的原文从条目字段取，不从 `history` 取。**

**③ 升级面用的是 `preview`（400 字符），不是重投面。**

`thincoder-core/agent/digest-account.mjs:153` `preview: String(u.report ?? "").slice(0, 400)` —— 只在 `unsettledRows` 里用。

**⇒ 所以「压缩后正文不可还原」这个担心，落在**升级面**（400 字符截断），不落在**重投面**。**

### 1.9 因此本批的形状确定

| 面 | 现状 | 本批 |
|---|---|---|
| **重投** | 从 `e.report` 取全文，与 `history` 无关 | 不改 |
| **升级** | `preview` 只 400 字符 | **不动**（要改它是另一件事：升级行要不要全文？若全文，升级面会长出与重投同量级的正文 —— 那要单独判） |
| **空回合计账** | `output == null` ⇒ 全额记 `_daFailures` | **本批改**（甲 + `DA_EMPTY_LIMIT`） |

**⇒ 设计席的甲（空回合零动 + 连续空 4 轮升级）即终形；丙方案（整删重投）的前提不成立，不立。**

### 1.10 用户裁定：B（2026-10-27 21:51）

- **已定决定**：本批按 **B** 落 —— 空回合不重投（上界塌回 ≤3，投递量与修前同级）；不取 A（空轮仍投、上界 3 → 6）。 · 用户原话：「**B，重投本来就是我为了应付一段时间模型不稳定加的，稳定了还一直留着反而经常出问题。**」 · 时间：2026-10-27 21:51

### 1.11 这句原话里还有一层，我必须摆出来（未裁）

**用户给的理由不是「A 的数字太大」，而是：**

> **「重投本来就是我为了应付一段时间模型不稳定加的，稳定了还一直留着反而经常出问题。」**

**⇒ 这句话的主语是**重投这个机制本身**，不是「空回合要不要重投」。**

**⇒ 若按字面读：重投是**临时补丁**，当时的动因（模型不稳定）已过去，补丁留着反而惹事 ⇒ 该整个退场。**

**两种落法，差别很大：**

| 形 | 空轮 | 「有输出未签收」 | 投递上界 | 代价 |
|---|---|---|---|---|
| **B（本批已裁）** | 不投 | **仍重投** | ≤3 | 无额外代价；报告正文可重投 |
| **丁（整个退场）** | 不投 | **不投** | 1（只投一次） | **升级面只有 `preview` 400 字符** —— 长报告的正文会丢 |

**⇒ 「丁」的代价是本批之前判过的：升级行 `preview` 只 400 字符（`thincoder-core/agent/digest-account.mjs:153` 实读）。**

**⇒ 而「丁」在正文可还原性上**不成问题**：重投读 `e.report`（`thincoder-core/agent/run-start.mjs:55` 逐字「`report` 保留至销账 / 升级（重投需原文）」），与 `history` 无关；`context.mjs:5-6` 的压缩吃掉的是历史里那份，不影响 `e.report`。**

**⇒ 所以「丁」真正的代价只有一个：**不再自动重投后，未签收的报告只能靠升级面的 400 字符 preview 被看见**。**

**§1.10 已裁的是 B。丁要不要做 = 另一件事，须用户另裁；本批不擅自扩大。**

### 1.12 停相：设计跑完即暂停（2026-10-27 22:09）

- **已定决定**：`#39` 修正轮落地后**停在本批设计面**，不送第三轮回评、不进批准与实施；用户先重启会话（新引擎生效）。 · 用户原话：「**设计跑完以后暂停一下，我先重启。**」 · 时间：2026-10-27 22:09

**重启后恢复点（写给下一次接手）**

- `#1849`（tool-docs 面分层）：实施已完成、四例全绿、54 档段命中 0 —— 收口链**卡在重启**（不重启则 `doc_check` / `batch close` 读旧引擎 = 37 条 / 28 档）。重启后依次：回填 `thincoder-core/tool-docs/doc_check.md` 两处断行（实施席的版式妥协，`#34` 报告第 6 条）→ 修设计档 as-of 坐标漂移（`#34` 上抛第 3 条）→ 跑 §6 收口链。
- `#1850`（digest 重投退场，方案丁）：第二轮回评 changes-required 13 条已派 `#39`；本轮落地后停。**未送第三轮回评**（按本条停相）。

### 1.13 停相解除（2026-10-27 22:54）

- **已定决定**：§1.12 的停相（设计跑完即暂停）**作废** —— 用户以整批令覆盖，批内全链自动跑完（评审 → 修正 → 批准 → 实施 → 收口）。 · 用户原话：「**自动跑完**」 · 时间：2026-10-27 22:54

### 1.14 第三轮回评裁定（2026-10-27 23:0x）

**评审判 PASS**（🔴 0 · 🟡 1 · 🔵 5）—— prior 表 13 条全数核实落地。

| # | 级别 | 裁 | 理由 |
|---|---|---|---|
| 1 | 🟡 | **Fixed（本轮修）** | 披露注入的对象未指定：账本记录不含 `error` / `run`，而墓碑值（`:1010`）与评审水印（`:1011`）按原条目字段才成立。**不修的风险 = 失败报告的墓碑从 `failed` 写成 `consumed`**，读面从此看不出它是失败件。 |
| 2 | 🔵 | **Fixed（本轮修）** | `test/RTM.md` 用例行实读 63（非 66）—— 故事 2 三行已退役。窗口结论不变，但 `:281`/`:301`/`:237` 三处读数失真。 |
| 3 | 🔵 | **Fixed（本轮修）** | T-DA23 把披露写成单一注入器，与 role 分流只在非 consult 下成立。 |
| 4 | 🔵 | **Fixed（本轮修）** | §6.34.8 的「1417」与现盘实读 1312 行不符。 |
| 5 | 🔵 | **Fixed（本轮修）** | 「乙的否决理由 ①③」引用了不存在的 ③。 |
| 6 | 🔵 | **Fixed（本轮修）** | 返回形 `retried` 字段随重投退场失去消费者，设计未收正。 |

**全数本轮修**：一条 🟡 会改变运行时可观察行为（墓碑值），五条 🔵 是与实读不符的读数 —— 都不该带进实施。

### 1.15 裁：用例宿主约定（§5.6 第 3 条 · 父侧 2026-10-27 23:3x）

**两条上抛（`#3` / `#4` / `#6` 三次）都在问同一件事：「单元档住哪」。父侧实读四包后裁如下。**

- **已定决定**：**两条路都对，各治一半** —— ① 单元档**移位**到 `docs/batches/`（核包）；② 设计档 `:943` 那句**补上核包例外**（它描述的是既有代码，但把「各包 `test/`」写成了通例）。 · 用户原话：（本条为父侧对既有代码约定的判读，非用户新裁定；用户当日 22:54 整批令「自动跑完」授权批内自行处置） · 时间：2026-10-27 23:3x

**实读依据（四包 `test/` 目录逐包数）**

| 包 | `test/*.test.mjs` | 与 `:943` 的关系 |
|---|---|---|
| `thincoder-vscode/test/` | **5 档** | ✓ 「各包 `test/`」在此成立 |
| `thincoder-cli/test/` | **0 档** | `:939` 引的 `timer-rearm-order.test.mjs` 是 timer 批的**计划**档，尚未落 |
| `thincoder-core/test/` | **1 档**（本批放错的那档） | ✗ **不成立** —— `run.mjs:34-36` 对该目录任何 `*.test.mjs` 报 `uncollected test file` |

**⇒ 所以 `:943` 不是「全假」，是**把例外写成了通例**：核包本就拒绝单元档住在自己的 `test/`，`run.mjs:35` 的报错文案逐字写着「unit test files live in `docs/batches/`」。

**处置**

- **① 移位**（`#5`，进行中）：`thincoder-core/test/digest-empty-round.test.mjs` → `docs/batches/2026-10-27-digest-retry-amplify.test.mjs` —— 该档随收口删除，落 `docs/batches/` 才天然同目录。
- **② 收正**（`#7`）：`:943` 改成「用例宿主 = 各包 `test/`（VSC 现 5 档；CLI 计划落）**；核包例外** —— `thincoder-core/test/run.mjs` 对 `test/` 下 `*.test.mjs` 报 `uncollected test file`，核包单元档落 `docs/batches/`」。
- **不做的**：不改 `run.mjs`（它是既有代码且行为有意为之：fail-closed 反查 + 无集成集恒 `exit 1`）。本批不借裁定的名义去动一个与本批无关的 runner。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成 2026-10-27
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试覆盖 / 验收对照 / 关键决策 / 上抛项>
### 2.1 判定：算不算病（回答第一问）

**覆盖机检对，缺痕判据也对 —— 病在判据之后那一步。**

`thincoder-core/agent/digest-account.mjs:93-96`（覆盖判据只对非空输出开门（`:93`），空输出落到 `:94` `entry._daFailures = (entry._daFailures ?? 0) + 1`）对空回合与「有输出但没写 ack」走同一条账。于是「父侧一个正文字都没产出」被记成「读了却没签收」。

**判定 = 缺陷，不是安全方向。** 理由：`_daFailures` 的语义是「投过了、模型有签收机会却没签」；空回合不满足「有签收机会」，不是这条语义的实例。危害不止放大投递 —— 连空 3 轮即把条目升级成终态、停止重投，**「不无声消失」的出口提前关上**。

**不是「放大可接受」**：放大只是表象，状态被写错才是本体。

### 2.2 第三问：`output == null` 分不分得清两种空

**字面分不清，实质分得清 —— 结论 = 甲不会把撞帽一并豁免。**（实读三条）

- 落痕只收非空正文：`thincoder-core/agent/turn-loop.mjs:167-168`「`if (carrierField(agent, "_daSession") === true && response.content)`」⇒ 空正文轮零追加。
- 撞帽不是停止径：`thincoder-core/agent/run-stages.mjs:286-287`（`ContinueError` 分支只保留池），见账照在 `:304-307` 跑（其条件只排除用户全停 abort）。
- 截断（`max_tokens`）产出的是**部分正文** ⇒ 非空 ⇒ 照样进落痕。

**⇒ `output == null` 的实际含义 = 本 run 每一轮正文都为空，或本 run 零模型轮。** 撞帽 / 截断后**说过一个字**的 run，`output != null` ⇒ 照旧按覆盖机检判、照旧计账。

**残余边界（登记）**：整 run 只有工具轮、零正文（工具调用算「有实质」——`thincoder-core/agent/completion.mjs:26-28`）⇒ 也是 `output == null`。此形与空回合同判（计一个未签收轮），由 §2.3 的未签收上限兜住。

### 2.3 机制设计（丁：投递恒一次 + 未签收上限 + 升级终局披露）

**选丁（用户 2026-10-27 21:53「丁 做」）。** 细则：

- **投递恒一次**：`shouldDeliverEntry` 收为单门——`_daDelivered` 未置 ∧ 本回合 = 系统轮 ⇒ 投；已置 ⇒ 恒跳过（现行 `thincoder-core/agent/digest-account.mjs:44-47` 的第二判据 `_daRetry === true` 整个删）。`_daRetry` 字段一并删（唯一置位点 `:95`、清点 `run-start.mjs:54`）。
- **注入失败的再试保留**（与重投不同源）：注入抛错 ⇒ 循环在 `e._daDelivered = true`（`thincoder-core/agent/run-start.mjs:53`）之前中断 ⇒ `_daDelivered` 未置 ⇒ 下一系统轮照 `!_daDelivered` 再投一次。丁删的是「父侧没签收 ⇒ 再投」，不是「注入本身失败 ⇒ 不再试」。
- **新常量 `DA_MISS_LIMIT = 4`**：条目积满 4 个未签收消化轮 ⇒ 升级。删 `DA_RETRY_LIMIT`（`:27`）；不立 `DA_EMPTY_LIMIT` / `DA_ATTEMPT_LIMIT`（丁下无第二计数可分离——空回合与有输出未签收同出口）。
- **条目新字段 `_daMissRounds`**：未签收轮数。**空回合与有输出未签收同判同计**——它不是对父侧的问责计数，是「等多久才交给人」的等待轮数；`_daFailures` / `_daEmptyRounds` 两字段随之删。
- `accountDigestRound` 逐条判定（现行 `thincoder-core/agent/digest-account.mjs:91-97`）改为两支：
  - 覆盖（`output != null` ∧ `coversDigestId`）⇒ 离容器 + `releaseSettledEntry`（零改）。
  - 其余（空回合 ∥ 有输出未签收）⇒ `_daMissRounds += 1`；`< DA_MISS_LIMIT` ⇒ 条留容器、**零投递动作**；达 `DA_MISS_LIMIT` ⇒ **升级**。
- **升级 = 四步固定先后（账本 → 提醒 → 离容器 → 披露）**：机制正文单源 = 设计档 §6.31.5「升级支」。三条要点：
  - **纯内存的两面先落、披露最后**：① `_unsettledDigests` 追加 `{ id, role, missRounds, report, at }` ② `pushReal` 恰一条 + `logEvent("ev:unsettled", { n, ids })` 恰一条 ③ `splice` 离容器 ④ 终局披露。理由：披露是本 pass 唯一的 I/O，抛错会中断余下条目判定并越过 `thincoder-core/agent/run-stages.mjs:308` / `:312-315`（pass 由 `thincoder-core/agent.mjs:104` 的 `finally` 单行调用）。
  - **披露按 role 与首投同分流**：`role === "consult"` ⇒ `injectConsultResult`（`thincoder-core/agent-tools/consult.mjs:186`），其余 ⇒ `injectAsyncResult`（`thincoder-core/agent-tools/subagent-async.mjs:374`——内部已分派 bg / browser）；不新造第二投递形。`accountDigestRound` 因此变 async（唯一调用点 `thincoder-core/agent/run-stages.mjs:306` 加 `await`——该处已在 async 收尾函数内）。
  - **披露逐条 try/catch，失败只留痕**（形同 `thincoder-core/agent/suspension.mjs:163` 注入循环收口；差异 = 该处首错即 return，本处逐条 continue）。判据 = **披露失败不得使报告离开可见面**：账本 + 提醒 + status 面（`preview` ≤400 字符）已在披露之前落定，可见性降级而非消失，失败有留痕（不是「失败当成功」）。
- **复用注入器的副作用（登记）**：轮累计预算再记一次（`subagent-async.mjs:385`）· 二次落盘（tag 同首投——`:388-389`）· 墓碑重写同值（`:420`）· 评审族投递水印后移（`noteReviewDelivered`——`:412`；水印语义见设计档 §6.11「最后一次投递」）。**F-DA3「正文完整可见」的边界**：超长 / 超预算的报告走「落盘 + 路径」或「清单行」——路径即完整正文入口（`force: true`），与首投同形，不相抵。
- **披露选型（② 而非 ① / ③）**：丁取消反复投递后，正文的**唯一自动出口**就是升级这一刻。①（只靠提醒 + 400 字符 `preview`）让长报告正文只剩 `thincoder-core/agent/digest-account.mjs:179` 的 400 字符，而正文在（`thincoder-core/agent/run-start.mjs:55` 逐字「仅释放 `childAgent`——`report` 保留至销账 / 升级（升级终局披露需原文）」）——留着不投 = 保留承诺失去消费者；③（`preview` 改全文）把正文塞进 status 面，只在父侧主动查时出现，且每次 status 都背全文。② 结构上至多一次（升级即离容器，不再判定）——用户诉求是删「反复」，不是删「让人看见」。
- **N 的依据（可复算，不取观测值）**：`DA_MISS_LIMIT = 4` = 「连空 3 轮仍须在容器、第 4 轮补签仍能销账」（§1.7 判据 4）+ 1 轮余量。原「观察上界 3」不作依据：修前总投递 ≤3 把单条 ≥4 连空删失在记录之外，观测不到。
- **未签收支的场景出处**：恒空提供端 ⇒ `thincoder-core/agent/completion.mjs:51-61` 空响应重试两次后抛 `LLM returned empty response` ⇒ 该 run 零非空正文 ⇒ 每消化轮皆判未签收（现实形 = `test/RTM.md:192` 行 15-2；夹具形 = `test/integration/empty-response-retry.test.mjs` 的假 SSE 端点）。
- **投递净效应（单栏）**：每条报告投递 **1 次**；未签收件升级时披露 **1 次**（结构上至多一次）⇒ 每条报告在会话里最多出现 **2 次**（修前空回合径可达 3 次，且每次空回合都追加一次）。空回合零投递 ⇒ 「父侧空回合 ⇒ 报告又被推一遍」这条放大链消失。
- **轮数口径**：`attempts = _daMissRounds`；提醒句轮数恒 = `DA_MISS_LIMIT`（升级只在第 4 个未签收轮发生，同批升级条恒同值 ⇒ 无「取最小值」问题）；`unsettledReminder(n, ids)` 保持二参（现行 `thincoder-core/agent/digest-account.mjs:125`、唯一调用点 `:118`、三端不消费）。
- **读面口径**：`unsettledRows` 的 `attempts = _daMissRounds ?? 0`、`state` 判 `attempts > 0`（原 `retrying` 更名 `unaccounted`——彻底无重投，「retrying」是假名）；端面残余行同拍——`unsettledCount` 由 `_daFailures > 0` 改为 `attempts > 0`（`thincoder-core/agent/digest-account.mjs:166-171`），三端读取点 = `thincoder-cli/src/tui/suspension-drive.mjs:120` · `thincoder-desktop/src/main/turn-face.mjs:181` · `thincoder-vscode/src/extension/suspension.mjs:221`（端侧零改，只换核判据）。
- **不动**：覆盖机检（`coversDigestId`）、`_daDelivered` 置位、fallback 面（无 `_daSession` 零账目动作）、`_unsettledDigests` 清场面。

### 2.4 第二问：重投到底救回过什么（回答①②）

**① 报告留在容器 ⇒ 会不会丢？** 压缩会吃掉历史里那份注入副本，**但重投不读历史，读 `e.report`。**

`thincoder-core/context.mjs:5-6` 逐字：「Compaction strategy: summarize everything before the tail into one LLM note, keep the latest N messages verbatim. NOTE: no dedicated head is kept (KEEP_HEAD = 0)」⇒ 注入的那条报告消息若落进 middle，`history` 里那份正文就没了。

而重投走 `thincoder-core/agent/run-start.mjs:52` 的注入，`:55` 注句逐字「仅释放 `childAgent`——`report` 保留至销账 / 升级（升级终局披露需原文）」⇒ **重投面与压缩无关**（父侧 2026-10-27 实读，§1.8 ②）。

升级面用的是 `preview`（`thincoder-core/agent/digest-account.mjs:179`，`slice(0, 400)`）⇒ 「压缩后正文不可还原」这个风险落在**升级面**，不落在重投面。

**⇒ 丁下：重投退场；正文的可见出口 = 首投一次 + 升级终局披露一次——400 字符 `preview` 不再是唯一出口（丙方案「只提醒不披露」的前提不成立）。**

**② 今天 13 次救回了什么？** 记录层面**答不了**：没有任何日志字段记「重投时正文是否还在历史里」。能证的只有两件 —— 每次重复都对应一次父侧空回合（§1.2 实测），而空回合下代码对**全部**投递条一律计账，不管父侧读没读。⇒ 触发器（空回合）不是「没读」的证据；「13 次里几次是真还原」无从判定。

### 2.5 第四问：ack 判据能不能更宽

**不能宽 —— 否决三条，各带失效路径：**

- 「输出里提到该 id 即算覆盖」：账目要求行**每轮**都列全部未销账 id（`thincoder-core/agent/run-start.mjs:59-64`）⇒ 复述要求行、或明确写「不处理 #22」都算覆盖 = #930 要防的假阳。
- 「动了相关文件」：代理判据 —— 父侧为别的事情改文件也过。
- 「下一轮补 ack 也算」：**本来就是这样**（判据窗 = 本 run；跨轮靠账目要求行的 id 清单补账——投递不重发，既有用例 T-DA19）。

**「读了但这一轮没产出文本」这一形，由 §2.3 的空轮免账处理，不由放宽判据处理。**

### 2.6 关键决策（含否决项）

| 选项 | 结论 | 理由 |
|---|---|---|
| **丁**：投递恒一次 + 未签收上限 4 + 升级终局披露 | **采纳**（用户 2026-10-27 21:53「丁 做」） | 见 §2.3；重投整个退场 ⇒ 投递量与「一条报告一次」对齐；正文可见性由升级终局披露承接 |
| **甲**（空回合仍重投 + 上限 4 / 6）∥ **B**（空回合不重投、有输出未签收仍重投） | 否决 | 两路都留着重投回路：空轮径 / 混轮径的投递上界仍要 ≤4 / ≤6，与「为啥经常多次投递」方向相反；用户两次裁定（21:51 B、21:53 丁）一路收紧到丁 |
| **乙**：空回复即自愈（复刻 #1840 形） | 否决 | ① 同一件事已有机制：`thincoder-core/agent/completion.mjs:44-60`（`MAX_EMPTY_RETRIES = 2` + 逐字提醒）就在 run 内做，见账 pass 跑在它**之后** ⇒ 再加一层 = 更晚、抓手更少；② 每次空轮多一次模型调用，而空轮正出现在负载最高时（§1.3） |
| **丙**：完全不重投，而升级面只提醒 + 400 字符 `preview` | 否决 | 正文只剩 `preview`（`thincoder-core/agent/digest-account.mjs:179` 实读）——丁取消反复投递后，正文的唯一自动出口就是升级这一刻；**丁 = 丙 + 终局披露一次**，故取丁不取丙 |
| 放宽覆盖判据 | 否决 | 见 §2.5 |

**最近先例**：空输出不当成「已答」、只在一个有界额度内重来 = `thincoder-core/agent/completion.mjs:44-60`（`MAX_EMPTY_RETRIES = 2` + 逐字提醒，run 内）。对应设计节 = §6.31.5。

- **对齐点**：空输出不推进终态——那里只推进重试计数，这里空回合只记 `_daMissRounds`。
- **偏离项**：本批不在见账 pass 里驱动模型轮（不自愈），理由 = 乙的否决理由 ①②。
- **上限换物**：`DA_RETRY_LIMIT`（重投 ≤2）退场，`DA_MISS_LIMIT`（未签收轮 ≤4）取而代之——数字与语义都换，不沿用。

**调研证据**：查过 `test/RTM.md` 全表（2026-10-27 实读 = **16 故事 63 行**，按 `| N-M |` 用例行计数——故事 2 三行已退役，故事 18 尚未立）。

- 故事 15 三行（`:191-193`）是恒空提供端现形；其余故事零消化账务面。
- `test/integration/`：18 档，零档驱动消化账务 ⇒ 无既有集成用例可扩。
- 需求侧：`docs/core/requirements/AGENT-LOOP.md` §4.15（F-DA1–F-DA6 / N1–N4）。F-DA3 只钉「未签收轮 ≤N，N 由设计定」，两条上限不与之相抵。
- 第三方源档：无相关（本批全在核内状态机，无外部协议 / API 面）。

### 2.7 设计档落点

- 机制正文：`docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.31.2（销账 + 投递恒一次）· §6.31.4（投递门控单门）· §6.31.5（缺痕 ∥ 判定两支 ∥ 未签收上限 ∥ 净效应 ∥ 升级支 ∥ 先例 ∥ 调研证据）· §6.31.6（`attempts` 口径 + 残余行判据 + `unaccounted` 状态名）· §6.31.9（`digest-account.mjs` 行数重锚）· §6.31.10（T-DA1/2/4/5/8/17/18/19/20/21/22/23 收正）· §6.31.11（A-DA1 / A-DA3 / A-DA9 收正）· §6.31.12（fallback 边界句去 `_daRetry`）· §6.31.13（KD-DA4 / KD-DA11 收正）。
- **收正点（活体规范面的「重投」字样——本轮扫全文，八处 + 两处读数）**：① §6.31.2 会话标记句「会话内（可重投）」② §6.11 第 1 条单查序括注「重投中」③ §6.31.3 注入回合条件句「含本回合首投 / 重投」④ §6.31.13 KD-DA8「重投门控仅消化轮」⑤ §6.34.2 行 3「重投（`_daRetry`）仅消化轮保持」⑥ §6.34.7 A-AD5「账目 / 重投 / 升级 / 清场」⑦ §6.34.9 KD-AD3「重投仍仅消化轮」⑧ §6.34.10 边界 3「判据 / 重投 / 升级 / 清场」；另 §6.34.8 行数读数（`run-start.mjs` 158 ⇒ 159）与 §6.31.10 用例宿主段（补 T-DA21–24）。机制正文仍单源在 §6.31；§6.34.3 ③ 与 T-AD4 上一轮已同拍。
- 本批一次性内容（受影响文件、验收对照、上抛项、集成用例设计）= 本段 §2，不进设计档。

### 2.8 受影响文件与测试覆盖

| 文件 | 现行行数 | 预计增量 | 改动 |
|---|---|---|---|
| `thincoder-core/agent/digest-account.mjs` | 189 → **216**（2026-10-27 实施后实读，`wc -l` 口径） | 已落（净 +27） | 删 `DA_RETRY_LIMIT` / `_daRetry` / `_daFailures` / `_daEmptyRounds`；立 `DA_MISS_LIMIT = 4` + `_daMissRounds` + 判定两支 + 升级四步（按 role 分流披露 + 逐条 try/catch）+ async 化 + 升级行 `missRounds` + 提醒句轮数 + `unsettledRows` / `unsettledCount` 口径 + 返回形去 `retried`（调用点 `thincoder-core/agent/run-stages.mjs:306` 不取返回 ⇒ 重投退场后零消费者） |
| `thincoder-core/agent/run-start.mjs` | 159 → **159**（2026-10-27 实施后实读，`wc -l` 口径） | 已落（±0） | 删 `e._daRetry = false`（原 `:54`——字段退场）；`shouldDeliverEntry` 调用改两参（`:51`） |
| `thincoder-core/agent/run-stages.mjs` | 356 → **355**（2026-10-27 实施后实读，`wc -l` 口径） | 已落（−1） | 见账 pass 加 `await`（`:306`——`accountDigestRound` 因披露变 async）；`:308` / `:312-315` 零改（披露失败不得越过它们——§2.3） |
| `docs/core/design/API-CONTRACT.md` | 生成区（生成器唯一笔） | 生成器重跑 | 收口前 `node scripts/api-contract.mjs --write`——生成区须随源码收敛（`DA_MISS_LIMIT` 常量行 ∥ `shouldDeliverEntry` 两参 ∥ `accountDigestRound` async）；非人工笔 |
| `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` | 1285 → **1312**（2026-10-27 实施后实读） | 已落 | §6.31.2 / §6.31.4 / §6.31.5 / §6.31.6 / §6.31.9 / §6.31.10 / §6.31.11 / §6.31.12 / §6.31.13 + §6.34.3 ③ / T-AD4 收正（见 §2.7） |
| `thincoder-core/test/digest-empty-round.test.mjs` | 新档 **342**（2026-10-27 实施后实读） | — | 本批单元测试档（收口删除；用例 = §2.9 八行 + 披露形态，含 T-DA24 披露错误径） |
| `test/integration/digest-empty-round.test.mjs` | 新档 **158**（2026-10-27 实施后实读） | — | 集成资产·常驻（RTM 行 18-1 的用例档，随 RTM 长期在场；§2.11） |
| `test/RTM.md` | 63 → **64** 用例行 / 17 故事（2026-10-27 实施后实读） | +1 行 | 新增故事 18「一条后台报告只投递一次，未签收时才升级」+ 行 18-1（§2.11） |
| `thincoder-core/i18n.mjs:46` | 词文一格（`digest.residue`） | — | zh「不再自动重投，未签收满额即升级 UNSETTLED」/ en「no automatic re-delivery; escalates to UNSETTLED」——旧文在丁下为假（用户可见面） |
| `thincoder-core/agent-tools/async-settle.mjs:142` / `:190` | JSDoc 两处 | — | 账本行 `failures` → `missRounds`；`releaseChildHold` 保留理由「重投需原文 / 重投上限」→「升级终局披露需原文 / 未签收条数」 |
| `thincoder-core/agent-tools/subagent-actions-query.mjs:33` | JSDoc 一处 | — | 状态名 `(awaiting-digest / retrying)` → `(awaiting-digest / unaccounted)` |
| `thincoder-core/agent/suspension.mjs:243` | 注释一处 | — | 删「/ 重投回路」字样（重投回路已退场，`_daSession` 只余见账一个判据） |

**拆分面**：`digest-account.mjs` 189 → **216**，未越档线（500 软线）；零新职责，导出面仅换物（常量同址、披露复用既有注入器——按 role 分流，无新导出）⇒ 不拆。

**运行命令**：`node --test thincoder-core/test/digest-empty-round.test.mjs`（用例宿主目录口径 = `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.31.9 末条「用例宿主 = 各包 `test/`，`test/*.test.mjs` 单层收集」）。

### 2.9 验收对照（判据 → 设计节）

| §1.7 # | 判据 | 设计落点 | 机检形态 |
|---|---|---|---|
| 1 | 空回合 ⇒ 该条不计问责、零投递、条留容器（修前：`_daFailures` +1 且置重投） | §2.3 判定第二支 | 夹具置 `output == null` 直驱 `accountDigestRound` ⇒ `_daMissRounds === 1`、容器内、注入计数不变（修前红：`_daFailures` +1 且 `_daRetry` 置位 ⇒ 下轮再投） |
| 2 | 未签收达 4 轮 ⇒ 升级（不许永不升级） | §2.3 `DA_MISS_LIMIT = 4` | 连置 4 次未签收轮 ⇒ `_unsettledDigests` 恰 1 条（携 `missRounds = 4`）+ 提醒恰 1 条（句中轮数 = 4）+ `ev:unsettled` 恰 1 条 |
| 3 | 正常路径零回归 | §2.3 判定第一支 + 门控 | 写 ack ⇒ 覆盖 + 离容器 + 报告释放；注入抛错 ⇒ 下一系统轮再投一次（`_daRetry` 删后此路仍成立） |
| 4 | 高负载窗口不更易丢 | §2.3 判定第二支 + 升级支 | 连空 3 轮 ⇒ 条仍在容器且 `report` 未释放；第 4 轮写 ack ⇒ 正常销账 |
| 5（本批新增） | 投递上界不涨（用户诉求本体） | §2.3 净效应 | 任一条目在容器期被注入的次数恒 = 1（修前空回合径 ≤3）；升级披露后 `history` 中该报告正文出现恰 2 次 |
| 6（本批新增） | 升级披露是终局一次 | §2.3 升级支 | 升级后再开 5 个消化轮 ⇒ 注入调用计数仍 = 2（首投 + 披露）、零新提醒 / 零新事件 |
| 7（本批新增） | 读面换物同判（status 面 ∥ 三端残余行） | §2.3 读面口径 | 直驱 `unsettledRows` / `unsettledCount`：未投递条 ⇒ `state = "awaiting-digest"`、`attempts = 0`、不计入 count；未签收未达限条 ⇒ `state = "unaccounted"`、`attempts = _daMissRounds`、count 计 1；升级后 ⇒ 条离容器、count = 0、status 行 `state = "unsettled"` 携 `preview`（≤400 字符） |
| 8（本批新增） | 披露失败不得使报告离开可见面 | §2.3 升级支「逐条 try/catch」+ 设计档 §6.31.11 A-DA10 | 夹具令披露注入器抛错 ⇒ 该条仍在 `_unsettledDigests`、提醒仍恰一条、`unsettledCount = 0`、失败留痕恰一条；余下条目照常判定（pass 不中断）；`_inAutoTurn === false` 与 guard 快照照落（无 `finally` 抛错） |

### 2.10 上抛项

- **[已同步 · 不再上抛] 需求档已随丁收正**：`docs/core/requirements/AGENT-LOOP.md` §4.15 F-DA1「计一个未签收轮（**不再自动重投**——同一报告在会话里只投递一次）」· F-DA2「未覆盖 ⇒ 不销账且计一个未签收轮（不触发重投）」· F-DA3「同条未签收轮 ≤N（N 由设计定）… 且正文必须完整可见」· N2「清算 / 未签收轮 / 升级 / null 停因各面断言」· N4「每条报告注入恒一次 + 升级披露至多一次」（2026-10-27 实读 `:271-273` / `:278`；全档「重投」仅余否定式表述）。需求档笔域归主 agent，本席只读核对。
- **[知会] 残余边界**：纯工具轮 run（零非空正文）同判为空回合（§2.2 末），由未签收上限兜住——本批不另设判据。
- **[知会] 集成行落点在本席笔域外**：§2.11 的 18-1 须先写进 `test/RTM.md`（CLI 端故事 18），再有 `test('18-1 …')`。

### 2.11 集成用例设计（对 `test/RTM.md` 的增量）

**读现状**：`test/RTM.md` 244 行；CLI 端 16 个故事 63 行用例（2026-10-27 实读），VS Code / 桌面两端尚无集成用例。

**破坏的行（本批改掉了它断言的业务可观察结果）**：无。故事 15 三行（`test/RTM.md:191-193`）断言的是 `completion.mjs` 的空响应重试与抛错，本批不动该件；15-2 的恒空提供端在本批只作空轮径的场景出处（§2.3），不改它的断言。

**冗余的行（本批可删）**：无。

**缺失的行（新增 1 行）**：故事 18「一条后台报告只投递一次，未签收时才升级」。

| 编号 | 组件交互 | 断言的业务结果 | 回指需求 | 业务入口 |
|---|---|---|---|---|
| 18-1 | 会话链路（`createAgent` + `runAgent` 消化轮）⟷ 见账 pass（`accountDigestRound`，含升级终局披露）⟷ 会话流与 status 面 | 一条后台报告在会话里出现 1 次后**不再被注入**；连续 3 个空消化轮内会话流零 UNSETTLED 提醒、报告仍在容器（不丢）；第 4 个未签收轮升级——终局披露使正文出现第 2 次 + 恰一条 UNSETTLED 提醒 + `unsettledCount === 0`（条已离容器），此后零注入。**修前红**：第 2、3 轮各再注入一次（正文出现 3 次）、第 3 轮即出 UNSETTLED 提醒 | `docs/core/requirements/AGENT-LOOP.md` §4.15 F-DA3 · 设计档 `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.31.5 / §6.31.11 A-DA3 · A-DA9 | CLI 会话里一条后台报告被投递之后的连续消化轮 |

**怎么做（夹具）**：真 `createAgent` + 本机假 SSE 端点（先例 `test/integration/empty-response-retry.test.mjs:96-110`）；置 `agent._daSession = true`，把一条**未投递**条目放进 `_pendingAsyncResults`（`report` 为可检索标记串；不预置 `_daDelivered`——首投由第 1 轮自然发生）。

**怎么做（驱动）**：逐轮 `runAgent(agent, "", {}, { autoTurn: true })`（`thincoder-core/agent.mjs:86`）——前 4 轮桩回空（该轮抛 `LLM returned empty response`，调用面 catch 后继续；第 4 轮触发升级），第 5 轮桩回任意正文。

**怎么算通过**：第 1 轮后正文出现 1 次；第 1–3 轮后 `marked UNSETTLED` 计数 = 0、条仍在 `_pendingAsyncResults`、注入计数 = 1；第 4 轮后 `_unsettledDigests` 恰 1 条（`missRounds = 4`）、UNSETTLED 提醒恰 1 条、正文出现 2 次、`unsettledCount(agent) === 0`；第 5 轮后注入计数仍 = 1。

**落点**：行号先写进 `test/RTM.md`（CLI 端故事 18 · 行 18-1），用例标题 `test('18-1 …')` 与编号逐字一致；用例档 = `test/integration/digest-empty-round.test.mjs`（本批新档——**集成资产，常驻**：RTM 证据列须长期指向在场文件；随收口删除的只有开发期单元档 `thincoder-core/test/digest-empty-round.test.mjs`）。

**窗口读数**：63 → 64 行，在 ≈50–100 窗口内。

### 2.12 既有件三问（逐名——换物非新建）

| 新名 | 落点（既有件坐标） | 逐字名 | 消费者 |
|---|---|---|---|
| `DA_MISS_LIMIT` | 常量位 = `thincoder-core/agent/digest-account.mjs:29`（`DA_RETRY_LIMIT` 退场后同位） | `DA_MISS_LIMIT` | `accountDigestRound` 判定 · `unsettledReminder` 轮数 |
| `_daMissRounds` | 条目字段位 = `thincoder-core/agent/digest-account.mjs:99`（写点 `entry._daMissRounds = (entry._daMissRounds ?? 0) + 1`——原 `_daFailures` 同址） | `_daMissRounds` | `accountDigestRound`（累加 + 判定）· `unsettledRows` / `unsettledCount`（读面）· 升级账本 `missRounds` 取值源 |
| `missRounds` | 账本条目字段 = `thincoder-core/agent/digest-account.mjs:115`（`missRounds: entry._daMissRounds`——原 `failures` 同址） | `missRounds` | `unsettledRows` 的 `attempts`（升级行）· status 面 |
| `unaccounted` | 状态名 = `thincoder-core/agent/digest-account.mjs:168`（`state: missRounds > 0 ? "unaccounted" : "awaiting-digest"`——原 `retrying` 同址） | `"unaccounted"` | `unsettledRows` → `subagent action:'status'`；三端只读 `unsettledCount` / 计数，不读状态字面（三端读取点 = `thincoder-cli/src/tui/suspension-drive.mjs:120` · `thincoder-desktop/src/main/turn-face.mjs:181` · `thincoder-vscode/src/extension/suspension.mjs:221`——评审轮实读） |

**三问答复形态**：四个名字全部 = `existing: <坐标> · name: "<逐字名>" · consumers: <谁>`（既有件换物）；`none found` 一项也没有——本批零新件、零新导出面。

### 2.13 实施后收正（§5.6 漂移逐条 · 设计席实读回填 2026-10-27）

**依据**：§5 实施完成后 §5.6 逐条给出文档面漂移。本席笔域内的六条按下表落地（设计档已改，本段给对照）；§5.6 第 3 条属语义面（用例宿主约定），未改，见末段上抛。本段不改任何设计语义——六条全是「文档说 X、代码是 Y」的读数收正。

| §5.6 # | 落点 | 收正前 → 收正后（实读依据） |
|---|---|---|
| 1 | `docs/core/design/LOGGING.md` 的事件登记行 `ev:unsettled` | 「消化轮见账**三次**未覆盖」→「同一条目积满 `DA_MISS_LIMIT`（= 4）个未签收消化轮」；实读 `thincoder-core/agent/digest-account.mjs:29` `export const DA_MISS_LIMIT = 4`。同档补一行 `ev:unsettled-disclose-failed`（写点 `thincoder-core/agent/digest-account.mjs:144`，字段 `id` / `err`）——事件登记面漏登即等于该留痕在日志规范里不存在。 |
| 2 | `docs/vsc/design/WEBVIEW-PROTOCOL.md` 的核字典对照表 `digest.residue` 行 | 词文对齐核字典 `thincoder-core/i18n.mjs:46`：zh「不再自动重投，未签收满额即升级 UNSETTLED」/ en「no automatic re-delivery; escalates to UNSETTLED」（原两格仍写「将自动重投 / they will be re-delivered」）。 |
| 4 | 设计档 §6.31.5 末条 `unsettledReminder` 坐标 | `:125` / `:118` → `:151` / `:124`（`grep unsettledReminder` 实读：定义 `thincoder-core/agent/digest-account.mjs:151`、唯一调用点 `:124`）。 |
| 5 | 设计档 §6.31.9 `digest-account.mjs` 行 | 「**189** … ≈ +18 / −8（预计 ⇒ ≈199）」→「**216**（2026-10-27 实读，总行数口径；本批 = 189 → 216，净 +27）· 已落」。 |
| 6 | 本段 §2.12 常量位 | `thincoder-core/agent/digest-account.mjs:27` → `:29`（实读 `DA_MISS_LIMIT` 落 `:29`；生成区 `docs/core/design/API-CONTRACT.md:970` 已同值）。 |
| 7 | 本段 §2.3 / §2.4 的 `run-start.mjs:55` 引文 | 逐字引「（重投需原文）」→ 现文「（升级终局披露需原文）」（实读 `thincoder-core/agent/run-start.mjs:55`）。引文与源码不同字，读者按引文去核会对不上。 |
| 8 | 本段 §2.8 受影响文件表 | 表列 6 档，实际触达 12 档。补 §2.11 已规划而表内漏列的两档——`test/integration/digest-empty-round.test.mjs`（新档 158，常驻）· `test/RTM.md`（63 → 64 用例行）；补 §5.3 四档——`thincoder-core/i18n.mjs:46` · `thincoder-core/agent-tools/async-settle.mjs:142` / `:190`（JSDoc）· `thincoder-core/agent-tools/subagent-actions-query.mjs:33`（JSDoc）· `thincoder-core/agent/suspension.mjs:243`（注释）。后六档均为文案 / 注释面，零行为变更（i18n 一格词文除外，见 §5.3）。 |

**本席新发现（不在 §5.6 清单内，同批一并收正）**：`docs/core/design/AGENT-LOOP.md:524` / `:629` 的 `report` 保留理由仍写「重投需原文」「以重投上限封顶」——重投上限本批已退场，该句承诺一个不存在的上限 ⇒ 改「升级终局披露需原文」「以未签收条数封顶」，与 `thincoder-core/agent/run-start.mjs:55` 现注同拍。判据：同一机制在两档给出不同理由，读者无法判断哪句是现行规则。

**门禁顺带修（触达档的既存缺陷，非本批语义）**：本轮回写设计档后 `doc_check` 门拒写，命中 7 条均在触达档内、且为既存问题——

- `docs/core/design/LOGGING.md:26` / `:27` 两条悬空锚——原文指向**别仓路径**（`docs/design/LOGGING` 与 `docs/requirements/LOGGING`，本仓解析不到）⇒ 改写为同义散文指针，语义不变。
- 五处长段（`docs/core/design/LOGGING.md:73` / `:85` · `docs/vsc/design/WEBVIEW-PROTOCOL.md:131` / `:151` / `:164`）⇒ 拆段 / 拆为子条目，**措辞逐字保留**，只改段落结构。

**[上抛·待裁] §5.6 第 3 条：用例宿主约定（语义面，本席不擅改）**

- **冲突两侧**：设计档 `docs/core/design/AGENT-LOOP-ASYNC-POOL.md:943` 逐字「用例宿主 = 各包 `test/`（`test/*.test.mjs` 单层收集——`thincoder-core/test/run.mjs:1-49`）；**测试档不落 `docs/`**」。
- **对侧实读**：`thincoder-core/test/run.mjs:35` 逐字 `fail(\`uncollected test file (unit test files live in docs/batches/ and run via node --test <file>): ${rel}\`)`；`:38-40` 常态出口 = 无集成集 `exit 1`；该 runner 全文 40 行、收集面为空。
- **本批现状**：单元档按 §2.8 落 `thincoder-core/test/digest-empty-round.test.mjs`（§5.1 实读 328 行，现盘在）⇒ 与 `run.mjs` 的 SC-1 反查相抵（该反查会把本档点名判错位）。
- **影响有界**：该档随收口删除（单元档零留存），核包 `npm test` 本就恒 `exit 1` ⇒ 不影响任何绿窗；留下的是**约定真伪**问题，不是运行问题。
- **两条路**：① 收正设计档句（用例宿主 = `docs/batches/`，核包 `test/` 收档面为空）——`run.mjs` 是既存代码，档句是描述它的，本席倾向此条；② 单元档移位。两者都改「单元档住哪」这条约定，属语义面，故上抛、本轮未动。

**§2.13 两处读数自纠（本轮复读所得，同段内生效）**：

- 上文「六条按下表落地」应为**七条**——表内实 7 行（§5.6 共 8 条，唯第 3 条上抛未改）。
- 行 8 的「后六档均为文案 / 注释面」应读作：**后四档**为文案 / 注释面（`thincoder-core/i18n.mjs:46` · `thincoder-core/agent-tools/async-settle.mjs:142` / `:190` · `thincoder-core/agent-tools/subagent-actions-query.mjs:33` · `thincoder-core/agent/suspension.mjs:243`；i18n 一格词文除外），**另两档为测试资产**（`test/integration/digest-empty-round.test.mjs` · `test/RTM.md` 用例行）⇒ 本批零产品行为变更（首投 / 见账 / 升级 / 读面行为均已在批内，非本段新增）。

### 2.14 §2 自身收正落位（设计席 · 收口前）

**依据**：§2.13 的第 6 / 7 / 8 条的落点写的是「本段 §2.x」——即 §2 自己的正文。那三条此前只登记在 §2.13 的对照表里、正文未改，于是同一段出现两套值（§2.12 写 `:27`、§2.13 写 `:29`）。本段把三条落到原处，并补做同类坐标漂移。

| §2.13 # | 落点 | 已落 |
|---|---|---|
| 6 | §2.12 常量位 | `:27` → `:29` |
| 7 | §2.3 / §2.4 的 `run-start.mjs:55` 引文 | 「（重投需原文）」→「（升级终局披露需原文）」，与 `thincoder-core/agent/run-start.mjs:55` 逐字同 |
| 8 | §2.8 受影响文件表 | 6 档 → 12 档（补集成档、RTM 用例行、i18n 文案、两处 JSDoc、`suspension.mjs` 注释），行数按实施后实读回填 |

**同段内另四处坐标漂移（本轮实读所得，不在 §5.6 清单内）**：

- §2.12 `_daMissRounds` 条目字段位 `:94` → `:99`（实读写点 `entry._daMissRounds = (entry._daMissRounds ?? 0) + 1`）
- §2.12 `missRounds` 账本字段 `:109` → `:115`（实读 `missRounds: entry._daMissRounds`）
- §2.12 `unaccounted` 状态名 `:142` → `:168`（实读 `state: missRounds > 0 ? "unaccounted" : "awaiting-digest"`）
- §2.3 / §2.4 / §2.6 的 `preview` 坐标 `:153` → `:179`（实读 `preview: String(u.report ?? "").slice(0, 400)`；`preview` 未退场，是活坐标，不属「修前态」）

**判据**：§2 是实施席与收口席读的任务书面。一个指向错行的坐标，读的人按它去核源码会对不上，只能退回猜；同一个量在同一段给两个值，读者判不出哪句是现行。

**实施后实读回填（`wc -l` 口径，2026-10-27）**：

| 件 | 现值 |
|---|---|
| `thincoder-core/agent/digest-account.mjs` | 216 |
| `thincoder-core/agent/run-start.mjs` | 159 |
| `thincoder-core/agent/run-stages.mjs` | 355 |
| `thincoder-core/test/digest-empty-round.test.mjs` | 342 |
| `test/integration/digest-empty-round.test.mjs` | 158 |
| `test/RTM.md` | 64 用例行 / 17 故事 |
| `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` | 1312 |

**读数差（本席笔域外，只报不改）**：§5.1 记单元档 328 行，现盘实读 342（+14）。§5.4 已记「本轮补 T-DA4② / T-DA4③」，档在 §5.1 读数之后有增补；§2.8 采现盘 342。

**仍未决（沿用 §2.13 末段口径，本段不改）**：§5.6 第 3 条「用例宿主约定」。

- 一侧：设计档 `docs/core/design/AGENT-LOOP-ASYNC-POOL.md:943` 逐字「用例宿主 = 各包 `test/`（`test/*.test.mjs` 单层收集——`thincoder-core/test/run.mjs:1-49`）；**测试档不落 `docs/`**」。
- 对侧：`thincoder-core/test/run.mjs:35` 逐字 `uncollected test file (unit test files live in docs/batches/ and run via node --test <file>)`。
- 两条路（收正设计档句 ∥ 单元档移位）都改「单元档住哪」这条约定，属语义面 ⇒ 待裁，本轮未动。

### 2.15 用例宿主约定收正（§1.15 裁定落地 · 设计席 2026-10-27）

**依据**：§1.15 两条并列裁定 —— ① 单元档移位（父侧 `#5`，本席笔域外）；② 设计档 `:943` 补核包例外（本席笔域）。本节 = ②的落地记录 + ①带来的读数变化。

**② 已落（本席）**：`docs/core/design/AGENT-LOOP-ASYNC-POOL.md:943-944`。

- 原句把**例外写成了通例**：「用例宿主 = 各包 `test/`（`test/*.test.mjs` 单层收集——`thincoder-core/test/run.mjs:1-49`）；**测试档不落 `docs/`**」。前半在核包不成立，后半在核包相反。
- 现文拆两条：① 宿主 = 各包 `test/`（实读 2026-10-27：VSC 端 5 档 · CLI 端 0 档）；② **核包例外** —— `run.mjs` 零目标集合、不跑用例，对 `test/` 下任何 `*.test.mjs` 报 `uncollected test file` ⇒ 核包单元档落 `docs/batches/`，以 `node --test <档>` 直达。

**实读依据（本席自读，非转述父侧）**：

| 件 | 读数 | 判据 |
|---|---|---|
| `thincoder-core/test/run.mjs:4` | 逐字「单元测试档住 `docs/batches/`，`node --test <档>` 直达」 | 约定本体 |
| 同档 `:35` | 逐字 `uncollected test file (unit test files live in docs/batches/ and run via node --test <file>): ${rel}` | 违约定即 fail-closed |
| 同档 `:38-40` | 常态出口 `exit 1`（「no integration test set — this package has none」） | 核包不跑用例、不谎报绿 |
| `thincoder-vscode/test/*.test.mjs` | 5 档（实列） | 通例在此成立 |
| `thincoder-cli/test/` | 只有 `run.mjs` / `slow.mjs`，零 `*.test.mjs` | 通例在此无实例 |
| `thincoder-core/test/` | `digest-empty-round.test.mjs`（18,826 字节）· `run.mjs` · `slow.mjs` | 本批单元档**仍在原位** ⇒ §1.15 ① 未落 |

**同机制第二处（本席一并收正）**：同档 `:928` 调研证据行原写「`thincoder-core/test/run.mjs:1-49`（`test/*.test.mjs` 单层收集 → `npm test`）」——与 `run.mjs` 实读相反（该 runner 不收档、不跑用例，恒 `exit 1`）。已改述为「零目标集合、不跑用例——全文 40 行」。判据 = 同一文档对同一 runner 不得给出两种收集口径。

**§2.8 / §2.9 的运行命令随 ① 变**：

- 移位落定后 = `node --test docs/batches/2026-10-27-digest-retry-amplify.test.mjs`。
- 移位未落时（现盘）= `node --test thincoder-core/test/digest-empty-round.test.mjs`（§2.9 现文按此口径，仍在盘可跑）。

**宿主描述改为按例外表述**：设计档 `:1139`（T-DA21–T-DA24 宿主行）不再写死批内档路径，改「核包 ⇒ 按例外落 `docs/batches/`，随批收口删除」。理由 = 该档随收口删除，写死路径即留死指针；长期验收由 `test/RTM.md` 行 18-1 + `test/integration/digest-empty-round.test.mjs`（常驻）承接，不变。

**未动（报父侧，本席不改）**：同档 `:535` / `:633` 的旧「用例宿主」行仍以 `thincoder-core/test/*.test.mjs` 为宿主 —— 实列 `thincoder-core/test/` 已无那些档（随各自批收口删除），指针已死。未动理由 = 它们属已收口批的宿主记录，不是规则句；本批不借约定收正的名义批量重写历史宿主行。要不要另起一批收正，父侧定。

## §3 设计评审（评审子代理）
**状态行**：评审通过（第三轮回评 · 🔴0 · 🟡1 · 🔵5（只验 prior 表，13 条全数处置））



### 轮次 1（评审子代理）

### 设计评审 · digest-retry-amplify（首轮）

对象 = 批档 §2（设计）+ `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.31 落盘面。计数：🔴 1 · 🟡 8 · 🔵 3。

**父侧三问的实检答复**
- ① `_daFailures` 语义 = 「投过了、有签收机会却没签」——**成立**。判读面只取 `pending ∩ _daDelivered`（`docs/core/design/AGENT-LOOP-ASYNC-POOL.md:993`），且仅在「有输出 ∧ 未覆盖」分支自增（`:995`）⇒ 空回合免账与该语义同向，不是放宽安全方向。
- ② `DA_EMPTY_LIMIT = 4` 的余量论证**有缺口**：今日实测上界 3 是**删失观测**——现上限「总投递 ≤3」（`:998`）使单条 ≥4 连空不可能在记录中出现。且全空坏路径投递量 3 ⇒ 4（见 #2）。
- ③ 读面并非「三端零改」：`attempts` 口径变了（批档 `:150` / 设计档 `:1006`），但三端残余行判据 `unsettledCount` 仍是 `_daFailures > 0`（`:1008`），空轮条目在 status 显 `retrying` 而在残余行不计（见 #6）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Integration-test design | 🔴 | 批档 §2 无集成用例设计节：全段零 `RTM` ∥ 零「集成」字样（grep 实证）。而 `test/RTM.md` 实存（故事 15「偶发空响应不打断会话」，用例宿主 `test/integration/empty-response-retry.test.mjs`）；本批单元档明写「收口删除」（批档 `:196`）⇒ 空回合免账 / 不放大这一业务可观察结果收口后无任何验收。 | 在批档 §2 增一节「集成用例设计（对 `test/RTM.md` 的增量）」：逐条答本批破坏 / 冗余 / 缺失哪些行、每行写清组件交互 · 断言的业务结果 · 业务入口 · 回指需求；若判「不改任何既有用例断言的业务可观察结果且无产品真需要的场景」须原文写出该理由（唯一合法理由），否则给出缺失行号。 |
| 2 | Requirements | 🟡 | 用户报告的症状（多次投递）在投递量上**未被改善，且全空路径 +1**：空轮分支仍置 `_daRetry = true`（批档 `:144`「下轮照旧重投」），单次空轮投递数与修前相同；全空路径升级门槛 `DA_RETRY_LIMIT = 2`（`:998`「**重投 ≤2 次 ⇒ 总投递 ≤3 次**」）改为 `DA_EMPTY_LIMIT = 4`（`:997`「连续空轮达 4 轮 ⇒ 升级（空径总投递 ≤ 4 次）」）⇒ 3 次变 4 次。批档与设计档均未写出这一净效应。 | 在 §2.3 或 §2.6 增一句净效应声明：混合径（空 → ack）投递数不变；全空径 ≤3 ⇒ ≤4；并说明为何这对「多次投递」用户诉求是可接受的（真正被修的是终态提前关闭，不是投递量）。 |
| 3 | Acceptance criteria | 🟡 | 设计档 §6.31.11 未收正、未补行：A-DA3 仍写「重投 ≤2（总投递 ≤3）；三轮未覆盖 ⇒ 升级」（`:1115`），与 §6.31.5 新增的空轮径（`:996`/`:997`）在同一档内给出两个不同的投递上限；空轮上限无任何验收行。批档 `:187` 明列「本批只动这几节，§6.31 其余节零改」——§6.31.11 被排除在落点之外。 | 把 §6.31.11 纳入落点：A-DA3 补空轮径口径，并新增一行验收（连续空 4 轮 ⇒ 恰一条提醒 + 恰一条 `ev:unsettled` + 停自动重投）。 |
| 4 | Closest-precedent | 🟡 | 批档 §2 无最近先例行（全段 grep 零「先例」）。本档自身已有该惯例句式：`docs/core/design/AGENT-LOOP-ASYNC-POOL.md:926`「**最近先例**：…**偏离项** = …」。§2.6 仅把 `completion.mjs:44-60` 当否决理由引用，未作先例坐标 + 对齐 / 偏离理由。 | 补一行：实现坐标（`digest-account.mjs` 四支判定 ∥ `completion.mjs` `MAX_EMPTY_RETRIES` 面）· 对应设计节（§6.31.5）· 对齐点（空轮不记失败）+ 偏离点（本批不重生成、不改 `DA_RETRY_LIMIT`）与其理由。 |
| 5 | Survey evidence | 🟡 | 批档 §2 无调研证据行（全段 grep 零「调研」），无法区分「未调研」与「未记录」。本档惯例句式 = `docs/core/design/AGENT-LOOP-ASYNC-POOL.md:928`「**调研证据**：查过 …（实读 2026-10-19）」。 | 补一行：查过哪些公开源档（独立文档仓优先）∥ 是否有相关项；「无相关」也须成行写出。 |
| 6 | Clarity / read face | 🟡 | 父侧第三问的答复不完整：`attempts` 已成 `failures + emptyRounds`（批档 `:150`；设计档 `:1006`「`attempts` = 未销账轮数（计账失败 + 免账空轮）」），但三端残余行判据仍为 `unsettledCount(carrier)`「= pending 中 `_daFailures > 0` 条数」（`:1008`）⇒ 仅积空轮未销账的条目在 status 显 `retrying`、在三端残余行计数为 0。设计未提该读面，也未登记分歧。 | 明确二选一：把 `unsettledCount` 判据同拍改为 `failures > 0 ∥ emptyRounds > 0`（并列出三端读取点），或原文登记「残余行只计计账失败」的理由与影响面。 |
| 7 | Clarity / 口径一致 | 🟡 | 同一「轮数」两套算式：提醒句用 `_daEmptyRounds`（`:998`「空轮径 = `_daEmptyRounds`）——轮数是事实，不写死」），而 status 用 `failures + emptyRounds`（`:1006`）。混合径（先有 1 次非空未 ack，再连空 4 轮）实际判定过 5 轮，提醒却说 4 轮 ⇒ 「轮数是事实」在该径不成立。 | 统一为 `attempts` 口径：提醒句 `rounds` 传 `failures + emptyRounds`（计账径退化值仍为 `DA_RETRY_LIMIT + 1` 时文本零变），或原文限定该句只在纯空轮径如实。 |
| 8 | Branch provenance | 🟡 | `≥ DA_EMPTY_LIMIT ⇒ 升级` 这一支的场景未实名：唯一依据是「实测高负载连空两三轮」+「观察上界 3 + 1 轮余量」（批档 `:147`），而该观察被现上限 ≤3 删失（`:998`），既无真实观测到的 4 连空，也未给复现路径。可复现路就在仓内：`test/RTM.md:192` 用例 15-2「桩恒回空响应」⇒「第 3 次空响应当场抛 `LLM returned empty response`」⇒ 每消化轮 `output == null`。 | 在 §2.3 的 N 依据里改口径：给出该复现路径（恒空 provider ⇒ completion 抛错 ⇒ 每轮空回合）作为升级支的场景出处，并把「观察上界」改写为「受现上限删失、按免账轮 ≥3 需求反推」。 |
| 9 | Doc state | 🟡 | §1.8/§1.9 已裁「甲即终形」、丙「前提不成立，不立」（批档 `:108`），但 §2 仍留两条活口：§2.6 丙行「**暂不采纳** … 该前提本批未核（§2.8 上抛）」（`:181`）与 §2.10「**[待裁] 下一层前提未核**：压缩是否保留报告正文」（`:214`）——同一决策在批档内两处状态不同，后续读者会把已裁项当待办重开。 | 把 §2.6 丙行与 §2.10 首条按 §1.8 的实读结论收正（丙不立 + 结论出处 `context.mjs:5-6` ∥ `run-start.mjs:55`），删去「本批未核 / 待裁」表述。 |
| 10 | Methodology | 🔵 | `DA_EMPTY_LIMIT = 4` 未进关键决策表：同族决策 `KD-DA4`（`docs/core/design/AGENT-LOOP-ASYNC-POOL.md:1138`「重投上限 N = 2（总投递 ≤3）」）在册，新上限只在 §6.31.5 正文出现；批档 `:187` 的落点清单亦无 §6.31.13。 | 在 §6.31.13 增一行 KD（上限 = 4 · 依据 · 与 KD-DA4 的关系），或明写「不另立 KD」的理由。 |
| 11 | Doc hygiene / 坐标 | 🔵 | 同一处写点三个坐标：批档 `:13`「`:79-82`（未覆盖 ⇒ `_daFailures += 1`」· §2.1 `:118`「`thincoder-core/agent/digest-account.mjs:94`（`entry._daFailures = (entry._daFailures ?? 0) + 1`）」· 评审对象声明给 `:95`。另 `unsettledReminder(n, ids, rounds)` 的现行签名与既有调用点未标注 ⇒「`rounds` 缺省 ⇒ 句子骨架零变」在档内不可核。 | 统一到实施当刻实读坐标，并补 `unsettledReminder` 的现行签名 + 调用点清单（含三端是否消费）。 |
| 12 | Doc hygiene / 数字 | 🔵 | 设计档 §6.31.9 的 `digest-account.mjs` 行仍是「— | ≈170–210」（`:1036`），未随本批 as-of 读数重锚；批档 §2.8 与同档 `:1244`（「实读 189」）可交叉印证 189 ⇒ ≈210 在区间内，但表内未标本批读数。 | 收口时把 §6.31.9 该行补 as-of 读数（189 → ≈210）或注明「区间含本批、不逐批重锚」。 |

**通过面（无缺陷）**：文档归属正确（机制正文落 `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.31 = 该主题的活档，未为既有节新建档；一次性内容留批档 §2，符合 §2.7 自述）；文件尺寸面合规（`digest-account.mjs` 189 → ≈210，远低 500 软线，单函数无 300 行迹象）；验收跑法合规（`node --test thincoder-core/test/digest-empty-round.test.mjs`——改面单档，非全量）。

**范围限制**（如实登记）：本评审只读批档 + 设计档（按对象声明），另读 `test/RTM.md:184-194` 以判集成面前提、并只做 `test/RTM.md` / `docs/README.md` 存在性核对。`digest-account.mjs` 行数与四支判定现文未直读 ⇒ 第 8 条的抽检以设计档自持读数（`:1244`）交叉印证，不代替源码核对。

项目标准档未声明（按评审上下文：无项目标准文档）；文档地图按上下文声明为「未找到」，但 `AGENTS.md` 点名 `docs/README.md` 且该档实存——归属判定按 `AGENTS.md` + 本档 §2.7 落点自述执行。

VERDICT: changes-required
计数：🔴 1 · 🟡 8 · 🔵 3

### 轮次 2（评审子代理）

### 设计评审 · digest-retry-amplify（第二轮）

对象 = 批档 §2（设计，方案丁）+ `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.31 落盘面 + 需求档 §4.15。计数：🔴 2 · 🟡 9 · 🔵 2。

**父侧三问的实检答复**
- ① 「每条报告注入恒一次」是否真无第二置位点 —— **成立**。`_daDelivered = true` 全仓唯一写点 = `thincoder-core/agent/run-start.mjs:53`；`_daRetry` 全仓三处（`thincoder-core/agent/digest-account.mjs:46` / `:95` / `run-start.mjs:54`）与批档 `:168` 自述一致；回退面（`run-start.mjs:77-86`）与退出清场残余注入（`thincoder-core/agent/suspension.mjs:157-165`）只对 `_daDelivered !== true` 条施展，且后者取走即离容器 ⇒ 无第三条投递径。
- ② 披露复用 `injectAsyncResult` 是否引入新失败面 —— **引入，且设计未处置** ⇒ 🔴 #1。
- ③ 需求档与丁是否同拍 —— F-DA1/F-DA2/F-DA3/N2/N4 实读已收正（`docs/core/requirements/AGENT-LOOP.md:271-273` / `:278`），与丁同拍；F-DA3「正文必须完整可见」在披露面的大报告形留下边界 ⇒ 🟡 #4。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Feasibility / acceptance | 🔴 | 升级终局披露的错误面缺失，且落在 `finally` 内：`accountDigestRound` 转 async 后在 `thincoder-core/agent/run-stages.mjs:306` 加 `await`，该 pass 由 `thincoder-core/agent.mjs:104` 的 `finally` 单行调用——披露抛错即①中断见账 pass 余下条目 ②跳过 `run-stages.mjs:308`（`_inAutoTurn = false`）与 `:312-315`（`_inheritedGuard` 快照）③以 finally 抛错覆盖原始错误。抛错面是实的：`injectAsyncResult` 内 `offloadToolResult(..., { force: true })` / `persistOverflowReport` 为落盘 I/O（`thincoder-core/agent-tools/subagent-async.mjs:388-389`）+ `pushReal`。若离容器先于披露（§6.31.5 `:1001` 的序 =「离容器 + 入账本 + 披露」，§2.3 的序 =「①披露②提醒③入账本」——两处不同序）⇒ 报告既不在容器、不入账本、无提醒 = 「无声消失」本相。§2.9 六行判据无一覆盖该径；首投面有「抛错 ⇒ `_daDelivered` 未置 ⇒ 下轮重试」的处置，披露面没有；仓内既有先例是 `finishSuspension` 的注入循环 try/catch 收口（`thincoder-core/agent/suspension.mjs:163`）。 | 在 §2.3 升级支写定披露失败处置（建议：账本 + 提醒先落、披露包 try/catch、失败仅记一条留痕并保留账本与提醒——判据 = 「披露失败不得使报告离开可见面」），把「离容器 / 入账本 / 披露 / 提醒」的先后统一为一处，并在 §2.9 与 §6.31.11 各补一行错误径判据。 |
| 2 | Document ownership / doc-state | 🔴 | 机制级描述不一致：「重投存废」在活体规范面仍有多处与本批设计相反——`docs/core/design/AGENT-LOOP-ASYNC-POOL.md:964`「会话内（可重投）」· `:139`「`_pendingAsyncResults`（已投递未判 / 重投中）」· `:974`「含本回合首投 / 重投」· `:1157` KD-DA8「重投门控仅消化轮」· `:1197` §6.34.2 行 3「重投（`_daRetry`）仅消化轮保持」· `:1251` A-AD5「账目 / 重投 / 升级 / 清场逐条零改」· `:1275` KD-AD3「重投仍仅消化轮」· `:1285` §6.34.10 边界 3「判据 / 重投 / 升级 / 清场——逐条零改」。批档 §2.7 的收正点清单（`:228`）只点名 §6.34.3 ③ 与 T-AD4（两处均已同拍），上述八处不在清单内 ⇒ 同档两个相反的重投描述并存。批档内亦留同病：`:197`「⇒ 重投照旧、升级面 400 字符不动…丙方案（整删重投）的前提不成立」与 `:221`「`DA_RETRY_LIMIT` 语义零改」，与本批 `:166`/`:235`（删 `DA_RETRY_LIMIT`、重投退场）相反。 | 把批档 §2.7 的收正点清单扩到上列八处（逐处改述或删除重投字样），并把 §2.4 的结论句改述为丁下的结论（升级面不再由 400 字符 preview 独家承载）；`:221` 的偏离项删「`DA_RETRY_LIMIT` 语义零改」（该常量本批退场）。 |
| 3 | Clarity / correctness | 🟡 | 披露并非「与首投同一投递形」：首投按 role 分流——`thincoder-core/agent/run-start.mjs:51` `if (e.role === "consult") await injectConsultResult(agent, e)`，consult 族的注入器是 `thincoder-core/agent-tools/consult.mjs:186-199`（首行标签拆出再拼、不计标签入预算），而披露统一写 `injectAsyncResult(carrier, entry)`（批档 `:176` / 设计档 `:1000`）⇒ consult 条目升级时走通用子代理标签形。 | 披露改述为「按 role 与首投同分流」（consult → `injectConsultResult`，其余 → `injectAsyncResult`，后者内部已分派 bg / browser），或原文限定披露只覆盖非 consult 族并登记差形。 |
| 4 | Requirements fit | 🟡 | F-DA3 逐字要求「**且正文必须完整可见**（不得只剩截断摘要）」（`docs/core/requirements/AGENT-LOOP.md:273`）；披露走同一投递形 ⇒ 报告过大时注入面是落盘 + 路径、轮累计预算超限时改清单行（`thincoder-core/agent-tools/subagent-async.mjs:385-389`「轮累计超预算 ⇒ 清单行（正文不进请求体）」、「`force` 跳过长度门」）。该形下「完整可见」是否成立、以什么判据成立，设计未登记。 | 在 §6.31.5 升级支补一句该边界的判据（例如「超预算 / 超长 ⇒ 清单行 + 落盘路径，路径即完整正文入口」并指到 §6.14 预算口径），或登记为已知边界并写明与 F-DA3 的相容理由。 |
| 5 | Clarity / side effects | 🟡 | 披露复用 `injectAsyncResult` 的副作用清单未登记：① 轮累计预算再记一次（`digestBudgetOver`——`thincoder-core/agent-tools/subagent-async.mjs:385`）；② `offloadToolResult(..., { force: true })` 二次落盘；③ `writeTombstone(..., "consumed")` 重写（`:420`）；④ 评审族 `noteReviewDelivered(agent, entry.run)` 使「投递水印」后移到披露点（`:412`；水印语义单源 = 本档 `:114`「投递水印…async = 投递单点 `injectAsyncResult`…时的 `history` 长度」）——同档「投递单点」与新「两次注入」如何并存未说明。 | 在 §6.31.5 升级支补一份副作用逐条登记（预算 / 落盘 / 墓碑为幂等或无害；水印后移对轮 2+ 取件下界的影响给判据），并在 `:114` 的水印条注明「升级披露同样经该单点、水印随最后一次投递」。 |
| 6 | Affected-file annotations | 🟡 | 受影响文件表的行数标注不全/失真（抽检）：`thincoder-core/agent/run-stages.mjs` 写「未重锚」（批档 `:237`）——无现行行数，实读末行 `}` 在 `:356`；`thincoder-core/agent/run-start.mjs` 写 152（`:236`），实读末行 `}` 在 `:159`，而同档 §6.34.8（`:1259`）自写「实读 158」。`digest-account.mjs` 189 与实读一致（`:235`，源码 `thincoder-core/agent/digest-account.mjs` 末行 189）。 | 两行补 as-of 实读值（`run-stages.mjs` / `run-start.mjs`）与据此的增量，删「未重锚」；顺带把 §6.34.8 的 158 与批档 152 收敛到同一读数。 |
| 7 | Acceptance criteria | 🟡 | §2.9 六行判据无一覆盖「读面换物」：本批同拍改了 `unsettledRows.attempts`（`_daFailures` → `_daMissRounds`）、`state` 名 `retrying` → `unaccounted`、`unsettledCount` 判据（`thincoder-core/agent/digest-account.mjs:138-144` / `:166-171`），落点是父侧可读的 status 面与三端残余行（设计档 `:1019` / `:1021`）——属用户可观察行为，却只在设计档有断言（T-DA10 的宿主「核侧单元测试档」已随收口删除：`thincoder-core/test/` 现仅 `run.mjs` / `slow.mjs`）。 | §2.9 增一行：`attempts = _daMissRounds`、`state = unaccounted`、`unsettledCount` 三处换物同判，并给机检形态（直驱 `unsettledRows` / `unsettledCount` 与三端残余行判据的对照）。 |
| 8 | Integration-test design | 🟡 | §2.11 落点写「用例档 = `test/integration/digest-empty-round.test.mjs`（本批新档，**收口不留**）」（批档 `:282`），与集成资产常驻口径相反（本档 §6.20.6 「I1 = 集成资产（常驻）」，`docs/core/design/AGENT-LOOP-ASYNC-POOL.md:368`），也与 RTM「证据」列相抵——既有集成档常驻（`test/integration/empty-response-retry.test.mjs` 在场），RTM 行 18-1 的证据列必须长期指向一个在场文件。 | 该档改为常驻（与其余 RTM 行同命），只让开发期单元档（`thincoder-core/test/digest-empty-round.test.mjs`）随收口删除；若坚持删除，须写明 18-1 的验收改由谁长期承担。 |
| 9 | Clarity / case hosts | 🟡 | 新增用例 T-DA21 / T-DA22 / T-DA23（设计档 `:1116-1118`）无用例宿主行：§6.31.10 的「用例宿主」段（`:1120`）只列到 T-DA20，其余指向的「核侧单元测试档（408）」「出口缝档（165）」「窗收正四例…」均已在各自批收口时删除（`thincoder-core/test/` 实读仅 `run.mjs` / `slow.mjs`）。批档 §2.8 只笼统写「用例 = §2.9 六行 + 披露形态」。 | 在 §6.31.10 的宿主段补三行的宿主（= 本批新档 `thincoder-core/test/digest-empty-round.test.mjs`），并注明该档收口删除、验收由集成行 18-1 长期承接。 |
| 10 | Doc state | 🟡 | §2.10 首条「**[上抛·待裁] 需求档与丁相抵，须主 agent 改需求档**」（批档 `:258`）已是结项态：需求档 F-DA1 / F-DA2 / F-DA3 / N2 / N4 实读均已收正（`docs/core/requirements/AGENT-LOOP.md:271-273` / `:278`），无「重投」残留（全档 grep 仅 `:271-272` 两处否定式表述）。留着它，后续读者会把已结项当待办重开。 | 把该条按现状收正为「已同步」并给出需求档坐标，或删去该条（上抛项只留仍待裁的两条知会）。 |
| 11 | Existing-piece check | 🟡 | 新名 `DA_MISS_LIMIT` / `_daMissRounds` / `unaccounted` / `missRounds` 无「既有件三问」形态答复（`existing: …` / `none found: …` / `existing but unusable: …`）：§2.3 的论证是散文（常量同址、改名列），未逐名给出落点 · 逐字名 · 消费者。 | 在 §2.3 或 §2.6 补一小表：逐名给 `existing:`（`digest-account.mjs:27` 的常量位 / 条目字段位 / 状态名位 / 账本条目字段）与消费者清单，`unaccounted` 标注为 `retrying` 的更名（消费者 = 三端只读 `unsettledCount`，实读无端侧消费状态字面）。 |
| 12 | Doc hygiene / number | 🔵 | 同一文件两处增量读数不一致：设计档 §6.31.9（`:1049`）写「+≈22 / −18（本批 ⇒ ≈193）」，批档 §2.8（`:235`）写「≈ +24 / −22（⇒ ≈191）」。 | 收口时按实读回填一处终值，另一处指过去。 |
| 13 | Doc state / number | 🔵 | `docs/core/design/API-CONTRACT.md` 生成区（生成器唯一笔）在 `:868` 已列 `DA_MISS_LIMIT` @ `thincoder-core/agent/digest-account.mjs:27`，而现文该行是 `export const DA_RETRY_LIMIT = 2`（`thincoder-core/agent/digest-account.mjs:27`）；同区 `:870` / `:873` 的 `shouldDeliverEntry` / `accountDigestRound` 将随签名（三参 → 两参）与 async 化位移。受影响文件表未列该档。 | 实施轮收口前重跑 `node scripts/api-contract.mjs --write` 让生成区随源码收敛；批档 §2.8 补一行该档（生成器重跑，非人工笔）。 |

**通过面（无缺陷）**：① 单门成立（见上「父侧三问」）；② 场景出处合格——升级支实名到可复现失败路径（恒空提供端 ⇒ `thincoder-core/agent/completion.mjs:51-61` 抛错 ⇒ 每消化轮 `output == null`；现实形 `test/RTM.md:192` 行 15-2；夹具形 `test/integration/empty-response-retry.test.mjs`），满足 branch provenance。

③ 最近先例行 / 调研证据行已在册（批档 `:221` / `:223`），偏离理由显式；④ 集成节起点是 RTM 读数而非空白场景表（`test/RTM.md` 244 行、CLI 端 17 故事、VS Code / Desktop 两节明写「尚无集成用例」）。

⑤ 验收跑法是改面单档 `node --test thincoder-core/test/digest-empty-round.test.mjs`（非全量）；⑥ 文件尺寸面合规（`digest-account.mjs` 189 → ≈191，`run-stages.mjs` 356，均 < 500，单函数无 300 行迹象）；⑦ 文档归属正确（机制正文仍单源在 §6.31，一次性内容留批档 §2，未为既有节新建档）。

**范围限制**（如实登记）：本评审按对象声明读批档 + 设计档 + 需求档 §4.15/§4.18；为验父侧点名三处与抽检行数，另读 `thincoder-core/agent/{digest-account,run-start,run-stages,suspension,agent}.mjs`、`thincoder-core/agent-tools/{subagent-async,consult}.mjs`、`test/RTM.md`、`test/integration/` 目录与 `docs/core/design/API-CONTRACT.md` 生成区。

未读 `test/RTM.md` 全文行数口径（「66 行」未逐行核对，`unverified`）。

项目标准档未声明（评审上下文：无项目标准文档）；文档地图按上下文声明为「未找到」，归属判定按 `AGENTS.md` 点名 + 设计档自述落点执行——该限制沿用首轮。

VERDICT: changes-required
计数：🔴 2 · 🟡 9 · 🔵 2

### 轮次 3（评审子代理）

### 设计评审 · digest-retry-amplify（第三轮 · 只验 prior 表）

对象 = 批档 §2（方案丁）+ 设计档 §6.31 + 需求档 §4.15。计数：🔴 0 · 🟡 1 · 🔵 5。

**prior 表 13 条 —— 全数处置**

- 🔴1：四步固定先后（账本 → 提醒 → 离容器 → 披露）在批档 §2.3 与设计档 `:1000-1004` 同序。
- 🔴1：逐条 try/catch + 判据「披露失败不得使报告离开可见面」（`:1005-1006`）在册。
- 🔴1：A-DA10（`:1148`）+ §2.9 行 8 在册；`run-stages.mjs:308` / `:312-315` 零改。
- 🔴1：pass 仍由 `agent.mjs:104` finally 单行调用 —— 披露抛错面的处置成立。
- 🔴2：八处「重投」逐处收正（`:964` `:139` `:974` `:1175` `:1215` `:1269` `:1293` `:1303`）。
- 🔴2：批档 §2.4 结论句（`:207`）∥ §2.6 偏离项（`:234`）同步；残余字样全为否定式。
- 🔴2：`_daRetry` / `DA_RETRY_LIMIT` / `_daFailures` / `_daEmptyRounds` 全档 0 命中。
- 🟡#3：role 分流披露在册（设计档 `:1004`）；F-DA3 边界在册（`:1012`）。
- 🟡#5：副作用四条在册（`:1007-1011`）；§6.11 `:114` 已补「升级终局披露同经该单点」。
- 🟡#6：三档行数实读 189 / 159 / 356 —— 三处源码末行与标注逐字相符。
- 🟡#7–#11：§2.9 行 7 读面换物 · §2.11 常驻（`:299`）· T-DA21–24 宿主（`:1138`）。
- 🟡#7–#11：§2.10 已同步（`:275`）· §2.12 既有件三问（`:303-312`）四条全 `existing:`。
- 🔵#12–#13：增量 ≈+18/−8（批档 `:249` ∥ 设计档 `:1061`）· API-CONTRACT 重跑行（`:252`）。
- 旁证：`DA_RETRY_LIMIT` `:27` · `_daRetry` 置位 `:95` / 清点 `run-start.mjs:54` 均与实读一致。
- 旁证：`unsettledReminder` `:125`（调用 `:118`）· `preview` `:153` · `unsettledCount` `:166-171`。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Clarity | 🟡 | 披露注入的**对象**未指定：账本记录形（`:1001`）不含 `error` / `run`，而墓碑值（`:1010`）与评审水印 `entry.run`（`:1011`）都按原条目字段才成立 ⇒ 注入账本记录则两条登记失效。 | 明写 ④ 注入的是原 pending 条目对象（账本只是快照），或给记录补 `error` / `run`。 |
| 2 | Integration | 🔵 | 批档 `:281` / `:301` 与 `:237`（设计档 `:1021`）写「17 故事 66 行」「66 → 67」；实读用例行 = 63（故事 2 三行已退役 —— `test/RTM.md:28`）。 | 改述为 63 → 64（或标 as-of）；窗口结论不变。 |
| 3 | Acceptance | 🔵 | T-DA23（`:1130`）把披露写成「经 `injectAsyncResult`」，与 role 分流只在非 consult 角色下成立。 | 改述为「按 role 分流，本夹具 = subagent」。 |
| 4 | Doc hygiene | 🔵 | §6.34.8（`:1283`）记本档「1417（现读）」，现盘实读 1312 行（同档口径内容行 = 1311）。 | 收口按实读回填，或注明 as-of 失效。 |
| 5 | Doc hygiene | 🔵 | §2.6 偏离理由引「乙的否决理由 ①③」（`:234`），而乙行只列 ①②（`:227`）。 | 改为 ①②。 |
| 6 | Clarity | 🔵 | `accountDigestRound` 返回形含 `retried`（源码 `digest-account.mjs:121`），重投退场后无消费者，设计未写该收正。 | §2.8 补「返回形去 `retried`」或注明零消费。 |

**通过面（无缺陷）**

- 场景出处合格：恒空提供端 ⇒ `completion.mjs:51-61` 抛错 ⇒ 每消化轮空回合（`test/RTM.md:192`）。
- 先例 ∥ 调研证据行在册（批档 `:231-237`），对齐 / 偏离 / 上限换物理由显式。
- 集成节起点 = RTM 读数；破坏 / 冗余 / 缺失三问逐条作答；缺失行编号先定（`:299`）。
- 验收跑法 = 改面单档 `node --test thincoder-core/test/digest-empty-round.test.mjs`。
- 尺寸面合规：189 → ≈199 · `run-start.mjs` 159 · `run-stages.mjs` 356，均 < 500。
- 文档归属正确：机制正文单源 §6.31，一次性内容留批档 §2，零新档。
- 需求档 §4.15 与丁同拍（`:271-273` / `:278`），无相反表述。

**范围限制**：按声明读批档 + 设计档 + 需求档；抽检另读 `digest-account.mjs` · `run-start.mjs` · `run-stages.mjs` · `agent.mjs` · `subagent-async.mjs:370-421` · `test/RTM.md`（用例行逐条计数）。项目标准档未声明；文档地图「未找到」，归属按 `AGENTS.md` + 设计档自述落点。

VERDICT: pass
计数：🔴 0 · 🟡 1 · 🔵 5

## §4 用户批准（主 agent）

### 4.1 批准（整批令覆盖批准门 · 2026-10-27 23:0x）

**批准依据**：用户 2026-10-27 22:54 给整批令「**自动跑完**」—— 覆盖本批的评审触发、批准门与实施派单，批内全链一次跑完。

**批准对象**：方案丁（重投退场）—— 设计档 `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.31 全节 + §6.34 收正面 + 批档 §2。

**批准前的门状态**：

| 门 | 状态 | 依据 |
|---|---|---|
| 需求确认 | ✅ | 用户 21:51「**B，重投本来就是我为了应付一段时间模型不稳定加的，稳定了还一直留着反而经常出问题。**」+ 21:53「**丁 做**」；需求档 §4.15 F-DA1–F-DA3 / N2 / N4 已同步 |
| 设计评审 | ✅ 三轮 | ① `#28` 设计 changes-required ② `#32` 修正后 changes-required（🔴2 · 🟡9 · 🔵2）③ `#1` **pass**（🔴0 · 🟡1 · 🔵5） |
| 评审发现处置 | ✅ 全数落地 | 第三轮 6 条经 `#2` 修正轮落地，父侧逐条实读核（见 §6.1） |
| 文档门 | ✅ | `DOC-CHECK GATE: PASS`（设计档 + 批档 + 需求档） |

### 4.2 批准范围与边界

- **在本批范围内**：删 `DA_RETRY_LIMIT` / `_daRetry` / `_daFailures` / `_daEmptyRounds` · 立 `DA_MISS_LIMIT = 4` + `_daMissRounds` · 升级四步固定先后（账本 → 提醒 → 离容器 → 披露）· 披露按 role 分流 + 逐条 try/catch · `accountDigestRound` async 化 · 返回形去 `retried` · 读面换物（`missRounds` / `unaccounted` / 未签收数）· 首投注入失败再试保留。
- **不在本批范围**：见账 pass 里驱动模型轮（不自愈——乙案，已否决）· `run-stages.mjs:308` / `:312-315` 的跳过问题（单列 `#1852`）· 报告注入语义、账务机制判据、清场语义（逐条零改）。

**凭证**：designId `22c92a97-8971-4f89-837b-dbf1024fd549`（本轮 spawn 携带，不在本档写值）

### 4.3 更正 §4.2 的一句（父侧自纠 · 2026-10-27 23:3x）

**§4.2 写「`run-stages.mjs:308` / `:312-315` 的跳过问题（单列 `#1852`）」—— 这句作废**：`#1852` 这个编号是父侧写的时候现编的，台账里没有这一行，而且那条「债」本身不成立。

**为什么不成立（实读）**：设计档 `:1005-1006` 已把披露包在逐条 `try/catch` 里，抛错只留痕、不向外抛 ⇒ pass 正常返回 ⇒ `run-stages.mjs:308` / `:312-315` 照常执行。「会跳过」是**修之前**的形态（第三轮 🟡#1 描述的那个），修完之后不再存在。

**判据（为什么这不是「顺手加了点东西」）**：一个指向不存在的台账行的批档，读的人会去找 `#1852` 而找不到——**假指针比没有指针更坏**，因为它看起来像有据可查。所以这不是措辞修饰，是撤掉一处伪造的证据。

### 4.4 `#1852` 的归宿（父侧自纠续 · 2026-10-27 23:5x）

**§4.2 写「单列 `#1852`」（指 `run-stages.mjs:308`/`:312-315` 的跳过问题），§4.3 说那个编号是现编的、台账里没有。**

**现在 `#1852` 真的存在了，但内容是**另一件事**：设计档 §6.30 两处死指针（`:535` 指 `thincoder-core/test/timer-wake.test.mjs`、`:633` 指 `thincoder-core/test/suspension.test.mjs`，两档均已随批删除）—— 那是 `#7` 上抛、我实读复核后建的。

**三处的关系，逐条钉死，别让后来者猜：**

| 处 | 说的是什么 | 现在是否成立 |
|---|---|---|
| §4.2 | 「`:308`/`:312-315` 跳过问题 ⇒ 单列 `#1852`」 | **不成立** —— 披露已包 `try/catch`，不会跳过；且 `#1852` 现在被别的事占了 |
| §4.3 | 「`#1852` 是现编的编号，台账里没有这一行」 | **写的时候成立**（当时确实没有）；现在不成立 |
| 台账 `#1852` | §6.30 两处用例宿主死指针 | **成立** |

**⇒ 结论：`#308`/`:312-315` 那条在 `#1852` 上**没有**归属，也不需要归属（问题不存在）。§4.2 那句的正确读法是「已由 try/catch 消除，不单列任何行」。**

## §5 实施记录（eng-coder）
**状态行**：实施完成（方案丁落地；单元档 7/7 · 集成 18-1 绿 · doc-check gate PASS · 评审 pass（0 红））



### 5.1 落地内容（方案丁：投递恒一次 + 未签收上限 + 升级终局披露）

口径：行数 = 内容行数（`wc -l` 同口径；读取工具显示值 +1）。

| 件 | 实读行数 | 改法 |
|---|---|---|
| `thincoder-core/agent/digest-account.mjs` | 189 → **216** | 删 `DA_RETRY_LIMIT` / `_daRetry` / `_daFailures`；立 `DA_MISS_LIMIT = 4`（`:29`）+ `_daMissRounds`；`shouldDeliverEntry(entry, autoTurn)` 收为单门（`:46`）；`accountDigestRound` 变 async（`:90`）· 判定两支 · 升级四步固定先后（① 账本 `{id, role, missRounds, report, at}` → ② `pushReal` + `logEvent("ev:unsettled")` → ③ splice → ④ 按 role 与首投同分流披露 + 逐条 try/catch · `ev:unsettled-disclose-failed` 留痕）；返回形 `{ covered, unsettled }`（去 `retried`）；读面 `attempts = _daMissRounds` / `state = unaccounted` / `unsettledCount` 判 `> 0` |
| `thincoder-core/agent/run-start.mjs` | 159 → **159** | `shouldDeliverEntry(e, autoTurn)` 两参（`:51`）· 删 `e._daRetry = false` · 注释收正为「升级终局披露需原文」 |
| `thincoder-core/agent/run-stages.mjs` | 356 → **355** | `await accountDigestRound(agent)`（`:306`）；`:308` / `:312-315` 零改 |
| `thincoder-core/test/digest-empty-round.test.mjs` | 新档 **328** | 开发期单元档（收口删除）：T-DA4 / T-DA4② / T-DA4③ / T-DA21 / T-DA22 / T-DA23 / T-DA24 |
| `test/integration/digest-empty-round.test.mjs` | 新档 **158** | 集成资产（常驻）：RTM 行 18-1 |
| `test/RTM.md` | 63 → **64 用例行** | 新增故事 18「一条后台报告只投递一次，未签收时才升级」+ 行 18-1（结果已按实跑回填：通过 / 2026-10-27 / eng-coder（实施席实跑）） |
| `docs/core/design/API-CONTRACT.md` | 生成区 | `node scripts/api-contract.mjs --write` 重跑；复核 `digest-account.mjs` 12 行行号与源码逐字相符（`DA_MISS_LIMIT` @ `:29` 起） |

### 5.2 交付对照（§2.9 八行验收）

| §2.9 # | 状态 | 证据（本轮实跑） |
|---|---|---|
| 1 空回合 ⇒ 未签收轮 +1、零投递、条留容器 | ✅ | T-DA21（连空 3 轮：`_daMissRounds` 1→3、容器内、`report` 未释放、注入计数 0） |
| 2 未签收达 4 轮 ⇒ 升级恰一次 | ✅ | T-DA22（账本 1 · 提醒 1（「after 4 digest rounds」）· `ev:unsettled` 1 · 披露 1） |
| 3 正常路径零回归 | ✅ | T-DA21 第 4 轮补签销账；T-DA4 / T-DA4②（注入抛错 ⇒ `_daDelivered` 未置 ⇒ 下一系统轮照投一次，经真 `beginRun`）；T-DA4③（用户回合零投递，经真 `beginRun`） |
| 4 高负载窗口不更易丢 | ✅ | T-DA21（第 4 轮补签仍能销账）+ 集成 18-1（第 1–3 轮条在容器、`report` 未释放） |
| 5 投递上界不涨 | ✅ | 集成 18-1（正文出现 1 → 4 轮后 2 = 首投 + 终局披露；修前空回合径 ≥3） |
| 6 升级披露是终局一次 | ✅ | T-DA22（升级后再开 5 轮：注入仍 1 次本 pass、零新提醒、零新事件）；集成 18-1 第 5 轮零新注入 |
| 7 读面换物同判 | ✅ | T-DA21（`awaiting-digest` / `unaccounted` / count 逐轮）、T-DA22（`unsettled` + `preview` + count 0） |
| 8 披露失败不得使报告离开可见面 | ✅ | T-DA24（经真 `finalizeAgentTurn`：账本 1 · 提醒 1 · 失败留痕 1 · count 0 · 同 pass 的 covered 条照常销账 · `_inAutoTurn === false` · guard 快照照落） |

**§1.7 判据 1 与设计终形的差异（如实登记）**：§1.7 判据 1 的原形是甲（`_daFailures` 不变），用户 21:53 裁定丁后设计改为单一计数 `_daMissRounds`（空回合与有输出未签收同计）——本批按 §2.3 实现，判据 1 的机检形态以 §2.9 行 1 为准。

### 5.3 越出 §2.8 文件表的改动（逐条理由，均非行为变更，除 i18n 文案）

| 件 | 改法 | 理由 |
|---|---|---|
| `thincoder-core/i18n.mjs:46` | `digest.residue` 词文「将自动重投」→「不再自动重投，未签收满额即升级 UNSETTLED」（en 同） | 丁下旧文为假：用户可见的残余行会承诺一件不再发生的事。文案改动是机制变更的必然结果 |
| `thincoder-core/agent-tools/async-settle.mjs:142` / `:190` | JSDoc：账本行 `failures` → `missRounds`；`releaseChildHold` 的「重投需原文 / 重投上限」→「升级终局披露需原文 / 未签收条数」 | 字段与语义已换物，注释不同改即成假证 |
| `thincoder-core/agent-tools/subagent-actions-query.mjs:33` | `(awaiting-digest / retrying)` → `(awaiting-digest / unaccounted)` | 状态名换物后 JSDoc 失真（该档正是 status 面的直读方） |
| `thincoder-core/agent/suspension.mjs:243` | 删「/ 重投回路」字样 | 重投回路已退场，`_daSession` 只余见账一个判据 |

### 5.4 审计与评审轮次 · 终态

| 环 | 轮次 | 结论 | 处置 |
|---|---|---|---|
| 内部发散审计（explore 只读） | 1 | 机制与 §6.31 / §2.9 逐条一致（8 行判据 7 ✅ / 1 ⚠️）；偏离全在交付面 | ⚠️ = 注入失败再投只到谓词层 ⇒ 本轮补 T-DA4② / T-DA4③（经真 `beginRun`，行为面）；越列四档进 §5.3；文档漂移进 §5.6 |
| 内部代码评审（advisor `type=code`） | 1 | **pass**（🔴 0 · 🟡 3 · 🔵 5） | 🔵 四条本席笔内本轮修：上限依据算式（「+1 轮余量」→ 下界）、提醒句在披露失败径上的失实承诺、用户回合零投递行为用例、RTM 结果回填；🟡 三条与 🔵 四条读数为父侧路由（§5.6） |

**终态：clean**（评审 pass，无待修 🔴 / 🟡 落在本席笔域）。

### 5.5 实跑读数（本轮，命令 + 结果）

- `node --test thincoder-core/test/digest-empty-round.test.mjs` ⇒ `tests 7 / pass 7 / fail 0`
- `node --test test/integration/digest-empty-round.test.mjs` ⇒ `tests 1 / pass 1 / fail 0`
- `node scripts/api-contract.mjs --write` ⇒ `WROTE(api-contract): 4607 条`（生成区整区替换；替换前 `--check` 为 DRIFT，替换后 12 行 `digest-account.mjs` 行号经逐行复核相符）
- `doc_check(mode:"gate", docs=[test/RTM.md, docs/core/design/API-CONTRACT.md])` ⇒ `DOC-CHECK GATE: PASS`（2 档全清）
- `node --check` ⇒ 9 档全绿
- **修前红（未实跑旧码，`unverified`）**：旧档已在本轮被替换，且新断言引用的 `_daMissRounds` / `DA_MISS_LIMIT` / `unaccounted` 在旧码中不存在 ⇒ 「修前红」为结构性成立 + 批档 §1.2 实测（20 次投递 / 13 次回路产物），非本轮实跑旧码所得。

### 5.6 需父侧路由的文档面漂移（本席笔域外，逐条给坐标与改法）

1. `docs/core/design/LOGGING.md:77`：`ev:unsettled` 行仍写「消化轮见账**三次**未覆盖」——上限已改 4；同档未登记本批新增事件 `ev:unsettled-disclose-failed`（写点 `thincoder-core/agent/digest-account.mjs:143`，字段 `id` / `err`）。
2. `docs/vsc/design/WEBVIEW-PROTOCOL.md:281`：`digest.residue` 词文仍为「将自动重投 / they will be re-delivered」，与现核字典相反。
3. `docs/core/design/AGENT-LOOP-ASYNC-POOL.md:943`：「用例宿主 = 各包 `test/`（`test/*.test.mjs` 单层收集——`thincoder-core/test/run.mjs:1-49`）」与实读不符——该 runner 为 40 行、收集面为空，且对 `test/` 下任何 `*.test.mjs` 判 `uncollected test file (unit test files live in docs/batches/…)`（`thincoder-core/test/run.mjs:35`）。本批单元档按批档 §2.8 落在 `thincoder-core/test/` ⇒ 该 runner 的 fail-closed 反查会命中它（核包 `npm test` 恒 exit 1，故不影响任何绿窗，但约定相抵，须父侧裁定：移档 or 收正设计档句）。
4. `docs/core/design/AGENT-LOOP-ASYNC-POOL.md:1013`：`unsettledReminder` 坐标 125 / 调用点 118 → 现盘 151 / 123。
5. 同档 `:1061`：`digest-account.mjs` 行数「≈199」→ 实读 216（仍远低 500 软线，拆分面无变化）。
6. 批档 §2.12 常量位 `thincoder-core/agent/digest-account.mjs:27` → 现盘 `:29`（生成区 `docs/core/design/API-CONTRACT.md:970` 已是 29）。
7. 批档 §2.4 逐字引 `thincoder-core/agent/run-start.mjs:55` 注句「（重投需原文）」——该注释已随本批改为「（升级终局披露需原文）」，引文未同步。
8. 批档 §2.8 受影响文件表 6 档 vs 实际触达 10 档（§5.3 四档未入表）。

## §6 验证与收口（父代理）

### 6.1 收口读数

| # | 读数 | 命令 | 结果 |
|---|---|---|---|
| 1 | 改面单元测试 | `node --test docs/batches/2026-10-27-digest-retry-amplify.test.mjs` | **7 pass / 0 fail**（T-DA4 · 4② · 4③ · 21 · 22 · 23 · 24） |
| 2 | 集成 18-1 | `node --test test/integration/digest-empty-round.test.mjs` | **1 pass / 0 fail** |
| 3 | 全量集成 | `node --test test/integration/*.test.mjs`（19 档） | **67 pass / 0 fail** |
| 4 | 机制换物 | 全仓活码扫（排除测试档） | `DA_RETRY_LIMIT` / `_daRetry` / `_daFailures` / `_daEmptyRounds` **0 命中** |
| 5 | API 骨架 | `node scripts/api-contract.mjs --check` | 零漂移（4607 条 · 926 档） |
| 6 | 交付门 | `doc_check gate`（8 档） | **PASS · 0 段问题** |

### 6.2 收口动作：单元档移位（父侧执行）

**`#5` 跑 8 分钟 47 轮零实质写入（`currentTool: advisor`，自审中未开始移档）⇒ 父侧取消并按机械改动自做。**

| 步 | 动作 | 结果 |
|---|---|---|
| 1 | 复制核包 test 目录那档 → `docs/batches/2026-10-27-digest-retry-amplify.test.mjs` | 起跑报 `ERR_MODULE_NOT_FOUND`：档内 import 是 `../agent/…`（相对核包根） |
| 2 | 6 处 import 改 `../../thincoder-core/…` | — |
| 3 | 复跑新址 | **7 pass / 0 fail** |
| 4 | 删原址 | 核包 test 目录现只剩 `run.mjs` + `slow.mjs` |
| 5 | 跑核包 runner | 输出回到常态出口「no integration test set」——**不再是 `uncollected test file`** |

**同轮修的三处（`docs/core/requirements/AGENT-LOOP.md`）**：删掉一句指向已归档 CLI 文档地图的死指针（那张地图所在的 `docs/**` 已按 `docs/README.md` 的迁移政策归档）· `:12` 与 `:163` 后各插空行（合并段 309 / 350 字符超阈值）· 一处裸设计档名改全路径。

### 6.3 父侧改字总清单（透明披露）

| 处 | 改了什么 | 为什么 |
|---|---|---|
| `docs/core/requirements/AGENT-LOOP.md:7` | 删死指针半句 | 指向已归档档 |
| 同档 `:12` / `:163` 后 | 各插一空行 | 合并段 309 / 350 > 300 |
| 同档 `:207` | 裸名 → 全路径 | 门拒（锚·档缺） |
| `docs/batches/2026-10-27-digest-retry-amplify.test.mjs` | 新建（自核包 test 目录移入，6 处 import 改前缀） | 见 §6.2 |
| 核包 `test/digest-empty-round.test.mjs` | 删除 | 同上 |

### 6.4 未落项与遗留

- **`#1852`（台账，已建）**：设计档 §6.30 两处「用例宿主」死指针，指向的核包测试档均已随各自批删除 —— `#7` 上抛、父侧实读复核；属 timer 批的面，本批不跨批重写。
- **`#1851`（台账，已建）**：面谓词字面与仓库布局无测试绑定 —— 属 `#1849` 批，与本批无关。
- **§5.1 的行数读数与现盘不符**（`#6` 上报；实施席笔域，父侧未改）：现盘 342，§5.1 记 328（补两个用例之前的值）。收口以实读为准。
- **§2.11 写「16 故事 63 行」**：实为 17 个故事节（故事 2 已退役、零用例行）+ 63 用例行。同句已注明退役情形，口径自洽 —— 不作返工，登记在此。
- **VSC / 桌面两端无集成测试层**（`test/RTM.md` 自陈）：本批集成只落 CLI 端 18-1。

### 6.5 台账结算

- **`#1850`**：本批唯一在途行，收口走 `在途 → 待核销 → 已核销` 两步。
- **`#1851` / `#1852`**：本批新记，均「条件」触发，不进本批结算面。
