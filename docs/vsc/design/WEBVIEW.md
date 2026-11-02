# Webview 前端与活动区（WEBVIEW）· 设计 — VSC 部分

> 部分 = **vsc**（`docs/vsc/`）；板块 = **webview 前端面**——VSC 独有（CLI 前端为终端 TUI；webview 隔离 iframe 是其对偶形态）——**实现不镜像**（各端原文自持、不加面间同步依赖——**只述实现形态；端差默认 = 消，保留例外的唯一凭据 = 宿主能力面证据 ∥ 行为证据**）；**文档面互挂对位指针**（对位档 = `docs/cli/design/TUI.md`——档头对位行与 §8.2 行：逐条处置；本档 §4.4 同挂对位指针）。
> 本档 = 该板块**结构与活动区面**的活档权威；同板块同层另两档 = `WEBVIEW-PROTOCOL.md`（消息协议 · 消息秩序/忙态 · 状态行）· `WEBVIEW-INPUT.md`（输入面 · 消息渲染契约）。**同一机制只详述一处**（D2）——块头/状态词形态归本档，协议表与状态行字段归 `WEBVIEW-PROTOCOL.md`，输入与渲染契约归 `WEBVIEW-INPUT.md`。
> 需求侧 = `docs/vsc/requirements/WEBVIEW.md`（F-W1–F-W7 / N-W1–N-W6——**同名成对**，N-b）；逐条回指见 §10。
> 硬约束（本端）= 纯 `.mjs` · 零 npm 运行时依赖 · 仅 VS Code API + Node 标准库；webview 侧只用浏览器标准 API（无打包器）。
> 来源 = `thincoder-vscode/docs/_archive/design/WEBVIEW.md`（VSC 产品树 · 现址 = 归档址）——**原地一字未改，留作参照历史**（保留 ≠ 维护）。该档超 500 硬限 ⇒ 按面拆三档（三档归属 = 档头归属行）。
> 坐标 = 仓根相对路径 + `:行`。

## 1. 定位与职责边界

webview 是扩展主机的 **UI 适配层**，只负责 UI 渲染与用户交互；agent 循环与工具执行在 extension host 侧。两者经 `postMessage` **单向通信**——webview 为隔离 iframe，无共享状态。

- **UI 状态单一持有在 webview 端**：`thincoder-vscode/webview/state.js:71` 的 `S`（UI 状态）+ 同档 `ctx`（DOM 引用集，如 `state.js:19` 的 `ctx.activityEl`）+ `vscode` postMessage 桥。
- **会话 / Provider / 工具状态在扩展端**：`thincoder-vscode/src/extension/**`（面板生命周期与消息路由）· `thincoder-vscode/src/extension/panel-turn-loop.mjs`（回合循环 host 包装——核 `runAgent` 改接）。
- 消息族、投递纪律与忙态收敛 = `WEBVIEW-PROTOCOL.md`（本档不重述）。

## 2. 布局（垂直序 + grid）

**垂直序（自顶向下）**：会话栏 → `#messages` 滚动区（对话流，含 digest 文本与一切会话内容）→ **活动区 `#subagent-activity`**（子代理/consult/advisor-async 活动块）→ 行面板区（`#goal-panel` / `#task-panel`）→ 输入区（`#toolbar`）。

CSS 布局规则 = `thincoder-vscode/webview/base.css:88` 的 grid 行模板：

```
grid-template-rows: auto minmax(0, 1fr) auto auto auto;
```

- 行模板 ↔ 垂直序：header(session-bar) / `#messages`(1fr) / `#subagent-activity`(auto) / `#panels`(auto) / `#toolbar`(auto)——后三层均 auto，隐藏项不占高 ⇒ 消息区高 = 容器 − 活动区 − 面板 − 输入（grid `1fr` 自动吸收）。
- 消息区钉底/滚动语义**限定在 `#messages` 内**：`overflow-y: auto` + `overscroll-behavior: contain`（`thincoder-vscode/webview/base.css:93-97`）。
- **活动区**：位于 `#messages` 与 `#panels` 之间（`thincoder-vscode/webview/index.html:35`——`role="region"`）；**空区隐藏零高**（`base.css:109` `#subagent-activity:empty { display: none; }`——零显隐 JS）；内容自适应 + `max-height: 32vh` 封顶 + 区内自滚（`base.css:102-107`）。
- **活动区独立 pin**（`thincoder-vscode/webview/ui.js:228-232` `maybeScrollActivity`）——与消息区**互不拉扯**（两层状态独立——§5.5）。
- shell 结构（`thincoder-vscode/webview/index.html:14-92`）：启动加载画面 `#loading-screen`（`:18-23`——静态默认可见；端壳握手落定后由 `dismissLoadingScreen` 移除（定义 `webview/chat.js:29`；落定点 `webview/chat-messages.js:151`）+ 3 s 兜底（`chat.js:41`））+ `#chat-container`（`:24-92`）内含 `#session-bar` / `#messages` / `#subagent-activity` /
  `#panels`（goal、task 两个行面板）/ `#toolbar` / `#settings-panel`（dialog）/ `#welcome-panel`（首次运行 onboarding）。
- **行面板区（`#panels`——goal ∕ task 两行面板）**：**goal = 默认合 + 🎯 开合**——开合态住 `state.js` 的 `S._goalPanelOpen`；显隐判 = `goalPanelVisible(S._goalInfo) && S._goalPanelOpen`（`panels.js`）；🎯 徽标出口 = `status-bar.js` 翻态；目标缺席 ∕ 清空 ⇒ 照旧隐、开合态不重置（与桌面端「默认合」对齐）。
  **重置点 = 会话边界**：回合起点不清 ⇒ 回合后 🎯 ∕ task 存续 ∥ 会话切换 ∕ 载入时经 `clearPanels()` 清 goal ∕ task 双侧（`chat-messages.js` `clearMessages` 支调用；开合态不重置）。
- `#toolbar` 内 = `#status-line` + `#input-row`（attach / send / abort）+ `#paste-bar` + `#controls-row`。
- 注入占位：CSS 五档经 `__CSS_*_URI__`、模块脚本经 `__CHAT_URI__`、CSP 经 `__CSP__`（`thincoder-vscode/webview/index.html:6-11` · `thincoder-vscode/webview/index.html:93`）。

## 3. 文件结构（现行）

`index.html`（shell——CSP 注入 + CSS/JS URI 占位）→ 前端模块（`thincoder-vscode/webview/`，**52 档模块**（`.js` / `.mjs`；CSS 5 档 + `index.html` shell 另列））：

| 模块 | 职责 |
|---|---|
| `chat.js` | 编排层（装配 + 全局键 / 点击 + 启动握手）：init 装配（welcome / autocomplete / settings / onboarding / toolbar / 文件链接 / ⏹ 取消委托）+ 命令块 `initMessageLoop(deps)`（**原址**注册消息监听——D-C1）+ `dismissLoadingScreen` 族；启动握手 `webviewReady`（`chat.js:142`）· **142 行** |
| `chat-messages.js` | host → webview **消息分发循环**（`initMessageLoop`——`window.addEventListener("message")` + `case` 单表整块；D-C2 不拆族）；**271 行** |
| `chat-status.js` | **显示状态元素一族**（`clearStatusText` / `handleStatusText` / `showCompressStatus` / `showDigestStatus`——压缩状态行 + 状态段 + digest 轮可见面；模块级 `_digestRoundEl` 随迁）；**163 行** |
| `streaming.js` | token/reasoning 流式渲染（rAF 节流 + ≥50ms 重排门——核 `flow/stream.mjs:18` / `:88`；端实例 `:28-33`）+ 回合收尾（含未结算工具卡清扫 `sweepUnsettledToolCards`——M1——`:96`）+ 子代理块路由（`subagentChunk` `:171`）+ code-block 复制按钮（核 `flow/stream.mjs:117`） |
| `ui.js` | 端壳面：欢迎条 / 横幅 + `ctx` 装配（气泡 / 工具卡 / advisor 块经核构件——`thincoder-render-core/flow/block.mjs` / `thincoder-render-core/flow/tool-card.mjs`）+ 滚动族（`scrollDown` / `maybeScrollDown` / `maybeScrollActivity` `:228-232` / `initScrollFollow` `:250-255` / `trimOldMessages` `:238-245`）——leaf：不 import `state.js` |
| `md.js` | markdown 渲染（核单源 = `thincoder-render-core/md.mjs`——`md()` `:67` · 内联引擎 `inline()` `:34`；契约见 `WEBVIEW-INPUT.md`） |
| `state.js` | 单一 UI 状态 `S`（`:71`）+ DOM 引用 `ctx`（`:19`）+ `vscode` 桥 |
| `activity.js` | 活动块编排层（R2 换接：迁移判据 / 键文法 / 补桩表单源 = 核 `subblocks/state.mjs` + `subblocks/channel.mjs`；本档 = DOM 效果执行 + 出生位 / 归档入流——`:65` / `:104`）+ 块级跟滚**调用点**（原语 = 核 `thincoder-render-core/subblocks/block.mjs`——§5.5） |
| `record-rows.js` | 归档快照**行派生叶件**（`rowsOf` ∥ `rowLines` ∥ `boundRows` ∥ `RECORD_ROWS_MAX_LINES`——行形 `{kind, text, sub?}`；零依赖、零浏览器全局，只吃元素对象）——原 `activity.js` 同一份实现迁出，消费面 = `subagentSnapshotOf`；行形 ∥ 容读 ∥ 空行判据单源 = §5.7 |
| `activity-view.js` | 呈现叶（R2 迁核：实现单源 = 核 `subblocks/activity-view.mjs`——`refreshBlock` `:132` · `updateStopButton` `:166`（件内）· `noteChunk` `:200` · `tailLines` `:117`；本端档 = 2 行 `export *` shim）——leaf：i18n only |
| `panels.js` | goal/task 行面板（构树 + 显隐判据单源 = 核 `thincoder-render-core/cards/panel.mjs`——R2 换接）+ 挂起态 + 桥路由（`handleSubagentMessage` 纯转发 `applySubagentStatus`）；`_panelTimer`（1s）同点刷 live 块头（`panels.js:55-58`） |
| `send.js` / `loading.js` | 输入门（核 `thincoder-render-core/composer/panel.mjs`——busy 拒发 `:301-324`；本端 `send.js:10-12` 转口）/ 忙态与按钮可见性（核 `thincoder-render-core/composer/panel.mjs:434-435`；本端 `loading.js` 转口） |
| `input.js` / `autocomplete.js` / `toast.js` | 输入面（keydown 全族——`WEBVIEW-INPUT.md`）/ @ 补全与图片粘贴 / 瞬时提示（R2 迁核：核 `toast.mjs`；本端 = 2 行 `export *` shim） |
| `permission.js` / `question.js` | 权限弹窗与批确认 / 内联 question 卡（R2 换接：构树单源 = 核 `thincoder-render-core/cards/permission.mjs` / `thincoder-render-core/cards/question.mjs`——端壳只留出站绑） |
| `diff.js` · `tool-card-restore.mjs` | diff 预览（apply_patch）/ 恢复会话的工具卡折叠语义（R2 迁核：核 `thincoder-render-core/flow/tool-card-restore.mjs`；本端 = 2 行 shim——仅测试消费） |
| `tool-summary.js` | 工具结果**一行式摘要单源**（`formatToolSummary` 分派：advisor / read / write / grep / glob / bash / 默认分支）——活卡 `finishToolCard` 与恢复卡 `buildToolHistory` 共用（X3 · X7） |
| `settings.js` + `settings-*.js` | 设置面板（providers / agent / models / tools / env / widgets / state）——信息架构见同层 `SETTINGS.md` |
| `settings-mcp.js` | MCP 面（服务器列表 + add ∕ edit 表单 + env ∥ headers 行式键值编辑器）——自 `settings-tools.js` 拆出；**126 行**；`settings-tools.js` **212 行** |
| `model-picker.js` / `model-menu.js` | 模型选择两级菜单 |
| `history.js` | 懒历史分页（`applyHistoryPage` `:49` · `loadOlder` 投递 `:103`） |
| `scroll.js` | 滚动族装配 + 悬浮回底钮（`updateScrollBottomVisibility` `:29`） |
| `status-bar.js` | 状态行单 writer（`renderStatusBar` `:17`）——段位契约见 `WEBVIEW-PROTOCOL.md` |
| `session-bar.js` | 会话栏（标题/下拉/新建） |
| `mode-buttons.js` | ENG / ADVISOR / AUTO / PLAN 按钮状态反射 |
| `i18n.js` / `i18n-dom.js` | 文案解析（`${k}` 插值——核单源 `thincoder-render-core/i18n.mjs:30`）与 DOM 反查 |
| 其余 | `search.js` · `onboarding.js` · `lib.js`（纯 helper——R1 迁核：实现单源 = 核包 `@thincoder/render-core/lib.mjs`，本端档 = 2 行再导出 shim） |
| CSS | `base.css` · `chat.css` · `controls.css` · `session.css` · `settings.css` |

**R1 迁核注**（六档）：`md` / `highlight` / `diff` / `lib` / `tool-summary` / `i18n` 实现单源 = 核包 `@thincoder/render-core`——本端五档 = 2 行再导出 shim，`highlight.js` 删除（核内 `md.mjs` 自引；本端零消费）。

**R2 迁核注**（七拆档 + 三核档）：`ui` / `streaming` / `activity` / `panels` / `permission` / `question` / `queued-mark` 七档 = 换接核构件（直 import 核包 `.mjs`；端留守面 = `ctx` 装配 / 滚动族 / 消息分流 / 出站绑 / DOM 效果执行）；

`activity-view` / `toast` / `tool-card-restore` 三档 = 2 行 `export *` shim（实现单源 = 核包 `@thincoder/render-core/subblocks/activity-view.mjs` / `@thincoder/render-core/toast.mjs` / `@thincoder/render-core/flow/tool-card-restore.mjs`）。

**本端接线**：实现为唯一事实源——模块图登记见 `thincoder-vscode/AGENTS.md`（webview 行为维护寄存器）。
extension 端对应：`chat-panel.mjs`（面板生命周期/消息路由）· `panel-*.mjs`（消息处理分模块）· `suspension.mjs`（挂起驱动装配——核 `startSuspension`）· `permission-gate.mjs`（权限门）。

## 4. 交互组件与标题

- **权限弹窗 / 批确认 UI**（`permission.js`）：approve / deny / approve-all + 原生 diff 预览；AUTO 按钮翻转会话级 autoApprove。
- **question 卡**（`question.js`，内联卡非原生弹窗）：选项按钮包 `.question-options` 容器（成列——`base.css:346`），底部操作行 `.question-actions`（input + submit + cancel——`base.css:359`）；卡内字号/字重 scoped 覆盖；`.question-text` pre-wrap 保形（`base.css:335-341`）。
- **粘贴图片**：attach 按钮 / 粘贴 → dataURL 预览条 `#paste-bar`（`thincoder-vscode/webview/index.html:50`）→ 发送时随 `userMessage` 上送（核 `thincoder-render-core/composer/panel.mjs` 发送径）。
- **设置面板**：模型 / Provider / 代理 / 工具 / agent 分页（`settings-*.js`）；agent 页含 poolLimits、guard / engineering 反射。
- **会话标题**：session-bar 顶栏显示活动槽标题（`#session-title`——`thincoder-vscode/webview/session-bar.js:138`，来自 `sessions` 消息的 `active.title`）；
  会话下拉 `#session-dropdown`（`thincoder-vscode/webview/index.html:30`）列 switch / rename / delete。
  首条消息发送后 LLM 自动生成标题（`thincoder-vscode/src/extension/generate-title.mjs`）；标题未生成前显示自动占位
  （`Session N` + 生成中提示——`input.js:109-112`），生成完成后经 `sessions` 刷新。

  账本异常注记：`sessions` 载荷携 `ledger`（`{ refused, reason, scene }`——异常才携；判据单源 = 核 `ledgerHealth(cwd)`）⇒ 下拉**首行警示注记**（非可点条目——渲染点 `thincoder-vscode/webview/session-bar.js` `buildSessionDropdown`）。

  文案 = 主句键 `session.ledgerNotice`（含 reason 与「打开会话即自动补回」）**+ `scene === true` 时条件附句键 `session.ledgerNotice.scene`**（「损坏现场档保留 30 天」——与 CLI 同口径：**条件合成，恒附改条件附**），见 `WEBVIEW-PROTOCOL.md` §6.3。

  **异常清 ⇒ 两侧**（单源 = 核 `ledgerHealth(cwd)`）：`scene` 侧 = 损坏现场档清 ⇒ 注记消失（零历史态）∥ `refused` 侧 = 核**本进程累计**（不清零）⇒ 进程内一旦拒写，注记持续在场**至重启**（有界）。
- **模型选择 UI**：主下拉列 provider 行 + hover flyout 子菜单选模型（两级菜单——`model-picker.js` / `model-menu.js`）；底部含 add / remove / key 管理入口。
- **挂起与忙态 UI**：settled → `awaitingDigest`（等待消化，带提示）；digest 起跑（起跑窗）→ 归档落流；会话退出 = 区全体归档（§5.1）。
  状态行（⏳ 后台 N 子代理 + 待消化计数——`status-bar.js:66-78`）；输入框永不锁（`loading.js`），
  send 出口拒发保留（核 `thincoder-render-core/composer/panel.mjs:301-324`——Enter 与发送按钮同经此拒；可继续录入）；

  **Send 按钮 running 期隐藏**（核 `thincoder-render-core/composer/panel.mjs:434`），Stop 只在 running 显（核 `thincoder-render-core/composer/panel.mjs:435`；susp 纯池跑不显——子代理停止靠区内逐块 ⏹）。
- **模式按钮**（`mode-buttons.js`）：ENG / ADVISOR(guard) / AUTO / PLAN 状态反射。

### 4.1 权限卡族释放形态（逐项 / 合并 · F-W13）

- 卡族 = `.permission-prompt`——逐项卡（`permissionRequest`）与合并卡（`batchPermissionRequest`）同族；**族键 = `data-prompt-id`**（合并卡同携 `promptId`）。
- 释放形态 = **卡消失**：`permissionWithdrawn` 经同一选择器移除（`thincoder-vscode/webview/chat-messages.js:213-219`——逐项 / 合并零分支）；**不做「已拒绝态」变体**（同一语义不做两形态）。
- **零静默无效**：队列无对应条目时 host 回 `permissionWithdrawn`（可见处置）⇒ 卡被同一消费者移除——「点了没反应」在形态上不可达。
- **释放 ⇒ 状态栏刷新**（F-W13 族）：卡释放后 VS Code 状态栏不得残留 `waiting for your input`；`waiting` 判据含**批权限队列**、刷新点 = 释放通道单点（判据与落点 = `WEBVIEW-PROTOCOL.md` §4.4 · §4.6——本档不重述，D2）。
- 消息面 / id 纪律 / 响应匹配判据 = `WEBVIEW-PROTOCOL.md` §4.6（本档不重述——D2）。

### 4.2 模型 / 推理按钮 —— 随处可切（F-W14）

- **钮面零忙态门**（用户走查裁——「总是被锁着」）：模型 / 推理按钮**任意忙态可点**（`running` / `susp` / `idle` 同面）——不 `disabled`、不 `aria-disabled`、进忙态**不关**已弹浮层；信息钮**保位不隐藏**（与 Send 隐藏的分工不变——`WEBVIEW-PROTOCOL.md` D-P9）。
- **写面保护 = 偏好键单写者**（替代硬挡）：会话级三键（`provider` / `model` / `effort`）唯一写者 = 显式选定 + 首播种；**回合关联落盘不携三键**——四处 `slotStamp` 落盘改**播种印章**（`panel-turn-stages.mjs` ∥ `panel-turn-loop.mjs` ∥ `panel-callbacks.mjs` 两处；`saveLines` 取值 = 显式写位 > 槽在场 > seed）。
- **自动回写门保留**（共享核件 `applyModels`）：`models` 推送的自动回写忙态零回写（防陈旧推送回声覆写新选定——`writebackBlocked`）；idle 照发（同值回声）。
- **下一回合生效**：回合入口恒读槽复合（`resolveTurnStage` `_activeData`——`panel-turn-stages.mjs:45-61`）；在飞回合持起跑 `p` ⇒ 回合内零变；忙期选定自**下一回合**起跑生效。试运行语义（`turn-model.mjs`）零改。

