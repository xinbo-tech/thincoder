# 2026-09-29 · desktop-window-queue-parity
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-29 · 来源 = 用户 2026-09-29 04:1x 桌面实机缺陷（输入后无响应）+ 04:2x 质问「为啥跟 VSC 不一样」——台账 #564；形 = VSC 实盘（逐点对齐移植，非重新设计）。
> 台账 = #564（desktop · 首件）。前情 = `docs/batches/2026-09-28-flow-vsc-align-annex-inventory53.md` §1.1（对位清单 —— 本批 = 其未决行「队列显示 ∕ 窗内输入路由」两行的即时落）。
## §1 讨论（主 agent）
**状态行**：🔄 进行中（…）
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 来源与口径（父侧 · 2026-09-29 04:2x）
- **来源**：用户 2026-09-29 04:1x 桌面实机（几会话后输入无响应——三条「评审」04:08×2 ∕ 04:09 零响应；状态行 2 后台子代理 ⇒ 挂起窗在场）+ 04:2x 质问「为啥跟 VSC 不一样」；台账 **#564**（含补勘全录）。
- **对位依据**：对位清单 `docs/batches/2026-09-28-flow-vsc-align-annex-inventory53.md` **§1.1** —— `:27`「队列显示：desktop 未取 `planBusyQueued`，自持镜面」· `:45`「窗内输入路由：重造（载体差异）」两行 —— **登记在册未清 = 本缺陷之根**（父侧 04:2x 实证）。
- **口径**：形 = **VSC 实盘逐点对齐（禁重新设计）**；核语义零改；停滞显形 = 三端同查后定（VSC 无则登记跨端，不擅自发明）。
- **首件范围**：窗内径两载体镜面 + 受理即推/清标/合泡 + 窗径回执标 + 携图对齐 + 停滞显形（同查）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（initial 轮 · 2026-09-29 · VSC 逐点对齐移植（禁重新设计）· 携图窗径对齐 + 逐点对齐表（15 行）+ 停滞显形三端同查；doc 面落 IPC ∕ UI ∕ PROJECT（三档）；重叠面承接 #561 批；上抛 7 条）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.1 口径 · 本批条目 · 与 #561 批的关系

**口径（最高行）**：用户 2026-09-29 04:2x 质问「为啥跟 VSC 不一样」——形 = **VSC 实盘逐点对齐移植（禁重新设计）**；核语义零改（驱动收口 = 对位清单另账 `docs/batches/2026-09-29-parity-closeout.md`）；显示面 = 桌面死口径（输入区上方带 ∕ 消费前流内零块——不引 VSC 流内标记形）；无新机制名 ∕ 无新概念 ∕ 无「优化」性发挥。

**条目表（覆盖）**：

| # | 条目 | 判据载体 |
|---|---|---|
| 1 | 窗队列宿主面逐点对齐 VSC（两载体合计快照 ∕ 受理即推 ∕ 五消费点对位 ∕ 握手重推）——逐点核账 + delta 落地 | §2.2 对齐表（零遗漏）· §2.6 AC-1 ∕ AC-4 ∕ AC-6 |
| 2 | 携图窗内对齐（VSC 队列条目携 `images`）：窗径受理携图（载具层携图）；`busy` 拒句退场 | §2.3(2) · §2.6 AC-2 ∕ AC-3 |
| 3 | 停滞显形（三端同查）：VSC ∕ CLI ∕ 桌面停滞均无专门可见面 ⇒ 登记跨端需求（另账），本批零发明 | §2.3(3) · §2.6 AC-5 |

**明确不在本批**：驱动语义面（窗载具步边界取批 ∕ 消费批合并——对位清单另账）· 窗内队容量（既有登记）· 核件 ∕ VSC ∕ `thincoder-render-core` 零改 · 显示形态（死口径）· 测试档（全清令）。

