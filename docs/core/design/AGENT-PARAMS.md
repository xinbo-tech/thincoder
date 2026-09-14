# Agent 运行参数（AGENT-PARAMS）· 主循环与评审板块

> 板块 = **agent 运行参数**——评审墙钟超时 · 主 agent 轮次上限 · 子代理轮次。
> 本档 = 这三个参数族的**唯一权威**（默认值 / 读取链 / 坐标）。
> 相邻权威 = `docs/core/design/AGENT-LOOP.md`（主循环机制）· `docs/core/design/CONFIG.md`（配置面总体）· `docs/core/design/TOOL-OUTPUT-LIMITS.md`（另一族上限）——本档不复制其内容（D2）。
> 需求侧 = `docs/core/requirements/`（根层**无**对应档）；CLI 树需求档 `thincoder-cli/docs/requirements/AGENT-PARAMS.md` **未迁**（后续批）。
> 建档：2026-09-15（**B 式迁移轮 · 第 3 批**——`thincoder-cli/docs/design/AGENT-PARAMS.md` 内容重建入基准层；旧档原地一字不改、留作参照历史）。
> 本档坐标 = **as-of 2026-09-15 实核**（仓根 = `thincoder/`）。

## 1. 定位与问题

三项原为硬编码 / 过紧默认的参数，在真实使用中造成「误杀」与「过早中断」：

| # | 原现状 | 后果 |
|---|---|---|
| P1 | 评审整体墙钟 `REVIEW_TIMEOUT_MS` 硬编码 5 分钟，用户不可调 | 大评审（多文件 / 多轮工具探索 / 慢模型）5 分钟即被截断，返回 partial results |
| P2 | 主 agent 轮次上限默认 100 | 多文件重构 / 修复-验证循环频繁撞墙，需人工 Continue |
| P3 | 「默认 100」的文档与 UI 描述散落、未同步 | 改默认值后文档 / 显示与真实行为漂移 |

## 2. 评审墙钟超时（配置化 + 默认 600s）

- 默认常量：`REVIEW_TIMEOUT_MS = 600_000`（10 分钟）——`thincoder-core/advisor/compaction.mjs:36`（由 `thincoder-core/advisor/run.mjs:20` re-export）。
- 循环内检查点读**配置**，缺省回退常量（`thincoder-core/advisor/loop.mjs:106`）：

```js
const timeoutMs = (Number.isFinite(cfg) && cfg > 0) ? cfg : REVIEW_TIMEOUT_MS
```

- **运行期校验**：手写 `config.json` 的非法值（0 / 负数 / 字符串）不得静默禁用或立即触发超时——**非法一律回退默认**。
- 读取链：`thincoder-core/config.mjs:335` 把 `merged.agent.advisor` promote 为 `merged.advisor`（decoupled copy）⇒ `agent.config.advisor.timeoutMs` 天然可见；`runAdvisorToolLoop` 已接收 `agent` 参数，**无需改签名**。
- **默认值单一来源**：**不**在 `DEFAULTS.agent.advisor` 写死 `timeoutMs`——默认值只住 `REVIEW_TIMEOUT_MS` 常量，避免两处漂移（`thincoder-core/config.mjs:49` 的 advisor 默认块注释即登记 `timeoutMs` 为可覆盖项）。
- **TUI 不新增编辑项**：`/config` 不提供 `timeoutMs` 菜单——手写 `config.json` 即可。

## 3. 主 agent 轮次上限（默认 200）

- `thincoder-core/config.mjs:36`：`maxTurns: 200`（DEFAULTS）。
- `thincoder-core/agent/helpers.mjs:24`：`DEFAULT_MAX_TURNS = 200`（prepareRun 的兜底常量）。
- 读取链为**三级回退**（`thincoder-core/agent/setup.mjs:44`）：

```js
const maxTurns = overrideTurns ?? agent.config?.agent?.maxTurns ?? DEFAULT_MAX_TURNS
```