### 4.3 工具卡失败信号与摘要（F-W16）

- **判据单源 = 核 `thincoder-render-core/lib.mjs:113` 的 `isToolFailure(text)`**（纯函数；本端 `webview/lib.js` = 转口）：① 既有 `Error:` / `Error：` 前缀 ∪ ② **独立成行的终止状态位** `(exit code N≠0)` / `(killed: …)` / `(spawn failed)`。
  `(killed: …)` **含用户中断值** `killed: user interrupted`（核 `tools/bash.mjs:223-225` `signal?.aborted`）——用户中断的命令确未完成 ⇒ 同判失败。
- **产者两处（同名同形 · 一端一产者）**：CLI 端 = 核 `thincoder-core/tools/bash.mjs`（退出面 `:224-226` · spawn 失败面 `:184-192`）；
  **本端卡面 = 宿主 `thincoder-vscode/src/tools/shell.mjs`**（终止面 `:236-267` · 收集面 `:269-298`）——本端工具集登记的是宿主实现
  （`thincoder-vscode/src/tools/index.mjs:30` · `:173-176` 进 `builtinTools` ⇒ `thincoder-vscode/src/agent/setup.mjs:219`（`agent.tools = baseSet`）绑 `agent.tools`）；

  **核 `bash.mjs` 的 `Command failed:` 形态在本端无产者**（宿主 `shell.mjs` 亦产同字面诊断行（`Command failed: <errno>`，**不入判据**）——「无产者」只指核产者形态不达本端）。
- **状态位族三成员（闭集）**：`(exit code N≠0)`（进程已跑 ⇒ 有退出码）· `(killed: …)`（被杀——含超时 `killed: timeout <N>ms` 与输出超容 `killed: output limit exceeded`）· `(spawn failed)`（**进程未启动 ⇒ 无退出码，不伪造**——宿主侧判据 = `child.pid` 未定义）。
  三成员同形 = 独占行 + 括号 + 状态词；**退出码槽只接受数字**（`error.code` 非数字 ⇒ 不许塞进退出码槽）；判据布尔 = `toolFailureStatus(text)` ∕ 摘要状态文本 = `toolStatusText(text)`——两出口同引语法单源 `STATUS_LINE`（已落；零第二份语法）。
- 活卡（`finishToolCard`——核单源 `thincoder-render-core/flow/tool-card.mjs`；本端 `ui.js` 转口）与恢复卡（`buildFinishedToolCard`——核单源 `thincoder-render-core/flow/tool-card-restore.mjs`；本端 = 2 行 shim）**同读该判据**——两卡面终态同形（F-W4）的机器面。
- 失败面三信号（同一判据派生，零散点）：状态词 = `tool.error` + 红；**保持展开**（不自动折叠）；摘要含状态位（`→ bash: <末行输出> (exit code 1)`；无输出时 `→ bash: (exit code 1)`——不读作 `(empty)`；spawn 失败则 `→ bash: (spawn failed)`——`bash: ` 前缀随 X7 摘要分派落位）。
- **CLI 对位**：失败面口径同源（末行输出 + 状态位入摘要——`thincoder-cli/src/tui/tool-summaries.mjs:60-68`）；端差二条：① 卡态为本端独有形态 = **实证例外**（宿主差——DOM 交互卡 ∥ 终端行流；证据 = 两实现树）；② 成功面 `(exit code 0)` 拼接口径 = **消**（已落——归一以 CLI 标尺）；登记面 = `docs/vsc/requirements/WEBVIEW.md` §4。
  **spawn 形态两端同读**：CLI 摘要 = `bash: (spawn failed)`（同档「末条非包装行」规则 ⇒ 端侧零改即得可见信号）；本端 = 红 + 保持展开 + 同文本。
  **失败信号数端差**：本端 = 判据（红 + 保持展开）+ 摘要两处；CLI = 摘要一处（TUI 无卡态、完成行不判色）——**实证例外（宿主 + 行为：信号数差 = 卡态面派生〔DOM 卡 ∥ 终端行流〕；失败可见性两端在位——CLI 摘要状态位 ∥ 本端判据红）**；登记面 = `docs/vsc/requirements/WEBVIEW.md` §4。
- **摘要族单源与分派（X3 · X7）**：活卡与恢复卡的**一行式摘要** = 核单源 `thincoder-render-core/tool-summary.mjs:35` 的 `formatToolSummary(name, text)`（本端 `webview/tool-summary.js` = 3 行再导出 shim；前身 = 端侧叶，自 `ui.js` `resultSummary` 整段迁出——500 行硬限）；
  分派族 = `advisor`（`N critical, N advisory, N style` / `passed` / 拒因首句）· `read`（`N lines`）· `write`（`wrote N bytes`）· `grep`（`N matches` / `1 match` / `no matches`）· `glob`（`N files` / `1 file` / `no files`）· `bash`（`bash: <末行>`）·

 默认分支（`name: <首个非空行>`）——
  **字面与分派逐字承 CLI**（`thincoder-cli/src/tui/tool-summaries.mjs`——跨端等值断言 = 直驱对端纯函数对拍，禁复制常量）；状态位族语法单源 = 核 `thincoder-render-core/lib.mjs:66` `STATUS_LINE`（判定面 `toolFailureStatus` ∕ 显示面 `toolStatusText` 双出口——已落；不另立第二份状态语法）。

  **端差**：成功面 `(exit code 0)` 拼接口径 = **消**（已落——归一以 CLI 标尺）；`verify` 分支本端**补落**（已落——对齐 CLI 分派族）。
  **重复形态登记**：摘要族两端各一份（CLI `tool-summaries.mjs` ∥ 本端 `tool-summary.js`）——并核 = 跨批结构面（在册）。
- 边界：**非 `Error:` 前缀仍判失败**（F-W16 判据扩的本体）；仅「独立成行」的状态位触发——正文里提及 `(exit code 1)` / `(spawn failed)` 不误报；
  **判据只认状态位、不认产者措辞**（`Command failed:` 前缀不入判据——跨端措辞耦合路线已否，见 D-W19）；

`(stopped)`（`execute` 工具的用户中止自报形——`thincoder-core/tools/execute.mjs:142`）**不在判据集内**（该面判据扩不做——宿主 bash 的用户中止已对齐核形（`killed: user interrupted`——`thincoder-vscode/src/tools/shell.mjs:93` · `:236` · `:306-307`，产者现位）
  ⇒ 两端中止面形态端差 = **消**（已落——「宿主中止形对齐核形」径；`(stopped)` 字面全档零命中。

「并入失败族」径不取——须先推翻既有 `(stopped)` 裁定）。
  **非数字退出码槽不入判据**：`(exit code ENOENT)` / `(killed — timeout 400ms)` 均不判失败——判据只认族形态；该二形在仓内不可达，再现 = 新残（登记路径同 §2.6 #11 体例）。
- **形态可达性两则**：① spawn 失败形态**天然短**（子进程未启动 ⇒ 无输出体）⇒ 人读线瘦身截尾（`thincoder-core/session-segments.mjs:53-55` 头 500 字符 + 尾标记）对该形态**不可达**——恢复卡同判据在此成立（长结果面残项另案）。
  ② 核 `thincoder-render-core/tool-summary.mjs:32` 的 `BASH_MARKER`（bash 分支的包装行过滤正则；本端 `tool-summary.js` 再导出）是状态位族在**消费面的第二份枚举**（族扩面时须同看）。

  **「摘要零影响」只覆盖无输出形**：`(spawn failed)` 不经包装行过滤（`BASH_MARKER`）⇒ 末行 = 状态位本体、内容位空 ⇒ 摘要 `→ bash: (spawn failed)`（两产者的 spawn 失败面均无输出体）；

  **若该状态位携非空输出段**：末行仍为状态位 ⇒ 末行输出**不入摘要**（与 `(exit code N)` 被 `BASH_MARKER` 滤掉后取末行输出**不同形**）——已知形态差
  （消解 = 包装行过滤并入判据单源；**新触发** = `tool-summary.js` 下次扩面——摘要族新增分支 / 状态位族扩第 4 成员）。

- **终端模式可见路两形**：终端模式两形（`thincoder-vscode/src/tools/shell.mjs:89` ∕ `:100`）——**消（已落——按族形态改写两形；真机走查 = 收口残留，父侧安排）**。

### 4.4 恢复面用户文本清洗（人读线 → 显示面 · F-W15）

- **契约**：同一会话中，用户消息的**恢复面**文本 ≡ 活面气泡文本（= 用户所打原文，`@路径` 保持简洁形）。
- **落点 = 端侧显示边界**（`thincoder-vscode/src/extension/panel-session.mjs` 的 `sendHistoryPage` user 分支——与既有 `stripEditorInjection` 同点同序：先剔机器注入、再还原 `@` 引用）；**剥离函数与注入产者同档**（语义同源 = `thincoder-core/file-refs.mjs`——上提后核单源；本端 `thincoder-vscode/src/extension/file-refs.mjs` = 薄壳（探针注入 ∕ re-export）——语法与其逆变换同住一处）。
- **消费面二处（同源剥离）**：① 恢复面显示（`sendHistoryPage` user 分支——上条）② **标题源文本**——回合尾自动标题读首条真实 user 消息处（`thincoder-vscode/src/extension/panel-session-write.mjs` `generateTitle`）同接同档剥离函数 ⇒ 标题不得由 `[File: …]` 文件正文生成；两处同读一函数（零第二实现）。
- **标题链（双端同一套机制）**：源 / 生成 / 触发 / 写 / 读·展示**五环单源**——机制条文单源 = `docs/core/design/SESSION.md` §6.7（本节只记 VSC 端壳面）：源 = 内存人读线（`fullHistory` 经 `keepReal` 过滤）首条真实 user 消息、谓词单源 = 核 `isRealUserMsg`；
  生成 = 核 `generateTitle`（端壳只做 key / provider 解析）；触发 = 会话尚无标题即尝试（与 CLI `ensureSessionTitle` 同判据）；写 = 标题值随回合尾整档 `saveLines` 落盘（`extra.title`——**无第二写**）；

  读·展示 = 列表面（`pushSessions`）同回退链 + 顶栏常显（槽 `title` 回退链——空窗差 = **消**（**已落**——CLI 标题段同款回退链（`render-frame.mjs` `buildStatusLine`）；对位 = `docs/cli/design/TUI.md` §7.4））。
- **落点判据（不落核 `history-window.mjs`）**：① 该窗口面现消费方 = VSC 端独有（核内 re-export 只供 `isRealUserMsg`；CLI 恢复渲染不经此档——全仓零 CLI 消费）⇒ 落核零收益；② 人读线盘面与机读线（模型输入）**零触碰**。
- **端差（N-W6）**：人读线为 CLI 与本端**共文件**、本端只动端侧显示边界 ⇒ **CLI 恢复渲染仍显 `[File: …]` 展开文**（同一消息两端不同形）
  ——**消：CLI 恢复渲染同款剥离——CLI 侧补对位剥离（**已落**：`startup.mjs` `restoreLines` 同款剥离）**；登记面 = `docs/vsc/requirements/WEBVIEW.md` §4（父侧同轮写入）。（桌面并入本端剥离侧 ⇒ 端面 = **VSC + 桌面**——CLI 侧补对位剥离后两端一致。）
- **剥离判据（fail-closed）**：仅当文本尾部为**注入摘要块**（`[Referenced files:` 头 + 逐行 `  - <raw> (<N> chars)` + 尾 `]`）时，按「`[File: <raw>]` 头 + 围栏 + 恰 N 字符正文 + 收尾围栏 ⇒ `@<raw>`」逐条还原并删摘要块；**任一条不吻合 ⇒ 整条原样返回**（用户手打的 `[File: x]` / 形近文本零误伤）。
- 活面与展开本体零改：`injectAtRefs`（核单源 = `thincoder-core/file-refs.mjs`——缺面族批补上提）的返回值（= 落线文本 / 模型输入）逐字不变。

### 4.5 工具卡结算与内容呈现（M1 · M3 · X2 · X5）

- **M1 结算与回合尾清扫**：「已结算」= 卡对象 `done` 旗标——**唯一写点** = `finishToolCard` 首行置真（核 `thincoder-render-core/flow/tool-card.mjs`；本端 `ui.js` 转口），建卡 `addTool` 置 `done:false`；
  回合尾清扫 `sweepUnsettledToolCards`（`thincoder-vscode/webview/streaming.js`）在 `finish()` 内**无条件**执行（complete / aborted 两路径同规 = CLI 标尺 `thincoder-cli/src/tui/tool-display.mjs` `sweepToolBlocks` + 回合 `finally` 恒调用）：

  未结算卡 ⇒ 状态词 `tool.interrupted` + 摘要 `→ (interrupted)`——**不套错误色**（CLI `interrupted` = 独立旗标，非 error 面）、正文原样保留；已结算卡零改写；重复命中幂等。
  - **文案键** `tool.interrupted`（端特有——VSC 本地档，不进核 i18n 容器）。
  - **刷新路径断言**：工具卡在**消息区**，不在活动区重建链上（`refreshLiveHeaders` 只遍历 `S._subBlocks`；`resetActivity` 只清区子树）⇒ 1 s 同点刷与覆盖式重建**均不改**清扫后的状态词。
  - **边界**：不动 CLI；不引入活动区联动；不加 TTL / 自动消失。
- **M3 对象 chunk 端边界归一**：`toolOutput` 载荷在**端边界**归一为串（`thincoder-vscode/src/extension/panel-callbacks.mjs` `onToolOutput`：`typeof chunk === "string" ? chunk : String(chunk?.text ?? "")`——**CLI 逐字先例** `thincoder-cli/src/tui/tool-events.mjs:326`）；`kind` 随行保留为可选字段（webview 现只消费 `text`——不新增消费面）。
  核 emitter 零改（对象 chunk = 核契约，两端各自归一）；relay 分流面零改（对象已在 relay 内归一）。
- **X2 评审轮次标签**：advisor 卡头与状态行共用端侧单源 `advisorRoundTag(round, model)`（`thincoder-vscode/webview/ui.js`）——字面 = CLI `roundTag` 逐字 `(round N · model)`；
  无 `model` ⇒ 降级形 `(round N)`（不显 `null`）；载荷 `round` / `model` 仅 advisor 携（宿主 `advisorMeta`：`round = _advisorRound + 1`；`model` 取核 resolver，失败降 `null`），非 advisor ⇒ 零字段（卡头逐字节同前）；
  状态行字面 = `advisor review (round N · model)`（= CLI `thincoder-cli/src/tui/tool-events.mjs:148` 逐字）。

  刷新路径：卡头一次性建（无重建通道）；状态行载体 = `S._currentTool`（单源）⇒ 消息驱动与 1 s 拍同值。
- **X5 结果截断提示**：>64KB 工具结果在**宿主切片点**（`panel-callbacks.mjs` `onToolResult`）立**事实旗标** `truncated`（非串结果先经 `String(r ?? "")` 归一——falsy 非串（`0` / `false`）文本 = `"0"` / `"false"`，记录形）；webview **旗标驱动** ⇒ 正文尾标记行 + 摘要位尾部标注（文案键 `tool.truncated`——端特有）：**恰 64K 与超出同判**（不复辟 `capText` 的 `<= max` 边界洞）。
  恢复卡同判据（宿主 `sendHistoryPage` 切片点同立旗标）——**恢复面 = 旗标驱动、长度维只作旧载荷回落**。`MAX_TOOL_OUTPUT` 数值零改；工具结果入 history 完整性零改（截断只在显示面）。
- **边界（本节）**：不动 CLI；不改 `toolOutput` 流式截断（`chat-messages.js` 既有标记）；不引入行维额度；不动 64K 额度。

### 4.6 状态行 context 段单口径（M2）

- **单一判据**：`context X%` 分子 = 核 `historyReading(...).tokens`（校准后的历史估算——`thincoder-core/token-window.mjs`），分母 = 同一次调用带出的 `historyReading(...).window`——**与 CLI 状态行同源**；`providerSpec(provider).context` 只在核单点出现，端侧不二次派生同一个量。

  - **CLI 面同源坐标**：`thincoder-cli/src/tui/render-loop.mjs:111` 缓存 → `thincoder-cli/src/tui/status-line.mjs:146`-`149` 渲染；端侧零自算式。
  - **派生单点** = `thincoder-vscode/src/specs.mjs:83` `ctxUsageForHistory(history, provider, ratio)`——委托核 `historyReading`，三参无缺省；返 `{ tokens, pct }`，`tokens` 为 0 ⇒ `pct` = `null`。消费点 = 宿主 `panel-callbacks.mjs:234` `onUsage`。

  - **名字分工**：`ctxPercentForHistory`（同档 `:89`）= 该件的 `.pct` 薄转口（名面保留，非第二实现点）。**本段不设第二个百分比算式**：provider 报告的 `prompt_tokens` 不入本段——同一会话在同标签下读到两个百分比，正是两式并存造出来的差。
  - **消差本体**：同一会话不得在同标签下读到两个百分比——单口径消的是「provider 报告值 `prompt_tokens` ∥ CLI 估算」两式并存面。
  - **刷新路径**：状态行唯一载体 = `S._lastCtxPct`（`thincoder-vscode/webview/status-bar.js`），消费面 = `usage` 消息驱动 + 1 s 拍（`running` 门内）⇒ 两路径同值；渲染句 = `context X% Yk`（`Yk` 绝对数随补——对齐 CLI 形）+ ≥80 警示色。
- **边界**：不改 CLI；不改 ≥80 阈值；不引入核改动。

### 4.7 停滞轻显形段（在飞回合静默读数）

- **语义单源 = `docs/cli/design/TUI.md` §7.7**（静默定义 ∕ 三类重置点 ∕ 阈值 10s ∕ 句式键 ∕ 终态消失 ∕ 一致性表——本段不重述，只落本端实现面）。
- **显示位** = 状态行 `#status-line`——耗时位（`status-bar.js:53` `Elapsed Ns`）之后、任务徽标之前；词面 = `t("status.quiet", { s })`（核字典键经投影面直取——本端本地档零同键副本，沿「32 键双源冻结」摘除方向）。
  **载体（本端）**：新增 `S._lastOutputAt`（`webview/state.js`）；起算锚 = `input.js:100-101`（`S._turnStart = Date.now()` 邻位同置）；
  重置点 = `chat-messages.js` 分发命中三类可见输出消息（`token` ∕ `reasoning`；`toolCall` ∕ `toolOutput` ∕ `toolResult`；`subagent` ∕ `subagentApproval` ∕ `toolPanel`（`sub:` 前缀））⇒ 置现刻；

回合尾同清（`streaming.js:150` 邻位）。
- **跳秒** = 既有拍 **1s**（`panels.js:55-58` `_panelTimer`——`running` 门内重绘；拍值与另两端同口径——跳秒步进单源 = `docs/cli/design/TUI.md` §7.7）。
- **判据（可机检）**：`S._turnState === "running"` ∧ `now − (S._lastOutputAt ?? S._turnStart) ≥ 10000` ⇒ 段在场（首显 = 10s）；不足阈值 ∕ 非 running ∕ 回合尾 ⇒ 零段（负向锁）；真机 = 父侧真跑闭合（D16 义务）。
- **边界**：纯读数——零控件 ∕ 零打断 ∕ 零警示色；**零协议改**（本段纯 webview 自算——无新消息 ∥ 无新载荷 ∥ 无新通道）；核件 ∕ 宿主零改；段位对位表行 = `WEBVIEW-PROTOCOL.md` §6.1（已补）。

