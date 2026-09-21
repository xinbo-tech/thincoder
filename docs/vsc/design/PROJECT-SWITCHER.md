# 多根工作区「当前项目」切换（PROJECT-SWITCHER）· 扩展面板 — VSC 部分

> 部分 = **vsc**（`docs/vsc/`）；板块 = **扩展面板 · 会话管理（current-project 切换）**。本档 = 该板块在基准层的**活档权威**。
> VSC 专有面（结构性不对称——`DOC-SYSTEM` §5.1 P2）：多根工作区下的「当前项目」（agent cwd）由面板显式指定，对端无对位机制。
> 需求侧：无同板块需求档（本端设置面板/面板交互无需求对位档）。
> 来源 = `thincoder-vscode/docs/design/PROJECT-SWITCHER.md`（VSC 产品树）——**原地一字未改，留作参照历史**（保留 ≠ 维护）。
> 建档：2026-09-15（**B 式迁移轮 · VSC 第 1 批**）。坐标 = as-of 2026-09-15 实核。

## 1. 定位与背景

多根工作区（multi-root workspace）下，扩展此前固定以 `workspaceFolders[0]` 作为 agent 工作目录（cwd）——用户无法指定「当前项目」，切换文件也不跟随。
本板块 = 为面板引入**单一 cwd 源 + 显式 override + 可选跟随活动文件**，使会话 / 索引 / `@` 补全 / agent 工具目录全部跟随切换。

**目标（验收语义）**：

1. 用户可显式指定多根工作区中的「当前项目」（agent cwd）。
2. 会话、索引、`@` 文件补全、agent 工具目录**全部跟随**切换。
3. 可选「跟随活动文件」自动切换（设置开关）。

## 2. 机制（单一 cwd 源 + override）

`_cwd()` 是**全部 cwd 的唯一入口**（`thincoder-vscode/src/extension/panel-messages.mjs:29`）：

```js
_cwd() = _cwdOverride ?? workspaceFolders[0] ?? process.cwd()
```

- `setProjectFolder(fsPath)`（`panel-messages.mjs:36`）：**校验 fsPath 必须是 `workspaceFolders` 成员**，否则拒绝。
- 切换后，所有既有 `_cwd()` 调用点（会话 slot、索引、`@` 补全、agent 启动）**自动生效**——无需逐个改调用方。
- **不跨窗口持久化**：重启后回到 `workspaceFolders[0]`。
- `clearProjectOverride()`（`panel-messages.mjs:46`）：清除 override，`_cwd()` 回落 `workspaceFolders[0]`。
- **无工作区守卫**（2026-09-21 批）：`workspaceFolders` 为空时，`_cwd()` 的 `process.cwd()` 回落**不再被守卫面八个工作入口（§4.1）消费**（判据 / 守卫面 / 提示面 = §4.1；回落链本身逐字未改）；射程外链判定（`atComplete`）= §4.1 派生面。

## 3. 切换流程（实现面）

扩展端方法实现已自 `chat-panel.mjs` 拆出（500 行硬限），`ChatPanel` 只保留委托方法。模块归属（as-of 2026-09-15）：

