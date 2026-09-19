# ACP 客户端协议接入（`thincoder acp`）· CLI 面 · 设计

> 板块 = **ACP 协议**（编辑器接线）——`thincoder acp` 子命令在 stdio 上通过 Agent Client Protocol（schema v1）暴露 agent。
> 配对需求档 = `docs/cli/requirements/ACP-CLIENT.md`。
> 对位档 = **无**（VSC 仓无 ACP 实现——结构性不对称；VSC 有专有扩展面，ACP 是 CLI 侧的编辑器接线通道）。
> 建档：2026-09-15（**B 式迁移轮 · 第 6 批**——`thincoder-cli/docs/design/ACP-CLIENT.md` 内容重建入基准层；
> 旧档原地一字不改、留作参照历史。需求侧同批自 `thincoder-cli/docs/requirements/ACP-CLIENT.md` 迁入）。
> 本档坐标与行数 = **as-of 2026-09-15 实核**（仓根 = `thincoder/`）。

## 1. 协议基础（ACP schema v1）

- **传输**：NDJSON over stdio（每行一个 JSON，JSON-RPC 2.0）。
- **方向**：IDE = client（发起请求）、agent = server（响应 + 反向 RPC 通知）。
- **版本**：`initialize` 内 `protocolVersion` 协商（当前稳定版本 `1`）。
- **协议权威**：`agentclientprotocol/agent-client-protocol` 仓库 `schema/v1` 的 `schema.json`（方法名 / 事件类型以 schema 为准）。
  注意区分：`@agentclientprotocol/sdk` 的版本号是 **SDK 包版本**、不是协议版本。
- **不做**：unstable 扩展（auth-configuration / buffer sync / inline-edit 预测等）——正常客户端流程不依赖。
- **规范基线（as-of 2026-09-18 · 本批锁死）**：一手 = 上游仓 `agentclientprotocol/agent-client-protocol`（`main` 分支）`schema/v1` 目录的 v1 schema
  （实取：170 个 `$defs` · 46 条带 `x-method` 的 def，请求/响应各计）；二手 = `agentclientprotocol.com/protocol/**`（v1）；交叉印证 = 本地四份参考实现。
- **置信边界**：schema 取自 `main` 而非 tag ⇒ 字段结论以该 as-of 为限；`ProtocolVersion` 仅在破坏性变更时递增（只增不改）⇒ 字段名在实施窗口内稳定。
  **依据面清单与逐条回指见 §11.1。**
- **契约合规是唯一验收口径**：本档所有「改法」以 schema v1 原文为准，**不以迎合某客户端为准**（对某客户端有效但不合契约的形态一律不采纳）。

**方法清单（schema v1 提取）**

- agent 侧：`authenticate / initialize / logout / session/{new,load,resume,list,delete,prompt,cancel,close,set_mode,set_config_option}`；
- client 侧：`fs/{read,write}_text_file / session/{update,request_permission} / terminal/*`（terminal 为 client → agent 请求，agent 可不实现）。

## 2. 方法覆盖（thincoder 裁剪版）

### 2.1 Agent-side（IDE → agent）

| Method | 做 | 说明 |
|---|---|---|
| `initialize` | ✅ | 读 `params.protocolVersion`（单版本协商）+ `params.clientCapabilities`（**落客户端能力快照**，§3.4）；响应 = `protocolVersion` / `agentCapabilities`（`loadSession` + `sessionCapabilities`）/ `authMethods`（**对象数组 + `clientCapabilities.auth.terminal` 门控**）/ `agentInfo` —— §11.3 |
| `authenticate` | ✅ | 校验 `methodId` 属于已宣告方法（否则 `-32602`）；校验凭据可解析（否则 `-32000`）；通过 → **空结果 `{}`**（契约无 `authenticated` 字段）。**非前置闸门**：客户端可不调 —— §11.2 |
| `session/new` | ✅ | 接受 `cwd`（**必须等于进程工作目录**——v1 单 cwd 模型，见 §6.1）；忽略 `mcpServers` 并 warn；立即 `newSession` 认领独立槽；返回 `{ sessionId, configOptions: [{ id, name }] }`（契约形状收正见 §11.3） |
| `session/load` | ✅ | 恢复会话存档，经 `session/update` 重放历史（role → 事件块映射，见 §6.4） |
| `session/resume` | ✅ | 轻量变体（跳过历史重放，仅恢复 cwd + configOptions + 会话上下文） |
| `session/list` | ✅ | 枚举会话存档（槽位数量 unlimited，见 §6.1） |
| `session/delete` | ✅ | 删除会话存档（schema v1 有、参考实现未做——客户端清理会话的必需能力） |
| `session/prompt` | ✅ | 接受 text content 块；流式 `agent_message_chunk`；返回 `{ stopReason: "end_turn" }`（取消 → `"cancelled"`） |
| `session/cancel` | ✅ | 中断当前轮（真实 `AbortController`，见 §3.2） |
| `session/set_mode` | ✅ | plan / normal 切换（映射 `planMode`） |
| `session/set_config_option` | ✅ | model / thinking / mode 分发（见 §5.3） |
| `session/close` | ✅ | 返回 `{}` + stderr 日志；先 abort 在飞回合再删除 session |
| `logout` | ❌ | 无账号体系 |

### 2.2 Client-side reverse-RPC（agent → IDE）

| Method | 做 | 说明 |
|---|---|---|
| `session/update` | ✅ | 事件块见 §5（`agent_message_chunk` / `agent_thought_chunk` / `tool_call` / `tool_call_update` / `usage_update` / `config_option_update` / `current_mode_update` 等） |
| `session/request_permission` | ✅ | 工具审批 + 提问（审批通道的 ACP 实现；危险命令标注见 §5.4） |
| `fs/read_text_file` | ✅ | **仅内部用于 edit 桥的读回**（读 IDE buffer 当前内容再算 diff）——独立 `read` 工具保持本地（两者不冲突）。**仅当客户端宣告 `fs.readTextFile` 时才发**（§11.4） |
| `fs/write_text_file` | ✅ | write / edit 的写路径路由到 client（IDE diff 应用）。**仅当客户端宣告 `fs.writeTextFile` 时才发**；未宣告 ⇒ 回落本地写盘（§11.4） |
| `terminal/*` | ❌ | shell 走本地执行 |

### 2.3 通道裁剪（提问与流式输出）

- **`question` 工具**：ACP 无提问通道、不接通 elicitation ⇒ 会话装配期剔除该工具（模型不可见、不可调用、零必错回合）——机制见 §7.1；裁剪权威 = 需求档。
- **`onToolOutput`（工具输出流式增量）**：**明示缺**——ACP 不转发流式输出（父工具与子代理工具同口径），工具卡承载参数与最终结果；
  能力缺口条款见 §7.3。

## 3. 架构（零依赖约束）

```text
bin/thincoder.mjs ── "acp" 子命令 ──▶ thincoder-cli/src/acp.mjs
                                        │  （入口：装配 + 转发——handler 正文见下）
              ┌─────────────────────────┼──────────────────────────┐
              ▼                         ▼                          ▼
       acp/transport.mjs          acp/session.mjs            acp/bridge.mjs
   (NDJSON JSON-RPC stdio      (AcpSession: 方法 → agent      (runAgent 事件桥
    层 + reverse-RPC)           + 会话生命周期/FIFO)            + 工具钩子 + 权限)

   acp.mjs 的 handler 正文 = 四个模块（划分与判据见 §3.5）：
       acp/client-caps.mjs        initialize / authenticate（版本协商 · 能力快照 · authMethods 构造）
       acp/handlers-session.mjs   session/{new,prompt,cancel,close,set_mode,set_config_option}
       acp/handlers-slots.mjs     session/{list,load,resume,delete}（持久化槽族）
       acp/ext.mjs                checkpoint/* · memory/*
       acp/login.mjs              `--login` 终端认证流程（非 stdio 服务模式）
```

ACP 官方 SDK 是 npm 依赖——违反零依赖哲学，故自写精简层。`acp.mjs` 装配 transport / session / bridge 与四个 handler 模块，
并为每个 JSON-RPC 方法建处理器（模块划分见 §3.5）；工具循环经 `callbacks.toolRouter` 拦截工具执行（默认空实现——TUI / CLI 路径行为不变）。

### 3.1 传输层（`thincoder-cli/src/acp/transport.mjs`）

- `readline` 逐行读 stdin → `JSON.parse` → 分发；响应 / 通知写 stdout（**严格只写 JSON**——日志全走 stderr）。
- **错误码映射**：`-32600`（parse）/ `-32601`（method not found）/ `-32602`（invalid params）/
  `-32603`（**internal**——未捕获异常返回合法 JSON-RPC 错误，不中断 NDJSON 流）/ `-32000`（authRequired，ACP 扩展）。
- **入站串行 FIFO**：每行 handler 被 await 后才处理下一行——ACP 会话有顺序依赖（prompt 必须随 new）；请求级顺序端到端保证。
- **反向 RPC 请求**（`request_permission` / `fs/*`）带 id 发往 client 并等待响应（`request(method, params, { timeoutMs })`——
  静默 client 不会挂死 agent 循环）；**异常通道**：client 对反向请求的响应在队列外立即 resolve pending waiter
  （排队会死锁——prompt handler await 它时阻塞队列，而队列又等 handler 完成）。
- `write` 可注入（测试用）；SIGINT / SIGTERM → graceful drain（等在飞请求结束再退出）。

### 3.2 会话层（`thincoder-cli/src/acp/session.mjs`）

