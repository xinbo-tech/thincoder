# ACP 客户端协议接入（`thincoder acp`）· CLI 面 · 设计

> 板块 = **ACP 协议**（编辑器接线）——`thincoder acp` 子命令在 stdio 上通过 Agent Client Protocol（schema v1）暴露 agent。
> 配对需求档 = `docs/cli/requirements/ACP-CLIENT.md`。
> 对位档 = **无**（VSC 仓无 ACP 实现——结构性不对称；VSC 有专有扩展面，ACP 是 CLI 侧的编辑器接线通道）。

## 1. 协议基础（ACP schema v1）

- **传输**：NDJSON over stdio（每行一个 JSON，JSON-RPC 2.0）。
- **方向**：IDE = client（发起请求）、agent = server（响应 + 反向 RPC 通知）。
- **版本**：`initialize` 内 `protocolVersion` 协商（当前稳定版本 `1`）。
- **协议权威**：`agentclientprotocol/agent-client-protocol` 仓库 `schema/v1` 的 `schema.json`（方法名 / 事件类型以 schema 为准）。
  注意区分：`@agentclientprotocol/sdk` 的版本号是 **SDK 包版本**、不是协议版本。
- **不做**：unstable 扩展（auth-configuration / buffer sync / inline-edit 预测等）——正常客户端流程不依赖。
- **规范基线（as-of 2026-09-18 · 锁定）**：一手 = 上游仓 `agentclientprotocol/agent-client-protocol`（`main` 分支）`schema/v1` 目录的 v1 schema；二手 = `agentclientprotocol.com/protocol/**`（v1）；交叉印证 = 本地四份参考实现。
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
| `session/new` | ✅ | 接受 `cwd`（**必须等于进程工作目录**——v1 单 cwd 模型，见 §6.1）；忽略 `mcpServers` 并 warn；立即 `newSession` 认领独立槽；返回 `{ sessionId, configOptions }`——`sessionId` = 本进程内该会话的持久槽位号（见 §6.1 / §11.3）、`configOptions` = 全形（§11.3） |
| `session/load` | ✅ | 恢复会话存档，经 `session/update` 重放历史（role → 事件块映射，见 §6.4） |
| `session/resume` | ✅ | 轻量变体（跳过历史重放，仅恢复 cwd + configOptions + 会话上下文） |
| `session/list` | ✅ | 枚举会话存档（槽位数量 unlimited，见 §6.1） |
| `session/delete` | ✅ | 删除会话存档（schema v1 有、参考实现未做——客户端清理会话的必需能力） |
| `session/prompt` | ✅ | 接受 `text` / `resource_link` content 块（引用解析与降级标记见 §11.9）；流式 `agent_message_chunk`；返回 `{ stopReason: "end_turn" }`（取消 → `"cancelled"`） |
| `session/cancel` | ✅ | 中断当前轮（真实 `AbortController`，见 §3.2） |
| `session/set_mode` | ✅ | plan / normal 切换（映射 `planMode`） |
| `session/set_config_option` | ✅ | model / thinking / mode 分发（见 §5.3） |
| `session/close` | ✅ | 返回 `{}` + stderr 日志；先 abort 在飞回合再删除 session |
| `ledger/list` · `ledger/count` · `batch/list` | ✅ | 只读数据接口（扩展拉取面）——台账 / 批次档数据对外只读出口；params / result / 错误面契约 = `docs/cli/design/READ-DATA-INTERFACE.md` §3.3；过凭据门（同四族）；协议版本与 `initialize` 能力面零动（不进能力字段——先例 `checkpoint/*` · `memory/*`） |
| `logout` | ❌ | 无账号体系 |

### 2.2 Client-side reverse-RPC（agent → IDE）

