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
| ext → wv | `toolCall` / `toolResult` | `{ name, args?/text }`——`toolCall` **增字段** `round` · `model`（X2——advisor 专属）；`toolResult` **增字段** `truncated`（X5——64K 切片点事实旗标，标记文案 `tool.truncated`） |
| ext → wv | `complete` / `loading` / `aborted` / `error` | `{ text? }`（error 携 needsSetup） |
| ext → wv | `providerStatus` / `autoApprove` / `models` / `sessions` | Provider 态 / AUTO 会话级 / 模型表 / 会话列表 |
| ext → wv | `historyPage` / `loadOlder` | 懒历史：末页先发（`older=false`）+ scroll 补偿 |
| wv → ext | `question` / `questionResponse` | 内联 question 卡（非原生弹窗）——`questionResponse { answer, promptId }` |
| ext → wv | `userMessage` | 历史回放（quick-input 命令回显用） |
| ext → wv | `clearMessages` | `—` |

## 3. 扩展机制消息族（本架构权威源）

| 消息 | 方向 | 载荷 / 语义 |
|---|---|---|
| `toolPanel` | ext → wv | `{ type, name, kind, text, round, model, sub }`——活动流 chunk（advisor / 子代理 / consult / escalate）；`kind` = start / think / text / tool；`sub` = 嵌套子标（string chunk 分支恒 `undefined`）；**增字段** `tool`（工具名——工具调用面与工具输出面同携）/ `cmd`（参数摘要 ≤60——无则不携）/ `face`（内容 chunk 来源面 ∈ `text` / `think` / `toolCall` / `toolOutput`——`WEBVIEW.md` §5.6 合并判据源）。**生产者双源** = `onToolPanel` 缝 + 子代内容 chunk 中继（relay 前缀分流——`panel-callbacks.mjs` `relaySubagentContentChunk`）；`cmd` ≤60 截断落层 = **webview 块头渲染**（`activity-view.js` `noteChunk`——超 60 截为 59+…），桥与生产者透传原串 |
| `subagent` | ext → wv | `{ ...info }` 展开透传——`started`（池条目带 `pool: true`）/ `settled` / `done` / `error` / `cancelled` / `terminated` / `failed` / `answered` 终态 + turn / maxTurns 终值快照；**增 status 值** `"turn"`（`{ id, role, turn, maxTurns }` 逐轮进展帧）；**增字段** `note`（块头停因注记——X6）/ `syncLive`（sync 可中止事实——X10） |
| `subagentApproval` | ext → wv | `{ id, role, model?, tool }`——审批态（`tool = null` 清除）→ 块头 `⏸` + 态词 `等待审批: <tool>` |
| `cancelSubagent` | wv → ext | `{ id, role }`——⏹ 点击路由 → 池条目定向 abort（role 交叉校验防陈旧按钮误停；未知 no-op）；**advisor role 复用同路由**——与子代理族**同经** `executeCancelAction`（**不得**走专用直调分支；收尾口径 = `AGENT-LOOP-ASYNC-POOL.md` 的 §6.11 第 3 条「端侧路径收口」）⇒ 取消事件经中继转 `subagent` 协议消息（queued 命中 = `cancelled(was:"queued")`——等待头移除；running 命中 = `cancelled`——块定格） |
| `permissionRequest` | ext → wv | `{ tool, args, diff, owner, promptId }`——逐项权限卡；`owner` = 子代理归属标签（`<role>#<id>` / `escalate <model> #<id>`（尖括号为字面 · model = 池条目值——2026-09-16 残环批收正：前引 `<tag>` = 前引擎值；`continue` 询问卡 = `<role>#<id>`〔args.agent 机器键——同批〕）——depth-0 为 `null`）；`promptId` = 响应匹配键 |
| `permissionResponse` | wv → ext | `{ approved, promptId }`——按 promptId 精确匹配队列条目（无 promptId 回退队头——旧 webview） |
| `permissionWithdrawn` | ext → wv | `{ promptId }`——host 侧释放（条目取消（⏹/cancel——signal 链）/ 中止 / approve-all 连带 / **合并卡 Stop·Ctrl+I 释放** / **孤儿响应**）→ 移除对应卡（逐项 / 合并同选择器——§4.6） |
| `batchPermissionRequest` | ext → wv | `{ tools, count, promptId }`——合并询问卡（同响应 ≥2 非只读工具——§16 D-B1）；`promptId` = 与逐项卡**同族响应键**（同一单调计数器——§4.6） |
| `batchPermissionResponse` | wv → ext | `{ choice, promptId? }`——approveAll / oneByOne / deny；`promptId` 精确匹配 `_batchPermissionQueue` 条目（无 promptId 回退队头——旧 webview）；命中零条目 ⇒ host 回 `permissionWithdrawn`（§4.6） |
| `compress` | ext → wv | start / done / failed / fallback 四态（压缩状态行） |
| `digest` | ext → wv | `{ status:"start"/"end"/"cap", n, ok?, ms?, mode?, turns? }`——消化轮起跑 / 收尾 / turn-cap 指示（呈现契约见 §5）；**增字段** `tier`（起跑档位 `ask` / `digest`——§5）+ `from` / `msg`（仅 ask 档条件携带——提问者 `role#id` 与问题摘要（单行 + 截断 ≤120 字符，核单点）） |
| `suspension` | ext → wv | 挂起态行 / 冻结通知（`settled → done` 补发 / `active:false + freeze`）——计数载荷与 `turnState` 双通道同源；**增字段** `interrupted`（会话中止事实——X11） |
| `turnState` | ext → wv | `{ state, counts? }`——忙态单一广播（§4.4 权威锚） |
| `workspaceGuard` | ext → wv | `{ active }`——无工作区守卫态（拒启 + 提示；判据 / 守卫面 / 提示面 = `docs/vsc/design/PROJECT-SWITCHER.md` §4.1）。发射 = `src/extension/workspace-guard.mjs` `pushWorkspaceGuard`（推送点 = `panel-session.mjs` 的 `openSessionContent` 两分支 / `chat-panel.mjs` 工作区变化处理）；消费 = `webview/chat.js` `case`（§3.2 行 15）。机检②/③ 列坐标 = §12 行 |
| `busyQueued` | ext → wv | `{ pending, count?, items?, text?, merged? }`——busy 排队**队列快照**（`count` = 剩余条数；`items` = 队列剩余项原文（按队列序）；`text` = 刚受理项原文（受理推送携）；`merged` = 本批消费的合并文本（仅消费推送携））。webview 消费 = 二次提交守卫（`count >= 8`）+ 待发送气泡（逐条标记 / 单条批清标保留 / 多条批合并成形——判据 / 清除 / 标记 = `WEBVIEW-INPUT.md` §1 C-B2-6 ①⑦）。发射 = `src/extension/panel-messages.mjs` `pushBusyQueued`（受理 / **五个消费点**（含步边界 pickup） / 忙分支判决 / `webviewReady` 握手重推）；消费 = `webview/chat-messages.js` `case`（§3.2 行 17）。机检②/③ 列坐标 = §12 行 |
| `statusText` | ext → wv | `{ kind:"rateWait"/"rateLimited"/"overloaded"/"quota"/"index", seconds?/message?/phase?/done?/total? }`——限流 / 索引状态段 |
| `turnFrame` | ext → wv | `{ turn, maxTurns }`——顶层逐轮进展段 |
| `questionCancelled` | ext → wv | `{ promptId }`——abort 释放未答 question 卡（§4.2） |
| `onAgentTurn` | 内部 | 每轮迭代 turn 计数钩子——顶层经 `panel-callbacks` 转 `turnFrame` 上屏；池条目同步转 `subagent` `status:"turn"` |

### 3.1 演进纪律（三落点）

新增**展示**字段必须同时落三个点——**发射端 chunk / 桥 postMessage 载荷 / webview 渲染端**：

1. 发射端（子代内容 chunk 现体 = 端壳中继 `thincoder-vscode/src/extension/panel-callbacks.mjs` `relaySubagentContentChunk`；核 `thincoder-core/agent-tools/subagent-run.mjs` 的 tool chunk）；
2. 桥的**白名单纯函数** `toolPanelPayload`（`thincoder-vscode/src/extension/panel-toolpanel.mjs:14-21`）；
3. webview 渲染端（`thincoder-vscode/webview/activity-view.js`）。

历史断链事故：只改发射端与渲染端、漏桥 ⇒ `model` 字段自发布首日被丢弃（2026-08-26 修复 + 锁桥测试）。string / 对象双分支在 payload 构造处统一推导（对象载荷字段透传、string 分支字段 `undefined` 安全降级）。

### 3.2 协议增量登记（十七项——只增不改）

| # | 消息面 | 增量 | 发射点 | 接收点 |
|---|---|---|---|---|
| 1 | `statusText`（新消息） | 五 kind 载荷（见 §3 表） | `panel-callbacks.mjs` onWait 映射；`panel-index.mjs` 索引进度 | `chat.js` case → `S._statusText` → 状态行段 |
| 2 | `turnFrame`（新消息） | `{ turn, maxTurns }` | `panel-callbacks.mjs` onAgentTurn（顶层） | 同上 → 状态行 `turn N/M` 段 |
| 3 | `toolPanel`（增字段） | `tool` / `cmd` / **`face`**（2026-09-20 补——内容 chunk 来源面，工具输出面合并判据源：`WEBVIEW.md` §5.6） | `relaySubagentContentChunk`（子代内容中继——2026-09-16 补）+ payload 白名单 | `activity-view.js` 块头 · `ui.js` 内容行合并 |
| 4 | `subagent`（增 status 值） | `status:"turn"` + `{ id, role, turn, maxTurns }` | `subagent-run.mjs` onAgentTurn | `applySubagentStatus` 进展分支 |
| 5 | `digest`（增 status 值） | `status:"cap"` + `{ mode, turns }` | `panel-turn-loop.mjs` ContinueError 分支（`postDigestCap`） | `chat.js` case → `.digest-cap` 行 |
| 6 | `usage`（增字段） | `reasoning_tokens` | `panel-callbacks.mjs` 累计（transports 映射补全） | `status-bar.js` ✦ 段 |
| 7 | `batchPermissionRequest`（增字段） | `promptId`（与逐项卡同族响应键——§4.6） | `permission-gate.mjs` `batchPermissionGate` | `chat.js` case → `showBatchPermissionRequest`（`data-prompt-id`） |
| 8 | `panelDiag`（**新消息**——webview → host 诊断上行） | `{ kind:"subTrace", entries:[{ kind, channel, at }] }`——出生 / 终态 / 丢弃三面痕迹（批内合并，最多一消息 / 批） | `thincoder-vscode/webview/activity-diag.js`（上行发点） | `panel-messages.mjs` case → `logEvent("ev:subtrace", …)` |
| 9 | `toolCall`（增字段） | `round` · `model`（advisor 专属——非 advisor 零字段） | `panel-callbacks.mjs` `advisorMeta`（模型取核 resolver，失败降 `null`） | `chat.js` case → 状态行字面 + `ui.js` `advisorRoundTag`（卡头 span） |
| 10 | `toolResult`（增字段） | `truncated`（64K 切片点**事实旗标**） | `panel-callbacks.mjs` `onToolResult`（切片点同点立旗） | `chat.js` case → `ui.js` `finishTool`（正文尾标记行 + 摘要尾标注） |
| 11 | `digest`（增字段） | `tier`（`ask` / `digest` 两档——按因；判据 = 未 drain ask 在场旗标） | `suspension.mjs` 起跑点（同点判据——核既有载体） | `chat.js` `showDigestStatus`（两档标签键 + 计数元素随 `n > 0`——§5） |
| 12 | `subagent`（增字段） | `note`（停因注记——turn-cap / 用户停止）· `syncLive`（可中止事实） | `panel-callbacks.mjs` `settleSyncSubagent`（`note`）· `panel-subagent-relay.mjs` 出生面 / `suspension.mjs` 存活投影（`syncLive`） | `activity.js` `_subMeta` → `activity-view.js` 块头注记 / ⏹ 门控（`WEBVIEW.md` §5.2） |
| 13 | `suspension`（增字段） | `interrupted`（会话中止事实——自然退出 false） | `suspension.mjs` `postSuspensionEnd` | `panels.js` → `activity.js` `freezeLiveBlocks`（`— interrupted` 注记） |
| 14 | `digest`（增字段） | `from` / `msg`（ask 档携参——提问者 + 问题摘要；`msg` = 单行 + 截断 ≤120 字符，核单点 `upstreamAskLabelVars`） | `suspension.mjs` 起跑点（ask 档条件携带） | `chat.js` `showDigestStatus`（`digest.turnLabelAsk` 携参取键——§5） |
| 15 | `workspaceGuard`（**新消息**——host → webview） | `{ active:boolean }`——无工作区守卫态（面板拒发 + 占位符第三态；判据 / 守卫面 = `PROJECT-SWITCHER.md` §4.1） | `src/extension/workspace-guard.mjs` `pushWorkspaceGuard`（推送点 = `panel-session.mjs` `openSessionContent` 两分支 / `chat-panel.mjs` 工作区变化处理；机检发点坐标 = `src/extension/workspace-guard.mjs:38`） | `webview/chat.js:197` `case "workspaceGuard"` |
| 16 | `queuedUserMessage`（**新消息**——webview → host 输入上行） | `{ text, model, reasoning, provider, images }`——busy 期排队注入（busy 即排队面 = `running`；host 单槽载体两态 = 无会话 `panel._busyQueued` ∥ 会话在飞 `susp.pendingInput`；细则 = `WEBVIEW-INPUT.md` §1 C-B2-6） | `webview/send.js:44`（出口分流——本地气泡先行） | `panel-messages.mjs:174` `case` → `routeUserTurn` 入槽 |
| 17 | `busyQueued`（状态镜像 · **增字段 `count` / `items` / `text` / `merged`**） | `{ pending:boolean, count?:number, items?:string[], text?:string, merged?:string }`——队列快照（`count` / `items` = 剩余实况（守卫 = `count >= 8`；Reload 重建源 = `items`）；`text` = 刚受理项（标记源）；`merged` = 本批合并文本（仅消费推送——多条批合泡源）；`WEBVIEW-INPUT.md` §1 C-B2-6 ①⑦） | `src/extension/panel-messages.mjs` `pushBusyQueued`（受理 / **五个消费点**（含步边界 pickup） / 忙分支判决 / `webviewReady` 握手重推） | `webview/chat-messages.js` `case "busyQueued"` → `S._busyQueuedCount` / `S._busyQueuedPending` + 待发送气泡（逐条标记 / 清标 / 合并成形） |