**与 #561 批（`docs/batches/2026-09-29-desktop-susp-queue.md`）的关系**：
- **重叠面沿用**（本批不重复设计）：窗内受理回执 `queued` ∕ 窗队四推点（受理 ∕ 消费 ∕ 残续发 ∕ 中止清队）∕ 并源读面 `queueView` ∕ 端侧抑制与退流面——均取自 #561 §2。
- **本批 delta**：逐点对齐表（§2.2）· 携图（§2.3(2)）· 停滞显形同查（§2.3(3)）。
- **本批取代 #561 一处**：「窗内携附件 ⇒ `busy` 留队重试」⇒ **载具层携图**（父侧本批口径 ②——VSC 对齐）；doc 面已随本批收正（§2.4）；#561 §2 ∕ 其评审 AC-3 需父侧在修正轮 ∕ 合并实施时对账（§2.8 #1）。
- **实施面**：两批同触 `turn-driver.mjs` ∕ `suspension-drive.mjs` ∕ UI ∕ IPC ∕ PROJECT 三档 ⇒ **串行**（§2.5 实施序）。

### 2.2 逐点对齐表（VSC file:line ⇒ 桌面落点/改动——零遗漏 · 零自创）

规格本体 = `thincoder-vscode/src/extension/panel-messages.mjs:96-121`（`pushBusyQueued`；快照源 = `busyQueueItems` 两载体合计 = `panel._busyQueued ∪ panel._susp.pendingInput`）。标记：**≡** 已合规 · **⊕** 本批 delta · **○** 零改动（给由） · **→** 另账（parity-closeout）。

| # | VSC 点（file:line） | VSC 语义 | 桌面落点 / 处置 |
|---|---|---|---|
| 1 | `panel-messages.mjs:137`（routeUserTurn 入口即推） | 归位受理路径（webview 提交本地自增镜像 ⇒ 纠偏） | ○ 无对位：桌面渲染面无本地乐观增（宿主任判 · 快照即权威）⇒ 零改动 |
| 2 | `panel-messages.mjs:152`（满队拒收后推实况） | 拒收同式推实况 | ○ 同 #1（无乐观增 ⇒ 推 = 恒等）；满队回执 ∕ 失败面既有 |
| 3 | `panel-messages.mjs:159`（susp 受理后推） | 窗受理 ⇒ 推两载体实况 | ≡ 窗径 = #561 已定形（`pushInput` 受理帧 + `{ok:true,queued:true}` 回执）；**⊕ 携图**（条目携 `images`——§2.3(2)） |
| 4 | `panel-messages.mjs:166`（忙队入队推） | 入队即反馈 | ≡ 桌面已有（`turn-driver.mjs:136` `chain.postQueue`） |
| 5 | `queued-pickup.mjs:39`（步边界 pickup 消费推，携 `merged`） | 在飞回合步边界取批（两载体择优）⇒ 快照 + merged | ≡ 忙态队对位已有（`turn-chain.mjs:50` `postQueue(delivered)`）；**→ 窗载具步边界取批 = 桌面无对位**（核循环回合边界消费） |
| 6 | `suspension.mjs:303-309`（driver 步骤 1 消费推） | 窗驱动消费批 ⇒ 快照 + merged | ≡ 消费帧 = #561 已定形（`driveTurn` 用户回合点）；**⊕ 携图条目过送达面**（prepare ⇒ `delivered.degraded`） |
| 7 | `panel-turn-stages.mjs:198-200`（装载① 预填 splice + 重推） | 释放窗口接管：忙队残项迁入窗载体（载体迁移零清标） | ○ 桌面结构不变量 = 入窗前忙态队已尽（`takeOver` 队列先于接管；窗队 = 独立载体非迁移）⇒ 无残项可迁；重推 = 恒等 ⇒ 零改动 |
| 8 | `panel-turn-stages.mjs:233-236`（装载② 归位 shift 消费推） | 池空归位：忙队残项直发 + 消费推 | ≡ 桌面对位 = `takeOver → chain.continueTurn`（队非空 ⇒ 取批 + `postQueue(delivered)`；池死活同径）——已合规 |
| 9 | `suspension.mjs:449-457`（退出残余直发循环推） | 会话退出：残余逐条直发 + 消费推 | ≡ 残续发帧 = #561 已定形（`resumeResidual` 逐条 `delivered`）；**⊕ 逐条过送达面**（携图） |
| 10 | `panel-messages.mjs:313`（webviewReady 握手重推） | Reload 冷启重建（幂等快照） | ≡ 桌面对位 = `history:page` 回执 `queue` 键（`ipc.mjs:175` → #561 并源 `queueView`）——冷启 ∕ 重载 ∕ 换会话页读重建 |
| 11 | `panel-messages.mjs:106-121`（载荷形 `{pending,count,items,text,merged}`） | 镜像纠偏 + 逐条标记 + 合泡源 | **⊕ 决策 = 扩形沿用**（`ev:queue` 两形 `{key,items:[{text,ts}],delivered?}`；语义映射：`items`↔items（桌面携 ts）· `merged`↔`delivered.text`；镜像字段渲染面自算；不逐字移植键名——§2.7 D-1） |
| 12 | `chat-panel.mjs:368-382`（`susp.pendingInput.push`——富条目 + 容量 8 + 携 `images`） | 窗条目携图 ∕ 容量 | **⊕ 载具层携图**（窗条目 `{text,ts,images?}`——§2.3(2)）；○ 容量 = 不增（既有登记） |
| 13 | `suspension.mjs:304` `takeQueuedBatchItem`（窗批合并取批） | 窗消费按计划合并（多条合泡） | **→ 登记另账**（桌面核单条 shift——逐条消费）；载荷语义已对齐（`delivered.text` 即合并文本位） |
| 14 | `webview/queued-mark.js:22`（二次提交守卫判据源 = 镜像 count） | webview 用镜像守卫提交 | ○ 无对位：桌面宿主任判（提交不设端侧守卫）——行为面 = 受理回执判据既有 |
| 15 | `panel-messages.mjs:107-121`（两载体合计快照 = 权威面） | `_busyQueued ∪ susp.pendingInput` | ≡ 桌面 = `turn-driver` `queueView`（忙态表 ∪ 窗内投影——#561 已定形） |