每个 `session/new` 创建独立 agent 实例（`defaultCreateSession` → `assembleAgent()` + `createAcpSession`）：

- **单 cwd 模型**：ACP 进程由 IDE 在项目目录启动，进程 cwd = 工作目录；agent 始终跑在进程 cwd
  （`session/new` 带 cwd 必须等于进程 cwd，否则 `-32602`）。
- **run 串行 FIFO**：并发 prompt 挂 per-session promise 链（后到等前一轮结束）；每回合末 `save(agent)` 持久化存档
  （finally 语义——成功 / 取消 / 失败均存；保存失败只记日志不破链）。
- **cancel**：真实 `AbortController`——provider 层用 `AbortSignal.any([signal, timeout])`，需真 AbortSignal；
  每回合后重建 controller，一次 cancel 只影响在飞回合。

### 3.3 方法 → agent 映射要点

- `session/list`：`listSlots(cwd)` → `{ sessionId, cwd, updatedAt, title, messageCount }`（单 cwd 模型注入 cwd；**`sessionId` 取值 = 持久化槽位号**——命名空间边界见 §11.3）。
- `session/load` / `session/resume`：`loadSlotFile(cwd, slot)` → `applySession(agent, data)`；
  **槽占用检测** → 空闲认领钉回、占用则 `newSession` **fork 到新槽**（防同槽双写静默互覆盖）。load 后重放历史（§6.4）；resume 不重放。
- `session/delete`：`deleteSlot(cwd, slot)`；**被删槽的在存会话**（`_slot` 仍钉着）→ 立即 `newSession` 钉新槽
  （否则下次保存经 activeSlot 早退分支落回同进程活动槽 → 两会话写同一槽）。删除活跃会话仅删持久化存档，在存内存会话继续。
- `session/set_mode` / `set_config_option`：改 agent 内存态，成功后经 notify 发 `current_mode_update` / `config_option_update`。
- `checkpoint/*`（create / list / restore）与 `memory/*`（list / remove）：扩展拉取面——checkpoint cwd-scoped
  （与 TUI git 工具同 store）；memory 复用 `~/.thincoder/memory.db`。`checkpoint/restore` 为单文件恢复（full rewind 禁用）。

### 3.4 客户端能力快照（`clientCaps`）

`initialize` 是本协议**唯一**的客户端能力交换点（schema：`InitializeRequest.clientCapabilities`，仅此一次）。
故本层在 `initialize` 时把 `params.clientCapabilities` 落为**服务器级快照**，并在 §11.2（auth 方法门控）与 §11.4（fs 反向 RPC 门控）消费：

- 快照**只读一次**（`initialize` 之后不再变——协议语义）；构造期透传给每个会话（`defaultCreateSession` → `createAcpSession` → `buildAcpCallbacks`）。
- **缺省语义 = UNSUPPORTED**（文档逐字：「Clients and Agents **MUST** treat all capabilities omitted in the initialize request as **UNSUPPORTED**」）⇒ 快照缺字段一律取 `false`，**不得**取「乐观默认 true」。
- 快照丢失（`initialize` 未到 / 测试直连 handler）⇒ 全部取 false ⇒ 行为 = **本地兜底**（最保守分支），不是报错。

### 3.5 处理器模块划分（函数档判据驱动 · 2026-09-18 批）

**判据**：**函数档是第一判据**——文件 ≤500 行而内含 ≥300 行单体函数**仍不合规**
（`docs/core/requirements/METHODOLOGY.md` F3-1「函数 ≥300 必拆」+ `docs/core/design/prompts/advisor-design.md` 第 8 条）。
现状 `buildAcpHandlers`（`acp.mjs:99`–`:466` = **368 行**，含 jsdoc 375 行）越线；本批既改其大半正文（12 个 handler 中 10 个改形），**当轮拆**——不留给「下次触碰」。

| 模块（新档名——无扩展名形态，见下注） | 装什么 | 关键缝 |
|---|---|---|
| `src/acp`（入口） | 常量（`VERSION` / `ACP_EXCLUDED_TOOLS`）· 注入默认（`defaultIsConfigured` / `defaultProviderStatus`）· `defaultCreateSession` · **`buildAcpHandlers` 装配**（合并四族）· `runAcpServer` | `buildAcpHandlers(deps)` 签名与返回 `{ handlers, sessions, notifyRef, requestRef }` **不变**（唯一外部契约——既有测档直驱它） |
| `acp/client-caps`（新） | 能力快照（§3.4）· 版本协商 · `authMethods` 构造 · `initialize` / `authenticate` handler | 快照 = 服务器级单例，构造期注入 |
| `acp/handlers-session`（新） | 内存会话族：`session/new` · `prompt` · `cancel` · `close` · `set_mode` · `set_config_option` + `findSession` · `applyConfigOption` + **门助手** | 经 `ctx` 取共享态 |
| `acp/handlers-slots`（新） | 持久化槽族：`session/list` · `load` · `resume` · `delete` + `slotEngineering` / `reattach`（#41 工程模式判据） | 同上 |
| `acp/ext`（新） | `checkpoint/*` · `memory/*` + `ensureAcpMemory`（**纯搬迁**） | 同上 |
| `acp/login`（新） | `runAcpLogin()`（`--login` 流程——§11.2 改法 4） | 独立入口，不进 stdio |

> **档名形态注**：上表模块名按**无扩展名**形态书写（`.mjs` 省略）——新增档尚未创建，机检锚判据对不存在的档会报悬空
> （同法先例 = 批次档 §2.7 修正3 手法①）；**逐字路径（含 `.mjs`）与行数预算 = 批次档 §2.3**。

**共享态经单一 `ctx` 传入**（不散落成各模块私有闭包）：
`{ getCwd, sessions, allocSessionId, notifyRef, requestRef, createSession, requireConfigured, log }`——
`findSession` / 门助手 / id 分配器都由入口建一次、按引用传（**会话 id 与槽位族共享同一分配器**——命名空间不因拆分而裂）。
**每模块 ≤300（函数与文件两档）；`acp.mjs` 目标 ≈130 行。** 受影响文件与逐档读数 = 批次档 §2.3（一次性材料，不入本档）。

## 4. 鉴权与配置

**凭据来源 = `~/.thincoder/config.json`（单一来源）**。`providers[].apiKey` 是唯一的 key 来源；
**环境变量不是 key 来源**（与 CLI / VSC / core 三面的现行姿势一致——见 §11.5 裁定）。

- **认证门 = 凭据状态即时判据**（**不是**一次性的 authenticate 闩锁）：每个受门 handler 首行求值 `isConfigured()`，真 ⇒ 放行；假 ⇒ `-32000`（`authRequired`）。
- **客户端可以完全不调 `authenticate`**——凭据已在位时 `initialize → session/new → session/prompt` 零交互全程可走
  （契约：schema `session/new` 方法描述逐字「**May** return an `auth_required` error … **if** the agent requires authentication」）。
- `authenticate` = **确认动作**（可选）：校验 `methodId` 属于已宣告方法、校验凭据可解析，通过返回空结果 `{}`；失败返回 `-32000`。
- `initialize.authMethods` = **对象数组**，且仅当 `clientCapabilities.auth.terminal === true` 时含 `terminal` 项（契约 MUST）；否则 `[]`。
- **会话起不来的两种情形文案必须可行动**：① 无可用 key ⇒ 指向 `~/.thincoder/config.json` 与登录流程；② key 在位但 `defaultModel` 不可解析 ⇒ **点名 `defaultModel`**（不得含糊报「未配置」——§11.5）。
- 非 ACP 通道（TUI / `chat`）的鉴权面**零改**。

## 5. 事件桥（`thincoder-cli/src/acp/bridge.mjs`）

runAgent 的 callbacks 直接映射为 ACP 通知（`session/update` 事件块）：

| runAgent 内部 | ACP 通知（schema v1） |
|---|---|
| `callbacks.onToken(text)` | `agent_message_chunk`（剥 `[model]` 元数据前缀、`⟦ev⟧` 事件 token **族形态**（§7.2）与子代理 relay 前缀 `role#id/`） |
| `callbacks.onReasoning` | `agent_thought_chunk`（relay 前缀同剥） |
| 工具开始 | `tool_call` `{ toolCallId, title, kind, status: "in_progress", rawInput, content }`（`title` = 剥 relay 前缀后的工具名） |
| 工具结果 | `tool_call_update` `{ toolCallId, status: "completed", content }`（REPLACE 语义） |
| 模型 / 模式变更 | `config_option_update` / `current_mode_update` |
| `callbacks.onUsage` | `usage_update` |
| 回合结束 | **非通知**——`session/prompt` resolve `{ stopReason: "end_turn" }` |
| `callbacks.onWait` / `onCompress` | 仅 stderr 日志（rate-limit / auto-compacted）——onWait 日志文案取**核内单源映射**（`docs/core/design/PROVIDER.md` §6.20）；`warn` / 未知相位 ⇒ 不打印 |

> relay 前缀剥离的逐点落法与配对键语义见 §7.2；本表只列映射骨架。

### 5.1 工具 id 配对语义

ACP `toolCallId` **按会话生成**（`t1, t2, …`）；模型级工具 id 跨轮 / 跨消息不保证唯一（每轮从 `call_0` 重置），
ACP id 必须唯一。bridge 维护 **FIFO `toolQueue`（条目 `{ name, id, toolId }`——`toolId` = dispatch 传入的模型级 id）**：

