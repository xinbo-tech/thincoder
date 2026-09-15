# MCP 客户端设计（VS Code 扩展实现）

> 板块：MCP。本文件描述 VS Code 扩展侧 MCP（Model Context Protocol）客户端的**当前设
> 计**——server 工具如何动态展开为原生工具、如何配置与在设置面板管理、如何建连/热插拔/
> 探活、失效如何表现。与 CLI 同名文档对应同一机制板块——各端独立实现，内容以本端代码为
> 准（CLI 有 `/mcp` TUI 命令交互，本端无——配置/连接全在 **Settings 面板 MCP 页**）。
> 权威源（W7 迁移后现体）：核 `thincoder-core/mcp.mjs`（客户端入口——生命周期/注册表/展开；端壳经
> `@thincoder/core` 子路径引用）+ 核 `thincoder-core/mcp/transport-{stdio,http,ws}.mjs`（三 transport）+
> 核 `thincoder-core/mcp/helpers.mjs`（常量/工具——W7 迁移后现体）+
> `src/config-mcp.mjs`（config.json mcp.servers[] 管理）+ `src/extension/settings.mjs`/
> `src/extension/panel-mcp.mjs`（面板接线 + 端壳增量：client-id 注册表与面板状态接口）。实现为唯一事实源。
> 关联：`TOOLS.md`（MCP 展开并入统一工具表/装配）、`SETTINGS.md`（面板 MCP 页）。
> 2026-09-08：从 `ARCHITECTURE.md` §13 MCP 行展开成立本档（DOC-REORG-VSC 第 5 批）——写全
> VSC 独立实现；ARCH 瘦身由后续批统一做。

## 1. 定位与术语

MCP 客户端把外部 MCP server 的 `tools/list` 工具**动态展开**为独立原生工具（`{server}_tool`
前缀、完整 inputSchema、execute 直调 `tools/call`），并入 agent 工具表，经统一 OpenAI
function-calling schema 暴露给模型。支持三种传输：**stdio**（本地子进程）、**HTTP**
（Streamable HTTP + SSE）、**WebSocket**。网关式 `mcp` 工具已废弃（CLI parity）——模型无需
手动 connect/list/call 三层路由，已连接 server 的工具以原生工具直接可调用、可并行。

| 词 | 含义 |
|---|---|
| server / config | 一份 MCP server 配置（一个 name + 一种传输端点），存 config.json `mcp.servers[]` |
| session | registry 键控的活连接 entry（含 transport + 展开工具 + config 指纹） |
| transport | 一种传输协议实现（stdio/http/ws） |
| postOnly | Streamable POST-only 模式（server 不支持 GET SSE） |
| fingerprint | config 关键字段 JSON 归一指纹——识别配置变更触发重连 |

## 2. 配置与设置面板管理（无 /mcp 命令面）

配置存共享 `~/.thincoder/config.json` 的 `mcp.servers[]`（CLI 同文件）。`config-mcp.mjs` 提供
config.json 读写（纯 Node——`vscode` 无关，可在 extension host 外单测）：

```js
// stdio: { name, command, args?, env? }
// HTTP:  { name, url, token?, headers? }
// WS:    { name, wsUrl, token?, headers? }
// token 是一等可选字段（HTTP/WS）——合成 Authorization（§4）
```

- `loadMcpServers()`：读 raw.mcp.servers（过滤无 name / 非对象项）。
- `addMcpServer(name, config)`：name 重复拒（`MCP server "N" already exists`）；按传输形态落
  `{name, url|wsUrl|command, token?, headers?, args?, env?}`。
- `updateMcpServer(name, config)`：原位替换（数组序保持，name 不可改）；transport 字段被清空
  时回落到既有条目的类型与值（编辑表单只改 token/headers 不产出退化 `{name}`）。
- `removeMcpServer(name)`：按 name 过滤删除。三者经 `persistRaw` + `conflictError`（并发写冲
  突 → 同型提示串）。

**Settings 面板 MCP 页接线**（`settings.mjs` + `panel-mcp.mjs`，无 `/mcp` CLI）：
`pushMcpStatus` 推 `mcpStatus { servers: [{ name, desc, connected, toolCount, config }] }`
（●/○ 连接态 + N tools + 原始 config 供表单预填）；动作消息 → `reconnectMcp`（断开 + 重连 →
`mcpReconnected { name, tools }`）、`testMcp`（`probeMcpServer` → `mcpTestResult`，§7）、
`editMcp`（`saveMcpServer` = add-or-update 原位 → 推状态）。`saveMcpServer(name, config)` =
add 失败（重复）则 update——面板 [Edit] 与 [Add] 复用同一表单。工具展开器（行内 [tools]）：
`mcpTools` 载荷 = 面板契约投影 `{ name, description, inputSchema }`（W7 迁移：端壳 `panelToolList`
自核原生工具投影——schema 取 `parameters`，运行期字段（`execute`/`_mcpTransport`）不带出端壳）。

