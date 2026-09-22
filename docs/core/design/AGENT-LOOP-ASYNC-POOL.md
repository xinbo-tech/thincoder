# 后台异步池 · 挂起回合与 digest · 评审实例面（AGENT-LOOP-ASYNC-POOL）· 核心统一子系统档（拆分面）

> 归属 = `docs/core/design/AGENT-LOOP.md` 的**机制族拆分面**——「后台异步池 / 挂起回合与 digest / 评审实例面」族（2026-09-22 structure-debt 批 · 档面车道 · 自 `docs/core/design/AGENT-LOOP-SUBAGENT.md` 三分迁出）。
> 承载节 = §6.8（挂起回合与 digest）· §6.10（回合外事件后台化统一模型——分域池 + async advisor）· §6.11（后台评审池可观测 / 可控）· §6.18（评审对象锚）· §6.19（判定铁律 R1–R7）· §6.20（CLI 侧中止丢弃对称）。
> **节号沿用母档全局编号**——全仓既有指针**只改档名、不改节号**。
> 同三分面 = `docs/core/design/AGENT-LOOP-SUBAGENT.md`（子代理工具契约与装配面——§6.7 · §6.9 · §6.12 · §6.21–§6.26 · §6.28）；
> `docs/core/design/AGENT-LOOP-UPSTREAM.md`（子 → 父上行与唤醒面——§6.27 全族）。
> 母档 = `docs/core/design/AGENT-LOOP.md`（归属与范围 / 核模块裁决行 / 须用户裁条目 / 对外契约 / 受影响文件 / 主循环机制面 §6.1–§6.6 / 诊断与预算面 §6.13–§6.17 / 关键决策 / 沿革）。
> 工作流档 = `docs/core/design/CORE-UNIFICATION.md`；需求层 = `docs/core/requirements/AGENT-LOOP.md`（含 §4 需求条目面）。
> 建档 = 2026-09-22（structure-debt 批 · 台账 #67）：**段零改动**（迁出节逐字搬移、节号沿用）；三分前变更史 = `docs/core/design/AGENT-LOOP-SUBAGENT.md` 变更记录（历史归记录面）。

## 6.8 挂起回合与 digest（会话级后台双通道）

> 核内形态（状态机 / 载体契约 / 注入面 / 端特有面）见 `AGENT-LOOP.md` §2.3；本节 = 现行机制语义与端面分工。

- **回合尾语义**：回合尾**不再直注入排空**——done 条目留池（settled not consumed）→ `willSuspend`（`poolLive` 覆盖池非空）判 true → 进挂起态 → `sweepSettledToPending` → pending 非空 → digest 回合。**无 suspension 驱动的调用方**（headless / 直连 `runAgent`）保留回合尾直注入兜底（不丢结果）。多条目近邻完成 = **合并一轮消化**。
- **主会话 busy（processing 含 digest）提交 = 入单槽**：输入不禁（可打字回显），Enter 受理入 `pendingInput` **单槽**（至多一条待交接——普通回合与会话内 busy 同判据）；
  **吞面收敛四** = 模态 / 斜杠 / 空 / 槽满（逐条 = `docs/cli/design/TUI-INPUT-BOX.md` §4.1；反馈三态 = `docs/cli/design/TUI.md` §7.5；VSC 对位 = `docs/vsc/design/WEBVIEW-INPUT.md` §1 C-B2-6）；
  `state.queue` = 残项单容器（释放窗口兜底 / 中止残余——零丢失保留）；攒批（多槽）不引入。

**挂起状态机**：

| 状态 | 事件 | 动作 | 出口 |
|---|---|---|---|
| idle | 回合返回且池非空 | 置 `_suspended` → 挂起态 | → suspension |
| idle | 回合返回且池空 | 正常回 idle | 不变 |
| suspension | 池项 settle 且无 pendingInput | settle 入 `_pendingAsyncResults` → 开 auto-turn | auto-turn 期间仍挂起 |
| suspension | 用户 Enter（无 digest 在跑） | 新回合输入入 `pendingInput` 单槽 + 唤醒 | 回合末池空 → idle；非空 → 回 suspension |
| suspension | 用户 Enter（digest 在跑 = busy） | 入 `pendingInput` 单槽（受理——判据 = `docs/cli/design/TUI-INPUT-BOX.md` §4.1）；槽满 ⇒ 吞 + 提示 | auto-turn 结束后回挂起（该输入由 driver 步骤 1 优先消费开用户回合） |
| suspension | 释放窗口 / 槽满 Enter | 单槽交接（槽满吞 + 提示） | 不变 |
| auto-turn | 池项 settle（消化中） | settle 入 pending（不并发开新轮——单 `runAgent` 循环） | 轮末按 pending / 池态续开或退出 |
| auto-turn | 结束且池空 + 无 pendingInput | 补发 done 冻结 + 清 `_suspended` | → idle |
| auto-turn | 结束且 pending 非空 + 无 pendingInput | 立即续开合并消化轮（一次注入全部 pending） | → 新 auto-turn |
| auto-turn | 结束且池非空 | 回挂起等下一 settle | → suspension |
| auto-turn | 结束且有 pendingInput | 自动以该消息开新回合 | → 回合 |

**时序边界**：settle 与 `_suspended` 翻转竞态——`_suspended` 在 `runAgent` finally 返回后（交互层进入挂起前）置位；settle 回调读到的标志若为 false（回合刚结束瞬间）→ 按正常回合语义发 done 冻结（该块本就在流尾，无害）；门控以回调读取时刻为准（确定性，无锁需求）。

**digest 动作域（两档）**：

- **手动档**（无 AUTO——只做「信息整理」）：**允许**总结报告要点注入会话流、标记需决策点 + 写下建议（只写不执行）；**任务清单更新随模式**——普通模式允许（`task` 在场），工程模式不允许（F10：装配摘除 + 执行拒）；
  该轮域文本随模式取变体，工程模式的追踪权威面 = 批次档 + 台账（机制与文本单源 = `docs/core/design/TOOLS.md` §6.15.3）；**禁止**写文件 / 改代码、执行类工具（bash / execute / verify）、spawn 一切子代理（async + 同步——**机械拒绝**，subagent 入口检查 `_inAutoTurn && !autoApprove`）。
- **AUTO 档**（`autoApprove` 开——与用户回合一致的全语义推进型）：读 / 写 / spawn / verify / 执行全开放；禁 spawn 的机械限制撤销（推进链终止 = 池空自然停 + 用户输入随时打断）；guard 与普通回合同款。
- **两档通用**：auto-turn 的 mutation 标记不随下轮 per-run 重置而丢（auto-turn 结束时 guard 字段合并保留 `_inheritedGuard`）→ 下一用户回合覆盖 auto-turn 期间改动（防静默漏验）。
- **权限**：手动档 auto-turn 不传 `onPermissionRequest` handler（无 handler 即 denied——不弹审批面板）；AUTO 档沿用 `autoApprove`；自省工具按只读 / 豁免分类放行（普通模式示例 = `task`；工程模式下 `task` 不在表且执行层机械拒——F10，机制见 `docs/core/design/TOOLS.md` §6.15.3）。
- **轮次上限**：auto-turn **不另设轮次预算**——统一用系统 `maxTurns`；成本护栏 = 手动档动作域 + 合并消化 + AUTO 责任转移。

**冻结门控 + 消化完成逐条回收**：

