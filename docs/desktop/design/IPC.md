# 桌面端（DESKTOP）· 主 ↔ 渲染契约（IPC）

> 板块 = **桌面端主 ↔ 渲染 IPC 契约（窄面）**——通道族与载荷语义的单源；主进程侧注册面 = `thincoder-desktop/src/main/ipc-registry.mjs`（`HANDLERS` 表 + 注册序）+ 分发实现 = `thincoder-desktop/src/main/ipc.mjs`**300** + 转口族 = `thincoder-desktop/src/main/ipc-relays.mjs`**77**。
> 需求侧 = 需求分卷（`docs/desktop/requirements/`——查卷口 = `docs/desktop/requirements/PROJECT.md` §4 **D 表索引**；本域无专卷——D 号散落各域卷；功能点 ∥ 验收 ∥ 依赖面——**范围数随需求卷现文**）。
> 同部分相关档：进程与目录形态 · 与核的接口面 · 壳装配第三份（装配侧回调映射）= `docs/desktop/design/SHELL.md` · 渲染面消费（store 订阅与增量渲染）= `docs/desktop/design/RENDERER.md` · 总览 / 决策 / 发行 / 验收 = `docs/desktop/design/PROJECT.md`。
> 域档：会话域 = `docs/desktop/design/SESSIONS.md` · 设置域 = `docs/desktop/design/SETTINGS.md` · 菜单体系 = `docs/desktop/design/MENU.md` · 打包与发行 = `docs/desktop/design/PACKAGING.md`；
> 续：界面形态 = `docs/desktop/design/UI.md` · 对话流 ∕ 输入区 ∕ 活动池 = `docs/desktop/design/CHAT.md` ∥ `docs/desktop/design/COMPOSER.md` ∥ `docs/desktop/design/ACTIVITY.md` · 端到端测试基建 ∥ web 快筛 = `docs/desktop/design/E2E-TESTING.md` ∥ `docs/desktop/design/WEB-QUICKCHECK.md`。
> 核机制面（agent 主循环 / 工具 / 记忆 / 配置 / 会话）**只住核**——本档只定**通道面与载荷语义**，不重述核回调语义（单一权威源）。
> 仓根 = `thincoder/`。

## 1. 主 → 渲染（事件推送，单向）

| 通道 | 载荷语义 | 核侧产出方 |
|---|---|---|
| `ev:token` | 流式正文增量 | `callbacks.onToken` |
| `ev:reasoning` | 推理块增量——载荷 `{ key, text }`；块型 `reasoning` 已在桌面**页读域（六型全员）**内（单源 = `docs/desktop/design/RENDERER.md` §1.1）；续写判据 = 尾块 `kind === "reasoning"` | `callbacks.onReasoning`（`thincoder-core/agent/chat-call.mjs:32`） |
| `ev:activity` | 活动信号（**四形**——`turn` / 内联 / 结算两径 + **`turnBreak`**） | `callbacks.onAgentTurn`（`thincoder-core/agent/turn-loop.mjs:81`）· `callbacks.onToken` 内联 `⟦ev⟧` 事件（`thincoder-core/agent/dispatch.mjs:301`；`done`/`stopped` 发射点 `thincoder-core/agent-tools/async-settle.mjs:275`/`:239`）· 宿主结算（`thincoder-desktop/src/main/agent-host.mjs`）· **`callbacks.onSubTurnBreak`**（`thincoder-core/agent/completion.mjs:42` / `:68` / `:87` / `:101` / `:117` / `:146`——六推回点；窄义钩子——工具批尾 ∕ 中断注入两支零触） ⇒ `turnBreak`：推回 / 重试段界） |
| `ev:subagent` | **子 agent 块状态**——载荷 = `{ key, role, id, status, … }`：`status` 闭集 = `started` / `queued` / `turn` / **`approval`（子代理等审批）** / `done` / `settled` / `cancelled`（token → status 全表单源 = 核 `relayEventToSubPatch`——`docs/render-core/design/RENDER-CORE.md` §5；`⟦ev⟧stopped` ⇒ `cancelled` · `error` 不载）；随行字段（缺省不落）= `model?` / `pool?` / `turn?` / `maxTurns?` / `kind?` / `position?` / `waiting?` / `reason?` / `startedAt?` / **`tool?`（待审批工具名；`null` = 清态）**；**内容面走 `ev:subchunk`**（块面 tail-3 / 展开 = 核件；单源 = `docs/desktop/design/UI.md` §1「批注（对齐第二批 · 六件）」项 3） | 核 relay 事件 token（前缀文法 = `thincoder-core/agent/relay-prefix.mjs`；映射先例 = `thincoder-vscode/src/extension/panel-subagent-relay.mjs:101-147`）+ **宿主存活投影 2s 再断言**（出生自愈——只发在飞实例；拍体沿 `thincoder-vscode/src/extension/panel-messages.mjs:42-74` 语义）；**宿主侧剥前缀** ⇒ 渲染面不析 `role#id/` |
| `ev:subchunk` | **子 agent 内容增量（D20 / KD-RC-6）**——载荷 = `{ key, role, id, kind, text, sub?, tool?, face?, cmd? }`：`kind` ∈ `text` / `think` / `tool`（工具面两形靠 `face` 区分 = `toolCall` / `toolOutput`）；`text` = 内容行原文；`sub` = 嵌套子标（`role#id` 内层链，`/` 连接）；`tool` / `cmd` = 结构化工具名与参数摘要（工具面才携）；构造面同形 = 扩展端先例 `thincoder-vscode/src/extension/panel-subagent-relay.mjs:172-191`；消费 = 核 `thincoder-render-core/subblocks/block.mjs` `renderSubagentChunk`（内容渲染单源——块面 tail-3 / 展开） | 核 relay 前缀内容 chunk 四面（`callbacks.onToken` 的 text 行 / `onReasoning` 的 think 行 / `onToolCall` / `onToolOutput`——**宿主侧剥前缀**；产出单源 = `thincoder-desktop/src/main/agent-bridge.mjs` relay 分流面） |
| `ev:tool-call` | 工具卡开始（名称 + 参数摘要 + 调用 id + **`round?` / `model?`**（仅 `advisor` 名：轮次标签载波）） | `callbacks.onToolCall`（`thincoder-core/agent/dispatch.mjs:264`） |
| `ev:tool-output` | 工具执行期输出块（增量） | `callbacks.onToolOutput`（`thincoder-core/agent/dispatch.mjs:399`） |
| `ev:tool-result` | 工具卡收尾（结果 + 改动摘要 + 耗时 + **`links?`**（验存文件链接：`[{ raw, path, line? }]`，缺 ⇒ 零链接）） | `callbacks.onToolResult`（`thincoder-core/agent/dispatch.mjs:445`） |
| `ev:approval` | 待审批项（逐项 = 工具名 + 参数摘要；批 = 工具清单 + 计数）——**载荷定形**（消费面最小字段集）= `{ key, promptId, shape, tool?, argsSummary?, changes?, batch?: { count, tools } }`：`promptId` = 待决项标识（与响应通道同源同值）· `shape` = `"single"` ∥ `"batch"` · `tool` / `argsSummary` = 逐项形（批形缺省；键名沿工具卡先例 `thincoder-desktop/renderer/views/chat-tool.mjs:72`）· `changes` = 改动摘要（文件 + 增删行数；缺 ⇒ 卡面无摘要行）· `batch` = 批形（`count` = 工具数 · `tools` = 工具名数组——键形沿 `thincoder-cli/src/tui/interaction.mjs:104`）；核侧产出映射照核填（本档不重述核回调形状——单一权威源）；**对齐第三批增**：`owner?`（核 `opts.owner.label` 原样——子代理门才在场）· `diff?`（核 `diffInfo` 原样——两形 `{ patch }` ∥ `{ old, new, path }`） | `callbacks.onPermissionRequest` ∥ `callbacks.onBatchPermissionRequest` ∥ **`callbacks.onPermissionRequired`**（四参缝——`owner` / `diffInfo` 载波） |
| `ev:question` | 用户提问（`question` 工具）——**载荷定形**（消费面最小字段集）= `{ promptId, question, options }`：`promptId` = 待决项标识（与响应通道同源同值）· `question` = 题干串 · `options` = 给答项数组（空数组 ⇒ 自由作答）；核侧产出映射照核填（本档不重述核回调形状——单一权威源） | `callbacks.onQuestion`（`thincoder-core/agent/dispatch.mjs:400`） |
| `ev:secret` | **凭据门**——载荷 = `{ key, promptId, kind, sessionId, host, user, port, fields[], keys{} }`（= 核 `ctx.onSecretInput` 载荷逐键 + `key` / `promptId` 门簿记两键；`askSecret` 七键逐项白名单 + 缺省归一）：`kind` = 核缝值（`ssh-credential` / `ssh-secret`）· `fields` = 描述面（`{ name, masked, required, prefill }`——**值只在返回路**）· `keys` = 词键对象；出站 = 门表 `suspend(key, "secret", payload, promptId)` ⇒ `GATE_CHANNELS.secret = "ev:secret"`（`suspensions.mjs:29`）；消费 = 渲染面归约 `onSecretRequest`（切片 `secretPrompt[key]`——只载描述面）+ 弹窗（`thincoder-desktop/renderer/secret-prompt.mjs`）；回合尾 `stopped` ⇒ 本键凭据项与提问项同点出场（清码判据 = 全族皆清）；abort（`denyGates`）⇒ 门 resolve `null`（与窗内取消同判） | `callbacks.onSecretInput`（核缝 = `ctx.onSecretInput`；桥 = `thincoder-desktop/src/main/agent-bridge.mjs` `onSecretInput ⇒ askSecret(key, req)`；门 = `thincoder-desktop/src/main/suspensions.mjs:87`） |
| `ev:task` | 任务 / 计划面刷新 | `callbacks.onTaskUpdate`（`thincoder-core/agent/setup.mjs:173`） |
| `ev:susp` | **挂起窗计数面**——载荷 = `{ key, active, running, queued, pending, done }`：`active` = 挂起窗在场（进 ∕ 出两态——退出事件 = 驱动 `done` 结算后一条 `active:false`）；四计数 = 核 `backgroundCounts(carrier)` 直传（`running` 含 running consult children ∕ `queued` ∕ `pending` = 单容器 ∕ `done` = 留池未消费窗口）；形态先例 = 扩展端 `suspension` 消息（`thincoder-vscode/src/extension/suspension.mjs:433-437`）；消费 = 状态行段 3 第三态（挂起句——`docs/desktop/design/UI.md` §1 状态栏行；词键 = 本档「挂起 ∕ 消化词键注」）；**禁假造**：窗不在场 ⇒ `active:false`（段回落两态词） | 宿主挂起驱动（`thincoder-desktop/src/main/suspension-drive.mjs`——hooks 计数面；核面 = `thincoder-core/agent/suspension.mjs`） |
| `ev:digest` | **消化轮边界面**——载荷三形：`{ key, status: "start", n, tier }`（`n` = 起跑 pending 数 · `tier` = `"ask"` ∕ 缺省；ask 档随行 `from` ∕ `msg`——核单点 `upstreamAskLabelVars`）∥ `{ key, status: "cap", mode, turns }`（撞帽面——`mode` = `"stop"`（现唯一产出档）· `turns` = 撞帽轮数；`autoTurn ∧ ¬timerTurn` 边界轮撞帽出帧——对位 VSC `postDigestCap`）∥ `{ key, status: "end", ok, ms, unsettled? }`（`unsettled` = 本轮未销账条数——非上行轮且 > 0 才携）；**流内消化行族**消费（**行出即留**——`start` ⇒ **追加本轮**（切片全轮累积；旧轮行留置——**零清理机器**）· `cap`·`end` 就末轮更新（无轮 ⇒ 零写（防守档））；行集 = 全轮（每轮：[起跑标签行] + [`n > 0` 计数行] + [**cap 行（锚 `data-digest-cap`）**] + [**终态行（锚 `data-digest-end`）**——`end` ⇒ **追加一条新行**（词键 `digest.done` ∕ `digest.aborted` 直取——零新键；**不动原 digesting 行**）]；`n = 0` 轮零计数行）；**显示 = 自然形**（行出即留——主端单源 = `docs/desktop/design/RENDERER.md` §1.1）；**记录面**：轮记录**全量**入人读线 `digest` 记录——刷新/恢复不丢；单源 = `docs/desktop/design/RENDERER.md` §1.1「留档记录」条）——行形沿 VSC `thincoder-vscode/webview/chat-status.js:69-122`（形面——**对位 VSC 实形：无轮容器**（行元素 = 流内并列兄弟——`chat-status.js:72-89`）**∥ cap 行 = 尾追形**（本轮元素族末位——`chat-status.js:97-105`）；形单源 = `docs/desktop/design/RENDERER.md` §1.1 流内消化行族条））；边界取点 = 宿主单回合执行面（autoTurn 支——起跑读 `backgroundCounts(agent).pending` = 起跑数；核件 `hooks.onDigest` 为备用面）；与 `ev:activity` 的 `turn` 形分工 = 后者承载回合面（位标 ∕ 回合槽），本通道只承载**消化轮身份** | 宿主挂起驱动（同上——autoTurn 支取点）+ **cap 帧 = `thincoder-desktop/src/main/turn-face.mjs:142-143`**（撞帽边界轮支——发帧 ∥ 记录同点双动作；三形**同点落人读线记录**——形 = `docs/desktop/design/RENDERER.md` §1.1「留档记录」条）；词键 = 核字典 `digest.*`（`t()` 投影面直取——值同源零复制） |
| `ev:usage` | 活动会话**状态行读数面**（需求 §3.1:52）——`ctxPct` = 核 `historyReading(...).pct` 读数投影（端侧零重算·已乘校准比）· **回合尾刷新**；**载荷 = `{ key, ctxPct, ctxTokens, usage, timers }`**（扩 `ctxTokens`）：`ctxTokens` = 核 `historyReading(...).tokens` 投影（校准后的历史估算——与 `ctxPct` **同一调用的两个返回值**；消费 = 状态行上下文段令牌读数）；`usage` = 会话累计五键——**VSC 键面**（`prompt_tokens` ∕ `completion_tokens` ∕ `reasoning_tokens` ∕ `prompt_cache_hit_tokens` ∕ `prompt_cache_miss_tokens`；核 `onUsage` 回调投影（`thincoder-core/agent/turn-loop.mjs:154`）经宿主桥 `accumulateTokens` 累加出站；渲染面归约读键随动（内部切片名 `tokens` 不随动）；CLI 同源映射 = `thincoder-cli/src/tui/tool-events.mjs:405-411`）· `timers?`（`{ count, expired }` = 核 `_pendingTimers` 活读——`thincoder-core/agent.mjs:73`；新鲜度窗 = `docs/render-core/design/RENDER-CORE.md` §10 F 行）；缺省 / 无效 ⇒ 状态行对应段零节点（禁假造） | 宿主回合尾结算（`thincoder-desktop/src/main/agent-host.mjs`——与回合尾三径同点；读数单源 = 核 `historyReading`（`thincoder-core/token-window.mjs:235`）） |
| `ev:error` | **宿主回合结算（错误径）单义**——即回合尾三径之一（单源 = `docs/desktop/design/RENDERER.md` §1.1 回合尾三径条）；**非**「通用错误通道」（「错误卡」= 渲染面呈现形态（`docs/desktop/design/UI.md` §1 对话流行），非本通道语义）；工具级错误 = 工具块 `status="error"`（**不经本通道**）；**对齐第三批增**：载荷扩 `techInfo?`（宿主 `err.stack`——缺 ⇒ 键缺席；错误横幅 `details` 载波） | 宿主结算拒绝分支（非 abort——`thincoder-desktop/src/main/turn-face.mjs:131`〔唯一出站点〕） |
| `ev:ledger` | **台账明细与状态位**——载荷 = `{ key, detailLines, marker? }`：`detailLines` = L2 明细行集（逐项目摘要行——每拍 compose 核族扫描产出；空集照写——清 tooltip）· `marker`（新增键）= 核状态位转发（`{ text, warn }`——`text` = 核 `formatMarker` 逐字（**= 当前打开范围合计**——范围判据单源 = `docs/core/design/LEDGER.md` §7.2）∕ `null` 清；首拍必携（含 null——清旧项目残影）· 同值零出站；`warn` = 核判位（**范围内**老化 > 0 ∨ 死执行者 > 0——`thincoder-core/ledger-surface.mjs:54`，端零重算）；触发 = **启动拍 + 周期拍**（`REFRESH_MS` = 120s——R8 落；对位 VSC startup + 周期两拍）；消费 = 状态行段 11 常驻标记 ∕ tooltip（`marker` ∕ `detailLines` 载波——同档状态栏行族） | 宿主自产（`thincoder-desktop/src/main/project-info.mjs`——**直消费核 `startLedgerSurface`**：首拍 `setImmediate` ∕ 周期 120s ∕ 拍重叠护栏；L2 明细 = 核 compose 直取） |
| `ev:timer` | **到期触发面**——载荷 = `{ key, status: "fired", text }`：`status` = 固定值（VSC `timer` 同形）· `text` = 交付原文（`[System reminder: ⏰ timer — …]` 逐字）；显示裁 = ≤3 行 + `…`（CLI 同规）；消费 = 流内触发行（`docs/desktop/design/RENDERER.md` §1.1） | 宿主空闲闩（`thincoder-desktop/src/main/timer-watch.mjs`——到点交付 + 开 timer 轮前落流） |
| `ev:queue` | **排队面**——两形：① 状态形 = `{ key, items }`（`items` = **文本串数组**（`string[]`——VSC `busyQueued.items` 同形；`ts` 留内部载体，出站不收）——本键**消费前待发送件**快照（**两源共镜**：忙态队 ∪ 挂起窗输入队——按键互斥，窗开 ⇒ 忙态队已尽），整置语义 · 幂等）∥ ② 消费回执形 = 状态形 + `delivered: { text, ts?, degraded? }`（`text` = 注入文本逐字〔单条原样 ∕ 多条合并格式〕· `ts` = 批头条目入队现刻（**挂起窗径可缺——缺省不携，禁假造**）· `degraded` = 附件降级码（`non-vision` ∕ `partial`——送达面 `prepareTurnAttachments` 判决）；**五时刻同形：步边界注入 ∕ 回合尾送达 ∥ 窗步边界消费 ∕ 窗内消费 ∕ 残输入续发**）；推送点 = 入队 / 消费 / 送达 / 会话中止清队 + **挂起窗径六推点**（窗内受理 ∕ 窗步边界消费 ∕ 窗内消费 ∕ 残输入续发 ∕ 窗中止清队 ∕ **残值弃件链尾**〔弃件径——**类记一、物理站点两**：墓碑出口 ∥ `!stillHeld` 断点；快照整置 · 幂等〕） + **撞帽询问拒径携消息入队**（**已落**）——待答期 ↑Ctrl+I 携文 ⇒ 入宿主忙态队，用户输入零丢失）（快照幂等——消费侧整置，零增量簿记）；图不入快照（`dataURL` 不回传渲染面——气泡显示文本，两端同形）；消费 = 待发送带交接 + 用户块入流 + 段 14 读数（`docs/desktop/design/RENDERER.md` §1.1） | 宿主排队面**两源**（`thincoder-desktop/src/main/queued-input.mjs`——忙态队单源；`thincoder-desktop/src/main/window-queue.mjs`——挂起窗输入队投影 ∕ 六帧（受理 ∕ 步边界消费 ∕ 窗内消费 ∕ 残续发 ∕ 窗中止清队 ∕ 残值弃件链尾；自 `thincoder-desktop/src/main/suspension-drive.mjs` 出档——越 300 拆分预案落形）；驱动路由面 = `thincoder-desktop/src/main/suspension-drive.mjs`；并源读面 = `thincoder-desktop/src/main/turn-driver.mjs` `queueView`——链 `postQueue` 全帧与 `history:page` `queue` 键同源单点；**步边界消费帧出站 = 窗队件 `emitDelivery` 单点**（`window-queue.mjs`——守卫恒在：缺省 ⇒ 零出站 ∥ `ts` 非有限 ⇒ 键缺席；`suspension-drive` 直呼 `postQueue` 径退役）） |
| `ev:flags` | **模式位推送（R1 增 —— 宿主自产，非回调映射）**——载荷 = `{ key, flags }`：`flags` = 四布尔活值投影（与 `history:page` 回执 `flags` 同源同函数）；触发 = `session:flags` 成功径 ∧ 活值在场（**写回执后**出站）；消费 = 渲染面 `sessionFlags` 切片（归约 = `thincoder-desktop/renderer/events-flags.mjs`——同 `applyFlags`） | 宿主自产（`thincoder-desktop/src/main/session-flags.mjs`——写回执后出站） |

