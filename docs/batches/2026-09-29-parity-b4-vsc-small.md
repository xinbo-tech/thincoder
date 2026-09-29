# 2026-09-29 · parity-b4-vsc-small
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-29 · 来源 = 用户全修令 + parity-closeout §2 归批表 B4（VSC 小件迁移族）——annex :46 :83 :89 :90 :96 :113 + 重造④⑤⑦⑧ + 上提③④⑥⑦⑧。
> 台账 = #567（vsc ∕ core · 归批）。前情 = `docs/batches/2026-09-29-parity-closeout.md` §2 归批表 **B4**（全修令下）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-29
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 来源与口径（父侧 · 2026-09-29 04:3x）
- **来源**：用户**全修令** + `parity-closeout` §2 归批表 **B4**。
- **射程**：annex `:46 :83 :89 :90 :96 :113` + 重造④⑤⑦⑧ + 上提③④⑥⑦⑧ + §3④ 档②去留 + `core/attachments.mjs:11-17` 差异五条。
- **口径**：逐点取 VSC ∕ 核**实盘**；行为零变；非视觉降级 = **desktop 接 VSC 面**（对齐优先，形 = `image-handler.mjs` 逐点）。
- **台账**：#567。

### 1.3 实施期裁定（父侧 · 2026-09-29 05:2x · W1 #84 发现）

- **首回合降级窗**（`panel._agent === null`——面板打开 ∕ 会话切换后首个用户回合，降级窗在 `_chat` 前）：裁定 = **合成最小父面**（wrapper 传 `parentAgent: panel._agent ?? { config: { providersList: resolveProviders().providers }, memory: null }`）——零变硬约束（旧自持跑者首回合可成功 ⇒ 保成功径）+ 零第二实现（核渠道表单源）。
- **约束**：实现前以实读确认 `resolveChildProvider` 实际读取字段名（不符 ⇒ 按实读补正合成面，仍守恒单源）；真父面在场 ⇒ 恒用真父面。
- 差额由 §5 决策透明表披露、§6 收口对账；**备选**（直传 + 收窄）已否（首回合读图静默失效 = 可见行为变）。

### 1.4 实施期裁定之二（父侧 · 2026-09-29 05:3x · W1 #84 组③第二缺口）

- **全窗缺口**：核 `runVisionReader` → `assembleBuiltinTools({ memory: parentAgent?.memory })`，`tools/index.mjs:71` 非容错 ⇒ VSC 父面无 `memory` 字段 ⇒ **成功径恒死**（实测两例均抛、被 catch 收成 null）。
- **裁定 = (c) 双管**：① (a) W1 wrapper 以宿主记忆句柄补面（`ensureMemoryHandle()` 单源；禁用 ∕ 护栏未过 ⇒ null ⇒ 兜底不变形）；② (b) **核 `assembleBuiltinTools` 容错微件 = 父侧另派**（已发单：`memory?.db` 或等价局部防护，以实读选定；验收 = 缺位不抛 + 有 memory 零变 + 成功径真跑）；③ (d) 假句柄 `{db:null}` 已否（掩盖）。
- 差额由 §5 决策透明表披露、§6 收口对账。

### 1.5 实施期裁定之三（父侧 · 2026-09-29 05:4x · W2 #85 审计发现）

- **降级 await 窗 post-window 查位**（径① `turn-driver.mjs:185-190` ∕ 径② `turn-chain.mjs:74-79`）：窗内 dispose ∕ 切项目级联 ⇒ 占位被摘 ⇒ 链仍 `release→drive` ⇒ **僵尸回合起跑**（#515② 同族；`stamp` 落中止后代次 ⇒ U-7 复活面；实读证据在 #85 报告）。裁定 = **(i) 补设计句 + 当场 fix**：径① 加同款 `flights.get(key) !== controller` 闸；径② 链侧加「占位仍在」判据（缝形 +1）——不变量补写（非新语义）。
- **`hold(key)` 形差异受理**：返回 `{ signal, release }`（设计记「返回 release」）——设计同段「窗内 interrupt ⇒ 降级信号 abort」所迫；W3 设计文本随动。
- 两笔由 §5 披露、§6 收口对账。

### 1.6 W2 交付裁定与 W3 待办汇（父侧 · 2026-09-29 05:5x · #85 交付）

- **D-1**（僵尸回合两径）:父侧裁定 (i) 已当场 fix（径① 占位闸 ∕ 径② `hold.active()` 判据）——评审轮 2 pass ✓。
- **D-2** `hold` 形 `{signal, active, release}` 受理；**D-3**（窗内 interrupt = 只中止读图、回合照常）按设计口径**保留**（若另裁归 W3）；D-4/D-5（自清 ∕ `takeOver` 复查位）为不变量族自决补写，披露受理。
- **W3（#86）待办汇**（逐项落）：① 设计文本随动（`hold` 形 ∕ 降级窗 ∕ 复查位 ∕ 自清 ∕ 批档 §2.2:95/:100）；② `docs/desktop/design/IPC.md` §2 项 4（回执时机句 + reason 闭集含 `aborted`）+ 码注 `src/main/ipc.mjs:183`「立即回」同步；③ 核件档头座标随动（W1 披露行）；④ 批内件正式化（事件序判据替墙钟——D-7）；⑤ §2.6 表档籍（W2 四档 + 各波披露）。

### 1.7 §2 段位补笔交付与读数归因（父侧 · 2026-09-29 06:2x · #115 交付）

- **§2 补笔落毕**（§2.2 随动 `:101/:102/:105` + §2.6 补册实点 + 状态行）——与 §1.5 ∕ §1.6 裁定同源、逐处实码复核在册；**§5.7 对拍待 #86 落定后父侧执行**。
- **两处届盘读数归因（§6 复核）**：`panel-turn-stages.mjs` **251**（§5.4 记 241）= **#113 在飞**（W8 断链随动 · 同步出口 async——本批固定件）；`suspension-drive.mjs` **284**（§5.5 记 279）= **波 A `#554①`**（`postSuspEnd` 出窗帧发射器 +5——残余族批落档）。**均非 B4 径**。
- W3 批内件（tmp 222 行 ∕ 12 用例）超设计估（≈120 内）——归 W3 收口（在册）；`vision-reader` 口径 77（split ∕ 设计同口径）已入 §2.6 注。

### 1.8 §2 ↔ §5.7 正式对拍（父侧 · 2026-09-29 06:4x · 履行 #86 D-7）

- **结论 = 一致（多处同述，零相抵）**：§2.2 `:107`（`hold` 形 `{ signal, active, release }` + `active()` = 占位仍在判据 + 窗后查位）· `:108`（`takeOver` async + 窗后复查位 `:131`）· `:111`（清理归属例外面 + 落盘件自清）↔ §5.7 `:679`（待办① 归因句）· `:709`（补记直读复核）——逐处同述；§2.6 补册（`:141-177`）↔ §5.7 `:683` 同述。**清障闭环，对拍履行完毕。**
- **批测件终位亲跑 = 12 ∕ 12 pass**（T1–T12 全绿 · 父侧实跑在案）。
- B4 链态：W0✓ W1✓ W2✓ W3✓ + §2 补笔✓ + 对拍✓ + 锁档✓ ⇒ **待 §6 收口**（真机两组清单 + W8 复扫已闭 + 各波登记项在父侧检查单）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（2026-09-29 · 评审 #59 修正轮逐条落毕（1..11 收口表 + 修正块在册）；段位补笔：§2.2 随动（hold 形 ∕ 窗后查位 ∕ 复查位 ∕ 自清）+ §2.6 落档实点补册）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**设计轮记（2026-09-29）**：五组方案逐件 + 降级对齐 + 差异五条收正 + 受影响文件表 + 实施序；档②去留 = 裁「去」，见 D3。

### 2.0 覆盖口径与设计档落点
- **覆盖**（parity-closeout §2 归批表 B4 逐行）：A 表 `:46`（2s 拍）· `:83`（notify）· `:89`（贴图落盘）· `:90`（非视觉降级）· `:96`（provider 流程）· `:113`（file-links）；重造榜 `:132`④ file-links ∕ `:133`⑤ attachments ∕ `:135`⑦ 2s 拍 ∕ `:136`⑧ notify；上提计划 `:165`③ 附件贴图族 ∕ `:166`④ file-links ∕ `:168`⑥ 存活拍 ∕ `:169`⑦ 提示策略 ∕ `:170`⑧ provider 流程族；§3④（desktop notify 档②去留）；F6（core `attachments.mjs:11-17` 在册差异 5 条）。**不做**：B1（:33/:37/:43/:44/:114/:117 + 反①–④）· B2（:23–:26 + 重造①）· B5（:68/:69）· B7（:36/:106/:115）· #564 在途行。
- **设计档落点 = 本节自持**（不另立 `docs/design/<board>.md`）——先例 = `docs/batches/2026-09-29-parity-closeout.md` §2.0（清账轮 ∕ 小件迁移轮不另立档）；设计 8 项（方案与理由 ∕ 接口契约 ∕ 受影响文件表 ∕ 关键决策 ∕ 验收对照 ∕ 用例表 ∕ 边界 ∕ UI 交互落点）逐项在本节成文（2.1 ∕ 2.2 ∕ 2.6 ∕ 2.7 ∕ 2.8 ∕ 2.9 ∕ 2.10 ∕ 2.11）。**理由**：本轮 = 逐点迁移，无新机制 ⇒ 无「一板块一文档」新增触发；核件覆盖面（附件族 ∕ 拍 ∕ 提示策略 ∕ provider 流程族）已在核件档头与既有设计档在册，本节记**迁移决策与差额点**，档头随动归实施面（D6 表）。
- **§1 兼容性判据**：任务书（本批档编制行 + spawn 要点） ∕ closeout §2.5 B4 行 ∕ annex F6 ⟺ 三链同源（2.8 验收对照逐条落坐标）。
- **证据级**（坐标均为本批实读 2026-09-29 04:3x–04:5x）；行数口径如注（2026-09-29 实点）。

### 2.1 五组方案（VSC 改指 ∕ 转口 ∕ 删残留）

**组① notify（`:83` ∕ 重造⑧ ∕ 上提⑦）· 改指+删残留**
- 现状（实读）：VSC `src/extension/notify.mjs`（19 行）= 自持薄函 `notifyCompletionIfUnfocused`：`vscode.window.state?.focused` 焦态门 + `showInformationMessage(t("notify.done"), t("notify.view"))` + 选项点击 ⇒ `workbench.view.extension.thincoder`；调用点单点 = `panel-callbacks.mjs:236`（`onComplete` 内 `if (!autoTurn)` 门）。
- 改：`notify.mjs` 整档重写为**宿主包装**（保留 `import * as vscode from "vscode"`——宿主 API 面；策略零副本）——`createVscNotify(panel)` 返回 `createNotifier({ localeOf: () => vscode.env.language, notify: (payload) => void vscode.window.showInformationMessage(payload.body, ...(payload.reveal ? [t("notify.view")] : [])).then(...), focused: () => vscode.window.state?.focused === true, reveal: () => vscode.commands.executeCommand("workbench.view.extension.thincoder") })` —— 策略（失焦门 ∕ 档① ∕ 词键 ∕ 语言取值 ∕ title 携 ∕ reveal 载荷）全取核 `notify-policy.mjs`（`createNotifier` :36 ∕ `NOTIFY_TEXTS` :25 ∕ `localeOf` 缝——D9），端侧零判据副本。
- 调用点：`panel-callbacks.mjs:236` 的 `if (!autoTurn) notifyCompletionIfUnfocused()` ⇒ `if (!autoTurn) panel._notifier.turnDone({ agent: panel._agent })`（**门判据逐字保留**，`autoTurn` 消化轮零通知沿旧；档②迁移后 VSC 恒不触 —— 无消化挂起面）。
- **行为零变对拍（逐点）**：失焦门（核 `fire` :41 `isFocused()` 早退 = VSC :10 同判据）· 档①文本（核 `zh.done` = "ThinCoder：本轮完成" 与 `locales/zh.json:222` `notify.done` **逐字同值**）· 点击行为（VSC = 打开 thincoder 视图 —— 经 `reveal` 注入承载：核 `fire` :46 `payload.reveal = reveal` ⇒ 通知按钮点击 ⇒ reveal()；**保留 VSC 既有"查看"体验**，不用桌面"聚焦窗口"语义——宿主能力面差异，登记见 2.3-F⑤）。
- **语言 ∕ 按钮对拍**：**文本语言选择**（迁移前 = `t()` 经 `initLocale(vscode.env.language)`；迁移后 = 核 `langOf` :39 经 `localeOf` 缝——wrapper 携同一 `vscode.env.language`，核 `normalizeLocale` 归一 `zh-CN → zh` ⇒ zh ∕ en 同判）· **按钮文案**（`t("notify.view")` 迁移前后同键同值——`locales/{zh,en}.json:223` 活键不删；点击比对 `choice === t("notify.view")` 同形）。
- **删残留（行数账）**：VSC `notify.mjs` 19 行 ⇒ 重写后约 24 行（薄包装，净 +5）；`locales/zh.json` ∕ `en.json` 的 `notify.done`（`:222`）迁移后成死键（`notify.mjs:11` 为唯一读者）⇒ **删 1 键 × 2 档 = 2 行**；`notify.view`（`:223`）**保留**——按钮文案活键（2.11「查看」）（D5 表）。
- **档②去留 = D3 关键决策**（核 `notify-policy.mjs:53` `digestStart` + `:26/:27` `subagents` 词键 + desktop `suspension-drive` 调用点）。

**组② file-links（`:113` ∕ 重造④ ∕ 上提④）· 改指**
- 现状：VSC `src/extension/file-links.mjs`（42 行）= 自持正则 ∕ MAX_LINKS ∕ 验存循环（`node:fs` 直引 :7）；调用点单点 = `panel-callbacks.mjs:215`（`extractFileLinks(cwd, text)`）。
- 改：档体缩为薄壳 —— `import { extractFileLinks as core } from "@thincoder/core/file-links.mjs"` + `export const MAX_LINKS = 50`（re-export 核值，消费面零改）+ `export function extractFileLinks(cwd, text) { return core(cwd, text, { existsSync, statSync }) }`（探针 = 端注入 —— 核缝契约 `attachments` 同族 fail-loud）。
- **行为零变对拍**：正则 ∕ 去重 ∕ 封顶 ∕ 存在闸 ∕ 协议相对 URL 残体跳过逐点同源（核 :16 ∕ :37 ∕ :49 ∕ :45 ∕ :29 与 VSC :13 ∕ :28 ∕ :38 ∕ :34 ∕ :28 同判）；差额 = 核 `base === null` 时相对 token 零判据（VSC 现恒传 `_cwd()` ⇒ 不可达径，登记 a-①）。
- **删残留（行数账）**：42 行 ⇒ 约 16 行（净 −26，D5 表）。

**组③ attachments ∕ image-handler（`:89` ∕ 重造⑤ ∕ 上提③ + F6 差异）· 改指**
- 现状：VSC `image-handler.mjs`（130 行）= `parseDataUrl` :34（阈 `15 * 1024 * 1024` :40）· `savePastedImages` :49（过滤后下标命名 :58 · 无合计预算）· `downgradeNonVisionImages` :109（真值判 :124）· `runVisionReader` :71（runners）。
- **调用点两清单（导出面分列）**：`savePastedImages` 消费 = `panel-messages.mjs:157 ∕ :162 ∕ :183`（三处随新出口形接线：核 `{ paths, dropped }` ⇒ 取 `.paths`）。
- `downgradeNonVisionImages` 消费 = `panel-messages.mjs:187` ∕ `panel-turn-stages.mjs:191 ∕ :237`（三处共用返形 `{ text, images, visionAbort }`——**包装层逐行保返形 ⇒ `panel-turn-stages.mjs` 零改**）；`runVisionReader` 消费 = 包装缺省位（`:122` `visionReader ?? runVisionReader`）。
- 改：`savePastedImages` ⇒ 核 `savePastedImages(dataUrls, cwd, { fs: FS_SEAM })` 直调（`{ paths, dropped }` 出口；VSC 调用点三处对 `paths` 消费 —— 迁移时按新出口形接线）；`parseDataUrl` ∕ 阈 ∕ 预算 ∕ 弃项命名全走核件（VSC 副本删）；降级判决 ⇒ 核 `downgradeNonVisionImages({ text, images, model, visionReader, signal })`（薄壳 `withVisionAbort(panel, args)` 保 `visionAbort` 行为——见 2.2 差额 ∕ 2.9 用例）；`runVisionReader` ∕ `findVisionChannel` ⇒ 核（见 2.2）。
- **行为零变对拍**：成功径 `[图片 <路径> 描述: <描述>]` 注文逐字同（核 :123 = VSC :125）；失败径原样兜底同；忙锁 ∕ `_publishTurnState("running")` ∕ `_visionAbort` 时序留 VSC 壳（包装层逐行保）。
- **删残留（行数账）**：`image-handler.mjs` 130 行 ⇒ 约 55 行（净 −75）；`vision-channel.mjs` 24 行 ⇒ **文档归档或薄 re-export**（D6 裁，两向皆零行为差额）。

**组④ 2s 存活拍（`:46` ∕ 重造⑦ ∕ 上提⑥）· 改指**
- 现状：VSC `panel-messages.mjs:45`（`LIVE_HEARTBEAT_MS = 2000`）· `:50`（`liveHeartbeatBeat`——两门：`_wvReady !== true` 不拍 ∕ 空拍零留痕 + 每 30 拍兜底日志 `ev:subreassert`）· `:62` ∕ `:70`（起 ∕ 停：`setInterval` + `unref`；`_heartbeats` WeakMap）；起 = `webviewReady` case :333；止 = `chat-panel.mjs:180`（dispose）。
- 改：`startLiveHeartbeat` ∕ `stopLiveHeartbeat` ⇒ 核 `createLiveBeat({ beat })`（`live-beat.mjs:29`——间隔 ∕ 起 ∕ 停 ∕ 幂等 ∕ unref 入核）；`LIVE_HEARTBEAT_MS` 常量 ⇒ re-export 核值（`live-beat.mjs:19`）；`liveHeartbeatBeat` ∕ 两门 ∕ 日志 ⇒ **留端**（核件在册：两处 VSC 端面判据随拍体留端 —— `live-beat.mjs:7-8`）。
- **行为零变对拍**：拍周期 2000ms 同值；起拍幂等（核 :36-40 单拍句柄 = VSC `_heartbeats.has` 同）；`unref` 同；停后不再拍同；两门逐字保留（搬入拍体本体，语义不动）。
- **删残留（行数账）**：`panel-messages.mjs:62-75` 起 ∕ 停两函数体（约 14 行）⇒ 约 6 行薄接线（`const _beats = new WeakMap()` + 工厂式起 ∕ 停；净 −8）；`LIVE_HEARTBEAT_MS` 常量行改 re-export（净 0）；拍体两门净 0。

