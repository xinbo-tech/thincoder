# Agent 运行参数调整 — 设计（CLI）

> 状态：**已实现**（2026-08-24 评审修订后实施；npm 0.12.43）
> 需求：`docs/design/AGENT-PARAMS-REQUIREMENTS.md`
> 关联：`docs/design/README.md`（文档地图）、`docs/design/AGENT-LOOP.md`、`docs/design/TURN-CAP-CONTINUE.md`

## 1. 问题陈述（Problem Statement）

三项硬编码/默认参数导致真实使用中被误杀或过早中断：

| # | 现状 | 位置 | 后果 |
|---|---|---|---|
| P1 | 评审整体墙钟 `REVIEW_TIMEOUT_MS = 300_000`（5 分钟）**硬编码**，用户无法调整 | `src/advisor/run.mjs:32`，检查点 `:160-161`（`runAdvisorToolLoop` 循环内） | 大评审（多文件、多轮工具探索、慢模型）5 分钟即被截断，返回 partial results；用户只能缩小范围或碰运气 |
| P2 | 主 agent 轮次上限默认 `maxTurns: 100` | `src/config.mjs:42`（DEFAULTS）、`src/agent/helpers.mjs:11`（`DEFAULT_MAX_TURNS`）、`src/agent/setup.mjs:59`（读取链） | 多文件重构/修复-验证循环任务频繁撞墙，需人工 "Continue" |
| P3 | 文档与 UI 中 "maxTurns 默认 100" 的散落描述未同步 | `docs/design/AGENT-LOOP.md:23`、`docs/design/ARCHITECTURE.md:392`、`docs/design/TURN-CAP-CONTINUE.md:16`、`src/tui/cmd-config.mjs` 若干 `?? 100` 显示兜底 | 改默认值后文档/显示与真实行为漂移 |

## 2. 解决方案（Solution Approach）

### 2.1 评审超时配置化 + 默认 600s

- `src/advisor/run.mjs:32`：`REVIEW_TIMEOUT_MS = 600_000`（注释同步 "10 minutes"）。
- 检查点 `:160-161`：改为读取配置，缺省回退常量——

  ```js
  // 运行时校验（设计评审 #1，2026-08-24）：手写 config.json 的非法值（0/负数/字符串）
  // 不得静默禁用或立即触发超时——非法一律回退默认。
  const cfg = agent.config?.advisor?.timeoutMs
  const timeoutMs = (Number.isFinite(cfg) && cfg > 0) ? cfg : REVIEW_TIMEOUT_MS
  if (Date.now() - startTime > timeoutMs) {
    return renderTimeline(timeline, `Advisor: review timeout after ${Math.round(timeoutMs / 1000)}s. ...`)
  }
  ```

- 读取链已验证：`src/config.mjs:309` `merged.advisor = { ...merged.agent.advisor }` promote 透传 → agent.config.advisor 天然含 `timeoutMs`；`runAdvisorToolLoop` 已接收 `agent` 参数，**无需改签名**。
- **不在** `DEFAULTS.agent.advisor` 里写死 timeoutMs——保持默认值单一来源（run.mjs 常量兜底），避免两处漂移（N3）。`src/config.mjs:55` 的 advisor 注释补充 timeoutMs 字段说明。
- **TUI 配置编辑**（`src/tui/cmd-config.mjs`）不新增 timeoutMs 编辑项（advisor 目前无编辑项，保持现状）——config.json 手写即可。

### 2.2 主 agent 轮次上限默认 100→200

