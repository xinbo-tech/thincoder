# 主会话输入禁排队（INPUT-LOCK-ASYNC——C'）

> 板块：挂起回合/输入 UI（双端——主会话 busy 禁输入——排队废弃）。权威源：AGENT-LOOP.md §9（挂起回合/digest）+ §24 R15（排队合并——本批废弃）。
> 状态：**设计待评审**——2026-09-09 落档（禁排队勘察 explore 一手——busy 判据 state.processing 统一——门禁落点 key-handler L265——R15 废弃面 + 释放窗口/abort 承诺边界）。需求：TODO 主会话输入禁排队（C'——digest 意图污染演进——用户裁 Q1 整键吞 + Q2 白名单保留）。

---

## 需求

- **总体目标**：去掉主会话输入排队——主会话 busy（普通回合 processing + digest auto-turn）→ **输入禁用**——空闲（含纯后台池跑）→ 开放立即处理——排队机制（pendingInput/R15 攒批/queue UI）废弃——digest 后置意图污染从源头根除。
- **功能性**：
  - F-1 busy 判据统一 = `state.processing`（普通回合 + digest 都经 runAgentTurn——一处门禁覆盖）
  - F-2 门禁落点 key-handler.mjs L265 原位（权限/问答/搜索模态之后——不误伤模态输入；Ctrl+C 全停 + Ctrl+I 注入在其前保留——显式打断通道不属排队）
  - F-3 processing 期用户输入 = 整键吞 + busy 提示（Q1——输入框标题 " Processing... " 保持 + 状态栏 "主会话处理中——输入恢复后可发"）
  - F-4 斜杠白名单（/exit /help /model 等）保留直执行（Q2——紧急控制通道不排队）
  - F-5 R15 攒批废弃（planQueuedInput/formatMergedMessages/MAX_MERGE 双端删）
  - F-6 pendingInput 收敛单槽（忙时禁用 → 至多一条待交接——key-handler Enter 填单槽 + 唤醒——driver 消费清槽）
  - F-7 queue UI 死代码删（renderQueue/状态栏 queue 提示/Ctrl+D/❯ You: (from queue) 标签）
  - F-8 **保留承诺**：释放窗口竞态守卫（偏差 #1）+ abort/兜底消息零丢失（AC-S2）——单消息交接等价物替代（不随 R15 删）
  - **范围边界**：挂起态空闲输入开放（纯后台池跑 + 主空闲——driver waitForSettleOrWake 路径保留）；digest 呈现层标签（auto-turn 横幅——纯呈现入 state.lines 非 history）保留不新增；模态（question/permission/search）输入不受门禁影响。

## 设计（勘察骨架——照做勿自行解释）

### CLI
1. **key-handler.mjs**：L265 `if (state.processing)` 块——"allow input queued" 注释处改**输入禁用**（字符/Enter 整键吞 + busy 提示；斜杠白名单 L333 直执行保留）——L269-275 Ctrl+D 删——L377 挂起 Enter 分支单槽化（pendingInput 填 + 唤醒——digest 期因 processing 禁用不会到这——仅挂起空闲触达）
2. **index.mjs submit**（L328-355）：processing 分支删/改拒（直执行白名单外）
3. **suspension-drive.mjs**：L23-70 R15 纯函数删（export 面清）+ L233/L253-279 单槽化（双源收敛单消息交接）+ L326-330 残余单消息化（abort 零丢失保留）
4. **agent-turn.mjs**：L286-291 释放窗口兜底单消息化（守卫保留）+ L296-308 queue 循环收敛（攒批删——单消息续发）
5. **render-frame.mjs/layout.mjs**：queue 面板/queueHint/"Enter: send (queue)" 删——改 busy 提示文案
6. **AGENT-LOOP.md/TUI.md**：§9.2 状态机行表（D-S5 L465 改禁输入）、§9.3 触发判据（无 pendingInput 句改）、§9.5 残项单消息、§11.3 R15 全文废弃记录、模块地图行数

