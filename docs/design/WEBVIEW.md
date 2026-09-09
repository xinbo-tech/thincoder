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

**垂直序（自顶向下）**：session-bar（项目/会话切换）→ `#messages` 滚动区 → 活动区
（`#subagent-activity`——live 子代理块固定容器）→ 行面板区（`#goal-panel`/
`#task-panel`）→ 输入区（`#toolbar`）。活动区 = CLI 单面板形态回归
（SESSION-ACTIVITY-REVISED F-1——live 块**固定于 messages 与输入之间**——不随会话流
滚动丢失——freeze 落流时移入 `#messages`）。

CSS 布局规则落 `webview/base.css` 的 grid 行模板：

```
#chat-container { grid-template-rows: auto minmax(0, 1fr) auto auto auto; height: 100%; }
```

行模板对应垂直序：header(session-bar) / `#messages`(1fr) / `#subagent-activity`
(活动区，auto) / `#panels`(goal/task，auto) / `#toolbar`(输入，auto)——后三层均
auto，隐藏项不占高 → 消息区高度 = 容器 − 活动区 − 面板 − 输入（grid 1fr 自动吸收）。

- 消息区钉底/滚动语义限定 `#messages` 内；`#messages` `overflow-y:auto` +
  `overscroll-behavior:contain`。
- 活动区自适应块内容（auto 行高）——`max-height: 32vh` 封顶 + 区内自滚（区底 pin——
  近底出生滚到底、上读不强拉——F-2 与 messagesEl pinBottom 同语义）；空时隐藏零高
  （`:empty` + activity-view.js `updateAreaVisibility` 双驱——hub 经 activity.js 可达）。区内块 = `.advisor-block`
  `.sub-block`（chat.css 样式原样——块内容 100px 内滚——增长天然有界）。
- 冻结块为 `#messages` 直接子元素（与 `.message` 兄弟同层——150 块裁剪只数冻结块——
  live 块在活动区不计窗——预算 = 并发池大小——池有界）。

shell 结构 `webview/index.html`：`#chat-container` 内含 `#session-bar` / `#messages` /
`#subagent-activity`（活动区——无 role 无内文——`:empty` 生效）/ `#panels`（goal/task
两个行面板）/ `#toolbar`（`#status-line` + `#input-row`(attach/send/abort)
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
- `activity.js`（编排层 + hub——ACTIVITY-SPLIT：parse/rowFor 水合 + ensureBlock +
  applySubagentStatus 状态机 + freezeSettledBlocks 批冻 + resetActivity——呈现委
  activity-view.js、落流冻结委 activity-freeze.js——re-export hub：panels/chat/
  streaming/test 的 import 面零改动）
- `activity-view.js`（呈现叶——ACTIVITY-SPLIT 新：块头/状态词/⏹/区显隐与 pin/
  noteChunk/elapsed ticker 全族含 stopTicker——leaf：state/i18n only）
- `activity-freeze.js`（冻结叶——ACTIVITY-SPLIT 新：freezeBlock 折叠 + 落流锚插/
  appendPreview/preview 尺寸——leaf：state/activity-view only——不依赖核心）
- `panels.js`（goal/task 面板 + 挂起态 + 桥路由；行面板 DOM 已撤——簿记 map 仅供块 meta
  水合——SESSION-ACTIVITY-REVISED F-3）
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

## 5. 子代理活动块（活动区固定 · 冻结落流锚——SESSION-ACTIVITY-REVISED 现行机制）

子 agent/consult/escalate/advisor-async 活动块**出生即固定在活动区**（`#subagent-activity`
——messages 与输入之间的固定容器——live 块不随会话流滚动丢失——F-1 用户三连①的解）；
终态**冻结并移入 `#messages` 流**（DOM move——B1"原地折叠"修正反转：区为纯 live 面，
流只收冻结块——150 窗口只数冻结——AC-5）。角色全同通道（频道名差异仅块键/折叠归属）。

- **live 块（活动区内）**：live 头 = 状态词 + key（= 频道 label——channel 去掉 `sub:`
  前缀）+ sync/async 标 + model + 1s 本地 ticker elapsed + （终态通知前无 turn 段）+
  ⏹（仅 running 且仅池条目——started 事件 `pool: true` 标记区分同步 spawn）；当前
  工具/等待审批 + tail 3 行 dim 摘要。**区底 pin**：区溢出（多块超 32vh）时近底出生滚
  到底——用户上读区历史不强拉（messagesEl pinBottom 同语义）。区空隐藏（`:empty` +
  `updateAreaVisibility`——无块零高不占 grid 行——⑨）。
