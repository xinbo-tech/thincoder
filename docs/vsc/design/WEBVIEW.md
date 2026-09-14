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
- **活动区独立 pin**（`thincoder-vscode/webview/ui.js:460-463` `maybeScrollActivity`）——与消息区**互不拉扯**（两层状态独立——§5.6）。
- shell 结构（`thincoder-vscode/webview/index.html:14-63`）：`#chat-container` 内含 `#session-bar` / `#messages` / `#subagent-activity` /
  `#panels`（goal、task 两个行面板）/ `#toolbar` / `#settings-panel`（dialog）/ `#welcome-panel`（首次运行 onboarding）。
- `#toolbar` 内 = `#status-line` + `#input-row`（attach / send / abort）+ `#paste-bar` + `#controls-row`。
- 注入占位：CSS 五档经 `__CSS_*_URI__`、模块脚本经 `__CHAT_URI__`、CSP 经 `__CSP__`（`index.html:6-11` · `index.html:83`）。

## 3. 文件结构（现行）

`index.html`（shell——CSP 注入 + CSS/JS URI 占位）→ 前端模块（`thincoder-vscode/webview/`，45 档）：

| 模块 | 职责 |
|---|---|
| `chat.js` | 编排层：状态/事件/消息路由/模型选择/历史/设置；`window.message` 派发中枢；启动握手 `webviewReady`（`chat.js:413`） |
| `streaming.js` | token/reasoning 流式渲染（rAF 节流 + ≥50ms 重排门——`streaming.js:34` · `:42-45`）+ 回合收尾 + advisor/子代理块路由（`subagentChunk` `:245`）+ code-block 复制按钮 |
| `ui.js` | DOM 构造（欢迎页/气泡/工具卡/advisor 块/loading 态）+ 滚动族（`scrollDown` / `maybeScrollDown` / `maybeScrollActivity` / `initScrollFollow` / `trimOldMessages`）——leaf：不 import `state.js` |
| `md.js` | markdown 渲染（`md()` `:67` · 内联引擎 `inline()` `:34`——契约见 `WEBVIEW-INPUT.md`） |
| `state.js` | 单一 UI 状态 `S`（`:71`）+ DOM 引用 `ctx`（`:19`）+ `vscode` 桥 |
| `activity.js` | 活动块编排层：出生/接管/补桩/折叠/归档/重置 + 块级跟滚（§5 契约） |
| `activity-view.js` | 呈现叶：块头/状态词/折叠 tail/⏹ 与取消控件（`refreshBlock` `:101` · `updateStopButton` `:132` · `noteChunk` `:161` · `tailLines` `:86`）——leaf：i18n only |
| `panels.js` | goal/task 行面板 + 挂起态 + 桥路由（`handleSubagentMessage` 纯转发 `applySubagentStatus`）；`_panelTimer`（2s）同点刷 live 块头（`panels.js:69-70`） |
| `send.js` / `loading.js` | 输入门（`send()` `send.js:12` · busy 拒发 `:19-24`）/ 忙态与按钮可见性（`loading.js:56-57`） |
| `input.js` / `autocomplete.js` / `toast.js` | 输入面（keydown 全族——`WEBVIEW-INPUT.md`）/ @ 补全与图片粘贴 / 瞬时提示共享模块 |
| `permission.js` / `question.js` | 权限弹窗与批确认 / 内联 question 卡 |
| `diff.js` · `tool-card-restore.mjs` | diff 预览（apply_patch）/ 恢复会话的工具卡折叠语义 |
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

## 5. 子代理活动块与活动区

子 agent / consult / escalate / advisor-async 的活动块**出生即 append 到固定活动区 `#subagent-activity` 区尾**（`thincoder-vscode/webview/activity.js:108`），在消息区与输入区之间——**live 固定可见，不随会话流滚动丢失**。

### 5.1 生命周期（出生 → live → 终态 → 归档）

两态机（live → frozen）**不变**；`awaitingDigest` 是冻结态上的**单标志**（非第二状态机）。终态去向由调用方定：

