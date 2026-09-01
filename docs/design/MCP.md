# MCP 工具机制统一规范（CLI / VS Code 一致落地）

> 状态：**已实现**（2026-08，`src/mcp/` 含 stdio/HTTP/WebSocket 三传输，`test/tools.test.mjs` 含 MCP 集成测试）。
> 目标：**VS Code 向 CLI 对齐**——MCP 工具动态展开为独立原生工具，废弃"网关式"mcp 工具。
> 原则：与 CONTEXT-COMPACTION.md 相同——一套语义，两端一致；正确性/可用性优先于 token 节省。

## 0. 现状与问题

| | CLI（thincoder） | VS Code（thincoder-vscode） |
|---|---|---|
| 机制 | **动态展开**：`connectMcpServer` 把每个 MCP 工具包装成独立工具（`{server}_{tool}` 前缀、完整 inputSchema、execute→tools/call），并入 `agent.tools` → toolSchemas | **静态网关**：单一 `mcp` 工具，模型手动 `connect → list → call` 三层路由 |
| 连接时机 | 启动装配（make-agent 批量连接 `config.mcp.servers`）+ 运行时 `/mcp connect/remove/reconnect` 热插拔 | 模型经 mcp 工具运行时 connect；registry（`src/mcp/index.mjs` `_servers`）模块级存活 |
| 失败语义 | 连接失败不阻塞：warning 记录，下一条 user 消息后注入提醒 | 连接失败返回错误字符串给模型 |
| 子代理 | `tools = parent.tools`——展开工具天然继承（coder 子代理可用）；explore/plan 只读过滤滤掉 | 网关工具在 builtinTools——子代理都可见但需手动路由 |
| 模型体验 | 与内置工具无差别：完整 schema、可并行、直接调用 | 多轮往返、参数手拼、无法并行、serverId 状态易错 |

**问题**：VS Code 网关式是旧设计（省 token 的考量），体验与能力都劣于 CLI 展开式；两端行为不一致。

## 1. 统一设计（对齐 CLI）

### D1 工具展开（两端一致）

`mcpConnect(config)` 成功后，把服务器 `tools/list` 返回的每个工具包装为：

```js
{
  name: sanitizeToolName(`${config.name}_${t.name}`),  // 前缀防冲突；无 name 时 "mcp_"
  description: t.description ?? `MCP tool: ${t.name}`,
  parameters: t.inputSchema ?? { type: "object", properties: {} },
  readonly: false,
  async execute(args) {
    const resp = await transport.send("tools/call", { name: t.name, arguments: args })
    if (resp.error) throw new Error(`MCP tool "${t.name}": ${resp.error.message}`)
    return content 按 text/resource/其他 序列化，join "\n"（与 CLI 完全一致）
  },
  _mcpTransport: transport, _mcpName: config.name,
}
```

- 命名/序列化/错误格式与 CLI `src/mcp.mjs buildTools` **逐字节同款**
- 工具名前缀：`{server}_{tool}`；无 name 用 `mcp_`；`sanitizeToolName` 清理非法字符

### D2 连接时机（VS Code 对齐 CLI 装配语义）

- **顶层 runAgent 装配时连接**：`opts.mcpServers`（已传入）→ 对每个未连接的 server **幂等连接**（registry 按 `config.name`/端点键控，已连跳过）→ 成功展开工具并入本轮 toolSchemas；失败不阻塞（记 warning → 注入提醒，与 CLI 一致）
- **每轮重新装配**：VS Code runAgent 每次调用重建 tools 数组——registry 状态变化（面板重连/断开）天然在下一轮生效（热插拔）
- **面板管理**：连接/断开/重连仍由 MCP 状态面板驱动（UI 已存在）；模型不再管理连接

### D3 废弃 mcp 网关工具

- `mcpTool`（connect/list/call/disconnect 四动作）**从 builtinTools 移除**
- `mcpListTools/mcpCallTool/mcpDisconnect` 保留为内部 API（面板/工具展开使用）
- 连接状态展示（面板 MCP 状态段）不变

