# 2026-10-04 · issue 修复批·三（VSC 面 3 条：MCP 警告零消费 ∥ 思考中占位 ∥ 阅读位被夺）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-04 · 来源 = 用户 2026-10-04 00:39「五组都开了」= 归批组全量开批令（承 00:34「开批吧」∥ 00:38 追问 + 00:31「都自动跑」）；条目源 = 2026-10-03 分诊（#823 ∥ #854 ∥ #875——VSC 面）。
> 台账 = #823 ∥ #854 ∥ #875（VSC 面 · 归批）。前情 = 无（同会话兄弟批——一组 = `2026-10-04-issue-fix-round1.md` ∥ 二组 = `2026-10-04-issue-fix-round2.md`）。
## §1 讨论（主 agent）
**状态行**：🔄 进行中（…）
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**本批性质**：归批组第三组（VSC 面 3 条）——用户 00:39「五组都开了」全量开批令；全链。

**本批条目（3）**：① **#823** VSC `_mcpWarnings` 零消费（MCP 服务器加载失败静默——选服务器面无提示）；② **#854** VSC「思考中」占位（时序/残留——分诊实报）；③ **#875** VSC 阅读位被夺（自动滚动夺回用户手动位置）。**锚 = 台账行在册**（设计轮复验先读：`ledger_query` cwd=D:\teamcode\thincoder——逐条全文 + 证据行）。

**复验令**：设计轮开工先逐条实读复验仍存在；已消/前提变者按实况登记（不硬做）。

**授权口径**：全链；用户 00:31「都自动跑」（自缚三条在册）。

**边界**：在飞写域零触——#51（`thincoder-cli/**` + `thincoder-core/ledger-*.mjs`）∥ #56 ∥ #59（issue 批一二）∥ #57/#58（菜单轮/面板修轮）∥ 面板面。本批写域 = `thincoder-vscode/**`（无在飞冲突）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（2026-10-04 · 修复轮 1 收正毕——§3 六条逐处（号 → 落点 = §2.11）；待父侧复审）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.1 复验结论（复验令逐条 · 台账全文 + 现盘实核 · as-of 2026-10-04）
| 台账 | 现盘读数（file:line 实读） | 结论 |
|---|---|---|
| #823 | `connectMcpServersExpanded` 产 `warnings` 仅落 console（`thincoder-vscode/src/extension/panel-mcp.mjs:53-68`）；`buildToolTable` 只取 `r.tools`（`thincoder-vscode/src/agent/tool-table.mjs:150-156`）；VSC 全树 `_mcpWarnings` 零命中；消费点 = CLI（`thincoder-cli/src/command-interactive.mjs:161-168`）∥ 桌面（`thincoder-desktop/src/main/agent-host.mjs:185-189`）；#702 已核销（桌面已修） | **存活**——第三端未并 → 本批修 |
| #854 | 动画在位（`thincoder-vscode/webview/status-bar.js:48` + `thincoder-vscode/webview/controls.css:56-66`）；条①（最小窗口缩放异常）无复现材料 | **②存活 → 本批修；①不做**（待报方复现材料——在册） |
| #875 | a) 工具卡建/完成 + 错误横幅无条件 `scrollDown`（`thincoder-vscode/webview/ui.js:141/151/161/192`；定义 `:203-207`）；b) 推理块两径默认展开（`thincoder-render-core/flow/reasoning.mjs:15` ∥ `thincoder-render-core/flow/block.mjs:107`）；c) 三开关未做（`thincoder-vscode/package.json:102-123` 仅 3 项）；**已修面**（实读在位）= 滚动条/键盘滚动解 pin（`thincoder-render-core/scroll.mjs:105-108` 直写模式）∥ 流式更新已走 `maybeScrollDown`（`thincoder-vscode/webview/streaming.js:32`） | **存活**（a/b/c 三面）→ 本批修；诉求 2 = 已消（登记） |

### 2.2 本批条目（覆盖）与五要素（台账行 = 覆盖全集；#823 ∥ #854 ∥ #875）

**条目 1 = #823（tech_todo）VSC `_mcpWarnings` 零消费（三端同形归一）**
- **模块目标**：MCP 服务器加载失败在 VSC 端不再静默——装配尾把失败提醒交入会话（与 CLI/桌面同形）。
- **功能点**：① `buildToolTable` 出参补 `mcpWarnings`（`r.warnings ?? []`）；② `hydrateRun` 装配尾调 `applyMcpWarnings(agent, mcpWarnings)`（新函数住 `thincoder-vscode/src/agent/setup-reminders.mjs`——提醒面本档；`setup.mjs` 只 +2~3 行，避 300 顾问线）；③ 非空 ∧ 指纹（`warnings.join("\n")`）≠ `agent._mcpWarnedKey` ⇒ 提醒入 `agent._pendingReminders`（首两段逐字同 CLI；末行 = 本端可达出口「Settings panel (MCP section → Reconnect)」）；零警告 ⇒ 零写 + 指纹清（复失败可再推）；④ `panel-mcp.mjs:63-64` 残句「CLI 无此行为」随批收正（与实况相抵——发现项）。
- **边界**：零新 UI ∥ 零新词键 ∥ `.mcp.json` 面（#701）零触 ∥ 管理面（列表/重连/探活）零改 ∥ 核生产面零改。
- **验收**（机检）：批内件假装配三腿（携警告 ⇒ 入队且首两段 CLI 逐字正则命中 ∥ 同指纹二轮零重推 ∥ 零警告零写）+ 负控（缺键零写）；核消费链已在位（`thincoder-core/agent/setup.mjs:172-176`）。
- **依赖**：核 `_pendingReminders` 消费链（在位）；`resetRunState` 每轮清队（`thincoder-vscode/src/agent/agent-state.mjs:46`）⇒ 装配尾推入必须晚于复位（落点序已定）。