| 段 | 事件 | 动作 | 锚 |
|---|---|---|---|
| 出生 | `started`（池条目 `pool: true`）| 建块 append 区尾（区钉底 + 块级跟滚监听接入） | `activity.js:108-111` |
| live | chunk / turn 帧 / 审批态 | 覆盖式刷新头词与状态区（不重挂元素） | `activity.js:290-307` |
| 折叠 | 终态 | class `sub-live`→`sub-frozen` + `open=false` + ⏹ 移除 + 头词换 | `activity.js:176-188` |
| 准终态 | `settled` | 折叠 + `awaitingDigest` 驻留（块**不移动**） | `activity.js:356-358` |
| 归档 | 消化回收 `done` 命中 awaiting 块 | `insertBefore(块, 本轮边界)`（CLI 序：块在 digest 文本前） | `activity.js:196-206` |
| 归档 | 其余终态（`done`/`error`/运行中 `cancelled`/`terminated`/`failed`/`answered`） | 折叠 + 即时归档（尾追 `#messages`） | `activity.js:322-361` |
| 取消 | `cancelled` 且 `was: "queued"`（从未启动） | 头移除（不冻结） | `activity.js:310-320` |
| 幂等 | 迟来消息命中已冻结/已移除条目 | `ensureBlock` 返 `null`——丢弃，不复活不重建 | `activity.js:144-155` |
| 新代接管 | `started` + `pool: true` 命中同名**已冻结**键 | 建新块改绑键 + 记 `takeover`；旧 awaitingDigest 块即时归档 + 新块记 `oldReclaimPending` | `activity.js:162-171` |
| 补桩 | never-born 终态（无 map 条目） | 按成员表补出**已折叠**桩 + 立即归档 + 记 `late-terminal-stub` | `activity.js:235-244` |
| 会话退出 | `suspension active:false + freeze:true` | 区**全体**归档（live → 折叠；awaiting → 归档；已在流者不动） | `activity.js:404-410` |
| 重置 | 回合中止（无挂起会话）/ 会话清 | `resetActivity` **只清区子树**（+ 清 map + 区内孤儿防御清）——流内归档块（会话历史）不动 | `activity.js:415-424` |

- **归档落点二值**（`activity.js:196-206`）：① 消化回收且本轮边界 `S._digestBoundary` 有效（`isConnected`）→ 边界之前；② 其余（普通终态 / 补桩 / 会话退出 flush / 边界失效 / 无边界）→ `#messages` 尾追。同批多块 = 消息到达序；幂等 = 已归档（`parentNode === messagesEl`）即 no-op。
- **消化回收（host 侧）**：`thincoder-vscode/src/extension/suspension.mjs:95-101`（`reclaimDigestedBlocks`）对该轮已消化条目逐条补发 `{type:"subagent", status:"done"}`——**直投不入队**（非出生事件，属收尾通知）。
- **终态补桩成员表**（`activity.js:211-230` 判定 + `:365-373` 调用；前置 = `role ∈ FAMILY_ROLES` 且 `id != null` 且频道名合法，不满足 → no-op + 记 `drop-unknown-role`）：

| status | 上下文 | 无块时 | 折叠 kind |
|---|---|---|---|
| `done` / `settled` | — | 补桩（折叠 + 立即归档） | done |
| `error` / `failed` | — | 补桩 | error |
| `cancelled` / `terminated` | `was ≠ "queued"`（含 `was` 缺省） | 补桩 | stopped |
| `cancelled` | `was === "queued"`（从未启动） | 不补（no-op） | — |
| `answered` | — | 不补（有块折叠、无块 no-op——回复走 digest 呈现） | — |
| 前置不满足 | role 不明 / 非 family（consult · escalate）/ id 缺失 / 非法频道 | 不补（no-op） | — |

- **旧代回收吞守卫**（`activity.js:331-340`）：接管归档时旧块若在 awaitingDigest（回收在途）→ 新块记 `oldReclaimPending`，其后该键**首条 `done` 视为旧代回收 → 吞**（no-op + 清标志）。残余登记：旧代回收永不至（abort 等）× 新代 `done` 后至 → 可能误吞一次（降级 = 新块滞留区，会话退出 flush 兜底归档——不丢内容）。
- **诊断痕迹**：`S._subTraceLog`（`state.js:88`；环形末 `SUB_TRACE_MAX = 50` 条——`state.js:125`）记三类（`takeover` / `late-terminal-stub` / `drop-unknown-role`），单一写点 = `activity.js:71`；范围 = **出生事件面**（同名接管 / 无块终态补桩 / 未知·非法 role 丢弃）。

### 5.2 块头与状态词（形态与字段）

块头为一行方括号 + 状态词（`activity-view.js:36` `headerText` / `:74` `stateWord`）：