- **入队（onToolCall）**：push 前若队列已有同名同 `toolId` 条目，它必是结果永不回调的陈旧孤儿
  （dispatch 失败 / 中断路径不调 onToolResult）→ **先弹出再入队**——精确配对恒命中最新条目。
- **消费（onToolResult）**：① 模型级 `toolId` 精确配对（中断孤儿隔离）；② 无 id / 未命中 → 名称 FIFO 回退
  （保序——并行结果回调顺序 = call 顺序）；③ 均未命中 → `null`（调用方回退新 id——防御）。
- **审批面板**：`peekToolId(name)` 取同名最早项 id（不消费——result 仍与自己的条目配对）。

### 5.2 工具执行路由（fs 反向 RPC / edit 桥）

`callbacks.toolRouter(name, args)` 由 dispatch 在 `item.tool.execute(...)` 调用前尝试：`handled: true` 用其 result 作工具结果；
`false` 走本地执行。

- **write** → `fs/write_text_file`（构造新内容全量写，无需读回）。
- **edit**（单形态 + `edits` 数组）→ **读 IDE 缓冲 → `computeEditEntry`（本地 edit-diff 单一权威——校验 / 判定序 / 应用全部委派）
  → 写回 IDE 缓冲**。读回保证与 IDE buffer 一致（防客户端已改）；错误文本经抛错原样透传（与本地通道逐字一致）。
  - 单形态：读回 → `normalizeEOL` → `computeEditEntry` → `joinWithEol` 写回（LF 域判定、CRLF 域写回——与本地 edit 同判同恢复）。
  - 数组形态：条目自带 path 优先、缺省回退顶层 path（`path` / `filePath` 别名）；校验后读全部涉及文件缓冲
    （同文件去重一次读）→ 逐条 computeEditEntry → 全通过后逐文件写回（判失败零写、写失败同本地 edit-batch 原子语义）。
  - **结果回显**：`OK: edited <path> via IDE (<n> occurrence(s))`（含 note 时追加 ` — <note>`）。
- **apply_patch** → **本地执行**（unified-diff 应用不路由）。
- **delete、只读工具**（read / glob / grep / ls 等）→ **本地执行**（schema v1 无 `fs/delete`；读本地性能优先）。

**已知风险（TOCTOU）**：edit 读回与写入之间用户可在 IDE 改 buffer → 写入覆盖用户改动。缓解 = IDE diff 审查（用户保存前可见并拒绝）；
可选演进 = 写入带 base revision 校验（协议不稳定面，v1 非必需）。**记录为接受风险**。

### 5.3 configOption 映射（schema v1）

| configId | 值 | 映射 |
|---|---|---|
| `model` | string（`provider:model` / provider / model） | 首个冒号切分 provider + model；provider 不同则更新 `agent.provider.name` |
| `thinking` | boolean | `thinking: { type: "enabled" \| "disabled" }` |
| `mode` | `"plan"` / `"normal"` | `planMode` 切换 |

last-write-wins 于内部状态（**不落 config.json**）；set 成功后 notify `config_option_update` / `current_mode_update`。
未知 configId / 非法值 → 返回 false → `-32602`。

### 5.4 审批通道（`session/request_permission`）

复用 dispatch 既有 `onPermissionRequest`（不存在 → deny）。ACP 模式：bridge 提供
`onPermissionRequest = (name, args) → session/request_permission`——请求带选项 + toolCall；危险命令经 `detectDanger` 标注（只提示不拦截）。

- **选项（顺序 load-bearing）**：`approve_once`（Approve once）/ `approve_always`（Approve for this session）/ `reject`（Reject）。
- **响应判定**：approve 族 → `true`；cancelled / unknown → **`false`（安全优先）**。
- 传输失败 → `false`；超时 5 分钟。
- 非 ACP 模式：TUI / CLI 各自既有实现（完全不动——`thincoder-cli/src/cli/permission.mjs` 零耦合）。

## 6. 会话持久化

### 6.1 槽位模型

- `session/load` / `resume` 读会话存档（`thincoder-core/session.mjs`，双线历史 JSON）。
- `session/list` 枚举存档槽位——**槽位数量 unlimited**，按实际存档全量返回。
- **sessionId ↔ 槽位映射**：ACP sessionId = 槽位号（数字字符串，如 `"3"`）；load / resume / delete 按 id 解析槽位。
  每 `session/new` / `load` / `resume` 的 ACP 会话 id 独立分配（`nextId++`），与持久化槽位号不同物。
- **单 cwd**：进程 cwd = 默认工作目录；`session/new` 的 cwd 必须等于进程 cwd。跨进程 / 多 cwd 会话不在 v1 范围。

### 6.2 load 语义

- 人读线全量消息按序重放；机读注入（reminder / interrupt / transient）不存于存档，无需跳过。
- 槽被另一活进程（CLI / 另一 IDE）或本进程另一会话占用 → **fork 到新槽**（不钉回——防同槽双写）；空闲则认领钉回。

### 6.3 每回合末存档

会话层 `run` 在每回合 finally 调 `save(agent)`——**成功 / 取消 / 失败均存**。这使 list / load / resume 有真实数据源；
保存失败不破 FIFO 链。

### 6.4 历史重放（role → 事件块）

`replayHistory`（bridge）：

- `role: "user"` → `user_message_chunk`（多模态块逐块发；image 块跳过 + log）；
- `role: "assistant"` 无 `tool_calls` → `agent_message_chunk`；
- `role: "assistant"` 含 `tool_calls` → 每工具一条 `tool_call`（`status:"in_progress"`，独立 id 序列——客户端按 toolCallId 关联后续 update；孤儿 update 被忽略）；
- `role: "tool"` 结果 → 跟随其 assistant 消息的 `tool_call_update`（`status:"completed"`，内容截 2000 字）。

### 6.5 delete 语义

仅删持久化存档；活跃 in-memory 会话不受影响（如需停止客户端应另行 close / terminate）。
被删槽的在存会话 `_slot` → 立即 `newSession` 钉新槽（防「删后复活」写回同进程活动槽）。

### 6.6 cwd 归一化

`session/new` 的 cwd 与进程 cwd 做**大小写不敏感**比较（Windows 盘符 + 路径）——客户端发 `c:\\users\\…` vs 进程 `C:\\Users\\…` 必须匹配。
`requested` 永不喂任何路径操作——agent 始终跑在进程 cwd。

## 7. 通道修整（headless 通道的两条不变量）

### 7.1 question 工具装配期剔除

- **动机**：ACP 会话是**无交互 UI 的 headless 通道**——工具面不得提供本通道不存在的交互能力（模型可见即会调用，调用即必错）。
- **机制**：`thincoder-cli/src/acp.mjs:77` 导出 `ACP_EXCLUDED_TOOLS = ["question"]`；
  `defaultCreateSession`（`:83`）传 `assembleAgent({ excludeTools: ACP_EXCLUDED_TOOLS })`。
- **过滤实现**：`thincoder-cli/src/cli/make-agent.mjs:15` 导出纯函数 `applyToolExclusions(tools, excludeTools = [])`（按 `name` 过滤），
  在 `createAgent` 前应用（`:113`）——schema 逐请求派生自 `agent.tools`，故工具不可见。
- **剔除点选型理由**：装配期参数（schema 直接少一条；通道知识住 `acp.mjs`）——事后变异绕装配契约、bridge 层无装配权。
- **工具描述面**：`thincoder-core/tool-docs/question.md` 经 `{{inject:question-ui-face}}` 锚注入可用性行
  （取值表 = `thincoder-cli/src/prompt-injections.mjs:35`）——明写「无交互面（headless / 子代理）返回错误，问题放正文回复」。
- **同缺陷登记（不在本板块范围）**：`thincoder chat` 与子代理 children 的工具集亦无 `onQuestion`——
  机制相同（可用性行列已覆盖描述面），是否同款剔除待定（见 §9 登记项）。

### 7.2 relay 前缀零进 ACP 流

**文法单一权威**：`thincoder-core/agent/relay-prefix.mjs`（零依赖——TUI 与 ACP 双向可导入，无环）：

```js
export const RELAY_PREFIX_RE = /^([\w-]+)#(\d+)\//
export function parseRelayPath(text)     // → { head, inner[], label, rest } | null
export function relayPrefixOf(label, id) // → `${label}#${id}/`
```

- 生成侧 `thincoder-core/agent/spawn-child.mjs` 再导出（枢纽）；消费方直连模块
  （`thincoder-cli/src/tui/subagent-blocks.mjs` · `thincoder-cli/src/acp/bridge.mjs`——不再各自内联正则，防第二套平行文法漂移）。

**剥离逐点（剥离只作用于显示面；配对键保持原样）**

| # | 落点 | 落法（显示面） | 配对键（原样） |
|---|---|---|---|
| 1 | `onToken` | 取 `payload = path ? path.rest : text`；信号检查改在 payload 上；payload 非空 → `agent_message_chunk({ text: payload })` | — |
| 2 | `onReasoning` | 同①取 payload → `agent_thought_chunk`；空载荷不发 | — |
| 3 | `onToolCall` | `shown = path ? path.rest : name` → `title: shown`、`kind: inferToolKind(shown)`；`rawInput` / content 零改 | `toolQueue` 条目仍存原样 name |
| 4 | `onPermissionRequest` | 请求文本与 `toolCall.title` 用 `shown`；危险判定基名逻辑照旧 | `peekToolId(name)` 仍用原样名 |
| 5 | `replayHistory` | 同取 `shown`（防御面——无前缀 → 零变化；带前缀 → 剥离） | `pendingToolCalls` 配对零改 |

- **配对键保持原样**是硬要求：`a#1/read` vs `b#2/read` 若剥离后名作键，会与同名 FIFO 相撞 → 错配。
- **语义选择 = 剥离转发**（载荷保留）——内容今日已进流（仅带脏前缀），去前缀即最小变化；
  「子代理事件整体过滤」为**后续候选**（语义大改，需用户裁定——见 §9 登记项）。