- **挂起态 settle 延迟冻结**：settle 时若处于挂起态 → 不发 `⟦ev⟧done`，区块头保持中间态（`done · awaiting digestion` 驻留面板）；正常回合内 settle 行为不变（完成即冻结）。
- **digest 消化完成即逐条补发冻结回收**（不等池空）：pending 条目注入后按 settle 锚点 splice 落位（冻结块位于其 digest 总览文本**之前**）；池空 freeze-out 仅兜底未消化残项。
- **settle 锚点 splice**：`sub._freezeAt` = settle 时刻流位置；多锚点按 `_freezeAt` **降序**冻结（splice 是绝对位置插入——先插小锚点会把大锚点目标后移一位）；>5000 行头裁切处按净位移校正锚点。

**挂起期 Ctrl+C 武装化（三态一致）**：processing / 挂起态首按 → `abort({ interrupt: true })` 无 message（停当前回合——**不清池**——提示「再按中止全部后台」）+ 武装 3s；3s 内二按 → 全停（清池 + 标记 + 唤醒）。二按检查提升到状态路由之前（两次按下之间状态会迁移）；中止后复位 `state._suspAborted`；残余 `pendingInput` 单槽消息转回 `state.queue`（单条——不静默丢）；回合启动解除 `exitArmed` 残留。

## 6.10 回合外事件后台化统一模型（分域池 + async advisor）

- **池容量**：`ASYNC_POOL_LIMITS = { engCoder: 4, other: 4 }`（默认）；角色域 = `role === "eng-coder"` → engCoder 池，其余（explore / plan / coder / sub）→ other 池。运行中计数按域分别记；队列补位按域腾槽。**跨域总量 8、同域仍 4**。
- **配置键**：`agent.poolLimits = { engCoder, other, advisor }`——subagent 两键运行期读 + 校验（正整数 ≥1，非法回退默认 4 / 4）；advisor 第三键由独立读取器消费（合法 ≥1 整数生效；非法 / 缺省回退 4）。变更下回合生效。配置面条目 = `docs/core/design/CONFIG.md` §6.1（本档不复制）。
- **async advisor（独立后台评审池）**：池 = `_asyncAdvisors`（复用 pending / digest / 注入 / 冻结机制；runner 包装 `runAdvisorReview`，不碰 subagent 管线）；容量默认 4——**超限语义（2026-09-16 批 8 修订）**：**异 scope** 发起 ⇒ **入队**（ack 含 `queued` + `position`，非 error——原「超限即拒、排队无意义」**撤**），槽释放按队首自动起跑；
  **同 scope** ⇒ 仍拒（依赖语义——文案含 scope 与指引）。队列复用子代理域既有排队语义（位置号 · 槽空起跑 · 取消出队 + 余位重编号），**不新造第二套队列**；`agent.poolLimits.advisor` 容量语义与默认值不变。
- **同 scope 并发守卫**：launch 判定两关独立——① 池容量（全局 running ≤ 生效上限）；② 同 scope（同 `reviewType` + scope 有 running 评审 → 拒；design scope = 文档集键 `docSetKey`；code = 单 `code` 线程 `openCodeRun`）。拒文案含 scope 语义与指引；`settled` 续跑语义不变。
  **排队交互（2026-09-16 批 8）**：守卫在**入队时**判定（同 scope ⇒ 拒；异 scope + 池满 ⇒ 入队）；**出队时复检**——若届时同 scope 已有 running 评审则**不启动、留队**（「同 scope 不并发」不变式保持）。**否决**「只在入队时判」——会让同 scope 的评审并跑。
- **排队面补充（2026-09-16 批 8 ED-4）**：① **队列上限 / TTL = 不新设**——沿用子代理域既有排队语义（取消 = 出队即释放）；
   ② **补位覆盖评审池**：settle / cancel 释放槽后按**队首**自动起跑——原补位循环「显式豁免 advisor」句**废**（`async-settle.mjs`；consult 面不变）；
   **终态守卫**同 §6.9 单点谓词（不启动已取消 / 已终态条目——评审队列补位同判）；
   ③ **取消 = 出队**：queued 评审取消 ⇒ 出队 + 余位 `position` 重编号 + 终态 cancelled（**无 abort / 无 controller**——从未 start）——详见 §6.11。
   ④ **队列载体**：`_asyncAdvisorQueue` 属**载体字段集**（`docs/core/design/AGENT-LOOP.md` §2.3——与 `_asyncQueue` 同列；VSC 形挂 depth-0 `history`）——
   出队 / 补位 / 排队刷新三个读面经**载体吸收**（`carrierField`）命中同一容器，**部分 parent（只携池 + `history`）下不得 no-op**（2026-09-17 af 批：VSC 合成 parent 下 dequeue no-op ⇒ 已取消评审被补位重启——台账 #21）。
- **工具语义**：advisor 加 `async: true`；**缺省 async**——仅 depth-0（depth>0 显式 async 拒 / 缺省恒同步）。发起返回 ack → 回合自然收尾 → 挂起态 → settle → digest。
- **UI 通道**：subagent 面板 + `role="advisor"` 伪角色（块 / ⏹ / 冻结全复用）；cancel = 定向 abort → cancelled settle（不入 pending、不入 token 槽、digest 提示「评审已取消——token 未签发」）。
- **settle 记账**：评审 settle 时（消化链首行注入前）——① **陈旧判定**（launch 后发生 `FILE_MUTATORS` ⇒ 基于旧状态 ⇒ 不置 `_calledAdvisorThisRun`、代码评审不签发 token，guard 仍推回发起新评审）；② 通过 → token 入槽 `_engDesignTokens` + 当场同步落盘权威台账；③ `_advisorRound` 改按 review 实例记（轮次仅作提示词衰减与显示——**无机械上限**）；④ guard 推回判定看后台评审是否已 settle 且非陈旧。
- **收敛状态 per-review 化**：`_advisorRuns: Map<reviewId, { round, priorOutput, stale }>`——`reviewId` = `designId`（设计评审）/ 随机 id（代码复核）；多评审并行隔离。
- **消化处置轮**：报告注入 → 模型消化（呈递发现 + 修复建议——不擅自动手）→ 用户逐项拍板 → 修正轮在 agent 回合内发起 round2（async 再启——round / prior 从 `_advisorRuns` 取）。
- **凭证机制**（designId / token：设计锚 / 同步 / 回显 / 登记 / 消费 / 校验）→ 属工程模式板，见 `docs/core/design/DESIGN-TOKEN-SETTLEMENT.md`（结算面）· `docs/core/design/ENG-TOKEN-BINDING.md`（生命周期 + 写权门禁）。

**受影响文件清单（R24a · 批 8 ED-4）**：

| 文件 | 当前行数 | 预计增量 | 说明 |
|---|---|---|---|
| `thincoder-core/agent-tools/advisor-async.mjs` | 357 | +22/−6 | `:15-28` 头注改句 + `:265-267` 池满分支 → 入队（返回 `queued` + `position`）；同 scope 分支**不动**；`cancelAsyncAdvisor:209-224` 排队条目取消分支（无 controller ⇒ 出队 helper + 余位重编号）——≈+4 |
| `thincoder-core/agent-tools/async-settle.mjs` | 280 | +2/−2 | `:274-278` 补位豁免面收窄（advisor 纳入补位；consult 保持豁免） |
| `thincoder-core/agent-tools/async-discard.mjs` | 139 | +6 | 排队条目取消 = 出队 + 余项位置重编号 |
| `thincoder-core/agent-tools/subagent-scheduler.mjs` | 398 | 0 | **复用**既有导出面（入队 / 位置重算 / 补位 / 排队块刷新）——不新造第二套队列 |
| `thincoder-core/test/advisor-pool-queue.test.mjs` | 新档 | +90 | 判据 1–5 用例宿主 |
| `thincoder-cli/test/config-pool.test.mjs` | 159 | ±15 | 池满两处断言改排队（`:70-83` / `:85-96`——异 scope 第 5 发 ⇒ 断 `queued` + `position`） |
| `thincoder-vscode/test/config-pool.test.mjs` | 201 | ±15 | 同族两处（`:90-97` / `:99-105`） |

