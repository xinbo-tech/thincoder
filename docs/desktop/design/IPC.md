# 桌面端（DESKTOP）· 主 ↔ 渲染契约（IPC）

> 板块 = **桌面端主 ↔ 渲染 IPC 契约（窄面）**——通道族与载荷语义的单源；主进程侧注册与分发实现 = `thincoder-desktop/src/main/ipc.mjs`。
> 需求侧 = `docs/desktop/requirements/PROJECT.md`（§4 功能点 D1–D16 · §7 验收 A1–A4 · §8 依赖面 P1–P4）。
> 同部分相关档：进程与目录形态 · 与核的接口面 · 壳装配第三份（装配侧回调映射）= `docs/desktop/design/SHELL.md` · 渲染面消费（store 订阅与增量渲染）= `docs/desktop/design/RENDERER.md` · 总览 / 决策 / 发行 / 验收 = `docs/desktop/design/PROJECT.md`。
> 核机制面（agent 主循环 / 工具 / 记忆 / 配置 / 会话）**只住核**——本档只定**通道面与载荷语义**，不重述核回调语义（单一权威源）。
> 建档：2026-09-25（桌面端设计批 1 · 分档轮）；本档坐标 = as-of 2026-09-25 实核（仓根 = `thincoder/`）。

## 1. 主 → 渲染（事件推送，单向）

| 通道 | 载荷语义 | 核侧产出方（实读坐标） |
|---|---|---|
| `ev:token` | 流式正文增量 | `callbacks.onToken` |
| `ev:reasoning` | 推理块增量（**本批增**）——载荷 `{ key, text }`；块型 `reasoning` 已在桌面块五型内；续写判据 = 尾块 `kind === "reasoning"` | `callbacks.onReasoning`（`thincoder-core/agent.mjs:273`——此前未接） |
| `ev:activity` | 活动信号（三形） | `callbacks.onAgentTurn`（`thincoder-core/agent.mjs:229`）· `callbacks.onToken` 内联 `⟦ev⟧` 事件（`thincoder-core/agent/dispatch.mjs:301`；`done`/`stopped` 发射点 `thincoder-core/agent-tools/async-settle.mjs:275`/`:239`）· 宿主结算（`thincoder-desktop/src/main/agent-host.mjs`） |
| `ev:subagent` | **子 agent 块状态（本批增 · D20 单源）**——载荷 = `{ key, role, id, status, … }`：`status` 闭集 = `started` / `queued` / `turn` / `done` / `settled` / `cancelled`（token → status 全表单源 = 核 `relayEventToSubPatch`——`docs/render-core/design/RENDER-CORE.md` §5；`⟦ev⟧stopped` ⇒ `cancelled` · `error` 不载）；随行字段（缺省不落）= `model?` / `pool?` / `turn?` / `maxTurns?` / `kind?` / `position?` / `waiting?` / `reason?` / `startedAt?`；**内容不回显**（text / think 丢弃；工具名**仅作分流判据** · 块面无工具位——D20 单源 · KD-RC-6） | 核 relay 事件 token（前缀文法 = `thincoder-core/agent/relay-prefix.mjs`；映射先例 = `thincoder-vscode/src/extension/panel-subagent-relay.mjs:101-147`）+ **宿主存活投影 2s 再断言**（出生自愈——只发在飞实例；拍体沿 `thincoder-vscode/src/extension/panel-messages.mjs:42-74` 语义）；**宿主侧剥前缀** ⇒ 渲染面不析 `role#id/` |
| `ev:tool-call` | 工具卡开始（名称 + 参数摘要 + 调用 id） | `callbacks.onToolCall`（`thincoder-core/agent/dispatch.mjs:264`） |
| `ev:tool-output` | 工具执行期输出块（增量） | `callbacks.onToolOutput`（`thincoder-core/agent/dispatch.mjs:399`） |
| `ev:tool-result` | 工具卡收尾（结果 + 改动摘要 + 耗时） | `callbacks.onToolResult`（`thincoder-core/agent/dispatch.mjs:445`） |
| `ev:approval` | 待审批项（逐项 = 工具名 + 参数摘要；批 = 工具清单 + 计数）——**载荷定形**（批 7 · 消费面最小字段集）= `{ key, promptId, shape, tool?, argsSummary?, changes?, batch?: { count, tools } }`：`promptId` = 待决项标识（与响应通道同源同值）· `shape` = `"single"` ∥ `"batch"` · `tool` / `argsSummary` = 逐项形（批形缺省；键名沿工具卡先例 `thincoder-desktop/renderer/views/chat-tool.mjs:72`）· `changes` = 改动摘要（文件 + 增删行数；缺 ⇒ 卡面无摘要行）· `batch` = 批形（`count` = 工具数 · `tools` = 工具名数组——键形沿 `thincoder-cli/src/tui/interaction.mjs:104`）；核侧产出映射照核实读填（本档不重述核回调形状——单一权威源） | `callbacks.onPermissionRequest` ∥ `callbacks.onBatchPermissionRequest` |
| `ev:question` | 用户提问（`question` 工具）——**载荷定形**（批 A · 消费面最小字段集）= `{ promptId, question, options }`：`promptId` = 待决项标识（与响应通道同源同值）· `question` = 题干串 · `options` = 给答项数组（空数组 ⇒ 自由作答）；核侧产出映射照核实读填（本档不重述核回调形状——单一权威源） | `callbacks.onQuestion`（`thincoder-core/agent/dispatch.mjs:400`） |
| `ev:task` | 任务 / 计划面刷新 | `callbacks.onTaskUpdate`（`thincoder-core/agent/setup.mjs:173`） |
| `ev:usage` | 活动会话**状态行读数面**（需求 §3.1:52 · 批 B 落 · **本批扩**）——`percent` = 核 `historyPercent` 读数投影（端侧零重算）· **回合尾刷新**；**载荷扩（本批）** = `tokens?`（会话累计令牌 `{ prompt, completion, reasoningTokens, cacheHit, cacheMiss }`——核 `onUsage` 回调投影（`thincoder-core/agent.mjs:353`）；CLI 同源映射 = `thincoder-cli/src/tui/tool-events.mjs:400-405`）· `timers?`（`{ count, expired }` = 核 `_pendingTimers` 活读——`thincoder-core/agent.mjs:84`；新鲜度窗 = `docs/render-core/design/RENDER-CORE.md` §10 F 行）；两键缺省 ⇒ 状态行对应段零节点（禁假造） | 宿主回合尾结算（`thincoder-desktop/src/main/agent-host.mjs`——与回合尾三径同点；读数单源 = `thincoder-core/token-window.mjs:160`） |
| `ev:error` | **宿主回合结算（错误径）单义**——即回合尾三径之一（单源 = `docs/desktop/design/RENDERER.md` §1.1 回合尾三径条）；**非**「通用错误通道」（「错误卡」= 渲染面呈现形态（`docs/desktop/design/UI.md` §1 对话流行），非本通道语义）；工具级错误 = 工具块 `status="error"`（**不经本通道**） | 宿主结算拒绝分支（非 abort——`thincoder-desktop/src/main/agent-host.mjs:222`） |

**事件映射**：本表第三列 = 「核回调 → IPC 通道」逐条映射（单源）——逐条带实读坐标，宿主面 = `thincoder-desktop/src/main/agent-host.mjs` + 回调桥出档 `thincoder-desktop/src/main/agent-bridge.mjs`（**十一回调** ⇒ `ev:*` 映射 = **十通道**——本批增 `onReasoning`（⇒ `ev:reasoning`）与 `onUsage`（累积后并入 `ev:usage`，非独立通道）；
  `ev:usage` / `ev:error` 两行第三列 = 宿主回合尾自产，非回调映射——映射仅此一处）；`ev:activity` 三形判别单源 = 「载荷键集」段（同本档）。装配侧注入与不改核签名的约束 = `docs/desktop/design/SHELL.md` §4 项 2。

**载荷键集（批 A 定形 · 批 B 增一 · 本批增二 · 单源 = 本段）**：**十二通道**一律携 `key`。逐通道字段集：

