# 2026-10-04 · 流尾台账行组退役（会话流末台账提醒——状态行与 L2 明细保留）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-04 · 来源 = 用户 2026-10-04 14:24 原话「会话流最后的那条台账提醒干脆去掉吧，因为它也不更新，老是那些，还说「属主已死」，感觉像说我死了似的，反正状态行里已经有台账计数了，这个就去掉吧」+ 父侧定位（流尾台账行组——桌面 `[data-ledger-line]` ∥ VSC `ledgerNotice` 行；CLI 实读无线面）。
> 台账 = #913（requirement——升级为批）。前情 = 无（独立批——承「对齐第三批」项 12 落形面，记录面零触）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-04
**开批登记（2026-10-04 14:3x · 主 agent）**：**来源** = 用户 14:24 原话（「会话流最后的那条台账提醒干脆去掉吧，因为它也不更新，老是那些，还说「属主已死」，感觉像说我死了似的，反正状态行里已经有台账计数了，这个就去掉吧」）。**条目** = **流尾台账行组退役**（桌面 `[data-ledger]` 组 ∥ VSC `ledgerNotice` 行——同一机制，载体 = 核 `flow/ledger-line.mjs`）。**父侧定位**：桌面 `views/chat-chrome.mjs`（`ledgerGroupNode` :69-77 ∥ `syncLedger` :126-133 ∥ 锚查询 :221/:229/:236 ∥ `ledgerAnchorOf` :241）+ `chat-tree.mjs:140` + `chat-model.mjs`（:41 ∥ `ledgerOf` :99-104）+ `events-slices.mjs`（`onLedger` `lines` 支 :141-146）+ `frame-dispatch.mjs`（`CHAT_KEYS`）∥ 主机侧 `project-info.mjs`（出站载荷 `lines` 键）+ `ipc.mjs` 注；VSC `webview/ledger-line.js`（整档）+ `chat-messages.js:28/:135-136` + `src/extension/ledger-surface.mjs:98`；CLI 实读无流线面。行文含「（属主已死 N，可接手）」（`ledger-executors.mjs:99`）。**保留面（零触）**：状态行段 11 标记（`marker`——「反正状态行里已经有台账计数了」）∥ L2 明细 hover（`detailLines`）∥ 会话下拉首行「会话账本异常」注记（`data-ledger-notice`——另一面）∥ CLI L1 标记。**授权口径** = 全链（设计 → 评审 → 批准 → 实施——用户 12:18「都自动跑吧」授权在效）。**边界** = 去面非改词（「属主已死」词面现存承载面 = L2 明细——保持；改词 = 另裁候选，上抛登记）∥ 零新语义 ∥ 需求档零触（主 agent 域）。

- **父侧更正（2026-10-04 14:5x · 设计轮实读判定）**：开批登记所书「CLI 实读无流线面」**有误**——实读：CLI 有**一次性行推线面**（`thincoder-cli/src/tui/index.mjs:246` `startLedgerSurface({ … pushLine … })` ∥ 核 `thincoder-core/ledger-surface.mjs:33-39` 启动行（明细行集）+ 变化行——滚动入场、**非常驻尾组**；设计档 = `docs/core/design/LEDGER.md:364`）。**去面范围据此确认（不含 CLI）**：① 去 = 桌面流尾组 ∥ VSC 通知行（+ 主机出站 `lines` 键 ∥ 核行产孤儿面）；② **CLI 零触**——其一次性行 = CLI 的 L2 明细承载面（CLI 无悬停面；去之砍唯一明细可见性）；③ 登记两条：**CLI 行推线面漏登**（父侧开批登记之误，此后以本注为准）∥ **跨端形态差留存**（CLI 留一次性行 × 桌面/VSC 去常驻行——形态差非同名面差）。

- **用户直裁（2026-10-04 14:38——覆盖前注之「不含 CLI」）**：原话「cli端也有同类提示，也一起去掉。」⇒ **去面含 CLI**。**最终去面范围**：① 桌面流尾组（`[data-ledger]`）∥ ② VSC 通知行（`ledgerNotice`）∥ ③ **CLI 行推线面**（`thincoder-cli/src/tui/index.mjs:246` `pushLine` 链 + CLI 胶水）∥ ④ 核 `lines` 出站面（`thincoder-core/ledger-surface.mjs` 启动行/变化行列集——三端消费尽去 ⇒ 全端孤儿 ⇒ 零残留深清）。**保留面**：三端 L1 标记/计数（CLI 状态簇台账计数 = 用户「状态行里已经有台账计数了」所指——保留）∥ 桌面/VSC L2 悬停/明细 ∥ 会话下拉注记（`data-ledger-notice`——另一面）∥ `executorTail`（「属主已死」词面——去面非改词）。**在册（明记）**：CLI 端 L2 明细面随行推线消失（此后仅计数——用户直裁）；CLI 行推线面漏登（父侧开批登记之误，前注已正）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（修正轮（评审 #40 · 父裁 = 全采纳）逐号 1..10 落定 + 逐处读回；doc-check RC=0（锚 0 悬空 ∥ 行宽全绿） · 2026-10-04）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.0 轮次与父裁（2026-10-04）
- **轮次** = initial（设计轮）。授权 = 全链（用户 12:18「都自动跑吧」在效）。
- **父裁回执（本刻）**：**不含 CLI**（零触）——判由 = 用户裁所指 = **常驻流尾组**（「会话流最后的那条……老是不更新」）形态，CLI 行推线面 = 一次性滚动（启动行/变化行），非该形态；CLI 无悬停面 ⇒ 其一次性行 = CLI 唯一明细可见性（去之超用户本意）；CLI 状态行标记（保留面）在场 ✓。
- **落实**：① 去面 = 桌面流尾组 ∥ VSC 通知行（+ 主机出站 `lines` 键 ∥ 核行产孤儿面）；② 「CLI 行推线面漏登」+ 跨端形态差 ⇒ 上抛登记两条（见 2.9-①②；父侧另笔更正 §1）；③ CLI 零触（`tui/index.mjs:246` ∥ 核 `ledger-surface.mjs` `pushLine` 链保持——**核 `lines` 机制不判孤儿**）。

### 2.1 本批条目（覆盖 ∥ 明确不含）
**覆盖（1 条）**：
| # | 条目 | 来源 | 判据（机检 ∥ 真机） |
|---|---|---|---|
| 1 | **流尾台账行组退役**（桌面 `[data-ledger]` 组 ∥ VSC `ledgerNotice` 行——同一机制，去面非改词） | 用户 2026-10-04 14:24 原话；台账 #913 | 桌面：`[data-ledger]`/`[data-ledger-line]` 与 `ledgerLines` 链零在场（源面锁 + 归约/模型/构树/帧刷用例）；VSC：`ledgerNotice` 消息名与消费面零在场；保留面（段 11 标记 ∥ L2 明细 ∥ 会话下拉注记 ∥ CLI）零改（对照读 + 源面锁） |
**明确不含（划定）**：① 「属主已死」词面改词（去面非改词——父侧边界；改词 = 另裁候选 ⇒ 上抛 2.9-②）；② CLI 台账面（零触）；③ 核 `ledger-surface.mjs` ∥ `ledger.mjs` ∥ notify/去重档机制（保留——CLI `pushLine` 链为活消费面）；④ 会话下拉「账本异常」注记（`data-ledger-notice`——另一面）；⑤ `flow` 家族其余面。

### 2.2 机制与逐面退役清单（去 ∥ 留）
**机制链**：核拍面 `runLedgerScan`（`thincoder-core/ledger-surface.mjs:21-56`）经 `pushLine` 缝出行集（启动行 ∥ 变化行）；两端消费两条显示链——桌面 = `project-info.mjs` `pushLedgerLines` 拍尾出站 `ev:ledger` `lines` 键 ⇒ 归约切片 `ledgerLines` ⇒ 流尾非块组 `[data-ledger]`；VSC = `ledger-surface.mjs` `pushLine` ⇒ webview 消息 `ledgerNotice` ⇒ 流内追加行。**去面 = 两条显示链 + 出站键 + 端臂孤儿**；核行产与 `pushLine` 缝**保持**（CLI 消费面——父裁）。

**去面（5 组）**：
1. **桌面渲染链**：`renderer/views/chat-chrome.mjs`（`ledgerGroupNode` ∥ `syncLedger` ∥ `ledgerAnchorOf` ∥ 锚链 `[data-ledger]` 串）＋ `views/chat-tree.mjs`（组挂入 ∥ import）＋ `views/chat-model.mjs`（model 键 `ledger` ∥ `ledgerOf`）＋ `renderer/events-slices.mjs`（`onLedger` `lines` 支）＋ `frame-dispatch.mjs`（`CHAT_KEYS` 键）＋ 注释随动（`chat.mjs` ∥ `chat-tool.mjs` ∥ `compress-status.mjs` ∥ `events-subscribe.mjs`）。
2. **桌面主机出站链**：`src/main/project-info.mjs` 出站载荷 `lines` 键（含 `pending` 缓冲 ∥ `LINE_COLORS` ∥ `pushLine`/`colors` 注入面）；`ipc.mjs` 注释随动（`setLedgerEmit` 调用点零改——`ev:ledger` 仍出站 `detailLines`/`marker`）。
3. **VSC 链**：`webview/ledger-line.js`（整档）＋ `webview/chat-messages.js`（import ∥ `ledgerNotice` case）＋ `src/extension/ledger-surface.mjs`（`pushLine` 缝 ∥ `pushLedgerStartup` 面）＋ `src/extension/panel-messages.mjs`（启动行调用点）。
4. **核行产孤儿**：`thincoder-render-core/flow/ledger-line.mjs`（全仓消费面实读 = 仅 VSC shim 一档 ⇒ 去面后成孤儿）。`API-CONTRACT.md` 生成区行随重生成消失。
5. **样式面**：桌面 `renderer/core.css:330-331`（`.ledger-line`/`.ledger-line.warn` 核类名映射——其唯一宿主随去面消失）∥ `renderer/chat-fixes.css:43-45`（`.chat-ledger`）∥ VSC `webview/chat.css:476-488`（`.ledger-line` 两规则）。

**保留面（零触 · 逐处核读自证）**：
- **状态行段 11 标记（`marker`）**：`views/statusline-segments.mjs:181-195`（`ledgerSegment`——`marker.text` 非空串 ⇒ 在场；`warn` 核判位）∥ `views/statusline.mjs:83/:192-193` ∥ `mount-status.mjs:27-29`（`ledgerDetail`/`ledgerMarker` 键）∥ `events-slices.mjs` `onLedger` `marker` 支 + `markerReading`（:115-121 ∥ :154-160）∥ `project-info.mjs` `ledgerMarkerOf`/`sameLedgerMarker`（:64-76）。
- **L2 明细 hover（`detailLines`）**：`project-info.mjs` `ledgerDetailLines`（:87-102）∥ `events-slices.mjs` `detailLines` 支（:147-152）∥ 段 11 `title` 载波（`ledgerSegment`）。
- **会话下拉「账本异常」注记（`data-ledger-notice`——另一面）**：桌面 `views/session-control.mjs:70/:95/:220-224` ∥ `mount-sessions.mjs:111-119` ∥ `session-wire.mjs:48` ∥ `store.mjs:55/:81`（注记切片 `ledger`）∥ `frame-dispatch.mjs` `SESSION_KEYS`；VSC `webview/session-bar.js:33-44/:94-98` ∥ `panel-session.mjs:257-265` ∥ `chat-messages.js:138-142`（`sessions` case 增字段）。
- **CLI 台账面（零触）**：`tui/render-frame.mjs:442-459`（L1 标记）∥ `tui/index.mjs:246`（`startLedgerSurface({state, agent, pushLine, render})`——行推线链保持）∥ `tui/ledger-surface.mjs:33-53`（转口）∥ 核 `ledger-surface.mjs`/`ledger.mjs`/`ledger-executors.mjs` 零改。
- **词面（零触）**：`（属主已死 N，可接手）` 单源 = `thincoder-core/ledger-executors.mjs:99`——去流线后承载面 = L2 明细（`formatDetailLine` 尾段）——保持。
- **桌面 `store.mjs` ∥ `page-read.mjs` 核读 = 零触**：`store.mjs:55/:81` 的 `ledger` = 会话注记切片（非流线表）；`page-read.mjs` 清点族本无 `ledgerLines`（实读零命中）——无随动。

