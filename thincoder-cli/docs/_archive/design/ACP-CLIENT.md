# ACP 客户端协议接入（`thincoder acp`）

> 板块：ACP 协议（编辑器接线）。状态：**已实现**（`src/acp/` 含 transport/session/bridge 三层）；桥层断言重建——见 §8。
> 权威源（CLI）：`src/acp.mjs`（子命令入口 + method 处理器）、`src/acp/transport.mjs`、`src/acp/session.mjs`、`src/acp/bridge.mjs`、`src/session.mjs`（会话存档）、`test/acp-channel.test.mjs`（第 27 批重建——见 §8）。
> 关联：`_archive/COMPETITIVE-CLI-2026.md`（竞争评估 P0 来源）、`TOOLS.md` §15.1（工具 id 配对语义 D15.8 同源）。

## 变更记录

- 2026-08-04：立项设计（协议实证、方法覆盖、架构、测试策略；checklist 用户故事播种）。
- 2026-08 下旬：M1（传输 + initialize/authenticate/session/new + prompt 流式）与 M2（工具 + request_permission + fs 反向 RPC）交付。
- 2026-08-31/09-01 会诊批：槽位认领（`newSession` 立即钉独立槽防双写）、load/resume/delete 槽占用 fork、取消回合 AbortController、会话每回合末存档（finally 语义）。
- 2026-09-05（用户裁定 CLI parity）：edit 桥 batch 形态条目 path 语义与本地 edit-batch 对齐。
- 2026-09-07：重写为当前态（格式正常化、历史流水账折叠为本记录、机制按实现实证更新）。
- 2026-09-11：第 27 批通道修整设计（question 装配期剔除 + relay 前缀显示面剥离 + onToolOutput 明示缺）——§12；§8 测试策略行漂移修正（旧档已删）。

---

> 需求层已迁出（2026-09-10 需求层拆分批）：本节需求见 `../requirements/ACP-CLIENT.md`。

## 2. 协议基础（ACP schema v1）

- 传输：**NDJSON over stdio**（每行一个 JSON，JSON-RPC 2.0）。
- 方向：IDE = client（发起请求）、agent = server（响应 + 反向 RPC 通知）。
- 版本：`initialize` 内 `protocolVersion` 协商（当前稳定版本 `1`）。

**方法清单（schema v1 提取）**：
- agent 侧：`authenticate / initialize / logout / session/{new,load,resume,list,delete,prompt,cancel,close,set_mode,set_config_option}`；
- client 侧：`fs/{read,write}_text_file / session/{update,request_permission} / terminal/{create,output,release,kill,wait_for_exit}`（terminal 为 client→agent 请求，agent 可不实现）。

## 3. 方法覆盖（thincoder 裁剪版）

### 3.1 Agent-side（IDE → agent）

| Method | 做 | 说明 |
|---|---|---|
| `initialize` | ✅ | 版本协商（protocolVersion 1）；响应 `{ protocolVersion: 1, agentInfo: { name: "thincoder", version }, authMethods: ["terminal"], capabilities: { fs: { read: true, write: true }, terminal: false } }`（version 读 package.json） |
| `authenticate` | ✅ | 校验活动 provider 有可解析 API key（含 env fallback——`defaultIsConfigured`）；未配置 → `authRequired` 错误码 -32000 |
| `session/new` | ✅ | 接受 `cwd`（必须等于进程工作目录——v1 单 cwd 模型，见 §7.6）；忽略 `mcpServers` 并 warn；立即 `newSession` 认领独立槽；返回 `{ id, configOptions: [{configId:"model"},{configId:"thinking"},{configId:"mode"}] }` |
| `session/load` | ✅ | 恢复 thincoder 会话存档，经 session/update 重放历史（role → 事件块映射，见 §7.4） |
| `session/resume` | ✅ | 轻量变体（跳过历史重放，仅恢复 cwd + configOptions + 会话上下文） |
| `session/list` | ✅ | 枚举会话存档（unlimited 槽位，见 §7.1） |
| `session/delete` | ✅ | 删除会话存档（schema v1 有、kimi 未实现——客户端清理会话的必需能力） |
| `session/prompt` | ✅ | 接受 text content 块；流式 `agent_message_chunk`；返回 `{ stopReason: "end_turn" }`（取消 → `"cancelled"`） |
| `session/cancel` | ✅ | 中断当前轮（真实 AbortController，见 §6.1） |
| `session/set_mode` | ✅ | plan/normal 切换（映射 planMode） |
| `session/set_config_option` | ✅ | model / thinking / mode 分发（见 §6.3） |
| `session/close` | ✅ | 返回 `{}` + stderr 日志（"session {id} closed by client"）；先 abort 在飞回合再删除 session |
| `logout` | ❌ | 无账号体系 |

### 3.2 Client-side reverse-RPC（agent → IDE）

| Method | 做 | 说明 |
|---|---|---|
| `session/update` | ✅ | 事件块见 §6（agent_message_chunk / agent_thought_chunk / tool_call / tool_call_update / usage_update / config_option_update / current_mode_update 等） |
| `session/request_permission` | ✅ | 工具审批 + 提问（askPermission 的 ACP 实现；危险命令标注见 §6.4） |
| `fs/read_text_file` | ✅ | **仅内部用于 edit 桥的读回**（读 IDE buffer 当前内容再算 diff）——独立 `read` 工具保持本地（两者不冲突） |
| `fs/write_text_file` | ✅ | write / edit 的写路径路由到 client（IDE diff 应用） |
| `terminal/*` | ❌ | shell 走本地执行（与 kimi 相同取舍） |

### 3.3 其余（unstable 扩展：elicitation/*、auth/configuration、buffer sync 等）

不做——正常客户端流程不依赖。`question` 工具（提问）同为通道裁剪：ACP 无提问通道、不接通 elicitation，
会话装配期剔除该工具（模型不可见）——机制见 §12.3 ⑤；裁剪权威 = 需求档 §12。

## 4. 架构（零依赖约束）

