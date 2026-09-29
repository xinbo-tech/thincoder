# 2026-09-29 · send-busy-timing
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-29 · 来源 = 用户走查报障「发送后 send 按钮忙态切换滞后（应于提交时立即切换）」+ #175 只读诊断（根因 = 核件提交已写 setLoading(true) 但两钮显隐只读端侧活值 busyState()；桌面位标唯一生产者 = 核环头 ev:activity{turn}）。
> 台账 = #597（desktop · 立批；#596 并入）。前情 = 用户真机走查（2026-09-29 12:34）+ 诊断轮 #175 根因链。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-29
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 报障与根因链（父侧 · 2026-09-29）

用户走查（12:34）：「输入以后按钮从 send 切换状态的时间不对……等到主模型响应时才变，中间有延迟，容易让人误会」。

**根因链（#175 十步 · 摘）**：核件 `panel.mjs:332 setLoading(true)` 提交时**确实被调**，但 `:401-410` 两钮显隐判据 = `busyState()`（= 端侧 `turnState()` 活值），**不读 `on`** ⇒ 提交瞬间零可见效果（`ctx.isRunning` 只开键盘门 ∕ `_phase` 桌面无消费者 = 死写）。桌面位标**唯一生产者** = `renderer/events.mjs:144`（归约 `ev:activity{turn}`）← 核环头 `turn-loop.mjs:81`（主模型起跑时）⇒ 滞后窗 = `msg:send` + ensure 装配 + 附件降级 + `beginRun`（含 `_pendingDistill` await）。三端对位：CLI = 同 tick ✅ ∕ VSC = ≈1 跳 ⚠️ ∕ 桌面 = 等起跑 ❌。真机时长未读数（结构推断）。

### 1.2 修法候选（父侧预钉 · 设计轮裁形给由）

- **案 C（对位正解）**：主侧受理即置位标（`turn-driver.mjs:182-183` 占位建立后、`await ensure` 前）——位标单源不破，按钮 ∕ 状态行 ∕ 会话头门 ∕ 会话条**同刻齐切**；触 B8 在飞点（`ev:activity` A2 键名收正）+ 主侧**四清位必补**（漏一 ⇒ 假忙）。
- **案 A（核件面板乐观忙）**：`panel.mjs` 直发径置 `_sendPending` + 两钮判据扩（位标 ∕ 失败 ∕ 超时三源解扣）——只闭按钮面（占位符 ∕ 状态行仍滞后）；VSC 同件受影响（需同笔收正其设计档 F-6 句或明裁）。
- **案 D（端壳本地）**：与 #595（模型菜单批）**同文件**（`composer-sync` ∕ `wire`）——排程约束必核。
- **兜底（#596 并入）**：`msg:send` 超时界 ⇒ 失败行 + 清位（乐观位的唯一解扣兜底）。

### 1.3 调度约束（诊断清核在案）

与 #595 同文件（案 D）∕ 与 B8（#572 §2-A2 `ev:activity` 键名收正 · 实施 #173/#174 在队）同点（案 C）∕ 与 #568 停滞批 `renderer/events.mjs` 同文件（仅案 C 新 kind 形）——设计轮给串行 ∕ 合批建议。

### 1.4 范围外注（顺笔闭合候选）

键盘面 ∕ 可见面不同步：`ctx.isRunning=true` 提交即置 ⇒ Ctrl+C ∕ Ctrl+I 门已开而按钮未变 Stop（`panel.mjs:140-153`）——案 A 可顺带闭合，设计轮同笔登记。

### 1.5 验收面预钉

口径 = 用户走查原话「提交即切」；判据 = ① 三端逐端实读翻转时机（提交→首可见变化的步数）② 真机时长读数（补 #175 未读数）③ 兜底（超时 ⇒ 不假忙）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（修正轮：评审 #179 十条裁定 1–9 逐条落位（§2.12 生效单源）；#10 需求档补行归父侧 · 2026-09-29）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.0 交付形态与口径（设计轮 · 零实施）

- **本批 = 设计轮（评审就绪 · 零实施）**：交付物 = 本节自持（选案裁定 ∕ 机制设计 ∕ 改动面 ∕ 验收对照 ∕ 冲突面调度 ∕ 上抛项）；**持久契约落点** = `docs/desktop/design/IPC.md`（`ev:activity` 受理形行 + `msg:send` 回执 `started` 键注）· `docs/desktop/design/RENDERER.md` §1.1（受理形归约语义）· `docs/desktop/design/UI.md` §1 输入区行（提交即置）· `docs/desktop/design/PROJECT.md`（§4.1 行数随动 ∕ §4.2 本批行 ∕ 变更记录）——**逐处随实施轮落**（先例 = parity-b8 §2.0 ∕ model-menu §2.0）。本设计轮零产品码 ∕ 零文档面笔 ∕ 零评审点火。
- **根因（#175 在册 · 本轮复读坐实）**：核件提交面 `thincoder-render-core/composer/panel.mjs:332`（`setLoading(true)`）与两钮显隐判据 `:403-404`（`busyState()`）解耦——`busyState()`（`:71` = `state.turnState()`）桌面侧派生 = `renderer/composer-sync.mjs:85-90`（`busyOf`）← 位标 `tabBadges[key] ⊇ running` ← **唯一置位者** = `renderer/events.mjs:144` `onActivity`（`:148-166` turn 支）← 首个生产者 = 核环头 `thincoder-core/agent/turn-loop.mjs:81`（`onAgentTurn`——**模型环首轮**）。⇒ 提交 → 模型环首轮之间零置位 ⇒ 两钮零切换（滞后窗 = `msg:send` + `ensure` 装配 + 附件降级窗 + `beginRun`）。
- **三端对位账（本轮复读）**：CLI 同 tick ✓（`thincoder-cli/src/tui/agent-turn.mjs:120-121` 回合体入口同拍置 `processing`）；VSC ≈1 跳 ⚠️（`thincoder-vscode/src/extension/panel-chat.mjs:124` `_publishTurnState("running")` 于一切 await 前）；桌面 ❌（本批修）。

### 2.1 本批条目（覆盖 ∕ 不覆盖）

| # | 条目（覆盖） | 判据形态 |
|---|---|---|
| E1 | **提交即切**：提交（点击 send ∕ Enter）后两钮立即翻转（≈1 跳），不等模型响应 | 机检（翻转步数 = 受理形 1 事件跳）+ 真机时长读数 |
| E2 | **四清位封闭（不假忙）**：装配窗四失败径 + 回执超时 ⇒ 位标回收 + 失败行 | 机检（逐径用例）|
| E3 | **装配窗 Stop 语义**（本修新可达面闭合）：窗内 Stop（含 Ctrl+C）⇒ 发送取消（零起跑 ∕ 零历史入账） | 机检（zero-start + 回执） |
| E4 | **兜底并入（#596）**：`msg:send` 回执超时界 ⇒ 失败行 + 清位；迟到受理 ⇒ 自愈 | 机检（超时 ∕ 迟到两用例） |
| E5 | **单源不破**：位标置位 = 宿主事件；回收 = 宿主事实（回执 ∕ 超时）；渲染面零自产忙位 | 机检（`panel.mjs` ∕ `events.mjs` 零 diff） |
| E6 | **零回归 ∕ 零触面**：核件 ∕ VSC ∕ CLI 零文件；在位批次本地件全绿 | 机检（零触面名单 + 既有件复跑） |
| E7 | **边界登记**（不覆盖 ∕ 同族窗）：chain 续发窗 ∕ auto 轮窗未闭；键盘门亚跳差残余 | 在册（2.7 + U1） |

**明确不在本批**：chain 续发窗与 auto（digest ∕ timer ∕ 上行）轮窗的受理形（不变更既有行为——该两窗无 Stop 可及面，无假停面，登记 U1）；核件 `panel.mjs` 与 `renderer/events.mjs` 零改。

### 2.2 选案裁定（三案逐条对判据 · 父侧预钉 → 设计轮裁）

