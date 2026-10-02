# 2026-10-01 · timer 唤醒投递
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-01 · 来源 = 用户 2026-10-01 17:48 现场报障（投递行挂死无动作）+ 父侧取证（17:26:29 到期 → 17:26:30 开轮但正文未达模型输入；台账 #799）。
> 台账 = #799（desktop · 归批）。前情 = docs/batches/2026-09-28-timer-wake-phase2.md（已收口 2026-09-28；承 §6.30 机制线）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-01
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**批次性质**：缺陷修复批（台账 #799）：**timer 到期唤醒投递未达模型输入**——用户 2026-10-01 17:48 现场报障（投递行挂死无动作）；父侧取证 = 17:26:29 到期 → 17:26:30 开轮（auto）但轮输入无 ⏰ 行（正文仅达 UI）。

**关键判据**：修复验收 = **断言「轮输入」含 `[System reminder: ⏰ timer — …]` 行**（三端各自测法）；出列 ∥ 注入 ∥ 落流 ∥ 开轮四环节零变化（缺陷在「机器线 push → 轮输入」存活/时序）。

**授权口径**：来源 = 用户现场报障 + 现场取证（需求 = 缺陷本身）；设计 = eng-designer（在跑；核档 §6.30.17 已落）；评审 = 设计落定后父侧按全自动授权代发；§4 代签 = 父侧。

**注**：t1/t2（16:45/17:02 到期遇在飞 = 设计零动作）投递语义并入本批一并核。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（评审轮 1 修正（#1–#5）已落——修正块 = §2.9）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.1 本批条目（覆盖 · 缺陷修复）

| # | 条目 | 判据（可复现） |
|---|---|---|
| D1 | **#799 修复**：timer 到期唤醒投递未达模型输入（桌面**窗内**路径）——唤醒轮已开、投递行只达 UI | 修复后同场景「轮起跑刻 `agent.history` 含逐字投递行」；三合一判据（UI 有 ⏰ 行 ∧ 该轮请求体无该行 ∧ 轮后槽档无该行）修后零——用例 T-TW36 先红后绿 |

条目来源 = 台账 #799（在途）+ 用户 2026-10-01 17:48 现场报障。**禁面遵守** = 本设计轮产品码零写 · 核件零触 · 批档 §1/§4/§6 零触。

### 2.2 根因结论（实读证据链 · 已实证）

**机制句**：窗内 timer 轮的**会话钉定重装住在投递之后**——重装 = `applySession` **整换** `agent.history`（`thincoder-core/session-lifecycle.mjs:113`），刚落进旧数组的投递行随弃（孤儿 delta）；UI 行（`ev:timer` = 投递同点出词）与模型输入就此分家。

**证据链（file:line）**：

1. 核件兑现支顺序 = **先投递后开轮**：`thincoder-core/agent/suspension.mjs:261-264`（`timerFace.deliver()` ⇒ `runTurn("", { autoTurn: true, timerTurn: true })`）；
2. 投递 = `history.push` 机器线：`thincoder-core/agent/timers.mjs:48-56`；`ev:timer` 出词同点 = `thincoder-desktop/src/main/timer-watch.mjs:22-24`；
3. 端装配 `driveTurn` **重装先于回合**：`thincoder-desktop/src/main/suspension-drive.mjs:159` ⇒ `turn-driver.mjs:149-152` ⇒ `session-io.mjs:26-32`（`loadAgentSlot`）；
4. `applySession` 整换数组：`thincoder-core/session-lifecycle.mjs:113`（`agent.history = [...machineMerged]`）；
5. 轮输入自新数组装配：`thincoder-core/agent/run-start.mjs:47-52`（`resume: resume || autoTurn`——auto 轮不重推输入）+ `setup.mjs:57`（`repairHistory` 保用户行）；env ∥ peer ∥ time（同档 `:151-154` ∥ `:164-168`）在重装之后注入 ⇒ 照达。