纪律 = **只增不改**（不新增消息类型族、不改既有字段语义）——**新增 / 变更一律入本节登记表**（行 1–17 即全部在案增量；表外增量不入）。发射 / 接收落点：
`thincoder-vscode/src/extension/panel-callbacks.mjs:169`（statusText）· `:170`（turnFrame）· `thincoder-vscode/src/extension/panel-index.mjs:27` ·
`thincoder-vscode/webview/chat.js:260` · `thincoder-vscode/webview/status-bar.js:27-30/46`。

### 3.3 工具驱动的模式 / 参数变更 → 端显示同步（#45）

**问题（台账 #45）**：agent 经**工具**翻转模式 / 改参数 ⇒ 端显示不变（用户 2026-09-18 01:41 报告 VSC 实测；CLI 未验）。核实结论 as-of 2026-09-18 02:0x（本批实读，逐源逐端判定）：

| 变更源 | 端 | 显示面 | 判定 | 证据 |
|---|---|---|---|---|
| `eng` 工具（核） | VSC | `agentSettings` 快照 → ENG 按钮态 | **未接** | `configureEngMirror` 端侧实现只做槽写 + config 镜像 + 结果尾提示串，**零 webview 推送**（`thincoder-vscode/src/agent/setup-tooltable.mjs:84-100`；对照 webview 桥 `thincoder-vscode/src/extension/panel-callbacks.mjs:251`） |
| `plan` 工具（核） | VSC | `planMode` 消息 | **已接（静态链完整）· 运行时未验** | `thincoder-vscode/src/agent.mjs:423-426`（写入 diff → `callbacks.onPlanMode`）→ `thincoder-vscode/src/extension/panel-callbacks.mjs:251`（`postMessage({type:"planMode"})` + `_setPlanMode` 槽写） |
| `settings` 工具（核） | VSC | `agentSettings` / `proxySettings` / `websearchSettings` / `shellCandidates` 四快照 | **未接** | 核工具全域零通知缝（`thincoder-core/agent-tools/settings.mjs` 内 `configure` / `notify` / `onChange` / `postMessage` / `panel` 零命中）；`config-watch` 的**自写抑制**（成功写后刷基线 ⇒ 元组未变零推送）把兜底路径一并关掉 |
| 三工具 | CLI | 状态行 banner（`ENG│` / `PLAN│`） | **已接（结构性——零改需求）** | `thincoder-cli/src/tui/render-frame.mjs:220-224` 每帧由**活对象** recompute（`agent.config.agent.engineering` / `agent.planMode`）；回合中 1s ticker + 行 diff 重绘（`thincoder-cli/src/tui/agent-turn.mjs` 回合驱动器） |

**机制（单一路径 = 一个同步点 + 一个 sink）**：

```text
变更源（工具）→ 状态载体（agent.config.agent.engineering / 会话槽；config.json）
      ↓ 工具批后（与 task / plan / goal 同一趟「载体镜像回填」——VSC src/agent.mjs）
端显示同步点（一处在位，判据两条，每轮复位）
      ↓ callbacks.onEngMode / onSettingsChanged
单一 sink = panel._pushSettingsLight()（唯一 webview 写点——四快照重推）
      ↓
webview：agentSettings 快照 → mode-buttons.js 的 `_engOn` → `#eng-btn` 态
```

- **零新增消息类型**（§3.2「只增不改」纪律保持）：两腿都复用既有 `agentSettings` 快照消息——**发射点 / 载荷 / 消费位三面零变**，§12 对表**零改**（机检口径 = 顶级判别式集与发射点集，两者均不动）。
- **判据两条（同在工具批后单点）**：
  ① **模式腿** —— `agent.config?.agent?.engineering !== agent._engShown`；`_engShown` 在 `hydrateRun` 按槽应用处**置为当前基线**（`agent._engShown = agent.config?.agent?.engineering === true`）——「**已展示基线**」语义，
  **非** `undefined` / `null`（后者会让每 run 首个工具批无条件重推一次快照——设计评审轮 1 发现 9 定值）；
  ② **参数腿** —— `agent._settingsTouched` 标记（端侧 settings 工具包装在 `execute` 返回处置位；同步点读后复位——置位不做「成功」判定，快照重推幂等）。
- **用户路径不对称**：用户点击（`setEngineeringEnabled` / `setPlanMode`）走既有**直推**（`thincoder-vscode/src/extension/panel-messages.mjs:448-458`）——与本机制的 sink **同源**（`_pushSettingsLight` / `planMode` 消息），不构成第三条路径。
- **CLI half = 不进推送链**：状态行每帧 recompute 已是「变更 → 显示」的最短路径。本档登记该**结构性**属性：CLI 侧**不得**为模式再引入缓存副本（引入即须自建失效链——本机制的 CLI 面因此天然免维护）。
- **深度 > 0 不涉及**：子代理循环的 `callbacks` 无该两键 ⇒ `?.` 调用恒为 no-op（零注入、零推送）。

### 4. 消息秩序与忙态收敛

### 4.1 回合入口秩序

- `userMessage` / `retry` / `sendMessage` 命令直发（quick-input / Ask ThinCoder）共用**单一入口** `routeUserTurn`（`thincoder-vscode/src/extension/panel-messages.mjs:102`）。
- 回合执行中（`_turnState === "running"`）的消息**一律排队受理**（C-B2-6）：单槽载体两态——无会话 ⇒ host 单槽 `panel._busyQueued`；
  会话在飞（`panel._susp`）⇒ 会话单槽 `susp.pendingInput`（webview 侧 = 本地气泡 + `queuedUserMessage` 上行；单槽满 ⇒ 提交不出泡 / 不清框 / toast——二次提交守卫）。
  送达 = 四支（**步边界 pickup（主——用户回合在飞：端壳循环头同址回调）** / driver 步骤 1 输入优先消费 / `enterSuspensionTurn` 预填 / idle 归位续发；会话退出兜底 = 残余直注入，零丢失）。契约单源 = `WEBVIEW-INPUT.md` §1 C-B2-6。
- `abort` / `interrupt` 等**控制消息永不排队、直通**（延迟红线——杀 Stop 即失败）。
- `sendMessage` 回显（`userMessage` postMessage）先于路由——busy 面（含挂起会话内）回显即排队气泡面（C-B2-6 ③ 外部入口同判据同槽——用户气泡回显保留在 `sendMessage`）。

### 4.2 question 卡 id 匹配

- host 发 `question` 携带单调自增 `promptId`；webview 卡片以 `data-prompt-id` 落 DOM。
- wv → ext `questionResponse` 回带 `{ answer, promptId }`——host 按 id 查队列条目（**非无条件 shift**——找不到 no-op，绝不 resolve 错队头）；无 promptId（旧 webview）→ 回退队头。
- host 中止未答 question（Stop / abort）→ 发 `questionCancelled { promptId }`——webview 按 id 移除对应卡（`chat.js:240-243`）；无 promptId → 移除全部 question 卡；abort 收尾路径同样清屏上 question 卡。

### 4.3 atComplete seq

- wv → ext `atComplete { query, cwd, seq }`——seq 在 webview 侧自增（`thincoder-vscode/webview/autocomplete.js:30-33`）。
- host **只回显最新 seq**（`panel-index.mjs:58`）：慢扫描迟到返回时若已有更新请求 → 丢弃；`atResults { matches, seq }` 回带该 seq（`:66`）——旧扫描不覆盖新下拉。

### 4.4 忙态收敛（权威锚）

- **host `_turnState` 枚举 `{ idle, running, susp }`**：`running` = 回合（含会话内 digest / 会话用户回合）执行中；`susp` = 挂起会话活跃或释放窗口（池仍 live、会话未建）。`waiting`（**权限 / 批权限 / question 三队列任一非空**）是 running 的**修饰态非互斥**——只经 `_refreshStatus` 呈现（waiting 优先），**不入枚举**。读者一律走谓词 `panel.turnBusy()`（= state ≠ idle）。
- **释放 ⇒ 必刷**（2026-09-18 修轮补）：任一队列条目离队后必经 `_refreshStatus` 重算——刷新点单源 = 释放通道 `releasePermission`（§4.6）；批卡停驻期与释放后均不得读作 `idle` / `running`（停驻期误读 `running` · Stop 释放后残留 `waiting`——两形态同一判据缺口）。
- **单一广播**：每次忙态 set / clear 调 → 发 `{ type:"turnState", state, counts? }`；webview **单一 reducer** `handleTurnStateMessage` 更新 `S._turnState`（`thincoder-vscode/webview/chat.js:168`）。
- **counts 同源** = host `backgroundStatus`（`thincoder-vscode/src/extension/suspension.mjs:109-122`）形 `{ running, queued, pending, done }`——随 susp 广播 / 重发携带（挂起驱动轮末 + settle 触发点 + `webviewReady` 重推）⇒ webview `S._suspCounts` 恒 = host 实际（不陈旧）。
- **时序**：状态广播先于同批 `loading:false`（digest / 回合尾）——Stop 派生无闪烁窗口。
- **`S._suspended` 语义不变**：仍由 `suspension` 消息（active / freeze）驱动（会话级语义——digest 执行中 state 为 running 时不得翻 false）；`S._turnState` 是独立的忙态阶段镜像。
- **`#status-line` 单 writer = `renderStatusBar`**（`thincoder-vscode/webview/status-bar.js:13`）：thinking 态 = `S._phase === "thinking"` 标记（`loading` 消息经 `setLoading` 置位 / 清除）——`loading` 消息不再 innerHTML 覆写状态行（修「徽标被每 digest 的 thinking 重画清掉」）。
- **Stop 可见性 = `S._turnState === "running"` 派生**（`thincoder-vscode/webview/loading.js:57`）：running（回合 / 标题窗口 / 会话内 digest 起跑 / Reload 冷启重推）常显；**susp（纯后台池跑——主空闲）不显**（无全停按钮——池空自然消化完）；`loading:true/false` 不再隐 / 显 abort。Stop 作用 = 只停主会话当前 controller（不再全链中止挂起会话）——子代理停止靠区内逐块 ⏹（`cancelSubagent` 定向 abort）。
- **忙态派生消费者（2026-09-18 批扩面）**：模型 / 推理按钮的忙态门（禁用派生 · 两处入口守卫 · 与 D-P9 的分工）单源 = `WEBVIEW.md` §4.2——本档不复述（D2）。