| 判据 | 案 A（核件面板乐观忙） | **案 C（主侧受理即置 · 采）** | 案 D（端壳本地） |
|---|---|---|---|
| ① 提交即切（用户口径） | ✅（仅按钮面） | ✅（≈1 跳） | ✅（仅按钮面） |
| ② 位标单源不破 | ❌ 面板本地 `_sendPending` = **第二源**（位标 ∕ 失败 ∕ 超时三源解扣） | ✅ 置位 = 宿主事件（新产点同权威）；回收 = 宿主事实（回执 ∕ 超时）；渲染面零自产 | ❌ 端壳影子位（与位标双写） |
| ③ 全可见面同刻齐切 | ❌ 只闭按钮（占位符 ∕ 状态行 ∕ 会话头门 ∕ 会话条仍滞后） | ✅ 四消费面同源位标——同帧齐切 | ❌ 同 A |
| ④ 四清位封闭 | ⚠️ 部分（解扣靠三源，失败径 ∕ 超时域不清） | ✅ 回执面统一闭合（四径 + 超时 + dispose——见 2.3(3)） | ⚠️ 部分 |
| ⑤ 冲突面 | 核件面板 **跨端同件**（VSC 同改 + 其设计档 F-6 句连带） | `turn-driver.mjs` ∕ `IPC.md`（B8 同档 ⇒ 串行；见 2.6） | 与 #595 **同档**（`composer-sync ∕ store`） |
| ⑥ 越层 ∕ 拆分 | 核件 `panel.mjs` 440 行（越 300 顾问线——在册拆分债注记触发面） | 三档皆 ≤300（见 2.5） | 端壳档同 #595 |
| ⑦ 机制面复杂度 | 三源解扣态（新增状态机） | 单点发射 + 单点回收 | 影子位与位标双写 + 同 A 三源问题 |

**裁定 = 采 C**（父侧「满量形态」条件核讫：C 能闭合全可见面同刻齐切 ∧ 四清位封闭——闭合形见 2.3）。

- **A 被否给由**：只闭按钮面（用户走查同段可见的占位符 ∕ 状态行仍滞后）；本地乐观位 = 与用户口径「位标单源不破」直接相抵；核件面板两端同件 ⇒ VSC 同笔受影响（其设计档需连带收正）而 VSC 本已 ≈1 跳对位——零收益换跨端面。A 的残余优势（键盘门与按钮同刻）在 C 下为**亚 IPC 跳差**（`panel.mjs:332` 置 `ctx.isRunning` 先于位标 ~1 跳）——登记 2.7②，不构成改选理由。
- **D 被否给由**：端壳本地 = 第二源同 A；且与 #595（model-menu）**同档**（`composer-sync ∕ store`——其 §2.6 表在册）⇒ 排程必串行；只闭单面。
- **兜底并入方式（#596）**：超时界归 **C 的回收面**（渲染面 `sendDirect` 单点，同点覆盖四径 + dispose + 超时——见 2.3(5)），不另立机制。

### 2.3 机制设计

**(1) 受理即置（信号形 = 复用 `{event:"turn"}` 无帧值）**

- **发射点**：`thincoder-desktop/src/main/turn-driver.mjs:183`（`flights.set(key, controller)` 后、`await ensure`（`:189`）前）——`post("ev:activity", { key, event: "turn" })`（**无 frame 值**）。窗内（`suspension.active` ∕ 忙态队 ∕ `bad-key` ∕ 无工作区）诸径**不发射**（检查序在 `:169-180`，发射点在其后 ⇒ 天然排除）。
- **形裁定：复用无帧 `turn`（vs 新 kind——被否）**：
  - 复用形：归约面**零改**——`events.mjs:148-166` turn 支对无帧值已合法（`turns` 槽条件写 `:152-154` 零落；`badge ∕ turnStarts ∕ lastOutputAt` 三写既有）⇒ 只增 IPC.md 一行契约（受理形）。
  - 新 kind 被否：reducer 新分支 + 「四形 ⇒ 五 ∕ 六形」契约双改 + 与 B8 A2 在**同一 `ev:activity` 行面互撞**（B8 §2.3 行 3 / IPC.md:57-61 正在改）——零消费者收益换双批同点冲突。
- **锚语义（有意）**：受理形落 `turnStarts[key]` ∕ `lastOutputAt[key]`（均 `!wasRunning` 条件写）⇒ 耗时段（`statusline-segments.mjs:109-114`）与静默段（`:121-127`）**自提交时刻起算**——即用户等待起算（与 E1 口径同义，与 #568 quiet 段正向协同）；真实帧值形随后由 `agent-bridge.mjs:223`（B8 改名后 `{turn, maxTurns}`）补 `turns` 槽。受理窗内 `turn` 帧未至 ⇒ 段 7 显示滞留前值（亚秒~秒级瞬态——登记 U4）。
- **发射唯一性**：每受理恰一发（`:183` 单点；重入无——检查门互斥）。

**(2) 位标单源论证**：置位 = 宿主事件（`ev:activity{turn}`——新产点，**同通道 ∥ 同权威**；写者仍唯一 = `events.mjs` reduce）；回收 = 宿主事实（回执 ∥ 超时缺位——2.3(3)）；渲染面**零自产忙位、零影子位**（A ∕ D 的本地乐观位才是第二源）。四可见面（按钮 ∕ 状态行 ∕ 会话头三值门 ∕ 会话条位标）同源于 `tabBadges[key]` ⇒ **同一 reduce 帧内齐切**。

**(3) 清位面（四清位封闭 = 回执面统一闭合 · 宿主四点零改）**

| 出处（`turn-driver.send`） | 现状回执 | 封闭形 |
|---|---|---|
| `:190-193`（`ensure` 抛） | invoke 拒绝（渲染面 `call` 捕获 → `ok:false`） | 改**非吞形**：`return { ok:false, reason: String(err?.message ?? err), started:false }`（原文案保留 ∕ 零静默 ∕ `release()` 先） |
| `:196`（跨中止闸） | `{ ok:false, reason:"aborted" }` | 同句 + `started:false` |
| `:197-200`（provider 无效） | `{ ok:false, reason:"provider-invalid" }` | 同句 + `started:false` |
| `:212-217`（降级窗后查位） | `{ ok:false, reason:"aborted" }` | 同句 + `started:false` |
| **（新）装配窗受理中止**（2.3(4)） | — | `return { ok:false, reason:"aborted", started:false }` |

- **渲染面规则**（`renderer/composer-wire.mjs` `sendDirect` 失败径 `:51-57`）：`ok` 假 ∧ `receipt.started === false` ⇒ `clearRunning(store.get(), key)`（`badges.mjs` 新导出——`running` 摘除状态级组合单点）+ 既有失败径照旧（退流 + 失败行 + loading 复位；稿 ↑ 可召回）。**守卫**：仅当本尝试仍为该键**最新在飞发送**才清（`inFlight` 表——防陈旧回执清掉后续尝试的受理位；见 2.4(3)）。
- **为何不采「宿主四清位发清形」**：四调用点 + 新通道形（reducer 分支）增长；且**超时径**（唯一可观测方 = 渲染面）仍须渲染面清 ⇒ 双机制。回执面单机制覆盖全径——含 **dispose 径**（受理后 executeTurn 未起跑 ⇒ 无 `stopped` 事件，回执是唯一回收信号）。

**(4) 装配窗 Stop 语义（新可达面闭合）**：`interrupt`（`:226-235`）既有（abort 占位控制器）；**新增**：`send` 于 `:214-217` 查位块后补 `if (controller.signal.aborted) { release(); cleanupTurn(attached?.paths ?? []); return { ok:false, reason:"aborted", started:false } }` ⇒ 装配窗 Stop（含 Ctrl+C）⇒ **发送取消**（零起跑 ∕ 零历史入账 ∕ 稿 ↑ 可召回）；`interrupt` 零改。
- 被否 **(β) VSC 闩形**（起跑即停——`panel-chat.mjs:104-113` 闩先例）：须动 `turn-face.mjs`（B8 同档）+ 造空转回合记录（消息入史 + `stopped` 痕）；且桌面此窗消息**尚未入史**（结构性差异）⇒ 取消才是本职语义。登记 U2（父侧若偏对位优先可换）。

**(5) 兜底（#596 并入 · 回执超时界）**：`sendDirect` 以 `Promise.race` 给 `call("msg:send")` 加界（`sendTimeoutMs` 缺省 `120000`——工厂注入缝，装配面零传）。
- 超时 ⇒ ①（本尝试仍最新 ∧ 位标在场）`clearRunning` ② 失败行（`reason:"timeout"`）③ 退流。
- **迟到自愈**：迟到回执 `ok` 真 ∧ 非队形 ⇒ 失败行清 + 用户块补写（`withUserBlock`——「活流块 ⟺ 已受理」不变式恢复）；队形 ⇒ 退流态保持；`ok` 假 ⇒ 无追加（已清）。
- 界值 = 判断项（须超一切合法装配窗：冷装配 + 多图降级）——登记 U5（可调常量单点）。