- `ev:token { key, text }`
- `ev:reasoning { key, text }`（推理块增量——与正文同形；续写判据 = 尾块 `kind === "reasoning"`）
- `ev:subagent`（形状 = 本档 §1 该行：`status` 闭集 + 随行字段；**内容不回显**——KD-RC-6）
- `ev:activity { key, event: "turn", n, max }`（宿主回合起——`onAgentTurn`；**无 `fields`**）
- `ev:activity { key, event, fields }`（内联形——`⟦ev⟧` 事件族；`fields` = `\x1e` 分隔字段原样；事件名表外 ⇒ 仍进本通道，不丢）
- `ev:activity { key, event: "done" }` ∥ `{ key, event: "stopped" }`（宿主结算——**无 `fields`**）
- **判别（写死）**：`fields` 键在场 ⇒ 内联形（子代理 / 池条目面——**零回合尾**、不作回合起）；无 `fields` 的 `done` / `stopped` = **宿主结算面**（**回合尾三径**同判据——`done` / `stopped` ∨ `ev:error`；单源 = `docs/desktop/design/RENDERER.md` §1.1 回合尾三径条）。
- `ev:tool-call { key, id, name, argsSummary }`
- `ev:tool-output { key, id, chunk }`
- `ev:tool-result { key, id, ok, result, subKey? }`——`ok = !String(result).startsWith("Error:")`（与核内工具出口同源，实读 `thincoder-core/agent/dispatch.mjs:370` / `:422` / `:428` / `:440`）；`subKey` = 子代理归并存续键，缺省 = 顶层——**值面在场 · 消费未落**（宿主透传与载荷键定形已落；渲染面归约不按 `subKey` 归并，登记 = `docs/desktop/design/PROJECT.md` §10）。
- `ev:approval`（定形 = 本表该行）
- `ev:question { key, promptId, question, options }`（`question` / `options` = 核回调实参透传 · `promptId` = 待决项标识——与 `question:respond` 同源同值）
  - **作答通道（批 A 落）**：宿主 `onQuestion` 改**挂起门**（表 = `thincoder-desktop/src/main/suspensions.mjs` 同表 · `kind: "question"`）——返 Promise，待 `question:respond` 结算。
  - 未作答 ⇒ 回合停在本次工具调用上——`thincoder-core/tools/question.mjs:24` 直返 `ctx.onQuestion(...)` ⇒ `thincoder-core/agent/dispatch.mjs:411` `await item.tool.execute` 续。
- `ev:task { key, items }`（`items` = 任务 / 计划面条目数组——核回调实参透传，`thincoder-core/agent/setup.mjs:173`）
- `ev:usage { key, percent }`（`percent` = 本会话上下文占用百分数——**0–100 整数**（核 `historyPercent` 读数直传 · 端零重算）；**有效读数（数字且 > 0）⇒ 发 · 否则不发**——门 = 数字 ∧ > 0、**无上界夹值**（> 100 照发）；`ev:usage` 的两键扩形状（`tokens?` / `timers?`——单源 = 本档 §1 该行）；端显示门同判据 = `docs/desktop/design/UI.md` §1 状态栏行）
- `ev:error { key, message }`（`message` = `String(err?.message ?? err)`——宿主结算拒绝分支投影；单形，`message` 为唯一载荷字段）

`argsSummary` = 本端展示面摘要（按工具挑关键参数的单行口径——核内无此单源，端各自实现）。

**会话键面（单源 · 本段）**：本表**十二通道**与本档 §2 请求通道的 `key` = **会话键 = `String(slot)`**（十进制槽号串；键面成于渲染面开标签——实读 `thincoder-desktop/renderer/mount-sessions.mjs:63` / `:100` / `:109`）
——主侧装配表 / 挂起表项 / 渲染侧切片键（`tabs` / `tabBadges` / `sessionMeta` / `activeSession` / `questions` / `tasks`）同值同源；主侧由键解出槽号，不合规键 ⇒ 回执 `{ ok: false, reason: "bad-key" }`（不静默兜底）。

**订阅面（主 → 渲染）**：preload 暴露 `on(name, cb)`——白名单 = 本表**十二通道**，表外 ⇒ **throw**；返回退订函数；实现 = `thincoder-desktop/src/preload/preload.cjs`，出站 = 主进程 `win.webContents.send`。

**菜单面（首版口径）**：原生菜单只承载**主进程动作**（窗口 / 缩放 / 退出 / 开发者工具）**＋ 平台惯例 Edit 组**（Electron 内建 `role:`——撤销 / 重做 / 剪切 / 复制 / 粘贴 / 全选；**非通道**，实读 `thincoder-desktop/src/main/window.mjs:47`）——首版**不设**「菜单项 → 渲染面动作」通道；若后续要菜单触发渲染面动作（新建会话 / 切标签 / 打开目录），本表须补命令下发通道（需求侧留白项 = `docs/desktop/design/PROJECT.md` §10 F 行）。

## 2. 渲染 → 主（请求，均返回结果或错误）