计数（D3）：**15 行** = 受理族 4（#1–4）· 五消费点 5（#5–9）· 握手 1（#10）· 载荷 ∕ 载体 3（#11–13）· 守卫 1（#14）· 快照源 1（#15）——**零遗漏**（VSC `pushBusyQueued` 全推点 + 载荷 + 守卫 + 快照源逐点对位）· **零自创**（无 VSC 之外新增点）。

### 2.3 机制设计（本批 delta · 逐处）

**（1）载荷形（决策落定）**：沿用 `ev:queue` 两形（快照整置 ∕ 消费回执），语义逐点对齐 VSC（映射与给由 = §2.2 #11 ∕ §2.7 D-1）；**零载荷键增删**。

**（2）携图窗内对齐 = 载具层携图**（给由 §2.7 D-2）：
- **受理**：`turn-driver.send` 窗支 ⇒ `suspension.pushInput(key, text, images)`（`busy` 拒句退场；回执 = `{ ok: true, queued: true }` 同形）。
- **载具**：`pushInput` ⇒ 投影条目 `{ text, ts: Date.now(), images? }`（`images` = 渲染面 `toImages` 投影原样——与忙态队条目同形；核 `handle.pushInput` 仍收串——**核零改**）。
- **消费**：`driveTurn`（`!autoTurn`）按 `text` 定位富条目（首中即取——与既有 `indexOf` 同判）⇒ 取 `images` ⇒ 送达面 `prepareTurnAttachments(text, images, { cwd, model, locale })`（注入面 = 宿主 `prepare` 闭包——与 `turn-chain` 同源单点）⇒ `runTurn(…, { attached })`（执行面既有 `opts.attached` 承接 ∕ 回合尾 `cleanupTurn` 清理）；消费帧 `delivered = { text, ts, degraded? }`（`degraded` = 送达面判决——与忙态径同判据）。
- **残输入续发**：`resumeResidual` 逐条同判（富条目 ⇒ prepare ⇒ runTurn ⇒ 帧）。
- **边界**：图不入快照（`dataURL` 不回传——既有）；宿主内存量级 = §10 **BM** 行同族（窗条目同判）；窗中止清队 = 既有（携图条目随清）；附件上限 ∕ 弃项判据 = 既有 `prepareTurnAttachments`（零第二判据）。
- **触面明示**：不触核面（`thincoder-core/**` 零改——核件输入面文本单形保位，图止步载具层）。

