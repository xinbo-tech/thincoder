# 主会话输入禁排队（INPUT-LOCK-ASYNC——C'）

> 板块：挂起回合/输入 UI（双端——主会话 busy 禁输入——排队废弃）。权威源：AGENT-LOOP.md §9（挂起回合/digest）+ §24 R15（排队合并——本批废弃）。
> 状态：**评审通过——已交付（CLI e79aa5b/4811832 + VSC 71a175c/0f5bab8——clean——L2 待链稳定）**——2026-09-09 落档

---

## 需求

- **总体目标**：去掉主会话输入排队——主会话 busy（普通回合 processing + digest auto-turn）→ **输入禁用**——空闲（含纯后台池跑）→ 开放立即处理——排队机制（pendingInput/R15 攒批/queue UI）废弃——digest 后置意图污染从源头根除。
- **功能性**：
  - F-1 busy 判据统一 = `state.processing`（普通回合 + digest 都经 runAgentTurn——一处门禁覆盖）
  - F-2 门禁落点 key-handler.mjs L265 原位（权限/问答/搜索模态之后——不误伤模态输入；Ctrl+C 全停 + Ctrl+I 注入在其前保留——显式打断通道不属排队）
  - F-3 processing 期用户输入 = **字符照进输入框回显——仅非白名单 Enter 提交被吞**（Q1 + 评审 #2
    (i) 裁定——"吞" = 吞提交非吞字符——输入框标题 " Processing... " 保持 + 状态栏提示 + 提交时 busy
    提示）
  - F-4 斜杠白名单（/exit /help /model 等）保留直执行（Q2——紧急控制通道不排队——评审 #2：白名单行
    键入即直执行——不经提交吞——白名单检查在 L265 门禁前/内先于吞判）
  - F-5 R15 攒批废弃（planQueuedInput/formatMergedMessages/MAX_MERGE 双端删）
  - F-6 pendingInput 收敛单槽（忙时禁用 → 至多一条待交接——key-handler Enter 填单槽 + 唤醒——driver 消费清槽）
  - F-7 queue UI 死代码删（renderQueue/状态栏 queue 提示/Ctrl+D/❯ You: (from queue) 标签）
  - F-8 **保留承诺**：释放窗口竞态守卫（偏差 #1）+ abort/兜底消息零丢失（AC-S2）——单消息交接等价物替代（不随 R15 删）
  - **范围边界**：挂起态空闲输入开放（纯后台池跑 + 主空闲——driver waitForSettleOrWake 路径保留）；digest 呈现层标签（auto-turn 横幅——纯呈现入 state.lines 非 history）保留不新增；模态（question/permission/search）输入不受门禁影响。

## 设计（勘察骨架——照做勿自行解释）

### CLI
1. **key-handler.mjs**：L265 `if (state.processing)` 块——"allow input queued" 注释处改**提交吞（评审 #2 (i)：字符照进
   输入框回显——非白名单 Enter 提交吞 + busy 提示——白名单行 L333 直执行——检查先于吞判）**——L269-275
   Ctrl+D 删——L377 挂起 Enter 分支单槽化（pendingInput 填 + 唤醒——digest 期因 processing 禁用提交不会
   到这——仅挂起空闲触达）
2. **index.mjs submit**（L328-355）：processing 分支删/改拒（直执行白名单外）
3. **suspension-drive.mjs**：L23-70 R15 纯函数删（export 面清）+ L233/L253-279 单槽化（双源收敛单消息交接）+ L326-330 残余单消息化（abort 零丢失保留）
4. **agent-turn.mjs**：L286-291 释放窗口兜底单消息化（守卫保留）+ L296-308 queue 循环收敛（攒批删——单消息续发）
5. **render-frame.mjs/layout.mjs**：queue 面板/queueHint/"Enter: send (queue)" 删——改 busy 提示文案
6. **AGENT-LOOP.md/TUI.md**：§9.2 状态机行表（D-S5 L465 改禁输入）、§9.3 触发判据（无 pendingInput 句改）、§9.5 残项单消息、§11.3 R15 全文废弃记录、模块地图行数

### VSC（对位 _turnState 状态机）
1. **loading.js setLoading**（L31-48——现恒 inputEl.disabled=false）：改为派生 `_turnState==="running"` 锁输入
   + 占位符文案——评审 #3：VSC digest 属 running 已含（chat-panel.mjs:50 "running = 回合（含会话内
   digest/用户回合）执行中" 实证——设计明示不需改逻辑）