**现场物证（本轮新取证——直读请求体，非推证）**：trace `~/.thincoder/traces/2026-10-01/38478126a2c4-6602.jsonl` = 17:26:30 轮请求实体（343 条消息；末三条 = env ∥ peer ∥ time；全档零投递行）；日志 `09:26:30.693Z llm:start`（auto 轮开启）∥ `09:26:35.148Z llm:done`（turn 1）；同档 msg#86 = 更早 timer 行的**在场**（通道本身没坏——坏在窗内投递的存活）。

### 2.3 设计档落点（本设计轮）

- `docs/core/design/AGENT-LOOP-ASYNC-POOL.md`：新增 **§6.30.17**（症状/根因/修复形/零变不变量/三端射程表/用例 T-TW36–T-TW39/边界）+ §6.30.11 桌面块补「窗内投递存活」bullet + 变更记录一行——**已落 + 读回**（新节零 >300 行宽）。
- `docs/desktop/design/PROJECT.md`：§2.2 会话钉定段随动半句（「timer 轮的重装先于投递」）+ §4.2 本批块（两档行数）+ 变更记录一行——**已落 + 读回**（`:128` ∥ `:1251-1260` ∥ `:2094`——2026-10-01 同轮落）。

### 2.4 机制设计（修复形 · 桌面最小 · 核件零触）

timer 轮的钉定重装**先于投递**：

- `thincoder-desktop/src/main/suspension-timers.mjs` `faceOf().deliver`（`:41-45`）：**零在途早退**——`pendingTimerDeadline(agent) === null`（空在途判据 = `thincoder-core/agent/timers.mjs:25-34`；`suspension-timers.mjs:12` 已导入）⇒ 直接返 `false`（零重装 ∥ 零投递——与 T-TW37 臂 1 期望一致）；
  否则先 `reloadSlot?.(key, agent, cwd)` 再 `deliverExpiredTimers(...)`（投递行落**重装后**机读线 = 该轮将读数组）；`faceOf(key, agent, cwd)` 携 cwd；`createSuspensionTimers` 增 `reloadSlot` 注入项（同源缝 = `createSuspensionDrive` 既有 `reloadSlot` 转口）。
- `thincoder-desktop/src/main/suspension-drive.mjs` `driveTurn`（`:159`）：timer 轮零重装（`if (!timerTurn) reloadSlot?.(...)`——该轮重装已前移；二次重装会再吞一行）。

**零变不变量（§6.30 语义逐条保持）**：投递形态 = `history.push` 机器线逐字（D-TW2）· 两路共用（空闲闩 ∥ 窗内 deliver 同调 `deliverExpiredTimers`）· 开轮形 `{ autoTurn: true, timerTurn: true }` 零变 · 门三件 ∕ 帽 ∕ 开关逐字零改。**纯缺陷修复**（与 #443/#445/#446 线一致——机制语义零改；修正块 = §6.30.17）。

### 2.5 受影响文件与测试面（行数量级）

| 文件 | 现行 | 预期 |
|---|---|---|
| `thincoder-desktop/src/main/suspension-timers.mjs` | 68 | ≈73（`reloadSlot` 注入 + deliver 前移重装 + 注） |
| `thincoder-desktop/src/main/suspension-drive.mjs` | 305（**已越 300**——在册，拆分候选 = 残输入续发族 `suspension-resume.mjs`） | ≈309（+转口 + timer 轮条件 + 注） |
| `docs/batches/2026-10-01-timer-wake-delivery.test.mjs`（拟新增） | — | ≈200 行 · 四用例（T-TW36–T-TW39，`node --test` 直跑） |
| 核件 ∕ CLI ∕ VSC 产品码 | — | **零触碰**（射程表逐端判据在案） |

### 2.6 验收对照（回指派单验收）