- **queued/waiting（区内等待块头——D-4）**：排队 spawn 即建头（`[⏳ key]` + queued ·
  position N / waiting 原因状态词——行面板撤后等待态唯一承载面）；**不挂 ⏹**（未启动
  不可单独停——CLI 同——队列自然推进——无取消路径——F-6 定论）；started 转 running
  （⏹ 现）；cancelled（was:"queued"）移除头（从未启动不冻结）。
- **普通终态（非挂起——done/stopped/error/consult answered）**：块**尾推移入**
  `#messages`（`appendChild`——CLI append 尾推）——身份头格式：
  `[✓/⏹ key · sync/async · model · done Ns · turn]`（turn = 池终态通知携带的真实终值
  快照；stopped = ⏹ + stopped 词 + 无 report preview；error = ⏹ + error 词 + 错误
  注记）+ 内容保留可展开 + report preview ≤8 行 dim 紧跟块后（120 字符截行——CLI
  tool-events parity；**escalate 无 preview**）。freeze 不强制滚动（折叠单行落定）。
- **挂起期 settle（`_freezeAtEl` 落流锚——CLI _freezeAt DOM 版——F-4）**：settle 不
  冻结——块**驻留活动区**（✓ "done · awaiting digestion" 头）并记
  `meta._freezeAtEl` = settle 时 `#messages` 流尾元素（+ settleSeq 单调序）；digest
  完成后 host 逐条补发 done → 块插回 **锚后（digest 报告前）**——多 settled 同锚按
  settle 序升序落流（插入点 walk——任意 done 到达序相对序恒 = settle 序——⑪）；锚被
  150 裁（isConnected=false）→ 尾推退化（⑫）。会话退出 freeze 兜底未消化残项（同锚
  机制）。consult answered 无块防御（评审 #3——⑭）：answered 携 replyPreview 而无块 →
  按行快照建冻结块（回复不丢——digest 轮逐字呈现仍为权威呈现面——agent.mjs run-start
  pending 注入）。
- **频道名**：活动频道 = `sub:${role}#${subId}`（subagent/advisor 族——独立块键，
  resume 续跑 subId 不变块不重复；同步 spawn 也经同一路由）；consult/escalate 频道嵌
  模型段 `sub:consult <model> #N` / `sub:escalate <model> #N`（块键含模型——
  activity.js parseChannel 两形态正则）。
- **嵌套子标**：内层子代理文本行首 dim 子标（`chunk.sub`——如 `explore#1`，runChild
  forward 去前缀附加；同 sub 文本合并续行不重复前缀；advisor 频道照旧折叠）。
- **150 块 DOM 裁剪**：只数 `#messages` 内冻结子块（**live 在活动区不计窗**——
  AC-5——F-B1e 预算 = 并发池大小——池有界；与 advisor 块同规则同选择器——
  .advisor-block 直接子元素计数）。冻结块元素被裁后其 map 簿记防御性清扫（ensureBlock
  isConnected 检查——tombstone 语义由调用点 frozen 守卫承担）。
- **实现注**：`String.prototype.sub` 陷阱——toolPanelPayload 的 `chunk?.sub` 在
  string chunk 上取到 String 内建方法（truthy）——string 兼容分支显式 `undefined`；
  appendAdvisorChunk 合并分支 `textContent +=` 会清掉行内子标 span——改 `appendChild`
  text node。

行面板（子代理行 + consult 计数/回复 preview）已随 SESSION-ACTIVITY-REVISED F-3 全撤
（D-3 方案 A——行面板 = VSC 独有历史残留——双面根源——单面板形态一体满足用户三连）：
queued/waiting 转区内等待块头；consult 回复 preview 由冻结块 preview + digest 轮逐字
呈现覆盖；👥 计数由状态行 `_suspCounts` 承担；autoClean linger 迁区内块生命周期（冻
结落流即永久可见——无 3s/60s 删除窗）；`#subagent-panel` 自 index.html/CSS/panels.js
零残留（⑮ grep 锁——含 status-bar 子代理计数徽标撤除——评审 #2——base.css 徽标焦点规
则同步）。

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
- **挂起 UI**：settle 期间块驻留活动区（"done · awaiting digestion"——§5——digest
  done 补发落流锚插回 digest 报告前）；状态行（⏳ 后台 N 子代理 + 待消化计数——
  `_suspCounts`——子代理计数徽标已撤）；输入框永不锁（loading.js）；send 拦截保留
  （`isRunning`——Enter/发送按钮拒发——输入框不禁——可继续录入）。Stop 只在 running 显
  （susp 纯池跑不显——子代理停止靠活动区每块 ⏹——F-6）。
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
> 正文；SESSION-FLOW-A A1/A2 措辞增量同落本节——不双处详述；SESSION-FLOW-B B2 boot 契约
> 同落本节——8.5）。覆盖 C1 消息秩序增量
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
  同线绘制徽标（task/goal/plan）、挂起计数与 thinking 段——loading 消息不再
  innerHTML 覆写状态行（修 H-E——徽标不被每 digest 的 thinking 重画清掉）。子代理计数
  徽标已随行面板撤除（SESSION-ACTIVITY-REVISED 评审 #2——活动区自动显隐无需开关）。
