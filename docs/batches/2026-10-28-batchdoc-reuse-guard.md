# 2026-10-28 · batchdoc-reuse-guard
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-28 · 来源 = 用户 2026-10-28 12:17 逐字「那这三条可以开工了吧？」（台账 `#1873`）。
> 台账 = #1883（AGENT-LOOP · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-28
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 病（提示词补了，机制没补）

**`#1871` 刚在提示词里立了「一个批档只服务一个**并发** spawn」（`thincoder-core/prompts/persona-engineering.md:335`），而机制面**不拦**：**

```
thincoder-core/agent-tools/subagent.mjs   的 batchDoc 描述：仍是单数措辞、无禁令
buildSpawnChild                            只判「param present + path readable（content is never validated）」
```

**⇒ 提示词是软约束。它今天有效（事故之后没再撞），但它靠的是派单的人读到并记住。**

**★ 而今天上午 11:34 那场事故的形，机制面**一次都没拦过**。**

### 1.2 为什么这不是「顺手加个 if」

**「同一 `batchDoc` 的二次 spawn」有两种，处置相反：**

| 形态 | 是病还是正常流程 |
|---|---|
| **并发**（两个在飞 spawn 共用一本） | **病** —— 一个档两个写者 |
| **顺序交接**（设计 → 实施 → 修正轮，同一本） | **正常流程** |

**★ 而顺序交接是**制度性**的：`thincoder-core/prompts/discipline-engineering.md:257` 定「一批次 = 一实现轮次 = 一本批档」，而一个批次正常就要派设计席 → 实施席 → 修正轮。修正轮更是 `round="fix"` **复用同一 designToken + 同一 batchDoc**。**

**⇒ 三件判断项，任何一件没想清就动，会把正常流程判成违规。**

### 1.3 三件判断项（设计席必须逐件作答，不能跳过）

**① 拦不拦**

**⇒ 提示词已经够了？还是机制必须兜底？**
**★ 提示词靠「读到并记住」，机制靠「写不出来」—— 判据是**这类错误一旦发生，代价有多大**。今天是「语法坏档 + 一席复原」，代价中等。**

**② 若拦，靠什么区分并发与顺序**

**⇒ 现成信号 = 调度器有在飞表（`thincoder-core/agent-tools/subagent-scheduler.mjs` 记着谁在飞、占了哪些文件）。**
**★ 要判的是：用「同一 `batchDoc` 已有在飞 spawn」作判据，够不够准？有没有误伤（比如同一批里两个**不重叠文件域**的席 —— 那也共用一本，但那正是今天事故的形，**该拦**）。**

**③ 拦了之后「修正轮」怎么办**

**⇒ `round="fix"` 是合法的第二次 spawn（复用同一 designToken + 同一 batchDoc）。**
**★ 判据要能放行它 —— 比如「同角色 + fix 轮 + 前一轮已 settle」三者齐；或者干脆只在 `round="initial"` 上拦。**

### 1.4 落点（父侧给方向，设计席定形）

**代码面：**

- `thincoder-core/agent-tools/subagent-spawn.mjs` 的 `buildSpawnChild`（`batchDoc` 的准入判据在此）
- `thincoder-core/agent-tools/subagent-scheduler.mjs` 的在飞表（那是「并发」的现成判据来源）
- 工具描述 `thincoder-core/agent-tools/subagent.mjs` 的 `batchDoc` 那段（现在单数措辞、无禁令 —— 若拦，这里要同步）

### 1.5 不该做的事

- **不改提示词** —— `:335` 三行刚落，零改（本批只管机制面）
- **不做文本匹配式拦截** —— 本项目已否决（`docs/core/design/TOOLS.md` §6.4：安全哲学 = 信任模型 + 审批 + 快照，文本拦截是安全剧场）
- **不为「万一有人绕过」设防** —— 模型能绕过的东西，拦不住；本批只做**结构性判据**（读在飞表），不做意图猜测

### 1.6 判据

1. **病态被拦**：同一 `batchDoc` 已有在飞 spawn 时，再发 `round="initial"` ⇒ 被拒，且拒因点名（哪一本、哪个在飞）。（若 ① 判「不拦」，则本条改为「设计档写明为什么不拦 + 代价」）
2. **顺序交接放行**：单席顺序（设计 → 实施）⇒ 不被拦。
3. **修正轮放行**：`round="fix"` 复用同一 `batchDoc` ⇒ 不被拦。
4. 改面单测过 + `doc_check` gate PASS。

### 1.7 设计评审裁定（父侧 2026-10-28 12:3x）

**评审判 changes-required（🔴 1 · 🟡 9 · 🔵 2）。十二条全接受，十条要修，两条 🔵 转实施期。**

| # | 级 | 裁 | 处置 |
|---|---|---|---|
| 1 | 🔴 | **Fixed** —— 缺失的 RTM 行**只给进入口与「同族节」**，行号与故事节都推给实施轮（`test/RTM.md:236` 定「**编号先行**：先定 RTM 编号，再落用例标题 `test(&apos;&lt;编号&gt; …&apos;)`」）；而该表 **19 个故事无「派单」节**，唯一「批档锁」节 = 故事 12（业务结果 = 写产品码被拒），与「同档第二席被拒」**不是同一业务故事** ⇒ 实施席只能自己发明。且 §6.31 无集成测试设计小节（同档 §6.22.9 是同形先例）。 | 先在 `test/RTM.md` 落定**故事节 + 行号**（新故事「一本批档只服务一个并发 spawn」+ 行 `<N>-1`；若坚持挂故事 12，须写明为何同一业务结果），并在 §6.31 增「集成测试设计」一节载该行。 |
| 2 | 🟡 | **Fixed** —— 拒因文案未给逐字（AC-BG-1 只断「含两者」）；同类先例都逐字定稿并声明单源（§6.29.1 ∥ §6.22.1）⇒ 实施席自拟，下游逐字断言无锚。 | §6.31.2 给出拒句逐字模板（档路径 + `role#id` + status + 「等其 settle 再派 ∥ cancel 它」），并指明文案单源。 |
| 3 | 🟡 | **Fixed** —— `docs/core/design/AGENT-LOOP-SUBAGENT.md:142` 仍写「非调度参数，不参与冲突判定」，本批后它参与一种占用判定（拒发），两处定位互斥。 | `:142` 补指针：「同档并发的拒发面见 §6.31——那是 spawn 门，不是调度器排队」。 |
| 4 | 🟡 | **Fixed** —— 「一处校验双路生效」只有**被检面**双路；**占用面**只覆盖 async —— sync spawn 不入池（`thincoder-core/agent-tools/subagent.mjs:321-322`）⇒ 两次 `async:false` 同档并行仍合法，§6.31.7 未登记此界。 | §6.31.7 补一条已知界（sync spawn 不是占用者），或把 sync 占用记到独立集合。 |
| 5 | 🟡 | **Fixed** —— **判据读裸字段**「池 `parent._asyncSubagents`」，而同族单源是访问器：`depInfo`（`subagent-scheduler.mjs:115`）走 `getAsyncPool(parent,"subagent")`，带载体吸收（`async-settle.mjs:120-125` → `carrierField` 回退 `parent.history`）⇒ **只携 `history` 的合成 parent 会读到空池，护栏静默失效**。 | §6.31.1 ∥ §6.31.2 明写 `getAsyncPool(parent,"subagent")`。 |
| 6 | 🟡 | **Fixed** —— §6.31 无勘察证据行（同档 §6.22 `:259-264` ∥ §6.26 `:689` 都有）。 | 补一行：查过哪些公开源档 + 同机制成案与否。 |
| 7 | 🟡 | **Fixed** —— `:918` 只给设计档节号 + 一句类比，缺实现坐标、无先例批次；偏离理由（KD-BG2）已给但未成行。 | 补「最贴近先例：`describeBlockers` ∥ §6.9；对齐 = 同一冲突判定落点；偏离 = 拒发不排队」。 |
| 8 | 🟡 | **Fixed** —— 新名 `batchDocInFlight` 无既有件三问答案（`entry._batchDoc`（`subagent-run.mjs:92`）∥ `describeBlockers` 已在盘）。 | 补 `existing:` + `none found:` + 消费方三件。 |
| 9 | 🟡 | **Fixed** —— 主分支（事故）与放行分支（`:336`）场景有名；但 `status="queued"` 计入在飞 与「前一轮在飞就派修正轮 ⇒ 拒」**只有推导**，无观察场景。 | 两态各补一句来源，或明写「推导项——无观察场景」。 |
| 10 | 🟡 | **Fixed** —— 档头 `docs/core/design/AGENT-LOOP-SUBAGENT.md:5` 承接节号枚举已漏 §6.29 ∥ §6.30，本批再加 §6.31 仍不补。 | 该行枚举补至 §6.31（顺带补 §6.29 ∥ §6.30）。 |
| 11 | 🔵 | **Accepted** —— AC-BG-6 大小写变体依赖 win32 不敏感比较，非 win32 宿主无判别力。 | 实施期用例按平台条件化。 |
| 12 | 🔵 | **Accepted** —— 普通面 coder 携 `batchDoc` 时条目同样带 `_batchDoc` ⇒ 会作为占用者拒掉后续工程派单，而 coder 自己不在门内。 | §6.31.1 补一句「占用判据只认 `_batchDoc`，不分角色」。 |

