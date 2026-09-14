# Webview 消息协议与忙态秩序（WEBVIEW-PROTOCOL）· 设计 — VSC 部分

> 部分 = **vsc**（`docs/vsc/`）；板块 = **webview 前端面**的**协议与秩序面**——webview ↔ extension 的消息族、发射/接收纪律、消息秩序与忙态收敛、状态行段位。
> 同板块同层另两档 = `WEBVIEW.md`（结构与活动区——块生命周期与块头形态）· `WEBVIEW-INPUT.md`（输入面 · 消息渲染契约）。**同一机制只详述一处**（D2）。
> 消息名 / 载荷的 byte 级维护寄存器 = `thincoder-vscode/AGENTS.md`「Webview ↔ Extension Message Protocol」——**本档 = 机制与演进纪律的权威源**，寄存器只登记形态。
> 需求侧 = `requirements/WEBVIEW.md`（F-W1–F-W7 / N-W1–N-W6）；逐条回指见 §11。
> 来源 = `thincoder-vscode/docs/design/WEBVIEW.md`（VSC 产品树）——**原地一字未改，留作参照历史**（保留 ≠ 维护）。对应源节 = §4 · §7 · §8 · §14.3（C-9–C-16）。
> 建档：2026-09-15（**B 式迁移轮 · VSC 第 2 批**）。坐标 = as-of 2026-09-15 实核（仓根相对路径 + `:行`）。

## 1. 消息流（基本回合）

```
用户输入 → chat.js:send() → postMessage { type:"userMessage", text, model,
reasoning, provider, images? } → extension _chat()
  → setupAgentRun（user 尾追加 "[Attached images: …]" 指针）→ runAgent()
  → onToken → { type:"token", text }
  → onReasoning → { type:"reasoning", text }（Thinking… 折叠块）
  → onToolCall/onToolResult → { type:"toolCall"/"toolResult", name, args/text }
  → onComplete → { type:"complete" }
```

中断 / 错误 / 后台态消息见 §2–§3；回合外流（子代理活动 / 评审流 / 压缩状态 / 挂起状态）走 `toolPanel` / `subagent` / `compress` / `suspension` 消息族。

## 2. 基础会话消息族

| 方向 | 消息 | 载荷 / 语义 |
|---|---|---|
| wv → ext | `userMessage` | `{ text, model?, reasoning?, provider?, images? }`——images = dataURL 数组；扩展落盘 paste-* + `[Attached images: …]` 指针 |
| wv → ext | `abort` / `interrupt` | `—` / `{ message }`——Ctrl+I 中断（提交 partial + 续跑同回合） |
| wv → ext | `newSession` / `switchSession` / `deleteSession` | `{ slot }`——运行中切换拒绝 |
| wv → ext | `getAgentSettings` | pull——重读 config → push `agentSettings` |
| ext → wv | `agentSettings` | `{ settings }`——`agent.*` 快照 |
| wv → ext | `selectModel` / `selectReasoning` | `{ model, provider? }` / `{ reasoning }` |
| wv → ext | `setAdvisorGuard` / `setEngineeringEnabled` | `{ value }`——工具栏开关 |
| ext → wv | `token` / `reasoning` | `{ text }`（reasoning = 思考折叠块） |
| ext → wv | `turnBreak` | `—`——机器子回合边界 |
| ext → wv | `toolCall` / `toolResult` | `{ name, args?/text }` |
| ext → wv | `complete` / `loading` / `aborted` / `error` | `{ text? }`（error 携 needsSetup） |
| ext → wv | `providerStatus` / `autoApprove` / `models` / `sessions` | Provider 态 / AUTO 会话级 / 模型表 / 会话列表 |
| ext → wv | `historyPage` / `loadOlder` | 懒历史：末页先发（`older=false`）+ scroll 补偿 |
| wv → ext | `question` / `questionResponse` | 内联 question 卡（非原生弹窗）——`questionResponse { answer, promptId }` |
| ext → wv | `userMessage` / `assistantMessage` | 历史回放（quick-input 命令回显用） |
| ext → wv | `clearMessages` | `—` |

## 3. 扩展机制消息族（本架构权威源）