| `ev:statusText` | **状态文本（R4 增——宿主接核 `onWait`）**——载荷 = `{ key, kind, … }`：`kind` 五值 = `rateWait` ∕ `rateLimited` ∕ `overloaded` ∕ `quota` ∕ `index`（映射单源 = 核 `thincoder-core/provider/wait-status.mjs` `waitStatusOf`——`warn` ∕ 未知相位 ⇒ 零载波）；随行键按 kind（`seconds?` ∕ `message?` ∕ index 形 `phase? done? total?`）；`index` ∧ `phase === "done"` ⇒ 清本键；**活动恢复即清**（七时点 = 四活动通道 + 回合尾两形 + 错误径）；消费 = 状态行段 3 状态文本支（`docs/desktop/design/UI.md` §1「批注（状态栏对齐 · 屏面为准）」表行 3 五支态机）；**`index` 支保留登记（R4 上抛 2）**：桌面现零产出方（`waitStatusOf` 四 kind——VSC 有 = `panel-index.mjs:29`）；产出方 = 索引族后续自然接点（零消费面改） | 宿主接核 `callbacks.onWait`（核 `thincoder-core/agent/chat-call.mjs:33` 透传 provider 链；映射 = `waitStatusOf` 单源） |
| `ev:compress` | **压缩状态行（R4 增——宿主接核 onCompress* 三回调）**——载荷 = `{ key, status, … }` 四态：`start { messages? }` ∕ `done { tokensFreed?, elapsedMs? }` ∕ `fallback { tailMessages? }` ∕ `failed { error? }`（缺值携 `null`——渲染面 `?` 兜底；形 = VSC `thincoder-vscode/src/extension/panel-callbacks.mjs:175-183` 同式）；消费 = 流内压缩状态行（单元素四态——`thincoder-desktop/renderer/views/compress-status.mjs`）；生命期 = 首屏页读整置即失 | 宿主接核 `onCompressStart` ∕ `onCompress` ∕ `onCompressFail`（核 `thincoder-core/context.mjs:304` ∕ `thincoder-core/agent/run-stages.mjs:89/:98/:106`） |
| `ev:goal` | **目标面采样（R5 增——宿主自产，非回调映射）**——载荷 = `{ key, status, objective, criteria }`（投影逐字同 VSC `thincoder-vscode/src/agent.mjs:409-411`：`active` 原样 ∕ `complete ⇒ done` ∕ 余原样 ∕ goal 缺席 ⇒ `{ status: "cancelled" }`——核 `agent.goal` 单源）；触发 = goal 工具结果时点（错误结果 ⇒ 零出站——禁假造）；消费 = 流内目标卡（核件 `renderGoalPanel` 直取）+ 状态行 🎯 非段位元素（在场 = 核可见判据 ∧ `active`） | 宿主自产（`thincoder-desktop/src/main/agent-bridge.mjs` `goalOf` 采样注入面） |
| `ev:config` | **配置写盘感知（R8 增——宿主自产，非回调映射；纯信号）**——载荷 = `{ at }`：**不携 `key`**（非会话面——「会话键面」通则例外，明写）；触发 = 宿主 config watch onChange（外写；自写抑制零推送——去抖 300ms ∕ stat 元组比对；选定写回径宿主自写同受覆盖——判据 = 写经核 `writeConfigAtomic`（写成功同步回调 `onConfigSelfWrite` 刷新监视基线——`thincoder-core/config-io.mjs:59` ∥ `:107`、`thincoder-core/config-watch.mjs:70`）⇒ 零推送——候选面复读六径②（「模型清单注」项 4）不触；覆盖在写面单点（不另立写点登记））；消费 = 设置 ∕ 向导面**在场才复读**七段（`thincoder-desktop/renderer/mount-settings.mjs` `refreshSettings()`——归约面零写者、纯信号直送调用面；段集单源 = `docs/desktop/design/UI.md` §1 设置面行）+ **输入面板候选面复读**（`thincoder-desktop/renderer/app.mjs` `onConfig` 增线 ⇒ `composer.refreshCandidates()`；候选面六径之 #2——单源 = 「模型清单注」项 4） | 宿主自产（`thincoder-desktop/src/main/main.mjs`——核 `thincoder-core/config-watch.mjs` watch onChange） |
| `ev:menu` | **菜单动作（D36 增——宿主自产，非回调映射；纯信号）**——载荷 = `{ action, path?, value? }`：`action` 闭集**六值** = `newSession` ∕ `openProject` ∕ `find` ∕ `theme` ∕ `help` ∕ **`openSettings`**（`path` 仅 `openProject` 携（最近工作目录项）；**`value` 携主二** = `theme`（三值闭集 `system` ∥ `light` ∥ `dark`）∥ `openSettings`（组名——**菜单发出闭集 = 六名** `providers` ∥ `agent` ∥ `mcp` ∥ `env` ∥ `tools` ∥ `models`（= `SECTIONS` 名序去「团队」）；渲染面校验 = `SCOPES` **十名**宽容（设置页对齐——菜单不发「模型」∥「团队」）；缺 ⇒ 开设置面））；**不携 `key`**（非会话面——沿 `ev:config` 例外句）；触发 = 应用菜单条目点击（`thincoder-desktop/src/main/window.mjs` ∥ 模板 `app-menu.mjs`）；消费 = 渲染面窄口 `onMenu` ⇒ `thincoder-desktop/renderer/menu-actions.mjs` 分派至各既有单一实现（`createSession` ∥ `openDir` ∥ 搜索面 `openSearch` ∥ 设置面 `setTheme` ∥ `printHelp` ∥ **设置面 `openSettings` ∥ 组弹窗 `openSettingsModal`**（缺 `value` ⇒ 现有设置页；携组名 ⇒ 组弹窗——`docs/desktop/design/SETTINGS.md` §1 **KD-68**））；决策单源 = `docs/desktop/design/MENU.md` §1 **KD-65 ∥ KD-67** | 宿主自产（`thincoder-desktop/src/main/window.mjs`——`win.webContents.send`） |

**事件映射**：本表第三列 = 「核回调 → IPC 通道」逐条映射（单源）——逐条带坐标，宿主面 = `thincoder-desktop/src/main/agent-host.mjs` + 回调桥 `thincoder-desktop/src/main/agent-bridge.mjs`（**二十回调** ⇒ `ev:*` 映射 = **十四通道**——`onSecretInput` ⇒ `ev:secret`；`onReasoning` ⇒ `ev:reasoning`；

`onUsage` 并入 `ev:usage`（非独立通道）
  · **四回调**（`onWait` ⇒ `ev:statusText`；`onCompressStart` ∕ `onCompress` ∕ `onCompressFail` ⇒ `ev:compress`——净增两通道）；
  `ev:subchunk`（relay 前缀内容 chunk 四面——经 `onToken` / `onReasoning` / `onToolCall` / `onToolOutput` 四回调分流，非新回调）；

  `ev:usage` / `ev:error` 两行第三列 = 宿主回合尾自产，非回调映射——映射仅此一处；**两条宿主自产**：`ev:susp`（挂起计数面）· `ev:digest`（消化轮边界面）——驱动面产出，非回调映射；**一条宿主自产**：`ev:queue`（排队面——队列快照 ∕ 消费回执两形））；
  **对齐第三批增**：`ev:activity` 增 `turnBreak` 形（宿主接核 `onSubTurnBreak`——推回 / 重试段界）+ `ev:ledger` 行（宿主自产——启动拍 + 周期拍〔120s〕）。

  **一条宿主自产**：`ev:timer`（到期触发面——闩到点交付后落流，非回调映射）。
  **一条宿主自产**：`ev:flags`（模式位推送——`session:flags` 成功径写回执后出站；形 ∕ 载荷 = 本档 §1 该行）。
  **两通道（回调映射）**：`ev:statusText`（`onWait`）· `ev:compress`（`onCompressStart` ∕ `onCompress` ∕ `onCompressFail` 三回调 ⇒ 同通道四态）。

  **一条宿主自产**：`ev:goal`（goal 工具结果时点采样——`goalOf` 注入面）。
   **一条宿主自产**：`ev:config`（config 写盘感知——主进程 watch onChange 出站；纯信号，不携 `key`）。
   **一条宿主自产**：`ev:menu`（菜单动作——主→渲染单向；动作闭集**六** `newSession` ∕ `openProject` ∕ `find` ∕ `theme` ∕ `help` ∕ **`openSettings`**；非会话面不携 `key`）。

  **回调面三接缝**：`onPermissionRequired` ⇒ `ev:approval` 载荷两键 · `onSubagentApproval` ⇒ `ev:subagent` `approval` 态 · `onSubTurnBreak` ⇒ 前句 `turnBreak`——皆映射入既有通道（非新通道）。`ev:activity` **四形**判别单源 = 「载荷键集」段（同本档）。装配侧注入与不改核签名的约束 = `docs/desktop/design/SHELL.md` §4 项 2。

**载荷键集（单源 = 本段）**：**二十五通道**一律携 `key`（**`ev:config` ∥ `ev:menu` 例外**——非会话面纯信号，不携 `key`；「会话键面」段同注）。逐通道字段集：

- `ev:token { key, text }`
- `ev:reasoning { key, text }`（推理块增量——与正文同形；续写判据 = 尾块 `kind === "reasoning"`）
- `ev:subagent`（形状 = 本档 §1 该行：`status` 闭集 + 随行字段；**内容面走 `ev:subchunk`**——「对齐第二批」项 3）
- `ev:subchunk { key, role, id, kind, text, sub?, tool?, face?, cmd? }`（子 agent 内容增量——形 / 在场 = 本档 §1 该行；消费 = 核 `renderSubagentChunk`）
- `ev:activity { key, event: "turn", turn, maxTurns }`（宿主回合起——`onAgentTurn`；**无 `fields`**）
- `ev:activity { key, event, fields }`（内联形——`⟦ev⟧` 事件族；`fields` = `\x1e` 分隔字段原样；事件名表外 ⇒ 仍进本通道，不丢）
- `ev:activity { key, event: "done" }` ∥ `{ key, event: "stopped" }`（宿主结算——**无 `fields`**）
- `ev:activity { key, event: "turnBreak" }`（宿主接核 `onSubTurnBreak`——**清游标面**（尾块追加态收束）；**非回合尾**（三径判据不含本形）；对齐第三批增）
- **判别（写死）**：`fields` 键在场 ⇒ 内联形（子代理 / 池条目面——**零回合尾**、不作回合起）；无 `fields` 的 `done` / `stopped` = **宿主结算面**（**回合尾三径**同判据——`done` / `stopped` ∨ `ev:error`；单源 = `docs/desktop/design/RENDERER.md` §1.1 回合尾三径条）。
- `ev:tool-call { key, id, name, argsSummary, round?, model? }`（`round` / `model` = advisor 轮次标签载波（仅 `advisor` 名）——对齐第三批增）
- `ev:tool-output { key, id, text }`（输出块增量）
- `ev:tool-result { key, id, ok, result, links?, subKey? }`——`ok = !isToolFailure(result)`（核 `thincoder-render-core/lib.mjs:94-99` 判据单源：半 / 全角 `Error[:：]` 头 · 独立成行 `(exit code N≠0)` / `(killed: …)` / `(spawn failed)`）；
  `links` = 验存文件链接（宿主 `extractFileLinks(cwd, text)`——盘上存在闸 + 去重 + 封顶；缺 ⇒ 零链接）；`subKey` = 子代理归并存续键，缺省 = 顶层——**值面在场 · 消费未落**（宿主透传与载荷键定形已落；渲染面归约不按 `subKey` 归并，登记）。
