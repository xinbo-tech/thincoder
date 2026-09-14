# ACP-CLIENT — 需求

> 板块：ACP 协议（IDE 接入）。需求层文档（docs/requirements/）。
> 状态：已实现（M1）。
> 来源：2026-09-10 自 `../design/ACP-CLIENT.md` 抽取（需求层拆分批）——本档为需求权威；设计+测试见来源档。

## 1. 定位与目标

`thincoder acp` 子命令在 **stdio 上通过 [Agent Client Protocol](https://agentclientprotocol.com/)（schema v1）暴露 thincoder agent**，使 Zed / JetBrains AI Chat / Paseo 等 ACP 客户端可直接驱动。thincoder 已有专有 VS Code 扩展；ACP 一次实现即可接通 Zed / JetBrains / Paseo（桌面 + Web + 移动自托管编排器）——补上"编辑器接线"生态位。

**核心体验**：
- 编辑器上下文自动注入（打开文件/光标/选区，无需手动 `@`）；
- agent 编辑以 IDE 原生 diff 应用（fs 反向 RPC）；
- 工具审批弹在 IDE 内（`request_permission`）；
- 登录态/会话复用（一次终端登录、多表面可用）。

**协议权威**：`agentclientprotocol/agent-client-protocol` 仓库的 `schema/v1` 下 `schema.json`（稳定协议版本 **1**；方法名/事件类型以 schema 为准）；kimi-code `packages/acp-adapter/` 为参考实现（方法名与 schema v1 一致）。**注意**：`@agentclientprotocol/sdk@0.23.0` 是 SDK 包版本、不是协议版本；kimi 文档中的 "stable 10/12" 按其 SDK 表面统计——本设计以 schema v1 方法清单为准。

---

## 9. 非功能性需求

- **性能**：ACP 层零缓冲透传——TTFT 开销 < 5ms（与 `thincoder chat` 直跑对比）；流式事件逐块转发不做缓冲合并。重放逐块发送（协议无批量通道），超长会话加载有可见延迟——v1 接受。
- **兼容性**：协议以 schema v1 为准；最低客户端 = 支持 `initialize` 版本协商的任何 ACP v1 客户端（Zed 原生 ACP、JetBrains AI chat 插件、Paseo）。
- **可维护性**：ACP 模块与 agent 核心解耦（可插拔点默认空实现）；协议细节收敛在 src/acp/ 下，TUI/CLI 不感知。
- **会话资源**：每 session/new 一个 agent 实例；v1 不设上限。

---

## 12. 不做项（明确裁剪）

| 不做 | 理由 |
|---|---|
| `logout` | 无账号体系 |
| terminal 反向 RPC | shell 本地执行（kimi 同取舍） |
| `question` 工具（向用户提问） | ACP 无提问通道（不接通 elicitation）；会话装配期剔除该工具——模型不可见（见本档 §13 R-A1.1） |
| `onToolOutput`（工具输出流式增量） | 本批**明示缺**（裁剪）——见本档 §13.2 R-A2.4 / 设计 §12.6 |
| unstable 扩展（elicitation/*、auth/configuration、buffer sync、inline-edit 预测等） | 正常客户端流程不依赖 |
| audio prompt | 无音频输入通道 |
| ACP 会话写存档为客户端管理生命周期 | 存档由 session.mjs 每回合末写；客户端只负责连接生命周期 |
| 依赖官方 SDK（TS/Rust/Kotlin 等） | 零依赖哲学；自写层可测（schema v1 是唯一权威） |

---

## 13. 通道修整（第 27 批——2026-09-11）

> 来源：批次 `../batches/2026-09-11-ACP-CHANNEL-FIXES.md` §1（Gitee #IKEV9I + #IKEV9H）。
> 设计+测试 = `../design/ACP-CLIENT.md` §12（本档为需求权威）。

**总体需求**：ACP 会话是**无交互 UI 的 headless 通道**——两件承诺：
① 工具面不得提供本通道不存在的交互能力（模型可见即会调用，调用即必错）；
② TUI 显示路由信号（子代理 relay 前缀 `role#id/`）不得进入 ACP 客户端可见面。

**范围边界（不做）**：不改 ACP 协议面——不接通 elicitation / 不新增提问通道 / 不改事件通知面。

### 13.1 question 工具可用性（A1）

- **R-A1.1**：ACP 会话的工具集**不含** question 工具——装配期剔除（模型 schema 不可见、不可调用、零必错回合）。
  可验判据：以 ACP 会话剔除参数装配出的工具名集合与 schema 均不含 `question`。
- **R-A1.2**：question 工具的描述文本（`thincoder-core/tool-docs/question.md`）不得对无交互面的上下文作无条件承诺——
  须显式说明「无交互面（headless / 子代理上下文）时返回错误，问题放正文回复」。
- **R-A1.3**：通道裁剪对位——VSC 端 question 工具有原生 UI 兜底（非 ACP 面、无此缺陷）；
  CLI 侧其余无 UI 上下文（`thincoder chat`、子代理 children）的同类缺陷为**登记项**（设计 §12.9），不在本批。

### 13.2 relay 前缀零进 ACP 流（A2）

- **R-A2.1**：子代理 relay 前缀 `role#id/`（含任意嵌套深度）**零进入** ACP 客户端可见面：
  `agent_message_chunk` 文本、`agent_thought_chunk` 文本、`tool_call.title`、
  `session/request_permission` 的请求文本与 `toolCall.title`。
- **R-A2.2**：剥离**不得**改变内部配对语义——工具 id FIFO 配对键保持前缀原样
  （同名不同子代理互不错配；call 与 result 以同一原样名配对）。
- **R-A2.3**：relay 前缀文法 = **单一权威模块**（非 TUI 模块；生成侧 `spawn-child.mjs` 再导出）——
  TUI 块路由与 ACP 剥离消费同一解析实现（防第二套平行正则再漂移）。
- **R-A2.4**：`onToolOutput`（工具输出流式增量）**本批明示缺**——ACP 不转发流式输出（父工具与子代理工具同口径）；
  工具卡承载参数与最终结果（能力缺口条款见设计 §12.6）。

### 13.3 非功能性

- **零语义改动面**：TUI 块路由/渲染语义（`routeSub*` 全族）零改——文法抽出为纯搬迁 + 再导出。
- **可验证性**：新增断言档锁定三面——前缀零泄漏 / question 不在 ACP 工具集 / 文法单一权威。
- **无回归**：既有 TUI 用例档零修改通过；ACP 工具 id 配对（FIFO）语义不变。