**组⑤ provider 流程（`:96` ∕ 重造——无 ∕ 上提⑧）· 改指**
- 现状：VSC `provider-flows.mjs`（175 行）= 三流程 UI 壳全体内联（`addProviderFlow` :60 ∕ `removeProviderFlow` :129 ∕ `setKeyFlow` :153）+ `probeProviderAdmission` :32（`probeChannelModels` + `probeTargetFromEntry` + F-W19 `overrideAdmissionIfHostBusy`）+ 持久化面 re-export :26。
- 改：三流程 ⇒ 核 `provider-flows.mjs`（`addProviderFlow(ui, refresh, deps)` :136 ∕ `removeProviderFlow(ui, refresh)` :201 ∕ `setKeyFlow(ui, refresh, deps)` :226——「纯搬 + 转口，零语义改」在册）；VSC 只留 **UI 壳注入**：`const ui = { pick: (items, opts) => vscode.window.showQuickPick(items, opts), input: (opts) => vscode.window.showInputBox(opts), error: (m) => vscode.window.showErrorMessage(m), warn: (m) => vscode.window.showWarningMessage(m), info: (m) => vscode.window.showInformationMessage(m) }`；`probeProviderAdmission` ⇒ 核同函数（`:110`——返形 `{ok, error}` ∕ `{ok, models}`，核内核已含 `hostBusyOverride` 缝 :119）。
- **行为零变对拍**（逐点）：步序 ∕ 字段校验 ∕ 拒因串（`Name is required` / `Name already in use` / `Base URL is required` / `Model is required` / `Unknown API format: …`——核 :49-70 = VSC :84-88 ∕ :104 同条件同词）· 占位串 ∕ quickpick 项形 ∕ `password: true` ∕ `refresh()` 时序 ∕ M9 探针报告（`reportAdmission` 失败 `ui.warn` = VSC `showWarningMessage` :51）逐点同；**差额** = F-W19 宿主忙覆盖：VSC `loop-sampler.mjs:73` 的 `overrideAdmissionIfHostBusy` 经 `deps.hostBusyOverride` 注入（核 :17 缝），宿主证据语义不变。
- 调用点改动：`panel-messages-settings.mjs:76` ∕ `:87` ∕ `:98`（`addProviderFlow(_pushSettings)` ⇒ `addProviderFlow(ui, _pushSettings)` 三处）；`settings.mjs:322` ∕ `panel-messages-settings.mjs:69`（`probeProviderAdmission(name)` 消费形不变——返形 `{ok, error}` ⊆ 旧形；`:69-73` 读 `ok ∕ error`、`:322` 弃返回值 ⇒ **两档零改**）。
- **删残留（行数账）**：175 行 ⇒ 约 70 行（净 −105；三流程体 107 行 ∕ 探针 15 行 — 壳保留）。
- 备注：`presets.mjs` `probeTargetFromEntry`（:159）本轮**留着**——`settings-panel-write.mjs:52` 另有消费；收编随设置面批（B10 域——本批射程外，登记 R3）。

### 2.2 非视觉降级对齐（desktop 接 ∕ 上提，取「**上提核件**」给理由）
- **取一给理由**：桌面端**无 `runVisionReader` ∕ 无 `vision-channel.mjs`**（实读 grep：桌面树 `multimodal` **字面零命中**；非视觉判据面 = 核 `isNonVisionModel` 消费 `attachments.mjs:14 ∕ :23 ∕ :58`；`specForModel` 有直引但属推理档位面——`src/main/providers.mjs:26` ∕ `settings.mjs:33`——不经非视觉判定）；核 `attachments.mjs:113` 已有「降级跑者已出 + `visionReader` 缝」——**缝在、跑者不在**。若「desktop 接 VSC 面（保 VSC 自持跑者）」，桌面要**再写第二个跑者**（配置解析 ∕ 渠道选择 ∕ 子代理 spawn 全复刻）⇒ 违反单源；**故取上提**：跑者面上提核件，VSC ∕ desktop 同源消费（与组①–⑤ 同口径「改指核心」；核件档头 :9 原有「VSC 自持副本迁移留后」句由本轮兑现）。
- **形 = VSC `image-handler.mjs:34-63/:71/:109` 逐点**：
  - **新核件 `thincoder-core/vision-reader.mjs`**：`findVisionChannel(providers, currentName)`（VSC `vision-channel.mjs:14` 逐字——「优先同名渠道视觉模型 → 首视觉渠道」，判据 = `specForModel(p.model).multimodal`）＋ `runVisionReader({ paths, providerName, cwd, parentAgent, signal })`（VSC `:71` 逐字：`resolveProviders()` 取渠道 ∕ `resolveChildProvider(parentAgent, \`<provider>:<model>\`)` 构造 provider（核既有面——`subagent-async.mjs:139`，替代 VSC `providerFromConfig`）∕ `createAgent({ provider, tools: 只读族, config: parent.config, cwd, memory, role: "explore" })` ＋ `runAgent(child, task, {}, { depth: 1, maxTurns: 10, signal })`（核 `agent.mjs:102` 签名——`role: "explore"` 落 `_role`）∕ 60_000ms `VISION_READ_TIMEOUT_MS`（VSC :70 同值）∕ 返回 `{ ok: true, description }` ∥ `null`；失败径全 `null`——无渠道 ∕ 渠道无 key ∕ spawn 失败 ∕ 超时 ∕ 空返；`resolveChildProvider` 替换面差见 a-④）。
  - **VSC `image-handler.mjs`**：`runVisionReader` 本体删、`findVisionChannel` 引用改核（`vision-channel.mjs` 随瘦身）；`downgradeNonVisionImages` 保 VSC 包装（`withVisionAbort`——见 2.1-组③），内部调核件（返形 `{text, images, downgraded}` ⇒ 包装层映射回 `{ text, images, visionAbort }`）。
  - **desktop `attachments.mjs`（:90 对齐本体）**：`prepareTurnAttachments` **判决序改写**——非视觉径**先落盘**（读图需要路径）；档头 :14-16 与判决序注 :52 同步改写（W2）。
    出口 `{ text, paths, dropped, degraded }`：非视觉 ∧ 落盘 0 件 ⇒ 说明行 + `paths: []` + `degraded: "non-vision"`（旧端态）；非视觉 ∧ 有件 ⇒ 原文本 + `paths` + `degraded: "non-vision"`（待降级）；多模态 ⇒ 沿旧（指针注文 + `dropped > 0 ? "partial" : null`）。
  - **降级 = 新面 `degradeTurnAttachments(attached, { model, cwd, parentAgent, locale, visionReader, signal })`（异步 · 出口零抛）**：`paths` 空 ∥ 多模态 ⇒ 原样返；非视觉 ⇒ 核 `downgradeNonVisionImages({ text, images: paths, model, visionReader: 适配器, signal })`。
    适配器 = 注入缝 ∥ 缺省核 `runVisionReader`（`providerName` = `agent.provider?.name`——与主面同源）；成功 ⇒ `{ text: 描述注文, paths, degraded: dropped > 0 ? "partial" : null }`；失败 ⇒ `{ text: 原文本 + 说明行（词键 composer.attach.nonvision——形不变）, paths, degraded: "non-vision" }`。
  - **desktop 接线（三径小表 · 插入点行号）**：
    - **径① `send`**（`turn-driver.mjs:161-163` prepare 调用后 · `release()`（:164）之前——降级窗内 `flights` 占位在）：`attached = await degradeTurnAttachments(attached, { model: agent.provider?.model, cwd: projects?.currentCwd(), parentAgent: agent, locale: agent.config?.locale, signal: controller.signal })`。
    - **径② `continueTurn`**（`turn-chain.mjs` 降级窗 :76-89——`prepare` 调用后起窗 ∕ 占位落表 ∕ 窗后查位 ∕ 自清）：`continueTurn` **转 async**（`Promise<boolean>`）；降级 await 窗以新注入缝 **`hold(key)`**（返回 `{ signal, active, release }`——`active()` = **「占位仍在」判据**；缺省 = 零占位）护**单驱动器不变量**（窗内并发 `send` 同键 ⇒ 落队，不起第二回合）；**窗后查位**（裁定 (i)）：占位被摘（窗内 `dispose` ∕ 切项目级联）⇒ `active()` 假 ⇒ 零取批零起跑（本径落盘件自清——见「`paths` 清理归属」）。
    - `takeOver` 随转 async——`turn-driver.mjs:130` 的 `if (chain.continueTurn(key, agent))` 改 `if (await chain.continueTurn(key, agent))`（**保「队列先于接管」**；truthy 判不可留）；**窗后复查位**（裁定 (i) 同族——续发窗后二次中止墓碑查位，`:131`）：置真 ⇒ 零挂起窗接管（防在已中止键上重开挂起窗 ∕ 重武装闩）。
    - **径③ `turn-face.mjs` 消费 ∕ 清理面**（:79 `opts.attached` 收 · :135 finally `cleanupTurn(attached?.paths ?? [])`）：出口形 `{ text, paths, degraded }` 不变 ⇒ **本档零改**（降级在交付面完成，不在执行面）。
    - **异步化波及**：`takeOver` 调用面（`drive` 两 then 回调 `:100 ∕ :101` · `suspension-drive.mjs:76` · driver 导出注入面）返回值皆无人消费 ⇒ fire-and-forget 零连坐；唯一 `if` 判 = 径② 一处（改 `await`）。
    - **`paths` 清理归属**：恒由 `turn-face.mjs:135` 回合尾 `cleanupTurn` 清——成功 ∕ 失败 ∕ 中止三径同归属（降级面只读不回收；`attached.paths` 恒随 `drive` 传递）；失败径出口形 = `{ text: 附说明行, paths: 照常交清理, degraded: "non-vision" }`。**例外 = 窗后查位径**（裁定 (i)）：占位被摘 ⇒ 零起跑 ⇒ 回合尾清理面不达 ⇒ **本径落盘件自清**（径① = 同款在飞占位闸；径② = `active()` 判据；各自 `cleanupTurn(attached?.paths ?? [])`——用既有清理面，零新语义）。
  - **忙锁 ∕ 取消**：降级窗 = 在飞占位在（径① = `send` 占位（release 前）∥ 径② = `hold` 占位）——窗内 `msg:interrupt` 命中占位 ⇒ 降级信号 abort（读图 fail-fast）；占位与 `executeTurn` 代次交接沿 `send` 现式（release 后同刻 `drive`——零 microtask 空窗）；`turn-face` 执行面零改。
- **已知差额（登记，三条）**：a-② 核 `runAgent` 无 `role` 选项形参——vision 子代理 `_role = "explore"` 落于 `createAgent`，prompt 装配面差异由 B1 判（VSC fork 面）；a-③ eng-state 透传：VSC fork 有 `engState` 参，核 `runAgent` 无 → 桌面旁路子代理随主代理配置（`config.agent.engineering`）——**行为等价判据 = `agent.config?.agent?.engineering` 单源**（核 `agent-tools/eng.mjs:64/:94` 同源读写），差异不成立；若实施期实证不等价 ⇒ 停手上报。
- a-④ **`resolveChildProvider` 替换 `providerFromConfig`**：核 `agent-tools/subagent-async.mjs:139-163`（读 `parent.config?.providersList`；渠道未知 ⇒ 抛；**key 存在性不校验**）vs VSC `presets.mjs:122-143`（key 缺 ⇒ 构造期 `null`）——**出口等价**：两向皆 `null` 原样兜底（判别时点差 = 构造期 vs spawn 期失败回落，`runVisionReader` catch 全收）⇒ 实施期按「渠道无 key ⇒ 原样兜底」对拍。

### 2.3 在册差异五条收正（F6 · `core/attachments.mjs:11-17` 逐条）
| # | 差异（核件档头逐字域） | 收正 ∕ 保留 | 方案（落点） | 理由 |
|---|---|---|---|---|
| ① | 阈单位：VSC `15*1024*1024`（二进制） vs 核十进制（对齐 `read_image` 闸 `tools/file.mjs:26`） | **收正** → 核 | VSC 消费核常量：核 `attachments.mjs` 导出 `IMAGE_MAX_BYTES`（:33 已导出）；VSC 本地字面删 | 与端侧内存闸同值同单位——宽于该闸的件落盘即废；用户不可见（`>14.3MB` 件本就读不进） |
| ② | 弃项索引：VSC 过滤后下标命名 vs 核源序命名（`i` 恒 = 输入序） | **收正** → 核 | 落盘命名走核件（VSC 循环体删） | 弃项不重编号 = 文件名恒映源序，调试面零歧义；用户不可见（路径仅注入串可见） |
| ③ | 合计预算闸：VSC 无此面（预算 = 桌面契约） | **收正** → 核 | VSC 合计预算走核 `savePastedImages`（`TURN_MAX_BYTES = 30MB` :36） | 30MB ∕ 轮 = 桌面在册契约（`docs/desktop/design/IPC.md` §2 附件注项 3）；超阈溢出弃后继续扫 |
| ④ | 降级成功判据：核 `out.ok !== true`（严） vs VSC 真值判 | **收正** → 核 | 判据随核件（`attachments.mjs:122`） | 缝契约 = `ok` 布尔（`visionReader` 缝），核严于真值判 ⇒ 假阳性降级（`ok` 畸形值）被拒，原样兜底 |
| ⑤ | 清理面：核不回收 vs 桌面逐回合显式清（`cleanupTurn`）· VSC `offloadToolResult` mtime 扫除兜底 | **保留**（两向皆在册） | 核件「不回收」句保留（档头 :16-17 收正：写明双边兜底——桌面 `cleanupTurn` ∕ VSC mtime 扫除） | 回收面 = 端侧时序面（核零回合生命周期）；VSC mtime 兜底已覆盖 paste-*（VSC 档头 :15-17 在册）⇒ 无落盘累积 |

- **注**：五条收正后，`core/attachments.mjs:11-17` 在册差异段改写为「收正已毕」记录（历史留档头，现行面 = 单源无差异）；VSC 侧差额点随 2.1-组③ 删残留。
- **R3 登记（射程外不动）**：`settings-panel-write.mjs:52` 的 `probeTargetFromEntry` 消费仍留 VSC 自持件（收编随 B10 设置面批）——本批不触，登记为跨批顺账。

### 2.4 关键决策（D 表）
| D | 决策 | 依据 ∕ 已排除项 |
|---|---|---|
| D1 | 设计载体 = §2 自持，不另立设计档 | closeout §2.0 先例（小件迁移轮）；核件面已在核设计档 ∕ 档头覆盖（2.0） |
| D2 | 五组一律「VSC 改指核件 + 宿主壳留端」——宿主 API（`vscode.window.*` ∕ `showQuickPick` ∕ `state.focused`）经注入缝留 VSC | 核件缝契约已在册（`ui` ∕ `notify` ∕ `focused` ∕ `reveal` ∕ `probe` ∕ `fs` ∕ `timer`）；排除「核件引 vscode」 |
| D3 | **档②「子任务完成」去留 = 去**（`digestStart` 从核件删，`NOTIFY_TEXTS.subagents` 删；desktop `suspension-drive` 调用点随删） | 用户口径「VSC 有即缺陷 ∕ 无则裁」；对位面 = VSC 无档②（实读 `panel-callbacks.mjs:236` 仅 `!autoTurn` 单档）⇒ 裁「去」；桌面单侧功能消 = 端差消。**此为产品级删减，随 §4 用户批准生效；若不批 ⇒ 档②回退为「VSC 补建档②」并另开批** |
| D4 | 非视觉降级 = 上提核件（跑者面上提 `vision-reader.mjs`），VSC ∕ desktop 同源消费 | 2.2 取一理由（桌面无跑者，复刻 = 造第二实现） |
| D5 | 删残留三面 = ①VSC `notify.mjs` 重写（19 → 约 24 行 · 净 +5——以 2.6 表为账）②`file-links.mjs` 薄壳（净 −26）③`image-handler.mjs` 薄壳（净 −75）+ `panel-messages.mjs` 拍家族接线（净 −8）+ `provider-flows.mjs` 薄壳（净 −105）；两 locales `notify.done` 死键删（2 行；`notify.view` 保留——按钮文案活键） | 逐档行数账见 2.6（vsc 计 ≈ −221）；删残留 = 单源纪律（双写窗口关闭） |
| D6 | `vision-channel.mjs`（24 行）：**薄 re-export 核件**——形决策（与端侧薄壳族同形；唯一消费面 `image-handler.mjs:24` 随改指核件） | 两向行为零差额；归档留文档侧（`docs/vsc/design/` 收正行） |
| D7 | 行为零变对拍 = 逐点表（2.1 各组 ∕ 2.2 差额）——迁移批的回归判据 | 「零行为变」= 本批第一验收面（用户措辞「行为零变对拍」）；实现者按表逐点核 |
| D8 | VSC `panel-callbacks.mjs:236` 门判据 ∕ `panel-messages.mjs` 拍体两门 ∕ `withVisionAbort` 忙锁序 **逐字保留**（只换下层） | 「形不乱动」口径（B1 §1.1 同口径搬用） |
| D9 | **语言面 = 显式缝 `localeOf`**（`createNotifier` 注入面 +1；VSC wrapper 携 `vscode.env.language`，核 `normalizeLocale` 归一 `zh-CN → zh`） | VSC `agent.config` 无 `locale` 供给面（`src/agent/agent-state.mjs:98-111` 白名单；`src/agent/*` = B1 域零触）⇒ 缝在 notifier 侧；桌面径缺省零改；语言选择单源 = wrapper 取值 |