**（3）停滞显形（三端同查 · 结论）**：
- **同查证据（实读 2026-09-29 04:3x）**：全树 `watchdog|stall` 命中面 = consult 墙钟（`thincoder-core/agent-tools/consult.mjs:221-230`——会诊子会话，非主回合）· 工具签名去重（`thincoder-core/agent/post-turn.mjs:31`）· 子代理链依赖 `detectStall`（`thincoder-core/agent-tools/subagent-scheduler.mjs:197`）· CLI 终端 dims 空闲看门狗（`thincoder-cli/src/tui/dims.mjs:11`）——**均非「在飞回合停滞」检测面**。
- **三端停滞期可见面**（同形）：VSC = 运行态发布（`thincoder-vscode/src/extension/panel-chat.mjs:124` `_publishTurnState("running")`）+ 挂起计数（`suspension.mjs:469-473`）+ digest 起止（`suspension.mjs:350` ∕ `:362`）；CLI = 挂起期状态行（`thincoder-cli/src/tui/suspension-drive.mjs:244-248`）+ digest 行（`:209-214`）；桌面 = loading + `ev:susp` 挂起句（段 3）+ `ev:digest` 行 + 段 5 耗时。
- **结论 = 同静默**（三端均无停滞检测 ∕ 超时提示；「发送回执无超时」同族——VSC 同进程直呼 ∕ 桌面 IPC invoke 均无超时面）⇒ 按口径**登记跨端需求（另账）**——本批零发明（不加看门狗 ∕ 不加回执超时）。
- **用户可观察映射**：「窗内提交 ⇒ 立即可见待发送」= 本批 #2（受理即推 + 带面）；「前轮停滞 ⇒ 可见迹象」= 停滞期既有三端同形面（挂起句 ∕ digest 行 ∕ 耗时）+ 提交即带面——本批零改面。

### 2.4 设计档落点（就地更新 · 已落）

| 档 | 落点 |
|---|---|
| `docs/desktop/design/IPC.md` | §2 `msg:send` 行（窗径携图：`busy` 留队重试句退场 ⇒ 载具层携图；`busy` reason 档收窄为窗径竞态防御）+ 变更记录一行 |
| `docs/desktop/design/UI.md` | §1 输入区行（附件边界句：窗径 = 载具层携图）+ 新增「**本批注（窗队列 VSC 逐点对齐 · 2026-09-29）**」四项（携图 ∕ 标记-清标-合泡语义 ∕ 停滞显形登记 ∕ 边界）+ 变更记录一行 |
| `docs/desktop/design/PROJECT.md`（**一致性连带**——超出派单列面，报告在册） | KD-34（窗内携附件句收正）+ §2.2 忙态排队面随动句同笔 + §10 **BC 行转已消解** + 变更记录一行 |
| `ev:queue` 行 ∕ 载荷键集 ∕ 计数 | **零变**（同通道既有两形 + 并源已落；无新键无新通道） |

### 2.5 受影响文件表 + 实施序

