# MCP 客户端（MCP）· 核心统一子系统档

> 板块归属 = **核心统一**（phase 2——「一个核 + 两个薄壳」）；本档 = 该板块的**子系统设计档**。
> 工作流档 = `docs/core/design/CORE-UNIFICATION.md`（事实基线 / 核形态与消费契约 / 方案选型 / S0 方法 / 分段执行 S0a–S3 / 关键决策 / 验收回指 / 裁定 A1–A8 / 契约兼容策略 / 测试用例）——**本档不复制**。
> 需求层 = `docs/core/requirements/CORE-UNIFICATION.md`（F1–F13 / N1–N8）。
> **列定义**（裁决行各列含义）→ `CORE-UNIFICATION.md` §2.5；**须裁条目的分组口径与四要素提交形式** → 该档 §2.5.1。
> **机制面**（§6–§7）：机制 / 契约的实质描述 · 关键决策——**本档 = 该板块的完整设计面**（裁决行 + 机制 + 决策）。

## 1. 归属与范围（自本档行内容的路径归纳）

| 面 | CLI 档 | VSC 档 |
|---|---|---|
| 客户端入口 | 核 `thincoder-core/mcp.mjs`（唯一实现） | 同核（端壳增量 = `thincoder-vscode/src/extension/panel-mcp.mjs`） |
| 基础件 | 核 `thincoder-core/mcp/helpers.mjs` | 同核 |
| 传输 | 核 `mcp/transport-stdio.mjs` · `transport-http.mjs` · `transport-ws.mjs` | 同核 |

**共同契约**：可配项（三种传输）与 `mcp.servers[]` 同源。

## 2. 核模块裁决行（自 `CORE-UNIFICATION.md` §2.5 搬入 · 逐字）

### 2.1 同路径对

| # | 相对路径 / 对位 | 面 | 相似度 · 逐字节 | 分类 | 目标 | 端差处置 | 前提校验 | 须用户裁 | 归属段 |
|---|---|---|---|---|---|---|---|---|---|
| 81 | `mcp.mjs` | 同路径 | 0.0130 · 异 | ② | 进核（**同名不同物**：CLI `mcp.mjs` = 真实现；VSC 侧 12 行转口 + 实现搬 `src/mcp/**`） | 融合：取 CLI 实现 + VSC 的分档结构与配置面板 / 监视面按端注入（④ 段） | 分叉 ＝ 拆分位置；可配项（三种传输）与 `mcp.servers[]` 同源、运维面等价；前提（同职责）仍成立 | — | S1（建核补齐） |

### 2.2 语义对位遍行（同职责但相对路径不同）

| # | 对位（CLI ↔ VSC） | 分类 | 端差处置 | 前提校验 | 须用户裁 | 归属段 |
|---|---|---|---|---|---|---|
| 144 | `src/mcp/helpers.mjs` ↔ `src/mcp/utils.mjs` | ② | 融合：取一侧（常量 + RPC id 生成） | 分叉 ＝ 档名（helpers / utils）；常量逐条同值（`INIT_TIMEOUT_MS` / `CALL_TIMEOUT_MS` / `ENDPOINT_WAIT_MS`）⇒ 前提成立 | — | S1（建核补齐） |
| 145 | `src/mcp/transport-stdio.mjs` ↔ `src/mcp/stdio.mjs` | ② | 融合：取一侧 + 核内 `mcp/` 切分归位 | 分叉 ＝ 档名与目录；同源自述 ⇒ 前提成立 | — | S1（建核补齐） |
| 146 | `src/mcp/transport-http.mjs` ↔ `src/mcp/http.mjs` | ② | 融合：同 #145 | 同 #145（VSC `http.mjs:252` 自述「与 CLI 语义同构」）⇒ 前提成立 | — | S1（建核补齐） |
| 147 | `src/mcp/transport-ws.mjs` ↔ `src/mcp/ws.mjs` | ② | 融合：同 #145 | 同 #145 ⇒ 前提成立 | — | S1（建核补齐） |
| 148 | `src/mcp.mjs` ↔ `src/mcp/index.mjs` | ② | 融合：核内单一切分 + 端侧配置面板 / 监视面按端注入 | 分叉 ＝ 组织（VSC 2 行转口 + `mcp/index.mjs`）；可配项（三种传输）与 `mcp.servers[]` 同源；**承 §2.5 #81** | —（承 #81） | S1（建核补齐） |

