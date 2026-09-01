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
| V4 | MCP 提醒文本更新（不再指引 mcp 工具） | `src/agent.mjs` 提醒注入段（引用函数符号，勿用行号——见 AGENTS.md 约定） |
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
| F6 | 认证配置简化（token 一等字段） | ① config 增可选 `token` 字段（HTTP/WS）——client 自动构造 `Authorization: Bearer <token>`（仅当 headers 未显式给 Authorization 时；显式 headers 优先）；② `/mcp add/edit` 对 HTTP/WS 增加 "Auth token (Bearer, optional):" 单行粘贴提示（替代拼接 Authorization header 的主要场景）；③ **修 parseHeaders 空格截断缺陷**：现有 `split(/\s+/)` 把 `Authorization=Bearer xxx` 的 value 截成 `"Bearer"`（token 丢失）——headers 提示改为逗号分隔（`key=value, key2=value2`，value 可含空格），add/edit 共用新解析 |
| F7 | postOnly 失效语义声明（评审 #4） | postOnly 模式已知限制落档：isAlive 恒真至 close、无 fireDead——**会话过期/端点死亡不自动重连**，表现为 per-call 错误；手动恢复路径 = `/mcp reconnect`（重新 initialize 取新 session）。已知取舍落本表+变更记录，不阻塞实现 |

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
| T14 | 既有回归（T8 复验——评审 #7 删重复） | 两端全量 | 全绿 | NF1 |

**验收标准**：AC1 = glm-websearch 场景链（405 降级 → POST 初始化成功 → isAlive true → 无 reconnect failed）测试指认；AC2 = edit/test 入口存在且 test 零副作用；AC3 = 两端全量 + lint 全绿。

## 5. `/mcp` 菜单交互重构 + agent 代配（2026-09-01，用户评价"配置方式过于反人类"）

> **状态：v2 已实现（2026-09-02）**——edit/add 统一字段 picker 表单（`fieldPicker` / `✓ Save & test` / `(required)` 标注）落地，v1 的 `collectEntry`（逐字段问答）/`pickRetryField`（独立 retry 路径）/edit 逐字段预填重问已废除。v1（2026-09-01）曾因两次 eng-coder spawn 被宿主 600s 绝对墙钟中止（2026-09-02 已修复墙钟，根因与修复见 `docs/design/PROVIDER.md` 超时段）。实现补记见文末（§5 专段 v1/v2 两节）。范围仅 CLI。
> **§4 决策③ 复核**：会诊（4 模型）提出"JSON 粘贴主路径"方案，经用户否决——JSON 粘贴在终端单行输入框体验差（编辑不可见/错不可见）、MCP 配置格式无统一标准（宽容解析是无底洞）、且 config.json 本可直接手编。**决策③（否决 JSON 粘贴）维持有效**，§5 不引入任何 JSON 输入通道。

### 需求

**总目标**：菜单配置从"逐字段问答流水线、错一个字段整个重来"变成"最短提问 + 保存前探活确认 + 错哪改哪"；复杂配置走 agent 代配闭环。

**用户故事**：① 作为用户，我在菜单里配一个 HTTP server，我想要只答 2-3 个必要问题、保存前看到预览和探活结果，以便配错当场发现而不是连不上再排查；② 作为用户，我配错了，我想要只重答错的那一项，以便不用整个流程重来；③ 作为用户，我手上有复杂配置（多 header/env），我想要直接让 agent 帮我改好，以便我不在菜单里跟生僻字段较劲。

**功能性需求（机制约束）**：

