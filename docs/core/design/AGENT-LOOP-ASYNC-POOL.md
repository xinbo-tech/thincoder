# 后台异步池 · 挂起回合与 digest · 评审实例面（AGENT-LOOP-ASYNC-POOL）· 核心统一子系统档（拆分面）

> 归属 = `docs/core/design/AGENT-LOOP.md` 的**机制族拆分面**——「后台异步池 / 挂起回合与 digest / 评审实例面」族。
> 承载节 = §6.8（挂起回合与 digest）· §6.10（回合外事件后台化统一模型——分域池 + async advisor）· §6.11（后台评审池可观测 / 可控）· §6.18（评审对象锚）· §6.19（判定铁律 R1–R7）· §6.20（CLI 侧中止丢弃对称）· §6.30（timer 到期自唤醒——空闲唤醒面）· §6.31（消化账务——投递 ≠ 销账）· §6.34（主会话异步投递与消化——两种时点）。
> **节号沿用母档全局编号**——全仓既有指针**只改档名、不改节号**。
> 同三分面 = `docs/core/design/AGENT-LOOP-SUBAGENT.md`（子代理工具契约与装配面——§6.7 · §6.9 · §6.12 · §6.21–§6.26 · §6.28）；
> `docs/core/design/AGENT-LOOP-UPSTREAM.md`（子 → 父上行与唤醒面——§6.27 全族）。
> 母档 = `docs/core/design/AGENT-LOOP.md`（归属与范围 / 核模块裁决行 / 须用户裁条目 / 对外契约 / 受影响文件 / 主循环机制面 §6.1–§6.6 / 诊断与预算面 §6.13–§6.17 / 关键决策 / 沿革）。
> 工作流档 = `docs/core/design/CORE-UNIFICATION.md`；需求层 = `docs/core/requirements/AGENT-LOOP.md`（含 §4 需求条目面）。
> **段零改动**（迁出节逐字搬移、节号沿用）；变更史与逐条流水 = git 提交（历史归记录面）。

## 6.8 挂起回合与 digest（会话级后台双通道）

> 核内形态（状态机 / 载体契约 / 注入面 / 端特有面）见 `AGENT-LOOP.md` §2.3；本节 = 现行机制语义与端面分工。

- **回合尾语义**：回合尾**不再直注入排空**——已结算条目留池（done-in-pool；settled not consumed——settle 事件面 = `⟦ev⟧settled`，见「冻结门控 + 消化完成逐条回收」条）→ `willSuspend`（`poolLive` 覆盖池非空）判 true → 进挂起态 → `sweepSettledToPending` → pending 非空 → digest 回合。**无 suspension 驱动的调用方**（headless / 直连 `runAgent`）保留回合尾直注入兜底（不丢结果）。
  **接入面**：端面 = CLI / VSC / 桌面**三端全接**（三端皆消费核件 `startSuspension`——端差只在装配面（carrier ∕ hooks / 输入缝）；桌面接入先例 = 2026-09-28 桌面空闲唤醒批）；「**无 suspension 驱动的调用方**」集收窄为 headless / 直连 `runAgent` / ACP 客户端驱动面，保留回合尾直注入兜底（不丢结果）。多条目近邻完成 = **合并一轮消化**。
- **主会话 busy（processing 含 digest）提交 = 入 `pendingInput` 队列**（**容量 8 条**——普通回合与会话内 busy 同判据）：输入不禁（可打字回显），Enter 受理入队；
  **吞面收敛四** = 模态 / 斜杠 / 空 / **队满（第 9 条 ⇒ 拒 + 提示 + 文本保留）**（逐条 = `docs/cli/design/TUI-INPUT-BOX.md` §4.1；反馈 = `docs/cli/design/TUI.md` §7.5；VSC 对位 = `docs/vsc/design/WEBVIEW-INPUT.md` §1 C-B2-6）；
  `state.queue` = 残项单容器（释放窗口兜底 / 中止残余——零丢失保留）。
- **合并消费（R15 攒批恢复）**：消费点按同一计划取数——连续非 `/` 条目攒批合并为**一条消息、一次回合**：
  单批 ≤ `MAX_MERGE_ITEMS`（8）条且合并文本 ≤ `MAX_MERGE_CHARS`（2000）字符（**核单源常量**）；超限截批先行（余下留待下批——不丢）；单条 > 2000 字符直发（不进批）；`/cmd` 逐条保序即时（不进合并缓冲）。
  形态 = 编号逐条（`你排队了 N 条消息：` + `1. …` + `——一次处理`）；**核单源 + 两端转口同一绑定**。

**步边界 pickup（用户 → 主会话投送通道）**：

- **通道语义（参照系 = 既有「主 agent → 子 agent」`subagent action:'send'`——参照非改造：send 侧代码 / 文档 / 行为零触碰）**：
  入队 → **下一 turn 边界消费**（**非中断**——当前工具先跑完）→ 按**普通用户指令**落历史。该行为契约在「用户 → 主会话」方向的**新增通道**（主会话侧原缺失）。
- **核侧落法（选型 = 复用核既有「回合边界投递」缝）**：`runAgent` opts 增**投递回调** `consumeQueuedInput`——与 `consumeInjected`（`thincoder-core/agent/turn-loop.mjs:87`）同址同族（循环头），落 `drainChildUpstream(agent)`（`:89`）之后（真实用户消息恒为 history 尾；三拆前 `thincoder-core/agent.mjs:233` ∕ `:235`）。
  回调**自持语义**（取批 / `pushReal` / 呈现——核只给缝、不给策略；同 `drainInjectedQueue` 形态）；空队列 no-op、缺省 `null`（headless / 直连 `runAgent` 零开销）。
  **复用面（核既有底层构件——零新增基础件）** = 循环头回合边界缝 + `pushReal` 历史写原语 + 「非中断 / 下一边界 / 普通 user 消息」语义契约。

  ④ 与 `send` 消费件合流（`drainInjectedQueue` 泛化）——**触碰 `send` 实现面 ⇒ 出射程**（登记上抛；**条件）**：统一需求出现 ∨ 两套「边界消费」逻辑确已漂移 ⇒ 另开批次评估——涉 `send` 机制面 ⇒ 先单拎用户请裁）；
- **适用面 = 用户回合（`autoTurn === false`）**：digest / 上行唤醒轮（系统驱动轮）**不参与**步边界 pickup——该轮域文本 = 整理域，且手动档机械门禁（无权限 handler ⇒ 写被拒；`_inAutoTurn && !autoApprove` ⇒ spawn 拒）会把用户指令降格
  ⇒ 系统轮消费点保持 driver 步骤 1（轮末，零改）；端侧传参面自带分流（autoTurn 轮不传回调）。
- **不中断语义（N2 同款）**：检查点 = 循环头——一步 = **一次 LLM 调用 + 其工具执行段**（`executeToolCalls` + `recordToolResults` 已完结）⇒ 在飞工具 / `signal` / 流式输出零触碰。
- **与 Ctrl+I 的区分（逐字）**：Ctrl+I = `abort({ interrupt: true, message })` ⇒ **中断当前回合**（在飞段立断）+ 注入 `[User interrupt: …]` + 外层重建 controller **续跑**（`AGENT-LOOP.md` §6.2）；
  本通道 = **零 abort / 零 `[User interrupt:]`** + 步边界以普通 user 消息落历史（**下一步生效**）。两通道并存、互不替代。
- **兜底面（三时机时间序）**：**步边界（主）** / **回合尾兜底**（队列在末步填充 ⇒ 本 run 无后续边界——既有 `thincoder-cli/src/tui/agent-turn.mjs` 队列续发）/ **驱动级**（挂起面无在飞用户回合——driver 步骤 1）。后两者零改。
- **三端**：CLI = `thincoder-cli/src/tui/queued-pickup.mjs` 闭包（取批 → `pushReal` → 回执 + `❯ You:` + 合并文本）；VSC = 核 opts `consumeQueuedInput` 回调（`thincoder-vscode/src/extension/panel-turn-loop.mjs`——`pickupQueuedAtStepBoundary`；消费点 = 核循环头——主循环取核后随主体归核）；
  **桌面** = 宿主单源队（`thincoder-desktop/src/main/queued-input.mjs`）+ `turn-face.mjs` 传 `consumeQueuedInput`（「回合中插入」批——附件条目留队 · 步边界让位；KD-40）。语义同源、各自实现。

**异步投递两时点**：主会话七径收敛——步边界 = 排队消息独占（即本通道）∥ 其余（子上行 ∥ 结算族 ∥ 工具返回 ∥ timer）= **交付轮轮首**（空闲面开启）；**提醒族** = 保持原时点——非本口径（§6.34.2 行 6）；机制单源 = §6.34。

**挂起状态机**：

| 状态 | 事件 | 动作 | 出口 |
|---|---|---|---|
| idle | 回合返回且池非空 | 置 `_suspended` → 挂起态 | → suspension |
| idle | 回合返回且池空 | 正常回 idle | 不变 |
| suspension | 池项 settle 且无 pendingInput | settle 入 `_pendingAsyncResults` → 开 auto-turn | auto-turn 期间仍挂起 |
| suspension | 用户 Enter（无 digest 在跑） | 新回合输入入 `pendingInput` 队列（容量内）+ 唤醒 | 回合末池空 → idle；非空 → 回 suspension |
| suspension | 用户 Enter（digest 在跑 = busy） | 入 `pendingInput` 队列（受理——判据 = `docs/cli/design/TUI-INPUT-BOX.md` §4.1）；队满 ⇒ 拒 + 提示 + 文本保留 | auto-turn 结束后回挂起（该输入由 driver 步骤 1 优先按合并计划消费） |
| suspension | 释放窗口 / 队满 Enter | 队列交接（队满拒 + 提示） | 不变 |
| auto-turn | 池项 settle（消化中） | settle 入 pending（不并发开新轮——单 `runAgent` 循环） | 轮末按 pending / 池态续开或退出 |
| auto-turn | 结束且池空 + 无 pendingInput | 补发 done 冻结 + 清 `_suspended` | → idle |
| auto-turn | 结束且 pending 非空 + 无 pendingInput | 立即续开合并消化轮（一次注入全部 pending） | → 新 auto-turn |
| auto-turn | 结束且池非空 | 回挂起等下一 settle | → suspension |
| auto-turn | 结束且有 pendingInput | 自动以该**合并消息**开新回合（计划 / 常量见上「合并消费」） | → 回合 |

**时序边界**：settle 与 `_suspended` 翻转竞态——`_suspended` 在 `runAgent` finally 返回后（交互层进入挂起前）置位；settle 回调读到的标志若为 false（回合刚结束瞬间）→ 发 `⟦ev⟧settled`（条目留池、冻结 ∕ 归档随消费窗——与挂起态同事件面，「冻结门控」条）；门控以回调读取时刻为准（确定性，无锁需求）。

**digest 动作域（两档）**：

- **手动档**（无 AUTO——只做「信息整理」）：**允许**总结报告要点注入会话流、标记需决策点 + 写下建议（只写不执行）；**任务清单更新随模式**——普通模式允许（`task` 在场），工程模式不允许（F10：装配摘除 + 执行拒）；
  该轮域文本随模式取变体，工程模式的追踪权威面 = 批次档 + 台账（机制与文本单源 = `docs/core/design/TOOLS.md` §6.15.3）；**禁止**写文件 / 改代码、执行类工具（bash / execute / verify）、spawn 一切子代理（async + 同步——**机械拒绝**，subagent 入口检查 `_inAutoTurn && !autoApprove`）。
- **AUTO 档**（`autoApprove` 开——与用户回合一致的全语义推进型）：读 / 写 / spawn / verify / 执行全开放；禁 spawn 的机械限制撤销（推进链终止 = 池空自然停 + 用户输入随时打断）；guard 与普通回合同款。
- **两档通用**：auto-turn 的 mutation 标记不随下轮 per-run 重置而丢（auto-turn 结束时 guard 字段合并保留 `_inheritedGuard`）→ 下一用户回合覆盖 auto-turn 期间改动（防静默漏验）。
- **权限**：手动档 auto-turn 不传 `onPermissionRequest` handler（无 handler 即 denied——不弹审批面板）；AUTO 档沿用 `autoApprove`；自省工具按只读 / 豁免分类放行（普通模式示例 = `task`；工程模式下 `task` 不在表且执行层机械拒——F10，机制见 `docs/core/design/TOOLS.md` §6.15.3）。
- **轮次上限**：auto-turn **不另设轮次预算**——统一用系统 `maxTurns`；成本护栏 = 手动档动作域 + 合并消化 + AUTO 责任转移。

**冻结门控 + 消化完成逐条回收**：

- **settle 延迟冻结（两态统一 · 块到达时点归位批 · #746）**：settle 一律发 `⟦ev⟧settled`（**挂起态 ∥ 非挂起态同**——`thincoder-core/agent-tools/async-settle.mjs:279`），区块头保持中间态——等待消化（`done · awaiting digestion`；仍在面板）；
  **`⟦ev⟧done` = 消费面补发**（起跑窗（主面）∥ `reclaim` ∥ 退出 freeze（兜底幂等）· 三端同形）——冻结 ∥ 归档恒落**投递时点**（起跑窗；块不于运行中回合中途入流——「块与轮同刻同邻」）；**投递 ≠ 销账**——销账（控制面）后移落**见账**时点（消化账务批 · 2026-10-05——判据 / 机制 = §6.31）；

  **settle 分流（pending ∕ 留池）不变**：挂起态 ⇒ 入 `_pendingAsyncResults` + 出池；非挂起态 ⇒ 留池 done-in-pool（回合尾直注入兜底 ∥ 挂起会话 sweep 两消费链照旧）。
- **consult 子块同族收齐**：consult 子块 settle 与全族同发 `⟦ev⟧settled`（`thincoder-core/agent-tools/consult.mjs` per-child 单点——区块驻留「done · awaiting digestion」）；
  `⟦ev⟧done` = 消费面补发（起跑窗（主面）∥ `reclaim` ∥ 退出 freeze（兜底幂等）· 三端同形——桌面 ∥ VSC = 起跑刻 `childIds` 逐子块补发；CLI = 起跑刻直接冻结（`reclaim` 径 = consumed 实参展开 `childIds` 子块，无事件补发））——冻结 ∥ 归档恒落投递时点（起跑窗——「S 不夹运行中回合」同判；销账面同 §6.31）。

  **取消径**：会话 stopped（consult_stop ∥ cleanup）⇒ 子块 settle 发 `⟦ev⟧stopped` 即折（消费永不来——与四族取消面同判）。**子块映射**：会话自持 `childIds`（= 子块 relay 号——块键形 `consult#<N>` 的 N；无块子块不入表），会话条目随 settle 携该表——消费窗三端展开同源。

  **消费判读（panel）**：`digested` 注记 ∥ `panelFreezeGate` 对 consult 子块按同判据（会话在跑 ∥ 会话条目在 pending ⇒ 未消化）——与回收 ∥ 补发判据同源。
- **digest 消化完成即逐条补发冻结回收**（不等池空）：本轮**离容器**（已销账 ∥ 已升级）条目按 settle 锚点 splice 落位（冻结块位于其 digest 总览文本**之前**——回收对象 = 见账结算产物，§6.31）；池空 freeze-out 仅兜底未消化残项。
- **settle 锚点 splice**：`sub._freezeAt` = settle 时刻流位置；多锚点按 `_freezeAt` **降序**冻结（splice 是绝对位置插入——先插小锚点会把大锚点目标后移一位）；>5000 行头裁切处按净位移校正锚点。

**挂起期 Ctrl+C 武装化（三态一致）**：processing / 挂起态首按 → `abort({ interrupt: true })` 无 message（停当前回合——**不清池**——提示「再按中止全部后台」）+ 武装 3s；3s 内二按 → 全停（清池 + 标记 + 唤醒）。二按检查提升到状态路由之前（两次按下之间状态会迁移）；中止后复位 `state._suspAborted`；残余 `pendingInput` 队列条目按合并计划转回 `state.queue`（不静默丢）；回合启动解除 `exitArmed` 残留。

## 6.10 回合外事件后台化统一模型（分域池 + async advisor）

- **池容量**：`ASYNC_POOL_LIMITS = { engCoder: 4, other: 4 }`（默认）；角色域 = `role === "eng-coder"` → engCoder 池，其余（explore / plan / coder / sub）→ other 池。运行中计数按域分别记；队列补位按域腾槽。**跨域总量 8、同域仍 4**。
- **配置键**：`agent.poolLimits = { engCoder, other, advisor }`——subagent 两键运行期读 + 校验（正整数 ≥1，非法回退默认 4 / 4）；advisor 第三键由独立读取器消费（合法 ≥1 整数生效；非法 / 缺省回退 4）。变更下回合生效。配置面条目 = `docs/core/design/CONFIG.md` §6.1（本档不复制）。
- **bg 任务池（第三域）**：`bash` 异步 ∥ 后台执行——新分域池 `_bgTasks`（照 `_asyncAdvisors` 模式：独立池 + 载体字段登记 + 条目 `{id, command, child, logPath, done, status, startedAt}`）；
  容量 `BG_TASK_MAX = 4`（对齐 `ASYNC_POOL_LIMITS` 单域 4；超限显式拒）；取号沿两池共用 `nextSubagentId` 命名空间（`bash#N` 前缀区分域）；settle ⇒ digest 注入单点族；收尾两档沿族口径（回合中断不杀 ∥ 会话中止逐条杀树 + 墓碑）。机制 / 接口契约 / 决策 = `docs/core/design/TOOLS.md` §6.19（D2——本节只登记池域）。
- **async advisor（独立后台评审池）**：池 = `_asyncAdvisors`（复用 pending / digest / 注入 / 冻结机制；runner 包装 `runAdvisorReview`，不碰 subagent 管线）；容量默认 4——**超限语义**：**异 scope** 发起 ⇒ **入队**（ack 含 `queued` + `position`，非 error——原「超限即拒、排队无意义」**撤**），槽释放按队首自动起跑；
  **同 scope** ⇒ 仍拒（依赖语义——文案含 scope 与指引）。队列复用子代理域既有排队语义（位置号 · 槽空起跑 · 取消出队 + 余位重编号），**不新造第二套队列**；`agent.poolLimits.advisor` 容量语义与默认值不变。
- **同 scope 并发守卫**：launch 判定两关独立——① 池容量（全局 running ≤ 生效上限）；② 同 scope（同 `reviewType` + scope 有 running 评审 → 拒；design scope = 文档集键 `docSetKey`；code = 单 `code` 线程 `openCodeRun`）。拒文案含 scope 语义与指引；`settled` 续跑语义不变。
  **排队交互**：守卫在**入队时**判定（同 scope ⇒ 拒；异 scope + 池满 ⇒ 入队）；**出队时复检**——若届时同 scope 已有 running 评审则**不启动、留队**（「同 scope 不并发」不变式保持）。**否决**「只在入队时判」——会让同 scope 的评审并跑。
- **排队面补充**：① **队列上限 / TTL = 不新设**——沿用子代理域既有排队语义（取消 = 出队即释放）；
   ② **补位覆盖评审池**：settle / cancel 释放槽后按**队首**自动起跑——原补位循环「显式豁免 advisor」句**废**（`async-settle.mjs`；consult 面不变）；
   **终态守卫**同 §6.9 单点谓词（不启动已取消 / 已终态条目——评审队列补位同判）；
   ③ **取消 = 出队**：queued 评审取消 ⇒ 出队 + 余位 `position` 重编号 + 终态 cancelled（**无 abort / 无 controller**——从未 start）——详见 §6.11。

   ④ **队列载体**：`_asyncAdvisorQueue` 属**载体字段集**（`docs/core/design/AGENT-LOOP.md` §2.3——与 `_asyncQueue` 同列；VSC 形挂 depth-0 `history`）——
   出队 / 补位 / 排队刷新三个读面经**载体吸收**（`carrierField`）命中同一容器，**部分 parent（只携池 + `history`）下不得 no-op**（2026-09-17 af 批：VSC 合成 parent 下 dequeue no-op ⇒ 已取消评审被补位重启）。
- **工具语义**：advisor 加 `async: true`；**缺省 async**——仅 depth-0（depth>0 显式 async 拒 / 缺省恒同步）。发起返回 ack → 回合自然收尾 → 挂起态 → settle → digest。
- **UI 通道**：subagent 面板 + `role="advisor"` 伪角色（块 / ⏹ / 冻结全复用）；cancel = 定向 abort → cancelled settle（不入 pending、不入 token 槽、digest 提示「评审已取消——token 未签发」）。
- **settle 记账**：评审 settle 时（消化链首行注入前）——① **陈旧判定**（launch 后发生 `FILE_MUTATORS` ⇒ 基于旧状态 ⇒ 不置 `_calledAdvisorThisRun`、代码评审不签发 token，guard 仍推回发起新评审）；② 通过 → token 入槽 `_engDesignTokens` + 当场同步落盘权威台账；③ `_advisorRound` 改按 review 实例记（轮次仅作提示词衰减与显示——**无机械上限**）；④ guard 推回判定看后台评审是否已 settle 且非陈旧。
- **收敛状态 per-review 化**：`_advisorRuns: Map<reviewId, { round, priorOutput, stale, historyAnchorIdx }>`——`reviewId` = `designId`（设计评审）/ 随机 id（代码复核）；多评审并行隔离。
- **构建期定域**：会话级镜像（`_advisorRound` ∥ `_lastAdvisorOutput` ∥ `_advisorResponseAnchor`）在**消费点**（消息构建前）按本评审实例定域——
  launch 与消息构建之间存在窗口（**排队评审的实际启动时点** ∥ 他场结算重写镜像 ∥ run 起点复位）——构建读他场镜像 = 串台（活体复现：排队设计评审构建出他场轮次与 prior）。
  定域单点 = `scopeAdvisorMirror`（叶档 `thincoder-core/agent-tools/review-facts.mjs`）——`resolveAdvisorLaunch`（launch 与构建同栈）∥ `entry.start`（排队经补位启动）双点同调。

  **投递水印**：`run.historyAnchorIdx` = 本评审结果对父可见（async = 投递单点 `injectAsyncResult`；sync = 工具结果提交点）时的 `history` 长度——轮 2+ 响应表取件下界（取件纪律单源 = `docs/core/design/ADVISOR-CONVERGENCE.md` §4.3）。
- **实例回收**：`_advisorRuns` 逐实例轻量化与回收——① **关闭点轻量化**：实例关闭（approval 关 ∥ `closeOpenCodeAdvisorRuns`）同拍 `priorOutput = null`（释放大串；closed 实例的 `priorOutput` 零消费面——续跑仅取 open）；
  ② **回收窗**：新实例创建时（`resolveAdvisorLaunch`）去重回收——design 面**同 `docSetKey` 保最新一条 closed**（F2h 的 `prior` 查找只取 newest——语义零变）、code 面 closed 实例清除（`openCodeRun` 仅取 open——零消费）；判据 = 会话内 Map 不随评审代数单调增（有界）。实现 = 实施轮。
- **消化处置轮**：报告注入 → 模型消化（呈递发现 + 修复建议——不擅自动手）→ 用户逐项拍板 → 修正轮在 agent 回合内发起 round2（async 再启——round / prior 从 `_advisorRuns` 取）。
- **凭证机制**（designId / token：设计锚 / 同步 / 回显 / 登记 / 消费 / 校验）→ 属工程模式板，见 `docs/core/design/DESIGN-TOKEN-SETTLEMENT.md`（结算面）· `docs/core/design/ENG-TOKEN-BINDING.md`（生命周期 + 写权门禁）。

**受影响文件清单（R24a · 批 8 ED-4）**：

| 文件 | 当前行数 | 预计增量 | 说明 |
|---|---|---|---|
| `thincoder-core/agent-tools/advisor-async.mjs` | 357 | +22/−6 | `:15-28` 头注改句 + `:265-267` 池满分支 → 入队（返回 `queued` + `position`）；同 scope 分支**不动**；`cancelAsyncAdvisor:209-224` 排队条目取消分支（无 controller ⇒ 出队 helper + 余位重编号）——≈+4 |
| `thincoder-core/agent-tools/async-settle.mjs` | 280 | +2/−2 | `:274-278` 补位豁免面收窄（advisor 纳入补位；consult 保持豁免） |
| `thincoder-core/agent-tools/async-discard.mjs` | 139 | +6 | 排队条目取消 = 出队 + 余项位置重编号 |
| `thincoder-core/agent-tools/subagent-scheduler.mjs` | 398 | 0 | **复用**既有导出面（入队 / 位置重算 / 补位 / 排队块刷新）——不新造第二套队列 |
| `thincoder-core/test/advisor-pool-queue.test.mjs` | 新档 | +90 | 判据 1–5 用例宿主  |
| `thincoder-cli/test/config-pool.test.mjs` | 159 | ±15 | 池满两处断言改排队（`:70-83` / `:85-96`——异 scope 第 5 发 ⇒ 断 `queued` + `position`）  |
| `thincoder-vscode/test/config-pool.test.mjs` | 201 | ±15 | 同族两处（`:90-97` / `:99-105`）  |

> 行数口径与值 = 本节表**逐字一致**。

