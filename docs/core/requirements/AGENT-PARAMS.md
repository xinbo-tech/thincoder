# Agent 运行参数（AGENT-PARAMS）· 需求

> 板块 = **agent 运行参数**——评审墙钟超时 · 主 agent 轮次上限 · 子代理轮次。
> 本档 = 该机制的**需求层权威**（F-AP1–F-AP4 / N-AP1–N-AP4 判定句）。
> 设计侧 = `docs/core/design/AGENT-PARAMS.md`（默认值 / 读取链 / 实现坐标——本档不复制，D2）；
> 相邻面 = `docs/core/design/CONFIG.md`（配置面总体）· `docs/core/design/AGENT-LOOP.md`（主循环）。

## 1. 总体定位

三项运行参数——评审整体墙钟、主 agent 轮次上限、子代理轮次——在真实使用中造成
「长评审被固定墙钟误杀」与「大任务过早撞墙」。本板块的要求 = 三项**可配置 + 默认值够用**，
且默认值与显示面**同源不漂移**（改默认值时显示面同步，防文档 / UI 与行为漂移）。

## 2. 功能性需求

| # | 需求 | 判定句（可机器验证） | 范围边界（不做） |
|---|---|---|---|
| **F-AP1** | **评审墙钟可配置且默认更长** | 配置 `agent.advisor.timeoutMs` 即被整体评审墙钟采用；未配置时默认 `600000`（`thincoder-core/advisor/compaction.mjs:36`）；读取点 = `thincoder-core/advisor/loop.mjs:106` | 不给交互菜单加 `timeoutMs` 编辑项 |
| **F-AP2** | **非法配置值回退默认** | 手写配置的 `0` / 负数 / 非数值 ⇒ 回退 `600000`——不静默禁用超时、不立即触发超时（判据式 = `Number.isFinite(cfg) && cfg > 0`） | 不把非法值当 0 处置（= 关掉超时） |
| **F-AP3** | **explore 子代理用满轮次预算** | explore 角色不再套硬帽：`agent.subagentTurns`（默认 `100`——`DEFAULT_SUBAGENT_TURNS`，`thincoder-core/agent/helpers.mjs`）即其 maxTurns；VSC 面源码零硬帽形态（实核） | 不为 explore 单列独立预算键 |
| **F-AP4** | **主 agent 轮次默认 200 + 显示面同步** | 未配置 `agent.maxTurns` ⇒ 200（`thincoder-core/config.mjs:36` · 兜底常量 `DEFAULT_MAX_TURNS`（`thincoder-core/agent/helpers.mjs`））；三级回退 = `thincoder-core/agent/setup.mjs:44`；TUI 显示兜底 `?? 200` 四处（`thincoder-cli/src/tui/cmd-config.mjs:340` / `:341` / `:366` / `:438`） | 不动 `goalTurns`（200，独立语义）与子代理默认轮次（`100`） |

## 3. 非功能性需求

| # | 维度 | 标准（含度量） |
|---|---|---|
| **N-AP1** | 默认值单一来源 | 评审默认只住常量（`thincoder-core/advisor/compaction.mjs:36`）——不在配置默认块双写（`thincoder-core/config.mjs:49` 登记 `timeoutMs` 为可覆盖项） |
| **N-AP2** | 兼容 | 现有配置语义不变：加 `timeoutMs` 不改 `guard` / `provider` / `model` / `effort` 行为；单工具超时与会诊轮次 / 超时不动 |
| **N-AP3** | 可测试 | `thincoder-core/test/config.test.mjs:37`（已随 2026-09-28 测试树全清退场，留名存档）（迁移期引文） 断言默认合并后 `maxTurns === 200`；评审超时三态（配置覆盖 / 缺省回退 / 非法回退）由用例断言 |
| **N-AP4** | 双端同源 | CLI 与 VS Code 同一配置项、同一默认值（共享 `~/.thincoder/config.json`）——各实现面独立实现（多实现面纪律——只述实现形态 ✗ 不构成差异保留依据；端差默认 = 消；用户可见端差 = 缺陷（唯一例外 = 宿主能力面，须实证）） |

## 4. 范围边界（不做）

- 不新增交互式编辑项（长尾配置手写 `config.json` 即可）。
- 不把「explore 30 硬帽」做成可配项——该形态直接移除，不留开关。
- 不合并三项参数的预算面（评审 / 主 agent / 子代理各自独立）。
