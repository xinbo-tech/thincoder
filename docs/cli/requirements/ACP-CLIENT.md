# ACP 客户端协议接入（`thincoder acp`）· CLI 面 · 需求

> 板块 = **ACP 协议**（编辑器接线）——`thincoder acp` 子命令在 stdio 上通过 Agent Client Protocol（schema v1）暴露 agent。
> 配对设计档 = `docs/cli/design/ACP-CLIENT.md`。
> 建档：2026-09-15（**B 式迁移轮 · 第 6 批**——`thincoder-cli/docs/requirements/ACP-CLIENT.md` 内容重建入基准层；
> 旧档原地一字不改、留作参照历史）。层归属 = **CLI 面**（P2——VSC 仓无 ACP 实现，结构性不对称）。

## 1. 总体需求

`thincoder acp` 子命令在 **stdio 上通过 Agent Client Protocol（schema v1）暴露 thincoder agent**，
使 Zed / JetBrains AI Chat / Paseo 等 ACP 客户端可直接驱动。项目已有专有 VS Code 扩展；
ACP 一次实现即可接通多家编辑器（桌面 + Web + 移动自托管编排器）——补上「编辑器接线」生态位。

**核心体验（要什么）**

- **编辑器上下文自动注入**（打开文件 / 光标 / 选区，无需手动 `@`）；
- **agent 编辑以 IDE 原生 diff 应用**（fs 反向 RPC）；
- **工具审批弹在 IDE 内**（`request_permission`）；
- **登录态 / 会话复用**（一次终端登录、多表面可用）。

**协议权威**：`agentclientprotocol/agent-client-protocol` 仓库的 `schema/v1` 下 `schema.json`
（稳定协议版本 **1**；方法名 / 事件类型以 schema 为准）。**注意**：`@agentclientprotocol/sdk` 的版本号是 **SDK 包版本**、不是协议版本。

## 2. 功能性需求

| # | 需求 | 说明 |
|---|---|---|
| **F1** | 协议接入（schema v1 方法覆盖） | agent 侧 `initialize` / `authenticate` / `session/{new,load,resume,list,delete,prompt,cancel,close,set_mode,set_config_option}` 全接通；`logout` 不做（无账号体系）；unstable 扩展不做 |
| **F2** | 事件流与工具桥 | agent 输出以 `session/update` 事件块流式送达；**写路径走 IDE**（`fs/write_text_file`）——agent 编辑以 IDE 原生 diff 应用；edit 的判定委派本地单一权威（双通道同语义） |
| **F3** | 审批弹在 IDE | 工具审批经 `session/request_permission`；响应缺失 / 取消 / 未知 → 拒绝（安全优先） |
| **F4** | 登录态与会话复用 | 复用终端配置（`~/.thincoder/config.json`）；会话存档按槽位 load / resume / list / delete；每回合末存档 |
| **F5** | **headless 通道不提供不存在的交互能力** | 见下判定句 |
| **F6** | **TUI 显示路由信号零进 ACP 客户端可见面** | 见下判定句 |

**F5 判定句（通道裁剪——question 工具）**

- **R-A1.1**：ACP 会话的工具集**不含** question 工具——装配期剔除（模型 schema 不可见、不可调用、零必错回合）。
  可验判据：以 ACP 会话剔除参数装配出的工具名集合与 schema 均不含 `question`。
- **R-A1.2**：question 工具的描述文本不得对无交互面的上下文作**无条件承诺**——须显式说明
  「无交互面（headless / 子代理上下文）时返回错误，问题放正文回复」。
- **R-A1.3**：通道裁剪对位——VSC 端 question 工具有原生 UI 兜底（非 ACP 面、无此缺陷）；
  CLI 侧其余无 UI 上下文（`thincoder chat`、子代理 children）的同类缺陷为**登记项**（设计档 §9），不在本波。

**F6 判定句（relay 前缀收敛）**

- **R-A2.1**：子代理 relay 前缀 `role#id/`（含任意嵌套深度）**零进入** ACP 客户端可见面：
  `agent_message_chunk` 文本、`agent_thought_chunk` 文本、`tool_call.title`、`session/request_permission` 的请求文本与 `toolCall.title`。
- **R-A2.2**：剥离**不得**改变内部配对语义——工具 id FIFO 配对键保持前缀原样
  （同名不同子代理互不错配；call 与 result 以同一原样名配对）。
- **R-A2.3**：relay 前缀文法 = **单一权威模块**（非 TUI 模块；生成侧再导出）——
  TUI 块路由与 ACP 剥离消费同一解析实现（防第二套平行正则再漂移）。
- **R-A2.4**：`onToolOutput`（工具输出流式增量）**明示缺**——ACP 不转发流式输出（父工具与子代理工具同口径）；
  工具卡承载参数与最终结果（能力缺口条款见设计档）。

## 3. 非功能性需求

