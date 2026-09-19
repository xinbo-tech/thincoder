# 撞轮数墙可继续（TURN-CAP-CONTINUE）· 需求

> 板块 = **Agent 循环 · 轮数预算耗尽后的续跑**（撞墙可继续）。
> 本档 = 该机制的**需求层权威**（F1–F7 / N1–N6 判定句）。
> 设计侧 = `docs/core/design/TURN-CAP-CONTINUE.md`（统一语义 / 四执行体 / 跨段累计编号 / 双端坐标）。
> 相邻需求档 = `docs/core/requirements/AGENT-LOOP.md`（主循环与子代理）。
> 建档：2026-09-15（**B 式迁移轮 · VSC 批 3**——`thincoder-vscode/docs/requirements/TURN-CAP-CONTINUE.md` 内容重建入基准层；
> 旧档原地一字不改、留作参照历史）。**CLI 侧同名需求档已对账并入**（2026-09-15 批 5——并入面 = F7 跨段累计编号 / N6 零机制改动 / N2 补注 / 分段显示边界；旧档留参照历史）。
> 实测口径 = **as-of 2026-09-15 实核**（仓根 = `thincoder/`）。

## 1. 总体定位

agent 撞上轮数上限时**不该丢掉已完成的工作**——可就地续跑（同一执行体、保留历史与改动），而不是重开一次任务。
续跑必须是**用户可控**的（拒绝时返回部分成果），且**次数不设上限**。

## 2. 功能性需求

| # | 需求 | 判定句（可机器验证） |
|---|---|---|
| **F1** | 统一语义 | 撞墙 = `runAgent` 耗尽 `maxTurns` 抛 `ContinueError`（VSC `thincoder-vscode/src/agent.mjs:36`（类）/ `:371`（抛点））；继续 = `resume:true` 重跑同一执行体 |
| **F2** | 续跑不重来 | 继续**不重新注入任务文本**、保留 history 与改动——`resume` 把子执行体的活 history 交回（VSC `thincoder-vscode/src/agent-tools/subagent-run.mjs:141`） |
| **F3** | 全执行体覆盖 | 四类执行体均有续跑分支：主 agent（`thincoder-vscode/src/extension/panel-chat.mjs` 回合循环）· 子 agent（`agent-tools/subagent-run.mjs:85`/`:175`）· 飞刀（`agent-tools/subagent-escalate.mjs:163`/`:197`；async 面 `subagent-escalate-async.mjs:76`——两档已退役·W12 删除集，现体 = 核 `thincoder-core/agent-tools/subagent-actions.mjs`）· 会诊（`agent-tools/consult.mjs:310`） （迁移期引文） |
| **F4** | 拒绝返回部分成果 | 拒绝 / headless / 无法续跑 → 部分成果 + turn-cap 标记（VSC `agent-tools/subagent-run.mjs:195`/`:199`，文本含 "work may be partial"）——报告据此判定「撞墙中断、工作可能不完整」 |
| **F5** | 用户 Stop 优先 | 中止路径（`AbortError` / `signal.aborted`）始终优先于继续提示——不弹继续卡、不自动续跑 |
| **F6** | 继续提示串行 | 按会话级队列串行（`continueQueue`——`thincoder-vscode/src/agent-tools/consult.mjs:319`）——并行执行体同时撞墙不弹多个卡；后台 async 子代理**永不弹卡**（engineering && AUTO 自动续跑，否则降级 partial） |
| **F7** | 编号跨段累计 | 触发回合帽续跑后，面向上层的逐轮编号**跨段累计为唯一单调序列**（不重置、不倒退）——展示口径 `turn n/max`：n = 链内累计已跑轮数，max = 累计已授予预算（段数 × 段预算）；双端同源（各端独立实现）（批 5 并入） |

## 3. 非功能性需求

