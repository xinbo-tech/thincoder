# MCP 客户端设计（thincoder）

> 权威源：`thincoder-core/mcp.mjs`（会话/探活/建连）+ `thincoder-core/mcp/transport-*.mjs`（stdio/HTTP/WS 传输）+ `src/tui/cmd-mcp.mjs` + `src/tui/cmd-mcp-form.mjs`（/mcp 交互）+ `src/config.mjs`（reloadMcpFromDisk）+ `src/cli/make-agent.mjs`（启动装配）。
> 本文档描述 MCP 客户端的**当前设计**——工具如何动态展开、如何建连/热插拔、如何配置、如何探活、失败如何表现。跨文档已接管的主题只留指针，不复制。
> 关联权威：`TOOLS.md` §8（MCP 展开并入统一工具 schema）、`AGENT-LOOP.md`（工具调度）、`PROVIDER.md`（模型/聊天调用链）。


> 需求层（2026-09-10 拆分批）：本板块需求见 `../requirements/MCP.md`——本档保留设计与测试细节。

## 1. 权威源与目标

### 1.1 定位

MCP（Model Context Protocol）客户端把外部 MCP server 的 `tools/list` 工具**动态展开**为独立原生工具（`{server}_{tool}` 前缀、完整 inputSchema、execute 直调 `tools/call`），并入 `agent.tools`，经统一 OpenAI function-calling schema 暴露给模型。支持三种传输：**stdio**（本地子进程）、**HTTP**（Streamable HTTP + SSE）、**WebSocket**。

### 1.2 当前态

- 工具展开机制两端（CLI / VS Code）语义一致，**网关式 `mcp` 工具已废弃**（2026-08 从 builtinTools 移除），无残留引用。
- 模型不再手动 `connect → list → call` 三层路由，也不需任何 `mcp` 工具指引——已连接 server 的工具以原生工具形式直接可调用、可并行、schema 完整。
- `/mcp` 是唯一的配置/连接管理入口（v2 字段 picker 表单，见 §8）。

### 1.3 术语

| 词 | 含义 |
|---|---|
| server / config | 一份 MCP server 配置（一个 name + 一种传输端点） |
| session | 一次活的连接（registry 键控项，含 transport 与展开工具） |
| transport | 一种传输协议实现（stdio/http/ws） |
| postOnly | Streamable POST-only 模式（server 不支持 GET SSE） |
| fingerprint | config 的 JSON 归一指纹，用于识别配置变更触发重连 |

## 2. 工具展开（D1）

`connectMcpServer(config)` 成功后，把 server `tools/list` 返回的每个工具包装为独立工具并入 `agent.tools`。展开逻辑在 `thincoder-core/mcp.mjs` `buildTools`：

```js
const prefix = config.name ? `${config.name}_` : "mcp_"
for (const t of mcpTools) {
  // name 清理 + 空名/碰撞防御
  out.push({
    name: sanitizeToolName(prefix + t.name),
    description: typeof t.description === "string" ? t.description : `MCP tool: ${t.name}`,
    parameters: (t.inputSchema && typeof t.inputSchema === "object")
      ? t.inputSchema
      : { type: "object", properties: {} },
    readonly: false,
    async execute(args, ctx) { /* 见 §3 工具调用 */ },
    _mcpTransport: transport,
    _mcpName: config.name,
  })
}
```

**命名**：前缀 = `` `${config.name}_` ``；config 无 name 用 `mcp_`；`sanitizeToolName` 把 `[^a-zA-Z0-9_-]` 清成 `_`、截断 64 字符。碰撞（同 server 工具重名/sanitize 后重名）追加 `_2`、`_3`… 去重；空名或清成裸 `mcp_` 的工具跳过。

**守卫**（2026-08 会诊 P6）：description 非字符串 → 回退 `` `MCP tool: ${t.name}` ``；inputSchema 非对象 → 回退 `{ type: "object", properties: {} }`。

**扩展元字段**：每个展开工具携带 `_mcpTransport`（所属 transport）与 `_mcpName`（server 名）——供连接状态展示、`removeMcpTools`/`closeAllMcp` 按 server 归类。

### 2.1 网关废弃（D3）