| Method | 做 | 说明 |
|---|---|---|
| `session/update` | ✅ | 事件块见 §5（`agent_message_chunk` / `agent_thought_chunk` / `tool_call` / `tool_call_update` / `usage_update` / `config_option_update` / `current_mode_update` / `session_info_update`（子代理事件承载体——§12）等） |
| `ledger/changed` · `batch/changed` | ✅ | 数据变更通知（观察周期内指纹变——5s 轮询；**信号面**：params 只 `{ cwd }`，数据经拉取方法取）；契约 = `docs/cli/design/READ-DATA-INTERFACE.md` §3.4 |
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

   acp.mjs 的 handler 正文 = 五个模块（划分与判据见 §3.5）：
       acp/client-caps.mjs        initialize / authenticate（版本协商 · 能力快照 · authMethods 构造）
       acp/handlers-session.mjs   session/{new,prompt,cancel,close,set_mode,set_config_option}
       acp/handlers-slots.mjs     session/{list,load,resume,delete}（持久化槽族）
       acp/ext.mjs                checkpoint/* · memory/*
       acp/read-data.mjs          ledger/list · ledger/count · batch/list + ledger/changed · batch/changed（只读数据接口）
       acp/login.mjs              `--login` 终端认证流程（非 stdio 服务模式）
```

ACP 官方 SDK 是 npm 依赖——违反零依赖哲学，故自写精简层。`acp.mjs` 装配 transport / session / bridge 与五个 handler 模块，
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

- `session/list`：`listSlots(cwd)` → `{ sessionId, cwd, updatedAt(ISO 8601), title }`（单 cwd 模型注入 cwd；`messageCount` 非 `SessionInfo` 字段）；`sessionId` 取值 = 持久化槽位号——即**全族统一身份**（§11.3）。
- `session/load` / `session/resume`：`loadSlotFile(cwd, slot)` → `applySession(agent, data)`；
  **槽占用检测** → 空闲认领钉回、占用则 `newSession` **fork 到新槽**（防同槽双写静默互覆盖）。load 后重放历史（§6.4）；resume 不重放。
  **会话 id 沿用客户端传入值**（响应无 `sessionId`——id 不变语义）；同 id 在存 ⇒ 旧实例按 close 同法替换（§11.3）。
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

### 3.5 处理器模块划分（函数档判据驱动）

**判据**：**函数档是第一判据**——文件 ≤800 行而内含 ≥300 行单体函数**仍不合规**
（`docs/core/requirements/METHODOLOGY.md` F3-1「函数 ≥300 必拆」+ `thincoder-core/prompts/advisor-design.md` 第 8 条）。
现状 `buildAcpHandlers`（`acp.mjs:99`–`:466` = **368 行**，含 jsdoc 375 行）越线；既改其大半正文（12 个 handler 中 10 个改形），**当轮拆**——不留给「下次触碰」。

| 模块（无扩展名形态，见下注） | 装什么 | 关键缝 |
|---|---|---|
| `src/acp`（入口） | 常量（`VERSION` / `ACP_EXCLUDED_TOOLS`）· 注入默认（`defaultIsConfigured` / `defaultProviderStatus`）· `defaultCreateSession` · **`buildAcpHandlers` 装配**（合并五族）· `runAcpServer` | `buildAcpHandlers(deps)` 签名不变；返回 `{ handlers, sessions, notifyRef, requestRef, watcher }`（唯一外部契约——`watcher` = 变更观察器出参，`runAcpServer` 启动；既有单元测试档直驱它） |
| `acp/client-caps` | 能力快照（§3.4）· 版本协商 · `authMethods` 构造 · `initialize` / `authenticate` handler | 快照 = 服务器级单例，构造期注入 |
| `acp/handlers-session` | 内存会话族：`session/new` · `prompt` · `cancel` · `close` · `set_mode` · `set_config_option` + `findSession` · `applyConfigOption` + **门助手** | 经 `ctx` 取共享态 |
| `acp/handlers-slots` | 持久化槽族：`session/list` · `load` · `resume` · `delete` + `slotEngineering` / `reattach`（工程模式判据） | 同上 |
| `acp/ext` | `checkpoint/*` · `memory/*` + `ensureAcpMemory`（**纯搬迁**） | 同上 |
| `acp/read-data` | `ledger/list` · `ledger/count` · `batch/list` + 变更观察器（`ledger/changed` / `batch/changed`——5s 指纹轮询 · unref） | 经 `ctx` 取共享态；核模块动态 import（W8 契约②）；契约 = `docs/cli/design/READ-DATA-INTERFACE.md` §2.6 / §3.3 / §3.4 |
| `acp/login` | `runAcpLogin()`（`--login` 流程） | 独立入口，不进 stdio |

> **档名形态注**：上表模块名按**无扩展名**形态书写（`.mjs` 省略）。

**共享态经单一 `ctx` 传入**（不散落成各模块私有闭包）：
`{ getCwd, sessions, notifyRef, requestRef, createSession, requireConfigured, releaseClosedSlot, log }`——
`findSession` / 门助手 / 认领释放单点都由入口建一次、按引用传（**会话 id = 持久槽号**——load/new 同命名空间；`releaseClosedSlot` = 认领释放单点）。

**每模块 ≤500（文件档）· ≤300（函数档）；`acp.mjs` 目标 ≈130 行。** 受影响文件与逐档读数 = 一次性材料，不入本档。

## 4. 鉴权与配置

**凭据来源 = `~/.thincoder/config.json`（单一来源）**。`providers[].apiKey` 是唯一的 key 来源；
**环境变量不是 key 来源**（与 CLI / VSC / core 三面的现行姿势一致——见 §11.5 裁定）。

- **认证门 = 凭据状态即时判据**（**不是**一次性的 authenticate 闩锁）：每个受门 handler 首行求值 `isConfigured()`，真 ⇒ 放行；假 ⇒ `-32000`（`authRequired`）。
- **客户端可以完全不调 `authenticate`**——凭据已在位时 `initialize → session/new → session/prompt` 零交互全程可走
  （契约：schema `session/new` 方法描述逐字「**May** return an `auth_required` error … **if** the agent requires authentication」）。
- `authenticate` = **确认动作**（可选）：校验 `methodId` 属于已宣告方法、校验凭据可解析，通过返回空结果 `{}`；失败返回 `-32000`。
- `initialize.authMethods` = **对象数组**，且仅当 `clientCapabilities.auth.terminal === true` 时含 `terminal` 项（契约 MUST）；否则 `[]`。
- **凭据面文案必须可行动**：无可用 key（「无 provider/key」类）⇒ 指向 `~/.thincoder/config.json` 与登录流程；「持 key ∧ 无有效 `defaultModel`」⇒ 放行（协议面零提示行——**提示通道定形 = 不立**（见 §13））。
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
| `callbacks.onUsage` | `usage_update` `{ used, size }`（used = prompt + completion 之和；size = 上下文窗口——`providerSpec(agent.provider).context`，未知模型 128_000 兜底） |
| 回合结束 | **非通知**——`session/prompt` resolve `{ stopReason: "end_turn" }` |
| `callbacks.onWait` / `onCompress` | 仅 stderr 日志（rate-limit / auto-compacted）——onWait 日志文案取**核内单源映射**（`docs/core/design/PROVIDER.md` §6.20）；`warn` / 未知相位 ⇒ 不打印 |
| 子代理事件 token（relay 前缀 + `⟦ev⟧<名>` 形态——§12） | **剥离照旧 + 结构化增量**：`session_info_update` + `update._meta["thincoder.dev/subagent"]`（`role` / `id` / `state` / `progress?` / `detail?`） |

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
    （同文件去重一次读）→ 调核同一对零 IO 纯函数 `planEditEntries` / `applyPlannedEntries` 出计划并应用
    （帧 = `docs/core/design/EDIT-HELPERS.md` §7.3 的 R1–R4：行号条目按 `startLine` 降序先应用、范围重叠整批拒、
    内容条目随后按数组序累积；桥不另写组循环）→ 全通过后逐文件写回（判失败零写、写失败同本地 edit-batch 原子语义）。
  - 行号锚护栏在桥面同判：判据与拒文取核单源（`docs/core/design/EDIT-HELPERS.md` §7.1 / §7.2），
    `write` / `editSingle` / `editBatch` 三入口在写缓冲成功后各自记账（该档 §7.4）——少接一个入口，
    同一份漂移就成了「本地 write 之后拒、IDE 缓冲 write 之后放」。
  - **结果回显**：逐条回执按条目在 `edits` 数组里的**原始下标**排序——跨文件交错亦然：模型按位置对号，
    顺序一变它会把结果贴到错的那一笔上。两形：替换条目 `OK: edited <path> via IDE (<n> occurrence(s))`
    （含 note 时追加 ` — <note>`）；删行条目 `Deleted <line N|lines N-M> of <path> via IDE`。
    单形态删行不经桥（路由门要求单形态的 `new_string` 是字符串，而删行只在省略它时成立）⇒ 落本地通道；
    单形态经桥的回执恒为确认形，桥面的删行回执只来自 `edits` 数组形态。
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
- **sessionId ↔ 槽位映射**：ACP sessionId = 槽位号字符串（如 `"3"`）；load / resume / delete 按 id 解析槽位。
  `session/new` 的 id = 本轮认领槽号（装配失败 ⇒ 回滚释放，无孤儿槽）；load / resume 的 id 沿用客户端传入原文形态（见 §11.3）。
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
- **过滤实现**：`thincoder-cli/src/cli/make-agent.mjs:21` 导出纯函数 `applyToolExclusions(tools, excludeTools = [])`（按 `name` 过滤），
  施用点 = 核 `toolsFinalize` 缝（挂点 `:39` ∕ 施用 `:101`——位次：工具装配后、`createAgent` 前）——schema 逐请求派生自 `agent.tools`，故工具不可见。
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

**⟦ev⟧ 事件 token 剥离 = 形态判据（需求档 F7 / R-A3）**

- **修法（形态取代枚举）**：命中式 = `^⟦ev⟧[a-z]+\x1e`——事件名域 = ASCII 小写 + 终止符 `\x1e`；**枚举退役**（新增事件名零维护）。判别式**单源** = 核模块 `subagent-event.mjs`（`parseSubagentEvent` 非空 ⇒ 剥；§12.4）。
- **形态依据（既有先例，非新造）**：VSC 宿主面消费单点 `thincoder-vscode/src/extension/panel-callbacks.mjs:44`（`includes("⟦ev⟧")` 识别）+
  `:85`（`startsWith("⟦ev⟧")` **兜底消费**——注释原文「其余核事件：消费不泄漏」）即形态判据；核生成侧（`thincoder-core/agent/spawn-child.mjs:114-115` `EVENT_PHASE` / `EVENT_TYPE`）系**枚举**放行判据——**不引为形态先例**（枚举面 = D13 所否同形；**不在修法范围**）。
  ⇒ 本修法 = ACP 面与 VSC 面既有**形态判据**对齐，不是新语义。
- **面覆盖注**：事件 token 生成侧发射**全走 `callbacks.onToken`**（逐点实核：`thincoder-core/agent.mjs:208` · `dispatch.mjs:296` · `subagent-scheduler.mjs:337` · `subagent-async.mjs:262` · `async-settle.mjs:228/:262/:264` · `subagent.mjs:359` · `subagent-run.mjs:143`
  `thincoder-core/agent-tools/subagent-panel.mjs:98` · `consult.mjs:249` · `spawn-child.mjs:162`）。

`onReasoning`（`bridge.mjs:201-207`——只剥 relay 前缀；事件 token 不经此面）与 `agent_thought_chunk` / 工具卡 `title` / `request_permission` 文本面**不产** `⟦ev⟧` ⇒ 其余面残余向量 = **模型伪造**（非事件泄漏）——**接受**该边界（伪造面按核生成侧 strip 判据另行处置，不在本档）。
- **CLI 侧已有形态判据先例（非缺陷——同一判据家族已在位）**：`thincoder-cli/src/tui/render.mjs:245-256` 已是形态剥（结构化 `/⟦ev⟧[^\x1e…]*\x1e…/` + 末行 `/⟦ev⟧[A-Za-z]*/` 兜底）⇒ 修法**保留终止符约束**（`\x1e` 同现才剥），**不得**放宽为无终止符形态。
- **另一消费点已自洽（非缺陷——登记为观察项）**：`thincoder-cli/src/tui/subagent-blocks.mjs:46` 的 `SUB_EVENT_RE` 枚举（含 `queued`、**不含** `cancelled`）之外另有 `:172` 显式 `cancelled` 分支 + `:187` `startsWith("⟦ev⟧")` 兜底 ⇒ 无泄漏面，**不改**。
- **嵌套形态顺序不变**：relay 前缀由桥先剥（本节表①「信号检查改在 payload 上」）；前缀后 token 落 payload 首 ⇒ 同一判据命中。
- **负向边界（防过剥）**：正文含 `⟦ev⟧` 而无 `\x1e` 终止符 ⇒ **仍转发**（判据要求终止符同现）；`[a-z]+` 不吃其它 `⟦…⟧` token 形态。
- **测试覆盖**：宿主 `thincoder-cli/test/acp-channel.test.mjs`（T9 信号 token 带前缀 → **零可见面文本**（零 `agent_message_chunk`）；结构化增量见 §12）——增 `queued` / `cancelled` 两相 + 无终止符负例（正文含哨兵仍须转发）。
- **受影响文件与验收（回指）**：受影响文件（当前行数 / 增量）= 本档 §3.5；验收 = 可机器验证（V4）。

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

| # | 决策 | 理由 |
|---|---|---|
| D1 | 自写 NDJSON JSON-RPC 层 | 零依赖是项目宪法；SDK 依赖破坏 npm 安装的零依赖承诺 |
| D2 | fs 反向 RPC（含 write 类） | 「编辑器接线」是 ACP 核心体验——diff 就地显示是用户感知最强的点 |
| D3 | edit 桥判定委派本地 `computeEditEntry` | 双通道同语义（错误文本与本地逐字一致）；单一权威防漂移 |
| D4 | 权限默认 deny + AUTO 关闭 | 安全第一；ACP 会话在 IDE 内，审批弹窗成本低 |
| D5 | 复用终端鉴权 | 登录一次多表面 |
| D6 | 工具 id 按会话唯一 + FIFO 配对 | 模型级 id 跨轮不唯一；精确配对防 `tool_call_update` 错配 |
| D7 | 每回合末存档 | list / load / resume 需真实数据源；finally 语义不丢回合 |
| D8 | question 剔除点 = 装配期参数 | 模型不可见 = schema 直接少一条；通道知识住 `acp.mjs` |
| D9 | 前缀语义 = 剥离转发 | 修「泄漏」本义；载荷今日已进流——去前缀即最小变化。 |
| D10 | 配对键保持原样（剥离仅显示面） | 同名不同子代理不得错配 |
| D11 | 文法 = `thincoder-core/agent/relay-prefix.mjs`（生成侧再导出） | 单一权威（TUI / ACP 同源，防再漂移）；零依赖无环。 |
| D12 | `onToolOutput` = 明示缺 | 最终结果已送达；流式面自有设计面（累积 / 节流 / 配对回退），超本板块范围 |
| D13 | ⟦ev⟧ token 剥离 = **形态判据**（`⟦ev⟧[a-z]+` + 终止符 `\x1e`） | 枚举白名单是**漏项发生器**（`queued` / `cancelled` 已在发射而旧白名单六名未跟 ⇒ 随 `agent_message_chunk` 泄漏）；形态判据与事件名域解耦。 |
| D14 | onWait 三消费点（TUI / headless / ACP 日志）= **调用核单源映射** | 相位值域（五相：`gate` / `retry` / `overloaded` 带秒 · `warn` / `quota` 带 message）无单源 ⇒ 三处各自 `else` 兜底，`warn` / `quota` 渲染 `undefined`。映射表与判据见 `docs/core/design/PROVIDER.md` §6.20 |
| D15 | **认证门 = 凭据即时判据**（撤 `authenticated` 闩锁） | 契约上 `authenticate` 是**可选**流程（`NewSessionRequest` 逐字：「**May** return an `auth_required` error … **if** the agent requires authentication」）⇒ 闩锁使「不调 `authenticate` 的客户端」会话一律起不来（编排器常见姿势——核心缺陷）。 |
| D16 | `authMethods` = **对象数组 + `clientCapabilities.auth.terminal` 门控** | schema `AuthMethodTerminal` 逐字：「Agents **MUST** advertise this method **only when the client enabled its terminal authentication capability**」+ 必填 `id`/`name`；裸字符串 `"terminal"` 既不匹配 `anyOf` 任一分支也无 `id`。 |
| D17 | 凭据面**收回文档声称**：**不实现** env fallback | 项目现行裁定 = 「env vars are not a key source」（`DOC-CODE-RECONCILE` A6——「实装为准改文档」），四处逐字在位（`thincoder-cli/src/tui/model-picker.mjs:43` · `thincoder-vscode/src/extension/presets.mjs:31/66/96` · `embed-config.mjs:5` · `thincoder-core/agent-tools/subagent-async.mjs:143`）；仅在 ACP 面实现 = 同一产品两套凭据语义（把一处漂移换成更深的语义分裂）。且无 TTY 的真实阻塞是 D15（认证闩锁），不是 key 来源少一条。env 通道属 CONFIG / PROVIDER 板块（§11.9 登记） |
| D18 | **契约形状以 schema 逐字段为准**，不以「某客户端能跑就行」为准 | 实核出四处响应形状不合契约（§11.3 G2 族）：`agentCapabilities` 键名 · `session/new` 必填 `sessionId` · `session/prompt` 必填 `params.prompt` · `session/list` 条目 `sessionId`（另 `configOptions[]` 的 `id`/`name`）。 |
| D19 | fs 反向 RPC **按客户端能力位门控**，未宣告 ⇒ 回落本地 | schema `FileSystemCapabilities` 默认 `false` + 文档「MUST treat all capabilities omitted … as UNSUPPORTED」；现状无条件发 `fs/*` ⇒ 不支持者干等 30s（`bridge.mjs:106/114/291`）。判据同构 = kimi `server.ts:626-636`（皆否 ⇒ 回落 `LocalKaos`）；能力位来源 = §3.4 快照（“initialize 单次交换”语义） |
| D20 | 结构化子代理事件 = `session/update` → `session_info_update`（全字段可省载体）+ `update._meta["thincoder.dev/subagent"]` | 零契约字段虚构（唯一零必填变体）；`_meta` = schema 预留扩展位（MUST NOT assume——通用客户端忽略即合规）。详见 §12 |
| D21 | 键名 = `thincoder.dev/subagent`（命名空间形） | 承上游 Extensibility 示例 `zed.dev/debugMode`；对外契约防保留键碰撞。§12.1 |
| D22 | `state` = 事件名原文（形态域开集；现发射集 8 名） | 单一来源（token 自身命名）——零第二语义层；枚举化 = 漏项发生器（D13 同源否）。§12.3 |
| D23 | 协议面提示通道 = **不立** | 判由四条（可见通道唯对话文本且语义相抵 ∥ 信息已在 `configOptions` 面 ∥ 已认账非缺陷 ∥ 边际可逆——`_meta` 载体随 D20 在位）。§13 |

**登记项（后续批 / 父侧裁）**

1. **`thincoder chat` 同缺陷**：`bin/thincoder.mjs` 的 `assembleAgent()` 未传剔除 → question 仍在工具集、每调必错；
   同款一行修复 = 传 `{ excludeTools: ["question"] }`（复用 `applyToolExclusions`）。
2. **子代理 children 同缺陷**：`thincoder-core/agent-tools/subagent-spawn.mjs` 的 `childOpts` 无 `onQuestion`
   （也不宜有——子代理无对话面，澄清走报告回父）→ question 在 children 工具集内每调必错；建议 spawn 侧做工具剔除。
3. **子代理事件整体过滤**（§7.2 备选）——显示语义候选，需用户裁定。
4. **`onToolOutput` 流式补齐**（§7.3）——独立设计候选。
5. **子代理事件显示面收敛**（TUI / VSC / 桌面三消费点 → 核文法单源）——§12.6 登记；零触。
6. **事件 token 生成侧构造器化**（约 10 处发射点改用文法单源）——§12.6 登记；零触。
7. **协议面提示通道已定形不立**——重启条件 = 出现协议感知客户端消费者（重启路径见 §13）。

## 11. 外部编排器接入（契约合规面）

**目标**：让本面**对任何 ACP 兼容编排器（Paseo / cc-connect 类）可挂可用**。
**判据**：**契约合规**（逐条回指上游 schema v1 原文），**不是**迎合某客户端；**无 TTY 环境可驱动**为硬指标之一。

> **受影响文件表 / AC 与用例表** = 一次性材料，不入本档
> （机制 / 判据 / 不变量单源留本档，纪律见 `docs/core/design/DOC-DISCIPLINE.md` §1 D2「单一权威源」；同 §7.2 末行先例）。本节只留**机制、判据与不变量**。
> **现状坐标（拆分前单体）**：本节各表的「现状」列 = 拆分前单体 `thincoder-cli/src/acp.mjs` 的行号；
> 落 **§3.5 的模块划分**后，同一 handler 迁入新模块 ⇒ **按方法名定位，行号不再适用**。

### 11.1 规范依据（锁定 · 一手 → 二手 → 交叉印证）

| 层 | 来源 | 取用与置信 |
|---|---|---|
| **一手（主据）** | 上游仓 `agent-client-protocol`（`agentclientprotocol` 组织）· `main` 分支 · `schema/v1` 目录的 v1 schema | 经 `gh-proxy.com` 镜像取 `raw.githubusercontent.com`；**实取 as-of 2026-09-18** |
| **二手（语义解释）** | `agentclientprotocol.com/protocol/{initialization,authentication}`（v1） | 版本协商规则 / 能力缺省语义 / terminal 认证流程的**规范性表述**（逐字引用见 §11.2–§11.4） |
| **交叉印证（四份本地实现）** | `kimi-code/packages/acp-adapter/src/**` · `oh-my-pi/packages/coding-agent/src/modes/acp/**` · `MiMo-Code/packages/opencode/src/acp/agent.ts` · `openclaw/src/acp/**` | 只用于**印证**上游结论与取「同构判据」，不用于**定形**（形态一律以 schema 为准） |

**置信边界（明写）**：schema 取自 `main` 分支、**非 tag 冻结** ⇒ 本节字段结论以该 as-of 为限。
文档逐字：「This version is only incremented when breaking changes are introduced」+ 新能力一律经 capabilities 引入（非破坏性）
⇒ **字段名与判别键在实施窗口内稳定**（低风险）。
定形依据 = 「上游原文 + 官方文档 + 四份实现」三方一致处。

**实物留档**：一手 schema **不落本档**（一次性材料——D2）——**SHA256 + 相关 `$def` 摘录 + 可取回命令**按上游取用命令复取 → `sha256` **逐字比对**
⇒ 字段级结论（`required` 列表 / MUST 条文）事后可复核，不依赖一次性的镜像取用。

### 11.2 G1 · 登录可被外部驱动

**契约条文（逐字）**

- `AuthMethodTerminal`：「Agents **MUST** advertise this method **only when the client enabled its terminal authentication capability**. … The client **MUST NOT** pass this method to `authenticate`.」
- `AuthCapabilities.terminal`：「The client should set this to `true` only when it can reproduce the configured agent invocation in an interactive terminal. When `true`, the agent **may** include `terminal` entries in its authentication methods.」
- `AuthMethod` 判别：`type:"terminal"` → `AuthMethodTerminal`（required `id` + `name`）；**无 `type`** → `AuthMethodAgent`（同 required）——两者皆要求 `id` 与 `name`。
- `AuthMethodTerminal.args`：「Additional arguments to **append to the configured agent invocation** for terminal auth.」；`env`：「… override same-named variables in the base launch configuration.」
- **退出状态语义（两处上游文本，非同一条）**：
  ① `AuthMethodTerminal.description` 逐字：「A zero exit status signals success; any other termination signals failure.」——**AC8 回指本串（schema def）**；

  ② 文档（Authentication · Terminal authentication 节）逐字：「Exit status zero signals success; a non-zero status, termination without an exit status, or cancellation signals failure.」
  ② 另含流程说明「The descriptor **cannot** provide a command.」（两串均已逐字核对，各自锚不混用）。

**与 `authenticate` 门的关系（一句话）**：`authenticate` = 凭据就位后的**确认动作**（客户端**可以**调（返回 `{}`）、**不调也能开会话**）；真正的闸门只有一个 = **凭据可解析与否**（每次调用即时求值，无跨调用状态）。

### 11.3 G2 · `initialize` 与会话方法的响应形状（G2 族）

**契约（schema 逐字段）**

- `InitializeResponse` properties = `protocolVersion` / `agentCapabilities` / `authMethods` / `agentInfo` / `_meta`——**没有 `capabilities` 这个键**。
- `AgentCapabilities` = `loadSession`（bool，默认 `false`）/ `promptCapabilities` / `mcpCapabilities` / `sessionCapabilities`（默认 `{}`）/ `auth`。
- `SessionCapabilities` 成员 = `list` / `delete` / `additionalDirectories` / `resume` / `close`；各以 **`{}`** 表示支持、省略或 `null` 表示不支持。
- 版本协商（文档逐字）：「If the Agent supports the requested version, it **MUST** respond with the same version. Otherwise, the Agent **MUST** respond with the latest version it supports.」
- 能力缺省（文档逐字）：「Clients and Agents **MUST** treat all capabilities omitted in the initialize request as **UNSUPPORTED**.」
- `NewSessionResponse.required = ["sessionId"]`；`PromptRequest.required = ["sessionId","prompt"]`（`prompt` = `ContentBlock[]`）；
  list 条目 `SessionInfo.required = ["sessionId","cwd"]`、`SessionInfo.updatedAt` = ISO 8601 字符串；
  `SessionConfigOption` = required `["id","name"]` + oneOf select/boolean 判别键 `type`（select 另需 `currentValue` + `options[]`；boolean 需 `currentValue`）。

**id 语义（全族单一命名空间）**：`session id` = **持久化槽位号字符串**——`session/new` 返回 = 本轮认领槽号、`session/list` 条目取值 = `String(s.slot)`；`session/load` / `resume` / `delete` 按槽位号解析（`Number(params.sessionId)`）。

`session/prompt` / `cancel` / `close` / `set_config_option` / `set_mode` 认的 id 同源（`sessions` Map 的键）⇒ **`session/list` 输出可直喂全族方法**（不变量：`session/new` 返回 id ∈ 随后 list 集）。

load / resume 的 id = **客户端传入原文形态**（同值读回保续；响应无 `sessionId`——id 不变语义）；同 id 在存 ⇒ 旧实例按 close 同法替换（先 cancel + 出容器 + 认领释放，再做占用检测与装载——拒载路径零副作用）。

**fork 角**：载入遇他进程占用槽 ⇒ 既有 fork 语义（`newSession` 新槽）保持——本次存续期 id 与落盘槽号分离（重载后 list 显示 fork 槽号）。

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

**现状**：`acp.mjs:39-45` `defaultIsConfigured()` = `loadConfig().provider?.apiKey`；
而 `config.provider`（`thincoder-core/config.mjs:332-339`）= 统一解析 `resolveProviderPlan` 产物（核单源——回退序 + 三态，机制见 `docs/core/design/PROVIDER.md` §6.22）：

任一渠道持 key ⇒ 核必选中 ⇒ `provider` 非空 ⇒ 门**放行**（「持 key ∧ 无有效 `defaultModel`」= `fallback` 类——协议面零提示行）；
仅「无 provider/key」（`invalid` 类）⇒ `provider = {}` ⇒ `-32000`。

**同时修（G8 的真实可行动缺陷）**：

- **判据拆分与门失败文案**：`isConfigured()`（布尔注入口，决定放行 / `-32000`）**不动**；**同注入位姐妹探针** `providerStatus()`（默认 `defaultProviderStatus`，可注入）→ `{ ok, keyPresent, reason }`：
  - `ok` = `loadConfig().provider?.apiKey?.trim()`（与 `isConfigured()` 同源同式）；
  - `keyPresent` = `loadConfig().providers` 中任一 `apiKey` 在位；
  - `reason` = `loadConfig().providerInvalidReason`（**name 面**——`thincoder-core/config.mjs:337` 产出：入选渠道具名 ⇒ null ∕ 无入选渠道 ⇒ 非空；`docs/core/design/PROVIDER.md` §6.22）。
  **落点 = 各受门 handler 共用的门助手**（`requireConfigured()`，住 `handlers-session.mjs` 的 `ctx`；**`session/new` 是门链首个触点**）：
  - `ok === true` ⇒ 放行；
  - `keyPresent === false`（=「无 provider/key」类）⇒ `-32000`，文案指向 `~/.thincoder/config.json` 的 `providers[].apiKey` **与** `thincoder acp --login`——**不拼 reason**。
  **核统一解析口径（`docs/core/design/PROVIDER.md` §6.22）**：任一渠道持 key ⇒ 核必选中 ⇒ `ok` 恒真——故「持 key ∧ 无有效 `defaultModel`」（`fallback` 类）**放行**（协议面**零提示行**——提示通道定形 = **不立**（见 §13）），② 分支（`keyPresent === true ∧ ok === false`）**默认接线不可达**。
  （`authenticate` 失败复用同一文案；错误码恒 `-32000` ⇒ AC6 不变。）
- **`session/new` 的装配后检查（兜底，与门互补）**：门拦的是「无 provider/key」（`invalid` 类）；装配后检查拦的是**门放行但 provider 仍不可用**的残余——结构不全（缺 `baseURL` 等——「持 key 但结构不全」归发送 ∕ 装配失败面，`docs/core/design/PROVIDER.md` §6.22）。
  现状 `defaultCreateSession` → `assembleAgent` 带 `_providerInvalid` **照样建会话**，问题延后到首个 prompt 才以含糊错误爆出。

  改法：装配后**显式检查** `agent._providerInvalid`，真 ⇒ 返回错误（文案 = `agent._providerInvalidReason`——核 `thincoder-core/agent/assemble.mjs` `validateProvider(agent, config)` 取 `config?.providerInvalidReason`（兜底三档文案「provider 不存在 / model 缺失 / 缺少 baseURL」））而**不建半死会话**。
- **代码注释面（逐字目标）**：
  - `thincoder-core/config.mjs:11` → ` * API key comes from providers[].apiKey only — environment variables are not a key source.`
  - `thincoder-cli/src/acp.mjs:69` → `/** Config is "configured" when the active provider has a resolvable API key (providers[].apiKey only). */`
  （代码笔 = eng-coder；探针默认实现 `defaultIsConfigured` / `defaultProviderStatus` **仍住入口模块 `acp.mjs`**——§3.5）

### 11.6 G10 · 文档面

- **链接现状**：`thincoder-cli/README.md:60` = 站内指南 `https://thincoder.com/acp.html`（Setup 行）；登录入口句在同段（`:61` = `thincoder acp --login`）。

  **裁定：链接指向用户面活档**——用户面链接 = 站内指南 `https://thincoder.com/acp.html`（悬空 ∥ 指向退役层 ∥ 指向设计档均不合格——用户面链接以用户面活档为准）；登录入口句在同段（`thincoder acp --login`）。
  理由：CLI 树归档层是「**保留 ≠ 维护**」的退役层（`docs/README.md` §2）；产品 README（**对外发布面**）不得把用户引进退役层——悬空与指向退役层都不合格，**用户面活档才是唯一正确目标**。