| # | 维度 | 标准（含度量） |
|---|---|---|
| **N1** | 继续次数不设上限 | 防卡死靠用户 Stop——无次数帽（`MAX_RESUMES` 形态已移除——VSC 侧 `src/` 面零命中实核） |
| **N2** | 预算可配 | `agent.maxTurns` / `agent.subagentTurns` / `agent.consultTurns`（默认 200 / 100 / 40——单源 `thincoder-core/agent/helpers.mjs:24-25`）；explore 执行体走 `subagentTurns`（30 硬帽已移除，双端对齐）（批 5 并入） |
| **N3** | 时钟语义 | 会诊继续 = 新预算 = 墙钟 watchdog 重置（重挂点 VSC `agent-tools/consult.mjs:323-325`） |
| **N4** | 显示 / 协议零改动 | 编号经既有回调与终态快照消费——**桥消息字段零新增**；webview 显示文件零改动 |
| **N5** | 回归锁 | 跨段编号用例族（VSC `thincoder-vscode/test/turn-across-segments.test.mjs`）全绿 + 全量回归全绿；双端语义同源、**异载体**（VSC 种子经 `opts`、核侧同一 child 对象跨段 ⇒ 种子零作用） |
| **N6** | 零机制改动 | 段内帽判定（`turn < maxTurns`）与 `ContinueError` 抛点、续跑预算语义**零变化**——F7 只改展示 / 协议编号值（批 5 并入） |

## 4. 范围边界（不做）

- 不建 live 头逐轮跳动（需桥通道——登记保持开放；本项只修**值语义**）。
- 不改段内帽判定（`turn < maxTurns`）与 `ContinueError` 载荷 / 续跑循环结构。
- 不改继续提示文案（`Ran N turns (limit N)`）：描述**本段**撞墙事件（ContinueError 载荷 = 段预算），非任务累计进度。
- 不做分段显式显示（段号 + 段内号——`turn 30/100 · seg 2` 形态）：选型 = 跨段累计（协议字段零新增）（批 5 并入）。
- 不设继续次数上限（N1）。

## 5. 不并项与历史沿革

### 5.1 历史沿革（(d) 类——**不并**）

> 来源档 `thincoder-vscode/docs/requirements/TURN-CAP-CONTINUE.md`（VSC 产品需求档）——**原地保留作参照历史**（保留 ≠ 维护）。下列内容不并入本档：

| 旧档位置 | 内容 | 何故不并 |
|---|---|---|
| 旧档状态行（「现行（含跨段累计编号——已落）」） | 时点状态行 | 批次语境——现行态已入 §2–§3 |
| 旧档「定位」行内的实现行数注（`thincoder-vscode/src/agent.mjs`（388 行）等） | 时点行数注 | 时点坐标——现行坐标入各 F 判定句 |
| 旧档变更记录（2026-09-12 建档行） | 建档流水 | 本档自有变更记录 |

### 5.2 不并项登记（跨板块 / 一次性材料——**不并**，逐项登记）

| 旧档面 | 内容 | 何故不并（去向 / 触发） |
|---|---|---|
| 旧档「对位注记（与对端同名需求档语义同源）」 | 跨仓对位句 | 语义同源已由本档正文承载——不另立对位节 |
| 「需求树逐档成套轮」建档批次注 | 建档批序 | 一次性材料——归批次档 |
| CLI 侧同名需求档未迁面（**已销项**） | CLI 产品需求正文 | **已对账并入（2026-09-15 批 5）**——并入面 = F7 / N6 / N2 补注 / 分段显示边界；旧档留参照历史 |

## 变更记录

- 2026-09-15（**B 式迁移轮 · VSC 批 3**）：建档——`thincoder-vscode/docs/requirements/TURN-CAP-CONTINUE.md` 内容重建入基准层
  （旧档一字未改、原地作参照历史）；判定句坐标按现状实核改写（双端）；与设计档成对（N-b 镜像同名）。
- 2026-09-15（**B 式迁移轮 · CLI 批 5**）：`thincoder-cli/docs/requirements/TURN-CAP-CONTINUE.md` **对账并入**——新增 **F7 编号跨段累计** + **N6 零机制改动**；N2 补 explore 硬帽补注；§4 补分段显示边界；**并整 F3 重复行**（本档原含两行 F3——重复行移除，保留完整版）；§5.2「CLI 侧同名需求档未迁面」**销项**。
