# ACP 客户端协议接入（`thincoder acp`）

> 板块：ACP 协议（编辑器接线）。状态：**已实现**（`src/acp/` 含 transport/session/bridge 三层；`test/acp.test.mjs` mock 客户端全链路）。
> 权威源（CLI）：`src/acp.mjs`（子命令入口 + method 处理器）、`src/acp/transport.mjs`、`src/acp/session.mjs`、`src/acp/bridge.mjs`、`src/session.mjs`（会话存档）、`test/acp.test.mjs`。
> 关联：`_archive/COMPETITIVE-CLI-2026.md`（竞争评估 P0 来源）、`TOOLS.md` §15.1（工具 id 配对语义 D15.8 同源）。

## 变更记录

- 2026-08-04：立项设计（协议实证、方法覆盖、架构、测试策略；checklist 用户故事播种）。
- 2026-08 下旬：M1（传输 + initialize/authenticate/session/new + prompt 流式）与 M2（工具 + request_permission + fs 反向 RPC）交付。
- 2026-08-31/09-01 会诊批：槽位认领（`newSession` 立即钉独立槽防双写）、load/resume/delete 槽占用 fork、取消回合 AbortController、会话每回合末存档（finally 语义）。
- 2026-09-05（用户裁定 CLI parity）：edit 桥 batch 形态条目 path 语义与本地 edit-batch 对齐。
- 2026-09-07：重写为当前态（格式正常化、历史流水账折叠为本记录、机制按实现实证更新）。

---

## 1. 定位与目标

`thincoder acp` 子命令在 **stdio 上通过 [Agent Client Protocol](https://agentclientprotocol.com/)（schema v1）暴露 thincoder agent**，使 Zed / JetBrains AI Chat / Paseo 等 ACP 客户端可直接驱动。thincoder 已有专有 VS Code 扩展；ACP 一次实现即可接通 Zed / JetBrains / Paseo（桌面 + Web + 移动自托管编排器）——补上"编辑器接线"生态位。

**核心体验**：
- 编辑器上下文自动注入（打开文件/光标/选区，无需手动 `@`）；
- agent 编辑以 IDE 原生 diff 应用（fs 反向 RPC）；
- 工具审批弹在 IDE 内（`request_permission`）；
- 登录态/会话复用（一次终端登录、多表面可用）。

**协议权威**：`agentclientprotocol/agent-client-protocol` 仓库 `schema/v1/schema.json`（稳定协议版本 **1**；方法名/事件类型以 schema 为准）；kimi-code `packages/acp-adapter/` 为参考实现（方法名与 schema v1 一致）。**注意**：`@agentclientprotocol/sdk@0.23.0` 是 SDK 包版本、不是协议版本；kimi 文档中的 "stable 10/12" 按其 SDK 表面统计——本设计以 schema v1 方法清单为准。

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

不做——正常客户端流程不依赖。

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
| `callbacks.onToken(text)` | `agent_message_chunk`（剥 `[model]` 元数据前缀与 `⟦ev⟧` 事件 token——TUI/webview 显示信号非对话内容，不得达 ACP 客户端） |
| `callbacks.onReasoning` | `agent_thought_chunk` |
| 工具开始 | `tool_call` `{ toolCallId, title, kind, status: "in_progress", rawInput, content }` |
| 工具结果 | `tool_call_update` `{ toolCallId, status: "completed", content }`（REPLACE 语义） |
| 模型/模式变更 | `config_option_update` / `current_mode_update` |
| `callbacks.onUsage` | `usage_update` |
| 回合结束 | 非通知——`session/prompt` resolve `{ stopReason: "end_turn" }`（kimi session.ts parity） |
| `callbacks.onWait` / `onCompress` | 仅 stderr 日志（rate-limit / auto-compacted） |

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

## 8. 测试策略（test/acp.test.mjs）

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

## 9. 非功能性需求

- **性能**：ACP 层零缓冲透传——TTFT 开销 < 5ms（与 `thincoder chat` 直跑对比）；流式事件逐块转发不做缓冲合并。重放逐块发送（协议无批量通道），超长会话加载有可见延迟——v1 接受。
- **兼容性**：协议以 schema v1 为准；最低客户端 = 支持 `initialize` 版本协商的任何 ACP v1 客户端（Zed 原生 ACP、JetBrains AI chat 插件、Paseo）。
- **可维护性**：ACP 模块与 agent 核心解耦（可插拔点默认空实现）；协议细节收敛在 src/acp/ 下，TUI/CLI 不感知。
- **会话资源**：每 session/new 一个 agent 实例；v1 不设上限。

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

## 12. 不做项（明确裁剪）

| 不做 | 理由 |
|---|---|
| `logout` | 无账号体系 |
| terminal 反向 RPC | shell 本地执行（kimi 同取舍） |
| unstable 扩展（elicitation/*、auth/configuration、buffer sync、inline-edit 预测等） | 正常客户端流程不依赖 |
| audio prompt | 无音频输入通道 |
| ACP 会话写存档为客户端管理生命周期 | 存档由 session.mjs 每回合末写；客户端只负责连接生命周期 |
| 依赖官方 SDK（TS/Rust/Kotlin 等） | 零依赖哲学；自写层可测（schema v1 是唯一权威） |
