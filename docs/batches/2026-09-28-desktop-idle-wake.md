# 2026-09-28 · desktop-idle-wake
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-28 · 来源 = 用户 2026-09-28 10:04「我估计是子agent完成后返回的接线有问题」→ 10:11「对呀，就是这个空闲会话不会完成唤醒就是问题啊！」→ **10:13「你跟vsc和cli对比一下，把这个给补上」**；父侧自推立批（07:13 授权射程内）；实因 = 核察 #8 全链判定（第三环「settle ⇒ 起父回合」桌面零接 + 提示面全空）；台账 **#504**；同族 = #496 / #498 / #446。
> 台账 = #504（docs/desktop/requirements/PROJECT.md · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：进行中（设计已派（10:14 · 写入次序门控：UI.md/需求档排最后 + 解冻核））
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

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（B1–B3 全落 · 两张对位表在册 · 落点六档已落（UI.md/需求档门控停笔）· doc-check 零新增）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**状态行**：设计完成（B1–B3 全落——B1 驱动 = 消费核件 `startSuspension` · B2 提示面 = 失焦通知两档 · B3 = 显式登记不覆盖 + 给由；两张对位表在册；落点六档已落；UI.md/需求档 = 门控停笔（上抛 ①））

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
- `docs/desktop/design/UI.md`：**门控停笔**（外壳批评审轮 2 冻结——外壳批档 §1 状态行实读「复评（轮 2）在飞」）⇒ 内容 = 本 §2 定形；解冻后随落（PROJECT.md §10 **BD** 行登记）。

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
| 关闭 | 池空 + pending 空 + 无输入 ⇒ idle；abort ⇒ 清池不注入 + 队列回 `state.queue` | 同 + 队列兜底以普通回合续发 + 出窗广播 | 核件 `finally`（`finishSuspension` 残余注入 / 清池）+ 端侧钩子（回收 / 冻结 / `ev:susp` 出窗）；队列兜底（附件项除外——`busy` 留队重试） |
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

1. **UI.md 门控结果**：**未解冻**（外壳批档 §1 状态行实读「复评（轮 2）在飞」）⇒ UI.md **停笔**；本批 UI 面内容 = 本 §2（状态行段 3 第三态 ∥ 消化行族 ∥ 提示面三候选）+ `docs/desktop/design/PROJECT.md` §10 **BD** 行登记；**解冻 ⇒ 随落 UI.md 三处**（状态栏行 / 对话流行 / 变更记录）。
2. **需求档随动（笔权在父侧，本设计零改）**：D4 面已消解（原句覆盖两落点——无需改）；「完成提示面（失焦通知）」= 桌面新落面（VSC 有、CLI 无）——是否入需求条款 ⇒ 归父侧裁。
3. **发现项：桌面无 turn-cap 续跑循环**（实读零 `ContinueError`；CLI ∕ VSC 均有）⇒ 撞帽 = 失败径；**消化轮撞帽同此**（登记 PROJECT.md §10 **BB**；另批对齐）。
4. **边界：核件输入面 = 文本单形** ⇒ 挂起期附件载荷 `busy` 留队（登记 §10 **BC**；消解路 = 核件扩对象形 ∥ 端侧侧表——另裁）。
5. **实施前置（未核实项）**：Windows 通知呈现依赖 AppUserModelID（Electron 行为面——本仓无可读面，**未核实**）⇒ 实施轮真机读数为准（备选 = `app.setAppUserModelId` 一行）；另案 = 通知点击「直达会话」须新主→渲染命令通道（被否候选，另裁）。
6. **机检读数**：`node scripts/doc-check.mjs --root .`（as-of 2026-09-28 设计轮）——本批六档**零新增**（悬空 / 行宽）；存量红在他档（悬空 47 · 行宽 35，as-of 基线）——本批零改。

## §3 设计评审（评审子代理）
## §4 用户批准（主 agent）
## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）