## 3. 须用户裁条目

**本子系统无 §2.5.1 行**（无命中 ①②③ 的条目——行内端差均以注入承载）。

## 4. 对外契约影响

**本子系统无 §2.12.2 处置表行**；相关端差（配置面板 / 监视面 = 端特有段）见 §1 与上文行「端差处置」列。

## 6. 机制面

> **本节 = 机制 / 契约的实质描述 · 实现细节与坐标 · 关键决策依据**（§7）。
> **坐标口径**：本节按现状路径落笔（`thincoder-core/mcp.mjs` / `thincoder-core/mcp/**`；`thincoder-cli/src/tui/**` = CLI 壳体面）。符号名与档路径为契约面，行号仅供定位。

### 6.1 定位与术语

MCP（Model Context Protocol）客户端把外部 MCP server 的 `tools/list` 工具**动态展开**为独立原生工具（`{server}_{tool}` 前缀、完整 `inputSchema`、execute 直调 `tools/call`），并入 `agent.tools`，经统一 OpenAI function-calling schema 暴露给模型，支持三种传输：**stdio**（本地子进程）、**HTTP**（Streamable HTTP + SSE）、**WebSocket**。

**当前态**：工具展开机制两端（CLI / VS Code）语义一致，**无网关式 `mcp` 工具**（builtinTools 不含），无残留引用；模型不手动 `connect → list → call` 三层路由；`/mcp` 是唯一的配置 / 连接管理入口。

**术语**：server / config = 一份 MCP server 配置（一个 name + 一种传输端点）· session = 一次活的连接（registry 键控项）· transport = 一种传输协议实现 · postOnly = Streamable POST-only 模式（server 不支持 GET SSE）· fingerprint = config 的 JSON 归一指纹（识别配置变更触发重连）。

### 6.2 工具展开

`connectMcpServer(config)` 成功后，把 server `tools/list` 返回的每个工具包装为独立工具并入 `agent.tools`（展开逻辑在 `thincoder-core/mcp.mjs`）。

- **命名**：前缀 = `` `${config.name}_` ``；config 无 name 用 `mcp_`；`sanitizeToolName` 把 `[^a-zA-Z0-9_-]` 清成 `_`、截断 64 字符；碰撞（同 server 工具重名 / sanitize 后重名）追加 `_2` / `_3`… 去重；空名或清成裸 `mcp_` 的工具跳过。
- **守卫**：description 非字符串 → 回退 `` `MCP tool: ${t.name}` ``；`inputSchema` 非对象 → 回退 `{ type: "object", properties: {} }`。
- **扩展元字段**：每个展开工具携带 `_mcpTransport`（所属 transport）与 `_mcpName`（server 名）——供连接状态展示与 `removeMcpTools` / `closeAllMcp` 按 server 归类。
- **无网关式 `mcp` 工具**：MCP 工具一律经展开为原生工具（connect / list / call / disconnect 四动作网关无对位）；连接状态展示不变。现体 = 核 `mcp.mjs` 展开面 + 端壳面板状态接口。

### 6.3 工具调用（execute 契约）

展开工具 execute 直接经 transport 调 MCP `tools/call`：

