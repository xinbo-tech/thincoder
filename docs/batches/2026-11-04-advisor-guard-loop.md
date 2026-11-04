# 2026-11-04 · advisor-guard-loop
> 六段，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 每段只有一个作者：作者的段可 `append` 加内容、可就地改（`edit`，§4.19）；非作者一概拒。
> 编制：主 agent · 2026-11-04 · 来源 = 外部用户来信（2026-10-29 WilliamCMurff@pm.me）：「advisor guard 死锁：提醒可无限重复（实测单会话 624 轮）」。
> 台账 = #2039（core · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-11-04
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

## 已定决定

- **已定决定**：修法口径 = **A ＋ B 两条一起**。A = 推回预算只在**真的推进**时清零（读文件 / 查代码这类不重置）；B = 同一类提醒设**硬上限**，不论状态机怎么重置都不再重复同一条。 · 用户原话：「A+B吧。」 · 时间：2026-11-04 19:35

## 现场实读（开工前定位 · 根因）

**这道 guard 的预算被每轮清零，所以「最多推 3 次」形同不存在：**

- `thincoder-core/agent/completion.mjs` 常量 `MAX_ADVISOR_PUSHBACKS = 3`；推回条件含 `advisorPushbacks < MAX_ADVISOR_PUSHBACKS`，命中后推一条 `[System reminder: you changed code in this run and MUST get an advisor review before finishing (round N)…]` 并 `return { action: "continue" }`。
- `thincoder-core/agent/turn-loop.mjs` 工具批执行处注释与赋值：「`// Model is executing tools → real work: reset guard pushback counters`」→ `guardPushbacks = 0` ∥ `advisorPushbacks = 0`。
- ⇒ 模型只要在两次收尾之间执行过**任意**工具批（读文件也算），预算就回满；收尾没调 advisor 就再推同一条提醒——**无限重复**。
- 与来信「单会话 624 轮」吻合：轮数墙有续跑机制，轮数可以一路涨，而计数器每轮重置。

**影响面**：仅 `advisor.guard === true` 且**非工程模式**的会话（`completion.mjs` 的推回条件带 `!agent.config?.agent?.engineering`）。VSC ∥ 桌面 ∥ CLI 共用核这一处 ⇒ 修一处三端同得。

## 本批范围与边界

- **改**：核的 advisor guard 推回预算语义（A）＋ 同类提醒的硬上限（B）。落点 = `thincoder-core/agent/completion.mjs` ∥ `thincoder-core/agent/turn-loop.mjs`，加设计档对应节。
- **不改**：verify guard 的推回预算（同处两行但语义不同，**基线读数须先量，别顺手动**）；工程模式路径（guard 本就不在工程模式生效）；轮数墙续跑机制（`turn-cap-continue`）——它是「624 轮」成立的另一半原因，**另议**，本批不碰。
- **共用常量风险**：`turn-loop.mjs` 那两行同时清零 `guardPushbacks`（verify 面）与 `advisorPushbacks`（advisor 面）。A 的改法会动到这一处共用点，**必须写清 verify 面是否随之改变语义**。

## 设计面父侧核验（2026-11-04 19:39）

**设计落点选得对**：权威面 = `docs/core/design/ADVISOR-CONVERGENCE.md` §6.4（推回预算的两层口径），另两档只改引用句——`docs/core/design/AGENT-LOOP.md` 的「≤3 轮」与 `docs/core/design/ADVISOR-GUARDS.md` §6.2 的「无 cap」句。后者原与代码常量 `MAX_ADVISOR_PUSHBACKS = 3` 自相矛盾，顺手收正是对的。

**设计所引坐标，我逐个实读确认在盘**：

- `FILE_MUTATORS` ← `thincoder-core/agent/helpers.mjs` ✅（A 的复位判据复用它，不立第二处）
- `!resume` 块 ∥ `_advisorRound` ← `thincoder-core/agent/run-start.mjs` ✅（复位点 1）
- `_calledAdvisorThisRun` ← `thincoder-core/agent/record-results.mjs` ✅（复位点 2 同步面）
- `thincoder-core/agent-tools/advisor-settle.mjs` ✅（复位点 2 异步面）

**上抛 1 裁定**：到顶（5 条）后**不加**用户可见的 `un-reviewed` 标记。理由 = 用户 19:35 的决定是「A+B吧」，加一个新的用户可见语义超出该决定的射程；要加另开一批。设计席默认不加，与此一致。

## 上抛 1 裁定更正（父侧 · 2026-11-04 19:43）

**前一条裁定作废**：我先前写「不加 `un-reviewed` 标记——超出用户决定射程，要加另开一批」。那一条错在两处，现更正如下。

**错处一：拿流程挡板回避真问题。**设计席问的是产品问题——「到顶（5 条）后代码没评审就放行，用户该不该知道」。我回的是「你没说过，所以不做」，并用用户原话当作这条界限的凭据。那是以流程代替判断。

**错处二：结论本身错。**这条 guard 的存在目的就是挡「未评审即交付」；到顶后静默放行且不留任何痕迹 = **把业务失败做成静默成功**，正是本机制最不该有的失败形状。

**正解 = 照同一档里 verify 面既有的到顶形态，不新造机制**：

- `thincoder-core/agent/completion.mjs` 第 122 行注释逐字「`// Exhausted retries — inject honesty reminder once`」；第 132 行提醒逐字开头「`[System reminder: ${MAX_VERIFY_RETRIES} verify attempts exhausted. You have not passed verification. Either state explicitly that your verification co…`」。
- ⇒ advisor 面到顶后同样**推最后一条**，口径与 verify 面同构：不再推回、收尾放行，但**要求模型在回答里明说「这段代码未经评审」**。
- **不是新语义**：不新增用户可见标记字段、不加 UI、不加配置键；复用同档既有的「到顶 ⇒ 诚实提醒」形态，只是把主语从 verify 换成 advisor。

**派单**：设计席修 §2（到顶行为一节）+ `docs/core/design/ADVISOR-CONVERGENCE.md` §6.4 的「到顶行为」条，加这一条并给验收（一条用例：到顶后模型收尾回答含「未经评审」声明）。

## 已定决定（续）

- **已定决定**：本批**只处理 advisor guard 预算误清零**（A+B+到顶诚实提醒）；设计轮提醒无上限与那条与代码矛盾的注释**另批**。 · 用户原话：「advisor guard 预算误清零那个毛病先处理吧。」 · 时间：2026-11-04 20:02

## 调查中查实的相邻缺陷（不在本批 · 已单列台账）

**一、设计轮提醒无上限、无去重**（实读坐标，供另批取用）：

- `thincoder-core/agent/post-turn.mjs` 常量 `DESIGN_TURN_NOTICE_AT = 5` ∥ `DESIGN_TURN_SKELETON_AT = 8` ∥ `DESIGN_FIRST_VERSION_TURNS = 15`；`designTurnReminder` 只对 `role === "eng-designer"` 生效，`used >= 5` 起**每轮注入一条**，`turn` = 链内累计轮号（跨段不重置）⇒ **没有上限、没有去重**。
- 与来信「提醒可无限重复（单会话 624 轮）」形态吻合（多段累计即可跑到六百余轮）。

**二、代码注释与代码实现相反（悬空裁定号）**：

- `thincoder-core/agent-tools/subagent-async.mjs` 第 320 行注释称「engineering && AUTO 自动 resume——§6.7.3 D-A3」；而 `thincoder-core/agent-tools/subagent-run.mjs` 第 168–171 行注释称「no longer auto-resumes … AUTO included」，且 `thincoder-core/agent-tools/checkpoint.mjs` 的实现只有三条出路（父 `send` 兑现 ∥ 中止 ∥ 不可答），**无自动 resume 分支**。⇒ 实现支持后者，前者是陈旧注释。
- 「D-A3」在 `docs/**/*.md` 只有三处命中，全在 `docs/batches/2026-10-26-context-overflow-absent.md`，讲的是上下文压缩池化比——**`§6.7.3 D-A3` 是悬空指针**。

**「624 轮」的定性**：来信未附日志，「父侧在 AUTO 下自行答 `send` 累计多段」是**推论**，不作实测结论引用。

## 评审轮 1 裁定（父侧 · 2026-11-04 20:05）

结论 `changes-required`（🔴 1 · 🟡 8），九条**全接受**，派修正轮一次改完。

| # | 裁定 | 要求 |
|---|---|---|
| 1 🔴 | 接受 | `docs/core/design/ADVISOR-CONVERGENCE.md` §3.1 的「completion guard 每 run 推回上限 `MAX_ADVISOR_PUSHBACKS`」与 §6.4 A/B 相反，且批档 §2 谎称「已一并收正」。改成两层口径指回 §6.4；调研证据行只写盘上实情。 |
| 2 🟡 | 接受 | 批档 §2 两处 `docs/core/design/ADVISOR-GUARDS.md`「§6.2 边界句」——该档 §6 无 §6.2 子节（`## 6. 同步面记账（F16——消费同谓词）`）。改引「§6 同步面记账 · 边界段」并引原句。 |
| 3 🟡 | 接受 | 到顶诚实提醒与第 5 条末条句**给逐字块**（照同档 verify 面形态），B-3 ∥ B-5 断言对齐同一份逐字。 |
| 4 🟡 | 接受 | 复位点 1（`if (!resume)` 块）与 `restoreGuard` 回填**顺序与消费点写死**；说明 digest 自动回合是否过该块；补一条「自动回合不把计数清零」的读数。 |
| 5 🟡 | 接受 | B 面补错误／老形态用例：两字段缺失 ⇒ 视作 0 ∥ false，首条仍推、计数到 1。 |
| 6 🟡 | 接受 | 新名逐个给三问之一：`MAX_ADVISOR_REMINDERS` ∥ `_advisorReminders` ∥ `_advisorHonestySent` ∥ `hasSuccessfulFileMutation`（`honestReminderInjected` 的「现成不可用」已有，保留）。 |
| 7 🟡 | 接受 | 调研证据行补公开源一句（照 `docs/core/design/ADVISOR-GUARDS.md` 的「公开源核查：`index.publicRepos` = `[]` ⇒ 已查无」形态）。 |
| 8 🟡 | 接受 | 集成行编号**设计期定**（照 `docs/core/design/AGENT-LOOP.md`「编号先行 · 已落 `test/RTM.md`」先例）：故事号 + 行号落 `test/RTM.md` 并把该行为证引一句；不再是「实施时再落」。 |
| 9 🟡 | 接受 | tier 结论改成**体量层**口径（哪几档跨层／无档跨层），不写「全在 core 同一层内」这种模块分层表述；不写计数。 |