| 当前文件 | 内容 |
|---|---|
| `thincoder-vscode/src/extension/panel-messages.mjs` | `_cwd`（`:29`）· `setProjectFolder`（`:36`）· `clearProjectOverride`（`:46`）；消息 `setProject` 路由（`:197`——带 `fsPath` → 直接切换；不带 → 弹 QuickPick） |
| `thincoder-vscode/src/extension/panel-project.mjs` | `projectInfo`（`:14`）· `pushProject`（`:22`）· `applyProjectSwitch`（`:27`）· `onProjectChanged`（`:46`）· `pickProject`（`:61`）——机制实现主体 |
| `thincoder-vscode/src/extension/chat-panel.mjs` | `ChatPanel` 委托方法；构造时注册跟随活动文件（`:75`）与工作区折叠变化（`:95`）监听 |
| `thincoder-vscode/src/extension/panel-chat.mjs` | agent 回合 cwd 用 `_cwd()`（回合开始时取快照——`:234`） |
| `thincoder-vscode/src/extension/panel-session.mjs` | 会话加载 `loadSession`（`:133`）、slot 管理与切换 |
| `thincoder-vscode/webview/index.html` | `#project-btn`（📁 项目按钮，默认隐藏） |
| `thincoder-vscode/webview/chat.js` | `case "project"` 消息路由（`:202`）→ `session-bar.js` |
| `thincoder-vscode/webview/session-bar.js` | `handleProjectMessage`（`:124`）——多根显示并更新名称 / tooltip，单根隐藏；点击 → `postMessage({ type:"setProject" })`（`:121`） |
| `thincoder-vscode/package.json` | 设置 `thincoder.project.followActiveEditor`（boolean，默认 false——`:108`） |

**函数职责**：

- `projectInfo(panel)`：返回 `{ folders, current, multi, followActive }`（snapshot）。
- `pushProject(panel)`：`postMessage({ type: "project", ...projectInfo })`。
- `applyProjectSwitch(panel, fsPath)`：**任务运行中拒绝切换** → 校验 `setProjectFolder` → `onProjectChanged`。
- `onProjectChanged(panel)`：重置 slot → 认领新 cwd 的会话（`resumeSlot`——本端记录 / 一次性继承 / 全新分配）→ `pushProject` → `loadSession`（清视图、载入新项目活动会话、推会话列表 / autoApprove / planMode）→ `pushIndexStatus` → `maybePromptIndex`。
- `pickProject(panel)`：QuickPick 固定选项 = 工作区根列表（当前项 ✓）+「跟随活动文件」开关项（切换后循环重开显示最新状态）。
- `ChatPanel` 构造时注册 `onDidChangeActiveTextEditor`：设置开启**且**活动文件所属根 ≠ 当前 cwd **且**无任务运行 → 自动切换。
- `onDidChangeWorkspaceFolders`：override 失效校验 + 切换回落（**防 agent 指向死目录**）——详 = §4.1 恢复面「第三支路」。

## 4. 边界规则

- **agent 运行中禁止切换**（`_turnActive` / 挂起活跃期时拒绝）——避免 mid-turn 会话写错 slot。
- 单根工作区：按钮隐藏（行为不变）。**无工作区**：按钮隐藏 + **全部工作族入口拒绝并提示**（守卫面 / 提示面 = §4.1）。
- 切换即换一套会话（slot 按 cwd 存——与对端按目录会话一致）；切换时当前会话已由 turn 结束的保存逻辑落盘。
- 跟随活动文件**仅在无任务运行时**生效。

### 4.1 无工作区守卫（no-folder guard · 2026-09-21）

**背景**：无工作区窗口里 `_cwd()` 静默回落 `process.cwd()`，而扩展宿主进程 cwd = **VS Code 安装目录**（快捷方式启动语义）⇒ 会话 / agent / 工具 / 索引全部锚在安装目录，VS Code 原地更新即清空（外部用户实证：丢过两次交付物）。用户 2026-09-21 裁定：**无工作区 ⇒ 拒启 agent + 明确提示**——否「静默锚定」，亦否「自动搬家」（替用户选落点）。

**判据（单源）**：`hasWorkspaceFolder()` = `(vscode.workspace.workspaceFolders?.length ?? 0) > 0`——落点 = 新档 `thincoder-vscode/src/extension/workspace-guard.mjs`（判据 + 提示（逐字常量 + 去重）+ 状态推送三件；`_cwd()` 回落链**逐字未改**）。

**守卫面（八处 · 任一被挡 = 提示 + 早退）**：