- **剥后空载荷不发通知**（防噪声空 chunk）。
- **剥离后工具卡 `title` 不带归属标**（朴素工具名）——归属标是新显示约定，无客户端支持；子代理归属仍可从父级 `subagent` 工具卡时序读出。

**⟦ev⟧ 事件 token 剥离 = 形态判据（本批收正 · 需求档 F7 / R-A3）**

- **现状缺陷**：`thincoder-cli/src/acp/bridge.mjs:184` 用**枚举白名单** `(?:turn|approval|done|settled|stopped|async)`；发射面已有枚举外事件——
  `queued`（`thincoder-core/agent-tools/subagent-scheduler.mjs:337`——排队态刷新，ACP 回合内并发 spawn 即达）与
  `cancelled`（`thincoder-core/agent-tools/subagent-async.mjs:262`——取消路径，ACP 面无取消入口时不可达，登记为同族风险）
  ⇒ 二者随 `agent_message_chunk` 进 ACP 客户端**可见面**（token 字面量泄漏：`⟦ev⟧queued\x1eslot\x1e…`）。
- **修法（形态取代枚举）**：`if (/^⟦ev⟧[a-z]+\x1e/.test(payload)) return`——事件名域 = ASCII 小写 + 终止符 `\x1e`；**枚举退役**（新增事件名零维护）。
- **形态依据（既有先例，非新造 · 评审 #8 收正）**：VSC 宿主面消费单点 `thincoder-vscode/src/extension/panel-callbacks.mjs:44`（`includes("⟦ev⟧")` 识别）+
  `:85`（`startsWith("⟦ev⟧")` **兜底消费**——注释原文「其余核事件：消费不泄漏」）即形态判据；核生成侧（`thincoder-core/agent/spawn-child.mjs:99-101` `EVENT_PHASE` / `EVENT_TYPE`）系**枚举**放行判据——**不引为形态先例**（枚举面 = D13 所否同形；**不在本批修法范围**）。
  ⇒ 本修法 = ACP 面与 VSC 面既有**形态判据**对齐，不是新语义。
- **面覆盖注（评审 #2）**：事件 token 生成侧发射**全走 `callbacks.onToken`**（逐点实核：`thincoder-core/agent.mjs:208` · `dispatch.mjs:296` · `subagent-scheduler.mjs:337` · `subagent-async.mjs:262` · `async-settle.mjs:228/:262/:264` · `subagent.mjs:359` · `subagent-run.mjs:143` ·
  `thincoder-core/agent-tools/subagent-panel.mjs:98` · `consult.mjs:249` · `spawn-child.mjs:162`）；
  `onReasoning`（`bridge.mjs:188-194`——只剥 relay 前缀；事件 token 不经此面）与 `agent_thought_chunk` / 工具卡 `title` / `request_permission` 文本面**不产** `⟦ev⟧` ⇒ 其余面残余向量 = **模型伪造**（非事件泄漏）——**接受**该边界（伪造面按核生成侧 strip 判据另行处置，不在本批）。
- **CLI 侧已有形态判据先例（非缺陷——同一判据家族已在位）**：`thincoder-cli/src/tui/render.mjs:245-256` 已是形态剥（结构化 `/⟦ev⟧[^\x1e…]*\x1e…/` + 末行 `/⟦ev⟧[A-Za-z]*/` 兜底）——**其注释记载了必须避开的否决形态**：`/⟦ev⟧[^\x1e\x1d]*/`（吞到行尾）**吃过真实正文**（`render.mjs:250-252` 注：正文里描述桥剥离行为的表格被一并吃掉）⇒ 本批修法**保留终止符约束**（`\x1e` 同现才剥），**不得**放宽为无终止符形态。
- **另一消费点已自洽（非缺陷——登记为观察项）**：`thincoder-cli/src/tui/subagent-blocks.mjs:46` 的 `SUB_EVENT_RE` 枚举（含 `queued`、**不含** `cancelled`）之外另有 `:172` 显式 `cancelled` 分支 + `:187` `startsWith("⟦ev⟧")` 兜底 ⇒ 无泄漏面，本批**不改**。
- **嵌套形态顺序不变**：relay 前缀由桥先剥（本节表①「信号检查改在 payload 上」）；前缀后 token 落 payload 首 ⇒ 同一判据命中。
- **负向边界（防过剥）**：正文含 `⟦ev⟧` 而无 `\x1e` 终止符 ⇒ **仍转发**（判据要求终止符同现）；`[a-z]+` 不吃其它 `⟦…⟧` token 形态。
- **测试面**：宿主 `thincoder-cli/test/acp-channel.test.mjs`（T9 信号 token 带前缀 → 零通知）——增 `queued` / `cancelled` 两相 + 无终止符负例（正文含哨兵仍须转发）。
- **受影响文件与验收（回指）**：本批受影响文件（当前行数 / 增量）= 批次档 `docs/batches/2026-09-15-core-defect-fixes.md` §四；验收 = 同档 §五 V4（可机器验证）。

### 7.3 能力缺口：`onToolOutput` 明示缺

ACP 不转发工具输出流式增量——**父工具与子代理工具同口径**；工具卡承载参数（`rawInput` / content）与最终结果（`tool_call_update`）。
理由：① 最终结果已送达；② 流式需累积态 + REPLACE 语义重发 + 节流 + 子代理无 toolId 的配对回退——自有设计面；
③ 现状即无（零回归）。裁剪权威 = 需求档；机制详述 = 本节（不新建档——一板块一档）。

## 8. 安全语义

- **副作用工具默认 deny**：`request_permission` 必现（AUTO 关闭）；反向 RPC 传输失败 → 拒绝（安全优先）。
- **工具边界**：仍受 cwd 约束（既有 confine 逻辑不变）。
- **写路径走 IDE buffer**：IDE 的 diff 审查是比 CLI diff 预览更强的保障。
- **日志隔离**：stdout 纯净 JSON，stderr 承载日志——防协议污染。

## 9. 关键决策记录

| # | 决策 | 理由 / 否决备选 |
|---|---|---|
| D1 | 自写 NDJSON JSON-RPC 层 | 零依赖是项目宪法；SDK 依赖破坏 npm 安装的零依赖承诺 |
| D2 | fs 反向 RPC（含 write 类） | 「编辑器接线」是 ACP 核心体验——diff 就地显示是用户感知最强的点 |
| D3 | edit 桥判定委派本地 `computeEditEntry` | 双通道同语义（错误文本与本地逐字一致）；单一权威防漂移 |
| D4 | 权限默认 deny + AUTO 关闭 | 安全第一；ACP 会话在 IDE 内，审批弹窗成本低 |
| D5 | 复用终端鉴权 | 登录一次多表面 |
| D6 | 工具 id 按会话唯一 + FIFO 配对 | 模型级 id 跨轮不唯一；精确配对防 `tool_call_update` 错配 |
| D7 | 每回合末存档 | list / load / resume 需真实数据源；finally 语义不丢回合 |
| D8 | question 剔除点 = 装配期参数 | 模型不可见 = schema 直接少一条；通道知识住 `acp.mjs`；否决事后变异 / bridge 层过滤（无装配权） |
| D9 | 前缀语义 = 剥离转发 | 修「泄漏」本义；载荷今日已进流——去前缀即最小变化。否决整体过滤（语义大改——登记为后续候选） |
| D10 | 配对键保持原样（剥离仅显示面） | 同名不同子代理不得错配 |
| D11 | 文法 = `thincoder-core/agent/relay-prefix.mjs`（生成侧再导出） | 单一权威（TUI / ACP 同源，防再漂移）；零依赖无环。否决留在 TUI（层级倒挂）/ 正则复制进 bridge（复制即新漂移源） |
| D12 | `onToolOutput` = 明示缺 | 最终结果已送达；流式面自有设计面（累积 / 节流 / 配对回退），超本板块范围 |
| D13 | ⟦ev⟧ token 剥离 = **形态判据**（`⟦ev⟧[a-z]+` + 终止符 `\x1e`） | 枚举白名单是**漏项发生器**（`queued` / `cancelled` 已在发射而旧白名单六名未跟 ⇒ 随 `agent_message_chunk` 泄漏）；形态判据与事件名域解耦。否决「补两个名字」（下一次新增再漏——根因不除）、否决「剥所有 `⟦…⟧` 前缀」（含非事件 token 的面，过剥风险大） |
| D14 | onWait 三消费点（TUI / headless / ACP 日志）= **调用核单源映射** | 相位值域（五相：`gate` / `retry` / `overloaded` 带秒 · `warn` / `quota` 带 message）无单源 ⇒ 三处各自 `else` 兜底，`warn` / `quota` 渲染 `undefined`。否决「三处各自补两支」（漂移根因不除）、否决「CLI 侧建 i18n 层」（新范围）。映射表与判据见 `docs/core/design/PROVIDER.md` §6.20 |
| D15 | **认证门 = 凭据即时判据**（撤 `authenticated` 闩锁） | 契约上 `authenticate` 是**可选**流程（`NewSessionRequest` 逐字：「**May** return an `auth_required` error … **if** the agent requires authentication」）⇒ 闩锁使「不调 `authenticate` 的客户端」会话一律起不来（编排器常见姿势——本批核心缺陷）。否决「保留闩锁 + 在 `initialize` 里置真」（= 永不返回 `-32000`，把契约门变成装饰） |
| D16 | `authMethods` = **对象数组 + `clientCapabilities.auth.terminal` 门控** | schema `AuthMethodTerminal` 逐字：「Agents **MUST** advertise this method **only when the client enabled its terminal authentication capability**」+ 必填 `id`/`name`；裸字符串 `"terminal"` 既不匹配 `anyOf` 任一分支也无 `id`。否决 `_meta['terminal-auth']` legacy 兜底（v1 已把 `terminal` 升为一等 `type`；legacy 面需 agent 侧给 `command` 绝对路径，我们拿不到可靠值——kimi `auth-methods.ts:48-63` 属旧 SDK 过渡面） |
| D17 | 凭据面**收回文档声称**：本批**不实现** env fallback | 项目现行裁定 = 「env vars are not a key source」（`DOC-CODE-RECONCILE` A6 · 2026-09-15「实装为准改文档」），四处逐字在位（`model-picker.mjs:37` · `presets.mjs:30/64/94` · `embed-config.mjs:5` · `subagent-async.mjs:137`）；仅在 ACP 面实现 = 同一产品两套凭据语义（把一处漂移换成更深的语义分裂）。且无 TTY 的真实阻塞是 D15 与 `defaultModel` 弱文案，不是 key 来源少一条。env 通道属 CONFIG / PROVIDER 板块（§11.9 登记） |
| D18 | **契约形状以 schema 逐字段为准**，不以「某客户端能跑就行」为准 | 本批实核出四处响应形状不合契约（§11.3 G2 族）：`agentCapabilities` 键名 · `session/new` 必填 `sessionId` · `session/prompt` 必填 `params.prompt` · `session/list` 条目 `sessionId`（另 `configOptions[]` 的 `id`/`name`）。否决「只修原 G2 的 `initialize`」——另三处使「可挂可用」不可达 |
| D19 | fs 反向 RPC **按客户端能力位门控**，未宣告 ⇒ 回落本地 | schema `FileSystemCapabilities` 默认 `false` + 文档「MUST treat all capabilities omitted … as UNSUPPORTED」；现状无条件发 `fs/*` ⇒ 不支持者干等 30s（`bridge.mjs:106/114/291`）。判据同构 = kimi `server.ts:626-636`（皆否 ⇒ 回落 `LocalKaos`）；能力位来源 = §3.4 快照（“initialize 单次交换”语义） |

