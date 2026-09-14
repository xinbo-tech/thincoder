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
- **不做**：unstable 扩展（`elicitation/*` / auth-configuration / buffer sync / inline-edit 预测等）——正常客户端流程不依赖。

**方法清单（schema v1 提取）**

- agent 侧：`authenticate / initialize / logout / session/{new,load,resume,list,delete,prompt,cancel,close,set_mode,set_config_option}`；
- client 侧：`fs/{read,write}_text_file / session/{update,request_permission} / terminal/*`（terminal 为 client → agent 请求，agent 可不实现）。

## 2. 方法覆盖（thincoder 裁剪版）

### 2.1 Agent-side（IDE → agent）

| Method | 做 | 说明 |
|---|---|---|
| `initialize` | ✅ | 版本协商（`protocolVersion` 1）；响应含 `agentInfo` / `authMethods: ["terminal"]` / `capabilities: { fs: { read: true, write: true }, terminal: false }` |
| `authenticate` | ✅ | 校验活动 provider 有可解析 API key（含 env fallback）；未配置 → `authRequired` 错误码 `-32000` |
| `session/new` | ✅ | 接受 `cwd`（**必须等于进程工作目录**——v1 单 cwd 模型，见 §6.1）；忽略 `mcpServers` 并 warn；立即 `newSession` 认领独立槽；返回 `{ id, configOptions: [model, thinking, mode] }` |
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
| `fs/read_text_file` | ✅ | **仅内部用于 edit 桥的读回**（读 IDE buffer 当前内容再算 diff）——独立 `read` 工具保持本地（两者不冲突） |
| `fs/write_text_file` | ✅ | write / edit 的写路径路由到 client（IDE diff 应用） |
| `terminal/*` | ❌ | shell 走本地执行 |

### 2.3 通道裁剪（提问与流式输出）

- **`question` 工具**：ACP 无提问通道、不接通 elicitation ⇒ 会话装配期剔除该工具（模型不可见、不可调用、零必错回合）——机制见 §7.1；裁剪权威 = 需求档。
- **`onToolOutput`（工具输出流式增量）**：**明示缺**——ACP 不转发流式输出（父工具与子代理工具同口径），工具卡承载参数与最终结果；
  能力缺口条款见 §7.3。

## 3. 架构（零依赖约束）

```text
bin/thincoder.mjs ── "acp" 子命令 ──▶ thincoder-cli/src/acp.mjs
                                        │
              ┌─────────────────────────┼──────────────────────────┐
              ▼                         ▼                          ▼
       acp/transport.mjs          acp/session.mjs            acp/bridge.mjs
   (NDJSON JSON-RPC stdio      (AcpSession: 方法 → agent      (runAgent 事件桥
    层 + reverse-RPC)           + 会话生命周期/FIFO)            + 工具钩子 + 权限)
```

ACP 官方 SDK 是 npm 依赖——违反零依赖哲学，故自写精简层。`acp.mjs` 装配 transport / session / bridge 并为每个 JSON-RPC 方法建处理器；
工具循环经 `callbacks.toolRouter` 拦截工具执行（默认空实现——TUI / CLI 路径行为不变）。

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

- `session/list`：`listSlots(cwd)` → `{ id, cwd, updatedAt, title, messageCount }`（单 cwd 模型注入 cwd）。
- `session/load` / `session/resume`：`loadSlotFile(cwd, slot)` → `applySession(agent, data)`；
  **槽占用检测** → 空闲认领钉回、占用则 `newSession` **fork 到新槽**（防同槽双写静默互覆盖）。load 后重放历史（§6.4）；resume 不重放。
- `session/delete`：`deleteSlot(cwd, slot)`；**被删槽的在存会话**（`_slot` 仍钉着）→ 立即 `newSession` 钉新槽
  （否则下次保存经 activeSlot 早退分支落回同进程活动槽 → 两会话写同一槽）。删除活跃会话仅删持久化存档，在存内存会话继续。