- `ev:approval`（定形 = 本表该行）
- `ev:question { key, promptId, question, options }`（`question` / `options` = 核回调实参透传 · `promptId` = 待决项标识——与 `question:respond` 同源同值）
  - **作答通道**：宿主 `onQuestion` 改**挂起门**（表 = `thincoder-desktop/src/main/suspensions.mjs` 同表 · `kind: "question"`）——返 Promise，待 `question:respond` 结算。
  - 未作答 ⇒ 回合停在本次工具调用上——`thincoder-core/tools/question.mjs:24` 直返 `ctx.onQuestion(...)` ⇒ `thincoder-core/agent/dispatch.mjs:411` `await item.tool.execute` 续。
- `ev:task { key, items }`（`items` = 任务 / 计划面条目数组——核回调实参透传，`thincoder-core/agent/setup.mjs:173`）
- `ev:usage { key, ctxPct, ctxTokens, usage, timers? }`（`ctxPct` = 本会话上下文占用百分数——**0–100 整数**（核 `historyReading(...).pct` 直传 · 端零重算 · 已乘校准比）；`ctxTokens` = 上下文令牌估计（核 `historyReading(...).tokens` 直传——与 `ctxPct` 同一调用；消费 = 状态行上下文段令牌读数）；
  **`pct > 0` ∨ 本帧携新读数（tokens ∕ timers）⇒ 发 · 否则不发**（R3 端差① 修；取整 0 回合三读数照达；`ctxTokens` 0 ∕ 缺不抑事件——端侧上下文段落半态；判据单源 = `docs/render-core/design/RENDER-CORE.md` §9 R3 端差①）、**无上界夹值**（> 100 照发）；
  `usage` ∕ `timers?` = 累计五键（VSC 键面；键名 ∕ 形单源 = 本档 §1 该行）∕ 计时读数；端显示门同判据 = `docs/desktop/design/UI.md` §1 状态栏行）
- `ev:error { key, text, techInfo? }`（`text` = `String(err?.message ?? err)`——宿主结算拒绝分支投影；`techInfo` = `err.stack`（缺 ⇒ 键缺席）——错误横幅 `details` 载波；对齐第三批增）
- `ev:susp { key, active, running, queued, pending, done }`（挂起窗计数面——形 ∕ 在场 = 本档 §1 该行；进出两态，`active:false` 为退出唯一形态）
- `ev:digest { key, status, … }`（消化轮边界面——`start { n, tier, from?, msg? }` ∕ `cap { mode, turns }` ∕ `end { ok, ms, unsettled? }`；形 = 本档 §1 该行）
- `ev:ledger { key, detailLines, marker? }`（台账明细与状态位——`detailLines` = L2 明细行集（逐项目摘要——段 11 tooltip 载波）· `marker` = 状态位（`{ text, warn }` ∕ `null`；段 11 常驻标记载波）；形 / 触发 = 本档 §1 该行）
- `ev:timer { key, status: "fired", text }`（到期触发面——`status` = 固定值（A5）· `text` = 交付原文，显示裁 ≤3 行 + `…`；形 / 在场 = 本档 §1 该行）
- `ev:queue { key, items, delivered? }`（排队面——`items = string[]`（文本串数组；本键消费前待发送件快照 · 整置——两源共镜：忙态队 ∪ 挂起窗输入队）· `delivered = { text, ts?, degraded? }`（消费回执——**五时刻同形**：步边界注入 ∕ 回合尾送达 ∥ **窗步边界消费** ∕ 窗内消费 ∕ 残输入续发；**`ts` 挂起窗径可缺——缺省不携，禁假造**）；形 / 推送点 = 本档 §1 该行）
- `ev:flags { key, flags }`（模式位推送——`flags` = 四布尔活值投影（与 `history:page` 回执 `flags` 同源同函数）；形 / 触发 = 本档 §1 该行）
- `ev:statusText { key, kind, … }`（状态文本——随行键按 kind：`seconds?` ∕ `message?` ∕ index 形 `phase? done? total?`；五 kind = rateWait ∕ rateLimited ∕ overloaded ∕ quota ∕ index；形 / 在场 = 本档 §1 该行）
- `ev:compress { key, status, … }`（压缩状态行——四态 start ∕ done ∕ fallback ∕ failed；形 / 在场 = 本档 §1 该行）
- `ev:goal { key, status, objective, criteria }`（目标面采样——核 `agent.goal` 投影；形 / 触发 = 本档 §1 该行）
- `ev:config { at }`（配置写盘感知——**不携 `key`**（会话键面通则例外）；形 / 触发 = 本档 §1 该行）
- `ev:menu { action, path?, value? }`（菜单动作——**不携 `key`**；闭集**六动作**；形 / 触发 = 本档 §1 该行）

`argsSummary` = 本端展示面摘要（按工具挑关键参数的单行口径——单源 = 核 `thincoder-core/tool-args.mjs` `describeToolArgs`（B7 1a 上提）；本端 `agent-bridge.mjs` 保名转口 `summarizeArgs`）。

**会话键面（单源 · 本段）**：本表**二十五通道**（`ev:config` ∥ `ev:menu` 除外——非会话面不携 `key`，通则例外明写）与本档 §2 请求通道的 `key` = **会话键 = `String(slot)`**（十进制槽号串；

渲染面键面成于会话控制条目——行投影 `slot` ⇒ 条目键`thincoder-desktop/renderer/views/session-control.mjs:52`）
——主侧装配表 / 挂起表项 / 渲染侧切片键（`tabBadges` / `sessionMeta` / `activeSession` / `questions` / `tasks`）同值同源；主侧由键解出槽号，不合规键 ⇒ 回执 `{ ok: false, reason: "bad-key" }`（不静默兜底）。

**订阅面（主 → 渲染）**：preload 暴露 `on(name, cb)`——白名单 = 本表**二十五通道**，表外 ⇒ **throw**；返回退订函数；实现 = `thincoder-desktop/src/preload/preload.cjs`，出站 = 主进程 `win.webContents.send`。

**菜单面（D36）**：菜单项 → 渲染面动作通道已补 = `ev:menu`（单通道**六动作**——新建会话 ∕ 打开项目 ∕ 查找 ∕ 主题 ∕ 帮助 ∕ **打开设置**（`value` 携组名 ⇒ 组弹窗；缺 ⇒ 设置面）；
  形 / 载荷 = 本档 §1 该行；角色条目（Edit 组 ∥ 退出 ∥ 开发者工具）仍为主进程 ∥ 内建 `role:`——非通道）；**勾选态回读 = `theme:state`**（渲染 → 主单向——菜单主题▸带勾；形 / 载荷 = 本档 §2 该行）；

决策单源 = `docs/desktop/design/MENU.md` §1 **KD-65**。

**挂起 ∕ 消化词键注**：

- `susp.*` 三键（`susp.running` ∕ `susp.digesting` ∕ `susp.winding`）——**键名沿 VSC 同名键**（`thincoder-vscode/locales/zh.json:259-261`）；值 = **zh 取 CLI 逐字**（后台 N 子代理运行中 ∕ 完成待消化 ∕ 后台子代理收尾…——源 = `thincoder-cli/src/tui/suspension-drive.mjs` `backgroundStatusText`，D22「屏面为准」）·
  **en 取 VSC 逐字**——**`susp.*` zh 三端逐字同**（VSC `thincoder-vscode/locales/zh.json:258-259`）；消费 = 状态行段 3
  （`thincoder-desktop/renderer/views/statusline.mjs`）；表落 `thincoder-desktop/renderer/i18n.mjs`。

  **取值条件逐项点名**（N / M ↔ `ev:susp` 四计数）：N = `running + queued`（主体句 = `susp.running`）· M = `pending + done`（附句 = `susp.digesting`）；

  取词链 = N > 0 ⇒ `susp.running`〔M > 0 ⇒ 附 `susp.digesting`〕· N = 0 ∧ M > 0 ⇒ `susp.digesting` · N = 0 ∧ M = 0 ⇒ `susp.winding`——对位 = `thincoder-vscode/webview/status-bar.js:66-75`（`_suspended` 门 + 同式取词）；段 3 态机（四支 + 优先序 + 交叠角落）单源 = `docs/desktop/design/UI.md` §1「批注（对齐重定位）」项 1 表行 3。
- `digest.*`——**零新键**：核字典（`thincoder-core/i18n.mjs:34-43`）经 `thincoder-desktop/renderer/i18n.mjs` `t()` 投影面直取（`digest.turnLabel` ∕ `digest.turnLabelAsk` ∕ `digest.start` ∕ `digest.done` ∕ `digest.aborted` ∕ `digest.capStop` ∕ `digest.capAuto`——七键，值同源零复制）。
- `notify.*` 单键（`notify.done`——值 = 核 `thincoder-core/notify-policy.mjs` `NOTIFY_TEXTS` zh ∕ en 常量对）——消费 = 主进程 `thincoder-desktop/src/main/notify.mjs`（端胶水 re-export）；
  **持有面 = 核策略档**（zh ∕ en 常量对——locale 缺省取核配置，先例 = `thincoder-desktop/src/main/agent-host.mjs:157` `agent.config?.locale`；**渲染面词表零此键**——非 i18n 下发面）。

## 2. 渲染 → 主（请求，均返回结果或错误）

