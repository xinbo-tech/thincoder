# Webview 消息协议与忙态秩序（WEBVIEW-PROTOCOL）· 设计 — VSC 部分

> 部分 = **vsc**（`docs/vsc/`）；板块 = **webview 前端面**的**协议与秩序面**——webview ↔ extension 的消息族、发射/接收纪律、消息秩序与忙态收敛、状态行段位。
> 同板块同层另两档 = `WEBVIEW.md`（结构与活动区——块生命周期与块头形态）· `WEBVIEW-INPUT.md`（输入面 · 消息渲染契约）。**同一机制只详述一处**（D2）。
> 消息名 / 载荷的 byte 级维护寄存器 = `thincoder-vscode/AGENTS.md`「Webview ↔ Extension Message Protocol」——**本档 = 机制与演进纪律的权威源**，寄存器只登记形态。
> 需求侧 = `docs/vsc/requirements/WEBVIEW.md`（F-W1–F-W7 / N-W1–N-W6）；逐条回指见 §11。
> 来源 = `thincoder-vscode/docs/_archive/design/WEBVIEW.md`（VSC 产品树）——**原地一字未改，留作参照历史**（保留 ≠ 维护）。对应源节 = §4 · §7 · §8 · §14.3（C-9–C-16）。
> 坐标 = 仓根相对路径 + `:行`。

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
| ext → wv | `providerStatus` / `autoApprove` / `models` / `sessions` | Provider 态 / AUTO 会话级 / 模型表 / 会话列表（**增字段** `ledger`——账本异常注记 `{ refused, reason, scene }`，异常才携） |
| ext → wv | `historyPage` / `loadOlder` | 懒历史：末页先发（`older=false`）+ scroll 补偿 |
| wv → ext | `question` / `questionResponse` | 内联 question 卡（非原生弹窗）——`questionResponse { answer, promptId }` |
| ext → wv | `userMessage` | 历史回放（quick-input 命令回显用） |
| ext → wv | `clearMessages` | `—` |

## 3. 扩展机制消息族（本架构权威源）

| 消息 | 方向 | 载荷 / 语义 |
|---|---|---|
| `toolPanel` | ext → wv | `{ type, name, kind, text, round, model, sub }`——活动流 chunk（advisor / 子代理 / consult / escalate）；`kind` = start / think / text / tool；`sub` = 嵌套子标（string chunk 分支恒 `undefined`）；**增字段** `tool`（工具名——工具调用面与工具输出面同携）/ `cmd`（参数摘要 ≤60——无则不携） |
| | | / `face`（内容 chunk 来源面 ∈ `text` / `think` / `toolCall` / `toolOutput`——`WEBVIEW.md` §5.6 合并判据源）。**生产者双源** = `onToolPanel` 缝 + 子代内容 chunk 中继（relay 前缀分流——`panel-callbacks.mjs` `relaySubagentContentChunk`）；`cmd` ≤60 截断落层 = **webview 块头渲染**（`activity-view.js` `noteChunk`——超 60 截为 59+…）， |
| | | 桥与生产者透传原串 |
| `subagent` | ext → wv | `{ ...info }` 展开透传——`started`（池条目带 `pool: true`）/ `settled` / `done` / `error` / `cancelled` / `terminated` / `failed` / `answered` 终态 + turn / maxTurns 终值快照；**增 status 值** `"turn"`（`{ id, role, turn, maxTurns }` 逐轮进展帧）；**增字段** `note`（块头停因注记——X6） |
| | | / `syncLive`（sync 可中止事实——X10） |
| `subagentApproval` | ext → wv | `{ id, role, model?, tool }`——审批态（`tool = null` 清除）→ 块头 `⏸` + 态词 `等待审批: <tool>` |
| `cancelSubagent` | wv → ext | `{ id, role }`——⏹ 点击路由 → 池条目定向 abort（role 交叉校验防陈旧按钮误停；未知 no-op）；**advisor role 复用同路由**——与子代理族**同经** `executeCancelAction`（**不得**走专用直调分支；收尾口径 = `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` 的 §6.11 第 3 条「端侧路径收口」） |
| | | ⇒ 取消事件经中继转 `subagent` 协议消息（queued 命中 = `cancelled(was:"queued")`——等待头移除；running 命中 = `cancelled`——块定格） |
| `permissionRequest` | ext → wv | `{ tool, args, diff, owner, promptId }`——逐项权限卡；`owner` = 子代理归属标签（`<role>#<id>` / `escalate <model> #<id>`（尖括号为字面 · model = 池条目值；`continue` 询问卡 = `<role>#<id>`〔args.agent 机器键〕）——depth-0 为 `null`）；`promptId` = 响应匹配键 |
| `permissionResponse` | wv → ext | `{ approved, promptId }`——按 promptId 精确匹配队列条目（无 promptId 回退队头——旧 webview） |
| `permissionWithdrawn` | ext → wv | `{ promptId }`——host 侧释放（条目取消（⏹/cancel——signal 链）/ 中止 / approve-all 连带 / **合并卡 Stop·Ctrl+I 释放** / **孤儿响应**）→ 移除对应卡（逐项 / 合并同选择器——§4.6） |
| `batchPermissionRequest` | ext → wv | `{ tools, count, promptId }`——合并询问卡（同响应 ≥2 非只读工具——§16 D-B1）；`promptId` = 与逐项卡**同族响应键**（同一单调计数器——§4.6） |
| `batchPermissionResponse` | wv → ext | `{ choice, promptId? }`——approveAll / oneByOne / deny；`promptId` 精确匹配 `_batchPermissionQueue` 条目（无 promptId 回退队头——旧 webview）；命中零条目 ⇒ host 回 `permissionWithdrawn`（§4.6） |
| `compress` | ext → wv | start / done / failed / fallback 四态（压缩状态行） |
| `digest` | ext → wv | `{ status:"start"/"end"/"cap", n, ok?, ms?, mode?, turns? }`——消化轮起跑 / 收尾 / turn-cap 指示（呈现契约见 §5）；**增字段** `tier`（起跑档位 `ask` / `digest`——§5）+ `from` / `msg`（仅 ask 档条件携带——提问者 `role#id` 与问题摘要（单行 + 截断 ≤120 字符，核单点）） |
| `suspension` | ext → wv | 挂起态行 / 冻结通知（`settled → done` 补发 / `active:false + freeze`）——计数载荷与 `turnState` 双通道同源；**增字段** `interrupted`（会话中止事实——X11） |
| `turnState` | ext → wv | `{ state, counts? }`——忙态单一广播（§4.4 权威锚） |
| `workspaceGuard` | ext → wv | `{ active }`——无工作区守卫态（拒启 + 提示；判据 / 守卫面 / 提示面 = `docs/vsc/design/PROJECT-SWITCHER.md` §4.1）。发射 = `src/extension/workspace-guard.mjs` `pushWorkspaceGuard`（推送点 = `panel-session.mjs` 的 `openSessionContent` 两分支 / `chat-panel.mjs` 工作区变化处理）； |
| | | 消费 = `webview/chat.js` `case`（§3.2 行 15）。机检②/③ 列坐标 = §12 行 |
| `busyQueued` | ext → wv | `{ pending, count, items, merged? }`——busy 排队**队列快照**（`count` = 剩余条数；`items` **必携**（可空数组）= 队列剩余项原文（按队列序——待发送带全量重绘源；**缺 `items` 的旧载荷** ⇒ 带面保留原态、零重绘，`count` 照常更新）；`merged` = 本批消费文本（单条 = 原文，多条 = 合并文本；仅消费推送携——webview 据此追加**恰一枚** user 块））。webview 消费 = 二次提交守卫（`count >= 8`）+ 待发送带 + 消费出块（`WEBVIEW-INPUT.md` §1 C-B2-6 ⑦） |
| | | + 待发送带（输入区上沿派生面——判据 / 形态 / 消费出块 = `WEBVIEW-INPUT.md` §1 C-B2-6 ⑦）。发射 = `src/extension/panel-messages.mjs` `pushBusyQueued`（受理 / **五个消费点**（含步边界 pickup） / 忙分支判决 / `webviewReady` 握手重推）；消费 = `webview/chat-messages.js` `case`（§3.2 行 17）。机检②/③ 列坐标 = §12 行 |
| `statusText` | ext → wv | `{ kind:"rateWait"/"rateLimited"/"overloaded"/"quota"/"index", seconds?/message?/phase?/done?/total? }`——限流 / 索引状态段 |
| `turnFrame` | ext → wv | `{ turn, maxTurns }`——顶层逐轮进展段 |
| `questionCancelled` | ext → wv | `{ promptId }`——abort 释放未答 question 卡（§4.2） |
| `onAgentTurn` | 内部 | 每轮迭代 turn 计数钩子——顶层经 `panel-callbacks` 转 `turnFrame` 上屏；池条目同步转 `subagent` `status:"turn"` |
| `uiPrefs` | ext → wv | `{ autoFollow, activityMaxHeight, activityTailLines }`——视图偏好三键（缺省 true / 32 / 3；发射 = `thincoder-vscode/src/extension/ui-prefs.mjs`（握手 + `onDidChangeConfiguration`）；消费 = `chat-messages.js` `case "uiPrefs"` → `ui-prefs.js` `applyUiPrefs`（§3.2 行 23）；机检②/③ 列坐标 = §12 行） |

### 3.1 演进纪律（三落点）

新增**展示**字段必须同时落三个点——**发射端 chunk / 桥 postMessage 载荷 / webview 渲染端**：

1. 发射端（子代内容 chunk 现体 = 端壳中继 `thincoder-vscode/src/extension/panel-callbacks.mjs` `relaySubagentContentChunk`；核 `thincoder-core/agent-tools/subagent-run.mjs` 的 tool chunk）；
2. 桥的**白名单纯函数** `toolPanelPayload`（`thincoder-vscode/src/extension/panel-toolpanel.mjs:14-21`）；
3. webview 渲染端（`thincoder-vscode/webview/activity-view.js`）。

string / 对象双分支在 payload 构造处统一推导（对象载荷字段透传、string 分支字段 `undefined` 安全降级）。

### 3.2 协议增量登记（三十五项——只增不改）