| # | 需求 | 说明 |
|---|---|---|
| F1 | add 向导瘦身 | HTTP/WS：name → url → token（headers **不进主流程**——末尾追问 "Add custom headers? (y/N)"，默认跳过）；stdio：name → command → args → env 同理。90% 场景 2-3 问搞定 |
| F2 | 保存前预览 + 探活（纠错回环核心） | 向导收集完 → **预览表**（name/transport/端点/token 遮蔽——`maskToken`：len > 12 显示前 4 字符 + "…"，否则全遮——评审 #6）→ `probeMcpServer` 当场探活 → 报告（✓ N tools, Xms / ✗ 错误）→ "Save? (Y/n)"。探活失败 → "Retry which field? (url/token/headers/save-anyway/cancel)"——**只重问选中的字段**，不重启流程（stdio 同理：command/args/env） |
| F3 | edit = 字段 picker（v2 修订——推翻逐字段重问） | **Edit 进入字段选择表单**：picker 列出可编辑字段行（`URL       https://…` / `Token     d90c26bb…`（打码）/ `Headers   2 items`；stdio: `Command/Args/Env`），**游标上下选择**要改的字段 → askQuestion 只输入该字段新值（空=不变、`-`=删除该字段/`k=`删 header 项）→ **回到字段 picker 可继续改其他字段** → 选 `✓ Save & test` → 预览 + probe 探活 + 确认（F2）→ 保存自动重连。**废除逐字段预填重问**——改 token 不再被迫路过 URL/headers |
| F3b | add 与 edit 统一表单 | add 用同一字段 picker（字段行初始为空、`(required)` 标记 name/url/command），Save 时校验必填非空——一个表单机制两处复用，add/edit 体验一致 |
| F4 | AI 生成降末位 | transport picker 顺序：HTTP / WebSocket / stdio / **AI（最后）**；文案不再首推 |
| F5 | agent 代配闭环 | ① **`/mcp` 菜单打开时从磁盘重读 config.json**（现状 `getServers()` 读 `agent.config` 内存态——agent 用 edit 工具改磁盘后内存不知，新 server 在菜单里不可见——这是 agent 代配的唯一机械缺口）；② `/mcp` 主菜单固定提示行："复杂配置可让 agent 直接编辑 ~/.thincoder/config.json 的 mcp.servers，改完 /mcp connect 生效"；③ add/edit/remove 的 persistRaw 落盘语义不变（内存态同步写） |
| F7 | 列表即菜单（收敛重复） | 主菜单 = server 列表本身（每行 `●/○ name (端点) — N tools`）+ `+ Add server` + `↻ Refresh`。**Edit/Test/Reconnect/Remove 不再是主菜单项**——选中某 server 行 → per-server 子菜单（Edit config / Test connection / Reconnect / Remove）。消灭"四个操作各自弹一次 server picker"的重复；纯查看项 View list 取消（列表即查看） |
| F6 | 直达参数不做 | `/mcp add <name> <url>` 位置参数、JSON 粘贴、`mcpServers` 批量导入、`mcp-config` agent 工具——**均不做**（用户拍板：用户只用菜单；直达方案全部裁掉） |

**非功能性需求**：NF1 = 既有 `/mcp remove|connect|test [name]` 参数路径与 probeMcpServer 机制零改动；NF2 = askQuestion/showPicker 机制零新增组件；NF3 = 范围仅 CLI，VS Code settings 表单不动。

### 设计

- **D-1 表单机制（v2 重构——edit/add 统一字段 picker，F3/F3b）**：`fieldPicker(entry, schema)`——picker 列出可编辑字段行（label + 当前值打码显示）+ `✓ Save & test` 行；游标选中字段 → askQuestion 输入新值（提示 `(current: …)`，空=不变、`-`=删除字段/`k=`删 header 项）→ 回 picker 循环（可连续改多个字段）；Save → F2 预览 + probe + 确认。add 复用同一 picker（空 entry 起、必填字段 `(required)` 标注、Save 时校验）。**替换原逐字段预填重问**（原 collectEntry 的问答流水线只保留字段级输入函数供 picker 调用）。F2 的字段级重试 = 回 fieldPicker 选中失败字段重输（机制天然合一，不再需要独立 retry 路径）。
- **D-2 菜单结构（F7 列表即菜单）**：`/mcp` 主菜单 = `getServers()` 列表逐行作为 picker item（`●/○` 连接态前缀 + tool 数）+ `+ Add server` + `↻ Refresh`（重开菜单即重读磁盘——F5① 的显式入口）+ 顶部提示行（agent 代配指引）。选中 server 行 → per-server 子菜单：`Edit config / Test connection / Reconnect / Remove`。**pickAndRun 的"先选操作再选 server"双弹层废除**；`/mcp edit|test|remove|connect <name>` 直达参数保留（NF1）。AI 生成降为 transport picker 末位（F4）。
- **D-3 磁盘重读（F5①，评审 #3 收敛触发点）**：新增 `reloadMcpFromDisk()`（读 config.json → 合并进 `agent.config.mcp` 仅替换 mcp 段），**调用点收敛到菜单打开边界**（主菜单循环顶部 + `↻ Refresh`——重开菜单即重读）；`getServers()` 保持纯读不加副作用。**对账规则（评审 #2）**：disk 与内存 registry 按 fingerprint 对账——disk 删除/变更的 server：连接保持不断（避免误断正在用的），列表标记 `⚠ disk changed`；**config.json 畸形 → 重读失败回退内存态 + 菜单提示行**。防环：persistRaw 写盘后重读结果一致（幂等）。与 agent 代配的分工：agent 用既有 edit/write 工具改 `~/.thincoder/config.json`（agent 本来就会），用户 `/mcp` 即见新 server → connect 生效。**写冲突已知取舍（评审 #8）**：菜单打开后 agent 再改 config、用户随后经菜单保存（persistRaw 写内存态）会覆盖 agent 的落盘改动——**单写者假设**（同一时刻只有一个写者：要么用户菜单、要么 agent 改盘；不做双写合并），属既有 config 写入模型（config.json 各处 persistRaw 同假设），本设计不引入新机制，仅记录取舍。
- **D-4 不做清单（F6）**：会诊方案中 JSON 粘贴/批量导入/位置参数/mcp-config 工具四项经用户裁定裁掉——理由见 §5 引言。