### 4.5 会话打开单向 boot（权威锚）

- **`resolveWebviewView` 只起慢段**（`status()` = migrate / fullStatus / mcpStatus / 模型偏好 / 索引探测——与 webview 加载重叠并行）；resolve **绝不发会话内容、绝不绑槽**（内容双发 / 槽重绑红线）。
- **`webviewReady` = 会话内容唯一发射点**（快段 `openSessionContent`——`thincoder-vscode/src/extension/panel-session.mjs:301`）：
  握手后才允许 run——`resumeSlot` 绑槽 → `pushProject` → `loadSession` 全量（内部序 autoApprove → planMode →
  `clearMessages` → `historyPage` → sessions——见 `panel-session.mjs:133-166`）。槽绑定时机 = resolve → webviewReady 顺延（webviewReady 前无 slot 读者）。
- **单向 boot 顺序**：`clearMessages` 先于 `historyPage`（先清后灌——一次内容整体落定，无「波浪式」增量）；`older=false` 末页（懒历史首屏——scroll-back 页仍走 `loadOlder`）。
- **sessions 恰一次**：快段内无独立 pushSessions——`loadSession` 尾单发（同 tick 合并双发）；异步第三发（慢段 fullStatus 回调）保留**不同 tick**（跨 tick 允许）。
- **任务可见性族的就绪两拍**排在 `openSessionContent` **之后**（flush → 再断言——见 `WEBVIEW.md` §5.3）。

### 4.6 权限卡族 id 纪律（逐项 / 合并 · 单一释放通道）

- **族键 = `promptId`**：逐项卡（`permissionRequest`）与合并卡（`batchPermissionRequest`）**共用同一单调计数器**（`permission-gate.mjs` 的 `panel._permissionSeq`）——id 跨族唯一（同一移除选择器不误删）。
- **单一释放通道 = `releasePermission(panel, entry, verdict, queue)`**：出队 + resolve + `permissionWithdrawn` 三步同点；合并卡走 `_batchPermissionQueue`（**队列分立**——判定值域不同：逐项 boolean / 合并字符串；否决并队——`panel-messages.mjs` 的 approve-all 连带循环会以 boolean 释放合并条目）。
- **三路释放对合并卡同源**：轮级 Stop / Ctrl+I（`panel._abortController` abort）⇒ deny 释放 + 卡移除（一次机制覆盖两入口）；child 定向取消 / approve-all 连带两路仅及逐项族（合并卡恒 depth-0——§18 C-1/Q1）。
- **响应 = id 精确匹配（非 `shift`）**：`batchPermissionResponse { choice, promptId }` 按 id 查 `_batchPermissionQueue`；无 `promptId`（旧 webview）→ 回退队头（向后兼容）；未知 id ⇒ 零命中（不误 resolve 队头）。
- **孤儿响应零静默无效**：队列无命中条目 ⇒ host 回 `permissionWithdrawn { promptId }`（可见处置——卡由既有消费者移除）；不 resolve 任何条目、不新造条目（幂等）。
- **释放即刷新（状态栏）**：`releasePermission` 三步（出队 + resolve + `permissionWithdrawn`）之后**同点**调 `panel._refreshStatus?.()`——轮级 Stop / Ctrl+I 释放合并卡、approve-all 连带、孤儿处置同源同刷（零散点；判据 = §4.4）；no-op 释放（重复释放 / 条目不在队）不改队列 ⇒ 零刷新（幂等）。
- 卡形态（类名 / 选择器 / 移除外形）= `WEBVIEW.md` §4.1（本档不复述）。

## 5. digest 轮可见面与 turn-cap

**契约**（元素级落点 = `thincoder-vscode/webview/chat.js:387-410`（`showDigestStatus`））：

- **载荷** = `{ status:"start"/"end"/"cap", n, ok?, ms?, mode?, turns?, tier?, from?, msg? }`；`tier` ∈ `ask` / `digest`（按因两档）；`from` / `msg` 仅 ask 档携带（档位判据 / 零影响证据 / 边界 = `WEBVIEW.md` §5.1「消化轮起跑档位」——本档只记元素级契约）。
- `digest start` → ① 追加 `.digest-turn` 标签行——按 `tier` 取键：`ask` ⇒ `digest.turnLabelAsk`（携参 `{ from, msg }`）/ **其余（含 `tier` 缺省——旧载荷）** ⇒ `digest.turnLabel`；
  ② **`n > 0`** ⇒ 追加**本轮独立** `.digest-status` 计数元素（`id="digest-status"` 退役；`dataset.n` = 起跑数）——**两档同规**；`n = 0`（ask-only 轮）⇒ 零计数元素（`_digestRoundEl` 置空）；③ 记本轮边界 `S._digestBoundary = 标签行`（归档落点）；
  ④ `ctx.assistantLabeled = false`（本轮 assistant 输出带一次回合标签）。
- `digest end` → **本轮**计数元素原地更新（`digest.done`；`ok:false` ⇒ `digest.aborted`——异常不留「仍在消化」假象；计数取元素自带起跑数）；
  **本轮无计数元素（ask-only 轮 · `n = 0`）⇒ 零动作**（禁兜底建元素——`dataset.n = "?"` 幻影行禁出）。
- `digest cap` → `.digest-cap` 行（`mode:"auto"` dim / `mode:"stop"` warn）。

- 实现落点：`thincoder-vscode/webview/chat.js:387-410`（`showDigestStatus`）· 样式 `thincoder-vscode/webview/base.css`（`.digest-status` 族沿用 + `.digest-turn` / `.digest-cap`）。
- 跨轮 = **新元素随流追加**（漂移消除）——`start` 连发亦各成独立元素（非 ask 轮的 `end` 更新其前最近未结的本轮元素）。
- 投递 = **直投**（不走 outbox——digest 只在面板活跃且 webview 已就绪后发生；outbox 语义 = 出生事件族）。
- host 发射点：`thincoder-vscode/src/extension/suspension.mjs:324`（起跑——`tier` 判据同点 `:322`）· `:336`（收尾）· `thincoder-vscode/src/extension/panel-callbacks.mjs:84`（cap 两档）。

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
| context | `context X% Yk` | `context X%`（`status-bar.js:34-40`；≥80% 警告色） | 端差登记（绝对数不做——本端 pct 源 = 核 `estimateTokens(history)` 分子 ÷ `providerSpec(provider).context`，**与 CLI 状态行同源同式**；派生单点 = `thincoder-vscode/src/specs.mjs` `ctxPercentForHistory`——详 `WEBVIEW.md` §4.6） |
| 滚动 | `scrolled N` | 悬浮回底钮（`thincoder-vscode/webview/scroll.js:29-34`） | 端差登记（钮为可点击超集；N 需新造单位） |
| 输入提示 / 键位串 | enterHint + 键位串 | 无（按钮 / 占位符承载） | 端差登记 |
| 横幅 | PLAN / AUTO / ADVISOR / ENG + attention chip | 工具条按钮 active + plan 徽标（`:23`） | 端差登记（attention chip 不做——权限 / 提问卡流内可见） |
| 后台段 | `后台 N 子代理运行中 · M 完成待消化` | `⏳ …`（`:51-60`——running+queued / pending+done 两段） | 等价 |

### 6.2 块头字段对位（本端 × CLI）

| 字段 | CLI 形态 | 本端现状 | 结论 |
|---|---|---|---|
| icon | `⏸ / ⏹ / ✓ / ▶`（审批 / 停 / 完成 / 运行——冻结头三态互斥见 `TUI.md` §6.8 / M5） | `⏳ / ▶ / ✓ / ⏹ / ⏸`（排队 / 运行 / 完成 / 停 / 审批） | 端差登记（语义对位——本端 ⏳ 排队图标为 CLI 所无） |
| 键 | `role#N` | 同（label） | 等价 |
| 模式词 | ` · sync/async` | ` · 同步/异步`（family 角色；queued 不携） | 等价（queued 信息走状态区） |
| 状态词·queued | ` · queued` / ` · waiting`（`thincoder-cli/src/tui/subagent-panel.mjs:73` 判定 · `:75` 落地） | ` · ${t("sub.queued")}` / ` · ${t("sub.waiting")}`（en = `queued` / `waiting` 逐字；zh = `排队中` / `等待中`）——选用判据 = 载荷 `kind`：`slot` ⇒ queued、其余（含缺省）⇒ waiting（`WEBVIEW.md` §5.2） | 对齐（C-11② · #118 落） |
| 模型 | ` · model`（宽截断） | ` · model`（**来源 = 事件载荷字段** `model`；键形 `sub:<role>#<id>` **不含模型段**——`WEBVIEW.md` §5.3 键形收正；consult / escalate 头词现状不携该段——`activity-view.js:69`） | 端差登记（consult / escalate 模型段） |
| 计时 | ` · Ns`（done 定格） | ` · Ns`（事件驱动 + 2 s 同点刷——`panels.js:69-72` → `activity.js:403` `refreshLiveHeaders`） | 语义不变 |
| turn | ` · turn N/M` | ` · turn N/M`（`maxTurns > 0` 且 `turn > 0`；快照 + `status:"turn"` 实时） | 对齐 |
| 状态区·running | `currentTool` + `command≤60`（`thincoder-cli/src/tui/subagent-panel.mjs:105-110`） | `${tool} — ${cmd ≤60}`（嵌套 = `label/tool`——`thincoder-cli/src/tui/subagent-blocks.mjs:337` 同构）/ `思考中…` | 对齐（C-11①；**输出面零写入**——判据单源 = `WEBVIEW.md` §5.2） |
| 状态区·queued | `queued · position N（槽满等位）` / 依赖 detail 原文 | `排队中 · 位置 N（槽满等位）` / 原因原文 | 对齐（C-11②） |
| 审批态 | `等待审批: X` | `⏸` + `等待审批: <tool>`（`activity-view.js:55` · `:90`） | **已实装**——两端同形 |
| 待消化 | `done · awaiting digestion`（状态区） | 块头态词同文案（`activity-view.js:91`） | 对齐 |
| 冻结头 + tail-3 | `[✓ key · … · done Ns · turn]` + tail-3（`│ ` 前缀独立行——`render-segments.mjs:103-109`）+ 注记 ` — <note>`（停因 / interrupted——`:88-93`） | `[✓ key · … · done Ns · turn]` + tail-3（`│ ` 前缀——`activity-view.js` `refreshBlock`；容器 = `<details>/<summary>` 原生）+ 注记 ` — <note>`（载体 `meta.note`——契约 = `WEBVIEW.md` §5.2；`tailLines` = `activity-view.js:102`） | 对齐（D4 消：tail-3 行文归一 = `│ ` 前缀独立行） |

### 6.3 i18n 键表（21 键 · zh/en 逐字）