| 通道 | 载荷语义 |
|---|---|
| `sessions:list` / `session:create` / `session:switch` / `session:rename` / `session:delete` | 会话族（列表含运行标记 + `createdBy` 创建端〔核 `listSlots` 条目投影，实读 `thincoder-core/session-slots.mjs:217`；缺键 ⇒ `""` = 未知 ⇒ 渲染面**不标注**、**禁以「占用端」冒充**〕；切换 = 恢复槽 + 载历史；**写通道回执** = 统一信封 `{ ok, reason: null\|string, cwd, slot }`——reason 分档见「会话族注」项 5） |
| `session:resume` | 接续既有会话（跨端同一槽——与 CLI / 扩展端接续同一会话） |
| `session:prefs` | **会话级偏好写面（批 B 落 · 白名单末位）**——载荷 `{ key, patch }`：`patch` 键闭集 = `provider` / `model` / `effort`（会话头三值——需求 §3.1:47），至少一键；值形 = 串（`null` = 清该键——**仅 `effort` 一键**；表外档位字面串 ⇒ 归一 `null`〔未设——写面不预校验，沿核读侧容忍口径〕）；`provider` 变更须**同送 `model`**（否则拒 `model-required`）；非对象 / 空对象 / 表外键 ⇒ `invalid-patch`。**回执 = 会话族同信封 + `meta`**（`{ ok, reason, cwd, slot, meta }`——`meta` = 会话头五值投影，与 `history:page` 回执 `meta` 同源同形）：**成功携 `meta` · 失败缺 `meta` 键** ⇒ 仅成功径就地刷会话头。reason 五档（含 `model-required`）= 「会话级偏好注」项 7。语义与核面解析链 = 「会话级偏好注」 |
| `history:page` | **载荷（批 A 定形）** = `{ key, before }`（`before = null` ⇒ 尾页；否则 = 页首游标）；**回执** = `{ ok: true, messages, hasOlder, next, meta }`（`next` = 下一页游标——推导 = 「页游标注」；无更早页 ⇒ `null`；`meta` = 会话头五值投影 `{ provider, model, effort, engineering, autoApprove }`——开页即供头面）；页量 = 核 `historyWindow` 缺省（200 **条**——**条 ≠ 块**：块数由渲染面归约，窗限增长按实并入块数）；槽缺 / 键不合法 ⇒ `{ ok: false, reason }`（`bad-key` / `slot-missing`）；**零算法副本** = 核 `loadSlotFile` + `historyWindow` 转口；视口补偿在渲染面（`docs/desktop/design/RENDERER.md` §3） |
| `msg:send` / `msg:interrupt` | **载荷（批 A 定形）**：`msg:send { key, text, images? }` → 回执 `{ ok: true }` ∥ `{ ok: true, degraded }`（`degraded` 闭集 = `"non-vision"`（非视觉模型降级）∥ `"partial"`（部分附件弃））（**立即回**——长回合不阻塞 IPC；回合终局经 `ev:activity` ∨ `ev:error`——三径同判据，单源 = `docs/desktop/design/RENDERER.md` §1.1 回合尾三径条）∥ `{ ok: false, reason }`（`provider-invalid`（未配置 provider——fail-loud，零假回合）· `busy`（单驱动器：在飞再发拒）· `bad-key`）；`msg:interrupt { key }` → `{ ok: true }` ∥ `{ ok: false, reason: "idle" }`（中断 = 核 `signal.abort()`）；附件面 = **批 B 落**（载荷 `images` · 上限 · 端侧前置多模态门 · 降级面 · 落盘 = 本档「附件注」）；UI 输入区与中断键 = **批 A 落**（输入区挂载根 `[data-slot="composer"]` · 两份挂载切片 `thincoder-desktop/renderer/mount-composer.mjs`——见 `docs/desktop/design/UI.md` §1「输入区」行） |
| `subagent:stop` | **子 agent 停止出口（本批增 · D20）**——载荷 `{ key, id, role? }`（`id` = 实例号——与 `ev:subagent` 同源同值）；回执 `{ ok, reason }`（reason 闭集 = `unknown-sub`（表外 id ∥ 该实例不在飞）· `bad-key`）；**实现面 = 主进程转核既有取消出口**（异步族 = `thincoder-core/agent-tools/subagent-async.mjs:245` `executeCancelAction`；同步族 = 核 `_syncChildAborts` registry 命中判据——先例 = 扩展端 `syncLiveOf`）；逐类调用链核实归实施批 R3b（判据 = 停止后实收 `cancelled`——源 = `⟦ev⟧stopped` / `⟦ev⟧cancelled` 两 token · 先例兼容映射 = 核档 §5 全表） |
| `approval:respond` | **载荷（批 A 定形）= `{ promptId, verdict }`**——`promptId` 与 `ev:approval` 同源同值；`verdict` 闭集 = `once` ∥ `always` ∥ `reject` ∥ `approveAll` ∥ `deny` ∥ `oneByOne`（前三 = 逐项形 / 后三 = 批形；**形与值的匹配由卡面键位闭集保证**——表外键零动作 · 不派发）；**未装配 ⇒ fail-loud 直传拒绝**（不吞 · 不造 reason 码 · 不落假成功——拒绝以抛错浮出）；**回执 = 形定**（沿会话族同形族 `{ ok, reason, … }`——见「会话族注」项 5；正例读数随 agent 装配批）；**reason 闭集四档 = `unknown-prompt` / `bad-kind` / `bad-verdict` / `bad-answer`**——四档皆不 resolve · 挂起保留（单源 = `thincoder-desktop/src/main/suspensions.mjs:85-87`） |
| `question:respond` | **载荷（批 A 定形）= `{ promptId, answer }`**——`promptId` 与 `ev:question` 同源同值；`answer` = 作答串（给答项 ⇒ 选项串原样；自由作答 ⇒ 输入串）；**取消 ⇒ `answer: null`**（与打断同判——挂起表按取消串 `(user cancelled)` 结算：串单源 = `thincoder-desktop/src/main/suspensions.mjs`；`question` 工具返值面非 `undefined` = 核 `thincoder-core/agent/dispatch.mjs:419`（工具返值单源 = `thincoder-core/tools/question.mjs:24`）；渲染面「已取消」文本走词表——与结算串两域分离）；**未装配 ⇒ fail-loud 直传拒绝**（沿 `approval:respond` 先例）；**回执 = 形定**（沿会话族同形族 `{ ok, reason }`——三档：`unknown-prompt`（表外 id）· `bad-kind`（命中非 question 门——传了审批 id）· `bad-answer`（`answer` 非串且非 `null`）；**三档皆不 resolve · 挂起保留**） |
| `config:read` / `config:write` | 配置读写（写面**只**经核唯一执行体 `writeConfigAtomic`——`thincoder-core/config-io.mjs:59`；读面 = 核 `loadConfig`；不另立格式）；`config:read` 同载**语言面下发** `{ locale, dict }` **+ 配置存在判据** `configured`（= `existsSync(configPath())`——`thincoder-core/config-io.mjs:39`；路径常量 `:33`）——`dict` = 核 `projectDictionary(locale)` 投影（`thincoder-core/i18n.mjs:101`），宿主 UI 专有键由渲染面自持（边界 = `thincoder-core/i18n.mjs:14-17`：只收核域文案）；消费面 = `thincoder-desktop/renderer/i18n.mjs`。`config:write`（批 9 入册）键白名单**仅** `locale`——载荷 / 回执见「设置族与项目级信息族注」 |
| `provider:list` / `provider:save` / `provider:remove` / `provider:verify` | provider 增删与 key 校验（真调一次——批 9 入册；载荷 / 回执与两形 = 「设置族与项目级信息族注」） |
| `model:list` / `settings:agent` | 模型两级选择 · 推理档位 · agent 参数面板（批 9 入册；载荷 / 回执 = 「设置族与项目级信息族注」） |
| `mcp:list` / `mcp:save` / `mcp:remove` | MCP 服务器管理（经核；批 9 入册——**探活失败 ⇒ 零写盘**，载荷 / 回执 = 「设置族与项目级信息族注」） |
| `memory:status` | 索引状态读数（memory 检索本体是 **agent 工具面**，非 UI 搜索框——需求档 D8）。**批 9 勘定 = 归另批**（本端本批不设该通道）：核侧无「索引状态」读出口（`thincoder-core/memory/*` 导出面实读非动作型读数为零；现读数只在 CLI `/reindex` 直查核内三表）；正解 = **核加只读出口**（`memoryStatus()` 一类）随**核面批**落，届时本通道 + 设置面状态行随落（台账已记条件型待办）。端侧直读核内表**不授权**（第二消费面 ⇒ 核表结构成无主契约——CLI `/reindex` 直读是端侧自留面，不构成先例） |
| `ledger:read` / `batch:status` | 项目级信息（台账行 · 批次相位——**项目一份，不随会话走**）。批 9 入册：台账读 = 核 `buildScan`（`thincoder-core/ledger.mjs:114`——**经动态 import**，W8 契约②；返回体 `:134-140`）；相位 = 核 `readManifest(cwd)` **回执的 `manifest.phase`**（`thincoder-core/manifest.mjs:366`——**无顶层 `phase`**；值域 `initial-dev` / `production` `:268`）；载荷 / 回执 = 「设置族与项目级信息族注」 |
| `project:open` | 进入项目：载荷 `{ path }`（可选；缺省 = 主进程弹原生目录选择——`dialog` 在主进程内、不经通道）；返回 `{ cwd, recent }` |
| `project:recent` | 最近目录列表读取（读面 = 核会话槽面回读——零新存储；机制 = §2 项目面注） |

**页游标注（`history:page` 回执 · 单源）**：

1. **`next` = 窗下界**：`end = before == null ? 源历史条数 : Math.max(0, Math.min(before, 源历史条数))` · `next = Math.max(0, end − HISTORY_PAGE_SIZE)`——与核窗界同式（实读 `thincoder-core/history-window.mjs:111-112`）；页首条在场时与「本页首条全局 `idx`」同值。
2. **零消息页**（窗口内可视 0 条 ∧ `hasOlder` 真）同走该式 ⇒ 游标必推进（不粘滞）；`HISTORY_PAGE_SIZE` = 核单源常量（`thincoder-core/history-window.mjs:24`——宿主 `import`，零字面量）。
3. **无更早页** ⇒ `next = null`（判据 ⇔ 窗下界 `0`——即核 `hasOlder === false`，`thincoder-core/history-window.mjs:178`）。

**白名单面（批 9 落 · 批 A 追加 · 批 B 追加 · 本批追加）**：白名单 = **已实给 28 项**（批 8 及以前 13 + 批 9 十二 + 批 A 一 + 批 B 一 + 本批一）。

- **既有十三项**（序锁定 · 位次 1–13）：`config:read` · `project:open` · `project:recent` · `sessions:list` · `session:create` · `session:switch` · `session:rename` · `session:delete` · `session:resume` · `approval:respond` · `history:page` · `msg:send` · `msg:interrupt`。
- **批 9 十二新**（追加于末位 · 位次 14–25 · 序 = 本列）：`provider:list` · `provider:save` · `provider:remove` · `provider:verify` · `model:list` · `settings:agent` · `mcp:list` · `mcp:save` · `mcp:remove` · `config:write` · `ledger:read` · `batch:status`。
- **批 A 一新**（追加末位 · 位次 26）：`question:respond`——作答通道（载荷 / 回执见 §2 该行 · 核侧挂起门 = `thincoder-desktop/src/main/suspensions.mjs`）。
- **批 B 一新**（追加末位 · 位次 27）：`session:prefs`——会话级偏好写面（载荷 / 回执见 §2 该行 · 语义与核面解析链 = 「会话级偏好注」）。
- **本批一新**（追加末位 · 位次 28）：`subagent:stop`——子 agent 停止出口（载荷 / 回执见 §2 该行 · 语义 = `docs/desktop/design/UI.md` §1「本批注（对齐重定位）」项 2）。
- **逐条勘定**（批 9 · 该批范围 = 批次档 §1.2）：上列十二项 = **该批落**；`memory:status` = **归另批**（携核只读出口——理由见本档该行 + `docs/desktop/design/PROJECT.md` §6.1 D8 行）。
- 唯一入册面 = `thincoder-desktop/src/main/ipc.mjs` 处理体表 ≡ `thincoder-desktop/src/preload/preload.cjs` 暴露表（两向相等 = 用例机检面）；表外通道 ⇒ 拒绝（零静默兜底）。

**会话族注（`sessions:list` 载荷 · 分批口径）**：