**★ 评审确认的四条（父侧采纳）**：① 同族先例成立（都是「一个资源同时只有一个写者」，而批档本身就是被并发写的 `.md`）· ② **「同批两个不重叠文件域的席共一本 ⇒ 拒」判为正确**（`:335` 逐字支撑）· ③ 修正轮的结构解成立（settle 首行置 `done`）· ④ 同消息并发不漏网（`subagent.mjs:287`→`:322`→`subagent-run.mjs:202` 之间无 await）。

**★ 第 5 条我要多说一句**：那不是「写法不统一」，是**一个端面会静默失效** —— 而静默失效比报错坏得多（没有信号，没人会查）。

### 1.8 修正轮结果 + 一条上抛的裁定（父侧 2026-10-28 12:3x）

**12 条全落。🔴 那条它答得比我要的更准。**

**它报：`test/RTM.md:234`-`:242` 新故事节 **20**「一本批档只服务一个并发 spawn」+ 行 `20-1`，**不挂故事 12** —— 因为 12 的业务结果 = 写产品码被拒，本节 = 同档第二席被拒。**

**★ 那是对的：**业务故事不同就得分节**，而不是找「最像的那节」塞进去。**

**⇒ 设计档 `:1019`-`:1029` 新增 §6.31.8「集成测试设计」（交互组件 / 业务结果 / 进入口 / 回指），形同 §6.22.9。**

### 1.9 上抛裁定：需求层缺条目 —— 判「补」，但不进本批

**它报：`docs/core/requirements/AGENT-LOOP.md` 里**没有本条目的条目**（grep `batchDoc` ∥ `批档` ∥ `并发` 只命中别的条目），本节规则的权威来源只有提示词 `thincoder-core/prompts/persona-engineering.md:335`。**

**⇒ 裁：这确实是个缺口 —— 一条规则只有提示词层、没有需求层锚，等于「它在」。

**★ 但**不在本批补**，理由三条：**

- 本批是**机制批**（spawn 门），改动面已定死在 4 档；插一条需求条目会改改动面。
- 需求层条目要写「模块目标 / 功能点 / 边界 / 验收 / 依赖」五要素，**那是另一次讨论**，不是顺手一句。
- 而**它已经诚实报了** —— 报出来的缺口不会丢；不报的才会。

**★★ 记进台账（我马上落行），`trigger = 归批`，`evidence` 写清缺口与它的 grep 读数。**

**★ 另记一条它自己提的**：设计档已 **1032 行**（过 800 行硬限），拆分候选 `SPAWN-TASK-CHANNEL` 在 §6.22.3 已登记 —— **本批不动**，但台账要有一行（否则「已登记」会变成「没人记得」）。

**★ 它的自检里有一笔我要夸**：RTM 插入块它先写 `≈+4`，实测后改成 `≈+9`（264 → 273 行）—— **主动改了错数并报出来**。那与今晚反复抓的「读数不实」是反面。

### 1.9 实施结果 + 三条报告项的裁定（父侧 2026-10-28 12:4x）

**单测 11/11 · 集成 1/1 · `doc_check` PASS · 内部代码评审 pass。父侧另跑集成套件：`tests 69 / pass 69 / fail 0`（exit 0），行 `20-1` 单例 26ms 绿。**

| 报告项 | 裁 | 处置 |
|---|---|---|
| 1 **真文档错**：设计 §6.31.4（`docs/core/design/AGENT-LOOP-SUBAGENT.md:979`）与批档 §2.5 写「单测住 `test/`」，而 `test/run.mjs:38` 逐字 `uncollected test file (unit test files live in docs/batches/ and run via node --test <file>)` ⇒ **照文档字面搬会直接红** | **修**（设计席） | 实施席没照错的文档做，按仓规落 `docs/batches/` 并上抛 —— **那是对的处置**。设计档两处改成仓规形。 |
| 2 门序末位：`prepareScheduling` 在 `buildSpawnChild` 之前（`subagent.mjs:281` vs `:287`）⇒ 既携坏 `files` 又撞在飞档时报 files 错误 | **不改** | 沿用 §6.22.1 既有形状、**非本批引入**；在此登记即可。 |
| 3 集成用例覆盖面的收窄：第一席是造的池条目（真交付要 LLM） | **接受** | 形态所限，已如实写进 `test/RTM.md:241` 的异常列 —— **不是省事，是写明了**。 |

**★ 第 1 条我要单独说**：文档说住 `test/`、运行器反过来说住 `docs/batches/` —— **那是文档与机械判据相反**。实施席按**能跑的**那侧做、把矛盾报上来，**没有为了让文档成立而把文件放到会红的位置**。**那是正确的优先序：可跑的证据 > 文档的字面。**

### 1.10 收口面（父侧已做 / 待做）

