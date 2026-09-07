# Agent 运行参数调整 — 设计（VS Code 扩展）

> 状态：**已实现**（2026-08-24 评审修订后实施；Open VSX / Marketplace 0.1.49）。
> 需求：`docs/design/AGENT-PARAMS-REQUIREMENTS.md`。
> 关联：`docs/design/README.md`（文档地图）。
> 说明：与 CLI 端 `AGENT-PARAMS-TUNING.md` 同源（两端语义一致，各自文件清单独立——文档地图惯例）。

## 1. 问题陈述（Problem Statement）

四项硬编码/默认参数导致真实使用中被误杀或过早中断：

| # | 现状 | 位置 | 后果 |
|---|---|---|---|
| P1 | 评审整体墙钟 `REVIEW_TIMEOUT_MS = 300_000`（5 分钟）**硬编码**，用户无法调整 | `src/advisor/run.mjs` 常量 + `runAdvisorToolLoop` 循环内检查点 | 大评审（多文件、多轮工具探索、慢模型）5 分钟即被截断，返回 partial results |
| P2 | explore 子 agent 轮次被 `Math.min(30, …)` 硬帽 | `src/agent-tools/subagent.mjs` | explore 深入探索（大仓库、多文件追溯）30 轮即停，仅返回 partial work |
| P3 | 主 agent 轮次上限默认 `maxTurns: 100` | `src/config-io.mjs` `AGENT_DEFAULTS`、`src/agent/run-helpers.mjs` `DEFAULT_MAX_TURNS`、`src/agent/setup.mjs`（初始值 + 读取兜底）、`webview/settings-agent.js`（面板显示兜底） | 多文件重构/修复-验证循环任务频繁撞墙 |
| P4 | 设置面板保存 advisor 字段时**静默丢弃** timeoutMs（仅保留 guard/effort/provider/model 四字段） | `src/config-io.mjs` `saveAgentSettingsFromPanel` | 用户手写 config.json 的 timeoutMs 一旦经面板保存即丢失；面板显示默认 `?? 100`（`webview/settings-agent.js`）也会与真实默认漂移 |

## 2. 解决方案（Solution Approach）

### 2.1 评审超时配置化 + 默认 600s

- `src/advisor/run.mjs`：`REVIEW_TIMEOUT_MS = 600_000`（注释同步 "10 minutes"）。
- 检查点改为读取配置，缺省回退常量——运行时校验：手写 config.json 的非法值（0/负数/字符串）
  不得静默禁用或立即触发超时——非法一律回退默认：

```js
// 运行时校验（设计评审 #1，2026-08-24）：手写 config.json 的非法值（0/负数/字符串）
// 不得静默禁用或立即触发超时——非法一律回退默认。
const cfg = agent.config?.advisor?.timeoutMs
const timeoutMs = (Number.isFinite(cfg) && cfg > 0) ? cfg : REVIEW_TIMEOUT_MS
if (Date.now() - startTime > timeoutMs) {
  return renderTimeline(timeline, `Advisor: review timeout after ${Math.round(timeoutMs / 1000)}s. ...`)
}
```

- 读取链已验证：`src/agent/setup.mjs` `advisorCfg = raw.agent?.advisor ?? { guard: false }` →
  `agent.config.advisor` 天然含 timeoutMs；`runAdvisorToolLoop` 已接收 `agent` 参数，
  **无需改签名**。
- **不在** `loadAgentSettings` 的 advisor 默认里写死 timeoutMs——保持默认值单一来源
  （run.mjs 常量兜底）。`src/config-io.mjs` `AGENT_DEFAULTS.advisor` 注释补充 timeoutMs
  字段说明（"timeoutMs 面板直传；运行默认 600_000（advisor/run.mjs）"）。
- **设置面板 UI 不加 timeoutMs 输入框**（保持现状，config.json 手写即可）——但**保存路径
  必须透传**（见 2.4，P4 修复）。

### 2.2 explore 子 agent 去掉 30 轮硬帽

- `src/agent-tools/subagent.mjs`：删除 `Math.min(30, …)` 分支，explore 与其它角色统一：
  `const maxTurns = parent.config?.agent?.subagentTurns ?? 100`（注释同步——原 "explore
  stays capped lower (read-only search)" 删除或改写）。
- 现码核对（2026-09-08）：`src/agent-tools/subagent.mjs` 现行为
  `maxTurns: parent.config?.agent?.subagentTurns ?? 100`（无 `Math.min(30, …)` 截断），
  与 async/escalate 子 agent 路径一致。

### 2.3 主 agent 轮次上限默认 100→200

- `src/agent/run-helpers.mjs`：`DEFAULT_MAX_TURNS = 100` → `200`（`configuredMaxTurns()`
  兜底）。现码：`DEFAULT_MAX_TURNS = 200`。
- `src/config-io.mjs` `AGENT_DEFAULTS`：`maxTurns: 100` → `200`。现码：`maxTurns: 200`；
  advisor 默认注释 "maxTurns 200" 已同步。