| # | 消息面 | 增量 | 发射点 | 接收点 |
|---|---|---|---|---|
| 1 | `statusText`（新消息） | 五 kind 载荷（见 §3 表） | `panel-callbacks.mjs` onWait 映射；`panel-index.mjs` 索引进度 | `chat.js` case → `S._statusText` → 状态行段 |
| 2 | `turnFrame`（新消息） | `{ turn, maxTurns }` | `panel-callbacks.mjs` onAgentTurn（顶层） | 同上 → 状态行 `turn N/M` 段 |
| 3 | `toolPanel`（增字段） | `tool` / `cmd` / **`face`**（内容 chunk 来源面，工具输出面合并判据源：`WEBVIEW.md` §5.6） | `relaySubagentContentChunk`（子代内容中继）+ payload 白名单 | `activity-view.js` 块头 · `ui.js` 内容行合并 |
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
| 15 | `workspaceGuard`（**新消息**——host → webview） | `{ active:boolean }`——无工作区守卫态（面板拒发 + 占位符第三态；判据 / 守卫面 = `PROJECT-SWITCHER.md` §4.1） | `src/extension/workspace-guard.mjs` `pushWorkspaceGuard`（推送点 = `panel-session.mjs` `openSessionContent` 两分支 / `chat-panel.mjs` 工作区变化处理； | |
| | | | 机检发点坐标 = `src/extension/workspace-guard.mjs:38`） | `webview/chat-messages.js:102` `case "workspaceGuard"` |
| 16 | `queuedUserMessage`（**新消息**——webview → host 输入上行） | `{ text, model, reasoning, provider, images }`——busy 期排队注入（busy 即排队面 = `running`；host 队列载体两态（容量 8）= 无会话 `panel._busyQueued` ∥ 会话在飞 `susp.pendingInput`；细则 = `WEBVIEW-INPUT.md` §1 C-B2-6） | | |
| | |  | `thincoder-render-core/composer/panel.mjs:352`（出口分流——**忙态零本地气泡**：`hooks.onUserEcho` 返回 `null`；回显只走真回合） | `panel-messages.mjs:229` `case` → `routeUserTurn` 入槽 |
| 17 | `busyQueued`（状态镜像 · **载荷收正**） | `{ pending:boolean, count:number, items:string[], merged?:string }`——队列快照（`count` / `items` = 剩余实况（守卫 = `count >= 8`；Reload 重建源 = `items`）；`merged` = **本批消费文本**（单条 = 原文，多条 = 合并文本；仅消费推送携——出块单源；`text` 退役——webview 零读）；`WEBVIEW-INPUT.md` §1 C-B2-6 ⑦） | `src/extension/panel-messages.mjs` `pushBusyQueued`（受理 / **五个消费点**（含步边界 pickup） / 忙分支判决 / `webviewReady` 握手重推） | |
| | | |  | `webview/chat-messages.js` `case "busyQueued"` → `webview/pending-band.js` `applyBusyQueued`（镜像 + 带面重绘 + `merged` ⇒ 流内恰一枚 user 块） |
| 18 | `usage`（增字段） | `timers`（`{ count, expired }`——核 `_pendingTimers` 活读投影；零在途 ⇒ 段零节点） | `panel-callbacks.mjs` `usage` 发射点（累计 ∕ transports 映射——同 `reasoning_tokens` 行） | `status-bar.js` `⏰N` 段 + `state.js` 两计数槽 |
| 19 | `timer`（**新消息**——host → webview） | `{ status: "fired", text }`——`text` = 交付原文（`[System reminder: ⏰ timer — …]` 逐字；显示裁 = ≤3 行 + `…`——CLI 同规） | `thincoder-vscode/src/extension/timer-watch.mjs`（已落——空闲 deadline 闩到点交付点） | `webview/chat-messages.js`（流内触发行渲染） |
| 20 | `providerError`（**既有载荷替换**——`{text}` ⇒ `{scope, reason}`） | 载荷 v2 = `{ type:"providerError", scope, reason }`——`scope` = 段名（六段闭集 + `panel`；`panel` ∕ 闭集外 ⇒ 零段标）；`reason` = 码 ∕ 原样串（webview：表内出词、表外原样直传、空 ⇒ 零节点）。 | | |
| | | **纪律句「不改既有字段语义」之明文例外** | **19 站点**统一助手 `postProviderError`（`thincoder-vscode/src/extension/settings.mjs:311`——`CONFIG_CONFLICT_HINT` ⇒ `"mtime-conflict"`；`panel-mcp.mjs` ×4 ∕ `panel-messages-settings.mjs` ×15——#695 收口） | |
| | | |  | `webview/chat-messages.js:154` `case` → `webview/settings.js` `showSettingsError(scope, reason)`（段标 + 词化码 ∕ 单槽驻留——机制单源 = `SETTINGS.md` §2.15） |
| 21 | `usage`（增字段） | `ctxTokens`（上下文占用量绝对数——状态行 `Yk` 尾串源；缺 ⇒ 尾串缺席） | `panel-callbacks.mjs` `usage` 发射点（累计 ∕ transports 映射——同 `reasoning_tokens` 行） | `status-bar.js` ctx 段（`context X% Yk` 拼接——#677 I16a） |
| 22 | `recordAppend`（**新消息**——webview → host 留档记录出站） | `{ record: { kind:"subagent", meta, rows } }`——归档时点快照（形 ∥ 判据单源 = `docs/core/design/SESSION.md` §6.26；每块恰一次——归档幂等守卫内） | `webview/activity.js:124`（`archiveBlock` 同点——归档派生点调用，幂等守卫内恰一次；载荷字面量构造 `:190`） | `panel-messages.mjs:287` `case` → `handleRecordAppend`（`:123-134`——处理体取活行载体 + 核 `pushRecord`；fail-soft） |
| 23 | `uiPrefs`（**新消息**——host → webview） | `{ autoFollow, activityMaxHeight, activityTailLines }`——视图偏好三键（缺省 true / 32 / 3；#875） | `thincoder-vscode/src/extension/ui-prefs.mjs:13` `pushUiPrefs`（webviewReady 握手 + `onDidChangeConfiguration`） | `webview/chat-messages.js:164` `case "uiPrefs"` → `thincoder-vscode/webview/ui-prefs.js` `applyUiPrefs`（§12 对表行在册） |
| 24 | `digest`（增字段） | `unsettled`（本轮未销账条数——**非上行轮且 > 0 才携**；残余元素判据——§5） | `thincoder-vscode/src/extension/suspension.mjs` 收尾点（`driveTurn` finally——帧 ∥ 记录同点双动作） | `webview/chat-messages.js:194` `case "digest"` → `webview/chat-status.js` `showDigestStatus`（`unsettled > 0` ⇒ 残余行元素——§5） |
| 25 | `providerKeySaved`（**新消息**——host → webview） | `{ name }`——密钥行保存**受理回执**（宿主保存成功径才发；拒径零回执 ⇒ 徽标零闪 ∥ 行不关——拒因走既有 `providerError`；回执语义单源 = `SETTINGS.md` §2.18） | `thincoder-vscode/src/extension/panel-messages-settings.mjs:43-44` `handleSaveProviderKey` | `webview/chat-messages.js:160` `case` → `webview/settings-providers.js:97` `onProviderKeySaved`（恢复静态行 + `flashSaved`） |
| 26 | `testProvider` ∥ `testProviderResult`（增字段 `id`） | 请求归属 id——单调 `_fetchSeq` 发时记在飞；宿主原样回显；落框 `r.id === _pendingFetchId` 才渲染（缺 / 不符 ⇒ 弃）；开 ∥ 关框双清（#1051） | `webview/settings-provider-dialog.js` `paFetchModels`（`:226` 载荷携 `id`） | `thincoder-vscode/src/extension/panel-messages-settings.mjs` `handleTestProvider`（`:162` 原样回显）→ `webview/settings-provider-dialog.js` `updateTestProviderResult`（`:262` 归属判） |
| 27 | `teamStatus`（**新消息**——host → webview） | `{ loggedIn, server, member, label }`——团队态投影（推送 = 打开快照族 ∥ 登录/退出成后；读面零提示字段——单源 = `SETTINGS.md` §2.20） | `thincoder-vscode/src/extension/settings.mjs`（读面 + push 点——实施后实读回填） | `webview/chat-messages.js` `case` → `webview/settings-team.js` `updateTeamStatus` |
| 28 | `teamLogin`（**新消息**——webview → host） | `{ server, username, password }`——直登上行（密码随上行即弃——零落盘；写面 = 核 `team.mjs` 单写者） | `webview/settings-team.js`（登录钮上发） | `src/extension/panel-messages.mjs` `case` → `panel-messages-settings.mjs` `handleTeamLogin`（实施后实读回填） |
| 29 | `teamLoginResult`（**新消息**——host → webview） | `{ ok, reason?, notice? }`——登录回执（`reason` 四值 → 四句出词；`notice` 单码 → 同名冲突一次性提示——单源 = `SETTINGS.md` §2.20） | `panel-messages-settings.mjs` `handleTeamLogin`（实施后实读回填） | `webview/chat-messages.js` `case` → `webview/settings-team.js` `onTeamLoginResult` |
| 30 | `teamLogout`（**新消息**——webview → host） | 无载荷——退出上行（服务端吊销 best-effort；网络失败照清本地） | `webview/settings-team.js`（退出钮上发） | `src/extension/panel-messages.mjs` `case` → `panel-messages-settings.mjs` `handleTeamLogout`（实施后实读回填） |
| 31 | `teamLogoutResult`（**新消息**——host → webview） | `{ ok, revokeDelivered? }`——退出回执（缺席 = true；`false` ⇒「服务端吊销未达」一次性提示） | `panel-messages-settings.mjs` `handleTeamLogout`（实施后实读回填） | `webview/chat-messages.js` `case` → `webview/settings-team.js` `onTeamLogoutResult` |
| 32 | `secretInput`（**新消息**——host → webview） | `{ payload, promptId }`——凭据 / 秘密输入卡（SSH 会话批；`payload` = 核 `onSecretInput` 原样透传（`{ kind, sessionId, host, user, port, fields[], keys{} }`）；`promptId` = 面板单调计数（逐卡配对）；**值只在返回路**） | `src/extension/panel-callbacks.mjs` `makeAskSecretInPanel`（`:88`）+ `cbs.onSecretInput`（`:293`） | `webview/chat-messages.js:207` `case` → `webview/secret-input.js` `showSecretInput` |
| 33 | `secretInputResponse`（**新消息**——webview → host） | `{ values:{…}|null, promptId }`——凭据卡应答（提交 = 值包 ∥ 取消 = `null`；host 按 `promptId` 精确配对，迟到 / 错序不误 resolve 队头） | `webview/secret-input.js:23`（发射位——字面量构造 `:21`） | `src/extension/panel-messages.mjs:297` `case` → `panel-messages-turn.mjs` `handleSecretInputResponse`（`:175-188`） |
| 34 | `secretInputCancelled`（**新消息**——host → webview） | `{ promptId }`——abort（Stop）释放未答凭据卡（`questionCancelled` 同构：按 `promptId` 精确移除；无 `promptId`（旧 host）⇒ 移除全部凭据卡） | `src/extension/panel-callbacks.mjs:93`（`makeAskSecretInPanel` onAbort） | `webview/chat-messages.js:210` `case`（摘 `.secret-card`） |
| 35 | `saveProviderModelContext` ∥ `providerContextSaved`（**新消息对**——上行 webview → host ∥ 下行 host → webview 回执） | 上行 `{ name, model, k }`——`k` = K 单位正整数；空 ∥ `null` = 清除（有已声明值时先过确认层）。下行 `{ name, model, k, kText }`——保存成功受理回执（`kText` = 宿主经核 `formatDeclaredContextK(k)` 出词——`128K` / `1M`；拒径零回执 ⇒ 拒因走既有 `providerError`；语义单源 = `SETTINGS.md` §2.21） | `webview/settings-provider-dialog.js`（表单保存上发；入口 = `webview/settings-providers.js:120` `Context…`） | `src/extension/panel-messages.mjs:318` `case` → `panel-messages-settings.mjs:130-151` → `src/extension/provider-context.mjs`；回执消费 = `webview/chat-messages.js:170` → `webview/settings-providers.js:76-90` |

