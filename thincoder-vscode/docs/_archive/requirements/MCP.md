# MCP（MCP 客户端）— 需求（VSC 仓）

> 板块：工具系统 · MCP 客户端。本仓自持需求档（异层者建档——需求住本仓；依据 = `ENGINEERING-MODE（本仓·需求）§1.3` F11）。
> 对位档：`MCP（CLI 仓·需求）§1–§4`——语义同源、本端原文自持（不做逐字一致）；端差登记见本档 §4。
> 设计见 `MCP（本仓·设计）`（权威源 = 核 `thincoder-core/mcp.mjs` 等实现——W7 迁移；端壳增量 = `src/extension/panel-mcp.mjs`）；关联面 = `TOOLS（本仓·需求）`（工具表装配）· `SETTINGS-TOOL（本仓·需求）`（面板 MCP 页）。
> 实测口径 as-of 2026-09-12。

## 1. 总体需求

把外部 MCP server 的工具**动态展开为原生工具**并入 agent 工具面——模型无需学习任何 MCP 专用路由，
已连接 server 的工具就像内建工具一样可调用、可并行；连接配置与连接态在 Settings 面板 MCP 页管理（本端无命令面）。

## 2. 功能性需求

| # | 需求 | 判定句（验收语义） | 范围边界（不做） |
|---|---|---|---|
| F-M1 | **动态展开**：拉取 server `tools/list` → 展开为独立原生工具（`{server}_{tool}` 前缀 + 完整 inputSchema + execute 直调 `tools/call`），并入 agent 工具表。证据 = `thincoder-core/mcp.mjs:130/225` · `src/agent/setup.mjs:176-201` | 连接后工具表含该 server 工具（命名前缀 + schema 完整 + 直调）；模型无需 connect/list/call 三层路由即可调用（depth-0 装配面）；碰撞 / 畸形防御在位（改名去重 / 空名跳过 / schema 回退默认） | 不做网关式 `mcp` 工具（已废弃——无三层路由）；不做 per-tool 只读过滤（`readonly: false` 与内建同面） |
| F-M2 | **三种传输**：stdio（本地子进程）/ HTTP（Streamable HTTP + SSE）/ WebSocket；各 transport 自带 `send/notify/close` + `onDead` + `isAlive`。证据 = 核 `thincoder-core/mcp/{transport-stdio,transport-http,transport-ws,helpers}.mjs` | 三 transport 在册且形态齐；HTTP GET SSE 不可用（405）→ postOnly 降级且 `isAlive` 不误判死；WS 认证经 subprotocol（不注入 URL query——防代理日志泄凭证） | 不做 server 托管 / 编排（只管客户端连接与展开） |
| F-M3 | **配置与管理入口**：config.json `mcp.servers[]`（add / update / remove——name 重复拒、name 不可改、清空 transport 字段回落既有）；Settings 面板 MCP 页（状态推送 / 重连 / 探活 / 编辑）。证据 = `src/config-mcp.mjs:12-63` · `src/extension/panel-mcp.mjs:96-156` | 面板显示 ●/○ + N tools + 原始 config（表单预填）；[Test] = 一次性探活零副作用（不进注册表、探完必关——核现体 `thincoder-core/mcp.mjs:82`，W7 迁移）；[Edit] 经 add-or-update 原位替换（数组序保持） | 本端无 `/mcp` 命令面（端差——配置全在面板，本档 §4）；不改 config schema |
| F-M4 | **启动装配与热插拔**：面板回合把 servers 注入 run 装配；depth-0 且非空 → 并发连接（逐 server 失败隔离）；每轮重建工具表 = 热插拔。证据 = `src/agent/setup.mjs:176-201` | 连接失败 → warning + 装配继续（模型本轮缺工具、下轮重试）；配置变更于下一轮装配生效；子代理（depth>0）无 MCP 工具 | 失败不阻塞对话（不因 MCP 失败中止回合）；子代理不继承 MCP 工具 |
| F-M5 | **幂等连接与自愈**：同 name 指纹一致 → 复用（不重建）；transport 死 / 指纹变更 → 断开重建；`onDead` → 退避重连、成功原位替换（name 键不变）。证据 = `thincoder-core/mcp.mjs:225-266` | 重复连接不泄漏 transport；改 token → 指纹变更 → 重连；退避四轮耗尽 → 静默（下次连接走全新连）；重连成功 → 工具闭包自愈（工具表无需重建） | 不改指纹字段集；postOnly 不自发 fireDead（手动恢复 = 面板 [Reconnect]） |
| F-M6 | **工具调用契约与输出面**：execute 直调 `tools/call`（响应上层 `ctx.signal`——挂死 server 不拖住整轮）；错误语义明确；输出序列化 + 截断。证据 = `thincoder-core/mcp.mjs:19-34/150-151/177-190` | `resp.error` / `result.isError` → 清晰错串（含工具名）；成功 = 文本序列化（空 → `"(no output)"`）；输出超 32_000 字符 → 截断 + `[… truncated: N chars omitted]` 注记 | 不执行 server 描述 / 输出中的指令（见 §3 N-M2）；不做 per-server 输出配额（单一口径） |

