# 撞墙继续（TURN-CAP-CONTINUE）— 需求

> 板块：Agent 循环 · 撞墙继续（轮数预算耗尽后的续跑）。需求层文档（`docs/requirements/`）。
> 来源：2026-09-10 自 `../design/TURN-CAP-CONTINUE.md` 抽取需求陈述（统一语义 / 各执行体表 / 边界）。
> 状态：**现行**。设计+测试见 `../design/TURN-CAP-CONTINUE.md`；参数值见 `AGENT-PARAMS.md`。

## 1. 总体需求

agent 撞上轮数上限时**不该丢掉已完成的工作**——应当可以就地续跑（同一执行体、保留历史与改动），
而不是重开一次任务。续跑必须是用户可控的（拒绝时返回部分成果），且**次数不设上限**。

## 2. 功能性需求

| # | 需求 | 说明 |
|---|---|---|
| F1 | 统一语义 | **撞墙** = runAgent 耗尽 maxTurns 抛 `ContinueError`（携带轮数）；**继续** = `resume:true` 重跑同一执行体 |
| F2 | 续跑不重来 | 继续**不重新注入任务文本**、保留 history 与改动记录、每次全新轮数预算 |
| F3 | 全执行体覆盖 | 主 agent / 子 agent / 飞刀 escalate / 会诊 consult 四类执行体均可继续 |
| F4 | 拒绝返回部分成果 | 拒绝或无权限 handler → 部分成果返回并带 `TURN_CAP_MARK`（`"stopped: turn cap reached"`）标记——报告可据此判定"工作可能不完整" |
| F5 | 用户 Stop 优先 | 用户中止始终优先于继续（Ctrl+C 中止路径清池不续跑） |
| F6 | 继续提示串行 | 按会话级队列串行——并行 consultant 的继续提示不互相抢 |

## 3. 非功能性需求

| # | 维度 | 标准 |
|---|---|---|
| N1 | **继续次数不设上限**（用户明确要求） | 防卡死靠用户 Ctrl+C，不靠次数帽 |
| N2 | 预算可配 | 触发预算全部来自 config（`agent.maxTurns` / `agent.subagentTurns` / `agent.consultTurns`） |
| N3 | 时钟语义 | 会诊继续时**墙钟 watchdog 重置**（继续 = 新预算 = 时钟重起） |
| N4 | 跨端一致 | explore 走 `subagentTurns`（30 硬帽移除，双端对齐） |

## 4. 范围边界（不做）

- 不设继续次数上限（N1——历史 30 硬帽已移除）
- 不重新注入任务文本（F2——续跑 ≠ 重启）
