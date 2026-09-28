# 2026-09-28 · desktop-idle-wake
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-28 · 来源 = 用户 2026-09-28 10:04「我估计是子agent完成后返回的接线有问题」→ 10:11「对呀，就是这个空闲会话不会完成唤醒就是问题啊！」→ **10:13「你跟vsc和cli对比一下，把这个给补上」**；父侧自推立批（07:13 授权射程内）；实因 = 核察 #8 全链判定（第三环「settle ⇒ 起父回合」桌面零接 + 提示面全空）；台账 **#504**；同族 = #496 / #498 / #446。
> 台账 = #504（docs/desktop/requirements/PROJECT.md · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-28
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 来源（用户 10:04–10:13）

① 10:04「我估计是子agent完成后返回的接线有问题，你查一下」→ ② 10:11「对呀，就是这个空闲会话不会完成唤醒就是问题啊！」→ ③ **10:13「你跟vsc和cli对比一下，把这个给补上」**。本批 = 对③的落地（父侧自推 · 07:13 授权射程内）。

### 1.2 实因（核察全链实读 · 三环表）

| 环 | VSC / CLI 现状 | 桌面现状 | 证据 |
|---|---|---|---|
| ① settle | ✅ 核通 | ✅ 通 | `async-settle.mjs:200/:270-276` |
| ② 报告入会话 | ✅ 核通 | ⚠️ 兜底支——回合尾才注入（`suspDriven` 缺省 false）⇒ 模型再下一回合才读到 | `subagent-async.mjs:358-392` · `run-stages.mjs:248-266` · `agent.mjs:102/:445` |
| ③ **settle ⇒ 起消化回合**（唤醒） | ✅ CLI = `tui/suspension-drive.mjs:240/:256-307`（入口 `agent-turn.mjs:362-372`）· ✅ VSC = `extension/suspension.mjs:245`（入口 `panel-turn-stages.mjs:197` · `panel-turn-loop.mjs:90-96`） | ❌ **零**——回合入口仅 `msg:send`（`ipc.mjs:78`）· 无 `suspDriven` / `_suspended` / 轮询（`agent-host.mjs:159` · `agent-assemble.mjs:53-95`）；核 `startSuspension` 产品侧零消费者 | 同左 |
| 完成提示面 | ✅ VSC 有失焦系统通知（`notify.mjs:9-18`） | ❌ 全空（位标不置 `done` / 状态栏不入告警 / 通知 / 闪烁 / 声音零命中）——仅右列块被动可见 | `events.mjs:332-345` · `statusline.mjs:61-65` |

⇒ 空闲期子任务干完 = 结果停池、静默到用户下次开口；且桌面无任何「响一下」的面。用户原话即此现象。

### 1.3 本批条目（拟 · 设计轮定形）

- **B1 空闲驱动**（核心）：桌面接一条挂起 / 空闲驱动——**对比 VSC `extension/suspension.mjs` ∥ CLI `tui/suspension-drive.mjs` 逐面出对位表**，按「对齐」口径同形落桌面（消费核 `startSuspension` ∥ 同形移植——设计轮裁定并录由）；
- **B2 完成提示面**：桌面「子任务完成」的主动可见面——对照 VSC `notify.mjs`（失焦系统通知）+ 位标 / 状态栏候选，设计轮出对位表定形；
- **B3 #446 同根（timer 空闲唤醒）**：驱动面设计须与 #446 同根对齐——设计轮判：一并覆盖 ∥ 显式登记不覆盖并给由。

### 1.4 边界与排期

- 对齐口径 = §3.6（VSC / CLI 的形 + 行为）；零新机制（消费核件 / 同形移植）；实施与 align-2 同片文件面（`main/**` + `renderer/**`）⇒ **串行**；
- **排期 = align-2 之后、align-3 之前**（同为机制面）；设计派单待共享文档窗口（当前外壳批评审在飞）；
- 需求档落点：D4「挂起态与 digest」面收正 + 设计档 §10 **S 行**（digest 面零落点）随批消解。

### 1.5 落点

- 台账 = **#504**（待设计 → 在途）；核档 `AGENT-LOOP-ASYNC-POOL.md:16/:392/:461`（「桌面无挂起窗」在册）随批收正。

### 1.6 派单（10:14 · 用户「跑起来啊！」）

**设计已派**（不等窗口——**写入次序门控**代替等待）：`UI.md` / 需求档（外壳批复评冻结中）排最后 + 落笔前实读外壳批档 §1 状态行确认解冻（未解冻 ⇒ 停该步 + 上抛）；其余落点（本批 §2 · `design/PROJECT.md` · `IPC.md` · `RENDERER.md` · `RENDER-CORE.md` · `AGENT-LOOP-ASYNC-POOL.md`）当前窗口自由，先落。

### 1.7 收尾随动两项（待解冻 · 父侧微改登记）

① UI.md 随落已核验落位（`docs/desktop/design/UI.md:19` / `:21` / `:456-457`）——`docs/desktop/design/PROJECT.md` §4.2 UI.md 行「本批（待解冻）」+ §10 **BD** 行「解冻 ⇒ 随落」两处状态句**待随动**（现值已过时）；② 本档 §2 状态行半句「（UI.md/需求档门控停笔）」同属落笔前盘面。**两项均为单行状态微改 · 唯 `design/PROJECT.md` 正被 align-2 评审批次冻结 ⇒ 解冻后父侧直接执行**（可 revert · 标记）。用户 11:13 备注（现状痛点实录）：「现在没有空闲唤醒，得我隔一段时间叫你去看看才行」——本批要因再证。

### 1.8 收尾随动执行（2026-09-28 · 父侧直接执行 · 可 revert）

承 §1.7 登记（解冻后执行）——五处单行状态微改落位：① `docs/desktop/design/PROJECT.md:398`（§4.2 UI.md 行：「门控停笔 / 本批（待解冻）」⇒「门控解除 + 三处已随落」）；② 同档 `:619`（§10 BD 行转「已消解（2026-09-28——外壳批复评通过解冻）」）；③ 本档 §2 两处状态行半句（「（UI.md/需求档门控停笔）」⇒「UI.md 随落 2026-09-28 · 门控解除」）；④ 本档 §2.9 项 1（「未解冻 ⇒ 停笔」⇒「已解冻并随落」）。裁决依据：外壳批复评 2026-09-28 通过（其 §3 在册）+ UI.md 三处落位已在 §1.7 核验。

### 1.9 用户质询核查：上抛消息（notify_parent ask）的激活接线（2026-09-28 11:59 · 父侧实读三端）

**质询**：用户「我发现现在上抛消息也没有自动激活，你检查一下接线处理了这个场景没有。」

**核查结论（实读坐标）**：
- **核内 = 已实现（一等公民）**：子侧 ask 入队 ⇒ `thincoder-core/agent-tools/parent-channel.mjs:130-132` **唯一激活点** `wakeAsyncWaiters(parent)`（note 不唤醒——避轮风暴）；核挂起驱动循环第 2 步谓词 = `pending 非空 ∨ upstreamWaiting` ⇒ 开**唤醒轮**（`upstreamTurn: true`）——`thincoder-core/agent/suspension.mjs:190-193`（档头 :5-7 同载）；消费 = 回合边界单点 `drainChildUpstream`（`parent-channel.mjs:159-172`）。
- **CLI / VSC = 已接线**：CLI `thincoder-cli/src/tui/suspension-drive.mjs:183-198`（upstream 分支 ⇒ 标签「自动回合：答复子代理的在飞提问…」）+ :219-234 行表注；VSC `thincoder-vscode/src/extension/suspension.mjs:314-338`（`upstreamWaiting` 谓词 + `tier = upstream ? "ask" : "digest"` + `upstreamAskLabelVars`）+ `src/agent.mjs:208` 回合头 drain。
- **桌面 = 今天不激活（与「完成不唤醒」同根）**：无挂起驱动 ⇒ `_asyncWaiters` 无人注册 ⇒ wake 空转 ⇒ ask 躺队列直到下一条用户消息开回合才被 drain（#16 的 ask 即此形态）。**本批 B1 落地后随件打通**（直消费核件 ⇒ 唤醒轮零额外实现）；可见面已备（`docs/desktop/design/IPC.md:25`——`ev:digest` 载荷含 `tier:"ask"` + `from` / `msg`）。

**两项处理（父侧裁定）**：① **实施任务书点名**——验收补一条「ask 入队 ⇒ 唤醒轮（`upstreamTurn` 旗标 + 回合头 drain 注入）」用例（测试面 · 随修随加——2026-09-27 裁定不走设计轮；§2.7 现六条无此案）；并点名「对位表『唤醒』行的 ask 通路按核件实态实现（零额外机制）」。② 口径备案：**ask 唤醒轮不触发系统通知**（B2 两档 = 用户回合完成 ∕ 消化轮起跑且 `pending > 0`；ask-only 轮 `pending = 0`）——与「通知只因完成而起」口径一致；如需 ask 亦响铃 ⇒ 加一档（待裁）。

### 1.10 评审轮 1 裁定表 + 修正轮派发（父侧 · 2026-09-28 12:04 · 承 §3 轮次 1 · pass 0🔴/6🟡/6🔵；用户 12:02「落地吧」为落地令）

| # | Action | Detail |
|---|---|---|
| 1 | Dispatched | 修正轮 #19：先实读盘面（`preload.cjs` `EVENT_CHANNELS` / `events-subscribe.mjs` 订阅表 / `host-floor.test.mjs` 断言）定权威数（含 `ev:subchunk` 在册之核——若盘面 12 = 缺口 ⇒ 停手上抛），全档计数同值（PROJECT/RENDERER/IPC 诸处 + 「十通道 / 十二通道」残句清） |
| 2 | Deferred | 「现行」列基线重算延后至 **align-2 结算后**（实际数取决于其拆档实读；届时对盘回填——本批实施前置步） |
| 3 | Dispatched | 修正轮：段 3 完整态机（挂起句 / 运行中 / 就绪 / approval 零节点 + 优先序）单源合成，两处指针随动 |
| 4 | Dispatched | 修正轮：`[data-digest]` 补入帧尾态刷成员与根子序 / 插入点纪律（在场判据 + 出现 / 退场 / 更新路径） |
| 5 | Dispatched | 修正轮：补挂起窗键面路由判据节（`dispose` 触发面对照表 · 非同键输入处置 · 唤醒 ∕ 消化轮会话钉定与跨键互斥） |
| 6 | Dispatched | 修正轮：定 `notify.*` 文案持有面与解析路径（主进程自持 ∥ 注入句串），同步 §4.2 计账行与词键注 |
| 7 | Dispatched | 修正轮：§6.1 D4 行 / §7 点名本批机检面与真机面（或明示真机面归人工走查 + 父侧真跑闭合） |
| 8 | Dispatched | 修正轮：逐项点名 N / M ↔ `ev:susp` 四计数与 `susp.*` 三键取值条件 |
| 9 | Dispatched | 修正轮：`PROJECT.md:383` 括注补「边界」（四件 = 计数 ∕ 边界 ∕ 回收 ∕ 冻结） |
| 10 | Dispatched | 修正轮（§2 记录面 · 段权处置）：双状态行收敛 + §2.2 半句随 §1.8 口径 |
| 11 | Dispatched | 修正轮：`IPC.md` 补本批变更记录行（两通道 + 计数 + 词键注 + 挂起窗口头） |
| 12 | Dispatched | 修正轮：实读 `thincoder-core/agent/suspension.mjs` 导出面核验（`startSuspension` 签名 / `suspDriven` / `backgroundCounts` / `carrierField`——不符 ⇒ 停手上抛；一致 ⇒ 设计随注实读坐标） |

**同办**：范围外备注（`SHELL.md:42` / `:43` 同族残句）折入修正轮一并收正（可 revert）；**§1.9 的 ask 用例点名沿用** = 修正轮后随实施任务书钉上。**链序**：修正轮 ∧ #16/#17（align-2 实施）并行 → 落地核验 → 复评（轮 2）→ §4 代签 → 实施（D1 驱动/通道面 → D2 渲染面，dependsOn align-2）。

### 1.11 口径裁定：唤醒轮通知=对齐两端（用户 2026-09-28 12:03）

**用户口径**：「唤醒轮弹不弹消息跟 cli 和 vsc 对齐。」

