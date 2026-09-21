# 批次档 · 2026-09-21 · VSC 无工作区守卫（vsc-no-folder-guard）

> 前情 = 无（承台账 **#199** ✗ 用户 2026-09-21 13:34 裁定「**b，但是要给提示**」= 无工作区 ⇒ **拒启 agent** + **明确提示** ✓）。
> 触发：用户 2026-09-21 13:31 出题（微博用户 Jane「活干在 VS Code 安装目录 ✗ 更新清空丢交付物」事件）+ 父侧按码定因（`thincoder-vscode/src/extension/panel-messages.mjs:35`：`_cwd() = _cwdOverride ?? workspaceFolders[0] ?? process.cwd()`——**无文件夹 ⇒ 静默回落 `process.cwd()` = VS Code 安装目录**（快捷方式启动语义）⇒ 会话一切锚在那儿 ⇒ VS Code 原地更新即全清 ✗ 机制与她的实证完全吻合）⇒ 用户裁定 **b**（拒启）+ **要给提示** ✓。
> 授权：**父侧代点火 / 代批准（用户 2026-09-21 12:00「自动跑到完成吧」）** + 范围 = 用户明令「b + 提示」✓；自缚照旧：① 代签仅当「评审 pass（0🔴）∧ 落点逐条核验 ∧ token 已签发」② 代签在 §4 写明授权与依据 ③ 新范围 / 口径裁决 ⇒ 停下不代签 ④ 射程 = 本批收口。
> 六段：§1 讨论（主 agent）· §2 批次任务（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（主 agent）。

## §1 讨论（主 agent）

**状态行**：已收口 2026-09-21

**模块目标（一句话）**：VSC 扩展在**未打开任何工作区文件夹**时**不得在任何目录静默开工**——拒启 agent ✗ 明确提示用户「先打开文件夹」✓。

**功能点（可验收）**

| # | 功能点 | 验收方向 |
|---|---|---|
| ① | **无工作区 ⇒ 拒启**：不建 agent（或等价：一切触达 agent / 写盘 / 发请求的路径被挡在门前）✗ **零写入**（不生成 `PROJECT-MANIFEST.json` ✗ 不建 `.thincoder/` ✗ 不落 session 槽 ✗ 不做 manifest 建档流 ✓） | 无文件夹窗口里操作 ⇒ 零文件系统副作用（对 `process.cwd()` 目录前后快照比对 ✓）|
| ② | **明确提示**：用户可见 ✗ 明示原因（未打开文件夹 ⇒ 工作没有安全的落点）+ 指路（打开一个文件夹）✗ 宜带一键动作（如 `vscode.openFolder` 入口 ✗ 形态由设计定 ✓） | 提示出现在**发起动作的第一现场**（发消息 / 启用面板时 ✓ 不吞 ✓ 不只在日志 ✓）|
| ③ | **可恢复**：稍后打开文件夹 ⇒ 无需重载即可恢复可用（`workspaceFolders` 由空转非空 ⇒ 守卫放行 ✓）| 开窗 → 无文件夹（拒 + 提示）→ 打开文件夹 → 直接可用 ✓ |

**边界（本批不做）**：**不改**「有文件夹」路径的 cwd 语义（`workspaceFolders[0]` 及 override / 多根策略逐字不动 ✗ 零回归）✗ **不动 CLI**（CLI cwd = 终端显式所在 ⇒ 本坑不存在 ✓）✗ 不做「自动搬家 / 自动建档到某目录」（= 替用户选落点 ✗ 用户已裁拒启 ✓）✗ 不改 `_cwd()` 既有回退链的消费面（守卫 = 新增前置面 ✗ 形态由设计定 ✓）✗ 无新需求条目 / 表外档 ✓。

**背景证据（父侧实读 · 定因链）**：`panel-messages.mjs:35`（`_cwd()` 回退链）✗ `docs/vsc/design/PROJECT-SWITCHER.md:25`（规范面同载）✗ `:62`「单根工作区 / **无工作区**：按钮隐藏，**行为不变**」= 现状无护栏 ✓ ✗ `chat-panel.mjs:94-104`（工作区变化 ⇒ 回退 / 销毁点 ✓ 恢复面已有先例可循）✗ 无文件夹时 VS Code 扩展宿主 cwd = 安装目录（快捷方式启动语义 ✗ 用户实证吻合）✓。

**与发布的关系**：本批 = VSC 面 ✗ 随 VSC 发布列车（`0.9.4` 若赶得上 ✗ 赶不上则 `0.9.5` ✗ **发布动作 = 用户门 ✗ 挂起中**）✓。

## §2 批次任务（eng-designer）

> 轮次 = **initial**（本批首设计轮）· 裁定源 = §1（用户 2026-09-21 13:34「b，但是要给提示」）。
> 设计档落点（**本轮已落**）：`docs/vsc/design/PROJECT-SWITCHER.md` §2 / §4 / **§4.1（机制主档）** / §6 · `docs/vsc/design/WEBVIEW-PROTOCOL.md` §3 / §3.2 · `docs/vsc/design/WEBVIEW-INPUT.md` §1 / §7。
> 本设计 = **可抄形**：落点（file:line）/ 提示文案逐字 / 判据 / 受影响表 / 用例表全在册——实施轮逐条落笔，零再设计。

### 2.0 本批覆盖 / 不在本批（承 §1 三功能点）

| 项 | 来源 | 本批处置 |
|---|---|---|
| ① 无工作区 ⇒ 拒启 + 零写入 | §1 功能点 ① | **修**：判据单源 + 守卫面八处（2.1）+ 零写入三档判据（2.4） |
| ② 明确提示 | §1 功能点 ② | **修**：双面提示（2.2——host 通知与 webview 面**逐字**）+ 一键动作 + 频度 |
| ③ 可恢复 | §1 功能点 ③ | **修**：工作区变化处理重构（2.3——含**反方向**转空面） |
| — | §1 边界全段 | 零动作：有文件夹路径（cwd 语义 / override / 多根 / 跟随活动文件）逐字零改 · CLI 零改 · 无自动搬家 / 自动建档 |

**不在本批**：CLI 产品树（`thincoder-cli/**`）· 需求档 / 台账（无新需求条目——守卫 = §1 已裁定「b」形的落地）· `_cwd()` 回落链本身（`panel-messages.mjs:35` 逐字未改）· 运行中回合的中止语义（既有六销毁点不变）· 面板设置面（无工作区窗口仍可用——用户级面，见 2.5）· webview 常驻横幅（被否，见 2.5）。

### 2.1 守卫点定位（① —— 判据单源 + 守卫面八处）

**判据（单源）**：`hasWorkspaceFolder()` = `(vscode.workspace.workspaceFolders?.length ?? 0) > 0`——落点 = **新档** `thincoder-vscode/src/extension/workspace-guard.mjs`（~45 行：判据 + 提示（逐字常量 + 去重）+ 状态推送三件；leaf 档——只 import `vscode`，无环）。
**守卫调用形（逐字）**：`if (blockOnNoWorkspace(panel)) return`——被挡 = 提示 + 早退。

| # | 守卫点（as-of 2026-09-21 实读） | 覆盖 | 拒法 |
|---|---|---|---|
| ① | `ChatPanel.resolveWebviewView`（`src/extension/chat-panel.mjs:116`） | 面板启用 | 主动提示（每空窗**恰一次**，`panel._wsGuardNotified`） |
| ② | `routeUserTurn`（`src/extension/panel-messages.mjs:100`） | webview 发消息 / retry——**先于** `savePastedImages`（`:122-124`）⇒ 图片不落 `<cwd>/.thincoder/tmp/` | 提示 + return |
| ③ | `ChatPanel.sendMessage`（`chat-panel.mjs:219`） | 命令面（`thincoder.sendMessage` / `askSelection`）——**先于**回显（`:235`）⇒ 无假气泡 | 提示 + return |
| ④ | `runPanelChatImpl`（`src/extension/panel-chat.mjs:88`） | **兜底红线**：一切回合路径（user / auto / digest / 挂起内回合）⇒ 不建 agent（manifest 建档钩子 `src/agent/setup.mjs:336-342` 不可达） | 提示 + return（**先于** `panel._publishTurnState("running")`，即 `:118` 之前） |
| ⑤ | `openSessionContent`（`src/extension/panel-session.mjs:252`） | 面板 boot（webviewReady 快段）：槽认领 + 会话装载 | 跳过 + 推 `workspaceGuard` 态 |
| ⑥ | `ensureSlotAsync`（`panel-session.mjs:42`） | 认领原语（冷路径 / `ensureSlot` 后台认领 `:63-70`）⇒ 不落 session 槽 | 返 `null`（不认领不写） |
| ⑦ | 会话族 handler 五处（`src/extension/panel-messages-session.mjs:22/30/61/67/82`） | newSession / switchSession / deleteSession / renameSession / setProject（槽写 / manifest active 写） | 提示 + return |
| ⑧ | 索引面：`buildIndex`（`src/extension/panel-index.mjs:141`）+ `maybePromptIndex`（`:121`；调用点 `panel-session.mjs:293` 跳发） | 免把用户引向「以安装目录为项目」的建档流 | 提示 + return / 邀请零发 |

**派生面（无需守卫 · 如实登记）**：守卫态下 `panel._slot` 恒 null（⑤⑥ 阻断认领，解析缓存无条目）⇒ 槽写面 `setSlot*` 天然返 false（`panel-session.mjs:57-61` 记载）；`pushSessions`（`panel-session.mjs:217`）加同判据守卫——不把安装目录家族的会话列表推给面板（否则会话行可点 ⇒ 绕过 ⑦）。
**`atComplete`（@ 补全）链 = 不入守卫面（评审轮 1 发现 8 判定）**：**只读、零落盘**——扫描根 = `vscode.workspace.findFiles`（工作区级 API——`panel-index.mjs:65-69`，非 `_cwd()` 的 fs 遍历），`_cwd()` 在该链仅作 `path.relative` 显示基（`:63` / `:74`）；整链无写调用（`:56-84` 逐行实读）⇒ 不加守卫。判定单源 = `PROJECT-SWITCHER.md` §4.1（派生面登记）。

