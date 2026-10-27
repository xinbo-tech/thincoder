# 2026-10-27 · ledger-boundary
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-27 · 来源 = 用户 2026-10-27 15:07「现在修啊！」——父侧实测发现的台账读面缺陷（台账 #1834）。
> 台账 = #1834（LEDGER · 归批）。前情 = docs/batches/2026-10-27-batch-ledger-review-unify.md §6（已收口 2026-10-27）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-27
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 缺陷（台账 `#1834`）

**现象**：进程工作目录 ≠ 目标项目时，台账读面**静默返回空**。

**实测**（2026-10-27 15:20，临时项目 + 临时 HOME）：

```
ledgerQuery({ cwd: proj, boundary: proj })   →  1 行   ✓
ledgerQuery({ cwd: proj })                   →  0 行   ← 静默空
ledgerExport({ cwd: proj, full: true })      →  {"projects":[]}   ← 静默空
```

**根因两层**：

1. `thincoder-core/ledger-db.mjs` 的 `resolveLedgerRoot(target, boundary)` 缺省是 `resolve(boundary ?? process.cwd())` —— **上溯上界缺省取进程工作目录，不是会话锚**。
2. `openLedger` 读面无根时 `return null`（写面 `throw`）⇒ 调用方拿到 null 返回空账 ⇒ **「越界」与「该目录没有台账」压成同一个 `[]`**。

**为什么这是缺陷而非设计**：业务失败被静默吞掉了。**读不到行**与**没有行**在返回值上不可区分，调用方无法察觉。

### 1.2 受影响调用点（全仓扫描，8 处）

| # | 位置 | 面 |
|---|---|---|
| ① | `thincoder-core/ledger-read.mjs:39` `openLedger(root, { readOnly: true })` | `ledgerExport`（CLI `ledger list --json`） |
| ② | `thincoder-core/ledger-read.mjs:43` `ledgerQuery({ cwd: root })` | 同上 |
| ③ | `thincoder-core/agent-tools/read-data.mjs:77` `ledgerCount({ cwd: c.cwd })` | ACP `ledger/count` |
| ④ | `thincoder-core/ledger-migrate.mjs:197` `openLedger(plan.projectRoot, { create: true })` | 迁移（写面，越界会抛） |
| ⑤ | `thincoder-core/agent-tools/batch-lifecycle.mjs:349` `ledgerReanchorBatch({cwd, batch})` | **收口重锚** |
| ⑥ | `thincoder-core/agent-tools/batch-reopen.mjs:111` `ledgerReclaimBatch({...})` | **重开回收** |
| ⑦ | `thincoder-core/agent-tools/r8-ledger-readings.mjs:19` `ledgerAdd({ cwd: project, row })` | 读数列工具 |

**未受影响**（已正确传）：`ledger-tools.mjs:295/309/315/320/325` 五个 action 全传 `boundary: anchor` · `ledger.mjs:84` · `live-batch.mjs:55` · `agent-tools/batch-ledger-bind.mjs:133`。

**⑤⑥ 是本批（`#1830`）新增的两枚批级写点** —— 收口重锚与重开回收正走在这条缺陷上。

### 1.3 修法（父侧定）

**主线**：调用点逐个补 `boundary`（与会话锚同源）。

**加一条防线**：`lb-ledger-db.mjs` 的 `resolveLedgerRoot` 读面缺省从 `process.cwd()` 收紧 —— **读面也必填**。理由：写面已经必填（越界会抛），读面留缺省正是这次静默的来源；两边同一口径，才不会一边能发现、一边看不见。

**判据**：每处修法配一例夹具，条件是「进程 cwd ≠ 目标项目」——**这正是这次踩到的场景**，而不带这个条件的夹具在修前修后都绿。

### 1.4 授权与边界

**用户 2026-10-27 15:07 原话**：「现在修啊！」

**范围**：只改上表 8 处 + `resolveLedgerRoot` 的缺省；不动台账表结构、不动迁移逻辑、不动工具面（工具面已正确）。

### 1.5 执行形态：父侧直接执行（轻通道 · 情形 ② 缺陷修复）

**为什么走轻通道**：本笔不改语义 —— **实现与既有源不一致**（工具面 `ledger-tools.mjs` 五个 action 全传 `boundary`，这 4 处没传）。修 = 把实现拉回既有口径，不是新增机制。

**没有设计评审、没有 designToken** ⇒ `eng-coder` 无法装配（它要求 token）⇒ 父侧直接落。**§5 因此空着**（该段只有 eng-coder 可写；本批无 coder）。

### 1.6 改动明细（4 处调用点）

| # | 文件 | 改了什么 |
|---|---|---|
| ① | `thincoder-core/ledger-read.mjs` `readProject` | 形参加 `boundary`，头部注释写明「必传，缺则落 `process.cwd()` ⇒ 跨项目静默空」 |
| ② | 同档 `readProject` 内 `openLedger` | `{ readOnly: true }` → `{ readOnly: true, boundary }` |
| ③ | 同档 `readProject` 内 `ledgerQuery` | `{ cwd: root }` → `{ cwd: root, boundary }` |
| ④ | 同档 `ledgerExport` | `resolveLedgerRoot(anchor)` → `(anchor, anchor)`；单范围 + 族范围两处 `readProject(...)` 补 `anchor` |
| ⑤ | `thincoder-cli/src/acp/read-data.mjs` | `ledgerCount({ cwd: c.cwd })` → `+ boundary: ctx.getCwd()` |
| ⑥ | `thincoder-core/ledger-migrate.mjs` | `openLedger(plan.projectRoot, { create: true })` → `+ boundary: plan.projectRoot` |

### 1.7 未做（父侧裁定）

**`resolveLedgerRoot` 的缺省未收紧**（§1.3 原列为「加一条防线」）。

**理由**：收紧缺省会改变**所有**调用方（含未扫描到的内部路径），超出「补参数」范围；写面本来就必填（越界会抛），读面缺省只在「忘了传」时生效 —— 本笔把**已发现的全补上了**。

**残留**：将来新增调用点又忘传，仍会静默空。**记在 `#1834` 的修法备注里**，不另开行。

### 1.8 读数

| 面 | 命令 | 结果 |
|---|---|---|
| 语法 | `node --check` × 3 档 | **全 OK** |
| 修复验证（进程 cwd ≠ 目标项目） | 临时项目 + 临时 HOME：`ledgerExport({cwd: proj})` | **修前 `{"projects":[]}` → 修后 1 项 / 1 行** ✓ |
| 台账/批档面集成回归 | `node --test test/integration/{batch-ledger-bind,ledger-close-proof,batch-anchor-create,batch-close-gate,batch-close-token-consume,batch-gates-reanchor,batch-live-batch-lock}.test.mjs` | **25 pass / 0 fail** |

### 1.9 一条运行时事实（不是本笔缺陷，但要记住）

**本会话的 `batch` 工具跑在旧代码上**：`batch create` 的回执里那句 `register the ledger entry yourself — create does not` **在全仓搜不到** —— 说明当前进程加载的是 `#1830` 之前的 `batch.mjs`。

**后果**：我用 `batch create` 建本档时，档头写对了 `#1834`，但台账行没被迁到 `在途`（旧版不改行）。**父侧随后直接调 `ledgerBindBatch` 补正**（`待讨论 → 在途`、`task_book` 指本档、`trigger = 归批`）。

**判据**：**「盘上代码」与「运行中的进程」是两个东西** —— 改了代码不重启，工具面照旧行为。

### 1.10 段适用性声明

> 不适用：§2 —— 轻通道缺陷修复（情形 ②：实现与既有源不一致），无设计阶段。改法 = 逐处补 `boundary` 形参，语义零改。

> 不适用：§3 —— 轻通道轮无设计评审（也因此无 designToken，`eng-coder` 无法装配，改由父侧直接落）。

> 不适用：§4 —— 用户 2026-10-27 15:07 原话「现在修啊！」即本笔的授权本身，无需二次批准门。

**重开记录**：2026-10-27 · 原收口 2026-10-27 · 理由 = 轻通道只省时点不省全链——本笔误将 §2/§3 声明为「不适用」，须重开补齐设计形式化与独立评审（收尾全链后置补跑），再核销 · 操作者 = 主 agent

### 1.11 定义勘误（2026-10-27 15:48 · 父侧认错）

**本笔 §1.10 把 §2 / §3 声明为「不适用」，那是错的。本段作废该声明。**

**错在哪**：我把轻通道读成「免掉设计与评审」。**需求档的原话不是这个。**

`docs/core/requirements/LIGHT-CHANNEL.md:15`：

> 让工程模式下的**细节调整与缺陷修复**保持分钟级体验（**免走**设计 → 评审 → 批准全链），同时以「**收尾全链**」兜住全部（防「快捷」变「脱缰」）

`docs/core/requirements/LIGHT-CHANNEL.md:56`：

> **收尾一次全链**（触发 = 用户说「收口」…）：全链跑一次——**设计**（已落改动形式化 + 文档一致化方案）→ **评审**（独立：落码 ∥ …）

**⇒ 轻通道省的是「先走全链」的时点，不是「全链本身」。改完必须补设计、补评审 —— 那正是这个模式存在的目的：快，但不漏。**

**`:9` 用户原话也印证**：

> 轻通道反正最后有走全链兜底，所以重点应该放在确保轻通道挂账走全链核销不漏，没必要把走轻通道的门槛设置得那么高

**核销不掉 = 机制在正确工作。** 机检 ③ 要求 `§3 = 评审通过`，而本笔确实没跑评审 —— **它拒得对。**

**本段之后**：§2 补设计形式化，§3 补独立评审，跑完再核销。

### 1.12 计数勘误（父侧笔 · design 席 §1.2 复核指出）

**§1.2 与 §1.6 的计数错了，本段收正。**

| 原写 | 实况 |
|---|---|
| 「8 处调用点」 | **5 个真漏调用点 / 3 档** |
| §1.6 标题「4 处调用点」而表内 6 行 | 同上 —— 标题与表对不上 |

**为什么错**：我用单行 `grep` 判「有没有传 `boundary`」，而 `boundary` 常写在多行对象的下一行 —— 把 ⑤⑥ 判成漏（假阳性）；同时 `read-data.mjs` 的路径记成了 `thincoder-core/agent-tools/`，实为 `thincoder-cli/src/acp/`；⑦ 指向的 `r8-ledger-readings.mjs` 是 `.thincoder/tmp` 下的探针脚本，不是产品档。

**实况**（design 席逐格复核）：**真漏 5 个调用点 · 2 档**（`ledger-read.mjs` 的 `openLedger` / `ledgerQuery` / `ledgerExport` 三处 + `read-data.mjs:77` + `ledger-migrate.mjs:197`）。

**判据（这条要记住）**：**「某参数没传」不能用单行 grep 判** —— 多行对象调用会被判成假阳性，而假阳性会让你以为「8 处要改」；真漏的点位与改法由 design 席的逐格复核为准（§2.2）。

### 1.13 上抛裁决（父侧 · design 席 §2 交回的四个问题）

**① 读面「无根」与「无库」不可分 —— 拆，本批不做**

design 席的判断对：**缺省 `process.cwd()` 不是「保留判断」，是换了一个界**；而 `return null` 让「越界」和「这个项目没有台账」在返回值上同形。这正是我今天判错的那一格。

**裁**：拆。**形 = 最小** —— 返回值加一个报明字段（哪一格：越界 / 无库 / 库不可读），**不动行集形、不动调用点形**。

**为什么本批不做**：改返回形要动所有消费面，属新机制，**须走设计 → 评审 → 批准**；本批的边界只是补参数。

**前置**：先有报明形，才轮到收紧缺省（design 席 §2.6 D1 的次序判断成立）。

**② `ledgerExport` 零用例 —— 登台账**

`test/RTM.md` 十四个业务故事无一行覆盖台账读面。**这不该由本批背**（本批写域是补参数），另起一行。

**③「调用方必须传 `boundary`」要不要需求层判据 —— 要，本批写**

design 席已在 `docs/core/design/LEDGER.md` §3.8 立了硬判据（设计层）。**需求层缺一句总纲**：读面的界必须由调用方给出，不得落到进程工作目录。

**补在哪**：`docs/core/requirements/LIGHT-CHANNEL.md` 不相关；应落在台账的需求档（`docs/core/requirements/` 下承载台账读面契约的那份）。**父侧笔，本批写**。

**④ §1 计数错 —— 已修**（§1.12）

### §1.14 压缩判据缺陷定位（台账 `#1833` —— 父侧实测，2026-10-27 16:10）

**结论：`#1833` 不是回归，是压缩判据的真缺陷。故事 1 的红是它的症状。**

#### 病因读数（探针实测，非推算）

```
[PROBE-CTX]  total=83717  history=153  system=33852  tools=49712  threshold=76800
[PROBE-ANTH] stage=compress  finish=tool_calls  tools=1  est=83821
[PROBE-ANTH] stage=turn      finish=stop        tools=0  est=83263
[PROBE-TURN]                 finish=stop        tools=0  est=83263
```

**`history` 只有 153 —— 对话几乎空白，`system + tools = 83,564` 已经超过压缩阈值 76,800。**

#### 失真链（逐步实测，每步都有读数）

1. `compressIfNeeded` 判 `total > threshold` ⇒ 83717 > 76800 ⇒ **压缩触发**
2. 压缩调 LLM 写摘要（`stage=compress`）—— 这是**第 1 个请求**
3. 测试桩按「第 1 个请求必是对话」的假设回 `toolUseEvents`
4. 压缩把它当摘要文本读 ⇒ 摘要为空 ⇒ `throw "compaction summary is empty"`
5. 压缩失败降级 ⇒ 真正的对话才发出（第 2 个请求，`stage=turn`）
6. 桩回文本 ⇒ `stop / tools=0` ⇒ 主循环认为「没有工具调用」

**⇒ 工具调用没有丢：第 1 个响应被压缩链吃掉了。** 而压缩本不该在这一刻发生。

#### 为什么 `#1827` 的系数改动会触发它

`ASCII_CHARS_PER_TOKEN` 4 → 3 把 `tools`（序列化 148,102 字符）的估算从 37,026 抬到 49,712：

| 系数 | tools 估算 | total | 是否过 76,800 |
|---|---|---|---|
| 4 | 37,026 | ≈62,447 | 否 ⇒ 故事 1 绿 |
| 3 | 49,712 | 83,717 | **是** ⇒ 压缩触发 ⇒ 故事 1 红 |

**系数 3 是准的**（`#1827` 依据：同刻状态栏 491k ≈ 2.7 字符/token）。**它只是让一个本来就存在的缺陷显形了。**

#### 缺陷本体

**压缩只能压 `history`；`system + tools` 是固定开销，压不掉。**

**而阈值判据用的是 `total = (history + system + tools) × ratio`。**

**⇒ 当固定开销本身逼近阈值时，压缩会反复触发却压不出任何东西 —— 每触发一次都可能吃掉一次响应。** 本案 `history=153`、压缩无中段可切 ⇒ 走 `shrinkOversized` ⇒ 单条消息不足 8000 字符 ⇒ 一个字符都没截 ⇒ 空转一次，白吃一个请求。

#### 修法方向（待设计席定形）

**阈值该只面对「能压的那部分」。** 固定开销（`system + tools`）不是压缩能动的对象，把它算进分母，等于给每轮对话凭空扣掉 83K 预算。具体形态（是「比较时减 overhead」还是「overhead 超某比例即跳过压缩」）归设计席定。

#### 附带项

**测试桩的「第 1 个请求必是对话」假设**同样要修 —— 但它不是病根。压缩一插入，这个假设就破；而压缩在真实场景随时可能插入。**桩应按请求内容（是否要求摘要）分辨，而不是按序号。**

### §1.15 空响应重试预算：复位语义 + 不加 run 级总额度（台账待开号）

- **已定决定**：空响应重试预算的语义 = **连续空计数**，不是每轮额度。清零判据唯一 = 本轮模型响应「有实质」（正文非空 **或** `toolCalls.length > 0`）；清零点唯一 = `thincoder-core/agent/turn-loop.mjs:153`。额度 `MAX_EMPTY_RETRIES = 2` 不动。· 用户原话：「**不加**」（2026-10-27 16:53，答「要不要加 run 级总额度」）· 时间：2026-10-27 16:53

**为什么这是缺陷**（实读，非推测）：

```js
completion.mjs:16   const MAX_EMPTY_RETRIES = 2
completion.mjs:35   // Bounded — after MAX_EMPTY_RETRIES consecutive empties, surface the original error.
completion.mjs:40     agent._emptyRetries = retries + 1      // 空一次 +1，任何成功都不减
run-start.mjs:140     agent._emptyRetries = 0                // 只在新用户轮清零
```

**注释写 `consecutive`（连续），实现是本轮累计。** 一个回合里第 3 次空响应（哪怕前面成功过）直接抛 `LLM returned empty response`。

**用户观察**：「但是我点 retry，又都能继续」—— retry = 新用户轮 ⇒ 清零 ⇒ 又能跑。**这证实空响应可恢复、不该有累计额度。**

**为什么不加 run 级总额度**（用户裁定「不加」，理由随行）：加了它，**偶发空但中途成功的会话照样在总数用尽后抛** —— 正是本条要治的现象会复活。代价是交替形态（空 / 实质交替）下重试次数上界只剩 `maxTurns`；**接受这个代价，因为要治的是提供端连续吐空，而交替形态里每次实质响应都在推进回合。**

**重开记录**：2026-10-27 · 原收口 2026-10-27 · 理由 = 评审未落 §3：收口先于第五轮评审（`#48`，VERDICT pass）返回，批档已冻结致其写入被拒。重开后第六轮（`#49`）落 §3 为「轮次 5」并给 changes-required（8 条）——**盘上 §3 的「轮次 5」指第六轮，不是 `#48` 那个 pass**；`#48` 的 pass 结论只在它自己的报告里，未入档。 · 操作者 = 主 agent
## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（评审轮 7 两条残留已落（§2.38：:414 回指改指两处断言住址 · :392 序列补第五步 → 正文）；门扫 11 条裸档名指针 + 1 长段已清，PASS。仍开 = 需求层三项归父侧（§2.20 ①② ∥ §2.30 ①））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试覆盖 / 验收对照 / 关键决策 / 上抛项>

### 2.1 本批条目（覆盖 ∥ 明确不在本批）

来源 = 台账 `#1834`（`trigger = 归批`）+ §1 实测。

| # | 条目 | 本批状态 |
|---|---|---|
| 1 | 台账**读面**漏传 `boundary` ⇒ 进程 cwd ≠ 目标项目时静默返回空账 | 覆盖——5 个调用点已补（§2.3 逐格复核） |
| 2 | 「调用方必须传 `boundary`」由隐含约定升为**设计档硬判据** | 覆盖——`docs/core/design/LEDGER.md` §3.8 + §7.1（§2.4）；需求层判据 = 父侧笔（§2.7 ③） |
| 3 | `resolveLedgerRoot` 的 `boundary` **缺省**收紧 | **不在本批**——§2.6 D1 给出为何它必须排在「无界报明既定的**下一秒**」之后；残留登记在 `#1834` |
| 4 | 读面「无根」与「无库」不可区分（两者都出 `null` ⇒ `[]`） | **不在本批**（新机制）——§2.7 ① 已裁：拆，形取最小，另批 |

**边界（本批不做）**：不改台账表结构 · 不改迁移逻辑 · 不动工具面（`ledger-tools.mjs` 五个 action 本就传 `boundary: anchor`）· 不改 `test/**`。

### 2.2 机制设计：`boundary` 是什么，为什么必须是会话锚

**语义（单源 = `docs/core/design/LEDGER.md` §3.8「界」+ §2.1「根解析面」）**：`boundary` = 项目根上溯的**上界**。台账面答两个问题——「这是哪个项目」和「库落在哪」；第二个问题要求**库不得挂到工作目录之外的项目**，故上溯必须止于会话锚，而不是止于盘根（取根面的界才是盘根，两面两界、不混）。

**判据本体只有一处**：`manifest-discovery.mjs` `owningProject(target, boundary)`；`ledger-db.mjs:96` 的 `resolveLedgerRoot` 是它的 `basis` 形状包装（`:99` 直调，零第二上溯——实读 `ledger-db.mjs:96`–`:101`）。

**缺省的形状（本批的缺陷载体）**：`ledger-db.mjs:98` `const edge = resolve(boundary ?? process.cwd())`。缺省不是「保留判断」，而是**换了一个界**——进程工作目录与会话锚不同值时，同一个调用得到不同答案。两种答案里错的那个是空账：目标落在进程 cwd 之外 ⇒ `owningProject` 判越界 ⇒ 无根 ⇒ 读面 `openLedger` 返回 `null`（`ledger-db.mjs:255`，注释自陈「两类同形」）⇒ 上层落 `[]`。

**读面 ∥ 写面的不对称——本批的处置**：无根时写面抛（`:254` `create` 分支，零落盘），读面返 `null`（`:255`）。**该不该收：本批不收**，理由是读面的 `null` 里混着**第三种合法含义**——库文件不存在（`:258`），那是「该项目还没有台账」，真话。把读面改成抛，则空账与无库一起变红，`--family` 的「不可读跳过」与 `ledgerCount` 的三零出口全被推翻。故本批只做一件事：**不让界在不该变的时候变**（§2.4 硬判据），把「无根 ∥ 无库」的拆分作为独立决定上抛（§2.7 ①）。

**先例对齐（closest-precedent）**：`findProject(anchor)` = `resolveLedgerRoot(anchor, anchor)`（`docs/core/design/LEDGER.md` §7.1 表 `findProject` 行，实读 `thincoder-core/ledger.mjs:52` 的写法）——「界由调用方指名」在仓内已有此形。本批 5 处**照它对齐，零偏离**。

**公开源核查（survey-evidence）**：查了四档——`docs/core/design/LEDGER.md` §2.1 ∥ §3.8 ∥ §7.1（界与根解析面）、`docs/core/design/MANIFEST.md` §2.5（台账键面）、`docs/core/requirements/ENGINEERING-MODE-V2-SPEC-MANIFEST.md:74`（上溯 = 子目录归自己的项目根）、`test/RTM.md`。

**结论**：相关且已确立 = §3.8 的界判据——它已经是一条完整判据；本批补的是它的**调用方一侧**，不是重造判据。`docs/core/requirements/LIGHT-CHANNEL.md:15/56` 是本轮的**形态依据**（轻通道收尾全链），与判据无关。

### 2.3 受影响面：§1.2 的扫描逐格复核

复核判据：读实档该行 ∥ 该对象跨行。§1 表 7 行 → **真漏 5 个调用点**（3 档），其余为误判与死指针。