- **根层设计档「外部编排器接入（含登录）」节** = **本节（§11）**。

### 11.7 不变量（实施后须长期成立）

1. `initialize` 响应**只**含契约字段（`protocolVersion` / `agentCapabilities` / `authMethods` / `agentInfo` / `_meta`），且 `initialize` 是**唯一**能力交换点（§3.4）。
2. **任何** `fs/*` 反向 RPC 发出前必过客户端能力位；未宣告 ⇒ 回落本地（§11.4）。
3. `authMethods` 含 `terminal` 项 **⟺** 客户端 `clientCapabilities.auth.terminal === true`（§11.2）。
4. 凭据门 = **即时判据**（无跨调用闩锁）；`authenticate` 是确认动作，不是前置条件；门失败 = 「无 provider/key」一档（§11.5——文案指向 `providers[].apiKey` 与 `thincoder acp --login`）；「持 key ∧ 无有效 `defaultModel`」⇒ 放行（协议面零提示行——提示通道定形 = 不立（§13））。
5. 会话建立响应必含 `sessionId`；prompt 入参取自 `params.prompt`。
6. **无 TTY 可驱动（可机判）**：① 凭据在位时，**从不调 `authenticate`** 的脚本化 stdio 客户端可完成 `initialize → session/new → session/prompt`；
   ② 非 TTY 下 `thincoder acp --login` **不挂死**（快速退出码非 0 + 可读文案）；③ 支持 `auth.terminal` 的客户端可从 `authMethods` 取到 `args:["--login"]` 的完整启动信息。