- **live**：`[▶ key · sync/async · model · Ns · turn N/M]` + 状态词（结构化工具行 `${tool} — ${cmd ≤60}` / 工具文本尾句 / 思考中）。
- **queued**：`[⏳ key]` + 排队信息（slot → `排队中 · 位置 N（槽满等位）`；依赖/冲突等位 → host detail 原文）。
- **frozen**：`[✓ key · … · done Ns · turn N/M]`（stop → `⏹` + `stopped Ns`；error → 错误注记随头）。
- **awaitingDigest**：括号去 verb（`[✓ key · … · Ns]`）+ 态词 `done · awaiting digestion`。
- **审批态**（live）：`⏸` 覆盖 `▶` + 态词 `等待审批: <tool>`（子代理 child ask 在途——`activity-view.js:45` · `:75`；清态（`tool: null`）即回落；终态不覆盖图标）。
- **⏹ 覆盖按钮**（`activity-view.js:132-157`）：live + `running` + `pool === true`（停止）或 `queued`（取消排队）且 role ∈ family 时可见；标签与 title 两动作区分；冻结块随 fold 移除。
- **tail-3 摘要**（`activity-view.js:86-96`）：折叠态（frozen 或 `open=false`）在头下附末 3 条非空内容行（首尾各 200 字符截断）——射程 = `.advisor-content` 的**子元素**（`.sub-desc` 不在内）。
- 逐字段端差对位（CLI 面板行 × 本端）与 i18n 键表 = `WEBVIEW-PROTOCOL.md`（本档不重述）。
- **首块说明行**（`.sub-desc`——一次性新用户说明）：`activity.js:101-107`（`S._subDescShown` 置位，`state.js:42`），文案 = locale 键 `sub.desc`；契约见 `WEBVIEW-INPUT.md`。

### 5.3 出生投递与块身份（可靠性）

块的身份键 = 频道名 `sub:<role>#<id>`（契约不变——`activity.js:139-143`）；单 map 单守卫 = `S._subBlocks`（`state.js:84`）。
**投递链三面**：

- **投递队列（host）**：`panel._wvOutbox`（数组，上界 200——溢出丢最旧 + 留痕），任务可见性族消息经 `postSubagentEvent` 投递——`panel._wvReady === true` 直投，否则入队；`logEvent("ev:subdeliver", …)` 记入队/出队/丢弃计数（`thincoder-vscode/src/extension/panel-callbacks.mjs:26-48` · `:133`）。
- **就绪握手（两拍）**：webview 起手投 `webviewReady`（`chat.js:413`）→ host case（`thincoder-vscode/src/extension/panel-messages.mjs:428-460`）置 `_wvReady = true`，**排在** `openSessionContent`（内部含 `clearMessages` + `resetActivity`）**之后**执行 ① flush 队列（保持入队序）→ ② `reassertLiveChildren`（`:457-458`）。后置理由：先投的出生事件必被清屏抹掉。
- **存活投影**：`thincoder-vscode/src/extension/suspension.mjs:131-148` 读 `panel._liveLines ?? panel._susp?.lines` 的 `_asyncSubagents` / `_asyncAdvisors`（与 ⏹ 路由同源），**只发 live**——`running` → `started` + `pool: true`，`queued` → `queued`（两侧 role/id 必带）。

**同族配套（非上述三面）**：

- **清屏后再断言**：`loadSession`（`thincoder-vscode/src/extension/panel-session.mjs:133-166`）在 `clearMessages`（`:157`）与 `historyPage`（`:160-161`）**之后同 tick** 调 `reassertLiveChildren`（`:165`）——重建块恒落区尾。
- **未就绪窗口**：webview 重载 / 渲染崩溃且 view 未 dispose 时池存活（`retainContextWhenHidden: true`——`thincoder-vscode/src/extension/chat-panel.mjs:119`）；view dispose → `_wvReady = false` + 清队（`chat-panel.mjs:127`），跨 view 不串味。
- **不复活面**：`postPoolSnapshot` / `SNAPSHOT_ROLES`（池行快照）与行面板已退场，**不得静默复活**；补发对象 = 任务存活事件（复用既有 `subagent` 载荷形状），非池行快照。

### 5.4 150 窗与懒历史

- **DOM 窗上限 150 块**：`thincoder-vscode/webview/ui.js:468`（`MAX_MESSAGE_BLOCKS`）+ `trimOldMessages`（`:469-476`）——计数选择器含 `.message` / `.tool-call` / `.advisor-block` / `.sub-block`（**归档块随窗出窗**）；区驻留块不在其容器，不计。
- **懒历史锚**：`thincoder-vscode/webview/history.js:29`（加载指示插位）与 `:56`（分页 prepend 锚）选择器同含 `.sub-block`——归档块与懒历史页共存时插位正确。
- **分页**：首窗 = 末页（`older=false`）+ `hasOlder`；`scrollTop ≤ 40` 触发 `loadOlder`（`history.js:87`）；prepend 后按 `scrollHeight` 增量补偿 `scrollTop`（`:57-61`）。页大小常量 = `thincoder-vscode/src/extension/history-window.mjs:22`（`HISTORY_PAGE_SIZE = 200`——跨端首窗对齐）。
- 归档块**不补 `data-idx`**（不出现在历史回填中——登记项）。

