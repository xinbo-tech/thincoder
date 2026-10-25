# Agent 运行参数（AGENT-PARAMS）· 主循环与评审板块

> 板块 = **agent 运行参数**——评审墙钟超时 · 主 agent 轮次上限 · 子代理轮次。
> 本档 = 这三个参数族的**唯一权威**（默认值 / 读取链 / 坐标）。
> 相邻权威 = `docs/core/design/AGENT-LOOP.md`（主循环机制）· `docs/core/design/CONFIG.md`（配置面总体）· `docs/core/design/TOOL-OUTPUT-LIMITS.md`（另一族上限）——本档不复制其内容（D2）。
> 需求侧 = `docs/core/requirements/AGENT-PARAMS.md`。

## 2. 评审墙钟超时（配置化 + 默认 600s）

- 默认常量：`REVIEW_TIMEOUT_MS = 600_000`（10 分钟）——`thincoder-core/advisor/compaction.mjs:42`。
- 循环内检查点读**配置**，缺省回退常量（`thincoder-core/advisor/loop.mjs:104`）：

```js
const timeoutMs = (Number.isFinite(cfg) && cfg > 0) ? cfg : REVIEW_TIMEOUT_MS
```

- **运行期校验**：手写 `config.json` 的非法值（0 / 负数 / 字符串）不得静默禁用或立即触发超时——**非法一律回退默认**。
- 读取链：`thincoder-core/config.mjs:372` 把 `merged.agent.advisor` promote 为 `merged.advisor`（decoupled copy；`promoteAgentViews`——非对象段不展开）——**运行读面 = promoted 视图 `agent.config.advisor.timeoutMs`**（`thincoder-core/advisor/loop.mjs:103`；VSC `thincoder-vscode/src/advisor/loop.mjs:98` 同形）；
  `runAdvisorToolLoop` 已接收 `agent` 参数，**无需改签名**。
- **写面不变式（指针）**：promoted 视图是装载期派生的副本，**内存里改 `agent.advisor.*` 不会自动流过读面** ⇒ 每个写点都得同步。
  写面三条腿（子键 set ∥ `null` 删除腿 ∥ 整段赋值）的唯一机制、会话级键保留规则与判据住 `SETTINGS-TOOL.md` §2.3——本档不复制（D2）；导出面 = `thincoder-core/config.mjs` 的 `promoteAgentViews(config)`（`loadConfig` 与 `settings set` 共用同一条规则）。
- **写面校验**：`agent.advisor.timeoutMs` ∥ `advisor.timeoutMs` 的非法值（`0` / 负数 / 非数值）在 `settings set` 即被拒（规则 = `SETTINGS-TOOL.md` §2.6）；手写 `config.json` 不经该校验——读面按上一条「非法一律回退默认」兜底。
- **默认值单一来源**：**不**在 `DEFAULTS.agent.advisor` 写死 `timeoutMs`——默认值只住 `REVIEW_TIMEOUT_MS` 常量（`thincoder-core/advisor/compaction.mjs:42`），避免两处漂移（`thincoder-core/config-defaults.mjs:32` 的 advisor 默认块注释即登记 `timeoutMs` 为可覆盖项）。
- **TUI 不新增编辑项**：`/config` 不提供 `timeoutMs` 菜单——手写 `config.json` 即可。
- **设计前置两行（本批）**：先例行 = `loadConfig` 装载期 promote（`thincoder-core/config.mjs:372`）——`settings set` 复用同一条规则，**对齐**、零偏离；公开源核查行 = 查过本仓 `docs/` 树（本档 §2 ∥ `SETTINGS-TOOL.md` §2.3）+ 代码 `thincoder-core/config.mjs:372`，登记公共源仓 = 无（`PROJECT-MANIFEST.json` `index.publicRepos` 实读 `[]`），结论 = 无外部权威（仓内配置派生面）。

## 3. 主 agent 轮次上限（默认 200）

- `thincoder-core/config-defaults.mjs:18`：`maxTurns: 200`（DEFAULTS）。
- `thincoder-core/agent/helpers.mjs:24`：`DEFAULT_MAX_TURNS = 200`（prepareRun 的兜底常量）。
- 读取链为**三级回退**（`thincoder-core/agent/setup.mjs:44`）：

```js
const maxTurns = overrideTurns ?? agent.config?.agent?.maxTurns ?? DEFAULT_MAX_TURNS
```

- TUI 显示兜底 `?? 200`（`thincoder-cli/src/tui/cmd-config.mjs:125` 状态头 · `:126` 菜单项 · `:155` 详情行 · `:260` 编辑初始值——四处）。
- **不动**的相邻参数：`goalTurns: 200`（goal 模式上限，独立语义——`thincoder-core/config-defaults.mjs:22` · `thincoder-core/agent/helpers.mjs:26`）· `DEFAULT_SUBAGENT_TURNS = 100`。