### 2.5 影响与依赖（三树）
- **vsc 树**：`src/extension/{notify,file-links,image-handler,vision-channel,provider-flows,panel-messages,panel-callbacks,panel-messages-settings,settings,settings-panel-write,chat-panel}.mjs` + `panel-turn-stages.mjs`（零改·驻册） + `locales/{zh,en}.json` + `src/agent/*`（**零触**——B1 域）。
- **desk 树**：`src/main/{attachments,turn-driver,turn-chain,turn-face,suspension-drive}.mjs`（turn-face 零改——消费 ∕ 清理面）。
- **core 树**：`attachments.mjs`（导出随动）· `vision-reader.mjs`（新）· `provider-flows.mjs`（`hostBusyOverride` 缝随动）· `notify-policy.mjs`（`localeOf` 缝 + D3 去档②随动——若批）。
- **F7（射程外登记）**：`thincoder-core/agent-tools/subagent-spawn.mjs` 的 `engState` 选项面 = B1 域（VSC fork）——本批不动。

### 2.6 受影响文件表（**落档实点 = 届盘实读** ∕ 行数 = `split("\n").length` 口径（设计同口径）；改前 = 设计轮实点；实 Δ，括号内 = 设计记；W1 ∕ W2 逐档对账 = §5.4 ∕ §5.5）
**core 树**（改前 → 落档实点）
| 文件 | 行数（改前 → 落档实点） | 实 Δ（设计记） | 动作（落档） |
|---|---|---|---|
| `thincoder-core/vision-reader.mjs` | — → 77 | 新 +77（设计记 +80 行内） | 新档：`findVisionChannel` ∕ `runVisionReader` ∕ `VISION_READ_TIMEOUT_MS`；W8 断链：静态边 ⇒ 函数体内动态 import（#112） |
| `thincoder-core/attachments.mjs` | 126 → 126 | ±0 | 差异段收正（①–④ 收正 ∕ ⑤ 两向在册）；代码零改（`IMAGE_MAX_BYTES` :33 已导出） |
| `thincoder-core/provider-flows.mjs` | 249 → 249 | ±0（设计记 +约 8——缝在盘零 diff） | `hostBusyOverride` deps 缝 ∕ 逐层透传在盘（:119）；迁移留后句收正 |
| `thincoder-core/notify-policy.mjs` | 57 → 52 | −5（设计记 −约 5） | `localeOf` 缝 + D3 去档②（`digestStart` ∕ `subagents` 词键删；`NOTIFY_TEXTS` 收单档） |
| `thincoder-core/tools/index.mjs` | 79 → 80 | +1（#108 补件） | `repoOutlineTool(memory?.db, cwd)`（:72）——`assembleBuiltinTools` 缺 memory 组装期零解引用（缺位不抛 ∕ 有 memory 零变） |

**vsc 树**（改前 → 落档实点）
| 文件 | 行数（改前 → 落档实点） | 实 Δ（设计记） | 动作（落档） |
|---|---|---|---|
| `src/extension/notify.mjs` | 19 → 24 | +5 | 重写 = 核策略包装（`createNotifier` + `localeOf` 接线） |
| `src/extension/file-links.mjs` | 42 → 17 | −25（设计记 −26） | 薄壳（核件 + 探针注入） |
| `src/extension/image-handler.mjs` | 130 → 52 | −78（设计记 −75） | 薄壳（核 `savePastedImages` + `withVisionAbort` 包装 + 父面补面） |
| `src/extension/vision-channel.mjs` | 24 → 11 | −13（设计记 −12） | 薄 re-export 核件（D6） |
| `src/extension/provider-flows.mjs` | 175 → 39 | −136（设计记 −105） | 薄壳（ui 注入 + 核三流程 + 核探针） |
| `src/extension/panel-messages.mjs` | 358 → 355 | −3（设计记 −8） | 拍家族核接线 + `savePastedImages` 三调用点新出口形；`LIVE_HEARTBEAT_MS` re-export |
| `src/extension/panel-turn-stages.mjs` | 241 → 241 | ±0 | `downgradeNonVisionImages` 消费 ×2（:191 ∕ :237）——返形兼容 ⇒ 本批零改（驻册）；届盘实读现 251——超出本批落点，归因待 §6 对账 |
| `src/extension/panel-callbacks.mjs` | 317 → 317 | ±0 | :236 调用点改核 notifier（`?.` 形；门判据逐字保留） |
| `src/extension/chat-panel.mjs` | 431 → 433 | +2 | `_notifier` 装配（:16 import + :80 构造段同位字段）；释放点 = 无（零宿主句柄——dispose :167 零动作；调用点 `?.` 防御） |
| `src/extension/panel-messages-settings.mjs` | 205 → 205 | ±0 | 三流程调用点加 ui 参（行内改） |
| `src/extension/settings.mjs` | 410 → 410 | ±0 | 探针消费形兼容（`:322` 弃返回值）⇒ **零改** |
| `locales/zh.json` ∕ `en.json` | 272 → 271 ×2 | −2 行 | `notify.done` 死键删（`notify.view` 保留——按钮文案活键；D5） |
| **vsc 计** | | **−250 净**（实点逐档相加：+5 −25 −78 −13 −136 −3 −2 +0 +2；设计记 约 −221） | （不含 settings ∕ panel-messages-settings ∕ panel-callbacks 行内零改） |

**desk 树**（改前 → 落档实点）
| 文件 | 行数（改前 → 落档实点） | 实 Δ（设计记） | 动作（落档） |
|---|---|---|---|
| `src/main/attachments.mjs` | 76 → 108 | +32（设计记 +约 40） | 非视觉降级接入（判决序改写 + `degradeTurnAttachments` + `visionReader` 缝 + 失败回退；档头 ∕ :52 注改写） |
| `src/main/turn-driver.mjs` | 222 → 256 | +34（设计记 +约 12） | `send` 径降级 + **窗后查位**（:192-197，含落盘件自清）+ `hold` 供面（:113-121——`{ signal, active, release }`）+ `takeOver` 转 async（:128）与**窗后复查位**（:131） |
| `src/main/turn-chain.mjs` | 76 → 100 | +24（设计记 +约 10） | `continueTurn` 转 async（:65）+ 降级 await 窗（:76-89——`hold` 占位 ∕ `active()` 窗后查位 ∕ 自清） |
| `src/main/turn-face.mjs` | 141 → 141 | ±0 | **零改**（`opts.attached` 收 :79 ∕ 回合尾 `cleanupTurn` :135——出口形不变） |
| `src/main/suspension-drive.mjs` | 280 → 279 | −1 | D3 随动：`digestStart` 调用点删（:136——`turnDone` 调用面 :115 不动）；届盘实读现 284——超出本批落点，归因待 §6 对账 |

- **口径 ∕ 补册注**：行数 = `split("\n").length` 口径（设计同口径——基线 `ff7b7e95` 逐档复算全对口；§5.6 表记 `vision-reader.mjs` 76 = wc 口径，其括注「split 元素口径 77」同值）· 补册件 = `thincoder-core/tools/index.mjs`（#108 微件 · §5.3）+ `vision-reader.mjs` W8 断链笔（#112 · §5.6）——原表未列，本册补入；W1 ∕ W2 各档实点溯源 = §5.4 ∕ §5.5 改动表；届盘实读 = 本补笔时点（工作树含他批在飞改动——超本批落点者逐行注明）。

- **测试面**：存量单测已全退役（2026-09-28 全清重置：`thincoder-vscode/test/files.mjs:8` ∕ `thincoder-desktop/test/files.mjs:3` = `export default []`；`thincoder-core/test/run.mjs:41-45` 空清单即绿）⇒ **无既有基线**；本批验收 = **批内件 + 逐点对拍 + 真机走查**。
- 批内件 = `docs/batches/2026-09-29-parity-b4-vsc-small.test.mjs`（新增 · 约 120 行内——2.9 用例表转用例；执行 = `node --test docs/batches/2026-09-29-parity-b4-vsc-small.test.mjs`，先例 = `docs/batches/2026-09-28-desktop-session-title.test.mjs`）。**集成面零改**（`test/integration` 清单一律零触——集成集重建按业务设立，非本批面）。

### 2.6a 行数补录（2.6 表实点 ∕ 零触件）
- `thincoder-vscode/src/extension/panel-messages-settings.mjs` **205 行**（Δ 三流程调用点行内改，净 ±0）· `thincoder-vscode/src/extension/settings.mjs` **410 行**（本轮**零触**——探针消费形兼容）· `settings-panel-write.mjs` **200 行**（本轮零触——R3 登记件）· `locales/{zh,en}.json` **各 272 行**（Δ −2 行 ∕ 档）。
- **tier 注（越 300 顾问线的在改档）**：`panel-messages.mjs` 358→355（净 −3）· `panel-callbacks.mjs` 317→317（行内改）· `chat-panel.mjs` 431→433（+2）——三者本批净减 ∕ 零增 ⇒ **不新增拆分债**（拆分面 = 各自下次实质改动时另议）；`settings.mjs` 410 本轮零触（非在改档）。

### 2.7 实施序（四波 · 依赖序）
- **W0 核件波（先）**：`vision-reader.mjs` 新档（`findVisionChannel` + `runVisionReader`）· `attachments.mjs` 差异段收正 + `IMAGE_MAX_BYTES` 消费面就绪 · `provider-flows.mjs` `hostBusyOverride` 缝接线 · `notify-policy.mjs` `localeOf` 缝 + D3 去档②（**随 §4 批准条件**）。验收：批内件 + 核件逐点对拍（差异五条 ∕ `localeOf` ∕ `vision-reader` 纯函数）。
- **W1 vsc 波（依赖 W0 名面）**：组① notify 改指（+ `notify.done` 死键删——2 行；`chat-panel` `_notifier` 装配）→ 组② file-links 薄壳 → 组③ image-handler 薄壳（`vision-channel.mjs` re-export）→ 组④ 拍家族接线 → 组⑤ provider-flows 薄壳 + 调用点三处。验收：批内件 + 逐点对拍表（2.1）+ VSC 真机走查（通知 zh ∕ en 两例——D9）。
- **W2 desk 波（依赖 W0 跑者）**：`attachments.mjs` 非视觉降级接入（判决序 ∕ `degradeTurnAttachments` ∕ 档头 :14-16 与 :52 注改写）→ `turn-driver` ∕ `turn-chain` 接线（三径小表 2.2——含 `hold` 缝 ∕ `await` 改）→ D3 随动（`suspension-drive:136` 调用点删）。验收：批内件 + 真机走查（无视觉模型 + 视觉渠道 ⇒ 描述注文；失败径 ⇒ 说明行 + `degraded: "non-vision"`）。
- **W3 收口波**：批内测试件（`docs/batches/2026-09-29-parity-b4-vsc-small.test.mjs`）· 文档收正行（核件档头（差异段 ∕ 迁移留后句）· `docs/vsc/design/` 相关行）· **desk 文档收正（评审 #59 发现 3）**：`docs/desktop/design/IPC.md` §2 附件注 项 4（`:213`「假 ⇒ 不落盘、不注入」句 ⇒ 「假 ⇒ 先落盘 + 降级跑者——成功 = 描述注文 ∕ 失败 = 文本说明行」）· `UI.md` 项 2 降级面行（:48 两码语义）· `PROJECT.md` KD-21（:59）+ T-DSK30 ②（:698 验收行）同批收正 · 差异五条收正记录。
- **并行面**：W0 与 W1 的**准备**可并行；W1 内五组互不依赖可并（同档冲突时按序）。**禁并**：W2 与 W1 的 `image-handler.mjs` ∕ 核件同档写。

### 2.8 回归判据 ∕ 验收对照（逐条 ↔ 三链）
| 验收项（批任务书） | 判据（机检 ∕ 对拍） | 三链坐标 |
|---|---|---|
| ① 五组方案逐件（含 VSC 删残留行数账） | 2.1 五组 ∕ 2.6 行数账（Δ 逐档） | B4 ;46 ;83 ;89 ;90 ;96 ;113 + 重造④⑤⑦⑧ + 上提③④⑥⑦⑧ |
| ② 非视觉降级对齐设计 | 2.2（取上提理由 + 形逐点 + desktop 三径小表 + 差额三条） | :90 |
| ③ 差异五条逐条收正方案 | 2.3 表（五条 = 收正×4 + 保留×1） | F6（`core/attachments.mjs:11-17`） |
| ④ 档②裁决 | D3（去 ∕ 随 §4 批准；不批 ⇒ 回退另开批） | §3④ |
| ⑤ 受影响文件表 + 实施序 | 2.6 ∕ 2.6a ∕ 2.7 | — |
| ⑥ §2 落盘 | 本节在盘 | — |
- **行为零变判据（D7 逐点表）**：通知文本 ∕ 语言选择 ∕ 按钮文案 ∕ 门判据（2.1①）· 链接抽取（2.1②）· 落盘命名 ∕ 判据（2.1③）· 拍周期 ∕ 两门（2.1④）· 拒因串 ∕ 步序（2.1⑤）· 降级注文（2.2）——逐点「迁移前后同」为机检项；**能机检的落用例**（批内测试件），**不能机检的（通知点击 ∕ 宿主忙覆盖）落真机走查**。
- **负向判据（不许碰）**：B1 ∕ B2 ∕ B5 ∕ B7 ∕ #564 射程 ∕ `src/agent/*` ∕ `suspension.mjs` ∕ `loop-sampler.mjs` ∕ `settings-panel-write.mjs` 零触。

### 2.9 用例表（批内测试件 —— 正常 ∕ 边界 ∕ 错误；执行 = `node --test docs/batches/2026-09-29-parity-b4-vsc-small.test.mjs`）
| 用例 | 面 | 输入 | 预期输出 |
|---|---|---|---|
| 核 `live-beat` 单拍 ∕ 起停 ∕ 幂等 | 组④ | 假钟注入 + beat 计数 | 起拍返句柄一次；`beat()` 直驱计数；停后 `beat` 零调 |
| 核 `file-links` 探针缺 → 抛 | 组② | `extractFileLinks(cwd, text)` 无探针 | TypeError（fail-loud） |
| 核 `file-links` 存在闸 | 组② | 探针 = 假 `{existsSync: p=>p==="a.mjs"}` | 仅 `a.mjs` 成链接 |
| 核 `attachments` 预算 ∕ 弃项源序 | 组③ | 3 项超合计预算 | `dropped` 计数 + 落盘件命名源序 |
| 核 `downgradeNonVisionImages` 三径 | 组③ | 无图 ∕ 多模态 ∕ 非视觉 | 早退 ∕ 早退 ∕ 注文成功；缝缺 → 抛 |
| 核 `vision-reader` 无渠道 | 2.2 | 空 provider 表 | `null`（原样兜底） |
| 核 `provider-flows` 拒因 | 组⑤ | 空名 ∕ 重名 ∕ 非法 format | 同串拒因 |
| 核 `notify-policy` 单档（D3 批后） | 组① | 失焦 + turnDone | 落子；`digestStart` 不存在 |
| 核 `notify-policy` `localeOf` 缝 | 组① | 缝注入 `"zh-CN"`（agent 无 `locale`） | 文本落 zh（`normalizeLocale` 归一） |
| desk `degradeTurnAttachments` 三径 | 2.2 | 桩 `visionReader`：成功 ∕ 失败 ∕ 多模态 | 注文 + `degraded:null` ∕ 说明行 + `"non-vision"` ∕ 原样（指针径） |
| desk `continueTurn` 异步化 | 2.2 | 空队 ∕ 队非空 + 降级窗内并发 `send` | `false` 直返 ∕ 降级毕交付；窗内 `send` 落队（单驱动器不变量） |

### 2.10 边界（本批不做）
- 不做：核件重设计（只增跑者 + 缝随动 + 差异收正）；新机制；B1–B10 其它批射程；`src/agent/*` ∕ suspension ∕ skills ∕ peers（B1）；队列族（B2）；设置面 ∕ UI 面（B10）；CLI 侧任何档（本批射程 = vsc ∕ desk ∕ core 三树，cli 零触）。
- 不做：VSC 集成测试 ∕ 桌面冒烟改动；文档大改（实施面档头随动归 W3 收口）。
### 2.11 UI ∕ 交互落点（全部落定，无 `open`）
- 通知点击 = **打开 thincoder 视图 / 聚焦面板**（VSC 沿旧"查看"按钮；desktop 沿旧"聚焦窗口"）——宿主面差异在册，不改为对齐项。
- provider 三流程 UI = QuickPick ∕ InputBox 逐点同旧（占位串 ∕ `password` ∕ quickpick 项形）。
- 非视觉降级 UI = 成功径无 UI（描述注文随消息）；失败径桌面文本提示词键 `composer.attach.nonvision` 形不变；VSC 沿旧（原样兜底 + 主回合 setup 现报错文案）。
- 档②删后 UI 变化 = 桌面「子任务完成」系统通知不再出现（D3 —— 随 §4 批准）。

### §2 修正块（评审 #59 修正轮 · 2026-09-29 · eng-designer）

**段位**：本段 = 评审 #59（changes-required · 🔴3 ∕ 🟡5 ∕ 🔵3）逐条落修——**段内就地修正**（本作者段内；评审发现落地，原行可由 git 历史逐字复核）+ 本块逐条记录；不夹带新范围；本轮坐标 = 修正轮实读（2026-09-29 04:4x）。

**逐号收口（1..11）**