**条目 2 = #854（tech_todo）状态栏「思考中」占位改静态（消抖动）**
- **模块目标**：thinking 占位不再抖动——静态化（消段宽逐拍变）。
- **功能点**：`status-bar.js:48` 改 `t("status.thinking") + "…"`；删除 `.loading-dots` 件 + `@keyframes dots`（`controls.css:56-66`；全树唯一消费者 = 本段——grep 双证）。
- **边界**：条①（最小窗口缩放异常）不做——待报方复现材料；词键零改。
- **验收**：单测（thinking ⇒ 段在场 ∧ 零 `.loading-dots` 节点；null ⇒ 段缺席）+ 全树 `loading-dots`/`@keyframes dots` 零命中。
- **依赖**：无。

**条目 3 = #875（requirement）阅读位 ∥ Thinking 默认折叠 ∥ 三偏好开关**
- **模块目标**：自动事件不夺用户阅读位；思考块默认折叠；三常量（活动区封顶/折叠预览行数/自动跟随）开关化（VS Code 设置面）。
- **功能点**：a) `ui.js` `addTool`/`finishTool`（两径）/`showError` 改 `maybeScrollDown`；`scrollDown` 只留显式动作（回底钮 ∥ 发消息 ∥ 首窗历史 `thincoder-vscode/webview/history.js:80` 实读）；b) `flow/reasoning.mjs:15` open=false ∥ `flow/block.mjs:107` `open` 删（手动展开可看全；桌面零触——实读不消费该两件）；c) 三键 `thincoder.ui.autoFollow`（bool，默认 true）∥ `thincoder.ui.activityMaxHeight`（number，默认 32，单位 vh——活动区封顶）∥ `thincoder.ui.activityTailLines`（number，默认 3，允许 0——折叠预览行数）；推送 = 新消息 `uiPrefs`（`thincoder-vscode/src/extension/ui-prefs.mjs`（拟新增）：webviewReady 握手 + `onDidChangeConfiguration`）→ `thincoder-vscode/webview/ui-prefs.js`（拟新增）apply；`autoFollow = false` ⇒ **自动滚动全禁**——门落点三处（覆盖清单 = 三径全数）：
  ① 消息区 `maybeScrollDown`（`ui.js` 函数体内门——全调用面随门）② 活动区 `maybeScrollActivity`（同式）③ 块内容跟滚（帧尾消费点 `thincoder-vscode/webview/streaming.js` `subScroll` 循环前门——`maybeScrollBlock` 全数随门）；
  显式动作（回底钮 ∥ 发消息 ∥ 首窗历史）走 `scrollDown` 直写——零门（不受影响）；门读 `ctx._autoFollow`（apply 落值；缺键 / 坏值 ⇒ 缺省 true）；tail 缝 = 核 `configureActivityView({ tailLines })`（模块级 setter——沿 configure* 先例）。
- **边界**：桌面面零触（推理块默认差 = **待消解**——凭据判定 ∥ 消解路径 ∥ 到期条件 = §2.9 U3）∥ 面板内不加控件 ∥ 既有协议字段语义零改 ∥ `scroll.mjs` 判据零触。
- **验收**：单测四组（scroll 门控两向：旗标假三径零写／真写 MAX；两径默认折叠；prefs 应用：autoFollow 门 ∥ maxHeight 内联样式 ∥ tailLines 0/N；缺键坏值 ⇒ 缺省）；真机腿（父侧走查）= 上滚后工具卡/错误不夺位（含活动区 ∥ 块跟滚）、回底复跟、Thinking 折叠、三开关生效。
- **依赖**：VS Code `onDidChangeConfiguration`（先例 `thincoder-vscode/src/extension/stop-trace.mjs:22-25`）；核 render-core 缝（本批加）。