**修正轮边界**：只落这九条，不夹带新语义、不动已批准的三层口径本身。

## 评审轮 2 裁定（父侧 · 2026-11-04 20:11）

结论 `pass`（九条全 Fixed · 新报 🟡 2 · 🔵 1）。处置：**N1 / N2 派小修正轮改掉**，N3 不改（`§1` 是讨论面的历史陈述）。

| # | 裁定 | 要求 |
|---|---|---|
| N1 🟡 | 修 | 末条句「the guard will not push again」与同节「推满 5 条后再推一条诚实提醒」相反。改成「这是本类提醒的最后一条」形态，别许诺「不再推」。B-3 断言随之对齐。 |
| N2 🟡 | 修 | 断言「第 1–4 条不含 `reminder` 句」与共用正文自带 `[System reminder: …` 相撞。判据改引末条句字面 `This is reminder`。 |
| N3 🔵 | 不改 | `§1` 讨论段仍引 `docs/core/design/ADVISOR-GUARDS.md` §6.2——那是 19:39 核验的历史陈述，记录面不动。 |

**修正轮边界**：只改这两处文案与断言引法，不动 A ∥ B ∥ 到顶三层语义。

## 实施席上抛裁定（父侧 · 2026-11-04 20:26）

实施席按设计落地、未擅改机制，两条上抛**都是设计缺口**（父侧与评审均未看出）。裁定：**两条都修**，走设计面修正轮，再回实施席。

**缺口一（严重）——层 1 先耗尽时诚实提醒永不发**：实读 `thincoder-core/agent/completion.mjs` 的到顶条件是 `unreviewed && (agent._advisorReminders ?? 0) >= MAX_ADVISOR_REMINDERS && !agent._advisorHonestySent`。层 1 预算（3 条）在「模型改过一次代码后只读不写」时先耗尽，计数停在 3，到顶条件不成立 ⇒ **直接 `done`，零诚实提醒**。这正是本批要挡的「未评审即交付且静默」。

**缺口二——子代理合并改代码不进 A 的进展判据**：`docs/core/design/ADVISOR-CONVERGENCE.md` §6.3 表把「子代理代码合并」列为评审失效 = 是，但合并不是 `FILE_MUTATORS` 工具调用 ⇒ 全委托会话里 A 永不回满，形同上。

**修法（父侧定口径，设计席落笔）**：

1. **到顶口径改为「任一层停推即发诚实提醒」**：不再要求计数到 5——只要本回合判定为「未评审」且这一轮没推成（层 1 或层 2 任一耗尽），就推**一条**诚实提醒再放行。语义仍是「提醒是提醒、不焊死回合」，但静默途径被堵死。
2. **A 的进展判据补「子代理代码合并」**：合并进父侧修改追踪（`mergeChildMutations`）同样算被审对象变了 ⇒ 复位 advisor 预算。
3. **`docs/core/design/AGENT-LOOP.md` 的「7 键标记集」改 9 键**（本批加两键后已漂移）。

**修正轮边界**：只落这三条 + 对应用例与 RTM 行；A ∥ B 的数值（3 ∥ 5）与两层结构零改。

## 实施席上抛裁定之二（父侧 · 2026-11-04 20:39）

**冲突**：§6.4 写「此条之后不再推，收尾按 `done` 放行」、逐字文案写「no more will be sent for this code」；但推回条件只有两层合取，缺 `!_advisorHonestySent`。可达形态：层 1 先耗尽 ⇒ 发诚实提醒 ⇒ 模型随后成功写一次文件 ⇒ 层 1 回满 ⇒ 又推第 4 条「MUST get an advisor review」，与刚许诺的「不再推」相反。

**裁定 = 第三条路，两个极端都不取**：

- **不取「加 `!_advisorHonestySent`」**：那样本轮之后本周期彻底静默——模型再改代码也未评审，收尾一声不响。这是本批要堵的形状，等于把它挪到下一个窗口。
- **不取「承认有新进展即可再推」**：那样「不再推」那句成了空话，且与用户「同一类提醒设硬上限」的裁定字面冲突。

**取：诚实提醒是「每次停推且仍未评审」的收尾一条，位随新进展复位。**

- `_advisorHonestySent` 与 `advisorPushbacks` **同一处复位**（写序推进点）：有新进展 ⇒ 该次交付重新需要一句话。
- 由此每次「未评审即交付」都必带一条诚实提醒，**不存在静默交付**；而重复次数由「模型真改了几次」自然限定，不靠计数器。
- **文案不得再许诺「不再推」**：删掉「no more will be sent for this code」这半句，改为只陈述事实（几条已发 ∥ 代码未评审 ∥ 二选一：现在调 advisor 或在回答里明说）。
- 层 1（3）∥ 层 2（5）的数值与两层结构**零改**。

**执行顺序（父侧定）**：本裁定已写入 §1，实施席按此落代码；设计面同步（§6.4 到顶条 ∥ 逐字文案 ∥ 三处陈旧句）由设计席同一批跟进，不算代码先行。

**顺带三条陈旧句一并修**（实施席审计报来，父侧核实成立）：`hasSuccessfulFileMutation` 退役后 §6.4 仍写其实读；设计档与 §2 把 verify 面写成「有成功工具批才复位」而盘上是无条件 `guardPushbacks = 0`；§2 受影响文件表漏集成用例档。

## 实施席第 2 轮交付裁定（父侧 · 2026-11-04 20:44）

六条漂移 + 一条缺行，**全接受**；先派设计席同步设计面与 RTM（补 `32-4`），再回实施席补那条端到端用例。

| # | 裁定 | 要求 |
|---|---|---|
| 1 | 修 | §6.4 到顶诚实提醒逐字样句删掉「no more will be sent for this code」（盘上代码已删）。 |
| 2 | 修 | §6.4 两处「实读」引的是退役的 `hasSuccessfulFileMutation` 与旧到顶条件，改引现行形。 |
| 3 | 修 | §6.4「复位点穷举（两处）」改三处：加写序推进点（位随进展复位）。 |
| 4 | 修 | verify 面那句「仍按有成功工具批复位」与盘上无条件 `guardPushbacks = 0` 不符，按实情写。 |
| 5 | 修 | `test/RTM.md` `32-1`「诚实提醒只发一次（再收尾即放行）」改为「无新进展时只发一次」。 |
| 6 | 修 | 批档 §2 受影响文件表补集成档 `test/integration/advisor-guard-reminder-cap.test.mjs`。 |
| 7 | 修 | `test/RTM.md` 故事 32 新增行 `32-4`：诚实提醒已发 → 又有新进展 → 下一次停推再得一条。编号先行，行先落盘，实施席随后补用例。 |

## 收口前裁定（父侧 · 2026-11-04 20:57）

实施席第 3 轮交付裁定：`32-4` 用例落地，**4/4 集成 + 17/17（含回归）**，消融 E 反向成立（删 `_advisorHonestySent = false` 那行 ⇒ `32-4` 红在「诚实提醒后又改代码却静默放行」，恢复后档 SHA256 前后一致、零残留）。

**父侧独立复验读数**（本轮实跑，不采信子代理报告）：

- `node --test docs/batches/2026-11-04-advisor-guard-loop.test.mjs` ⇒ **13 pass / 0 fail**
- `node --test test/integration/advisor-guard-reminder-cap.test.mjs` ⇒ **4 pass / 0 fail**
- `thincoder-core/agent/turn-loop.mjs` 实读：`if (wroteSince(agent, agent._mutSeqMark)) {` 之内 `advisorPushbacks = 0` 与 `agent._advisorHonestySent = false` 两行相邻；`guardPushbacks` 仍为无条件清零（verify 面零改）
- `thincoder-core/agent/completion.mjs` 实读：到顶条件含 `((agent._advisorReminders ?? 0) >= MAX_ADVISOR_REMINDERS || advisorPushbacks >= MAX_ADVISOR_PUSHBACKS)`
- `thincoder-core/agent/helpers.mjs` 实读：`INHERITED_GUARD_KEYS` 含两新键；`hasSuccessfulFileMutation` 已删

**两件收尾**：① 派 `#42` 正 `§2` 的「三条」↔ 四组件数目不符（设计席笔）；② RTM 故事 32 四行的执行列由实施席填（`test/RTM.md` 不在任何 `docRoot` 下 = 产品面）。②随 `#42` 之后的实施席一笔落。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试覆盖 / 验收对照 / 关键决策 / 上抛项>

**覆盖条目（本批）**

| # | 条目 | 判据来源 |
|---|---|---|
| 1 | **A**：advisor 推回预算只在「被审对象真的变了」时回满——判据 = 本批内父侧**写序** `agent._mutationSeq` 推进（谓词 `wroteSince(agent, agent._mutSeqMark)`）；写序有两个写者：**成功的文件写工具**（`FILE_MUTATORS`）与**子代理代码合并**（`mergeChildMutations`）。读文件 / 查代码 / bash / git 一概不复位 | 批档 §1 已定决定（用户原话「A+B吧。」）+ §1「缺口二」裁定（20:26）；现场实读 `thincoder-core/agent-tools/advisor-settle.mjs` 的 `noteMutations`（唯一推进面） |
| 2 | **B**：同一类提醒设**未评审周期**硬上限 `MAX_ADVISOR_REMINDERS = 5`，续跑与段重启都不回满；**两层任一停推**（层 1 或层 2 耗尽）即推**一条诚实提醒**（要求模型在回答里明说「这段代码未经评审」），此后放行收尾 | 同上 + §1「缺口一」裁定（20:26）；现场实读 `thincoder-core/agent/completion.mjs`（`advisorPushbacks` 是 `runAgent` 局部量，每次进入归零）；到顶形态 = 本档 §1「上抛 1 裁定更正」（19:43） |

**不在本批（明文边界）**

- verify guard 的推回预算（`guardPushbacks`）：语义零改——仍在工具批执行处**无条件**清零（成功的批与报错的批同清零；盘上逐字 `guardPushbacks = 0` 与注释「任一工具批即回满」）；本批只动 advisor 面。
- 轮数墙续跑机制（设计面 `docs/core/design/TURN-CAP-CONTINUE.md`）：它是「624 轮」成立的另一半原因，另议。
- 工程模式路径：推回条件本身带 `!agent.config?.agent?.engineering`，guard 本就不在工程模式生效。
- 到顶后**不加**任何用户可见标记 / 新字段 / 配置键——要求模型在回答里明说「未经评审」，形态照 verify 面到顶的诚实提醒（见覆盖条目 2）。