**覆盖论证（对 §1 三功能点）**：面板启用 = ①；发消息 = ②（webview 路径）+ ③（命令路径）；「任何触 agent 路径」= ④（兜底——未来新增回合入口只要走 `runPanelChat` 即被覆盖）；会话 / 槽写 = ⑤⑥⑦；写盘 / 引导 = ②（图片）+ ④（agent 工具）+ ⑧（索引）。**恢复面** = 工作区变化处理（2.3）。

**兜底红线机判（结构 + 行为两锁）**：结构锁 = `runPanelChatImpl` 函数体首条语句为守卫早退（任何 await / `_publishTurnState` 之前）；行为锁 = 守卫态下驱动真 `runPanelChat` ⇒ `_turnState` 恒 `idle` ∧ `panel._agent === null`。

### 2.2 提示面（② —— 逐字文案 + 一键动作 + 频度）

**host 通知**（英文硬编码——随本端通知面现状：`chat-panel.mjs:228` / `panel-session.mjs:189` busy 串同形）：

- 文本（**逐字**）：`ThinCoder: no folder is open — the agent has no workspace to work in. Open a folder to start.`
- 按钮（**逐字**）：`Open Folder` ⇒ `vscode.commands.executeCommand("vscode.openFolder")`（VS Code 内置命令；**无参 ⇒ 原生文件夹选择框**；同窗口 ⇒ VS Code 自行重载窗口——扩展宿主重启、新根正常 boot）。
- **行为句核验标注（评审轮 1 发现 11）**：「无参 ⇒ 选择框 / 同窗口 ⇒ 重载」= **未验**（实机行为待用户侧观察）——本批可核代替面 = **调用形断言**（调用发生 ∧ 命令名逐字 ∧ 无参——用例 17）；判定同标 = `PROJECT-SWITCHER.md` §4.1。

**webview 面**（i18n 键；`locales/{en,zh}.json` 各 +2）：

| 键 | en（逐字） | zh（逐字） | 落点 |
|---|---|---|---|
| `workspace.required` | `Open a folder first — ThinCoder needs a workspace to work in.` | `请先打开文件夹——ThinCoder 需要一个工作区才能开工。` | `send.js` 拒发 toast |
| `workspace.requiredPlaceholder` | `Open a folder to start…` | `请先打开文件夹…` | `loading.js` `applyBusyLock` 第三态 |

- **键登记（评审轮 1 发现 4）**：两键同轮登记 `WEBVIEW-PROTOCOL.md` §6.3 键表（**17 → 19 键**——端特有键）；本表 = 实施轮抄形面，文案实体 = `locales/{zh,en}.json`。

- **出口守卫**：`webview/send.js` 判 `S._workspaceRequired` ⇒ `showToast(t("workspace.required"))` + 拒发，**先于** `addUser` / `setLoading`（`:36-41`）——无假气泡、无悬挂 loading（先例形态 = 同档 busy 拒发 `:19-25`）。
- **状态消息**：`{ type:"workspaceGuard", active:boolean }`（host → webview；推送点 = ⑤ 两分支 + 工作区变化处理；webview 单点 = `chat.js` 新 case ⇒ `S._workspaceRequired` ⇒ `applyBusyLock()`）。
- **首现场对应**：发消息 = webview toast（输入框处）+ 占位符；启用面板 = host 通知（①）；命令面 = host 通知（③）。**不吞**：三路都有可见面，无一路只进日志。
- **频度（不吵 / 不吞）**：主动提示 = 每空窗**恰一次**（`panel._wsGuardNotified`，守卫释放即复位）；被动提示 = **每次被挡的用户动作各一次**。

### 2.3 恢复面（③ —— 空 ↔ 非空，无需重载；第三支路逐字保留）

`chat-panel.mjs:96-104` 工作区变化处理**重构**（空 ↔ 非空两向覆盖 + 第三支路保留）：

- **转空**（非空 → 空）：清 override + `_agent = null` + 推 `workspaceGuard{active:true}` + 主动提示——**不再走 `_onProjectChanged`**（旧路径会把 cwd 绑到 `process.cwd()` 并落槽 = 直接违背功能点 ①「不落 session 槽」）。
- **转为非空且此前守卫**：`_wsGuardNotified` 复位 + 推 `workspaceGuard{active:false}` + `await openSessionContent(panel)`（认领 + 装载）⇒ 面板直接可用（后续回合走既有权）。
- **非空 → 非空（第三支路「逐字保留既有回退链」——评审轮 1 发现 2）**：override 失效校验与回落零改——① 被 override 的根仍在 `workspaceFolders`（含移除非 override 根 / 新增根）⇒ 现状早退，零动作（`chat-panel.mjs:99`）；② 被 override 的根被移出 ⇒ `clearProjectOverride()` + `_agent = null` + `_onProjectChanged()`（现状 `:100-103`——防 agent 指向死目录）。重构只动空 ↔ 非空两向，本支路不碰（与 2.5 边界「多根 / override 逐字零改」同口径）。
- **一键动作路径**：`vscode.openFolder`（同窗口）= VS Code 自行重载窗口——非本机制的重载（**未验**——同 `:74` 标注；可核代替面 = 用例 17 调用形断言）；本机制保证的是**拖入 / Add Folder 等同窗口路径**免重载恢复。
- 判据（可跑）：2.6 用例 9 / 10（空 ↔ 非空）+ 用例 14（第三支路回归锁）。

### 2.4 零写入判据（① —— 可核形 · 三档合并）

| 档 | 判据（机检形） | 对应 §1 面 |
|---|---|---|
| A · cwd 快照 | 无文件夹窗口内操作（发消息带图 / 面板 boot / 命令发送）⇒ 对 `process.cwd()` 目录差异快照零新增（`.thincoder/` 子目录零新增文件） | §1 验收方向原文 |
| B · 会话槽 | `_setSessionsDirForTest(tmp)` 沙箱下，上述操作后该 cwd 会话家族（`sessions/<sha1(cwd)>*`）零文件 ∧ `panel._slot` 恒 null | §1「不落 session 槽」 |
| C · agent / manifest | `panel._agent === null` ∧ `runPanelChat` 恒早退（`_turnState` 恒 idle）⇒ `runAgent` → `agent/setup.mjs:336-342` 钩子不可达 ⇒ `PROJECT-MANIFEST.json` 零建（工程模式同——不可达即零 I/O） | §1「不建 agent / 不做建档流」 |

（三档 = §1「二选一或合并」的**合并形**；先红读数逐例见 2.6。**射程外明示**：用户级面 `~/.thincoder/config.json` 迁移（`panel-session.mjs:270`）/ 记忆库句柄 / 台账读不属本守卫——非 cwd 落点，且面板设置须在无工作区窗口保持可用。）

### 2.5 边界 + 决策记录（含被否形）

**边界（写明防误改）**：① 运行中回合**不因守卫中止**（既有销毁点语义不变——守卫只挡新活；转空时 `_agent = null` = 既有行为）；② `_cwd()` 回退链 / `setProjectFolder` 校验 / 多根策略 / 跟随活动文件逐字未改；③ CLI 零改（`thincoder-cli/**`；核也零改）；④ 设置面（settings 消息族）保持可用——用户可先配 key 再开文件夹；⑤ 不做面板内常驻横幅；⑥ 不新增 `package.json` 项 / 命令 / 配置项（`.vsix` 打包面零增：新档在 `src/` 内、入包规则不变——`.vscodeignore` 未排除 `src/**`）。

**决策记录（逐条 + 被否形）**：

| # | 决策 | 被否形（理由） |
|---|---|---|
| D1 | 判据 = `workspaceFolders` 非空（用户可见面同源） | 否「`cwd ∈ folders`」等价形（值同但口径绕）；否「`_cwd()` 返 null」（波及 11 档全部消费面） |
| D2 | 守卫 = 前置门（不改回退链） | 否改 `_cwd()` / 改各消费点 |
| D3 | 提示 = host 通知 + webview toast / 占位符双面 | 否面板内常驻横幅（扩面——webview 结构 / CSS 面）；否仅日志 / 控制台（违「不吞」） |
| D4 | 守卫态 Send 按钮**保持可见**（点击即提示） | 否照搬 C-14「running 期隐藏」——守卫态 = 用户**可自解**态，保留可发现入口；被否形 = 隐藏（用户失去发现路径） |
| D5 | 一键动作 = `vscode.openFolder`（内置） | 否自建 QuickPick 目录选择 / 自选落点（= 替用户选落点） |
| D6 | 恢复 = 扩展工作区变化处理 | 否要求用户手动重载窗口；否轮询 |
| D7 | 守卫 = 拒启 + 提示（用户裁定「b」） | 否「静默锚定」（现状——丢交付物实证）；否「自动搬家 / 自动建档他处」 |
| D8 | 主动提示随面板启用即发（扩展激活会拉起侧栏 ⇒ 无文件夹窗口启动时亦可能见一次） | **备选形态（未决，见 2.8 上抛）**：仅在被挡动作时提示（嫌启动噪音时的单行改法） |

### 2.6 用例面 delta（normal / boundary / error + 先红读数）

**新档** `thincoder-vscode/test/workspace-guard.test.mjs`（登记 `test/files.mjs`——不登记则 `run.mjs` 反查失败）+ `test/vscode-mock/index.mjs` 默认值改动。手法沿既有：真实 ChatPanel 原型 + 真实模块链路 + `_setSessionsDirForTest` / `_setConfigPathForTest` 沙箱；守卫态显式置 `vscode.workspace.workspaceFolders = []`（存 / 还原，先例 = `image-downgrade.test.mjs:30-38`）。