- ✅ 集成套件收口跑：`node test/run.mjs` ⇒ 69/69 绿（exit 0）。
- ✅ `test/RTM.md:241` 行 `20-1` 结果列已填「通过 + 日期 + 执行人 + 异常 + 证据读数」。
- ⏳ 本批单测档 `docs/batches/2026-10-28-batchdoc-reuse-guard.test.mjs`：**收口时删**（单测零留存）。
- ⏳ 设计档两处「单测落位」改正（报告项一）—— 已派设计席。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（本体 = docs/core/design/AGENT-LOOP-SUBAGENT.md §6.31；待用户批准后派 eng-coder）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试覆盖 / 验收对照 / 关键决策 / 上抛项>

### 2.1 本批条目（覆盖；回指设计档 §6.31）

| # | 条目 | 判据 |
|---|---|---|
| 1 | 病态被拦：同档已有在飞 spawn，再派 ⇒ 拒，且拒因点名档 + 占用者 `role#id` + 其 status | `docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.31.5 AC-BG-1 |
| 2 | 顺序交接放行：前一轮已 settle（`done`）⇒ 同档再派通过 | 同 §6.31.5 AC-BG-2 |
| 3 | 修正轮放行：`round="fix"` 复用同档、无在飞 ⇒ 通过 | 同 §6.31.5 AC-BG-3 |
| 4 | 队列条目也算在飞（`status="queued"` ⇒ 拒）· 他档在飞不阻 · 非工程角色零影响 | 同 §6.31.5 AC-BG-4/5/7 |
| 5 | 路径归一：同一档的相对 / 反斜杠 / win32 大小写写法判为同一档 | 同 §6.31.5 AC-BG-6 |
| 6 | 改面单测过 + 本次写入档 `doc_check` gate PASS | 同 §6.31.5 AC-BG-8 |

**不在本批**：提示词面零改（`thincoder-core/prompts/persona-engineering.md:335` 原样）· 跨进程互斥不做（§6.31.3 KD-BG4）· advisor 评审池不在护栏内（§6.31.7 第 5 条）· 不校验批档内容。

### 2.2 设计档落点

本体 = `docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.31（判据 / 接口 / 决策 / 用例 / 边界）。同档 §6.22.1 门序行与 §6.22.7 边界第 2 条已随判据改真，实施席不再动。

### 2.3 机制设计（摘要）

判据 = 池 `parent._asyncSubagents` 内 `status ∈ {running, queued}` ∧ `done` / `cancelled` 皆假 ∧ 条目 `_batchDoc` 与入参解析出的绝对路径按 `fileKey` 相等 ⇒ `buildSpawnChild` 抛错，不入池。

新导出 `batchDocInFlight(parent, batchDocAbs)` 住 `thincoder-core/agent-tools/subagent-scheduler.mjs`（池派生事实单源，与 `depInfo` 同族）。调用点 = 既有 `batchDoc` 门内，`thincoder-core/agent-tools/subagent-spawn.mjs:211` 之后、任务书门之前 ⇒ 在条目入池之前求值，不会命中自己。

判据不读 `round`：修正轮靠「前一轮已 settle ⇒ 不在在飞集」自然放行；前一轮仍在飞就派修正轮则照拒（同一种两写者）。理由全文 §6.31.3 KD-BG1。

### 2.4 受影响文件

清单与行数（现 / Δ / 改动逐行）= `docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.31.4 表，此处不复写。共 4 个源档 + 1 个临时单测档：

- `thincoder-core/agent-tools/subagent-scheduler.mjs`（新导出）
- `thincoder-core/agent-tools/subagent-spawn.mjs`（门内判定 + 拒因文案）
- `thincoder-core/agent-tools/subagent.mjs`（`:151` 参数描述补禁句）
- `thincoder-core/tool-docs/subagent.md`（工程角色段补一本一并发）
- 本批单测档（临时，收口删）

### 2.5 验收对照

改面单测：`node --test <本批单测档路径>`（住项目 `test/` 目录，命名随该目录惯例，由实施席落定并在 §5 记录实测读数）；断言集 = §6.31.5 的 AC-BG-1…7。

文档门：`doc_check(mode:"gate")` 首行 `DOC-CHECK GATE: PASS`（AC-BG-8）。

### 2.6 integration 面（RTM 增量）

读过 `test/RTM.md`：无现存行断言「同档两席并发」；本批不改坏任何现存行断言的可观测结果；无冗余行可删。

缺 1 行（生产真实发生：2026-10-28 11:34 两份并发 spawn 共用一本批档 ⇒ 语法坏档 + 一席复原）：进入口 = 工程模式父侧并发派两席共一本批档，第二席被拒且点名占用者。行号按 `test/RTM.md` 尾号续定，由实施轮落表时与本批单测档一并交付；故事归属取该表内派单 / 批档锁同族节。

### 2.7 关键决策

KD-BG1（判据 = 并发，不读 `round`）· KD-BG2（拒发而非排队：排队只把第二个写者延后，病不消失）· KD-BG3（读在飞表，不做文本匹配）· KD-BG4（跨进程不设防，登记为已知界）——全文 = `docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.31.3。

### 2.8 上抛项

无。§1 三件判断项逐件已答（拦不拦 = 拦 · 靠什么区分 = 在飞表 + 路径相等 · 修正轮 = 靠 settle 自然放行），无待裁项。

### 2.9 评审修正落账（§1.7 十二条逐条；本体 = 设计档 §6.31）

| 评审号 | 处置 | 落点 |
|---|---|---|
| 1 🔴 | 已落：`test/RTM.md` 新故事节 20「一本批档只服务一个并发 spawn」+ 行 `20-1`。不挂故事 12——12 的业务结果 = 写产品码被拒，本节 = 同档第二席被拒，不是同一故事；设计档增 §6.31.8「集成测试设计」（交互组件 / 业务结果 / 进入口 / 回指） | `test/RTM.md:234-240` · 设计档 §6.31.8 |
| 2 🟡 | 已落：§6.31.2 给逐字拒因模板（档绝对路径 + `role#id` + status + 等其 settle ∥ cancel 它），文案单源 = `subagent-spawn.mjs` 的 `buildSpawnChild`；AC-BG-1 与用例 1 改逐字相等断言 | 设计档 §6.31.2 ∥ §6.31.5 ∥ §6.31.6 |
| 3 🟡 | 已落：`batchDoc` 参数定位句改「非调度器参数，不参与 `files` 域冲突判定」+ 指向 §6.31（spawn 门，不是调度器排队） | 设计档 §6.9 `:142` |
| 4 🟡 | 已落：§6.31.2 改「被检面双路、占用面单路」；§6.31.7 第 7 条登记「sync spawn 不入池 ⇒ 不是占用者」 | 设计档 §6.31.2 ∥ §6.31.7 |
| 5 🟡 | 已落：判据改 `getAsyncPool(parent, "subagent")`（与 `depInfo` 同读法），并专列一条写明裸读在只携 `history` 的合成 parent 下静默失效 | 设计档 §6.31.1 |
| 6 🟡 | 已落：勘察证据行（池与条目面 ∥ spawn 门面 ∥ 纪律与验收面三组坐标 + 外部源档未查的如实声明） | 设计档 §6.31 节首 |
| 7 🟡 | 已落：「最贴近先例」成行——`describeBlockers` ∥ §6.9，对齐 = 同一冲突判定落点（池派生单源），偏离 = 拒发不排队（KD-BG2） | 设计档 §6.31 节首 |
| 8 🟡 | 已落：既有件三问成行——`existing:` 条目 `_batchDoc` · `getAsyncPool` · `describeBlockers`；`none found:` 无「按档查占用者」谓词；消费方 = `buildSpawnChild` 单点 | 设计档 §6.31.2 |
| 9 🟡 | 已落：两态（`status="queued"` 计入在飞 ∥ 前一轮在飞就派修正轮即拒）明写「推导项——无观察场景」，并点名两处有观察场景的分支（事故主分支 ∥ 单席顺序交接） | 设计档 §6.31.3 末 |
| 10 🟡 | 已落：档头承接节号枚举改 `§6.28–§6.31`（连带补上 §6.29 ∥ §6.30） | 设计档 `:5` |
| 11 🔵 | 转实施期并按裁定写定判据：AC-BG-6 写明「大小写变体仅 `process.platform === "win32"` 断言；相对 / 反斜杠变体各平台恒断」，用例 6 标注按平台条件化 | 设计档 §6.31.5 ∥ §6.31.6 |
| 12 🔵 | 已落：§6.31.1 补「占用判据只认 `_batchDoc`，不分角色」及其非对称说明（coder 也是占用者，被检面靠两模式互斥不可达） | 设计档 §6.31.1 |