旧 `mcpTool`（connect/list/call/disconnect 四动作网关）**已废弃移除**——模型不再经它手动 `connect → list → call` 三层路由。该网关的 list/call/disconnect 能力在 **VS Code 镜像**保留为**内部 API**（`mcpListTools`/`mcpCallTool`/`mcpDisconnect`——面板/工具展开用，不暴露给模型）。

**CLI 侧从无网关**——MCP 工具始终经 `buildTools` 展开为原生工具（§2），无此中间层。连接状态展示（`/mcp` 列表与面板 MCP 状态段）不变。

## 3. 工具调用（execute 契约）

展开工具 execute 直接经 transport 调 MCP `tools/call`：

```js
async execute(args, ctx) {
  const transport = await ensureAlive(session)   // 拿活连接；死则等/触发重连（§9.4）
  const resp = await transport.send("tools/call", { name: t.name, arguments: args }, ctx?.signal)
  if (resp.error) throw new Error(`MCP tool "${t.name}": ${resp.error.message}`)
  if (resp.result?.isError)
    throw new Error(`MCP tool "${t.name}": ${extractMcpText(resp.result.content) || "(server reported an error)"}`)
  return truncateMcpOutput(extractMcpText(resp.result?.content ?? [])) || "(no output)"
}
```

**契约句（逐字）**：
- `resp.error` → 抛 `` `MCP tool "${t.name}": ${resp.error.message}` ``。
- `resp.result?.isError` → 抛 `` `MCP tool "${t.name}": ${text || "(server reported an error)"}` ``。
- 成功返回 = content 序列化后 join `"\n"`；序列化为空 → `"(no output)"`。

**content 序列化**（`extractMcpText`）：数组逐项——`text` 取 `.text`；`resource` → `` `[resource: ${c.resource?.uri}]` ``；其余 → `JSON.stringify`。非数组元素防御：字符串直接返回、非对象 `JSON.stringify`。

**输出截断**（`truncateMcpOutput`）：32 000 字符上限，超出 → 前 32 000 字符 + `"\n[… truncated: N chars omitted]"`（N = 超出的字符数），防 server 回超大响应撑爆上下文。

**上层中断**：`ctx?.signal` 传 `send` 第 3 参（底层取消，pending 即刻作废）并经 `sendWithSignal` 竞速——挂死的 MCP server 不得拖住整轮 turn。

## 4. 连接装配与热插拔

### 4.1 启动装配（make-agent）

顶层 agent 装配（`src/cli/make-agent.mjs`）时批量连接 `config.mcp.servers`：

- 读取项目级 `.mcp.json`（标准 MCP 客户端约定）：`mcpServers` 为**对象**形态时并入 `mcpServers`——`config.json` 里同名 server 优先；数组形态（非规范）跳过并记录 `[mcp] .mcp.json: mcpServers must be a plain object, got array — skipped`。
- 并发连接：`Promise.allSettled(mcpServers.map(connectMcpServer))`。
- **失败不阻塞**：死 server 只记 warning（`MCP server "<name>" failed to connect: <reason>`，`agent._mcpWarnings` 携带，下一条 user 消息注入提醒），其余 server 照常。
- 成功展开的工具并入 `agent.tools = [...baseTools, ...mcpTools]`。

### 4.2 幂等连接（registry 键控）

`connectMcpServer` 幂等：registry（`_sessions`，serverName → session，模块级存活）已存在**同 name 活连接且 fingerprint 一致** → 直接复用已展开工具，不重建（重复 add 同一 server 不产生双实例）。

fingerprint = config 关键字段的 `JSON.stringify` 归一（command/args/url/wsUrl/env/headers/token）。**config 变更**（fingerprint 不一致）→ 主动关闭旧连接（不触发 onDead 重连）+ 丢弃 session + 重建。

### 4.3 每轮重建与热插拔

每轮 runAgent 重新装配 tools 数组——registry 状态变化（`/mcp` 连接/断开/重连）天然在下一轮生效。同一进程内已连 server 的展开工具**不因重建而丢失**（幂等复用）；registry 变更经重新装配并入本轮。

### 4.4 生命周期收口