| 消息 | 方向 | 载荷 / 语义 |
|---|---|---|
| `toolPanel` | ext → wv | `{ type, name, kind, text, round, model, sub }`——活动流 chunk（advisor / 子代理 / consult / escalate）；`kind` = start / think / text / tool；`sub` = 嵌套子标（string chunk 分支恒 `undefined`）；**增字段** `tool`（工具名）/ `cmd`（参数摘要 ≤60——无则不携） |
| `subagent` | ext → wv | `{ ...info }` 展开透传——`started`（池条目带 `pool: true`）/ `settled` / `done` / `error` / `cancelled` / `terminated` / `failed` / `answered` 终态 + turn / maxTurns 终值快照；**增 status 值** `"turn"`（`{ id, role, turn, maxTurns }` 逐轮进展帧） |
| `subagentApproval` | ext → wv | `{ id, role, model?, tool }`——审批态（`tool = null` 清除）→ 块头 `⏸` + 态词 `等待审批: <tool>` |
| `cancelSubagent` | wv → ext | `{ id, role }`——⏹ 点击路由 → 池条目定向 abort（role 交叉校验防陈旧按钮误停；未知 no-op；advisor role 复用同路由） |
| `permissionRequest` | ext → wv | `{ tool, args, diff, owner, promptId }`——逐项权限卡；`owner` = 子代理归属标签（`<role>#<id>` / `escalate <tag> #<id>`——depth-0 为 `null`）；`promptId` = 响应匹配键 |
| `permissionResponse` | wv → ext | `{ approved, promptId }`——按 promptId 精确匹配队列条目（无 promptId 回退队头——旧 webview） |
| `permissionWithdrawn` | ext → wv | `{ promptId }`——host 侧释放（中止 / approve-all 连带）→ 移除对应卡 |
| `batchPermissionResponse` | wv → ext | approveAll / oneByOne / deny |
| `compress` | ext → wv | start / done / failed / fallback 四态（压缩状态行） |
| `digest` | ext → wv | `{ status:"start"/"end"/"cap", n, ok?, ms?, mode?, turns? }`——消化轮起跑 / 收尾 / turn-cap 指示（呈现契约见 §5） |
| `suspension` | ext → wv | 挂起态行 / 冻结通知（`settled → done` 补发 / `active:false + freeze`）——计数载荷与 `turnState` 双通道同源 |
| `turnState` | ext → wv | `{ state, counts? }`——忙态单一广播（§4.4 权威锚） |
| `statusText` | ext → wv | `{ kind:"rateWait"/"rateLimited"/"overloaded"/"quota"/"index", seconds?/message?/phase?/done?/total? }`——限流 / 索引状态段 |
| `turnFrame` | ext → wv | `{ turn, maxTurns }`——顶层逐轮进展段 |
| `questionCancelled` | ext → wv | `{ promptId }`——abort 释放未答 question 卡（§4.2） |
| `onAgentTurn` | 内部 | 每轮迭代 turn 计数钩子——顶层经 `panel-callbacks` 转 `turnFrame` 上屏；池条目同步转 `subagent` `status:"turn"` |

### 3.1 演进纪律（三落点）

新增**展示**字段必须同时落三个点——**发射端 chunk / 桥 postMessage 载荷 / webview 渲染端**：

1. 发射端（如 `thincoder-vscode/src/agent-tools/subagent-run.mjs:106` 的 tool chunk）；
2. 桥的**白名单纯函数** `toolPanelPayload`（`thincoder-vscode/src/extension/panel-toolpanel.mjs:14-21`）；
3. webview 渲染端（`thincoder-vscode/webview/activity-view.js`）。

历史断链事故：只改发射端与渲染端、漏桥 ⇒ `model` 字段自发布首日被丢弃（2026-08-26 修复 + 锁桥测试）。string / 对象双分支在 payload 构造处统一推导（对象载荷字段透传、string 分支字段 `undefined` 安全降级）。

### 3.2 协议增量登记（六项——只增不改）