> 键面 = **webview 可渲染键**（消费位见各注）；文案实体 = **核容器** `thincoder-core/i18n.mjs`（投影面）+ **本地档** `thincoder-vscode/locales/{zh,en}.json`（端特有键）——本地档同值副本的冻结面见 `thincoder-vscode/src/i18n.mjs:18-20`（本表只作对照，不复制为第二单源）。
> **收录口径（2026-09-20 补 · 库存清账批）**：本表 = **对位冻结面**（收录与 CLI 逐字对位 / 端差登记所需的键）——**非 locales 全量**；全量实体 = `thincoder-vscode/locales/{en,zh}.json` + 核容器 `thincoder-core/i18n.mjs`；**新增对位键须同轮登记本表**（登记义务 = 承 **D3** 计数·枚举纪律，本表为其落点——非本表新立；防「新键落表滞后」型缺口）。

| 键 | zh | en |
|---|---|---|
| `digest.turnLabel` | 自动回合：消化已完成的子代理报告… | [auto-turn: digesting finished subagent reports…] |
| `digest.turnLabelAsk` | 自动回合：答复 ${from}：${msg} | [auto-turn: answering ${from}: ${msg}] |
| `digest.capAuto` | 自动回合：越过轮次上限，继续推进… | [auto-turn: continuing past turn cap…] |
| `digest.capStop` | 自动回合在 ${turns} 轮处停止——部分消化；已完成的报告保留在历史中 | [auto-turn stopped at ${turns} turns — partial digest; finished reports stay in history] |
| `sub.awaitingDigest` | 已完成 · 等待消化 | done · awaiting digestion |
| `sub.queueSlot` | 排队中 · 位置 ${n}（槽满等位） | queued · position ${n} (slot full) |
| `sub.waiting` | 等待中 | waiting |
| `status.turn` | 轮次 ${n}/${m} | turn ${n}/${m} |
| `status.rateWait` | TPM 限流等待 ~${s}s | TPM throttle wait ~${s}s |
| `status.rateLimited` | 限流 429，${s}s 后重试 | Rate-limited 429, retry in ${s}s |
| `status.overloaded` | 服务过载，${s}s 后重试 | Server overloaded, retrying in ${s}s |
| `status.quota` | 配额耗尽：${msg} | quota exhausted: ${msg} |
| `status.indexScan` | 索引：扫描 ${n} 文件… | Indexing: scanning ${n} files… |
| `status.indexProgress` | 索引：${done}/${total}… | Indexing: ${done}/${total}… |
| `sub.newBlocks` | ↓ ${n} 新块 | ↓ ${n} new block(s) |
| `tool.interrupted` | 已中断 | interrupted |
| `tool.truncated` | …（已截断于 64K——完整文本在历史中） | … (truncated at 64K — full text in history) |
| `workspace.required` | 请先打开文件夹——ThinCoder 需要一个工作区才能开工。 | Open a folder first — ThinCoder needs a workspace to work in. |
| `workspace.requiredPlaceholder` | 请先打开文件夹… | Open a folder to start… |
| `input.slotFull` | 主会话处理中——排队已满 8 条消息，请等其处理完成后再发送 | Task running — the queue is full (8 messages); wait for them to be processed before submitting again. |
| `queued.pending` | 待发送 · 不打断当前执行，自动发送 | Queued — sent automatically, no interruption |

- **占位符记法**：本端引擎只认 `${k}` 形态（`thincoder-vscode/webview/i18n.js:30`）——照抄 `{n}` 会把字面占位符显示给用户。
- `sub.newBlocks`（2026-09-19 追加——出生可见性计数钮，机制单源 = `WEBVIEW.md` §5.5）：键名 / 双语逐字 / 占位符形态（`${n}`）三面以本表为单源；`${n}` = 未钉底期间出生块数。
- `sub.waiting`（2026-09-20 追加——#118 queued 状态词对位，机制单源 = `WEBVIEW.md` §5.2）：zh `等待中` / en `waiting`——与既有键 `sub.queued`（zh `排队中` / en `queued`）成对，两键**无占位符**。
  **消费点 = 状态词**（块头方括号内——`activity-view.js:47`）：选用判据 = 载荷 `kind`——`kind === "slot"` → `sub.queued`；否则（**含 `kind` 缺省**）→ `sub.waiting`（CLI `thincoder-cli/src/tui/subagent-panel.mjs:73` 同判据）。
- **状态区（方括号后）键面**（`activity-view.js:89-99`；标尺 = CLI `thincoder-cli/src/tui/subagent-panel.mjs:100-102`）：slot（`kind === "slot"`）→ `sub.queueSlot`；wait / depc → 载荷 `reason` 原文（零改写，无键）；**降级**（`kind` 缺省）→ 有 `reason` 走原文、无 `reason` 中性回落 `sub.queued`（= CLI `queued.detail || "queued"` 同形）。（#118 落）
- `digest.turnLabel`（digest 档 / 缺省档）/ `digest.turnLabelAsk`（ask 档——**携参**） = **核容器键**（本地档不重复定义）；字面单源 = 核容器（CLI 同读容器——零自持字面）；`msg` 截断口径 = 核 `upstreamAskLabelVars`（单行 + ≤120 字符）；`digest.start/done/aborted` 与其余既有键不动；消费面 = 本档 §5 / `WEBVIEW.md` §5.1。
- `tool.interrupted` / `tool.truncated`（同批批 1 落）= **端特有键**（住 `thincoder-vscode/locales/{zh,en}.json`——不进核容器）；消费面 = `WEBVIEW.md` §4.5（M1 清扫状态词 / X5 截断标记）。
- `workspace.required` / `workspace.requiredPlaceholder`（2026-09-21 无工作区守卫批）= **端特有键**（住 `thincoder-vscode/locales/{zh,en}.json`——不进核容器；无工作区守卫为端面机制，CLI 无对位面）。
  消费面 = `webview/send.js` 出口守卫（拒发 toast）/ `webview/loading.js` `applyBusyLock` 第三态占位符（守卫 > busy > 常态）；机制单源 = `PROJECT-SWITCHER.md` §4.1；登记依据 = 加键批同轮登记（D3）。
- `input.slotFull`（2026-09-22 busy-injection 批 · 实施悬空裁定轮）= **端特有键**（住 `thincoder-vscode/locales/{zh,en}.json`——不进核容器；CLI 同判据提示为端内字面 `thincoder-cli/src/tui/key-handler.mjs:307`——本键 = 端面成文）。
   消费面 = `webview/send.js` 二次提交守卫 toast（判据 = `WEBVIEW-INPUT.md` §1 C-B2-6 ①）；登记依据 = 加键批同轮登记（D3）。
- `queued.pending`（2026-09-24 queue-visible 批）= **端特有键**（住 `thincoder-vscode/locales/{zh,en}.json`——不进核容器；无占位符）。
   消费面 = 「待发送」气泡标签行（`WEBVIEW-INPUT.md` §1 C-B2-6 ⑦——锚定三支 / 消费即清）；登记依据 = 加键批同轮登记（D3）。
- `status.indexProgress`（W8 索引面归一新键——住本地档）+ 其 sibling `status.indexScan`：消费 = `thincoder-vscode/webview/status-bar.js:97-99`（`statusText` `kind:"index"` 两相位）。
- 审批态键 = `sub.awaitingApproval`（`等待审批: ${tool}` / `Awaiting approval: ${tool}`）——**已实装**（见 §6.2）；消费 = `activity-view.js:90`。

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
| D-P11 | 协议增量 = **只增不改**、**十七项**登记（§3.2） | 否决 host 直发成品文本 · 否决新增 `turnStart` 族 |
| D-P12 | 合并权限卡**并入 `promptId` 族**（单一释放通道 `releasePermission` + id 精确匹配 + 孤儿回写） | 否决单开释放语义（同语义两通道 · 消费者按类分支）；`shift()` 队列头匹配已驳（D-P4 同据——陈旧卡不误 resolve） |
| D-P13 | `waiting` 判据含**批权限队列** + **释放即刷**（刷新点 = 释放通道单点 `releasePermission`） | 否决逐路径各补 `_refreshStatus()`（散点——漏一处即残留）· 否决判据只列权限 / question（批卡停驻期读作 idle——状态栏失去「需你输入」语义） |
| D-P14 | 诊断上行 `panelDiag` = **新消息（行 8 登记）**——出生 / 终态事件面痕迹入主侧日志 | 否决只留 webview 环形日志（DevTools 不可回读——本次事故正因不可回读而盲；理由详见 `WEBVIEW.md` D-W22）· 否决并入既有上行消息字段（无同缝——`webviewReady` 是一次性启动拍） |

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
| U-P7 | 合并卡释放形态 = **卡消失**（同移除选择器；不做「已拒绝态」变体） | 已定（§4.6 · `WEBVIEW.md` §4.1） |
| U-P8 | VS Code 状态栏 `waiting` 覆盖**批权限卡**：停驻必读 waiting · 释放即刷（不残留） | 已定（§4.4 · §4.6 · D-P13） |

## 11. 验收与需求回指

| # | 本档覆盖 | 回指 |
|---|---|---|
| 1 | 消息族与演进纪律（基础族 / 机制族 / 三落点 / 只增不改 · **登记表**） | F-W1 · F-W7 · **NFR-A2**（诊断上行 `panelDiag`——§3.2 行 8） |
| 2 | 忙态与消化轮可见指示（`turnState` 收敛 · digest 轮 · cap 行） | F-W7 · N-W1 |
| 3 | 状态行段位与块头字段对位（含端差登记） | F-W7 · N-W6 |
| 4 | 会话标题与消息秩序（promptId / seq / 单向 boot） | F-W2 · F-W3 |
| 5 | 机检面（新增档 ≤500 行 · 无 >300 字符单行 · 文档锚零悬空） | N-M3 · N-M2 |
| 6 | 收发面全量对表（§12——机检对账 `thincoder-vscode/test/protocol-coverage.test.mjs`） | N-W7 |
| 7 | 发面全量对表（§13——机检对账 `thincoder-vscode/test/protocol-coverage-reverse.test.mjs`） | F-W12 · N-W7 |
| 8 | 权限卡族 id 纪律与释放（合并卡同族 · 单释放通道 · 孤儿响应 · **释放即刷新**） | F-W13 |

**用例面**：协议面测试资产在 `thincoder-vscode/test/`（`webview-turnstate` · `status-line` · `digest-visibility` · `chat-panel` · `chat-panel-messages` · `session-boot`）——用例表归测试层，本档不复制（D2）。

## 12. 收发面全量对表（机检对账）

> 判据权威 = `VSC-DEBT.md` §2.3（机检形态）/ §3.2（枚举口径 + 处置判定）；枚举口径（KD-3）= **只取顶级判别式**——host 侧 = `postMessage` 载荷顶级 `type` / `name`；webview 侧 = 顶级 `switch (msg.type)` 的 `case` ∪ 顶级 `name` 比较字面量。
> 子判别式不单列（`statusText.kind` / `subagent.status` / `compress` 状态族 / `digest` 两型——各为所属消息的载荷变体）；方向 = **host → webview**（webview → host 的发面 = **§13**；两表合称「收发面对表」）。
> **坐标 as-of = 2026-09-22 structure-debt 批（#163 `chat.js` 拆分实施轮）**：② ③ 列逐行按 `node test/protocol-coverage.test.mjs --emit` 读数重出（提取器为唯一权威；多处标注「（共 N 处）」= 提取器 cap 3）。本表坐标 = **唯一读值**；历轮坐标收正的时点值住各批档（记录面），本档不复载。
> 机检对账 = `thincoder-vscode/test/protocol-coverage.test.mjs`（本表）+ `thincoder-vscode/test/protocol-coverage-reverse.test.mjs`（发面表 = §13）——首列 ↔ 源码提取集双向对账 + ④ 处置闭区间（`npm test` 逐跑）。