## 3. 启动装配与热插拔（每轮重建）

面板回合把 `mcpServers: getMcpServers()` 注入 runAgent opts（panel-chat.mjs）；`setupAgentRun`
在 **depth-0** 且 `mcpServers` 非空时动态 `import("../extension/panel-mcp.mjs")` →
`connectMcpServersExpanded(mcpServers)`：

- **并发连接**：`Promise.allSettled`（逐 server 失败隔离）；`_mcpHooks.reconnectDelays` 测试钩子。
- **失败不阻塞**：每死 server 记 `MCP server "label" failed to connect: <reason>` warning，
  其余照常；工具表本轮缺该 server 工具，下轮重试。展开整体失败也非致命（模型本轮缺 MCP
  工具）。
- **每轮重建 = 热插拔**：runAgent 每 turn 重新装配工具表——registry 状态（连接/断开/重连）
  天然下轮生效。成功展开的工具并入 `tools = baseTools + … + mcpTools`（TOOLS.md §5）。
- **子代理不含 MCP**：装配仅 depth-0 展开；depth>0 无 MCP 工具（readonly 过滤与 question 剔除
  不涉 MCP）。

## 4. 幂等连接与注册表（核 mcp.mjs——W7 迁移后现体）

`mcpConnect(config)` 幂等（核实现）：核 `_sessions` Map（**name 键控**——serverName → session
`{ config, configFingerprint, state: { transport, tools } }`；端壳 `panel-mcp.mjs` 只保 client-id
面 `{ id, serverName, tools }`）已存在**同 name 活连接且指纹一致** → 复用已展开工具，不重建
（重复连接不泄漏 transport）。建连前：

- **活连接 + 指纹比对**：指纹 = `JSON.stringify([command, args, url, wsUrl, env, headers,
  token])`。同 name 但 transport 死（`!isAlive()`）或指纹不一致 → 断开旧连接 + 走全新连。
- **重连去重**：`_reconnecting`（serverName → promise）进行中 → 等它完成，避免双重建连。
- **onDead 自愈**：session 挂 `transport.onDead` → 死后后台退避重连 `scheduleReconnect`
  （延迟表 `[1000, 2000, 4000, 8000]`ms）；成功原位替换 `session.state.transport`（**name 键不变**
  ——工具闭包动态取 transport，工具表无需重建）；四轮耗尽 console.error + 静默（下次连接走全新连）。
- **token 一等字段**：`withBearerToken` 合成 `Authorization: Bearer <token>`——仅当 headers 未
  显式给 Authorization（显式优先）；发生在传给 transport 前，**不写回 config**。fingerprint
  计入 token——面板改 token → 指纹变更 → 重连。

## 5. 工具展开（buildMcpTools——CLI buildTools parity）

连接成功后 `buildMcpTools(server)` 把每个 MCP 工具包装为独立原生工具：

```js
const prefix = server.config?.name ? `${server.config.name}_` : "mcp_"
// name: sanitizeToolName（[^a-zA-Z0-9_-] → _，截 64）+ 碰撞去重（追加 _2/_3）+ 空名/纯前缀跳过
// description: string 校验，否则回退 `MCP tool: ${name}`
// parameters: inputSchema object 校验，否则回退 { type: "object", properties: {} }
// readonly: false · execute → transport tools/call（§6）· _mcpTransport/_mcpName 扩展元字段
```

碰撞/畸形防御（2026-08-31 MCP 会诊 P6）：sanitize 后重名追加后缀去重、空名跳过、schema/
description 类型守卫回退默认。扩展元字段供按 server 归类（连接态展示、disconnect）。

## 6. 工具调用契约（execute）

展开工具 execute 直调 transport `tools/call`，响应上层 `ctx.signal`（`sendWithSignal` 竞速——
挂死的 MCP server 不得拖住整轮 turn）：

- `resp.error` → 抛 `` `MCP tool "${t.name}": ${resp.error.message}` ``。
- `resp.result?.isError` → 抛 `` `MCP tool "${t.name}": ${text || "(server reported an error)"}` ``。
- 成功返回 = `extractMcpText(result.content ?? [])` 序列化 `join("\n")`；空 → `"(no output)"`。
- **content 序列化**（`extractMcpText`）：数组逐项——`text` 取 `.text`；`resource` →
  `` `[resource: ${c.resource?.uri}]` ``；其余 → `JSON.stringify`；非数组元素防御。
- **输出截断**（`truncateMcpOutput`）：32_000 字符上限，超出 → 前 32_000 + `"\n[… truncated:
  N chars omitted]"`（防 server 回 10MB 撑爆上下文）。

内部网关 API（`mcpListTools` / `mcpCallTool` / `mcpDisconnect`）——W7 迁移已移除：删除记录 = 本档变更记录 /
批次档 §5；核无对位三函数、端侧零消费 ⇒ 不再保留（核档 `MCP.md` §7 D-MC2 现状注同批）。