- `session/set_mode` / `set_config_option`：改 agent 内存态，成功后经 notify 发 `current_mode_update` / `config_option_update`。
- `checkpoint/*`（create / list / restore）与 `memory/*`（list / remove）：扩展拉取面——checkpoint cwd-scoped
  （与 TUI git 工具同 store）；memory 复用 `~/.thincoder/memory.db`。`checkpoint/restore` 为单文件恢复（full rewind 禁用）。

## 4. 鉴权与配置

- 复用 `~/.thincoder/config.json`：活动 provider 有可解析 API key（含 env fallback）→ `authenticate` 通过；
  否则返回 authRequired，客户端引导终端先跑 `thincoder` 完成 setup-wizard。
- `initialize.authMethods` 声明 `terminal`。
- 除 `initialize` / `authenticate` 外的方法均需先鉴权通过——未鉴权 → `-32000`。

## 5. 事件桥（`thincoder-cli/src/acp/bridge.mjs`）

runAgent 的 callbacks 直接映射为 ACP 通知（`session/update` 事件块）：

| runAgent 内部 | ACP 通知（schema v1） |
|---|---|
| `callbacks.onToken(text)` | `agent_message_chunk`（剥 `[model]` 元数据前缀、`⟦ev⟧` 事件 token 与子代理 relay 前缀 `role#id/`） |
| `callbacks.onReasoning` | `agent_thought_chunk`（relay 前缀同剥） |
| 工具开始 | `tool_call` `{ toolCallId, title, kind, status: "in_progress", rawInput, content }`（`title` = 剥 relay 前缀后的工具名） |
| 工具结果 | `tool_call_update` `{ toolCallId, status: "completed", content }`（REPLACE 语义） |
| 模型 / 模式变更 | `config_option_update` / `current_mode_update` |
| `callbacks.onUsage` | `usage_update` |
| 回合结束 | **非通知**——`session/prompt` resolve `{ stopReason: "end_turn" }` |
| `callbacks.onWait` / `onCompress` | 仅 stderr 日志（rate-limit / auto-compacted） |

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

## 11. 体量与拆分规划（R24a）

**实测行数**：本档 **341 行**（根层新建 · as-of 2026-09-15 实核）——**超 300 行软线（未越 500 硬门），须附拆分规划**。
**拆分规划（预置触发）**：本档再增厚时，首拆候选 = **§5 事件桥 + §7 通道修整**合为一档 `ACP-BRIDGE`（拟落 `docs/cli/design/`，本轮未建）——
其读者面（「事件怎么映射与剥离」）与协议 / 方法 / 架构 / 会话持久化面可分离；切点零交叉（桥面自带契约与决策），拆分不改本节语义。

## 变更记录

- 2026-09-15（**B 式迁移轮 · 第 6 批**）：建档——`thincoder-cli/docs/design/ACP-CLIENT.md` 内容重建入基准层（旧档一字未改、原地作参照历史）。
  ① 落点 = `docs/cli/design/`（P2：CLI 单端面——VSC 仓无 ACP 实现，结构性不对称）；
  ② 坐标全量改**现状路径**并实核（`thincoder-cli/src/acp.mjs` · `src/acp/{transport,session,bridge}.mjs` · `thincoder-core/agent/relay-prefix.mjs` · `thincoder-cli/src/cli/make-agent.mjs`）；
  ③ **按现状收正两处**：question 可用性行的实际载体 = `thincoder-cli/src/prompt-injections.mjs:35`（旧档 §12.3④ 写「插入 `thincoder-core/tool-docs/question.md`」——
  现行实现经 `{{inject:question-ui-face}}` 锚注入，取值表住 CLI 端）；文法模块落点 = `thincoder-core/agent/relay-prefix.mjs`（旧档 §12.3① 写「`src/agent/relay-prefix.mjs`」——核包重构后已入 `thincoder-core/`）；
  ④ 旧档批次材料（选型表 / 受影响文件 / 用例 / AC / 场景名册 / 纪律核对）入 §10.1；⑤ 试用例编号形态避开悬空锚（本档不引用批次用例号）。