## 6.11 后台评审池可观测 / 可控（接入面补全）

1. **状态通道**：`subagent status` 读**两池并集**——子代理池 + 评审池（`getAsyncPool(agent, "advisor")`）；单查（带 id）先子代理池、未命中落评审池
   （两池共用 `nextSubagentId` 命名空间——id 全局唯一）；概览 `running` 行含 `role` / `model` / `elapsedSec` / `turn` / `maxTurns`（子代理）

   或 `reviewType` / `round` / `elapsedSec`（评审）；`done` 行带「已 settle 未消化」注记（走自动送达通道）；**单查未命中双池 ⇒ 续查 pending / 升级账本**（消化账务批 · 2026-10-05——单查序 = 子代理池 → 评审池 → `_pendingAsyncResults`（已投递未判 / 重投中）→ `_unsettledDigests`（已升级）；**三处皆无 ⇒ 既有错误文案不变**；机制 = §6.31.6）。
2. **等待口径**：`wait_for "advisor settled"` 判据 = **评审池无 running / queued 条目**（双载体：`agent._asyncAdvisors` ∪ `history._asyncAdvisors`）——与「未决评审判定」同源（`advisorReviewPending` / `advisorReviewInFlight`）；条件字面 / 超时 / 间隔语义零变。
3. **取消路由**：`subagent cancel <id>` 在子代理池未命中时**落评审池**——命中 running 评审 → `entry.cancelled = true` + `controller.abort()` + 机读线提醒（「评审已取消——token 未签发」）+ 幂等（重复取消返回同一确认）；
   命中 **queued** 评审 → **出队 + 余位 `position` 重编号** + 终态 cancelled（**无 abort / 无 controller**——从未 start；`wasStatus` 记 `queued`）+ 同款机读线提醒 + 幂等；未命中两池 / 已完成 → 既有错误文案。取消语义同 §6.10（不入 pending、不入 token 槽）。

   **队列取消收尾七面（2026-09-17 af 批逐轮收正——设计轮四〔机读线提醒 / 块面事件 / 不经 settle / 幂等与池面〕+ fix 轮二〔日志面 / 工具路径收口〕+ 二轮 fix 一〔端侧路径收口〕；原句只写「同款机读线提醒」，余面未逐字定）**：
   - **机读线提醒（逐字）**：与 running 面**同一条** `pushReal` 文案（模板源 = `thincoder-core/agent-tools/async-settle.mjs` cancelled 分支）——
     `[System reminder: async advisor review #<id> cancelled — the review did not settle; token not issued (评审已取消——token 未签发)]`；**不新造队列专用文案**（「同款」= 逐字同一条）。
   - **块面事件（逐字）**：出队即发 `⟦ev⟧cancelled`（零字段；relay 前缀 = `advisor#<id>/`）——TUI 侧「取消 / 出队 → 移除块（不冻结）」条文（`docs/cli/design/TUI.md` §6.8.2）的发射源；**不发 `⟦ev⟧stopped`**。
     **发射单源化**：queued 取消的 `⟦ev⟧cancelled` **唯一发射点 = 核 `cancelAsyncAdvisor` queued 分支**（`thincoder-core/agent-tools/advisor-async.mjs`）——
     该分支同时承担**机读线提醒（`pushReal`）**与**块面事件发射**两面（本节两队列表述同址同源）；发射经**调用方传入的 `onToken` 通道**（接口 = 可选第三形参 `cancelAsyncAdvisor(agent, id, onToken)`，缺省不就绪则不发射）。

     **全链三条调用路各传本层通道、均不另发**：工具路径（`executeCancelAction` 落池分支 · `ctx.callbacks?.onToken`）· CLI mouse ⏹ 直连（`thincoder-cli/src/tui/mouse.mjs` · 本地 `emit` = `routeSubToken` 就地路由）· VSC ⏹（经 `executeCancelAction` → `relaySubagentEventToken` 中继）——同一取消事件全链恰发射一次。
   - **不经 settle**：queued 取消**不走** `settleAsyncEntry`（从未 start ⇒ 无 run 链）⇒ 无 cancelled settle 分支、无 `⟦ev⟧stopped`（该冻结通道只属 running 取消）。
     ⇒ 任何「queued 取消会发 `⟦ev⟧stopped`」的推断**不成立**（af 批探针实证：token 流仅 `⟦ev⟧cancelled`）。
   - **幂等与池面**：重复取消返回同一确认；出池 `map.delete(String(id))` + `cancelled` 墓碑（`writeTombstone`——载体吸收单点）与 running 面同形。
     **幂等面补注**：

     ① **确认形状（逐字）**：首发（queued 命中出队返）= `{id, status:"cancelled", was:"queued"}`（`thincoder-core/agent-tools/advisor-async.mjs:255`）；重复取消（池未命中 → 读 cancelled 墓碑）= `{id, status:"cancelled"}`（**无 `was`**）——墓碑形状 `{status, role}` 单源不改，端侧 `was` 由中继合成（`thincoder-vscode/src/extension/panel-callbacks.mjs`）。

     ② **确认面外延（父侧裁定 = 接受并登记）**：墓碑读取**无面别**（判据 `tomb?.status === "cancelled" && tomb.role === "advisor"`——`thincoder-core/agent-tools/advisor-async.mjs:229`；

     两取消面同形写入——`thincoder-core/agent-tools/async-settle.mjs:229` / `thincoder-core/agent-tools/advisor-async.mjs:246`）⇒ **曾 running 取消、已 settle 出池**的 id 重复取消亦答同一确认（原 unknown-id error）。

     **不扩墓碑形状**（加面别字段破单源形状、成本更高）；早退在全部写点之前 ⇒ 零重复注入 / 发射 / 日志，副作用面零。
     ③ **跨 run 墓碑无区隔（登记）**：`_asyncTombstones` 随 VSC 载体跨 run 存活（`thincoder-core/agent-tools/async-settle.mjs:74-79`），

     而取号计数器 `_subAgentCounter` 不在载体字段集（取号 = `max(counter ?? 0, 活池 max) + 1`——`thincoder-core/agent-tools/subagent-scheduler.mjs:404-414`，两池皆空即从头取号）⇒ 旧 run 的 cancelled 号可在本 run 被重取（编号空间无跨 run 隔离）。

     于是本 run 池未命中时，陈旧 ⏹ / cancel 命中旧 run 墓碑 ⇒ 答 `cancelled`（零状态变更——非 unknown-id error）：**已知面、低影响——不修**（编号空间跨 run 隔离 = 另议）。
   - **日志面（F-6——逐字）**：queued 取消**不经 settle** ⇒ 不经 `settleAsyncEntry` cancelled 分支的 `ev:cancelled` ⇒ 出队点**直记一条**
     `logEvent("ev:cancelled", { id: "advisor#<id>" })`（与 running 面经 settle 记的事件名 / 字段同形；口径 = `docs/core/design/LOGGING.md` §6.2）。
     子代理族 queued 取消（`cancelAsyncSubagent`）同款直记（`id = "<role>#<id>"`）——两族写点各自一处，VSC 端同引核单点（零端差）。
   - **工具路径收口（F-3②）**：`executeCancelAction` 的 advisor 落池分支（`thincoder-core/agent-tools/subagent-async.mjs`）**不得早退跳过 TUI 维护**——
     queued 命中时把 `ctx.callbacks?.onToken` 传进核 queued 分支（**发射由该单点完成，本路径不另发**）+ 调 `refreshAdvisorQueuedTokens`（余位重编号刷新）；
     **不补位**（槽从未被占——§6.10 排队面补充 ③）、**不发** `⟦ev⟧stopped`。
   - **CLI mouse 直连路径（去重）**：`thincoder-cli/src/tui/mouse.mjs` 的 ⏹ 路由对评审族**直调** `cancelAsyncAdvisor`（不经 `executeCancelAction`），且在 `was === "queued"` 分支**自持发射** `⟦ev⟧cancelled`（as-of 2026-09-18 实读）。
     按单源化裁定**去重**：`emit` 上移并作为通道传进核调用（核调用形 = `cancelAsyncAdvisor(agent, id, emit)`）；自持发射行**加 `!isAdvisorBlock` 守卫**（共享行保留——子代理族自持发射面零改：该族两路互斥、各发一次；评审族由核单点经该通道发射，同一事件不重复发）；两路同通道同式（通道注入面 = mouse `emit` / 工具路径 `ctx.callbacks.onToken`）。
     running 命中不需要收尾（settle cancelled 分支 + 公共尾部补位已覆盖）。
   - **端侧路径收口（F-11——VSC 对位形）**：VSC 扩展的 ⏹ 路由（`thincoder-vscode/src/extension/panel-messages.mjs` `cancelSubagent`）**不得按 role 分专用分支**——
     advisor 目标与子代理族**同经** `executeCancelAction`（合成 parent 携双池 + `history` + `_asyncQueue` + `config` / `autoApprove`；`callbacks.onToken` = `relaySubagentEventToken` 中继）。

     advisor **queued** 命中时：`⟦ev⟧cancelled` **经核单点发射**（relay 前缀 `advisor#<id>/`）→ `relaySubagentEventToken` 中继转 webview `subagent` `cancelled(was:"queued")` 协议消息（等待头移除）+ `refreshAdvisorQueuedTokens`（余位重编号）+ **不补位** + **不发** `⟦ev⟧stopped`；

     `was` 生产点 = **中继合成**（`thincoder-vscode/src/extension/panel-callbacks.mjs` 面 `relaySubagentEventToken`：`⟦ev⟧cancelled` → `cancelled` 协议消息；核 ack 的 `was` 字段不回传端侧）——中继档结构不变、零改。
     running 命中 ⇒ settle cancelled 分支的 `⟦ev⟧stopped` 同经中继（webview 评审块定格）——现形端侧**无 callbacks** ⇒ 两种命中皆零中继。

     **现形缺陷（`panel-messages.mjs:216-223`）**：advisor 分支**直调** `cancelAsyncAdvisor(...)` 后 `break`（无 callbacks / 无刷新）⇒ webview 评审等待头悬留（= F-3① 的端侧对位形）；该形**不得保留**（修法 = 删专用分支、并入共用路径——取消收尾单源）。
     端侧协议面登记 = `docs/vsc/design/WEBVIEW-PROTOCOL.md` §3 `cancelSubagent` 行（只登记端侧形态与回指，不重述机制）。
4. **动作面指引**：`observe` / `send` 遇 advisor id → 明确指引（指向 `action:'status'` 或提醒结果自动送达）；两动作**不为 advisor 开新能力**。
5. **工具描述**：`subagent` 工具描述 status / cancel 句补「后台评审（advisor）同面可查 / 可取消」（两端各自原文自持——语义同源）。

## 6.18 评审对象锚

> 来源 = `thincoder-cli/docs/_archive/design/AGENT-LOOP.md` 旧 §12.1（一字未改，留参照历史）；本档 = 该面的活档承接（父侧调用面契约）。

评审调用注入**机械生成的对象声明**——消除评审员推断「评谁 / 为什么评」的纠结。父侧调用传 `object` 参数（`{type, target, status, reason, exclude}`——tool 参数为 JSON）→ 在评审 user 消息机械注入对象声明块——**每轮（round1 fresh + round2+ 复评）都注入**。定序：对象声明块 → 评审内容。

**对象声明块格式（逐字定稿——英文）**：

```
## Review-object declaration (mechanical — do not infer)
Review type: {type} | Target: {target} | Object state: {status} | Trigger: {reason}
Excluded (not in this review): {exclude}
Follow this declaration — do not infer the review target from the documents.
```

无 `object` 参数 → 降级现状（不注入不崩——旧调用兼容）。

**现状坐标**：块生成 = `thincoder-core/advisor/messages.mjs:33` · 注入定序 = 同档 `:96`；round 2+ 定锚 = `thincoder-core/advisor.mjs:164`；tool 参数面 = `thincoder-core/agent-tools/advisor.mjs:71` / `:96`。

## 6.19 判定铁律（R1–R7）

> 来源 = `thincoder-cli/docs/_archive/design/AGENT-LOOP.md` 旧 §12.2（一字未改，留参照历史）。**与 `docs/core/design/ADVISOR-CONVERGENCE.md` 正交**（该档管轮次衰减 / 收敛上限；本条管严重级怎么定）；冲突时以该档轮次表为准。
> 铁律块注入全部 4 模板（advisor-design / round1 / round2 / round3）——辅助判定不改变语义。来源标注（诚实——不假装权威）：「verified judgments, NOT absolute — continuously re-reviewed」（英文单向定稿——4 模板同句）。来源 = 样本 7 轮观察固化——持续复核。提示词面 = `thincoder-core/prompts/advisor-*.md`（唯一副本）。

**D-10.1 R1-R7 判定铁律（逐字定稿——提示词层 `thincoder-core/prompts/`）**：

- R1 文档状态/内容不一致（非机制描述冲突——区别于 Document ownership 维度）→ 🟡（报出即修——父侧文档层——不是🔴；**例外：同一机制两处不同描述 = Document ownership 🔴**——维持 `thincoder-core/prompts/advisor-design.md` 约定——不降级）
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

## 6.20 CLI 侧中止丢弃对称（子代理 / 评审池）

> 需求侧 = `docs/core/requirements/AGENT-LOOP.md` §4.10；条目 F1–F4 / N1–N3 **与本节三方一致**。

### 6.20.2 方案选型对比

| # | 轴 | 候选方案 | 判据逐项评估 | 取舍（选定代价 / 权衡） | 结论（选定 / 否决理由） |
|---|---|---|---|---|---|
| 1 | 落点 | 新建 `thincoder-core/agent-tools/async-discard.mjs` | 职责内聚（丢弃 ≠ 结算）；核内单源、双壳可 import | 多一档（+~130 行） | **选定** |
| 2 | 落点 | 并入 `thincoder-core/agent-tools/async-settle.mjs` | 墓碑三函数已在该档；但该档 = 结算路径（279 行），并入 = 两职责混档 + ~400 行 | 责任混淆 | 否决 |
| 3 | 落点 | CLI 侧直接 import 对侧实现 | 零新代码 | **依赖方向倒置**（核 / CLI 壳不得依赖 VSC 壳档；对侧档另 import VSC 私有 `../agent/run-helpers.mjs:33`） | 否决 |
| 4 | 依赖终态取值 | `discarded` 墓碑 → 既有 `cancelled` 口径 | 与「用户取消」同义（报告不会到达 + 非失败）：非 AUTO 依赖者 ⇒ depc（锁住等父处置，`subagent-scheduler.mjs:140-143`）、AUTO ⇒ 可启动（`:141`）；零新枚举、零消费者改动 | 墓碑 `status`（`discarded`）与 `depInfo.state`（`cancelled`）名不同形——须显式登记映射（D-AD2） | **选定** |
| 5 | 依赖终态取值 | 新增 `"discarded"` 状态值 | 名实相符 | 枚举扩散：`describeBlockers` / `detectStall`（`:205-212`）/ spawn 返形 / status 行 / 对侧用例全需同步 = 把「零新语义」变成新语义 | 否决 |
| 6 | 提醒注入点 | 核单点 `pushReal(parent, {role:"user", ...})` | 核内既有先例 = 取消提醒三处（`async-settle.mjs:231/236/246`，均 user 注入）；写两条线（机器线 + 人读线） | 登记端差 D-AD8a | **选定** |
| 7 | 提醒注入点 | 逐字照对侧 `parent.history.push(...)` | 与对侧逐字同形 | 核内**绕过 `pushReal` 单点** ⇒ 人读线（`thincoder-core/context.mjs:184-194`）缺该条，与核内取消提醒先例不一致 | 否决 |
| 8 | 队列载体 `_asyncQueue` | 模块内剔除被丢弃 id + 存活条目 `position` 按 `1..n` 重编号（接线点原 `= []` 行删除；取消路径 `subagent-async.mjs:190` 同式） | 队列与池同源（`subagent-run.mjs:207` push 同一 entry 对象）；存活条目仍占池位 ⇒ 无差别清空抹掉其位置记录 | 模块新增一处写面（对侧无此形——核侧特有） | **选定** |
| 9 | 队列载体 | 保留原 `agent._asyncQueue = []` | 零改动 | 存活条目留池却丢队列位 ⇒ 池 / 队列不一致（面板与 status 的 queue position 面） | 否决 |

### 6.20.3 接口契约

**新档** `thincoder-core/agent-tools/async-discard.mjs`（预计 ~130 行；双导出 + 私有共享核，与对侧同构）：

- `discardAbortedPool(parent, ctx = null)` → `{ discarded: Array<{id, role, wasStatus: "running"|"queued"}>, kept: number }`
- `discardAbortedAdvisors(parent, ctx = null)` → `{ discarded: Array<{id, role: "advisor", reviewType, wasStatus: "running"|"queued"}>, kept: number }`
  （`"queued"` 面随 2026-09-16 批 8 ED-4——评审池排队语义引入；排队条目无 controller，丢弃判定 / 出队逻辑实现轮补）
- 私有 `discardRole(parent, spec, ctx)`：族差异（池键 / 摘要 / 列表词 / 文案 / 角色名）经 spec 注入。

**判定单点**（零新谓词）：`discardable(entry, ctx) = entry.done !== true ∧ entry.cancelled !== true ∧ parentAborted(ctx ?? {}, entry)`
——`parentAborted` 复用核单点（`thincoder-core/agent-tools/async-settle.mjs:130-134`，interrupt 豁免内建）。

**两接线点均不传 `ctx`** ⇒ 判据 = controller 支（`parentAborted(null, entry)`——与对侧有效判据同判：对侧 ctx 为死参，实走同一 controller 支；**消差收窄，理由见 D-AD6——评审轮 1 #3 / #4**）。
「controller 已中止 = 条目真死」由 `bindChildController` 单点保证（`:88-98` 双路：基信号已中止 ⇒ 立即 abort；未来中止 ⇒ 带活监听逐链传播；interrupt 不逐链）——两接线点的条目 controller 在各自中止触发时已被逐链中止。

`ctx` 保留为签名备用面（直调用例 / 对侧收敛时调用形合法）。

**动作序**：每条目 = `writeTombstone(parent, entry.id, "discarded", roleOf(entry))`（**载体吸收单点** = `async-settle.mjs:67-72`——父对象无自有 `_asyncTombstones` 而 `history` 有 ⇒ 借用同一 Map，不另建分叉）。

**禁用** `writeTombstoneTo(parent.history ?? parent, …)` 形——CLI 载体形（字段挂 agent）下会与读取面 `tombstoneOf`（`:75-78`，父对象优先）分叉、F4 的 `depInfo` 读不到（**评审轮 1 #1**）→ 出池（`map.delete(String(id))`）+ 队列剔除（存活条目 `position` 重编号——与取消路径 `subagent-async.mjs:190` 同式）→ 汇总；

整批（`discarded.length > 0` 才发生）= **一次** `pushReal(parent, { role: "user", content: reminder })` + **一条** `logEvent("ev:discarded", { n, ids })`；`n === 0` ⇒ 零注入、零事件（零噪音）。

**文案模板（verbatim 单源**，逐字源 = `thincoder-core/agent-tools/async-discard.mjs:50-57`；列表词 `:70`；族 spec `:127-145`；测试断关键子串不逐行断）：

```
[System reminder: ${n} background subagent(s) were discarded by the user's Stop — their reports will NOT arrive: ${list}. Partial changes from discarded children stay unmerged/unaudited; re-spawn if the work is still needed.]

[System reminder: ${n} background advisor review(s) were discarded by the user's Stop — their reports will NOT arrive: ${list}.\nNo design token was issued for a discarded design review; launch the review again if it is still needed.]
```

列表词：`queued` → `" (was queued — never started)"`；其余 → `" (was running)"`；评审族带 `(${reviewType})`。

**端差登记（三处：a / b 语义同源、可观察输出等价；c = 覆盖差异——登记 + 收敛方向）**：

- **D-AD8a 注入通道**：核 = `pushReal`（`thincoder-core/context.mjs:184-194`，写机器线 + 人读线）。模型可见输出等价；核侧多写人读线（与 `async-settle.mjs:231` 先例同口径）。
- **D-AD8b 转义范围**：核 = 仅转义插值（沿 `async-settle.mjs:244/259` 先例；`escapeXml` 源 = `thincoder-core/agent/helpers.mjs:121`）。文本骨架无 XML 特殊字符 ⇒ 输出等价。
- **D-AD8c status 回显面（评审轮 1 #5）**：对侧丢弃 id 经 `subagent status` 回显 `discarded`（`thincoder-vscode/src/agent/tool-table.mjs:94-96` 墓碑回读）
  CLI 侧除 `depInfo`（`thincoder-core/agent-tools/subagent-scheduler.mjs:123`）外零墓碑读取调用点（grep 实核）⇒ 丢弃 id 在 CLI 状态面报 unknown。
  **取舍**：不触碰 `subagent-actions.mjs`（488 行——§6.20.8-3）——丢弃事实由整批提醒承载（模型可见面不缺）；**收敛方向 = 后续批**（status 墓碑回显）。

**接线点①** `thincoder-core/agent/run-stages.mjs:168-170`（as-of 2026-09-29）：三行（`subPool?.clear(); advPool?.clear(); agent._asyncQueue = []`）

→ `discardAbortedPool(agent)` + `discardAbortedAdvisors(agent)`（**不传 ctx**——判据 = controller 支，D-AD6；队列剔除由模块接管）。
`ev:stopped` 日志（`:166`）与 `cleanupConsultSessions` / pending 过滤（`:171-176`）**不变**。

**接线点②** `thincoder-cli/src/tui/suspension-drive.mjs:258-262`：`:260-262` 三行（同上）→
`discardAbortedPool(agent)` + `discardAbortedAdvisors(agent)`（**不传 ctx**；CLI 侧 import `@thincoder/core/agent-tools/async-discard.mjs`）。

`:248` 判据行（`aborted` 的 `_sessionAbort` 读取点**在** `:253` 置 null **之前**——既有写法已安全）与 `:252-254` 句柄释放**不变**；

会话 / 同回合子代的 controller 在 Stop 触发时已被逐链中止（key-handler 先 abort 全部会话 controller——`thincoder-cli/src/tui/key-handler-ctrlc.mjs:42`——此后才走本 `finally`）⇒ controller 支足判。
pending 清容器（`:266`）与既有序（consult 清场 `:267-268`、pendingInput 转 `state.queue` `:273-276`）**不变**。

**判据收口（C-6）** `thincoder-core/agent-tools/subagent-scheduler.mjs:124`：现式三态判前置一行
`const st0 = t.status === "discarded" ? "cancelled" : t.status`（或等价展开），三态判沿用。

**登记**：墓碑 `status`（`discarded`——账簿真实）与 `depInfo.state`（`cancelled`——依赖者处置口径）**名不同形**——
代码注释 + 本节说明；依赖者文案（`dependency cancelled`，`async-settle.mjs:248`）与 `describeBlockers` / `detectStall` **零改动**。

**数据流**：中止 → 逐条判定（controller 支）→ 墓碑（`_asyncTombstones` 跨 run 终态账本）→ 出池 + 队列剔除（含 `position` 重编号）→ 存活条目留池（其报告沿自动通道到达）→ 整批一次提醒 → `ev:discarded`。

**⟦ev⟧queued 面板块头残差**（评审轮 1 #12）：`refreshQueuedTokens`（`thincoder-core/agent-tools/subagent-scheduler.mjs:346-362`）需 `onToken` 回调，两接线点无回调可传 ⇒ 块头序号随**下一次队列事件**自然重发（其 sig 含活队列序号——变化即重发）；登记为显示面残差（status / 面板读数取活队列索引，不受影响）。

### 6.20.4 受影响文件清单（R24a）

| 文件 | 当前行数 | 预计增量 | 落点 |
|---|---|---|---|
| `thincoder-core/agent-tools/async-discard.mjs` | —（新建） | **138（实测）** | 单点实现（双导出 + 私有共享核） |
| `thincoder-core/agent/run-stages.mjs` | 244 → **246（实测）** | +3 / −3（含 import 行——净 ≈0） | 接线点① |
| `thincoder-cli/src/tui/suspension-drive.mjs` | 299 → **301（实测）** | +3 / −3（含 import 行——净 ≈0） | 接线点② |
| `thincoder-core/agent-tools/subagent-scheduler.mjs` | 394 → **398（实测）** | +2 / −1 | F4 |
| `thincoder-core/test/async-discard.test.mjs` | —（新建） | **234（实测）** | 单点用例（U1–U8）  |
| `thincoder-core/test/async-family.test.mjs` | 177 → **225（实测）** | +~10 | F4 用例（U9 / U9b）  |
| `thincoder-cli/test/input-lock.test.mjs` | 204 → **267（实测）** | +~30 | 接线点② 桩驱动用例（U10）  |
| `thincoder-cli/test/integration/subagent-lifecycle.test.mjs` | 167 → **228（实测）** | +~45 | 业务可观察集成用例（I1）  |
| `docs/core/design/AGENT-LOOP-ASYNC-POOL.md`（本档） | — | — | §6.20 |
| `docs/core/requirements/AGENT-LOOP.md` | — | — | §4.10 |