### 2.4 关键决策（给由）

1. **采 C（主侧受理即置）否决 A ∕ D**——给由见 2.2 表（单源 ∕ 全面 ∕ 清位封闭 ∕ 冲突面四轴）。
2. **信号形 = 复用无帧 `{event:"turn"}`**（否决新 kind）——归约面零改（不与 B8 A2 ∕ #568 在改行相撞）；契约 +1 行；锚语义（提交起算）为有意收益。
3. **清位 = 回执单机制（`started:false` 判据）+ 渲染面 `clearRunning`**（否决宿主四清位发清形 ∕ 渲染面 reason 推断表）——四径 + dispose + 超时全径一机制；渲染面零 reason 词表（零第二判据）；陈旧回执由 `inFlight` 最新尝试守卫排除。
4. **装配窗 Stop = 取消**（否决 VSC 闩形 ∕ 放任假停）——桌面该窗消息未入史（结构性）；闩形须动 B8 同档 `turn-face.mjs` 且造空转回合；放任 ⇒ Stop 假 affordance（本修自己制造的可及面，必须闭）。
5. **兜底归位**：超时 ⇒ 清位 + 失败行；迟到 `ok` ⇒ 自愈（行清 + 块补）——「乐观位的唯一解扣」落渲染面观测点（宿主挂起时宿主自清不可达）。
6. **chain ∕ auto 窗不闭（登记）**——用户口径射程 = 提交窗；该两窗非提交面且无 Stop 可及面（零假停面）；闭之须引 hold 窗清位新径 = 越射程（U1 另裁）。

### 2.5 受影响文件（行数 = 本轮实读定格 · 末空行计）· 测试面 · 验收对照

**改动档（3 + 测试件 + 文档）**：

| # | 档 | 现读 | 改动点（file:line） | 增量 |
|---|---|---|---|---|
| 1 | `thincoder-desktop/src/main/turn-driver.mjs` | **276** | ①受理形发射 `:183` 后（+1 行 + 注 ≤2）②`ensure` 抛径 `:190-193` 改非吞形 return（±0~+2）③三清位 `:196 ∕ :197-200 ∕ :212-217` 句内 + `started:false` 键（零净行）④装配窗中止检查 `:214-217` 块后（+3~4 行 + 注 ≤2） | ≈ **+8~10** ⇒ ≈284–286（≤300 ✓，无需拆分） |
| 2 | `thincoder-desktop/renderer/composer-wire.mjs` | **176** | ①引 `clearRunning`（+1）②失败径 `:51-57` 增 `started` 判清除 + 最新尝试守卫（+6~8 + 注 ≤2）③超时 race `:50` 邻位 + 迟到自愈（+12~16 + 注 ≤3）④deps 增 `sendTimeoutMs`（缺省 120000——注入缝，装配面零传） | ≈ **+25~30** ⇒ ≈201–206（≤300 ✓） |
| 3 | `thincoder-desktop/renderer/badges.mjs` | **23** | +`clearRunning(state, key)`（`running` 摘除状态级组合单点；值等 ⇒ 原引用）（+9~11 含注） | ≈ **+9~11** ⇒ ≈32–34（≤300 ✓） |
| 4 | 批次本地件（新） | — | `.thincoder/tmp/2026-09-29-send-busy-timing.test.mjs`（**#545 即时形** ⇒ 父侧转正 `docs/batches/`） | ≈120–180（新） |
| 5 | 文档（实施轮 · 逐处随落） | — | `IPC.md`（**380**——受理形行 + `msg:send` 回执 `started` 键注，≤+4）· `RENDERER.md`（**203**——§1.1 受理形半句，≤+4）· `UI.md`（**666**——§1 输入区行，≤+3）· `PROJECT.md`（**1178**——§4.1 行数 ∕ §4.2 本批行 ∕ 变更记录，≤+6） | ≤+17 |

**零触面（实施轮判据 = 零 diff）**：`thincoder-render-core/composer/panel.mjs` · `renderer/events.mjs` · `renderer/composer-sync.mjs` · `renderer/mount-composer.mjs` · `renderer/views/chrome.mjs` · `renderer/views/statusline-segments.mjs` · `src/main/turn-face.mjs` · `src/main/turn-chain.mjs` · `src/main/ipc.mjs` · VSC 全树 · CLI 全树。**越层 ∕ 拆分核**：三档改动后皆 ≤300（1 ∕ 2 ∕ 3 行数上表）——零新拆分债。

**测试面**（单测 · 批次本地件；**集成面 = 桌面三前端域**）：
- ① `turn-driver` 平 node 直测（全注入 —— 档头「零宿主依赖」判据）：受理 ⇒ 恰一发 `ev:activity {event:"turn"}`（无帧值）∥ 四径回执 `started:false` ∥ 装配窗中止 ⇒ 零起跑 + `aborted` 回执 ∥ 忙态 ∕ 窗 ∕ bad-key 径**零发射**。
- ② `composer-wire` 直测（假 `call`）：`ok` 真 ⇒ 零清位；`ok` 假 ∧ `started:false` ⇒ 清位 + 退流 + 失败行；队形回执 ⇒ 零清位；超时 ⇒ 清位 + 行；迟到 `ok` ⇒ 行清 + 块补；陈旧回执（后发尝试在飞）⇒ 零清位。
- ③ `badges.clearRunning`：值等 ⇒ 原引用；摘除后其余码保序。
- ④ 零回归：在位批次本地件（`docs/batches/2026-09-29-desktop-window-queue-parity.test.mjs` 等）全绿。
- ⑤ 真 Electron 使用面（D16 义务）——**测试档随修随加 ∕ 不进设计面条目**（用户 2026-09-27 裁定）；真机条目见下。

**验收对照（回指 2.1 条目）**：

- **AC1（E1）**：① 机检：无任何 `onAgentTurn` 帧事件到达时，受理形 ⇒ `syncBusy` ⇒ `setLoading(true)` ⇒ 两钮翻转——**翻转步数 = 受理形 1 事件跳**（零模型响应依赖）；② 真机（父侧）：提交 → **两钮翻转时长读数（事件戳差——补 #175 未读数）** + 四可见面（按钮 ∕ 状态行耗时 ∕ 会话头三值门 ∕ 会话条位标）同刻在场。
- **AC2（E2）**：机检：四径回执 `started:false` + 超时 ⇒ 位标回收（`busyOf` 判假）+ 失败行在场——**逐径用例，漏一径 ⇒ 该径红**。
- **AC3（E3）**：机检：装配窗内 `interrupt` ⇒ 零起跑（`drive` 未调）+ `{ok:false, reason:"aborted", started:false}`。
- **AC4（E4）**：机检：超时 ⇒ 清位 + 行；迟到 `ok` ⇒ 自愈（行清 + 块补 + 位标随帧复位）。
- **AC5（E5）**：机检：`panel.mjs` ∕ `events.mjs` 零 diff；位标写者唯一（reduce 面）。
- **AC6（E6）**：机检：零触面名单逐档 `git diff` 空 + 在位批次本地件全绿。
- **AC7（E7）**：边界项在册（2.7）且 U 项逐条有父侧处置。
- **真机条目（父侧亲跑）**：① 冷启动提交（首装配窗）② 带图提交（降级窗）③ 快速连发（忙态队 ∕ 端判闲反径）④ 装配窗 Stop ⑤ 回执超时（注入缝模拟）⑥ 四可见面同刻读数。

### 2.6 冲突面与调度建议

- **B8（#572 · 在途）**：同档 = `turn-driver.mjs`（B8 W2 A9 `:66-70 ∕ :273`）+ `IPC.md`（B8 W4 逐行收正——`ev:activity` 行面在改）。**建议：本批实施轮排 B8 W1/W2/W4 落定之后**（受理形契约行立于改名后形态；同档串行可再显式声明）。`renderer/events.mjs` 本批零触 ⇒ 与 B8 W1 无同档交。观察：`events.mjs` 现读 **264**（B8 定格 247）——B8 实施轮按「实读定格」纪律届盘（其 §2.5 已注）。
- **#595（model-menu · §3 已完成）**：其档 = `composer-sync.mjs ∕ store.mjs ∕ mount-composer.mjs ∕ ipc.mjs ∕ ipc-registry.mjs ∕ preload.cjs ∕ settings*`；本批零触 ⇒ **零同档 ⇒ 可并行**（案 D 被否的排程理由亦在此）。
- **#568（stall-indicator）**：其桌面档 = `renderer/events.mjs ∕ heartbeat.mjs` 等；本批零触 ⇒ 零同档（受理形使静默锚起于提交——与 quiet 段语义相容，正向协同）。
- **B10（#574）**：同档 = `ipc.mjs ∕ preload.cjs ∕ ipc-registry.mjs ∕ settings*`；本批零触 ⇒ 零同档。
- **#545**：批次本地件走即时形（`.thincoder/tmp/` → 父侧转正）。

