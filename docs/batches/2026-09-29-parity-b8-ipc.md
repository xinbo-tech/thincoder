# 2026-09-29 · parity-b8-ipc
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-29 · 来源 = 三端对位收编 §2 归批表 B8（IPC 载荷契约）+ 用户「都处理」令。
> 台账 = #572（desktop ∕ vsc · 归批）。前情 = `docs/batches/2026-09-29-parity-closeout.md` §2 归批表 B8 + §3③（annex :35 ∕ :75）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-29
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 来源与口径（父侧 · 2026-09-29 · 旧档 `-contract.md` 合并入本档）

- **来源**：用户**全修令** + `parity-closeout` §2 归批表 **B8** + §3③。
- **射程**：**载荷契约面**——通道名 ∕ 载荷形逐通道对位 VSC `panel-messages` + annex `:35`（回调桥载荷契约）· `:75`（注册/分发载荷面）；**传输层（Electron IPC）本身 = 宿主例外，不在射程**。
- **口径**：对位 VSC 实盘；行为零变。
- **台账**：#572（desktop ∕ vsc · 归批）。
## §2 批次任务与设计（eng-designer）
**状态行**：设计完成 · 2026-09-29（对照 61 通道 + 裁定四档 + 波 W1–W4；评审 #144 修正轮 1 九条落位（§2.8）· 父侧 ev:usage 三差收编（§2.9）· W1–W3 实施在册（§5）⇒ W4 文档收正轮落位（§2.10；机检本域 行宽 Δ −1 ∕ 悬空 Δ 0））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

#### B · 例外·宿主面（三件齐 = ① 能力点名 ② 为何仅一侧 ③ 实证）

- **B1 传输 ∕ 注册面**：① 能力 = Electron IPC（`ipcMain.handle` ∕ preload 白名单 `invoke`）；② 仅一侧 = VSC 零注册面（消息名 = `postMessage` 字面量直发）；③ 实证 = `ipc-registry.mjs:68-76` · `preload.cjs:62-64` ∥ `WEBVIEW-PROTOCOL.md` §13 表。⇒ 通道名规约与「一通道一回执」= 传输面（不逐字对齐）。
- **B2 合流 ∕ 分流拓扑**（审批两族 · 会话面 · 设置族 · 活动族 · flags 族 · subagent+approval · tools 族）：① 能力 = 请求-响应式 IPC 通道 vs 单向消息族；② 仅一侧 = VSC 消息族可细分单事件（零注册 ∕ 零回执面）；③ 实证 = `ipc-registry.mjs:72-75`（一通道一 handle）∥ VSC §12 ∕ §13 两表逐消息。
- **B3 载体面 `key`**（多会话）：① 能力 = 桌面单窗多会话（多槽并存；`agentHost` 按键表）；② 仅一侧 = VSC 一 webview 一槽；③ 实证 = `ipc.mjs:139 ∕ :150`（键面）∥ `panel-messages-session.mjs:71`（`panel._slot = msg.slot` 单值）。
- **B4 `sessions.active` 语义**（行内 `isActive` = manifest 活动槽 ∥ 顶层 `active` = 本面板绑定槽）：同 B3 载体面。
- **B5 宿主原生面**：① 能力 = VSC 宿主 API（`showInputBox` ∕ `openTextDocument` ∕ 原生 diff 视图）∥ Electron（`dialog.showOpenDialog` ∕ `shell.openPath`）；② 仅一侧（各宿主各自 UI 能力）；③ 实证 = `panel-messages-session.mjs:88-93` ∕ `panel-messages-turn.mjs:143-151` ∥ `ipc.mjs:118 ∕ :225`。
- **B6 推 ∕ 拉**：① 能力 = VSC webview 单向 boot 生命周期（内容只在 `webviewReady` 后由宿主推——§4.5）∥ desk 常驻渲染进程自持 store；② 仅一侧；③ 实证 = `WEBVIEW-PROTOCOL.md` §4.5 ∥ `IPC.md` 会话族 ∕ 项目面注（返回形）。

（B 族处置 = 登记例外 · 零动作。）

#### C · 无对位清单（VSC 无此面——登记零动作）

`project:recent` · `session:resume` · `config:write` · `batch:status` · `session:gc` · `session:index` · `ev:config`（7 项；宿主面 ∕ desk 自有面——逐行见 2.2 ∕ 2.3 裁定列）。

#### D · 上抛清单（父侧裁——修之即行为增量或结构改）

- **D1** `config:read` 整份 config（含密钥原值）直达渲染面——VSC 密钥零下发（§13 零 config 读行）；修法 = 收窄为快照族（结构改）⇒ 须裁。
- **D2** `ev:digest` 缺 `cap` 态 + `mode`/`turns`（VSC turn-cap 可见指示）——desk 链 cap 事实可达性须核；若缺 = 用户可见端差，修之即行为增量 ⇒ 归批建议（B6 ∕ B10 或本批加幅裁定）。
- **D3** `ev:susp` 缺 `interrupted`（VSC X11 中止注记）——同 D2。
- **D4** `ev:tool-result` 缺 `truncated`（VSC 64K 切片点事实旗标）——**归属实核**：切片点 = **VSC 端侧本地字面**（`panel-callbacks.mjs:210-212`：`full.slice(0, 64 * 1024)` ∧ `truncated = full.length > text.length`；恢复面同字面另置 `resultTruncated`——`panel-session.mjs:190-192`）；**核内零同源常量**（核命中项均异机制——「核（两向同源）」原表述收正）⇒ 事实旗标单源 = 端侧本地计算，desk 未载。**修法建议** = desk `ev:tool-result` 补 `truncated`（同点切片 + 同判据；常量提核作两向单源 ∕ 端侧字面同判——实施轮定）；**归批建议** = B6 ∕ B10（或本批加幅——父侧裁）。
- **D5** `ev:tool-call.argsSummary`（宿主摘要）∥ `args`（原文）——摘要层位差；VSC = 原文 + 端渲染 ⇒ 裁（登记 ∕ 对齐）。

### 2.5 受影响文件 · 测试面 · 验收对照 · 波划分

- **受影响文件（实施轮 · 实读定格；行数 = `read` 计（**末空行计**——与本案同口径：`agent-bridge.mjs` **334** ∕ `ipc.mjs` **295** ∕ `IPC.md` **381**）；`≤±N` = 预期增量）**：
  - `thincoder-desktop/src/main/agent-bridge.mjs`（**334**）——A2 ∕ A3 ∕ A6 键面（A6 五键累加全行 `:327-331` + 五键注释 `:322-323`）+ 注释随正 ⇒ **≤±3 ∕ 结构不变**；**超 300 软线档**：本批增量微 ⇒ 拆分计划另议（消解条件 = 该档下次实质改动时）；
  - `thincoder-desktop/src/main/ipc.mjs`（**295**）——A7 读键（`:122`）· A8 出站映射（`:133`）+ 契约注释随正 ⇒ **≤±5 ∕ 结构不变**（保 ≤300 软线——余 5 行）；
  - `thincoder-desktop/src/main/attachments.mjs`（**108**）——A1 解析面（`:66 ∕ :70`）⇒ **≤±3 ∕ 结构不变**；
  - `thincoder-desktop/src/main/agent-host.mjs`（**261**）——A6 令牌表种子（`:101`）+ 回合尾出站单点（`:148`）+ 注释随正（`:140-144`）⇒ **≤±2 ∕ 结构不变**；
  - `thincoder-desktop/src/main/turn-face.mjs`（**141**）——A4 唯一出站点（`:131`）⇒ **≤±1 ∕ 结构不变**；
  - `thincoder-desktop/src/main/timer-watch.mjs`（**77**）——A5 交付点（`:23`）⇒ **≤±1 ∕ 结构不变**；
  - `thincoder-desktop/src/main/turn-chain.mjs`（**100**）——A9 出站帧（`:47-49`——随投影单点）⇒ **≤±1 ∕ 结构不变**；
  - `thincoder-desktop/src/main/turn-driver.mjs`（**276**）——A9 出站投影单点（`:66-70`）+ 供面（`:273`）⇒ **≤±2 ∕ 结构不变**；
  - 渲染面（逐 A 项点名——实施轮照点落）：`renderer/attach.mjs`（**58**——A1 构造面 `:36-45`）· `renderer/mount-composer.mjs`（**244**——A1 注释随正）⇒ 各 ≤±2；`renderer/app.mjs`（**270**——A7 调用点 `:102`）⇒ ≤±1；`renderer/mount-sessions.mjs`（**407**——A8 消费点 `:255 ∕ :259`）· `renderer/events-subscribe.mjs`（**94**——A8 消费点 `:67 ∕ :71`）⇒ 各 ≤±2（`mount-sessions.mjs` = **超 300 软线档**——结构不变 ⇒ 拆分计划另议）；`renderer/events.mjs`（**247**——A2 归约读键 `:140-141` · A4 构造面 `:166 ∕ :170`）⇒ ≤±3；`renderer/events-blocks.mjs`（**136**——A3 消费点 `:89`）⇒ ≤±1；`renderer/events-slices.mjs`（**131**——A6 切片读键 `:32` ∕ `:49-52` + 注释随正 `:27`）⇒ ≤±2；`renderer/queue.mjs`（**46**）· `renderer/views/chat-pending.mjs`（**70**——A9 读点 `:37`）· `renderer/store.mjs`（**299**——注释随正）⇒ A9 合 ≤±6；
  - `docs/desktop/design/IPC.md`（**381**）——逐行契约收正（A1–A9 对应行 + 计数随动；A6 `ev:usage` 行 = `:26 ∕ :71`）⇒ ≤±12；
  - `docs/desktop/design/UI.md`（**656**）——A1 同载行（`:48 ∕ :449`）+ A6 `ev:usage` 键名行（`:51 ∕ :113 ∕ :117`——含产出方坐标收正 `:176 ⇒ :148`）并 W4 ⇒ ≤±3；`docs/desktop/design/PROJECT.md`（**1175**）——A1 同载行（`:60 ∕ :741`）+ A6 键名行（KD-20 `:59` ∕ T-DSK29 `:740`）并 W4 ⇒ ≤±3（`:1019` = 记录面——不改写，述义与 A1 后形态相容）；
  - 批次本地件（新）：`docs/batches/2026-09-29-parity-b8-ipc.test.mjs`（0 → 新建 ≈60–100）；
  - 在位批次本地件（**同改入册——夹具 ∕ 断言随形**）：`docs/batches/2026-09-29-parity-b4-vsc-small.test.mjs`（**222**——A1 夹具 `:34`，调用点随形）≤±2 · `docs/batches/2026-09-29-desktop-window-queue-parity.test.mjs`（**452**——A1 夹具 `:45`；A9 断言 `:249-252`）≤±4 · `docs/batches/2026-09-28-tech-debt-closeout-r7.test.mjs`（**240**——A6 输入夹具 `:73` = 全载荷随形（容器 ∕ `ctxPct` ∕ 五键）；断言面 `:74-76` 零改——内部切片名不随动）≤±1；
- **零改面（备核——勿误改）**：`thincoder-desktop/src/main/sessions.mjs`（**46**——A8 源档零改）· `thincoder-desktop/src/main/window-queue.mjs`（**92**）· `thincoder-desktop/src/main/queued-input.mjs`（**74**）——A9 内部条目形 `{ text, ts }` 保形（在位断言 `2026-09-29-desktop-window-queue-parity.test.mjs:117 ∕ :122 ∕ :141` 面）；`docs/batches/2026-09-28-desktop-session-title.test.mjs`（**285**——A8 直断源档 `.rows`，零动）。
- **测试面**：零集成面（集成面 = 三前端，本批不涉）；批次本地件（单测 · 随批档归档）：① `CHANNELS` ⇔ `HANDLERS` 两向相等（38 = 38）；② `EVENT_CHANNELS` 23 项逐名在场；③ 桥出站 ∕ 载荷键面 = A2 ∕ A3 ∕ A6 新名（直驱桥断言键集——A6 含容器 `usage` ∕ 五键 ∕ `ctxPct`）；④ A1 元素形（dataURL 串入 ⇒ 落盘件出）；⑤ A9 两出站面（`ev:queue.items` ∕ `queueSnapshot`）串数组恰形；**在位批次本地件同改（夹具随形——入册见上）** = `2026-09-29-parity-b4-vsc-small.test.mjs` ∕ `2026-09-29-desktop-window-queue-parity.test.mjs`（A1）· `2026-09-28-tech-debt-closeout-r7.test.mjs`（A6）。
- **验收对照（回指本批条目）**：
  - **AC1** 对照表覆盖 = 请求 38 + 事件 23 + 桥出站 + 注册面两向——逐行在位、零遗漏。
  - **AC2** 差异逐条有裁定；例外各项三件齐；零「登记后保留」无由项（**「有由」判据 = 2.4-B 三件齐 ∨ 2.6 KD-4 判据②**）。
  - **AC3** A1–A9 全落 ⇒ 对照表复跑：键值域行零残留。
  - **AC4** 行为零变：A 项 = 形改义同；批次本地件全绿；在位批次本地件不回归。
  - **AC5** 文档三链同源：本节条目 ↔ 对照表 ↔ `IPC.md` 契约行（三链计数：38 ∕ 23）；**`ev:usage` 行单点核对** = 三链同口径（2.3 #14「对齐」裁定 ↔ 2.4-A6 收正形 ↔ `IPC.md:26 ∕ :71` 收正目标——零「登记」残留）。
  - **AC6** 上抛 D1–D5 逐条有父侧处置（裁 ∕ 归批），零悬置。
- **波划分（实施轮）**：**W1** = A2 ∕ A3 ∕ A4 ∕ A5 ∕ A6（宿主事件键面——`agent-bridge` + `agent-host` + `turn-face` + `timer-watch` + 渲染面 `events.mjs` ∕ `events-blocks.mjs` ∕ `events-slices.mjs`）+ 批次本地件落；**W2** = A1 ∕ A9（载具形面——`renderer/attach.mjs` + `main/attachments.mjs` + `turn-chain.mjs` ∕ `turn-driver.mjs` + `renderer/queue.mjs` ∕ `views/chat-pending.mjs` + 三在位件夹具同改）；**W3** = A7 ∕ A8（请求面载荷键——`ipc.mjs` + 渲染面 `app.mjs` ∕ `mount-sessions.mjs` ∕ `events-subscribe.mjs`）；**W4** = `IPC.md` 逐行收正 + 同载档收正（`UI.md` ∕ `PROJECT.md`）+ 计数随动 + 对照表复跑（AC3 判据）——收口。

> 落档序注（记录面 · 2026-09-29）：本节各件的落盘序 = 2.4-B ∕ C ∕ D → 2.5 → 2.0 → 2.1 → 2.2 → 2.3 → 2.4（标题 + A）→ 2.6 → 2.7（档头骨架占位修复致首两笔 append 被机械拒绝）。**节号即正序**，按节号阅读。