- TUI 显示兜底 `?? 200`（`thincoder-cli/src/tui/cmd-config.mjs:340` 状态头 · `:341` 菜单项 · `:366` 详情行 · `:438` 编辑初始值——四处）。
- **不动**的相邻参数：`goalTurns: 200`（goal 模式上限，独立语义——`thincoder-core/config.mjs:40` · `thincoder-core/agent/helpers.mjs:26`）· `DEFAULT_SUBAGENT_TURNS = 100`。

## 4. 子代理轮次（CLI 端无专属代码）

- 子代理轮次统一走 `agent.subagentTurns`，缺省回退 `DEFAULT_SUBAGENT_TURNS = 100`（`thincoder-core/agent/helpers.mjs:25`）。
- 读取点（三处同形）：`thincoder-core/agent-tools/subagent-async.mjs:387` · `thincoder-core/agent-tools/subagent-actions.mjs:418` · `thincoder-core/agent-tools/escalate-async.mjs:218`。
- 「30 硬帽」是 **VSC 端特有问题**，CLI 无（旧档语义说明，实体在 CLI 端无对应代码）。

## 5. 参数总表（现行默认）

| 参数 | 键 / 常量 | 默认 | 落点 |
|---|---|---|---|
| 评审墙钟 | `agent.config.advisor.timeoutMs` → `REVIEW_TIMEOUT_MS` | 600 000 ms | `thincoder-core/advisor/compaction.mjs:36` · 读取 `thincoder-core/advisor/loop.mjs:106` |
| 主 agent 轮次 | `agent.maxTurns` → `DEFAULT_MAX_TURNS` | 200 | `thincoder-core/config.mjs:36` · `thincoder-core/agent/helpers.mjs:24` |
| goal 模式轮次 | `agent.goalTurns` → `DEFAULT_GOAL_TURNS` | 200 | `thincoder-core/config.mjs:40` · `thincoder-core/agent/helpers.mjs:26` |
| 子代理轮次 | `agent.subagentTurns` → `DEFAULT_SUBAGENT_TURNS` | 100 | `thincoder-core/agent/helpers.mjs:25` |
| 设计 token TTL | `agent.engTokenTtlMs` | 7 天 | 见 `docs/core/design/ENG-TOKEN-BINDING.md` §3（本表只列名，不重述） |

## 6. 机制面（B 式迁移并入——现状路径）

### 6.1 实现坐标（as-of 2026-09-15 实核）

| 面 | 落点 | 实核 |
|---|---|---|
| 评审默认常量 | `thincoder-core/advisor/compaction.mjs:36`（`REVIEW_TIMEOUT_MS` = 600 000） | 在位 |
| 评审读取 + 运行期校验 | `thincoder-core/advisor/loop.mjs:106` | `Number.isFinite(cfg) && cfg > 0` 回退 |
| advisor 配置 promote | `thincoder-core/config.mjs:335` | `merged.advisor = { ...merged.agent.advisor }` |
| advisor 默认块（含 timeoutMs 说明） | `thincoder-core/config.mjs:49` | 注释在位 |
| `maxTurns` 默认 | `thincoder-core/config.mjs:36` · `thincoder-core/agent/helpers.mjs:24` | 均 200 |
| `maxTurns` 三级回退 | `thincoder-core/agent/setup.mjs:44` | 在位 |
| TUI 显示兜底 | `thincoder-cli/src/tui/cmd-config.mjs:340` · `:341` · `:366` · `:438` | 四处 `?? 200` |
| 子代理轮次读取 | `thincoder-core/agent-tools/subagent-async.mjs:387` · `thincoder-core/agent-tools/subagent-actions.mjs:418` · `thincoder-core/agent-tools/escalate-async.mjs:218` | 三处同形回退 |

### 6.2 测试面

- 评审超时：配置覆盖 / 回退 / 非法值回退三态（`thincoder-cli/test/` 的 advisor 族用例）。
- `maxTurns`：`thincoder-core/test/config.test.mjs:37` 断言 DEFAULTS 合并后 `maxTurns === 200`。