### 2.3 受影响文件（现读 → 预期；口径 = `wc -l` 等价 · 2026-10-04 实读）
| 文件 | 现 | 预期增量 |
|---|---|---|
| `thincoder-vscode/src/agent/tool-table.mjs` | 187 | +4（出参） |
| `thincoder-vscode/src/agent/setup.mjs` | 297 | +2~3（**贴 300 顾问线**——逻辑住 `setup-reminders.mjs`） |
| `thincoder-vscode/src/agent/setup-reminders.mjs` | 41 | +~35（提醒函数） |
| `thincoder-vscode/src/extension/panel-mcp.mjs` | 167 | ±1（注释收正） |
| `thincoder-vscode/src/extension/ui-prefs.mjs` | 新 | ~40 |
| `thincoder-vscode/src/extension/chat-panel.mjs` | 441 | +~6（接线；**已越 300 建议线（存量 441）**——复核结论 = 不拆（仅接线，不改结构）；拆分计划 = 触发阈值 **450 行** ∥ 该档下次结构改动（先到即拆）；组边界 = ① 视图装配族（`resolveWebviewView` ∥ `_html` ∥ 状态栏两件——≈85 行）② 构造器监听族（两 vscode 监听块——≈60 行）③ 回合入口族（`_chat` ∥ 忙态三件 ∥ `sendMessage`——≈95 行）——① 拆出 = `thincoder-vscode/src/extension/panel-view.mjs`（拟新增）；到期条件 = 触发阈值到达时） |
| `thincoder-vscode/package.json` | 142 | +~24（三键） |
| `thincoder-vscode/webview/ui.js` | 241 | +~6（四调用点 + autoFollow 两原语门） |
| `thincoder-vscode/webview/ui-prefs.js` | 新 | ~30 |
| `thincoder-vscode/webview/chat-messages.js` | 265 | +~4（`uiPrefs` case） |
| `thincoder-vscode/webview/streaming.js` | 184 | +~2（块跟滚帧尾门） |
| `thincoder-vscode/webview/status-bar.js` | 134 | ±1 |
| `thincoder-vscode/webview/controls.css` | 149 | −11（动画块删） |
| `thincoder-render-core/flow/reasoning.mjs` | 24 | ±1 |
| `thincoder-render-core/flow/block.mjs` | 153 | ±1 |
| `thincoder-render-core/subblocks/activity-view.mjs` | 205 | +~12（缝） |
（实施轮落盘后回填终态读数；**写域按实况扩一域** = `thincoder-render-core/**` 三档（`flow/reasoning.mjs` ∥ `flow/block.mjs` ∥ `subblocks/activity-view.mjs`）——§1 写域句 `thincoder-vscode/**` 按实况扩；无在飞冲突，桌面零消费实读证。）

### 2.4 测试面（normal ∥ boundary ∥ error）
批内件 = `docs/batches/2026-10-04-issue-fix-round3.test.mjs`（单元——随批档留存；集成零新增 · 50–100 预算纪律）。
| 面 | normal | boundary | error |
|---|---|---|---|
| #823 | 携 1 失败 ⇒ 提醒入队（首两段 CLI 逐字） | 同指纹二轮 ⇒ 零重推；恢复后复失败 ⇒ 再推 | 装配抛 ⇒ 非致命零提醒；缺键 ⇒ 零写 |
| #854 | thinking ⇒ 静态段在场 | `_phase=null` ⇒ 段缺席 | — |
| #875a | 旗标真 ⇒ 三径照写（跟底） | 旗标假 ⇒ 三径零写（消息区工具/错误 ∥ 活动区 ∥ 块跟滚——各 `scrollTop` 零改；显式动作照写） | — |
| #875b | live 径 `open=false` | 恢复径无 `open`；展开后内容在场 | — |
| #875c | 三键应用（门控/样式/tail） | tailLines=0 ⇒ 零预览；坏值 ⇒ 缺省 | 载荷缺键 ⇒ 缺省零写 |
真机腿 = 父侧走查（上滚阅读 → 工具卡/错误/流式不夺位（含活动区 ∥ 块跟滚）→ 回底复跟 → Thinking 折叠 → 三开关各翻一次）。

### 2.5 验收对照（回指台账——三链同源：§2 条目 = 设计档 = 台账行）
| 台账 | §2 条目 | 设计档句 | 验收（机检） |
|---|---|---|---|
| #823 | 2.2-1 | `docs/core/design/MCP.md` §6.4（消费面 = CLI ∥ 桌面 ∥ VSC——端差句删除）+ `docs/vsc/design/SETTINGS.md` §2.4 | 批内件三腿 + 负控 |
| #854 | 2.2-2 | `docs/vsc/design/WEBVIEW.md` §4.9 | 渲染单测 + grep 零残留 |
| #875 | 2.2-3 | `docs/vsc/design/WEBVIEW.md` §5.8 ∥ `docs/render-core/design/RENDER-CORE.md` §5 ∥ `docs/vsc/design/WEBVIEW-PROTOCOL.md` §3/§3.2（`uiPrefs` 行 23） | 单测四组 + 真机腿 |

### 2.6 关键决策与被否
- **K1 #823 = 三端同形消费（提醒入 `_pendingReminders`）**；否：明书端差（用户可见失败静默 = 缺陷，无宿主差异依据——沿 KD-70 同判）∥ 新增 UI 提示面（越三端同形裁 + 零新 UI 先例）。
- **K2 #823 去重 = 指纹去重（同失败集不重推）**；否：每轮重推（提醒噪音——CLI/桌面均一次制）。
- **K3 #854 = 静态省略号**；否：定宽动画保留（仍有动效）∥ 整段删除（信息丢失）。
- **K4 #875a = 改调用点**；否：改 `scrollDown` 本体（显式动作需强制重 pin）∥ 改 pin watch（判据单源零触）。
- **K5 #875b = 核件两径同改**；否：仅 live 径（恢复径存量不一致）。
- **K6 #875c 载体 = VS Code 设置 + `uiPrefs` 推送**；否：面板内控件（UI 偏好不属 config.json 共享契约面）∥ webview localStorage（跨窗持久无保证）∥ 每键独立消息（一消息三键更简）；tail 缝 = `configureActivityView`（否：渲染传参穿透 ∥ 端侧复刻 tail 逻辑）。
- **被否（#875c）**：第 4 开关 `collapseThinking` 未并（默认折叠行为已覆盖诉求 3/验收 3——如需另裁，接口径已留；见上抛 U1）。