- **契约句**：`resp.error` → 抛 `` `MCP tool "${t.name}": ${resp.error.message}` ``；`resp.result?.isError` → 抛 `` `MCP tool "${t.name}": ${text || "(server reported an error)"}` ``；成功返回 = content 序列化后 join `"\n"`，为空 → `"(no output)"`。
- **content 序列化**（`extractMcpText`）：数组逐项——`text` 取 `.text`；`resource` → `` `[resource: ${c.resource?.uri}]` ``；其余 → `JSON.stringify`；非数组元素防御（字符串直接返回、非对象 JSON.stringify）。
- **输出截断**（`truncateMcpOutput`）：32,000 字符上限，超出 → 前 32,000 字符 + `"\n[… truncated: N chars omitted]"`——防 server 回超大响应撑爆上下文。
- **上层中断**：`ctx?.signal` 传 `send` 第 3 参（底层取消，pending 即刻作废）并经 `sendWithSignal` 竞速——挂死的 MCP server 不得拖住整轮 turn。

### 6.4 连接装配与热插拔

- **启动装配**：顶层 agent 装配时批量连接 `config.mcp.servers`——读取项目级 `.mcp.json`（`mcpServers` 为**对象**形态时并入——`config.json` 同名 server 优先；数组形态非规范 → 跳过并记录）；并发连接（`Promise.allSettled`）；
   **失败不阻塞**（死 server 只记 warning，`agent._mcpWarnings` 携带；**消费面 = CLI ∥ 桌面 ∥ VSC**（三端同形）——装配后入 `agent._pendingReminders`
   （CLI `thincoder-cli/src/command-interactive.mjs:161-168` ∥ 桌面 `thincoder-desktop/src/main/agent-host.mjs:185-189` 装配尾；

   VSC `thincoder-vscode/src/agent/setup.mjs` 装配尾），下一条 user 消息注入提醒（消费 = `thincoder-core/agent/setup.mjs:172-176`）；
   末行指路 = 端可达出口（CLI `/mcp connect <name>`；桌面 ∥ VSC = 设置面 MCP 段 Reconnect）；成功展开的工具并入 `agent.tools`。
- **项目文件源裁定（CLI ∕ 桌面同判）**：**发现面** = 项目根单层（`join(cwd, ".mcp.json")`，无向上多级搜索；文件缺 ⇒ 零读零效果）；**信任面** = 装配期零交互确认（项目文件与 `config.mcp.servers` 同信任域，不设首次信任 ∕ 端别门）；读 ∕ 解析失败非致命——记录不阻断装配。（VSC 端第三面已并；三端同判。）
- **幂等连接（registry 键控）**：registry（`_sessions`，serverName → session，模块级存活）已存在**同 name 活连接且 fingerprint 一致** → 直接复用已展开工具、不重建；fingerprint = config 关键字段（command / args / url / wsUrl / env / headers / token）的 JSON 归一；**config 变更**（fingerprint 不一致）→ 主动关旧连接（不触发 onDead 重连）+ 丢弃 session + 重建。
- **每轮重建与热插拔**：每轮 runAgent 重新装配 tools 数组——registry 状态变化天然在下一轮生效；已连 server 的展开工具**不因重建而丢失**（幂等复用）。
- **生命周期收口**：`closeAllMcp(agent)` 退出时关闭全部 session；`removeMcpTools(agent, serverName)` 把工具移出并关该 session。

### 6.5 配置机制