## 7. 并入的关键决策记录（含否决备选）

| # | 决策 | 理由 / 否决备选 |
|---|---|---|
| D-P1 | 评审 `timeoutMs` **配置化**且默认抬到 600s | 5 分钟硬编码在大评审上必截断；否决「保持硬编码、让用户缩范围」 |
| D-P2 | 默认值**单一来源**（不进 `DEFAULTS.agent.advisor`） | 两处写同一默认值必然漂移；否决「DEFAULTS + 常量双写」 |
| D-P3 | 非法配置值**回退默认**（不静默禁用、不立即超时） | 手写 JSON 的 0/负数/字符串不得变成「关掉超时」；否决「非法即视为 0」 |
| D-P4 | `maxTurns` 默认 100 → **200**，且同步四处 TUI 显示兜底 | 撞墙重试是主要痛点；否决「只改 DEFAULTS，显示面留 100」（P3 漂移） |
| D-P5 | **不动** `goalTurns` 与 `DEFAULT_SUBAGENT_TURNS` | 语义独立（goal 模式 / 子代理各有自己的预算面）；否决「一并抬到 200」 |
| D-P6 | TUI **不给** `timeoutMs` 加编辑项 | 长尾配置不进交互菜单——手写 config.json 足够；否决「菜单膨胀」 |

## 8. 不并项与历史沿革

### 8.1 历史沿革（(d) 类——**不并**）

> 来源档 `thincoder-cli/docs/design/AGENT-PARAMS.md`（CLI 产品档）——**原地保留作参照历史**（保留 ≠ 维护）。下列内容不并入本档：

| 旧档位置 | 内容 | 何故不并 |
|---|---|---|
| 旧档状态行（「已实现 2026-08-24 评审修订后实施；npm 0.12.43」） | 时点状态行 / 发版号 | 批次语境——现行态已入 §2–§5 |
| 旧档 §2.1 的代码块（旧检查点写法） | 改动前的原样代码摘录 | 现行写法已入 §2（只留推导式一行） |
| 旧档 §3「受影响文件」表 | 单次改动的文件 × 动作清单 | 一次性材料——现行坐标入 §6.1 |
| 旧档 §4「验收标准」AC1–AC8 | 一次性验收清单（含已删测试文件锚） | 批次材料——现行约束已入 §2–§4 |
| 旧档变更记录 | 2026-08-24 立项流水 | 历史叙述——本档自有变更记录 |

### 8.2 不并项登记（跨板块 / 一次性材料——**不并**，逐项登记）

| 旧档面 | 内容 | 何故不并（去向 / 触发） |
|---|---|---|
| 旧档 §3 表内「相关设计文档 MODIFY」 | 泛指多档的同步改动 | 无具体落点——现状散档已各自收正 |
| 旧档引用的 `test/advisor.test.mjs` / `test/agent.test.mjs` | 已删测试（存量测试清零批） | 陈旧坐标——不并；现行测试面见 §6.2 |
| VSC 端「30 硬帽」 | 端特有问题 | 非 CLI 机制——归 VSC 轮 |

## 9. 体量与拆分规划（R24a）

**实测行数**：本档 **117 行**（根层新建 · as-of 2026-09-15 实核）——**低于 300 行软线，无需拆分规划**。

## 变更记录

- 2026-09-15（**B 式迁移轮 · 第 3 批**）：建档——`thincoder-cli/docs/design/AGENT-PARAMS.md` 内容重建入基准层（旧档一字未改、原地作参照历史）；坐标改写为现状路径并实核（`advisor/compaction.mjs` · `advisor/loop.mjs` · `config.mjs` · `agent/helpers.mjs` · `agent/setup.mjs` · `tui/cmd-config.mjs`）；新增 §5 参数总表（本档为参数族唯一权威）；批次材料 / 状态行 / 变更流水不并（§8）。