| # | 守卫点（as-of 2026-09-21） | 覆盖 | 拒法 |
|---|---|---|---|
| ① | `ChatPanel.resolveWebviewView`（`thincoder-vscode/src/extension/chat-panel.mjs:116`） | 面板启用 | 主动提示（每空窗恰一次） |
| ② | `routeUserTurn`（`src/extension/panel-messages.mjs:100`） | webview 发消息 / retry——**先于** `savePastedImages`（`:122-124`）⇒ 图片不落 `<cwd>/.thincoder/tmp/` | 提示 + return |
| ③ | `ChatPanel.sendMessage`（`src/extension/chat-panel.mjs:219`） | 命令面（`thincoder.sendMessage` / `askSelection`）——**先于**回显（`:235`）⇒ 无假气泡 | 提示 + return |
| ④ | `runPanelChatImpl`（`src/extension/panel-chat.mjs:88`） | **兜底红线**：一切回合路径（user / auto / digest / 挂起内回合）⇒ 不建 agent（manifest 钩子 `thincoder-vscode/src/agent/setup.mjs:336-342` 不可达） | 提示 + return（**先于** `_publishTurnState("running")`） |
| ⑤ | `openSessionContent`（`src/extension/panel-session.mjs:252`） | 面板 boot（webviewReady 快段）：槽认领 + 会话装载 | 跳过 + 推 `workspaceGuard` 态 |
| ⑥ | `ensureSlotAsync`（`panel-session.mjs:42`） | 认领原语（冷路径 / `ensureSlot` 后台认领）⇒ 不落 session 槽 | 返 null（不认领不写） |
| ⑦ | 会话族 handler（`src/extension/panel-messages-session.mjs:22/30/61/67/82`） | newSession / switchSession / deleteSession / renameSession / setProject（槽写 / manifest active 写） | 提示 + return |
| ⑧ | 索引面：`buildIndex`（`src/extension/panel-index.mjs:141`）+ `maybePromptIndex`（`:121`；调用点 `panel-session.mjs:293` 跳发） | 免把用户引向「以安装目录为项目」的建档流 | 提示 + return / 邀请零发 |

**派生面（无需守卫 · 如实登记）**：守卫态下 `panel._slot` 恒 null（⑤⑥ 阻断认领，解析缓存无条目）⇒ 槽写面 `setSlot*` 天然返 false（`panel-session.mjs:57-61` 记载）；`pushSessions`（`panel-session.mjs:217`）加同判据守卫——不把安装目录家族的会话列表推给面板（否则会话行可点 ⇒ 绕过 ⑦）。
**实施轮加法 D2（可 revert）**：冷路径 `ensureSlot` 亦加同判据（`panel-session.mjs:68-72`）——使「守卫态 `_slot` 恒 null」不变量无条件成立。
**`atComplete`（@ 补全）链（评审轮 1 发现 8 判定）**：**不入守卫面**——**只读、零落盘**：扫描 = `vscode.workspace.findFiles`（工作区级 API——`panel-index.mjs:65-69`，非 `_cwd()` 的 fs 遍历），`_cwd()` 在该链仅作 `path.relative` 显示基（`:63` / `:74`），整链零写调用（`:56-84` 逐行实读）⇒ 不加守卫；§2「不再被守卫面消费」即此口径。

**提示面（逐字）**：

- **host 通知**（英文硬编码——随本端通知面现状，如 `chat-panel.mjs:228` busy 串）：文本 = `ThinCoder: no folder is open — the agent has no workspace to work in. Open a folder to start.`；按钮 = `Open Folder` ⇒ `vscode.commands.executeCommand("vscode.openFolder")`（VS Code 内置命令；**无参 ⇒ 原生文件夹选择框**）。
  **「选择框 / 同窗口重载」= 未验**（实机行为待用户侧观察）——可核代替面 = **调用形断言**（调用发生 ∧ 命令名逐字 ∧ 无参）。