> 行数口径与值 = 批次档 §2.4 表**逐字一致**（as-of 2026-09-16）；越软线拆分面（`subagent-scheduler.mjs` 398）已在 §6.20.4 登记，不重复。

## 6.11 后台评审池可观测 / 可控（接入面补全）

1. **状态通道**：`subagent status` 读**两池并集**——子代理池 + 评审池（`getAsyncPool(agent, "advisor")`）；单查（带 id）先子代理池、未命中落评审池
   （两池共用 `nextSubagentId` 命名空间——id 全局唯一）；概览 `running` 行含 `role` / `model` / `elapsedSec` / `turn` / `maxTurns`（子代理）
   或 `reviewType` / `round` / `elapsedSec`（评审）；`done` 行带「已 settle 未消化」注记（走自动送达通道）；未命中两池 → 既有错误文案不变。
2. **等待口径**：`wait_for "advisor settled"` 判据 = **评审池无 running / queued 条目**（双载体：`agent._asyncAdvisors` ∪ `history._asyncAdvisors`）——与「未决评审判定」同源（`advisorReviewPending` / `advisorReviewInFlight`）；条件字面 / 超时 / 间隔语义零变。
3. **取消路由**：`subagent cancel <id>` 在子代理池未命中时**落评审池**——命中 running 评审 → `entry.cancelled = true` + `controller.abort()` + 机读线提醒（「评审已取消——token 未签发」）+ 幂等（重复取消返回同一确认）；
   命中 **queued** 评审 → **出队 + 余位 `position` 重编号** + 终态 cancelled（**无 abort / 无 controller**——从未 start；`wasStatus` 记 `queued`）+ 同款机读线提醒 + 幂等；未命中两池 / 已完成 → 既有错误文案。取消语义同 §6.10（不入 pending、不入 token 槽）。
   **队列取消收尾七面（2026-09-17 af 批逐轮收正——设计轮四〔机读线提醒 / 块面事件 / 不经 settle / 幂等与池面〕+ fix 轮二〔日志面 / 工具路径收口〕+ 二轮 fix 一〔端侧路径收口〕；原句只写「同款机读线提醒」，余面未逐字定）**：
   - **机读线提醒（逐字）**：与 running 面**同一条** `pushReal` 文案（模板源 = `thincoder-core/agent-tools/async-settle.mjs` cancelled 分支）——
     `[System reminder: async advisor review #<id> cancelled — the review did not settle; token not issued (评审已取消——token 未签发)]`；**不新造队列专用文案**（「同款」= 逐字同一条）。
   - **块面事件（逐字）**：出队即发 `⟦ev⟧cancelled`（零字段；relay 前缀 = `advisor#<id>/`）——TUI 侧「取消 / 出队 → 移除块（不冻结）」条文（`docs/cli/design/TUI.md` §6.8.2）的发射源；**不发 `⟦ev⟧stopped`**。
     **发射单源化（2026-09-18 设计评审轮 1 #1 裁定）**：queued 取消的 `⟦ev⟧cancelled` **唯一发射点 = 核 `cancelAsyncAdvisor` queued 分支**（`thincoder-core/agent-tools/advisor-async.mjs`）——
     该分支同时承担**机读线提醒（`pushReal`）**与**块面事件发射**两面（本节两队列表述同址同源）；发射经**调用方传入的 `onToken` 通道**（接口 = 可选第三形参 `cancelAsyncAdvisor(agent, id, onToken)`，缺省不就绪则不发射）。
     **全链三条调用路各传本层通道、均不另发**：工具路径（`executeCancelAction` 落池分支 · `ctx.callbacks?.onToken`）· CLI mouse ⏹ 直连（`thincoder-cli/src/tui/mouse.mjs` · 本地 `emit` = `routeSubToken` 就地路由）· VSC ⏹（经 `executeCancelAction` → `relaySubagentEventToken` 中继）——同一取消事件全链恰发射一次。
   - **不经 settle**：queued 取消**不走** `settleAsyncEntry`（从未 start ⇒ 无 run 链）⇒ 无 cancelled settle 分支、无 `⟦ev⟧stopped`（该冻结通道只属 running 取消）。
     ⇒ 任何「queued 取消会发 `⟦ev⟧stopped`」的推断**不成立**（台账 #31 第二跳——af 批探针实证：token 流仅 `⟦ev⟧cancelled`）。
   - **幂等与池面**：重复取消返回同一确认；出池 `map.delete(String(id))` + `cancelled` 墓碑（`writeTombstone`——载体吸收单点）与 running 面同形。
     **幂等面补注（2026-09-18 af 批 fix 轮 2 · 实施轮开口项 1 / 4 / 6 父侧裁定——三句定格，不新增面）**：
     ① **确认形状（逐字）**：首发（queued 命中出队返）= `{id, status:"cancelled", was:"queued"}`（`thincoder-core/agent-tools/advisor-async.mjs:255`）；重复取消（池未命中 → 读 cancelled 墓碑）= `{id, status:"cancelled"}`（**无 `was`**）——墓碑形状 `{status, role}` 单源不改，端侧 `was` 由中继合成（`thincoder-vscode/src/extension/panel-callbacks.mjs`）。
     ② **确认面外延（父侧裁定 = 接受并登记）**：墓碑读取**无面别**（判据 `tomb?.status === "cancelled" && tomb.role === "advisor"`——`thincoder-core/agent-tools/advisor-async.mjs:229`；
     两取消面同形写入——`thincoder-core/agent-tools/async-settle.mjs:229` / `thincoder-core/agent-tools/advisor-async.mjs:246`）⇒ **曾 running 取消、已 settle 出池**的 id 重复取消亦答同一确认（原 unknown-id error）。
     **不扩墓碑形状**（加面别字段破单源形状、成本更高）；早退在全部写点之前 ⇒ 零重复注入 / 发射 / 日志，副作用面零。
     ③ **跨 run 墓碑无区隔（登记）**：`_asyncTombstones` 随 VSC 载体跨 run 存活（`thincoder-vscode/src/agent.mjs:41`），而取号计数器 `_subAgentCounter` 不在载体字段集（取号 = `max(counter ?? 0, 活池 max) + 1`——`thincoder-core/agent-tools/subagent-scheduler.mjs:404-414`，两池皆空即从头取号）⇒ 旧 run 的 cancelled 号可在本 run 被重取（编号空间无跨 run 隔离）。
     于是本 run 池未命中时，陈旧 ⏹ / cancel 命中旧 run 墓碑 ⇒ 答 `cancelled`（零状态变更——非 unknown-id error）：**已知面、低影响——本批不修**（编号空间跨 run 隔离 = 另议）。
   - **日志面（2026-09-17 af 批 · F-6——逐字）**：queued 取消**不经 settle** ⇒ 不经 `settleAsyncEntry` cancelled 分支的 `ev:cancelled` ⇒ 出队点**直记一条**
     `logEvent("ev:cancelled", { id: "advisor#<id>" })`（与 running 面经 settle 记的事件名 / 字段同形；口径 = `docs/core/design/LOGGING.md` §6.2）。
     子代理族 queued 取消（`cancelAsyncSubagent`）同款直记（`id = "<role>#<id>"`）——两族写点各自一处，VSC 端同引核单点（零端差）。
   - **工具路径收口（2026-09-17 af 批 · F-3②）**：`executeCancelAction` 的 advisor 落池分支（`thincoder-core/agent-tools/subagent-async.mjs`）**不得早退跳过 TUI 维护**——
     queued 命中时把 `ctx.callbacks?.onToken` 传进核 queued 分支（**发射由该单点完成，本路径不另发**）+ 调 `refreshAdvisorQueuedTokens`（余位重编号刷新）；
     **不补位**（槽从未被占——§6.10 排队面补充 ③）、**不发** `⟦ev⟧stopped`。
   - **CLI mouse 直连路径（2026-09-18 评审轮 1 #1 实读定性——去重）**：`thincoder-cli/src/tui/mouse.mjs` 的 ⏹ 路由对评审族**直调** `cancelAsyncAdvisor`（不经 `executeCancelAction`），且在 `was === "queued"` 分支**自持发射** `⟦ev⟧cancelled`（as-of 2026-09-18 实读）。
     按单源化裁定**去重**：`emit` 上移并作为通道传进核调用（核调用形 = `cancelAsyncAdvisor(agent, id, emit)`）；自持发射行**加 `!isAdvisorBlock` 守卫**（共享行保留——子代理族自持发射面零改：该族两路互斥、各发一次；评审族由核单点经该通道发射，同一事件不重复发）；两路同通道同式（通道注入面 = mouse `emit` / 工具路径 `ctx.callbacks.onToken`）。
     running 命中不需要收尾（settle cancelled 分支 + 公共尾部补位已覆盖）。
   - **端侧路径收口（2026-09-17 af 批二轮 fix · F-11——VSC 对位形）**：VSC 扩展的 ⏹ 路由（`thincoder-vscode/src/extension/panel-messages.mjs` `cancelSubagent`）**不得按 role 分专用分支**——
     advisor 目标与子代理族**同经** `executeCancelAction`（合成 parent 携双池 + `history` + `_asyncQueue` + `config` / `autoApprove`；`callbacks.onToken` = `relaySubagentEventToken` 中继）。
     advisor **queued** 命中时：`⟦ev⟧cancelled` **经核单点发射**（relay 前缀 `advisor#<id>/`）→ `relaySubagentEventToken` 中继转 webview `subagent` `cancelled(was:"queued")` 协议消息（等待头移除）+ `refreshAdvisorQueuedTokens`（余位重编号）+ **不补位** + **不发** `⟦ev⟧stopped`；
     `was` 生产点 = **中继合成**（`thincoder-vscode/src/extension/panel-callbacks.mjs` 面 `relaySubagentEventToken`：`⟦ev⟧cancelled` → `cancelled` 协议消息；核 ack 的 `was` 字段不回传端侧）——中继档结构不变、本批零改。
     running 命中 ⇒ settle cancelled 分支的 `⟦ev⟧stopped` 同经中继（webview 评审块定格）——现形端侧**无 callbacks** ⇒ 两种命中皆零中继。
     **现形缺陷（`panel-messages.mjs:216-223`）**：advisor 分支**直调** `cancelAsyncAdvisor(...)` 后 `break`（无 callbacks / 无刷新）⇒ webview 评审等待头悬留（= F-3① 的端侧对位形）；该形**不得保留**（修法 = 删专用分支、并入共用路径——取消收尾单源）。
     端侧协议面登记 = `docs/vsc/design/WEBVIEW-PROTOCOL.md` §3 `cancelSubagent` 行（只登记端侧形态与回指，不重述机制）。