- `src/agent/setup.mjs`：`cfgMaxTurns` 初始值 100 → 200；读取兜底 `raw.agent?.maxTurns ?? 100`
  → `?? 200`。现码核对：初始 200、读取兜底 `?? 200`。
- `webview/settings-agent.js`：面板显示兜底 `as.maxTurns ?? 100` → `?? 200`。
- 不改 `goalTurns`/`consultTurns`/`subagentTurns` 默认值（均 100/40，独立语义，本次不动）。

### 2.4 面板保存 advisor 时透传 timeoutMs（P4 修复）

`src/config-io.mjs` 的 `saveAgentSettingsFromPanel`：advisor 合并对象透传 timeoutMs——payload
显式给了合法 timeoutMs 时写入，否则**保留 current 里的值**（避免面板保存任意 advisor 字段时把
用户手写的 timeoutMs 冲掉）：

```js
// timeoutMs passthrough (AGENT-PARAMS-TUNING, P4): the panel has no timeoutMs
// input — an explicit valid payload value wins, otherwise the hand-written
// config.json value survives a panel save (never silently dropped, never stored invalid).
if (typeof adv.timeoutMs === "number" && adv.timeoutMs > 0) merged.timeoutMs = adv.timeoutMs
if (!Number.isFinite(merged.timeoutMs) || merged.timeoutMs <= 0) delete merged.timeoutMs
```

（`current` 来自 `loadAgentSettings().advisor`，即 config.json 现值；`saveAgentSettings` 是
whole-object 覆盖写，不合并会丢字段——与现有 guard/effort/provider/model 保留逻辑同构。）

## 3. 受影响文件（Affected Files）

| 文件 | 动作 | 内容 |
|---|---|---|
| `src/advisor/run.mjs` | MODIFY | 常量 `600_000`；检查点改读 `agent.config?.advisor?.timeoutMs ?? REVIEW_TIMEOUT_MS` |
| `src/agent-tools/subagent.mjs` | MODIFY | 删除 explore 的 `Math.min(30, …)`，统一 `subagentTurns ?? 100` |
| `src/agent/run-helpers.mjs` | MODIFY | `DEFAULT_MAX_TURNS = 200` |
| `src/agent/setup.mjs` | MODIFY | `cfgMaxTurns` 初始 200；读取兜底 `?? 200` |
| `src/config-io.mjs` | MODIFY | `AGENT_DEFAULTS` `maxTurns: 200` + advisor 注释；advisor 合并透传 timeoutMs |
| `webview/settings-agent.js` | MODIFY | 显示兜底 `?? 200` |
| 相关设计文档 | MODIFY | "默认 100" 描述同步为 "默认 200" |
| 测试 | MODIFY | timeoutMs 配置覆盖/回退；面板保存保留 timeoutMs；explore 用满 subagentTurns；默认 200 断言 |

## 4. 验收标准（Acceptance Criteria）

| # | AC | 验证方式 |
|---|---|---|
| AC1 | `agent.advisor.timeoutMs` 配置生效：配置 1s 时评审在 ~1s 被截断并返回 timeout 消息 | 单元测试：构造 `agent.config.advisor.timeoutMs = 100`，mock 慢 LLM/工具循环，断言输出含 "review timeout after" |
| AC2 | 未配置 timeoutMs 时回退 `600_000`：超时消息显示 "after 600s" | 单元测试：无 advisor 配置，断言消息用默认值（不实际等待） |
| AC3 | explore 子 agent maxTurns = subagentTurns（无 Math.min 截断） | 单元测试：`subagentTurns: 42` 时 explore 子 agent 收到 `maxTurns === 42` |
| AC4 | 未配置 maxTurns 时默认 200 | 单元测试：无配置 → `configuredMaxTurns()`/loadAgentSettings 返回 200 |
| AC5 | 显式 `maxTurns` 配置仍优先 | 现有测试保持（显式值断言不回退） |
| AC6 | 面板保存 advisor（如 guard 切换）后 config.json 的 timeoutMs 保留 | 单元测试：先写 timeoutMs=123456 → `saveAgentSettingsFromPanel({ advisor: { guard: true } })` → 断言 advisor.timeoutMs 仍 123456 |
| AC7 | `npm test` 全套通过 | 命令 |
| AC8 | `src/` 中 "300_000"（评审超时）无残留 | grep 验证 |
| AC9 | 非法 timeoutMs 值（0/负数/字符串）回退默认 `600_000`——不立即超时、不静默禁用超时 | 单元测试：`agent.config.advisor.timeoutMs` 分别为 `0`/`-100`/`"abc"` 时，超时检查用默认值（消息 "after 600s"，且不立即截断） |

## 变更记录

- 2026-08-24：立项 + 评审修订后实施发布。本文档描述即当前实现态（重写为人类可读，
  折叠逐轮评审流水与行号锚——以符号/语义锚表述，逐字契约代码块保留）。