### 2.7 边界（本批不做）

1. **chain 续发窗 ∕ auto（digest ∕ timer ∕ 上行）轮窗的受理形**——同族窗未闭；两窗无 Stop 可及面（零假停面）且非提交面；闭之须引 hold 窗清位新径（U1）。
2. **键盘门与按钮的亚 IPC 跳差**（`panel.mjs:332` 置 `ctx.isRunning` 先于位标 ~1 跳）——残余登记；该差内 Ctrl+C 走 2.3(4) 语义（取消）⇒ 无假停；不采 A 的「同刻闭合」以省核件 ∕ VSC 面。
3. **`msg:send` 回执不新增富化键面**（仅 `started` 一键）。
4. 核件 ∕ VSC ∕ CLI **零文件**（E6）。

### 2.8 需求面合规（核 ∕ 不写 —— 笔权在主 agent）

- **依据**：`docs/desktop/requirements/PROJECT.md` **§3.5:78**（用户原话「功能至少应该跟 cli/vsc 对齐」）+ **§3.6**「功能面全量对位」（VSC 已有用户可见功能 ⇒ 桌面必须有；缺项 = 缺陷；台账 #530）——CLI 同 tick ∥ VSC ≈1 跳两端在手，桌面滞后 = 缺项；**D17 ∕ D22**（状态行对齐「同刻同信息」）同受本修（耗时 ∕ 静默锚随动）。
- **发现（建议父侧处置）**：D 表无本修对位行（输入区忙态切换时机未明文化）——建议新增 D 行或于 D25 ∕ D17 行明文化（先例 = D27 新增行形）。

### 2.9 上抛项（父侧裁）

| # | 项 | 处置建议（本设计倾向） |
|---|---|---|
| U1 | chain 续发窗 ∕ auto 轮窗同族窗是否续批 | 另轮小批（低紧迫：零 Stop 可及面）；由父侧钉 |
| U2 | 装配窗 Stop 语义（取消 vs VSC 闩形对位） | 采取消；若对位优先 ⇒ 换闩形（代价 = `turn-face.mjs` + B8 同档串行） |
| U3 | 装配窗 Ctrl+I 携文（注文不入 —— 中止取消） | 接受（该语义预设运行中上下文）；如需改判另轮 |
| U4 | 受理窗内段 7 回合计数滞留前值（瞬态） | 接受（首帧即正；如须免瞬态须动 reducer——本批零触） |
| U5 | 超时界 120000 定值（可调常量单点） | 采；如真机见误报（多图降级窗）再调 |
| U6 | 「发送失败（aborted）」措辞复用（既有词句） | 采（诚实面：未发出 + ↑ 可召回）；词面如须另措 = 主 agent 权 |

### 2.10 评审范围清单（设计评审用）

- **主审对象** = 本节 §2 全段（2.0–2.10）。
- **对位实盘（复核用 · 只读）**：`thincoder-desktop/src/main/turn-driver.mjs`（`:169-221 ∕ :226-235 ∕ :271-275`）· `renderer/composer-wire.mjs`（`:48-72`）· `renderer/badges.mjs`（`:12-23`）· `renderer/composer-sync.mjs`（`:85-90 ∕ :128-136`）· `renderer/events.mjs`（`:144-179`）· `renderer/views/chrome.mjs`（`:68-78`）· `renderer/views/statusline-segments.mjs`（`:109-127`）· 核 `thincoder-core/agent/turn-loop.mjs:81` · `thincoder-render-core/composer/panel.mjs`（`:71 ∕ :300 ∕ :332 ∕ :401-410`）· CLI `agent-turn.mjs:120-121` · VSC `panel-chat.mjs:104-113 ∕ :124` · `agent-bridge.mjs:223`。
- **三链同源核**：本节条目（2.1 E1–E7）⟺ 需求档（§3.5:78 ∕ §3.6 ∕ D17 ∕ D22）⟺（实施轮）`IPC.md` 受理形行。
- **范围注**：核件 ∕ VSC ∕ CLI 代码坐标未逐行复核（只读抽样）；`renderer/events.mjs` ∕ 需求档不在本批笔域（发现随 2.8 ∕ U 项登记）。

### 2.11 订正（本笔 · 2026-09-29 · 仅订正下列三点，余段不变）

1. **触及面补一档（零触面名单同笔剔除该档）**：`thincoder-desktop/src/main/ipc.mjs`（**298**）——转口纯直传（`:192` `return requireAgentHost().send(...)` ⇒ 回执形原样达 invoke，含 `started` 无中间变换），但 **`:187-191` 注释（reason 词表）须随正**：增「装配抛（err 文案原样）」形 + `started` 键注 ⇒ **≤+2**。**2.5 零触面名单更新**：剔除 `src/main/ipc.mjs`；**AC6** 判据同笔按新名单执行。冲突：该档与 #595（W1 `modelCatalogChannel` `:284` 邻位）· B10（W2/W3）同档 ⇒ **files 域串行**（本批改动 = 注释 2 行级，可与同档任一批同序，不得并行）。
2. **2.3(3) 行 1「非吞形」定性补注**：形 = `return { ok:false, reason:<err.message 原样>, started:false }`（`release()` 先 ∕ 零静默保留）。**被否形 = 保留 invoke 拒绝 + 渲染面包 `rejected` 标记**（给由：拒收根因仍须渲染面识别 ⇒ 标志落 `mount-composer.mjs`——该档与 #595 同档，换「同档 2 行」为「跨档 1 行」；且双标志判据 = 第二判据。判据（本轮码核）：`send` 唯一抛点 = `ensure`（`:189`），其后至 `return`（`:220`）零抛点 ⇒ 回执统一形可达）。
3. **行数账微差（只报）**：`thincoder-desktop/renderer/events.mjs` 现读 **264**（本设计 2.0 引其坐标按现盘；B8 §2.5 定格 247 为 as-of 旧值——归属 B8 实施轮届盘，不属本批）。

### 2.12 修正轮记录（评审 #179 · pass · 十条裁定逐条落地 · 2026-09-29）

**性质与单源声明**：本条 = 修正轮（点修制）对评审「轮次 1」十条裁定的落地记录，同为**生效单源**——1–9 各条给出生效形；凡与旧行字面不符处以本条为准（旧行作废、不另读；段 append-only ⇒ 以单点复述闭合）。#10（需求档补行）= 父侧笔，不在本舱。**范围仍 = 零实施 ∕ 零产品码 ∕ 零文档面笔**。

**1（评审 #2 · 生效零触面名单单源化）**

AC6 判据按本名单逐档 `git diff` 空执行（旧文 `:131` 名单 ∕ `:147` AC6 句作废）：

- `thincoder-render-core/composer/panel.mjs`
- `thincoder-desktop/renderer/events.mjs` · `renderer/composer-sync.mjs` · `renderer/mount-composer.mjs`
- `thincoder-desktop/renderer/views/chrome.mjs` · `renderer/views/statusline-segments.mjs`
- `thincoder-desktop/src/main/turn-face.mjs` · `src/main/turn-chain.mjs`
- VSC 全树 · CLI 全树

`thincoder-desktop/src/main/ipc.mjs` **不属零触面**（已入改动集——见 2）。**生效改动档 = 代码 4 档**（`turn-driver.mjs` ∕ `composer-wire.mjs` ∕ `badges.mjs` ∕ `ipc.mjs`）+ 批次本地件 + 文档 4 处（旧文 `:121`「3 + 测试件 + 文档」以本条为准）。

**2（评审 #3 · ipc.mjs 档位句）**

`thincoder-desktop/src/main/ipc.mjs`：现读 **299**（本轮实读 · 末空行计 = 同 3 口径）· 改动 = `:187-191` 注释（reason 词表补「装配抛（err 文案原样）」形 + `started` 键注；转口实参形不变）。