**设计档落点（权威面单处）**

- 机制权威 = `docs/core/design/ADVISOR-CONVERGENCE.md` §6.4（A ∥ B 两层口径、复位点穷举、到顶行为），公式块 §6.2 加层 2 一行。
- 两处回指改写、不复写细节：`docs/core/design/AGENT-LOOP.md` 步骤 4「≤3 轮」→「≤3 条 / 进展窗口 ∥ 周期 ≤5 条，见 §6.4」；`docs/core/design/ADVISOR-GUARDS.md` §6 同步面记账 · 边界段（该档 §6 自身标题是「## 6. 同步面记账（F16——消费同谓词）」，无 §6.2 子节）——盘上现为逐字「guard 推回上限本身的语义 = 两层口径（进展窗口 ≤3 条 ∥ 未评审周期 ≤5 条），权威面」+ 指回 `docs/core/design/ADVISOR-CONVERGENCE.md` §6.4。改前写「无 cap」，与代码常量 `MAX_ADVISOR_PUSHBACKS = 3` 自相矛盾，属一致性面就地收正。

**机制设计（逐字以 §6.4 为准，此处只落点）**

- **A 落点**：`thincoder-core/agent/turn-loop.mjs` 工具批执行后那两行拆开——`guardPushbacks = 0` 逐字保留；`advisorPushbacks = 0` 改为「本批写序推进了才复位」，谓词 = 同档既有的 `wroteSince(agent, agent._mutSeqMark)`（`_mutSeqMark` 每轮头前移，批后比一次）。写序的两个写者（成功的 `FILE_MUTATORS` 写 ∥ 子代理合并）都在 `noteMutations` 一处推进 ⇒ **A 不新增判据、不新增常量、不新增字段**；本轮早先引入的 `hasSuccessfulFileMutation` 随之退役（原因见「关键决策」第 5 条改写）。
- **B 落点**：`thincoder-core/agent/completion.mjs` 常量区加 `MAX_ADVISOR_REMINDERS = 5`；推回分支 `agent._advisorReminders = (agent._advisorReminders ?? 0) + 1`，推回条件加 `(agent._advisorReminders ?? 0) < MAX_ADVISOR_REMINDERS`；第 5 条（末条）文案 = 既有正文 + 末条句，逐字见设计档 §6.4「末条推回文案」块（此处不复写，单源在彼）。
- **B 到顶落点（同 guard 块内，推回条件之后）**：`unreviewed`（`!pending && _mutatedThisRun && !_calledAdvisorThisRun && hasCodeMutations(agent)`）仍成立、且**任一层停推判据** `((agent._advisorReminders ?? 0) >= MAX_ADVISOR_REMINDERS || advisorPushbacks >= MAX_ADVISOR_PUSHBACKS)`（层 1 或层 2 耗尽）、且 `!agent._advisorHonestySent` ⇒ 置 `_advisorHonestySent = true`、推一条诚实提醒、返回 `action: 'continue'`；`_advisorHonestySent` 已真 ⇒ 返回 `action: 'done'` 放行。文案逐字 = 设计档 §6.4「到顶诚实提醒文案」块（条数写实 `agent._advisorReminders`，不写死 5）。
- **B 状态跨段存活**：`_advisorReminders` ∥ `_advisorHonestySent` 加入 `thincoder-core/agent/helpers.mjs` 的 `INHERITED_GUARD_KEYS`（`snapshotGuard` / `restoreGuard` 共用清单）——否则自动回合留下的 guard 三态被回填、计数不随，下一次用户回合计数归零、上限形同没设（依据见设计档 §6.4「状态的跨段存活」）。两字段读法用 `?? 0` / `?? false`，故 `thincoder-core/agent.mjs` 默认对象零改。
- **B 复位点（穷举三处，别处零写）**：① `thincoder-core/agent/run-start.mjs` 的 `if (!resume)` 块里 `_inheritedGuard` 为空的 `else` 支（`_verifyRetries = 0` / `_advisorRound = 0` 所在），并加「非自动回合」合取——`restoreGuard` 与之互斥故无先后之争，消费点 = 同块 `_inheritedGuard = null`（顺序与自动回合读数见设计档 §6.4「复位点穷举」条 1）；② 评审覆盖成立处 = `thincoder-core/agent/record-results.mjs` 同步面（`_calledAdvisorThisRun = true` 的同一处，未完成尾不计）与 `thincoder-core/agent-tools/advisor-settle.mjs` 异步非陈旧结算；③ 写序推进点 = `thincoder-core/agent/turn-loop.mjs` 工具批执行处的 `if (wroteSince(agent, agent._mutSeqMark))` 块——`advisorPushbacks = 0` ∥ `_advisorHonestySent = false` 两行手拉手。前两处复位计数 + 诚实提醒位，第三处**只**复位诚实提醒位（`_advisorReminders` 是周期上限，不随进展复位）。

**受影响文件（尺寸档结论：六份源码档各为单点改动，无一越档、零拆分计划；设计档与批档是 `.md`，零尺寸档位义务；数值不落档）**

| 文件 | 改动 |
|---|---|
| `thincoder-core/agent/helpers.mjs` | `INHERITED_GUARD_KEYS` 加 `_advisorReminders` ∥ `_advisorHonestySent`（A 复用既有 `wroteSince`——零新增谓词） |
| `thincoder-core/agent/turn-loop.mjs` | A：advisor 预算复位判据改成本批写序比 `wroteSince(agent, agent._mutSeqMark)`；`guardPushbacks = 0` 逐字保留 |
| `thincoder-core/agent/completion.mjs` | B：常量、计数、推回条件（两层合取）、末条文案、到顶诚实提醒（**任一层停推** + 一次性位） |
| `thincoder-core/agent/run-start.mjs` | B：`!resume` 块复位计数 + 诚实提醒位 |
| `thincoder-core/agent/record-results.mjs` | B：同步覆盖成立处复位计数 + 诚实提醒位 |
| `thincoder-core/agent-tools/advisor-settle.mjs` | B：异步非陈旧覆盖成立处复位计数 + 诚实提醒位 |
| 设计面三档：`docs/core/design/ADVISOR-CONVERGENCE.md` · `docs/core/design/AGENT-LOOP.md` · `docs/core/design/ADVISOR-GUARDS.md` | 设计面（已落） |
| `docs/batches/2026-11-04-advisor-guard-loop.test.mjs` | 本批单测文件（收口删除） |
| `test/integration/advisor-guard-reminder-cap.test.mjs` | 本批集成用例档（RTM 故事 32 的 `32-1`…`32-4` 同号逐字） |

**验收对照 + 用例表（逐条回指覆盖条目；正常 ∥ 边界 ∥ 错误）**

命令：`node --test docs/batches/2026-11-04-advisor-guard-loop.test.mjs`

| 用例 | 类型 | 输入 | 期望读数 | 回指 |
|---|---|---|---|---|
| A-1 | 正常 | 假 agent（`_mutationSeq = 0`）上一次成功写记账 `noteMutations(agent, [路径])` | `wroteSince(agent, 0)` === `true`——写序推进即判进展 | 1 |
| A-2 | 边界 | 只读批（`read` ∥ `grep` ∥ `bash` ∥ `git`，全不调 `noteMutations`） | `wroteSince` === `false`——只读与环境操作不回满预算 | 1 |
| A-3 | 错误 | 写入报错的批（`noteExecutedMutation` 的 `Error:` 前缀门挡住、不记账） | `wroteSince` === `false`——没改成代码就不算进展 | 1 |
| A-4 | 正常（缺口二） | `mergeChildMutations(parent, child)`（child 带 `_mutatedThisRun` + `_touchedFiles`）；同形零改的子代理（无 `_touchedFiles`） | 前者 `parent._mutationSeq` 推进 ⇒ `wroteSince(parent, 旧值)` === `true`；后者不推进 ⇒ `false`——子代理合并算进展 | 1 |
| B-1 | 正常 | 连调 `handleCompletion`，`_advisorReminders` 0→5 | 前 5 次各推一条提醒并返回 `action:'continue'`（第 5 条带末条句）；第 6 次推诚实提醒并 `action:'continue'`；第 7 次返回 `action:'done'` | 2 |
| B-2 | 边界 | 计数已达 5 且 `_advisorHonestySent` 为真，条件其余全满足 | 不推回、不再发诚实提醒、`action:'done'`——续跑重进 `runAgent` 也拿不到第 7 条 | 2 |
| B-3 | 边界 | 第 1–5 条推回文案逐字 | 第 5 条含 `This is reminder 5 of 5 — the last one` ∧ `state explicitly in your reply to the user that this code has not been reviewed`；第 1–4 条文案里无 `This is reminder` 字面（五条共用开头 `[System reminder: `，「含 reminder 一词」不作判据）。逐字取设计档 §6.4「末条推回文案」块 | 2 |
| B-4 | 正常 | 覆盖成立后的计数与一次性位 | `_advisorReminders` 归 0、`_advisorHonestySent` 归假（下一周期完整预算，且可再发一次诚实提醒） | 2 |
| B-5 | 正常 | 计数已达 5、`_advisorHonestySent` 未置 | 推一条诚实提醒并 `action:'continue'`；文案含 `advisor reminders sent.` ∧ `state explicitly in your reply that this code has not been reviewed`（条数写实，不写死 5）。逐字取设计档 §6.4「到顶诚实提醒文案」块 | 2 |
| B-6 | 边界 | `snapshotGuard(agent)` → `restoreGuard(target, snap)`（自动回合携带） | `_advisorReminders` ∥ `_advisorHonestySent` 随 `INHERITED_GUARD_KEYS` 往返——段重启不归零 | 2 |
| B-7 | 错误（旧形） | 两字段都不存在的裸 agent 对象跑首轮判定 | 视作 `_advisorReminders = 0` ∥ `_advisorHonestySent = false`——首条提醒照推、推后计数读作 1；无 `undefined` 进入比较、不抛 | 2 |
| B-8 | 边界（缺口一） | 层 1 先耗尽：`advisorPushbacks` 已到 `MAX_ADVISOR_PUSHBACKS`、`_advisorReminders = 3`、`_advisorHonestySent` 未置、`unreviewed` 全真 | 推一条诚实提醒并 `action:'continue'`，文案条数写实 3（不是 5）；再调一次 ⇒ `action:'done'`、不再推 | 2 |
| B-9 | 正常（§1 20:39 裁定） | 诚实提醒已发（位为真）后写序再推进一次，随后仍只读、不调 advisor | 位随写序推进点归假 ⇒ 下一次「停推且仍未评审」的收尾再得一条诚实提醒（条数写实）；无新进展则不再发——「未评审即交付」不存在静默途径 | 2 |