### 2.7 边界（不做）
- #854 条①（最小窗口缩放异常）= 待报方复现材料（不做——保持台账在册）。
- 桌面面零触（推理块默认态 ∥ MCP 提醒——桌面已落；跨端默认差（推理块）= **待消解**——凭据判定 ∥ 消解路径 ∥ 到期条件 = §2.9 U3）。
- `.mcp.json` VSC 对齐（#701）∥ MCP 管理面 UI ∥ CLI/核生产面 ∥ `scroll.mjs` 判据 ∥ 面板内新控件——均不做。
- 协议面：仅 `uiPrefs` 一条新消息；既有字段语义零改。
- 不点火评审 ∥ 不跑构建 ∥ 不写实现码（设计轮）。

### 2.8 设计档落点（沿一板块一档惯例——给理由）
- `docs/core/design/MCP.md` §6.4 + 变更记录（#823——消费面机制单源）· `docs/vsc/design/SETTINGS.md` §2.4 + 变更记录（#823 VSC 端事实，沿 #701 先例）· `docs/vsc/design/WEBVIEW.md` §4.9 ∥ §5.8 + 变更记录（#854 ∥ #875）· `docs/vsc/design/WEBVIEW-PROTOCOL.md` §3 ∥ §3.2 + 变更记录（`uiPrefs`）· `docs/render-core/design/RENDER-CORE.md` §5 + 变更记录（#875b/缝）。
- 理由：VSC 设计正本 = 仓根 `docs/vsc/design/`（webview/protocol/settings 分档）＋共享机制单源档（core/MCP.md ∥ render-core/RENDER-CORE.md）；三事各有现档承接 ⇒ **不新建档**（一板块一档；一次性材料 = 本 §2）。**未采** = 批设计独立成档（本批各事均有现档可写——与批·二情形（owning 档在飞）不同）。

### 2.9 上抛项
- **U1**：GitHub #7 诉求 3 列 4 项开关（含「Thinking 默认折叠」），台账行写「三项界面开关」——本批按 3 开关 + Thinking 默认折叠（行为）处置；第 4 项开关化未并（如需 = 加 `thincoder.ui.collapseThinking` 键，径同上）。
- **U2**：#854 条①（最小窗口缩放异常）——待报方复现材料，本批不做（边界在册）。
- **U3**：桌面推理块默认态（自持 `thincoder-desktop/renderer/views/chat-text.mjs:55` open:true）不与 VSC 同并——**跨端默认差（VSC 折叠 ∥ 桌面展开）· 待消解**。**凭据判定**（判据 = `docs/vsc/design/WEBVIEW.md:3` 端差句 ∥ `WEBVIEW-PROTOCOL.md` §6.1 首句）：宿主能力面证据 = 不成立（非宿主设施差）∥ 行为证据 = 不成立（默认开合态 = 用户可见态差，非载体差）。
  **消解路径 = 桌面面另批**（桌面默认态改折叠——一行；对齐方向 = VSC 现默认（#875 用户诉求面））；**触发 ∥ 到期条件 = 桌面面下次被触碰**。本批不做（桌面面写域外——越批边界）。
- **U4**：`panel-mcp.mjs:63-64` 注释残句（发现项）——已入修法④随批收正（低风险）。
- **U5**：写域扩一域（`thincoder-render-core/**` 三档——`flow/reasoning.mjs` ∥ `flow/block.mjs` ∥ `subblocks/activity-view.mjs`；§1 写域句按实况扩；无在飞冲突）。

### 2.10 机检读数（doc-check · 仓根）
- 域内复跑 = `docs/vsc` ∥ `docs/core` ∥ `docs/render-core`（本批五档域）：读数见交付报告（全绿目标）。
- 全量复跑（`node scripts/doc-check.mjs --root d:\teamcode\thincoder`）：当前红点全数落于**批·二在飞新档** `docs/cli/design/ACP-PROTOCOL-COMPLIANCE.md`（3 处——非本批面；该档头注实读证：建档 = issue 修复批·二 · 设计轮；本批零触）；本批五档域零悬空零超宽（首轮所拦 9 处坐标已逐处收正——拟新增标记 + 仓根相对路径）。

### 2.11 修复轮 1（§3 轮次 1 · 六条逐处收正）

（修复轮 · eng-designer · 2026-10-04 · fix——定点收正：批档 §2 内 12 处 + 设计档三档 8 处（含变更记录 3 条）；产品码零触（仅实读）；`MCP.md` 只动 §6.4 区与变更记录本批相关行。）

