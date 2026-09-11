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

**垂直序（自顶向下）**：session-bar（项目/会话切换）→ `#messages` 滚动区（消息流——
子代理活动块**出生即流尾**——与 `.message` 同层）→ 行面板区（`#goal-panel`/
`#task-panel`）→ 输入区（`#toolbar`）。ACTIVITY-REWRITE-SIMPLE（2026-09-09）：子代理
活动区容器及其派生（区样式/显隐/pin/32vh/区内自滚）全删——块随消息流走——无独立活动
面（CLI 对话流同形态——B1 参照回归）。

CSS 布局规则落 `webview/base.css` 的 grid 行模板：

```
#chat-container { grid-template-rows: auto minmax(0, 1fr) auto auto; height: 100%; }
```

行模板对应垂直序：header(session-bar) / `#messages`(1fr) / `#panels`(goal/task，auto) /
`#toolbar`(输入，auto)——后两层均 auto，隐藏项不占高 → 消息区高度 = 容器 − 面板 − 输入
（grid 1fr 自动吸收）。

- 消息区钉底/滚动语义限定 `#messages` 内；`#messages` `overflow-y:auto` +
  `overscroll-behavior:contain`。
- 子代理活动块为 `#messages` 直接子元素（与 `.message` 兄弟同层——`appendChild` 流尾
  出生——150 块裁剪从出生即计，live/冻结均无豁免——预算 = 并发子代理数——池有界）。
- 冻结块原地折叠（无 DOM move——位置 = 出生位——SESSION-RESTORE-PARITY：消息流即历
  史——不做跨 reload 恢复）。

shell 结构 `webview/index.html`：`#chat-container` 内含 `#session-bar` / `#messages` /
`#panels`（goal/task 两个行面板）/ `#toolbar`（`#status-line` + `#input-row`(attach/
send/abort) + `#paste-bar` + `#controls-row`）+ `#settings-panel`（dialog）+
`#welcome-panel`（首次运行 onboarding）。CSS 经 `__CSS_*_URI__` 占位注入，`__CHAT_URI__`
注入模块脚本，CSP 经 `__CSP__` 占位注入。

## 3. 文件结构（现行）

`index.html`（shell——CSP 注入 + CSS/JS URI 占位）→ 前端模块：

- `chat.js`（编排：状态/事件/消息路由/模型选择/历史/设置——`window.message` 派发中枢）
- `streaming.js`（token/reasoning 流式渲染 rAF 节流 + 回合收尾 + advisor/子 agent
  块路由 + code-block 复制按钮）
- `ui.js`（DOM 构造：欢迎页/气泡/工具卡/advisor 块/loading 态——leaf：不 import
  state.js）
- `md.js`（markdown 渲染）、`state.js`（单一 UI 状态 `S` + DOM 引用 `ctx` + `vscode`
  postMessage 桥）
- `activity.js`（编排层——ACTIVITY-REWRITE-SIMPLE：ensureBlock（块 append #messages 流尾
  ——终态幂等守卫返 null） + applySubagentStatus 三态机（queued ⏳ 头含取消 ⏹/started 翻
  running/其余 status 一律终态折叠——lookup-only 绝不建块——settled 视同 done） + freeze
  原地折叠 + resetActivity + freezeLiveBlocks（suspension 退出兜底）——导出消费面：
  panels/chat/streaming）
- `activity-view.js`（呈现叶——refreshBlock/updateStopButton/noteChunk——块头/状态词/⏹
  ——区显隐/pin/ticker/awaiting·position·waiting 词已删——leaf：i18n only——不依赖核心）
- `panels.js`（goal/task 面板 + 挂起态 + 桥路由；簿记 map 已删——handleSubagentMessage
  纯转发 applySubagentStatus——ACTIVITY-REWRITE-SIMPLE）
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

## 5. 子代理活动块（流尾出生 · 原地冻结——ACTIVITY-REWRITE-SIMPLE 现行机制）

子 agent/consult/escalate/advisor-async 活动块**出生即 append 到 `#messages` 流尾**
（与 `.message` 同层——`ensureBlock`——label = channel 去掉 `sub:` 前缀；无独立活动
区/容器——补丁叠补丁的加戏形态全删——B1 流尾形态回归）。**生命周期只有 live → frozen
两态**——终态原地折叠（无 DOM move——位置 = 出生位——消息流即历史）。