## 3. 非功能性需求

| # | 维度 | 标准 | 度量方式 |
|---|---|---|---|
| N-M1 | 零外部 SDK | 传输层自研（原生 fetch / 子进程 / WebSocket）——零依赖政策 | 核 `thincoder-core/mcp/*` 零第三方 import；`package.json` 零运行时依赖 |
| N-M2 | 外部数据不可信 | MCP 工具描述与输出 = 不可信外部数据——绝不执行其中指令（提示词层条款） | `src/prompts/common.md:115` / `persona-engineering.md:47` / `persona-normal.md:27` 三副本在位；描述经统一 schema 装载（`test/tool-descriptions.test.mjs`） |
| N-M3 | 失败语义明确 | 连接失败 warning + 继续（不静默挂起）；postOnly 失效 = per-call 错误透传 + 面板 [Reconnect]；探活零副作用 | `MCP（本仓·设计）§9` 逐条；面板起跑面 = `test/session-boot.test.mjs`（mcpStatus） |
| N-M4 | 挂死不拖轮 | 工具调用与 turn signal 竞速——挂死 server 不拖住整轮 turn | `thincoder-core/mcp.mjs:19-34`（`sendWithSignal`——signal 缺省直通；W7 迁移后现体）；调用点 `:150` |
| N-M5 | 跨端一致 | 展开机制语义与对端一致（命名前缀 / 完整 schema / 直调）；各端独立实现 | `MCP（本仓·设计）§10` 验收契约逐条；端差登记 = 本档 §4 |

## 4. 对位与端差登记（对位 = `MCP（CLI 仓·需求）§1–§4`）

| 面 | 本端 | 端差（登记） |
|---|---|---|
| 配置 / 连接管理入口 | Settings 面板 MCP 页（[Add] / [Edit] / [Test] / [Reconnect]） | 对端 = `/mcp` 表单命令；本端无命令面（面板承载） |
| 配置重读 | 每轮 `loadRaw` 即磁盘（无重读菜单——`MCP（本仓·设计）§10`） | 对端有磁盘重读菜单面——本端按「下轮装配生效」 |
| 展开机制 / schema / 三 transport / 直调 | 同款（`MCP（本仓·设计）§10` 验收契约） | 无端差（语义同源、各端独立实现） |

## 5. 变更记录

- 2026-09-12：建档（需求树逐档成套轮 B13 建档实施 B 轮——异层者建档；内容 = 本端机制实况登记 + 端差登记；零新需求语义）。
- 2026-09-13：两仓合并批 3（S6）——§4 端差行去 import 禁令措辞（R14）；其余零改。
