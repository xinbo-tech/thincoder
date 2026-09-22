# Webview 前端与活动区（WEBVIEW）· 设计 — VSC 部分

> 部分 = **vsc**（`docs/vsc/`）；板块 = **webview 前端面**——VSC 独有（CLI 前端为终端 TUI；webview 隔离 iframe 是其对偶形态，两者**不镜像、互不指**）。
> 本档 = 该板块**结构与活动区面**的活档权威；同板块同层另两档 = `WEBVIEW-PROTOCOL.md`（消息协议 · 消息秩序/忙态 · 状态行）· `WEBVIEW-INPUT.md`（输入面 · 消息渲染契约）。**同一机制只详述一处**（D2）——块头/状态词形态归本档，协议表与状态行字段归 `WEBVIEW-PROTOCOL.md`，输入与渲染契约归 `WEBVIEW-INPUT.md`。
> 需求侧 = `requirements/WEBVIEW.md`（F-W1–F-W7 / N-W1–N-W6——**同名成对**，N-b）；逐条回指见 §10。
> 硬约束（本端）= 纯 `.mjs` · 零 npm 运行时依赖 · 仅 VS Code API + Node 标准库；webview 侧只用浏览器标准 API（无打包器）。
> 来源 = `thincoder-vscode/docs/design/WEBVIEW.md`（VSC 产品树）——**原地一字未改，留作参照历史**（保留 ≠ 维护）。该档 1867 行超 500 硬限 ⇒ 本批按面拆三档（取舍见 §9）。
> 建档：2026-09-15（**B 式迁移轮 · VSC 第 2 批**）。坐标 = as-of 2026-09-15 实核（仓根相对路径 + `:行`）。

## 1. 定位与职责边界

webview 是扩展主机的 **UI 适配层**，只负责 UI 渲染与用户交互；agent 循环与工具执行在 extension host 侧。两者经 `postMessage` **单向通信**——webview 为隔离 iframe，无共享状态。

- **UI 状态单一持有在 webview 端**：`thincoder-vscode/webview/state.js:71` 的 `S`（UI 状态）+ 同档 `ctx`（DOM 引用集，如 `state.js:19` 的 `ctx.activityEl`）+ `vscode` postMessage 桥。
- **会话 / Provider / 工具状态在扩展端**：`thincoder-vscode/src/extension/**`（面板生命周期与消息路由）· `thincoder-vscode/src/agent.mjs`（agent 循环）。
- 消息族、投递纪律与忙态收敛 = `WEBVIEW-PROTOCOL.md`（本档不重述）。

## 2. 布局（垂直序 + grid）

**垂直序（自顶向下）**：会话栏 → `#messages` 滚动区（对话流，含 digest 文本与一切会话内容）→ **活动区 `#subagent-activity`**（子代理/consult/advisor-async 活动块）→ 行面板区（`#goal-panel` / `#task-panel`）→ 输入区（`#toolbar`）。

CSS 布局规则 = `thincoder-vscode/webview/base.css:88` 的 grid 行模板：

```
grid-template-rows: auto minmax(0, 1fr) auto auto auto;
```

- 行模板 ↔ 垂直序：header(session-bar) / `#messages`(1fr) / `#subagent-activity`(auto) / `#panels`(auto) / `#toolbar`(auto)——后三层均 auto，隐藏项不占高 ⇒ 消息区高 = 容器 − 活动区 − 面板 − 输入（grid `1fr` 自动吸收）。
- 消息区钉底/滚动语义**限定在 `#messages` 内**：`overflow-y: auto` + `overscroll-behavior: contain`（`thincoder-vscode/webview/base.css:93-97`）。
- **活动区**：位于 `#messages` 与 `#panels` 之间（`thincoder-vscode/webview/index.html:25`——`role="region"`）；**空区隐藏零高**（`base.css:109` `#subagent-activity:empty { display: none; }`——零显隐 JS）；内容自适应 + `max-height: 32vh` 封顶 + 区内自滚（`base.css:102-107`）。
- **活动区独立 pin**（`thincoder-vscode/webview/ui.js:442-445` `maybeScrollActivity`）——与消息区**互不拉扯**（两层状态独立——§5.5）。
- shell 结构（`thincoder-vscode/webview/index.html:14-92`）：启动加载画面 `#loading-screen`（`:18-23`——静态默认可见；端壳握手落定后由 `dismissLoadingScreen` 移除（定义 `webview/chat.js:31`；落定点 `webview/chat-messages.js:141`）+ 3 s 兜底（`:43`））+ `#chat-container`（`:24-92`）内含 `#session-bar` / `#messages` / `#subagent-activity` /
  `#panels`（goal、task 两个行面板）/ `#toolbar` / `#settings-panel`（dialog）/ `#welcome-panel`（首次运行 onboarding）。
- `#toolbar` 内 = `#status-line` + `#input-row`（attach / send / abort）+ `#paste-bar` + `#controls-row`。
- 注入占位：CSS 五档经 `__CSS_*_URI__`、模块脚本经 `__CHAT_URI__`、CSP 经 `__CSP__`（`index.html:6-11` · `index.html:83`）。

## 3. 文件结构（现行）

`index.html`（shell——CSP 注入 + CSS/JS URI 占位）→ 前端模块（`thincoder-vscode/webview/`，**44 档模块**（`.js` / `.mjs`；CSS 5 档 + `index.html` shell 另列）——as-of 2026-09-22 实读）：

| 模块 | 职责 |
|---|---|
| `chat.js` | 编排层（装配 + 全局键 / 点击 + 启动握手）：init 装配（welcome / autocomplete / settings / onboarding / toolbar / 文件链接 / ⏹ 取消委托）+ 命令块 `initMessageLoop(deps)`（**原址**注册消息监听——D-C1）+ `dismissLoadingScreen` 族；启动握手 `webviewReady`（`chat.js:147`——as-of 2026-09-22 structure-debt 拆分轮实读）· **147 行**（`wc -l`） |
| `chat-messages.js` | host → webview **消息分发循环**（`initMessageLoop`——`window.addEventListener("message")` + `case` 单表整块；D-C2 不拆族）；**234 行**（`wc -l`——as-of 2026-09-22） |
| `chat-status.js` | **显示状态元素一族**（`clearStatusText` / `handleStatusText` / `showCompressStatus` / `showDigestStatus`——压缩状态行 + 状态段 + digest 轮可见面；模块级 `_digestRoundEl` 随迁）；**124 行**（`wc -l`——as-of 2026-09-22） |
| `streaming.js` | token/reasoning 流式渲染（rAF 节流 + ≥50ms 重排门——`streaming.js:34` · `:42-45`）+ 回合收尾（含未结算工具卡清扫 `sweepUnsettledToolCards`——M1）+ 子代理块路由（`subagentChunk` `:244`——as-of 2026-09-20 批 1 落地）+ code-block 复制按钮 |
| `ui.js` | DOM 构造（欢迎页/气泡/工具卡/advisor 块/loading 态）+ 滚动族（`scrollDown` / `maybeScrollDown` / `maybeScrollActivity` / `initScrollFollow` / `trimOldMessages`）——leaf：不 import `state.js` |
| `md.js` | markdown 渲染（`md()` `:67` · 内联引擎 `inline()` `:34`——契约见 `WEBVIEW-INPUT.md`） |
| `state.js` | 单一 UI 状态 `S`（`:71`）+ DOM 引用 `ctx`（`:19`）+ `vscode` 桥 |
| `activity.js` | 活动块编排层：出生/接管/补桩/折叠/归档/重置 + 块级跟滚（§5 契约） |
| `activity-view.js` | 呈现叶：块头/状态词/折叠 tail/⏹ 与取消控件（`refreshBlock` `:117` · `updateStopButton` `:150` · `noteChunk` `:179` · `tailLines` `:102`——as-of 2026-09-20 收口轮实读）——leaf：i18n only |
| `panels.js` | goal/task 行面板 + 挂起态 + 桥路由（`handleSubagentMessage` 纯转发 `applySubagentStatus`）；`_panelTimer`（2s）同点刷 live 块头（`panels.js:69-70`） |
| `send.js` / `loading.js` | 输入门（`send()` `send.js:12` · busy 拒发 `:19-24`）/ 忙态与按钮可见性（`loading.js:56-57`） |
| `input.js` / `autocomplete.js` / `toast.js` | 输入面（keydown 全族——`WEBVIEW-INPUT.md`）/ @ 补全与图片粘贴 / 瞬时提示共享模块 |
| `permission.js` / `question.js` | 权限弹窗与批确认 / 内联 question 卡 |
| `diff.js` · `tool-card-restore.mjs` | diff 预览（apply_patch）/ 恢复会话的工具卡折叠语义 |
| `tool-summary.js` | 工具结果**一行式摘要单源**（`formatToolSummary` 分派：advisor / read / write / grep / glob / bash / 默认分支）——活卡 `finishToolCard` 与恢复卡 `buildToolHistory` 共用（X3 · X7） |
| `settings.js` + `settings-*.js` | 设置面板（providers / agent / models / tools / env / widgets / state）——信息架构见同层 `SETTINGS.md` |
| `model-picker.js` / `model-menu.js` | 模型选择两级菜单 |
| `history.js` | 懒历史分页（`applyHistoryPage` `:43` · `loadOlder` 投递 `:87`） |
| `scroll.js` | 滚动族装配 + 悬浮回底钮（`updateScrollBottomVisibility` `:29`） |
| `status-bar.js` | 状态行单 writer（`renderStatusBar` `:13`）——段位契约见 `WEBVIEW-PROTOCOL.md` |
| `session-bar.js` | 会话栏（标题/下拉/新建） |
| `mode-buttons.js` | ENG / ADVISOR / AUTO / PLAN 按钮状态反射 |
| `i18n.js` / `i18n-dom.js` | 文案解析（`${k}` 插值——`i18n.js:30`）与 DOM 反查 |
| 其余 | `search.js` · `highlight.js` · `onboarding.js` · `ledger-line.js`（台账行渲染） · `lib.js`（纯 helper：`tailTruncate` / `MAX_TOOL_OUTPUT = 64K` `:27` / `capText` `:30` / `fmtK`） |
| CSS | `base.css` · `chat.css` · `controls.css` · `session.css` · `settings.css` |

**本端接线**：实现为唯一事实源——模块图登记见 `thincoder-vscode/AGENTS.md`（webview 行为维护寄存器）。
extension 端对应：`chat-panel.mjs`（面板生命周期/消息路由）· `panel-*.mjs`（消息处理分模块）· `suspension.mjs`（挂起驱动）· `permission-gate.mjs`（权限门）。

## 4. 交互组件与标题

- **权限弹窗 / 批确认 UI**（`permission.js`）：approve / deny / approve-all + 原生 diff 预览；AUTO 按钮翻转会话级 autoApprove。
- **question 卡**（`question.js`，内联卡非原生弹窗）：选项按钮包 `.question-options` 容器（成列——`base.css:327`），底部操作行 `.question-actions`（input + submit + cancel——`base.css:340`）；卡内字号/字重 scoped 覆盖；`.question-text` pre-wrap 保形（`base.css:316`）。
- **粘贴图片**：attach 按钮 / 粘贴 → dataURL 预览条 `#paste-bar`（`index.html:40`）→ 发送时随 `userMessage` 上送（`send.js:47-50`）。
- **设置面板**：模型 / Provider / 代理 / 工具 / agent 分页（`settings-*.js`）；agent 页含 poolLimits、guard / engineering 反射。
- **会话标题**：session-bar 顶栏显示活动槽标题（`#session-title`——`thincoder-vscode/webview/session-bar.js:111`，来自 `sessions` 消息的 `active.title`）；
  会话下拉 `#session-dropdown`（`index.html:20`）列 switch / rename / delete。
  首条消息发送后 LLM 自动生成标题（`thincoder-vscode/src/extension/generate-title.mjs`）；标题未生成前显示自动占位
  （`Session N` + 生成中提示——`send.js:53-54`），生成完成后经 `sessions` 刷新。
- **模型选择 UI**：主下拉列 provider 行 + hover flyout 子菜单选模型（两级菜单——`model-picker.js` / `model-menu.js`）；底部含 add / remove / key 管理入口。
- **挂起与忙态 UI**：settled → awaitingDigest 驻留（带提示）；digest 回收 → 归档落流；会话退出 = 区全体归档（§5.1）。
  状态行（⏳ 后台 N 子代理 + 待消化计数——`status-bar.js:51-60`）；输入框永不锁（`loading.js`），
  send 出口拒发保留（`send.js:19`——Enter 与发送按钮同经此拒；可继续录入）；
  **Send 按钮 running 期隐藏**（`loading.js:56`），Stop 只在 running 显（`loading.js:57`；susp 纯池跑不显——子代理停止靠区内逐块 ⏹）。
- **模式按钮**（`mode-buttons.js`）：ENG / ADVISOR(guard) / AUTO / PLAN 状态反射。

### 4.1 权限卡族释放形态（逐项 / 合并 · F-W13）

- 卡族 = `.permission-prompt`——逐项卡（`permissionRequest`）与合并卡（`batchPermissionRequest`）同族；**族键 = `data-prompt-id`**（合并卡自 2026-09-18 批起同携 `promptId`）。
- 释放形态 = **卡消失**：`permissionWithdrawn` 经同一选择器移除（`thincoder-vscode/webview/chat-messages.js:194-200`——逐项 / 合并零分支；as-of 2026-09-22 structure-debt 拆分轮实测）；**不做「已拒绝态」变体**（同一语义不做两形态）。
- **零静默无效**：队列无对应条目时 host 回 `permissionWithdrawn`（可见处置）⇒ 卡被同一消费者移除——「点了没反应」在形态上不可达。
- **释放 ⇒ 状态栏刷新**（F-W13 族——2026-09-18 修轮补）：卡释放后 VS Code 状态栏不得残留 `waiting for your input`；`waiting` 判据含**批权限队列**、刷新点 = 释放通道单点（判据与落点 = `WEBVIEW-PROTOCOL.md` §4.4 · §4.6——本档不重述，D2）。
- 消息面 / id 纪律 / 响应匹配判据 = `WEBVIEW-PROTOCOL.md` §4.6（本档不重述——D2）。

### 4.2 模型 / 推理按钮忙态门（F-W14）