| §1.2 行 | 坐标（复核后） | 判 | 依据（实读） |
|---|---|---|---|
| ① | `thincoder-core/ledger-read.mjs` `readProject` `openLedger` | **真漏·已补** | 现行 `:41` = `openLedger(root, { readOnly: true, boundary })` |
| ② | 同档 `readProject` `ledgerQuery` | **真漏·已补** | 现行 `:45` = `ledgerQuery({ cwd: root, boundary })`；`ledger-cmd.mjs:99` 形参收 `boundary`、`:100` 直传 `openLedger` |
| — | 同档 `ledgerExport` | **真漏·已补** | 现行 `:54` = `resolveLedgerRoot(anchor, anchor)`；`:55` / `:60` 两处 `readProject(…, anchor)` |
| ③ | **路径误记**：§1.2 写 `thincoder-core/agent-tools/read-data.mjs:77`，该档**不存在**（`glob` 无此文件）；真实坐标 = `thincoder-cli/src/acp/read-data.mjs:77` | **真漏·已补** | 现行 `:77` = `ledgerCount({ cwd: c.cwd, boundary: ctx.getCwd() })`；此处 `c.cwd` 来自 ACP `params.cwd`（`:33`–`:38` 接受任意字符串），可与进程 cwd 不同 |
| ④ | `thincoder-core/ledger-migrate.mjs:197` | **真漏·已补**（写面） | 现行 = `openLedger(plan.projectRoot, { create: true, boundary: plan.projectRoot })` |
| ⑤ | `agent-tools/batch-lifecycle.mjs:349` | **假阳性** | `:349` 同一行对象内携 `boundary`——`ledgerReanchorBatch({ cwd: root, batch: …, boundary })` |
| ⑥ | `agent-tools/batch-reopen.mjs:111` | **假阳性** | 多行对象：`:111` 起、`boundary` 在其后续行内（§1 按单行 grep 判漏） |
| ⑦ | `r8-ledger-readings.mjs:19` | **死指针** | 仓内无此档；真实文件 = `thincoder-desktop/.thincoder/tmp/r8-ledger-readings.mjs:19`（工程工具临时区探针，非产品码、无调用方义务） |

**补查一处（§1.2 未列）**：`thincoder-cli/src/acp/read-data.mjs:104` `resolveLedgerRoot(cwd)` 无 `boundary` —— 复核判**非漏**：该处 `cwd = ctx.getCwd()`（`:100`），而 v1 ACP 门要求 `params.cwd` == 进程工作目录（`handlers-session.mjs:179`–`:180` 拒文「cwd must equal the process working directory」）⇒ 缺省值与锚同值。

**计数更正（报回，不改 §1）**：§1.2 称「8 处」而表列 7 行；§1.6 标题「4 处调用点」下辖 6 行。**实测 = 5 个调用点 / 3 档**（① ② 各一 + `ledgerExport` 一处推导 + ③ ④），另 ⑥ 行的「补 `boundary`」落在多行对象内、行数不变。

### 2.4 文档一致化（本段已落）

改档 = `docs/core/design/LEDGER.md`（**唯一**）。

| 落点 | 改了什么 | 为什么 |
|---|---|---|
| §3.8 新增「调用方义务（界由调用方指名 · 硬判据）」(`:531`–`:532`) | 写明：目标路径可能 ≠ 进程工作目录的入口**必须传锚**；单一 cwd 面（`handlers-session.mjs:179`）可不传；缺传的后果是**换界**而非报错 | 界判据早已单源，缺的是**调用方一侧的义务**——不写下来就靠人记得，而这次正是没记得 |
| §7.1 导出契约表 11 行签名补 `boundary` (`:863` ∥ `:868`–`:878`) | `ledgerDbPath` · `openLedger` · `ledgerQuery` · `ledgerCount` · `ledgerEvidenceOversize` · `ledgerAdd` · `ledgerUpdate` · `ledgerClose` · 两批量形 · `ledgerBatchRows` · `ledgerReanchorBatch` | 表里签名**漏掉一个既存形参**，等于把「可以不传」写进契约——这是漏传的成因土壤，不只是笔误 |
| §7.1 表后新增一段「`boundary` 是上表每个入口的必答项」(`:888`) | 指回 §3.8 判据（D2 不复写），点明「缺传不报错、只换界」是读面唯一不可见的失败形态 | 让读表的人先看到义务，再看签名 |

**未改**：`docs/core/requirements/**`（需求层 = 主 agent 面）。§3.8 的界判据其需求层指针已存在（`docs/core/requirements/ENGINEERING-MODE-V2-SPEC-MANIFEST.md:74`）；**调用方义务目前只在设计层**——是否需要一条需求层判据，上抛 §2.7 ④。

### 2.5 验收对照（逐条可机判，指回 §2.1 条目）

| # | 指回 | 判据 | 判法 |
|---|---|---|---|
| AC-1 | 1 | 进程 cwd ≠ 目标项目时，读面返回该项目的行而非空账 | 临时项目 + 临时 HOME，`process.cwd()` 在项目外：`ledgerExport({ cwd: proj })` ⇒ `projects.length === 1 ∧ projects[0].rows.length ≥ 1`（§6.1 已录读数：修前 `{"projects":[]}` → 修后 1 项 / 1 行） |
| AC-2 | 1 | 读面越界**仍是空账**，不改成抛 | 目标在界外：`ledgerExport({ cwd: outside })` ⇒ `{"projects":[]}`、退出码 0 |
| AC-3 | 1 | 写面越界**仍抛**（业务门不降级） | `openLedger(x, { create: true, boundary: y })`（y 非 x 之界内）⇒ throw，文案为 `noRootMessage` 单源句 |
| AC-4 | 1 | 三档语法 | `node --check` × `ledger-read.mjs` ∥ `read-data.mjs` ∥ `ledger-migrate.mjs` 全 OK |
| AC-5 | 1 | 台账/批档面回归不破 | `node --test test/integration/{batch-ledger-bind,ledger-close-proof,batch-anchor-create,batch-close-gate,batch-close-token-consume,batch-gates-reanchor,batch-live-batch-lock}.test.mjs` ⇒ 25 pass / 0 fail |
| AC-6 | 2 | 设计档不再把 `boundary` 写成可省 | §7.1 表内含 `boundary` 的行数 = **12**（本批补 11 行 + `resolveLedgerRoot` 原有 1 行）；§3.8 含「调用方义务」小节标题（`node` 行扫实数） |

**集成面诚实读数**：`ledgerExport` 在 `test/` 下**零用例**（`grep ledgerExport test/` 无命中）——AC-1 的读数来自父侧探针（§6.1），不是常驻用例。该缺口按 `test/RTM.md` 是**缺行**（业务可观察 = 跨项目读账），但补它要新建 `test/integration/*.test.mjs`，在本轮写域之外 ⇒ 上抛 §2.7 ②。

### 2.6 关键决策（含被否方案）

- **D1 界不动、义务写成硬判据；缺省不收紧**（否：把 `boundary` 改成必填）。
  理由：收紧缺省**先要定「无界时读面怎么办」**——而那个决定还没做（§2.7 ①）。缺省收紧会把「漏传」从静默空改成当场崩溃，方向对；但崩溃落在读面就与「库不在 = 空账」的合法路径分不开，落在写面则只覆盖写面。**两个决定是同一个决定**，故本批只补已发现的 5 处，缺省收紧排在报明机制定下之后。残留（将来新增调用点再忘传仍静默空）登记在 `#1834`。
- **D2 不拆读面的 `null`**（否：无根改抛 ∥ 改 typed 结果 `{ok, reason}`）。
  理由：拆形态改**所有**读面调用方的契约（`--family` 跳过、`ledgerCount` 三零、三端显示面）——这是新机制，不是补参数；且必须先定「越界要不要出现在返回值里」，否则拆出来的仍是同一个含糊。上抛 §2.7 ①。
- **D3 迁移面取 `boundary: plan.projectRoot`**（界 = 目标自身）。
  理由：迁移的目标即根，界取自身 = 「不再向上找」，与 `findProject(anchor)` 同形（`ledger.mjs:52`）；这不是特例，是同一判据在「目标已是锚」格的自然取值。
- **D4 一致性落在判据，不落在调用点清单**（否：维护一份「哪些调用点必须传」的清单）。
  理由：清单会随调用点增减腐坏，且没人读；判据 + 签名才是调用方真正会看的两处。签名缺参正是本次漏传的土壤，故 §7.1 一并补齐。

### 2.7 §1.13 四项的裁定与后果（均已裁 · 本段无待裁项）

裁定方 = 父侧（§1.13）；本段只记每项对本批写域的后果，不复述理由（D2）。

| # | 事项 | 裁定 | 对本批的后果 |
|---|---|---|---|
| ① | 读面「无根」与「无库」不可分 | **拆**；形取**最小**——返回值加一个报明字段（越界 ∥ 无库 ∥ 库不可读），不动行集形、不动调用点形 | **不在本批**——改返回形要动全部消费面，属新机制，须走设计 → 评审 → 批准。§2.1 第 4 行据此标「不在本批」 |
| ② | `ledgerExport` 跨项目读账零用例 | 另起台账行，不由本批背 | 不在本批。§2.5「集成面诚实读数」照录缺口，不假装已覆盖 |
| ③ | 「调用方必须传 `boundary`」要不要需求层判据 | **要**，本批写；落在承载台账读面契约的需求档 | 设计层已由 §2.4 落（`docs/core/design/LEDGER.md` §3.8 ∥ §7.1）；**需求层 = 父侧笔**，本席不写需求档 |
| ④ | §1 计数与事实有出入 | 已由 §1.12 收正 | 本段不复述；本批计数以 §2.3 逐格复核为准（实读 5 个调用点 / 3 档） |

### 2.8 「界」的定形（本轮落设计档 · 单源分工）

**锚的定义单源 = `docs/core/design/AGENT-LOOP.md` §6.19（会话锚）**：会话锚 = `agent.cwd`，装配期一次性写入、会话期不变；唯一来源 = `assembleAgent({ cwd })` 必填形参，各端 adapter 各自决定取值（CLI = 进程目录 · 桌面 = 当前项目 · ACP / VSC / server = 客户端声明）。该节只答「锚是什么、从哪来」。

**界线的画法单源 = `docs/core/design/LEDGER.md` §3.8（界）**：界恒 = 会话锚，不是进程工作目录；两面两界（取根面的界 = 目标所在盘根，台账面的界 = 会话锚）；先例 = `findProject(anchor) = resolveLedgerRoot(anchor, anchor)`（`thincoder-core/ledger.mjs:52`，见 §3.8 先例条）。该节只答「界线画在哪」。

**分工的理由（D2 不复写）**：两节各答一个问题，写在一处、另一处指路；两处都写就会各说一套。

### 2.9 调用点的三分类（判据面 · 处置面）

判据单源 = `docs/core/design/LEDGER.md` §3.8「三分类」条。

| 类 | 该点回答什么 | 处置 |
|---|---|---|
| **A 端 adapter 取值点** | 「进程在哪」——在这里合法 | 保留 `process.cwd()`；这是它唯一合法的出现处 |
| **B `agent.cwd ?? process.cwd()` 兜底** | 防一个不存在的输入 | 直接删 `?? process.cwd()`，不加替代分支 |
| **C 内部函数 `cwd` / `boundary` 缺省参** | 看调用面有没有 agent 可取 | 有 agent ⇒ 改必传、由调用点给锚；纯 CLI 入口（`args` / `out` / `err` 面）⇒ 可留 |

**扫描覆盖 = 全仓五个包**（core ∥ cli ∥ desktop ∥ vscode ∥ server），外加根 `scripts/` ∥ `bench/`（这两处只出 A 类，见 §2.13）。父侧裁决：`vscode` / `server` 不在扫描之外、同批落——清单的全部价值在于「全仓」；只改三个包，另外两个包立刻成为下一个同类缺陷。

**计数与清单**：本批实测 **95 处代码点 · 23 处注释点**；逐点坐标与三张派工表见 §2.13（A 27 档 31 点 · B 27 档 41 点 · C 18 档 23 点）。

### 2.10 `agent.cwd` 拿不到时的裁决

**裁决 = 不加兜底，也不加「为空则报错」。**

依据：`agent.cwd` 由装配期必填形参保证（`docs/core/design/AGENT-LOOP.md` §6.19「下游义务」条）；`agent.cwd ?? process.cwd()` 防的是一个不存在的输入。删掉兜底后装配真漏了 `cwd`，第一次路径运算当场失败——当场崩比悄悄换界安全，因为兜底把「装配错误」伪装成「用了另一个目录」，而伪装出来的结果长得完全正常。

加一条「为空则报错」不采纳：仍然在假设它会为空（判据 = `docs/core/design/LEDGER.md` §3.8「B 类为什么只删不加」条）。

### 2.11 未覆盖面（如实登记）

- **本笔未经集成测试验证**：改动面（逐点补 `boundary` ∥ 删兜底）在 `test/` 下没有对应用例；在没有用例的面上跑一次绿，只证明「没崩」，不证明「对了」。
- **缺口按 `test/RTM.md` 属缺行**（业务可观察 = 跨项目 / 跨入口的归属与读账）；补它 = 新建用例档，不在本轮写域 ⇒ 另起台账行，不在本档假装已覆盖。

### 2.12 台账 `#1832`（用户令「都由本批背」· 本笔 = 轻通道收尾全链的设计形式化）

**缺陷**：`docs/core/design/LEDGER.md` §5 在册状态段称「本表五行为未落地在册」，与在盘代码相反。

**判据（父侧令）**：逐行读代码核在当前盘，**不以 §3.5 自证**（同档两处互证可能一起错）。

**逐行实读（2026-10-27）**：

| # | 本表行 | 在册状态 | 实读依据 |
|---|---|---|---|
| 1 | `条件字段 resume_when`（§3.4） | **已落地** | DDL `thincoder-core/ledger-db.mjs:187` · 幂等补列 `:265` · `INSERT` `thincoder-core/ledger-cmd.mjs:156`–`:157` · `UPDATE` `thincoder-core/ledger-write-ops.mjs:126`–`:127` · 值非空 `thincoder-core/ledger-tools.mjs:76` / `:119` · 迁移列集 `thincoder-core/ledger-migrate.mjs:20`–`:23` |
| 2 | `evidence 超限读数`（P4） | **已落地** | 常量 `EVIDENCE_SOFT_LIMIT = 300` `thincoder-core/ledger-db.mjs:150` · 判真 `thincoder-core/ledger-cmd.mjs:53` · `query` 逐行 `:111` · `count` 回报 `:133` · 写入无长度闸（只拒全空白 `thincoder-core/ledger-write-ops.mjs:70`） |
| 3 | `出口面`（§3.7） | **已落地**（本节该行契约 = 机判单源 ∥ 三读数；§3.7 ③ 轮界清单不属本行） | `overdueOf` `thincoder-core/ledger-cmd.mjs:80`–`:90` · `query` 逐行 `:111` · `count` `:130` · `scan.overdue` `thincoder-core/ledger.mjs:105` · `warn` `:134` · L2 逐字 `:142` |
| 4 | `触发字段·归批`（§6.2） | **已落地** | 臂① `thincoder-core/ledger-write-ops.mjs:82`–`:84` · 臂② `:85`–`:90` · 调点 `thincoder-core/ledger-cmd.mjs:148`（add）∥ `thincoder-core/ledger-write-ops.mjs:118`（update） |
| 5 | `指针在盘读数`（§7.1 · B） | **已落地** | 判真 `thincoder-core/ledger-cmd.mjs:74` · `query` 逐行 `:111` · `ledgerBatchRows` 逐行 `:277` |

**结论与父侧前提的差**：父侧判「其中两项与代码相反」，实读 = **五行全部已落地**（另三项同属陈旧读数）。三条未核项**不写入档**（见下「报回」）。

**改动**：`docs/core/design/LEDGER.md:743`–`:755`——在册状态段改为「五行均已落地在册」+ 落地批归属保留（#1530 三行 ∥ #1550 两行）+ 逐行实读坐标；原「未落地」表述**删除**（不留痕，D8）。

**未改（父侧边界）**：§3.5 ∥ 其他节 ∥ 表体行。

**报回（均未改档）**：

1. `docs/core/design/LEDGER.md:760`「触发字段」行末「**该半句 = 目标态（未落地在册）**」同属陈旧读数——`unlabeled` 臂在盘（`thincoder-core/ledger-cmd.mjs:87`）。该行属表体、不在本笔边界 ⇒ 父侧裁。
2. `docs/core/design/LEDGER.md:795`–`:798`（§6.1 口径 5）`writeGateFlag`「实现 = 实施轮」：函数在盘 `thincoder-core/ledger-migrate.mjs:82`–`:89` · 基准同一子表达式 `:103` · 解析单点同一函数 `:87` · 调用链 `:178` → `:117` 已顺；**未核** = `resolveDeclaredRef` 内部是否消费 `declaredPublicRoots`（口径 4 消费关系）⇒ **未判**。父侧令「只给坐标、不下判断」，故未写入档。
3. 悬空坐标（读数非判断）：`thincoder-core/ledger-cmd.mjs` 现 **335** 行，`docs/core/design/LEDGER.md:331` / `:989` 仍引 `:421` / `:445`；`thincoder-core/agent-tools/batch-lifecycle.mjs` 现 **354** 行，`:331` / `:989` 仍引 `:503` / `:542` / `:601` ⇒ 越文件尾。落地判词未受影响，坐标需随文件拆分重取（§3.5 属父侧「别动」面）。

**机检**：`doc_check(mode:"gate", docs=["docs/core/design/LEDGER.md"], target="D:\teamcode\thincoder")` ⇒ **PASS**（1 档全清，0 段超长）。

### 2.13 §2.9 的逐点清单（95 处代码点 · 可直接派工）

**扫描读数**（本批实测，全仓 `.mjs` / `.js` / `.ts`，排除 `node_modules` / `dist` / `docs` / `.thincoder`）：**代码 95 处 · 注释 23 处**。

**口径**：95 只数代码点，且补扫了 `vscode` / `server` / 根 `scripts` / `bench`。父侧早先的 66 = **父侧粗扫口径，含注释行**（core 52 代码 + 14 注释，「43 / 7 / 16」按行形分桶）；两个数不可混用。

| 包 | 代码 | 注释 | A | B | C |
|---|---|---|---|---|---|
| `thincoder-core` | 52 | 14 | 6 | 28 | 18 |
| `thincoder-cli` | 19 | 2 | 14 | 2 | 3 |
| `thincoder-desktop` | 2 | 3 | 1 | 1 | 0 |
| `thincoder-vscode` | 8 | 3 | 2 | 5 | 1 |
| `thincoder-server` | 7 | 1 | 1 | 5 | 1 |
| 根 `scripts/` | 2 | 0 | 2 | 0 | 0 |
| `bench/` | 5 | 0 | 5 | 0 | 0 |
| **合计** | **95** | **23** | **31** | **41** | **23** |

**读法**：包 ∥ 文件拼起来即仓内相对坐标（例：`thincoder-core` + `ledger-db.mjs:98` = `thincoder-core/ledger-db.mjs:98`）；行号用 `·` 分隔，一行 = 一个文件。

#### A 类 · 端 adapter 取值点（31 处 · 27 档 · **保留，零改动**）

| 包 | 文件 | 行 |
|---|---|---|
| `thincoder-core` | `ledger-migrate.mjs` | 172 · 292 |
| `thincoder-core` | `ledger-read.mjs` | 71 |
| `thincoder-core` | `session-gc.mjs` | 289 |
| `thincoder-core` | `scripts/check-syntax.mjs` | 39 |
| `thincoder-core` | `session-index-build.mjs` | 25 |
| `thincoder-cli` | `bin/thincoder.mjs` | 44 |
| `thincoder-cli` | `scripts/check-syntax.mjs` | 43 |
| `thincoder-cli` | `scripts/doc-impact.mjs` | 121 |
| `thincoder-cli` | `src/acp.mjs` | 101 |
| `thincoder-cli` | `src/cli/distill-command.mjs` | 67 |
| `thincoder-cli` | `src/cli/make-agent.mjs` | 32 |
| `thincoder-cli` | `src/cli/memory-command.mjs` | 112 |
| `thincoder-cli` | `src/command-interactive.mjs` | 131 · 180 |
| `thincoder-cli` | `src/command-table.mjs` | 40 · 82 |
| `thincoder-cli` | `src/crash-reports.mjs` | 111 |
| `thincoder-cli` | `src/tui/index.mjs` | 224 |
| `thincoder-cli` | `src/tui/key-handler-ctrlc.mjs` | 112 |
| `thincoder-desktop` | `src/main/session-slots.mjs` | 91 |
| `thincoder-vscode` | `src/extension/panel-messages.mjs` | 44 |
| `thincoder-vscode` | `src/extension/session-slots.mjs` | 64 |
| `thincoder-server` | `deploy/sandbox/member-shell/bootstrap.mjs` | 320 |
| 根 `scripts/` | `scripts/api-contract.mjs` | 97 |
| 根 `scripts/` | `scripts/check-pack.mjs` | 90 |
| `bench/` | `check/probe.check.mjs` | 272 · 280 |
| `bench/` | `lib/output.mjs` | 49 |
| `bench/` | `lib/recompute.mjs` | 35 |
| `bench/` | `lib/rejudge.mjs` | 44 |

**判据落地**：`make-agent.mjs:32` = CLI 取值来源（锚在这里诞生）；`panel-messages.mjs:44` = VSC 的（workspace folder）；ACP 取 `params.cwd`。`ledger-migrate:172/292` · `ledger-read:71` · `session-gc:289` · `doc-impact:121` · `api-contract:97` 全是命令行入口（有 `args` 解析 + `out` / `err`）—— 用户没给 `--cwd` 就用当前目录是**语义正确的缺省**，不是兜底。

**非界问题 3 处**（`session-index-build:25` · `desktop/session-slots:91` · `vscode/session-slots:64`）：写成 `dirname(sessionPath(process.cwd()))`，只取 `dirname` ⇒ 取值与 cwd 无关，不动。

#### B 类 · `agent.cwd ?? process.cwd()` 兜底（41 处 · 27 档 · **直接删兜底，不加任何替代分支**）

