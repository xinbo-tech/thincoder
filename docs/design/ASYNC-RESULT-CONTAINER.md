# async 结果容器统一（CLI 端）

> 板块：Agent 循环 · 异步子代理结果结算。状态：**设计（待评审）**——2026-09-08 Top-8 #2 启动（STRUCTURE-DEBT 批 E+批 C 方向）。用户裁定 4 决策：池保留双池 accessor 吸收 / pending 单容器+role / 守卫统一 !parentAborted / consult 补 _sessionSignal 兜底。
> 背景：async 子代理结果 settle 记账在 subagent/advisor/escalate/consult **4 处逐字重复**（公共尾部/日志三连/cancelled/挂起分流）+ pending 三族分叉 + done-in-pool 三表示 + `_sessionSignal` 兜底抄 3 处（consult 无兜底）——最深状态债（每次加角色复制整段 settle）。token 根治（a7e78b0）只加落盘未统一 settle。
> 范围：CLI 端 async 结果容器统一（池/pending/settle helper/buildChildSignal）；VSC 同名对应（各自独立实现）。

## 1. 需求

### 总体
统一 async 子代理结果结算的**容器与记账逻辑**——消 4 处 settle 重复/3 族 pending 分叉/3 表示 done-in-pool/信号兜底抄，统一为**池 accessor + pending 单容器+role + settle 共享 helper + buildChildSignal**，每次加角色不再复制整段。

### 功能性需求
- **F1（池 accessor 吸收双池）**：消费端统一经 accessor（`getAsyncPool(role)`）访问池——底层保留 `_asyncSubagents`/`_asyncAdvisors` 双池（advisor 无队列独立调度），accessor 吸收差异。
- **F2（pending 单容器+role）**：3 族 pending（`_pendingAsyncResults`/`_pendingEscalateResults`/`_pendingConsultResults`）统一为**单容器 `_pendingAsyncResults`**，条目带 role 字段；
  consult 裸对象 `{id,role,report}` 升格为完整 entry 形态（同 subagent/advisor/escalate）。**done-in-pool 统一表示（评审 #4）**：留池 done:true + pending 单容器——`_inPending` 标记保留防重复移交（同 subagent/advisor/escalate 现语义）。
- **F3（settle 共享 helper）**：新建 `src/agent-tools/async-settle.mjs`——公共 settle 收尾（settleSeq/_settle/唤醒 waiter/日志三连/cancelled 分支/挂起分流）抽共享 helper `settleAsyncEntry(parent, entry, {pool, onAccounting})`（评审 #3——`pendingFamily` 参数删：单容器+role 后冗余，只需 `onAccounting` hook + entry.role）；
  族特有段（settleAdvisorRun 记账/classifyEscalateSettle/maybeRefillAsync）作 hook 注入。
- **F4（守卫统一）**：settle 守卫统一为 `!parentAborted`（escalate 严格版——覆盖 ctx.signal ∨ entry.controller aborted），替代 subagent 的 `!ctx.signal?.aborted`（漏 controller）。
- **F5（consult 补信号兜底）**：consult 补 `_sessionSignal` 兜底（同 subagent/advisor/escalate——修一致性 bug），统一 buildChildSignal。
- **F6（buildChildSignal）**：新建/扩展 helper 吸收 `_sessionSignal ?? ctx.signal ?? null` 兜底抄 3 处（subagent-run/advisor-async/escalate）+ consult 补上。

### 非功能性需求
- N1（一致性）——四族 settle 语义一致（同守卫/同日志/同分流/同信号兜底）。
- N2（改动最小）——accessor 吸收 vs 合并池、helper 抽取 vs 逐字重复——不合并池（不动调度逻辑）。
- N3（token 根治不冲突）——settleAdvisorRun（D1 落盘）保留为 advisor 族 hook，不与之冲突。
- N4（双端一致）——CLI/VSC 同机制语义各自实现。

## 2. 设计（CLI 端落地）

