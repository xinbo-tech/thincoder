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

**垂直序（自顶向下）**：session-bar（项目/会话切换）→ `#messages` 滚动区（对话流——
含 digest 文本与一切会话内容）→ **活动区 `#subagent-activity`**（子代理/consult/
advisor-async 活动块全程驻留——live 固定可见，不随会话流滚动丢失——2026-09-11 回归
现行，机制 §5/§12）→ 行面板区（`#goal-panel`/`#task-panel`）→ 输入区（`#toolbar`）。

CSS 布局规则落 `webview/base.css` 的 grid 行模板：

```
#chat-container { grid-template-rows: auto minmax(0, 1fr) auto auto auto; height: 100%; }
```

行模板对应垂直序：header(session-bar) / `#messages`(1fr) / `#subagent-activity`(auto) /
`#panels`(goal/task，auto) / `#toolbar`(输入，auto)——后三层均 auto，隐藏项不占高 →
消息区高度 = 容器 − 活动区 − 面板 − 输入（grid 1fr 自动吸收）。

- 消息区钉底/滚动语义限定 `#messages` 内；`#messages` `overflow-y:auto` +
  `overscroll-behavior:contain`；活动区独立自滚 + pin（§12.3 第 6/7 条——不与消息区互拉）。
- **活动区**：`#messages` 与 `#panels` 之间（`index.html`——`role="region"`）；**空区
  隐藏零高**（CSS `:empty`——零显隐 JS 机制）；自适应块内容、`max-height:32vh` 封顶 +
  区内自滚（`overflow-y:auto` + `overscroll-behavior:contain`）。
- 子代理活动块为 `#subagent-activity` 直接子元素（区尾出生）。**2026-09-12 收口（§14）**：
  区驻留期（live + awaitingDigest）不移动；**终态消化回收后归档落流 `#messages`**（普通
  终态即时归档）——`#messages` 内 `.sub-block` = 归档块；150 块裁剪计数含 `.sub-block`
  （`trimOldMessages` + 逐字一行）；懒历史锚选择器同含（`history.js`）。
- **区内保留上限退役**（2026-09-12 §14 C-6）：区居民 = live + awaitingDigest（有界）——
  `MAX_REGION_FOLDED`/`enforceRegionCap` 已删除（原 §12.3 第 4 条由 C-6 取代；删除记录 = §14 C-6）。
- 沿革（§15 变更记录）：2026-09-09 前段活动区回归（SESSION-ACTIVITY-REVISED）→ 2026-09-09
  后段整体去加戏回退流尾（ACTIVITY-REWRITE-SIMPLE）→ 2026-09-11 活动区回归
  （**干净地基**——旧加戏链不复活——§12.4 对照表）→ 2026-09-12 收口批（**A 方案反转**：
  终态清退 + 消化后落流——§14）。