**裁定 = 档线内硬顶**：注释按同行扩容 reflow、净 ≤**+1** ⇒ 落点 ≤ **300**（判据：越 300 ⇒ 实施轮停并报——不得贴线越档）。

给由：① 顾问线 = 300（`AGENTS.md`）；② §2.5 越层核自陈「改动后皆 ≤300 ∕ 零新拆分债」——ipc.mjs 入改动集后须同口径（免同类两读）；③ 改动 = 自家注释文，reflow 零语义损耗 ⇒ 净 +1 可达；④「注释级 · 结构不变」登记形会把贴线越档立成先例（例外须带到期条件——不值当 2 行注释）。

〔旧文 `:191` 与 §2.11(1) 的 **298** ∕ ≤+2 以本条为准。〕

**3（评审 #4 · 基数口径统一 + 数值收正）**

**生效口径 = 末空行计**（行数 = `split("\n").length` = `read` 工具「N lines total」；同口径先例 = `docs/batches/2026-09-29-core-hygiene.md` §2.0 · `docs/batches/2026-09-29-parity-b8-ipc.md` §2.2）。给由：核读面（评审 ∕ 验收 ∕ 实施）与报告面同一算术 ⇒ 治「疑计法差」根因；机械式零人工判读。

按此口径重列 2.5 表诸基数：

| 档 | 生效基数 | 备注 |
|---|---|---|
| `thincoder-desktop/src/main/turn-driver.mjs` | **277** | 旧 276 收正（`:125`） |
| `thincoder-desktop/renderer/composer-wire.mjs` | **177** | 旧 176 收正（`:126`） |
| `thincoder-desktop/renderer/badges.mjs` | **24** | 旧 23 收正（`:127`） |
| `thincoder-desktop/src/main/ipc.mjs` | **299** | 旧 298 收正（`:191` ∕ §2.11(1)——同 2） |
| `thincoder-render-core/composer/panel.mjs` | **440** | 不变（新口径下同值） |
| `thincoder-desktop/renderer/events.mjs` | **265** | 旧 264 收正（`:153` ∕ `:193` 两处同收） |
| `docs/desktop/design/IPC.md` | **381** | 旧 380 收正（`:129`） |
| `docs/desktop/design/RENDERER.md` | **204** | 旧 203 收正（`:129`） |
| `docs/desktop/design/UI.md` | **667** | 旧 666 收正（`:129`） |
| `docs/desktop/design/PROJECT.md` | **1179** | 旧 1178 收正（`:129`） |

**注**：composer-wire ∕ badges ∕ RENDERER ∕ UI ∕ PROJECT 五行 = 口径统一的同收（旧值为内容行计）；`panel.mjs` 在新口径下同值不变。**§2.11(3) 同步**：`events.mjs` 生效现读 = **265**。

落点估算随基数同收：`turn-driver` ≈ **285–287**（+8~10）· `composer-wire` ≈ **202–207**（+25~30）· `badges` ≈ **33–35**（+9~11）——三档皆 ≤300 ✓（增量预算不变）；`ipc.mjs` 落点见 2。

**4（评审 #5 · 需求锚改指）**

§2.8 依据行生效形：需求依据锚 = `docs/desktop/requirements/PROJECT.md` **§3.5b「会话面板补齐」缘起段**（用户原话「输入框呢？…功能至少应该跟 cli/vsc 对齐」✓ + 射程裁定 ✓；as-of 实读 `:83`）。

**引形 = 节符号（不引行号）**——给由：需求档自定「引符号不引行号」（其 §3.5b 段内自注：行号每次编辑会漂）；本发现即行号漂移类（旧锚 `§3.5:78` 现读为无关条）⇒ 符号引免二次漂移；行号仅作 as-of 备查。同文 `:186` 三链同源核行内同锚一并按本条收正（§3.5b）。其余锚（§3.6 ∕ D17 ∕ D22）实读成立，不动。

〔旧文 `:168` ∕ `:186` 的 `§3.5:78` 锚作废。〕

**5（评审 #6 · AC5 第二判据改写为可机检形）**

AC5 生效形：

- ① `panel.mjs` ∕ `events.mjs` 零 diff（不变）；
- ② **位标写者账（结构核式）**——**置位**（`running` 置真）唯一写者 = reduce 面 `renderer/events.mjs` 受理支（`badgeStamps(badges, ev.key, "running", true)`，`:158`）；
  **清位**调用点闭集 = 既有一处（reduce 面回合尾 `events.mjs:175`——宿主事件驱动）+ 新一处（渲染面 `clearRunning` 单点——**宿主事实驱动**：回执 `started === false` ∕ 超时两支，`renderer/composer-wire.mjs`）；渲染面零其它 `running` 清写；
- 判据锚 = `badges.mjs` 导出面（`badgeStamps` + `clearRunning`，闭集）+ `composer-wire.mjs` 调用点（仅上述两支）。落点 = 测试面 ③（行为）与 ⑥（结构核——见 9）。

〔旧文 `:146` 句「位标写者唯一（reduce 面）」作废——按字面与 2.3(3) 新清位写者相抵且不可机检。〕

**6（评审 #7 · 超时兜底次生边界：自愈守门判据 + E4 扩例）**

自愈径守门生效形（分治两动作）：

- **失败行清 = 受最新尝试守卫门住**（守卫单点同 2.3(3)：本尝试 = 该键 `inFlight` 表当前最新登记；重发一经发起 ⇒ 前次即非最新）：迟到回执所在尝试非最新 ⇒ **零清行**（行槽属后续尝试面——防重发径自身失败行被陈旧 `ok` 抹掉）；仍为最新 ⇒ 照清。
- **用户块补写 = 不受守卫**（消息级不变式）：「每受理消息恰一枚块」按消息计、与尝试新旧无关——#1 迟到获受 ⇒ 补写恰一枚（否则 #1 回合输出将无块在先 = 不变式破）；重发 #2 = 另枚独立受理（其回执 `queued:true` 在册已证宿主入队）⇒ **同文双块 ∕ 双回合 = 双受理的如实投影——不合并 ∕ 不去重 ∕ 不标记**（合并 ⇒ 以一枚显示两枚真实受理，不诚实；去重标记 ⇒ 新增第二状态面，零收益）。
- **残余（登记 · 不另列）**：重发在飞窗内 #1 旧失败行留场至 #2 结算（行槽单槽语义；#2 结算即收正）。
- **E4 扩例（生效）**：「重发在飞 + 首次迟到 `ok`」⇒ ① 零清位追加（陈旧守卫）② 失败行不清 ③ 恰补一枚块（#1）④ 重发回执照常（两径互不吞）。落点 = 测试面 ② 增例。

〔旧文 `:51` E4 行判据「超时 ∕ 迟到两用例」⇒ 生效 = **三用例**。〕

**7（评审 #8 · 超时实现形）**

2.3(5) 超时实现形生效句：`const orig = call("msg:send", …)`；`Promise.race` **只作「先到者」读取**——timer 先到 ⇒ 超时处置（清位 ∕ 失败行 ∕ 退流）+ **`orig` 另挂续延**（settle ⇒ 按本条 6 守门判据执行迟到自愈）；`ok` 先到 ⇒ 正常径 + timer 清点。单次结算标志定态（`ok` 先到 ⇒ 迟到续延零动作）。race 不注销 `orig` 续延 ⇒ **超时句与自愈句两径正交、不互斥**。

〔旧文 `:105-108` 字面互斥面以此条消解。〕

**8（评审 #9 · 路由随动登记）**

随动登记（生效）：受理即置使核件 `thincoder-render-core/composer/panel.mjs:300`（`busyState() === "running"` 分支）在**装配窗内即为真** ⇒ 窗内二次提交由直发径（`userMessage` ⇒ `sendDirect`）改走**队径**（`queuedUserMessage` ⇒ `sendQueued`；`:321`）。**终局同入队**（直发径遇宿主在飞 ⇒ 回执 `queued:true` ⇒ 本地块退流；队径 ⇒ 本地块留场 + 待发送标——`composer-wire.mjs:58-64` ∕ `turn-driver.mjs:174-180`）——两径可见形皆既有，本修只提前路由判定时点（不新增形）⇒ **接受**；并列入真机条目 ③ 观测量（快速连发窗可见形 = 本路由）。

**9（评审 #1 · AC1 机检落点）**