| 验收点（派单） | 落点 |
|---|---|
| 根因结论（实读证据链——可复现判据） | §2.2（trace/日志/槽档三物证）+ 设计档 §6.30.17 |
| 修复落点（file:line + 修改形） | §2.4 + §6.30.17 修复形 |
| 三端射程表 | §6.30.17 射程表（桌面窗内 = 缺陷；desk idle ∥ CLI ∥ VSC 不受影响——各带 file:line） |
| 用例清单（先红后绿） | T-TW36–T-TW39（批内件；T-TW36 = 缺陷复现红→绿） |
| 行数量级 | §2.5 |
| 边界（不做） | §6.30.17 边界（核件零改 ∥ 其余轮零变 ∥ idle 径零变 ∥ 显示面零变 ∥ 不造投递确认机制） |

**注（复验口径 · 评审 #4 落）**：「请求体 ∥ 轮后槽档」两腿 = **现场复验口径**（非用例腿）——载体：请求体腿读 trace（轮请求实体 `~/.thincoder/traces/<date>/*.jsonl`）∥ 轮后槽档腿读该会话槽档（轮后 `contextHistory`）；
复读时点 ∥ 面 = 实施后**收口轮（§6）由父侧**现场同场景复跑后复读两物（用例腿侧 = T-TW36 代理「轮起跑刻 `agent.history` 含逐字行」——该数组即请求体来源：`thincoder-core/agent/run-start.mjs:47-52` ∥ `setup.mjs:57`）。

### 2.7 关键决策记录

| # | 决策 | 理由 / 被否面 |
|---|---|---|
| 1 | 修复住桌面两档（重装前移先于投递）· 核件零改 | 核件顺序（deliver→runTurn）为 §6.30 定形（开轮形零变约束）；重装是端侧机制、缺陷在端侧装配序。被否 = 核件增 `beforeDeliver` 面（为端缺陷增核面）∥ 改核件顺序（违开轮形零变）∥ 交付改经 `_pendingReminders`（动投递形态 + VSC 载体为包装对象不适用） |
| 2 | timer 轮 `driveTurn` 零重装（而非「重装后补投递」） | 补投递 = 双写（旧数组 + 新数组）+ 投递语义分叉；零重装 = 单写、序对 |
| 3 | idle 径 ∕ 其余轮 ∕ 显示面零变 | 缺陷面 = 窗内 timer 轮（唯一「投递先于重装」路径）；其余路径实读无缺陷——不扩射程 |
| 4 | 「在飞期到期」语义零变（同批裁定） | 在飞 = 步边界投递（`post-turn.mjs:18-21`，下游无重装）· 回合尾未及交链尾重同步——本修复只补窗内兑现段 |

### 2.8 上抛项

1. **批档 §1 讨论面为占位**：现态 = 模板占位；派单简报（#799 现场取证 + 设计要点）承载讨论内容——请父侧按需补填。
2. **行数在册**：`suspension-drive.mjs` **305** 已越 300（在册：拆分候选 = 残输入续发族）——本批 +≈4 不回线，维持在册。
3. **t1/t2 旁证**：trace msg#86 = 更早 timer 行在场（在飞期投递经 post-turn 存活）——原「未证」项有据。

### 2.9 评审轮 1 修正块（#1–#5 逐号 · 2026-10-01 · eng-designer）