- **按传输的 config 形态**：`stdio: { name, command, args?, env? }` · `HTTP: { name, url, token?, headers? }` · `WS: { name, wsUrl, token?, headers? }`；name 是唯一键控名（不可改）；`headers` / `env` 为键值对象；`token` 为**一等可选字段**（HTTP/WS）；项目级 `.mcp.json` 亦可提供 server，但 `/mcp` 管理入口操作的仍是 `config.json` 的 `mcp.servers`。
- **token 合成规则**：client 自动合成 `headers.Authorization = "Bearer " + token`——**仅当 headers 未显式含 Authorization 时**（显式 headers 优先）；合成发生在传给 transport 前，**不写回 config**；WS 经 **subprotocol**（`bearer.<token>`）传递（Node 内置 WebSocket 无法自定义请求头；不注入 URL query——防日志泄露凭证）；
**fingerprint 计入 `token` 字段**（改 token → 指纹变更 → 重连）；token 明文存 `config.json`（不引入 keychain）——`token` ∕ `headers` ∕ `env` 值亦可存 `${env:VAR}` 引用（落盘不落明文；解析 = MCP 传输建连侧，单源 = `doc:CONFIG.md:§6.3`；指纹 ∕ 漂移比对仍按存储原文——env 变更不伪装为配置漂移；重连按当时环境重解析）。
- **headers / env 键值对输入**：**三端行集语义同源**——键值对按「行 = 一对」逐对编辑；提交四判据同源（trim ∥ 空键/空值行不提交 ∥ 重复键后行胜 ∥ 全空 ⇒ 字段删除）；值 = **字面**（逗号 ∥ 等号 ∥ 引号 ∥ 空格原样——零切分零剥离）。字段输入语义（非行集字段——name / url / wsUrl / command / token / args）：空输入 = 不变；`-` = 删除可选字段；required 字段（name / url / wsUrl / command）拒绝 `-`。
  **载体差（登记）**：CLI = 逐对「选择 + 问句」序（终端行流；键原地改名 = 删 + 加两步）∥ GUI 两端 = 同屏行格（每行键格 + 值格 + ✕；加删行——口径单源 = `docs/vsc/design/SETTINGS.md` §2.4 ∥ `docs/desktop/design/SETTINGS.md` §1 **KD-76**）——**实证例外（宿主差——终端行流 ∥ DOM 行格）**。

### 6.6 传输层与活性（isAlive 三态）

- **HTTP/SSE**（`thincoder-core/mcp/transport-http.mjs`）：GET SSE 不可用（405 / 不支持）时降级为**纯 Streamable POST 模式**；增 `postOnly` 标记 + `markPostOnly()`；**`isAlive` = `!closed && (eventSource != null || postOnly)`**——降级后 `eventSource` 恒 null，但 POST-only server 是活连接，
**不得因 `eventSource == null` 误判死**（曾致无意义重连循环）；主动 close 与 legacy SSE 流真实断开仍判死 + 走重连。Streamable POST 规范路径：所有通道统一先注册 pending（直接 JSON body / SSE 流 / 202 等待都经 pending resolve）；响应带 `Mcp-Session-Id` 记入后续请求头。
- **会话过期自愈（D-MC18）**：POST 收 **404**（MCP 会话失效语义）⇒ transport 内三步——清 `sessionId` ⇒ 重新 `initialize`
  （+ `notifications/initialized`；参数单源 = 建连时 `setInitPayload` 注入）⇒ 重试原请求**一次**（每原请求至多一次；重建进行中并发 404 共享同一重建——单飞）。
  重建失败 / 二次 404 ⇒ 照旧报错 + `fireDead`（既有退避重连链兜底）；`isAlive` 对未修复的会话死态返 false（`sessionDead` 标记）⇒ 下次 `ensureAlive` 走重连。非 404 错误行为不变。

  **射程 = Streamable POST 面（含 postOnly）；legacySSE 分支零触**——无会话语义（不读写 `sessionId`；非 2xx 直映射照旧）。
