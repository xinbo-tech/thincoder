# 撞轮数墙可继续（TURN-CAP-CONTINUE）

> 板块：Agent 循环（`TURN-CAP-CONTINUE.md`——撞墙可继续专题，与 AGENT-LOOP 同板块独立保留，见 README 地图）。
> 状态：**机制已实现并在现行代码生效**——主/子/飞刀/会诊四类 agent 撞轮数墙都能"继续"，且不限次数。与 VS Code 插件端同源（两端语义一致）。
> 权威源：`src/agent/spawn-child.mjs`（`runWithContinue` 骨架）、`src/agent-tools/subagent.mjs` / `subagent-actions.mjs` / `escalate-async.mjs` / `consult.mjs`、`src/tui/agent-turn.mjs`（主 agent 面板）、`src/agent.mjs`（`ContinueError` / runAgent 循环）。

## 统一语义

- **撞墙** = runAgent 耗尽 maxTurns 抛 `ContinueError`（携带轮数）；
- **继续** = `resume:true` 重跑同一个执行体：不重新注入任务文本、保留 history 与改动记录、每次全新轮数预算；
- **拒绝 / headless** → 部分成果返回；用户 Stop 始终优先；继续提示按会话级队列串行。

## 各执行体

| 执行体 | 轮数预算 | 继续通道 | 次数 |
|---|---|---|---|
| 主 agent | `maxTurns`（默认 200） | TUI 权限面板（"❯ Continue"） | 不限（既有，不动） |
| 子 agent | `subagentTurns`（默认 100） | 权限请求 `onPermissionRequest("continue", …)` | 不限 |
| 飞刀 escalate | `subagentTurns`（默认 100） | 同上（escalate 无 permQueue，直问用户） | 不限 |
| 会诊 consult | `consultTurns`（默认 40） | 同上；继续时**墙钟 watchdog 重置** | 不限 |

## 实现要点

撞墙可继续统一收敛到 `runWithContinue(runner, child, input, callbacks, runOpts, hooks)`——一个 `ContinueError → 询问 → resume:true 重跑`的循环骨架，差异点（如何问、拒绝怎么降级）经参数注入：

- **子 agent / 飞刀 / 会诊**：`runWithContinue` 包住子执行——捕获 `ContinueError` → `askContinue(e)` → 真则 `{...runOpts, resume:true}` 续跑（同一 child 对象，history 天然保留）；假则走 `onDeclined(e, output)` 返回部分成果（`TURN_CAP_MARK = "stopped: turn cap reached"` 标记部分态，TUI/status/记账据它归类）。
- **会诊 consult**：续跑经 `session.continueQueue`（session 级队列）串行——并行 consultant 的继续提示不互相抢；继续时 `clearTimeout(watchdog)` + 复位 `timedOut` 并重挂 watchdog（继续 = 新预算 = 时钟重起）。
- **主 agent**（`agent-turn.mjs`）：`ContinueError` → TUI 权限面板弹 "❯ Continue"（复用权限机制）——AUTO 档自动 resume，手动档用户点继续；每次重新建 controller 续跑。原已无限次，不动。
- escalate 与子代理共用 `ctx._subagentKey`（role `escalate` / `subagent`）——继续/完成的 TUI 冻结与记账语义一致。

## 边界

- **继续次数不设上限**（用户明确要求）；防卡死靠用户 Ctrl+C（中止路径清池不续跑）。
- 触发预算全部来自 config（`agent.maxTurns` / `agent.subagentTurns` / `agent.consultTurns`），可配。
- explore（子代理角色之一）走 `subagentTurns`（AGENT-PARAMS 2026-08-24：插件 explore 的 30 硬帽移除，双端对齐）——主 agent 走 `maxTurns`，见上表。
- 部分成果路径（拒绝/无权限 handler）返回文本带 `TURN_CAP_MARK`——报告可据此判定"撞墙中断、工作可能不完整"，见各调用方的 onDeclined 文案。

## 变更记录

- 2026-08-17：立项实现（CHANGELOG 0.12.33「撞轮数墙可无限继续」）。主 agent 已有无限 continue；子 agent / escalate / consult 补同款——escalate 删 `MAX_RESUMES=2` 封顶、consult 继续时重置 watchdog。
- 2026-09-03~06：随子代理重构收敛——继续循环抽为 `runWithContinue` 共享骨架（`src/agent/spawn-child.mjs`）；escalate 完全异步化（R17）后其继续面移到 `escalate-async.mjs`，仍走同一骨架。
- 2026-09-07：本文档随格式债清理批 A 重写为当前态。
