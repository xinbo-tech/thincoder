# 撞轮数墙可继续（TURN-CAP-CONTINUE）· 需求

> 板块 = **Agent 循环 · 轮数预算耗尽后的续跑**（撞墙可继续）。
> 本档 = 该机制的**需求层权威**（**F1–F9 / N1–N6** 判定句）。
> 设计侧 = `docs/core/design/TURN-CAP-CONTINUE.md`（统一语义 / 四执行体 / 跨段累计编号 / 双端坐标）。
> 相邻需求档 = `docs/core/requirements/AGENT-LOOP.md`（主循环与子代理）。

## 1. 总体定位

agent 撞上轮数上限时**不该丢掉已完成的工作**——可就地续跑（同一执行体、保留历史与改动），而不是重开一次任务。
续跑必须是**用户可控**的（拒绝时返回部分成果），且**次数不设上限**。

## 2. 功能性需求

| # | 需求 | 判定句（可机器验证） |
|---|---|---|
| **F1** | 统一语义 | 撞墙 = `runAgent` 耗尽 `maxTurns` 抛 `ContinueError`（类 `thincoder-core/agent/helpers.mjs`（唯一实现；VSC `thincoder-vscode/src/agent.mjs:9` 只剩转口）/ 抛点 `thincoder-core/agent/turn-loop.mjs:316`）；继续 = `resume:true` 重跑同一执行体 |
| **F2** | 续跑不重来 | 继续**不重新注入任务文本**、保留 history 与改动——`resume` 把子执行体的活 history 交回（VSC `thincoder-vscode/src/agent-tools/subagent-run.mjs:141`） |
| **F3** | 全执行体覆盖 | 四类执行体均有续跑分支：主 agent（`thincoder-vscode/src/extension/panel-chat.mjs` 回合循环）· 子 agent（`agent-tools/subagent-run.mjs:85`/`:175`）· 飞刀（现体 = 核 `thincoder-core/agent-tools/subagent-actions.mjs`）· 会诊（`agent-tools/consult.mjs:310`） |
| **F4** | 拒绝返回部分成果 | 拒绝 / headless / 无法续跑 → 部分成果 + turn-cap 标记（VSC `agent-tools/subagent-run.mjs:195`/`:199`，文本含 "work may be partial"）——报告据此判定「撞墙中断、工作可能不完整」 |
| **F5** | 用户 Stop 优先 | 中止路径（`AbortError` / `signal.aborted`）始终优先于继续提示——不弹继续卡、不自动续跑 |
| **F6** | 继续提示串行 | 按会话级队列串行（`continueQueue`——`thincoder-vscode/src/agent-tools/consult.mjs:319`）——并行执行体同时撞墙不弹多个卡；后台 async 子代理**永不弹用户卡**——撞帽改走**父代理检查点**（F8）；无父代理 ⇒ 降级 partial |
| **F7** | 编号跨段累计 | 触发回合帽续跑后，面向上层的逐轮编号**跨段累计为唯一单调序列**（不重置、不倒退）——展示口径 `turn n/max`：n = 链内累计已跑轮数，max = 累计已授予预算（段数 × 段预算）；双端同源（各端独立实现） |
| **F8** | 撞帽即续期检查点（裁定 A） | 撞帽（`ContinueError`——核 `thincoder-core/agent.mjs:439`）**不再静默自动续期**：**异步族**（后台子代理 / 异步飞刀 / 会诊）⇒ **向父代理报请**（ask；答「续期」⇒ `resume:true` 重入 · 答「停」⇒ 部分成果 + turn-cap 标记）；**同步族**（阻塞子代理 / 同步飞刀）⇒ **用户卡路径保留**（父代理被本次调用阻塞 · 应答不可达）；depth-0 ⇒ 回用户；**AUTO 一律不再自动批准续期**（无人应答 ⇒ partial）；续期**留痕** = 累计轮次 / 段数可查；**撞帽检查 = 无条件**（**有无产出皆检查**——**不设零产出阈值**，裁定 D） |
| **F9** | 载入面自证（裁定 E） | **运行面**必须可自证：① **启动期一行诊断** = 记录当前 core 的**实体路径 + 版本**；② **打包面机检** = 扩展打包内 core 须含撞帽检查点接线（`checkpoint.mjs` + `subagent-run.mjs` 接线）——防「仓内已修、运行面仍旧」✗（实盘教训 = 安装面冻结旧构建 ⇒ 静默续段半天） |
| **F10** | 撞帽提示带累计 | 撞帽提示必须同时给出**本段轮数**与**链内累计轮数**，并删掉 `(limit …)` 括注（各可交互面同一信息集）。只报本段，用户判不出「已经转了 40 轮」还是「刚转 12 轮」，而继续 / 停的决断正好取决于这个量级；`(limit N)` 在撞帽面上恒等于本段轮数（`ContinueError(maxTurns)` 于循环跑满后抛出 ⇒ 同一个数说两遍；VSC / 桌面更印成无数字的断头句） |

## 3. 非功能性需求

| # | 维度 | 标准（含度量） |
|---|---|---|
| **N1** | 继续次数不设上限 | 防卡死靠用户 Stop——无次数帽（VSC 侧 `src/` 面零命中实核） |
| **N2** | 预算可配 | `agent.maxTurns` / `agent.subagentTurns` / `agent.consultTurns`（默认 200 / 100 / 40——其中 200 / 100 的单源 = `DEFAULT_MAX_TURNS` / `DEFAULT_SUBAGENT_TURNS`，`thincoder-core/agent/helpers.mjs`）；explore 执行体走 `subagentTurns`（双端对齐） |
| **N3** | 时钟语义 | 会诊继续 = 新预算 = 墙钟 watchdog 重置（重挂点 VSC `agent-tools/consult.mjs:323-325`） |
| **N4** | 显示 / 协议零改动 | 编号经既有回调与终态快照消费——**桥消息字段零新增**；webview 显示文件零改动 |
| **N5** | 回归锁 | 跨段编号用例族全绿 + 全量回归全绿；双端语义同源、**异载体**（VSC 种子经 `opts`、核侧同一 child 对象跨段 ⇒ 种子零作用） |
| **N6** | 零机制改动 | 段内帽判定（`turn < maxTurns`）与 `ContinueError` 抛点、续跑预算语义**零变化**——F7 只改展示 / 协议编号值 |

## 4. 范围边界（不做）

- 不建 live 头逐轮跳动（需桥通道——登记保持开放；本项只修**值语义**）。
- 不改段内帽判定（`turn < maxTurns`）与 `ContinueError` 载荷；**续期决策点改由检查点裁定**（F8）——续跑循环结构与 `resume` 语义不变。
- **无人值守的已知后果**（F8 接受）：无父代理 / 无人应答 ⇒ **停在段边界交付部分成果**（F4），不再无限续跑；脚本 / CI / headless 侧按此预期调整。
- 不做分段显式显示（段号 + 段内号——`turn 30/100 · seg 2` 形态）：选型 = 跨段累计（协议字段零新增）。
- 不设继续次数上限（N1）。