| # | 处置 | 落点 |
|---|---|---|
| 1 | ✅ 保留 `notify.view`（2.11「查看」按钮文案——活键不删）；死键账收正 = `notify.done` 删 2 行；对拍表补按钮文案行 | 2.1①（删残留 ∕ 对拍）· D5 · 2.6 locales 行 + vsc 计 |
| 2 | ✅ 语言面显式缝 = `localeOf`（`createNotifier` 注入面 +1；VSC wrapper 携 `vscode.env.language`，核 `normalizeLocale` 归一）——不取 agent 配置供给面（`src/agent/*` = B1 域零触）；对拍表补语言行；真机 zh ∕ en 两例入 W1 | 2.1① 对拍 · D9（新）· 2.6 notify-policy 行 · 2.7-W1 |
| 3 | ✅ desk 侧文档收正行入 W3（IPC.md §2 项 4 `:213` ∕ UI.md `:48` ∕ PROJECT.md KD-21 `:59` + T-DSK30 ② `:659`）；desk `attachments.mjs:52` 与档头 `:14-16` 改写入 W2 | 2.7-W2 ∕ W3 |
| 4 | ✅ desk 三径接线小表（径① `turn-driver:161-163` ∕ 径② `turn-chain:61` + `hold` 缝 + async ∕ 径③ `turn-face:79/:135` 零改）；降级参数面 `{ model, cwd, parentAgent, locale, visionReader, signal }`；`takeOver` 随 async、`:111` `await` 改；paths 清理归属 = `turn-face:135`；失败径出口形在册 | 2.2（形段 ∕ 三径小表 ∕ 忙锁）· 2.6 desk 行 |
| 5 | ✅ 2.6 补三行（`suspension-drive` −1 ∕ `panel-turn-stages` ±0 ∕ `chat-panel` +2）；`_notifier` 装配 ∕ 释放一句（构造建；零宿主句柄 ⇒ 释放点 = 无；调用点 `?.` 防御）；批内件规模注 ≈120 行内 | 2.6（vsc ∕ desk 表）· 2.6a · 2.9 |
| 6 | ✅ 调用点两清单分列（`savePastedImages` ×3 ∕ `downgradeNonVisionImages` ×3——含 `panel-turn-stages:191/:237`）；「返形兼容 ⇒ `panel-turn-stages` 零改」明写 | 2.1③ |
| 7 | ✅ 验收口径写死：存量单测全退役（三档证据在册）——「既有单测随迁补」句删；W0–W2 验收 = 批内件（`node --test docs/batches/2026-09-29-parity-b4-vsc-small.test.mjs`）+ 逐点对拍 + 真机走查 | 2.6 测试面 · 2.7-W0/W1/W2 · 2.9 |
| 8 | ✅ D6 理由改 = 形决策（端侧薄壳族同形；两向零行为差额；唯一消费面 `image-handler.mjs:24`） | D6 |
| 9 | ✅ tier 注落 2.6a（`panel-messages` ∕ `panel-callbacks` ∕ `chat-panel`——不新增拆分债）；`settings.mjs` 动作定稿 = **零改**（`:69-73` 读 `{ok,error}`、`:322` 弃返——非在改档） | 2.6a · 2.1⑤ · 2.6 settings 行 |
| 10 | ✅ 逐条收正：(a) 「字面 `multimodal` 零命中；`isNonVisionModel` 命中 `attachments.mjs:14 ∕ :23 ∕ :58`」；(b) 「`specForModel` 有直引（`providers.mjs:26` ∕ `settings.mjs:33`——推理档位面，不经非视觉判定）」；(c) 测试面句重写（无「三处列四名」）；(d) D5 `notify.mjs` 记值收正（19 → 约 24 · +5——以 2.6 表为账）；(e) 「无 `vscode` 导入」收正 = 保留 import（宿主 API 面） | 2.2-理由 · 2.6-测试面 · D5 · 2.1① |
| 11 | ✅ 差额 +a-④（`resolveChildProvider` vs `providerFromConfig`——出口等价：两向 `null` 兜底；判别时点差在册） | 2.2-差额（两条 → 三条） |

**定形三件（验收口径）**：① 计数三处同步 = 2.1① ∕ D5 ∕ 2.6（`notify.done` 死键 2 行；`notify.view` 留档——按钮文案活键）· ② 语言缝写明 = `localeOf`（2.1① 对拍 + D9）· ③ W3 desk 文档行在（IPC ∕ UI ∕ PROJECT 三档四处）。

**计数同步（发现 1 ∕ 2 口径）**：locales 死键 = **−2 行**（`notify.done` × 2 档；`notify.view` 保留）；vsc 计 = **约 −221 净**（+5 −26 −75 −12 −105 −8 −2 +0 +2）；`notify-policy.mjs` 57 → 约 52（D3 −8 ∕ `localeOf` +3）。

**本轮未触**：产品码 ∕ 测试件 ∕ §5 ∕ §6 ∕ 核件实体 ∕ 其它批射程；读回核验 = 段内修正与本块落毕后逐处复读（结论见交付报告）。

### §2 段位补笔（2026-09-29 · eng-designer）

**触发** = §1.6 W3 待办汇①（设计文本随动）+ ⑤（§2.6 表档籍）+ W2 落档实点入册。**来源** = §1.5 ∕ §1.6 裁定原文 + §5.5 改动表 + 届盘实码逐处复核（父侧 2026-09-29 06:3x 裁定「按自拟落」——§5.7 当时未在盘（#86 在飞），本笔以一手材料落；父侧将就 §2 ↔ §5.7 对拍）。

**落位（逐项）**：
- 2.2 随动三笔：径② 行 —— `hold` 形 `{ signal, active, release }`（`active()` = 占位仍在判据）+ 窗后查位（裁定 (i)）；`takeOver` 行 —— 窗后复查位（`:131`）；`paths` 清理行 —— 窗后查位径落盘件自清（例外面）。
- 2.6 补册：三树表改「改前 → 落档实点」（W1 ∕ W2 各档 + `tools/index.mjs`（#108）+ `vision-reader.mjs` W8 笔（#112）+ 两处超本批落点差异如实两读）；2.6a tier 行随实点；口径注（split 口径——§5.6 表记 76 与 77 之辨）随表。

**范围**：只动本节（§2）——产品码 ∕ 测试件 ∕ 五档文档 ∕ 其它批射程零触；行数 = 届盘实读（基线 `ff7b7e95` 复算对口）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审对象**：`thincoder/docs/batches/2026-09-29-parity-b4-vsc-small.md` §2（状态行「设计完成 · 2026-09-29」）——与盘上 vsc ∕ core ∕ desk 三树逐点对读（2026-09-29 实读；行数注记逐档抽查全部准确）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Clarity ∕ 一致性 | 🔴 | `notify.view` 双重定稿：改写稿把按钮文案取 `t("notify.view")`（批档 :31），同组删残留账（:34）+ D5（:92）+ 2.6 表（:124）把 `notify.view` 定为死键删（`locales/zh.json:223` ∕ `en.json:223`）；`t()` 缺键回退返回键名（`thincoder-vscode/src/i18n.mjs:64-71`）⇒ 照删残留执行则按钮文案变字面 `notify.view`，与 2.11「VSC 沿旧『查看』按钮」（:175）及「行为零变」判据（:94 ∕ :156）冲突。 | 二者择一：`notify.view` 留档并从死键账撤下（删残留改 2 行），或改写稿改用别处文案源；行数账 ∕ D5 ∕ 2.6 三处同步，对拍表补按钮文案一行。 |
| 2 | Requirements ∕ 验收覆盖 | 🔴 | 组①文本语言选择面未对拍：核 `langOf` 取 `agent?.config?.locale`（`thincoder-core/notify-policy.mjs:39`），VSC 装配面白名单无 `locale` 键（`thincoder-vscode/src/agent/agent-state.mjs:98-111`；`src/agent/setup.mjs:189-202` 同）⇒ VSC 恒判 en；今日走 `t()` + `initLocale(vscode.env.language)`（`src/extension/notify.mjs:11`；`extension.mjs:98`）——zh 系 VS Code 用户通知正文由「ThinCoder：本轮完成」变「ThinCoder: turn complete」。2.1①「逐字同值」只证串同，不证选择器同。 | 显式携语言（注入缝，或 VSC 侧补 `config.locale` 供给面）并把该点入 2.1① 对拍表；真机走查补 zh ∕ en 两例。 |
| 3 | Document ownership | 🔴 | desktop 非视觉面改「先落盘 + 降级」与在册设计档矛盾：`docs/desktop/design/IPC.md:213`（§2 附件注 项 4「假 ⇒ **不落盘、不注入 `images`**」）· `UI.md:48` · `PROJECT.md:59`（KD-21）∕ `:659`（T-DSK30 ②）逐条在册；批档 :68 只述同函数替换，2.5 ∕ 2.6 ∕ W3（:144）未列 desk 侧文档收正行，亦未按 Project Guide「Docs conflict → stop and report」上报。 | desk 侧受动行入 W3（IPC.md §2 项 4 ∕ UI.md 批 B 注 ∕ PROJECT.md KD-21 + T-DSK30 验收行同批收正），或先上报冲突再定；`thincoder-desktop/src/main/attachments.mjs:52`（判决序「非视觉先于阈判定：不落盘」）与档头 :14-16 同步改写。 |
| 4 | Clarity | 🟡 | desk 降级接线欠定形：`degradeTurnAttachments(attached, { visionReader, signal })`（:69）参数面缺 `model`（核判据要 `model`——`thincoder-core/attachments.mjs:116`）与 parentAgent ∕ cwd；`continueTurn` 为同步函数（`turn-chain.mjs:55`）、调用点 `turn-driver.mjs:111` 用 `if (chain.continueTurn(...))` truthy 判（改 async 后恒真 ⇒「队列先于接管」静默失效）；失败径落盘件清理契约未写（`turn-face.mjs:135` `cleanupTurn(attached?.paths ?? [])`）；第三径锚「`turn-face.mjs`（:123 截图窗口）」与附件面不符（:123 = `await runWithResume()`，附件消费在 :79 ∕ :135）。 | 补 desk 三径接线小表：插入点行号、异步化波及（continueTurn ∕ takeOver）、`paths` 清理归属、失败径 `degraded` 与 `paths` 出口形。 |
| 5 | Affected files（判据 #8） | 🟡 | 2.6 表缺本批要改的档：`thincoder-desktop/src/main/suspension-drive.mjs`（280 行；W2 要删 :136 `notify?.digestStart?.` 调用点）无行无 Δ；`thincoder-vscode/src/extension/panel-turn-stages.mjs`（`downgradeNonVisionImages` 三调用点占二——:191 ∕ :237）与 `chat-panel.mjs`（:98 树表在列、2.6 无行；新字段 `panel._notifier` 全仓零命中、装配 ∕ 释放点未定）均未登记；批内新测试件无规模注。 | 补齐这些行（现行数 + Δ + 动作），使 2.6 与 2.5 树表 ∕ W1–W2 动过的档对齐；`panel._notifier` 初始化 ∕ 释放点写成一句（含缺位行为）。 |
| 6 | Clarity | 🟡 | 组③调用点清单不实：:44「调用点 = `panel-messages.mjs:157 ∕ :162 ∕ :183`」实为 `savePastedImages` 的调用点；`downgradeNonVisionImages` 真实调用点为 `panel-messages.mjs:187` ∕ `panel-turn-stages.mjs:191` ∕ `:237`（该文件未入射程，仅「包装层逐行保返形」间接兜底）。 | 按导出面分列两个调用点清单（含 `panel-turn-stages.mjs`），并明写「返形兼容 ⇒ 该档零改」或入 2.6。 |
| 7 | 验收 ∕ 可验证性 | 🟡 | 验收基线不实：存量单测已于 2026-09-28 全退役（`thincoder-vscode/test/files.mjs:8` `export default []`；`thincoder-core/test/run.mjs:41-45` 空清单即绿；`thincoder-desktop/test/files.mjs:3` 空）⇒ 2.6「核件三处……既有单测随迁补」与 W1「VSC 单测（`npm test`）」∕ W2「桌面单测」无既有基线。 | 写死批内件执行口径（先例 `docs/batches/2026-09-28-desktop-session-title.test.mjs:3`：`node --test docs/batches/<批>.test.mjs`），删 ∕ 改「既有单测」句；W0–W2 验收改「批内件 + 逐点对拍 + 真机走查」。 |
| 8 | Evidence（D6） | 🟡 | D6（:93）理由不成立：`panel-messages-turn.mjs:107` 是 W15 合成 parent 注释（与该档无关）；`vision-channel.mjs` 唯一消费面是 `image-handler.mjs:24`（design 自身改指核件），全树 grep 零他处 ∕ 测试面 import ⇒「保 id 面」缺依据。 | 删 ∕ 改该理由，或改记「与整合批对齐的形决策」；两向决定本身无行为差额。 |
| 9 | Affected files（判据 #8） | 🔵 | 行数注记抽查全准（core 126 ∕ 249 ∕ 57；vsc 19 ∕ 42 ∕ 130 ∕ 24 ∕ 175 ∕ 358 ∕ 317 ∕ 205 ∕ 410 ∕ 200；locales 272；desk 76 ∕ 222 ∕ 76 ∕ 141）；但两处越 300 顾问线的在改档未标 tier ∕ 拆分面（`panel-messages.mjs` 358→约 350 ∕ `settings.mjs` 410，后者动作栏「无改或有改 —— 行内」未定稿）。 | 补 tier 行 ∕ 拆分意见（本批减行可写明「不新增拆分债」）；`settings.mjs` 动作栏定稿为一个确定值；批内新件补规模注。 |
| 10 | Evidence ∕ 数字 | 🔵 | 小项漂移：(a)「desktop 树 `multimodal` 仅命中 `attachments.mjs:14/:23`」（:64）实为 `isNonVisionModel` 命中（:14 ∕ :23 ∕ :58），字面 `multimodal` 零命中；(b) 同段「无 `specForModel` 直引」不实（`src/main/providers.mjs:26` ∕ `settings.mjs:33` 有直引；非视觉面结论不受影响）；(c) 2.6 测试面「核件三处」列四名；(d) D5「notify.mjs（−19 净）」与 2.6 表「+5」冲突（各档求和 = −221 ≈ 表尾 −220 ⇒ −19 系笔误）；(e) :31「无 `vscode` 导入」与同句改写稿 `vscode.window.*` 自相矛盾（实现须保留 import）。 | 逐条收正引用 ∕ 数字（以 2.6 表为准）或标注「示意」。 |
| 11 | Feasibility | 🔵 | 核跑者构造面差异未入差额清单：`resolveChildProvider`（`agent-tools/subagent-async.mjs:139-163`，读 `parent.config?.providersList` 且不校验 key 存在）替代 VSC `providerFromConfig`（`src/extension/presets.mjs:122-143`，key 缺 ⇒ null）⇒ 2.2 对拍表「渠道无 key ⇒ null」非逐字保留（改 spawn 期失败回落）。 | 登记为第四条差额，或写等价理由（两向出口皆 null 回落）供实施期对拍。 |

**范围限制（说明）**：批任务书 ∕ annex ∕ `parity-closeout` §2 B4 坐标不在本轮评审 scope（未读）⇒ 需求覆盖只按批档 2.8 自映射表判；无文档地图 ⇒ Document ownership 判据按 Project Guide 降级执行（第 3 条按在册档矛盾处理）。

VERDICT: changes-required
计数：🔴 3 · 🟡 5 · 🔵 3（共 11 条）

### 轮次 2（评审子代理）

**轮次 2 复核（修正轮后 · 评审子代理）**

**对象**：同 §2（含 `## §2 修正块（评审 #59 修正轮 · 2026-09-29）`）——与盘上 vsc ∕ core ∕ desk 三树 + 在册设计档逐点复读（2026-09-29 本轮实读；本回复核 = 对轮 1 表 1..11 逐条验真 + 修后残留 ∕ 新增小项）。

**结论**：轮 1 的 11 条（🔴3 ∕ 🟡5 ∕ 🔵3）**全部落修**——落修文本与新增锚点逐条复读命中；无新 🔴；余 4 小项（🟡1 ∕ 🔵3，皆不阻断）。

**逐条复核（1..11）**：
1 ✅ `notify.view` 保留（批档 :34 ∕ :35 ∕ D5 :105 ∕ 2.6 :140/:141 ∕ 2.6a :156 ∕ 计数 :224 全一致）；`notify.done` 唯一读者 = `notify.mjs:11`（全树 grep 复读）；`t()` 缺键回退未触发（i18n.mjs:66 仅备查）。
2 ✅ D9 `localeOf` 缝（:31 ∕ :34 ∕ :109 ∕ :124 ∕ :161）；核 `normalizeLocale` 支持 `zh-cn → zh`（core/i18n.mjs:79）；基线 `initLocale(vscode.env.language)`（extension.mjs:98）+ VSC `agent.config` 无 `locale`（agent-state.mjs:98-110 白名单）复读成立。
3 ✅ W3 增 desk 四坐标（:163）：IPC.md:213 ∕ UI.md:48 ∕ PROJECT.md:59 逐字命中；T-DSK30 行号 `:659` 错（实 `:698`）——余项 R1。
4 ✅ 三径小表（:75-82）：锚 `:111` ∕ `:100/:101` ∕ `:161-163/:164` ∕ `:79/:135` 复读全对；async 波及 ∕ `hold` 缝 ∕ `paths` 清理归属 ∕ 失败径出口形在册。
5 ✅ 2.6 补三行：suspension-drive 280（−1）· panel-turn-stages 241（±0）· chat-panel 431（+2，`:78 ∕ :167` 锚对）；批内件规模注 ≈120 行内。
6 ✅ 调用点两清单（:46-47）：`:157/:162/:183`（savePastedImages）· `:187 ∕ panel-turn-stages:191/:237`（downgrade）· `:122`（`visionReader ?? runVisionReader`）复读全对。
7 ✅ 测试面口径（:152-153）：`test/files.mjs:8` ∕ `test/files.mjs:3` = `export default []` · core `test/run.mjs:41-45` 空清单即绿——三档证据复读命中。
8 ✅ D6（:106）改形决策；`vision-channel.mjs` 唯一消费面 = `image-handler.mjs:24`（全树 grep 复读成立）。
9 ✅ 2.6a tier 注（:157）；`settings.mjs` 定稿零改（:139 ∕ :156；`:322` 弃返复读）。
10 ✅ (a)-(e) 逐条收正：(a) desktop 树字面 `multimodal` 零命中（全树 grep）；(b) `specForModel` 直引 = providers.mjs:26 ∕ settings.mjs:33（复读）；(d) D5 记 +5（:105）；(e) :31 保留 vscode import。
11 ✅ a-④（:84）：`subagent-async.mjs:139-163`（key 存在性不校验）∥ `presets.mjs:122-143`（key 缺 ⇒ null）复读成立。