## 4. 子代理轮次（CLI 端无专属代码）

- 子代理轮次统一走 `agent.subagentTurns`，缺省回退 `DEFAULT_SUBAGENT_TURNS = 100`（`thincoder-core/agent/helpers.mjs:25`）。
- 读取点（三处同形）：`thincoder-core/agent-tools/subagent-async.mjs:387` · `thincoder-core/agent-tools/subagent-actions.mjs:418` · `thincoder-core/agent-tools/escalate-async.mjs:218`。
- 「30 硬帽」是 **VSC 端特有问题**，CLI 无对应代码。**VSC 端无该帽**（见 §6.3 行 5）。

## 5. 参数总表（现行默认）

| 参数 | 键 / 常量 | 默认 | 落点 |
|---|---|---|---|
| 评审墙钟 | `agent.config.advisor.timeoutMs` → `REVIEW_TIMEOUT_MS` | 600 000 ms | `thincoder-core/advisor/compaction.mjs:42` · 读取 `thincoder-core/advisor/loop.mjs:104` |
| 主 agent 轮次 | `agent.maxTurns` → `DEFAULT_MAX_TURNS` | 200 | `thincoder-core/config-defaults.mjs:18` · `thincoder-core/agent/helpers.mjs:24` |
| goal 模式轮次 | `agent.goalTurns` → `DEFAULT_GOAL_TURNS` | 200 | `thincoder-core/config-defaults.mjs:22` · `thincoder-core/agent/helpers.mjs:26` |
| 子代理轮次 | `agent.subagentTurns` → `DEFAULT_SUBAGENT_TURNS` | 100 | `thincoder-core/agent/helpers.mjs:25` |
| 设计 token TTL | `agent.engTokenTtlMs` | 7 天 | 见 `docs/core/design/ENG-TOKEN-BINDING.md` §3（本表只列名，不重述） |

## 6. 机制面（现状路径）

### 6.1 实现坐标

| 面 | 落点 | 状态 |
|---|---|---|
| 评审默认常量 | `thincoder-core/advisor/compaction.mjs:42`（`REVIEW_TIMEOUT_MS` = 600 000） | 在位 |
| 评审读取 + 运行期校验 | `thincoder-core/advisor/loop.mjs:104` | `Number.isFinite(cfg) && cfg > 0` 回退 |
| advisor 配置 promote | `thincoder-core/config.mjs:372` | `promoteAgentViews(config)`——`{ ...config.advisor, ...config.agent.advisor }`（非对象段不展开）；装载与 `settings set` 同源（写面三条腿 = `SETTINGS-TOOL.md` §2.3） |
| advisor 默认块（含 timeoutMs 说明） | `thincoder-core/config-defaults.mjs:32` | 注释在位 |
| `maxTurns` 默认 | `thincoder-core/config-defaults.mjs:18` · `thincoder-core/agent/helpers.mjs:24` | 均 200 |
| `maxTurns` 三级回退 | `thincoder-core/agent/setup.mjs:50` | 在位 |
| TUI 显示兜底 | `thincoder-cli/src/tui/cmd-config.mjs:125` · `:126` · `:155` · `:260` | 四处 `?? 200` |
| 子代理轮次读取 | `thincoder-core/agent-tools/subagent-async.mjs:387` · `thincoder-core/agent-tools/subagent-actions.mjs:418` · `thincoder-core/agent-tools/escalate-async.mjs:218` | 三处同形回退 |

**本批受影响面（AGENT-PARAMS 档）**：本档零代码改动（设计面同步）；promote 写面的代码行数与 Δ 见 `SETTINGS-TOOL.md` §5 受影响文件表。

### 6.2 测试覆盖

- 评审超时：配置覆盖 / 回退 / 非法值回退三态（`thincoder-cli/test/` 的 advisor 族用例）。
- 评审超时热应用（本批新增——机判三格）：`settings set agent.advisor.timeoutMs 900000` ⇒ 下一次循环检查点读到 900000（无需重启）∥ `settings set agent.advisor.timeoutMs null` ⇒ 读面回退 `REVIEW_TIMEOUT_MS`（600 000）∥ `advisor.guard = true` 而 `agent.advisor` 无 `guard` ⇒ 一次 `promoteAgentViews` 后 `guard` 仍在。
  宿主 = 批次单测档 `docs/batches/2026-10-24-tool-timeouts.test.mjs`（收口随批删；`test/` 树不新增常驻档——单测随批删、不进常驻套）。

**集成测试设计（F34 · 本批 · 收口口径）**：业务可观察点 = 用户在会话里改评审超时后，下一次评审按新值跑、不用重启。