- `closeAllMcp(agent)`：退出时关闭 agent.tools 上全部 `_mcpTransport` 对应 session。
- `removeMcpTools(agent, serverName)`：把 `_mcpName === serverName` 的工具移出 agent.tools 并关闭该 session（`/mcp remove` 同语义）。

## 5. 配置机制

### 5.1 config 形态（按传输）

```js
stdio:  { name, command, args?, env? }
HTTP:   { name, url, token?, headers? }
WS:     { name, wsUrl, token?, headers? }
```

- name 是唯一键控名（不可改，`/mcp edit` 无 name 行）。
- stdio 端点 = `command`（+ `args` 数组）；HTTP = `url`；WS = `wsUrl`。
- `headers`/`env` 为键值对象。
- `token` 为**一等可选字段**（HTTP/WS），见 §5.2。
- 项目级 `.mcp.json` 亦可提供 server（见 §4.1），但 `/mcp` 管理入口操作的仍是 `config.json` 的 `mcp.servers`。

### 5.2 token 一等字段（F6）

`config.token` 是一等可选字段（HTTP/WS）。**合成规则**：client 自动合成 `headers.Authorization = "Bearer " + token`——**仅当 headers 未显式含 Authorization 时**（显式 headers 优先，向后兼容）；合成发生在传给 transport 前，**不写回 config**。

- HTTP：`Authorization` 以 HTTP 请求头发送。
- WS：Node 内置 WebSocket（undici）无法自定义请求头——`Authorization` 经 **subprotocol**（`bearer.<token>`）传递（`withAuthToken`），不注入 URL query（防代理/网关日志泄露凭证）。
- **fingerprint 计入 `token` 字段**：`/mcp edit` 改 token → 指纹变更 → 旧连接主动关闭重建。

**存储**：token 明文存 `config.json`（与既有 `headers.Authorization` 同级敏感度，不新增暴露面）；不引入 keychain（超范围，见 docs/TODO 可选记项）。

### 5.3 headers/env 键值对输入（逗号分隔）

headers/env 的键值输入统一为**逗号分隔**（`key=value, key2=value2`，value 可含空格）。该解析取代旧的空格 `split(/\s+/)`——后者把 `Authorization=Bearer xxx` 截成 `"Bearer"`（token 丢失），故定此规。

字段输入语义（`/mcp` 表单，见 §8.3）：
- 空输入 = 不变；
- `-` = 删除可选字段（token/headers/env/args）；
- `key=`（空 value）= 删除该 header/env 项；
- required 字段（name/url/wsUrl/command）拒绝 `-`（不许删空）。

## 6. 传输层与活性（isAlive 三态）

### 6.1 HTTP/SSE transport（thincoder-core/mcp/transport-http.mjs）

`httpTransport` 实现 Streamable HTTP + SSE。GET SSE 不可用（405/不支持）时降级为**纯 Streamable POST 模式**。

**关键活约束（F1/F2）**：
- 增 `postOnly` 标记 + `markPostOnly()`；建连降级分支（openSSE catch）调用之。
- **`isAlive: () => !closed && (eventSource != null || postOnly)`**——降级后 `eventSource` 恒 null，但 POST-only server 是活连接，不得因 `eventSource == null` 误判死（曾致 `ensureAlive` 误判死连接 → 无意义重连循环，报 "reconnect failed after 4 attempts"）。
- 主动 close（`closed`）与 legacy SSE 流真实断开仍判死 + 走重连——三态不弱化真实故障自愈。
- legacy SSE：endpoint 事件流正常 → `fireDead`（意外断流）→ onDead 触发重连；连接死亡通知由 `fireDead`/`onDead` 承载。

**Streamable POST 规范路径**（会诊 P4）：POST → 202 → GET SSE 回包。所有通道统一先注册 pending：直接 JSON body / SSE 流 / 202 等待都经 pending resolve；响应带 `Mcp-Session-Id` 记入后续请求头。legacy 模式违规 server（POST 直接回 JSON-RPC body）兼容解析。

### 6.2 stdio transport（thincoder-core/mcp/transport-stdio.mjs）

本地子进程 `stdioTransport(command, args, env)`——env 合并到 `process.env` 之上。JSON-RPC over stdio。

### 6.3 WS transport（thincoder-core/mcp/transport-ws.mjs）