### 2.3 落点（逐处 · file:line → 动作）
**桌面（thincoder-desktop/）**：
| # | 落点 | 动作 |
|---|---|---|
| 1 | `renderer/views/chat-chrome.mjs` | 删 `ledgerGroupNode`（:69-81）· 删 `syncLedger`（:124-137）· 删 `ledgerAnchorOf`（:240-244）· `syncChrome` 调行删（:191）· 锚链摘 `[data-ledger]` 串三处（`blockAnchor` :221 ∥ `timerAnchorOf` :229 ∥ `stoppedAnchorOf` :236——链合流，逐字回读）· 注释随动（:6 ∥ :8 ∥ :113-114 ∥ :167-169 ∥ :213-218 ∥ :225-226 ∥ :233 ∥ :246） |
| 2 | `renderer/views/chat-tree.mjs` | import 去 `ledgerGroupNode`（:26）· 组挂入删（:139-140）· 注释随动（:125 ∥ :137 ∥ :141） |
| 3 | `renderer/views/chat-model.mjs` | model 键 `ledger` 删（:39-41）· `ledgerOf` 删（:99-107）· 档头注释随动（:5） |
| 4 | `renderer/views/chat.mjs` | 注释随动（:39 ∥ :43——`ledger` 键名面清） |
| 5 | `renderer/views/chat-tool.mjs` | 注释随动（:204——`_ledgerLines` 判例引用改述，零语义） |
| 6 | `renderer/views/compress-status.mjs` | `compressAnchorOf` 摘 `[data-ledger]` 串（:73）· 注释随动（:69） |
| 7 | `renderer/events-slices.mjs` | `onLedger` `lines` 支删（:133-146）· 注释随动（:9 ∥ :123-131——消费面句去流线） |
| 8 | `renderer/events-subscribe.mjs` | 注释随动（:26——`ev:ledger` 词面：台账行集 ⇒ 台账明细 ∕ 状态位） |
| 9 | `renderer/frame-dispatch.mjs` | `CHAT_KEYS` 去 `"ledgerLines"`（:24）· 注释随动（:20-21） |
| 10 | `renderer/chat-fixes.css` | `.chat-ledger` 块删（:43-45）· 帮助行族注释摘「台账行组后」（:47） |
| 11 | `renderer/core.css` | `.ledger-line`/`.ledger-line.warn` 两规则删（:330-331）· 注释段收正（:325-329——留 file-link 族，两族 ⇒ 一族） |
| 12 | `src/main/project-info.mjs` | `pending` 缓冲删（:123 ∥ :132 ∥ :140）· `LINE_COLORS` 删（:58-59）· `payload.lines` 面删（:140 ∥ :152 判句）· `pushLine`/`colors` 注入删（:162-163）· 注释随动（:16-25 ∥ :109-110 ∥ :127 ∥ :137 ∥ :153）——**`ledgerDetailLines`/`ledgerMarkerOf`/`sameLedgerMarker`/`stopLedgerRefresh` 零改** |
| 13 | `src/main/ipc.mjs` | 注释随动（:14-16 ∥ :63-67 ∥ :160-164）——**调用点 :162-164 零改**（`ev:ledger` 仍出站） |
**VSC（thincoder-vscode/）**：
| 14 | `webview/ledger-line.js` | **整档删**（13 行） |
| 15 | `webview/chat-messages.js` | import 删（:28）· `ledgerNotice` case 删（:135-136） |
| 16 | `src/extension/ledger-surface.mjs` | `pushLine` 缝删（:97-99）· `pushLedgerStartup` 删（:117-120）· `runScan` 形收正（:86-91——去 `startup` 参；`refreshLedger` 调用面 :113 随动）· 档头注释收正（:1-19） |
| 17 | `src/extension/panel-messages.mjs` | import 删（:39-40）· 启动行调用点删（:359） |
| 18 | `webview/chat.css` | `.ledger-line` 两规则删（:476-488） |
**核**：
| 19 | `thincoder-render-core/flow/ledger-line.mjs` | **整档删**（13 行——孤儿：消费面实读 = 仅 VSC shim 一档） |

### 2.4 受影响文件表（as-of 2026-10-04 · 行数实读 = 原始行数口径 · Δ 为设计预估；实施后按 as-built 复读）
**代码面**：
| 文件 | as-of | Δ预估 | 说明 |
|---|---|---|---|
| `thincoder-desktop/renderer/views/chat-chrome.mjs` | 250 | ≈ −33 | 三函数（含注）+ 调行删；锚链三处摘串（行数不变）；余注释随动 |
| `thincoder-desktop/renderer/views/chat-tree.mjs` | 147 | ≈ −2 | 挂入删 + import/注随动 |
| `thincoder-desktop/renderer/views/chat-model.mjs` | 117 | ≈ −12 | `ledgerOf` 整函数 + 键行删 |
| `thincoder-desktop/renderer/views/chat.mjs` | 205 | 0 | 注释随动 |
| `thincoder-desktop/renderer/views/chat-tool.mjs` | 300 | 0 | 注释随动（软线在册） |
| `thincoder-desktop/renderer/views/compress-status.mjs` | 75 | 0 | 链摘串 + 注 |
| `thincoder-desktop/renderer/events-slices.mjs` | 162 | ≈ −14 | `lines` 支整删 |
| `thincoder-desktop/renderer/events-subscribe.mjs` | 101 | 0 | 注释随动 |
| `thincoder-desktop/renderer/frame-dispatch.mjs` | 53 | 0 | 键表摘键（逐字） |
| `thincoder-desktop/renderer/chat-fixes.css` | 124 | ≈ −3 | `.chat-ledger` 块删 |
| `thincoder-desktop/renderer/core.css` | 338 | ≈ −4 | 两规则删 + 注收正 |
| `thincoder-desktop/src/main/project-info.mjs` | 181 | ≈ −8 | `lines` 单链删尽；保留面零改 |
| `thincoder-desktop/src/main/ipc.mjs` | 299 | ≈ −1 | 注释随动（软线在册） |
| `thincoder-vscode/webview/ledger-line.js` | 13 | **−13（删档）** | 孤儿 |
| `thincoder-vscode/webview/chat-messages.js` | 270 | ≈ −3 | import + case 删 |
| `thincoder-vscode/src/extension/ledger-surface.mjs` | 142 | ≈ −12 | `pushLine`/`pushLedgerStartup` 面删 |
| `thincoder-vscode/src/extension/panel-messages.mjs` | 382 | ≈ −3 | import + 调用点删 |
| `thincoder-vscode/webview/chat.css` | 511 | ≈ −14 | 两规则删（**回线**：→ ≈497，低于 500 硬限） |
| `thincoder-render-core/flow/ledger-line.mjs` | 13 | **−13（删档）** | 孤儿 |
| `thincoder-core/ledger-surface.mjs` ∥ `ledger.mjs` ∥ `ledger-executors.mjs` | 85 ∥ 248 ∥ 104 | **0** | 保留（CLI 链——父裁「不判孤儿」） |
**设计档面（本轮执行 · 2.3 同源）**：
| 档 | as-of | 动作 |
|---|---|---|
| `docs/desktop/design/IPC.md` | 534 | §1 `ev:ledger` 行收正（:30——载荷去 `lines`、消费句去流线）· 载荷键集行（:81）· 变更记录 +1 行 |
| `docs/desktop/design/RENDERER.md` | 545 | §1.1 三处（:126 ∥ :129 ∥ :140——族序 ∥ 根子序 ∥ 帮助行族条）· 变更记录 +1 行 |
| `docs/desktop/design/CHAT.md` | 249 | §2 项 12（:50-52）删 · 变更记录 +1 行 |
| `docs/desktop/design/UI.md` | 812 | §1 对话流行摘「台账行」（:27）· :314 枚举摘「核台账行产」· 变更记录 +1 行 |
| `docs/vsc/design/WEBVIEW.md` | 858 | §3 其余行摘 `ledger-line.js`（:68）· R2 迁核注（:73）· 变更记录 +1 行 |
| `docs/vsc/design/WEBVIEW-PROTOCOL.md` | 740 | §12 表 `ledgerNotice` 行删（:424）+ 计数随动 · 变更记录 +1 行 |
| `docs/render-core/design/RENDER-CORE.md` | 558 | §3 行 19（:105）+ 计数（:139）+ §6 行（:361）· 变更记录 +1 行 |
| `docs/core/design/LEDGER.md` | 518 | §7.4 对端挂载句收正（:364——去 VSC webview `ledgerNotice`/启动行投递门）· 变更记录 +1 行 |
| `docs/core/design/API-CONTRACT.md` | — | 生成区重跑 `node scripts/api-contract.mjs --write`（`renderLedgerLine` 行随删） |
| 批内件 `docs/batches/2026-10-04-stream-ledger-lines-retire.test.mjs` | 新档 | 用例见 2.5（实施轮写 + 跑；先红后绿） |
**收口笔面（实施后 as-built 回填——归 §5/§6）**：各设计档文件账行数表（`UI.md` §4.1/§4.2 ∥ `RENDERER.md` §5.1/§5.2 ∥ `CHAT.md` §3.1/§3.2 ∥ `IPC.md` §3.1 ∥ `RENDER-CORE.md` 涉行 ∥ `WEBVIEW.md` 档内表）——逐档复读后随拍。