| 档 | 现读（as-of 2026-09-29 04:3x） | 预期增量 | 落点 |
|---|---|---|---|
| `thincoder-desktop/src/main/suspension-drive.mjs` | **279**（实读） | +8~12 | `pushInput(key, text, images)` 富条目 · `driveTurn` 送达面（prepare + attached + `delivered.degraded`）· `resumeResidual` 同判 · `prepare` 注入面 |
| `thincoder-desktop/src/main/turn-driver.mjs` | **221**（实读） | +2~4 | `send` 窗支（携图受理；`busy` 拒句退场）· `createSuspensionDrive({ prepare })` 注入 |
| 重叠面（受理 ∕ 消费 ∕ 残续发 ∕ 中止四帧 ∕ `queueView` ∕ 端侧抑制面） | — | 随 #561 §2.4 表 | 本批零重复 |
| 核件 ∕ VSC ∕ `thincoder-render-core` | — | **0** | 零改（结构性判据） |

**实施序**：①（协调 · 父侧）裁本批 ∕ #561 的合并形（同文件面——**串行**；#561 §2 待修正轮落定）→ ② `suspension-drive` 携图面 → ③ `turn-driver` 窗支 → ④ 文档面（本设计轮已落）→ ⑤ 用例 ∕ 真机（§2.6）。

测试面：**全清令**（用户 2026-09-28 23:18）——不写测试档 ∕ 不跑套件；验收 = §2.6 判据句 + 真机（父侧闭合）。

### 2.6 验收对照（回指需求 = `docs/desktop/requirements/PROJECT.md` §4 **D25**）

| # | 判据句 | 面 |
|---|---|---|
| AC-1 | 窗内提交（纯文本）⇒ 回执 `{ ok: true, queued: true }` ∧ 待发送带即时在场（`[data-pending-item][data-raw]` = 提交文本逐字）∧ 流内零块 | 用例 + 真机 |
| AC-2 | 窗内提交（**携图**）⇒ 同受理（同回执形）；消费时刻图随回合送达（落盘 + 指针段；非视觉 ⇒ 说明行）；`degraded` 随消费回执浮出（在场 ⇒ 置位） | 用例 + 真机 |
| AC-3 | 窗径 `busy` 拒 = 仅竞态防御档（窗已摘）；受理径无附件拒面 | 用例 |
| AC-4 | 冷启 ∕ 重载 ∕ 换会话 ⇒ `history:page` `queue` 键 = 两载体合计快照（窗条目 `{text,ts}` 在列） | 用例 |
| AC-5 | 停滞显形：三端同查结论在册（同静默 ⇒ 跨端需求登记——另账）；桌面停滞期可见面 = 挂起句 ∕ digest 行 ∕ 耗时（既有——零改） | 档面 |
| AC-6 | 逐点对齐表零遗漏 ∕ 零自创：§2.2 十五行覆盖 VSC `pushBusyQueued` 全推点 ∕ 载荷 ∕ 守卫 ∕ 快照源 | 档面（评审核） |
| AC-7 | 核件 ∕ VSC ∕ render-core 零改（结构性）；桌面码改 = 两 main 档 | 机检 |

**用户可观察**：**窗内提交 ⇒ 立即可见「待发送」**（AC-1 ∕ AC-2）；**前轮停滞 ⇒ 可见迹象**（AC-5——三端同形既有面 + 提交即带面）。

### 2.7 关键决策（给由）

