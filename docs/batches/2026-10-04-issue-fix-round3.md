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
**状态行**：设计完成（2026-10-04 · 台账 #823 ∥ #854 ∥ #875；设计档五处已落，机检读数入交付报告）
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
- **功能点**：a) `ui.js` `addTool`/`finishTool`（两径）/`showError` 改 `maybeScrollDown`；`scrollDown` 只留显式动作（回底钮 ∥ 发消息 ∥ 首窗历史 `thincoder-vscode/webview/history.js:80` 实读）；b) `flow/reasoning.mjs:15` open=false ∥ `flow/block.mjs:107` `open` 删（手动展开可看全；桌面零触——实读不消费该两件）；c) 三键 `thincoder.ui.autoFollow`（bool，默认 true）∥ `thincoder.ui.activityMaxHeight`（number，默认 32，单位 vh——活动区封顶）∥ `thincoder.ui.activityTailLines`（number，默认 3，允许 0——折叠预览行数）；推送 = 新消息 `uiPrefs`（`thincoder-vscode/src/extension/ui-prefs.mjs`（拟新增）：webviewReady 握手 + `onDidChangeConfiguration`）→ `thincoder-vscode/webview/ui-prefs.js`（拟新增）apply；tail 缝 = 核 `configureActivityView({ tailLines })`（模块级 setter——沿 configure* 先例）。
- **边界**：桌面面零触（推理块默认差 = 界面层登记）∥ 面板内不加控件 ∥ 既有协议字段语义零改 ∥ `scroll.mjs` 判据零触。
- **验收**：单测四组（scroll 门控两向：旗标假零写／真写 MAX；两径默认折叠；prefs 应用：autoFollow 门 ∥ maxHeight 内联样式 ∥ tailLines 0/N；缺键坏值 ⇒ 缺省）；真机腿（父侧走查）= 上滚后工具卡/错误不夺位、回底复跟、Thinking 折叠、三开关生效。
- **依赖**：VS Code `onDidChangeConfiguration`（先例 `thincoder-vscode/src/extension/stop-trace.mjs:22-25`）；核 render-core 缝（本批加）。

### 2.3 受影响文件（现读 → 预期；口径 = `wc -l` 等价 · 2026-10-04 实读）
| 文件 | 现 | 预期增量 |
|---|---|---|
| `thincoder-vscode/src/agent/tool-table.mjs` | 187 | +4（出参） |
| `thincoder-vscode/src/agent/setup.mjs` | 297 | +2~3（**贴 300 顾问线**——逻辑住 `setup-reminders.mjs`） |
| `thincoder-vscode/src/agent/setup-reminders.mjs` | 41 | +~35（提醒函数） |
| `thincoder-vscode/src/extension/panel-mcp.mjs` | 167 | ±1（注释收正） |
| `thincoder-vscode/src/extension/ui-prefs.mjs` | 新 | ~40 |
| `thincoder-vscode/src/extension/chat-panel.mjs` | 441 | +~6（接线） |
| `thincoder-vscode/package.json` | 142 | +~24（三键） |
| `thincoder-vscode/webview/ui.js` | 241 | +~6（四调用点 + autoFollow 门） |
| `thincoder-vscode/webview/ui-prefs.js` | 新 | ~30 |
| `thincoder-vscode/webview/chat-messages.js` | 265 | +~4（`uiPrefs` case） |
| `thincoder-vscode/webview/status-bar.js` | 134 | ±1 |
| `thincoder-vscode/webview/controls.css` | 149 | −11（动画块删） |
| `thincoder-render-core/flow/reasoning.mjs` | 24 | ±1 |
| `thincoder-render-core/flow/block.mjs` | 153 | ±1 |
| `thincoder-render-core/subblocks/activity-view.mjs` | 205 | +~12（缝） |
（实施轮落盘后回填终态读数；**写域按实况扩一档** = `thincoder-render-core/**` 两档——§1 写域句 `thincoder-vscode/**` 按实况扩；无在飞冲突，桌面零消费实读证。）