| # | 消息面 | 增量 | 发射点 | 接收点 |
|---|---|---|---|---|
| 1 | `statusText`（新消息） | 五 kind 载荷（见 §3 表） | `panel-callbacks.mjs` onWait 映射；`panel-index.mjs` 索引进度 | `chat.js` case → `S._statusText` → 状态行段 |
| 2 | `turnFrame`（新消息） | `{ turn, maxTurns }` | `panel-callbacks.mjs` onAgentTurn（顶层） | 同上 → 状态行 `turn N/M` 段 |
| 3 | `toolPanel`（增字段） | `tool` / `cmd` | 四 chunk 生产者 + payload 白名单 | `activity-view.js` 块头 |
| 4 | `subagent`（增 status 值） | `status:"turn"` + `{ id, role, turn, maxTurns }` | `subagent-run.mjs` onAgentTurn | `applySubagentStatus` 进展分支 |
| 5 | `digest`（增 status 值） | `status:"cap"` + `{ mode, turns }` | `panel-chat.mjs` ContinueError 分支 | `chat.js` case → `.digest-cap` 行 |
| 6 | `usage`（增字段） | `reasoning_tokens` | `panel-callbacks.mjs` 累计（transports 映射补全） | `status-bar.js` ✦ 段 |

纪律 = **只增不改**（不新增消息类型族、不改既有字段语义）。发射 / 接收落点：
`thincoder-vscode/src/extension/panel-callbacks.mjs:138-139` · `:159` · `thincoder-vscode/src/extension/panel-index.mjs:44-70` ·
`thincoder-vscode/src/extension/panel-chat.mjs` · `thincoder-vscode/webview/chat.js:252-253` · `thincoder-vscode/webview/status-bar.js:27-32/46`。

## 4. 消息秩序与忙态收敛

### 4.1 回合入口秩序

- `userMessage` / `retry` / `sendMessage` 命令直发（quick-input / Ask ThinCoder）共用**单一入口** `routeUserTurn`（`thincoder-vscode/src/extension/panel-messages.mjs:59`）。
- 回合执行中（`_turnState === "running"`）的消息一律**拒收**（不排队、无回执——排队机制与排队回执消息类型已废；拒收警告明示，不静默丢——`:65`）。
- `abort` / `interrupt` 等**控制消息永不排队、直通**（延迟红线——杀 Stop 即失败）。
- `sendMessage` 回显（`userMessage` postMessage）先于路由——running 拒收先于回显（无假气泡、无排队回执）。

### 4.2 question 卡 id 匹配

- host 发 `question` 携带单调自增 `promptId`；webview 卡片以 `data-prompt-id` 落 DOM。
- wv → ext `questionResponse` 回带 `{ answer, promptId }`——host 按 id 查队列条目（**非无条件 shift**——找不到 no-op，绝不 resolve 错队头）；无 promptId（旧 webview）→ 回退队头。
- host 中止未答 question（Stop / abort）→ 发 `questionCancelled { promptId }`——webview 按 id 移除对应卡（`chat.js:240-243`）；无 promptId → 移除全部 question 卡；abort 收尾路径同样清屏上 question 卡。

### 4.3 atComplete seq

- wv → ext `atComplete { query, cwd, seq }`——seq 在 webview 侧自增（`thincoder-vscode/webview/autocomplete.js:30-33`）。
- host **只回显最新 seq**（`panel-index.mjs:58`）：慢扫描迟到返回时若已有更新请求 → 丢弃；`atResults { matches, seq }` 回带该 seq（`:66`）——旧扫描不覆盖新下拉。

### 4.4 忙态收敛（权威锚）

- **host `_turnState` 枚举 `{ idle, running, susp }`**：`running` = 回合（含会话内 digest / 会话用户回合）执行中；`susp` = 挂起会话活跃或释放窗口（池仍 live、会话未建）。`waiting`（权限 / question 队列非空）是 running 的**修饰态非互斥**——只经 `_refreshStatus` 呈现（waiting 优先），**不入枚举**。读者一律走谓词 `panel.turnBusy()`（= state ≠ idle）。
- **单一广播**：每次忙态 set / clear 调 → 发 `{ type:"turnState", state, counts? }`；webview **单一 reducer** `handleTurnStateMessage` 更新 `S._turnState`（`thincoder-vscode/webview/chat.js:168`）。
- **counts 同源** = host `backgroundStatus`（`thincoder-vscode/src/extension/suspension.mjs:109-122`）形 `{ running, queued, pending, done }`——随 susp 广播 / 重发携带（挂起驱动轮末 + settle 触发点 + `webviewReady` 重推）⇒ webview `S._suspCounts` 恒 = host 实际（不陈旧）。
- **时序**：状态广播先于同批 `loading:false`（digest / 回合尾）——Stop 派生无闪烁窗口。
- **`S._suspended` 语义不变**：仍由 `suspension` 消息（active / freeze）驱动（会话级语义——digest 执行中 state 为 running 时不得翻 false）；`S._turnState` 是独立的忙态阶段镜像。
- **`#status-line` 单 writer = `renderStatusBar`**（`thincoder-vscode/webview/status-bar.js:13`）：thinking 态 = `S._phase === "thinking"` 标记（`loading` 消息经 `setLoading` 置位 / 清除）——`loading` 消息不再 innerHTML 覆写状态行（修「徽标被每 digest 的 thinking 重画清掉」）。
- **Stop 可见性 = `S._turnState === "running"` 派生**（`thincoder-vscode/webview/loading.js:57`）：running（回合 / 标题窗口 / 会话内 digest 起跑 / Reload 冷启重推）常显；**susp（纯后台池跑——主空闲）不显**（无全停按钮——池空自然消化完）；`loading:true/false` 不再隐 / 显 abort。Stop 作用 = 只停主会话当前 controller（不再全链中止挂起会话）——子代理停止靠区内逐块 ⏹（`cancelSubagent` 定向 abort）。