| 号 | 处置 | 落点（file:line · 收正后实读） |
|---|---|---|
| 1 | #701 实况 = **已落 + 已核销**（`thincoder-vscode/src/config-mcp.mjs:85-104` ∥ `thincoder-vscode/src/extension/panel-turn-loop.mjs:165` 在盘；台账 2026-10-01 核销）⇒ 按裁「已落」支收正——`MCP.md` 括注「未并」⇒「已并（2026-10-01 vsc-cleanup 批 · 台账 #701 已核销；三端同判）」；设计轮条「端差归零」辖域限定 = **消费面**；SETTINGS.md 零改（其句 = 已落实况——无相抵） | `docs/core/design/MCP.md:90` ∥ `:240` ∥ `:242-243` |
| 2 | §2.3 补拆分复核登记（复核结论 = 不拆 ∥ 触发阈值 450 ∥ 组边界三族 · ① 拆出候选 `thincoder-vscode/src/extension/panel-view.mjs`（拟新增）∥ 到期条件）+ 受影响表 +`streaming.js` 行 | 批档 `:63` ∥ `:67-68` ∥ `:74` |
| 3 | autoFollow 门落点三处钉定（消息区 `maybeScrollDown` ∥ 活动区 `maybeScrollActivity` ∥ 块跟滚 `streaming.js` `subScroll` 帧尾）+ 覆盖清单 + 负控三径化；`WEBVIEW.md` §5.8 同拍 | 批档 `:48-50` ∥ `:52` ∥ `:65` ∥ `:82` ∥ `:85`；`docs/vsc/design/WEBVIEW.md:519-521` ∥ `:837-838` |
| 4 | U3 补凭据判定（宿主能力面 ∥ 行为证据均不成立）+ 消解路径 + 触发 ∥ 到期条件；§2.2-3 边界 ∥ §2.7 同拍 | 批档 `:117-118` ∥ `:51` ∥ `:105`；`docs/vsc/design/WEBVIEW.md:516` |
| 5 | D-P11 计数同步（二十二项 ⇒ 二十三项——与 §3.2 标题 ∥ 行 23 登记一致） | `docs/vsc/design/WEBVIEW-PROTOCOL.md:345` ∥ `:736` |
| 6 | 写域句计数按表收正（「两档」⇒ 三档——三件枚举；「扩一档」⇒「扩一域」） | 批档 `:74` ∥ `:120` |

**读回（D6 · 修复轮末）**：上列落点逐处读回在位；`node scripts/doc-check.mjs`（仓根）复跑读数见交付报告。

**边界（本轮）**：产品码零触（仅实读）∥ 在飞写域零触 ∥ §1 / §3–§6 零动 ∥ 无新语义（= §3 六发现 + 父侧裁定「六条全采纳」的直接导出项）。

**doc-check 读数（修复轮末复跑 · 仓根 `node scripts/doc-check.mjs` · 2026-10-04）**：**exit 0** ∥ 锚闸 OK（悬空 **0**——阈值 0）∥ 行宽 OK（源域全 .md 无 >300 单行）∥ 汇总 = 候选 47081 · 悬空 0 · 注记豁免 319 · 拟新增 53 · 迁移期引文 297 · 声明源缺位 0 ∥ 全数 ✗ = 非闸面列报（拟新增 ∕ 迁移期引文——沿既有形态；本批新增引用零悬空）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审面** = 声明五档设计面 + 批档 §2（六文档全读）。限制声明：文档地图 ∥ 项目标准档未声明 ⇒ 归属 / 规范判据按 AGENTS.md + 档内既有惯例降级核对；受影响表行数为在审文档转引（源码不在评审范围）⇒ 只做内部一致性与跨档对读。

| # | 类别 | 严重度 | 发现 | 建议 |
|---|---|---|---|---|
| 1 | Document ownership | 🟡 | `thincoder/docs/core/design/MCP.md:90`「（VSC 端第三面未并 `.mcp.json`——端差在册：台账 #701，归 VSC 对齐轮。）」与 `thincoder/docs/vsc/design/SETTINGS.md:51`「装配面第二源（2026-09-30 · 台账 #701）……另并项目根 `.mcp.json`」——同一机制（VSC 装配面 .mcp.json 并入）状态陈述相抵（未并 ∥ 已并），二者至少其一失实 / 需时态收正；本批恰在同区块删「VSC 面未并——端差在册」句并记「端差归零」（`MCP.md:239`），残留句与本批触点相邻 | 按 #701 实施实况择一收正：已落 ⇒ 改 / 删 `MCP.md:90` 括注；未落 ⇒ `SETTINGS.md:51` 补「设计已裁 · 实施待落」时态标 + `MCP.md` 句同步；并复读「端差归零」表述的辖域 |
| 2 | Affected-file size | 🟡 | `docs/batches/2026-10-04-issue-fix-round3.md:61`：`thincoder-vscode/src/extension/chat-panel.mjs` 现 441（⇒ ~447）——越 300 顾问线但未带拆分复核 / 计划；对照同表 `setup.mjs` 297（`:57`）已给「贴 300 顾问线」处置 | 补拆分复核登记（复核结论 ∥ 触发阈值 450 ∥ 组边界），或明示其拆分计划指针 |
| 3 | Clarity | 🟡 | `thincoder/docs/vsc/design/WEBVIEW.md:518` 仅「`autoFollow = false` ⇒ 自动滚动全禁、显式动作不受影响」；批档 `:63`「`ui.js` +~6（四调用点 + autoFollow 门）」未定门落点与覆盖路径（消息区 `maybeScrollDown` ∥ 活动区 `maybeScrollActivity` ∥ 块内容跟滚）——「全禁」两读皆可实现，验收「autoFollow 门」不足以判别 | 钉定门落点 + 覆盖调用路径清单，并补负控用例（false ⇒ 各自动滚动路径零写） |
| 4 | Document ownership | 🟡 | 新跨端默认差（VSC 思考块默认折叠 ∥ 桌面自持 `open:true`——批档 `:114` U3）仅按「界面层登记」保留——与 `WEBVIEW.md:3` 判据「端差默认 = 消；保留例外凭据 = 宿主能力面证据 ∥ 行为证据（#677）」不对齐；且无消解路径 + 到期条件（U3 仅「如需并 = 一行另批」） | 补凭据两条之一，或给消解路径 + 到期条件（对齐桌面一行为另批须带触发条件） |
| 5 | Methodology compliance | 🔵 | `thincoder/docs/vsc/design/WEBVIEW-PROTOCOL.md:345` D-P11 计数「二十二项」未随 §3.2 标题「二十三项」（`:86`，本批 +行 23——`:118`）同改——沿本档 D3「计数与列表同改」先例（历批均标「D-P11 计数同改」） | D-P11 计数同步为二十三项 |
| 6 | Clarity | 🔵 | 批档 `:71` 注 ∥ `:116` U5 写域句「`thincoder-render-core/**` 两档」与同表三档（`:68-70`——`flow/reasoning.mjs` ∥ `flow/block.mjs` ∥ `subblocks/activity-view.mjs`）不符 | 按表收正计数（或其本意 = 两域——须明示） |

