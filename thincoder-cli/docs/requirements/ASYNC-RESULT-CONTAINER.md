# ASYNC-RESULT-CONTAINER — 需求

> 板块：async 结果容器统一（settle 共享 helper / pending 单容器 / role·池 accessor / buildChildSignal）。需求层文档（docs/requirements/）。
> 状态：已实现（VSC 同名对应）。
> 来源：2026-09-10 自 `../design/ASYNC-RESULT-CONTAINER.md` 抽取（需求层拆分批）——本档为需求权威；设计+测试见来源档。

## 1. 需求

### 总体
统一 async 子代理结果结算的**容器与记账逻辑**——消 4 处 settle 重复/3 族 pending 分叉/3 表示 done-in-pool/信号兜底抄，统一为**池 accessor + pending 单容器+role + settle 共享 helper + buildChildSignal**，每次加角色不再复制整段。

### 功能性需求
- **F1（池 accessor 吸收双池）**：消费端统一经 accessor（`getAsyncPool(role)`）访问池——底层保留 `_asyncSubagents`/`_asyncAdvisors` 双池（advisor 无队列独立调度），accessor 吸收差异。
- **F2（pending 单容器+role）**：3 族 pending（`_pendingAsyncResults`/`_pendingEscalateResults`/`_pendingConsultResults`）统一为**单容器 `_pendingAsyncResults`**，条目带 role 字段；
  consult 裸对象 `{id,role,report}` 升格为完整 entry 形态（同 subagent/advisor/escalate）。**done-in-pool 统一表示（评审 #4）**：留池 done:true + pending 单容器——`_inPending` 标记保留防重复移交（同 subagent/advisor/escalate 现语义）。
- **F3（settle 共享 helper）**：新建 `thincoder-core/agent-tools/async-settle.mjs`——公共 settle 收尾（settleSeq/_settle/唤醒 waiter/日志三连/cancelled 分支/挂起分流）抽共享 helper `settleAsyncEntry(parent, entry, {pool, onAccounting})`（评审 #3——`pendingFamily` 参数删：单容器+role 后冗余，只需 `onAccounting` hook + entry.role）；
  族特有段（settleAdvisorRun 记账/classifyEscalateSettle/maybeRefillAsync）作 hook 注入。
- **F4（守卫统一）**：settle 守卫统一为 `!parentAborted`（escalate 严格版——覆盖 ctx.signal ∨ entry.controller aborted），替代 subagent 的 `!ctx.signal?.aborted`（漏 controller）。
- **F5（consult 补信号兜底）**：consult 补 `_sessionSignal` 兜底（同 subagent/advisor/escalate——修一致性 bug），统一 buildChildSignal。
- **F6（buildChildSignal）**：新建/扩展 helper 吸收 `_sessionSignal ?? ctx.signal ?? null` 兜底抄 3 处（subagent-run/advisor-async/escalate）+ consult 补上。

### 非功能性需求
- N1（一致性）——四族 settle 语义一致（同守卫/同日志/同分流/同信号兜底）。
- N2（实现面收敛）——accessor 吸收 vs 合并池、helper 抽取 vs 逐字重复——不合并池（不动调度逻辑）。
- N3（token 根治不冲突）——settleAdvisorRun（D1 落盘）保留为 advisor 族 hook，不与之冲突。
- N4（双端一致）——CLI/VSC 同机制语义各自实现。