### 受影响文件

| 文件 | 动作 | 用途 |
|---|---|---|
| `thincoder/src/tui/cmd-mcp.mjs` | MODIFY | D-1 向导重构（瘦身+预览+探活+字段级重问）；D-2 菜单顺序+提示行；D-3 getServers 磁盘重读 |
| `thincoder/src/tui/cmd-mcp-form.mjs` | **ADD（v2 前置拆分——评审 #1）** | 字段 picker 表单机制独立文件（`fieldPicker`/字段行渲染/`✓ Save & test` 行）——`cmd-mcp.mjs` 已 499 行压 500 硬限，**v2 实现必须先拆分后落表单** |
| `thincoder/src/config.mjs` 或 config 读取模块 | MODIFY | **新增 `reloadMcpFromDisk()`（落点钉死——评审 #3）**：磁盘→内存 mcp 段合并 + 畸形回退 |
| `thincoder/test/mcp.test.mjs`（§4 实现已确认归置处） | MODIFY | T15-T24（见用例表）；既有 T6/T12 随流程更新 |
| `docs/design/MCP.md` | MODIFY | 状态改"已实现"+实现补记 |
| `thincoder/CHANGELOG.md` | MODIFY | 0.12.55 段追加（**CLI-only——评审 #4**；VS Code 本节不涉及） |

### 测试（Testing）

| # | 场景 | 输入 | 预期 | 映射 |
|---|---|---|---|---|
| T15 | add 字段表单（v2） | HTTP：picker 选 name/url/token 依次输入，headers 不选即跳过 | 字段行初始 `(required)`/空；只填所选字段；Save 校验必填 | F1/F3b |
| T16 | 预览+探活确认 | mock probe 成功 | 预览含遮蔽 token；探活报告 ✓；y 后才 persistRaw | F2 |
| T17 | 探活失败回表单改字段（v2） | mock probe 失败 → fieldPicker 选 "token" 重输 → Save & test 复 probe 通过 | 仅重输 token；url/headers 保留；最终保存 | F2/D-1 |
| T18 | edit 字段 picker 只改 token（v2） | 选 Edit → fieldPicker 选 Token 行输入新值 → Save & test | 其他字段不动；fingerprint 变更触发重连；预览无明文 token | F3 |
| T18b | picker 循环改多字段（v2） | 一次 edit 连改 url 和 token（两次进 picker） | 两字段都更新；中间 Esc 回 picker 不丢已改值 | F3 |
| T19 | 磁盘重读 | 直接写 config.json 加 server（模拟 agent 代配）→ 打开 /mcp | 菜单列表含新 server；connect 成功 | F5 |
| T20 | AI 降末位 | 无参 addFlow picker | 选项顺序 HTTP/WS/stdio/AI | F4 |
| T21 | 列表即菜单（评审补） | 无参 /mcp | 主菜单即 server 列表（含连接态+tool 数）+ Add + Refresh；选 server 行 → per-server 四操作子菜单；无"先选操作再选 server"双弹层 | F7 |
| T22 | 既有回归 | /mcp remove/connect/test [name] | 参数路径不变；CLI 全量绿 | NF1 |
| T23 | disk 删除已连接 server（评审 #2） | agent 从 config.json 删除已连接的 server → /mcp | 连接保持不断；列表该行标记 `⚠ disk changed` | F5/D-3 |
| T24 | 畸形 config.json（评审 #2） | agent 写坏 config.json（JSON 解析失败）→ /mcp | 重读失败回退内存态；菜单提示行告知 disk 配置不可读 | F5/D-3 |

