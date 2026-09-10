# Agent 运行参数调整 — 设计（CLI）

> 状态：**已实现**（2026-08-24 评审修订后实施；npm 0.12.43）。
> 需求：`AGENT-PARAMS-REQUIREMENTS.md`。
> 关联：`AGENT-LOOP.md`、`TURN-CAP-CONTINUE.md`、`docs/README.md`（总地图）。

## 1. 问题陈述（Problem Statement）

三项硬编码/默认参数导致真实使用中被误杀或过早中断：

| # | 现状 | 位置 | 后果 |
|---|---|---|---|
| P1 | 评审整体墙钟 `REVIEW_TIMEOUT_MS = 300_000`（5 分钟）**硬编码**，用户无法调整 | `src/advisor/run.mjs` 常量 + `runAdvisorToolLoop` 循环内检查点 | 大评审（多文件、多轮工具探索、慢模型）5 分钟即被截断，返回 partial results；用户只能缩小范围或碰运气 |
| P2 | 主 agent 轮次上限默认 `maxTurns: 100` | `src/config.mjs`（DEFAULTS）、`src/agent/helpers.mjs`（`DEFAULT_MAX_TURNS`）、读取链 | 多文件重构/修复-验证循环任务频繁撞墙，需人工 "Continue" |
| P3 | 文档与 UI 中 "maxTurns 默认 100" 的散落描述未同步 | 相关设计文档与 `src/tui/cmd-config.mjs` 若干 `?? 100` 显示兜底 | 改默认值后文档/显示与真实行为漂移 |

## 2. 解决方案（Solution Approach）

### 2.1 评审超时配置化 + 默认 600s

- `src/advisor/run.mjs`：`REVIEW_TIMEOUT_MS = 600_000`（注释同步 "10 minutes"）。
- 循环内检查点改为读取配置，缺省回退常量：

```js
// 运行时校验：手写 config.json 的非法值（0/负数/字符串）
// 不得静默禁用或立即触发超时——非法一律回退默认。
const cfg = agent.config?.advisor?.timeoutMs
const timeoutMs = (Number.isFinite(cfg) && cfg > 0) ? cfg : REVIEW_TIMEOUT_MS
if (Date.now() - startTime > timeoutMs) {
  return renderTimeline(timeline, `Advisor: review timeout after ${Math.round(timeoutMs / 1000)}s. ...`)
}
```

- 读取链已验证：`src/config.mjs` `merged.advisor = { ...merged.agent.advisor }` promote 透传 →
  `agent.config.advisor` 天然含 `timeoutMs`；`runAdvisorToolLoop` 已接收 `agent` 参数，
  **无需改签名**。
- **不在** `DEFAULTS.agent.advisor` 里写死 timeoutMs——保持默认值单一来源（run.mjs 常量
  兜底），避免两处漂移（N3）。config.mjs 的 advisor 注释补充 timeoutMs 字段说明。
- **TUI 配置编辑**（`src/tui/cmd-config.mjs`）不新增 timeoutMs 编辑项——config.json 手写即可。

### 2.2 主 agent 轮次上限默认 100→200

- `src/config.mjs` DEFAULTS：`maxTurns: 100` → `maxTurns: 200`。
- `src/agent/helpers.mjs`：`DEFAULT_MAX_TURNS = 100` → `200`（prepareRun 的兜底常量）。
- `src/tui/cmd-config.mjs` 的显示兜底 `?? 100` → `?? 200`（状态栏、配置项、详情、编辑初始值
  四处）。
- 读取链无需其他改动：`src/agent/setup.mjs` 已是 `overrideTurns ?? agent.config?.agent?.maxTurns
  ?? DEFAULT_MAX_TURNS` 三级回退。
- **不改** `goalTurns: 200`（已存在的 goal 模式上限，独立语义）；`DEFAULT_SUBAGENT_TURNS = 100`
  不变。

### 2.3 子 agent 轮次（CLI 端无代码改动）

explore 与其它角色一致走 `subagentTurns`（见 `src/agent-tools/subagent.mjs`），仅在本文档与
需求文档中说明与 VS Code 端对齐的语义（30 硬帽是 VS Code 端特有问题，CLI 无）。

## 3. 受影响文件（Affected Files）

| 文件 | 动作 | 内容 |
|---|---|---|
| `src/advisor/run.mjs` | MODIFY | 常量 `600_000`；检查点改读 `agent.config?.advisor?.timeoutMs ?? REVIEW_TIMEOUT_MS` |
| `src/config.mjs` | MODIFY | `maxTurns` 200；advisor 注释补 timeoutMs |
| `src/agent/helpers.mjs` | MODIFY | `DEFAULT_MAX_TURNS = 200` |
| `src/tui/cmd-config.mjs` | MODIFY | 四处显示兜底 `?? 100` → `?? 200` |
| 相关设计文档 | MODIFY | "默认 100" 描述同步为 "默认 200" |
| `test/advisor.test.mjs` | MODIFY | 新增 timeoutMs 配置覆盖/回退用例（见 §4） |
| `test/agent.test.mjs` | MODIFY | 显式 `maxTurns: 100` 配置保持合法（仅确认断言不锁死默认值） |

## 4. 验收标准（Acceptance Criteria）

| # | AC | 验证方式 |
|---|---|---|
| AC1 | `agent.advisor.timeoutMs` 配置生效：配置 1s 时评审在 ~1s 被截断并返回 timeout 消息 | 构造 `agent.config.advisor.timeoutMs = 100`，mock 慢 LLM/工具循环，断言输出含 "review timeout after" |
| AC2 | 未配置 timeoutMs 时回退 `600_000`：超时消息显示 "after 600s" | 无 advisor 配置，断言消息用默认值（不实际等待） |
| AC3 | 未配置 maxTurns 时默认 200 | `prepareRun`/`runAgent` 无配置 → `maxTurns === 200`（断言 `DEFAULT_MAX_TURNS`） |
| AC4 | 显式 `maxTurns` 配置仍优先 | 显式值断言不回退 |
| AC5 | 文档同步：相关设计文档无 "100" 默认值残留描述 | grep 验证 |
| AC6 | `node --test test/*.test.mjs` 全套通过 | 命令 |
| AC7 | 评审错误消息/日志中 "300" 无残留（除历史文档） | grep `300_000` src/ 无匹配 |
| AC8 | 非法 timeoutMs 值（0/负数/字符串）回退默认 `600_000`——不立即超时、不静默禁用超时 | `agent.config.advisor.timeoutMs` 分别为 `0`/`-100`/`"abc"` 时，超时检查用默认值（消息 "after 600s"，且不立即截断） |

## 变更记录

- 2026-08-24：立项 + 评审修订后实施发布。本文档描述即当前实现态（重写为人类可读，
  折叠逐轮评审流水与行号锚——以符号/语义锚表述）。