**续跑连续性（B 的成立前提）不靠单测假装覆盖**，读数四处：

- **哪些 run 过复位块**：`resume !== true` 的每个 run 都进 `thincoder-core/agent/run-start.mjs` 的 `if (!resume)`——含 digest / timer / upstream 三类自动回合（它们同样不带 `resume`）。故复位只落在该块的 `else` 支（`_inheritedGuard` 为空那一支，`_verifyRetries = 0` / `_advisorRound = 0` 所在），并另加「非自动回合」合取：**自动回合不清零**。
- **续跑不清零**：`resume: true` 分支整块不执行——实施席读该块核对。
- **自动回合携带**：`restoreGuard` 只拷 `INHERITED_GUARD_KEYS` 内的键，故两键进清单才随快照往返；消费点 = 同块的 `agent._inheritedGuard = null`。机制面 = B-6 单测。
- **两处读写点** = `thincoder-core/agent/run-stages.mjs` 的 `snapshotGuard` 收尾 ∥ `run-start.mjs` 的回填支——实施席读代码核对。

端到端读数走下面新增的集成行。

**集成测试设计（起点 = `test/RTM.md` 的 delta 三答）**

- **破坏的既有行（本批改写 `32-1`）**：`test/RTM.md` 故事 32 的 `32-1` 原文断言「同一未评审周期内推回提醒 ≤ 5 条，第 5 条带末条句」——层 1 先耗尽的场景（改过一次代码后只读）在新口径下只有 3 条，该断言不再成立，故本批重写 `32-1` 为「层 1 耗尽即停推（3 条）+ 恰好 1 条诚实提醒」。
- **缺失行（编号先行 · 已落 `test/RTM.md`）**：故事 **32. advisor guard 的提醒到顶就停，未评审要说出来** 现有四行，行文在盘：
  - `32-1`（改写 · 层 1 先耗尽）：「提醒恰好 3 条……其后恰好 1 条诚实提醒，文案里的条数写实（3）；无新进展时诚实提醒只发一次」；
  - `32-2`（新增 · 推满 5 条）：「推回提醒恰好 5 条，第 5 条带末条句（`This is reminder 5 of 5 — the last one`）；其后恰好 1 条诚实提醒」；
  - `32-3`（新增 · 子代理合并算进展）：「合并算进展 ⇒ 推回预算复位：提醒条数越过 3 继续推（不是停在 3 冻死）」；
  - `32-4`（新增 · 诚实提醒位随进展复位）：「诚实提醒已发 → 又有新进展 → 下一次停推再得一条」。
  用例标题照 `test('32-1 …')` / `test('32-2 …')` / `test('32-3 …')` / `test('32-4 …')` 同号逐字，档 = `test/integration/advisor-guard-reminder-cap.test.mjs`。
- 四条集成行所评的组件间交互 = 四个组件：回合环工具批执行处的预算复位（写序比）⟷ 完成守卫推回判定（两层 + 任一层停推时的诚实提醒）⟷ 子代理合并推进写序（`mergeChildMutations` → `noteMutations`）⟷ guard 状态携带（`INHERITED_GUARD_KEYS`）。
  - 断言的业务可观察结果 = 会话正常收尾；提醒条数有上限、到顶后恰好一条诚实提醒；「未评审」不被静默当成「已评审」。
  - 用户进入点 = CLI 会话开 `advisor.guard`，改代码后一路只读、始终不调 `advisor`。
  - 成立依据 = 「生产真的出现过的问题」（用户来信实测 624 轮），不是「跨了组件」。
  - **诚实分界**：机制侧（条数 ∥ 文案）机判；助手最终回答是否真写「未经评审」= 人读，不作机判断言。

**关键决策（含被否方案）**

1. **计数器挂 agent，不挂回合环** —— 被否：在 `thincoder-core/agent/turn-loop.mjs` 内加局部上限。局部计数器每次进入 `runAgent` 归零，续跑正是重进，624 轮原样复现。既有口径支撑：`run-start.mjs` 注释「Per-run bookkeeping reset — PRESERVED on `resume` (ContinueError continuation)」。
2. **A 复用 `FILE_MUTATORS`** —— 被否：新造「是否算进展」工具白名单。同一件事两处判据必漂移；且设计面已裁 bash / git 不失效评审（`docs/core/design/ADVISOR-CONVERGENCE.md` §6.1 第 2 条）。
3. **上限取 5** —— 被否：3（对「真改了代码仍漏评审」零宽限）· 8+（接近无限，等于没上限）。
4. **到顶 = 末条文案 + 一条诚实提醒，其后放行** —— 被否：到顶继续推回（等于没上限）；到顶抛错（把提醒升级成硬门，用户裁定它是提醒）；到顶静默放行（把「未评审即交付」做成静默成功——本档 §1 19:43 裁定）。
5. **A 的复位判据只认写工具**（早先形态：导出纯函数 `hasSuccessfulFileMutation(results)`） —— 被否：子代理合并不是 `FILE_MUTATORS` 工具调用，全委托会话里预算永不复位（§1「缺口二」裁定）；改复用写序 `_mutationSeq`——两个写者（成功写 ∥ 子代理合并）都在 `noteMutations` 一处推进，判据 `wroteSince` 既有、可机判，不立第二个判据（同一件事两处判据必漂移）。
6. **到顶诚实提醒复用 verify 面形态、另立一次性位** —— 被否：复用 verify 的 `honestReminderInjected` 局部位（两 guard 同开时互相吞掉，恰好吞掉本批要保的那句声明）；新增用户可见标记 ∥ 配置键（超出用户 19:35 的决定射程，且 verify 面既有形态已够）。
7. **两字段进 `INHERITED_GUARD_KEYS`** —— 被否：只在 `run-start.mjs` 复位块写零（自动回合回填 guard 三态时计数不随，上限被下一回合清零，B 形同没设）。

**新名既有件三问（逐个）**

- **A 面零新名**：判据复用既有 `wroteSince`（`thincoder-core/agent/helpers.mjs`，消费面 = 零落笔看门狗 `thincoder-core/agent/turn-loop.mjs`）与既有写序 `_mutationSeq`（`thincoder-core/agent-tools/advisor-settle.mjs` 的 `noteMutations`）——`existing: thincoder-core/agent/helpers.mjs` · name「`wroteSince`」· consumers: 零落笔看门狗 + 本批 advisor guard。
- `MAX_ADVISOR_REMINDERS` —— `none found`。查面 = `thincoder-core/agent/completion.mjs` 常量区（`MAX_VERIFY_RETRIES` ∥ `MAX_VERIFY_PUSHBACKS` ∥ `MAX_ADVISOR_PUSHBACKS`），无周期级上限常量。
- `_advisorReminders` —— `existing but unusable: thincoder-core/agent/turn-loop.mjs` · name「`advisorPushbacks`」· 失败在 = 它是 `runAgent` 体内的局部量，续跑重进 `runAgent` 即回零——本批要的正是跨续跑存活的周期计数。
- `_advisorHonestySent` —— `existing but unusable: thincoder-core/agent/completion.mjs` · name「`honestReminderInjected`」· 失败在 = `runAgent` 内的局部形参，两 guard 同开时先到的一方把另一方的诚实提醒吞掉。

**最近先例 ∥ 调研证据**

- 最近先例：`_verifyRetries` / `_advisorRound` / `_emptyRetries` 同族复位都在 `thincoder-core/agent/run-start.mjs` 的 `if (!resume)` 块，注释「a fresh user turn restarts from zero」——B 的复位点与它对齐，不立新位；新字段与同块字段同形（下划线前缀 + run 级语义）。到顶诚实提醒的形态先例 = `thincoder-core/agent/completion.mjs` 的 verify 面到顶块（注释逐字「`// Exhausted retries — inject honesty reminder once`」）——对齐：同形、同文案骨架、不新造机制；偏离：一次性位落在 agent（周期级、随两处复位点）而非 `runAgent` 局部（理由见设计档 §6.4「到顶行为」第三条子项）。
- 调研证据：仓内设计面 `docs/core/design` 扫 `advisorPushbacks` ∥ `MAX_ADVISOR_PUSHBACKS`——命中两处，同在 `docs/core/design/ADVISOR-CONVERGENCE.md`（§3.1 自限清单已改指 §6.4 两层口径 ∥ §6.2 公式块带层 1 / 层 2 两行）；`docs/core/design/ADVISOR-GUARDS.md` 该二词零命中，其 §6 同步面记账的边界段引 `docs/core/design/ADVISOR-CONVERGENCE.md` §6.4（见上「设计档落点」）。需求面 `docs/core/requirements/ADVISOR-CONVERGENCE.md`：F-A11 与 A 同向（「FILE_MUTATORS 触发重置」），F16 的「不改 `MAX_ADVISOR_PUSHBACKS` 语义」限定在 F16 面 ⇒ 与本批不冲突，需求档零改。
- **公开源核查**：项目声明 `PROJECT-MANIFEST.json` 的 `index.publicRepos` = `[]`（实读）⇒ 零仓外声明源，无公开源档可查（已查无）。树内公共源 = 上一条点到的那几份设计档与需求档。

**数据事实检查（前置）**：本设计对数据无断言——涉及的全部是代码常量与复位点（`MAX_ADVISOR_PUSHBACKS = 3`、`FILE_MUTATORS` 六元集合、字段复位位置），由代码与文档即可判定。现场「单会话 624 轮」= 用户来信原话（批档编制行），本批不另行复现。

**边界（本批不做）**

- 到顶后不加任何用户可见标记 / 新字段 / 配置键——要求只落在回答文本面（模型明说「未经评审」），UI 上到顶收尾与未开 guard 的收尾无差别。
- 不改 verify 面预算语义，不量 verify 面同族病理（任务书边界）。
- 不改轮数墙续跑，不改工程模式评审链。

**上抛项**