- **live 块（流内）**：live 头 = `[▶ key · sync/async · model · Ns · turn]` + 状态词
  （工具尾句 / thinking…——事件驱动——**无 1s ticker**——纯事件驱动显示 elapsed）；
  open 可展开内容。⏹ 覆盖按钮：running + pool 条目（started `pool:true` 区分同步
  spawn——同步 spawn 无 ⏹——随首 chunk 建块）。嵌套子标（`chunk.sub`——如 `explore#1`）
  行首 dim 归属照旧（appendAdvisorChunk 原样——ui.js 零改动）。
- **queued（流内 ⏳ 等待头——F-2 QUEUED-VISIBILITY 保留）**：排队 spawn 消息即建头
  `[⏳ key]`——头只显 ⏳（position/waiting 状态词及词键删）——**挂取消 ⏹**（标签键
  `sub.cancelQueueBtn`——取消沿既有 `cancelSubagent` 路径——协议零改——扩展端零动）；
  started 到达 → 同块翻 running（⏹ 换 stop 标签）；cancelled（was:"queued"）→ 头移除
  （从未启动——不冻结）。
- **终态折叠（终态集合闭合——F-1）**：任何非 queued/started 的 status（done/settled/
  error/cancelled/answered/terminated/failed…）一律视同终态原地折叠——class
  sub-live→sub-frozen + open=false + ⏹ 移除 + 头词换 `[✓ key · done Ns]`（stopped =
  ⏹ 词、error = 错误注记随头）。**settled 视同 done 即时折叠**（无 awaiting digestion
  驻留——词键删）；**answered 有块折叠、无块 no-op**（回复走 digest 逐字呈现——无块防
  御建块已删）；**终态/trim 路径 lookup-only 绝不建块**（reload 后陈旧消息无块频道一律
  no-op——不做跨 reload 恢复——SESSION-RESTORE-PARITY：live 块不入 history——消息流是历
  史——块无需跨 reload 生命）。
  **2026-09-11 第 10 批修订（见 §5.1.4 第 6 条成员表）**：终态（桩集内——done/settled/error/运行中 cancelled/
  terminated/failed；**answered 与 queued-cancel 为表内显式例外**）遇"无块频道"且 role ∈ FAMILY_ROLES + id 合法 →
  **补块并立即折叠**（never-born 终态防御）。原"绝不建块"的依据（"reload 后陈旧消息不复活"）经受控复现证不成立
  ——`subagent` 族消息只会是本次会话的活事件（历史回放走 `userMessage`/`assistantMessage`/`toolHistory`，不含该族）。
- **幂等守卫（单 map 单守卫）**：S._subBlocks 键 = 频道名——map 有键且已终态 →
  ensureBlock 返 null（迟来消息丢弃——不复活不重建）；map 有键且 live → 返回既有元素
  （重复 started/queued 覆盖式刷新头词不重挂）；map 无键 → 建块 append 流尾。
- **150 块 DOM 裁剪**：`.advisor-block` 直接子元素计数（与 advisor 块同规则同选择器）
  ——live/冻结**出生即计窗无豁免**（预算 = 并发子代理数——池有界）。冻结块随窗裁——
  终态条目保留（守卫仍丢迟来消息）；**live 块被裁** → ensureBlock 遇 !isConnected →
  tombstone 守卫（条目保留——终态/被裁同守卫——后续消息一律丢弃——resetActivity 才清
  簿记）。
- **resetActivity**（回合中止无挂起会话/会话清）：移除 .sub-live 块 + 清 map——frozen
  块不动（会话流历史——随 150 窗裁）。
- **会话退出 freeze 兜底**（suspension active:false + freeze:true）：freezeLiveBlocks
  折叠残余 live 块（settled 已随消息即时折叠——兜底只覆盖极窄竞态——CLI freezeAllSubTasks
  中断语义：不留悬空 live 块）。
- **report preview / appendPreview 已删**（F-3——折叠块自身 header + tail-3 dim 摘要即
  呈现面——内容保留可展开）；**ticker/区显隐/pin/落流锚全删**（无 idle 时钟）。

行面板（子代理行 + consult 计数/回复 preview）已随 SESSION-ACTIVITY-REVISED F-3 全撤
（历史——2026-09-09）；ACTIVITY-REWRITE-SIMPLE 再撤活动区容器（2026-09-09）——
queued 等待头入流（⏳ + 取消 ⏹）；👥 计数由状态行 `_suspCounts` 承担（susp.running/
susp.digesting 键）；冻结块落流即会话流历史（随 150 窗裁——无删除窗）。