**两端实读（父侧亲核）**：
- **VSC**：`thincoder-vscode/src/extension/notify.mjs:9-18` 单函数 `notifyCompletionIfUnfocused()`（失焦才发；聚焦 = no-op）；唯一调用点 `thincoder-vscode/src/extension/panel-callbacks.mjs:233` = `if (!autoTurn) notifyCompletionIfUnfocused()`——其上注释逐字：「AGENT-LOOP-ASYNC-POOL.md §6.8: digests are system-driven turns — **no completion notification per digest**（the user sees the summarized results when they return）」⇒ **auto 轮（消化轮 ∥ 唤醒轮）一律不弹**。
- **CLI**：零 OS 通知机制（TUI；全 src 无 notify⁎ 命中）。

**裁定**：① **纯 ask 唤醒轮（`upstream ∧ pending=0`）⇒ 不弹**（= CLI ∥ VSC 一致形；═ 原 B2 两档判据的下自然推论——语义零改，仅显式钉判据）；② **合并轮（`pending>0` ∧ upstream）⇒ 按档② 弹**（完成面在场，沿既有判据）；③ 明示备案 = **档②（消化轮起跑弹一条）对 VSC「digest 不弹」= 设计内有意的加档**（理由句在册 §2.4「被否 = 纯 VSC 同形（要因无声）」）——本次口径只裁唤醒轮，档②保留（已向用户上抛一句可选裁定）。

**落实**：① 追加指令已 send 修正轮 #19——B2 通知判据处补一行明示（「纯 ask 唤醒轮不弹——对齐 VSC `!autoTurn` ∥ CLI 零通知」+ 实读坐标），`PROJECT.md` KD-35 ∥ §2.4 通知行择一处 + 指针；② 实施任务书钉「通知三判 + ask 用例」。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（B1–B3 全落——B1 驱动 = 消费核件 `startSuspension` · B2 提示面 = 失焦通知两档 · B3 = 显式登记不覆盖 + 给由；两张对位表在册；落点六档已落；UI.md = 已随落（2026-09-28 · 门控解除）；修正轮 #19 已落（§3 发现 1–12 逐号 · 2026-09-28）；收尾微轮已落（§2.11——残输入兜底形 + 三新档 ∕ 两测试档登记 · 2026-09-28））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.1 本批条目（覆盖 = B1 / B2 / B3 · 批档 §1.3）

| # | 条目 | 判据（可机检） |
|---|---|---|
| B1 | **空闲驱动**：桌面接挂起/空闲驱动——对比 VSC ∥ CLI 逐面出对位表（§2.3），按「对齐」口径落形 | 裁定 = **消费核件 `startSuspension`**（非第四份移植——KD-34）；入口 = 回合尾 `poolLive(agent)`；挂起空闲输入开放（`pushInput` + `wake`）；`dispose` = 会话中止；平 node 直测面 = 新档 `thincoder-desktop/src/main/suspension-drive.mjs`（拟新增） |
| B2 | **完成提示面**：失焦系统通知 + 位标/状态栏候选（对位表 = §2.4） | 通知两触发档（用户回合完成 `!autoTurn` / 消化轮起跑 pending>0）+ **失焦门**；位标/状态栏两候选裁定句在册；平 node 直测面 = 新档 `thincoder-desktop/src/main/notify.mjs`（拟新增） |
| B3 | **#446 同根（timer 空闲唤醒）** | **显式登记不覆盖 + 给由**（§2.5）：对齐口径（VSC 亦不支持）+ 剩余理由三条 + 消解窗口；核档 §6.30 桌面行理由收正随批 |

### 2.2 设计档落点（本批已落 · 门控除外）

- `docs/desktop/design/PROJECT.md`：§2 增 **KD-34 / KD-35 / KD-36**（驱动 = 消费核件 · 提示面 = 失焦通知两档 · 挂起/消化可见面）；§4.2 增本批行（main 五档 + renderer 八档 + 测试面 + 设计档 + UI.md 门控行）；§6.1 **D4 行补本批句**；§10 **S 行转已消解**（D4「挂起态与 digest」两落点定形）+ 增 **BB / BC / BD** 三行；变更记录一行。
- `docs/desktop/design/IPC.md`：§1 增 **`ev:susp` / `ev:digest`** 两行 + 载荷键集 **十三 ⇒ 十五通道** + 事件映射段 + 会话键面/订阅面计数随动 + 新增**「挂起 ∕ 消化词键注」**；§2 `msg:send` / `msg:interrupt` 行补**挂起窗口头**（入队 / 回合级中断）。
- `docs/desktop/design/RENDERER.md`：§1 索引增「挂起窗与消化轮」行；§1.1 增**两通道归约 + 消化行族**条（`susp`/`digest` 两切片 + `[data-digest]` 非块节点组 + 块回收面）；变更记录一行。
- `docs/render-core/design/RENDER-CORE.md`：§3 行 8（`chat-status.js` 端）补桌面消化状态行同判句；§9 增「桌面空闲唤醒」端差/登记三条；变更记录一行。核件面零改。
- `docs/core/design/AGENT-LOOP-ASYNC-POOL.md`：**三处「桌面无挂起窗」收正**（§6.8 接入面句 + §6.30.1 桌面端条 + §6.30.5 桌面行理由）；变更记录一行。机制语义零改。
- `docs/desktop/design/UI.md`：**已解冻并随落**（2026-09-28——外壳批复评通过；三处落位 `:19` / `:21` / `:456-457` 已核验）⇒ 内容 = 本 §2 定形（PROJECT.md §10 **BD** 行登记）。

### 2.3 B1 机制设计（驱动）+ 对位表

**机制句**：桌面在**回合尾结算后**（终局事件已出、在飞表已释）判 `poolLive(agent)` —— 真 ⇒ 进挂起会话：`startSuspension({ carrier: agent, runTurn, abortSignal, hooks })`（核件直消费）。驱动胶水（会话寄存器 + hooks + 输入/关闭路由）出档 `thincoder-desktop/src/main/suspension-drive.mjs`（拟新增）；单回合执行面 = 宿主既有三径结算提取（`send` ∕ 驱动同源，`suspDriven: true` ⇒ 已 settle 留池等消化）。

**逐面对位表（触发源 / 会话状态 / 循环 / 等待 / 唤醒 / 关闭 / 失败面）**：

| 面 | CLI（`thincoder-cli/src/tui/suspension-drive.mjs`） | VSC（`thincoder-vscode/src/extension/suspension.mjs`） | 桌面（本批落形） |
|---|---|---|---|
| 触发源 | 回合尾 `poolLive(agent)`（`thincoder-cli/src/tui/agent-turn.mjs:362`） | 回合尾 `poolLive(history)` + 释放窗口（`thincoder-vscode/src/extension/panel-turn-stages.mjs:160-197`） | 回合尾结算后 `poolLive(agent)` ⇒ 核件入口（`thincoder-desktop/src/main/agent-host.mjs` 三径结算链尾） |
| 会话状态 | `agent` 字段形（`_suspended` / 双池 / pending 单容器 / `_asyncWaiters`） | depth-0 `history` 数组字段形 | **agent 字段形 = CLI 形**（桌面装配实例跨回合 ∕ 跨会话键存活；核 `carrierField` 两形皆读） |
| 循环 | `while` 行表四步（sweep → 输入优先 → digest → 池空退出 → 等待） | 同（行表同源） | **核件 `startSuspension` 循环 = 单源**（本批消费——非第四份实现） |
| 等待 | `waitForSettleOrWake`（`_asyncWaiters` + `state._suspWake` + abort + **timer 第三兑现态**） | `waitForSettleOrWake(panel, susp)`（双载体注册 + abort） | 核件等待面（`_asyncWaiters` + `latch.wake` + abortSignal——**无 timer 面，见 §2.5 B3**） |
| 唤醒 | settle 尾 `wakeAsyncWaiters` + 用户 Enter 入队 + Ctrl+C | settle 尾同 + `panel._suspWake` + 面板 abort | settle 尾（核单点零改）+ `msg:send` ⇒ `pushInput` + `wake`（用户输入优先）+ `dispose(key)` 会话 abort |
| 关闭 | 池空 + pending 空 + 无输入 ⇒ idle；abort ⇒ 清池不注入 + 队列回 `state.queue` | 同 + 队列兜底以普通回合续发 + 出窗广播 | 核件 `finally`（`finishSuspension` 残余注入 / 清池）+ 端侧钩子（回收 / 冻结 / `ev:susp` 出窗）；**残输入兜底 = 普通回合续发**（VSC 形——出窗返值 `residualInput`（`thincoder-core/agent/suspension.mjs:230`）非空 ⇒ 以普通回合续发〔不静默丢〕；两窄径 = 窗退出等待期中落槽 ∥ 消化轮非 Abort 失败；先例 = VSC 队列兜底）；队列兜底（附件项除外——`busy` 留队重试） |
| 失败面 | digest 轮 AbortError ⇒ 重入循环；非 Abort ⇒ 上抛 | 同（`digest:stopped` 日志） | 核件 catch 语义同源；端侧入口 catch ⇒ 记错 + `ev:susp {active:false}`；**池内残余自愈**（下一回合尾重入 ⇒ sweep ⇒ digest——零丢失） |

**端侧钩子（四件 · 落 `suspension-drive.mjs`）**：计数 ⇒ `ev:susp`；边界 ⇒ `ev:digest`（autoTurn 支起跑/收尾两发）；回收 ⇒ 消化完成逐条 `ev:subagent { status: "done" }` 补发（`settled` 驻留块归档入流——VSC `reclaimDigestedBlocks` 同形）；冻结 ⇒ 退出兜底同型（残项逐条补发）。

### 2.4 B2 机制设计（完成提示面）+ 对位表

**机制句**：桌面新增**失焦系统通知**（主进程 `Notification`，策略面出档 `thincoder-desktop/src/main/notify.mjs`（拟新增）——失焦门 + 两触发档 + 点击聚焦，`notify` ∕ 焦态判据注入可平测）；位标 / 状态栏两候选 = 裁定句（下表）。通知时机 = ① 用户回合完成（VSC `thincoder-vscode/src/extension/notify.mjs` 逐字同判据 `!autoTurn`）② 后台消化轮起跑（pending > 0 —— 本批要因「子任务完成」；同批 settle 的自然合并点）。

| 候选 | VSC 现状 | CLI 现状 | 桌面定形（裁定 + 判据式样） |
|---|---|---|---|
| 系统通知 | `notify.mjs:9-18` 失焦才发（回合完成；`!autoTurn`） | 无 | **落**：`Notification` + **失焦门**（focused = no-op「never noise」）+ 两触发档；`title` = 会话标题（不可得 ⇒ 零携）+ `body` = 句（档① `notify.done` 值 = VSC 逐字 ∕ 档② `notify.subagents` 新键）；点击 = 聚焦窗口（reveal 语义——不切会话）；判据 = 失焦 ∧ 触发 ⇒ 通知恰一条；聚焦 ⇒ 零条（假 `notify` 直驱用例） |
| 位标 | 无（VSC 无标签位标） | 无 | **既有面不动**：`done` 码（回合尾置码 ∕ 开页清码——挂起窗内随 digest 回合尾自然点亮）；判据 = 窗内 digest 尾 ⇒ 该键位标含 `done`（既有归约面零改） |
| 状态栏 | `status-bar.js:51-61` 挂起句（`susp.*` 三键） | 状态行 `state.status` = `backgroundStatusText`（同句） | **落**：状态行段 3 第三态 = 挂起句（zh 值 = CLI 逐字 ∕ en = VSC 逐字）；跨会话告警码集保持 `{approval, running}`（`done` 不入——既有裁定：「完成非告警面」；跨会话可见靠标签位标）；判据 = `active ∧ n>0` ⇒ 段文 = 「后台 N 子代理运行中〔 · M 完成待消化〕」；`active=false` ⇒ 回落两态词 |

### 2.5 B3 判定（#446 timer 空闲唤醒）

**判 = 显式登记不覆盖 + 给由**（不并入本批）：

1. **对齐口径**：VSC 亦不支持（timer-wake 批 §6.30.5 表：「有挂起窗但空转期无等待器」+ 端内 `_pendingTimers` 清零端差）——「对齐 = VSC 形 + 行为」下桌面不接不倒挂；
2. **本批射程 / 零新机制**：timer 自唤醒需三件新面（核件 `waitForSettleOrWake` **无 timer 第三兑现态**（CLI 自有驱动独有）+ 宿主空闲 deadline 闩（主进程零轮询）+ 可见面新 `ev:*` 通道）——超「消费核件」边界；
3. **同根对齐已落**：本批驱动器即未来 timer 自唤醒的载体（窗口在途——`#446` 的「同根」= 同一挂起窗 + 同一宿主回合执行面）。