## 7. 传输层与探活

三 transport（核 `thincoder-core/mcp/transport-{stdio,http,ws}.mjs`（W7 迁移后现体——原 `src/mcp/` 子树已删），每份自带 `send/notify/close` + `onDead` 注册 + `isAlive`）：

- **transport-http.mjs（核）**（Streamable HTTP + SSE）：GET SSE 不可用（405）时降级纯 **postOnly** 模式
  （`markPostOnly`）——`isAlive: () => !closed && (eventSource != null || postOnly)`（降级后不
  因 eventSource==null 误判死）；Streamable POST 规范路径（POST→202→GET SSE 回包，`Mcp-
  Session-Id` 记入后续头）；legacy 违规 server（POST 直接回 body）兼容解析；GET SSE 用
  `AbortSignal.any`（核现体；原本端 `anySignal` polyfill 已迁移删除）+ INIT_TIMEOUT 防挂起。
- **transport-stdio.mjs（核）**：本地子进程，env 合并 `process.env` 之上；JSON-RPC over stdio。
- **transport-ws.mjs（核）**：`isAlive` 按 `readyState === OPEN`；认证经 **subprotocol**（`bearer.<token>`，
  Node 内置 WebSocket 无法自定义请求头——不注入 URL query 防代理日志泄凭证）。
- **探活 probeMcpServer(config)**（`testMcp` 用——CLI 镜像）：一次性 initialize + tools/list
  + 计时 → `{ ok, toolCount, latencyMs }` / `{ ok:false, error }`。**零副作用**：不进 `_sessions`、
  无 onDead 挂钩、finally close（handshake 失败 catch 中 `transport?.close()` 防泄漏）。
  initialize 与 tools/list 分页循环每页受 `INIT_TIMEOUT_MS`(30s) 约束。

## 8. 生命周期收口

- `closeAllMcp()`：extension deactivate / 面板 view dispose 时关闭全部（端壳 `panel-mcp.mjs`——逐核
  session close〔closed 标记 + transport close + 注册表移除〕）。
- `mcpDisconnectByName(name)`：面板 [Reconnect] 先断开该 server 再重连。
- `mcpConnectedNames()` / `mcpConnectedToolCounts()`：面板 ●/○ 状态与工具数。
- 连接/断开/重连变更在**下一轮 runAgent 装配**生效（热插拔）。

## 9. 失效与失败语义

- **连接失败不阻塞**：warning 记入 + 装配继续，模型本轮缺工具、下轮重试；展开工具 execute
  失败抛错 → dispatch 捕获 → 模型见 `Error: …`（与内置工具一致）。
- **postOnly 失效**：isAlive 恒真至 close、无流可断、不自发 fireDead——会话过期/端点死亡不
  自动重连，表现为 per-call 错误（tools/call 错误/超时透传）；手动恢复 = 面板 [Reconnect]。
- **legacy 断流重连**：SSE 真实断开（`fireDead`）→ 后台退避重连自愈；成功原位替换 entry（工
  具闭包经 `_mcpTransport` 动态引用 transport——**工具表无需重建**即自愈）。

## 10. 验收契约

- 展开工具命名 `{server}_{tool}`、schema 完整、execute 直调 tools/call——行为与 CLI 一致。
- 模型无需 mcp 工具即可直接调用任何已连接 server 的工具（schema 完整、可并行）。
- 面板连接/断开在下一轮生效（热插拔）；失败不阻塞对话。
- 子代理不继承 MCP 工具（仅 depth-0 展开）；readonly 过滤不涉（readonly: false）。
- POST-only server 全链路（405 降级 → POST 初始化成功 → isAlive true → 无 reconnect failed）
  不误判死。
- probe/test 零副作用：不进 `_sessions`、不动本轮工具、探完必关。
- 面板 [Edit] 只动所选字段；name 不可改；token/headers 变更经指纹触发重连。
- config.json 由 agent 用 edit 工具直接改 `mcp.servers[]` 后，下轮装配（重读 config）生效
  （本端无 CLI 的磁盘重读菜单——每轮 loadRaw 即磁盘）。

## 变更记录（历史折叠——详见 git log）

- 2026-09-08：从 ARCHITECTURE §13 MCP 行展开成立本档——写全 VSC 独立实现（mcp/ 模块 +
  config-mcp + settings/panel-mcp 接线核对），去 CLI 镜像指针。
- 2026-09-15（**S2 W7**）：MCP 客户端自持镜像已迁核删除（6 档；删除记录 = 批次档 §5）——
  本端经核引用（现体 = 核 `thincoder-core/mcp.mjs`，已迁移落位）；端壳增量（client-id 注册表 +
  面板状态接口）迁入 `src/extension/panel-mcp.mjs`；§3/§4/§6/§7/§8/§10 按现态收正。
