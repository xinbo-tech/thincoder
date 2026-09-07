# 撞轮数墙可继续（TURN-CAP-CONTINUE）

> 板块：Agent 循环（`TURN-CAP-CONTINUE.md`——撞墙可继续专题，独立保留，见 README 地图）。
> 状态：**机制已实现并在现行代码生效**——主/子/飞刀/会诊四类执行体撞轮数墙都能"继续"，且不限次数。与 CLI 端同源（两端语义一致）。

> 权威源：`src/agent.mjs`（`ContinueError`）、`src/agent/run-helpers.mjs` / `src/agent/setup.mjs`
> （预算 + `stateSink.history` / resume）、`src/extension/panel-chat.mjs`（主 agent 回合循环）、
> `src/agent-tools/subagent.mjs`（子 agent）、`src/agent-tools/subagent-escalate.mjs` /
> `subagent-escalate-async.mjs`（飞刀）、`src/agent-tools/consult.mjs`（会诊）。
> 文档格式债清理批 V2（2026-09-08）——整文件单物理行 demux 为多行 + 漂移修正（explore-30 表述已随 AGENT-PARAMS 取消）。

## 统一语义

- **撞墙** = runAgent 耗尽 maxTurns 抛 `ContinueError`（携带轮数）；
- **继续** = `resume:true` 重跑同一个执行体：不重新注入任务文本、保留 history 与改动记录、每次全新轮数预算（`resume` 时经 `opts.history = sink.history` 把子执行体的活 history 交回）；
- **拒绝 / headless（无 onQuestion）** → 返回部分成果（标记 turn cap reached，报告可据此判定"撞墙中断、工作可能不完整"）；
- 用户 Stop（`AbortError` / signal.aborted）始终优先于继续提示；
- 继续提示按会话级队列串行（并行子执行体同时撞墙不弹多个）。

## 各执行体

| 执行体 | 轮数预算 | 继续通道 | 次数 |
|---|---|---|---|
| 主 agent | `maxTurns`（默认 200） | 面板继续卡（`askInPanel` "Continue/Stop"；AUTO 自动续跑不弹卡） | 不限 |
| 子 agent | `subagentTurns`（默认 100） | `onQuestion` 面板问题卡（前台/阻塞子代理弹卡；后台 async 不弹——engineering && AUTO 自动续跑） | 不限 |
| 飞刀 escalate | `subagentTurns`（默认 100） | `onQuestion` 面板问题卡（同步飞刀弹卡；后台 async 自动降级 partial） | 不限（`MAX_RESUMES=2` 已删） |
| 会诊 consult | `consultTurns`（默认 40） | `onQuestion` 面板问题卡（`session.continueQueue` 串行）；继续时**墙钟 watchdog 重置** | 不限 |

## 实现要点（当前态）

### 主 agent

- `src/extension/panel-chat.mjs` 回合循环：`for (let resume = false; ; resume = true)`，runAgent 走 `runOpts(resume)`。
- `ContinueError` 分支与 Ctrl+I 中断（`AbortError` + `reason.interrupt`）并入同一循环：重建 controller → `continue`。
- 手动档：`askInPanel("Agent reached N turns (limit). Continue from here?", ["Continue","Stop"])`——Continue 则重建 controller 续跑（resume 跳过重推用户消息）。
- AUTO 档（`autoTurn`）：不弹卡——`panel._autoApprove` 时自动重建续跑，否则静默停（partial digest 留在 history）。

### 子 agent

- `src/agent-tools/subagent.mjs` execute 内 `for (let resume = false; ; resume = true)` 循环，捕获 `ContinueError`。
- 前台（非 asyncFlag）且有 `ctx.callbacks.onQuestion`：弹 `["Continue","Stop"]` → continue 时 `{ ...baseOpts, resume, history: sink.history }`。
- 后台 async 子代理（`asyncFlag`）**永不弹卡**（§15 D-A3）——engineering && AUTO 时经 `shouldAutoResume`（subagent-async.mjs）自动续跑，否则降级 partial。
- 拒绝 / headless / 无法续跑 → 返回 `turn cap reached (N turns) — work may be partial`（eng-coder 附带 designId 注记供重派）。

### 飞刀 escalate

- `src/agent-tools/subagent-escalate.mjs`（同步）：循环捕获 `ContinueError` → `ctx.callbacks.onQuestion(["Continue","Stop"])` → continue 时 `resume:true`。
- `MAX_RESUMES` 已删除——不限次数。
- 后台 async 飞刀（`subagent-escalate-async.mjs`）：无面板值守，撞 turn cap 归 error-class 自动降级 partial（消化轮处置）。
- 无墙钟 watchdog——仅 turn cap（hang 防护 = per-LLM-call FETCH_TIMEOUT + 用户 Stop）。

### 会诊 consult

- `src/agent-tools/consult.mjs` runConsultant 循环，捕获 `ContinueError`。
- 前台回合内：`session.continueQueue = (session.continueQueue ?? …).then(ask, ask)` 串行排队询问（`["Continue","Stop"]`）→ continue 时 `clearTimeout(watchdog)` + `timedOut=false` + 重挂 watchdog（每次继续 = 新预算 = 墙钟重起）。
- 挂起期（`_suspended`，后台）consult 撞 turn 帽**不再弹继续卡**——自动降级 partial（消化轮处置）。
- consult 预算 `consultTurns ?? 40`；墙钟 `agent.consultTimeoutMs ?? 600_000`（10min）。

## 边界

- **继续次数不设上限**（用户明确要求）；防卡死靠用户 Stop。
- 触发预算全部来自共享 config（`agent.maxTurns` / `agent.subagentTurns` / `agent.consultTurns`），可配——**explore 与其它子代理角色共用 `subagentTurns`**（AGENT-PARAMS 2026-08-24 已移除插件 explore 的 30 硬帽，两端对齐；本文件不再承载 explore 预算语义，见 AGENT-PARAMS）。
- 部分成果路径（拒绝 / 无权限 handler / headless）返回文本带 turn-cap 标记——报告据此判定"撞墙中断、工作可能不完整"。

## 变更记录

- 2026-08-17：立项实现。主 agent 已有无限 continue；子 agent / escalate / consult 补同款——escalate 删 `MAX_RESUMES=2` 封顶、consult 继续时重置 watchdog（本文件整文件单行最初版）。
- 2026-08-24：AGENT-PARAMS 移除插件 explore 30 硬帽——explore 并入 `subagentTurns`（本文件原"vscode explore 封顶 30"表述随之作废）。
- 2026-09 起：随子代理重构收敛——子 agent/escalate/consult 的继续循环各居其模块；escalate 完全异步化后其同步面 continue 仍走同一 onQuestion 通道；主 agent 循环并入 Ctrl+I 中断续跑语义。
- 2026-09-08：随文档格式债清理批 V2 重写为多行当前态 + 漂移修正。