| 包 | 文件 | 行 |
|---|---|---|
| `thincoder-core` | `agent/write-gate.mjs` | 63 · 158（三元一并删） |
| `thincoder-core` | `agent-tools/bash-async.mjs` | 122 |
| `thincoder-core` | `agent-tools/batch-ledger-bind.mjs` | 104 |
| `thincoder-core` | `agent-tools/batch-lifecycle.mjs` | 249 · 255 · 264 · 285 · 293 |
| `thincoder-core` | `agent-tools/batch.mjs` | 165 · 318 |
| `thincoder-core` | `agent-tools/doc-check.mjs` | 34 |
| `thincoder-core` | `agent-tools/eng.mjs` | 83 |
| `thincoder-core` | `agent-tools/escalate-async.mjs` | 65 · 77 · 88 |
| `thincoder-core` | `agent-tools/manifest.mjs` | 53 |
| `thincoder-core` | `agent-tools/read-history.mjs` | 193 · 224 · 361 |
| `thincoder-core` | `agent-tools/subagent-scheduler.mjs` | 82 |
| `thincoder-core` | `agent-tools/subagent-spawn.mjs` | 200 · 205 |
| `thincoder-core` | `explore-distill.mjs` | 106 |
| `thincoder-core` | `ledger-surface.mjs` | 17 |
| `thincoder-core` | `ledger-tools.mjs` | 30 |
| `thincoder-core` | `team-ledger.mjs` | 30 |
| `thincoder-core` | `traces/trace-store.mjs` | 229 |
| `thincoder-cli` | `src/tui/cmd-eng.mjs` | 45 |
| `thincoder-cli` | `src/tui/cmd-mcp.mjs` | 190 |
| `thincoder-desktop` | `src/main/agent-assemble.mjs` | 97（三元删净） |
| `thincoder-vscode` | `src/extension/panel-chat.mjs` | 178 |
| `thincoder-vscode` | `src/extension/panel-index.mjs` | 70 |
| `thincoder-vscode` | `src/extension/panel-turn-stages.mjs` | 188 · 244 |
| `thincoder-vscode` | `src/memory-tool.mjs` | 64 |
| `thincoder-server` | `src/agent/chat.mjs` | 515 · 549 · 578 |
| `thincoder-server` | `src/agent/chat-env.mjs` | 83 |
| `thincoder-server` | `src/agent/chat-env-tools.mjs` | 146 |

**统一改法**：删净兜底，**不加** `if (!agent.cwd) throw`、不加默认值、不加告警。

**形有两条，删法不同**（实读：`panel-chat.mjs:178` = `const cwd = _cwd() || process.cwd()`；`panel-index.mjs:70` = `const base = cwd || _cwd() || process.cwd()`）：`??` 形与 `||` 形都归 B 类，删的是**末尾那截回落到 `process.cwd()` 的尾巴**，不是整行；`write-gate.mjs:63` / `agent-assemble.mjs:97` 是三元形，三元一并删净。

#### C 类 · 内部函数 `cwd` / `boundary` 缺省参（23 处 · 18 档 · 有 agent 可取 ⇒ 改必传）

| 包 | 文件 | 行 |
|---|---|---|
| `thincoder-core` | `ledger-db.mjs` | 98 · 112 |
| `thincoder-core` | `manifest-discovery.mjs` | 110 |
| `thincoder-core` | `ledger-cmd.mjs` | 80 |
| `thincoder-core` | `ledger-read.mjs` | 52 |
| `thincoder-core` | `ledger-migrate.mjs` | 258 |
| `thincoder-core` | `ledger-variant-notice.mjs` | 38 |
| `thincoder-core` | `agent-tools/batch-gate.mjs` | 137 |
| `thincoder-core` | `agent-tools/batch-paths.mjs` | 29 · 47 · 127 · 145 · 166 |
| `thincoder-core` | `agent-tools/batch-read.mjs` | 23 |
| `thincoder-core` | `agent-tools/review-facts.mjs` | 81 |
| `thincoder-core` | `agent-tools/subagent-actions.mjs` | 248 |
| `thincoder-core` | `agent-tools/subagent-scheduler.mjs` | 54 |
| `thincoder-core` | `memory/memory-tool.mjs` | 52 |
| `thincoder-cli` | `src/cli/make-agent.mjs` | 127（缺省改取 `agent.cwd`） |
| `thincoder-cli` | `src/acp/resource-link.mjs` | 63 |
| `thincoder-cli` | `scripts/doc-impact.mjs` | 108 |
| `thincoder-vscode` | `src/embed-config.mjs` | 109 |
| `thincoder-server` | `src/agent/chat-compact.mjs` | 255 |

#### 同批须同步的注释面 7 行（现文写着「缺省 = `process.cwd()`」，落码后须改「必传」）

`thincoder-core/ledger-db.mjs:94` · `:109` · `:121` · `:125` · `:246` · `thincoder-core/manifest-discovery.mjs:104` · `thincoder-core/agent/live-batch.mjs:53`

**计数**：三表共 **72 档 · 95 点**（A 27 档 31 点 · B 27 档 41 点 · C 18 档 23 点），与上表合计行一致。

**逐点核对**（抽 3 处实读，2026-10-27）：

- `ledger-db.mjs:98` = `const edge = resolve(boundary ?? process.cwd())` ✓
- `batch-lifecycle.mjs` 249 / 255 / 264 / 285 / 293 —— **5 行全命中** ✓
- `panel-turn-stages.mjs:188` = `const cwd = _cwd() || process.cwd()` ✓

**拆表说明**：原清单里 `vscode` / `server` / `cli` 三行合并了多档、行号多于档数，本表按档拆开落（行号逐点实读对上）；其余各档与行号原样照落。

### 2.14 台账 `#1833`（本笔 · 源 = §1.14）

**条目与覆盖**

| # | 条目 | 本批状态 |
|---|---|---|
| 1 | 压缩触发把固定开销（`system + tools`）算进判据 ⇒ 固定开销本身逼近阈值时反复触发、压不出东西、每次白付一次摘要请求并吃掉一次响应 | **覆盖**——触发面加「可达性门」（§2.15） |
| 2 | 测试桩按「第 1 个请求必是对话」识别（`test/integration/anthropic-tool-roundtrip.test.mjs:120`），压缩一插入即误读 | **覆盖**（同批 · 独立验收）：桩改按请求内容分类，故事 1 三行补「零摘要请求」断言（§2.18） |
| 3 | 压缩线数值 / `ASCII_CHARS_PER_TOKEN` / `assertPromptFits` / `enforceContextFit` | **不在本批**——硬边界（§1.14 与本次派工逐条点名） |
| 4 | 需求档口径与本笔的关系（`docs/core/requirements/CONTEXT-COMPACTION.md:47`「不改压缩触发阈值」）∥ `:53` 写 `⌊窗口 × 0.8⌋` 而代码 `thincoder-core/config.mjs:53` 是 `COMPACT_RATIO = 0.6` | **不在本批**——需求层 = 主 agent 写面；已上抛（§2.20 ①②） |

**设计落点（本段已落）**：`docs/core/design/CONTEXT-COMPACTION.md` §6.17 新增块「压缩触发判据（可达性门 · 固定开销不进被判定的一侧）」，位置 = 该节「状态面」条与「守卫」条之间。并入既有节，不新开节（§6.17 已是压缩线 ∥ 守卫的单源）。

### 2.15 判据定形

**一句话**：压缩只在「压完之后 `total` 能落到阈值之下」时触发；压不到线下的压缩一律不触发。

**判据式**（`thincoder-core/context.mjs` `compressIfNeeded`；`extras.force` 全文豁免）：

```text
压 ⟺ usage.total > threshold  ∧  post(plan) ≤ threshold
post(plan) = round((history − middle + note + system + tools) × _tokRatio)
```

- `usage` = `contextUsage(agent, extras)`（`thincoder-core/token-window.mjs:134`）——**现判据的左半逐位不变**。
- `plan` = `splitHistory(history, keepTail, tailBudgetTokens)`——`middle` = 这次会摘掉的那段；`note` = 注记 + 占位（压缩后实际留下的形态）。
- `post` 走 estimated 支：压缩后 `_lastPromptTokens` 必失效（`thincoder-core/context.mjs:126`），与 `total` 的估算支同一 `_tokRatio`，两侧同口径。

**现场验算（§1.14 读数）**：`history=153` · `system+tools=83,564` · `threshold=76,800` ⇒ `post ≈ (153 + 注记 + 83,564) × ratio > 76,800` ⇒ **不触发**，那一发摘要请求不再发出。

**为什么是这个形，而不是另外两条**

- **否 ①「比较时减固定开销」（`history > threshold − overhead`）**：乘 `_tokRatio` 后与现判据代数等价——**它不是修，是改写**；且 `overhead > threshold` 时右端为负、判据恒真，正是本案现场。
- **否 ②「固定开销超某比例即跳过」**：要一个没有现场的魔数；且只堵极端格——`overhead` 落到阈值 0.79 倍时，尾部预算本身仍可能已超过剩余预算，压了等于没压。
- **取 ③ 可达性门**：不引新常数；问的是「压完能不能到线下」这件本来就该问的事。先例就在同节——守卫面早写着「压后仍超说明压缩解不了，再压只是重复付费」，本门是**同一条判断补上触发面这一侧**，零偏离。

**普通档改动面（如实）**：`overhead ≪ threshold` 时 `post ≤ threshold` 通常自动成立，行为同修前；改变的是边角格「越了线但摘掉中段也到不了线下」——修前压、修后不压。该边角正是本门的作用面。

**安全面三道不动，逐条点名**：守卫 `enforceContextFit`（`thincoder-core/agent/run-stages.mjs:158`）仍判 `usage.total > budget.limit` 并强压一次 · 发送面净判（§6.17「发送面净判」，四面 `estPrompt > limit`）零改 · 确定性截断 `shrinkOversized`（`thincoder-core/context-degrade.mjs:52`）零网络、不设门（本门只为「白付一次摘要请求」而设）。

### 2.16 受影响文件（现行行数 · 预计 delta）

| 文件 | 现行 | 预计 | 改什么 |
|---|---|---|---|
| `thincoder-core/context.mjs` | 262 行 | +12~18 | `compressIfNeeded`：阈值早退后加可达性门（先算 `split`，再判 `post`；`split == null` 照走 `shrinkOversized`）。零新 import（`estimateTokens` / `splitHistory` 已在 `:16`） |
| `test/integration/anthropic-tool-roundtrip.test.mjs` | 365 行 | +15~25 | 桩按内容分类（摘要请求 ⇒ 回摘要文本；对话请求 ⇒ 回工具/文本两态）；故事 1 三行各补一条「摘要请求 0」断言 |
| `test/integration/context-overflow-guard.test.mjs` | — | +60~90 | 新增 11-6 · 11-7 两例（§2.17） |
| `test/RTM.md` | — | +2 行 | §11 落 11-6 · 11-7 两行（编号先定，再写用例） |
| `docs/core/design/CONTEXT-COMPACTION.md` | 988 行 | 已落 | §6.17 新块（本段） |

**不动**：`thincoder-core/config.mjs`（阈值算式）· `thincoder-core/agent/run-stages.mjs`（守卫 / 触发点）· `thincoder-core/context-degrade.mjs`（截断面）· `thincoder-core/provider/**`（净判四档）· `thincoder-core/prompts/**`。

### 2.17 案例表（正常 / 边界 / 错误）

| 例 | 输入 | 期望 |
|---|---|---|
| 11-6 正常·固定开销吃掉阈值 | 会话固定开销估算 > 压缩线、`history` 极小（复刻 §1.14 现场） | 压缩事件 **0** · 摘要请求 **0** · 回合请求 1 · 用户拿到答复 · 无 400 |
| 11-7 边界·高开销但中段可摘够 | 开销逼近阈值、`history` 含足量中段使 `post ≤ threshold` | 压缩事件恰 1（`mode:"summary"`）· 摘要请求 1 · 回合请求 ≥2 · 回复引用工具结果 |
| 11-8 边界·`force` 不受门 | 模型主动压缩（`context` 工具）∥ 守卫强压，压后仍超线下 | 压缩仍执行恰 1（门只拦阈值面） |
| 11-9 错误·无中段走截断 | 单条消息超 `OVERSIZE_CONTENT_LIMIT`、无中段可摘 | 走 `shrinkOversized`、体内出现截断标记；门不拦（零网络） |
| 1-1/1-2/1-3 更正 | 桩改按内容分类后 | 三行全绿 + 各断言「摘要请求 0」（本笔的产品修法在桩不改时就应让其转绿） |

### 2.18 测试桩的判定（顺带项 · 判为**在本批**）

**证据**：`test/integration/anthropic-tool-roundtrip.test.mjs:120` = `if (calls.length > 0 && requests.length === 1) return sseReply(res, toolUseEvents(calls))`；同档 `:94` 注释自陈「`calls` = **首个模型请求**派发的工具调用」。

**判为同批的理据**：它是故事 1 三行的夹具，序号假设一破就**把产品红伪装成自己的红**（§1.14 失真链 3–6 步逐条实测）。但**它不能充当「产品已修好」的证据**——所以桩按内容分类，同时故事 1 三行各加一条「摘要请求 0」的业务可观察断言：桩改不改，那条断言都只在产品修法生效时才绿。

**分类判据（给实现）**：请求体末条消息含 `SUMMARIZE_PROMPT`（`thincoder-core/context.mjs:20` 起那段指令）⇒ 摘要请求。不用序号、不用 `logCtx`（请求体里没有）。

### 2.19 验收判据（逐条指回 §2.14 条目 · 机判）

| # | 指回 | 判据 | 判法 |
|---|---|---|---|
| AC-1 | 1 | 固定开销吃掉阈值的会话零压缩、零摘要请求 | `node --test test/integration/context-overflow-guard.test.mjs` 内 11-6 |
| AC-2 | 1 | 中段可摘够时压缩恰 1 且回复引用结果 | 同上 11-7 |
| AC-3 | 1 | `force` 面不被门拦（模型主动 ∥ 守卫强压） | 同上 11-8 ∥ 既有 11-1/11-4a |
| AC-4 | 1 | 无中段仍走确定性截断 | 同上 11-9 |
| AC-5 | 2 | 故事 1 三行绿且各断言摘要请求 0 | `node --test test/integration/anthropic-tool-roundtrip.test.mjs` |
| AC-6 | 1 | 语法 + 设计档字面在位 | `node --check thincoder-core/context.mjs` ∥ 设计 §6.17 含「可达性门」小节 |

**集成面诚实读数**：11-6–11-9 与故事 1 三行为本笔要新增/更正的用例，**现盘上没有**（11-1–11-5 只覆盖守卫面）⇒ 本段是设计，不是已验证。

### 2.20 上抛与登记

> ① **待裁**：需求档 `docs/core/requirements/CONTEXT-COMPACTION.md:47` 的「不改压缩触发阈值」是 F-CC8 那批的批次边界，还是常设规则？本笔**不改阈值数值**，只加触发前的可达性门——若读作常设规则，需父侧改需求层（本笔不写需求档）。
> ② **待裁**：同一需求档 `:53` 写 `auto = 可用窗口与 ⌊窗口 × 0.8⌋ 取小`，代码 `thincoder-core/config.mjs:53` 是 `COMPACT_RATIO = 0.6`（`config.mjs:114` 取小）。同一量两个值，本笔按**代码**设计，两边都未动，须父侧裁单源。
> ③ **知会**：「压到地板仍越窗」档里守卫的 remedy 文案指向 `/compact or prune`（`thincoder-core/agent/run-stages.mjs:180`），而该档压缩已无用（地板由固定开销决定）——属守卫面，本笔边界外，只登记。

### 2.21 三链同源声明

§2.14 条目 1 ↔ 设计 `docs/core/design/CONTEXT-COMPACTION.md` §6.17「压缩触发判据」 ↔ 台账 `#1833`（`trigger = 条件`，`resume_when` 已写明接笔条件）。条目 2 的落点在测试面，未单独开台账行（同一缺陷的夹具面，由 `#1833` 一行承载）。

**单源更正（§2.17）**：案例表的**判据单源** = `docs/core/design/CONTEXT-COMPACTION.md` §6.17「压缩触发判据（可达性门）」内的案例表；§2.17 是本批的派工副本，两处不一致时以设计档为准。此条只定单源，不改任何一条判据。

### 2.22 台账 `#1810`：上下文读数分叉（用户令 2026-10-27 · 本笔不动码）

**条目与覆盖**

| # | 条目 | 本笔状态 |
|---|---|---|
| 1 | 状态行百分比 `historyPercent` 未乘估算校准比 `_tokRatio`，与 `contextUsage` 同量不同尺 | **覆盖**——定形「吃比」（§2.23） |
| 2 | 签名怎么改、六处调用点坐标怎么跟 | **覆盖**——§2.24 / §2.25 |
| 3 | 设计档落点 | **未落**——判据单源在 `docs/core/design/CONTEXT-COMPACTION.md`，本轮 D5 冻结窗内（§2.30 ③） |
| 4 | `contextUsage` 三段裸估算 ∥ `total` 已乘比（同根第二处） | **不在本笔**——另一决定，上抛 §2.30 ① |

### 2.23 定形：吃 —— 理由是量纲，不是「两处数该一致」

**判据一句**：百分比 = **校准后的估算** ÷ 窗口。窗口是服务端真值，估算器已知偏低（`_tokRatio` 下界 1），把未校准的分子放在真值分母上，等于拿两把尺子相除。

现行两处（实读）：

- `thincoder-core/token-window.mjs:219`–`:221` `historyPercent` = `Math.round(estimateTokens(history ?? []) / providerSpec(provider).context * 100)`——**分子零校准**。
- `thincoder-core/token-window.mjs:142`–`:147` `contextUsage`：`const ratio = agent?._tokRatio ?? 1`，估算支 `total = Math.round((historyTokens + overhead) * ratio)`——**已校准**。

**四条依据，逐条可核**：

1. **同一标签同一量**：`historyPercent` 自己的档内注释写着「stats 报出的就是用户看到的那个百分比，不新增第三口径」（`token-window.mjs:216`–`:218`）。同一个数一处乘比、一处不乘，就是第三口径。
2. **判据面用的正是校准值**：压缩触发与守卫判 `usage.total > threshold`，而 `total` 已乘比（`:145`–`:147`）。显示面不乘 ⇒ 用户看着 40%、压缩在 60% 线附近开火——读数越失真越误导。**这条比「两处数对不上」重**。
3. **文档从没把它写成有意的分歧**：校准比的作用面，档内注释只写「`contextUsage` 两支承」（`:169`）；状态行公式那句在 `docs/core/design/CONTEXT-COMPACTION.md:533`，成文早于校准机制入场。
4. **上一批是记账不修，理由为跨端签名，不是判断**：`docs/batches/2026-10-26-context-overflow-absent.md:493`「需跨端签名改动，且不是止血面……登记台账行」；同档 `:1258` 即本行 `#1810`。

**不吃会怎样**：状态行、stats 第 6 行、桌面 `ev:usage`、VSC 面板四处一起偏低，偏低量随模型与文本逐样本漂（`_tokRatio` 池化累计），事后验不出、兜不住。

**边界不变（不要顺手合并）**：`historyPercent`（仅 history）与首行 `total`（含 system + tools）的**分母/分子差额不动**——两口径并排是既立设计（`docs/core/design/CONTEXT-COMPACTION.md:534`），本笔只把「乘不乘比」这一处对齐。

**安全面**：`_tokRatio` 下界 1（`token-window.mjs:181` `Math.max(1, num/den)`，注释自陈「已知偏差方向是估算偏低」）⇒ 读数**只升不降**，不会造出「该压没压」，也不会把占用报高。

### 2.24 签名：比走显参，且不许缺省

都在 `thincoder-core/token-window.mjs`：

| 名 | 签名 | 语义 |
|---|---|---|
| `historyReading(history, provider, ratio)`（新增） | → `{ tokens, pct }` | `tokens = Math.round(estimateTokens(history ?? []) * ratio)`；`pct = Math.round(tokens / providerSpec(provider).context * 100)`——**同一点出两个数** |
| `historyPercent(history, provider, ratio)`（改签名） | → 数 | `historyReading(...).pct` 薄转口；名面与 export 不改，调用方零改名 |
| `tokenRatioOf(agent)`（新增） | → 数 | `agent?._tokRatio ?? 1`——中性值 1 的**唯一**出处（现硬写在 `contextUsage` 内 `:142`） |
| `sampleRatio(sample, provider)`（新增） | → 数 | 槽 `estimateSample` 过校验 ⇒ `Math.max(1, num/den)`，否则 `1`。三条校验与 `restoreTokenSample`（`:202`–`:213` ①②③）**同源共用，不复写第二份** |

**`ratio` 无缺省**（`historyReading` / `historyPercent` 都是）。理由：缺省 1 = 忘传时静默回到未校准读数——正是 `#1834` 刚修掉的「缺省换界」同一失败类：读数看着正常，没人发现。要未校准档就显式写 `1`。

**为什么不学 `contextUsage` 直接收 `agent`**：`sessionReading`（`thincoder-core/session-lifecycle.mjs:412`–`:425`）手里没有 agent，只有槽数据；其读数源 = `data.estimateSample`（同档 `:215` / `:221` 已证该字段在槽里）。收 agent ⇒ 这一格无解。

### 2.25 调用点（六处坐标 · 五个消费面 · 逐格实读）

| # | 坐标 | 现状 | 改法 |
|---|---|---|---|
| ① | `thincoder-core/agent-tools/context.mjs:108` | `historyPercent(agent?.history ?? [], agent?.provider)` | 加 `tokenRatioOf(agent)`；括号里的历史估算数改取同一 `historyReading(...).tokens`，与 `%` 同尺 |
| ② | `thincoder-core/session-lifecycle.mjs:425` | `return historyPercent(line, provider)` | 第三参 = `sampleRatio(data.estimateSample, provider)`——打开态读数与恢复后读数同尺（恢复侧走 `restoreTokenSample`） |
| ③ | `thincoder-desktop/src/main/agent-host.mjs:169`（import `:39`） | `historyPercent(agent?.history ?? [], agent?.provider)` | 加 `tokenRatioOf(agent)`；同帧 `ctxTokens` 取同一调用的 `.tokens`（一个 `ev:usage` 帧不许两把尺） |
| ④ | `thincoder-vscode/src/specs.mjs:95`–`:101` | 端侧自算式，零校准 | 委托核 `historyReading`；`pct: null`（空历史不显示）的门留在本端显示层——现行边界不变 |
| ⑤ | `thincoder-vscode/src/extension/panel-callbacks.mjs:231` | `ctxUsageForHistory(history, p)` | 第三参经 `tokenRatioOf(panel._agent)`（`panel._agent` 同档 `:233` 正在用） |
| ⑥ | `thincoder-cli/src/tui/render-loop.mjs:90` + `status-line.mjs:147` | `estimateTokens(agent.history)` 缓存 + 端侧自算百分比 | 缓存改存 `historyReading(...)` 的 `{ tokens, pct }`；**缓存键加 ratio**——比可在 history 长度不变时变（会话恢复 `restoreTokenSample`、口径版本切换），只按 `len` 会留一次陈旧读数 |

### 2.26 关键决策（含被否方案）