| ① 判别式 | ② host 发射点 | ③ webview 消费位 | ④ 处置 | ⑤ 备注 |
|---|---|---|---|---|
| `aborted` | src/extension/panel-turn-loop.mjs:150/:165 | webview/chat-messages.js:102 | `活` | — |
| `agentSettings` | src/extension/chat-panel.mjs:391/:398/src/extension/panel-messages.mjs:291 | webview/chat-messages.js:149 | `活` | 打开拍回批末位（F-W8——机制与判据单源 = `SETTINGS.md` §2.8） |
| `atResults` | src/extension/panel-index.mjs:80/:84 | webview/chat-messages.js:204 | `活` | — |
| `autoApprove` | src/extension/panel-messages-turn.mjs:194/src/extension/panel-session.mjs:136 | webview/chat-messages.js:148 | `活` | — |
| `busyQueued` | src/extension/panel-messages.mjs:103 | webview/chat-messages.js:100 | `活` | busy 排队队列快照（判据 = 两载体合计条数；host → webview 状态镜像——满队守卫 + 待发送气泡；**载荷增 `count` / `items` / `text` / `merged`**（§3.2 行 17）；消费点五（含步边界 pickup）；登记 = §3.2 行 17） |
| `batchPermissionRequest` | src/extension/permission-gate.mjs:109 | webview/chat-messages.js:201 | `活` | 载荷增 `promptId`（§4.6） |
| `clearMessages` | src/extension/panel-session.mjs:142 | webview/chat-messages.js:114 | `活` | — |
| `complete` | src/extension/panel-callbacks.mjs:228 | webview/chat-messages.js:101 | `活` | — |
| `compress` | src/extension/panel-callbacks.mjs:175/:176/:183 | webview/chat-messages.js:179 | `活` | — |
| `digest` | src/extension/panel-callbacks.mjs:84/thincoder-vscode/src/extension/suspension.mjs:330/:342 | webview/chat-messages.js:182 | `活` | `status` 两型 = 一条消息（over-count #3 已证伪）；载荷增 `tier`（两档——§5 / §3.2 行 11）+ `from` / `msg`（ask 档携参——§3.2 行 14） |
| `error` | src/extension/chat-panel.mjs:472/src/extension/panel-turn-loop.mjs:174/src/extension/panel-turn-stages.mjs:76（共 5 处） | webview/chat-messages.js:103 | `活` | — |
| `goal` | src/extension/panel-callbacks.mjs:184 | webview/chat-messages.js:223 | `活` | — |
| `historyPage` | src/extension/panel-session.mjs:190 | webview/chat-messages.js:124 | `活` | — |
| `i18n` | src/extension/chat-panel.mjs:184/src/extension/panel-messages.mjs:290 | webview/chat-messages.js:49 | `活` | — |
| `indexStatus` | src/extension/panel-index.mjs:55 | webview/chat-messages.js:213 | `活` | 打开拍回批（`_pushIndexStatus`——F-W8） |
| `ledgerNotice` | thincoder-vscode/src/extension/ledger-surface.mjs:77 | webview/chat-messages.js:128 | `活` | — |
| `loading` | src/extension/chat-panel.mjs:473/src/extension/panel-chat.mjs:215/src/extension/panel-turn-stages.mjs:153 | webview/chat-messages.js:92 | `活` | — |
| `mcpStatus` | src/extension/panel-mcp.mjs:121 | webview/chat-messages.js:207 | `活` | — |
| `mcpTestResult` | src/extension/panel-mcp.mjs:157 | webview/chat-messages.js:212 | `活` | — |
| `mcpTools` | src/extension/panel-messages-settings.mjs:136/:138 | webview/chat-messages.js:211 | `活` | — |
| `models` | src/extension/panel-session.mjs:159/src/extension/settings.mjs:401 | webview/chat-messages.js:135 | `活` | — |
| `permissionRequest` | src/extension/permission-gate.mjs:68 | webview/chat-messages.js:187 | `活` | — |
| `permissionWithdrawn` | src/extension/panel-messages-turn.mjs:210/src/extension/permission-gate.mjs:41 | webview/chat-messages.js:194 | `活` | 第二发射点 = 孤儿响应回写（`batchPermissionResponse` 零命中 ⇒ 可见处置——§4.6） |
| `planMode` | src/extension/chat-panel.mjs:357/:363/src/extension/panel-callbacks.mjs:158（共 4 处） | webview/chat-messages.js:218 | `活` | — |
| `project` | src/extension/panel-project.mjs:27 | webview/chat-messages.js:134 | `活` | — |
| `providerError` | src/extension/panel-mcp.mjs:129/:140/:151（共 7 处） | webview/chat-messages.js:145 | `活` | — |
| `providerStatus` | thincoder-vscode/src/extension/settings.mjs:358 | webview/chat-messages.js:136 | `活` | — |
| `proxySettings` | src/extension/chat-panel.mjs:388/:399 | webview/chat-messages.js:159 | `活` | 打开拍回批（F-W8） |
| `proxyTestResult` | src/extension/panel-messages-settings.mjs:207 | webview/chat-messages.js:162 | `活` | — |
| `question` | src/extension/panel-callbacks.mjs:55 | webview/chat-messages.js:165 | `活` | — |
| `questionCancelled` | src/extension/panel-callbacks.mjs:62 | webview/chat-messages.js:168 | `活` | — |
| `reasoning` | src/extension/panel-callbacks.mjs:145 | webview/chat-messages.js:52 | `活` | — |
| `sessions` | src/extension/panel-session.mjs:249 | webview/chat-messages.js:129 | `活` | — |
| `shellCandidates` | src/extension/chat-panel.mjs:390/:401/src/extension/panel-messages-settings.mjs:190 | webview/chat-messages.js:156 | `活` | 打开拍回批（F-W8）；另有 `getShellCandidates` 拉取路径 |
| `statusText` | src/extension/panel-callbacks.mjs:169/src/extension/panel-index.mjs:29 | webview/chat-messages.js:185 | `活` | `kind` 族 = 载荷变体（不单列——over-count #1 已证伪） |
| `sub:*` | src/extension/panel-subagent-relay.mjs:187/:235/:98 | webview/chat-messages.js:230 | `活` | 动态段归一（`sub:<role>#<id>` → `sub:*`）；role 段 = **键文法 `[\w-]+`**（含 consult / escalate——键形收正见 `WEBVIEW.md` §5.3）；`webview/activity-view.js:14` 的 `FAMILY_ROLES` 只判 ⏹ 可见性 / sync-async 词，**非**键枚举 |
| `subagent` | src/extension/panel-subagent-relay.mjs:217/:253/src/extension/suspension.mjs:108 | webview/chat-messages.js:219 | `活` | `status` 族 = 载荷变体（不单列——over-count #2 已证伪）；载荷增 `note`（X6 停因注记）/ `syncLive`（X10 可中止事实——§3.2 行 12） |
| `subagentApproval` | src/extension/panel-subagent-relay.mjs:217/:253 | webview/chat-messages.js:222 | `活` | — |
| `suspension` | src/extension/panel-messages.mjs:297/thincoder-vscode/src/extension/suspension.mjs:427/:438 | webview/chat-messages.js:224 | `活` | 载荷增 `interrupted`（X11 会话中止注记——§3.2 行 13） |
| `taskProgress` | src/extension/panel-callbacks.mjs:156 | webview/chat-messages.js:217 | `活` | — |
| `testProviderResult` | src/extension/panel-messages-settings.mjs:117 | webview/chat-messages.js:153 | `活` | — |
| `token` | src/extension/panel-callbacks.mjs:141 | webview/chat-messages.js:51 | `活` | — |
| `toolCall` | src/extension/panel-callbacks.mjs:199 | webview/chat-messages.js:58 | `活` | 载荷增 `round` · `model`（X2——advisor 专属，非 advisor 零字段——§3.2 行 9） |
| `toolOutput` | src/extension/panel-callbacks.mjs:222 | webview/chat-messages.js:68 | `活` | `text` 端边界归一为串（M3——非串取 `.text`）；`kind` 可选随行 |
| `toolPanel` | src/extension/panel-subagent-relay.mjs:217/:253 | webview/chat-messages.js:225 | `活` | — |
| `toolResult` | src/extension/panel-callbacks.mjs:213 | webview/chat-messages.js:67 | `活` | 载荷增 `truncated`（X5——64K 切片点事实旗标——§3.2 行 10） |
| `turnBreak` | src/extension/panel-callbacks.mjs:151 | webview/chat-messages.js:53 | `活` | — |
| `turnFrame` | src/extension/panel-callbacks.mjs:170 | webview/chat-messages.js:186 | `活` | — |
| `turnState` | src/extension/chat-panel.mjs:247/src/extension/panel-messages.mjs:289 | webview/chat-messages.js:94 | `活` | — |
| `usage` | src/extension/panel-callbacks.mjs:193 | webview/chat-messages.js:216 | `活` | — |
| `userMessage` | src/extension/chat-panel.mjs:272 | webview/chat-messages.js:50 | `活` | — |
| `websearchSettings` | src/extension/chat-panel.mjs:389/:400 | webview/chat-messages.js:150 | `活` | 打开拍回批（F-W8） |
| `workspaceGuard` | src/extension/workspace-guard.mjs:38 | webview/chat-messages.js:97 | `活` | 无工作区守卫态（拒启 + 提示；判据 / 守卫面 / 提示面 = `PROJECT-SWITCHER.md` §4.1——本行 as-of 2026-09-21 实现轮） |

**方向口径**：上表只收 host → webview（webview → host 的 `postMessage` 不列——发面表 = §13）。**「删」= 消费位在位而发射恒无（死码）**——本批已落地（advisor 回显族 + `assistantMessage` + `toolHistory`；
被删标识符零悬空，读数入 `docs/batches/2026-09-16-vsc-debt.md` §5）。**「补」行 = 本表现零行**：原 `mcpReconnected` 行随其发射点删除一并退场（2026-09-18 VSC 配置页接线修复批——无消费者推送处置 = 删；
重连的用户可见效果由同函数 `pushMcpStatus` 覆盖，原悬空指针随之消失）。

**打开拍回批（F-W8）**：`getAgentSettings` 回批按 `indexStatus → providerStatus · proxySettings · websearchSettings · shellCandidates → agentSettings（末位）` 序推——机制与判据单源 = `SETTINGS.md` §2.8（本表只记 ② 列发射点；协议形态零增）。

## 13. 发面全量对表（webview → host · 机检对账）

> 判据权威 = `VSC-DEBT.md` §2.3（机检形态）/ §3.2（枚举口径 + 处置判定）；枚举口径 = **只取顶级判别式**——webview 侧 = `postMessage` 载荷顶级 `type` 字面量；host 侧 = 分发档（`panel-messages*.mjs`）顶级 `case` 标签。
> 方向 = **webview → host**（§12 = 收面；两表合称「收发面对表」）；子判别式不单列。
> **坐标 as-of = 2026-09-22 structure-debt 批（#163 `chat.js` 拆分实施轮）**：② ③ 列逐行按 `node test/protocol-coverage-reverse.test.mjs --emit` 读数重出（提取器为唯一权威）。本表坐标 = **唯一读值**；历轮坐标收正的时点值住各批档（记录面），本档不复载。
> 机检 = `thincoder-vscode/test/protocol-coverage-reverse.test.mjs`（首列 ↔ 提取集双向对账 + ④ 处置闭区间 + 错误路径点名）。
> 形态登记（fail-closed——不静默漏计数）：载荷字面量四形态 = 对象字面量（多数）· 三元双分支（`editMcp` / `saveMcpServer`）· 局部对象绑定（`question.js` 的 `payload`）· 局部箭头函数返回字面量（`permission.js` 的 `reply`）；未登记形态 ⇒ 提取器点名失败。