**受影响文件增量（覆盖 §2.4 清单；以设计档 §6.31.4 表为准）**：新增两行——`test/RTM.md`（≈+4 行）· `test/integration/batchdoc-reuse-guard.test.mjs`（新档，≈+70 行）。

**§2.6 的「行号交实施轮」已被本条取代**：RTM 编号先行已落盘（故事 20 · 行 `20-1`），实施席照行号写用例标题 `test('20-1 …')`，不再自行发明故事与行号。

**验收面随动**：AC-BG-1 由「文本含两者」收紧为「文本逐字等于 §6.31.2 模板」；AC-BG-8（`doc_check` gate PASS）不变；集成行 `20-1` 结果列 = 待执行，由收口轮跑。

**上抛项更新（覆盖 §2.8）**：无待裁项。新增一条非阻断登记——需求层 `docs/core/requirements/AGENT-LOOP.md` 无本条目的条目，本节规则的权威来源 = 提示词 `thincoder-core/prompts/persona-engineering.md:335`；需求档补条目属主 agent 笔（D1），本批不代写。

**§2.9 计数更正**：`test/RTM.md` 的 Δ = **≈+9 行**（实测：插入块 9 行，264 → 273），非 §2.9 所写 ≈+4；设计档 §6.31.4 表已同数改正。

**§2.5 单测落位句改正（父侧裁 · 报告项一）**：§2.5 原写「住项目 `test/` 目录」——与运行器相反，作废。改以下句：

**改面单测档落 `docs/batches/<批档同名词干>.test.mjs`，命令 `node --test <该档>`，收口即删；集成用例才落 `test/integration/`（标题照 RTM 行号）。**

**判据（硬证据）**：`test/run.mjs:38` 逐字 `uncollected test file (unit test files live in docs/batches/ and run via node --test <file>)`。

⇒ `test/` 树内非 `test/integration/**` 的 `*.test.mjs` 会让整套跑 fail。照旧句落位 = 文档与机械判据相反，实施席照做即红。

**同族口径**：`docs/core/design/TESTING.md:55`（单元测试档住批次目录、零留存、永不进任何门）· `:43`（直达跑法 `node --test docs/batches/<档>.test.mjs`）。

**落盘**：设计档 §6.31.4 表该行已改成同句形（`docs/core/design/AGENT-LOOP-SUBAGENT.md:979`）。

**同族复核（本节内其余「测试档放哪」句）**：

- `:980` 行 = `test/RTM.md`（集成索引，住 `test/` 根、非 `*.test.mjs`，不在收集面禁列）✓
- `:981` 行 = 集成用例住 `test/integration/` ✓
- §6.31.5 的 AC-BG-1…7 宿主只写 `<本批单测文件>`，不指位置 ✓

⇒ 三处零改。

## §3 设计评审（评审子代理）
**状态行**：评审通过（第二轮复评：第一轮 12 条全 Fixed，新增仅 3 条 🔵（不阻断））



### 轮次 1（评审子代理）

### 五处重点判定（结论挂在表前）

**① 同族先例成立**

两者护的是同一件事：一个资源同时只有一个写者；批档本身就是被并发写的 `.md` 档。

逐字依据 = `thincoder-core/prompts/persona-engineering.md:337`：
「a child cannot tell which rows are its own; two children on one record therefore each work the full table, and the same file ends up with two writers」。

文件域不重叠**不构成**豁免理由 —— `:335` 逐字「One batch record serves one spawn at a time」；偏离（拒发而非排队）已由 KD-BG2 给理由，类比可用。

**② 误伤面判定通过**

正常 settle 条目留池但 `done=true`（`thincoder-core/agent-tools/async-settle.mjs:231` 无条件置位）；挂起期出池（`:298-301`），cancelled 出池（`:265`）
⇒ 单席顺序交接与修正轮均不误伤（`thincoder-core/prompts/persona-engineering.md:336`「never overlaps」）。

「同批两个不重叠文件域的席共一本 ⇒ 拒」**判为正确**，依据同上。

同消息并发 spawn 也不漏网：`thincoder-core/agent/dispatch.mjs:271` 走 `Promise.all`，但 `thincoder-core/agent-tools/subagent.mjs:287` → `:322` → `subagent-run.mjs:202` 之间无 await
⇒ 判定与入池同一同步段，第二席必看到第一席。

**③ 修正轮的结构解成立**

settle 首行即 `entry.done = true`（`async-settle.mjs:231`），派修正轮的前提是父侧已拿回上一轮（digest 只在 settle 后到手）
⇒ 不读 `round` 自洽；前一轮仍在飞就派、照拒亦自洽。KD-BG1 推理链无断点。

**④ 落点四处一致，两处漏面**

`:305` 门序行与 `:395` 边界第 2 条已带 §6.31 指针（在盘）；`thincoder-core/agent-tools/subagent.mjs:151` 与 `thincoder-core/tool-docs/subagent.md:49` / `:59` 落点正确。

漏面 = `docs/core/design/AGENT-LOOP-SUBAGENT.md:142`「非调度参数，不参与冲突判定」句未随改，以及档头 `:5` 承接节号枚举未含 §6.31。

**⑤ AC 与集成面**

AC-BG-1…8 与 8 行用例表可机判（均落到断言 / 退出码）。集成的「缺的 1 行交实施轮」不合规 —— 见下表第 1 行。

### 发现表