1. **载荷** = `{ cwd, rows }`（未打开项目 ⇒ `cwd: null` + `rows: []`）：`rows` = 当前项目槽摘要投影（核 `listSlots` 条目），每行 `{ slot, title, createdBy, updatedAt, messageCount, isActive }`。
2. **行字段语义**：`createdBy` 缺键 ⇒ `""`（未知 ⇒ 渲染面**不标注**）；`isActive` = 核 manifest 当前活动槽（**只读**面——不认领、不写 manifest）；`updatedAt` = 核读数（行序 = 核投影序）。
3. **零新增算法**：投影只取核已有读数（`listSlots`）——不落新存储、不重算摘要、不扫目录名；端壳转口 = `thincoder-desktop/src/main/session-slots.mjs`（零算法副本判据照旧）。
4. **分批口径**：「运行标记」（本进程回合 / 挂起态）与「待审批位」需渲染面状态源（挂起表 · 回合事件——见 `docs/desktop/design/UI.md` §2 项 2）⇒ 随对话流 / 审批批落地，本行字段随之增补；在此之前位标面 = `isActive` 当前活动槽标。
5. **写通道回执（批 5 落）**：五个写面通道（`session:create` / `session:switch` / `session:rename` / `session:delete` / `session:resume`）返回**统一信封** `{ ok, reason: null|string, cwd, slot }`——四键齐备（`reason` 成功 = `null`）；`slot` = 成功槽号、否则 `null`；
   - **`session:prefs` 同族例外** = 信封 + `meta`（五键——§2 `session:prefs` 行 / 「会话级偏好注」项 7）。
   - **reason 分档** = `no-project`（未打开项目——动作层判 cwd 空；覆盖 `create` / `rename` / `resume`）· `slot-missing`（动作层整形：核返回 `null` / `false`）· 核 `renameSlot` **闭集直传**（`invalid-slot` / `file-missing` / `parse-failure` / `mtime-conflict`）。
   - **cwd 空档不对称（在案）**：`switch` / `delete` **无** `no-project` 档——cwd 空 ⇒ 核 `loadManifest` 吞异常返空清单（`thincoder-core/session-slots-manifest.mjs:55-64`）⇒ 恒落 `slot-missing`。
   - **`slot-missing` 一词三因**（核内同一出口）：非整数槽号 / 清单无条目 / 数据文件不可读（`thincoder-core/session-lifecycle.mjs:291-293`）。
   - **fail-loud**：意外抛**不吞**、直传 invoke 拒绝（沿 `config:read` 先例）。动作层 = `thincoder-desktop/src/main/session-actions.mjs`——**零算法副本**（不预校验槽号、不重命名 reason、不规整 `title`）。

**会话级偏好注（`session:prefs` · 单源 · 批 B 落）**：

1. **语义**：provider / 模型 / 推理档位三键 = **会话级**（需求 §3.1:47——随会话槽持久化，与 CLI / 扩展端**同一份槽**）；**config 零写**（`settings:agent` 仍是设置面全局默认面，不再作会话头出口——需求 §3.5:94 现状定性）。
2. **写入面**：核新出口 `setSlotPrefs(cwd, slot, patch)`（`thincoder-core/session-slot-write.mjs`——沿 `setSlotAutoApprove` 同形：一次读-改-写，复用 `writeFlag` / `saveSlotData` 单点）⇒ 槽数据文件即更新（跨端立即可读；不另立存储）。
3. **槽字段（核面小改三处 · 授权 = 批次档 §1.2）**：`newSlotData` 增 `effort: null`；`applySession` 应用 `data.effort`；`saveSession` 的保存字段表**须携带 `effort`**——否则槽写面被下一次保存整对象抹除（同 `engTokens` 那类缺陷；实读 `thincoder-core/session.mjs:105-166` 现表无 `effort`）。
   - **老槽（无该键）⇒ 零行为变更**。槽值闭集（`null`〔= 老槽即此态〕∥ `"off"` ∥ `reasoningEffortEnum` 成员）与三处改点的判据**单源 = `docs/core/design/SESSION.md` §6.21**（本注不重述值域）。
4. **施加面**：活动会话 ⇒ 内存态即生效（模型合并语义 = 核 `applySession` 模型合并支单点；档位 = 核 `resolveEffortPatch(level, model)` 纯函数——族别 off 形经核 `think-off.mjs` `thinkOffShape`，档位值域单源 = `specForModel(model).reasoningEffortEnum`）；**非活动槽 ⇒ 只写盘**，switch 时由 `applySession` 生效。
5. **零算法副本**：端侧不重算槽语义、不校验模型值域（候选面来自 `model:list`；写面取字面串——沿 `settings:agent` `defaultModel` 先例）；**档位枚举的校验面 = 端侧控件闭集**（写面不预校验——槽值可被跨端 / 手工改写，表外档位字面串 ⇒ `effort` 归一 `null`〔未设〕，沿核读侧容忍口径）。
6. **端差登记（有意分歧）**：CLI `applyThink` 面批 B 不动——推理档位面端侧自有（用户 2026-09-15 裁定「核内无需位」；在案 = `thincoder-vscode/src/agent.mjs:260-265`）；桌面与 VSC 同义（各自端侧实现，核内零调用点）。
7. **回执与失败径**：reason 闭集 = `invalid-patch`（非对象 / 空对象 / 表外键）· `model-required`（`provider` 变更未同送 `model`）· `bad-key`（键不合法）· `slot-missing`（槽不可读）· `busy`（回合在飞 ⇒ **零写**）；**成功携 `meta`（信封五键）· 失败缺 `meta` 键**；失败径一律零写（槽值不变）。

**附件注（`msg:send` `images` 载荷 · 单源 · 批 B 落）**：

1. **载荷**：`images` = 逐项 `{ name, mime, dataURL }`（缺省 / 空数组 ⇒ 无附件路径——与批 A 载荷同义）；渲染面零 fs ⇒ 图面数据经本通道入主进程落盘。
2. **落盘**：主进程写入 `<cwd>/.thincoder/tmp/paste-<ts>-<i>.<ext>`（`<ext>` 由 `mime` 推；先例 = `thincoder-vscode/src/extension/image-handler.mjs`）⇒ 交核的 = **绝对路径数组**（核消费面 = `thincoder-core/agent/setup-reminders.mjs:248` `appendImagePointer`——尾附 `[Attached images: …]` 指引）。
3. **上限与失败**：单项超阈（先例数值 = 15MB）⇒ 该项弃（其余照发）；**合计超阈（30MB）⇒ 超出部分弃**（其余照发）；落盘失败 ⇒ 该项弃（不阻断发送）；**零静默**——弃项经回执 `degraded` 面浮出（`"partial"`）。
4. **非视觉模型降级面**（需求 D13 逐字）：端侧**前置门** = 核 spec 的 `multimodal` 判据（同源 = `thincoder-core/agent/setup-reminders.mjs:251`——核侧非多模态 ⇒ 抛错）⇒ 假 ⇒ **不落盘、不注入 `images`**，改在用户消息文本尾追加一行说明（端侧降级 · 零核错抛出；词键面 = 渲染面词表）；回执 `degraded: "non-vision"` ⇒ 输入区明示（不静默丢图）。
5. **回执三形**：`{ ok: true }`（全收）· `{ ok: true, degraded }`（降级 / 部分弃）· `{ ok: false, reason }`（沿批 A 三 reason 不动）。
6. **临时文件清理（回合尾）**：落盘件住 `<cwd>/.thincoder/tmp/`——宿主回合尾结算点（主进程）清本回合落盘件；清理失败 ⇒ `console.error`（容忍——零静默）。

**项目面注（`project:open` 选中后语义 · `project:recent` 读面）**：

1. **槽命中 / 生成（打开即物化）**：按 cwd 哈希取会话路径（核 `sessionPath(cwd)`——`thincoder-core/session-slots.mjs:81`）——已有数据文件即命中；**无数据文件**的族按核 `newSlotData` 同形落空槽数据文件（`thincoder-core/session-slot-write.mjs:38`；同链先例 `thincoder-vscode/src/extension/session-io.mjs:146-147`）⇒ 打开即物化，最近面遂可回读 cwd。**零新存储**：既有会话格式 + 既有槽索引。
2. **切当前项目**：主进程**内存态**（不落盘——`docs/desktop/design/PROJECT.md` §2 KD-9）；唯一持有点 = `thincoder-desktop/src/main/projects.mjs`；会话根 = 由核 `sessionPath` 反推（照扩展端端壳访问器先例 `thincoder-vscode/src/extension/session-slots.mjs:56-58`——`sessionsDir()`）。
3. **刷新与接续（批 5 落）**：返回 `{ cwd, recent }` 后，渲染面经 `sessions:list` 刷左列；`project:open` 成功 ⇒ 渲染面**自动一次** `session:resume`（「点开即可续」——需求 §3.1）⇒ `ok` ⇒ 开标签 + 两读面刷新；此后开标签走 `session:switch`（点行 / 点标签**同一路**——激活即切换会话）。
   - **「成功」判据（fail-soft 通道——无成功旗标）**：回执 `cwd` 变更 ∨ `cwd` = 请求 `path`（取消 / 无效路径同返 `{ cwd, recent }`：`thincoder-desktop/src/main/projects.mjs:114-120`）；同目录经选择框重选（无 `path`）不重复接续。