### D4 子代理继承

- coder/默认子代理：工具继承父 agent 全部工具（含 MCP 展开工具）——与 CLI `parent.tools` 语义一致
- explore/plan：只读过滤自然滤掉 MCP 工具（readonly: false）✓ 无需额外处理
- 子代理上下文注入的 "[System: configured MCP servers (use mcp tool to connect)]" 提醒**改为不含 mcp 工具指引**——展开后无需指引；改为列出已连接的工具数（可选，避免误导）

### D5 关闭与生命周期

- `closeAllMcp()` 退出时关闭全部 transport（已有，保持）
- 面板"删除服务器"：关闭 transport + 从 registry 移除 → 下一轮工具表不再含其工具（CLI `/mcp remove` 同语义：`removeMcpTools` 从 agent.tools 移除 + 关闭）

### D6 失败与错误

- 连接失败：warning（面板显示 + 下轮提醒注入），不阻塞对话（CLI 同款）
- 工具调用失败：execute 抛错 → dispatch 捕获 → 模型见 `Error: …`（与内置工具一致）

### 落地清单（2026-08 已完成——历史记录）

### thincoder-vscode

| # | 改动 | 位置 |
|---|---|---|
| V1 | `mcp/index.mjs` 新增 `buildMcpTools(client)`（展开包装，CLI buildTools 同款）；`mcpConnect` 返回展开工具 | `src/mcp/index.mjs` |
| V2 | runAgent 装配：`opts.mcpServers` → 幂等连接 → 展开工具并入 `tools`；连接失败 warning 注入 | `src/agent.mjs` |
| V3 | `mcpTool` 从 `builtinTools` 移除 | `src/tools/index.mjs` + `src/mcp/index.mjs` |
| V4 | MCP 提醒文本更新（不再指引 mcp 工具） | `src/agent.mjs`（155-161 行） |
| V5 | 测试：展开工具命名/schema/执行路由；失败不阻塞 | `test/` |
| V6 | 文档：`docs/design/ARCHITECTURE.md` MCP 段引用本文档 | — |

### thincoder（CLI）

无需改动——CLI 现状即目标（仅验证 `buildTools` 与 V1 同款）。

## 3. 验收口径

1. 两端 MCP 工具展开后：命名 `{server}_{tool}`、schema 完整、execute 直调——**行为一致**
2. VS Code 模型无需 mcp 工具即可直接调用任何已连接服务器的工具（schema 完整、可并行）
3. 面板连接/断开在下一轮生效（热插拔）；失败不阻塞对话
4. 子代理：coder 继承 MCP 工具；explore/plan 不可见
5. 旧 `mcp` 网关工具彻底移除，无残留引用

## 4. Streamable POST 误判修复 + 配置编辑/探活入口（2026-09-01，用户报告 glm-websearch 不可用）

> **状态：已实现（2026-09-01）**——两端落地 + T1-T6/T9-T13 测试全绿；§0-§3 为已实现历史记录。
> 实现补记见文末"实现偏差与补记"。

**需求**（用户报告 + 排查实证）：已配置的 glm-websearch MCP（智谱 `https://open.bigmodel.cn/api/mcp/web_search_prime/mcp`，Bearer header）原可用、现报 "reconnect failed"。排查实证：**端点完全正常**（带 Authorization POST initialize → 200 + `Mcp-Session-Id` + SSE 流回包；GET SSE → **405**——该 server 不支持 GET SSE 流，是纯 Streamable POST 模式）。客户端根因：`openSSE()` GET 405 → catch 降级为纯 POST 模式（设计正确），但 `transport-http.mjs` 的 `isAlive: () => !closed && eventSource != null` ——降级后 `eventSource` 恒 null → **isAlive 恒 false** → `ensureAlive`（mcp.mjs）误判死连接 → `scheduleReconnect` → 重连后 isAlive 仍 false → 耗尽 4 轮退避报 "reconnect failed after 4 attempts"。8/31 会诊 P4 修 POST 通道时未同步修活性判定。**附带缺口（用户指出）**：`/mcp` 配置管理只有 add/remove/connect/list——无**编辑**既有配置入口（改 URL/headers 只能删了重加）、无**连接测试**入口（无法验证 headers/URL 正确性）。

