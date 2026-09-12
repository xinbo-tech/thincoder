# 撞墙继续（TURN-CAP-CONTINUE）— 需求

> 板块：Agent 循环 · 轮数预算耗尽后的续跑（撞墙可继续）。需求层文档（`docs/requirements/`）。
> 定位：本仓机制实况登记——统一语义 `src/agent.mjs`（388 行——`ContinueError` + 跨段累计编号）；编号帧 `src/agent/run-helpers.mjs`（298 行）；设计 = `docs/design/TURN-CAP-CONTINUE.md`（208 行）。
> 对位注记：与对端同名需求档 `TURN-CAP-CONTINUE（CLI 仓·需求）`**语义同源**；各端独立实现（同结果、异载体）。
> 状态：**现行**（含跨段累计编号——已落）。

## 1. 总体需求

agent 撞上轮数上限时**不该丢掉已完成的工作**——可就地续跑（同一执行体、保留历史与改动），而不是重开一次任务。
续跑必须是**用户可控**的（拒绝时返回部分成果），且**次数不设上限**。

## 2. 功能性需求

| # | 需求 | 判定句（可机器验证——证据均为本仓实测） |
|---|---|---|
| F1 | 统一语义 | 撞墙 = runAgent 耗尽 maxTurns 抛 `ContinueError`（类 `src/agent.mjs:36`、抛点 `:371`）；继续 = `resume:true` 重跑同一执行体 |
| F2 | 续跑不重来 | 继续不重新注入任务文本、保留 history 与改动——`resume` 经 `opts.history = sink.history` 交回（`src/agent/setup.mjs:409` / `:423`） |
| F3 | 全执行体覆盖 | 四类执行体均有续跑分支：主 agent（`src/extension/panel-chat.mjs:415` / `:436`）· 子 agent（`src/agent-tools/subagent-run.mjs:141` / `:175`）· 飞刀（`src/agent-tools/subagent-escalate.mjs:197`；async 面 `subagent-escalate-async.mjs:131`）· 会诊（`src/agent-tools/consult.mjs:310`） |
| F4 | 拒绝返回部分成果 | 拒绝 / headless / 无法续跑 → 部分成果 + turn-cap 标记（终态文本「work may be partial」——报告据此判定「撞墙中断、工作可能不完整」） |
| F5 | 用户 Stop 优先 | 中止路径（`AbortError` / `signal.aborted`）始终优先于继续提示——不弹继续卡、不自动续跑 |
| F6 | 继续提示串行 | 按会话级队列串行（`continueQueue`——`src/agent-tools/consult.mjs`）——并行执行体同时撞墙不弹多个卡；后台 async 子代理永不弹卡（AUTO 自动续跑、否则降级 partial） |
| F7 | 编号跨段累计 | 逐轮编号（`turn n/max`）在续跑链内**跨段累计**（不重置、不倒退）——`turnFrame`（`src/agent/run-helpers.mjs:29`）+ `applyTurnFrame`（`:37`）；复位条件 = `!opts.resume` 且仅此一处（`src/agent.mjs:126`）；段间种子 `opts._turnSeqBase`（`:128`） |

## 3. 非功能性需求

| # | 维度 | 标准（含度量） |
|---|---|---|
| N1 | 继续次数不设上限 | 防卡死靠用户 Stop——无次数帽（`MAX_RESUMES` 已删除——源 = 本仓 `src/` 面零命中） |
| N2 | 预算可配 | `agent.maxTurns` / `agent.subagentTurns` / `agent.consultTurns`（config——默认 200 / 100 / 40） |
| N3 | 时钟语义 | 会诊继续 = 新预算 = 墙钟 watchdog 重置（`consultTimeoutMs` 默认 600000ms） |
| N4 | 显示 / 协议零改动（F7 附带） | 编号经既有回调与终态快照消费——桥消息字段零新增；webview 显示文件零改动（用例 T7 机械证明面） |
| N5 | 回归锁 | `test/turn-across-segments.test.mjs`（T1–T11）全绿 + 全量回归全绿 |

## 4. 范围边界（不做）

- 不建 live 头逐轮跳动（需桥通道——登记行保持开放；本项只修值语义）。
- 不改段内帽判定（`turn < maxTurns`）与 `ContinueError` 载荷 / 续跑循环结构。
- 不改继续提示文案（`Ran N turns (limit N)` 描述**本段**撞墙事件——非任务累计进度）。
- 不设继续次数上限（N1）。

## 5. 变更记录

- 2026-09-12：建档（需求树逐档成套轮 B13 建档实施 C 轮——异层者建档；内容 = 既有机制实况登记（含跨段累计编号），零新需求语义）。