| ① 判别式 | ② webview 发射点 | ③ host 消费位 | ④ 处置 | ⑤ 备注 |
|---|---|---|---|---|
| `abort` | webview/chat.js:48/webview/input.js:58 | src/extension/panel-messages.mjs:243 | `活` | — |
| `addProvider` | webview/model-picker.js:24/webview/onboarding.js:65/webview/settings-providers.js:146（共 4 处） | src/extension/panel-messages.mjs:262 | `活` | — |
| `atComplete` | webview/autocomplete.js:33 | src/extension/panel-messages.mjs:251 | `活` | — |
| `batchPermissionResponse` | webview/permission.js:108/:112/:116（`reply` 返回字面量——定义 `:105`） | src/extension/panel-messages.mjs:253 | `活` | 载荷增 `promptId`（三发点同携——§4.6）；形状 = 局部箭头函数 |
| `buildIndex` | webview/settings-tools.js:150 | src/extension/panel-messages.mjs:271 | `活` | — |
| `cancelSubagent` | webview/chat.js:92 | src/extension/panel-messages.mjs:244 | `活` | 路由含 **sync 分支**（`src/extension/panel-messages-turn.mjs` `handleCancelSubagent`——X10；池条目优先） |
| `deleteEmbedKey` | webview/settings-tools.js:28 | src/extension/panel-messages.mjs:267 | `活` | — |
| `deleteMcpServer` | webview/settings-tools.js:196 | src/extension/panel-messages.mjs:258 | `活` | — |
| `deleteProviderKey` | webview/settings-providers.js:57 | src/extension/panel-messages.mjs:256 | `活` | — |
| `deleteSession` | webview/session-bar.js:104 | src/extension/panel-messages.mjs:231 | `活` | — |
| `deleteWebsearchKey` | webview/settings-tools.js:46 | src/extension/panel-messages.mjs:269 | `活` | — |
| `editMcp` | webview/settings-tools.js:138 | src/extension/panel-messages.mjs:260 | `活` | 三元双分支（同点 `saveMcpServer`） |
| `getAgentSettings` | webview/settings.js:103 | src/extension/panel-messages.mjs:275 | `活` | 回批 = §12 打开拍（本档 §12 方向口径） |
| `getMcpStatus` | webview/settings-tools.js:162 | src/extension/panel-messages.mjs:272 | `活` | — |
| `getShellCandidates` | webview/settings.js:40 | src/extension/panel-messages.mjs:332 | `活` | — |
| `interrupt` | webview/input.js:46 | src/extension/panel-messages.mjs:245 | `活` | — |
| `loadOlder` | webview/history.js:87 | src/extension/panel-messages.mjs:248 | `活` | — |
| `mcpTools` | webview/settings-tools.js:206 | src/extension/panel-messages.mjs:273 | `活` | — |
| `newSession` | webview/session-bar.js:10 | src/extension/panel-messages.mjs:229 | `活` | — |
| `openDiff` | webview/permission.js:58 | src/extension/panel-messages.mjs:247 | `活` | — |
| `openFile` | webview/chat.js:73 | src/extension/panel-messages.mjs:246 | `活` | — |
| `panelDiag` | webview/activity-diag.js:81 | src/extension/panel-messages.mjs:317 | `活` | §3.2 行 8——诊断上行（`{ kind:"subTrace", entries }`；批内合并——最多一消息 / 批）；主侧 `logEvent("ev:subtrace", …)` 一行 |
| `permissionResponse` | webview/permission.js:63/:67/:71（`reply` 返回字面量——定义 `:60`） | src/extension/panel-messages.mjs:252 | `活` | 形状 = 局部箭头函数 |
| `questionResponse` | webview/question.js:29（`payload` 局部绑定——绑定位 `:27`） | src/extension/panel-messages.mjs:249 | `活` | 形状 = 局部对象绑定 |
| `queuedUserMessage` | webview/send.js:53 | src/extension/panel-messages.mjs:190 | `活` | busy 期排队注入上行（busy 即排队面 = `running`——webview 本地气泡先行 + host 单槽载体两态：`_busyQueued` ∥ `susp.pendingInput`；登记 = §3.2 行 16） |
| `reconnectMcp` | webview/settings-tools.js:227 | src/extension/panel-messages.mjs:259 | `活` | — |
| `removeProvider` | webview/model-picker.js:25/webview/settings-providers.js:68 | src/extension/panel-messages.mjs:263 | `活` | — |
| `renameSession` | webview/session-bar.js:54 | src/extension/panel-messages.mjs:232 | `活` | — |
| `retry` | webview/ui.js:434 | src/extension/panel-messages.mjs:234 | `活` | — |
| `saveAgentSettings` | webview/settings-agent.js:140/webview/settings-providers.js:89 | src/extension/panel-messages.mjs:274 | `活` | — |
| `saveEmbedKey` | webview/settings-tools.js:18 | src/extension/panel-messages.mjs:266 | `活` | — |
| `saveMcpServer` | webview/settings-tools.js:138 | src/extension/panel-messages.mjs:257 | `活` | 三元双分支（同点 `editMcp`） |
| `saveProviderKey` | webview/settings-providers.js:39 | src/extension/panel-messages.mjs:255 | `活` | — |
| `saveProxySettings` | webview/settings-env.js:113 | src/extension/panel-messages.mjs:334 | `活` | 载荷 = 逐字段（`SETTINGS.md` §2.8） |
| `saveShellSettings` | webview/settings-env.js:129/:144 | src/extension/panel-messages.mjs:333 | `活` | F-W11 接线落地（`SETTINGS.md` §2.9）；空值 ⇒ 删键 = 路径册 #2（`System default` 显式项） |
| `saveWebsearchKey` | webview/settings-tools.js:36 | src/extension/panel-messages.mjs:268 | `活` | — |
| `selectModel` | webview/model-picker.js:128/webview/model-picker.js:80 | src/extension/panel-messages.mjs:195 | `活` | 忙态门（F-W14）同点 |
| `selectReasoning` | webview/model-picker.js:129/webview/model-picker.js:64 | src/extension/panel-messages.mjs:222 | `活` | 忙态门（F-W14）同点 |
| `setAdvisorGuard` | webview/mode-buttons.js:37 | src/extension/panel-messages.mjs:329 | `活` | — |
| `setAutoApprove` | webview/mode-buttons.js:100/webview/mode-buttons.js:62 | src/extension/panel-messages.mjs:250 | `活` | — |
| `setEngineeringEnabled` | webview/mode-buttons.js:42 | src/extension/panel-messages.mjs:330 | `活` | — |
| `setKey` | webview/model-picker.js:27 | src/extension/panel-messages.mjs:265 | `活` | — |
| `setPlanMode` | webview/mode-buttons.js:49 | src/extension/panel-messages.mjs:331 | `活` | — |
| `setProject` | webview/session-bar.js:121 | src/extension/panel-messages.mjs:233 | `活` | — |
| `setProviderProxy` | webview/settings-providers.js:62 | src/extension/panel-messages.mjs:264 | `活` | — |
| `switchSession` | webview/session-bar.js:48 | src/extension/panel-messages.mjs:230 | `活` | — |
| `testMcp` | webview/settings-tools.js:222 | src/extension/panel-messages.mjs:261 | `活` | — |
| `testProvider` | webview/settings-providers.js:127 | src/extension/panel-messages.mjs:270 | `活` | — |
| `testProxy` | webview/settings-env.js:99 | src/extension/panel-messages.mjs:335 | `活` | — |
| `userMessage` | webview/send.js:81 | src/extension/panel-messages.mjs:187 | `活` | 双向同判别式（收面回显行 = §12） |
| `webviewReady` | webview/chat.js:147 | src/extension/panel-messages.mjs:276 | `活` | — |

**方向口径**：本表只收 webview → host。**「删」= host 消费位在位而 webview 发射恒无（死 handler）**——处置逐条入批档（`docs/batches/2026-09-18-vsc-settings-wiring.md` §2）并已随实现落地（三删 + 一接线转活——**本表现零 `删` 行**）；**删除落地 ⇒ 源零位 ⇒ 表行同步退场**（不留悬空行——同 §12 口径）。**「补」= 发射在位而 host 缺消费位**（本表现零行）。

## 变更记录

- 2026-09-24（**queue-visible 批 · fix 轮（步边界 pickup）· eng-designer**——承 `docs/batches/2026-09-24-busy-queue-visible.md` §1.11 / §1.12 / §1.13）：§3 `busyQueued` 行与 §3.2 行 17 发射面消费点枚举 **四 → 五**（含步边界 pickup——`WEBVIEW-INPUT.md` §1 C-B2-6 细则②）；
  §4.1 送达 **三支 → 四支**；§6.3 `queued.pending` 值改（面无关形——时机承诺归 CLI 状态栏）；§12 `busyQueued` 行 ⑤ 备注同步。
  **消息名 / 字段集 / 判别式集 / 发射点集零变**（机检 `protocol-coverage{,-reverse}` 零改）。

- 2026-09-24（**queue-visible 批 · 需求裁定升级轮（多槽 + 合并消费）· eng-designer**——承 `docs/batches/2026-09-24-busy-queue-visible.md` §1.10）：§3 `busyQueued` 行与 §3.2 **行 17** 按**队列快照**重写（`{ pending, count?, items?, text?, merged? }`——**计数零变**：原地扩字段）
  + §12 行 ⑤ 同步；§6.3 `input.slotFull` **值改条数阈**（zh / en 逐字——键数不变）。**消息名 / 首列判别式集 / ④ 处置列零变**；§13 零改（信号方向 = host → webview）。