### 4.5 会话打开单向 boot（权威锚）

- **`resolveWebviewView` 只起慢段**（`status()` = migrate / fullStatus / mcpStatus / 模型偏好 / 索引探测——与 webview 加载重叠并行）；resolve **绝不发会话内容、绝不绑槽**（内容双发 / 槽重绑红线）。
- **`webviewReady` = 会话内容唯一发射点**（快段 `openSessionContent`——`thincoder-vscode/src/extension/panel-session.mjs:301`）：
  握手后才允许 run——`resumeSlot` 绑槽 → `pushProject` → `loadSession` 全量（内部序 autoApprove → planMode →
  `clearMessages` → `historyPage` → sessions——见 `panel-session.mjs:133-166`）。槽绑定时机 = resolve → webviewReady 顺延（webviewReady 前无 slot 读者）。
- **单向 boot 顺序**：`clearMessages` 先于 `historyPage`（先清后灌——一次内容整体落定，无「波浪式」增量）；`older=false` 末页（懒历史首屏——scroll-back 页仍走 `loadOlder`）。
- **sessions 恰一次**：快段内无独立 pushSessions——`loadSession` 尾单发（同 tick 合并双发）；异步第三发（慢段 fullStatus 回调）保留**不同 tick**（跨 tick 允许）。
- **任务可见性族的就绪两拍**排在 `openSessionContent` **之后**（flush → 再断言——见 `WEBVIEW.md` §5.3）。

## 5. digest 轮可见面与 turn-cap

**契约**（落点 = `thincoder-vscode/webview/chat.js:358-405`）：

- `digest start` → ① 追加 `.digest-turn` 标签行（locale 键 `digest.turnLabel`——CLI 起跑 dim 行对位）；
  ② 追加**本轮独立** `.digest-status` 元素（`id="digest-status"` 退役）；③ 记本轮边界 `S._digestBoundary = 标签行`（归档落点）；
  ④ `ctx.assistantLabeled = false`（本轮 assistant 输出带一次回合标签）。
- `digest end` → **本轮**元素原地更新（`ok` 旗标语义不变——异常不留「仍在消化」假象）。
- `digest cap` → `.digest-cap` 行（`mode:"auto"` dim / `mode:"stop"` warn）。

- 实现落点：`thincoder-vscode/webview/chat.js:358-405`（`showDigestStatus`）· 样式 `thincoder-vscode/webview/base.css`（`.digest-status` 族沿用 + `.digest-turn` / `.digest-cap`）。
- 跨轮 = **新元素随流追加**（漂移消除）——`start` 连发亦各成独立元素（`end` 更新其前最近未结的本轮元素）。
- 投递 = **直投**（不走 outbox——digest 只在面板活跃且 webview 已就绪后发生；outbox 语义 = 出生事件族）。
- host 发射点：`thincoder-vscode/src/extension/suspension.mjs:265`（digest 起跑一侧）· `panel-chat.mjs` ContinueError 分支（cap 两档）。

## 6. 状态行与块头字段对位

### 6.1 状态行段位（本端 × CLI）