| # | 类 | 用例（真入口） | 期望 | 先红读数 |
|---|---|---|---|---|
| 1 | ① | 无文件夹 · 发消息带图：`handlePanelMessage(panel,{type:"userMessage",text:"hi",images:[DATAURL]})` | host 通知逐字命中 ∧ `panel._chat` 零调 ∧ `process.cwd()/.thincoder/tmp` 零新增 | `_chat` 被调 + paste 图落盘 |
| 2 | ① | 无文件夹 · 命令面：`panel.sendMessage("hi")` | 守卫拒 ∧ webview 零 `userMessage` 回显（无假气泡） | 回显 + `_chat` |
| 3 | ① | 无文件夹 · retry 消息 | 同拒（② 同入口） | `_chat` |
| 4 | ① | 无文件夹 · 回合兜底：真 `runPanelChat(panel,{text})` | 恒早退：`_turnState === "idle"` ∧ `_agent === null` ∧ 零 `turn:start`（载体 = **内部日志事件名** `logEvent("turn:start", …)`——`panel-chat.mjs:243`；**非协议消息**（不入 §12/§13 判别式集）；断言形 = `THINCODER_LOG_DIR` 隔离目录读行——先例 `async-parity.test.mjs:48-59`） | 回合启动（进 `ensureSlot`） |
| 5 | ① | 无文件夹 · boot：`openSessionContent(panel)` | 零认领（会话家族零文件 ∧ `_slot === null`）∧ webview 收到 `{type:"workspaceGuard",active:true}` | 槽文件落盘 + 零守卫消息 |
| 6 | ① | 无文件夹 · 认领原语：`await ensureSlotAsync(panel)` | `null` ∧ 零写 | 认领落盘 |
| 7 | ① | 无文件夹 · 会话族五 handler（newSession / switchSession / deleteSession / renameSession / setProject） | 各拒 ∧ 会话目录零变化 | `newSlot` 落槽 |
| 8 | ① | 无文件夹 · 索引面：`status()`（慢段）+ `buildIndex` | 邀请零发（`showInformationMessage` 零调）∧ `buildIndex` 拒 | 邀请弹出 |
| 9 | ③ | 空 → 非空：置 `workspaceFolders=[{uri:{fsPath:tmp}}]` + 触发变化处理 | `workspaceGuard{active:false}` + boot 跑（槽绑定 + `historyPage`/`sessions` 投递）+ 随后 userMessage 放行（进 `_chat`） | 无状态翻转 / 无 boot |
| 10 | ③ | 非空 → 空（反方向） | `workspaceGuard{active:true}` ∧ **不调 `_onProjectChanged`**（不绑 `process.cwd()`）∧ 主动提示一次 | 旧逻辑回落绑槽 |
| 11 | ② | 频度：①连续两次面板启用 → 恰 1 条；②释放后再入空窗 → 再 1 条；③被挡动作 2 次 → 2 条 | 三断言 | 每次弹（无去重）/ 静默 |
| 12 | 零回归 | 有文件夹（mock 默认单根） | `hasWorkspaceFolder() === true` ∧ `_cwd()` 逐字 = `process.cwd()`（值不变）∧ 真 `runPanelChat` 进既有权（首关放行） | 锁形（防守卫误挡） |
| 13 | 结构锁 | 扫 `src/extension/**` 的 `workspaceFolders` 读点 | = 守卫模块定义 1 处 + 既有 `setProjectFolder` 校验 + 跟随活动文件（零新增旁路） | 锁形 |
| 14 | ③ | **第三支路回归**（评审轮 1 发现 2）：多根 A+B、override = B ⇒ 移出 B 后触发变化处理 | `clearProjectOverride` 生效（`_cwd()` 回落 A）∧ `_agent === null` ∧ `_onProjectChanged` 跑（槽重绑 A）；另：移除非 override 根 ⇒ 零动作 | 重构吃掉该支路（override 残留 / 回落缺失） |
| 15 | ② | webview 出口守卫：真 `chat.js` 驱动 `workspaceGuard{active:true}` → `send()`（有文本） | 零 `userMessage` 上行 ∧ `#paste-toast` 逐字命中（`workspace.required`）∧ 文本保留 ∧ 零假气泡（`.msg` 计数不变）∧ `S._phase === null`（无悬挂 loading） | 无守卫 ⇒ 上行 + 气泡 |
| 16 | ② | `applyBusyLock` 第三态优先级（**守卫 > busy > 常态**） | 守卫置位（即使 `running`）⇒ `workspace.requiredPlaceholder`；守卫释放 ∧ `running` ⇒ busy 占位符；两者皆假 ⇒ 常态占位符 | 无第三态 ⇒ running 仍 busy 串（守卫键不可达） |
| 17 | ② | 一键动作（③ 命令面路径驱动——真 `workspace-guard.mjs` 守卫）：stub `showWarningMessage` 依次回 `Open Folder` / `undefined` | ① 通知文本逐字 ∧ 按钮 = `Open Folder`；② 回按钮 ⇒ `executeCommand` 恰一次、命令名逐字 `vscode.openFolder`、**无参**；③ 回 `undefined`（用户关闭）⇒ 零 `executeCommand` | 无按钮动作 ⇒ 零调用 |

**手法注（新增 14–17）**：14 = 宿主侧——用例内 patch `vscode.workspace.onDidChangeWorkspaceFolders` 捕获监听器后手动触发（save → patch → restore 惯例——先例 `chat-panel-messages.test.mjs:64-84`；捕获探针零增——mock 默认值仍按 §2.6 翻转）；15–16 = webview 侧 happy-dom（同档混编先例 = `async-visibility.test.mjs`「两组手法同文件」；真 `chat.js` + 全量 id 夹具）；17 = 宿主面（③ 命令面驱动 + 真 `workspace-guard.mjs` 守卫）；15–17 均以用例内 patch（`vscode.window.showWarningMessage` / `vscode.commands.executeCommand` / `vscode.window.showInformationMessage`）驱动。

**既有套件面（判定，写明防误改）**：`test/vscode-mock/index.mjs:10` 默认 `workspaceFolders: []` → 单根 `[{ uri: { fsPath: process.cwd() } }]`——**零改动语义**：`_cwd()` 求值恒等（`process.cwd()`，测试零 `chdir`）⇒ 既有断言零红；守卫态用例显式置空。改默认是**必须项**：否则 `chat-panel.test.mjs` / `session-boot.test.mjs` / `agent-lifecycle-singleton.test.mjs` 等驱动回合与 boot 的套件会因守卫变红。

**mock 增量口径（评审轮 1 发现 3）**：三探针 `showWarningMessage` / `showInformationMessage` / `commands.executeCommand` **均不在册**（现状 = no-op 默认、零调用记录——`test/vscode-mock/index.mjs:78/79/119`），且**不需要在册**：本批三处断言（通知逐字 / 邀请零发 / 一键动作）一律走**用例内 patch**（save → patch → restore——先例 `chat-panel-messages.test.mjs:64-84` · `memory-index-face.test.mjs:180-187`）⇒ mock 增量维持 **±1**（仅默认单根翻转）。
**变化处理触发手法**：mock 的 `onDidChangeWorkspaceFolders` 现为吞掉式默认（同上档 `:17`）——用例内 patch 为**捕获监听器**再手动触发（同惯例；捕获探针零增——mock 默认值仍按 §2.6 翻转），用例 9 / 10 / 14 皆经此驱动。

### 2.7 受影响文件表（行数 = as-of 2026-09-21 设计轮实读）

| # | 文件 | 现 | 预期 Δ | 改动 |
|---|---|---|---|---|
| 1 | `thincoder-vscode/src/extension/workspace-guard.mjs` | 新建 | ~45 | 判据 + 提示（逐字常量 / 去重）+ 状态推送 |
| 2 | `src/extension/chat-panel.mjs` | 456 | +≈22/−4 | ① 面板启用提示；③ `sendMessage` 守卫；工作区变化处理重构（2.3 两方向） |
| 3 | `src/extension/panel-messages.mjs` | 300 | +3 | ② `routeUserTurn`（先于 `savePastedImages`） |
| 4 | `src/extension/panel-chat.mjs` | 254 | +3 | ④ 兜底红线 |
| 5 | `src/extension/panel-session.mjs` | 299 | +8 | ⑤ `openSessionContent`；⑥ `ensureSlotAsync`；`pushSessions` 守卫；⑧ `status()` 跳邀请 |
| 6 | `src/extension/panel-messages-session.mjs` | 94 | +6 | ⑦ 五 handler 守卫 |
| 7 | `src/extension/panel-index.mjs` | 235 | +3 | ⑧ `buildIndex` 守卫 |
| 8 | `webview/send.js` | 57 | +6 | 出口守卫（先于 `addUser`/`setLoading`） |
| 9 | `webview/chat.js` | 449 | +2 | `case "workspaceGuard"` |
| 10 | `webview/loading.js` | 93 | +1 | `applyBusyLock` 第三态 |
| 11 | `webview/state.js` | 119 | +1 | `S._workspaceRequired` |
| 12 | `locales/en.json` | 265 | +2 | 两键（en 逐字） |
| 13 | `locales/zh.json` | 265 | +2 | 两键（zh 逐字） |
| 14 | `test/workspace-guard.test.mjs` | 新建 | ~230 | 2.6 用例 1–17（宿主组 1–14 + webview 组 15–17 同档混编——先例 `async-visibility.test.mjs`） |
| 15 | `test/files.mjs` | 126 | +1 | 登记行 |
| 16 | `test/vscode-mock/index.mjs` | 191 | ±1（**探针零增**——见 2.6 mock 口径） | 默认单根（见 2.6 判定） |
| 17 | `docs/vsc/design/PROJECT-SWITCHER.md` | 92 → 141 → **145** | **已落**（含评审轮 1 修正） | §2 指针 / §4 收正 / §4.1 机制 / §6 U-P6–U-P9 / 变更记录；修正轮 = 第三支路 + `atComplete` 判定 + 未验标注 |
| 18 | `docs/vsc/design/WEBVIEW-PROTOCOL.md` | 552 → 555 → **560** | **已落**（含评审轮 1 修正） | §3 行 + §3.2 行 15（14→15 项）+ 变更记录；修正轮 = §6.3 19 键 + D-P11 十五项 |
| 19 | `docs/vsc/design/WEBVIEW-INPUT.md` | 151 → 154 → **155** | **已落**（含评审轮 1 修正） | §1 C-B2-5 + 零改面行收正 + §7 U-I7 + 变更记录；修正轮 = 零改面行纯现状化 |
| — | `extension.mjs` · `src/agent/**` · `settings.mjs` / `panel-messages-settings.mjs` · `webview/input.js` / `ui.js` / `toast.js` · `thincoder-cli/**` · `thincoder-core/**` | — | **零改**（判定） | 命令注册 / manifest 钩子就位即被挡 · 设置面保持可用 · 标尺面 |