4. **动作面指引**：`observe` / `send` 遇 advisor id → 明确指引（指向 `action:'status'` 或提醒结果自动送达）；两动作**不为 advisor 开新能力**。
5. **工具描述**：`subagent` 工具描述 status / cancel 句补「后台评审（advisor）同面可查 / 可取消」（两端各自原文自持——语义同源）。

## 6.18 评审对象锚（并入 · 2026-09-15）

> 来源 = `thincoder-cli/docs/design/AGENT-LOOP.md` 旧 §12.1（一字未改，留参照历史）；本档 = 该面的活档承接（父侧调用面契约）。

评审调用注入**机械生成的对象声明**——消除评审员推断「评谁 / 为什么评」的纠结。父侧调用传 `object` 参数（`{type, target, status, reason, exclude}`——tool 参数为 JSON）→ 在评审 user 消息机械注入对象声明块——**每轮（round1 fresh + round2+ 复评）都注入**。定序：对象声明块 → 评审内容。

**对象声明块格式（逐字定稿——英文）**：

```
## Review-object declaration (mechanical — do not infer)
Review type: {type} | Target: {target} | Object state: {status} | Trigger: {reason}
Excluded (not in this review): {exclude}
Follow this declaration — do not infer the review target from the documents.
```

无 `object` 参数 → 降级现状（不注入不崩——旧调用兼容）。

**现状坐标（as-of 2026-09-15 实核）**：块生成 = `thincoder-core/advisor/messages.mjs:33` · 注入定序 = 同档 `:96`；round 2+ 定锚 = `thincoder-core/advisor.mjs:164`；tool 参数面 = `thincoder-core/agent-tools/advisor.mjs:71` / `:96`。

## 6.19 判定铁律（R1–R7）（并入 · 2026-09-15）

> 来源 = `thincoder-cli/docs/design/AGENT-LOOP.md` 旧 §12.2（一字未改，留参照历史）。**与 `docs/core/design/ADVISOR-CONVERGENCE.md` 正交**（该档管轮次衰减 / 收敛上限；本条管严重级怎么定）；冲突时以该档轮次表为准。
> 铁律块注入全部 4 模板（advisor-design / round1 / round2 / round3）——辅助判定不改变语义。来源标注（诚实——不假装权威）：「verified judgments, NOT absolute — continuously re-reviewed」（英文单向定稿——4 模板同句）。来源 = 样本 7 轮观察固化——持续复核。提示词正本 = `docs/core/design/prompts/advisor-*.md`。

**D-10.1 R1-R7 判定铁律（逐字定稿——中文稿；提示词层英文定稿）**：