### 功能性需求（机制约束）

| # | 需求 | 说明 |
|---|---|---|
| F1 | isAlive 不误判 POST-only server | openSSE 降级（GET 405/不支持）+ POST initialize/tools/list 成功 = 活连接；`isAlive()` 不得因 `eventSource == null` 判死 |
| F2 | 死亡判定保留 | 主动 close（closed）与 legacy SSE 流真实断开仍判死 + 走重连——F1 不弱化真实故障自愈 |
| F3 | `/mcp edit [name]` | 逐字段预填重问（HTTP: url/**token**/headers；WS: wsUrl/**token**/headers；stdio: command/args/env——评审 #2 token 并入字段清单）→ **空输入保留旧值；输入 `-` = 删除该可选字段/该 header 项（评审 #3 清除语义）**→ 保存 config（persistRaw，保持数组序）→ 自动重连（connectServer 既有函数）；name 不可改 |
| F4 | `/mcp test [name]` | 一次性探活：createConnectedTransport（initialize + tools/list）→ 报告 成功（工具数/延迟）/失败（错误透传：405/401/超时）→ **关闭探活连接、零副作用**（不进 `_sessions`、不动 agent.tools、无 onDead 挂钩） |
| F5 | VS Code 同构 | VS Code 端 http transport 同款 isAlive 缺陷同修（`isAlive: !closed && eventSource != null` 行文同 CLI）；配置编辑/测试走 settings 面板 MCP 区（[Reconnect] 旁补 [Edit]/[Test]，经 panel 消息协议扩展——交互随面板惯例实现） |
| F7 | postOnly 失效语义声明（评审 #4） | postOnly 模式已知限制落档：isAlive 恒真至 close、无 fireDead——**会话过期/端点死亡不自动重连**，表现为 per-call 错误；手动恢复路径 = `/mcp reconnect`（重新 initialize 取新 session）。已知取舍落本表+变更记录，不阻塞实现 |
| F6 | 认证配置简化（token 一等字段） | ① config 增可选 `token` 字段（HTTP/WS）——client 自动构造 `Authorization: Bearer <token>`（仅当 headers 未显式给 Authorization 时；显式 headers 优先）；② `/mcp add/edit` 对 HTTP/WS 增加 "Auth token (Bearer, optional):" 单行粘贴提示（替代拼接 Authorization header 的主要场景）；③ **修 parseHeaders 空格截断缺陷**：现有 `split(/\s+/)` 把 `Authorization=Bearer xxx` 的 value 截成 `"Bearer"`（token 丢失）——headers 提示改为逗号分隔（`key=value, key2=value2`，value 可含空格），add/edit 共用新解析 |

### 非功能性需求

| # | 标准 |
|---|---|
| NF1 | 零行为回归：legacy SSE 模式（endpoint 事件流）与 stdio/ws 不变 |
| NF2 | test 零副作用（NF2→F4 内嵌）；超时沿用 INIT_TIMEOUT_MS |
| NF3 | isAlive 语义两端同构；配置编辑交互各按端惯例（不强求 UI 同构） |

### 设计

**需求总目标**（评审 #1 补三层格式）：让"配置一个带认证的 MCP server"从"拼 headers + 删了重加 + 失败无解释"变成"粘贴 token + 可改可测"——glm-websearch 这类 POST-only server 修好后开箱即用。

