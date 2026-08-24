# Agent 运行参数调整 — 需求（CLI）

> 状态：**已实现**（2026-08-24 评审修订后实施；npm 0.12.43 / vscode 0.1.49 发布）
> 关联：`docs/design/AGENT-PARAMS-TUNING.md`（设计）、`docs/design/README.md`（文档地图）
> 范围：本仓库（thincoder CLI）；VS Code 扩展（thincoder-vscode）有同需求独立文档（`AGENT-PARAMS-REQUIREMENTS.md`），两端语义一致

## 1. 总体目标

调整三项 Agent 运行参数，使长评审、长任务不会因硬编码限制或过低默认值被中断：

1. **评审超时**：整体评审（advisor review）超时默认从 300s 提高到 600s，并开放为可配置项（`agent.advisor.timeoutMs`）——长评审（大文件、多轮工具探索）不再被固定墙钟误杀。
2. **子 agent 轮次上限**：explore 子 agent 不再被 30 轮硬帽限制，直接用 `subagentTurns` 配置（默认 100）。（注：30 硬帽仅存在于 VS Code 扩展 `subagent.mjs:113`；CLI 端子 agent 直接用 `subagentTurns`，**本仓库无此项代码改动**，仅文档语义对齐。）
3. **主 agent 轮次上限**：默认值从 100 提高到 200——大任务（多文件重构、多轮修复-验证循环）不再轻易撞墙。

## 2. 功能用户故事（Functional）

| # | 用户故事 | 验收语义 |
|---|---|---|
| FR1 | 作为用户，我希望评审超时可配置且默认更长，长评审不被 300s 固定墙钟中断 | `agent.advisor.timeoutMs` 可写入 `~/.thincoder/config.json`；未配置时默认 600_000（600s）；配置值被整体评审墙钟实际采用 |
| FR2 | 作为用户，我希望主 agent 在无配置时默认可跑 200 轮，大任务不轻易撞 turn 上限 | 未配置 `agent.maxTurns` 时默认 200（现 100）；显式配置仍优先 |
| FR3 | 作为用户，我希望现有配置完全兼容——加了 timeoutMs 不改动其他 advisor 字段行为 | 未配置 timeoutMs 的现有 config.json 行为不变（仅默认值变化）；`guard`/`provider`/`model`/`effort` 读写语义不变 |

## 3. 非功能标准（Non-functional）

| # | 维度 | 标准 |
|---|---|---|
| N1 | 向后兼容 | `agent.advisor.timeoutMs` 缺省回退默认常量；`TOOL_TIMEOUT_MS`（单工具 30s）不动；`consultTurns`/`consultTimeoutMs` 不动 |
| N2 | 两端一致 | CLI 与 VS Code 扩展同一配置项（`agent.advisor.timeoutMs`）、同一默认值（600_000）、同一 maxTurns 默认（200）；共享 `~/.thincoder/config.json` 读写 |
| N3 | 可维护 | 默认值集中维护、改动时全量同步：timeoutMs 兜底在 `src/advisor/run.mjs` 常量、maxTurns 在 `src/config.mjs` DEFAULTS 与 `src/agent/helpers.mjs` 常量（两处同步改）；文档同步（`AGENT-LOOP.md`、`ARCHITECTURE.md`、`TURN-CAP-CONTINUE.md` 中 "100" 默认值描述） |
| N4 | 可测试 | 每个改动点有对应单元测试断言（配置覆盖生效 / 缺省回退） |