| 通道 | 载荷语义 |
|---|---|
| `sessions:list` / `session:create` / `session:switch` / `session:rename` / `session:delete` | 会话族（行字段含 `createdBy` 创建端〔核 `listSlots` 条目投影，`thincoder-core/session-slots.mjs:217`；缺键 ⇒ `""` = 未知 ⇒ 渲染面**不标注**、**禁以「占用端」冒充**〕；运行标记 / 待审批位 = **渲染面位标面**（**不经本载荷**——「会话族注」项 4）；**`sessions:list` 读回执增字段 `ledger`**（账本异常注记——异常才携；单源 = 「会话族注」项 6）；切换 = 恢复槽 + 载历史；**写通道回执** = 统一信封 `{ ok, reason: null\|string, cwd, slot }`——reason 分档见「会话族注」项 5；**`session:delete` 末项门（对齐第三批增）** ⇒ 会话数 ≤ 1 拒 `last-session`；**`session:switch` 受占件** ⇒ 受占槽切换成立 ∧ 回执增键 `occupied: true`（非受占 ⇒ 键缺席——核 `slotOccupancy` 前置读；可见面 = 渲染面 `session.occupied` toast——CLI 形「警告 + 继续」）） |
| `session:resume` | 接续既有会话（跨端同一槽——与 CLI / 扩展端接续同一会话） |
| `session:prefs` | **会话级偏好写面（白名单末位）**——载荷 `{ key, patch }`：`patch` 键闭集 = `provider` / `model` / `effort`（会话级三值——需求 §3.1），至少一键；值形 = 串（`null` = 清该键——**仅 `effort` 一键**；表外档位字面串 ⇒ 归一 `null`〔未设——写面不预校验，沿核读侧容忍口径〕）；`provider` 变更须**同送 `model`**（否则拒 `model-required`）；非对象 / 空对象 / 表外键 ⇒ `invalid-patch`。**回执 = 会话族同信封 + `meta`**（`{ ok, reason, cwd, slot, meta }`——**选定写回径另携条件性 `providerState`**（项 8）；`meta` = 会话级三值投影，与 `history:page` 回执 `meta` 同源同形）：**成功携 `meta` · 失败缺 `meta` 键** ⇒ 仅成功径就地刷三值面。reason 四档（含 `model-required`）= 「会话级偏好注」项 7。**选定写回径**（模型面实变——「会话级偏好注」项 8）成功回执另携 `providerState`（写后核读；键缺席 ⇒ 渲染面零写）。**选定写回失败** ⇒ 回执叠 `carryover: { ok: false, reason }`（槽写照旧 `ok:true`——**不反扑**保留；渲染面据该键出同一条失败行——「会话级偏好注」项 8）。语义与核面解析链 = 「会话级偏好注」 |
| `record:append` | **消化面留档记录追加（白名单末位 46）**——载荷 `{ key, record }`：`record` = 留档记录——**本通道到达族 = `subagent`**（`{ meta, rows }` 快照）；**`digest` 族经本通道不可达**（其产生面 = 宿主发帧点**同点双动作**——不经通道；防双份判据：渲染面不得经本通道追加 `digest` 记录）；两族形 / 在场 / 判据单源 = `docs/desktop/design/RENDERER.md` §1.1「留档记录」条；**记录产生面直追加**——不入机器线（不喂模型）；落盘节律 = 与消息同节律（人读线段即时 ∥ 槽文件回合尾投影——单写者零破）；回执 = `{ ok, reason }`（reason 闭集 = `bad-key` ∥ `unknown-key`（装配表无该键——事件面只在装代理上流，实际不可达——防御档））；处理体 = `thincoder-desktop/src/main/agent-host.mjs` 转口（`pushReal` 同面——核 `thincoder-core/context.mjs:93`） |
| `file:open` | **文件链接打开（对齐第三批增 · 相抵②）**——载荷 `{ path, line? }`：`path` = 盘上绝对路径（验存件——宿主 `extractFileLinks` 产物）· `line` = 行号（核产物；**不施加**——`shell.openPath` 无行参；端差登记 = `docs/desktop/design/UI.md` §1「批注（对齐第三批 · 小修族）」相抵②）；**回执** `{ ok, reason }`（`ok` 假 ∥ 抛 ⇒ `console.error`——渲染面零静默）；**实现面** = `shell.openPath`（`thincoder-desktop/src/main/ipc.mjs` 出口；纯函数面 `thincoder-desktop/src/main/file-links.mjs`） |
| `history:page` | **载荷** = `{ key, before }`（`before = null` ⇒ 尾页；否则 = 页首游标）；**回执** = `{ ok: true, messages, hasOlder, next, meta, flags?, queue }`（`queue` = 本键**队列快照**（**`string[]`**——**两源合并快照**（忙态队 ∪ 挂起窗输入队——并源单点 = `queueView`；A9 同镜面单形）：冷启 ∕ 重载镜面重建面；键恒在场，空队 ⇒ `[]`）；`next` = 下一页游标——推导 = 「页游标注」；无更早页 ⇒ `null`；`meta` = 会话级三值投影 `{ provider, model, effort }`——开页即供三值面；`flags` = 模式位投影（四布尔——**状态栏对齐批增**；**活值优先**（不在场 ⇒ 槽字段投影）；形态 / 在场 / 落点单源 = 「模式位投影注」）；**桌面残余批增（D17）** = `seed` 打开态播种面——**仅首屏读**（`before == null`）在场，形 / 缺席降级 = 「打开态播种注」）；页量 = 核 `historyWindow` 缺省（200 **条**——**条 ≠ 块**：块数由渲染面归约，窗限增长按实并入块数）；槽缺 / 键不合法 ⇒ `{ ok: false, reason }`（`bad-key` / `slot-missing`）；**零算法副本** = 核 `loadSlotFile` + `historyWindow` 转口；**留档记录**：`historyWindow` 以 `{ records: true }` opt-in 直通留档记录（`digest` ∕ `subagent` 两型——**默认关 ⇒ CLI ∕ VSC 零破**）——形 = `docs/desktop/design/RENDERER.md` §1.1「留档记录」条；视口补偿在渲染面（`docs/desktop/design/RENDERER.md` §3）；**`providerState` 键**（provider 态投影——见「provider 态投影注」） |
| `msg:send` / `msg:interrupt` | **载荷**：`msg:send { key, text, images? }` → 回执 `{ ok: true }` ∥ `{ ok: true, degraded }`（`degraded` 闭集 = `"non-vision"`（非视觉模型降级）∥ `"partial"`（部分附件弃））（**立即回**——长回合不阻塞 IPC；**例外 = 非视觉带图径**：降级窗内读图毕再回——「附件注」项 4；回合终局经 `ev:activity` ∨ `ev:error`——三径同判据，单源 = `docs/desktop/design/RENDERER.md` §1.1 回合尾三径条）∥ `{ ok: false, reason }`（`provider-invalid`（provider 无效——fail-loud，零假回合；**`providerKind`**——真因分类闭集 `defaultModel` ∥ `provider`：缺 ∥ 无效 `defaultModel` ⇒ 前者（渲染面词）；无渠道可解析 ∥ 条目结构不全 ⇒ 后者（词沿 VSC 基准）；渲染面据类出词）· `queue-full`（在飞入队满——第 9 条拒 + 文本保留）· `busy`（**挂起窗径竞态防御档**：受理判据至入队点间窗已摘 ⇒ 拒——实际不可达，保留防御）· `aborted`（**跨中止径**：装配 `await` 期被中止——`dispose` ∕ 切项目级联清装配 ⇒ 零起跑零落盘；落点 = `thincoder-desktop/src/main/turn-driver.mjs:174-176`（装配径）∥ `:194-197`（降级窗后查位径——形 = 本档「附件注」项 4））· `bad-key`）。**回合中插入批增（忙态受理）**：在飞 `msg:send` ⇒ **按会话键入队**（队列单源 = 宿主；容量 8 按键判）⇒ 回执 `{ ok: true, queued: true }`（**两径同形**：忙态队 ∕ 挂起窗输入队——`queued` = 受理入队、消费前不入流），步边界取批注入（不中断 · 下一步生效）+ 回合尾宿主续发兜底；机制 ∕ 时序 ∕ 附件边界单源 = `docs/desktop/design/PROJECT.md` §2 **KD-40**；`msg:interrupt { key, message? }` → `{ ok: true }` ∥ `{ ok: false, reason: "idle" }`（中断 = 核 `signal.abort()`）∥ `{ ok: false, reason: "queue-full" }`（cap 询问待答 ∧ `message` 非空 ∧ 队满 ⇒ 整调用拒——**零中止**（询问在场 ∕ 回合照旧 ∕ 零丢失）；决策单源 = `docs/desktop/design/PROJECT.md` §2 **KD-52 ②**）；附件面 = **已落**（载荷 `images` · 上限 · 端侧前置多模态门 · 降级面 · 落盘 = 本档「附件注」）；UI 输入区与中断键 = **已落**（输入区挂载根 `[data-slot="composer"]` · 两份挂载切片 `thincoder-desktop/renderer/mount-composer.mjs`；**挂起窗口头（单源 = `docs/desktop/design/PROJECT.md` §2 KD-34）**：窗内 `msg:send` ⇒ **入驱动器队列**（`pushInput` + `wake`——立即回 `{ ok: true, queued: true }`（与忙态受理回执同形；窗队入 `ev:queue` 镜面 ∕ 消费回执 `delivered` 入流恰一枚）；用户输入优先于消化轮序沿核件）——含附件 ⇒ **同受理**（**载具层携图**：窗条目携 `images`、送达面 `prepareTurnAttachments` 判决——核件输入面 = 文本单形不变）；`msg:interrupt` 窗内 = **回合级**（digest 在飞 ⇒ 中止本回合，核件 catch 重入循环，非会话停；空闲等待期 ⇒ `{ ok: false, reason: "idle" }`——无全停面，背景项停止仍走 `subagent:stop`）；成功回执（`{ ok: true }` ∥ `{ ok: true, degraded }`）另携 `providerState` 键（provider 态投影——见「provider 态投影注」） |
| `subagent:stop` | **子 agent 停止出口**——载荷 `{ key, id, role? }`（`id` = 实例号——与 `ev:subagent` 同源同值）；回执 `{ ok, reason }`（reason 闭集 = `unknown-sub`（表外 id ∥ 该实例不在飞）· `bad-key`）；**实现面 = 主进程转核既有取消出口**（异步族 = `thincoder-core/agent-tools/subagent-async.mjs:245` `executeCancelAction`；同步族 = 核 `_syncChildAborts` registry 命中判据——先例 = 扩展端 `syncLiveOf`）；逐类调用链核实归实施批 R3b（判据 = 停止后实收 `cancelled`——源 = `⟦ev⟧stopped` / `⟦ev⟧cancelled` 两 token · 先例兼容映射 = 核档 §5 全表） |
| `approval:respond` | **载荷 = `{ promptId, verdict }`**——`promptId` 与 `ev:approval` 同源同值；`verdict` 闭集 = `once` ∥ `always` ∥ `reject` ∥ `approveAll` ∥ `deny` ∥ `oneByOne`（前三 = 逐项形 / 后三 = 批形；**形与值的匹配由卡面键位闭集保证**——表外键零动作 · 不派发）；**未装配 ⇒ fail-loud 直传拒绝**（不吞 · 不造 reason 码 · 不落假成功——拒绝以抛错浮出）；**回执 = 形定**（沿会话族同形族 `{ ok, reason, … }`——见「会话族注」项 5；**成功径叠加 `{ key, flags }`**〔桌内 AUTO 翻转〔always 放行〕后 `flags` 即时刷新面：`flags` = `flagsOf(key)` 活值投影四布尔，与 `history:page` 回执同一函数；提问门径 / 失败径零叠加〕）；**reason 闭集四档 = `unknown-prompt` / `bad-kind` / `bad-verdict` / `bad-answer`**——四档皆不 resolve · 挂起保留（单源 = `thincoder-desktop/src/main/suspensions.mjs:85-87`） |
| `question:respond` | **载荷 = `{ promptId, answer }`**——`promptId` 与 `ev:question` 同源同值；`answer` = 作答串（给答项 ⇒ 选项串原样；自由作答 ⇒ 输入串）；**取消 ⇒ `answer: null`**（与打断同判——挂起表按取消串 `(user cancelled)` 结算：串单源 = `thincoder-desktop/src/main/suspensions.mjs`；`question` 工具返值面非 `undefined` = 核 `thincoder-core/agent/dispatch.mjs:419`（工具返值单源 = `thincoder-core/tools/question.mjs:24`）；渲染面「已取消」文本走词表——与结算串两域分离）；**未装配 ⇒ fail-loud 直传拒绝**（沿 `approval:respond` 先例）；**回执 = 形定**（沿会话族同形族 `{ ok, reason }`——三档：`unknown-prompt`（表外 id）· `bad-kind`（命中非 question 门——传了审批 id）· `bad-answer`（`answer` 非串且非 `null`）；**三档皆不 resolve · 挂起保留**） |
| `secret:respond` | **载荷 = `{ promptId, values }`**——`promptId` 与 `ev:secret` 同源同值；`values` = 字段值对象（`{ <name>: <串> }` 原样——值直达门结算，端侧零转写 / 零落盘 / 零入日志）∥ **取消 ⇒ `values: null`**（与 `denyGates` 同判）；**未装配 ⇒ fail-loud 直传拒绝**（沿 `approval:respond` 先例）；**回执 = 形定**（沿同形族 `{ ok, reason }`——三档：`unknown-prompt`（表外 id）· `bad-kind`（命中非凭据门 ∥ 载荷无 `values` 意向键）· **`bad-values`**（非载体且非 `null` 值包）；**皆不 resolve · 挂起保留**） | 出口 = `thincoder-desktop/src/main/ipc.mjs`（`questionRespond as secretRespond`——同体别名，按 `promptId` 判门，零第二实现）；门 = `suspensions.mjs` `respond` → `answerSecret`（单源 = `docs/desktop/design/SHELL.md` §4 项 5） |
| `config:read` / `config:write` | 配置读写（写面**只**经核唯一执行体 `writeConfigAtomic`——`thincoder-core/config-io.mjs:59`；读面 = 核 `loadConfig`；不另立格式）；`config:read` 同载**语言面下发** `{ locale, dict }` **+ 配置存在判据** `configured`（= `existsSync(configPath())`——`thincoder-core/config-io.mjs:39`；路径常量 `:33`）——`dict` = 核 `projectDictionary(locale)` 投影（`thincoder-core/i18n.mjs:101`），宿主 UI 专有键由渲染面自持（边界 = `thincoder-core/i18n.mjs:14-17`：只收核域文案）；消费面 = `thincoder-desktop/renderer/i18n.mjs`。`config:write` 键白名单**仅** `locale`——载荷 / 回执见「设置族与项目级信息族注」 |
| `provider:list` / `provider:save` / `provider:remove` / `provider:verify` | provider 增删与 key 校验（真调一次；载荷 / 回执与两形 = 「设置族与项目级信息族注」） |
| `provider:setKey` / `provider:delKey` / `provider:models` / `provider:setProxy` | **四增（白名单位次 40–43）**——密钥设 ∕ 改（`setKey`）· 密钥删（`delKey`——条目保留）· 自定形「拉取模型」（`models`——载荷 = 表单暂存值，**不落盘 ∕ 不入账**）· 渠级代理开关（`setProxy`——`true` 写 ∕ `false` **删键**；沿 VSC `handleSetProviderProxy`）；回执 = 同形信封 `{ ok, reason }`；含 S3 写后探（加渠道 ∕ 改钥 ∕ `defaultModel` 写 ⇒ fire-and-forget 探一次，核落账供行面读数）；载荷 / 回执逐通道 = 「设置族与项目级信息族注」表该四行 | 处理体 = `thincoder-desktop/src/main/providers.mjs` |
| `model:list` / `settings:agent` | 模型两级选择 · 推理档位 · agent 参数面板（**R7 增**：`settings:agent` 回执增 `models` 键——consult ∕ advisor 行面；载荷 / 回执 = 「设置族与项目级信息族注」表该行） |
| `model:catalog` | **全渠模型清单扇出（白名单位次 39）**——无载荷；回执 = `{ ok, models: [{ provider, id, effortEnum, thinkOff }], unavailable: [{ provider, reason }] }`（逐 `hasKey` 渠探针全渠扇出——失败渠零行 + `unavailable` 诊断项；探头单源 = 核 `probeChannelModels` + `probeTargetOf`）；细目（口径 ∕ 触发面 ∕ 落账）= 「模型清单注」 |
| `mcp:list` / `mcp:save` / `mcp:remove` | MCP 服务器管理（经核——**探活失败 ⇒ 零写盘**，载荷 / 回执 = 「设置族与项目级信息族注」） |
| `mcp:update` / `mcp:reconnect` | **两增（白名单末位 44 ∕ 45）**——`mcp:update`：条目**原位替换**（数组序保持；**仅落盘、零探活**——沿 VSC `config-mcp.mjs` 口径）；`mcp:reconnect`：**先断后连**（关旧会话 → 重连；失败 `reason` 直传、零抛）；`mcp:list` 行同拍增 `config?` 回执（编辑表单预填源）；载荷 / 回执逐通道 = 「设置族与项目级信息族注」表该两行 | 处理体 = `thincoder-desktop/src/main/mcp-servers.mjs` |
| `ledger:read` / `batch:status` | 项目级信息（台账行 · 批次相位——**项目一份，不随会话走**）。台账读 = 核 `buildScan`（`thincoder-core/ledger.mjs:114`——**经动态 import**，W8 契约②；返回体 `:134-140`）；相位 = 核 `readManifest(cwd)` **回执的 `manifest.phase`**（`thincoder-core/manifest.mjs:366`——**无顶层 `phase`**；值域 `initial-dev` / `production` `:268`）；载荷 / 回执 = 「设置族与项目级信息族注」 |
| `project:open` | 进入项目：载荷 `{ fsPath }`（可选；缺省 = 主进程弹原生目录选择——`dialog` 在主进程内、不经通道；A7 键面——VSC `setProject` 同键）；返回 `{ cwd, recent }` |
| `project:recent` | 最近目录列表读取（读面 = 核会话槽面回读——零新存储；机制 = §2 项目面注）；**R13 后无渲染消费面（保留）**——左列最近目录列表不在渲染面；`cwd` 面仍消费（会话控制面项目钮读数——`refreshRail` 形状判据） |
| `session:flags` / `at:complete` | **R1 两通道（白名单第 30 ∕ 31 位）**——`session:flags`：载荷 `{ key, patch }`（`patch` 四键闭集 `planMode` / `autoApprove` / `advisorGuard` / `engineering`，逐项布尔）⇒ 模式位四写（核 `setSlot*` 四写 + 活代理重施 + ENG×PLAN 互斥）；回执 `{ ok, flags? }`（成功径 `flags` = 活值投影——agent 不在场 ⇒ 键缺席）；**写回执后出站 `ev:flags`**（§1 该行）。`at:complete`：载荷 `{ query, seq }` ⇒ @ 补全文件枚举过滤；回执 `{ ok, matches, seq }`（`seq` 原样回携——迟到丢弃 = 消费面判据） |
| `session:gc` / `session:index` | **会话维护线两通道（R1——位次 32 ∕ 33）**——两通道**无会话 `key`**（主进程菜单两项触发；命令面板本体 = 端差登记）。`session:gc` ⇒ 会话数据回收：无载荷；回执 `{ ok, candidates, confirmed, deleted, files, skipped, skippedFiles }`（**驳回 ⇒ 零删除**；确认面 = 原生模态——`thincoder-desktop/src/main/window.mjs` `confirmRecycle`）。`session:index` ⇒ 派生索引重建（清四表 → 全量重扫）：无载荷；回执 `{ ok, sessions, changed, messages, toolCalls, bytes }` ∥ `{ ok:false, …, error }`（不可得 ∕ 失败落回执——不抛）。处理体 = `thincoder-desktop/src/main/session-maintenance.mjs` 转口（核出口直取——零算法副本） |
| `index:build` | **语义索引构建（R2——位次 34）**——无载荷（`dir` = 主进程当前项目 `currentCwd()`）；`gitSync` 增量径（无锚 ∕ 非 git 仓 ⇒ `null` ⇒ 落全量 `codeSync` ∥ `docSync`）；回执 `{ ok, files, chunks }` ∥ `{ ok:false, reason }`（`no-project` 零动作；失败句并不吞）；处理体 = `thincoder-desktop/src/main/index-status.mjs` 转口 |
| `index:status` | **索引状态读数（R2——位次 35）**——无载荷；回执 `{ ok, status: { built, files, chunks, dbBytes, origins, hasEmbedder } }`（`built` = 计数 > 0；`hasEmbedder` = `embedding.apiKey` 在场；`dbBytes` ∥ `origins` = **P1 两键（KD-69——已落）**：库文件字节数 ∥ 逐 origin code ∥ doc 行数——核只读出口透传；未开项目 ⇒ 零计数仍成回执）；读数经核**只读出口** `memoryStatus()`（零 SQL ∕ 零表名——需求档 D8）；处理体 = `thincoder-desktop/src/main/settings.mjs` 转口 |
| `settings:env` | **env 族（R7——白名单末位 36）**——读 `{}` ⇒ `{ ok, reason:null, proxy, shell: { current, candidates } }`（`proxy` = 核 `normalizeProxy` 投影缺省两键（`uri` / `web`）；shell 候选 = 平台探测——「System default」恒首）；写 `{ patch: { proxy?, shell? } }`（merge 语义：proxy 空 `uri` ⇒ 节删 ∕ shell 空 ⇒ 键删；**写经核 `writeConfigAtomic`**——端零自写盘；非法 patch ⇒ reason 直传零写）；`{ testProxy: { uri } }` ⇒ 转口 `providers.testProxy`（探针单源——零第二 HTTP 客户端）；三支互斥（`patch` 与 `testProxy` 同在 ⇒ `invalid-patch` 零动作） | 处理体 = `thincoder-desktop/src/main/settings-env.mjs` |
| `settings:tools` | **tools 族（R7）**——读 `{}` ⇒ `{ ok, reason:null, embedding: { hasKey }, websearch: { hasKey } }`（**值一律不下发**——密钥纪律）；写 `{ patch: { embedding?: { apiKey }, websearch?: { apiKey } } }`（空串 = 清键 ⇒ 摘键；embedding 置键回填核 `DEFAULTS` 的 `baseURL` ∕ `model`——缺位取核单源；`apiKey` 非串 ⇒ `invalid-patch` 零写）；写经核 `writeConfigAtomic` | 处理体 = `thincoder-desktop/src/main/settings-tools.mjs` |
| `mcp:tools` | **MCP 工具清单 ∕ Test 探活（R7）**——① `{ name }` ⇒ `{ ok, tools: [{ name, description, params }] }`（连接列举——核 `connectMcpServer` 幂等；`params` = `parameters.properties` 键名逗号连；工具名 = 核构建面原形〔含 `<server>_` 前缀〕）；② `{ name, test: true }` ⇒ `{ ok, toolCount, latencyMs }` ∥ `{ ok:false, reason:"probe-failed", detail }`（核 `probeMcpServer` 一次——零副作用）；名不在配置 ⇒ `{ ok:false, reason:"unknown-server" }`（零连接） | 处理体 = `thincoder-desktop/src/main/mcp-servers.mjs` |
| `theme:state` | **勾选态回读（D36 增——白名单末位 47 · 已落）**——载荷 `{ theme }`：`theme` = 三值闭集 `system` ∥ `light` ∥ `dark`（当前生效主题落地值——值面单源 = `thincoder-desktop/renderer/theme.mjs` `THEMES`）；**渲染 → 主单向状态报告**——发送 = 渲染面两写作点（装配初值 ∥ 设置面出口落地——单写者两调用位）；接收 = 主进程勾选态缓存 + `refreshMenu()`（`thincoder-desktop/src/main/window.mjs` `setMenuTheme`）；回执 `{ ok: true }` ∥ `{ ok: false, reason: "invalid-theme" }`（表外值 ⇒ 零变更 + 记错——防御档）；**限度 = 报告缓存**（主进程零直读渲染面 `localStorage` ∥ 零轮询；报告未达窗 = 主题▸全零勾——fail-open）；决策单源 = `docs/desktop/design/MENU.md` §1 **KD-65** | 处理体 = `thincoder-desktop/src/main/ipc.mjs`（`setMenuTheme` 转口——缓存与重建住 `thincoder-desktop/src/main/window.mjs`） |
| `panel:state` | **渲染面实况回读上报（位次 48 · 已落）**——载荷 `{ key, blocks }`：`blocks` = 渲染面子代理块快照（**判别六键 + `role`/`id` 随行**——`{ key, status, frozen, awaitingDigest, region, dom }` + `{ role, id }`；判别面 ∥ 载荷形单源 = `docs/desktop/design/PANEL-READBACK.md` §2.1）；**渲染 → 主单向状态报告**——发送 = 渲染面帧出口（签名去重；`thincoder-desktop/renderer/panel-readout.mjs`）；接收 = 主进程读数缓存（`thincoder-desktop/src/main/panel-live.mjs`——后报覆前报）⇒ 核 `panel` 工具 view ∥ freeze 读源（`agent._panelReadout`）；回执 `{ ok: true }` ∥ `{ ok: false, reason }`（键面 ∥ 形状校验——防御档）；**限度 = 报告缓存**（主进程零轮询 ∥ 零直读渲染面；报告未达 ⇒ 工具侧回落降级链——`PANEL-READBACK.md` §2.1） | 处理体 = `thincoder-desktop/src/main/ipc.mjs`（`panelLive.report` 转口——缓存住 `thincoder-desktop/src/main/panel-live.mjs`） |
| `team:status` / `team:login` / `team:logout` / `team:verify` | **团队族四通道（位次 49–52）**——① `team:status`（无载荷）⇒ 回执 `{ ok, loggedIn, server, member, label }`（投影自 config `team` 段——登录态 = `token` 在场）；② `team:login`：载荷 `{ server, username, password }` ⇒ 回执 `{ ok, reason?, notice? }`（成 ⇒ 写 config（核 `team.mjs`）⇒ 渲染面重读；reason 四值 = `network` / `credentials` / `rate_limited` / `write_failed`——词四句逐字同（`docs/core/design/TEAM.md` §2.5）；`notice` 仅同名手工条目冲突时在场——值 `"manual-name-conflict"` ⇒ 渲染面就地提示「已存在同名 provider「team」——未自动添加；请改名或删除后重登」（三端逐字同句——`docs/core/design/TEAM.md` §2.2））；③ `team:logout`：无载荷 ⇒ `{ ok, revokeDelivered? }`（核面吊销 best-effort + 本地清 token——网络失败照清；`revokeDelivered` 缺席 = true（服务端吊销已送达）；`false` ⇒ 渲染面就地提示「服务端吊销未达」——`docs/core/design/TEAM.md` §2.3）；两提示 = 一次性事件（登录/退出当刻就地显示——`team:status` 回执不带提示字段）；④ `team:verify`（无载荷）⇒ 回执 `{ ok, state }`（state = `valid` ∥ `invalid` ∥ `unreachable`——核 `teamVerify()` 直传；未登录 ⇒ `{ ok:false }` 零调核（**端侧切片口径 = `verify` 落 `null`**——按未登录渲染）；只读校验——零写盘）；机制单源 = `docs/core/design/TEAM.md` §2 ∥ §2.6 | 处理体 = `thincoder-desktop/src/main/team.mjs`（B1 批已落——核 `thincoder-core/team.mjs` 转口；`writeConfigAtomic` 单写者；**+`teamVerify` 转口**） |
| `team:rotate` | **团队 token 轮换出口（位次 54 · 已落）**——载荷 ∥ 回执行 = `docs/core/design/TEAM.md` §2.7（核 `teamRotate` 机制单源）；**通道面载荷形** = 无载荷 ⇒ `{ ok }` ∥ `{ ok:false, reason }`（`reason` 本流程子集 = `network` ∥ `invalid` ∥ `write_failed`——单源 = `docs/core/design/TEAM.md` §2.7 ∥ `thincoder-desktop/src/main/team.mjs:14-15`） | 处理体 = `thincoder-desktop/src/main/team.mjs`（`teamRotate` 转口——核 `thincoder-core/team.mjs`；`writeConfigAtomic` 单写者） |