**跨文件限**（口径 = `wc -l`；>300 咨询线 / ≤500 硬限——档位结论按 `VSC-DEBT.md` §12.1 登记口径；**边界注（评审轮 2 发现 5）**：与 §2.10 的行数口径差 ≤1 行（尾空行计法）——边界档 `panel-messages.mjs` = 300/301 两读皆判越线，档位结论不受口径影响）：

- 新增两档 ≤300：`workspace-guard.mjs` ~45 · 测试档 ~230。
- `chat-panel.mjs` **456 +≈22/−4 ⇒ 净 ≈474**（>300 存量续越、<500 硬限；增量构成 = ①③ 两处守卫 + 工作区变化处理重构（含第三支路逐字保留）——**无拆分义务**；触发 = 下次实质触碰）。
- `panel-messages.mjs` **300 +3 ⇒ ≈303**（本批**首次**越 >300 咨询线；增量构成 = ② 守卫一处（守 + 复提示常量）——咨询线非判据线 ⇒ **无拆分义务**；触发 = 下次实质触碰）。
- `panel-session.mjs` **299 +8 ⇒ ≈307**（本批**首次**越 >300 咨询线；增量构成 = ⑤⑥ 两处守卫 + `pushSessions` 同判据 + ⑧ 邀请跳发——**无拆分义务**；触发 = 下次实质触碰）。
- `webview/chat.js` **449 +2 ⇒ 451**（存量越线在册（SIGNAL-LINES 批——`VSC-DEBT.md` §12.1）；增量构成 = `case "workspaceGuard"` 一处——**无拆分义务**；触发 = 下次实质触碰）。
- 其余各档 <310。

**实现轮文档义务（本设计轮已备、实现轮落位）**：`WEBVIEW-PROTOCOL.md` §12 补 `workspaceGuard` 行（两表只收实测在位行——实现后补；`protocol-coverage.test.mjs` / `-reverse` 双向对账随之为绿）+ §3.2 行 15 去「拟新增」标记；§17–19 与 §2.9 的文档面**已落**（实施轮零碰）。

### 2.8 与 §1 的不一致处 / 勘正 / 上抛

| # | 项 | 处置 |
|---|---|---|
| 1 | §1 边界句「不改 `_cwd()` 既有回退链的消费面」 vs 本设计**同时**改「工作区变化处理」既有行为（转空不再走 `_onProjectChanged`） | **勘正（非扩面）**：旧路径把 cwd 绑到 `process.cwd()` 并落槽 = 直接违背功能点 ①「不落 session 槽」——守卫必经；已在 §4.1 恢复面写明 |
| 2 | §1 功能点 ① 内「不落 session 槽」 vs 验收方向行「`process.cwd()` 前后快照」射程不同（槽在 `~/.thincoder/sessions`，不在快照内） | **补判据**：2.4 三档合并（A cwd 快照 + B 会话槽沙箱 + C agent/manifest） |
| 3 | §1 引 `_cwd()` = `_cwdOverride ?? workspaceFolders[0] ?? process.cwd()`（简写） | **勘正（等价）**：实读 `panel-messages.mjs:35` = `_cwdOverride ?? (workspaceFolders?.[0]?.uri?.fsPath || process.cwd())`——语义等价，as-of 行号相符 |
| 4 | **上抛 1（可选 · 用户一行）**：主动提示随面板启用即发——扩展激活会拉起侧栏 ⇒ 无文件夹窗口每次 VS Code 启动可能见一次通知 | 本设计按 §1「启用面板时提示」保留（D8）；嫌启动噪音 ⇒ 备选形态 = 仅在被挡动作时提示（单行改法，2.5 D8 备选）；**不阻塞实施** |
| 5 | 观察（非本批射程）：`WEBVIEW-PROTOCOL.md` §3.2 标题「十四项」与行 1–14 相符，但变更记录末条称「十三项计数零变」（render-granularity 批）——疑似缺行 14 的登记行 | 本批只加行 15 + 计数同改（14→15），未动历史行；如实上报 |
| 6 | 观察（非本批射程）：`test/fixtures/vscode-mock.mjs`（`workspaceFolders: null`）与 `test/vscode-mock/index.mjs`（npm `file:` 链接实体）并存 | 本批只改后者（前者疑似残留；是否死档未验——不属本批） |

### 2.9 台账 + 发布关联

- **台账**：§1 载「承台账 **#199**」→ 本批承载（在途；状态由主 agent 维护，本席不写台账）。
- **发布关联（VSC 发布列车）**：本批 = VSC 面（`thincoder-vscode/**`）⇒ 随 VSC 发布列车（`0.9.4` 赶得上 / 否则 `0.9.5`）——**发布动作 = 用户门（§1 载明，挂起中）**。版本号 / `package.json` / `CHANGELOG.md` 本批**零改**（发布批统一处理）；命令 / 配置项 / 贡献点零增 ⇒ `.vsix` 打包面无新增项（新档落在 `src/**`，`.vscodeignore` 未排除该域）。

### 2.10 机检与读数收正（as-of 本设计轮末）

**行数实测**（口径 = `readFileSync(utf8).split("\n").length`）：

| 档 | 2.7 表列（read 工具显示口径） | 现行实读 |
|---|---|---|
| `docs/vsc/design/PROJECT-SWITCHER.md` | 92 → 141 | **141** |
| `docs/vsc/design/WEBVIEW-PROTOCOL.md` | 552 → 555 | **555** |
| `docs/vsc/design/WEBVIEW-INPUT.md` | 151 → 154 | **154** |

（两口径差 ≤1 行的尾空行计法——非内容差；实施轮请按同一口径复读。）

**doc-check 读数**：`node scripts/doc-check.mjs --root .` → **悬空 3 / 行宽 3 = 基线同三条**（`AGENT-LOOP-SUBAGENT.md:2047/2065/2066` · `:2091` · `BATCH-RECORD.md:358/365`，全在未触碰档）——**本批触碰四档零新增**。
首稿曾引入 4 条闸内发现，已逐条收正（记录）：
① `PROJECT-SWITCHER.md:71` 悬空（新档尚未落盘）⇒ 补「（拟新增」行标记（列报 · 不入闸——同先例 `SETTINGS.md:376`）；
② `PROJECT-SWITCHER.md:80` 悬空（`setup.mjs` = 重名档短形多解——同先例登记：重名档须全限定路径）⇒ 改 `thincoder-vscode/src/agent/setup.mjs:336-342`；
③④ `PROJECT-SWITCHER.md:91`（313 字符）/ `:96`（320 字符）行宽 ⇒ 各拆两段（<300 字符）。

**未落面（明示）**：产品码 / 测试码 / `locales/**` / `test/vscode-mock/index.mjs` 本设计轮**零碰**（实施轮笔域——本席只落设计档三处 + 本记录）。

### 2.11 评审轮 1 修正（10 项逐条 · 2026-09-21）

> 依据 = 本档 §3 轮次 1（🔴 0 · 🟡 6 · 🔵 6；VERDICT: pass）；`Suggestion` 列 = 评审建议，处置执行 = 本席。本轮 = **fix（点改）**——只收 #1–#8 / #11 / #12 十条；#9（mock 默认翻转的全量复跑）归实现轮（coder 任务书）、#10（§1 边界句闭环）归 §4 代签轮。**零新语义**：只收窄措辞 / 补判定 / 补用例口径 / 计数同改。

- **#1**：§2.7 跨文件限段（`:183-190`）补三档**档位结论**——`panel-messages.mjs` 300→≈303、`panel-session.mjs` 299→≈307（**本批首次越** >300 咨询线）、`webview/chat.js` 449→451（存量越线）：各写增量构成 +「**无拆分义务**」+ 触发 = 下次实质触碰（登记口径 = `VSC-DEBT.md` §12.1）。
- **#2**：§2.3（`:90-98`）补**第三支路**（非空 → 非空 = override 失效校验与回落**逐字保留**——`chat-panel.mjs:99` / `:100-103`）；§2.6 增**用例 14**（回归锁）；`PROJECT-SWITCHER.md` §4.1 恢复面同步（`:99-104`）。
- **#3**：§2.6 增**用例 15–17**（webview 出口守卫（toast / 拒发 / 无假气泡）/ `applyBusyLock` 第三态优先级（守卫 > busy > 常态）/ 一键动作调用形断言）+ **手法注**（`:151`）+ **mock 增量口径**（`:155-156`：三探针 `showWarningMessage` / `showInformationMessage` / `commands.executeCommand` **不在册且不需在册**——用例内 patch 惯例（`chat-panel-messages.test.mjs:64-84`）；增量维持 **±1**）；受影响表行 14 / 16 同步（`:175` / `:177`）。三处**均可测 ⇒ 零 N-W5 例外登记**。
- **#4**：两键同轮登记 `WEBVIEW-PROTOCOL.md` §6.3（`:238` 计数 **17 → 19**；`:262-263` 两行；`:272` 登记注）——**取 (a) 形**（历轮惯例：加键批同轮登记）；`PROJECT-SWITCHER.md` §4.1 提示面补登记指向（`:94`）。
- **#5**：`WEBVIEW-PROTOCOL.md` D-P11（`:291`）计数 **十四项 → 十五项**（与 §3.2 标题 `:78` 同轮对齐）。
- **#6**：`PROJECT-SWITCHER.md:63` 删修订式括注（历史已在变更记录）；`WEBVIEW-INPUT.md:22` 改**纯现状表述**（去「自 2026-09-21…起」）。
- **#7**：§2.7 跨文件限算式统一口径（`:186`）：`chat-panel.mjs` 456 **+≈22/−4 ⇒ 净 ≈474**（原「456+22 ≈ 478」与 Δ 列两口径并存）。
- **#8**：`PROJECT-SWITCHER.md:32` 收窄（「不再被**任何**工作入口消费」→「不再被**守卫面八个工作入口**消费」）；§4.1 派生面补 **`atComplete` 链判定**（`:87`：**只读、零落盘**——扫描根 = `vscode.workspace.findFiles`（工作区级 API，非 `_cwd()` fs 遍历），`_cwd()` 仅作 `path.relative` 显示基（`panel-index.mjs:63` / `:74`）；整链零写调用（`:56-84` 逐行实读）⇒ **不加守卫**）；本档 §2.1 派生面同步（`:62`）。取 (b) 形（收窄 + 明示），不引 ⑨ 号守卫。
- **#11**：`vscode.openFolder` 行为句标**未验**（实机行为待用户侧观察）+ 写明替代核验（调用形 / 参数断言 = 用例 17）：本档 §2.2（`:74`）、`PROJECT-SWITCHER.md` §4.1 提示面（`:91-92`）/ 恢复面（`:104`）/ U-P7（`:136`）。
- **#12**：§2.6 用例 4（`:136`）点名「零 `turn:start`」载体 = **内部日志事件名**（`logEvent("turn:start", …)`——`panel-chat.mjs:243`）——**非协议消息**（不入 §12/§13 判别式集）；断言形 = `THINCODER_LOG_DIR` 隔离目录读行（先例 `async-parity.test.mjs:48-59`）。