### 5.1 出生投递与块身份——可靠性设计（2026-09-11 第 10 批）

> 需求：CLI 仓 `docs/requirements/AGENT-LOOP.md` §3（F-A1~F-A5 + NFR-A1~A3）（CLI 侧文档树）。
> 本机一条目（条目 A）——纯 VSC 面；条目 B（后台评审池接入面）在 CLI 仓 `docs/design/AGENT-LOOP.md` §18（CLI 侧）。
> 批次：`thincoder/docs/batches/2026-09-11-VSC-ASYNC-VISIBILITY.md`（CLI 侧；§1 条目 A——用户 2026-09-09 反馈 + 22:32 精复现）。

#### 5.1.1 问题陈述

用户实证（2026-09-09）："实际启动了但不能可靠显示 live 块"——**普遍时有时无**（非 advisor-only：
第一次 advisor 没出现、explore 也没出现、后来 advisor 又出现）。**2026-09-09 22:32 精确复现**：同一响应
双 spawn 两个 eng-coder → 扩展侧池计数 **2 running**（计数正确）→ webview **只渲染 1 个 live 块**；
正常会话内可复现（与 reload 无关）。

#### 5.1.2 根因收口（受控复现驱动——happy-dom 驱真 webview 模块）

**复现手法**（可重跑）：`test/helpers/webview-env.mjs` `setupWebview()` + `installChatFixture()` →
动态 import 真 `webview/activity.js`、`webview/streaming.js` → 直接投喂 `subagent` 消息 → 数
`#messages > .sub-block`。

| # | 机制（一句话） | 判定 |
|---|---|---|
| R-1 | 出生投递纯增量、无队列（webview 未就绪窗口内消息静默丢弃） | 真实（独立缺陷） |
| R-2 | 块身份键重名 × 冻结守卫（重名的新一代任务永不建块，其后 chunk 全吞） | 真实——**22:32 精复现的机制** |
| R-3 | 终态对 never-born 块 no-op（块缺失一旦发生即永久） | 真实（独立缺陷·放大器） |
| R-4 | 清屏抹块 + 重建降级（重建块丢 `pool:true` → 无 ⏹） | 真实（独立缺陷） |
| R-5 | "webview 渲染端并发消息处理竞态"（22:32 当日记录的真因方向） | **证伪** |

**逐条证据与复现**：

- **R-1**：`src/extension/panel-callbacks.mjs:80` `:112`（直投 `panel._panel?.webview.postMessage(...)`——可选链无缓冲）。
  同类竞态已被实证并修过三次：i18n / providerStatus / turnState 均改 `webviewReady` 握手重推
  （`webview/chat.js:313-318`、`src/extension/panel-messages.mjs:396-417`）——任务可见性事件是**唯一没接这条纪律**的族。
  触发窗：webview 重载/渲染崩溃且 view 未 dispose（`retainContextWhenHidden:true`——`src/extension/chat-panel.mjs:118`）时池存活。
- **R-2**：`ensureBlock` 对"map 有键且已冻结"直接返 null（`webview/activity.js:67-74`）；chunk 侧空安全守卫（`webview/streaming.js:235-244`）。
  复现：上一代 `sub:eng-coder#4` 已冻结 → 新一代 #4 `started`（pool:true）→ **零新块**；再补 #5 →
  **live 块 1 个（host 计 2）**，且 #4 后续 chunk 全丢（两块 content 均空）。
  触发源 = id 复用（当时每轮 runAgent 首 spawn 回 #1）——已由 `SUBAGENT-ID-COUNTER-AGENT`（2026-09-10）修于源头；
  **显示层仍无防御**（任何未来 id 重复即永久失明）。
- **R-3**：`webview/activity.js:166-183` 终态遍历 `blockNamesFor`——查键不建键（lookup-only）。
- **R-4**：`clearMessages`（boot/loadSession/项目切换必经——`src/extension/panel-session.mjs:155`）→ `resetActivity` 清块清 map；
  复现：清屏后经 chunk 重建 → 头 `[▶ eng-coder#6 · 0s]`（无 async 词）、`_subMeta.pool === null` → ⏹ 消失
  （`webview/activity-view.js:114-139` 判据 `pool === true`）；startedAt 亦重置。
- **R-5**：复现：背靠背两条**不同 id** 的 `started`（pool:true）→ **2 块正常出生**（`applySubagentStatus` 全同步、无 await——无互踩面）。