> 行数口径 = **内容行数**（`wc -l` 同口径；读取工具把文件尾换行渲染为空尾行 ⇒ 同文件显示值可 +1——计法差异非漂移）。本表行数为 **as-of 落笔实测**；其余行为预计。

- **未触碰**：`thincoder-core/agent-tools/subagent-actions.mjs`（488）。

### 6.20.5 关键决策记录

| # | 决策 | 理由 |
|---|---|---|
| D-AD1 | 核内新档承载（对侧 = 核单源 import 者） | — |
| D-AD2 | `discarded` 墓碑 → `depInfo` 归 `cancelled` | 零新枚举、处置等价；名不同形须登记（防误读为语义丢失） |
| D-AD3 | 注入走核 `pushReal` | 沿核内取消提醒先例；端差 D-AD8a 登记 |
| D-AD4 | `_asyncQueue` 由模块接管剔除 | 队列与池同源；无差别清空抹掉存活条目的位置记录 |
| D-AD5 | 收尾站③（`finishSuspension`）不接线；consult 族两接线点清场不扩面 | carrier 形无注入目标；consult 无墓碑 / 提醒（与对侧同形）——均登记为已知残留 |
| D-AD6 | 判据口径 = controller 支，两接线点均不传 ctx（**收窄消差**——两端同判） | `parentAborted(null, entry)` ⇒ controller 支——「controller 中止」= 条目真死（`bindChildController:88-98` 双路），与对侧有效判据同判。`ctx` 保留为签名备用面 |
| D-AD7 | 对侧重复实现**不收敛** | 落地后同机制两实现（核新档 + `thincoder-vscode/src/agent-tools/async-discard.mjs`）⇒ 后续应收敛为核单源——**收口**：VSC 副本删除退场（零消费者；运行期面本已归核单源）。**登记为已知重复**，非静默 |
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
| U10 | 接线点②·挂起中止（桩驱动） | 桩驱动 `suspensionSession`（`thincoder-cli/test/input-lock.test.mjs:17` import），池含在飞 / 排队 / done 条目；父回合中止 | 已死条目出池 + `discarded` 墓碑 + 两族各一条提醒 / `ev:discarded`；存活条目留池 | F3 N2  |
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
| A5 | 文案 / 动作序 / 事件名与对侧同源；判据口径 = controller 支（与对侧同判——D-AD6）；端差清单已登记（D-AD8a·b·c）· 重复实现登记（D-AD7——已收口） | N1 |
| A6 | 用例表逐条有对应断言；核用例入口 = `npm run prepublishOnly`（语法门——核仓无集成测试集，CI 同式 `.github/workflows/test.yml`）；`lint` / 各包 `npm test`（单入口）全绿 | N2 |
| A7 | 触碰源档 ≤800 硬限；越软线档在档内登记（含拆分计划） | N3 |

### 6.20.8 边界（不做）

1. VSC 侧零写入（`thincoder-vscode/**` 与 `thincoder-vscode/docs/**`）——对侧重复实现收敛（D-AD7——已收口：2026-10-10 副本退场）；装饰 / 悬空名退场 = 另案。
2. 不接线收尾站③（`finishSuspension`）——判据 = D-AD5。
3. 不改 `subagent status` / 面板显示面，不新增 `discarded` 显示行（**端差与收敛方向 = D-AD8c**）；不触碰 `subagent-actions.mjs`（488 行）。
4. 不改 `_pendingAsyncResults` 停靠语义（done-in-pool 非丢弃目标——判据 `done !== true`）；不改 `cleanupConsultSessions` / consult 族清场。
5. 不改 cancel / failed 语义与文案；不新增枚举值；不改 `describeBlockers` / `detectStall`。
6. 不迁移搬档（拆分计划只登记不执行）。

## 6.30 timer 到期自唤醒（空闲唤醒面 · 第三开轮源）

> 承 §6.8（会话级后台驱动：挂起窗 / 步边界 pickup / 合并消费）——本节落**第三开轮源 = 到期 timer**
> （前两源 = settle 消化〔digest〕· 子代理上行 ask〔`docs/core/design/AGENT-LOOP-UPSTREAM.md` §6.27〕）。
> 工具契约面 = `docs/core/design/TOOLS.md` §6.7（timer 行）；CLI 显示面 = `docs/cli/design/TUI.md` §7.6——显示形态本档不重述（D2）。

### 6.30.1 现状坐标

- **投递（收正）**：驱动面（CLI ∥ VSC ∥ 桌面）⇒ 到期件不在回合边界注入——交付交**空闲面**（前台空闲闩 ∥ 挂起窗第三兑现态）；回退面（headless ∥ 直连 ∥ 开关关）⇒ 回合边界投递保持。
  注入单点 = `thincoder-core/agent/post-turn.mjs:21` ∥ 调用点 = `thincoder-core/agent/turn-loop.mjs:263`（as-of 2026-10-12）。机制单源 = §6.34。
- **在途跨 run 存活 = 规范语义**（决策 D-TW3）：核内 `_pendingTimers` 读写点三处——初值 `thincoder-core/agent.mjs:73`（三拆后档面收窄） · 写 `timer.mjs:55-59` · 消费 `post-turn.mjs:18-21`——**无 per-run 复位**。
- **端差（裁定与现态见 §6.30.11 / D-TW3）**：跨 run timer 两端同存活（与核语义一致）。
- **桌面端**：挂起窗**已落**（2026-09-28 桌面空闲唤醒批——直消费核 `thincoder-core/agent/suspension.mjs` `startSuspension`；原「核挂起驱动在端上零消费者」句随该批收正）· 回合入口单一（`thincoder-desktop/src/main/ipc.mjs:78`）· 主进程仍零轮询 ⇒ **自唤醒面仍不存在**（无空闲 deadline 闩 + 核件 `waitForSettleOrWake` 无 timer 第三兑现态；§6.30.5 表）。

### 6.30.2 载体定形（D-TW1）

**候选三面实读**（父侧点名）：

- **busy 队列 / 步边界 pickup**：核循环头投递回调（`thincoder-core/agent/turn-loop.mjs:93`——三拆前 `thincoder-core/agent.mjs:244`）+ 端侧闭包 `thincoder-cli/src/tui/queued-pickup.mjs`——通道语义 = **用户消息** → 主会话投送；可达面 = 回合在飞（循环头）+ 驱动步骤 1 ⇒ 空转期无人取队，且 timer 借道会污染「用户排队」显示面与合并计划（`thincoder-core/queued.mjs`）。
- **挂起窗**：`thincoder-cli/src/tui/suspension-drive.mjs`（窗体 = `while` 循环，退出判据 `!poolLive(agent)`；等待原语 = `waitForSettleOrWake`，settle / wake / aborted 三态单次兑现）——窗只在池 live 时开；单条 timer 不构成开窗条件。
- **会话槽**：`thincoder-core/session-slots.mjs`——跨进程占用 / 槽位持久化面，**零步进能力**（无调度语义）。

**裁定：载体 = 核到期件（单一权威）+ CLI 端两处既有驱动面**：

1. **核**（新档 `thincoder-core/agent/timers.mjs`（已落 · 实读 **113** 内容行）· 三件纯函数）：`pendingTimerDeadline(agent)`（最近到期时点或 null——端闩 / 挂起窗 deadline / 显示面共用同源）、`takeExpiredTimers(agent, now)`（到期出列——幂等）、`injectTimerReminders(agent, entries)`（历史注入单点——逐字形态不变）；
   （**R4 上提后已扩面**——闩 ∕ 派发 ∕ 火策略住核：`createTimerWatch:79` ∕ `fireTimerWake:105`；「50」= R4 上提前读数；重锚 = §6.30.16 重锚清单⑤ · **已落**）
   `thincoder-core/agent/post-turn.mjs` 同批改调三件（**行为零变**——过滤语义与注入形态逐字保持）。
2. **CLI 空闲面**（新档 `thincoder-cli/src/tui/timer-watch.mjs`（已落 · 实读 **64**（2026-09-29 B3 收编后；「90」= B3 收编前读数）））：**一次性 deadline 闩**——到点自撤 · `unref()` · 单槽武装（重复武装 = 撤旧立新）；**非** interval 轮询、**非**第二执行引擎（开轮一律经既有回合驱动器 `runAgentTurn`）。
   形态先例 = `thincoder-cli/src/heap-watch.mjs:41-48`（`timer` 参数注入缝 + `unref`）+ `:12-13`（开关默认开 + 显式关键）。
3. **CLI 挂起窗内**：复用既有窗——`waitForSettleOrWake` 增**第三兑现态 `timer`**（deadline 到 ⇒ 与 settle / wake 同槽兑现，先到先得）。


### 6.30.3 接口契约（投递形态 · 消费入口 · 门三件）

**投递形态（D-TW2）**：到期 ⇒ `history.push({ role: "user", content: "[System reminder: ⏰ timer — <message>]" })`——逐字 = 既有注入单源（`injectTimerReminders`）；机器线独有（`[System reminder:` 前缀不入 fullHistory / 页面投影——两端同判）。

**消费入口（D-TW4）**：开一轮 **auto-turn 第三变体 `timerTurn`**——`runAgent` opts 增 `timerTurn`（与 `upstreamTurn` 同族，**仅作域文本选择**；域文本 = `TIMER_TURN_DOMAIN`（已落常量 · `thincoder-core/agent/helpers.mjs:459`））。

- **开轮两处**：空闲闩 fire ⇒ `runAgentTurn(ctx, "", { autoTurn: true, timerTurn: true })`（顶层链，`skipSession` 缺省——链尾全语义：队列续发 / 挂起入口 / attention 置位照常，**除外限定**：在途 timer ∧ 唤醒会武装 ⇒ 不计 awaiting——单源 = `docs/cli/design/TUI.md` §7.1 表 awaiting 行 / §7.2 置位谓词）；
  挂起窗内 ⇒ 同 digest 轮形态 `{ autoTurn: true, timerTurn: true, skipSession: true }`。
- **权限面 = 普通回合同款**（传宿主原 ctx——`askPermission` / `askQuestion` 保留）；digest 手动档剥处理器形态（`thincoder-cli/src/tui/suspension-drive.mjs:188-190`）**不**沿用：timer 语义 = 动手取数据，剥处理器会把「跑代码」机械变不可达。
- **动作域 = 系统轮既有机械面沿用**（`thincoder-core/agent-tools/subagent.mjs:271`：`_inAutoTurn && !autoApprove` ⇒ spawn 拒）；**不新增机械门**。
- **`TIMER_TURN_DOMAIN` 合同**（单行 · `[System reminder: …]` 形态 · 恒非空）：① 本轮由到期 timer 自动开启、无用户消息在等；② 按 timer 提醒语义推进（取数据 / 动手验证，而不是继续空想）；③ 范围 = timer 设定时在飞的工作，不开无关新工作；④ 动作完成或受阻即收尾。**逐字文本 = 机制文档定稿（落笔 = eng-coder）**，本设计给合同与草稿位。

**门三件**：

- ① **仅系统类消息可自唤醒**：唤醒源 = `_pendingTimers`（**写点 = timer 工具 `thincoder-core/agent-tools/timer.mjs:199` ＋ 出列重排面 `thincoder-core/agent/timers.mjs:93`**——见 §6.30.18）；投递形态 = 系统类 `[System reminder:` 通道；
  其它注入面（用户排队消息 / peer 提醒 / stall / goal / task 提醒）**零唤醒面**——闩只读到期件、不看 history，**无通用「注入即唤醒」通道**（防借道）。
- ② **成本闸**（沿用既有形态——不新增预算件）：到期批**合并一轮**（多条同批到期 ⇒ 一次注入 + 一轮）；**到期即消费**（出列幂等——绝不重复投递）；
  轮次帽 = 系统 `maxTurns`（§6.8 既有口径「auto-turn 不另设轮次预算」沿用）；撞帽**不自动续跑**（`thincoder-cli/src/tui/agent-turn.mjs:194-201` autoTurn 分支既有纪律）；

  在途条数帽 `TIMER_MAX_PENDING` = 8（与排队容量 `QUEUED_MAX_ITEMS`（`thincoder-core/queued.mjs:25`）同值同形）——超限 ⇒ timer 工具**显式拒**（抛错：不静默丢、不静默清；形态先例 = 队满「拒 + 提示 + 保留」）；**周期项同占坑**（1 条 1 坑 · 重排净零——§6.30.18 D-TW15）。
- ③ **开关**：配置键 `agent.timerWake`（布尔 · **默认 `true`**）——理由：① 工具描述面已承诺到点提醒（`thincoder-core/tool-docs/timer.md:2 ∥ :10`）⇒ 默认关 = 缺陷留存量用户；
  ② 三条成本闸在 + 手动档动作面 = 权限面（用户在场才批）；③ 先例 = `diagnostics.heapWatch` 默认开 + 显式关键。**关 ⇒ 端侧不武装闩**（回到仅回合边界投递——既有语义；零调度器面）。
  键面派生：`agent.timerWake` 随核全量 DEFAULTS 派生进 `settings` 工具类型面（`thincoder-core/agent-tools/settings.mjs:62`——装载期派生）；

  已登记 = `docs/core/design/CONFIG.md` §6.2 **派生消费面**行（与 `diagnostics.heapSnapshot` / `diagnostics.heapWatch` 同列——实现面零改码）。

**描述面收正（D-TW8）**：`thincoder-core/tool-docs/timer.md:10` 的契约句「the reminder fires at the deadline」在自唤醒落地后成立；收正 = 保留该句为契约句 + 补**投递形态**一句（驱动面 = 空闲面交付——挂起窗 ∥ 空闲闩；回退面 = 下一步边界投递；批 async-delivery-formalize 收正 · §6.34）与在途帽一句。**逐字文本 = 机制文档定稿**（落笔 = eng-coder）；参数 schema 零变（该批范围——见 §6.30.18 扩五参）。

**端限定（合同形——评审轮 1 #5 · 阶段 2 合同句）**：收正文本中「空闲 = 自唤醒」表述须携带**支持面限定**（回指 §6.30.5）——阶段 2 后支持面 = **CLI / VSC / 桌面三端前台**，headless（`chat` / ACP / 直连 `runAgent`）保留边界投递。

**合同句（域限收正 · 对应段 = `thincoder-core/tool-docs/timer.md:11`）**：驱动面（CLI / VSC / 桌面前台与挂起窗）= 空闲面交付（§6.34）；headless（`chat` / ACP / 直连 `runAgent`）= 保留步边界交付。**逐字文本 = 机制文档定稿**（候落笔）。
**`TIMER_TURN_DOMAIN` 正文** = 阶段 1 既有文本复用（端侧 re-export 核单源——零新文本；落点见 §6.30.11 VSC 块「域文本」行）。

### 6.30.4 关键决策记录

| # | 决策 | 裁定 | 理由 |
|---|---|---|---|
| D-TW1 | 载体 = 核到期件 + CLI 一次性 deadline 闩（空闲）+ 挂起窗第三兑现态 | 采纳 | 空转期在既有管线中**无载体**（零 ticker：CLI 空闲期仅 heap-watch 60s / ledger 120s 两条 `unref` 采样，非回合驱动）⇒ deadline 闩为最小必要新增 |
| D-TW2 | 投递形态 = `[System reminder: ⏰ timer — …]`（机器线独有） | 采纳 | 逐字沿用既有注入单源；零新增消息类 |
| D-TW3 | 在途跨 run 存活 = 规范语义（核不复位） | 采纳 | 到期语义要求（用户报告锚）；VSC 端差**已消解（跨 run timer 两端同存活；见 §6.30.1）** |
| D-TW4 | 消费入口 = auto-turn 第三变体 `timerTurn` + 普通权限面 | 采纳 | — |
| D-TW5 | 开关默认 `true` | 采纳 | §6.30.3 门三件 ③ 三条理由 |
| D-TW6 | 在途帽 = 8（超限显式拒） | 采纳 | 成本闸形态复用队容量先例（拒 + 保留，不静默） |
| D-TW7 | 可见面 = 状态行派生标记 + 触发落流一行 + `/timers` 只读列表；取消面 = 模型工具 `cancel` 动作（补——§6.30.18） | 采纳（取消面按此收正） | 显示形态单源 = `docs/cli/design/TUI.md` §7.6；`/timers` 保持只读（端专属取消 UI = 新跨端差异 ⇒ 不许——取消经核件在途表移除，零门 ∕ 零回执 ∕ 零持久化语义） |
| D-TW8 | 描述面：契约句保留 + 补投递形态 / 在途帽句 | 采纳 | 见 §6.30.3；逐字 = 机制文档定稿 |

### 6.30.5 跨形态行为表

| 形态 | 自唤醒 | 定义 / 理由 |
|---|---|---|
| CLI 前台（TUI 空闲） | ✅ | 一次性 deadline 闩（**核件消费**——B3 批改指 = §6.30.16；端面转口 = `thincoder-cli/src/tui/timer-watch.mjs`）——武装点 = 回合链尾「无人自动接手」判据邻位 |
| CLI 挂起窗（池 live） | ✅ | `waitForSettleOrWake` 第三兑现态；窗内到期即开 timer 轮（不等池空）；池空窗退 ⇒ 交空闲闩（到期件已出列——零重复投递） |
| CLI headless（`chat` 一次性 / ACP / 直连 `runAgent`） | ❌ 不支持 | 空转面不存在（`chat` 一次性 run 结束即退；ACP 回合由客户端驱动——`thincoder-cli/src/acp/session.mjs:20` `run = runAgent`、无挂起窗）；到期仍在下一工具回合边界投递（既有语义不变） |
| 桌面 | ✅（阶段 2） | 空闲 deadline 闩（`thincoder-desktop/src/main/timer-watch.mjs`（已落 · 实读 **76**——2026-09-29 收正）——主进程 · 键面 = 会话键）+ 窗内兑现（核件 opt-in timer 面 = §6.30.10）+ 触发落流（新 `ev:timer`）——落点逐条 = §6.30.11；门 / 帽沿用 §6.30.3 |
| VSC | ✅（阶段 2） | 端差已消解（`_pendingTimers` 跨 run 存活——复位行删除 · §6.30.11）+ 空闲 deadline 闩（**核件消费**——B3 批改指 = §6.30.16；端面 = `thincoder-vscode/src/extension/timer-watch.mjs`）+ 自有驱动第三兑现态 + 可见面（状态行 `⏰N` + 触发落行） |

### 6.30.6 受影响文件清单（R24a）

**实施后重锚 as-of 2026-09-27（实测）**：代码行读数（清单表）= 实施终态实测（`wc -l` 语义；增量 = 终态 − 设计轮现行）；文档四行 = 实施零触，保持不动。

| 文件 | 现行行数 | 实测增量 | 说明 |
|---|---|---|---|
| `thincoder-core/agent/timers.mjs`（已落） | — | **113（实测 · 2026-09-29 B3 收编后；「50」= R4 上提前读数）** | 到期件三件纯函数（deadline / take / inject）；**R4 上提后已扩面**（闩 ∕ 派发 ∕ 火策略住核——`createTimerWatch:79` ∕ `fireTimerWake:105`；重锚 = §6.30.16 重锚清单⑤ · 已落） |
| `thincoder-core/agent/post-turn.mjs` | 70 | **−4（实测 · 70→66）** | 块改调到期件（行为零变） |
| `thincoder-core/agent.mjs` | 444 | **+3（实测 · 444→447）** | opts `timerTurn` + 域文本三元 |
| `thincoder-core/agent/helpers.mjs` | 463 | **+9（实测 · 463→472）** | `TIMER_TURN_DOMAIN` 常量 + 注释 |
| `thincoder-core/agent-tools/timer.mjs` | 46 | **+17（实测 · 46→63）** | 在途帽显式拒 + 描述面字面收正（725 字符） |
| `thincoder-core/config.mjs` | 426 | **+3（实测 · 426→429）** | `agent.timerWake: true` |
| `thincoder-core/test/timer-wake.test.mjs`（已落） | — | **158（实测 · 新档）** | 核侧用例族（T-TW1 / T-TW2 / T-TW7 / T-TW9）  |
| `thincoder-core/test/turn-domain-mode.test.mjs` | 57 | **+4（实测 · 57→61）** | 三元选择 + 域文本断言  |
| `thincoder-cli/src/tui/timer-watch.mjs`（已落） | — | **64（实测 · 2026-09-29 B3 收编后；「90」= B3 收编前读数）** | 一次性 deadline 闩（`timer` / `clear` 注入缝 · `unref`） |
| `thincoder-cli/src/tui/agent-turn.mjs` | 379 | **+7（实测 · 379→386）** | 链尾 `sync` 调用 + `userNeededAtTurnEnd` 在途 timer 除外（§6.30.3 attention 限定） |
| `thincoder-cli/src/tui/suspension-drive.mjs` | 341 | **+21（实测 · 341→362）** | timer 轮 + 窗内 deadline + 等待第三态 |
| `thincoder-cli/src/tui/turn-face.mjs` | 64 | **+3（实测 · 64→67）** | `turnCtx.timerWatch` 字段 |
| `thincoder-cli/src/tui/index.mjs` | 227 | **+13（实测 · 227→240）** | 装配 + 惰性回填开轮入口 |
| `thincoder-cli/src/tui/render-frame.mjs` | 423 | **+5（实测 · 423→428）** | `timerHint` 段（状态段簇尾） |
| `thincoder-cli/src/tui/cmd-timers.mjs`（已落） | — | **33（实测 · 新档）** | `/timers` 只读列表 |
| `thincoder-cli/src/tui/slash-commands.mjs` | 186 | **+3（实测 · 186→189）** | 名单 + 分派 + import |
| `thincoder-cli/test/timer-wake.test.mjs`（已落） | — | **274（实测 · 新档）** | 端侧用例族（T-TW3–T-TW6 / T-TW8 / T-TW10 / T-TW12 / T-TW13）  |
| `thincoder-cli/test/cmd-timers.test.mjs`（已落） | — | **42（实测 · 新档）** | T-TW11  |
| `thincoder-cli/README.md` | 535 | **+1（实测 · 535→536）** | 配置键面示例（`agent.timerWake`） |
| 文档：`docs/core/design/AGENT-LOOP-ASYNC-POOL.md` | 385 | **+180（实测 · wc -l 565——设计轮 152〔§6.30 ≈148 + 变更记录 3〕+ fix 轮收正 28 · 实读 2026-09-28 = 745〔修正轮重锚——内容行数 ∕ `wc -l` 口径 · 文末换行不计〕）** | 本节（§6.30） |
| 文档：`docs/cli/design/TUI.md` | 797 | **+42（实测 · wc -l 839——§7.6 + fix 轮 §7.1 / §7.2 / §7.6 除外限定与可达条件）** | §7.6 显示面 |
| 文档：`docs/core/design/TOOLS.md` | 1131 | **+3（实测 · wc -l 1134——契约行改 + 变更记录 2 行）** | §6.7 timer 契约行补句（支持面指针） |
| 文档：`docs/core/design/CONFIG.md` | 206 | **+1（实测 · wc -l 207——登记行行内扩面 + 变更记录 1 行）** | §6.2 派生消费面登记行补 `agent.timerWake` |

- `thincoder-cli/src/tui/suspension-drive.mjs`（341 → 362，+21）：改动 = 既有等待原语 `waitForSettleOrWake` 增**第三兑现态** + 既有驱动状态机增一条判据支（窗内 deadline 到 ⇒ 开 timer 轮）——
  无新模块职责 / 无新导出族（挂起窗单一驱动器职责未破）⇒ **不拆**。
- `thincoder-core/agent/helpers.mjs`（463 → 472，+9）：域文本常量族内 +1 常量（`TIMER_TURN_DOMAIN`——同族 = `AUTO_TURN_DIGEST_DOMAIN` / `UPSTREAM_TURN_DOMAIN`，`:436` / `:450`）⇒ **不拆**（无新职责 / 无逻辑）。
- `thincoder-core/agent.mjs`（444 → 447，+3）：`runAgent` opts 旗标族内 +1（`timerTurn`——与 `upstreamTurn` 同族，`:101` / `:175-176`）⇒ **不拆**。
- `thincoder-core/config.mjs`（426 → 429，+3）：`DEFAULTS` 键 +1（`agent.timerWake`——与 `diagnostics.heapWatch` 同形先例，`:87`）⇒ **不拆**。
- `thincoder-cli/src/tui/render-frame.mjs`（423 → 428，+5）：既有状态段簇内 +1 段（`timerHint`——同区先例 = `ledgerHint` / `titleHint`，§7.4）⇒ **不拆**。
- `thincoder-cli/src/tui/agent-turn.mjs`（379 → 386，+7）：既有回合链尾 +1 调用（闩 `sync`）+ `userNeededAtTurnEnd` 除外判据 +1 项 ⇒ **不拆**。

### 6.30.7 用例表（正常 / 边界 / 错误）