- `src/config.mjs:42`：`maxTurns: 100` → `maxTurns: 200`（DEFAULTS）。
- `src/agent/helpers.mjs:11`：`DEFAULT_MAX_TURNS = 100` → `200`（prepareRun 的兜底常量）。
- `src/tui/cmd-config.mjs` 的显示兜底 `?? 100` → `?? 200`（`:237` 状态栏、`:238` 配置项、`:258` 详情、`:307` 编辑初始值）。
- 读取链无需其他改动：`src/agent/setup.mjs:59` 已是 `overrideTurns ?? agent.config?.agent?.maxTurns ?? DEFAULT_MAX_TURNS` 三级回退。
- **不改** `goalTurns: 200`（已存在的 goal 模式上限，独立语义）；`DEFAULT_SUBAGENT_TURNS = 100` 不变。

### 2.3 子 agent 轮次

CLI 端无需代码改动（explore 与其它角色一致走 `subagentTurns`，见 `src/agent-tools/subagent.mjs:236`）。仅在本文档与需求文档中说明与 VS Code 端对齐的语义（30 硬帽是 VS Code 端特有问题，CLI 无）。

## 3. 受影响文件（Affected Files）

| 文件 | 动作 | 内容 |
|---|---|---|
| `src/advisor/run.mjs` | MODIFY | `:32` 常量 600_000；`:160-161` 改读 `agent.config?.advisor?.timeoutMs ?? REVIEW_TIMEOUT_MS` |
| `src/config.mjs` | MODIFY | `:42` maxTurns 200；`:55` advisor 注释补 timeoutMs |
| `src/agent/helpers.mjs` | MODIFY | `:11` DEFAULT_MAX_TURNS = 200 |
| `src/tui/cmd-config.mjs` | MODIFY | `:237` `:238` `:258` `:307` 显示兜底 `?? 100` → `?? 200` |
| `docs/design/AGENT-LOOP.md` | MODIFY | `:23` "默认 100" → "默认 200" |
| `docs/design/ARCHITECTURE.md` | MODIFY | `:392` `"maxTurns": 100` → `"maxTurns": 200` |
| `docs/design/TURN-CAP-CONTINUE.md` | MODIFY | `:16` `maxTurns (100)` → `maxTurns (200)` |
| `test/advisor.test.mjs` | MODIFY | 新增 timeoutMs 配置覆盖/回退用例（见 §4） |
| `test/agent.test.mjs` | MODIFY | `:2329-2330` 显式配置 `maxTurns: 100` 是否需改由 eng-coder 按语义判断（显式 100 仍合法，仅确认断言不锁死默认值） |

## 4. 验收标准（Acceptance Criteria）

| # | AC | 验证方式 |
|---|---|---|
| AC1 | `agent.advisor.timeoutMs` 配置生效：配置 1s 时评审在 ~1s 被截断并返回 timeout 消息 | 单元测试：构造 `agent.config.advisor.timeoutMs = 100`，mock 慢 LLM/工具循环，断言输出含 "review timeout after" |
| AC2 | 未配置 timeoutMs 时回退 600_000：超时消息显示 "after 600s" | 单元测试：无 advisor 配置，断言消息用默认值（不实际等待） |
| AC3 | 未配置 maxTurns 时默认 200 | 单元测试：`prepareRun`/`runAgent` 无配置 → `maxTurns === 200`（断言 DEFAULT_MAX_TURNS） |
| AC4 | 显式 `maxTurns` 配置仍优先 | 现有测试保持（`test/agent.test.mjs` 显式值断言不回退） |
| AC5 | 文档同步：AGENT-LOOP.md/ARCHITECTURE.md/TURN-CAP-CONTINUE.md 无 "100" 默认值残留描述 | grep 验证 |
| AC6 | `node --test test/*.test.mjs` 全套通过 | 命令 |
| AC7 | 评审错误消息/日志中 "300" 无残留（除历史文档） | grep "300_000" src/ 无匹配 |
| AC8 | 非法 timeoutMs 值（0/负数/字符串）回退默认 600_000——不立即超时、不静默禁用超时 | 单元测试：`agent.config.advisor.timeoutMs` 分别为 `0`/`-100`/`"abc"` 时，超时检查用默认值（消息 "after 600s"，且不立即截断） |