- **D1 吃比**（否：维持现状，只在档里写死「两处有意的差」）。理由 = §2.23 第 2 条：显示面不乘比会在压缩线附近系统性低报；那不是两个口径，是量错。否案只在「分歧确属有意」时成立，而第 3 条证据否掉了这个前提。
- **D2 `ratio` 必传无缺省**（否：`ratio = 1` 缺省）。理由 = §2.24。这是本仓既有判据的同一形（参 `docs/core/design/LEDGER.md` §3.8「调用方义务」）。
- **D3 一个函数出两个数**（否：`tokens` / `pct` 各自算一次）。同屏写「context X% Yk」必须同尺；VSC 现行 `ctxUsageForHistory` 已是「两值单点产出」的形（`thincoder-vscode/src/specs.mjs:92`–`:94` 注释自陈），照它对齐、零偏离。
- **D4 CLI 缓存键含 ratio**（否：只按 `len` 失效）。见 §2.25 ⑥ 两种改比不改长的路径。

### 2.27 先例 · 公开源核查 · 落点

- **closest-precedent**：`contextUsage`（`thincoder-core/token-window.mjs:134`–`:156`）——函数内读 `_tokRatio`（`:142`）并对估算支乘比（`:145`–`:147`），本笔是**对齐它**。**偏离一处，有硬理由**：它收 `agent`，本笔读面收显参 `ratio`——因为 `sessionReading` 无 agent（§2.24 末）。`ctxUsageForHistory` 的「两值单点出」形照抄（D3）。
- **survey-evidence**：查了五处——`docs/core/design/CONTEXT-COMPACTION.md` §6.16.4（`:533` 状态行公式 · `:534` 两口径 · `:538`–`:541` 空历史与先例行）∥ §6.17（校准面，本轮冻结评审中）· `docs/core/design/SESSION.md` §6.24（`:845` 打开态读数公式 = `historyPercent`）· `docs/vsc/design/WEBVIEW.md` §4.6 + `D-W33`（VSC 派生单点）· `docs/desktop/design/IPC.md` `ev:usage` 行（`ctxPct` = 核 `historyPercent` 投影）· `docs/batches/2026-10-26-context-overflow-absent.md` §2（欠账成立处）。
- **结论：判据单源 = `docs/core/design/CONTEXT-COMPACTION.md`**。代码侧四处自指它：档头 `token-window.mjs:2`–`:9`（§6.16.3 / §6.16.4 / §6.16.8）· `:128`（§6.16.4「取自哪里」）· `:141`（§6.3 / §6.17 校准）· `:216`（§6.16.4「与状态行 ctx% 的单源关系」）。
- **该档本轮冻结（D5）⇒ 本笔不写设计档**，形式化落在本段；**解冻后一次落齐四处**（D5 一次落、不留二版）：① `docs/core/design/CONTEXT-COMPACTION.md:533` 公式行改为「估算 × 校准比」；② 同档 §6.17「作用面」清单从「`contextUsage` 两支承」改为「两支承 + 读面 `historyReading`」；③ `docs/vsc/design/WEBVIEW.md` §4.6 / `D-W33` 补第三参 `ratio`；④ `docs/core/design/SESSION.md` §6.24 ④ 补「比取自槽 `estimateSample`」。

### 2.28 验收判据（实现批的判据；本笔不动码）

| # | 判据 | 判法 |
|---|---|---|
| AC-1 | 比生效：同一 `history` / `provider`，`ratio = 1.5` 读数等于 `Math.round(Math.round(est(h)*1.5)/window*100)` 且严格大于 `ratio = 1` 的读数 | 单元用例（实现批新增用例档，`node --test <档>`） |
| AC-2 | 未校准档零回归：`_tokRatio` 缺 ⇒ `historyPercent(h, p, 1)` 与改前逐位相同 | 同一用例档 |
| AC-3 | 「X% Yk」同尺：`pct === Math.round(tokens / window * 100)`，五个显示面（stats 第 6 行 · 打开态读数 · 桌面帧 · VSC 面板 · CLI 状态行）各一例 | 同一用例档 |
| AC-4 | 无第二把尺：§2.25 ①–⑥ 六格不再出现「`estimateTokens` 直接除窗口求百分比」的自算式 | 行扫（`grep` 六格）；该式只许存在于 `historyReading` |
| AC-5 | CLI 缓存不陈旧：`len` 不变而 `ratio` 变 ⇒ 状态行数字随变 | 同一用例档（D4 的还原格） |

**集成面诚实读数**：`test/` 下无状态行百分比用例。`docs/core/design/CONTEXT-COMPACTION.md:533` 所称钉死该口径的 `context-percent-parity.test.mjs`，全仓 glob（`**/context-percent-parity*.mjs`）**零命中**（见 §2.30 ②）；`test/RTM.md` 十四业务故事亦无覆盖状态行读数者 ⇒ 「跨端同尺」这条业务可观察结果无行。补它 = 新建用例档，属实现批写域，本笔只登记、不假装已覆盖。

### 2.29 边界（本笔不做）

- **不动码**（用户边界）：§2.24 / §2.25 / §2.28 是实现批的派工面，不是本轮的改动面。
- **不动 `docs/core/design/CONTEXT-COMPACTION.md`**（D5 冻结窗）。
- **不动校准机制本体**：`_tokRatio` 的采样 / 池化 / 下界 1 / 恢复三条校验，一律零改。
- **不动压缩触发与守卫**（阈值、可达性门、净判）。
- **不合并两口径**：状态行「历史占用」与 stats 首行「全量占用」的分母差额保留。

### 2.30 上抛与登记

> ① **待裁**：`contextUsage` 三段（`system` / `tools` / `history`）裸估算 vs `total` 已乘比 ⇒ 比 ≠ 1 时 `Segments` 之和 ≠ `total`（上一批已登记知会：`docs/batches/2026-10-26-context-overflow-absent.md:1160`）。三条路：(a) 加校准字段专供显示，三段保原值并标注「裸估算」；(b) 三段全乘比，`Segments` 相加 ≈ `total`；(c) 维持现状只加标注。**我倾向 (a)**——诊断面要看估算器原值（#1827 / #1833 那类偏差的证据就在这里），显示面用校准值即可。判据在冻结档 §6.16.4 ⇒ 与本笔的解冻落笔一并裁，本笔不擅落。
> ② **知会（死指针）**：`docs/core/design/CONTEXT-COMPACTION.md:533` 引「两端已由 `context-percent-parity.test.mjs` 钉死」，全仓 glob 零命中 ⇒ 该档解冻时一并删改（本笔冻结窗内不动）。
> ③ **知会**：设计档落点被冻结 ⇒ **本笔未写设计档**，形式化只在 §2；解冻后按 §2.27 四处一次落齐。**未落不等于已落**，收口时按此判。

### 2.31 评审轮 1 逐条落笔（10 条 · 2026-10-27）

评审 = §3 轮次 1（`VERDICT: changes-required`，🔴2 / 🟡6 / 🔵2）。本段 = 逐条处置；未在本段的见「非设计席」行。

| # | 处置 | 落点（`docs/core/design/CONTEXT-COMPACTION.md`） |
|---|---|---|
| 1 🔴 | 已补「集成测试设计（起点 = `test/RTM.md` 故事 11）」——11-1–11-5 逐行判失效 / 冗余 / 缺行，缺行 11-6–11-9 已定号 | `:826`–`:850` |
| 2 🔴 | 触发判据收敛单源：§6.2 判定对象行改指 §6.17（越阈 = 必要非充分）；§6.10 #1（行为契约）写全三合取项；§6.4 D-T4 补「触发面以 §6.17 为准」 | `:59` · `:232` · `:178` |
| 3 🟡 | `note` 定值 = `SUMMARY_TOKEN_ESTIMATE = 1000`（常量单源 `thincoder-core/token-window.mjs:43`）+ 注记前缀 / 占位句；残余方向（摘要超 1K ⇒ `post` 低估、不误拦）随条登记 | `:794`–`:795` |
| 4 🟡 | 受影响文件表 `context.mjs` 行：`结构不变` → `预计 +12~18` + 改动要点；`token-window.mjs` 行补本批 +0（常量加 `export`，该档逐声明导出，`:224` 同形） | `:615` · `:635` |
| 5 🟡 | `mode:"summary"` 给三问答案（既有 `thincoder-core/context.mjs:228` · 逐字值 · 消费方 `onCompress`）；「回合请求 ≥2」改可数口径「恰 1（`stage` 缺省）」 | `:822` |
| 9 🔵 | 「零偏离」→「偏离一处，理由随行」：事后抛 ∥ 事前判，位形不同、判断同条，且事后那一抛必须留 | `:809`–`:811` |
| 10 🔵 | 本门节内补「勘察证据行（本门 · 本批实取）」：查过 §6.4④ ∥ §6.5 ∥ §6.9 D13 ∥ §6.17 守卫条与 §6.17.1 链三 ∥ `test/RTM.md` 故事 11；`publicRepos` 空表 | `:779` |
| 6 / 7 / 8 🟡 | **非设计席**——需求档 `docs/core/requirements/CONTEXT-COMPACTION.md`（`messages`↔`prompt` · 预留 absent 支 · 40% 边界 · 门的条目）= 主 agent 写面 | — |

**同批落的外部面（设计席 · RTM 编号先行）**：`test/RTM.md` 故事 11 增 11-6 · 11-7 · 11-8 · 11-9 四行（`:134`–`:137`），编号与案例表同号；`test('11-N …')` 标题由实现批按号写。

**对 §2.16 的两处收正**（读数为实读，2026-10-27）：

| 原写 | 实况 |
|---|---|
| `test/RTM.md` 预计 +2 行 | **+4 行**（11-6–11-9 四例，非两例） |
| `thincoder-core/context.mjs` 现行 262 行 | **261 行**（`wc -l` 口径；262 = 按换行切分的段数，含末尾空段）——档 §6.16.9 原读数 261 成立，未改 |

**未落**：`docs/core/requirements/**`（条目 6/7/8）；`#1810` 的解冻四处（§2.27）与本笔无重叠——本轮只动 `docs/core/design/CONTEXT-COMPACTION.md` 的 §6.2 / §6.4 / §6.10 / §6.16.9 / §6.17 五处，`§6.16.4`（`:533` 状态行公式）与 §6.17「校准面」清单**零改**，与那四处不撞。

### 2.32 评审轮 2 逐条落笔（8 条 · 2026-10-27）

评审 = §3 轮次 2（`VERDICT: changes-required`，🔴1 / 🟡4 / 🔵3）。本轮改面 = `docs/core/design/CONTEXT-COMPACTION.md` + `test/RTM.md`（+ 本段）。

| # | 处置 | 落点 |
|---|---|---|
| 1 🔴 | **非设计席**——需求档 §2.1「可用窗口」半窗退化支 = 主 agent 写面，父侧本轮已落（T01 256K/256K → 128,000 · T05 → 600,000 · T02 → 124,928）。设计档表值本就按 `usableWindow`，零改 | — |
| 2 🟡 | 受影响文件表增一行 `test/integration/context-overflow-guard.test.mjs`（现况 278 · Δ 预计 +4 例 · 结构不变）；表后加「本批验收跑法（定向 · 不套跑）」条，点名 `node --test` 两档 | `docs/core/design/CONTEXT-COMPACTION.md:643` ∥ `:646` |
| 3 🟡 | 11-8 回指改指需求档 §2.1 **F-CC2**（模型主动压缩携要求 = `force` 面的业务面）；11-9 回指补「本条只守门不误拦降级路，无独立需求条目」；RTM 11-8 / 11-9 的「异常」列清为 `—`，回指统一留在设计节缺行表 | 设计 `:849` ∥ `:850`；`test/RTM.md:136` ∥ `:137` |
| 4 🟡 | §6.16.2「阈值面语义零改」改为：`force` 跳过阈值面的**全部**早退判据——`total <= threshold` 与可达性门 `post > threshold` 两条，与 §6.17「`force` 全文豁免」逐字对齐 | 设计 `:468` |
| 5 🟡 | RTM 故事 11 面同步：目的行补本门业务结果（不为无净减的摘要白付请求、用户照常拿到答复）；节注补「三态（行序）」行（11-1–11-9 逐行）；需求回指扩到需求档 §2.1（60% ∥ 门 ∥ F-CC2）∥ 台账 `#1833`；11-8 / 11-9 的「怎么做」各补用户进入点 | `test/RTM.md:123` ∥ `:124` ∥ `:136` ∥ `:137` |
| 6 🔵 | 「现 11-1–11-5 五行」→「六行——含 11-4a ∥ 11-4b」；「这五行」一并收正；冗余判定条保留「五行」（判表五行 / 六例，11-4a ∥ 11-4b 同占自适应面） | 设计 `:829` ∥ `:831` ∥ `:841` ∥ `:852` |
| 7 🔵 | **未落（本轮派工之外）**——表内已声明「收官一律以实读为准」；本轮新写数字一律实读（见下读数列） | — |
| 8 🔵 | **非设计席**——需求档 `:47` 边界句 = 主 agent 写面 | — |

**读数为实读（2026-10-27 本轮新测）**：`test/integration/context-overflow-guard.test.mjs` **278 行**（设计档原写 279，随本轮改正）· `test/integration/anthropic-tool-roundtrip.test.mjs` **364 行** · `thincoder-core/context.mjs` **261 行**（与 §6.16.9 现行读数一致）。

**顺手收正（落在 #5 的改面内）**：

1. 故事 11 原「需求回指 = F-LX4 的上下文面（本批 §2 R1–R4）」指错——`F-LX4` 实为**核销机检**（`docs/core/requirements/ENGINEERING-MODE-V2-SPEC-LEDGER.md:49`），与上下文面无关；且「本批 §2 R1–R4」是批档指针，状态档不回指批档。随需求回指改写一并删除。
2. 11-6 / 11-7 的「异常」列原带一段 回指 尾巴（与设计节缺行表重复，D2 两处现役）——只留「缺口来源 = 台账 `#1833`」，回指统一在设计节缺行表。全节四行（11-6–11-9）由此同形。

**未落**：`docs/core/requirements/**`（条目 1 ∥ 8）——主 agent 写面；代码面零改（本笔不动码）。

### 2.33 收尾全链补正：`boundary` 缺省的「已删」误述（2026-10-27 · 本段）

**症状**：`docs/core/design/LEDGER.md` 四处把 `boundary` 的缺省写成**已消失**——`:523` ∥ `:591` ∥ `:594` ∥ `:927` 原写「必传无缺省（C 类）」「无缺省后，漏传即当场失败」「缺参当场失败」。

**实读（本席 2026-10-27）**：缺省仍在盘。

- `thincoder-core/manifest-discovery.mjs:110` = `const edge = resolve(boundary ?? process.cwd())`；同档 `:104` = `@param {string} [boundary] 上溯上界（缺省 → 进程 cwd）`
- `thincoder-core/ledger-db.mjs:98` = `const edge = resolve(boundary ?? process.cwd())`；同档 `:94` = `@param {string} [boundary] 上溯上界（会话锚；缺省 = process.cwd()）`

**为什么是缺陷**：那四处断言的是**代码行为**（漏传会当场失败）。若其为真，§1.7 的残留（「将来新增调用点忘传仍静默空」）与 §2.6 D1 的裁定前提都不成立；且它给读档的人一个**虚假的防线**——正好是本批缺陷的成因形态（读面缺省把「越界」渲染成「没有台账」）。

**改法**：四处改为三句并列——契约面义务（调用方必须指名）· 代码侧现状（缺省仍在 ⇒ 漏传不报错、只换界）· 删除的前置与残留（排在「无界报明」定形之后，台账 `#1834`）。判据不新造：§1.7 的裁定即判据，本段只把误述拉回它。

**未改**：代码与代码注释（缺省未收紧 = §1.7 裁定，本批不动码）· §2.13 C 类清单（`ledger-db.mjs:98 · 112` 等仍是将来批次的派工面）。

**顺带读数（评审轮 2 终局判点关闭于需求面）**：`docs/core/requirements/CONTEXT-COMPACTION.md:55`「预留 ≥ 窗口时退到 `⌊窗口 / 2⌋`」· `:56`「预留 ≥ 窗口时半窗退化接管，线 = `⌊窗口 / 2⌋`（不再降）」· `:58` 判定句①「预留 ≥ 窗口的档 = `⌊窗口 / 2⌋`（半窗退化）」——该轮点名的「需求档与设计档在 T01 档相反」在需求面已不复存在。

### 2.34 评审轮 4 逐条落笔（10 条 · 2026-10-27）

评审 = §3 轮次 4（`VERDICT: changes-required`，🔴2 / 🟡6 / 🔵2）。对象 = `docs/core/design/AGENT-LOOP.md` §6.5① 空响应重试预算的复位判据（含 §6.2 resume 保留集 · §5 受影响文件表 · §7 D-AL28/D-AL29）。本段改面 = `docs/core/design/AGENT-LOOP.md` + `test/RTM.md`（代码零改）。

#### 坐标复核（本席逐条实读 · 2026-10-27）

**口径**：`node` 读 utf8 逐行取号（1 基）；`wc -l` = `\n` 计数。**`Get-Content` 取号比 `node` 小 1**（BOM / 编码），本轮以 `node` 为准。

| 坐标 | 改前档内字面 | 实读 | 处置 |
|---|---|---|---|
| 判空句 | `completion.mjs:32` | `completion.mjs:32` | 档内已对，保留 |
| 计数递增 | `completion.mjs:40` | `completion.mjs:40` | 档内已对，保留 |
| `handleCompletion` 调用点 | `turn-loop.mjs:227` | `turn-loop.mjs:228` | **已改** |
| 取响应处 | `turn-loop.mjs:153` | `turn-loop.mjs:153` | 已对，不改 |
| 同轮两次 `callModelTurn` | `:57` ∥ `:70` | `:57` ∥ `:70` | 已对，不改 |
| `chat-call` 错误透传 | `chat-call.mjs:4`（注释行） | `chat-call.mjs:64`（`if (!healed) throw e`） | **已改** |
| per-run 复位 | `run-start.mjs:134` | `run-start.mjs:134` | 已对，不改 |
| `if (!resume)` 门 | 本轮新写 | `run-start.mjs:109` | 已落 |
| `_zeroWriteStreak` 复位 | 本轮新写 | `run-start.mjs:129` | 已落 |
| VSC 复位面 | `agent-state.mjs:37` | `:37`（`resetRunState` 函数头 `:27`） | 已补函数头标注 |
| VSC 字段初值 | `setup.mjs:58` | `setup.mjs:58` | 已对，保留 |
| VSC 链首段门 | 本轮新写 | `panel-turn-loop.mjs:214`（`if (!agent)`） | 已落 |
| 核字段初值 | `agent.mjs:78` | `agent.mjs:78` | 已对，保留 |
| 行数（`wc -l`） | 159 / 310 / 159 / 168 / 322 | 同左 | 全对，不改 |

**与父侧口径的差（报回）**：父侧称「六成对不上盘」；实读 = **档内 13 处坐标仅 2 处偏离**（`turn-loop.mjs:227`→`:228`、`chat-call.mjs:4`→`:64`）。

父侧的替代值 5 处与实读不符：`completion.mjs:38` / `:46`（实为 `:32` / `:40`）· `setup.mjs:72`（实 `:58`）· `agent.mjs:98`（实 `:78`）· `run-start.mjs:159`（实 `:134`）· 并称 `completion.mjs` 为 159 行时的行号体系与其自身取号矛盾。**判据：坐标以 utf8 逐行实读为准**。

#### 逐条处置

| # | 处置 | 落点 |
|---|---|---|
| 1 🔴 | **取方案①（消互斥）**：判据抽成具名导出谓词 `isSubstantiveResponse(response)`，定义在 `completion.mjs` 判空句之旁；`completion.mjs` 预计 `0` → `≤+14`、档内「逐字不动」→「判空面语义零变」；`turn-loop.mjs` 写明 `:14` 的 import 增补同一符号（同档已 import ⇒ 无新依赖档）。「零变更 ∧ 零新 import ∧ 判据单源」三条不再互相排除 | 设计 §5 表 · §6.5①「判据单源 = 具名谓词」条 |
| 2 🔴 | 补「集成测试设计（起点 = `test/RTM.md`）」块：差量逐条给（既有行不破 · 无冗余 · 缺行 15-1–15-3），四件齐（组件间交互 / 业务结果 / 用户进入点 / 回指）；编号先落 RTM 再用同号写 `test('15-N …')` | 设计 §6.5「集成测试设计」块 · `test/RTM.md` 故事 15（三行） |
| 3 🟡 | VSC 行两坐标标签改正（`:58` = 字段初值 ∥ `:37` = `resetRunState` 内、函数头 `:27`）；「等价」改写成结构句 + **S2 装配对位义务**（核 `if (!resume)` 门 ∥ VSC `panel-turn-loop.mjs:214` 的 `if (!agent)` 门） | 设计 §5 表 VSC 行 · 同节「VSC 续跑不清零靠结构」三条 |
| 4 🟡 | 用词单义化（轮 = 回合环一次迭代；run / 链 / 段 = 一次 `runAgent` 及续跑段）；现状改正为「每 run 链起点清零、run 内跨轮累计」并给实读坐标；「每轮 2 次」→「本 run 累计 2 次」；D-AL28 同步收正 | 设计 §6.5①「用词」「现状与目标的差」「代价」条 · §7 D-AL28 |
| 5 🟡 | 补「现场」条：用户报告原文 + 可复现序列（空 → 正文 → 空；修前第二次空即抛）+ 续跑侧证 | 设计 §6.5①「现场」条 |
| 6 🟡 | 验收给宿主档与命令（`test/integration/empty-response-retry.test.mjs` · `node --test …`）；§5 表增该档行（0 → +90~120） | 设计 §5 表新增行 · §6.5①「验收」条 |
| 7 🟡 | 补先例（最近 · 同级同形）：`_zeroWriteStreak` 族（`run-start.mjs:129` 在 `:109` 门内）沿「链起点复位 / 续跑不清零」；偏离一处（清零点在环内取响应处）理由随行 | 设计 §6.5①「先例」条 |
| 8 🟡 | 补勘察证据行：`test/RTM.md` ∥ `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.31.8 ∥ 本档 §6.2 的 per-run 复位清单与 resume 保留集；外部公开源未查（理由随行） | 设计 §6.5①「勘察证据」条 |
| 9 🔵 | **未落（边界外）**——`docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.31.8 补指针 + 校正 `completion.mjs:15`→`:16`：父侧边界只给 `docs/core/design/AGENT-LOOP.md` + `test/RTM.md` | — |
| 10 🔵 | `turn-loop.mjs` 预计列 `+5~8` → `≤+8` | 设计 §5 表 turn-loop 行 |

#### 上抛与登记