| # | 场景 | 输入 | 预期 |
|---|---|---|---|
| T-TW1 | 正常·核到期件 | 在途两项（一到期一未到期）——`takeExpiredTimers` / `pendingTimerDeadline` 直驱 | 恰取到期项并出列；二次调用零返（幂等）；deadline = 最近时点；空在途 ⇒ `null` |
| T-TW2 | 正常·post-turn 回归 | `injectPostTurn` 直驱（到期项 / 未到期项） | 到期 ⇒ history 尾 = `[System reminder: ⏰ timer — <msg>]`（逐字）；未到期 ⇒ 零注入；行为与改前逐字等价 |
| T-TW3 | 正常·空闲闩武装 | 假 timer + 在途一项（+N ms）——`sync()` | timer 恰注册一次 · 延迟 = 最早到期差 · `unref()` 被调；无在途 ⇒ 零注册（并撤旧） |
| T-TW4 | 正常·空闲自唤醒（可复现） | 空闲态（`processing` / `suspended` / `_suspPending` 全假）+ 假 timer 触发 | 到期出列 + history 注入恰一条 + 触发落流恰一行 + 开轮调用恰一次（桩收 `{autoTurn:true, timerTurn:true}`） |
| T-TW5 | 边界·busy 期触发零动作 | `state.processing = true` ⇒ 假 timer 触发 | 零注入 / 零开轮 / 在途不动（交链尾收束——窗口 ∥ 空闲闩空闲面交付；§6.34） |
| T-TW6 | 边界·开关关 | `agent.timerWake = false` ⇒ `sync()` | 零注册（闩怠惰）；到期件保持（回合边界路径不受影响） |
| T-TW7 | 错误·在途帽 | 在途 8 条 ⇒ 第 9 次设 timer | 工具显式抛错（可读文本）；在途保持 8（不静默丢 / 不静默清） |
| T-TW8 | 正常·挂起窗第三兑现态 | `suspensionSession` 直驱（池 live + 在途一项 + 假 timer） | 等待含 deadline；兑现 ⇒ timer 轮开启（`runTurn` 桩收 `{autoTurn:true, timerTurn:true}`）+ 注入在场；池空窗退后零重复投递 |
| T-TW9 | 正常·域文本 | `runAgent`（`autoTurn + timerTurn`，手动档） | 选中 `TIMER_TURN_DOMAIN`（单行 · `[System reminder:` 起 · `]` 收）；AUTO 档零注入（既有口径）；`upstreamTurn` 优先不回归 |
| T-TW10 | 正常·状态行标记 | `renderStatus` 纯函数直驱——在途 2 / 含过期项 / 空 | 含 `⏰2`；含过期 ⇒ 含警示色序列；空 ⇒ 零 `⏰` + 逐字节等价 |
| T-TW11 | 正常·`/timers` 列表 | 命令直驱——在途两条 / 零条 | 逐条行（剩余 mm:ss + message 首行）；零条 ⇒ 空态行 |
| T-TW12 | 边界·子代理隔离 | depth-1 agent 在途两条 · 主 agent 在途零条 ⇒ 主标记 | 零 `⏰`（读对象 = 主 agent 单对象——构造性零泄漏） |
| T-TW13 | 边界·attention 除外 | 主 agent 在途 timer 一项——`userNeededAtTurnEnd` 直驱（两档：`agent.timerWake` 开 / 关） | 开 ⇒ `false`（不计 awaiting——自动续跑在途）；关 ⇒ `true`（照常置位）；零在途 ⇒ 既有语义不回归 |

**用例宿主**（评审轮 1 #7 收正——先例 = 同档 §6.20.6 落点行）：T-TW1 / T-TW2 / T-TW7 → `thincoder-core/test/timer-wake.test.mjs`（核侧）；
T-TW9 两档分属——核新档 = 选择面（`timerTurn` ⇒ `TIMER_TURN_DOMAIN` 选中），`thincoder-core/test/turn-domain-mode.test.mjs` = 模式三元回归（`upstreamTurn` 优先 / AUTO 档零注入）；

T-TW3–T-TW6 / T-TW8 / T-TW10 / T-TW12 / T-TW13 → `thincoder-cli/test/timer-wake.test.mjs`（端侧）；T-TW11 → `thincoder-cli/test/cmd-timers.test.mjs`。

### 6.30.8 验收标准（逐条回指）

| # | 验收点 | 判据 |
|---|---|---|
| A-TW1 | 载体定形（含实读依据） | §6.30.2 三条候选实读 + 裁定；载体三件落点逐条带坐标 |
| A-TW2 | 门三件定义 | §6.30.3：仅系统类可自唤醒（唤醒源写点两处 + 无通用通道）· 成本闸（合并 / 幂等 / 帽 / 无自续）· 开关（键 / 默认 / 理由 / 关语义） |
| A-TW3 | 跨形态行为表 | §6.30.5 五形态逐格定义（自唤醒 / 不支持 + 理由）（**阶段 2 已接线**——桌面 / VSC 行改 ✅：见 §6.30.5 / §6.30.10–§6.30.11；本行 = 阶段 1 判据原样） |
| A-TW4 | 端面枚举（含「不接 + 理由」） | `docs/cli/design/TUI.md` §7.6（TUI 落点）+ §6.30.5（桌面 / VSC 不接 + 理由 + 后续登记——**阶段 1 原样 · 阶段 2 已接线**：同表两行改 ✅，见 §6.30.10–§6.30.11） |
| A-TW5 | 受影响文件全清单（行数标注制） | §6.30.6（现行行数 + 实测增量逐行） |
| A-TW6 | 验证形态（可复现） | §6.30.7 T-TW1–T-TW13（假 timer / 假到期 / 空转态直驱——零真实等待）；端面按各自既有测法 |
| A-TW7 | 机检零新增 | 仓根 `node scripts/doc-check.mjs --root .`——对比**开工基线**（悬空 48 / 行宽 22）；逐档零新增（实施后复测：四档零命中——行宽 31 的 +9 全来自他批在途） |

### 6.30.9 边界（不做）

1. VSC / 桌面零写入 = **阶段 1 边界**（阶段 2 批已接线——§6.30.10–§6.30.15；端差裁定见 §6.30.1 / D-TW3）。
2. 不做 `/timers` 取消面；不做模型门控；**不新增机械门**（既有系统轮机械面沿用）。
3. 参数 schema 零变（timer 工具参数面）——**阶段 1 边界**（timer-completeness 批扩五参——见 §6.30.18）；不触 #442 已收口面；不扩压缩 / traces 等无关机制。
4. headless（`chat` / ACP / 直连 `runAgent`）**自唤醒面零变化**；**核工具面帽为全端共享**——在途 ≤ 8、超限显式拒（§6.30.3 门三件 ②）在 headless / VSC / 桌面 / 子代理同判：第 9 条 `timer` 由成功变抛错。
5. 子代理（depth>0）**显示面**零改（其面板时间面自持）；**工具面帽全端共享**（见边界 4）。

### 6.30.10 阶段 2 · 核件 timer 面（opt-in）


**接口契约（opt-in · 缺省零行为变化——现宿主不传 ⇒ 逐字等价）**：`startSuspension(ctx)` 增读三枚**可选**注入项：

- `ctx.timerFace = { deadline, deliver }`——`deadline()` = 每轮步骤 4 起算前现算（`number|null`；缺省 / `null` ⇒ **零注册**，等待仍三态）；`deliver()` = 到期兑现面（返回布尔——是否已交付；**契约 = 同步 · 严格布尔**：判据 `=== true`——非布尔返值 ⇒ 静默零轮；
  宿主以核三件 `takeExpiredTimers` + `injectTimerReminders`（`thincoder-core/agent/timers.mjs`）实现 ⇒ 核内零文案、零显示、零端名分支）；
- `ctx.timer` / `ctx.clear`——注入缝（缺省 `setTimeout` / `clearTimeout`；先例 = CLI 同形注入缝 ⇒ 用例零真实等待）。

**循环兑现支（步骤 4 后）**：`why === "timer"` ∧ `deliver()` 真 ⇒ `runTurn("", { autoTurn: true, timerTurn: true })` ⇒ 轮后序与消化轮同形（`hooks.reclaim` + `hooks.onCounts`）⇒ `continue`。
池空窗退 ⇒ 交宿主空闲闩（到期件已出列——零重复投递；§6.30.11）。

**轮中止容纳（与消化支对称）**：timer 轮自身的回合级中止（`AbortError` ∧ 会话未停——`!abortSignal?.aborted`）**不是会话停止**——与消化支同判：容纳并重入循环（timer 轮不发 digest 边界 ⇒ 中止路径零边界、不补发轮后序钩子；池空 / pending 空自然退出）；其余（非 `AbortError` ∨ 会话停）照旧上抛——finally 清场同前（会话停 ⇒ 清池不注入）。镜像源 = `thincoder-core/agent/suspension.mjs:234-240`（消化支 catch 块）。


**门三件沿用**（§6.30.3）：唤醒源 = `_pendingTimers` 写点两处（timer 工具设 ∕ 取消 ＋ 核出列重排面）· 成本闸（合并 / 出列幂等 / 帽 / 撞帽不续跑）· 开关 `agent.timerWake` 默认开（实现 = 端面活读）。
- **关的射程（措辞收口 · 2026-09-29——承轮 6 顾问疑点）**：闩面零注册（核闩内判据——`thincoder-core/agent/timers.mjs` `createTimerWatch`；CLI `thincoder-cli/src/tui/timer-watch.mjs` = 核转口 ∕ 零自持闩）+ **窗内起算面同判**（关 ⇒ 窗内 `deadline` 亦 `null`——读法 = T-TW6 ∕ T-TW13 同判：关态零自动开轮）；
  **窗内起算面包判据已落**（CLI `thincoder-cli/src/tui/suspension-drive.mjs:166` ∕ VSC `thincoder-vscode/src/extension/suspension.mjs:236`——micros ∕ B1 收正轮，2026-09-29）；
  桌面 ∕ VSC 面 `timerWakeEnabled` 单源同判。
- **端面镜像（同句适用）**：窗内 timer 支的轮中止容纳（本 §6.30.10 容纳句）同句适用 CLI——现态（2026-09-29 取核重写后）：容纳逻辑住核 `startSuspension` 等待面（端装配 = `thincoder-cli/src/tui/suspension-drive.mjs`）。
- **闩边界面收口（#448 · 2026-09-29 · 实落）**：
  - ① **模态期抑制 + 关闭后补评估**：用户自发模态在场（picker ∕ wizard）⇒ `fireTimerWake` 零动作（零送达 ∕ 零开轮 ∕ 在途 timer 零触碰；单谓词 = `modalOpen(state)`（`thincoder-cli/src/tui/timer-watch.mjs:47-48`——谓词定义）∕ 门位 = 火面 `busy` 谓词（同档 `:60`））；
    模态关闭 ⇒ 补评估重同步（`reevalTimerWake` → 闩 `sync()`——按在途到期补点火）——关闭点集 = **三装配点**（`thincoder-cli/src/tui/pickers.mjs:35` ∕ `thincoder-cli/src/tui/wizard.mjs:170` ∕ `:242`）+ **两注入位**（`thincoder-cli/src/tui/index.mjs:174` ∕ `:181`——`onModalClose` 注入；关闭点计数 = 按装配点 3 计，注入位不重计）。
  - ② **异常径重武装 + 会话停 ∕ 显式撤销除外（实落 = 粘滞位）**：回合链尾 `sync()` 上收收口层 `finally`（`thincoder-cli/src/tui/agent-turn.mjs:95-99`——异常 ∕ 中止逃逸的回合照常重武装；正文改名 `runAgentTurnBody` = `:104`）；
    除外 = 会话停 ∕ 显式撤销——粘滞位 `_timerRearmRevoked`（守卫 `:84-85` ∕ 链头复位 `:157`；Ctrl+C 全停 ⇒ `:221` ∕ 会话停复位前捕获 ⇒ `:400`）⇒ 停态零自动重武装。

### 6.30.11 阶段 2 · 端面接线（桌面 / VSC）

**桌面（批条目 B2）**：

- **空闲面**（`thincoder-desktop/src/main/timer-watch.mjs`）：**核件消费**（2026-09-28 流程批 R4 上提后——闩 ∕ 派发 ∕ 火策略住核；本档 = 键面表壳（核 `createTimerWatch` 逐键包装）+ `ev:timer` 出词 + `runTurn` 触发面）；**键面 = 会话键**（键 ⇒ 闩；同键至多一闩，跨键独立）。
- **装配点**（`thincoder-desktop/src/main/agent-host.mjs` / `suspension-drive.mjs`）：① 回合尾接管判据邻位（`takeOver`——`suspension.start(...)` 未入窗 ⇒ 武装）② 出窗结算后（窗退且仍有在途 ⇒ 武装）③ 会话清除面（`dispose(key)` / 切项目级联 ⇒ 撤闩清点）。
- **火面**（CLI `fireTimerWake` 对位）：`flights.has(key) ∥ suspension.active(key)` ⇒ **零动作**（在飞回合 / 窗内由既有路径接管——链尾重同步；在途表零触碰）；空闲 ⇒ 交付（核三件 + 触发落流）+ `executeTurn(key, agent, "", { autoTurn: true, timerTurn: true })`。
- **透传**：`turn-face.mjs` 的核 opts 四件 ⇒ 五件（`timerTurn: opts.timerTurn === true`）；`suspension-drive.mjs` `driveTurn` 同键转发。
- **窗内投递存活（缺陷修复 · 2026-10-01 · #799）**：窗内 timer 轮的会话钉定重装**先于投递**（`suspension-timers.mjs` `faceOf().deliver` 内先重装后注入）；`driveTurn` 对 timer 轮零重装——否则重装整换机读线会吞掉刚落的投递行（明细 = §6.30.17）。
- **通道与可见面**：新 `ev:timer { key, text }`（触发落流一行；`text` = 交付原文，显示裁 = ≤3 行 + `…`——CLI 同规）⇒ 白名单 **18**（＝盘面现值——含在途批 `ev:ledger` / `ev:queue`；只增自身一位 · 定序同前——只增位）；
  `ev:usage.timers` 沿用（段 12 `⏰N` 源 = `thincoder-desktop/renderer/views/statusline.mjs:167-174`（as-of 2026-09-29）——零改）；渲染 = 流内触发行（归约切片 `state.timerNotice[key]` + `thincoder-desktop/renderer/views/chat.mjs` 行组——与 `ev:digest` 行同族：**生命期照其现行判据同法**——在场 / 退场随 `ev:digest` 行实现（页读整置即失）；实施轮按该行同法落地并在 §5 记明）。
- **新鲜度**：闩到点即开轮 ⇒ 到期不滞留（该轮回合尾读数同点刷新）；到期/已设两态凭 `⏰N` 段（派生式 · 零缓存）。

**VSC（批条目 B1）**：

- **端差消解（#445 —— 裁定见 §6.30.1 / D-TW3）**：`thincoder-vscode/src/agent/agent-state.mjs:30` 删 `agent._pendingTimers = []`（对齐「跨 run 存活」；顶层 agent 单例复用 ⇒ 天然跨 run 载体）；端内联块改调核三件（单源；形态同核 `post-turn.mjs` 改调先例——行为逐字等价）。
  **收编后现态**：该内联块随主循环取核退场（原坐标 `thincoder-vscode/src/agent.mjs:421-429` 已死——调用点 = 核 `runAgent` 循环）。
- **空闲面**（`thincoder-vscode/src/extension/timer-watch.mjs`）：**核件消费**（B3 批改指 = §6.30.16——闩换源核 `createTimerWatch`；装配 `syncTimerWatch` 单例惰性建 + `getAgent` 活体读不动；火面 = 核策略 + 端两缝）；
  武装点 = `panel-turn-stages.mjs` `finalizeTurn` 尾（忙态归位后）与挂起会话退出 `finally`（`thincoder-vscode/src/extension/suspension.mjs`）；撤闩 = 面板 `dispose`（`extension/chat-panel.mjs`）与切槽销毁点。
- **开关生产者**：`agent.config.agent` 白名单增 `timerWake`（与 `autoThink` 同形）——`thincoder-vscode/src/agent/setup.mjs:153` ∕ `:177` ∕ `:196` → 白名单消费位 `thincoder-vscode/src/agent/agent-state.mjs:100`
  → 读面 = 核 `timerWakeEnabled`（B3 批改指——端壳不再自持判据）⇒ `config.json` `agent.timerWake: false` 端侧关闸生效（与 CLI / 桌面同判）。
- **窗内兑现（收编后现态）**：核 `startSuspension` 等待面（`timerFace` opt-in + 兑现支——§6.30.13 核增补）；VSC 装配 = `thincoder-vscode/src/extension/suspension.mjs` `timerFace`（`{deadline, deliver}`——现档 291 行；原端自有驱动 `waitForSettleOrWake`（镜像面随取核退场））。
- **窗内容纳**：窗内 timer 轮自身的回合级中止（`AbortError` ∧ 会话未停）⇒ 容纳并重入（§6.30.10 轮中止容纳；与同档消化支同判）；其余（非 `AbortError` ∨ 会话停）照旧上抛——**现态**：容纳逻辑住核 `startSuspension` 等待面（端装配 = `thincoder-vscode/src/extension/suspension.mjs`；原端坐标 `:381-393` 已死）。
- **域文本**：`thincoder-vscode/src/agent/turn-domains.mjs` 选择链增 `timerTurn` 支（端侧零自持字面 = `setup-reminders.mjs` re-export 核 `TIMER_TURN_DOMAIN`）；域文本经核 `opts.turnDomainText` 装配（**现态**：原端注入点 `thincoder-vscode/src/agent.mjs` 随主循环取核退场——组合点 = `turn-domains.mjs`）。
- **可见面**：状态行 `⏰N` 段（源 = `usage` 载荷增字段 `timers {count, expired}`——`webview/status-bar.js` + `webview/state.js`）+ 触发落流一行（新消息 `timer { status:"fired", text }`——`webview/chat-messages.js` 渲染）+ i18n 键 `status.timer`；协议增量登记 = `docs/vsc/design/WEBVIEW-PROTOCOL.md` §3.2（两行）。

**headless**：零变化——无空转面 ⇒ 闩无人武装；核件 opt-in 缺省 ⇒ 既有行为逐字等价。**CLI**：端面收口随 B3（闩改指核件 = §6.30.16；挂起窗 ∕ 可见面不动）。

### 6.30.12 用例表（阶段 2 · 正常 / 边界 / 错误）

| # | 场景 | 输入 | 预期 |
|---|---|---|---|
| T-TW14 | 正常·核件 opt-in 零回归 | `startSuspension` 不传 `timerFace`（既有核测形 + 新例） | 等待不含 deadline（零注册）；既有核测逐条全绿（行为与改前等价） |
| T-TW15 | 正常·核件窗内兑现 | 假 carrier + 假 timer + `timerFace`（假 `deadline` / 假 `deliver` 返真） | 兑现 ⇒ `runTurn("", { autoTurn: true, timerTurn: true })` 恰一次；`deliver` 恰一次；轮后序（reclaim / onCounts）同形 |
| T-TW16 | 边界·核件零交付 | `deliver()` 返假（无到期件） | 零开轮、零轮后序；循环重入等待（不空转） |
| T-TW17 | 正常·桌面闩武装 | 假 timer + 在途一项（+N ms）——键面 `sync` | 注册恰一次 · 延迟 = 最早到期差 · `unref()` 被调；无在途 / 开关关 ⇒ 零注册并撤旧 |
| T-TW18 | 正常·桌面空闲自唤醒 | 空闲态（无在飞 / 无窗）+ 假 timer 触发 | 交付 + `ev:timer` 恰一条 + `executeTurn` 桩收 `{ autoTurn: true, timerTurn: true }` 恰一次 |
| T-TW19 | 边界·桌面 busy / 窗内触发 | 在飞回合 ∥ 窗在场 ⇒ 假 timer 触发 | 零交付 / 零开轮 / 在途表零触碰（交既有路径 + 链尾重同步） |
| T-TW20 | 边界·桌面出窗重武装 / 清点 | 窗退（仍有在途）⇒ 武装；`dispose(key)` / 切项目 ⇒ 撤闩 | 出窗后闩在；清除面后零残留（清点断言） |
| T-TW21 | 错误·桌面透传 | `executeTurn(..., { timerTurn: true })` ⇒ 桩 `run` 收 opts | `timerTurn: true` 在位（与 autoTurn / upstreamTurn 并列）；缺省 ⇒ false |
| T-TW22 | 正常·VSC 端差消解 | 顶层 agent 连续两 run（`hydrateRun` 直驱） | 第 1 run 置入的在途 timer 在第 2 run 起点**仍在**（原每 run 清空断言随改） |
| T-TW23 | 正常·VSC 空闲自唤醒（**T-TW23b 变体** = 非空闲零动作——busy ⇒ 零交付 ∕ 零开轮 ∕ 在途不动） | panel 桩（idle）+ 假 timer + 假 `runChat` | `runChat` 桩收 `{autoTurn, timerTurn}` 恰一次；交付行恰一条 |
| T-TW24 | 正常·VSC 窗内兑现 | `suspensionSession` 直驱（池 live + 在途一项 + 假 timer） | 兑现 ⇒ timer 轮开（桩收 `{ autoTurn: true, timerTurn: true }`）；池空窗退后零重复投递 |
| T-TW25 | 正常·VSC 可见面 | 状态行直驱（在途 2 / 含过期 / 空）· `timer` 消息直驱 | 含 `⏰2`；含过期 ⇒ 警示形态；空 ⇒ 零段；消息 ⇒ 流内一行（原文） |
| T-TW26 | 正常·VSC 域文本 | `timerTurn`（手动档）⇒ 组合点 | 选中核 `TIMER_TURN_DOMAIN`；`upstreamTurn` 优先不回归 |
| T-TW27 | 边界·VSC 开关关 | `agent.timerWake = false` ⇒ 闩面 `sync` | 零注册 / 已注册者撤闩（与桌面 T-TW17 后半同判） |

**用例宿主**：T-TW14–T-TW16 → `thincoder-core/test/suspension.test.mjs`（原址补例；**修正轮补两桩**（非新号）：`clear` 先到先得用例 ∕ timer 轮中止容纳（±两反例用例））；T-TW17–T-TW21 → 新档 `thincoder-desktop/test/timer-wake.test.mjs`（T-TW21 亦落 `test/agent-host.test.mjs` 驱动面）；

T-TW22 → `thincoder-vscode/test/agent-lifecycle-singleton.test.mjs`（原址改例）；T-TW23–T-TW26 → 新档 `thincoder-vscode/test/timer-wake.test.mjs`（T-TW25 状态行面亦落 `test/status-line.test.mjs`；T-TW27 → 同档）；

  **修正轮补三桩**（非新号——随补注登记）：开关真链（`config.json` ⇒ 生产者真链 · 评审 🟡1）· 窗内 timer 轮中止容纳（`AbortError` ∧ 会话未停 ⇒ 容纳并重入 · ±两反例用例 · 评审 🟡2）· 触发落流（`timer { status:"fired", text }`——协议 §3.2 行 19）。

### 6.30.13 受影响文件清单（R24a · 行数 = 现盘实读（`wc -l` 口径））

**实施后重锚（2026-09-28 收尾轮 · 现盘实读）**：代码行读数（表）= `wc -l` 语义现盘实读；增量 = 轨迹标注；与并行批同片者并注「本档面」与「现盘」两值（并行批增量归其自身批档）。