**同源判定**：

- **R-1 与 R-4 同源**——投递链**只做增量、从不做状态对账**：webview 被清空或错过窗口后，主侧从不重述"谁还活着"。
- **R-2 与 R-3 同源**——块身份（频道名）与终态守卫的组合**缺"新代/补块"路径**：键一旦被冻结条目把持，新任务既无出生也无补块。
- 两组彼此独立；R-5 证伪 → **22:32 结论更正**：非渲染竞态，是身份重名 + 静态守卫。

#### 5.1.3 方案选型对比（判据来自需求 §3.2/§3.3）

| # | 候选方案 | 结论 |
|---|---|---|
| 1 | **案 A：webview 侧防御修补**——冻结守卫加"新代接管"+ 清屏前 live meta 本地再断言 + 诊断留痕 | 备选（覆盖面不足） |
| 2 | **案 B：投递链根治**——队列 + 就绪/清屏后状态再断言 + 新代接管 + 终态补块 + 诊断留痕 | **推荐**（用户批准环节裁） |

**判据逐项评估与代价**（判据来自需求 §3.2/§3.3）：

- **案 A**：覆盖 22:32 ✓（接管）；覆盖 R-1 ✗（暗窗口丢的消息 webview 看不见）；覆盖 R-3 ✗（无块即无从知道该建谁）；
  覆盖 R-4 ◐（本地 meta 可重建，但属"第二份状态"）；回归风险低；实现面小（1 文件 ~40 行）。
  代价 = **R-1/R-3 两类永久缺块仍在**，且本地再断言与主侧投影可能漂移。
- **案 B**：覆盖 22:32 ✓；覆盖 R-1 ✓（队列 + 就绪再断言）；覆盖 R-3 ✓（终态补块）；覆盖 R-4 ✓
  （清屏后再断言 → pool/⏹ 完整）；回归风险中（再断言 × 幂等守卫/150 窗的交互需用例锁）；
  实现面 8 文件（代码面 ~+130 行 = §5.1.6 src 8 文件求和）。代价 = 主侧多两个小结构（投递队列 + 存活投影，~40 行）+
  一处新交互面需测试锁；**唯一同时覆盖 R-1/R-3 的方案**。

**与 `REMOVE-POOL-SNAPSHOT`（已交付）的边界核对**（不得静默复活已撤机制）：

- 已撤对象 = `postPoolSnapshot`——**池行快照**（queued 行 + 位置；服务的行面板已由 SESSION-ACTIVITY-REVISED F-3 撤除），撤除理由 = "整窗 reload 池清 → 无补发对象"（`docs/design/REMOVE-POOL-SNAPSHOT.md:31-34`）。
- 案 B 补发对象 = **任务存活事件**（复用既有 `subagent` 载荷形状；消费者 = 现存 live 块，未撤）；触发点 = webview 就绪 + **清屏之后**（清屏是真实路径）。
- 判据不同：前者"重建行面板"，后者"出生事件必达"（R-1/R-4 的根因面）；本设计的复现 D/E 落在真实代码路径上（非假想场景）。
- 红线：不复活 `postPoolSnapshot`/`SNAPSHOT_ROLES`（grep 零命中保持）；不重推行面板；不重放已消化历史。

#### 5.1.4 契约（投递链 / 队列语义 / 再断言 / 新代接管 / 终态防御）

1. **投递队列（主侧）**：`panel._wvOutbox`（数组，上界 200——溢出丢最旧 + 留痕）。任务可见性族消息经
   `postSubagentEvent(panel, payload)` 投递：`panel._wvReady === true` → 直投；否则入队。首接 = `onSubagent`。
   **族边界（评审 #10 收口）**：`suspension.mjs:95`（`reclaimDigestedBlocks`）的 `{type:"subagent", status:"done"}`
   补发为**直投、不入队**——它是"已消化块折叠回收"通知（服务**既有**块的收尾，非出生事件；投递场景 = 活会话消化流，
   webview 就绪）；若入队跨暗窗口补投，会为**已消化**任务补出折叠桩，与 §5.1.9「已消化不回填」边界冲突。