**核档收正（随批）**：`docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.30.1 桌面端条 / §6.30.5 桌面行——原「无挂起窗」理由**不再成立**（随 B1 收正）；剩余理由三条（无闩 / 无第三兑现态 / 可见面白名单随动）在册；**消解窗口 = 桌面 timer 自唤醒另批**（登记后续项）。

### 2.6 受影响文件与测试面

逐档「现行 ⇒ 预期」单源 = `docs/desktop/design/PROJECT.md` §4.2「本批（桌面空闲唤醒）行」。要点：

- **主进程**：新档 `thincoder-desktop/src/main/suspension-drive.mjs`（拟新增 · ≈130）· 新档 `thincoder-desktop/src/main/notify.mjs`（拟新增 · ≈55）· `agent-host.mjs`（254 ⇒ ≈300：单回合执行面提取（`send` ∕ 驱动同源 · `suspDriven: true`）+ 挂起接管 + 三路由 + 注入面扩）· `main.mjs`（装配注入三行）。
- **通道面**：`preload.cjs`（`EVENT_CHANNELS` 12 ⇒ 14）· `events-subscribe.mjs`（订阅表 12 ⇒ 14）。
- **渲染面**：`events.mjs`（两通道归约 + 消化行游标——**与 align-2 串行**，其拆 `page-read.mjs` 先落）· `views/statusline.mjs`（段 3 三态）· `views/chat.mjs`（消化行组）· `mount-status.mjs`（`STATUS_KEYS` + `susp`）· `app.mjs`（`CHAT_KEYS` + `digest`）· `i18n.mjs`（+5 键 × 2 语；digest 词面**零新键**——核字典投影直取）· `chat.css`（`.digest-*` 两规则）。
- **测试面**：原址补例——`agent-host`（挂起进出 ∕ 输入路由 ∕ digest 中止 ∕ dispose）· `events-reduce`（两通道归约 + 游标）· `views-statusline`（段 3 三态）· `views-chat`（消化行组）· `host-floor`（`EVENT_CHANNELS` 14 断言）；新档 `thincoder-desktop/test/agent-host-suspension.test.mjs`（拟新增——驱动族平 node 直测）；真机 = 集成域现有档原址补例（**D16 义务**：凡改可见面 ⇒ 验收含一条真 Electron 使用面用例）；测试档随修随加（2026-09-27 裁定 · 不进设计面条目）。
- **串行关系**：实施与「对齐第二批」（align-2）同片（`main/**` + `renderer/**`）⇒ **串行**（align-2 先落；本批基线 = align-2 落形后盘面）；本设计零触碰 align-2 段落（增量编辑）。

### 2.7 验收对照（回指 B1–B3）

| 条目 | 验收判据（式样） |
|---|---|
| B1 | ① 挂起进入：回合尾池 live ⇒ 驱动器在场（`send` 结算后 `susp` 切片 `active:true`）② 空闲 settle ⇒ 自唤醒 digest 轮（假 runTurn 直驱：settle ⇒ 消化轮开跑；不借用户输入）③ 窗内输入 ⇒ `pushInput` + `wake`（用户回合优先于消化轮）④ digest 中 interrupt ⇒ 回合级中止 + 重入（不退出窗）⑤ `dispose` ⇒ 会话中止（清池不注入）⑥ 池空 ⇒ 窗退出（`active:false`）+ 汇总归档 |
| B2 | ① 失焦 ∧ 用户回合完成 ⇒ 通知恰一条；聚焦 ⇒ 零条 ② 失焦 ∧ 消化轮起跑（pending>0）⇒ 通知一条（句 = `notify.subagents` n）③ 点击 ⇒ 聚焦调用（注入桩读数）④ 通知面缺位 / 抛 ⇒ 零连带（回合链不破） |
| B3 | 判据 = 核档 §6.30.1 / §6.30.5 两处桌面行**无「无挂起窗」残句** + 本 §2.5 三条理由在册（登记不覆盖） |

### 2.8 关键决策（本批）

1. **消费核件 vs 同形移植**（批档 §1.3 点名裁定项）：**消费核件 `startSuspension`**——理由 = 核件即两端现行驱动的同源移植（档头自注）+ 载体零预设 + desktop agent = CLI 形载体；被否 = 第四份移植（漂移面）。录由 = `docs/desktop/design/PROJECT.md` §2 KD-34。
2. **提示面两触发档**：VSC 逐字档（用户回合完成）+ 本批要因档（消化轮起跑）——被否 = 纯 VSC 同形（要因无声）/ 每 settle 逐条（噪声）；录由 = KD-35。
3. **digest 可见面 = 流内状态行 + 挂起句入段 3**（S 行消解）：VSC `.digest-status` / CLI 状态行双标尺各有落点；被否 = 新立状态栏段（段集闭集）/ 不落边界；录由 = KD-36。
4. **挂起窗输入开放 + 附件边界**：窗内文字入队（用户输入优先）；含附件 ⇒ `busy` 留队（核件输入面 = 文本单形——登记 §10 BC）。
5. **零新机制 / 零核改**：本批不动核包（消费既有核件）；`suspDriven: true` = 既有核 opts；两事件通道 = 宿主自产。

### 2.9 上抛 / 报告项（供父侧处置）

1. **UI.md 门控结果**：**已解冻并随落**（外壳批复评通过 2026-09-28）——UI.md 三处（状态栏行 / 对话流行 / 变更记录）已落位（`:19` / `:21` / `:456-457`——本批档 §1.7 已核验）。
2. **需求档随动（笔权在父侧，本设计零改）**：D4 面已消解（原句覆盖两落点——无需改）；「完成提示面（失焦通知）」= 桌面新落面（VSC 有、CLI 无）——是否入需求条款 ⇒ 归父侧裁。
3. **发现项：桌面无 turn-cap 续跑循环**（实读零 `ContinueError`；CLI ∕ VSC 均有）⇒ 撞帽 = 失败径；**消化轮撞帽同此**（登记 PROJECT.md §10 **BB**；另批对齐）。
4. **边界：核件输入面 = 文本单形** ⇒ 挂起期附件载荷 `busy` 留队（登记 §10 **BC**；消解路 = 核件扩对象形 ∥ 端侧侧表——另裁）。
5. **实施前置（未核实项）**：Windows 通知呈现依赖 AppUserModelID（Electron 行为面——本仓无可读面，**未核实**）⇒ 实施轮真机读数为准（备选 = `app.setAppUserModelId` 一行）；另案 = 通知点击「直达会话」须新主→渲染命令通道（被否候选，另裁）。
6. **机检读数**：`node scripts/doc-check.mjs --root .`（as-of 2026-09-28 设计轮）——本批六档**零新增**（悬空 / 行宽）；存量红在他档（悬空 47 · 行宽 35，as-of 基线）——本批零改。

### 2.10 修正轮 #19 记录（设计评审轮 1 · 发现 1–12 逐号 · 2026-09-28）

裁定 = §1.10（父侧逐条接受）；发现全文 = §3 轮次 1。逐号（行号 = 修正轮后现值）：

| # | 处置 | 落点（号 → 改动 file:line） |
|---|---|---|
| 1 | 通道计数权威数 = **13**（盘面实读——`EVENT_CHANNELS` ∧ 订阅表；**`ev:subchunk` 在册** ⇒ 非缺口，无需上抛）；本批 = **13 ⇒ 15**；残句清（九处 + 本批表三行） | `docs/desktop/design/PROJECT.md` :149 / :155 / :156 / :286 / :404 / :410 / :413 / :642 · `docs/desktop/design/RENDERER.md` :32 / :35 / :85 · `docs/desktop/design/SHELL.md` :42 / :43 |
| 2 | **Deferred**（父侧裁定——「现行」列基线重算延后至 align-2 结算后）⇒ 本舱零改；盘面实读已备（供届时对盘回填）：`events.mjs` **349** ∕ `page-read.mjs` **96** ∕ `i18n.mjs` **470** ∕ `views/chat.mjs` **280** ∕ `views/statusline.mjs` **269** ∕ `chat.css` **315**（as-of 2026-09-28 修正轮） | — |
| 3 | 段 3 完整态机单源合成（挂起句 ∕ 零节点 ∕ 运行中 ∕ 就绪 + 优先序 + 交叠角落）；「第三态」命名收正（挂起句支 vs 零节点支） | `docs/desktop/design/UI.md` :112（单源）· :21 / :206（指针随动）· `docs/desktop/design/PROJECT.md` :74（KD-36 优先序随动） |
| 4 | `[data-digest]` 补入**帧尾态刷成员** + **根子序 / 插入点纪律** + 在场 / 出现 / 更新 / 退场路径 | `docs/desktop/design/RENDERER.md` :41（路径条）· :63 / :65（帧尾 / 插入点）· :73（族成员） |
| 5 | 挂起窗键面路由判据节（dispose 触发面对照表 + 非同键处置 + 会话钉定 + 跨键互斥） | `docs/desktop/design/PROJECT.md` :80（**§2.2 新增**）· :72（KD-34 指针） |
| 6 | `notify.*` 持有面 = **主进程自持**（渲染面词表零此两键；非 i18n 下发面）；计账行同步 | `docs/desktop/design/IPC.md` :72-73 · `docs/desktop/design/PROJECT.md` :411（i18n 行） |
| 7 | 机检面 / 真机面点名（真机面 = 人工走查 + 父侧真跑闭合——fixture 家无凭据 ⇒ 真跑子任务面不可离线复现） | `docs/desktop/design/PROJECT.md` :413 · :437（D4 行指针）· :560-563（§7 新注） |
| 8 | N / M ↔ `ev:susp` 四计数 + `susp.*` 三键取值条件逐项点名 | `docs/desktop/design/IPC.md` :69-70 · `docs/desktop/design/UI.md` :112 |
| 9 | hooks 四件括注补「边界」（计数 ∕ 边界 ∕ 回收 ∕ 冻结） | `docs/desktop/design/PROJECT.md` :400 |
| 10 | 双状态行收敛（`status` 动作更新单状态行 + 段内直接编辑删重复行，可 revert）+ §2.2 半句随 §1.8 口径收正（「门控停笔/解冻后随落」⇒「已解冻并随落 2026-09-28」） | 本档 §2 :95（单状态行）· :113（§2.2 UI.md 条） |
| 11 | `IPC.md` 本批变更记录行补（两通道 + 计数 + 词键注 + 挂起窗口头） | `docs/desktop/design/IPC.md` :307-308 |
| 12 | 核侧符号实读核验**一致**（`startSuspension` 签名 / `backgroundCounts` / `suspDriven` / `carrierField`——无核改面）⇒ 设计随注实读坐标 | `docs/desktop/design/PROJECT.md` :72（KD-34 实读坐标句） |

**doc-check 读数**（`cd thincoder && node scripts/doc-check.mjs --root .`）：修正轮前 = 悬空 **47** ∕ 行宽 **37**；修正轮后 = 悬空 **47** ∕ 行宽 **36**（净增 0 ∕ −1——新行全 ≤300；`docs/desktop/design/RENDERER.md:32`（326）顺笔收 ≤300）；存量红在他档零改。

**同办面**：`docs/desktop/design/SHELL.md` :42/:43 残句清（评审范围外备注折入）；变更记录行五档——PROJECT :844-846 · IPC :307-308 · RENDERER :171-172 · UI :462 · SHELL :170。

**实施面注意**：① 本档 §2.4 状态栏行之「`active ∧ n>0`」判据句式**以 `docs/desktop/design/UI.md` §1「本批注（对齐重定位）」项 1 表行 3 为准**（`active` 真 + `susp.*` 三键条件组装——修正轮收正）；② §2.6 通道面「12 ⇒ 14」两处同理以 §4.2 本批行 **13 ⇒ 15** 为准。

**范围外观察（报告父侧，未动）**：装配表（`agents`，键 = 槽号串）跨项目切换无清点——`dispose` 现仅 `session:delete` 一处调用（`thincoder-desktop/src/main/ipc.mjs:124-126`）；切项目后同槽号键或命中旧项目 agent（`thincoder-desktop/src/main/agent-host.mjs:113-123` 同键复用 ∧ :107 装配取 `currentCwd()`）——是否既有缺陷 ⇒ 归父侧裁（本批零触碰；§2.2「切项目」行只定形**窗**的处置）。

**§2.6 实施面判据以 §4.2 本批行为准（两处细化）**：① 通道面计数三处（`EVENT_CHANNELS` / 订阅表「12 ⇒ 14」+ `host-floor`「`EVENT_CHANNELS` 14 断言」）⇒ **13 ⇒ 15**；② 词键计账（「+5 键 × 2 语」）⇒ **+3 键**（`notify.*` 两键 = 主进程自持，不计入渲染面词表）。

**承 §1.11 追加指令（不在 12 号内 · 用户 12:03 口径）**：KD-35 通知判据补一行——**纯 ask 唤醒轮**（`upstream ∧ pending = 0`）**⇒ 不弹**（对齐 VSC `!autoTurn` 门 ∥ CLI 零通知；合并轮 `pending > 0 ∧ upstream` 按档② 弹）；实读坐标 = `thincoder-vscode/src/extension/panel-callbacks.mjs:233`——落点 = `docs/desktop/design/PROJECT.md` :73（KD-35）。档② 保留（设计内有意的加档，已在案）。

### 2.11 收尾微轮（实施舱 A 上抛 ①② 落档 · 2026-09-28）

**依据** = 派单（实施舱 A 上抛 ①②④ 落档：① `residualInput` 兜底形 · ② 三新档 + 两测试档登记）；**零码改**（实现码已交付——核件 ∕ 需求档 ∕ 他批面零触碰）；逐号点修（下表）。

**① 残输入兜底形（裁定 = VSC 形 · 普通回合续发）**

机制句 = **残输入兜底 = 普通回合续发**——出窗返值 `residualInput`（`thincoder-core/agent/suspension.mjs:230`）非空 ⇒ 以普通回合续发（不静默丢）；**两窄径** = 窗退出等待期中落槽 ∥ 消化轮非 Abort 失败；对齐先例 = VSC 队列兜底同形。

**实施面差（记录 · 非本舱改）**：交付版出窗链未读该兑现值（`thincoder-desktop/src/main/suspension-drive.mjs` 出窗链 ∕ `thincoder-desktop/src/main/agent-host.mjs:168` 窗内恒回 `{ok:true}`）——两窄径下已受理文本可静默丢面；本落形 = **定形条**，补齐 ∕ 消解归父侧。

**② 落点（号 → 改动 file:line · 行号 = 落笔后现值）**

| 号 | 落点 |
|---|---|
| ①-1 | 本档 §2.3 对位表「关闭」行·桌面列（:128）——就地补句（可 revert）= 残输入兜底（VSC 形 + 两窄径 + 先例） |
| ①-2 | `docs/desktop/design/PROJECT.md` KD-34（:72）——补句同机制句 + 对位表回指（批档 §2.3） |
| ②-1 | 同档 §4.1（:140-:142）——三新档入册：`thincoder-desktop/src/main/suspension-drive.mjs` **157** · `thincoder-desktop/src/main/notify.mjs` **47** · `thincoder-desktop/src/main/turn-face.mjs` **52**（全实读 2026-09-28） |
| ②-2 | 同档 §4.1——四档按盘收正：`agent-host.mjs` **254 ⇒ 285**（:139）· `main.mjs` **93 ⇒ 104**（:134）· `ipc.mjs` **221 ⇒ 224**（:138——本批切项目级联 +3）· `preload.cjs` **58 ⇒ 58**（:156——`EVENT_CHANNELS` 13 ⇒ 15 落形，净 0） |
| ②-3 | 同档 §4.1 用例模块行（:202）——新档 `thincoder-desktop/test/agent-host-suspension.test.mjs` **232**（两向自检在册）⇒ **四十二档**（全清单 **44 ⇒ 48** 按盘收正）；`host-floor` 值 **303 ⇒ 313** 按盘刷新 |
| ②-4 | 同档 §4.1 越层段（:225）——`thincoder-desktop/test/host-floor.test.mjs` **313**（存量越线）· **消解窗口已到**；二择一给由 = 取「消解窗口」不取「补登记预案」：预案在册不缺（臂清单族拆分〔档名实施批定〕）· 缺 = 到期处置；拆档 ∕ 入 U95 例外面皆代码面改动（零码改不落）· 该档 ≪ 500 硬限 ⇒ 倾向续期 |
| ②-5 | 同档 §4.2 本批表（:410-:415）+ 测试面行（:424）——三新档行落值（`— ⇒ 157 ∕ 47 ∕ 52`）+ 三档收正（`agent-host` **285** · `main` **104** · `preload` **58 ⇒ 58**）+ 测试面两注（新档 **232** · `host-floor` **313** 存量越线在册） |
| ②-6 | 同档变更记录两行（:907-:908） |

**doc-check 读数**（`cd thincoder && node scripts/doc-check.mjs --root .`）：轮前 = 悬空 **64** ∕ 行宽 **35**；轮后 = 悬空 **64** ∕ 行宽 **35**（净增 0 ∕ 0——新行全 ≤300；触及非表格行 = `PROJECT.md` :225 **278** ∕ :907 **179** ∕ :908 **287** 字符）。轮前基数与前轮读数差异 = 他批在途盘面（本舱判据 = 净增）。

**范围外观察（报告父侧，未动）**：① `thincoder-desktop/test/agent-host.test.mjs` §4.1 两处值（:202 值列 ∕ :226 越层行 **338**）与盘面 **420** 不符（本批触碰该档——表外零改）；② `host-floor.test.mjs` §5 ∕ advisor 表读数 **312** 与本舱实读 **313** 差 1（历史盘面不可得——以实读为准落档）；③ `docs/desktop/design/PROJECT.md` :251「R3 后 **44 档**」· §7 :609「拟新增」状态词 · §10 **BE** 行（:693）「本批两通道未落地」句——现值过时（处置归父侧 ∕ 后续轮）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审对象**：桌面空闲唤醒（idle-wake）设计 · 轮 1——批档 §2（2.1–2.9）+ 设计落点（PROJECT.md KD-34–36 / §4.2 / §6.1 / §10 · IPC.md `ev:susp` / `ev:digest` · RENDERER.md 挂起窗与消化轮 · RENDER-CORE.md 端差三条 · 核档三处「桌面无挂起窗」收正 · UI.md 随落 · 需求档 D4/D16）。

**评审前提与限度**：① 无项目标准档声明——方法学依 AGENTS.md 与档面既有惯例判；② 无文档地图——归属依各档自述「单源 = …」判；③ 盘上代码面未读（评审判据 = 文档面；文档内代码坐标一律按「设计自述 · 未核实」对待）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Doc-consistency（计数） | 🟡 | 事件通道计数跨档不一：`docs/desktop/design/IPC.md:33` / `:58` / `:61` 定「十五通道」（订阅白名单 = 15）；`docs/desktop/design/PROJECT.md:387` / `:393` 本批行却写 `EVENT_CHANNELS` / 订阅表 **12 ⇒ 14**、`:396` 机检面写「host-floor（`EVENT_CHANNELS` 14 断言）」；`docs/desktop/design/PROJECT.md:132` / `:138` / `:139` 与 `docs/desktop/design/RENDERER.md:32` / `:34` / `:81` 仍写「十通道」；`docs/desktop/design/IPC.md:150` / `:163` 残留「十二通道」。同机制计数四值并存（10 / 12 / 14 / 15），14 与 15 不能同真；若盘面现值确为 12（`ev:subchunk` 未入 preload 白名单——本评审未读码，未核实）则为功能缺口（渲染面订阅 `ev:subchunk` 必 throw）。 | 以盘面实读定一个权威数（含 `ev:subchunk` 是否在册之核），本批各行与 host-floor 断言按该数收正；「十通道 / 十二通道」残句随批清（RENDERER 三处 + PROJECT §4.1 两行）。 |
| 2 | 受影响文件 / 行数（判据 8） | 🟡 | §4.2 本批表「现行」列与批档自述的串行基线冲突：`docs/batches/2026-09-28-desktop-idle-wake.md:121` 与 `docs/desktop/design/PROJECT.md:388` 称「本批基线 = align-2 拆后档」，但 `PROJECT.md:388` 仍按拆前值给「494 ⇒ ≈530」（align-2 已定 494 ⇒ 500 顶格 ⇒ 拆 `page-read.mjs` ⇒ 拆后 ≈380——`PROJECT.md:361`）；i18n 同理（`:394`「425 ⇒ ≈435」vs `:369` align-2「423 ⇒ ≈470」）；chat.mjs（`:390`「280 ⇒ ≈295」vs `:365` align-2「280 ⇒ ≈310」）、statusline（`:389`「269 ⇒ ≈285」vs `:368` align-2「269 ⇒ ≈272」）两行同病；仅 chat.css 行（`:395`）用了拆后基线。按行内字面值 events.mjs ≈530 越 500 硬限且该行未携拆分预案指针；按声明基线（拆后 ≈380 + 增量）则不越——两者不可同真。 | 全表按声明的串行基线（align-2 落形后盘面）重算「现行 ⇒ 预期」；events.mjs / i18n 两行补越层段登记与拆分预案指针（承 align-2 在册链）。 |
| 3 | 清晰性（UI 态集） | 🟡 | 「段 3 状态文本」态集两处未合成：`docs/desktop/design/UI.md:21` 称第三态 = 挂起句（优先序 = 挂起句 > 运行中 > 就绪），而 `UI.md:112` / `:205-207` 已把「第三态」名给另一规则（`approval` 在挂 ∧ 回合非忙 ⇒ 段零节点）——同段位两个「第三态」命名撞车；新优先序链未含 `approval` 支（字面读得「就绪」，与 `:112` 零节点规则相抵）；`approval ∧ ¬running ∧ 挂起 active` 交叠角落未定序。 | 在单源处给出段 3 完整态机（挂起句 / 运行中 / 就绪 / approval 零节点 + 优先序），两处行内指针随动。 |
| 4 | 清晰性（工艺面） | 🟡 | `[data-digest]` 消化行族的落位与刷新面未点名：`docs/desktop/design/RENDERER.md:38-40` 新条只给「沿 `[data-pending]` 先例 · 不占块序」与「`end` 原地更新本键游标行」；两处既有枚举——帧尾态刷成员（`:60`，已含待发送气泡组 / 引导节点）· 流内非块节点族成员（`:70`）与根子序 / 插入点纪律（`:62`）——均未随本族收正（对照：pending 组两处皆点名）。 | 按既有先例把 `[data-digest]` 补入刷新面单点成员与根子序 / 插入点纪律（给在场判据与出现 / 退场 / 更新路径）。 |
| 5 | 清晰性（生命周期 / 多会话） | 🟡 | 挂起窗键面路由判据未点名：载体 = 单 agent（跨会话键存活——`PROJECT.md:72` KD-34、批档 `:84`），而 `dispose(key)`「会话中止」只有语义与测试判据（批档 `:127` ⑤），触发面未点名（关标签 / 删会话 / 切项目 / 退出与挂起窗的处置、是否走既有 `needsCloseConfirm` 确认面）；非同键输入（挂起窗属 A、用户在 B 发送）与唤醒 ∕ 消化轮的载体会话钉定（`_slot` 重钉）判据同样未点名。 | 补一节路由判据：`dispose` 触发面对照表（VSC 面板 dispose ∕ CLI 中止的桌面对位）· 非同键事件与输入的处置 · 唤醒 ∕ 消化轮的会话钉定与跨键互斥。 |
| 6 | 可行性 / 落点（跨层） | 🟡 | `notify.*` 两键落点与消费面跨层：`docs/desktop/design/IPC.md:70` 称消费 = 主进程 `notify.mjs`，而 `docs/desktop/design/PROJECT.md:394` 把 +5 键（含 `notify.*` 两键）计入 `renderer/i18n.mjs` 词表——词键如何到主进程未点名（渲染面词表 ∥ 主进程自持 ∥ 注入句串三路皆未裁；主进程此前无取用户可见文案的先例）。 | 定 notify 文案持有面与解析路径，并同步 §4.2 计账行与词键注「消费面」句。 |
| 7 | 验收 | 🔵 | 本批新可见面的设计面验收未收口：§6.1 D4 行（`PROJECT.md:420`）只回指 KD-36，验证面列仍是 T-DSK5 / T-DSK22 / T-DSK23；§7 无本批注 / 用例行；D16 真机义务落点为泛句「集成域现有档原址补例」（`PROJECT.md:396`、批档 `:120`——未点名档名与断言序，亦未声明归人工走查）。 | 在 D4 行 / §7 注点名本批机检面与真机面（或明示真机面归人工走查 + 父侧真跑闭合）。 |
| 8 | 清晰性（记数） | 🔵 | 挂起句取值未点名：`docs/desktop/design/UI.md:21` 判据「`active ∧ n>0`」中 `n` 未定义，与 `ev:susp` 四计数（`IPC.md:24`：`running` / `queued` / `pending` / `done`）的映射、`susp.*` 三键（`IPC.md:67`）的取词条件（何时取哪键）均未逐项点名。 | 逐项点名 N / M ↔ 四计数与三键取值条件（「值 = CLI 逐字」成立的前提）。 |
| 9 | 文档卫生（记数） | 🔵 | `docs/desktop/design/PROJECT.md:383` 写「hooks 四件（计数 ∕ 回收 ∕ 冻结）」仅列三件——批档 `:91` 的四件 = 计数 ∕ 边界 ∕ 回收 ∕ 冻结（含 `ev:digest` 边界钩）。 | 括注补「边界」一项（或改「三件 + 边界」记法）。 |
| 10 | 文档卫生（批档记录面） | 🔵 | 批档 §2 有两行 `**状态行**：`（`:53` / `:56`，内容近重复）；且 §2.2 UI.md 条（`:73`）仍书「门控停笔……解冻后随落」，与 §1.8（`:50`）/ §2.9 项 1（`:141`）已记的「已解冻并随落」并存——现值已过时。 | 双状态行收一行（或后行改注记）；§2.2 条半句随 §1.8 口径收正。 |
| 11 | 方法学（文档规范） | 🔵 | `docs/desktop/design/IPC.md` 缺本批变更记录行（其变更记录止于 `:302` 账本批条目；同批另六档皆有——`RENDERER.md:164` / `RENDER-CORE.md:401` / `AGENT-LOOP-ASYNC-POOL.md:555` / `PROJECT.md:814` / `UI.md:456` / 需求档 `:234`）；批档 §2.2 落点清单也未列「变更记录一行」。 | 补一行变更记录（两通道 + 计数 + 词键注 + 挂起窗口头）。 |
| 12 | 证据面（核侧符号） | 🔵 | 设计依赖的核侧符号未能于评审范围核实（`startSuspension({ carrier, runTurn, abortSignal, hooks })` 签名 ∕ `suspDriven`「既有核 opts」∕ `backgroundCounts` ∕ `carrierField`——批档 `:137` 自述；核包文件不在本评审范围，**未核实**）。 | 实施首步实读 `thincoder-core/agent/suspension.mjs` 导出与 opts 面；签名不符即以核件实际面回改设计（`suspDriven` 若不存在则属核改面，须另裁）。 |

**范围外备注（无严重度）**：同族计数残句 `docs/desktop/design/SHELL.md:42` / `:43`「十通道」（未入本次评审范围）。

VERDICT: pass
计数：🔴 0 · 🟡 6 · 🔵 6（🔴 无 ⇒ 不阻断）

### 轮次 2（评审子代理）

**评审对象**：桌面空闲唤醒（idle-wake）设计 · **复核轮 2**——① 轮 1 十二条修正（轮 1 发现表 + 批档 §2.10 修正轮记录 + §1.10 裁定）逐条验证；② §1.11 追加指令（用户 12:03 口径）落实复核；③ doc-check 净增读数核对。

**评审前提与限度**：① 无项目标准档声明 / 无文档地图——方法学与文档归属按 AGENTS.md + 各档自述「单源 = …」判（降级）；② 声明排除面（实现码 · 需求档 · align-2 / align-3 / 降噪批面）不评——为核验 ①②③ 之实证，对少量代码坐标与 doc-check 判据脚本作**证据性点读**（不作判据面扩张）；③ 未读 git 历史、不做回改；跨批数字（align-2 结算面）按 Deferred 在册口径对待。

**验证结果（本轮）**：
- **12/12 修正全部按 §2.10 所列坐标落位**（逐条实读命中：`docs/desktop/design/PROJECT.md` :149 / :155 / :156 / :286 / :400 / :404 / :410 / :413 / :437 / :560-563 / :642 / :72 / :73 / :74 / :80-95 / :411 · `docs/desktop/design/RENDERER.md` :23 / :32 / :35 / :41 / :63 / :65 / :73 / :85 / :171-172 · `docs/desktop/design/IPC.md` :24 / :25 / :33 / :53-54 / :58 / :61 / :65-73 / :83 / :307-308 · `docs/desktop/design/UI.md` :19 / :21 / :112 / :206 / :457-458 / :462 · `docs/render-core/design/RENDER-CORE.md` :89 / :359 / :403 · `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` :17 / :393 / :462 / :555-556 · 同办面 `docs/desktop/design/SHELL.md` :42 / :43 / :170）。
- **§1.11 已落**：`PROJECT.md:73`（KD-35）含「纯 ask 唤醒轮（`upstream ∧ pending = 0`）⇒ 不弹」+ 合并轮按档② 弹 + 档②为有意加档；其 VSC 依据经点读证实（`thincoder-vscode/src/extension/panel-callbacks.mjs:233` = `if (!autoTurn) notifyCompletionIfUnfocused()`；`notify.mjs:9-18` 失焦门同述）。
- **通道权威数核盘**：`thincoder-desktop/src/preload/preload.cjs` `EVENT_CHANNELS` 实读 = **13**（13 项，`ev:subchunk` 在册）⇒「13 ⇒ 15」叙事成立；残句清面（「十通道 / 十二通道」）本批六档设计面**零残留**（剩余均在变更记录 / 历史行 = 记录面）。
- **doc-check 读数**：行宽**后值 36 独立复算一致**（逐行枚举 = 36 行，全属存量他档：`docs/core/design/*` 24 · `docs/desktop/design/*` 6 · `docs/vsc/*` 4 · `docs/core/design/TURN-CAP-CONTINUE.md` 1 · `docs/cli`…口径：非表格行 ∧ > 300 字符 ∧ 排除 `batches` / `_archive` / TODO 两档）；**前值 37 与悬空 47 未获独立复算**（锚引擎需执行、历史盘面不可得）——净增 0 ∕ −1 结论**可采信但非全量闭证**（标 unverified）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | 验收（协调项） | 🟡 | ask 唤醒轮用例与「通知三判」无设计 / 批档落点：`docs/desktop/design/PROJECT.md` §2.7 B1 六条（`:167`）/ §7 批注（`:560-563`）/ §4.2 测试面（`:413`）均无「ask 入队 ⇒ 唤醒轮（`upstreamTurn` + 回合头 drain）」案；处置链 = 批档 §1.9② / §1.10 同办 / §1.11②（「随实施任务书钉上」）——**属交接项（R5 协调项，非缺陷）** | 把「ask ⇒ 唤醒轮」用例 + 通知三判（纯 ask 不弹 ∕ 合并轮弹 ∕ 用户回合弹）钉进实施任务书面；同时在设计面留一行回指（`PROJECT.md` §7 批注或批档 §2.7 尾注引 §1.9–§1.11）——防断链 |
| 2 | 文档一致性（记数） | 🔵 | `docs/desktop/design/PROJECT.md:72`（KD-34）hooks 枚举为三项（计数 ∕ 回收 ∕ 冻结），与同档 `:400`（四件 = 计数 ∕ 边界 ∕ 回收 ∕ 冻结）及核件实际接口不一——`thincoder-core/agent/suspension.mjs:23-26` 实读四钩 = `onCounts` / `onDigest` / `reclaim` / `freezeAll`，其中 `onDigest`（本批 `ev:digest` 所倚）被漏列 | KD-34 枚举补「边界」（或改为「四件见 §4.2 本批行」式指针）——与轮 1 发现 9 同病，收在一处 |
| 3 | 证据面（坐标） | 🔵 | `docs/desktop/design/PROJECT.md:72` 新增实读坐标 `thincoder-core/agent.mjs:98` **不落** `suspDriven`——现盘 = `:102`（`:98` = `streamOutputAllowed` 体）；修正轮 #12「实读核验一致」五处坐标中四处经点读证实（`suspension.mjs:154-155` / `:72` / `:119` · `async-settle.mjs:52` · `run-stages.mjs:151` / `:206`），仅此一处现盘不成立（或系修正轮后他笔移行——本评审只报现值） | 坐标改指 `thincoder-core/agent.mjs:102`（或去行号只留符号名 `suspDriven`） |
| 4 | 文档卫生（批档记录面） | 🔵 | 批档 §2 正文仍留旧值：§2.4（`:141`「`active ∧ n>0`」判据句式）· §2.6（`:158`「`EVENT_CHANNELS` 12 ⇒ 14」+「订阅表 12 ⇒ 14」· `:159`「+5 键 × 2 语」· `:160`「`host-floor`（`EVENT_CHANNELS` 14 断言）」）——仅由 §2.10 尾「实施面注意」（`:211` / `:215`）统括纠正，正文与纠正相隔 ~50 行 | 在 §2.4 / §2.6 各旧值行尾就地补短指针（「以 `docs/desktop/design/PROJECT.md` §4.2 本批行 **13 ⇒ 15** 为准 / 以 UI.md 表行 3 为准 / 记 `+3 键`」式），或把两行细化块前置到 §2.6 行内 |
| 5 | 文档一致性（Deferred 披露） | 🔵 | `docs/desktop/design/PROJECT.md` §4.2 本批表「现行」列基线延后回填（父侧裁定 #2 = Deferred）仅 `i18n` 行（`:411`）带「现行列基线随 align-2 结算回填」注——同表 `events.mjs`（`:405`，字面「494 ⇒ ≈530」越 500 且行内无拆分预案指针）· `statusline`（`:406`）· `views/chat.mjs`（`:407`）· `chat.css`（`:412`）四行无同式注（**裁定本身不再议**） | 四行补与 `i18n` 行同式的基线注（或本批表头统一加一行「现行列随 align-2 结算回填」）；`events.mjs` 行同步补在册拆分链指针（align-2 已执行 `subagent-reduce.mjs` 拆档——`docs/desktop/design/PROJECT.md:378`） |
| 6 | 证据面（读数核对） | 🔵 | doc-check 净增读数核对结论：**行宽后值 36 = 独立复算一致**（本批触行零贡献 ⇒「新行全 ≤300」成立；`RENDERER.md:32` 现值 ≤300 ✓）；**修正轮前 37 ∕ 悬空 47 未获独立复算**（锚引擎需执行、历史盘面不可得）⇒ 净增 0 ∕ −1 可采信但非全量闭证 | 读数保持 as-of 标注（现状已如此）；如需闭证，复跑时点 = 本批实施落地同刻（沿 §10 BE 行结算口径） |

VERDICT: pass
计数：🔴 0 · 🟡 1 · 🔵 5（🔴 无 ⇒ 不阻断）

## §4 用户批准（主 agent）

**§4 父侧代签（用户 2026-09-28 12:29「后续自动跑完吧」全链授权 ✓）**

- **三条件齐备**：① **设计评审 pass**——轨迹 = 轮 1（0🔴 · 6🟡 · 6🔵 · 12 条）→ 修正轮（本舱重派 · 12/12 落 · 权威数定谳 13）→ **复核轮 2 = pass**（0🔴 · 1🟡 · 5🔵——12 条写盘复验全清 + §1.11 落位验证 + 通道权威数核盘 13 成立）；② **修正落地逐条核验** ✓（复核轮逐条实读；行宽读数 36 独立复算一致）；③ **token 已签发**（凭据值不落档——沿纪律）。
- **裁定随记**：复核 5🔵 → ②KD-34 hooks 枚举补「边界」+ ③坐标 `agent.mjs:98` ⇒ `:102`（父侧直接执行 · 可 revert）；④记录面行内回改**不采**（append-only——§2.10 统括纠正即机制原生形态）；⑤基线注 **Deferred**（align-2 结算回填在途，落地即消解）；⑥读数限度已披露（as-of 采信）。1🟡（ask 用例交接项）= 已在册（§1.10 :61 ∕ §1.11②）+ 实施任务书钉死 + 设计面补一行回指。
- **批准范围**：本批设计全量（KD-34–36 · §2.1–2.10 · 落点六档面）+ 实施（拆分两舱：main 面 ∕ renderer 面）。
- **自缚四条**：复评再出 🔴 即停 · 验证不过即停 · 新范围或口径裁决即停 · 代签仅三条件齐备。

## §5 实施记录（eng-coder）
**状态行**：实施完成 2026-09-28（舱 A（main 面）+ 舱 B（renderer 面）落地 · 舱 B 目标档 22 pass ∕ 全量 217 pass）


### 5.1 main 面（舱 A · eng-coder · 2026-09-28）

**任务书** = 本档 §2（2.1–2.10）+ §4（批准范围「实施（拆分两舱：main 面 ∕ renderer 面）」）。本舱 = **main 面**（renderer 面 = 舱 B，另派，本舱零触碰）。

**交付面（在册五档 + 一档在册预案落形）**

| 文件 | 现行 ⇒ 落地（行数） | 要点 |
|---|---|---|
| `thincoder-desktop/src/main/suspension-drive.mjs`（新增） | — ⇒ **156** | 消费核件 `startSuspension`（非第四份实现）：窗表（同键至多一窗 · 跨键独立）+ 入口（会话控制器 + 载体挂 `_sessionAbort` ∕ `_sessionSignal`）+ 端侧钩子（计数 ⇒ `ev:susp`；回收 ⇒ 逐条补发 `ev:subagent {done}`；冻结 ⇒ 退出兜底同型）+ 输入 ∕ 关闭路由（`pushInput`+`wake` ∕ `abort`）+ `ev:digest` 起收两发 + 提示面两档 |
| `thincoder-desktop/src/main/notify.mjs`（新增） | — ⇒ **47** | 失焦门 + 两档合句 + 点击聚焦；`notify` ∕ `focused` ∕ `reveal` 三件注入（零宿主依赖）；词键 = 主进程自持（zh ∕ en 常量对，`title` 不可得 ⇒ 零携） |
| `thincoder-desktop/src/main/turn-face.mjs`（新增 · **在册预案落形**） | — ⇒ **52** | 单回合执行面提取（`send` ∕ 驱动同源）：在飞表占位 + `suspDriven: true`（撤回合尾直注入兜底）+ 三径结算（落盘 → 读数 → 终局事件）+ 释放在飞；出档理由 = `agent-host.mjs` 触 300 行顾问线（§4.2 本批行在册预案「越 300 顾问线预案 = 回合执行面再出档」） |
| `thincoder-desktop/src/main/agent-host.mjs` | 254 ⇒ **285** | 单回合执行面接线 + 回合尾挂起接管（`poolLive` ⇒ 驱动入口，成功 ∕ 失败两径同接管）+ `send` ∕ `interrupt` ∕ `dispose` 三路由 + 提示面注入三件 + `abortSuspensions` 路由 |
| `thincoder-desktop/src/main/main.mjs` | 93 ⇒ **104** | `Notification` 装配（`title` 缺省 ⇒ 零携 + 点击 ⇒ `reveal`）+ 焦态源（无窗口 ⇒ 门闭 —— never noise） |
| `thincoder-desktop/src/preload/preload.cjs` | 58 ⇒ **58** | `EVENT_CHANNELS` **13 ⇒ 15**（+ `ev:susp` ∕ `ev:digest`；序随桥面表 —— 两通道置 `ev:task` 之后） |

**越表披露（3 项，皆为零附带）**

1. **`thincoder-desktop/src/main/ipc.mjs`**（`openProjectChannel` 成功径 +3 行：`before` cwd 比对 ⇒ `agentHost.abortSuspensions()`）——依据 = 设计 §2.2「切项目 ⇒ 旧项目**全键**窗中止」（跨项目同槽号键路由面；不加则该级联无触发点）。任务书「表外零改」与设计要点冲突已上抛，**父侧裁定「加这 3 行 + 披露」**（零附带约束遵行）。
2. **`thincoder-desktop/test/files.mjs`**（+1 项：新用例档登记）——未登记 = `test/run.mjs` 两向自检判红（全量入口不可过）⇒ 交付必需。
3. **`thincoder-desktop/src/main/turn-face.mjs`**（新增档 —— 见上表「在册预案落形」；设计 §4.2 本批行含预案句但未点档名）。

**测试面（三档）**

- 新增 `thincoder-desktop/test/agent-host-suspension.test.mjs`（**230 行** · U183–U189）：平 node 直测 —— 挂起进出 ∕ 池空退出（出口帧 + 载体复位）· 空闲 settle ⇒ 自唤醒（边界两发 + 回收补发 + 档②弹）· 窗内输入优先（消化截胡 + 档①弹）· digest 中止重入（窗不退出）· `abort`（清池不注入 + 冻结补发）· ask 唤醒轮（`upstreamTurn` 旗标 + `tier:"ask"` 携参 + **纯 ask 不弹**）· 合并轮弹 · 通知策略四判（失焦门 ∕ 两档合句 ∕ 缺位与抛零连带）。
- `test/agent-host.test.mjs`（原址补例 · **399 行** —— 在册例外面 ≤500）：U191 三路由（窗内 `send` ⇒ `pushInput` · 附件 ⇒ `busy` 留队 · `interrupt` 空闲 ⇒ `idle` · `dispose` ⇒ 清池 + 出窗帧）+ U192 切项目级联路由（`abortSuspensions`）。
- `test/host-floor.test.mjs`：U76 ⇒ **十五条**断言 + 定序随动（两新通道置 `ev:task` 后）；U95 `fresh` 入册三新档 + 驱动族用例档；「零宿主依赖」臂由 1 档扩到 4 档（`agent-host` ∕ `turn-face` ∕ `suspension-drive` ∕ `notify`）。

**命令读数（as-of 2026-09-28 · 交付刻）**

- 验收① `cd thincoder-desktop && node --import ./test/rc-resolve.mjs --test test/agent-host-suspension.test.mjs test/agent-host.test.mjs test/host-floor.test.mjs` ⇒ **30 pass / 0 fail**。
  注：裸 `node --test`（任务书字面命令）不预载 `rc-resolve` 时 host-floor 因渲染档 `/rc/` 解析缺钩判红 —— **存量条件**（host-floor 引渲染挂载档；项目自身入口 `node test/run.mjs` 恒带 `--import test/rc-resolve.mjs`）。
- 验收② `cd thincoder-desktop && node test/run.mjs` ⇒ **214 pass / 0 fail**（基线 204 + 本批新增 10 项：新档 9 + 补例 2 − 新档 1 项合并计数；实读 = 现基线 + 新用例全绿）。
- 验收③ `npx electron . --smoke`（临时家 + `--user-data-dir`）⇒ `{"window":true,"boot":"ok","ok":true,...}`（`channels` = 实分发的**请求**通道集 —— 两新通道为事件通道，不入该读数）；真机通道面另以一次性 playwright 脚本实证（`ev:susp` ∕ `ev:digest` 订阅 OK ∧ 表外名仍 `throw`；脚本跑毕即删，零残留）。
- 验收④ 行数：新档 156 ∕ 47 ∕ 52 + 用例档 230 全 ≤300；`agent-host.mjs` 285 ≤300（提取后）。

**实施注意（与设计表述的三处对齐说明）**

1. **边界取点** = 窗内单回合包装（`driveTurn` 的 `autoTurn` 支：起跑读核 `backgroundCounts(agent).pending` = 起跑数、`tier` 随 `upstreamTurn`；收尾在 `finally` ⇒ 非 Abort 失败径同样出 `end`）。**不注册**核件 `hooks.onDigest`（设计称其「备用面」——核钩在非 Abort 失败径不出 `end`，不可作主取点；零双帧）。
2. 提示面**档①两个调用点** = 宿主 `send` 成功径 + 窗内用户回合收尾（同一策略方法、同判据 `!autoTurn` 且成功径 —— VSC `panel-callbacks.mjs:233` 同源）。
3. `_sessionAbort` ∕ `_sessionSignal` 由窗入口挂、窗退出摘（identity 守卫 —— 不误清他源值）；每轮起跑前按本窗键重装槽（§2.2 会话钉定，宿主注入 `loadAgentSlot` 转口）。

**内部审计（explore · 只读发散审计 · 轮 1）**：`diverged` —— 偏差 3 项：① §5 未落笔（时序，本段即闭合）；② 新档登记面 ×2（`docs/desktop/design/PROJECT.md` §4.1 清单 / §4.2 未列本批三新档，`turn-face.mjs` 两处皆无 —— **笔权在 eng-designer，只报不改**，归父侧 §6 登记）；③ `main.mjs` 焦态注释与实现不符（建窗前 `focused()` 恒假 ⇒ 门开）。**行为面**逐项 = ✅（§2.3 八面 · §2.4 四判 + 形态 · §2.7 六条 + ask 交接项 · §2.2 四触发面），**零静默简化、零未披露越域**。

**修正轮 1（闭合审计可闭合项）**：① §5 落笔（本段）；② `main.mjs` 焦态句收正（`focused: () => !win || win.isDestroyed() || win.isFocused()` —— 无窗口 ⇒ 门闭，判据与注释一致）；③ 补例 2（纯消化轮档②单列成例 · 切项目级联路由 `abortSuspensions` 用例）⇒ 三目标档 29 ⇒ **30 pass**、全量 213 ⇒ **214 pass**。

**发散去向（归父侧，非本舱射程）**

- **设计档登记面**：本批三新档入册（§4.1 清单 + §4.2 本批行补 `turn-face.mjs`）——笔权在 eng-designer。
- **通道计数跨批在途**：盘面 `preload.cjs` = **15**（本批落地 ✓）· `docs/desktop/design/IPC.md` = **16**（「对齐第三批」设计轮已提前收正 `ev:ledger` —— 其码面未落）· `renderer/events-subscribe.mjs` = **13**（舱 B 在途）⇒ `PROJECT.md` §10 BE 行「三档同值」结算窗口 = 两舱 + 对齐第三批码面落地时。
- `test/host-floor.test.mjs` = **312 行**（存量越线：本批前已 >300，既不在 ≤300 机检臂、也不在例外面 —— 既有登记洞，非本批引入；本批 +9 行，未触 500 硬限）。
- §2.9 项 5「Windows 通知呈现依赖 AppUserModelID」—— **未核实**（本舱无法离机验证通知呈现）；**未加** `app.setAppUserModelId`（设计定位 = 真机读数后再择用）。
- §2.2 触发面「退出」= 零额外机制（窗态零持久化）已如实落形。

**终态**：审计轮 1 全部可闭合项已于修正轮 1 闭合；`advisor` 代码评审结论见本段后续追加。

**内部代码评审（advisor · `type=code` · 轮次 1 → 修正轮 2）**

评审对象 = 舱 A 十一档（三新档 + `agent-host` ∕ `main` ∕ `ipc` ∕ `preload` + 三测试档）；排除面 = 渲染面（舱 B 在途）· 核件 · 设计档笔权面。**结论 = pass**（0🔴 · 3🟡 · 3🔵）。

| # | 级别 | 发现（坐标） | 处置 |
|---|---|---|---|
| 1 | 🟡 | 出窗链不读兑现值 ⇒ `residualInput` 丢弃（窗内已受理文本在窗退出竞态可静默丢：核件 `thincoder-core/agent/suspension.mjs:230` 返回该值 · `thincoder-desktop/src/main/agent-host.mjs:168` 窗内恒回 `{ ok: true }`） | **未修 · 上抛父侧裁定兜底形**：对位表 §2.3「关闭」行「队列兜底」未定桌面机制（VSC 形 = 普通回合续发 ∥ CLI 形 = 转回队列 + 可见提示；`thincoder-cli/src/tui/suspension-drive.mjs:336` 先例）。触发窗窄（消化轮非 Abort 失败 ∥ 出窗等待期落槽）⇒ 不阻断；已登记「发散去向」后续项 |
| 2 | 🟡 | `test/host-floor.test.mjs` = **312** 行 > 300 顾问线且未入例外面（**存量**：本批 +9 行；U95 的 ≤300 臂与例外面皆不含该档） | **未修 · 登记**（拆档 ∥ 入 U95 例外面 = 父侧裁；非本批引入，未触 500 硬限） |
| 3 | 🟡 | 通知呈现面真机未读数（Windows AppUserModelID；KD-35 的「失焦 ⇒ 恰一条」仅由假 `notify` 桩闭合 —— `test/agent-host-suspension.test.mjs` 各例注入桩） | **未修 · 协调项**（归父侧真机读数 + 必要时一行 `app.setAppUserModelId`；设计 §2.9 项 5 已定位） |
| 4 | 🔵 | 二次 `abort` 覆写冻结快照 ⇒ 冻结补发零帧（窄竞态：首记 abort 与核件 `freezeAll` 之间再 abort，池已清 ⇒ 快照取到空数组） | **已修（修正轮 2）**：快照只取一次（`entry.frozen ??=`） |
| 5 | 🔵 | 出窗链返值无人接 ⇒ 帧发射抛则成未处理拒绝（`main.mjs` 未处理拒绝 ⇒ 退出码 5） | **已修（修正轮 2）**：出窗链尾自吞错（记 stderr 一行） |
| 6 | 🔵 | §5 行数读数漂移（本段首段两个数字为补例前现值） | **已修（回填）**：`test/agent-host.test.mjs` = **420** · `test/agent-host-suspension.test.mjs` = **232** |

**修正轮 2 读数**（改动 2 行 · `suspension-drive.mjs` 156 ⇒ **157**）：三目标档 **30 pass / 0 fail** · 全量 **214 pass / 0 fail**。

**终态 = clean（converged）**：审计轮 1 + 评审轮 1 的**全部可闭合项**已闭合 —— 修正轮 1（§5 落笔 · `main.mjs` 焦态句收正 · 补例 2）· 修正轮 2（两处防御性硬化 + 读数回填）；余项 = 3 项**放行登记**（🟡 三条：residual 兜底形归父侧裁定 · host-floor 存量越线登记 · 通知真机读数）。零 🔴；越域全披露（3 项在册）；残项缺口经本段显式登记（非静默）。

**§5 覆盖面自查**：本段 + 首段 = 实施摘要 · 决策透明表（越表 3 项披露）· 审计与代码评审轮次 · fix round · 终态 —— 六项齐（交付表落父侧最终报告）。

**§5 数字勘正（记录面 · 收正 · 交付刻实读）**

① 交付表 `suspension-drive.mjs`「156」⇒ 修正轮 2 后现值 **157**（出窗链尾自吞错 +1 行）；② 测试面「新用例档 **230** 行 ∕ `test/agent-host.test.mjs` **399** 行」⇒ 修正轮 1 补例后现值 **232** ∕ **420**；③ 验收② 括注算式表述有误 ⇒ 正解 = 新增 **10** 项（新用例档 **8** 项 U183–U189 + 补例 **2** 项 U191 ∕ U192），基线 **204** ⇒ 现值 **214**（214 − 10 = 204 独立复算一致）；④ 其余行数现值：`notify.mjs` **47** · `turn-face.mjs` **52** · `agent-host.mjs` **285** · `main.mjs` **104** · `ipc.mjs` **224** · `preload.cjs` **58** · `host-floor.test.mjs` **312**（全 ≤300 或已在册例外面 ≤500）。

### 5.2 renderer 面（舱 B · eng-coder · 2026-09-28）

**任务书** = 本档 §2（2.1–2.10）+ §4 批准范围「实施（拆分两舱：main 面 ∕ renderer 面）」之**舱 B（renderer 面）**；前置 = align-2 落形后盘面（`page-read.mjs` ∕ `subagent-reduce.mjs` 拆档已在场）+ 舱 A 已落（`preload.cjs` `EVENT_CHANNELS` = 15）。本舱零触碰 main 面 ∕ 核件 ∕ 设计档。

**交付面（八档 · 现行 ⇒ 落地）**

| 文件 | 现行 ⇒ 落地 | 构成 |
|---|---|---|
| `renderer/events.mjs` | 349 ⇒ **393** | `onSusp`（四计数 + `active` 只收严格真 · 同键就地替换 · 同值原引用 · 非数归一 0）· `onDigest`（起跑 ∕ 终态两态 · **`end` 原地更新本键游标（保留起跑 `n`）** · 表外 `status` 零写）· `reduce` 两分派支；通道计数注释 13 ⇒ 15 |
| `renderer/events-subscribe.mjs` | 72 ⇒ **73** | 订阅表 **13 ⇒ 15**（+ `ev:susp` ∕ `ev:digest`；序同桥面表——置 `ev:task` 后） |
| `renderer/views/statusline.mjs` | 270 ⇒ **291** | 段 3 **态机四支 + 优先序**（① 挂起句 ＞ ② 零节点 ＞ ③ 运行中 ＞ ④ 就绪）+ `suspSegment`（N = `running + queued` · M = `pending + done` · 三键取词链 · ` · ` 同 VSC `status-bar.js:58` 式）+ `statusModel` ∕ `mountStatus` 入 `susp` 切片 |
| `renderer/views/chat.mjs` | 340 ⇒ **439** | 消化行组 `[data-digest]`（非块节点 · 两行 ∕ `n = 0` 零计数行 ∕ 在场 ⟺ 起跑态 ∕ **`end` 先原地更新后摘除**）+ 树面族序（块 → 消化行组 → 待发送组）+ `blockAnchor` 扩 `[data-digest]` + `digestAnchorOf`（新建锚 = 待发送组 ∨ 卡 ∨ 药丸） |
| `renderer/mount-status.mjs` | 26 ⇒ **28** | `STATUS_KEYS` 增 `susp` |
| `renderer/app.mjs` | 261 ⇒ **261** | `CHAT_KEYS` 增 `digest`（行内改，零净增）+ 通道计数注释随动 |
| `renderer/i18n.mjs` | 469 ⇒ **481** | `susp.*` 三键 × 2 语（zh = CLI `backgroundStatusText` 逐字 ∕ en = VSC `locales/en.json` 同键逐字）+ 头注计数 156 ⇒ 159；`digest.*` **零新键**（核字典经 `t()` 直取） |
| `renderer/chat.css` | 363 ⇒ **383** | `.digest-*` **两规则**（起跑态 ∕ 终态） |

**测试面（六档 · 含两档表外机检随动）**

| 文件 | 现行 ⇒ 落地 | 构成 |
|---|---|---|
| `test/events-reduce.test.mjs` | 315 ⇒ **346** | U193（两通道归约：四值 + 归一 ∕ 起跑终态两态 ∕ `end` 保 `n`）+ U89 ∕ T-DSK29 列数与标题随动 13 ⇒ 15 + `ev:susp` 通道 → store 落态 |
| `test/views-statusline.test.mjs` | 300 ⇒ **328** | U190（四支 + 取词链三支 + 交叠角落 + `active` 严格真门 + 他键零扰 + 非数归一） |
| `test/views-chat.test.mjs` | 311 ⇒ **403** | U194（树面两行 ∕ `n = 0` 零行 ∕ ask 档 ∕ 终态零组 ∕ 他键 ∕ none；帧面建组 ∕ 幂等 ∕ **先更新后摘** ∕ `n = 0` 零动作 ∕ 族序角落 ∕ 组换代 ∕ 卡锚） |
| `test/views-chrome-vocab.test.mjs`（表外） | 331 ⇒ **340** | 键数锁 156 ⇒ 159 + 消费面夹具（susp 三支 ∕ digest 两档）+ `CORE_WORD_KEYS` 增 digest 三键 |
| `test/host-floor.test.mjs`（表外） | 312 ⇒ **314** | U95 例外面收两档（`views-statusline` 328 ∕ `views-chat` 403）+ 拆分预案注释 |
| `test/integration/chat-render.test.mjs` | 250 ⇒ **282** | T-DSK37 ⑪ 真机面（D16）：主进程 `webContents.send` 注入两通道 ⇒ 挂起句入段 3 ∕ 消化行组两行 ∕ `data-blocks` 不变 ∕ 退出回落（零 pageerror） |

**命令读数（as-of 2026-09-28 · 交付刻）**

- 验收① `cd thincoder-desktop && node --import ./test/rc-resolve.mjs --test test/events-reduce.test.mjs test/views-statusline.test.mjs test/views-chat.test.mjs` ⇒ **22 pass / 0 fail**。注：三档中 `views-chat` 经 `renderer/views/chat.mjs` 引 `/rc/` ⇒ 裸 `node --test`（任务书字面命令）不预载钩子判红 —— **存量条件**（项目入口 `node test/run.mjs` 恒带 `--import test/rc-resolve.mjs`）。
- 验收② `cd thincoder-desktop && node test/run.mjs` ⇒ **217 pass / 0 fail / 0 cancelled**（基线 214 + 新用例 3；真机六例零回归）。
- 验收③ 订阅表 **15** ∥ `src/preload/preload.cjs` `EVENT_CHANNELS` **15** —— 同源实读（`test/host-floor.test.mjs` U76 十五条 + 定序断言在场）；真机通道面 = T-DSK37 ⑪ 实证。
- 验收④ 行数：见上两表；越 300 档**全披露**（本舱受触档 >300 者：`events.mjs` 393（在册 ≤500 例外面）· `views/chat.mjs` 439（在册预案 = 帧尾态刷拆 `chat-chrome.mjs`）· `i18n.mjs` 481（在册预案 = 词族拆第二档；**距 500 硬限余 19 行 —— 登记**）· `chat.css` 383（在册预案 = `chrome-denoise.css`）· 测试面 5 档（其一新增入册、余为在册债务））。

**决策透明表（表外改动 3 项 —— 皆交付必需 · 逐项给由）**

1. `test/views-chrome-vocab.test.mjs`（+9）—— 键数锁（156 ⇒ 159）与两新面的**树消费夹具**不补 ⇒ 增键未消费即判红；不改 = 全量红。
2. `test/host-floor.test.mjs`（+2）—— U95 例外面收 `test/views-statusline.test.mjs`（本批入档 ⇒ 328 > 300）与 `test/views-chat.test.mjs`（本批前已 >300，U194 续增）；不改 = U95 判红（越层档仍在 ≤300 臂 / 越层档零登记）。
3. `test/integration/chat-render.test.mjs`（+32）—— D16 义务真机面（最近档原址补例 ⑪）；不改 = 本批新可见面零真机用例。

**内部审计（explore · 只读 · 轮 1）**：`diverged` —— 偏差 3 项：① **B-1（真缺陷）** 帧面消化行组新建锚漏 `[data-pending]`（待发送组在场时可落其后 ⇒ 违族内序）；② B-2 行数读数 vs 设计预期（`views/chat.mjs` 439）；③ B-3 §5.2 未落笔（时序）。**修正轮 1**：① ⇒ 新增 `digestAnchorOf`（待发送组 ∨ 卡 ∨ 药丸）+ 族序角落用例；③ ⇒ 本段；② ⇒ 见「验收④」+ 末「发散去向」。行为面逐项 = ✅（段 3 态机四支 ∕ N-M 映射 ∕ 三键取词链 ∕ 先更新后摘 ∕ `n = 0` 零幻影行 ∕ 词值逐字 ∕ 通道同值同序）；零静默简化、越域全披露。

**内部代码评审（advisor · `type=code` · 轮 1）**：**pass**（0🔴 · 1🟡 · 5🔵 —— 🟡 = 顾问线档，非 must-fix）。逐条处置：

| # | 级 | 发现 | 处置 |
|---|---|---|---|
| 1 | 🟡 | `test/views-chat.test.mjs` 403 行 > 300 且无越层登记（U95 两清单皆不含） | **已修（修正轮 2）**：U95 例外面收该档（两向判据 + 拆分预案 = 用例面拆出〔档名实施批定〕）；设计面越层登记归 eng-designer（见「发散去向」） |
| 2 | 🔵 | U95 行数臂只覆盖枚举档 ⇒ 两数组之外越线静默 | **登记不修**：臂扩为目录扫描 = 判据语义变更 ⇒ 走设计（在册债务：`views/chat.mjs` 439 · `i18n.mjs` 481 · `events-reduce` 346 · `views-chrome-vocab` 340 · `host-floor` 314） |
| 3 | 🔵 | 计数归一助手三处复制（`events.mjs` ∕ `views/chat.mjs` ∕ `views/statusline.mjs`） | **登记**（消解 = 抽共用件 —— 归父侧裁；本舱零改以避跨档耦合） |
| 4 | 🔵 | 帧面两径无用例（组换代原位换 ∕ 锚含卡） | **已修（修正轮 2）**：U194 补两断言（原位替换恰一枚 ∧ 计数行文随动；卡在场 ⇒ 组落卡前） |
| 5 | 🔵 | 消化行组同步发生在 `t0`–`t1` 之间（尾侧高度入 ΔH；现态零缺陷 —— 消化帧不变块面 ⇒ 零补偿写） | **登记**：合帧边界 ⇒ 设计面（`RENDERER.md` §3 读数区间记账）留判 |
| 6 | 🔵 | 两处符号字面住视图档（` · ` 分隔 ∕ `?` `…` 回落）与「视图档零字形字面」字面读相抵（皆 VSC 同式 ⇒ 非功能缺陷） | **登记**：纪律面开例外 ∥ 移样式 / 词面 —— 归父侧裁 |

**修正轮 2 读数**（评审处置后三项 = U194 补两径 + U95 例外面增档 + 本段）：目标三档 **22 pass / 0 fail** · 全量 **217 pass / 0 fail**。

**终态 = clean（converged）**：审计轮 1（含 B-1 真缺陷）与评审轮 1 的**全部 must-fix 项**已闭合；余项 = 5 项**放行登记**（🔵 五条：臂覆盖 ∕ 助手复制 ∕ 合帧边界 ∕ 符号字面 ∕ 行数登记后续）。零 🔴；越域全披露（3 项在册）。

**发散去向（归父侧 ∕ eng-designer，非本舱射程）**

- **设计面登记随动**：§4.1 用例模块行读数与越层登记（`views-chat.test.mjs` 403 ∕ `views-statusline.test.mjs` 328 本批新越层）· `RENDERER.md` 插入点纪律条两尾组点名（实现 = 块 → 消化行组 → 待发送组 → 卡 → 药丸，与根子序自洽）—— 笔权在 eng-designer。
- **`i18n.mjs` 距 500 硬限余 19 行**：下一加键批须先执行在册预案（词族拆第二档）。
- **真机面边界**：⑪ = **合成载荷**真机用例（通道 → 订阅 → 归约 → 视图全链走生产码）；真跑子任务面（凭据面）归**父侧真跑闭合**；通知面（失焦系统通知）不可机检 = 人工走查。
- `test/artifacts/*.png`：全量 E2E 跑道重写（既有惯例 —— 每次真跑同径）。

### 5.4 残输入兜底实现（实施面差收口 · fix 轮 · 2026-09-28）

**任务书** = 本档 §2.11「实施面差」段 + §2.3 对位表「关闭」行（残输入兜底句）+ `docs/desktop/design/PROJECT.md:72`（KD-34 补句——先读后改）。
**轮次** = fix（点修；设计定形已在盘 = 残输入兜底 ⇒ 普通回合续发）。

**交付面（两档）**

| 文件 | 现行 ⇒ 落地（行数） | 要点 |
|---|---|---|
| `thincoder-desktop/src/main/suspension-drive.mjs` | 157 ⇒ **196** | 残输入投影（`entry.pending`——受理 ∕ 消费两点自持）+ 出窗链读投影 ⇒ 逐条经 `runTurn`（宿主既有三径结算提取面）以普通回合续发 + 档①（成功径，同 `send` 判据）+ 续发毕回合尾接管（池仍 live ⇒ 新窗）；会话中止径不续发 + 记错一行 |
| `thincoder-desktop/test/agent-host-suspension.test.mjs` | 232 ⇒ **290** | 补例 U190（窄径②）· U190b（窄径①）· U190c（中止径边界）；harness 记录 `size`（起跑刻窗数 = 「续发在窗退出后」面） |

**机制与判据（三处口径）**

1. **残值来源 = 端侧投影（非核 `done` 兑现值——披露）**：设计句 = 读核件兑现值 `residualInput`；实读核件——非 Abort 失败径 `done` **拒绝**（`thincoder-core/agent/suspension.mjs:168-231`：try 抛 ⇒ `return` 不执行）⇒ 兑现值在第 ② 窄径不物化（读不到）。⇒ 本档按「受理（`pushInput`）∕ 消费（`driveTurn` 用户回合，核件 shift 后同步调用）」两点自持投影，两径同取该面 = 单一来源（兑现径与兑现值同集，且含出窗链竞态落槽项）。
2. **续发面 = 宿主既有三径结算提取面**：`runTurn`（= `agent-host.mjs` 注入的 `executeTurn`，`send` 同源——禁另起新径落形）；逐条一个普通回合（VSC 队列兜底同形 = `thincoder-vscode/src/extension/suspension.mjs:411-424`）。
3. **会话中止径不续发（边界·披露）**：`abort` = dispose（会话删除）∕ 切项目级联（§2.2 跨项目续跑禁令）⇒ 残值随会话终止 + `console.error` 记错一行（VSC `panel._panel` 守卫同形；非静默——有痕）。

**命令读数（as-of 2026-09-28 交付刻）**

- 验收① `cd thincoder-desktop && node --import ./test/rc-resolve.mjs --test test/agent-host-suspension.test.mjs` ⇒ **11 pass / 0 fail**（基线 8 + 新 3）。
- 验收② `cd thincoder-desktop && node test/run.mjs` ⇒ **220 pass / 0 fail**（基线 217 + 新 3；独立复算 220 − 3 = 217 ✓）。
- 反向探针（撤读即红）：临时注出 `resumeResidual(entry)` 调用 ⇒ **U190 ∕ U190b 双红**（超时未见续发轮）· U190c 仍绿（边界用例不依续发链）；还原后复跑 **11 pass** ✓。
- 行数：两档 196 ∕ 290 ≤ 300（`fresh` 臂在册）；全量含 host-floor U95 绿。

**越域披露**：**零**（改动面 = 任务书点名两档）。**设计档漂移（报父侧 ∕ 设计笔，本舱零改）**：`docs/desktop/design/PROJECT.md` §4.1 ∕ §4.2 两处登记值随本修过期——`suspension-drive.mjs` 157 ⇒ **196** · `test/agent-host-suspension.test.mjs` 232 ⇒ **290**。
**范围外读数（报父侧，未动）**：`test/host-floor.test.mjs` 现读 **314**（§2.11 ②-4 登记 313 ∕ 本舱 A §5 记 312——三值不一，非本舱触碰）。

### 5.5 残输入兜底 · 审计与评审轮次、修正轮 1 与终态（2026-09-28）

**内部审计（explore · 只读 · 轮 1）**：`converged` —— 真缺陷 0 ∕ 静默简化 0（投影 ⊇ 核兑现值、续发面 = 宿主既有单回合面、两窄径各有用例、越域零）；观察四项：O1 续发不重装槽 · O2 窗内用户回合失败径（不在两窄径枚举）· O3 覆盖余量（续发毕接管 ∕ 逐条）。O3 前半已由 U190 扩断言收口，余项归「发散去向」。

**内部代码评审（advisor · `type=code` · 轮 1）**：**pass**（0🔴 · 2🟡 · 4🔵）。逐条处置：

| # | 级 | 发现 | 处置 |
|---|---|---|---|
| 1 | 🟡 | 残值来源 = 端侧投影 vs 设计句「读核兑现值 `residualInput`」（记录面协调项，非码缺陷） | **记录面（本舱码面零改）**：设计句改述（KD-34 + 对位表「关闭」行）归父侧 ∕ 设计笔；给由在册（核 `done` 非 Abort 失败径拒绝 ⇒ 兑现值不物化） |
| 2 | 🟡 | 续发期中止不可命中（窗已摘 ⇒ `abort` 对该键零效力；链尾 `start` 可复活死键窗——违 §2.2 与「中止径不续发」） | **已修（修正轮 1）**：`resuming` 键集 + `abortTombstones` 墓碑 = 两落点（`:185-187` 无窗 ∕ 续发键；`abortAll` 并集 `:214`）+ 链检查点两处（`:116` 起跑前 ∕ `:128` 接管前 ⇒ 停链 + 记错 + 零接管）；补 U190c 两刻（窗内在册 ∕ 续发期） |
| 3 | 🔵 | 续发回合绕 `driveTurn` ⇒ 不重装槽（`reloadSlot` 零调用） | **登记不修**（影响窄：同键 agent 槽已钉定；宿主 `send` 径同样不重装——归后续批裁） |
| 4 | 🔵 | 用例档行数读数漂移（§5.4 记 290） | **已修（修正轮 1）**：终值 **299** ≤300（U190b ∕ U190c 扩章 + U190 精简）；设计档 §4.1 ∕ §4.2 登记值随动归父侧 |
| 5 | 🔵 | U190b 依赖核件退出链微任务让步刻 | **登记**（用例注释已自陈依赖——核件改动需复核） |
| 6 | 🔵 | 池 live ∧ 残值空 ⇒ 零接管（登记） | **保持登记**（设计失败面在册——池内自愈至下一回合尾；本批不重议） |

**修正轮 1 读数**（守卫增量 + 两刻用例 + U190 精简）：目标档 **11 pass / 0 fail** · 全量 **220 pass / 0 fail**；反向探针两枚 —— ① 撤 `resumeResidual(entry)` 调用 ⇒ U190 ∕ U190b 红（9/11）；② 撤中止墓碑落位 ⇒ U190c 红（10/11）；各自还原后复跑全绿。

**内部代码评审（advisor · 轮 2 · 修复声明核验）**：**pass** —— ①③④⑤声明属实；②守卫正确性（两落点 ∕ 无墓碑泄漏 ∕ 无误伤 ∕ U190c 真判红）逐条实证通过；面内零新增 🔴 ∕ 🟡。限度 = 只读面（未复跑命令读数——结构性核验）。

**终态 = clean（converged）**：审计轮 1 ∕ 评审轮 1 的全部可闭合项已闭合（修正轮 1）；余项 = **放行登记**（🟡 1：设计句随动归父侧 ∕ 设计笔 · 🔵 4：重装槽缺口 · 行数随动 · 微任务依赖 · 空残值零接管）+ 尾注一项（宿主中途建窗 ⇒ 守卫削弱面——在飞面，登记）。零 🔴；越域披露 = **零**（改动面 = 任务书点名两档 + 本档记录）。

**两档终值（交付刻实读 · `rows()` 口径）**：`thincoder-desktop/src/main/suspension-drive.mjs` **220** · `thincoder-desktop/test/agent-host-suspension.test.mjs` **299**（皆 ≤300——`fresh` 臂在册）。设计档登记值（`docs/desktop/design/PROJECT.md` §4.1 ∕ §4.2：157 ∕ 232）随本批两轮再动 ⇒ 归设计笔 ∕ 父侧落档时勘正。

**§5.4 数字勘正（承 §5.5）**：§5.4 交付表两行读数（`suspension-drive.mjs` 157 ⇒ **196** · `agent-host-suspension.test.mjs` 232 ⇒ **290**）为**修正轮 1 前**现值 ⇒ 终值以 §5.5 为准 = **220** ∕ **299**（修正轮 1：守卫增量 + 用例两刻扩章 + U190 精简；设计档 §4.1 ∕ §4.2 随动归父侧 ∕ 设计笔）。

## §6 验证与收口（父代理）

**状态行**：✅ 已收口 2026-09-28（冻结）

### 6.1 验证结论（父侧亲跑 · as-of 2026-09-28 14:2x）
- **全量套件 = 220/220**（含本批：舱 A 面 + 舱 B 面 + 残值兜底 11/11；真机例 T-DSK37 ⑪ 实证 = 挂起句在场 ∥ 消化行组两行 ∥ 无窗回落 Ready）；`--smoke` = 窗口出 · `ok:true`（零配置首启）。
- 链轨迹：设计（KD-34–36 · 落点六档）→ 评审轮 1 pass（12 条 = 6🟡/6🔵）→ 修正轮（12/12 · 权威数定谳 13）→ **复核轮 2 #10 = pass** → §4 代签 → 实施舱 A（main · 15/15 面 · 内评审 pass）→ 实施舱 B（renderer · 审计抓修 1 真缺陷（消化行锚）× 终态 clean）→ 收尾微轮 #19（residualInput 定形 = VSC 形 + 三新档登记 44⇒48）→ **残值兜底实现 #22**（内评审两轮 pass · 双探针锁咬 · §5.4/§5.5）。
- 真机面（D16）：**人工走查 + 用户实机使用闭合**——真跑后台子任务面不可离线复现（零 provider 夹具）；挂起句 ∥ 消化行 ∥ 失焦通知三判据随实用验收；合成载荷真机例（全链走生产码）已在套件覆盖。

### 6.2 结算随动与在册余项
- 数字回填（三新档 157/47/52 + 四档收正 + `suspension-drive.mjs` 157 ⇒ **220** ∕ `agent-host-suspension.test.mjs` 232 ⇒ **299**）＝ 父侧回填轮随落。
- 在册余项（非阻断）：① KD-34 ∕ §2.3 对位表「残值 = 核 `residualInput` 兑现值」句与实现（端侧投影 `entry.pending`——核 `done` 非 Abort 失败径拒绝）机制差 ⇒ 设计句改述 + 给由（随回填轮）；② `host-floor.test.mjs` 314（312/313/314 三值不一——回填轮核对）；③ #507 装配表跨项目清点（tech_todo 在册）；④ #508 实现已落（#22）。
- 台账冻结锚 = 本档：#504 随本次收口核销；#508 随本次收口核销；#446/#445 = 归 timer-wake 阶段 2 批（另档）。
- **本档冻结**：后续一切只动设计档 ∕ 记录面另档，不回改本档。