| # | 入口（业务可观察点） | 判据（断言什么） | 指回 |
|---|---|---|---|
| I-AP1 | 会话里 `settings set agent.advisor.timeoutMs 3000`，随即调 `advisor` 工具跑一次评审（provider 条目 baseURL 指向本机假 SSE 端点，流式慢于 3s） | 评审在 ≈3s 结束并带回可读超时尾；同一进程、零重启 ⇒ 新值对下一次评审立即生效 | F-ST2（热应用） |
| I-AP2 | 同一会话 `settings set agent.advisor.timeoutMs null`，再跑一次同一评审（假端点 5s 流完） | 评审跑完、无超时尾 ⇒ 读面回退 `REVIEW_TIMEOUT_MS`（600 000） | §2 回退规则 |
| I-AP3 | `settings set agent.advisor.timeoutMs abc` | 写面拒并点名键与可消费形态（`null` ∥ 有限正数）；配置面读回不变 | D-ST18（`SETTINGS-TOOL.md` §2.6） |

- **为什么入发布门**：本项业务承诺 = 「改了就生效、不用重启」——只在用户真跑一次评审时才可见；上面那一格的单测判的是内存两视图同值，判不到「下一次评审真的按新值跑」，收口删掉单测档后这一半就没人守。
- **假端点先例**：同形 = `docs/core/design/TIMEOUT-DIGEST.md` §9 I1（本机假 SSE 端点当 provider）；chat provider 的 baseURL 可配，故本格不需要任何测试缝。
- **落点**：`test/integration/advisor-timeout-hot.test.mjs`（仓根——常驻、不随批删；随仓根 `node test/run.mjs` 走）。假端点为 `node:http` 本机 SSE（零外网、零付费——N15）。
- **墙钟**：I-AP1 ≈3s ∥ I-AP2 ≈5s（假端点定速），两格合计 ≈8s，在单用例硬超时内。
- `maxTurns`：DEFAULTS 合并后 `maxTurns === 200`（单一来源 = `thincoder-core/config-defaults.mjs:18`）。

### 6.3 VSC 端接线

> VSC 端四参数与 CLI 语义同源、实现独立（各自文件清单独立）。

| 面 | VSC 落点（实核） |
|---|---|
| 评审超时默认 | `thincoder-core/advisor/compaction.mjs:42`（`REVIEW_TIMEOUT_MS` = 600 000） |
| 评审检查点（配置覆盖 + 非法回退） | `thincoder-vscode/src/advisor/loop.mjs:98`（`Number.isFinite(cfg) && cfg > 0` → 缺省回退常量） |
| advisor 配置读取链 | `thincoder-vscode/src/agent/setup.mjs:210`（初始 `{ guard: false }`）· `:232`（`raw.agent?.advisor ?? { guard: false }`） |
| 面板保存透传 timeoutMs（P4——不静默丢） | `thincoder-vscode/src/extension/settings-panel-write.mjs:64`（`saveAgentSettingsFromPanel`）· `:112`–`:116`（合法 payload 胜，否则保留 current——不合并会丢字段；`thincoder-vscode/src/config-io.mjs:26` re-export） |
| explore 30 硬帽已移除 | `thincoder-vscode/src/agent-tools/subagent.mjs:311`（`parent.config?.agent?.subagentTurns ?? 100`——无 `Math.min(30, …)`；与 async/escalate 路径一致） |
| maxTurns 默认 200 | `thincoder-vscode/src/agent/run-helpers.mjs:15` · `thincoder-vscode/src/config-io.mjs:313`（`AGENT_DEFAULTS`）· `thincoder-vscode/src/agent/setup.mjs:219`（初始）/ `:241`（读取兜底 `?? 200`） |
| 面板显示兜底 | `thincoder-vscode/webview/settings-agent.js:16`（`as.maxTurns ?? 200`） |
| 面板 UI 无 timeoutMs 输入框 | 保持现状（config.json 手写即可——保存路径已透传，见上行） |

**VSC 侧不动项**：`goalTurns` / `consultTurns` / `subagentTurns` 默认值语义独立、不并——与本档 §5 总表同构。**默认值单一来源**纪律两端同构：VSC 评审超时默认只住 `compaction.mjs` 常量、不进 `AGENT_DEFAULTS.advisor`（`thincoder-vscode/src/config-io.mjs:323` 注释即此登记）。

## 7. 关键决策记录

| # | 决策 | 理由 |
|---|---|---|
| D-P1 | 评审 `timeoutMs` **配置化**且默认抬到 600s | 5 分钟硬编码在大评审上必截断 |
| D-P2 | 默认值**单一来源**（不进 `DEFAULTS.agent.advisor`） | 两处写同一默认值必然漂移 |
| D-P3 | 非法配置值**回退默认**（不静默禁用、不立即超时） | 手写 JSON 的 0/负数/字符串不得变成「关掉超时」 |
| D-P4 | `maxTurns` 默认 100 → **200**，且同步四处 TUI 显示兜底 | 撞墙重试是主要痛点 |
| D-P5 | **不动** `goalTurns` 与 `DEFAULT_SUBAGENT_TURNS` | 语义独立（goal 模式 / 子代理各有自己的预算面） |