2. **就绪握手（既有机制，新增两拍）**：webview 脚本起手投 `{type:"webviewReady"}`（`chat.js:318`）→
   host `webviewReady` case（`panel-messages.mjs:396`）**新增**：`_wvReady = true`；两拍 **flush（保持入队序）→
   `reassertLiveChildren(panel)`** 排在 case 内既有推送与 `openSessionContent(panel)`（内部序含 clearMessages →
   historyPage——§8.5）**之后**（后置理由：clearMessages 抹块 + resetActivity 清簿记——先投的出生事件必被清屏抹掉；
   两拍后块恒落流尾。序固定：flush 终态先落，再补活着——投影本不含已终态者，故不重复）。
3. **存活投影（单一事实源 = 与 ⏹ 路由同源）**：`reassertLiveChildren(panel)` 读 `panel._liveLines ?? panel._susp?.lines`
   的 `history._asyncSubagents` / `history._asyncAdvisors`（与 `panel-messages.mjs:229-231` 的 ⏹ 定位**同一来源**）：
   `running` → 发 `subagent` `{status:"started", role, id, pool:true, model, startedAt}`；`queued` → 发
   `{status:"queued", id, role, position}`（两侧 role/id 必带——建块/接管守卫依赖；其余字段复用既有载荷全形状）。
   **只发 live（running/queued）**——settled/已消化不在投影内（呈现面 = 终态消息 / digest）。
4. **清屏后再断言（主侧）**：`loadSession`（`panel-session.mjs`）在 `clearMessages`（:155）与 `historyPage`
   （`sendHistoryPage` :159→:197）**之后同 tick** 调 `reassertLiveChildren(panel)`——**期望位置 = 流尾**
   （与 §5「出生即流尾」同规；显式定序，不依赖 history 锚插的隐含行为）。
5. **新代接管（webview）**：`applySubagentStatus` 的 `started` + `pool:true` 分支——命中 map 中同名**已冻结**条目 →
   **建新块并接管键**（旧冻结块以 DOM 留在流内作历史；记 `takeover` 痕迹）。`queued` 分支维持现状（后续 `started` 接管）。
   **显式取舍**：接管后该频道的**迟到 chunk 会落进新块**——仅当"id 重复 + 两实例消息交错"才可见（id 单调由
   `SUBAGENT-ID-COUNTER-AGENT` 保证；接管是最后一道防御）。**代价登记在案，不静默**。
6. **终态补块（webview）——桩集 = 精确成员表**（有 map 条目者不受本表影响——既有折叠/守卫语义见 §5）：
   无 map 条目时按表判定；前置 = `role ∈ FAMILY_ROLES` + `id != null` + 频道名合法（不满足 → no-op，记 `drop-unknown-role`）：

   | status | 上下文 | 无块时 | 折叠 kind | 依据 |
   |---|---|---|---|---|
   | done / settled | — | **补桩**（立即折叠 + 记 `late-terminal-stub`） | done | F-A2（settled 视同 done——§5） |
   | error | — | **补桩** | error（错误注记随头） | F-A2 |
   | cancelled | `was ≠ "queued"`（运行中取消，含 `was` 缺省） | **补桩** | stopped | F-A2 |
   | cancelled | `was === "queued"`（从未启动） | **不补**（no-op） | — | §5 既有裁决（头移除——从未启动不冻结） |
   | terminated | — | **补桩** | stopped | F-A2 |
   | failed | — | **补桩** | error | F-A2 |
   | answered | — | **不补**（no-op） | — | §5 既有裁决（有块折叠、无块 no-op——回复走 digest 逐字呈现） |
   | 前置不满足（role 不明 / 非 family 角色如 consult·escalate / id 缺失 / 非法频道） | — | **不补**（no-op） | — | D-4（非法/未知丢弃）；consult 键嵌 model——既有用例锁定 |

   补桩头词 = `[✓/⏹ key · done/stopped …]`（error → 错误注记随头）。非终态不属本表：`started` + pool:true + family →
   出生/接管（第 5 条）；同步 spawn（`pool` 缺省）无块 → 随首 chunk 建块（§5 既有）；`queued` 出生 → 建 ⏳ 头（既有）。
   **§5 原句"终态/trim 路径 lookup-only 绝不建块"由此修订**（依据复核见 §5.1.2 的 R-1/R-3 行：
   `subagent` 族消息只会是本次会话的活事件；answered / queued-cancel 为表内显式不补桩行——§5 裁决保真）。
7. **诊断留痕**：webview 侧 `S._subTraceLog`（环形末 50 条——`activity.js` 单一写点）记 `takeover` /
   `late-terminal-stub` / `drop-unknown-role` 三类（范围 = 出生事件面——声明见 §5.1.9）；主侧
   `logEvent("ev:subdeliver", {...})` 记入队/出队/丢弃计数。