`wsTransport`：`isAlive: () => !closed && ws?.readyState === WebSocket.OPEN`；连接死亡经 `onDead`/`fireDead`；认证经 subprotocol（§5.2）。上层 signal abort 即刻作废 pending + 发 `notifications/cancelled`。

### 6.4 活性判定汇总

| transport | isAlive | 死亡通知 |
|---|---|---|
| HTTP legacy SSE | `!closed && eventSource != null` | 流断 → fireDead |
| HTTP postOnly | `!closed && postOnly`（恒真至 close） | 无流可断，不自发 fireDead |
| WS | `!closed && readyState === OPEN` | close/error → fireDead |
| stdio | 进程退出 → error/close | fireDead |

## 7. 探活（probeMcpServer）

`thincoder-core/mcp.mjs` 导出的 `probeMcpServer(config)` 对一份配置做**一次性探活**：

```js
createConnectedTransport(config)   // initialize + tools/list（含 token 合成与 postOnly 降级链）
+ 计时
→ { ok, toolCount, latencyMs, error }
finally transport.close()          // closed=true 防 onDead 重连触发
```

**零副作用契约**：不进 `_sessions`、不动 agent.tools、无 onDead 挂钩、探完必关；**不复用 `connectMcpServer`**（避免污染 session 幂等表）。initialize 与 tools/list 同受 `INIT_TIMEOUT_MS`（30s）约束（probe 延迟统计有界）。`_sessions` 导出只读供 probe 零副作用断言。

调用点：`/mcp test [name]` 与 add/edit 保存前的探活确认环（§8.4）。

## 8. /mcp 配置交互

`/mcp` 是配置/连接管理入口（CLI）。配置来源在每轮菜单循环边界**从磁盘重读**（§8.5），保证 agent 代配后菜单可见。

### 8.1 列表即菜单（F7/D-2）

主菜单 = server 列表本身：

- 每行 `●/○ name (端点)`（连接态 `●` + `— N tools`）——`● name (https://…) — N tools` 形态；
- 行尾对账标记 `⚠ disk changed`（disk 与内存 fingerprint 不一致的已连接 server，§8.5）；
- 顶部固定 agent 代配提示行：复杂配置可让 agent 直接编辑 `~/.thincoder/config.json` 的 `mcp.servers`，改完 `/mcp connect` 生效；畸形磁盘配置时另加 `⚠ disk config unreadable — showing in-memory state` 提示行；
- 底部 `+ Add server`、`↻ Refresh`（重开菜单即重读磁盘）；
- 选中某 server 行 → per-server 子菜单：`Edit config / Test connection / Reconnect / Remove`。

**编辑/测试/重连/移除不再是主菜单项**——消灭"四个操作各自弹一次 server picker"的重复。server 行 action 用 `@name:` 命名空间，与 `add`/`refresh` 保留动作永不撞名（server 可叫 "add"/"refresh"）。Esc 退出 / 子菜单 Esc 回主菜单。

### 8.2 直达参数

`/mcp list` │ `add` │ `http|ws|stdio|ai` │ `edit [name]` │ `test [name]` │ `remove [name]` │ `connect [name]`——带 name 直达参数路径保留，语义与旧实现逐字一致（无该 name → `[mcp] no server named "<name>" (...)`；空列表 → `[mcp] no MCP server configured`）。

### 8.3 字段 picker 表单（v2，edit/add 统一）

`fieldPicker`（`cmd-mcp-form.mjs`）是 edit 与 add 共用的**字段选择表单**：

- picker 列可编辑字段行（label + 当前值打码/摘要）+ 末行 `✓ Save & test`；
- 字段行：HTTP `HTTP URL / Token / Headers`；WS `WebSocket URL / Token / Headers`；stdio `Command / Args / Env`。**edit 无 name 行**（name 不可改）；add 含 `Name` 行 + 现有 name 重复检查；
- 字段输入提示 `(current: …)`：token 打码（`maskToken`）、headers/env 列 `key=value, …` 键值对、args 空格串接、空值 → "none"；
- **add 与 edit 同一表单机制**：add 空 entry 起、必填字段 `(required)` 标注、Save 时校验必填非空 + name 重复；一处实现两处复用；
- 游标循环：一次可连改多个字段；中间 Esc（空输入）回 picker **不丢已改值**（工作副本 `cloneEntry`，取消不污染原配置）；
- AI 生成（`ai`）降 transport picker 末位（HTTP / WebSocket / stdio / AI），文案不再首推。