### 2.5 用例设计（批内件 —— 正常 ∥ 边界 ∥ 错误；先红后绿）
`docs/batches/2026-10-04-stream-ledger-lines-retire.test.mjs`（≈200 行；node --test；平件加载面沿批内件先例）：
| # | 用例 | 输入 | 期望 |
|---|---|---|---|
| T1 | 桌面归约：`lines` 载荷零写 | `onLedger(state, { key, lines: [{text:"台账变化：…",warn:true}], detailLines: ["L2"], marker: null })` | 状态零 `ledgerLines` 键；`ledgerDetail`/`ledgerMarker` 照写（marker null = 清残影） |
| T2 | 桌面归约：保留面回归 | `detailLines` 同值零写 ∥ 换代写 ∥ `marker` 写/清/形不合零写 | 与去面前语义逐条同（防误伤） |
| T3 | 桌面模型 ∥ 键表 | `chatModel(state)`（喂 `ledgerLines` 状切片）∥ `CHAT_KEYS` ∥ `SESSION_KEYS` | model 无 `ledger` 键（或恒 `undefined`）；`CHAT_KEYS` 无 `"ledgerLines"`；`SESSION_KEYS` 含 `"ledger"`（注记保留） |
| T4 | 桌面构树 ∥ 帧刷 | `chatTree(model)` + `syncChrome`（假 DOM：含停止痕 ∥ 帮助行族 ∥ 卡） | 零 `[data-ledger]`/`[data-ledger-line]` 节点；帧刷后零命中；**锚链顺链**：`blockAnchor`/`timerAnchorOf`/`stoppedAnchorOf`/`compressAnchorOf` 退化为次锚（构造各族在场件，逐链断言落的节点） |
| T5 | 桌面源面锁 | 读 `chat-chrome.mjs`/`chat-tree.mjs`/`chat-model.mjs`/`events-slices.mjs`/`frame-dispatch.mjs`/`compress-status.mjs` 源文本 | 零 `data-ledger"`/`syncLedger`/`ledgerGroupNode`/`ledgerOf`/`ledgerLines`/`ledgerAnchorOf` |
| T6 | 主机出站：载荷零 `lines` | `pushLedgerLines`（假 post 捕获；假核拍面注入） | 出站 `ev:ledger` 载荷无 `lines` 键；`detailLines`/`marker` 键照出；源面零 `LINE_COLORS`/`pending` |
| T7 | VSC 源面 ∥ 档存 | 读 `chat-messages.js`/`ledger-surface.mjs`/`panel-messages.mjs` 源文本 + fs 探测 | 零 `ledgerNotice`（消息名）∥ 零 `pushLine`/`pushLedgerStartup`；`webview/ledger-line.js` 不存在 |
| T8 | 孤儿终检（表征扫描） | 全 live 源码树扫描（排除 `docs/**` 记录面 ∥ `.thincoder/tmp` ∥ dist） | `renderLedgerLine` ∥ `addLedgerNotice` ∥ `data-ledger-line` ∥ `ledgerLines` 零命中；`ledgerNotice` 仅余保留面形（`session.ledgerNotice` i18n 键族——VSC locales/协议键表） |
| T9 | 样式面 | 读 `core.css`/`chat-fixes.css`/`chat.css` 源文本 | 零 `.chat-ledger`/`.ledger-line` 规则 |
| T10 | 词面零触 | 读 `ledger-executors.mjs` + grep 全树 | `（属主已死 ` 单源仍在（:99）；本批未改词面 |

### 2.6 验收对照（回指 #913 ∥ 用户原话）
| # | 验收 | 判据 | 回指 |
|---|---|---|---|
| AC-1 | 桌面流尾台账提醒零在场 | T1/T3/T4/T5 全绿 + 真机（父侧目视：开项目 ⇒ 流内无台账行组；帧刷/周期拍后仍零） | 用户 14:24「会话流最后的那条台账提醒……去掉吧」 |
| AC-2 | VSC 台账通知行零在场 | T7/T8 全绿 + 真机（面板重载后流内零台账行） | 同上一机制面 |
| AC-3 | 状态行台账计数保留 | T2/T3 保留面回归 + 真机（段 11 `台账 N·M` 常驻 ⊥ warn 位） | 用户「反正状态行里已经有台账计数了」 |
| AC-4 | L2 明细 hover 保留 | T2 全绿 + 真机（段 11 tooltip 现明细行集，含判活尾段） | 父侧保留面清单 |
| AC-5 | 词面零触 | T10 全绿 | 父侧边界（去面非改词） |
| AC-6 | CLI 零触 | T8 排除面核 + 源面零改（`git diff` 面零命中 CLI/核） | 父裁（本刻） |
| AC-7 | 机检 | `node scripts/doc-check.mjs`（--root 仓根）exit 0（锚 ∥ 行宽）；`node scripts/api-contract.mjs --check` 零漂移 | 项目机检纪律 |
| AC-8 | 三链同源 | 台账 #913 = §2.1 = 2.6 表 | D1/D7 |

### 2.7 关键决策（KD）
- **KD-1（键面择由）**：`ev:ledger` `lines` 键与 VSC `ledgerNotice` 消息名 **退役**（不保惰性键）。理由 = 零残留纪律（消费面三端核毕：桌面 = 本批去 ∥ VSC = 本批去 ∥ CLI 不消费 `ev:ledger`——键面零消费）；保惰性键 = 永挂死键 + 强迫全链路终身静默容忍（禁假造纪律负担）。**被否**：保惰性键（对旧快照/回放无害论——桌面无旧包矩阵，收益为零）。
- **KD-2（核面零改）**：`thincoder-core/ledger-surface.mjs`/`ledger.mjs`/`ledger-executors.mjs` 零改——CLI `pushLine` 链为活消费面（父裁「核 `lines` 机制不判孤儿」）；后果注记 = 2.9-③。
- **KD-3（锚链顺链形）**：三处 `[data-ledger]` 串**摘除合流**（`??` 链余项自然顺位），`ledgerAnchorOf` 整函数删；不重排族序 ∥ 不动 `helpAnchorOf`/`cardAnchor`。理由 = 最小键面差；族序不变式（压缩行 → 消化行族 → 到期触发 → 停止痕 → 帮助行族 → 卡）逐条保持。
- **KD-4（孤儿判定）**：`flow/ledger-line.mjs` ∥ VSC `webview/ledger-line.js` 删——全仓消费面实读（`renderLedgerLine`/`addLedgerNotice` 唯一调用方 = 互相 + `chat-messages.js` case）；`API-CONTRACT` 生成区随重跑。**边界**：`flow` 家族其余面零触。
- **KD-5（样式退役落点）**：桌面 `.ledger-line`/`.chat-ledger` ∥ VSC `.ledger-line` 规则删尽——其唯一宿主 = 去面本体；不保留「以备复用」（角色无他宿主）。注释段收正（core.css 两族 ⇒ file-link 一族）。**被否**：样式留存（死规则 = 残迹演示）。
- **KD-6（VSC `runScan` 形）**：去 `startup`/`colors`/`pushLine` 后 `runScan(panel)` 归一；`_setLedgerSurfaceForTest`（cwd ∥ notifyFile 缝）保留（非去面）。`initLedgerSurface`/`refreshLedger`（emit 两径）/`dispose` 零改。

### 2.8 边界（不做）
- 不改「属主已死」词面；不触保留面四组（marker ∥ detailLines ∥ `data-ledger-notice` ∥ CLI）；不引新机制/通道/键/切片；不触需求档（主 agent 域）；不触 `flow` 家族其余面；不触他批面；不做扩改（去面之外零语义）。
- 不做（本批）：`notify` 去重档机制 ∥ 核 `pushLine` 缝 ∥ CLI 显示形 ∥ 旧快照/回放矩阵（桌面无旧包兼容面）。

### 2.9 上抛与披露（逐条）
1. **CLI 行推线面漏登（前提更正）**：父侧已知事实「CLI 实读无流线面」与实读相抵——`tui/index.mjs:246` `startLedgerSurface({state, agent, pushLine, render})` 经核 `pushLine` 出行（启动行/变化行）；`LEDGER.md:364`「CLI 挂载（…启动行门…）」在册。父裁 = 保持 + 登记（父侧另笔更正 §1）。证据 = 2.0/2.2。
2. **跨端形态差（去面后成立，登记待裁）**：桌面/VSC 去（常驻组 ∥ 追加行）∥ CLI 留（一次性滚动打印）——同机制两形。用户原话未点名 CLI ⇒ 按父裁保留；后续如需全端同形 = 另批。
3. **notify 送达门语义注记（报告项）**：去面后桌面臂 `pushLine` 断供 ⇒ 核默认 no-op ⇒ `delivered` 恒真——与去面前桌面语义**同值**（桌面 `pushLine` 本不抛；仅 VSC 臂原「推送失败不记账」门随摘除失效）；影响 = 变化行记账在窄竞态窗内可由「无显示端」先行 ⇒ CLI 变化行（保面）可被抑制（瞬态事件行面；启动行/明细行不走去重门，零影响）。核/CLI 面零动（父裁）；修法候选（核侧显式 emit 形 ∥ VSC 保抛缝）= 另裁，登记。
4. **并发触点（落序建议）**：`chat-chrome.mjs:219-223`（`blockAnchor`）∥ `RENDERER.md` §1.1（:76/:79 区）= digest-reentry 批（#910）在飞面；本批改动行区（:221/:229/:236/:241 ∥ §1.1 :126/:129/:140）与之不叠——**实施面串行建议：后落者按内容重基**（行号漂移纪律在册）。
5. **VSC 注释旧号**：源码注释引「§2.30.3.5」为旧 TUI 编号（活文档无此节）——随本批触点改写，不留旧号。
6. **`（属主已死）` 改词候选**：用户情绪面（「感觉像说我死了似的」）∥ 现承载 = L2 明细 ——词面改述 = 另裁候选（本批零触）。
7. **API-CONTRACT 重生成**：实施轮跑 `node scripts/api-contract.mjs --write`（生成区唯一笔）。

### 2.10 修正块（父裁覆盖——**去面含 CLI** · 2026-10-04 14:4x）
- **覆盖口径**（用户 14:38 直裁「cli端也有同类提示，也一起去掉。」在上）：2.0 起「不含 CLI」诸句随本块更新——**去面 = 桌面流尾组 ∥ VSC 通知行 ∥ CLI 行推线面**；核 `lines` 出站面**全端孤儿 ⇒ 零残留深清**；保留面 = 三端 L1 标记/计数 ∥ 桌面/VSC L2 悬停/明细 ∥ 会话注记（`data-ledger-notice`）。
- **CLI 去面落点（新增）**：
  1. `thincoder-cli/src/tui/index.mjs:246`——`startLedgerSurface({ state, agent, pushLine, render })` ⇒ `{ state, agent, render }`（去 `pushLine`）；:245 注释随动（旧号 §2.30.3.4 去）。
  2. `thincoder-cli/src/tui/ledger-surface.mjs`——去两处 `colors: C` 注入（`:35` ∥ `:45`）；`import { C }` 删；档头注释收正（转口余件 = 动态 import；「三面语义」句去行面）。
  3. CLI L1 标记（`render-frame.mjs:442-459`）与 `state.ledger` 消费**零改**（用户裁：CLI 此后仅计数）。
- **核深清落点（覆盖 2.7 KD-2「核面零改」）**：
  4. `thincoder-core/ledger-surface.mjs`——`runLedgerScan` 去 `pushLine`/`colors`/`startup`/`notifyFile` 缝与行集（启动行/变化行）生产 ∥ notify 读/写 ∥ 送达门 ∥ `detailScans`/`formatDetailLine` 行面；余 = 族扫描 → 判活 → `scopeMarkerOf` → `state.ledger` → `render()`；`startLedgerSurface` tick 壳随收（`startup` 径去——首拍 `setImmediate` + 周期照旧）；档头注释收正。
  5. `thincoder-core/ledger.mjs`——孤儿导出删：`planChangeLines` ∥ `formatAgingLine` ∥ `formatThresholdLine` ∥ `notifyKey` ∥ `loadNotifyState` ∥ `saveNotifyState` ∥ `NOTIFY_FILE`；imports 逐名核读后收（`configDir` ∥ `readFileSync` ∥ `writeFileSync` ∥ `renameSync` ∥ `mkdirSync` ∥ `dirname` ∥ `join` 等——余用留）。**保留**：`buildScan`/`discoverFamily`/`detailScans`/`formatDetailLine`/`formatMarker`/`scopeMarkerOf`/`resolveExecutorStates`/`executorTail`/`REFRESH_MS`/命令族（L1/L2 面全留）。
  6. `thincoder-vscode/src/extension/ledger-surface.mjs`（加深 2.3-16）——除 `pushLine`/`pushLedgerStartup` 外：**核 surface 调用整摘**（`runScan` 的冗余核扫 + `_state` 无读者 + `render` 间接触发器 ⇒ 直落 `scanFamily` → `updateItem`）；`refreshLedger` `emit` 参数收（两径归一）；`_setLedgerSurfaceForTest` `notifyFile` 键去（`cwd` 缝留）；`panel-project.mjs:82` 调用面随动（去 `{ emit: false }`）。