### 2.0 交付形态与口径（对位轮 · 零实施）

- **本批 = 设计轮（评审就绪 · 零实施）**：交付物 = 本节自持（对照表 ∕ 差异裁定表 ∕ 改动面 ∕ 验收 ∕ 波划分）——不另立设计档（先例 = `docs/batches/2026-09-29-parity-closeout.md` §2.0）；持久契约落点 = `docs/desktop/design/IPC.md`（逐行收正随实施轮）。
- **射程 = 载荷契约面**：desk 侧 `thincoder-desktop/src/main/ipc.mjs`（38 请求通道处理体）· `thincoder-desktop/src/main/ipc-registry.mjs`（`HANDLERS` 表 ∕ 注册序）· `thincoder-desktop/src/preload/preload.cjs`（`CHANNELS` 38 ∕ `EVENT_CHANNELS` 23 单源）· `thincoder-desktop/src/main/agent-bridge.mjs`（回调桥出站——annex `:35`）；逐通道对位 VSC `thincoder-vscode/src/extension/panel-messages{,-session,-settings,-turn}.mjs` ∕ `panel-callbacks.mjs` 面（协议档 = `docs/vsc/design/WEBVIEW-PROTOCOL.md` §2 ∕ §3 ∕ §12 ∕ §13）。
- **边界**：**传输层**（Electron IPC `invoke` ∕ `webContents.send` ∥ webview `postMessage`）本身 = 宿主例外（不在射程）；**VSC 侧零触**（对位实盘 = 参照）；**零行为变更**（对齐 = 形改义同——desk 渲染结果与用户可见效果不变）；**零新通道 ∕ 零产品行为增量**。
- **裁定四值**：**对齐**（键值域差异——本批修，见 2.4-A）· **例外·宿主面**（三件齐——2.4-B）· **无对位**（VSC 无此面——登记零动作，2.4-C）· **上抛**（事实缺口 ∕ 行为增量 ∕ 信任边界——父侧裁，2.4-D）。
- **证据标注**：**实读**（本批 2026-09-29 read ∕ grep：desk 四档 + VSC 七档 + 两协议档）· **册引**（设计档坐标；未复勘者逐处明示）。

### 2.1 本批条目（覆盖）与边界

- **覆盖 = B8 三源**：① `parity-closeout` §3③（`ipc.mjs` 载荷契约面——通道名 ∕ 载荷形逐通道对位 ⇒ 全修）；② annex `:35`（回调桥 `agent-bridge.mjs` 载荷契约）；③ annex `:75`（通道注册 ∕ 分发载荷面）。
- **逐通道清点**：**请求面 38 通道**（`ipc-registry.mjs:26-65` 逐行）+ **事件面 23 通道**（`preload.cjs:37-45` 逐行）+ **回调桥出站映射**（`agent-bridge.mjs:163-315`）+ **注册面两向**（`preload.cjs:24-35` ⇔ `HANDLERS` 两向 38 = 38）。
- **不复（届盘实读收正）**：`ipc.mjs:183-186` 注释 `aborted` 半幅 = **已消**（`:186` 含 `aborted`〔跨中止径 ∕ 降级窗后查位〕；`docs/desktop/design/IPC.md:112` 同）——见 2.6-F2。
- **不做**：产品码（零实施）；VSC 侧改动；传输层重构；行为增量。

### 2.2 通道全量对照表 · 请求面（38 通道 · 逐行）

| # | desk 通道 | desk 载荷形（实读） | VSC 对位 | VSC 载荷形 | 差异 | 裁定 |
|---|---|---|---|---|---|---|
| 1 | `config:read` | 无参 →`{config, locale, dict, configured}`（`ipc.mjs:94-99` · `IPC.md:116`） | —（webview 不读 config） | —（`WEBVIEW-PROTOCOL.md` §13 表零 config 读行；收 `i18n` ∕ `agentSettings` ∕ `providerStatus` 推送） | desk 整份 config 直达渲染面（含 provider 密钥原值；遮罩责任在端侧 `maskKey`——`IPC.md:255`）；VSC 密钥零下发 webview | **上抛**（信任边界面——2.4-D1） |
| 2 | `project:open` | `{path?}` →`{cwd, recent}`（`ipc.mjs:116-125` · `IPC.md:121`） | `setProject` | `{fsPath?}`（`panel-messages-session.mjs:101-110`） | 键名 `path`↔`fsPath`；无参径 = 主进程原生对话框（desk）∥ 宿主多根选窗（VSC） | **对齐**（`path`⇒`fsPath`——2.4-A7）+ 宿主面例外（对话框——2.4-B5） |
| 3 | `project:recent` | 无参 →`{cwd, recent}`（`ipc.mjs:127-130` · `IPC.md:122`） | — | — | VSC 无对位（宿主供工作区 ∕ 最近面）；desk 自建（核槽面回读——`IPC.md:225`） | **无对位**（宿主面差·登记——2.4-C） |
| 4 | `sessions:list` | 无参 →`{cwd, rows[], ledger?}`（`ipc.mjs:132-133` · `IPC.md:153-172`） | `sessions`（推） | `{sessions, active, ledger?}`（`panel-session.mjs:262`） | 拉↔推（宿主传输面）；键名 `rows`↔`sessions`；`isActive`（行内 = manifest 活动槽）↔`active`（顶层 = 本面板绑定槽）语义差 | **对齐**（`rows`⇒`sessions`——2.4-A8；1:1 键名差——2.6 KD-4 判据①）；`active` 语义差 = 载体面例外（2.4-B4） |
| 5 | `session:create` | 无参 →信封 `{ok, reason, cwd, slot}`（`ipc.mjs:138` · `IPC.md:161`） | `newSession` | 无载荷（`panel-messages-session.mjs:24-31`） | VSC 无回执（改推 `sessions`）；回执 = invoke 形 | 零差（回执 = 宿主传输面） |
| 6 | `session:switch` | `{slot}`（`ipc.mjs:139` · `IPC.md:161`） | `switchSession` | `{slot}`（`panel-messages-session.mjs:34-73`） | 零键值差 | 零差 |
| 7 | `session:rename` | `{slot, title}`（`ipc.mjs:140-145`） | `renameSession` | `{slot, currentTitle}`（`panel-messages-session.mjs:84-98`） | 标题编辑面 = 渲染面输入（desk）∥ 宿主 `showInputBox`（VSC）；`title`（终值）↔`currentTitle`（现值） | **例外·宿主面**（B5）+ 键名面登记 |
| 8 | `session:delete` | `{slot}`（`ipc.mjs:146-152`） | `deleteSession` | `{slot}`（`panel-messages-session.mjs:76-81`） | 零键值差（desk `last-session` 门 = 行为面·登记） | 零差 |
| 9 | `session:resume` | 无参 →信封（`ipc.mjs:153-162` · `IPC.md:108`（通道行）· `:223`（自动接续注——邻接引法保留）） | —（VSC 打开即 boot——`WEBVIEW-PROTOCOL.md` §4.5） | — | desk 增通道（点开即续） | **无对位**（desk 面·登记） |
| 10 | `approval:respond` | `{promptId, verdict}`（`ipc.mjs:198-201` · `IPC.md:114`） | `permissionResponse` ∕ `batchPermissionResponse` | `{approved: bool‖"approveAll", promptId}` ∕ `{choice, promptId}`（`panel-messages-turn.mjs:179-214`） | 拓扑合流∓分流；单卡值编码 `once‖always‖reject` ↔ `true‖"approveAll"‖false`；批卡闭集已同值（`:213`） | 值面映射登记（1:1 已对齐）；拓扑 = 宿主面例外（2.4-B2） |
| 11 | `question:respond` | `{promptId, answer}`（`ipc.mjs:207-210` · `IPC.md:115`） | `questionResponse` | `{answer, promptId}`（`panel-messages-turn.mjs:157-170`） | 零键值差 | **零差** |
| 12 | `history:page` | `{key, before}` →`{ok, messages, hasOlder, next, meta, flags, queue, seed?}`（`ipc.mjs:172-177` · `IPC.md:111`（通道行；另 `:131-135` 页游标注 · `:185-207` seed ∕ flags 注）） | `loadOlder` →`historyPage` | `{before}` →`{messages, hasOlder, older}`（`panel-session.mjs:195`） | 拉↔推；desk 增键 `next`/`meta`/`flags`/`queue`/`seed`；`older`（旗标）↔`next`（游标） | 拓扑 = 宿主面例外；增键 ∕ 名面 = 登记（端内载具——`older` 旗标 ∥ `next` 游标，值语义不同 ⇒ 2.6 KD-4 判据②(a)） |
| 13 | `msg:send` | `{key, text, images?}`——`images` 元素 `{name, mime, dataURL}`（`ipc.mjs:188` · `IPC.md:112 ∕ 211`） | `userMessage` ∕ `queuedUserMessage` | `{text, model?, reasoning?, provider?, images?}`——`images` = dataURL 串数组（`WEBVIEW-PROTOCOL.md:28` · §3.2 行 16） | ① **`images` 元素形**（对象 ∥ dataURL 串）；② desk 无 `model`/`reasoning`/`provider`（会话级面承载）；③ desk 增 `key` | ① **对齐**（元素形 ⇒ dataURL 串——2.4-A1）；② = 会话级偏好承载面（登记）；③ = 载体面例外（B3） |
| 14 | `msg:interrupt` | `{key, message?}`（`ipc.mjs:192` · `IPC.md:112`） | `abort` ∕ `interrupt` | `—` ∕ `{message}`（`panel-messages-turn.mjs:28-56 ∕ :128-137`） | desk 单通道两义（`message` 缺 ∕ 空 ⇒ 停）；VSC 两消息 | 拓扑 = 宿主面例外；语义 1:1 已对齐 |
| 15 | `provider:list` | 无参 →`{ok, providers[], active, presets[]}`（`ipc.mjs:271` · `IPC.md:239`） | `providerStatus`（推） | `{keyOk, status}`（`settings.mjs:358`） | 拉↔推；行字段（desk `providers` 行 = maskedKey ∕ effort 等） | 拓扑 = 宿主面；行字段 = 端内载具（两向密钥零明文下发——登记） |
| 16 | `provider:save` | `{name, shape, preset?, baseURL?, model?, key?, format?, active?}`（`ipc.mjs:273` · `IPC.md:240`） | `addProvider` ∕ `saveProviderKey` | `{preset‖custom, key}`（`panel-messages-settings.mjs:53-78`）∥ `{name, key}`（`:29`） | desk 合流（`shape` 判别）；VSC 拆两消息；desk 平铺扩展字段 | 拓扑 = 宿主面；键值域 = 登记（合形表入实施轮实读） |
| 17 | `provider:remove` | `{name}`（`ipc.mjs:275` · `IPC.md:241`） | `removeProvider` | `{name?}`（`panel-messages-settings.mjs:81-89`） | 零键值差 | 零差 |
| 18 | `provider:verify` | `{name}` →`{ok, reason?, models?}`（`ipc.mjs:278` · `IPC.md:242`） | `testProvider` ∕ 探针族 | `{baseURL, apiKey, format}` →`testProviderResult`（`panel-messages-settings.mjs:113-117`） | desk 按键名探已配渠道（读账优先）；VSC 按表单入参探 | 宿主面 ∕ 面差·登记（探针面单源 = 核） |
| 19 | `model:list` | `{provider}` →`{ok, models[{id, effortEnum, thinkOff}]}`（`ipc.mjs:280` · `IPC.md:243`） | `models`（推） | `{models, prefs, unavailable?}`（`settings.mjs:401`） | 拉↔推；元素形（desk 逐模型三键 ∕ VSC 模型行） | 拓扑 = 宿主面；元素形登记 |
| 20 | `settings:agent` | `{}` ∕ `{patch}` ∕ `{tier}` → `{ok, fields}` ∕ `{ok, reason, fields}`（`ipc.mjs:282` · `IPC.md:244`） | `getAgentSettings` ∕ `saveAgentSettings` | `{settings}`（`panel-messages-settings.mjs:142-158`） | desk 写形 = 点分 patch / tier 意图级；VSC = settings 对象直传 | 键值域登记（节点形 = desk 面）；拓扑 = 宿主面 |
| 21 | `mcp:list` | 无参 →`{ok, servers[]}`（`ipc.mjs:284` · `IPC.md:245`） | `getMcpStatus`（推） | `mcpStatus`（`panel-mcp.mjs:121`） | 拉↔推 | 拓扑 = 宿主面 |
| 22 | `mcp:save` | `{name, config}` →`{ok, tools?}` ∕ `{ok:false, reason, detail?}`（`ipc.mjs:286` · `IPC.md:246`） | `saveMcpServer` ∕ `editMcp` | `{name, config}`（`panel-messages-settings.mjs:35 ∕ :47`） | 合流（save ∕ edit 两消息）；载荷键 `{name, config}` 同 | 零键值差（拓扑 = 宿主面） |
| 23 | `mcp:remove` | `{name}`（`ipc.mjs:288` · `IPC.md:247`） | `deleteMcpServer` | `{name}`（`panel-messages-settings.mjs:38`） | 零键值差 | 零差 |
| 24 | `config:write` | `{patch}`——仅 `locale`（`ipc.mjs:290` · `IPC.md:238`） | —（语言 = 宿主 `vscode.env.language`） | — | desk 增通道（VSC 语言面由宿主供） | **无对位**（宿主面差·登记） |
| 25 | `ledger:read` | `{cwd?}` →`{ok, counts, thresholdReached}`（`ipc.mjs:292` · `IPC.md:248`） | `ledgerNotice`（推） | `{refused, reason, scene}`（`panel-session.mjs:259-261`） | 拉↔推；面差（desk 计数读数 ∕ VSC 注记） | 拓扑 = 宿主面；面差 = 登记（两向同源核） |
| 26 | `batch:status` | `{cwd?}` →`{ok, phase}`（`ipc.mjs:294` · `IPC.md:249`） | — | — | VSC 无对位（相位面） | **无对位**（登记） |
| 27 | `session:prefs` | `{key, patch}`——三键 `provider`/`model`/`effort`（`ipc.mjs:181` · `IPC.md:174-183`） | `selectModel` ∕ `selectReasoning` | `{model, provider?}` ∕ `{reasoning}`（`panel-messages.mjs:212-244`） | 合流（单通道三键 ∥ 两消息两键）；**键名 `effort`↔`reasoning`** | 拓扑 = 宿主面；键名映射登记（`effort` = 核槽字段名直通 ∕ VSC `reasoning` = 端 UI pref ∕ 逐回合消息键——非同一结构位 ⇒ 2.6 KD-4 判据②(b)；值域 = 核枚举，两向同源） |
| 28 | `subagent:stop` | `{key, id, role?}` →`{ok, reason}`（`ipc.mjs:215` · `IPC.md:113`） | `cancelSubagent` | `{id, role}`（`panel-messages-turn.mjs:59-125`） | desk 增 `key`；`id` 值面 = 与 `ev:subagent` 同源同值（两向同） | 零差（+载体面 B3） |
| 29 | `file:open` | `{path, line?}` →`{ok, reason}`（`ipc.mjs:222-227` · `IPC.md:110`） | `openFile` ∕ `openDiff` | `{path, line?}`（`panel-messages-turn.mjs:140-151`）∥ `{diff}`（`:154`） | `{path, line?}` 逐字同；desk 无 `openDiff` 对位（VSC 编辑器原生 diff 视图） | **例外·宿主面**（B5：编辑器面） |
| 30 | `session:flags` | `{key, patch}` 四键（`ipc.mjs:241` · `IPC.md:123`） | `setPlanMode` ∕ `setAutoApprove` ∕ `setAdvisorGuard` ∕ `setEngineeringEnabled` | `{value}` ×4（`panel-messages.mjs:346-352` · `panel-messages-turn.mjs:173`） | 合流（单通道 patch ∥ 四消息 `{value}`）；四键名已同 | 拓扑 = 宿主面；零键值差 |
| 31 | `at:complete` | `{query, seq}` →`{ok, matches, seq}`（`ipc.mjs:246` · `IPC.md:123`） | `atComplete` →`atResults` | `{query, cwd, seq}` →`{matches, seq}`（`panel-messages-turn.mjs:176` · `panel-index.mjs:80`） | desk 无 `cwd`（主进程态）；回执增 `ok` | 登记（cwd = 载体面；`ok` = invoke 回执面） |
| 32 | `session:gc` | 无参 →`{ok, candidates, …}`（`ipc.mjs:251` · `IPC.md:124`） | —（命令面板 ∕ 宿主命令） | — | VSC 无 webview 对位 | **无对位**（宿主 UI 面·登记） |
| 33 | `session:index` | 无参 →`{ok, sessions, …}`（`ipc.mjs:252` · `IPC.md:124`） | —（同 32） | — | 同上 | **无对位**（登记） |
| 34 | `index:build` | 无参 →`{ok, files, chunks}`（`ipc.mjs:257` · `IPC.md:125`） | `buildIndex` | 无载荷（`panel-messages-settings.mjs:120`） | 零键值差（回执 = invoke 面） | 零差 |
| 35 | `index:status` | 无参 →`{ok, status{built, files, chunks, hasEmbedder}}`（`ipc.mjs:258` · `IPC.md:126`） | `indexStatus`（推） | `{status, hasEmbedder}`（`panel-index.mjs:55`） | 拉↔推；desk 嵌套 `status`；VSC 平铺 | 拓扑 = 宿主面；键面登记（端内读数） |
| 36 | `settings:env` | 三支：读 ∕ `{patch}` ∕ `{testProxy:{uri}}`（`ipc.mjs:265` · `IPC.md:127`） | `saveShellSettings` ∕ `saveProxySettings` ∕ `getShellCandidates` ∕ `testProxy` | `{value}` ∕ `{settings}` ∕ — ∕ `{uri}`（`panel-messages-settings.mjs:188-204` · `panel-messages.mjs:349-355`） | 合流（单通道三支 ∥ 四消息）；键面分合差 | 拓扑 = 宿主面；键值域登记（合形表入实施轮实读） |
| 37 | `settings:tools` | 读 ∕ `{patch:{embedding?, websearch?}}`（`ipc.mjs:266` · `IPC.md:128`） | `saveEmbedKey` ∕ `deleteEmbedKey` ∕ `saveWebsearchKey` ∕ `deleteWebsearchKey` | `{key}` ∕ — ∕ `{key}` ∕ —（`panel-messages-settings.mjs:100-110`） | 合流（patch 形 ∥ 四消息）；desk 空串 = 删键（VSC 独立 delete 消息） | 拓扑 = 宿主面；键值域登记 |
| 38 | `mcp:tools` | `{name}` ∕ `{name, test:true}` → `{ok, tools}` ∕ `{ok, toolCount, latencyMs}`（`ipc.mjs:267` · `IPC.md:129`） | `mcpTools` →`mcpTools` ∕ `testMcp` →`mcpTestResult` | `{name}` →`{name, tools‖error}` ∕ `{name}` →`{…}`（`panel-messages-settings.mjs:126-139 ∕ :50`） | 合流（两用一通道 ∥ 两消息两推）；回执形差 | 拓扑 = 宿主面；回执形登记 |