### 11.9 边界与登记项

**不做（各一句理由）**

| 不做 | 理由 |
|---|---|
| **G4** 单 cwd 模型（`acp.mjs:163-167`） | 多 cwd 需改 agent 的 confine / 核侧工作目录语义——超 ACP 面；以「不声明 `additionalDirectories`」**如实**处理 |
| **G7** `mcpServers` 静默忽略（`acp.mjs:168-170`） | 转发面（含能力声明与传输协商）是独立设计面；以「不声明 `mcpCapabilities`」如实处理 |
| **G9** ACP 端到端测试网 | 另批建网；AC 用 handler 直调 + 单条 stdio 冒烟覆盖 |
| **env 凭据通道** | CONFIG / PROVIDER 板块（D17 理由 3） |
| **`_meta['terminal-auth']` legacy 兜底** | 旧 SDK 客户端过渡面，非 v1 契约（D16） |
| **VSC 端对位 / cc-connect 侧改动** | 外部工具与我们只保证**契约面正确** |

**登记项（后续批 / 父侧裁）**

1. **env 凭据通道**（`THINCODER_*_API_KEY` 类）——若采纳，须为**产品级凭据语义变更**（CLI / VSC / core 同步），不可只在 ACP 面落。
2. **`_meta['terminal-auth']`**——若实测到仍不认一等 `type:"terminal"` 的在用客户端，再评估。
3. **`session/prompt` 多块内容面**（原 G6 残项）——`resource_link` 已接；余**多块 text 合流**（首块策略残项）待立批。