1. **[上抛·知会]** 任一层停推（层 1 或层 2 耗尽）后仍未评审的收尾 = 本批**必做**：推一条诚实提醒，要求模型在回答里明说「这段代码未经评审」——形态照 verify 面到顶，不新增用户可见标记 / 字段 / 配置键（父侧 19:43 裁定 + 20:26「缺口一」裁定）。已落覆盖条目 2 ∥ 机制设计 B 到顶落点 ∥ B-1/B-2/B-5/B-8 ∥ 集成行 `32-1`/`32-2`。
2. **[上抛·知会]** `docs/core/design/ADVISOR-GUARDS.md` §6 同步面记账的边界段原写「无 cap」，与代码 `MAX_ADVISOR_PUSHBACKS = 3` 自相矛盾，已就地改为两层口径并回指 `docs/core/design/ADVISOR-CONVERGENCE.md` §6.4（一致性面就地修，按纪律逐条记录于此）。

## §3 设计评审（评审子代理）
**状态行**：评审通过



### 轮次 1（评审子代理）

| # | Category | Severity | Issue | Suggestion |
|---|---|---|---|---|
| 1 | Document ownership | 🔴 | 同一机制两处活描述相反。`docs/core/design/ADVISOR-CONVERGENCE.md` §3.1 仍写「completion guard 每 run 推回上限 `MAX_ADVISOR_PUSHBACKS`（guard 自身节流）」；同档 §6.4 A 的新口径是「推回预算 `advisorPushbacks` 的复位判据 = **本批工具调用里至少一次成功的文件写工具**」，B 另立「上限常量 `MAX_ADVISOR_REMINDERS = 5`」。批档 §2 又声明「命中 2 处（`docs/core/design/ADVISOR-CONVERGENCE.md` §3.1 自限清单、§6.2 公式）——已一并收正」，与盘面不符 | 把 §3.1 该条目改为指向 §6.4 的两层口径（去掉「每 run 推回上限」读法）；调研证据行只写盘上真实改到的位置 |
| 2 | Clarity | 🟡 | 改动点坐标错。批档 §2 两处写 `docs/core/design/ADVISOR-GUARDS.md` §6.2（「§6.2 边界句『guard 推回上限——无 cap』→『两层口径，权威面 §6.4』」）；该档 §6 自身标题是「## 6. 同步面记账（F16——消费同谓词）」，无 §6.2 子节，改后那句住该节「边界」段 | 坐标改成「§6 同步面记账 · 边界段」，并引被改句原文（不用行号） |
| 3 | Acceptance criteria | 🟡 | 文案没有逐字单源。到顶诚实提醒只给「文案照 verify 面到顶条同构（`N 条提醒已发 · 这段代码未经评审 · 要么现在调 advisor、要么在回答里明说未经评审`）」，第 5 条末条句同样未逐字；而 B-3 断言「第 5 条含末条句并指名『不再推回 ⇒ 回答里声明未经评审』」、B-5 断言文案要求明说 | 两条文案给逐字块（照 verify 面逐字先例），用例断言引同一份逐字 |
| 4 | Feasibility | 🟡 | 复位点 1 与继承回填的先后未定。批档 §2 谓「`resume: true` 分支不写 `_advisorReminders` / `_advisorHonestySent`——实施席读 `thincoder-core/agent/run-start.mjs` 的 `if (!resume)` 块核对（该块只在用户新回合跑）」。而 `docs/core/design/AGENT-LOOP.md` §6.2 写 autoTurn「`{ autoTurn: true }` = 不 push input + per-run 状态重置」，其 per-run 复位块只对 `_inheritedGuard` 开例外。digest 自动回合走不走复位块、复位块与 `restoreGuard` 谁先谁后未定，B 的上限在自动回合面成立与否取决于它 | 写明哪些 run 过 `!resume` 复位块、`restoreGuard` 相对它的顺序与 `_inheritedGuard` 消费点；补一条 digest 自动回合不清零的读数 |
| 5 | Acceptance criteria | 🟡 | B 面缺错误 / legacy 输入用例。设计以「两字段读法用 `?? 0` / `?? false`，故 `thincoder-core/agent.mjs` 默认对象零改」立契约，但 A-1…A-3 / B-1…B-6 无一条读「两字段缺失」的旧 agent 形 | 补一行：字段缺失 ⇒ 视 0 / 假、首条提醒照推且计数转 1 |
| 6 | Existing-piece check | 🟡 | 新增名的既有件三问不成形。`honestReminderInjected` 有可用性答复（「被否：复用 verify 的 `honestReminderInjected` 局部位（两 guard 同开时互相吞掉…）」）；`MAX_ADVISOR_REMINDERS` 与 `_advisorReminders` 无 `none found:` 行，`hasSuccessfulFileMutation` 只有「抽成导出纯函数」的理由 | 每个新名补一行：`existing: …` / `none found: …` / `existing but unusable: …` |
| 7 | Survey evidence | 🟡 | 勘察证据只记仓内 `docs/core/design` 扫描，无公共源记录。兄弟档同面写的是「**公开源核查**：项目声明 `PROJECT-MANIFEST.json` 的 `index.publicRepos` = `[]` ⇒ 无公开源档可查（已查无）」（`docs/core/design/ADVISOR-GUARDS.md`） | 补同一句式一行（无相关也照记） |
| 8 | Integration-test design | 🟡 | 起点正确（`test/RTM.md` delta 三答在位），但新增行编号留到实施时——「缺失行（新增 1 行，编号在实施时先落 `test/RTM.md`，再写用例名）」。in-scope 两处先例都在设计时定号：`docs/core/design/AGENT-LOOP.md`「**缺行（编号先行 · 已落 `test/RTM.md`）**：新故事 **15. 偶发空响应不打断会话**」；`docs/core/design/ADVISOR-GUARDS.md`「编号已先落 `test/RTM.md` 故事 17，用例标题照 `test('17-1 …')` 同号逐字」。另「已探：`test/RTM.md` 无任何行断言完成守卫的推回预算」未引原文，RTM 不在本次范围 ⇒ unverified | 设计时先把故事号与行号落进 RTM 再写用例名；引一句 RTM 实文作依据 |
| 9 | Affected-file tier | 🟡 | 结论行写的是模块分层，不是尺寸档。原文「受影响文件（tier 结论：零文件跨层——全在 core 同一层内，另加文档面与本批单测）」。「同一层内」不回答尺寸档（>500 提示 / >800 必拆 / 300+ 行单函数为首判据），六份源 / 测试档无一条尺寸档结论 | 改成尺寸档口径的结论行：哪些档越档并给拆分计划，或明确「都不越档」；数值不落档 |

**范围限制（如实）**

- 本次仅评审四份在 scope 文档。
- `thincoder-core/**` 的实现坐标一律 unverified：`FILE_MUTATORS`、`turn-loop.mjs`、`completion.mjs`、`run-start.mjs`、`record-results.mjs`、`advisor-settle.mjs`、`helpers.mjs`。
- `test/RTM.md` 实文与各源 / 测试档行数同样 unverified（超出评审范围）。
- 无项目标准档、无文档地图入上下文 ⇒ 文档归属按四档自述的权威声明判定：`docs/core/design/ADVISOR-CONVERGENCE.md` §6.4 = 机制权威面。

**计数**：🔴 1 · 🟡 8 · 🔵 0

VERDICT: changes-required

### 轮次 2（评审子代理）

### 轮 2 复验（只复验轮 1 九条 · 不开新战场）

| # | Orig# | File | Severity | Status | Notes |
|---|---|---|---|---|---|
| 1 | 1 | `docs/core/design/ADVISOR-CONVERGENCE.md` | 🔴 | Fixed | §3.1 自限清单现写「completion guard 推回预算——两层口径：进展窗口 `MAX_ADVISOR_PUSHBACKS` ≤ 3 条 ∥ 未评审周期 `MAX_ADVISOR_REMINDERS` ≤ 5 条（权威面 §6.4…)」——「每 run 推回上限」读法消失，条目指回 §6.4 |
| 2 | 2 | `docs/batches/2026-11-04-advisor-guard-loop.md` | 🟡 | Fixed | §2 现引「§6 同步面记账 · 边界段」并注明「无 §6.2 子节」；被引句与盘面逐字相符 |
| 3 | 3 | `docs/core/design/ADVISOR-CONVERGENCE.md` | 🟡 | Fixed | §6.4 新增「末条推回文案（逐字…）」与「到顶诚实提醒文案（逐字…）」两块，并写明「断言引同一份逐字」；B-3 ∥ B-5 改为「逐字取设计档 §6.4…块」 |
| 4 | 4 | `docs/core/design/ADVISOR-CONVERGENCE.md` | 🟡 | Fixed | §6.4 复位点 1 补齐「与 `restoreGuard` 的先后」（`if (g) … else …` 两支互斥、消费点 `_inheritedGuard = null`）、「哪些 run 过这一块」（含自动回合）与「非自动回合」合取及读数 |
| 5 | 5 | `docs/batches/2026-11-04-advisor-guard-loop.md` | 🟡 | Fixed | 新增 B-7（旧形/错误：两字段缺失 ⇒ 视作 0 ∥ false、首条照推、计数读 1）；§6.4 有对应「旧形（两字段缺失）」条 |
| 6 | 6 | `docs/batches/2026-11-04-advisor-guard-loop.md` | 🟡 | Fixed | 「新名既有件三问（逐个）」四名齐备（两名 `none found`，两名 `existing but unusable` 并点名坐标与失败在） |
| 7 | 7 | `docs/batches/2026-11-04-advisor-guard-loop.md` | 🟡 | Fixed | 「**公开源核查**：…`index.publicRepos` = `[]`（实读）⇒ 零仓外声明源…（已查无）」在位 |
| 8 | 8 | `docs/batches/2026-11-04-advisor-guard-loop.md` | 🟡 | Fixed | 「缺失行（编号先行 · 已落 `test/RTM.md`）」：故事 32 ∥ 行 `32-1` 设计期定号并引 RTM 实文；RTM 实文本身在本评审范围外（unverified） |
| 9 | 9 | `docs/batches/2026-11-04-advisor-guard-loop.md` | 🟡 | Fixed | 结论行改为尺寸档口径（「无一越档、零拆分计划…数值不落档」）；六档现量在本评审范围外，未复量（unverified） |
| N1 | (new) | `docs/core/design/ADVISOR-CONVERGENCE.md` | 🟡 | New：逐字末条句称「the guard will not push again」，而同节「到顶行为」写「guard 再推**一条诚实提醒**」并 `continue` | 两处对同一到顶行为口径相反；建议末条句改为「this is the last pushback of this kind」或删该承诺，B-3 断言随之对齐 |
| N2 | (new) | `docs/core/design/ADVISOR-CONVERGENCE.md` | 🟡 | New：断言用词「第 1–4 条不含 `reminder` 句」与既有正文自带 `[System reminder:` 相撞（B-3 同语） | 建议断言改用末条句字面 `This is reminder`，避免把「含 reminder 一词」当判据 |
| N3 | (new) | `docs/batches/2026-11-04-advisor-guard-loop.md` | 🔵 | New：§1 讨论段仍引「`docs/core/design/ADVISOR-GUARDS.md` §6.2 的「无 cap」句」——同一坐标错误，§2 已改 | 记录面历史陈述（父侧 19:39 核验原话），不需改；仅登记 |