### 2.3 通道全量对照表 · 事件面（23 通道 · 逐行）

| # | desk 通道 | desk 载荷形（实读） | VSC 对位 | VSC 载荷形 | 差异 | 裁定 |
|---|---|---|---|---|---|---|
| 1 | `ev:token` | `{key, text}`（`IPC.md:53`） | `token` | `{text}`（`panel-callbacks.mjs:140`） | 仅增 `key`（载体面） | 零差 |
| 2 | `ev:reasoning` | `{key, text}`（`IPC.md:54`） | `reasoning` | `{text}`（`panel-callbacks.mjs:144`） | 同上 | 零差 |
| 3 | `ev:activity` | 四形：`{event:"turn", n, max}` ∕ 内联 ∕ `{event:"done"‖"stopped"}` ∕ `{event:"turnBreak"}`（`IPC.md:57-61` · `agent-bridge.mjs:223 ∕ :284`） | `turnFrame` ∕ `loading` ∕ `complete` ∕ `aborted` ∕ `turnBreak` | `{turn, maxTurns}`（`panel-callbacks.mjs:169`）· `complete`（`:230`）· `aborted`（`panel-turn-loop.mjs:154/:169`）· `turnBreak`（`panel-callbacks.mjs:150`） | 拓扑合流∓分流；**`turn` 形键名 `n`/`max` ↔ `turn`/`maxTurns`**；值面：`done`↔`complete` ∕ `stopped`↔`aborted` | **对齐**（键名——2.4-A2）；拓扑 = 宿主面例外；值面映射登记（与核 token 同源） |
| 4 | `ev:subagent` | `{key, role, id, status, model?, pool?, turn?, maxTurns?, kind?, position?, waiting?, reason?, startedAt?, tool?}`（`IPC.md:55` · `agent-bridge.mjs:199-207 ∕ :280`） | `subagent` ∕ `subagentApproval` | `{...info}` ∕ `{id, role, model?, tool}`（`WEBVIEW-PROTOCOL.md:50-51`） | desk 合流（`status:"approval"` + `tool` 键 ∥ VSC 独立消息 + `tool:null` 清态）；`status` 全表单源 = 核 `relayEventToSubPatch`（两向同源） | 拓扑 = 宿主面；值表同源 ⇒ 零值差 |
| 5 | `ev:subchunk` | `{key, role, id, kind, text, sub?, tool?, face?, cmd?}`（`IPC.md:56` · `agent-bridge.mjs:116-133`） | `toolPanel` | `{type, name, kind, text, round, model, sub, tool, cmd, face}`（`WEBVIEW-PROTOCOL.md:49`） | 载体形：desk `role`+`id` 拆键 ∥ VSC `name` 键（`sub:<role>#<id>` 文法）；desk 增 `key`；构造面同形 = 核 relay 先例 | 登记（端内载体——两向同一构造单源） |
| 6 | `ev:tool-call` | `{key, id, name, argsSummary, round?, model?}`（`IPC.md:62` · `agent-bridge.mjs:224-231`） | `toolCall` | `{name, args, round?, model?}`（`WEBVIEW-PROTOCOL.md:37` · `panel-callbacks.mjs:201`） | `argsSummary`（宿主摘要）∥ `args`（原文）；desk 增 `id` | **上抛**（摘要层位待裁——2.4-D5） |
| 7 | `ev:tool-output` | `{key, id, chunk}`（`IPC.md:63`） | `toolOutput` | `{name, text, kind?}`（`WEBVIEW-PROTOCOL.md` §12 行 · `panel-callbacks.mjs:224`） | **`chunk`↔`text`**；desk `id` ∥ VSC `name` | **对齐**（`chunk`⇒`text`——2.4-A3） |
| 8 | `ev:tool-result` | `{key, id, ok, result, links?, subKey?}`（`IPC.md:64` · `agent-bridge.mjs:240-266`） | `toolResult` | `{name, text, truncated?}`（`WEBVIEW-PROTOCOL.md:37 · :426`） | desk 增 `ok`/`links`/`subKey`（宿主计算面）；**VSC 增 `truncated`（64K 切片点事实旗标——desk 无对位）** | VSC 缺键 = **上抛**（2.4-D4）；desk 增键登记 |
| 9 | `ev:approval` | `{key, promptId, shape, tool?, argsSummary?, changes?, batch?{count,tools}, owner?, diff?}`（`IPC.md:66`） | `permissionRequest` ∕ `batchPermissionRequest` | `{tool, args, diff, owner, promptId}` ∕ `{tools, count, promptId}`（`WEBVIEW-PROTOCOL.md:53 ∕ 56`） | 合流（`shape` 判别 ∥ 两消息）；名面 `args`↔`argsSummary`、`diff`↔`changes`；`{count, tools}` 同 | 拓扑 = 宿主面；名面登记（端内摘要面） |
| 10 | `ev:question` | `{key, promptId, question, options}`（`IPC.md:67`） | `question` | `{promptId, question, options}`（`panel-callbacks.mjs:54`） | 仅增 `key` | 零差 |
| 11 | `ev:task` | `{key, items}`（`IPC.md:70` · `agent-bridge.mjs:288`） | `taskProgress` | `{done, inProgress, pending, total, items}`（`panel-callbacks.mjs:155`） | desk 只携 `items`；VSC 携四计数键 | 登记（计数层位 = 端内实现面——非载荷语义） |
| 12 | `ev:susp` | `{key, active, running, queued, pending, done}`（`IPC.md:73`） | `suspension` | `{…counts, active, freeze, interrupted?}`（`WEBVIEW-PROTOCOL.md:60 ∕ :95`） | **desk 缺 `interrupted`（会话中止事实——X11）** | **上抛**（2.4-D3） |
| 13 | `ev:digest` | `{key, status:"start"‖"end", n, tier?, from?, msg?} ∕ {…ok, ms}`（`IPC.md:74`） | `digest` | `{status:"start"‖"end"‖"cap", n, ok?, ms?, mode?, turns?, tier?, from?, msg?}`（`WEBVIEW-PROTOCOL.md:59 · :87`） | **desk 缺 `cap` 态与 `mode`/`turns` 键** | **上抛**（2.4-D2） |
| 14 | `ev:usage` | `{key, percent, tokens?{prompt, completion, reasoningTokens, cacheHit, cacheMiss}, timers?}`（`IPC.md:26 ∕ :71` · `agent-host.mjs:140-148` · `agent-bridge.mjs:322-333`） | `usage` | `{usage{…五键…}, ctxPct, timers}`（`panel-callbacks.mjs:129 ∕ :195`） | 容器名 ∕ 键面字面差（`tokens`↔`usage`；五键 `prompt ∕ completion ∕ reasoningTokens ∕ cacheHit ∕ cacheMiss` ↔ VSC 五键名；`percent`↔`ctxPct`——值面同源 = 核读数投影） | **对齐**（键面全对位 ⇒ VSC 形——2.4-A6；父侧 2026-09-29 三差对齐收编〔§2.9〕） |
| 15 | `ev:error` | `{key, message, techInfo?}`（`IPC.md:72`） | `error` | `{text?, needsSetup}`（`WEBVIEW-PROTOCOL.md:38`） | **`message`↔`text`**；desk `techInfo` 增键；VSC `needsSetup` 增键（desk 对位 = 向导闸——`IPC.md:258`） | **对齐**（`message`⇒`text`——2.4-A4）；增键登记 |
| 16 | `ev:ledger` | `{key, lines[{text,warn}], detailLines}`（`IPC.md:75`） | `ledgerNotice`（+ ledger-surface 面） | `{refused, reason, scene}`（`panel-session.mjs:259-261`） | 面差（desk 行集 ∕ VSC 注记行）；两向同源核（`buildScan` ∕ `ledgerHealth`） | 登记（面差 = 承载面） |
| 17 | `ev:timer` | `{key, text}`（`IPC.md:76`） | `timer` | `{status:"fired", text}`（`WEBVIEW-PROTOCOL.md:101`） | **desk 缺 `status` 键** | **对齐**（补 `status:"fired"`——2.4-A5） |
| 18 | `ev:queue` | `{key, items[{text,ts}], delivered?{text,ts?,degraded?}}`（`IPC.md:77`） | `busyQueued` | `{pending, count?, items?:string[], text?, merged?}`（`WEBVIEW-PROTOCOL.md:63 · §3.2 行 17`） | **元素形：`items` 对象数组 ∥ 串数组**；键面：desk 无 `pending`/`count`/`text`；`delivered`（desk）∥ `merged`（VSC） | **对齐**（`items` 元素形 ⇒ 串数组——2.4-A9）；键面登记 |
| 19 | `ev:flags` | `{key, flags{planMode, autoApprove, advisorGuard, engineering}}`（`IPC.md:78`） | `planMode` ∕ `agentSettings` ∕ `autoApprove` | `{active}` ∕ `{settings}` ∕ `{value}`（`panel-callbacks.mjs:157 ∕ :231 族`） | 合流（单推送 ∥ 分消息）；四键值面同源（槽 ∕ 活值） | 拓扑 = 宿主面；零值差 |
| 20 | `ev:statusText` | `{key, kind, seconds?/message?/phase?done?total?}`（`IPC.md:79` · `agent-bridge.mjs:299-302`） | `statusText` | `{kind, seconds?/message?/phase?done?total?}`（`WEBVIEW-PROTOCOL.md:64`） | 仅增 `key`（R4 已按 VSC 同式落） | 零差 |
| 21 | `ev:compress` | `{key, status, …}` 四态（`IPC.md:80` · `agent-bridge.mjs:305-312`） | `compress` | 四态（`panel-callbacks.mjs:175-183`） | desk 明注同式；仅增 `key` | 零差 |
| 22 | `ev:goal` | `{key, status, objective, criteria}`（`IPC.md:81` · `agent-bridge.mjs:102-109`） | `goal` | `{...info}`（`panel-callbacks.mjs:183`；投影 = `agent.mjs:409-411`） | desk 明注投影逐字同 VSC；仅增 `key` | 零差 |
| 23 | `ev:config` | `{at}`（`IPC.md:82`） | — | — | desk 纯信号（不携 `key`——在册例外）；VSC 无对位 | **无对位**（登记） |

**回执 ∕ 注册面（annex `:75` 载荷面收口）**：白名单两向 = `preload.cjs:24-35`（38 项）⇔ `ipc-registry.mjs:26-65`（`HANDLERS` 38 行）——两条单源零副本（`ipc-registry.mjs:68-76` 注册期 fail-closed）；通道名规约（`ns:verb` ∕ `ev:` 前缀）= 传输注册面（例外·宿主面 B1），与 VSC 消息名（camel 字面量、零注册面）逐行语义对位见上两表。