**验收标准**：AC1 = add 字段表单只填所选字段（必填校验）且保存前经过探活（v2）；AC2 = 探活失败回表单改字段不重启流程；AC3 = agent 改 config.json 后 /mcp 菜单可见可连（代配闭环）；AC4 = CLI 全量 + lint 绿（评审 #4 CLI-only）；AC5 = edit 只动所选字段（T18/T18b——v2 字段 picker 语义）。

**关键决策**：① 探活内置于 add/edit 确认流（probeMcpServer 复用，§4 资产）——竞品均无，消灭"配错删了重加"；② 字段级重试而非整流程重来；③ agent 代配走"edit config.json + 菜单磁盘重读"最小闭环（否决新 mcp-config 工具——加工具加维护面，edit 工具本就擅长改 JSON）；④ 直达/JSON/批量全裁（用户拍板）；⑤ 范围仅 CLI；⑥ **edit/add 用字段 picker 表单而非逐字段问答**（v2 用户纠偏——TUI 有游标 picker 却让用户按序过每个字段是设计错误；`-`/`k=` 微语法保留但仅在字段输入时生效）；⑦ add/edit 统一表单机制（F3b——一处实现两处复用）。

### §4 实现偏差与补记（2026-09-01 实现落地后回写）

- **AC1 测试指认**：`thincoder/test/mcp.test.mjs` → "T1 POST-only: openSSE 405 降级 → connect 成功、isAlive true、调用走 POST、无重连循环 (F1/AC1)"（mock：GET 405、POST initialize/tools/list/tools/call 成功；断言 connect 成功 + `transport.isAlive()===true` + tools/call 经 POST 返回）。AC2：CLI `T6+T12`（edit 流程）+ `T4/T5`（probe 零副作用）与 VS Code `probeMcpServer 成功/失败均零副作用`。AC3：CLI 932 pass / VS Code 837 pass（node --test 全量）+ 两端 eslint 0 error。
- **VS Code [Reconnect] 死按钮修复**（计划外发现）：webview `settings-tools.js` 一直在发 `reconnectMcp` 消息，但 panel-messages.mjs 路由表无对应 case（路由从 chat-panel 拆分时丢失）——按钮此前完全无效。本次随 `editMcp`/`testMcp` 一并补上路由（受影响文件表"实现追加触碰"行）。
- **probe 内部实现**：`probeMcpServer` 复用 `createConnectedTransport`（含 token 合成与 markPostOnly 降级链），不经 `connectMcpServer`/`mcpConnect`，故天然零 session 副作用；`finally close()` 保证探活连接必关。
- **CLI 握手失败防泄漏**（评审 #7）：`connectMcpServer` 对 `createConnectedTransport` 的失败 catch 中 `transport?.close()`——openSSE 降级成功但 POST initialize 失败时不留悬挂流。
- **CLI `_sessions` 导出**：probe 零副作用断言需要读 session 注册表计数——由模块私有改导出（只读用途）。
- **webview edit 复用 add 表单**：编辑时 name input 置 readonly（name 不可改，F3）；headers/env 输入改逗号分隔提示与解析（`k=` 删除该项），旧 JSON 形式输入不再接受——面板存储向后兼容（旧 config 数据不受影响），仅输入格式升级。
- **stdio edit 的 env 解析**：CLI `/mcp edit` 的 env 与 headers 同走逗号分隔语义（`KEY=value` 对，value 可含空格）；`/mcp add` stdio 流程的 env 提示同步改逗号分隔（原空格分隔多对的写法会把 `A=1 B=2` 解析错位）。

### §5 实现偏差与补记（2026-09-01）