### 4.8 provider 态横幅三态 + 动作（无有效 defaultModel）

- **判据单源 = `docs/core/design/PROVIDER.md` §6.22**（U3 宽松+明示：`ok` ∥ `fallback` ∥ `invalid` 三态 + **invalid 类合成式**；本段只落本端呈现面与数据面）。
- **数据面**：`providerStatus` 消息载荷增 `providerState` 键（`{ state, channel, model, reason, invalidReason }`——主侧 = `thincoder-vscode/src/extension/settings.mjs` `providerStatus()` ∥ `pushStatus`，经核统一解析出值 + `providerInvalidReason` 快照）；刷新点 = `pushStatus` 现推点（面板就绪 / provider 写后 / 准入落账后）——**零新通道**。
- **横幅三态**（`#provider-banner` · `webview/ui.js` `showBanner`——**state 单判据直映射**）：**invalid 类**（`state === "invalid"` ∨ `invalidReason` 非空）⇒ 现键 `banner.notConfigured` 逐字不变；
  `state === "fallback"` ⇒ **两键按载荷 `model` 在场分**——在场 = **`banner.defaultModelFallback`**（zh `⚠ 默认模型未设置或无效 — 正在使用可用渠道` ∥ en `⚠ Default model missing or invalid — using an available channel`）；

  `model` 缺 = **`banner.defaultModelFallbackNoModel`**（zh `⚠ 默认模型未设置 — 渠道已就绪、模型未定` ∥ en `⚠ Default model missing — channel ready, model not chosen`）
  + **动作钮**「选择默认模型」（新键 `banner.chooseDefaultModel`——zh `选择默认模型` ∥ en `Choose default model`）→ **会话级模型菜单**（开径 = 模型钮同径——`webview/ui.js` `showBanner` `onChoose`，注入点 = `webview/chat-messages.js`；选定 ⇒ 同拍写回 `defaultModel`——§4.10）；
  `state === "ok"` ⇒ 现键 `banner.configured`（不变）。
- **`keyOk` 判据（钉定）**：`keyOk := 非 invalid 类`（= `state !== "invalid"` ∧ `invalidReason` 空）——端侧布尔 = **核态派生（单判据）**，去第二判据；欢迎面 ∥ 向导面既有消费随此派生（`notConfigured` ⟺ invalid 类）。
- **动作落点**：钮**开**会话级模型菜单（= 模型钮同径开合——单一开径 ∥ 零第二实现；锚 = 同面模型钮）；**设置面零模型选择控件**（默认模型行撤场——单源 = `docs/vsc/design/SETTINGS.md` §2.2）；选定 ⇒ 同拍写回 `defaultModel`（判据句 6）⇒ 横幅即时退场（§4.10 第四刷新点）；**钮重指决策单源 = `docs/desktop/design/SETTINGS.md` §1 KD-80 ⑤**（由 = 撤设置面模型面后原指向成死端，用户定音即「模型选择归会话界面」）。
- **链（机制面，本段不重述）**：`panel-turn-stages.mjs` 接入面回退链 = 核函数 ∥ `presets.mjs` `resolveDefaultModel` = 核转口（单源 = `doc:docs/core/design/PROVIDER.md:§6.22`）；**可用性不得降**（渠道+key 已配 ⇒ 直接可发——事实标准不回退）。
- **边界**：发送失败面（`error.provider` 词 ∥ `needsSetup` 径）零改；welcome 面板两键零改；`i18n-dom` 横幅键刷新面随三态键扩（`data-banner-key` 取值闭集）。

### 4.9 状态行 thinking 占位改静态

- **形态**：**静态省略号**——`t("status.thinking") + "…"`（同两处既有静态形：活动块状态词 `W.thinking` ∥ 推理块 summary）；`.loading-dots` 件与 `@keyframes dots` 块**删除**（全树唯一消费者即本段）。词键零改。
- **判据**：单元测试（渲染面）——`_phase === "thinking"` ⇒ 段在场且零 `.loading-dots` 节点；`_phase = null` ⇒ 段缺席；全树 `loading-dots` / `@keyframes dots` 零命中（grep 面）。
- **边界**：同台账「最小窗口尺寸缩放异常」= 静态读不出 ⇒ 待报方复现材料——**不在射程**（在册）。

### 4.10 会话模型选定写回

- **判据单源 = `docs/core/design/SESSION.md` §6.21 判据句 6**（用户显式选定 ⇒ `defaultModel` 同拍写回）——本段只落本端触发支 ∥ 写面 ∥ 刷新点。
- **触发支** = `panel-messages.mjs` case `selectModel`（webview 下拉选中——显式入口单点）；**写前读** = 既有 `loadSlot` 读面（写前槽复合基线）；**实变判据** = 槽复合串 `provider:model` 变化（档缺 ⇒ 判真）；定序 = 槽先配置后（`_saveLines` 成后写回）。
- **写面单点** = `settings-panel-write.mjs` `carryoverDefaultModel({ provider, model, slotBefore, lastPushedPrefs })`——复合等值（现值 `loadRaw().defaultModel`）⇒ 零写；**播种回声门**（槽基线档缺 ∧ 选定复合命中 `lastPushedPrefs`）⇒ 零写回；写经 `vscPersistRaw`（`$schema` 注入保持）；写后探复用 `probeDefaultModelChannel`（M9 同律——准入落账）。
- **刷新点（第四刷新点同判）**：实写发生 ⇒ `panel._pushStatus()`（providerStatus 重推——`fallback` 横幅即时退场）。
- **失败面**：`{ ok:false, reason }` + `console.error`（零静默）——不反扑槽写（会话侧照旧）。
- **回声 ∥ 系统写零写**：`models` 推送 → `handleModelsMessage` 自动同值回写（§4.2 ②）⇒ 槽面未变 ⇒ 零写；
  **boot 播种径**（无槽复合 ⇒ workspaceState prefs 随 `models` 下发 ⇒ 回写携该值）⇒ 选定复合命中**宿主簿记**（最近下发 prefs 复合——推送点 `settings.mjs`，沿 `_lastModelsPayload` 先例）∧ 槽基线档缺 ⇒ **播种回声门判零**（写面单点第三门）；首回合空槽播种（`resolveTurnModelAndStamp` → `saveLines`）不经 `selectModel` 消息 ⇒ 零触。
- **边界**：空槽短路（`_ensureSlot` 未解析窗口）⇒ 零写回（无槽面）；标语面文案零改（横幅键 ∥ 词表不动）。

### 4.11 首启板两路（F-W20）

- **形态**（用户裁定——图形端 = 两卡并排；都不预选；「以后再说」第三态保留）：`#welcome-panel` 路由屏 = 两卡并排（`div.welcome-routes`）：
  团队卡（标题「登录团队服务器」+ 说明「用团队发的账号登录——模型由服务器提供，不用自己填 key」+ 行动钮——锚 `button[data-route="team"]`）∥ 本地卡（标题「配置本地 provider」+ 说明「自己填 API key，不依赖团队服务器」+ 行动钮——锚 `button[data-route="local"]`）；跳过钮 = 既有 skip（`welcome.skip`——zh「以后再说」∥ en「Later」，与桌面 ∥ CLI 同字面）。
- **换取（同屏内——不叠弹层）**：点团队卡 ⇒ 换取区换团队表单（三字段（server ∥ username ∥ password）+ 登录钮 + 失败行 + 「← 换一种方式」回退）；点本地卡 ⇒ 换取区换**既有表单**（preset select + key + 保存——现欢迎板内容原样迁入换取区；零重构）；「← 换一种方式」⇒ 回路由屏（**先保留**：已填 server ∥ username 保留；密码恒清——沿 B1 口径）。
- **提交链（复用既有）**：团队表单提交 ⇒ 出站 `teamLogin { server, username, password }`（既有——本档 §2.20）；回执 `teamLoginResult` ⇒ 成 ⇒ 既有 `providerStatus` 闸放行 ⇒ 板退场（`maybeShowWelcome(status, keyOk)`——`keyOk` 真 ⇒ `hideWelcomePanel()`；`thincoder-vscode/webview/onboarding.js:47-53`）；
  `notice`（同名冲突）⇒ 板内就地提示（登成当刻——逐字同句；一次性事件）；败 ⇒ 板内就地错误行（四句逐字——`settings.team.fail.*` 语汇）+ 停留可重试。
- **接线**：`thincoder-vscode/webview/onboarding.js`（+route 状态 ∥ 换取 ∥ 团队表单提交/回退）+ `thincoder-vscode/webview/index.html`（#welcome-panel 结构）+ `thincoder-vscode/webview/settings.css`（卡样式段）
  + `thincoder-vscode/webview/state.js`（ctx 引用）+ `thincoder-vscode/webview/chat-messages.js`（`teamLoginResult` 既有两消费位——+板面钩）；**零新协议消息**。
- **跳过/以后再说**：⇒ 既有 `_welcomeDismissed`（webview 生存期——板不再显）；登录路仍可达 = 状态栏团队 item（§4.12）；**零第二引导面**。
- **判据（机检 ∥ 真机）**：机检 = 单元测试档（happy-dom：路由屏两卡在场 ∥ 零预选 ∥ 换取（表单在场 ∧ 路由退场——同屏）∥ 回退（路由在场 ∧ 已填保留 ∧ 密码清）∥ 本地路既有表单逐字等价（负控）∥ 失败行四句）；真机 = 收口轮实走（首启 → 两路 → 登 → 模型面）。
- **边界**：不改 `localStorage keyOk` 交棒判据 ∥ 不改设置面板 ∥ 零新协议 ∥ 不改 preset 表单语义（本地路零改）。

### 4.12 团队常显与直达（状态栏 item + 命令 · F-W21）

- **常态化指示**（宿主侧——`thincoder-vscode/src/extension/team-surface.mjs`）：`vscode.window.createStatusBarItem`（Right，优先级 = 98——台账 99 邻位）——三态：
  ① 未登录 ⇒ 文本「登录团队服务器」（入口）② 已登录 ⇒ 成员名（`member.name ?? member.username`；**tooltip = 服务器 + 端标签**——服务器形（host），不搬 URL 全串）③ 已失效（`verify === invalid`）⇒ 文本「已失效——重新登录」+ `backgroundColor`（`warning` 族——沿 VS Code 警示面）；命令 = `thincoder.team`（点击即流）。
- **登/退直达流（命令 `thincoder.team`）**：起手 = 活校验（`teamVerify`——触发点制）；态分流：未登录 / 已失效 ⇒ 登录流（`showInputBox` 三问：server（预填留存值）→ username → password（`password: true`））
  ⇒ `teamLogin`（核）⇒ 成 ⇒ 复读 + 刷新 item + 推 `teamStatus`/`providerStatus`（设置面板随动——既有推送链）；`notice`（同名冲突）⇒ `showWarningMessage` 提示（逐字同句；一次性事件）；已登录 ⇒ QuickPick（「退出登录」）⇒ `teamLogout` ⇒ 刷新 + 推送 + 吊销未达提示（逐字）；失败 = 四句逐字（`showErrorMessage`——词表复用）。
- **登/退不再经设置面板**：面板团队卡 = 管理面（label ∥ 详情——`docs/vsc/design/SETTINGS.md` §2.20）；「轮换」在卡内（已登录在场——确认一步 + 结果行；机制单源 = `docs/core/design/TEAM.md` §2.7）。
- **接线**：`thincoder-vscode/extension.mjs`（+`registerCommand('thincoder.team')` + 初始化/销毁 item）+ `thincoder-vscode/package.json` contributes.commands（+1）+ `thincoder-vscode/locales/en.json ∥ zh.json`（+键）
  + 复用 `thincoder-vscode/src/extension/team.mjs`（teamStatus/teamLogin/teamLogout + **`teamVerify` 转口**——转口四件；`team-surface.mjs` 经转口取核，与桌面 `thincoder-desktop/src/main/team.mjs` 同拍）∥ `thincoder-vscode/src/extension/settings.mjs` `pushTeamStatus`（既有——单一实现）；**零新 webview 协议**。
- **判据（机检 ∥ 真机）**：机检 = 单元测试档（item 三态文本 ∥ tooltip 含 host ∥ 命令注册 ∥ 流：桩 `showInputBox` 三连 ⇒ `teamLogin` 调用序 ∥ 已登录 QuickPick ⇒ `teamLogout` ∥ 失败四句）；真机 = 收口轮（命令面板 → 登录 → item 变名 → 点击 → 退出 → item 回入口）。
- **边界**：不改 webview 消息面 ∥ 不改 panel 推送链 ∥ 状态 item 不搬 URL 全串 ∥ 校验触发点制（零周期轮询）。

## 5. 子代理活动块与活动区

子 agent / consult / escalate / advisor-async 的活动块**出生即 append 到固定活动区 `#subagent-activity` 区尾**（`thincoder-vscode/webview/activity.js:65`），在消息区与输入区之间——**live 固定可见，不随会话流滚动丢失**。

### 5.1 生命周期（出生 → live → 终态 → 归档）

两态机（live → frozen）**不变**；`awaitingDigest` 是冻结态上的**单标志**（非第二状态机）。终态去向由调用方定：

| 段 | 事件 | 动作 | 锚 |
|---|---|---|---|
| 出生 | `started`（**不限角色族 / 不限 `pool`**——§5.3 出生面）或 `queued` | 建块 append 区尾（区钉底 / 未钉底计数钮 + 块级跟滚监听接入） | `activity.js:65-71` |
| live | chunk / turn 帧 / 审批态 | 覆盖式刷新头词与状态区（不重挂元素） | `activity.js:92-93` ∥ `:206-209` |
| 折叠 | 终态 | class `sub-live`→`sub-frozen` + `open=false` + ⏹ 移除 + 头词换 | `activity.js:85-91` |
| 准终态 | `settled` | 折叠 + `awaitingDigest`（等待消化——块**不移动**） | `activity.js:92-93` ∥ 核 `state.mjs:249-251` |
| 归档 | 起跑窗 `done` 命中 awaiting 块（起跑快照逐条补发） | `insertAfter(块, 本轮边界行)`——落位 = 当刻流末（行族在流末时即「放族后」；多枚到达序） | `activity.js:104-110` |
| 归档 | 其余终态（`done`/`error`/运行中 `cancelled`/`terminated`/`failed`/`answered`） | 折叠 + 即时归档（尾追 `#messages`） | `activity.js:94-96` |
| 取消 | `cancelled` 且 `was: "queued"`（从未启动） | 头移除（不冻结） | `activity.js:97-100` |
| 幂等 | 迟来消息命中已冻结/已移除条目 | live / chunk ⇒ `ensureBlock` 返 `null`——丢弃，不复活不重建 + **丢弃留痕**（`drop-frozen` / `drop-tombstone`——§5.3「非出生面禁静默」）；**终态例外**（元素被移除 = tombstone）⇒ 补桩 + 立即归档 + 痕迹——见 §5.3「终态必现」 | `activity.js:213-219` |
| 新代接管 | `started` 命中同名**已冻结**键（**不限 `pool`**——D-W26 口径） | 建新块改绑键 + 记 `takeover`；旧 awaitingDigest 块即时归档 + 新块记 `oldReclaimPending` | `activity.js:78-81`（born / takeover 支） |
| 补桩 | never-born 终态（无 map 条目） | 按 §5.3 终态补桩**状态表**补出**已折叠**桩 + 立即归档 + 记 `late-terminal-stub`（前置 = `id` ∧ 角色段 `[\w-]+` ∧ 回读一致——射程含 consult / escalate） | `activity.js:78-81` ∥ `:94-96`（never-born 补桩；判定在核 `subblocks/state.mjs:256-281`） |
| 会话退出 | `suspension active:false + freeze:true` | 区**全体**归档（live → 折叠；awaiting → 归档；已在流者不动） | `activity.js:231-234` |
| 重置 | 回合中止（无挂起会话）/ 会话清 | `resetActivity` **只清区子树**（+ 清 map + 区内孤儿防御清）——流内归档块（会话历史）不动 | `activity.js:253-263` |