**用户故事**：① 作为用户，我配置了带 Bearer 认证的 Streamable POST MCP server，我想要它能正常连接使用，以便 glm-websearch 恢复可用（F1/F2）；② 作为用户，我想要 `/mcp edit`/`/mcp test`，以便不改配置就不用删了重加、配错了当场能测出来（F3/F4）；③ 作为用户，我想要 `token` 一等字段，以便不用手工拼 Authorization header（F6）。

- **D-1 isAlive 三态**：`httpTransport` 增 `postOnly` 标记 + `markPostOnly()`；`createConnectedTransport`（CLI mcp.mjs / VS Code mcp/index.mjs）的 openSSE catch 降级分支调用之；`isAlive: () => !closed && (eventSource != null || postOnly)`。postOnly 模式无流可断、不自发 fireDead——连续调用失败兜底仍是 execute 前置检查 + per-call 错误。8/31 P4 的 POST 通道逻辑不动。**失效语义（F7，评审 #4）**：postOnly 会话过期/端点死亡不自动重连（isAlive 恒真至 close）——已知取舍，手动恢复 `/mcp reconnect`。
- **D-2 probeMcpServer（CLI mcp.mjs 新导出）**：`createConnectedTransport` + 计时 → `{ ok, toolCount, latencyMs, error }` → finally `transport.close()`（closed=true 防重连触发）；**不复用** `connectMcpServer`（避免污染 session 幂等表）。initialize 与 tools/list 同受 INIT_TIMEOUT_MS 约束（评审 #8 补记）。**VS Code 镜像同名导出**（评审 #5 定位：`thincoder-vscode/src/mcp/index.mjs`——panel-mcp 的 testMcp 调用之）。
- **D-3 CLI edit 流程**：cmd-mcp.mjs `edit` 子命令 + 主菜单项；editFlow 按 transport 类型逐字段 askQuestion 预填（`(current: …)` 提示、空输入保留、`-` 删除可选字段——token/headers 走同一语义）；fingerprint（config 指纹，mcp.mjs connectMcpServer 内）自动识别配置变更关旧连接——无额外工作。
- **D-4 VS Code**：panel-mcp.mjs 增 `editMcp`/`testMcp`（模式同既有 `reconnectMcp`：postMessage 协议 `mcpEditServer`/`mcpTestServer`）；settings 面板 MCP 区补按钮。
- **D-5 token 一等字段（F6）**：`findTransportConfig`/connect 链把 `config.token` 合成为 `headers.Authorization = "Bearer " + token`（**仅当 headers 未显式含 Authorization**——显式优先，向后兼容；合成发生在传给 transport 前，不写回 config）；fingerprint 计入 `token` 字段（变更触发重连）；`/mcp add/edit` 的 HTTP/WS 流程加 "Auth token (Bearer, optional):" 提示；parseHeaders 改逗号分隔解析（`k=v, k2=v2`——value 含空格），add/edit 共用；**逗号在 value 中的 header 不支持（已知限制，评审 #9）**；存储向后兼容（旧 headers 形式继续工作）。VS Code settings 面板 MCP 表单同步加 token 字段。
- **D-6 存储格式**：`{ name, url, token?, headers? }`——token 明文存 config.json（与既有 headers.Authorization 同级敏感度，不新增暴露面）；不引入 keychain（超范围，记 TODO 可选项）。

### 受影响文件

| 文件 | 动作 | 用途 |
|---|---|---|
| `thincoder/src/mcp/transport-http.mjs` | MODIFY | +postOnly/markPostOnly；isAlive 三态 |
| `thincoder/src/mcp.mjs` | MODIFY | 降级 catch 调 markPostOnly；+probeMcpServer |
| `thincoder/src/tui/cmd-mcp.mjs` | MODIFY | +edit（editFlow）+ test 子命令 + usage/主菜单 |
| `thincoder-vscode/src/mcp/http.mjs` | MODIFY | 同 D-1 同构修复 |
| `thincoder-vscode/src/mcp/index.mjs` | MODIFY | 降级 catch 调 markPostOnly；**+probeMcpServer 镜像导出（评审 #5——testMcp 的探活实现落点）** |
| `thincoder-vscode/src/extension/panel-mcp.mjs` | MODIFY | +editMcp/testMcp（模式同 reconnectMcp；testMcp 调 D-2 的 index.mjs 镜像 probe——评审 #5 定位） |
| `thincoder-vscode/src/extension/settings.mjs` + 对应 webview 前端 | MODIFY | MCP 区 [Edit]/[Test] 入口 + 消息协议 |
| 两端测试 | MODIFY | T1-T14（见用例表） |
| 两端 `CHANGELOG.md` | MODIFY | 下一版本号条目 |