**必填校验**（F3b）：HTTP = name+url；WS = name+wsUrl；stdio = name+command。未满足 → `[mcp] Missing required: <Fields> — fill before saving` 留在 picker；name 重复 → `[mcp] "<name>" already exists`。

### 8.4 保存前探活确认环（D-Q1）

向导收集完成后，先 `probeMcpServer` 当场探活，再决定是否保存：

- **预览表**（`showPreview`）：name / transport / endpoint / token（遮蔽）/ headers 键列表 / env 键列表 + 探活报告同屏；
- token 遮蔽（`maskToken`）：len > 12 显示前 4 字符 + `…`，否则全遮（`•` 重复）；
- 探活成功 → 报告 `✓ N tools, Xms` → **直接保存**（persistRaw + connectServer，无任何问句）；
- 探活失败 → 报告 `✗ <错误>` → 错误行 `[mcp] Probe failed: <错误> — fix it in the form` → **回同一 fieldPicker 改字段复 probe**（只重输失败字段，其余保留）；**无任何保存通道**（save-anyway 整个废除——失败配置零保存，不落盘）；
- 取消仅剩表单层 Esc（放弃 = 不保存）；edit 取消 → `[mcp] Edit cancelled — nothing saved`。

**约束行为**：add 的 stdio 同理（command/args/env 失败回表单）；AI 生成的 entry 同走预览+探活+确认环（字段不完整可在表单补齐）；编辑保存后自动重连（`connectServer`）。

### 8.5 agent 代配（磁盘重读 + fingerprint 对账）

用户可让 agent 用 edit/write 工具直接改 `config.json` 的 `mcp.servers`，然后 `/mcp` 菜单生效。机制：

- **`reloadMcpFromDisk(agent, path?)`**（`src/config.mjs`）：读磁盘 config.json → 合并进 `agent.config.mcp`（仅替换 mcp 段）。`path` 第二参供测试注入（生产缺省 = 默认 `~/.thincoder/config.json`）。**调用点收敛到菜单打开边界**（主菜单循环顶部 + `↻ Refresh`）；`getServers()` 保持纯读不加副作用。
- **对账规则**：disk 与内存 registry 按 fingerprint 对账——disk 删除/变更的**已连接** server：连接保持不断（避免误断正在用的），内存保留该行 + 持续标 `⚠ disk changed`（诚实报告真实漂移，直到 reconnect 回写或 remove 显式解决）；disk **新增**的 server 不是 drift（无 ⚠）；未连接且被 disk 删除的 server 随磁盘消失。
- **畸形 config.json**（JSON 解析失败/`mcp.servers` 非数组）→ 重读失败回退内存态 + 菜单提示行告知 disk 配置不可读。
- **config.json 文件丢失**：保留内存 mcp servers（与畸形回退同策略——不因文件消失静默清空用户配置）。
- **防环**：persistRaw 落盘后重读 fingerprint 一致 → 无 ⚠ 标记（幂等）。
- **写冲突已知取舍**：同一时刻单写者假设——要么用户经菜单保存、要么 agent 改盘（不做双写合并），属既有 config 写入模型，仅记录不引入新机制。

### 8.6 保存/重连输出

- add：`[mcp] Connecting <name>...` → `` `❯ MCP` `` label + `<name> (<endpoint>) connected, N tools:` + 每工具一行 `  <tool>: <description 前 100 字符>`。
- reconnect：`[mcp] Reconnecting <name>...` → `<name> reconnected, N tools available.`。
- connect 失败：`[mcp] <name>: <error> (config saved, retry after restart)`（add——已保存，重启后自动连）。
- remove：`[mcp] <name> removed`；edit 保存：`[mcp] <name> updated`。

持久化（add/edit/remove 的 persistRaw）在磁盘 `raw.mcp.servers` 上按 name 原位替换/删除，**保持数组序**（edit 不改 name、不重排；内存态同步写）。

## 9. 失效与失败语义

### 9.1 连接失败不阻塞