| # | 类 | 严重度 | 问题 | 建议 |
|---|---|---|---|---|
| 1 | 集成 / 验收对照 | 🔴 | 缺的 1 行只给了进入口与「同族节」，**行号与故事节都推给实施轮**（批档 §2.6「行号按尾号续定，由实施轮落表时一并交付」）。而 `test/RTM.md:236` 定「编号先行：先定 RTM 编号，再落用例标题 `test('<编号> …')`」；该表 19 个故事里无「派单」节，唯一「批档锁」节 = 故事 12「无活批档不许改产品代码」（业务结果 = 写产品码被拒），与「同档第二席被拒」不是同一业务故事 ⇒ 实施席只能自己发明故事与行号。且 `docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.31 无集成测试设计小节（同档 §6.22.9 是同形先例） | 在 `test/RTM.md` 先落定故事节 + 行号（新故事「一本批档只服务一个并发 spawn」+ 行 `<N>-1`；若坚持挂故事 12，须写明为何同一业务结果），并在 §6.31 增「集成测试设计」一节载该行：交互组件（spawn 门 ⟷ 池在飞表 ⟷ 第二席返回）+ 业务结果 + 进入口 + 回指的需求 / 设计条目；用例标题照行号写 |
| 2 | 清晰度 | 🟡 | 拒因文案未给逐字：§6.31.1 只要求点名档 + `role#id` + status，AC-BG-1 只断「含两者」。同类先例都逐字定稿并声明单源（§6.29.1 两句拒文 + 「文案字面只出该档」；§6.22.1 模板逐字）⇒ 实施席自拟，下游逐字断言无锚 | §6.31.2 给出拒句逐字模板（档路径 + `role#id` + status + 「等其 settle 再派 ∥ cancel 它」的可执行下一步），并指明文案单源 |
| 3 | 文档归属 / 状态一致性 | 🟡 | `docs/core/design/AGENT-LOOP-SUBAGENT.md:142` 仍写「`batchDoc?` … 非调度参数，不参与冲突判定」——本批后 `batchDoc` 参与一种占用判定（拒发），两处对同一参数定位互斥 | `:142` 该括注补指针：「同档并发的拒发面见 §6.31——那是 spawn 门，不是调度器排队」 |
| 4 | 可行性 / 覆盖面 | 🟡 | §6.31.2「两条 spawn 路径都过 ⇒ 一处校验双路生效」只有被检面双路；占用面只覆盖 async——sync spawn 不入池（`thincoder-core/agent-tools/subagent.mjs:321-322`）⇒ 两次 `async:false` 同档并行仍合法。§6.31.7 未登记此界（KD-BG4 只登记跨进程） | §6.31.7 补一条已知界：「sync spawn 不是占用者——`async:false` 双派同档不拦（提示词 `:335` 已禁 depth-0 `async:false`）」，或把 sync 占用记到独立集合 |
| 5 | 清晰度 | 🟡 | 判据读裸字段「池 `parent._asyncSubagents`」（§6.31.1 / §2.3），而同族单源是访问器：`depInfo`（`thincoder-core/agent-tools/subagent-scheduler.mjs:115`）走 `getAsyncPool(parent,"subagent")`，实现带载体吸收（`async-settle.mjs:120-125` → `carrierField` `:53-57` 回退 `parent.history`）；§6.7.3:104 亦定「池 accessor = `getAsyncPool`」 | §6.31.1 / §6.31.2 明写 `getAsyncPool(parent,"subagent")`（或 `carrierField(parent,"_asyncSubagents")`），与 `depInfo` 同读法；否则只携 `history` 的合成 parent 读到空池、护栏静默失效 |
| 6 | 方法论 / 勘察证据 | 🟡 | §6.31 无勘察证据行（同档先例都有：§6.22 `:259-264`、§6.26 `:689`）⇒ 读作「未勘察」或「勘察未记录」 | 补一行：查过哪些公开源档（§6.7.3 / §6.9 / §6.21–§6.26 / §6.29 / `docs/core/design/TOOLS.md` §6.4 / `thincoder-core/prompts/persona-engineering.md:335-337` / `test/RTM.md`）+ 同机制成案与否 |
| 7 | 方法论 / 最贴近先例 | 🟡 | `:918` 只给设计档节号 + 一句类比，缺实现坐标，无先例批次；偏离理由在 KD-BG2 ✅ 已给，但「对齐 / 偏离」未成行 | 补「最贴近先例：`existing: thincoder-core/agent-tools/subagent-scheduler.mjs` 的 `describeBlockers` ∥ 设计档 §6.9；对齐 = 同一冲突判定落点（池派生单源）；偏离 = 拒发不排队（KD-BG2）」 |
| 8 | 既有件三问 | 🟡 | 新名 `batchDocInFlight` 无三问答案（住哪 · 名逐字 · 谁消费），也未答既有件可用性（`depInfo` / `describeBlockers` / 条目 `_batchDoc` 已存在） | 补一行：`existing: entry._batchDoc`（`thincoder-core/agent-tools/subagent-run.mjs:92`）+ `depInfo` 同址；`none found:` 无现成「按档查占用者」谓词；消费方 = `buildSpawnChild` |
| 9 | 分支来源 | 🟡 | 主分支场景有名（2026-10-28 事故：两席共用一本、文件域不重叠、语法坏档 + 一席复原），放行分支场景有名（`:336` 顺序交接）；但 `status="queued"` 计入在飞（AC-BG-4）与「前一轮在飞就派修正轮 ⇒ 拒」（用例 8）只有推导，无观察场景或无复现路径 | 两态各补一句来源：或引事故当场池读数（哪条是 queued），或明写「推导项（同一种两写者，启动序推迟不消病）——无观察场景」 |
| 10 | 文档状态 | 🟡 | 档头 `docs/core/design/AGENT-LOOP-SUBAGENT.md:5` 承接节号枚举 =「§6.7 · §6.9 · §6.12 · §6.21–§6.26 · §6.28」，已漏 §6.29 / §6.30，本批再加 §6.31 仍不补 | 该行枚举补至 §6.31（顺带补 §6.29 / §6.30） |
| 11 | 验收可机判（细节） | 🔵 | AC-BG-6 的大小写变体断言依赖 win32 不敏感比较（`thincoder-core/agent-tools/subagent-scheduler.mjs:70`）——非 win32 宿主上该变体无判别力 | 用例按平台条件化（`process.platform === "win32"` 才断大小写变体），相对 / 反斜杠变体各平台恒断 |
| 12 | 口径（未声明的非对称） | 🔵 | 普通面 coder 携 `batchDoc` 时条目同样带 `_batchDoc`（`thincoder-core/agent-tools/subagent-spawn.mjs:308-309`）⇒ 会作为占用者拒掉后续工程派单，而 coder 自己不在门内——非对称未声明 | §6.31.1 补一句：占用判据只认 `_batchDoc`（不分角色）；被检面只覆盖工程角色，coder 面靠模式互斥不可达 |

**计数**

🔴 1 · 🟡 9 · 🔵 2。

**行数抽查**

`thincoder-core/agent-tools/subagent-scheduler.mjs` 451 · `thincoder-core/agent-tools/subagent-spawn.mjs` 428 · `thincoder-core/agent-tools/subagent.mjs` 422 · `thincoder-core/tool-docs/subagent.md` 89 —— 与盘上一致（前三差 1 = 尾随空行计数口径）。

四个源档均低于 500 软线，无需拆分计划；新增函数体量小，函数层无 300 行单体。

VERDICT: changes-required

### 轮次 2（评审子代理）

**五处重点判定（第二轮）**

**① RTM 新故事节 20 与行 20-1 在盘、编号连续、无重号**

标题见 `test/RTM.md:234`（`### 20. 一本批档只服务一个并发 spawn`），行见 `:241`（`| 20-1 | 工程模式父侧并发派两席共一本批档…`）；编号 19 → 20 连续，全表仅一处 20。