4. **`project:recent` 读面 = 核会话槽面回读（零新存储）**：扫 `~/.thincoder/sessions/` 的 40 位哈希族（族判据单源 = `thincoder-core/session-stale.mjs:46` 的 `GROUP_RE`；纯函数 `groupSessionEntries` 实读 `:56`，给每组最新 mtime）→ 每组取一份数据文件回读 `cwd` → 按组最新 mtime 降序取前 10（**位次 = 最近写入**——打开既有族不刷新）。不落新文件、不落新配置字段（需求档 §2「不得另立存储格式」）；重启后列表仍在 = 槽面事实。
5. **原 `dialog:openFolder` 行折入 `project:open`**——渲染面单通道，目录选择不单列。
6. 通道注册与分发面 = `thincoder-desktop/src/main/ipc.mjs`。

**设置族与项目级信息族注（批 9）**：

1. **写面唯一执行体** = 核 `writeConfigAtomic`（`thincoder-core/config-io.mjs:59`——`stat → read → mutate → 原子写`四步住核；mtime 冲突 ⇒ `{ ok:false, reason:"mtime-conflict" }` + `.bak-{ts}` 留现场（备份档常量 `thincoder-core/config-io.mjs:78`））；
   读面 = 核 `loadConfig`（`thincoder-core/config.mjs:228`）；**端侧零自写盘、零 provider 形状构造**（值面住核：`addProviderEntry` `config-io.mjs:223` · `removeProviderEntry` `:262`〔激活渠道保护 `:270`〕· `setProviderKey` `:201` · `cascadeRemoveProvider` `:178`）。畸形档 ⇒ `loadConfig` 抛，invoke 拒绝直传（沿 `config:read` 先例——零静默重置）。

2. **逐通道载荷 / 回执（批 9 定形 · 单源）**：

| 通道 | 载荷 | 回执 | 核入口（零算法副本） |
|---|---|---|---|
| `config:write` | `{ patch }`——键白名单**仅** `locale`（值域 `en` / `zh`；provider / agent 参数各有专属通道，不经此口） | `{ ok, reason }`；成功 ⇒ **同回带** `{ locale, dict, configured }` ⇒ 渲染面 `initDict` 重刷 + 向导闸随新档态（**零新事件通道**——免二跳重调） | `writeConfigAtomic` |
| `provider:list` | — | `{ ok, providers:[{ name, shape:"preset"\|"custom", baseURL, model?, hasKey, maskedKey, active, effort }], active, presets:[{ name, baseURL, model }] }`——`providers` **只回遮罩后值**（遮罩在**端侧单点 `maskKey`**——判据 = 核**导出** `isSensitiveKey`，`thincoder-core/agent-tools/settings.mjs:22`）；`presets` = **预设候选面**（逐条三键 = 候选面最小读数；**端侧零表**——表体与条数单源 = 核 `PROVIDER_PRESETS`（`thincoder-core/config-presets.mjs:16`；re-export 链 `thincoder-core/config-io.mjs:30` ← `thincoder-core/config.mjs:27`），其余字段不出面、保存时由核 `presetToEntry`（`thincoder-core/config-presets.mjs:44`）按名展开——端侧不构造 provider 形状，`docs/desktop/design/PROJECT.md` §2 KD-10）；**批 B 增**：逐行携 `effort` = 该渠道条目**档位现值投影**（`"auto"` ∥ `"off"` ∥ 档位字面串——**离线**（零探针），投影规则与写面单源 = 本档 §2「档位控件注」） | `loadConfig` + `resolveProviders`（`config-io.mjs:146`——原样含 `apiKey` ⇒ 核零改） |
| `provider:save` | `{ name, shape, preset?, baseURL?, model?, key?, format?, active? }` | `{ ok, reason }`；reason = 核错误串**直传** ∥ `invalid-shape`（端侧形判） | `addProviderEntry` |
| `provider:remove` | `{ name }` | `{ ok, reason }`；激活渠道 ⇒ 核文案**直传**（`config-io.mjs:270`）——不造码、不改写 | `removeProviderEntry` + `removeProviderKeyFromConfig`（`:211`） |
| `provider:verify` | `{ name }` | `{ ok, reason?, models? }`；`reason` 闭集 `timeout` ∥ `malformed` ∥ `unavailable` | `probeChannelModels` + `classifyProbeFailure` + `channelUnavailableMessage`（`thincoder-core/provider/list-models.mjs:152` / `:125` / `:109`） |
| `model:list` | `{ provider }` | `{ ok, models, reason? }`（format 分派 / 排序住核）；**批 B 增**：`models` 逐项携 `effortEnum` + `thinkOff`（元素形 = `{ id, effortEnum, thinkOff }`——核 `specForModel(model).reasoningEffortEnum` / `thinkOffPath(spec)` 逐模型投影：端侧档位候选面单源 · `thinkOff` = off 可达判据） | `listModels`（`thincoder-core/provider/list-models.mjs:96`）+ 核 `thincoder-core/model-specs.mjs` `specForModel` |
| `settings:agent` | 读 = `{}`（**两键皆无效（缺省 / `null`）⇒ 读面**——含 `{}` / `{patch:null}`；**两有效键同在** ∨ **`patch` 值非对象 / 空对象** ⇒ `invalid-patch`——实读 `thincoder-desktop/src/main/settings.mjs:230-240`）；写 = `{ patch: { "<点分路径>": value } }` ∥ `{ tier: { provider, model, level } }`（**二择一**——档位**意图级载荷**，写协议与 reason 闭集 = 本档 §2「档位控件注」；两俱 / 两缺 ⇒ `invalid-patch`） | 读 ⇒ `{ ok, fields }`（值 + 敏感遮罩）；写 ⇒ `{ ok, reason, fields }`（写后回读；档位面码 `bad-level` / `unknown-provider`——零写，见「档位控件注」） | 键面 `thincoder-core/agent-tools/settings.mjs:33`（形状表 `_NULL_LEAF_SHAPES`）+ 同族表 `:42` / 类型表 `:62` / 完备性 `:85` / 校验 `:134`（导出面 `:270`）；写链 = `_checkKnownKeyValue`（`:252`）→ `writeConfigAtomic`（`:255`） （机检豁免——端侧语汇） |
| `mcp:list` | — | `{ ok, servers:[{ name, kind:"url"\|"command", summary }] }` | `loadConfig` 的 mcp 节（热重载先例 `thincoder-core/config.mjs:358`） |
| `mcp:save` | `{ name, config }` | 探活通过 ⇒ `{ ok, tools? }`（写盘 + 接入）；失败 ⇒ `{ ok:false, reason, detail? }` **零写盘** | `probeMcpServer`（`thincoder-core/mcp.mjs:82`）+ `writeConfigAtomic` + `connectMcpServer`（`:225`） |
| `mcp:remove` | `{ name }` | `{ ok }`（写盘 + 工具面撤除） | `removeMcpTools`（`thincoder-core/mcp.mjs:285`）/ `closeAllMcp`（`:269`） |
| `ledger:read` | `{ cwd? }`（缺省 = 当前项目） | `{ ok, counts:{ pool, tech, aged }, thresholdReached, reason? }`（**无行集**——需求 D10 逐字「台账**行**」= 单行读数；行集不面客）；未开项目 ⇒ `{ ok:false, reason:"no-project" }` | `buildScan`（`thincoder-core/ledger.mjs:114`——返回体 `:134-140` · `thresholdReached` `:129`）——**经动态 import**（W8 契约②：`ledger-db.mjs` 静态 import `node:sqlite`）；端点面 `ledger-cmd.mjs` 不动 |
| `batch:status` | `{ cwd? }` | `{ ok, phase, reason? }`——相位取核**回执 `manifest.phase`**（无顶层 `phase`）；`reason` 两档 = `missing`（`:372`）∥ `invalid`（`:380` / `:383`——两分不合并）· 非 ENOENT 读错 ⇒ 上抛（`:374`）直传 | `readManifest` + `manifestFilePath`（`thincoder-core/manifest.mjs:366` / `:236`；值域 `initial-dev` / `production` `:268`） |

3. **键面**：本族通道**不携会话 `key`**——设置族 = 端 / 全局面 · 项目级信息族 = 项目面（**项目一份、不随会话走**）；`key` 面单源 = 本档 §1「会话键面」段。

4. **两条口径有意分歧（勿统一）**：① `provider:verify` 探不通**仍可保存**（只出读数——渠道 key 可用性不只在探测当下；离线 / 代理场景不得阻断首启；卡面明示「未校验通过」）∥ ② `mcp:save` 探活失败 ⇒ **零写盘**（配错必连不上——先例 = `thincoder-cli/src/tui/cmd-mcp.mjs`）。