### 2.4 测试面（normal ∥ boundary ∥ error）
批内件 = `docs/batches/2026-10-04-issue-fix-round3.test.mjs`（单元——随批档留存；集成零新增 · 50–100 预算纪律）。
| 面 | normal | boundary | error |
|---|---|---|---|
| #823 | 携 1 失败 ⇒ 提醒入队（首两段 CLI 逐字） | 同指纹二轮 ⇒ 零重推；恢复后复失败 ⇒ 再推 | 装配抛 ⇒ 非致命零提醒；缺键 ⇒ 零写 |
| #854 | thinking ⇒ 静态段在场 | `_phase=null` ⇒ 段缺席 | — |
| #875a | 旗标真 ⇒ 写 MAX | 旗标假 ⇒ `scrollTop` 零改（工具/错误两径） | — |
| #875b | live 径 `open=false` | 恢复径无 `open`；展开后内容在场 | — |
| #875c | 三键应用（门控/样式/tail） | tailLines=0 ⇒ 零预览；坏值 ⇒ 缺省 | 载荷缺键 ⇒ 缺省零写 |
真机腿 = 父侧走查（上滚阅读 → 工具卡/错误/流式不夺位 → 回底复跟 → Thinking 折叠 → 三开关各翻一次）。

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
- 桌面面零触（推理块默认态 ∥ MCP 提醒——桌面已落；跨端默认差（推理块）= 界面层登记）。
- `.mcp.json` VSC 对齐（#701）∥ MCP 管理面 UI ∥ CLI/核生产面 ∥ `scroll.mjs` 判据 ∥ 面板内新控件——均不做。
- 协议面：仅 `uiPrefs` 一条新消息；既有字段语义零改。
- 不点火评审 ∥ 不跑构建 ∥ 不写实现码（设计轮）。

### 2.8 设计档落点（沿一板块一档惯例——给理由）
- `docs/core/design/MCP.md` §6.4 + 变更记录（#823——消费面机制单源）· `docs/vsc/design/SETTINGS.md` §2.4 + 变更记录（#823 VSC 端事实，沿 #701 先例）· `docs/vsc/design/WEBVIEW.md` §4.9 ∥ §5.8 + 变更记录（#854 ∥ #875）· `docs/vsc/design/WEBVIEW-PROTOCOL.md` §3 ∥ §3.2 + 变更记录（`uiPrefs`）· `docs/render-core/design/RENDER-CORE.md` §5 + 变更记录（#875b/缝）。
- 理由：VSC 设计正本 = 仓根 `docs/vsc/design/`（webview/protocol/settings 分档）＋共享机制单源档（core/MCP.md ∥ render-core/RENDER-CORE.md）；三事各有现档承接 ⇒ **不新建档**（一板块一档；一次性材料 = 本 §2）。**未采** = 批设计独立成档（本批各事均有现档可写——与批·二情形（owning 档在飞）不同）。

### 2.9 上抛项
- **U1**：GitHub #7 诉求 3 列 4 项开关（含「Thinking 默认折叠」），台账行写「三项界面开关」——本批按 3 开关 + Thinking 默认折叠（行为）处置；第 4 项开关化未并（如需 = 加 `thincoder.ui.collapseThinking` 键，径同上）。
- **U2**：#854 条①（最小窗口缩放异常）——待报方复现材料，本批不做（边界在册）。
- **U3**：桌面推理块默认态（自持 `thincoder-desktop/renderer/views/chat-text.mjs:55` open:true）不与 VSC 同并——有意端差（界面层）登记；如需并 = 一行另批。
- **U4**：`panel-mcp.mjs:63-64` 注释残句（发现项）——已入修法④随批收正（低风险）。
- **U5**：写域扩一档（`thincoder-render-core/**` 两档——§1 写域句按实况扩；无在飞冲突）。

### 2.10 机检读数（doc-check · 仓根）
- 域内复跑 = `docs/vsc` ∥ `docs/core` ∥ `docs/render-core`（本批五档域）：读数见交付报告（全绿目标）。
- 全量复跑（`node scripts/doc-check.mjs --root d:\teamcode\thincoder`）：当前红点全数落于**批·二在飞新档** `docs/cli/design/ACP-PROTOCOL-COMPLIANCE.md`（3 处——非本批面；该档头注实读证：建档 = issue 修复批·二 · 设计轮；本批零触）；本批五档域零悬空零超宽（首轮所拦 9 处坐标已逐处收正——拟新增标记 + 仓根相对路径）。

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
## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）