## 12. 结构化子代理事件（`_meta` 扩展契约）

> **定位**：ACP 契约之外的**扩展契约**——面向 ACP 客户端实现方（客户端活动面板前置件；交付 = 服务端契约 + 本说明）。
> scope 起点 = `docs/cli/design/ACP-PROTOCOL-COMPLIANCE.md` §6（**起点非承诺**——本节定形按点修订并给由）。
> **一句话边界**：协议版本 / `initialize` 形状 / 方法面**零动**（不进能力字段）；对不认本扩展的标准客户端无可动作面（`_meta` 契约逐字「Implementations MUST NOT make assumptions about values at these keys」——忽略即合规）。

### 12.1 通道与承载体（定形）

- **通道** = `session/update` 通知；**承载体** = `session_info_update` 变体（schema 逐字「All fields are optional to support partial updates」——全字段可省 ⇒ **唯一可作纯扩展载波的标准变体**；不虚构任何契约字段）。
- **扩展位** = `update._meta["thincoder.dev/subagent"]`（载体级 `_meta`；schema 逐字「reserved by ACP to allow clients and agents to attach additional metadata」+ `x-deserialize-default-on-error`——严格客户端反序列化安全面）。
- **键名命名空间** = `thincoder.dev/subagent`（承上游 Extensibility 文档示例形 `zed.dev/debugMode`；本键面是对外契约——命名空间防撞、自我标识）。
- **发射规则**（`bridge.mjs` `onToken`）：载荷 = relay 前缀（`parseRelayPath`）之后；命中**事件 token 形态**（`⟦ev⟧<小写名>` + RS 终止符——剥判据单源 = 核模块 `subagent-event.mjs`（§12.4））**且** relay 前缀在场 ⇒ ① 文本面剥离**照旧**（零 `agent_message_chunk`——剥离语义零改）；② **增量**发射一条 `session_info_update`。无前缀形态 ⇒ 仅剥离零发射（防御面；全部发射点实核皆带 relay 前缀）。