- **stdio**（`transport-stdio.mjs`）：本地子进程 `stdioTransport(command, args, env)`——env 合并到 `process.env` 之上；JSON-RPC over stdio。
  **树杀（`killTree`）**：win32 = `taskkill /pid <pid> /T /F` **同步形**（`spawnSync`——退出路径 `process.on("exit")` 仅同步合法，异步 `spawn` 不落地 ⇒ 子进程退出泄漏）；

  POSIX = **detached 新进程组 + 组杀**：正常相位 = 组 `SIGTERM` → 2s 组 `SIGKILL` 升级（组杀覆盖孙进程）；
  **退出相位**（升级 timer 不触发——`process.on("exit")` 无事件循环）⇒ 同步组 `SIGKILL` 直达——忽略 SIGTERM 的子进程亦必死。

  相位判定 = `transport-stdio.mjs` 加载期注册的 exit 钩子置的模块级标志（注册序恒早于宿主 cleanup）；

  组杀 = `process.kill(-child.pid, sig)`（detached 组长 = 组 id，非组长负 pid 内核返 ESRCH——不误杀；内核级实证 + Node 文档负 pid 组杀语义）。
  **`detached` 副作用**：终端 `SIGINT` / `SIGHUP` 不再直传 MCP 子进程（生命周期由 close 链负责）；父进程被 `SIGKILL` 等非正常终止时子进程孤儿化存留概率上升——处置 = 接受登记（对冲如需另批）。§7 D-MC19。
- **WS**（`transport-ws.mjs`）：`isAlive` = `!closed && ws?.readyState === WebSocket.OPEN`；连接死亡经 `onDead` / `fireDead`；认证经 subprotocol；上层 signal abort 即刻作废 pending + 发 `notifications/cancelled`。
- **活性判定汇总**：HTTP legacy SSE = `!closed && eventSource != null`（流断 → fireDead）；HTTP postOnly = `!closed && postOnly`（恒真至 close，无流可断）；WS = `!closed && readyState === OPEN`；stdio = 进程退出 → error / close。

### 6.7 探活（`probeMcpServer`）

`thincoder-core/mcp.mjs` 导出的 `probeMcpServer(config)` 对一份配置做**一次性探活**：`createConnectedTransport(config)`（initialize + tools/list，含 token 合成与 postOnly 降级链）+ 计时 → `{ ok, toolCount, tools, latencyMs, error }`（`tools` = 工具名数组），`finally transport.close()`。

**零副作用契约**：不进 `_sessions`、不动 `agent.tools`、无 onDead 挂钩、探完必关；**不复用 `connectMcpServer`**（避免污染 session 幂等表）；initialize 与 tools/list 同受 `INIT_TIMEOUT_MS`（30s）约束。调用点 = `/mcp test [name]` 与 add/edit 保存前的探活确认环。

### 6.8 `/mcp` 配置交互

配置来源在每轮菜单循环边界**从磁盘重读**（保证 agent 代配后菜单可见）。

- **列表即菜单**：主菜单 = server 列表本身（每行 `●/○ name (端点)`，行尾对账标记 `⚠ disk changed`；顶部固定 agent 代配提示行；底部 `+ Add server` / `↻ Refresh`）；选中 server 行 → per-server 子菜单（`Edit config` / `Test connection` / `Reconnect` / `Remove`）——**编辑 / 测试 / 重连 / 移除不再是主菜单项**；
server 行 action 用 `@name:` 命名空间（与 `add` / `refresh` 保留动作不撞名）。
- **直达参数**：`/mcp list | add | http|ws|stdio|ai | edit [name] | test [name] | remove [name] | connect [name]`。
- **字段 picker 表单（v2，edit/add 统一）**：picker 列可编辑字段行 + 末行 `✓ Save & test`；字段行按传输（HTTP = URL / Token / Headers；WS = WebSocket URL / Token / Headers；stdio = Command / Args / Env）；**edit 无 name 行**（name 不可改）、add 含 `Name` 行 + 现有 name 重复检查；add 与 edit **同一表单机制**（一处实现两处复用）；中间 Esc（空输入）
回 picker **不丢已改值**（工作副本，取消不污染原配置）；AI 生成降 transport picker 末位。**必填校验**未满足 → 留在 picker；name 重复 → 明确报错。
- **保存前探活确认环**：向导收集完成后先 `probeMcpServer` 当场探活——预览表（name / transport / endpoint / token 遮蔽 / headers·env 键列表 + 探活报告同屏）；探活成功 → 报告 `✓ N tools, Xms` → **直接保存**（无任何问句）；探活失败 → 报告错误 → **回同一 picker 改字段复 probe**；**无任何保存通道**（save-anyway 整个废除——失败配置零保存）。
- **agent 代配（磁盘重读 + fingerprint 对账）**：`reloadMcpFromDisk(agent, path?)`（`thincoder-core/config.mjs`）读磁盘 config.json → 仅替换 mcp 段；**调用点收敛到菜单打开边界**；对账规则——disk 删除 / 变更的**已连接** server：连接保持不断，内存保留该行 + 持续标 `⚠ disk changed`（诚实报告真实漂移）；disk **新增**不是 drift；未连接且被 disk 删除的随磁盘消失；
畸形 config.json / 文件丢失 → 回退内存态 + 菜单提示（**不静默清空用户配置**）；persistRaw 落盘后重读 fingerprint 一致（幂等，无 ⚠）；**写冲突已知取舍**（同一时刻单写者假设——不做双写合并）。
- **保存 / 重连输出**：add → `Connecting <name>...` → 连接摘要 + 每工具一行；reconnect / connect 失败 / remove / edit 各有确定文案；持久化在磁盘 `raw.mcp.servers` 上按 name 原位替换 / 删除、**保持数组序**。