**余项表**（本轮新表 · 🔴 0 · 🟡 1 · 🔵 3，共 4 条）：

| # | Orig# | File | Severity | Status | Notes |
|---|-------|------|----------|--------|-------|
| R1 | 3 | `docs/desktop/design/PROJECT.md` | 🔵 | 坐标错 | 批档 :163 记「T-DSK30 ②（`:659` 验收行）」；`:659` 实为 §6.3 批级判据行①（「\| ① \| 四部分落点与命名规则可机检 \| …」），T-DSK30 行实在 `:698`（「\| T-DSK30 \| 正常 · 附件与复制（D13） \| …」）。文件名 ∕ 项名正确，仅行号错。 |
| R2 | (new) | 批档 :32 ∕ :137 | 🔵 | 内部小不一致 | :32 改写稿 = `panel._notifier.turnDone({ agent: panel._agent })`（无 `?.`）；:137 动作栏 = 「调用点 `?.` 防御」——两处调用形建议统一。 |
| R3 | (new) | `docs/desktop/design/IPC.md:99` | 🟡 | 在册档随动缺项 | D3 删 `NOTIFY_TEXTS.subagents`（:103 ∕ :124 ∕ :150 ∕ :188）后，注册 `notify.*` 两键的在册行（IPC.md:99）成陈旧（两键 ⇒ 一键）；W3（:163）desk 清单未含此行——建议随 §4 批准条件并入 W3 ∕ D3 随动（非阻断）。 |
| R4 | (new) | 批档 :115 | 🔵 | 路径不精确 | 「`core/agent/subagent-spawn.mjs`」实档 = `thincoder-core/agent-tools/subagent-spawn.mjs`（登记行，无行为影响）。 |

**计数（本轮）**：🔴 0 · 🟡 1 · 🔵 3（共 4 条）；轮 1 的 11 条全部落修。

VERDICT: pass

## §4 用户批准（主 agent）

### 4.1 批准（父侧代执行 · 2026-09-29 05:0x）

- **依据** = 十批全修令 + 排空授权执行口径（三条件：评审 pass ∧ 修正落地核验 ∧ token 在位）。
- 评审 **#77 轮 2 pass**（🔴0 · 残留 4 条非阻断：R2 → 并入 W1 任务形（`?.` 防御一致化）；R3 → 并入 W3 随动（IPC.md:99 `notify.*` 行）；R1 ∕ R4 → 记录坐标 ∕ 路径机械收正（父侧直执行 · 2026-09-29 05:0x，可回退））。
- 修正轮 **#67 落地已核**（11/11 · 零不成立）。
- **实施 = 四波分派**：W0 核件波 → W1 vsc 波 ｜ W2 desk 波（W1/W2 依赖 W0 名面）→ W3 收口波（批内件 + 文档收正）。
- D3（去档②）**随本批准生效**。

## §5 实施记录（eng-coder）
**状态行**：实施完成（2026-09-29 · W0–W3 四波全落（W3 = 批内件 12/12 绿 + 文档收正毕；§2.2 ∕ §2.6 由父侧段位补笔清障——§5.7 在册））



### 5.1 W0 核件波（eng-coder · 2026-09-29 05:0x）

**范围**：W0 四件（`vision-reader.mjs` 新档 ∕ `attachments.mjs` 差异段收正 + `IMAGE_MAX_BYTES` 消费面 ∕ `provider-flows.mjs` `hostBusyOverride` 缝（在盘验证）∕ `notify-policy.mjs` `localeOf` 缝 + D3 去档②）+ 核件档头「差异段 ∕ 迁移留后句」同波收正。**零触**：vsc ∕ desk 树 ∕ `src/agent/*` ∕ `settings-panel-write.mjs` ∕ 其它批射程（B1 ∕ B2 ∕ B5 ∕ B7 ∕ #564）。

**逐件改动表（行数 = 本波实点）**

| # | 文件 | 行数（前 → 后） | 改动 |
|---|---|---|---|
| 1 | `thincoder-core/vision-reader.mjs`（新） | — → **66**（设计记 +80 内） | `findVisionChannel`（VSC `vision-channel.mjs:14` 逐字；`specForModel` 改核 `./model-specs.mjs`）· `runVisionReader`（VSC `image-handler.mjs:70-95` 逐字：`resolveProviders` 现读 → `resolveChildProvider` 构 provider → 按渠道模型装配只读工具族 → `createAgent(role:"explore")` → `runAgent(depth:1, maxTurns:10)`；60s 内部 controller ∕ 外部 signal 桥接；失败径全 `null`）· `VISION_READ_TIMEOUT_MS = 60_000`（:27） |
| 2 | `thincoder-core/attachments.mjs` | 126 → **126**（±0） | 档头 :12-17 差异段 ⇒ 「收正已毕」记录（①–④ 收正 → 核单源；⑤ 清理面保留两向在册）+ :9 迁移留后句收正；**代码零改**（`IMAGE_MAX_BYTES` 已导出 :33——消费面就绪） |
| 3 | `thincoder-core/provider-flows.mjs` | 249 → **249**（±0；设计记 +约 8） | **缝在盘、零 diff**（父侧 05:0x 确认）：`probeProviderAdmission` :119 调 `deps.hostBusyOverride(name, r.error)` + :17 注释面 + `reportAdmission` ∕ 三流程逐层透传 deps 已齐；本波仅 :7 ∕ :25 迁移留后句收正 |
| 4 | `thincoder-core/notify-policy.mjs` | 57 → **52**（−5，设计记 −约 5） | `createNotifier` 增 `localeOf` 缝（缺省 = `agent?.config?.locale`——桌面径零改；:34 ∕ :37）· D3 去档②（`digestStart` ∕ `SILENT.digestStart` ∕ `NOTIFY_TEXTS.subagents` 删；`NOTIFY_TEXTS` 收单档 locale→文本 :23-26）· 档头单档化 ∕ 迁移留后句收正 |

**验证（临时脚本 · `.thincoder/tmp/` · 自建自跑 · 五命令全过）**

1. `node .thincoder/tmp/b4w0-core-attachments.mjs` ⇒ 差异五条读数：① `IMAGE_MAX_BYTES=15_000_000`（= `tools/file.mjs` `MAX_IMAGE_BYTES` 同值同单位；边界 15_000_000 受理 ∕ 15_000_001 弃）② 输入序 `[png, bmp(弃), png]` ⇒ 命名 `paste-<id>-0` ∕ `paste-<id>-2`（源序，非过滤后 0∕1）③ 4 件（15MB×3+64B）⇒ 收 2 弃 2（弃后继续扫，非早退）④ `ok:"yes"` 畸形 ⇒ 原样兜底 ∕ `ok:true` ⇒ 注文 `[图片 … 描述: d]` ∕ 缝缺 ⇒ TypeError ⑤ 写面调用族 `{mkdirSync, writeFileSync}`（零回收；落盘件在场）。
2. `node .thincoder/tmp/b4w0-core-notify.mjs` ⇒ 单档（`digestStart` 不存在 ∕ `subagents` 无）· `localeOf:"zh-CN"` ⇒ `"ThinCoder：本轮完成"`（`normalizeLocale` 归一 zh）· 缺省 `agent.config.locale` 单源（zh ∕ en 两例）· 失焦门 ∕ 空 title 零携 ∕ 平台抛零连带 ∕ SILENT。
3. `node .thincoder/tmp/b4w0-core-vision-reader.mjs` ⇒ 纯函数六判据（同名优先 ∕ 首视觉回退 ∕ 空表 ∕ 非视觉 ∕ 缺 model ∕ null 表）· `VISION_READ_TIMEOUT_MS=60000` · 失败径四例全 `null`（已停 ∕ 空渠道表 ∕ 渠道不在主代理 providersList ∕ 死端口 spawn 失败——全链真跑 7430ms）· 只读工具面：视觉模型 20 项含 `read_image`、非视觉 19 项不含（注册门 = multimodal）。
4. `node .thincoder/tmp/b4w0-core-provider-flows.mjs` ⇒ 缝失败径恰一次 `hostBusyOverride("p1", <error 逐字>)` ∕ 成功径零调 · 三流程 deps 透传（`addProviderFlow` 真跑：落盘 `deepseek` + `hostBusy` + `warn` 两调用）· 拒因五串逐字（`Name is required` ∕ `Name already in use` ∕ `Base URL is required` ∕ `Model is required` ∕ `Unknown API format: …`）。
5. 桌面消费面 smoke（同判据）：`thincoder-desktop/src/main/notify.mjs` re-export 解析 `NOTIFY_TEXTS,createNotifier`；`NOTIFY_TEXTS={zh,en}` 单档；`createNotifier(...)` 构造 keys=`turnDone`；`notify?.digestStart?.()` 缺位短路 = no-op（W2 前零损）。`node --check`（lint 工具）四档全 OK。

**关键决策 ∕ 对拍注（差额与理由）**

- `runVisionReader` 工具面 = **按渠道模型装配**（`assembleBuiltinTools({ model: vc.model })` → `readonlyToolNames` → `excludeSubagentTools`，:57-59）——主模型非视觉时其工具表本无 `read_image`（注册门 = multimodal），沿用主代理工具表 ⇒ 子代理读不了图；按模型重装 = VSC 端 tool-table 同式（读数 #3 即此面）。
- a-④（`resolveChildProvider` 替 `providerFromConfig`）：渠道无 key 不前置校验 ⇒ spawn 期失败回落同一出口 `null`（读数 #3 (c)∕(d) 实证）。
- a-③（eng-state）：桌面旁路子代理随主代理 `config.agent.engineering` 单源（不新增 `engState` 形参）——对拍成立。
- D3 随动说明：桌面 `suspension-drive.mjs:136` 的 `notify?.digestStart?.` 调用点在 W2 删；本波已实测缺位短路零抛（即终态行为）。
- `provider-flows.mjs` 零 diff：§2.6「+约 8 ∕ 接线补齐」与盘上实况不符（§2.1⑤ 自载「核内核已含 :119」）；缝 + deps 透传已齐（读数 #4），不补新语义——父侧 05:0x 已确认。
- 观察（未改，射程外）：`attachments.mjs` ② 缝句「`visionReader` —— 端侧实现闭包自身上下文」在跑者上提后语义宜随 W3 文档轮复核（本轮按「差异段 ∕ 迁移留后句」清单外零改）。

**负向核**：`git status` 列改 = 仅 `thincoder-core` 四件（3 改 1 新）+ `.thincoder/tmp/` 四只读脚本；vsc ∕ desk ∕ `src/agent/*` ∕ `settings-panel-write.mjs` ∕ cli 零触。

### 5.2 W0 收束（审计 ∕ 评审轮 + fix 轮 · 2026-09-29 05:1x）

**轮次与终态**：内部审计（explore 只读分歧审计）轮 1 = **CLEAN**（四类偏差零发现；3 条观察已处置）→ 内部代码评审（advisor type=code）轮 1 = **pass**（🔴0 · 🟡3 · 🔵5）→ fix 轮 1 → 评审轮 2 = **changes-required**（🔴1：`vision-reader.mjs` 成功径出口缺失——fix 轮 1 批量编辑事故吞行，`desc` 算出即弃 ⇒ 成功径恒落原样兜底）→ fix 轮 2（补出口 + 成功径读数）→ 评审轮 3 = **pass**。**终态 = clean**（无未决 must-fix）。

**fix 轮 1（评审轮 1 ∕ 审计观察处置）**

| 发现 | 处置 |
|---|---|
| 🟡#1 ∕ #2 档头「已…」完成时断言 | ✅ 时态中性化（`attachments.mjs:9` ∕ `provider-flows.mjs:7` 改「随本批迁移改指」）；设计指定的「收正已毕」记录本体保留（§2.3 措辞） |
| 🟡#3 a-④「渠道无 key ⇒ 原样兜底」无读数 | ✅ 补例 (e)：本地 401 桩 ⇒ 无 key 渠道 ⇒ 401 回落 ⇒ `null` |
| 🔵#4 abort 桥接监听器不摘 | ✅ `onAbort` 具名 + finally `removeEventListener`（`vision-reader.mjs:55-56 ∕ :67`） |
| 🔵#5 工具面读数系镜像复算 | ✅ 补生产源码锚（装配 ∕ 只读过滤 ∕ 成功径出口三式在档；漂移即断） |
| 🔵#6 desk-smoke 硬编绝对路径 | ✅ 改 `new URL(..., import.meta.url)` 相对引 |
| 🔵#7 `dropped` 注释窄于代码 | ✅ 改「未落盘者（解析拒 ∕ 超单项阈 ∕ 预算溢出 ∕ 写失败）」 |
| 🔵#8 行数口径差（66 ∕ 126 ∕ 52 vs 65 ∕ 125 ∕ 51） | ⛔ 不成立：本档数 = node 换行口径 = 设计 §2.6 同口径（改前实点 126 ∕ 249 ∕ 57 全对口）；不改数 |
| 审计 O2 孤儿「①」∕ O3 desk smoke 无脚本 | ✅ 删（`notify-policy.mjs`）∕ 落 `.thincoder/tmp/b4w0-core-desk-smoke.mjs` |

**fix 轮 2（评审轮 2 的 🔴 处置）**：`vision-reader.mjs:64` 补回 `return typeof desc === "string" && desc.trim() ? { ok: true, description: desc.trim() } : null`；`.thincoder/tmp/b4w0-core-vision-reader.mjs` 补**成功径读数**（本地静态 completion 桩 ⇒ 子代理真跑 ⇒ `{ ok: true, description: "一只猫坐在窗台上。" }`）+ 成功径出口源码锚。评审轮 3 复读两件逐条命中 ⇒ pass。

**fix 后五读数全跑绿（最终态）**：① `b4w0-core-attachments.mjs`（差异五条）② `b4w0-core-notify.mjs`（单档 + `localeOf` + 缺省 `config.locale`）③ `b4w0-core-provider-flows.mjs`（缝在盘 + deps 透传 + 拒因五串）④ `b4w0-core-vision-reader.mjs`（成功径 `{ok:true,description}` + 失败径五例全 null + 工具面源码锚）⑤ `b4w0-core-desk-smoke.mjs`（desk re-export ∕ 单档 ∕ 短路）；`node --check` 四核件全 OK。

**行数（最终实点，node 换行口径 = 设计同口径）**：`vision-reader.mjs` **69** · `attachments.mjs` **126** · `provider-flows.mjs` **249** · `notify-policy.mjs` **52**。

**留给后续波 ∕ 父侧**：O1 跨波次完成时断言（W1 落地后成真；W3 复核）· `attachments.mjs` ② 缝句「端侧实现」观察（W3 文档轮）· 工作区存在他批在飞改动（`thincoder-core/agent.mjs` ∕ `agent/setup.mjs` ∕ `thincoder-vscode/src/agent/*` 等——B1 域，非本波）——本波触碰面 = 四核件 + `.thincoder/tmp/` 五脚本，负向核以此为准。

### 5.3 B4 补件：`assembleBuiltinTools` 缺 memory 容错（eng-coder · 2026-09-29 05:3x）

**射程** = §1.4(b) 另派单（父侧 05:3x 发单）：核 `assembleBuiltinTools` 缺 memory 容错微件。**零触**：其余核档 ∕ vsc ∕ desk 树 ∕ 其它批射程（B1 ∕ B2 ∕ B5 ∕ B7 ∕ #564）。

**改动表（file:line；行数 = `split("\n").length` 口径）**

| 文件 | 行数（前 → 后） | 改动 |
|---|---|---|
| `thincoder-core/tools/index.mjs` | 79 → 80（净 +1） | `:71` 取 `memory.db` ⇒ `:71` 注释一行 + `:72` `repoOutlineTool(memory?.db, cwd),`（同档 `:68-70` 同族三件仍传 `memory` 本体，零动） |
| `.thincoder/tmp/b4sup-assemble-memory.mjs`（新 · 临时读数脚本，任务书指定落点） | — → 92 | 三面读数（[A] 有 memory 指纹 · [B][C][D] 缺位 ∕ 已知事实 · [E] vision 成功径真跑 · [F] 源码锚）+ 断言；配套 `b4sup-withmem.json` ∕ `b4sup-withmem-before.json`（有 memory 面指纹 before∕after 对） |

**决策透明表**

| # | 决策 | 依据（实读） |
|---|---|---|
| 1 | 取 **`memory?.db` 调用点容错**（未取 `repoOutlineTool` 内局部护栏） | ① 组装期解引用仅此一处——同族三件为惰性工厂（`memory/docs.mjs:251` `export function memoryTools(memory, opts = {}) {` 工厂体只用 `opts`；`memory/docs.mjs:196-197`、`memory/code-sync.mjs:378-379` = 各自 `execute` 内才解引用 `memory`）⇒ 组装期零解引用即与同族对齐；② `repoOutlineTool` 只收 `db`（`tools/repomap.mjs:296` `export function repoOutlineTool(db, cwd) {`），内加护栏须写 `if (!db)`——结构上无法区分「memory 缺位」与「句柄在但 db 坏」⇒ 必吞真错（违硬约束「不得静默吞真错」）；③ 懒失败有既有响亮出口（`agent/dispatch-run.mjs:142` catch ⇒ `:144` `logToolError` + `:165` `Error:` 回模型） |
| 2 | 懒失败语义（缺位时四件留表内、执行期才抛）不改形 | §1.4(c) 已裁定「缺位不抛优先；W1 wrapper 尽量补宿主句柄」；本段仅登记该语义（供 W1 ∕ W2 消费面知悉） |
| 3 | 验证 = 临时脚本自建自跑（`.thincoder/tmp/`） | 批内无测试基线（§2.6 测试面）；本微件 = 三面读数 + 指纹机检对拍 + 成功径真跑（静态 completion 桩，先例 = W0 `b4w0-core-vision-reader.mjs`） |

**验证（命令 + 读数）**