- **Stop running 派生（F-6——SESSION-ACTIVITY-REVISED 评审 #1 定论——收窄 A3 的
  state≠idle）**：abort 按钮可见性 = `S._turnState === "running"` **派生**——running
  （回合/标题窗口/会话内 digest 起跑/Reload 冷启重推）常显——**susp（纯后台池跑——
  主空闲——digest 间等待/释放窗口）不显**（无全停按钮——池空自然消化完——CLI 对拍）；
  loading:true/false 不再隐/显 abort（修 digest 间按钮闪烁 + running 窗口隐藏）。
  Stop 作用收窄：host abort case 只停主会话当前 controller（digest 轮 controller——
  newTurnController 每回合新建）——不再全链中止挂起会话（废除 D-S9——`_suspWake`/
  `abortControllers` 全停路径删除——子代理停止靠活动区每块 ⏹——running+pool——
  queued/waiting 不挂——cancelSubagent 定向 abort）。

### 8.5 会话打开单向 boot（SESSION-FLOW-B B2——F-B2a~c 权威锚）

> 会话打开（首开 / Reload Window 重开）的**单向 boot 契约**——扩展端消息发射点的唯一定序。
> B2 静态判定并修复"Reload 后对话区空"缺陷：内容曾在 resolve 期（webview 未加载）发出即丢。

- **resolveWebviewView 只起慢段**（`status()` = migrate/fullStatus/mcpStatus/模型偏好/索引探测
  ——与 webview 加载重叠并行）；慢段头部 pushStatus 可能丢——webviewReady 的 `_pushStatus`
  兜底（幂等）。resolve **绝不发会话内容、绝不绑槽**（AC-B2b——内容双发/槽重绑红线）。
- **webviewReady = 会话内容唯一发射点**（快段 `openSessionContent`——panel-session.mjs）：
  握手后才允许 run——`resumeSlot` 绑槽 → `pushProject` → `loadSession` 全量（内部序
  autoApprove → planMode → clearMessages → historyPage → sessions）。槽绑定时机 =
  resolve → webviewReady 顺延——webviewReady 前无 slot 读者（安全）。
- **单向 boot 顺序**：clearMessages 先于 historyPage（先清后灌——一次内容整体落定，无
  "波浪式"增量）；`older=false` 末页（懒历史首屏——scroll-back 页仍走 loadOlder）。
- **sessions 恰一次（N2——同 tick 单发纪律）**：快段内无独立 pushSessions——loadSession 尾
  单发（F-B2c 合并同 tick 双发）；异步第三发（慢段 fullStatus cb）保留**不同 tick**
  （跨 tick 允许——N2 只锁同 tick）。
- Reload 冷启：webviewReady 快段内 sessions 同 tick 恰一次；慢段 fullStatus cb（仅
  provider 已配置时触发）为跨 tick 刷新——允许（N2 只锁同 tick；无 provider 则整条
  resolve + webviewReady 流总数恰一次）。真机 Reload 走查 = 实现期验证项（N4）。

## 9. 变更记录（历史折叠——详见 git log）
- 2026-09-09：BATCH-4-DOC-CLEANUP——§6 挂起 UI send 拦截句同步 INPUT-LOCK-BEHAVIOR-REVISED
  （只禁 send 不禁录入——send 拦截保留 `isRunning`——Enter/发送按钮拒发——输入框不禁可继续录入——
  L175 旧拦截句清）。

- 2026-09-09：SESSION-ACTIVITY-REVISED 锚段（B1 修正——行面板保留裁定反转）——§2 布局
  改五行垂直序（活动区 #subagent-activity 回——messages 与输入之间——空时隐藏零高）+
  §5 全节重写（区内出生 + freeze 落流锚 tail-push/_freezeAtEl——settled 驻留区——150
  只数冻结——queued 等待块头——consult 无块防御）+ §8.4 Stop 派生收窄 running（susp 纯池
  跑不显——无全停）+ §6 挂起 UI 同步。
- 2026-09-09：SESSION-FLOW-B B2 boot 锚段——新增 §8.5（会话打开单向 boot 契约：resolve
  只起慢段零内容——webviewReady = 内容唯一发射点——sessions 同 tick 恰一次——Reload 空
  缺陷静态修复）。
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