| 文件 | 现行行数 | 实测增量 | 说明 |
|---|---|---|---|
| `thincoder-core/agent/suspension.mjs` | **280** | +40（240⇒280——含修正轮 +7） | `timerFace` opt-in + 等待第四态 + 兑现支（修正轮：timer 支 `AbortError` 容纳） |
| `thincoder-core/test/suspension.test.mjs` | **336** | +72（264⇒336——修正轮补例两桩后） | T-TW14–T-TW16 + 修正轮补例两桩（`clear` 先到先得 ∕ timer 中止容纳）；**已越 300 ⇒ 登记路**——登记注释 = `thincoder-core/test/core-hygiene.test.mjs:108-115`（拆分方案 ∕ 触发条件在册）  |
| `thincoder-desktop/src/main/timer-watch.mjs`（新档） | **79** | 新档（设计估 ~95） | 空闲 deadline 闩（键面 · 注入缝） |
| `thincoder-desktop/src/main/agent-host.mjs` | **341** | 该档（285⇒300 恰线）；现盘含并行批增量 | 两枚注入面（`busyOf` / `takeOver`）+ 透传——装配 ∕ 武装点 ∕ 撤闩落 `thincoder-desktop/src/main/suspension-drive.mjs`（实施期前提修正 · 源 = §5.9） |
| `thincoder-desktop/src/main/suspension-drive.mjs` | **269** | +73（196⇒269） | `timerFace` 装配 + 三武装点 + 撤闩 + 火面包装（轮后链尾接管）+ `driveTurn` 转发 |
| `thincoder-desktop/src/main/turn-face.mjs` | **70** | 该档（52⇒64）；现盘含并行批增量 | `timerTurn` 透传（核 opts 四件 ⇒ 五件） |
| `thincoder-desktop/src/preload/preload.cjs` | **59** | 位 16⇒17（该档——`ev:timer` 末位）；现盘 18 位 | `EVENT_CHANNELS` 白名单（名面同集同序） |
| `thincoder-desktop/renderer/events.mjs` | **497** | 该档（393⇒475）；现盘含并行批增量 | `ev:timer` 归约（`state.timerNotice` 切片） |
| `thincoder-desktop/renderer/views/chat.mjs` | **354** | 该档（338⇒354——设计轮 439 为拆档前值） | 流内触发行（与 `ev:digest` 行同族） |
| `thincoder-desktop/renderer/events-subscribe.mjs` | **77** | 该档（74⇒75）；现盘含并行批增量 | 订阅表随动（现盘 18 位——与桥面同集同序） |
| `thincoder-desktop/renderer/store.mjs` | **328** | 该档（307⇒310）；现盘含并行批增量 | `timerNotice: {}` 初态 |
| `thincoder-desktop/test/timer-wake.test.mjs`（新档） | **286** | 新档 | T-TW17–T-TW21 宿主 + 驱动面两例 + 渲染面一组  |
| `thincoder-desktop/test/host-floor.test.mjs` · `thincoder-desktop/test/agent-host.test.mjs`（随动） | **363** · **431** | 计数随动；两档现盘读数含并行批随动 | `host-floor` U76 计数 16⇒17 + `fresh` 入册；`agent-host` = T-TW21 驱动面  |
| `thincoder-vscode/src/agent/agent-state.mjs` | **158** | −1（159⇒158） | 复位行删除（端差消解） |
| `thincoder-vscode/src/agent.mjs` | **455** | −2（457⇒455） | 内联块改调核三件 |
| `thincoder-vscode/src/agent/turn-domains.mjs` | **37** | +2（35⇒37） | `timerTurn` 支 |
| `thincoder-vscode/src/agent/setup-reminders.mjs` | **141** | +1（140⇒141） | re-export 核 `TIMER_TURN_DOMAIN` |
| `thincoder-vscode/src/agent/setup.mjs` | **427** | +6（421⇒427） | 开关生产者：`agent.config.agent` 白名单增 `timerWake`（与 `autoThink` 同形——`thincoder-vscode/src/agent/setup.mjs:153` ∕ `:177` ∕ `:196` → 消费位 `thincoder-vscode/src/agent/agent-state.mjs:100`） |
| `thincoder-vscode/src/extension/timer-watch.mjs` | **74** | 新档后收编（117 ⇒ 74——B3 收编批 · 2026-09-29 实读） | 空闲 deadline 闩 + 交付点（`timer` 消息发射 = `:39`）；闩 ∕ 火面 = 核件消费（§6.30.16） |
| `thincoder-vscode/src/extension/suspension.mjs` | **483** | +36（447⇒483——含修正轮注释 +2） | 第三兑现态 + 兑现支 + 窗内容纳 |
| `thincoder-vscode/src/extension/panel-turn-stages.mjs` | **240** | +4（236⇒240） | 武装点 |
| `thincoder-vscode/src/extension/chat-panel.mjs` | **430** | +4（426⇒430） | `dispose` 撤闩 |
| `thincoder-vscode/src/extension/panel-callbacks.mjs` | **316** | +3（313⇒316） | `usage` 载荷增 `timers` |
| `thincoder-vscode/webview/status-bar.js` | **112** | +10（102⇒112） | `⏰N` 段 |
| `thincoder-vscode/webview/chat-messages.js` | **259** | +21（238⇒259） | `timer` 消息渲染 |
| `thincoder-vscode/webview/state.js` | **132** | +4（128⇒132） | 两计数槽 |
| `thincoder-vscode/locales/{zh,en}.json` | **271** | +1 / +1（270⇒271） | `status.timer` |
| `thincoder-vscode/test/timer-wake.test.mjs`（新档）等 | **396** | 新档（修正轮三例随补）；改例 `agent-lifecycle-singleton.test.mjs` 409⇒414 · `status-line.test.mjs` **239** | T-TW22–T-TW27 + `protocol-coverage` 面  |
| 文档：本档 §6.30 | **745**（全档实读——2026-09-28 修正轮重锚；口径 = 内容行数 ∕ `wc -l`） | +166（575⇒741——§6.30.10–§6.30.15 + 修正轮 ∕ 收尾轮随动） | §6.30.10–§6.30.15 |
| 文档：`docs/core/design/TOOLS.md` | **1137** | +3（1134⇒1137） | §6.7 timer 行支持面句 |
| 文档：`docs/vsc/design/WEBVIEW-PROTOCOL.md` | **657** | +8（649⇒657） | §3.2 两行 + §6.1 / §6.3 + §12 `timer` 行 + 变更记录 |

`thincoder-vscode/src/extension/suspension.mjs`（447 → **483**）：改动 = 既有等待原语增第三兑现态 + 既有状态机 +1 判据支（无新模块职责 / 无新导出族）⇒ **不拆**。

**桌面档面落点（持有面——2026-09-28 收尾轮已落；机制面不动）**：

- `docs/desktop/design/UI.md:116`（段 12 计时行——补触发落流 `ev:timer` 与新鲜度指针）；
- `docs/desktop/design/IPC.md:29`（事件表增 `ev:timer` 行）+ 载荷键集段 + 会话键面 / 订阅面计数（**18**——盘面现值）；
- `docs/desktop/design/RENDERER.md`（流内触发行承载句——现档无 timer 条，补一行）；
- `docs/render-core/design/RENDER-CORE.md` §10 F 行（新鲜度句：空闲期到期 ⇒ 闩到点即开轮，读数于该轮回合尾刷新）；
- `docs/desktop/design/E2E-TESTING.md`（D16 真机用例行——**已落**（`T-DSK44`）；真机档 `timer-wake-face.test.mjs` 未落（离线不可产组 ⇒ 人工走查 + 真跑闭合））。

### 6.30.14 验收标准（阶段 2 · 逐条回指）

| # | 验收点 | 判据 |
|---|---|---|
| A-TW8 | 端差裁定（#445 + 分类冲突） | §6.30.1 裁定句 + §6.30.11 消解落点（复位行删除 / 核三件改调）；现态以本档 D-TW3 为准 |
| A-TW9 | 核件 opt-in（零行为变化） | §6.30.10 接口契约逐键在位；T-TW14–T-TW16 全绿（零回归 + 窗内兑现 + 零交付） |
| A-TW10 | 桌面自唤醒 + 可见面 | §6.30.11 桌面块逐条落点（闩 / 装配点 / 火面 / 透传 / `ev:timer`）；T-TW17–T-TW21 全绿；**D16 真机义务在册**（改可见面 ⇒ 真 Electron 使用面用例，验收由父侧真跑闭合——需求档 `docs/desktop/requirements/PROJECT.md:153`） |
| A-TW11 | VSC 自唤醒 + 可见面 | §6.30.11 VSC 块逐条落点；T-TW22–T-TW27 全绿；协议增量登记 = `docs/vsc/design/WEBVIEW-PROTOCOL.md` §3.2（两行） |
| A-TW12 | 口径收正（B3） | §6.30.5 表桌面 / VSC 行 ✅；§6.30.9 边界 1 指向阶段 2；`docs/core/design/TOOLS.md` §6.7 timer 行支持面句；timer 工具描述端限定句 = 父侧逐字定稿（§6.30.3 合同句） |
| A-TW13 | 机检零新增 | 仓根 `node scripts/doc-check.mjs --root .`——对比开工基线（悬空 / 行宽字面随实施轮实测登记）；文档逐档零新增 |

### 6.30.15 边界（阶段 2）

1. 阶段 1 面零改（阶段 2 边界）：CLI 闩 / CLI 挂起窗 / 核三件 / 域文本 / 帽 / 开关语义逐字不动——**CLI 闩面随 B3 批改指核件（§6.30.16；机制语义零变）**＋**核件档头注释一行（`timers.mjs:16` 双写窗口句收正——同批）**；余五面仍逐字不动。
2. timer 参数 schema 零改——**阶段 2 边界**（timer-completeness 批扩五参——见 §6.30.18）；**不新增机械门**（动作域 = 系统轮既有机械面沿用）。
3. headless（`chat` / ACP / 直连 `runAgent`）自唤醒面零变化（无空转面 ⇒ 零闩）。
4. **不碰在途批文件增量**（`desktop-idle-wake` 收口中 / `desktop-vsc-align-2` / `desktop-vsc-align-3`）——实施方案与在途批同片（桌面 main / renderer · vscode）⇒ **排后串行**；桌面档面落点 = 持有面（§6.30.13 末块），**已落**（2026-09-28 收尾轮）。
5. `/timers` 取消面不做（阶段 1 既有边界沿用）；不接模型门控。
6. 渲染面零定时器纪律沿用（桌面渲染面零 `setTimeout` / `setInterval`——触发面全在主进程闩）。

### 6.30.16 端面收口 · VSC ∕ CLI 改指核件

**来源**：parity 收编批（归批表 B3——annex + 重造③ + 上提②）；本节单源承载删留账与实施序。

**现状坐标（as-of 2026-09-29 收编后实测 · 113 内容行）**：核 `thincoder-core/agent/timers.mjs`——`createTimerWatch:79` ∕ `fireTimerWake:105` ∕ `timerWakeEnabled:61` ∕ `deliverExpiredTimers:69`（设计不动；档头 `:16` 双写窗口句随此收正）。

桌面（对照组 · 已合规）= `thincoder-desktop/src/main/timer-watch.mjs:11-17`（核直取 + 判据 re-export）· `:22`（交付 = 核派发 + `ev:timer` 出词）· `:34-63`（键面表壳包核闩）· `:70-75`（火面 = 核策略 + 端两缝）——代码零触。

VSC 自持点 = `thincoder-vscode/src/extension/timer-watch.mjs:33-35`（判据副本）· `:46-64`（闩副本）· `:94-100`（火序列自持）；CLI 自持点 = `thincoder-cli/src/tui/timer-watch.mjs:24-26`（判据副本）· `:59-76`（闩副本）· `:43-48`（派发序列）· `:93-100`（火序列自持）。

**改指后接线（设计定稿）**：

| 端 | 核导入面（增 ∕ 换源） | 留端面（不迁 ∕ 不核包装） |
|---|---|---|
| VSC | `createTimerWatch`（本地闩副本退场）· `fireTimerWake`（火序列改核策略 + 端两缝：`busy` = `turnBusy` 判据 ∕ `openTurn` = `runChat`） | 交付适配（注入目标 = 会话活线 ∕ 活动线 · 空闲路 `_saveLines` 落盘 · `timer{status:"fired",text}` 发射——注入目标 ≠ `agent.history` ⇒ 不核包装；两原语 `takeExpiredTimers` ∕ `injectTimerReminders` 沿用）· 装配 `syncTimerWatch` ∕ 武装 ∕ 撤闩点不动 |
| CLI | `createTimerWatch`（经转口——签名 `{agent,onFire,timer,clear,now}` 零变；`{getAgent: ()=>agent}` 冻结捕获）· `deliverExpiredTimers`（+`onLine` = 显示裁 `pushLine(reminderDisplay(line), C.warn)`）· `fireTimerWake`（火序列改核策略）· `timerWakeEnabled`（re-export 转口） | 判据族（`timerWakeArmed` ∕ `modalOpen`）· 显示裁 `reminderDisplay` · 交付 ∕ 火转口（签名与返回零变——存量批测冻结面） |

**零变不变量（核对点）**：① 闩——武装 ∕ 到点自撤 ∕ 重臂撤旧 ∕ `unref` ∕ 开关关零注册；② 交付——出列幂等 → 注入单源逐字 → 落流 ∕ 发帧；

③ 火——非空闲零动作（VSC = `turnBusy` 真 ∥ 无 agent；CLI = `processing ∥ suspended ∥ _suspPending ∥ modalOpen`）+ 零交付零开轮 + 开轮形 `{ autoTurn: true, timerTurn: true }`；④ 端面 API——CLI 导出面逐名零变；VSC 导出面 −1（`createTimerWatch` 退场——实读零消费者），其余签名零变。

  **`busy` 键登记**（§6.30.19）：核 `createTimerWatch` 选项集 = `{ getAgent, onFire, timer = setTimeout, clear = clearTimeout, now = Date.now }` **增 `busy = () => false`**（构造期注入 · additive）；三端转口选项集 = `{ agent, onFire, timer, clear, now }` **增 `busy`**——其余键名与返回形（`{ sync, disarm }`）逐名零变，`sync()` 参数表仍为空。

**对拍法与用例**（先例 = R4 差分探针 `.thincoder/tmp/r4-diff-probe.mjs` 同法）：OLD 逐字拷贝 × NEW 端模块现值，同假钟同序列 ⇒ 可观察日志逐项相等；**改前先跑绿 → 改后同文件零改直跑仍绿**。用例宿主 = 单元测试档（已落）：

| # | 场景 | 输入 | 预期 |
|---|---|---|---|
| T-TW28 | 正常·CLI 闩转口等价 | 假 timer + 在途一项（+N ms）——`createTimerWatch({agent,…})` | 核闩注册恰一次 · 延迟 = 最早到期差 · `unref` 被调；无在途 ∕ 开关关 ⇒ 零注册并撤旧；`sync()` 返延迟 ∕ `null` |
| T-TW29 | 正常·CLI 触发全径（唤醒） | 假 timer 到点（空闲态） | 出列 + 历史注入恰一条 + `pushLine` 落流恰一行（显示裁）+ 开轮桩收 `{autoTurn,timerTurn}` 恰一次；返 true |
| T-TW30 | 边界·CLI busy ∕ 模态零动作 | `processing` ∥ `suspended` ∥ `_suspPending` ∥ `modalOpen` | 零送达 ∕ 零开轮 ∕ 在途不动 ∕ 返 false |
| T-TW31 | 边界·CLI 交付幂等 | 到期两条 ⇒ 送达两条；随后二次调用 | 原文逐字 + 显示裁行恰两条；二次零返（零重复投递） |
| T-TW32 | 正常·VSC 触发全径（发帧） | panel 桩 idle + 假 `runChat` + 到期件 | 注入目标行 + 空闲路落盘 + `timer` 消息恰一条/条 + `runChat` 收 `{autoTurn,timerTurn}` 恰一次 |
| T-TW33 | 边界·VSC busy ∕ 无 agent | `turnBusy()` 真 ∥ `_agent` 空 | 零交付 ∕ 零开轮 ∕ 零发帧 |
| T-TW34 | 正常·VSC 装配 | `syncTimerWatch(panel)`——在途一项 ∕ 零项 | 返延迟 ≈ 最近到期差 ∕ 返 `null`（零注册）；`disarm()` 后重 sync 零注册 |
| T-TW35 | 对拍·改指零变 | OLD（改前逐字）× NEW（端模块现值）同假钟同序列——闩 ∕ 交付 ∕ 火三面 | 可观察日志 `deepEqual`（CLI 火六径 ∕ VSC 火四径） |

**实施后重锚清单**（实施轮 §5 记实测读数；设计面随收正）：① §6.30.10「关的射程」CLI 行指针（`thincoder-cli/src/tui/timer-watch.mjs:67-68` ⇒ 核闩内判据）与「闩边界面收口」块指针（`:80` ∕ `:96` ⇒ `:47-48` ∕ `:60`）——**均已落（2026-09-29）**；

② `docs/vsc/design/WEBVIEW-PROTOCOL.md` §12 `timer` 行 ② 列（`thincoder-vscode/src/extension/timer-watch.mjs:83`——提取器档已随全清令退场，人工读值重锚）；③ §6.30.5 两行 ∕ §6.30.11 两 bullet 的「行数实施后重锚」标记；④ 设计估行数 ⇒ 实施后实测；

⑤ `thincoder-core/agent/timers.mjs` 行数 ∕ 面描述（旧读「50 行 · 三件纯函数」= R4 上提前读数——已扩面：闩 ∕ 派发 ∕ 火策略住核 `createTimerWatch:79` ∕ `fireTimerWake:105`；与 §6.30.2 ∕ §6.30.6 同址注同拍——**已落（2026-09-29 · 113 内容行）**）。

**边界（不做）**：核件重设计（仅档头 `timers.mjs:16` 双写窗口句收正——该轮即其迁移轮）· 桌面代码 ∕ 文件行零笔 · B1 ∕ B2 ∕ B4–B10 各族与 `#564` 在途面 · 挂起窗「窗内起算面未包判据」在册项（行为变更——另轮）· 协议面（**坐标重锚 ≠ 协议语义变更**——`docs/vsc/design/WEBVIEW-PROTOCOL.md` §12 指针重锚在册 = 本 § 重锚清单②）∕ 门三件 ∕ 在途帽 ∕ 域文本 ∕ 开轮形 ∕ 显示裁语义（§6.30.3 合同逐字沿用）。

**验收（端面接线面）**：① 两端档无自持闩体（结构核 = 档内无 `handle` 槽管理 ∕ 无 `unref` 调用）且导入面含核 timers；② 全径用例 + 对拍全绿 + 存量批测 r8 直跑绿；③ 端面 API 零变（CLI 逐名 ∕ VSC 除 `createTimerWatch` 退场外逐名）。本节验收 = 本档 §6.30.16。

### 6.30.18 timer 能力完备化——绝对时刻 ∕ 固定间隔 ∕ 日历式 ＋ 取消 ∕ 可见

**需求对位（功能点 45 ①–⑤ · AC-45——`docs/server/requirements/PROJECT.md:266-275` ∥ 同档 `:341`）**：① 绝对时钟时刻（设「到某时刻」⇒ 该时刻投递，含过时点即时口径）；② 固定间隔（「每 N 分钟」⇒ 首投 + 每拍续投，取消即止）；③ 日历式（「每天 HH:MM」⇒ 本地时区每日一投；跨日 ∕ 重启口径明示）；④ 一次性倒计时保留零变；⑤ 周期项可见 ∕ 可取消（承载 = 本节定 ∥ 机检）。

落点 = **核**（用户 2026-10-12 15:25 裁「定时设计要四端都做」）——CLI ∥ VSC ∥ 桌面 ∥ 服务面经核件同得，端面零专属实现。

**机制句（一句话）**：载体条目**增量可选字段** ＋ 到点**重排**（重排点 = 核出列件 `takeExpiredTimers` 内——出列＋重排同为一次原子操作）＋ 工具面四式参数与 `cancel`/`list` 两动作。逐端零改：一切消费面（回合边界 ∥ 空闲闩 ∥ 挂起窗 ∥ 服务面投递）皆经该出列读点 ⇒ 周期续投自动四端同得。

**载体扩展（增量可选 · 零迁移）**：条目形扩两**可选**字段——`everyMs`（毫秒数 · 固定间隔）∥ `daily`（`"HH:MM"` 字符串 · 日历式）；一次性条目形 = `{ id, expiresAt, message }` **逐字零变**（D-TW2 ∕ D-TW3 ∕ D-TW6 保持）；`at` 条目携 `at: true` **来源标记位**（非载重——显示面判形用；时刻单源 = `expiresAt`；机制面零变）；三式互斥由工具面保证（核重排不判互斥）。**零迁移**：载体纯进程内（D-TW3 无盘面格式）——重启即失 = 既有语义（口径见下）。

**重排（新 · 出列＋重排原子）**：`takeExpiredTimers`（`thincoder-core/agent/timers.mjs:38-44`）出列到期项时，对携 `everyMs`/`daily` 者**同 id 克隆回插**新 `expiresAt = nextFireAt(t, now)`（严格 `> now`）；一次性 ∕ 绝对时刻条目照旧被消费（无重排）。

- **为什么在 take 内**：take 是全部消费面的公共读点（回退面回合边界 = `thincoder-core/agent/post-turn.mjs:21`（驱动面径随 §6.34 退场——取件读点不变）∥ 空闲闩 ∥ 挂起窗 ∥ 服务面 = `thincoder-server/src/agent/chat-env-tools.mjs:218-225`）⇒ 一处改动、四端零改获得续投；且重排先于交付 ⇒ 「到点即重排」与「交付幂等」互不依赖（二者之间中断 ⇒ 该拍投递丢、周期不灭——与「错过即跳」同族）。

**`nextFireAt(entry, now)`（新纯函数 · 出核 `thincoder-core/agent/timers.mjs`）**：

- **固定间隔**：`base = entry.expiresAt`（= 首设刻）；`k = max(1, floor((now − base) / everyMs) + 1)`；返 `base + k × everyMs`。基准 = 首设刻 ⇒ **零漂移**；错过任意拍 ⇒ 直落下一格（**跳过不补投**——一次出列对一条周期项至多一投）。
- **日历式**：`HH:MM` 按**宿主本地时区**解算（`Date` 本地语义：`setHours`/`setMinutes`；DST 按宿主日历规则走，不作特例）——取**严格 `> now`** 的下一 occurrence（今日该刻未过 ⇒ 今日；已过 ⇒ 明日）；秒位归零（该刻整分投递）。
- 一次性 ∥ 绝对时刻（无两字段）⇒ 返 `null`（无重排）。守卫：`everyMs` 非有限正数 ∥ `daily` 形不合 ⇒ 返 `null`（照消费——防御面；下限校验在工具面）。
- **首设换算同函数**：`every` ⇒ `nextFireAt({ everyMs, expiresAt: now }, now)`（= 设时 + N）；`daily` ⇒ `nextFireAt({ daily }, now)`；`at` ⇒ 直解算（不经本函数）；`TIMER_MIN_EVERY_MS` = 60000 常量同档出。

**时区 ∥ 跨日 ∥ 重启口径（AC-45③ 明示）**：时区 = **宿主本地**（先例 = METERING KD-SV-6 服务器本地）——`at`/`daily` 皆按设点宿主本地时钟解释；同机四端同时区（服务面 = 服务器本地）。跨日 = `Date` 日历运算承载（如 `daily: "00:01"` 于 23:59 设 ⇒ 明日 00:01）——无跨日特例代码。重启 = **周期项随进程消失**（D-TW3 进程内存语义——与一次性同命，非新增缺口；重启存续 = 不做，见边界）。

**工具面（`thincoder-core/agent-tools/timer.mjs` · 226 行）——参数 ∥ 互斥 ∥ 校验 ∥ 返回**：

- 新参：`at`（`YYYY-MM-DDTHH:MM[:SS]`——严格正则＋日历回读校验（如 `2026-02-30` 拒）· 本地时区）∥ `every`（秒数 · ≥ `TIMER_MIN_EVERY_MS`）∥ `daily`（`HH:MM` 严格正则）∥ `cancel`（id——`String` 宽松比对）∥ `list`（布尔）。
- 互斥：`{ seconds, at, every, daily }` 至多一；`cancel` ∥ `list` 与一切设置式互斥、与彼此互斥。
- 校验（逐条显式抛错——不静默钳制）：`every` 非有限 ∥ < 60s ⇒ 拒（文案含下限）；`at` ∥ `daily` 形不合 ⇒ 拒（文案含期望形）；`list` 在场须恰为 `true` ⇒ 否则拒（防 `{list:false}` 静默落缺省）；互斥违例 ⇒ 拒（文案列合法式）。
- **首投 = 设时 + N**（`every`——非立即，防「设置即投」双投感）；`at` 过时点 ⇒ `expiresAt` = 所给刻（`delay = 0` ⇒ 即时投递——AC-45① 口径；不重排）；`daily` 过刻 ⇒ **明日**（非即时——「每天 HH:MM」= 每日该刻语义）。
- **id 唯一化**（取消可寻址）：基准读**时钟缝单点**（缺省 `Date.now()`）与在途撞号 ⇒ `+1` 递增至空闲（同毫秒二次设置可达——零新载体字段）。
- **时钟缝（评审轮 1 #5 收正）**：工具面取时单点 = `const now = ctx.now ?? Date.now()`（毫秒数**可选**读——生产 `toolCtx`（`thincoder-core/agent/dispatch-run.mjs:97-106`）不携 `now` ⇒ 缺省回落 = 现行为零变）；`at` 过时判定 ∥ `every`/`daily` 首投换算 ∥ id 撞号基准皆读该点。单元测试档以假 ctx（`{ agent, now: 假钟 }`）直驱——每调用独立 ctx ⇒ 零模块级状态 ∕ 零复位需求。
- **帽 8 = 占坑语义（D-TW15）**：周期项 1 条 = 1 坑；重排 = 原条目回插（**净零**——不触帽）；`cancel` 释放坑。周期豁免不采。
- `cancel`：按 id 移除（零匹配 ⇒ 显式抛错 · 文案含 `list` 指引）；`list`：只读枚举（剩余现算——`due now` 态照出）。
- **返回文案（新增式逐字——一次性式零变）**：
  - `every` ⇒ `Repeating timer set (id <id>): first reminder in <N> seconds, then every <N> seconds. Stop it with cancel id <id>.`
  - `daily` ⇒ `Daily timer set (id <id>): next reminder <YYYY-MM-DD HH:MM> local, then every day at <HH:MM>. Stop it with cancel id <id>.`
  - `at`（未来）⇒ `Timer set (id <id>) for <YYYY-MM-DD HH:MM> local. Stop it with cancel id <id>.`
  - `at`（已过）⇒ `Timer set (id <id>) for <YYYY-MM-DD HH:MM> local — that time has passed, so the reminder appears immediately.`
  - `cancel` ⇒ `Timer cancelled (id <id>).`；`list` 空 ⇒ `No pending timers.`
  - `list`（非空）⇒ 逐行 `<id> · <kind> · next <dur> · <message 首行>`（kind 判形 = `at` 在场 ⇒ `at <YYYY-MM-DD HH:MM>`；`everyMs` ⇒ `every <N>s`；`daily` ⇒ `daily <HH:MM>`；三者皆无 ⇒ `one-shot`；`<dur>` = `<mm:ss>`（< 1h）∥ `<h:mm:ss>`（≥ 1h——h 不补零；`daily` ∥ `at` 长时长同形；与 `/timers` 行同判）；到期未投 ⇒ `due now`）。
  - **非有限 `expiresAt`（`NaN` ∥ `±Infinity`）⇒ `at` 段不插、落 `one-shot · due now`**（守卫 = `thincoder-core/agent-tools/timer.mjs:53`/`:60`）。
  - **一次性式逐字零变**（`Timer set for <N> seconds. A reminder will appear when time is up.`）且不携 id（零回归口径；其取消可经 `list` 寻址）。