AC1 机检半边生效落点 = **测试面新增 ⑥ 结构核（AC1 链路 · 判据单源在场）**——沿先例 `docs/batches/2026-09-29-desktop-window-queue-parity.test.mjs` T8（`:18` 目录句 ∕ `:319-333` 用例：不可 node 装载档以 `text()` + `assert.match` 断「判据单源在场」）逐跳断言：

1. `renderer/events.mjs` 受理支：`badgeStamps(badges, ev.key, "running", true)`（`:158`）· 支判据纳无帧 `{event:"turn"}`（`:148-149`）；
2. `renderer/views/chrome.mjs`：`busyOf` = 位标含 `running`（`:68-71`）；
3. `renderer/composer-sync.mjs`：`turnState` 支 `busyOf(held, key) ⇒ "running"`（`:88`）；
4. `renderer/composer-sync.mjs`：`syncBusy` ⇒ `panel.setLoading(busy)`（`:128-135`）；
5. `thincoder-render-core/composer/panel.mjs`：两钮判据 = `busyState()`（端 `turnState()` 派生；`:403-404`）。

断言形 = 「链在位 ∕ 判据单源」结构核（零行为断言）；**行为与时序面（翻转步数 = 1 事件跳 ∕ 时长读数）归真机条目 ①/②**（AC1② 不变）。

给由（选机检，不改列真机）：① 发现 #1 指机检半边无落点——结构核成本 = 1 用例块（T8 同形在册先例）；② 链路四档（`events.mjs` ∕ `chrome.mjs` ∕ `composer-sync.mjs` ∕ `panel.mjs`）不可 node 装载 ⇒ 结构核是可达机检形；③ 2026-09-27 裁定射程 = 真 Electron **使用面**测试（D16）不进设计面条目——结构核非使用面、不碍（机检 ∕ 真机两面并行：机检证链在，真机证翻转时读）。

**2.12 补记（修正轮同轮复核 · 2026-09-29 · eng-designer）**

- **`ipc.mjs` 基数复核 = 303**（本条 2 ∕ 3 定格后同档他批先行落笔 +4——工作区实证 = `model:catalog` 渠（#595 面）+ G-2 释放行；未提交）。**生效判据（改述）**：本条 2 的「落点 ≤300」按**增量判据**执行——落点 = **实施轮实读基数 + 本批净 ≤+1**（注释 reflow；本批零越档贡献）；基数既 >300 时其越档归属 = 该基数来源批（#595 · 另账），本批只负责自身 +≤1 不新增债。同档串行约束（§2.11(1)）照旧——实施轮入场前核该档他批落定、按届盘实读基数。
- 表内 `ipc.mjs` **299** = 本轮定格（as-of）；复核值 303 以本补记为准。其余九行复核一致（277 ∕ 177 ∕ 24 ∕ 440 ∕ 265 ∕ 381 ∕ 204 ∕ 667 ∕ 1179）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审对象** = `thincoder/docs/batches/2026-09-29-send-busy-timing.md` §2 全段（2.0–2.11 · 对象态 = 待评审）。**方法** = 全档实读 + 2.10「对位实盘（复核用 · 只读）」逐坐标抽核（在盘实读）。

**抽核通过（证据）**：`src/main/turn-driver.mjs:183`（`flights.set`）· `:189`（`await ensure`）· `:190-193` ∕ `:196` ∕ `:197-200` ∕ `:212-217` 四径 ∕ `:226-235`（`interrupt` abort 占位且**不清 `flights`** ⇒ 2.3(4) 新检查点必需且可达）· `:271-275` 导出面；`post` 为工厂注入面（`:41`）⇒ `:183` 发射可行；`renderer/composer-wire.mjs:48-72`（失败径 `:51-57` ✓）· deps 带缺省（`:29-31`）⇒ `sendTimeoutMs` 注入缝可行；`renderer/badges.mjs` 23 行 ∕ `badgeStamps` 值等即原引用（`:12-23`）⇒ `clearRunning` 可行；`renderer/events.mjs:144-166`（无帧 `turn` 支：`turnSlot` 零落 ✚ `turnStarts ∕ lastOutputAt ∕ badge` 三写 ✓）· `isTurnTail`（`:117-122`）对 `{event:"turn"}` 判假 ⇒ **归约面零改**claim 成立；`renderer/views/chrome.mjs:68-71`（`busyOf` = 位标含 `running`）· `statusline-segments.mjs:109-115 ∕ 121-128`（两段同以 `running` + 锚表为判据 ⇒ 四消费面同源同帧claim成立）；`mount-composer.mjs:103-120`（`call` 归一拒收 ∕ 畸形 ∕ 无桥 ⇒ `{ok:false,reason}`）⇒ 回执面单机制不露第五径；`ipc.mjs:192` 纯直传 ∕ `:187-191` 词表注释 ✓；`panel.mjs:71 ∕ :300 ∕ :332 ∕ :401-410`（`:403-404` 两钮判据 = `busyState()`）✓；`turn-loop.mjs:81`（`onAgentTurn(frame.turn, frame.maxTurns)`）· `agent-bridge.mjs:223`（`{event:"turn",n,max}`）· `IPC.md:57` ✓；CLI `agent-turn.mjs:120-121` ✓ · VSC `panel-chat.mjs:104-113 ∕ :124` ✓；需求档 D17 `:162` ∕ D22 `:167` ∕ §3.6 `:138`（台账 #530 ✓）；契约落点（`IPC.md` §1 `:9` ∕ §2 `:103` · `RENDERER.md` §1.1 `:27`——代码自身即引该节 · `UI.md` §1 `:10` · `PROJECT.md` §4.1 `:140` ∕ §4.2 `:351` ∕ 变更记录 `:909`）皆在盘 ∕ 题主相符；批次本地件约定（`docs/batches/2026-09-29-desktop-window-queue-parity.test.mjs:3-5 ∕ :18` T8 结构核先例）+ 桌面套件 2026-09-28 全清（`thincoder-desktop/test/files.mjs:3` = `[]`）⇒ 本批「批次本地件」测试面与现行口径一致。

**发现表（🔴 0 · 🟡 6 · 🔵 4）**