**登记项（后续批 / 父侧裁）**

1. **`thincoder chat` 同缺陷**：`bin/thincoder.mjs` 的 `assembleAgent()` 未传剔除 → question 仍在工具集、每调必错；
   同款一行修复 = 传 `{ excludeTools: ["question"] }`（复用 `applyToolExclusions`）。
2. **子代理 children 同缺陷**：`thincoder-core/agent-tools/subagent-spawn.mjs` 的 `childOpts` 无 `onQuestion`
   （也不宜有——子代理无对话面，澄清走报告回父）→ question 在 children 工具集内每调必错；建议 spawn 侧做工具剔除。
3. **子代理事件整体过滤**（§7.2 备选）——显示语义候选，需用户裁定。
4. **`onToolOutput` 流式补齐**（§7.3）——独立设计候选。

## 10. 不并项与历史沿革

### 10.1 历史沿革（(d) 类——**不并**）

> 来源档 `thincoder-cli/docs/design/ACP-CLIENT.md`——**原地保留作参照历史**（保留 ≠ 维护）。下列内容不并入本档：

| 旧档位置 | 内容 | 何故不并 |
|---|---|---|
| 旧档 §12.2 方案选型对比（① 剔除点 / ② 前缀语义 / ③ onToolOutput 三族候选表） | 一次性选型材料 | 选定结论已入 §7.1 / §7.2 / §7.3 与 D8–D12；被否决候选理由不入活档 |
| 旧档 §12.5 受影响文件全清单 +「父侧排程的文档联动面」表 | as-of 行数与增量快照 | 时点快照（实装后已漂移） |
| 旧档 §12.7 用例表（T1–T18）· §12.8 验收标准（AC1–AC8） | 批次验收材料 | 验收已完成——不变量已入 §7；用例宿主 = `thincoder-cli/test/acp-channel.test.mjs` |
| 旧档 §12.4 关键决策记录（第 27 批 D1–D7） | 批次编号决策表 | 结论已并入 §9（本档决策表）；批次编号为一次性材料 |
| 旧档 §8 测试策略场景名册 · §12.10 纪律核对（写权 / 冻结窗口 / 计数） | 批次执行纪律 | 一次性材料（纪律归 `docs/core/design/DOC-DISCIPLINE.md`） |
| 旧档 §变更记录（2026-08-04 立项 / 2026-08 下旬 M1·M2 / 08-31~09-01 会诊批 / 09-05 CLI parity / 09-07 重写 / 09-11 第 27 批） | 逐批流水 | 历史叙述——本档自有变更记录 |
| 旧档档头「权威源（CLI）：…」行 | 迁移前列 6 个 `src/**` 路径 | 迁移前仓形态——本档各节按现状路径落 |

### 10.2 不并项登记（跨板块 / 一次性材料——**不并**，逐项登记）

| 旧档面 | 内容 | 何故不并（去向 / 触发） |
|---|---|---|
| 需求层条目 | §1 定位 / §9 非功能 / §12 不做项 / §13 通道修整 | 需求面——`docs/cli/requirements/ACP-CLIENT.md`（本档只留设计层） |
| relay 前缀文法的**生成侧**机制 | 子代理 spawn / relay 包装 / 子块路由 | `docs/core/design/AGENT-LOOP.md`（子代理工具族）+ `docs/cli/design/TUI.md` §6——本档只留 ACP 消费面 |
| 会话存档格式与槽位写序 | 双线历史 / 槽文件 / 写时保现场 | `docs/core/design/SESSION.md`——本档只留 ACP 侧语义 |
| VSC 端 | 无 ACP 实现（VSC question 工具有原生 UI 兜底 → 无「必错」缺陷） | 登记「无镜像面」；VSC 轮 |

## 11. 外部编排器接入（契约合规面 · 2026-09-18 批）

**目标**：让本面**对任何 ACP 兼容编排器（Paseo / cc-connect 类）可挂可用**。
**判据**：**契约合规**（逐条回指上游 schema v1 原文），**不是**迎合某客户端；**无 TTY 环境可驱动**为硬指标之一。

> 本批**受影响文件表 / AC 与用例表** = 批次档 `docs/batches/2026-09-18-acp-external-drivers.md` §2
> （一次性材料不入本档——机制 / 判据 / 不变量单源留本档，纪律见 `docs/core/design/DOC-DISCIPLINE.md` §1 D2「单一权威源」；同 §7.2 末行先例）。本节只留**机制、判据与不变量**。
> **现状坐标 as-of 2026-09-18（拆分前单体）**：本节各表的「现状」列 = 拆分前单体 `thincoder-cli/src/acp.mjs`（493 行）的行号；
> 本批落 **§3.5 的模块划分**后，同一 handler 迁入新模块 ⇒ **按方法名定位，行号不再适用**（评审 #11 收正项）。

### 11.1 规范依据（本批锁死 · 一手 → 二手 → 交叉印证）

| 层 | 来源 | 取用与置信 |
|---|---|---|
| **一手（主据）** | 上游仓 `agent-client-protocol`（`agentclientprotocol` 组织）· `main` 分支 · `schema/v1` 目录的 v1 schema | 经 `gh-proxy.com` 镜像取 `raw.githubusercontent.com`；**实取 as-of 2026-09-18**（170 个 `$defs` · 46 条带 `x-method` 的 def，请求/响应各计） |
| **二手（语义解释）** | `agentclientprotocol.com/protocol/{initialization,authentication}`（v1） | 版本协商规则 / 能力缺省语义 / terminal 认证流程的**规范性表述**（逐字引用见 §11.2–§11.4） |
| **交叉印证（四份本地实现）** | `kimi-code/packages/acp-adapter/src/**` · `oh-my-pi/packages/coding-agent/src/modes/acp/**` · `MiMo-Code/packages/opencode/src/acp/agent.ts` · `openclaw/src/acp/**` | 只用于**印证**上游结论与取「同构判据」，不用于**定形**（形态一律以 schema 为准） |

**置信边界（明写）**：schema 取自 `main` 分支、**非 tag 冻结** ⇒ 本节字段结论以该 as-of 为限。
文档逐字：「This version is only incremented when breaking changes are introduced」+ 新能力一律经 capabilities 引入（非破坏性）
⇒ **字段名与判别键在实施窗口内稳定**（低风险）。
id=63 盘点期「三份参考实现一致」的推断证据，本批**已升级**为「上游原文 + 官方文档 + 四份实现」三方一致处才作定形依据。

**实物留档（评审 #4 修正）**：一手 schema **不落本档**（一次性材料——D2）——**SHA256 + 相关 `$def` 摘录 + 可取回命令**留档于
批次档 `docs/batches/2026-09-18-acp-external-drivers.md` §2.8；复核方式 = 按该处命令复取 → `sha256` **逐字比对**（as-of 2026-09-18）
⇒ 字段级结论（`required` 列表 / MUST 条文）事后可复核，不再依赖一次性的镜像取用。

