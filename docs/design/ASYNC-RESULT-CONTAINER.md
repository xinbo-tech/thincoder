# async 结果容器统一（VSC 端）

> 板块：Agent 循环 · 异步子代理结果结算。状态：**设计（待评审）**——2026-09-08 Top-8 #2 启动（STRUCTURE-DEBT 批 E+批 C 方向）。CLI 同名对应（ASYNC-RESULT-CONTAINER.md CLI 端）——同一机制各自独立实现。用户裁定 4 决策：池保留双池 accessor 吸收 / pending 单容器+role / 守卫统一 !parentAborted / consult 补 _sessionSignal 兜底。
> 背景：async 子代理结果 settle 记账在 subagent/advisor/escalate/consult **4 处逐字重复** + pending 5 族分叉（VSC `_pendingAdvisorResults` 独立）+ done-in-pool 双表示 + `_sessionSignal` 兜底抄 4 处——最深状态债。VSC token 根治（159a39f）只加落盘未统一 settle。
> 范围：VSC 端 async 结果容器统一（池/pending/settle helper/buildChildSignal）；CLI 同名对应（各自独立实现）。

## 1. 需求

### 总体
统一 async 子代理结果结算的**容器与记账逻辑**——消 4 处 settle 重复/5 族 pending 分叉/双表示 done-in-pool/信号兜底抄，统一为**池 accessor + pending 单容器+role + settle 共享 helper + buildChildSignal**。

### 功能性需求
- **F1（池 accessor 吸收）**：消费端统一经 accessor 访问池——VSC 池挂共享 history 数组 + alias（双查询 `history?._X ?? agent._X`），accessor 吸收差异。
- **F2（pending 单容器+role）**：5 族 pending（含 `_pendingAdvisorResults` 独立）统一为**单容器 `_pendingAsyncResults`**（评审 #3——容器名定稿），条目带 role 字段；consult 裸对象升格为完整 entry 形态（同 subagent/advisor/escalate）。**done-in-pool 统一表示（评审 #1）**：留池 done:true + pending 单容器——`_inPending` 标记保留防重复移交（同 subagent/advisor/escalate 现语义）。
- **F3（settle 共享 helper）**：新建 `src/agent-tools/async-settle.mjs`——公共 settle 收尾抽共享 helper；族特有段作 hook 注入。
- **F4（守卫统一）**：settle 守卫统一为 `!parentAborted`（严格版）。
- **F5（consult 补信号兜底）**：consult 补 `_sessionSignal` 兜底（修一致性 bug）。
- **F6（buildChildSignal）**：helper 吸收 `_sessionSignal ?? ctx.signal ?? null` 兜底抄 4 处。

### 非功能性需求
- N1（一致性）——四族 settle 语义一致。
- N2（改动最小）——accessor 吸收 vs 合并池。
- N3（token 根治不冲突）——settleAdvisorRun（D1 落盘）保留为 advisor 族 hook。
- N4（双端一致）——CLI/VSC 同机制语义各自实现。

## 2. 设计（VSC 端落地）

### 现状（explore 核实 + STRUCTURE-DEBT §4-#2）
- **settle 重复 4 处**：公共尾部/日志三连/cancelled/挂起分流逐字重复（subagent/advisor/escalate/consult）。
- **pending 5 族分叉**：`_pendingAsyncResults`/`_pendingAdvisorResults`（独立）/`_pendingEscalateResults`/`_pendingConsultResults` 等（VSC 比 CLI 多 advisor 独立族）。
- **done-in-pool 双表示**：`_doneInPool` 独立表示 + pending 数组。
- **`_sessionSignal` 兜底抄 4 处**（subagent/advisor/escalate/consult——VSC consult 也无兜底或抄法不同）。
- **池挂共享 history 数组 + alias**（双查询 `history?._X ?? agent._X`——与 CLI 挂 agent.* 不同）。

### D1 池 accessor 吸收
- 新建 accessor：`getAsyncPool(parent, role)`——吸收 VSC 双查询（`history?._X ?? agent._X`）差异。
- 消费端统一经 accessor。

### D2 pending 单容器+role
- 统一为单容器（如 `_pendingAsyncResults`），条目带 role；consult 升格完整 entry。
- 5 族统一（`_pendingAdvisorResults` 等独立族废弃）。
- 消费端统一（注入/清理单容器一处清）。

