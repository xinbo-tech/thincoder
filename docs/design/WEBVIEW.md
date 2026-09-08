# ThinCoder VS Code Webview 前端与消息协议（WEBVIEW）

> 板块：VSC 独有 webview 前端（CLI 无对应板块——CLI 前端为裸 ANSI TUI，webview 隔离
> iframe 是其对偶形态，两者不镜像、互不指）。
> 来源：自 `ARCHITECTURE.md` §11（webview 布局/文件结构/活动面板/组件/标题）与 §12
> （webview↔extension 消息协议）迁出重组（DOC-REORG-VSC 第 7 批——2026-09-08）。
> 状态：当前态。约束：纯 `.mjs`、零 npm 运行时依赖、VS Code API + Node 标准库。

## 1. 定位与职责边界

webview 是扩展主机的 UI 适配层，**只负责 UI 渲染与用户交互**；agent 循环与工具执行
在 extension host。两者经 `postMessage` **单向通信**（webview 为隔离 iframe——只经
postMessage，无共享状态）。UI 状态在 webview 端单一持有（`webview/state.js`）；
会话/Provider/工具等状态在扩展端（`src/extension/`、`src/agent.mjs`）。

## 2. 布局（垂直序 + grid）

**垂直序（自顶向下）**：session-bar（项目/会话切换）→ `#messages` 滚动区 → 行面板区
（`#subagent-panel`/`#goal-panel`/`#task-panel`）→ 输入区（`#toolbar`）。子代理活动块
**无独立面板**——live 块出生即在 `#messages` 流内（B1——SESSION-FLOW-B F-B1a/F-B1b，
R22 底部活动面板容器已拆）。

CSS 布局规则落 `webview/base.css` 的 grid 行模板：

```
#chat-container { grid-template-rows: auto minmax(0, 1fr) auto auto; height: 100%; }
```

行模板对应 B1 垂直序：header(session-bar) / `#messages`(1fr) / `#panels`(行面板，
auto) / `#toolbar`(输入，auto)——后两层均 auto，隐藏项不占高 → 消息区高度 = 容器 −
面板 − 输入（grid 1fr 自动吸收）。

- 消息区钉底/滚动语义限定 `#messages` 内；`#messages` `overflow-y:auto` +
  `overscroll-behavior:contain`。
- 子代理 live/冻结块均为 `#messages` 直接子元素（与 `.message` 兄弟同层——150 块
  裁剪只数直接子元素）；live 块内容在块内自滚（`.advisor-content` max-height
  100px——增长天然有界）。

shell 结构 `webview/index.html`：`#chat-container` 内含 `#session-bar` / `#messages` /
`#panels`（三个行面板）/ `#toolbar`（`#status-line` + `#input-row`(attach/send/abort)
+ `#paste-bar` + `#controls-row`）+ `#settings-panel`（dialog）+ `#welcome-panel`
（首次运行 onboarding）。CSS 经 `__CSS_*_URI__` 占位注入，`__CHAT_URI__` 注入模块
脚本，CSP 经 `__CSP__` 占位注入。

## 3. 文件结构（现行）

`index.html`（shell——CSP 注入 + CSS/JS URI 占位）→ 前端模块：

- `chat.js`（编排：状态/事件/消息路由/模型选择/历史/设置——`window.message` 派发中枢）
- `streaming.js`（token/reasoning 流式渲染 rAF 节流 + 回合收尾 + advisor/子 agent
  块路由 + code-block 复制按钮）
- `ui.js`（DOM 构造：欢迎页/气泡/工具卡/advisor 块/loading 态——leaf：不 import
  state.js）
- `md.js`（markdown 渲染）、`state.js`（单一 UI 状态 `S` + DOM 引用 `ctx` + `vscode`
  postMessage 桥）
- `activity.js`（R22 活动块生命周期/冻结/elapsed ticker——leaf：只依赖
  state/ui/i18n；与 panels/streaming 双向无环）
- `panels.js`（子代理/目标/任务行面板 + 挂起态；行面板 bookkeeping 与活动块解耦）
- `send.js`/`loading.js`（输入门 + 永不锁挂起分支）、`mode-buttons.js`（ENG/GUARD/
  AUTO/PLAN 按钮）
- `permission.js`/`question.js`（权限弹窗/批确认/question 卡）
- `diff.js`、`settings-*.js`、`model-picker.js`/`model-menu.js`、`history.js`（懒历史
  滚动）、`autocomplete.js`、`search.js`、`scroll.js`、`status-bar.js`、
  `i18n.js`/`i18n-dom.js`、`session-bar.js`、`onboarding.js`、`highlight.js`、
  `input.js`、`lib.js`