- **附（本席自查 · 一致性面 · 逐条上报）**：§2 首部失效占位行「（待设计。）」已删（设计正文早在其后落笔；失效表达不留规范面）；§2.11 本块内坐标已按全部落笔后复读重校（`:183-190` / `:90-98` / `:151` / `:155-156` / `:175-177` / `:62` / `:74` / `:136`）。

**未决 / 射程外（登记）**：① 评审射程外注记（需求面 `requirements/WEBVIEW.md:24` F-W5 边界句 vs 本批「无新需求条目」）= 父侧裁定——仅登记，未动；② §2.8 上抛 1（主动提示随启用即发——可选 · 用户一行）仍挂起；③ §2.8 #5 / #6 两条观察仍在册（非本批射程）。

**自检（本修正轮末）**：`node scripts/doc-check.mjs --root .` ⇒ **悬空 3 / 行宽 3 = 基线三条**（全在未触碰档）——本批触碰四档零新增（首跑曾引入 2 条超宽行：`PROJECT-SWITCHER.md:91` / `WEBVIEW-PROTOCOL.md:272`，已拆段收正）；三向一致复核 = §1 三功能点 / §2 边界 / 设计档 §4.1 无第四语义（新增面 = 判定与用例口径；零新函数 / 新消息 / 新键以外语义）。
**行数复读（修正轮末 · 口径 = `readFileSync(utf8).split("\n").length`，同 §2.10）**：`PROJECT-SWITCHER.md` **145** · `WEBVIEW-PROTOCOL.md` **560** · `WEBVIEW-INPUT.md` **155**；§2.7 行 17–19 已同步（§2.10 表 = 设计轮时点读数，保留）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审对象**：vsc-no-folder-guard 批设计（批次档 §2 + `docs/vsc/design/PROJECT-SWITCHER.md` §4.1 + `docs/vsc/design/WEBVIEW-INPUT.md` C-B2-5/U-I7 + `docs/vsc/design/WEBVIEW-PROTOCOL.md` §3/§3.2 行 15）——四档全读。评审类型 = 设计评审（无代码变更）。

**读数 spot-check（本席自跑，仅行数、未评审源码内容）**：`PROJECT-SWITCHER.md` 141 · `WEBVIEW-PROTOCOL.md` 555 · `WEBVIEW-INPUT.md` 154（与批次档 §2.10 实读一致）；受影表源 / 测试档抽验 6 档逐档相符（`chat-panel.mjs` 456 · `panel-messages.mjs` 300 · `panel-session.mjs` 299 · `panel-chat.mjs` 254 · `webview/chat.js` 449 · `test/vscode-mock/index.mjs` 191）。

**受限声明**：未声明项目标准档、无 Document Map ⇒ 归属判据退化为 AGENTS.md + 在册 D2 / 单源惯例；下文行 4 / 5 / 6 即于此口径下的结论。

| # | 类别 | 严重度 | 问题 | 建议 |
|---|---|---|---|---|
| 1 | Criterion 8（体量档） | 🟡 | 受影表两档本轮**首次越过 >300 档**且无档位结论：`panel-messages.mjs` 300→+3（≈303，批次档 `docs/batches/2026-09-21-vsc-no-folder-guard.md:152`）、`panel-session.mjs` 299→+8（≈307，`:154`）；跨文件限段（`:171`）只给 `chat-panel.mjs` 落「无需拆分」结论，余者仅「各档 <310」（行数陈述 ≠ 档位结论）；同类存量档 `webview/chat.js` 449→451（`:158`）亦无一句结论。 | 上述档各补一行档位结论（拆分评审结论，或「存量 / 无拆分义务 + 依据」）并写明增量构成；结论与读数同段登记。 |
| 2 | Clarity / 恢复面 ③ | 🟡 | `chat-panel.mjs:96-104` 被判「重构（两方向都覆盖）」（批次档 `:88-95`；`docs/vsc/design/PROJECT-SWITCHER.md:97-101`），而该处理器现役还担 override 失效（`PROJECT-SWITCHER.md:58`「被 override 的项目已移出工作区 → `clearProjectOverride` + 切换回落」）。**非空 → 非空**（多根时移除被 override 的那根）未写明保留，用例 9/10 只覆盖空↔非空 ⇒ 与 §2.0/§2.5「多根 / override 逐字零改」有自相矛盾风险。 | 在 2.3 明确第三支路（非空 → 非空）= 逐字保留既有回退链 + override 失效校验；并补该支路回归用例（或点名既有套件已锁）。 |
| 3 | Acceptance criteria（② 提示面） | 🟡 | 13 例全在 host 侧，webview 侧新契约与一键动作无用例：`send.js` 出口守卫（toast / 拒发 / 无假气泡）、`applyBusyLock` 第三态优先级「守卫 > busy > 常态」（`PROJECT-SWITCHER.md:92`）、通知按钮 → `executeCommand("vscode.openFolder")`（`:90`）三处均无断言；`test/vscode-mock/index.mjs` 增量「±1」是否够（探针 `showWarningMessage` / `showInformationMessage` / `commands.executeCommand`）未判。 | 补 webview 侧用例（含优先级、无假气泡）+ 一键动作用例（探按钮回调的 executeCommand 参数）；不可测则按 N-W5 先例登记「例外 + 消解路径 + 到期条件」；并点明 mock 增量口径。 |
| 4 | Document ownership（单源） | 🟡 | 两个新 i18n 键未登记 `docs/vsc/design/WEBVIEW-PROTOCOL.md` §6.3 键表（`:238` 表头 17 键），而该表惯例 = 加键批同轮登记 + 计数同改（`:546` 12→13 · `:495` 13→14 · `:490` 14→18 · `:483` 18→17；端特有键 `tool.interrupted` / `tool.truncated` / `sub.newBlocks` 均在表）。现 zh 逐字只住批次档 `:78-81`（记录面），设计面仅 en 半句（`PROJECT-SWITCHER.md:91-92`）。 | 二选一：(a) 同轮登记两键（计数 17→19）；(b) 明示「非对位键 ⇒ 不登记」裁定并写明逐字单源指向。 |
| 5 | Document ownership / 状态一致 | 🟡 | 同档计数不一致：`WEBVIEW-PROTOCOL.md:78`「十五项」 vs `:287` D-P11「**十四项**」；本批变更记录自称「D3：计数与列表同改」（`:554`），历轮先例明载「§7 D-P11 计数同改」（`:492` · `:541`）。 | D-P11 计数改「十五项」（与 §3.2 标题同轮）。 |
| 6 | Doc hygiene | 🟡 | 规范面留失效表达：`PROJECT-SWITCHER.md:63`「（原「行为不变」表述由 §4.1 守卫取代）」——修订式表达应删除（历史已在同档变更记录 `:139`）。 | 删该括注，只留现状句；同类可一并收：`docs/vsc/design/WEBVIEW-INPUT.md:22`「自 2026-09-21 无工作区守卫批起含第三态」可改纯现状表述。 |
| 7 | Criterion 8 / 数值 | 🔵 | 跨文件限算式与 Δ 列两口径：批次档 `:171`「`chat-panel.mjs` 456+22 ≈ 478」vs 同行 Δ 列「+≈22/−4」（净 474）。 | 统一口径（净增 474，或写明 ± 与净两义）。 |
| 8 | Requirements coverage / 措辞 | 🔵 | `PROJECT-SWITCHER.md:32`「`process.cwd()` 回落**不再被任何工作入口消费**」强于论证：八处守卫面 + 派生面不含 `atComplete`（@ 补全：webview 发点 `autocomplete.js:33` · host 位 `panel-messages.mjs:213`——`WEBVIEW-PROTOCOL.md:421` · `:149-152`）；若该链自 `_cwd()` 取扫描根，无文件夹窗口仍会在安装目录做（只读）扫描。 | 补一句判定：加守卫（⑨）或明示「只读、零落盘」并把 `:32` 的「任何」收窄为守卫面口径。（该链源码本席未读——`unverified`） |
| 9 | Test infra / 零回归 | 🔵 | mock 默认 `[]` → 单根（批次档 `:144` · `:165`）的「零改动语义」只覆盖 `_cwd()` 取值恒等；以 `workspaceFolders.length === 0` 为判据的既有分支（按钮隐藏 / multi 判定）语义翻转，「既有断言零红」不随之成立。 | 实现轮全量复跑并逐套件留读数；若有用例依赖空默认值，写明处置（改判据 or 显式置空）。 |
| 10 | Clarity / 闭环 | 🔵 | §1 边界句「不改 `_cwd()` 既有回退链的消费面」（批次档 `:22`）与 2.3 重构（`:178` §2.8 #1 自陈「勘正」）在正文层面并存，未收正。 | §4 批准轮在 §1 或 §4 落一句收正 / 引用（引 §2.8 #1），避免后来者按 §1 原文执行。 |
| 11 | Clarity / 证据 | 🔵 | `vscode.openFolder`「无参 ⇒ 原生选择框；同窗口 ⇒ 自行重载」（批次档 `:73-74`；`PROJECT-SWITCHER.md:90` · `:101`）以事实句书写，未见核验记录；恢复面 2.3 一键动作路径依赖之。 | 实机验证一次并落一句读数（或标 `未验`），避免 D5/U-P7 关键前置停留为未证断言。 |
| 12 | Clarity / 用例口径 | 🔵 | 用例 4 期望含「零 `turn:start`」（批次档 `:133`），该判别式不在 `WEBVIEW-PROTOCOL.md` §12/§13 收发面判别式集内——机检口径不一。 | 点名其载体（内部事件钩子 / 日志事件名）；若属内部事件，写明「非协议消息」。 |