### 12.2 通告形状（冻结）

```json
{ "sessionId": "<会话 id>",
  "update": { "sessionUpdate": "session_info_update",
    "_meta": { "thincoder.dev/subagent": {
      "role": "eng-coder", "id": 2, "state": "turn",
      "progress": { "turn": 3, "maxTurns": 100 } } } } }
```

| 字段 | 域 | 来源 |
|---|---|---|
| `role` | string（relay 文法 `[\w-]+`） | relay 前缀**主体段** = 最内段（`explore#1/eng-coder#2/…` ⇒ `eng-coder`） |
| `id` | integer ≥ 0 | 同上（`#` 后数字段） |
| `state` | string（形态域 `[a-z]+`；现发射集 = 8 名，§12.3） | 事件名原文 |
| `progress` | `{turn,maxTurns}` ∥ `{position}` | `turn` / `approval` ⇒ 轮号对；`queued` ⇒ 队列位次 |
| `detail` | string（可截断文本） | `queued` ⇒ 排队原因文（非空时）；`approval` ⇒ 工具名（发射侧已切 40 字符） |

- 字段**无值 ⇒ 键缺席**（非 null 填充）；客户端 **SHOULD 容忍未知 `state`**（形态域开集——新增事件名不破坏本契约）。
- 数值字段解析 = `Number` 转换；非有限值 ⇒ 该键省略（防御；发射侧恒为整数）。