**页游标注（`history:page` 回执 · 单源）**：

1. **`next` = 窗下界**：`end = before == null ? 源历史条数 : Math.max(0, Math.min(before, 源历史条数))` · `next = Math.max(0, end − HISTORY_PAGE_SIZE)`——与核窗界同式（`thincoder-core/history-window.mjs:111-112`）；页首条在场时与「本页首条全局 `idx`」同值。
2. **零消息页**（窗口内可视 0 条 ∧ `hasOlder` 真）同走该式 ⇒ 游标必推进（不粘滞）；`HISTORY_PAGE_SIZE` = 核单源常量（`thincoder-core/history-window.mjs:24`——宿主 `import`，零字面量）。
3. **无更早页** ⇒ `next = null`（判据 ⇔ 窗下界 `0`——即核 `hasOlder === false`，`thincoder-core/history-window.mjs:178`）。
4. **记录计入页量**：`{ records: true }` 直通时留档记录（`digest` ∥ `subagent`）**占条目位**——页量 200 条 = 人读线条目数（含记录）；`hasOlder` ∥ `next` 三式零改（游标按条目推进）；「零消息页」式同覆盖「仅记录页」（可视消息 0 ∧ 记录在场 ⇒ 游标必进，不粘滞）；负控 = 默认关 ⇒ 现行行为逐字等价。

**白名单面**：白名单 = **54 项**（**`team:rotate`（末位 54）· 已落**；**`secret:respond`（末位 53）· 已落**；
  **`team:status` ∥ `team:login` ∥ `team:logout`（末位 49–51）· 已落**；**`team:verify`（末位 52）**；
  **`theme:state`（末位 47）· `record:append`（末位 46）· `panel:state`（末位 48）——皆已落**）

- **既有十三项**（序锁定 · 位次 1–13）：`config:read` · `project:open` · `project:recent` · `sessions:list` · `session:create` · `session:switch` · `session:rename` · `session:delete` · `session:resume` · `approval:respond` · `history:page` · `msg:send` · `msg:interrupt`。
- **位次 14–25**：`provider:list` · `provider:save` · `provider:remove` · `provider:verify` · `model:list` · `settings:agent` · `mcp:list` · `mcp:save` · `mcp:remove` · `config:write` · `ledger:read` · `batch:status`。
- **位次 26**：`question:respond`——作答通道（载荷 / 回执见 §2 该行 · 核侧挂起门 = `thincoder-desktop/src/main/suspensions.mjs`）。
- **位次 27**：`session:prefs`——会话级偏好写面（载荷 / 回执见 §2 该行 · 语义与核面解析链 = 「会话级偏好注」）。
- **位次 28**：`subagent:stop`——子 agent 停止出口（载荷 / 回执见 §2 该行 · 语义 = `docs/desktop/design/UI.md` §1「批注（对齐重定位）」项 2）。
- **位次 29**：`file:open`——文件链接打开（载荷 / 回执见 §2 该行 · 语义 = `docs/desktop/design/UI.md` §1「批注（对齐第三批 · 小修族）」相抵②）。
- **位次 30–31**：`session:flags` · `at:complete`（载荷 / 回执见 §2 该行）。
- **位次 32–33**：`session:gc` · `session:index`（载荷 / 回执见 §2 该行）。
- **位次 34–35**：`index:build` · `index:status`（载荷 / 回执见 §2 该两行）。
- **位次 36–38**：`settings:env` · `settings:tools` · `mcp:tools`（载荷 / 回执见 §2 该三行）。
- **位次 39**：`model:catalog`——全渠模型清单扇出（载荷 / 回执见 §2 该行 · 语义 = 「模型清单注」· 探针单源 = 核 `probeChannelModels` + `probeTargetOf`）。
- **位次 40–45**：`provider:setKey` · `provider:delKey` · `provider:models` · `provider:setProxy` · `mcp:update` · `mcp:reconnect`（载荷 / 回执见 §2 该两行 + 「设置族与项目级信息族注」表该六行）。
- **位次 46**：`record:append`——留档记录追加（载荷 / 回执见 §2 该行；**通道族面** = `subagent` 到达族 ∥ `digest` 族经通道不可达——同点双动作）。
- **位次 47**：`theme:state`——勾选态回读（载荷 / 回执见 §2 该行 · 限度 = 报告缓存）。
- **位次 48**（已落）：`panel:state`——渲染面实况回读上报（载荷 / 回执见 §2 该行 · 限度 = 报告缓存）。
- **位次 49–51**（已落）：`team:status` ∥ `team:login` ∥ `team:logout`——团队族三通道（team 段；载荷 / 回执 = §2 该行）。
- **位次 52**：`team:verify`——登录态活校验（载荷 / 回执 = §2 团队族行；语义 = `docs/core/design/TEAM.md` §2.6——三值 ∥ 触发点制）。
- **位次 53**（已落）：`secret:respond`——凭据门出口（出口 = `ipc.mjs` `questionRespond` 同体别名；载荷 / 回执 = §2 该行）。
- **位次 54**（已落）：`team:rotate`——团队 token 轮换出口（核 `teamRotate`——吊销当枚 + 同标签重签；机制单源 = `docs/core/design/TEAM.md` §2.7）。
- **逐条勘定**：索引状态读数面 = **已落**（`index:build` ∕ `index:status`，位次 34 ∕ 35；见 §2 该两行 + `docs/desktop/design/PROJECT.md` §6.1 D8 行）。
- 唯一入册面 = `thincoder-desktop/src/main/ipc-registry.mjs`（`HANDLERS` 表 = 白名单逐项 → 处理体映射 + 注册序）≡ `thincoder-desktop/src/preload/preload.cjs` 暴露表（两向相等 = 用例机检）；分发面 = `thincoder-desktop/src/main/ipc.mjs`；表外通道 ⇒ 拒绝（零静默兜底）。

**会话族注（`sessions:list` 载荷 · 分批口径）**：

1. **载荷** = `{ cwd, sessions }`（未打开项目 ⇒ `cwd: null` + `sessions: []`）：`sessions` = 当前项目槽摘要投影（核 `listSlots` 条目——A8 出站键〔handler 重映射，源档零改〕），每行 `{ slot, title, createdBy, updatedAt, messageCount, isActive }`。
2. **行字段语义**：`createdBy` 缺键 ⇒ `""`（未知 ⇒ 渲染面**不标注**）；`isActive` = 核 manifest 当前活动槽（**只读**面——不认领、不写 manifest）；`updatedAt` = 核读数（行序 = 核投影序）。
3. **零新增算法**：投影只取核已有读数（`listSlots`）——不落新存储、不重算摘要、不扫目录名；端壳转口 = `thincoder-desktop/src/main/session-slots.mjs`（零算法副本判据照旧）。
4. **位标面（运行标记 / 待审批位）已落（批 7 / 批 A）**：来源 = 渲染面状态源（归约面 `thincoder-desktop/renderer/events.mjs` 置 / 清位——挂起表 + 回合事件；码 `running` / `approval` / `done`）；
   - 消费面 = 会话控制条目位标（`thincoder-desktop/renderer/views/session-control.mjs`——`deriveTabBadge` 条目位标字段）· 状态栏跨会话告警位（`thincoder-desktop/renderer/views/statusline.mjs`——`ALERT_CODES` 子集）；
   - **不经本行载荷字段**（`sessions` 字段集如项 1——A8 同拍）；会话控制条目位标面已落（位标码读 `tabBadges` 切片——`thincoder-desktop/renderer/views/session-control.mjs`）。