- CSS = `base.css`/`chat.css`/`controls.css`/`session.css`/`settings.css`

本端接线（实现为唯一事实源——AGENTS.md 模块图 webview 行为维护寄存器）。extension
端对应：`chat-panel.mjs`（面板生命周期/消息路由）、`panel-*.mjs`（消息处理分模块）、
`suspension.mjs`（挂起驱动）、`permission-gate.mjs`（权限门）。

## 4. 消息流（基本回合）

```
用户输入 → chat.js:send() → postMessage { type:"userMessage", text, model,
reasoning, provider, images? } → extension _chat()
  → setupAgentRun（user 尾追加 "[Attached images: …]" 指针）→ runAgent()
  → onToken → { type:"token", text }
  → onReasoning → { type:"reasoning", text }（Thinking… 折叠块）
  → onToolCall/onToolResult → { type:"toolCall"/"toolResult", name, args/text }
  → onComplete → { type:"complete" }
```

中断/错误/后台态消息见 §7。回合外流（子代理活动/评审流/压缩状态/挂起状态）走
toolPanel/subagent/compress/suspension 消息族（§7）。

## 5. 子代理活动块（流内出生 · 原地冻结——B1 现行机制）

子 agent/consult/escalate/advisor-async 活动块**出生即在对话流**（`#messages` 流尾——
流级独立块，与 `.message` 兄弟同层，非嵌入父段）；终态**原地冻结折叠**（无 DOM move
——位置 == 出生位，N3 不变式）。角色全同通道（频道名差异仅块键/折叠归属）。

- **live 块（#messages 流内）**：live 头 = 状态词 + key（= 频道 label——channel 去掉
  `sub:` 前缀）+ sync/async 标 + model + 1s 本地 ticker elapsed + （终态通知前无 turn
  段）+ ⏹（仅 running 且仅池条目——started 事件 `pool: true` 标记区分同步 spawn）；
  当前工具/等待审批 + tail 3 行 dim 摘要。出生即钉底（maybeScrollDown——pinBottom
  语义：用户上读时不强拉）。
- **终态（非挂起期）**：块**原地折叠冻结**——身份头格式：
  `[✓/⏹ key · sync/async · model · done Ns · turn]`（turn = 池终态通知携带的真实
  终值快照；stopped = ⏹ + stopped 词 + 无 report preview；error = ⏹ + error 词 +
  错误注记）+ 内容保留可展开 + report preview ≤8 行 dim 紧跟块后（120 字符截行——
  CLI tool-events parity；**escalate 无 preview**）。
- **挂起期 settle 例外**：不冻结——块**流内驻留**（出生位不动）+ "done · awaiting
  digestion" 头（digest 完成逐条补发 done → 原地冻结；会话退出 freeze 兜底未消化
  残项）。CLI `_freezeAt` 语义由出生时序结构性取代（settle 先于 digest 报告——
  报告自然排在块后）。
- **频道名**：活动频道 = `sub:${role}#${subId}`（subagent/advisor 族——独立块键，
  resume 续跑 subId 不变块不重复；同步 spawn 也经同一路由）；consult/escalate 频道嵌
  模型段 `sub:consult <model> #N` / `sub:escalate <model> #N`（块键含模型——
  activity.js parseChannel 两形态正则）。
- **嵌套子标**：内层子代理文本行首 dim 子标（`chunk.sub`——如 `explore#1`，runChild
  forward 去前缀附加；同 sub 文本合并续行不重复前缀；advisor 频道照旧折叠）。
- **150 块 DOM 裁剪**：子代理块（**live 与冻结 alike**）从出生即计入 `#messages`
  裁剪——**无豁免**（F-B1e：预算 = 并发池大小——池有界；与 advisor 块同规则同
  选择器——.advisor-block 直接子元素计数）。
- **实现注**：`String.prototype.sub` 陷阱——toolPanelPayload 的 `chunk?.sub` 在
  string chunk 上取到 String 内建方法（truthy）——string 兼容分支显式 `undefined`；
  appendAdvisorChunk 合并分支 `textContent +=` 会清掉行内子标 span——改 `appendChild`
  text node。

行面板（`#subagent-panel`）保留（其独有载荷 = queued/waiting 行 + consult 计数/
回复 preview）——非缺陷；R22 底部活动面板容器已随 B1 拆除（live 块全入流后容器
死码）。