启动/装配/重连失败不阻塞对话：warning 记录（面板/提醒注入），下一轮可再试；展开工具失败抛错 → dispatch 捕获 → 模型见 `Error: …`（与内置工具一致）。

### 9.2 postOnly 失效语义（F7）

postOnly 模式已知限制：isAlive 恒真至 close、无流可断、**不自发 fireDead**。**会话过期/端点死亡不自动重连**——表现为 per-call 错误（`tools/call` 返回错误/超时透传给模型）。手动恢复路径 = `/mcp reconnect`（重新 initialize 取新 session）。

### 9.3 legacy 断流重连（后台退避）

legacy SSE 流真实断开（`fireDead`）→ `scheduleReconnect` 后台退避重连：延迟表 `[1000, 2000, 4000, 8000]`ms 四轮；成功替换 `session.state.transport`（tools 闭包动态引用 transport——**agent.tools 无需重建**即自愈）；四轮耗尽 → `[mcp] <name> reconnect failed after <N> attempts: <reason>`。

重连失败静默（下次 execute 前置检查再试）。同 name 重连进行中不复发（`_reconnecting` 去重）。

### 9.4 ensureAlive（执行前活性检查）

展开工具 execute 前 `ensureAlive(session)`：transport 活 → 直接用；死 → 等/触发一次重连；重连失败 → 抛 `` `MCP server "<name>" is unavailable (reconnect failed)` `` 透给模型。postOnly server 由 §9.2 覆盖（isAlive 恒真，走 per-call 错误）。

### 9.5 握手失败防泄漏（评审 #7 活约束）

`connectMcpServer` 对 `createConnectedTransport` 失败 catch 中 `transport?.close()`——openSSE 降级成功但 POST initialize 失败时不留悬挂流（否则 SSE reader/请求悬挂泄漏）。probe 的 `finally close()` 同理。

## 10. 验收契约

- 展开工具：命名 `{server}_{tool}`、schema 完整、execute 直调 `tools/call`——行为两端一致。
- 模型无需 `mcp` 工具即可直接调用任何已连接 server 的工具（schema 完整、可并行）。
- 面板/菜单连接/断开在下一轮生效（热插拔）；失败不阻塞对话。
- 子代理：coder 继承父 agent 全部工具（含 MCP 展开工具）；explore/plan 只读过滤滤掉（readonly: false，无需额外处理）。
- POST-only server 全链路（405 降级 → POST 初始化成功 → isAlive true → 无 reconnect failed）不误判死。
- probe/test 零副作用：不进 `_sessions`、不动 agent.tools、探完必关。
- 探活成功零问句直接保存；探活失败报错回表单、无任何保存通道。
- edit 只动所选字段；name 不可改；指纹变更触发重连。
- `/mcp` 菜单打开即重读磁盘；agent 改 `config.json` 后菜单可见可连。

## 11. 变更记录

> 历史逐批变更流水（落地清单/需求/测试表/评审 #N/验收勾销）折叠为一行注记；活机制正文见上文对应节，历史细节不再展开。

- 2026-08：**工具展开统一 + 网关废弃**（D1-D6）——两端动态展开对齐 CLI，`mcpTool` 从 builtinTools 移除。→ §2/§3/§10。
- 2026-09-01：**Streamable POST 误判修复 + token 一等字段 + edit/test 探活入口**——postOnly/isAlive 三态、probeMcpServer、token 合成、逗号分隔 kv、握手防泄漏。→ §5/§6/§7/§9。
- 2026-09-01：**/mcp 菜单交互重构 v1**（列表即菜单雏形、保存前探活、逐字段预填 edit、agent 代配 reloadMcpFromDisk）。
- 2026-09-02：**v2 字段 picker 表单**——edit/add 统一 fieldPicker（v1 的 collectEntry/pickRetryField/逐字段预填重问废除）；`cmd-mcp-form.mjs` 拆分落点；AI 降末位。→ §8。
- 2026-09-02：**save&test 确认问句废除（D-Q1）**——探活成功直接保存（无问句）；探活失败回表单；save-anyway 整个废除（失败零保存通道）。→ §8.4。
- 2026-09-07：文档从"逐批变更档案"重写为人类可读当前态（本版）。