要点核读逐项验讫：三端同形消费句（`MCP.md:86-88` ∥ `SETTINGS.md:53-55`）∥ 调用点纪律与 `scrollDown` 本体零动（`WEBVIEW.md:512-513`）∥ 三键载体（`WEBVIEW.md:516-518` ∥ `WEBVIEW-PROTOCOL.md:74/118`）∥ 写域扩档（计数见发现 6）∥ U1–U5 处置位均在册（批档 §2.9）。

计数 = 🔴 0 ∥ 🟡 4 ∥ 🔵 2。

VERDICT: pass

## §4 用户批准（主 agent）

**父侧代签（用户 2026-10-04 00:31「都自动跑」——点火 / 代签 / 派发 / 收口全自动授权；自缚三条件齐备）**

- ① **设计评审 pass** ✓：评审 #68（`VERDICT: pass` · 🔴 0 ∥ 🟡 4 ∥ 🔵 2）；
- ② **修正落地核验** ✓：收正轮 #73 六条全落（**#701 实况核 = 已落 + 已核销** ⇒ `MCP.md:90` 括注收正「已并·三端同判」∥ 拆分复核登记（阈值 450 · 组边界三族）∥ autoFollow 门三径钉定 + 负控 ∥ U3 凭据判定 + 消解路径 + 到期条件 ∥ D-P11 计数 ∥ 写域句收正）；父侧抽验在盘（`MCP.md:90` ∥ `WEBVIEW.md:516` ∥ `:519-521`）；`doc-check` exit 0；
- ③ **token 已签发** ✓（值不入档，纪律照守）。

**批准面**：#823 ∥ #854 ∥ #875——**按面两路派发**（VSC 面 13 档 ⇒ eng-coder 甲 ∥ render-core 面 3 档 + 批内件 ⇒ eng-coder 乙（**dependsOn 甲**——批内件全量复跑需甲落））。

## §5 实施记录（eng-coder）

**状态行**：实施完成（甲舱 13+1 档 ∥ 乙舱 render-core 3 档 + 批内件 16/16 全绿 —— 缝装载烟测绿（5.6）· 审计零偏差 · 代码评审 pass）

### 5.1 交付摘要（甲舱 = VSC 面 13 档 + 越表 1 档 · 逐档终态读数 as-of 2026-10-04）

| 文件 | 终态 | 落点（file:line） |
|---|---|---|
| `thincoder-vscode/src/agent/tool-table.mjs` | 190（+8/−5） | `:157` 捕获 `r.warnings ?? []`；`:189` 出参 `{ baseSet, mcpWarnings }`；`:158` 展开抛 ⇒ 零警告非致命 |
| `thincoder-vscode/src/agent/setup-reminders.mjs` | 65（+24） | `applyMcpWarnings`（`:52-65`——载体 ∥ 指纹去重 ∥ 提醒全文；零警告零写 + 指纹清） |
| `thincoder-vscode/src/agent/setup.mjs` | 300（+6/−3） | `:24` import；`:194` 解构；`:291` 装配尾调用（晚于复位 ∥ 槽回填） |
| `thincoder-vscode/src/extension/panel-mcp.mjs` | 167（+2/−2） | `:63-64` 注释残句收正 |
| `thincoder-vscode/src/extension/ui-prefs.mjs` | 26（新增） | `pushUiPrefs` ∥ `initUiPrefs` |
| `thincoder-vscode/src/extension/chat-panel.mjs` | 443（+2） | `:25` import；`:204` 变更订阅接线 |
| `thincoder-vscode/src/extension/panel-messages.mjs` | 374（+3 · 越表——见 5.3 D1） | `:41` import；`:328` webviewReady 握手重推 |
| `thincoder-vscode/package.json` | 157（+15） | `:122-136` 三键（true ∥ 32 ∥ 3） |
| `thincoder-vscode/webview/ui.js` | 249（+14/−6） | 四调用点改门（`:144/:154/:164/:195`）+ 两原语门（`:215/:223`） |
| `thincoder-vscode/webview/ui-prefs.js` | 22（新增） | `applyUiPrefs`（三面 + 缺省/坏值） |
| `thincoder-vscode/webview/chat-messages.js` | 270（+5） | `:33` import；`:164` case |
| `thincoder-vscode/webview/streaming.js` | 184（+2/−1） | `:32` subScroll 循环前门 |
| `thincoder-vscode/webview/status-bar.js` | 135（+2/−1） | `:49` 静态省略号 |
| `thincoder-vscode/webview/controls.css` | 137（−13——见 5.3 D2） | 动画件 + `@keyframes dots` + 孤儿段注删 |

### 5.2 测试读数（甲舱自跑 · 行内 node 等价腿——批内件 = 乙舱笔面，本刻未落）