### 6.9 失效与失败语义

- **连接失败不阻塞**：启动 / 装配 / 重连失败不阻塞对话（warning 记录，下一轮可再试）；展开工具执行失败抛错 → dispatch 捕获 → 模型见 `Error: …`。
- **postOnly 失效语义**：`isAlive` 恒真至 close、无流可断、**不自发 fireDead**；**会话过期（HTTP 404）由 transport 内自愈链承接**（D-MC18——清会话 + 重建 + 重试一次；重建失败才报错）；端点死亡仍表现为 per-call 错误（手动恢复 = `/mcp reconnect`）。
- **legacy 断流重连（后台退避）**：legacy SSE 流真实断开 → `scheduleReconnect` 后台退避（延迟表 `[1000, 2000, 4000, 8000]`ms 四轮）；成功替换 `session.state.transport`（tools 闭包动态引用 transport——**agent.tools 无需重建**即自愈）；四轮耗尽 → 明确 reconnect 失败文案，静默（下次 execute 前置检查再试）；同 name 重连进行中不复发。
- **`ensureAlive`（执行前活性检查）**：transport 活 → 直接用；死 → 等 / 触发一次重连；重连失败 → 抛不可用错误透给模型。
- **握手失败防泄漏**：`connectMcpServer` 对 `createConnectedTransport` 失败 catch 中关 transport——openSSE 降级成功但 POST initialize 失败时不留悬挂流（否则 SSE reader / 请求悬挂泄漏）；probe 的 `finally close()` 同理。

### 6.10 VS Code Settings 面板 MCP 页

> 本节 = **VSC 配置面板面**（机制 / 坐标）。与 CLI 同源的传输 / 展开 / 幂等 / 探活 / 失效语义住 §6.1–§6.9，不重复（D2）。
> 接入 / 展开 / 幂等 / 探活 / 自愈均走核 `thincoder-core/mcp.mjs`（name 键 session 面）；端壳增量（client-id 注册表 + 面板状态接口）住 `thincoder-vscode/src/extension/panel-mcp.mjs`。

- **VSC 无 `/mcp` 命令面（结构性端差）**：CLI 有 `/mcp` TUI（§6.8）；VS Code 配置 / 连接全在 **Settings 面板
MCP 页**——`pushMcpStatus`（`thincoder-vscode/src/extension/panel-mcp.mjs:96`）推 `mcpStatus { servers: [{ name,
desc, connected, toolCount, config }] }`（●/○ 连接态 + N tools + 原始 config 供表单预填）。动作消息 →