### D3 settle 共享 helper
- 新建 `src/agent-tools/async-settle.mjs`：`settleAsyncEntry(parent, entry, {pool, pendingFamily, onAccounting})`——公共收尾（settleSeq/日志三连/cancelled/挂起分流——统一守卫 `!parentAborted`）。
- 族特有 hook（advisor 调 settleAdvisorRun 记账——D1 落盘保留）。
- 调用点改：subagent/advisor/escalate/consult settle 回调改调 helper。

### D4 守卫统一
- settle 守卫统一为 `!parentAborted`（严格版）。

### D5 consult 补信号兜底
- consult 补 `_sessionSignal` 兜底（同其他三族）。

### D6 buildChildSignal
- helper 吸收 `_sessionSignal ?? ctx.signal ?? null` 兜底抄 4 处。

## 3. 受影响文件（VSC，thincoder-vscode）

- 新建：`src/agent-tools/async-settle.mjs`（settle 共享 helper + buildChildSignal + 池 accessor——预估 ~150 行）
- 修改：`src/agent-tools/subagent-async.mjs`（~450 行，settle 改调 helper + 信号改 buildChildSignal——delta ~-20）、`src/agent-tools/advisor-async.mjs`（~400 行，settle 改调 helper + 信号改 buildChildSignal——delta ~-20）、
  `src/agent-tools/escalate-async.mjs`（~250 行，settle 改调 helper + 信号改 buildChildSignal——delta ~-20）、`src/agent-tools/consult.mjs`（~300 行，settle 升格完整 entry + 信号兜底 + 改调 helper——delta ~-10）、
  `src/agent.mjs`（~200 行，pending 消费单容器——delta ~-15）、`src/agent/run-stages.mjs`（~300 行，池 accessor + pending 清理——delta ~-10）、`src/extension/suspension.mjs`（~350 行，sweep 改调 helper + pending 清理——delta ~-20）、
  `src/agent-tools/subagent-actions.mjs`（~400 行，池 accessor——delta ~+5）、`src/agent-tools/subagent-scheduler.mjs`（~350 行，池 accessor——delta ~+5）、**`src/agent-tools/subagent.mjs`（~500 行，buildChildSignal 吸收的 4 处兜底抄之一在 execute :240——D6 必需——delta ~+2）**
- 文档：本设计 + README 地图登记 + AGENT-LOOP.md 子代理/async §

## 4. 验收

AC1 = settle 记账单点（4 族 settle 回调改调 `settleAsyncEntry`，无逐字重复）；AC2 = pending 单容器+role（5 族统一为单容器，consult 升格完整 entry）；AC3 = done-in-pool 统一表示；AC4 = 守卫统一 `!parentAborted`；AC5 = `_sessionSignal` 兜底统一 buildChildSignal（consult 补上）；AC6 = 双端语义一致。

## 测试用例表

| 用例 | 输入/场景 | 预期输出 | 对应 |
|---|---|---|---|
| 正常 settle | subagent/advisor/escalate/consult settle | 改调 `settleAsyncEntry`，公共收尾一致 | AC1 |
| 正常 pending 消费 | 挂起期 settle → pending → digest 注入 | 单容器，条目带 role，消费一处清 | AC2 |
| 正常 done-in-pool | 回合内 settle → done → 回合尾 collect | 统一表示 | AC3 |
| 边界 cancelled | settle 时 entry cancelled | cancelled 分支统一 | AC1 |
| 边界 挂起分流 | 挂起期 settle → pending push + 池 delete | 统一守卫 `!parentAborted`，分流一致 | AC4 |
| 边界 consult 信号 | consult settle 时 ctx.signal 缺失 | `_sessionSignal` 兜底生效 | AC5 |
| 错误 settle 落盘失败 | advisor settle 时 D1 persist 失败 | settleAdvisorRun hook 保留，失败回滚 | AC1/N3 |
| 一致性 | 四族 settle 对比 | 同守卫/同日志/同分流/同信号兜底 | N1 |
| 双端一致 | CLI/VSC 镜像锚对照 | settle helper 契约/pending 容器字段/buildChildSignal 语义——锚句一致（CLI 端文档承接） | AC6 |

## 变更记录
- 2026-09-08：立项。Top-8 #2 async 结果容器统一——explore VSC 核实（settle 4 处重复/pending 5 族/done-in-pool 双表示/信号兜底抄 4 处）+ 用户裁定 4 决策（池 accessor/pending 单容器+role/守卫统一 !parentAborted/consult 补信号兜底）。