- **webview 面**（i18n 键，`locales/{en,zh}.json` 各 +2）：拒发 toast = `t("workspace.required")`（en 逐字 = `Open a folder first — ThinCoder needs a workspace to work in.`）。
  输入框占位符 = `t("workspace.requiredPlaceholder")`（en 逐字 = `Open a folder to start…`）——`webview/loading.js:67-73` `applyBusyLock` 派生第三态（**守卫 > busy > 常态**）。**两键登记** = `WEBVIEW-PROTOCOL.md` §6.3 键表（19 键——端特有键）；文案实体 = `locales/{zh,en}.json`。
- **出口守卫**：`webview/send.js` 判 `S._workspaceRequired` ⇒ toast + 拒发，**先于** `addUser` / `setLoading`（`:36-41`）——无假气泡、无悬挂 loading。
- **新消息**：`{ type:"workspaceGuard", active:boolean }`（host → webview）——推送点 = ⑤ 两分支 + 工作区变化处理；协议登记 = `WEBVIEW-PROTOCOL.md` §3 / §3.2 行 15。
- **频度（不吵 / 不吞）**：主动提示（①）= 每空窗**恰一次**（`panel._wsGuardNotified`，释放即复位）；被动提示 = **每次被挡的用户动作各一次**。

**恢复面（空 ↔ 非空 ⇒ 无需重载；第三支路「非空 → 非空」逐字保留）**：`chat-panel.mjs:96-104` 工作区变化处理重构（空 ↔ 非空两向覆盖 + 第三支路保留）：

- **转为空**：清 override + 销毁 agent + **`_slot = null`（实施轮加法 D1——`ensureSlotAsync` 粘性直返会把「转非空后的 boot」钉在已移出的槽上，不清即恢复面失效）** + 推守卫态 + 主动提示（**不再走 `_onProjectChanged`**——旧路径会把 cwd 绑到 `process.cwd()` 并落槽）。
- **转为非空且此前守卫**：复位去重 + 推 `active:false` + `await openSessionContent(panel)`（认领 + 装载）⇒ 直接可用。
- **非空 → 非空（第三支路——零改）**：被 override 的根仍在 `workspaceFolders` ⇒ 现状早退（`chat-panel.mjs:99`）；被 override 的根被移出 ⇒ `clearProjectOverride()` + `_agent = null` + `_onProjectChanged()`（现状 `:100-103`——override 失效校验，防 agent 指向死目录）。重构只动空 ↔ 非空两向，本支路逐字保留（回归锁 = 用例 14）。
- 一键动作路径（`vscode.openFolder`，同窗口）= VS Code 自行重载窗口（扩展宿主重启、新根正常 boot）——**未验**（实机行为待用户侧观察；可核代替面 = 调用形断言）。

**零写入判据**（详判据与用例 = 批次档 §2.4 / §2.6）：`process.cwd()` 快照不变 + 该 cwd 会话家族零文件 + agent 未建 + `PROJECT-MANIFEST.json` 未建。**射程外（明示）**：用户级面（`~/.thincoder/config.json` 迁移 / 记忆库句柄 / 台账读）不属本守卫——非 cwd 落点，且面板设置须在无工作区窗口可用。

**边界**：运行中回合不因守卫中止（既有销毁点语义不变——守卫只挡新活）；有工作区路径（单根 / 多根 / override / 跟随活动文件）逐字零改。

**被否形（决策记录）**：① 静默锚定（现状）——丢交付物实证；② 自动搬家 / 自动建档他处——替用户选落点；③ 仅日志 / 控制台提示——「不吞」禁令；④ 改 `_cwd()` 回落链（返 null）——波及 11 档消费面，取前置守卫面替代。

## 5. 不并项与历史沿革

### 5.1 历史沿革（(d) 类——**不并**）

> 来源档 `thincoder-vscode/docs/design/PROJECT-SWITCHER.md`（VSC 产品档）——**原地保留作参照历史**。下列内容**不并入本档**：