- **2.9 条随覆盖**：③「notify 送达门」条降为**史实记录**（送达门随深清整面退场——「窄竞态抑制」问题不复存在）；① 条并入在册 (a)；④ 并发触点条维持（RENDERER.md ∥ chat-chrome.mjs 与 #910 批落序建议不变）。
- **登记两条（替代「跨端形态差留存」）**：(a) **CLI 行推线面漏登**（父侧开批登记之误——§1 已更正）；(b) **CLI 端 L2 明细面随行推线消失**（用户直裁——CLI 此后仅计数；明记在册，CLI 无悬停面）。
- **受影响表增补（as-of 2026-10-04 ∥ Δ 预估）**：`thincoder-cli/src/tui/index.mjs`（264，≈0——单参摘除）∥ `thincoder-cli/src/tui/ledger-surface.mjs`（53，≈ −8）∥ `thincoder-core/ledger-surface.mjs`（85 ⇒ ≈45）∥ `thincoder-core/ledger.mjs`（248 ⇒ ≈185）∥ `thincoder-vscode/src/extension/ledger-surface.mjs`（142 ⇒ ≈105）∥ `thincoder-vscode/src/extension/panel-project.mjs`（≈ −1）∥ 设计档 +`docs/core/design/LEDGER.md`（§2.1 ∥ §7.3 ∥ §7.3.1 ∥ §7.4 ∥ §7.8 逐处）∥ +`docs/cli/design/TUI-COMMANDS.md`（:25 行）∥ `API-CONTRACT.md` 重生成面扩大（+7 符号行随删：`renderLedgerLine` ∥ `planChangeLines` ∥ `formatAgingLine` ∥ `formatThresholdLine` ∥ `notifyKey` ∥ `loadNotifyState` ∥ `saveNotifyState`）。
- **用例增补**：T11 CLI 源面锁（调用形 ∥ 零 `colors`/`C`）∥ T12 核面锁（`ledger-surface.mjs` 零 `pushLine`/`notify`/行产；`ledger.mjs` 零七符号）∥ T13 核行为（注入假 `pushLine` ⇒ **零调用**（负向）∥ `state.ledger` marker 照写 ∥ `render` 照调）∥ T14 核保留面（`formatDetailLine`/`detailScans`/`executorTail`/`formatMarker` 在位 ∥ `scopeMarkerOf` 判位照旧）∥ T15 CLI 保面（`render-frame.mjs` `ledgerHint` 链源面零改）。
- **收笔口径**：设计轮落点齐（含深清部）+ 设计档逐处收正（本刻执行）；实施 ∥ 评审随后。旧快照/回放矩阵不适用（桌面无旧包兼容面）。

### 2.11 设计档收正执行面（设计轮 · 本轮落定回执）

**落定 12 档**——逐档 = 改动点（**全为退役随正 ∥ 读数/指针收正，零新语义**；逐处明细见各档变更记录行）：

| # | 档 | 改动点 |
|---|---|---|
| 1 | `docs/desktop/design/IPC.md` | §1 `ev:ledger` 行 → **台账明细与状态位**（载荷 `{ key, detailLines, marker? }`——去 `lines`）＋消费句去流线面（存 = 段 11 常驻标记 ∕ tooltip）；§1 载荷键集行同拍；变更记录 +1 |
| 2 | `docs/desktop/design/RENDERER.md` | §1.1 三处——尾组族内序去「台账行」∥ 根子序去 `[台账行组?]` ∥ 帮助行族槽位句（「台账行组之后 ∥ 卡序列之前」⇒「卡序列之前」）；变更记录 +1 |
| 3 | `docs/desktop/design/CHAT.md` | §2「本批注（对齐第三批）」项 12（台账行）**整项删除**；:23 / :26 / :85 计数随正（小修族 **24 ⇒ 23** ∥ 对话流面 **12 ⇒ 11**；核面新消费件枚举去「核台账行产」）；§3.1 `chat-fixes.css` 行描述去「台账行」片段；变更记录 +2 |
| 4 | `docs/desktop/design/UI.md` | §1 对话流行「对齐第三批」枚举去「台账行」（项号随正）；「A. 对话流面」指针列去 A12 ∥ 本批注计数随正 ∥ 核面新消费件枚举；§4.1 `project-info.mjs` 行判域括注改「**台账读数出站 = KD-38**」；变更记录 +1 |
| 5 | `docs/desktop/design/COMPOSER.md` | §2 批注项 8 帮助行族槽位句（去「台账行组后」）；变更记录 +1 |
| 6 | `docs/desktop/design/PROJECT.md` | §2 **KD-38 收正**（**台账读数出站 = 启动拍 + 周期拍**——行面去）∥ §6.1 **D10 行**去「对齐第三批」退役从句 ∥ §7 **T-DSK11** 期望改指段 11 常驻标记 ∥ §7 机检面注（「台账行与相位两向」⇒「台账读数与相位两向」）；变更记录 +1 |
| 7 | `docs/vsc/design/WEBVIEW.md` | §3 其余行去 `ledger-line.js` ∥ R2 迁核注收正（**八拆档 ⇒ 七拆档**）；变更记录 +1 |
| 8 | `docs/vsc/design/WEBVIEW-PROTOCOL.md` | §12 表删 `ledgerNotice` 行（发射 ∥ 消费两面同退）；变更记录 +1 |
| 9 | `docs/render-core/design/RENDER-CORE.md` | §3 行 19（`ledger-line.js`）删——**表序留缺位不重排**（行号作稳定引用面：历次记录按行号复指，重排将伪化历史引用）∥ 计数同拍（**51 档 ⇒ 50 · 拆 9 ⇒ 8**）∥ §6 表该行删 ∥ §8 R2 行枚举随正；变更记录 +1 |
| 10 | `docs/core/design/LEDGER.md` | 零残留深清——§7.1 导出表删「`planChangeLines` 组」行 ∥ §7.2 删「条目键派生 ∥ 变化检测 / 送达门 / 去重档 schema」两条 ∥ §7.3 删 L3 ∥ L4 两行 ∥ §7.3.1 端接线两行随正（CLI 去 `colors` 注 ∥ VSC 端自持 tooltip 径）∥ §7.4 挂载句收正 ∥ §7.8 不变量（去「变化行送达门」句）∥ §2.1 归一链 ∥ T22 行 ∥ §9 批域不做句 ∥ §1 范围句；变更记录 +1 |
| 11 | `docs/cli/design/TUI-COMMANDS.md` | §1 命令层表 `ledger-surface.mjs` 行职责按实收正（陈旧描述「配置菜单的台账摘要行」经实读判伪——cmd-config 零台账引用）；变更记录 +1 |
| 12 | 批内件 `docs/batches/2026-10-04-stream-ledger-lines-retire.test.mjs` | 待实施轮出品（T1–T15——§2.6） |

**机检读数**（`node scripts/doc-check.mjs` · 仓根 · 2026-10-04 实跑）：锚闸 **悬空 0（OK）** ∥ 行宽 **全绿**（源域无 >300 字符单行）∥ 路径/坐标 **悬空 0**；行数面差异 **9 条**（SHELL ∥ IPC:350/:352 ∥ SESSIONS ∥ CHAT:144 ∥ COMPOSER:150 ∥ ACTIVITY ∥ RENDERER:323/:336）= 他批在途读数（非本批面——报告态，不在本批回填）。

**收口留笔（实施落盘后回填）**：三端文件账各行数表（CHAT §3.1 ∥ UI §4.1 ∥ RENDERER §5.1 ∥ IPC §3.1 ∥ WEBVIEW ∥ RENDER-CORE §6 ∥ LEDGER 各族表）逐档复读；`docs/core/design/API-CONTRACT.md` `--write` 重生成（`ledgerNoticeNode` / `renderLedgerLine` / 核七符号行随删——实施前跑则产出与设计相悖，故不入设计轮）。

**张力披露（需求面——主 agent 域，本座只报）**：D10 需求句「台账行…可见」与去面后可见性口径（段 11 常驻标记为唯一载体）——随 §2.10 / 2026-10-01 复核扫面批在册线索，归父侧口径闭。

### 2.12 修正块（评审 #40 · 修正轮 · 父裁 = 全采纳——逐号 1..10 · 2026-10-04）

**覆盖口径**：本块 = §3 轮次 1 发现表逐号落定；§2.0–§2.11 凡与本块相抵者以本块为准（逐处取代见 #1）；#11 = 限定行（父裁零动作）。§2 为 append-only——前段原句留档，现行口径以本块为准。

**#1（Scope 收正——以 §2.10 口径为准）**：现行口径 = **去面 = 桌面流尾组 ∥ VSC 通知行 ∥ CLI 行推线面；核 `lines` 出站面全端孤儿 ⇒ 零残留深清**；保留面 = 三端 L1 标记/计数 ∥ 桌面/VSC L2 明细 ∥ 会话注记。
逐处取代——前段「CLI 零触 ∥ 核面零改」两表述自本块起以本块口径为准（六处）：§2.0 落实③ ∥ §2.1 不含② ∥ §2.4 核三档行 ∥ §2.6 AC-6 行 ∥ §2.7 KD-2 ∥ §2.8 首行。
**AC-6 改定（替换 §2.6 原行）**：`| AC-6 | CLI 行推线面去面 ∧ L1 计数保留 | T11（CLI 源面锁）∥ T15（`render-frame.mjs` L1 链零改）∥ T12/T13/T14（核面深清）；真机：CLI 流内零台账行（启动行/变化行零出）、状态簇台账计数照常 | 用户 14:38 直裁 + §2.10 |`

**#2（受影响表重建——2.10 范围 · 代码面唯一一表）**：现行 = 内容行数口径（`wc -l` 同口径——文末换行不计）· 2026-10-04 实读；Δ = 设计预估；实施后按 as-built 复读（收口）。