**射程外注记（不赋严重度）**：需求面 `docs/vsc/requirements/WEBVIEW.md:24`（F-W5）现载边界句「不改 send 出口守卫（拒发门禁保持）」，与本批「无新需求条目」（批次档 `:22` · `:45`）之间是否需在需求面落一句收正 / 登记——属父侧需求层裁定，仅登记。

**计数**：🔴 0 · 🟡 6 · 🔵 6（共 12）

VERDICT: pass

### 轮次 2（评审子代理）

**评审对象**：复核轮 2（缩范围）——逐号核验修正轮 10 条落点（#1–#8 / #11 / #12；#9 / #10 已分流 ✗ 不属本轮）× 只验落点存在 ∧ 方向一致 × 不重开新面 × 兼查修正引入的新矛盾。四档全读（批次档 + `PROJECT-SWITCHER.md` + `WEBVIEW-INPUT.md` + `WEBVIEW-PROTOCOL.md`）。

**落点核验（逐号 · 10/10 存在 ∧ 方向一致）**
- **#1** `:183-190` ✓：`:187`/`:188`/`:189` 各含增量构成 +「无拆分义务」+ 触发；算式自洽（300+3=303 · 299+8=307 · 449+2=451）。
- **#2** `:90-98` ✓（`:96` 第三支路两分支 + 逐字保留）+ 用例 14 `:146` ✓ + 手法注 `:151` ✓；`PROJECT-SWITCHER.md:99-104` ✓（`:103` 第三支路）。
- **#3** 用例 15–17 `:147-149` ✓ + 手法注 `:151` ✓ + mock 口径 `:155-156` ✓（三探针「不在册且不需在册」+ 增量 ±1）；受影响表行 14/16（`:175`/`:177`）✓。
- **#4** `WEBVIEW-PROTOCOL.md:238`（19 键标题）✓ + `:262-263`（两行，zh/en 与批次档 `:78-81` 逐字一致）✓ + `:272-273`（端特有键登记注）✓ + `:558`（17 → 19）✓；`PROJECT-SWITCHER.md:94` 登记指向 ✓。
- **#5** `:291` D-P11「十五项」✓，与 §3.2 标题 `:78` 同数 ✓。
- **#6** `PROJECT-SWITCHER.md:63` 无修订式括注 ✓（历史住 `:142`/`:143`）；`WEBVIEW-INPUT.md:22` 纯现状表述 ✓（历史住 `:153`）——两档规范面无时点残留。
- **#7** `:186` = `456 +≈22/−4 ⇒ 净 ≈474`（与 Δ 列 `:163` 同口径；算式 474 ✓）；旧式 478 仅存记录面 `:240` / §3 行 7 `:272` ✓。
- **#8** `PROJECT-SWITCHER.md:32` 已收窄为「守卫面八个工作入口」✓；`:87` atComplete 判定在册 ✓（与批次档 `:62` 同实、互为单源指向）。
- **#11** 未验标注四处 ✓：批次档 `:74` · `PROJECT-SWITCHER.md:92`/`:104`/`:136`（另见下 🟡 1 之残余副本）。
- **#12** `:136` 载点名 = 内部日志事件名 `logEvent("turn:start", …)` + 「非协议消息」✓（§12/§13 两表实无 `turn:start` 行）。
- 新语义面：10 条落点全为标注 / 判定 / 用例口径 / 计数，未见新增守卫点（仍 ①–⑧ + 派生面）、新消息、新键 —— 与「零新语义」自述相符 ✓。

**读数 spot-check**：`PROJECT-SWITCHER.md` **145** · `WEBVIEW-PROTOCOL.md` **560**（尾空行计入）· `WEBVIEW-INPUT.md` **155** —— 与批次档 §2.7 行 17–19 / `:250` 同口径一致；`WEBVIEW-PROTOCOL.md` §6.3 键表实点 **19 行**（= 17 + 两新键）✓；§3.2 表实点 **15 行**（行 15 = `workspaceGuard`）✓。

**受限声明**：无项目标准档 / 无 Document Map ⇒ 归属判据退化（同轮 1 口径）；源码 / 测试档 / `locales` 不在本轮四档之内 ⇒ 涉源码断言（三探针是否在册 · `panel-chat.mjs:243` 事件名 · `findFiles` 扫描根 · 各档行数）一律 `unverified`，本轮只核「在册落点 + 内部一致性」。

| # | 类别 | 严重度 | 问题 | 建议 |
|---|---|---|---|---|
| 1 | Doc-state 一致（#11 残余） | 🟡 | 批次档 `:97` 仍以事实句写「`vscode.openFolder`（同窗口）= VS Code 自行重载窗口——非本机制的重载」，而同一断言在 `:73-74` 已标「**未验**」、`PROJECT-SWITCHER.md:92`/`:104`/`:136` 亦同标——同一断言一处标未验、一处作既定事实（#11 落点清单未含 `:97`）。 | `:97` 该句同标「未验」（或改为指向 `:74` 的标注），使同一断言全档一口径。 |
| 2 | Document ownership（重复描述） | 🟡 | `PROJECT-SWITCHER.md:103`（本轮新补第三支路）与同档 `:58`（§3 函数职责行）对同一机制（override 失效 ⇒ `clearProjectOverride` + 回落 / 「防 agent 指向死目录」）两处描述，`§4.1` 版更详（带 `chat-panel.mjs:99` / `:100-103` 坐标）而 `§3` 版为简述——单源风险（改一处漏一处，违 D2「同一机制只详述一处」）。 | `§3` 该行改为指向 `§4.1`（或标「详 = §4.1」），把坐标与判据留在单源。 |
| 3 | Clarity（手法注分组） | 🔵 | 批次档 `:151` 把 15–17 整体归「webview 侧 happy-dom」，而 `:149`（用例 17）自述「③ 命令面路径驱动——真 `workspace-guard.mjs` 守卫」+ stub 宿主 `showWarningMessage` / `commands.executeCommand`（宿主面）——分组与用例自述不符。 | 手法注分组改为「15–16 = webview 侧（happy-dom）/ 17 = 宿主面（真守卫模块 + 宿主 API stub）」，免实施轮把 17 写成 happy-dom 驱动。 |
| 4 | Clarity（口径） | 🔵 | `:151` 与 `:156` 两处「mock 零改」与 `:155`/`:177`「±1（仅默认单根翻转）」并置——「零改」易被读成 mock 档一字不碰，与必须的默认单根翻转冲突。 | 两处「零改」限定为「变化处理监听器捕获探针零增（默认值仍按 §2.6 翻转）」。 |
| 5 | Criterion 8 / 数值 | 🔵 | `:183` 声明口径 = `wc -l`，`:212`/`:250` 行数实测口径 = `readFileSync(utf8).split("\n").length`（差 ≤1 行尾空行计法）；#1 新落结论恰在边界：`panel-messages.mjs` = **300** ⇒ 判「本批首次越 >300 咨询线」——按另一口径可能读作 301（越线结论不变，仅「首次」表述受影响）。 | 写明判定 `>300` 咨询线所依口径（并说明 ≤1 行差对档位无影响）。 |
| 6 | Doc hygiene / 状态 | 🔵 | 批次档 `:254`「（待点火。）」仍留 §3 首行，而其下 `:256` 已有轮次 1 完整记录（对照：§2 同类失效占位行已按 `:245` 删除——同原则未落到 §3）。 | 删该占位行（或在 §3 记录内声明其失效）。 |

**计数**：🔴 0 · 🟡 2 · 🔵 4（共 6）

**预存在 / 射程外注记（不赋严重度）**：① `pushSessions` 同判据守卫（`:61`/`:166`/`:188`；`PROJECT-SWITCHER.md:86`）在用例 1–17 内无对应断言（其存在理由 = 防「会话行可点 ⇒ 绕过 ⑦」的可绕路径）——预存在（设计轮），非修正轮落点；② `PROJECT-SWITCHER.md:25` 的 `_cwd()` 简写与实读形等价（批次档 `:200` §2.8 #3 已在册）；③ `派生面（无需守卫 · 如实登记）` 标题 vs 其后「`pushSessions` 加同判据守卫」措辞张力（`:61` / `:86` 同文），#8 已明示「不引 ⑨ 号守卫」约定，仅措辞面；④ 需求面 `docs/vsc/requirements/WEBVIEW.md` F-W5 边界句 vs 本批「无新需求条目」——批次档 `:247` ① 已在册，**本席未读该档 ⇒ `unverified`**。

VERDICT: pass

## §4 用户批准（主 agent）

**父侧代签（用户 2026-09-21 12:00「自动跑到完成吧」授权 + 13:34 明令「b，但是要给提示」✗ 三条件齐备）**：