**范围限制（如实）**：仅复核四份在 scope 文档；`thincoder-core/**` 实现坐标（`FILE_MUTATORS`、`turn-loop.mjs`、`completion.mjs`、`run-start.mjs`、`record-results.mjs`、`advisor-settle.mjs`、`helpers.mjs`）与 `test/RTM.md` 实文、六档行数一律 unverified。

**计数**：🔴 0 · 🟡 2（新增，advisory）· 🔵 1

VERDICT: pass

## §4 用户批准（主 agent）

## 用户批准

- **原话一**：「那个bug你能处理吗？」（2026-11-04 19:31）——外部来信「advisor guard 死锁：提醒可无限重复（实测单会话 624 轮）」由我接手。
- **原话二**：「A+B吧。」（19:35）——修法口径：A 只在真进展时回满 ∥ B 同类提醒硬上限。
- **原话三**：「advisor guard 预算误清零那个毛病先处理吧。」（20:02）——定本批范围；设计轮提醒无上限与陈旧注释另批（台账 `#2040`）。
- **原话四**：「那句话不操吗？」（19:42）——否掉父侧「到顶静默放行」的裁定；随后父侧更正为「到顶必发一条诚实提醒，要求回答里明说未经评审」。
- **原话五**：「上限有没有auto打开的时候自动续轮？」（19:46）／「那有没有别的时候自动续轮的可能？子agent是肯定会有自动续轮的。」（19:47）／「你只查文档怕是不够，代码未必跟文档一致。」（19:59）——三次追问推动父侧改读代码，确认「AUTO 自动续轮」在实现里不存在（`registerTurnCapCheckpoint` 三条出路），并查出 `subagent-async.mjs` 的相反注释是陈旧句。

**批准范围**：advisor 推回预算的两层口径（A ∥ B）＋ 到顶诚实提醒 ＋ `INHERITED_GUARD_KEYS` 两键 ＋ 相关设计档与 RTM 故事 32 的验收面。

**不在范围**：轮数墙续跑机制、设计轮提醒上限、`subagent-async.mjs` 陈旧注释与悬空 `D-A3`（三者台账 `#2040`）、verify 面同族病理。

## §5 实施记录（eng-coder）
**状态行**：实施完成（第 5 轮正 32-2 ∥ 32-3「怎么做」＋ ★ 32-3 注 · 集成 4/4 亲跑 · doc_check gate PASS · 审计 1 轮 ∥ 代码评审 1 轮（pass）· 修正 1 轮）



> **第 1 轮记录（中间形态，非最终交付）**：那一轮的 A 判据是 `hasSuccessfulFileMutation`、集成只到 `32-1`。最终交付 = 下方「### 第 3 轮（2026-11-04 · 补集成行 32-4）」节，读数以那一节为准；第 1 ∥ 2 轮作为过程记录保留。

### 交付摘要（第 1 轮）

本批实现 A ∥ B ∥ 到顶诚实提醒三层语义，共改动八份档（六份源码 + 两份测试档）。

| # | 档 | 改点 |
|---|---|---|
| 1 | `thincoder-core/agent/helpers.mjs` | 新增导出纯函数 `hasSuccessfulFileMutation(results)`（判据集复用 `FILE_MUTATORS`）；`INHERITED_GUARD_KEYS` 加 `_advisorReminders` ∥ `_advisorHonestySent`；`snapshotGuard` 注释的「7 键」字面改为引清单 |
| 2 | `thincoder-core/agent/turn-loop.mjs` | A：`advisorPushbacks = 0` 改为 `if (hasSuccessfulFileMutation(results)) advisorPushbacks = 0`；`guardPushbacks = 0` 逐字保留；两处过时注释就地收正 |
| 3 | `thincoder-core/agent/completion.mjs` | B：常量 `MAX_ADVISOR_REMINDERS = 5`、周期计数落 `agent._advisorReminders`、推回条件加层 2、末条句（第 5 条）、到顶一条诚实提醒（一次性位 `agent._advisorHonestySent`） |
| 4 | `thincoder-core/agent/run-start.mjs` | 复位点 1：`if (!resume)` 的 `else` 支内，带「非自动回合」合取 `!(autoTurn \|\| upstreamTurn \|\| timerTurn)` |
| 5 | `thincoder-core/agent/record-results.mjs` | 复位点 2（同步面）：`_calledAdvisorThisRun = true` 的同一判据分摊内 |
| 6 | `thincoder-core/agent-tools/advisor-settle.mjs` | 复位点 2（异步面）：`if (!failureVerdict)` 内，与覆盖标记同点 |
| 7 | `docs/batches/2026-11-04-advisor-guard-loop.test.mjs` | 本批单测档（A-1…A-3 · B-1…B-7），收口删除 |
| 8 | `test/integration/advisor-guard-reminder-cap.test.mjs` | 本批集成用例 32-1（RTM 行同号） |

**三份越声明清单的档**（原因如实）：`run-start.mjs` ∥ `record-results.mjs` ∥ `advisor-settle.mjs` 是设计 §6.4「复位点穷举（两处，别处零写）」的两处落点——不进这三档则周期计数永不复位，B 形同没设。

### 验收对照（逐行读数）

命令：`node --test docs/batches/2026-11-04-advisor-guard-loop.test.mjs` ⇒ **10 pass / 0 fail**（A-1、A-2、A-3、B-1、B-2、B-3、B-4、B-5、B-6、B-7）。

命令：`node --test test/integration/advisor-guard-reminder-cap.test.mjs` ⇒ **1 pass / 0 fail**（32-1）。

**修前红读数（常量消融）**：把 `MAX_ADVISOR_REMINDERS` 临时改成 40 再跑 32-1 ⇒ 红（`实读 6` 条提醒）。改回 5 ⇒ 绿。证明该用例断的是上限本身。

**回归读数**（我改到的两个共用记账点）：`node --test test/integration/advisor-record-gate.test.mjs test/integration/digest-empty-round.test.mjs` ⇒ **7 pass / 0 fail**。

| 条目 | 状态 | 说明 |
|---|---|---|
| 1 · A（预算只在真进展时回满） | ✅ Done | 只读 / grep / bash / git 批次不复位；判据单源 `FILE_MUTATORS` |
| 2 · B（周期硬上限 5 + 到顶诚实提醒） | ✅ Done | 计数挂 agent（跨续跑存活）、两处复位点、逐字文案照设计 §6.4 |

### 审计与评审轮次（终态 clean）

- **内部偏差审计**（explore，1 轮）：0 🔴 · 6 🟡 · 1 🔵。属本席的三条已就地修：`turn-loop.mjs` 注释误称 verify 面「有成功工具批」才清零（实为任一工具批无条件清零）、集成档注释读写数（10+4 → 11+3）、B-2 用例体与标题不符（标题claim「追加读文件批次」而体内无批次）。其余为设计面 / 记录面，见上抛项。
- **内部代码评审**（advisor `type=code`，1 轮）：`VERDICT: pass`，0 🔴 · 2 🟡 · 3 🔵。两条 🟡 评审自行定性为**设计面缺口、非实现偏离**（实现与 §6.4 逐字一致），故不在本席改动面内，转父侧裁。
- **修正轮**：1 轮（上述三条 + 一次常量消融读数），无遗留。
- **终态**：`clean`（本席缺陷 0 条未关闭）。

### 披露与上抛

**[上抛·待裁]** ① 层 1（进展窗口 3 条）到顶时静默收尾、零诚实提醒：模型改过一次代码后不再写文件（只读不回满），第 4 次收尾即 `done`——诚实提醒只在周期到 5 时发。32-1 能取到诚实提醒靠脚本中间再写一次。这是设计 §6.4「到顶行为」只认 5 条上限所致，实现与设计一致，改机制须父侧裁定。② 子代理合并改代码不进 A 的复位判据（§6.3 列为「失效 = 是」，但合并不是 `FILE_MUTATORS` 工具调用）⇒ 全委托形态下层 1 永不回满。同属设计面。

**[上抛·知会]** `docs/core/design/AGENT-LOOP.md` 仍写「auto-turn guard 的 7 键标记集」——`INHERITED_GUARD_KEYS` 现为 9 键（本批加两键后漂移）。设计档不在本席笔内，请设计席收正。

**未做（如实）**：未改 verify 面预算语义（`guardPushbacks = 0` 逐字保留）；未改轮数墙续跑；未动工程模式路径；未做「自动回合不清零」这条新分支的自动化覆盖（设计已声明该面靠人工读数，我读了 `run-start.mjs` 两支互斥与消费点）。

### 修正轮（第 2 轮 · 2026-11-04 20:39 裁定后）

**依据**：§1「实施席上抛裁定之二（父侧 · 2026-11-04 20:39）」三条要点——不取「加 `!_advisorHonestySent`」；诚实提醒位随新进展复位（与推回预算同点两行手拉手）；文案删掉「no more will be sent for this code」半句，断言按删后逐字对齐。

**本轮改点**

| # | 档 | 改点 |
|---|---|---|
| 1 | `thincoder-core/agent/turn-loop.mjs` | A 判据 = `if (wroteSince(agent, agent._mutSeqMark))`；块内两行手拉手复位 `advisorPushbacks = 0` ∥ `agent._advisorHonestySent = false`（`_advisorReminders` **不**随进展复位——那是层 2 的周期上限） |
| 2 | `thincoder-core/agent/completion.mjs` | 到顶条件 = 任一层停推 `((_advisorReminders ?? 0) >= 5 \|\| advisorPushbacks >= 3)`；诚实提醒文案删掉「no more will be sent for this code」半句、条数取 `?? 0`；注释按 20:39 口径重写（位随进展复位 ⇒ 每次停推且仍未评审的收尾恰一条，无静默途径） |
| 3 | `thincoder-core/agent/helpers.mjs` | 移除退役导出 `hasSuccessfulFileMutation`（A 复用既有 `wroteSince`，零新增谓词、零新增字段） |
| 4 | `docs/batches/2026-11-04-advisor-guard-loop.test.mjs` | 单测 13 例（A-1…A-4 · B-1…B-9；B-9 为裁定新增：位随进展复位后该次交付重新得一条） |
| 5 | `test/integration/advisor-guard-reminder-cap.test.mjs` | 集成三例（32-1 层 1 先耗尽 · 32-2 推满 5 条 · 32-3 子代理合并算进展）；32-1 只读累计 10 次以对齐 RTM 行 |