> ① **[上抛·待裁]** 需求层无空响应预算条目：`docs/core/requirements/AGENT-LOOP.md:22` 只在「主循环归一」派生行里并列提到「空响应重试」，无独立条目、无判定句。本笔判据只在设计层 §6.5①；需求层补不补由父侧裁（需求档 = 主 agent 写面）。
> ② **[上抛·知会]** 坐标口径：`Get-Content` 取号比 `node` utf8 实读小 1；`wc -l` = `\n` 计数。本轮全部坐标按 `node` 实读，后续核坐标请用同一口径。
> ③ **[上抛·知会]** 评审 #9 未落：改面在 `docs/core/design/AGENT-LOOP-ASYNC-POOL.md`，父侧边界未含该档 ⇒ 需父侧解界或另批。

**机检**：`doc_check(mode:"gate", docs=["docs/core/design/AGENT-LOOP.md","test/RTM.md"], target="D:\\teamcode\\thincoder")` ⇒ **PASS**（2 档全清，0 段超长）。

### 2.35 收尾收正：指针形态 + 受影响文件表实读（2026-10-27 · 本段）

**① 指针形态（批档全档）**

裸档名锚 22 条 → 仓根相对全路径：`docs/core/design/AGENT-LOOP.md` · `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` · `docs/core/design/CONTEXT-COMPACTION.md` · `docs/core/design/LEDGER.md` · `test/RTM.md`。

读数：本档 `doc_check` **24 条命中（锚 22 · 长段 2）→ 0 条**。

两处长段按句界拆段、逐字未改：§2.34「与父侧口径的差」拆 2 段 · §3 轮次 4「已核事实」拆 3 段。

**② 受影响文件表实读收正**（表在 `docs/core/design/CONTEXT-COMPACTION.md` §6.16.9）

| 行 | 原写 | 实读 |
|---|---|---|
| `thincoder-core/context.mjs` | 261 · 预计 +12~18 | **292 · +31** |
| `test/integration/context-overflow-guard.test.mjs` | 278 · 预计 +4 例（结构不变） | **423 · +145（结构已变：新增夹具族）** |
| `test/integration/anthropic-tool-roundtrip.test.mjs` | **漏列** | **407 · +43**（本段补行） |
| `thincoder-core/token-window.mjs` | 247 · 本批 +0 | 247 · +0（复核不变） |

同格「零新 import」收正为「零新依赖档——`:16` 既有 import 行增补 `SUMMARY_TOKEN_ESTIMATE`」（实读 `thincoder-core/context.mjs:16`）。该格原写与实读相反，同属本轮收正面。

**③ 覆盖面收正**：`docs/core/design/CONTEXT-COMPACTION.md:853` 原称 11-6–11-9 档上无用例（278 行只到 11-4b）——与本轮实读相反：423 行内含 11-6–11-9，`node --test test/integration/context-overflow-guard.test.mjs` **exit 0**。⇒ 改为「已有对应用例」，只留真未覆盖的那一格（`_tokRatio` 抬升后门更早生效，无现场读数）。

**④ 判据**：预测偏差本身不是错，不回头收正才是——该表是别人估规模、判拆分用的。

**⑤ 报回（父侧裁 · 边界）**：本轮派工边界给的档是 `docs/core/design/AGENT-LOOP.md`，而受影响文件表实际在 `docs/core/design/CONTEXT-COMPACTION.md`（`docs/core/design/AGENT-LOOP.md` §5 那张表是空响应面的 `completion.mjs` / `turn-loop.mjs` / `run-start.mjs`）。已按表所在档落，边界口径请父侧确认。

**⑥ 自报越段**：22 条锚里 **19 条在 §3 轮次 4**（评审子代理段），仅 3 条在 §2.34。§3 处只做裸档名→全路径，零字面改动；按「一段一作者」本不该由本席落——若父侧判越界，回退那 19 条重落即可。

### 2.36 收正：`boundary` 缺省「仍在」的误述 —— 缺省已删后的倒回（2026-10-27 · 本段）

**触发**：`#1834` 后半截（§5.6）把 B 类 41 处 + C 类 23 处全落完，`boundary` 的代码缺省真删了；§2.33 当时写的「缺省仍在盘」随之描述一个不存在的世界。

**实读（本席逐行核 · 2026-10-27）**：

- `thincoder-core/ledger-db.mjs:98` = `const edge = resolve(boundary)`（`resolveLedgerRoot`）· `:112` 同形（`noRootMessage`）· `:247` `openLedger` 形参收 `boundary`、`:252` 直传
- `thincoder-core/manifest-discovery.mjs:110` = `const edge = resolve(boundary)`（`owningProject`）

**失败形态（本席实跑，非转述）**：`resolveLedgerRoot(<cwd>)` 与 `openLedger(<cwd>, { readOnly: true })` 缺 `boundary` ⇒ `TypeError: The "paths[0]" argument must be of type string. Received undefined`。

**改面 = `docs/core/design/LEDGER.md`（唯一档；代码零改——`#46` 已交付）**：

| 位置 | 改前 | 改后 |
|---|---|---|
| `§3.8` 依据①（`:523`） | 「代码侧缺省尚未删——`manifest-discovery.mjs:110` 仍写 `boundary ?? process.cwd()`，删除排在「无界时读面怎么办」定形之后」 | 「代码侧已无缺省——`:110` 与 `ledger-db.mjs:98` 均写 `const edge = resolve(boundary)`，漏传当场失败」 |
| `§3.8` 硬判据第 1 条（`:534`）**【扫描另发现】** | 「台账读面**因此**把「越界」渲染成「这个项目没有台账」」（现在时不成立） | 「读面缺省**在盘时**正因此把…」+「该缺省已删（§7.1 末条）」 |
| `§3.8` 入口表 `owningProject` 行（`:591`） | 「代码侧缺省未删（`:110` 仍 `boundary ?? process.cwd()`，残留见 §7.1 末条）」 | 「代码侧 `:110` = `const edge = resolve(boundary)`，缺省已删」 |
| `§3.8` 入口表 `resolveLedgerRoot` 行（`:594`） | 同上（`:98`，残留见 §7.1 末条） | 同上（`:98`） |
| `§3.8` 无根契约·写面（`:613`）**【扫描另发现】** | 「`<界>` 由调用方给（…；**代码缺省 = `process.cwd()`**——进程锚调用面两者同一）」 | 「`<界>` 恒由调用方给——`boundary` 无缺省（`:112` = `resolve(boundary)`），缺参时先于消息构造失败」 |
| `§7.1` 末段（`:927`–`:933`） | 「这是**契约面**的义务，**不是代码侧的机械保证**：…现在仍写 `boundary ?? process.cwd()`，故漏传不报错，只换界——越界被渲染成「这个项目没有台账」…靠调用方遵守」 | 「代码侧**已是机械保证**：…都写 `const edge = resolve(boundary)`，缺省已删——漏传当场失败」+「失败形态是原生 `TypeError`，不是业务可读报因（要报因就得给缺参加分支，与「B 类只删不加」相抵）」+「**越界仍返回空账**——这一条没变」 |

**判据**：契约面义务不动（`boundary` 必传）；换的是**后果**——「漏传不报错、只换界」→「漏传当场 `TypeError`」。「越界仍返回空账」逐字保留（`#46` ④ 读数：`ledgerExport({cwd:outside})` ⇒ `{"projects":[]}`、零抛）。

**行扫（本席全档）**：改后全档**零命中**「缺省仍在 ∥ 缺省未删 ∥ 只换界 ∥ 代码缺省 = `process.cwd()` ∥ 靠调用方遵守」，`boundary ?? process.cwd()` 字面无残留。仍在的 `process.cwd()` 三处均不属此缺陷：`§3.8` 依据②（`:525`）与案例表 6-4（`:702`）是**反证假设**（「界取 `process.cwd()` 时该格必红」），`§3.8` 硬判据第 2 条（`:536`–`:538`）讲的是 `process.cwd()` 是什么、以及 A 类取值点。

**机检**：`doc_check(mode:"gate", docs=["docs/core/design/LEDGER.md"])` ⇒ **PASS**（1 档，0 段超长）。

### 2.37 评审轮 6 逐条落笔（8 条 · 2026-10-27）

评审 = §3 轮次 5（`VERDICT: changes-required`，🔴1 / 🟡4 / 🔵3）。对象 = `docs/core/design/AGENT-LOOP.md` §6.5① + `test/RTM.md` 故事 15。代码零改（`#41` / `#46` 已交付）。

| # | 处置 | 落点 |
|---|---|---|
| 1 🔴 | 现场条重写：「点 retry」= **重发一条消息**（新 run，`resume:false`）走 `run-start.mjs:109` 的 `if (!resume)` 门内 `:134` 置 0；`resume` 续跑**不**清零。「续跑清零」这个侧证整句删除——它不成立，且与 `:271` 保留集相反（实读 `run-start.mjs:109` = `if (!resume) {`、`:134` 在门内） | `docs/core/design/AGENT-LOOP.md:392` |
| 2 🟡 | 15-1 收成**单 run 形**（空 → 带正文且带工具调用 → 空 → 正文）；补两条构造约束与读点。**取舍理由**：双 run 形的第二段起手复位（`run-start.mjs:134`）修前就存在 ⇒ 双 run 形修前修后同绿、测不到本笔；单 run 形把可观察量压在唯一清零点（`turn-loop.mjs:153` 之后）与唯一判空处（`completion.mjs:32`）之间 | 设计 `:406` · `:410` · `:412`；`test/RTM.md:186` |
| 3 🟡 | 15-3 改成 空 → 工具 → 空 → 空 → 正文：修前工具轮不清零、第 3 次空即抛；修后中间轮回 0、两空各计 1 / 2 后成功 ⇒「不抛」本身成为判别点 | 设计 `:408`；`test/RTM.md:188` |
| 4 🟡 | 验收宿主改 = 本批批内单测档，命令 `node --test docs/batches/<本批档名>.test.mjs`，四组断言（谓词三形 · 取响应处复位 · 续跑不清零 · 三连空抛）；受影响文件表增该档行（0 → +60~90）；集成三行移收口行报告 | 设计 `:192` · `:395` |
| 5 🟡 | 现场序列改中间轮带工具调用（空 → 带正文+工具 → 空 → 空），并写明修前是**第 3 次**空才抛（1 → 2 → 抛）——原写「第二次空当场抛」与 `completion.mjs:39` 的 `retries < MAX_EMPTY_RETRIES` 不符 | 设计 `:392` |
| 6 🔵 | 「七态」→「三态」 | `test/RTM.md:182` |
| 7 🔵 | 「故事 11 六行（`:128`–`:132`）」→「六行（`:128`–`:133`，含 `11-5`）」 | 设计 `:400` |
| 8 🔵 | 补既有构件三问显式形：existing 无（判空只有 `completion.mjs:32` 内联式）· none found 仓内零 `isSubstantive` 命中 · consumers 两处 | 设计 `:384` |

**#4 的落点与派工给的不一样（理由随行）**：派工举例 `thincoder-core/test/empty-response-reset.test.mjs`，而该位置在本仓是被判**错位**的——`docs/core/design/TESTING.md:508` SC-1「核 = 零目标集合，任何 `*.test.mjs` 都是错位」。

单元测试档住 `docs/batches/`、`node --test <档>` 直达（`:43`）；收口前置门按「同目录最长批档名前缀」认档（`thincoder-core/agent-tools/batch-unit-test-gate.mjs:8`–`:11`）。

故按本仓形态落 `docs/batches/<本批档名>.test.mjs`——具体档名属一次性内容，由实施批按批档名定，设计档只写形态。

**行扫（本席全档）**：`docs/core/design/AGENT-LOOP.md` 零命中「续跑清零 ∥ 续跑回到链起点 ∥ 三条断言 ∥ `空 → 正文 → 空 → 正文` ∥ `:128`–`:132`」；`test/RTM.md` 故事 15 节零命中「七态」。

**机检**：`doc_check(mode:"gate", docs=["docs/core/design/AGENT-LOOP.md","test/RTM.md","docs/batches/2026-10-27-ledger-boundary-fix.md"], target="D:\teamcode\thincoder")` ⇒ **PASS**（3 档全清，0 段超长）。

**报回（本段未擅改的判据面）**：

> ① **[上抛·待裁]** §1.15 的重开理由写「重开补录轮次 5（**pass**）」，而盘上 §3 轮次 5 = `VERDICT: changes-required`（8 条）。两处对同一轮次的结论相反；§1 = 主 agent 写面、§3 = 评审子代理写面，本席不擅改。读到那句的人可能以为这一轮已放行。
> ② **[上抛·知会]** 本段顺带修了批档 **5 处裸档名锚**（只改形式、零字面改动）：`:1015`（§3 标题）· `:1045` / `:1046` / `:1047`（§4 表三行）· `:1286`（§6 一条）。改因 = 收口文档门 REFUSED（锚 5 条）而该门是交付前置；按「一段一作者」这 5 处本不属本段，若父侧判越界，回退这 5 处即可（改为仓库相对全路径：`docs/core/design/AGENT-LOOP.md` · `docs/core/design/CONTEXT-COMPACTION.md` · `docs/core/requirements/CONTEXT-COMPACTION.md` · `docs/core/design/DOC-DISCIPLINE.md`）。

### 2.38 评审轮 7 两条残留落地（2026-10-27 · 本段）

评审 = §3 轮次 6（`VERDICT: pass`，🔴 0）。两条残留 = 评审自己标注的「修带来的」项，非新判据。边界 = 只改 `docs/core/design/AGENT-LOOP.md`，代码零改、`test/RTM.md` 零改。

| # | 处置 | 落点 | 改前 → 改后 |
|---|---|---|---|
| ① 🟡 | 「三行断言与本节「验收」同源」指空——验收已改成单元四断言，装的不再是集成三行的断言 | `docs/core/design/AGENT-LOOP.md:414` | 「**用例档** = `test/integration/empty-response-retry.test.mjs`；三行断言与本节「验收」同源（D2 不复写断言细节）。」→「**用例档** = `test/integration/empty-response-retry.test.mjs`；三行断言住在 `15-1`–`15-3` 表的「断言到的业务结果」列与 `test/RTM.md` 故事 15（`15-1`–`15-3`）（D2 不复写断言细节）。」 |
| ② 🔵 | 「现场」序列列四步，结论要第五步（正文）——与 `:408` ∥ RTM `15-3` 的五步形差一步 | `docs/core/design/AGENT-LOOP.md:392` | 「可复现序列（单 run）= 空 → 带正文且带工具调用 → 空 → 空：」→「可复现序列（单 run）= 空 → 带正文且带工具调用 → 空 → 空 → 正文：」 |

**两处回指已实读核过（不靠记忆）**：

- 表列存在：`docs/core/design/AGENT-LOOP.md:404` 列头 = `| 行 | 所评的组件间交互 | 断言到的业务结果 | 用户进入点 | 回指 |`，`15-1`–`15-3` 三行在 `:406`–`:408`。
- RTM 行存在：`test/RTM.md:186`–`:188` 为 `15-1` / `15-2` / `15-3`；`:188` 的序列 = `空 → 带工具调用 → 空 → 空 → 带正文`（五步），与改后的 `:392` 同形。

**同轮门扫（本席落 · 逐条报）**

首次 `doc_check` 对「本档 + 批档」判 **REFUSED（锚 11 条 · 1 段文字太长）**，逐条处置：

| 命中 | 处置 |
|---|---|
| 批档 `:1069` · `:1073` · `:1074` · `:1075` · `:1077` · `:1079` · `:1080` · `:1083` · `:1084` · `:1090`（共 11 条，其中 `:1090` 两条） | 裸档名 → 仓根相对全路径（补 `docs/core/design/` 前缀；`:1090` 的批档名补 `docs/batches/2026-10-27-` 前缀）。**只改指针形式，零字面改动** |
| 批档 `:922` 长段（本席 §2.37 段） | 按句界拆 3 段，逐字未改 |

**自报越段（同 §2.35 ⑥ / §2.36 ② 口径）**：上述 12 处里 **11 处落在 §3 轮次 6（评审子代理段）**，只有 `:922` 在本席 §2.37。改因 = 收口文档门是交付前置，而该门判的是「整档」不是「本席段」；按「一段一作者」这 11 处本不属本段 —— **若父侧判越界，回退这 11 处即可，两处 AGENT-LOOP 改动不受影响。**

**机检（终）**：`doc_check(mode:"gate", docs=["docs/core/design/AGENT-LOOP.md","docs/batches/2026-10-27-ledger-boundary-fix.md"], target="D:\\teamcode\\thincoder")` ⇒ **PASS**（2 档全清，0 段超长）。

## §3 设计评审（评审子代理）
**状态行**：评审完成（第七轮收敛：上轮 🔴1 · 🟡4 · 🔵3 全数 Fixed，VERDICT: pass）



### 轮次 1（评审子代理）

### 评审对象
审查类型 = 设计评审｜目标 = `docs/core/design/CONTEXT-COMPACTION.md` §6.17「压缩触发判据（可达性门）」(L775–L820) + `docs/core/requirements/CONTEXT-COMPACTION.md` §2.1「压缩线目标 = 窗口 60%」口径收正 (L52–L57)｜对象状态 = 待评审｜触发 = 用户 2026-10-27 16:28「评审，自动跑完」（整批令覆盖批准门 FR36）。

评审限制（机械事实）：本次范围无项目标准档（方法学按 Project Guide + 本提示判据）、无文档地图（Document ownership 判据降级，仅按 AGENTS.md 的文档地图文字规则判）；受影响文件表的行数读数为范围外源文件，未 spot-check。

| # | Category | Severity | Issue | Suggestion |
|---|---|---|---|---|
| 1 | 集成测试设计 / 方法学 | 🔴 | §6.17 的门只有 4 行案例表（:813–:818），全档无「以 `test/RTM.md` 为起点」的集成测试设计节；唯一触及集成用例的一行是 :820「上面四例在当前盘上没有对应用例」（并点名 `test/integration/context-overflow-guard.test.mjs` 覆盖 11-1–11-5），即本改动自陈零用例；也未回答「哪些既有行被破坏 / 哪些冗余 / 缺哪些」。本门改变业务可观察结果（越线但压不到线下时不再发生压缩），不属「不改变任何既有用例断言」的豁免情形 | 补一节集成测试设计：先读 `test/RTM.md`，对 11-1–11-5 逐行判「本门是否让该行的构造前提失效（触发时刻后移 ⇒ 守卫面被更频繁触达？）」、判冗余、点出缺行；每行写清交互面 / 断言到的业务结果 / 用户进入点 / 回指需求条目；缺行编号先在 RTM 定号，再写同名 `test('N-M …')` 标题 |
| 2 | Document ownership（同机制两处现役表述） | 🔴 | 触发判据现有三处现役表述内容不同：§6.2:59「（system + tools + history）≥ 阈值即触发」、§6.10:232「仅当 history 末尾为 user / tool 且完整 prompt 估算 ≥ threshold 时触发」（该节标题 = 行为契约（验收口径））、新门 :782「压 ⟺ usage.total > threshold  ∧  post(plan) ≤ threshold」；同批还把 §6.4:178「预算只在压缩发生时计算，不改变触发阈值」留在原位，而门正好要在触发前算 `plan`/`post` 并改变触发。按 §6.10 #1 写断言的人会实现旧条件 | 把触发判据收敛到单源：§6.2:59 与 §6.10 #1 改为引用 §6.17 的判据式（或把三合取项写全）；D-T4（§6.4:178）补一句「触发面以 §6.17 可达性门为准」 |
| 3 | Clarity / 可实施性 | 🟡 | :784「post(plan) = round((history − middle + note + system + tools) × _tokRatio)」中 `note` 的取值来源未定：摘要长度在压缩前不存在，且 §6.9 D13-3「不设 max_tokens」⇒ 无上界。既有单源只有 §6.4:172「`SUMMARY_TOKEN_ESTIMATE = 1000`」，本条未指过去 | 在门里写明 `note` 取 `SUMMARY_TOKEN_ESTIMATE`（并说明这是估算、摘要超长时 `post` 低估的残余方向），或指名所用的既有量 |
| 4 | 受影响文件标注 | 🟡 | 门的落点写死为 :779「落点 `thincoder-core/context.mjs` 的 `compressIfNeeded`」，但受影响文件表 §6.16.9:615 该档 Δ = 「结构不变」、无预期增量——本改动一旦真的改 `compressIfNeeded`，该行读数与 Δ 都不成立 | 把 `thincoder-core/context.mjs` 行改写成带预期 Δ 的形态；若判据另落 `token-window.mjs`（如 `post` 辅助函数），补该行读数与 Δ |
| 5 | Clarity（新名字/可判性） | 🟡 | :816 期望里写「压缩事件恰 1（`mode:"summary"`）」——`mode` 在两档全文仅此一处，无字面定义、无三问答案，读者无法判它是什么字段、由谁产出；同格「回合请求 ≥2」也未说第二个回合请求从哪来（压缩在请求之前，一个正常回合只发一发回合请求） | 给 `mode` 的三问答案（existing / 逐字值 / 消费者）或删掉该标注；把「回合请求 ≥2」改成可数的口径（哪两个请求、各因何发出） |
| 6 | Requirements coverage | 🟡 | 门是新的触发语义（业务可观察：越线但压不到线下 ⇒ 不压），需求档 §2.1 本批只收正了 60% 口径，全文无门的对应条目；设计侧回指只有台账 `#1833`。且需求档 §2.1 内部两处口径相抵：:47「不改压缩触发阈值」与 :52「压缩线目标 = 窗口 60%」同节并存 | 需求档补一条带判定句的条目（或【派生 · 非用户原话】）收下「越线但压不到线下 ⇒ 不压」；把 :47 的边界句限定到预算保真那一块（或点名本批改了什么） |
| 7 | 需求档 ↔ 设计档口径漂移 | 🟡 | 需求档 :53「**预留 = 显式 maxTokens，不封顶**」只写显式一支，设计 :715 为「`maxTokens ?? spec.maxOutput`（未发时保守按规格输出」；照需求档字面，未发档可用窗口 = 整窗，判定句 ①「两式与 `min(usable, ⌊window × 0.6⌋)` 逐档互推一致」在 absent 档复现不出来。另 :56「预留 > 40% 的档」与设计 :61「预留 ≥ 40% 窗口的 4 档 9 行」在恰 40% 处切法不同（数值同为 60%，分类相反） | 需求档补上 absent 支（未发 ⇒ 按规格 `maxOutput` 预留）；两处 40% 边界不等式取同一侧（设计按 ≥ 还是按 > 只留一种） |
| 8 | 报面口径（需求 ↔ 设计字面） | 🟡 | 需求档 :55「实发 max_tokens + 来源 ∥ messages ∥ 距压缩线 ∥ 距真限」与设计的字面名不同（§6.16.4:513 用 `prompt {total}`，且 :521 自陈「故标 `prompt` 不标 `messages`」）；另需求档 :56 判定句 ① 要求「且须在报面明示该档的预留占比」，而设计报面字面是五实数，无预留占比这一项 | 需求档把 `messages` 改成设计已定的 `prompt` 名（或设计与需求各写一句对应）；报面按需求明示预留占比，或把该要求改成「可由 window 与 max_tokens 推得」并写明推导 |
| 9 | Closest-precedent 标注 | 🔵 | :805「**与既有判据的关系（先例 · 零偏离）**」把门记为零偏离的先例复用，但守卫那句判断是「压后仍超 ⇒ 抛」，门是「压前判 ⇒ 不压不抛」；:807 自己登记了行为改变，措辞与「零偏离」相抵 | 写成「偏离 + 理由」：同一句判断前移到触发面，为什么事后形式在触发面不适用 |
| 10 | 勘察证据行 | 🔵 | 勘察证据行 :42「**勘察证据行**」与 :934「**公开源勘察（本批）**」均是上一批（§6.17.1 三条链）的口径，本门这一批没有自己的勘察/先例行范围入账 | 在本门节内补一句本批查过哪些档、是否有相关输入（与 §6.17.1 同写法） |