| 旧档位置 | 内容 | 何故不并 |
|---|---|---|
| 头注状态行（「已实现（2026-08-17）」+ 格式债清理注） | 时点状态行 | 批次语境——现行态已入 §1–§4 |
| 旧档「测试」节（`project-switcher.test.mjs` / `welcome.test.mjs` 的删除记录） | 测试资产存废叙述 | 一次性批次材料——**测试资产归测试层**（`thincoder-vscode/test/`）；旧档已自述删除 |
| 旧档「变更记录」（2026-08-17 / 09-05 / 09-07 / 09-08 四条） | 逐批流水 | 历史叙述——本档自有变更记录 |

> **零 (d) 类旧结构**：源档为当前态单稿（2026-09-08 已重写为多行 current-state），无「已作废机制形态」段可登记——本节只收时点材料与测试资产。

## 6. UI / 交互决策落档

| # | 决策 | 状态 |
|---|---|---|
| U-P1 | 项目按钮 = `#project-btn`（📁），**单根 / 无工作区时隐藏** | 已定（§3） |
| U-P2 | 切换入口 = QuickPick（工作区根列表 + 「跟随活动文件」开关项）；**不做**面板内联下拉 | 已定（§3） |
| U-P3 | 运行中拒绝切换 = **硬拒**（不排队、不自动延后） | 已定（§4） |
| U-P4 | 多根时按钮显示当前项目名 + tooltip；单根隐藏（无额外状态提示） | 已定（§3） |
| U-P5 | 「跟随活动文件」开关的**视觉位置**与切换提示文案 | **open**（源档未落档——不静默补） |
| U-P6 | 无工作区守卫态提示 = **双面**（host 通知 `showWarningMessage` + `Open Folder` 按钮；webview toast + 输入框占位符）——**不做**面板内常驻横幅 | 已定（§4.1） |
| U-P7 | 一键动作 = 内置命令 `vscode.openFolder`（无参 ⇒ 原生文件夹选择框；同窗口 ⇒ VS Code 自动重载窗口——**未验**，见 §4.1） | 已定（§4.1） |
| U-P8 | 提示频度 = 主动提示每空窗**恰一次**；被动提示**每次被挡动作一次**（不重复轰炸 / 不静默吞） | 已定（§4.1） |
| U-P9 | 守卫态 Send 按钮**保持可见**（点击即提示）——与 C-14「running 期隐藏」分道：守卫态 = 用户可自解态，保留可发现入口 | 已定（§4.1） |

## 变更记录

- 2026-09-21（**无工作区守卫批 · 评审轮 1 修正轮 · eng-designer**——承批次档 §3 轮次 1 发现 2 / 6 / 8 / 11）：§2 守卫句口径收窄（「任何工作入口」→「守卫面八处」）；§4 删修订式括注；§4.1 派生面补 `atComplete` 链判定（只读 / 零落盘 / 不入守卫面）+ 恢复面补**第三支路**（非空 → 非空——override 失效校验逐字保留）+ `vscode.openFolder` 行为句标**未验**（提示面 / 恢复面 / U-P7 同标）+ 提示面补键表登记指向（§6.3）。**守卫八处 / 消息面零变**。
- 2026-09-21（**无工作区守卫批**）：§2 补守卫指针；§4「无工作区：…行为不变」收正；新增 §4.1（判据单源 / 守卫面八处 / 提示面逐字 / 恢复面 / 零写入判据 / 边界 / 被否形）；§6 补 U-P6–U-P9。
- 2026-09-15（**B 式迁移轮 · VSC 第 1 批**）：建档——`thincoder-vscode/docs/design/PROJECT-SWITCHER.md` 内容重建入基准层（旧档一字未改、原地作参照历史）；状态行 / 测试节 / 变更流水入 §5 不并项；坐标改写为仓根相对现状路径（补 `panel-project.mjs` 五函数与 `package.json` 锚行）。