| 字段 | CLI 形态 | 本端现状（`webview/status-bar.js`） | 结论 |
|---|---|---|---|
| 状态文本段 | `state.status`（Processing / Indexing… / Running: cmd / TPM throttle wait / overloaded / Rate-limited / Waiting: X） | 新增 `statusText` 段（`:27-30`）；活动恢复即清（`chat.js:339-348`） | 采用（C-12#1） |
| 当前工具 | ` ${currentTool}…` | `工具: name`（`:45`） | 等价 |
| 计时 | processing ` Ns` | `耗时 Ns`（`:47`） | 等价 |
| 任务 | `✓N/M` | task 徽标 `✓d/total`（`:48`） | 等价 |
| 轮次 | `turn N/M` | `turn N/M`（`:46`）——旧 `轮次 N` 段退役 | 采用（C-12#2） |
| token | `↑X ↓Y ✦R hitN%` | `↑X ↓Y hitN%`（`:31-33`）——✦ 仅 `reasoning_tokens > 0` | 采用（C-12#6） |
| context | `context X% Yk` | `context X%`（`:34-40`；≥80% 警告色） | 端差登记（绝对数不做——本端 pct 源 = 实 prompt tokens） |
| 滚动 | `scrolled N` | 悬浮回底钮（`thincoder-vscode/webview/scroll.js:29-34`） | 端差登记（钮为可点击超集；N 需新造单位） |
| 输入提示 / 键位串 | enterHint + 键位串 | 无（按钮 / 占位符承载） | 端差登记 |
| 横幅 | PLAN / AUTO / ADVISOR / ENG + attention chip | 工具条按钮 active + plan 徽标（`:23`） | 端差登记（attention chip 不做——权限 / 提问卡流内可见） |
| 后台段 | `后台 N 子代理运行中 · M 完成待消化` | `⏳ …`（`:51-60`——running+queued / pending+done 两段） | 等价 |

### 6.2 块头字段对位（本端 × CLI）

| 字段 | CLI 形态 | 本端现状 | 结论 |
|---|---|---|---|
| icon | `⏸ / ✓ / ▶`（审批 / 完成 / 运行） | `⏳ / ▶ / ✓ / ⏹ / ⏸`（排队 / 运行 / 完成 / 停 / 审批） | 保持本端语汇（端差登记——语义对位） |
| 键 | `role#N` | 同（label） | 等价 |
| 模式词 | ` · sync/async` | ` · 同步/异步`（family 角色；queued 不携） | 等价（queued 信息走状态区） |
| 模型 | ` · model`（宽截断） | ` · model`（consult / escalate 键内嵌） | 等价 |
| 计时 | ` · Ns`（done 定格） | ` · Ns`（事件驱动 + 2s 定时刷新——`activity.js:379`） | 语义不变 |
| turn | ` · turn N/M` | ` · turn N/M`（`maxTurns > 0` 且 `turn > 0`；快照 + `status:"turn"` 实时） | 对齐 |
| 状态区·running | `currentTool` / `thinking...` | `${tool} — ${cmd ≤60}` / 工具文本尾句 / `思考中…` | 对齐（C-11①） |
| 状态区·queued | `queued · position N（槽满等位）` / 依赖 detail 原文 | `排队中 · 位置 N（槽满等位）` / 原因原文 | 对齐（C-11②） |
| 审批态 | `等待审批: X` | `⏸` + `等待审批: <tool>`（`activity-view.js:45` · `:75`） | **已实装**——两端同形 |
| 待消化 | `done · awaiting digestion`（状态区） | 块头态词同文案（`activity-view.js:76`） | 对齐 |
| 冻结头 + tail-3 | `[✓ key · … · done Ns · turn]` + tail-3 | 同形态（`activity-view.js:86-96`） | 等价（归档后形态不变） |

### 6.3 i18n 键表（本轮新增 12 键 · 两 locale 逐字）

| 键 | zh | en |
|---|---|---|
| `digest.turnLabel` | 自动回合：消化已完成的子代理报告… | [auto-turn: digesting finished subagent reports…] |
| `digest.capAuto` | 自动回合：越过轮次上限，继续推进… | [auto-turn: continuing past turn cap…] |
| `digest.capStop` | 自动回合在 ${turns} 轮处停止——部分消化；已完成的报告保留在历史中 | [auto-turn stopped at ${turns} turns — partial digest; finished reports stay in history] |
| `sub.awaitingDigest` | 已完成 · 等待消化 | done · awaiting digestion |
| `sub.queueSlot` | 排队中 · 位置 ${n}（槽满等位） | queued · position ${n} (slot full) |
| `status.turn` | 轮次 ${n}/${m} | turn ${n}/${m} |
| `status.rateWait` | TPM 限流等待 ~${s}s | TPM throttle wait ~${s}s |
| `status.rateLimited` | 限流 429，${s}s 后重试 | Rate-limited 429, retry in ${s}s |
| `status.overloaded` | 服务过载，${s}s 后重试 | Server overloaded, retrying in ${s}s |
| `status.quota` | 配额耗尽：${msg} | quota exhausted: ${msg} |
| `status.indexScan` | 索引：扫描 ${n} 文件… | Indexing: scanning ${n} files… |
| `status.indexEmbed` | 索引：嵌入 ${done}/${total}… | Indexing: embedding ${done}/${total}… |

