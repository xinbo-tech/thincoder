# Agent 运行参数（AGENT-PARAMS）· 需求

> 板块 = **agent 运行参数**——评审墙钟超时 · 主 agent 轮次上限 · 子代理轮次。
> 本档 = 该机制的**需求层权威**（F-AP1–F-AP4 / N-AP1–N-AP4 判定句）。
> 设计侧 = `docs/core/design/AGENT-PARAMS.md`（默认值 / 读取链 / 实现坐标——本档不复制，D2）；
> 相邻面 = `docs/core/design/CONFIG.md`（配置面总体）· `docs/core/design/AGENT-LOOP.md`（主循环）。
> 建档：2026-09-15（**B 式迁移轮 · VSC 批 4**——`thincoder-vscode/docs/requirements/AGENT-PARAMS.md` 内容重建入基准层；
> 旧档原地一字不改、留作参照历史）。CLI 侧同名需求档（`thincoder-cli/docs/requirements/AGENT-PARAMS.md`）**已并入（2026-09-15 · CLI 尾部真批）**——
> 逐节对账**零实质缺口**（FR1–FR3 / N1–N4 全由 F-AP1–F-AP4 / N-AP1–N-AP4 承载），(d) 类入 §5.1。
> 实测口径 = **as-of 2026-09-15 实核**（仓根 = `thincoder/`）。

## 1. 总体定位

三项原为硬编码 / 过紧的运行参数——评审整体墙钟、主 agent 轮次上限、子代理轮次——在真实使用中造成
「长评审被固定墙钟误杀」与「大任务过早撞墙」。本板块的要求 = 三项**可配置 + 默认值够用**，
且默认值与显示面**同源不漂移**（改默认值时显示面同步，防文档 / UI 与行为漂移）。

## 2. 功能性需求

| # | 需求 | 判定句（可机器验证） | 范围边界（不做） |
|---|---|---|---|
| **F-AP1** | **评审墙钟可配置且默认更长** | 配置 `agent.advisor.timeoutMs` 即被整体评审墙钟采用；未配置时默认 `600000`（`thincoder-core/advisor/compaction.mjs:36`）；读取点 = `thincoder-core/advisor/loop.mjs:106` | 不给交互菜单加 `timeoutMs` 编辑项 |
| **F-AP2** | **非法配置值回退默认** | 手写配置的 `0` / 负数 / 非数值 ⇒ 回退 `600000`——不静默禁用超时、不立即触发超时（判据式 = `Number.isFinite(cfg) && cfg > 0`） | 不把非法值当 0 处置（= 关掉超时） |
| **F-AP3** | **explore 子代理用满轮次预算** | explore 角色不再套硬帽：`agent.subagentTurns`（默认 `100`——`thincoder-core/agent/helpers.mjs:25`）即其 maxTurns；VSC 面源码零硬帽形态（实核） | 不为 explore 单列独立预算键 |
| **F-AP4** | **主 agent 轮次默认 200 + 显示面同步** | 未配置 `agent.maxTurns` ⇒ 200（`thincoder-core/config.mjs:36` · 兜底常量 `thincoder-core/agent/helpers.mjs:24`）；三级回退 = `thincoder-core/agent/setup.mjs:44`；TUI 显示兜底 `?? 200` 四处（`thincoder-cli/src/tui/cmd-config.mjs:340` / `:341` / `:366` / `:438`） | 不动 `goalTurns`（200，独立语义）与子代理默认轮次（`100`） |

## 3. 非功能性需求

| # | 维度 | 标准（含度量） |
|---|---|---|
| **N-AP1** | 默认值单一来源 | 评审默认只住常量（`thincoder-core/advisor/compaction.mjs:36`）——不在配置默认块双写（`thincoder-core/config.mjs:49` 登记 `timeoutMs` 为可覆盖项） |
| **N-AP2** | 兼容 | 现有配置语义不变：加 `timeoutMs` 不改 `guard` / `provider` / `model` / `effort` 行为；单工具超时与会诊轮次 / 超时不动 |
| **N-AP3** | 可测试 | `thincoder-core/test/config.test.mjs:37` 断言默认合并后 `maxTurns === 200`；评审超时三态（配置覆盖 / 缺省回退 / 非法回退）由用例断言 |
| **N-AP4** | 双端同源 | CLI 与 VS Code 同一配置项、同一默认值（共享 `~/.thincoder/config.json`）——各实现面独立实现（多实现面纪律——只述实现形态 ✗ 不构成差异保留依据；端差默认 = 消，保留仅限结构性不对称 + 证据 + 显式裁定） |