5. **写通道回执（批 5 落）**：五个写面通道（`session:create` / `session:switch` / `session:rename` / `session:delete` / `session:resume`）返回**统一信封** `{ ok, reason: null|string, cwd, slot }`——四键齐备（`reason` 成功 = `null`）；`slot` = 成功槽号、否则 `null`；
   - **`session:prefs` 同族例外** = 信封 + `meta`（三键——§2 `session:prefs` 行 / 「会话级偏好注」项 7）。
   - **reason 分档** = `no-project`（未打开项目——动作层判 cwd 空；覆盖 `create` / `rename` / `resume`）· `slot-missing`（动作层整形：核返回 `null` / `false`）· `last-session`（**对齐第三批增**——`session:delete` 末项门：会话数 ≤ 1 拒·动作层判）· 核 `renameSlot` **闭集直传**（`invalid-slot` / `file-missing` / `parse-failure` / `mtime-conflict`）。
   - **cwd 空档不对称（在案）**：`switch` / `delete` **无** `no-project` 档——cwd 空 ⇒ 核 `loadManifest` 吞异常返空清单（`thincoder-core/session-slots-manifest.mjs:55-64`）⇒ 恒落 `slot-missing`。
    - **`slot-missing` 一词三因**（核内同一出口）：非整数槽号 / 槽不可得（盘面无文件 ∧ manifest 无条目——条目不再单独成门，见 `docs/core/design/SESSION.md` §6.22 判据句 4）/ 数据文件不可读（`thincoder-core/session-lifecycle.mjs:291-293`）。
   - **fail-loud**：意外抛**不吞**、直传 invoke 拒绝（沿 `config:read` 先例）。动作层 = `thincoder-desktop/src/main/session-actions.mjs`——**零算法副本**（不预校验槽号、不重命名 reason、不规整 `title`）。

6. **账本异常注记（`sessions:list` 回执增字段 `ledger`）**：本字段**异常才携**（缺席 = 正常——**负断言**）；判据单源 = 核 `ledgerHealth(cwd)`（`docs/core/design/SESSION.md` §6.25 判据句 4）——触发 = `refused > 0 ∨ scene`（与 CLI / VSC 同口径，**脱离会话计数条件**）。
   - **形** = `{ refused, reason, scene }`：`refused` = 本进程累计拒写数（> 0 ⇒ 在场）；`scene` = 该 cwd 的 `{manifest}.corrupted` 现场在盘（`docs/core/design/SESSION.md` §6.23）；`reason` = 核 `lastReason` 逐字 ∥ `"scene"`（**仅**损坏现场时——沿 VSC 同口径）。
   - **取数** = `thincoder-desktop/src/main/sessions.mjs`（经端壳 `thincoder-desktop/src/main/session-slots.mjs` 转口引核出口——零算法副本）；`cwd` 空（未打开项目）⇒ 不携（无判据对象）。
   - **消费** = 会话控制面**下拉首行**账本警示注记（`div.session-ledger-notice`——形态 / 锚 / 词键单源 = `docs/desktop/design/SESSIONS.md` §2.5「批注（账本警示面）」）；**异常清 ⇒ 注记状态分两分支**（单源 = 核 `ledgerHealth(cwd)`）：`scene` 分支 = 损坏现场档清 ⇒ 注记消失（零历史态）∥ `refused` 分支 = 核**本进程累计**（不清零）⇒ 进程内一旦拒写，注记持续在场**至重启**（有界）——随下一次 `sessions:list` 刷新自见。
    - **零新通道 / 零白名单项**：`ledger` = 既有回执内字段——白名单计数零动（本键不新增项——现值 **54**）。

**会话级偏好注（`session:prefs` · 单源）**：

1. **语义**：provider / 模型 / 推理档位三键 = **会话级**（需求 §3.1:47——随会话槽持久化，与 CLI / 扩展端**同一份槽**）；**config 零写**（`settings:agent` 仍是设置面全局默认面，不再作会话级三值出口——需求 §3.5:94 现状定性）——**唯一例外 = 项 8 选定写回**（模型面实变 ⇒ `defaultModel` 同拍写回）。
2. **写入面**：核新出口 `setSlotPrefs(cwd, slot, patch)`（`thincoder-core/session-slot-write.mjs`——沿 `setSlotAutoApprove` 同形：一次读-改-写，复用 `writeFlag` / `saveSlotData` 单点）⇒ 槽数据文件即更新（跨端立即可读；不另立存储）。
3. **槽字段（核面小改三处）**：`newSlotData` 增 `effort: null`；`applySession` 应用 `data.effort`；`saveSession` 的保存字段表**须携带 `effort`**——否则槽写面被下一次保存整对象抹除（同 `engTokens` 那类缺陷；`thincoder-core/session.mjs:105-166` 现表无 `effort`）。
   - **老槽（无该键）⇒ 零行为变更**。槽值闭集（`null`〔= 老槽即此态〕∥ `"off"` ∥ `reasoningEffortEnum` 成员）与三处改点的判据**单源 = `docs/core/design/SESSION.md` §6.21**（本注不重述值域）。
4. **施加面**：活动会话 ⇒ 内存态即生效（**在飞期收窄**——在飞选定**受理** ∥ 施加**顺延**至回合尾 `settleTurn` 落盘后重施——`docs/desktop/design/COMPOSER.md` §1 **KD-19**；
   模型合并语义 = 核 `applySession` 模型合并支单点；档位 = 核 `resolveEffortPatch(level, model)` 纯函数——族别 off 形经核 `think-off.mjs` `thinkOffShape`，档位值域单源 = `specForModel(model).reasoningEffortEnum`）；**非活动槽 ⇒ 只写盘**，switch 时由 `applySession` 生效。
5. **零算法副本**：端侧不重算槽语义、不校验模型值域（候选面来自 `model:list`；写面取字面串——沿 `settings:agent` `defaultModel` 先例）；**档位枚举的校验面 = 端侧控件闭集**（写面不预校验——槽值可被跨端 / 手工改写，表外档位字面串 ⇒ `effort` 归一 `null`〔未设〕，沿核读侧容忍口径）。
6. **端差登记（有意分歧）**：CLI `applyThink` 面不动——推理档位面端侧自有（用户裁定「核内无需位」；在案 = `thincoder-vscode/src/agent.mjs:260-265`）；桌面与 VSC 同义（各自端侧实现，核内零调用点）。
7. **回执与失败径**：reason 闭集 = `invalid-patch`（非对象 / 空对象 / 表外键）· `model-required`（`provider` 变更未同送 `model`）· `bad-key`（键不合法）· `slot-missing`（槽不可读）——**四档**；
   **成功 = 信封 + `meta`（三键）· 失败缺 `meta` 键**；**选定写回径（项 8）成功另携条件性 `providerState`**（写后核读——键缺席 ⇒ 渲染面零写）；失败径一律零写（槽值不变）；
   **选定写回失败** ⇒ 另叠 `carryover: { ok: false, reason }`（槽写已受理 ⇒ 回执仍 `ok:true`——**不反扑**；槽写失败径零该键）。

8. **选定写回（`defaultModel` 同拍写回）**：**用户显式选定**（模型菜单选模型——模型钮 ∥ `/model` 斜径同一函数；`selectModel` ⇒ `session:prefs` 携 `provider` + `model` ∧ 槽值**实变**）⇒ 宿主同拍写回 config `defaultModel = "<provider>:<model>"`（本会话槽写照旧——既有语义零改；机制单源 = `docs/core/design/SESSION.md` §6.21 判据句 6）。四事：
   - **触发判据 = 槽面实变**（写盘前读 ∥ 写入值比对）：系统同步写（`models` 推送回声——会话切换 ∥ 闲时照发的同值回写）**不写**；只送 `effort` **不写**；`bad-key` / `slot-missing` 拒径零写（判序不变）；系统回退自动采用**不写**。
    - **写面**：核 `writeConfigAtomic`（端侧零自写盘——沿设置面同款执行体）+ 写后探一次（S3 同律）；**复合等值 ⇒ 零写**；定序 = 槽先配置后——配置面失败（`mtime-conflict` 等）**不反扑**会话写（回执仍 `ok:true`；主侧 `console.error` 记错——零静默）。**失败码随回执叠出 `carryover: { ok: false, reason }`**——渲染面据该键出**同一条失败行**（「主侧记错、渲染面零感知」缺口闭合）。
     实现落点 = 写回单点 `thincoder-desktop/src/main/settings.mjs`（`defaultModel` 写 + 探一处）∥ 触发支 `thincoder-desktop/src/main/agent-host.mjs` `setPrefs`（选定支）。
    - **回执**：选定写回径成功回执另携 `providerState`（写后核读——**第四刷新点**；`docs/desktop/design/COMPOSER.md` §2 批注；键缺席 ⇒ 渲染面零写）；**失败径** ⇒ 叠 `carryover: { ok: false, reason }`（与 `providerState` 互斥：失败不携 `providerState`；消费面 = `docs/desktop/design/COMPOSER.md` §2 批注项 4）。
    - **边界**：**既有写点**（**全链写点轴**——向导「采用」（唯一视图出口）∥ 渠道保存（含补写）∥ 迁移；**IPC 写口轴 ∥ 逐处 = 设置族注 8①**）语义零改（向导「采用」仍只写全局默认、不写会话槽——两面不互相顶替，需求 §3.5 项 5/6；渠道保存首跑补全 ∥ 迁移照旧）；候选面 ∥ 词表 ∥ 通道集 ∥ 白名单零新。

**打开态播种注（`history:page` 回执 `seed` · 单源）**：

1. **语义**：打开 / 切换既有会话 ⇒ 以槽数据播种状态行**读数切片**（需求卷 D17；恢复态与 CLI 同见 = 水合语义 `thincoder-core/session-lifecycle.mjs:110` 的桌面对位）。
   播种面（**读数切片段**（**14 段**——承载 18 段中 banner 四段 = **非 seed 面**，供面 = `flags`，每次页读皆携）· 逐段裁定 · 零静默省略）= **播种 2 / 不播种 12** 逐段理由 → **单源 = `docs/desktop/design/UI.md` §1「批注（D17 / D19 · 残余补齐 · 两项）」项 1**（本注不重述）。
2. **载荷**：`seed = { tasks, usage? }`——`tasks` = 槽数据 `tasks` 直取（非数组 ⇒ `[]`——沿核水合口径 `data.tasks ?? []`）；`usage` = **有效读数**（数字 ∧ `> 0`）才在场，否则键缺席（沿 `ev:usage` 同门——0 不落节点，禁假造）。
   `usage` 读数 = 核 `sessionReading(data, { providers, fallback, defaultModel })` 投影（单源 = `docs/core/design/SESSION.md` §6.24——与 `applySession` 后读数同源同式）。
3. **在场条件**：**仅首屏读**（`before == null`）——回填读（`before != null`）回执**无 `seed` 键**（防回填以盘上旧值覆盖活切片）；**时序判据**：本键在飞（回合未尾）⇒ 种不落——**零写**（活切片为准）；**播种只填空白**：**切片键已在场（无论来源）⇒ 零写**（闭合回合尾窗口；实现读法 = 键在场即零写——限定词注销，零新机制）。
4. **消费**：渲染面 `applyPage` 首屏支（`thincoder-desktop/renderer/events.mjs`）同笔写 `tasks[key]` / `usage[key]` 两切片（与 `meta` 同一写点）；`seed` 缺省 / 形不合 ⇒ 该槽零写（禁假造）。订阅键面零改（`STATUS_KEYS` 已含两键）。
5. **缺席降级**：槽不可读 ⇒ 回执 `{ ok:false }`（零播种——既有失败面不变）；配置不可读 / 读数计算抛 ⇒ `usage` 键缺席 + `console.error`（零静默；读面保持 fail-soft）。
6. **零新通道**：`seed` = 既有回执内字段——§1 **二十五通道**计数 / 白名单面计数零动（现值 = 事件 **25** ∥ 白名单 **54**——本注零新增）。

**模式位投影注（`history:page` 回执 `flags` · 单源）**：

1. **语义**：四模式位（PLAN / AUTO / ADVISOR / ENG）的**桌面状态行呈现面**（需求卷 D22——「屏面为准」重审：四态上状态行行首，与 CLI banner 同段位、同语义；形态单源 = `docs/desktop/design/UI.md` §1「批注（状态栏对齐 · 屏面为准）」项 2）。
2. **载荷**：`flags = { planMode, autoApprove, advisorGuard, engineering }`（逐项布尔）——**活值优先口径**（agent 在场 ⇒ 活值直读（下行四式）；不在场 ⇒ 槽字段投影——在场条件 = 项 3；与 CLI banner 判定同源 = `thincoder-cli/src/tui/render-frame.mjs:233-236`）：
   `planMode` = `agent.planMode` · `autoApprove` = `agent.autoApprove` · `advisorGuard` = `agent.config?.advisor?.guard === true` · `engineering` = `agent.config?.agent?.engineering === true`（零算法副本——活值直读，不含档值复刻）。
3. **在场条件**：**活值优先**——该会话 agent 在场 ⇒ 键在场，四布尔直读活态（项 2 活值支）；
   agent 不在场（桌面打开态常态——agent 装配在 `msg:send`，`thincoder-desktop/src/main/agent-host.mjs:188-198` / `:220`）⇒ **以会话槽字段投影**（`autoApprove` / `planMode` / `advisor.guard` / `engineering`——槽字段直读，与 D17 `seed` 同源同形；`history:page` 处槽数据已在手 ⇒ 零额外 I/O）；
   槽亦读不出（缺 / 坏档）⇒ **键缺席**（该槽零写——「禁假造」边界收窄至此）；

**每次页读皆携**（回填读同在场——与 `seed` 的首屏限定异）。
   理由 = D22 屏面为准：桌面打开态须与 CLI 同见 banner。
4. **消费**：渲染面切片刻 `sessionFlags[key]`（与 `meta` 同写点）→ 状态行四段（真 ⇒ 在场 · 假 / 缺 ⇒ 零节点——负向锁）；会话控制面不消费（本面只住状态行一处——「同一事实一处」）。
5. **桌内翻转即时刷新**：落形 = `approval:respond` **成功径回执叠加 `{ key, flags }`**（宿主 `flagsOf(key)` 活值投影——与页读同一函数，零算法副本）⇒ 渲染面 `submitVerdict` 以回执写 `sessionFlags[key]` 切片（写点 = 归约面纯动作，与页读同点）⇒ 状态行随切片重挂；**零新通道 / 零新白名单项**；提问门径 / 失败径零叠加（零乐观写）。
6. **零新通道**：`flags` = 既有回执内顶层键——§1 **二十五通道**计数 / 白名单面计数零动（现值 = 事件 **25** ∥ 白名单 **54**——本注零新增）。

**provider 态投影注（`history:page` ∥ `msg:send` 回执 `providerState` · 单源）**：

1. **语义**：核统一解析三态（`ok` ∥ `fallback` ∥ `invalid` + **invalid 类合成式**——单源 = `docs/core/design/PROVIDER.md` §6.22）的桌面投影面——供 composer 态明示行（`fallback` ∧ 非 invalid 类 ⟺ 行在场；词 = `docs/desktop/design/COMPOSER.md` §2 批注）。
2. **载荷**：`providerState = { state, channel, model, reason, invalidReason }`——`state` 三值闭集；`channel` ∥ `model` = 解析出的运行渠道 ∥ 模型（不可解析 ⇒ `null`）；
  `reason` = 核语义源串（state≠ok 在场——**禁串嗅探**，渲染面按 `state` ∥ `invalidReason` 出词）；`invalidReason` = 核 `providerInvalidReason` 快照（provider 不完整 ⇒ 非空——**invalid 类合成式**的一半）。
3. **在场条件**：`history:page`（每次页读）与 `msg:send`（**成功回执**——发送时点刷新）皆携；**第三刷新点**：设置写回执（`settings:agent` ∥ `provider:save` 成功回执）同携——实落写点三处 = `thincoder-desktop/src/main/settings.mjs:228` ∥ `:296` ∥ `thincoder-desktop/src/main/providers.mjs:159`（写后核读；渲染面三出口落切片）
   ——设置面修好 `defaultModel` 后即时刷新；**第四刷新点**：`session:prefs` 成功回执（选定写回径——模型面实变）同携（写后核读）。失败径回执沿 `providerKind` 面（零叠加）。

   落点 = 主侧写点 `thincoder-desktop/src/main/settings.mjs` `carryoverDefaultModel`（写后核读）∥ 触发支 `thincoder-desktop/src/main/agent-host.mjs` `setPrefs`（`:235-261`）∥ 渲染面消费档 = `thincoder-desktop/renderer/composer-wire.mjs` `writePrefs`（回执落切片——键缺席 ⇒ 零写）⇒ `composer-sync.mjs` `paintNotices` 重派生。