- 2026-09-24（**queue-visible 批 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-24-busy-queue-visible.md` §1）：§3 `busyQueued` 行与 §3.2 **行 17 增字段 `text`**（槽内项原文——`pending:true` 恒携；待发送气泡锚定 / 新建的原文源；**计数零变**——原地扩字段，先例 = 行 3 `face`）
  + §12 `busyQueued` 行 ⑤ 备注同步；§6.3 键表 **20 → 21 键**（增 `queued.pending`——端特有键 + 登记注；D3：计数与列表同改）。
  **消息名 / 首列判别式集 / ④ 处置列零变**（§12 表体只改 ⑤ 备注）；§13 零改（信号方向 = host → webview）。

- 2026-09-22（**structure-debt 批 · 档面车道（#163 尾账）· eng-designer**——承 `docs/batches/2026-09-22-structure-debt.md` §2.4 / §5（实施轮）+ 父侧派单）：
  §12 / §13 两表 **② ③ 列逐行按 `--emit` 现跑读数重出**（as-of = 2026-09-22 structure-debt 批——提取器为唯一权威；**两表行数不变** = 53 / 51）；
  ③ 列 webview 消费位改指拆分后新档 `webview/chat-messages.js`（`chat.js` 移交消息分发循环——D-C1 注册点仍在 `chat.js` 现址）；三处逐行 as-of 尾注（`busyQueued` / `workspaceGuard` / `queuedUserMessage`）随表级 as-of 行收口退场。
  **协议语义 / 消息名 / 载荷字段 / 首列判别式集零变**。

- 2026-09-22（**hygiene-sweep 批 · 文档卫生轮 · eng-designer**——承 `docs/batches/2026-09-22-hygiene-sweep.md` §2）：§12 / §13 两表 ② ③ 列逐行按 `--emit` 读数重出（as-of 2026-09-22——提取器为唯一权威；**两表行数不变** = §12 53 行 / §13 51 行）；§3.1 发射端句去历史措辞（留现体与活对象坐标）。**协议语义 / 消息名 / 载荷字段 / 首列判别式集零变**。


- 2026-09-22（**busy-extend 批 · 设计评审轮 2 修正 + 域外并入** · eng-designer——承 `docs/batches/2026-09-22-busy-extend.md` §3 轮次 2 域外注 + 父侧裁定并入本批）：
  §4.1 两行收正至现行契约（回合执行中消息 → **一律排队受理**：单槽载体两态 + 送达三支在档；回显条 = busy 面回显即排队气泡面）；
  §3.2 行 16 / 行 17 与 §12 `busyQueued` / `queuedUserMessage` 两行同步（排队面 = `running` · `pending` 判据 = 两载体合计）。
  **消息名 / 载荷字段 / 首列判别式集零变**（§3.2 十七项 / §7 D-P11 / §6.3 20 键 / §12 · §13 表体零改——本轮只收正描述句）。

- 2026-09-22（**busy-injection 批 · 实施悬空裁定轮（fix round）· eng-designer**——承 `docs/batches/2026-09-21-busy-injection.md` §5 决策透明表 #5 / #6 + 父侧裁定）：
  §3 增 `busyQueued` 行 + §3.2 **十六 → 十七项**（增行 17 = `busyQueued` 新消息——host → webview 状态镜像；D3：计数与列表同改 · §7 D-P11 同改）+ §12 新增 `busyQueued` 行（② ③ 列 = 计划落点，实施轮 `--emit` 重出）+ §6.3 键表 **19 → 20 键**（增 `input.slotFull`——端特有键 + 登记注）。
  **§4.1 就地收正**（存量失效表达——与 C-B2-6 相抵的两行）：回合执行中消息由「一律拒收」改为**按面分流**（普通回合 busy 面入槽 / 挂起会内 busy 拒收）+ 回显条同改；死坐标 `panel-messages.mjs:66` → `:102`。
  **§13 零改**（新信号方向 = host → webview ⇒ 收面 §12；发面表零行）；**既有消息名 / 载荷字段 / 首列判别式集零变**（既有行零改）。

- 2026-09-22（**busy-injection 批 · 协议登记补落轮 · eng-designer**——承 `docs/batches/2026-09-21-busy-injection.md` §2：§3.2 **十五 → 十六项**（增行 16 = `queuedUserMessage` 新消息——webview → host 输入上行；D3：计数与列表同改 · §7 D-P11 同改）+ §13 **新增 `queuedUserMessage` 行**
  （② `webview/send.js:44` · ③ `src/extension/panel-messages.mjs:174` · ④ `活`——`--emit` 实测，W12-1 双向对账绿）。**消息名 / 载荷字段 / 首列判别式集零变**（新增一行 = 实现落地登记，非协议面新语义）。

- 2026-09-21（**块标题行对齐批 · eng-designer**——承 `docs/batches/2026-09-21-vsc-block-title-align.md` §1）：§6.2「状态区·running」行本端现状改**闭枚举**（结构化工具行（嵌套 = `label/tool`）/ `思考中…`）+ CLI 形态列补 `command≤60` 来源坐标；**输出面不入状态区**（判据单源 = `WEBVIEW.md` §5.2）。**消息名 / 载荷字段 / 首列判别式集零变**。

- 2026-09-21（**块标题行对齐批 · D4 裁定轮 · eng-designer**——承 `docs/batches/2026-09-21-vsc-block-title-align.md` §2.11）：§6.2「冻结头 + tail-3」行收正——本端 tail-3 行文改 **`│ ` 前缀独立行**（`refreshBlock`——与 CLI `render-segments.mjs:103-109` 同形）；
  结论列旧「等价」按端差默认 = 消口径改**「对齐（D4 消）」** + 折叠容器 = `<details>/<summary>` 原生（壳能力面）。**消息名 / 载荷字段 / 首列判别式集零变**。


- 2026-09-21（**批 SUBAGENT-SIGNAL-LINES · 设计轮 · eng-designer**——承 `docs/batches/2026-09-21-subagent-signal-lines.md` §1 · 需求 `docs/core/requirements/AGENT-LOOP.md` §4.12 F-UC8；设计权威 = `docs/core/design/AGENT-LOOP-UPSTREAM.md` §6.27.12.13）：
  ① §3 `digest` 行 + §3.2 **行 11 收正（tier 两档）** + **新增行 14**（`from` / `msg`——ask 携参；登记 **十三项 → 十四项**，D3 计数与列表同改）；
  ② §5 digest 元素级契约收正（载荷 `tier` 两档 + ask 携参取键；**计数元素随 `n > 0`** 两档同规——`n = 0` 零元素 ∧ end 零动作不变）+ 实现落点坐标收正（`chat.js:387-410`）；
  ③ §6.3 键表 **18 → 17 键**（删 `digest.turnLabelAuto`〔AUTO 泛句退场〕+ `digest.turnLabelAsk` 改值携参——`${from}` / `${msg}` 同方言）+ 该两键登记注改写；§13 `digest` 行注同步（`tier` 两档 + 携参两字段）。
  **消息名 / 首列判别式集 / §12 表体零变**（机检 `protocol-coverage{,-reverse}.test.mjs` 双向对账集不动；§13 坐标列随实现轮重出）。

- 2026-09-20（**显示面消差批 · 批 4 收口轮 · eng-designer**——承 `docs/batches/2026-09-20-display-parity-batch.md` §2.11 未落面 ① / §2.10.6 #8 真义务 + §5 批 1 / 批 2 / 批 3 实施记录）：
  ① §5 补 **digest 元素级契约**（载荷含 `tier`；三档取键 `digest.turnLabelAsk` / `digest.turnLabelAuto` / `digest.turnLabel`（缺省档）；**ask 轮零计数元素** ∧ end 零动作——幻影行禁出）；
  ② §6.1 **context 段单口径**（分子 = 核 `estimateTokens(history)`——与 CLI 状态行同源同式；旧「本端 pct 源 = 实 prompt tokens」句随 M2 作废并**删除**）；
  ③ §6.2 块头字段对位随实现面收正（CLI icon 集含 `⏹`〔M5 三态互斥〕· 冻结头 `— <note>` 注记两端同形〔X6 / X11〕· 本端坐标重出）；
  ④ §6.3 键表 **14 → 18 键**：删退役键 `status.indexEmbed`（全仓零定义）+ 补 `status.indexProgress` / `tool.interrupted` / `tool.truncated` / `digest.turnLabelAsk` / `digest.turnLabelAuto`（D3：计数与列表同改）；
  ⑤ §12 / §13 ② ③ 列**全表重出**（逐行 = `node test/protocol-coverage{,-reverse}.test.mjs --emit` 输出——提取器为唯一权威；覆盖本批六处载荷扩字段〔X2 · X5 · M4 · X6 · X10 · X11〕与触碰档行号位移）；两表头注各收敛为一条 as-of 行（前轮坐标注记退场——失效表达不留规范面）；
  ⑥ §3 消息族行补**增字段**注记（`toolCall` / `toolResult` · `digest` · `subagent` · `suspension`——与 §3.2 登记同源）+ §3.2 登记 **八项 → 十三项**（补行 9–13：X2 · X5 · M4 · X6+X10 · X11；D3 计数与列表同改）+ §7 D-P11 计数同改。
  **首列判别式集 / ④ 处置列 / 消息名零变**（机检 `protocol-coverage.test.mjs` / `protocol-coverage-reverse.test.mjs` 双向对账集不动）。

- 2026-09-20（**一致性同步批 · 设计评审修正轮 1 · eng-designer**——评审 id=13 发现 #4）：§6.3 **追加键 `sub.waiting`**（zh `等待中` / en `waiting`——#118 queued 状态词对位；D3：表头计数 13 → 14 与行同改）+ 该键登记注（成对键 / 选用判据 = 载荷 `kind` / 无占位符）。
  落笔因由 = `WEBVIEW.md` §5.2 的 queued 状态词契约（` · queued|waiting`）需有键表落点——**键表 / 双语逐字单源 = 本表**，文案实体仍落 `thincoder-vscode/locales/{zh,en}.json`（本批 R6 落地）。
  **消息名 / 载荷字段 / 首列判别式集零变**（§12 / §13 表体零改——机检双向对账集不动）。

- 2026-09-18（**VSC 配置页接线修复批 · 实现轮** · eng-coder——承 `docs/batches/2026-09-18-vsc-settings-wiring.md` §2；§13 表体随实现同步）：
  §13 删 3 行（`settings` / `saveCustomProvider` / `saveEmbeddingConfig`——死 handler 已删，源零位）+ `saveShellSettings` 转 `活`（F-W11 接线落地，② 列填实现轮实读坐标）；
  §12 `mcpReconnected` 行退场（无消费者推送已删——原「补」行不留悬空）；
  §11 行 7 / §12 头注 / §13 头注去「（拟新增）」标记（机检档已建成并登记 `thincoder-vscode/test/files.mjs`）；§13 头注补②/③ 列 as-of 说明。
  **消息名 / 载荷字段 / 首列判别式集零增**（只减 3 + 转 1——机检 `protocol-coverage-reverse.test.mjs` 双向对账绿）。

- 2026-09-15（**B 式迁移轮 · VSC 第 2 批**）：建档——源档 §4 / §7 / §8 / §14.3 的协议面内容重建入基准层（旧档一字未改）；坐标按 as-of 2026-09-15 实核改写；批次材料（问题陈述 / 选型 / 受影响文件 / 用例表 / 验收标准 / 边界）入 §8.1。
- 2026-09-15：**按现状收正 1 处**——旧档 §14 C-13 表「审批态 = 无此状态（子代理不经权限门）· 端差登记（不做）」与现行实现冲突（审批态族已实装：`subagentApproval` 消息 + 块头 `⏸`）——本档 §6.2 按现状落笔并与 §3 消息表口径一致；冲突已上报批次（主 agent 裁定）。
- 2026-09-16（**子代理面板通道恢复批 · 协议面收正**）：§3 `toolPanel` 行补**生产者双源**与 `cmd` ≤60 截断落层（webview 块头渲染——桥/生产者透传原串）；§3.1 三落点发射端例补现体（`relaySubagentContentChunk`）；§3.2 #3 发射点随收——payload 字段零变（只增不改纪律保持）。
- 2026-09-16（**子代理面板残环修复 · 协议面收正**——承 `docs/batches/2026-09-16-subagent-panel-residual-rings.md` §2）：§3 `permissionRequest` 行 owner 形态收正（`escalate <model> #<id>`——前 `<tag>` 为前引擎形态 + `continue` 键形归属）；§3 `permissionWithdrawn` 行释放来源补条目取消（⏹/cancel signal 链）。
- 2026-09-16（**VSC 产品树残留债清零批 · 协议面收正**——承 `docs/batches/2026-09-16-vsc-debt.md` §2）：新增 §12 收发面全量对表（机检对账 = `thincoder-vscode/test/protocol-coverage.test.mjs`——首列 ↔ 源码提取集双向对账 + ④ 处置闭区间）；§2 `userMessage` 行去 `assistantMessage`（回显面死码已删——零悬空）；§10 行数收正 + 拆分规划行；§11 回指行 +1（N-W7）。
- 2026-09-17（**af 批 · 二轮 fix 轮 · eng-designer**——承 `docs/batches/2026-09-17-async-face-fixes.md` §2.13）：§3 `cancelSubagent` 行补**advisor 同路由收口**（F-11——⏹ advisor 目标与子代理族同经 `executeCancelAction`；queued / running 两种命中的中继形态逐字）；**消息名 / 载荷字段零变**（只增不改纪律保持）。
- 2026-09-18（**模式联动批 · #45 VSC 半** · eng-designer——承 `docs/batches/2026-09-18-mode-propagation.md` §1.1）：新增 **§3.3「工具驱动的模式 / 参数变更 → 端显示同步」**（核实表逐源逐端判定 + 单一路径机制图 + 判据两条 + CLI half 结构性属性）；
   **消息名 / 载荷字段 / 发射点 / 消费位全部零变**（§3.2 只增不改纪律保持；§12 对表零改——机检 `thincoder-vscode/test/protocol-coverage.test.mjs` 双向对账不动）。