### 11.2 G1 · 登录可被外部驱动（认证门不再是死锁）

**契约条文（逐字）**

- `AuthMethodTerminal`：「Agents **MUST** advertise this method **only when the client enabled its terminal authentication capability**. … The client **MUST NOT** pass this method to `authenticate`.」
- `AuthCapabilities.terminal`：「The client should set this to `true` only when it can reproduce the configured agent invocation in an interactive terminal. When `true`, the agent **may** include `terminal` entries in its authentication methods.」
- `AuthMethod` 判别：`type:"terminal"` → `AuthMethodTerminal`（required `id` + `name`）；**无 `type`** → `AuthMethodAgent`（同 required）——两者皆要求 `id` 与 `name`。
- `AuthMethodTerminal.args`：「Additional arguments to **append to the configured agent invocation** for terminal auth.」；`env`：「… override same-named variables in the base launch configuration.」
- **退出状态语义（评审 #5 收正：两处上游文本，非同一条）**：
  ① `AuthMethodTerminal.description` 逐字：「A zero exit status signals success; any other termination signals failure.」——**AC8 回指本串（schema def）**；
  ② 文档（Authentication · Terminal authentication 节）逐字：「Exit status zero signals success; a non-zero status, termination without an exit status, or cancellation signals failure.」
  ② 另含流程说明「The descriptor **cannot** provide a command.」（两串均已逐字核对，各自锚不混用）。

**现状 vs 契约**

| # | 现状（file:line） | 契约要求 | 后果 |
|---|---|---|---|
| G1-a | `acp.mjs:140` `authMethods: ["terminal"]` **裸字符串**（`:141` = §11.3 所引的 `capabilities` 行——**行号收正 · 评审 #11**） | `AuthMethod` 对象（required `id` + `name`） | 不匹配 `anyOf` 任一分支 ⇒ 客户端**无法呈现**任何登录方式 |
| G1-b | 同上：**无条件**宣告 `terminal` | 仅当 `clientCapabilities.auth.terminal === true` 才可宣告（MUST） | 违反 MUST（对不支持者宣告） |
| G1-c | `acp.mjs:112` `authenticated` **闩锁**（初值 `false`；唯一置真路径 **`:146`**——行号收正 · 评审 #11） | schema `session/new` 方法描述逐字：「May return an `auth_required` error if the agent requires authentication.」；schema `authenticate` 方法描述：「Called when the agent requires authentication before allowing session creation.」（**锚收正**——原文住方法描述，非 `*Request` def） | **不调 `authenticate` 的客户端（编排器常见姿势）会话一律起不来**——本批核心缺陷 |
| G1-d | `bin/thincoder.mjs:402-406` `case "acp"` **不读 `args`**；全量 switch（`:143-432`）**无 `login`** | `args` 语义 = 追加到已配置的 agent 调用 | `thincoder acp --login` **静默进服务模式**（stdin 无 TTY ⇒ 挂死等 `initialize`）——宣告出去也**无处执行** |

**改法（四条，最小面）**

1. **认证门 = 凭据状态即时判据**（撤闩锁）：受门 handler 首行 `if (!authenticated)` → `if (!isConfigured())`（沿用同一注入口，测试面零改）。
   ⇒ 凭据在位时 `initialize → session/new → session/prompt` **零交互**全程可走；凭据缺失时仍返 `-32000`（契约允许，且文案可行动——§11.5）。
2. **`authMethods` 对象化 + 客户端能力门控**（§3.4 快照消费）：
   仅当 `clientCaps.auth?.terminal === true` 时宣告
   `[{ id: "terminal", type: "terminal", name: "…", description: "…", args: ["--login"] }]`；否则 `[]`。
   - `args:["--login"]` ⇒ 客户端实际拉起 **`thincoder acp --login`**（追加语义，非替换）。
   - **不做 `command`**：schema 逐字「The descriptor **cannot** provide a command」——`command` 由客户端配置派生（否决 `_meta['terminal-auth']`：见 D16）。
3. **`authenticate` 语义收敛**：`methodId` 不属于**当前已宣告**的方法 → `-32602`（判据同构 = kimi `server.ts:656-661`）；凭据不可解析 → `-32000`；通过 → **空结果 `{}`**（`AuthenticateResponse` 只有 `_meta`，现返回的 `{authenticated:true}` 是多余额外键）。
4. **CLI 侧入口**：`case "acp"` 读 `args`；`--login` → `runAcpLogin()`（住 `acp/login` 新档，经 `src/acp.mjs` 再导出——§3.5），**不进 stdio 服务**。
   流程 = 复用既有 `setupWizard()`（`src/cli/setup-wizard.mjs`；与 `bin/thincoder.mjs:172` 同源）→ 成功后**校验并补齐 `defaultModel`**（§11.5 判据）→ **exit 0**；失败（含非 TTY）→ stderr 一行可行动文案 + **exit 1**（契约：「A zero exit status signals success; any other termination signals failure.」）。
   **用户面（评审 #10 收正）**：`bin/thincoder.mjs` 的 `USAGE`（`:101`–`:124`）在 `thincoder acp` 行后**补一行**（逐字，与上行左对齐）：

   ```text
     thincoder acp --login     Authenticate this machine for ACP clients (terminal auth flow), then exit
   ```

   **非 TTY 判据**：`--login` 需交互终端 ⇒ 非 TTY **显式报错退出**（不静默挂死）；而**无 TTY 编排器根本不需要走 `--login`**——见 §11.7 判据②。

**与 `authenticate` 门的关系（一句话）**：`authenticate` 由「开会话的**前置闸门**」降为「凭据就位后的**确认动作**」——客户端**可以**调（返回 `{}`）、**不调也能开会话**；真正的闸门只有一个 = **凭据可解析与否**（每次调用即时求值，无跨调用状态）。

### 11.3 G2 · `initialize` 与会话方法的响应形状（G2 族）

**契约（schema 逐字段）**

- `InitializeResponse` properties = `protocolVersion` / `agentCapabilities` / `authMethods` / `agentInfo` / `_meta`——**没有 `capabilities` 这个键**。
- `AgentCapabilities` = `loadSession`（bool，默认 `false`）/ `promptCapabilities` / `mcpCapabilities` / `sessionCapabilities`（默认 `{}`）/ `auth`。
- `SessionCapabilities` 成员 = `list` / `delete` / `additionalDirectories` / `resume` / `close`；各以 **`{}`** 表示支持、省略或 `null` 表示不支持。
- 版本协商（文档逐字）：「If the Agent supports the requested version, it **MUST** respond with the same version. Otherwise, the Agent **MUST** respond with the latest version it supports.」
- 能力缺省（文档逐字）：「Clients and Agents **MUST** treat all capabilities omitted in the initialize request as **UNSUPPORTED**.」
- `NewSessionResponse.required = ["sessionId"]`；`PromptRequest.required = ["sessionId","prompt"]`（`prompt` = `ContentBlock[]`）；
  list 条目 `SessionInfo.required = ["sessionId","cwd"]`；`SessionConfigOption.required = ["id","name"]`。

**现状 vs 契约（八项，逐项实核）**

| # | 现状（file:line） | 契约要求 | 后果 |
|---|---|---|---|
| G2-1 | `acp.mjs:141` 返回键 `capabilities` | `agentCapabilities` | 客户端读不到 agent 能力 ⇒ 全部按 UNSUPPORTED |
| G2-2 | 同上：无 `loadSession` | `AgentCapabilities.loadSession` | 已实现的 `session/load` **客户端永不调用** |
| G2-3 | 同上：无 `sessionCapabilities` | `{ list:{}, resume:{}, delete:{}, close:{} }` | `list` / `resume` / `delete` / `close` **客户端永不调用** |
| G2-4 | `acp.mjs:137` `initialize: ()` **不读 params** | `InitializeRequest.required=["protocolVersion"]`；`clientCapabilities` 是**唯一**能力来源 | 无版本协商；且是 G1-b / G3 的**共同根因**（无能力快照） |
| **G2-5** 🔴 | `acp.mjs:184` 返回 `{ id, configOptions }` | `NewSessionResponse.required=["sessionId"]` | **客户端拿不到会话 id ⇒ 后续方法全部不可用** |
| **G2-6** 🔴 | `acp.mjs:194-195` 读 `params.content` | `PromptRequest.required=["sessionId","prompt"]` | **每个 prompt 都走 `-32602` ⇒ 会话不可用** |
| G2-7 | `acp.mjs:234-240` list 条目键 `id` | `SessionInfo.required=["sessionId","cwd"]` | 列表项被判非法/跳过 |
| G2-8 | `acp.mjs:184/297/346` `configOptions:[{configId}]` | `SessionConfigOption.required=["id","name"]`（注：**请求**侧 `SetSessionConfigOptionRequest` 用 `configId`，**响应**侧用 `id`——不对称属契约本身） | 配置项被 `x-deserialize-skip-invalid-items` 静默跳过 ⇒ 能力不可见 |

> **G2-5 / G2-6 是「可挂可用」的硬阻塞**，与原 G2（G2-1/2/3/4 = `initialize` 面）**同族同修**——详见 D18。
> `session/load` / `session/resume` 响应 `required = []`（只含 `modes` / `configOptions`）⇒ 两处返 `{id,…}` 属**多余键**，不阻塞，但同批收敛为契约形态。