- **判据 = 忙态**（`S._turnState !== "idle"`——**同经 `S._turnState` 派生的独立谓词**；与 Send / Stop 的 `=== "running"`（`thincoder-vscode/webview/loading.js:56-57`）**差值 = 本门多含 `susp`**——非同一条判据；派生单点 = `webview/loading.js` `applyBusyLock`）。
  `running`（回合 / digest / 标题窗口）与 `susp`（池活跃 / 释放窗口——**含在飞蒸馏落盘窗**）⇒ 模型 / 推理按钮**显式禁用**（`disabled` + `aria-disabled`；`.ctrl-btn:disabled` 有可见态）；idle ⇒ 复原。
- **入口守卫（同谓词）**：两处写槽入口同读 `modelSwitchBlocked()`——① 按钮点击（模型菜单 / 推理下拉）② `models` 推送的自动回写（`thincoder-vscode/webview/model-picker.js` `handleModelsMessage`）；进忙态时关闭已弹出的两个浮层（不留「点了没用」的假 affordance）。
- **与 Send 隐藏的分工**（`WEBVIEW-PROTOCOL.md` D-P9）：Send = 动作钮（Stop 承接同语义）⇒ 隐藏；模型 / 推理 = **信息钮**（屏上须可读当前会话模型 / 推理级）⇒ 禁用——隐藏即失去信息。
- **与试运行语义的关系**：`thincoder-vscode/src/extension/turn-model.mjs` 的「真 override 单回合不落槽」**零改**；本门挡住的是「忙态写槽」入口 ⇒ 回合尾快照（`panel-chat.mjs:329` · `panel-callbacks.mjs:305`）恒等于槽值（幂等，零覆写）。

### 4.3 工具卡失败信号与摘要（F-W16）

- **判据单源 = `webview/lib.js` 的 `isToolFailure(text)`**（纯函数）：① 既有 `Error:` / `Error：` 前缀 ∪ ② **独立成行的终止状态位** `(exit code N≠0)` / `(killed: …)` / `(spawn failed)`。
  `(killed: …)` **含用户中断值** `killed: user interrupted`（`bash.mjs:220-223` `signal?.aborted`）——用户中断的命令确未完成 ⇒ 同判失败。
- **产者两处（同名同形 · 一端一产者）**：CLI 端 = 核 `thincoder-core/tools/bash.mjs`（退出面 `:225-227` · spawn 失败面 `:183-198`——2026-09-19 按实现重出）；
  **本端卡面 = 宿主 `thincoder-vscode/src/tools/shell.mjs`**（终止面 `:242-281` · 收集面 `:286-300`——2026-09-19 按实现重出）——本端工具集登记的是宿主实现
  （`thincoder-vscode/src/tools/index.mjs:29` · `:172-175` 进 `builtinTools` ⇒ `thincoder-vscode/src/agent/setup.mjs:162` · `:307` 绑 `agent.tools`）；
  **核 `bash.mjs` 的 `Command failed:` 形态在本端无产者**（2026-09-18 实核：`thincoder-vscode/**` 全树 `grep "Command failed"` = 0 命中；**as-of 标注（2026-09-19 收正）**——宿主 `shell.mjs` 自本批起亦产同字面诊断行（`Command failed: <errno>`，**不入判据**）⇒ 该读数只表示「核产者形态不达本端」，不再表示「本端全树无该字面」）。
- **状态位族三成员（闭集）**：`(exit code N≠0)`（进程已跑 ⇒ 有退出码）· `(killed: …)`（被杀——含超时 `killed: timeout <N>ms` 与输出超容 `killed: output limit exceeded`）· `(spawn failed)`（**进程未启动 ⇒ 无退出码，不伪造**——宿主侧判据 = `child.pid` 未定义）。
  三成员同形 = 独占行 + 括号 + 状态词；**退出码槽只接受数字**（`error.code` 非数字 ⇒ 不许塞进退出码槽：宿主产者曾产 `(exit code ENOENT)`，判据不认 ⇒ 卡读绿，本批收正）；判据布尔与摘要状态文本同经 `toolFailureStatus(text)` 一处产出（语法零第二份）。
- 活卡（`thincoder-vscode/webview/ui.js` `finishToolCard`）与恢复卡（`thincoder-vscode/webview/tool-card-restore.mjs` `buildFinishedToolCard`）**同读该判据**——两卡面终态同形（F-W4）的机器面。
- 失败面三信号（同一判据派生，零散点）：状态词 = `tool.error` + 红；**保持展开**（不自动折叠）；摘要含状态位（`→ bash: <末行输出> (exit code 1)`；无输出时 `→ bash: (exit code 1)`——不读作 `(empty)`；spawn 失败则 `→ bash: (spawn failed)`——`bash: ` 前缀随 X7 摘要分派落位）。
- **CLI 对位**：失败面口径同源（末行输出 + 状态位入摘要——`thincoder-cli/src/tui/tool-summaries.mjs:60-68`）；端差二条（卡态为本端独有形态 / 成功面不拼 `(exit code 0)`）——登记面 = `requirements/WEBVIEW.md` §4。
  **spawn 形态两端同读**：CLI 摘要 = `bash: (spawn failed)`（同档「末条非包装行」规则 ⇒ 端侧零改即得可见信号；2026-09-18 实跑读数在案）；本端 = 红 + 保持展开 + 同文本。
  **失败信号数端差**：本端 = 判据（红 + 保持展开）+ 摘要两处；CLI = 摘要一处（TUI 无卡态、完成行不判色）——登记面 = `requirements/WEBVIEW.md` §4。
- **摘要族单源与分派（X3 · X7——显示面消差批）**：活卡与恢复卡的**一行式摘要** = 端侧单源叶 `thincoder-vscode/webview/tool-summary.js` 的 `formatToolSummary(name, text)`（自 `ui.js` `resultSummary` 整段迁出——500 行硬限；先例 `thincoder-vscode/webview/tool-card-restore.mjs`）；
  分派族 = `advisor`（`N critical, N advisory, N style` / `passed` / 拒因首句）· `read`（`N lines`）· `write`（`wrote N bytes`）· `grep`（`N matches` / `1 match` / `no matches`）· `glob`（`N files` / `1 file` / `no files`）· `bash`（`bash: <末行>`）· 默认分支（`name: <首个非空行>`）——
  **字面与分派逐字承 CLI**（`thincoder-cli/src/tui/tool-summaries.mjs`——跨端等值断言 = 直驱对端纯函数对拍，禁复制常量）；状态位族仍由 `lib.js` `toolFailureStatus` 单源附加（不另立第二份状态语法）。**端差（已裁决）**：成功面**不拼** `(exit code 0)`；`verify` 分支本端不登记（不落）。
  **重复形态登记**：摘要族两端各一份（CLI `tool-summaries.mjs` ∥ 本端 `tool-summary.js`）——并核 = 跨批结构面（在册）。
- 边界：**非 `Error:` 前缀仍判失败**（F-W16 判据扩的本体）；仅「独立成行」的状态位触发——正文里提及 `(exit code 1)` / `(spawn failed)` 不误报；
  **判据只认状态位、不认产者措辞**（`Command failed:` 前缀不入判据——跨端措辞耦合路线已否，见 D-W19）；`(stopped)`（`execute` 工具的用户中止自报形——`thincoder-core/tools/execute.mjs:147`）**不在判据集内**（该面判据扩不做——宿主 bash 的用户中止同形 `(stopped)`（`thincoder-vscode/src/tools/shell.mjs:88` · `:248` · `:300`）⇒ 两端中止面形态端差在册，见批档 §2.8）。
  **非数字退出码槽不入判据**：`(exit code ENOENT)` / `(killed — timeout 400ms)`（收正前的宿主历史形）均不判失败——判据只认族形态；两产者同批收正后该二形在仓内不可达，再现 = 新残（登记路径同 `docs/batches/2026-09-18-vsc-session-wiring.md` §2.6 #11 体例）。
- **形态可达性两则**：① spawn 失败形态**天然短**（子进程未启动 ⇒ 无输出体）⇒ `docs/batches/2026-09-18-vsc-session-wiring.md` §2.6 #9 的人读线瘦身截尾（`thincoder-core/session-segments.mjs:53-55` 头 500 字符 + 尾标记）对该形态**不可达**——恢复卡同判据在此成立（长结果面残项另案）。
  ② `tool-summary.js` 的 `BASH_MARKER`（bash 分支的包装行过滤正则）是状态位族在**消费面的第二份枚举**（族扩面时须同看）。
  **「摘要零影响」只覆盖无输出形**：`(spawn failed)` 不经包装行过滤（`BASH_MARKER`）⇒ 末行 = 状态位本体、内容位空 ⇒ 摘要 `→ bash: (spawn failed)`（两产者的 spawn 失败面均无输出体——2026-09-18 实跑）；
  **若该状态位携非空输出段**：末行仍为状态位 ⇒ 末行输出**不入摘要**（与 `(exit code N)` 被 `BASH_MARKER` 滤掉后取末行输出**不同形**）——已知形态差
  （消解 = 包装行过滤并入判据单源；**新触发** = `tool-summary.js` 下次扩面——摘要族新增分支 / 状态位族扩第 4 成员）。

### 4.4 恢复面用户文本清洗（人读线 → 显示面 · F-W15）

- **契约**：同一会话中，用户消息的**恢复面**文本 ≡ 活面气泡文本（= 用户所打原文，`@路径` 保持简洁形）。
- **落点 = 端侧显示边界**（`thincoder-vscode/src/extension/panel-session.mjs` 的 `sendHistoryPage` user 分支——与既有 `stripEditorInjection` 同点同序：先剔机器注入、再还原 `@` 引用）；**剥离函数与注入产者同档**（`thincoder-vscode/src/extension/file-refs.mjs`——语法与其逆变换同住一处）。
- **消费面二处（同源剥离）**：① 恢复面显示（`sendHistoryPage` user 分支——上条）② **标题源文本**——回合尾自动标题读首条真实 user 消息处（`thincoder-vscode/src/extension/panel-session-write.mjs` `generateTitle`；as-of 2026-09-21 块标题行对齐批）同接同档剥离函数 ⇒ 标题不得由 `[File: …]` 文件正文生成；两处同读一函数（零第二实现）。
- **标题链（双端同一套机制 · 2026-09-21 块标题行对齐批）**：源 / 生成 / 触发 / 写 / 读·展示**五环单源**——机制条文单源 = `docs/core/design/SESSION.md` §6.7（本节只记 VSC 端壳面）：源 = 内存人读线（`fullHistory` 经 `keepReal` 过滤）首条真实 user 消息、谓词单源 = 核 `isRealUserMsg`；
  生成 = 核 `generateTitle`（端壳只做 key / provider 解析）；触发 = 会话尚无标题即尝试（与 CLI `ensureSessionTitle` 同判据）；写 = 标题值随回合尾整档 `saveLines` 落盘（`extra.title`——**无第二写**，原 `setSlotTitle` 直写退场）；读·展示 = 列表面（`pushSessions`）同回退链 + 顶栏常显（槽 `title` 回退链——空窗差 = 已登记端差〔A9〕；对位 = `docs/cli/design/TUI.md` §7.4）。
- **落点判据（不落核 `history-window.mjs`）**：① 该窗口面现消费方 = VSC 端独有（核内 re-export 只供 `isRealUserMsg`；CLI 恢复渲染不经此档——全仓零 CLI 消费）⇒ 落核零收益；② 注入语法的产者住端侧；③ 人读线盘面与机读线（模型输入）**零触碰**。
- **端差（N-W6）**：人读线为 CLI 与本端**共文件**、本批只动端侧显示边界 ⇒ **CLI 恢复渲染仍显 `[File: …]` 展开文**（同一消息两端不同形）——登记面 = `requirements/WEBVIEW.md` §4（父侧同轮写入）+ 批次档 §2.6 #10。
- **剥离判据（fail-closed）**：仅当文本尾部为**注入摘要块**（`[Referenced files:` 头 + 逐行 `  - <raw> (<N> chars)` + 尾 `]`）时，按「`[File: <raw>]` 头 + 围栏 + 恰 N 字符正文 + 收尾围栏 ⇒ `@<raw>`」逐条还原并删摘要块；**任一条不吻合 ⇒ 整条原样返回**（用户手打的 `[File: x]` / 形近文本零误伤）。
- 活面与展开本体零改：`injectAtRefs` 的返回值（= 落线文本 / 模型输入）逐字不变。

### 4.5 工具卡结算与内容呈现（M1 · M3 · X2 · X5）

- **M1 结算与回合尾清扫**：「已结算」= 卡对象 `done` 旗标——**唯一写点** = `finishToolCard` 首行置真（`thincoder-vscode/webview/ui.js`），建卡 `addTool` 置 `done:false`；
  回合尾清扫 `sweepUnsettledToolCards`（`thincoder-vscode/webview/streaming.js`）在 `finish()` 内**无条件**执行（complete / aborted 两路径同规 = CLI 标尺 `thincoder-cli/src/tui/tool-display.mjs` `sweepToolBlocks` + 回合 `finally` 恒调用）：
  未结算卡 ⇒ 状态词 `tool.interrupted` + 摘要 `→ (interrupted)`——**不套错误色**（CLI `interrupted` = 独立旗标，非 error 面）、正文原样保留；已结算卡零改写；重复命中幂等。
  - **文案键** `tool.interrupted`（端特有——VSC 本地档，不进核 i18n 容器）。
  - **刷新路径断言**：工具卡在**消息区**，不在活动区重建链上（`refreshLiveHeaders` 只遍历 `S._subBlocks`；`resetActivity` 只清区子树）⇒ 2 s 同点刷与覆盖式重建**均不改**清扫后的状态词。
  - **边界**：不动 CLI；不引入活动区联动；不加 TTL / 自动消失。
- **M3 对象 chunk 端边界归一**：`toolOutput` 载荷在**端边界**归一为串（`thincoder-vscode/src/extension/panel-callbacks.mjs` `onToolOutput`：`typeof chunk === "string" ? chunk : String(chunk?.text ?? "")`——**CLI 逐字先例** `thincoder-cli/src/tui/tool-events.mjs:322-324`）；`kind` 随行保留为可选字段（webview 现只消费 `text`——不新增消费面）。
  核 emitter 零改（对象 chunk = 核契约，两端各自归一）；relay 分流面零改（对象已在 relay 内归一）。
- **X2 评审轮次标签**：advisor 卡头与状态行共用端侧单源 `advisorRoundTag(round, model)`（`thincoder-vscode/webview/ui.js`）——字面 = CLI `roundTag` 逐字 `(round N · model)`；
  无 `model` ⇒ 降级形 `(round N)`（不显 `null`）；载荷 `round` / `model` 仅 advisor 携（宿主 `advisorMeta`：`round = _advisorRound + 1`；`model` 取核 resolver，失败降 `null`），非 advisor ⇒ 零字段（卡头逐字节同前）；
  状态行字面 = `advisor review (round N · model)`（= CLI `thincoder-cli/src/tui/tool-events.mjs:145` 逐字）。
  刷新路径：卡头一次性建（无重建通道）；状态行载体 = `S._currentTool`（单源）⇒ 消息驱动与 2 s 拍同值。