**默认 `message`（`message` 未传时——逐式 · 评审轮 1 #4 收正）**：`⏰ Time's up (<槽>). Have you tried running the code, adding a console.log, or checking the output? Thinking more without data is guessing.`

  槽逐式 = `${seconds}s`（一次性式——逐字零变）∕ `at ${YYYY-MM-DD HH:MM}`（`at`——解析刻宿主本地）∕ `every ${N} seconds`（N = `every` 秒值）∕ `daily at ${HH:MM}`；显式 `message` ⇒ 逐字原样（既有语义零变）。
- **描述面（`thincoder-core/tool-docs/timer.md` · 6 行）**：扩述三式 ＋ 下限 ＋ `cancel`/`list`；**逐字文本 = 机制文档定稿**（D-TW8 同口径；草稿位 = 本节，落 = 实施轮 · eng-coder）。
  **预算读数（评审轮 1 #10）**：扩档 ⇒ **收口轮复跑 `node scripts/tool-schema-size.mjs` 登记读数随动**（先例 = 读数随动入 §5；预算表唯一权威处 = `docs/core/design/PROMPT-SYSTEM.md` §6.11——链 = `docs/core/design/TOOLS.md` §6.9）。

**可见面 ∥ 取消面（功能点 45⑤ 承载）**：模型面 = `list` 动作（四端同得）。`/timers`（CLI）逐条行**插入 kind 段**——`⏰<i> · <kind> · 剩余 <dur> · <message 首行>`（kind = `每 <N>m`（整分）∕ `每 <N>s`（非整分）∥ `每天 <HH:MM>` ∕ `于 <YYYY-MM-DD HH:MM>`；

判形 = `at` 在场 ⇒ `于` 段；`everyMs` ⇒ `每` 段；`daily` ⇒ `每天` 段；三者皆无 = 一次性 ⇒ 零段；`<dur>` = `<mm:ss>`（< 1h）∥ `<h:mm:ss>`（≥ 1h）；**一次性行零变**——段仅非一次性项插入）；

  档 = `thincoder-cli/src/tui/cmd-timers.mjs`（33 行）。

取消面 = **模型工具面**（`cancel` 动作——四端同得）；**不设端专属取消 UI**（CLI `/timers cancel` 子命令等 = 新跨端差异 = 不许）；`/timers` 保持**只读**（其档头 ∥ `docs/cli/design/TUI.md` §7.6「取消面不做」句按此收正为「取消 = 模型 `cancel`」）。状态行 `⏰N` ∥ VSC ∥ 桌面投影 `{ count, expired }` = **零改**（计数式——周期项同计，读 `expiresAt` 单字段不动）。

**attention 面口径（周期项 × awaiting 除外——评审轮 1 #3 收正）**：周期项在途 ⇒ `_pendingTimers` 恒非空 ⇒ `docs/cli/design/TUI.md` §7.1 表 awaiting 行除外（在途 timer ∧ 唤醒会武装）**恒生效**——「不计 awaiting」由一次性瞬态变会话常态。

  **裁定 = 有意语义**（与一次性项同谓词同读法：除外理由 = 自动续跑在途；周期项 = 持续自动续跑在途——无特判必要）；退出径 = `cancel` 释放坑 ∥ `agent.timerWake` 关（照常置位）；状态行计数面照零改。同拍 = `docs/cli/design/TUI.md` §7.1 ∥ §7.2。

**接缝（唤醒面 = 兄弟批，接口零增）**：`docs/server/design/agent/ADMIN-AGENT.md` §15——四端投递皆经核 `takeExpiredTimers`（或其在各端的转口 ∕ 直调——服务面直调 = `thincoder-server/src/agent/chat-env-tools.mjs:224`）⇒ 周期重排**免费搭车**；

  其再武装读 `pendingTimerDeadline`（重排后自动落新到期点）⇒ 唤醒器 ∥ 挂起窗 ∥ 空闲闩零改。**只引不重设计**；实施排期 = 彼批落地后（同片 `chat-env-tools.mjs` 串行）。

**服务面审计面**：`subjectOf("timer", …)`（`thincoder-server/src/agent/chat-env-tools.mjs`）按 `at`/`every`/`daily`/`cancel`/`list` 分支各出主语（原文直出式——`cancel <id>` ∥ `list` ∥ `at <原文>`[ `<message>`] ∥ `every <N>s`[ `<message>`] ∥ `daily <原文>`[ `<message>`]）；一次性式（含缺省 ∥ `message` 缀）逐字零变。

**受影响文件清单（现读 = 实读 2026-10-16）**：

| 文件 | 现读 | 增量 | 说明 |
|---|---|---|---|
| `thincoder-core/agent/timers.mjs` | **164** | +≈50 | `TIMER_MIN_EVERY_MS` ∥ `nextFireAt` ∥ take 重排 ∥ 档头「唯一写点」句收正（出列也写） |
| `thincoder-core/agent-tools/timer.mjs` | **226** | +≈75 | 五参 ∥ 互斥 ∥ 校验 ∥ `cancel`/`list` ∥ 返回文案 ∥ 时钟缝（`ctx.now`） |
| `thincoder-core/tool-docs/timer.md` | **13** | +≈8 | 描述面四式（逐字 = 机制文档定稿） |
| `thincoder-cli/src/tui/cmd-timers.mjs` | **70** | +≈8 | kind 段 ＋ `<dur>` 格式 ＋ 档头取消面句收正 |
| `thincoder-server/src/agent/chat-env-tools.mjs` | **328** | +≈12 | `subjectOf` timer 分支（同片串行——排兄弟批后；坐标按届盘实读） |
| 单元测试档 | —— | **新 ≈320** | 四用例 ＋ 回归用例（已落 · 实施轮落）——**不入 server 门禁链**（批面非服务） |
| `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` | **1153** | +≈150 | 本节 ＋ D-TW7 行 ∥ §6.30.3 三处收正 |
| `docs/core/design/TOOLS.md` | **1243** | +1 | §6.7 `timer` 行扩述 |
| `docs/cli/design/TUI.md` | **737** | +≈6 | §7.6 行形态 ＋ 取消面句收正 |

**零改面（明示）**：`thincoder-core/agent/post-turn.mjs` ∥ 三端 `timer-watch.mjs` ∥ 三端 `suspension*.mjs` ∥ `thincoder-desktop/src/main/agent-host.mjs` ∥ `thincoder-vscode/src/extension/panel-callbacks.mjs`

∥ `thincoder-cli/src/tui/render-frame.mjs` ∥ `thincoder-cli/src/tui/agent-turn.mjs` ∥ `thincoder-cli/src/tui/tool-events.mjs`。

**关键决策（D-TW9–D-TW17）**：

| # | 决策 | 落 | 理由 |
|---|---|---|---|
| D-TW9 | 载体扩**扁平可选字段** `everyMs` ∥ `daily` | 采纳 | 一次性条目形逐字零变（回归最小） |
| D-TW10 | 重排点 = `takeExpiredTimers` 内（出列＋重排原子） | 采纳 | 公共读点唯一 ⇒ 四端零改 |
| D-TW11 | 错过拍 = **跳过不补投**（严格 `> now`） | 采纳 | 回补 ⇒ 投递风暴；与「出列幂等」同族（一次出列一条周期至多一投） |
| D-TW12 | 首投 = 设时 + N ∥ `daily` 下一本地刻 ∥ `at` 过时点即时 | 采纳 | AC-45① 明写过时点即时；周期无「立即」语义（+N 防设置即投） |
| D-TW13 | 时区 = 宿主本地（DST 不特例） | 采纳 | 先例 = METERING KD-SV-6 |
| D-TW14 | 取消/可见 = 模型 `cancel`/`list` ＋ `/timers` kind 段；**不设端专属取消 UI** | 采纳 | 四端同得纪律 |
| D-TW15 | 帽 8 = **占坑**（周期 1 条 1 坑 · 重排净零） | 采纳 | 成本闸语义（周期 = 最贵类） |
| D-TW16 | `every` 下限 = **60s 硬拒** | 采纳（**提请**） | AC 判据以 1 分钟实走 ⇒ 下限 ≤ 60s；更低 ⇒ 回合风暴 |
| D-TW17 | 低费式（只出提醒行不开轮）= **不做** | 采纳（**提请**） | 现语义 = 到点自唤醒 + 开轮（D-TW4）；quiet 化 = 语义分叉（须用户裁）；接口缝已在（`thincoder-core/agent/timers.mjs:105` `fireTimerWake({ busy, deliver, openTurn })`——跳过 `openTurn` 即 quiet 火） |

**用例表（T-TW40–T-TW50——T-TW40–T-TW49 落单元测试档（已落 · 实施轮落）∥ T-TW50 落单元测试档（实施轮落）；
恒假钟 ∥ 直驱 · 零真实等待；时钟缝 = 工具面 `ctx.now`（缺省 `Date.now()` 回落——生产零变）∥ `nextFireAt` / `takeExpiredTimers` 的 `now` 参数沿既有缝；跑法 = 仓根 `node --test <单元测试档>`）**：

| # | 场景 | 输入 | 预期 |
|---|---|---|---|
| T-TW40 | 正常·绝对时刻（未来） | `timer { at: <now+2h> }`（假钟） | 条目 `expiresAt` = 解析刻；返回含 `(id `；到点出列恰一条；在途清空（不重排）；缺省 `message` = `at` 形（默认表） |
| T-TW41 | 正常·绝对时刻（已过） | `timer { at: <now−10m> }` | `expiresAt` = 所给刻（delay ≤ 0 ⇒ 即时）；首取即交付；在途清空；缺省 `message` = `at` 形（默认表） |
| T-TW42 | 正常·固定间隔（**AC 实走形**） | `{ every: 60, message: "x" }` ＋ 假钟 | 首投 = 设时 + 60s（`ctx.now` 假钟——精确断言）；出列后条目仍在（同 id · `expiresAt` = 设时 + 120s）；二投同判；`cancel` 后出列零返（**投 2 次后可取消**） |
| T-TW43 | 边界·错过跳拍 | `every` 600s · 假钟跳 3.5 拍 | 出列恰一投；重排 = `base + 4 × everyMs`（严格 `> now`）；零补投；缺省 `message` = `every` 形（默认表） |
| T-TW44 | 正常·日历式（含跨日 ∥ 过刻） | `daily: "09:00"`（假钟 08:59 ∥ 09:01 ∥ 23:59 设 `"00:01"`） | 首 = 今日 09:00 ∕ 明日 09:00 ∕ 明日 00:01（`ctx.now` 假钟）；投后重排 = 次日同刻；缺省 `message` = `daily` 形（默认表） |
| T-TW45 | 回归·一次性零变 | 旧形条目 `{ id, expiresAt, message }` ＋ 存量单元测试档复跑 | 交付行逐字 ∥ 返回文案逐字 ∥ 出列幂等 ∥ 帽行为全零变；存量 timer 唤醒投递测试档全绿 |
| T-TW46 | 错误·校验矩阵 | 互斥违例 ∥ `every: 30` ∥ `every: 0` ∥ `at: "2026-02-30T10:00"` ∥ `daily: "9:00"` ∥ `cancel` 未知 id | 逐条显式抛错；在途表零变动 |
| T-TW47 | 边界·帽（占坑） | 在途 8（含周期 1）⇒ 第 9 拒；`cancel` 一条 ⇒ 复设成功；周期重排后仍 8 | 拒点零变动；重排净零；取消释放 |
| T-TW48 | 边界·重启即失 | 同 cwd 二次装配（新 agent 对象） | 在途表空（进程内语义——与一次性同命） |
| T-TW49 | 正常·可见面 | 工具 `list`（三类 ＋ 到期未投）∥ CLI `/timers` handler 直驱 | `list` 逐行含 id/kind/next/message（`due now` 态照出；长时长分支 ⇒ `<h:mm:ss>`）；`/timers` 周期行含 kind 段（非整分 ⇒ `每 <N>s`）∧ 一次性行逐字零变 |
| T-TW50 | 射程·服务面审计主语 | `subjectOf("timer", …)` 五式直驱 | 各出对应主语；一次性式逐字零变 |

**验收（A-TW14–A-TW19——逐条机检）**：

| # | 判据 | 落点 |
|---|---|---|
| A-TW14 | 需求 ①–⑤ 逐条对位（三链同源） | 功能点 45（`docs/server/requirements/PROJECT.md:266-275`）∥ AC-45（`:341`）↔ 本节用例 —— 两链同源同拍 |
| A-TW15 | AC-45 判据（实走形） | 假钟用例 = T-TW42（1 分钟两投后取消）；收口轮真走（父侧：设 1 分钟间隔 ⇒ 两投 ⇒ `cancel` ⇒ 零再投） |
| A-TW16 | 一次性零回归 | T-TW45 ∥ T-TW49（一次性行）∥ 存量单元测试档复跑全绿 |
| A-TW17 | 四端同得（零改面守） | 零改面清单 ＋ 消费面全经 take（接缝句）；服务面随彼批部署收口 |
| A-TW18 | 口径明示（AC-45③） | 时区 ∥ 跨日 ∥ 重启三口径句（本节）在册 |
| A-TW19 | 机检零新增 | 仓根 `node scripts/doc-check.mjs --root .` 对比开工基线（2026-10-12 设计轮实测：**悬空 25 ∥ 行宽 0 ∥ 行数面 18 报告**——四档逐档零新增） |

**边界（不做）**：cron 全语法 ∥ 条件触发（「当 X 发生时」——非定时）∥ 持久化 ∥ 重启存续（D-TW3 既有语义）∥ 端专属取消 UI ∥ 唤醒器设计（兄弟批）∥ 一次性 `seconds` 语义 ∥ 文案零变 ∥ 低费式（提请项）∥ 子代理 timer 面（读对象 = 主 agent——既有构造性边界）。

**开放点（提请项 · 均附推荐与代价——请裁）**：① 频率下限（D-TW16——推荐 60s；更松 ⇒ 回合费用升，更紧 ⇒ 可设更密）② 低费式可做性（D-TW17——接口缝已在；代价 = 「到点自动看/续」语义分叉）③ 帽语义（D-TW15——推荐占坑）④ 可见面承载（推荐 = 模型 `list` ＋ `/timers` kind 段；更富端面 UI = 各端新面，不做面）。

**落文口径（评审轮 1 #6——推荐值已入册 · 待裁）**：①（D-TW16）∥ ③（D-TW15）推荐值已随本设计落成规范文（`docs/core/design/TOOLS.md` §6.7「下限 60s」∥ 帽句 · §6.30.3 帽注 · 本节校验句 · T-TW42 ∥ A-TW15 实走形）——**待用户裁**；裁定异值 ⇒ 相应档同拍收正（收正点清单 = 本档 §6.30.18）。②（D-TW17）∥ ④ 未落文（不做面——裁可 ⇒ 另轮）。
### 6.30.19 唤醒轮内到期 timer 的送达时点（防自旋口径）

**问题**：交付轮（digest ∥ 上行唤醒轮 ∥ timer 轮）运行期间到期的 timer，现行链上轮内不投递；件不丢（在途表 `_pendingTimers` 未动），但「最近送达时点」没有规范句 ⇒ 表现为静默延迟。

**实读的三处投递点**（`thincoder-core/agent/timers.mjs`）：

- 空闲闩 `createTimerWatch:130`——`delay = max(0, deadline − now)`（`:142`）；到点 `onFire` 后句柄置空（`:143`）；`sync()` 只在被调用时（重）武装。
- 火策略 `fireTimerWake:156`——`busy` 真 ⇒ `return false`（`:160`），在途表零触碰，**且不重武装**。
- 挂起窗第四态 `suspension.mjs:305`——`why === "timer" && deliver() === true` ⇒ 开 timer 轮；循环重入后 deadline 现算（`:298-299`）；池空退出（`:295`）。

**自旋会不会真的发生（实读论证）**：

- 挂起窗内有上界：窗由池活开启（`:295`），池空即退 ⇒ 窗内续跑受池生命周期约束。
- 前台空闲链（`createTimerWatch` + `fireTimerWake`）**没有等价上界**。若选「轮内也消化」，即每轮链尾发现新到期就再开一轮：交付轮时长 ≥ 到期周期（`every` 下限 60s，长轮常见）时，轮尾恒有到期 ⇒ 轮轮相接无上界。**自旋在真实条件下成立，不是想象。**

**裁定（维持现状 + 规范句；机制半边只补「闩不空转」）**：

1. **送达时点规范句**：交付轮运行期间到期的 timer，**最近送达时点 = 该轮结束后的空闲面判定**——前台 = 链尾闩（重）武装后的首次 fire；挂起窗 = 下一轮等待态现算 deadline 的兑现支；回退面（headless ∥ ACP ∥ 直连 `runAgent`）= 下一回合边界（`post-turn.mjs:21`，逐字保持）。**轮内不投递。**
2. **防自旋口径：闩只在空闲态武装**——缝形**唯一** = 构造期注入（`sync()` 不收参数）：
   `createTimerWatch({ getAgent, onFire, timer = setTimeout, clear = clearTimeout, now = Date.now, busy = () => false })`；
   `busy()` 真 ⇒ 撤闩零注册、`sync()` 返 `null`（忙期不产生 0ms 循环）。火侧 `busy ⇒ return false` 逐字保持（在途零触碰）。

   **调用点与归位先后**（谁清 ∥ 在哪清 ∥ sync 在其后）：CLI 的 `state.processing` 由正文 `runAgentTurnBody` 的 `finally` 归假（`thincoder-cli/src/tui/agent-turn.mjs:297`），

   链尾 `sync()` 在包装器 `runAgentTurnInner` 的 `finally`（`agent-turn.mjs:103`）——**包装器 finally 晚于正文 finally 执行** ⇒ sync 时 `processing` 已归假；
   `busy` 谓词 = `state.processing ∥ state.suspended ∥ state._suspPending ∥ modalOpen(state)`（与 `thincoder-cli/src/tui/timer-watch.mjs:61` 火面同源）。

   挂起态（`suspended` ∥ `_suspPending`）由挂起窗兑现支接管，故 sync 在挂起态零注册 = 正确而非死闩。VSC ∥ 桌面同形：`busy` 取各自 `turnBusy` ∥ `busyOf` 判据（现火面同源），构造期传入。
3. **单轮合并**：一轮内到期的多条在下次交付时合并注入（`deliverExpiredTimers` 出列批，既有）；在途帽 8 沿用。

**机检不变量**：任一时刻至多一条武装链；每次武装的前置 = 一次空闲判定；一次性闩武装后至多一次 fire ⇒ 无自循环（自循环需「fire → 再武装」闭环，本口径切断忙期的武装边）。

**用例（T-TW51–T-TW53）**：

| # | 场景 | 输入 | 预期 |
|---|---|---|---|
| T-TW51 | 正常·唤醒轮内到期、轮后送达 | 假钟 + 假 timer；`busy` 真期间到期，随后归假并 `sync()` | 忙期零交付零开轮、在途不动；归假后 fire ⇒ 交付恰一次 + timer 轮恰一次 |
| T-TW52 | 边界·忙期零武装（防自旋） | `createTimerWatch({ …, busy: () => true })` 后 `sync()` 连续三次 | 零注册、每次返 `null`、`timer` 缝调用 0 次 |
| T-TW53 | 边界·窗内与前台不重复投递 | 窗内兑现出列 ⇒ 窗退后闩 `sync()` | 零到期件、零重复注入 |
| T-TW54 | 正常·回合收尾后闩已武装（新死闩反向判据） | 假 timer + 在途一项；`runAgentTurnInner` 全径（`processing` 置真 → 正文 finally 归假 → 包装器 finally sync） | 收尾后 `processing === false` ∧ 闩已注册恰一次（延迟 = 最近到期差）；**红 = 新死闩**（busy 读真 ⇒ 零注册） |

**最近先例**：闩转口与零变口径 = 本档 §6.30.16（`createTimerWatch` 端面转口签名冻结）；注入缝 × 假钟用例形 = §6.30.7 T-TW3（直驱、零真实等待）。本批沿同一形；**偏离项** = 构造期新增可选 `busy` 键（additive——§6.30.16 零变不变量 ④ 已登记）。

**调研证据**：查过 `thincoder-core/test/`（现只有 `run.mjs` ∥ `slow.mjs`，**零 `.test.mjs`**——实读 2026-10-19）、`thincoder-core/test/run.mjs:1-49`（`test/*.test.mjs` 单层收集 → `npm test`）、三端 `timer-watch.mjs` 现文——**仓内无既有 timer 测试档可扩**（本档旧清单所列各档均已在各自批收口时按零留存删除）。

**受影响文件（现读 = 实读 2026-10-19）**：

| 文件 | 现读 | 增量 | 说明 |
|---|---|---|---|
| `thincoder-core/agent/timers.mjs` | **164** | ＋≈10 | `createTimerWatch` 构造期 `busy` 缝（默认 `() => false`）＋ 忙期撤闩返 `null` |
| `thincoder-cli/src/tui/timer-watch.mjs` | **65** | ＋1–2 | 转口透传 `busy`（构造期） |
| `thincoder-vscode/src/extension/timer-watch.mjs` | **74** | ＋1–2 | 同上（`turnBusy` 判据） |
| `thincoder-desktop/src/main/timer-watch.mjs` | **76** | ＋1–2 | 同上（`busyOf` 判据） |
| `thincoder-core/test/timer-watch-busy.test.mjs` | 新档 | ≈80 | T-TW51–T-TW53；**寿命 = 随批收口删除**（单元测试档零留存） |
| `thincoder-cli/test/timer-rearm-order.test.mjs` | 新档 | ≈60 | T-TW54（链尾 sync 与 `processing` 归位的先后）；同上寿命 |

- **基线口径**：`timers.mjs` 现读 **164** = §6.30.18 的基线值（该节「164 → ＋≈50」**未落盘**——现读仍 164）；两批同片 ⇒ **串行**：§6.30.18 先落则本批基线改 ≈214 并实施当刻复读。
- 桌面 **76** vs §6.30.13 的 79：差 −3 归其后收编批次（本档不逐行归因）；本批以现盘 76 为基。
- 用例宿主 = 各包 `test/`（`test/*.test.mjs` 单层收集——`thincoder-core/test/run.mjs:1-49`）；**测试档不落 `docs/`**。

**验收（A-TW20–A-TW22）**：A-TW20 = 本条规范句 ＋ §6.30.16 零变不变量 ④ 同拍在册；A-TW21 = 忙期零武装的反证：删 `sync()` 内 `busy` 判定行 ⇒ T-TW52 红（读数落实施记录）；A-TW22 = 机检零新增：`node scripts/doc-check.mjs --root .` 对比开工基线（悬空 ∥ 行宽逐档零新增）。

**边界**：不改交付轮形态 ∥ 域文本 ∥ 帽 ∥ 零跨轮预算；回退面逐字保持；「轮内消化」不做（自旋无上界）。


### 6.31 消化账务——投递 ≠ 销账（报告不许无声消失）

> 需求侧 = `docs/core/requirements/AGENT-LOOP.md` §4.15（F-DA1–F-DA6 / N1–N4）；本节 = 机制设计主体（三方一致）。
> 同族件：F-DA5（结束信号缺席 · #929）· F-DA6（空停）；事故档 = #926（#21 实录：递出即销账 + 零回检）。
> 边界（不做）：非空半句 `stop` 检测（信号层不可分辨）∥ 模型层（无抓手）——需求已登记，本节不复述理由。

#### 6.31.2 机制定形（三角色 + 一条不变量）

- **投递（delivery）**：pending 条目注入某回合的历史——注入后条目**留在 `_pendingAsyncResults`**（不销）。
- **见账（accounting）**：消化轮收尾对**投递账**逐条机检账目覆盖（§6.31.3）。
- **销账（settlement）**：覆盖 ⇒ 离容器 + 释放报告；未覆盖 ⇒ `_daFailures += 1` + `_daRetry = true`（下轮重投）；超限 ⇒ 升级（§6.31.5）。
- **不变量**：**归档 ≠ 销账**——块归档恒落起跑窗（投递时点，#738 / #754 口径不动）；销账 = 纯控制面（容器成员 + 账目态），恒落**见账**（账目覆盖）时点。
- **未销账条目 = 仍在 `_pendingAsyncResults`**——既有「完成待消化」计数（状态行 / `backgroundCounts`）自然含之（不静默）。
- **会话标记**：`carrier._daSession`（布尔——挂起会话期 true、退出置 false；读以 `=== true` 判）——区分「会话内（可重投）」与「fallback 面（无回路）」的唯一判据。
- **回合分类单点**：`isDigestRound(opts) = autoTurn && !upstreamTurn && !timerTurn`——账目只属消化轮（timer / 上行轮投递不销账、不重投——其账目在后续消化轮）。