### 现状（explore 一手核实）
- **settle 重复 4 处**：公共尾部（settleSeq/_settle/唤醒 waiter）3 处逐字相同（subagent-run:230-232/advisor-async:450-452/escalate-async:294-296）；日志三连×3（ev:cancelled/child:done|error/ev:settled）；cancelled 分支×3；挂起分流×4（含 sweepSettledToPending 第 4 处）。
- **pending 3 族分叉**：`_pendingAsyncResults`（subagent+advisor 折叠共用）/ `_pendingEscalateResults`（escalate 独立）/ `_pendingConsultResults`（consult 裸对象非同构）。
- **done-in-pool 三表示**：留池 done:true + `_inPending` 标记 + pending 数组——消费靠两处扫描 `e.done`（run-stages:212-219/suspension-drive:147-148）。
- **守卫漂移**：subagent-run:210 `!ctx.signal?.aborted` vs escalate-async:279 `!parentAborted`（不等价）。
- **`_sessionSignal` 兜底抄 3 处**（subagent-run:99/advisor-async:389/escalate-async:171）+ consult 无兜底（:404-406）。
- **池 entry 已全带 role 标签**——统一高可行。

### D1 池 accessor 吸收双池
- 新建 accessor（如 `src/agent-tools/async-pool.mjs` 或并入 async-settle）：`getAsyncPool(parent, role)`——role="advisor" 返 `_asyncAdvisors`，其他返 `_asyncSubagents`。
- 消费端统一经 accessor（run-stages/suspension-drive/subagent-actions/subagent-scheduler/ops 等池访问点改 accessor）。
- 底层保留双池（不动调度逻辑——advisor 无队列）。

### D2 pending 单容器+role
- 统一为 `_pendingAsyncResults` 单容器，条目带 role 字段（已带——subagent/advisor/escalate/consult 池 entry 全有 role）。
- consult 裸对象升格：consult.mjs settle 时构造完整 entry（`{id, role:"consult", report, done:true, ...}`）替代裸 `{id, role, report}`。
- 消费端统一（agent.mjs:97-118 注入/suspension-drive:330-362 清理/run-stages:153-155 清理）——单容器一处清，不再逐族三段。
- escalate/consult 独立流删除（`_pendingEscalateResults`/`_pendingConsultResults` 废弃）。

### D3 settle 共享 helper
- 新建 `src/agent-tools/async-settle.mjs`：`settleAsyncEntry(parent, entry, {pool, onAccounting})`（评审 #1——签名与 F3 一致：`pendingFamily` 参数删，单容器+role 后冗余）——公共收尾：
  - settleSeq 递增 + entry._settle() + 唤醒 waiter（公共尾部）
  - 日志三连（ev:cancelled/child:done|error/ev:settled）
  - cancelled 分支（delete + tombstone + ⟦ev⟧stopped + pushReal 提醒）
  - 挂起分流（pending push + 池 delete + ⟦ev⟧settled/done——统一守卫 `!parentAborted`）
  - 族特有 hook：`onAccounting`（advisor 调 settleAdvisorRun 记账——D1 落盘保留；escalate 调 classifyEscalateSettle——**maybeRefillAsync 从 onAccounting 移出——改公共尾部恒补
    （交付偏差 2026-09-08：design 把 refill 归入 onAccounting 仅 settled 分支——running 取消的 cancelled 分支将不再补位（挂起会话队列停滞）——修正为公共尾部恒补（subagent/escalate 族；advisor/consult 豁免——同 VSC `refill !== false` 语义——代码内附偏差注 + 回归锁定测试）**）。
- 调用点改：subagent-run/advisor-async/escalate-async/consult settle 回调改调 `settleAsyncEntry`。

### D4 守卫统一
- settle 守卫统一为 `!parentAborted`（= `!(ctx.signal?.aborted || entry.controller?.signal?.aborted)`——escalate 严格版）。
- 替代 subagent-run:210 `!ctx.signal?.aborted`。

### D5 consult 补信号兜底
- consult.mjs:404-406 补 `parent._sessionSignal ?? ctx.signal ?? null`（同其他三族）。

### D6 buildChildSignal
- 新建/扩展 helper（如并入 async-settle 或独立）：`buildChildSignal(parent, ctx)`——吸收 `_sessionSignal ?? ctx.signal ?? null` 兜底。
- 替代 subagent-run:99/advisor-async:389/escalate-async:171 三处抄 + consult 补上。

## 3. 受影响文件（CLI，thincoder）