| # | 类别 | 严重度 | 问题 | 建议 |
|---|------|--------|------|------|
| 1 | 验收 ∕ 可验证性 | 🔵 | AC1 机检半边（`…:142`「受理形 ⇒ `syncBusy` ⇒ `setLoading(true)` ⇒ 两钮翻转」）在测试面条目（`:134-138`）无落点：①只断言发射端恰一发、③只断言 badges，跨零触面链路（events.mjs 归约 + composer-sync + panel）无声明断言形。 | 在测试面条目点明该链路的断言形（结构核式，沿 `…-window-queue-parity.test.mjs:18` T8 先例），或按 2026-09-27 裁定把该半边改列真机读数项。 |
| 2 | 文档卫生 ∕ 内部状态 | 🟡 | 规范面仍持失效文：`:131` 零触面名单含 `src/main/ipc.mjs`、AC6（`:147`）判据按该名单逐档 `git diff` 空；而 `:191`（§2.11(1)）已把该档移入改动集并要求「2.5 名单更新 ∕ AC6 同笔按新名单执行」⇒ 按字面执行会把 2 行注释改动判越界。 | 单源化生效名单：订正后重新声明一份「生效零触面名单」并令 AC6 指向它（段为 append-only ⇒ 以生效名单单点复述闭合，勿留两读）。 |
| 3 | 受影响文件行数注解 | 🟡 | `src/main/ipc.mjs` 入改动集（`:191`）标现读 **298** ∕ ≤+2 ⇒ 落点 300 恰贴顾问线；本轮实读该档 **299** 行 ⇒ +2 = **301** 越「>300 需主动拆分复核」档，而 §2.11 未附该档档位 ∕ 拆分行（`:131` 越层句只枚举 1/2/3 三档）。 | 补该档档位句（按现读基数写明改动后行数是否 ≤300 或「结构不变 · 注释级」），或显式登记贴线接受，免验收期两读。 |
| 4 | 受影响文件行数注解（数值） | 🔵 | 注解基数与现盘差 1：turn-driver **276** ∕ 277（`:125`）· events.mjs **264** ∕ 265（`:193`）· ipc.mjs **298** ∕ 299（`:191`）· IPC.md **380** ∕ 381（`:129`）；而 panel.mjs 440 ∕ 440 · composer-wire 176 ∕ 176 · badges 23 ∕ 23 逐数吻合 ⇒ 与 `:119` 自述口径「末空行计」不一致（疑计法差）。除 #3 外均无档位影响。 | 统一基数口径（末空行计 ∕ 不计择一）并在受影响表注一句；ipc.mjs 基数按现读值随 #3 一并收正。 |
| 5 | 需求面引证 | 🟡 | §2.8（`:168`）把用户原话锚在 `docs/desktop/requirements/PROJECT.md §3.5:78`；实读 `:78` = 「跨会话告警位的精确形（随 VSC 对齐批）」（无关条），原话住 `:83` 且所属节现为 **§3.5b**（`:81`「原与上节同号 3.5 ⇒ 2026-09-28 收正」）⇒ 需求依据锚失效（同段 §3.6 ∕ D17 ∕ D22 三处引证实读成立）。 | 改锚到 §3.5b:83（或按节名引，沿需求档「引符号不引行号」先例），使需求依据可点读。 |
| 6 | 验收 ∕ 可验证性 | 🟡 | AC5（`:146`）第二判据「位标写者唯一（reduce 面）」与本设计自陈机制相抵：2.3(3)（`:99`）新增 `clearRunning` 并由 composer-wire 侧调用 ⇒ `running` 出现 reduce 面之外的写者；按字面机检不可满足。 | 改写为可机检形：置位写者唯一 = reduce 面；清位仅经 `clearRunning` 单点且由宿主事实（回执 `started:false` ∕ 超时）驱动（判据锚 `badges.mjs` 导出面 + composer-wire 调用点）。 |
| 7 | 验收 ∕ 边界覆盖 | 🟡 | 超时兜底次生边界未落判据：超时清位后用户重发、且首次尝试迟到回执 `ok` 真时，2.3(5) 迟到自愈（`:107`「失败行清 + 用户块补写」）与重发径本地先行块并存 ⇒ 同文两条用户块 ∕ 双回合；设计只登记界值（U5 `:179`），未定重复块规则，也未说明 `inFlight`「最新尝试」守卫（`:99`）是否同门自愈径。 | 补一句判据：自愈径是否受最新尝试守卫门住；若不受，明确同文双块的处置（补写 ∕ 不补 ∕ 标记）——E4 用例（`:51`）扩一枚「重发在飞 + 首次迟到 `ok`」用例。 |
| 8 | 清晰度（实现形） | 🔵 | 2.3(5) 以 `Promise.race` 表超时（`:105`）同时要求迟到自愈（`:107`）：字面 race 丢弃 invoke 承诺续延 ⇒ 迟到值不可达，两句字面互斥（增量预算 +12~16（`:126`）容得下，形未钉）。 | 写明超时实现形（race 只对计时器 ∕ 原承诺另挂续延兜迟到值），使两句不互斥。 |
| 9 | 随动登记（零触面行为变更） | 🔵 | 受理即置使核件自有判据提前为真：`thincoder-render-core/composer/panel.mjs:300`（`busyState() === "running"` 分支）⇒ 装配窗内二次提交由直发径改走队径（`:321` `post("queuedUserMessage")`）；两径终局同为宿主入队（`turn-driver.mjs:174-180` ∕ `composer-wire.mjs:58-64`），但 `_qLocal` 自增 ∕ 待发送带 vs 退流径的可见形不同，设计未登记该随动。 | 在 2.7 边界或 2.2 效果账补一句（装配窗内二次提交路由随忙态提前而变），并确认两径可见形差异可接受或列入真机条目 ③ 观测量。 |
| 10 | 协调项（非缺陷） | 🟡 | 需求档无本修对位行（设计已自报 `:169`）⇒「提交即切」未明文化，2.10 三链同源核（`:186`）缺需求侧锚点之一。 | 需求档补行（新增 D 行，或并入 D25 ∕ D17 行明文化），闭合「条目 ⟺ 需求 ⟺ 契约」三链。 |

**口径限制（随报）**：本次上下文未提供文档地图 ∕ 项目标准档 ⇒ Document ownership 判据按降级口径执行（以「题主档在盘 + 代码自身引证一致」替代地图比对，见上「抽核通过」）；机制 ∕ 行数 ∕ 契约落点三类核验均以现盘实读为准。

VERDICT: pass（🔴 0 / 🟡 6 / 🔵 4——#2 ∕ #3 ∕ #5 ∕ #6 ∕ #7 ∕ #10 为 🟡 非阻断项，建议随实施轮或父侧处置收口）

## §4 用户批准（主 agent）

**批准（父侧代执行 · 2026-09-29）**

- **依据**：评审 #179 **pass**（🔴 0 · 🟡 6 · 🔵 4）+ 修正轮 1 九条落位核验（父侧读回 §2.12 全段）+ 设计 token 在位。
- **口径**：用户批级全点授权下父侧代行批准；**可撤回**（用户任何时点否决 ⇒ 实施止付 ∕ 回滚）。
- **批准范围**：§2 全量（选案 C · 受理即置 · 四清位封闭 · 超时兜底 · AC1–AC7 · 真机条目 ①②③）；生效名单 ∕ 基数口径 ∕ 各判据以 **§2.12 修正轮记录为准**（旧行作废面已单点复述）。
- **父侧裁定（U1–U6 + 修正轮随报 #4）**：U1 维持不扩（chain ∕ auto 同族窗 = 另轮候选；真机见误导再立）· U2 采取消（装配窗 Stop = 取消事实）· U3 接受 · U4 接受 · U5 接受（单点常量 + 注入缝，真机见误报再调）· U6 维持复用「发送失败」措辞族；**自愈分治确认**——「每受理消息恰一枚块」= 消息级不变式，屏蔽已受理消息 = 不诚实 ⇒ **双块 = 如实投影**（不合并 ∕ 不去重 ∕ 不标记）；行清受最新尝试门 ⇒ 接受；行槽残余（旧失败行留至 #2 结算）= 单槽语义 ⇒ 接受。
- **实施条件**：① 与 B8（`turn-driver.mjs` ∕ `IPC.md` 同档）调度串行——#173/#174 先（files 域申报在案）；② `ipc.mjs` = 注释净 ≤+1（§2.12 补记判据：实施轮实读基数 + 本批净 ≤+1）；③ 批内件先落 `.thodincoder/tmp/`（#545 在册）⇒ 父侧转正；④ 文档 4 处 = 码面落定后派（eng-designer）——`PROJECT.md` §4.1 随动按其自定口径（内容行；跨档口径统一另轮）。
- **派发**：单舱（码面 4 档 + 批内件）。

〔勘误（父侧笔）：上条第 ③ 项路径笔误「`.thodincoder/tmp/`」⇒ 生效 = `.thincoder/tmp/`。〕

## §5 实施记录（eng-coder）
**状态行**：实施完成（单舱（代码 4 档 + 批内件 1 档）；0 must-fix；fix 轮 1（审计 DOC-DRIFT 已修）+ 代码评审 pass；开放项 5 条见 §5.3 · 2026-09-29）



### 5.1 交付摘要（#597 · 单舱 · 2026-09-29）

**轮次 = initial**（同 designId 链）；**落点 = 代码 4 档 + 批内件 1 档**（文档 4 处未触——§2.0 ∕ §4④ 定码面落定后另派 eng-designer）；设计 token 门 = 写时核验通过（全部编辑 ∕ 用例落盘通过）。

**designId 回显**：本舱 spawn 载荷未携显式值——写授权经 token 门在写时核验；如需对账请以父侧发放记录为准（凭据值不落档，沿先例 `2026-09-29-stall-indicator.md:217`）。

**逐项改动表（号 → file:line · 实读落点）**：