- **落点**：`src/tui/cmd-mcp.mjs`（D-1 向导重构 `collectEntry`/`confirmLoop`/`pickRetryField`/`retryField`（统一函数，内部按 field 分支——审计更正）/`showPreview`/`maskToken`；D-2 主菜单循环重写 + per-server 子菜单；`serverLine` 行格式复用）；`src/config.mjs`（新增导出 `reloadMcpFromDisk(agent, path)` + 私有 `readMcpSection`/`diffMcpServers`/`mcpFingerprint`）；`test/mcp.test.mjs`（T15-T24 + T10/T6+T12 断言随新流程更新）；`test/slash-commands.test.mjs`（主菜单快照过期回归测试随新菜单形态更新；**T22 实质由本文件既有 remove/connect 精确匹配断言 + 全量绿覆盖——审计 #2 指认**）。
- **AC 指认（§5）**——**注意：以下指认反映 v1 落地态（2026-09-01）**，v2（2026-09-02）落地后已被 v2 指认取代（见下节）；保留作 v1 历史态记录。AC1 = §5 的 T10（实现中更新为 add 流程断言，非 §4 的 parseHeaders 测试）与 T15（3 问 + headers 追问默认跳过）+ T16（预览+探活 ✓ 后 Save 确认，含 maskToken len 12/13 边界断言——评审 #7）；AC2 = T17（token 失败 → v2 目标：回 fieldPicker 只重输 token → 复 probe 通过 → 保存——v1 实现态为 `pickRetryField` 字段级重试）；AC3 = T19/T21（disk 写入 → 菜单可见 → connect）+ T24（畸形回退）；AC4 = CLI 全量 + lint（见补记末行结果）；AC5 = T18/T18b（edit 只动所选字段——v2 目标语义）。对账 = T23。
- **`reloadMcpFromDisk` 可注入路径**（设计外最小追加）：第二参 `path` 供测试注入 tmp config（生产不传 = 默认 `~/.thincoder/config.json`）；cmd-mcp 经 `ctx.configPath` 透传，测试 ctx 均注入以隔离真实用户配置。
- **T23 对账裁定**：disk 删除/变更的**已连接** server——内存保留该行（连接不断）+ `changedNames` 持续标 drift（诚实报告真实漂移，直到 reconnect 回写或 remove 显式解决）；**未连接**且被 disk 删除的 server 随磁盘消失；disk 新增的 server 不是 drift（无 ⚠）。persistRaw 落盘后重读 fingerprint 一致 → 无标记（防环）。
- **config.json 文件丢失语义**：文件不存在时保留内存 mcp servers（与畸形回退同策略——不因文件消失静默清空用户配置）。
- **`mcp.servers` 非数组边角**（审计 #4）——**待办已移 docs/TODO.md**（评审 #3：设计文档不承载待办，仅留指针），实现方向见 TODO.md 该条（`readMcpSection` 对非数组改判 `ok:false` 走畸形回退）。
- **字段级重试的 save-anyway 语义**：探活失败路径的保存要求**显式 y**（`Save anyway? (y/N)`，默认 no）——坏配置不能被回车顺手存进去；探活成功路径 `Save? (Y/n)` 默认 y。stdio 失败重试字段 = command/args/env（设计 D-1"stdio 同理"落位）。
- **主菜单 action 命名空间**：server 行 action 用 `@name:` 前缀——server 可叫 "add"/"refresh" 而不与保留动作撞名。
- **AI 生成同走确认环**：`/mcp ai` 生成的 entry 与手工 add 一致走预览+probe+Save（F2 语义统一；原实现为简单 y/n 确认）。
- **测试指认**：`test/mcp.test.mjs` 22 tests + `test/slash-commands.test.mjs` 34 tests 全绿；CLI 全量 `npm test` 983 tests（939 pass / 0 fail / 44 skipped——skipped 均为既有 slow 项，`THINCODER_TEST_FULL=1` 全跑）；`eslint src test` 0 error（48 warnings 均为既有 no-unused-vars）。
- **行数审计（评审 #4）**：`cmd-mcp.mjs` 实现后 499 行（≤500 硬限压线）——后续加功能须先拆分（表单机制可独立为 `cmd-mcp-form.mjs`）。

### §5 实现偏差与补记（2026-09-02，v2）