### 2.4 差异裁定表

#### A · 对齐清单（9 项 · 全部「形改义同 · 行为零变」）

| # | 差异 | 收正形（VSC 参照） | 改动面（拟定——实施轮逐点实读定格） |
|---|---|---|---|
| A1 | `msg:send.images[]` 元素 = `{name, mime, dataURL}` | ⇒ dataURL 串数组（mime ∕ 名从串推——VSC `image-handler` 同法） | **收正形 = 严格串**（两侧同批收紧；「解析面兼收两形」不采——兼容形 = 第二判据残留，与 AC3 零残留相抵）：`main/attachments.mjs:66 ∕ :70`（解析面 ⇒ 直用串）· `renderer/attach.mjs:36-45`（构造面 `toImages` ⇒ 串投影）· `renderer/mount-composer.mjs`（注释随正）· `IPC.md` 附件注 `:211` · **在位件夹具同改入册** = `2026-09-29-parity-b4-vsc-small.test.mjs:34` ∕ `2026-09-29-desktop-window-queue-parity.test.mjs:45` |
| A2 | `ev:activity` `turn` 形 `{n, max}` | ⇒ `{turn, maxTurns}`（VSC `turnFrame`——`panel-callbacks.mjs:169`） | `agent-bridge.mjs:223` · 渲染面 `renderer/events.mjs:140-141`（归约读键随动——内部回合槽 `{n, max}` 不动）· `IPC.md:57` |
| A3 | `ev:tool-output.chunk` | ⇒ `text`（VSC `toolOutput`——`panel-callbacks.mjs:224`） | `agent-bridge.mjs:235` · 渲染面 `renderer/events-blocks.mjs:89`（消费点 `ev.chunk` ⇒ `ev.text`）· `IPC.md:63` |
| A4 | `ev:error.message` | ⇒ `text`（VSC `error`——`WEBVIEW-PROTOCOL.md:38`） | `turn-face.mjs:131`（**唯一出站点**——自 `agent-host.mjs` 提取后；`agent-host.mjs` 全文零 `ev:error`）· 渲染面 `renderer/events.mjs:166 ∕ :170`（`ev.message` ⇒ `ev.text`；块内键 `text` 不动）· `IPC.md:27 ∕ :72` |
| A5 | `ev:timer` 缺 `status` | ⇒ 补 `status:"fired"`（VSC `timer`——`WEBVIEW-PROTOCOL.md:101`） | `timer-watch.mjs:23`（交付点 `post("ev:timer", { key, text })`）· `IPC.md:29 ∕ :76` |
| A6 | **`ev:usage` 载荷键面**（容器 `tokens` ⇒ `usage`；五键 `prompt ∕ completion ∕ reasoningTokens ∕ cacheHit ∕ cacheMiss` ⇒ VSC 五键名；`percent` ⇒ `ctxPct`——`reasoningTokens` 一处 = 本行原案，容器 ∕ 四键 ∕ `ctxPct` 三处 = 父侧 2026-09-29 裁定对齐收编〔§2.9〕；KD-4 判据①） | ⇒ VSC 形：`usage{ prompt_tokens ∕ completion_tokens ∕ reasoning_tokens ∕ prompt_cache_hit_tokens ∕ prompt_cache_miss_tokens }`（`panel-callbacks.mjs:129` `totalUsage` 初始五键 · `WEBVIEW-PROTOCOL.md:88`）；`ctxPct`（`panel-callbacks.mjs:191 ∕ :195`）；值面同源 = 核读数投影（端侧零重算） | **载荷产点**：`agent-host.mjs:148`（出站单点 ⇒ `{ key, ctxPct, usage: { ... }, timers }`）· `agent-host.mjs:101`（令牌表种子五键——防线上残留旧键）· `agent-bridge.mjs:322-331`（五键注释 + 累加五键行）；**渲染面读键随动（端内切片 ∕ 槽名不随动——端内实现面，本行定格）**：`renderer/events-slices.mjs:32`（`tokenReading` 读键五处）· `:49 ∕ :52`（`ev.ctxPct` ∕ `ev.usage` 读键）；注释随正（`agent-host.mjs:140-144` · `agent-bridge.mjs:322-323` · `events-slices.mjs:27`）；`IPC.md:26 ∕ :71`（逐行收正）；**同载行并 W4** = `UI.md:51 ∕ :113 ∕ :117`（含产出方坐标收正 `:176 ⇒ :148`）· `PROJECT.md:59 ∕ :740`；在位件输入夹具同改 = `2026-09-28-tech-debt-closeout-r7.test.mjs:73`（全载荷随形；断言面 `:74-76` 零改——内部切片名不随动） |
| A7 | `project:open.path` | ⇒ `fsPath`（VSC `setProject`——`panel-messages-session.mjs:101-110`） | `ipc.mjs:122`（读键）· 渲染面调用点 `renderer/app.mjs:102`（`{ fsPath: path }`）· `IPC.md:121` |
| A8 | `sessions:list.rows` | ⇒ `sessions`（VSC 回执键——`panel-session.mjs:262`） | **二择固化 = 「handler 重映射（源档零改）」**：`ipc.mjs:133`（出站键 `rows ⇒ sessions`；`sessions.mjs` 与在位件 `2026-09-28-desktop-session-title.test.mjs:140` 零动）· 渲染面 `renderer/mount-sessions.mjs:255 ∕ :259` · `renderer/events-subscribe.mjs:67 ∕ :71` · `IPC.md:155` |
| A9 | `ev:queue.items[]` 元素 = `{text, ts}` | ⇒ 串数组（`ts` 保留于内部载体——宿主队条目 ∕ 读面 `inputSnapshot` ∕ `delivered`；`delivered` 面不变）（VSC `busyQueued`——`WEBVIEW-PROTOCOL.md:63 · §3.2 行 17`） | **出站投影单点 = `turn-driver.mjs:66-70`**（`queueView.snapshot` ⇒ 串数组——两出站面随动：`turn-chain.mjs:47-49`（`ev:queue` 帧）∥ `turn-driver.mjs:273`（`queueSnapshot` 供面））；**`history:page.queue` 随动**（同一镜面单形——`renderer/queue.mjs` `applyQueue` 单写者两源共镜）；`window-queue.mjs ∕ queued-input.mjs` 内部条目形零改（在位断言面）· 渲染面切片 ⇒ `string[]`（`renderer/queue.mjs` · `views/chat-pending.mjs:37` · `store.mjs` 注释）· `IPC.md:77 ∕ :111`；在位件同改 = `2026-09-29-desktop-window-queue-parity.test.mjs:249-252` |

### 2.6 关键决策 · 发现项

- **KD-1 裁定四值口径**：**对齐** = 键值域（字段名 ∕ 值闭集 ∕ 元素形）形改义同（行为零变）；**拓扑 ∕ 载体** = 宿主面例外（三件齐）；**事实缺口** = 上抛。
- **KD-2 证据两级**：实读（本批 2026-09-29）∕ 册引（设计档坐标）——未复勘处逐处标明。
- **KD-3 交付形态**：§2 自持（不另立设计档——先例 `parity-closeout` §2.0）；持久落点 = `docs/desktop/design/IPC.md`。
- **KD-4 键名差异两判据（可判句——裁定可复现面；评审 #144 发现 7）**：
  ① **1:1 键名差 ⇒ 对齐（改名）**：该键与 VSC 侧存在**同读位的对位字段**（同一事实、同层字段、值语义同一），且改名只在转口面落一行映射、两侧内部单源零动。例 = #4 `rows ⇒ sessions`（`sessions:list` 回执对位 VSC `sessions` 推送——同列「会话行表」字段；映射落 handler，源档零改）。
  ② **非 1:1 ⇒ 登记（载 2.4-B 宿主面例外族）**：三因任一命中即归此档——(a) **值语义不同**（`older` 旗标 ∥ `next` 游标——非同一读数）；(b) **键名 = 侧内单源字段名**（`effort` = 核槽字段名直通〔单源 = 核 `SESSION.md` §6.21；`setSlotPrefs` 逐字转口〕——改名即断直通、造第二命名层，且对侧无同一对象可对）；(c) **无对位位**（该载荷在 VSC 侧无同构对象——合流通道的内部合成面）。
  判定序 = 先扫 ② 三因（任一命中 ⇒ 登记），否则落 ①。
- **F1（载体面 · 已裁）**：B8 同题双档并存——本档（`docs/batches/2026-09-29-parity-b8-ipc.md`）∥ `docs/batches/2026-09-29-parity-b8-ipc-contract.md`；父侧 2026-09-29 裁定 = 本档为操作档、`-contract.md` 清退（在案）。
- **F2（届盘实读收正）**：`ipc.mjs:183-186` `aborted` 半幅 = **已消**（`:186` 在；`IPC.md:112` 同）——派单所据与届盘不符 ⇒ 本批零动作。
- **F3（同型发现 · 上抛）**：`docs/batches/2026-09-29-parity-b7-minor.md` 档头同款未填占位（`台账` 行编号占位形）——同族骨架问题（主 agent 笔——随批档头收口；**2026-09-29 11:5x 父侧已填毕**）。
- **F4（边界外登记）**：VSC-only 键面（`openDiff` ∕ `needsSetup` ∕ `syncLive` 等）desk 无对位消费面——不在对齐射程（无对位 = 登记）；若父侧要求收编，另批。

### 2.7 评审范围清单（§3 评审用）

- **对象** = 本段全文（§2.0–§2.6；落档序注见 2.0 前一行）。
- **抽核坐标（desk）**：`ipc.mjs:94-99 ∕ 116-133 ∕ 153-177 ∕ 183-192 ∕ 198-210 ∕ 239-294` · `ipc-registry.mjs:26-76` · `preload.cjs:24-45` · `agent-bridge.mjs:135-315`。
- **抽核坐标（VSC）**：`panel-messages{,-session,-settings,-turn}.mjs` · `panel-callbacks.mjs:54-231` · `panel-session.mjs:195 ∕ 231-262` · `settings.mjs:358 ∕ 401` · 协议档 `WEBVIEW-PROTOCOL.md` §2 ∕ §3 ∕ §12 ∕ §13。
- **判据**：AC1–AC6（2.5）；边界 = 传输面外 ∕ 零行为增量 ∕ 零 VSC 侧触。

### 2.8 修正块（评审 #144 · 轮次 1 · 九条逐条落位 · 2026-09-29 · eng-designer）

> **段位与形式**：本段 = 评审 #144（§3 轮次 1 · changes-required · 🔴2 · 🟡6 · 🔵1 = 9 条）逐条落位——**段内就地修正**（本作者段内；失效表述不留节面——承 2026-09-18 失效表达裁定；原行可由 git 历史逐字复核）+ 本块逐条记录；**零新语义**（只落评审九条 + 父侧裁定「1–9 全收」）；产品码 ∕ 实施 ∕ 评审点火零动；§1 ∕ §3–§6 零触；其它批射程零触。本轮坐标 = 修正轮实读（2026-09-29）。

| # | 级别 | 落位（号 → 改动 file:line） |
|---|---|---|
| 1 | 🔴 | 受影响表重写（本节 `:44-58`——原 `:44-52`）：逐档实读行数 + `≤±N ∕ 结构不变`（口径 = `read` 计 ∕ **末空行计**）；渲染面改列具体档 = `renderer/attach.mjs:36-45`（A1 构造）· `renderer/app.mjs:102`（A7 调用）· `renderer/mount-sessions.mjs:255 ∕ :259`（A8 消费）· `renderer/events-subscribe.mjs:67 ∕ :71`（A8 补点）· `renderer/events.mjs` ∕ `events-blocks.mjs:89` ∕ `events-slices.mjs:32` ∕ `queue.mjs` ∕ `views/chat-pending.mjs:37` ∕ `mount-composer.mjs` ∕ `store.mjs`；两在位件入册（`2026-09-29-parity-b4-vsc-small.test.mjs` ∥ `2026-09-29-desktop-window-queue-parity.test.mjs`）+ A6 在位件（`2026-09-28-tech-debt-closeout-r7.test.mjs`）；拆分说明 = `agent-bridge.mjs`（334 > 300 软线）· `mount-sessions.mjs`（407）；标数统一（334 ∕ 295 ∕ 381）；`sessions.mjs` ∕ `window-queue.mjs` ∕ `queued-input.mjs` 移入零改面。 |
| 2 | 🔴 | 落点三处收正（2.4-A `:168 ∕ :170 ∕ :173`）：① A4 ⇒ `turn-face.mjs:131`（唯一出站点）+ 渲染面 `events.mjs:166 ∕ :170`；② A6 补 `agent-host.mjs:101` ∕ `IPC.md:26`，切片刻键定格 = **读键随动（`events-slices.mjs:32`）· 切片内部键名不随动**；③ A9 ⇒ 出站投影单点 `turn-driver.mjs:66-70`（两出站面 `turn-chain.mjs:47-49` ∕ `turn-driver.mjs:273` 随动）、**`history:page.queue` 裁定 = 随动**（镜面单形）、`window-queue.mjs ∕ queued-input.mjs` 内部形零改（在位断言面）。 |
| 3 | 🟡 | A8 二择固化 = **「handler 重映射（源档零改）」**（2.4-A8 `:172`）——`sessions.mjs` ∕ `2026-09-28-desktop-session-title.test.mjs:140` 零动。 |
| 4 | 🟡 | A1 收正形定格 = **严格串 + 两件夹具同改入册**（2.4-A1 `:165` + 2.5 `:57 ∕ :59`）——「解析面兼收两形」不采（理由注于 A1 行）。 |
| 5 | 🟡 | 文档面并 W4：`UI.md:48 ∕ :449` ∕ `PROJECT.md:60 ∕ :741` 入 W4 收正清单 + 受影响表（`PROJECT.md:1019` = 记录面——不改写，述义与 A1 后形态相容）。 |
| 6 | 🟡 | IPC.md 坐标收正：`file:open` 行 `:123 ⇒ :110`（2.2 #29 `:118`）· `history:page` 行 `:164-171 ⇒ :111`（2.2 #12 `:101`；保留 `:131-135 ∕ :185-207` 邻引）· `session:resume` 保留邻接引法 + 补通道行 `:108`（2.2 #9 `:98`）。 |
| 7 | 🟡 | 裁定口径 = **新增 KD-4 键名差异两判据**（2.6 `:180-183`）+ 三行挂判据（2.2 #4 `:93` ∕ #12 `:101` ∕ #27 `:116`）+ AC2「有由」判据挂 KD-4（`:62`）。 |
| 8 | 🟡 | D4 证据收正（2.4-D `:39`）：切片点 = 端侧本地字面（`panel-callbacks.mjs:210-212`）+ 核内零同源常量；补修法 ∕ 归批建议。 |
| 9 | 🔵 | §2.3 七处 VSC 坐标顺收（`:133 ∕ :134 ∕ :135 ∕ :138 ∕ :139`——`panel-callbacks.mjs:140 ∕ :144 ∕ :150 ∕ :169 ∕ :201 ∕ :224 ∕ :230`）+ AC5 措辞 = 三链计数（38 ∕ 23）（`:65`）。 |