**② `getAsyncPool` 改法真能用（与 `depInfo` 同读法）**

`docs/core/design/AGENT-LOOP-SUBAGENT.md:932` 与 `:933` 已改访问器读法，并写明裸读在只携 `history` 的合成 parent 下静默失效。

`getAsyncPool` 本就由 `thincoder-core/agent-tools/subagent-scheduler.mjs` 导入，同档 `depInfo`（`:115`）已是该读法 ⇒ 无新依赖、无环。

**③ §6.31.8 四件齐**

`docs/core/design/AGENT-LOOP-SUBAGENT.md:1023`-`:1025` 表头四列 = 交互组件 / 业务可观察结果 / 进入口 / 回指，行 20-1 四格皆填；`:1027` 另给进入口来源（生产真实发生，非推演）。

**④ 十二条均落在设计档，不只是 §2.9 落账表**

- 方法论两条：勘察证据 `docs/core/design/AGENT-LOOP-SUBAGENT.md:922`-`:928` · 最贴近先例 `:920` · 既有件三问 `:944`。
- 判据三条：访问器读法 `:932`/`:933` · 占用只认 `_batchDoc`（不分角色）`:935` · 被检面双路 / 占用面单路 `:947` + `:1017`。
- 文案与验收四条：逐字拒因 + 单源 `:949`-`:953` · 两态「推导项」`:964`-`:967` · 大小写平台条件化 `:992`/`:1005` · 档头节号枚举 `:5`。
- 落点两条：`batchDoc` 定位句指针 `:142` · §6.31.8 + `test/RTM.md` 故事 20 / 行 20-1。

**发现表（第二轮：第一轮 12 条全 Fixed；新增仅 🔵）**

| # | 原# | 文件 | 严重度 | 状态 | 备注 |
|---|---|---|---|---|---|
| 1 | (new) | `docs/batches/2026-10-28-batchdoc-reuse-guard.md:147` | 🔵 | New | §2.3 摘要仍写裸字段「判据 = 池 `parent._asyncSubagents` 内」，与 §6.31.1 访问器读法不同；`:191` 已记明改真，append-only 下以 `:191` 为准。建议 §2.9 再补一句「§2.3 摘要以 §6.31.1 为准」，避免实施席照摘要写回裸读。 |
| 2 | (new) | `docs/batches/2026-10-28-batchdoc-reuse-guard.md:173` | 🔵 | New | §2.6 仍写「行号按 `test/RTM.md` 尾号续定，由实施轮落表时一并交付」，与在盘的故事 20 / 行 20-1 相反；`:202` 已声明取代，同上建议一句指针。 |
| 3 | (new) | `docs/core/design/AGENT-LOOP-SUBAGENT.md:1019` | 🔵 | New | 新小节号 §6.31.8 与 `docs/core/design/AGENT-LOOP-ASYNC-POOL.md:951` 起那一族的 §6.31.8（判空加宽，见 `test/RTM.md:188`）重号；本仓三档各自带 §6.31 属既有状态、非本批引入，且新指针均带档名限定 ⇒ 不阻断，登记备查。 |

**计数**：🔴 0 · 🟡 0 · 🔵 3。第一轮 12 条 = 12 Fixed（两条原 Accepted 的 🔵 也顺手改真了，而非留在实施期）。

VERDICT: pass

## §4 用户批准（主 agent）

### 4.1 用户批准 + 复评签发（2026-10-28 12:3x）

**用户逐字**：「那后续你自动跑完吧。」（12:19）。

**⇒ 批准面 = §2（12 条修正后）+ 两轮评审（第 1 轮 CR：🔴1 · 🟡9 · 🔵2 → 修正 → 第 2 轮 pass：🔴0 · 🟡0 · 🔵3）。**

**★ 签发：`designId = 16ff7de6-ebc6-4284-9a0f-0817b6966b98`。**

### 4.2 实施边界（三档代码 + 一档工具描述 + 一档单测）

| 档 | 改动 |
|---|---|
| `thincoder-core/agent-tools/subagent-scheduler.mjs` | 新增导出 `batchDocInFlight`（**读 `getAsyncPool(parent, "subagent")`，不读裸字段**）+ 约 25 行 |
| `thincoder-core/agent-tools/subagent-spawn.mjs` | `:211` 之后、任务书门之前调用，抛**逐字模板**拒因（档绝对路径 + `role#id` + status + 等其 settle ∥ cancel 它）+ 约 8 行 |
| `thincoder-core/agent-tools/subagent.mjs` | 参数描述补禁句 + 2 行 |
| `thincoder-core/tool-docs/subagent.md` | `:49` / `:59` 区补一句 + 2 行 |
| `docs/batches/2026-10-28-batchdoc-reuse-guard.test.mjs` | 新档，§6.31.6 的 8 行用例表；**收口即删** |

**★ 三条硬约束：**

- **占用判据只认 `_batchDoc`，不分角色**；但**被检面只覆盖工程角色**（sync 不入池 ⇒ 不是占用者）。**这个非对称要写进注释**，否则下一个人会「顺手统一」。
- **必须按 `status ∈ {running, queued}` ∧ `done` / `cancelled` 皆假**过滤 —— **settle 的条目留在池里**（`async-settle.mjs:295`），只看「池里有同档条目」会把**单席顺序交接全部误拒**。
- **不碰 advisor 池**（评审写 §3、与实施席 §5 段不相交）。

### 4.3 三条 🔵 的处置（复评给的，我裁）

| # | 内容 | 裁 |
|---|---|---|
| 13 | §2.3 摘要仍写裸字段（`docs/batches/2026-10-28-batchdoc-reuse-guard.md:147`），`:191` 已记明改真 | **加一句指针**（见 §4.4） |
| 14 | §2.6 仍写「行号交实施轮」（`:173`），`:202` 已声明取代 | **同上** |
| 15 | §6.31 三档重号 | **记台账 `#1887`**（`trigger = 条件`：下一次跨档指针清理时同批处理） |

### 4.4 给实施席的两句指针（本条即 §4.3 的落地）

**读到 §2.3 摘要里「池 `parent._asyncSubagents`」时，一律以 §6.31.1 的 `getAsyncPool(parent, "subagent")` 为准。**

**读到 §2.6 里「行号按尾号续定、由实施轮交付」时，一律以 `test/RTM.md` 故事 20 / 行 `20-1` 为准（已落）。**

## §5 实施记录（eng-coder）
**状态行**：实施完成（4 源档 + 2 用例档；AC-BG-1…7 机检绿；内部审计 1 轮 + 独立代码评审 1 轮 pass；终态 clean）



### 5.1 交付摘要

同一本批档已有在飞 spawn 时，工程角色（eng-coder / eng-designer）的第二次 spawn 在 `buildSpawnChild` 的既有 `batchDoc` 门内被拒，不入池。

拒因逐字照设计 §6.31.2 模板：档绝对路径 + 占用者 `role#id` + 其 status + 「等其 settle ∥ cancel 它」。

判据只用结构性事实：池（经 `getAsyncPool(parent, "subagent")` 读）内条目满足三条——`status ∈ {running, queued}`、`done` / `cancelled` 皆假、`_batchDoc` 与本次解析出的绝对路径按 `fileKey` 相等。