- **占位符记法**：本端引擎只认 `${k}` 形态（`thincoder-vscode/webview/i18n.js:30`）——照抄 `{n}` 会把字面占位符显示给用户。
- `status.turns` 键随旧段退役删除；`digest.start/done/aborted` 与其余既有键不动。
- 审批态键 = `sub.awaitingApproval`（`等待审批: ${tool}` / `Awaiting approval: ${tool}`）——**已实装**（见 §6.2）；文案单源 = `thincoder-vscode/locales/{zh,en}.json`。

## 7. 关键决策记录（含否决备选）

| # | 决策 | 否决备选 / 理由 |
|---|---|---|
| D-P1 | 忙态 = host 单枚举 + **单一广播** + webview 单 reducer | 否决多源派生态（Stop / thinking 双写 → 闪烁） |
| D-P2 | Stop 可见性由 `_turnState === "running"` **派生**（susp 不显） | 否决 `state ≠ idle`（susp 纯池跑会给全停按钮——语义错）· 否决 loading 驱动显隐（digest 间闪烁） |
| D-P3 | `#status-line` 单 writer = `renderStatusBar`（thinking 走 `_phase` 标记） | 否决 loading 消息直接 innerHTML 覆写（徽标被重画清掉） |
| D-P4 | question 卡按 `promptId` 精确匹配（非 shift） | 否决无条件 shift（会 resolve 错队头） |
| D-P5 | `atComplete` 带自增 seq、host 只回显最新 | 否决仅靠防抖（防抖窗外的乱序返回无兜底） |
| D-P6 | 会话打开 = **单向 boot**：resolve 零内容、`webviewReady` 唯一发射点 | 否决 resolve 期发内容（webview 未加载即丢——Reload 后对话区空）· 否决内容双发 / 槽重绑 |
| D-P7 | digest 轮 = 标签行 + **每轮独立**状态元素 | 否决单元素跨轮复用 + 搬运（跨轮漂移 + 一位移逻辑）· 否决新增 `turnStart` 消息族（比复用 `digest start` 重） |
| D-P8 | 状态文本载体 = **结构化 `statusText` 消息**（kind 判别 → webview 按 locale 渲染） | 否决 host 直发成品文本（host 不知 locale——复制 i18n = 双源）· 否决不做（判定句要求用例锁新增状态文本） |
| D-P9 | Send 可见性 = running 期**隐藏** | 否决禁用态（双范式 + 仍占位） |
| D-P10 | `scrolled N` = 端差保持（悬浮回底钮替代） | 否决补文本段（N 需新造单位 + 与钮重复） |
| D-P11 | 协议增量 = **只增不改**、六项登记（§3.2） | 否决 host 直发成品文本 · 否决新增 `turnStart` 族 |

## 8. 不并项与历史沿革

### 8.1 历史沿革（(d) 类——**不并**）

> 来源档 `thincoder-vscode/docs/design/WEBVIEW.md`（VSC 产品档）——**原地保留作参照历史**。下列内容**不并入本档**：

| 旧档位置 | 内容 | 何故不并 |
|---|---|---|
| §7.4 问题陈述 + 方案选型（3 候选） | 「消化轮静默 → 可见」的问题与候选取舍过程 | 一次性批次材料——**结论已入 §5 契约**；否决理由属批次语境 |
| §7.4 受影响文件 / 用例表 / 验收标准 / 边界 | 第 21 批施工面清单（文件行数 / T-D1–T-D5 / AC-D1–AC-D3） | 一次性批次材料——测试资产归测试层（`thincoder-vscode/test/digest-visibility.test.mjs`） |
| §7.4 逐字文案表的「逐字（coder 照抄）」注 | 施工指令（现已落地） | 施工指令——文案单源 = `thincoder-vscode/locales/{zh,en}.json`（§6.3 只作对照表） |
| §14.3 各条内的「修正轮 #N」「实现后同步」注、`state.js` 协调项登记 | 评审轮次留痕与落地校准记录 | 批次过程材料——契约正文已按现态书写 |