## 6. 交互组件要点与标题

- **权限弹窗/批确认 UI**（approve/deny/approve-all + 原生 diff 预览）；AUTO 按钮翻转
  会话级 autoApprove。
- **Question 卡**（2026-09-07 对齐修复）：选项按钮包 `.question-options` 容器（成列
  width:100% text-align:left）→ `.question-actions` = 底部操作行（input flex:1 +
  submit + cancel）；卡内字号/字重 scoped 覆盖（14px；`.perm-btn` font-weight 400）；
  `.question-text` pre-wrap 保形。
- **粘贴图片**：attach 按钮/粘贴 → dataURL 预览条（`#paste-bar`）→ 发送时随
  userMessage 上送。
- **设置面板**：模型/Provider/代理/工具/agent 分页（settings-*.js）——agent 页含
  poolLimits、guard/engineering 反射等。
- **会话标题**：session-bar 顶栏显示活动槽标题（`#session-title`，来自 `sessions`
  消息的 `active.title`）；会话下拉（`#session-dropdown`）列 switch/rename/delete。
  首条消息发送后 LLM 自动生成标题（extension `generate-title.mjs`）；标题未生成前
  session-bar 显示自动占位（`Session N`），生成完成后经 sessions 刷新更新标题。
- **模型选择 UI**：主下拉列 provider 行 + hover flyout 子菜单选模型（两级菜单——
  hover 展开 provider 的模型表）；底部含 add/remove/key 管理入口。
- **挂起 UI**：settle 期间块流内驻留（"done · awaiting digestion"——§5）；状态
  行（⏳ 后台 N 子代理 + 待消化计数）；输入框永不锁（loading.js `on && !susp`）；
  digest 中 Enter 由 host 排队（send.js `isRunning && !S._suspended` 才拦截）。
- 交互控件按钮（mode-buttons.js）：ENG / ADVISOR(guard) / AUTO / PLAN 状态反射。

## 7. 消息协议（webview ↔ extension）

**寄存器**：基础会话消息表以 AGENTS.md「Webview ↔ Extension Message Protocol」为
准（消息名/载荷的 byte 级维护寄存器）；本节为 webview 前端本架构权威源——扩展机制消
息族清单 + 演进纪律。

### 7.1 基础会话消息族（寄存器 = AGENTS.md，方向/载荷摘要）

| 方向 | 消息 | 载荷/语义 |
|------|------|-----------|
| wv → ext | `userMessage` | `{ text, model?, reasoning?, provider?, images? }`——images = dataURL 数组；扩展落盘 paste-* + `[Attached images: …]` 指针 |
| wv → ext | `abort` / `interrupt` | `—` / `{ message }`——Ctrl+I 中断（提交 partial + 续跑同回合） |
| wv → ext | `newSession`/`switchSession`/`deleteSession` | `{ slot }`——运行中切换拒绝 |
| wv → ext | `getAgentSettings` | pull——重读 config → push `agentSettings` |
| ext → wv | `agentSettings` | `{ settings }`——agent.* 快照 |
| wv → ext | `selectModel`/`selectReasoning` | `{ model, provider? }` / `{ reasoning }` |
| wv → ext | `setAdvisorGuard`/`setEngineeringEnabled` | `{ value }`——工具栏开关 |
| ext → wv | `token`/`reasoning` | `{ text }`（reasoning = 思考折叠块） |
| ext → wv | `turnBreak` | `—`——机器子回合边界 |
| ext → wv | `toolCall`/`toolResult` | `{ name, args?/text }` |
| ext → wv | `complete`/`loading`/`aborted`/`error` | `{ text? }`（error 携 needsSetup；loading 消息与 busy-state 的关系见 §8） |
| ext → wv | `providerInfo`/`autoApprove`/`models`/`sessions` | Provider 态 / AUTO 会话级 / 模型表 / 会话列表 |
| ext → wv | `historyPage`/`loadOlder` | 懒历史：末页先发（older=false）+ scroll 补偿 |
| wv → ext | `question`/`questionResponse` | 内联 question 卡（非原生弹窗）——questionResponse `{ answer, promptId }`（C1——见 §8） |
| ext → wv | `userMessage`/`assistantMessage` | 历史回放（quick-input 命令回显用） |
| ext → wv | `clearMessages` | `—` |

### 7.2 扩展机制消息族（本架构权威源）