- 依据 ① **评审链全清**：轮 1（设计评审）= 🔴 0 · 🟡 6 · 🔵 6 → **修正轮 1**（10/10 落）→ 轮 2 复核 = **🔴 0 · 🟡 2 · 🔵 4**（6 条已由父侧就地收正 ✓）；
- 依据 ② **落点逐条核验**：轮 2 逐号核验 10/10 ✓（存在 ∧ 方向一致）+ 父侧实读（三档 145/560/155 ✗ §6.3 = 19 键 ✗ §3.2 = 15 行 ✓）；
- 依据 ③ **token 已签发**（✗ 凭证值不落档）；
- **裁定表（轮 2 六条 ✗ 均父侧直接执行 · 打标 ✓ · 可 revert）**：①🟡 `:97` 未验标注残余 → **Fixed**（加「未验」+ 指向 `:74`）②🟡 `PROJECT-SWITCHER.md:58` 与 `:103` 单源 → **Fixed**（`:58` 改指向 §4.1）③🔵 手法注分组 → **Fixed**（15–16 webview / 17 宿主）④🔵「mock 零改」口径 → **Fixed**（限定为「捕获探针零增」）⑤🔵 行数口径边界注 → **Fixed**（`:183` 补）；⑥🔵 §3 失效占位行 → **Fixed**（删 ✓）；
- **§1 边界句闭环（轮 1 #10）**：§1 原句「不改 `_cwd()` 既有回退链的消费面」——依 §2.8 #1 勘正**以「形态由设计定」为准**：工作区变化处理重构（空↔非空两向 + 第三支路逐字保留）= 守卫必经面 ✗ 非越界 ✓ 此处闭环 ✓；
- **频度形态（§2.8 上抛 1 裁定）**：**维持**「主动每空窗恰一次 + 被动每次被挡动作各一次」（用户明令「要给提示」✓；备选「被动-only」单行改法在册 ✗ 不采 ✓）；
- **需求面已登记（父侧直接执行）**：`docs/vsc/requirements/PROJECT.md` §2 新行（无工作区文件夹 ✓）+ `docs/vsc/requirements/WEBVIEW.md` F-W5 边界更新 ✓；**越档单源面已对齐**：`docs/vsc/design/VSC-DEBT.md` §12.1 补本批三档登记 + 变更记录 ✓；
- **实施派发**：eng-coder #53（守卫八处 + 派生面 + 双面逐字提示 + `vscode-mock` 默认翻转 + **全量复跑义务**（轮 1 发现 9）✗ 19 档 ✓）。

## §5 实施记录（eng-coder）

**轮次**：initial（2026-09-21 · eng-coder）。**状态**：✅ 交付完成——用例 1–17 全绿 · 全量复跑 905/905 绿 · 文档义务两条落位 · 审计 1 轮 + 代码评审 1 轮（无 🔴）。

### 5.1 落点表（全部实现后实读 file:line）

| # | 面 | 落点 | 拒法 |
|---|---|---|---|
| — | 判据单源 + 提示 + 状态推送 | **新档** `thincoder-vscode/src/extension/workspace-guard.mjs`（59 行 · leaf：只 import `vscode`） | `hasWorkspaceFolder()` / `notifyNoWorkspace()`（通知 + 按钮 ⇒ `vscode.openFolder` 无参）/ `pushWorkspaceGuard` / `releaseWorkspaceGuard` / `blockOnNoWorkspace(panel,{once})` |
| ① | 面板启用 | `src/extension/chat-panel.mjs:146`（`resolveWebviewView` 首段） | 提示 `{once:true}`（每空窗恰一次）；面板照常建（webview 须在位） |
| ② | 回合入口 | `src/extension/panel-messages.mjs:105`（`routeUserTurn` 首条——**先于** `savePastedImages` `:127`） | `if (blockOnNoWorkspace(panel)) return` |
| ③ | 命令面 | `src/extension/chat-panel.mjs:254`（`sendMessage`——**先于**回显 `:266`） | 同形 |
| ④ | 兜底红线 | `src/extension/panel-chat.mjs:94`（`runPanelChatImpl` **函数体首条语句**——先于首个 await `:129` 与 `_publishTurnState("running")` `:124`） | 同形 |
| ⑤ | boot | `src/extension/panel-session.mjs:261-262`（`openSessionContent` 两分支推态） | 跳过 + 推 `{active:true}` |
| ⑥ | 认领原语 | `src/extension/panel-session.mjs:47`（`ensureSlotAsync`）+ `:68-72`（`ensureSlot` 冷路径——越设计文本，见 5.3 D2） | 返 `null` |
| ⑦ | 会话族五 handler | `src/extension/panel-messages-session.mjs:24/34/67/75/92` | 提示 + return（rename 先于输入框） |
| ⑧ | 索引面 | `src/extension/panel-index.mjs:126`（`maybePromptIndex` 静默跳过 = 邀请零发）/ `:148`（`buildIndex` 提示 + return，先于 `withProgress`） | — |
| 派生面 | `pushSessions` | `src/extension/panel-session.mjs:224`（同判据——不推安装目录家族会话列表） | return |
| 提示面 | 逐字（双面） | `workspace-guard.mjs:17-20`（host 文本 / `Open Folder` / `vscode.openFolder`）· `locales/en.json:264-265` · `locales/zh.json:264-265` · `webview/send.js:19-24`（拒发 + toast）· `webview/loading.js:73-75`（占位符第三态）· `webview/state.js:117-120`（`S._workspaceRequired`）· `webview/chat.js:195-197`（`case "workspaceGuard"`） | 逐字（em-dash U+2014 / 省略号 U+2026 实测逐字一致） |
| 恢复面 | 空 ↔ 非空 + 第三支路 | `src/extension/chat-panel.mjs:100-129` | 转空：清 override + 槽解绑 + `_agent=null` + 推态 + 提示（**不走** `_onProjectChanged`）；转非空且此前守卫：复位去重 + 推 `{active:false}` + `openSessionContent`；非空→非空 = 第三支路逐字保留 |
| 测试 | 用例 1–17 | **新档** `test/workspace-guard.test.mjs`（487 行 · 登记 `test/files.mjs:125`） | mock 增量 = `test/vscode-mock/index.mjs:12` 默认单根（必须项） |

### 5.2 先红 → 绿读数

**先红**（`node --test test/workspace-guard.test.mjs`——守卫模块在位、调用点未接线）：`tests 17 · pass 3 · fail 14`。样例原文：用例 1 = `+ [ 'hi', undefined, undefined, undefined, [ 'D:\\teamcode\\thincoder\\thincoder-vscode\\.thincoder\\tmp\\paste-muauhos3yg8f-0.png' ] ]`（图片真落进 cwd）；用例 5 = `+ [ 'c812120887fce0fc6323f3ad114f43cde505cfc2.json.manifest', '…manifest.vscode' ]`（槽/清单真落盘）；用例 6 = `1 !== null`；用例 15/16 = `+ 'workspace.required'`（键缺席）；用例 12 首跑被用例间状态串味（`_cwd()` = `…rootA`）⇒ 已加 `_defaultFolders` 还原。**锁形先绿 3 例** = 用例 13（结构锁）/14（第三支路回归）/17 首版（提示面直驱不依赖接线）——17 已改判为「每次被挡动作各一条计数」以强制接线面（现先红）。
**绿读数**（实现后）：`node --test test/workspace-guard.test.mjs` → `tests 17 · pass 17 · fail 0`（逐例读数见交付报告；本档不复制）。零写入三档 = 用例 1（A：`.thincoder` 目录前后快照差零）/ 5·6·7（B：会话家族零新增 ∧ `_slot === null`）/ 4（C：`_agent === null` ∧ 零 `turn:start` ∧ `_turnState` idle）。

### 5.3 决策透明表（实现期判断 · 逐条带依据）

| # | 判断 | 依据 | 越设计文本？ |
|---|---|---|---|
| D1 | 转空向**另置 `panel._slot = null`**（`chat-panel.mjs:108`） | 恢复面承诺「认领 + 装载 ⇒ 直接可用」——`ensureSlotAsync` 粘性直返（`panel-session.mjs:48`）会把转非空后的 boot 钉在已移出根的槽上 ⇒ 不清即恢复面失效 | **是**（设计枚举只列清 override / `_agent=null` / 推态 / 提示）——已由代码注释 + 用例 10 锁定；建议文档层补一行（见 5.5 建议） |
| D2 | 冷路径 `ensureSlot` 加同判据（`panel-session.mjs:68-72`） | §2.1 派生面不变量「守卫态 `panel._slot` 恒 null」原依赖「解析缓存无条目」；同进程内若曾认领过等于宿主 cwd 的根，缓存命中会把旧槽重绑回来（代码评审 #3）⇒ 一行判据使不变量无条件成立 | **是**（设计未列该点）——正语义（更保设计自己的不变量），零回归（有文件夹路径第一位即真） |
| D3 | ① 只提示不早退（面板照常建） | `webview` 须在位才能显示占位符/toast，且工作区变化时靠它投守卫态；设计 ① 拒法列 = 「主动提示」（无 return） | 否 |
| D4 | 被动提示同样置 `_wsGuardNotified` | 该标志第二职责 = 恢复面「此前守卫」判据（`chat-panel.mjs:117`）——不置则「空窗内被挡过 ⇒ 转非空」不 boot | 否（设计语义已含该双职责） |
| D5 | ⑧ `maybePromptIndex` 静默（不发通知） | §2.1 ⑧ 拒法「邀请零发」；且慢段每开面板必跑——发通知会把「每空窗恰一次」变成噪声 | 否 |
| D6 | 用例 13 结构锁收宽为四档全集 + 判据单源半 | 设计枚举三例，本席按「零新增旁路」本旨取 `src/extension/**` 全扫（含 `panel-project.mjs` 多根面） | 否（加强锁定，非新增旁路） |
| D7 | 测试档超设计篇幅（487 vs ~230） | 17 例 × 真实夹具 + 逐断言消息；先例 `async-visibility.test.mjs` = 453 行（同为两组手法混编） | **是**（篇幅估计偏差，<500 硬限）——已登记见 5.5 |
| D8 | 设置面（AUTO/ENG/Plan/模型选择）不拦 | §2.5 ④ 边界明令设置面可用；槽写面经 D2 后守卫态天然返 false（核 `session-slot-write.mjs:107-123` 实读：`!slot` ⇒ `writeFlag` 返 false 零写） | 否 |