- **X5 结果截断提示**：>64KB 工具结果在**宿主切片点**（`panel-callbacks.mjs` `onToolResult`）立**事实旗标** `truncated`（非串结果先经 `String(r ?? "")` 归一——falsy 非串（`0` / `false`）文本 = `"0"` / `"false"`，记录形）；webview **旗标驱动** ⇒ 正文尾标记行 + 摘要位尾部标注（文案键 `tool.truncated`——端特有）：**恰 64K 与超出同判**（不复辟 `capText` 的 `<= max` 边界洞）。
  恢复卡同判据（宿主 `sendHistoryPage` 切片点同立旗标）——**恢复面 = 旗标驱动、长度维只作旧载荷回落**。`MAX_TOOL_OUTPUT` 数值零改；工具结果入 history 完整性零改（截断只在显示面）。
- **边界（本节）**：不动 CLI；不改 `toolOutput` 流式截断（`chat-messages.js` 既有标记）；不引入行维额度；不动 64K 额度。

### 4.6 状态行 context 段单口径（M2）

- **单一判据**：`context X%` 分子 = 核 `estimateTokens(history)`（`thincoder-core/context.mjs`——零依赖纯函数），分母 = `providerSpec(provider).context`——**与 CLI 状态行同源同式**（`thincoder-cli/src/tui/render-frame.mjs:388-389` 内联式）；
  派生单点 = `thincoder-vscode/src/specs.mjs` `ctxPercentForHistory(history, provider)`，消费点 = 宿主 `panel-callbacks.mjs` `onUsage`（`ctxPercentForModel` 保留给 provider 报告值消费面——本段不取）。
  - **消差本体**：同一会话不得在同标签下读到两个百分比——单口径消的是「provider 报告值 `prompt_tokens` ∥ CLI 估算」两式并存面。
  - **刷新路径**：状态行唯一载体 = `S._lastCtxPct`（`thincoder-vscode/webview/status-bar.js`），消费面 = `usage` 消息驱动 + 2 s 拍（`running` 门内）⇒ 两路径同值；渲染句零改（`context X%` + ≥80 警示色 = CLI 同形）。
- **边界**：不改 CLI；不改 ≥80 阈值；不新增绝对 token 段（端差登记面另计）；不引入核改动。

## 5. 子代理活动块与活动区

子 agent / consult / escalate / advisor-async 的活动块**出生即 append 到固定活动区 `#subagent-activity` 区尾**（`thincoder-vscode/webview/activity.js:108`），在消息区与输入区之间——**live 固定可见，不随会话流滚动丢失**。

### 5.1 生命周期（出生 → live → 终态 → 归档）

两态机（live → frozen）**不变**；`awaitingDigest` 是冻结态上的**单标志**（非第二状态机）。终态去向由调用方定：

| 段 | 事件 | 动作 | 锚 |
|---|---|---|---|
| 出生 | `started`（**不限角色族 / 不限 `pool`**——§5.3 出生面）或 `queued` | 建块 append 区尾（区钉底 / 未钉底计数钮 + 块级跟滚监听接入） | `activity.js:108-111` |
| live | chunk / turn 帧 / 审批态 | 覆盖式刷新头词与状态区（不重挂元素） | `activity.js:290-307` |
| 折叠 | 终态 | class `sub-live`→`sub-frozen` + `open=false` + ⏹ 移除 + 头词换 | `activity.js:176-188` |
| 准终态 | `settled` | 折叠 + `awaitingDigest` 驻留（块**不移动**） | `activity.js:356-358` |
| 归档 | 消化回收 `done` 命中 awaiting 块 | `insertBefore(块, 本轮边界)`（CLI 序：块在 digest 文本前） | `activity.js:196-206` |
| 归档 | 其余终态（`done`/`error`/运行中 `cancelled`/`terminated`/`failed`/`answered`） | 折叠 + 即时归档（尾追 `#messages`） | `activity.js:322-361` |
| 取消 | `cancelled` 且 `was: "queued"`（从未启动） | 头移除（不冻结） | `activity.js:310-320` |
| 幂等 | 迟来消息命中已冻结/已移除条目 | live / chunk ⇒ `ensureBlock` 返 `null`——丢弃，不复活不重建 + **丢弃留痕**（`drop-frozen` / `drop-tombstone`——§5.3「非出生面禁静默」）；**终态例外**（元素被移除 = tombstone）⇒ 补桩 + 立即归档 + 痕迹——见 §5.3「终态必现」 | `activity.js:144-155` |
| 新代接管 | `started` 命中同名**已冻结**键（**不限 `pool`**——D-W26 口径；本条 2026-09-19 收正，原载 `+ pool: true` 与 §5.3/D-W26 互斥） | 建新块改绑键 + 记 `takeover`；旧 awaitingDigest 块即时归档 + 新块记 `oldReclaimPending` | `activity.js:162-171` |
| 补桩 | never-born 终态（无 map 条目） | 按 §5.3 终态补桩**状态表**补出**已折叠**桩 + 立即归档 + 记 `late-terminal-stub`（前置 = `id` ∧ 角色段 `[\w-]+` ∧ 回读一致——射程含 consult / escalate） | `activity.js:235-244` |
| 会话退出 | `suspension active:false + freeze:true` | 区**全体**归档（live → 折叠；awaiting → 归档；已在流者不动） | `activity.js:404-410` |
| 重置 | 回合中止（无挂起会话）/ 会话清 | `resetActivity` **只清区子树**（+ 清 map + 区内孤儿防御清）——流内归档块（会话历史）不动 | `activity.js:415-424` |

- **归档落点二值**（`activity.js:196-206`）：① 消化回收且本轮边界 `S._digestBoundary` 有效（`isConnected`）→ 边界之前；② 其余（普通终态 / 补桩 / 会话退出 flush / 边界失效 / 无边界）→ `#messages` 尾追。同批多块 = 消息到达序；幂等 = 已归档（`parentNode === messagesEl`）即 no-op。
- **消化回收（host 侧）**：`thincoder-vscode/src/extension/suspension.mjs:95-101`（`reclaimDigestedBlocks`）对该轮已消化条目逐条补发 `{type:"subagent", status:"done"}`——**直投不入队**（非出生事件，属收尾通知）。
- **消化轮起跑档位（F-UC8——批 SUBAGENT-SIGNAL-LINES）**：宿主起跑载荷携 `tier` ∈ `ask` / `digest`（**按因两档**——ask 因优先；旗标取核既有载体，**禁新造第二判据**；判据与 CLI **同源同式**）；webview 按 `tier` 取键：`digest.turnLabel`（digest 档 / 缺省档）/ `digest.turnLabelAsk`（ask 档——**携参**）。
- **ask 档携参**（载荷 `from` / `msg`——仅 ask 档条件携带）：`from` = 提问者 `role#id`；`msg` = 问题摘要（显示串——单行 + 截断 ≤120 字符，核单点 `upstreamAskLabelVars`）。
- **计数元素随 `n > 0`**（两档同规）：`n > 0` ⇒ 建本轮计数元素（`dataset.n` = 起跑数）；`n = 0`（ask-only 轮）⇒ 不建（`_digestRoundEl` 置空）∧ end 侧**零动作**（禁兜底建元素——`dataset.n = "?"` 幻影行禁出）。起跑判据 = **本轮起跑即发**（`n` 可 0）。
   **零影响证据**：回收按轮差集补发 ⇒ `n = 0` 轮零 `done` 投递；`S._digestBoundary` 写点唯一（start 分支，每轮重写）⇒ 无跨轮残留。**元素级契约（标签行 / 计数行 / `start`·`end` 语义）单源 = `WEBVIEW-PROTOCOL.md` §5**（本档只记档位与元素约束）。
- **终态补桩状态表**（`activity.js:211-230` 判定 + `:365-373` 调用；前置 = `id != null` ∧ 角色段合法（`[\w-]+`）∧ 回读解析一致——`FAMILY_ROLES` 前置退场（2026-09-19 收正，射程含 consult / escalate——见下「终态必现」）；不满足 → no-op + 记 `drop-unknown-role`）：

| status | 上下文 | 无块时 | 折叠 kind |
|---|---|---|---|
| `done` / `settled` | — | 补桩（折叠 + 立即归档） | done |
| `error` / `failed` | — | 补桩 | error |
| `cancelled` / `terminated` | `was ≠ "queued"`（含 `was` 缺省） | 补桩 | stopped |
| `cancelled` | `was === "queued"`（从未启动） | 不补（no-op） | — |
| `answered` | — | 不补（有块折叠、无块 no-op——回复走 digest 呈现） | — |
| 前置不满足 | 角色段非法（非 `[\w-]+`）/ id 缺失 / 回读解析不一致 | 不补（no-op） | — |

- **旧代回收吞守卫**（`activity.js:331-340`）：接管归档时旧块若在 awaitingDigest（回收在途）→ 新块记 `oldReclaimPending`，其后该键**首条 `done` 视为旧代回收 → 吞**（no-op + 清标志）。残余登记：旧代回收永不至（abort 等）× 新代 `done` 后至 → 可能误吞一次（降级 = 新块滞留区，会话退出 flush 兜底归档——不丢内容）。
- **诊断痕迹**：痕迹面 = **`thincoder-vscode/webview/activity-diag.js`（已落：单一写点 + 环形载体 `SUB_TRACE_MAX = 50`）**；kind 族（七类）与留痕节律见 §5.3；范围 = **出生 / 终态 / 丢弃三面**（内容 chunk 高频面按频道去重）；上行 = 协议行 `panelDiag`。

### 5.2 块头与状态词（形态与字段）

块头为一行方括号 + 状态词（`thincoder-vscode/webview/activity-view.js:42` `headerText` / `:90` `stateWord`）：

- **live**：`[▶ key · sync/async · model · Ns · turn N/M]` + 状态词（取值源闭枚举——见下条）。
- **状态区取值源（闭枚举 · 2026-09-21 块标题行对齐批）**：取值的写点恰两处——结构化工具行（`activity-view.js` `noteChunk`）与 think chunk（同函数），取值 = `${tool} — ${cmd ≤60}` / 工具名 / `思考中…`；
  区块固定三态词（审批 / 待消化 / 排队——`activity-view.js:89` `stateWord` 首判）优先于该取值。
  **嵌套工具名 = `label/tool`**（`m.sub` 链 + `/` + `m.tool`——与 CLI 逐字同构：`thincoder-cli/src/tui/subagent-blocks.mjs:337` 的 `${path.label}/${path.rest}`）。
  **输出面零写入（CLI `currentTool` 语义）**：`face === "toolOutput"` 的 chunk 与无结构化 `tool` 字段的旧形态**一律不改写状态区**（输出只进块体行）——CLI 状态区 = `currentTool` + `command≤60`，无「输出文本入状态区」规则（`thincoder-cli/src/tui/subagent-panel.mjs:105-110`）。
- **queued**：`[⏳ key · queued|waiting]` + 排队信息——**与 CLI 逐档一致**（标尺 = `thincoder-cli/src/tui/subagent-panel.mjs:73` 状态词 / `:100-102` 状态区）。
  slot（`kind: "slot"`）→ `排队中 · 位置 N（槽满等位）`；wait / depc（`kind` ≠ slot）→ **host detail 原文**（`waiting for: …` / `dependency cancelled: …`——零改写）。
  载荷 = `status:"queued"` + `position` / `waiting` / `reason` / `kind`；**降级形态**（缓存缺省 ⇒ 仅 `position`、`kind` 缺省）⇒ 走 **`kind` ≠ `slot`** 支：有 `reason` ⇒ 原文、无 `reason` ⇒ 中性回落 `sub.queued`（= CLI `queued.detail || "queued"` 同形）∧ 状态词 `waiting`。（#118 落）
- **载体与读点（#118——刷新两路径）**：四字段的**块级活态载体** = 块自身 `block._subMeta.queueInfo`（建块默认 `null`——`thincoder-vscode/webview/activity.js:88`；写点 = queued 消费点 `:278`；清点 = `started` 分支 `:307`）；**单一读点** = `stateWord` / `headerText`（`thincoder-vscode/webview/activity-view.js:38` · `:78-80`），经 `refreshBlock` 被两条路径消费：
  ① **2 s 同点刷 live 块头**（`thincoder-vscode/webview/panels.js:69-70` `_panelTimer` → `refreshLiveHeaders`——不设运行态门）；② **覆盖式重建头词与状态区**（每条已建块消息 / 状态分支 + `toggle`）。⇒ 重绘后形态由该载体重建，**无第二消息面回落通道**（缺陷复辟路径不成立）。
- **frozen**：`[✓ key · … · done Ns · turn N/M]`（stop → `⏹` + `stopped Ns`；error → 错误注记随头）。
  **冻结头注记承面（X6 · X11——显示面消差批）**：`— <note>` 承四态——error 错误注记 · done / stopped 停因注记（X6——turn-cap / 用户停止等；判据 = 结果文本的既有标记常量，**从核 import 出处**，禁字面复制）· abort 冻结注记 `— interrupted`（X11）；
  **载体 = 块级 `meta.note` 单字段**（X6 / X11 共用——禁第二注记字段）；渲染句复用 `— <note>`（≤140 字符截断）。两刷新路径（2 s 拍 / 覆盖式重建）同走 `meta` 活态载体 ⇒ 注记随重绘存活（非 DOM 一次写）。`⟦ev⟧stopped` 第 4 位原因词有值则透传为 `note`、无值 `null`（**不伪造**）。
  **error 面保留 + 死枝登记**：核侧零 `onSubagent` 调用点 ⇒ `{type:"subagent"}` 的 `error` / `failed` / `terminated` / `answered` 四态现无发射者（补桩表 error 行与 error 图标词 = 防御面，**保留不删**——本批零动作）。
- **awaitingDigest**：括号去 verb（`[✓ key · … · Ns]`）+ 态词 `done · awaiting digestion`。
- **审批态**（live）：`⏸` 覆盖 `▶` + 态词 `等待审批: <tool>`（子代理 child ask 在途——`activity-view.js:45` · `:75`；清态（`tool: null`）即回落；终态不覆盖图标）。
- **⏹ 覆盖按钮**（`activity-view.js` `updateStopButton`）：live + `running` +（`pool === true` 池条目 **或 `syncLive === true`**——宿主确证可中止的 sync 块，X10）→ 停止；`queued` → 取消排队；且 role ∈ family 时可见；标签与 title 两动作区分；冻结块随 fold 移除。
  **门控载体 = `meta`**（`syncLive` 由宿主在出生 / 心跳载荷携、webview 写 `meta`——与存活投影同形）⇒ 2 s 拍与覆盖式重建同源；**能力面归属（X10）**：路由走核 sync registry（**只读**·禁第二套 registry），不可读 ⇒ 降级为登记 + 文案告知（显示面不做控制面承诺）。