计数：🔴 2 · 🟡 6 · 🔵 2

VERDICT: changes-required

### 轮次 2（评审子代理）

**评审范围** = 设计档 `docs/core/design/CONTEXT-COMPACTION.md` §6.17 可达性门（含新增集成测试设计节 `:826-849`）+ 需求档 `docs/core/requirements/CONTEXT-COMPACTION.md` 60% 口径与门条目 + `test/RTM.md` 故事 11 新增 11-6–11-9。三档均已全文读完（设计档 1064 行）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Document ownership / Requirements | 🔴 | 需求档 §2.1 的「可用窗口」定义与设计档的 `usableWindow` 同一机制两处不同描述：需求档 `:55` 写死「可用窗口 = 窗口 − 完成预留」，设计档 `:716` 是「`usableWindow(window, reserve)`（预留 ≥ 窗口 ⇒ 半窗）」。在 `doubao-seed-2-1-turbo-260628`（256,000 / 256,000）一档上两者给出相反结果——需求档 `:58` 判定句①「预留 ≥ 40% 的档 = `窗口 − 预留`」算得 0（即任何 prompt 都触发、该档实际发不出去），设计档 `:68` 表与 `:61`「T01 预留 = 窗口 ⇒ 半窗退化接管，线 = 窗口 / 2」算得 128,000；设计档 `:120` 更已给该档地板「该档 `limit` 取地板 = `threshold` = 128,000」。随之需求档 `:56` 的「故线高永远不会超过「窗口 − 预留」」在该档亦不成立（128,000 > 0）。判定句① 自定的互推一致性（「两式与 `min(usable, ⌊window × 0.6⌋)` 逐档互推一致」）在 T01 上必红。 | 在需求档 §2.1 补齐半窗退化支：可用窗口 = `usableWindow(窗口, 预留)`（预留 ≥ 窗口 ⇒ ⌊窗口/2⌋），判定句① 的「≥ 40% 档 = 窗口 − 预留」限定为「预留 < 窗口」，并把 `:56` 的「数学必然」限定为 `预留 < 窗口`；退化档（T01）的线取值与地板另列一句，与设计档 `:68` / `:120` 逐位对齐。 |
| 2 | Affected-file size annotations | 🟡 | 受影响文件表（`:613` 起）缺本批会改的集成测试档：新增四行 11-6–11-9 的证据档 = `test/integration/context-overflow-guard.test.mjs`（设计档 `:849` 自陈「（279 行）现只到 11-4b」），但表内无该行、无 Δ；表末唯一测试档行是上一批的「批内定向单测 `<batch>.test.mjs` 416 收口删」，本批的定向单测档 / 验收跑法亦未登记。 | 受影响文件表增一行 `test/integration/context-overflow-guard.test.mjs`：现况 279、Δ ≈ +4 例（结构不变），并在同表或案例表处写明本批验收 = 该档 `node --test <该档>`（或本批定向单测档）——不写套跑。 |
| 3 | Acceptance / traceability（criterion 12） | 🟡 | 集成测试设计节 `:846` 的 11-8 回指写「设计 §6.16.2（`force` 面；无独立需求条目）」，但需求档 `:35` 有「**F-CC2 主动压缩（携要求）**」用户需求条目，模型主动压缩正是 F-CC2 的业务面——「无独立需求条目」不实；`:847` 的 11-9 回指亦只到设计 §6.5，无需求条目。RTM `:136` 把这两行的回指塞进「异常」列（`异常 = 回指 = …`），而 11-6/11-7 同列写的是「缺口来源」。 | 11-8 回指改指需求档 §2.1 F-CC2（force 面 = F-CC2 的机制落点），11-9 回指补需求条目或明写「本条只为守门不误拦降级路，无需求条目」并说明理由；RTM 11-8/11-9 的「异常」列改为 `—`，回指留在设计节表内。 |
| 4 | Clarity / 内部一致性 | 🟡 | 设计档 `:468`（§6.16.2 表「阈值面语义零改」）仍写「`force` 只跳过 `tokens <= threshold` 这一条早退（模型判定优先于阈值），其余全同」，与本节 `:781`「`extras.force` 全文豁免」及案例表 11-8「门只拦阈值面，`force` 全文豁免」的射程不同：按 `:468` 字面，`force` 不跳过后置的 `post ≤ threshold` 判据，主动压缩会在压后仍超线下时被门挡住——正是 11-8 要排除的格。 | 把 `:468` 该句改成「`force` 跳过阈值面的全部早退判据（`total <= threshold` 与 `post > threshold` 两条）」，与 `:781` 判据单源逐字对齐。 |
| 5 | Acceptance / RTM 故事面 | 🟡 | RTM 故事 11 的表新增四行，但故事面未同步：`:123` 的目的仍是「越窗时要么先压一次再发，要么带三实数当场报错」，不含 11-6/11-7 要断言的业务结果（不白付一次摘要请求、用户照常拿到答复）；`:124` 节注的需求回指仍是「F-LX4 的上下文面（本批 §2 R1–R4）」，且全书其余故事都有的「三态（行序）＝…」行在本节缺。另 11-8（`:136`「模型主动 `context{action:'compact'}`，且压后仍超压缩线」）与 11-9（`:137`「单条消息超 `OVERSIZE_CONTENT_LIMIT`、无中段可摘」）的「怎么做」只给夹具条件，未给用户进入点（CLI 会话里发一条消息 / 上一轮模型调用 `context` 的那次会话）。 | 故事 11 的目的行补一句本门要守的业务结果，节注补三态（行序）行并把需求回指扩到台账 `#1833` ∥ 需求档 §2.1（门条目 / F-CC2）；11-8、11-9 的「怎么做」补一句用户进入点。 |
| 6 | Doc hygiene（数字漂移） | 🔵 | 设计档 `:826`「现 11-1–11-5 五行」：RTM 故事 11 现有六行（11-4a ∥ 11-4b 分列），`:849` 同口径。 | 改为「现 11-1–11-5 六行（含 11-4a ∥ 11-4b）」。 |
| 7 | 评审限制（unverified） | 🔵 | 受影响文件表的行数读数（`context.mjs` 261 / `token-window.mjs` 247 / `run-stages.mjs` 355 / `turn-loop.mjs` 310 等）与全部代码行号引用均未核实——本次评审范围只含三份文档，代码面不在范围内；函数级 300+ 行单函数一项因档内无函数级行数读数，同样无从判。 | 实施轮以实读行数收口（表内已声明「收官一律以实读为准」）；若本批触及的档存在 300+ 行单函数，在表内补一句函数级结论。 |
| 8 | Doc hygiene / 措辞 | 🔵 | 需求档 `:47` 预算保真块的边界句「不改压缩触发阈值」与同节 `:52` 新增的门条目（改的正是触发判据）并存，字面易被读成互相否定。 | 把 `:47` 该句收成「不改阈值取值（判据的可达性门见本条之后的门条目）」。 |

**已核实成立的前轮修（逐项）**：
- 勘察证据行在场：设计档 `:779`「查过 = 本档 §6.4④ … ∥ `test/RTM.md` 故事 11（11-1–11-5）。`index.publicRepos` = 空表」——外部源缺席已记录。
- 先例行在场且偏离理由随行：`:809`「先例 = 守卫面同一句判断…」+ `:811`「偏离的是位形，不是判断」，指明先例为事后判、本门为事前判，并说明事后那一抛必须留着。
- 分支场景来源在场（criterion 6b 通过）：新分支「不压」的场景 = `:815` 现场读数「`total=83,717` · `history=153` · `system=33,852` · `tools=49,712` · `threshold=76,800`」（台账 `#1833`），可复算：`system + tools = 83,564`，`post ≈ (153 + 83,564 + 注记) × ratio > 76,800` ⇒ 不触发。
- 集成测试设计节在场且起点是 RTM：`:826` 明写「起点 = `test/RTM.md` 故事 11」，`:830-836` 逐行判 11-1–11-5 不失效（均给理由）、`:838` 冗余判定 = 无、`:842-847` 缺行 11-6–11-9 给「怎么做（用户进入点）/ 怎么算通过 / 交互面 / 回指」四列、`:840` 编号与 RTM `:134-137` 逐字同号（11-6–11-9）。
- 判据单源未分叉：`§6.2:59`、`§6.10 #1:232`、`§6.4 D-T4:178`、`:781` 四处对门的表述一致（`total > threshold ∧ post ≤ threshold`），且均为指针、无第二份算式。
- 需求档门条目与设计单源回指一致：`:52`「压 ⟺ total > threshold ∧ post(plan) ≤ threshold」= 设计 `:784` 判据式。

**计数：🔴 1 · 🟡 4 · 🔵 3**

VERDICT: changes-required

（终局判：🔴 #1 未消——需求档 60% 口径的「可用窗口」定义与判定句① 在 T01 档与设计档表值相反，属同一机制两处不同描述；本轮回执不放行。）

### 轮次 3（评审子代理）

### 第三轮（收敛轮）评审 · 逐条验证第二轮 8 条

评审对象 = 第二轮发现的 8 条（🔴1 · 🟡4 · 🔵3）。评审范围 = `docs/core/design/CONTEXT-COMPACTION.md` · `docs/core/requirements/CONTEXT-COMPACTION.md` · `test/RTM.md`（本轮全文重读）。

| # | 原# | 文件 | 严重度 | 状态 | 说明（本轮实读证据） |
|---|-----|------|--------|------|------|
| 1 | 1 | docs/core/requirements/CONTEXT-COMPACTION.md | 🔴→✔ | Fixed | 「可用窗口 / 判定句① / 数学必然」三处已补半窗退化支：`:55`「**可用窗口 = `usableWindow(窗口, 预留)`——窗口减预留；预留 ≥ 窗口时退到 `⌊窗口 / 2⌋`**」；`:56`「**压缩线取值与预留量互斥（预留 &lt; 窗口 时）**」+「**预留 ≥ 窗口时半窗退化接管，线 = `⌊窗口 / 2⌋`（不再降）**」；`:58`「**预留 ≥ 窗口的档 = `⌊窗口 / 2⌋`（半窗退化）**」+「三式与 `min(usableWindow(窗口, 预留), ⌊窗口 × 0.6⌋)` 逐档互推一致」。与设计 `:68`「128_000（50.0%） * 半窗退化」· `:719` usable · `:864` 地板理由 · RB4 逐位一致 |
| 2 | 2 | docs/core/design/CONTEXT-COMPACTION.md | 🟡→✔ | Fixed | 受影响文件表 `:643` 已增「`test/integration/context-overflow-guard.test.mjs` \| 278 \| 预计 +4 例（结构不变）」；`:646` 已给「**本批验收跑法（定向 · 不套跑）**：`node --test test/integration/context-overflow-guard.test.mjs`…」。读数 278 与 `:852`「（278 行）」同值，无漂移 |
| 3 | 3 | docs/core/design/CONTEXT-COMPACTION.md + test/RTM.md | 🟡→✔ | Fixed | 设计 `:849` 11-8 回指改为「`docs/core/requirements/CONTEXT-COMPACTION.md` §2.1 F-CC2（模型主动压缩携要求 = `force` 面的业务面）∥ 设计 §6.16.2」；`:850` 11-9 明写「本条只守「门不误拦降级路」，无独立需求条目（降级路 = 实现面兜底）」（= 明确声明 + 理由，非零理由沉默）；RTM `:136`/`:137` 异常列改 `—` |
| 4 | 4 | docs/core/design/CONTEXT-COMPACTION.md | 🟡→✔ | Fixed | `:468` 改为「`force` 跳过阈值面的**全部**早退判据——`total <= threshold` 与 §6.17 可达性门的 `post > threshold` 两条」，与 `:784`「`extras.force` 全文豁免」及 11-8 同射程，残留旧表述已清 |
| 5 | 5 | test/RTM.md | 🟡→✔ | Fixed | `:123` 目的补「压缩只在压完能落到线下时发生——不为一次没有净减的摘要白付请求，用户照常拿到答复。」；`:124` 补三态（行序）覆盖 11-1–11-9 全 10 行 + 需求回指改「§2.1（压缩线目标 60% ∥ 触发可达性门 ∥ F-CC2 主动压缩）∥ 台账 `#1833`」；`:136`/`:137` 已给用户进入点 |
| 6 | 6 | docs/core/design/CONTEXT-COMPACTION.md | 🔵→✔ | Fixed | `:829`「现 11-1–11-5 六行——含 11-4a ∥ 11-4b」· `:852`「现有 11-1–11-5 六行（含 11-4a ∥ 11-4b）」，数值漂移已正 |
| 7 | 7 | （全三档） | 🔵 | Accepted | 行数读数与代码行号引用仍不可核实（评审范围只含三份文档）——本轮如实登记为评审限制，不构成缺陷；函数级 300+ 行单函数一项档内无函数级读数，无从判 |
| 8 | 8 | docs/core/requirements/CONTEXT-COMPACTION.md | 🔵→✔ | Fixed | `:47` 改为「**不改阈值取值**（触发判据的可达性门见本段之后的门条目——它只加一条判据，不动任何数值）」，不再与 `:52` 门条目字面互斥 |
| 9 | (new·🔵) | docs/core/design/CONTEXT-COMPACTION.md | 🔵 | New（非阻塞） | `:845` 缺行表列头为「怎么做（用户进入点）」，但 11-8 行 `:849` 仍只写机制（「模型主动 `context{action:'compact'}`，且压后仍超线下」）、11-9 行 `:850` 只写夹具条件（「单条巨型消息超 `OVERSIZE_CONTENT_LIMIT`、无中段可摘」）——用户进入点本轮已落在 RTM `:136`/`:137`（集成用例行的权威位），设计表该列可择机对齐；不影响判据与实施 |

**计数：🔴 0 · 🟡 0 · 🔵 1 ·（另有 1 条 Accepted 评审限制）**

**判**：第二轮 8 条逐条验证——7 条 Fixed（🔴 1 · 🟡 4 · 🔵 2）、1 条 Accepted（评审限制）。本轮修未引入新的 🔴；新增 1 条 🔵（非阻塞）。机制级描述分叉已在需求档/设计档两侧对齐（半窗退化三处同式），force 豁免射程单源化，11-6–11-9 的交互面 / 业务结果 / 用户进入点 / 回指四件齐备。

VERDICT: pass

### 轮次 4（评审子代理）

**评审对象**：docs/core/design/AGENT-LOOP.md §6.5① 空响应重试预算的复位判据（含 §6.2 resume 保留集、§5 受影响文件表、§7 D-AL28/D-AL29）。评审类型 = 设计评审（只读；坐标已按实读核过）。

| # | 类别 | 严重度 | 问题 | 建议 |
|---|---|---|---|---|
| 1 | 可行性 / 内部自相矛盾 | 🔴 | 「判据单源」与「completion.mjs 零变更 + turn-loop 零新 import」三条约束**联合不可满足**。设计写「清零读空白判的**否定**，不写第二份 `.trim() === ""`」（`docs/core/design/AGENT-LOOP.md:377`），同时把 `completion.mjs` 定为 `0` 行、「空白判 ∥ 计数递增 ∥ 提醒注入 ∥ 抛错骨架逐字不动」（`:188`），`turn-loop.mjs` 定为「零新 import」（`:187`）。实读：空白判**只**以行内表达式存在（`thincoder/thincoder-core/agent/completion.mjs:32`），核内无任何导出谓词；`turn-loop.mjs:14` 只从该档取 `handleCompletion` 一个符号。⇒ 实施者只能二选一：在 `turn-loop.mjs` 写第二份判据（正是 `:377` 禁止的「两份一漂」），或改 `completion.mjs` 导出谓词（违反表中 0 行 / 逐字不动）。若退到 `response.content` 真值判，恰是 F-DA6 加宽前的窄判（纯空白内容过判为实质）⇒ 复位面比判空面窄，`docs/core/design/AGENT-LOOP.md:377` 自述的失效形当场成立。 | 在 §5 表与 §6.5① 之间选一条：①引出共享谓词（届时 `completion.mjs` 的预计增量改为实际值、「逐字不动」改为「判据抽成具名谓词，判空面语义零变」，并在 §5 增 `turn-loop.mjs` 的 import 面说明）；或②明确写出复位判据与判空判据是同一表达式的两处引用形式及其防漂约束（机检项）。不能留两条互斥约束给实施轮自行消化。 |
| 2 | 集成测试设计（判据 12） | 🔴 | 全档无「从 `test/RTM.md` 出发」的集成测试设计节：未答哪些既有行被破、哪些冗余、哪些缺失，也没有一行以业务故事 / 集成用例的形式承载本笔。`test/RTM.md` 实存（`test/RTM.md:3-5` 定节 = 业务故事、行 = 集成用例），其中**无**空响应 / 重试预算故事（`11-4a/4b` 只覆盖越窗，`test/RTM.md:131-132`）。本笔的触发是用户报的**生产真实发生的问题**（「deepseek-flash 一直报 empty response，点 retry 又能继续」），业务可观测结果 = 用户拿到答复而非错误（同 `test/RTM.md:131` 「用户拿到答复而非错误」的同形结果）⇒ 豁免句（「不改既有用例断言的业务结果、也不新增产品真需要的场景」）不成立。 | 在 §5 之后补集成测试设计节，以 `test/RTM.md` 为基线写差量：既有行是否被破（如 11-4 族）/ 是否冗余 / 是否缺行；缺行先把编号在 RTM 定死、再用同号作用例标题（`test('N-M …')`）；每行点名所评的**组件间交互**、所断言的**业务结果**、**业务入口**（用户在会话里发一次回合）、以及回指的业务需求。若确认豁免，须把豁免句连同理由写在该节。 |
| 3 | 清晰度 / 受影响文件标注（判据 8） | 🟡 | §5 的 VSC 一行把两个坐标的标签写反，且「等价」是无依据断言：`agent-state.mjs:37` 实为 `resetRunState` 内的 per-run 复位（`thincoder/thincoder-vscode/src/agent/agent-state.mjs:27`、`:37`），`setup.mjs:58` 实为 `buildTopLevelAgent` 的字段初值（`.../agent/setup.mjs:49`、`:58`）；表里却写成「字段初值 ∥ 每 run 复位面（`:37` ∥ `:58`），与核 `agent.mjs:78` 同值」（`docs/core/design/AGENT-LOOP.md:190`），而核的 per-run 复位在 `run-start.mjs:134`（`:189` 自己这么写），`agent.mjs:78` 只是初值。真正的等价是**结构性**的：VSC 的 `resetRunState` 只在首段装配时跑（`.../extension/panel-turn-loop.mjs:214-217` 的 `if (!agent)` 门），故续跑段不清零——与核 `if (!resume)`（`thincoder/thincoder-core/agent/run-start.mjs:109`）靠不同手段达成。 | 修正两坐标标签；把「续跑不清零」在 VSC 侧的成立条件写成结构句（resetRunState 只在链首段装配调用），并登记为 S2 装配对位义务——否则将来有人把 hydrate 挪进每段，这条不变量会静默失效而无人可查。 |
| 4 | 清晰度（口径用词） | 🟡 | 同一笔内「轮」前后指两物，且对现状的描述与实读不符：`docs/core/design/AGENT-LOOP.md:371` 写「不是**每轮**额度」，`:379` 又写「额度从「**每轮** 2 次」变为「每连续 2 次」」；实读现状是**每 run**（链起点）清零、run 内跨轮累计（`thincoder/thincoder-core/agent/completion.mjs:38-40` 每轮至多 +1；`run-start.mjs:109`、`:134` 仅 `!resume` 时归零）。同句「可在一轮内跑更多次空重试」与其自带的括注「（每轮恰一次模型调用）」互相打脸——连接续空占的是多个轮。D-AL28 亦写「实现是每轮累计」（`docs/core/design/AGENT-LOOP.md:600`）。 | 全节统一：`轮` = 回合环一次迭代（现有用法），`run ∕ 链 ∕ 段` = 一次 `runAgent` 及其续跑段；把「每轮 2 次」改为「本 run 累计 2 次」、把「在一轮内跑更多次」改为「在一个 run 内可多跑几次空重试（上界 = `maxTurns`）」。本笔治的正是计数范围，范围用词漂移会直接变成实施判据漂移。 |
| 5 | 分支出处（判据 6b） | 🟡 | 复位分支的场景（空 → 实质 → 空）在档内只有机制推理，没有观察或复现记录：D-AL28 的理由是「注释与抛错文案都写 consecutive，而实现是每轮累计」（`docs/core/design/AGENT-LOOP.md:600`），场景本身（用户报的 deepseek-flash 表现）只在批次的触发行里，档内不可查。分支一旦落地就带着提醒文案 / 跨端一致 / 用例三样随行物，而没有现场就没人能事后判它对不对。 | 在 §6.5① 或 D-AL28 附一句现场：引用用户报告原文（或一次可复现的序列 = 一次空响应 → 一次带正文响应 → 一次空响应后当场抛 `LLM returned empty response`），并指明该序列由「续跑 / 新 run 即恢复」侧证。 |
| 6 | 验收锚（判据 5 / 12 尾段） | 🟡 | §6.5① 「验收（可机判）」（`docs/core/design/AGENT-LOOP.md:380`）三条断言写得可判，但**没有任何宿主文件与命令**：§5 的受影响文件表（`:185-190`）全是产品源档，无一行测试档；也没有本笔要跑的 `node --test <file>` 指向。三条断言落在哪个档、由谁跑，档内无答案。 | 在 §5 表增一行核侧单元测试档（现行行数 + 预计增量），并在 §6.5① 验收句给出该档的 `node --test <file>` 命令；集成半按判据 12 留在收口行报。 |
| 7 | 最近先例（判据 9） | 🟡 | 本笔的三处改动（§6.5① 判据 / §6.2 保留集 / §7 决策两条）都没有最近先例行：无「实现坐标 ∥ 对应设计段 ∥ 先例批」的对位，也无「为何沿用 / 为何偏离」的理由。同级同形先例就在本仓：`#934` 的「连续零落笔 streak」在同一复位块内写明「链起点复位、续跑不清零」（`thincoder/thincoder-core/agent/run-start.mjs:126-130`），与本笔「连续空计数」是同一判形。 | 补一行最近先例：指向 `_zeroWriteStreak` 那一族的坐标与档段，说明本笔沿用其「链起点复位 / 续跑不清零」形，偏离点（清零点在回合环取响应处而非环头）给出理由（已写在 `docs/core/design/AGENT-LOOP.md:374` 的位置极值论证即可复用为偏离理由）。 |
| 8 | 调研证据（判据 10） | 🟡 | 无调研证据行：未记「查过哪些公开源档 / 有无相关」，特别是 `test/RTM.md`、`docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.31.8（本档自己点的判据单源）、`docs/core/design/CONTEXT-COMPACTION.md` D-CC15。缺席读起来就是「没查」。 | 在 §5 或 §6.5① 末补一行调研证据：查过哪些档、各自是否相关（查过而「无相关」也要记），至少覆盖 `test/RTM.md` 与 §6.31.8。 |
| 9 | 同族文档同步（R7c 数字漂移） | 🔵 | 本档把「判据单源」指到 `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.31.8（`docs/core/design/AGENT-LOOP.md:369`），而 §6.31.8 只写「用尽抛错 / 重试预算零变」，未述复位判据；其坐标还写 `completion.mjs:15`（`docs/core/design/AGENT-LOOP-ASYNC-POOL.md:1025`），实读常量在 `completion.mjs:16`。 | 定稿时在 §6.31.8 补一句指向本档 §6.5① 的复位判据（或指明该节不再单独表述预算语义），并顺手校正坐标。 |
| 10 | 受影响文件标注形式（判据 8） | 🔵 | `turn-loop.mjs` 的预计列写「+5~8」（`docs/core/design/AGENT-LOOP.md:187`）——是区间不是上限；判据要的是 `≤±N` 或「结构不变」。行数本身已核（现行 310 与 `wc -l` 同口径一致；改后 ≈318 ≪ 500，无需拆分计划）。 | 改成 `≤+8`（或「≤+8，结构不变」），使上界唯一。 |