1. `node .thincoder/tmp/b4sup-assemble-memory.mjs`（改前跑 · before 基线）：
   - `{memory: undefined}` ⇒ THROW `Cannot read properties of undefined (reading 'db')`；`{memory: null}` ⇒ THROW `Cannot read properties of null (reading 'db')`（#84 缺口复现）
   - `{memory: {db: null}}` ⇒ 不抛 · 31 工具（#84 已知事实 cross-check）
   - `runVisionReader`（`parentAgent.memory = null`）⇒ `null`（成功径被装配期抛出截断 = 恒死）
   - 有 memory（真句柄 `createMemory`）⇒ text=31 ∕ vision=32 · `repo_outline` 执行读数 `"a.mjs\n  → exports: x"`（指纹存档）
2. 修复落位后复跑（after · 终态）：
   - 缺位两例 ∕ `{db:null}` ⇒ 不抛，各 31 工具（含 `repo_outline`；= 有 memory 面 31 名同读数）
   - `runVisionReader`（`{memory:null}`）⇒ `{"ok":true,"description":"一只猫坐在窗台上。"}`（**成功径真跑**）
   - `[F]` ⇒ `memory?.db 在档（修复形态）`；脚本终态行 = 「读数：缺位两例不抛 · vision 成功径 ok（干净终态）」（退出码 0）
3. 指纹机检（before ∕ after 逐字对拍）：`b4sup-withmem-before.json` ∕ `b4sup-withmem.json` 逐字同（31 ∕ 32 名集 + `repo_outline` 执行读数全等）⇒ **有 memory 面零变**
4. `node --check`（lint 工具）`thincoder-core/tools/index.mjs` ⇒ Syntax OK；负向核 = `git diff` 单 hunk（仅本档），`.thincoder/tmp/` 外零触

**审计与代码评审轮次与终态**

- 内部审计（explore 只读分歧审计）轮 1：**DEVIATIONS 2 条均非 🔴**——① 本段（§5 记录）落档前 AC③ 未交付（随本段闭合）；② 本件未入 §2.6 ∕ §2.7（设计表随动项，报告父侧处理）。SILENT-SIMPLIFICATION ∕ OUT-OF-LIST：零发现（理由链逐条对上代码）。
- 内部代码评审（advisor type=code）轮 1：**VERDICT: pass**（🔴0 · 🟡1 · 🔵3）——🟡 = §2.6 ∕ §2.7 ∕ §2.9 未注册本补件（非阻断 · 报告父侧 ∕ eng-designer）；🔵#2 = 懒失败语义登记（本段决策表 #2）；🔵#3 = 坐标漂移（§5 ∕ §6 以 `tools/index.mjs:72` 为现行坐标——本段已用）；🔵#4 = 临时脚本两小项。
- **fix 轮 1**（评审 🔵#4 处置 · 脚本可选修）：`b4sup-assemble-memory.mjs` listen promise 补 `error` 分支（挂死 ⇒ fail-fast）· `[D]` 面补断言（= 有 memory 面同读数）。复跑全绿（读数见上）；指纹复对仍逐字同。
- **终态 = clean**（无未决 must-fix）。

**留给父侧 ∕ 后续**：① §2.6 ∕ §2.7 ∕ §2.9 注册随动（本件未入册——评审 🟡 非阻断；或按 §1.4:25 既定口径由 §5 本段 + §6 收口对账承载）；② §5 ∕ §6 坐标以 `tools/index.mjs:72` 为现行（改前锚 = `:71`）。

### 5.4 W1 vsc 波（eng-coder · 2026-09-29 05:2x–06:0x）

**范围**：五组「改指核件 ∕ 薄壳」+ 调用点接线 + locales 死键删。**基线 = `ff7b7e95`**（W1 前最后一次提交；行数口径 = node 换行 `split("\n").length`，与设计 §2.6 同口径）。
**零触（实点核对）**：core 树 ∕ desk 树 ∕ `src/agent/*` ∕ `panel-turn-stages.mjs`（241 → 241）∕ `settings.mjs`（410 → 410）∕ `presets.mjs` ∕ `loop-sampler.mjs` ∕ `settings-panel-write.mjs` ∕ cli。

**逐组改动表（file:line）**

| 组 | 文件 | 行数（前 → 后） | 改动 |
|---|---|---|---|
| ① | `thincoder-vscode/src/extension/notify.mjs` | 19 → 24（Δ +5） | 整档重写 = 宿主包装：`createNotifier`（核）+ `localeOf: () => vscode.env.language`（:15）+ `focused`（:16）+ `reveal`（:17）+ `notify`（:18-20：按钮 `t("notify.view")`、点击 `payload.reveal?.()`）；策略 ∕ 词键 ∕ 归一零副本 |
| ① | `thincoder-vscode/locales/{zh,en}.json` | 272 → 271 ×2（Δ −2） | `notify.done` 死键删（原 :222）；`notify.view` 保留（zh「查看」∕ en「View」） |
| ① | `thincoder-vscode/src/extension/chat-panel.mjs` | 431 → 433（Δ +2） | :16 import `createVscNotify`；:80 构造段 `this._notifier = createVscNotify(this)`（零宿主句柄 ⇒ 无释放点） |
| ① | `thincoder-vscode/src/extension/panel-callbacks.mjs` | 317 → 317（Δ 0） | :236 `if (!autoTurn) panel._notifier?.turnDone({ agent: panel._agent })`（门判据逐字保留；R2 `?.` 形；旧 import 行删 −1 ∕ 注释 +1 相抵） |
| ② | `thincoder-vscode/src/extension/file-links.mjs` | 42 → 17（Δ −25） | 薄壳：:11 核 import + :14 `MAX_LINKS` re-export + :16-17 `core(cwd, text, { existsSync, statSync })`；本地正则 ∕ 抽取循环 ∕ fs 直引零副本 |
| ③ | `thincoder-vscode/src/extension/image-handler.mjs` | 130 → 52（Δ −78） | 薄壳：:20-22 `savePastedImages` 核直调（fs 探针）+ 出口 `{paths, dropped}`；:25-31 `visionReaderFor`（真父面 ∕ 首回合窗合成父面 + `ensureMemoryHandle()` 补面）；:35-51 `downgradeNonVisionImages` 窗壳（判据早退 ∕ 置位序 ∕ `visionAbort` ∕ 返形 `{text, images, visionAbort}`） |
| ③ | `thincoder-vscode/src/extension/vision-channel.mjs` | 24 → 11（Δ −13） | 薄 re-export（D6）：:10 `export { findVisionChannel } from "@thincoder/core/vision-reader.mjs"` |
| ③ | `thincoder-vscode/src/extension/panel-messages.mjs`（savePastedImages 三调用点） | （含于下行） | :154 ∕ :159 ∕ :180 `savePastedImages(images, _cwd()).paths`（新出口形接线） |
| ④ | `thincoder-vscode/src/extension/panel-messages.mjs`（拍家族） | 358 → 355（Δ −3） | :29 import 核 `createLiveBeat` + `LIVE_HEARTBEAT_MS`；:47 常量 re-export 核值；:48 `_beats` WeakMap；:52-61 拍体 ∕ 两门前置留端；:64-72 起 ∕ 停走核 `createLiveBeat`（幂等 ∕ unref 入核） |
| ⑤ | `thincoder-vscode/src/extension/provider-flows.mjs` | 175 → 39（Δ −136） | 薄壳：:11-14 核三流程 + 探针 import；:18 纯持久化 re-export；:21-27 `ui` 五件；:30 F-W19 `deps.hostBusyOverride`；:33-35 三流程包装（调用形 `(ui, refresh)`）；:38 `probeProviderAdmission` 包装 |
| ⑤ | `thincoder-vscode/src/extension/panel-messages-settings.mjs` | 205 → 205（Δ 0） | :23 import 加 `ui`；:76 ∕ :87 ∕ :98 三调用点加 `ui` 参（行内改） |

**行数账对账（设计 §2.6 ∕ §2.6a 预测 vs 实点）**

| 档 | 设计预测 Δ | 实点 Δ | 差额说明 |
|---|---|---|---|
| notify | +5（≈24） | +5（24） | 0 |
| file-links | −26（≈16） | −25（17） | +1 |
| image-handler | −75（≈55） | −78（52） | −3 |
| vision-channel | −12（≈12） | −13（11） | −1 |
| provider-flows | −105（≈70） | −136（39） | −31（薄壳包装式一行一件；功能面经审计 ∕ 评审核核无缺） |
| panel-messages | −8（≈350） | −3（355） | +5（核接线 ∕ 拍体 ∕ 注释较估算略多） |
| panel-callbacks | 0 | 0（317） | 0 |
| chat-panel | +2 | +2（433） | 0 |
| panel-messages-settings | 0 | 0（205） | 0 |
| locales | −2 | −2 | 0 |
| **vsc 计** | **≈ −221** | **−250** | **−29**（主因 = provider-flows 更薄）；零触档 settings（410→410）∕ panel-turn-stages（241→241）逐字未动 |

**验证（自建读数脚本 · `.thincoder/tmp/` · 五命令全绿；基线 sha `ff7b7e95` 已钉入脚本——设计外的钉 sha 为评审核定 fix）**

1. `node .thincoder/tmp/b4w1-vsc-notify.mjs` ⇒ 词键逐字同值（基线 locales `notify.done` ≡ 核 `NOTIFY_TEXTS` zh/en）；失焦门（focused ⇒ 零宿主调用）；zh-CN ⇒ body「ThinCoder：本轮完成」+ 按钮「查看」+ 点击 ⇒ `exec(workbench.view.extension.thincoder)`；en ⇒ 「ThinCoder: turn complete」∕「View」；`notify.view` 双档在场 ∕ `notify.done` 缺席；档体策略零副本（源码断言）。
2. `node .thincoder/tmp/b4w1-vsc-file-links.mjs` ⇒ `MAX_LINKS=50`（= 核值）；存在闸（假点名不成链接）；同键去重 ∕ URL 残体跳过 ∕ 绝对径照检；封顶（60 token ⇒ 恰 50 条）；空 ∕ null 早退。
3. `node .thincoder/tmp/b4w1-vsc-image.mjs` ⇒ 落盘 `[png, 非法, png] ⇒ paste-…-0 ∕ -2 · dropped=1`（源序命名）· 超阈（15,000,001B）弃 · 预算 10.5MB×3 ⇒ 收 2 弃 1；降级壳四径（无图 ∕ 多模态早退、成功注文 `[图片 a.png、b.png 描述: 一只猫。]` + `images=undefined`、失败原样兜底、susp 零置位）+ 窗内 abort ⇒ reader signal 置停；判据对拍（44 处 `multimodal` 声明全 `true` ⇒ 两形逐点等价）；记忆缝（核 `memory?.db` 容错在盘 + 宿主句柄在场 + wrapper 补面在档）；**默认跑者全链真跑**（本地 completion 桩）：真父面 ⇒ 注文；`panel._agent = null`（首回合窗）⇒ 合成父面 ⇒ 同注文；无渠道 ⇒ 兜底；注文模板与基线实现逐字同。
4. `node .thincoder/tmp/b4w1-vsc-heartbeat.mjs` ⇒ `LIVE_HEARTBEAT_MS=2000`（= 核值）；两门（未就绪 ⇒ 0）；起拍句柄 `unref` + 周期 2000 ∕ 再起幂等 ∕ 停拍 clear ∕ 停后再起新句柄 ∕ 未起再停零动作；调用点 `.paths`（idle 降级注文 + busy 队项 paths 数组）。
5. `node .thincoder/tmp/b4w1-vsc-provider-flows.mjs` ⇒ 纯持久化 re-export 同绑定；`ui` 五件 delegation（opts 原样透传）；三流程自定径真跑（校验串 `Name is required`；落盘 `myprov` = 核直调逐字同；`refresh=1`；M9 失败 `ui.warn` 恰一次）；探针返形（空名 ∕ 未知渠道逐字）；F-W19 缝绑定在档；`panel-callbacks` 调用点（`!autoTurn` ⇒ `turnDone({agent})` 恰一次 · `autoTurn` ⇒ 零调用 · 缺 `_notifier` ⇒ `?.` 零抛）。
6. 静态：`node --check` 九档全 OK；两 locales `JSON.parse` OK。

**真机待走查清单（父侧 · D9 ∕ 本波无法机检面）**

1. 通知 zh 例：VS Code 显示语言 zh（zh-CN）+ 窗口失焦 + 完成一个用户回合 ⇒ 系统通知正文「ThinCoder：本轮完成」+ 按钮「查看」；聚焦窗 ⇒ 零通知（never noise）。
2. 通知 en 例：显示语言 en ⇒ 「ThinCoder: turn complete」+「View」；点击按钮 ⇒ 打开 thincoder 视图（宿主机能力面，登记 §2.3-F⑤）。
3. 贴图降级（非视觉主模型 + 视觉渠道在场）：面板打开 ∕ 切会话后的**首回合**与后续回合各一例 ⇒ 注文 `[图片 <路径> 描述: …]`；降级窗内 ⏹ ⇒ 定向中止（A12）。
4. provider 三流程（加 ∕ 删 ∕ 设 key）QuickPick ∕ InputBox 走查：占位串 ∕ `password` ∕ M9 失败提示；宿主忙覆盖（F-W19）场景可选。
5. 拍家族：面板 webviewReady 后 2s 拍（日志 `ev:subreassert`）、dispose 停拍。

**§5 决策透明表（本波段 · 父侧裁定 + 差额登记）**

| # | 事项 | 处置 | 依据 |
|---|---|---|---|
| D-1 | 组③ 核跑者父面缝：VSC 首回合窗 `panel._agent === null`（`panel-session.mjs` loadSession 置 null、agent 首次 runAgent 内才建）⇒ 核 `resolveChildProvider(null,…)` 抛 ⇒ 成功径死 | 父侧裁定：**合成最小父面** `{ config: { providersList: resolveProviders().providers } }`（核渠道表单源；真父面在场恒用真父面） | 父侧 §1.3 裁定（2026-09-29 05:3x） |
| D-2 | 组③ 记忆缝：VSC 父面无 `memory` 字段（`src/agent/setup.mjs` 无 memory 面）⇒ 核 `assembleBuiltinTools` 组装期 `repoOutlineTool(memory.db,…)` 抛 ⇒ 成功径全窗死（实测：`memory=undefined ∕ null` 均 THROW） | 父侧裁定 **(c) 双管**：(a) 本波 wrapper 以宿主 `ensureMemoryHandle()` 补面（禁用 ∕ 建败 ⇒ null 落兜底，**不造假面**）；(b) 核 `tools/index.mjs` 缺位容错微件父侧另派（已落：`repoOutlineTool(memory?.db, cwd)`——实测缺 memory 不抛、有 memory 逐字零变） | 父侧 §1.4 裁定（2026-09-29 05:4x） |
| D-3 | 注入缝 `visionReader` 形：旧端形 `{paths, providerName, cwd, signal, engState}` → 核缝形 `{paths, signal}`（providerName ∕ cwd ∕ parentAgent 由 wrapper 缺省读法闭包承载；树内无非 null 生产者——全树 `visionReader` 仅传递面，恒 null） | 交接：按核缝契约（设计在册「缝随迁」） | 批档 §2.1③ |
| D-4 | 合成 ∕ 真父面的 `providersList` 时效差：回合间新增渠道 ⇒ 首个降级窗走「渠道未知 ⇒ 抛 ⇒ null」兜底（＝一轮不降级，无损） | 登记（不动实现）：与 §2.2-a-④ 同族，必要时并入其文本 | 本波自审 + 代码评审 🔵 |
| D-5 | 静默丢图：核出口 `{paths, dropped}` 的 `dropped` 三调用点未消费 ⇒ 预算（30MB ∕ 轮）∕ 超阈命中时用户零提示（迁移前无预算闸） | 登记为端差（**不新写语义**）；后续批决定是否补端侧提示 | 代码评审 🟡（非 must-fix） |
| D-6 | 行数账实点 vs 设计预测：净 **−250** vs ≈ −221（provider-flows −31 主因；panel-messages +5） | 实点为准；5.4 对账表在档 | 本波读数 |
| D-7 | `vision-channel.mjs` 迁移后零消费者（`image-handler.mjs` 已直引核件） | 保留（D6 已裁定「留形备引」）；dead module 登记 | 批档 D6 |
| D-8 | 读数脚本基线：`git show HEAD:` 在提交后失效 ⇒ 钉 `ff7b7e95` | 已改（两脚本复跑绿） | 代码评审 🔵 → fix 2 |

**审计与代码评审轮次与终态**

- **内部审计（explore 只读分歧审计）轮 1** = 2 findings：🟡1「§5 W1 段未落盘（记录面——审计时点，本段即处置）」+ 🔵1「点击径用字面命令、未走注入 `reveal` 缝（单源微裂）」→ **fix 轮 1**：`notify.mjs:19` 改 `void payload.reveal?.()`（点击径过注入缝；同命令同参 ⇒ 行为零变）→ 复跑 notify 读数绿。
- **内部代码评审（advisor type=code）轮 1** = **pass**（🔴 0；🟡 5 ∕ 🔵 4，**无 must-fix**）：
  - 🟡 = 三档越 300 顾问线（`panel-messages.mjs` 355 ∕ `chat-panel.mjs` 433 ∕ `panel-callbacks.mjs` 317——§2.6a tier 注在册、非本轮新增债）· `dropped` 静默（→D-5）· §5 W1 段缺位（本段即处置）。
  - 🔵 = 读数脚本 `git show HEAD:` 不可复跑（→ **fix 轮 2**：钉基线 sha，两脚本复跑绿）· `vision-channel.mjs` 零消费者（→D-7）· `providersList` 时效差（→D-4）· 行数账可复核性（本段实点 + 基线 sha 在档）。
  - 评审附注：裁宿引用核验 1/15 命中——因评审子代理工作目录相对路径解析所致（其引用的档均在盘），非内容缺失；其「范围与证据限制」段已如实声明基线快照陈旧面。
- **终态 = clean**（无未决 must-fix；残留项皆登记如上）。

**负向核**：本波改面 = vsc 10 档 + locales 2 档 + `.thincoder/tmp/` 读数脚本 7 件（notify ∕ file-links ∕ image ∕ heartbeat ∕ provider-flows ∕ vscode-stub ∕ vscode-hook）；core ∕ desk ∕ `src/agent/*` ∕ `panel-turn-stages.mjs`（241→241）∕ `settings.mjs`（410→410）零触。工作区另有他批在飞改动（B1 域：`src/agent/*` ∕ `suspension.mjs` ∕ `queued-merge.mjs` 等）——非本波面（审计已以 mtime + touched 集复核）。