- **tail-3 摘要**（`activity-view.js` `tailLines` :103 / `refreshBlock` :135-143）：折叠态（frozen 或 `open=false`）在头下附末 3 条非空内容行（首尾各 200 字符截断）——**行文 = `│ ` 前缀独立行**（与 CLI `render-segments.mjs:103-109` 同形——D4 消）；容器 = `<details>/<summary>` 原生（壳能力面）；射程 = `.advisor-content` 的**子元素**（`.sub-desc` 不在内）。
- 逐字段端差对位（CLI 面板行 × 本端）与 i18n 键表 = `WEBVIEW-PROTOCOL.md`（本档不重述）。
- **首块说明行**（`.sub-desc`——一次性新用户说明）：`activity.js:101-107`（`S._subDescShown` 置位，`state.js:42`），文案 = locale 键 `sub.desc`；契约见 `WEBVIEW-INPUT.md`。

### 5.3 出生投递与块身份（可靠性）

块的身份键 = 频道名 `sub:<role>#<id>`（契约不变——`activity.js:144-155`）；单 map 单守卫 = `S._subBlocks`（`state.js:81`）。

**键文法单源**：relay 前缀文法 `RELAY_PREFIX_RE = /^([\w-]+)#(\d+)\//`（`thincoder-core/agent/relay-prefix.mjs:10`——角色段**不容空格**）；
端侧内容面键 = `"sub:" + path.head`（`thincoder-vscode/src/extension/panel-subagent-relay.mjs:130`）。
**键形收正（2026-09-19 · 本批）**：`consult` / `escalate` 的端侧键 = `sub:consult#4` / `sub:escalate#2`——**不含模型段**；
实据 = 键构造（`panel-subagent-relay.mjs:130`）+ 既有断言 `thincoder-vscode/test/subagent-content-relay.test.mjs:129`（逐字 `["sub:escalate#2","sub:consult#1"]`）。
`activity.js:44-48` 的 `sub:consult <model> #<id>` 解析分支 = CLI 形态残留（端侧**无产者**）——保留不改，但**不作判据**。

**出生面 = 存活闸（F-A3 · 本批 ①）**：出生事件 = `queued` 与 `started`（`[model]` token = 真启动锚）；命中三向：

| 命中 | 动作 |
|---|---|
| 键**已冻结**（含已归档条目） | `takeoverBlock`——建新代块 + 旧 awaitingDigest 块归档 + `takeover` 痕（新任务**不得永久不可见**） |
| 键 **live** | `ensureBlock` 复用（幂等——不重挂 / 不重复 append / 区序不动） |
| 键 **tombstone**（元素被移除） | 丢弃 + `drop-tombstone` 痕（NFR-A1：元素移除不回建） |

**出生面射程（本批扩两维——② ③）**：建块 / 接管**不限角色族、不限 `pool`**——
① **sync spawn**（`thincoder-core/agent/spawn-child.mjs:77-82` `makeRelay` 在 spawn 即发 `[model]`，载荷 `pool:false`）⇒ **spawn 即建块**（不再等首 chunk）；
② **escalate / consult**（产者 `consult.mjs:292` · `escalate-async.mjs:192` · `subagent-actions.mjs:392`）⇒ **started 即建块**（不再受 `FAMILY_ROLES` 六角色门约束）。
`sync` / `async` 词仍由 `meta.pool` 派生（`activity-view.js:53`——**语义零改**）；**⏹ 可见性判据（X10）** = `running +（池条目 `pool` 或 sync 可中止 `syncLive`）+ family`——非池块仅在宿主**确证可中止**时给 ⏹（F-A4 边界——需求侧半句同轮收正，父侧笔）——`FAMILY_ROLES`（`activity-view.js:14`）**在本判据与 sync/async 词面存续**，「白名单退场」只指补桩前置面（见下「终态必现」）。

**非出生面禁静默（⑦ · 本批）**：chunk / turn / 终态命中冻结键 ⇒ 维持丢弃（**不复活已折叠块**——NFR-A1）+ `drop-frozen` 痕；
命中 tombstone ⇒ 终态走补桩（见下「终态必现」）、其余丢弃 + `drop-tombstone` 痕。
**判据分界 = 消息形态**（出生面 / 非出生面），非「谁先到」；CLI 先例 `docs/batches/2026-09-17-subagent-zero-block.md` §2.2（P0-a 存活复活 + P1 禁静默）在本端的对位：
CLI 存活判据读池实体（`livePoolHas`），端侧**无池** ⇒ 存活凭据 = 出生事件本身 + host 心跳（D-W21）；非存活凭据 = 冻结 / 墓碑守卫。

**投递链三面**：

- **投递队列（host · 单队列）**：`panel._wvOutbox`（数组，上界 `WV_OUTBOX_MAX = 200`——溢出丢最旧 + 留痕）——**事件面与内容面同队**（⑤ 本批落）：
  `postSubagentEvent`（`thincoder-vscode/src/extension/panel-subagent-relay.mjs:143-155`）为两族**唯一**投递口（`panel._wvReady === true` 直投，否则入队）；内容面 `emitToolPanel`（`:109-111`）由直投改**同口入队**——早到内容不再永久丢（暗窗口 = 入队 → 就绪 flush）。
  **序**：单队列按插入序（事件先于内容 = 块先出生再吃内容）；上界 / 丢最旧语义零变化（D-W12）。
  `logEvent("ev:subdeliver", …)` **五处置全留痕**（`direct` / `enqueue` / `flush` / `drop-overflow` / `discard-dispose`——见下「投递面全量留痕」）。
- **就绪握手（两拍）**：webview 起手投 `webviewReady`（`thincoder-vscode/webview/chat.js:147`）→ host case（`panel-messages.mjs:276`）置 `_wvReady = true`（`:288`），
  **排在** `openSessionContent`（`:222`——内部含 `clearMessages` + `resetActivity`）**之后**执行 ① flush 队列（`:228` `flushSubagentOutbox`——保持入队序，**含内容面**）→ ② `reassertLiveChildren`（`:229`）。
  后置理由：先投的出生事件必被清屏抹掉。
- **存活投影**：`thincoder-vscode/src/extension/suspension.mjs:131-148` 读 `panel._liveLines ?? panel._susp?.lines` 的 `_asyncSubagents` / `_asyncAdvisors`（与 ⏹ 路由同源），
  **只发 live**——`running` → `started` + `pool: true`，`queued` → `queued`（两侧 role/id 必带；**载荷与 relay 面同形**：`position` / `waiting` / `reason` / `kind` 一并投影——重绘后与 live 面逐档一致；缓存单源 = queued 事件消费点）。（#118 落）

**内容面投递（W15 内容面——2026-09-16 补；投递面本批并入队列）**：子代内容 chunk（text / think / 工具调用行 / 工具输出行）经 relay 前缀文法
（`role#id/`——嵌套链子标随行）在端壳分流 → `toolPanel` `sub:<role>#<id>` 载荷（`panel-subagent-relay.mjs` `relaySubagentContentChunk`）；
投递 = `emitToolPanel` 单点 → `postSubagentEvent`（**就绪门 + 队列 + 溢出留痕**——与事件面同语义）。次序 = 事件面先吃、内容面后判；前缀由核逐 chunk 重加 ⇒
端侧逐 chunk 独立解析（无跨 chunk 重组、无半前缀）。
**工具结果行面 = 无产者（2026-09-20 删净——行为零变更）**：证据链 —— 核 `wrapChildCallbacks`（`thincoder-core/agent/spawn-child.mjs:146-163`）只包四面
（`onToken` / `onReasoning` / `onToolCall` / `onToolOutput`，**无 `onToolResult`**），子装配（`agent-tools/subagent-spawn.mjs:472-475` · `consult.mjs:299` · `escalate-async.mjs:208` · `subagent-actions.mjs:399` 同族）亦不携该回调
⇒ 子内 `callbacks.onToolResult?.()`（`dispatch.mjs:374` / `:441`）恒 `undefined` ⇒ 带 relay 前缀的结果行不存在（端侧分流恒 false）。将来核侧若真加 relay ⇒ 随该能力面重建支路 + 本句（不预置死支路）。
**第 4 参对位（⑥）**：`onToolResult` 第 4 参 = `toolCtx._subagentKey`（核 `dispatch.mjs:441` 传入；**仅 sync 成功 / 折叠路径**设置——`subagent.mjs:380-384`）= sync 子代理的**完成锚**（CLI 对位 = `finishSubTaskKey`）⇒ 端侧消费：该参存在即以该键补 `done`（**sync 子代理块终态落定**——现态永不折叠）；无该参（async ack 形 / 普通工具路径）零动作。

**出生自愈心跳（host · 2 s 拍——F-A1 · F-A4 · F-A5）**：

- 拍体 = `reassertLiveChildren(panel)` **本体**（与就绪握手 / `loadSession` 同一函数——单源，不新造存活投影）；起 = `webviewReady` case 内（`panel-messages.mjs:229` 之后），停 = `panel` dispose（`chat-panel.mjs:127` 旁）；`unref?.()`（不阻进程退出——同 `thincoder-vscode/src/extension/ledger-surface.mjs:125-126`）。
- 拍体前置两守卫：`panel._wvReady === true`（未就绪不向队列堆重复出生事件——就绪拍已覆盖该窗口）；`n > 0` 才留痕（空拍零日志）。`n` = 本拍重发条数。
- **幂等契约靠既有守卫导出（不改判据）**：键 live → `ensureBlock` 复用（不重挂 / 不重复 append / 区序不动）；键**已冻结** + host 判 live → `takeoverBlock` 建新代（F-A3——host 是「该键仍 live」的权利人，冻结条目 = 陈旧墓碑）；键 live 但元素被移除 → tombstone 丢弃（语义不变）。
- **降级块修复**：内容 chunk 先到、出生事件从未到（块 `pool: null`）⇒ 心跳 ≤2 s 内补 `pool: true` + `model` + `startedAt` ⇒ ⏹ 与 `sync/async` 词随 `pool` 派生恢复（F-A4——控制面与内容面同块）。
- **源新鲜度（心跳放大的既有洞——本批须补）**：`panel._liveLines` 只在回合起点登记（`panel-chat.mjs:191`），切会话 / 新建会话**无清点** ⇒ 心跳会把「源陈旧」从偶发放大成每 2 s 向新面板投旧会话池块。
  修法落点 = `thincoder-vscode/src/extension/panel-session.mjs:74` **`loadSession` 入口段**（`:85` `panel._agent = null` 销毁点旁）置空 `panel._liveLines`——
  newSession / switchSession / deleteSession / onProjectChanged / openSessionContent 五路汇合于此（同档 `:78-80` 注释）⇒ 单点覆盖、回落 `panel._susp?.lines`；判据：切换后心跳 `n ≡ 0`（T-A7）。
- **不做**：不重发终态 / settled（终态呈现 = 既有终态消息与 digest——F-A2 面）；不复活已归档块（tombstone / frozen 语义不变）。
- **sync spawn 出生面本批已落**（`started` + `pool:false` 即建块——见上「出生面射程」）；心跳射程仍 = 池条目（`thincoder-vscode/src/extension/suspension.mjs:140-159`——`_asyncSubagents` / `_asyncAdvisors`）。

**投递面全量留痕（host · NFR-A2 主侧）**：

- `postSubagentEvent` **五处置全记** `ev:subdeliver`：`direct`（就绪直投）/ `enqueue` / `flush` / `drop-overflow`（溢出丢最旧）/ `discard-dispose`（view dispose 清队——⑥ 本批补）——载荷含 `ch`（频道名）· `status` · `wvReady`。
  现状只记入队 / 出队两处置 ⇒ 直投（生产常态）、溢出丢弃与清队丢弃三面无痕（本次实据：15:00–15:30Z 窗口零条 ⇒ 无法区分「直投成功」与「从未投递」）。
- 内容面（`relaySubagentContentChunk` → `emitToolPanel`）：每频道**首条**记 `logEvent("ev:subcontent", …)`——载荷 `{ ch, face }`（`face` ∈ `text` / `think` / `toolCall` / `toolOutput`——四面；该频道首条实收面）、形态 = `content-first` 正收据；「内容丢失」面本批起由 `drop-overflow` 承载（内容已入队，不再直投丢弃——上界 = 每频道 1 行 + 溢出行）。
- 心跳：`reassert` 摘要行——`n` 变化即记 + 每 30 次拍兜底（心跳存活本身可断言）。

**webview 侧痕迹与上行（NFR-A2 webview 侧）**：

- 痕迹面迁出至新档 `thincoder-vscode/webview/activity-diag.js`（已落——`activity.js` 现 **450 行**（行计数口径 = `wc -l` / 含末行；as-of 2026-09-20 收口轮实读）、越 300 建议线；痕迹整体迁出，`activity.js` 只留调用点）；环形 `SUB_TRACE_MAX = 50` 与 `_subTraceLog` 载体同迁（`state.js:83-85` · `:122` 两处退场）。
- kind 族（**七类**）：既有三类 `takeover` / `late-terminal-stub` / `drop-unknown-role` + `birth`（新块出生——正收据）/ `drop-frozen`（冻结键吞掉的非出生消息——① 静默面）/ `drop-tombstone` / `reassert-hit`（心跳命中已 live 块——正收据，每频道每生命周期一条）。
  **退场一类**：`skip-key-unrebuildable`（旧射程登记用）——consult / escalate 射程收正后该分支不存在（见「终态必现」）。
- **留痕节律**：出生 / 状态面**逐条**；内容 chunk 面**每频道每生命周期首条**（高频面按频道去重——上界与 `content-first` 同族）。
- 上行 = 新协议行 `panelDiag`（webview → host）：`{ type: "panelDiag", kind: "subTrace", entries: [{ kind, channel, at }] }`——新条目即发、批内合并（最多一消息 / 批）；host case → `logEvent("ev:subtrace", …)` 入主侧日志。登记 = `WEBVIEW-PROTOCOL.md` §3.2 行 8（§13 机检表行随实现落——机检表只收实测在位的行）。
- **判据**：复发时主侧日志同载两面——host 投了没（`ev:subdeliver`）+ webview 收了做什么（`ev:subtrace`）——本次事故的判定缺口（未达 / 被守卫吞不可分）由此闭合。
- 射程：**出生 / 终态事件面**；内容 chunk 的高频丢弃不逐条留痕（量级不可控）。