2. **send.js send() 出口守卫**：processing 拒（白名单外）
3. **panel-messages routeUserTurn**（L52-75）：running 分支由入队改拒绝/禁用——messageQueued UI 删
4. **chat-panel/panel-chat**：_suspQueue/pendingInput/攒批（popQueuedTurn/buildMergedMessage/suspension.mjs:25-88）删/单槽化——释放窗口守卫 + abort 零丢失保留
5. question/permission 独立 webview 控件——textarea 锁不影响——runTurn/send 门禁放行模态提交

### 测试
- CLI：新纯函数测试（busy 门禁谓词 + 单槽交接——无既有 TUI 单测——新建）+ busy 提示文案断言
- VSC：chat-panel.test.mjs（_suspQueue/messageQueued 语义更新）+ webview-turnstate/activity-flow 族随改

## 受影响文件（双端——评审 #2 实测行数 + 净变——>300 审视注）

> 档位：全 <500 硬限——本批删为主净减（R15/queue 废弃 + 门禁改造）——无跨档风险——VSC panel-chat
> 497 逼近 500（既有——本批净减——记录最热点下批优先拆）——纯 .md 豁免。

| 文件 | 端 | 现行数（实测） | 预计净变 | 改动 |
|---|---|---|---|---|
| src/tui/key-handler.mjs | CLI | 431（>300 审视——净减） | 门禁改 + 删 Ctrl+D ≈ −5 | L265 提交吞 + 白名单直执行 + 单槽化 |
| src/tui/index.mjs | CLI | 454（>300 审视——净减） | ≈ −5 | submit processing 分支改拒 |
| src/tui/suspension-drive.mjs | CLI | 352（>300 审视——净减） | ≈ −40 | R15 删 + 单槽化 |
| src/tui/agent-turn.mjs | CLI | 325（>300 审视——净减） | ≈ −15 | queue 循环收敛 + 兜底单消息 |
| src/tui/render-frame.mjs | CLI | 382（>300 审视——净减） | ≈ −10 | queue UI 删 + busy 提示 |
| src/tui/layout.mjs | CLI | 229 | ≈ −3 | queueH 删 |
| webview/loading.js | VSC | 49（实测） | ≈ +2 | running 锁输入 + 占位符 |
| webview/send.js | VSC | 51 | ≈ +2 | send 出口守卫 |
| src/extension/panel-messages.mjs | VSC | 427（>300 审视） | ≈ −15 | routeUserTurn 改拒 + messageQueued 删 |
| src/extension/chat-panel.mjs | VSC | 406（>300 审视） | ≈ −10 | 队列单槽化 |
| src/extension/suspension.mjs | VSC | 399（>300 审视） | ≈ −25 | 攒批删 |
| src/extension/panel-chat.mjs | VSC | 497（>300 审视——逼近 500 最热点） | ≈ −10 | 消费改 |
| docs/design/AGENT-LOOP.md + TUI.md | 双端 | doc 豁免 | doc | R15 废弃 + 状态机改 |
| test/（新 + 既有更新——评审 #2 点名：CLI 新 busy 门禁/单槽测试 + VSC chat-panel/webview-turnstate 族更新） | 双端 | 新 + 既有 | 新 ≤150 | 测试 |

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
- AC-4 废弃零残留（grep planQueuedInput/formatMergedMessages/MAX_MERGE + queue UI 符号
  renderQueue/queueHint/❯ You: (from queue)/messageQueued 双端——评审 #6 扩展）
- AC-5 释放窗口守卫 + abort 零丢失保留（单槽交接测试）
- AC-6 模态输入不受门禁影响
- AC-7 双端锁步（CLI/VSC 禁输入语义 diff 核——_turnState running vs processing）
- AC-8 测试绿（双端 npm test 快层——既有零回归）
- 红线：Ctrl+C 全停 + Ctrl+I 注入保留；digest 呈现标签保留；消息协议名零改

## 变更记录
- 2026-09-09：落档（勘察一手——busy 判据统一 processing + 门禁落点 + R15 废弃面 + 释放窗口/abort 承诺边界——Q1 整键吞 + Q2 白名单保留用户裁）。
- 2026-09-09 评审 #2 修正：归属登记循 SYNC-CANCEL 先例（机制正文落 AGENT-LOOP §9/§24——本档保留为
  专题记录——核销时 README 地图登记）+ §24/§11.3 章节引用实现时对齐实际 + AC-4 grep 扩展 queue UI 符号
  ——token 见评审（6 项全采纳待重评）。