纪律 = **只增不改**（不新增消息类型族、不改既有字段语义）——**新增 / 变更一律入本节登记表**（行 1–35 即全部在案增量；表外增量不入）。发射 / 接收落点：
`thincoder-vscode/src/extension/panel-callbacks.mjs:169`（statusText）· `:170`（turnFrame）· `thincoder-vscode/src/extension/panel-index.mjs:29` ·
`thincoder-vscode/webview/chat.js:260` · `thincoder-vscode/webview/status-bar.js:27-30/46`。

### 3.3 工具驱动的模式 / 参数变更 → 端显示同步（#45）

**机制（单一路径 = 一个同步点 + 一个 sink）**：

```text
变更源（工具）→ 状态载体（agent.config.agent.engineering / 会话槽；config.json）
      ↓ 工具批后（与 task / plan / goal 同一趟「载体镜像回填」——VSC `panel-turn-loop.mjs` `callbacks.onTurnEnd` 推送侧）
端显示同步点（一处在位，判据两条，每轮复位）
      ↓ callbacks.onEngMode / onSettingsChanged
单一 sink = panel._pushSettingsLight()（唯一 webview 写点——四快照重推）
      ↓
webview：agentSettings 快照 → mode-buttons.js 的 `_engOn` → `#eng-btn` 态
```

- **零新增消息类型**（§3.2「只增不改」纪律保持）：两侧都复用既有 `agentSettings` 快照消息——**发射点 / 载荷 / 消费位三面零变**，§12 对表**零改**（机检口径 = 顶级判别式集与发射点集，两者均不动）。
- **判据两条（同在工具批后单点）**：
  ① **模式侧** —— `agent.config?.agent?.engineering !== agent._engShown`；`_engShown` 在 `hydrateRun` 按槽应用处**置为当前基线**（`agent._engShown = agent.config?.agent?.engineering === true`）——「**已展示基线**」语义，
  **非** `undefined` / `null`（后者会让每 run 首个工具批无条件重推一次快照——设计评审轮 1 发现 9 定值）；
  ② **参数侧** —— `agent._settingsTouched` 标记（端侧 settings 工具包装在 `execute` 返回处置位；同步点读后复位——置位不做「成功」判定，快照重推幂等）。
- **用户路径不对称**：用户点击（`setEngineeringEnabled` / `setPlanMode`）走既有**直推**（`thincoder-vscode/src/extension/panel-messages.mjs:347-348`）——与本机制的 sink **同源**（`_pushSettingsLight` / `planMode` 消息），不构成第三条路径。
- **CLI half = 不进推送链**：状态行每帧 recompute 已是「变更 → 显示」的最短路径。本档登记该**结构性**属性：CLI 侧**不得**为模式再引入缓存副本（引入即须自建失效链——本机制的 CLI 面因此天然免维护）。
- **深度 > 0 不涉及**：子代理循环的 `callbacks` 无该两键 ⇒ `?.` 调用恒为 no-op（零注入、零推送）。

### 4. 消息秩序与忙态收敛

### 4.1 回合入口秩序

- `userMessage` / `retry` / `sendMessage` 命令直发（quick-input / Ask ThinCoder）共用**单一入口** `routeUserTurn`（`thincoder-vscode/src/extension/panel-messages.mjs:102`）。
- 回合执行中（`_turnState === "running"`）的消息**一律排队受理**（C-B2-6）：队列载体两态（容量 8）——无会话 ⇒ host 队列 `panel._busyQueued`；
  会话在飞（`panel._susp`）⇒ 会话队列 `susp.pendingInput`（webview 侧 = **零本地气泡**（待发送带在输入区上沿）+ `queuedUserMessage` 上行；满队（第 9 条）⇒ 提交不出泡 / 不清框 / toast——二次提交守卫）。
  送达 = 四支（**步边界 pickup（主——用户回合在飞：端壳循环头同址回调）** / driver 步骤 1 输入优先消费 / `enterSuspensionTurn` 预填 / idle 归位续发；会话退出兜底 = 残余直注入，零丢失）。契约单源 = `WEBVIEW-INPUT.md` §1 C-B2-6。
- `abort` / `interrupt` 等**控制消息永不排队、直通**（延迟红线——杀 Stop 即失败）。
- `sendMessage` 回显（`userMessage` postMessage）**只在真回合**：idle 直发 ⇒ 回显先于路由（现形保留）；**忙态（`turnBusy()` = running ∨ susp）⇒ 零 `userMessage` post**——排队面 = 待发送带（快照驱动），消费时刻出块（C-B2-6 ③⑦——外部入口同判据同槽）。webview 端同规：核件 `hooks.onUserEcho` 忙态返回 `null`（零本地气泡）。

### 4.2 question 卡 id 匹配

- host 发 `question` 携带单调自增 `promptId`；webview 卡片以 `data-prompt-id` 落 DOM。
- wv → ext `questionResponse` 回带 `{ answer, promptId }`——host 按 id 查队列条目（**非无条件 shift**——找不到 no-op，绝不 resolve 错队头）；无 promptId（旧 webview）→ 回退队头。
- host 中止未答 question（Stop / abort）→ 发 `questionCancelled { promptId }`——webview 按 id 移除对应卡（`webview/chat-messages.js:180-183`）；无 promptId → 移除全部 question 卡；abort 收尾路径同样清屏上 question 卡。

### 4.3 atComplete seq

- wv → ext `atComplete { query, cwd, seq }`——seq 在 webview 侧自增（`thincoder-vscode/webview/autocomplete.js:30-33`）。
- host **只回显最新 seq**（`panel-index.mjs:60-63`）：慢扫描迟到返回时若已有更新请求 → 丢弃；`atResults { matches, seq }` 回带该 seq（`:80`）——旧扫描不覆盖新下拉。

### 4.4 忙态收敛（权威锚）

- **host `_turnState` 枚举 `{ idle, running, susp }`**：`running` = 回合（含会话内 digest / 会话用户回合）执行中；`susp` = 挂起会话活跃或释放窗口（池仍 live、会话未建）。`waiting`（**权限 / 批权限 / question 三队列任一非空**）是 running 的**修饰态非互斥**——只经 `_refreshStatus` 呈现（waiting 优先），**不入枚举**。读者一律走谓词 `panel.turnBusy()`（= state ≠ idle）。
- **释放 ⇒ 必刷**：任一队列条目离队后必经 `_refreshStatus` 重算——刷新点单源 = 释放通道 `releasePermission`（§4.6）；批卡停驻期与释放后均不得读作 `idle` / `running`（停驻期误读 `running` · Stop 释放后残留 `waiting`——两形态同一判据缺口）。
- **单一广播**：每次忙态 set / clear 调 → 发 `{ type:"turnState", state, counts? }`；webview **单一 reducer** `handleTurnStateMessage` 更新 `S._turnState`（`thincoder-vscode/webview/chat-messages.js:99`）。
- **counts 同源** = host `backgroundStatus`（`thincoder-vscode/src/extension/suspension.mjs`——核 `backgroundCounts` 装配出口）形 `{ running, queued, pending, done }`——随 susp 广播 / 重发携带（挂起驱动轮末 + settle 触发点 + `webviewReady` 重推）⇒ webview `S._suspCounts` 恒 = host 实际（不陈旧）。
- **时序**：状态广播先于同批 `loading:false`（digest / 回合尾）——Stop 派生无闪烁窗口。
- **`S._suspended` 语义不变**：仍由 `suspension` 消息（active / freeze）驱动（会话级语义——digest 执行中 state 为 running 时不得翻 false）；`S._turnState` 是独立的忙态阶段镜像。
- **`#status-line` 单 writer = `renderStatusBar`**（`thincoder-vscode/webview/status-bar.js:17`）：thinking 态 = `S._phase === "thinking"` 标记（`loading` 消息经 `setLoading` 置位 / 清除）——`loading` 消息不再 innerHTML 覆写状态行（修「徽标被每 digest 的 thinking 重画清掉」）。
- **Stop 可见性 = `S._turnState === "running"` 派生**（`thincoder-vscode/webview/loading.js:57`）：running（回合 / 标题窗口 / 会话内 digest 起跑 / Reload 冷启重推）常显；**susp（纯后台池跑——主空闲）不显**（无全停按钮——池空自然消化完）；`loading:true/false` 不再隐 / 显 abort。Stop 作用 = 只停主会话当前 controller（不再全链中止挂起会话）——子代理停止靠区内逐块 ⏹（`cancelSubagent` 定向 abort）。
- **忙态派生消费者**：**Send ∥ Stop 两组**（`running` 期——Send 隐藏 ∥ Stop 常显；判据 = `S._turnState`）；模型 / 推理按钮**零忙态门**（随处可切——单源 = `WEBVIEW.md` §4.2；本档不复述（D2））。

### 4.5 会话打开单向 boot（权威锚）

- **`resolveWebviewView` 只起慢段**（`status()` = migrate / fullStatus / mcpStatus / 模型偏好 / 索引探测——与 webview 加载重叠并行）；resolve **绝不发会话内容、绝不绑槽**（内容双发 / 槽重绑红线）。
- **`webviewReady` = 会话内容唯一发射点**（快段 `openSessionContent`——`thincoder-vscode/src/extension/panel-session.mjs:301`）：
  握手后才允许 run——`resumeSlot` 绑槽 → `pushProject` → `loadSession` 全量（内部序 autoApprove → planMode →
  `clearMessages` → `historyPage` → sessions——见 `panel-session.mjs:147` ∕ `:195` ∕ `:262`）。槽绑定时机 = resolve → webviewReady 顺延（webviewReady 前无 slot 读者）。