**实现追加触碰（2026-09-01 实测，属 D-4/F6 的必然落点）**：

| 文件 | 动作 | 用途 |
|---|---|---|
| `thincoder/src/tui/cmd-mcp.mjs` 内 parseHeaders | MODIFY | F6③ 逗号分隔解析（原文件内私有函数，add/edit 共用） |
| `thincoder-vscode/src/config-io.mjs` | MODIFY | +updateMcpServer（原位替换保数组序）；addMcpServer 落 token 字段 |
| `thincoder-vscode/src/extension/chat-panel.mjs` | MODIFY | +_editMcp/_testMcp 薄包装（模式同 _reconnectMcp） |
| `thincoder-vscode/src/extension/panel-messages.mjs` | MODIFY | 路由 +`reconnectMcp`/`editMcp`/`testMcp` 三 case——**`reconnectMcp` case 系既有死按钮修复**（webview 已在发送、路由拆分时丢失） |
| `thincoder-vscode/webview/settings-tools.js` | MODIFY | 行内 [Edit]/[Test] 按钮、edit 预填同一表单（name readonly）、token 字段、headers 逗号分隔提示、updateMcpTestResult 渲染 |
| `thincoder-vscode/webview/settings.js` / `webview/chat.js` | MODIFY | updateMcpTestResult 解构导出 + `mcpTestResult` 消息 case |
| `thincoder-vscode/locales/en.json` / `zh.json` | MODIFY | settings.mcp.edit/test/testing/testOk/token 词条（i18n 锁步测试同步） |

**关键决策**：① postOnly **显式标记**而非推断式（可测试、语义明确；否决"isAlive 永真直至 closed"——弱化死亡检测）；② probe 独立函数不复用 connectMcpServer（零副作用）；③ CLI edit 复用 askQuestion 逐字段预填（与 add 同构；否决整段 JSON 粘贴）；④ VS Code 交互不强求与 CLI 同构；⑤ **token 一等字段**（用户拍板"自己拼 header 太麻烦"）——`Bearer` 是绝对主流场景，一等字段 + 单行粘贴替代 header 拼接；显式 headers 优先保兼容；⑥ parseHeaders 逗号分隔（修空格截断——value 含空格场景如 Bearer token）；⑦ token 明文存 config 不引 keychain（同敏感度不扩面，keychain 记 TODO）。

### 测试（Testing）