- 2026-09-18（**模式联动批 · 设计评审轮 1 修正** · eng-designer——fix 轮；承 `docs/batches/2026-09-18-mode-propagation.md` §3 发现 9）：§3.3 判据① 补 **`_engShown` 基线上值**（`← 当前 engineering` 布尔——非 `undefined` / `null`；含「后者 = 每 run 无条件重推」后果句）；同步面另有 §3.3 参数面判定与核实表行 4（发现 8——CLI 参数段活对象直读）。**零新语义**：本档只成文既有设计值（消息面零变，§12 零改）。
- 2026-09-18（**VSC 配置页接线修复批 · eng-designer**——承 `docs/batches/2026-09-18-vsc-settings-wiring.md` §1）：新增 **§13 发面全量对表（webview → host）**（52 行 as-of 实测 + 四形态登记 + 机检 `protocol-coverage-reverse.test.mjs`（拟新增））；
  §12 头注补收 / 发两向机检指针与「打开拍回批」发射点（三行 ② 列）· 方向口径段补打开拍序契约；§11 回指 +1 行（F-W12 · N-W7）。
  **消息名 / 载荷字段零变**（只增不改纪律保持；§12 首列与 host 发射集不动——既有双向对账用例零改）。
- 2026-09-18（**VSC 配置页接线修复批 · 设计评审轮 1 修正** · eng-designer——fix 轮；承 `docs/batches/2026-09-18-vsc-settings-wiring.md` §3 发现 5 / 6 / 11）：
  §12 `shellCandidates` 行 ② 列补「（打开拍回批——经 `_pushSettingsLight` 同发）」（四快照行注记对齐）+ 收正 **2 处预存在漂移坐标**
  （`panel-index.mjs:49`→`:53` · `panel-messages.mjs:408`→`:405/:421`，头注已标）；§13 `saveShellSettings` 行 ⑤ 明写「**本项处置 = 接线（≠ 删）**」（④ 仍记当前类）。**消息名 / 载荷字段 / 首列判别式零变**。

- 2026-09-18（**VSC 会话界面接线修复批 · eng-designer**——承 `docs/batches/2026-09-18-vsc-session-wiring.md` §1）：§3 增 `batchPermissionRequest` 行（原缺登）· `permissionWithdrawn` / `batchPermissionResponse` 行补新释放源与 `promptId` 匹配语义；
  **§3.2 六项 → 七项**（增 #7 = `batchPermissionRequest` 增字段 `promptId`——D3：计数与列表同改）；新增 **§4.6 权限卡族 id 纪律**（族键 · 单一释放通道 · 三路释放对合并卡同源 · id 精确匹配 · 孤儿响应）；
  §4.4 增忙态派生消费者指针行（模型/推理忙态门——单源在 `WEBVIEW.md` §4.2）；§7 增 D-P12 + D-P11 计数同步（七项）；§9 增 U-P7；§11 回指 +1 行（F-W13）；
  §12 `batchPermissionRequest` 行坐标收正 `:95`→`:92`（预存在漂移）+ 载荷注记；§13 `batchPermissionResponse` 行 ⑤ 注记（载荷增字段，三发点同携）。
  **首列判别式集零变**（只增字段 / 只补登——机检 `protocol-coverage.test.mjs` / `protocol-coverage-reverse.test.mjs` 双向对账集不动）；§12/§13 ②/③ 列行号随实现轮同点实读重出。

- 2026-09-18（**同批修轮 · eng-designer**——父侧裁定带上批档 `2026-09-18-vsc-session-wiring.md` §2.6 #2）：§4.4 `waiting` 判据扩为**三队列**（权限 / 批权限 / question）+ 增「**释放 ⇒ 必刷**」不变量；
  §4.6 增「释放即刷新」行（刷新点单源 = `releasePermission`——`panel._refreshStatus?.()` 同点）；§7 增 D-P13（**十二 → 十三项**——D3 计数与列表同改）；§9 增 U-P8（**七 → 八项**）；§11 回指行 8 补点。
  **消息名 / 载荷字段 / 首列判别式集零变**（只改判据与刷新点——§3 / §3.2 / §12 / §13 零改）。

- 2026-09-18（**VSC 会话界面接线修复批 · 实现轮** · eng-coder——承 `docs/batches/2026-09-18-vsc-session-wiring.md` §2；§12/§13 表体随实现同步）：
  §12 `permissionWithdrawn` 行②列补**第二发射点**（`panel-messages.mjs` 孤儿响应回写——②列改「共 2 处」+ ⑤列点明来源；评审发现 9），`batchPermissionRequest` / `permissionRequest` / `historyPage` 行 ②③ 列同点实读重出；
  §13 `batchPermissionResponse` 行②列随三发点改**局部箭头形态**重出（形状③/④）+ `selectModel` / `selectReasoning` 行②列随忙态门重出；两表头注各补本批实现轮口径行。
  **消息名 / 载荷字段 / 首列判别式集零变**（只重出坐标与形态注记——机检 `protocol-coverage.test.mjs` / `protocol-coverage-reverse.test.mjs` 双向对账集不动，`npm test` 643/643 绿）。

- 2026-09-18（**文档卫生轮 · 父侧直接执行**——§12 / §13 全表坐标 sweep）：两表 ② ③ 列逐行按 `node test/protocol-coverage{,-reverse}.test.mjs --emit` 重出（提取器 = 唯一权威）——§12 修正 **38 行** as-of 漂移（另 `digest` 行仅前缀回正——坐标本即准确）/ §13 修正 **33 行**；
  含四快照行随 `_pushSettingsLight` / `panel-index.mjs` 归位（② 列改指实现落点）· `permissionResponse` / `batchPermissionResponse` / `questionResponse` ② 列改记**三发点**（`reply` / `payload` 定义位入括注）· 形态号② ③ 与头注登记对齐；
  `settings.mjs` / `suspension.mjs` / `ledger-surface.mjs` 三类重名档持**全限定路径**（短形 `src/extension/…` 触机检悬空——同名多解；本行只作登记，不动解析规则）；两表头注 as-of 统一到本轮（前轮注记只作参照）。**首列判别式集 / ④ 处置列 / 载荷字段零变**（机检双向对账集不动）。
- 2026-09-18（**面板 live 块出生可靠性面 · eng-designer**——承 `docs/batches/2026-09-18-init-block.md` §1 讨论与需求档 `requirements/WEBVIEW.md` NFR-A2）：
  §3.2 **七项 → 八项**（增 #8 = `panelDiag` 新消息——webview → host 诊断上行；D3：计数与列表同改）+ 纪律行补「新增量一律入本节登记表」句；
  §7 增 D-P14 · D-P11 计数同改（七项 → 八项）；§11 行 1 回指补 NFR-A2。**§12 / §13 表体零改**——新消息尚未实现，两表只收实测在位的行；
  行 8 的 §13 行（含是否加「（拟新增）」标记）随实现轮按惯例落，本档只作 §3.2 登记。
- 2026-09-19（**VSC 子代理 live 块可见性批 · eng-designer**——承 `docs/batches/2026-09-18-vsc-subagent-live-visibility.md`）：§3.2 行 8 收窄——痕迹面由「出生 / 终态」扩为「出生 / 终态 / 丢弃」三面（`drop-frozen` / `drop-tombstone`——①⑦ 就位）；发点档标「（拟新增）」全路径化。§12 / §13 表体零改（新消息未实现——两表只收实测在位行）。
- 设计面单源：`docs/vsc/design/WEBVIEW.md` §5.3（出生面存活闸 · 禁静默 · 单投递队列 · 痕七类）、§5.5（出生可见性）、§6（D-W25–D-W31）。
- 2026-09-19（**同批设计评审修正轮 · eng-designer**——评审 id=130 发现 2 / 6 / 9-11 落地；fix 轮）：§6.2 模型行收正（模型段来源 = **事件载荷字段**——键形 `sub:<role>#<id>` 不含模型段；consult / escalate 头词现状不携——`activity-view.js:56`；结论改端差登记）；
  §6.3 **12 键 → 13 键**（增 `sub.newBlocks`——出生可见性计数钮；D3：计数与列表同改）；§12 `sub:*` 行 ⑤ 备注收正（role 段 = `[\w-]+`；`FAMILY_ROLES` 非键枚举）；**消息名 / 载荷字段 / 首列判别式集零变**（§3.2 / §12 / §13 表体零改——机检双向对账集不动）。
- 2026-09-19（**VSC 子代理 live 块可见性批 · 实现轮** · eng-coder——承 `docs/batches/2026-09-18-vsc-subagent-live-visibility.md` §2；§12/§13 表体随实现同步）：
  §3.2 行 8 去「（拟新增）」标记（上行发点 `webview/activity-diag.js` 已落地）；§13 **新增 `panelDiag` 行**（发点 ② `webview/activity-diag.js:81` · 消费位 ③ `panel-messages.mjs:270` · ④ `活`——机检双向对账绿）；
  §12 `sub:*` / `subagent` / `subagentApproval` / `toolPanel` 四行 ② 列按 `--emit` 实测重出（发射点随 relay 面文件位移；`toolPanel` 由直投改经 `postSubagentEvent`——同口入队：`WEBVIEW.md` §5.3）；两表头注各补本批 as-of 行。
  **消息名 / 载荷字段 / 首列判别式集零变**（新增一行 = 实现落地登记，非协议面新语义——§3.2 行 8 早已登记）。
- 2026-09-20（**库存清账批 · 台账 #129 G-3 / G-4 + #128 · eng-designer**——承 `docs/batches/2026-09-20-residual-sweep-batch.md` §2）：§6.2 补 **queued 状态词行**（与 `WEBVIEW.md` §5.2 契约对位）；§6.3 头注补**收录口径**（非 locales 全量 + 新增对位键同轮登记）；§12 头注 v1 词面收正（`npm test` 逐跑）。**零新语义**。
- 2026-09-20（**库存清账批 · 设计评审修正轮（id=43）· eng-designer**——承 `docs/batches/2026-09-20-residual-sweep-batch.md` §3 发现 10）：§6.3 头注末句改述——「新增对位键须同轮登记本表」明标**登记义务 = 承 D3 计数·枚举纪律（本表为其落点）**（非本表新立义务——与上行「零新语义」同口径）。
- 2026-09-20（**渲染粒度对齐批 · eng-designer**——承 `docs/batches/2026-09-20-render-granularity-batch.md` §2）：§3 `toolPanel` 行与 §3.2 行 3 补**增字段** `face`（内容 chunk 来源面——`WEBVIEW.md` §5.6 合并判据源；`tool` 字段同携于工具输出面）。**消息名 / 发射点 / 消费位零变 · 十三项计数零变**（行 3 原地扩字段）。
- 2026-09-21（**无工作区守卫批 · 实现轮 · eng-coder**——承 `docs/batches/2026-09-21-vsc-no-folder-guard.md` §2.7 实现轮文档义务）：
  §12 **新增 `workspaceGuard` 行**（② `src/extension/workspace-guard.mjs:38` · ③ `webview/chat.js:197` · ④ `活`——`--emit` 实测，双向对账绿）；
  §3 / §3.2 行 15 去「（拟新增 / 实现轮到位）」标记，换实测落点。**消息名 / 载荷字段 / 首列判别式集零变**（新增一行 = 实现落地登记，非协议面新语义——§3.2 行 15 早已登记）。
- 2026-09-21（**无工作区守卫批 · 评审轮 1 修正轮 · eng-designer**——承批次档 §3 轮次 1 发现 4 / 5）：§6.3 键表 **17 → 19 键**（增 `workspace.required` / `workspace.requiredPlaceholder`——端特有键；D3：计数与列表同改）+ 两键登记注；§7 D-P11 计数 **十四项 → 十五项**（与 §3.2 标题 `:78` 同轮对齐）。**消息名 / 载荷字段 / 首列判别式集零变**（§12 / §13 表体零改）。
- 2026-09-21（**无工作区守卫批 · eng-designer**）：§3 增 `workspaceGuard` 行（新消息——无工作区守卫态）；§3.2 **十四项 → 十五项**（增行 15 = `workspaceGuard` 新消息，拟新增标记；D3：计数与列表同改）。§12 / §13 表体零改（两表只收实测在位行——新消息未实现；实现轮落位后补 §12 行）。