不读 `round`、不做文本匹配、不碰提示词面。

**状态**：实施完成 · 内部审计 1 轮（1 条已修）· 独立代码评审 1 轮 `pass`（🔴 0 · 🟡 2 · 🔵 3）· **终态 `clean`**。

### 5.2 改动逐档（我的 hunk；行数 = 盘上实测）

| 档 | 改动 | 我的 hunk | 盘上总行数 |
|---|---|---|---|
| `thincoder-core/agent-tools/subagent-scheduler.mjs` | 新导出 `batchDocInFlight(parent, batchDocAbs)`（池派生单源，与 `depInfo` / `describeBlockers` 同族）+ 档头口径行 | +29 行 | 479 |
| `thincoder-core/agent-tools/subagent-spawn.mjs` | import 补 `batchDocInFlight`；`batchDoc` 门之后、任务书门之前加在飞判定 + 逐字拒因（含非对称注释） | +19 行 | 446 |
| `thincoder-core/agent-tools/subagent.mjs` | `:151` 的 `batchDoc` 参数描述补「同档在飞即拒」 | ±0（一句改写） | 422 |
| `thincoder-core/tool-docs/subagent.md` | `:49`（eng-coder 段）+ `:59`（工程角色段）载明一本一并发、顺序交接为何放行 | ±0（两处句内改写） | 89 |
| `docs/batches/2026-10-28-batchdoc-reuse-guard.test.mjs`（新档 · 收口删） | §6.31.6 用例 1–8 + 三条附件例（取消窗口 / VSC 载体 / 非对称） | +173 行 | 173 |
| `test/integration/batchdoc-reuse-guard.test.mjs`（新档 · 留存） | 集成行 `20-1`，标题 `test("20-1 …")`，经 `executeToolCalls` 走真工具面 | +89 行 | 89 |

口径说明：

- 四个源档均低于 500 软线（最高 479），新函数体 11 行无单体风险。
- 盘上工作树还带着**别批未提交的改动**（如 `subagent-spawn.mjs` 的 `filesBlockOf` 写域行属 `spawn-files-visible` 批）⇒ 设计 §6.31.4 的「现」列无法对本席 hunk 单独复测，上表「我的 hunk」是唯一可归属读数。
- 设计估算 ≈+18 / ≈+10 / ±0 / ≈+2，本席实际 +29 / +19 / ±0 / ±0；超出部分全是判据注释（父侧硬约束③要求非对称入注释）。

### 5.3 验收对照（任务书 §2.1 六条 × 设计 §6.31.5）

| # | 条目 | 状态 | 落点 / 机检 |
|---|---|---|---|
| 1 | 病态被拦：同档在飞 `running` ⇒ 拒，且点名档 + 占用者 `role#id` + status | ✅ Done | 用例 1（`assert.equal` 逐字等于模板，AC-BG-1）+ 集成 20-1 |
| 2 | 顺序交接放行：前一轮已 settle ⇒ 同档再派通过 | ✅ Done | 用例 2（AC-BG-2） |
| 3 | 修正轮放行：`round="fix"` 复用同档、无在飞 ⇒ 通过 | ✅ Done | 用例 3（AC-BG-3） |
| 4 | 队列条目也算在飞 · 他档在飞不阻 · 非工程角色零影响 | ✅ Done | 用例 4 / 5 / 7（AC-BG-4/5/7） |
| 5 | 路径归一：相对 / 反斜杠 / win32 大小写判为同一档 | ✅ Done | 用例 6（AC-BG-6；大小写变体按 `process.platform === "win32"` 条件化） |
| 6 | 改面单测过 + 本次写入档 `doc_check` gate PASS | ✅ Done | 读数见 5.4（11/11 · 1/1 · `DOC-CHECK GATE: PASS`） |

### 5.4 验证读数（本批实跑 · cwd = 仓根）

| 命令 | 结果 |
|---|---|
| `node --test docs/batches/2026-10-28-batchdoc-reuse-guard.test.mjs` | **tests 11 · pass 11 · fail 0** |
| `node --test test/integration/batchdoc-reuse-guard.test.mjs` | **tests 1 · pass 1 · fail 0**（行 20-1） |
| `node --check` 三档（scheduler / spawn / subagent.mjs） | exit 0 ×3 |
| `doc_check(mode:"gate")`（`thincoder-core/tool-docs/subagent.md`） | 首行 `DOC-CHECK GATE: PASS` |

单测 11 例 = 用例表 8 条 + 附件例三条（取消窗口 / VSC 载体 / 非对称）。

**判据否证力**：用例 1/4/6/8 断言的是本批新写的拒因全文（该文本此前不存在）；用例 2/3/5/7 走完整 `buildSpawnChild` 装配成功路径。护栏宽判或误拒，两向都红。

### 5.5 内部审计与独立代码评审

**① 内部偏离审计（explore · 1 轮 · 零偏离）**

机制面与 AC 面未发现 PARTIAL / SILENT-SIMPLIFICATION / OUT-OF-LIST。它的四条：

- §5 空 ⇒ 本节即修复。
- 设计 §6.31.4 单测落位 ⇒ 见 5.6 报告项一。
- 访问器读法无用例守 ⇒ **真缺口，已修**（见 ②）。
- 集成行断言窄于结果列 ⇒ 见 5.6 报告项三。

**② 已修 · 访问器读法有了用例**

新增附件例「VSC 形载体（池只挂 `parent.history`）」：把 `getAsyncPool` 换成裸读 `parent._asyncSubagents` 时该例必红、其余 8 例仍绿 ⇒ 护栏的静默失效面现在有条用例看着。

**③ 独立代码评审（`advisor` type=code · 1 轮 · `VERDICT: pass` · 🔴 0 · 🟡 2 · 🔵 3）**

| # | 级 | 内容 | 处置 |
|---|---|---|---|
| 1 | 🟡 | 设计 §6.31.4 + 批档 §2.5 写「单测住项目 `test/` 目录」，仓规相反（`test/run.mjs:38`） | 文档错、代码对 ⇒ 不改代码，进 5.6 报告项一（设计档 = eng-designer 笔） |
| 2 | 🟡 | §5 空、`doc_check` gate 读数不可核 | 本节即修复（5.4 逐条读数） |
| 3 | 🔵 | §6.31.2 门序末位「files 声明面」与实现序不符 | 进 5.6 报告项二（设计档报告项，代码不动） |
| 4 | 🔵 | `done` / `cancelled` 第二段过滤无用例 | 已修：新增附件例「取消窗口（`status='running'` ∧ `cancelled=true`）」 |
| 5 | 🔵 | 导出谓词对空入参 fail-open | 已修：JSDoc 补前提句（入参 = 已解析绝对路径，唯一消费方保证非空） |

第 4 条的语义值得记下：该窗真实存在——`subagent-async.mjs:223` 的 cancel 只置 `cancelled`，status 到 settle 才改；这段窗口内父侧刚 cancel，必须能立刻重派。

### 5.6 与设计的偏差 / 报告项（非本席可改，交父侧路由）

**报告项一（文档真错）· 单测档落位**