**本轮发现（已裁——父侧 2026-09-29 = 三处对齐收编）**：`ev:usage` 行（2.3 #14）同类字面差残留三处（均非评审 #144 射程）：① 令牌袋容器名 `tokens` ↔ VSC `usage`；② 四键字面差——desk `prompt ∕ completion ∕ cacheHit ∕ cacheMiss` ↔ VSC `prompt_tokens ∕ completion_tokens ∕ prompt_cache_hit_tokens ∕ prompt_cache_miss_tokens`（`panel-callbacks.mjs:129` totalUsage 初始五键；desk 五键面 = CLI 同源映射 `thincoder-cli/src/tui/tool-events.mjs:400-405`）；③ `percent ∕ ctxPct`。**裁决 = 三处对齐收编**（KD-4 判据①适用——判例 = A6 键面量名对齐；行为零变）；落位 = 2.4-A6（并入）+ 2.5（受影响表 ∕ 测试面 ∕ AC5）+ §2.9（逐项落位表）；`IPC.md` ∕ `UI.md` ∕ `PROJECT.md` 的逐行收正 = 实施轮 W4 面（坐标入 A6 行）。

**零改面实测**：产品码 ∕ 实施零动；§1 ∕ §3–§6 零触；其它批射程零触；档内改动 = 段内就地修正 + 本块。

### 2.9 补录（父侧裁定 · `ev:usage` 三差对齐收编 · 2026-09-29 · eng-designer）

> **来源与形式**：父侧 2026-09-29 裁定（应 §2.8 `:212` 登记项上报）= `ev:usage` 同类字面差三处**对齐收编**——① 容器名 `tokens ↔ usage`；② 四键 `prompt ∕ completion ∕ cacheHit ∕ cacheMiss ↔ VSC 键面`；③ `percent ↔ ctxPct`。判例 = A6（键面量名对齐 · 行为零变——desk 产点 ∕ 渲染面消费点同源随动）；KD-4 判据①（1:1 键名差 ⇒ 对齐）适用 ⇒ 对齐支。本块 = 落位记录：**零新语义**（只落裁定 + 登记三处）；产品码 ∕ 实施零动；§1 ∕ §3–§6 零触。

**三处落位（项 → 收正坐标）**：

| # | 项（§2.8 登记） | 设计面落位 | 收正坐标 file:line（实施轮） |
|---|---|---|---|
| 1 | 容器名 `tokens` ⇒ `usage` | 2.3 #14（裁定列）· 2.4-A6（差异 ∕ 收正形 ∕ 改动面） | `agent-host.mjs:148`（出站容器键）· `renderer/events-slices.mjs:52`（读键 `ev.usage`） |
| 2 | 四键 ⇒ VSC 键面（`prompt_tokens ∕ completion_tokens ∕ prompt_cache_hit_tokens ∕ prompt_cache_miss_tokens`） | 同上 + 2.5（受影响表 ∕ 测试面 ∕ AC5） | `agent-host.mjs:101`（令牌表种子）· `agent-bridge.mjs:327-331`（累加五键行）· `renderer/events-slices.mjs:32`（读键）· 在位夹具 `2026-09-28-tech-debt-closeout-r7.test.mjs:73`（全载荷随形；断言面 `:74-76` 零改） |
| 3 | `percent` ⇒ `ctxPct` | 同上 + 同载行（`UI.md:51` · `PROJECT.md:59 ∕ :740`） | `agent-host.mjs:148`（出站键）· `renderer/events-slices.mjs:49`（读键 `ev.ctxPct`） |

**行为零变（判据）**：纯键面 ∕ 名对齐——desk 内部消费面同源随动（读键随动 · 端内切片 ∕ 槽名不随动——同 A6 定格）；有效读数门（数字 ∧ `> 0`）· 零节点律 · 读数域 0–100 零改。

**零改面实测**：产品码 ∕ 实施零动；§1 ∕ §3–§6 零触；档内改动 = 2.3 #14 ∕ 2.4-A6 ∕ 2.5（受影响表 + AC5）就地修正 + §2.8 登记项状态随正 + 本块。

### 2.10 W4 文档收正轮（A1–A9 实施终态随动 · 2026-09-29 · eng-designer）

> **来源与形式**：父侧派单「B8 文档轮 W4」（W1 ∕ W2 ∕ W3 全落、§5 在册后回填）。**零新语义**（只落 A1–A9 实施终态的文档面随动 + 计数随实读 + 坐标重锚）；产品码 ∕ 测试件 ∕ §1 ∕ §3–§5 ∕ §6 ∕ 其它批射程零触。**落笔 = 届盘实读**（先 read 后 edit）+ read-back 逐处核过。

**逐处落位（旧 ⇒ 新 · file:line）**：

- **IPC.md（394 ⇒ 398；档头 `ipc.mjs` 计数 303 ⇒ 308 实读 ∕ `:71` 行宽收正 +1 行 ∕ 变更记录 +3 行）**：`:3` 档头计数 · `:26` `ev:usage` 五键 ⇒ VSC 键面（含 `onUsage` 坐标 `agent.mjs:353 ⇒ agent/turn-loop.mjs:154` · CLI 映射 `:400-405 ⇒ :405-411`）· `:27` `ev:error` 产出方 ⇒ `turn-face.mjs:131`〔唯一出站点〕· `:29` `ev:timer` 载荷 ⇒ `{ key, status:"fired", text }`（A5）· `:30` `ev:queue` `items` ⇒ 串数组（A9）· `:57` `ev:activity` turn ⇒ `{turn, maxTurns}`（A2）· `:63` `ev:tool-output` ⇒ `text`（A3）· `:71` 载荷键集 ev:usage（VSC 键面 + 行宽收正）· `:72` `ev:error` ⇒ `{ key, text }`（A4）· `:76` ∕ `:77` 键集同拍 · `:111` `history:page.queue` ⇒ 串数组（A9）· `:122` `project:open` ⇒ `{ fsPath }`（A7）· `:157` ∕ `:162` `sessions:list` ⇒ `{ cwd, sessions }`（A8）· `:213` ∕ `:215` 附件注 ⇒ 严格 dataURL 串数组（A1）· `:227` 项目面注 ⇒ 请求 `fsPath` · `:395-397` 变更记录一条（三行）。
- **UI.md（687 ⇒ 689；变更记录 +2 行）**：`:48` 附件条出口 ⇒ dataURL 串数组（A1）· `:110` 耗时源坐标 `events.mjs:316 ⇒ :155` · `:112` 段 7 载荷 ⇒ `{turn, maxTurns}`（槽内 `{n, max}` 不随动）+ 坐标 `:314 ⇒ :152-153` · `:113` 段 8 载荷 `tokens ⇒ usage`（五键 VSC 键面）+ 产出方 ∕ CLI 坐标重锚 · `:117` 段 12 坐标 `:176 ⇒ :148` · `:291` ∕ `:292` ∕ `:439` ∕ `:520` ∕ `:543` 队列镜面 `pending` 切片 ∕ 快照形 `{ text, ts } ⇒ string[]`（A9）· `:449` 窗队列条目 ⇒ 串数组（A1）· `:687-688` 变更记录一条（两行）。
- **PROJECT.md（1228 ⇒ 1230；变更记录 +2 行）**：`:59` KD-20 `percent ⇒ ctxPct` · `:60` KD-21 附件元素形 ⇒ dataURL 串数组（A1）· `:202` §4.1 `events.mjs` 行 `ev:error` 键面 `message ⇒ text`（A4）· `:668` §6.1 D4 行队列条目形 ⇒ 文本串（A9）· `:770` ∕ `:771` ∕ `:774` 用例表 T-DSK29 ∕ T-DSK30 ∕ T-DSK33 随正 · `:1227-1228` 变更记录一条（两行）。

**§2.5 在位件清单随动（补登——#174 报 ∕ 承 §5.9）**：在位件同改入册清单增两项 = `docs/batches/2026-09-28-desktop-session-title.test.mjs:245`（父侧 2026-09-29 裁定随形）· `docs/batches/2026-09-29-send-busy-timing.test.mjs:42`（同判例随形——设计漏登；A1 严格串下旧对象夹具静默丢图）。

**计数随动**：三档白名单计数实读 = **39**（`model:catalog` 落位后的现值——§2.5 ∕ AC1 ∕ AC5 所记 38 = 设计时读数；交 §6 收口按 39 口径〔承 §5.7-1〕）；事件面 23 不变。

**对照表复跑（AC3 判据 · 键值域行零残留）**：旧形 token 全域拖网（`{ n, max }`（载荷位）· `chunk`（ev:tool-output 径）· `{ key, message }`（ev:error 径）· `percent` ∕ `tokens`（ev:usage 径）· `{ cwd, rows }` · `{ path }` · `{ name, mime, dataURL }` · `[{ text, ts }]`）——**规范面零命中**；余命中 = 记录面留档（IPC.md `:300 ∕ :314 ∕ :394` 变更记录——历史记法不改写）。**一处列报留项**：UI.md`:180` `percent ≤ 0`（D17 播种注——指 `sessionReading` 读数非载荷键；非 A6 射程——零动作）。

**机检（`node scripts/doc-check.mjs` · docs 域 · 落笔后实跑）**：行宽 **67 ⇒ 66**（Δ −1——IPC.md `:71` 收正）；锚悬空 **146 ⇒ 146**（Δ 0；首轮新引 `turn-face.mjs:131` 裸名致 +1，改全路径 `thincoder-desktop/src/main/turn-face.mjs:131` 后归位）。三档新增 ⚠ 报告面行（`ctxTokens` 等符号·宽——不入闸）照报。

**并行写者（在册）**：落笔期间工具报并行实例（desktop pid=2144）对 IPC.md ∕ UI.md 持写入意向（未阻塞）；本卷写面已 read-back 核验——复读核归 §6 收口（父侧在册）。

**行为零变（判据）**：纯文档面——产品码 ∕ 测试件 ∕ 通道数（23）∕ 白名单（39）零动；坐标重锚皆同点。

**零改面实测**：产品码 ∕ 测试件零动；§1 ∕ §3–§5 ∕ §6 零触；其它批射程零触；档内改动 = 三档契约行 ∕ 用例表行 + 三档变更记录 + 本块。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**对象** = `docs/batches/2026-09-29-parity-b8-ipc.md` §2 全文（含 D1–D5 上抛处理）。抽核 = 设计 §2.7 列出的 desk ∕ VSC ∕ 协议档坐标（逐处复勘）。

| # | Category | Severity | Issue | Suggestion |
|---|---|---|---|---|
| 1 | 受影响文件（准则 8） | 🔴 | 受影响文件表（:44-52）**零 expected delta**；7 个署名源档中 5 个只标「册引」（无现行行数）；渲染面以通配符给出（:50），而实读消费点落在枚举之外——A1 构造面实为 `renderer/attach.mjs:36-45`（`toImages` 逐项 `{name,mime,dataURL}`）、A7 调用点 = `renderer/app.mjs:102`、A8 消费点 = `renderer/mount-sessions.mjs:255 ∕ :259`；标数亦与盘差一（`agent-bridge.mjs` 末行为空行 ⇒ 334 ≠ 标注 333；`ipc.mjs` 295 ≠ 294） | 逐档补「现行行数 + `≤±N` ∕ 结构不变」；渲染面改列具体档（至少补 `renderer/attach.mjs` ∕ `app.mjs` ∕ `mount-sessions.mjs`）；>300 行档（`agent-bridge.mjs`）补拆分说明 |
| 2 | 改动面落点 | 🔴 | A 项落点三处与盘面不符：① A4（:162）指 `agent-host.mjs`，而 `ev:error` 唯一出站点 = `turn-face.mjs:131`（该档 :20 自注「自 `agent-host.mjs` 提取后为 `ev:error` 唯一出站点」；`agent-host.mjs` 全文零 `ev:error`），`turn-face.mjs` 未入册；② A6（:164）只列 `agent-bridge.mjs:329`，会话令牌表字面在 `agent-host.mjs:101`（`{…, reasoningTokens: 0, …}`）——只改累加行 ⇒ 线上残留旧键，与 AC3「键值域行零残留」（:57）相抵；③ A9（:167）指 `window-queue.mjs ∕ queued-input.mjs（构形）`，而帧构造单点 = `turn-chain.mjs:47-49`（`window-queue.mjs:14-15` 自注「帧构造单点保位 `turn-chain.mjs`，本档只定点不造形」）、并源快照在 `turn-driver.mjs:66-70`——按所写改 `window-queue.mjs:88 ∕ queued-input.mjs:39` 会破在位断言（`2026-09-29-desktop-window-queue-parity.test.mjs:117 ∕ :122 ∕ :141`）并连带改 `history:page.queue`（`turn-driver.mjs:273` ∕ `IPC.md:111` 记 `[{ text, ts }]`），与同条自述「`ts` 保留于内部载体」相抵 | 三处落点按盘面收正：A4 ⇒ `turn-face.mjs:131`（+ 渲染面 `events.mjs:170`）；A6 ⇒ 补 `agent-host.mjs:101` ∕ `IPC.md:26`，并定格 `renderer/events-slices.mjs:32` 切片刻键是否随动（随动 ⇒ 涉 `2026-09-28-tech-debt-closeout-r7.test.mjs:73-75`）；A9 ⇒ 点名 `turn-chain.mjs:47-49`（∪ `turn-driver.mjs:66-67`）并裁 `history:page.queue` 元素形是否随动 |
| 3 | 改动面落点 | 🟡 | A8（:166）只列 `ipc.mjs:133`，但 `rows` 键成于 `sessions.mjs`（`ipc.mjs:132` 转口；`2026-09-28-desktop-session-title.test.mjs:140` 直断 `listSessions(…).rows`）——源档改名 ⇒ 该在位件红；handler 重映射 ⇒ 绿；二择未定格 | 明写落点取「handler 重映射（源档零改）」或「源档改名 + 在位件同改」，二选一固化 |
| 4 | 验收 ∕ 测试面 | 🟡 | AC4「在位批次本地件不回归」（:58）与 A1（:159）张力：解析面（`attachments.mjs:66 ∕ :70` `list.map((item) => item?.dataURL)`）收紧为串后，`2026-09-29-parity-b4-vsc-small.test.mjs:34 ∕ :173` 与 `2026-09-29-desktop-window-queue-parity.test.mjs:45 ∕ :139 ∕ :143-145 ∕ :158 ∕ :174` 的 `{name,mime,dataURL}` 夹具不再产出 `paths` ⇒ 两件红；设计未给兼容形 ∕ 夹具同改判据，两件亦未入册 | 定一句收正形（严格串 + 两件夹具同改入册，或解析面兼收两形并注理由），受影响在位件一并列入测试面 |
| 5 | 文档面（同一机制多处描述） | 🟡 | A1 改 `msg:send.images` 元素形，该形同载于 `docs/desktop/design/UI.md:48 ∕ :449`、`PROJECT.md:60`（KD-21）`∕ :741`（T-DSK30）`∕ :1019`；W4（:61）只收 `IPC.md` ⇒ 实施后同形多档并存不同描述（AC5 三链自检不覆盖） | 把上述同载行并 W4 收正清单（或明记随 doc-sync 批延期 + 判据） |
| 6 | 对照表坐标 | 🟡 | 两处 `IPC.md` 行坐标指向他行：请求面 #29 `file:open` 引 `IPC.md:123`（:112）——`:123` 实为 `session:flags ∕ at:complete` 行（`file:open` 行 = `IPC.md:110`）；#12 `history:page` 引 `IPC.md:164-171`（:95）——该区为「会话族注」项 5 ∕ 6（`cwd` 空档 ∕ 账本注记），该通道行 = `IPC.md:111`（另 `:131-135` 页游标注 ∕ `:185-207` seed ∕ flags 注） | 两处坐标按盘面收正；顺检 `session:resume` 引 `:223`（该通道行 = `:108`）是否保留邻接引法 |
| 7 | 裁定口径一致性 | 🟡 | 同性质（键名）差异处置不一：#4 `rows ⇒ sessions` 判「对齐」、#27 `effort ↔ reasoning`（:110）判「键名映射登记（零动作）」、#12 `older ↔ next`（:95）判登记——与 KD-1「对齐 = 键值域（字段名 ∕ 值闭集 ∕ 元素形）」（:171）及 closeout §2.9「非宿主约束部分（载荷契约…）一律判入全修」（`2026-09-29-parity-closeout.md:175`）两处判据冲突；AC2「零『登记后保留』无由项」的「有由」标准未落成可判句 | 给 2–3 条同类差异补一行裁定依据（谁属宿主面 ∕ 谁属 1:1 键名差），使 #27 ∕ #12 与 #4 同判据可复现 |
| 8 | 上抛项证据（D4） | 🟡 | D4（:39）「切片事实 = 核（两向同源）」未见盘面坐标：64K 切片点在 VSC 端 `panel-callbacks.mjs:210-212`（局部字面 `64 * 1024`；`truncated = full.length > text.length`），核内无同源常量（`thincoder-core` 命中项均异机制）——「核」字面待核；D4 亦为五条中唯一未给修法 ∕ 归批指向者 | 把「核 ∕ 端」归属与常量单源写成可核句，并给 D4 补修法 ∕ 归批建议（同 D1 ∕ D3 ∕ D5 形） |
| 9 | 数值 ∕ 坐标漂移 | 🔵 | 标数与盘差一（`agent-bridge.mjs` 333↔334 ∕ `ipc.mjs` 294↔295 ∕ `IPC.md` 380↔381，末行为空行所致）；§2.3 若干 VSC 坐标差 1–2 行（`panel-callbacks.mjs:141→140 ∕ :145→144 ∕ :151→150 ∕ :170→169 ∕ :199→201 ∕ :222→224 ∕ :228→230`）；AC5（:59）内「（D3 计数一致：38 ∕ 23）」的「D3」与上抛项 D3 同名易混 | 统一行数口径（末空行计 ∕ 不计）并顺收坐标；AC5 措辞改为三链计数（38 ∕ 23） |