> §14 其余批材料（14.1 现场核实 / 14.2 选型表 / 14.6 受影响文件 / 14.7 用例表 / 14.8 AC / 14.9 边界 / 14.10 UI）逐项登记在 `WEBVIEW.md` §7.1（同一份不并项清单不重复——D2）。

### 8.2 迁移期登记（**非**不并项——随批收口）

| # | 事项 | 现状 | 收口点 |
|---|---|---|---|
| 1 | 消息名 / 载荷 byte 级寄存器 = `thincoder-vscode/AGENTS.md` | 仍住产品树（本批只读，零写入） | 产品树降格后随批处置 |
| 2 | `AGENT-LOOP（VSC 侧）` §18（权限 / 审批族）· §16（活动区收口需求） | 未迁入基准层（统一面）——引用保持迁移期口径 | 统一面批次并入 `docs/core/requirements/AGENT-LOOP.md` 后翻转 |

## 9. UI / 交互决策落档

| # | 决策 | 状态 |
|---|---|---|
| U-P1 | digest 轮 = 标签行 + 状态行（每轮各一）；cap 行 dim / warn 两档 | 已定（§5 · D-P7） |
| U-P2 | 状态文本段 = 单段（活动恢复即清——无 TTL） | 已定（§6.1 · D-P8） |
| U-P3 | `turn N/M` 段替旧「轮次 N」段；✦ 段条件显（> 0） | 已定（§6.1） |
| U-P4 | Send 隐藏 / Stop 显 = running 派生 | 已定（§4.4 · D-P9） |
| U-P5 | 端差不做项：`scrolled N` · ctx 绝对数 · attention chip · 键位提示段 | 已定（§6.1——逐条登记，不静默） |
| U-P6 | 可调常量（批准环节可翻转）：elapsed 刷新节拍（复用 2s）；状态文本保留时长（无 TTL） | 已定（open 面 = 数值，非语义） |

## 10. 体量与拆分规划（R24a）

**实测行数**：本档 **271 行**（新建 · 终稿实核）——低于 300 行软线，**无需拆分**。
**拆分来源**：源档 §7/§8 与 §14.3 的协议面部分独立成档——理由 = 读者面不同（改 host 发射端 / webview 接收端者）且与结构面（`WEBVIEW.md`）无共享回指；切面取舍总表见 `WEBVIEW.md` §9。

## 11. 验收与需求回指

| # | 本档覆盖 | 回指 |
|---|---|---|
| 1 | 消息族与演进纪律（基础族 / 机制族 / 三落点 / 只增不改） | F-W1 · F-W7 |
| 2 | 忙态与消化轮可见指示（`turnState` 收敛 · digest 轮 · cap 行） | F-W7 · N-W1 |
| 3 | 状态行段位与块头字段对位（含端差登记） | F-W7 · N-W6 |
| 4 | 会话标题与消息秩序（promptId / seq / 单向 boot） | F-W2 · F-W3 |
| 5 | 机检面（新增档 ≤500 行 · 无 >300 字符单行 · 文档锚零悬空） | N-M3 · N-M2 |

**用例面**：协议面测试资产在 `thincoder-vscode/test/`（`webview-turnstate` · `status-line` · `digest-visibility` · `chat-panel` · `chat-panel-messages` · `session-boot`）——用例表归测试层，本档不复制（D2）。

## 变更记录

- 2026-09-15（**B 式迁移轮 · VSC 第 2 批**）：建档——源档 §4 / §7 / §8 / §14.3 的协议面内容重建入基准层（旧档一字未改）；坐标按 as-of 2026-09-15 实核改写；批次材料（问题陈述 / 选型 / 受影响文件 / 用例表 / 验收标准 / 边界）入 §8.1。
- 2026-09-15：**按现状收正 1 处**——旧档 §14 C-13 表「审批态 = 无此状态（子代理不经权限门）· 端差登记（不做）」与现行实现冲突（审批态族已实装：`subagentApproval` 消息 + 块头 `⏸`）——本档 §6.2 按现状落笔并与 §3 消息表口径一致；冲突已上报批次（主 agent 裁定）。