- R1 文档状态/内容不一致（非机制描述冲突——区别于 Document ownership 维度）→ 🟡（报出即修——父侧文档层——不是🔴；**例外：同一机制两处不同描述 = Document ownership 🔴**——维持 advisor-design.md 约定——不降级）
- R2 实现偏离设计（验收未达/静默简化）→ 🔴（必须修）
- R3 裁定（挂债——如文件尺寸）→ 🟡/🔵 不升级（不重复纠结）
- R4 测试脆弱（墙钟/依赖序列化形态）→ 🔵 + 建议改确定性
- R5 范围协调（父侧待办）→ 🟡 "协调项"（不报缺陷）
- R6 测试缝——测试需 mock 内部工具集/慢工具——工具集由循环内硬编码获取（不可注入）→ 不要试 真实慢工具/FIFO/大文件（不确定）/观察 onTool（不足以区分）/mock LLM 返回真实工具（太快）——唯一路径 = 加测试 seam（setter 或参数 override + `??` 默认兜底——默认 null 生产零变化——测试 finally 恢复）——两端同法
- R7a 文档状态矛盾/跨文件滞后 → 🟡 报出不改（评审只读；机制级矛盾除外——见 R1 例外 =🔴）
- R7b 内容矛盾 → 设计层(D) > 需求层(F) > 记录(TODO)——较高层为准
- R7c 数字漂移/TODO 未勾销/文档卫生 → 🔵
- R7d 语义悬空 → 🟡 报设计缺口（父侧补）
- R7e 从不因文档状态矛盾卡"通过"——矛盾=🟡 报出即过（**机制级描述不一致除外 =🔴**——必须处理后才可过）
- R7f 引用清扫/旧名残留/文档卫生只约束活体文案（`docs/` 生效档 + 根级生效文档）；`_archive/` 历史快照不在判定面
- 来源：样本 7 轮——已验证判定——持续复核

## 6.20 CLI 侧中止丢弃对称（子代理 / 评审池）（2026-09-15 · 批 4 CLI-ASYNC-DISCARD）

> 需求侧 = `docs/core/requirements/AGENT-LOOP.md` §4.10；条目 F1–F4 / N1–N3 与批次档 `docs/batches/2026-09-15-cli-async-discard.md` §2 **三方一致**。
> 对侧基准 = `thincoder-vscode/src/agent-tools/async-discard.mjs`（126 行，第 35 批 §12 + §15 建）——本批**不改对侧**（D-AD7 另案登记）。

### 6.20.1 问题陈述与现状坐标（as-of 2026-09-15 实核）

CLI 侧中止分支**静默清池**：被清出的条目不留终态、无提醒、无事件——**丢弃墓碑状态与丢弃提醒文案**在 `thincoder-core/**` + `thincoder-cli/**` 全仓零命中（该词在核内另有 4 处出现，均为其他语义——`thincoder-core/agent.mjs:398` / `thincoder-core/tools/bash.mjs:158` / `thincoder-core/memory/code-sync.mjs:158` / `thincoder-core/prompts/discipline-normal.md:169`；
  CLI `src/**` 零出现、设计档另有 2 处同词（`thincoder-cli/docs/design/AGENT-LOOP.md:100` / `thincoder-cli/docs/design/TUI-TOOL-OUTPUT.md:43`，同属其他语义）——**评审轮 1 #8 收窄**）⇒ 模型只能猜「后台报告到底到没到」。

| 站点 | 坐标 | 现状 |
|---|---|---|
| 回合尾中止 | `thincoder-core/agent/run-stages.mjs:168-170` | `subPool?.clear(); advPool?.clear(); agent._asyncQueue = []` |
| 挂起会话中止 | `thincoder-cli/src/tui/suspension-drive.mjs:258-262` | 同上三行 |
| 挂起收尾（**不接线**） | `thincoder-core/agent/suspension.mjs:97-101` | `carrier._asyncSubagents?.clear(); _asyncAdvisors?.clear()` |

**第二处缺口（C-6 依赖终态判据）**：`thincoder-core/agent-tools/subagent-scheduler.mjs:124` 的 `depInfo` 以 `t.status === "cancelled" || t.status === "failed" ? t.status : "ok"` 判墓碑——**非 cancel/failed 的墓碑一律判 `ok`**。CLI 侧今日无 `discarded` 墓碑（该句 = 死分支）；本批落地后立即成为活路径 ⇒ 被丢弃的依赖目标被判「报告已到达」、依赖者照常启动（错误行为）。父侧 U1 裁：同批收口。

**收尾站③不接线的判据（父侧 U2 裁：接受）**：`finishSuspension`（`thincoder-core/agent/suspension.mjs:97-101`）是
`waitForSettleOrWake` 驱动的挂起会话收尾（`:208-220`），其形为 **carrier 形**（`_asyncSubagents` 挂在 carrier 上）——
该路径**无父 agent 注入目标**（无 `pushReal` 宿主 agent）——aborted 分支（`:98-107`）无任何注入通道（宿主注入器 `injectResidual` 仅非 aborted 分支消费，`:108-111`）；在此接线会把提醒写进 carrier 历史 = 语义扩张。
⇒ 登记为**已知残留**：该处仍为静默清池；若要对称须先定 carrier 注入目标（另批）。

**已知残留（consult 族）**：两接线点对 consult 族仍 `cleanupConsultSessions` 静默清场（无墓碑、无提醒——与对侧同形，边界 §6.20.8-4）；需求面（§4.10 F1–F4）只覆盖子代理 / 评审两池 ⇒ 本条不扩面；如需对称须先定 consult 的终态与提醒语义（另批——**评审轮 1 #7**）。

**族归属（escalate）**：两接线点按池作用（`getAsyncPool` 对 role ∉ {advisor, consult} 一律返 `_asyncSubagents`——`thincoder-core/agent-tools/async-settle.mjs:106`）⇒ escalate 族条目同被判丢弃、写 `discarded` 墓碑，并进入「background subagent(s) … re-spawn if the work is still needed」措辞的名单（`escalate#N`）——**与对侧同形（非端差）**。
措辞面留后者：该族属后台子代理语义，提醒文案如实承载；`docs/core/design/ESCALATE.md:86`「aborted → 出池丢弃」句只言出池、未言提醒 ⇒ 无互斥，随该档下次改动校准（档外，父侧判——**评审轮 3 #5 / 轮次 4 #5 / 实施轮落地**）。

### 6.20.2 方案选型对比

| # | 轴 | 候选方案 | 判据逐项评估 | 取舍（选定代价 / 权衡） | 结论（选定 / 否决理由） |
|---|---|---|---|---|---|
| 1 | 落点 | 新建 `thincoder-core/agent-tools/async-discard.mjs` | 职责内聚（丢弃 ≠ 结算）；核内单源、双壳可 import；形态与对侧同构（对侧已把守卫 / 池 accessor / 墓碑写点改指核单源，`thincoder-vscode/src/agent-tools/async-discard.mjs:32`） | 多一档（+~130 行） | **选定** |
| 2 | 落点 | 并入 `thincoder-core/agent-tools/async-settle.mjs` | 墓碑三函数已在该档；但该档 = 结算路径（279 行），并入 = 两职责混档 + ~400 行（越 300 软线） | 责任混淆 + 越软线 | 否决 |
| 3 | 落点 | CLI 侧直接 import 对侧实现 | 零新代码 | **依赖方向倒置**（核 / CLI 壳不得依赖 VSC 壳档；对侧档另 import VSC 私有 `../agent/run-helpers.mjs:33`） | 否决 |
| 4 | 依赖终态取值 | `discarded` 墓碑 → 既有 `cancelled` 口径 | 与「用户取消」同义（报告不会到达 + 非失败）：非 AUTO 依赖者 ⇒ depc（锁住等父处置，`subagent-scheduler.mjs:140-143`）、AUTO ⇒ 可启动（`:141`）；零新枚举、零消费者改动 | 墓碑 `status`（`discarded`）与 `depInfo.state`（`cancelled`）名不同形——须显式登记映射（D-AD2） | **选定** |
| 5 | 依赖终态取值 | 新增 `"discarded"` 状态值 | 名实相符 | 枚举扩散：`describeBlockers` / `detectStall`（`:205-212`）/ spawn 返形 / status 行 / 对侧用例全需同步 = 把「零新语义」变成新语义 | 否决 |
| 6 | 提醒注入点 | 核单点 `pushReal(parent, {role:"user", ...})` | 核内既有先例 = 取消提醒三处（`async-settle.mjs:231/236/246`，均 user 注入）；写两条线（机器线 + 人读线） | 与对侧现写法（`thincoder-vscode/src/agent-tools/async-discard.mjs:83` 直 `parent.history.push`）形不同、语义同——登记端差 D-AD8a | **选定** |
| 7 | 提醒注入点 | 逐字照对侧 `parent.history.push(...)` | 与对侧逐字同形 | 核内**绕过 `pushReal` 单点** ⇒ 人读线（`thincoder-core/context.mjs:184-194`）缺该条，与核内取消提醒先例不一致 | 否决 |
| 8 | 队列载体 `_asyncQueue` | 模块内剔除被丢弃 id + 存活条目 `position` 按 `1..n` 重编号（接线点原 `= []` 行删除；取消路径 `subagent-async.mjs:190` 同式） | 队列与池同源（`subagent-run.mjs:186` push 同一 entry 对象）；存活条目仍占池位 ⇒ 无差别清空抹掉其位置记录 | 模块新增一处写面（对侧无此形——核侧特有） | **选定** |
| 9 | 队列载体 | 保留原 `agent._asyncQueue = []` | 零改动 | 存活条目留池却丢队列位 ⇒ 池 / 队列不一致（面板与 status 的 queue position 面） | 否决 |