| # | 场景 | 输入 | 预期 | 映射 |
|---|---|---|---|---|
| T1 | 正常：POST-only 全链路 | mock：openSSE 抛错、POST initialize/tools/list 成功 | connect 成功；isAlive()=true；ensureAlive 不触发重连；调用走 POST | F1 |
| T2 | 边界：legacy SSE | mock：endpoint 事件流 | isAlive()=true；流断 → fireDead → 重连（不回归） | F1/F2 |
| T3 | 边界：closed | close() 后 | isAlive()=false | F2 |
| T4 | probe 成功 | mock transport | { ok:true, toolCount, latencyMs>0 }；_sessions 不增 | F4 |
| T5 | probe 失败 | mock：HTTP 401 | { ok:false, error 含 401 }；零副作用 | F4 |
| T6 | /mcp edit | askQuestion 序列（空输入保留/headers 更新） | config 更新 + persistRaw + connectServer 触发 | F3 |
| T7 | VS Code isAlive | 同 T1 镜像 | 同 T1 | F5 |
| T8 | 既有回归 | 两端全量 | 全绿 | NF1 |
| T9 | token 合成（F6/D-5） | config {url, token:"abc"} 无 headers | 请求头 Authorization: "Bearer abc"；headers 显式 Authorization 时显式优先（token 被忽略）；fingerprint 变更触发重连 | F6 |
| T10 | parseHeaders 逗号分隔 | "Authorization=Bearer abc, X-Foo=bar" | {Authorization:"Bearer abc", "X-Foo":"bar"}——value 空格保留 | F6③ |
| T11 | 向后兼容 | 旧 config（headers.Authorization 形式） | 行为不变；token 缺省不合成 | F6/NF1 |
| T12 | edit 清除语义（评审 #3） | edit 时 token 输入 `-`；headers 输入 `Authorization=` | token 字段删除、该 header 项移除；重连后无 Authorization 合成 | F3 |
| T13 | edit 含 token 字段（评审 #2） | edit 流程 HTTP: token 提示输入新值 | config.token 更新 + fingerprint 变更触发重连 | F3/F6② |
| T14 | 既有回归（T8 同） | 两端全量 | 全绿 | NF1 |

**验收标准**：AC1 = glm-websearch 场景链（405 降级 → POST 初始化成功 → isAlive true → 无 reconnect failed）测试指认；AC2 = edit/test 入口存在且 test 零副作用；AC3 = 两端全量 + lint 全绿。

### 实现偏差与补记（2026-09-01 实现落地后回写）

- **AC1 测试指认**：`thincoder/test/mcp.test.mjs` → "T1 POST-only: openSSE 405 降级 → connect 成功、isAlive true、调用走 POST、无重连循环 (F1/AC1)"（mock：GET 405、POST initialize/tools/list/tools/call 成功；断言 connect 成功 + `transport.isAlive()===true` + tools/call 经 POST 返回）。AC2：CLI `T6+T12`（edit 流程）+ `T4/T5`（probe 零副作用）与 VS Code `probeMcpServer 成功/失败均零副作用`。AC3：CLI 932 pass / VS Code 837 pass（node --test 全量）+ 两端 eslint 0 error。
- **VS Code [Reconnect] 死按钮修复**（计划外发现）：webview `settings-tools.js` 一直在发 `reconnectMcp` 消息，但 panel-messages.mjs 路由表无对应 case（路由从 chat-panel 拆分时丢失）——按钮此前完全无效。本次随 `editMcp`/`testMcp` 一并补上路由（受影响文件表"实现追加触碰"行）。
- **probe 内部实现**：`probeMcpServer` 复用 `createConnectedTransport`（含 token 合成与 markPostOnly 降级链），不经 `connectMcpServer`/`mcpConnect`，故天然零 session 副作用；`finally close()` 保证探活连接必关。
- **CLI 握手失败防泄漏**（评审 #7）：`connectMcpServer` 对 `createConnectedTransport` 的失败 catch 中 `transport?.close()`——openSSE 降级成功但 POST initialize 失败时不留悬挂流。
- **CLI `_sessions` 导出**：probe 零副作用断言需要读 session 注册表计数——由模块私有改导出（只读用途）。
- **webview edit 复用 add 表单**：编辑时 name input 置 readonly（name 不可改，F3）；headers/env 输入改逗号分隔提示与解析（`k=` 删除该项），旧 JSON 形式输入不再接受——面板存储向后兼容（旧 config 数据不受影响），仅输入格式升级。
- **stdio edit 的 env 解析**：CLI `/mcp edit` 的 env 与 headers 同走逗号分隔语义（`KEY=value` 对，value 可含空格）；`/mcp add` stdio 流程的 env 提示同步改逗号分隔（原空格分隔多对的写法会把 `A=1 B=2` 解析错位）。