**核过无异议面**（抽核命中）：请求面 38 行 ∕ 事件面 23 行与 `ipc-registry.mjs:26-65` ∕ `preload.cjs:24-45` 逐项同值；desk 侧坐标（`ipc.mjs:94-99 ∕ 116-133 ∕ 153-177 ∕ 183-192 ∕ 198-210 ∕ 239-294` · `agent-bridge.mjs:102-109 ∕ 116-133 ∕ 163-315 ∕ 223 ∕ 235 ∕ 329` · `ipc-registry.mjs:68-76`）逐行复勘一致；F2（`ipc.mjs:186` 含 `aborted` + `IPC.md:112` 同）成立；D1（`config:read` 整份 config 达渲染面：`ipc.mjs:94-99` ↔ `app.mjs:204-206`；VSC §13 无 config 读行，`i18n` ∕ `agentSettings` ∕ `providerStatus` 推送在册）、D2 ∕ D3 ∕ D5（`WEBVIEW-PROTOCOL.md:59 · :87 ∕ :60 · :95 ∕ :37`）证据成立；A7 对位 `panel-messages-session.mjs:101-110`（`msg.fsPath`）、A5 `WEBVIEW-PROTOCOL.md:101`、A6 `:88`、A9 `:63 · §3.2 行 17`、A2 `:65`、A1 `:28 · §3.2 行 16` 逐条实盘；B 族三件齐（B1–B6）与 C 族 7 项清点（含 `ev:config`）与两表裁定列自洽。

**计数**：🔴 2 · 🟡 6 · 🔵 1（共 9 条）。

VERDICT: changes-required

### 轮次 2（评审子代理）

**对象** = `docs/batches/2026-09-29-model-menu-parity.md`（本轮点名评审面——全档 30 行）＋ 上一轮（对象 = `docs/batches/2026-09-29-parity-b8-ipc.md` §2 · 评审 #144 · 九条）逐条复核（本轮实读）。

**表 A · 本轮评审面（`2026-09-29-model-menu-parity.md`）**

| # | Category | Severity | Issue | Suggestion |
|---|---|---|---|---|
| 1 | 交付面·设计未落 | 🔴 | §2 全为占位（`:25` `<§2 模板占位：本批条目（覆盖） / 设计档落点 / …>`；`:24` 状态行 = `（eng-designer 写入时更新）`）+ §3–§6 空 + §1 状态行仍 `🔄 进行中（…）`（`:6`）⇒ 零设计内容（无覆盖条目 ∕ 无机制设计 ∕ 无受影响文件与测试面 ∕ 无验收对照 ∕ 无上抛项）；设计档全库仅本件（`thincoder/docs/batches/2026-09-29-model-menu*` glob = 1 命中）⇒ 设计评审无可审对象（点火先于设计交付） | 待 §2 由 eng-designer 落定后重新点火设计评审；本轮不批 |
| 2 | 档面卫生 | 🔵 | `:7` §1 模板占位行仍在位（而 §1 已有 1.1–1.3 实内容）；`:6` 状态行值为占位「…」（同族先例 = `parity-b7-minor` 档头占位 / `parity-b8-ipc` F3 在册） | §1 定稿随行清占位行 + 状态行落值 |

**表 B · 上一轮九条复核（对象 = `parity-b8-ipc.md` §2 修正轮 1／九号 + 补项；本轮实读）**

| # | 原号 | 状态 | 依据（本轮实读） |
|---|---|---|---|
| 1 | 1 🔴 | Fixed | `:44-58` 逐档现行行数 + `≤±N ∕ 结构不变` + 渲染面 11 档点名 + 两在位件入册 + 超 300 档拆分说明；抽核 11 档全合（`agent-bridge` 334 ∕ `agent-host` 261 ∕ `turn-face` 141 ∕ `turn-chain` 100 ∕ `events-slices` 131 ∕ `attach` 58 ∕ `events.mjs` 247 ∕ `events-blocks` 136 ∕ `mount-sessions` 407 ∕ `IPC.md` 381 ∕ `queue.mjs` 46） |
| 2 | 2 🔴 | Fixed | A4 ⇒ 实读 `turn-face.mjs:131` = `else post("ev:error", { key, message: String(err?.message ?? err), ...techInfoOf(err) })`；A6 ⇒ 实读 `agent-host.mjs:101` 五键种子 + `:148` 出站 + `agent-bridge.mjs:322-323 ∕ :327-331` + `IPC.md:26`；A9 ⇒ 实读 `turn-driver.mjs:67 snapshot: (key) => [...queued.snapshot(key), …]` + `turn-chain.mjs:49 items: queue.snapshot(key)` + `history:page.queue` 随动裁定 |
| 3 | 3 🟡 | Fixed | `:172` 二择固化 = handler 重映射（源档零改）；`sessions.mjs` ∕ `desktop-session-title.test.mjs:140` 入零改面（`:58`） |
| 4 | 4 🟡 | Fixed | `:165` 严格串 + 两夹具入册；实读两夹具 = `({ name: n, mime: "image/png", dataURL: PNG })`（`:34` ∕ `:45`） |
| 5 | 5 🟡 | Fixed | `:55` UI.md `:48 ∕ :449 ∕ :51 ∕ :113 ∕ :117` 实读命中 + `:176 ⇒ :148` 产出方坐标收正与 `agent-host.mjs:148` 实读相符；PROJECT.md `:60 ∕ :741 ∕ :59 ∕ :740` 实读命中；W4 并入（`:67`） |
| 6 | 6 🟡 | Fixed | 实读 `IPC.md:110` = `file:open` 行 ∕ `:111` = `history:page` 行 ∕ `:108` = `session:resume` 行（引法收正） |
| 7 | 7 🟡 | Fixed | `:180-183` KD-4 两判据 + #4 ∕ #12 ∕ #27 挂判据 + AC2 挂钩（`:62`） |
| 8 | 8 🟡 | Fixed | `:39` D4 = 端侧本地字面（`panel-callbacks.mjs:210-212`）+ 核内零同源常量 + 修法 ∕ 归批建议 |
| 9 | 9 🔵 | Fixed | 标数统一「末空行计」；§2.3 坐标顺收（实读 `panel-callbacks.mjs:140` token ∕ `:169` turnFrame）；AC5 = 三链计数（38 ∕ 23） |
| 10 | (new) | 🔵 | 标数「as-of 修正轮实读」与盘面漂移（修正轮 295 → 本轮 299 间有并发编辑在场）：`ipc.mjs` 实读 299（注 295；A7 读键实读落 `:123`、A8 源 `:137 function sessionList()`）；`turn-driver.mjs` 实读 277（注 276；`queueSnapshot` 实读 `:274` 非 `:273`）；`UI.md` 实读 665（注 656）；`PROJECT.md` 实读 1177（注 1175） | 实施轮照档内既有「实读定格」纪律复读后再落（A7 ∕ A8 键位 + `queueSnapshot` 供面为必复点） |
| 11 | (new) | 🟡 | 协调项：`ipc.mjs` 存在飞编辑面（同批外），B8 的 W3（A7 ∕ A8）须与之串行、落前复读键位 | 调度串行确认后再点火实施 |

**计数**：表 A = 🔴 1 · 🔵 1；表 B 新增 = 🟡 1 · 🔵 1；上一轮九条 = 9 ∕ 9 Fixed（合计 4 条新发现）。

**旁核（对象外 · 供参考）**：`model-menu-parity` §1 诊断链实读成立（`renderer/composer-sync.mjs:152` 端差登记注 ∕ `:159` 单渠 `model:list`；VSC 对位 `provider-probe-window.mjs` 在位 + `settings.mjs:387-401` 全渠扇出 `allModels = names.flatMap(...)`）——阻塞点 = 设计未交付，非内容失真。

VERDICT: changes-required

### 轮次 3（评审子代理）

**对象** = `docs/batches/2026-09-29-parity-b8-ipc.md` §2 修正轮 1（`:196-214`）＋ §2.9 补录（`:216-230`）——签发复核（轮 3 · 严格核验：九条 ＋ §2.9 落地 ＋ 明显新问题面）。依据 = 本轮实读（批档全文 ＋ 源档抽核 20+ 档）。

**九条核验（逐条实读）**：1 Fixed（`:44-58` 逐档行数 ＋ `≤±N ∕ 结构不变` ＋ 渲染面逐档点名 ＋ 两在位件入册 ＋ 超 300 拆分说明；抽核：`agent-bridge` 334 ∕ `agent-host` 261 ∕ `turn-face` 141 ∕ `turn-chain` 100 ∕ `attachments` 108 ∕ `renderer/attach` 58 ∕ `app` 270 ∕ `mount-sessions` 407 ∕ `events-subscribe` 94 ∕ `events-slices` 131 ∕ `events.mjs` 247 ∕ `events-blocks` 136 ∕ `chat-pending` 70 ∕ `IPC.md` 381 ∕ 三在位件 222 ∕ 452 ∕ 240 全合）· 2 Fixed（A4 实读 `turn-face.mjs:131` = `else post("ev:error", { key, message: String(err?.message ?? err), ...techInfoOf(err) })`；A6 实读 `agent-host.mjs:101` 五键种子 ∕ `:148` 出站 ∕ `agent-bridge.mjs:322-331` ∕ `IPC.md:26 ∕ :71`；A9 实读 `turn-driver.mjs:67` ∕ `turn-chain.mjs:49`）· 3 Fixed（`:172` handler 重映射；`:58` 零改面）· 4 Fixed（`:165` 严格串；夹具实读 `:34 ∕ :45` = `({ name: n, mime: "image/png", dataURL: PNG })`）· 5 Fixed（UI.md `:48 ∕ :51 ∕ :113 ∕ :117 ∕ :449` ∕ PROJECT.md `:59 ∕ :60 ∕ :740 ∕ :741` 实读全中；产出方坐标 `:176 ⇒ :148` 与 `agent-host.mjs:148` 相符）· 6 Fixed（IPC.md `:108 ∕ :110 ∕ :111` 实读全中）· 7 Fixed（`:180-183` ＋ 挂判据 `:93 ∕ :101 ∕ :116` ＋ AC2 `:62`）· 8 Fixed（`panel-callbacks.mjs:210-212` 实读 = full ∕ `slice(0, 64 * 1024)` ∕ truncated）· 9 Fixed（七坐标实读全中 `panel-callbacks.mjs:140 ∕ :144 ∕ :150 ∕ :169 ∕ :201 ∕ :224 ∕ :230`；AC5 = 三链计数 38 ∕ 23）。

**残留（本轮实读）**：

| # | 原号 | 级别 | 状态 | 说明 |
|---|---|---|---|---|
| 1 | 10 | 🔵 | 在场（数值刷新） | 注数 vs 实读：`ipc.mjs` 注 295 → 实读 299（A7 读键实读 `:123` = `const receipt = await openProject({ path: payload?.path, pick })`——注 `:122`；A8 源实读 `:137` = `function sessionList() { return listSessions(currentCwd()) }`——注 `:133`）；`turn-driver.mjs` 注 276 → 实读 277（`:274` = `queueSnapshot: (key) => queueView.snapshot(key), …`——注 `:273`）；`UI.md` 注 656 → 实读 667；`PROJECT.md` 注 1175 → 实读 1179——同体档在飞编辑所由。非阻塞（档内「实施轮逐点实读定格」纪律在册） |
| 2 | 11 | 🟡 | 在场 | 协调项：`ipc.mjs` 在飞编辑面（实读增线 295 → 299）；W3（A7 ∕ A8）落前复读键位 ＋ 与在飞面串行。非阻塞 |