### 6.20.3 接口契约

**新档** `thincoder-core/agent-tools/async-discard.mjs`（预计 ~130 行；双导出 + 私有共享核，与对侧同构）：

- `discardAbortedPool(parent, ctx = null)` → `{ discarded: Array<{id, role, wasStatus: "running"|"queued"}>, kept: number }`
- `discardAbortedAdvisors(parent, ctx = null)` → `{ discarded: Array<{id, role: "advisor", reviewType, wasStatus: "running"|"queued"}>, kept: number }`
  （`"queued"` 面随 2026-09-16 批 8 ED-4——评审池排队语义引入；排队条目无 controller，丢弃判定 / 出队逻辑实现轮补）
- 私有 `discardRole(parent, spec, ctx)`：族差异（池键 / 摘要 / 列表词 / 文案 / 角色名）经 spec 注入。

**判定单点**（零新谓词）：`discardable(entry, ctx) = entry.done !== true ∧ entry.cancelled !== true ∧ parentAborted(ctx ?? {}, entry)`
——`parentAborted` 复用核单点（`thincoder-core/agent-tools/async-settle.mjs:130-134`，interrupt 豁免内建）。
**本批两接线点均不传 `ctx`** ⇒ 判据 = controller 支（`parentAborted(null, entry)`——与对侧有效判据同判：对侧 ctx 为死参，实走同一 controller 支；**消差收窄，理由见 D-AD6——评审轮 1 #3 / #4**）。
「controller 已中止 = 条目真死」由 `bindChildController` 单点保证（`:88-98` 双路：基信号已中止 ⇒ 立即 abort；未来中止 ⇒ 带活监听逐链传播；interrupt 不逐链）——两接线点的条目 controller 在各自中止触发时已被逐链中止。
`ctx` 保留为签名备用面（直调用例 / 对侧收敛时调用形合法）。

**动作序**：每条目 = `writeTombstone(parent, entry.id, "discarded", roleOf(entry))`（**载体吸收单点** = `async-settle.mjs:67-72`——父对象无自有 `_asyncTombstones` 而 `history` 有 ⇒ 借用同一 Map，不另建分叉）。
**禁用** `writeTombstoneTo(parent.history ?? parent, …)` 形——CLI 载体形（字段挂 agent）下会与读取面 `tombstoneOf`（`:75-78`，父对象优先）分叉、F4 的 `depInfo` 读不到（**评审轮 1 #1**）→ 出池（`map.delete(String(id))`）+ 队列剔除（存活条目 `position` 重编号——与取消路径 `subagent-async.mjs:190` 同式）→ 汇总；
整批（`discarded.length > 0` 才发生）= **一次** `pushReal(parent, { role: "user", content: reminder })` + **一条** `logEvent("ev:discarded", { n, ids })`；`n === 0` ⇒ 零注入、零事件（零噪音）。

**文案模板（verbatim 同源**，逐字源 = `thincoder-vscode/src/agent-tools/async-discard.mjs:37-44`；列表词 `:47`；族 spec `:90-105`；测试断关键子串不逐行断）：

```
[System reminder: ${n} background subagent(s) were discarded by the user's Stop — their reports will NOT arrive: ${list}. Partial changes from discarded children stay unmerged/unaudited; re-spawn if the work is still needed.]
[System reminder: ${n} background advisor review(s) were discarded by the user's Stop — their reports will NOT arrive: ${list}.\nNo design token was issued for a discarded design review; launch the review again if it is still needed.]
```

列表词：`queued` → `" (was queued — never started)"`；其余 → `" (was running)"`；评审族带 `(${reviewType})`。

**端差登记（本批三处：a / b 语义同源、可观察输出等价；c = 覆盖差异——登记 + 收敛方向）**：

- **D-AD8a 注入通道**：核 = `pushReal`（`thincoder-core/context.mjs:184-194`，写机器线 + 人读线），对侧 = 直 `parent.history.push`（`thincoder-vscode/src/agent-tools/async-discard.mjs:83`）。模型可见输出等价；核侧多写人读线（与 `async-settle.mjs:231` 先例同口径）。
- **D-AD8b 转义范围**：核 = 仅转义插值（沿 `async-settle.mjs:233/248` 先例；`escapeXml` 源 = `thincoder-core/agent/helpers.mjs:89`），对侧 = 整条文本转义（`thincoder-vscode/src/agent-tools/async-discard.mjs:83`）。文本骨架无 XML 特殊字符 ⇒ 输出等价。
- **D-AD8c status 回显面（评审轮 1 #5）**：对侧丢弃 id 经 `subagent status` 回显 `discarded`（`thincoder-vscode/src/agent/setup.mjs:226-227` 墓碑回读；对侧用例 T-D8 `thincoder-vscode/test/async-parity.test.mjs:293` · T-D13 `:436`）；
  CLI 侧除 `depInfo`（`thincoder-core/agent-tools/subagent-scheduler.mjs:123`）外零墓碑读取调用点（grep 实核）⇒ 丢弃 id 在 CLI 状态面报 unknown。
  **取舍**：本批不触碰 `subagent-actions.mjs`（488 行，贴 500 硬限——§6.20.8-3）——丢弃事实由整批提醒承载（模型可见面不缺）；**收敛方向 = 后续批**（status 墓碑回显与 `subagent-actions.mjs` 拆分同案，或并入 D-AD7 对侧收敛案）。

**接线点①** `thincoder-core/agent/run-stages.mjs:168-170`：三行（`subPool?.clear(); advPool?.clear(); agent._asyncQueue = []`）
→ `discardAbortedPool(agent)` + `discardAbortedAdvisors(agent)`（**不传 ctx**——判据 = controller 支，D-AD6；队列剔除由模块接管）。
`ev:stopped` 日志（`:166`）与 `cleanupConsultSessions` / pending 过滤（`:171-176`）**不变**。