| 消息 | 方向 | 载荷/语义 |
|------|------|-----------|
| `toolPanel` | ext → wv | `{ type, name, kind, text, round, model, sub }`——活动流 chunk（advisor/子代理/consult/escalate）；`kind` = start/think/text/tool；`sub` = 嵌套子标（string chunk 分支恒 undefined——§5 陷阱注） |
| `subagent` | ext → wv | `{ type:"subagent", ...info }` 展开透传——started（池条目带 `pool: true`）/settled/done/error/cancelled 终态 + turn/maxTurns 终值快照 |
| `cancelSubagent` | wv → ext | `{ id, role }`——⏹ 点击路由 → 池条目定向 abort（role 交叉校验防陈旧按钮误停；未知 no-op；advisor role 复用同路由） |
| `batchPermissionResponse` | wv → ext | approveAll / oneByOne / deny |
| `compress` | ext → wv | start/done/failed/fallback 四态（压缩状态行） |
| `suspension` | ext → wv | 挂起态行/冻结通知（settled→done 补发/active:false+freeze）——计数载荷与 turnState 双通道一致（§8） |
| `turnState` | ext → wv | `{ state, counts? }`——忙态单一广播（C2——§8 权威锚） |
| `questionCancelled` | ext → wv | `{ promptId }`——abort 释放未答 question 卡（C1——§8） |
| `onAgentTurn` | 内部 | 每轮迭代 turn 计数钩子（顶层无订阅 no-op——池条目同步用） |

### 7.3 演进纪律（三落点）

新增展示字段必须同时落三个点——**发射端 chunk / 桥 postMessage 载荷
（panel-toolpanel.mjs `toolPanelPayload`——显式白名单纯函数）/ webview 渲染端**（历
史断链事故：只改发射端与渲染端、漏桥 → model 字段从发布首日被丢弃——2026-08-26 修复
锁桥测试）。string/对象双分支在 payload 构造处统一推导（对象载荷字段透传、string 分支
字段 undefined 安全降级）。

## 8. 消息秩序与忙态收敛（SESSION-FLOW-C + A——权威锚）

> 本节的协议正文是**唯一来源**（C1/C2 实现与 AGENTS.md 协议表镜像行均指向本节，不重复
> 正文；SESSION-FLOW-A A1/A2 措辞增量同落本节——不双处详述）。覆盖 C1 消息秩序增量
> （question promptId/questionCancelled/atComplete seq）、C2 忙态收敛（turnState 广播/
> renderStatusBar 单 writer/Stop 派生）与 A1/A3 扩展（sendMessage 命令直发同入口/
> Stop 派生扩为 state≠idle——A2 标题时机正文在 SESSION.md §7）。

### 8.1 回合入口秩序（C1——F-C1e/H-F + A1——F-A1/R6）

- `userMessage`、`retry` 与 `sendMessage` 命令直发（quick-input/Ask ThinCoder——A1
  SESSION-FLOW-A——修 R6 残留：sendMessage 曾是唯一绕过本入口的直呼 _chat 路径）共用
  **单一入口 routeUserTurn**（panel-messages.mjs）：回合执行中（host `_turnState==="running"`）
  的消息一律入队 `panel._suspQueue` + 回执 `messageQueued`——回合尾 FIFO 顺序消费
  （零丢失）；abort/interrupt 等控制消息**永不排队、直通**（延迟红线——杀 Stop 即失败）。
  sendMessage 回显（`userMessage` postMessage）先于入队——运行中命令发送 = 用户气泡 +
  "message queued"，与 webview 输入路径观感一致；susp 两态（会话活跃/释放窗口）走
  _chat 上游分流不变；_panel 空 → warning 分支（不发 _chat）。

### 8.2 question 卡 id 匹配（C1——F-C1d/H-D）

- host 发 `question` 携带单调自增 `promptId`；webview 卡片以 `data-prompt-id` 落 DOM。
- wv → ext `questionResponse` 回带 `{ answer, promptId }`——host 按 id 查 `_questionQueue`
  条目（**非无条件 shift**——找不到 no-op，绝不 resolve 错队头）。无 promptId（旧
  webview）→ 回退队头（历史语义）。
- host 中止未答 question（Stop/abort——makeAskInPanel onAbort）→ 发 `questionCancelled`
  `{ promptId }`——webview 按 id 移除对应卡片（无 promptId → 移除全部 question 卡）；
  abort 收尾路径（finish(aborted)——streaming.js）同样清屏上 question 卡。

### 8.3 atComplete seq（C1——F-C1c/H-A）