**终态必现（F-A2）**：

- 「块缺失」判据**扩一形**：map 条目存在但元素被移除（live tombstone）+ 终态消息 ⇒ 走补桩（折叠桩 + 立即归档 + `late-terminal-stub` 痕迹），不再静默丢弃；**live / chunk 消息的 tombstone 丢弃语义零变化**（NFR-A1）。
- **射程（2026-09-19）**：consult / escalate 的端侧键 = `sub:<role>#<id>`（**可单源重建**——`relay-prefix.mjs:10` 文法与内容面键构造 `panel-subagent-relay.mjs:130` 同形；实据 `subagent-content-relay.test.mjs:129`）⇒ **纳入补桩射程**（与 family 角色同规）。
  前置判据改 = `id != null ∧ 角色段合法（[\w-]+）∧ 回读解析一致`（`FAMILY_ROLES` **补桩前置**退场——D-W10 收窄；该族表在 ⏹ 可见性 / sync-async 词面仍存续——`activity-view.js:14` · 见上「出生面射程」）。

**清屏可恢复（F-A5）**：心跳 + 既有两处再断言（`webviewReady` 握手后 · `loadSession` 清屏后同 tick）覆盖「boot / loadSession 清屏后仍存活者重现」；载荷与语义同 F-A4（同一存活投影）。

**窄缝族（⑥ · 本批逐条）**：

- **view dispose 清队**（`chat-panel.mjs:126-127`）：**清队语义不变**（跨 view 不串味——旧 view 的待投事件不得灌进下一个 view）+ 补 `discard-dispose` 留痕（禁静默）；重建面由心跳 / 就绪再断言承担（不重放陈旧事件——D-W29）。
- **补桩限 family** ⇒ 前置判据收正见上「终态必现」（consult / escalate 纳入）。
- **`makeRelay` 无池兜底**（`thincoder-core/agent/spawn-child.mjs:77-82`——sync 取号 = `_subAgentCounter + 1`，与 async 取号 `nextSubagentId`（`subagent-scheduler.mjs:404-420`：`max(counter, poolMax) + 1`）共用同一计数器）⇒ **登记 + 出批上抛**（**端侧零修**）：
  同键成立需「计数器被重置 ∧ 池存活」这一组合，而池与 agent 生命周期同灭（VSC 侧 `_agent = null` 提池同段）⇒ 常态不可达；核面修法（改走 `nextSubagentId`）跨端影响 CLI 块命名 ⇒ 不在本批写域。既有显式取舍保留：同键两实例 = 消息交错可见（`activity.js:161`）。
- **`onToolResult` 两件**（`panel-callbacks.mjs:163-168`）：① relay 分流面 = **无产者**（证据链见上「工具结果行面 = 无产者」）；② 第 4 参 `_subagentKey` 同点未消费 ⇒ sync 子代理块**永不折叠**，修法 = 消费该参补 `done`（见上「第 4 参对位」）。

**同族配套（非上述三面）**：

- **清屏后再断言**：`loadSession`（`thincoder-vscode/src/extension/panel-session.mjs:133-166`）在 `clearMessages`（`:157`）与 `historyPage`（`:160-161`）**之后同 tick** 调 `reassertLiveChildren`（`:165`）——重建块恒落区尾。
- **未就绪窗口**：webview 重载 / 渲染崩溃且 view 未 dispose 时池存活（`retainContextWhenHidden: true`——`thincoder-vscode/src/extension/chat-panel.mjs:119`）；view dispose → `_wvReady = false` + 清队（`chat-panel.mjs:127`），跨 view 不串味。
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
| T-A15 | 结构门（NFR-A3 机检） | `doc-check` + 行数扫描 | 改动后 `activity.js` < 500（痕迹外提抵消新增）· `activity-diag.js` ≤ 500 · 新增行无 >300 单行 · 文档锚零悬空 |
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
| T-A32 | **反例**（NFR-A1）：冻结键收 chunk 不复活 | `streaming.subagentChunk({ name: "sub:explore#5", kind: "text", text: "late" })`（键已冻结） | 零新块 / 零 append / 原块不变 + `drop-frozen` 痕（**反例保持**——不许因本批变红） |


### 5.4 150 窗与懒历史

- **DOM 窗上限 150 块**：`thincoder-vscode/webview/ui.js:468`（`MAX_MESSAGE_BLOCKS`）+ `trimOldMessages`（`:469-476`）——计数选择器含 `.message` / `.tool-call` / `.advisor-block` / `.sub-block`（**归档块随窗出窗**）；区驻留块不在其容器，不计。
- **懒历史锚**：`thincoder-vscode/webview/history.js:29`（加载指示插位）与 `:56`（分页 prepend 锚）选择器同含 `.sub-block`——归档块与懒历史页共存时插位正确。
- **分页**：首窗 = 末页（`older=false`）+ `hasOlder`；`scrollTop ≤ 40` 触发 `loadOlder`（`history.js:87`）；prepend 后按 `scrollHeight` 增量补偿 `scrollTop`（`:57-61`）。页大小常量 = `thincoder-vscode/src/extension/history-window.mjs:22`（`HISTORY_PAGE_SIZE = 200`——跨端首窗对齐）。
- 归档块**不补 `data-idx`**（不出现在历史回填中——登记项）。

### 5.5 live 块跟滚与内容区高度

两层独立、互不写对方状态：

- **外层 = 区 pin**（`ui.js:442-445`）：块出生（`activity.js:107`）与流式帧（`streaming.js:63`）调用；近底 24px 判据、上滚解 pin、回底重 pin（`ui.js:466-470` `watch` 闭包）。块出生**不再牵动** `#messages` 滚动。
- **内层 = 块内容区跟滚**（`activity.js:120-136`）：`initBlockFollow` 给 `.advisor-content` 挂 `wheel` / `touchmove`（passive）监听写 `内容区._pinFollow`；`maybeScrollBlock` 在 rAF 尾逐块应用——`open=false` 或 `!isConnected` → no-op，默认钉底写超值（不读 `scrollHeight`）。
- **帧驱动**（`thincoder-vscode/webview/streaming.js:32` · `:44` · `:64-67`）：`subagentChunk` 追加后把块记入脏集 `_subScrollDirty`，`scheduleStreamRender` 的 rAF 体内逐块 `maybeScrollBlock` 后置空；**节流重排条件含脏集**（跳过的帧不得丢跟随）。
- **高度**：`.advisor-block.sub-block .advisor-content` = **60px**（`thincoder-vscode/webview/chat.css:468`）；基础 `.advisor-content` = 100px（`chat.css:318`）。
- **出生可见性（④ · 本批——新块必看得见）**：
  - **区 pin 旗标维护**：`ctx._pinActivity` 由 `scroll` / `wheel` / `touchmove` 三事件同读几何（近底 24px——`ui.js:463-473` `watch` 闭包）。`scroll` 为**唯一「滚动已生效」后**触发者（键盘 / 拖条 / 程序写入全覆盖）——现状只有 wheel / touchmove，且读的是**滚动前**几何 ⇒ 旗标可留陈旧位。
  - **出生判据（二向）**：`buildBlock`（`activity.js:108-111`）出生时——钉底（`_pinActivity !== false`）⇒ 照旧 `maybeScrollActivity(ctx)`（跟随）；**未钉底** ⇒ **不改 `scrollTop`**（不夺用户阅读位——D-W2 语义保持），
    改在**区首**生成 / 更新未读计数钮 `.activity-new-btn`（`position: sticky; top: 0`；文案 = locale 键 `sub.newBlocks`（zh `↓ ${n} 新块` / en `↓ ${n} new block(s)`——逐字登记 = `WEBVIEW-PROTOCOL.md` §6.3）；`N` = 未钉底期间出生块数）。
    **落档 = 新档 `thincoder-vscode/webview/activity-new.js`（已落）**——建 / 更 / 删钮 + 点击回底 + `resetActivity` 同清；`activity.js` 只在出生判据点调用。
  - **回底清账**：钮点击 ⇒ `scrollTop = MAX` + `_pinActivity = true` + 移除钮 + `N` 归零；任一「近底」判定成立（`scroll` 事件）同清；`resetActivity` 同清。
  - **`:empty` 不回归**：钮按需建 / 删（`N = 0` 时元素不存在）——空区仍 `:empty` 零高（D-W1）。
  - **判据**：T-A21 / T-A22 / T-A23（未钉底出生 ⇒ 钮 `N = 1` 且 `scrollTop` 零改；点击 ⇒ 回底 + 钮消失；`scroll` 事件两向旗标正确）。

### 5.6 内容行合并粒度（CLI `pushBlock` 对齐）

**口径** = 以 CLI 为标尺（`docs/cli/design/TUI.md` §6.8.2；两端语义冲突以 CLI 为准）。三面实读（2026-09-20 设计轮 · file:line 实核）：

| 面 | CLI 合并判据（标尺） | 本端（本批落） |
|---|---|---|
| text / think | `pushBlock`：`!fresh && last.kind === kind` ⇒ 并入末块（`thincoder-cli/src/tui/subagent-children.mjs:139-145`） | 同判据（`.advisor-text` 行 kind + `sub` 同即并入——`webview/ui.js:71-77`，**零改**） |
| kind 翻转 | `last.kind === kind` 不成立 ⇒ 新块（`subagent-children.mjs:140`） | 新行（同判据——**两端同构，非端差**） |
| 工具输出 | `fresh = currentTool !== toolName`（工具名取自 relay 前缀 `path.rest`）⇒ 工具名不变即并入末块、**RAW 拼接零分隔符**（`thincoder-cli/src/tui/subagent-blocks.mjs:364-370`） | **新**：末子行 = 工具行 ∧ `dataset.face === "toolOutput"` ∧ `dataset.tool` 同 ∧ `dataset.sub` 同 ⇒ 并入（文本节点拼接，零分隔符） |
| 工具调用行 | 恒新块（`fresh: true`；行尾带 `\n`——`subagent-blocks.mjs:346`） | 恒新行（`face === "toolCall"`） |

**为什么必须改**：relay chunk = **任意字节边界碎片**（CLI 同注释实证：逐 chunk 补 `\n` 会把词拦腰断行——`subagent-blocks.mjs:351-355`）；旧形（`webview/ui.js:51-68`）每 chunk 新建 `div.advisor-tool-line` ⇒ 逐 chunk 断行（台账 #148 症状「一 chunk 一行」）。

**面随载荷（协议字段 `face`）**：CLI 以「哪个路由函数被调用」表达面；本端四面压成单 `toolPanel` 载荷 ⇒ 面必须随载荷，否则调用行与输出行不可分（输出并入调用行 ⇒ 工具名粘连）。取值与登记 = `WEBVIEW-PROTOCOL.md` §3（`toolPanel` 行）· §3.2 行 3。
**端差登记（2026-09-20 · 台账 #150-B）**：CLI 首条 ``toolOutput`` **并入调用块**（`fresh = sub.currentTool !== toolName` ⇒ 调用后同名输出不新开块——`thincoder-cli/src/tui/subagent-blocks.mjs:369`；调用行自带 `\n`——`:346`）⇒ 块面 1 段；本端面门（`face` ⇒ 调用行 / 输出行各成行）⇒ **2 段**。**视觉等价**（CLI 调用行内换行、输出紧随下一行）⇒ **维持 R3 面门**。

**RAW 与换行**：并入 = 逐字文本节点拼接（零分隔符，同 CLI `subagent-children.mjs:143`）+ `.advisor-tool-line` 加 `white-space: pre-wrap`（`webview/chat.css:336`）⇒ 输出自带换行结构无损还原、chunk 边界不可见。

**降级（fail-safe）**：无 `tool` / 无 `face` 的 chunk（旧生产者 / `onToolPanel` 缝）⇒ **恒新行 = 旧行为零变**（不猜）。

**不做**：不跨 kind 合并 · 不并「不同 `sub`」的行（行首子标归属可辨；CLI 内层无归属标 = `docs/cli/design/TUI.md:360-361` 已登记端差，本批维持）。

**判据**：T-G1–T-G8（`thincoder-vscode/test/render-granularity.test.mjs`）——同工具连续输出三片段 ⇒ 段数 2（先红 = 3）；工具改 ⇒ 新段；调用行恒新段；kind / `sub` 交替恒分段；旧生产者降级；kind 缺省 ⇒ 文本行。

## 6. 关键决策记录（含否决备选）