- #823：15/15（三腿 + 负控 + 载体 + 指纹变更腿 + 真连接面出参 + `buildToolTable` 两向）；另 7/7 = 载体腿（见 5.4）。
- #854：5/5（渲染两态 + 控件档全树代码面 grep 零残留）。
- #875a：12/12（消息区 ∥ 活动区 ∥ 块跟滚三径两向 + 显式动作照写对照 + 调用点纪律 + `scrollDown` 本体零门）；径 3 = 真 `streaming.js` `subagentChunk` 驱动（rAF 帧）。
- #875c：26/26（三键应用 + 缺省/坏值 + `tailLines=0` + 分发 case + 宿主推送两面 + 载荷形）。
- 项目自证：`node scripts/check-syntax.mjs`（thincoder-vscode）= 136 档 OK。
- ⚠ 缝未落期读数：`thincoder-vscode/webview/ui-prefs.js:12` 的具名导入 `configureActivityView` 现不可解析（乙舱未落）⇒ 本刻 webview 模块图不可装载；#875c 的 tail 面 = 接口在位、缝待乙（代码评审 1 号协调项——§6 必须「缝在盘 + 装载烟测」）。

### 5.3 决策透明表

| # | 决策 | 理由 |
|---|---|---|
| D1 | `panel-messages.mjs` 越表改（+3） | webviewReady 握手重推的 case 住该档（设计 §5.8 明定「握手 + onDidChangeConfiguration」两面）；§2.3 表未列——越表披露 |
| D2 | `controls.css` −13（设计 −11） | +2 = 孤儿段标题注释 + 空行随动画件同删（D8 残句不留） |
| D3 | `applyMcpWarnings` 非空径写 `agent._mcpWarnings` 载体 | 设计档 `SETTINGS.md:53`「出参 warnings 入 agent._mcpWarnings」；零警告径不写（守「零写」）——内审 F1 收口 |
| D4 | `activityMaxHeight` 缺省仍写 `32vh` 内联 | 「缺省 ⇒ 32」落实为写规范化缺省（与 `base.css` CSS 缺省同值；幂等） |
| D5 | 行内 node 等价腿替代批内件 | 批内件 = 乙舱笔面（避双写）；甲舱自跑读数见 5.2 |
| D6 | 缝导入保持静态具名（fail-loud） | 不落防御式可选调用（避静默降级）；缝落盘后方可装载 |

### 5.4 审计与代码评审（轮次与终态）

- **内审（分岔审计 · 1 轮）**：3 🔵——F1（设计档载体句 vs 码）、F2（§2.3 回填 + §5 空）、F3（越表披露）；F1 就地收口（D3），F2/F3 = 登记面。
- **代码评审（advisor code · 1 轮）**：🔴 0 ∥ 🟡 4 ∥ 🔵 3；**VERDICT: pass**。🟡 = ① 缝协调项（乙）② `panel-messages.mjs` 374 行未带拆分登记 ③ `WEBVIEW-PROTOCOL.md` §12 行未落 ④ `chat-panel.mjs` 443 行（既有裁定 · 阈值 450）。
- **fix round（1 处代码面）**：`chat-panel.mjs:204` 注文「订阅一次性」⇒「随 resolve 注册」（评审 🔵——注文与行为一致化）。
- **终态**：**clean**（甲舱域内 🔴 0；未决 = 乙舱缝 ∥ 批内件 ∥ 登记类 🟡 三项——均非码面缺陷）。

### 5.5 边界遵守

写域 = `thincoder-vscode/**`（13 档 + 越表 1 档）；零 `thincoder-render-core/**` 触 ∥ 零 `docs/**` 触 ∥ 零桌面触 ∥ 零在飞写域触；档位：各 ≤500 硬线；`setup.mjs` = 300 整（贴顾问线）· `chat-panel.mjs` = 443 < 450 拆分阈值。

### 5.6 乙舱交付（render-core 面 3 档 + 批内件 · eng-coder · 2026-10-04 · initial 轮）

**件与落点（逐档终态读数 · 按盘回填——含 §2.3「实施轮落盘后回填终态读数」面）**

| 文件 | 终态 | 落点（file:line） |
|---|---|---|
| `thincoder-render-core/flow/reasoning.mjs` | 25（+1 净；对 §2.3 预估 ±1 ✓） | `:16` `details.open = false`（#875b live 径默认折叠）；`:8-10` 头注同拍 |
| `thincoder-render-core/flow/block.mjs` | 154（+1 净；预估 ±1 ✓） | `:108` 恢复径 `<details class="reasoning-block">`（`open` 属性删——与 live 径同拍）；`:100-101` 头注同拍 |
| `thincoder-render-core/subblocks/activity-view.mjs` | 214（+9 净；预估 ~+12） | `:19-27` 缝（`DEFAULT_TAIL_LINES = 3` ∥ `configureActivityView({ tailLines })`——非负整数落值 ∥ 坏值/缺键回缺省）；`:150` 消费（`tailLines(block, _tailLines)`）；`:8 ∥ :116 ∥ :129 ∥ :146-148` 注文同拍 |
| `docs/batches/2026-10-04-issue-fix-round3.test.mjs`（新） | 433 行 | 16 腿五组：T-823-1..4 ∥ T-854-1..2 ∥ T-875a-1..3 ∥ T-875b-1..2 ∥ T-875c-1..5 |