| 文件 | 现行 | Δ预估 | 说明 |
|---|---|---|---|
| `thincoder-desktop/renderer/views/chat-chrome.mjs` | 250 | ≈ −33 | 三函数（含注）+ 调行删；锚链三处摘串（行数不变）；余注释随动 |
| `thincoder-desktop/renderer/views/chat-tree.mjs` | 147 | ≈ −2 | 挂入删 + import/注随动 |
| `thincoder-desktop/renderer/views/chat-model.mjs` | 117 | ≈ −12 | `ledgerOf` 整函数 + 键行删 |
| `thincoder-desktop/renderer/views/chat.mjs` | 205 | ≈0 | 注释随动 |
| `thincoder-desktop/renderer/views/chat-tool.mjs` | 300 | ≈0 | 注释随动（软线在册） |
| `thincoder-desktop/renderer/views/compress-status.mjs` | 75 | ≈0 | 链摘串 + 注 |
| `thincoder-desktop/renderer/events-slices.mjs` | 162 | ≈ −14 | `lines` 支整删 |
| `thincoder-desktop/renderer/events-subscribe.mjs` | 101 | ≈0 | 注释随动 |
| `thincoder-desktop/renderer/frame-dispatch.mjs` | 53 | ≈0 | 键表摘键（逐字） |
| `thincoder-desktop/renderer/chat-fixes.css` | 124 | ≈ −3 | `.chat-ledger` 块删 |
| `thincoder-desktop/renderer/core.css` | 338 | ≈ −4 | 两规则删 + 注收正（**软线在册**——越 300 在册；本批 = 非结构性触碰 ⇒ 续期） |
| `thincoder-desktop/src/main/project-info.mjs` | 181 | ≈ −8 | `lines` 单链删尽；保留面零改 |
| `thincoder-desktop/src/main/ipc.mjs` | 299 | ≈ −1 | 注释随动（软线在册） |
| `thincoder-vscode/webview/ledger-line.js` | 13 | **−13（删档）** | 孤儿 |
| `thincoder-vscode/webview/chat-messages.js` | 270 | ≈ −3 | import + case 删 |
| `thincoder-vscode/src/extension/ledger-surface.mjs` | 142 | ≈ −37 | `pushLine`/`pushLedgerStartup` ∥ 核 surface 调用整摘（§2.10——⇒ ≈105） |
| `thincoder-vscode/src/extension/panel-messages.mjs` | 382 | ≈ −3 | import + 调用点删（**软线在册**——越 300 在册；本批 = 非结构性触碰 ⇒ 续期） |
| `thincoder-vscode/src/extension/panel-project.mjs` | 118 | ≈ −1 | `{ emit: false }` 调用面随动（§2.10——补登行数） |
| `thincoder-vscode/webview/chat.css` | 511 | ≈ −14 | 两规则删（回线：→ ≈497，低于 500 硬限） |
| `thincoder-core/ledger-surface.mjs` | 85 | ≈ −40 | 深清（行产 ∥ notify ∥ 送达门退场——§2.10 ⇒ ≈45） |
| `thincoder-core/ledger.mjs` | 247 | ≈ −62 | 七符号 + 行产函数退场（实读无消费 ⇒ 删——#4；§2.10 ⇒ ≈185） |
| `thincoder-core/ledger-executors.mjs` | 103 | 结构不变（零改） | 词面 ∥ L1/L2 判活面保留 |
| `thincoder-cli/src/tui/index.mjs` | 263 | ≈0 | `pushLine` 单参摘除 + 注随动（§2.10） |
| `thincoder-cli/src/tui/ledger-surface.mjs` | 53 | ≈ −8 | `colors` 两处 + import + 注收正（§2.10） |
| `thincoder-render-core/flow/ledger-line.mjs` | 13 | **−13（删档）** | 孤儿 |

口径注：`ledger.mjs` ∥ `ledger-executors.mjs` ∥ CLI `index.mjs` 三档前载值 +1 = read 面末空行计入法 ⇒ 本表按盘实读收正；核三档旧「0 ∥ 保留」行**替为三行**（本表）；VSC `ledger-surface.mjs` 双值 Δ **收一**（≈ −37）。

**#3（层级句）**：`core.css`（338）∥ `panel-messages.mjs`（382）两行层级句已入上表（越 300 在册 + 非结构性触碰 ⇒ 续期——与同表「软线在册」注形一致）。

**#4（七符号——全仓消费面实读）**：2026-10-04 实读（live 源码）仅两处——`thincoder-core/ledger-surface.mjs`（import/调用：本批深清面本体）∥ `thincoder-core/ledger.mjs`（定义 + `planChangeLines` → `formatAgingLine`/`formatThresholdLine` 内部调用，随整组同删）。
注释两处（`project-info.mjs:108` ∥ VSC `ledger-surface.mjs:25`）= 本批删面区；记录/临时/产物面（历批批内件 ∥ `.thincoder/tmp` ∥ dist）不计。保留面（`formatDetailLine` 等）零消费 ⇒ 判据「实读无消费 ⇒ 删」成立；七符号并入 T8 扫描面 + T12 负向锁。

**#5（COMPOSER 回执补落）**：变更记录 +1 行已落（`docs/desktop/design/COMPOSER.md:297`）；§2.11 #5 口径成立。

**#6（§12 ③ 列 ∥ 跨档坐标）**：`docs/vsc/design/WEBVIEW-PROTOCOL.md:740` 句已收正（③ 列坐标随实施删行漂移——收口重出 ∥ 重锚；跨档 `WEBVIEW.md:354` 同拍）；收口清单增项见下。

**#7（计数三处）**：`CHAT.md:204` ⇒ **50 档** ∥ `RENDER-CORE.md:340` ⇒ **17 档 ∕ 拆 8** ∥ `RENDER-CORE.md:29` ⇒ **七拆档**（落点读回见报告）。
另勘（报告）：`PROJECT.md:574` 批块行「判定表（51 档）」= 记录面时点值 ⇒ 零动。

**#8（await 句）**：`LEDGER.md:335` 收为 **CLI 单端** + VSC 直落注（零核 surface 调用点）。

**#9（两名收正）**：`LEDGER.md:107` ∥ `:458` 两名按历史存量档措辞收正（零读写）；§2.11 #10 所列「§9 批域不做句」= §9 #882 不做 bullet 涉改（设计轮已落——git 差分在案），变更记录随补（本档修正轮行）。

**#10（机检归类 ∥ 收口增项）**：机检读数行数面差异 9 条归类收窄——`IPC:350`（`ipc.mjs`：表 283 ⇒ 实读 299）= **本批触档**（注释随动）⇒ 不再归他批在途、随收口复读落定；余 8 条 = 未触档（他批在途——报告态，不在本批回填）。

**收口清单增项（承 §2.11 收口留笔）**：① §12 ③ 列重出/重锚（按 §12 头注程序——本批删行致坐标漂移）∥ ② `WEBVIEW.md:354` 跨档坐标重锚 ∥ ③ IPC §3.1 `ipc.mjs` 行复读落定现值。

**三处未证引文重验（单列 · 2026-10-04 按盘）**：
① `UI.md:204`——实读 = 「聚焦态四值」句（D21 先例），非计数引文；#7 首项实指 = `CHAT.md:204`（实读吻合「逐模块判定表 51 档」）⇒ UI.md 零改。
② `WEBVIEW-PROTOCOL.md:740`——实读吻合（设计轮变更行、「余行列值零改」在处）⇒ 按 #6 收正（本刻已落）。
③ `PROJECT.md:968`——实读 = §6.1 D10 判据行；「对齐第三批」从句不在场（git 差分在案——设计轮已去）；`:1078` T-DSK11 期望 = 段 11 标记形 ✓ ∥ `:1176` 机检面注 = 「台账读数与相位两向」✓ ⇒ 零动作（「台账行」措辞 = D10 张力在册，归父侧口径闭）。

**另勘（报告 · 零动作）**：`docs/vsc/requirements/WEBVIEW.md:70`（P2-6）载「裁剪窗不含 `.ledger-line`…」——该面随退役退场 ⇒ P2-6 前提变化（需求档 = 主 agent 域，只报）；`docs/core/design/API-CONTRACT.md:2419` `renderLedgerLine` 生成行 = 实施轮 `--write` 重生成随删（§2.4 在册）。

**机检复跑（修正轮落定后 · 2026-10-04 实跑）**：`node scripts/doc-check.mjs` ⇒ **RC=0**；`OK(锚): 0 条悬空`（用例号 0 ∥ 路径/坐标 0 ∥ 符号·窄 0；宽面 = 报告面不入闸）∥ `OK(行宽): 源域全部 .md 无 >300 字符单行`；行数面差异 9 条（`IPC:350` 按 #10 收窄；余 8 条 = 未触档报告态）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审范围**：批档 §2（设计 · 含 §2.10 覆盖块）+ §2.11 十二档收正回执——11 设计档逐档实读；10 档回执已落（IPC §1/:30·:81 ∥ RENDERER §1.1/:126·:129·:140 ∥ CHAT/:23·:26·§3.1 ∥ UI/:27·:314·:316·:503 ∥ PROJECT/KD-38·D10·T-DSK11·:1176 ∥ WEBVIEW/:68·:73 ∥ WEBVIEW-PROTOCOL/§12 行删∥§6.3 键族保留 ∥ RENDER-CORE/行 19 缺位·§6·§8 ∥ LEDGER/§7.1–§7.8 ∥ TUI-COMMANDS/:25·:217），COMPOSER 变更记录未落（见 #5）。限定：上下文未提供文档地图与项目标准档 ⇒ Document ownership 判据降级（按 Project Guide ∥ 各档自述单源面判读）。