| # | 维度 | 标准 |
|---|---|---|
| **N1** | 性能 | ACP 层**零缓冲透传**——流式事件逐块转发不做缓冲合并；超长会话加载有可见延迟（协议无批量通道）——v1 接受 |
| **N2** | 兼容性 | 协议以 schema v1 为准；最低客户端 = 支持 `initialize` 版本协商的任何 ACP v1 客户端 |
| **N3** | 可维护性 | ACP 模块与 agent 核心解耦（可插拔点默认空实现）；协议细节收敛在 `thincoder-cli/src/acp/**` 下，TUI / CLI 其余面不感知 |
| **N4** | 会话资源 | 每 `session/new` 一个 agent 实例；v1 不设上限 |
| **N5** | 零语义改动面 | TUI 块路由 / 渲染语义零改——文法抽出为纯搬迁 + 再导出 |
| **N6** | 可验证性 | 新增断言档锁定三面——前缀零泄漏 / question 不在 ACP 工具集 / 文法单一权威 |
| **N7** | 无回归 | 既有 TUI 用例档零修改通过；ACP 工具 id 配对（FIFO）语义不变 |

## 4. 不做项（明确裁剪）

| 不做 | 理由 |
|---|---|
| `logout` | 无账号体系 |
| terminal 反向 RPC | shell 本地执行 |
| `question` 工具（向用户提问） | ACP 无提问通道（不接通 elicitation）；会话装配期剔除该工具——模型不可见 |
| `onToolOutput`（工具输出流式增量） | **明示缺**（裁剪）——最终结果已送达；流式面自有设计面 |
| unstable 扩展（`elicitation/*` / auth-configuration / buffer sync / inline-edit 预测等） | 正常客户端流程不依赖 |
| audio prompt | 无音频输入通道 |
| ACP 会话写存档由客户端管理生命周期 | 存档由会话层每回合末写；客户端只负责连接生命周期 |
| 依赖官方 SDK（TS / Rust / Kotlin 等） | 零依赖哲学；自写层可测（schema v1 是唯一权威） |

## 5. 范围边界（不做）

- **不改 ACP 协议面**——不接通 elicitation / 不新增提问通道 / 不改事件通知面。
- 不改 TUI 消费面语义（`routeSub*` / 渲染 / 事件文法零改——文法搬迁 = 纯迁移）。
- 不改 VSC 仓（无 ACP 镜像面）。
- 不做「子代理事件整体过滤」与「onToolOutput 流式补齐」（两者为登记候选——需用户裁定 / 独立设计面）。

## 6. 不并项与历史沿革

### 6.1 历史沿革（(d) 类——**不并**）

> 来源档 `thincoder-cli/docs/requirements/ACP-CLIENT.md`——**原地保留作参照历史**（保留 ≠ 维护）。下列内容不并入本档：

| 旧档位置 | 内容 | 何故不并 |
|---|---|---|
| 旧档档头「状态：已实现（M1）」+「来源：2026-09-10 自设计档抽取」注 | 时点状态与拆分来源 | 批次语境——本档档头已给配对设计档现状路径 |
| 旧档 §13 批次来源括注（Gitee 单号 + 批次档指针 + 用户原话） | 批次材料 | 一次性——需求语义与批次编号无关 |
| 旧档 §13.3 内部的实现坐标句（`src/tui/**` 形） | 迁移前仓形态 | 迁移前路径——设计档按现状落 |
| 旧档节号（§1 / §9 / §12 / §13 跳号） | 抽取期的原档节序 | 形态债——本档按现行节序重排（内容零改） |

### 6.2 不并项登记（跨板块 / 一次性材料——**不并**，逐项登记）

| 旧档面 | 内容 | 何故不并（去向 / 触发） |
|---|---|---|
| 机制实现面 | 方法覆盖表 / 传输层契约 / 事件桥映射 / 工具 id 配对 / edit 桥 / configOption / 审批通道 / 会话持久化 / 安全语义 | `docs/cli/design/ACP-CLIENT.md`（本档只留需求陈述——D2） |
| 工具 id 配对的通用语义 | 模型级工具 id 跨轮不唯一 | `docs/core/design/TOOLS.md`（工具契约）——本档只留「配对键原样」这一本板块要求 |
| VSC 侧 | 无 ACP 实现 | 登记「无镜像面」；VSC 轮 |

## 7. 体量与拆分规划（R24a）

**实测行数**：本档 **118 行**（根层新建 · as-of 2026-09-15 实核）——**低于 300 行软线，无需拆分规划**。

## 变更记录

- 2026-09-15（**B 式迁移轮 · 第 6 批**）：建档——`thincoder-cli/docs/requirements/ACP-CLIENT.md` 内容重建入基准层（旧档一字未改、原地作参照历史）。
  ① 落点 = `docs/cli/requirements/`（P2）；② §1 / §9 / §12 / §13 四面归并为 §1–§5（需求语义零改，节序按现行重排）；
  ③ F1–F4 由旧档定位段与核心体验段提炼为逐条需求；F5 / F6 = 旧档通道修整两条不变量的原样承接；
  ④ 补 §6 不并项与历史沿革、§7 体量；⑤ 实现坐标去迁移前形态（挂设计档指针——D2）。