**批内件读数（逐腿 · 平 node ∥ 零网络 · 两 cwd 形复跑稳定）**：**16/16 pass**。关键读数：T-823-1 `pending=1` + 首两段 CLI 逐字正则 + VSC 出口句 ∥ T-823-2 `n1=1 n2=2 final=3` ∥ T-823-3 负控 5 值零写 ∥ T-823-4 抛径非致命 `[]` ∥ T-854-1 段=`"THINK…"` 且 `.loading-dots`=0 ∥ T-854-2 扫描 774 档 · 命中 0 ∥ T-875a-1 三径零写（msgs 7→7 ∥ act 9→9 ∥ 块内容 0；显式动作→MAX）∥ T-875a-2 三径写值均 = 9007199254740991 ∥ T-875a-3 四调用点=门 + `scrollDown` 零门 ∥ T-875b-1/2 两径默认折叠 + 内容在场 ∥ T-875c-1..5 三键应用/缺省/坏值/0 零预览/缝直测/装载烟测（shim ≡ core ≡ junction 同函数对象）。

**先红后绿（如实登记）**：开工时甲舱已落（commit `8acd5330`）⇒ 直绿；构建过程三名红腿逐条归因——2× 腿夹具形（工具卡 `args` 实收字符串：`ui.js:139` → `tool-card.mjs:71` `args.slice`——夹具改传串）∥ 1× 盘符大小写 ESM 双实例（junction 规范形 `D:` vs 直路径 `d:` ⇒ 身份断言假红——`realpathSync` + 大写归一收正；先例 = 跨端消化批夹具收正）。均腿面修正，非产品码缺陷。

**机检读数**：`node scripts/doc-check.mjs --root d:\teamcode\thincoder` = **exit 0**（锚闸 0 悬空 ∥ 行宽全绿；行数面 9 条差异 = 报告态——含 `RENDERER.md:333` `flow/block.mjs` 表 153 ⇒ 实读 154（Δ+1 随本舱））∥ 核包 `node test/run.mjs` = **exit 0**（C1：零依赖 ∥ import 面 ∥ 全档 `node --check`）∥ 三档 `node --check` OK ∥ 档位 25 ∥ 154 ∥ 214 ≤500。

**决策透明表**

| # | 决策 | 理由 |
|---|---|---|
| D1 | 缝内归一（非负整数落值 ∥ 坏值/缺键回缺省 3）与甲舱端归一（`ui-prefs.js:21`）双层嵌套 | 缝 = 公开导出面（VSC ∥ 桌面共用核件）——幂等；逐字守设计句「缺省 3 ∥ 允许 0」 |
| D2 | 批内件盘符大小写单键化 | junction 规范形与直路径大小写不一 ⇒ ESM 双实例（身份断言假红）——先例 = 跨端消化批夹具收正 |
| D3 | T-823 装配腿 = `panel-mcp` 桩短接（registerHooks；行为面经 `__panelMcpStub` 逐腿切换） | `tool-table.mjs` 静态链达 `vscode`（`src/tools/index.mjs`）⇒ 需宿主桩；沿 `2026-09-30-vsc-residuals` 先例；甲档只读零改写 |
| D4 | 审计 O1/O2 就地收口；O3（批档回填）落本块 | O1 = 注文 tail-3 残句同拍 ∥ O2 = 扫描面下限断言（防空集假绿） |
| D5 | 代码评审 🟡1 + 🔵5 零擅改——登记父侧裁决 | 均非 must-fix；沿 round2 先例「本轮零擅改 = 零语义外扩纪律」 |

**审计与评审轮次（终态 = clean）**

- **内审（分岔审计 · explore · 只读 · 1 轮）**：四类偏差（未落 ∥ 静默简化 ∥ 越清单 ∥ 文档漂移）**零发现**；执行腿（批内件自跑 ∥ doc-check）审计侧无执行面 ⇒ unverified（本舱自跑读数 = 上）；O1/O2 就地收口，O3 = 本块回填。
- **代码评审（advisor code · 1 轮）**：**VERDICT: pass**（🔴 0 ∥ 🟡 1 ∥ 🔵 5）。🟡 = 批内件 433 行越 300 顾问线（同系列批件 22–34KB 同超；非 must-fix）；🔵 = 反证腿墙钟断言 ∥ 跨腿共享态无复位 ∥ 缝 `null` 入参抛（现调用面可达性零）∥ `status.thinking` 省略号字形两形（存量）∥ §2.4 error 格「缺省零写」措辞 vs §5.3 D4 读法。六条 = 父侧裁决面。
- **fix round**：审计轮 O1/O2 两处（评审前已落并复跑 16/16）；评审 pass 后零产品码改动——收敛。

**边界遵守**：写域 = 恰四档（render-core 3 + 批内件 1）；`thincoder-vscode/**` 只读驱动（甲档零改写）∥ `docs/**` 设计档零触 ∥ 在飞写域零触（#72 ∥ #75 ∥ #76/#77 ∥ 面板面）∥ 已收口批档零触；越清单 = 0。**缝装载烟测 = 绿**（甲舱 `ui-prefs.js:12` 具名导入可解析——缝未落期「整链不可装载」警告随本块收束；§5.2 ⚠ 协调项关闭）。

**designId 回显**：spawn 材料未携 designId 字面值（凭据值不落档——沿先例 `2026-09-29-stall-indicator.md:217`）；授权面 = token 门（本舱全部写获准落地）。如实缺项，不猜测充数。

## §6 验证与收口（父代理）