5. **密钥纪律**：key 明文只落 `~/.thincoder/config.json`；值不入文档 / 日志 / 用例夹具；**遮罩在端侧单点 `maskKey`**（`thincoder-desktop/src/main/settings.mjs`——先例 `thincoder-cli/src/tui/config-helpers.mjs:39`），判据取核**导出** `isSensitiveKey`（`thincoder-core/agent-tools/settings.mjs:22`）；
   核 `MASKED`（`:19`）**非导出** ⇒ 端不复用；通道只回 `{ hasKey, maskedKey }`。

6. **向导闸**：首启判据 = **配置档存在性**（需求 §3.3 逐字：已配 ⇒ 跳过）——读数 = `config:read` 回执 `configured`（= `existsSync(configPath())`——`thincoder-core/config-io.mjs:39`〔核内 `_configPath()` · 路径常量 `:33`〕；**不在** `config.mjs` re-export 面；先例 = `thincoder-vscode/src/extension/config-watch.mjs:37`）⇒ **渲染面零 fs**；
   三步 = 选 preset → 填 key（`provider:verify` 真调一次）→ 选目录（`project:open`）；渠道表单与 verify 出口 = `thincoder-desktop/renderer/views/settings.mjs` 导出面（单一 owner、零副本）。
   **口径差有意（勿统一）**：CLI `isConfigured`（`:27`）= key 可解析（更严）——两端判据不同源。
7. **拒绝直传（批 9）**：主侧处理体**不吞错**——`readManifest` 非 ENOENT 读错（`thincoder-core/manifest.mjs:374`）与 `loadConfig` 畸形档抛错均**原样上抛** ⇒ invoke 拒绝（零静默降级、零假回执）。

8. **端侧出口与判定口径（批 9 补锚）**：① **`defaultModel` = 复合串** `"<provider>:<model>"`——写口两处：视图动作出口 `settings:useModel`（`thincoder-desktop/renderer/views/settings-sections.mjs:141`）经 `settings:agent` 写 `{ patch: { defaultModel } }`（`thincoder-desktop/renderer/mount-settings.mjs:296`）；
   `provider:save` 带 `active:true` 同批追加（`thincoder-desktop/src/main/providers.mjs:115-119`——写盘执行体 :115 起）；`active` 读数 = 该串 provider 段（同档 `:62-:63` 单源注 + `:83` 逐行读数）。
   ② **`FORMATS` 判定** = **端侧枚举**（UI 选项闭集 = `thincoder-desktop/renderer/views/settings.mjs:55`；写面形判常量同值域 = `thincoder-desktop/src/main/providers.mjs:24`）——**非核协议表副本**（协议分派 / 排序仍住核 `thincoder-core/provider/list-models.mjs`；KD-10 不变）；两常量同值域 ⇒ 增删协议须两处同改（随动面登记）。
   ③ **`provider:verify` 读账优先**：失败分档取核**落账**读数 `admissionOf(name).failure`（核探针内落账——端侧零再分类副本；未落账 ⇒ 回落 `classifyProbeFailure` 现算）——`thincoder-desktop/src/main/providers.mjs:113-118`。
   ④ **向导面控件零名 + 提交端自读现选**：向导步内控件不带提交名（零表单序列化）；提交时端侧读槽内现值（读值单点 = `thincoder-desktop/renderer/mount-settings.mjs:50`）——现选缺 ⇒ 零发送（`invalid-shape`）；机检 = `thincoder-desktop/test/views-onboarding.test.mjs:71` / `:153` / `:158`。

9. **档位控件注（批 B · ⑥ 设置面档位控件）**：设置面「模型与档位」段的档位 `select` = **渠道条目级默认**（写 `defaultModel` 复合串 provider 段的渠道条目 `provider.<P>.reasoningEffort` / `.thinking` 两键）；**逐模型精确控制 = 会话级档位**（本档 §2「会话级偏好注」）——两面不互相顶替（需求 §3.5 项 6）。四事单源：

   - **写载荷（意图级）**：`settings:agent` 写形增 `{ tier: { provider, model, level } }`（与 `{ patch }` 二择一）。**非键级 `patch`**——`patch` 表达不了删键，且三键族属主进程知识（渲染面零键名）。
     `level` = `"auto"` ∥ `"off"` ∥ `specForModel(model).reasoningEffortEnum` 表内字面串——`"none"` 不作独立档（其语义由 `"off"` 承载，沿 CLI 归一先例 `thincoder-cli/src/tui/cmd-think.mjs:111-142`）。
   - **写协议（统一式——先清不相容记号，再按档落形）**：`auto` ⇒ 删 `thinking` + 删 `reasoningEffort`；`off` ⇒ `thinking = thinkOffShape(spec)` + 删 `reasoningEffort`；
     member ⇒ 删 `thinking`（**仅当其值 deep-equal `thinkOffShape(spec)`**）+ `reasoningEffort = level`。判据单源 = 核 `thincoder-core/think-off.mjs:14`（`thinkOffShape`——effort 族 `null` ∥ 余族 `{type:"disabled"}`）/ `:22-26`（`thinkOffPath`）；**写后投影恒等**（读数 = 所选档——编辑器面硬要求）。
     **与 CLI 的差有意（勿统一）**：CLI member 径只清 `null` 字面（`thincoder-cli/src/tui/cmd-think.mjs:111-142`——范围由其评审 #1 圈定）——本端取 deep-equal 判据（覆盖类型族 `{type:"disabled"}` 残留）。
   - **现值投影（`provider:list` 逐行 `effort`——离线，零探针）**：`reasoningEffort` 为串 ⇒ 该串（`"none"` ⇒ `"off"`）；否则 `thinking` 键在场且值 deep-equal `thinkOffShape(spec)` ⇒ `"off"`；否则 ⇒ `"auto"`（`{type:"enabled"}` 一类不在档位维度内 ⇒ 按未设 level 读）。**spec 绑定 = 该行模型**（活动行取 `defaultModel` 模型段——写面同源保「写后投影恒等」；余行取条目自身 `model`；缺 ⇒ 核默认规格——单源 = `thincoder-desktop/src/main/providers.mjs:68-69`）。**表外现值 ⇒ 自成一选项**（不吞 · 零改写——仅设置面；会话头读侧归 `null` ⇒ 无此态）· **选项集缺现值 ⇒ 现值自成一选项**（禁吞）。
   - **候选面**：选项 = `Auto` + `off`（该模型 `thinkOff` 真时在场）+ 逐模型枚举（单源 = 核 `reasoningEffortEnum` 投影）；`settings.defaultModel` 缺 / 模型段空 ⇒ 档位控件**零节点**（禁假造）。候选面**零新探针依赖**：现值走离线投影（零探针）；枚举随模型段既有 `model:list` 探针（探针不可用 ⇒ 该段本无模型候选 ⇒ 控件零节点）。
   - **拒绝面（零写 · reason 闭集）**：`level` 表外 ∥ `"off"` 而 `thinkOffPath(spec)` 假 ⇒ `bad-level`；`provider` 不在配置 ⇒ `unknown-provider`；写盘失败 ⇒ 核 reason 直传（`mtime-conflict`）。失败面可见 + 控件回退回执前值（零静默）。

## 变更记录