#### 6.31.3 账目合同（机检形态——零工具轮可满足）

- **账目行（模型输出文本内）**——逐条一行为约：
  - `[digest-ack #<id>] digested — <要点>`（已处理）
  - `[digest-ack #<id>] deferred — <原因>`（未处理）
- **机检判据**：输出文本内**存在一行**同时含标记 `[digest-ack` 与 `#<id>`（词界）⇒ 该条覆盖；disposition / 要点 / 原因**不参与机检**（处理质量不可判——需求边界「只保不许无声」）。
- **账目要求行**：核常量 `DIGEST_ACCOUNT_DOMAIN`（`thincoder-core/agent/helpers.mjs`——拟新增；内容依据 = 机制文档，落笔 = eng-coder，本设计给合同与草稿位）+ **未销账 id 清单**（`pending ∩ 已投递`，动态拼）——**两档同发**（手动 / AUTO；manual 域文本注入只覆盖手动档 ⇒ 账目要求独立常量行承载，避免 AUTO 轮无要求）；`transient`（机器线独有）。
- **注入回合条件**：仅**会话态消化轮**（`_daSession` ∧ `isDigestRound`）且未销账清单非空时注入（先投递后拼清单——含本回合首投 / 重投）；非消化轮（含用户回合）不发——账目判读恒落消化轮输出（每消化轮取件一次——run 级累积痕），用户回合的自行答复不判销账、条目留容器待下一消化轮补账。

#### 6.31.4 投递面（`beginRun` 改造）

- **会话态**（`carrierField(agent, "_daSession") === true`——含会话内用户回合）：
  - 投递门控（单点谓词 `shouldDeliverEntry`）：`!_daDelivered` ⇒ 投（首次投递——**系统轮**（`autoTurn`；批 async-delivery-formalize 2026-10-12 · §6.34）；回退面沿既有取尽面）∥ `_daRetry` 且**本回合 = 消化轮** ⇒ 投（重投经消化轮回路——F-DA1）；其余跳过（防重复注入）。
  - 注入后：`_daDelivered = true`、`_daRetry = false`；`releaseChildHold(entry)`（= 仅释放 `childAgent`——`report` 保留至销账 / 升级：重投需原文；驻留增量以报告量级封顶、以重投上限封顶）。
  - 条目留容器（不 `splice`）；注入抛错 ⇒ 未投条目留容器待下轮（收窄既有「splice 先取尽」的丢失窗——会话态）。
- **非会话态**（fallback——headless / 直连 `runAgent`）：缺省条逐字沿用取尽语义（先离容后注入 + `releaseSettledEntry`——无驱动 ⇒ 无回路）；`_daDelivered === true` 条同判据跳过且留容器（防重复 / 条目不离账务面——#45 落码终态）。
- **报告保留的 OOM 面登记**：`childAgent` 释放点不动（注入后）；`report` 释放点后移至销账（增量 = 报告字符串，历史本已持注入副本——同量级；N 上限封顶）。

#### 6.31.5 见账面（消化轮收尾——`finalizeAgentTurn` 单点）

- **触发**：`isDigestRound ∧ _daSession ∧ !(signal?.aborted && !signal?.reason?.interrupt)`（会话停止径不判——清场语义归 `finishSuspension`）；**恒达窗** = finalize 在 `runAgent` finally（正常 ∥ Abort-continue ∥ 异常抛三径同达——与既有收尾同窗）。
- **输出取件（落痕累积）**：`turn-loop` **每模型轮返回即追加**（写父字段 `agent._lastRunOutput += <该轮 content>`——`thincoder-core/agent/turn-loop.mjs:124` 后 ∥ 会话态门：非会话零动作——零取件方 ∥ 防跨 run 无界增殖）——判定输入 = **本 run 内多轮累积文本**（**首轮签收不为收口轮覆盖**——#939 收正）；**run 内落痕**（生命周期 = 单 run：起跑清位 / 收尾取件），不属跨 run 载体字段集（`AGENT-LOOP.md` §2.3 同注）。
  **清位** = `thincoder-core/agent/run-start.mjs`（beginRun——会话态起跑即清；调核助手 `armAccountRound(carrier)`；fallback 零动作）；**读位** = 本 pass（`finalizeAgentTurn`——调 `harvestAccountOutput(carrier)`，**载体吸收**读：父字段优先——写点落父字段（抗 `history` 整体替换） / 回退 `history`（兼容形））。

  缺痕（本 run 零输出落痕——零模型轮 / 起跑即断）⇒ 全条未覆盖（**安全方向**——假阴可重投；假阳是事故本相）；已有轮次输出（哪怕未收口）⇒ 按累积痕判定。
- **判定（逐条——投递账 = `pending ∩ _daDelivered`）**：
  - 覆盖 ⇒ 离容器（splice）+ `releaseSettledEntry`（含 report 释放）。
  - 未覆盖 ⇒ `_daFailures += 1`；`≤ DA_RETRY_LIMIT` ⇒ `_daRetry = true`（下轮重投）；`> DA_RETRY_LIMIT` ⇒ **升级**。
- **上限与升级（F-DA3）**：`DA_RETRY_LIMIT = 2`（**重投 ≤2 次 ⇒ 总投递 ≤3 次**）；升级 = 离容器 + 入 `_unsettledDigests`（载体字段——`{ id, role, failures, report, at }`）+ **恰一条**显式提醒（`pushReal`——机器线+人读线；逐字 = 机制文档定稿）+ **恰一条** `logEvent("ev:unsettled", { n, ids })`（`ids` = join 串落盘——先例 `ev:discarded`）；升级后**停止自动重投**（账目终态「未处理」可见）。
- **零噪音**：全覆盖轮 ⇒ 零提醒 / 零事件 / 零残余行。
- **清账面**：会话中止（`finishSuspension` aborted 分支 + `run-stages` 中止分支）⇒ `_unsettledDigests` 随 pending 一并清（用户全停 = 旧账不续——与 pending 清场同判）；idle 退出 ⇒ 升级账本存续（跨 run 可读——「可接手」面）。
- **退出清场残余注入按投递账过滤**（消费点③——`finishSuspension` idle 支 · `thincoder-core/agent/suspension.mjs:143-162`）：`entry._daDelivered === true` ⇒ **不注入且不动容器**（防重复——仍驻 pending，可续账）；其余条逐字沿用（注入顺序 ∥ `left` ∥ `reclaim` ∥ `injected`/`error` 不缩水）；fallback（`run-start` 支）同判据——`_daDelivered` 条跳过且留容器 ∥ 缺省条逐字沿用（#45 落码终态）。

#### 6.31.6 可见面（F-DA4——三端同源判据、端差登记）

- **升级提醒（模型 + 用户）**：`pushReal` 单点（核）——三端同源；出现于会话流（人读线 ∥ 机器线）；措辞 = 机制文档定稿。
- **状态面（父侧可读 · 可接手）**：`subagent action:'status'` 增 `overview.unsettled`（全列——`{ id, role, state, attempts }`；state ∈ `awaiting-digest`（在途未投递 ∥ 已投递未判）/ `retrying`（判过未覆盖）/ `unsettled`（已升级——随携 `preview` ≤400 字符））；**单查 id** 未命中双池 ⇒ 续查 pending / 升级账本同解析（收窄登记——§6.11 同拍）。
    （单查序 = 子代理池 → 评审池 → `_pendingAsyncResults` → `_unsettledDigests`；三处皆无 ⇒ 原错误文案。）
- **端面残余行（本轮未销账）**：判据 = `unsettledCount(carrier)`（= pending 中 `_daFailures > 0` 条数）——
  - CLI：核字典新键 `digest.residue {n}`——终态行之后再落一行（`thincoder-cli/src/tui/lifecycle-records.mjs` `digestTraceLines`；`digestEndRecord` 携 `unsettled`——重建同调）。
  - 桌面：`ev:digest { status:"end" }` 帧增 `unsettled`（`thincoder-desktop/src/main/turn-face.mjs` `emitDigestEnd`——非上行轮才携）⇒ 行组增残余行（`thincoder-desktop/renderer/views/chat-digest-rows.mjs`）。
  - VSC：`digest` end 消息增 `unsettled`（`thincoder-vscode/src/extension/suspension.mjs:212-217`）⇒ 状态行族增残余行（`thincoder-vscode/webview/chat-status.js`）；**记录 / 复列承接**：`end` 记录随载荷携 `unsettled` ⇒ 重建复列随出残余元素（`docs/vsc/design/WEBVIEW.md` §5.7 重建径——与 live 同构形件）。
  - 零未销账 ⇒ 三端零此行；行文 = 核字典单源（端侧零自持字面）。
- **端差登记（显示载体）**：CLI = 痕行族（记录面同携 `unsettled`）；桌面 / VSC = 消化行组行元素——判据（计数 / 词键 / 触发条件）三端同源；显示位次按端形（到达序——沿各端自然形）。
- **面板块面零改**：块归档仍落起跑窗（§6.31.2 不变量）——升级 / 未销账事实经会话行 + 状态面承载（不新造 `⟦ev⟧` 事件）。

#### 6.31.7 结束信号缺席显式化（F-DA5 · #929）

- **transport 归一**（让「缺席」在四处同义——补报只喂既有分类）：
  - anthropic：`message_delta.stop_reason` 捕获（`thincoder-core/provider/anthropic.mjs:173-175`）+ 归一（`end_turn` / `stop_sequence` ⇒ `stop`；`tool_use` ⇒ `tool_calls`；`max_tokens` ⇒ `length`；余者原样透传）。
  - google：`candidate.finishReason` 捕获（`thincoder-core/provider/google.mjs:173-174`）+ 归一（`STOP` ⇒ `stop`；`MAX_TOKENS` ⇒ `length`；余者原样）。
  - responses：completed ⇒ `stop`（`thincoder-core/provider/responses.mjs:84` `onCompleted`；incomplete 两值既判）。
  - sse：照旧（守卫捕获 `thincoder-core/provider/sse.mjs:151`——上游干净断流却缺 ⇒ 留 null = 本条窄口）。
- **agent 面（同面异常）**：`injectResponseReminders` 增**缺席支**——`finishReason == null ∧ !response.partial` ⇒ ① 同款异常提醒注入（与「非 stop 异常」同面；逐字 = 机制文档定稿）；② `logEvent("ev:finish-missing", { … })` 留痕。
- **边界**：`length` / `insufficient_system_resource` / `content_filter` 既有处理**零变**（归一只喂既有分类——不改重试 ≤1 ∥ 截断续写）；partial / interrupted / ruleTriggered 径零触（网络断流既有 `_warnings` 已覆盖）。
- **行为增量登记**：anthropic `max_tokens` / google `MAX_TOKENS` 截断首次获可见提醒（既有 len 分类的诚实收益——登记）；`llm:done.finish` 字段对三 transport 由 null ⇒ 归一值（字段值收正——登记）。

#### 6.31.8 空停显式化（F-DA6）

- **判据加宽**：`handleCompletion` 空判 `!response.content` ⇒ **空白判**（`String(content ?? "").trim() === ""`）——`stop` 且零内容（含纯空白）走既有空响应重试（`MAX_EMPTY_RETRIES = 2`——`thincoder-core/agent/completion.mjs:15`）⇒ 用尽抛错（fail-loud）——「不得静默」两径达成（`thincoder-core/agent/completion.mjs:30-51`）。
- **边界**：非空半句 `stop` 检测**不做**（信号层不可分辨——已知边界）；模型层不动；重试预算 / 文案骨架零变；**按因分文不做**（stop 与非 stop 零内容同判——信号层语义收益低）。

#### 6.31.9 受影响文件清单（R24a · 行数 = as-of 2026-10-05 实读；口径 = 内容行数——`wc -l` 同口径，读取工具显示值 +1，§6.20.4）

| 文件 | 现行行数 | 预计增量 | 说明 |
|---|---|---|---|
| `thincoder-core/agent/digest-account.mjs`（已落） | — | ≈170–210 | 账务单件（常量 / 解析 / 要求行 / 见账 pass / 读面 / 落痕清位 ∕ 取件助手） |
| `thincoder-core/agent/suspension.mjs` | 326 → **348** | +22 | `_daSession` 置位 / 复位 + 中止清账本 + 出口缝（idle 清场投递账过滤 ∥ 单遍分区——#44 ∥ #45） |
| `thincoder-core/agent/run-start.mjs` | 111 → **152** | +41 | 投递门控两态 + 账目要求行 + 会话态起跑清位（`armAccountRound`）+ fallback 支投递账分区（#45） |
| `thincoder-core/agent/run-stages.mjs` | 270 | +25 / −2 | finalize 见账 pass（读位 `harvestAccountOutput`）+ 缺席支 + 中止清账本 |
| `thincoder-core/agent/turn-loop.mjs` | 250 | +2 | 收口落痕单点（#939 后 = 本 run 内逐轮累积——见 §6.31.5） |
| `thincoder-core/agent/completion.mjs` | 154 | +2 / −1 | 空白判（F-DA6） |
| `thincoder-core/agent/helpers.mjs` | 481 | +6 | `DIGEST_ACCOUNT_DOMAIN` 常量位 |
| `thincoder-core/agent-tools/async-settle.mjs` | 302 → **326** | +24 | `releaseChildHold` + 账本写助手 + 出口缝注（`releaseSettledEntry` 条件句）+ 归档注收正 |
| `thincoder-core/agent-tools/escalate-async.mjs` | 307 → **309** | +4 / −2（已落——注释族清扫条件句；净 +2） | `classifyEscalateSettle` 注块（`:109-113`）——注入释放条件句收正（fallback ∥ 会话态两态；注释面 only 零行为） |
| `thincoder-core/agent-tools/subagent-panel.mjs` | 272 → **273** | +2 / −1（已落——注释族清扫条件句；净 +1） | 读时交叉注块（`:260-262`）——移除条件句收正（fallback 面注入即移除 ∥ 会话面留容器至销账；注释面 only 零行为） |
| `thincoder-core/agent-tools/subagent-actions-query.mjs` | 270 | +32 | status `unsettled` 段 + 单查落账本 |
| `thincoder-core/provider/anthropic.mjs` | 225 | +12 / −1 | stop_reason 捕获 + 归一 |
| `thincoder-core/provider/google.mjs` | 273 | +9 / −1 | finishReason 捕获 + 归一 |
| `thincoder-core/provider/responses.mjs` | 307 | +1 | completed ⇒ stop |
| `thincoder-core/agent.mjs` | 105 | +1 / −1 | finalize ctx 携 `upstreamTurn` / `timerTurn` |
| `thincoder-core/i18n.mjs` | 108 | +1 | 键 `digest.residue` |
| `thincoder-cli/src/tui/suspension-drive.mjs` | 254 | +4 | digestTurn 携 `unsettled` |
| `thincoder-cli/src/tui/lifecycle-records.mjs` | 199 | +9 | 记录携 `unsettled` + 残余痕行 |
| `thincoder-desktop/src/main/turn-face.mjs` | 200 | +5 | end 帧增 `unsettled` |
| `thincoder-desktop/renderer/events-wake.mjs` | 102 | +4 | end 记录携 `unsettled`（归一） |
| `thincoder-desktop/renderer/views/chat-digest-rows.mjs` | 274 | +12 | 残余行元素 |
| `thincoder-vscode/src/extension/suspension.mjs` | 328 | +3 | end 消息增 `unsettled` |
| `thincoder-vscode/webview/chat-status.js` | 151 | +10 | 残余行元素 |
| `thincoder-vscode/src/extension/panel-turn-loop.mjs` | 303 | +4 | 载体字段 +2（`_unsettledDigests` ∕ `_daSession`；14 ⇒ 16） |
| 核侧单元测试档 | —（新档） | **408** | 核侧用例宿主（T-DA1–T-DA10 / T-DA12–T-DA14 + 补充用例——平 node 直驱：假 carrier / 假 runTurn / 直驱 `finalizeAgentTurn` 同窗） |
| 消化账务出口缝单元测试档 | —（新档） | **165** | 出口缝两用例宿主（T-DA15 / T-DA16——纯搬移自宿主档；核件直驱 `finishSuspension` / `startSuspension` ∥ T-DA16① 另经真 `runAgent` 一轮） |
| 消化账务 CLI 单元测试档（已落） | — | ≈30–60 | 端用例 T-DA11（CLI——记录携 `unsettled` + 残余痕行） |
| 消化账务桌面单元测试档（已落） | — | ≈30–60 | 端用例 T-DA11（桌面——end 帧携 `unsettled` + 行元素） |
| 消化账务 VSC 单元测试档（已落） | — | ≈30–60 | 端用例 T-DA11（VSC——end 消息携 `unsettled` + 行元素） |
| 文档：本档 §6.31 ∥ §6.8 ∥ §6.11 | 1104 → **1136** | +218（合计） | 本节 + 指针 |
| 文档：`docs/cli/design/TUI.md` §6.9 | 916 → 917（本 fix 轮后） | +3（已落） | 残余痕行条 + 两行同屏口径注 |
| 文档：`docs/core/design/AGENT-LOOP.md` §2.3 / §6.15 / §7 / §6.2 / §6.5 | 637 → 642（本 fix 轮后） | +8 / −4（合计——已落） | 载体字段 +2（13 款 ⇒ 15 款——`_unsettledDigests` ∕ `_daSession`）+ 释放点 ∥ D-AL23 ∥ 枚举 ∥ 空白判收正 |
| 文档：`docs/core/design/LOGGING.md` §6.2 | 161 → **164** | +3（已落：两事件行） | `ev:unsettled` / `ev:finish-missing` 行 |
| 文档：桌面 / VSC 显示档（§6.31.6 落点） | — | 各 +1–2 | 残余行 / 载荷字段面 / 记录复列（`docs/desktop/design/RENDERER.md` §1.1 · `docs/desktop/design/IPC.md` §1 · `docs/vsc/design/WEBVIEW.md` §5.1 / §5.7 · `docs/vsc/design/WEBVIEW-PROTOCOL.md` §5 / §6.3 / §3.2） |

**单元测试档沿革（内容口径）**：406 ⇒ 456 ⇒ 502（越 500 硬门）⇒ 拆档 = 主档 408 ∥ 出口缝档 165（#47——出口缝两用例纯搬移；拆前 / 拆后两读）。

`subagent-actions-query.mjs`（**277**——**未越软线**（本列口径外）；改动 = status 增段（既有动作面内无新职责 / 无新导出）——不涉拆分窗口）。
`thincoder-vscode/src/extension/panel-turn-loop.mjs`（303 → ≈307）：改动 = 载体表 +2 字段（数组行内追加——无新职责 / 无新导出）⇒ **不拆**。

`thincoder-core/agent-tools/escalate-async.mjs`（307 → **309**）：改动 = 注入释放条件句收正（注释面 only——无新职责 / 无新导出）⇒ **不拆**。
`thincoder-core/agent-tools/subagent-async.mjs`（466 → **469**）：改动 = 墓碑注条件句收正（注释面 only——无新职责 / 无新导出）⇒ **不拆**。

#### 6.31.10 用例表（正常 / 边界 / 错误）

| # | 场景 | 输入 | 预期 |
|---|---|---|---|
| T-DA1 | 正常·全覆盖销账 | 直驱：pending 3 条已投递 + 输出含三行 ack | 三条全离容器；零提醒 / 零事件 / 零残余行；`_daRetry` 全清 |
| T-DA2 | 正常·重投补账 | 轮 1 输出缺 #2 ⇒ 轮 2 重投含 #2、输出补 | 轮 1 后：#2 留容器 `_daRetry=true`、`_daFailures=1`；轮 2 后全销 |
| T-DA3 | 正常·用户回合投递不销账 | `_daSession` 下用户回合（非消化轮）投递 | 条目留容器（`_daDelivered=true`）；零销账；下一消化轮补账（无重复注入——T-DA4 同判） |
| T-DA4 | 边界·防重复注入 | 条目 `_daDelivered ∧ ¬_daRetry` ⇒ 下一消化轮 | 不重复注入（注入计数 = 1）；账目仍判定（skip 后补账可销） |
| T-DA5 | 错误·超限升级 | 三轮均未覆盖 | 第 3 次后：离容器入 `_unsettledDigests`；恰一条提醒 + 恰一条 `ev:unsettled`；`failures=3` |
| T-DA6 | 边界·升级即终结 | 升级后再开消化轮 | 不重投（账目终态）；`poolLive` 不含（会话可退） |
| T-DA7 | 边界·fallback 零回归（缺省条） | 无 `_daSession`（headless 形）pending 注入——缺省条 | 逐字旧行为：取尽（先离容后注入）+ 注入 + 双释放；零账目动作（`_daDelivered` 条跳过且留容器 = T-DA16 面） |
| T-DA8 | 边界·输出缺痕 | 消化轮抛错 / 撞帽（未收口）∧ 零输出落痕（#939 缺痕定义——见 §6.31.5；有早轮输出 ⇒ 按累积痕判定——T-DA20 用例 2） | 全条 `_daFailures + 1`（重投窗口保留）；零假销账 |
| T-DA9 | 边界·机检反例 | 输出仅提 `#12` 无标记 / 仅标记无 id | 两条皆不计覆盖（皆不销） |
| T-DA10 | 正常·status 可见 | overview 直驱（在途未销 / 升级各一） | `unsettled` 段两态行在场；单查 id 同解析 |
| T-DA11 | 正常·端面残余行 | 消化轮收尾 unsettled = 2（CLI 记录 / 桌面帧 / VSC 消息） | CLI 记录携 `unsettled` + 痕行 `digest.residue` 在场；桌面 / VSC 行同键文；= 0 ⇒ 零行 |
| T-DA12 | 正常·F-DA5 归一 | anthropic stop_reason 四类 / google 两类 / responses completed | 映射逐条（stop / tool_calls / length / 透传）；同轮零缺席提醒 |
| T-DA13 | 错误·F-DA5 缺席 | clean end 缺 finish_reason | 同面提醒恰一条 + `ev:finish-missing` 恰一条；partial ⇒ 零提醒 |
| T-DA14 | 错误·F-DA6 空停 | content 纯空白 ⇒ 重试分支；重试用尽分支 | 空白进空响应支（≤2）后抛；非空半句零触 |
| T-DA15 | 出口缝①·idle 清场投递账过滤 | 直驱 `finishSuspension`（idle——已投递 ∥ 未投递条交错）∥ 回退形（无投递账条）∥ 全径（会话内消化轮抛非 abort 错） | 已投递条不注入且留容器（不入 `left` / 不入 `reclaim`；`report` 零释放）；未投递条照注入 + 离容；回退形全量注入零变 |
| T-DA16 | 出口缝②·fallback 支投递账分区 | fallback 直驱（无 `_daSession`——已投递 ∥ 缺省条交错）+ 单遍分区顺序面 | 已投递条零注入且留容器（原序、零释放）∥ 缺省条照注入（恰一次）+ 照释放（双释放）；零账目动作；离容 / 留容器顺序不缩水 |
| T-DA17 | 缺陷复现（红→绿）·首轮签收跨轮存活 | 多轮 run（首轮输出含 `[digest-ack #3]` + 工具调用 ∥ 收口轮无签收——真 `runAgent` + fetch 桩） | 覆盖 ⇒ 销账（离容器 + 释放）；零失败 / 零重投（注入计数 = 1）；修前红读：`_daFailures=1` + `_daRetry=true` |
| T-DA18 | 回归·跨 run 清位 | run A 输出含 `#44` 签收（该条不属 A）⇒ run B 投递 #44、输出无签收 | B 判未覆盖（`_daFailures=1`）——上一 run 文本不替本 run 作证（窗未清 ⇒ 假覆盖） |
| T-DA19 | 回归·未签收照重投 | 单轮无签收 ⇒ 下轮重投补账（两 runAgent） | 轮 1：失败 +1 + `_daRetry`（条留容器 / report 留 / childAgent 释）；轮 2 补账 ⇒ 销（注入计数 = 2） |
| T-DA20 | 边界·缺痕两用例 | 用例 1：零模型轮（`maxTurns: 0`）⇒ 全条未覆盖 ∥ 用例 2：早轮签收 + 撞帽未收口（`maxTurns: 1`） | 用例 1：失败 +1 + 零假销账；用例 2：按累积痕覆盖（销账——判据窗既定） |