- **D-1 载荷形 = 扩形沿用（不逐字移植 VSC 键名）**：① 桌面 `ev:queue` 两形已在盘，四消费面（带面 ∕ 段 14 ∕ 冷启 `queue` 键 ∕ 消费入流）挂其单写者；② 语义逐点已对齐（`items` 逐条 ↔ VSC items；`delivered.text` = 本批注入文本 = VSC `merged` 同位；镜像字段 `pending/count/text` 渲染面自算）；③ 桌面 `items` 携 `ts`（`delivered.ts` → 用户块时间源）——VSC 键面无此位，逐字移植 = 掉 ts 面；④ 键名为端内契约（跨端不可观察）⇒ 逐字移植零用户可见收益、触渲染 ∕ store ∕ 文档三链。**零键增删**。
- **D-2 携图 = 载具层携图（非核槽扩形）**：VSC 形 = 端侧载体持富条目（`susp.pendingInput` 端自持）；核件 `pushInput` = 文本单形（核零改硬口径）；桌面载具层（`entry.pending` 投影）已是端侧面 ⇒ 携图 = 投影加一线，消费点本在端侧（`driveTurn` ∕ `resumeResidual`）⇒ 送达面判决可接。核槽扩形 = 触核签名 + 三端同核连带——被否。命中 §10 **BC** 登记消解路「端侧投影」支。
- **D-3 停滞面 = 零发明**（§2.3(3)——三端同静默 ⇒ 登记另账）。
- **D-4 `busy` reason 保留**（档收窄为竞态防御）——删码 = reason 闭集收缩，无收益。

### 2.8 上抛项（findings——逐条报告）

| # | 发现 | 处置 |
|---|---|---|
| 1 | **跨批相抵（#561）**：#561 §2（+评审 AC-3）载「窗内携附件 ⇒ `busy` 不变（留待重试）」——与本批 §2 携图对齐相抵 | 本批为后出且据父侧口径取代之；IPC.md ∕ PROJECT.md 已随本批收正；#561 §2 ∕ 评审 AC-3 需父侧在其修正轮 ∕ 合并实施时对账 |
| 2 | **停滞检测面 = 跨端需求**：三端同静默（无看门狗 ∕ 无超时提示；含「发送回执无超时」同族） | 登记跨端需求（另账）——请父侧立台账行；本批零发明 |
| 3 | **驱动面两差（窗载具）**：① 窗载具步边界取批（VSC `queued-pickup.mjs:31-40` 两载体择优）桌面无对位；② 窗消费批合并（VSC `takeQueuedBatchItem` 多条合泡）桌面核单条 shift | 均登记 `parity-closeout`（驱动收口——核语义零改）；载荷面已预留位（`delivered.text`） |
| 4 | **窗内队容量不增**（VSC 上限 8：`chat-panel.mjs:376-379`）——#561 §2.8 #4 已登记 | 维持在册（随对位轮裁）；本批不动 |
| 5 | **annex 行 :27 对位注记**（`docs/batches/2026-09-28-flow-vsc-align-annex-inventory53.md:27`「队列显示：desktop 未取 `planBusyQueued`，自持镜面」）：桌面显示死口径（带面 ∕ 反流内标记）⇒ `planBusyQueued`（流内标记规划）无对位；已消费 = `QUEUED_MAX_ITEMS`（`renderer/queue.mjs:15`）；本批 ∕ #561 落点 = 宿主快照面（两载体并源） | 请父侧在 `parity-closeout` 清账表按此裁定该行（建议 = 「已落（宿主面）· 残余零」；annex 建议列「复用他端（desktop 接核纯逻辑面）」与死口径相抵——显示面差异非缺口） |
| 6 | **需求档核对（D25）**：已含「消费前流内零块（全输入径——含挂起窗径）」「两源共镜」「附件条目携图」；本批携图与其一致（未区隔忙 ∕ 窗两径） | 需求档零改（合规） |
| 7 | **并发实况**：本设计轮写入时 peer-collab 报 `docs/desktop/design/UI.md` ∕ `PROJECT.md` 存在他实例在写意向（pid 21076，lease 28–30 min）——与 #561 修正轮 ∕ 它批文档面可能同刻 | 只报——请父侧串行化文档面（本批笔已落，读回已核） |

**本批不落**：测试档 ∕ 套件（全清令）· annex ∕ 台账 ∕ 清单本体（父侧笔）· #561 §2 对账（父侧）。

## §3 设计评审（评审子代理）
## §4 用户批准（主 agent）
## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）