**改法**：`initialize: (params) => …` → ① 读 `params.protocolVersion` 走**单版本协商函数**（`SUPPORTED = {1}`：客户端 ≥1 → 回 1；客户端 <1 → 回「最新支持」= 1；判据同构 = kimi `version.ts:38-50`）；
② 落**客户端能力快照**（§3.4）；③ 返回契约形状：

```json
{ "protocolVersion": 1,
  "agentCapabilities": { "loadSession": true,
    "promptCapabilities": { "image": false, "audio": false, "embeddedContext": false },
    "sessionCapabilities": { "list": {}, "resume": {}, "delete": {}, "close": {} } },
  "authMethods": [ /* §11.2 门控结果 */ ],
  "agentInfo": { "name": "thincoder", "version": "<package.json version>" } }
```

- `promptCapabilities` 全 `false` = **如实声明**（本面不接 image / audio / embeddedContext——与 §7.1 的通道裁剪同源）；**不虚报**。
- `mcpCapabilities` **省略** = 不支持（G7 不在本批，如实声明）；`sessionCapabilities.additionalDirectories` 不声明（G4 单 cwd 模型，做不了就不说）。
- 会话方法响应统一契约形状：`session/new` → `{ sessionId, configOptions }`；`session/load` / `resume` → `{ configOptions }`；`session/list` 条目 → `{ sessionId, cwd, … }`；`configOptions` 条目 → `{ id, name }`（`name` 取值 = 人类可读标签）。

**id 命名空间边界（本批只改字段名、不改语义 · 评审 #7 收正）**：`session/list` 条目 `sessionId` 的**取值**仍是**持久化槽位号**（`acp.mjs:235` `String(s.slot)`）；`session/load` / `resume` / `delete` 也按槽位号解析（`Number(params.sessionId)`）。
而 `session/prompt` / `cancel` / `close` / `set_config_option` / `set_mode` 认的是 **ACP 会话 id**（`nextId++` 分配、`sessions` Map 的键——与槽位号**不同物**，§6.1）。
⇒ **把 `session/list` 的输出直喂 `session/prompt` 仍会 `unknown session`**（原 G5——本批不做，登记保留在 §11.9）。本行 = **边界可见**，不是修法。

### 11.4 G3 · `fs` 反向 RPC 的客户端能力门控

**契约**：`FileSystemCapabilities.{readTextFile,writeTextFile}` 默认 **`false`**；schema 逐字：「Only available if the client advertises the `fs.writeTextFile` capability.」；文档「MUST treat all capabilities omitted … as UNSUPPORTED」。

**现状**：`bridge.mjs:104-118`（`readBuffer` / `writeBuffer`）与 `:285-307`（`toolRouter` 的 write / edit 分支）**无条件**发 `fs/*`；
不回应该面的客户端 ⇒ 每次 `write` / `edit` **干等 30s**（`bridge.mjs:106` · `:114` · `:291` 的 `timeoutMs: 30000`），再走错误分支。

**改法**：能力位（§3.4 快照，`session/new` 时刻取值，会话生命周期内不变）**AND** 工具形态：

- `clientCaps.fs?.writeTextFile !== true` ⇒ write **不路由**（返回 `{handled:false}`）→ 本地写盘（与只读工具同路径）。
- `clientCaps.fs?.readTextFile !== true` ⇒ edit **不路由**（读回是 edit 桥的必要前提）→ 本地 edit（`computeEditEntry` 单一权威不变）。
- 二者皆 `true` ⇒ 现有路径**零改**（支持者行为不变——零回归）。
- **判据同构**：kimi `server.ts:626-636`（`fs?.readTextFile` 与 `fs?.writeTextFile` 皆否 ⇒ 返回 `undefined`，核回落 `LocalKaos`）。

### 11.5 G8 · 凭据面（裁定）

**现状（实核）**：`acp.mjs:70-76` `defaultIsConfigured()` = `loadConfig().provider?.apiKey`；
而 `config.provider`（`thincoder-core/config.mjs:319-322`）= `resolveRuntimeProvider(providers, defaultModel)` ⇒ **强绑 `defaultModel`**：
`providers[].apiKey` 齐全但 `defaultModel` 空/无效 ⇒ `provider = {}` ⇒ 判为「未配置」→ `-32000`（且**无任何文案**指向 `defaultModel`）。

**漂移面（三处，实核 `API_KEY` 全仓命中 = 0）**：本档 **§2.1 `authenticate` 行 · §4 凭据来源段**（两处声称本批已撤——旧写的行号不再适用·评审 #11）· `thincoder-cli/src/acp.mjs:69`（代码注释）· `thincoder-core/config.mjs:11`（代码注释）。

**裁定：收回文档声称——本批不实现 env fallback。** 理由三条：

1. **与既有裁定冲突**：项目**现行**姿势 = 「**env vars are not a key source**」，且它是 2026-09-15 批 `DOC-CODE-RECONCILE`（A6）的**裁定结果**（「实装为准」→ 改文档）。实核四处逐字：
   `thincoder-cli/src/tui/model-picker.mjs:37` · `thincoder-vscode/src/extension/presets.mjs:30,64,94` · `thincoder-vscode/src/embed-config.mjs:5` · `thincoder-core/agent-tools/subagent-async.mjs:137`。
   仅在 ACP 面实现 ⇒ **同一产品两套凭据语义**（TUI 不认、ACP 认）——把一处漂移换成一处更深的语义分裂。
2. **不是本批的瓶颈**：无 TTY 编排器的真实阻塞是 **D15（认证闩锁）** 与**下方 `defaultModel` 弱文案**，不是「key 来源少一条」。二者修完，预置 `~/.thincoder/config.json`（挂卷 / `docker cp`）即可无人值守启动——批档 §1.2 已实核该姿势可行。
3. **射程外**：env fallback 是**跨产品凭据源**变更（`loadConfig()` 被 CLI / VSC / core 三面共用），属 **CONFIG / PROVIDER 板块**，须各自的需求 + 设计轮；不等价于 ACP 面的一条修补。

**同时修（G8 的真实可行动缺陷）**：

- **判据拆分与 ② 的判据·落点（评审 #1 收正 · AC12 的载体）**：`isConfigured()`（布尔注入口，决定放行 / `-32000`）**不动**；**同注入位增设姐妹探针** `providerStatus()`（默认 `defaultProviderStatus`，可注入）→ `{ ok, keyPresent, reason }`：
  - `ok` = `loadConfig().provider?.apiKey?.trim()`（与 `isConfigured()` 同源同式）；
  - `keyPresent` = `loadConfig().providers` 中任一 `apiKey` 在位（**不经** `resolveRuntimeProvider` ⇒ `defaultModel` 不可解析时仍为真——这就是 ① / ② 的分界）；
  - `reason` = `loadConfig().providerInvalidReason`（`config.mjs:319-322` = `defaultModelReason(...)`，`model-ref.mjs:58-66`；`defaultModel` 未设 / 无效时该串**逐字含 `defaultModel`**）——**复用既有单源文案，不新增一条**。
  **落点 = 各受门 handler 共用的门助手**（`requireConfigured()`，住 `handlers-session.mjs` 的 `ctx`；**`session/new` 是门链首个触点**）：
  - `ok === true` ⇒ 放行；
  - `keyPresent === false` ⇒ `-32000`，文案指向 `~/.thincoder/config.json` 的 `providers[].apiKey` **与** `thincoder acp --login`（§11.2-4 的恢复路径）——**不拼 reason**；
  - `keyPresent === true ∧ ok === false` ⇒ `-32000`，文案 = 「凭据在位但会话无法装配：<reason>」+ 改法（`/config → 默认模型` 或 `thincoder acp --login`）——**即 AC12 要的 `defaultModel` 点名**。
  （`authenticate` 失败复用同一文案；错误码恒 `-32000` ⇒ AC6 不变。）
- **`session/new` 的装配后检查（兜底，与门互补）**：门拦的是「key 缺失 / `defaultModel` 不可解析」；装配后检查拦的是**门放行但 provider 仍不可用**的残余（如 `defaultModel` 可解析而 provider 缺 `baseURL`）。
  现状 `defaultCreateSession` → `assembleAgent` 带 `_providerInvalid` **照样建会话**，问题延后到首个 prompt 才以含糊错误爆出。
  改法：装配后**显式检查** `agent._providerInvalid`，真 ⇒ 返回错误（文案 = `agent._providerInvalidReason`——`make-agent.mjs:134-135` 取 `config.providerInvalidReason`；`validateProvider` 兜底「provider 不存在 / model 缺失 / 缺少 baseURL」）而**不建半死会话**。
- **代码注释面收正（逐字目标 · 评审 #2 站点级断言的依据）**：
  - `thincoder-core/config.mjs:11` → ` * API key comes from providers[].apiKey only — environment variables are not a key source.`
  - `thincoder-cli/src/acp.mjs:69` → `/** Config is "configured" when the active provider has a resolvable API key (providers[].apiKey only). */`
  （代码笔 = eng-coder；本档已同步撤除声称。探针默认实现 `defaultIsConfigured` / `defaultProviderStatus` **仍住入口模块 `acp.mjs`**——§3.5）

### 11.6 G10 · 文档面

- **悬空链接（实核）**：`thincoder-cli/README.md:52` 的链接目标已不存在。现状与目标（逐字）：