| # | 决策 | 否决备选 / 理由 |
|---|---|---|
| D-W1 | 活动区容器居 `#messages` 与 `#panels` 之间；空区 CSS `:empty` 零高（零显隐 JS） | 否决常驻空面板（占高）· 否决「有 live 才现」（需层状态） |
| D-W2 | 区高度自适应 + 32vh 封顶 + 区内自滚 + pin 跟随 | 否决固定高（单块白占）· 否决不封顶/不 pin（挤死会话区 / 新块不可见） |
| D-W3 | ⏹ 单委托点迁区（`chat.js:94` 挂 `ctx.activityEl`，空安全绑定） | 否决双委托（`messagesEl` 残留死码） |
| D-W4 | 终态去向 = **消化后归档落流**（轮边界插入；失效退化尾追） | 否决旧 DOM-move 锚链（§7 退场名单）· 否决折后移除（内容不可读）· 否决一律尾追（序反 CLI——仅作降级路径） |
| D-W5 | `awaitingDigest` = 冻结态上的**单标志**驻留（CLI 行形态头词） | 否决第二状态机（旧驻留双态）· 否决 settled 即时折叠（用户点名缺口） |
| D-W6 | 区保留上限退役（`MAX_REGION_FOLDED` / `enforceRegionCap` 已删） | 新语义下无折叠块常驻——上限成死码 |
| D-W7 | `resetActivity` 只清**区子树** | 否决全域清扫（会删流内归档块 = 会话历史） |
| D-W8 | 会话退出 = 区**全体**归档（flushing 兜底） | 否决仅 live 折叠（awaiting 块悬空驻留） |
| D-W9 | 出生事件队列化 + 就绪/清屏后再断言（**只带 live 条目**） | 否决逐处门控（未知路径防不住）· 否决扩 settled 重建（与已撤池快照同族） |
| D-W10 | 终态补块前置 = **合法 id + 合法角色段（`[\w-]+`）+ 回读解析一致**（2026-09-19 收窄：`FAMILY_ROLES` 白名单退场——consult / escalate 纳入；仍否决无条件建块） | 否决无条件建块（未知 role 的块无法解读）· 否决 answered / queued-cancel 补桩（既有裁决） |
| D-W11 | 频道名 `sub:<role>#<id>` 与 chunk 路由契约**不变** | 否决加代际后缀（连带改频道命名/子标挂载/CLI 面板路由） |
| D-W12 | 队列上界 200 + 溢出丢最旧 + `ev:subdeliver` 留痕 | 否决无界队列（暗窗口内存无界） |
| D-W13 | 块级跟滚载体落 `activity.js`（旗标 + wheel/touch 让位 + rAF 帧应用） | 否决内联裸钉底（无让位）· 否决几何派生（新造模式）· 否决 `ui.js` 滚动族泛化（状态模型不符 + `ui.js` 473 行（口径 = `wc -l` / 含末行 · as-of 2026-09-20 实读）越 300 建议线） |
| D-W14 | 高度 60px 作用于 `.sub-block` 全部（live + 冻结同卡面） | 否决仅 `.sub-live`（冻结展开态须同卡面）；advisor 流内块维持 100px |
| D-W15 | 合并权限卡**携 `promptId` 并入逐项卡族**（单一释放通道 + 同一移除选择器） | 否决单开释放语义（同语义两通道 + 消费者按类分支——`permissionWithdrawn` 已按 id 精确匹配，见 `WEBVIEW-PROTOCOL.md` §4.6 · D-P12） |
| D-W16 | 忙态门 = **禁用**（非隐藏 / 非不做）；判据 = `_turnState !== "idle"` | 否决隐藏（信息钮隐藏即失去「当前模型」读数）· 否决仅 `running`（留 `susp` 在飞蒸馏落盘窗——`panel-callbacks.mjs:319` 携旧回合快照）+ 与 D-P9 的分工见 §4.2 |
| D-W17 | `@` 引用 = **显示边界剥离**（消费面二处 = 恢复面显示 + **标题源文本**——均还原简洁形；落点端侧） | 否决改存储本体（动人读线 = CLI 共文件）· 否决活面同步展开（B 口——正文搬上屏）· 否决落核窗口面（消费方只有 VSC + 语法产者住端——§4.4 判据） |
| D-W18 | 非零退出 = **判据扩**（卡态 + 保持展开 + 摘要含退出状态，同一判据派生） | 否决仅摘要（卡仍绿）· 否决仅展开（折叠面读作 `(empty)`）——单信号不达「可见失败」 |
| D-W19 | spawn 失败（进程未启动） = **产者补状态位** `(spawn failed)`（状态位族第三成员；端侧判据族随扩一名）——**产者两处、同名同形**：核 `thincoder-core/tools/bash.mjs:183-190`（CLI 面）· **宿主 `thincoder-vscode/src/tools/shell.mjs:242-260`（本端卡面真产者）**；同批收正宿主两态（超时 ⇒ `(killed: timeout <N>ms)` · 输出超容 ⇒ `(killed: output limit exceeded)`）+ **退出码槽只接受数字**规则。本端 `bash` ≠ 核 `bash`（`thincoder-vscode/src/tools/index.mjs:29` · `:172-175`）⇒ 只改核面则本端卡面零变化（评审 id=118 #1 实核） | 否决判据面认产者措辞（`Command failed:` 前缀——跨端措辞耦合 ⇒ 产者改字即静默复辟；且不产状态文本 ⇒ 摘要仍读 `(empty)`，第三信号须二次手术；CLI 端零收益）· 否决 `Error:` 前缀（核侧控制信号——`dispatch.mjs:369` · `:420` · `:426` · `:438` 同读，语义升格面）· 否决伪造 `(exit code N)`（进程未启动，禁造假状态）· 否决「本端改判为核/CLI 面收口」（本端卡面即本缺陷的用户可见承诺面） |
| D-W20 | 出生自愈 = **既有存活投影的 2 s 心跳**（拍体即 `reassertLiveChildren` 本体；起于就绪握手、止于 dispose） | 否决新造存活投影（双源）· 否决投递层重试（投递层看不见 webview 守卫吞掉 / 键已冻结）· 否决只在握手 / 切屏再断言（投递丢失窗口不覆盖——本次事故留 20 min 空窗） |
| D-W21 | 心跳**允许**对已冻结键建新代（接管；host 是「该键仍 live」的权利人） | 否决心跳禁接管（新代出生消息丢失时永久不可见——违 F-A3）· 否决心跳携带实例序号（改频道命名法——D-W11 / F-A3 边界禁止） |
| D-W22 | 痕迹面**迁出** `thincoder-vscode/webview/activity-diag.js`（已落） + 上行 `panelDiag` 入主侧日志 | 否决痕迹留 `activity.js`（**450 行**——行计数口径 = `wc -l` / 含末行；as-of 2026-09-20 收口轮实读 + 新增 ⇒ 近 500 硬限）· 否决只留 webview 环形日志（DevTools 不可回读——本次事故正因不可回读而盲） |
| D-W23 | 终态「块缺失」判据**扩 tombstone 一形**；**射程含 consult / escalate**（2026-09-19 收正——端侧键 = `sub:<role>#<id>`，可单源重建；旧「键不可重建」判定按 CLI 形态，不成立于端侧——§5.3 键形收正） | 否决端侧按 `sub:consult <model> #<id>` 重建（端侧无此键形）· 否决改频道命名法（D-W11 · 跨端契约） |
| D-W24 | 心跳源新鲜度 = **会话切换 / 新建会话点清 `panel._liveLines`**（回落 `_susp?.lines`）；落点 = `thincoder-vscode/src/extension/panel-session.mjs:74` `loadSession` 入口段（`:85` 旁——五路会话操作汇合单点） | 否决心跳自带会话比对（同一判据两处实现）· 否决不禁（心跳把源陈旧从偶发放大为每 2 s 一次——NFR-A1 反例） |
| D-W25 | **出生面 = 存活闸 + 非出生面 = 禁静默**（①）：出生事件（`queued` / `started`）命中冻结键 ⇒ 接管建新代；非出生消息（chunk / turn / 终态）命中 ⇒ 维持丢弃 + `drop-frozen` / `drop-tombstone` 痕 | 否决仅留痕不建块（用户症状本体仍在——块永不出现；且 CLI 先例取生存活闸）· 否决全路径接管（chunk 复活已折叠块 ⇒ 违 NFR-A1）· 否决按「谁先到」时序定存亡（不可机判）。**选型理由**：CLI 存活判据读池实体（`livePoolHas`），端侧无池 ⇒ 存活凭据 = 出生事件本身 + host 心跳（D-W21），故判据分界 = 消息形态（见 §5.3） |
| D-W26 | 出生建块门**两维去门**（②③）：去 `FAMILY_ROLES` 门、去 `pool` 门——`started`（含 sync `[model]` 与 escalate / consult）即建块；`sync` / `async` 词仍由 `pool` 派生 | 否决保留 family 门（escalate / consult 跑着没有块——审计 ② 本体）· 否决 sync 仍等首 chunk（开头一段不可见——审计 ③）· 否决用 pool 区分出生（sync 出生面 = spawn 即建） |
| D-W27 | 出生可见性判据 = **钉底跟随 / 未钉底计数钮**（`↓ N 新块`，点击回底）+ pin 旗标由 `scroll` 事件维护（保留 wheel / touchmove） | 否决出生强拉（夺用户阅读位——违 D-W2 上滚解 pin 语义）· 否决纯不做（块在 DOM 不在屏上——用户症状本体）· 否决只加高区体（不解决上滚后出生） |
| D-W28 | 内容面**并入同一投递队列**（`postSubagentEvent` 单口——就绪门 + 队列 + 溢出丢最旧） | 否决第二队列（双状态 + 事件/内容次序风险：块须先出生再吃内容——同队插入序天然保证）· 否决内容面只留痕不入队（早到内容仍永久丢——⑤ 未达） |
| D-W29 | view dispose = **保持清队**（跨 view 不串味）+ `discard-dispose` 留痕；重建面交心跳 / 就绪再断言 | 否决保留队列跨 view 重放（陈旧事件灌新 view + 与「跨 view 不串味」冲突；存活重建已有单一权威） |
| D-W30 | `onToolResult` 第 4 参（`_subagentKey`——核 `dispatch.mjs:441`）**端侧消费** ⇒ sync 子代理块终态落定 | 否决不消费（块永不折叠——静默不一致）；仅 sync 路径带该参（`subagent.mjs:380-384`）⇒ async 零误冻 |
| D-W31 | 心跳射程 = **池条目**；sync spawn 出生面由出生闸承担（不在心跳射程） | 否决扩心跳到 sync（sync 子代理阻塞当前回合、无跨拍存活语义——轮次级实体） |
| D-W32 | 工具卡「已结算」= 卡对象 `done` 旗标（**唯一写点** = `finishToolCard` 首行；建卡 `addTool` 置 `done:false`）+ 回合尾**无条件**清扫未结算卡（`webview/streaming.js` `sweepUnsettledToolCards`——`finish()` 内 complete / aborted 两路径同规）（M1） | 否决「收尾前恒有 `toolResult`」时序假设（中止路径不成立——CLI `sweepToolBlocks` 为对位标尺）· 否决 TTL / 自动消失（迟到结果无消费者）· 否决 webview 侧按长度 / 超时改判 |
| D-W33 | `context X%` **单口径**：分子 = 核 `estimateTokens(history)` ∥ 分母 = `providerSpec(provider).context`（与 CLI 状态行同源同式——派生单点 = `thincoder-vscode/src/specs.mjs` `ctxPercentForHistory`）（M2） | 否决保留 provider 报告值分子（同标签双口径 = 本缺陷本体）· 否决两端各自实现（漂移源）· 否决新增绝对 token 段（端差登记面另计） |
| D-W34 | 对象 chunk（核 sync 评审 `{kind, text}`）在**端边界归一**为串（`thincoder-vscode/src/extension/panel-callbacks.mjs` `onToolOutput`——**CLI 逐字先例** `thincoder-cli/src/tui/tool-events.mjs:322-324`）（M3） | 否决核侧字符串化（毁 `kind` 三态语义）· 否决 webview 侧再归一（载荷已定型）· 否决 relay 面改动（对象已在 relay 内归一） |
| D-W35 | digest 起跑携 `tier` ∈ `ask` / `digest`（**按因两档**——判据与 CLI 同源：ask 因优先；ask 档同携 `from` / `msg` 问题摘要）；计数元素随 **`n > 0`**（两档同规；`n = 0` ⇒ 零元素、end 侧零兜底——禁幻影计数行）（M4 · F-UC8） | 否决 VSC 自造第二判据 · 否决按档判计数元素（两因同轮吞计数）· 否决 end 侧兜底建元素 |
| D-W36 | advisor 卡头 / 状态行轮次标签 = **端侧单源** `advisorRoundTag`（字面 = CLI `roundTag` 逐字 `(round N · model)`；无 `model` ⇒ `(round N)`；非 advisor 零字段）（X2） | 否决 webview 侧写工具名字面比较（`protocol-coverage` 提取器按 `.name === "x"` 形态误判消息判别式）· 否决宿主侧拼整串（双源） |
| D-W37 | 工具摘要族 = **端侧单源叶** `thincoder-vscode/webview/tool-summary.js`（`formatToolSummary` 分派；字面逐字承 CLI；活卡 / 恢复卡共用）（X3 · X7） | 否决留 `ui.js`（触 500 硬限——先例 `tool-card-restore.mjs`）· 否决迁核单源（跨批结构面——重复形态登记）· 否决只补 advisor 分支（其余族仍异形） |
| D-W38 | 工具结果截断提示 = **宿主切片点事实旗标** `truncated` 驱动（正文尾行 + 摘要标注）（X5） | 否决 webview 侧长度比较驱动（`capText` 的 `<= max` 边界洞复辟——恰 64K 无提示）· 否决不提示（静默截断 = 用户不可知）· 否决改 64K 额度 |
| D-W39 | 块头注记 = **块级 `meta.note` 单字段载体**（X6 停因注记 + X11 `interrupted` 共用；`— <note>` 渲染句复用——禁第二注记字段 / 禁第二回落通道）（X6 · X11） | 否决 DOM 一次写（两条刷新路径会丢）· 否决第二注记字段（双载体）· 否决伪造 `interrupted`（宿主分辨不出 ⇒ 降级为登记） |
| D-W40 | sync 块 ⏹ = 门控加 `syncLive` 支 + 路由走核 registry（**只读**·禁第二套 registry）（X10） | 否决只扩 webview 门控（无路由的按钮静默无效——违既有「可见但不可中止」纪律）· 否决第二套 registry · registry 不可读 ⇒ 降级为登记 |

## 7. 不并项与历史沿革

### 7.1 历史沿革（(d) 类——**不并**）

> 来源档 `thincoder-vscode/docs/design/WEBVIEW.md`（VSC 产品档）——**原地保留作参照历史**。下列内容**不并入本档**：

| 旧档位置 | 内容 | 何故不并 |
|---|---|---|
| 头注（来源 / 状态 / 约束行） | 时点材料（「自 `ARCHITECTURE.md` §11/§12 迁出重组 · 状态：当前态」） | 迁移材料——本档首注已给来源与口径 |
| §15 变更记录（75 行逐批流水） | 逐批施工记录 | 历史叙述——完整历史见 git log |
| §12 头注 + §12.1 + §12.2 Q1/Q4 + §12.3 第 3/4 条 + §12.5 D-A1/D-A2/D-A5/D-A7 + §12.8 AC-R3 | **区内原地保留 + 折叠块上限 20 + settled 即时折叠**（2026-09-11 活动区回归批的选定项） | **已被 2026-09-12 收口批反转**——现态 = 终态清退落流 / awaitingDigest 驻留 / 上限退役（§5.1） |
| §5 旧版正文 + §5.1.1–§5.1.3 + §5.1.8 | 块流尾出生 · 「出生即计 150」· 第 10 批问题陈述与两案选型 | 位置语义已被活动区回归取代；施工过程 = 一次性材料（结论入 §5.3） |
| §5.1.6 / §5.1.7 / §5.1.9 | 第 10 批受影响文件 / 用例表 / 边界（VSC 端） | 一次性施工面清单——测试资产归测试层（`thincoder-vscode/test/`） |
| §12.6 / §12.7 / §12.8 / §12.9 · §13.1 / §13.2 / §13.5–§13.9 · §14.1 / §14.2 / §14.6–§14.10 | 各批受影响文件 / 用例表 / 验收标准 / 边界 / 现场核实 / 选型表 | 一次性批次材料——结论已入 §5 契约与 §6 决策；测试用例号归测试层 |
| §12.4 · §14.4 旧机制对照表 | DOM move 落流锚链 · `freezeInsertPoint` · settle 驻留双态 · `_subagentMap` 逐行簿记 · preview / ticker | **退场名单**（禁令保留于 §5.3 与 D-W4/W5）——对照逐项叙述属批次语境 |
| §14.5 D-CL1–D-CL11 | 收口批决策表 | 结论已收敛入 §6（D-W4–D-W8）；逐条否决叙述属批次语境 |
| §3 文件中已退场模块（`activity-freeze.js` · `_subagentMap` · report preview / ticker 元素） | 旧结构名单 | 退场项已由 §5.1/§5.3 的现行机制取代 |

