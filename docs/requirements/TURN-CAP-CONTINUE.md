# 撞墙继续（TURN-CAP-CONTINUE）— 需求

> 板块：Agent 循环 · 撞墙继续（轮数预算耗尽后的续跑）。需求层文档（`docs/requirements/`）。
> 来源：2026-09-10 自 `../design/TURN-CAP-CONTINUE.md` 抽取需求陈述（统一语义 / 各执行体表 / 边界）。
> 状态：**现行**。设计+测试见 `../design/TURN-CAP-CONTINUE.md`；参数值见 `AGENT-PARAMS.md`。

## 1. 总体需求

agent 撞上轮数上限时**不该丢掉已完成的工作**——应当可以就地续跑（同一执行体、保留历史与改动），
而不是重开一次任务。续跑必须是用户可控的（拒绝时返回部分成果），且**次数不设上限**。

## 2. 功能性需求

> 第 19 批（2026-09-11）追加：F7（编号跨段累计）——来源 = 批次 `../batches/2026-09-11-TURN-ACROSS-SEGMENTS.md` §1。
> 设计+测试 = `../design/TURN-CAP-CONTINUE.md` §跨段累计编号（双端同源——VSC 侧 = VSC 仓 `docs/design/TURN-CAP-CONTINUE` 同名节）。

| # | 需求 | 说明 |
|---|---|---|
| F1 | 统一语义 | **撞墙** = runAgent 耗尽 maxTurns 抛 `ContinueError`（携带轮数）；**继续** = `resume:true` 重跑同一执行体 |
| F2 | 续跑不重来 | 继续**不重新注入任务文本**、保留 history 与改动记录、每次全新轮数预算 |
| F3 | 全执行体覆盖 | 主 agent / 子 agent / 飞刀 escalate / 会诊 consult 四类执行体均可继续 |
| F4 | 拒绝返回部分成果 | 拒绝或无权限 handler → 部分成果返回并带 `TURN_CAP_MARK`（`"stopped: turn cap reached"`）标记——报告可据此判定"工作可能不完整" |
| F5 | 用户 Stop 优先 | 用户中止始终优先于继续（Ctrl+C 中止路径清池不续跑） |
| F6 | 继续提示串行 | 按会话级队列串行——并行 consultant 的继续提示不互相抢 |
| F7 | 编号跨段累计 | 触发回合帽续跑后，面向上层的逐轮编号**跨段累计为唯一单调序列**（不重置、不倒退）——展示口径 `turn n/max`：n = 链内累计已跑轮数，max = 累计已授予预算（段数 × 段预算）；双端同源（各端独立实现） |

## 3. 非功能性需求

| # | 维度 | 标准 |
|---|---|---|
| N1 | **继续次数不设上限**（用户明确要求） | 防卡死靠用户 Ctrl+C，不靠次数帽 |
| N2 | 预算可配 | 触发预算全部来自 config（`agent.maxTurns` / `agent.subagentTurns` / `agent.consultTurns`） |
| N3 | 时钟语义 | 会诊继续时**墙钟 watchdog 重置**（继续 = 新预算 = 时钟重起） |
| N4 | 跨端一致 | explore 走 `subagentTurns`（30 硬帽移除，双端对齐） |
| N5 | 协议兼容 | 编号载荷格式零改动（`⟦ev⟧turn` 字段数 / phase / 解析点不变——只变值语义）：既有消费点（镜像 / 面板 / 状态 / 终态快照）零修改即得累计值 |
| N6 | 零机制改动 | 段内帽判定（`turn < maxTurns`）与 `ContinueError` 抛点、续跑预算语义零变化——本项只改展示 / 协议编号值 |

## 4. 范围边界（不做）

- 不设继续次数上限（N1——历史 30 硬帽已移除）
- 不重新注入任务文本（F2——续跑 ≠ 重启）
- 不做分段显式显示（段号 + 段内号——`turn 30/100 · seg 2` 形态）：选型见设计档（跨段累计胜出——协议字段零新增）
- 不改继续提示文案（`Ran N turns (limit N)`）：该文案描述**本段**撞墙事件（ContinueError 载荷 = 段预算），非任务累计进度
- 不建 VSC live 头逐轮跳动：登记行（VSC `docs/design/AGENT-LOOP` :27）明示「桥白名单不擅建」——本批不碰桥面