### 5.4 机检读数（as-of 本实施轮）

- **全量复跑**（`node test/run.mjs`——单入口）：**905 tests / 905 pass / 0 fail**（43.1s）；逐套件 110 档全 GREEN（含反查面：无任何套件依赖旧空默认值——`agent-lifecycle-singleton.test.mjs:400/458` 两处注释随默认翻转收正，断言面零改）。
- **lint**：`node scripts/check-syntax.mjs` → `check-syntax: 244 JS files OK`。
- **协议对账**：`protocol-coverage.test.mjs` 4/4 ✓ · `protocol-coverage-reverse.test.mjs` 3/3 ✓（§12 行 = `workspaceGuard | src/extension/workspace-guard.mjs:38 | webview/chat.js:197 | 活`，`--emit` 实测）。
- **doc-check**：`node scripts/doc-check.mjs --root .` → 悬空 **3** / 行宽 **4** = 本席开工时基线（悬空三条在 `AGENT-LOOP-SUBAGENT.md` 未触碰档；行宽三条同 + `VSC-DEBT.md:289`——该条系设计/批准轮 VSC-DEBT 编辑所引入，**不在本批触碰档**，如实上报）。本批触碰档**零新增**；`PROJECT-SWITCHER.md:71` 原「拟新增」列报行随档落盘消失（拟新增 11 → 10）。
- **行数实测（口径 = `readFileSync(utf8).split("\n").length`；括注 = `wc -l`）**：`workspace-guard.mjs` **60**（59）· `chat-panel.mjs` **487**（486）· `panel-messages.mjs` **305**（304）· `panel-chat.mjs` **260**（259）· `panel-session.mjs` **313**（312）· `panel-messages-session.mjs` **106**（105）· `panel-index.mjs` **242**（241）· `webview/send.js` **64**（63）· `webview/chat.js` **452**（451 = 设计预测）· `webview/loading.js` **96**（95）· `webview/state.js` **123**（122）· `locales/{en,zh}.json` 各 **267**（266）· `test/workspace-guard.test.mjs` **488**（487）· `test/files.mjs` **128**（127）· `test/vscode-mock/index.mjs` **193**（192）· `WEBVIEW-PROTOCOL.md` **564**（563）。**Δ 对照**：预测 ≈474/≈303/≈307 等 vs 实测 487/305/313——全部 <500 硬限，越 >300 咨询线者按 §2.7 裁「无拆分义务」；新测试档 487 越「新增两档 ≤300」的估计（见 D7）。
- **文档义务两条**（§2.7 末段）：§12 补 `workspaceGuard` 行 ✓；§3.2 行 15 去「拟新增」✓（另同笔收正 §3 行 62 的「实现轮到位」与 `PROJECT-SWITCHER.md:71` 的「拟新增」——同类失效标记，随实现落位而失真）+ 变更记录一条（分三行写，防行宽超限）。

### 5.5 审计与代码评审（轮次 + 终态）

- **内部 explore 审计（1 轮 · 只读 · 阻塞）**：结论 DEVIATIONS = 4 项（2 🟡 / 2 🔵 + 2 NOTE），无 🔴；八处守卫 / 逐字文案 / 恢复面三向 / 边界面逐条判 OK。🟡 = ①§5 未落笔（本段即补）②测试档篇幅与设计估计不符（D7 登记）；🔵 = 受影响表 Δ 漂移（见 5.4）+ `_slot=null` 未入设计文本（D1 登记）；NOTE = 标志双职责（D4）+ 结构锁收宽（D6）。
- **内部 advisor 代码评审（1 轮 · 同步 · 承审 14 档 + 三档文档）**：**VERDICT: pass**（无 🔴；3 🟡 = 测试档篇幅 / 设计权威面缺「转空 ⇒ 槽解绑」 / 派生面不变量前提条件成立；6 🔵）。
- **修正轮（本席自持 · 4 项落笔后复跑全绿）**：① `workspace-guard.mjs:53-56` 提示调用加 `try/catch`（使头注「提示面失败不阻断守卫」成立——原 `.catch` 只兜异步拒绝）；② `webview/send.js` 删占位符直写（单点派生归 `applyBusyLock`——原写法在中断模态会覆盖 input.js 的占位符）；③ `chat-panel.mjs:102` 转空判据改走单源 `hasWorkspaceFolder()`（原 `folders.length === 0` 对结构锁不可见）；④ D2 的 `ensureSlot` 冷路径判据（原为评审 🔵「不变量前提」）。
- **射程外（上报 · 未动）**：`docs/vsc/design/VSC-DEBT.md:289` 行宽 415 字符（设计/批准轮引入，非本批触碰档）；`PROJECT-SWITCHER.md:86/101` 与本实现的措辞差（D1/D2 两点建议文档层补，本席不越 D1 写权）。

### 5.6 未决 / 偏差（明示）

1. **待文档层收正（不阻塞交付）**：`PROJECT-SWITCHER.md:101` 转空向清单补「槽解绑」+ `:86` 派生面不变量补第二来源（D1/D2）——本席越设计文本的两点已在此据实登记。
2. **篇幅偏差**：测试档 487 行（设计估计 ~230）；`chat-panel.mjs` 487 行距 500 硬限 ~13 行——两者均无拆分义务声明，触发 = 下次实质触碰。
3. **未验项（承 §2.2/§2.3）**：`vscode.openFolder` 实机行为（选择框 / 同窗口重载）仍为**未验**——本批只锁调用形（用例 17）。
4. **射程外观察**：`test/fixtures/vscode-mock.mjs`（`workspaceFolders: null`）全仓零引用（疑似死档）——未动，归父侧。

## §6 验证与收口（主代理）

**实施轮**：eng-coder #53（initial ✗ 审计 1 轮（DEVIATIONS 无 🔴）+ 代码评审 1 轮 pass ✗ 自修正 4 项 ✗ 交付 = §5 ✗ 改动面 = 19 档 ✓）。

**验收（父侧独立复跑 · 读数原文）**：

| # | 判据 | 命令 | 读数（父侧复跑） | 结论 |
|---|---|---|---|---|
| ① | 全量套件 | `node test/run.mjs`（thincoder-vscode） | **tests 905 · pass 905 · fail 0** ✓ | ✓ |
| ② | 守卫落点抽读 | read 8 处 + `send.js` | `chat-panel.mjs:146` `blockOnNoWorkspace(this,{once:true})` ✗ `panel-chat.mjs:94` = 函数体首条（结构锁 ✓）✗ `panel-messages.mjs:105` ✗ `panel-session.mjs:47/224` ✗ `panel-index.mjs:126` ✗ `send.js` `S._workspaceRequired` 闸 ✓ | ✓ |
| ③ | 逐字文案 | locales 实读 | en/zh 两键在场 ✗ em-dash（U+2014）与省略号（U+2026）逐字 **全 true** ✓ | ✓ |
| ④ | mock 默认翻转 | `test/vscode-mock/index.mjs:12` | = 单根 `[{ uri: { fsPath: process.cwd() } }]` ✓ ✗ `test/files.mjs` 已登记新档 ✓ | ✓ |
| ⑤ | 协议义务 | `WEBVIEW-PROTOCOL.md` 实读 | §3.2 行 15 = 实测落点（**规范面零「拟新增」残留**——仅变更记录述及 ✓）✗ §12 双向对账 4/4 + 3/3 ✓ | ✓ |
| ⑥ | 改动面 | `git status --porcelain` | 24 档 = 实施面 15 + 新档 2 + 父侧文档面 6 + 本批档 1 ✓ 与 §2.7 表 + 披露一致（无夹带 ✓） | ✓ |
| ⑦ | 零写入三档 A/B/C | 用例 1 / 5/6/7 / 4 | cwd 零新增 ✗ 会话家族零落盘 ∧ `_slot === null` ✗ `_agent === null` ∧ 零 `turn:start` ✓ | ✓ |

**实施轮加法（越设计文本 ✗ §5.3 已披露 ⇒ 父侧文档层已补记 · 打标 ✓ · 可 revert）**：**D1** `chat-panel.mjs:108` 转空另置 `_slot = null` ✗ **D2** `panel-session.mjs:68-72` 冷路径同判据——已补入 `PROJECT-SWITCHER.md`（`:101` / `:86`）✓。

**父侧直接执行（本批全程 ✗ 打标 ✓ · 可 revert）**：需求面两档（`PROJECT.md:28` ✗ `WEBVIEW.md` F-W5）✗ 越档单源（`VSC-DEBT.md` §12.1 三档 + 实测补记 + 变更记录 ✗ 行宽折叠 ✓）✗ 设计档收正（2 轮评审共 16 条）✗ 批次档 §4 代签 + 占位清理 ✓。

**结算同步清单（D7）**：① 六段齐名归其位 ✓；② 状态行 →「**已收口 2026-09-21**」✓；③ 计数 / 枚举一致（守卫面 8 + 派生面 ✗ 用例 17 ✗ 全量 905 ✗ 键 17→19 ✗ §3.2 十五项）✓；④ 指针解析（§2 全表 ✗ §3 轮 1/轮 2 ✗ §4 代签 ✗ §5 ✗ §6 本段）✓；⑤ 变更记录（四设计档各一行 ✓）；⑥ 待办：**#199 → 已核销**（`PROJECT.md:28` / F-W5 登记 ✓）✗ #201 补据（死档零引用实况 ✓）；⑦ 前批遗留交叉核：无 ✓。

**发布关联**：随 VSC 列车（`0.9.4` / `0.9.5`）✗ **发布动作 = 用户门 ✗ 挂起中** ✓。

**冻结核**：本 §6 落 ⇒ 整档冻结（不再回改 ✗ 例外 = 提交哈希回填 errata 一笔 ✓）。

**提交 errata（本 §6 声明的例外笔）**：本批提交 = `1769287c`（`feat: vsc workspace guard — refuse agent start without a workspace folder (zero-write + explicit prompt)` ✗ 24 档 ✗ 已 push origin main ✓）。