### 7.2 迁移期登记（**非**不并项——随批收口）

| # | 事项 | 现状 | 收口点 |
|---|---|---|---|
| 1 | 需求侧 `requirements/WEBVIEW.md` 内对本板块设计节的引用 | 已随本批翻转为同层/层前缀引用（`design/WEBVIEW*.md`） | 本批已收口 |
| 2 | `thincoder-vscode/docs/_archive/design/WEBVIEW.md`（归档址） | **原地一字未改**——参照历史（保留 ≠ 维护） | 产品树降格后随批处置 |
| 3 | `AGENT-LOOP（VSC 侧）` §10/§12/§14/§16（webview 族需求侧权威） | 未迁入基准层（统一面）——引用保持迁移期口径 | 统一面批次（`docs/core/requirements/AGENT-LOOP.md` 并入后翻转） |

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
| U-W9 | 模型 / 推理按钮忙态**禁用**（`disabled` + `aria-disabled`），进忙态关浮层 | 已定（§4.2 · D-W16） |
| U-W10 | 失败工具卡 = 红 + **保持展开** + 摘要含退出状态；成功面不拼 `(exit code 0)` | 已定（§4.3 · D-W18） |
| U-W11 | spawn 失败（无退出码）摘要 = 状态位本体（`→ (spawn failed)`）；三信号同形不改 | 已定（§4.3 · D-W19） |
| U-W12 | 未钉底时新块出生 = **区首计数钮**（`↓ N 新块`，点击回底）；不抢用户阅读位、不牵动 `#messages` | 已定（§5.5 · D-W27） |
| U-W13 | 中止后未结算工具卡 = 状态词「已中断」+ 摘要 `→ (interrupted)`（不套错误色；已结算卡零改写） | 已定（§4.5 · D-W32） |
| U-W14 | 工具结果截断 = 正文尾标记行 + 摘要尾部标注（端特有键 `tool.truncated`；恰 64K 与超出同判） | 已定（§4.5 · D-W38） |
| U-W15 | advisor 卡头 / 状态行 = CLI `roundTag` 逐字形 `(round N · model)`（无 model ⇒ `(round N)`） | 已定（§4.5 · D-W36） |
| U-W16 | 工具摘要 = CLI 标尺结构化分派（`N lines` / `N matches` / `N files` / `wrote N bytes` / `bash: <末行>`；成功面不拼 `(exit code 0)`） | 已定（§4.3 · D-W37） |
| U-W17 | 冻结块头注记 = `— <note>`（turn-cap / 停因 / `interrupted`）；error 面注记保留 | 已定（§5.2 · D-W39） |
| U-W18 | sync 运行块 ⏹ 可见（宿主确证可中止时；registry 不可读 ⇒ 降级为登记） | 已定（§5.2 · D-W40） |
| U-W19 | digest 计数行随 `n > 0`（两档同规）；ask-only 轮（`n = 0`）= 标签行在 ∧ 无计数行；ask 档标签携 `from` / `msg` | 已定（§5.1 · D-W35；F-UC8 批） |

## 9. 三档切面取舍（拆档决策 · 含否决备选）

> 本档与同板块另两档（`WEBVIEW-PROTOCOL.md` · `WEBVIEW-INPUT.md`）同源于 `thincoder-vscode/docs/design/WEBVIEW.md`（1867 行 > 500 硬限）——本节 = 该拆分**切面与取舍**的单源。

| 档 | 面 | 内容归属 |
|---|---|---|
| `WEBVIEW.md`（本档） | 结构与活动区 | 布局（垂直序 / grid）· 文件结构 · 交互组件与标题 · 活动块生命周期与投递 · 本板块机制决策（§6） |
| `WEBVIEW-PROTOCOL.md` | 消息协议 · 消息秩序与忙态 · 状态行与块头字段对位 | 消息族与演进纪律 · id 纪律与释放通道 · 收发面全量对表 · 字段与段位对位 |
| `WEBVIEW-INPUT.md` | 输入面 · 消息渲染契约 | 键位语义（Enter 等）· 输入历史与竖移 · 首块说明行 · Markdown 内联与转义 |

- **切面判据 = 读者面不同**（谁在何时读哪一档）——非按旧档节号、非按批序切。
- **否决备选**：① 拆**两档**——首档实测越 500 硬限（否决）；② 按**批序**切——各档无独立语义面、读者无法定位（否决）。
- 批次材料（逐处剔料清单 / 三档实迁行数 / 逐档不并项）= 迁移台账档 INVENTORY §9.2 + 各档「不并项与历史沿革」节（本档不复制——D2）。

## 10. 验收与需求回指

| # | 本档覆盖 | 回指 |
|---|---|---|
| 1 | 布局与活动区驻留（垂直序 · 区位置 · 空区零高 · 归档落流） | F-W1 · N-W2 |
| 2 | 流式跟随与滚动（消息区 pin · 区 pin · 块级跟滚 · 回底钮） | F-W2 · N-W3 |
| 3 | 历史懒加载（首窗 200 · `loadOlder` · prepend 补偿 · 归档块入锚） | F-W3 · N-W4 |
| 4 | 工具调用卡（卡片形态 · 卡体 64K 上限 · 恢复卡对齐） | F-W4 · N-W2 |
| 5 | 活动块可靠性（**出生面存活闸**（冻结键接管 · 不限角色族与 pool）· **非出生面禁静默** · 单投递队列（事件面 + 内容面）· 就绪/清屏后再断言 · **出生自愈心跳** · 终态补桩（含 tombstone 形）· 痕迹七类 + `panelDiag` 上行） | F-W1 · N-W5 · **F-A1 · F-A2 · F-A3 · F-A4 · F-A5 · NFR-A1 · NFR-A2 · NFR-A3** |
| 6 | 内容面投递（子代内容 chunk relay 前缀分流 → `sub:<role>#<id>` · 事件面/内容面次序 · 嵌套子标） | F-W1 · N-W5 |
| 7 | 机检面（新增档 ≤500 行 · 无 >300 字符单行 · 文档锚零悬空） | N-M3 · N-M2 |
| 8 | 权限卡族释放形态（逐项 / 合并 · 卡消失 · 零静默无效 · 释放即刷新（状态栏）） | F-W13 |
| 9 | 模型 / 推理按钮忙态门（禁用派生 · 入口守卫 · 试运行语义零改） | F-W14 |
| 10 | 工具卡失败信号与摘要（判据单源 · 产者两处：核 `thincoder-core/tools/bash.mjs` / 宿主 `thincoder-vscode/src/tools/shell.mjs` · 活卡/恢复卡同判据 · 摘要含状态位——族三成员：退出码 / 被杀 / spawn 失败） | F-W16 |
| 11 | 恢复面用户文本清洗（显示边界 · fail-closed · 盘面/机读线零触碰 · 标题源同源剥离） | F-W15 |
| 12 | 出生可见性（区 pin 旗标（`scroll` 事件）· 未钉底计数钮 · `:empty` 不回归） | N-W3 · **（出生面 / 视口面新增条目号待父侧落——建议文本：「活动区未钉底时新块出生 ⇒ 区首出现未读计数钮（`↓ ${n} 新块`）且不夺阅读位；点击 ⇒ 回底并清账」；实据 = 批档 §1.2 ④ · 判据 = T-A21–T-A23）** |
| 13 | 工具卡呈现增强（结算 / 清扫（M1）· 对象 chunk 归一（M3）· 轮次标签（X2）· 摘要单源（X3 · X7）· 截断提示（X5）） | F-W4 · F-W16 · 台账 #124 |
| 14 | 状态行 context 段单口径（M2） | 台账 #124（段位对位表 = `WEBVIEW-PROTOCOL.md` §6.1——本档不重述，D2） |
| 15 | 块头注记与 ⏹ 门控扩支 · digest 两档（X6 · X10 · X11 · M4） | F-A4 · F-W7 · 台账 #125 |
| 16 | 内容行合并粒度（CLI `pushBlock` 对齐 · 协议字段 `face` · RAW 拼接 + `pre-wrap` · 工具结果行面删净） | F-W1 · N-W5 · 台账 #148 |

**用例面**：本板块的测试资产在 `thincoder-vscode/test/`（`activity-flow` · `activity-closure` · `activity-live-ux` ·
`async-visibility` · `history-window` · `history-restore` · `session-boot`）——用例表归测试层，本档不复制（D2）。
**登记例外 1 条**：F-W4 活卡面（`toolCall`/`toolOutput`/`toolResult` 接收）现无专属用例
（缺口登记 = `requirements/WEBVIEW.md` N-W5，消解路径 + 到期条件在案）。

## 变更记录

- 2026-09-22（**structure-debt 批 · 档面车道（#163 尾账）· eng-designer**——承 `docs/batches/2026-09-22-structure-debt.md` §2.4 / §5（实施轮）+ 父侧派单）：
  §3 文件表 **+2 行**（`chat-messages.js` **234** / `chat-status.js` **124**——读数 + 面）+ `chat.js` 行收正（职责收窄为装配 / 全局键 / 握手 + `webviewReady` 坐标 `:426` → **`:147`** + 读数 **147**）+ 目录档数收正（**44 档模块**口径写明）；
  档内指称五处改指新档（§2 shell 句 `dismissLoadingScreen` 坐标 · §4.1 `permissionWithdrawn` 移除点 · §4.5 边界 `toolOutput` 标记 · §5.x 就绪握手坐标（webview 端 `chat.js:147` + host 端 `panel-messages.mjs:276`/`:288`）· D-W3 ⏹ 委托点 `:90` → **`:94`**）。**零语义**：协议 / 交互契约 / 决策零变。

- 2026-09-22（**hygiene-sweep 批 · 文档卫生轮 · eng-designer**——承 `docs/batches/2026-09-22-hygiene-sweep.md` §2）：§2 shell 结构句按现 `thincoder-vscode/webview/index.html` 重出——登记启动加载画面 `#loading-screen`（`:18-23`）+ `#chat-container`（`:24-92`）；
  §5.2 块头两坐标收正（`activity-view.js:42` `headerText` / `:90` `stateWord`）+ tail-3 行两坐标收正（`tailLines` :103 / `refreshBlock` :135-143）。
  **六档现读数**（口径 = `wc -l` · as-of 2026-09-22 实读）：`panel-callbacks.mjs` **307** · `activity.js` **450** · `chat.js` **454** · `suspension.mjs` **439** · `panel-subagent-relay.mjs` **270** · `panel-messages-turn.mjs` **215**。**零语义改动**（坐标与结构描述重出）。


- 2026-09-21（**块标题行对齐批 · eng-designer**——承 `docs/batches/2026-09-21-vsc-block-title-align.md` §1）：§5.2 状态区取值源**闭枚举**（结构化工具行 / 工具名 / `思考中…`）
  ——嵌套工具名 = `label/tool`（与 CLI `subagent-blocks.mjs:337` 同构）；**输出面零写入**；
  §5.6「不做」列表删旧句 + §4.4 标题链四环单源（指针 = `docs/core/design/SESSION.md` §6.7；源 / 写形 / 触发三面同步）。

- 2026-09-21（**块标题行对齐批 · D4 裁定轮 · eng-designer**——承 `docs/batches/2026-09-21-vsc-block-title-align.md` §2.11）：§5.2「tail-3 摘要」行收正——行文补 **`│ ` 前缀独立行**（与 CLI 同形——D4 消）+ 容器 = `<details>/<summary>` 原生注 + 坐标收正（`tailLines` :102 / `refreshBlock` :133-141——旧 `:86-96` 失指）。

- 2026-09-21（**块标题行对齐批 · 设计评审轮 1 修正** · eng-designer——承 `docs/batches/2026-09-21-vsc-block-title-align.md` §2.13 · 发现 4）：§4.4 标题链重基为**源 / 生成 / 触发 / 写 / 读·展示五环单源**（枚举与 `docs/core/design/SESSION.md` §6.7 同文；谓词 ∈ 源、时点 ∈ 写）。**零新语义**。


- 2026-09-21（**批 SUBAGENT-SIGNAL-LINES · 设计轮 · eng-designer**——承 `docs/batches/2026-09-21-subagent-signal-lines.md` §1 · 需求 `docs/core/requirements/AGENT-LOOP.md` §4.12 F-UC8；设计权威 = `docs/core/design/AGENT-LOOP-UPSTREAM.md` §6.27.12.13）：
  ① §5.1 **消化轮起跑档位**改写为按因两档（`tier` ∈ `ask` / `digest`——`auto` 泛句退场）+ 新增**ask 档携参**行（`from` / `msg`）+ 计数元素规则改 **`n > 0`**（两档同规；`n = 0` 零元素与 end 零动作不变）；
  ② §6 **D-W35** 同步（两档 + 携参 + 计数元素 `n > 0`）；§8 **U-W19** 同步（计数行随 `n > 0`）。
  **本档只记档位与元素约束**——元素级 / 载荷级单源 = `WEBVIEW-PROTOCOL.md` §3 / §5（D2）。

- 2026-09-20（**显示面消差批 · 批 4 收口轮 · eng-designer**——承 `docs/batches/2026-09-20-display-parity-batch.md` §2.11 未落面 / §5 批 1–2 实施记录 · 批 2 上抛设计档漂移面）：
  ① §3 文件表坐标收正（as-of 2026-09-20 收口轮实读）：`chat.js` 启动握手 `:423` → **`:426`**；`activity-view.js` 行四坐标重出（`refreshBlock` `:117` · `updateStopButton` `:150` · `noteChunk` `:179` · `tailLines` `:102`）；
  ② §5.3 痕迹面行 + D-W22 行数读数收正：`activity.js` 现 **450 行**（行计数口径 = `wc -l` / 含末行；as-of 2026-09-20 收口轮实读）；
  ③ 本批触碰六档实读行数（同口径 · as-of 2026-09-20 收口轮）：`panel-callbacks.mjs` **309** · `activity.js` **450** · `chat.js` **426** · `suspension.mjs` **430** · `panel-subagent-relay.mjs` **257** · `panel-messages-turn.mjs` **215**。

