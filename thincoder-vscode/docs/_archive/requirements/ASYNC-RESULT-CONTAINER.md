# ASYNC-RESULT-CONTAINER（async 结果容器统一）— 需求（VSC 仓）

> 板块：Agent 循环 · 异步子代理结果结算（池 accessor / pending 单容器 / settle 共享 helper / buildChildSignal）。本仓自持需求档（异层者建档；依据 = `ENGINEERING-MODE（本仓·需求）§1.3` F11）。
> 对位档：`ASYNC-RESULT-CONTAINER（CLI 仓·需求）§1`——语义同源、本端原文自持（不做逐字一致）；端差登记见本档 §4。
> 设计见 `ASYNC-RESULT-CONTAINER（本仓·设计）`；关联 = `AGENT-LOOP（本仓·需求）§9`（async 子代理保真面）。
> 实测口径 as-of 2026-09-12。

## 1. 总体需求

统一 async 子代理结果结算的**容器与记账逻辑**——消 settle 多处逐字重复 / pending 多族分叉 / done-in-pool 双表示 / 信号兜底抄，
统一为**池 accessor + pending 单容器 + role + settle 共享 helper + buildChildSignal**——每次加角色不再复制整段。

## 2. 功能性需求

| # | 需求 | 判定句（验收语义） | 范围边界（不做） |
|---|---|---|---|
| F-A1 | **池 accessor 吸收**：消费端统一经 `getAsyncPool(parent, role)` 访问池——本端双查询形态（history 载体优先、回落 agent 字段）由 accessor 吸收。证据 = `@thincoder/core/agent-tools/subagent-scheduler.mjs:49-51`（W13 已迁核收口——现体见批次档 §5） | 消费端统一走 accessor（调用点 = `subagent-actions.mjs:120/206/318/364` 等）；`history?._X ?? agent._X` 直查形态不再散落消费面 | 不合并双池（advisor 独立调度保留——accessor 只吸收差异） |
| F-A2 | **pending 单容器 + role**：全族统一 `history._pendingAsyncResults`（条目带 role；旧独立族废弃）；注入器按 role 分发；done-in-pool 统一表示（留池 done:true + pending 单容器；`_inPending` 防重复移交）。证据 = `@thincoder/core/agent-tools/async-settle.mjs:30-32` · `src/agent.mjs:66-74` · `src/extension/suspension.mjs:32-55`（W13 已迁核收口——现体见批次档 §5） | 单容器键在位；旧族名仅存注释（运行时零用）；挂起期 settle 全部停靠同一容器、消费一处清；回合尾 collect 单口径 | 不恢复多族容器；不改条目字段集（role 为分发唯一键） |
| F-A3 | **settle 共享 helper**：`settleAsyncEntry(parent, entry, opts)` 公共收尾单点（settleSeq / 日志三连 / cancelled 分支 / 挂起分流）；四族调用齐（subagent / advisor / escalate / consult）；族特有段 = 钩子注入（`onAccounting`）。证据 = `@thincoder/core/agent-tools/async-settle.mjs:125` · 调用点 = `advisor-async.mjs:330` / `consult.mjs:190` / `subagent-async.mjs:365` / `subagent-escalate-async.mjs:154`（W13 已迁核收口——现体见批次档 §5） | 四族 settle 回调统一调 helper（grep 四调用点）；公共收尾单点、无逐字重复；族特有段经 hook 注入（advisor = settleAdvisorRun 记账） | 不把族特有段并入 helper（hook 注入）；不删 hook 面 |
| F-A4 | **守卫统一**：settle 守卫统一为 `!parentAborted`（严格版——覆盖 ctx.signal 与条目 controller 中止）。证据 = `@thincoder/core/agent-tools/async-settle.mjs:76`（W13 已迁核收口——现体见批次档 §5） | 四族同守卫；aborted → 出池丢弃（中止清池不注入）；不再出现宽松守卫分支 | 不改中止清池语义（存活条目留池——`AGENT-LOOP（本仓·需求）§9` F-G4 同面） |
| F-A5 | **信号统一**：`buildChildSignal(ctx)` 吸收 `_sessionSignal ?? ctx.signal ?? null` 兜底；consult 补上（修一致性）。证据 = `@thincoder/core/agent-tools/async-settle.mjs:86`（W13 已迁核收口——现体见批次档 §5） | 四族 signal 来源同 helper；consult 缺 `ctx.signal` 时 `_sessionSignal` 兜底生效（用例面）；兜底抄不再散落 | 不改信号来源优先级；不新增第三来源 |
| F-A6 | **pending 注入与消化面**：settle 后条目经单容器注入（挂起期 settle → 容器 → digest；回合内 settle → 留池 done → 回合尾 collect）；`suspension` 侧计数 / 清理走单容器。证据 = `src/extension/suspension.mjs:32-55/259-317` · `src/agent/run-stages.mjs:272-275` | 挂起期 settle → 容器非空即触发消化轮；中止 → 容器清（不注入陈旧结果）；`pendingN` 计数 = 单容器长度 | 不改 digest 档位制（消费驱动）；不动中止清容器的「不注入」语义 |

## 3. 非功能性需求

| # | 维度 | 标准 | 度量方式 |
|---|---|---|---|
| N-A1 | 一致性 | 四族 settle 同守卫 / 同日志 / 同分流 / 同信号兜底 | `ASYNC-RESULT-CONTAINER（本仓·设计）§4` 验收逐条；用例 = `test/eng-settlement.test.mjs` / `test/integration/scenario-03-subagent-lifecycle.test.mjs` |
| N-A2 | 不合并池 | accessor 吸收 vs 合并池——不动调度逻辑（advisor 无队列独立调度保留） | 源码面（双池载体在位——`subagent-scheduler.mjs`） |
| N-A3 | 与 token 落盘不冲突 | `settleAdvisorRun` 保留为 advisor 族 hook（D1 落盘） | `test/eng-settlement.test.mjs`（advisor settle 组） |
| N-A4 | 双端语义一致 | 与对端同机制语义；各端独立实现 | 本档 §4 端差登记 |

## 4. 对位与端差登记（对位 = `ASYNC-RESULT-CONTAINER（CLI 仓·需求）§1`）

| 面 | 本端 | 端差（登记） |
|---|---|---|
| pending 族数（统一前） | 本端 5 族（含 advisor 独立族） | 对端 3 族——统一后两端同构单容器；差异已随统一消解 |
| 池载体 | 挂共享 history 数组 + alias（双查询——accessor 吸收） | 对端挂 `agent.*` 直查——载体差异经 accessor 吸收（语义同源） |
| helper 契约 | `settleAsyncEntry(parent, entry, { pool, onAccounting })`（`pendingFamily` 参数随单容器冗余已删除——源 = `@thincoder/core/agent-tools/async-settle.mjs`） | 两端同形（无差异） |
| 守卫 / 信号 / done 表示 | `!parentAborted` / `buildChildSignal` / 留池 done:true + `_inPending` | 语义同源（各端独立实现） |

## 5. 变更记录

- 2026-09-12：建档（需求树逐档成套轮 B13 建档实施 B 轮——异层者建档；内容 = 本端机制实况登记 + 端差登记；零新需求语义）。