shell 结构 `webview/index.html`：`#chat-container` 内含 `#session-bar` / `#messages` /
`#subagent-activity`（活动区——§12）/ `#panels`（goal/task 两个行面板）/ `#toolbar`（`#status-line` + `#input-row`(attach/
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
- `activity.js`（编排层——2026-09-11 §12 + **2026-09-12 §14 收口**：ensureBlock（块 append
  活动区 `#subagent-activity` 区尾——终态幂等守卫返 null） + applySubagentStatus 三态机
  （queued ⏳ 头含取消 ⏹/started 翻 running/**settled → awaitingDigest 驻留**/其余 status
  终态折叠并归档落流（§14 C-1–C-3；第 10 批修订——现行权威，见 §5/§5.1；补桩集 = §5.1.4 第 6 条）——lookup-only 绝不建块） + 归档 archive（轮边界/尾追双落点） +
  resetActivity（**只清区**——§14 C-7）+ freezeLiveBlocks（suspension 退出兜底——**区全体归档** §14 C-8）+ refreshLiveHeaders（2s 头刷新入口——
  §14 C-11④；**实现后同步（2026-09-12）**：归属更正——实落 `activity.js:375`）——导出消费面：panels/chat/streaming）
- `activity-view.js`（呈现叶——refreshBlock/updateStopButton/noteChunk——块头/状态词/⏹
  ——区显隐/pin/ticker 已删（2026-09-11 §12：区显隐 = CSS `:empty`；区 pin 在 ui.js 滚动族）；
  **2026-09-12 §14 增补**：awaiting 态词 · queued 信息（position/原因）· tool+cmd 状态区 ·
  turn 进展（归属更正——**实现后同步（2026-09-12）**：原记 `refreshLiveHeaders` 在本叶，实落
  `activity.js:375`——本叶不含该入口）——leaf：i18n only——不依赖核心）
- `panels.js`（goal/task 面板 + 挂起态 + 桥路由；簿记 map 已删——handleSubagentMessage
  纯转发 applySubagentStatus——ACTIVITY-REWRITE-SIMPLE）
- `send.js`/`loading.js`（输入门 + 永不锁挂起分支）、`mode-buttons.js`（ENG/GUARD/
  AUTO/PLAN 按钮）
- `permission.js`/`question.js`（权限弹窗/批确认/question 卡）
- `diff.js`、`settings-*.js`、`model-picker.js`/`model-menu.js`、`history.js`（懒历史
  滚动）、`autocomplete.js`、`search.js`、`scroll.js`、`status-bar.js`、
  `i18n.js`/`i18n-dom.js`、`session-bar.js`、`onboarding.js`、`highlight.js`、
  `input.js`、`lib.js`、`toast.js`（瞬时提示共享模块——第 28 批）
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

## 5. 子代理活动块（区驻留 → 消化后落流——2026-09-12 收口现行机制）

子 agent/consult/escalate/advisor-async 活动块**出生即 append 到固定活动区
`#subagent-activity` 区尾**（messages 与输入之间——`ensureBlock`——label = channel 去掉
`sub:` 前缀）。**生命周期 live → frozen 两态不变**——终态原地折叠后**消化回收即归档落流**
（**2026-09-12 收口批 §14**：普通终态即时归档尾追；settled → awaitingDigest 驻留带提示、
回收时归档至消化轮边界之前）。位置三度更替（活动区 → 流尾 → 活动区 → **消化后归档入流**），
**两态机与块身份语义始终不变**；活动区布局与机制权威 = §14（布局承 §2；§12 为沿革与反转注）。

- **live 块（区内）**：live 头 = `[▶ key · sync/async · model · Ns · turn]` + 状态词
  （工具+参数摘要 / thinking…——事件驱动；**2026-09-12 §14 C-11**：tool chunk 结构化
  `tool`/`cmd` → `${tool} — ${cmd ≤60}`；`status:"turn"` 帧实时 `turn N/M`；elapsed 经既有
  2s `_panelTimer` 刷新——**无 per-block ticker**）；open 可展开内容。⏹ 覆盖按钮：
  running + pool 条目（started `pool:true` 区分同步 spawn——同步 spawn 无 ⏹——随首 chunk
  建块）。嵌套子标（`chunk.sub`——如 `explore#1`）行首 dim 归属照旧（appendAdvisorChunk
  原样——ui.js 零改动）。
- **queued（区内 ⏳ 等待头——F-2 QUEUED-VISIBILITY 保留）**：排队 spawn 消息即建头
  `[⏳ key]` + **2026-09-12 §14 C-11②：状态区补位置/原因**（slot → `排队中 · 位置 N（槽满等位）`；
  依赖/冲突等位 → host detail 原文——载荷 `position`/`waiting`/`reason` 入 `meta.queueInfo`）
  ——**挂取消 ⏹**（标签键 `sub.cancelQueueBtn`——取消沿既有 `cancelSubagent` 路径——协议零改）；
  started 到达 → 同块翻 running（清 queueInfo；⏹ 换 stop 标签）；cancelled（was:"queued"）→ 头移除
  （从未启动——不冻结）。
- **终态折叠 + 归档落流（终态集合闭合——F-1；2026-09-12 §14 C-1/C-3 修订）**：任何非
  queued/started 的 status 一律终态——class sub-live→sub-frozen + open=false + ⏹ 移除 +
  头词换；**settled → awaitingDigest 驻留**（头词 `done · awaiting digestion` 对位——C-2；
  不归档）；**其余终态（done/error/cancelled/answered/terminated/failed…）折叠后即时归档**
  至 `#messages` 尾；**answered 有块折叠（无块 no-op）**；**终态/trim 路径 lookup-only**——
  never-born 终态防御 = §5.1.4 第 6 条桩集精确成员表（补桩 = 折叠 + 立即归档——C-5）。
- **幂等守卫（单 map 单守卫）**：S._subBlocks 键 = 频道名——map 有键且已终态 →
  ensureBlock 返 null（迟来消息丢弃——不复活不重建）；map 有键且 live → 返回既有元素
  （重复 started/queued 覆盖式刷新头词不重挂）；map 无键 → 建块 append 区尾。**新代接管
  / 终态补桩 / 诊断痕迹**为第 10 批语义（§5.1——本批零改）。
- **区内保留上限退役（2026-09-12 §14 C-6——原 §12.3 第 4 条/D-A2 废止）**：区居民 = live +
  awaitingDigest（预算 = 并发子代理数 + 队列——池有界 + 回收即清）；`MAX_REGION_FOLDED`（已删除——删除记录 = §14 C-6） /
  `enforceRegionCap` 已删除（删除记录 = §14 C-6）；簿记守卫语义不变（终态条目保留作幂等守卫——resetActivity 才清）。
- **resetActivity**（回合中止无挂起会话/会话清；2026-09-12 §14 C-7 收窄）：**只清区子树
  （live + awaitingDigest）+ 清 map** + 区子树内防御孤儿清——流内归档块（会话历史）不动；
  `clearMessages` = `#messages` 全清（归档块随清）+ 本函数。块不跨 reload
  （SESSION-RESTORE-PARITY：块不入 history——消息流是历史）。
- **会话退出 freeze 兜底**（suspension active:false + freeze:true；2026-09-12 §14 C-8）：
  `freezeLiveBlocks` → **区全体归档**（live → 折叠；awaitingDigest → 归档；尾追）——
  host 既定注释语义「补发 done 冻结：随会话退出折叠进流」（suspension.mjs:328-330）的兑现；
  CLI freezeAllSubTasks 中断语义：不留悬空块。
- **150 块 DOM 裁剪（2026-09-12 §14 修订——T-CL9）**：归档后块在 `#messages`——
  `trimOldMessages` 计数选择器含 `.sub-block`（归档块随窗出窗）；懒历史锚选择器同含
  （`history.js` 两处）；区驻留块不计（不在其容器）。
- **report preview / appendPreview 已删**（F-3——折叠块自身 header + tail-3 dim 摘要即
  呈现面——内容保留可展开）；**per-block ticker / 旧 DOM-move 锚链 / 旧 settle 驻留双态仍禁**
  （2026-09-12 §14 C-1/C-3 为**新干净机制**——逐项对照见 §14.4；§12.4 为沿革名单）。
  行面板（子代理行 + consult 计数/回复 preview）已随 SESSION-ACTIVITY-REVISED F-3 全撤
  （历史）；👥 计数由状态行 `_suspCounts` 承担（susp.running/susp.digesting 键）。

### 5.1 出生投递与块身份——可靠性设计（2026-09-11 第 10 批）

> 需求：`AGENT-LOOP（CLI 仓·需求）` §3（F-A1~F-A5 + NFR-A1~A3）（CLI 侧文档树）。
> 本机一条目（条目 A）——纯 VSC 面；条目 B（后台评审池接入面）在 `AGENT-LOOP（CLI 仓·设计）` §18（CLI 侧）。
> 批次：`2026-09-11-VSC-ASYNC-VISIBILITY（本仓）`（CLI 侧；§1 条目 A——用户 2026-09-09 反馈 + 22:32 精复现）。

#### 5.1.1 问题陈述

用户实证（2026-09-09）："实际启动了但不能可靠显示 live 块"——**普遍时有时无**（非 advisor-only：
第一次 advisor 没出现、explore 也没出现、后来 advisor 又出现）。**2026-09-09 22:32 精确复现**：同一响应
双 spawn 两个 eng-coder → 扩展侧池计数 **2 running**（计数正确）→ webview **只渲染 1 个 live 块**；
正常会话内可复现（与 reload 无关）。

#### 5.1.2 根因收口（受控复现驱动——happy-dom 驱真 webview 模块）

**复现手法**（可重跑）：`test/helpers/webview-env.mjs` `setupWebview()` + `installChatFixture()` →
动态 import 真 `webview/activity.js`、`webview/streaming.js` → 直接投喂 `subagent` 消息 → 数
`#subagent-activity > .sub-block`（2026-09-11 §12 修订——块出生地 = 活动区）。

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
   补发为**直投、不入队**——它是 “已消化块归档回收”通知（webview 端行为 = 归档落流——
   2026-09-12 §14；服务**既有**块的收尾，非出生事件；投递场景 = 活会话消化流，
   webview 就绪）；若入队跨暗窗口补投，会为**已消化**任务补出折叠桩，与 §5.1.9「已消化不回填」边界冲突。
2. **就绪握手（既有机制，新增两拍）**：webview 脚本起手投 `{type:"webviewReady"}`（`chat.js:318`）→
   host `webviewReady` case（`panel-messages.mjs:396`）**新增**：`_wvReady = true`；两拍 **flush（保持入队序）→
   `reassertLiveChildren(panel)`** 排在 case 内既有推送与 `openSessionContent(panel)`（内部序含 clearMessages →
   historyPage——§8.5）**之后**（后置理由：clearMessages 抹块（`#messages` 清 + §12 活动区清）+ resetActivity 清簿记——先投的出生事件必被清屏抹掉；
   两拍后块恒落**区尾**——2026-09-11 §12 修订。序固定：flush 终态先落，再补活着——投影本不含已终态者，故不重复）。
3. **存活投影（单一事实源 = 与 ⏹ 路由同源）**：`reassertLiveChildren(panel)` 读 `panel._liveLines ?? panel._susp?.lines`
   的 `history._asyncSubagents` / `history._asyncAdvisors`（与 `panel-messages.mjs:229-231` 的 ⏹ 定位**同一来源**）：
   `running` → 发 `subagent` `{status:"started", role, id, pool:true, model, startedAt}`；`queued` → 发
   `{status:"queued", id, role, position}`（两侧 role/id 必带——建块/接管守卫依赖；其余字段复用既有载荷全形状）。
   **只发 live（running/queued）**——settled/已消化不在投影内（呈现面 = 终态消息 / digest）。
4. **清屏后再断言（主侧）**：`loadSession`（`panel-session.mjs`）在 `clearMessages`（:155）与 `historyPage`
   （`sendHistoryPage` :159→:197）**之后同 tick** 调 `reassertLiveChildren(panel)`——**期望位置 = 活动区流尾**
   （与 §12「出生即区尾」同规；显式定序——2026-09-11 §12 修订：块出生地 = `#subagent-activity`，其余不变）。
5. **新代接管（webview）**：`applySubagentStatus` 的 `started` + `pool:true` 分支——命中 map 中同名**已冻结**条目 →
   **建新块并接管键**（旧冻结块以 DOM 留在区内作历史——2026-09-11 §12 修订；**2026-09-12 §14 C-5 再修订**：
   旧 awaitingDigest 块即时归档、已归档块在流内作历史；记 `takeover` 痕迹）。`queued` 分支维持现状（后续 `started` 接管）。
   **显式取舍**：接管后该频道的**迟到 chunk 会落进新块**——仅当"id 重复 + 两实例消息交错"才可见（id 单调由
   `SUBAGENT-ID-COUNTER-AGENT` 保证；接管是最后一道防御）。**代价登记在案，不静默**。
   （**2026-09-12 §14 C-5③ 修正轮 #5 注**：旧代回收 `done` 命中新代 live 块的失明面 + 「旧代回收在途」
   吞机制——全量见 §14 C-5③。）
6. **终态补块（webview）——桩集 = 精确成员表**（有 map 条目者不受本表影响——既有折叠/守卫语义见 §5）：
   无 map 条目时按表判定；前置 = `role ∈ FAMILY_ROLES` + `id != null` + 频道名合法（不满足 → no-op，记 `drop-unknown-role`）：

   | status | 上下文 | 无块时 | 折叠 kind | 依据 |
   |---|---|---|---|---|
   | done / settled | — | **补桩**（立即折叠 + **立即归档**（§14 C-5）+ 记 `late-terminal-stub`） | done | F-A2（settled 视同 done——§5） |
   | error | — | **补桩** | error（错误注记随头） | F-A2 |
   | cancelled | `was ≠ "queued"`（运行中取消，含 `was` 缺省） | **补桩** | stopped | F-A2 |
   | cancelled | `was === "queued"`（从未启动） | **不补**（no-op） | — | §5 既有裁决（头移除——从未启动不冻结） |
   | terminated | — | **补桩** | stopped | F-A2 |
   | failed | — | **补桩** | error | F-A2 |
   | answered | — | **不补**（no-op） | — | §5 既有裁决（有块折叠、无块 no-op——回复走 digest 逐字呈现） |
   | 前置不满足（role 不明 / 非 family 角色如 consult·escalate / id 缺失 / 非法频道） | — | **不补**（no-op） | — | D-4（非法/未知丢弃）；consult 键嵌 model——既有用例锁定 |

   补桩头词 = `[✓/⏹ key · done/stopped …]`（error → 错误注记随头；2026-09-12 §14 C-5：补桩 = 折叠 + 立即归档——流内可见）。非终态不属本表：`started` + pool:true + family →
   出生/接管（第 5 条）；同步 spawn（`pool` 缺省）无块 → 随首 chunk 建块（§5 既有）；`queued` 出生 → 建 ⏳ 头（既有）。
   **§5 原句"终态/trim 路径 lookup-only 绝不建块"由此修订**（依据复核见 §5.1.2 的 R-1/R-3 行：
   `subagent` 族消息只会是本次会话的活事件；answered / queued-cancel 为表内显式不补桩行——§5 裁决保真）。
7. **诊断留痕**：webview 侧 `S._subTraceLog`（环形末 50 条——`activity.js` 单一写点）记 `takeover` /
   `late-terminal-stub` / `drop-unknown-role` 三类（范围 = 出生事件面——声明见 §5.1.9）；主侧
   `logEvent("ev:subdeliver", {...})` 记入队/出队/丢弃计数。
8. **协议零新增**：不新增消息类型（复用 `subagent` 既有载荷形状）；`toolPanel` chunk 语义零变化（§7.2 表不动）。
   （**2026-09-12 活动区收口批修订**：本条 = 当时批口径——该批新增 `statusText`/`turnFrame` 消息 +
   `toolPanel` 增 `tool`/`cmd` 字段；§7.2 表随之补行（§14 C-11/C-12）。）

#### 5.1.5 关键决策记录（含否决备选）

| # | 决策 | 否决备选 / 理由 |
|---|---|---|
| D-1 | 采纳"出生事件队列化 + 状态再断言" | 否决"逐处补门控"（案 A）——门控只防已知路径，R-1/R-3 的缺失面在 webview 视野之外 |
| D-2 | 再断言**只带 live 条目** | 否决"扩 settled 驻留重建"——与 REMOVE-POOL-SNAPSHOT 的"过度工程"判定冲突；settled 呈现面 = digest |
| D-3 | 频道名 `sub:<role>#<id>` 与 chunk 路由契约**不变** | 否决"频道加代际后缀"——会连带改频道命名/子标挂载/CLI 面板路由，超出本批可见性范围 |
| D-4 | 终态补块限"family 角色 + 合法 id" | 否决"无条件建块"——非法/未知 role 的消息仍应丢弃（否则区内出现无法解读的块） |
| D-5 | 队列上界 200 + 溢出丢最旧 + 留痕 | 否决无界队列（暗窗口长期不结束时内存无界） |
| D-6 | 清屏后再断言与 `resetActivity` **同 tick、随 `historyPage` 之后投递**（期望位置 = 区尾——2026-09-11 §12 修订） | 否决"紧跟 clearMessages"（块先建、历史后插——位置靠 history 锚插的隐含行为保证，非显式序）；否决"延迟一拍"（与历史渲染交错 → 错序块） |

#### 5.1.6 受影响文件全清单（VSC 端——行数口径 = `wc -l`；as-of 2026-09-11）

| 文件 | 现行行数 | 预计增量 | 改动 |
|---|---|---|---|
| `webview/activity.js` | 204 | +45 | 新代接管 / 终态补块 / `S._subTraceLog` 单一写点 / 头部机制注释更新 |
| `webview/state.js` | 113 | +3 | `_subTraceLog: []` + 环形上界常量 |
| `webview/streaming.js` | 244 | ±5 | 接管后 chunk 落块语义注（确认项；若需守卫 ≤+8） |
| `src/extension/panel-callbacks.mjs` | 148 | +30 | `postSubagentEvent`（直投/入队）+ 上界与 `ev:subdeliver` 留痕 + `onSubagent` 接线 |
| `src/extension/panel-messages.mjs` | 455 | +14 | `webviewReady` case：`_wvReady=true` + flush + 再断言（排于 `openSessionContent` 之后——§5.1.4 第 2 条） |
| `src/extension/panel-session.mjs` | 332 | +8 | `historyPage` 后同 tick 再断言（§5.1.4 第 4 条——期望位置 = 区尾；2026-09-11 §12 修订） |
| `src/extension/chat-panel.mjs` | 414 | +3 | view dispose → `_wvReady=false` + 清队（跨 view 不串味） |
| `src/extension/suspension.mjs` | 313 | +22 | `reassertLiveChildren(panel)` + 存活投影（双池 → `subagent` 载荷）——与 `backgroundStatus` 同板块 |
| `test/async-visibility.test.mjs`（新） | 0 | +170 | 队列/再断言（桩面板）+ 接管/补块/清屏恢复（happy-dom 真模块） |
| `test/files.mjs` | 49 | +1 | 新测试文件登记（接线硬项——沿用第 5 批同口径） |
| `test/activity-flow.test.mjs` | 300 | +40 | 既有语义回归（幂等/冻结/窗裁/tombstone）；**「reload 无恢复」用例按新口径改写**（终态补桩——原 no-op 断言更替）。**拆分评审**：300→~340 越 ≤300 警示线（≤500 硬限内）——测试族存量 6 档同带（最高 `chat-panel.test.mjs` 620）——结论 = 本批不拆分（改写就地）；**同族超限档 `test/chat-panel.test.mjs`（621 > 500 硬限）**：**本批拆**（F12 硬限无豁免；LEDGER-SELF-CONTAINED 批）——拆档实施 = **已落**（实施轮 E）：余档 `test/chat-panel.test.mjs` **270** 行 / 9 例 · 新档 `test/chat-panel-messages.test.mjs` **373** 行 / 8 例——守恒 **17 = 8 + 9**；`test/files.mjs` 登记 +1 |
| `docs/design/WEBVIEW.md` | 339（批次前）→ 536（本批落档后） | +~197（见行数差——含修正轮） | 本节 + §5 终态规则修订指注 |
| 合计 | — | ~+538（代码面 ~+130 = src 8 文件求和；测试面 ~+211；文档面 ~+197——见行数差） | 11 改 + 1 增 |

#### 5.1.7 用例表（正常 / 边界 / 错误）

| # | 用例 | 输入 | 预期输出（可机判） | 需求回指 |
|---|---|---|---|---|
| T-V1 | 双 spawn 背靠背出生（22:32 基例） | 两条 `started`（不同 id，pool:true） | 2 个 live 块（`data-subname` 唯一）+ 各挂 ⏹ | F-A1/F-A3 |
| T-V2 | 重名新代接管 | 冻结 `sub:eng-coder#4` 在场 → 新 `started` #4 | 新 live 块出生（map 键重绑）+ 痕迹 `takeover` + 旧块仍在区内冻结（2026-09-11 §12 修订；**2026-09-12 §14 C-5：旧块若为 awaitingDigest → 即时归档**） | F-A3 |
| T-V3 | 清屏后再断言（含位置） | `clearMessages` → `historyPage`（末页 N 条）→ 再断言；存活池（1 running + 1 queued） | 重建块 `pool:true`（⏹ 在）+ async 词 + `startedAt` 保留；queued 得 ⏳ 头；**位置断言：重建块位于活动区（区尾——2026-09-11 §12 修订；2026-09-12 §14：本断言面 = 重建块入区——归档块可存于 `#messages`）** | F-A4/F-A5 |
| T-V4 | 终态补块（never-born） | 无块的 `sub:explore#7` 收 `done`（family + 合法 id） | 补出**已折叠**块 + 痕迹 `late-terminal-stub`（**2026-09-12 §14 C-5：折叠 + 立即归档——采样点 = 流内**） | F-A2 |
| T-V5 | 补块边界（不补桩行） | ① role 未知 ② id 缺失 ③ 非法频道名 ④ `answered` 无块 ⑤ `cancelled(was:"queued")` 无块 | 五者一律 no-op（零新块）；① 留 `drop-unknown-role`；④⑤ 保 §5 既有裁决（§5.1.4 第 6 条成员表不补桩行） | F-A2 边界 |
| T-V6 | 暗窗口队列（主侧） | `_wvReady=false` 期投 2 出生 + 1 终态 → `webviewReady` | 按序 flush 3 条 + 其后再断言仅存活者；`ev:subdeliver` 计数对 | F-A1 |
| T-V7 | 溢出与清队（边界） | 未就绪期投 >200 条 → view dispose | 丢最旧 + 留痕；dispose 后队列空（跨 view 不串味） | F-A1/NFR-A2 |
| T-V8 | 零回归（红线） | 既有 activity-flow 全族（幂等/冻结/150 窗/tombstone） | 除「reload 无恢复」用例按新口径改写外原断言全绿；改写行 = 终态补桩新语义（consult 非 family 仍 no-op）；「answered 无块」用例原断言保真 | NFR-A1 |

#### 5.1.8 验收标准（逐条回指需求——每条可机器验证）

- **AC-A1**（F-A1/F-A3）= T-V1：两条不同 id `started` → `#subagent-activity > .sub-block.sub-live` 计数 == 2（采样点改区——2026-09-11 §12 修订）。
- **AC-A2**（F-A3）= T-V2：重名 `started` → `S._subBlocks.get("sub:eng-coder#4")` 指向**新**元素且 `_subMeta.frozen === false`；`S._subTraceLog` 含 `takeover`。
- **AC-A3**（F-A2）= T-V4/T-V5：never-born **补桩行**（done/error/运行中 cancelled/terminated/failed）→ 新块且 `_subMeta.frozen === true`、头词含 done/stopped/error（**2026-09-12 §14 C-5：补桩 = 折叠 + 立即归档**）；
  **不补桩行**（§5.1.4 第 6 条成员表：role 未知/非 family/id 缺失/非法频道/answered 无块/queued-cancel 无块）→ `#subagent-activity > .sub-block` 计数不变（采样点改区——2026-09-11 §12 修订）。
- **AC-A4**（F-A4/F-A5）= T-V3：清屏后再断言 → 重建块 `_subMeta.pool === true` 且 `block.querySelector(".sub-stop-btn")` 非空；重建块位于**活动区**（位置断言——区尾；2026-09-11 §12 修订：块出生地 = `#subagent-activity`）。
- **AC-A5**（F-A1/NFR-A2）= T-V6/T-V7：未就绪期投递全入队；就绪后按序 flush + 再断言；溢出丢最旧且 `ev:subdeliver` 记丢弃计数。
- **AC-A6**（NFR-A1）= 机检：`src/**` 内 `postPoolSnapshot` / `SNAPSHOT_ROLES` grep 零命中——已退场（段删——2026-09-12-PROSE-ANCHOR-RETIRE；删除记录 = `TESTING.md` §8.1）；现体 = 本档在册断言（`test/files.mjs`）保留。
- **AC-A7**（NFR-A3）= VSC `test/run-fast.mjs` 全绿 + `test/files.mjs` 新档在册；CLI 仓本条目零代码改动（`git status` 断言）。
- **AC-A8**（NFR-A2/文档面）= 本节 + §5 指注 + 变更记录一行在位；`node scripts/check-doc-width.mjs` 新增超宽 0。

#### 5.1.9 边界（本批不做）

- 不做 CLI TUI 块机制改动（CLI 无 webview；`⟦ev⟧` 通道语义独立）。
- 不做已消化/settled 任务的回填重建（呈现面 = digest）。
- 不改频道命名法 / chunk 路由 / 子标挂载。
- 不重做池快照（`REMOVE-POOL-SNAPSHOT` 语义保持——见 §5.1.3 边界核对）。
- 不改 150 窗裁剪与冻结幂等语义（**2026-09-12 §14 修订：150 计数含 `.sub-block`——T-CL9；幂等语义不变**）。
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
- **挂起 UI**：**2026-09-12 §14 修订**——settled → awaitingDigest 驻留（带提示）；
  digest 回收 → 归档落流；会话退出 = 区全体归档（§14 C-2/C-3/C-8）；digest 轮标签/状态
  元素见 §14 C-9/C-10。状态行（⏳ 后台 N 子代理 + 待消化计数——`_suspCounts`——子代理
  计数徽标已撤）；输入框永不锁（loading.js）；send 拦截保留（`isRunning`——Enter 拒发——
  输入框不禁——可继续录入；拒发可见提示——第 28 批 §9）；**Send 按钮 running 期隐藏**
  （§14 C-14——F-6 同族派生，2026-09-12）。Stop 只在 running 显（susp 纯池跑不显——
  子代理停止靠区内逐块 ⏹——F-6）。
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
| ext → wv | `providerInfo`（已退场——现体 = `providerStatus`）/`autoApprove`/`models`/`sessions` | Provider 态 / AUTO 会话级 / 模型表 / 会话列表 |
| ext → wv | `historyPage`/`loadOlder` | 懒历史：末页先发（older=false）+ scroll 补偿 |
| wv → ext | `question`/`questionResponse` | 内联 question 卡（非原生弹窗）——questionResponse `{ answer, promptId }`（C1——见 §8） |
| ext → wv | `userMessage`/`assistantMessage` | 历史回放（quick-input 命令回显用） |
| ext → wv | `clearMessages` | `—` |

### 7.2 扩展机制消息族（本架构权威源）

| 消息 | 方向 | 载荷/语义 |
|------|------|-----------|
| `toolPanel` | ext → wv | `{ type, name, kind, text, round, model, sub }`——活动流 chunk（advisor/子代理/consult/escalate）；`kind` = start/think/text/tool；`sub` = 嵌套子标（string chunk 分支恒 undefined——§5 陷阱注）；**2026-09-12 增 `tool`/`cmd`**（工具名 + 参数摘要——无则不携；§14 C-11①/C-12 #3——修正轮 #3） |
| `subagent` | ext → wv | `{ type:"subagent", ...info }` 展开透传——started（池条目带 `pool: true`）/settled/done/error/cancelled 终态 + turn/maxTurns 终值快照；**2026-09-12 增 `status:"turn"`**（`{id, role, turn, maxTurns}`——逐轮进展帧；§14 C-11③/C-12 #4——修正轮 #3） |
| `cancelSubagent` | wv → ext | `{ id, role }`——⏹ 点击路由 → 池条目定向 abort（role 交叉校验防陈旧按钮误停；未知 no-op；advisor role 复用同路由） |
| `batchPermissionResponse` | wv → ext | approveAll / oneByOne / deny |
| `permissionRequest` | ext → wv | `{ tool, args, diff, owner, promptId }`——逐项权限卡；`owner` = 子代理归属标签（`<role>#<id>` / `escalate <tag> #<id>`——depth-0 为 null）；`promptId` = 响应匹配键（AGENT-LOOP §18 C-4） |
| `permissionResponse` | wv → ext | `{ approved, promptId }`——按 promptId 精确匹配队列条目（无 promptId 回退队头——旧 webview）（§18 C-5） |
| `permissionWithdrawn` | ext → wv | `{ promptId }`——host 侧释放（中止 / approve-all 连带）→ 移除对应卡（§18 C-6） |
| `subagentApproval` | ext → wv | `{ id, role, model?, tool }`——审批态（tool=null 清除）→ 块头 `⏸` + `等待审批: <tool>`（§18 C-8） |
| `compress` | ext → wv | start/done/failed/fallback 四态（压缩状态行） |
| `digest` | ext → wv | `{ status:"start"|"end", n, ok?, ms? }`——消化轮起跑指示（§7.4——第 21 批）；**2026-09-12 增 `status:"cap"`**（`{mode:"auto"|"stop", turns}`——turn-cap 部分消化行；§14 C-10/C-12 #5——修正轮 #3） |
| `suspension` | ext → wv | 挂起态行/冻结通知（settled→done 补发/active:false+freeze）——计数载荷与 turnState 双通道一致（§8） |
| `turnState` | ext → wv | `{ state, counts? }`——忙态单一广播（C2——§8 权威锚） |
| `statusText` | ext → wv | `{ kind:"rateWait"/"rateLimited"/"overloaded"/"quota"/"index", seconds?/message?/phase?/done?/total? }`——限流/索引状态段（§14 C-12 #1——本批新增） |
| `turnFrame` | ext → wv | `{ turn, maxTurns }`——顶层逐轮进展段（§14 C-12 #2——本批新增） |
| `questionCancelled` | ext → wv | `{ promptId }`——abort 释放未答 question 卡（C1——§8） |
| `onAgentTurn` | 内部 | 每轮迭代 turn 计数钩子（**2026-09-12 更正**：顶层 = `panel-callbacks` 转 `turnFrame` 上屏（§14 C-11③/C-12 #2）；池条目同步沿用——修正轮 #3；引指更正 ④→③——修正轮 #10） |

> **2026-09-12 修订（活动区收口批——§14 C-11/C-12；修正轮 #3）**：本表新增 `statusText`/`turnFrame`
> 两行；`toolPanel`/`subagent`/`digest` 三行补字段；`onAgentTurn` 行更正（顶层上屏）。协议纪律不变 =
> 只增不改（N-CL1）。

### 7.3 演进纪律（三落点）

新增展示字段必须同时落三个点——**发射端 chunk / 桥 postMessage 载荷
（panel-toolpanel.mjs `toolPanelPayload`——显式白名单纯函数）/ webview 渲染端**（历
史断链事故：只改发射端与渲染端、漏桥 → model 字段从发布首日被丢弃——2026-08-26 修复
锁桥测试）。string/对象双分支在 payload 构造处统一推导（对象载荷字段透传、string 分支
字段 undefined 安全降级）。

### 7.4 digest 起跑可见指示（第 21 批——B6 收口）

> 需求层 = `AGENT-LOOP（CLI 侧）§5`（F-C1 / NFR-C1–C2）；
> 机制面（挂起会话 digest 驱动）= 本仓 `AGENT-LOOP.md` §7；来源批次 =
> `2026-09-11-VSC-INDEX-PERCEPTION（CLI 侧）§1` 条目 B6。
>
> **2026-09-12 §14 修订（活动区收口批）**：本 §7.4「单元素原地更新三态」契约修订为
> **每轮独立元素 + 轮内两态**（跨轮漂移消除——§14 C-9）；新增回合标签行与 cap 行
> （§14 C-9/C-10）；`id="digest-status"` 退役（class 复用）；T-D4/T-D5 用例随 §14.7 改写。

**问题**：消化轮（digest）起跑到首个 token 之间可静默数十秒~分钟——现状只落
`logEvent("digest:start")`（`src/extension/suspension.mjs:265`——文件日志，用户不可见）；
CLI 在进消化轮前零延迟打一行 `[auto-turn: digesting …]`（`src/tui/suspension-drive.mjs:161`（CLI 仓））。

**方案选型**（判据 = 静默 → 可见）：

| # | 候选方案 | 判据逐项评估 | 取舍（选定代价/权衡） | 结论 |
|---|---|---|---|---|
| 1 | **流内生命周期元素（`.digest-status`——压缩状态行同款）** | 起跑即时可见：✅；与 CLI 语义对位 | 起止两态（成功/中断）；会话清屏随清；~30 行（**2026-09-12 §14 修订：每轮独立元素——单元素原地更新废止**） | **选定** |
| 2 | 仅状态行文案（挂起段 ⏳ 改「消化中」） | 同一语义已有状态行/`turnState`/计数三面——再加文案 = 第三源；且承载不了「起跑」时刻 | — | 否决 |
| 3 | 仅 `logEvent`（现状）+ 文档声明 | 判据不满足（用户看不到） | — | 否决 |

**契约**（两跳）：host（`suspension.mjs` 消化分支）在 `entry.runTurn` **之前**发
`{type:"digest", status:"start", n}`（n = 待消化份数 = `_pendingAsyncResults.length`）；回合结束/异常
统一以 `{type:"digest", status:"end", ok, ms}` 收尾（ok=false = 异常中断——不留「仍在消化」假象）；
webview（`chat.js` case "digest" → `showDigestStatus`）**每轮**创建独立 `.digest-status` 元素并轮内原地更新两态文案
（i18n `digest.start` / `digest.done` / `digest.aborted`；2026-09-12 §14 C-9 修订——单元素→每轮元素，id 退役）。投递为**直投**（同 `compress` 同款——
digest 只在面板活跃且 webview 已就绪后发生，不经任务可见性 outbox）。

**逐字文案（coder 照抄——i18n 三键·两档 locales）**：

| 键 | zh | en |
|---|---|---|
| `digest.start` | 正在消化 ${n} 份后台报告… | Digesting ${n} background report(s)… |
| `digest.done` | 已消化 ${n} 份后台报告（${seconds}s） | Digested ${n} background report(s) (${seconds}s) |
| `digest.aborted` | 消化中断（${seconds}s） | Digestion interrupted (${seconds}s) |

（元素 class = `digest-status`——样式沿用 `.compress-status` 同族观感；`seconds` = `ms/1000` 一位小数。）

**关键决策**：

| # | 决策 | 否决备选与理由 |
|---|---|---|
| D-W1 | 流内元素（选型 #1） | 仅状态行文案（第三语义源 + 不承载起跑时刻）· 仅日志（判据不满足） |
| D-W2 | 起止两态 + `ok` 旗标（异常不留假进行态） | 只发 start（异常路径残留「消化中」假象） |
| D-W3 | 直投（不走 outbox） | outbox 语义 = 出生事件族（§5.1.4 族边界）；本元素 = 生命周期指示 |

**受影响文件（实施域）**：`src/extension/suspension.mjs`（346 → ~360）· `webview/chat.js`（319 → ~342）·
`webview/base.css`（432 → ~446）· `locales/zh.json` / `locales/en.json`（243 → ~246——`digest.*` 三键）·
`test/digest-visibility.test.mjs`（新 → ~120）· `test/files.mjs`（55 → 58——本批三新档合计 +3；本面 +1）。

> **档位注记**：`webview/base.css`（432 → ~446）与 `webview/chat.js`（319 → ~342）为**存量超线**档——
> 本批增量小、距 500 硬限余量足（~54 行）——**本批不拆分**；`suspension.mjs`（346 → ~360）同。

**用例表**：

| 用例 | 输入/场景 | 预期输出 | 对应 |
|---|---|---|---|
| T-D1 起跑时序 | 桩面板 + pending 非空驱动 `suspensionSession` | runTurn 被调**之前**已 post start（n = pending 数） | F-C1 / AC-D1 |
| T-D2 正常收尾 | 同上，runTurn resolve | post `{status:"end", ok:true, ms}` | F-C1 / AC-D1 |
| T-D3 异常收尾 | runTurn 抛错 | post `{status:"end", ok:false}`（无 start 悬留） | F-C1 / AC-D1 |
| T-D4 webview 渲染 | happy-dom 直驱 handler：start / end(ok) / end(!ok) | 本轮 `.digest-status` 元素两态文案（含 n / 秒；每轮独立元素——2026-09-12 §14） | F-C1 / AC-D2 · §14 AC-CL2 |
| T-D5 跨轮 | 连续两轮 start/end | 两元素随流新增（各自保留文本与位置——漂移回归；2026-09-12 修订） | F-C1 / AC-D2 · §14 AC-CL2 |

**验收标准**：

- **AC-D1**（F-C1 / NFR-C1）：`node --test test/digest-visibility.test.mjs` T-D1–T-D3 全绿（修前红：现状消化分支零 post）。
- **AC-D2**（F-C1）：T-D4/T-D5 全绿（happy-dom 驱动真 `chat.js` 模块；2026-09-12 §14 修订：每轮元素语义）。
- **AC-D3**（NFR-C2）：既有 `async-visibility` / `webview-turnstate` / `chat-panel` 用例全绿（零回归）。

**边界（本批不做）**：进度百分比/逐条报告进度（消化 = 单回合语义，无可报进度）；历史回填
（Reload 后不恢复该元素）；不改 CLI TUI 行；不改挂起状态机/计数广播/忙态派生语义。

## 8. 消息秩序与忙态收敛（SESSION-FLOW-C + A——权威锚）

> 本节的协议正文是**唯一来源**（C1/C2 实现与 AGENTS.md 协议表镜像行均指向本节，不重复
> 正文；SESSION-FLOW-A A1/A2 措辞增量同落本节——不双处详述；SESSION-FLOW-B B2 boot 契约
> 同落本节——8.5）。覆盖 C1 消息秩序增量
> （question promptId/questionCancelled/atComplete seq）、C2 忙态收敛（turnState 广播/
> renderStatusBar 单 writer/Stop 派生）与 A1/A3 扩展（sendMessage 命令直发同入口/
> Stop 派生（A3 原式 state≠idle 经 F-6 收窄为 running——见 8.4）——A2 标题时机正文在 SESSION.md §7）。

### 8.1 回合入口秩序（C1——F-C1e/H-F + A1——F-A1/R6）

- `userMessage`、`retry` 与 `sendMessage` 命令直发（quick-input/Ask ThinCoder——A1
  SESSION-FLOW-A——修 R6 残留：sendMessage 曾是唯一绕过本入口的直呼 _chat 路径）共用
  **单一入口 routeUserTurn**（panel-messages.mjs）：回合执行中（host `_turnState==="running"`）
  的消息一律**拒收**（不排队、无回执——排队机制与排队回执消息类型已废；拒收警告明示，
  不静默丢）；abort/interrupt 等控制消息**永不排队、直通**（延迟红线——杀 Stop 即失败）。
  sendMessage 回显（`userMessage` postMessage）先于路由——running→拒收（先于回显——
  无假气泡、无排队回执），与 webview 输入路径观感一致；susp 两态（会话活跃/释放窗口）走
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
  `abortControllers` 全停路径删除——子代理停止靠区内逐块 ⏹（running+pool 停 + queued
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

## 9. 输入面 Enter 语义（第 28 批——2026-09-11）

> 需求回指：`AGENT-LOOP（CLI 仓）§8`（F-F1~F-F3）。批次档：`docs/batches/2026-09-11-INPUT-FIXES-SMALL（CLI 仓）§1` 条目 B2（Gitee #IKALHO——离线可测面）。
> 关联锚：§3 文件结构（`toast.js` 新增）· §6 挂起 UI 句 · §8.4 忙态收敛（busy 判据零动）。

### 9.1 问题陈述（as-of 2026-09-11 现场核实）

- **ENTER 双重绑定无协调**：`input.js:73`（Enter → `send()`）与 `autocomplete.js:96-104`（Enter → 接受建议）
  绑同一元素（`#input`）互不协调——@ 下拉打开时 Enter **既发送又插入**（两监听器同事件先后都跑：
  `input.js` 先注册——`chat.js:34` import 先于 `:47` `initAutocomplete()`）。
- **组合期无守卫**：`input.js:40`（中断模态 Enter）/ `:73`（发送）与 `autocomplete.js:96` 三处 Enter 分支
  均不判 `isComposing`——输入法组合确认的 Enter 误触发送/注入/接受建议（组合事件仅追踪高度：`input.js:101-106`）。
- **busy 拒发静默**：`send.js:17-21` busy 拒发只改占位符——输入框有文本时占位符不可见（拒发现场恰为「有文本」）
  = 用户感知「Enter 没反应」；占位符本身按 busy 派生（`loading.js:36-41`）保留。
- **打开态判据缺陷**：`input.js:109-111` `isAtDropdownOpen()` = `getElementById("at-dropdown")?.style.display !== "none"`
  ——元素缺失时 `undefined !== "none"` 恒真（误判「打开」）；Enter 让位依赖该判据后，该缺陷会升级为
  「无下拉元素时 Enter 永不发送」（测试 fixture 即触发）——本批一并硬化。

### 9.2 设计（逐字契约）

- **C-B2-1 组合期 Enter 归输入法**（三处 Enter 分支同规）：`e.isComposing` → 直接返回——
  **不 preventDefault**（键归输入法）、不发送/不注入/不接受建议。落点：`input.js` 中断模态分支（:40 区）、
  `input.js` 常规发送分支（:73 区）、`autocomplete.js` Enter 接受分支（:96 区）。**无模块状态**——只读事件字段，
  组合结束后语义即时恢复（不粘滞）。
- **C-B2-2 @ 下拉与 send 的 Enter 协调**：`input.js` 常规发送分支新增 `isAtDropdownOpen()` 让位——
  下拉打开时 Enter **只由 autocomplete 接受建议**（插入引用 + 关闭下拉），`input.js` 不发送——**让位 = 提前 `return` 且保留 `preventDefault`**（防 Enter 默认换行落入输入框——autocomplete 侧仅 active 项存在时防默认，让位侧自带防默认兜住间隙）；
  下拉关闭时 Enter 照常 `send()`（正控）。**注册次序契约**：`input.js` 的 keydown 监听先于 `autocomplete.js`
  注册（`chat.js:34` import 先于 `:47` 调用）——协调以此为前提（次序反转 = 协调失效——登记为设计约束）；
  Shift+Enter 既有形态零动（`input.js` 分支不处理 + autocomplete 既有接受路径保留）。
- **C-B2-3 打开态判据硬化**：`isAtDropdownOpen()` = `!!el && el.style.display !== "none"`（缺失 ≠ 打开）。
- **C-B2-4 busy 拒发可见提示（最小形态——复用既有 toast 机制）**：
  - `webview/toast.js`（**新增**——自 `autocomplete.js` 私有 `showToast` **原样提取**为共享模块）：
    懒建 `#paste-toast` 元素（class `paste-toast`——CSS 复用 `controls.css:49-65` 既有规则，零 CSS 改动）、
    2.6s 自动隐去（单计时器静态字段——同原实现）；
  - `send.js` busy 分支追加 `showToast(t("input.busyPlaceholder"))`——**复用既有文案键**
    （`locales/*.json:13`——零新增键）；占位符设置保留（既有测试锁零伤）；
  - `autocomplete.js` 改 import 共享 toast（本地私有实现删——行为逐字不变）。
- **零改核对**：`_turnState` 单广播/派生、`applyBusyLock`、门禁判据（只禁 send 不禁录入）、
  中断模态、下拉过滤/防抖/seq、CSS、`index.html`——全部零改。

### 9.3 方案选型对比（③ busy 可见化的最小形态——2 候选）

| # | 候选 | 判据逐项评估 | 取舍（选定代价/权衡） | 结论 |
|---|---|---|---|---|
| 1 | **复用既有 toast 机制**（选定——提取共享模块 + send 追加一行） | 带文案（复用既有 busy 串——「为何没发」可懂）；与既有「拒绝类瞬时反馈」单一化（防两份 toast 实现漂移）；机验强（元素 + 文案断言） | 代价 = 新模块 `toast.js` + `autocomplete.js` 改 import（行为零变）；收益 = 提示完整 + 机制收拢 | **选定** |
| 2 | 输入框拒绝闪动（CSS class + 定时移除） | 改动限于 send.js 三行 + CSS 一条，但**无文案**——「被拒」可感、「为何被拒」不可达；与既有 toast 形成两套瞬时反馈机制 | 省一个模块；代价 = 提示语义不完整 + 机制分叉 | 否决 |

### 9.4 关键决策记录（含否决备选）

- **D-B2-1 组合守卫读事件字段 `e.isComposing`（否决复用/新增全局 `_composing` 标志）**——事件字段无粘滞风险
  （标志在 compositionend 丢失时成死键）；mac/输入法真机兼容兜底（`keyCode===229`）不引入（登记，见 §9.8）。
- **D-B2-2 三处 Enter 分支统一守卫（否决「只修发送分支」）**——同族缺陷；只修一处时（组合 + 下拉打开）组合态漏网。
- **D-B2-3 协调落 `input.js` 让位（否决 `autocomplete.js` 抢先 `stopImmediatePropagation`）**——
  input.js 监听先注册（先运行），让位是唯一有效侧；autocomplete 侧劫持需变更注册次序（面更大、语义更隐蔽）。
- **D-B2-4 toast 文本复用 `input.busyPlaceholder` 键（否决新增 `busyNotice` 键——引例：否决备选名，两仓皆无）**——文案语义与拒发场景同源
  （同一句话）；零 locale 改动。
- **D-B2-5 toast 机制共享化（否决 send.js 内联复制——同元素双写者/双计时器漂移；亦否决「autocomplete 导出」——
  send → autocomplete 语义耦合方向不当）**。
- **D-B2-6 元素 id/class 维持 `paste-toast`（否决改名 `toast`）**——零 CSS 触碰；命名债登记
  （机制已通用化——下一自然触达批可收口）。

### 9.5 受影响文件（VSC 仓；as-of 2026-09-11 实测；口径 `split("\n").length` 含末行）

| 文件 | 当前行数 | 预计增量 | 变更点 |
|---|---|---|---|
| `webview/input.js` | 133 | +6 ±3 | C-B2-1 两处 Enter 守卫 + C-B2-2 让位 + C-B2-3 硬化 |
| `webview/autocomplete.js` | 201 | -8 ±4 | C-B2-1 组合守卫 + toast 提取（-13 本地实现 / +1 import） |
| `webview/send.js` | 53 | +3 ±1 | C-B2-4 busy 分支追加 showToast |
| `webview/toast.js` | 0（新增） | +22 ±6 | showToast 共享模块（原样提取） |
| `test/webview-input-enter.test.mjs` | 0（新增） | +130 ± 40 | 用例表 1:1（T-B2-1~T-B2-7） |
| `test/files.mjs` | 56 | +1 | 新档登记（显式清单——不登记不跑） |
| `AGENTS.md`（仓根） | — | +1 | 模块图登记 `webview/toast.js`（**写域外——已报告父侧**） |
| `webview/controls.css` · `webview/index.html` | 648 / 85 | 0 | 零改（toast 复用既有 id/class/CSS；元素懒建） |

### 9.6 测试层——用例表（新档 `test/webview-input-enter.test.mjs`；happy-dom 直驱真模块）

> 手法：`setupWebview` + `installChatFixture` + 本档自备补充元素（`#at-dropdown` / `#paste-bar` / `#paste-badge`
> ——共享 fixture 零改）+ 动态 import `input.js`（副作用注册）与 `initAutocomplete`（真装配）；
> Enter 以 `new KeyboardEvent("keydown", { key:"Enter", isComposing })` 派发（happy-dom 支持——已实测）；
> 消息面断言经 `capturedPosts`；busy toast 断言只覆盖即时态（不等 2.6s 淡出——快层慢门）。

| # | 类型 | 输入 | 预期输出 | 回指 |
|---|---|---|---|---|
| T-B2-1 | 正常（正控） | idle + 下拉关闭 + 文本；Enter（非组合） | 发 1 条 `userMessage`（text 匹配）；输入框清空 | F-F2 |
| T-B2-2 | 边界 | 文本 + Enter（`isComposing:true`）→ compositionend → 再 Enter | 第一次：零 `userMessage`、零 `interrupt`、文本保留；第二次：正常发送（守卫不粘滞） | F-F1 |
| T-B2-3 | 正常 | 激活 @ 输入 + 真 `showAtDropdown`（打开）+ Enter | 建议插入（`@<path> ` 落地）、下拉关闭、**零** `userMessage` | F-F2 |
| T-B2-4 | 边界 | 同 T-B2-3，但 `#at-dropdown` 元素移除后 Enter | 正常发送（缺失 ≠ 打开——C-B2-3 硬化判据） | F-F2 |
| T-B2-5 | 正常 | busy（`S._turnState="running"`）+ 文本 + Enter | 零 `userMessage`；文本保留；占位符 = busy 串（既有锁）；`#paste-toast` 存在且带 `.visible`、文本 = busy 串 | F-F3 |
| T-B2-6 | 边界 | 下拉打开 + Enter（`isComposing:true`） | 双守卫：零 `userMessage` + 建议未插入（文本原样） | F-F1/F-F2 |
| T-B2-7 | 边界 | 中断模态（Ctrl+I 进入）→ Enter（组合）→ Enter（非组合） | 组合：零 `interrupt`；非组合：`interrupt` 发出（中断通道零回归） | F-F1 |

### 9.7 验收标准（逐条回指需求；每条可机器验证）

| AC | 判据 | 断言手段 | 回指 |
|---|---|---|---|
| AC-B2-1 | 组合期 Enter 三路均不触达（发送/注入/接受建议）且不粘滞 | T-B2-2 / T-B2-6 / T-B2-7 | F-F1 |
| AC-B2-2 | 下拉打开时 Enter 只接受建议不发；关闭时照常发；元素缺失 ≠ 打开 | T-B2-1 / T-B2-3 / T-B2-4 | F-F2 |
| AC-B2-3 | busy 拒发：零发送 + 文本保留 + toast 可见（文案 = busy 串）；**自动隐去 = 原样提取的既有机制（行为零变）**——断言面 = 即时可见（§9.6 注） | T-B2-5 | F-F3 |
| AC-B2-4 | 零回归：既有 webview 族全绿（基线 as-of 2026-09-11：422/421/0/1）+ 占位符/readOnly/模态断言不变 + CLI 仓本面零改 | 既有族运行 + `test/files.mjs` 登记 + grep 核对 | NFR-F1 / NFR-F3 |
| AC-B2-5 | 机制单一化：`#paste-toast` 唯一写者 = `toast.js`（autocomplete 私有实现零残留） | grep 断言（`showToast` 定义点单处） | NFR-F2 |

### 9.8 边界（本批不做）

- 不碰真机 IME 矩阵（mac/Safari 组合确认 Enter 的 `isComposing` 时序差异——索料待回；`keyCode===229` 兜底不引入）；
- 不改 `_turnState` 生命周期本体（busy 判据/单广播/派生/`applyBusyLock` 零动）；不改门禁语义（不禁录入只禁 send）；不复活排队；
- 不改下拉过滤/防抖/seq/导航语义；不改 Shift+Enter 打开态接受建议的既有形态；不新增 i18n 键；不改 CSS；
- 不动 CLI 仓输入面（各端独立实现——同批 B1 为 CLI 另条目）；不做历史回填。

## 10. Markdown 行内代码字面量契约与转义回归（GitHub #7——第 34 批，2026-09-11）

> 需求：`AGENT-LOOP（本仓·需求）§10`（F-H1~F-H4 / N-H1~N-H4）。批次档：`2026-09-11-VSC-WEBVIEW-ESCAPE（本仓）§1`
> （GitHub #7 · zacharyyyang 2026-09-08——合成 markdown 复现，不依赖模型 / 网关）。
> 渲染面 = `webview/md.js`（`md()` / `mdInline()` / `inline()` 单一内联引擎——§3 文件结构行同源）。

### 10.1 问题陈述与现场复核（as-of 2026-09-11——issue 断言逐条对拍现行树）

issue 的定位（「`md()` 第 3 步 / `mdInline()` 直接插入捕获内容、未用既有 `esc()`」）**对发布版 0.8.10 成立、
对现行树不成立**：`webview/md.js` 已于 2026-09-05（`a3aea39`）重写为 esc-first 架构——第 5 步整体
`esc()`、第 7 步内联构建；捕获内容一路来自已转义文本。

| # | 复核项 | 方法（可重跑） | 结论 |
|---|---|---|---|
| R-1 | 转义面（issue headline） | 旧版（`git show 5e9d1b23:webview/md.js`）与新 HEAD 对同一复现串对拍 | 旧版**逐字节复现** issue 文中输出（`<code><script …></code>`）；HEAD 输出 `&lt;script …&gt;`——**已修复**（`a3aea39`；本批零代码改动） |
| R-2 | 行内代码内容被后续替换二次处理（issue 修法方向 1 的实质目标） | 语料直驱 HEAD `md()` | **未满足（本批实修面）**：`` `**x**` `` → `<code><strong>x</strong></code>`；`` `[a](http://b)` `` → `<code>` 内真 `<a>`；`` `![a](http://b)` `` → `<code>` 内真 `<img>`（渲染即触发远程 URL 请求）；`` `~~x~~` `` → `<code><s>` |
| R-3 | 代码范围外原始 HTML 策略（待裁 2） | 语料：裸 `<script>` / `<img onerror=…>` / `<b>` / `javascript:` 与 `data:` URL | 全转义 + `safeUrl` 限流（危险 scheme → `#`）——**保持即可**（已是最严形态，无 passthrough 可收紧） |
| R-4 | 既有渲染测试面 | 仓库扫描 + git 历史 | `test/md.test.mjs` 已删除（随 `3b974ae` 测试清空——删除记录 = 该提交）；**当时零覆盖**（转义契约无人钉死）——后由 D-V4 新增 `test/md-render-escape.test.mjs` 承回 |
| R-5 | 「代码先转换即受保护」的注释 vs 实现 | `inline()` 原第 2 步注释与后续正则行为对拍 | 注释声称「content isn't reprocessed」——实现未兑现（替换成 `<code>` 不阻断后续正则匹配其文本）——R-2 的成因级证据 |

**成因（一句话）**：`inline()` 的替换通道（图片 / 链接 / 粗体 / 斜体 / 删除线）在同一字符串上串行执行，
`<code>` 只是文本——后续正则仍能匹配代码内容 → 代码里的标记被二次解释。

**行为差异清单（本批修复的精确边界——语料对拍）**：差异只许出现在 `<code>` 内容里；其余输出必须逐字节不变——**唯一例外 = 跨界配对族**（下表末两行：代码段内标记与段外标记跨界配对型——保护契约的预期后果，差异必然外溢到 `<code>` 之外；按 T-H15 字面量白名单机判，§10.8 登记）。

| 输入（语料） | 修前 | 修后 |
|---|---|---|
| `` `**x**` `` | `<code><strong>x</strong></code>` | `<code>**x**</code>` |
| `` `*x*` `` / `` `~~x~~` `` | `<code><em>x</em></code>` / `<code><s>x</s></code>` | 字面（同左列输入原样） |
| `` `[a](http://b)` `` | `<code><a href="http://b">a</a></code>` | `<code>[a](http://b)</code>` |
| `` `![a](http://b)` `` | `<code><img src="http://b" alt="a"></code>` | `<code>![a](http://b)</code>` |
| `` `[x](javascript:alert(1))` `` | `<code><a href="#">x</a>)</code>` | 字面（连 `#` 锚点都不再生成） |
| 表格 / 引用 / 列表 / 标题内行内代码 | 同上（`<strong>` / `<em>` / `<a>` / `<img>` / `<s>` 落进 `<code>`） | 同上（一律字面） |
| `` `a **b` c** d ``（跨界配对——段内 `**` ↔ 段外 `**`） | `<code>a <strong>b</code> c</strong> d`（跨界错配——`<strong>` 跨 `<code>` 边界） | `<code>a **b</code> c** d`（两处均字面） |
| ``**a `b** c` d``（反向跨界——段外 `**` ↔ 段内 `**`） | `<strong>a <code>b</strong> c</code> d`（跨界错配——同型反向） | `**a <code>b** c</code> d`（两处均字面） |

零差异项（对拍 SAME）：转义（`&<>"`）、fenced 代码块、表格结构、转义管道 `\|`、转义反引号、代码内反斜杠折叠
（`` `\*` `` → `*`）、多行代码段、纯文本标记（`**b**` / 链接 / 删除线）——非跨界语料零外溢（**跨界配对族例外**——§10.1 差异表末两行 · §10.8 登记）。

### 10.2 方案选型对比

**待裁 1——占位符-恢复形态（与既有管线次序的相容性）**：

| # | 候选方案 | 判据逐项评估 | 取舍（选定代价 / 权衡） | 结论 |
|---|---|---|---|---|
| 1 | **案 B′：代码段占位符化——提取置于「反斜杠转义」之后、恢复置于「反斜杠恢复」之前** | 覆盖 R-2 全项 ✓；与既有管线次序相容（两步重排 + 恢复序换位）✓；非跨界语料零外溢（语料 23 例——11 处差异全部落在 `<code>` 内；跨界配对族 = 登记例外——增补 2 例见 §10.1 差异表末两行）✓；复杂度最小（+1 数组、2 处重排） | 代价 = 代码内反斜杠折叠保持现状（`` `\*` `` → `*`——非本批判定面，§10.8 登记）；收益 = 精确命中 F-H1~F-H4 且非跨界语料零外溢 | **选定** |
| 2 | 案 A″：代码段提取置于最前（自带「转义反引号」预通道） | 覆盖 R-2 ✓；但**额外改变**代码内反斜杠语义（`` `\*` `` → `\*`——更近 CommonMark，却超出本批边界「不改渲染语义其余面」）；双反斜杠通道（L + E）——奇偶反斜杠边角需另立规则 | 收益 = 更完整的字面量（本批无此要求）；代价 = 越界语义变更 + 复杂度上升 | 否决（越界；可独立条目重开） |
| 3 | 保持现状（不修 R-2） | 不满足 F-H1 判定句（语料实证反例见 R-2） | — | 否决 |

**待裁 2——代码范围外原始 HTML 策略**：

| # | 候选方案 | 判据逐项评估 | 结论 |
|---|---|---|---|
| 1 | **保持「全转义 / 无 passthrough」** | 现行 esc-first 已满足 F-H2 / F-H3（裸 `<script>` 亦为文本；`safeUrl` 拦危险 scheme）；零改动零风险 | **选定** |
| 2 | 收紧（引入允许清单 sanitizer） | 无 passthrough 可收紧——现行实现已是最严形态；新增 sanitizer = 新增面且无需求支撑 | 否决 |
| 3 | 放开（raw HTML passthrough） | 违反 F-H2 / F-H3 并引入 XSS——与 esc-first 架构冲突 | 否决 |

### 10.3 契约（逐字——唯一改动面 = `inline()`）

**次序契约**：「字面量保护通道」（反斜杠转义 → 代码段占位符）一律先于「Markdown 替换通道」
（图片 / 链接 / 粗体 / 斜体 / 删除线）。

**逐字目标形态（coder 照抄；`inline()` 头注释与第 2 步注释同步改写——头注释目标全文已含于下方块首）**：

```js
/** Inline pass over already-escaped text `s` (callers escape first; `mdInline()` does it
 *  itself) — returns HTML. Two channels, in order: (1) literal protection — backslash
 *  escapes, then inline code spans — captured into placeholders and restored verbatim
 *  at the end (step 6); (2) Markdown replacement — images/links, bold/italic,
 *  strikethrough — never sees protected content. The input must never contain raw
 *  `<`, `>`, `&`. */
function inline(s) {
  const escp = []
  const code = []
  // 1. Protect backslash-escaped chars (\* → *, \| → |, …) with placeholders ……（原样保留）
  let t = s.replace(ESCAPABLE, (m) => { const i = escp.length; escp.push(m.slice(1)); return `\x00E${i}\x00` })

  // 2. Inline code spans → placeholders. The content must NOT be reinterpreted by the
  //    replacement passes below (bold/italic/link/image/strike); it is already esc()'d
  //    by the callers, so the span text is inserted verbatim at restore time.
  t = t.replace(/`([^`]+)`/g, (_, m) => { const i = code.length; code.push(m); return `\x00C${i}\x00` })

  // 3. Images + links …… 4. Bold + italic …… 5. Strikethrough ……（三步原样，不动）

  // 6. Restore code spans FIRST, then backslash-escaped literals — the escape pass must
  //    reach inside the code content (e.g. `\*` → `<code>*</code>`, current semantics kept).
  t = t.replace(/\x00C(\d+)\x00/g, (_, i) => `<code>${code[+i]}</code>`)
  t = t.replace(/\x00E(\d+)\x00/g, (_, i) => escp[+i])
  return t
}
```

- **恢复序是硬约束**：代码段先恢复、反斜杠字面量后恢复——反向序会让落进代码段的 `\x00E` 占位符无人恢复
  （沙箱实证：`` `\*` `` 输出裸占位符）。
- **转义契约**：代码段内容一律来自调用方 `esc()`（`md()` 第 5 步 / `mdInline()` / 块级 helper 的 `esc(...)` 入参）
  ——**恢复点不得再次 `esc`**（双转义会产出 `&amp;lt;`）。
- **mdInline 同步面（待裁 1 后半）**：`mdInline(s) = inline(esc(s))` 与 `md()` 共用 `inline()`——同步面 =
  **零额外改动**；用例以同一输入矩阵同时断言两条路径（T-H12）。
- **登记（现状保持）**：代码内反斜杠折叠（`` `\*` `` → `*`）、多行代码段的 `<br>` 形态、未闭合反引号
  （不成代码段）——均与修前一致（§10.8 边界）。
- **头注释同步（本次改写）**：以上方块首 JSDoc 全文替换现版头注释；原「`raw=true` 原始串」子句为陈旧描述
  （`inline()` 无该参数——`mdInline()` 自行 `esc()`）——随同步消去（注释级更正，零行为影响）。

### 10.4 关键决策记录（含否决备选）

| # | 决策 | 否决备选 / 理由 |
|---|---|---|
| D-V1 | 内联次序契约：字面量保护（反斜杠 → 代码段）先于 Markdown 替换 | 否决「代码段置于反斜杠之前」（案 A″——越界改变代码内反斜杠语义）；否决「保持现状」（F-H1 反例实证） |
| D-V2 | 恢复序 = 代码段先、反斜杠字面量后 | 否决反向序（代码段内 `\x00E` 占位符无人恢复——沙箱实证裸占位符） |
| D-V3 | 代码范围外原始 HTML = 保持全转义（无 passthrough） | 否决收紧（无处可紧——已是最严形态）；否决放开（XSS + 违反 F-H2） |
| D-V4 | 回归载体 = 新增 `test/md-render-escape.test.mjs`（纯函数直驱，无需 happy-dom）+ `test/files.mjs` 登记 | 否决「并入既有档」（渲染契约无归属档——原 `test/md.test.mjs` 已删除；删除记录 = `3b974ae` 清空提交）；否决 happy-dom 驱动（渲染器零 DOM 依赖——直驱最简） |
| D-V5 | 转义面（`a3aea39` 已落地）以**回归用例钉死**，不重复改动 | 无代码可改——issue 的 file:line 对现行树 stale（§10.1 R-1）；重复改动 = 无因变更 |
| D-V6 | 本批不触发布面（版本号 / CHANGELOG / 市场发布） | 用户可见修复依赖下次发布（0.8.10 仍为旧渲染器）——发布排期归父侧（§10.8） |

### 10.5 受影响文件全清单（as-of 2026-09-11 实测；行数口径 = `split("\n").length`）

| 文件 | 现行行数 | 预计增量 | 改动 |
|---|---|---|---|
| `webview/md.js` | 261 | +6 ±4 | `inline()` 两步重排 + 恢复序换位 + 注释同步（§10.3 逐字形态） |
| `test/md-render-escape.test.mjs` | 0（新增） | +140 ±40 | 用例表 T-H1~T-H15（纯函数直驱 + 登记自断言） |
| `test/files.mjs` | 59 | +1 | 新档登记（显式清单——不登记不跑） |
| `docs/design/WEBVIEW.md` | 719（本批前）→ 891（修正轮后实测） | +172 | 本节（设计者写域——coder 零碰） |
| `AGENT-LOOP（CLI 仓）` | 297（本批前）→ 344（落档后实测） | +47 | §10（设计者写域——coder 零碰） |
| 合计 | — | 代码面 +6 ±4 / 测试面 +141 ±40 / 文档面 +219 | 2 改 + 1 增（coder 面） |

### 10.6 用例表（正常 / 边界 / 错误——新增档 `test/md-render-escape.test.mjs`；纯函数直驱）

| # | 类型 | 输入 | 预期输出（可机判） | 回指 |
|---|---|---|---|---|
| T-H1 | 正常（issue 复现） | 检测源码里的 `<script type="application/ld+json">` 是否存在 FAQPage。+ 后段 | 输出含后段文本、含 `&lt;script`、`/<script/i` 零命中 | F-H2 / F-H3 |
| T-H2 | 边界（raw-text 元素族） | 行内代码含 `<style>` / `<textarea>` / `<img src=x onerror=…>` | `/<(script\|style\|textarea)/i` 零命中；`onerror=` 仅作转义文本出现 | F-H2 |
| T-H3 | 边界（尖括号与 `&`） | 行内代码 `` `a & b < c` `` + 正文 `1 < 2 & 3 > 2` | `<code>a &amp; b &lt; c</code>`；正文 `1 &lt; 2 &amp; 3 &gt; 2` | F-H2 |
| T-H4 | 正常（代码外裸 HTML 策略） | 裸 `<script>alert(1)</script>` / `<img src=x onerror=alert(1)>` / `<b>x</b>` | 三者均以 `&lt;…&gt;` 文本呈现（`<script` / `<img` 字面零命中） | F-H2（D-V3） |
| T-H5 | 正常（F-H1 核心） | `` `**x**` `` / `` `*x*` `` / `` `~~x~~` `` | `<code>**x**</code>` / `<code>*x*</code>` / `<code>~~x~~</code>`——`<code>` 内 `<strong>` / `<em>` / `<s>` 零命中 | F-H1 |
| T-H6 | 正常（代码内链接 / 图片标记） | `` `[a](http://b)` `` / `` `![a](http://b)` `` | `<code>[a](http://b)</code>` / `<code>![a](http://b)</code>`——`<code>` 内 `<a` / `<img` 零命中 | F-H1 |
| T-H7 | 边界（危险 scheme 双面） | 代码内 `` `[x](javascript:alert(1))` `` + 代码外 `[x](javascript:alert(1))` | 代码内 = 字面（零 `<a`）；代码外 = `<a href="#">x</a>`（`safeUrl` 保持） | F-H1 / F-H2 |
| T-H8 | 正常（表格单元格路径） | 单元格含 `` `**x**` `` 与转义管道 `` `a \| b` `` | 单元格 = `<code>**x**</code>`；转义管道不拆列（dea4fcf 行为保持） | F-H4 |
| T-H9 | 边界（行内上下文矩阵） | 标题 / 引用块 / 无序与有序列表 / 任务项 / 嵌套列表内行内代码 | 各上下文同契约（`<code>` 内 `<strong>` / `<em>` / `<a>` / `<img>` / `<s>` 零命中） | F-H4 |
| T-H10 | 边界（转义反引号 / 代码内反斜杠） | 转义反引号 `` \`code\` `` + `` `\*` `` | 前者 = 字面反引号（不成 `<code>`）；后者 = `<code>*</code>`（现状折叠保持——登记） | F-H1（登记项） |
| T-H11 | 正常（fenced 代码块） | html 围栏代码块内含 `<script>alert(1)</script>` | `<pre class="code-block">` 内 `&lt;script&gt;`（highlight 路径零改） | F-H2 |
| T-H12 | 正常（mdInline 同步面） | T-H1 / T-H5 / T-H6 输入矩阵改走 `mdInline()` | 与 `md()` 同契约（零额外改动） | F-H4 |
| T-H13 | 边界（未闭合反引号 / 多行段） | 未闭合 `<script>x`（无收尾反引号）+ 多行代码段 | 未闭合 = 全文转义文本（零 `<code>`）；多行段 = 现状 `<br>` 形态保持（登记） | F-H2（登记项） |
| T-H14 | 正常（非代码面金样） | 混合语料（粗体 / 斜体 / 删除线 / 链接 / 标题 / 列表 / 表格 / fence / 转义管道 / 转义反引号；不含跨界配对族——该族见 T-H15） | 与修前**逐字节一致**（金样对拍——金样改动前捕获，见下注；§10.1 SAME 项） | N-H1 |
| T-H15 | 边界（跨界配对族——保护契约预期外溢） | `` `a **b` c** d `` / ``**a `b** c` d``（代码段内 `**` 与段外 `**` 跨界配对型） | `<code>a **b</code> c** d` / `**a <code>b** c</code> d`——逐字节字面量（修前 = 跨界错配畸形嵌套——反例见 §10.1 差异表；`md()` / `mdInline()` 同值） | N-H1（差异边界登记） |

> **T-H14 金样协议（防自证循环）**：金样于**改动前**捕获（修前 HEAD `git show HEAD:webview/md.js` 直驱出期望串，以固定字面量写入测试档）；**禁止**改动后从新实现重新生成。

### 10.7 验收标准（逐条回指需求——每条可机器验证）

- **AC-H1**（F-H1）= T-H5 / T-H6：`<code>` 内 `<strong>` / `<em>` / `<s>` / `<a` / `<img` 零命中（输入矩阵）；**修前红**（反例 = §10.1 R-2）。
- **AC-H2**（F-H2 / F-H3）= T-H1~T-H3 + T-H11：issue 最小复现后段可见；全语料 `/<(script|style|textarea)/i` 零命中；fenced 路径零改。
- **AC-H3**（F-H4）= T-H8 / T-H9 / T-H12：表格 / 引用 / 列表（含嵌套·任务项）/ 标题各上下文与 `mdInline()` 同契约。
- **AC-H4**（N-H1）= 快层全绿（基线 tests 447 · pass 441 · fail 0 · skip 6）+ T-H14 非代码面逐字节一致（语料范围内）+ T-H15 跨界族字面量白名单吻合（外溢差异被显式钉死）。
- **AC-H5**（N-H2）= `node --test test/md-render-escape.test.mjs` 全绿 + `test/files.mjs` 在册（档内自断言）。
- **AC-H6**（N-H3 / N-H4）= CLI 仓代码 / 测试路径（`src/` · `test/`）**本批新增 0**（机验 = 交付时 `git status --porcelain -- src test` 与批次开档快照（批次档 §2 修正块·as-of 2026-09-11）差集为空——他批在飞存量不阻断）；两仓 `node scripts/check-doc-width.mjs` **本批触碰档**新增 0；`webview/md.js` ≤500 行。

### 10.8 边界（本批不做）

- 不做 CommonMark 全语义（多反引号围栏、代码内反引号、实体 / 制表符细节）；
- 不改代码内反斜杠折叠（现状保持——如需 CommonMark 化，独立条目重开）；
- **登记（跨界配对族——保护契约的预期后果）**：代码段内标记与段外标记跨界配对型输入（如 `` `a **b` c** d ``）——修前 `<strong>` 跨 `<code>` 边界错配（畸形嵌套）；修后两处标记均字面——差异可外溢到 `<code>` 之外（不在「非代码面逐字节不变」不变量覆盖内）；按 T-H15 字面量白名单机判（§10.6）。
- 不改多行代码段的 `<br>` 形态与未闭合反引号行为；
- 不改 fenced 代码块 / 表格结构 / 链接 / 列表 / 标题语义；不引入 raw HTML passthrough；
- 不做历史消息重渲染（仅新渲染走新契约）；不改流式 rAF 渲染 / 滚动；
- 不做发布面（版本号 / CHANGELOG / 市场发布——用户可见修复依赖下次发布，父侧排期）；
- 不新建文档档。

**UI / 交互决策**：本批零新增交互面（纯渲染输出契约）——决策已全落 §10.2 选型与 §10.4 决策记录；**无 `open` 项**。

## 11. 群 A 批增补——输入历史与说明面（A10 / A13——2026-09-11）

> 来源：批次档 `2026-09-11-VSC-MIRROR-SWEEP（本仓）` §1 条目 A10（用户 2026-09-11
> 17:04 裁定——语义五条）与 A13（用户 17:08 裁定——竞品分析 §7.1「Plan/Subagent/Goal 说明」项）。
> 双端纪律：A10 的 CLI 对位 = `TUI-INPUT-BOX.md`（CLI 仓）第 31 批（↑↓ 三规则）——语义同源、本端原文自持、
> CLI 零改（用户明示「不追对称」）。

### 11.1 A10——输入历史与多行编辑（↑/↓ 契约）

#### 11.1.1 问题陈述（as-of 2026-09-11 现场核实）

- **连续上溯断裂**：`webview/input.js:88-89` 的 ↑ 门 = `selectionStart === 0`；`navigateInputHistory`
  载入后游标置于条目末（`:142` `setSelectionRange(len, len)`）——第二次 ↑ 时位置门不成立（非空条目）
  → 上溯一次即断。
- **↓ 回落同门脆弱**：`:92-93` 的 ↓ 门 = `selectionStart === value.length`——回忆后/编辑后位置不定，
  回落不可靠。
- **单行中段不触发**：单行文本光标在中段时 ↑/↓ 均不触发（用户点名补——「单行任意位置 ↑/↓ 触发历史」）。
- **IME 无守卫**：↑/↓ 分支不判 `isComposing` / `keyCode === 229`——输入法组合期按 ↑/↓（候选导航）可能被劫持。
- **测试零覆盖**：`test/webview-input-enter.test.mjs` 只覆盖 Enter 面；历史面现零覆盖（本批必交测试）。

#### 11.1.2 契约（逐字——本批定稿）

| # | 契约点 | 规则 |
|---|---|---|
| C-MA10-1 | 判定顺序 | ↑/↓（无 Shift/Alt/Ctrl/Meta）→ ① IME 组合期（`e.isComposing \|\| e.keyCode === 229`）→ 不处理不 preventDefault（键归输入法）；② `isAtDropdownOpen()` → 不处理（下拉导航让位——不回归）；③ 历史态 → 恒历史；④ 非历史态·单行 → 历史；⑤ 非历史态·多行 → 边界门。 |
| C-MA10-2 | 历史态恒历史（`ctx._historyIdx !== -1`） | ↑ → `navigateInputHistory(-1)`；↓ → `navigateInputHistory(1)`——**不看光标位置与单复数行**（连续上溯与回落恒可用；用户裁定口径「`_historyIdx !== -1` 恒历史」）。 |
| C-MA10-3 | 单行任意位置（`!value.includes("\n")`） | 非历史态：↑ → 载入最新条目（草稿 stash 既有语义）；↓ → 吞键（preventDefault）+ 内部 no-op（非历史态无可回落）。 |
| C-MA10-4 | 多行段边界门（含 `\n`） | 非历史态：↑ 仅 `selectionStart === 0`（首行行首）触发；↓ 仅 `selectionStart === value.length`（末行行末）触发；其余位置不处理不 preventDefault（浏览器原生竖移保留）。 |
| C-MA10-5 | 载入后光标/高度 | 既有 `navigateInputHistory` 语义零改（载入后游标 = 条目末 + 高度重算）；不取「回忆后游标挪行首」法（用户明示否决——会使 ↓ 失效）。 |
| C-MA10-6 | 范围边界 | 只动 ↑/↓ 分支 + IME 守卫；Enter 面（§9 契约）零动；`_inputHistory` / `_historyIdx` / `_inputDraft` 状态模型零改；CLI 端零改。 |

#### 11.1.3 关键决策记录（含否决备选）

| # | 决策 | 理由 | 否决备选 |
|---|---|---|---|
| D-A10-1 | 「单行」判定 = 逻辑行（`\n` 判定） | textarea 无可靠折行 API；VSC 不实现竖移、无对齐诉求（不追对称——用户明示）；用户点名场景（未回车的文本）精确覆盖 | 视觉折行口径（软换行同权——`scrollHeight` 类粗测不可靠） |
| D-A10-2 | 非历史态·单行 ↓ = 吞键 + no-op | 与 CLI「键已消费、无 fall-through」同源；单行 ↑/↓ 恒属历史键盘域（可预测）；行尾 ↓ 已被吞（现状）——中段归一 | 放行原生 ↓（跳行尾）——同一单行内两分语义 |
| D-A10-3 | 修订 = 在既有 `navigateInputHistory` 之上改门限（零新状态） | 改动限于门限修订；草稿保护 / 历史指针 / 光标安置语义零改 | 历史模块重构（无必要） |

#### 11.1.4 受影响文件（行数口径 = `split("\n").length` 含末行；as-of 2026-09-11 实测）

| 文件 | 当前行数 | 预计增量 | 改动 |
|---|---|---|---|
| `webview/input.js` | 146 | +6 ± 3 | ↑/↓ 分支合流（判定顺序 + IME 守卫）——其余逐字不动 |
| `test/webview-input-history.test.mjs` | 0（新增） | +110 ± 30 | T-MA10-1..8（`setupWebview` + 真 `input.js` import——同 §9.6 手法） |
| `test/files.mjs` | 63 | +1 | 新档登记（不登记不跑） |

#### 11.1.5 用例表（三态——T-MA10-1..8）

| # | 类型 | 输入 | 预期输出 | 回指 |
|---|---|---|---|---|
| T-MA10-1 | 正常 | `history=[a,b,c]`；↑→↑→↑→↑ | 依次载入 c→b→a→a（顶端 `Math.max` 钳制——**连续上溯不断裂**） | C-MA10-2 |
| T-MA10-2 | 正常 | 接上；↓→↓→↓ | b→c→草稿恢复（`_historyIdx=-1` + `_inputDraft` 还原 + 吞键） | C-MA10-2 |
| T-MA10-3 | 边界 | 单行 `hello world`、光标中段（`selectionStart=5`）↑ | 历史载入（值变化）+ 草稿 stash | C-MA10-3 |
| T-MA10-4 | 边界 | 多行 `aa\nbb`、光标非边界（`selectionStart=1`）↑ / ↓ | 零历史载入 + **零 preventDefault**（`dispatchEvent` 返 true——原生竖移保留） | C-MA10-4 |
| T-MA10-5 | 边界 | `{key:"ArrowUp", isComposing:true}` / `{key:"ArrowDown", keyCode:229}` | 零载入 + 零 preventDefault（键归输入法） | C-MA10-1① |
| T-MA10-6 | 边界 | `#at-dropdown` `display:block` → ↑ / ↓ | 零载入 + 零 preventDefault（让位不回归） | C-MA10-1② |
| T-MA10-7 | 边界 | 多行 `aa\nbb`：光标 `=0`（首行首）↑；光标 `=5`（末行末）↓（非历史态） | ↑ 载入历史；↓ 吞键 + no-op | C-MA10-4 |
| T-MA10-8 | 边界 | 单行 `hello world`、光标中段（`selectionStart=5`）、**非历史态** ↓ | 吞键（`dispatchEvent` 返 false）+ 值不变 + 零历史载入（`_historyIdx` 仍 −1） | C-MA10-3 |

> 手法：`setupWebview` + `installChatFixture` + 动态 import 真 `input.js`（副作用注册）；历史夹具直设
> `ctx._inputHistory` / `_historyIdx` / `_inputDraft`，逐测复位；断言面 = 输入框值 + `dispatchEvent`
> 返回值（false = 已 preventDefault）+ `ctx` 指针。happy-dom 已实测可注入 `isComposing` 与 `keyCode: 229`。

#### 11.1.6 验收标准（每条可机器验证）

| AC | 内容 | 验证 |
|---|---|---|
| AC-MA10-1 | 连续上溯 + ↓ 回落（含草稿恢复） | T-MA10-1 / T-MA10-2 |
| AC-MA10-2 | 单行任意位置触发（↑ 载入 / ↓ 吞键 no-op） | T-MA10-3 / T-MA10-8 |
| AC-MA10-3 | 多行非边界不劫持（零 preventDefault）+ 边界门触发 | T-MA10-4 / T-MA10-7 |
| AC-MA10-4 | IME 守卫（`isComposing` + `229` 两分支） | T-MA10-5 |
| AC-MA10-5 | 下拉让位不回归 | T-MA10-6 |
| AC-MA10-6 | Enter 面零回归 + 快层绿 | `node --test test/webview-input-history.test.mjs test/webview-input-enter.test.mjs` 绿 |
| AC-MA10-7 | 新档在册 + 宽度零新增 | `test/files.mjs` 含新档；`check-doc-width` 新增 0 |

#### 11.1.7 边界（本批不做）

- 折行（软换行）单行文本的视觉竖移不保（D-A10-1——如需另案）；
- 历史态编辑丢弃（覆盖式 `_draft`——CLI 批 31 同族既有行为，零改）；
- Enter 面 / Ctrl+I 面 / 中断模态零动；不加新状态字段；CLI 仓零改。

### 11.2 A13——面板说明句（竞品分析 §7.1 项——新用户可理解）

#### 11.2.1 现状核对（as-of 2026-09-11——「三面板」逐一现场复核）

| 面 | 现行 | 结论 |
|---|---|---|
| Task 面板（`#task-panel`） | `panel.taskDesc` 说明句（`panels.js:28` + `locales/en.json:52` / `zh.json:52`） | **已在**——零改 |
| Goal 面板（`#goal-panel`） | `panel.goalDesc` 说明句（`panels.js:44` + locales `:54`） | **已在**——零改 |
| Subagent 面 | 面板已撤（SESSION-ACTIVITY-REVISED F-3）——现行 = 流内活动块（`activity.js`）；**无一句解释** | **缺——本批补** |

> 词映射注：竞品分析 `:197` / `:273` 写作「Plan/Subagent/Goal」；同文档 `:78` 的实况写作
> 「Subagent/Goal/Task 三大实时面板」——「Plan」= task 面板的别名（实际 UI 无独立 plan 面板；
> PLAN 按钮 title 已有）。本设计以实际 UI 三面（Task / Goal / Subagent）为准。

#### 11.2.2 契约（逐字）

| # | 契约点 | 规则 |
|---|---|---|
| C-MA13-1 | 首块说明行 | 每 webview 会话**首个**新建活动块（`buildBlock`——出生/接管/补桩三路径共用）插入说明行 `div.sub-desc`——位置 = `summary` 之后、`.advisor-content` 之前（details 直接子；`refreshBlock` 只重建 summary——说明行不被擦）。 |
| C-MA13-2 | 一次性 | 状态字段 `S._subDescShown`（`state.js` 声明——初始 `false`）；置位后不再插（后续块零说明行）；不随 `resetActivity` 复位（panel 会话生命周期内一次）。 |
| C-MA13-3 | 文案 | locale 键 `sub.desc`（en/zh 双文件）。en 逐字 = `Subagent activity — the agent spawned a helper for an independent subtask. Expand for details; ⏹ stops a background run.`；zh 逐字 = `子代理活动——主 agent 为独立子任务派出的助手。展开看详情；⏹ 可停止后台运行。` |
| C-MA13-4 | 样式 | `.sub-desc`（`chat.css`）——仿 `.panel-desc` 族（`controls.css:354` 现值）：`font-size: 10px; opacity: 0.5; padding: 2px 0;`——零改既有规则。 |

#### 11.2.3 受影响文件（行数口径同 §11.1.4；as-of 实测）

| 文件 | 当前行数 | 预计增量 | 改动 |
|---|---|---|---|
| `webview/activity.js` | 298 | +8 ± 3 | `buildBlock` 首块插说明行 + 标志置位（**298→≤306 越 300 软线：≤500 硬限内——不拆**——单点 8 行、无新函数；再增厚即触发拆分评估） |
| `webview/chat.css` | 470 | +5 ± 2 | `.sub-desc` 规则（明文） |
| `webview/state.js` | 122 | +1 | `S._subDescShown` 字段声明 |
| `locales/en.json` | 247 | +1 | `sub.desc`（en 逐字） |
| `locales/zh.json` | 247 | +1 | `sub.desc`（zh 逐字） |
| `test/activity-flow.test.mjs` | 292 | +18 ± 6 | T-MA13-1..3（292→~310 同带——不拆；**同族超限档 `test/chat-panel.test.mjs`（621 > 500 硬限）**：**本批拆**（F12 硬限无豁免；LEDGER-SELF-CONTAINED 批）——拆档实施 = **已落**（实施轮 E）：余档 `test/chat-panel.test.mjs` **270** 行 / 9 例 · 新档 `test/chat-panel-messages.test.mjs` **373** 行 / 8 例——守恒 **17 = 8 + 9**；`test/files.mjs` 登记 +1） |

#### 11.2.4 用例表（T-MA13-1..3）

| # | 类型 | 输入 | 预期输出 | 回指 |
|---|---|---|---|---|
| T-MA13-1 | 正常 | 空会话 `applySubagentStatus(started, pool)` 首块出生 → 第二块出生 | 首块含 `.sub-desc` 且文案 = `t("sub.desc")`；第二块零 `.sub-desc`（`S._subDescShown` 置位） | C-MA13-1/2 |
| T-MA13-2 | 边界 | `resetActivity()` 后新块出生 | 零 `.sub-desc`（会话内已示——不重复） | C-MA13-2 |
| T-MA13-3 | 回归（双面） | ① `renderTaskPanel` / `renderGoalPanel` 输出；② locales 双文件 | ① 均含 `.panel-desc`（既有说明句在场——防误删）；② `sub.desc` en/zh 两键均在 | §11.2.1 / C-MA13-3 |

> **tail-3 射程核验（修正轮 #6——现场逐行核，2026-09-11）**：`tailLines`（`webview/activity-view.js:68-78`）射程 = `.advisor-content` 的**子元素**
> （`content.children`——非空文本行过滤）；`.sub-desc` 落位 = details 直接子（`summary` 之后、`.advisor-content` 之前——与 `.advisor-content` 互为兄弟）
> ⇒ **不在射程内**——冻结 / 折叠后 summary 的 `sub-tail` 不含说明行（tail-3 不受扰；核验结论登记，无需追加断言）。

#### 11.2.5 验收标准

| AC | 内容 | 验证 |
|---|---|---|
| AC-MA13-1 | 首块说明行在场 + 一次性 | T-MA13-1 |
| AC-MA13-2 | 边界与双面回归 | T-MA13-2 / T-MA13-3 |
| AC-MA13-3 | 快层绿 + 宽度零新增 | VSC 快层全绿；`check-doc-width` 新增 0 |

#### 11.2.6 边界（本批不做）

- 不改 Task / Goal 面板（说明句已在——只回归锁）；
- 不给每个块加说明（仅首块一次）；无新交互元素（纯文本行）；不动 150 窗 / 折叠 / tail-3 逻辑；
- **无 `open` 项**（文案 / 位置 / 一次性语义已全落）。

## 12. 活动区回归：live 固定可见 · 区内原地保留（2026-09-11）

> 需求源 = 批次档 `2026-09-11-VSC-ACTIVITY-REGION-RESTORE（本仓）§1`——用户 17:23 裁定
> 「加回固定活动区」：目标 = D-1 原话（**live 固定可见 + 一个面板**），并保留 09-11 批 10 全部可靠性
> 机制（投递队列/就绪握手/终态防御）与 queued 可见性（F-2）——「干净地基上的活动区」，**非补丁形态**。
> 上下游不变式：扩展端**零改**（§5.1 契约与实现不动）；CLI 端零改（单面板形态照旧——双端不对称 OK）。
>
> **2026-09-12 修订（活动区收口批——A 方案反转；需求 = `AGENT-LOOP（本仓·需求）§16`）：**冻结块去向
> 由「区内原地保留」反转为**终态清退 + 消化后落流**（settled → awaitingDigest 驻留带提示 → 回收
> 归档 `#messages`——落点 = 消化轮边界元素之前）。本 §12 以下条目已由 **§14** 取代/修订：Q1/Q4 选定行、
> D-A1、D-A2、D-A5、D-A7（`trimOldMessages` 零改 → 选择器补 `.sub-block`——T-CL9）、§12.3#3/#4
> （settled 驻留 + 区上限 20 退役）、§12.3#9（防御清扫限区子树 + `freezeLiveBlocks` 区全体归档——C-7/C-8）、
> §12.3#10（150 口径）、§12.4 行 1–3、§12.7 用例表（T-R3/T-R5/T-R6/T-R8/T-R9/T-R14–T-R16；T-R5/T-R6 之现体 = T-V4/T-V2，T-R8/T-R16 已退场——删除记录 = §14）、
> §12.8 AC-R1（`#messages` 零块限「区驻留期」采样）· AC-R2（折叠采样点 = 折叠时刻）· AC-R3、§12.10；
> 其余（区位置/显隐/高度/自滚/⏹/批 10 机制）维持。（修正轮 #1——清单补全 §12.3#9 · D-A7 · AC-R1/AC-R2。）

### 12.1 问题陈述与目标（as-of 2026-09-11）

- 现状（批 10 后）：活动块流尾出生 · 原地冻结（§5 旧版）——**live 块随会话流滚动丢失**
  （用户 17:20 质询「块为什么在会话流里」）。位置回退非用户所愿。
- 目标：恢复固定活动区——**live 固定可见**（不随会话流滚动丢失）+ **单面板**（一个活动区——
  非行面板复活）。
- 硬约束（批 §1）：① 不回补丁地狱——ACTIVITY-REWRITE-SIMPLE 点名的加戏链（DOM move 落流 +
  `freezeInsertPoint` 锚插链 / settle 驻留双态 / `_subagentMap` 逐行簿记 / preview/ticker）（引例——已退场名）
  **不得原样复活**，设计须给干净机制替代；② 可靠性零回归（批 10 三条 + 现行两态机
  live→frozen 原地折叠）；③ 只动 VSC webview 面。

### 12.2 方案选型对比（§1 开放设计问四问——候选 ≥2 逐项判据 + 否决理由）

**Q1 冻结块去向**（判据 = 约束①不复活补丁链 · 约束②「原地」字面 · 批 10 终态防御呈现面 · DOM 有界）：

| # | 候选 | 判据评估 | 结论 |
|---|---|---|---|
| 1 | **区内原地保留**（折叠后留区，上限 20） | 全程零 DOM move（①✓）；容器与 DOM 序号不变（②✓）；补桩块出生即现（批 10✓）；上限保 DOM 有界 | **曾选定——2026-09-12 反转：消化后落流（§14 C-1/C-3）；上限退役（C-6）** |
| 2 | 落流（折叠后移入 `#messages`） | 须 DOM move + 顺序/锚维护（多块乱序、digest 锚插）——补丁链本体（①✗）；与「原地」矛盾（②✗） | 否决 |
| 3 | 折后即移除 | 补桩块出生即消失（批 10「终态必现」不可见✗）；已完成工作不可读 | 否决 |

**Q2 区显隐**（判据 = 零 JS 机制 · 空态零占高 · 与保留策略自洽）：

| # | 候选 | 判据评估 | 结论 |
|---|---|---|---|
| 1 | **有内容才现**（空区 CSS `:empty` display:none） | 零显隐 JS 机制（旧 updateAreaVisibility 不复活）；空态零高；与 Q1 保留自洽 | **选定** |
| 2 | 有 live 才现 | 折叠条目藏而不删（藏 = 层状态；删 = Q1 仅剩否决项） | 否决 |
| 3 | 常驻（空态占位） | 空面板常占一行——与「干净」及 D-2「空时隐藏不占高」背 | 否决 |

**Q3 区高度 / 自滚策略**（判据 = D-2 既有观感 · 多块不挤死会话 · 上读不强拉）：

| # | 候选 | 判据评估 | 结论 |
|---|---|---|---|
| 1 | **自适应 + 32vh 封顶 + 区内自滚 + pin 跟随** | 内容自适应；封顶保会话区高度（D-2 已受）；pin 同 `#messages` 口径（近底 24px——上滚不强拉） | **选定** |
| 2 | 固定高（恒如 20vh） | 单块白占、多块挤 | 否决 |
| 3 | 不封顶 / 不 pin | 多块挤死会话区 / 新块出生不可见（与「固定可见」背） | 否决 |

**Q4 与 digest / 挂起态的交互（挂起期间块驻留语义）**（判据 = 约束②批 10 口径 · 不复活驻留双态）：

| # | 候选 | 判据评估 | 结论 |
|---|---|---|---|
| 1 | **块驻留区 + settled 即时折叠**（digest 与块零位移交互） | 批 10 现行口径原样（settled 视同 done）；挂起期 live 固定可见；digest 文本落 `#messages` | **曾选定——2026-09-12 反转：settled → awaitingDigest 驻留 + 回收归档（§14 C-2/C-3）** |
| 2 | settle 驻留 awaiting digestion 双态 | 复活被点名删除的驻留双态（①✗） | 否决 |

### 12.3 契约（逐条定稿——实现对象）

1. **容器**：`index.html` 在 `#messages` 与 `#panels` 之间插
   `<div id="subagent-activity" role="region" aria-label="Subagent activity"></div>`；
   `base.css` grid 行模板改五行（`auto minmax(0, 1fr) auto auto auto`）+ 区样式（下第 5/6 条）。
2. **出生**：`buildBlock` append `ctx.activityEl` 区尾（`ensureBlock`/`takeoverBlock`/
   `stubTerminalBlock` 三路径共用单点——`#messages` 零 `.sub-block`）。
3. **折叠**：终态原地折叠（父容器与 DOM 序号不变——零 DOM move）；终态集合闭合 / ~~settled
   视同 done~~（**2026-09-12 §14 C-2：settled → awaitingDigest 驻留**）/ answered 裁决 / 幂等守卫 / tombstone——其余原样（§5/§5.1）。
4. **保留**（**2026-09-12 已退役——§14 C-6：区居民 = live + awaitingDigest；`MAX_REGION_FOLDED`/`enforceRegionCap` 已删除（删除记录 = §14 C-6）**）：原折叠块上限 `MAX_REGION_FOLDED = 20`（activity.js 导出常量）——
   `freezeBlock` 折后执行 `enforceRegionCap()`：超出移除 DOM 中最旧 `.sub-frozen`（先序 =
   出生序）；**簿记条目保留**（幂等守卫——与 150 裁同生命周期——resetActivity 才清）。
5. **显隐**：`#subagent-activity:empty { display: none; }`——空区零高、有块即现；零显隐 JS。
6. **高度/滚动**：`#subagent-activity { max-height: 32vh; overflow-y: auto;
   overscroll-behavior: contain; padding: 0 12px; }`；块内 `.advisor-content` 自滚（高度 = 60px——随 §13 批调降，原 100px）。
7. **区自滚（pin）**：`ctx._pinActivity`（默认钉底）——`ui.js` `maybeScrollActivity(ctx)` 在
   块出生（`buildBlock`）与流式帧（`streaming.js` rAF 尾）调用；`initScrollFollow` 为区元素
   挂 wheel/touch 监听（近底 ≥24px——上滚解 pin、回底重 pin；**空安全绑定**——
   `ctx.activityEl?.addEventListener`——fixture 缺区 id 零抛错——评审 #3 收口）；**块出生不再牵动
   `#messages` 滚动**（buildBlock 内原 `maybeScrollDown` 调用移除）。
8. **⏹ 委托**：`chat.js` `onStopClick` 委托目标 `messagesEl` → `ctx.activityEl`（postMessage
   载荷与 preventDefault/stopPropagation 逐字不变；**绑定用空安全调用**——
   `ctx.activityEl?.addEventListener`——生产行为不变、fixture 缺区 id 零抛错——评审 #3 收口）。
9. **resetActivity**：清区全部条目（live + 折叠）+ 清 map + 防御孤儿清（选择器改全类
   `.sub-block`——含折叠）；`freezeLiveBlocks` 原地折叠不变；clearMessages 路径随之区零残留。
   **2026-09-12 修订（§14 C-7/C-8——修正轮 #1）**：防御清扫限定 `ctx.activityEl` 后代（全档
   `.sub-block` 清扫会误删流内归档块＝会话历史——C-7）；`freezeLiveBlocks` 兜底改为**区全体归档**
   （live → 折叠；awaitingDigest → 归档；尾追——C-8）——「原地折叠不变」句随本批失效。
10. **批 10 机制零改**：投递队列 / 就绪握手 / 终态防御（补桩成员表 / 新代接管 / 痕迹）
    **实现面不动**（extension 端零改——协议零改）；**口径修订**（随批改准——语义不变：出生
    必达 / 清屏可恢复 / 控制面不降级）：① 再断言「期望位置」流尾 → **区尾**（§5.1.4 第 2/4 条 ·
    §5.1.5 D-6 · §5.1.6 panel-session 行 · §5.1.7 T-V3 · §5.1.8 AC-A4）；② 位置措辞 sweep
    （§5.1.2 复现手法 · §5.1.4 第 5 条 · §5.1.5 D-4 · §5.1.7 T-V2 · §5.1.8 AC-A1/AC-A3 ·
    §6 · §8.4）。（2026-09-12 §14 修订：本项①维持；新增口径 = 归档块入 150 窗与懒历史锚——§14 T-CL9）

### 12.4 旧机制对照（§1 约束①点名清单——逐项替代）

| 被删加戏链（ACTIVITY-REWRITE-SIMPLE 点名） | 本批替代 | 说明 |
|---|---|---|
| DOM move 落流（live→冻结移入 `#messages`） | **区驻留期不移动；消化回收后归档落流（2026-09-12 §14——非旧链，对照 §14.4）** | 出生地与驻留地 = 活动区；折叠只改 class/open；归档 = 单次插入（轮边界/尾追） |
| `freezeInsertPoint` 锚插链（settle 锚/降序 insertBefore/150 裁退化） | **整体已删除——2026-09-12 §14 C-4：轮边界单点引用取代（旧链三组件仍全无；删除记录 = §14 C-4）** | 无 per-block 锚、无降序排序、无位移校正；边界失效单分支退化尾追 |
| settle 驻留双态（awaiting digestion） | **2026-09-12 修订：awaitingDigest 单标志驻留（§14 C-2——非旧双态机）** | 无第二状态机、无补发 done 位移 |
| `_subagentMap`（已退场——现体 = `S._subBlocks`）逐行簿记 | **单 map（S._subBlocks）原样** | 键 = 频道名；折叠条目 = 幂等守卫（情形同 150 裁） |
| preview / ticker | **保持删除** | 无 report preview、无 1s 时钟（头词事件驱动） |

### 12.5 关键决策记录（含否决备选）

| # | 决策 | 否决备选 / 理由 |
|---|---|---|
| D-A1 | 块终身居住活动区、折叠不落流（Q1-1）——**2026-09-12 反转** | 否决落流（DOM move 链复活）与折后移除（补桩不可见）——**反转后：消化后归档落流（D-CL1）；旧锚链仍禁（§14.4）** |
| D-A2 | 折叠块区内保留上限 20——**2026-09-12 退役（§14 C-6）** | 否决无上限（DOM 无界——同 150 窗纪律）；否决零保留（= 折后移除） |
| D-A3 | 显隐 = CSS `:empty`（零 JS） | 否决常驻空面板 /「有 live 才现」（Q2 表） |
| D-A4 | 32vh 封顶 + 区 pin 跟随（同 `#messages` 口径） | 否决固定高 / 不封顶 / 不 pin（Q3 表） |
| D-A5 | settled 即时折叠；digest 与块零位移交互——**2026-09-12 修订（§14 C-2/C-3）：settled → awaitingDigest 驻留（单标志）+ 回收归档** | 否决旧驻留双态机复活（约束①） |
| D-A6 | ⏹ 委托迁区（单委托点） | 否决双委托（`messagesEl` 残留死码）；冻结块无 ⏹ 语义不变 |
| D-A7 | ~~`trimOldMessages` 零改（块自然出窗）~~——**2026-09-12 修订（§14 T-CL9/D-CL11——修正轮 #1）：`ui.js` `trimOldMessages` 与 `history.js` 两处锚选择器补 `.sub-block`（150 窗与懒历史含归档块）** | 否决豁免（DOM 无界——同 150 窗纪律） |
| D-A8 | resetActivity = 全区清（含折叠块） | 否决折叠块跨清屏保留（新会话残留 = 错显；块无跨 reload 角色） |

### 12.6 受影响文件全清单（行数口径 = `split("\n").length` 含末行；as-of 2026-09-11 实测）

**实施域（VSC 仓——eng-coder；12 改 = 9 源 + 3 测试，代码面 ~+60 / 测试面 ~+53）**：

| 文件 | 现行 | 预计增量 | 改动 |
|---|---|---|---|
| `webview/index.html` | 85 | +2 | 区容器 div（`#messages` 与 `#panels` 之间） |
| `webview/base.css` | 435 | +~18 | grid 五行 + 区样式（`:empty`/32vh/自滚/overscroll） |
| `webview/state.js` | 122 | +1 | `ctx.activityEl` |
| `webview/activity.js` | 298 | +~15 | `buildBlock` 目标区 + `MAX_REGION_FOLDED` + `enforceRegionCap`（两常量已退场——删除记录 = §14 C-6） + `resetActivity` 全区清 + 头注 |
| `webview/ui.js` | 483 | +~12 | `maybeScrollActivity` + `initScrollFollow` 区监听 |
| `webview/streaming.js` | 247 | ±5 | rAF 尾区 pin + 头注 |
| `webview/chat.js` | 355 | ±3 | ⏹ 委托迁区 |
| `webview/chat.css` | 470 | ±1 | 注释同步（`.sub-frozen` 句「入流」措辞） |
| `webview/activity-view.js` | 157 | ±4 | 头注同步（零逻辑） |
| `test/helpers/webview-env.mjs` | 91 | +1 | fixture `#subagent-activity` id 回归 |
| `test/activity-flow.test.mjs` | 292 | +~40 | 区语义改写（出生/折叠/上限/显隐/自滚/委托）+ 头注；T-R13 手法（追加补 id + 真 chat.js 图——§12.7 注） |
| `test/async-visibility.test.mjs` | 388 | ±12 | helper/fresh 改区 + 位置断言改区 |

**文档域（设计者已落——coder 零碰）**：`docs/design/WEBVIEW.md` 1029 →（§2/§3/§5/§5.1 修订 +
§12 新节 + 变更记录顺延 §14——今 §15）· `docs/design/AGENT-LOOP.md` 1045 →（§1 模块行 / §7 挂起 UI / §10 改写 +
变更记录）· `docs/design/SESSION-ACTIVITY-REVISED.md`（取代指针）· `docs/design/ACTIVITY-REWRITE-SIMPLE.md`
（取代指针）。**需求树**：本批条目落 `AGENT-LOOP（本仓·需求）§12`（修正轮补——评审 #6 收口；同口径 §3/§8~§11）。**拆分评审注**：activity-flow 292→~332 越 ≤300 警示线（≤500 硬限内）——测试族存量
同带（最高 `chat-panel.test.mjs` 620）——本批**不拆分**（就地改写）；**同族超限档 `test/chat-panel.test.mjs`（621 > 500 硬限）**：**本批拆**（F12 硬限无豁免；LEDGER-SELF-CONTAINED 批）——拆档实施 = **已落**（实施轮 E）：余档 `test/chat-panel.test.mjs` **270** 行 / 9 例 ·
新档 `test/chat-panel-messages.test.mjs` **373** 行 / 8 例——守恒 **17 = 8 + 9**；`test/files.mjs` 登记 +1。

**拆分评审注（源侧——评审 #5 收口）**：`activity.js` 298→~313 越 ≤300 警示线（≤500 硬限内）——
增量 = 区目标 + `MAX_REGION_FOLDED`/`enforceRegionCap`（已退场——删除记录 = §14 C-6） + reset 全区清 + 头注
（仅 1 个小 helper + 1 个常量——无大函数面）——本批**不拆分**；**再增厚即触发拆分评估**（同 §11.2.3 判据；A13 基线漂移与
§11.2.1 交接登记见批次档 §2）。

**fixture 波及面（评审 #3 收口）**：⏹ 委托（`chat.js`）与区监听（`scroll.js`→`ui.js`）一律
**空安全绑定**（`ctx.activityEl?.addEventListener`——生产行为不变）；`test/digest-visibility.test.mjs`
与 `test/integration/scenario-05-panel-basics.test.mjs`（各自自持 id 夹具）**不列写域、零改**——
webview-env +1 照旧（`installChatFixture` 区 id——区语义断言的宿主）；T-R13 手法见 §12.7 注。

**不入 files**：`docs/TODO.md`（产品级台账已退役——台账单仓化：现体 = 仓根 `docs/TODO.md`） / `CHANGELOG.md`（父侧）；CLI 仓代码/设计/测试文件（本批 VSC 单端——
需求树除外：本批条目落 `AGENT-LOOP（本仓·需求）§12`，同口径 §3/§8~§11）；群 A §11/§13/§15 节域零碰。

### 12.7 用例表（正常 / 边界 / 错误——T-R1..T-R16〔T-R5/T-R6 之现体 = T-V4/T-V2；T-R8/T-R16 已退场——删除记录 = §14〕；activity-flow 族改写 + async-visibility 更新）

| # | 用例 | 输入 | 预期输出（可机判） | 回指 |
|---|---|---|---|---|
| T-R1 | 区出生 | `started`（pool:true） | 块 parentNode === `ctx.activityEl` + 区尾位 + `#messages` 零块 | §1 目标 |
| T-R2 | 内容入块 | chunk（tool/text） | appendAdvisorChunk 入块（区） | F-1 |
| T-R3 | 原地折叠 | 终态消息 | 父容器与 DOM 序号不变 + class 换 + open=false + ⏹ 移除（**2026-09-12 §14：折叠后即时归档/驻留——采样分路，见 T-CL1/T-CL3**） | 约束② |
| T-R4 | queued 三分支 | queued→started→cancelled(was:queued) | ⏳+取消⏹ / 翻 running / 头移除——区内 | F-2 |
| T-R5（改指——现体 = `T-V4` / `T-V5`，`test/async-visibility.test.mjs`） | 终态补桩 | never-born done（family+id） | 区内补出已折叠桩 + `late-terminal-stub`（**2026-09-12 §14 C-5：折叠 + 立即归档——采样点 = 流内**） | 批 10 |
| T-R6（改指——现体 = `T-V2`，`test/async-visibility.test.mjs`） | 新代接管 | 冻结键 + 新 started | 区内新块接管 + `takeover` + 旧块在区（**2026-09-12 §14 C-5：旧 awaiting 块即时归档、已归档块在流内**） | 批 10 |
| T-R7 | 区显隐（边界） | 移除末块 / 首块出生 | children 0↔N；`:empty` 规则在位（静态断言）——已退场（段删——2026-09-12-PROSE-ANCHOR-RETIRE；删除记录 = `TESTING.md` §8.1）；DOM 层 `matches(":empty")` 命中断言保留 | Q2 |
| T-R8 | 区上限（边界） | 21 折叠块 | 最旧折叠块 DOM 先出；live 不裁；被移除频道迟来丢弃（**2026-09-12 已退役——删除记录 = §14 C-6：无折叠块常驻可裁**） | Q1 |
| T-R9 | live 不裁（边界） | 区 live + 150 消息裁 | live 仍在区；`#messages` 窗只数消息（**2026-09-12 §14：窗计数含归档 `.sub-block`——T-CL9**） | §12.3#10 |
| T-R10 | 区自滚（边界） | 区块更新 / wheel 上滚 / 回底 | pin 钉底 / 解 pin 不强拉 / 回底重 pin | Q3 |
| T-R11 | 清屏恢复 | clearMessages 模拟 → 再断言 | 区零残留；重建块（pool/⏹/startedAt）落区尾 | 批 10 |
| T-R12 | 回合中止 | resetActivity | 全区清（含折叠）+ map 清 | §12.3#9 |
| T-R13 | ⏹ 委托（错误面） | 区内点击 `.sub-stop-btn` | `cancelSubagent` postMessage 逐字 + 不翻折叠 | §12.3#8 |
| T-R14 | 迟来丢弃（错误面） | 折叠后 / 被上限移除后 chunk | 一切丢弃（返 null / 冻结守卫）（**上限路径退役——§14 C-6；折叠守卫不变**） | §12.3#4 |
| T-R15 | error/answered | error / consult answered | 头词与裁决保真（**2026-09-12 §14：终态折叠 + 即时归档——采样点 = 流内**） | F-1 |
| T-R16 | 兜底折叠 | freezeLiveBlocks（suspension 退出） | 残余 live 原地折叠（区内——不移动）（**2026-09-12 已退役——§14 C-8 区全体归档取代（live 折叠 + awaiting 归档，尾追）；删除记录 = §14 C-8**） | 约束② |

> **T-R13 手法（评审 #4 钉死——在 activity-flow 内）**：本档 `before()` 照旧 `installChatFixture`（本批 +1 区 id）；
> T-R13 先**追加式**补齐 `chat.js` 顶层 init 所需 id——对照 `installFullIndexFixture` 全量清单补缺项 21 个
> （`chat-container` · `session-bar` · `session-arrow` · `new-session-btn` · `panels` · `toolbar` · `at-dropdown` ·
> `input-row` · `file-input` · `attach-btn` · `paste-bar` · `paste-badge` · `controls-row` · `auto-btn` · `advisor-btn` ·
> `eng-btn` · `plan-btn` · `settings-btn` · `settings-panel` · `settings-close` · `settings-body`）——**append 进既有
> DOM、不换夹具**（既有 `ctx` 引用零失效），随后 `await import("../webview/chat.js")` 引导真模块图（模块缓存——
> 同档各测共享）。断言面 = `capturedPosts`（`setupWebview()` 返回）过滤 `type==="cancelSubagent"` 恰一条且
> `{type, id, role}` 逐字（`deepEqual`——`id` 数值化）+ 点击事件 `defaultPrevented === true`（preventDefault 真触）+
> 挂 `document` 的见证 listener 零命中（stopPropagation 真触）+ 块状态不翻（`sub-live` 保持 / `open` 不变）。
> **不得**只做源码 grep 断言——postMessage 与两个拦截必须真被驱动。

### 12.8 验收标准（逐条回指——每条可机器验证）

- **AC-R1（§1 目标——live 固定可见 + 单面板）** = T-R1/T-R9：一切出生块 parentNode ===
  `#subagent-activity`；`#messages` 内 `.sub-block` 计数 == 0（**2026-09-12 修订——修正轮 #1：
  采样限定「区驻留期/出生时刻」——归档后流内 `.sub-block` = 归档块（§2/§14 C-3；需求侧 F-J1 同口径）**）；
  区位于 messages 与 panels 之间（index.html 结构断言）。
- **AC-R2（§1 约束②——两态机）** = T-R3/T-R5/T-R6/T-R15/T-R16（T-R5/T-R6 之现体 = T-V4/T-V2；T-R16 已退场——删除记录 = §14）：折叠原地（容器/序号不变；**2026-09-12
  修订——修正轮 #1：采样点 = 折叠时刻——折叠后归档为 §14 C-3 语义，不再回采**）；
  终态闭合 / 幂等 / queued / 补桩 / 接管断言全绿。
- **AC-R3（Q1——冻结块去向）** = T-R8（已退场——删除记录 = §14 C-6）/T-R14：折叠块在区不落流；上限 20 丢最旧；簿记守卫保留。**（2026-09-12 反转——AC-CL1：消化后归档落流；上限退役——§14）**
- **AC-R4（Q2——区显隐）** = T-R7：空区 children==0；`:empty` 规则静态断言——已退场（段删——2026-09-12-PROSE-ANCHOR-RETIRE；删除记录 = `TESTING.md` §8.1）；块入区即现。
- **AC-R5（Q3——高度/自滚）** = T-R10 行为面（pin 钉底 / 解 pin 不强拉 / 回底重 pin）；静态样式断言（32vh / overflow-y / overscroll）——已退场（段删——2026-09-12-PROSE-ANCHOR-RETIRE；删除记录 = `TESTING.md` §8.1）。
- **AC-R6（Q4——digest/挂起）** = T-R5/T-R16（T-R5 之现体 = T-V4；T-R16 已退场——删除记录 = §14） + §5.1 位置口径修订在位（流尾→区尾——文档断言）。
- **AC-R7（§1 约束②——零回归）** = VSC 快层全绿；extension 端 git diff 空（协议零改）；
  trace/接管/补桩调用点在位（机检）。
- **AC-R8（reset/清屏）** = T-R11/T-R12。
- **AC-R9（⏹ 委托）** = T-R13。
- **AC-R10（文档面）** = WEBVIEW §2/§3/§5/§5.1/§12/§15 + AGENT-LOOP 三处 + 两沿革档指针在位；
  `check-doc-width` 新增超宽 0。

### 12.9 边界（本批不做）

- 不做 CLI 端（单面板照旧）；不动扩展端协议与实现（投递队列/握手/终态防御零动）；
- 不做行面板复活；不做跨 reload 恢复；不加新交互元素 / 新 locale 键；不动块内渲染
  （chat.css 块样式原样——仅注释同步）；
- 不动 advisor 流内块（`S._advisorBlock` ∈ `#messages`——非子代理面）；
- **群 A 实施面重叠**：A13（`.sub-desc` 首块说明行——`webview/activity.js`/`chat.css`/`state.js`/
  `locales`/`activity-flow`）与本批同档——由父侧按 files 域串行调度（本批先落——A13 其后叠加）；
  WEBVIEW §11 节域本批零碰。

### 12.10 UI / 交互决策落档

全落定（**无 open 项**）：区位置 = `#messages` 与输入之间（`#panels` 之上）；空区隐藏零高；
32vh 封顶 + 区内自滚；pin 跟随（同 `#messages` 口径）；~~折叠块区内保留上限 20~~（2026-09-12
退役）；无新按钮 / 新交互（⏹ 语义不变、仅迁址）；aria = `role="region"` + 静态 label（英文——随 index.html 惯例，
不加 locale 键）。**可调常量**（批准环节可翻转）：~~`MAX_REGION_FOLDED = 20`~~、`max-height: 32vh`。（2026-09-12 修订：上限退役 + 消化后归档落流——§14；其余维持）

## 13. live 块 UX：流式跟滚 + 内容区高度 60px（2026-09-11）

> 需求源 = 批次档 `2026-09-11-VSC-LIVE-UX（本仓）§1`——用户 23:29 实测两条
> （live 块默认显示内容头部、不跟流式输出滚动、得手动滚；live 块高度 100 → 60），范围假设 =
> 只动 live 块（`.sub-block`——advisor 流内评审块维持 100px）。需求树 = CLI 仓
> `AGENT-LOOP（本仓·需求）§14`（F-LU1/F-LU2 + N-LU1~N-LU3——本批新增）。
> 上游机制零碰（§5/§5.1/§12 实现面不动——本批只加块级跟滚 + 改一处高度值）；测试独立成档
> `test/activity-live-ux.test.mjs`（activity-flow 近满——不追加口径）。

### 13.1 问题陈述与现场核实（as-of 2026-09-11 现状实测）

- **live 块内容区零跟滚消费点（用户实测根因）**：activity 族（`activity.js` / `activity-view.js`）
  对 `.advisor-content` 无任何 scrollTop 写点；`webview/*.js` 全量中 `.advisor-content` 相关
  scrollTop 写点仅 `streaming.js:59-60` 一处（流内 advisor 块——见下行更正）。流式追加链
  （`streaming.js:239-248` `subagentChunk` → `ui.js:41-94` `appendAdvisorChunk`）只落 DOM 不触滚动
  ——内容区滚动位置停在头部，与用户实测一致。
- **§1 事实表 #3 措辞更正（本设计现场复核）**：`webview/*.js` 对 `.advisor-content` 并非全量
  「零命中」——`streaming.js:56-62` 有**流内 advisor 块**（`S._advisorBlock` ∈ `#messages`）的
  裸钉底消费点（`_advisorScrollDirty`——每帧 `scrollTop = scrollHeight`，无让位语义）；「live 块
  无消费点」部分与现场一致（activity 族零写点）。该面 ≠ live 块面——本批不动（§13.8 边界登记）。
- **高度现状**：`chat.css:317-326` 基础 `.advisor-content { max-height: 100px; … }`（流内评审块
  与子块共用）；`chat.css:465-468` 子块覆盖行 = 100px；`:465-467` 注释 = 2026-09-05 设定
  （「advisor/subagent 均 100px」——本批后不再成立，随 C-LU3 改述）。
- **既有钉底族（同款基准——本批语义来源）**：`ui.js:448-456`（`#messages`——`_pinBottom` 旗标 +
  `Number.MAX_SAFE_INTEGER` 超值写）；`ui.js:460-463`（活动区——`_pinActivity`，同旗标 idiom）；
  `ui.js:481-491`（`initScrollFollow`——wheel/touchmove 监听 + 近底 24px 判据 + 空安全绑定）。
- **区级 pin 与块级跟滚的叠加关系（外层 / 内层）**：区（`#subagent-activity`——§12.3 第 6/7 条）
  管**块的可见性**（块出生与流式帧区钉底）；块内容区管**单块内容下列**（本批新增）。两层 = 独立
  状态、互不写对方；同一 wheel 事件可同时到达两层监听器（冒泡）——各按**自身元素几何**更新自身
  判据（区看区几何、块看块内容几何——§13.3 第 1/2 条）。

### 13.2 方案选型对比（U1 装载面——判据 = §1 约束「对齐既有形态 / 不新造第三种模式」+ 无每 chunk 同步布局 + 动态 N 块目标可承载）

| # | 候选 | 判据评估 | 结论 |
|---|---|---|---|
| 1 | **块级 follow 载体（旗标 + wheel/touch 让位 + rAF 帧应用）**——`activity.js` 落 `initBlockFollow`/`maybeScrollBlock` | 语义逐条对位既有族（近底 24px / 上滚解钉 / 回底重钉——`ui.js:481-491` 同规）；应用并入既有 rAF（无每 chunk 同步布局——`streaming.js:26-27` 代价口径）；动态 N 块各有自家旗标位 | **选定** |
| 2 | 追加点内联裸钉底（`subagentChunk` 内 `scrollTop = scrollHeight`——同 `streaming.js:60` 流内块形态） | 每 chunk 强制同步布局（既有代价口径点名）；**无让位语义**——与 U1「手动上滚让位」硬性冲突；多块各拍写无帧合并 | 否决 |
| 3 | 无状态几何判定（应用时按当前 gap < 24 才写——零监听零旗标） | 让位信号 = 应用时几何派生（≠ 族内「事件维护旗标」）——§1 点名模式（近底判定 + wheel/touch 让位）缺后者，属新造模式；边缘场景（滚动条拖拽 / 单格滚）虽更稳——如后续实证要改族口径，应与族同批改 | 否决 |
| 4 | `ui.js` 滚动族泛化为动态目标表（`initScrollFollow` watch 扩展） | ctx 键模型 = 定长双目标——N 动态块状态无处安放（仍须元素 expando）；`ui.js` 492 行距 500 硬限 8 行余量（不可再增） | 否决 |

**U2（高度）**：改动面唯一（值 + 注释），范围假设（改子块覆盖行、基础行不动）单候选——显式声明
「单方案——无对比」；选择与理由落 §13.4 D-LU4。

### 13.3 契约（逐条定稿——实现对象）

1. **C-LU1 块级跟滚语义（`activity.js`）**：新增模块内 `initBlockFollow(block)`——取
   `block.querySelector(".advisor-content")`，为其挂 `wheel` / `touchmove` 监听（`{ passive: true }`），
   处理式 = `内容区._pinFollow = (scrollHeight - scrollTop - clientHeight) < 24`（近底 24px——与
   `ui.js:485` 同口径）；内容区缺失零操作。新增导出 `maybeScrollBlock(block)`：`!block?.isConnected
   || !block.open` → no-op（折叠 / 已移除零滚动副作用）；`内容区._pinFollow !== false`（默认钉底——
   同 `ctx._pinBottom !== false` idiom）→ `内容区.scrollTop = Number.MAX_SAFE_INTEGER`（写超值不读
   scrollHeight——`ui.js:449-450` 口径）。`buildBlock` 内 `ctx.activityEl.appendChild(block)` 之后
   （`maybeScrollActivity(ctx)` 邻位）调用 `initBlockFollow(block)`——出生路径三路（出生 / 接管 /
   补桩）共用单点，全部块获监听（补桩 = 折叠块，应用侧 open 守卫天然跳过）。
2. **C-LU2 帧驱动（`streaming.js`）**：`subagentChunk` 追加后把块记入脏集（`_subScrollDirty`——Set
   惰性建，`_advisorScrollDirty` 邻位）；`scheduleStreamRender` rAF 体内处理脏集（逐块
   `maybeScrollBlock(block)` → 置空）；**节流重排条件（`streaming.js:43`）补 `_subScrollDirty`**——
   节流跳过帧不得丢跟随（尾 chunk 场景）；rAF ≥50ms 节流与渲染面零改。
3. **C-LU3 高度（`chat.css`）**：`:468` 值 `100px → 60px`（选择器不变——
   `.advisor-block.sub-block .advisor-content`；live 与冻结同卡面统一）；`:465-467` 注释改述（逐字）：

   ```css
   /* Subagent/consultation activity blocks — 60px content height (2026-09-11 live 块 UX：
      用户设定 100→60——单块占高更小；advisor 流内评审块维持基础 100px), dimmer title —
      collapsible, reopenable, height 0 when closed. */
   ```

   `:318` 基础规则维持 `100px`（advisor 流内评审块）。
4. **C-LU4 注释 / 口径 sweep（实现面）**：`streaming.js:56-58` 注释「（…子代理块随流内 append——
   无强制滚动——简单形态——B1 参照）」改述（子代理块跟滚 = `_subScrollDirty` / `maybeScrollBlock`
   承担——见 §13）；`activity.js` 头注职责段补「块内容跟滚（§13）」；`activity-view.js` 头注
   「本叶零参与显隐 / pin」句维持（其面零改——块级跟滚载体不在叶内）。
5. **C-LU5 测试与入册**：新档 `test/activity-live-ux.test.mjs`（happy-dom + `installChatFixture`——
   手法同 `async-visibility` webview 侧；`until` 轮询等待 rAF 帧）；`test/files.mjs` 入册一行
   （显式清单——不登记不跑——`doc-consistency` T64 纪律）。

### 13.4 关键决策记录（含否决备选）

| # | 决策 | 否决备选 / 理由 |
|---|---|---|
| D-LU1 | 跟滚载体 = 旗标 + wheel/touch 让位（族对齐） | 否决内联裸钉底（无让位）/ 几何派生（新造模式）/ watch 泛化（状态模型不符）——§13.2 |
| D-LU2 | 应用并入流渲染 rAF（≥50ms 节流） | 否决每 chunk 同步布局（`streaming.js:26-27` 已点名代价；帧合并天然去抖） |
| D-LU3 | 载体落 `activity.js`（非 `ui.js`） | `ui.js` 492 行距 500 硬限 8 行——不可再增；`activity.js` = 块生命周期家（出生 / 折叠 / 簿记）+ 零新 import 边（streaming→activity 已存在）。**拆分评估**见 §13.5 |
| D-LU4 | 高度作用域 = `.sub-block` 全部（live + 冻结同 60px） | 否决仅 `.sub-live`（冻结展开态须同卡面——live/frozen 不二分）；advisor 流内评审块 100px 不动（§1 假设——如需同改，用户一句话） |
| D-LU5 | 测试独立成档 + `test/files.mjs` 入册 | activity-flow 486 行近满（口径×2：「近 500 不再追加」/「同族档已满独立成档」）——不拆 activity-flow、不追加 |
| D-LU6 | WEBVIEW 节号：新 §13 + 变更记录顺延 §14 | 节号 = 文档位序惯例（同口径：§9→§13 顺延）；存量指注同步 sweep（§2 沿革行 / §12.6 / §12.8；修正轮 #2） |

### 13.5 受影响文件全清单（行数口径 = `split("\n").length` 含末行；as-of 2026-09-11 实测）

**实施域（VSC 仓——eng-coder；5 改 = 3 源 + 2 测试档：1 新 1 入册；代码面 ~+40 / 测试面 ~+140）**：

| 文件 | 现行 | 预计增量 | 改动 |
|---|---|---|---|
| `webview/activity.js` | 328 | +~26 | `initBlockFollow` + `maybeScrollBlock` + `buildBlock` 接线 + 头注 |
| `webview/streaming.js` | 249 | +~12 | 脏集 + rAF 处理 + 重排条件 + 注释改述 |
| `webview/chat.css` | 477 | ±4 | `:468` 值 60px + `:465-467` 注释改述 |
| `test/activity-live-ux.test.mjs` | 新档 | ~140 | T-LU1..T-LU6（新档——同 activity-flow 族手法） |
| `test/files.mjs` | 72 | +1 | 新档入册行 |

**不动面（零碰——反断言）**：`webview/ui.js`（492 行近硬限）· `webview/activity-view.js` ·
`webview/state.js` · `webview/index.html` · `webview/base.css` · `locales/**` ·
`test/helpers/webview-env.mjs`（fixture 已具）· `test/activity-flow.test.mjs`（近满——零追加）。

**文档域（设计者已落——coder 零碰）**：`docs/design/WEBVIEW.md` 1257 →（§13 新节 + §12.3 第 6 条
改指 + 节号 sweep + 变更记录顺延 §14）· 需求树 = `AGENT-LOOP（本仓·需求）§14`；
`docs/TODO.md`（产品级台账已退役——台账单仓化：现体 = 仓根 `docs/TODO.md`） / `CHANGELOG.md` 归父侧。

**拆分评审注**：`activity.js` 328→~354 越 300 软线（<500 硬限）——结论不拆：增量 = 2 小函数
（~12 / ~8 行）+ 1 行调用 + 头注；再增厚触发拆分评估。`ui.js` 492 近硬限——本批零碰。测试面
独立新档（`activity-flow` 486 近满——「不再追加」口径）。

### 13.6 用例表（正常 / 边界 / 错误——T-LU1..T-LU6；新档 `test/activity-live-ux.test.mjs`）

| # | 用例 | 输入 | 预期输出（可机判） | 回指 |
|---|---|---|---|---|
| T-LU1 | 追加钉底（正常） | `ensureBlock` 建块（出生接线）+ 内容区几何（scrollHeight 500 / clientHeight 60）→ `subagentChunk` 追加 → 等帧 | 内容区 `scrollTop === Number.MAX_SAFE_INTEGER`（真链：chunk → 脏集 → rAF） | U1 |
| T-LU2 | 上滚让位（边界） | `initScrollFollow(ctx)` + 区几何（scrollHeight 210 / clientHeight 200）；内容区 scrollTop=100（gap 340）→ wheel（bubbles） | 旗标 `_pinFollow === false`；追加后 scrollTop 仍 100（不回弹）；区 pin `_pinActivity === true`（两层独立——同一事件各按自身几何） | U1 |
| T-LU3 | 近底复钉（边界） | 内容区 scrollTop=460（gap −20 < 24）→ wheel → 追加 | 旗标 `true`；等帧后 scrollTop === 超值 | U1 |
| T-LU4 | 折叠零副作用（边界） | live 块 `open=false`；scrollTop=100 → 追加 → 等帧（含节流重排） | scrollTop 仍 100 且内容含新文本（追加发生、滚动被抑） | U1 |
| T-LU5 | CSS 高度（契约·静态） | — | 已退场（整删——2026-09-12-PROSE-ANCHOR-RETIRE；删除记录 = `TESTING.md` §8.1（`:114`）） | U2 |
| T-LU6 | 防御 no-op（错误面） | 已移除块 / 已冻结块上 `maybeScrollBlock` | 零抛错、零写（scrollTop 保持原值） | U1 |

### 13.7 验收标准（逐条回指——每条可机器验证）

- **AC-LU1（U1——钉底）** = T-LU1：追加后内容区钉底（真链 subagentChunk → rAF）。
- **AC-LU2（U1——让位）** = T-LU2：上滚后追加不回弹 + 区/块两层互不写对方状态。
- **AC-LU3（U1——复钉）** = T-LU3：近底 wheel 后追加复钉超值。
- **AC-LU4（U1——边界）** = T-LU4/T-LU6：折叠 / 已移除态零滚动副作用、零抛错。
- **AC-LU5（U2——高度）** = 已退场（随 T-LU5 整删——2026-09-12-PROSE-ANCHOR-RETIRE；删除记录 = `TESTING.md` §8.1（`:114`））。
- **AC-LU6（零回归 / 单端）** = VSC 快层全绿（含新档）；`_advisorScrollDirty` 分支在位（流内
  advisor 路径零改——机检）；CLI 仓代码 diff 空；`src/extension/**` 零改动
  （扩展端协议与实现零改——`git status` 机检；修正轮 #1）。
- **AC-LU7（文档面）** = 本节 + §12.3 第 6 条改指 + 节号 sweep 在位 + 需求档 §14 在位；
  `node scripts/check-doc-width.mjs` 新增违规 0。

### 13.8 边界（本批不做）

- 不动流内 advisor 块（`S._advisorBlock`）跟滚——其裸钉底（`streaming.js:56-62`）无让位语义属
  既有口径，本批保留原样（如需对齐，另批）；不动其高度（100px 基础值）；
- 不动区级 pin（`maybeScrollActivity`）/ 块头 / tail-3 摘要（`refreshBlock` 零变）/ ⏹ / 区显隐；
- 无新交互元素 / 新按钮 / 新 locale 键；不做跨 reload；
- CLI 仓代码与测试零改（需求档 §14 新增条目除外——设计者已落）；不碰在途批域
  （VSC-CONTEXT-PARITY / 机制纪律批——提示词文本面）。

### 13.9 UI / 交互决策落档

全落定（**无 open 项**）：钉底默认 + 上滚让位 + 近底 24px 复钉（族同规）；应用帧 = 流渲染 rAF
（≥50ms 节流）；高度 60px（live + 冻结同族卡面）。**可调常量（批准环节可翻转）**：60px 数值本身；
**登记行**：advisor 流内评审块是否同改 60px——用户一句话即可（§1 假设维持 100px）。

## 14. 活动区收口：终态清退落流 · digest 可读性 · 块头/状态行字段对齐（2026-09-12）

> 需求源 = 批次档 `2026-09-12-VSC-ACTIVITY-CLOSURE（本仓）§1`——用户 2026-09-12
> 走查五连：01:03「live 块执行完没有从子agent面板清除，digest 过程远不如 CLI 清晰」· 01:09「1走A」
> （**A 方案 = 终态块出活动区、内容进会话流 = CLI 语义**——对 §12 的反转，须两档修订）· 01:10
> 「live 块的标题信息我也希望对齐」· 01:13 Send 可见性与拒发矛盾 · 01:17「状态行那条，我也希望对齐 CLI」。
> 需求条目 = `AGENT-LOOP（本仓·需求）§16`（F-R1..F-R6）；本批 R1–R6 对位 = AC-CL1..AC-CL6。
> 本 §14 吸收 §12 中被反转条目——**条目清单以 §12 修订注为准**（该注逐项列明「以 §14 为准」的条目；
> 反转不静默）。
> （修正轮 #9——原内联清单缺 D-A7/§12.3#9/AC-R1/AC-R2，改纯指针句消除双清单漂移。）

### 14.1 问题陈述与现场核实（as-of 2026-09-12——逐条 file:line）

**面一·清退（R1）**：

- 出生位 = 区尾（`activity.js:109`）；终态 = **原地折叠**（`:180-192`——class 翻转 + `open=false` +
  ⏹ 移除，零 remove / 零 DOM move）；`settled` 视同 done **即时折叠、无 awaitingDigest 驻留**（`:302-322`）；
  区清退路径穷举 = 上限 20（`:194-201`）/ reset（`:348-353`）/ queued 取消（`:290-300`）——
  **终态块永久驻区**（全完成后区仍常驻 32vh）。
- 目标语义（CLI）：面板判据 `!s.done || s.awaitingDigest`（`src/tui/subagent-panel.mjs:43`（CLI 仓））；
  清退动作点 = done → `freezeSubTaskLines` + `delete state.subTasks[key]`（`subagent-blocks.mjs:235-245`）；
  冻结进流 = splice 至 `_freezeAt` 锚（`subagent-freeze.mjs:88-95`）；面板零驻留（`layout.mjs:121`）。

**面二·待消化提示（R3）**：CLI 块级有——`subagent-panel.mjs:104` `statePart = "done · awaiting digestion"`；
VSC 块级无（settled 即折叠）；仅状态行聚合 `status-bar.js:40-50`（`⏳ N 个… · M 份报告待消化`）。

**面三·digest 可读性（R2）**：CLI 可见面 = 起跑 dim 行（`suspension-drive.mjs:160-162`）· autoTurn 不画
假用户气泡但 assistant 标签照画（`agent-turn.mjs:76-82`）· turn-cap 两行（`agent-turn.mjs:188/192`）。
VSC 差异：① 消化轮无回合标签（`ui.js:205-211` `assistantLabeled` 无 auto-turn 复位点）；② turn-cap
完全静默（`panel-chat.mjs:436-448`）；③ `#digest-status` 单元素跨轮复用（`chat.js:322-328`）——
第 2 轮「正在消化…」出现在第 1 轮输出上方（跨轮位置漂移）。

**面四·块头字段（R4）**：CLI 权威 = `subagent-panel.mjs:85`（`[icon key · 模式 · 模型 · Ns · turn N/M]`）+
`:96-110` 状态区 + 参数摘要 `:107-109`（` — ${command ≤60}`）。VSC 现态 = `activity-view.js:32-59`
（queued 仅 `[⏳ label]`——`:34` 自述「无位置/原因词」；状态词 = 工具文本尾句；无结构化 tool/args）；
数据面：queued 载荷携 `position`/`waiting`/`reason`（`subagent-scheduler.mjs:418-423`）但 webview 弃用；
tool chunk 文本形态 = `name + JSON(args)`（`subagent-run.mjs:95` 等四生产者）；turn 仅在 started/终态快照
（`subagent-run.mjs:137-143`——`applyTurnFrame` 进池条目不上屏）；审批态 = **VSC 无此数据源**（子代理不经
权限门——`execute-tools.mjs:258` `depth === 0` 才弹）。

**面五·Send 与状态行（R5/R6）**：`loading.js:53` 无条件 `sendBtn.style.display="flex"`（注释自述「常显」）；
`:54` Stop = running 派生；busy 拒发 = `send.js:19-25`（toast + 占位符）。状态行权威 = CLI
`render-frame.mjs:341-397`（statusText/task/turn/token✦/ctx/scroll 段）+ 横幅 `:222-233`；VSC 现态 =
`status-bar.js` 段集（缺 ✦、缺状态文本段、`轮次 N` 无 M）；数据面：VSC `onWait` 相位已有
（`provider.mjs:346-361` quota/retry · `rate.mjs:115/136` warn/rate）但**未上屏**（panel-callbacks 无 onWait 键）；
顶层 turn 帧已有（`agent.mjs:142-143` `onAgentTurn`）但未上屏；usage 无 reasoning 字段（`panel-callbacks.mjs:97`）。

### 14.2 方案选型对比（M1–M6——判据逐项 + 否决理由）

**M1 终态块去向机制（R1 核心）**（判据 = CLI 同序 · §12.4 旧链禁令 · 有界 · 可机判）：

| # | 候选 | 判据评估 | 结论 |
|---|---|---|---|
| 1 | **消化后归档落流（轮边界插入）**——终态判定分两路；消化回收时单次 `insertBefore(block, 本轮边界元素)`（失效退化尾追） | CLI 同序（块在 digest 文本前）✓；无 per-block 锚/无降序插/无位移校正（旧链三组件皆无）✓；落点由本轮自建元素单一决定 ✓ | **选定** |
| 2 | 消化后落流（一律尾追加） | 零边界引用更简；但块恒在 digest 文本之后（与 CLI 序相反——阅读归属弱） | 备选＝降级路径（边界失效时即此行为） |
| 3 | 旧 DOM-move 锚链复活（settle 记元素锚 / 降序 insertBefore / 150 裁位移校正） | §12.4 点名设计债 + 间歇丢块史（ACTIVITY-REWRITE-SIMPLE） | 否决 |
| 4 | 仅清退不落流（折后移除） | 内容不可读——批 10「终态必现」呈现面损失 | 否决 |

**M2 digest 轮可见元素形态（R2①③）**（判据 = 漂移消除 · 归属感 · 零新协议）：

| # | 候选 | 判据评估 | 结论 |
|---|---|---|---|
| 1 | **专属标签行 + 每轮独立状态元素**（每轮新增；轮内原地更新；`assistantLabeled` 复位） | 漂移消除（元素随轮新增）✓；专属文案 ✓；复用既有 `digest` start 消息（零新协议）✓ | **选定** |
| 2 | 单元素跨轮复用 + 轮起搬到流尾 | 「搬元素」= 又一位移逻辑 + 幂等状态；跨轮文本覆盖旧轮信息 | 否决 |
| 3 | 新增 host `turnStart` 类消息 | 为单点需求新增回合边界消息族（比复用 digest start 重） | 否决 |

**M3 状态文本载体（R6 限流/索引）**（判据 = locale 归属 · 注入缝 · 单一小段）：

| # | 候选 | 判据评估 | 结论 |
|---|---|---|---|
| 1 | **结构化 `statusText` 消息（kind 判别 → webview i18n 渲染）** | i18n 在 webview（locale 单源）✓；注入缝直测 ✓；状态行单段 ✓ | **选定** |
| 2 | host 直发成品文本 | host 不知 locale（复制 i18n = 双源） | 否决 |
| 3 | 不做（仅登记） | R6 判定句要求「用例锁新增状态文本（含限流态）」——不满足 | 否决 |

**M4 Send 可见性（R5）**（判据 = 用户原话 · 与 Stop 范式一致 · 无假 affordance）：

| # | 候选 | 判据评估 | 结论 |
|---|---|---|---|
| 1 | **running 期隐藏**（`display:none`——与 Stop 同派生点） | 用户原话「没隐藏」✓；单一显隐范式（F-6 同族）✓；零假 affordance ✓ | **选定** |
| 2 | 禁用态（灰置） | 保留「不可用」语义但双范式（Stop 隐藏/Send 禁用）且仍占位 | 否决 |

**M5 `scrolled N`（R6 端差裁定）**（判据 = 信息等价 · 无新造单位 · 不与按钮重复）：

| # | 候选 | 判据评估 | 结论 |
|---|---|---|---|
| 1 | **保持 VSC 悬浮回底钮**（不做 `scrolled N` 文本） | 可点击超集 ✓；VSC 无 CLI 行式滚动单位（N 需新造语义）✓；避免双指示 ✓ | **选定** |
| 2 | 补 `scrolled N` 文本段 | N 单位需另造（像素/条数）；与悬浮钮重复 | 否决 |

**M6 会话退出语义（R1 兜底）**（判据 = host 既定注释语义 · CLI freezeAllSubTasks 对位）：

| # | 候选 | 判据评估 | 结论 |
|---|---|---|---|
| 1 | **区全体归档**（live → 折叠；awaitingDigest → 归档；落流尾） | 兑现 host 注释「补发 done 冻结：随会话退出折叠进流」（`suspension.mjs:328-330`）✓；无悬空驻留 ✓ | **选定** |
| 2 | 仅 live 折叠原地（现状） | awaiting 块永不落流（悬空驻留——违反 F-R1 判定句） | 否决 |

### 14.3 契约（逐条定稿——实现对象）

**C-1 生命周期（五段）**：出生（`buildBlock` → 区尾）→ live → 终态判定（`applySubagentStatus` 终态分支）：
① `settled` → **awaitingDigest 驻留**（C-2）；② 其余终态（done/error/cancelled/terminated/failed/answered）
→ 折叠 + **即时归档**（C-3 尾追）→ ③ 消化回收（`done` 到达 awaitingDigest 块）→ **归档**（C-3 边界前）→
流内历史。两态机（live → frozen）保留；awaitingDigest 为冻结态上的**单标志**（非第二状态机）。

**C-2 awaitingDigest 驻留（R3）**：`settled` → `freezeBlock` 同现状（class `sub-frozen`、`open=false`、
⏹ 移除）+ `meta.awaitingDigest = true`；块头 = **CLI 面板行形态**：括号去 verb（`[✓ {label} · {模式} · {模型} ·
{N}s · turn n/m]`）+ 态词 `t("sub.awaitingDigest")`（en 逐字 `done · awaiting digestion`）；tail-3 照常显示；
块**不移动**（驻区）。回收（C-3）后 `awaitingDigest` 清。

**C-3 归档（archive）机制与落点**：单次 DOM 插入（`insertBefore` 或 `appendChild`）——块元素原地进
`#messages`；落点二值：① **消化回收**（`done` 命中 `awaitingDigest` 块）且 `S._digestBoundary` 有效
（`isConnected`）→ `insertBefore(block, boundary)`（= 本轮边界元素之前——CLI 序：块在 digest 文本前）；
② 其余（普通终态 / 会话退出 flush / 边界失效）→ `appendChild(messagesEl)` 尾追。同批多块 = 消息到达序
（`insertBefore` 逐个 = 保序）；幂等：已归档（`parentNode === messagesEl`）→ no-op。

**C-4 消化轮边界**：`digest start` 处理时创建本轮元素（C-9）并记 `S._digestBoundary = 本轮首元素`
（标签行）；`suspension` 消息（含 active:true 刷新）与 `clearMessages` 清空该引用；`digest start` 覆盖
旧值。边界失效（`!isConnected`——被 150 裁/清屏）→ C-3 ② 尾追退化。

**C-5 即时归档 / 补桩 / 接管**：① 终态消息命中 live 块 → 折叠 + 归档（尾追）；② 终态补桩
（never-born）→ 补出已折叠桩 + **立即归档**（流内可见——批 10「终态必现」呈现面保持）；③ 新代接管
命中 **awaitingDigest** 旧块 → 旧块立即归档（同步清 `awaitingDigest`——头词回终态形态，不留悬空
「等待消化」）；旧已归档块本就在流内（历史）——「旧块留区作历史」措辞随本批修订为「旧块在流内作历史」。

**C-5③ 后继后果与防御（修正轮 #5——失明面写全）**：旧代回收 `done`（`suspension.mjs:95-100` 补发——
载荷 `{id, role, status:"done"}`，无代际字段）在旧块归档后**按键路由**：命中新代 live 块时按 C-1②
折叠 + 即时归档 → **新代块提前终止、其后 chunk 被冻结守卫吞（失明面）**；迟到 chunk 落新块 = 既有
登记（§5.1.4 第 5 条）。**防御（本轮采纳）**：接管归档时旧块若处于 awaitingDigest（回收在途）→ 新块记
`meta.oldReclaimPending`；其后该键**首条 `done` 视为旧代回收 → 吞（no-op + 清标志——新块 live/awaiting
均不触）**；非 awaiting 旧块接管不布防（无回收在途）。依据：pending 容器 FIFO = settle 序（旧代在前——
旧代回收先至）。**残余登记**：异常路径致旧代回收永不至（abort 等）× 新代 `done` 后至 → 可能误吞一次
（降级 = 新块滞留区，会话退出 flush（C-8）兜底归档——不丢内容、不失明；abort 伴随 resetActivity 时
块与标志同清）；≥2 代积压（连续接管且旧代回收均未至）残余歧义保留（窗口随代际数收窄）。T-CL10 锁「吞」路径。

**C-6 区上限已退役**：`enforceRegionCap` / `MAX_REGION_FOLDED` 已删除——区居民 = live + awaitingDigest（删除记录 = 本档 §14 C-6）
（池有界 + 队列有界 + 消化回收即清），折叠块不再常驻（§12.3#4/D-A2 由本契约取代）。

**C-7 resetActivity / clearMessages**：`resetActivity` = 清**区子树**（防御清扫限定 `ctx.activityEl`
后代——原全档 `.sub-block` 清扫会误删流内归档块＝会话历史）+ 清 map；流内归档块不动。`clearMessages`
= `#messages` 全清（归档块随清——会话历史语义）+ `resetActivity`（区语义不变）。

**C-8 会话退出 flush**：`suspension active:false + freeze:true` → 区**全体**（live → 折叠；awaitingDigest
→ 归档；已在流者不动）→ C-3 ② 尾追。abort 同路径（host 既定语义——无 digest 消费、不留悬空块）。

**C-9 digest 轮可见面（R2①③——§7.4 契约修订点）**：`digest start` → ① 追加 `.digest-turn` 标签行
（i18n `digest.turnLabel`——CLI 起跑 dim 行对位）；② 追加**本轮独立** `.digest-status` 元素（class——
`id="digest-status"` 退役）；③ `ctx.assistantLabeled = false`（本轮 assistant 输出带一次回合标签——
CLI `ensureAssistantLabel` 对位）。`digest end` → **本轮** status 元素原地更新（ok 旗标语义不变）。
跨轮 = 新元素随流追加（漂移消除；§7.4「单元素原地更新三态」修订为「每轮独立元素 + 轮内两态」）；
start 连发亦各成独立元素（不复用——`end` 更新其前最近未结本轮元素；口径补全——修正轮 #6 附，测试改写所需）。

**C-10 digest cap 行（R2②）**：host（`panel-chat.mjs` ContinueError 分支）→ `{type:"digest",
status:"cap", mode:"auto"|"stop", turns}`；webview 尾追 `.digest-cap` 行（`mode:"auto"` dim /
`mode:"stop"` warn）+ i18n `digest.capAuto` / `digest.capStop`（CLI `agent-turn.mjs:188/:192` 语义对位）。

**C-11 块头数据面增补（R4 实现口径）**：① tool chunk 携结构化字段 `tool`（名）与 `cmd`（`args.command` 字符串；
无则不携）——四生产者（`subagent-run.mjs:95` · `subagent-escalate.mjs:166` · `subagent-escalate-async.mjs:104` ·
`consult.mjs:285`）+ `toolPanelPayload` 白名单同步；webview 头渲染 `${tool} — ${cmd ≤60}`（无 cmd 仅 tool；
结果 chunk 不更新状态区——CLI currentTool 语义）；② queued 载荷字段入 `meta.queueInfo`（position/waiting/reason）
→ 状态区渲染；③ `subagent` 增 `status:"turn"` 进展事件（`{id, role, turn, maxTurns}`——`onAgentTurn` 帧）→
区头 `turn N/M` 实时；④ elapsed 定时刷新：panels `_panelTimer`（既有 2s）同点调 `refreshLiveHeaders()`
——**不设运行态门**（仅刷现存 live 块头：`_turnState` 为 `susp` 的纯池跑主场景照刷——既有回调的
`running` 门（`webview/panels.js:68`）不延伸；`renderStatusBar()` 维持既有 `running` 门不变；无 live 块
= 零操作）（修正轮 #4）。

**C-12 协议增量登记表（只增不改——N-CL1）**：

| # | 消息面 | 增量 | 发射点 | 接收点 |
|---|---|---|---|---|
| 1 | `statusText`（新消息） | `{kind:"rateWait"/"rateLimited"/"overloaded"/"quota"/"index", seconds?/message?/phase?/done?/total?}` | `panel-callbacks.mjs` onWait 映射；`panel-index.mjs` 索引进度 | `chat.js` case → `S._statusText` → 状态行段 |
| 2 | `turnFrame`（新消息） | `{turn, maxTurns}` | `panel-callbacks.mjs` onAgentTurn（顶层） | 同上 → 状态行 `turn N/M` 段 |
| 3 | `toolPanel`（增字段） | `tool` / `cmd` | 四 chunk 生产者 + payload 白名单 | `activity-view.js` 块头 |
| 4 | `subagent`（增 status 值） | `status:"turn"` + `{id, role, turn, maxTurns}` | `subagent-run.mjs` onAgentTurn | `applySubagentStatus` 进展分支 |
| 5 | `digest`（增 status 值） | `status:"cap"` + `{mode, turns}` | `panel-chat.mjs` ContinueError 分支 | `chat.js` case → `.digest-cap` 行 |
| 6 | `usage`（增字段） | `reasoning_tokens` | `panel-callbacks.mjs` 累计（transports 映射补全） | `status-bar.js` ✦ 段 |

**C-13 R4 逐字段对位表（字段 × CLI 形态 × VSC 现态 × 目标）**：

| 字段 | CLI 形态（`subagent-panel.mjs`） | VSC 现态（`activity-view.js`） | 目标 |
|---|---|---|---|
| icon | `⏸/✓/▶`（审批/完成/运行） | `⏳/▶/✓/⏹`（排队/运行/完成/停） | 保持 VSC 语汇（端差登记——语义对位） |
| 键 | `role#N` | 同（label） | 保持（等价） |
| 模式词 | ` · sync/async`（family；queued → 状态词） | ` · 同步/异步`（family；queued 无词） | 保持（等价）；queued 信息走状态区（下两行） |
| 模型 | ` · model`（宽截断） | ` · model`（consult/escalate 键内嵌） | 保持（等价） |
| 计时 | ` · Ns`（done 定格） | ` · Ns`（事件驱动） | + 2s 定时刷新（C-11④）；语义不变 |
| turn | ` · turn N/M`（maxTurns>0） | ` · turn N/M`（maxTurns>0 且 turn>0；仅快照） | 条件对齐 + `status:"turn"` 实时（C-11③） |
| 状态区·running | `currentTool`（嵌套全路径）/ `thinking...` | 工具文本尾句（≤64）/ `思考中…` | 工具 + 参数摘要（下一行）；think 保持 |
| 参数摘要 | ` — ${command ≤60}` | 无（裸 JSON 截断尾句） | `tool`/`cmd` 结构化 → `${tool} — ${cmd ≤60}`（C-11①） |
| 状态区·queued | slot：`queued · position N（槽满等位）`；wait/depc：detail 原文 | 无（`[⏳ label]` 唯一） | `排队中 · 位置 N（槽满等位）` / 原因原文（C-11②） |
| 审批态 | `等待审批: X` | 无此状态（子代理不经权限门） | 端差登记（不做——无数据源；`execute-tools.mjs:258`） |
| 待消化 | `done · awaiting digestion`（状态区） | 无 | R3（C-2） |
| 冻结头 | `[✓ key · … · done Ns · turn]` + tail-3 | 同形态 | 保持（等价）；归档后形态不变 |

**C-14 Send 可见性（R5）**：`loading.js` 同点派生——`ctx.sendBtn.style.display = S._turnState === "running"
? "none" : "flex"`（Stop 同派生点）；`send.js` 出口守卫与 toast **零改**（Enter 路径拒发提示保留——C-14
只改按钮可见性，不改门禁）；`setLoading`/turnState/suspension 三入口重派生（现状通径不变）。

**C-15 R6 逐字段对位表（字段 × CLI 形态 × VSC 现态 × 目标）**：

| 字段 | CLI 形态（`render-frame.mjs:341-397`/`:222-233`） | VSC 现态（`status-bar.js`） | 目标 |
|---|---|---|---|
| 状态文本段 | `state.status`（Processing/Indexing…/Running: cmd/TPM throttle wait ~Ns/Server overloaded…/Rate-limited 429…/Waiting: X） | 无（thinking 点） | 新增 `statusText` 段（C-12#1；活动恢复清空：token/reasoning/toolCall/toolResult/complete/aborted/error） |
| 当前工具 | ` ${currentTool}…` | `工具: name` | 保持（等价） |
| 计时 | processing ` Ns` | `耗时 Ns` | 保持（等价） |
| 任务 | `✓N/M` | task 徽标 `✓d/total` | 保持（等价） |
| 轮次 | `turn N/M` | `轮次 N`（LLM 调用数——无 M） | 换 `turn N/M`（C-12#2）——旧 `status.turns` 段退役 |
| token | `↑X ↓Y ✦R hitN%` | `↑X ↓Y hitN%`（缺 ✦） | 补 ✦（C-12#6——`reasoning_tokens>0` 才显，同 CLI） |
| context | `context X% Yk` | `context X%` | 端差登记（不做——VSC pct 源 = 实 prompt tokens；绝对数低价值） |
| 滚动 | `scrolled N` | 悬浮回底钮（`scroll.js`） | 端差保持（M5） |
| 输入提示/键位 | enterHint + 键位串 | 无（按钮/占位符承载） | 端差登记（不做） |
| 横幅 | PLAN/AUTO/ADVISOR/ENG + attention chip | 工具条按钮 active + plan 徽标 | 保持 VSC 形态（端差登记；attention chip 不做——权限/提问卡流内可见） |
| 后台段 | `后台 N 子代理运行中 · M 完成待消化` | `⏳ …` 徽标 | 保持（等价） |

**C-16 i18n 键表（新增 12 键·两 locale 逐字——`locales/zh.json` / `locales/en.json` 同步）**：

| 键 | zh | en |
|---|---|---|
| `digest.turnLabel` | 自动回合：消化已完成的子代理报告… | [auto-turn: digesting finished subagent reports…] |
| `digest.capAuto` | 自动回合：越过轮次上限，继续推进… | [auto-turn: continuing past turn cap…] |
| `digest.capStop` | 自动回合在 {turns} 轮处停止——部分消化；已完成的报告保留在历史中 | [auto-turn stopped at {turns} turns — partial digest; finished reports stay in history] |
| `sub.awaitingDigest` | 已完成 · 等待消化 | done · awaiting digestion |
| `sub.queueSlot` | 排队中 · 位置 {n}（槽满等位） | queued · position {n} (slot full) |
| `status.turn` | 轮次 {n}/{m} | turn {n}/{m} |
| `status.rateWait` | TPM 限流等待 ~{s}s | TPM throttle wait ~{s}s |
| `status.rateLimited` | 限流 429，{s}s 后重试 | Rate-limited 429, retry in {s}s |
| `status.overloaded` | 服务过载，{s}s 后重试 | Server overloaded, retrying in {s}s |
| `status.quota` | 配额耗尽：{msg} | quota exhausted: {msg} |
| `status.indexScan` | 索引：扫描 {n} 文件… | Indexing: scanning {n} files… |
| `status.indexEmbed`（W8 已退役——核面新键 = `status.indexProgress`，见下两行） | 索引：嵌入 {done}/{total}… | Indexing: embedding {done}/{total}… |
| `status.indexProgress`（W8 新键——相位与读数取核面；消费 `webview/status-bar.js:98`） | 索引：{phase}（{n} 文件） | Indexing: {phase} ({n} files) |

（`status.turns` 键随段退役删除；`status.indexEmbed` 随 W8 索引面归一退场（核面进展面 = `status.indexProgress`）；`digest.start/done/aborted` 与其余既有键不动。）

**i18n 记法校准——实现后同步（2026-09-12）**：表内占位符 `{n}`/`{m}`/`{s}`/`{turns}`/`{msg}`/`{done}`/`{total}` 为简写——
实落一律 `${…}` 形态（本端引擎仅认 `${k}`——`webview/i18n.js:30`；照抄 `{n}` 将向用户显示字面占位符）；
两 locale 12 键实落值以 `locales/zh.json` / `locales/en.json` 为准（逐字核对）。

### 14.4 旧机制对照（§12.4 点名的旧 DOM-move 锚链——为何新机制不是它）

| 旧链组件（ACTIVITY-REWRITE-SIMPLE 点名） | 本批新机制 | 为何不构成旧链 |
|---|---|---|
| DOM move 落流（freeze 时刻即移入 `#messages`） | **消化回收时刻**单次归档插入（C-3） | 时点不同（回收≠freeze）；触发面 = 单一回收消息，不与其他终态路径竞争 |
| `freezeInsertPoint` 锚插链（settle 记元素锚 / 多块降序 insertBefore / 150 裁位移校正）（已退场——现体 = 轮边界插入（C-4）） | **轮边界插入**（C-4）——边界 = 本轮自建首元素，单点活引用 | 无 per-block 锚、无降序排序（到达序即序）、无位移校正（无锚可漂）；失效单分支退化尾追 |
| settle 驻留双态（awaiting digestion 整机） | 冻结态上**单标志** `awaitingDigest`（C-2） | 无第二套状态机/无补发 done 位移逻辑；呈现 = 头词一字段 |
| `_subagentMap` 逐行簿记（已退场——现体 = `S._subBlocks`） | 单 map（`S._subBlocks`）原样 | 零簿记增量 |
| preview / ticker | 保持删除 | 零复活（2s 刷新复用既有 `_panelTimer`，非 per-block ticker） |

### 14.5 关键决策记录（含否决备选）

| # | 决策 | 否决备选 / 理由 |
|---|---|---|
| D-CL1 | 终态去向 = 消化后归档落流（M1-1） | 否决旧锚链（§12.4）/ 折后移除（不可读）/ 一律尾追（序反 CLI——仅作降级） |
| D-CL2 | awaitingDigest = 单标志驻留 + CLI 行形态头词（C-2） | 否决第二状态机（旧链）/ 即时折叠（现状——用户点名缺口） |
| D-CL3 | 消化轮 = 标签行 + 每轮独立状态元素（M2-1） | 否决单元素搬运 / 新 turnStart 消息 |
| D-CL4 | 区上限退役（C-6） | 否决保留 20 上限（新语义下无居民可裁——死码） |
| D-CL5 | resetActivity 只清区（C-7） | 否决全域清扫（会删流内归档块＝会话历史——撞上必须当场修） |
| D-CL6 | 会话退出 = 区全体归档（M6-1） | 否决仅 live 折叠（awaiting 悬空） |
| D-CL7 | 协议增量 = 只增不改、六项登记（C-12） | 否决 host 直发成品文本 / 新增 turnStart 族 |
| D-CL8 | Send = 隐藏（M4-1） | 否决禁用态（双范式、仍占位） |
| D-CL9 | `scrolled N` = 端差保持（M5-1） | 否决补文本段（新造单位 + 双指示） |
| D-CL10 | 审批态 = 端差登记（C-13） | 否决假造数据 / 改 depth 门禁（超范围） |
| D-CL11 | 归档块参与 150 窗与懒历史锚（C-…见 §14.7 T-CL9） | 否决豁免（DOM 无界——同 150 窗纪律） |

### 14.6 受影响文件全清单（行数口径 = `split("\n").length` 含末行；as-of 2026-09-12 实测）

**实施域·VSC webview（10 改 = 10 行——locale 行含 en/zh 两档；修正轮 #7）**：

| 文件 | 现行 | 预计增量 | 改动 |
|---|---|---|---|
| `webview/activity.js` | 354（本批前）→ **406（实现后实测）** | ±0~-10（预估；实测 **+52**——实现后同步（2026-09-12）） | 归档/awaiting 状态机（含旧代回收吞守卫——C-5③，修正轮 #5）+ 区上限退役 + reset 收窄 + 头注 + `refreshLiveHeaders`（§14 C-11④；归属更正——实落 `:375`）（拆分评估见下） |
| `webview/activity-view.js` | 157 | +~35 | awaiting 头词/queued 信息/tool+cmd 状态区/turn 进展（**实现后同步（2026-09-12）**：原「+ 刷新入口」撤销——`refreshLiveHeaders` 实落 `activity.js:375`） |
| `webview/chat.js` | 355 | +~45 | digest 轮元素/cap/boundary 管理 + assistantLabeled 复位 + statusText/turnFrame case |
| `webview/status-bar.js` | 76 | +~20 | statusText 段 + ✦ + turn N/M（旧 turns 段撤） |
| `webview/panels.js` | 138 | +~4 | `_panelTimer` 同点 refreshLiveHeaders（不设运行态门——C-11④，修正轮 #4） |
| `webview/loading.js` | 61 | ±2 | Send 可见性派生（C-14） |
| `webview/ui.js` | 492 | ±0 | `trimOldMessages` 选择器 + `.sub-block`（逐字一行——距 500 硬限 8 行，不得再增） |
| `webview/history.js` | 89 | +~3 | 两处锚选择器 + `.sub-block` |
| `webview/base.css` | 448 | +~20 | `.digest-turn` / `.digest-cap` 样式（`.digest-status` 既有族沿用） |
| `locales/en.json` / `locales/zh.json` | 248 | +~12 / −1（`status.turns`） | C-16 键表 |

**实施域·VSC extension / provider（13 改 = 13 行；修正轮 #7）**：

| 文件 | 现行 | 预计增量 | 改动 |
|---|---|---|---|
| `src/extension/panel-chat.mjs` | 499 | **≤0（硬限零余量）** | cap 两处调用 +1/+1；注释压行 −2；若越线 → 抽 ContinueError autoTurn 处理为 helper（登记方案 B） |
| `src/extension/panel-callbacks.mjs` | 186 | +~16 | onWait→statusText · onAgentTurn→turnFrame · reasoning_tokens 累计 · postDigestCap helper |
| `src/extension/panel-index.mjs` | 183 | +~9 | 索引进度→statusText（scan/embed/done） |
| `src/extension/suspension.mjs` | 363 | ±2 | 注释同步（reclaim 语义「折叠回收」→「归档落流」——零逻辑） |
| `src/provider.mjs` | 424 | +~6 | 429 onWait 携 status；5xx 重试等待上报（overloaded 相位）（W10 已迁核——现体 `thincoder-core/provider/core.mjs`） |
| `src/provider/transports/openai.mjs` | 347 | +~2 | usage 映射 `reasoning_tokens`（`completion_tokens_details`）（W10 已迁核——现体 `thincoder-core/provider/sse.mjs`） |
| `src/provider/transports/responses.mjs` | 415 | +~1 | 同上（`output_tokens_details`）（W10 已迁核——现体 `thincoder-core/provider/responses.mjs`） |
| `src/provider/transports/google.mjs` | 264 | +~1 | 同上（`thoughtsTokenCount`——有则映射）（W10 已迁核——现体 `thincoder-core/provider/google.mjs`） |
| `@thincoder/core/agent-tools/subagent-run.mjs` | 190 | +~4 | tool chunk 增 `tool`/`cmd`；onAgentTurn→`status:"turn"`；:136-139 注释同步（「逐轮跳动需新通道——不建」已履行——C-11③；修正轮 #2）（W13 已迁核收口——现体见批次档 §5） |
| `src/agent-tools/subagent-escalate.mjs（W12 已迁核——现体见批次档 §5）` | 219 | +~2 | tool chunk 增字段 |
| `src/agent-tools/subagent-escalate-async.mjs（W12 已迁核——现体见批次档 §5）` | 226 | +~2 | tool chunk 增字段 |
| `src/agent-tools/consult.mjs（W12 已迁核——现体见批次档 §5）` | 474 | +~2 | tool chunk 增字段 |
| `src/extension/panel-toolpanel.mjs` | 21 | +~2 | payload 白名单 + `tool`/`cmd` |

**测试域（VSC——逐档预计增量已补；修正轮 #6）**：`test/activity-flow.test.mjs`（486 → **≤+10**——区语义期望
改写：折叠块不再驻区/上限用例撤/归档断言；净增受控——T-R8 撤除（已退场——删除记录 = §14 C-6）对冲新增）· `test/activity-live-ux.test.mjs`
（172 → **≤±6**——T-LU6 冻结语义微调）· `test/digest-visibility.test.mjs`（147 → **≤+50**——每轮元素/turn 标签/
cap/漂移回归改写）· `test/async-visibility.test.mjs`（402 → **≤+15**——补桩/接管/位置期望改归档）·
`test/webview-turnstate.test.mjs`（292 → **≤+35**——⑤ 补 Send 可见性 + 状态行段）· **新档**
`test/activity-closure.test.mjs`（R1/R3/R4 核心——本 §14.7 表主力；目标 ≤300 软线）· **新档**
`test/status-line.test.mjs`（R6——statusText 映射/✦/turn N/M；目标 ≤200）· `test/files.mjs`（75——+2 登记）·
`test/helpers/webview-env.mjs`（92——如需）。

**测试档越线处置口径（修正轮 #6）**：`activity-flow` 距 500 硬限仅 14 行——落地不得越 500；若预计越线 →
抽归档断言用例组至 `activity-closure`（同批新档——主题契合；测试档拆分登记口径适用），不静默越线。

**拆分评估注**：`activity.js` 354 → 原预期净减；**实测 406（+52——超预估；越 300 软线）——实现后同步（2026-09-12）**：
上限机制退役的减量未抵消新增（归档/吞守卫/头注承载长于预估）；<500 硬限（余量 94 行）、未触 450 拆分评估线——
**本批不拆**；后续批再增触 450 线时按既有口径执行拆分评估。
`chat.js` 355 → ~400（新职责集中在 digest 处理段——不加新模块；若落地越 450 触发拆分评估）。
`panel-chat.mjs` 499 = 零余量——**增行前必须先抽 helper**（N-CL3 纪律；方案 B 已登记）。
`ui.js` 492 同（+0 为限——选择器逐字替换）。

**`state.js` 协调项登记——实现后同步（2026-09-12）**：本批三个跨模块 S 字段 `S._digestBoundary` / `S._turnFrame` /
`S._statusText`（读面 falsy 安全）为**动态属性挂载**（写点 = `chat.js:184/:250/:274/:325/:330/:355`）——`webview/state.js`
零改（未入本表——守写域正确）；与「S 字段集中声明」惯例（同款 = 群 A A13 `S._subDescShown`、§12 `ctx.activityEl` 均以
state.js 行登记）呈落差——**登记为协调项**：集中声明建议随后续批（新设计评审）补录，本批实现链已终态不补。

**文档域（设计者已落——coder 零碰；修正轮 #2/#3 补全）**：本 §14 新节 + §2/§3/§5/§5.1.4/§6/§7.2/§7.4/§12 修订 +
§2 沿革行 + 变更记录 §15 顺延 · `docs/design/AGENT-LOOP.md` §1/§7/§10 + **未决行（live 头逐轮 turn 段——收口注，
修正轮 #2）** + 变更记录 · 沿革三指针（`SESSION-ACTIVITY-REVISED.md` / `ACTIVITY-REWRITE-SIMPLE.md` /
`SESSION-FLOW-B.md`）· 需求树 = `AGENT-LOOP（本仓·需求）§16 + §12` F-J1/F-J3/F-J6 修订。

**不入 files**：`docs/TODO.md`（产品级台账已退役——台账单仓化：现体 = 仓根 `docs/TODO.md`） / `CHANGELOG.md`（父侧）；CLI 仓代码/测试（零改——需求树除外）。

### 14.7 用例表（正常 / 边界 / 错误——T-CL1..T-CL24；新档 `activity-closure` + `status-line` 为主力）

| # | 用例 | 输入 | 预期输出（可机判） | 回指 |
|---|---|---|---|---|
| T-CL1 | awaiting 驻留 | `started` → `settled` | 块留区（未归档）+ 头含 `t("sub.awaitingDigest")` 文案 | F-R3 |
| T-CL2 | 回收归档（边界前） | digest start → end → reclaim `done` | 块出区 + 在 `#messages` 且 `nextElementSibling` 链到本轮 `.digest-turn` 之前 | F-R1 |
| T-CL3 | 普通终态即时归档 | sync `done` | 块出区 + 落 `#messages` 尾 | F-R1 |
| T-CL4 | 多块保序 | 同批两 reclaim `done` | 两归档块相对序 = 到达序（连续相邻） | F-R1 |
| T-CL5 | 会话退出 flush | `suspension active:false freeze:true`（live + awaiting 各一） | 两块全归档（尾）+ 区 children 0 | F-R1 |
| T-CL6 | 全归档后区空 | 末块归档 | 区 children 0；`:empty` 规则在位（静态断言）——已退场（段删——2026-09-12-PROSE-ANCHOR-RETIRE；删除记录 = `TESTING.md` §8.1）；DOM 层 `matches(":empty")` 命中断言保留 | F-R1 |
| T-CL7 | 边界失效退化 | 回合元素先被移除 → reclaim | 尾追归档（不抛错） | F-R1 |
| T-CL8 | 无边界（用户回合路径） | 无在轮 → reclaim `done` | 尾追归档 | F-R1 |
| T-CL9 | 150 窗 + 懒历史 | 归档后超窗 | trim 计数含 `.sub-block`；懒历史锚选择器含 `.sub-block` | F-R1 |
| T-CL10 | 新代接管 + 旧代回收吞 | 冻结键 + awaiting 旧块 + 新 `started`；其后旧代回收 `done` | 旧块归档（`awaitingDigest` 清）+ 新块区尾 + `takeover` 痕迹；旧代 `done` 被吞——新块仍 live 不折叠（C-5③ 防御——修正轮 #5） | F-R1 |
| T-CL11 | 补桩直归档 | never-born `done` | 桩出生即归档（流内可见）+ `late-terminal-stub` | F-R1 |
| T-CL12 | reset/清屏 | resetActivity / clearMessages | reset 只清区（流内归档块留存）；clearMessages 全清 | F-R1 |
| T-CL13 | digest 中断残块 | digest `end ok:false` → 无 reclaim | 残块留区（等下一轮）；下一轮 reclaim 时才归档 | F-R1 |
| T-CL14（改指——现体 = `T-D5`，`test/digest-visibility.test.mjs`） | 每轮元素无漂移 | 两轮 start/end | 每轮一对元素；第 2 轮元素位于第 1 轮输出之后（DOM 序断言） | F-R2 |
| T-CL15（改指——现体 = `T-D4`，`test/digest-visibility.test.mjs`） | 回合标签 | digest start → token 流 | `.digest-turn` 在 + 本轮 assistant 块含 `❯` 标签（`assistantLabeled` 复位） | F-R2 |
| T-CL16（改指——现体 = `T-D6` / `T-D7`，`test/digest-visibility.test.mjs`） | cap 两档 | `digest cap` auto/stop 注入 | `.digest-cap` 行（dim/warn）+ 两 locale 文案逐字 | F-R2 |
| T-CL17 | queued 字段 | `queued`（slot；wait） | 状态区 `排队中 · 位置 N（槽满等位）` / 原因原文；`started` 后清 | F-R4 |
| T-CL18 | 工具 + 参数 | tool chunk（`tool`/`cmd`）→ 结果 chunk | 状态区 `${tool} — ${cmd}`；结果 chunk 不改写状态区 | F-R4 |
| T-CL19 | turn/计时刷新 | `status:"turn"` 帧；tick 调用 | 头 `turn N/M` 更新；`startedAt` 回拨后 tick 刷新 `Ns`（**tick 断言在 `_turnState:"susp"` 下亦成立——C-11④ 不设运行态门，修正轮 #4**） | F-R4 |
| T-CL20（改指——现体 = `test/webview-turnstate.test.mjs` ⑥ Send running 期隐藏） | Send 可见性 | running / idle / loading 交替 | running → `display:none`；idle → `flex`；交替不翻 | F-R5 |
| T-CL21（改指——现体 = `T-CL21a` / `T-CL21b`，`test/status-line.test.mjs`） | statusText 映射 | 五 kind 注入 + 活动恢复 | 各段文案逐字（两 locale）；token/complete 后清空 | F-R6 |
| T-CL22 | ✦reasoning | usage `reasoning_tokens>0` / =0 | >0 显 `✦X`；0 隐 | F-R6 |
| T-CL23 | turn N/M 段 | `turnFrame` 消息 | `turn N/M` 渲染（旧 `轮次 N` 段不再出现） | F-R6 |
| T-CL24 | scrolled 端差 | 静态 | 悬浮回底钮在位（静态面）——已退场（段删——2026-09-12-PROSE-ANCHOR-RETIRE；删除记录 = `TESTING.md` §8.1）；状态行无 scrolled 段 + ctx 段 pct 形态保留（端差登记） | F-R6 |

> **C-12 host 发射面覆盖归属（修正轮 #8——六项增量 host 侧机判）**：① cap 两调用（`panel-chat` ContinueError
> auto/stop）：`digest-visibility` 改写扩 `postDigestCap` helper 直驱（载荷逐字 + 两分支——直驱同款 = 本档
> T-D1–T-D3 桩面板手法）+ 两调用点 grep 机检；② `statusText`（`panel-callbacks` onWait / `panel-index`
> 索引进度）+ `turnFrame`（onAgentTurn）+ `reasoning_tokens` 累计：`status-line` 新档直驱其导出映射面
> （同款 = async-visibility 直驱 `postSubagentEvent`）+ 发射调用点 grep 机检（同款 = async-visibility AC-A6）；
> ③ `subagent status:"turn"` 发射（`subagent-run`）：发射点机检——已退场（段删——2026-09-12-PROSE-ANCHOR-RETIRE；删除记录 = `TESTING.md` §8.1）+ webview 侧 T-CL19；④ 四生产者 `tool`/`cmd`：
> T-CL18（渲染面）+ `panel-toolpanel` 白名单纯函数直驱（payload 逐字）。webview 侧六项均经注入缝直测
> （C-9/C-10/C-11 用例）。

### 14.8 验收标准（逐条回指——每条可机器验证）

- **AC-CL1（F-R1）** = T-CL1–T-CL12（含 T-CL5 退出 flush、T-CL9 窗口、T-CL12 范围收窄）：
  awaiting 驻留与提示、回收/即时/退出三类归档、落点与保序、区空 `:empty`、reset 只清区——全绿。
- **AC-CL2（F-R2）** = T-CL14/T-CL15/T-CL16（改指——现体 = `T-D5`/`T-D4`/`T-D6`·`T-D7`，`test/digest-visibility.test.mjs`）：每轮独立元素（漂移回归）、回合标签 + `assistantLabeled`
  复位、cap 两档文案。
- **AC-CL3（F-R3）** = T-CL1/T-CL2：settled 未回收头含对位态词；回收前不归档。
- **AC-CL4（F-R4）** = T-CL17/T-CL18/T-CL19 + C-13 表逐行落位；审批态端差登记在档。
- **AC-CL5（F-R5）** = T-CL20（改指——现体 = `test/webview-turnstate.test.mjs` ⑥ Send running 期隐藏）；`send.js` 零改（git diff 断言）。
- **AC-CL6（F-R6）** = T-CL21（改指——现体 = `T-CL21a`/`T-CL21b`）–T-CL24 + C-15 表逐行落位；端差（scrolled/ctx/attention）登记在档。
- **AC-CL7（零回归——N-CL1）** = VSC 快层全绿；CLI 仓代码零改（`git status`）；协议增量 = C-12 六项
  （逐项 grep/用例在位）；`check-doc-width` 两仓新增超宽 0。

### 14.9 边界（本批不做）

- 不做 CLI 端（单面板照旧）；不做行面板复活；不做跨 reload 恢复；
- 不复活 §12.4 旧链（DOM move 锚链 / 双态驻留旧形态 / preview·ticker）；不改 digest 注入与预算；
- 流内归档块**无独立分页锚**（`data-idx` 不补——懒分页锚仍由 `.message` 承担；归档块随 150 窗出窗，
  不出现在历史回填中——登记）；`S._subTraceLog` 诊断面零改；
- 端差不做项：审批态（无数据源）· `scrolled N`（钮替代）· ctx 绝对数 · attention chip · 键盘提示段 ·
  AUTO 档无人值守行为差异（CLI :188 行文案已对位，行为差异 = 既有双端裁定）；
- 不碰群 A §11/§13 节域与在途批域；advisor 流内块（`S._advisorBlock`）不动。

### 14.10 UI / 交互决策落档

全落定（**无 open 项**）：awaitingDigest 块头 = CLI 行形态（括号去 verb + 态词）；归档块 = 流内折叠卡
（可展开，tail-3）；digest 轮 = 标签行 + 状态行（每轮）；cap 行 warn/dim 两档；Send 隐藏 = running 派生；
状态文本段 = 单段（活动恢复即清）；`turn N/M` 段替旧段；✦ 段条件显。**可调常量（批准环节可翻转）**：
elapsed 刷新节拍（复用 2s）；`statusText` 保留时长（= 活动恢复/新 text 即清——无 TTL）。


## 15. 变更记录（历史折叠——详见 git log）
- 2026-09-12（行文按现态收正——纯文档，实现面零改）：§8.1 回合入口守卫按现态改写（running 消息拒收——不排队、无回执；`_suspQueue`/`messageQueued`（已退场名——删除记录 = 本行）残述清零）；§8 头注 Stop 派生句同步 §8.4（A3 原式 state≠idle 经 F-6 收窄为 running——消自相抵）。源 = `src/extension/panel-messages.mjs` · `webview/loading.js:57`。
- 2026-09-12（活动区收口批·实现后同步——4 处；纯文档，实现面零改）：§3 `refreshLiveHeaders` 归属更正
  （activity-view.js → `activity.js:375`——activity.js 行补录）；§14.6 `activity.js` 行数对表校准（实测 406——超预估；
  越 300 软线拆分评估注更新）+ `state.js` 协调项登记（三 S 字段动态挂载 vs 集中声明惯例）；C-16 占位符记法校准
  （`{n}` 简写 → 实落 `${…}`）。
- 2026-09-12（活动区收口批·修正轮——设计评审轮次 1 #1~#8 落修）：§12 反转注清单补全（§12.3#9/D-A7/AC-R1·AC-R2）；
  §7.2 同步（`statusText`/`turnFrame` 新增 + 三行补字段 + `onAgentTurn` 更正）+ §5.1.4 第 5/8 条指注；§14 C-5③
  失明面写全 + 「旧代回收在途」吞机制 + C-9 start 连发口径 + C-11④ 刷新门明示；§14.6 计数对齐（10/13）+ 测试域
  逐档 ≤±N + 越线处置 + 文档域补 §7.2/AGENT-LOOP 未决行；§14.7 T-CL10/T-CL19 更新 + C-12 host 覆盖归属注。
  零契约语义变更（除 C-5③ 防御 = 评审 #5 采纳——待轮次 2 复核）。
- 2026-09-12（活动区收口批——A 方案反转 + digest/块头/状态行/Send 对齐）：新增 §14（活动区收口——M1–M6 选型 / C-1–C-16 契约 / 旧链对照 / D-CL1–D-CL11 / 受影响文件 / T-CL1–T-CL24 / AC-CL1–AC-CL7）；§12 反转注（Q1/D-A1/D-A2、§12.3#4、§12.4、§12.5、§12.8 AC-R3、§12.10）；§2/§3/§5/§5.1.4/§6/§7.4 同步；变更记录顺延 §14→§15。需求 = `AGENT-LOOP（本仓·需求）§16`。
- 2026-09-12（VSC-LIVE-UX 批·修正轮——设计评审轮次 1 #1/#2 落修）：§13.7 AC-LU6 补扩展端
  反断言（`src/extension/**` 零改动——需求 §14.4「不动扩展端协议与实现」对位；修正轮 #1）；
  D-LU6 与设计落档条的「§1 沿革行」标签订正为「§2 沿革行」（修正轮 #2）；#3 跨仓引用形态
  Deferred（父侧登记不改——后续清扫批统一）。纯断言补充与标签订正、零语义。
- 2026-09-11（VSC-LIVE-UX 批——设计落档；用户 23:29 实测两条）：新增 §13（live 块 UX：流式跟滚 +
  内容区高度 60px——现场核实（含 §1 事实表 #3 更正）/ 四候选选型 / 契约 C-LU1..C-LU5 / 决策
  D-LU1..D-LU6 / 用例 T-LU1..T-LU6 / AC-LU1..AC-LU7）；§12.3 第 6 条高度句改指（100px → §13 60px）；
  节号 sweep（§2 沿革行 / §12.6 / §12.8 指注同步 §14；修正轮 #2）；变更记录顺延 §13→§14。
- 2026-09-11（活动区回归批·修正轮——设计评审轮次 1 后）：§5.1.8 AC-A1/AC-A3 采样点改区（`#subagent-activity`）+
  §12.3#10 口径修订清单补全（AC-A1/AC-A3 + 全档位置 sweep：§5.1.2 · §5.1.4 第 5 条 · §5.1.5 D-4 · §5.1.7 T-V2 · §6 · §8.4）；
  §12.3#7/#8 空安全绑定收口 + §12.6 fixture 波及面 / 源侧拆分注 + 需求树行；§12.7 补 T-R13 手法注（真 chat.js 图）；
  §3 activity.js 行补第 10 批指注。纯口径 sweep 与登记、零语义。
- 2026-09-11（群 A 批·修正轮——设计评审轮次 1 #5/#6 落修）：§11.1.5 补 T-MA10-8（单行中段 ↓ = 吞键 + no-op——AC-MA10-2 回指随更）；§11.2.4 补 tail-3 射程核验注（`.sub-desc` 不在 `tailLines` 射程）；§11.1.4 `test/files.mjs` 行数统一 63（`split("\n").length` 与读档 `N lines total` 两口径同数）。纯用例补充与核验登记、零语义。
- 2026-09-11（活动区回归批——设计落档；用户 17:23 裁定「加回固定活动区」）：新增 §12（区回归：live 固定可见——区内出生/原地折叠/区内保留——四开放问选型 + 逐字契约 + 决策 D-A1..A8 + 用例 T-R1..T-R16（T-R5/T-R6 之现体 = T-V4/T-V2；T-R8/T-R16 已退场——删除记录 = §14） + AC-R1..AC-R10）；§2 布局改五行垂直序（活动区回）+ §3 两行同步 + §5 全节重写（区内出生 · 原地折叠 · 区内保留——两态机/批 10 语义不动）+ §5.1 位置口径修订（流尾 → 区尾）。
- 2026-09-11（群 A 批增补 A10/A13——设计落档）：新增 §11——A10 输入历史契约（C-MA10-1..6 / T-MA10-1..7 / AC-MA10-1..7——含「多行段不劫持」实测判据）+ A13 面板说明句（Task/Goal 已在登记 + Subagent 首块 `.sub-desc` 契约/用例/AC）。
- 2026-09-11（第 34 批·修正轮——设计评审轮次 1 后）：§10 六处——差异表补跨界配对向量 2 条（修前 / 修后实测）· 不变量句与 §10.2 取证句标唯一例外 · §10.3 补头注释目标全文（含陈旧 `raw=true` 子句消去注）· §10.6 补 T-H15 + T-H14 金样协议注 · AC-H4 / AC-H6 收窄 · §10.8 登记跨界族。纯登记与口径收窄、零语义。
- 2026-09-11（第 28 批·修正轮——设计评审轮次 1 后）：§9 三处——C-B2-2 补让位 `preventDefault` 处置（保留）· AC-B2-3 补「自动隐去 = 原样提取的既有机制（行为零变）」继承登记 · AC-B2-4 基线补 skip 位（422/421/0/1；需求档 `AGENT-LOOP（CLI 仓）§8` NFR-F1 同改）。纯措辞与登记、零语义。
- 2026-09-11（第 34 批·GitHub #7——设计落档）：新增 §10（Markdown 行内代码字面量契约与转义回归——复核 R-1~R-5 · 选型 B′ / A″ · 逐字契约 · 决策 D-V1~D-V6 · 用例 T-H1~T-H14 · AC-H1~AC-H6）；需求 = `AGENT-LOOP（本仓·需求）§10`。
- 2026-09-11（第 28 批·输入面小修 B2——设计落档）：新增 §9（输入面 Enter 语义：组合守卫 / @ 下拉协调 / 忙碌拒发可见提示——契约 C-B2-1~4 + 用例 T-B2-1~7 + AC-B2-1~5）；§3 文件表补 `toast.js`；§6 挂起 UI 句补拒发提示指针；需求 = `AGENT-LOOP（CLI 仓）§8`。
- 2026-09-11：第 21 批（B6 收口）——新增 §7.4 digest 起跑可见指示（流内 `#digest-status` 元素 +
  `digest` 消息行；起止两态 + ok 旗标）；需求 = `AGENT-LOOP（CLI 仓·需求）` §5。
- 2026-09-11：第 21 批修正轮（设计评审轮次 1——#4）：§7.4 AC-D1 补 NFR-C1 标签（对位 CLI 判定面回指）。
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