- 设计 §6.31.4（`docs/core/design/AGENT-LOOP-SUBAGENT.md:979`）与批档 §2.5（`:165`）都写「住项目 `test/` 目录，命名随该目录惯例」。
- 而仓的单入口反向判据要求相反——`test/run.mjs:38` 逐字：`uncollected test file (unit test files live in docs/batches/ and run via node --test <file>)`。即 `test/` 树内非 `test/integration/` 的 `*.test.mjs` 会让整套跑 `fail()`。
- **照文档字面搬会直接红。** 本席按 §4.2 的逐字路径 + 仓规落 `docs/batches/`，与同族 `docs/batches/2026-10-28-batch-status-reset.test.mjs` 一致。
- 建议：设计表该行改 `docs/batches/`，批档 §2.5 同句随动。

**报告项二（文档精度）· 门序末位**

- 设计 §6.31.2（`:955`）写「→ token 门 → files 声明面」，但 `files` / `dependsOn` 准入（`prepareScheduling`）在 `buildSpawnChild` **之前**跑（`thincoder-core/agent-tools/subagent.mjs:281` vs `:287`）。
- 后果：同一次 spawn 既携坏 `files` 又撞在飞档时，报的是 files 错误、不是本护栏拒句；下游按末位文案写「护栏优先」断言会红。
- 该序沿用 §6.22.1（`:305`）既有形状、非本批引入。建议 §6.31.2 末行改实序或加括注。

**报告项三（用例覆盖面，如实登记）· 集成 20-1 窄于结果列**

- 结果列要求「第一席照常交付、档上只有一套写者」；用例实断的是「第二席被拒 + 点名 + 池内仍只有第一席 + 第一席条目零改 + 队列空」。
- **「第一席照常交付」未观察**：真交付要一个跑得起来的子代理（要 LLM），夹具里第一席是按 `subagent-run.mjs:66-99` 条目字面量造的池条目。形态所限的收窄，不是省事。

**零偏离声明**

- 除上述三条文档 / 覆盖面报告项，实现与设计 §6.31 无偏离。
- 提示词面（`thincoder-core/prompts/**`）零改。
- 设计档 `:5` / `:142` 的指针与枚举已在前序席位落盘，本席未动。

### 5.7 边界核对（设计 §6.31.7 七条）

- 不改提示词 ✅ 零触。
- 不做文本匹配式拦截 ✅ 只用池 + 路径相等。
- 不校验档内容 ✅ 夹具内容随意，门不读。
- 不覆盖跨进程 ✅ 登记为已知界，未设防。
- 不含 advisor 评审池 ✅ 只读 `getAsyncPool(parent, "subagent")`，评审写 §3 不受影响。
- 不改批档写门与 token 机制 ✅ 判定位置在 token 门之前，写门零触。
- sync spawn 不是占用者 ✅ 已入判据注释与谓词 JSDoc，机制面不重复设防。

### 5.8 收口待办（父侧）

- 跑集成套件收口跑（`node test/run.mjs`），并在 `test/RTM.md:241` 行 20-1 填结果 + 证据。
- 删本批单测档 `docs/batches/2026-10-28-batchdoc-reuse-guard.test.mjs`（用毕即删，零留档）。
- 报告项一 / 二的设计档改动归 eng-designer。
- 需登记的漂移由父侧落台账行。

## §6 验证与收口（父代理）

### 6.1 验证与收口（父侧 2026-10-28 12:4x）

**判定：本批交付成立。** 父侧独立跑门 + 复算（不采信交付报告读数）。

| 判据 | 父侧实读 |
|---|---|
| 单测（本批改面） | `node --test docs/batches/2026-10-28-batchdoc-reuse-guard.test.mjs` ⇒ **tests 11 · pass 11 · fail 0** |
| 集成（行 `20-1`） | `node test/run.mjs` ⇒ **tests 69 · pass 69 · fail 0**（exit 0）；单例 `20-1` 26ms 绿 |
| `test/RTM.md` 行 `20-1` | 结果列已填「通过 + 日期 + 执行人 + 异常 + 读数」，**异常列如实写收窄**（第一席是造的池条目） |
| 集成档在盘 | `test/integration/batchdoc-reuse-guard.test.mjs` ✓ |
| 文档机检门 | `DOC-CHECK GATE: PASS`（各笔回执） |
| 源档行数 | 最高 479（`thincoder-core/agent-tools/subagent-scheduler.mjs`），四源档全在 500 软线下 |

### 6.2 交付面

| 档 | 内容 |
|---|---|
| `thincoder-core/agent-tools/subagent-scheduler.mjs` | `batchDocInFlight(parent, batchDocAbs)` —— 池经 `getAsyncPool(parent, "subagent")` 读，按 `status ∈ {running, queued}` ∧ `done`/`cancelled` 皆假 ∧ `_batchDoc` 按 `fileKey` 相等 |
| `thincoder-core/agent-tools/subagent-spawn.mjs` | `batchDoc` 门内判定 + 逐字拒因（档绝对路径 + `role#id` + status + 等其 settle ∥ cancel 它）+ 非对称注释 |
| `thincoder-core/agent-tools/subagent.mjs` ∥ `thincoder-core/tool-docs/subagent.md` | 参数描述与工具描述载明「一本一并发、顺序交接为何放行」 |
| `docs/core/design/AGENT-LOOP-SUBAGENT.md` | §6.31 全节 + `:142` 指针 + §6.31.4 单测落位改仓规形（修正轮） |
| `test/RTM.md` | 新故事节 20 + 行 `20-1` + 结果 |

### 6.3 三条报告项的落地

| 项 | 处置 |
|---|---|
| 单测落位文档错（文档说 `test/`、运行器反着来） | **已修** —— `docs/core/design/AGENT-LOOP-SUBAGENT.md:979` 改仓规形（住 `docs/batches/`、`test/` 下只有 `test/integration/**`），批档 §2 追加修正条 + 硬证据 `test/run.mjs:38` |
| 门序末位（`files` 面判在 `batchDoc` 门之前） | **不改** —— 沿用 §6.22.1 既有形状、非本批引入，登记于此 |
| 集成用例覆盖面的收窄 | **接受并如实登记** —— 已写进 `test/RTM.md` 行 `20-1` 异常列 |

### 6.4 未决与后续

| 项 | 处置 |
|---|---|
| 需求层缺「一本批档只服务一个并发 spawn」条目 | 台账 `#1885`（`trigger = 归批`） |
| 设计档 1032 行过 800 硬限 | 台账 `#1886`（`trigger = 条件`） |
| 三档共用 §6.31 小节号 | 台账 `#1887`（`trigger = 条件`） |
| `docs/core/design/AGENT-LOOP-SUBAGENT.md:720` 死指针 ⇒ AC-SC-8 期望 0 而实读 1 | 台账 `#1889`（`trigger = 条件`） |

- **单测面**：本批改面单测档 `docs/batches/2026-10-28-batchdoc-reuse-guard.test.mjs` **收口即删**（单测零留存）。
- **集成面**：本批新增 1 例（行 `20-1`），现存量 = 69（对 ≈50–100 窗口在界内）。父侧已跑 `node test/run.mjs` ⇒ 69/69 绿。
- **暂缓批复核**：本批无暂缓批 ⇒ 无。