| # | 档 | 改动点 | 增量 |
|---|---|---|---|
| 1 | `thincoder-desktop/src/main/turn-driver.mjs` | ① 受理即置发射 `:184-186`（`flights.set` `:183` 后、`await ensure` `:192` 前，`post("ev:activity", { key, event: "turn" })` 无帧值）② ensure 抛径非吞形 `:193-196`（`release()` 先；`reason = String(err?.message ?? err)` 原文案）③ 跨中止闸 `:199` ∕ provider 无效 `:202` ∕ 降级窗后查位 `:219` 句内 + `started:false` ④ 装配窗中止新查位 `:221-227`（`controller.signal.aborted` ⇒ `release()` + `cleanupTurn` + `aborted/started:false`；位在窗后查位块后）⑤ `send()` 文档块 `:158-159` 随正 | +9（277 ⇒ 末行 286） |
| 2 | `thincoder-desktop/renderer/composer-wire.mjs` | ① 引 `clearRunning` `:21` ② `SEND_TIMEOUT` `:29` + `runningOf` `:31-33`（node 可装载约束注）③ deps `sendTimeoutMs = 120000` `:42` ④ `inFlight` 表 `:48` ⑤ `sendDirect` 重写 `:63-111`：race `:71-74` ∕ 超时支 `:75-81`（清位（最新 ∧ 位标在场）`:77` + 失败行 `timeout` + 退流）∕ 失败径清位守卫 `:87` ∕ 迟到续延 `:109-110` ⑥ `healLate` `:113-125`（行清受最新门 `:119` ∕ 块补不受门 `:121`）⑦ `sendQueued` 重发登记 `:134` | +53（177 ⇒ 末行 230） |
| 3 | `thincoder-desktop/renderer/badges.mjs` | `clearRunning(state, key)` `:27-30`（`running` 摘除；值等 ⇒ 原引用——零通知） | +7（24 ⇒ 31） |
| 4 | `thincoder-desktop/src/main/ipc.mjs` | `:189-194` `msg:send` 注释 reflow（reason 词表补「装配抛（err 文案原样）」+ `started:false` 键注——归位「受理后失败径」；转口实参形零变 `:195`） | +1（303 ⇒ 304，合 §2.12 补记增量判据「实读基数 + 净 ≤+1」；越档归属 #595 基数账） |
| 5 | `.thincoder/tmp/2026-09-29-send-busy-timing.test.mjs`（批内件 · 初版 326 行） | 13 用例：T1 ∕ T1b 受理即置恰一发 + 忙态 ∕ 窗 ∕ bad-key 三径零发射 ∕ T2–T6 四清位 + 装配窗中止逐径 ∕ T7 失败三例 ∕ T8 超时 ∕ T9 自愈分治 ∕ T10 陈旧守卫 + E4 扩例 ∕ T11 badges ∕ T12 结构核（AC1 链路五跳 + AC5 清位写者账） | 新档（终位 = `docs/batches/2026-09-29-send-busy-timing.test.mjs`，待父侧转正） |

**零触面（§2.12 条 1 生效名单）**：`panel.mjs` ∕ `events.mjs` ∕ `composer-sync.mjs` ∕ `mount-composer.mjs` ∕ `chrome.mjs` ∕ `statusline-segments.mjs` ∕ `turn-face.mjs` ∕ `turn-chain.mjs` 八档现盘内容核（T12 依赖锚对位：`events.mjs:149/158` · `chrome.mjs:68-70` · `panel.mjs:403-404`）；VSC ∕ CLI 全树零写。**零 diff 自证 = 父侧 `git diff`**（本舱无 git 面——限制已披露，见 5.3-③）。

**机检读数**：批内件 13/13 绿；在位件 27/27 绿（`desktop-window-queue-parity` 9 ∕ `desktop-session-title` 6 ∕ `parity-b4-vsc-small` 12——T7 由父侧直落 settle 微补后全绿）；`node --check` 五档绿。

### 5.2 内部审计与代码评审（轮次与终态）

- **内部 explore 偏差审计（只读 · 阻塞）**：**DEVIATIONS 1 条（低 · DOC-DRIFT）** = `ipc.mjs` 注释首版把 `started:false` 键注罩到受理前三径（`bad-key` ∕ `busy` ∕ `queue-full`，实况无该键）⇒ **已修**（`:191-192` 归位「受理后失败径同形外加 `started:false`」）；四类（PARTIAL ∕ SILENT-SIMPLIFICATION ∕ DOC-DRIFT ∕ OUT-OF-LIST）其余零命中。
- **内部 advisor 代码评审（type=code · 同步）**：**VERDICT: pass**（0 🔴 · 🟡×3 非阻断 · 🔵×5）。🟡 = ① 队径（`sendQueued`）未消费 `started:false`（**设计闭集边界继承**——§2.12 条 5 清位调用点闭集 = 渲染面两支；窄可达）② `ipc.mjs` 304 行 >300（本批净 +1 合规；越档归属 #595）③ §2.12 条 9 composer-sync 坐标漂移（`:88 ⇒ :101` ∕ `:128-135 ⇒ :141-148`，另批续拆所致；T12 全 regex ⇒ AC1 机检不受影响）。🔵 = 迟到续延无拒收档（生产不可达 ∕ `call` 契约零拒收）· `runningOf` 第三副本 · 超时误报面（U5 在册）· 批内件墙钟等待 · composer-wire 增量超设计估值（≤300 仍达）。审计 ∕ 评审实读均另注：`composer-wire` 实读末行 230（估 202–207）· `turn-driver` 286（估 285–287 ✓）· `badges` 31（估 33–35）。
- **终态 = converged / clean**：0 must-fix；fix 轮 = 1（审计 DOC-DRIFT 已修并复核）；其余开放项转 5.3。

### 5.3 未决 ∕ 边界诚实项（父侧裁）

1. **队径 `started:false` 边界**（评审 🟡① · 审计同报）：本舱按批准闭集（AC5 = 渲染面两支）未扩动；如需闭合 = 设计微轮（第三清位调用点 + AC5 ∕ T12 计数随动）或明裁登记边界。
2. **批内件终位**：现住 `.thincoder/tmp/`；终位待父侧转正（#545 即时形）。
3. **零 diff 自证限制**：本舱无 git ∕ execute 面——零触面按现盘内容核 + 本舱编辑白名单自证；「逐档 `git diff` 空」请父侧收口复跑。
4. **文档面 4 处**零触待派；`PROJECT.md` §4.1 ∕ §4.2 行数随动请按**实读**定格（286 ∕ 230 ∕ 31 ∕ 304），勿照抄 §2.5 估值。
5. **真机条目**（§2.5 ④）归父侧亲跑（含 U4 受理窗瞬态、U5 超时注入、§2.12 条 8 快速连发观测量）。

**零改面实测**：设计 4 处文档零笔 ∕ 他批射程零触 ∕ 零触面八档代码零笔；本段为实施轮唯一批档写入（§5 追加）。

## §6 验证与收口（父代理）

**收口记录（父代理 · 2026-09-29）**

**波面**：设计（案 C 受理即置 + 四清位 + 超时 120s 兜底）→ 评审 pass → 修正轮九条全落 → §4 → 实施舱（#181）：E1 提交即切（受理单点 `turn-driver.mjs:186`——`flights.set` 后 ∕ `await ensure` 前，无帧值 `{event:"turn"}`）· E2 四清位全携 `started:false` + 渲染面 `clearRunning` 最新尝试守卫 + 超时兜底并入 · E3 装配窗 Stop ⇒ 取消（`:221-227`）· E4 `Promise.race` 先到者 + 迟到自愈分治（行清受最新门 ∕ 块补不受门 ∕ 队形零块补）· E5 `running` 置位全树唯一 ∕ 清位单点（调用点闭集恰 2）。

**验证（父侧亲读）**：批内件 `docs/batches/2026-09-29-send-busy-timing.test.mjs`（已转正）**13/13** + 在位件三档 27/27 = **40/40**（含 T7 settle 微补——父侧直落 `:292-294`）；`node --check` 五档绿；审计 1 条 DOC-DRIFT（已修）· 代码评审 **pass**（0🔴）；8 档禁止面内容核（改动前快照 sha256 对照）逐字节一致 ✓；**not repo-suite verified**（父侧收口轮为唯一套件口径）。

**真机读数（父侧探针 · 探针件 = `.thincoder/tmp/send-busy-probe.mjs`）**：hang 桩 + 隔离家（fsPath 键探针）：**点发送 → 忙态按钮翻转 = 57ms**（受理即置实锤——不等模型起跑）；失败径（provider 未配）= 可见提示「Send failed (provider-invalid) — the text was kept」+ 文本保留 + 按钮清回 ✓。

**边界（登记 · 不阻塞）**：队径 `started:false` 未消费（双评审同报——按批准闭集 AC5 未扩动；**父侧明裁：登记边界，真机若见再立微轮**）；U5 超时误报面（宿主已受理而回执迟于 120s ⇒ 清位后待模型环首帧自愈——真机可观测）；U4 瞬态 ∕ §2.12 条 8 快速连发= 走查观测量。

**需求面**：D3 补「**发送忙态即时**」（提交即切忙态——受理即置；超时兜底清位）+ 变更记录（父侧直执行 · 已落）。

**结算（D7）**：**#597 → 已核销**；#596 并入 #597（已销）。**状态行**：已收口 2026-09-29。