### 12.3 状态族（现发射集 = 8 名）

| state | 语义 | 附带字段 |
|---|---|---|
| `queued` | 排队 spawn 等待中（容量 `slot` ∥ 依赖 `wait` ∥ 依赖取消 `depc`） | `progress.position`；`detail`（原因文） |
| `async` | 异步 spawn 实际启动（池标记） | — |
| `turn` | 子代理回合进展（每回合一条） | `progress.{turn,maxTurns}` |
| `approval` | 子代理等待工具审批 | `progress.{turn,maxTurns}`；`detail`（工具名） |
| `cancelled` | 排队取消（从未启动——出队即终态） | — |
| `stopped` | 运行中取消（冻结语义） | — |
| `settled` | 结算完成（待消化） | — |
| `done` | 完成（归档） | — |

- 生命周期：`queued?` → `async`（异步族）∥ 首个 `turn`（同步族出生可辨）→ `turn`* →（`approval`*）→ `cancelled` ∥ `stopped` ∥ `settled` → `done`。
- **load 重放不产**本通知（历史面无事件 token——本面 = live-only 信号；与显示面三处同判）。
- **逐态字段序 = 发射侧单源；投影以样本锁定**：字段序以各发射点既有构造为准（本契约零改发射侧）；单元测试档 T-862-1…6 逐字钉住「token 字段序 → 输出键」映射（如 `⟦ev⟧turn\x1e3\x1e100\x1ellm\x1e` ⇒ `progress.{turn:3,maxTurns:100}`）。发射侧改字段序 = 契约面变更（回归本节与样本）。

### 12.4 前置件：事件文法机读单源（核侧 · 定形）