**用例宿主**：核侧（T-DA1–T-DA10 · T-DA12–T-DA14）→ 核侧单元测试档（408 行）；出口缝（T-DA15 / T-DA16）→ 出口缝单元测试档（165 行——纯搬移）；端侧（T-DA11）→ 各端单元测试用例（CLI 记录痕行 ∥ 桌面帧 + 行元素 ∥ VSC 消息 + 行元素——沿各端单元测试惯例）。
窗收正四例（T-DA17–T-DA20——含 ★ 红绿对）→ 取件窗收正单元测试档（已落——自持）。

#### 6.31.11 验收标准（逐条回指）

| # | 验收点 | 判据 |
|---|---|---|
| A-DA1 | 清算后移（F-DA1） | 投递后条目仍在 `_pendingAsyncResults`（`_daDelivered=true`）；覆盖才离容器；未覆盖留容器 + `_daRetry`；归档时点（起跑窗）行为零变（端面帧序同拍） |
| A-DA2 | 账目机检（F-DA2） | 解析器判据逐条（标记 + id 词界；无标记 / 无 id 不计；部分覆盖 ⇒ 部分销账）；零工具轮可满足（纯文本判据） |
| A-DA3 | 重投上限与升级（F-DA3） | 重投 ≤2（总投递 ≤3）；三轮未覆盖 ⇒ 升级（离容器 + `_unsettledDigests` + 恰一条提醒 + 恰一条 `ev:unsettled`）；升级后零自动重投 |
| A-DA4 | 未清算可见化（F-DA4） | status `unsettled` 段三态行在；三端残余行键文同源（`digest.residue`）；升级提醒三端同源；单查 id 落账本同解析 |
| A-DA5 | 结束信号缺席（F-DA5） | 四 transport 归一逐条；缺席（clean ∧ ¬partial）⇒ 提醒恰一条 + `ev:finish-missing` 恰一条；partial ⇒ 零提醒；既有异常处理零变 |
| A-DA6 | 空停（F-DA6） | 纯空白 ⇒ 空响应支（≤2）后抛；非空半句零触；重试预算 / 文案零变 |
| A-DA7 | 零回归（N1） | 全覆盖轮零提醒零事件；用户输入优先 / `maxTurns` / 注入格式 / 预算 / 归档时点 / 面板块面逐条零改；fallback 面 = 缺省条逐字旧行为 + `_daDelivered` 条跳过且留容器（#45 落码终态） |
| A-DA8 | 机检与回指（N2） | 单元测试档全绿；仓根 `node scripts/doc-check.mjs --root .` 文档面零新增悬空 / 零行宽 |

#### 6.31.12 边界（不做）

1. 非空半句 `stop` 检测（信号层不可分辨——已知边界）；模型层（无抓手）。
2. 无挂起会话面（headless / 直连 `runAgent`）不建重投回路——fallback = 缺省条逐字沿用（一发注入，结果不丢）+ `_daDelivered` 条跳过且留容器（防重复；#45 落码终态）；**边界（非缺陷）**：fallback 跳过条在纯 fallback 进程内无离容器路径 ∥ `_daRetry` 在 fallback 不兑现（与 `shouldDeliverEntry` 不对称）。
3. 不新造独立查询工具面（可见 = 既有 status / 会话行 / 消化行族）；不新造 `⟦ev⟧` 面板事件（块面零改）。
4. 不改归档时点 / 用户输入优先 / `maxTurns` 预算 / 注入格式与 digest 预算语义；不做处理质量机检。
5. 多实现面纪律：判据同源（核单件），端差 = 显示载体（登记于 §6.31.6）；载体字段入册（`_unsettledDigests` ∕ `_daSession`——核 §2.3 13 ⇒ 15 款 ∥ VSC 端壳表 14 ⇒ 16 款；AGENT-LOOP.md §2.3 同拍）；`_lastRunOutput` = run 内落痕（不属字段集——§6.31.5）。
6. 不做升级账本的永久化 / TTL（会话期面——中止清、idle 存续）。

#### 6.31.13 关键决策记录（KD）

| # | 决策 | 理由 |
|---|---|---|
| KD-DA1 | 账目 = 模型文本标记 + 机检覆盖 | — |
| KD-DA2 | 见账落点 = `finalizeAgentTurn`（消化轮收尾） | — |
| KD-DA3 | 输出取件 = 本 run 内逐轮累积落痕（父字段 ∥ 载体吸收读；会话态门） | — |
| KD-DA4 | 重投上限 N = 2（总投递 ≤3） | — |
| KD-DA5 | 升级 = 离容器入 `_unsettledDigests` + 提醒 + 事件 | — |
| KD-DA6 | 账目要求 = 独立核常量行（两档同发 + id 清单） | — |
| KD-DA7 | 报告保留至销账（`releaseChildHold`） | **推翻 `docs/core/design/AGENT-LOOP.md` §7 D-AL23**（会话态一截——原位注记同拍） |
| KD-DA8 | 用户回合投递不销账（重投门控仅消化轮） | — |
| KD-DA9 | F-DA5 = transport 归一 + 缺席同面（提醒 + 留痕） | — |
| KD-DA10 | F-DA6 = 空白判加宽（既有重试 / 抛错零改） | — |

## 6.34 主会话异步投递与消化——两种时点（用户裁定）

> 需求侧 = `docs/core/requirements/AGENT-LOOP.md` §4.18（F-AD1–F-AD5 / N1–N3）；本节 = 机制设计主体（三方一致）；口径单源 = 用户 2026-10-12 23:14–23:21 四句裁定。
> 域外（不属本口径）：父→子 `send` 注入（23:18 裁——另一类场景）∥ 无界面径（headless ∥ 子代理自跑）不适用「空闲」面——机械处置 = §6.34.4（不向用户扩面）。
> 现状七行读数 = 实读（坐标随文）；实施当刻以实读为准。

### 6.34.1 两时点定形（「空闲」判据 · 机检）

**口径三条**：① **步边界**（回合内——当前步一完就取；非消化轮）= 只给**用户排队消息**。② **主会话空闲时** = 其余全部（子上行 ∥ 结算报告族 ∥ 异步工具调用返回 ∥ timer）。③ 未投递结果**不塞进用户新回合**——等会话再空闲时投递；投递 ≠ 销账（§6.31 全保）。

**「空闲」= 什么时刻**——同义单句：**无用户机务在飞**（无在飞回合 ∧ 无可消费的用户输入 ∧ 无模态界面）。两载体同义、零新谓词：

- **载体 A（前台阶 · 完全空闲）**：空闲闩 fire 守卫（既有单源——CLI = `!processing ∧ !suspended ∧ !_suspPending ∧ !modalOpen`（§6.30.16 T-TW30 判据）；VSC = `turnBusy` 假；桌面 = `!flights.has(key) ∧ !suspension.active(key)`）；闩武装点 = 回合链尾「无人自动接手」判据邻位（既有）。
- **载体 B（挂起等待窗）**：`startSuspension` 循环序——步骤 1（用户输入）取项缝返空（含「不可消费项留队」防御面）⇒ 步骤 2 才可开交付轮；步骤 1 消耗用户输入优先（D-S5 零改）。
- 两载体按「后台活存在否」分工（有活 ⇒ 窗；无活 ⇒ 闩）——同一判据、两载体，非判据分叉。

**交付轮（空闲面的投递载体）** = 由空闲面开启的系统轮：**消化轮 ∥ 上行唤醒轮 ∥ timer 轮**（`autoTurn === true` 全族——`isDigestRound` 细分零改）。**异步投递落 = 交付轮轮首**（起跑窗注入（pending 族）＋ 首步循环头 drain（上行族）——两刻同邻，合称「轮首投递」）；轮内步边界（次步起）零异步注入。

**机检不变量**：

- **I1 用户回合零异步**（驱动面 `suspDriven`）：`autoTurn !== true` ⇒ ① run-start 会话态投递门不通过（首投仅系统轮）② 每步零 drain ③ 该轮唯一步边界投递 = `consumeQueuedInput`（排队消息）。
- **I2 交付轮轮首**（驱动面）：`autoTurn === true` ⇒ 异步注入仅落轮首（起跑窗 ∥ `turn === 0` 循环头）；轮内次步零异步注入（系统轮不传 pickup 回调——现状）。
- **I3 回退面保持**：`suspDriven !== true` ⇒ 既有投递点逐条保持（§6.34.4）。
- **I4 先到先得（竞态裁决）**：判据点判空闲 ⇒ 开交付轮；判定后到达的用户输入按 busy 语义入队（窗口 = `pendingInput`；前台 = 队列），交付轮跑完后消费——零重排 / 零丢弃 / 零抢占（不中断语义沿 §6.8；例外 = Ctrl+C 既有中止面）。

**覆盖交代（退出残余注入——消费点③——不属两时点枚举）**：窗口退出清场残余注入（`finishSuspension` idle 支 ∥ fallback `run-start` 支——§6.31.5 消费点③）**不属本两时点枚举** = 退出面不丢件兜底（非交付轮投递——不经轮首）；过滤零改（`_daDelivered` 条不注入且留容器）；驱动面可达性窄（自然退出时 pending 已空——残条多为已投留容器条 ⇒ 零注入）；与 I1 覆盖面 ∥ §6.34.2 七行表不相抵。

**续跑段（`resume`）「轮首」口径（登记）**：轮首 = **每段起跑窗 ∥ 段内 `turn === 0`**——`resume` 段（撞帽续跑）重开一次轮首窗；该重开**发生在系统轮内**（续跑链逐段同 `autoTurn` 旗）、**不回用户回合**（用户回合段判据照旧零放行——I1 不破）。

### 6.34.2 逐径改法（现状七行 · as-of 2026-10-12 实读）

| # | 件 | 现投递点（坐标） | 改法 / 保持（落点） |
|---|---|---|---|
| 1 | 用户排队消息 | 步边界——`thincoder-core/agent/turn-loop.mjs:112`（`consumeQueuedInput`；用户回合） | **保持**（「非消化轮」门控明文化 = 回调仅 `autoTurn !== true` 传参——消化轮 / 系统轮不传；三端传参面既有分流零改） |
| 2 | 子上行 | 步边界——`thincoder-core/agent/turn-loop.mjs:108`（`drainChildUpstream`——每轮每步） | **改**：收窄「交付轮轮首」（`turn === 0` ∧ `autoTurn`；驱动面）——用户回合零 drain；ask 唤醒面（`wakeAsyncWaiters` + `upstreamWaiting`）保持（唤醒轮 = 交付轮）；note 不唤醒 + 留队至下一交付轮（开轮源 = settle digest / ask / timer；残面见附注）；回退面（`!suspDriven`）逐字保持 |
| 3 | 结算报告族 | 下一回合起跑前——`thincoder-core/agent/run-start.mjs:39-64`（`shouldDeliverEntry` 首投任意回合） | **改**：首投收窄**仅系统轮**（`autoTurn`）——用户回合零注入；重投（`_daRetry`）仅消化轮保持；注入后留容器（§6.31 投递账）零改；非会话态支（fallback）零改 |
| 4 | 异步工具调用返回 | 入同容器按 role 分发（停靠 `thincoder-core/agent-tools/bash-async.mjs:208` ∥ `browser-async.mjs:149`；注入器 `:231` ∥ `:162`）⇒ 随结算族时点 | **改 = 随结算族**（同容器同门控——零独立时点；注入器内容形态零改） |
| 5 | timer（在飞） | 工具轮收尾（步边界）——`thincoder-core/agent/post-turn.mjs:21` | **改**：驱动面 ∧ `timerWakeEnabled` ⇒ 不再于工具轮收尾注入（到期件留在途零出列）；交付交空闲面（挂起窗第三兑现态 ∥ 前台空闲闩——均既有）；开关关 ∨ 回退面 ⇒ 逐字保持（§6.30.3③ 承诺对齐） |
| 6 | 待发提醒 | 起跑窗（`thincoder-core/agent/setup.mjs:187-192`）∥ 工具轮收尾——`post-turn.mjs:24-29` | **保持**（读法登记 = KD-AD5——非异步件族：工具效应第二半（`eng` / `plan` / `skill`）+ 命令 / 生命周期提示（`/auto` · MCP 警告 · 会话恢复）；不属本口径（用户口径无此项）；不涉，保持现状） |
| 7 | timer（空闲） | 空闲唤醒——`thincoder-core/agent/timers.mjs:120`（`deliverExpiredTimers`——闩 fire） | **保持**（已合——将其写进两时点判据载体 A） |

- **行 2 附注（残面——如实登记）**：留队件无专属开轮源（note 不唤醒；F11 出窗后 ask 唤醒落空）——全静默（池空 ∧ 无在途 timer ∧ 无新事件）⇒ 留队至下次唤醒（无上界；不新增丢件通道）。

### 6.34.3 边界情形（三条裁定）

- **① 未投递结果遇上用户新回合（不塞、等空闲）**：裁定 = I1——用户回合起跑窗不注入（首投门改系统轮）、轮内零 drain；未投条目**留容器**（§6.31 投递账：`_daDelivered` 未置 ⇒ 仍首投候选）；用户回合结束 ⇒ 会话回窗口 / 空闲面 ⇒ 交付轮投递。用户连续排队（多回合链）⇒ 逐条先消费（D-S5 输入优先），异步件等链尾——**不新增丢件通道**（F-AD4 边界逐字）。
- **② 空闲判定竞态（会话刚空闲 vs 新消息刚到）**：裁定 = I4 先到先得——判据点（窗口步骤 2 决策 ∥ 闩 fire 决策）以当刻为准；判定后到达的用户输入按 busy 语义入队、交付轮跑完后消费（不打断——「非中断」语义同族）；反方向（输入先到）⇒ 输入回合先跑、异步件等之。两向均有既有载体（`pendingInput` / `state.queue`——容量 8），零新机制。
- **③ 空闲投递后与 §4.15 销账的关系（全保）**：裁定 = 投递 ≠ 销账（§6.31 F-DA1 不变）——空闲投递改变的是**注入时点**；账目判读仍落**消化轮收尾**（§6.31.3「注入回合条件」零改）；重投（仅消化轮）、上限 ≤2、升级账本、中止清场、退出清场过滤（`_daDelivered` 跳过留容器）逐条零改；空闲投递至非消化系统轮（上行轮 / timer 轮）的条目 = 已投未销（下一消化轮补账）——与既有「首投任意回合」的账目语义同构（收窄点 = 用户回合不再首投）。

### 6.34.4 无界面径机械处置（headless ∥ ACP ∥ 直连 `runAgent` ∥ 子代理自跑）

- **判定**：`suspDriven !== true` = 无挂起驱动 / 无空闲面（headless `chat` / ACP / 直连 `runAgent`）；**不适用「空闲」面**（F-AD1 边界②——不向用户扩面）。
- **机械处置（回退面逐条保持）**：run-start 非会话态取尽注入 ∥ 回合尾 `collectSettledAsync`（`suspDriven=false`）∥ 每步 drain ∥ `post-turn` timer / 提醒注入。语义 = 「不丢件」兜底——核单点收窄均以驱动面为门，回退面零改或走保持支。
- **子代理自跑**（depth>0）：无挂起面 / 无空闲面——不受本口径约束（其上行经父会话面处置）。

### 6.34.5 收正点清单（所触碰的既有条文——防跨档矛盾）

| 档 | 条 | 收正 |
|---|---|---|
| 本档 §6.8 | 步边界 pickup 块 | 补指针句：异步件两时点 = §6.34；步边界投递唯一成员 = 本通道 |
| 本档 §6.30.1 | 「投递 = 工具回合边界轮询」bullet | 改述 + 现坐标（驱动面 ⇒ 空闲面；回退面 ⇒ 回合边界） |
| 本档 §6.30.3 | D-TW8 收正句 ∥ 合同句 | 改述：驱动面 = 空闲面交付；headless 句保持（§6.34） |
| 本档 §6.30.7 ∥ §6.30.17 ∥ §6.30.18 | T-TW5 括注 ∥ 「在飞期到期」句 ∥ 「为什么在 take 内」消费面枚举 | 随 §6.34 改述（驱动面 post-turn 径退场——回退面保留） |
| 本档 §6.31.4 | 投递门控句「首次投递——任意回合」 | ⇒「首次投递——系统轮（`autoTurn`）」 |
| `AGENT-LOOP-UPSTREAM.md` §6.27 | 消费点族句（§6.27.2 流程 4 ∥ F1 / F4 / F6 / F11 / F12 / F13 行 ∥ §6.32.5 两句（含后半句）） | ⇒「交付轮轮首；回退面保持」——逐句最小收正；F13 ∥ §6.32.5 后半句 =「下一交付轮（settle digest / ask / timer）——用户回合不投」（本 fix 轮已落——撤 F13「今日语义零变」标签） |
| `AGENT-LOOP.md` §6.2 | 循环头注入族句（② `drainChildUpstream`） | 补「交付轮轮首；用户回合零投递（§6.34）」 |
| 候定稿（内容依据 = 机制文档——只登记） | `thincoder-core/tool-docs/timer.md:11` 合同句 ∥ `notify_parent` 返回注（`ASYNC_NOTE`「next turn boundary」）∥ `thincoder-core/prompts/common.md` 上行接收侧句（§6.27.8 文本块） | 语义随 §6.34；逐字 = 机制文档定稿 |

### 6.34.6 用例表（T-AD——N1 两对照 + 边界；实施轮落单元测试档（已落）；跑法 = 仓根 `node --test <单元测试档>`）

| # | 场景 | 输入 | 预期 |
|---|---|---|---|
| T-AD1 | **对照①·步边界不投子上行** | 驱动面（`suspDriven:true`）用户回合 ≥2 步；首步后 `pushChildUpstream({kind:"note"})`；该轮开轮源 = 交付轮（settle digest / ask / timer 任一——本用例取在途 timer 到期，假 timer 开 timer 轮，§6.30.7 假钟惯例）；核 `startSuspension` 假 `runTurn` 直驱 | 次步起跑前：队列仍 1 条 ∧ history 零注入；回合后交付轮轮首：恰注入一批、队列清零 |
| T-AD2 | **对照②·空闲才投结算件** | 会话态（`_daSession`）pending 一条未投；用户回合起跑（`autoTurn:false`） | run-start 零注入 ∧ `_daDelivered` 未置 ∧ 留容器；随后系统轮（`autoTurn:true`）起跑 ⇒ 恰注入一次 + `_daDelivered=true` + 留容器（投递 ≠ 销账） |
| T-AD3 | 正常·空闲面正径 | 挂起窗（无 `pendingInput`）+ settle ⇒ 交付轮 | 唤醒 ⇒ 交付轮开（谓词 `pendingN > 0`）⇒ 轮首注入恰一次 |
| T-AD4 | 边界·投递后销账关系 | T-AD2 后消化轮账目覆盖 ∥ 未覆盖 | 覆盖 ⇒ 离容器销账；未覆盖 ⇒ `_daFailures + 1`、重投仅消化轮（§6.31 回路逐条同） |
| T-AD5 | 边界·竞态 | 交付轮开启后用户 Enter | 输入入 `pendingInput`（窗口）/ 队列（前台）恰一条；交付轮零中断；轮后消费该输入；零丢 |
| T-AD6 | 边界·timer 在飞改法 | 驱动面 + `timerWake:true`：到期于工具轮 | 零注入 ∧ 在途不动；链尾空闲 ⇒ 闩 fire ⇒ 交付恰一次 + timer 轮恰一次 |
| T-AD7 | 边界·timer 回退 | `timerWake:false` ∥ `!suspDriven` 面到期 | 工具轮收尾注入逐字保持（既有语义） |
| T-AD8 | 回归·回退面零变 | `suspDriven:false`：run-start 取尽 ∥ 回合尾 collect ∥ 每步 drain | 四条投递点逐条保持（负控：收窄不涉回退面） |

### 6.34.7 验收（A-AD——逐条回指 §4.18）

| # | 判据 | 回指 |
|---|---|---|
| A-AD1 | 两时点定义在册且机检（载体 A / B 谓词 + 交付轮轮首 + I1–I4） | F-AD1 / F-AD2 / N1 |
| A-AD2 | 七行逐行有改法或「保持」（§6.34.2 表——每行带坐标） | F-AD5 |
| A-AD3 | 用户回合零异步（正对照 T-AD1 ∥ T-AD2；负控 = T-AD8） | F-AD2 / F-AD4 |
| A-AD4 | 空闲投递成立（T-AD3；窗 ∥ 闩两面） | F-AD3 / N1 |
| A-AD5 | §4.15 全保（T-AD4；账目 / 重投 / 升级 / 清场逐条零改——引 §6.31） | N2 |
| A-AD6 | 端差异零增（核单点收窄 = run-start 门 ∥ drain 门 ∥ post-turn 门三处；端侧零改） | N3 |
| A-AD7 | 机检零新增：`node scripts/doc-check.mjs --root .` 对比开工基线（悬空 / 行宽逐档零新增） | 批档自身约束 |

### 6.34.8 受影响文件清单（R24a——实施轮预算；行数口径 = **内容行数**（`wc -l` 同口径——读取工具显示值 +1；§6.20.4）；as-of 2026-10-12 实读 ∥ 2026-10-13 fix 轮复核）

| 文件 | 现行行数 | 预计增量 | 说明 |
|---|---|---|---|
| `thincoder-core/agent/run-start.mjs` | 实读 158 | +2/−1 | 会话态投递门控增系统轮判据（`shouldDeliverEntry` 调用点 `:45-49`） |
| `thincoder-core/agent/digest-account.mjs` | 实读 189 | ±3 | `shouldDeliverEntry` 谓词：首投仅系统轮（调用签名 +1 参）；≤500 ⇒ 无需拆分计划 |
| `thincoder-core/agent/turn-loop.mjs` | 实读 275 | +2/−1 | drain 门（`turn === 0` ∧ `autoTurn` ∥ `!suspDriven` 保持——`:108`）+ `injectPostTurn` 透传（`:263`） |
| `thincoder-core/agent/post-turn.mjs` | 实读 70 | +3/−1 | timer 注入门（`suspDriven ∧ timerWakeEnabled` ⇒ 跳过——`:21`；`timerWakeEnabled` 取用 `timers.mjs:112`） |
| 端侧（CLI / VSC / 桌面） | — | 0 | 零改（核单点收窄；pickup 分流与 timer 空闲 / 窗两面既有） |
| 单元测试档（已落） | — | 新档 ≈180–240 | T-AD1–T-AD8 宿主 |
| 文档：`docs/core/design/AGENT-LOOP-ASYNC-POOL.md`（本档——§6.34 ∥ §6.8 ∥ §6.30 ∥ §6.31.4） | **1417**（现读——内容口径） | +≈140（§6.34 新增 + 收正句；终值已复读） | §6.34 新增 + 收正点清单（拆分去向按既有挂债口径不另议） |
| 文档：`docs/core/design/AGENT-LOOP-UPSTREAM.md`（§6.27） | 1396（现读——内容口径） | +≈2–4（收正句（多为句内替换）；本收正轮 +2——实施轮终值随收口回填） | 收正点清单（§6.34.5） |
| 文档：`docs/core/design/AGENT-LOOP.md`（§6.2） | 659（现读——内容口径） | +≈1–3（§6.2 收正句） | 收正点清单（§6.34.5） |

### 6.34.9 关键决策记录（KD-AD）

| # | 决策 | 裁定 | 理由 |
|---|---|---|---|
| KD-AD1 | 「空闲」判据 = 复用既有谓词（闩守卫 ∥ driver 步骤序） | 采纳 | 零新谓词 / 零端迁移 |
| KD-AD2 | 异步投递 = 交付轮**轮首**（起跑窗 + 首步 drain） | 采纳 | 「空闲时投递」本相 |
| KD-AD3 | 用户回合零异步（首投门 = 系统轮） | 采纳 | F-AD4 本相；重投仍仅消化轮（账务耦合——§6.31.4 零改） |
| KD-AD4 | 回退面（`!suspDriven`）= 逐字保持 | 采纳 | 无空闲面 ⇒ 保留既有投递点（不丢件兜底）；「不向用户扩面」（F-AD1 边界②） |
| KD-AD5 | 提醒族 = 保持 | 采纳 | 非异步件族——不属本口径（用户口径无此项）；不涉，保持现状（细则 = §6.34.2 行 6） |
| KD-AD6 | timer 开关关 ⇒ 回退面语义保持 | 采纳 | 与 §6.30.3③「关 ⇒ 回到仅回合边界投递」承诺对齐（门 = `suspDriven ∧ timerWakeEnabled`） |
| KD-AD7 | 域外两项不触（父→子 `send` ∥ 无界面径向用户扩面） | 采纳 | 23:18 裁 + F-AD1 边界② |

### 6.34.10 边界（不做）

1. **实现**：实施轮落（受影响文件 = §6.34.8；用例 = §6.34.6 T-AD1–T-AD8）。
2. 提示词面 / 工具描述 / 注入文本逐字（除 §6.34.5 候父侧两项）；端侧零改。
3. §4.15 账务机制（判据 / 重投 / 升级 / 清场——逐条零改；仅引）。
4. 新唤醒面（零新造——唤醒源族保持：settle / ask / 用户输入 / timer）。
5. 提醒族迁移——非异步件族，不属本口径（用户口径无此项）；不涉，保持现状。
6. 父→子 `send` 面；子代理自跑面。

### 6.34.11 开放点（候裁项）

（无。）