**读数（本轮实测）**

- `node --test docs/batches/2026-11-04-advisor-guard-loop.test.mjs` ⇒ **13 pass / 0 fail**
- `node --test test/integration/advisor-guard-reminder-cap.test.mjs` ⇒ **3 pass / 0 fail**
- 回归（改动过的共用记账点）：`node --test test/integration/advisor-record-gate.test.mjs test/integration/digest-empty-round.test.mjs` ⇒ **7 pass / 0 fail**

**消融读数（改回即恢复，档上零残留）**

| 消融 | 动作 | 读数 |
|---|---|---|
| A | 到顶条件改回只认 5 条计数 | 32-1 红：会话停在「收尾 D」、零诚实提醒（缺口一原形） |
| B | A 判据改回只认 `FILE_MUTATORS` 结果 | 32-3 红：全委托会话停在 3 条冻死（缺口二原形） |
| C | `MAX_ADVISOR_REMINDERS` 5→40 | 32-2 红：实读 7 条 > 5 |
| D | 写序推进点只复位预算、不复位诚实提醒位 | 探针红：会话停在「收尾 G」、第二条诚实提醒不发（20:39 要堵的静默形态） |

**探针说明（如实）**：D 用的是一次性探针用例（真会话链路：诚实提醒 → 再改代码 → 再收尾 ⇒ 5 条推回 + 2 条诚实提醒），跑完即删。`test/RTM.md` 故事 32 现无此形态的行，按「编号先行」不在无行时留档。

**审计与评审轮次**

- **内部偏差审计**（explore，1 轮）：🔴 0 · 🟡 4 · 🔵 3。属本席的两条已就地修：集成档「合并调用点一律带 role 门」的理由句失实（escalate 面合并点无角色门）；32-1 只读改到 10 次以对齐 RTM 行。第 5 条（条数插值 `?? 0`）按裁定一并收。
- **内部代码评审**（advisor `type=code`，1 轮）：`VERDICT: changes-required`，1 🔴 + 4 🟡 + 3 🔵。🔴 = 诚实提醒之后再有新进展会静默放行；🟡 两条（文案许诺「不再推」、条数插值未走 `?? 0`）同源。三条已按 20:39 裁定修完并复跑绿（13/3/7 全绿，消融 D 反向成立）。
- **终态**：`clean`（本席缺陷 0 条未关闭）。

**披露与上抛**

- **[上抛·知会]** 设计面同步在途、父侧已派，本席不动设计面与 §2。待同步四处：① `docs/core/design/ADVISOR-CONVERGENCE.md` §6.4 的到顶诚实提醒逐字样句仍含已删的「no more will be sent for this code」半句；② §6.4「为什么是任一层停推」段两处「实读」引的是退役的 `hasSuccessfulFileMutation` 与只认 5 条的旧到顶条件；③ 同节「复位点穷举（两处，别处零写）」需补写序推进点这第三处（位随进展复位）；④ 同节 verify 面写「仍按有成功工具批复位」而盘上是无条件 `guardPushbacks = 0`。另 `test/RTM.md` 32-1 的「诚实提醒只发一次（再收尾即放行）」在 20:39 口径下应改为「无新进展时只发一次」。
- **[上抛·已关闭]** 集成行缺一条：需要一行覆盖「诚实提醒已发 → 又有新进展 → 下一次停推再得一条」的端到端读数。现仅一次性探针有该读数；单测 B-9 只覆盖 guard 侧无记忆性（位由外部置假），不覆盖 `turn-loop.mjs` 那两行复位的接线。—— **已兑现**：第 3 轮补集成行 `32-4`，读数见下方「### 第 3 轮」节。
- **未做（如实）**：未改 verify 面预算语义（`guardPushbacks = 0` 逐字保留）；未改轮数墙续跑；未动工程模式路径；未动设计面与 §2；集成档 32-3 的委托调用点用夹具工具（真 `subagent` 生成面合并点带 `role === "eng-coder"` 门），机制落的是真 `mergeChildMutations`。

### 第 3 轮（2026-11-04 · 补集成行 32-4）

**依据**：批档 §1「实施席第 2 轮交付裁定（父侧 · 2026-11-04 20:44）」第 7 条——「`test/RTM.md` 故事 32 新增行 `32-4`：诚实提醒已发 → 又有新进展 → 下一次停推再得一条。编号先行，行先落盘，实施席随后补用例。」RTM 行 `32-4` 已在盘（设计席落），本轮只补用例，零改源码。

**改点（1 档）**

| # | 档 | 改点 |
|---|---|---|
| 1 | `test/integration/advisor-guard-reminder-cap.test.mjs` | 新增 `32-4`：一次 `runAgent` 里层 1 耗尽（3 条）→ 诚实提醒①（写实 3）→ 再成功写一次代码（写序推进）→ 推回续推 4、5（第 5 条带末条句）→ 诚实提醒②（写实 5）→ 只读一批 → 放行 |

`32-4` 的断言面：两次真写落盘（复位由真工具批的写序推进驱动，不是手工置字段）；5 条推回且末条句恰一次、恰落第 5 条；2 条诚实提醒且条数各写实 3 ∥ 5；每条中间收尾后必跟一条提醒（历史邻接判据，不在计数断言之内）；末态 `_advisorReminders = 5` ∥ `_advisorHonestySent = true`。

**读数（本轮实测）**

- `node --test test/integration/advisor-guard-reminder-cap.test.mjs` ⇒ **4 pass / 0 fail**（32-1…32-4）
- 回归：`node --test test/integration/advisor-record-gate.test.mjs test/integration/digest-empty-round.test.mjs docs/batches/2026-11-04-advisor-guard-loop.test.mjs` ⇒ **17 pass / 0 fail**

**消融读数（反证用例真的会红）**

| 消融 | 动作 | 读数 |
|---|---|---|
| E | 删掉 `turn-loop.mjs` 写序推进点那一行 `agent._advisorHonestySent = false` | 32-4 红：`actual: '收尾 G'` / `expected: '答复 H'`——诚实提醒①之后又改了代码却静默放行（20:39 要堵的形态）。改回并哈希校验：`1256C4F5BA6F352D00C62397C8D488DF5E1575EEA5FD025CD2841D7F73BA53BB` 前后一致，档内 `ABLATION` 零命中 |

**审计与评审轮次（终态 clean）**

- **内部偏差审计**（explore，1 轮）：🔴 0 · 🟡 1 · 🔵 5。🟡 = §5 未随本轮更新（本节即其修复，状态行同步改写）。属本席的 🔵 三条已就地修：判据「无静默收尾」原是计数断言的算术和（改成历史邻接判据）；⑤ 的括号内容一半未被脚本驱动（补第 13 轮只读批）；第二条诚实提醒未断「明说未经评审」子句（提成三子句共享清单）。
- **内部代码评审**（advisor `type=code`，1 轮）：`VERDICT: pass`，🔴 0 · 🟡 0 · 🔵 5。五条全在本席笔内，已逐条落：共享 helper 去掉 `if (fifth)` 空跑（末条句出现则恰一次、恰第 5 条）、收尾次数按脚本派生（不写死 7）、提醒本体内容锚先于角色形状断言、「层 2 计数不随进展复位」的读数写明来源、诚实提醒三子句提成共享清单。
- **终态**：`clean`（本席缺陷 0 条未关闭）。

**披露与上抛**

- **[上抛·知会]** 声明域外触碰两处，均系一次已回滚的消融探针：`thincoder-core/agent/turn-loop.mjs`（临时删一行 → 跑红 → 备份恢复，前后 SHA256 一致，档内零残留）与 `%TEMP%` 下的备份档（已删除）。除此外本轮只改声明档一处。
- **[上抛·知会]** 批档 §2 第 240 行「三条所评的组件间交互」与其后列出的四个组件数目不符，同段还挂一条内容重复的嵌套条目——§2 是设计席笔，本席未动，请设计席收正。
- **未做（如实）**：未改任何源码（A ∥ B ∥ 到顶语义本轮零改）；未动设计面与 §2；`test/RTM.md` 行 `32-4` 的「结果 ∥ 执行日期 ∥ 执行人」三列仍为 `待执行`，填写属收口面（§6）。

### 第 4 轮（2026-11-04 · 填 RTM 故事 32 四行执行列）

**依据**：批档 §1「收口前裁定（父侧 · 2026-11-04 20:57）」末句逐字「② RTM 故事 32 四行的执行列由实施席填（`test/RTM.md` 不在任何 `docRoot` 下 = 产品面）。②随 `#42` 之后的实施席一笔落。」——`#42`（设计席正 §2 的「三条 ↔ 四组件」）已在盘：§2 现写「四条集成行所评的组件间交互 = 四个组件」，故本轮为那一笔。

**改点（1 档 · 12 格）**

| # | 档 | 改点 |
|---|---|---|
| 1 | `test/RTM.md` | 故事 32 四行（32-1 ∥ 32-2 ∥ 32-3 ∥ 32-4）的三个执行列：`待执行` ∥ `—` ∥ `—` → `通过` ∥ `2026-11-04` ∥ `实施席（eng-coder）`；其余五列（编号 ∥ 怎么做 ∥ 怎么算通过 ∥ 异常 ∥ 证据）逐字未动 |

`结果` 取 `通过` 而非同档 31-x 的 `✅ 通过`：`docs/core/design/TESTING.md` §11.3 的取值域是「`通过` ∥ `未通过` ∥ `未执行`」，写入取域内字面（合规形不用装饰形）。

**读数（本轮亲跑）**

- `node --test test/integration/advisor-guard-reminder-cap.test.mjs` ⇒ **4 pass / 0 fail**（32-1…32-4 全 ✔，0 skip、0 cancelled）
- `doc_check(mode:"gate", docs:["test/RTM.md"])` ⇒ **DOC-CHECK GATE: PASS**（1 档全清，0 段超长）
- `git diff test/RTM.md`：本轮改面 = 四行 × 三格；故事节整段在 diff 里显示为新增，属设计席此前未提交的在途改动，非本轮所加（如实标出，免被读成本笔新增）

**审计与评审轮次（终态 clean）**