**对象外注记（零级别）**：上轮输出表 A（对象 = `2026-09-29-model-menu-parity.md`）不属本发声明射程（Excluded：评审面 = 本档，非其他批档）——本轮未复核，不计入判定。

**计数**：🔴 0 · 🟡 1 · 🔵 1（残留 2 条）；九条 = 9 ∕ 9 Fixed。

VERDICT: pass

## §4 用户批准（主 agent）

**批准（父侧代执行 · 2026-09-29）**

- **依据**：评审 #169 **pass**（§3 轮次 3——九条 **9 ∕ 9 Fixed** · 残留 🟡1 · 🔵1）；三条件齐（评审 pass ∧ 修正轮落位核验 ∧ 设计 token 在位）。
- **口径**：用户批级全点授权下父侧代行批准；**可撤回**（用户任何时点否决 ⇒ 实施止付 ∕ 回滚）。
- **批准范围**：§2 全量（A1–A9 九项对齐 + W4 文档逐行收正）；边界照 §2.0（零行为变 · VSC 零触 · 传输层外 · 零新通道）。
- **实施条件（承 §3 轮次 3）**：① 标数 ∕ 坐标漂移（`ipc.mjs` 299 ∕ `turn-driver` 277 ∕ `UI.md` 665 ∕ `PROJECT.md` 1177）——实施轮按「实读定格」逐点复读；② `ipc.mjs` 与他批（B10 ∕ 模型菜单）同体档 ⇒ 调度串行（files 域申报在案）。
- **派发**：A 舱 = W1（宿主事件键面 A2–A6 + 批次本地件 ①②③；九档）→ B 舱 = W2+W3（载具形 ∕ 请求面键 A1 ∕ A9 ∕ A7 ∕ A8 + 测试件 ④⑤；十二档，dependsOn A）→ W4 = 文档收正（两舱落定后另派）。

## §5 实施记录（eng-coder）
**状态行**：实施完成 · 2026-09-29（A 舱 W1（A2–A6 + 批次本地件 ①–③）+ B 舱 W2 ∕ W3（A1 ∕ A9 ∕ A7 ∕ A8 + ④⑤）；两舱各：分歧审计 1 轮 clean ∕ 代码评审 1 轮 pass；五暂存件待父侧 copy 至终位（写门 #545））



### 5.1 交付摘要（A 舱 · W1 = 宿主事件键面 A2–A6 + 批次本地件 ①②③ · 2026-09-29 · eng-coder）

- **改动面**：产品码七档（`agent-bridge.mjs` · `agent-host.mjs` · `turn-face.mjs` · `timer-watch.mjs` · `renderer/events.mjs` · `renderer/events-blocks.mjs` · `renderer/events-slices.mjs`）+ 报告外清单一项（`renderer/views/statusline-segments.mjs:138` 注释随正，见 5.2）+ 批次本地件新档（暂存）+ 在位件 r7 夹具暂存副本。**零行为变 · 零新通道 · 零产品行为增量**。
- **终态**：自含交付环收敛 —— 分歧审计 1 轮 `clean`（四类偏差 0）· 内部代码评审 1 轮 `pass`（0 🔴；🟡1 = 在册尺寸债非 must-fix；🔵3 = 顺收项）⇒ **terminal = clean**。
- **暂存件（父侧动作 · 写门 #545）**：`docs/batches/2026-09-29-parity-b8-ipc.test.mjs`（新）与 `docs/batches/2026-09-28-tech-debt-closeout-r7.test.mjs`（夹具随形版）——子代理写 `docs/batches/*.test.mjs` 被写门拒 ⇒ 落 `.thincoder/tmp/` 同名件，**待父侧 copy 至终位**（`docs/batches` 与 `.thincoder/tmp` 同为两层深 ⇒ 相对 import 与终位运行命令同一）。

### 5.2 逐项改动表（A 号 → file:line 终态）

| A | 收正形 | 落点（终态实读） | 备注 |
|---|---|---|---|
| A2 | `ev:activity` turn 载荷 `{n,max}` ⇒ `{turn,maxTurns}` | `agent-bridge.mjs:207`（`at("ev:activity", { event: "turn", turn: n, maxTurns: max })`）· `renderer/events.mjs:152-153`（读 `ev.turn` ∕ `ev.maxTurns`）· 注释 `renderer/events.mjs:133` | **内部回合槽 `{n, max}` 不动**（`:153` 入槽 `{ n: ev.turn, max: ev.maxTurns }`）；值面 = 核回调两参直通 |
| A3 | `ev:tool-output.chunk` ⇒ `text` | `agent-bridge.mjs:219`（`at("ev:tool-output", { id, text })`）· `renderer/events-blocks.mjs:89`（读 `ev.text`） | 局部名 ∕ 注文旧键词（评审 🔵）顺收不改 |
| A4 | `ev:error.message` ⇒ `text` | `turn-face.mjs:131`（**唯一出站点**；`src/main` 全域 `"ev:error"` 仅此一处）· `renderer/events.mjs:181` 注释 + `:185`（`text: ev.text`） | 块内键 `text` 不动 |
| A5 | `ev:timer` 补 `status:"fired"` | `timer-watch.mjs:23`（`{ key, status: "fired", text }`） | 渲染面只读 `text` ⇒ 增键零副作用 |
| A6 | 容器 `tokens` ⇒ `usage`；五键 ⇒ VSC 键面；`percent` ⇒ `ctxPct` | `agent-host.mjs:101`（种子五键）· `:148`（`{ key, ctxPct, usage: {...}, timers }`）· `:140-144` 注释 · `agent-bridge.mjs:306-316`（注释 + 累加五键行）· `renderer/events-slices.mjs:27`（注释）· `:32-33`（五读键）· `:46`（注释）· `:49 ∕ :52`（`ev.ctxPct ∕ ev.usage`） | **端内切片 ∕ 槽名零随动**（`{prompt,completion,reasoningTokens,cacheHit,cacheMiss}` ∕ `state.usage`/`tokens`/`timers`）；值面同源 = 核读数投影 |
| — | 报告外清单项（已披露 · 1 处） | `renderer/views/statusline-segments.mjs:138` —— 段 7 注释原述「`ev:activity` turn 载荷 `{ n, max }`」在 A2 后失准 ⇒ 随正为「载荷 = turn 形 `{ turn, maxTurns }`〔归约入槽 `{ n, max }`〕」 | 由因 = 本舱 A2 使该注陈旧；分歧审计登记后自修（注释一行，零行为） |

### 5.3 决策透明表

| # | 决策 | 取值 | 依据 |
|---|---|---|---|
| 1 | 测试 ① 计数断言 | 两向集合相等 + 实读 `39`（`model:catalog` 定序末位） | §3 轮 3 标数漂移在案 + 派单「坐标以落笔实读为准」；`model:catalog` = 并发批（模型菜单）已落地通道（`preload.cjs:36`）——设计时读数 38 的漂移见 5.7-1 |
| 2 | ③ 增「键面两端对位」段（单例内） | 出站真帧 ⇒ 真归约：回合槽 ∕ 工具结果 ∕ 三槽随动一并断言 | ③ 射程 = 「桥出站 ∕ 载荷键面」——两端闭合才使「形改义同」可机检；未增用例数（仍 ①②③ 三例） |
| 3 | `postUsage` 局部名 `percent ⇒ ctxPct` | 随正（与出站键同名） | 局部名不在行为面；A6 判据 = `percent ⇒ ctxPct` 全链一致 |
| 4 | 注释随正边界 | 只随正设计点名文件 + 本舱改动使其失准者 | 设计「注释随正」清单（`agent-host` ∕ `agent-bridge` ∕ `events-slices`）+ 审计 N3；余旧键词（`events-blocks` 局部 `chunk` 等）登记顺收不改 |
| 5 | A2 值缺省受理帧（并发批 #597） | 测试容让：带帧值 turn 帧另取；「旧键 `n` ∕ `max` 零残留」断言保留（全 turn 帧）；报告该环境事实 | `turn-driver.mjs:186` 无值受理帧（`{ key, event: "turn" }`）在飞落地 —— 非 A2 射程、非本舱面 |

### 5.4 验收读数（实跑 · 仓根）

- **`node --check`**：九件全绿（七产品 + 两暂存件）✓。
- **批次本地件**：`node --import ./thincoder-desktop/test/rc-resolve.mjs --test .thincoder/tmp/2026-09-29-parity-b8-ipc.test.mjs` ⇒ **3 ∕ 3 pass**。过程实录：改动后首跑绿；#597 在飞落地中途一次环境性红（值缺省受理帧被 `.find` 先命中）⇒ 测试加固后连跑 3 次全绿（稳定）。
- **在位件 r7（暂存副本，夹具随形）**：`node --import ./thincoder-desktop/test/rc-resolve.mjs --test .thincoder/tmp/2026-09-28-tech-debt-closeout-r7.test.mjs` ⇒ **7 ∕ 9**（2 红 = **存量红**，改动前基线同值同坐标：`:90` 键门原引用断言 ← 停滞轻显形批 `lastOutputAt` 任意键写；`:138` `model:list` 期望 ← 模型菜单批 `model:catalog`）；夹具面 `:73` 随形、断言面 `:74-76` 零改且过（执行达 `:90` 即证）。
- **回归面（触 W1 档的在位批次件）**：`session-title` 6 ∕ 6 ✓ · `stall-indicator-b` 20 ∕ 20 ✓ · `parity-b4-vsc-small` 12 ∕ 12 ✓ · `model-menu-parity` 9 ∕ 9 ✓ · `residuals-sweep-wave-a` 5 ∕ 7（2 红存量，基线同）· `tech-debt-r8` 7 ∕ 8（1 红 = 并发批 #597 新增回执键 `started:false`，基线 8 ∕ 8 在 #597 落地前 —— 非本舱面）· `window-queue-parity` 8 ∕ 9（T7 红 = 并发批 `composer-wire` 重作 —— 非本舱面）。
- **旧键零残留拖网**（机检）：`ev.chunk` ∕ `ev.message`（ev:error 径）∥ `ev.percent` ∕ `ev.tokens` ∥ `ev.n` ∕ `ev.max` ∥ `tally.prompt` 族 —— 全域零命中（唯一 `ev.message` 命中 = `events-status.mjs:38` 的 `ev:statusText` quota 支，异通道合法键）。
- 库内套件：`thincoder-desktop/test/files.mjs` = 空清单（全清重置）⇒ 无库内套件回归面；**仓级套件未跑**（父侧收口唯一跑点）。

### 5.5 审计与代码评审轮次与终态

- **分歧审计（explore · 只读）**：**1 轮** —— VERDICT `clean`（四类偏差 0：部分实现 ∕ 静默简化 ∕ 文档漂移 ∕ 清单外变更）。三条非类别注记：§5 空（即本段）· 测试计数 39 已注明适配 · `statusline-segments:138` 陈旧注释（本舱自修，见 5.2）。
- **代码评审（advisor）**：**1 轮** —— VERDICT `pass`。发现：🟡1（`agent-bridge.mjs` 318 行 > 300 顾问线 —— 设计 §2.5 在册延后，非 must-fix）+ 🔵3（测试 ① 硬计数 39 跨批耦合；`accumulateTokens` 无键在场门（未种子化载体 ⇒ NaN 潜伏，生产径恒种子化）；`events-blocks` 旧键词顺收）。**0 🔴**。
- **自修轮**：**1**（`statusline-segments.mjs:138` 注释随正）。**终态：clean（收敛交付）。**

### 5.6 禁止面核对

- **W2 ∕ W3 十档零触**：`attachments.mjs` · `renderer/attach.mjs` · `turn-chain.mjs` · `turn-driver.mjs` · `renderer/queue.mjs` · `views/chat-pending.mjs` · `ipc.mjs` · `renderer/app.mjs` · `mount-sessions.mjs` · `events-subscribe.mjs` —— 本舱零编辑。
- **文档三档零触**：`docs/desktop/design/IPC.md` ∕ `UI.md` ∕ `PROJECT.md` —— 零编辑（W4 面；评审 I1 登记其暂时落后 = 在册协调项）。
- **零新通道 ∕ 零行为增量**：`preload.cjs` ∕ `ipc-registry.mjs` 零编辑（测试 ① 只读比对）；无新 `ev:*` ∕ 无新回调；VSC 侧 ∕ 传输层零触。
- **报告外清单项（1 · 已披露）**：`renderer/views/statusline-segments.mjs:138` 注释一行（由因见 5.2）。

### 5.7 未决 ∕ 边界诚实项

1. **设计计数漂移（38 → 39）**：请求面白名单实读 = 39（含并发批 `model:catalog`）；设计 §2.5 ∕ AC1 ∕ AC5 记 38 —— 本舱按「落笔实读」适配并在测试注明；**W4 计数随动 ∕ §6 口径需按 39 收正**（事件面 23 未变）。
2. **两暂存件待父侧 copy 落位**（见 5.1）；落位前「终位运行」与「在位件 r7 随形」两条验收不可判。
3. **并发批环境（在册）**：`turn-driver.mjs`（#597 无值受理帧 + `started:false`）· `composer-wire.mjs`（#596 ∕ #597）等在飞落地 ⇒ 他批在位件两处新红（`tech-debt-r8:271` · `window-queue T7`）归因在册（基线对照 + mtime）；本舱文件零并发覆写（mtime 定格 = 本舱编辑刻）。
4. **A4 ∕ A5 无运行时断言**：设计测试面 ③ 仅点名 A2 ∕ A3 ∕ A6 ⇒ A4 ∕ A5 以实读核验（唯一出站点 ∕ 单点交付）为凭，未超设计面加测；如需另批补。
5. **存量项（登记不改）**：`agent-bridge.mjs` 318 行 > 300 顾问线（设计在册延后）· `accumulateTokens` 无键在场门（🔵 潜伏）—— 归后续批次。
6. **designId 回显**：spawn 消息未携 designId 明文；授权面 = 系统 token gate（本舱全部产品码写获准 ⇒ token 在位）。如需具体 id 明文回显，请父侧给出值。

### 5.8 交付摘要（B 舱 · W2 + W3 = A1 ∕ A9 ∕ A7 ∕ A8 + 批次本地件 ④⑤ · 2026-09-29 · eng-coder）