4. **消费**：渲染面落 store 切片（与 `meta` 同写点）⇒ `paintNotices` 重派生（行序 ∥ 清位 = 本档 §2 批注；`state === "ok"` ∧ 非 invalid 类 ⇒ 零节点——负向锁）。
5. **零新通道**：`providerState` = 既有回执内字段——§1 通道计数 ∥ 白名单面计数零动。

**附件注（`msg:send` `images` 载荷 · 单源）**：

1. **载荷**：`images` = **dataURL 串数组**（`string[]`——严格串形，VSC `msg:send.images` 同形；mime ∕ 名从串推）（缺省 / 空数组 ⇒ 无附件路径）；渲染面零 fs ⇒ 图面数据经本通道入主进程落盘。
2. **落盘**：主进程写入 `<cwd>/.thincoder/tmp/paste-<ts>-<i>.<ext>`（`<ext>` 由**串内媒体类型**推——mime ∕ 名从串推；先例 = `thincoder-vscode/src/extension/image-handler.mjs`）⇒ 交核的 = **绝对路径数组**（核消费面 = `thincoder-core/agent/setup-reminders.mjs:248` `appendImagePointer`——尾附 `[Attached images: …]` 指引）。
3. **上限与失败**：单项超阈（先例数值 = 15MB）⇒ 该项弃（其余照发）；**合计超阈（30MB）⇒ 超出部分弃**（其余照发）；落盘失败 ⇒ 该项弃（不阻断发送）；**零静默**——弃项经回执 `degraded` 面浮出（`"partial"`）。
4. **非视觉模型降级面**（需求 D13 逐字——对齐 VSC 面 = 先落盘 + 降级跑者）：端侧**前置门** = 核 spec 的 `multimodal` 判据（同源 = `thincoder-core/agent/setup-reminders.mjs:251`——核侧非多模态 ⇒ 抛错）⇒ 假 ⇒ **先落盘 + 降级跑者**（读图需要路径；缺省跑者 = 核 `thincoder-core/vision-reader.mjs`）
  ——成功 ⇒ 描述注文（`[图片 <路径表> 描述: <描述>]`）注回文本 ∕ 失败 ⇒ 原文本尾追加一行说明（旧端态；词键面 = 渲染面词表）；落盘 0 件 ⇒ 说明行终态（零路径）；零核错抛出。
   **回执时机**：降级窗内回执延至读图毕（成功 ∕ 失败同点）；降级窗内 `dispose` ∕ 切项目级联 ⇒ 回执 `{ ok: false, reason: "aborted" }`（零起跑）。回执 `degraded: "non-vision"` ⇒ 输入区明示（不静默丢图）。
5. **回执三形**：`{ ok: true }`（全收 ∕ 降级成功且零弃）· `{ ok: true, degraded }`（降级 / 部分弃）· `{ ok: false, reason }`（reason 闭集 = §1 `msg:send` 行——含 `aborted`：降级窗内 `dispose` ∕ 切项目级联径）。
6. **临时文件清理（回合尾）**：落盘件住 `<cwd>/.thincoder/tmp/`——宿主回合尾结算点（主进程）清本回合落盘件；清理失败 ⇒ `console.error`（容忍——零静默）。

**项目面注（`project:open` 选中后语义 · `project:recent` 读面）**：

1. **槽命中 / 生成（打开即物化）**：按 cwd 哈希取会话路径（核 `sessionPath(cwd)`——`thincoder-core/session-slots.mjs:92`）——已有数据文件即命中；**无数据文件**的族按核 `newSlotData` 同形落空槽数据文件（`thincoder-core/session-slot-write.mjs:38`；同链先例 `thincoder-vscode/src/extension/session-io.mjs:146-147`）⇒ 打开即物化，最近面遂可回读 cwd。**零新存储**：既有会话格式 + 既有槽索引。
2. **切当前项目**：主进程**内存态**（不落盘——`docs/desktop/design/SESSIONS.md` §1 KD-9）；唯一持有点 = `thincoder-desktop/src/main/projects.mjs`；会话根 = 由核 `sessionPath` 反推（照扩展端端壳访问器先例 `thincoder-vscode/src/extension/session-slots.mjs:56-58`——`sessionsDir()`）。
3. **刷新与接续**：返回 `{ cwd, recent }` 后，渲染面经 `sessions:list` 刷会话控制面（`refreshRail`）；`project:open` 成功 ⇒ 渲染面**自动一次** `session:resume`（「点开即可续」——需求 §3.1）⇒ `ok` ⇒ 开页 + 两读面刷新；此后开页走 `session:switch`（点条目**同一路**——激活即切换会话）。
   - **「成功」判据（fail-soft 通道——无成功旗标）**：回执 `cwd` 变更 ∨ `cwd` = 请求 `fsPath`（取消 / 无效路径同返 `{ cwd, recent }`：`thincoder-desktop/src/main/projects.mjs:114-120`）；同目录经选择框重选（无 `fsPath`）不重复接续。
4. **`project:recent` 读面 = 核会话槽面回读（零新存储）**：扫 `~/.thincoder/sessions/` 的 40 位哈希族（族判据单源 = `thincoder-core/session-stale.mjs:46` 的 `GROUP_RE`；纯函数 `groupSessionEntries` `:56`，给每组最新 mtime）→ 每组取一份数据文件回读 `cwd` → 按组最新 mtime 降序取前 10（**位次 = 组最新 mtime**）。不落新文件、不落新配置字段（需求档 §2「不得另立存储格式」）；重启后列表仍在 = 槽面事实。
   - **位次随动面**：组内任一条目（数据文件 ∥ 清单 ∥ 本端记录）写入即随动——「打开既有族」亦随动（点开即续 ⇒ 本端记录写）；`thincoder-desktop/src/main/projects.mjs:28-37` 逐条目 `mtimeMs` 全员计入。
5. **`dialog:openFolder` 折入 `project:open`**——渲染面单通道，目录选择不单列。
6. 通道注册面 = `thincoder-desktop/src/main/ipc-registry.mjs`（`HANDLERS` 表 + 注册序）；分发面 = `thincoder-desktop/src/main/ipc.mjs`。
7. **重启自动重开（本端「上次打开」——机制单源）**：读面 = 本端记录面（`{族前缀}.manifest.desktop` 全家；端名声明 = `thincoder-desktop/src/main/session-slots.mjs:72`）取 mtime 最新一条 → 其族数据文件回读 `cwd` → `isDirectory` 门 → 主进程当前项目落位（内存态——KD-9「不落盘」不变：本条零新存储面）。
   - **判据辨析（「上次打开」≠「最近活跃」）**：取数 = 本端**认领时点**——打开链成功 ⇒ 渲染面自动一次 `session:resume`（项 3）⇒ 核 `resumeSlot` 写本端记录（`thincoder-core/session-slots.mjs:324`）；**非**组最新 mtime ∥ 数据文件 mtime（活跃序）。他端记录（`.cli` ∕ `.vscode`）不入本判据（NF1 端分离）。
   - **启动接线**：`thincoder-desktop/src/main/main.mjs` 启动单线内**窗口创建前**一次恢复（单实例锁分支后）⇒ `project:recent` 的 `cwd` 非空 ⇒ 渲染面 boot 既有接续门（`thincoder-desktop/renderer/app.mjs:230`）自动一次 `session:resume` ⇒ **一条链**（项目 + 会话；渲染面零改）。
   - **降级（三档同归冷态）**：无记录 ∕ 族无可读 `cwd` ∕ 目录不在盘 ⇒ 不恢复（冷态照旧）；**日志分档** = 无记录（首启常态）零日志，仅「族无可读 `cwd`」∥「目录不在盘」两档真降级各记 `console.error` 一行（零静默）；本端记录**零触碰**（会话恢复记录——删 ∕ 改会动恢复语义；自愈 = 下一次成功打开改写最新）。
   - **写面零新增**：记录写点 = 既有认领写（`resumeSlot` ∕ `newSession` ∕ `switchToSlot` ∕ `deleteSlot`——端参绑定 `END`）；恢复面纯读（盘面零改动）。
   - **边界**：多实例 = 单实例锁既有（`thincoder-desktop/src/main/main.mjs:92`——非主实例零窗口零恢复动作（**明示原因框**——非静默；`--smoke` 零弹框）∥ 主实例收 `second-instance` ⇒ **唤醒既有窗口**（`restore+show+focus`））；老版本档零迁移（记录面自既有恢复链写入——从未被桌面打开过的项目 ⇒ 无记录 ⇒ 冷态）。

**设置族与项目级信息族注**：

1. **写面唯一执行体** = 核 `writeConfigAtomic`（`thincoder-core/config-io.mjs:59`——`stat → read → mutate → 原子写`四步住核；mtime 冲突 ⇒ `{ ok:false, reason:"mtime-conflict" }` + `.bak-{ts}` 留现场（备份档常量 `thincoder-core/config-io.mjs:78`））；
   读面 = 核 `loadConfig`（`thincoder-core/config.mjs:234`）；**端侧零自写盘、零 provider 形状构造**（值面住核：`addProviderEntry` `config-io.mjs:223` · `removeProviderEntry` `:262`〔激活渠道保护 `:270`〕· `setProviderKey` `:201` · `cascadeRemoveProvider` `:178`）。畸形档 ⇒ `loadConfig` 抛，invoke 拒绝直传（沿 `config:read` 先例——零静默重置）。

2. **逐通道载荷 / 回执（单源）**：

| 通道 | 载荷 | 回执 | 核入口（零算法副本） |
|---|---|---|---|
| `config:write` | `{ patch }`——键白名单**仅** `locale`（值域 `en` / `zh`；provider / agent 参数各有专属通道，不经此口） | `{ ok, reason }`；成功 ⇒ **同回带** `{ locale, dict, configured }` ⇒ 渲染面 `initDict` 重刷 + 向导闸随新档态（**零新事件通道**——免二跳重调） | `writeConfigAtomic` |
| `provider:list` | — | `{ ok, providers:[{ name, shape:"preset"\|"custom", baseURL, hasKey, maskedKey, active }], active, presets:[{ name, desc, baseURL }], defaultModel }`——`providers` **只回遮罩后值**（遮罩在**端侧单点 `maskKey`**——判据 = 核**导出** `isSensitiveKey`，`thincoder-core/agent-tools/settings.mjs:22`）；顶层 `defaultModel` = 复合串单源直取（`loadConfig`——渲染面「激活渠道 ∥ 当前模型」两读数载荷载体；缺 ∥ 非串 ⇒ `null`）；`presets` = **预设候选面**（逐条三键 = `{ name, desc, baseURL }`——`desc` 随 S7 增；候选面最小读数；**端侧零表**——表体与条数单源 = 核 `PROVIDER_PRESETS`（`thincoder-core/config-presets.mjs:16`；re-export 链 `thincoder-core/config-io.mjs:30` ← `thincoder-core/config.mjs:27`），其余字段不出面、保存时由核 `presetToEntry`（`thincoder-core/config-presets.mjs:44`）按名展开——端侧不构造 provider 形状，`docs/desktop/design/PROJECT.md` §2 KD-10）；**`failure` 分档键**（`hostBusy` 档含——欠做补做：宿主忙采样器 + `failure` 键贯链；词 ∕ 抑制形与 VSC 同判——单源 = `docs/desktop/design/SETTINGS.md` §2.2「批注（设置面余面 + 首屏引导门）」项 7） | `loadConfig` + `resolveProviders`（`config-io.mjs:146`——原样含 `apiKey` ⇒ 核零改） |
| `provider:save` | `{ name, shape, preset?, baseURL?, key?, format?, proxy? }` | `{ ok, reason }`；reason = 核错误串**直传** ∥ `invalid-shape`（端侧形判）；渠道单值模型退场——`model` 参 ∥ `active` 参 ∥ 缺省补写支一并退场（`defaultModel` 写入面 = 视图出口 ∥ 选定写回，见注 8①）；`proxy`（可选布尔——添加弹窗「走 proxy」勾选 ⇒ 条目同批落 `proxy:true`；缺 ∥ 非真 ⇒ 零键；与行开关 `provider:setProxy` 同字段） | `addProviderEntry` |
| `provider:remove` | `{ name }` | `{ ok, reason }`；激活渠道 ⇒ 核文案**直传**（`config-io.mjs:270`）——不造码、不改写 | `removeProviderEntry` + `removeProviderKeyFromConfig`（`:211`） |
| `provider:verify` | `{ name }` | `{ ok, reason?, models? }`；`reason` 闭集 `timeout` ∥ `malformed` ∥ `unavailable`（回执另携 `failure` 键——分档同 `provider:list` 行注） | `probeChannelModels` + `classifyProbeFailure` + `channelUnavailableMessage`（`thincoder-core/provider/list-models.mjs:152` / `:125` / `:109`） |
| `provider:setKey` | `{ name, key }`（**S1**——密钥设 ∕ 改；VSC `_saveProviderKey` 对位） | `{ ok, reason }`；`invalid-shape`（名 ∕ 钥空）· `unavailable`（条目不在 ∕ 回读不中）· 核串直传；成功 ⇒ 写后探（S3） | `setProviderKey` + **回读核验**（零假成功） |
| `provider:delKey` | `{ name }`（条目保留——只摘钥；**S1**） | `{ ok, reason }`（同族信封；删钥**不**写后探——无钥渠探必失败，读账承载） | `removeProviderKeyFromConfig` + 回读核验 |
| `provider:models` | 表单暂存值（**不落盘 ∥ 不入账**——渠道校验探针（原自定形「拉取模型」——**收为渠道校验**，不选模型）；**S2**）+ **`proxy?`**（可选布尔——勾选 ⇒ 探针按核 `probeTargetOf` 逐渠判定；未勾 ∥ 缺省 ⇒ 直连） | `{ ok, models }` ∥ `{ ok:false, reason }`（核长句直传） | `probeChannelModels`（**名传空串**——不落账；**目标 = 核 `probeTargetOf` 同判定**——三端对齐批收敛（修 `proxy.web` 旗取用）） |
| `provider:setProxy` | `{ name, proxy }`（布尔——渠级代理开关；**S5**） | `{ ok, reason }`（同族信封；回读行 `proxy` 随动） | `writeConfigAtomic`（`true` 写 ∕ `false` **删键**——沿 VSC `handleSetProviderProxy`） |
| `model:list` | `{ provider }` | `{ ok, models, reason? }`（format 分派 / 排序住核）；`models` 逐项携 `effortEnum` + `thinkOff`（元素形 = `{ id, effortEnum, thinkOff }`——核 `specForModel(model).reasoningEffortEnum` / `thinkOffPath(spec)` 逐模型投影：端侧档位候选面单源 · `thinkOff` = off 可达判据）；**探针径对齐（U1 受理）**：现径 = `probeChannelModels` + `probeTargetOf`（过代理 ∕ 落账——与 `model:catalog` 单源同径），**回执行逐字零变** | `probeChannelModels`（内部分派仍 = `listModels`——`thincoder-core/provider/list-models.mjs:96`）+ 核 `thincoder-core/model-specs.mjs` `specForModel` |
| `settings:agent` | 读 = `{}`（**无有效键（缺省 / `null`）⇒ 读面**——含 `{}` / `{patch:null}`；**`patch` 值非对象 / 空对象** ∨ **表外顶层有效键** ⇒ `invalid-patch`——`thincoder-desktop/src/main/settings.mjs:319` 起——`settingsAgent` 体）；写 = `{ patch: { "<点分路径>": value } }`（**载荷顶层有效键闭集**——表外顶层有效键 ⇒ `invalid-patch`（零写）） | 读 ⇒ `{ ok, fields }`（值 + 敏感遮罩）；写 ⇒ `{ ok, reason, fields }`（写后回读）；命中 slot 权威键（`agent.advisor.guard` ∕ `agent.engineering`）⇒ 拒 `slot-authority`（**零写**——拒位先于值校验 ∕ 混合 patch 整拒；见「设置族注」项 10） | 键面 `thincoder-core/agent-tools/settings.mjs:33`（形状表 `_NULL_LEAF_SHAPES`）+ 同族表 `:42` / 类型表 `:62` / 完备性 `:85` / 校验 `:134`（导出面 `:270`）；写链 = `_checkKnownKeyValue`（`:252`）→ `writeConfigAtomic`（`:255`） |
| `mcp:list` | — | `{ ok, servers:[{ name, kind:"url"\|"command", summary, config? }] }`（**`config?`**：七键条目回执 = 编辑表单预填源；**含 token ∕ headers ∕ env 明文下渲染面**——预填所需，VSC `panel-mcp.mjs:115-119` 同形；登记项） | `loadConfig` 的 mcp 节（热重载先例 `thincoder-core/config.mjs:358`） |
| `mcp:save` | `{ name, config }` | 探活通过 ⇒ `{ ok, tools? }`（写盘 + 接入）；失败 ⇒ `{ ok:false, reason, detail? }` **零写盘** | `probeMcpServer`（`thincoder-core/mcp.mjs:82`）+ `writeConfigAtomic` + `connectMcpServer`（`:225`） |
| `mcp:remove` | `{ name }` | `{ ok }`（写盘 + 工具面撤除） | `removeMcpTools`（`thincoder-core/mcp.mjs:285`）/ `closeAllMcp`（`:269`） |
| `mcp:update` | `{ name, config }`（编辑面：条目**原位替换**，数组序保持） | `{ ok, reason }`（**仅落盘、零探活**——沿 VSC `config-mcp.mjs:38-61` 口径；整项替换＝七键族外键不留，端差零） | `writeConfigAtomic` |
| `mcp:reconnect` | `{ name }`（行重连） | `{ ok, tools }` ∥ `{ ok:false, reason }`（`unknown-server` ∕ 核串直传；**失败面在场**） | 按名关核会话（`_sessions`）+ `remount` 全新连一次（**先断后连**） |
| `ledger:read` | `{ cwd? }`（缺省 = 当前项目） | `{ ok, counts:{ pool, tech, aged }, thresholdReached, reason? }`（**无行集**——需求 D10 逐字「台账**行**」= 单行读数；行集不面客）；未开项目 ⇒ `{ ok:false, reason:"no-project" }`；**歧义锚 ⇒ 拒绝直传**——cwd 容器根多候选 ⇒ 核抛「项目不可解析」（`thincoder-core/ledger-db.mjs:151`）经本通道拒绝（不吞成空读；与「cwd 可解析而库缺 ⇒ 三计数 0 空读」两域界限） | `buildScan`（`thincoder-core/ledger.mjs:114`——返回体 `:134-140` · `thresholdReached` `:129`）——**经动态 import**（W8 契约②：`ledger-db.mjs` 静态 import `node:sqlite`）；端点面 `ledger-cmd.mjs` 不动 |
| `batch:status` | `{ cwd? }` | `{ ok, phase, reason? }`——相位取核**回执 `manifest.phase`**（无顶层 `phase`）；`reason` 两档 = `missing`（`:372`）∥ `invalid`（`:380` / `:383`——两分不合并）· 非 ENOENT 读错 ⇒ 上抛（`:374`）直传 | `readManifest` + `manifestFilePath`（`thincoder-core/manifest.mjs:366` / `:236`；值域 `initial-dev` / `production` `:268`） |