- **落点**：`src/tui/cmd-mcp-form.mjs`（**ADD——评审 #1 拆分前置落地**：`fieldPicker`（D-1 表单循环）/字段行渲染（`formEntries`/`fieldDisplay`——label 补齐、maskToken 打码、`(required)` 标注、`N items`）/字段输入收集器（`fieldPrompt`/`applyFieldInput`——空=不变、`-`=删可选字段、`k=`=删 header/env 项、required 字段拒绝 `-`）/`cloneEntry` 工作副本；v1 的 `mergeKeyValuePairs`/`maskToken` 迁入——**parseHeaders 未迁移**：v2 的 headers/env 输入统一按"键值对合并/删除"语义处理（`applyFieldInput` 走 `mergeKeyValuePairs`），原 parseHeaders 的整段替换语义不再需要；逗号分隔解析（value 含空格）并入 mergeKeyValuePairs，F6③ 行为保留）；`src/tui/cmd-mcp.mjs`（删 `collectEntry`/`pickRetryField`/`retryField`/`kvPrompt`/`applyKvEdit`；`confirmLoop(entry, retryEntry)` 探活失败 → `Save anyway? (y/N)` 显式 y → 否则 `retryEntry` 回 fieldPicker；`editServerWithConfirm` 改 fieldPicker（mode edit——无 name 行）；`addWithTransport` 改 fieldPicker（mode add——空 entry 起、name 行 + existingNames 重复检查）；addWithAI 探活失败同走 fieldPicker（mode add））——**拆分后 cmd-mcp.mjs 382 行**（v1 499 行压线问题解除，≤500 硬限）；表单文件 198 行（≤300 建议）。
- **AC 指认（v2 落地态）**：AC1 = `test/mcp.test.mjs` `T15 add 字段表单 (v2)`（空起 + (required) 标注、只填所选字段、Save 校验必填——persistCount===1 断言校验失败的 Save 不落盘）+ `T16`（探活 ✓ 报告进预览、maskToken 打码、Save? (Y/n) 默认 y、y 后 connect 入 agent.tools）；AC2 = `T17 探活失败回表单改字段`（401 → Save anyway? n → fieldPicker 只重输 token → 复 probe 通过 → 保存；url/headers 保留——表单第 5 轮 url 行仍为原值断言）；AC3 = T19/T21（disk 写入 → 菜单可见 → connect）+ T24（畸形回退）——v1 已实现，本次回归全绿；AC4 = CLI 全量 + lint（见本段末行结果）；AC5 = `T18 /mcp edit 字段 picker`（只改 token/headers——url 不动、无 name 行断言、'k=' 清除语义、指纹变更触发重连、预览无明文 token）+ `T18b`（连改 url+token 两字段、中间 Esc（空输入）回 picker 不丢已改值）+ 附加 `T12 v2 '-' 清除 token 字段`。对账 = T23（未动，回归）。**T22 回归**：`/mcp edit|test|remove|connect <name>` 直达参数路径零改动（resolveServer 未动）——slash-commands.test.mjs 既有 remove/connect 断言 + 全量绿覆盖。
- **save-anyway 顺序裁定**（设计空白处——v2 无 retry picker 后 save-anyway 落位）：探活失败 → 先问 `Save anyway? (y/N)`（显式 y——探活失败的坏配置不能被回车顺手存进，v1 语义保留）→ 答 n 才回 fieldPicker 重输。机制上与 v1 等价（失败后两条路：显式 y 保存 / 回表单改字段复 probe），仅问句位置从 retry picker 行变为确认环内独立问句。
- **取消语义**：fieldPicker 层 Esc（首个表单）→ 静默返回（v1 `collectEntry` 空返回同款）；confirmLoop 层取消（Save? n / Save anyway? n 后表单 Esc）→ `[mcp] Cancelled`（add）/ `[mcp] Edit cancelled — nothing saved`（edit）。
- **字段行 action 命名空间**：`field:<name>` 前缀 + `save`——与主菜单 `@name:` / `add` / `refresh` 及子菜单 edit/test/connect/remove 不撞名。
- **测试指认**：`test/mcp.test.mjs` 29 tests（含 T15b stdio 字段表单单元测试——共享机制的 stdio 变体 + env 逗号解析 value 含空格；**2026-09-02 覆盖补全（审计修正轮）**：T15c required 字段拒绝 `-`、T15d duplicate name `already exists`、T16b maskToken len>12 前4+…截断、T16c Save? n 取消不保存不连接；T18b 由 T19 回调内提升为独立顶层 test——测试树结构修正，断言未动）+ `test/slash-commands.test.mjs` 34 tests（33 pass/1 skipped slow）全绿；CLI 全量 `npm test` 994 tests（950 pass / 0 fail / 44 skipped——skipped 均为既有 slow 项，`THINCODER_TEST_FULL=1` 全跑）；`eslint src test` 0 error（warnings 均为既有 no-unused-vars 类，本交付触及文件无新增 lint 问题——mcp.test.mjs 的 countFile warning 系既有模板字符串参数）。
- **行数审计（评审 #4 复验）**：`cmd-mcp.mjs` 382 行（≤500 硬限）；`cmd-mcp-form.mjs` 198 行（≤300 建议）。后续加功能仍须守拆分纪律。