`reconnectMcp`（`:116`——断开 + 重连）、`testMcp`（核 `probeMcpServer`）、`editMcp`（`saveMcpServer` =
add-or-update 原位 → 推状态）。面板 [Edit] 与 [Add] 复用同一表单（已存在 ⇒ 原位 update；add 侧失败（含并发冲突）原串上抛）。工具展开器

（行内 [tools]）载荷 = 面板契约投影 `{ name, description, inputSchema }`（端壳 `panelToolList` 自核原生
工具投影——schema 取 `parameters`；工具名 = 原生 `{server}_{tool}` 名）。
- **config-mcp.mjs（config.json `mcp.servers[]` 读写——纯 Node，extension host 外可做单元测试）**：`loadMcpServers`
（`:12`——过滤无 name / 非对象项）· `addMcpServer`（`:19`——name 重复拒）· `updateMcpServer`（`:37`——原位替换、
数组序保持、name 不可改、transport 字段被清空时回落到既有条目的类型与值——编辑表单只改 token/headers
不产出退化 `{name}`）· `removeMcpServer`（`:63`）；三者经 `persistRaw` + `conflictError`（并发写冲突 → 同型提示串）。
- **启动装配（depth-0 only）**：面板回合把 `mcpServers: getMcpServers()` 注入 runAgent opts（panel-chat.mjs）；
`setupAgentRun` 在 **depth-0** 且 `mcpServers` 非空时动态 import 端壳 MCP 面 `thincoder-vscode/src/extension/panel-mcp.mjs` → `connectMcpServersExpanded`
（`Promise.allSettled` 并发、失败隔离：每死 server 记 warning、其余照常；展开整体失败非致命——模型本轮缺
MCP 工具、下轮重试）。**子代理不含 MCP**：装配仅 depth-0 展开；depth>0 无 MCP 工具。
- **命连接 / 重连细节（核 `mcp.mjs` name 键 session 面）**：`mcpConnect(config)` 幂等（核 `_sessions` Map：serverName → session `{ config, configFingerprint, state: { transport, tools } }`；端壳只保 client-id 面 `{ id, serverName, tools }`）；同 name 活连接且指纹一致 → 复用；`_reconnecting`
（serverName → promise）去重双重建连；`transport.onDead` 死后后台退避重连（延迟表四轮），
成功原位替换 `session.state.transport`（**name 键不变**——工具闭包动态取 transport）。
- **探活（核 `probeMcpServer`——CLI 镜像）**：一次性 initialize + tools/list + 计时 → `{ ok, toolCount, tools, latencyMs }` / `{ ok:false, error }`；**零副作用**（不进 `_sessions`、无 onDead 挂钩、finally close；handshake 失败 catch 中 `transport?.close()` 防泄漏）；initialize 与 tools/list 分页循环每页受 `INIT_TIMEOUT_MS`(30s) 约束。
- **生命周期与面板反馈（端壳 `panel-mcp.mjs`）**：`closeAllMcp()`（extension deactivate / 面板 view dispose——逐核 session close）；`mcpDisconnectByName(name)`（面板 [Reconnect] 先断开再重连）；`mcpConnectedNames()` / `mcpConnectedToolCounts()`（●/○ 状态与工具数——读核 name 键 session 注册表）；连接 / 断开 / 重连变更在**下一轮 runAgent 装配**生效（热插拔）。
- **agent 代配差异（无磁盘重读菜单）**：VSC 每轮 `loadRaw` 即磁盘——agent 用 edit 工具直接改 `mcp.servers[]` 后，下轮装配（重读 config）自然生效；无 CLI 的菜单边界磁盘重读 / fingerprint 对账交互（机制本体 = §6.4 / §6.8）。

## 7. 关键决策记录