8. **协议零新增**：不新增消息类型（复用 `subagent` 既有载荷形状）；`toolPanel` chunk 语义零变化（§7.2 表不动）。

#### 5.1.5 关键决策记录（含否决备选）

| # | 决策 | 否决备选 / 理由 |
|---|---|---|
| D-1 | 采纳"出生事件队列化 + 状态再断言" | 否决"逐处补门控"（案 A）——门控只防已知路径，R-1/R-3 的缺失面在 webview 视野之外 |
| D-2 | 再断言**只带 live 条目** | 否决"扩 settled 驻留重建"——与 REMOVE-POOL-SNAPSHOT 的"过度工程"判定冲突；settled 呈现面 = digest |
| D-3 | 频道名 `sub:<role>#<id>` 与 chunk 路由契约**不变** | 否决"频道加代际后缀"——会连带改频道命名/子标挂载/CLI 面板路由，超出本批可见性范围 |
| D-4 | 终态补块限"family 角色 + 合法 id" | 否决"无条件建块"——非法/未知 role 的消息仍应丢弃（否则流内出现无法解读的块） |
| D-5 | 队列上界 200 + 溢出丢最旧 + 留痕 | 否决无界队列（暗窗口长期不结束时内存无界） |
| D-6 | 清屏后再断言与 `resetActivity` **同 tick、随 `historyPage` 之后投递**（期望位置 = 流尾） | 否决"紧跟 clearMessages"（块先建、历史后插——位置靠 history 锚插的隐含行为保证，非显式序）；否决"延迟一拍"（与历史渲染交错 → 错序块） |

#### 5.1.6 受影响文件全清单（VSC 端——行数口径 = `wc -l`；as-of 2026-09-11）

| 文件 | 现行行数 | 预计增量 | 改动 |
|---|---|---|---|
| `webview/activity.js` | 204 | +45 | 新代接管 / 终态补块 / `S._subTraceLog` 单一写点 / 头部机制注释更新 |
| `webview/state.js` | 113 | +3 | `_subTraceLog: []` + 环形上界常量 |
| `webview/streaming.js` | 244 | ±5 | 接管后 chunk 落块语义注（确认项；若需守卫 ≤+8） |
| `src/extension/panel-callbacks.mjs` | 148 | +30 | `postSubagentEvent`（直投/入队）+ 上界与 `ev:subdeliver` 留痕 + `onSubagent` 接线 |
| `src/extension/panel-messages.mjs` | 455 | +14 | `webviewReady` case：`_wvReady=true` + flush + 再断言（排于 `openSessionContent` 之后——§5.1.4 第 2 条） |
| `src/extension/panel-session.mjs` | 332 | +8 | `historyPage` 后同 tick 再断言（§5.1.4 第 4 条——期望位置 = 流尾） |
| `src/extension/chat-panel.mjs` | 414 | +3 | view dispose → `_wvReady=false` + 清队（跨 view 不串味） |
| `src/extension/suspension.mjs` | 313 | +22 | `reassertLiveChildren(panel)` + 存活投影（双池 → `subagent` 载荷）——与 `backgroundStatus` 同板块 |
| `test/async-visibility.test.mjs`（新） | 0 | +170 | 队列/再断言（桩面板）+ 接管/补块/清屏恢复（happy-dom 真模块） |
| `test/files.mjs` | 49 | +1 | 新测试文件登记（接线硬项——沿用第 5 批先例） |
| `test/activity-flow.test.mjs` | 300 | +40 | 既有语义回归（幂等/冻结/窗裁/tombstone）；**「reload 无恢复」用例按新口径改写**（终态补桩——原 no-op 断言更替）。**拆分评审**：300→~340 越 ≤300 警示线（≤500 硬限内）——测试族存量 6 档同带（最高 `chat-panel.test.mjs` 620）——结论 = 本批不拆分（改写就地；测试族重组归独立项） |
| `docs/design/WEBVIEW.md` | 339（批次前）→ 536（本批落档后） | +~197（见行数差——含修正轮） | 本节 + §5 终态规则修订指注 |
| 合计 | — | ~+538（代码面 ~+130 = src 8 文件求和；测试面 ~+211；文档面 ~+197——见行数差） | 11 改 + 1 增 |

#### 5.1.7 用例表（正常 / 边界 / 错误）