- 2026-09-25：建档（桌面端设计批 1 · 分档轮）——由 `docs/desktop/design/PROJECT.md` §3.2 分出：§1 = 主 → 渲染事件表逐字；§2 = 渲染 → 主请求表逐字（`history:page` 行的 `§9` 回指随动改为带路径指针）；「事件映射」= 该档 §3.4 项 2 的命名单源说明。
- 2026-09-25（**修正轮**——设计评审 §3 轮次 1 发现 1 / 2 / 11）：§2 增**项目面**通道 `project:open`（缺省 = 主进程原生目录选择）· `project:recent` + 项目面注（选中后语义三步 · 读面 = 核槽面回读零新存储——`docs/desktop/design/PROJECT.md` §2 KD-9）；原 `dialog:openFolder` 行折入 `project:open`；`config:read` 行补**语言面下发** `{ locale, dict }`；§1 增**菜单面**首版口径注。
- 2026-09-25（**修正轮 2**——设计评审 §3 轮次 2 发现 15）：§2 项 1 改为「槽命中 / 生成（**打开即物化**）」——无数据文件的族由打开动作落空槽数据文件（核 `newSlotData` / `writeSessionFile` 链），T-DSK2「打开即入最近列表」遂成立。
- 2026-09-25（**修正轮 3**——收尾两件：设计评审 §3 轮次 2 发现 15 的 H1 角落）：§2 项 4 补位次口径「**位次 = 最近写入**——打开既有族不刷新」（读者面消费位次之处单源在此；不为排序写盘——批次档 §1.12 裁定）。
- 2026-09-25（**实施后修正轮**——U3 / D4 / 坐标对账）：§1 菜单面补平台惯例 Edit 组（内建 `role:`，非通道——实读 `window.mjs:47`）；§2 会话族行补 `createdBy` 读面（缺键 ⇒ 不标注 · 禁以占用端冒充）；§2 项目面注项 2 端壳坐标改指现形（`thincoder-vscode/src/extension/session-slots.mjs:56-58`）。
- 2026-09-25（**批 3 视图面首段 · 左列**）：§2 增「会话族注」——`sessions:list` 载荷 `{ cwd, rows }` 与行字段语义（`createdBy` 缺键 ⇒ 不标注 · `isActive` = 只读活动槽标）· 零新增算法 · 运行标记 / 待审批位分批口径。
- 2026-09-25（**实施后修正轮 2**——标记与路径收正）：`:3` / `:36` / `:55` / `:59` 已落档行的「（拟新增）」标记去标；`:36` 的 i18n 相对路径 token 收带路径全名 `thincoder-desktop/renderer/i18n.mjs`（拟新增锚消）。
- 2026-09-26（**批 5 会话族批**）：§2 会话族行补**写通道回执信封**指针；会话族注增项 5（信封 `{ ok, reason?, cwd, slot }` · reason 两档 + 核闭集直传 · 动作层单源 `thincoder-desktop/src/main/session-actions.mjs`（拟新增））；项目面注项 3 补**刷新与接续**（`project:open` 成功 ⇒ 自动一次 `session:resume` ⇒ 开标签——点开即续）；项 5 **行宽收正**（520 → 三行 ≤300）。
- 2026-09-26（**批 5 修复轮 #60**——设计评审 §3 轮次 1 发现 1 / 5）：项目面注项 3 补**「成功」判据**子行（fail-soft ⇒ 回执 `cwd` 变更 ∨ = 请求 `path`——`thincoder-desktop/src/main/projects.mjs:114-120`）；会话族注项 5 信封记法统一 `reason: null|string` + 补 **cwd 空档不对称** 与 **`slot-missing` 一词三因** 两子行；§2 会话族行信封同记法。
- 2026-09-26（**批 5 实施后修正轮 #62**——逐号 3）：会话族注项 5 动作层行「（拟新增）」标记删（`thincoder-desktop/src/main/session-actions.mjs` 已交付 · 实读 67）；本档变更记录内旧记法（`reason?` · 同段「（拟新增）」）按**记录面留档**不改（统一记法 = 批 5 修复轮 #60 两条）。
- 2026-09-26（**批 7 审批与活动池视图面**）：§1 `ev:approval` 行补**载荷定形**（消费面最小字段集 = `{ promptId, shape, tool, args, changes?, count? }`——缺 `changes` ⇒ 卡面无摘要行）；§2 `approval:respond` 行补**载荷定形**（`{ promptId, verdict }` + 六值闭集）+ 未装配口径（fail-loud 直传拒绝）+ 回执形定（沿会话族同形族）。
- 2026-09-26（**批 7 修复轮 #72**——设计评审 §3 轮次 1 发现 1）：§1 `ev:approval` 行载荷字段集**归一** = `{ promptId, shape, tool?, argsSummary?, changes?, batch?: { count, tools } }`（`args` ⇒ `argsSummary` · 顶层 `count` ⇒ `batch.count` + `batch.tools`（工具名数组）· 补两形缺省口径）。
- 2026-09-26（**批 8 装配桥批**）：§1 增**载荷键集（本批定形）**段（九通道 `key` + 逐通道字段集 · `argsSummary` = 端展示面口径）· **会话键面**段（`key` = `String(slot)`——主侧装配表 / 挂起表项 / 渲染侧切片键同值同源 · 坏键回落 reason）· **订阅面**段（preload `on(name, cb)` 白名单九通道 · 表外 throw · 返回退订）；
  §2 `history:page` 行收为实给（载荷 / 回执 / 页量 = 核 `historyWindow` 缺省 200 条 / 槽缺与坏键 reason）· `msg:send` / `msg:interrupt` 行定形（单驱动器 + 三回执 reason + UI 分批指针）· 增**白名单面**段（13 项 · 两向相等 = 用例机检面）。
- 2026-09-26（**批 8 修复轮 #79**——设计评审 §3 轮次 1 发现 ⑤ / ⑪ / ⑫）：§1 载荷键集段逐通道拆条（单行 491 → 列表；
  `ev:tool-result` 补 `ok` 判据 = `!String(result).startsWith("Error:")`——与核 `thincoder-core/agent/dispatch.mjs:370` / `:422` / `:428` / `:440` 同源）；
  §2 增**页游标注**段（`next` = 窗下界 · 零消息页游标必推进 · `HISTORY_PAGE_SIZE` 核单源）· 白名单面段收为**已实给 13 项**（十项序锁定 + 三新；其余通道随各自批次入册）。
- 2026-09-26（**批 8 doc-check 清项轮**）：本档变更记录批 8 行**行宽收正**（405 → 两行 ≤300）——零语义变更。
- 2026-09-26（**批 8 修复轮 #82**——设计评审 §3 轮次 2 新 17 / 18 / 19 / 20）：§1 `ev:activity` 行产出方补全（宿主回合起 / 内联事件族 / 宿主结算三面）· 载荷键集段 `ev:activity` 拆**三形** + 判别写死（`fields` 在场 = 内联形——零回合尾 · 无 `fields` 的 `done` / `stopped` = 宿主结算面）；
-   `ev:error` 行产出方补宿主结算坐标 · 载荷收**单形** `{ key, message }`；§2 随动口径 = `docs/batches/2026-09-26-desktop-impl-8.md` §2.16。
- 2026-09-26（**批 8 修正轮 #91**——逐号定点）：§1 `ev:activity` / `ev:error` 行与事件映射段**去「（拟新增）」**（宿主档已落）+ 映射段补回调桥出档坐标（`thincoder-desktop/src/main/agent-bridge.mjs`——九回调映射单源）；
  载荷键集段 `ev:question` / `ev:task` 键定形（`question` / `options` · `items`——核回调实参透传）+ `ev:question` **只出站**注（作答通道未落 · `onQuestion` 信号串出口）· `ev:tool-result` 条 `subKey` 补**值面在场 · 消费未落**注。
- 2026-09-26（**批 9 设置面与首启向导批**）：§2 六族通道行收实给（`config:read` 措辞收正 = 核无 `saveConfig`，唯一写盘执行体 `writeConfigAtomic`）；§2 增**设置族与项目级信息族注**（逐通道载荷 / 回执 · 键面 = 不携会话 `key` · 两条有意口径 · 向导闸）；白名单面段收为**已实给 25 项**（既有 13 + 本批 12 逐条点名）；`memory:status` 行记**归另批**（携核只读出口——端侧直读核内表不授权）。
- 2026-09-26（**批 9 收正轮**——坐标实核后定点）：`config:read` 回执增 `configured`（`config-io.mjs:39` · 常量 `:33`）· `config:write` 成功同回带 `{ locale, dict, configured }`；`ledger:read` 行收正（删 `rows` · 增 `thresholdReached` ·
  锚 = `buildScan`（`ledger.mjs:114`）——`ledger-cmd.mjs` 端点面不动）；`batch:status` 行收正（相位 = 回执 `manifest.phase` · reason 两档 `:340` / `:348` / `:351` · 非 ENOENT 上抛 `:342`）；
  项 1 `.bak` 坐标 `:97` ⇒ `:78`；`provider:list` 补端侧单点 `maskKey`（核 `MASKED` 非导出）；`settings:agent` 补形状表 `:33` 与写链 `:252` / `:255`；项 5 遮罩端侧单点；项 6 闸 = `config-io.mjs:39`（口径差有意）；增项 7（拒绝直传）。