### VSC（对位 _turnState 状态机）
1. **loading.js setLoading**（L31-48——现恒 inputEl.disabled=false）：改为派生 `_turnState==="running"` 锁输入 + 占位符文案
2. **send.js send() 出口守卫**：processing 拒（白名单外）
3. **panel-messages routeUserTurn**（L52-75）：running 分支由入队改拒绝/禁用——messageQueued UI 删
4. **chat-panel/panel-chat**：_suspQueue/pendingInput/攒批（popQueuedTurn/buildMergedMessage/suspension.mjs:25-88）删/单槽化——释放窗口守卫 + abort 零丢失保留
5. question/permission 独立 webview 控件——textarea 锁不影响——runTurn/send 门禁放行模态提交

### 测试
- CLI：新纯函数测试（busy 门禁谓词 + 单槽交接——无既有 TUI 单测——新建）+ busy 提示文案断言
- VSC：chat-panel.test.mjs（_suspQueue/messageQueued 语义更新）+ webview-turnstate/activity-flow 族随改

## 受影响文件（双端）

| 文件 | 端 | 改动 |
|---|---|---|
| src/tui/key-handler.mjs | CLI | L265 禁输入门禁 + Ctrl+D 删 + 单槽化 |
| src/tui/index.mjs | CLI | submit processing 分支改拒 |
| src/tui/suspension-drive.mjs | CLI | R15 删 + 单槽化 + 残余单消息 |
| src/tui/agent-turn.mjs | CLI | 兜底单消息 + queue 循环收敛 |
| src/tui/render-frame.mjs + layout.mjs | CLI | queue UI 删 + busy 提示 |
| src/tui/loading.js | VSC | running 锁输入 |
| webview/send.js | VSC | send 出口守卫 |
| src/extension/panel-messages.mjs | VSC | routeUserTurn 改拒 + messageQueued 删 |
| src/extension/chat-panel.mjs + suspension.mjs | VSC | 攒批/队列删 + 单槽 + 守卫保留 |
| docs/design/AGENT-LOOP.md + TUI.md | 双端 | R15 废弃 + 状态机改 |
| test/ | 双端 | 新门禁/单槽测试 + 既有更新 |

## 用例表（正常/边界/错误）

| 用例 | 输入 | 预期输出 |
|---|---|---|
| 普通回合 processing 输入 | 忙时打字 + Enter | 整键吞 + busy 提示——F-3 |
| digest 期输入 | digest 跑 + Enter | 整键吞（processing 同判据）——F-3 |
| 斜杠白名单忙时 | /exit /help | 直执行——F-4 |
| 挂起空闲输入 | 纯后台池跑 + Enter | 开放——立即用户回合——F-1 |
| 释放窗口 Enter | 回合尾池将活 + Enter | 单槽交接（守卫保留）——F-8 |
| abort 残项 | 会话中止 + 有未发消息 | 单消息转普通回合（零丢失）——F-8 |
| 模态输入 | question/permission 弹层 | 不受门禁影响——范围边界 |
| R15 攒批 | 无（机制废弃） | 无攒批——单消息逐发——F-5 |

## 验收

- AC-1 busy（processing 含 digest）输入禁用（门禁测试——普通回合 + digest 两态）
- AC-2 空闲（挂起纯池）输入开放（立即处理）
- AC-3 斜杠白名单忙时直执行（/exit /help /model）
- AC-4 R15 废弃零残留（grep planQueuedInput/formatMergedMessages 双端）
- AC-5 释放窗口守卫 + abort 零丢失保留（单槽交接测试）
- AC-6 模态输入不受门禁影响
- AC-7 双端锁步（CLI/VSC 禁输入语义 diff 核——_turnState running vs processing）
- AC-8 测试绿（双端 npm test 快层——既有零回归）
- 红线：Ctrl+C 全停 + Ctrl+I 注入保留；digest 呈现标签保留；消息协议名零改

## 变更记录
- 2026-09-09：落档（勘察一手——busy 判据统一 processing + 门禁落点 + R15 废弃面 + 释放窗口/abort 承诺边界——Q1 整键吞 + Q2 白名单保留用户裁）。