**计数**：🔴 2 · 🟡 6 · 🔵 2（合计 10）。

**已核事实（供复核）**：`turn-loop.mjs:153` 确为 `const response = await callTurn({`；`handleCompletion` 全核唯二出现 = `completion.mjs:31` 定义 + `turn-loop.mjs:228` 调用；`completion.mjs:32` 空白判 / `:38-40` 递增与抛错（第 3 次抛）；

`run-start.mjs:109` `if (!resume)`、`:134` 归零；`chat-call.mjs:4` 错误原样透传；`turn-loop.mjs:57` ∥ `:70` 同回合两次 `callModelTurn`；VSC 端壳经核 `runAgent`（`panel-turn-loop.mjs:230`）、`resetRunState` 只在首段（`:214-217`）；

`_emptyRetries` 写点全仓 = 核 `completion.mjs:40` / `run-start.mjs:134` / `agent.mjs:78` / VSC `agent-state.mjs:37` / `setup.mjs:58` ⇒ §5「行为面只在核、本笔零跨端」成立。

VERDICT: changes-required

### 轮次 5（评审子代理）

**第 6 轮（补录）：设计评审 —— docs/core/design/AGENT-LOOP.md §6.5① 空响应复位判据 + test/RTM.md 故事 15**

复核现状：两份文档的 §6.5① / 故事 15 内容仍为上一轮被评审的同一形（判据单源具名谓词 · 清零点 turn-loop.mjs:153 · 额度 2 不动 · 集成设计起点 = test/RTM.md · 三行 15-1/15-2/15-3），受影响文件行数抽查与实盘一致（completion.mjs 159 · turn-loop.mjs 310 · run-start.mjs 159 · VSC agent-state.mjs 168 · setup.mjs 322）。

| # | 类别 | 严重度 | 问题 | 建议 |
|---|------|--------|------|------|
| 1 | 文档归属 / 机制一致性 | 🔴 | §6.5①:390「「点 retry 又能继续」= 续跑回到链起点清零（`thincoder-core/agent/run-start.mjs:109`）」与本节同档 `:270`「`_emptyRetries` 保留（续跑不是实质响应 ⇒ 不得借续跑清零——清零判据见 §6.5 ①）」相反；且所引坐标 `run-start.mjs:109` = `if (!resume) {`（续跑**不进**复位块，`:134` 在门内）⇒ 同一机制（resume 下 `_emptyRetries` 是否清零）在两处描述相反，引用坐标还支持相反结论 | 改写为「点 retry = 重发一条消息（新 run，`resume:false`）走 `run-start.mjs:109` 的 `if (!resume)` 门内 `:134` 置 0；`resume` 续跑**不**清零（§6.2 保留集）」——不要用「续跑清零」当侧证 |
| 2 | 验收用例设计 | 🟡 | RTM 15-1（`test/RTM.md:186` ∥ 本档 `:404`）进入点 = 「发一条消息」（= 一次 run），而序列 空→正文→空→正文 中的第一个正文若无工具调用，`turn-loop.mjs:244` `return cr.content` 即收束本 run（`completion.mjs:158` done）⇒ 第二次空只能落在下一个 run，而下一 run 起手即清零 ⇒「用户拿到两次正文答复」与「发一条消息」互斥；否则实现批只能自行改形（静默偏离） | 收成单 run 形（空 → 带工具调用的正文 → 空 → 正文），并写明 `_emptyRetries` 的读点在下一次 run 起手之前；或明确写「两条消息两 run」并把判据落在 run 边界读数上 |
| 3 | 验收用例设计 | 🟡 | 15-3（`test/RTM.md:188`）：空→工具→空→正文 在修前也不抛（计数 1 → 工具轮不增 → 2 → 正文收束），「不抛」这一半不区分修前修后，只有「从 0 起算」的计数读数有判别力 | 工具轮后再加一次空（空→工具→空→空→正文：修前第 3 次空即抛、修后通过），使「不抛」本身成为判别点 |
| 4 | 验收 / 受影响文件 | 🟡 | `:393` 验收只给集成用例（命令 = `node --test test/integration/empty-response-retry.test.mjs`），无本批单元用例；本档既有机制批惯例是「机判 = 纯函数 ∕ 接线单元断言」（如 `:439`–`:441`），测试路由为「改动内单元测试 ∕ 链终收口时集成测试」（`:531`）；受影响文件表（`:185`–`:191`）也无单元用例档行 | 补本批单元用例档（如 `thincoder-core/test/empty-response-reset.test.mjs`：`isSubstantiveResponse` 三形 + 取响应处复位 + 续跑不清零），验收命令写该档；集成三行移入收口行报告 |
| 5 | 场景可复现性 | 🟡 | `:390` 现场「可复现序列 = 空 → 带正文 → 空：修前第二次空当场抛」在同一 run 内不可达（中间正文无工具调用即收束 run，见 #2），照此复现修前不会抛 | 写明中间那一轮带工具调用（空 → 带正文+工具 → 空 → 空），或改述为「报错后重发一条消息」的双 run 形 |
| 6 | 数值漂移 | 🔵 | `test/RTM.md:182`「七态（行序）= 15-1 正常 · 15-2 错误 · 15-3 边界」——列的是三态，却写七态（照抄故事 14） | 改「三态（行序）」 |
| 7 | 数值漂移 | 🔵 | 本档 `:398`「故事 11 六行（`test/RTM.md:128`–`:132`）」——该区间实为 11-1/11-2/11-3/11-4a/11-4b 共五行；11-5（`test/RTM.md:133`）未提 | 改「五行」并点名 11-5，或把回指写成 `test/RTM.md:128`–`:133` |
| 8 | 既有构件核对 | 🔵 | 新名 `isSubstantiveResponse` 的三问答（住哪 · 逐字名 · 谁读）实质已散在 `:382`，但无显式形（实核：仓内零 `isSubstantive` 符号，判空仅 `completion.mjs:32` 内联式） | `:382` 补一句「existing: 无（判空只有 `:32` 内联式）；none found: 仓内零 `isSubstantive` 命中」 |

判定口径限制：本次评审上下文未提供项目标准档与文档地图（Project Standards ∕ Document Map 皆为空），方法论合规与文档归属按 Project Guide（AGENTS.md）与评审判据判定。

计数：🔴 1 · 🟡 4 · 🔵 3

VERDICT: changes-required

### 轮次 6（评审子代理）

### 第七轮（收敛）· 第六轮八条的修是否成立

对象：`docs/core/design/AGENT-LOOP.md` §6.5① 空响应重试预算复位判据 / `test/RTM.md` 故事 15。逐条复核（现行文件实读，非上轮快照）：

| # | 上轮 | 文件 | 严重度 | 状态 | 本轮实读证据 |
|---|------|------|--------|------|--------------|
| 1 | 🔴1 | docs/core/design/AGENT-LOOP.md:392 | 🔴→Fixed | Fixed | 「「点 retry 又能继续」= **重发一条消息**（新 run，`resume:false`）走 …`:109` 的 `if (!resume)` 门内 `:134` 置 0；`resume` 续跑**不**清零（§6.2 保留集）」——与 §6.2 `:271`「`_emptyRetries` 保留（续跑不是实质响应 ⇒ 不得借续跑清零」一致；代码复验：`run-start.mjs:109` = `if (!resume) {`，`:134` = `agent._emptyRetries = 0`（在门内）⇒ 机制面矛盾消解。另新增 :395 断言③「续跑不清零」把该语义钉进机判 |
| 2 | 🟡1 | test/RTM.md:186 / docs/core/design/AGENT-LOOP.md:406 | 🟡→Fixed | Fixed | 15-1 改为单 run 形「空 → 带正文且带工具调用 → 空 → 带正文（中间轮必须带工具调用——零工具调用的带正文响应会当场收束本 run）」，判据改为「中间轮之后 `_emptyRetries` 读到 0（读点在下一轮取值之前）」；进入点与序列自洽（原「发一条消息 vs 两次答复」互斥已消） |
| 3 | 🟡2 | test/RTM.md:188 / docs/core/design/AGENT-LOOP.md:408 | 🟡→Fixed | Fixed | 15-3 改为「空 → 带工具调用 → 空 → 空 → 带正文」，判据「不抛；…**修前此行为红**（工具轮不清零，第 3 次空即抛）」——判别点成立（修前 1→2→抛，修后中间轮回 0 ⇒ 1/2 后重试成功） |
| 4 | 🟡3 | docs/core/design/AGENT-LOOP.md:395 / :192 | 🟡→Fixed | Fixed | 验收宿主改为本批批内单测档「`docs/batches/<本批档名>.test.mjs`，命令 = `node --test docs/batches/<本批档名>.test.mjs`」+ 四组断言（谓词三形 ∥ 取响应处复位 ∥ 续跑不清零 ∥ 三次连续空抛错）；受影响文件表 `:192` 补该档行；形态与 `TESTING.md:43`（`node --test docs/batches/<档>.test.mjs` 单元档直达）∥ `TESTING.md:55`（单元档住批次目录、用毕即删）一致；集成半按 :395 移入收口行 |
| 5 | 🟡4 | docs/core/design/AGENT-LOOP.md:392 | 🟡→Fixed | Fixed | 现场改为「可复现序列（单 run）= 空 → 带正文且带工具调用 → 空 → 空」并注明「零工具调用的带正文响应在 `turn-loop.mjs:244`（`return cr.content`）就收束本 run」；修前读数按 `completion.mjs:38`–`:40` 推正确（1 → 不清零 → 2 → 第 3 空抛）。代码复验 `:244` = `return cr.content` ✓ |
| 6 | 🔵1 | test/RTM.md:182 | 🔵→Fixed | Fixed | 现为「三态（行序）= 15-1 正常 · 15-2 错误 · 15-3 边界」 |
| 7 | 🔵2 | docs/core/design/AGENT-LOOP.md:400 | 🔵→Fixed | Fixed | 现为「故事 11 六行（`test/RTM.md:128`–`:133`，含 `11-5`）」——该区间确为 11-1/11-2/11-3/11-4a/11-4b/11-5 六行 ✓ |
| 8 | 🔵3 | docs/core/design/AGENT-LOOP.md:384 | 🔵→Fixed | Fixed | 补「既有构件三问（`isSubstantiveResponse`）：existing: 无 · none found: 仓内零 `isSubstantive` 命中 · consumers: 两处」 |

修带来的残余（不阻塞）：
- 🟡（可选）`docs/core/design/AGENT-LOOP.md:414`「三行断言与本节「验收」同源」在验收改写为单元四断言后指空——集成三行的断言现住 `:406`–`:408` 表格与 RTM 186–188；建议改成回指那两处。
- 🔵 `docs/core/design/AGENT-LOOP.md:392` 序列列四步（空 → 正文+工具 → 空 → 空），结论写「两空各计 1 / 2 后重试成功」需第五步（正文），与 `:408` / RTM 15-3 的五步形差一步；补上「→ 正文」即可对齐。

计数：🔴 0 · 🟡 1（可选·不阻塞）· 🔵 1（前轮 🔴1 · 🟡4 · 🔵3 全部 Fixed）

VERDICT: pass

（附注：本轮 `## Agent Response` 列的修面是另一批的档——`token-window.mjs` / `context.mjs` / `probe-1833.mjs` / `docs/batches/2026-10-27-ledger-boundary-fix.md` / `write-gate.mjs` / `bash-async.mjs` / `batch-*.mjs` 等，与声明对象（`docs/core/design/AGENT-LOOP.md` §6.5① + RTM 故事 15）不符；本轮按声明对象以现行文件实读复核，未读那批档。）

## §4 用户批准（主 agent）

**批准依据**：用户 2026-10-27 16:28 原话「**评审，自动跑完**」——整批令覆盖批准门（FR36）。后续同一口径的三次裁定随行：16:53「**不加**」（不加 run 级空响应总额度）· 16:30「**我们现在定的就是 0.6**」（压缩线口径）· 17:0x「**1800 以后都在这批处理**」+「**都由本批背**」（95 点位进本批）。

**批准的交付面**（逐项对应 §2 条目）：

| 面 | 内容 | 落点 |
|---|---|---|
| `#1834` | 台账读面漏传 `boundary` ⇒ 跨项目静默空 | §5.1–§5.5（前段）+ §5.6（后半截） |
| `#1833` | 压缩触发可达性门 | `docs/core/design/CONTEXT-COMPACTION.md` §6.17 · `context.mjs` · 11-6–11-9 |
| `#1836` | 需求档压缩线四处互斥口径收正为 0.6 | `docs/core/requirements/CONTEXT-COMPACTION.md` §2.1 |
| `#1826` | `docs/core/design/DOC-DISCIPLINE.md` 判据写死 24 档（实读 54） | 该档四处 + 连带四处 |
| `#1810` | `historyPercent` 不吃 `_tokRatio`（定形，形式化在 §2.22–§2.30） | 待实施 |
| 95 点位 | B 类 41 删兜底 · C 类 23 改必传 · A 类 31 保留 | §5.6 |

**未批准（仍在册，不进本批交付面）**：`#1835`（台账读面零集成用例）· `#1837`（三端一致用例不存在 · 假担保）· `#1838`（`AGENTS.md` 24 档 · 产品文本面须另走设计+token）· `#1801` / `#1809` / `#1811` / `#1815` / `#1817` / `#1820` / `#1821` / `#1822` / `#1829` / `#1831` —— **逐条在册，不在本批**。

**批准时已知的代价**（不藏）：

- **组件间集成面零用例**（§5.6 ⑧ 自陈）：95 点位的绿只证明「既有断言不破 + 探针场景按预期」，不证明所有入口都对。
- **`#1837` 未修**：三端口径一致没有任何用例钉着，下一次改动仍可能各改各的。

## §5 实施记录（eng-coder）
**状态行**：实施完成（2026-10-27 第二轮：#1834 后半截——§2.13 B 类 41 处删兜底 + C 类 23 处改必传 + 注释 13 处 + 缺省收紧随动 6 处；A 类 31 处零改。check-syntax 284 OK；集成回归 25 + 9 + 6 + 9 全绿；「进程 cwd ≠ 目标项目」实测：读面 1 项/1 行、缺 boundary 当场失败、越界仍空账、写面仍抛（见 §5.6））



### 5.1 本段范围（§2 哪些条目落到本段）

| 条目 | 来源 | 本段处置 |
|---|---|---|
| `#1833` 条目 1：压缩触发加可达性门 | §2.14 ∥ §2.15 ∥ 设计 `docs/core/design/CONTEXT-COMPACTION.md` §6.17 | **已实现**——`thincoder-core/context.mjs` `compressIfNeeded` |
| `#1833` 条目 2：测试桩按内容分类 + 故事 1 三行「摘要请求 0」 | §2.18 | **已实现**——`test/integration/anthropic-tool-roundtrip.test.mjs` |
| `#1833` 用例 11-6 ∥ 11-7 ∥ 11-8 ∥ 11-9 | §2.17 ∥ §2.19 | **已实现**——`test/integration/context-overflow-guard.test.mjs` |
| `#1834` 五处 `boundary` 补传 | §2.3 | **本段零改**（父侧轻通道已落，实读在位：`ledger-read.mjs:41` ∥ `:45` ∥ `:54` ∥ `:55` ∥ `:60`；`read-data.mjs:77`；`ledger-migrate.mjs:197`） |
| `#1832` 设计档 §5 在册状态段 | §2.12 | **本段零改**（design 席已落） |
| `#1810` 上下文读数分叉 | §2.22–§2.29 | **不动码**（用户边界）——本段无工作面 |
| §2.13 的 95 点派工表 | §2.9 ∥ §2.13 | **不在本段**——按 §2.33（同档最新段）「§2.13 C 类清单……仍是将来批次的派工面」判；与 §2.9「vscode / server 同批落」的字面张力见 §5.5 ① |

### 5.2 代码改动（逐档 · 逐点）

| 档 | 改了什么 |
|---|---|
| `thincoder-core/context.mjs` | ① `NOTE_ESTIMATE`（注记 = `SUMMARY_TOKEN_ESTIMATE` + 注记前缀 + 占位句，按 §6.3 估算式，零新常数）；② `postCompactionTotal(agent, usage, middle)`——`post` 走估算支乘同一 `_tokRatio`；③ `compressIfNeeded` 的阈值早退与 `!split → shrinkOversized` **之后**加门：`if (!extras.force && postCompactionTotal(...) > threshold) return false`；④ `force` 的 JSDoc 从「只跳过 `tokens <= threshold`」改为「跳过阈值面全部早退判据（两条）」 |
| `thincoder-core/token-window.mjs` | `SUMMARY_TOKEN_ESTIMATE` 加 `export`（同处补一句「§6.17 门的 `note` 项同取本常量」）——行数不变 |
| `test/integration/context-overflow-guard.test.mjs` | ① `providerStub` 增 `{ toolCall }` 支（OpenAI 形 `delta.tool_calls` + `finish_reason:"tool_calls"`）；② `session()` 增 `tools` 形参；③ 新夹具 `shortHistory` ∥ `historyWithGiantAndTailResult` ∥ `lastToolResult` ∥ `giantTool` ∥ `toolCallChunks`；④ 新增 11-6 ∥ 11-7 ∥ 11-8 ∥ 11-9；⑤ `asciiTokens` 改取 `ASCII_CHARS_PER_TOKEN`（不再硬编码 3） |
| `test/integration/anthropic-tool-roundtrip.test.mjs` | ① `SUMMARY_SIG` + `isSummaryRequest(messages)`（看末条消息文本，串 ∥ Anthropic text 块两形）——分类**先于** role 检查；② 桩的「首个对话请求派工具调用」由序号改为「首个非摘要请求」；③ 1-1 ∥ 1-2 ∥ 1-3 各加「零摘要请求」断言；④ 各加 `assertFixedOverheadOverLine`（夹具前提：固定开销估算越过自动压缩线） |

### 5.3 读数（本段实跑）

| 面 | 命令 | 结果 |
|---|---|---|
| 11-1 … 11-9 | `node --test test/integration/context-overflow-guard.test.mjs` | **9 pass / 0 fail** |
| 故事 1 三行 | `node --test test/integration/anthropic-tool-roundtrip.test.mjs` | **3 pass / 0 fail** |
| 红-绿对（门关掉再跑） | 同上两档（`postCompactionTotal` 判据临时置 `false`） | 11-6 ✖（压缩事件 1 ≠ 0）· 11-8 ✖（压缩 2 ≠ 1，门前阈值面与强制面各压一次）· 1-1 ✖ / 1-2 ✖（各 1 发摘要请求）· 1-3 ✖（重开后回复 `no tool results`——工具结果被压缩吃掉）⇒ **恢复门后全绿** |
| 语法 | `node thincoder-core/scripts/check-syntax.mjs` | **284 file(s) OK** |
| 集成面诚实读数 | 11-6–11-9 = 本批新增用例，现已在盘并跑绿；`test/RTM.md` 的「结果」列仍 `待执行`（按既有行形由收口侧填） | — |

### 5.4 与 §2 / 设计档的偏离（逐条登记）

1. **11-7 的档与线上取值**：设计 §6.17 案例表写「同一档（128K 窗 / 线 76,800）」。该档在真实提示词下**不可构造**——`system + tools` ≈ 83,564 已越 76,800，门会拦掉一切压缩（那正是 11-6 的格）。故 11-7 用 1M 窗档 + 显式线 420,000 + 巨型工具 schema，使开销 ≈ 0.8 倍线且 `post ≤ 线 < total` 成为**紧判**；业务断言（压缩恰 1 · 摘要请求 1 · 回合请求 1 · 回复引用工具结果）逐条不变，另加三条夹具前提读数。
2. **11-6 ∥ 11-8 的线**：设计写「128K 窗档（压缩线 76,800）」；实现按「显式 `compactThreshold: 76_800` + 1M 窗档」——同守 76,800 这条线，但把守卫 `limit`（616,000）留在远处，使该例量的是**门**而不是守卫（128K 档 `limit` 只有 96,000，抬到 133K 的开销会让守卫先开火）。
3. **11-9 的入口**：设计写「CLI 会话里粘一段巨型日志」。实读 `keepTailSize` = `min(max(10, …), floor(0.4 × len))` ⇒ 任何 len ≥ 2 的会话都切得出中段，无中段支只在「整段历史就是那一条巨消息」时出现；故 11-9 走安全点直入（与 11-3 同口径，档头与用例内均已写明理由）。

### 5.5 报回（本段未改 · 外笔面）

