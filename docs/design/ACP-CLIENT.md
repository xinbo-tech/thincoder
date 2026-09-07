# ACP Client Protocol 接入 — thincoder acp 设计 > 状态：**已实现**（2026-08-04，`src/acp/` 含 transport/bridge/session 三层，`test/acp.test.mjs` 39 测试全绿）。
> 目标：`thincoder acp` 子命令——通过 [Agent Client Protocol](https://agentclientprotocol.com/)
> 在 stdio 上暴露 thincoder agent，使 Zed / JetBrains AI Chat / Paseo 等 ACP 客户端可直接驱动。
> 实证来源：① **协议权威**——`agentclientprotocol/agent-client-protocol` 仓库 `schema/v1/schema.json`
> （稳定协议版本 **1**；方法名/事件类型以 schema 为准）；② kimi-code `packages/acp-adapter/`
> 实现矩阵与 docs（参考实现，其方法名与 schema v1 一致）；③ Zed 配置（kimi docs 实证）。
> **注意**：`@agentclientprotocol/sdk@0.23.0` 是 SDK 包版本，不是协议版本；kimi 文档中的
> "stable 10/12" 按其 SDK 表面统计，本设计以 schema v1 方法清单为准。 ## 1. 背景与目标 竞争评估（COMPETITIVE-CLI-2026.md）P0 项。thincoder 已有专有 VS Code 扩展；ACP 一次实现，
Zed / JetBrains / Paseo（桌面+Web+移动自托管编排器）全通——补上"编辑器接线"生态位。 **用户故事**（需求层，跟踪到 .thincoder/checklist.md）：
- 作为一个 **Zed 用户**，我想要在 IDE 里直接对话 thincoder（编辑器上下文自动注入），以便不用切换终端
- 作为一个 **JetBrains 用户**，我想要在 AI chat 里驱动 thincoder（工具审批弹在 IDE 内），以便保持编辑器焦点
- 作为一个 **多编辑器用户**，我想要一次终端登录、多处可用（会话/鉴权复用），以便不重复配置
- 作为一个 **工程师**，我想要 agent 的编辑以 IDE 原生 diff 呈现（fs 反向 RPC），以便审查更可靠 **具体收益**：
- 编辑器上下文自动注入（打开文件/光标/选区，无需手动 @）
- agent 编辑以 IDE 原生 diff 应用（fs 反向 RPC）
- 工具审批弹在 IDE 内（request_permission）
- 登录态/会话复用（一次终端登录，多表面可用） ## 2. 协议基础（ACP schema v1） - 传输：**NDJSON over stdio**（每行一个 JSON，JSON-RPC 2.0）
- 方向：IDE = client（发起请求）、agent = server（响应 + 反向 RPC 通知）
- 版本：`initialize` 内 `protocolVersion` 协商（当前稳定版本 `1`）
- 方法清单（schema v1 提取）：agent 侧 `authenticate / initialize / logout / session/{new,load,resume,list,delete,prompt,cancel,close,set_mode,set_config_option}`；client 侧 `fs/{read,write}_text_file / session/{update,request_permission} / terminal/{create,output,release,kill,wait_for_exit}`（terminal 为 client→agent 请求，agent 可实现可不实现） ## 3. 方法覆盖（thincoder 裁剪版） ### 3.1 Agent-side（IDE → agent）—— 11/13 | Method | 做 | 说明 |
|---|---|---|
| `initialize` | ✅ | 版本协商（protocolVersion 1）；响应示例：`{ protocolVersion: 1, agentInfo: { name: "thincoder", version: "0.13.0" }, authMethods: ["terminal"], capabilities: { fs: { read: true, write: true }, terminal: false } }` |
| `authenticate` | ✅ | 校验 `~/.thincoder/config.json` 存在已配置 provider；缺失 → `authRequired` 错误码 -32000 |
| `session/new` | ✅ | 接受 `cwd` / `mcpServers`；返回 configOptions（model/thinking/mode） |
| `session/load` | ✅ | 恢复 thincoder 会话存档（双线历史 JSON），经 session/update 重放历史 |
| `session/resume` | ✅ | 轻量变体（跳过历史重放） |
| `session/list` | ✅ | 枚举会话存档（unlimited 槽位，见 4.5） |
| `session/delete` | ✅ | 删除会话存档（schema v1 有、kimi 未实现——客户端清理会话的必需能力） |
| `session/prompt` | ✅ | 接受 text/image/resource 块；流式 `agent_message_chunk` |
| `session/cancel` | ✅ | 中断当前轮（复用 signal 中断机制） |
| `session/set_mode` | ✅ | plan/normal 模式切换（映射 configOption mode）；**与 `set_config_option` 冲突时 last-write-wins**——两路径收敛到同一内部模式状态 |
| `session/set_config_option` | ✅ | model / thinking 统一分发（映射 thincoder /model、/think 语义） |
| `session/close` | ✅ **no-op stub** | 返回成功空响应 `{}` + stderr 日志（"session {id} closed by client"）；进程由客户端负责终止；`logout` ❌（无账号体系）。进程退出时 pipe 自然关闭 | ### 3.2 Client-side reverse-RPC（agent → IDE）—— 5/9 | Method | 做 | 说明 |
|---|---|---|
| `session/update` | ✅ | 事件块见 4.3（含 agent_message_chunk / **agent_thought_chunk** / tool_call / tool_call_update / plan / usage_update / end_turn 等） |
| `session/request_permission` | ✅ | 工具审批 + 提问（askPermission 的 ACP 实现） |
| `fs/read_text_file` | ✅ | **仅内部用于 edit/apply_patch 的读回**（读 IDE buffer 当前内容再算 diff）——独立 `read` 工具保持本地（4.3），两者不冲突 |
| `fs/write_text_file` | ✅ | write/edit/apply_patch/delete 的写路径路由到 client（IDE diff 应用） |
| `terminal/create·output·release·kill·wait_for_exit` | ❌ | shell 走本地执行（与 kimi 相同取舍） | ### 3.3 其余（unstable 扩展：elicitation/*、auth/configuration、buffer sync 等）—— 不做 ## 4. 架构映射（thincoder 零依赖约束） ```
bin/thincoder.mjs ── "acp" 子命令 ──▶ src/acp.mjs │ ┌──────────────────┼──────────────────┐ ▼ ▼ ▼ transport.mjs session.mjs bridge.mjs (NDJSON JSON-RPC (AcpSession: (runAgent 事件桥 stdio 层, ~100 行 method → agent 映射) callbacks + askPermission)
``` ### 4.0 受影响文件清单 **新增**：
| 文件 | 职责 |
|---|---|
| `src/acp.mjs` | 子命令入口：装配 transport/session/bridge，SIGINT 优雅退出 |
| `src/acp/transport.mjs` | NDJSON JSON-RPC stdio 层（读行分发、写响应、错误码映射） |
| `src/acp/session.mjs` | AcpSession：方法 → agent 映射、会话生命周期 |
| `src/acp/bridge.mjs` | runAgent callbacks + 工具钩子 + 权限通道装配 |
| `test/acp.test.mjs` | mock 客户端全链路测试 | **修改**：
| 文件 | 改动点 |
|---|---|
| `bin/thincoder.mjs` | 注册 `"acp"` 子命令（`thincoder acp` → `src/acp.mjs`） |
| `src/agent/dispatch.mjs` | 工具循环注入 `toolRouter`（`runOne` 内 `item.tool.execute(...)` 调用前拦截）；**权限无需改**——`callbacks.onPermissionRequest` 通道已存在（113 行），ACP bridge 直接提供即可 |
| `src/session.mjs` | 新增 `deleteSlot(cwd, slot)` 导出（删除槽位文件 + manifest 条目）——**新能力，现有代码无删除函数**；会话枚举复用现有 **`listSlots(cwd)`**（返回 `{ slot, isActive, timestamp, date, messageCount, turnCount, firstMessage, activeProvider, updatedAt, updatedDate, title }`）——ACP `session/list` 映射：`id: String(slot)`、`updatedAt: updatedAt`、`cwd` 由 AcpSession 实例跟踪注入（listSlots 不含 cwd） | ### 4.1 传输层（自写，零依赖） ACP 官方 SDK（`@agentclientprotocol/sdk`）是 npm 依赖——违反零依赖哲学。自写精简层： - `readline` 逐行读 stdin → JSON.parse → 分发
- 响应/通知写 stdout（**严格只写 JSON**——日志全走 stderr，kimi log-guard 同款）
- 请求 ID 匹配 + 错误码映射：-32600（非法 JSON）/-32601（未知方法）/-32602（无效参数）/-32603（**内部错误**——未捕获异常返回合法 JSON-RPC 错误，不中断 NDJSON 流）/-32000（authRequired）
- SIGINT/SIGTERM → graceful drain（等待进行中请求结束再退出） ### 4.2 会话层（AcpSession） 每个 `session/new` 创建独立 agent 实例（复用 `createAgent`）：
- `cwd` → agent 工作目录（文件工具边界随之迁移）
- `mcpServers`（client 提供）→ 交给现有 MCP 子系统（本地 spawn stdio/http/sse 配置；**M2 范围**，M1 忽略并 warn）
- `configOptions` 映射表（`session/new` 返回 + `set_config_option` 接收，key 名与值类型对齐 schema v1）： | configOption key | 值类型 | thincoder 映射 |
|---|---|---|
| `model` | string（provider:model / provider / model） | `selectProviderModel(...)`（与 /model 同语义） |
| `thinking` | boolean | thinking 开关 |
| `mode` | enum: `plan` / `normal` | plan mode 切换（`current_mode_update` 通知） | ### 4.3 事件桥（bridge.mjs） runAgent 的 callbacks 已有 6 个钩子——直接映射： | runAgent 内部 | ACP 通知（session/update 事件块，schema v1） |
|---|---|
| `callbacks.onToken(text)` | `agent_message_chunk` |
| `callbacks.onReasoning` | **`agent_thought_chunk`**（schema v1 已实证——schema.json 的 const 枚举含 `agent_thought_chunk`；`callbacks.onReasoning` 已在 agent.mjs 使用中，非新增） |
| 工具开始/结果（tool loop 内） | `tool_call` / `tool_call_update` |
| plan mode 切换 | `plan` 事件块（schema v1 const 枚举含 `plan`——**M2 编码前对照 schema.json 定稿 payload 形状并注释**，与 `current_mode_update` 区分） |
| `callbacks.onUsage` | `usage_update`（token 统计） |
| 回合结束 | `end_turn` |
| 模型/模式变更 | `config_option_update` / `current_mode_update` |
| `callbacks.onCompress` | 压缩提示（保持透明） | **工具执行钩子**：`src/agent/dispatch.mjs` 工具循环注入可插拔点（**默认空实现，TUI/CLI 路径行为不变**）： 1. **fs 读写路由**——经 **runAgent callbacks 扩展**注册（与 onPermissionRequest 同通道）： ```js // callbacks.toolRouter —— ACP bridge 提供，TUI/CLI 不传（默认无路由） toolRouter: (toolName, args) => Promise<{ handled: boolean, result?: string }> // dispatch.mjs runOne 中 item.tool.execute(...) 调用前： // 有 toolRouter → 先试路由；handled=true 用 result 作为工具结果，handled=false 走本地执行 ``` - **插入点**：`src/agent/dispatch.mjs` 的 `runOne` 内、`item.tool.execute(...)` 调用前（约 155 行）：`if (callbacks.toolRouter) { const r = await callbacks.toolRouter(name, args); if (r?.handled) { result = r.result; skip execute } }` - read/glob/grep/ls：**不路由**（本地读，性能优先） - write：`fs/write_text_file` 全量写（构造新内容直接写，无需读回） - edit/apply_patch：**先 `fs/read_text_file` 读回 client 当前全文 → 本地应用现有 diff 逻辑（复用 tool 实现）→ `fs/write_text_file` 全量写回**——读回保证与 IDE buffer 一致（防止客户端已改过文件），IDE 呈现 diff - **已知风险（TOCTOU）**：读回与写入之间用户在 IDE 改了 buffer → 写入静默覆盖用户改动。缓解：IDE diff 审查（用户在保存前可见并拒绝）；后续可选演进：写入带 base revision 校验（协议不稳定面，非 v1 必需）。**记录为接受风险** - delete：**不路由——本地执行**（schema v1 无 fs/delete 方法；写空依赖客户端解释约定，不可靠。kimi 同款：AcpKaos 仅路由 read/write，delete 走本地。结果返回 + 客户端收到 session/update 后自行刷新） - 工具结果返回客户端确认后的写入结果
2. **审批**——**复用现有 `callbacks.onPermissionRequest` 通道**（dispatch.mjs:113 已存在，不存在→deny）： - ACP 模式：bridge 提供 `onPermissionRequest = (name, args) → session/request_permission`（请求带工具名+格式化参数，等待 `allow_once`/`deny_once` 响应） - 非 ACP 模式：TUI/CLI 各自现有实现（askPermission 等，**完全不动**——`src/cli/permission.mjs` 零耦合） ### 4.4 鉴权与配置 - 复用 `~/.thincoder/config.json`：provider 已配置 → `authenticate` 通过；未配置 → 返回 authRequired，客户端引导终端先跑 `thincoder` 完成 setup-wizard
- `initialize.authMethods` 声明 `terminal`（与 kimi 同款） ### 4.5 会话持久化 - `session/load`/`resume` 读 thincoder 会话存档（src/session.mjs，双线历史 JSON）
- **重放范围**（session/load）：人读线全量消息按序重放；**role → 事件块映射**（schema v1）： - `role: "user"`（含多模态）→ `user_message_chunk` - `role: "assistant"` 无 tool_calls → `agent_message_chunk` - `role: "assistant"` 含 tool_calls → `tool_call` 事件（IDE 显示工具调用卡片） - `role: "tool"` 结果 → 跟随其 assistant 消息的 tool_call_update/结果文本 - 机读注入（reminder/interrupt/transient）**不重放**——过滤规则与 session.mjs 存档同款：`m.transient === true`（interrupt/reminder 主机制，session.mjs:307 `!m.transient && !isLegacyTransient(m)`）+ `LEGACY_TRANSIENT_PREFIXES` 两前缀（`[System reminder: working directory snapshot:` / `[Relevant memories from previous sessions`）——**`[User interrupt:` 由 transient 属性覆盖，不在 LEGACY 前缀里**（代码实证） - **字段名**：运行时用 `agent._fullHistory`；从磁盘读用 `data.history`（saveSession 写入源为 `_fullHistory ?? history`）
- `session/resume`：不重放历史，仅恢复 cwd + configOptions（model/thinking/mode）+ 当前会话上下文
- `session/list` 枚举存档槽位——**槽位数量 unlimited（src/session.mjs 现有语义："Each project keeps unlimited session slots"），按实际存档全量返回**（更正早期"5 槽位"错误说法）。**sessionId ↔ 槽位映射**：ACP sessionId = 槽位号（数字字符串，如 `"3"`），list 返回 `{ id: "3", cwd, updatedAt }`；load/resume/delete 按 id 解析槽位
- **cwd 解析（session/list、load、resume）**：thincoder 单 cwd 模型——ACP 进程由 IDE 在项目目录启动，**进程 cwd = 默认工作目录**；`session/new` 带 cwd 参数则尊重之（会话首次建立时固定，之后该进程内所有会话共用同一 cwd）。跨进程/多 cwd 会话不在 v1 范围
- `session/delete`：新增 `deleteSlot(cwd, slot)` 导出（删槽位文件 + manifest 条目）——**新能力**，现有 session.mjs 无删除函数。**删除活跃会话语义**：仅删持久化存档；活跃 in-memory 会话不受影响（客户端如需停止应另行 close/terminate）
- **重放性能**：逐块发送（客户端异步消费，协议本身无批量通道）；超长会话（数千消息）加载会有可见延迟——M3 视实测决定是否批量压缩，v1 接受
- **会话资源**：每 `session/new` 一个 agent 实例——客户端可用 `session/delete`（清存档）+ close/terminate（释放进程）管理资源；v1 不设上限，未来如需可加（记录） ### 4.6 非功能性需求 - **性能**：ACP 层零缓冲透传——TTFT 开销 < 5ms（与 `thincoder chat` 直跑对比，实测基线）；流式事件逐块转发不做缓冲合并
- **兼容性**：协议以 schema v1 为准；客户端最低要求 = 支持 `initialize` 版本协商的任何 ACP v1 客户端（Zed 原生 ACP、JetBrains AI chat 插件、Paseo）——**具体最低版本不预设**（避免编造），M3 实测后在集成指南记录"已验证版本"
- **鉴权门控**：**session 级 `authenticated` 标志**——除 `initialize`/`authenticate` 外所有方法需先鉴权通过；未鉴权调用 → -32000（测试 8 ③ 已覆盖）
- **排队机制**：并发 prompt 用 **per-session FIFO promise 链**（无界队列）——后到 prompt 挂到链尾，前一轮 `end_turn` 后执行；客户端建议等 `end_turn` 再发下一轮
- **可维护性**：ACP 模块与 agent 核心解耦（可插拔点默认空实现）；协议细节收敛在 src/acp/ 下，TUI/CLI 不感知
- **安全**：见第 5 节（默认 deny、AUTO 关闭、stdout 纯净 JSON） ## 5. 安全语义 - 副作用工具：默认 **deny**，`request_permission` 必现（AUTO 配置在 ACP 会话中默认关闭，除非 config 显式开启）
- 工具边界：仍受 cwd 约束（现有 confine 逻辑不变）
- 写路径走 IDE buffer：IDE 的 diff 审查是比 CLI diff 预览更强的保障
- 日志隔离：stdout 纯净 JSON，stderr 承载日志——防止协议污染（kimi log-guard 同款） ## 6. 测试策略 `test/acp.test.mjs`——**mock ACP 客户端**驱动（直接 import transport/session 层，避免子进程时序脆弱）： | # | 场景 | 输入（mock 客户端发送） | 预期输出 |
|---|---|---|---|
| 1 | 握手全链路 | `initialize`（protocolVersion 1）→ `authenticate`（terminal） | initialize 返回 agentInfo+能力矩阵；authenticate 通过（config 已配置）/ -32000（未配置） |
| 2 | prompt 流式 | `session/new {cwd}` → `session/prompt {text}`（mock LLM 短回复） | 依次收到 `agent_message_chunk` 事件 → 最终 `end_turn` |
| 3 | 工具审批回环 | prompt 触发 bash → mock 收到 `session/request_permission`（含工具名+参数）→ 回 `allow_once` | 审批通过后收到 `tool_call`/`tool_call_update` → 工具结果 → `agent_message_chunk` 继续 |
| 4 | fs 反向 RPC | write 工具触发 | mock 收到 `fs/read_text_file`（旧内容）→ 回内容 → 收到 `fs/write_text_file`（新内容）→ 回确认 → write 工具结果 = 客户端确认值 |
| 5 | cancel 中断 | prompt 进行中发 `session/cancel` | 当前轮停止，后续无事件 |
| 6 | 会话存档 | `session/list` → `session/load {id}` → `session/delete {id}` → `session/load {deleted-id}` | list 返回全部槽位（unlimited）；load 重放人读线消息（无机读注入）；delete 后槽位释放、list 不再出现；**再 load 已删/不存在 id → 错误**（-32602） |
| 7 | resume 与配置 | `session/resume {id}`（跳过重放）→ `session/set_config_option {configId:"mode", value:"plan"}` → `session/set_mode {mode:"normal"}` | resume 恢复 cwd+configOptions 无历史事件；set_config_option/set_mode 生效并发出 `current_mode_update` / `config_option_update`；**resume 不存在 id → 错误** |
| 8 | 错误映射 | ① 非法 JSON → -32600；② 未知方法 → -32601；③ 未鉴权 prompt → -32000（session 级 authenticated 门控）；④ 畸形 mcpServers → 忽略+warn（不报错）；⑤ 活跃回合中再发 prompt → **排队串行**（per-session FIFO 链）；⑥ `session/close` → 成功 `{}` + stderr 日志 | 每项独立断言，错误码符合 JSON-RPC |
| 9 | 边界 | ⑦ 损坏会话文件 load → 错误而非崩溃；⑧ `fs/write_text_file` 客户端返回错误 → 工具结果透传错误；⑨ delete **活跃**会话 → 仅删存档，活跃会话继续（见 4.5 语义）；⑩ 单轮多工具并发 → 各自 tool_call 事件齐全 | **⑦⑧ 在 M3 完成**（基础可靠性）；⑨⑩ 在 M4 | ## 7. 不做项（明确裁剪） | 不做 | 理由 |
|---|---|
| `logout` | 无账号体系 |
| terminal 反向 RPC | shell 本地执行（kimi 同取舍） |
| unstable 扩展（elicitation/*、auth/configuration、buffer sync、inline-edit 预测等） | 正常客户端流程不依赖 |
| audio prompt | 无音频输入通道 |
| ACP 会话写存档 | 客户端管生命周期 |
| 依赖官方 SDK（TS/Rust/Kotlin 等） | 零依赖哲学；自写层 ~100 行可测（schema v1 是唯一权威） | > 注：`session/close` **不在不做项**——它是 ✅ no-op stub（见 3.1）：返回 `{}` + stderr 日志，资源由进程退出释放。 ## 8. 决策记录 | 决策 | 理由 |
|---|---|
| 自写 NDJSON JSON-RPC 层 | 零依赖是项目宪法；SDK 依赖会破坏 npm 安装的零依赖承诺 |
| fs 反向 RPC 全做（含 write 类） | "编辑器接线"是 ACP 核心体验——diff 就地显示是用户感知最强的点 |
| 权限默认 deny + AUTO 关闭 | 安全第一；ACP 会话在 IDE 内，审批弹窗成本低 |
| 复用终端鉴权 | 登录一次多表面（kimi 验证过的模式） |
| 新文件 src/acp.mjs + bridge 可插拔点，不改 runAgent 主路径 | 最小侵入——ACL 是独立表面，不污染 TUI/CLI 路径 | ## 9. 里程碑 - M1：传输层 + initialize/authenticate/session/new + prompt 流式（无工具）——Zed 能对话
- M2：工具调用 + request_permission + fs 反向 RPC——**Zed 能单次干活**（单会话内工具+审批+diff；会话持久化在 M3）
- M3：session/load/resume/list/delete + config_options + cancel——**日常使用闭环**（会话持久化+配置）
- M4：测试完备 + 文档（ides.md 集成指南）——发布 0.13.0
- **checklist 对应**：`.thincoder/checklist.md`（用户故事 1-4 + M1-M4 已播种）