- wv → ext `atComplete` `{ query, cwd, seq }`——seq 在 webview 侧（autocomplete.js）请求
  自增（防抖 150ms 之外）；host 只回显**最新 seq**（旧扫描迟到结果丢弃）——
  `atResults` `{ matches, seq }` 回带该 seq——旧扫描不覆盖新下拉。

### 8.4 忙态收敛（C2——F-C2a~e）

- **host `_turnState` 枚举 `{idle, running, susp}`**：running = 回合（含会话内
  digest/会话用户回合）执行中；susp = 挂起会话活跃或释放窗口（池仍 live、会话未建）；
  waiting（权限/question 队列非空）是 running 的**修饰态非互斥**——只经
  `_refreshStatus` 呈现（"waiting 优先 running"），不入枚举。读者一律走谓词
  `panel.turnBusy()`（= state ≠ idle）。
- **单一广播 `_publishTurnState(state, counts?)`**：每次忙态 set/clear 调——发
  `{type:"turnState", state, counts?}`——webview **单一 reducer**
  `handleTurnStateMessage` 更新 `S._turnState`。counts = host `backgroundStatus` 形
  `{ running, queued, pending, done }`——随 susp 广播/重发携带：挂起驱动轮末（会话内
  回合尾 finally、postSuspension 入口与 282/300 同点）**与 settle 触发点**
  （onAsyncSettled——digest 间计数即时刷新）+ `webviewReady` 重推（Reload Window 冷启
  恢复）——webview `_suspCounts` 恒 = host 实际（F-C2e 不陈旧）。
- **时序**：状态广播先于同批 `loading:false`（digest/回合尾）——webview Stop 派生无
  闪烁窗口。
- **`S._suspended` 语义不变**：仍由 `suspension` 消息（active/freeze）驱动（会话级
  语义——digest 执行中 state 为 running 时不得翻 false）；`S._turnState` 是独立的忙态
  阶段镜像。
- **#status-line 单 writer = `renderStatusBar`**（status-bar.js）：thinking 态 =
  `S._phase==="thinking"` 标记（`loading` 消息经 setLoading 置位/清除）——renderStatusBar
  同线绘制徽标（task/sub/goal/plan）、挂起计数与 thinking 段——loading 消息不再
  innerHTML 覆写状态行（修 H-E——徽标不被每 digest 的 thinking 重画清掉）。
- **Stop 常显（F-C2d + A3——SESSION-FLOW-A）**：abort 按钮可见性 =
  `S._turnState !== "idle"` **派生**或 loading 驱动——派生由 susp 扩为 state≠idle：running
  （回合/标题窗口/会话内 digest 起跑）与 susp（digest 间）全程常显——loading:true/false
  不再隐/显 abort（修 digest 间按钮闪烁 + running 窗口隐藏——标题窗口/digest 起跑窗口/
  Reload 冷启 webviewReady 重推 running 后无 loading 消息也恢复 Stop）。

## 9. 变更记录（历史折叠——详见 git log）

- 2026-09-09：SESSION-FLOW-B B1 锚段——§2 布局改四行垂直序（grid 五行→四行——活动
  面板容器随 F-B1a 拆）+ §5 全节重写（子代理块流内出生 · 原地冻结——live/冻结从出生
  即计入 150——freezeAnchor/面板滚动带全删——CLI _freezeAt 由出生时序取代）。
- 2026-09-09：SESSION-FLOW-A A 批锚段——§8.1 补命令直发路径（routeUserTurn 单一入口扩
  至 sendMessage——修 R6）；§8.4 Stop 派生 susp → state≠idle（A3——running/susp 全程
  常显 + Reload 冷启恢复）；标题触发时机归位前（A2 方案 Y——权威正文见 SESSION.md §7）。
- 2026-09-09：SESSION-FLOW-C C2 收敛——新增 §8「消息秩序与忙态收敛」（权威锚——C1
  增量 question promptId/questionCancelled/atComplete seq + C2 turnState 单一广播/
  renderStatusBar 单 writer/Stop susp 派生/_suspCounts 不陈旧）；7.1/7.2 表补行。
- 2026-09-07：R22 子 agent 显示趋同 CLI——底部活动面板 + 块头升级 + 完成冻结入流
  （webview/activity.js 新）。
- 2026-09-07：R22 冻结块插入位置修复（freezeAnchor settle 锚点记录 + 链式落位 + 150
  裁回退）。
- 2026-09-08：本文档自 ARCHITECTURE §11+§12 迁出重组（DOC-REORG-VSC 第 7 批——
  VSC 独有板块，消息协议并入 WEBVIEW）。