- **改动面**：产品码十二档（`src/main/attachments.mjs` · `src/main/turn-driver.mjs` · `src/main/ipc.mjs` · `src/main/queued-input.mjs`（仅 1 行注释）· `renderer/attach.mjs` · `renderer/queue.mjs` · `renderer/views/chat-pending.mjs` · `renderer/store.mjs`（注释）· `renderer/mount-composer.mjs`（注释）· `renderer/app.mjs` · `renderer/mount-sessions.mjs` · `renderer/events-subscribe.mjs`）+ 批次本地件五（暂存 · 见 5.8 末）。**零行为变 · 零新通道 · 零产品行为增量**（形改义同：载荷键 ∕ 元素形收正，两端同批随动）。
- **终态**：自含交付环收敛 —— 分歧审计 1 轮 `clean`（四类偏差 0）· 内部代码评审 1 轮 `pass`（0 🔴；🟡4 皆非 must-fix；🔵4 顺收项）⇒ **terminal = clean**。
- **暂存件（父侧动作 · 写门 #545）**：五件落 `.thincoder/tmp/` 同名件，待父侧 copy 至终位（`docs/batches` 与 `.thincoder/tmp` 同为两层深 ⇒ 相对 import ∕ 运行命令同一）：① `2026-09-29-parity-b8-ipc.test.mjs`（④⑤ 增补版）② `2026-09-29-parity-b4-vsc-small.test.mjs`（A1 夹具随形）③ `2026-09-29-desktop-window-queue-parity.test.mjs`（A1 夹具 + A9 断言随形；同名陈旧留档已被当前盘面 + 本舱改动覆盖）④ `2026-09-28-desktop-session-title.test.mjs`（E5 断言随形 —— 父侧裁）⑤ `2026-09-29-send-busy-timing.test.mjs`（A1 夹具随形 —— 同改入册）。

### 5.9 逐项改动表（A 号 → file:line 终态）

| A | 收正形 | 落点（终态实读） | 备注 |
|---|---|---|---|
| A1 | `msg:send.images` 元素 = **严格 dataURL 串**（旧对象形弃 —— 零兼容） | `src/main/attachments.mjs:66 ∕ :70`（`savePastedImages(list, …)` 直用串）+ `:4` 注释 · `renderer/attach.mjs:35-42`（`toImages` 串投影）+ `:7-9 ∕ :23` 注释 · `renderer/mount-composer.mjs:21`（注释随正） | 上游生产面实读 = 核件 `composer/attach.mjs` `readAsDataURL` 本就出串 ⇒ 行为零变；`composer-wire.mjs:68 ∕ :135` 两径同用 `toImages` |
| A9 | `ev:queue.items` 元素 = **串数组**（`ts` 留内部载体；`delivered` 面不变） | **出站投影单点** `src/main/turn-driver.mjs:68`（`queueView.snapshot` ⇒ `textOf` 串数组）+ `:34` import + `:61-64 ∕ :164` 注释 —— 两出站面随动：`turn-chain.mjs:47-51`（`ev:queue` 帧）· `turn-driver.mjs:285`（`queueSnapshot` 供面）；`history:page.queue` 随动（`ipc.mjs:185`；`:176-177` 注释）· 渲染面切片 ⇒ `string[]`：`renderer/queue.mjs:4 ∕ :9 ∕ :21-28 ∕ :36` · `views/chat-pending.mjs:37` · `store.mjs:55-56`（注释） | `window-queue.mjs` ∕ `queued-input.mjs` 内部条目形零改（`{ text, ts }` 快照读面保形）· `turn-chain.mjs` 代码零改（随投影单点） |
| A7 | `project:open` 载荷键 `path ⇒ fsPath` | `src/main/ipc.mjs:125`（读键）+ `:116-118` 注释 · `renderer/app.mjs:103`（`{ fsPath: path }`） | 全库唯一发送点（实读核过） |
| A8 | `sessions:list` 出站键 `rows ⇒ sessions`（**handler 重映射 · 源档零改**） | `src/main/ipc.mjs:140-143`（`const { rows, ...receipt } …; return { ...receipt, sessions: rows }`）+ `:138-139` 注释 · `renderer/mount-sessions.mjs:255 ∕ :259` · `renderer/events-subscribe.mjs:67 ∕ :71` | `sessions.mjs` ∕ 在位件 `2026-09-28-desktop-session-title.test.mjs:140` 零动（源档直断面保绿） |
| — | 批次本地件 ④⑤ | `.thincoder/tmp/2026-09-29-parity-b8-ipc.test.mjs:126-183`（④ A1 元素形 `:132`；⑤ A9 两出站面 `:151` + 端内两跳收官 `:172-178`） | ①–③（A 舱例）逐行零改、同件随跑 |
| — | 在位件同改入册（设计漏登两项 · 披露） | ② `2026-09-29-parity-b4-vsc-small.test.mjs:34`（设计点名）· ③ `2026-09-29-desktop-window-queue-parity.test.mjs:45 ∕ :248-251`（设计点名）· ④ `2026-09-28-desktop-session-title.test.mjs:245`（**父侧 2026-09-29 裁定**：`items?.some((i) => i === SECOND_MSG)`，仅该行）· ⑤ `2026-09-29-send-busy-timing.test.mjs:42`（**设计漏登**：A1 严格串下旧对象夹具会静默丢图 ⇒ 按「在位件夹具随形」同册纪律随形，判例同 ④） | ④ ∕ ⑤ 两条 = 清单外同改（披露在案；建议设计侧 §2.5 在位件清单随动一行） |
| — | 报告外清单项（注释随正 · 2 处） | `src/main/queued-input.mjs:4`（`images` = dataURL 串原样（A1）——设计零改面「内部条目形」零破：条目形 ∕ 快照形未动）· `src/main/turn-driver.mjs:164`（附件面注释随正） | 由因 = 本舱 A1 使两注陈旧；同 A 舱 `statusline-segments.mjs:138` 先例 |

### 5.10 决策透明表

| # | 决策 | 取值 | 依据 |
|---|---|---|---|
| 1 | A9 投影层位 | `queueView.snapshot` 单点 `.map(textOf)`（复用 `queued-input.mjs` 导出 —— 零第二归一面） | 设计「出站投影单点」+ 两出站面 ∕ `history:page` 随动；`turn-chain` 零改 |
| 2 | 渲染面切片形 | `pending[key]` = `string[]`（归一：非串 ⇒ `""`；同值判据改串比较） | 设计 A9「渲染面切片 ⇒ `string[]`」；消费面三处实读全串安全（读串 ∕ 只读 `length`） |
| 3 | ⑤ 增「端内两跳收官」断言（单例内） | 出站真帧 ⇒ 真归约 ⇒ 真构树（`pending` 切片 + `pendingGroupNode`） | 同 ③ 先例（两端闭合才使「形改义同」可机检）；未增用例数 |
| 4 | 夹具形参处理 | `img` 由 `(n) => ({…})` 改零参 `() => PNG`；调用点零改（多余实参被忽略） | 设计 ≤±N 预算 + 最小差分；卫生项已披露（评审 🔵） |
| 5 | 两处非同点名改动 | `queued-input.mjs:4` 注释 ∕ `send-busy-timing.test.mjs:42` 夹具 —— 落 + 披露 | 前者 = 注释随正（A 舱先例）；后者 = 父侧判例同型（设计漏登） |

### 5.11 审计与代码评审轮次与终态

- **分歧审计（explore · 只读）**：**1 轮** —— VERDICT `clean`（四类偏差 0）。三条非类别注记 → 处置：N1 `queued-input.mjs` 注释 = 本段 5.9 披露在册；N2 设计漏登两项 = 5.9 披露 + 建议设计侧清单随动；N3 `mount-composer.mjs:21` 陈旧 `D7` 指针 = 本舱自修（删 D7，改称「A1 收正 ∕ VSC 同形」）。
- **代码评审（advisor）**：**1 轮** —— VERDICT `pass`。发现：🟡4（① 五暂存件未落终位 = 协调项 · 父侧动作；② 同改入册 ∕ 披露面 —— 本段即落；③ `ipc.mjs` 307–308 行 > 300 顾问线（设计「保 ≤300」已破，与并发批共同所致 —— 在册债务顺延）；④ `IPC.md` 等三档仍旧形 = W4 面）+ 🔵4（`app.mjs` 形参名双轨 · 暂存件 `img("…")` 残留实参 · 测试件行数 · 标数漂移顺收）。**0 🔴**。
- **自修轮**：**1**（`mount-composer.mjs:21` D7 指针删除）。**终态：clean（收敛交付）。**

### 5.12 验收读数（实跑 · 仓根）

- **`node --check`**：十二产品档 + 五暂存件全绿 ✓。
- **批次本地件**：`node --import ./thincoder-desktop/test/rc-resolve.mjs --test .thincoder/tmp/2026-09-29-parity-b8-ipc.test.mjs` ⇒ **5 ∕ 5 pass**（①②③④⑤；A 舱 ①②③ 逐行零改同跑）。
- **在位件（暂存随形版）**：`parity-b4-vsc-small` **12 ∕ 12** ✓ · `desktop-window-queue-parity` **9 ∕ 9** ✓ · `desktop-session-title` **6 ∕ 6** ✓ · `send-busy-timing` **13 ∕ 13** ✓。
- **触面回归**：`parity-b2-queued` 6 ∕ 6 ✓ · `stall-indicator-b` 20 ∕ 20 ✓ · `model-menu-parity` 9 ∕ 9 ✓；存量红（基线同 ∕ 非本舱面）：`residuals-sweep-wave-a` 5 ∕ 7（2 红 = 结构行断言 `agent.mjs:245` 面）· `tech-debt-r8` 7 ∕ 9（2 红 = `lastOutputAt` 任意键写 ∕ `model:list` 期望）。
- **旧形零残留拖网**（机检）：`{name,mime,dataURL}` ∕ `item?.dataURL` ∕ `list?.rows` ∕ `payload.items[].text` 读 —— 本舱射程全域零命中（余命中 = 已随正注释行）。
- 库内套件：`thincoder-desktop/test/files.mjs` = 空清单 ⇒ 无库内套件回归面；**仓级套件未跑**（父侧收口唯一跑点）。

### 5.13 禁止面核对

- **W1 七档零触**：`agent-bridge` ∕ `agent-host` ∕ `turn-face` ∕ `timer-watch` ∕ `renderer/events.mjs` ∕ `events-blocks.mjs` ∕ `events-slices.mjs` —— 本舱零编辑（审计 mtime ∕ 内容双证：A 舱簇 ∕ B 舱簇分列无交叠）。
- **文档三档零触**：`docs/desktop/design/IPC.md` ∕ `UI.md` ∕ `PROJECT.md` —— 零编辑（W4 面；评审 🟡④ 在册）。
- **内部形零改**：`sessions.mjs`（`.rows` 产面）· `window-queue.mjs` ∕ `queued-input.mjs`（`{ text, ts }` 快照读面）—— 代码零改；在位断言面（`wq:82 ∕ :86 ∕ :117 ∕ :122 ∕ :141`）保形绿。
- **零新通道 ∕ 零行为增量**：`preload.cjs` ∕ `ipc-registry.mjs` 零编辑；VSC 侧 ∕ 传输层零触。
- **报告外清单项（2 · 已披露）**：`queued-input.mjs:4` 注释一行 ∕ `renderer/mount-composer.mjs:21` 注释同正（由因见 5.9）。

### 5.14 未决 ∕ 边界诚实项

1. **五暂存件待父侧 copy 落位**（见 5.8）；落位前「终位运行」与「在位件不回归」两条以暂存版读数为凭，终位 copy 后应复跑同命令（读数应同一）。
2. **设计漏登两项**（`session-title:245` 父侧已裁 ∕ `send-busy-timing:42` 同判例）——建议设计侧 §2.5 在位件清单随动一行，使档面与实交付对齐（评审 🟡②）。
3. **A7 ∕ A8 无运行时断言**：设计测试面 ①②③④⑤ 未点名 A7 ∕ A8 ⇒ 以「读键 ∕ 重映射单点 + 全库消费面拖网」实读核验为凭，未超设计面加测（同 A 舱 A4 ∕ A5 先例）。
4. **`ipc.mjs` 307–308 行**（> 300 顾问线，设计「保 ≤300」已破 —— 与并发批共同所致）：在册债务，建议随下次触档拆设置族处理体或另批议（评审 🟡③）。
5. **存量项（登记不改）**：`.thincoder/tmp/b4w2-desk-*.mjs` 两探针仍持旧对象夹具（一次性件 · 射程外）。
6. **designId 回显**：spawn 消息未携 designId 明文（同 A 舱）；授权面 = 系统 token gate（本舱全部产品码写获准 ⇒ token 在位）。如需明文回显，请父侧给值。

## §6 验证与收口（父代理）

**收口记录（父代理 · 2026-09-29）**

**波面（全落）**：W1（A 舱 #173：A2–A6 宿主事件键面 + 批次本地件 ①②③）· W2/W3（B 舱 #174：A1 `msg:send.images` 严格 dataURL 串数组 ∕ A9 `ev:queue.items` 串数组 + 两出站面 + `history:page` 随动 ∕ A7 `project:open` ⇒ `fsPath` ∕ A8 `sessions:list` ⇒ `sessions` + 批次本地件 ④⑤）· W4（文档轮 #191：三档 33+8 处漂移收正——`IPC.md` 394⇒398 ∕ `UI.md` 687⇒689 ∕ `PROJECT.md` 1228⇒1230 + 变更记录各随）。

**验证（父侧）**：五件终位亲跑（`node --import ./thincoder-desktop/test/rc-resolve.mjs --test <五件>`）**45/45 pass · 0 fail**（b8-ipc 5/5 · b4-vsc-small 12/12 · window-queue-parity 9/9 · session-title 6/6 · send-busy 13/13——五暂存件已全部转正入 `docs/batches/`）；两舱审计 clean + 代码评审 pass；W4 `doc-check` 行宽 67⇒66（Δ −1）· 锚悬空 146⇒146（Δ 0）；**not repo-suite verified**（父侧收口轮为唯一套件口径）。

**真机面（父侧探针顺带实锤）**：A7 新键形 `{ fsPath }` 经真机探针实证在位（model-menu ∕ send-busy 两探针全程以 `fsPath` 开项目成功——含一次旧键 `{path}` 致原生对话框悬挂之反证，探针纪律已入册）。

**边界与披露**：① 并行写者（desktop pid=2144 会话对 `IPC.md` ∕ `UI.md` 持写入意向）——**三档已复读核过，无损**；② 设计漏登两项已补录 §2.10（`session-title.test.mjs:245` 父侧裁定随形 ∕ `send-busy-timing.test.mjs:42` 同判例随形——均已在盘）；③ `ipc.mjs` 307–308 行 >300 债务在册；④ A4 ∕ A5 无专属运行时断言（以唯一出站点实读为凭）；⑤ 设计档漂移清点（`:30 ∕ :122 ∕ :157 ∕ :213 ∕ :226`）已由 W4 全数收正。

**结算（D7）**：**#572 → 已核销**（依据本节 + §5 · 全链闭合：设计 → 评审 → 修正 → 双舱实施 → 文档轮 → 五件终位亲跑）。**状态行**：已收口 2026-09-29。