- **单向 boot 顺序**：`clearMessages` 先于 `historyPage`（先清后灌——一次内容整体落定，无「波浪式」增量）；`older=false` 末页（懒历史首屏——scroll-back 页仍走 `loadOlder`）。
- **sessions 恰一次**：快段内无独立 pushSessions——`loadSession` 尾单发（同 tick 合并双发）；异步第三发（慢段 fullStatus 回调）保留**不同 tick**（跨 tick 允许）。
- **任务可见性族的就绪两拍**排在 `openSessionContent` **之后**（flush → 再断言——见 `WEBVIEW.md` §5.3）。

### 4.6 权限卡族 id 纪律（逐项 / 合并 · 单一释放通道）

- **族键 = `promptId`**：逐项卡（`permissionRequest`）与合并卡（`batchPermissionRequest`）**共用同一单调计数器**（`permission-gate.mjs` 的 `panel._permissionSeq`）——id 跨族唯一（同一移除选择器不误删）。
- **单一释放通道 = `releasePermission(panel, entry, verdict, queue)`**：出队 + resolve + `permissionWithdrawn` 三步同点；合并卡走 `_batchPermissionQueue`（**队列分立**——判定值域不同：逐项 boolean / 合并字符串）。
- **三路释放对合并卡同源**：轮级 Stop / Ctrl+I（`panel._abortController` abort）⇒ deny 释放 + 卡移除（一次机制覆盖两入口）；child 定向取消 / approve-all 连带两路仅及逐项族（合并卡恒 depth-0——`docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.7.6 C-1/Q1）。
- **响应 = id 精确匹配（非 `shift`）**：`batchPermissionResponse { choice, promptId }` 按 id 查 `_batchPermissionQueue`；无 `promptId`（旧 webview）→ 回退队头（向后兼容）；未知 id ⇒ 零命中（不误 resolve 队头）。
- **孤儿响应零静默无效**：队列无命中条目 ⇒ host 回 `permissionWithdrawn { promptId }`（可见处置——卡由既有消费者移除）；不 resolve 任何条目、不新造条目（幂等）。
- **释放即刷新（状态栏）**：`releasePermission` 三步（出队 + resolve + `permissionWithdrawn`）之后**同点**调 `panel._refreshStatus?.()`——轮级 Stop / Ctrl+I 释放合并卡、approve-all 连带、孤儿处置同源同刷（零散点；判据 = §4.4）；no-op 释放（重复释放 / 条目不在队）不改队列 ⇒ 零刷新（幂等）。
- 卡形态（类名 / 选择器 / 移除外形）= `WEBVIEW.md` §4.1（本档不复述）。

## 5. digest 轮可见面与 turn-cap

**契约**（元素级落点 = `thincoder-vscode/webview/chat-status.js:71`（`showDigestStatus`））：

- **载荷** = `{ status:"start"/"end"/"cap", n, ok?, ms?, mode?, turns?, tier?, from?, msg?, unsettled? }`；`tier` ∈ `ask` / `digest`（按因两档）；`from` / `msg` 仅 ask 档携带（档位判据 / 零影响证据 / 边界 = `WEBVIEW.md` §5.1「消化轮起跑档位」——本档只记元素级契约）；`unsettled?` = end 形新增（本轮未销账条数——非上行轮且 > 0 才携）。
- `digest start` → ① 追加 `.digest-turn` 标签行——按 `tier` 取键：`ask` ⇒ `digest.turnLabelAsk`（携参 `{ from, msg }`）/ **其余（含 `tier` 缺省——旧载荷）** ⇒ `digest.turnLabel`；
  ② **`n > 0`** ⇒ 追加**本轮独立** `.digest-status` 计数元素（`id="digest-status"` 退役；`dataset.n` = 起跑数）——**两档同规**；`n = 0`（ask-only 轮）⇒ 零计数元素（`_digestRoundEl` 置空）；③ 记本轮边界 `S._digestBoundary`（归档落点——计数元素 ∥ 无 ⇒ 标签元素）；
  ④ `ctx.assistantLabeled = false`（本轮 assistant 输出带一次回合标签）。
- `digest end` → **追加终态元素**（`.digest-status` + `digest-done`；`ok:false` ⇒ `digest.aborted` + `digest-failed`——异常不留「仍在消化」假象；计数 = 本轮起跑数（自本轮计数元素 `dataset.n` 取——同源）；**不动原计数元素**（零就地换文——恒起跑文 `digest.start`））；
  **残余元素**：`unsettled > 0` ⇒ 追加残余行（`.digest-status` 族——词键 `digest.residue`）；`= 0` ⇒ 零行；
  **本轮无计数元素（ask-only 轮 · `n = 0`）⇒ 零动作**（禁兜底建元素——`dataset.n = "?"` 幻影行禁出）。
- `digest cap` → `.digest-cap` 行（`mode:"auto"` dim / `mode:"stop"` warn）。

- 实现落点：`thincoder-vscode/webview/chat-status.js:71`（`showDigestStatus`）· 样式 `thincoder-vscode/webview/base.css`（`.digest-status` 族沿用 + `.digest-turn` / `.digest-cap`）。
- 跨轮 = **新元素随流追加**（漂移消除）——`start` 连发亦各成独立元素；`end` ⇒ **追加终态元素**（零就地换文——原计数元素恒起跑文）。
- 投递 = **直投**（不走 outbox——digest 只在面板活跃且 webview 已就绪后发生；outbox 语义 = 出生事件族）。
- host 发射点：`thincoder-vscode/src/extension/suspension.mjs:190`（起跑——`tier` 判据同点）· `:214`（收尾）· `thincoder-vscode/src/extension/panel-callbacks.mjs:83`（cap 两档——`postDigestCap` 发射行；定义 `:82-84`）。

## 6. 状态行与块头字段对位

### 6.1 状态行段位（本端 × CLI）

> **显示形态行判读**：端差默认 = **消**（对齐）；保留例外的唯一凭据 = **宿主能力面证据 ∥ 行为证据**——逐条落行，不设类级判据。
> **边界**：本表只辖显示形态；判据 / 行为面差异不适用（本表零此类——若有 ⇒ 按「端差默认 = 消」对齐）。

| 字段 | CLI 形态 | 本端现状（`webview/status-bar.js`） | 结论 |
|---|---|---|---|
| 状态文本段 | `state.status`（Processing / Indexing… / Running: cmd / TPM throttle wait / overloaded / Rate-limited / Waiting: X） | 新增 `statusText` 段（`:31-33`）；活动恢复即清（`chat-status.js:51-56`） | 采用（C-12#1） |
| 当前工具 | ` ${currentTool}…` | `工具: name`（`:45`） | 等价 |
| 计时 | processing ` Ns` | `耗时 Ns`（`:47`） | 等价 |
| 任务 | `✓N/M` | task 徽标 `✓d/total`（`:48`） | 等价 |
| 轮次 | `turn N/M` | `turn N/M`（`:46`）——旧 `轮次 N` 段退役 | 采用（C-12#2） |
| token | `↑X ↓Y ✦R hitN%` | `↑X ↓Y hitN%`（`:31-33`）——✦ 仅 `reasoning_tokens > 0` | 采用（C-12#6） |
| context | `context X% Yk` | `context X%`（`status-bar.js:38-45`——实施后实位；≥80% 警告色） | **消（已落——本端补 `Yk` 绝对数，对齐 CLI 形 `context X% Yk`；#677 I16a）**（本端 pct 源 = 核 `estimateTokens(history)` 分子 ÷ `providerSpec(provider).context`，**与 CLI 状态行同源同式**； |
| | | | 派生单点 = `thincoder-vscode/src/specs.mjs` `ctxPercentForHistory`——详 `WEBVIEW.md` §4.6） |
| 滚动 | `scrolled N` | 悬浮回底钮（`thincoder-vscode/webview/scroll.js:29-34`） | **实证例外（行为证据——滚动状态两端可见：CLI `scrolled N` 文本 ∥ 本端回底钮在场）** |
| 输入提示 / 键位串 | enterHint + 键位串 | 无（按钮 / 占位符承载） | **实证例外（行为证据——提示功能两端在位：CLI 文本提示串 ∥ 本端占位符 + 钮承载）** |
| 横幅 | PLAN / AUTO / ADVISOR / ENG + attention chip | 工具条按钮 active + plan 徽标（`:23`） | **实证例外（行为证据——模式可见面两端在位：CLI 横幅 ∥ 本端工具条态 + plan 徽标）**；attention chip = 范围决定（非端差——权限 / 提问卡流内可见） |
| 后台段 | `后台 N 子代理运行中 · M 完成待消化` | `⏳ …`（`:51-60`——running+queued / pending+done 两段） | 等价 |
| 计时器段（⏰N——timer-wake 阶段 2） | ` │ ⏰N`（状态段簇尾——`thincoder-cli/src/tui/render-frame.mjs:422`；含过期项 ⇒ 警示色） | （已落——`thincoder-vscode/webview/status-bar.js` `⏰N` 段（`:62` 起）；源 = `usage` 载荷 `timers { count, expired }`——本档 §3.2 行 18） | 等价 |
| 静默段（`quiet`） | ` Quiet Xs`（耗时之后——`thincoder-cli/src/tui/render-frame.mjs:406-407` 邻位；zh 值 =「已静默 Xs」——键面单源 = 核字典 `status.quiet`） | `Quiet Xs` 段（`status-bar.js:59-60` 邻位——纯 webview 自算：`running` ∧ 静默 ≥ 10s ⇒ 段在场；**无消息面**〔无协议行 ∕ 无载荷改〕） | |
| | |  | 对齐（语义单源 = `docs/cli/design/TUI.md` §7.7；实现面 = `docs/vsc/design/WEBVIEW.md` §4.7） |

### 6.2 块头字段对位（本端 × CLI）

| 字段 | CLI 形态 | 本端现状 | 结论 |
|---|---|---|---|
| icon | `⏸ / ⏹ / ✓ / ▶`（审批 / 停 / 完成 / 运行——冻结头三态互斥见 `docs/cli/design/TUI.md` §6.8 / M5） | `⏳ / ▶ / ✓ / ⏹ / ⏸`（排队 / 运行 / 完成 / 停 / 审批） | **实证例外（行为证据——排队态两端可见：CLI 状态词 `queued` ∥ 本端 ⏳ + 词）** |
| 键 | `role#N` | 同（label） | 等价 |
| 模式词 | ` · sync/async` | ` · 同步/异步`（family 角色；queued 不携） | 等价（queued 信息走状态区） |
| 状态词·queued | ` · queued` / ` · waiting`（`thincoder-cli/src/tui/subagent-panel.mjs:73` 判定 · `:75` 落地） | ` · ${t("sub.queued")}` / ` · ${t("sub.waiting")}`（en = `queued` / `waiting` 逐字；zh = `排队中` / `等待中`）——选用判据 = 载荷 `kind`：`slot` ⇒ queued、其余（含缺省）⇒ waiting（`WEBVIEW.md` §5.2） | 对齐（C-11② · #118 落） |
| 模型 | ` · model`（宽截断） | ` · model`（**来源 = 事件载荷字段** `model`；键形 `sub:<role>#<id>` **不含模型段**——`WEBVIEW.md` §5.3 键形收正；consult / escalate 头词现状已携该段——`thincoder-render-core/subblocks/activity-view.mjs`（头词段 · I16c 已落）） | **消（已落——consult ∕ escalate 头词补携模型段，对齐 CLI；#677 · I16c）** |
| 计时 | ` · Ns`（done 定格） | ` · Ns`（事件驱动 + 1 s 同点刷——`panels.js:54` → `activity.js:149` `refreshLiveHeaders`） | 语义不变 |
| turn | ` · turn N/M` | ` · turn N/M`（`maxTurns > 0` 且 `turn > 0`；快照 + `status:"turn"` 实时） | 对齐 |
| 状态区·running | `currentTool` + `command≤60`（`thincoder-cli/src/tui/subagent-panel.mjs:103-108`） | `${tool} — ${cmd ≤60}`（嵌套 = `label/tool`——`thincoder-cli/src/tui/subagent-blocks.mjs:337` 同构）/ `思考中…` | 对齐（C-11①；**输出面零写入**——判据单源 = `WEBVIEW.md` §5.2） |
| 状态区·queued | `queued · position N（槽满等位）` / 依赖 detail 原文 | `排队中 · 位置 N（槽满等位）` / 原因原文 | 对齐（C-11②） |
| 审批态 | `等待审批: X` | `⏸` + `等待审批: <tool>`（`thincoder-render-core/subblocks/activity-view.mjs:55` · `:91`） | **已实装**——两端同形 |
| 待消化 | `done · awaiting digestion`（状态区） | 块头态词同文案（`thincoder-render-core/subblocks/activity-view.mjs:92`） | 对齐 |
| 冻结头 + tail-3 | `[✓ key · … · done Ns · turn]` + tail-3（`│ ` 前缀独立行——`render-segments.mjs:101-105`）+ 注记 ` — <note>`（停因 / interrupted——`:88-93`） | `[✓ key · … · done Ns · turn]` + tail-3（`│ ` 前缀——`activity-view.js` `refreshBlock`；容器 = `<details>/<summary>` 原生） | |
| | | + 注记 ` — <note>`（载体 `meta.note`——契约 = `WEBVIEW.md` §5.2；`tailLines` = `thincoder-render-core/subblocks/activity-view.mjs:103`） | 对齐（D4 消：tail-3 行文归一 = `│ ` 前缀独立行） |