- **归档落点二值**（`activity.js:104-110`）：① 起跑窗且本轮边界行 `S._digestBoundary` 有效（`isConnected`）→ **边界行之后**（`insertAfter` 语义——多枚到达序：逐枚落于前枚之后）；② 其余（普通终态 / 补桩 / 会话退出 flush / 边界失效 / 无边界）→ `#messages` 尾追。同批多块 = 消息到达序；幂等 = 已归档（`parentNode === messagesEl`）即 no-op。
  - **起跑窗（host 侧——主面）**：宿主起跑点（`driveTurn` boundary 支——`thincoder-vscode/src/extension/suspension.mjs:203-207`；起跑快照逐条补发循环；锚 = 与起跑 `postMessage({type:"digest",status:"start"})` 发射行（`:195`）同段）
    对**起跑快照**（起跑刻 `history._pendingAsyncResults`）逐条补发 `{type:"subagent", status:"done"}`——**直投不入队**（非出生事件，属收尾通知）；
    **消化回收（兜底幂等）**：`thincoder-vscode/src/extension/suspension.mjs:124-131`（`reclaimDigestedBlocks` 定义——`hooks.reclaim` 实参）逐条补发同形 `done`（起跑窗漏口 ∥ 迟结算面；已归档者 `archiveBlock` 幂等 no-op）。

  **consult 会话条目**（本体无 webview 行）⇒ 按其 `childIds` 逐子块补发同形 `done`（子块 settled 驻留 ⇒ 消费点归档；机制单源 = `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.8）。
- **消化轮起跑档位（F-UC8）**：宿主起跑载荷携 `tier` ∈ `ask` / `digest`（**按因两档**——ask 因优先；旗标取核既有载体，**禁新造第二判据**；判据与 CLI **同源同式**）；webview 按 `tier` 取键：`digest.turnLabel`（digest 档 / 缺省档）/ `digest.turnLabelAsk`（ask 档——**携参**）。
- **ask 档携参**（载荷 `from` / `msg`——仅 ask 档条件携带）：`from` = 提问者 `role#id`；`msg` = 问题摘要（显示串——单行 + 截断 ≤120 字符，核单点 `upstreamAskLabelVars`）。
- **计数元素随 `n > 0`**（两档同规）：`n > 0` ⇒ 建本轮计数元素（`dataset.n` = 起跑数）；`n = 0`（ask-only 轮）⇒ 不建（`_digestRoundEl` 置空）∧ end 侧**零动作**（禁兜底建元素——`dataset.n = "?"` 幻影行禁出）。起跑判据 = **本轮起跑即发**（`n` 可 0）。
   **零影响证据**：起跑窗补发按起跑快照 ⇒ `n = 0` 轮零 `done` 投递；**边界行写点唯一**（start 分支，每轮重写——边界行 = 计数元素（`n > 0`）∥ 无 ⇒ 标签元素）⇒ 无跨轮残留。**元素级契约（标签行 / 计数行 / `start`·`end` 语义）单源 = `WEBVIEW-PROTOCOL.md` §5**（本档只记档位与元素约束）。
  - **行/元素出即留（显示面）**：痕元素 = 流内事件，**出即留**——标签 ∥ 计数 ∥ cap ∥ 终态：**不改 ∥ 不删 ∥ 不退场**（零清理机器：无旧轮痕元素退场 ∥ 无就地换文）；新轮起跑 = **追加**（旧轮元素留置原位；逐行 `appendChild`）；
    **终态 = 追加终态元素**（`.digest-status` + `digest-done` ∕ `digest-failed`——词键 `digest.done` ∕ `digest.aborted` 直取；**不动原计数元素**）；**重建复列 = 全量（未结轮照现）**（§5.7——记录序 ≡ 恢复序）；**记录面照留**（§5.7 记录 ∥ `recordAppend` 零动）；口径 = 用户「CLI/VSC也跟。」。
  - **残余元素**：`end` 载荷携 `unsettled > 0` ⇒ 追加残余元素（`.digest-status` 族——词键 `digest.residue`——核字典直取）；`= 0` ⇒ 零元素（零噪音）。机制 = `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.31。
  - **裁 A**：归档时点 = 起跑窗 ∥ 落位 = 当刻流末（起跑刻语义——起跑刻行族在流末 ⇒ 即「放族后」——`insertAfter` 边界行 = 计数元素 ∥ 无 ⇒ 标签元素）
    ∥ **迟到面 = 族锚位**（消化回收 `done` ⇒ `atBoundary`——边界行之后 ∥ 边界失效/无 ⇒ 尾追；会话退出 flush = 尾追——核 `subblocks/state.mjs` `:238` ∥ `:300-304`）——与桌面同形同义（口径 = 用户「A」；单源 = `docs/desktop/design/RENDERER.md` §1.1 插入点纪律条）。
- **终态补桩状态表**（核 `subblocks/state.mjs:256-281`——判定 `:259-263`；补桩 `:275-279`；前置 = `id != null` ∧ 角色段合法（`[\w-]+`）∧ 回读解析一致——`FAMILY_ROLES` 前置退场（射程含 consult / escalate——见下「终态必现」）；不满足 → no-op + 记 `drop-unknown-role`）：

| status | 上下文 | 无块时 | 折叠 kind |
|---|---|---|---|
| `done` / `settled` | — | 补桩（折叠 + 立即归档） | done |
| `error` / `failed` | — | 补桩 | error |
| `cancelled` / `terminated` | `was ≠ "queued"`（含 `was` 缺省） | 补桩 | stopped |
| `cancelled` | `was === "queued"`（从未启动） | 不补（no-op） | — |
| `answered` | — | 不补（有块折叠、无块 no-op——回复走 digest 呈现） | — |
| 前置不满足 | 角色段非法（非 `[\w-]+`）/ id 缺失 / 回读解析不一致 | 不补（no-op） | — |

- **旧代回收吞守卫**（核 `subblocks/state.mjs:219-228`）：接管归档时旧块若在 awaitingDigest（回收在途）→ 新块记 `oldReclaimPending`，其后该键**首条 `done` 视为旧代回收 → 吞**（no-op + 清标志）。残余登记：旧代回收永不至（abort 等）× 新代 `done` 后至 → 可能误吞一次（降级 = 新块滞留区，会话退出 flush 兜底归档——不丢内容）。
- **诊断痕迹**：痕迹面 = **`thincoder-vscode/webview/activity-diag.js`（已落：单一写点 + 环形载体 `SUB_TRACE_MAX = 50`）**；kind 族（七类）与留痕节律见 §5.3；范围 = **出生 / 终态 / 丢弃三面**（内容 chunk 高频面按频道去重）；上行 = 协议行 `panelDiag`。

### 5.2 块头与状态词（形态与字段）

块头为一行方括号 + 状态词（核 `thincoder-render-core/subblocks/activity-view.mjs:54` `headerText` / `:104` `stateWord`）：

**勘察源（本规则轮）**：① `docs/vsc/requirements/WEBVIEW.md`（F-W23 ∥ §4 端差口径）——相关（判据与端差口径所本）；
② `docs/render-core/design/RENDER-CORE.md`（§1.3 落点与加载形 ∥ §2 KD-RC-3 ∥ §3 模块判定行）——相关（核件落点 ∥ 两端取值同件）；

③ 核件 `subblocks/activity-view.mjs`（`:38` 词源 ∥ `:104` / `:113` 读点 ∥ `:209-212` 工具行写点 ∥ `:213-219` 顾问名支 ∥ `:222-230` think 例外支）——相关（实现实读）；
④ CLI 对位件 `thincoder-cli/src/tui/subagent-blocks.mjs:341` ∥ `subagent-panel.mjs:105-110`——对位参照（坐标随上游给定，本轮流内未重读）；
⑤ 工作树内无独立文档仓（`docs/` 即本仓权威面）⇒「独立档仓」项**不适用**。

- **live**：`[▶ key · sync/async · model · Ns · turn N/M]` + 状态词（取值源闭枚举——见下条）。
- **状态区取值 = 写点单函数 + 缺省支**：写点 = 核 `thincoder-render-core/subblocks/activity-view.mjs` `noteChunk`（`:203`；端档 `thincoder-vscode/webview/activity-view.js` = 2 行 `export *` shim、零逻辑——写点不落在端档），内分三支：
  ① **工具行支**（`kind === "tool"` ∧ 结构化 `tool` ∧ `face ≠ "toolOutput"`——核 `:209-212`）：取值 = `${name} — ${cmd ≤60}` / 工具名，`name = <sub>/<tool>`（`sub` 在场）；
  ② **顾问名支**（`face === "toolOutput"` ∧ `tool === "advisor"`——核 `:213-219`）：取值 = `<sub>/advisor`（顶层 = `advisor`），**只写名字、不写输出文本**；

  ③ **think 例外支**（核 `:222-230`）：见下「think 不改写已有状态词」条。
  区块固定三态词（审批 / 待消化 / 排队——核 `activity-view.mjs:104` `stateWord` 首判）优先于上述取值。

  **think 不改写已有状态词，唯一例外是「状态词还空 ∧ 有子标」**（核 `:222-230`）：`meta.stateWord` 已非空 ⇒ **零改写**（`:230` `return`）——工具行是「它此刻在做什么」的证据，思考不能把它顶掉（CLI 同规则：`currentTool` 只由工具 call 写，`thincoder-cli/src/tui/subagent-blocks.mjs:308` / `:323`）；

  `meta.stateWord == null` ∧ `m.sub` 为非空串 ⇒ 写 `<sub>/<think 词>`（`:226-228`）——子代理刚起、还没调工具时只给裸思考词，**名字就丢了**（用户 2026-10-20 16:32 ∥ 2026-10-21 17:44 两次裁定）；顶层 think（无 `sub`）仍零写入。

  **缺省支（出生至首个工具行）**：块级 `stateWord` 字段缺席 ⇒ **裸 think 词**（词键 `status.thinking` + 静态 `…`——`W.thinking()`，核 `:38`；zh 字面 `思考中…` 仅例示，词面随词键；读点 = 核 `:113` `meta.stateWord || W.thinking()`）——
  顶层子代理无前置工具时状态区即裸 think 词、**零 `<sub>/` 前缀**（身份只在行首子标上，见 §5.6）；嵌套子代理同一时刻由 think 例外支补名。

  **载体 = 块级 `block._subMeta.stateWord` 单字段**（写点 = 上述三支，全在 `noteChunk`；缺省 = 字段缺席，不以空串占位）；唯一读点 = `stateWord()`（核 `:113`）经 `refreshBlock`（核 `:132`）。

  **纯 DOM 一次写入不成立**：该读点被两条路径消费——① 1 s 同点刷 live 块头 ∥ ② 覆盖式重建头词与状态区（`thincoder-vscode/webview/panels.js:55-58`；同形先例 = 本节「载体与读点（刷新两路径）」条）⇒ **两刷新路径同值**（DOM-only 写入被 1 s 拍抹回旧值——功能面绿、真机不成立）。

  **`started` 清空 = 排队→运行那一次**（核 `subblocks/state.mjs:177` `if (block.queued) block.stateWord = null`，`:178` 随即 `queued = false`）：清空的语义只在「排队标注要撤掉」那一次成立；
  挂起期心跳每 ~2 s 重发一次 `started`（§5.3「出生自愈心跳」），每次重发都清 ⇒ 标题每 2 s 闪回裸词（用户 2026-10-21 18:01 现象「中间会穿插一下 Thinking...，但是能恢复」）。

**判据**：`block.queued` 为真才清——重发心跳走同一分支不再清。
  **嵌套身份不写进块头**：块头 = 父的身份（`[▶ role#id · …]`），子在做的事挂在**行首子标**（§5.6）——父子是两个实体，不挤进同一个块头（用户 2026-09-07 裁定）；状态词里的 `<sub>/` 是「哪个子代理占着这一步」的附注，不是身份承载面。

  **嵌套身份前缀（状态词 · 工具行支）**：`m.sub` 在场（relay 嵌套前缀 = `path.inner.join("/")`，如 `advisor#1`）⇒ 状态词前置 `<sub>/`——`advisor#1/read`；缺席（顶层子代理——角色已在括号段）⇒ 零前缀。
  前缀**逐 chunk 重算**（无跨 chunk 残留）；工具行支形态零改。think 不参与前缀（零改写 ⇒ 身份不进 think 词；例外支写的是 `<sub>/<think 词>`，名字与词同为一次写入）。

  **先例与对齐**：precedent = CLI 工具行前缀（`thincoder-cli/src/tui/subagent-blocks.mjs:341` 的 `${path.label}/${path.rest}`）——**对齐**部分 = 工具行前缀逐字同构（`<sub>/<tool> — <cmd ≤60>`）；

  CLI 状态区（`thincoder-cli/src/tui/subagent-panel.mjs:105-110`）= `currentTool` + `command≤60`，think / text 不碰 `currentTool` ⇒ **对齐**部分 = think 零改写（两端都停在上一工具名）。
  口径依据：用户 2026-10-21 10:41「做错了就要改」（对齐 CLI）。

  **输出面零写入（CLI `currentTool` 语义）**：`face === "toolOutput"` 的 chunk 与无结构化 `tool` 字段的旧形态**一律不改写状态区**（输出只进块体行）——CLI 状态区无「输出文本入状态区」规则（`thincoder-cli/src/tui/subagent-panel.mjs:105-110`）；

  **唯一例外 = 顾问名支**——顾问产出走 `toolOutput` 通道（`thincoder-core/agent-tools/advisor.mjs:237` `onOutput: ctx.onOutput`），而输出面按设计从不入状态词 ⇒ 顾问跑着的整段时间标题空白（用户 2026-10-21 18:01「跑advisor的时候就完全没起作用了」）；只写「正在跑 advisor」这个名字：名字是事实，正文是内容，两者不进同一个面。

  **落点 = 核 `subblocks/activity-view.mjs`（桌面同源）∥ CLI 零改**（F-W23 AC④）：VSC 经 2 行 shim 取同件；桌面经协议根 `/rc/` 直映射同件；CLI 自带 `subagent-panel.mjs`，零改。
- **受影响面（F-W23 · T-A15 同口径）**：核 `subblocks/activity-view.mjs` 现 **231** 行（think 例外支 ∥ 顾问名支；≪ 500 ⇒ 零拆分计划，结构不变）·
  核 `flow/block.mjs` **167** 行（`appendLineText` 行首子标）· 核 `subblocks/state.mjs` **334** 行（`:177` 条件化 + 注文随改）· 端档 `webview/activity-view.js`（2 行 shim）零改 ·
  `docs/render-core/design/RENDER-CORE.md`（机制单源 = 其 §2 **KD-RC-15**）· 本档规则块 + 用例行 + 登记面行；

用例 = **T-A33 ∥ T-A38 ∥ T-A41–T-A45**（用例号 N1–N5 ∥ S1–S3；单元用例件 = 批次本地件（名随批档、住批档目录，收口前删净；清单状态见 §5.7 用例首段）——本档不落具体档名）。
- **queued**：`[⏳ key · queued|waiting]` + 排队信息——**与 CLI 逐档一致**（标尺 = `thincoder-cli/src/tui/subagent-panel.mjs:73` 状态词 / `:100-102` 状态区）。
  slot（`kind: "slot"`）→ `排队中 · 位置 N（槽满等位）`；wait / depc（`kind` ≠ slot）→ **host detail 原文**（`waiting for: …` / `dependency cancelled: …`——零改写）。

  载荷 = `status:"queued"` + `position` / `waiting` / `reason` / `kind`；**降级形态**（缓存缺省 ⇒ 仅 `position`、`kind` 缺省）⇒ 走 **`kind` ≠ `slot`** 支：有 `reason` ⇒ 原文、无 `reason` ⇒ 中性回落 `sub.queued`（= CLI `queued.detail || "queued"` 同形）∧ 状态词 `waiting`。
- **载体与读点（刷新两路径）**：四字段的**块级活态载体** = 块自身 `block._subMeta.queueInfo`（建块默认 `null`——核 `subblocks/state.mjs:67`；写点 = queued 消费点 `:146`；清点 = `started` 分支 `:176`）；**单一读点** = `stateWord` / `headerText`（核 `subblocks/activity-view.mjs:104` · `:54`），经 `refreshBlock` 被两条路径消费：
  ① **1 s 同点刷 live 块头**（`thincoder-vscode/webview/panels.js:55-58` `_panelTimer` → `refreshLiveHeaders`——不设运行态门）；② **覆盖式重建头词与状态区**（每条已建块消息 / 状态分支 + `toggle`）。⇒ 重绘后形态由该载体重建，**无第二消息面回落通道**（缺陷复辟路径不成立）。
- **frozen**：`[✓ key · … · done Ns · turn N/M]`（stop → `⏹` + `stopped Ns`；error → 错误注记随头）。
  **冻结头注记承面（X6 · X11）**：`— <note>` 承四态——error 错误注记 · done / stopped 停因注记（X6——turn-cap / 用户停止等；判据 = 结果文本的既有标记常量，**从核 import 出处**，禁字面复制）· abort 冻结注记 `— interrupted`（X11）；
  **载体 = 块级 `meta.note` 单字段**（X6 / X11 共用——禁第二注记字段）；渲染句复用 `— <note>`（≤140 字符截断）。

两刷新路径（1 s 拍 / 覆盖式重建）同走 `meta` 活态载体 ⇒ 注记随重绘存活（非 DOM 一次写）。`⟦ev⟧stopped` 第 4 位原因词有值则透传为 `note`、无值 `null`（**不伪造**）。
  **error 面保留 + 死枝登记**：核侧零 `onSubagent` 调用点 ⇒ `{type:"subagent"}` 的 `error` / `failed` / `terminated` / `answered` 四态现无发射者（补桩表 error 行与 error 图标词 = 防御面，**保留不删**——零动作）。
- **awaitingDigest**：括号去 verb（`[✓ key · … · Ns]`）+ 态词 `done · awaiting digestion`。
- **审批态**（live）：`⏸` 覆盖 `▶` + 态词 `等待审批: <tool>`（子代理 child ask 在途——核 `activity-view.mjs:67` · `:105`；清态（`tool: null`）即回落；终态不覆盖图标）。
- **⏹ 覆盖按钮**（`activity-view.js` `updateStopButton`）：live + `running` +（`pool === true` 池条目 **或 `syncLive === true`**——宿主确证可中止的 sync 块，X10）→ 停止；`queued` → 取消排队；且 role ∈ family 时可见；标签与 title 两动作区分；冻结块随 fold 移除。
  **门控载体 = `meta`**（`syncLive` 由宿主在出生 / 心跳载荷携、webview 写 `meta`——与存活投影同形）⇒ 1 s 拍与覆盖式重建同源；**能力面归属（X10）**：路由走核 sync registry（**只读**·禁第二套 registry），不可读 ⇒ 降级为登记 + 文案告知（显示面不做控制面承诺）。
- **tail-3 摘要**（核 `activity-view.mjs` `tailLines` `:117` / `refreshBlock` `:132-159`）：折叠态（frozen 或 `open=false`）在头下附末 3 条非空内容行（首尾各 200 字符截断）——**行文 = `│ ` 前缀独立行**（与 CLI `render-segments.mjs:103-109` 同形——D4 消）；容器 = `<details>/<summary>` 原生（壳能力面）；射程 = `.advisor-content` 的**子元素**（`.sub-desc` 不在内）。
- 逐字段端差对位（CLI 面板行 × 本端）与 i18n 键表 = `WEBVIEW-PROTOCOL.md`（本档不重述）。
- **首块说明行**（`.sub-desc`——一次性新用户说明）：`activity.js:58-64`（`S._subDescShown` 置位，`state.js:42`），文案 = locale 键 `sub.desc`；契约见 `WEBVIEW-INPUT.md`。

### 5.3 出生投递与块身份（可靠性）

块的身份键 = 频道名 `sub:<role>#<id>`（契约不变——`activity.js:213-219`）；单 map 单守卫 = `S._subBlocks`（`state.js:89`）。

**键文法单源**：relay 前缀文法 `RELAY_PREFIX_RE = /^([\w-]+)#(\d+)\//`（`thincoder-core/agent/relay-prefix.mjs:10`——角色段**不容空格**）；
端侧内容面键 = `"sub:" + <role>#<id>`——构形单源 = rc `relaySubContentChunk`（B7 2a 换接：前缀剥除 ∕ 四面 gate 均在 rc）；

端侧由 chunk `role` / `id` 重导（`thincoder-vscode/src/extension/panel-subagent-relay.mjs:139`——与 `path.head` 等价）。
**键形**：`consult` / `escalate` 的端侧键 = `sub:consult#4` / `sub:escalate#2`——**不含模型段**；
实据 = 键构造（`panel-subagent-relay.mjs:139`）。

`sub:consult <model> #<id>` 的解析形态（现住核 `subblocks/channel.mjs:29` ∥ `subblocks/state.mjs:315`）= CLI 形态残留（端侧**无产者**）——保留不改，但**不作判据**。

**出生面 = 存活闸（F-A3 · ①）**：出生事件 = `queued` 与 `started`（`[model]` token = 真启动锚）；命中三向：

| 命中 | 动作 |
|---|---|
| 键**已冻结**（含已归档条目） | `takeoverBlock`——建新代块 + 旧 awaitingDigest 块归档 + `takeover` 痕（新任务**不得永久不可见**） |
| 键 **live** | `ensureBlock` 复用（幂等——不重挂 / 不重复 append / 区序不动） |
| 键 **tombstone**（元素被移除） | 丢弃 + `drop-tombstone` 痕（NFR-A1：元素移除不回建） |

**出生面射程（扩两维——② ③）**：建块 / 接管**不限角色族、不限 `pool`**——
① **sync spawn**（`thincoder-core/agent/spawn-child.mjs:94-98` `makeRelay` 在 spawn 即发 `[model]`，载荷 `pool:false`）⇒ **spawn 即建块**（不再等首 chunk）；

② **escalate / consult**（产者 `consult.mjs:302` · `escalate-async.mjs:195-196` · `subagent-actions.mjs:148`）⇒ **started 即建块**（不再受 `FAMILY_ROLES` 六角色门约束）。

`sync` / `async` 词仍由 `meta.pool` 派生（核 `activity-view.mjs:78-80`——**语义零改**）；**⏹ 可见性判据（X10）** = `running +（池条目 `pool` 或 sync 可中止 `syncLive`）+ family`——非池块仅在宿主**确证可中止**时给 ⏹（F-A4 边界）——`FAMILY_ROLES`（核 `activity-view.mjs:15`）**在本判据与 sync/async 词面存续**，「白名单退场」只指补桩前置面（见下「终态必现」）。

**非出生面禁静默（⑦）**：chunk / turn / 终态命中冻结键 ⇒ 维持丢弃（**不复活已折叠块**——NFR-A1）+ `drop-frozen` 痕；
命中 tombstone ⇒ 终态走补桩（见下「终态必现」）、其余丢弃 + `drop-tombstone` 痕。
**判据分界 = 消息形态**（出生面 / 非出生面），非「谁先到」；CLI 先例（P0-a 存活复活 + P1 禁静默）在本端的对位：
CLI 存活判据读池实体（`livePoolHas`），端侧**无池** ⇒ 存活凭据 = 出生事件本身 + host 心跳（D-W21）；非存活凭据 = 冻结 / 墓碑守卫。

**投递链三面**：

- **投递队列（host · 单队列）**：`panel._wvOutbox`（数组，上界 `WV_OUTBOX_MAX = 200`——溢出丢最旧 + 留痕）——**事件面与内容面同队**（⑤ 已落）：
  `postSubagentEvent`（`thincoder-vscode/src/extension/panel-subagent-relay.mjs:167-181`）为两族**唯一**投递口（`panel._wvReady === true` 直投，否则入队）；内容面 `emitToolPanel`（`:124-126`）由直投改**同口入队**——早到内容不再永久丢（暗窗口 = 入队 → 就绪 flush）。
  **序**：单队列按插入序（事件先于内容 = 块先出生再吃内容）；上界 / 丢最旧语义零变化（D-W12）。

  `logEvent("ev:subdeliver", …)` **五处置全留痕**（`direct` / `enqueue` / `flush` / `drop-overflow` / `discard-dispose`——见下「投递面全量留痕」）。
- **就绪握手（两拍）**：webview 起手投 `webviewReady`（`thincoder-vscode/webview/chat.js:142`）→ host case（`panel-messages.mjs:318`）置 `_wvReady = true`（`:330`），
  **排在** `openSessionContent`（`:348`——内部含 `clearMessages` + `resetActivity`）**之后**执行 ① flush 队列（`:354` `flushSubagentOutbox`——保持入队序，**含内容面**）→ ② `reassertLiveChildren`（`:355`）。
  后置理由：先投的出生事件必被清屏抹掉。
- **存活投影**：`thincoder-vscode/src/extension/suspension.mjs:79-108` 读 `panel._liveLines ?? panel._susp?.lines` 的 `_asyncSubagents` / `_asyncAdvisors`（与 ⏹ 路由同源），
  **只发 live**——`running` → `started` + `pool: true`，`queued` → `queued`（两侧 role/id 必带；**载荷与 relay 面同形**：`position` / `waiting` / `reason` / `kind` 一并投影——重绘后与 live 面逐档一致；缓存单源 = queued 事件消费点）。（#118 落）

**内容面投递（W15 内容面；投递面并入队列）**：子代内容 chunk（text / think / 工具调用行 / 工具输出行）经 relay 前缀文法
（`role#id/`——嵌套链子标随行）在端壳分流 → `toolPanel` `sub:<role>#<id>` 载荷（`panel-subagent-relay.mjs` `relaySubagentContentChunk`）；
投递 = `emitToolPanel` 单点 → `postSubagentEvent`（**就绪门 + 队列 + 溢出留痕**——与事件面同语义）。

次序 = 事件面先吃、内容面后判；前缀由核逐 chunk 重加 ⇒
端侧逐 chunk 独立解析（无跨 chunk 重组、无半前缀）。

**工具结果行面 = 无产者（行为零变更）**：

证据链 —— 核 `wrapChildCallbacks`（`thincoder-core/agent/spawn-child.mjs:147-164`）只包四面
（`onToken` / `onReasoning` / `onToolCall` / `onToolOutput`，**无 `onToolResult`**），

子装配（`agent-tools/subagent-spawn.mjs:408` · `consult.mjs:312` · `escalate-async.mjs:212` · `subagent-actions.mjs:155` 同族）亦不携该回调
⇒ 子内 `callbacks.onToolResult?.()`（核 `agent/dispatch-run.mjs:83` / `:154`）恒 `undefined` ⇒ 带 relay 前缀的结果行不存在（端侧分流恒 false）。将来核侧若真加 relay ⇒ 随该能力面重建支路 + 本句（不预置死支路）。

**第 4 参对位（⑥）**：`onToolResult` 第 4 参 = `toolCtx._subagentKey`（核 `dispatch-run.mjs:154` 传入；**仅 sync 成功 / 折叠路径**设置——`subagent.mjs:380-390`）= sync 子代理的**完成锚**（CLI 对位 = `finishSubTaskKey`）⇒ 端侧消费：该参存在即以该键补 `done`（**sync 子代理块终态落定**——现态永不折叠）；无该参（async ack 形 / 普通工具路径）零动作。

**出生自愈心跳（host · 2 s 拍——F-A1 · F-A4 · F-A5）**：

- 拍体 = `reassertLiveChildren(panel)` **本体**（与就绪握手 / `loadSession` 同一函数——单源，不新造存活投影）；起 = `webviewReady` case 内（`panel-messages.mjs:356`），停 = `panel` dispose（`chat-panel.mjs:192` 旁）；`unref?.()`（不阻进程退出——同 `thincoder-vscode/src/extension/ledger-surface.mjs:83`）。
- 拍体前置两守卫：`panel._wvReady === true`（未就绪不向队列堆重复出生事件——就绪拍已覆盖该窗口）；`n > 0` 才留痕（空拍零日志）。`n` = 本拍重发条数。
- **幂等契约靠既有守卫导出（不改判据）**：键 live → `ensureBlock` 复用（不重挂 / 不重复 append / 区序不动）；键**已冻结** + host 判 live → `takeoverBlock` 建新代（F-A3——host 是「该键仍 live」的权利人，冻结条目 = 陈旧墓碑）；键 live 但元素被移除 → tombstone 丢弃（语义不变）。
- **降级块修复**：内容 chunk 先到、出生事件从未到（块 `pool: null`）⇒ 心跳 ≤2 s 内补 `pool: true` + `model` + `startedAt` ⇒ ⏹ 与 `sync/async` 词随 `pool` 派生恢复（F-A4——控制面与内容面同块）。
- **源新鲜度（心跳放大的既有洞——须补）**：`panel._liveLines` 只在回合起点登记（`panel-chat.mjs:203`），切会话 / 新建会话**无清点** ⇒ 心跳会把「源陈旧」从偶发放大成每 2 s 向新面板投旧会话池块。
  修法落点 = `thincoder-vscode/src/extension/panel-session.mjs:113` **`loadSession` 入口段**（`:124` `panel._agent = null` 销毁点旁；置空行 `:131`）置空 `panel._liveLines`——
  newSession / switchSession / deleteSession / onProjectChanged / openSessionContent 五路汇合于此（同档 `:128-130` 注释）⇒ 单点覆盖、回落 `panel._susp?.lines`；

判据：切换后心跳 `n ≡ 0`（T-A7）。
- **不做**：不重发终态 / settled（终态呈现 = 既有终态消息与 digest——F-A2 面）；不复活已归档块（tombstone / frozen 语义不变）。
- **sync spawn 出生面已落**（`started` + `pool:false` 即建块——见上「出生面射程」）；心跳射程仍 = 池条目（`thincoder-vscode/src/extension/suspension.mjs:79-108`——`_asyncSubagents` / `_asyncAdvisors`）。

**投递面全量留痕（host · NFR-A2 主侧）**：

- `postSubagentEvent` **五处置全记** `ev:subdeliver`：`direct`（就绪直投）/ `enqueue` / `flush` / `drop-overflow`（溢出丢最旧）/ `discard-dispose`（view dispose 清队——⑥ 补）——载荷含 `ch`（频道名）· `status` · `wvReady`。
- 内容面（`relaySubagentContentChunk` → `emitToolPanel`）：每频道**首条**记 `logEvent("ev:subcontent", …)`——载荷 `{ ch, face }`（`face` ∈ `text` / `think` / `toolCall` / `toolOutput`——四面；该频道首条实收面）、形态 = `content-first` 正收据；「内容丢失」面由 `drop-overflow` 承载（内容已入队，不再直投丢弃——上界 = 每频道 1 行 + 溢出行）。
- 心跳：`reassert` 摘要行——`n` 变化即记 + 每 30 次拍兜底（心跳存活本身可断言）。

**webview 侧痕迹与上行（NFR-A2 webview 侧）**：

- 痕迹面迁出至新档 `thincoder-vscode/webview/activity-diag.js`（已落——`activity.js` 现 **263 行**；痕迹整体迁出，`activity.js` 只留调用点）；环形 `SUB_TRACE_MAX = 50` 与 `_subTraceLog` 载体同迁（`state.js:83-85` · `:122` 两处退场）。
- kind 族（**七类**）：既有三类 `takeover` / `late-terminal-stub` / `drop-unknown-role` + `birth`（新块出生——正收据）/ `drop-frozen`（冻结键吞掉的非出生消息——① 静默面）/ `drop-tombstone` / `reassert-hit`（心跳命中已 live 块——正收据，每频道每生命周期一条）。
  **退场一类**：`skip-key-unrebuildable`（旧射程登记用）——consult / escalate 射程收正后该分支不存在（见「终态必现」）。
- **留痕节律**：出生 / 状态面**逐条**；内容 chunk 面**每频道每生命周期首条**（高频面按频道去重——上界与 `content-first` 同族）。
- 上行 = 新协议行 `panelDiag`（webview → host）：`{ type: "panelDiag", kind: "subTrace", entries: [{ kind, channel, at }] }`——新条目即发、批内合并（最多一消息 / 批）；host case → `logEvent("ev:subtrace", …)` 入主侧日志。登记 = `WEBVIEW-PROTOCOL.md` §3.2 行 8（§13 机检表行随实现落——机检表只收实测在位的行）。
- **判据**：复发时主侧日志同载两面——host 投了没（`ev:subdeliver`）+ webview 收了做什么（`ev:subtrace`）——本次事故的判定缺口（未达 / 被守卫吞不可分）由此闭合。
- 射程：**出生 / 终态事件面**；内容 chunk 的高频丢弃不逐条留痕（量级不可控）。

**终态必现（F-A2）**：

- 「块缺失」判据**扩一形**：map 条目存在但元素被移除（live tombstone）+ 终态消息 ⇒ 走补桩（折叠桩 + 立即归档 + `late-terminal-stub` 痕迹），不再静默丢弃；**live / chunk 消息的 tombstone 丢弃语义零变化**（NFR-A1）。
- **射程**：consult / escalate 的端侧键 = `sub:<role>#<id>`（**可单源重建**——`relay-prefix.mjs:10` 文法与内容面键构造 `panel-subagent-relay.mjs:139` 同形）⇒ **纳入补桩射程**（与 family 角色同规）。
  前置判据改 = `id != null ∧ 角色段合法（[\w-]+）∧ 回读解析一致`（`FAMILY_ROLES` **补桩前置**退场——D-W10 收窄；该族表在 ⏹ 可见性 / sync-async 词面仍存续——核 `activity-view.mjs:15` · 见上「出生面射程」）。

**清屏可恢复（F-A5）**：心跳 + 既有两处再断言（`webviewReady` 握手后 · `loadSession` 清屏后同 tick）覆盖「boot / loadSession 清屏后仍存活者重现」；载荷与语义同 F-A4（同一存活投影）。

**窄缝族（⑥ 逐条）**：

- **view dispose 清队**（`chat-panel.mjs:187-191`）：**清队语义不变**（跨 view 不串味——旧 view 的待投事件不得灌进下一个 view）+ 补 `discard-dispose` 留痕（禁静默）；重建面由心跳 / 就绪再断言承担（不重放陈旧事件——D-W29）。
- **补桩限 family** ⇒ 前置判据收正见上「终态必现」（consult / escalate 纳入）。
- **`makeRelay` 无池兜底**（`thincoder-core/agent/spawn-child.mjs:76-79`——sync 取号 = `_subAgentCounter + 1`，与 async 取号 `nextSubagentId`（`subagent-scheduler.mjs:406-422`：`max(counter, poolMax) + 1`）共用同一计数器）⇒ **登记 + 出批上抛**（**端侧零修**）：
  同键成立需「计数器被重置 ∧ 池存活」这一组合，而池与 agent 生命周期同灭（VSC 侧 `_agent = null` 提池同段）⇒ 常态不可达；核面修法（改走 `nextSubagentId`）跨端影响 CLI 块命名 ⇒ 不在写域。既有显式取舍保留：同键两实例 = 消息交错可见（现位注记 = `streaming.js:168-169`）。
- **`onToolResult` 两件**（`panel-callbacks.mjs:212-225`）：① relay 分流面 = **无产者**（证据链见上「工具结果行面 = 无产者」）；② 第 4 参 `_subagentKey` 同点未消费 ⇒ sync 子代理块**永不折叠**，修法 = 消费该参补 `done`（见上「第 4 参对位」）。

**同族配套（非上述三面）**：

- **清屏后再断言**：`loadSession`（`thincoder-vscode/src/extension/panel-session.mjs:113-173`）在 `clearMessages`（`:147`）与 `historyPage`（`:153`——投递在 `:198`）**之后同 tick** 调 `reassertLiveChildren`（`:157`）——重建块恒落区尾。
- **未就绪窗口**：webview 重载 / 渲染崩溃且 view 未 dispose 时池存活（`retainContextWhenHidden: true`——`thincoder-vscode/src/extension/chat-panel.mjs:176`）；view dispose → `_wvReady = false` + 清队（`chat-panel.mjs:187-191`），跨 view 不串味。
- **不复活面**：`postPoolSnapshot` / `SNAPSHOT_ROLES`（池行快照）与行面板已退场，**不得静默复活**；补发对象 = 任务存活事件（复用既有 `subagent` 载荷形状），非池行快照。
**用例（出生可靠性面——T-A1..T-A15 · 机检驱动 = happy-dom 真 webview 模块 / 桩面板驱动真 extension 模块（NFR-A3））**：

| # | 场景 | 输入 / 触发 | 期望（可断言） |
|---|---|---|---|
| T-A1 | 正常：未就绪窗口出生 | `_wvReady=false` 期发 `started`（池条目 running）→ 就绪握手 | 队列 flush 出块 + 心跳 ≤2 s 再断言 ⇒ 恰一块 · `pool:true` · ⏹ 在位 |
| T-A2 | 正常：就绪直投 | `_wvReady=true` 发 `started` | ≤2 s 出块；心跳重复拍**不产生第二块**（`ensureBlock` 复用——同身份幂等） |
| T-A3 | 正常：出生事件整链丢失（反例本体） | 池条目 live + 出生事件投递被吞（模拟未加载 / 键冻结窗口） | 心跳 ≤2 s 补块（对照 = 修前零块、静默至任务结束）——**反例先红锚** |
| T-A4 | 边界：降级块修复（F-A4） | 内容 chunk 先到、出生事件从未到（块 `pool:null`） | ≤2 s 补 `pool:true` + `model` + `startedAt`；⏹ 与 sync/async 词随 `pool` 派生恢复 |
| T-A5 | 边界：键已冻结 + 同键新代（F-A3） | 终态 echo 冻结键后同键再发 `started` | `takeoverBlock` 建新代 + 旧代归档；恒一块可见；`takeover` 痕迹一条 |
| T-A6 | 边界：未就绪不堆事件 | `_wvReady=false` 连续拍 | 心跳跳过（零投递、零队列增长）；`reassert` 零留痕（n=0） |
| T-A7 | 边界：切会话源新鲜度（D-W24） | 切会话 / 新建会话后拍 | `_liveLines` 置空、回落 `_susp.lines` ⇒ `n ≡ 0`（新面板零陈旧块） |
| T-A8 | 边界：清屏可恢复（F-A5） | boot / `loadSession` 清屏后池仍存活 | 清屏后同 tick 再断言 + 心跳 ⇒ 存活块重现（区尾），控制面同 T-A4 |
| T-A9 | 错误：终态块缺失（tombstone 形——F-A2 判据扩） | map 有条目、元素被移除 + `done` | 补桩（折叠 + 立即归档）+ `late-terminal-stub` 痕迹；**零静默丢弃** |
| T-A10 | 错误：live / chunk 命中 tombstone | tombstone 态 + `chunk` / `live` 消息 | 仍丢弃（语义零变化——NFR-A1 不回归）；不复活已折叠块 |
| T-A11 | 错误：`answered` 终态无块（F-A2 例外） | question 已答类终态 + 无块 | no-op（不补块、不建块——回复走 digest 呈现） |
| T-A12 | （**退场**）consult / escalate 终态 | 原「留痕不补」用例——射程收正后该分支不存在 | 覆盖 = **T-A31**（补桩非留痕）；本行只作退场标记 |
| T-A13 | 留痕：host 五处置（NFR-A2 主侧） | 五路径各投递一次（含 dispose 清队） | `ev:subdeliver` 五行（`direct` / `enqueue` / `flush` / `drop-overflow` / `discard-dispose`；载荷含 `ch` · `status` · `wvReady`） |
| T-A14 | 留痕：webview 痕迹 + 上行（NFR-A2 端侧） | 出生 / 接管 / 补桩 / 心跳命中各一次 | 环形 ≤50 丢最旧 + `panelDiag{subTrace}` 批内合并上行 ⇒ host `ev:subtrace`；`reassert-hit` 每频道每生命周期恰一条 |
| T-A15 | 结构门（NFR-A3 机检） | `doc-check` + 行数扫描 | 改动后 `activity.js` < 500（痕迹外提抵消新增）· `activity-diag.js` ≤ 500 · 核 `subblocks/activity-view.mjs` ≤ 500（现 215，本批 `≤ +2`）· 新增行无 >300 单行 · 文档锚零悬空 |
| T-A16 | 出生闸①：冻结键 + **新代 started**（真分发） | `relaySubagentEventToken(panel, "explore#7/[model]m")` → 载荷喂 `applySubagentStatus`（键已冻结） | 新块（`_subMeta.frozen === false`）+ 旧 awaitingDigest 块归档 + `takeover` 痕（**修前红**：`ensureBlock` 返 null ⇒ 零块） |
| T-A17 | 出生闸①：冻结键 + **queued** | 真 token `⟦ev⟧queued\x1eslot\x1e1\x1equeued\x1e` → 同键已冻结 | 新代块 + 头 `[⏳ …]` + `takeover` 痕（**修前红**：丢弃且无痕） |
| T-A18 | 出生闸②：**escalate** started（无块） | `relaySubagentEventToken(panel, "escalate#6/[model]glm-5.2")` | 建块 `sub:escalate#6`（无 sync/async 词）· 后续内容 chunk 落同块（**修前红**：family 门 ⇒ 零块） |
| T-A19 | 出生闸②：**consult** started（无块） | `relaySubagentEventToken(panel, "consult#4/[model]glm-5.2")` | 建块 `sub:consult#4`——与内容面键（`relaySubagentContentChunk` → `"sub:" + head`）**逐字一致**（**修前红**：零块） |
| T-A20 | 出生闸③：**sync spawn** 出生（首 chunk 前） | `relaySubagentEventToken(panel, "coder#2/[model]m")`（无 `⟦ev⟧async` ⇒ `pool:false`） | 建块 + `sync` 词；随后首 chunk 复用同块（**修前红**：零块，首 chunk 后才出） |
| T-A21 | 呈现④：未钉底 + 新块出生 | 真链 `ensureBlock("sub:plan#9")`（区几何 = 上滚态 `_pinActivity = false`） | 区首出现计数钮（`N = 1`）+ `scrollTop` **零改**（**修前红**：零提示） |
| T-A22 | 呈现④：计数钮回底 | 同 T-A21 + `click` | `scrollTop = MAX` + `_pinActivity === true` + 钮移除 + `N ≡ 0`（**修前红**：无此元素） |
| T-A23 | 呈现④：`scroll` 事件维护 pin | `activityEl` 派发 `scroll`（几何两向：近底 / 远底） | `_pinActivity` 两向正确（键盘 / 拖条滚动不再留陈旧位）（**修前红**：仅 wheel / touchmove 应答 ⇒ scroll 零响应） |
| T-A24 | 投递⑤：未就绪窗口内容 chunk | 真 extension：`_wvReady = false` → `relaySubagentContentChunk(panel, "text", "explore#1/hello")` | 返 true + `_wvOutbox` 长 1 + `ev:subdeliver{action:"enqueue"}`；就绪 flush 后 webview 收 `toolPanel`（**修前红**：直投暗窗 ⇒ 永久丢） |
| T-A25 | 投递⑤：两路次序（事件先于内容） | `⟦ev⟧async` + `[model]` + 内容 chunk 同批（未就绪）→ flush | flush 序 = `started` → `toolPanel`（块先出生再吃内容）（**修前红**：内容不入队） |
| T-A26 | 投递⑤：溢出丢最旧 | 队列灌 > `WV_OUTBOX_MAX`（内容面与事件面混灌） | 丢最旧 + `drop-overflow` 留痕 + 丢计数（**修前红**：内容面不入队 ⇒ 无） |
| T-A27 | 留痕⑦：丢弃路径逐条入痕 | 冻结键收 chunk / tombstone 收 chunk / 前置失效终态（角色段非法——consult / escalate 已退出该行） | `drop-frozen` · `drop-tombstone` · `drop-unknown-role` 三痕（前两条**修前红**：无痕；第三痕触发面收窄） |
| T-A28 | 留痕⑦：痕上行 | 新痕产生（出生 / 接管 / 丢弃） | 批内合并 → `panelDiag{subTrace}` → host `ev:subtrace`（主侧日志一行）（**修前红**：零上行） |
| T-A29 | ⑥：dispose 清队留痕 | `_wvReady = false` + 队列非空 + view dispose | 清队 + `discard-dispose`（不静默）；新 view 就绪后心跳重建（**修前红**：清队无痕） |
| T-A30 | ⑥：sync spawn 工具返回 ⇒ 块冻结 | 真 `onToolResult(name, result, id, "coder#2")`（第 4 参在） | 该键块冻结（done）+ 归档；无第 4 参形（async ack / 普通工具）零动作（**修前红**：块永不折叠） |
| T-A31 | ⑥/②：consult 终态无块 ⇒ 补桩 | `relaySubagentEventToken(panel, "consult#4/⟦ev⟧done")`（无块） | 补桩（折叠 + 立即归档）+ `late-terminal-stub`（**修前红**：`drop-unknown-role`、不补——射程收正） |
| T-A32 | **反例**（NFR-A1）：冻结键收 chunk 不复活 | `streaming.subagentChunk({ name: "sub:explore#5", kind: "text", text: "late" })`（键已冻结） | 零新块 / 零 append / 原块不变 + `drop-frozen` 痕（**反例保持**——不许因本条变红） |
| T-A33 | F-W23 ①：嵌套工具行后接 think ⇒ **零改写**（状态词已非空） | 先 `{ role:"eng-coder", id:3, kind:"tool", tool:"read", cmd:"src/x.mjs", sub:"advisor#1", face:"tool" }`，再 think 载荷 `{ kind:"think", sub:"advisor#1", text:"…", face:"think" }` | 状态词 = `advisor#1/read — src/x.mjs`（零改写，头行同值）；**无前置工具的嵌套 think ⇒ `advisor#1/思考中…`**（例外支；头行同值）——无 `sub` 时仍载体零写入 |
| T-A34 | F-W23 ②：顶层 think 正控（载体零写入） | 同载荷去 `sub`；另验证三点：① 嵌套工具行后接顶层 think ⇒ 零改写；② `sub` = 空串 ∥ 非字符串 ⇒ 零抛；③ 载体字段零写入 | 头行状态词 = 裸 think 词、零 `/` 前缀且 `_subMeta.stateWord` 保持 null（防前缀过施 ∥ 防回写成 think 词） |
| T-A35 | F-W23 ③ + 输出面零写入：工具行支零变 ∥ 旧载荷无 `tool` | ① `{ kind:"tool", tool:"read", cmd:"src/x.mjs", sub:"advisor#1" }`；② 去 `sub`；③ `{ kind:"tool", face:"toolOutput" }`（无 `tool` 字段） | ① `advisor#1/read — src/x.mjs`；② `read — src/x.mjs`；③ 状态词零改写（输出面零写入） |
| T-A36 | F-W23 ④：同源（VSC + 桌面同件，CLI 零改） | 用例 import 核路径 `../node_modules/@thincoder/render-core/subblocks/activity-view.mjs`；静态断言 `webview/activity-view.js` 纯再导出（`export *`，无本地 `noteChunk`） | 与桌面 `/rc/subblocks/activity-view.mjs` 同一文件（同件同形）；`thincoder-cli/**` 零改 |
| T-A37 | 两刷新路径同值（守卫反例：DOM-only 写入） | 嵌套工具行 → 嵌套 think ⇒ ① 走 1 s 同点刷 ∥ ② 走覆盖式重建，各断言一次 | 两次头行状态词同 = `advisor#1/read — src/x.mjs`（think 零改写后仍是工具行；载体 = `block._subMeta.stateWord`；DOM 一次写入会在 ① 后回落到旧值 ⇒ 红） |
| T-A38 | 多段嵌套（深层） | `sub:"advisor#1/explore#2"` 的 think chunk（无前置工具）∥ 同前缀的工具 chunk | 首个 think ⇒ `advisor#1/explore#2/思考中…`（例外支，名字取自 `sub` 全路径）；其后 think ⇒ 零改写（与嵌套深度无关）；工具行 = `advisor#1/explore#2/read — src/x.mjs`（前缀逐字拼接） |
| T-A39 | 出生前缺省（正控） | 建块后、首个 chunk 前读头行 | 状态词 = 裸 think 词（`stateWord` 缺席 ⇒ `W.thinking()`；缺省支零改） |
| T-A40 | 冻结块负控 | 块 `frozen:true` 后投 think chunk | 头行零改写（`noteChunk` 首行守卫保持） |
| T-A41 | 行首子标（N1 ∥ N2）：工具行 ∥ 文本/思考行 | `sub:"explore#1"` 的工具行与文本行各一条 | 两行行首均有 `span.advisor-sub`，文本 = `explore#1 · `；正文为其后文本节点 |
| T-A42 | 行首子标负控（N3）：父自己的行 | 同载荷去 `sub` | 零 `span.advisor-sub`、行内容 = 纯文本节点（`textContent` 逐字） |
| T-A43 | 子标一份（N4）：`toolOutput` 同工具同 `sub` 续写 | 两 chunk 同 `sub` ∥ 同 `tool` ∥ `face:"toolOutput"` | 并入末文本节点（`textContent` = 两串拼接）；`span.advisor-sub` 恰 **1** 个 |
| T-A44 | 顾问名支（S2）：`toolOutput` ∧ `tool:"advisor"` | `{ kind:"tool", face:"toolOutput", tool:"advisor", sub:"advisor#1" }` ∥ 去 `sub` | 状态词 = `advisor#1/advisor` ∥ `advisor`；同载荷再投一段输出 ⇒ 状态词不变（名字不随输出变） |
| T-A45 | `started` 幂等（S1）：重发不清 ∥ 迁移清 | ① `started` → 工具行 → 再 `started`（心跳形）② `queued` → 工具行 → `started` | ① 状态词保持 `advisor#1/read — …`（零闪回）② 状态词被清 ⇒ 回落缺省支（排队标注已撤） |


### 5.4 150 窗与懒历史

- **DOM 窗上限 150 块**：`thincoder-vscode/webview/ui.js:237`（`MAX_MESSAGE_BLOCKS`）+ `trimOldMessages`（`:238-245`）——计数选择器含 `.message` / `.tool-call` / `.advisor-block` / `.sub-block`（**归档块随窗出窗**）；区驻留块不在其容器，不计。
- **懒历史锚**：`thincoder-vscode/webview/history.js:29`（加载指示插位——插入行 `:36`）与 `:72`/`:76`（分页 prepend 锚）选择器同含 `.sub-block`——归档块与懒历史页共存时插位正确。
- **分页**：首窗 = 末页（`older=false`）+ `hasOlder`；`scrollTop ≤ 40` 触发 `loadOlder`（`history.js:98` 判据 / `:103` 投递）；prepend 后按 `scrollHeight` 增量补偿 `scrollTop`（`:73-77`）。页大小常量 = 核 `thincoder-core/history-window.mjs:29`（`HISTORY_PAGE_SIZE = 200`——跨端首窗对齐；本端 `history-window.mjs` = 12 行转口）。
- 归档块锚检查（按径分述）：**live 归档块不补 `data-idx`**（活流落点 = **到达序当刻流末**——记录 `idx` 为流末追加位次、与视觉位次不重合 ⇒ 不入回填游标面；出窗后经记录重建径回填）；**重建块携 `data-idx`**（= 记录全局 `idx`——§5.7 重建径；分页游标面完整性所系：`minLoadedIdx` 含重建元素 ⇒ 更早页游标正确）。
- **防双渲染判据（live ∥ 重建两径）**：重建插入前按同位 `[data-idx]` 去重（命中 ⇒ 跳过——幂等）；**live 块不回溯补锚**（锚检查 = 重建径独占）——同一 DOM 世代内一条记录至多产一元素（重建径仅产自页快照内含之记录 ∥ live 径仅产自快照后新归档——两径不相交）。

### 5.5 live 块跟滚与内容区高度

两层独立、互不写对方状态：

- **外层 = 区 pin**（`ui.js:228-232`）：块出生（`activity.js:65`）与流式帧（`streaming.js:33`）调用；近底 24px 判据、上滚解 pin、回底重 pin（`ui.js:250-255` + 核 `thincoder-render-core/scroll.mjs:78-126` `watch` 闭包）。块出生**不再牵动** `#messages` 滚动。
- **内层 = 块内容区跟滚**（原语 = 核 `thincoder-render-core/subblocks/block.mjs` `initBlockFollow` / `maybeScrollBlock`——提核；本端 = 调用点）：
  `initBlockFollow` 给 `.advisor-content` 挂 `wheel` / `touchmove` / `pointerdown`（手势标记）+ `scroll`（passive）监听维护 `内容区._pinFollow`——**让位三律** = 近底（< 24px）无条件翻真 ∕ 远离底仅凭用户手势门（600ms）翻假 ∥ 非手势位移（复位回波 / 程序写 / 布局）不改旗标；

  `maybeScrollBlock` 在 rAF 尾逐块应用——`open=false` 或 `!isConnected` → no-op，默认钉底写超值（不读 `scrollHeight`）。
  **应用时机契约在核**——端侧遗漏应用点 = **违约缺陷**（应用点清单单源 = `docs/render-core/design/RENDER-CORE.md` §2 KD-RC-8：追加后 ∕ 挂载后 ∕ 帧尾复核）。

  **键盘位移**（键盘滚动——无手势标记）不改旗标（非手势位移同路）；可达性 unverified（需真机核）⇒ **残余登记**（单源 = 核档 §2 KD-RC-8）。**手势窗内以手势为准**（窗内非手势位移按手势期计——有意取舍）。

  **滚动策略族工厂化**：策略族四件（判据 ∕ 写门 ∕ 旗标维护 ∕ 计数簿记）抽核件 `thincoder-render-core/scroll.mjs`——本端 = **工厂消费**：
  `thincoder-vscode/webview/ui.js` 四函数（`scrollDown` ∕ `maybeScrollDown` ∕ `maybeScrollActivity` ∕ `initScrollFollow`）改工厂调用；旗标宿主 `ctx`：`_pinBottom` ∕ `_pinActivity` 键名与跨档共读面保持；

事件集 `wheel` ∕ `touchmove` ∕ `scroll` 保持；
  核 `thincoder-render-core/subblocks/block.mjs` 两导出 = 薄包——**零行为变更**（`ui.js` **255 行**）；判据 = M-607 a–c + 真机 P6。
  - **让位期出口**：让位期（`_pinFollow === false` ∧ 内容可滚 ∧ 块展开）⇒ 块内**右下 overlay** 钮 `.sub-follow-btn`（核件自持——本端零 JS；样式 = `thincoder-vscode/webview/base.css`（`.activity-new-btn` 邻位））；
    两态文案 = `sub.follow.new`（让位期间有新行）∕ `sub.follow.bottom`；
    点击 ⇒ 回底 + 复跟 + 钮退场（清账三路：点击 ∕ 近底复跟 ∕ 元素重建——同区首计数钮对位）；折叠态钮不显（CSS 兜底）。键登记 = `WEBVIEW-PROTOCOL.md` §6.3。
- **帧驱动**（`thincoder-vscode/webview/streaming.js:28-33` · `:183`；核 `thincoder-render-core/flow/stream.mjs:88`（重排条件含脏集）· `:93-98`（脏集消费置空））：`subagentChunk` 追加后把块记入脏集，rAF 体内逐块 `maybeScrollBlock` 后置空；**节流重排条件含脏集**（跳过的帧不得丢跟随）；`maybeScrollBlock` 取件 = `activity.js` 转口（核件单源）。
- **高度**：`.advisor-block.sub-block .advisor-content` = **60px**（`thincoder-vscode/webview/chat.css:467`）；基础 `.advisor-content` = 100px（`thincoder-vscode/webview/chat.css:318`）。
- **出生可见性（④——新块必看得见）**：
  - **区 pin 旗标维护**：`ctx._pinActivity` 由 `scroll` / `wheel` / `touchmove` 三事件同读几何（近底 24px——`ui.js:250-255` + 核 `thincoder-render-core/scroll.mjs:78-126` `watch` 闭包）。`scroll` 为**唯一「滚动已生效」后**触发者（键盘 / 拖条 / 程序写入全覆盖）。
  - **出生判据（二向）**：`buildBlockEl`（`activity.js:53-72`；出生判据点 `:66-68`）出生时——钉底（`_pinActivity !== false`）⇒ 照旧 `maybeScrollActivity(ctx)`（跟随）；**未钉底** ⇒ **不改 `scrollTop`**（不夺用户阅读位——D-W2 语义保持），
    改在**区首**生成 / 更新未读计数钮 `.activity-new-btn`（`position: sticky; top: 0`；文案 = locale 键 `sub.newBlocks`（zh `↓ ${n} 新块` / en `↓ ${n} new block(s)`——逐字登记 = `WEBVIEW-PROTOCOL.md` §6.3）；`N` = 未钉底期间出生块数）。

    **落档 = 新档 `thincoder-vscode/webview/activity-new.js`（已落）**——建 / 更 / 删钮 + 点击回底 + `resetActivity` 同清；`activity.js` 只在出生判据点调用。
  - **回底清账**：钮点击 ⇒ `scrollTop = MAX` + `_pinActivity = true` + 移除钮 + `N` 归零；任一「近底」判定成立（`scroll` 事件）同清；`resetActivity` 同清。
  - **`:empty` 不回归**：钮按需建 / 删（`N = 0` 时元素不存在）——空区仍 `:empty` 零高（D-W1）。
  - **判据**：T-A21 / T-A22 / T-A23（未钉底出生 ⇒ 钮 `N = 1` 且 `scrollTop` 零改；点击 ⇒ 回底 + 钮消失；`scroll` 事件两向旗标正确）。

### 5.6 内容行合并粒度（CLI `pushBlock` 对齐）

**口径** = 以 CLI 为标尺（`docs/cli/design/TUI.md` §6.8.2；两端语义冲突以 CLI 为准）。三面实读（file:line 实核）：

| 面 | CLI 合并判据（标尺） | 本端（落形） |
|---|---|---|
| text / think | `pushBlock`：`!fresh && last.kind === kind` ⇒ 并入末块（`thincoder-cli/src/tui/subagent-children.mjs:139-145`） | 同判据（`.advisor-text` 行 kind + `sub` 同即并入——核 `thincoder-render-core/subblocks/block.mjs:52` `renderSubagentChunk`，**零改**） |
| kind 翻转 | `last.kind === kind` 不成立 ⇒ 新块（`subagent-children.mjs:140`） | 新行（同判据——**两端同构，非端差**） |
| 工具输出 | `fresh = currentTool !== toolName`（工具名取自 relay 前缀 `path.rest`）⇒ 工具名不变即并入末块、**RAW 拼接零分隔符**（`thincoder-cli/src/tui/subagent-blocks.mjs:368-375`） | **新**：末子行 = 工具行 ∧ `dataset.face === "toolOutput"` ∧ `dataset.tool` 同 ∧ `dataset.sub` 同 ⇒ 并入（文本节点拼接，零分隔符） |
| 工具调用行 | 恒新块（`fresh: true`；行尾带 `\n`——`subagent-blocks.mjs:350`） | 恒新行（`face === "toolCall"`） |

**依据**：relay chunk = **任意字节边界碎片**（CLI 同注释实证：逐 chunk 补 `\n` 会把词拦腰断行——`subagent-blocks.mjs:355-358`）。

**面随载荷（协议字段 `face`）**：CLI 以「哪个路由函数被调用」表达面；本端四面压成单 `toolPanel` 载荷 ⇒ 面必须随载荷，否则调用行与输出行不可分（输出并入调用行 ⇒ 工具名粘连）。取值与登记 = `WEBVIEW-PROTOCOL.md` §3（`toolPanel` 行）· §3.2 行 3。

**端差（实证例外——行为证据：视觉等价）**：CLI 首条 ``toolOutput`` **并入调用块**（`fresh = sub.currentTool !== toolName` ⇒ 调用后同名输出不新开块——`thincoder-cli/src/tui/subagent-blocks.mjs:373-374`；调用行自带 `\n`——`:350`）⇒ 块面 1 段；
  本端面门（`face` ⇒ 调用行 / 输出行各成行）⇒ **2 段**。**视觉等价**（CLI 调用行内换行、输出紧随下一行）⇒ **维持 R3 面门**。

**RAW 与换行**：并入 = 逐字文本节点拼接（零分隔符，同 CLI `subagent-children.mjs:143`）+ `.advisor-tool-line` 加 `white-space: pre-wrap`（`thincoder-vscode/webview/chat.css:337`）⇒ 输出自带换行结构无损还原、chunk 边界不可见。

**降级（fail-safe）**：无 `tool` / 无 `face` 的 chunk（旧生产者 / `onToolPanel` 缝）⇒ **恒新行 = 旧行为零变**（不猜）。

**不做**：不跨 kind 合并 · 不并「不同 `sub`」的行（`dataset.sub` 合并判据 = 机制面，与 CLI `fresh` 判别同族）。

**行首子标（嵌套身份挂行首）**：`sub` 在场的行 ⇒ 行首渲 `span.advisor-sub`，内容 `<sub> · `（核 `thincoder-render-core/flow/block.mjs:87-94` `appendLineText`；接入两处 = `:63` 工具行 ∥ `:79` 文本/思考行；CSS = `thincoder-vscode/webview/chat.css` ∥ `thincoder-desktop/renderer/core.css` 的 `.advisor-sub`（dim——`opacity: 0.55`）。

**规则**：块头 = 父的身份（`[▶ role#id · …]`），子在做的事挂行首——父子是两个实体，不能挤在同一个块头里（用户 2026-09-07 裁定「块内子标」）；`sub` 缺席（父自己的行）⇒ 纯文本、零 span。

**合并续写只渲一份子标**：`toolOutput` 同工具同 `sub` 的续行并入末文本节点（`:55-57`；判据含 `dataset.sub` 相等），子标已在该行行首 ⇒ 不重复渲——否则每个 chunk 都重复一次子标，行文碎裂。

**与状态词的分工**：行首子标 = 身份（谁在做），状态词 = 此刻在做什么（§5.2）；两者可同时在场，互不顶替。用例 = N1–N5（N3 负控 = 无 `sub` 零变 · N4 = 续写子标一份）。

**判据**：同工具连续输出三片段 ⇒ 段数 2；工具改 ⇒ 新段；调用行恒新段；kind / `sub` 交替恒分段；旧生产者降级；kind 缺省 ⇒ 文本行。

### 5.7 消化面记录恢复（痕 ∥ 归档块）

> 机制（记录形 ∥ 写缝 ∥ 读缝 ∥ 重建义务 ∥ 容差）单源 = `docs/core/design/SESSION.md` §6.26；需求 = F-W1（恢复后存续）∥ I-7（收窄——未归档块不恢复）。本端承接 = 写面（宿主同点追加 + webview 出站）∥ 读面（opt-in 直通）∥ 重建（痕元素逐条位次 ∥ 归档块原形态）。live 归档面 = §5.1 生命周期表（零改）。
> **本端不绑记录存储**（记录走槽 JSON 投影——`docs/core/design/SESSION.md` §6.14 兼容红线逐字保持：sidecar 对本端可见面零暴露；全量绑定 = 窗口驱逐伤本端全量人读线 + 保存面重构，超批不取）。

- **写面（两产生面）**：
  - digest 三型 = **宿主同点追加**（与发帧**同点双动作 = 与 `postMessage` 同行**——核 `pushRecord`）：`start`/`end` = `thincoder-vscode/src/extension/suspension.mjs` 的 `pushRecord` 调用点（起跑 ∥ 收尾各一处，锚 = 与 `postMessage` 同行）；`cap` = `panel-callbacks.mjs` `postDigestCap`（全调用面同收）。
  - subagent 快照 = **webview 归档派生点出站**（`webview/activity.js` `archiveBlock` 同点——幂等守卫内，每块恰一次）：
    构建 `{kind:"subagent", meta, rows}`（`meta` = 块头事实（已知字段子集——核契约字段；`pool` boolean 在场即写 ∥ `queued === true` 时写；`key` = 块键已规范形 `sub:<role>#<id>`，零改）；

`rows` = 块内容行集（`.advisor-content` 行派生，`{kind, text, sub?}` 形——保尾上界同核契约））
    ⇒ `vscode.postMessage({type:"recordAppend", record})`（协议登记 = `WEBVIEW-PROTOCOL.md` §3.2 行 22；§13 行已落）；

    宿主 `panel-messages.mjs` 分派 ⇒ 处理体取**当前会话活行载体人读线数组**（`(panel._liveLines ?? panel._susp?.lines).fullHistory`——`saveLines` 所写 `history` 槽字段之源）经核 `pushRecord` 追加（入参映射钉定 = core §6.26 产生面条；fail-soft——载体缺位 ⇒ 零动作 + 日志）。
- **行形：子标随行（结构不落正文字面）**——`rows` 条目 = `{ kind, text, sub? }`。`sub` = 该行的嵌套身份（行首子标字面，如 `explore#1` ∥ `advisor#1/explore#2`）；`text` = **行正文**，子标字面不在其中。

  **勘察源**：查过 `docs/`（本仓文档权威面）、仓根 `test/RTM.md` 与本端用例清单 `thincoder-vscode/test/files.mjs`；工作树内无独立文档仓，故公开源档面无外部对象可查——本条依据只有端内三处实读（桌面 ∥ 核 ∥ 本端，见下「对齐依据」）。

  **派生点** = `webview/record-rows.js` `rowsOf`（叶件、零依赖——原 `activity.js` 的 `rowsOf` 同一份实现迁出，禁第二份派生）：读行元素的 `dataset.sub`（写点 = 核 `thincoder-render-core/flow/block.mjs` `appendAdvisorChunk` 的工具行支 ∥ 文本/思考行支）与正文文本节点，**行首 `span.advisor-sub` 不入 `text`**——带字面回放会得 `explore#1 · explore#1 · read — …` 双份。

  **空正文行 = 两端同判丢弃**：跳过判据 = `text` 为空，与 `sub` 在场与否无关——`text` 只装行正文，行文全空的行在任何一端都不产行。该态在活流不可达（核 `thincoder-render-core/flow/block.mjs` `appendAdvisorChunk` 的 `if (!str) return` ⇒ 行元素必有非空正文）⇒ 两端同一谓词即足；派生面（`rowsOf`）与回放面（核件早返）两处同判，CLI 读面同谓词（承接 = `docs/cli/design/TUI-SESSION-VIEW.md` §6）。

  **对齐依据（桌面现行形，逐字实读）**：`thincoder-desktop/renderer/subagent-reduce.mjs` 的 `SUBCHUNK_KEYS = ["kind", "text", "sub", "tool", "face", "cmd"]` ⇒ `subchunkOf` 白名单投影成行对象 ⇒ 快照 `rows` 原样带 `sub`。
  桌面无 DOM（行即载荷投影），本端行由 DOM 派生 ⇒ 补同一字段名，零新名。

  **回放 = 同一核件**：核 `thincoder-render-core/subblocks/block.mjs` `renderSubagentChunk` ⇒ `appendAdvisorChunk(block, kind, m?.text, m?.sub, m)`；
  桌面经协议根 `/rc/` 直映射同件、本端经 `webview/record-restore.js` 的 `renderSubagentChunk` 逐条回放 ⇒ 同一行形两端同行，端侧零新增回放逻辑。

  **容读（存量快照）**：条目无 `sub` ⇒ 按无子标行呈现（`span.advisor-sub` 零个、`text` 原样）。存量 VSC 快照的子标已烙在 `text` 内 ⇒ 呈现逐字不变——零迁移 ∥ 零回填 ∥ 零版本标记。

**反向（CLI 读面）——同一份记录，同一件事**：CLI 读面 `synthSubTask`（`thincoder-cli/src/tui/lifecycle-records.mjs`）把条目合成行——`sub` 在场 ⇒ 行首文本前缀 `<sub> · `（与本节 span **同一串**：同字面、同位置、同分隔符）；`sub` 缺席 ⇒ `text` 原样。⇒ 同一份归档快照在 VSC ∥ 桌面（DOM span）与 CLI（纯文本行）读出同一行全文；差别只在承载，不在内容。CLI 承接细则 = `docs/cli/design/TUI-SESSION-VIEW.md` §6。

**跨端不设容差**：恢复面的子标承载三端同串同位置，故本变更不在跨端恢复面登记任何容差——判据是「三个端读同一条记录，看到同一件事」。

**两端跳过谓词必须逐字同形**（`text === ""`，不读 `sub`）：派生面 = `thincoder-vscode/webview/record-rows.js` 的 `rowsOf`，读面 = `synthSubTask`（`thincoder-cli/src/tui/lifecycle-records.mjs`）；改任一处必须同轮改另一处，交付评审逐字比对。

  **不取其三字段**：`tool` ∥ `face` ∥ `cmd` 不入本端行形。`cmd` 只进状态词、不入行元素（`flow/block.mjs` 的 `appendAdvisorChunk` 工具行支只写 `dataset.face` / `dataset.tool`），本端派生面取不到；
  且回放分行已由 DOM 行粒度固化（每元素 = 一条 `rows`，live 合并发生在写行时）⇒ 三字段不参与本端回放形态。跨端读他端快照时三字段原样携带、本端不消费。
- **读面**：`panel-session.mjs` 两处 `historyWindow(…, { records: true })`（opt-in——页尺核常量）⇒ `historyPage.messages` 随携记录（`sendHistoryPage` 清洗面零改——记录过清洗原样）。
- **重建**（`webview/history.js` 页级 pass + 重建件（`webview/record-restore.js`）；元素携 `data-idx`（位次锚——分页游标 ∥ 防双渲染））：
  - `digest` 记录 ⇒ 痕元素：`start` ⇒ `.digest-turn` 标签（tier 两档逐字——ask 携 `from`/`msg`）+ `n>0` ⇒ `.digest-status`（`dataset.n`）；`cap` ⇒ `.digest-cap`（**按记录 `mode` 分档**：`auto` dim ∥ `stop` warn——本端现无 auto 产者（`postDigestCap` 定义 · 单调用点 `panel-turn-loop.mjs`）；读取面按契约前向兼容）；
    `end` ⇒ **追加终态元素**（`.digest-status` + `digest-done` ∕ `digest-failed`——构形件化后**与 live 同调**（`webview/chat-status.js`——单一实现零副本）；零就地换文）。
    **复列 = 全量**（记录序 ≡ 恢复序——**轮锚 = 起跑记录**：起跑 ∥ `n > 0` 计数 ∥ cap 元素随轮出；终态元素需 `n`（同页起跑）；**未结轮照现**——可证面 = 轮间 ∥ 末页；起跑未载的 `cap` ∥ `end` 记录零产——容差①）。
  - `subagent` 记录 ⇒ 归档块元素 = **活形同构**（核 `subblocks` 原语直消费 + `rows` 回放 + 冻结节 + tail-3）+ 落点镜式（**记录位次原位（零配对）**——重建径；与 live `archiveBlock` 到达序**两径并存为设计**——对位桌面「归档块 = 普通块——记录位次原位出」）。
  - 负控 = 记录缺 ⇒ 恢复面逐字等价；未归档块（live / 在飞）**不重建**（I-7 收窄——池内块非记录对象）。
- **容差（本端状态）**：① 跨页分裂 = **不可证面零产**（起跑未载的 `cap` ∥ `end` 记录不入 ∥ 非末页尾残起跑不入——与桌面同构；页 200 条低频 ∥ 数据零损；重开条件 = 实测走查命中 ⇒ 另批）；② 归档快照落盘晚一拍（出站异步 ⇒ 记录随**下一次** `saveLines` 落槽；「重载可见性 = 至最后一次落盘」）。
- **验收回指**：F-W1 判定句 + I-7 收窄负控 + 本节用例表 T-A46–T-A49；真机 = 面板重开 ∥ reload（父侧走查）；集成面 = `test/RTM.md` VSC 端故事 1（行 1-1 ∥ 1-2）——父侧收口跑。

**用例（行形——机判驱动 = 核件建块 + 核件回放；DOM 底座 = happy-dom 真 DOM，按下述相对路径导入）**：

**DOM 底座与导入形（按路径可达性定，不是环境态）**：本批单元用例件住批档目录（`docs/batches/`），Node 的裸说明符解析自该目录只走 `docs/batches/node_modules` → `docs/node_modules` → 仓根 `node_modules`，**到不了 `thincoder-vscode/node_modules`** ⇒ 一律以相对路径导入（happy-dom ∥ `@thincoder/render-core` 两处）。

happy-dom 已装在该目录（`thincoder-vscode/package.json` devDep，实测在盘 = 20.11.2）——与 VSC 测试树同一个 DOM 底座，本档不再有第二套桩 DOM。

**导入顺序**：`document` 就位后再 `await import()` 被测件（核 `subblocks/block.mjs` ∥ `webview/record-rows.js`）；被测叶件零浏览器全局依赖（`record-rows.js` 只吃元素对象），import 面到此为止。具体入口（`Window` ∥ 注册器）以首次真跑为准——「修前红」那一次实跑即凭。

| # | 场景 | 输入 / 触发 | 期望（可断言） |
|---|---|---|---|
| T-A46 | 正常：嵌套行快照带 `sub` | 真块（核 `renderSubBlock` + `renderSubagentChunk`）喂 `sub:"explore#1"` 两行：工具行 `text:"read — src/x.mjs"`、文本行 `text:"looking into it"` → 取快照 | `rows` 两条各含 `sub:"explore#1"`；`text` 分别为 `read — src/x.mjs` ∥ `looking into it`，均不含 `explore#1 · `（**修前红**：`sub` 缺席、字面在 `text`） |
| T-A47 | 正常：同一行形两端同一行 | 把 T-A46 的 `rows` 原地喂新块（`renderSubagentChunk`——桌面取同件） | 两行各渲 `span.advisor-sub` 恰 1 个、子标文本 = `explore#1 · `；工具行全文 = `explore#1 · read — src/x.mjs`、文本行全文 = `explore#1 · looking into it`——各与 live 行逐字等 |
| T-A48 | 边界：父自己的行（负控） | 同载荷去 `sub` | 快照条目无 `sub` 键；回放零 `span.advisor-sub`、`text` 逐字 |
| T-A49 | 边界：存量快照容读 | 手写条目 `{kind:"tool", text:"explore#1 · read — src/x.mjs"}` 回放 | 零 `span.advisor-sub`、行全文逐字不变（子标留正文——呈现与修前同） |

### 5.8 阅读位保护与视图偏好

- **缺陷 a（阅读位被夺）修法 = 调用点纪律回正**：工具卡建 / 完成（`ui.js` `addTool` ∥ `finishTool` 两径）与错误横幅（`showError`）改走 `maybeScrollDown`（旗标门——`_pinBottom === false`（用户上滚）⇒ 零写不夺；钉底照旧跟底）；
  `scrollDown`（强制重 pin）只留显式动作（回底钮 ∥ 发消息 ∥ 首窗历史）。判据 = 单元测试（旗标假 ⇒ `scrollTop` 零改 ∥ 旗标真 ⇒ 写 MAX——修前红对照）。
  **已修面（保持）**：滚动条拖动 / 键盘滚动同解 pin（`scroll` 事件按近底直写——核 `scroll.mjs` 现行集）。
- **Thinking 默认展开**：推理块两径默认展开——核 `thincoder-render-core/flow/reasoning.mjs`（live 流式块，`details.open = true`）∥ 核 `thincoder-render-core/flow/block.mjs`（恢复帧，`<details … open>`）；手动折叠仍可只看摘要。理由 = 折叠态在界面上等同「没有活动」，看不出模型在跑还是在卡（用户 2026-10-19 14:23）。
  本端零改（两径直调核件，值随核缺省落地）；成员面同轮收正（`docs/server/design/agent/MEMBER-AGENT.md` §3.11(1)）——三面默认态一致（桌面自持 `thincoder-desktop/renderer/views/chat-text.mjs:55` `open: true`）。机制与推翻 #875 的理由 = `docs/render-core/design/RENDER-CORE.md` §5。
- **视图偏好三项（VS Code 设置面）**：`thincoder.ui.autoFollow`（boolean，默认 true）∥ `thincoder.ui.activityMaxHeight`（number，默认 32，单位 vh——活动区封顶）∥ `thincoder.ui.activityTailLines`（number，默认 3，允许 0——折叠预览行数）。
  推送 = 新消息 `uiPrefs`（ext → wv；协议登记 = `WEBVIEW-PROTOCOL.md` §3 ∥ §3.2 行 23）；发射 = `thincoder-vscode/src/extension/ui-prefs.mjs`（webviewReady 握手 + `onDidChangeConfiguration`——先例 `stop-trace.mjs`）；
  应用 = `thincoder-vscode/webview/ui-prefs.js`（偏好态落 `ctx._autoFollow`；缺键 / 坏值 ⇒ 缺省 true）。

`autoFollow = false` ⇒ **自动滚动全禁**——门落点三处（覆盖 = 三径全数）：
  ① 消息区 `maybeScrollDown`（`ui.js`——函数体内门，全调用面随门）② 活动区 `maybeScrollActivity`（`ui.js`——同式）③ 块内容跟滚（帧尾消费点 `thincoder-vscode/webview/streaming.js` `subScroll` 循环前门——`maybeScrollBlock` 全数随门）；
  **显式动作不受影响**（回底钮 ∥ 发消息 ∥ 首窗历史——`scrollDown` 直写零门）；

负控 = 旗标假 ⇒ 三径 `scrollTop` 零改。

tail 行数消费缝 = 核 `configureActivityView({ tailLines })`——**缺省单源 = 核**（`activityTailLines` 缺省值 `3` 的判据单源 = `DEFAULT_TAIL_LINES`，`thincoder-render-core/subblocks/activity-view.mjs:19`；缝归一（坏值 / 缺键 ⇒ 3）为终裁）；
  端侧消费形 = 交缝归一（`thincoder-vscode/webview/ui-prefs.js` 把载荷值交缝——端侧不持缺省判据）；

端侧现存镜像归一（`ui-prefs.js:21` 的 `: 3`）为冗余防御层（与缝归一幂等——去留零行为差）：消解路径 = 该档下次实质改动去镜像（透传化）；到期条件 = 该档下次实质改动。

  **射程说明（滚写入两处不入 `autoFollow` 门——登记为例外）**：
  ① **提示件**——`webview/permission.js:25` ∥ `:37`（逐项卡 ∥ 合并卡）与 `webview/question.js:22`（提问卡）的 `scrollIntoView` 不入 `autoFollow` 门：语义面 = 提示件需用户在场注意力（不滚入视口 ⇒ 静默挂起风险）⇒ **保持在场语义**（有意设计；`autoFollow` 语义面 = 工具 / 流式自动滚动）。

  ② **推理内容区内部跟滚**——核 `thincoder-render-core/flow/stream.mjs:30`（`paintReasoningTarget` 尾 `el.scrollTop = el.scrollHeight`）不在三径门集内（设计射程外——按实况登记为例外面）：
  本端 `.reasoning-content` 内滚面（`thincoder-vscode/webview/chat.css:399-400`——`max-height: 200px` ∥ `overflow-y: auto`）⇒ 该写**于展开 + 内容溢出时生效**（帧逐拍钉底）；

默认展开为缺省 ⇒ 该写常态生效（内容溢出时）；复评条件 = 用户另裁 ∥ 推理区内滚面并入 `autoFollow` 射程时（另轮可入门）；桌面面（同写经 `thincoder-desktop/renderer/views/chat-text.mjs:85`）归其自身批次。

## 6. 关键决策记录

| # | 决策 |
|---|---|
| D-W1 | 活动区容器居 `#messages` 与 `#panels` 之间；空区 CSS `:empty` 零高（零显隐 JS） |
| D-W2 | 区高度自适应 + 32vh 封顶 + 区内自滚 + pin 跟随 |
| D-W3 | ⏹ 单委托点迁区（`chat.js:86` 挂 `ctx.activityEl`，空安全绑定） |
| D-W4 | 终态去向 = **消化后归档落流**（轮边界插入；失效退化尾追） |
| D-W5 | `awaitingDigest` = 冻结态上的**单标志**（等待消化；CLI 行形态头词） |
| D-W6 | 区保留上限退役（`MAX_REGION_FOLDED` / `enforceRegionCap` 已删——无折叠块常驻后上限成死码） |
| D-W7 | `resetActivity` 只清**区子树** |
| D-W8 | 会话退出 = 区**全体**归档（flushing 兜底） |
| D-W9 | 出生事件队列化 + 就绪/清屏后再断言（**只带 live 条目**） |
| D-W10 | 终态补块前置 = **合法 id + 合法角色段（`[\w-]+`）+ 回读解析一致**（consult / escalate 纳入判据） |
| D-W11 | 频道名 `sub:<role>#<id>` 与 chunk 路由契约**不变** |
| D-W12 | 队列上界 200 + 溢出丢最旧 + `ev:subdeliver` 留痕 |
| D-W13 | 块级跟滚载体 = **原语入核 · 本端留调用点 ∕ 帧驱动**（核件 `thincoder-render-core/subblocks/block.mjs` `initBlockFollow` / `maybeScrollBlock`） |
| D-W14 | 高度 60px 作用于 `.sub-block` 全部（live + 冻结同卡面）；advisor 流内块维持 100px |
| D-W15 | 合并权限卡**携 `promptId` 并入逐项卡族**（单一释放通道 + 同一移除选择器） |
| D-W16 | **模型 / 推理钮随处可切**（写面保护替代硬挡；进忙态不关浮层——见 §4.2） |
| D-W17 | `@` 引用 = **显示边界剥离**（消费面二处 = 恢复面显示 + **标题源文本**——均还原简洁形；落点端侧） |
| D-W18 | 非零退出 = **判据扩**（卡态 + 保持展开 + 摘要含退出状态，同一判据派生） |
| D-W19 | spawn 失败（进程未启动） = **产者补状态位** `(spawn failed)`（状态位族第三成员；端侧判据族随扩一名）——**产者两处、同名同形**：核 `thincoder-core/tools/bash.mjs:183-190`（CLI 面）· **宿主 `thincoder-vscode/src/tools/shell.mjs:242-260`（本端卡面真产者）**；同拍收正宿主两态（超时 ⇒ `(killed: timeout <N>ms)` · 输出超容 ⇒ `(killed: output limit exceeded)`）+ **退出码槽只接受数字**规则；本端 `bash` ≠ 核 `bash`（`thincoder-vscode/src/tools/index.mjs:30` · `:173-176`）⇒ 只改核面则本端卡面零变化 |
| D-W20 | 出生自愈 = **既有存活投影的 2 s 心跳**（拍体即 `reassertLiveChildren` 本体；起于就绪握手、止于 dispose） |
| D-W21 | 心跳**允许**对已冻结键建新代（接管；host 是「该键仍 live」的权利人） |
| D-W22 | 痕迹面 = `thincoder-vscode/webview/activity-diag.js` + 上行 `panelDiag` 入主侧日志 |
| D-W23 | 终态「块缺失」判据**扩 tombstone 一形**；**射程含 consult / escalate**（端侧键 = `sub:<role>#<id>`，可单源重建——见 §5.3） |
| D-W24 | 心跳源新鲜度 = **会话切换 / 新建会话点清 `panel._liveLines`**（回落 `_susp?.lines`）；落点 = `thincoder-vscode/src/extension/panel-session.mjs:113` `loadSession` 入口段（置空行 `:131`——五路会话操作汇合单点） |
| D-W25 | **出生面 = 存活闸 + 非出生面 = 禁静默**（①）：出生事件（`queued` / `started`）命中冻结键 ⇒ 接管建新代；非出生消息（chunk / turn / 终态）命中 ⇒ 维持丢弃 + `drop-frozen` / `drop-tombstone` 痕。**判据分界依据**：CLI 存活判据读池实体（`livePoolHas`），端侧无池 ⇒ 存活凭据 = 出生事件本身 + host 心跳（D-W21），故分界 = 消息形态（见 §5.3） |
| D-W26 | 出生建块门**两维去门**（②③）：去 `FAMILY_ROLES` 门、去 `pool` 门——`started`（含 sync `[model]` 与 escalate / consult）即建块；`sync` / `async` 词仍由 `pool` 派生 |
| D-W27 | 出生可见性判据 = **钉底跟随 / 未钉底计数钮**（`↓ N 新块`，点击回底）+ pin 旗标由 `scroll` 事件维护（保留 wheel / touchmove） |
| D-W28 | 内容面**并入同一投递队列**（`postSubagentEvent` 单口——就绪门 + 队列 + 溢出丢最旧） |
| D-W29 | view dispose = **保持清队**（跨 view 不串味）+ `discard-dispose` 留痕；重建面交心跳 / 就绪再断言 |
| D-W30 | `onToolResult` 第 4 参（`_subagentKey`——核 `agent/dispatch-run.mjs:154`）**端侧消费** ⇒ sync 子代理块终态落定；仅 sync 路径带该参（`subagent.mjs:380-390`）⇒ async 零误冻 |
| D-W31 | 心跳射程 = **池条目**；sync spawn 出生面由出生闸承担（不在心跳射程） |
| D-W32 | 工具卡「已结算」= 卡对象 `done` 旗标（**唯一写点** = `finishToolCard` 首行；建卡 `addTool` 置 `done:false`）+ 回合尾**无条件**清扫未结算卡（`webview/streaming.js` `sweepUnsettledToolCards`——`finish()` 内 complete / aborted 两路径同规）（M1） |
| D-W33 | `context X%` **单口径**：分子 = 核 `historyReading(history, provider, ratio).tokens`（校准后的历史估算；`ratio` = `tokenRatioOf(agent)`）∥ 分母 = 同一次调用带出的 `historyReading(...).window`（与 CLI 状态行**同源**；`providerSpec(provider).context` 只在核单点——派生单点 = `thincoder-vscode/src/specs.mjs:83` `ctxUsageForHistory`，委托核 `historyReading`；`ctxPercentForHistory`（`:89`）= 其 `.pct` 薄转口）（M2） |
| D-W34 | 对象 chunk（核 sync 评审 `{kind, text}`）在**端边界归一**为串（`thincoder-vscode/src/extension/panel-callbacks.mjs` `onToolOutput`——**CLI 逐字先例** `thincoder-cli/src/tui/tool-events.mjs:326`）（M3） |
| D-W35 | digest 起跑携 `tier` ∈ `ask` / `digest`（**按因两档**——判据与 CLI 同源：ask 因优先；ask 档同携 `from` / `msg` 问题摘要）；计数元素随 **`n > 0`**（两档同规；`n = 0` ⇒ 零元素、end 侧零兜底——禁幻影计数行）（M4 · F-UC8） |
| D-W36 | advisor 卡头 / 状态行轮次标签 = **端侧单源** `advisorRoundTag`（字面 = CLI `roundTag` 逐字 `(round N · model)`；无 `model` ⇒ `(round N)`；非 advisor 零字段）（X2） |
| D-W37 | 工具摘要族 = **端侧单源** `thincoder-vscode/webview/tool-summary.js`（`formatToolSummary` 分派；字面逐字承 CLI；活卡 / 恢复卡共用）（X3 · X7）——单源现 = 核 `thincoder-render-core/tool-summary.mjs`，本端 = 3 行再导出 shim |
| D-W38 | 工具结果截断提示 = **宿主切片点事实旗标** `truncated` 驱动（正文尾行 + 摘要标注）（X5） |
| D-W39 | 块头注记 = **块级 `meta.note` 单字段载体**（X6 停因注记 + X11 `interrupted` 共用；`— <note>` 渲染句复用——禁第二注记字段 / 禁第二回落通道）（X6 · X11） |
| D-W40 | sync 块 ⏹ = 门控加 `syncLive` 支 + 路由走核 registry（**只读**·禁第二套 registry）（X10） |
| D-W41 | 推理按钮**中性档** = 「—」且无 ✓（未注册默认 ∧ 已存值 ∉ 枚举）；不新增列表项（U-W20）——判据单源 = `doc:docs/core/design/MODEL-SPECS.md:§15.4` |
| D-W42 | 状态词**嵌套身份前缀** = `<sub>/`（`m.sub` 在场；relay `path.inner.join("/")`）；作用于工具行状态词（`<sub>/<tool> — <cmd ≤60>`）与顾问名（`<sub>/advisor`），前缀逐 chunk 重算（F-W23 ①）。**身份主承载面 = 行首子标（D-W44）**——状态词前缀只是附注 |
| D-W43 | **think 不改写已有状态词**，**唯一例外 = 状态词还空 ∧ 有子标**（`meta.stateWord == null` ∧ `m.sub` 非空 ⇒ `<sub>/<think 词>`）；text 零改写；`toolOutput` 零改写（唯一例外 = 顾问名支，D-W45）；顶层 think 恒零写入 ⇒ 缺省支 = 裸 think 词、零前缀（F-W23 ②） |
| D-W44 | **行首子标** = 嵌套身份的主承载（`sub` 在场 ⇒ 行首 `span.advisor-sub` 渲 `<sub> · `；无 `sub` ⇒ 纯文本）；块头只写父的身份（父子两实体不同行——用户 2026-09-07 裁定）；`toolOutput` 同工具同 `sub` 续写只渲一份子标（N1–N5） |
| D-W45 | **`started` 清状态词 = `queued → running` 那一次**（核 `subblocks/state.mjs:177` `if (block.queued) block.stateWord = null`）；心跳重发的 `started` 不再清——清空的语义只在「排队标注要撤掉」时成立，否则标题每 ~2 s 闪回裸词（用户 2026-10-21 18:01；S1） |
| D-W46 | **归档快照行形带 `sub`**（`rows` 条目 = `{kind, text, sub?}`）：子标是结构，`text` 只装行正文——对齐桌面既有形（`SUBCHUNK_KEYS` 含 `sub`）；派生点 = 本端 `rowsOf` 读 `dataset.sub` + 剥 `span.advisor-sub`；回放走同一核件 ⇒ 两端同行。**不取**「子标不进快照、改由块头携带」：块头是父的身份（D-W44），而一个块内多行分属不同子代（`advisor#1` ∥ `advisor#1/explore#2`）⇒ 块头无处安放逐行身份。**`text` 空的行两端同判丢弃**（与 `sub` 在场无关）——该态活流不可达，两端同一谓词 ⇒ 行数同判 |

## 8. UI / 交互决策落档

| # | 决策 | 状态 |
|---|---|---|
| U-W1 | 活动区位置 = `#messages` 与 `#panels` 之间；空区隐藏零高 | 已定（§2 · D-W1） |
| U-W2 | 区高度 32vh 封顶 + 区内自滚 + pin 跟随（近底 24px，同消息区口径） | 已定（§2 · §5.5 · D-W2） |
| U-W3 | 归档块 = 流内折叠卡（可展开，头 + tail-3）——形态与 live 块同卡面 | 已定（§5.1 · §5.2） |
| U-W4 | awaitingDigest 块头 = CLI 面板行形态（括号去 verb + 态词） | 已定（§5.2） |
| U-W5 | ⏹ 语义不变（仅迁址）；冻结块无 ⏹；queued 头取消 ⏹ 保留 | 已定（§5.2 · D-W3） |
| U-W6 | 块内容区高度 60px（live + 冻结同卡面） | 已定（§5.5 · D-W14） |
| U-W7 | 可调常量（批准环节可翻转）：`max-height: 32vh` · 60px 数值本身 | 已定（open 面 = 数值，非语义） |
| U-W8 | 合并权限卡释放形态 = **卡消失**（不做「已拒绝态」变体） | 已定（§4.1 · D-W15） |
| U-W9 | 模型 / 推理按钮**随处可点**（零 `disabled` / `aria-disabled`；进忙态不关浮层） | 已定（§4.2 · D-W16） |
| U-W10 | 失败工具卡 = 红 + **保持展开** + 摘要含退出状态；成功面拼接已归一（`(exit code 0)` 拼） | 已定（§4.3 · D-W18） |
| U-W11 | spawn 失败（无退出码）摘要 = 状态位本体（`→ (spawn failed)`）；三信号同形不改 | 已定（§4.3 · D-W19） |
| U-W12 | 未钉底时新块出生 = **区首计数钮**（`↓ N 新块`，点击回底）；不抢用户阅读位、不牵动 `#messages` | 已定（§5.5 · D-W27） |
| U-W13 | 中止后未结算工具卡 = 状态词「已中断」+ 摘要 `→ (interrupted)`（不套错误色；已结算卡零改写） | 已定（§4.5 · D-W32） |
| U-W14 | 工具结果截断 = 正文尾标记行 + 摘要尾部标注（端特有键 `tool.truncated`；恰 64K 与超出同判） | 已定（§4.5 · D-W38） |
| U-W15 | advisor 卡头 / 状态行 = CLI `roundTag` 逐字形 `(round N · model)`（无 model ⇒ `(round N)`） | 已定（§4.5 · D-W36） |
| U-W16 | 工具摘要 = CLI 标尺结构化分派（`N lines` / `N matches` / `N files` / `wrote N bytes` / `bash: <末行>`；成功面拼接已归一（`(exit code 0)` 拼）） | 已定（§4.3 · D-W37） |
| U-W17 | 冻结块头注记 = `— <note>`（turn-cap / 停因 / `interrupted`）；error 面注记保留 | 已定（§5.2 · D-W39） |
| U-W18 | sync 运行块 ⏹ 可见（宿主确证可中止时；registry 不可读 ⇒ 降级为登记） | 已定（§5.2 · D-W40） |
| U-W19 | digest 计数行随 `n > 0`（两档同规）；ask-only 轮（`n = 0`）= 标签行在 ∧ 无计数行；ask 档标签携 `from` / `msg` | 已定（§5.1 · D-W35） |
| U-W20 | 推理按钮中性档（未注册默认 ∧ 已存值 ∉ 枚举）渲染「—」且无 ✓；不新增列表项（同 `D-W41`） | 已定（D-W41 · `doc:docs/core/design/MODEL-SPECS.md:§15.4`） |
| U-W21 | 块头状态词 think 支 = **不改写已有状态词**，唯一例外 = 状态词还空 ∧ 有子标（⇒ `<sub>/<think 词>`）；顶层无前置工具 ⇒ 裸 think 词 | 已定（§5.2 · D-W42 · D-W43 · F-W23） |
| U-W22 | 嵌套子代理的每条活动行行首有 dim 子标 `<sub> · `；块头仍只写父；合并续写只渲一份子标 | 已定（§5.6 · D-W44 · N1–N5） |
| U-W23 | 顾问评审跑着时状态词显示 `advisor`（嵌套 = `<sub>/advisor`）——只写名字，评审正文仍只进块体 | 已定（§5.2 · D-W43 · S2） |
| U-W24 | 心跳重发 `started` 不闪回裸词；状态词只在 `queued → running` 清一次 | 已定（§5.2 · D-W45 · S1） |
| U-W25 | 归档块重开 ∥ reload 后，嵌套子代理行的行首子标仍是 dim 子标（`explore#1 · `），不退化成正文；父自己的行无子标；存量快照呈现逐字不变 | 已定（§5.7 · D-W46） |

## 10. 验收与需求回指

| # | 本档覆盖 | 回指 |
|---|---|---|
| 1 | 布局与活动区驻留（垂直序 · 区位置 · 空区零高 · 归档落流） | F-W1 · N-W2 |
| 2 | 流式跟随与滚动（消息区 pin · 区 pin · 块级跟滚 · 回底钮） | F-W2 · N-W3 |
| 3 | 历史懒加载（首窗 200 · `loadOlder` · prepend 补偿 · 归档块入锚） | F-W3 · N-W4 |
| 4 | 工具调用卡（卡片形态 · 卡体 64K 上限 · 恢复卡对齐） | F-W4 · N-W2 |
| 5 | 活动块可靠性（**出生面存活闸**（冻结键接管 · 不限角色族与 pool）· **非出生面禁静默** · 单投递队列（事件面 + 内容面）· 就绪/清屏后再断言 · **出生自愈心跳** · 终态补桩（含 tombstone 形）· 痕迹七类 + `panelDiag` 上行） | F-W1 · N-W5 · **F-A1 · F-A2 · F-A3 · F-A4 · F-A5 · NFR-A1 · NFR-A2 · NFR-A3** |
| 6 | 内容面投递（子代内容 chunk relay 前缀分流 → `sub:<role>#<id>` · 事件面/内容面次序 · 嵌套链数据面（`dataset.sub`）） | F-W1 · N-W5 |
| 7 | 机检（新增档 ≤500 行 · 无 >300 字符单行 · 文档锚零悬空） | N-M3 · N-M2 |
| 8 | 权限卡族释放形态（逐项 / 合并 · 卡消失 · 零静默无效 · 释放即刷新（状态栏）） | F-W13 |
| 9 | 模型 / 推理按钮随处可切（钮面零门 · 落盘保护 · 回写门保留） | F-W14 |
| 10 | 工具卡失败信号与摘要（判据单源 · 产者两处：核 `thincoder-core/tools/bash.mjs` / 宿主 `thincoder-vscode/src/tools/shell.mjs` · 活卡/恢复卡同判据 · 摘要含状态位——族三成员：退出码 / 被杀 / spawn 失败） | F-W16 |
| 11 | 恢复面用户文本清洗（显示边界 · fail-closed · 盘面/机读线零触碰 · 标题源同源剥离） | F-W15 |
| 12 | 出生可见性（区 pin 旗标（`scroll` 事件）· 未钉底计数钮 · `:empty` 不回归） | N-W3 · **（出生面 / 视口面新增条目号待父侧落——建议文本：「活动区未钉底时新块出生 ⇒ 区首出现未读计数钮（`↓ ${n} 新块`）且不夺阅读位；点击 ⇒ 回底并清账」；判据 = T-A21–T-A23）** |
| 13 | 工具卡呈现增强（结算 / 清扫（M1）· 对象 chunk 归一（M3）· 轮次标签（X2）· 摘要单源（X3 · X7）· 截断提示（X5）） | F-W4 · F-W16 |
| 14 | 状态行 context 段单口径（M2） | 段位对位表 = `WEBVIEW-PROTOCOL.md` §6.1——本档不重述，D2 |
| 15 | 块头注记与 ⏹ 门控扩支 · digest 两档（X6 · X10 · X11 · M4） | F-A4 · F-W7 |
| 16 | 内容行合并粒度（CLI `pushBlock` 对齐 · 协议字段 `face` · RAW 拼接 + `pre-wrap` · 工具结果行面删净） | F-W1 · N-W5 |
| 17 | 消化面记录恢复（痕元素 ∥ 归档块——记录承接 ∥ `recordAppend` 出站 ∥ 页级重建 ∥ 容差二态 ∥ **行形带 `sub`**（子标为结构、回放同核件、存量容读）） | F-W1 · I-7 · core §4.4 F-S7 |
| 18 | 首启板两路（两卡 ∥ 零预选 ∥ 同屏换取 ∥ 回退保真 ∥ 「以后再说」第三态 ∥ 提交链复用零新协议） | F-W20 |
| 19 | 团队常显与直达（状态栏 item 三态 ∥ 命令 `thincoder.team` 登/退流 ∥ 校验触发点制 ∥ 卡降管理面） | F-W21 |
| 20 | 子代理块面四处读者可见行为：① 嵌套身份挂行首（块头 = 父 · 行首 = 子 · 续写一份子标）② think 不改写已有状态词（唯一例外 = 状态词空 ∧ 有子标 ⇒ `<sub>/<think 词>`）③ 顾问评审只写名字（`<sub>/advisor`，正文只进块体）④ `started` 只在 `queued → running` 清状态词（心跳不闪回）；横切 = 两刷新路径同值 · 桌面 + VSC 同源 · CLI 零改 | F-W23 |

**用例**：本板块用例表归测试层，本档不复制（D2）。
**登记例外 1 条**：F-W4 活卡面（`toolCall`/`toolOutput`/`toolResult` 接收）现无专属用例
（缺口登记 = `docs/vsc/requirements/WEBVIEW.md` N-W5，消解路径 + 到期条件在案）。

## 11. 启动链读数（激活 → 装配 → 首屏）与补批判据

**问题**：VSC 激活 → webview 首屏无端到端读数（CLI 已有逐段榜：9.6–16s → ≤2s）⇒ 需一次实测裁定「VSC 面是否需补批」。已核不重测：GC 热路径 / traces 节流住核 ⇒ 与 CLI 同愈；VSC src 全包零 `execSync` / `spawnSync`。

**口径 B（无头分段主读数——执行）**：复用既有三件套——真 `activate()` 直调 + 假 view 驱动 `resolveWebviewView` + happy-dom（用例基建 = `thincoder-vscode/test/` 三件（`prompts-async-guidance` ∥ `session-boot` ∥
  `webview-env`）⇒ 分段计时（模块图 / `applyEngineFloorGuard` 探针 / locale / `ChatPanel` 构造 / resolve / 握手 / 揭幕）。

  一次探针形态（测后撤除，零常驻仪表）；采样每态 ≥5 次；**不设绝对阈值**（先例：静默窗结构性噪声底 6.6–8.1s）；判别 = 常态带分离 / 自身对照。**不覆盖**：宿主调度排队 / 真实绘制（happy-dom 不排版）。

**口径 A（真机旁证——非本面）**：`Launch Extension` 启动扩展宿主 + `exthost.log` 激活行（`activationEvent: 'onView:thincoder.chat'`）+ 临时打点（核共享通道 `logEvent`）；**须用户点头**（一次性探针形态）后另轮。

**判据（先测量后裁用）**：

| # | 判据 | 形态 |
|---|---|---|
| J-1 | 首屏时延（无头分段合计） | 中位 + 分布（n ≥ 5），记入读数档 |
| J-2 | 段占比 = 每对打点差值 / 总时长 | 任一**单一**段 > 40% 总时长（或 > 1s 且属非结构性面）⇒ **补批候选** |
| J-3 | 与核修同愈面核验 | GC / traces / 同步阻塞段读数 ≈ 0 ⇒ 若仍显著 ⇒ 定位端壳自有段 |
| J-4 | 二态结论 | 无单段超线 ⇒ 判「**无需 VSC 面补批**」（读数入册）；有 ⇒ **立批**（段名 + 读数 + 候选修法） |

**阈值射程**：J-2 的绝对线（> 1s）**只作单段占比的补批候选触发**；**首屏总时延不设绝对阈值**——判别恒为常态带分离 / 自身对照。

**边界（本节不做）**：不做常驻仪表（默认一次性探针）；不加 webview `performance` 标记（真画证据归真机 QA）；口径 A 不入本面。**读数留档** = 一次性材料；探针撤除后 `git diff` 空 = 方案自身验证。