| # | 类别 | 级别 | 发现 | 建议 |
|---|---|---|---|---|
| 1 | Requirements ∕ Scope | 🟡 | 批档 §2 前段与被 §2.10 覆盖后的最终去面范围相抵：`thincoder/docs/batches/2026-10-04-stream-ledger-lines-retire.md:27`「② CLI 台账面（零触）」· 同档:96「**0** \| 保留（CLI 链——父裁「不判孤儿」）」· 同档:135「\| AC-6 \| CLI 零触」（判据「`git diff` 面零命中 CLI/核」）· 同档:141「**KD-2（核面零改）**」· 同档:148「不触保留面四组（marker ∥ detailLines ∥ `data-ledger-notice` ∥ CLI）」——而同档:161 已定「2.0 起「不含 CLI」诸句随本块更新」且去面含 CLI 行推线面。AC-6 判据按字面将否决既定实现 | 把 §2.1/§2.4/§2.6/§2.7/§2.8 的 CLI ∕ 核 句改写为 2.10 口径（去面含 CLI ∥ 核深清）；AC-6 改为「CLI 行推线面去面 ∧ L1 计数保留」并回指 T11–T15；失效的「CLI 零触」「核面零改」表述一并删（或逐处标 2.10 为准） |
| 2 | Affected files | 🟡 | 受影响表与 §2.10 增补自相矛盾：同档:96 核三档注 0，而同档:172「`thincoder-core/ledger-surface.mjs`（85 ⇒ ≈45）」∥「`thincoder-core/ledger.mjs`（248 ⇒ ≈185）」；同档:92 对 VSC `ledger-surface.mjs` 载「142 \| ≈ −12」而同档:172 载「`thincoder-vscode/src/extension/ledger-surface.mjs`（142 ⇒ ≈105）」（双值）；CLI 三档仅见 §2.10 增补；同档:172「`thincoder-vscode/src/extension/panel-project.mjs`（≈ −1）」缺现行行数 | 以 2.10 范围重建唯一受影响表（逐档现行行数 + Δ 或「结构不变」）；删 0 ∕ 保留 行与双值 Δ；补 panel-project.mjs 现行行数 |
| 3 | Affected files ∕ Tier | 🟡 | 越 300 档缺层级声明：同档:87「\| 338 \| ≈ −4 \| 两规则删 + 注收正」（`thincoder-desktop/renderer/core.css`）∥ 同档:93「\| 382 \| ≈ −3 \| import + 调用点删」（`thincoder-vscode/src/extension/panel-messages.mjs`）——同表对 `chat-tool.mjs` ∥ `ipc.mjs` 已有「（软线在册）」类注 | 两行补层级句（拆分预案 ∥ 非结构性触碰续期），与同表注形一致 |
| 4 | Acceptance | 🟡 | 七符号孤儿断言无消费面实读支撑：同档:168「`ledger.mjs`——孤儿导出删」列 `planChangeLines` ∥ `formatAgingLine` ∥ `formatThresholdLine` ∥ `notifyKey` ∥ `loadNotifyState` ∥ `saveNotifyState` ∥ `NOTIFY_FILE`，未附 KD-4（同档:143「全仓消费面实读」）式证据；T8 全树扫描面（同档:123「`renderLedgerLine` ∥ `addLedgerNotice` ∥ `data-ledger-line` ∥ `ledgerLines` 零命中」）不含七符号——若其中一件被保留面（`formatDetailLine` 等）复用即断 L2 | 为七符号补全仓消费面实读（或判据收为「实读无消费 ⇒ 删」）；七符号并入 T8 ∥ T12 扫描面作负向锁 |
| 5 | Doc state | 🟡 | 回执未落：同档:186 记 COMPOSER.md「§2 批注项 8 帮助行族槽位句（去「台账行组后」）；变更记录 +1」，但该档变更记录零本批条目（末条 = `thincoder/docs/desktop/design/COMPOSER.md:296`「2026-10-04（**排队守卫假满队修复批（composer-queue-gate-stick）· 修正轮（评审 #34 · 域外注记 · 父裁 = 全采纳）· eng-designer**」）；§2 项 8 句体已改（`thincoder/docs/desktop/design/COMPOSER.md:103`「行族 `[data-help]` = 流内非块节点（尾组槽位：卡序列前」） | 补 COMPOSER.md 变更记录本批条目（与其余 11 档同形），或收正 §2.11 #5 的「+1」口径 |
| 6 | Doc state | 🟡 | 「余行列值零改」与实施后果相抵：本批删 `webview/chat-messages.js` 两处（同档:66「import 删（:28）· `ledgerNotice` case 删（:135-136）」⇒ Δ ≈ −3），而 `thincoder/docs/vsc/design/WEBVIEW-PROTOCOL.md:404`「坐标 as-of = 2026-10-04（③ 列」的 ③ 列逐行指向该档行号（如 `thincoder/docs/vsc/design/WEBVIEW-PROTOCOL.md:441` 的「webview/chat-messages.js:137」）；同类跨档坐标 `thincoder/docs/vsc/design/WEBVIEW.md:354`「`thincoder-vscode/src/extension/ledger-surface.mjs:125-126`」随该档删行漂移；收口清单未含 §12 ③ 列重出 ∥ 重锚 | 收口轮按 §12 头注程序重出 ∥ 重锚 ③ 列与相关跨档坐标（或注明该列 as-of 作废）；同拍 `thincoder/docs/vsc/design/WEBVIEW-PROTOCOL.md:740`「余行列值零改」句 |
| 7 | Doc state | 🔵 | 计数随动遗漏三处：`thincoder/docs/desktop/design/CHAT.md:204`「逐模块判定表 51 档」未随 `thincoder/docs/render-core/design/RENDER-CORE.md:138`「50 档 = **核 9**」同拍；`thincoder/docs/render-core/design/RENDER-CORE.md:340`「**扩展端（判定表 18 档 + 发行三件）**——逐档「现行 ⇒ 预期」（核 9 = 迁核；拆 9 = 纯面迁核 · 端留守）」未随删行（表余 17 行 ∥ 拆 8）收正；`thincoder/docs/render-core/design/RENDER-CORE.md:29`「R2 换接后八拆档同径直接 import 核包 `.mjs`」与 `thincoder/docs/vsc/design/WEBVIEW.md:73`「**R2 迁核注**（七拆档 + 三核档）」相抵 | 三处同拍（CHAT D19 行 ⇒ 50 档；§6 表头 ⇒ 17 档 ∕ 拆 8；§1.3 ⇒ 七拆档） |
| 8 | Doc state | 🔵 | `thincoder/docs/core/design/LEDGER.md:335`「端胶水调用点补 await（CLI / VSC）」半句随 2.10 失真——VSC 侧核 surface 调用已整摘（同档:169「**核 surface 调用整摘**」⇒ 直落 `scanFamily` → `updateItem`），无该 await 点 | 该句收为 CLI 单端，或注明 VSC 径改直落 |
| 9 | Doc state | 🔵 | 「零残留深清」残留两名：`thincoder/docs/core/design/LEDGER.md:107` 与 `thincoder/docs/core/design/LEDGER.md:458` 仍以「`ledger-notify.json` 存量」作不动面点名，而去重档 ∥ `NOTIFY_FILE` 已删（同档:168）；该档变更记录（`thincoder/docs/core/design/LEDGER.md:514`「§2.1 归一链 ∥ T22 行随正；§1 范围句随动」）未载 §9 涉改，而同档:191 列有「§9 批域不做句」 | 两名按「历史存量档」措辞收正或去名，与 §2.11 #10 所列 §9 句对齐 |
| 10 | Doc state | 🔵 | 读数不一致待落定：`thincoder/docs/desktop/design/IPC.md:350` `ipc.mjs` 行载「**283**（实读 2026-10-03」，同档:89 载「\| 299 \| ≈ −1 \| 注释随动（软线在册）」；同档:195 把「IPC:350/:352」差异列「= 他批在途读数（非本批面——报告态，不在本批回填）」，但本批恰触 `ipc.mjs`（注释随动） | 收口复读 IPC §3.1 该行落定现值；「他批在途」归类收窄为未触档；同拍 §2.4（软线在册）判据 |
| 11 | 限定 | 🔵 | 评审限定：未提供文档地图 ⇒ Document ownership 判据降级（按 Project Guide ∥ 各档自述单源面判读）；未声明项目标准档 ⇒ 方法学合规按 Project Guide ∥ 批档既有纪律判读。另：§2 前段与被 §2.10 覆盖段并存属记录面惯例，本表 #1 只对「AC ∥ 受影响表」两处会诱发误执行处给判 | 若后续提供文档地图，按图复核安置面；本轮不动 |

**计数**：🔴 0 · 🟡 6 · 🔵 5 · 合计 11。

VERDICT: pass

## §4 用户批准（主 agent）

**代签（父侧 · 2026-10-04 15:3x）**：批准依据 = 用户 12:18「都自动跑吧」全链授权在效 + 14:24/14:38 两条直裁（「会话流最后的那条台账提醒……去掉吧」+「cli端也有同类提示，也一起去掉。」）。链况 = 设计（§2 + 2.12 修正块）→ 评审 #40 **pass**（🔴0 · 🟡6 · 🔵5——§3 轮次 1 在档）→ 裁定（11 条逐条：1–10 Dispatched→修正轮 #41 落定，11 Not an issue）→ 修正轮 #41 逐号落定 + 父侧核读（§2.12 读回 ∥ doc-check RC=0 直跑 ∥ 三处未证引文重验在档）→ 本条代签。**边界复核**：去面 = 桌面流尾组 ∥ VSC 通知行 ∥ CLI 行推线面 ∥ 核 `lines` 深清；保留面 = 三端 L1 标记/计数 ∥ 桌面/VSC L2 明细 ∥ 会话注记 ∥ 「属主已死」词面；父侧同轮两笔 = `docs/desktop/design/PROJECT.md` §6.1 D10 口径随正（台账读数）∥ `docs/vsc/requirements/WEBVIEW.md` P2-6 四族减一（`.ledger-line` 退场）。**实施 = 双舱串行**：A（核 ∥ CLI ∥ render-core ∥ VSC）→ B（桌面 + 批内件（T1–T15）全跑 · dependsOn A）——**批内件归 B 舱**（派单口径；本条为父侧同轮更正——原句「A（…+ 批内件）」写法不准）。

## §5 实施记录（eng-coder）
**状态行**：实施完成（A 舱（核 ∥ CLI ∥ render-core ∥ VSC）11 码档 ∥ B 舱（桌面 13 档 + 批内件 + 本条）；批内件先红 9/17 ⇒ 后绿 17/17；node --check 12/12；审计 ×1 + 代码评审 ×2（pass）；终态 clean · 2026-10-04）


### 5.1 交付摘要（实施舱 A：核 ∥ CLI ∥ render-core ∥ VSC）

**范围**：按批档 §2（含 §2.10 ∥ §2.12 修正块——修正块为准）执行「流尾台账行组退役」实施舱 A。去面 = CLI 行推线面 ∥ VSC 通知行 ∥ 核 `lines` 深清（全端孤儿）；桌面面 = 舱 B（零触）；批内件 = 按父侧派单在 B 舱落（与设计 §4 措辞之差见 5.5-③）；需求/设计档 = 禁域（本舱零触）。

**逐档落点（file ↔ 动作 ↔ as-built 读数 · wc-l 口径）**：

| # | 件 | 动作 | as-built（现行 ⇒ 终态） |
|---|---|---|---|
| 1 | `thincoder-core/ledger-surface.mjs` | 深清：去 `pushLine`/`colors`/`startup`/`notifyFile` 缝 ∥ 启动行/变化行生产 ∥ notify 读/写 ∥ 送达门 ∥ `detailScans`/`formatDetailLine` 行面；余 = 族扫描 → 判活 → `scopeMarkerOf` → `state.ledger` → `render()`；tick 壳去 `startup` 径 | 85 ⇒ **52** |
| 2 | `thincoder-core/ledger.mjs` | 七符号删（`planChangeLines` ∥ `formatAgingLine` ∥ `formatThresholdLine` ∥ `notifyKey` ∥ `loadNotifyState` ∥ `saveNotifyState` ∥ `NOTIFY_FILE`）＋ imports 逐名收（fs 六名 ⇒ 二名；去 `configDir` ∥ `normalizeCwd`）；保留集齐（`buildScan`/`discoverFamily`/`detailScans`/`formatDetailLine`/`formatMarker`/`scopeMarkerOf`/`resolveExecutorStates`/`executorTail`/`REFRESH_MS`/命令族） | 247 ⇒ **193** |
| 3 | `thincoder-cli/src/tui/index.mjs` | `startLedgerSurface` 调用去 `pushLine` 单参（⇒ `{ state, agent, render }`）；注去旧号 §2.30.3.4 | 263 ⇒ **263** |
| 4 | `thincoder-cli/src/tui/ledger-surface.mjs` | 去两处 `colors: C` 注入 ＋ `import { C }`；档头/函数注收正（「三面语义」句去行面） | 53 ⇒ **51** |
| 5 | `thincoder-render-core/flow/ledger-line.mjs` | **整档删**（孤儿——`renderLedgerLine` 消费面实读 = 仅 VSC shim） | 13 ⇒ 0（−13） |
| 6 | `thincoder-vscode/webview/ledger-line.js` | **整档删**（孤儿） | 13 ⇒ 0（−13） |
| 7 | `thincoder-vscode/webview/chat-messages.js` | import 删（:28）＋ `ledgerNotice` case 删（:135-136） | 270 ⇒ **267** |
| 8 | `thincoder-vscode/src/extension/ledger-surface.mjs` | `pushLine`/`pushLedgerStartup`/`post`/`SEAM_COLORS`/`_state`/`_notifyFile` 退场；**核 surface 调用整摘** ⇒ 直落 `scanFamily` → `updateItem`；`refreshLedger` 两径归一（去 `emit` 参）；`_setLedgerSurfaceForTest` 留 `cwd` 缝 | 142 ⇒ **92** |
| 9 | `thincoder-vscode/src/extension/panel-messages.mjs` | import 删（:39-40）＋ `pushLedgerStartup(panel)` 调用点删（:359） | 382 ⇒ **379** |
| 10 | `thincoder-vscode/src/extension/panel-project.mjs` | `refreshLedger(panel, { emit: false })` ⇒ `refreshLedger(panel)`；import 注去旧号 | 118 ⇒ **118** |
| 11 | `thincoder-vscode/webview/chat.css` | `.ledger-line` 两规则＋块注删 | 511 ⇒ **497**（回线 <500 ✓） |

### 5.2 验证读数（机检 ∥ 自扫 ∥ 烟测）