### 6.3 i18n 键表（31 键 · zh/en 逐字）

> 键面 = **webview 可渲染键**（消费位见各注）；文案实体 = **核容器** `thincoder-core/i18n.mjs`（投影面）+ **本地档** `thincoder-vscode/locales/{zh,en}.json`（端特有键）——本地档核域键同值副本的处置（摘除消解路径在册）见设计档 `docs/core/design/I18N.md` §3.1 D1（本表只作对照，不复制为第二单源）。
> **端特有键定性**：端特有键 = **显示宿主单侧存在的消费面**（webview 面元素——CLI 无对位）⇒ **非端差**（无对位物——不构成待消端差）：① 消费面仅端侧存在；② 证据 = 各键注内消费点坐标；③ 单源纪律 = W15 D1「容器归一、投影端差」已裁 + 本表收录口径（D3）。核容器键 = 投影单源（本地零重复定义）。

| 键 | zh | en |
|---|---|---|
| `digest.turnLabel` | 自动回合：消化已完成的子代理报告… | [auto-turn: digesting finished subagent reports…] |
| `digest.residue` | 有 ${n} 份后台报告未销账——将自动重投 | ${n} background report(s) not accounted — they will be re-delivered |
| `digest.turnLabelAsk` | 自动回合：答复 ${from}：${msg} | [auto-turn: answering ${from}: ${msg}] |
| `digest.capAuto` | 自动回合：越过轮次上限，继续推进… | [auto-turn: continuing past turn cap…] |
| `digest.capStop` | 自动回合在 ${turns} 轮处停止——部分消化；已完成的报告保留在历史中 | [auto-turn stopped at ${turns} turns — partial digest; finished reports stay in history] |
| `sub.awaitingDigest` | 已完成 · 等待消化 | done · awaiting digestion |
| `sub.queueSlot` | 排队中 · 位置 ${n}（槽满等位） | queued · position ${n} (slot full) |
| `sub.waiting` | 等待中 | waiting |
| `sub.awaitingApproval` | 等待审批: ${tool} | Awaiting approval: ${tool} |
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
| `chat.pending.single` | ⏳ 待发送 · 不打断当前执行，自动发送 | ⏳ Queued · Won't interrupt the current run — sent automatically |
| `chat.pending.multi` | ⏳ 待发送 · ${count} 条消息（不打断当前执行，合并发送） | ⏳ Queued · ${count} messages (won't interrupt the current run, sent together) |
| `chat.pending.more` | … [该条共 ${lines} 行——发送后完整显示] | … [${lines} lines — shown in full once sent] |
| `session.ledgerNotice` | 会话账本异常（${reason}）——打开会话即自动补回 | Session ledger anomaly (${reason}) — opening a session self-heals it |
| `session.ledgerNotice.scene` | 损坏现场档保留 30 天 | Corrupted-scene files kept 30 days |
| `status.timer` | ⏰${n} | ⏰${n} |
| `status.quiet` | 已静默 ${s}s | Quiet ${s}s |
| `sub.follow.new` | ↓ 新内容 | ↓ New output |
| `sub.follow.bottom` | ↓ 回到最新 | ↓ Back to latest |

- `status.quiet`（停滞轻显形静默读数；语义单源 = `docs/cli/design/TUI.md` §7.7）：**核容器键**（住 `thincoder-core/i18n.mjs:50`——本地档不重复定义；zh `已静默 ${s}s` ∕ en `Quiet ${s}s`）；消费面 = 静默段（§6.1 静默段行——`status-bar.js:47` 邻位）；登记依据 = 同轮登记（D3）。

- `sub.follow.new` / `sub.follow.bottom`（块内容窗让位期出口钮两态，机制单源 = `WEBVIEW.md` §5.5）：两键均**端特有键**（住 `thincoder-vscode/locales/{zh,en}.json`——不进核容器）；**无占位符**；选用判据 = 让位期间是否有新行到达（`_subFollowNew`）；
消费面 = 核件 `thincoder-render-core/subblocks/block.mjs` 出口钮（核件取词经 `setStrings` 投影——桌面 `HOST_DICT` 同键同值）。

- **占位符记法**：本端引擎只认 `${k}` 形态（`thincoder-vscode/webview/i18n.js:30`）——照抄 `{n}` 会把字面占位符显示给用户。
- `sub.newBlocks`（出生可见性计数钮，机制单源 = `WEBVIEW.md` §5.5）：键名 / 双语逐字 / 占位符形态（`${n}`）三面以本表为单源；`${n}` = 未钉底期间出生块数。
- `sub.waiting`（queued 状态词对位，机制单源 = `WEBVIEW.md` §5.2）：zh `等待中` / en `waiting`——与既有键 `sub.queued`（zh `排队中` / en `queued`）成对，两键**无占位符**。
  **消费点 = 状态词**（块头方括号内——`thincoder-render-core/subblocks/activity-view.mjs:46-47`）：选用判据 = 载荷 `kind`——`kind === "slot"` → `sub.queued`；否则（**含 `kind` 缺省**）→ `sub.waiting`（CLI `thincoder-cli/src/tui/subagent-panel.mjs:73` 同判据）。
- **状态区（方括号后）键面**（`activity-view.js:89-99`；标尺 = CLI `thincoder-cli/src/tui/subagent-panel.mjs:100-102`）：slot（`kind === "slot"`）→ `sub.queueSlot`；wait / depc → 载荷 `reason` 原文（零改写，无键）；**降级**（`kind` 缺省）→ 有 `reason` 走原文、无 `reason` 中性回落 `sub.queued`（= CLI `queued.detail || "queued"` 同形）。（#118 落）
- `digest.turnLabel`（digest 档 / 缺省档）/ `digest.turnLabelAsk`（ask 档——**携参**） = **核容器键**（本地档不重复定义）；字面单源 = 核容器（CLI 同读容器——零自持字面）；`msg` 截断口径 = 核 `upstreamAskLabelVars`（单行 + ≤120 字符）；`digest.start/done/aborted` 与其余既有键不动；**`digest.residue`**（残余行词键，核容器键）同列；消费面 = 本档 §5 / `WEBVIEW.md` §5.1。
- `tool.interrupted` / `tool.truncated` = **端特有键**（住 `thincoder-vscode/locales/{zh,en}.json`——不进核容器）；消费面 = `WEBVIEW.md` §4.5（M1 清扫状态词 / X5 截断标记）。
- `workspace.required` / `workspace.requiredPlaceholder`= **端特有键**（住 `thincoder-vscode/locales/{zh,en}.json`——不进核容器；无工作区守卫为端面机制，CLI 无对位面）。
  消费面 = `webview/send.js` 出口守卫（拒发 toast）/ `webview/loading.js` `applyBusyLock` 第三态占位符（守卫 > busy > 常态）；机制单源 = `PROJECT-SWITCHER.md` §4.1；登记依据 = 同轮登记（D3）。
- `input.slotFull`= **端特有键**（住 `thincoder-vscode/locales/{zh,en}.json`——不进核容器；CLI 同判据提示为端内字面 `thincoder-cli/src/tui/key-handler.mjs:307`——本键 = 端面成文）。
   消费面 = `webview/send.js` 二次提交守卫 toast（判据 = `WEBVIEW-INPUT.md` §1 C-B2-6 ①）；登记依据 = 同轮登记（D3）。
- `chat.pending.single` / `chat.pending.multi` / `chat.pending.more` = **端特有键**（住 `thincoder-vscode/locales/{zh,en}.json`——不进核容器；**逐字同桌面** `thincoder-desktop/renderer/i18n-views.mjs:65-67` / `:256-258`——两端同形；`${count}` / `${lines}` 按本端 `${k}` 形态）。
   消费面 = 待发送带标签行（单条 ∥ 多条两形）与超限尾标记（`WEBVIEW-INPUT.md` §1 C-B2-6 ⑦）；登记依据 = 同轮登记（D3）。`queued.pending` 随气泡标记面退出 VSC 本地档（核容器键保留——桌面 `markPending` ∥ 服务端仍消费）。
- `session.ledgerNotice`= **端特有键**（住 `thincoder-vscode/locales/{zh,en}.json`——不进核容器）；`${reason}` 值 = `lastReason`（拒写）∥ `"scene"`（仅损坏现场）。
- `session.ledgerNotice.scene`= **端特有键**（同住 locales）；**条件附句**——`scene === true` 时合成「主句 + 「；」+ 附句」（en 分隔符「; 」）；`scene` 缺 / false ⇒ 仅主句（与 CLI 同口径——父侧裁定：**恒附改条件附**）。
   消费面 = 会话下拉首行警示注记（`WEBVIEW.md` §4）；登记依据 = 同轮登记（D3）。
- `status.indexProgress`（W8 索引面归一新键——住本地档）+ 其 sibling `status.indexScan`：消费 = `thincoder-vscode/webview/status-bar.js:129-131`（`statusText` `kind:"index"` 两相位）。
- 审批态键 = `sub.awaitingApproval`（字面 = 本表行）——**已实装**；消费 = `activity-view.js:90`（呈现面 = §6.2 审批态行）。
- `status.timer`（timer-wake 阶段 2）= **符号 + 计数形态**（无文案——两语同值 `⏰${n}`；先例 = 桌面 `thincoder-desktop/renderer/i18n.mjs` 同值）；**端特有键**（住 `thincoder-vscode/locales/{zh,en}.json`——不进核容器）；消费面 = `webview/status-bar.js` `⏰N` 段；登记依据 = 同轮登记（D3）。

## 7. 关键决策记录

| # | 决策 |
|---|---|
| D-P1 | 忙态 = host 单枚举 + **单一广播** + webview 单 reducer |
| D-P2 | Stop 可见性由 `_turnState === "running"` **派生**（susp 不显） |
| D-P3 | `#status-line` 单 writer = `renderStatusBar`（thinking 走 `_phase` 标记） |
| D-P4 | question 卡按 `promptId` 精确匹配（非 shift） |
| D-P5 | `atComplete` 带自增 seq、host 只回显最新 |
| D-P6 | 会话打开 = **单向 boot**：resolve 零内容、`webviewReady` 唯一发射点 |
| D-P7 | digest 轮 = 标签行 + **每轮独立**状态元素 |
| D-P8 | 状态文本载体 = **结构化 `statusText` 消息**（kind 判别 → webview 按 locale 渲染） |
| D-P9 | Send 可见性 = running 期**隐藏** |
| D-P10 | `scrolled N` 段不设——滚动状态 = 悬浮回底钮（§6.1 滚动行：实证例外——行为证据） |
| D-P11 | 协议增量 = **只增不改**、**三十五项**登记（§3.2） |
| D-P12 | 合并权限卡**并入 `promptId` 族**（单一释放通道 `releasePermission` + id 精确匹配 + 孤儿回写） |
| D-P13 | `waiting` 判据含**批权限队列** + **释放即刷**（刷新点 = 释放通道单点 `releasePermission`） |
| D-P14 | 诊断上行 `panelDiag` = **新消息（行 8 登记）**——出生 / 终态事件面痕迹入主侧日志 |
| D-P15 | 忙态排队面 = **输入区上方待发送带（派生 · 非流内）** + **消费前流内零块**；消费推送携 `merged` ⇒ webview 追加恰一枚 user 块（宿主零第二推送点）；忙态零回显 |

## 9. UI / 交互决策落档

| # | 决策 | 状态 |
|---|---|---|
| U-P1 | digest 轮 = 标签行 + 状态行（每轮各一）；cap 行 dim / warn 两档 | 已定（§5 · D-P7） |
| U-P2 | 状态文本段 = 单段（活动恢复即清——无 TTL） | 已定（§6.1 · D-P8） |
| U-P3 | `turn N/M` 段替旧「轮次 N」段；✦ 段条件显（> 0） | 已定（§6.1） |
| U-P4 | Send 隐藏 / Stop 显 = running 派生 | 已定（§4.4 · D-P9） |
| U-P5 | 三条逐条重审（#677）：`scrolled N` → 实证例外（§6.1 滚动行）；ctx 段 → 消（补 `Yk` 绝对数——§6.1 context 行）；键位提示段 → 实证例外（§6.1 输入提示行）；attention chip → 范围决定（非端差） | 已定（§6.1 逐条） |
| U-P6 | 可调常量（批准环节可翻转）：elapsed 刷新节拍（复用 1s）；状态文本保留时长（无 TTL） | 已定（open 面 = 数值，非语义） |
| U-P7 | 合并卡释放形态 = **卡消失**（同移除选择器；不做「已拒绝态」变体） | 已定（§4.6 · `WEBVIEW.md` §4.1） |
| U-P8 | VS Code 状态栏 `waiting` 覆盖**批权限卡**：停驻必读 waiting · 释放即刷（不残留） | 已定（§4.4 · §4.6 · D-P13） |

## 11. 验收与需求回指

| # | 本档覆盖 | 回指 |
|---|---|---|
| 1 | 消息族与演进纪律（基础族 / 机制族 / 三落点 / 只增不改 · **登记表**） | F-W1 · F-W7 · **NFR-A2**（诊断上行 `panelDiag`——§3.2 行 8） |
| 2 | 忙态与消化轮可见指示（`turnState` 收敛 · digest 轮 · cap 行） | F-W7 · N-W1 |
| 3 | 状态行段位与块头字段对位（含端差登记） | F-W7 · N-W6 |
| 4 | 会话标题与消息秩序（promptId / seq / 单向 boot） | F-W2 · F-W3 |
| 5 | 机检（新增档 ≤500 行 · 无 >300 字符单行 · 文档锚零悬空） | N-M3 · N-M2 |
| 6 | 收发面全量对表（§12） | N-W7 |
| 7 | 发面全量对表（§13） | F-W12 · N-W7 |
| 8 | 权限卡族 id 纪律与释放（合并卡同族 · 单释放通道 · 孤儿响应 · **释放即刷新**） | F-W13 |
| 9 | 忙态排队面（待发送带 · 消费前流内零块 · 消费恰一枚 · 回显时机） | F-W22 |

**用例**：用例表归测试层，本档不复制（D2）。

## 12. 收发面全量对表（机检对账）

> 判据权威 = `VSC-DEBT.md` §2.3（机检形态）/ §3.2（枚举口径 + 处置判定）；枚举口径（KD-3）= **只取顶级判别式**——host 侧 = `postMessage` 载荷顶级 `type` / `name`；webview 侧 = 顶级 `switch (msg.type)` 的 `case` ∪ 顶级 `name` 比较字面量。
> 子判别式不单列（`statusText.kind` / `subagent.status` / `compress` 状态族 / `digest` 两型——各为所属消息的载荷变体）；方向 = **host → webview**（webview → host 的发面 = **§13**；两表合称「收发面对表」）。
> **坐标**：本表坐标 = **唯一读值**；历轮坐标收正的时点值住各批档（记录面），本档不复载。

| ① 判别式 | ② host 发射点 | ③ webview 消费位 | ④ 处置 | ⑤ 备注 |
|---|---|---|---|---|
| `aborted` | src/extension/panel-turn-loop.mjs:268/:283 | webview/chat-messages.js:108 | `活` | — |
| `agentSettings` | src/extension/panel-messages.mjs:308/src/extension/panel-settings-push.mjs:103/src/extension/panel-settings-push.mjs:96 | webview/chat-messages.js:158 | `活` | 打开拍回批末位（F-W8——机制与判据单源 = `SETTINGS.md` §2.8） |
| `atResults` | src/extension/panel-index.mjs:80/:84 | webview/chat-messages.js:219 | `活` | — |
| `autoApprove` | src/extension/panel-messages-turn.mjs:194/src/extension/panel-session.mjs:136 | webview/chat-messages.js:157 | `活` | — |
| `busyQueued` | src/extension/panel-messages.mjs:113 | webview/chat-messages.js:114 | `活` | busy 排队队列快照（判据 = 两载体合计条数；host → webview 状态镜像——满队守卫 + 待发送带；**载荷收正 = `{ pending, count, items, merged? }`——`text` 退役**（§3.2 行 17）；消费点五（含步边界 pickup）；登记 = §3.2 行 17） |
| `batchPermissionRequest` | src/extension/permission-gate.mjs:114 | webview/chat-messages.js:216 | `活` | 载荷增 `promptId`（§4.6） |
| `clearMessages` | src/extension/panel-session.mjs:147 | webview/chat-messages.js:120 | `活` | — |
| `complete` | src/extension/panel-callbacks.mjs:228 | webview/chat-messages.js:107 | `活` | — |
| `compress` | src/extension/panel-callbacks.mjs:175/:176/:183 | webview/chat-messages.js:191 | `活` | — |
| `digest` | src/extension/panel-callbacks.mjs:83/thincoder-vscode/src/extension/suspension.mjs:190/:214 | webview/chat-messages.js:194 | `活` | `status` 两型 = 一条消息（over-count #3 已证伪）；载荷增 `tier`（两档——§5 / §3.2 行 11）+ `from` / `msg`（ask 档携参——§3.2 行 14） |
| `error` | src/extension/chat-panel.mjs:406/src/extension/panel-turn-loop.mjs:178/src/extension/panel-turn-stages.mjs:74（共 5 处） | webview/chat-messages.js:109 | `活` | — |
| `goal` | src/extension/panel-callbacks.mjs:184 | webview/chat-messages.js:238 | `活` | — |
| `historyPage` | src/extension/panel-session.mjs:195 | webview/chat-messages.js:131 | `活` | — |
| `i18n` | src/extension/chat-panel.mjs:192/src/extension/panel-messages.mjs:307 | webview/chat-messages.js:58 | `活` | — |
| `indexStatus` | src/extension/panel-index.mjs:55 | webview/chat-messages.js:228 | `活` | 打开拍回批（`_pushIndexStatus`——F-W8） |
| `loading` | src/extension/chat-panel.mjs:413/src/extension/panel-chat.mjs:216/src/extension/panel-turn-stages.mjs:156 | webview/chat-messages.js:98 | `活` | — |
| `mcpStatus` | src/extension/panel-mcp.mjs:121 | webview/chat-messages.js:222 | `活` | — |
| `mcpTestResult` | src/extension/panel-mcp.mjs:157 | webview/chat-messages.js:227 | `活` | — |
| `mcpTools` | src/extension/panel-messages-settings.mjs:135/:137 | webview/chat-messages.js:226 | `活` | — |
| `models` | src/extension/panel-session.mjs:159/src/extension/settings.mjs:401 | webview/chat-messages.js:142 | `活` | — |
| `permissionRequest` | src/extension/permission-gate.mjs:73 | webview/chat-messages.js:202 | `活` | — |
| `permissionWithdrawn` | src/extension/panel-messages-turn.mjs:209/src/extension/permission-gate.mjs:42 | webview/chat-messages.js:209 | `活` | 第二发射点 = 孤儿响应回写（`batchPermissionResponse` 零命中 ⇒ 可见处置——§4.6） |
| `planMode` | src/extension/panel-callbacks.mjs:158/src/extension/panel-session.mjs:141/src/extension/panel-settings-push.mjs:62（共 4 处） | webview/chat-messages.js:233 | `活` | — |
| `project` | src/extension/panel-project.mjs:27 | webview/chat-messages.js:141 | `活` | — |
| `providerError` | thincoder-vscode/src/extension/settings.mjs:311（助手 `postProviderError`——**19 站点**汇聚——#695） | webview/chat-messages.js:154 | `活` | 载荷 v2 = `{ scope, reason }`（#640——§3.2 行 20）；段标 + 词化码 ∕ 单槽驻留（机制单源 = `SETTINGS.md` §2.15）； |
| | | | | ②③ 列 = 计数终值复核（#695） |
| `providerContextSaved` | src/extension/panel-messages-settings.mjs:130-151（`handleSaveProviderModelContext`——成功径才发） | webview/chat-messages.js:170 | `活` | 模型上下文声明保存**受理回执**（`{ name, model, k, kText }`——`kText` = 宿主经核 `formatDeclaredContextK(k)` 出词；`k === null` = 清除径；拒径零回执 ∥ 零落盘，拒因走既有 `providerError`；语义单源 = `SETTINGS.md` §2.21）；消费转发 → `webview/settings-providers.js:76-90`；§3.2 行 35 |
| `providerKeySaved` | src/extension/panel-messages-settings.mjs:43-44（`handleSaveProviderKey`） | webview/chat-messages.js:160 | `活` | 密钥行保存**受理回执**（#1053——实施落地；成功径才发，拒径零回执 ⇒ 徽标零闪 ∥ 行不关——拒因走既有 `providerError`；回执语义单源 = `SETTINGS.md` §2.18）；消费转发 → `webview/settings-providers.js:97` `onProviderKeySaved`（恢复静态行 + `flashSaved`）；§3.2 行 25 |
| `providerStatus` | thincoder-vscode/src/extension/settings.mjs:340 | webview/chat-messages.js:143 | `活` | 载荷增 `status.providerState`（核统一解析三态 = `{ state, channel, model, reason, invalidReason }`——#841；`keyOk := 非 invalid 类`） |
| `proxySettings` | src/extension/panel-settings-push.mjs:104/:93 | webview/chat-messages.js:171 | `活` | 打开拍回批（F-W8） |
| `proxyTestResult` | src/extension/panel-messages-settings.mjs:204 | webview/chat-messages.js:174 | `活` | — |
| `question` | src/extension/panel-callbacks.mjs:55 | webview/chat-messages.js:177 | `活` | — |
| `questionCancelled` | src/extension/panel-callbacks.mjs:62 | webview/chat-messages.js:180 | `活` | — |
| `reasoning` | src/extension/panel-callbacks.mjs:145 | webview/chat-messages.js:61 | `活` | — |
| `secretInput` | src/extension/panel-callbacks.mjs:88（`makeAskSecretInPanel`） | webview/chat-messages.js:207 | `活` | 凭据 / 秘密输入卡（载荷 `{ payload, promptId }`——核 `onSecretInput` 原样透传；**值只在返回路**；§3.2 行 32） |
| `secretInputCancelled` | src/extension/panel-callbacks.mjs:93（onAbort——摘卡） | webview/chat-messages.js:210 | `活` | abort 释放未答凭据卡（`questionCancelled` 同构；§3.2 行 34） |
| `sessions` | src/extension/panel-session.mjs:262 | webview/chat-messages.js:134 | `活` | 载荷增 `ledger`（账本异常注记；渲染 / 文案 = `WEBVIEW.md` §4）；② 列 = 实施后现位 |
| `shellCandidates` | src/extension/panel-messages-settings.mjs:187/src/extension/panel-settings-push.mjs:106/src/extension/panel-settings-push.mjs:95 | webview/chat-messages.js:168 | `活` | 打开拍回批（F-W8）；另有 `getShellCandidates` 拉取路径 |
| `statusText` | src/extension/panel-callbacks.mjs:168/src/extension/panel-index.mjs:29 | webview/chat-messages.js:200 | `活` | `kind` 族 = 载荷变体（不单列——over-count #1 已证伪） |
| `sub:*` | src/extension/panel-subagent-relay.mjs:139/:141 | webview/chat-messages.js:237 | `活` | 动态段归一（`sub:<role>#<id>` → `sub:*`）；role 段 = **键文法 `[\w-]+`**（含 consult / escalate——键形收正见 `WEBVIEW.md` §5.3）； |
| | | | | `thincoder-render-core/subblocks/activity-view.mjs:14` 的 `FAMILY_ROLES` 只判 ⏹ 可见性 / sync-async 词，**非**键枚举 |
| `subagent` | src/extension/panel-subagent-relay.mjs:215/:221/src/extension/suspension.mjs:91/:97 | webview/chat-messages.js:234 | `活` | `status` 族 = 载荷变体（不单列——over-count #2 已证伪）；载荷增 `note`（X6 停因注记）/ `syncLive`（X10 可中止事实——§3.2 行 12） |
| `subagentApproval` | src/extension/panel-subagent-relay.mjs:215/:221 | webview/chat-messages.js:237 | `活` | — |
| `suspension` | src/extension/panel-messages.mjs:331/thincoder-vscode/src/extension/suspension.mjs:137/:146 | webview/chat-messages.js:239 | `活` | 载荷增 `interrupted`（X11 会话中止注记——§3.2 行 13） |
| `taskProgress` | src/extension/panel-callbacks.mjs:156 | webview/chat-messages.js:232 | `活` | — |
| `testProviderResult` | src/extension/panel-messages-settings.mjs:116 | webview/chat-messages.js:165 | `活` | 载荷 + `id` 回显（请求归属——webview 落框按 id 比对：缺 / 不符 ⇒ 弃；#1051——§3.2 行 26） |
| `timer` | thincoder-vscode/src/extension/timer-watch.mjs:39 | webview/chat-messages.js:199 | `活` | timer-wake 阶段 2 触发落流一行（载荷 `{ status:"fired", text }`——§3.2 行 19 登记；`text` = 交付原文逐字 · 显示裁 ≤3 行 + `…` = webview 侧）；② ③ 列 = 提取器（`--emit`）读数 |
| `token` | src/extension/panel-callbacks.mjs:141 | webview/chat-messages.js:60 | `活` | — |
| `toolCall` | src/extension/panel-callbacks.mjs:201 | webview/chat-messages.js:67 | `活` | 载荷增 `round` · `model`（X2——advisor 专属，非 advisor 零字段——§3.2 行 9） |
| `toolOutput` | src/extension/panel-callbacks.mjs:224 | webview/chat-messages.js:78 | `活` | `text` 端边界归一为串（M3——非串取 `.text`）；`kind` 可选随行 |
| `toolPanel` | src/extension/panel-subagent-relay.mjs:124-126 | webview/chat-messages.js:240 | `活` | — |
| `toolResult` | src/extension/panel-callbacks.mjs:215 | webview/chat-messages.js:77 | `活` | 载荷增 `truncated`（X5——64K 切片点事实旗标——§3.2 行 10） |
| `turnBreak` | src/extension/panel-callbacks.mjs:151 | webview/chat-messages.js:62 | `活` | — |
| `turnFrame` | src/extension/panel-callbacks.mjs:170 | webview/chat-messages.js:201 | `活` | — |
| `turnState` | src/extension/chat-panel.mjs:255/src/extension/panel-messages.mjs:306 | webview/chat-messages.js:100 | `活` | — |
| `uiPrefs` | thincoder-vscode/src/extension/ui-prefs.mjs:13 | webview/chat-messages.js:161 | `活` | 视图偏好三键（缺省 true ∥ 32 ∥ 3；#875——§3.2 行 23）；发射两面 = webviewReady 握手 + 设置变更（`onDidChangeConfiguration`——变更重推）；消费 → `webview/ui-prefs.js` `applyUiPrefs`（三面应用 ∥ 缺键 / 坏值 ⇒ 缺省） |
| `usage` | src/extension/panel-callbacks.mjs:193 | webview/chat-messages.js:231 | `活` | — |
| `userMessage` | src/extension/chat-panel.mjs:280 | webview/chat-messages.js:59 | `活` | — |
| `websearchSettings` | src/extension/panel-settings-push.mjs:105/:94 | webview/chat-messages.js:162 | `活` | 打开拍回批（F-W8） |
| `workspaceGuard` | src/extension/workspace-guard.mjs:38 | webview/chat-messages.js:103 | `活` | 无工作区守卫态（拒启 + 提示；判据 / 守卫面 / 提示面 = `PROJECT-SWITCHER.md` §4.1） |

**方向口径**：上表只收 host → webview（webview → host 的 `postMessage` 不列——发面表 = §13）。**「删」= 消费位在位而发射恒无（死码）**。**「补」行 = 本表现零行**。

**打开拍回批（F-W8）**：`getAgentSettings` 回批按 `indexStatus → providerStatus · proxySettings · websearchSettings · shellCandidates → agentSettings（末位）` 序推——机制与判据单源 = `SETTINGS.md` §2.8（本表只记 ② 列发射点；协议形态零增）。

## 13. 发面全量对表（webview → host · 机检对账）

> 判据权威 = `VSC-DEBT.md` §2.3（机检形态）/ §3.2（枚举口径 + 处置判定）；枚举口径 = **只取顶级判别式**——webview 侧 = `postMessage` 载荷顶级 `type` 字面量；host 侧 = 分发档（`panel-messages*.mjs`）顶级 `case` 标签。
> 方向 = **webview → host**（§12 = 收面；两表合称「收发面对表」）；子判别式不单列。
> **坐标**：本表坐标 = **唯一读值**；历轮坐标收正的时点值住各批档（记录面），本档不复载。
> 形态登记（fail-closed——不静默漏计数）：载荷字面量四形态 = 对象字面量（多数）· 三元双分支（`editMcp` / `saveMcpServer`）· 局部对象绑定（`question.js` 的 `payload`）· 局部箭头函数返回字面量（`permission.js` 的 `reply`）；未登记形态 ⇒ 提取器点名失败。

| ① 判别式 | ② webview 发射点 | ③ host 消费位 | ④ 处置 | ⑤ 备注 |
|---|---|---|---|---|
| `abort` | webview/input.js:26 | src/extension/panel-messages.mjs:260 | `活` | — |
| `addProvider` | webview/onboarding.js:67（预设形直发位；首启交棒调用位 = `:63`——携 `key` 预填且**分支先于 key 校验**（空键亦交棒）· #1041）/webview/settings-provider-dialog.js:253（表单提交位——`custom` ∥ `preset` 两形发点）（共 2 处——`settings-providers.js:146 ∥ :148` 两发点随表单迁入新档） | src/extension/panel-messages.mjs:279 | `活` | 载荷 + `proxy`（可选布尔——添加表单「走 proxy」勾选；`docs/vsc/design/SETTINGS.md` §2.16）；**页脚「+ Add provider…」发送点退场（#1054）**——核 `thincoder-render-core/composer/model-menu.mjs:308` 的 `post("addProvider")` 由 VSC 桥 `webview/input.js` OUT 表接为**本地面动作**（开添加弹窗——零出站；`SETTINGS.md` §2.17 ③）；host 无载荷 else 支（QuickPick 增流程）同批净删 |
| `atComplete` | thincoder-render-core/composer/atmenu.mjs:50 | src/extension/panel-messages.mjs:268 | `活` | — |
| `batchPermissionResponse` | webview/permission.js:18（发射位——字面量构造 `:12`） | src/extension/panel-messages.mjs:270 | `活` | 载荷增 `promptId`（三发点同携——§4.6）；形状 = 局部箭头函数 |
| `buildIndex` | webview/settings-tools.js:83 | src/extension/panel-messages.mjs:291 | `活` | — |
| `cancelSubagent` | webview/chat.js:84 | src/extension/panel-messages.mjs:261 | `活` | 路由含 **sync 分支**（`src/extension/panel-messages-turn.mjs` `handleCancelSubagent`——X10；池条目优先） |
| `deleteEmbedKey` | webview/settings-tools.js:28 | src/extension/panel-messages.mjs:287 | `活` | — |
| `deleteMcpServer` | webview/settings-mcp.js:182 | src/extension/panel-messages.mjs:278 | `活` | — |
| `deleteProviderKey` | （无发射点——`_delKey` 死码已清 · #1040） | src/extension/panel-messages.mjs:276 | `活`（协议保留——「仅删钥」入口另议） | — |
| `deleteSession` | webview/session-bar.js:131 | src/extension/panel-messages.mjs:248 | `活` | — |
| `deleteWebsearchKey` | webview/settings-tools.js:46 | src/extension/panel-messages.mjs:289 | `活` | — |
| `editMcp` | webview/settings-mcp-dialog.js（实施后回填坐标——表单族随拆档迁出 `settings-mcp.js`；原 `:134`） | src/extension/panel-messages.mjs:277 | `活` | 三元双分支（同点 `saveMcpServer`）；弹窗体（添加入口弹窗统一批 · #1054——表单入弹窗，§2.17 ①） |
| `getAgentSettings` | webview/settings.js:103 | src/extension/panel-messages.mjs:295 | `活` | 回批 = §12 打开拍（本档 §12 方向口径） |
| `getMcpStatus` | webview/settings-mcp.js:148 | src/extension/panel-messages.mjs:292 | `活` | — |
| `getShellCandidates` | webview/settings.js:40 | src/extension/panel-messages.mjs:352 | `活` | — |
| `interrupt` | webview/input.js:27 | src/extension/panel-messages.mjs:262 | `活` | — |
| `loadOlder` | webview/history.js:87 | src/extension/panel-messages.mjs:268 | `活` | — |
| `mcpTools` | webview/settings-mcp.js:192 | src/extension/panel-messages.mjs:293 | `活` | — |
| `newSession` | webview/session-bar.js:10 | src/extension/panel-messages.mjs:249 | `活` | — |
| `openDiff` | webview/permission.js:16（发射位——字面量构造 `:10`） | src/extension/panel-messages.mjs:264 | `活` | — |
| `openFile` | webview/chat.js:65 | src/extension/panel-messages.mjs:263 | `活` | — |
| `panelDiag` | webview/activity-diag.js:81 | src/extension/panel-messages.mjs:337 | `活` | §3.2 行 8——诊断上行（`{ kind:"subTrace", entries }`；批内合并——最多一消息 / 批）；主侧 `logEvent("ev:subtrace", …)` 一行 |
| `permissionResponse` | webview/permission.js:17（发射位——字面量构造 `:11`） | src/extension/panel-messages.mjs:269 | `活` | 形状 = 局部箭头函数 |
| `questionResponse` | webview/question.js:16（发射位——绑定 `:15`） | src/extension/panel-messages.mjs:266 | `活` | 形状 = 局部对象绑定 |
| `queuedUserMessage` | thincoder-render-core/composer/panel.mjs:352 | src/extension/panel-messages.mjs:232 | `活` | busy 期排队注入上行（busy 即排队面 = `running`——**webview 流内零气泡**（待发送带在输入区上沿）+ host 队列载体两态（容量 8）：`_busyQueued` ∥ `susp.pendingInput`；登记 = §3.2 行 16 ∥ `WEBVIEW-INPUT.md` §1 C-B2-6 ⑦） |
| `reconnectMcp` | webview/settings-mcp.js:213 | src/extension/panel-messages.mjs:279 | `活` | — |
| `recordAppend` | webview/activity.js:124（归档派生点调用——`archiveBlock` 幂等守卫内恰一次；载荷字面量构造 `:190`） | src/extension/panel-messages.mjs:287 | `活` | 留档记录出站（subagent 快照——§3.2 行 22）；形 ∥ 判据单源 = `docs/core/design/SESSION.md` §6.26；处理体 = `handleRecordAppend`（`panel-messages.mjs:123-134`——活行载体 + 核 `pushRecord`；fail-soft）；② ③ 列 = 提取器读数（VSC 舱交付随落笔——新增行） |
| `removeProvider` | thincoder-render-core/composer/model-menu.mjs:304/webview/settings-providers.js:51 | src/extension/panel-messages.mjs:280 | `活` | — |
| `renameSession` | webview/session-bar.js:68 | src/extension/panel-messages.mjs:249 | `活` | — |
| `retry` | webview/ui.js:171 | src/extension/panel-messages.mjs:251 | `活` | — |
| `saveAgentSettings` | webview/settings-agent.js:145 | src/extension/panel-messages.mjs:294 | `活` | — |
| `saveEmbedKey` | webview/settings-tools.js:18 | src/extension/panel-messages.mjs:286 | `活` | — |
| `saveMcpServer` | webview/settings-mcp-dialog.js（实施后回填坐标——表单族随拆档迁出 `settings-mcp.js`；原 `:134`） | src/extension/panel-messages.mjs:277 | `活` | 三元双分支（同点 `editMcp`）；弹窗体（添加入口弹窗统一批 · #1054——表单入弹窗，§2.17 ①） |
| `saveProviderKey` | webview/settings-providers.js:37 | src/extension/panel-messages.mjs:275 | `活` | — |
| `saveProviderModelContext` | webview/settings-provider-dialog.js（表单保存上发；入口 = `settings-providers.js:120` `Context…`） | src/extension/panel-messages.mjs:318 | `活` | 载荷 `{ name, model, k }`（K 单位正整数；空 = 清除）；回执 = `providerContextSaved`（`{ name, model, k, kText }`——`kText` = 宿主经核 `formatDeclaredContextK(k)` 出词；§3.2 行 35；语义单源 = `SETTINGS.md` §2.21） |
| `saveProxySettings` | webview/settings-env.js:113 | src/extension/panel-messages.mjs:351 | `活` | 载荷 = 逐字段（`SETTINGS.md` §2.8） |
| `saveShellSettings` | webview/settings-env.js:129/:144 | src/extension/panel-messages.mjs:350 | `活` | F-W11 接线落地（`SETTINGS.md` §2.9）；空值 ⇒ 删键 = 路径册 #2（`System default` 显式项） |
| `saveWebsearchKey` | webview/settings-tools.js:36 | src/extension/panel-messages.mjs:288 | `活` | — |
| `secretInputResponse` | webview/secret-input.js:23（发射位——字面量构造 `:21`） | src/extension/panel-messages.mjs:297 | `活` | 凭据卡应答（提交 = 值包 ∥ 取消 = `null`；host 侧 `handleSecretInputResponse`（`panel-messages-turn.mjs:175-188`）按 `promptId` 配对；§3.2 行 33） |
| `selectModel` | webview/input.js:31 | src/extension/panel-messages.mjs:229 | `活` | 忙期照写（钮面零门；落盘保护 = 偏好键单写者——`WEBVIEW.md` §4.2）· 会话选定写回 —— `WEBVIEW.md` §4.10 |
| `selectReasoning` | webview/input.js:32 | src/extension/panel-messages.mjs:239 | `活` | 忙期照写（同上——`WEBVIEW.md` §4.2） |
| `setAdvisorGuard` | webview/input.js:37/webview/settings-agent.js:167 | src/extension/panel-messages.mjs:346 | `活` | — |
| `setAutoApprove` | webview/input.js:36 | src/extension/panel-messages.mjs:267 | `活` | — |
| `setEngineeringEnabled` | webview/input.js:38 | src/extension/panel-messages.mjs:347 | `活` | — |
| `setKey` | webview/input.js:35 | src/extension/panel-messages.mjs:282 | `活` | — |
| `setPlanMode` | webview/input.js:39 | src/extension/panel-messages.mjs:348 | `活` | — |
| `setProject` | webview/session-bar.js:148 | src/extension/panel-messages.mjs:250 | `活` | — |
| `setProviderProxy` | webview/settings-providers.js:45 | src/extension/panel-messages.mjs:284 | `活` | — |
| `switchSession` | webview/session-bar.js:62 | src/extension/panel-messages.mjs:247 | `活` | — |
| `testMcp` | webview/settings-mcp.js:208 | src/extension/panel-messages.mjs:281 | `活` | — |
| `testProvider` | webview/settings-provider-dialog.js:228（表单拉取位） | src/extension/panel-messages.mjs:290 | `活` | 载荷 + `proxy`（可选布尔——勾选 ⇒ 探针按 `probeTargetOf` 逐渠判定；未勾 ∥ 缺省 ⇒ 直连；§vsc `SETTINGS.md` 2.16 ③′）+ `id`（请求归属单源——与 `testProviderResult` 回显配对；#1051——§3.2 行 26） |
| `testProxy` | webview/settings-env.js:99 | src/extension/panel-messages.mjs:355 | `活` | — |
| `userMessage` | thincoder-render-core/composer/panel.mjs:341 | src/extension/panel-messages.mjs:204 | `活` | 双向同判别式（收面回显行 = §12） |
| `webviewReady` | webview/chat.js:141 | src/extension/panel-messages.mjs:293 | `活` | — |

**方向口径**：本表只收 webview → host。**「删」= host 消费位在位而 webview 发射恒无（死 handler）**——**本表现零 `删` 行**；**删除落地 ⇒ 源零位 ⇒ 表行同步退场**（不留悬空行——同 §12 口径）。**「补」= 发射在位而 host 缺消费位**（本表现零行）。