### 5.5 live 块跟滚与内容区高度

两层独立、互不写对方状态：

- **外层 = 区 pin**（`ui.js:460-463`）：块出生（`activity.js:109`）与流式帧（`streaming.js:70`）调用；近底 24px 判据、上滚解 pin、回底重 pin（`ui.js:481-491`）。块出生**不再牵动** `#messages` 滚动。
- **内层 = 块内容区跟滚**（`activity.js:120-136`）：`initBlockFollow` 给 `.advisor-content` 挂 `wheel` / `touchmove`（passive）监听写 `内容区._pinFollow`；`maybeScrollBlock` 在 rAF 尾逐块应用——`open=false` 或 `!isConnected` → no-op，默认钉底写超值（不读 `scrollHeight`）。
- **帧驱动**（`thincoder-vscode/webview/streaming.js:32` · `:44` · `:64-67`）：`subagentChunk` 追加后把块记入脏集 `_subScrollDirty`，`scheduleStreamRender` 的 rAF 体内逐块 `maybeScrollBlock` 后置空；**节流重排条件含脏集**（跳过的帧不得丢跟随）。
- **高度**：`.advisor-block.sub-block .advisor-content` = **60px**（`thincoder-vscode/webview/chat.css:468`）；基础 `.advisor-content` = 100px（`chat.css:318`，流内 advisor 评审块维持）。
- **登记**：流内 advisor 块（`S._advisorBlock`）内容区为裸钉底（无让位语义——`streaming.js:57-63`），与块级跟滚不同面。

## 6. 关键决策记录（含否决备选）

| # | 决策 | 否决备选 / 理由 |
|---|---|---|
| D-W1 | 活动区容器居 `#messages` 与 `#panels` 之间；空区 CSS `:empty` 零高（零显隐 JS） | 否决常驻空面板（占高）· 否决「有 live 才现」（需层状态） |
| D-W2 | 区高度自适应 + 32vh 封顶 + 区内自滚 + pin 跟随 | 否决固定高（单块白占）· 否决不封顶/不 pin（挤死会话区 / 新块不可见） |
| D-W3 | ⏹ 单委托点迁区（`chat.js:90` 挂 `ctx.activityEl`，空安全绑定） | 否决双委托（`messagesEl` 残留死码） |
| D-W4 | 终态去向 = **消化后归档落流**（轮边界插入；失效退化尾追） | 否决旧 DOM-move 锚链（§7 退场名单）· 否决折后移除（内容不可读）· 否决一律尾追（序反 CLI——仅作降级路径） |
| D-W5 | `awaitingDigest` = 冻结态上的**单标志**驻留（CLI 行形态头词） | 否决第二状态机（旧驻留双态）· 否决 settled 即时折叠（用户点名缺口） |
| D-W6 | 区保留上限退役（`MAX_REGION_FOLDED` / `enforceRegionCap` 已删） | 新语义下无折叠块常驻——上限成死码 |
| D-W7 | `resetActivity` 只清**区子树** | 否决全域清扫（会删流内归档块 = 会话历史） |
| D-W8 | 会话退出 = 区**全体**归档（flushing 兜底） | 否决仅 live 折叠（awaiting 块悬空驻留） |
| D-W9 | 出生事件队列化 + 就绪/清屏后再断言（**只带 live 条目**） | 否决逐处门控（未知路径防不住）· 否决扩 settled 重建（与已撤池快照同族） |
| D-W10 | 终态补块限 family 角色 + 合法 id（成员表） | 否决无条件建块（未知 role 的块无法解读）· 否决 answered / queued-cancel 补桩（既有裁决） |
| D-W11 | 频道名 `sub:<role>#<id>` 与 chunk 路由契约**不变** | 否决加代际后缀（连带改频道命名/子标挂载/CLI 面板路由） |
| D-W12 | 队列上界 200 + 溢出丢最旧 + `ev:subdeliver` 留痕 | 否决无界队列（暗窗口内存无界） |
| D-W13 | 块级跟滚载体落 `activity.js`（旗标 + wheel/touch 让位 + rAF 帧应用） | 否决内联裸钉底（无让位）· 否决几何派生（新造模式）· 否决 `ui.js` 滚动族泛化（状态模型不符 + `ui.js` 492 行近硬限） |
| D-W14 | 高度 60px 作用于 `.sub-block` 全部（live + 冻结同卡面） | 否决仅 `.sub-live`（冻结展开态须同卡面）；advisor 流内块维持 100px |

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
| 2 | `thincoder-vscode/docs/design/WEBVIEW.md`（旧档） | **原地一字未改**——参照历史（保留 ≠ 维护） | 产品树降格后随批处置 |
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