**接线点②** `thincoder-cli/src/tui/suspension-drive.mjs:258-262`：`:260-262` 三行（同上）→
`discardAbortedPool(agent)` + `discardAbortedAdvisors(agent)`（**不传 ctx**；CLI 侧 import `@thincoder/core/agent-tools/async-discard.mjs`）。
`:248` 判据行（`aborted` 的 `_sessionAbort` 读取点**在** `:253` 置 null **之前**——既有写法已安全）与 `:252-254` 句柄释放**不变**；
会话 / 同回合子代的 controller 在 Stop 触发时已被逐链中止（key-handler 先 abort 全部会话 controller——`thincoder-cli/src/tui/key-handler.mjs:83`——此后才走本 `finally`）⇒ controller 支足判。
pending 清容器（`:266`）与既有序（consult 清场 `:267-268`、pendingInput 转 `state.queue` `:273-276`）**不变**。

**判据收口（C-6）** `thincoder-core/agent-tools/subagent-scheduler.mjs:124`：现式三态判前置一行
`const st0 = t.status === "discarded" ? "cancelled" : t.status`（或等价展开），三态判沿用。
**登记**：墓碑 `status`（`discarded`——账簿真实）与 `depInfo.state`（`cancelled`——依赖者处置口径）**名不同形**——
代码注释 + 本节说明；依赖者文案（`dependency cancelled`，`async-settle.mjs:248`）与 `describeBlockers` / `detectStall` **零改动**。

**数据流**：中止 → 逐条判定（controller 支）→ 墓碑（`_asyncTombstones` 跨 run 终态账本）→ 出池 + 队列剔除（含 `position` 重编号）→ 存活条目留池（其报告沿自动通道到达）→ 整批一次提醒 → `ev:discarded`。
**⟦ev⟧queued 面板块头残差**（评审轮 1 #12）：`refreshQueuedTokens`（`thincoder-core/agent-tools/subagent-scheduler.mjs:332-345`）需 `onToken` 回调，两接线点无回调可传 ⇒ 块头序号随**下一次队列事件**自然重发（其 sig 含活队列序号——变化即重发）；本批登记为显示面残差（status / 面板读数取活队列索引，不受影响）。

### 6.20.4 受影响文件清单（R24a）

| 文件 | 当前行数 | 预计增量 | 落点 |
|---|---|---|---|
| `thincoder-core/agent-tools/async-discard.mjs` | —（新建） | **138（实测）** | 单点实现（双导出 + 私有共享核） |
| `thincoder-core/agent/run-stages.mjs` | 244 → **246（实测）** | +3 / −3（含 import 行——净 ≈0） | 接线点① |
| `thincoder-cli/src/tui/suspension-drive.mjs` | 299 → **301（实测——已越 300 软线）** | +3 / −3（含 import 行——净 ≈0） | 接线点②（拆分计划保留——见下） |
| `thincoder-core/agent-tools/subagent-scheduler.mjs` | 394 → **398（实测）** | +2 / −1 | F4（既有越软线在案） |
| `thincoder-core/test/async-discard.test.mjs` | —（新建） | **234（实测）** | 单点用例（U1–U8） |
| `thincoder-core/test/async-family.test.mjs` | 177 → **225（实测）** | +~10 | F4 用例（U9 / U9b） |
| `thincoder-cli/test/input-lock.test.mjs` | 204 → **267（实测）** | +~30 | 接线点② 桩驱动用例（U10） |
| `thincoder-cli/test/integration/subagent-lifecycle.test.mjs` | 167 → **228（实测）** | +~45 | 业务可观察集成用例（I1） |
| `docs/core/design/AGENT-LOOP-SUBAGENT.md`（本档） | — | — | §6.20 + 变更记录 |
| `docs/core/requirements/AGENT-LOOP.md` | — | — | §4.10 |
| `docs/batches/2026-09-15-cli-async-discard.md` | —（各段追加，不计入增量） | — | §2 / §3 已落；§4–§6 由各作者追加 |

> 行数口径 = **内容行数**（`wc -l` 同口径；读取工具把文件尾换行渲染为空尾行 ⇒ 同文件显示值可 +1——计法差异非漂移）。本表行数为 **as-of 落笔实测**；批次档 §2 同名表为**落地前估算**——本档 / 需求档两行的估算值已由本表实测值取代；批次档行 = 各段追加（不计入增量）；其余行为预计。

**拆分计划（超档项）**：

- `thincoder-cli/src/tui/suspension-drive.mjs`（**301——已越 300 软线**）：候选拆分面 = `finally` 收尾块（清场 + 计数日志，`:246-266`）抽 `suspension-teardown.mjs`。**本批只登记不执行**（搬迁 ≠ 本批范围——避免夹带）。
- `thincoder-core/agent-tools/subagent-scheduler.mjs`（398——实测）：候选拆分面 = 依赖与等待态派生族（`depInfo` / `describeBlockers` / `detectStall`）抽 `subagent-deps.mjs`。本批只登记。
- **未触碰**：`thincoder-core/agent-tools/subagent-actions.mjs`（488，贴 500 硬限）、`async-settle.mjs`（279）。

### 6.20.5 关键决策记录

| # | 决策 | 备选与否决理由 |
|---|---|---|
| D-AD1 | 核内新档承载（对侧 = 核单源 import 者） | §6.20.2 轴一候选 1；候选 2 混档 / 候选 3 依赖倒置 |
| D-AD2 | `discarded` 墓碑 → `depInfo` 归 `cancelled` | 零新枚举、处置等价；名不同形须登记（防误读为语义丢失） |
| D-AD3 | 注入走核 `pushReal` | 沿核内取消提醒先例；端差 D-AD8a 登记 |
| D-AD4 | `_asyncQueue` 由模块接管剔除 | 队列与池同源；无差别清空抹掉存活条目的位置记录 |
| D-AD5 | 收尾站③（`finishSuspension`）不接线；consult 族两接线点清场不扩面 | carrier 形无注入目标；consult 无墓碑 / 提醒（与对侧同形）——均登记为已知残留（§6.20.1） |
| D-AD6 | 判据口径 = controller 支，两接线点均不传 ctx（**收窄消差**——两端同判） | 候选 1（否决）：显式 ctx.signal 支——会把**存活**子代（跨回合 / 会话外基信号）当死条目丢弃（= 对侧注释所述孤儿形态）；候选 2（选定）：`parentAborted(null, entry)` ⇒ controller 支——「controller 中止」= 条目真死（`bindChildController:88-98` 双路），与对侧有效判据同判。`ctx` 保留为签名备用面 |
| D-AD7 | 对侧重复实现**本批不收敛** | 落地后同机制两实现（核新档 + `thincoder-vscode/src/agent-tools/async-discard.mjs`）⇒ 后续应收敛为核单源 + 对侧改 import；**本批 VSC 零写入**（父侧 U3 另案登记）。**登记为已知重复**，非静默 |
| D-AD8 | 与对侧端差登记（a 注入通道 / b 转义范围 / c status 回显面） | 见 §6.20.3；a·b 可观察输出等价；c = CLI 无 status 墓碑回显面（覆盖差异——提醒面已承载信息，收敛方向已登记） |

### 6.20.6 用例表（正常 / 边界 / 错误）

