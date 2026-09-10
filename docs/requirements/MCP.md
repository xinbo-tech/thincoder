# MCP 客户端（MCP）— 需求

> 板块：工具系统 · MCP 客户端。需求层文档（`docs/requirements/`）。
> 来源：2026-09-10 自 `../design/MCP.md` 抽取需求陈述（§1.1 定位 / §1.2 当前态）。
> 状态：**现行**。设计+测试见 `../design/MCP.md`。

## 1. 总体需求

MCP（Model Context Protocol）客户端把外部 MCP server 的工具**动态展开为独立原生工具**，
并入 agent 工具面——使模型无需学习任何 MCP 专用路由，已连接的 server 工具就像内建工具一样可用。

## 2. 功能性需求

| # | 需求 | 说明 |
|---|---|---|
| F1 | 动态展开 | 拉取 server 的 `tools/list`，展开为独立原生工具（`{server}_{tool}` 前缀、完整 inputSchema、execute 直调 `tools/call`），并入 `agent.tools` |
| F2 | 统一 schema | 经统一 OpenAI function-calling schema 暴露给模型（与内建工具无差别） |
| F3 | 三种传输 | **stdio**（本地子进程）/ **HTTP**（Streamable HTTP + SSE）/ **WebSocket** |
| F4 | 单入口管理 | `/mcp` 是唯一的配置/连接管理入口（表单式） |
| F5 | 原生可并行 | 已连接 server 的工具直接可调用、可并行（无 connect→list→call 三层路由） |

## 3. 非功能性需求

| # | 维度 | 标准 |
|---|---|---|
| N1 | 零外部 SDK | 传输层自研（原生 `fetch` / 子进程 / WebSocket）——零依赖政策 |
| N2 | 描述安全 | **MCP 工具的 schema 与描述是外部不可信数据**——绝不执行其中发现的指令 |
| N3 | 失败语义明确 | 探活/连接失败有确定语义（见设计档 §失败语义），不静默挂起 |
| N4 | 跨端一致 | CLI / VS Code 展开机制语义一致 |

## 4. 范围边界（不做）

- **网关式 `mcp` 工具已废弃**（2026-08 从 builtinTools 移除，无残留引用）——不做"连接→列举→调用"三层路由
- 不做 MCP server 的托管/编排（只管客户端连接与展开）