- 新建：`src/agent-tools/async-settle.mjs`（settle 共享 helper + buildChildSignal + 池 accessor——预估 ~150 行）
- 修改：`src/agent-tools/subagent-run.mjs`（~200 行，settle 改调 helper + 信号改 buildChildSignal——delta ~-30）、`src/agent-tools/advisor-async.mjs`（~490 行，settle 改调 helper + 信号改 buildChildSignal——delta ~-20）、
  `src/agent-tools/escalate-async.mjs`（~300 行，settle 改调 helper + 信号改 buildChildSignal——delta ~-20）、`src/agent-tools/consult.mjs`（~450 行，settle 升格完整 entry + 信号兜底 + 改调 helper——delta ~-10）、
  `src/agent.mjs`（~410 行，pending 消费单容器——delta ~-15）、`src/agent/run-stages.mjs`（~250 行，池 accessor + pending 清理单容器——delta ~-10）、`src/tui/suspension-drive.mjs`（~380 行，sweep 改调 helper + pending 清理单容器——delta ~-20）、
  `src/agent-tools/subagent-actions.mjs`（~500 行，池 accessor——delta ~+5，**>300 档位——拆分到 async-pool 子模块若跨 500**）、`src/agent-tools/subagent-scheduler.mjs`（~400 行，池 accessor——delta ~+5）、`src/agent-tools/subagent-async.mjs`（~450 行，pending 聚合单容器——delta ~-15）
- 文档：本设计 + README 地图登记 + AGENT-LOOP.md 子代理/async §（settle 统一机制记录）

## 4. 验收

AC1 = settle 记账单点（4 族 settle 回调改调 `settleAsyncEntry`，无逐字重复）；AC2 = pending 单容器+role（3 族统一为 `_pendingAsyncResults`，consult 升格完整 entry）；
AC3 = done-in-pool 统一表示（留池 done:true + pending 单容器——`_inPending` 标记保留防重复移交）；AC4 = 守卫统一 `!parentAborted`；
AC5 = `_sessionSignal` 兜底统一 buildChildSignal（consult 补上）；**AC6 = CLI/VSC 镜像锚在设计中逐字定稿（settle helper 契约/pending 容器字段/buildChildSignal 语义——供 VSC 面照抄，本批验证锚句一致；AGENT-LOOP.md 记录段锚句同属镜像锚范围——评审 #3）**。

## 测试用例表

| 用例 | 输入/场景 | 预期输出 | 对应 |
|---|---|---|---|
| 正常 settle | subagent/advisor/escalate/consult settle | 改调 `settleAsyncEntry`，公共收尾一致（settleSeq/日志/分流） | AC1 |
| 正常 pending 消费 | 挂起期 settle → pending → digest 注入 | 单容器 `_pendingAsyncResults`，条目带 role，消费一处清 | AC2 |
| 正常 done-in-pool | 回合内 settle → 留池 done:true → 回合尾 collect | 统一表示（done:true + pending 单容器） | AC3 |
| 边界 cancelled | settle 时 entry cancelled | cancelled 分支统一（delete+tombstone+⟦ev⟧stopped+提醒） | AC1 |
| 边界 挂起分流 | 挂起期 settle → pending push + 池 delete | 统一守卫 `!parentAborted`，分流一致 | AC4 |
| 边界 consult 信号 | consult settle 时 ctx.signal 缺失 | `_sessionSignal` 兜底生效（同其他三族） | AC5 |
| 错误 settle 落盘失败 | advisor settle 时 D1 persistEngTokens 失败 | settleAdvisorRun hook 保留，失败回滚（token 根治不冲突） | AC1/N3 |
| 一致性 | 四族 settle 对比 | 同守卫/同日志/同分流/同信号兜底 | N1 |

## 变更记录
- 2026-09-08：立项。Top-8 #2 async 结果容器统一（STRUCTURE-DEBT 批 E+批 C）——explore CLI 一手核实（settle 4 处重复/pending 3 族/done-in-pool 3 表示/信号兜底抄 3 处+consult 无兜底）+ 用户裁定 4 决策（池 accessor/pending 单容器+role/守卫统一 !parentAborted/consult 补信号兜底）。
- 2026-09-08：交付偏差记录——D3 maybeRefillAsync 从 onAccounting hook 移出改公共尾部恒补（design 归入 onAccounting 仅 settled 分支——running 取消的 cancelled 分支不再补位致挂起会话队列停滞——修正为公共尾部恒补，subagent/escalate 族；advisor/consult 豁免——同 VSC `refill !== false` 语义）；
  受影响文件表补 subagent-panel.mjs（§19.6 面板段拆分目标）/test/async-settle.test.mjs/ops.mjs 池访问点未改（不在受影响文件表——D1 正文提及——待下轮）；
  scheduler describeBlockers/detectStall/queueRunnable 直读池（域专属扫描，advisor 判定 🔵 非缺陷）