- **内部偏差审计**（explore，1 轮）：🔴 0 · 🟡 1 · 🔵 5。三条判据全绿——①四行「怎么算通过」的每个子条款都能在同号用例里找到实际断言（无假绿）；②三列取值合 `docs/core/design/TESTING.md` §11.3；③零越界。唯一 🟡 不在本席 12 格内（32-2 ∥ 32-3 的「怎么做」与用例脚本不符，设计席笔）。
- **内部代码评审**（advisor `type=code`，1 轮）：`VERDICT: pass`，🔴 0 · 🟡 3 · 🔵 3，无 must-fix。三条 🟡 = ① 32-3 行「怎么做」点 `subagent` 入口而用例走夹具 `delegate_merge`（披露只在用例档头注与 §5「未做」，行内不露）；② 32-2 行写「两个进展窗口 / 其余轮仍只 `read`」而用例驱动五次成功写、中途零读；③ 四行 `通过` 落笔时未留全仓单入口 `node test/run.mjs` 读数（`docs/core/design/TESTING.md` §11.5 时序 ①，同档先例 20-1 执行人栏即引该读数）。
- **修正轮**：0 轮——三条 🟡 无一落在本席笔内（行文本 = 设计席笔；全仓读数 = 收口面 §6），按本批惯例不擅改设计席行文、不自造披露注。
- **终态**：`clean`（本席缺陷 0 条未关闭）。

**披露与上抛**

- **[上抛·待裁]** 三条 🟡 需父侧路由，本席倾向：(a) 32-3 的 `subagent` 入口未驱动 ⇒ 在故事 32 节下补 ★ 注（同档先例 = 故事 4 的「skip 不算验过」披露形），或派设计席把该行「怎么做」改成与用例一致的入口（夹具工具 → 真 `mergeChildMutations`）；(b) 32-2 的「怎么做」改「每轮再成功写一次代码（多个进展窗口）」，否则该行现无对应证据、`通过` 应退回 `未执行`；(c) §6 收口补一次 `node test/run.mjs` 读数并落到可追溯位置（先例 20-1 的写法）。
- **未做（如实）**：未改任何源码；未改 `test/integration/advisor-guard-reminder-cap.test.mjs`；未动四行其余五列；未跑全仓 `node test/run.mjs`（收口面）。

### 第 5 轮（2026-11-04 · 正 32-2 ∥ 32-3「怎么做」＋ ★ 32-3 注）

**依据**：依据 `docs/batches/2026-11-04-advisor-guard-loop.md`「RTM 故事 32 四行的执行列由实施席填（`test/RTM.md` 不在任何 `docRoot` 下 = 产品面）」

本轮**无 §1 书面裁定**：派单方以声明写域 `test/RTM.md` 指向第 4 轮三条 🟡 里的 (a) ∥ (b)。本席按此落地，并把「改了设计席笔的两格」这一处置单列上报——父侧要另一形态时可整体回滚。

**改点（1 档 · 3 处）**

| # | 档 | 改点 |
|---|---|---|
| 1 | `test/RTM.md` 32-2「怎么做」 | 原文「中途再成功写一次代码（两个进展窗口），其余轮仍只 `read`」与用例脚本不符 → 改按脚本：5 次成功写、两次写之间只夹一次被推回的收尾、写与推回之间不读文件（到顶后读一批即放行） |
| 2 | `test/RTM.md` 32-3「怎么做」 | 原文点 `subagent` 入口 → 改用例真入口：夹具工具 `delegate_merge` 落真 `mergeChildMutations`，父侧零直接写、零读、不调 `advisor` |
| 3 | `test/RTM.md` 故事 32 表后 | 新增 `★ 32-3` 注：真 `subagent` 入口未驱动的原因（spawn 面三处合入点均带 `role === "eng-coder"` 门、eng-coder 生成要设计 token）与未覆盖面（escalate 面合入点无角色门、本例未驱动，真调用点接线不在本例断言内）。形式照同档 `★ 4-3` 先例 |

其余七列（编号 ∥ 怎么算通过 ∥ 结果 ∥ 执行日期 ∥ 执行人 ∥ 异常 ∥ 证据）逐字未动——**验收标准零改**。

**读数（本轮亲跑）**

- `node --test test/integration/advisor-guard-reminder-cap.test.mjs` ⇒ **4 pass / 0 fail**（32-1…32-4 全 ✔，0 skip ∥ 0 cancelled）
- `doc_check(mode:"gate", docs:["test/RTM.md"])` ⇒ **DOC-CHECK GATE: PASS**（首跑 REFUSED：★ 注 307 字符越段长阈，收到 293 复跑 PASS）

**本轮派给本席三条**

| # | 条目 | 状态 | 说明 |
|---|---|---|---|
| 1 | (a) 32-3「怎么做」与用例一致 ＋ 边界披露 | ✅ Done | 行内点名夹具工具，★ 注补原因与未覆盖面 |
| 2 | (b) 32-2「怎么做」与用例一致 | ✅ Done | 按脚本逐轮描述 |
| 3 | (c) 四行 `通过` 落笔前留全仓 `node test/run.mjs` 读数 | ❌ 未做 | 收口面（`docs/core/design/TESTING.md` §11.5 时序 ①）——全仓单入口属父侧收口轮，不在本席链内 |

**审计与评审轮次（终态 clean）**

- **内部偏差审计**（explore · 1 轮）：verdict `clean`，🔴 0 · 🟡 0 · 🔵 5。三条 🔵 已就地收：32-2「每次收尾被推回后再写」配对失准、32-3「交给子代理」暗示真子代理在场、★ 注漏 escalate 面。
- **内部代码评审**（advisor `type=code` · 1 轮）：`VERDICT: pass`，🔴 0 · 🟡 1 · 🔵 2。🟡 已修：★ 注原写「两个真合入点」，盘上 spawn 面实为三处（`subagent.mjs` 一处 ∥ `subagent-async.mjs` 两处）；🔵 之一已修：32-2「中途不读文件」→「写与推回之间不读文件」。
- **修正轮**：1 轮（上述 🔵 三条 + 🟡 一条 + gate 段长一次），无遗留。
- **终态**：`clean`（本席缺陷 0 条未关闭）。

**披露与上抛**

- **[上抛·待裁]** 处置形态请父侧确认：本轮改的是设计席笔的两格「怎么做」。判据 = 该档不在任何 `docRoot` 下（产品面），且父侧 20:57 已把该文件判给实施席；若父侧更认「只加 ★ 注、行文回派设计席」，3 处改动可整体回滚。
- **[上抛·知会]** 🔵 留而未修：四行单行 410 ∥ 355 ∥ 335 ∥ 320 字符，越过 `docs/core/design/TESTING.md` §11.2「无单行 > 300 字符」。全档 49 行同样越线（既有形态），单改这四行会与邻节体例不一，故登记不动。
- **未做（如实）**：未改 `怎么算通过` 等七列任何一格；未改任何源码与用例档；未跑全仓 `node test/run.mjs`；未动设计面与 §2。

## §6 验证与收口（父代理）

## 验证与收口（父侧实跑 · 2026-11-04 21:12）

**父侧独立复验读数（本轮实跑，不采信子代理报告）**：

| 面 | 命令 | 读数 |
|---|---|---|
| 全仓集成单入口 | `node test/run.mjs` | **tests 137 · pass 137 · fail 0** · skipped 0 |
| 本批单测 | `node --test docs/batches/2026-11-04-advisor-guard-loop.test.mjs` | **13 pass / 0 fail**（收口删除） |
| 本批集成 | `node --test test/integration/advisor-guard-reminder-cap.test.mjs` | **4 pass / 0 fail**（`32-1`–`32-4`） |

**实现三处实读**：

- `thincoder-core/agent/turn-loop.mjs` —— `if (wroteSince(agent, agent._mutSeqMark)) {` 之内 `advisorPushbacks = 0` 与 `agent._advisorHonestySent = false` 两行相邻（A 的复位判据 + 位随进展复位）；`guardPushbacks` 仍为**无条件**清零（verify 面零改）。
- `thincoder-core/agent/completion.mjs` —— 到顶条件含 `((agent._advisorReminders ?? 0) >= MAX_ADVISOR_REMINDERS || advisorPushbacks >= MAX_ADVISOR_PUSHBACKS)`：**任一层停推**即发诚实提醒。
- `thincoder-core/agent/helpers.mjs` —— `INHERITED_GUARD_KEYS` 含 `_advisorReminders` ∥ `_advisorHonestySent`；退役的 `hasSuccessfulFileMutation` 已删（A 复用既有写序 `wroteSince`，零新名）。

**消融读数（实施席跑，父侧复核结论成立：每条都能让对应用例变红）**：

| 消融 | 动作 | 反向读数 |
|---|---|---|
| A | 到顶条件改回只认 5 条计数 | `32-1` 红（零诚实提醒） |
| B | A 判据改回只认 `FILE_MUTATORS` | `32-3` 红（全委托会话冻在 3 条） |
| C | `MAX_ADVISOR_REMINDERS` 5→40 | `32-2` 红（实读 7 条） |
| D | 写序推进点只复位预算不复位位 | 探针红（静默放行） |
| E | 删写序推进点的 `_advisorHonestySent = false` | `32-4` 红（诚实提醒后又改代码却静默） |

**集成测试面**：本批在 `test/integration/advisor-guard-reminder-cap.test.mjs` 新增/改写 `32-1`–`32-4` 四行（RTM 故事 32），全仓集成年内 **137** 例（预算窗口 50–100 的上界口径按「case 数」计，本批净增 3 例、改写 1 例）。

**未做（如实交代）**：

1. **轮数墙续跑机制**未碰（用户 20:02 划定边界）。
2. **设计轮提醒无上限 ∥ `subagent-async.mjs` 陈旧注释与悬空 `D-A3`**：已单列台账 `#2040`，另一缺陷。
3. **「自动回合不清零」这条无自动化覆盖**（设计已声明靠人工读数；实施席实读 `run-start.mjs` 两支互斥与 `_inheritedGuard = null` 消费点）。
4. **verify 面同族病理未量**，不做推断。
5. **`test/RTM.md` 单行长度**：四行 410 ∥ 355 ∥ 335 ∥ 320 字符，越该档 §11.2 的 300 上限；全档 49 行同样越线属既有形态，单改这四行会与邻节体例不一，本轮只登记不改。

**单测档处置**：`docs/batches/2026-11-04-advisor-guard-loop.test.mjs` 按纪律收口即删（不留可执行档）。

**台账**：`#2039` → 见 ledger 调用。