| # | 用例 | 输入 | 期望输出 | 回指 |
|---|---|---|---|---|
| U1 | 正常·子代理族只清已死 | 池 [running-aborted, queued-aborted, done, cancelled]（两 -aborted 条目 controller 已中止；直调不传 ctx = 接线口径） | `discarded` = 2（wasStatus 各 running / queued）· `kept` = 2 · 两条 `discarded` 墓碑 · 存活条目仍在池与 `_asyncQueue` | F1 F2 |
| U2 | 正常·评审族 | 池 [running-aborted(advisor, reviewType="design"), done] | `discarded` = 1（带 reviewType）· `kept` = 1 · 提醒含 `No design token was issued` | F2 F3 |
| U3 | 边界·零丢弃（零噪音） | 池全 done / 空池（无条目 controller 中止——接线口径不传 ctx） | `{discarded: [], kept: n}` · **零注入** · **零事件** | F2 |
| U4 | 边界·载体缺失 | 池字段不存在（`getAsyncPool` 返 null） | 空结果、不抛 | F1 |
| U5 | 边界·interrupt 豁免 | `ctx.signal.reason.interrupt === true`（直调） | 零丢弃（与 `parentAborted` 单点同判） | F1 |
| U6 | 边界·队列剔除精确 | `_asyncQueue` = [丢弃 id, 存活 id] | 仅丢弃 id 被剔除；存活条目 `position` 按 `1..n` 重编号（与取消路径 `subagent-async.mjs:190` 同式） | F1 D-AD4 |
| U7 | 错误·条目形态残缺 | 条目 `{}`（缺 controller / id）；前提 = ctx 未中止（直调——接线口径不传 ctx） | 保守判不丢弃、不抛 | F1 |
| U8 | 提醒形态 | n = 2 | 注入**一条** user 消息；列表含 `(was queued — never started)` 与 `(was running)` 两词 | F2 N1 |
| U9 | 依赖终态（C-6） | 依赖目标墓碑 `discarded`（**夹具次序前提**：先经 `writeTombstone` 落一条父形态既有墓碑，复现「载体自有墓碑 Map 已存在」——否则「丢弃先写」次序下写 / 读同落 history 老 Map、用例假绿——评审轮 1 #1） | `depInfo` ≠ `ok`（= `cancelled`）；非 AUTO 依赖者 depc / AUTO 可启动；`failed` / `cancelled` 墓碑行为不变 | F4 |
| U9b | 边界·生产者绑定（F1↔F4） | 夹具：父形态墓碑已在（`writeTombstone` 写）+ `history` 在场；走生产入口 `discardAbortedPool` | 丢弃墓碑由接线入口产出、与读取面同容器可读（`tombstoneOf` / `depInfo`） | F1 F4 |
| U10 | 接线点②·挂起中止（桩驱动） | 桩驱动 `suspensionSession`（`thincoder-cli/test/input-lock.test.mjs:17` import），池含在飞 / 排队 / done 条目；父回合中止 | 已死条目出池 + `discarded` 墓碑 + 两族各一条提醒 / `ev:discarded`；存活条目留池 | F3 N2 |
| I1 | 集成·真管线中止 | 真调度器 + 脚本化 provider：父回合中止（signal abort），池含在飞子代理 | 父历史获一条提醒（关键子串）+ 一条 `ev:discarded`；已死条目出池、存活条目仍能结算注入 | F2 N2 |

**落点**：U1–U8 → `thincoder-core/test/async-discard.test.mjs:84-233`（新建）；U9 / U9b → `thincoder-core/test/async-family.test.mjs:110` / `:135`（扩）；
U10（接线点② 桩驱动）→ `thincoder-cli/test/input-lock.test.mjs:212`（扩）；
I1 → `thincoder-cli/test/integration/subagent-lifecycle.test.mjs:182`（扩）。
**I1 若在中止时序上不可稳定驱动 ⇒ 降级为桩面 + 如实登记**，不静默省略。

**测试层寿命分类**：I1 = 集成资产（常驻）；U1–U10 = 单元（开发期工具——批次收口逐条判：默认退役，除业务可观察 + 集成未覆盖 + 可稳定驱动三者全满足）。**断言语义 = 行为面**（池内容 / 墓碑状态 / 注入 / 事件计数 / 依赖终态），不做文档散文锚（寿命分类 → `docs/core/requirements/TESTING.md` §2；行为面禁令本体 → 同档 §5.2 F19）。

### 6.20.7 验收标准（逐条回指）

| # | 验收标准（可机检） | 回指 |
|---|---|---|
| A1 | 中止时已死条目出池 + 墓碑 `status = "discarded"`（role 正确）；存活条目与 done-in-pool 留池 | F1 |
| A2 | 提醒**恰好一次**（user 注入，含丢弃数 + 名单）；`ev:discarded` **恰好一条**；零丢弃 ⇒ 二者皆无 | F2 |
| A3 | 接线点①② 生效（中止路径产出 A1 / A2 结果）；`thincoder-core/agent/suspension.mjs` 零改动 | F3 |
| A4 | `depInfo` 对 `discarded` 墓碑不再返 `ok`；非 AUTO 依赖者 depc、AUTO 可启动 | F4 |
| A5 | 文案 / 动作序 / 事件名与对侧同源；判据口径 = controller 支（与对侧同判——D-AD6）；端差清单已登记（D-AD8a·b·c）· 重复实现登记（D-AD7） | N1 |
| A6 | 用例表逐条有对应断言；核用例入口 = `thincoder-core` 下 `node --test`（CI 同式 `.github/workflows/test.yml:36-46`——CLI 三命令不覆盖核用例）；`lint` / 各包 `npm test`（单入口）全绿 | N2 |
| A7 | 触碰源档 ≤500 硬限；越软线档在档内登记（含拆分计划） | N3 |

### 6.20.8 边界（本批不做）

1. VSC 侧零写入（`thincoder-vscode/**` 与 `thincoder-vscode/docs/**`）——对侧重复实现收敛（D-AD7）与装饰 / 悬空名退场 = 另案。
  **协调项**：对侧登记行 `thincoder-vscode/docs/design/AGENT-LOOP.md:751`（§12.8 #2——「CLI 面无丢弃提醒与丢弃终态记录 …（CLI 属他批/后续批）」）在本批落地后过时——该行更新归父侧另案（本批 VSC 零写入；§1 输入 #3 所载 `:740` 为旧坐标——评审轮 1 #6）。
2. 不接线收尾站③（`finishSuspension`）——判据见 §6.20.1（D-AD5）。
3. 不改 `subagent status` / 面板显示面，不新增 `discarded` 显示行（**端差与收敛方向 = D-AD8c**）；不触碰 `subagent-actions.mjs`（488 行）。
4. 不改 `_pendingAsyncResults` 停靠语义（done-in-pool 非丢弃目标——判据 `done !== true`）；不改 `cleanupConsultSessions` / consult 族清场。
5. 不改 cancel / failed 语义与文案；不新增枚举值；不改 `describeBlockers` / `detectStall`。
6. 不迁移搬档（拆分计划只登记不执行）。

## 变更记录

- 2026-09-22（**structure-debt 批 · 档面车道 · eng-designer**——承 `docs/batches/2026-09-22-structure-debt.md` §2.5 · 台账 #67）：**建档**——自 `docs/core/design/AGENT-LOOP-SUBAGENT.md` 三分迁出
  §6.8 · §6.10 · §6.11 · §6.18 · §6.19 · §6.20（**段零改动**——逐字搬移、节号沿用；全仓档面指针同批改指本档名）。