- 落点 = `thincoder-core/agent/subagent-event.mjs`（零依赖叶；承 `relay-prefix` / `child-marks` 同族先例）。
- 导出（定形）：`EVENT_SENTINEL` · `parseSubagentEvent(text)` → `{ name, progress?, detail? } | null`（形态判据 = **单源**——唯一表达式住本模块（`^⟦ev⟧[a-z]+\x1e`）；桥剥离式即本判据（`parseSubagentEvent` 非空 ⇒ 剥），防第二套平行文法（§7.2 纪律）；终止符约束 load-bearing——沿 D13 负向边界：正文含 `⟦ev⟧` 无终止符 ⇒ null ⇒ 仍转发）。
- 哨兵单源：`spawn-child.mjs` 的 `EVENT_SENTINEL` 定义位迁入本模块（该档 import + 再导出——既有 import 面零改；先例 = 同档 `child-marks` 再导出手法）。
- 消费方 = `acp/bridge` 一处；显示面三消费点（TUI `routeSubToken` ∥ VSC / 桌面 `relayEventToSubPatch`）**不动**（收敛 = 登记，§12.6）。

### 12.5 用例与验收

- **AC-862-1**：每个带前缀的形态事件 token（8 名语料）⇒ 恰一条 `session_info_update`，且 `_meta["thincoder.dev/subagent"]` = 期望对象；**零** `agent_message_chunk`。
- **AC-862-2**：字段投影逐态正确（turn / approval 轮号对；queued 位次 + 原因文；零字段态 ⇒ 仅 role/id/state；无值键缺席）。
- **AC-862-3**：负向三条——无终止符 `⟦ev⟧` 文本**仍转发**（零结构化）；文本中段 `⟦ev⟧` 仍转发；无前缀形态事件仅剥离零发射。
- **AC-862-4**：既有面零回归——`[model]` 剥离、relay 前缀剥离、内容转发语义零改（回归两例 = 单元测试档 T-862-11/12）。
- **AC-862-5**：单元测试档全绿（先红后绿）+ `node scripts/doc-check.mjs --root .` 复跑 + 语法检查。
- 用例表 = T-862-1…12。

### 12.6 边界与登记（不做）

- 子代理**内容面归属**（内容 chunk 的子代理归属标）不在本档——沿 §7.2 D9 剥离转发（正文原样进主流、不带归属标）；活动面板如需内容归属 ⇒ 另议。
- `[model]` 子代理元数据 token（模型名）**不**结构化（非事件族）——如需（面板显模型）另议。
- 嵌套父链（`inner` 链）不承载——`role` / `id` = 事件主体（最内段）；父链如需另议。
- `queued.kind`（`slot` / `wait` / `depc`）不承载（`detail` 已携原因文）——如需机判档另议。
- 能力通告（`agentCapabilities._meta`）零动（`initialize` 形状边界）；客户端以键在场探测本扩展。
- 显示面三消费点收敛至文法单源（TUI / VSC / 桌面）——**登记**（零触；收敛批另立）。
- 事件 token 生成侧（十余处发射点）改用文法单源构造器——**登记**（零触）。
- **发射判据 = 形态 + relay 前缀**——不区分子代理 LLM 伪造的良构 token（显示面同款暴露既有且已接受；节点级防护不在本档）。

## 13. 协议面提示通道（定形：不立）

**定形 = 不立**：「`fallback` 类放行」之后的协议面零提示行为 = **设计行为**（非缺口）。

**登记去向**：本节（定形在档）；`docs/core/design/PROVIDER.md` §6.22「未决」句 ⇒ 定形句替代（落点 = 实施轮）；`docs/cli/requirements/ACP-CLIENT.md` F8 判定句 **R-A5.12** ∥ **R-A5.11**（= §12 对位）。

## 14. 用户文档面（对外文档 · 清单与同拍义务）

> **定位**：本板块能力面变更 → **用户文档**联动的单源——面清单与同拍义务句住本节；收口执行位 = `docs/core/design/BATCH-RECORD.md` §5.3（槽位「用户文档面同拍」；槽位枚举权威 = `docs/core/design/DOC-DISCIPLINE.md` D7 行）。
> **正文单源判定**：用户指南**正文** = 站仓页 `acp.html`（站内自持——不依赖仓内档路径）；仓内**事实源** = 本档（指南陈述逐句可回指）；
> resource_link 细节（判定树 ∥ 上限 ∥ 降级词表）= `docs/cli/design/ACP-PROTOCOL-COMPLIANCE.md` §2.5（冻结基准）；其余用户面 = 摘要 ∥ 指针 ∥ 提及——只引用不重述（D2）。

**面清单（站仓 = `thincoder.com`）**

| # | 面 | 角色 | 用户可感能力变更时 |
|---|---|---|---|
| 1 | `acp.html`（接入指南——前置 ∥ 能力 ∥ 三宿主 ∥ 会话 ∥ 配置 ∥ 引用 ∥ 排障 ∥ 限制） | **正文单源** | **必更** |
| 2 | `docs.html` §在 IDE 中使用（ACP） | 摘要 + 指针 | 随核对 |
| 3 | `features.html` §Agent Client Protocol（ACP） | 能力摘要 + M1/M2 展望行 | 随核对 |
| 4 | `install.html`（命令行列 ∥ 故障排查指针） | 命令 + 指针 | 随核对 |
| 5 | `about.html`（路线图：ACP M1 ✅ ∥ M2 展望） | 路线图 | 随核对 |
| 6 | `cli.html`（命令表行）· `index.html`（产品位提及） | 命令表 / 提及 | 仅顶层陈述变化时 |
| 7 | `thincoder-cli/README.md` ACP 段（**产品文本面**） | 摘要 + 指南链接 | 随核对 |
| — | `changelog.html` | 发布条目 | **不在本机制**（单源 = `docs/RELEASE.md` §6） |

**同拍义务句**：本板块出现**用户可感**能力变更（新增 ∥ 改变用户可见行为）⇒ 该变更批**收口前**逐面对照上表：
面 1 **必更**、其余面**随核对**；落入 = ① 同批更新（跨仓**站仓轮**——页更新 + 部署；执行与判据 = `docs/RELEASE.md` §5.8）∥ ② **挂账有据**（台账行 + 触发批坐标）；**不得静默跳过**。
无涉面批 ⇒ 收口记一行「用户文档面同拍：无」（执行位 = `docs/core/design/BATCH-RECORD.md` §5.3）。