```text
现状： Setup: [docs/guides/ides.md](docs/guides/ides.md)   ← 目标档 ABSENT（退役副本在 CLI 文档树归档层的 guides 目录下）
目标： Setup: [ACP 接入设计](../docs/cli/design/ACP-CLIENT.md)
```

  **裁定：改指根层活档**（`docs/cli/design/ACP-CLIENT.md`），并在同段补一句登录入口（`thincoder acp --login`）。
  理由：CLI 树归档层是「**保留 ≠ 维护**」的退役层（`docs/README.md` §2）；产品 README（**对外发布面**）不得把用户引进退役层——悬空与指向退役层都不合格，**活档才是唯一正确目标**。
- **根层设计档补「外部编排器接入（含登录）」节** = **本节（§11）**，已落。

### 11.7 不变量（实施后须长期成立）

1. `initialize` 响应**只**含契约字段（`protocolVersion` / `agentCapabilities` / `authMethods` / `agentInfo` / `_meta`），且 `initialize` 是**唯一**能力交换点（§3.4）。
2. **任何** `fs/*` 反向 RPC 发出前必过客户端能力位；未宣告 ⇒ 回落本地（§11.4）。
3. `authMethods` 含 `terminal` 项 **⟺** 客户端 `clientCapabilities.auth.terminal === true`（§11.2）。
4. 凭据门 = **即时判据**（无跨调用闩锁）；`authenticate` 是确认动作，不是前置条件；门失败文案按 `providerStatus()` 的 ① / ② 分流（§11.5——② 必点名 `defaultModel`）。
5. 会话建立响应必含 `sessionId`；prompt 入参取自 `params.prompt`。
6. **无 TTY 可驱动（可机判）**：① 凭据在位时，**从不调 `authenticate`** 的脚本化 stdio 客户端可完成 `initialize → session/new → session/prompt`；
   ② 非 TTY 下 `thincoder acp --login` **不挂死**（快速退出码非 0 + 可读文案）；③ 支持 `auth.terminal` 的客户端可从 `authMethods` 取到 `args:["--login"]` 的完整启动信息。

### 11.8 实施顺序与回归面

- **顺序**：① `initialize`（能力快照 + `agentCapabilities` + `authMethods`）→ ② 会话方法响应形状（G2-5/6/7/8）→ ③ 认证门改造 + `acp --login` → ④ fs 门控 → ⑤ 文档面（§11.6）。
  ①② 必须同批落地：任一单独落地都留下**不可用**中间态（G2-5 无 id / G2-6 无 prompt）。
- **回归面（两档 · 零修改通过）**：
  ① `thincoder-cli/test/acp-channel.test.mjs`（303 行——bridge / 通道用例）：**零修改通过**（本批不动 §7.2 剥离语义与 §5 事件桥）。
  ② `thincoder-cli/test/manifest-flip-refusal.test.mjs`（`:136-184` **直驱** `buildAcpHandlers` 的 `session/load` / `session/resume`——本批改其响应形状者）：**判据 = 形状收敛不破**——该档只断言 `!r.error` / reason 句 / `createSession` 计数，**不作响应键断言**；harness 注入 `isConfigured: () => true` ⇒ 认证门改造后仍放行（评审 #8 收正）。
  ③ **拆分（§3.5）不破两档**：接缝 = `buildAcpHandlers(deps)` 签名与返回形状**不变**（handler 由新模块装配）。
- **机检面**：本批 AC 走 **handler 直调 + 一条脚本化 stdio 冒烟**（不建 G9 的完整端到端网——G9 明说不做）。

### 11.9 边界与登记项

**本批不做（各一句理由）**

| 不做 | 理由 |
|---|---|
| **G4** 单 cwd 模型（`acp.mjs:163-167`） | 多 cwd 需改 agent 的 confine / 核侧工作目录语义——超 ACP 面；本批以「不声明 `additionalDirectories`」**如实**处理 |
| **G5** id 命名空间（`session/list` 返槽位号 vs `prompt/cancel` 认 ACP id） | 本批只统一**字段名**（`id` → `sessionId`），**命名空间语义不动**（槽位 ⇄ 会话 id 映射属会话层数据模型） |
| **G6** `session/prompt` 只取首个 text 块（`acp.mjs:194-195`） | 本批只改**读取位置**（`content` → `prompt`），**取块策略不变**；多块 / image / resource 丢弃照旧 |
| **G7** `mcpServers` 静默忽略（`acp.mjs:168-170`） | 转发面（含能力声明与传输协商）是独立设计面；本批以「不声明 `mcpCapabilities`」如实处理 |
| **G9** ACP 端到端测试网 | 另批建网；本批 AC 用 handler 直调 + 单条 stdio 冒烟覆盖 |
| **env 凭据通道** | CONFIG / PROVIDER 板块（D17 理由 3） |
| **`_meta['terminal-auth']` legacy 兜底** | 旧 SDK 客户端过渡面，非 v1 契约（D16） |
| **VSC 端对位 / cc-connect 侧改动** | 外部工具与我们只保证**契约面正确**（批档 §1.7） |

**登记项（后续批 / 父侧裁）**

1. **env 凭据通道**（`THINCODER_*_API_KEY` 类）——若采纳，须为**产品级凭据语义变更**（CLI / VSC / core 同步），不可只在 ACP 面落。
2. **`_meta['terminal-auth']`**——若实测到仍不认一等 `type:"terminal"` 的在用客户端，再评估。
3. **`session/prompt` 多块内容面**（原 G6）——G2-6 修复后 `session/prompt` **首次真正可用**，多块丢弃的影响面将**首次显现**；建议立批。

## 变更记录

- 2026-09-15（**B 式迁移轮 · 第 6 批**）：建档——`thincoder-cli/docs/design/ACP-CLIENT.md` 内容重建入基准层（旧档一字未改、原地作参照历史）。
  ① 落点 = `docs/cli/design/`（P2：CLI 单端面——VSC 仓无 ACP 实现，结构性不对称）；
  ② 坐标全量改**现状路径**并实核（`thincoder-cli/src/acp.mjs` · `src/acp/{transport,session,bridge}.mjs` · `thincoder-core/agent/relay-prefix.mjs` · `thincoder-cli/src/cli/make-agent.mjs`）；
  ③ **按现状收正两处**：question 可用性行的实际载体 = `thincoder-cli/src/prompt-injections.mjs:35`（旧档 §12.3④ 写「插入 `thincoder-core/tool-docs/question.md`」——
  现行实现经 `{{inject:question-ui-face}}` 锚注入，取值表住 CLI 端）；文法模块落点 = `thincoder-core/agent/relay-prefix.mjs`（旧档 §12.3① 写「`src/agent/relay-prefix.mjs`」——核包重构后已入 `thincoder-core/`）；
  ④ 旧档批次材料（选型表 / 受影响文件 / 用例 / AC / 场景名册 / 纪律核对）入 §10.1；⑤ 试用例编号形态避开悬空锚（本档不引用批次用例号）。
- 2026-09-16（**批 1 CORE-DEFECT-FIXES · eng-designer · 含复审修正轮**）：§7.2 新增 **⟦ev⟧ 事件 token 零进面形态判据块**（通用形态剥离 + 不得放宽为无终止符形态）+ **D13**；体量读数收正 362 → 365。
- 2026-09-18（**ACP 外部编排器兼容批** · eng-designer · 设计轮）：① 新增 **§3.4 客户端能力快照**（§11.2 / §11.4 的共同基座）；
  ② 新增 **§11 外部编排器接入（契约合规面）**——G1 / G2 / G3 / G8 / G10 逐条（改法 / 判据 / 被拒备选）+ 规范依据与置信边界；
  ③ §2.1 / §2.2 / §4 按新机制同步（`initialize` 读 params、`authenticate` 降为确认动作、`authMethods` 对象数组 + 能力位门控、fs 反向 RPC 门控）；
  ④ **撤除全文两处「env fallback」声称**（§2.1 / §4）——实装零实现，裁定见 **D17**（§11.5）；
  ⑤ 新增决策 **D15–D19**；⑥ 体量读数同步。
- 2026-09-18（**ACP 外部编排器兼容批 · 评审修正轮**（评审 #70 · pass · 🔴0 / 🟡4 / 🔵8）· eng-designer）：① **新增 §3.5**（函数档判据驱动的处理器模块划分——`buildAcpHandlers` 368 行越线 ⇒ 当轮拆为四模块 + 入口装配；接缝 `buildAcpHandlers` 契约不变）；
  ② §11.2 收正（`acp.mjs` 行号 `:141`→`:140` · `:111`→`:112` · `:145-147`→`:146`；退出状态语义改「两处上游文本 + 各自锚」（AC8 回指 schema `AuthMethodTerminal`·评审 #5）；`USAGE` 补 `thincoder acp --login` 行的逐字目标·评审 #10）；
  ③ **§11.5 判据拆分重写**（② 的判据 = 姐妹探针 `providerStatus()` → `{ok, keyPresent, reason}`，落点 = 门助手 / `session/new`·评审 #1；注释面两处收正给逐字目标·评审 #2）；
  ④ §11.3 补 **id 命名空间边界**行（list/load/resume/delete 认槽位号；prompt/cancel/close 认会话 id·评审 #7）；⑤ §11.8 回归面补 `manifest-flip-refusal.test.mjs`（形状收敛不破·评审 #8）；
  ⑥ §11.1 补一手 schema **实物留档指针**（SHA256 + `$def` 摘录 = 批次档 §2.8·评审 #4）；⑦ §11 补现状坐标 as-of 注 + §2.1 / §3.3 键名同步（`sessionId` / `{id,name}`）；⑧ §11.7 判据 4 补门文案分流。**逐条落位表 = 批次档 §2.8。**