## 9. 体量与拆分规划（R24a）

**实测行数**：本档 **262 行**（新建 · 终稿实核）——低于 300 行软线，**无需拆分**。

**拆分来源**（本档何以与其同胞两档分家）：源档 1867 行（超 500 硬限）按面拆三档——取舍理由：

| # | 切面 | 取舍理由 |
|---|---|---|
| 1 | 本档 = **结构与活动区面**（定位 / 布局 / 文件结构 / 组件 / 活动块与活动区 / 块头形态） | 这四节互相回指最密（布局 ↔ 活动区容器 ↔ 块出生地 ↔ 滚动族）——同档内引用免跨档跳转 |
| 2 | `WEBVIEW-PROTOCOL.md` = **协议与秩序面**（消息族 / 秩序 / 忙态 / digest / 状态行） | 面 = 「wire 契约」；读者 = 改 host 发射端或 webview 接收端的人——与结构面读者不同 |
| 3 | `WEBVIEW-INPUT.md` = **输入与渲染面**（Enter / 输入历史 / 说明句 / markdown 转义契约） | 面 = 「用户输入进 / 助手输出出」两个端点；两者都以纯函数/事件契约为形，且都以测试档直驱（happy-dom / 纯函数） |

否决备选：① 两档（布局+活动块 ∥ 协议+输入）→ 第一档实测超 500 硬限；② 按批序切（一批一档）→ 批次材料本就剔除，切出的档无独立语义面。

## 10. 验收与需求回指

| # | 本档覆盖 | 回指 |
|---|---|---|
| 1 | 布局与活动区驻留（垂直序 · 区位置 · 空区零高 · 归档落流） | F-W1 · N-W2 |
| 2 | 流式跟随与滚动（消息区 pin · 区 pin · 块级跟滚 · 回底钮） | F-W2 · N-W3 |
| 3 | 历史懒加载（首窗 200 · `loadOlder` · prepend 补偿 · 归档块入锚） | F-W3 · N-W4 |
| 4 | 工具调用卡（卡片形态 · 卡体 64K 上限 · 恢复卡对齐） | F-W4 · N-W2 |
| 5 | 活动块可靠性（投递队列 · 就绪/清屏后再断言 · 新代接管 · 终态补桩 · 痕迹） | F-W1 · N-W5 |
| 6 | 机检面（新增档 ≤500 行 · 无 >300 字符单行 · 文档锚零悬空） | N-M3 · N-M2 |

**用例面**：本板块的测试资产在 `thincoder-vscode/test/`（`activity-flow` · `activity-closure` · `activity-live-ux` ·
`async-visibility` · `history-window` · `history-restore` · `session-boot`）——用例表归测试层，本档不复制（D2）。
**登记例外 1 条**：F-W4 活卡面（`toolCall`/`toolOutput`/`toolResult` 接收）现无专属用例
（缺口登记 = `requirements/WEBVIEW.md` N-W5，消解路径 + 到期条件在案）。

## 变更记录

- 2026-09-15（**B 式迁移轮 · VSC 第 2 批**）：建档——`thincoder-vscode/docs/design/WEBVIEW.md` 内容按面重建入基准层三档（旧档一字未改、原地作参照历史；切面取舍见 §9）；坐标改写为仓根相对现状路径（全部按 as-of 2026-09-15 实核）；批次材料（问题陈述 / 方案选型 / 受影响文件 / 用例表 / 验收标准 / 边界 / 变更流水）入 §7.1。
- 2026-09-15：**源档与现状冲突 1 处按现状落笔**——旧档 §14 C-13 表「审批态 = 无此状态（子代理不经权限门）」与现行实现冲突：审批态块头（`⏸` + `等待审批: <tool>`）已实装（`activity-view.js:45` · `:75` · `activity.js:390`）——本档按现状落笔，冲突已上报批次（主 agent 裁定）。