承本档 §3 轮次 1（pass · 🟡2 ∥ 🔵3——父侧逐条裁收，按 Suggestion 列执行）。**§2 本体行就地收正**（逐号落点见下表——同轮已落，读回在册）；核档 `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.30.17 同拍落（+ 变更记录一行）。**零新语义**（口径 ∥ 判据 ∥ 坐标——由 = 本次评审发现）；产品码零触 ∥ `docs/desktop/design/PROJECT.md` 零触（已落——无待改）∥ 本档 §1/§4/§6 零触 ∥ 他批零触。**§3 各坐标 = 评审刻（修复前）现盘；现位以本块「落点」列为准。**

| # | 级 | 现 ⇒ 新 | 落点 ∥ 读回（现盘） |
|---|---|---|---|
| 1 | 🟡 | §2.3 第二项：「**未落**（D5 冻结窗……）⇒ 候冻解冻后落（上抛①）」⇒「**已落 + 读回**（`:128` ∥ `:1251-1260` ∥ `:2094`——2026-10-01 同轮落）」；§2.8 原①（PROJECT.md 随动冻结中——请父侧冻解冻后落）**整条撤**（内容已落）——余项重排 ①②③ | 本档 `:46` ∥ `:92-94`（读回：`:46` 尾 = 「已落 + 读回（…同轮落）」；§2.8 = 三项、无 PROJECT.md 条） |
| 2 | 🟡 | 修复形：「先重装再投递」（零在途时 `reloadSlot` 照调）⇒ 补**零在途早退**——`pendingTimerDeadline(agent) === null` ⇒ 直接返 `false`（零重装 ∥ 零投递——与 T-TW37 臂 1 期望一致）；否则先重装再投递。T-TW37 臂 1 期望保持原样 | 核档 `:774-775` ∥ 本档 `:52-53`（读回：两句在盘） |
| 3 | 🔵 | 修复形未钉 `reloadSlot` 同步前提 ⇒ 补钉：注入须**同步**（`deliver` 契约 = 同步 · 严格布尔——`§6.30.10 :572`；缺省 `null` ⇒ 重装步零动作）；`deliver` 返值仍布尔（`deliverExpiredTimers(...) > 0`） | 核档 `:778`（新句） |
| 4 | 🔵 | §2.6：三合一判据「请求体 ∥ 轮后槽档」两腿无载体 ∥ 复验口径 ⇒ 补注（两腿 = 现场复验口径（非用例腿）——载体 = trace ∥ 轮后槽档；复读时点 ∥ 面 = 收口轮（§6）父侧现场同场景复跑后复读两物） | 本档 `:78-79`（新注） |
| 5 | 🔵 | 射程表 CLI 行：「窗内回合带 `skipSession: true` 零重装」无坐标 ⇒ 补 `thincoder-cli/src/tui/suspension-drive.mjs:151` | 核档 `:787` |

**验收读回**：① 五条逐号落 + 读回（上表「落点 ∥ 读回」列）；② 修复形 × T-TW36（重装恰一次 · 先于投递）∥ T-TW37 臂 1（零交付 ⇒ 零开轮零重装——早退坐实）逐字自查一致；③ 本块五条齐备。**状态行随拍**（评审轮 1 修正五号 · 修正块 = §2.9）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Doc-state（R1/R7a） | 🟡 | 批档 §2.3 第二项（`docs/batches/2026-10-01-timer-wake-delivery.md:46`）与 §2.8 上抛①（`:88`）称 `docs/desktop/design/PROJECT.md` 随动「**未落**（D5 冻结窗…报告送达前零写入）」，但该档现盘三处俱在：`:128`（§2.2 会话钉定段半句「timer 轮的重装先于投递」）、`:1251-1260`（§4.2 本批「现行 ⇒ 预期」块，两档行数）、`:2094`（变更记录一行，日期 2026-10-01）；且 §2 状态行（批档 `:18`）自己写的是「PROJECT.md 随动三处同轮已落」——同一 §2 内自相矛盾（按 §2.3 读者会把已落面当活工单，按上抛① 会去找一个不存在的冻解冻窗口） | 按现盘把 §2.3 第二项与 §2.8① 收为「已落」口径（同步收/撤该上抛项），「D5 冻结窗」句改为历史注或删净——以 §2.3 与 PROJECT.md 一致为准 |
| 2 | Acceptance criteria | 🟡 | T-TW37 臂 1 期望「零交付 ⇒ 零开轮**零重装**」（`docs/core/design/AGENT-LOOP-ASYNC-POOL.md:796`）与修复形「`faceOf().deliver` 内**先** `reloadSlot?.(key, agent, cwd)` 再 `deliverExpiredTimers(...)`」（同档 `:774` ∥ 批档 `:52`）不相容：按字面实现，「在途零项」时 `reloadSlot` 仍被调用恰一次（该缝 = 整换数组——`thincoder-desktop/src/main/turn-driver.mjs:149-152` ⇒ `session-io.mjs:26-32` ⇒ `session-lifecycle.mjs:113`，非零动作），该臂会红；修复形未写任何零在途早退条件（可用原语 `pendingTimerDeadline(agent) === null`——「空在途」判据 = `thincoder-core/agent/timers.mjs:25-34`，已在 `thincoder-desktop/src/main/suspension-timers.mjs:11` 导入，正对应该臂输入） | 修复形补一句零在途早退（在途零项 ⇒ `deliver` 直接返 `false`、零重装），使实现与 T-TW37 臂 1 一致；或反向把该臂期望收窄为「零交付 ⇒ 零开轮（`reloadSlot` 调用不计）」并注明理由 |
| 3 | Clarity | 🔵 | 修复形把既有重装缝 `reloadSlot` 引入 `deliver()`（`AGENT-LOOP-ASYNC-POOL.md:774`），但未钉该缝的**同步**前提——核 `deliver` 契约 = 同步 · 严格布尔（同档 `:572`）；生产实现同步（`session-io.mjs:26-32` `loadAgentSlot` 无 await · `turn-driver.mjs:149-152` 闭包同步返值），当前无实害，但约束未落文 | 在 §6.30.17 修复形补钉一句：注入 `reloadSlot` 须同步（同源缝 = `createSuspensionDrive` 既有转口；缺省 `null` ⇒ 零动作），`deliver` 返值仍布尔（`deliverExpiredTimers(...) > 0`） |
| 4 | Acceptance criteria | 🔵 | §1 关键判据的「轮输入（请求体）含该行」腿在 §6.30.17 用例表（T-TW36–T-TW39，`:795-798`）无对应腿——T-TW36 以「轮起跑刻 `agent.history` 含逐字行」作代理（代理合理：该数组即请求体来源，`thincoder-core/agent/run-start.mjs:47-52` ∥ `setup.mjs:57` 保用户行），而「三合一」判据（`:770`）的请求体 ∥ 轮后槽档两腿无载体；本评审亦未复核外部物证（`~/.thincoder/traces/2026-10-01/38478126a2c4-6602.jsonl` ∥ 日志 `09:26:30.693Z llm:start`——评审面外 ⇒ `unverified`） | 在 §2.6 验收对照或 §6.30.17 判据行补该两腿的载体与复验口径（何时 ∕ 由何面复读），或注明其属现场复验收口径而非用例腿 |
| 5 | Citation precision | 🔵 | 射程表 CLI 行（`AGENT-LOOP-ASYNC-POOL.md:785`）「窗内回合带 `skipSession: true` 零重装」半句未给坐标（实读 = `thincoder-cli/src/tui/suspension-drive.mjs:151`；同行 `:207-212` = timerFace、已给） | 该半句补坐标 `thincoder-cli/src/tui/suspension-drive.mjs:151`（或注明与 `:207-212` 同档）——零语义 |

**计数**：🔴 0 ∥ 🟡 2 ∥ 🔵 3（复核面：AGENT-LOOP-ASYNC-POOL.md §6.30.10–§6.30.17 + 变更记录 · 批档 §2 全节 · PROJECT.md §2.2 ∕ §4.1 越层登记 ∥ §4.2 本批块 ∥ 变更记录 · 引用坐标逐条实读复核：`suspension.mjs:261-264` ∥ `timers.mjs:25-34 ∕ 48-56` ∥ `session-lifecycle.mjs:113` ∥ `run-start.mjs:47-52` ∥ `setup.mjs:57 ∕ 151-154 ∕ 164-168` ∥ `post-turn.mjs:18-21` ∥ `session-io.mjs:26-32` ∥ `suspension-drive.mjs:35 ∕ 157 ∕ 223` ∥ `suspension-timers.mjs:11 ∕ 35-40 ∕ 45-55` ∥ `turn-driver.mjs:149-152` ∥ `timer-watch.mjs:22-24` ∥ CLI `:151 ∕ 207-212 ∥ timer-watch.mjs:34-37` ∥ VSC `timer-watch.mjs:29-41 ∥ panel-chat.mjs:194-198`；行数双档 68 ∥ 305 与 §2.5 标注一致）。
VERDICT: pass

## §4 用户批准（主 agent）

**代签（父侧 · 2026-10-01）**：依据 = 用户全链自动授权 + 评审轮 1（pass——2🟡 ∥ 3🔵）+ 修复轮 1（§2.9 五条逐号落定 ∥ 父侧读回核讫：`:46` ∥ §2.8 三项 ∥ 核档 `:774-775` ∥ `:778` ∥ `:787`）。**批准范围** = §2 全（**以 §2.9 修正面为准**）：① 修复形 = `suspension-timers.mjs` `deliver` **零在途早退 + 重装前移**（核档 §6.30.17 同拍——已落）∥ ② `suspension-drive.mjs` `driveTurn` timer 轮零重装 ∥ ③ 批内件 T-TW36–T-TW39（先红后绿）∥ ④ 验收 = 批内件直跑（实施轮）+ 收口轮父侧现场复跑（请求体 ∥ 轮后槽档两腿复读）。实施 = eng-coder 单舱（3 档：两产品码 + 批内件）。

## §5 实施记录（eng-coder）
**状态行**：实施完成（三档落讫（两产品码 + 批内件）；先红 2 红 4 绿 ⇒ 后绿 6/6；审计 1 轮 clean ∥ 代码评审 1 轮 pass ∥ fix round 0 —— 终态 clean）



**一、交付摘要（三档 —— §2.4 ∥ §2.9 修正面逐字兑现；产品码 2 档 + 批内件 1 新件）**

- **改** `thincoder-desktop/src/main/suspension-timers.mjs`（68 ⇒ 75）：`createSuspensionTimers` 签名增 `reloadSlot = null` 注入项（同源缝 = `createSuspensionDrive` 既有转口；注释钉「须同步」——§2.9#3）；`faceOf(key, agent)` ⇒ `faceOf(key, agent, cwd)`，`deliver` 改为**零在途早退**（`pendingTimerDeadline(agent) === null` ⇒ 直接返 `false`——零重装 ∥ 零投递）⇒ 否则**先** `reloadSlot?.(key, agent, cwd)` **再** `deliverExpiredTimers(agent, key, { post, now }) > 0`（投递行落重装后机读线）；返值严格布尔零变。档头 + 厂注释同拍补 #799 两句。
- **改** `thincoder-desktop/src/main/suspension-drive.mjs`（305 ⇒ 308）：`createSuspensionTimers` 调用面转口 `reloadSlot`（同源缝单点）；`driveTurn` 重装行 ⇒ `if (!timerTurn) reloadSlot?.(key, agent, cwd)`（timer 轮零重装——重装已前移入 `deliver`）；`timers.faceOf(key, agent, cwd)` 携 cwd；档头补 #799 半句。
- **新** `docs/batches/2026-10-01-timer-wake-delivery.test.mjs`（257 行）：六 `test()` 块 = 四用例（T-TW36 臂 1 + 臂 2 ∥ T-TW37 臂 1 + 臂 2 ∥ T-TW38 ∥ T-TW39）；沙箱 = 核会话根隔离缝 + `mkdtemp`；核件取件经桌面端壳（#788 挂载面规范——防双实例 ⇒ 沙箱缝失效）。
- **零触**：核件 ∥ CLI ∥ VSC 产品码 ∥ 他档（射程表照旧；本舱只写 3 档）。

**二、行数实读（实施轮对盘 —— 父侧回填用）**

| 档 | 现行（改前） | 实读（改后） | 预期（§2.5） | 判定 |
|---|---|---|---|---|
| `thincoder-desktop/src/main/suspension-timers.mjs` | 68 | **75** | ≈73 | ✓（+2 = 厂注释折行） |
| `thincoder-desktop/src/main/suspension-drive.mjs` | 305 | **308** | ≈309 | ✓（越 300 咨询档 = 在册，拆分候选不变） |
| `docs/batches/2026-10-01-timer-wake-delivery.test.mjs`（新） | — | **257** | ≈200 | 注（超估 28%——六块含两臂，见五②） |

**三、验证读数**

- **先红**（改前 · 同一批内件原样直跑 `node --test docs/batches/2026-10-01-timer-wake-delivery.test.mjs`）= **2 红 4 绿**：
  - T-TW36 臂 1 红——`actual: ['slot-line']`（投递行被钉定重装整换吞掉 = 缺陷逐字复现；期望 = `['slot-line', '[System reminder: ⏰ timer — wake-799]']`）；
  - T-TW37 臂 2 红——`reloads 0 !== 1`（交付刻无重装 ⇒ 序未前移）；
  - 余四绿（T-TW36 臂 2 ∥ T-TW37 臂 1 ∥ T-TW38 ∥ T-TW39）= 零变不变量与射程腿的修前基线。
- **后绿**（修复后 · 同件零改直跑）= **6/6 全绿**（337ms）。
- **静态**：`node --check` 两档 ✓（编辑面同拍每次复核）。
- **回归子集**（改后直跑 8 档旧批内件）= 44 例 **34 绿 10 红**，10 红逐条归因**均非本批**：① 3 档 module-load 断（`d:\rc\...` 解析面——wave-a ∥ window-queue-parity ∥ digest-row-current-only）；② 6 腿 digest-teardown = renderer 行族面被他批在途改动击穿（`git status` 实读在册：`renderer/**` M/D 一片）；③ 1 例 `desktop-susp-queue` W9 AC-7「共用件 vs HEAD 零 diff」红因 = `thincoder-render-core/composer/panel.mjs` 被他批修改。**窗内驱动面 W1–W8 全绿**；`digest-teardown:505-513`（`suspension-drive.mjs` 记录写点锁）绿。
- 仓套件 = 父侧收口唯一跑点（本舱零跑——口径不变）。

**四、决策透明表**

| # | 决策 | 依据 ∥ 代价 |
|---|---|---|
| 1 | 早退判据 = 「零**在途**」（`pendingTimerDeadline === null`）而非「零**到期**」 | §2.9#2 逐字；代价 = 在途仅未到期时 `deliver()` 仍重装一次（T-TW37 臂 2 即该后果在案）；生产可达性窄（窗内等待串行 ∥ 到点即出列 ∥ 无取消面）——见五③ |
| 2 | 批内件补 T-TW36 臂 2（窗内用户回合重装照旧恰一次） | §6.30.17 零变不变量「其余轮重装时点零变」无对应用例，而 `if (!timerTurn)` 触及共享行 ⇒ 补一臂锁回归；代价 = 批内件超 §2.5 估（见五②） |
| 3 | 文档注释折行以贴预算（78 ⇒ 75） | §2.5 ≈73 预期；**内容零减**（仅折行），零语义 |
| 4 | 核件取件经桌面端壳（`session-slots.mjs`）而非直路 import | #788 挂载面规范（直路 = 第二 ESM 实例 ⇒ 沙箱缝失效）；代价 = 批内件依赖端壳 re-export 面 |

**五、披露/上抛（非阻塞）**

① **设计档坐标漂移**（本舱不改设计档——§4 授权面外）：核档 `AGENT-LOOP-ASYNC-POOL.md` §6.30.17 四组引数落笔于修复前盘，实施后已漂——
   `faceOf().deliver` 引 `:35-40`（现 `deliver` 在 `:41-45`、`faceOf` 在 `:38-47`）∥ 引 `suspension-timers.mjs:11` 已导入（现 `:12`）∥ `driveTurn` 引 `:157`（现重装门 `:159`）∥ 射程表桌面 idle 行引 `suspension-timers.mjs:45-55`（现 `fireIdle` `:49-62`）。
   请父侧收口轮按「实施后重锚」惯例（§6.30.13 ∥ §6.30.16 先例）处置。
② 批内件 257 行 vs §2.5 估 ≈200（+28%）：成因 = 六 `test()` 块（四用例含两臂）；如父侧需对账，本节即实测值。
③ 「零到期而仍重装」路径（T-TW37 臂 2 断言 `reloads=2`）= 设计判定，非缺陷；建议 §6.30.17 补一句可达性（仅直呼 `deliver` 可达）。
④ 存量笔误（早于本批，未改）：`suspension-timers.mjs:8`「宿主供四枚读缝」其列实为五项。
⑤ 「请求体 ∥ 轮后槽档」两腿（§2.6）= 父侧收口轮现场复跑口径，本舱未跑（`unverified` 面）。

**六、审计与代码评审轮次与终态（内部）**

- **explore 对置审计 1 轮 = clean**：四类偏差（PARTIAL ∥ SILENT-SIMPLIFICATION ∥ DOC-DRIFT ∥ OUT-OF-LIST）均未发现；A–D 四判据（修复形 ∥ timer 轮零重装 ∥ 用例表 ∥ 零触）全成立；其两条收口事务项（设计档坐标 ∥ 行数对账）= 本段一/二 + 五① 覆盖。
- **advisor 代码评审 1 轮 = pass**（🔴0 ∥ 🟡2 ∥ 🔵2——无 must-fix）：🟡① `suspension-drive.mjs` 308 行越 300 咨询档（在册，拆分候选不变）∥ 🟡② §5 待写——**已以本段落定**；🔵③ 设计档坐标重锚（五①）∥ 🔵④ 早退判据注（五③）。
- **fix round = 0**（无 must-fix；🔵 两项分归设计档/记录面，产品码零回改）——**终态 = clean**。
- 复跑口径：仓根 `node --test docs/batches/2026-10-01-timer-wake-delivery.test.mjs`（6/6 绿 · 337ms）；改前同件 = 2 红 4 绿（先红读数）。

## §6 验证与收口（父代理）

**§6 验证与收口（父侧 · 2026-10-01）**

**验收核验（现场复跑 · 父侧 19:59）**：探针 = 父侧实设 timer（180s · 消息携「#799 验收探针」字样）⇒ **到期 19:59:39 ⇒ 唤醒 19:59:41（+2s）**。三合一判据（修前 = 「UI 有行 ∧ 请求体无行 ∧ 轮后槽无行」）逐点破：① 轮输入 = ⏰ 行在场 ✓（直接观测）；② **请求体（trace `traces/2026-10-01/38478126a2c4-7694.jsonl`）= 投递行原样在消息数组**（`{"role":"user","content":"[System reminder: ⏰ timer — …]"}`——修前恰为「无该行」）✓；③ **轮后槽档（`…\u0026lt;cwdHash\u0026gt;.json.33`）= entry-form 在场**（@33590091）✓ —— **修复生效**。

**验收面（余）**：批内件 **6/6 绿**（先红 = 2 红 4 绿：缺陷逐字复现 `actual: ['slot-line']` ∥ `reloads 0 !== 1`）∥ `node --check` 两档 ✓ ∥ 旁证 = 窗内驱动面 W1–W8 全绿（键链回归 34 绿 10 红逐条归因均非本批）。行数：`suspension-timers.mjs` 68 ⇒ **75** ∥ `suspension-drive.mjs` 305 ⇒ **308**（越 300 咨询档——拆分候选在册）∥ 批内件 **257**。

**上抛处置（§5 五条）**：① 设计档坐标重锚 = **已落**（实施后收正轮——父侧核讫：核档 §6.30.17 四组现值 `:41-45` ∥ `:12` ∥ `:159` ∥ `:49-62`）；② 批内件超估（+28%）= **裁收**（成因 = 两臂用例）；③ 可达性注 = **已落**（核档 `:804`「裁定 = 非缺陷」+ 变更记录 `:904`）；④ 存量笔误 = 台账 **#804**（在册）；⑤ §2.6 两腿 = **本笔完成**（见上）。**未结新债**：无。

**台账**：#799 → 已核销（本笔落）。**收口**：记录冻结（close 随本笔）。