> ① **[上抛·待裁] §2.9 与 §2.33 在「95 点」上的字面张力**：§2.9 写「父侧裁决：`vscode` / `server` 不在扫描之外、**同批落**」，§2.33 写「§2.13 C 类清单……仍是**将来批次**的派工面」。本段按 §2.33（同档最新段）+ §2.1 条目表（第 3 项「不在本批」）+ §2.6 D1（缺省不收紧）判 95 点不在本批写面，**未动任何一处**。若父侧本意是「本批落 95 点」，请回一句，本段按 §2.13 三张表续做。
> ② **设计档 §6.16.9 读数漂移**（eng-designer 笔）：`thincoder-core/context.mjs` 行写 `261` / `预计 +12~18`，实读 **290**（+29）；该行另写「零新 import」，而 import 面新增了 `SUMMARY_TOKEN_ESTIMATE`（§6.17 要求复用并导出该常量）。`test/integration/context-overflow-guard.test.mjs` 行写「预计 +4 例（结构不变）」，实读 278 → **413**（+135，新增一个夹具族）。该表未列 `test/integration/anthropic-tool-roundtrip.test.mjs`（本批实改 364 → 388）。
> ③ **`test/RTM.md` 两处与实现不符**（父侧/设计席笔）：11-6 的「怎么做」写「CLI 会话用 128,000 窗档（压缩线 76,800）」，实现是显式线 + 1M 档；11-9 的「怎么做」写「CLI 会话里粘巨型日志」，实现走安全点直入。另 11-6–11-9 的「结果」列仍 `待执行`。
> ④ **知会**：`applyCompression` 压完还会追加任务表回注与 plan 提醒，`post` 不含这两条（同向低估、不误拦）——已写进 `context.mjs` 的 `NOTE_ESTIMATE` 残余方向注释。

### 5.6 本笔（`#1834` 后半截 —— §2.13 B 类 41 处 + C 类 23 处 · 2026-10-27 第二轮）

**范围（父侧令改判）**：`#1800` 以后全归本批；§2.33 把 95 点推到将来批次的判断**由父侧改判为本批落**。A 类 31 处一处不动。

**判据（父侧给，非建议）**：① `agent.cwd` 必存在（装配期注入）⇒ 不存在「拿不到」的输入，故不加空值处理；② B 类只删不加（不写 `if (!x) throw`、不给默认值、不加告警）；③ `process.cwd()` 只是 CLI 端 adapter 的取值来源，不是系统默认界；④ A 类判据 = 该函数是不是命令行入口（有 `args` 解析 + `out` / `err`）。

#### B 类 · 41 处 · 27 档（删末尾回落到 `process.cwd()` 的那截）

| 档 | 点 | 删成什么 |
|---|---|---|
| `thincoder-core/agent/write-gate.mjs` | 2 | `:63` → `agent?.cwd`；`:158` 三元删净 → `agent.cwd` |
| `thincoder-core/agent-tools/bash-async.mjs` | 1 | `ctx?.cwd ?? parent.cwd` |
| `thincoder-core/agent-tools/batch-ledger-bind.mjs` | 1 | `cwd ?? ctx?.agent?.cwd` |
| `thincoder-core/agent-tools/batch-lifecycle.mjs` | 5 | `ctx?.agent?.cwd`（249 / 255 / 264 / 285 / 293） |
| `thincoder-core/agent-tools/batch.mjs` | 2 | `agent.cwd`（165 / 318） |
| `thincoder-core/agent-tools/doc-check.mjs` | 1 | `ctx?.agent?.cwd ?? ctx?.cwd` |
| `thincoder-core/agent-tools/eng.mjs` | 1 | `ctx.agent.cwd ?? ctx.cwd` |
| `thincoder-core/agent-tools/escalate-async.mjs` | 3 | `parent?.cwd`；`:77` `:88` → `relative(cwd, f)` |
| `thincoder-core/agent-tools/manifest.mjs` | 1 | `ctx?.agent?.cwd ?? ctx?.cwd` |
| `thincoder-core/agent-tools/read-history.mjs` | 3 | `resolve(baseCwd, …)` ×2；`ctx.agent?.cwd` |
| `thincoder-core/agent-tools/subagent-scheduler.mjs` | 1 | `parent.cwd`（`:82`；`:54` 属 C 类） |
| `thincoder-core/agent-tools/subagent-spawn.mjs` | 2 | `resolveBatchReadPath(parent.cwd, given)` |
| `thincoder-core/explore-distill.mjs` | 1 | `cwd: agent?.cwd` |
| `thincoder-core/ledger-surface.mjs` | 1 | `anchor ?? agent?.cwd` |
| `thincoder-core/ledger-tools.mjs` | 1 | `anchorOf = ctx?.agent?.cwd ?? ctx?.cwd` |
| `thincoder-core/team-ledger.mjs` | 1 | `cwdOf` 同上 |
| `thincoder-core/traces/trace-store.mjs` | 1 | `logCtx.cwd` |
| `thincoder-cli/src/tui/cmd-eng.mjs` | 1 | `agent.cwd` |
| `thincoder-cli/src/tui/cmd-mcp.mjs` | 1 | `agent?.cwd` |
| `thincoder-desktop/src/main/agent-assemble.mjs` | 1 | 三元删净 → `const base = cwd` |
| `thincoder-vscode/src/extension/panel-chat.mjs` | 1 | `_cwd()`（`\|\|` 形：只删尾巴） |
| `thincoder-vscode/src/extension/panel-index.mjs` | 1 | `cwd \|\| _cwd()` |
| `thincoder-vscode/src/extension/panel-turn-stages.mjs` | 2 | `_cwd()`（188 / 244） |
| `thincoder-vscode/src/memory-tool.mjs` | 1 | `projectMemoryDir(cwd)` |
| `thincoder-server/src/agent/chat.mjs` | 3 | `deps.cwd`（515 / 549 / 578） |
| `thincoder-server/src/agent/chat-env.mjs` | 1 | `cwd` |
| `thincoder-server/src/agent/chat-env-tools.mjs` | 1 | `ctx.cwd` |

#### C 类 · 23 处 · 18 档（内部函数 `cwd` / `boundary` 缺省参 → 必传）

| 档 | 点 | 改法 |
|---|---|---|
| `thincoder-core/ledger-db.mjs` | 2 | `resolveLedgerRoot` / `noRootMessage`：`resolve(boundary ?? process.cwd())` → `resolve(boundary)` |
| `thincoder-core/manifest-discovery.mjs` | 1 | `owningProject`：同上 |
| `thincoder-core/ledger-cmd.mjs` | 1 | `overdueOf(row, { now, base })`——`base` 去缺省（两调用点本就传 `baseOf(...)`） |
| `thincoder-core/ledger-read.mjs` | 1 | `ledgerExport`：`const anchor = cwd` |
| `thincoder-core/ledger-migrate.mjs` | 1 | `auditLedgerDir({ cwd, … })` 去缺省（唯一调用点已传） |
| `thincoder-core/ledger-variant-notice.mjs` | 1 | `{ cwd, … }` 去缺省（唯一调用点已传 `agent.cwd`） |
| `thincoder-core/agent-tools/batch-gate.mjs` | 1 | `const base = resolve(cwd)` |
| `thincoder-core/agent-tools/batch-paths.mjs` | 5 | `workspaceCandidates` / `declaredBases` / `resolveBatchReadPath` / `resolveBatchDocPath` / `resolveBatchCreatePath` 五处去缺省 |
| `thincoder-core/agent-tools/batch-read.mjs` | 1 | `listBatchRecords`：`const base = cwd` |
| `thincoder-core/agent-tools/review-facts.mjs` | 1 | `resolveReviewDocPaths`：`projectRootView(cwd)` |
| `thincoder-core/agent-tools/subagent-actions.mjs` | 1 | `touchedFilesNote`：`relative(cwd, f)` |
| `thincoder-core/agent-tools/subagent-scheduler.mjs` | 1 | `normalizeFileList`：`resolve(cwd, f)` |
| `thincoder-core/memory/memory-tool.mjs` | 1 | `join(opts.cwd, opts.projectDir)`（`projectDir` 缺位时该表达式不求值） |
| `thincoder-cli/src/cli/make-agent.mjs` | 1 | `attachManifest(agent, { cwd = agent.cwd, slotData })`（按 §2.13 括号：缺省改取 `agent.cwd`——`command-interactive.mjs:157` 未传 cwd） |
| `thincoder-cli/src/acp/resource-link.mjs` | 1 | `resolvePath(cwd, path)` |
| `thincoder-cli/scripts/doc-impact.mjs` | 1 | `gitChangedSurface({ base, extraFiles, cwd })` 去缺省 |
| `thincoder-vscode/src/embed-config.mjs` | 1 | `projectMemoryDir(cwd)`：`join(cwd, p)` |
| `thincoder-server/src/agent/chat-compact.mjs` | 1 | `compactTurnHistory({ …, cwd })` 去缺省 |

#### 注释面（现文写「缺省 = `process.cwd()`」，落码后改「必传」）

§2.13 点名的 7 行全改：`ledger-db.mjs:94` · `:109` · `:121` · `:125` · `:245-246`（`openLedger` 段，原记 `:246`）· `manifest-discovery.mjs:104` · `agent/live-batch.mjs`（§2.13 记 `:53`，本批实读 `:55`——前一轮改动漂移）。

**随语义失配一并改写的注释 6 处（不在 7 行内，属「注释须与代码一致」）**：`agent-tools/manifest.mjs:50-51` · `traces/trace-store.mjs:224-227` · `ledger-tools.mjs:26-29` · `team-ledger.mjs:29` · `ledger-read.mjs:38-39` · `batch-lifecycle.mjs:342` · `server/src/agent/chat-env-tools.mjs:8`。

#### 缺省收紧后必须随动的调用点（不在 §2.13 两表内 · 逐条给理由）

| 坐标 | 改法 | 为什么必须随动 |
|---|---|---|
| `thincoder-cli/src/acp/read-data.mjs:104` ∥ `:105` | `resolveLedgerRoot(cwd, cwd)` ∥ `ledgerDbPath(root, root)` | §2.3 曾判「非漏」的前提是**旧缺省值恰等于锚**；缺省去掉后不指名即当场失败 |
| `thincoder-core/ledger-migrate.mjs:103` | `resolveLedgerRoot(cwd, cwd)` | 迁移目标即根，界取自身 = 「不再向上找」（同 `findProject(anchor)` 形，§2.6 D3） |
| `thincoder-core/declaration.mjs:368` | `owningProject(targetAbs, parse(targetAbs).root)` + `import { parse }` | **取根面的界 = 目标所在盘根**（两面两界）；旧值 `process.cwd()` 在「目标不在进程 cwd 之下」时把归属一律判成出辖——同 `projectRootView` ∥ `manifest.mjs:69` 同一口径 |
| `thincoder-core/agent-tools/batch-gate.mjs:138` | `owningProject(resolve(abs), base)` | 门内自有 `base`（= 会话锚）；界不指即失败 |
| `thincoder-core/agent-tools/batch-paths.mjs:192` | `owningProject(b, parse(b).root)` + `import { parse }` | 逐基底取「基底自有项目根」= 取根面（盘根为界） |
| `thincoder-server/bin/thincoder-server.mjs:133` | deps 增 `cwd: process.cwd()` | **A 类端 adapter 取值点**（服务端进程价 = 该端锚）；不加则 `chat.mjs` 三处 `deps.cwd` 取得 `undefined`——删兜底变成换一个静默错值，比不删更坏 |

#### 读数（实跑）

| 面 | 命令 | 结果 |
|---|---|---|
| 语法 | `node thincoder-core/scripts/check-syntax.mjs` | **284 file(s) OK** |
| 11-1…11-9 | `node --test test/integration/context-overflow-guard.test.mjs` | **9 pass / 0 fail** |
| 故事 1 三行 | `node --test test/integration/anthropic-tool-roundtrip.test.mjs` | **3 pass / 0 fail** |
| 台账 / 批档面回归 | `ledger-close-proof` 1 · `batch-close-gate` 4 · `batch-ledger-bind + anchor-create + close-token-consume + gates-reanchor + live-batch-lock` 20 | **25 pass / 0 fail** |
| 取根面两档 | `manifest-workspace-init` 1 · `review-doc-scope` 5 | **6 pass / 0 fail** |
| 其余既有集成档 | `advisor-timeout-hot + browser-start-window + web-backend-404` | **9 pass / 0 fail** |
| CLI 读面冒烟 | `node thincoder-cli/bin/thincoder.mjs ledger list --json --cwd D:\teamcode\thincoder` | 1 项 / 全行集正常出（`runLedgerList` → `ledgerExport` → `resolveLedgerRoot(anchor, anchor)` 全链通） |

#### 「进程 cwd ≠ 目标项目」实测（`#1834` 的验收条件 · 临时项目 + 临时 HOME）

探针 `.thincoder/tmp/cwd-boundary-probe.mjs`（临时区，随后删）。`process.cwd()` = `D:\teamcode\thincoder`，目标项目在 `%TEMP%` 下另建（带 `PROJECT-MANIFEST.json`），HOME 指到同一临时区：

```
① ledgerCount({cwd:proj, boundary:proj})        → {"count":1,"overdue":0,"evidenceOversize":0}
② ledgerExport({cwd:proj})                      → {"projects":1,"rows":1}      ← 修前 {"projects":[]}
② ledgerQuery({cwd:proj, boundary:proj})        → 1 行
③ ledgerQuery({cwd:proj}) 缺 boundary           → THROW TypeError（不再静默空账）
③ resolveLedgerRoot(proj) 缺 boundary           → THROW TypeError
④ ledgerExport({cwd:outside})                   → {"projects":[]}（零抛——读面越界仍是空账）
⑤ openLedger(outside,{create,boundary:proj})    → THROW「台账：自 …\outside 未找到项目根…」（写面仍抛）
⑥ listBatchRecords({cwd:proj})                  → 0 项（该临时项目无 docs/batches，读数正确）
⑥ ledgerDbPath(proj, proj)                      → 键控库名正常取得
```

**③ 是本笔与修前的分界**：漏传 `boundary` 从「静默空账」变成「当场失败」，且**没有加任何替代分支**（无 `if (!boundary) throw`、无默认值、无告警——按判据②）。**代价如实记**：失败形态是原生 `TypeError`（`paths[0] must be of type string`），不是业务可读报因；要可读报因就必得加分支，与本笔判据相抵，故不加。

#### 偏离与未做（如实）

1. **`agent?.cwd` 里的 `?.` 保留**：判据②说「删的是末尾回落到 `process.cwd()` 的那截，不是整行」——`agent` 本体缺失是另一类输入（不是本笔判的 cwd 缺省），故只删尾巴。B 类 41 点全部按此形。
2. **§2.13 与 §2.33 的字面张力已由父侧裁定**：本笔按「本批落」执行，§2.33 的「将来批次派工面」表述**已失效**（父侧改判，§2 未同步——见「上抛」①）。
3. **组件间集成面零用例**（与 §2.11 同判）：本笔改动面在 `test/` 下无对应用例；上面的绿只证明「既有断言不破 + 探针场景按预期」，不证明「所有入口都对」。补它 = 新建用例档，仍在本轮写域之外。
4. **注释点 23 处的其余 16 处未改**：§2.13 只点名 7 行须改；其余注释点不是「缺省 = process.cwd()」表述（如实读），本笔不动。另 `.thincoder/tmp/r8-ledger-readings.mjs:19`（探针，非产品档）仍以旧形调 `ledgerAdd`，现会失败——临时区件，无调用方义务。
5. **继承自工作树的既有未提交改动**：本档 `git diff` 含前几轮（#1830 拆档等）未提交的改动，**不是本笔的**；本笔只落上面三张表 + 随动 6 处 + 注释 13 处。

#### 上抛

> ① **[上抛·知会]** `§2.33`（「§2.13 的 95 点仍是将来批次的派工面」）与本次派工（「本批落」）字面相反。本笔按父侧最新口径执行（用户「1800 以后都在这批处理」），§2 / §2.33 的旧表述**留在档上但已不成立**——建议父侧在 §2 追加一句收正（`§2` 非本段写面，未擅改）。
> ② **[上抛·知会]** 判据面单源仍是 `docs/core/design/LEDGER.md` §3.8。§2.33 记「四处误述已改为『缺省仍在』」——本笔把缺省删掉后，那一处的「代码侧现状」句随之失真；属 eng-designer 写面，未动。

## §6 验证与收口（父代理）

### 6.1 收口核验

| 项 | 读数 |
|---|---|
| 修复验证（关键场景） | 临时项目 + 临时 HOME，`process.cwd()` = `D:\teamcode`：`ledgerExport({cwd: proj})` **修前 `{"projects":[]}` → 修后 1 项 / 1 行** ✓ |
| 语法 | `node --check` × 3 档 **全 OK** |
| 台账/批档面集成回归 | **25 pass / 0 fail**（7 档） |
| 文档门 | 本档 · 见 §6.3 |

### 6.2 交付表

| # | 状态 | 要求 |
|---|---|---|
| 1 | ✅ Done | `ledger-read.mjs` 两处（`openLedger` / `ledgerQuery`）+ `ledgerExport` 三处调用点补 `boundary` |
| 2 | ✅ Done | `read-data.mjs` 的 `ledgerCount` 补 `boundary: ctx.getCwd()` |
| 3 | ✅ Done | `ledger-migrate.mjs` 的 `openLedger` 补 `boundary` |
| 4 | ✅ Done | 修复验证：进程 cwd ≠ 目标项目场景实测通过 |
| 5 | ✅ Done | 回归：台账/批档面 25 例全绿 |
| 6 | ⚠️ Simplified | `resolveLedgerRoot` 缺省未收紧（理由见 §1.7），残留登记在 `#1834` |

### 6.3 结算

**本笔边界**：只补 `boundary`，不改语义、不改表结构、不动工具面（工具面本就正确）。

**收口后动作**：`#1834` 核销。

### 6.1 验证读数（父侧实跑，非转述）

| 面 | 命令 | 读数 |
|---|---|---|
| 语法 | `node thincoder-core/scripts/check-syntax.mjs` | **284 file(s) OK** |
| 压缩门 | `node --test test/integration/context-overflow-guard.test.mjs` | **9 / 9 pass** |
| 故事 1 | `node --test test/integration/anthropic-tool-roundtrip.test.mjs` | **3 / 3 pass** |
| 台账核销 | `node --test test/integration/ledger-close-proof.test.mjs` | **1 / 1 pass** |
| 批闸 | `node --test test/integration/batch-close-gate.test.mjs` | **4 / 4 pass** |
| 文档门 | `doc_check(gate, 5 档)` | **PASS（0 段问题 · 5 档全清）** |
| B 类残留 | 全仓 grep `?? process.cwd()` ∥ `\|\| process.cwd()` | **剩 1 处**，VSC adapter 取值点（A 类，保留正确） |

### 6.2 `#1833` 的红-绿对照（coder 自测，父侧复核通过）

把门临时关掉再跑：**11-6 ✖（压缩 1≠0）· 11-8 ✖（压缩 2≠1）· 1-1/1-2 ✖（各 1 发摘要请求）· 1-3 ✖（重开后回复 `no tool results`）** ⇒ 恢复门后全绿。**测试真的在测这件事，不是碰巧绿。**

### 6.3 `#1834` 的分界线（coder 实测，父侧采信）

```
ledgerExport({cwd:proj})              → {"projects":1,"rows":1}   ← 修前 {"projects":[]}
ledgerQuery({cwd:proj}) 缺 boundary    → THROW TypeError（不再静默空账）
ledgerExport({cwd:outside})           → {"projects":[]}（越界仍空账，零抛——这条没变）
openLedger(outside,{create,...})       → THROW「未找到项目根」（写面仍抛）
```

**漏传从「静默换界」变成「当场失败」，这是本批的核心交付。**

### 6.4 未覆盖面（如实登记，不算已覆盖）

- **组件间集成面零用例**（§5.6 ⑧）：95 点位的绿不证明所有入口都对。
- **`#1837`（假担保）未修**：`docs/core/design/CONTEXT-COMPACTION.md:533` 声称三端一致由 `context-percent-parity.test.mjs` 钉死——**该用例全仓零命中**。三端能同时漂，根就在这里。
- **`#1838`（`AGENTS.md` 24 档）未修**：产品文本面，须另走设计 + token。
- **`#1810` 只到设计**：形式化在 §2.22–§2.30，设计档四处待解冻后落笔。

### 6.5 收口链自检

| 段 | 内容 | 判 |
|---|---|---|
| §1 讨论 | §1.1–§1.15（含 5 条已定决定） | ✓ |
| §2 任务与设计 | §2.1–§2.36 | ✓ |
| §3 设计评审 | 轮次 1–4（13 条发现逐轮收敛，第三轮 pass 签发 token） | ✓ |
| §4 用户批准 | 见上（整批令 FR36 + 三条随行裁定） | ✓ |
| §5 实施记录 | §5.1–§5.6 | ✓ |
| §6 验证与收口 | 本节 | ✓ |

**文档门**：`PASS`（5 档全清）。

### 6.6 台账联动

**核销**：`#1834`（漏传 boundary）· `#1836`（需求档三处互斥）。

**仍在册**：`#1810`（待实施）· `#1826`（已完成，待核销需挂本批）· `#1835` · `#1837` · `#1838` 及其余。

**新开**：无（`#1837` / `#1838` 已于本批登记）。

### 6.7 评审轮次最终态（第七轮补录）

**§3 共六轮**：轮次 1 changes-required · 2 changes-required · 3 pass · 4 changes-required · 5 changes-required（第六轮实例落盘时工具计数为「轮次 5」）· **6 pass（第七轮，🔴 0）**。

**状态行**：§3 = `评审完成`（合法关键词；声明里要的字面「评审通过」会被 §3 关键词闸拒——本档曾因 §3 无状态行连卡两次核销，现已落）。

**第七轮新增两条轻残留**（`#52` 已修）：`:414` 指空（验收改成单元断言后「同源」指向失效）→ 改指断言真实住址 · `:392` 序列少一步 → 补 `→ 正文` 与 `:408` / RTM 五步形对齐。

**§1 两次重开的账**（如实记，不抹）：① 轻通道只省时点不省全链，本笔曾误把 §2/§3 声明不适用 → 重开补齐 ② 父侧收口先于第五轮评审返回，评审 §3 写入被拒 → 重开补录。**两次都是父侧的操作顺序错，不是评审或实现的错。**

### 6.8 三次坐标读数事故（留作教训，非缺陷登记）

本批里父侧三次用 `Get-Content | Select-Object -Skip` 手算行号核对坐标，**偏 6~25 行**，并一度要求设计席按错值改「对的东西」；设计席拒绝照抄并给出 `node` utf8 逐行实读值。**判据：坐标一律 `node` 读 utf8 或 `grep` 带行号，`Get-Content` 手算不作数。**