| # | 决策 | 理由 |
|---|---|---|
| D-MC1 | 工具**动态展开为原生工具**（非网关式） | 模型无需学习 MCP 专用路由；已连接 server 的工具就像内建工具一样可用（schema 完整、可并行） |
| D-MC2 | **MCP 工具一律展开为原生工具，不设网关式 `mcp` 工具** | 三层路由对模型是额外学习成本；现体 = 核 `mcp.mjs` 展开面（无四动作网关） |
| D-MC3 | 命名 = `{server}_{tool}` + sanitize + 碰撞去重 | 跨 server 工具名必须唯一可寻址；空名 / 裸 `mcp_` 跳过 |
| D-MC4 | 输出截断 = **32,000 字符** | 防 server 回超大响应撑爆上下文 |
| D-MC5 | **失败不阻塞对话**（warning + 下一条 user 消息注入） | 一个死 server 不得拦整个会话；其余 server 照常 |
| D-MC6 | 连接幂等 = **fingerprint 键控复用** | 重复 add 同一 server 不产生双实例；config 变更才重建 |
| D-MC7 | `token` = **一等可选字段 + 自动合成 Bearer** | 简化配置；显式 headers 优先（向后兼容）；不写回 config |
| D-MC8 | WS 认证走 **subprotocol**（非 URL query） | Node 内置 WebSocket 无法自定义请求头；防代理 / 网关日志泄露凭证 |
| D-MC9 | headers / env 输入 = **行集语义（三端同源）**——「行 = 一对」逐对编辑；**载体**：CLI = 逐对「选择 + 问句」序 ∥ GUI 两端 = 行格（见 §6.5） | 旧 CLI 串式半语法（逗号切分 ∥ 首 `=` ∥ 成对引号剥离）值含逗号即坏（`KEY=va,lue` ⇒ 残片）；行集化后值为字面、零解析零剥离——与 GUI 行格同语义 |
| D-MC10 | **postOnly 三态**（不因 `eventSource == null` 误判死） | 曾致 `ensureAlive` 误判死连接 → 无意义重连循环 |
| D-MC11 | `probeMcpServer` **零副作用 + 不复用 connectMcpServer** | 避免污染 session 幂等表（`_sessions`）；探完必关 |
| D-MC12 | 保存前探活确认环 —— **save-anyway 整个废除** | 失败配置零保存（不落盘）；防“保存了但连不上”的隐性故障 |
| D-MC13 | 列表即菜单 + `@name:` 命名空间 | 消灭「四个操作各自弹一次 server picker」的重复；server 可叫 add / refresh 不撞名 |
| D-MC14 | agent 代配 = **磁盘重读 + fingerprint 对账**（漂移诚实报告） | disk 变更 / 删除已连 server 时不误断正在用的；`⚠ disk changed` 持续标记到显式解决 |
| D-MC15 | **单写者假设**（不做双写合并） | 既有 config 写入模型；仅记录不引入新机制 |
| D-MC16 | VSC 配置 / 连接入口 = **Settings 面板 MCP 页**（无 `/mcp` 命令面） | VSC 无 TUI 命令通道——结构性端差；面板表单 add-or-update 复用、探活确认环（§6.5 语义）对齐 CLI 保存前探活 |
| D-MC17 | 退出路径树杀**同步合法**：win32 `killTree` 用 `spawnSync("taskkill", …)`（`/T /F` 语义不变） | `process.on("exit")` 阶段仅同步合法——异步 `spawn` 不落地 ⇒ 退出泄漏；代价 = 关闭路径同步阻塞 20–50ms（close 非热路径，可接受）。 |
| D-MC18 | HTTP 会话过期（404）= **transport 内自愈**（清会话 + 重新 initialize + 重试一次；单飞重建；失败 ⇒ fireDead 退避链兜底） | 「404 直接映射错误、不重置会话」= 会话过期后每次调用重复失败（无自愈——用户只能手动 `/mcp reconnect`）；直接走 `scheduleReconnect` 过重（1s+ 退避起步 + 全量重建含 SSE 重开——「会话刚过期」是高频临时态）。 |