3. **键面**：本族通道**不携会话 `key`**——设置族 = 端 / 全局面 · 项目级信息族 = 项目面（**项目一份、不随会话走**）；`key` 面单源 = 本档 §1「会话键面」段。
   **渲染面消费**：项目级读数两通道（`ledger:read` ∥ `batch:status`）**渲染面零消费**；通道本体 ∥ 主进程处理（`thincoder-desktop/src/main/project-info.mjs`）保留。

   **诚实拒**：`ledger:read` 歧义锚（容器根多候选）⇒ 拒绝直传（锚句「项目不可解析」；沿本档 `batch:status` 非 ENOENT 上抛同纪律）；零消费面 ⇒ 真因由调用面（CDP 直调 ∥ `window.thincoder.invoke`）直读；档头注在案（`thincoder-desktop/src/main/project-info.mjs`）。

4. **两条口径有意分歧（勿统一）**：① `provider:verify` 探不通**仍可保存**（只出读数——渠道 key 可用性不只在探测当下；离线 / 代理场景不得阻断首启；卡面明示「未校验通过」）∥ ② `mcp:save` 探活失败 ⇒ **零写盘**（配错必连不上——先例 = `thincoder-cli/src/tui/cmd-mcp.mjs`）。

5. **密钥纪律**：key 明文只落 `~/.thincoder/config.json`；值不入文档 / 日志 / 用例夹具；**遮罩在端侧单点 `maskKey`**（`thincoder-desktop/src/main/settings.mjs`——先例 `thincoder-cli/src/tui/config-helpers.mjs:39`），判据取核**导出** `isSensitiveKey`（`thincoder-core/agent-tools/settings.mjs:22`）；
   核 `MASKED`（现 **`:26`**——转 export）⇒ **三端同源复用**（桌面 `settings-values.mjs:15` ∕ VSC `thincoder-vscode/src/extension/settings.mjs:18` 皆 import 核 `MASKED`——零自持字面）；通道只回 `{ hasKey, maskedKey }`。

6. **向导闸**：首启判据 = **配置档存在性**（需求 §3.3 逐字：已配 ⇒ 跳过）——读数 = `config:read` 回执 `configured`（= `existsSync(configPath())`——`thincoder-core/config-io.mjs:39`〔核内 `_configPath()` · 路径常量 `:33`〕；**不在** `config.mjs` re-export 面；先例 = `thincoder-vscode/src/extension/config-watch.mjs:37`）⇒ **渲染面零 fs**；
   三步 = 选 preset → 填 key（`provider:verify` 真调一次）→ 选目录（`project:open`）；渠道表单与 verify 出口 = `thincoder-desktop/renderer/views/settings.mjs` 导出面（单一 owner、零副本）。

   **回执形注**：`config:read` 回执**无 `ok` 旗标**（读失败 = fail-loud 抛出 ⇒ invoke 拒绝）——消费判据 = `configured` 布尔在场（先例 = boot 面三字段判 · `thincoder-desktop/renderer/app.mjs:72-78`）。
   **口径差有意（勿统一）**：CLI `isConfigured`（`:27`）= key 可解析（更严）——两端判据不同源。
7. **拒绝直传**：主侧处理体**不吞错**——`readManifest` 非 ENOENT 读错（`thincoder-core/manifest.mjs:374`）与 `loadConfig` 畸形档抛错均**原样上抛** ⇒ invoke 拒绝（零静默降级、零假回执）。
8. **端侧出口与判定口径**：① **`defaultModel` = 复合串** `"<provider>:<model>"`——**写口两轴（计数勿混）**：**IPC 写口两处**（退 `provider:save` 后）= 视图出口 ∥ 选定写回；**全链写点 = IPC 写口 + 迁移**（视图出口 = 向导模型步「采用」——设置页「模型」段随 `docs/desktop/design/SETTINGS.md` §1 **KD-80** 撤场 ⇒ 向导为唯一消费面；迁移 = 核 `thincoder-core/config-migrate.mjs`）。逐条：
    视图出口 `settings:useModel`（`thincoder-desktop/renderer/views/settings-sections.mjs:87`——`modelRowNode`）经 `settings:agent` 写 `{ patch: { defaultModel } }`（`thincoder-desktop/renderer/mount-settings-exits.mjs:164-175`——写 `:168`）；

   `provider:save` 两写支（`active:true` 同批追加 ∥ 缺省补写）随渠道单值模型退场（两支写入源 = 条目 `model`，已不存在）；`active` 读数 = `defaultModel` 串 provider 段（同档 `:81` 单源取值 + `:98` 逐行读数）保持不变；
   **会话选定写回径**（`session:prefs`——模型面实变；等值零写；契约 = 「会话级偏好注」项 8）。

   ② **`FORMATS` 判定** = **端侧枚举**（UI 选项闭集 = `thincoder-desktop/renderer/views/settings.mjs:73`；写面形判经核 `customFieldsError`——值域住核 ∥ 端侧零自持副本（R8 起）：
   `thincoder-desktop/src/main/providers.mjs:41-42`（注）∥ `:162`（消费））——**非核协议表副本**（协议分派 / 排序仍住核 `thincoder-core/provider/list-models.mjs`；KD-10 不变）；

增删协议须核 ∥ UI 两处同改（随动面登记）。
   ③ **`provider:verify` 读账优先**：失败分档取核**落账**读数 `admissionOf(name).failure`（核探针内落账——端侧零再分类副本；未落账 ⇒ 回落 `classifyProbeFailure` 现算）——`thincoder-desktop/src/main/providers.mjs:269-278`（处理体——读账现取 `:276`）。

   ④ **向导面控件零名 + 提交端自读现选**：向导步内控件不带提交名（零表单序列化）；提交时端侧读槽内现值（读值单点 = `thincoder-desktop/renderer/mount-onboarding.mjs:22`（`presetValue(slot)`——消费 = `mount-settings-exits.mjs:92`））——现选缺 ⇒ 零发送（`invalid-shape`）；
   机检 = 单元测试档（端侧机检现形 = 单元测试档族）。

10. **slot 权威键拒写 ∕ patch 显式清除面（S10 ∕ S11 ∕ S14 · 单源）**：① `settings:agent` `patch` 值 = `null` ⇒ **删键**（核 `_checkKnownKeyValue`「null = 显式清除」语义——S10 槽清空 ∕ S11 中性档两径即用）；
   ② `agent.advisor.guard` ∕ `agent.engineering` = **会话槽权威键**（唯一写面 = `session:flags` 槽写——跨端同槽）⇒ 通用保存**拒写**（拒码 `slot-authority` + **零写**；拒位先于值校验 ∕ 混合 patch 整拒）；guard 设置面开关写经 `session:flags`（回执后 `ev:flags` 随动）。

   判据 = `docs/desktop/design/SETTINGS.md` §1 **KD-49**；实现坐标 = `thincoder-desktop/src/main/settings-values.mjs:70`（`SLOT_AUTHORITY_PATHS`——S14a 随迁单源）∥ `thincoder-desktop/src/main/settings.mjs:291-292`（拒位）∥ `:304`（清除面）；

   词键 = `thincoder-desktop/renderer/views/settings.mjs:63`（`settings.reason.slotAuthority`）。

**模型清单注（`model:catalog` · 单源）**：

1. **语义与取数**：无载荷——`resolveProviders().providers` 滤 `hasKey`（key **非空白**——对位 VSC `isProviderConfigured`；与 `provider:list` 行面 `hasKey`（`length > 0`）不同判为有意）⇒ 逐渠 `probeChannelModels(name, probeTargetOf(entry))`（核单源——**代理 + 落账**）⇒ `Promise.allSettled` 并发；**序** = 渠（配置序）× 渠内（核 `listModels` 已排序）。
2. **回执形**：`{ ok, models: [{ provider, id, effortEnum, thinkOff }], unavailable: [{ provider, reason }] }`——`models` 逐项 = 核投影 + 渠名注入；`unavailable.reason` = 核 `channelUnavailableMessage` **逐字长句**（**非闭集码**——对照 `provider:verify` 闭集码：码供分支 ∕ 本值供显示；分支面另有核落账 `failure`）。
3. **失败 ∕ 空表口径（对位 VSC 逐点）**：探不通渠 ⇒ **零行** + `unavailable` 项；探通零模型渠 ⇒ 零行 ∧ **不落**项；无已配渠 ⇒ `{ ok: true, models: [], unavailable: [] }`——渲染面**零推送**（VSC anyKey 早退对位）；全渠失败 ⇒ `models: []` + `unavailable` 全项（**照推**）；整档不可读 ⇒ invoke 拒绝直传（畸形档不吞）。
4. **触发面（渲染面 · 六径）**：① 装配首跑（恰一次）② `ev:config`（外写；自写抑制）③ 设置面 provider 写成功（`provider:save` ∕ `provider:remove`——含首启向导同路）④ `unavailable` 非空 ⇒ 有界重探链（≤2 轮 ∕ 2s 步进；**改善才再推**）
  ⑤ 会话切换 ∕ 活动 meta 变 ⇒ 重推缓存（**零取数**）⑥ 无已配渠 ⇒ 零推送（菜单保持现状）；在飞 = 单飞 + 尾随一轮 + `seq` 落地复核；强制刷新口 `refreshCandidates()`（单源 = `thincoder-desktop/renderer/composer-sync.mjs`）。
5. **消费 ∕ 边界**：渲染面输入面板模型钮候选面——一级 = 载荷 distinct provider 聚合（核件 `thincoder-render-core/composer/model-menu.mjs` **零改**）；`model:list` 契约形零变（只探针径对齐）；
  `hostBusy` 档 = **消（补做——欠做，非能力缺失）**：宿主忙采样器 = 新档 `thincoder-desktop/src/main/loop-sampler.mjs` + `failure` 键贯链（单源 = `docs/desktop/design/SETTINGS.md` §2.2「批注（设置面余面 + 首屏引导门）」项 7）。

## 3. 文件账（通道族）

### 3.1 本端文件清单与行数预算（通道族行）

| 文件 | 预估行数 | 说明 |
|---|---|---|
| `thincoder-desktop/src/main/ipc.mjs` | **300**（内容行数口径） | 通道分发（注册面 = `ipc-registry.mjs` 的 `HANDLERS` 表 + 注册序）；白名单 **54 项**（末位 40–54 见本档 §2「白名单面」）；**越 300 顾问线已消解** ⇒ 拆分落形 = **转口族出档**（拆点 = 转口群注记行 `:299-300`（设置 ∕ 数据面转口群 24 项）⇒ 新档 `thincoder-desktop/src/main/ipc-relays.mjs`——**已落**；越层除名） |
| `thincoder-desktop/src/main/ipc-relays.mjs` | **77** | 转口族出档（自 `thincoder-desktop/src/main/ipc.mjs`——24 纯转口 + `liveAgents` 单向取用〔自 `ipc.mjs` import——零环〕；注册面（`ipc-registry.mjs`）import 拆两源取用；`HANDLERS` 表 ∕ 注册序 ∕ 白名单零改） |
| `thincoder-desktop/src/preload/preload.cjs` | **94**（内容行数口径） | 窄桥：白名单通道（**54 项**（`CHANNELS` 54））+ `contextBridge` + **事件订阅面** `on(name, cb)`（白名单**二十五通道** · 表外 throw · 返回退订） |
| `thincoder-desktop/src/main/providers.mjs` | **311** | 设置族渠道面处理体（`provider:*` 族 + 隐藏判据一处） |

**行数面机检**：`checkConfig.lineCounts`（`PROJECT-MANIFEST.json`，运行根单读）**逐条声明节域——本表为其一**（本域值行单源）；后续本域新档由落盘批在本表补值行，`docs/desktop/design/PROJECT.md` §4.1 同拍补指针行（沿 §4.1 纪律）。

**批块余量**：本域无单域批块随本轮机迁。