### 5.5 W2 desk 波（eng-coder · 2026-09-29 05:2x–06:2x）

**范围**：desk 四件（非视觉降级接入 ∕ 三径接线 ∕ D3 随动）+ 裁决 (i) fix 轮（降级窗后查位两笔）。**基线 = `ff7b7e95`**（W2 前最后一次提交；行数口径 = node 换行 `split("\n").length`，与设计 §2.6 同口径）。
**零触（实点核对）**：core 树 ∕ vsc 树 ∕ `turn-face.mjs`（141 → 141，零 diff）∕ `src/agent/*` ∕ `panel-turn-stages.mjs` ∕ `settings.mjs` ∕ cli ∕ 其它批射程（B1 ∕ B2 ∕ B5 ∕ B7 ∕ #564）。工作区另有他批在飞改动（B1 ∕ W1 域）——非本波面。

**逐件改动表（file:line）**

| # | 文件 | 行数（前 → 后） | 改动 |
|---|---|---|---|
| 1 | `thincoder-desktop/src/main/attachments.mjs` | 76 → 108（Δ +32） | 判决序改写：非视觉径**先落盘**（:64-68；有件 ⇒ 原文本 + `"non-vision"` 待降级 ∕ 落盘 0 件 ⇒ 说明行 + 零路径旧端态）；出口四键 `{text,paths,dropped,degraded}`（:63/:67/:68/:73）；新面 `degradeTurnAttachments`（:85-97）：零动作早退（paths 空 ∥ 多模态，:87）· 核 `downgradeNonVisionImages`（:93）· 成功 ⇒ 描述注文 + `dropped>0 ? "partial" : null`（:94）· 失败 ⇒ 原文本 + 说明行 + `"non-vision"`（:96）· 缺省跑者 = 核 `runVisionReader`（`providerName = parentAgent.provider?.name`，:89-91）· 出口零抛（:92-96）；档头 :14-18 ∕ 函数注 :55-58 改写；`cleanupTurn` 原样 |
| 2 | `thincoder-desktop/src/main/turn-driver.mjs` | 222 → 256（Δ +34） | 径①：`send` 降级窗（:186-191，`signal = controller.signal`）+ **窗后查位**（:192-197：`flights.get(key) !== controller` ⇒ `cleanupTurn(attached?.paths ?? [])` + `{ok:false,reason:"aborted"}` 零起跑）；`hold` 供面（:113-121，返回 `{signal, active, release}`）+ 链注入 `degrade` ∕ `hold`（:80-83）；`takeOver` 转 async（:128）+ `:130 await` 改 + **窗后复查位**（:131）；档头 :10 ∕ :127 ∕ 附件面注 :142-146 改写 |
| 3 | `thincoder-desktop/src/main/turn-chain.mjs` | 76 → 100（Δ +24） | `continueTurn` 转 async（:65）；降级 await 窗（:76-85：`hold` 占位 ∕ `active` 查位 ∕ `release` finally）+ **窗后查位**（:86-89：占位被摘 ⇒ 落盘件自清 + `false` 零取批零起跑）；取批 ∕ 回执 ∕ 起跑全在闸后（:90-94）；档头 :19-24 ∕ 注入面注 :39-40 同步 |
| 4 | `thincoder-desktop/src/main/suspension-drive.mjs` | 280 → 279（Δ −1） | D3 随动：`notify?.digestStart?.(...)` 调用点删（原 :136）；`turnDone` 调用面 :115 不动；档头 :8「两档」→「档①」 |
| 5 | `thincoder-desktop/src/main/turn-face.mjs` | 141 → 141（Δ 0） | **零改**（`opts.attached` 收 :79 ∕ 回合尾 `cleanupTurn(attached?.paths ?? [])` :135 —— 出口形不变） |

**行数账对账（设计 §2.6 desk 表预测 vs 实点）**

| 档 | 设计预测 Δ | 实点 Δ | 差额说明 |
|---|---|---|---|
| attachments | +约 40（≈116） | +32（108） | 判决序改写 ∕ 降级面注文较估算略省 |
| turn-driver | +约 12（≈234） | +34（256） | `hold` 缝（含 `active` 判据）与两处窗后查位注文较估算多 |
| turn-chain | +约 10（≈86） | +24（100） | 窗 ∕ 查位 ∕ 自清段与注文较估算多 |
| suspension-drive | −1 | −1（279） | 逐字对口 |
| turn-face（零改参照） | ±0 | 0（141） | 逐字未动 |

**验证（自建读数脚本 · `.thincoder/tmp/` · 两命令全绿；默认跑者 = 核 `vision-reader` 真跑 + 本地 127.0.0.1 completion 桩，零外网；核配置 ∕ sessions 根沙箱）**

1. `node .thincoder/tmp/b4w2-desk-attachments.mjs` ⇒ prepare 判决序三径（无附件四键形 ∕ 多模态指针 + `partial` ∕ 非视觉先落盘「有件 ⇒ 原文本 ∕ 落盘 0 件 ⇒ 说明行旧端态」）；degrade 三径（成功 ⇒ `[图片 <路径> 描述: …]` + `degraded:null` ∕ 弃项并存 ⇒ `"partial"` ∕ 失败 ⇒ 原文本 + 说明行 + `"non-vision"`；reader 抛 ∥ 空描述 ⇒ 出口零抛失败径；`signal` 透传进 reader 缝）；清理面（`cleanupTurn` 删件 ∕ 不在册件零抛）。
2. `node .thincoder/tmp/b4w2-desk-driver.mjs` ⇒ 径①：非视觉 + 视觉渠道（真跑）⇒ 描述注文 + 回执 `{ok:true}` + 回合尾清理（落盘件删毕）；无渠道 ⇒ 说明行 + `{ok:true,degraded:"non-vision"}` + 落盘件回合尾清毕；多模态 ⇒ 指针径；窗内 `interrupt`（径① ∕ 径②）⇒ 读图 fail-fast（2–15ms，抢 600ms 桩延迟）+ 回合 ∕ 续发照常起跑（设计 §2.2 忙锁句口径）；径②：窗内并发 `send` ⇒ 落队且零第二回合、窗后注文送达、队保序；**窗后查位**：径① 窗内 `dispose` ⇒ 回执 `aborted` + 零回合起跑 + 落盘件自清；径② 窗内 `dispose` ⇒ 零续发 + 零 delivered 回执 + 落盘件自清；D3 锚（`digestStart` 零命中 ∕ `turnDone` 在 ∕ `turn-face` 清理面形未变）。
3. 静态：`node --check`（lint 工具）四档全 OK（attachments ∕ turn-driver ∕ turn-chain ∕ suspension-drive）。

**真机待走查清单（父侧 · 本波无法机检面）**

1. 非视觉主模型 + 视觉渠道在场：桌面真机贴图发送 ⇒ 回合文本 = `[图片 <路径> 描述: …]`（成功径；回执无 `degraded`）；对照无渠道 ∥ 渠道无 key ⇒ 原文本 + 说明行「图片未随发——该模型不支持图片」+ 回执 `{ok:true,degraded:"non-vision"}`（失败径）。
2. 多模态主模型：贴图 ⇒ 指针注文 `[Attached images: …]`（降级零动作，沿旧）。
3. 降级窗内取消（非视觉 + 图，读图进行中）：⏹ ⇒ 读图 fail-fast，本回合照常起跑（现口径 = 设计 §2.2 忙锁句 —— 见 D-3）；关会话 ∕ 切项目 ⇒ 零起跑（`aborted` 回执；窗内贴图件随闸自清）。
4. 续发径：回合进行中再发一条带图消息 ⇒ 落队；前回合结算后 ⇒ 注文送达（`ev:queue` 消费回执）；队保序（再补一条文本 ⇒ 依次送达）。
5. 清理面：发送后 `<项目>/.thincoder/tmp` 无 `paste-*` 残留（成功 ∕ 失败 ∕ 中止三径同清）。

**§5 决策透明表（本波段 · 父侧裁定 + 差额登记）**

| # | 事项 | 处置 | 依据 |
|---|---|---|---|
| D-1 | 降级 await 窗内 `dispose` ∕ 切项目级联 ⇒ 占位被摘仍起跑 = 僵尸回合（#515② 同族） | 父侧裁定 **(i) 补设计句 + 当场 fix**：径① 同款在飞占位闸（:194-197，含落盘件自清）· 径② 链侧「占位仍在」判据（缝形 +1 = `hold.active()`，:118 / 链 :82 ∕ :86-89）；fix 轮 1 落毕、评审轮 2 pass | 批档 §1.5:29 |
| D-2 | `hold(key)` 返回形 = `{ signal, active, release }`（设计记「返回 release」） | **受理**：设计同段「窗内 `interrupt` ⇒ 降级信号 abort」所迫；`active()` 为裁定 (i) 的「占位仍在」判据承载；W3 设计文本随动（§2.2:95 现文待收正） | 批档 §1.5:30 |
| D-3 | 窗内 `interrupt` ⇒ 只中止读图、回合照常起跑（用户按 Stop 后本回合仍全程跑） | **保留**（设计口径 —— §2.2:100 忙锁句只写读图 fail-fast）；读数脚本已把该口径写成在册断言；「停回合」语义若要另裁 ⇒ W3 设计文本 | 代码评审轮 1 🟡（非 must-fix） |
| D-4 | 窗后查位两处落盘件自清：`cleanupTurn(attached?.paths ?? [])`（径① :195 ∕ 径② :87） | 本波自定（裁定 (i) 的工程落形）：占位被摘 ⇒ 回合尾清理面不达 ⇒ 本径落盘件须自清（防临时件累积；用既有 `cleanupTurn` 面，零新语义）；fix 轮随披露 | 本波 + 评审轮 2 复核 |
| D-5 | `takeOver` 窗后复查位（:131） | 本波自定（同裁定 (i) 不变量补写）：径② 窗后返回 `false` 时若不复查 ⇒ 调用面回落 `suspension.start` 会在已中止键上重开挂起窗 ∕ 重武装闩；复查处 = 既有 `turnGate.revoked` 同判据第二次落位 | 本波 + 评审轮 2 复核 |
| D-6 | 行数账实点 vs 设计预测 | 实点为准（上表）；三档超估差额归注文 ∕ 接线体量 | 本波读数 |
| D-7 | 读数脚本墙钟判据（`eMs/wMs < 500` 对 600ms 桩；固定 400ms 睡眠后缺席断言） | 登记未改（临时件；W3 批内件化时改事件序 ∕ 信号面判据） | 评审轮 1 ∕ 2 🔵（声明归 §5 记录） |

**审计与代码评审轮次与终态**

- **内部审计（explore 只读分歧审计）轮 1** = must-fix 1 条（记录面：§5 W2 段未落 —— 本段即处置）+ 裁定项 1 条（窗后查位缝 = D-1，已按 §1.5 落）；四类偏差（部分实现 ∕ 静默简化 ∕ 设计漂移 ∕ 射程外改动）其余零发现；行为零变逐点 5/5 绿；余 🔵 4 条 —— hold 形（→D-2）· 行数账（→D-6）· 覆盖项（径② 窗内 `interrupt` 直读）已补 · catch 诊断未采纳（核层已自吞异常，失败径用户可见）。
- **内部代码评审（advisor type=code）轮 1** = **changes-required**（🔴 2 = 径① ∕ 径② 窗后查位未落 = D-1；🟡 1 = 窗内 interrupt 语义（→D-3）；🔵 = 脚本墙钟（→D-7）∕ §2.6 Δ 估计（→D-6）∕ 观察段措辞）。
- **fix 轮 1**（裁定 (i)）：径① 窗后查位 + 自清；径② 链侧 `active()` 判据 + 自清；`takeOver` 窗后复查位（D-5）；读数脚本两径窗内 `dispose` 断言落地（观察段转断言）。
- **内部代码评审轮 2**（验 fix 声称）= **pass**（两 🔴 转 Fixed；新引入问题零：判据顺序 ∕ 归属比对 ∕ 闸后零副作用 ∕ 自清零抛 ∕ 缺省缝零变 ∕ 三档 < 300 逐点核）。
- **终态 = clean**（无未决 must-fix；残留项皆登记如上）。

**负向核**：本波改面 = desk 四件（attachments ∕ turn-driver ∕ turn-chain ∕ suspension-drive）+ `.thincoder/tmp/` 读数脚本 2 件（b4w2-desk-attachments ∕ b4w2-desk-driver）；`turn-face.mjs`（141→141）∕ core 树 ∕ vsc 树 ∕ `src/agent/*` 零触。工作区另有他批在飞改动（B1 ∕ W1 域）——非本波面。

### 5.6 W8 契约②破链修复（vision-reader 链 · eng-coder · 2026-09-29 05:49–06:1x）

**范围** = 父侧 W8 断链单（#84 W1 落定后实证的端壳静态链：`extension.mjs → … → image-handler.mjs:15 → 核 vision-reader.mjs → 核 agent.mjs → agent/setup.mjs → memory.mjs:7 → memory/schema.mjs`）——`vision-reader.mjs` 静态 import 边改函数体内动态 import（核侧动态载入惯例形）。**零触**：vsc ∕ desk ∕ cli 树 ∕ 本档以外全部核档 ∕ 其它批射程；`.thincoder/tmp/` 无新增脚本（探针 = 内联只读复算；既有夹具自写产物 `b4sup-withmem.json` 与 `-before` 逐字同）。

**改动表（file:line）**

| 文件 | 行数（前 → 后） | 改动 |
|---|---|---|
| `thincoder-core/vision-reader.mjs` | 69 → 76（split 元素口径 70 → 77；净 +7 = 档头断链注 +5 ∕ 静态边 −2 ∕ provider try 2→5 行 +3 ∕ 主 try +1） | ① 删两条静态边（原 `:22` `./agent.mjs`（`createAgent` ∕ `runAgent` ∕ `readonlyToolNames` ∕ `excludeSubagentTools`）· 原 `:23` `./agent-tools/subagent-async.mjs`（`resolveChildProvider`））⇒ 函数体内 `await import()` 两处（现 `:56`（既有 try 内）· `:64`（主 try 首行））；② 档头 `:20-23` 增 W8 断链注（约定源 = `ledger.mjs:16`；实例 = `tools/index.mjs:63`）；③ 保留静态边三条（`./config-io.mjs` ∕ `./model-specs.mjs` ∕ `./tools/index.mjs`——逐边闭包实测净）；④ 导出面三件（`VISION_READ_TIMEOUT_MS` ∕ `findVisionChannel` ∕ `runVisionReader`）与调用形零变（`runVisionReader` 本即 async）；夹具三源码锚（装配式 ∕ 只读过滤 ∕ 成功径出口）逐字仍在。 |

**验证（命令 + 读数；读数时点 = 2026-09-29 06:0x——工作树含他批在飞改动，闭包档数随动）**

1. `node .thincoder/tmp/p3-w8-scan.mjs`（修后 · 终态）——判据边界 = ESM 静态 `import` ∕ `export … from` 边（动态 `import(` 与 CJS 加载面不在内；评审 🔵#3 采纳句）：

```
静态闭包档数（可达） = 248
  探针 thincoder-core/agent/suspension.mjs => 可达
  探针 thincoder-core/agent-tools/async-settle.mjs => 可达
  探针 thincoder-vscode/src/extension/suspension.mjs => 可达
动态 import("node:sqlite") 命中档 = 1（不入静态链——W8 允许）
✘ node:sqlite 静态可达档 1 个：
  · thincoder-vscode\node_modules\@thincoder\core\memory\schema.mjs
    路径: …（第二链——见「残余披露」）
```

⇒ violation 路径不含 vision-reader（修前唯一首径 = vision 链）；1 处 = 第二链（B1 面）。

2. vision-reader 自身静态闭包复算（逐边探针）：**修前** = `./agent.mjs` 边 150 档命中 1（`memory/schema.mjs`）· `./agent-tools/subagent-async.mjs` 边 150 档命中 1（经其静态引 `../agent.mjs`，`:16-19`）· `./tools/index.mjs` 边 71 档 0；**修后** = 三条静态边（config-io 3 档 ∕ model-specs 1 档 ∕ tools/index 71 档）全 0，**整档闭包 = 72 档 · 0 命中 ⇒ 转净**。
3. `node .thincoder/tmp/b4w0-core-vision-reader.mjs` ⇒ 成功径 `{"ok":true,"description":"一只猫坐在窗台上。"}`（真跑）· 失败径（夹具 (a)–(e) 五例显式读数：已停 ∕ 无渠道 ∕ 渠道未知 ∕ spawn 失败 ∕ 渠道无 key）全 `null` · 纯函数六判据 ∕ 超时常量 ∕ 只读工具面（视觉 20 项含 `read_image` ∕ 非视觉 19 项不含）全过——与修前基线逐字同（墙钟毫秒除外）。
4. `node .thincoder/tmp/b4sup-assemble-memory.mjs` ⇒ 缺位两例（undefined ∕ null）不抛 · `[E]` 成功径（`memory:null`）`{ok:true,…}` · `[F]` `memory?.db` 在档；指纹 `b4sup-withmem.json` ≡ `b4sup-withmem-before.json` 逐字同。
5. 附加端到端面：`node .thincoder/tmp/b4w1-vsc-image.mjs` ⇒ 全绿（VSC 包装 → 核跑者：真父面 ∕ 合成父面（首回合窗）∕ 无渠道三径；读数与 W1 基线同）。
6. `node --check`（lint）⇒ Syntax OK。

**残余披露（第二链——父侧裁定：归 B1 另派单，排队于 #92 后；本单不做）**