- 2026-09-20（**显示面消差批 · 批 4 条款落笔 · eng-designer**——承 `docs/batches/2026-09-20-display-parity-batch.md` §2.10.2 / §2.10.3 落地闸 · 逐子项携 token）：
  ① §3 文件表增 **`tool-summary.js`** 叶（摘要族迁出）+ 坐标收正（`chat.js:423` · `streaming.js:244` + 清扫面；as-of 2026-09-20 批 1 落地）；
  ② §4.3 增**摘要族单源与分派**（X3 · X7）+ 失败面摘要字面收正（`bash: ` 前缀）+ `WRAPPER`→`BASH_MARKER` 登记行改新坐标与新触发（`tool-summary.js` 下次扩面）；
  ③ 新增 **§4.5 工具卡结算与内容呈现**（M1 · M3 · X2 · X5）· **§4.6 状态行 context 段单口径**（M2）；§5.1 增**消化轮起跑档位**（M4）；§5.2 frozen 行 / ⏹ 行收正（X6 · X11 · X10——注记扩面 + 门控加 `syncLive` 支）· §5.3 ⏹ 判据句收正（X10）；
  ④ §6 增 D-W32–D-W40 · §8 增 U-W13–U-W19 · §10 增行 13–15（回指 = 台账 #124 / #125 · F-W4 / F-W16 / F-A4 / F-W7）。

- 2026-09-20（**显示面消差批 · 设计评审修正轮 1 · eng-designer**——评审 id=20 发现 #10（行数与坐标收口 · 含 as-of））：
  ① §2 布局 + §5.5 坐标收正（as-of 2026-09-20 实读）：`ui.js:460-463` → **`ui.js:442-445`**（`maybeScrollActivity` 实位——两处：§2 布局行 · §5.5 外层行）；
  §5.5 同句 `activity.js:109` → `:107` · `streaming.js:70` → `:63` · `ui.js:481-491` → **`ui.js:466-470`**（`watch` 闭包）。
  ② §3 文件表 `webviewReady` 坐标 `chat.js:413` → **`chat.js:411`**（实位 = `vscode.postMessage({ type: "webviewReady" })`）；D-W13 行数读数 474 → **473**（口径 = `wc -l` / 含末行）。
  ③ 行数实读（同轮同口径 · as-of 2026-09-20）：`ui.js` 473 · `chat.js` 411 · `activity.js` 434 · `activity-view.js` 182 · `streaming.js` 230（webview 面）· `suspension.mjs` 407 · `panel-callbacks.mjs` 272（宿主面）· `agent-turn.mjs` 343 · `suspension-drive.mjs` 316（CLI 面）。
  ④ 本批 11 子项条款（VSC 面）待落行 = **批 4**（`M1` `M2` `M3` `M4` `X2` `X3` `X5` `X6` `X7` `X10` `X11`）；须收正的既成条款行三处 = §5.2 ⏹ 行（`:188`）· §5.3 ⏹ 判据句（`:214`）· §5.2 frozen 行（`:185`）——收正方向与需求面连带（F-A4）= 批档 `2026-09-20-display-parity-batch.md` §2.10.2。

- 2026-09-20（**一致性同步批 · 设计评审修正轮 1 · eng-designer**——评审 id=13 发现 #9 / #10）：
  ① §5.2 补 **载体与读点**行（#118）：四字段的块级活态载体 = `block._subMeta.queueInfo`（`activity.js:88` / `:278` / `:307`），单一读点 = `headerText` / `stateWord`（`activity-view.js:38` / `:78-80`）——2 s 同点刷与覆盖式重建两路径同走该载体（无回落通道）——发现 #9；
  ② `activity.js` 行数两说收正到同一口径与 as-of：§5.3 痕迹面行 + D-W22 由 425 行改为 **434 行**（行计数口径 = `wc -l` / 含末行；as-of 2026-09-20）——发现 #10。

- 2026-09-20（**一致性同步批 · 条目 #118 · eng-designer**）：§5.2 queued 形态收正为**与 CLI 逐档一致**（状态词 ` · queued|waiting` + slot / wait / depc 三档状态区；载荷 `position` / `waiting` / `reason` / `kind`）；§5.3 存活投影载荷与 relay 面同形（重绘不丢原因）。

- 2026-09-15（**B 式迁移轮 · VSC 第 2 批**）：建档——`thincoder-vscode/docs/design/WEBVIEW.md` 内容按面重建入基准层三档（旧档一字未改、原地作参照历史；切面取舍见 §9）；坐标改写为仓根相对现状路径（全部按 as-of 2026-09-15 实核）；批次材料（问题陈述 / 方案选型 / 受影响文件 / 用例表 / 验收标准 / 边界 / 变更流水）入 §7.1。
- 2026-09-15：**源档与现状冲突 1 处按现状落笔**——旧档 §14 C-13 表「审批态 = 无此状态（子代理不经权限门）」与现行实现冲突：审批态块头（`⏸` + `等待审批: <tool>`）已实装（`activity-view.js:45` · `:75` · `activity.js:390`）——本档按现状落笔，冲突已上报批次（主 agent 裁定）。
- 2026-09-16（**子代理面板通道恢复批 · 内容中继面**）：§5.3 增「内容面投递」——子代内容 chunk（text / think / 工具行）经 relay 前缀文法端壳分流 → `toolPanel` `sub:<role>#<id>`（含嵌套子标；事件面/内容面次序）；§10 回指表增行（机检面行顺延为 7）。
- 2026-09-18（**VSC 会话界面接线修复批 · eng-designer**——承 `docs/batches/2026-09-18-vsc-session-wiring.md` §1）：§4 增四节——
  **§4.1 权限卡族释放形态**（合并卡同族 · 卡消失 · 零静默无效）· **§4.2 模型/推理按钮忙态门**（判据非 idle · 两入口守卫 · 与 D-P9 分工）·
  **§4.3 工具卡失败信号与摘要**（判据单源 `isToolFailure` · 活卡/恢复卡同判据 · 摘要含退出状态）· **§4.4 恢复面用户文本清洗**（显示边界剥离 · fail-closed · 落点判据）；
  §6 增 D-W15–D-W18 · §8 增 U-W8–U-W10 · §10 回指 +4 行（F-W13 / F-W14 / F-W16 / F-W15）；
  协议面（消息 / id 纪律 / 释放通道）= `WEBVIEW-PROTOCOL.md` §3 · §3.2 · §4.4 · §4.6（本档不重述——D2）。
- 2026-09-18（**同批评审修正轮 · eng-designer**——评审发现 1–8 + 端差登记）：§4.2 忙态判据句改「同经 `S._turnState` 派生的**独立谓词**」并点明与 Send / Stop（`=== "running"`——`webview/loading.js:56-57`）的差值；
  §4.3 判据项明载 `(killed: …)` **含用户中断值**（`bash.mjs:220-223`——父侧裁定：中断的命令确未完成 ⇒ 同判失败）+ 边界句补 `(stopped)` 不入判据集；
  §4.4 补**端差句**（本批只动端侧显示边界 ⇒ CLI 恢复渲染仍显 `[File: …]`）；§2 布局注悬空 `§5.6` → **`§5.5`** 收正。
- 2026-09-18（**同批修轮 · eng-designer**——父侧裁定带上批档 §2.6 #1 / #2 / #6）：§4.1 增「释放 ⇒ 状态栏刷新」判据（判据与刷新点 = `WEBVIEW-PROTOCOL.md` §4.4 · §4.6——本档不复述）；
  §4.4 增**消费面二处**（恢复面显示 + 标题源文本——`panel-session.mjs:262` · `:266` 同接同档剥离函数 ⇒ 标题不得由文件正文生成）；
  **§9 补「三档切面取舍」**（收正头注 / 本记录两处悬空 `§9` 引用——补节，判据见批档 §2.7）；D-W17 决策面补消费面第二处；§10 回指行 8 / 11 各补点（行数不变——11 行）。
- 2026-09-18（**同批收正轮 · eng-designer**——父侧裁定带上「交付面之外」五项，见批档 §2.9）：§4.1 释放形态坐标按实现轮实测重出（`chat.js:257-263`——原记 `:256-262`）；§4.4 标题源坐标同（`panel-session.mjs:264` · `:269`——原记 `:262` · `:266`）；两处标 as-of，上条记录所载坐标 = 该轮时点值。
- 2026-09-18（**工具失败判据同族残项批 · eng-designer**——承 `docs/batches/2026-09-18-tool-failure-spawn-form.md` §1）：§4.3 判据族增**第三成员 `(spawn failed)`**
  （`thincoder-core/tools/bash.mjs:183-190` spawn 错误分支补状态位——进程未启动无退出码，禁伪造）+ 状态位族闭集句 + 两端同读句（CLI `bash: (spawn failed)`，端侧零改）
  + 边界句（判据只认状态位、不认产者措辞）+ 形态可达性两则；§6 增 D-W19 · §8 增 U-W11 · §10 行 10 补词（行数不变——11 行）。
- 2026-09-18（**同批评审修正轮 · eng-designer**——评审 id=118 发现 1–6 逐号落地）：§4.3 **产者面收正**——本端卡面真产者 = 宿主
  `thincoder-vscode/src/tools/shell.mjs`（核 `bash.mjs` 形态在本端无产者；族三成员两端同字面）+ **退出码槽只接受数字**（非数字退出码槽不入判据）
  + 「摘要零影响」句收窄到无输出形；§6 D-W19 补产者两处与「不改判核/CLI 面收口」否决；§10 行 10 补产者坐标。
- 2026-09-18（**面板 live 块出生可靠性面 · eng-designer**——承 `docs/batches/2026-09-18-init-block.md` §1 讨论与需求档 `requirements/WEBVIEW.md` F-A1–F-A5 / NFR-A1–A3）：
  §5.3 增四节——**出生自愈心跳**（2 s 拍 · 幂等契约 · 源新鲜度）· **投递面全量留痕**（四处置）· **webview 痕迹与上行**（新档 `webview/activity-diag.js`（拟新增）
  + 协议行 `panelDiag`）· **终态必现**（tombstone 扩形 + consult / escalate 射程登记）+ 清屏可恢复句；§5.1「诊断痕迹」行改指新档；
  §6 增 D-W20–D-W24 · §10 行 5 回指补 A 族（行数不变——11 行）。协议侧登记 = `WEBVIEW-PROTOCOL.md` §3.2 行 8（只增不改）。
- 2026-09-19（**VSC 子代理 live 块可见性批 · eng-designer**——承 `docs/batches/2026-09-18-vsc-subagent-live-visibility.md` §1（专项审计 id=128 七条 + 用户 2026-09-19 00:08「全修」）与 `docs/batches/2026-09-18-init-block.md` §1.7 移交件）：
  §5.3 **键文法单源 + 键形收正**（consult / escalate 端侧键 = `sub:<role>#<id>`，不含模型段——旧「键含模型段」判定作废）· **出生面存活闸**（冻结键接管 · 建块不限角色族 / `pool`——①②③）· **非出生面禁静默**（`drop-frozen` / `drop-tombstone`——⑦）·
  **内容面并入单投递队列**（就绪门 + 队列 + 溢出丢最旧——⑤）· **痕七类 + `onToolResult` 第 4 参对位**（⑥）· 终态补桩**射程含 consult / escalate**（覆旧登记）· 窄缝族⑥逐条裁并；
  §5.5 增**出生可见性**（`scroll` 旗标 + 未钉底计数钮——④）；§6 增 D-W25–D-W31 · D-W10 / D-W23 就地收正 · §8 增 U-W12 · §10 行 5 扩写 + 新增行 12；
  §5.3 用例表扩 **T-A16–T-A32**（逐条含先红形态）；§5.1 生命周期表出生 / 幂等两行同步收正。
- 2026-09-19（**同批设计评审修正轮 · eng-designer**——评审 id=130 发现 1–12 逐号落地；fix 轮，零新扇面）：§5.1 补桩行 / §5.3 终态补桩**状态表**（名与前置收正——`FAMILY_ROLES` 补桩前置退场、射程含 consult / escalate）；
  §5.3「工具结果行」与「第 4 参对位」两说合一（`onToolResult` = 分流补 + 第 4 参消费两件——2026-09-19 实核）；内容面正收据落事件名 `ev:subcontent`（载荷 `{ ch, face }`——不并入 `ev:subdeliver`，五处置计数零改）；
  §5.5 计数钮**落档登记**（新档 `thincoder-vscode/webview/activity-new.js`（拟新增））+ 文案落 locale 键 `sub.newBlocks`；D-W24 补落点坐标（`panel-session.mjs:74`）；D-W13 行数读数收正（`ui.js` 474——2026-09-19 实读）；
  §10 行 12 悬空指针改内嵌建议文本（新增条目号仍待父侧落）；T-A12 退场标记化 · T-A27 触发面收窄（`drop-unknown-role`）。
- 2026-09-20（**库存清账批 · 台账 #129 G-2 · eng-designer**——承 `docs/batches/2026-09-20-residual-sweep-batch.md` §2）：§5.3 / §5.5 / D-W22 四处「（拟新增）」标记撤除（`webview/activity-diag.js` / `webview/activity-new.js` 已落地——与姊妹档 `WEBVIEW-PROTOCOL.md` 同形）。**零新语义**。
- 2026-09-20（**渲染粒度对齐批 · eng-designer**——承 `docs/batches/2026-09-20-render-granularity-batch.md` §1 / §2）：新增 **§5.6 内容行合并粒度**（CLI `pushBlock` 对齐——tool 面按「工具名 + `sub` 同」并入末行、RAW 零分隔符 + `pre-wrap`；text / think 面两端同构零改；降级 = 无 `face` 恒新行）；
  §5.3 内容面**面集收正为四面**（`toolResult` 面删净——无产者，证据链同节）· §10 回指 +1 行（行 16）。**协议消息名零变**（字段增 `face`——`WEBVIEW-PROTOCOL.md` §3 / §3.2 行 3）。
- 2026-09-20（卫生族三批 · 台账 #145 · eng-designer）：D8 划改/修订式残句清理（2 处去划改形保裁定 + 2 处去修订框架/删残句）；**零新语义**。
- 2026-09-20（**扩面族批 · 台账 #150-B · eng-designer**）：§5.6 补端差登记句（CLI 首条 ``toolOutput`` 并入调用块 ∥ 本端面门 2 段——视觉等价 ⇒ 维持 R3 面门）。**零新语义**。
