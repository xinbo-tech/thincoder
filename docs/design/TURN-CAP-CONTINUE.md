# TURN-CAP-CONTINUE — 所有 agent 撞轮数墙可无限继续

> 状态：**已实现**（2026-08-17，CHANGELOG 0.12.33「撞轮数墙可无限继续」）。与 VS Code 插件端同源——两端语义一致，本文件为 CLI 侧实现记录，插件端 docs/design/TURN-CAP-CONTINUE.md 为其实现记录
> 用户决定：**所有 agent（主/子/飞刀/会诊）撞轮数墙都应弹"继续"，且不限次数。**

## 统一语义

- 撞墙 = runAgent 耗尽 maxTurns 抛 ContinueError（携带轮数）
- 继续 = `resume:true` 重跑同一个执行体：不重新注入任务文本、保留 history 与改动记录、每次全新轮数预算
- 拒绝 / headless → 部分成果返回；用户 Stop 始终优先；继续提示排队串行

## 各执行体

| 执行体 | 预算 | 继续通道 | 次数 |
|---|---|---|---|
| 主 agent | maxTurns (200) | TUI 权限面板 | 不限（已有，不动） |
| 子 agent | subagentTurns (100) | TUI 权限面板（"continue"） | 不限（新增） |
| 飞刀 escalate | subagentTurns (100) | TUI 权限面板（"continue"） | 不限（去掉 MAX_RESUMES=2） |
| 会诊 consult | consultTurns (40) | TUI 权限面板（"continue"）；继续时墙钟 watchdog 重置 | 不限（新增） |

## 实现要点

- `agent-tools/subagent.mjs`：execute 循环捕获 ContinueError → `ctx.onPermissionRequest("continue", {turns, agent})` → continue 时 `{...childRunOpts, resume:true}`（同一 child 对象，history 天然保留）；提示排队复用 `parent._permQueue`（与写权限请求同队列）
- `agent-tools/escalate.mjs`：删 MAX_RESUMES，条件简化为"有 onPermissionRequest 就问"
- `agent-tools/consult.mjs`：runConsultant 循环 + 继续时 clearTimeout 重挂 watchdog 并复位 timedOut；提示经 `ctx.onPermissionRequest`，用 session 级队列串行
- `tui/agent-turn.mjs` 主 agent 已无限次，不动

## 测试

- `test/escalate.test.mjs`：反转"2 次封顶"用例 → 3+ 次继续成功
- `test/subagent.test.mjs` / `test/consult.test.mjs`：新增撞墙→继续→完成、拒绝→部分成果用例
- 全量套件

## 边界

- 继续次数不设上限（用户明确要求）；防卡死靠用户 Ctrl+C
- CLI explore 全预算 vs 插件 explore 封顶 30 的不一致——已解决（AGENT-PARAMS 2026-08-24：30 硬帽移除，explore 走 `subagentTurns`）