- 2026-09-26（**批 9 修复轮 #94**——设计评审 §3 十条逐号 + doc-check 清项）：注项 1 / 注项 5 / 注项 6 **行宽收正**（≤300——零语义）；注项 5 / 注项 6 前向引用补「（拟新增）」（`thincoder-desktop/src/main/settings.mjs` / `thincoder-desktop/renderer/views/settings.mjs`——盘上未落）。
- 2026-09-26（**批 9 闸面自清轮 #96**）：`:116` 行行尾加注记标记「（机检豁免——端侧语汇）」——`fields` / `reason` 两条符号·窄误锚清零（回执字段名·非宿主档符号；零语义、字段名未动）；明细 = `docs/batches/2026-09-26-desktop-impl-9.md` §2.12。
- 2026-09-26（**批 9 收正轮 #97**——`provider:list` 预设候选面）：`:111` 回执补 `presets:[{ name, baseURL, model }]`（逐条三键 = 候选面最小读数）；
  来源 / 单源约束 = 表体与条数住核 `PROVIDER_PRESETS`（`thincoder-core/config-presets.mjs:16`；re-export 链 `thincoder-core/config-io.mjs:30` ← `thincoder-core/config.mjs:27`）——**端侧零表**、其余预设字段不出面（保存时核 `presetToEntry`（`thincoder-core/config-presets.mjs:44`）按名展开）；
  白名单计数 / 通道序零动（**25 项**照旧——`presets` 为既有通道回执内字段，非新通道）；明细 = `docs/batches/2026-09-26-desktop-impl-9.md` §2.13。
- 2026-09-26（**批 9 修正轮 #9**——实施后修正轮）：`:112` 载荷补 `format?` · `:116` 读面判别补注（`patch` 缺省 / `null` ⇒ 同读；非对象 / 空对象 ⇒ `invalid-patch`）· 新增设置族注项 **8**（`defaultModel` 复合串两写口 · `FORMATS` 判定 = 端侧枚举 · verify 读账优先 · 向导面控件零名与自读现选）；
  注项 5 / 注项 6 前向引用「（拟新增）」清标（两档已落盘）；明细 = `docs/batches/2026-09-26-desktop-impl-9.md` §2.16。
- 2026-09-26（**批 A 对话面板批**）：§1 `ev:question` 行补**载荷定形**（`{ promptId, question, options }`）；载荷键集段该条改写（**作答通道落** = 挂起门 + 回合停在本次工具调用上，去旧出口口径）；
  §2 增 `question:respond` 行（载荷 `{ promptId, answer }` · 取消 = `null` · 回执三 reason）· `msg:send` 行输入区与中断键收实给；白名单面段 25 → **26 项**（批 A 一新追加末位 · 位次 26）。
- 2026-09-26（**批 A 修正轮**——设计评审 §3 十五条逐号点修）：§1 判别写死与 §2 `msg:send` 行**回合终局三径**（`done` / `stopped` ∨ `ev:error`——单源 = `docs/desktop/design/RENDERER.md` §1.1 回合尾三径条）·
  §2 `question:respond` 行**取消结算串点名**（`(user cancelled)`——单源 = `thincoder-desktop/src/main/suspensions.mjs`；两域 = 回执 `null` ∥ 工具结果串；核 `thincoder-core/agent/dispatch.mjs:419` / `thincoder-core/tools/question.mjs:24`）。
- 2026-09-26（**批 A 二轮点修**——设计评审 §3 轮次 2 发现 2）：§1 `ev:error` 行语义列收**单义**（宿主回合结算〔错误径〕——即回合尾三径之一，单源 = `docs/desktop/design/RENDERER.md` §1.1）；删旧「工具错误 / 回合错误」双支读法（工具级错误不经本通道，与同行后句同读）。
- 2026-09-27（**批 A 收口轮**——实施后随动收正）：§1 会话键面宿主收正（键面成于 `thincoder-desktop/renderer/mount-sessions.mjs:63` / `:100` / `:109`——响应表 1）+ 切片键补 `questions` / `tasks` · 载荷段「本批」⇒「批 A」四处 ·
  §2 `msg:send` 行 `mount-composer.mjs` 去「（拟新增）」· `approval:respond` 行补回执 reason 四档（`bad-verdict` 入册——单源 = `thincoder-desktop/src/main/suspensions.mjs:85-87`）。明细 = `docs/batches/2026-09-26-desktop-chat-panel-a.md` §2.13。
- 2026-09-27（**批 B 对齐批**）：§1 增 `ev:usage`（九事件 → **十事件**；载荷键集段 / 会话键面段 / 订阅面段计数同改 + 事件映射段补「非回调映射」注）；
  §2 `msg:send` 载荷扩 `images` + 回执增 `degraded` 档（新增「附件注」——落盘 · 上限 · 端侧前置多模态门 · 非视觉降级面）· 增 `session:prefs` 行与「会话级偏好注」（槽字段 `effort` · 核 `setSlotPrefs` / `resolveEffortPatch` · config 零写）· 白名单面段 26 → **27 项**（末位 27）。明细 = `docs/batches/2026-09-27-desktop-chat-panel-b.md` §2。
- 2026-09-27（**批 B 修正轮**——设计评审 §3 十五条逐号点修）：§1 `ev:approval` 载荷补 `key`（十通道一律携 `key`——载荷键集段同判）· `ev:usage` 行补量纲（0–100 整数）；§2 `session:prefs` 行值形收正（`null` 仅 `effort` · 表外档位字面串 ⇒ 归一 `null` · `provider` 变更须同送 `model`）+ 回执两向（成功携 `meta` · 失败缺 `meta` 键）；
  `model:list` 行补 `thinkOff`（元素形 `{ id, effortEnum, thinkOff }`——off 可达判据）；「会话级偏好注」增项 7（reason 闭集五档 + 失败零写）· 项 5 表外值 ⇒ 归一 `null`；「附件注」项 3 补合计上限（30MB）· 增项 6（回合尾清理）；会话族注项 5 补 `session:prefs` 同族例外（信封 + `meta`）。明细 = `docs/batches/2026-09-27-desktop-chat-panel-b.md` §2。
- 2026-09-27（**批 B 设计修订轮 · ⑥ 设置面档位控件**）：§2 `provider:list` 行补逐行 `effort` 档位现值投影 · `settings:agent` 行写形增 `{ tier }` 意图级载荷（两码 `bad-level` / `unknown-provider`）· 增**设置族注项 9「档位控件注」**（写协议统一式 · 现值投影 · 表外现值自成一选项 · 候选面零新探针 · 写后投影恒等 · 与 CLI 的差有意）。明细 = `docs/batches/2026-09-27-desktop-chat-panel-b.md` §2。
- 2026-09-27（**批 B 收口轮**——实施后随动收正）：全档「本批」⇒ 批号收正十一处（批 7 / 批 9 / 批 B）· `ev:error` 行产出方坐标 `:178` ⇒ `:222` · 事件映射段映射面收正（九回调 ⇒ **八通道**；`ev:usage` / `ev:error` 两行 = 宿主自产）· `ev:usage` 行补无上界夹值（> 100 照发）· `settings:agent` 读法收正（两有效键同在 ⇒ `invalid-patch` · 两键皆无效 ⇒ 读面——含 `{}` / `{patch:null}`；实读 `thincoder-desktop/src/main/settings.mjs:230-240`）。明细 = `docs/batches/2026-09-27-desktop-chat-panel-b.md` §2。
- 2026-09-27（**批 B 收口轮 · 续**——实施后随动收正）：§2 项 8 指针四处按实读重指（`provider:save` `active` 追加 `:97 ⇒ :115-119` · `active` 读数 `:44 ⇒ :62-:63` + `:83` · UI 选项闭集 `:53 ⇒ :55` · 写面形判常量 `:20 ⇒ :24`）；「档位控件注」现值条补 **spec 绑定句**（该行模型——活动行 = `defaultModel` 模型段 / 余行 = 条目自身 `model` / 缺 ⇒ 核默认规格）。明细 = `docs/batches/2026-09-27-desktop-chat-panel-b.md` §2。
- 2026-09-27（**对齐重定位批 · 设计轮**）：§1 增两通道（`ev:reasoning` / `ev:subagent`——载荷键集段「十二通道」同笔）+ `ev:usage` 载荷扩（`tokens?` / `timers?`）+ 事件映射段回调面收正（十一回调 ⇒ 十通道）；
  §2 增 `subagent:stop`（白名单面段 27 ⇒ 28 项）；明细 = `docs/batches/2026-09-27-desktop-ui-alignment.md` §2。
- 2026-09-27（**对齐重定位批 · 设计评审轮 1 点修**）：§1 `ev:subagent` 行收正——闭集去 `stopped`（`⟦ev⟧stopped` ⇒ `cancelled` 先例兼容）· `error` 不载（token 全表单源 = 核档 §5）+ 产出方补**宿主存活投影 2s 再断言**（出生自愈）；§2 `subagent:stop` 行判据收正（实收 `cancelled`）。明细 = `docs/batches/2026-09-27-desktop-ui-alignment.md` §2.11。
- 2026-09-28（**R3 结算随动 · 设计面收正微轮**——承 `docs/batches/2026-09-27-render-core-r3.md` §1.3）：§1 `ev:subagent` 行 KD-RC-6 括注收正——工具名仅作分流判据 · 块面无工具位（D20 单源）。零新语义。