| # | 用例 | 输入 | 预期输出（可机判） | 需求回指 |
|---|---|---|---|---|
| T-V1 | 双 spawn 背靠背出生（22:32 基例） | 两条 `started`（不同 id，pool:true） | 2 个 live 块（`data-subname` 唯一）+ 各挂 ⏹ | F-A1/F-A3 |
| T-V2 | 重名新代接管 | 冻结 `sub:eng-coder#4` 在场 → 新 `started` #4 | 新 live 块出生（map 键重绑）+ 痕迹 `takeover` + 旧块仍在流内冻结 | F-A3 |
| T-V3 | 清屏后再断言（含位置） | `clearMessages` → `historyPage`（末页 N 条）→ 再断言；存活池（1 running + 1 queued） | 重建块 `pool:true`（⏹ 在）+ async 词 + `startedAt` 保留；queued 得 ⏳ 头；**位置断言：重建块位于末页 history 消息之后（流尾）** | F-A4/F-A5 |
| T-V4 | 终态补块（never-born） | 无块的 `sub:explore#7` 收 `done`（family + 合法 id） | 补出**已折叠**块 + 痕迹 `late-terminal-stub` | F-A2 |
| T-V5 | 补块边界（不补桩行） | ① role 未知 ② id 缺失 ③ 非法频道名 ④ `answered` 无块 ⑤ `cancelled(was:"queued")` 无块 | 五者一律 no-op（零新块）；① 留 `drop-unknown-role`；④⑤ 保 §5 既有裁决（§5.1.4 第 6 条成员表不补桩行） | F-A2 边界 |
| T-V6 | 暗窗口队列（主侧） | `_wvReady=false` 期投 2 出生 + 1 终态 → `webviewReady` | 按序 flush 3 条 + 其后再断言仅存活者；`ev:subdeliver` 计数对 | F-A1 |
| T-V7 | 溢出与清队（边界） | 未就绪期投 >200 条 → view dispose | 丢最旧 + 留痕；dispose 后队列空（跨 view 不串味） | F-A1/NFR-A2 |
| T-V8 | 零回归（红线） | 既有 activity-flow 全族（幂等/冻结/150 窗/tombstone） | 除「reload 无恢复」用例按新口径改写外原断言全绿；改写行 = 终态补桩新语义（consult 非 family 仍 no-op）；「answered 无块」用例原断言保真 | NFR-A1 |

#### 5.1.8 验收标准（逐条回指需求——每条可机器验证）

- **AC-A1**（F-A1/F-A3）= T-V1：两条不同 id `started` → `#messages > .sub-block.sub-live` 计数 == 2。
- **AC-A2**（F-A3）= T-V2：重名 `started` → `S._subBlocks.get("sub:eng-coder#4")` 指向**新**元素且 `_subMeta.frozen === false`；`S._subTraceLog` 含 `takeover`。
- **AC-A3**（F-A2）= T-V4/T-V5：never-born **补桩行**（done/error/运行中 cancelled/terminated/failed）→ 新块且 `_subMeta.frozen === true`、头词含 done/stopped/error；**不补桩行**（§5.1.4 第 6 条成员表：role 未知/非 family/id 缺失/非法频道/answered 无块/queued-cancel 无块）→ `#messages > .sub-block` 计数不变。
- **AC-A4**（F-A4/F-A5）= T-V3：清屏后再断言 → 重建块 `_subMeta.pool === true` 且 `block.querySelector(".sub-stop-btn")` 非空；重建块位于末页 history 消息**之后**（位置断言——流尾）。
- **AC-A5**（F-A1/NFR-A2）= T-V6/T-V7：未就绪期投递全入队；就绪后按序 flush + 再断言；溢出丢最旧且 `ev:subdeliver` 记丢弃计数。
- **AC-A6**（NFR-A1）= 机检：`src/**` 内 `postPoolSnapshot` / `SNAPSHOT_ROLES` grep 零命中（保持现状）。
- **AC-A7**（NFR-A3）= VSC `test/run-fast.mjs` 全绿 + `test/files.mjs` 新档在册；CLI 仓本条目零代码改动（`git status` 断言）。
- **AC-A8**（NFR-A2/文档面）= 本节 + §5 指注 + 变更记录一行在位；`node scripts/check-doc-width.mjs` 新增超宽 0。

#### 5.1.9 边界（本批不做）