- **链**（复跑扫描 violations 行逐字）：`extension.mjs → chat-panel.mjs → panel-messages.mjs:30（./suspension.mjs）→ suspension.mjs:29（核 agent/suspension.mjs）→ 核 agent/suspension.mjs:42 → agent-tools/async-settle.mjs:36 → agent/spawn-child.mjs:20 → agent.mjs:13 → agent/setup.mjs:9 → memory.mjs:7 → memory/schema.mjs`。
- **edge 两处**（均 vsc `suspension.mjs`）：`:29` → 核 `agent/suspension.mjs`（`backgroundCounts` ∕ `poolLive` ∕ `startSuspension`）· `:35` → 核 `agent-tools/parent-channel.mjs`（`upstreamAskLabelVars`）。
- **随动消费点（实点清单）**：`backgroundStatus`：`panel-turn-stages.mjs:150` ∕ `panel-callbacks.mjs:260` ∕ `panel-messages.mjs:306` ∕ `:314`（4 处）；`poolLive`：`panel-turn-stages.mjs:147` ∕ `:180`（2 处，sync 条件位）；档内：`upstreamAskLabelVars:143` ∕ `startSuspension:193` ∕ re-export `:42`。
- **割边收敛模拟结论**（模拟割边 = 未落地；时点 = 06:0x 快照）：双割上述两 edge ⇒ 扫描 **0 违规**（闭包 248 → 193）；单割 `:29` ⇒ reroute 经 `parent-channel.mjs`；核侧单割（`async-settle → spawn-child` ∕ `spawn-child → agent.mjs`）均 reroute 经 `subagent-scheduler → subagent-async → agent.mjs`——收敛割集 = 上述两 edge。
- **B1 档自述「净」= 漏检实证**：`docs/batches/2026-09-29-parity-b1-vsc-core.md:710`「**并行波观察（非 P3 面 · 供父侧）**……**P3 新增静态边**（`extension/suspension.mjs:29` → 核 `agent/suspension.mjs`）经探针 ∕ 链路抽查 = **净**（不改 P3 结论）。」——实况 = 该链静态达 sqlite；漏检面 = ① 首版扫描正则不含 `export … from`（`memory.mjs:7` 边不可见 ⇒ 其「零可达」读数）；② 扩边后首径（并行波 vision 链）遮蔽次径（本链）；③ 链路抽查未覆盖 `async-settle → subagent-scheduler ∕ spawn-child → agent.mjs` 腿。（该档在飞、行号随动：本单实读先后 `:703`（05:5x）→ `:710`（06:1x）；引文锚 = 上引句首。）

**§5 决策透明表（本波段）**

| # | 事项 | 处置 | 依据（实读） |
|---|---|---|---|
| D-1 | 条件句触发：`./agent-tools/subagent-async.mjs` 边同样触达 | **同笔断链**（动态化）+ 披露 | 逐边探针：150 档命中 1（经其静态引 `../agent.mjs`，`:16-19`）；`./tools/index.mjs` 边 0 命中 ⇒ 保留静态 |
| D-2 | 第二链（vsc suspension 两 edge + 随动） | **不做**——归 B1 另派单（排队于 #92 后） | 父侧裁定 2026-09-29（本单上抛后）；割边模拟移交（双割 ⇒ 0） |
| D-3 | 行为语义登记：模块载入失败现折入失败径 `null`（修前 = 装载期硬失败） | 登记（不另处理）——断链设计固有面（宿主无 sqlite ⇒ 降级不崩壳），与「失败径全 null」契约一致 | 内部审计观察项 |
| D-4 | 扫描件判据边界 | §5.6 验证行写明（评审 🔵#3 采纳） | 判据 = 文本级静态 `import` ∕ `export … from` 正则 |
| D-5 | AC② 入账：修后扫描 = 1 处违规（≠ 0） | **部分满足 + 残余披露**（violation 路径不含 vision-reader） | 父侧裁定；第二链归 B1 |

**审计与代码评审轮次与终态**

- 内部审计（explore 只读分歧审计）轮 1 = **CLEAN**（四类偏差零发现；观察 5 条：🟡 = 修后扫描读数须落 §5（本段即处置）；🔵×4 = 语义登记（→D-3）∕ 归属不裁决 ∕ 行数账（本段对账）∕ 射程外顺账）。
- 内部代码评审（advisor type=code）轮 1 = **pass**（🔴0 · 🟡1 · 🔵2，无 must-fix）：🟡 = 本段未落盘（记录面——本段即处置）；🔵#2 = 档头先例引用精度 → **fix 轮 1 采纳**（`:22` 改「约定源 = `ledger.mjs:16`；实例 = `tools/index.mjs:63`」）；🔵#3 = 扫描件判据边界 → 本段验证行写明。
- **fix 轮 1** 后复验（lint ∕ 闭包复算 ∕ 扫描复跑 ∕ 两夹具复跑）：读数不变。**终态 = clean**（无未决 must-fix；残留 = D-2 第二链（归 B1）+ D-5 裁定项）。

**负向核**：本单触碰面 = `thincoder-core/vision-reader.mjs`（1 档）；vsc ∕ desk ∕ cli ∕ 其余核档零触；`.thincoder/tmp/` 无新增脚本。

### 5.7 W3 收口波（eng-coder · 2026-09-29 06:0x–07:1x）

**范围**：① 批内件（§2.9 全表 11 行 ⇒ T1–T11 + T12 窗后查位 ∕ 清理面）；② 文档收正（六核件档头 ∕ desk 三档 + 两码注 ∕ vsc 两档 + 五档变更记录行）；③ §1.6 W3 待办汇 ①–⑤ 归因。**零触**：产品码（唯一产品面笔 = 码注同步——`ipc.mjs` `msg:send` 注释 ∕ desk `notify.mjs` 档头，父侧待办 ②∕③ 指定面）、vsc ∕ desk 树其余、`src/agent/*`、其它批射程（B1 ∕ B2 ∕ B5 ∕ B7 ∕ #564）。

**批内件（先写 `.thincoder/tmp/`；终位由父侧 copy 至 `docs/batches/`）**

- 文件 = `2026-09-29-parity-b4-vsc-small.test.mjs` —— **222 行**（split 口径 ∕ 内容行 221）+ **12 用例**（T1–T11 = §2.9 全表逐行；T12 = 窗后查位 ∕ 清理面——待办 ④ 点名面）；导入按 `process.cwd()`（仓库根）相对解析 ⇒ tmp ∕ 终位两处可跑；收束 = `t.after`（桩 ∕ 两 seam 复位）；件首含跨包链接 ∕ 直链同实例断言行（seam 注入前提）。
- 判据系事件序 ∕ 信号面（D-7）：**零墙钟断言**——桩请求到达（`hits`）= 降级窗开信号 · `release` 门控降级毕 · runs 计数 = 交付判据；沙箱 = OS tmp（cwd ∕ sessions 根 ∕ 核配置 path 缝）。
- 读数（终态）：`node --test .thincoder/tmp/2026-09-29-parity-b4-vsc-small.test.mjs`（从 `thincoder/` 根）⇒ **12 tests ∕ 12 pass ∕ 0 fail**（≈0.9s；T11 ∕ T12 真 driver + 本地 `127.0.0.1` 桩；无 `--test-force-exit` 干净退出）。

**用例表 → 用例逐条（T1–T12）**：T1 核 `live-beat` 单拍∕起停∕幂等+缝缺抛 · T2 核 `file-links` 探针缺⇒抛 · T3 存在闸（假探针⇒仅 `a.mjs`） · T4 核 `attachments` 预算闸∕弃项源序（`-0/-1/-3` 源序） · T5 `downgradeNonVisionImages` 无图∕多模态早退+注文成功+严判+缝缺抛 · T6 `vision-reader` 无渠道⇒`null`（+同名优先回退） · T7 `provider-flows` 拒因五串 · T8 `notify-policy` 单档+失焦门（`digestStart` 不存在） · T9 `localeOf` 缝（`zh-CN`⇒zh） · T10 desk `degradeTurnAttachments` 三径+`partial` · T11 `continueTurn` async∕空队 false 直返∕降级毕交付∕窗内 send 落队（+清理面断言） · T12 窗后查位（窗内 `dispose`⇒零续发∕零 delivered∕落盘件自清）。

**文档收正逐处表（file:line · 终态实读）**

| # | 文件:行 | 收正 |
|---|---|---|
| 1 | `thincoder-core/file-links.mjs:5-6` | 「迁移留后」⇒ 已随 parity-b4 迁移改指本档（双写窗口收口） |
| 2 | `thincoder-core/agent/live-beat.mjs:4`(+`:15-16`) | 上提源标「（迁移前坐标）」；消费面披露迁移改指 |
| 3 | `thincoder-core/notify-policy.mjs:5`+`:8/:12-13/:18/:22` | 对位锚迁移前坐标；迁移落形 ∕ locales 删键说明（值单源 = 本档） |
| 4 | `thincoder-core/attachments.mjs:5`+`:9`+`:107-108` | 迁移前坐标；已迁移改指；缝句补「缺省实现 = 核 `vision-reader.mjs`」 |
| 5 | `thincoder-core/provider-flows.mjs:7`+`:25` | 已随本批（parity-b4）迁移改指 |
| 6 | `thincoder-core/vision-reader.mjs:5-6` | 副本已删 ∕ 已改指 |
| 7 | `thincoder-desktop/src/main/ipc.mjs:183-187` | 码注：立即回例外句（非视觉带图径）+ reason 含 `aborted`（待办 ②） |
| 8 | `thincoder-desktop/src/main/notify.mjs:5`+`:9` | 重锚 `panel-callbacks.mjs:236` + VSC 锚标迁移前；旧括注清 |
| 9 | `docs/desktop/design/IPC.md:3` | 档行计数 293 ⇒ 294 |
| 10 | `docs/desktop/design/IPC.md:100-101` | `notify.*` 单键（档② 随 D3 去；键值归核 ∕ 持有面 = 核策略档） |
| 11 | `docs/desktop/design/IPC.md:112` | 「立即回」例外句 + `aborted` 落点重锚（`:174-176` ∕ `:194-197`） |
| 12 | `docs/desktop/design/IPC.md:214-215` | 附件注项 4：先落盘 + 降级跑者 ∕ 回执时机 ∕ 窗内 `aborted`（待办 ②） |
| 13 | `docs/desktop/design/IPC.md:216` | 项 5 reason 闭集含 `aborted` |
| 14 | `docs/desktop/design/UI.md:49` | 降级面两码语义收正（+成功零弃 ⇒ 零码 + 注文） |
| 15 | `docs/desktop/design/PROJECT.md:60`+`:74`+`:159`+`:721` | KD-21 非视觉面 ∕ KD-35 随 D3 单档 ∕ §4.1 行同笔 ∕ T-DSK30 ② 两态 |
| 16 | `docs/vsc/design/SETTINGS.md:196`+`:278`+`:282` | provider-flows 宿主侧链三处重锚（核单源） |
| 17 | `docs/vsc/design/WEBVIEW-INPUT.md:41` | 降级判决函数 = 核 `attachments.mjs`（VSC 薄壳转口） |
| 18 | 变更记录行 | `IPC.md:380` ∕ `UI.md:651` ∕ `PROJECT.md:1149` ∕ `SETTINGS.md:576` ∕ `WEBVIEW-INPUT.md:233`（「实施收正轮 · eng-coder」先例 = B2） |

**§1.6 W3 待办汇 ①–⑤ 归因**

- ① 设计文本随动（`hold` 形 ∕ 窗后查位 ∕ 复查位 ∕ 自清）——**父侧 §2 段位补笔落毕**（§1.7 ∕ §2 补笔段三笔；本记录届盘实读 `§2.2:107/:108/:111` 与本段同述）⇒ 清障闭环。
- ② IPC.md 项 4 回执时机 + `aborted` + 码注——**落**（表 #7–#13）。
- ③ 核件档头座标随动（含原 `IPC.md:99` 族）——**落**（表 #1–#6 ∕ #8–#10）。
- ④ 批内件正式化（事件序替墙钟）——**落**（12 用例；T12 补点名面）。
- ⑤ §2.6 表档籍补册——**父侧 §2 段位补笔落毕**（三树表落档实点 + `tools/index.mjs`（#108）+ `vision-reader` W8 笔（#112））。

**审计与代码评审轮次与终态**

- 内部审计（explore 只读分歧审计）轮 1 = DEVIATIONS（非阻断）：🔴1（记录面：§5 W3 段未落——本段即处置）· 🟡2（§2 段位阻断项 ①⑤ 记录义务——本段履行；KD-35 随动——评审轮 1 同向发现）· 🔵1（`IPC.md` `aborted` 落点坐标——已重锚）；SILENT-SIMPLIFICATION ∕ OUT-OF-LIST 零发现。
- 内部代码评审（advisor type=code）轮 1 = **changes-required**（2🔴：§2.2 设计文本随动（→父侧段位补笔清障）· `PROJECT.md` §4.1 行同机制异述（→已收正）；3🟡：desk 档头坐标（→重锚）· 用例缺口 ④（→T12）· `attachments.mjs:107` 半程（→收正）；🔵×6：核件档头迁移前坐标 ∕ 批内件规模注 ∕ `IPC.md:3` 计数 ∕ `t.after` ∕ 同实例断言 ∕ 批档坐标——逐条处置）。
- **fix 轮 1**：上列除 §2.2 外逐条落盘（§2.2 = §2 段位阻断，移交父侧）；复跑 12/12 绿。
- 内部代码评审轮 2（验 fix 声称）= **changes-required**：②–⑩ 逐条转 **Fixed**；单一阻断 = §2.2 未落（R1 例外口径）；无新面。
- **父侧直执行 ∕ 段位补笔**（§1.7 · 06:2x–06:3x）：§2.2 三笔 + §2.6 补册落毕——阻断项清障（本记录届盘实读）。
- **终态 = clean**（本记录时点：全部 prior 🔴 已处置——其一由父侧段位补笔清障；无未决 must-fix；carried 🔵 = 批档坐标现值归 §6 对账）。轮数 = 审计 1 + 评审 2 + fix 1（≤5）。

**§5 决策透明表（本波段）**

| # | 事项 | 处置 | 依据 |
|---|---|---|---|
| D-1 | 批内件 222 行 vs 设计估「≈120 行内」 | 实点为准（12 用例全表覆盖不削；T12 补点名面） | §1.7:43 在册（父侧同判「归 W3 收口」） |
| D-2 | vsc design 收正边界 | 只收「语义已失效」行（判决函数归属 ∕ provider-flows 单源与坐标）；`WEBVIEW.md` 心跳各族按 D4「行号 = as-of 参考」保留未动 | 本波实读判定 |
| D-3 | KD-35 随动（评审轮 1 发现） | 同批 D3 所致的同档异述 ⇒ 收正（KD-35 + §4.1 行 + 变更记录同笔） | §4 D3 批准 |
| D-4 | `IPC.md` `aborted` 落点坐标陈旧 | 重锚 `:174-176` ∕ `:194-197`（旧值按记录面留档） | 评审轮 1 发现 |
| D-5 | 探针四枚（`.thincoder/tmp/b4w3-probe-*.mjs`） | 保留（调试件——只读导入 + OS tmp 沙箱 + 本地桩；W0–W2 先例） | 本波 |
| D-6 | ④ 覆盖选择 | T12 独立用例（窗后查位）+ T11 补「回合尾 cleanupTurn 清毕」断言 | 父侧待办 ④ |
| D-7 | 段位约束 | §2.2 ∕ §2.6 由 §2 作者 ∕ 父侧落笔（eng-coder 段白名单 = §5）——本段只落 §5；§2 ↔ §5.7 对拍 = 父侧执行 | 批档机制 |
| D-8 | 行数对账方法（评审用） | 判据 = read 报面的行号引用（不做事后口径换算） | 本轮实读 |

**负向核**：本波改面 = 批内件 1 档（tmp）+ 六核件档头 + desk 两注入档（`ipc.mjs` 注释 ∕ `notify.mjs` 档头）+ 五档设计文档（含变更记录行）+ 探针 4 件；产品语义零改（唯一码笔 = 注释）；`src/agent/*` ∕ cli ∕ vsc 树其余 ∕ 其它批射程零触。

**5.7 补记（轮 3 尝试 · 清障核验）**：轮 3（advisor type=code · 只核「§2.2 清障 + §5.7 落盘」两条）＝ **超时未完成**（顾问 600s 预算耗尽——无结论产出，未计入轮数 ∕ 未改上「终态」判据）。清障项改由直读复核（D6 读回）：`§2.2:107`（`hold` 形 `{ signal, active, release }` + `active()` = 占位仍在判据 + 窗后查位）· `:108`（`takeOver` 窗后复查位）· `:111`（清理归属例外面 + 落盘件自清）＋ §1.7:41（「§2 补笔落毕」）＋ §2 补笔段:266（随动三笔）——三处同述 ⇒ §2.2 项闭合；**§2 ↔ §5.7 正式对拍 = 父侧**（§1.7 在册）。

## §6 验证与收口（父代理）

**收口记录（父代理 · 2026-09-29）**

**收口读数（父侧亲跑 · 冻结版）**：
- 批内件 `docs/batches/2026-09-29-parity-b4-vsc-small.test.mjs` = **12/12 pass**（T1–T12：核五件 + desk 降级三径 ∕ continueTurn ∕ 窗后查位 + 对拍）。
- 全量批内件收口跑 = **124/124**（14 件 · 同刻 · 含本批）；四端套件 = 空清单绿（全清令制）。
- W8 双链断 = 扫描净 + 恒等复测 true（`thincoder-vscode` 侧零 `node:sqlite` 静态闭包）；对拍（改前 OLD × 改后 NEW）= **SAME 11 ∕ DIFF 0**；§2 ↔ §5.7 逐项对拍 ✓。

**波面（全落）**：W1（file-links ∕ attachments+非视觉降级 ∕ notify ∕ 2s 拍 ∕ provider 流程——取核 + 删残留）· W2 ∕ W3（降级窗 + 查位不变量）· W4 + §2 补笔 + 对拍轮——域外审计 ∕ 代码评审终态 clean。

**结算面（D7）**：台账 **#567**（B4 VSC 小件迁移族）→ **已核销**（核五件直取 + 端侧副本退场 + 三径对拍零差）。
**真机面（父侧义务 · D16）**：通知 zh/en ∕ 贴图降级（首回合 + 后续）∕ provider 三流程 ∕ 拍家族（十项列表在批档 §2.3）——人工走查；清单随本轮真机汇总行。

**状态行**：已收口 2026-09-29。