- **`node --check`：8/8 exit 0**——core `ledger-surface.mjs` ∥ core `ledger.mjs` ∥ CLI `index.mjs` ∥ CLI `ledger-surface.mjs` ∥ VSC `ledger-surface.mjs` ∥ VSC `panel-messages.mjs` ∥ VSC `panel-project.mjs` ∥ VSC `chat-messages.js`。
- **零残留自扫**（本舱树 = thincoder-core ∥ thincoder-cli ∥ thincoder-render-core ∥ thincoder-vscode；排除 node_modules/.thincoder/docs/dist*/_archive；540 档全文件型）：`renderLedgerLine` ∥ `addLedgerNotice` ∥ `data-ledger-line` ∥ 七符号 ∥ `pushLedgerStartup` ∥ `ledgerLines` ∥ `ledger-notify` ∥ `ledger-line` **全 0 命中**；`ledgerNotice` 余留 11 处 = 保留面形（VSC locales `session.ledgerNotice` ×4 ∥ `panel-session.mjs:259` ∥ `session-bar.js` ×6——会话注记族）；`pushLine` 于台账机械面（core surface ∥ CLI 胶水 ∥ VSC 胶水 ∥ panel-messages ∥ panel-project）**全 0**（CLI 其余 `pushLine` = 对话写入面——保留面，非台账缝）。两删档不在盘 ✓。
- **保留面核读（零触自证）**：CLI L1（`render-frame.mjs` 零改）∥ `ledger-executors.mjs` 零改 ∥ 「属主已死」词面在档 ∥ VSC 会话注记族（`session-bar.js`/`panel-session.mjs`/locales）零改 ∥ 桌面面零打。
- **功能烟测（直跑 · 只读锚）**：核 `runLedgerScan` ⇒ `state.ledger = { marker, warn: true, scannedAt }` ＋ `render()` 恰 1 次；CLI 胶水 `startLedgerSurface` ⇒ 恒同步 `{ dispose }`、首拍（setImmediate）落 `state.ledger`（≈0.8s——判活探束）、`dispose()` 正常；`glue.runLedgerScan` 直通亦绿。smoke 读数随实时台账变动（复跑：`台账 9·30` → `台账 10·30`）。
- **`git status`（仓根）**：本舱 delta = **9 M ＋ 2 D = 11 码档**（恰 §2.12 #2 舱 A 行）；余量 = 设计轮前置 docs 14 档（非本舱）+ 批档新档（未跟踪）。
- **not repo-suite verified**（仓 `test/` 树空清单——派单口径）；批内件（T1–T15）≠ 本舱落。

### 5.3 决策透明表

| 决策 | 处置 | 理由 ∥ 依据 |
|---|---|---|
| `startup` 径去后首拍同受 `processing` 避让门 | 有意归一 | §2.10 ④「首拍 setImmediate ＋ 周期照旧」；影响有界（CLI 初值 false；桌面载体无该态 ⇒ 恒不触发）——评审 🔵 在档 |
| `refreshLedger(panel)` 保留 `panel` 形参（去 `emit` 后未读） | 保调用形 | §2.10 ⑥ 口径 = 「去 `{ emit: false }`」；调用面 `panel-project`/`chat-panel` 照传——评审 🔵 在档 |
| 两枚 write 产档末无换行 ⇒ 补 1 byte × 2 | 机械修正 | 仓约定（`* text=auto eol=lf`）＋ as-built 计数口径一致；复跑 node --check 绿——fix 轮 1 |
| 批内件零动作（设计 §4「A + 批内件」vs 派单「B 舱落」） | 按派单执行 | 口径差上抛（5.5-③） |
| VSC 胶水瘦至 92 行（设计估 ≈105）∥ CLI 胶水 −2（估 ≈−8）∥ core 52（估 ≈45）∥ core ledger 193（估 ≈185） | as-built 复读 | Δ 预估为概数；删除集合与保留集齐 = 设计逐项核毕（审计 A 表 11 档逐核 ✅） |

### 5.4 审计与代码评审轮次与终态

- **审计轮 ×1**（explore 只读对账——逐档 11 比对 §2.10/§2.12 ∥ 越表 ∥ 保留面 ∥ 余件核读）：**码面四类偏差全零**（静默简化 0 ∥ 越表 0 ∥ 保留面误伤 0 ∥ 欠尽 0）；记录/生成面两条：§5 空（本段落定）∥ API-CONTRACT 重生成 = 舱外待路由（5.5-②）。核深清余件核读 = 与设计逐字吻合。
- **代码评审轮 ×1**（advisor）：**pass**——🔴 0 ∥ 🟡 3（批内件口径/记录面两条 ＋ §5 空——非阻塞）∥ 🔵 3（panel 死参 ∥ 首拍门 ∥ core 旧节号 §2.30.3.x）；逐条处置 = 5.3/5.5。
- **fix 轮 = 1**（EOF 换行机械修正）；另 1 次批量编辑原子拒绝（panel-messages 锚文本不符——**零写盘**，锚修正后重放成功），不计 fix 轮。
- **终态 = clean**（无未决 🔴；🟡 全数披露/路由；🔵 全数登记）。

### 5.5 披露与上抛

1. **派单 ↔ 设计 §4 口径差（批内件归属）**：设计 §4「A（核 ∥ CLI ∥ render-core ∥ VSC + 批内件）→ B（桌面 + 批内件全跑）」vs 父侧派单「批内件（T1–T15）= B 舱落」——本舱按派单零动作；请父侧裁定（批档 §2.4/:109 ∥ §2.12 #12 ∥ §4 三处口径同步）。
2. **API-CONTRACT.md 重生成未执行**（`renderLedgerLine` ∥ 核七符号行随删）：派单禁项（需求/设计档）＋ 本舱越表线（11 码档）⇒ 零触，请父侧路由（§2.11 收口留笔/§2.12 #10 在册）。另勘（审计核对）：`docs/core/design/API-CONTRACT.md:2060` `ledgerNoticeNode` 指向**保留面**（桌面 `session-control.mjs` `data-ledger-notice` 族）——重跑时应保留该行，非随删（与 §2.11 括注相抵，收口核对项）。
3. **存量测试载体失配（舱外 · 只报）**：`docs/batches/2026-09-29-residuals-round2.test.mjs` L1 组（L1a `notifyKey` ∥ L1b `normalizeCwd` 切片 ∥ L1c 导出面 45 名基线）断言对象 = 本批七符号 ⇒ 复跑必红；VSC 档头注仍引其为「W8 契约②判据现载体」。处置 = 另笔（他批面 ＋ 冻结记录面，本舱零触）；设计 §2.12 #4 已明示「历批批内件不计」——属设计口径内面，供收口裁决。
4. **旧节号残留（舱外 · 只报）**：core `ledger.mjs:33/:37/:42/:147`「§2.30.3.x」（LEDGER.md 现盘无此节）＋ VSC `chat-panel.mjs:32`「§2.30.3.5」——均不在本批触点清单（§2.9 ⑤ 口径 = 触点改写）；建议收口统一裁决。
5. **舱 B 随动待办（供 B 舱）**：桌面 `project-info.mjs` 引核行号 `:60`/`:66` 随本舱重写漂移；`LINE_COLORS`/`pending`/`pushLine`/`notifyFile`/`colors` 注入面与 `ev:ledger` 载荷 `lines` 键按 §2.3 行 12 待删——本舱核签名已收（多余键被忽略，桌面 `state.ledger` 标记照写，B 舱前不崩）。

**勘误（同段）**：5.1 节括注「见 5.5-③」应为「见 5.5-①」——批内件口径差 = 5.5 首条。

### 5.6 交付摘要（实施舱 B：桌面 13 档 + 批内件 + 批档 §5 本条）

**范围**：按批档 §2（含 §2.10 ∥ §2.12 修正块——修正块为准）执行「流尾台账行组退役」实施舱 B：桌面流尾组本体（`[data-ledger]` 渲染链 ∥ 主机出站 `lines` 键）退役 + 批内件 T1–T15 + 批档 §5 本条。舱 A（核 ∥ CLI ∥ render-core ∥ VSC）先行在册（§5.1–5.5）；本舱零触舱 A 面 ∥ 设计档 ∥ 保留面。

**逐档落点（file ↔ 动作 ↔ as-built 读数 · wc-l 口径（文末换行不计））**：

| # | 件 | 动作 | as-built（现行 ⇒ 终态） |
|---|---|---|---|
| 1 | `thincoder-desktop/renderer/views/chat-chrome.mjs` | 删 `ledgerGroupNode`（:69-81）∥ `syncLedger`（:124-137）∥ `ledgerAnchorOf`（:240-244）三函数（含注）+ `syncChrome` 调行；三锚链摘 `[data-ledger]` 串（`blockAnchor` ∥ `timerAnchorOf` ∥ `stoppedAnchorOf`——余项自然顺位、族序不变式保持）；注释随动 | 250 ⇒ **214**（−36；设计 ≈ −33） |
| 2 | `…/views/chat-tree.mjs` | import 去 `ledgerGroupNode`；组挂入行删；注随动（族内序去「台账行」） | 147 ⇒ **145**（−2） |
| 3 | `…/views/chat-model.mjs` | model 键 `ledger` 删 + `ledgerOf` 整函数删；档头「七件 ⇒ 六件」 | 117 ⇒ **106**（−11；设计 ≈ −12） |
| 4 | `…/views/chat.mjs` | 注释随动（尾组「四 ⇒ 三」∥ model 形句 ∥ 项 6/12 句） | 205 ⇒ **205**（0） |
| 5 | `…/views/chat-tool.mjs` | 注释随动（`_ledgerLines` 判例 ⇒ 「节点自携判据引用先例」） | 300 ⇒ **300**（0） |
| 6 | `…/views/compress-status.mjs` | `compressAnchorOf` 摘 `[data-ledger]` 串 + 注随动 | 75 ⇒ **75**（0） |
| 7 | `…/events-slices.mjs` | `onLedger` `lines` 支整删（`detailLines`/`marker` 两支逐字保留）；注随动（「台账三切片」⇒「两切片」） | 162 ⇒ **149**（−13；设计 ≈ −14） |
| 8 | `…/events-subscribe.mjs` | 注释随动（`ev:ledger` 词面：台账行集 ⇒ 台账明细 ∕ 状态位） | 101 ⇒ **101**（0） |
| 9 | `…/frame-dispatch.mjs` | `CHAT_KEYS` 摘 `"ledgerLines"`（`SESSION_KEYS` `"ledger"` 保留）；注随动（三尾组 ⇒ 两尾组） | 53 ⇒ **53**（0） |
| 10 | `…/chat-fixes.css` | `.chat-ledger` 块删；注随动（帮助行族槽位句 ∥ 档头族单） | 124 ⇒ **120**（−4；设计 ≈ −3） |
| 11 | `…/core.css` | `.ledger-line`/`.ledger-line.warn` 两规则删；「组外面」注释两族 ⇒ 一族（file-link） | 338 ⇒ **334**（−4） |
| 12 | `src/main/project-info.mjs` | `lines` 单链删尽（`pending` ∥ `LINE_COLORS` ∥ `payload.lines` ∥ `pushLine`/`colors` 注入面 ∥ `notifyFile` 注入面）；注释随动 + 跨档引文按 as-built 收正（详 5.7）；保留四件（`ledgerDetailLines`/`ledgerMarkerOf`/`sameLedgerMarker`/`stopLedgerRefresh`）零改 | 181 ⇒ **169**（−12；设计 ≈ −8——差因 `notifyFile` 面 + 注释块重写） |
| 13 | `src/main/ipc.mjs` | 注释随动（「台账行出站」⇒「台账读数出站」三处）；`session:resume` 调用点零改 | 299 ⇒ **299**（0） |
| 14 | `docs/batches/2026-10-04-stream-ledger-lines-retire.test.mjs` | **新档**（批内件）：T1–T15 = 17 用例（T4 拆三腿）+ 假 DOM 迷你面 + live 源码树扫描面 + 临时台账夹具 | **524 行**（设计 ≈200——超量因：扫描面 ∥ 假 DOM ∥ 真拍链夹具齐备；批内件非仓套件） |