## 4. 范围边界（不做）

- 不新增交互式编辑项（长尾配置手写 `config.json` 即可）。
- 不把「explore 30 硬帽」做成可配项——该形态直接移除，不留开关。
- 不合并三项参数的预算面（评审 / 主 agent / 子代理各自独立）。

## 5. 不并项与历史沿革

### 5.1 历史沿革（(d) 类——**不并**）

> 来源档 `thincoder-vscode/docs/requirements/AGENT-PARAMS.md`（VSC 产品需求档）——**原地保留作参照历史**（保留 ≠ 维护）。下列内容不并入本档：

| 旧档位置 | 内容 | 何故不并 |
|---|---|---|
| 旧档头注（归位注记 + 「已实现 2026-08-24…0.1.49 发布」状态行 + 关联行） | 归位 / 时点状态 / 发版号 | 批次语境——现行态已入 §2–§3 |
| 旧档「现码核对（2026-09-08）」行 | 时点核对行的旧路径与行数 | 时点坐标——现行坐标入各 F 判定句 |
| 旧档变更记录（2026-08-24 立项行） | 立项流水 | 本档自有变更记录 |

> **CLI 侧来源档** `thincoder-cli/docs/requirements/AGENT-PARAMS.md`（2026-09-15 CLI 尾部真批对账并入——零新增文本）——原地保留作参照历史。下列内容不并入本档：

| 旧档位置 | 内容 | 何故不并 |
|---|---|---|
| 旧档头注（状态行「已实现…npm 0.12.43」+ 关联行 + 范围注「CLI 仓…VSC 有同需求独立文档」） | 时点状态 / 跨仓对位 | 批次语境——双端同源由 N-AP4 承载 |
| 旧档「现码核对（2026-09-07）」行（`thincoder-core/advisor/run.mjs` `REVIEW_TIMEOUT_MS`） | 时点核对行的旧坐标 | 常量现居 `thincoder-core/advisor/compaction.mjs:36`（读取点 `thincoder-core/advisor/loop.mjs:106`）——现行坐标入 F-AP1（as-of 2026-09-15 实核） |
| 旧档 §1 注（「30 硬帽仅存在于 VS Code 扩展 `subagent.mjs`；CLI 端无此项代码改动」） | 迁移前时点注 | 该硬帽形态其后已从 VSC 面移除——现行判定 = F-AP3「VSC 面源码零硬帽形态（实核）」 |
| 旧档变更记录（含「设计细节见 TUNING.md」指针——CLI 旧树档） | 立项流水 + 旧树指针 | 旧树指针随树降格失效；本档自有变更记录 |

### 5.2 不并项登记（跨板块 / 一次性材料——**不并**，逐项登记）

| 旧档面 | 内容 | 何故不并（去向 / 触发） |
|---|---|---|
| 旧档「范围：本仓库（thincoder-vscode）；CLI 有同需求独立文档」注 | 跨仓对位句 | 语义同源已由本档正文承载（N-AP4） |
| 「需求树逐档成套轮」建档批次注 | 建档批序 | 一次性材料——归批次档 |
| CLI 侧同名需求档未迁面 | CLI 产品需求正文 | **已并入（2026-09-15 CLI 尾部真批）**——零实质缺口，(d) 类入 §5.1 |

## 变更记录

- 2026-09-15（**CLI 尾部真批 · 并入既有 · eng-designer**）：`thincoder-cli/docs/requirements/AGENT-PARAMS.md` 逐节对账——**零实质缺口**
  （§1 三项 / FR1–FR3 / N1–N4 ⇒ §1 / F-AP1–F-AP4 / N-AP1–N-AP4 全覆），零新增正文；(d) 类（状态行 / 现码核对旧坐标 / 30 硬帽时点注 / 变更流水）入 §5.1。
  旧档原地一字不改。
- 2026-09-15（**B 式迁移轮 · VSC 批 4**）：建档——`thincoder-vscode/docs/requirements/AGENT-PARAMS.md` 内容重建入基准层
  （旧档一字未改、原地作参照历史）；判定句坐标按现状实核改写（默认值 / 读取链改指核面 `thincoder-core/**`、显示面改指 `thincoder-cli/**`）；与既有设计档 `docs/core/design/AGENT-PARAMS.md` 成对（N-b 镜像同名）。