- 不做 CLI TUI 块机制改动（CLI 无 webview；`⟦ev⟧` 通道语义独立）。
- 不做已消化/settled 任务的回填重建（呈现面 = digest）。
- 不改频道命名法 / chunk 路由 / 子标挂载。
- 不重做池快照（`REMOVE-POOL-SNAPSHOT` 语义保持——见 §5.1.3 边界核对）。
- 不改 150 窗裁剪与冻结幂等语义。
- **NFR-A2 痕迹范围声明（评审 #4 收口）**：痕迹集（§5.1.4 第 7 条）覆盖**出生事件面**——同名接管 / 无块终态补桩 /
  未知·非法 role 丢弃三类；`queued` 事件遇**已冻结键**（或 live-tombstone）的丢弃 = **陈旧/重名窗口**事件
  （新代可见性由后续 `started` 接管保证——§5.1.4 第 5 条；queued 分支维持现状）——不补痕
  （tombstone 丢弃语义不变亦见 NFR-A1；需求档 NFR-A2 已同步范围句）。

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
- **挂起 UI**：settle 视同 done 即时折叠（§5——无驻留无锚插——digest done 补发被幂等
  守卫吞——惰性 no-op）；状态行（⏳ 后台 N 子代理 + 待消化计数——`_suspCounts`——子代
  理计数徽标已撤）；输入框永不锁（loading.js）；send 拦截保留
  （`isRunning`——Enter/发送按钮拒发——输入框不禁——可继续录入）。Stop 只在 running 显
  （susp 纯池跑不显——子代理停止靠流内逐块 ⏹——F-6）。
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
  徽标已随行面板撤除（SESSION-ACTIVITY-REVISED 评审 #2——计数由状态行挂起段承担——无徽标开关面）。
- **Stop running 派生（F-6——SESSION-ACTIVITY-REVISED 评审 #1 定论——收窄 A3 的
  state≠idle）**：abort 按钮可见性 = `S._turnState === "running"` **派生**——running
  （回合/标题窗口/会话内 digest 起跑/Reload 冷启重推）常显——**susp（纯后台池跑——
  主空闲——digest 间等待/释放窗口）不显**（无全停按钮——池空自然消化完——CLI 对拍）；
  loading:true/false 不再隐/显 abort（修 digest 间按钮闪烁 + running 窗口隐藏）。
  Stop 作用收窄：host abort case 只停主会话当前 controller（digest 轮 controller——
  newTurnController 每回合新建）——不再全链中止挂起会话（废除 D-S9——`_suspWake`/
  `abortControllers` 全停路径删除——子代理停止靠流内逐块 ⏹（running+pool 停 + queued
  头取消 ⏹——F-2 QUEUED-VISIBILITY 保留）——cancelSubagent 定向 abort）。

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
- 2026-09-11：VSC-ASYNC-VISIBILITY 条目 A 设计落档——新增 §5.1（出生投递与块身份可靠性：
  根因收口 R-1~R-5 / 两案选型 / 契约 8 条 / 12 文件受影响表 / T-V1~V8 / AC-A1~A8）+ §5 终态
  规则修订指注（never-born 终态补块防御）。实施待设计评审 + 用户批准。
- 2026-09-11：同批修正轮（设计评审轮次 1 后——10 项采纳落档）——§5.1.4 第 6 条改**桩集精确成员表**
  （answered / queued-cancel 显式不补桩）+ 第 2/4 条再断言位置定序（期望位置 = 流尾）+ 第 1 条族边界
  （reclaim 直投不迁移）+ 第 3 条载荷补 role/id + 第 7 条痕迹范围指针 + D-6 改口 + §5.1.6 计数勾稽
  （代码面 ~+130 / 8 文件 / 行数口径）+ §5.1.9 痕迹范围声明 + T-V3 位置断言 / T-V5 不补桩行扩例。
- 2026-09-09：ACTIVITY-REWRITE-SIMPLE 锚段（活动块去加戏重写）——§2 布局改四行垂直序
  （活动区容器删——grid 五行→四行）+ §3 activity 模块行同步（freeze 并入 activity.js——
  activity-freeze.js 删——簿记删）+ §5 全节重写（块出生即 #messages 流尾 · 原地折叠——
  终态集合闭合/settled 视同 done/queued ⏳ 头含取消 ⏹/无 DOM move/无 preview/无 ticker/
  无跨 reload 恢复——live/冻结出生即计 150）+ §6 挂起 UI + §8.4 子代理停句同步（活动区
  措辞清——queued 取消 ⏹ F-2 保留）。
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