**验证读数（机检 ∥ 先红后绿 ∥ doc-check ∥ git status）**：

- **先红（未改桌面首跑 · 2026-10-04）**：批内件 **9 红 / 8 绿**——红 = T1（`ledgerLines` 写入）∥ T3（model 有 `ledger` 键）∥ T4×3（组节点在场 ∥ 锚落 `[data-ledger]`）∥ T5（六档 17 处词命中）∥ T6（源面 `LINE_COLORS`；行为腿先绿——舱 A 已断行产）∥ T8（`data-ledger-line` 命中 2 档）∥ T9（两 CSS）；绿 = T2 ∥ T7 ∥ T10–T15（舱 A 面）。
- **后绿（桌面改毕复跑）**：**17/17 全绿**（两次复跑同读数；含引文收正后终跑）。跑法 = 仓根 `node --test docs/batches/2026-10-04-stream-ledger-lines-retire.test.mjs`。
- **`node --check`：12/12 exit 0**——11 桌面 `.mjs` + 批内件（口径注：派单「13 档」含 2 CSS——node --check 不可检；CSS 面覆盖 = T9）；另单跑 `project-info.mjs` 复核 exit 0。
- **`node scripts/doc-check.mjs`（父裁口径 ③「本舱零新增悬空」）**：现行 **悬空 1**（唯一 = `API-CONTRACT.md:2419 → thincoder-render-core/flow/ledger-line.mjs:8`——舱 A 删档随动，父裁 = 收口轮 `api-contract.mjs --write` 处理）；**本舱 13 档无一进入悬空集**（先红轮 607 条 = 父侧实验窗瞬态，已回退——非本舱面）。行宽全绿。
- **`git status`（仓根）自证**：本舱 delta = **13 桌面档（11 M + 2 CSS M）+ 批内件（新，未跟踪）+ 本批档（§5 本条）** = 15 档；余面 = 舱 A 11 码档 + 设计轮 docs + 他批在飞（非本舱）。
- **not repo-suite verified**（仓 `test/` 树空清单——派单口径）；批内件复跑 = 唯一运行面。

### 5.7 决策透明表（舱 B）

| 决策 | 处置 | 理由 ∥ 依据 |
|---|---|---|
| `notifyFile` 注入面（`pushLedgerLines` 形参 + 注入）删 | 删（§2.3 行 12 逐名之外） | §2.10 #4 核侧 `notifyFile` 缝已随深清退场 + 舱 A §5.5⑤ 在录「按 §2.3 行 12 待删」；留之 = 死参（核方忽略）。影响面 = 仅测试注入缝；生产调用点不传。披露在案（5.9-④） |
| 跨档引文三处收正（`ledger.mjs:114⇒118` ∥ `ledger-surface.mjs:54⇒22` ∥ VSC `ledger-surface.mjs:69⇒58`） | 顺拍收正 | 舱 A §5.5⑤「舱 B 随动待办：桌面 `project-info.mjs` 引核行号随本舱重写漂移」交办项；三处实读漂移（引文 vs as-built） |
| T6 夹具取件链 = `thincoder-desktop/node_modules/@thincoder/core/*` | 按实改 | 实读：符号链接路径与 `thincoder-core/*` 直路径 = 两个模块实例——`_setLedgerDirForTest` 注入须与 `project-info.mjs` 同实例（否则注入失效 + 真族发现走真用户目录慢径；探针取证后清理） |
| T4 · 卡件不入行为锚腿 | 按实改 | 实读：卡节点在场判据 = 待决项——无待决项时 `syncCards` 按设计摘卡（非本批语义）；卡锚覆盖 = 同测试 `blockAnchor` 单元腿（`data-card` 在链） |
| 批内件两条腿首红轮即修（模块实例 ∥ 卡夹具） | 测试自身缺陷修正 | 首红 = 取证轮；测试未定稿前修正不改变实现面 |

### 5.8 审计与代码评审轮次与终态（舱 B）

- **审计轮 ×1**（explore 只读对账——逐档 13 比对 §2.12 ∥ 保留面逐处 ∥ 越表 ∥ 残留）：**四类偏差（静默简化 ∥ 文档漂移 ∥ 越表 ∥ 保留面误伤）= 零**；唯一偏差 = 「批档 §5 无 B 舱节」（本条 append 即落）；机械触碰并集 = 恰 13 档 + 批内件（零越表）；残留清点 = 3 处陈旧注释在本批清单外（5.9-①）。
- **代码评审轮 ×2**（advisor）：**R1 pass**（🔴 0 ∥ 🟡 2（均「非必须/父侧路由」）∥ 🔵 3（登记项））；**R2（修正轮复核）pass**——R1 🟡-1（三处跨档引文）**Fixed** 逐条命中现盘；R2 新 🔵 一条 = `project-info.mjs:8/:9` 引 `manifest.mjs:334/:342` 陈旧（**拆分前既有漂移**，他批已录「报而不改」；非本轮三处修项、非本舱致因）——未动（遵父侧路由/收口顺拍口径），在案 5.9-⑤。
- **fix 轮 = 1**（三处注释引文收正——评审 R1 🟡-1）；另批内件自身两处测试缺陷首红轮修正（非实现 fix 轮）。
- **终态 = clean**（无未决 🔴；🟡 全数路由/披露；🔵 全数登记）。

### 5.9 披露与上抛（舱 B）

1. **清单外陈旧注释 3 处（报告 · 零触）**：`thincoder-desktop/renderer/chat.css:5` ∥ `src/main/main.mjs:130` ∥ `:149`——含退役面措辞「台账行」，不在 §2.3/§2.12 #2 逐处清单（本舱 15 档口径之外）；建议父侧择一：随收口随拍 ∥ 明记不动面。零触 = 本舱纪律（不越 15 档界）。
2. **`API-CONTRACT.md` 重生成**（`renderLedgerLine` 行随删 + 核七符号行）：父裁 = 收口轮 `node scripts/api-contract.mjs --write` 执行（承 §5.5-②；另勘：`:2060` `ledgerNoticeNode` = 保留面，重跑时应保留）。
3. **行数表收口回填**：本舱 13 档 as-built 读数（5.6 表）与 doc-check「行数面」报告（CHAT.md ∥ RENDERER.md:326 ∥ UI.md ∥ IPC.md:350 等）落 §6 收口复读面（设计 §2.4 收口笔面口径）。
4. **notifyFile 删除披露**：见 5.7 首行 + 5.6 表 #12（越 §2.3 行 12 逐名之外、舱 A 在录口径内）。
5. **`project-info.mjs:8/:9` 引 `manifest.mjs:334/:342` 陈旧（报告 · 零触）**：拆分前既有漂移（他批在册「报而不改」）；现盘正确目标 = `readManifest` :152 ∥ 非 ENOENT 上抛 :161——非本舱致因、非本轮三处修项；建议随收口顺拍或另笔（一行数字事）。
6. **T6 行为腿先绿说明**：`lines` 键零出站在先红轮已成立（舱 A 已断行产——桌面 `pushLine` 注入面成死链路）；T6 先红来源 = 源面锁腿。如实记录，防误读。
7. **§2.12 #2 受影响表 vs as-built 差异（报告）**：chat-chrome −36（表 ≈−33）∥ chat-model −11（≈−12）∥ chat-fixes −4（≈−3）∥ project-info −12（≈−8，含 notifyFile 面 + 注块重写）∥ 批内件 524 行（设计 ≈200）∥ 余逐档吻合；差异 = 注释行数与注入面的自然量差，非语义差。

## §6 验证与收口（父代理）

**收口判词：已收口 2026-10-04**（双舱串行（A：核 ∥ CLI ∥ render-core ∥ VSC ∥ B：桌面 13 档 + 批内件）→ 审计/评审双双 clean → 收口复读全绿 → 台账 #913 核销）

- **实施链**：设计（§2 + §2.12 修正块）→ 评审 #40 pass（🔴0 · 🟡6 · 🔵5——§3 轮次 1 在档）→ 裁定 11 条（1–10 ⇒ 修正轮 #41 逐号落定；11 Not an issue）→ §4 代签 → **舱 A**（#42：`ledger-surface.mjs` 85⇒**52** ∥ `ledger.mjs` 247⇒**193** ∥ CLI ∥ render-core（删档）∥ VSC——11 码档（9M+2D））→ **舱 B**（#43：桌面 13 档 + 批内件 **524 行**——先红 9/17 → 后绿 **17/17**）→ 审计 ×1（四类偏差全零）+ 代码评审 ×2（R1 pass → 3 引文修 → R2 pass）→ **终态 clean**。
- **收口复读（父侧亲跑）**：① 批内件 **17/17 绿**（`node --test docs/batches/2026-10-04-stream-ledger-lines-retire.test.mjs`）；② `node scripts/api-contract.mjs --write` **已执行**（消 `API-CONTRACT.md:2419` 悬空——`renderLedgerLine` 行随删；`ledgerNoticeNode` 保留面重跑保留 ✓）；③ `node scripts/doc-check.mjs` = **exit 0 · 0 悬空**（行宽 OK）；④ 零残留自扫（舱 A 14 符号 0 命中 ∥ 舱 B 批内件全树面）。
- **收口笔面（本轮已落——父侧直接执行 · 可 revert）**：① `WEBVIEW-PROTOCOL.md` §12 ③ 列 **54 格现盘重出**（`case` 首现锚法逐格实读——`i18n` `:57` ⇒ `:58` 实读收正 ∥ `sub:*` `:240` ⇒ `:237`）+ 变更记录行；② `WEBVIEW.md` 收口三笔（§3 文件表 `chat-messages.js` 238⇒**267** ∥ `ledger-surface.mjs` 引文 `:125-126`⇒**`:83`** ∥ `chat-messages.js` `:194-200`⇒**`:191-197`**）+ 变更记录行；③ 文件账行数表回填（`CHAT.md`：chat-chrome 250⇒**214** ∥ chat-tree 147⇒**145** ∥ chat-model 117⇒**106**；`RENDERER.md`：events-slices 162⇒**149**；`UI.md`：project-info 181⇒**169**；`IPC.md`：档头 + §3.1 `ipc.mjs` 283⇒**299** 收口复读）；④ 陈旧措辞三处（`renderer/chat.css:5` 小修族清单去「台账行」∥ `main.mjs:130/:149` 「台账行出站」⇒「台账读数出站」）。
- **在册（非阻断）**：① `project-info.mjs:8/:9` 引 `manifest.mjs` 坐标陈旧（前批既有漂移——非本批致因）；② `WEBVIEW.md` 散引若干 CSS 坐标（`:465` ∥ `:492` ∥ `:538`）为历批累计漂移面（非本批收口笔射程——另册）；③ doc-check 行数面报告 16 条（全为 desktop 面条目——报告态）。
- **结算**：台账（desktop）**#913** 核销（依据 = 本节 + 提交双笔）；交付 = 代码面 ∥ 文档面两提交。
- **用户门**：无（用户 14:24 直裁已兑现；「属主已死」词面与流尾组同退 ✓；真机面 = 重打包后生效——候用户）。