### §5 变更段：save&test 确认问句废除（2026-09-02，用户问题 Q4）

> **状态：设计定稿，待实现**。用户裁定："Save & test 时问的问题完全不知道该填什么，无厘头——不需要问，保存时直接拉一下 MCP 工具，正常就保存，拉不到就报错让用户改"。**终裁补充：探活失败不提供任何保存通道（save-anyway 整个废除——"探活失败还存干嘛"）**。

**需求变更**（覆盖 §5 F2/D-1 的确认环语义）：

| 项 | v2 现状（2026-09-02 交付） | 变更后 |
|---|---|---|
| 探活成功 | 预览 + probe ✓ → `Save? (Y/n)` 确认 → 保存 | 预览 + probe ✓ → **直接保存**（无问句） |
| 探活失败 | `Save anyway? (y/N)` 显式 y 可保存；否则回表单 | **无保存通道**——报错 + 回 fieldPicker 改字段复 probe |
| save-anyway | 存在（显式 y） | **整个废除** |

**设计**：

- **D-Q1 `confirmLoop` 重构**（cmd-mcp.mjs）：`showPreview` + `probeLineFor` 后——probe ✓ → 直接 `persistRaw` + `connectServer`（返回 entry）；probe ✗ → push 错误行（`[mcp] Probe failed: <错误> — fix it in the form`）+ `retryEntry` 回 fieldPicker（复用现有 retryEntry——AC2 语义不变）。**删除两个 askQuestion 分支**（`Save? (Y/n)` / `Save anyway? (y/N)`）。
- **D-Q2 取消语义保留**：表单层 Esc 静默返回不变（用户在改字段前放弃 = 不保存）；confirmLoop 内不再有"取消点"（原 Save? n 的取消路径随问句删除——想放弃直接 Esc 表单即可，语义等价）。
- **D-Q3 测试更新**（test/mcp.test.mjs）：
  - T16（探活成功）→ 断言**无 Save? 问句**、直接保存（persistRaw + connect 断言保留）
  - T16c（原 Save? n 取消）→ **删除**（无问句即无该路径）；改补"探活成功直接保存"断言并入 T16
  - T17（探活失败回表单）→ 断言**无 Save anyway? 问句**、直接回表单（重输 token → 复 probe → 保存）
  - 新增 T25：探活失败后无任何保存通道（config 未写、agent.tools 无新增）

**受影响文件**：`src/tui/cmd-mcp.mjs`（confirmLoop）、`test/mcp.test.mjs`（T16/T16c/T17 + 新增 T25）、`docs/design/MCP.md`（本节 + §5 F2 表格更新）、`CHANGELOG.md`（0.12.55 或下版条目更新）。

**测试**：

| # | 场景 | 输入 | 预期 | 映射 |
|---|---|---|---|---|
| T16' | 探活成功直接保存 | mock probe ✓ | 无 Save? 问句；persistRaw + connectServer 触发；预览含遮蔽 token | D-Q1 |
| T17' | 探活失败回表单 | mock probe ✗（401） | 无 Save anyway? 问句；错误行 + 回 fieldPicker；重输 token 复 probe 通过保存 | D-Q1 |
| T25 | 失败零保存通道 | probe ✗ 后直接退出 | config 未写；agent.tools 无新增；无保存入口 | D-Q1 |
| T18' | edit 探活失败同语义 | edit 改 url 后 probe ✗ | 回表单改字段；不保存 | D-Q1 |
| 回归 | 全量 | — | mcp.test.mjs 全绿 + CLI 全量 + lint | — |

**验收**：AC1 = 探活成功零问句直接保存；AC2 = 探活失败报错回表单且无任何保存通道；AC3 = 取消仅剩表单 Esc（放弃）；AC4 = CLI 全量 + lint 绿。

**关键决策**：① **问句废除而非改文案**（用户明确"不需要问"——探活本身就是验证，确认多余）；② **save-anyway 废除**（"探活失败还存干嘛"——失败配置不落盘是数据安全，重启修复场景不存在）；③ 预览保留（保存前一眼可见配置是价值，非负担）；④ probe 失败零副作用语义不变（§4 资产）。