```
bin/thincoder.mjs ── "acp" 子命令 ──▶ src/acp.mjs
                                        │
              ┌─────────────────────────┼──────────────────────────┐
              ▼                         ▼                          ▼
       transport.mjs              session.mjs                 bridge.mjs
   (NDJSON JSON-RPC stdio      (AcpSession: 方法 → agent      (runAgent 事件桥
    层 + reverse-RPC)           + 会话生命周期/FIFO)            + 工具钩子 + 权限)
```

ACP 官方 SDK（`@agentclientprotocol/sdk`）是 npm 依赖——违反零依赖哲学，故自写精简层。`src/acp.mjs` 装配 transport/session/bridge 并为每个 JSON-RPC 方法建处理器；`src/agent/dispatch.mjs` 工具循环经 `callbacks.toolRouter` 拦截工具执行（默认空实现，TUI/CLI 路径行为不变）。

### 4.1 传输层（transport.mjs）

- `readline` 逐行读 stdin → JSON.parse → 分发；响应/通知写 stdout（**严格只写 JSON**——日志全走 stderr，kimi log-guard 同款）。
- 错误码映射：-32600（parse）/ -32601（method not found）/ -32602（invalid params）/ -32603（**internal**——未捕获异常返回合法 JSON-RPC 错误，不中断 NDJSON 流）/ -32000（authRequired，ACP 扩展）。
- **入站串行 FIFO**：每行 handler 被 await 后才处理下一行——ACP 会话有顺序依赖（prompt 必须随 new），朴素客户端可能不等响应连续发行；请求级顺序端到端保证。
- **反向 RPC 请求**（request_permission / fs/*）带 id 发往 client，等待响应（`request(method, params, {timeoutMs})`——静默 client 不会挂死 agent 循环）；**异常通道**：client 对反向请求的响应在队列外立即 resolve pending waiter（排队会死锁——prompt handler await 它时阻塞队列，而队列又等 handler 完成）。畸形响应行若带 `rpc-` id → 立即 reject 对应 waiter。
- `write` 可注入（测试用）；SIGINT/SIGTERM → graceful drain（等在飞请求结束再退出）。

### 4.2 会话层（session.mjs）

每个 `session/new` 创建独立 agent 实例（`defaultCreateSession` → `assembleAgent()` + `createAcpSession`）：

- **单 cwd 模型**：ACP 进程由 IDE 在项目目录启动，进程 cwd = 工作目录；agent 始终跑在进程 cwd（session/new 带 cwd 必须等于进程 cwd，否则 -32602 "v1: cwd must equal the process working directory"）。
- **run 串行 FIFO**：并发 prompt 挂 per-session promise 链（后到等前一轮结束）；每回合末 `save(agent)` 持久化存档（finally 语义——成功/取消/失败均存；保存失败只记日志不破链）。
- **cancel**：真实 `AbortController`——provider 层 `AbortSignal.any([signal, timeout])` 需真 AbortSignal；每回合后重建 controller，一次 cancel 只影响在飞回合。

### 4.3 方法 → agent 映射要点

- `session/list`：`listSlots(cwd)` → `{ id: String(slot), cwd, updatedAt, title, messageCount }`（单 cwd 模型注入 cwd）。
- `session/load` / `session/resume`：`loadSlotFile(cwd, slot)`（校验/保现场/.tmp 回退与主路径一致）→ `applySession(agent, data)`；**槽占用检测**（`slotOccupancy` + 同进程已钉判定）→ 空闲认领钉回、占用则 `newSession` **fork 到新槽**（防同槽双写静默互覆盖）。load 后 `replayHistory` 重放（§7.4）；resume 不重放。
- `session/delete`：`deleteSlot(cwd, slot)` 删存档；**被删槽的在存会话**（`_slot` 仍钉着）→ 立即 `newSession` 钉新槽（否则下次保存经 activeSlot 早退分支落回同进程活动槽 → 两会话写同一槽）。删除活跃会话仅删持久化存档，在存内存会话继续。
- `session/set_mode` / `set_config_option`：改 agent 内存态（model/thinking/mode），成功后经 notify 发 `current_mode_update` / `config_option_update`。
- `checkpoint/*`（create/list/restore）与 `memory/*`（list/remove）：M5 前拉扩展——checkpoint cwd-scoped（同 TUI git 工具 store，非 git cwd 全目录拷贝快照）；memory 复用 `~/.thincoder/memory.db`。`checkpoint/restore` 为单文件恢复（full rewind 禁用）。

## 5. 鉴权与配置

- 复用 `~/.thincoder/config.json`：活动 provider 有可解析 API key（含 env fallback）→ `authenticate` 通过；否则返回 authRequired，客户端引导终端先跑 `thincoder` 完成 setup-wizard。
- `initialize.authMethods` 声明 `terminal`（与 kimi 同款）。
- 所有方法（除 initialize/authenticate）需先鉴权通过——未鉴权 → -32000。

## 6. 事件桥（bridge.mjs）

runAgent 的 callbacks 直接映射为 ACP 通知（session/update 事件块）：

| runAgent 内部 | ACP 通知（schema v1） |
|---|---|
| `callbacks.onToken(text)` | `agent_message_chunk`（剥 `[model]` 元数据前缀、`⟦ev⟧` 事件 token 与子代理 relay 前缀 `role#id/`——TUI/webview 显示信号非对话内容，不得达 ACP 客户端；relay 前缀剥离 = 第 27 批） |
| `callbacks.onReasoning` | `agent_thought_chunk`（relay 前缀同剥——第 27 批） |
| 工具开始 | `tool_call` `{ toolCallId, title, kind, status: "in_progress", rawInput, content }`（`title` = 剥 relay 前缀后的工具名——第 27 批；内部配对键仍为原样名） |
| 工具结果 | `tool_call_update` `{ toolCallId, status: "completed", content }`（REPLACE 语义） |
| 模型/模式变更 | `config_option_update` / `current_mode_update` |
| `callbacks.onUsage` | `usage_update` |
| 回合结束 | 非通知——`session/prompt` resolve `{ stopReason: "end_turn" }`（kimi session.ts parity） |
| `callbacks.onWait` / `onCompress` | 仅 stderr 日志（rate-limit / auto-compacted） |

> relay 前缀剥离的逐点落法与配对键语义见 §12.3；本表只列映射骨架。

### 6.1 工具 id 配对语义（toolIds——D15.8）

ACP `toolCallId` **按会话生成**（`t1, t2, …`）；thincoder 模型级工具 id 跨轮/跨消息不保证唯一（sse.mjs 每轮从 `call_0` 重置），ACP id 必须唯一。bridge 维护 **FIFO `toolQueue`（条目 `{ name, id, toolId }`——toolId = dispatch 传入的模型级 id）**：

- **入队（onToolCall）**：push 前若队列已有同名同 toolId 条目，它必是结果永不回调的陈旧孤儿（dispatch 失败/中断路径不调 onToolResult）→ **先弹出再入队**——精确配对恒命中最新条目。
- **消费（onToolResult）**：① 模型级 toolId 精确配对（中断孤儿隔离）；② 无 id/未命中 → 名称 FIFO 回退（B1 保序——并行结果回调顺序 = call 顺序）；③ 均未命中 → null（调用方回退新 id——防御）。
- **审批面板**：`peekToolId(name)` 取同名最早项 id（不消费——result 仍与自己的条目配对）。

### 6.2 工具执行路由（fs 反向 RPC / edit 桥）

`callbacks.toolRouter(name, args)` 由 dispatch runOne 在 `item.tool.execute(...)` 调用前尝试：`handled: true` 用 result 作工具结果、`false` 走本地执行。

- **write** → `fs/write_text_file`（构造新内容全量写，无需读回）。
- **edit**（单形态 + `edits` 数组）→ **读 IDE 缓冲 → `computeEditEntry`（本地 edit-diff.mjs 单一权威——校验/判定序/应用全部委派）→ 写回 IDE 缓冲**。读回保证与 IDE buffer 一致（防客户端已改）；错误文本经抛错原样透传（与本地通道逐字一致——not found / occurrences / 空 old / 空 new）。
  - 单形态：读回 → normalizeEOL → `computeEditEntry` → `joinWithEol` 写回（LF 域判定、CRLF 域写回——与本地 edit 同判同恢复）。
  - 数组形态（CLI parity 2026-09-05）：条目自带 path 优先、缺省回退顶层 path（path/filePath 别名）；`validateEditEntry` + 顶层 `assertEditArgsExclusive`；读全部涉及文件缓冲（同文件去重一次读）→ 逐条 computeEditEntry（abortPrefix `"edit aborted (atomic — no files written): "`，同文件条目串行累积）→ 全通过后逐文件写回（判失败零写、写失败同本地 edit-batch 原子语义）。
  - **结果回显**：`OK: edited <path> via IDE (<n> occurrence(s))`（含 note 时追加 ` — <note>`）。
- **apply_patch** → **本地执行**（unified-diff 应用不路由）。
- **delete、只读工具**（read/glob/grep/ls 等）→ **本地执行**（schema v1 无 fs/delete；读本地性能优先；kimi 同款——AcpKaos 仅路由 read/write）。

**已知风险（TOCTOU）**：edit 读回与写入之间用户在 IDE 改了 buffer → 写入覆盖用户改动。缓解：IDE diff 审查（用户保存前可见并拒绝）；可选演进：写入带 base revision 校验（协议不稳定面，非 v1 必需）。记录为接受风险。

### 6.3 configOption 映射（schema v1）

| configId | 值 | thincoder 映射 |
|---|---|---|
| `model` | string（provider:model / provider / model） | 首个冒号切分 provider + model；provider 不同则更新 agent.provider.name |
| `thinking` | boolean | `thinking: { type: "enabled"|"disabled" }` |
| `mode` | `"plan"` / `"normal"` | planMode 切换 |

last-write-wins 于内部状态；set 成功后 notify `config_option_update`/`current_mode_update`。未知 configId / 非法值 → 返回 false → -32602。

### 6.4 审批通道（request_permission）

复用 dispatch 既有 `onPermissionRequest`（不存在 → deny）。ACP 模式：bridge 提供 `onPermissionRequest = (name, args) → session/request_permission`——请求带选项 + toolCall；危险命令经 `detectDanger` 标注（只提示不拦截）。

选项（kimi canonical ids，顺序 load-bearing）：`approve_once`（Approve once）/ `approve_always`（Approve for this session）/ `reject`（Reject）。

响应经 `permissionToBoolean` 判定：`{ outcome: { outcome:"selected", optionId } }` 中 approve_once / approve / approve_always / approve_for_session → true；cancelled / unknown → **false（安全优先）**。

传输失败 → false，超时 5 分钟。

非 ACP 模式：TUI/CLI 各自既有实现（askPermission 等，完全不动——`src/cli/permission.mjs` 零耦合）。

## 7. 会话持久化

### 7.1 槽位模型

- `session/load`/`resume` 读 thincoder 会话存档（src/session.mjs，双线历史 JSON）。
- `session/list` 枚举存档槽位——**槽位数量 unlimited**（src/session.mjs 语义："Each project keeps unlimited session slots"），按实际存档全量返回。
- **sessionId ↔ 槽位映射**：ACP sessionId = 槽位号（数字字符串，如 `"3"`）；load/resume/delete 按 id 解析槽位。每 `session/new`/`load`/`resume` 的 ACP 会话 id 独立分配（`nextId++`），与持久化槽位号不同物。
- **单 cwd**：进程 cwd = 默认工作目录；`session/new` 带 cwd 参数必须等于进程 cwd（会话首次建立时固定，该进程内所有会话共用同一 cwd）。跨进程/多 cwd 会话不在 v1 范围。

### 7.2 load 语义

- 人读线全量消息按序重放；机读注入（reminder/interrupt/transient）不存于存档（saveSession 过滤），无需跳过。
- 槽被另一活进程（CLI/另一 IDE）或本进程另一会话占用 → **fork 到新槽**（不钉回——防 F2 永不轮转/同槽双写）；空闲则认领钉回。

### 7.3 每回合末存档

`session.mjs` 的 `run` 在每回合 finally 调 `save(agent)`——**成功/取消/失败均存**。这使 session/list/load/resume 有真实数据源；保存失败不破 FIFO 链。

### 7.4 历史重放（role → 事件块）

`replayHistory`（bridge.mjs）：

- `role: "user"` → `user_message_chunk`（多模态块逐块发；image 块跳过 + log）；
- `role: "assistant"` 无 tool_calls → `agent_message_chunk`；
- `role: "assistant"` 含 tool_calls → 每工具一条 `tool_call`（`status:"in_progress"`，id `t1…` 独立序列——客户端按 toolCallId 关联后续 update；孤儿 update 被忽略）；
- `role: "tool"` 结果 → 跟随其 assistant 消息的 `tool_call_update`（`status:"completed"`，内容截 2000 字）。

### 7.5 delete 语义

仅删持久化存档；活跃 in-memory 会话不受影响（如需停止客户端应另行 close/terminate）。被删槽的在存会话 `_slot` → 立即 `newSession` 钉新槽（防"删后复活"写回同进程活动槽）。

### 7.6 cwd 归一化

`session/new` 的 cwd 与进程 cwd 做**大小写不敏感**比较（Windows 盘符 + 路径——`normalizeCwd().toLowerCase()`）——客户端发 `c:\users\…` vs 进程 `C:\Users\…` 必须匹配。`requested` 永不喂任何路径操作——agent 始终跑在进程 cwd。

## 8. 测试策略（第 27 批起：`test/acp-channel.test.mjs`）

> 漂移修正（2026-09-11）：旧档 `test/acp.test.mjs`（已删——存量测试清零批，2026-09-07）——断言面待重建。
> 本批重建桥层断言 = `test/acp-channel.test.mjs`（§12.7 用例表）；下表为场景名册（mock 客户端全链路
> 为长期目标，按需回补）。

**mock ACP 客户端**直接 import transport/session 层驱动（避免子进程时序脆弱）。`createAcpServer` 暴露 `handleLine` 供测试不依赖真实 stdin。

| 场景 | 覆盖 |
|---|---|
| 握手全链路 | initialize → authenticate；能力矩阵；未配置 → -32000 |
| prompt 流式 | session/new → prompt → agent_message_chunk → end_turn |
| 工具审批回环 | prompt 触发 bash → request_permission → allow → tool_call/update → 结果 → 继续 |
| fs 反向 RPC | write 触发 → fs/write_text_file；edit → read_text_file → computeEditEntry → write_text_file |
| 工具 id 配对 | 并发同名工具按 call 序配对（D15.8）；中断孤儿经"同名同 toolId 先弹出"隔离 |
| cancel 中断 | prompt 中发 cancel → 当前轮停止 |
| 会话存档 | list → load → delete → 再 load 已删 → 错误；resume 跳过重放 |
| 配置 | set_config_option / set_mode → config_option_update / current_mode_update |
| 错误映射 | 非法 JSON → -32600；未知方法 → -32601；未鉴权 → -32000；畸形 mcpServers → 忽略+warn；活跃回合再发 prompt → FIFO 排队；close → `{}` |
| 边界 | 损坏会话文件 → 错误非崩溃；客户端写错误 → 透传；delete 活跃会话 → 仅删存档；会话加载槽占用 → fork |

> 需求层已迁出（2026-09-10 需求层拆分批）：本节需求见 `../requirements/ACP-CLIENT.md`。

## 10. 安全语义

- 副作用工具：默认 **deny**，`request_permission` 必现（AUTO 关闭）；反向 RPC 传输失败 → 拒绝（安全优先）。
- 工具边界：仍受 cwd 约束（现有 confine 逻辑不变）。
- 写路径走 IDE buffer：IDE 的 diff 审查是比 CLI diff 预览更强的保障。
- 日志隔离：stdout 纯净 JSON，stderr 承载日志——防止协议污染（kimi log-guard 同款）。

## 11. 决策记录

| 决策 | 理由 |
|---|---|
| 自写 NDJSON JSON-RPC 层 | 零依赖是项目宪法；SDK 依赖会破坏 npm 安装的零依赖承诺 |
| fs 反向 RPC（含 write 类） | "编辑器接线"是 ACP 核心体验——diff 就地显示是用户感知最强的点 |
| edit 桥判定委派本地 computeEditEntry | 双通道同语义——单/数组形态错误文本与本地逐字一致，单一权威防漂移 |
| 权限默认 deny + AUTO 关闭 | 安全第一；ACP 会话在 IDE 内，审批弹窗成本低 |
| 复用终端鉴权 | 登录一次多表面（kimi 验证过的模式） |
| 工具 id 按会话唯一 + FIFO 配对 | 模型级 id 跨轮不唯一；精确配对防 tool_call_update 错配 |
| 每回合末存档 | session/list/load/resume 需真实数据源；finally 语义不丢回合 |

---

## 12. 通道修整——question 剔除 + relay 前缀收敛（第 27 批——2026-09-11）

> 需求回指：`../requirements/ACP-CLIENT.md` §13（R-A1.1–A1.3 · R-A2.1–A2.4）。
> 批次：`../batches/2026-09-11-ACP-CHANNEL-FIXES.md`（Gitee #IKEV9I + #IKEV9H——用户 13:36「那几条你的建议都可以」）。

### 12.1 问题陈述（现场复核——file:line as-of 2026-09-11）

**A1（question 工具在 ACP 必错）**

- `thincoder-core/tools/question.mjs:20`：`ctx.onQuestion` 缺省即 throw——无 UI 上下文没有第二条路。
- 全仓 `onQuestion` 提供者只有 TUI：装配 `src/tui/tool-events.mjs:329`、透传 `src/agent/dispatch.mjs:394`；
  ACP 回调集（`src/acp/bridge.mjs:168-285` `buildAcpCallbacks`）无该字段。
- ACP 会话走同一 `assembleAgent()`（`src/acp.mjs:79`；函数体 `src/cli/make-agent.mjs:14`）——工具集含
  question（`thincoder-core/tools/index.mjs:22`），schema 逐请求由 `agent.tools` 派生（`thincoder-core/agent/setup.mjs:182-183`）
  → 模型可见、可调、每调必错。
- 漂移面：`thincoder-core/tool-docs/question.md` 描述对无 UI 通道作无条件承诺（"loop pauses / answer returns"）；
  本档 §6 回调映射表无该工具行（本节回填）。

**A2（relay 前缀泄漏进 ACP 流）**

- 生成侧：`src/agent/spawn-child.mjs:74`（`makeRelay` 构造 `role#id/`）、`:126-143`（`wrapChildCallbacks`
  对 onToken / onReasoning / onToolCall / onToolOutput 逐通道加前缀）。
- 消费侧泄漏点（bridge 内联形态）：
  - `src/acp/bridge.mjs:169-181`（onToken）——只剥 `[model]` / `⟦ev⟧` 信号，**正文带前缀原样进** `agent_message_chunk`；
  - `src/acp/bridge.mjs:183`（onReasoning）——零剥离，前缀进 `agent_thought_chunk`；
  - `src/acp/bridge.mjs:188-209`（onToolCall）——`title: name` 带前缀（`:26-34` 的 kind 推断只在 kind 侧用 `split("/")` 兜住）；
  - `src/acp/bridge.mjs:224-247`（onPermissionRequest——**勘察新增第 4 落点**）——子代理权限请求名 =
    `${key}/${tool}`（`thincoder-core/agent-tools/subagent-spawn.mjs:312-317`）→ 请求文本与 `toolCall.title` 带前缀；
  - 无 `onToolOutput`——ACP 无流式工具输出面（父工具与子代理同口径，见 §12.6）。
- 平行文法面：TUI 自持 `src/tui/subagent-blocks.mjs:32`（`SUB_PREFIX_RE`）+ `:51-67`（`parseRelayPath`）；
  bridge 内联 `(?:[\w-]+#\d+\/)*`（:173 / :180）——两套写法同源异体、各自维护 = 漂移源。

### 12.2 方案选型对比

> 判据来源 = 需求 §13（模型不可见要求剔除先于 schema 派生；剥离不得动配对语义；协议面不改）。

**① A1｜剔除点**

| # | 候选 | 判据逐项评估 | 取舍（选定代价/权衡） | 结论（选定/否决理由） |
|---|---|---|---|---|
| 1 | **装配期参数**——`assembleAgent({ excludeTools })`（`src/cli/make-agent.mjs`）+ `src/acp.mjs` 传入标志 | schema 直接少一条（逐请求派生自 `agent.tools`）；「哪些工具 ACP 不可用」的知识住在 acp.mjs（通道方）；一处过滤实现、参数可复用 | make-agent 增一个形参 + 一个纯函数 | **选定** |
| 2 | acp.mjs 装配后过滤（`agent.tools = agent.tools.filter(...)`） | 机械可行 | 事后变异绕开装配契约；不可复用；知识散在裸过滤式 | 否决 |
| 3 | bridge 过滤 | 结构上不可行——bridge（`buildAcpCallbacks`）不持有 agent/工具集：装配在 `src/acp.mjs:79`，callbacks 构造在其后（`src/acp/session.mjs:20`） | — | 否决（无装配权） |
| 4 | 真接通提问（elicitation / 协议面扩展） | 批次 §1 已裁：协议面不做 | — | 否决（已裁） |

**② A2｜前缀语义**

| # | 候选 | 判据逐项评估 | 取舍（选定代价/权衡） | 结论（选定/否决理由） |
|---|---|---|---|---|
| 1 | **剥离转发**——前缀逐点剥、载荷照发 | 修「泄漏」本义；载荷是真内容（子代理文本/思考/工具卡），今日已进流（仅带脏前缀）→ 语义变化 = 仅去前缀；与 TUI「子代理活动可显示」口径同向 | 客户端看到扁平化子代理活动（无归属标）——本批接受的显示语义 | **选定** |
| 2 | 整体过滤——子代理事件不进 ACP（kimi 式） | 对照：kimi-code 仓 `packages/acp-adapter/src/session.ts` 用 `isFromMainAgent` 守卫把子代理事件整体滤除 | 语义大改（子代理活动全部消失），与今日行为（内容已进流）反向；需用户裁定 | 否决（登记为后续候选——§12.9） |

**③ A2｜onToolOutput**

| # | 候选 | 判据逐项评估 | 取舍（选定代价/权衡） | 结论（选定/否决理由） |
|---|---|---|---|---|
| 1 | **明示缺**——不转发流式输出，条款落档 | 最终结果已经 `tool_call_update` 送达；流式需新增累积态 + REPLACE 语义重发 + 节流 + 子代理无 toolId 的配对回退（`wrapChildCallbacks` 不传第 3 参——`src/agent/spawn-child.mjs:139`） | ACP 客户端无 live 命令行输出——**现状即如此（零回归）** | **选定** |
| 2 | 补齐——累积 + `tool_call_update` 流 | 客户端体验更好 | 新通知面（含节流与配对回退）＝独立设计面，超出本批前缀收敛范围 | 否决（登记——§12.9） |

### 12.3 契约（模块接口 / 逐点落法 / 措辞草案）

**① 文法模块（本批唯一新增实现面文件——预授权档即此件）`src/agent/relay-prefix.mjs`**

```js
export const RELAY_PREFIX_RE = /^([\w-]+)#(\d+)\//   // 单段 role#id/
export function parseRelayPath(text)     // → { head, inner[], label, rest } | null——自 TUI 现行逐字迁入，语义零改
export function relayPrefixOf(label, id) // → `${label}#${id}/`——构造向单一实现
```

- 零依赖（不 import 任何模块）——TUI（`src/tui/`）与 ACP（`src/acp/`）双向可导入，无环。
- `src/agent/spawn-child.mjs` **再导出**（生成侧枢纽）：`export { RELAY_PREFIX_RE, parseRelayPath, relayPrefixOf } from "./relay-prefix.mjs"`；
  两处字面构造点改用 `relayPrefixOf`（`makeRelay` :74 与 `thincoder-core/agent-tools/subagent-spawn.mjs:440` 的 async 取号分支）。
- 消费方直连模块：`subagent-blocks.mjs`（import 使用、不再本地定义）、`bridge.mjs`（import 使用）。

**② TUI 侧（零语义搬迁）**

- `src/tui/subagent-blocks.mjs`：删 `SUB_PREFIX_RE`（:32）与 `parseRelayPath`（:51-67）本地定义，改 import；
  `routeSub*` 全族与其余导出面零改。
- `src/tui/tool-events.mjs:24 / :279`：`SUB_PREFIX_RE` 换名 `RELAY_PREFIX_RE`（import 源改文法模块）——纯换名。

**③ bridge 逐点落法**（剥离只作用于**显示面**；配对键保持原样）

| # | 落点 | 现状 | 落法（显示面） | 配对键（原样） |
|---|---|---|---|---|
| 1 | onToken | 只剥 `[model]`/`⟦ev⟧`，正文带前缀 | `payload = path ? path.rest : text`；信号检查改在 payload 上（相位白名单等值保留）；payload 非空 → `agent_message_chunk({ text: payload })` | — |
| 2 | onReasoning | 零剥离 | 同①取 payload → `agent_thought_chunk`；空载荷不发 | — |
| 3 | onToolCall | `title: name` | `shown = path ? path.rest : name` → `title: shown`、`kind: inferToolKind(shown)`；`rawInput`/content 零改 | `toolQueue` 条目仍存原样 name |
| 4 | onPermissionRequest | 请求文本与 `toolCall.title` 用原样 name | 显示用 `shown`（文本 + title）；`detectDanger` 基名逻辑照旧 | `peekToolId(name)` 仍用原样名 |
| 5 | replayHistory | `title = tc?.name` | 同取 `shown`（防御面——无前缀 → 零变化；带前缀 → 剥离——T18） | `pendingToolCalls` 配对零改 |

**④ 工具描述措辞（`thincoder-core/tool-docs/question.md`——草案逐字，eng-coder 原样落）**

Notes 第 3 条（`- Returns the user's answer …`）之后插入一行：

```text
- Availability: this tool needs an interactive UI — in contexts without one (headless runs, subagent children) it returns an error instead of asking; put the question in your reply text instead.
```

**⑤ A1 装配链**

- `src/cli/make-agent.mjs`：新增 `export function applyToolExclusions(tools, excludeTools = [])`（按 `name` 过滤——纯函数，机验锚）；
  `assembleAgent({ excludeTools = [] } = {})` 在 `createAgent` 前应用（`:102-108` 合并 `[...baseTools, ...mcpTools]` 处）。
- `src/acp.mjs`：`export const ACP_EXCLUDED_TOOLS = ["question"]`；`defaultCreateSession`（:78-81）传
  `assembleAgent({ excludeTools: ACP_EXCLUDED_TOOLS })`。
- `thincoder-core/tools/question.mjs` 本体零改——throw 语义 = 其余无 UI 上下文的既有兜底。

### 12.4 关键决策记录（含否决备选）

| # | 决策 | 理由 | 否决备选 |
|---|---|---|---|
| D1 | 剔除点 = 装配期（make-agent 参数 + acp 传入标志） | 模型不可见 = schema 直接少一条；通道知识住 acp.mjs；一处实现可复用 | 事后变异（绕装配契约）· bridge 过滤（无装配权） |
| D2 | 前缀语义 = 剥离转发（载荷保留） | 修「泄漏」本义；内容今日已进流——去前缀即最小变化 | kimi 式整体过滤（语义大改，需用户裁——登记） |
| D3 | 配对键保持原样（剥离仅显示面） | 同名不同子代理不得错配（`a#1/read` vs `b#2/read`）；call 与 result 以同一原样名配对 | 剥离后名作键（同名 FIFO 相撞 → 错配） |
| D4 | onToolOutput = 明示缺 | 最终结果已送达；流式面自有设计面（累积/节流/配对回退），超本批范围 | 本批补齐（新通知面——独立设计） |
| D5 | 文法 = 新模块 `src/agent/relay-prefix.mjs`（生成侧再导出） | 单一权威（TUI/ACP 同源，防再漂移）；零依赖无环 | 留在 TUI（ACP 反向依赖 TUI = 层级倒挂）· 正则复制进 bridge（复制即新漂移源） |
| D6 | 空载荷（剥后为空）不发通知 | 无内容可发——防噪声空 chunk | 发空文本 chunk（协议噪声） |
| D7 | 剥离后工具卡 `title` 不带归属标（朴素工具名——如 `bash`） | 归属标是新显示约定，无客户端支持；子代理归属仍可从父级 `subagent` 工具卡的时序读出 | 附归属后缀（如 `bash · eng-coder#2`）——新显示约定，未采（可选项） |

### 12.5 受影响文件全清单（as-of 2026-09-11 实测——含修正轮复核；行数口径 = 行计数）

| # | 文件 | 性质 | 当前行数 | 预计增量 | 档位与拆分计划 |
|---|---|---|---|---|---|
| 1 | `src/agent/relay-prefix.mjs` | 新增 | 0 | ~40 | ≤500 硬限内诞生 |
| 2 | `src/agent/spawn-child.mjs` | 改（再导出 + `makeRelay` 换 helper） | 224 | +2 | ≤300 ✓ |
| 3 | `thincoder-core/agent-tools/subagent-spawn.mjs` | 改（async 取号分支换 helper——修正轮补登） | 454 | +1 | >300 存量——零结构改动，不拆 |
| 4 | `src/tui/subagent-blocks.mjs` | 改（文法迁出——净减） | 453 | −22 / +4 | >300 存量（SUBAGENT-TAIL 批已登记「拆分需独立批次」）——本批不拆，方向为净减 |
| 5 | `src/tui/tool-events.mjs` | 改（import 换名） | 405 | ±2 | >300 存量——零结构改动，不拆 |
| 6 | `src/acp/bridge.mjs` | 改（import + 显示面剥离） | 355 | +20 / −10 | >300——本批不拆（无新结构体）；拆分计划（登记）：再增厚则先迁 `:98-166` edit 桥族 → `edit-bridge.mjs`（拟落 `src/acp/`） |
| 7 | `src/acp.mjs` | 改（常量 + 传参） | 442 | +5 | >300——不拆（无结构增长）；拆分计划（登记）：handlers / M5 扩展 / 入口装配三段 |
| 8 | `src/cli/make-agent.mjs` | 改（纯函数 + 参数） | 162 | +10 | ≤300 ✓ |
| 9 | `thincoder-core/tool-docs/question.md` | 改（描述 +1 行） | 15 | +1 | 文档面 |
| 10 | `test/acp-channel.test.mjs` | 新增（断言宿主——§12.7 用例 T1–T18） | 0 | ~170 | 测试档 ≤500 ✓ |
| 11 | `docs/requirements/ACP-CLIENT.md` | 改（§13 + §12 两行） | 39 | +42（修正轮后实测） | 文档面 |
| 12 | `docs/design/ACP-CLIENT.md` | 改（本节 + §3.3/§6/§8 回填） | 239 | +233（修正轮后实测） | 文档面 |

**父侧排程的文档联动面**（写域边界外——本设计已给完整修复路径）：

| 文件 | 用途 | 完整修复路径 |
|---|---|---|
| `docs/design/TUI.md` | 模块表行回填（subagent-blocks 文法源迁移 + 行数） | 1 行（§1 模块表该行） |
| `docs/design/AGENT-LOOP.md` | 模块地图（新模块行 + spawn-child 行回填） | ±2 行（§1 模块地图） |
| `docs/requirements/AGENT-LOOP.md` | question 描述契约加「可用性」句（§1 工具描述三锚处） | +1 行 |

### 12.6 能力缺口（归属裁定 + 条款）

- **归属裁定**：能力缺口的**裁剪权威 = 需求档 §12**（`../requirements/ACP-CLIENT.md`）；**机制详述 = 本节**。不新建档（一板块一档）。
- **onToolOutput 明示缺**：ACP 不转发工具输出流式增量——**父工具与子代理工具同口径**；工具卡承载参数
  （`rawInput` / content）与最终结果（`tool_call_update`）。理由：① 最终结果已送达；② 流式需累积态 +
  REPLACE 语义重发 + 节流 + 子代理无 toolId 的配对回退——自有设计面；③ 现状即无（零回归）。
- **question 通道**：不接通 elicitation（批次 §1 已裁）= 通道裁剪；ACP 会话以装配期剔除实现（§12.3 ⑤）。

### 12.7 用例表（正常 / 边界 / 错误——输入 / 预期输出 / 需求回指）

表 1 = ACP 桥（驱动 `buildAcpCallbacks` + `replayHistory` 直驱——`notify`/`request` 注入假实现，捕获载荷）：

| # | 类 | 输入 | 预期输出 | 回指 |
|---|---|---|---|---|
| T1 | 正常 | `onToken("eng-coder#2/hello")` | 1 条 `agent_message_chunk`，text = `hello` | R-A2.1 |
| T2 | 正常 | `onToken("eng-coder#2/explore#1/deep")` | text = `deep`（任意深度全剥） | R-A2.1 |
| T3 | 正常 | `onToken("plain text")` | text = `plain text`（零改） | R-A2.1 |
| T4 | 正常 | `onReasoning("explore#1/thinking…")` | 1 条 `agent_thought_chunk`，text 无前缀 | R-A2.1 |
| T5 | 正常 | `onToolCall("eng-coder#2/bash", { command: "ls" })` | `tool_call`：title=`bash`、kind=`execute`、rawInput 原样 | R-A2.1 |
| T6 | 正常 | `onToolCall("eng-coder#2/explore#1/read", { path: "a" })` | title=`read`、kind=`read` | R-A2.1 |
| T7 | 正常 | T5 后 `onToolResult("eng-coder#2/bash", "out")` | `tool_call_update.toolCallId` == T5 的 id（原样名配对） | R-A2.2 |
| T8 | 正常 | `onPermissionRequest("eng-coder#2/bash", { command: "rm -rf x" })` | `session/request_permission` 请求：content 文本与 `toolCall.title` 均无前缀；options / toolCallId 照旧 | R-A2.1 |
| T9 | 边界 | `onToken("a#1/[model]gpt-x")`、`onToken("a#1/⟦ev⟧turn\x1e1\x1e5\x1ellm\x1e")` | 零通知（信号 token 剥除不吃正文） | R-A2.1 |
| T10 | 边界 | `onToken("[model]gpt-x")`（裸信号） | 零通知（既有语义保持） | R-A2.1 |
| T11 | 边界 | `onToken("a#1/")`（空载荷） | 零通知（D6） | R-A2.1 |
| T12 | 边界 | `onToolCall("a#1/read")` + `onToolCall("b#2/read")` + 两条结果 | 两条 `tool_call` id 不同；两条 update 各自配对（无错配） | R-A2.2 |
| T13 | 错误 | `onToolResult("x#9/oops", "r")`（未配对名） | 回退新 id，仍发 `tool_call_update`（防御路径既有语义——不抛） | R-A2.2 |
| T18 | 边界 | `replayHistory({ sessionId, notify, history })` 合成历史：assistant `tool_calls: [{ name: "eng-coder#2/read" }]` 与 `[{ name: "read" }]` 各一条 + 各自后随 tool 结果 | 带前缀 → `tool_call.title` = `read`（kind = `read`）；无前缀 → title 零变化；`tool_call_update` 依序与各 id 配对 | R-A2.1（防御面） |

表 2 = 装配与文法（纯函数直测）：

| # | 类 | 输入 | 预期输出 | 回指 |
|---|---|---|---|---|
| T14 | 正常 | `applyToolExclusions(builtinTools, ACP_EXCLUDED_TOOLS)` | 结果无 `name === "question"`；长度 = 原 −1；其余逐字保留 | R-A1.1 |
| T15 | 边界 | `applyToolExclusions(builtinTools, [])` / `applyToolExclusions(builtinTools, ["nope"])` | 原样返回（恒等——零意外剔除） | R-A1.1 |
| T16 | 正常 | `parseRelayPath` 直测（单层 / 嵌套 / 无前缀 / 尾 rest） | `{ head, inner, label, rest }` 语义与迁移前逐字一致 | R-A2.3 |
| T17 | 正常 | 文法单一权威（源读断言） | `src/agent/relay-prefix.mjs` 导出三符号（行为/再导出面保留）；`bridge.mjs` / `subagent-blocks.mjs` import 面 + `SUB_PREFIX_RE` 零定义（源读断言）——已退场（段删——2026-09-12-PROSE-ANCHOR-RETIRE；删除记录 = `TESTING.md` §11.3） | R-A2.3 |

### 12.8 验收标准（AC——逐条回指需求，每条可机器验证）

| AC | 判据（机器可验） | 回指 |
|---|---|---|
| AC1 | T14/T15 通过（+ 工具常量名单锁）；源码接线锁（`src/acp.mjs` 含 `excludeTools: ACP_EXCLUDED_TOOLS`、`src/cli/make-agent.mjs` 含 `applyToolExclusions(`）——已退场（段删——2026-09-12-PROSE-ANCHOR-RETIRE；删除记录 = `TESTING.md` §11.3） | R-A1.1 |
| AC2 | `thincoder-core/tool-docs/question.md` 含子串 `returns an error instead of asking` | R-A1.2 |
| AC3 | T1–T13（+T18）驱动序列中捕获的全部通知/反向请求载荷：文本与标题字段对 relay 前缀文法零命中（非锚定扫描——行首与串中均不得命中；扫描锚自模块 `RELAY_PREFIX_RE` 去 `^` 锚派生——单源 §12.3①，不复制正则字面量） | R-A2.1 |
| AC4 | T7 / T12 配对断言通过（原样名键） | R-A2.2 |
| AC5 | T16 / T17 通过（文法单一权威 + 语义零改） | R-A2.3 |
| AC6 | 需求档 §12 的 `onToolOutput` 裁剪行 + 设计 §12.6 明示缺条款（grep 子串 `onToolOutput` 两档均命中；设计 §12.6 另含 `明示缺`） | R-A2.4 |
| AC7 | 既有 TUI 用例档零修改（`git diff --stat` 对 `test/subagent-tail-merge.test.mjs` / `test/activity-debloat.test.mjs` / `test/queued-stop.test.mjs` / `test/turn-across-segments.test.mjs` 为空）且通过 | R-A2.3（零语义） |
| AC8 | `npm test` 快层全绿（含新档全部用例；slow 门零拦截） | 全条 |

### 12.9 边界（本批不做）与登记项

**不做**

- ACP 协议面——elicitation / 新通知面不改；onToolOutput 流式不补（§12.6）。
- TUI 消费面语义（`routeSub*` / 渲染 / 事件文法）——零改；文法搬迁 = 纯迁移。
- `src/agent/dispatch.mjs` 转发面与 `thincoder-core/tools/question.mjs` throw 语义——不改。
- VSC 仓——零改（无 ACP 镜像面——§12.10）。
- 除 `src/agent/relay-prefix.mjs`（预授权档）与断言档 `test/acp-channel.test.mjs`（断言宿主——批次档 §2 声明）外不新建文件。

**登记项（父侧裁 / 后续批）**

1. **`thincoder chat` 同缺陷**：`bin/thincoder.mjs:140` 的 `assembleAgent()` 未传剔除 → question 仍在工具集、每调必错；
   同款一行修复 = 传 `{ excludeTools: ["question"] }`（复用 `applyToolExclusions`）。待父侧裁定并入或另批。
2. **子代理 children 同缺陷**：`thincoder-core/agent-tools/subagent-spawn.mjs:447-450` 的 `childOpts` 无 `onQuestion`（也不宜有——
   子代理无对话面，澄清走报告回父）→ question 在 children 工具集内每调必错；建议 spawn 侧对 children 做工具剔除
   （复用 `applyToolExclusions`）。待父侧裁。
3. **kimi 式「子代理事件整体过滤」**（§12.2 ② 候选 2）——显示语义候选，需用户裁定。
4. **onToolOutput 流式补齐**（§12.6）——独立设计候选。

### 12.10 纪律核对

- **D1 写权**：本节 + 需求 §13 由 eng-designer 落；`src/**` 与断言档由 eng-coder 落（任务书 = 批次档 §2）。
- **双端（CLI / VSC）**：VSC 仓无 ACP 实现（勘察：grep `acp` 仅文档与会话语义注释命中——无 `src/acp`）；
  VSC question 工具有原生 UI 兜底（`thincoder-vscode/src/tools/question.mjs:43-68`——panel 回调 + QuickPick/InputBox）→
  无「必错」缺陷。对位结论：**无镜像面，VSC 零改**。
- **TUI 零语义声明**：`routeSub*` 调用点零改；既有断言档零修改（AC7 锁）。
- **计数（D3）**：本节列表与声明同步维护（改列表即改声明）；§12.5 行数为 as-of 2026-09-11 实测口径。
- **锚形态（评审 #7 口径）**：本节 `file:line` = 勘察快照锚（as-of 2026-09-11）；实施后维护以符号名为主锚（AGENTS.md 引用约定）。
- **冻结窗口（D5）**：本设计入场后至评审结束不改被审文档。
