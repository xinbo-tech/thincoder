# 后台异步池 · 挂起回合与 digest · 评审实例面（AGENT-LOOP-ASYNC-POOL）· 核心统一子系统档（拆分面）

> 归属 = `docs/core/design/AGENT-LOOP.md` 的**机制族拆分面**——「后台异步池 / 挂起回合与 digest / 评审实例面」族（2026-09-22 structure-debt 批 · 档面车道 · 自 `docs/core/design/AGENT-LOOP-SUBAGENT.md` 三分迁出）。
> 承载节 = §6.8（挂起回合与 digest）· §6.10（回合外事件后台化统一模型——分域池 + async advisor）· §6.11（后台评审池可观测 / 可控）· §6.18（评审对象锚）· §6.19（判定铁律 R1–R7）· §6.20（CLI 侧中止丢弃对称）· §6.30（timer 到期自唤醒——空闲唤醒面）。
> **节号沿用母档全局编号**——全仓既有指针**只改档名、不改节号**。
> 同三分面 = `docs/core/design/AGENT-LOOP-SUBAGENT.md`（子代理工具契约与装配面——§6.7 · §6.9 · §6.12 · §6.21–§6.26 · §6.28）；
> `docs/core/design/AGENT-LOOP-UPSTREAM.md`（子 → 父上行与唤醒面——§6.27 全族）。
> 母档 = `docs/core/design/AGENT-LOOP.md`（归属与范围 / 核模块裁决行 / 须用户裁条目 / 对外契约 / 受影响文件 / 主循环机制面 §6.1–§6.6 / 诊断与预算面 §6.13–§6.17 / 关键决策 / 沿革）。
> 工作流档 = `docs/core/design/CORE-UNIFICATION.md`；需求层 = `docs/core/requirements/AGENT-LOOP.md`（含 §4 需求条目面）。
> 建档 = 2026-09-22（structure-debt 批 · 台账 #67）：**段零改动**（迁出节逐字搬移、节号沿用）；三分前变更史 = `docs/core/design/AGENT-LOOP-SUBAGENT.md` 变更记录（历史归记录面）。
> **2026-09-29 P2 三拆坐标注（core-hygiene 批 · §2.8 行 5）**：核 `agent.mjs` 主循环面已分档（`agent/run-start.mjs` ∕ `agent/turn-loop.mjs` ∕ `agent/chat-call.mjs`；`agent.mjs` = 105 行编排面）——循环头 ∕ timer 投递语义句与坐标已按新档收正；余 `agent.mjs` 系旧行号 = 三拆前 as-of。

## 6.8 挂起回合与 digest（会话级后台双通道）

> 核内形态（状态机 / 载体契约 / 注入面 / 端特有面）见 `AGENT-LOOP.md` §2.3；本节 = 现行机制语义与端面分工。

- **回合尾语义**：回合尾**不再直注入排空**——done 条目留池（settled not consumed）→ `willSuspend`（`poolLive` 覆盖池非空）判 true → 进挂起态 → `sweepSettledToPending` → pending 非空 → digest 回合。**无 suspension 驱动的调用方**（headless / 直连 `runAgent`）保留回合尾直注入兜底（不丢结果）。
  **接入面（2026-09-29 · parity-b1-vsc-core）**：端面 = CLI / VSC / 桌面**三端全接**（三端皆消费核件 `startSuspension`——端差只在装配面（carrier ∕ hooks ∕ 输入缝）；桌面接入先例 = 批档 `docs/batches/2026-09-28-desktop-idle-wake.md` §2）；「**无 suspension 驱动的调用方**」集收窄为 headless / 直连 `runAgent` / ACP 客户端驱动面，保留回合尾直注入兜底（不丢结果）。多条目近邻完成 = **合并一轮消化**。
- **主会话 busy（processing 含 digest）提交 = 入 `pendingInput` 队列**（**容量 8 条**——普通回合与会话内 busy 同判据）：输入不禁（可打字回显），Enter 受理入队；
  **吞面收敛四** = 模态 / 斜杠 / 空 / **队满（第 9 条 ⇒ 拒 + 提示 + 文本保留）**（逐条 = `docs/cli/design/TUI-INPUT-BOX.md` §4.1；反馈 = `docs/cli/design/TUI.md` §7.5；VSC 对位 = `docs/vsc/design/WEBVIEW-INPUT.md` §1 C-B2-6）；
  `state.queue` = 残项单容器（释放窗口兜底 / 中止残余——零丢失保留）。
- **合并消费（R15 攒批恢复——queue-visible 批 2026-09-24）**：消费点按同一计划取数——连续非 `/` 条目攒批合并为**一条消息、一次回合**：
  单批 ≤ `MAX_MERGE_ITEMS`（8）条且合并文本 ≤ `MAX_MERGE_CHARS`（2000）字符（**核单源常量**）；超限截批先行（余下留待下批——不丢）；单条 > 2000 字符直发（不进批）；`/cmd` 逐条保序即时（不进合并缓冲）。
  形态 = 编号逐条（`你排队了 N 条消息：` + `1. …` + `——一次处理`）；**核单源 + 两端转口同一绑定（对拍锁 = 批档本地件）**。

**步边界 pickup（用户 → 主会话投送通道——queue-visible 批 fix 轮 2026-09-24 · 用户 03:06 收正 / 03:09 参照模型）**：

- **通道语义（参照系 = 既有「主 agent → 子 agent」`subagent action:'send'`——参照非改造：send 侧代码 / 文档 / 行为本批零触碰）**：
  入队 → **下一 turn 边界消费**（**非中断**——当前工具先跑完）→ 按**普通用户指令**落历史。本批 = 该行为契约在「用户 → 主会话」方向的**新增通道**（主会话侧原缺失）。
- **核侧落法（选型 = 复用核既有「回合边界投递」缝）**：`runAgent` opts 增**投递回调** `consumeQueuedInput`——与 `consumeInjected`（`thincoder-core/agent/turn-loop.mjs:87`）同址同族（循环头），落 `drainChildUpstream(agent)`（`:89`）之后（真实用户消息恒为 history 尾；三拆前 `thincoder-core/agent.mjs:233` ∕ `:235`）。
  回调**自持语义**（取批 / `pushReal` / 呈现——核只给缝、不给策略；同 `drainInjectedQueue` 形态）；空队列 no-op、缺省 `null`（headless / 直连 `runAgent` 零开销）。
  **复用面（核既有底层构件——零新增基础件）** = 循环头回合边界缝 + `pushReal` 历史写原语 + 「非中断 / 下一边界 / 普通 user 消息」语义契约。
  **被否候选**：① 会话层包装（外层按步重入 `runAgent`）——run 级语义全破（mutation / guard 复位、turn 编号帧、Stop 钩子、续跑、压缩链、`_pendingDistill`）；
  ② 在 `callbacks.onTurnEnd` 内注入——通知通道承载隐藏写入（消费方 = 增量保存 / 流 flush），且触发点分散（`completion.mjs` 六分支 + `post-turn.mjs`）、其一在「本轮即 return」路径（注入后消息滞留到下一回合）；
  ③ 核单源 drain 函数 + 载体字段（parent-channel 模式）——队列容器迁移 ⇒ 全部入队路径 / 容量判据 / UI 派生（待发送块 / 状态栏段 / VSC 快照源）连带改（超「只加消费时机」射程）；且合并格式 / 文案属端面 ⇒ 核 drain 须持端文案（域越界）；
  ④ 与 `send` 消费件合流（`drainInjectedQueue` 泛化）——**触碰 `send` 实现面 ⇒ 出本批范围**（登记上抛；**条件（台账 #251 转档 · 2026-09-29）**：统一需求出现 ∨ 两套「边界消费」逻辑确已漂移 ⇒ 另开批次评估——涉 `send` 机制面 ⇒ 先单拎用户请裁）；
  ⑤ digest / 上行唤醒轮内步边界注入（理由见下「适用面」）；⑥ digest 轮步边界**让位**（run 在边界收束）——核新增退出语义 + 部分消化残面，超本批射程。
- **适用面 = 用户回合（`autoTurn === false`）**：digest / 上行唤醒轮（系统驱动轮）**不参与**步边界 pickup——该轮域文本 = 整理域，且手动档机械门禁（无权限 handler ⇒ 写被拒；`_inAutoTurn && !autoApprove` ⇒ spawn 拒）会把用户指令降格
  ⇒ 系统轮消费点保持 driver 步骤 1（轮末，零改）；端侧传参面自带分流（autoTurn 轮不传回调）。
- **不中断语义（N2 同款）**：检查点 = 循环头——一步 = **一次 LLM 调用 + 其工具执行段**（`executeToolCalls` + `recordToolResults` 已完结）⇒ 在飞工具 / `signal` / 流式输出零触碰。
- **与 Ctrl+I 的区分（逐字）**：Ctrl+I = `abort({ interrupt: true, message })` ⇒ **中断当前回合**（在飞段立断）+ 注入 `[User interrupt: …]` + 外层重建 controller **续跑**（`AGENT-LOOP.md` §6.2）；
  本通道 = **零 abort / 零 `[User interrupt:]`** + 步边界以普通 user 消息落历史（**下一步生效**）。两通道并存、互不替代。
- **兜底面（三时机时间序）**：**步边界（主）** / **回合尾兜底**（队列在末步填充 ⇒ 本 run 无后续边界——既有 `thincoder-cli/src/tui/agent-turn.mjs` 队列续发）/ **驱动级**（挂起面无在飞用户回合——driver 步骤 1）。后两者零改。
- **三端**：CLI = `thincoder-cli/src/tui/queued-pickup.mjs` 闭包（取批 → `pushReal` → 回执 + `❯ You:` + 合并文本）；VSC = 核 opts `consumeQueuedInput` 回调（`thincoder-vscode/src/extension/panel-turn-loop.mjs`——`pickupQueuedAtStepBoundary`；消费点 = 核循环头——主循环取核后随主体归核）；
  **桌面** = 宿主单源队（`thincoder-desktop/src/main/queued-input.mjs`）+ `turn-face.mjs` 传 `consumeQueuedInput`（「回合中插入」批——附件条目留队 · 步边界让位；单源 = `docs/batches/2026-09-28-desktop-midturn-input.md` §2 KD-40）。语义同源、各自实现。

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
| auto-turn | 结束且有 pendingInput | 自动以本批**合并消息**开新回合（计划 / 常量见上「合并消费」） | → 回合 |

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

**挂起期 Ctrl+C 武装化（三态一致）**：processing / 挂起态首按 → `abort({ interrupt: true })` 无 message（停当前回合——**不清池**——提示「再按中止全部后台」）+ 武装 3s；3s 内二按 → 全停（清池 + 标记 + 唤醒）。二按检查提升到状态路由之前（两次按下之间状态会迁移）；中止后复位 `state._suspAborted`；残余 `pendingInput` 队列条目按合并计划转回 `state.queue`（不静默丢）；回合启动解除 `exitArmed` 残留。

## 6.10 回合外事件后台化统一模型（分域池 + async advisor）

- **池容量**：`ASYNC_POOL_LIMITS = { engCoder: 4, other: 4 }`（默认）；角色域 = `role === "eng-coder"` → engCoder 池，其余（explore / plan / coder / sub）→ other 池。运行中计数按域分别记；队列补位按域腾槽。**跨域总量 8、同域仍 4**。
- **配置键**：`agent.poolLimits = { engCoder, other, advisor }`——subagent 两键运行期读 + 校验（正整数 ≥1，非法回退默认 4 / 4）；advisor 第三键由独立读取器消费（合法 ≥1 整数生效；非法 / 缺省回退 4）。变更下回合生效。配置面条目 = `docs/core/design/CONFIG.md` §6.1（本档不复制）。
- **bg 任务池（第三域 · 2026-09-29 · 批 tools-carryover · 台账 #9）**：`bash` 异步 ∥ 后台执行——新分域池 `_bgTasks`（照 `_asyncAdvisors` 模式：独立池 + 载体字段登记 + 条目 `{id, command, child, logPath, done, status, startedAt}`）；
  容量 `BG_TASK_MAX = 4`（对齐 `ASYNC_POOL_LIMITS` 单域 4；超限显式拒）；取号沿两池共用 `nextSubagentId` 命名空间（`bash#N` 前缀区分域）；settle ⇒ digest 注入单点族；收尾两档沿族口径（回合中断不杀 ∥ 会话中止逐条杀树 + 墓碑）。机制 / 接口契约 / 决策 = `docs/core/design/TOOLS.md` §6.19（D2——本节只登记池域）。
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
     ③ **跨 run 墓碑无区隔（登记）**：`_asyncTombstones` 随 VSC 载体跨 run 存活（`thincoder-core/agent-tools/async-settle.mjs:74-79`），
     而取号计数器 `_subAgentCounter` 不在载体字段集（取号 = `max(counter ?? 0, 活池 max) + 1`——`thincoder-core/agent-tools/subagent-scheduler.mjs:404-414`，两池皆空即从头取号）⇒ 旧 run 的 cancelled 号可在本 run 被重取（编号空间无跨 run 隔离）。
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
     **现形缺陷（`panel-messages.mjs:216-223`）**（as-of 2026-09-29）：advisor 分支**直调** `cancelAsyncAdvisor(...)` 后 `break`（无 callbacks / 无刷新）⇒ webview 评审等待头悬留（= F-3① 的端侧对位形）；该形**不得保留**（修法 = 删专用分支、并入共用路径——取消收尾单源）。
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

**第二处缺口（C-6 依赖终态判据）——已收口（F4 落码）**：`thincoder-core/agent-tools/subagent-scheduler.mjs` 的 `depInfo`（`:126-129`）现以 `t.status === "discarded" ? "cancelled" : t.status` 判墓碑——被丢弃的依赖目标归 `cancelled` 口径，依赖者不再误启动（#677 追认闭环）。

**收尾站③不接线的判据（父侧 U2 裁：接受）**：`finishSuspension`（`thincoder-core/agent/suspension.mjs:113-117`）是
`waitForSettleOrWake` 驱动的挂起会话收尾（`:208-220`），其形为 **carrier 形**（`_asyncSubagents` 挂在 carrier 上）——
该路径**无父 agent 注入目标**（无 `pushReal` 宿主 agent）——aborted 分支（`:98-107`）无任何注入通道（宿主注入器 `injectResidual` 仅非 aborted 分支消费，`:108-111`）；在此接线会把提醒写进 carrier 历史 = 语义扩张。
⇒ 登记为**已知残留**：该处仍为静默清池；若要对称须先定 carrier 注入目标（另批）。

**已知残留（consult 族）**：两接线点对 consult 族仍 `cleanupConsultSessions` 静默清场（无墓碑、无提醒——与对侧同形，边界 §6.20.8-4）；需求面（§4.10 F1–F4）只覆盖子代理 / 评审两池 ⇒ 本条不扩面；如需对称须先定 consult 的终态与提醒语义（另批——**评审轮 1 #7**）。

**族归属（escalate）**：两接线点按池作用（`getAsyncPool` 对 role ∉ {advisor, consult} 一律返 `_asyncSubagents`——`thincoder-core/agent-tools/async-settle.mjs:117-119`）⇒ escalate 族条目同被判丢弃、写 `discarded` 墓碑，并进入「background subagent(s) … re-spawn if the work is still needed」措辞的名单（`escalate#N`）——**与对侧同形（非端差）**。
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
- **D-AD8b 转义范围**：核 = 仅转义插值（沿 `async-settle.mjs:244/259` 先例；`escapeXml` 源 = `thincoder-core/agent/helpers.mjs:121`），对侧 = 整条文本转义（`thincoder-vscode/src/agent-tools/async-discard.mjs:83`）。文本骨架无 XML 特殊字符 ⇒ 输出等价。
- **D-AD8c status 回显面（评审轮 1 #5）**：对侧丢弃 id 经 `subagent status` 回显 `discarded`（`thincoder-vscode/src/agent/tool-table.mjs:94-96` 墓碑回读；对侧用例 T-D8 `thincoder-vscode/test/async-parity.test.mjs:293` · T-D13 `:436`）； （机检豁免——用例退场登记）
  CLI 侧除 `depInfo`（`thincoder-core/agent-tools/subagent-scheduler.mjs:123`）外零墓碑读取调用点（grep 实核）⇒ 丢弃 id 在 CLI 状态面报 unknown。
  **取舍**：本批不触碰 `subagent-actions.mjs`（488 行，贴 500 硬限——§6.20.8-3）——丢弃事实由整批提醒承载（模型可见面不缺）；**收敛方向 = 后续批**（status 墓碑回显与 `subagent-actions.mjs` 拆分同案，或并入 D-AD7 对侧收敛案）。

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
**⟦ev⟧queued 面板块头残差**（评审轮 1 #12）：`refreshQueuedTokens`（`thincoder-core/agent-tools/subagent-scheduler.mjs:346-362`）需 `onToken` 回调，两接线点无回调可传 ⇒ 块头序号随**下一次队列事件**自然重发（其 sig 含活队列序号——变化即重发）；本批登记为显示面残差（status / 面板读数取活队列索引，不受影响）。

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

## 6.30 timer 到期自唤醒（空闲唤醒面 · 第三开轮源）（2026-09-27 · 批 timer-wake · 台账 #443）

> 承 §6.8（会话级后台驱动：挂起窗 / 步边界 pickup / 合并消费）——本节落**第三开轮源 = 到期 timer**
> （前两源 = settle 消化〔digest〕· 子代理上行 ask〔`docs/core/design/AGENT-LOOP-UPSTREAM.md` §6.27〕）。
> 工具契约面 = `docs/core/design/TOOLS.md` §6.7（timer 行）；CLI 显示面 = `docs/cli/design/TUI.md` §7.6——显示形态本档不重述（D2）。

### 6.30.1 问题陈述与现状坐标（as-of 2026-09-27 实读）

- **零调度器**：设 timer = `_pendingTimers.push({ id, expiresAt, message })`——`thincoder-core/agent-tools/timer.mjs:59`（无 setTimeout / 无事件 / 无唤醒句柄）。
- **投递 = 工具回合边界轮询**：到期过滤 + 注入单点 = `thincoder-core/agent/post-turn.mjs:16-25`；唯一调用点 = `thincoder-core/agent/turn-loop.mjs:237`（回合循环内、工具批之后——三拆前 `thincoder-core/agent.mjs:431`）
  ⇒ 空闲（无回合在飞）时零投递、零唤醒。
- **实证**（2026-09-27 自然实验）：14:21 设 1500s（到期 14:46）→ 空闲期零送达 → 15:32 用户消息起新 run 后才注入（迟到 ≈47 min）。
- **在途跨 run 存活 = 规范语义**（决策 D-TW3）：核内 `_pendingTimers` 读写点三处——初值 `thincoder-core/agent.mjs:73`（三拆后档面收窄） · 写 `timer.mjs:55-59` · 消费 `post-turn.mjs:18-21`——**无 per-run 复位**。
- **端差（已消解 2026-09-28 · #445——裁定与现态见 §6.30.11 / D-TW3）**：跨 run timer 两端同存活（与核语义一致）。
- **桌面端**：挂起窗**已落**（2026-09-28 桌面空闲唤醒批——直消费核 `thincoder-core/agent/suspension.mjs` `startSuspension`；原「核挂起驱动在端上零消费者」句随该批收正）· 回合入口单一（`thincoder-desktop/src/main/ipc.mjs:78`）· 主进程仍零轮询 ⇒ **自唤醒面仍不存在**（无空闲 deadline 闩 + 核件 `waitForSettleOrWake` 无 timer 第三兑现态；§6.30.5 表）。

### 6.30.2 载体定形（D-TW1）

**候选三面实读**（父侧点名）：

- **busy 队列 / 步边界 pickup**：核循环头投递回调（`thincoder-core/agent/turn-loop.mjs:93`——三拆前 `thincoder-core/agent.mjs:244`）+ 端侧闭包 `thincoder-cli/src/tui/queued-pickup.mjs`——通道语义 = **用户消息** → 主会话投送；可达面 = 回合在飞（循环头）+ 驱动步骤 1 ⇒ 空转期无人取队，且 timer 借道会污染「用户排队」显示面与合并计划（`thincoder-core/queued.mjs`）。
- **挂起窗**：`thincoder-cli/src/tui/suspension-drive.mjs`（窗体 = `while` 循环，退出判据 `!poolLive(agent)`；等待原语 = `waitForSettleOrWake`，settle / wake / aborted 三态单次兑现）——窗只在池 live 时开；单条 timer 不构成开窗条件。
- **会话槽**：`thincoder-core/session-slots.mjs`——跨进程占用 / 槽位持久化面，**零步进能力**（无调度语义）。

**裁定：载体 = 核到期件（单一权威）+ CLI 端两处既有驱动面**：

1. **核**（新档 `thincoder-core/agent/timers.mjs`（已落 · 实读 **113** 内容行 · 2026-09-29 B3 收编后）· 三件纯函数）：`pendingTimerDeadline(agent)`（最近到期时点或 null——端闩 / 挂起窗 deadline / 显示面共用同源）、`takeExpiredTimers(agent, now)`（到期出列——幂等）、`injectTimerReminders(agent, entries)`（历史注入单点——逐字形态不变）；
   （**R4 上提后已扩面**——闩 ∕ 派发 ∕ 火策略住核：`createTimerWatch:79` ∕ `fireTimerWake:105`；「50」= R4 上提前读数；重锚 = §6.30.16 重锚清单⑤ · **已落**）
   `thincoder-core/agent/post-turn.mjs` 同批改调三件（**行为零变**——过滤语义与注入形态逐字保持）。
2. **CLI 空闲面**（新档 `thincoder-cli/src/tui/timer-watch.mjs`（已落 · 实读 **64**（2026-09-29 B3 收编后；「90」= B3 收编前读数）））：**一次性 deadline 闩**——到点自撤 · `unref()` · 单槽武装（重复武装 = 撤旧立新）；**非** interval 轮询、**非**第二执行引擎（开轮一律经既有回合驱动器 `runAgentTurn`）。
   形态先例 = `thincoder-cli/src/heap-watch.mjs:41-48`（`timer` 参数注入缝 + `unref`）+ `:12-13`（开关默认开 + 显式关键）。
3. **CLI 挂起窗内**：复用既有窗——`waitForSettleOrWake` 增**第三兑现态 `timer`**（deadline 到 ⇒ 与 settle / wake 同槽兑现，先到先得）。

**被否候选**：① 把 timer 并入 `poolLive`（在途 timer ⇒ 会话常挂）——挂起态语义被污染（状态行文本 / Ctrl+C 两级中止 / 输入改道 `pendingInput` 三面连带改）；
② busy 队列承载（通道语义 + 显示面污染，见上）；③ 新造并行调度器（禁止项——本设计零新调度器：到期件是纯读/取件）；
④ 只在核循环头补查（对空闲零作用——在飞回合面已由 post-turn 覆盖）。

### 6.30.3 接口契约（投递形态 · 消费入口 · 门三件）

**投递形态（D-TW2）**：到期 ⇒ `history.push({ role: "user", content: "[System reminder: ⏰ timer — <message>]" })`——逐字 = 既有注入单源（`injectTimerReminders`）；机器线独有（`[System reminder:` 前缀不入 fullHistory / 页面投影——两端同判）。

**消费入口（D-TW4）**：开一轮 **auto-turn 第三变体 `timerTurn`**——`runAgent` opts 增 `timerTurn`（与 `upstreamTurn` 同族，**仅作域文本选择**；域文本 = `TIMER_TURN_DOMAIN`（已落常量 · `thincoder-core/agent/helpers.mjs:459`））。

- **开轮两处**：空闲闩 fire ⇒ `runAgentTurn(ctx, "", { autoTurn: true, timerTurn: true })`（顶层链，`skipSession` 缺省——链尾全语义：队列续发 / 挂起入口 / attention 置位照常，**除外限定**：在途 timer ∧ 唤醒会武装 ⇒ 不计 awaiting——单源 = `docs/cli/design/TUI.md` §7.1 表 awaiting 行 / §7.2 置位谓词）；
  挂起窗内 ⇒ 同 digest 轮形态 `{ autoTurn: true, timerTurn: true, skipSession: true }`。
- **权限面 = 普通回合同款**（传宿主原 ctx——`askPermission` / `askQuestion` 保留）；digest 手动档剥处理器形态（`thincoder-cli/src/tui/suspension-drive.mjs:188-190`）**不**沿用：timer 语义 = 动手取数据，剥处理器会把「跑代码」机械变不可达。
- **动作域 = 系统轮既有机械面沿用**（`thincoder-core/agent-tools/subagent.mjs:271`：`_inAutoTurn && !autoApprove` ⇒ spawn 拒）；**不新增机械门**。
- **`TIMER_TURN_DOMAIN` 合同**（单行 · `[System reminder: …]` 形态 · 恒非空）：① 本轮由到期 timer 自动开启、无用户消息在等；② 按 timer 提醒语义推进（取数据 / 动手验证，而不是继续空想）；③ 范围 = timer 设定时在飞的工作，不开无关新工作；④ 动作完成或受阻即收尾。**逐字文本 = 父侧定稿（内容权威）**，本设计给合同与草稿位。

**门三件**：

- ① **仅系统类消息可自唤醒**：唤醒源 = `_pendingTimers`（唯一写点 = timer 工具 `thincoder-core/agent-tools/timer.mjs:59`）；投递形态 = 系统类 `[System reminder:` 通道；
  其它注入面（用户排队消息 / peer 提醒 / stall / goal / task 提醒）**零唤醒面**——闩只读到期件、不看 history，**无通用「注入即唤醒」通道**（防借道）。
- ② **成本闸**（沿用既有形态——不新增预算件）：到期批**合并一轮**（多条同批到期 ⇒ 一次注入 + 一轮）；**到期即消费**（出列幂等——绝不重复投递）；
  轮次帽 = 系统 `maxTurns`（§6.8 既有口径「auto-turn 不另设轮次预算」沿用）；撞帽**不自动续跑**（`thincoder-cli/src/tui/agent-turn.mjs:194-201` autoTurn 分支既有纪律）；
  在途条数帽 `TIMER_MAX_PENDING` = 8（与排队容量 `QUEUED_MAX_ITEMS`（`thincoder-core/queued.mjs:25`）同值同形）——超限 ⇒ timer 工具**显式拒**（抛错：不静默丢、不静默清；形态先例 = 队满「拒 + 提示 + 保留」）。
- ③ **开关**：配置键 `agent.timerWake`（布尔 · **默认 `true`**）——理由：① 工具描述面已承诺到点提醒（`thincoder-core/agent-tools/timer.mjs:16-27`）⇒ 默认关 = 缺陷留存量用户；
  ② 三条成本闸在 + 手动档动作面 = 权限面（用户在场才批）；③ 先例 = `diagnostics.heapWatch` 默认开 + 显式关键。**关 ⇒ 端侧不武装闩**（回到仅回合边界投递——既有语义；零调度器面）。
  键面派生：`agent.timerWake` 随核全量 DEFAULTS 派生进 `settings` 工具类型面（`thincoder-core/agent-tools/settings.mjs:62`——装载期派生）；
  已登记 = `docs/core/design/CONFIG.md` §6.2 **派生消费面**行（与 `diagnostics.heapSnapshot` / `diagnostics.heapWatch` 同列——实现面零改码）。

**描述面收正（D-TW8）**：`thincoder-core/agent-tools/timer.mjs:16-27` 的契约句（`:21`）「the reminder fires at the deadline」在自唤醒落地后成立；收正 = 保留该句为契约句 + 补**投递形态**一句（在飞回合 = 下一步边界投递 / 空闲 = 自唤醒）与在途帽一句。**逐字文本 = 父侧定稿**（内容权威）；参数 schema 零变。
**端限定（合同形——评审轮 1 #5 · 阶段 2 合同句）**：收正文本中「空闲 = 自唤醒」表述须携带**支持面限定**（回指 §6.30.5）——阶段 2 后支持面 = **CLI / VSC / 桌面三端前台**，headless（`chat` / ACP / 直连 `runAgent`）保留边界投递。
**合同句（定稿 2026-09-28 · 父侧逐字对齐实施落文 · 对应段 = `thincoder-core/agent-tools/timer.mjs:22-25`）**：`the idle wake is available on the CLI / VSC / desktop foregrounds and suspension windows (headless is structurally unsupported); other paths keep the step-boundary behavior`。
**`TIMER_TURN_DOMAIN` 正文** = 阶段 1 既有文本复用（端侧 re-export 核单源——零新文本；落点见 §6.30.11 VSC 块「域文本」行）。

### 6.30.4 关键决策记录（含否决备选）

| # | 决策 | 裁定 | 理由 / 否决面 |
|---|---|---|---|
| D-TW1 | 载体 = 核到期件 + CLI 一次性 deadline 闩（空闲）+ 挂起窗第三兑现态 | 采纳 | 空转期在既有管线中**无载体**（零 ticker：CLI 空闲期仅 heap-watch 60s / ledger 120s 两条 `unref` 采样，非回合驱动）⇒ deadline 闩为最小必要新增；被否四条见 §6.30.2 |
| D-TW2 | 投递形态 = `[System reminder: ⏰ timer — …]`（机器线独有） | 采纳 | 逐字沿用既有注入单源；零新增消息类 |
| D-TW3 | 在途跨 run 存活 = 规范语义（核不复位） | 采纳 | 到期语义要求（用户报告锚）；VSC 端差**已消解（2026-09-28 · #445——跨 run timer 两端同存活；见 §6.30.1）** |
| D-TW4 | 消费入口 = auto-turn 第三变体 `timerTurn` + 普通权限面 | 采纳 | 备选 A = 沿用 digest 域文本（组织域）⇒ 与「动手」语义相悖；备选 B = 剥处理器（digest 手动档形态）⇒ 「跑代码」机械不可达 |
| D-TW5 | 开关默认 `true` | 采纳 | §6.30.3 门三件 ③ 三条理由 |
| D-TW6 | 在途帽 = 8（超限显式拒） | 采纳 | 成本闸形态复用队容量先例（拒 + 保留，不静默） |
| D-TW7 | 可见面 = 状态行派生标记 + 触发落流一行 + `/timers` 只读列表；**取消面不做** | 采纳 | 显示形态单源 = `docs/cli/design/TUI.md` §7.6；取消 = 控制面（门 / 回执 / 持久化语义）⇒ 出「只观测不阻塞」边界，登记后续项 |
| D-TW8 | 描述面：契约句保留 + 补投递形态 / 在途帽句 | 采纳 | 见 §6.30.3；逐字 = 父侧定稿 |

### 6.30.5 跨形态行为表

| 形态 | 自唤醒 | 定义 / 理由 |
|---|---|---|
| CLI 前台（TUI 空闲） | ✅ | 一次性 deadline 闩（**核件消费**——B3 批改指 = §6.30.16；端面转口 = `thincoder-cli/src/tui/timer-watch.mjs`）——武装点 = 回合链尾「无人自动接手」判据邻位 |
| CLI 挂起窗（池 live） | ✅ | `waitForSettleOrWake` 第三兑现态；窗内到期即开 timer 轮（不等池空）；池空窗退 ⇒ 交空闲闩（到期件已出列——零重复投递） |
| CLI headless（`chat` 一次性 / ACP / 直连 `runAgent`） | ❌ 不支持 | 空转面不存在（`chat` 一次性 run 结束即退；ACP 回合由客户端驱动——`thincoder-cli/src/acp/session.mjs:20` `run = runAgent`、无挂起窗）；到期仍在下一工具回合边界投递（既有语义不变） |
| 桌面 | ✅（阶段 2） | 空闲 deadline 闩（`thincoder-desktop/src/main/timer-watch.mjs`（已落 · 实读 **76**——2026-09-29 收正）——主进程 · 键面 = 会话键）+ 窗内兑现（核件 opt-in timer 面 = §6.30.10）+ 触发落流（新 `ev:timer`）——落点逐条 = §6.30.11；门 / 帽沿用 §6.30.3 |
| VSC | ✅（阶段 2） | 端差已消解（`_pendingTimers` 跨 run 存活——复位行删除 · §6.30.11）+ 空闲 deadline 闩（**核件消费**——B3 批改指 = §6.30.16；端面 = `thincoder-vscode/src/extension/timer-watch.mjs`）+ 自有驱动第三兑现态 + 可见面（状态行 `⏰N` + 触发落行） |

### 6.30.6 受影响文件清单（R24a）

**实施后重锚 as-of 2026-09-27（实测）**：代码行读数（清单表 + >300 审视块）= 实施终态实测（`wc -l` 语义；增量 = 终态 − 设计轮现行）；文档四行 = 实施零触，保持不动。

| 文件 | 现行行数 | 实测增量 | 说明 |
|---|---|---|---|
| `thincoder-core/agent/timers.mjs`（已落） | — | **113（实测 · 2026-09-29 B3 收编后；「50」= R4 上提前读数）** | 到期件三件纯函数（deadline / take / inject）；**R4 上提后已扩面**（闩 ∕ 派发 ∕ 火策略住核——`createTimerWatch:79` ∕ `fireTimerWake:105`；重锚 = §6.30.16 重锚清单⑤ · 已落） |
| `thincoder-core/agent/post-turn.mjs` | 70 | **−4（实测 · 70→66）** | 块改调到期件（行为零变） |
| `thincoder-core/agent.mjs` | 444 | **+3（实测 · 444→447）** | opts `timerTurn` + 域文本三元 |
| `thincoder-core/agent/helpers.mjs` | 463 | **+9（实测 · 463→472）** | `TIMER_TURN_DOMAIN` 常量 + 注释 |
| `thincoder-core/agent-tools/timer.mjs` | 46 | **+17（实测 · 46→63）** | 在途帽显式拒 + 描述面字面收正（725 字符） |
| `thincoder-core/config.mjs` | 426 | **+3（实测 · 426→429）** | `agent.timerWake: true` |
| `thincoder-core/test/timer-wake.test.mjs`（已落） | — | **158（实测 · 新档）** | 核侧用例族（T-TW1 / T-TW2 / T-TW7 / T-TW9） |
| `thincoder-core/test/turn-domain-mode.test.mjs` | 57 | **+4（实测 · 57→61）** | 三元选择 + 域文本断言 |
| `thincoder-cli/src/tui/timer-watch.mjs`（已落） | — | **64（实测 · 2026-09-29 B3 收编后；「90」= B3 收编前读数）** | 一次性 deadline 闩（`timer` / `clear` 注入缝 · `unref`） |
| `thincoder-cli/src/tui/agent-turn.mjs` | 379 | **+7（实测 · 379→386）** | 链尾 `sync` 调用 + `userNeededAtTurnEnd` 在途 timer 除外（§6.30.3 attention 限定） |
| `thincoder-cli/src/tui/suspension-drive.mjs` | 341 | **+21（实测 · 341→362）** | timer 轮 + 窗内 deadline + 等待第三态 |
| `thincoder-cli/src/tui/turn-face.mjs` | 64 | **+3（实测 · 64→67）** | `turnCtx.timerWatch` 字段 |
| `thincoder-cli/src/tui/index.mjs` | 227 | **+13（实测 · 227→240）** | 装配 + 惰性回填开轮入口 |
| `thincoder-cli/src/tui/render-frame.mjs` | 423 | **+5（实测 · 423→428）** | `timerHint` 段（状态段簇尾） |
| `thincoder-cli/src/tui/cmd-timers.mjs`（已落） | — | **33（实测 · 新档）** | `/timers` 只读列表 |
| `thincoder-cli/src/tui/slash-commands.mjs` | 186 | **+3（实测 · 186→189）** | 名单 + 分派 + import |
| `thincoder-cli/test/timer-wake.test.mjs`（已落） | — | **274（实测 · 新档）** | 端侧用例族（T-TW3–T-TW6 / T-TW8 / T-TW10 / T-TW12 / T-TW13） |
| `thincoder-cli/test/cmd-timers.test.mjs`（已落） | — | **42（实测 · 新档）** | T-TW11 |
| `thincoder-cli/README.md` | 535 | **+1（实测 · 535→536）** | 配置键面示例（`agent.timerWake`） |
| 文档：`docs/core/design/AGENT-LOOP-ASYNC-POOL.md` | 385 | **+180（实测 · wc -l 565——设计轮 152〔§6.30 ≈148 + 变更记录 3〕+ fix 轮收正 28 · 实读 2026-09-28 = 745〔修正轮重锚——内容行数 ∕ `wc -l` 口径 · 文末换行不计〕）** | 本节（§6.30） |
| 文档：`docs/cli/design/TUI.md` | 797 | **+42（实测 · wc -l 839——§7.6 + fix 轮 §7.1 / §7.2 / §7.6 除外限定与可达条件）** | §7.6 显示面 |
| 文档：`docs/core/design/TOOLS.md` | 1131 | **+3（实测 · wc -l 1134——契约行改 + 变更记录 2 行）** | §6.7 timer 契约行补句（支持面指针） |
| 文档：`docs/core/design/CONFIG.md` | 206 | **+1（实测 · wc -l 207——登记行行内扩面 + 变更记录 1 行）** | §6.2 派生消费面登记行补 `agent.timerWake` |

**>300 advisory 档审视（本批触及 6 档——评审轮 1 #3 收正；先例 = 同档 §6.20.4 拆分计划 / `docs/cli/design/TUI.md` §6.8.3.4）**：

- `thincoder-cli/src/tui/suspension-drive.mjs`（341 → 362，+21）：改动 = 既有等待原语 `waitForSettleOrWake` 增**第三兑现态** + 既有驱动状态机增一条判据支（窗内 deadline 到 ⇒ 开 timer 轮）——
  无新模块职责 / 无新导出族（挂起窗单一驱动器职责未破）⇒ **本批不拆**。候选拆分面 = `finally` 收尾块（清场 + 计数日志，现文 `:287-340`）抽 `suspension-teardown.mjs`——在册 = §6.20.4 拆分计划行；
  现读 / 触发 = `docs/cli/design/CLI-DEBT.md` §2.2 B5 行（数据单一活面，本档不复读）。消解条件 = 越 500 硬限前 ∨ 该档下次实质改动时。
- `thincoder-core/agent/helpers.mjs`（463 → 472，+9）：域文本常量族内 +1 常量（`TIMER_TURN_DOMAIN`——同族 = `AUTO_TURN_DIGEST_DOMAIN` / `UPSTREAM_TURN_DOMAIN`，`:436` / `:450`）⇒ **本批不拆**（无新职责 / 无逻辑）；
  >300 为存量（机检在册 = `thincoder-core/test/core-hygiene.test.mjs` 的 `SOFT_LINE_REGISTRY:110`；设计侧拆分计划未在册——补登归父侧另案）。
- `thincoder-core/agent.mjs`（444 → 447，+3）：`runAgent` opts 旗标族内 +1（`timerTurn`——与 `upstreamTurn` 同族，`:101` / `:175-176`）⇒ **本批不拆**；
  拆分计划在册 = `docs/core/design/CORE-UNIFICATION.md` §2.8.1 子表行 6（`runAgent` 体内五面外提）。
- `thincoder-core/config.mjs`（426 → 429，+3）：`DEFAULTS` 键 +1（`agent.timerWake`——与 `diagnostics.heapWatch` 同形先例，`:87`）⇒ **本批不拆**；
  拆分计划在册 = `docs/core/design/CORE-UNIFICATION.md` §2.8.1 主表行 1。
- `thincoder-cli/src/tui/render-frame.mjs`（423 → 428，+5）：既有状态段簇内 +1 段（`timerHint`——同区先例 = `ledgerHint` / `titleHint`，§7.4）⇒ **本批不拆**；
  越线为存量——登记 = `docs/cli/design/CLI-DEBT.md` §2.1 A12 行（候选面 = §7 状态栏 / `enterHint` 面抽档）。
- `thincoder-cli/src/tui/agent-turn.mjs`（379 → 386，+7）：既有回合链尾 +1 调用（闩 `sync`）+ `userNeededAtTurnEnd` 除外判据 +1 项 ⇒ **本批不拆**；
  越线为存量——登记 = `docs/cli/design/CLI-DEBT.md` §2.1 A16 行（候选面 = 送达 / 兜底面抽档）。

### 6.30.7 用例表（正常 / 边界 / 错误）

| # | 场景 | 输入 | 预期 |
|---|---|---|---|
| T-TW1 | 正常·核到期件 | 在途两项（一到期一未到期）——`takeExpiredTimers` / `pendingTimerDeadline` 直驱 | 恰取到期项并出列；二次调用零返（幂等）；deadline = 最近时点；空在途 ⇒ `null` |
| T-TW2 | 正常·post-turn 回归 | `injectPostTurn` 直驱（到期项 / 未到期项） | 到期 ⇒ history 尾 = `[System reminder: ⏰ timer — <msg>]`（逐字）；未到期 ⇒ 零注入；行为与改前逐字等价 |
| T-TW3 | 正常·空闲闩武装 | 假 timer + 在途一项（+N ms）——`sync()` | timer 恰注册一次 · 延迟 = 最早到期差 · `unref()` 被调；无在途 ⇒ 零注册（并撤旧） |
| T-TW4 | 正常·空闲自唤醒（可复现） | 空闲态（`processing` / `suspended` / `_suspPending` 全假）+ 假 timer 触发 | 到期出列 + history 注入恰一条 + 触发落流恰一行 + 开轮调用恰一次（桩收 `{autoTurn:true, timerTurn:true}`） |
| T-TW5 | 边界·busy 期触发零动作 | `state.processing = true` ⇒ 假 timer 触发 | 零注入 / 零开轮 / 在途不动（交在飞回合 post-turn 路径——链尾重同步） |
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
| A-TW1 | 载体定形（含实读依据） | §6.30.2 三条候选实读 + 裁定 + 四条否决；载体三件落点逐条带坐标 |
| A-TW2 | 门三件定义 | §6.30.3：仅系统类可自唤醒（唤醒源单写点 + 无通用通道）· 成本闸（合并 / 幂等 / 帽 / 无自续）· 开关（键 / 默认 / 理由 / 关语义） |
| A-TW3 | 跨形态行为表 | §6.30.5 五形态逐格定义（自唤醒 / 不支持 + 理由）（**阶段 2 已接线**——桌面 / VSC 行改 ✅：见 §6.30.5 / §6.30.10–§6.30.11；本行 = 阶段 1 判据原样） |
| A-TW4 | 端面枚举（含「不接 + 理由」） | `docs/cli/design/TUI.md` §7.6（TUI 落点）+ §6.30.5（桌面 / VSC 不接 + 理由 + 后续登记——**阶段 1 原样 · 阶段 2 已接线**：同表两行改 ✅，见 §6.30.10–§6.30.11） |
| A-TW5 | 受影响文件全清单（行数标注制） | §6.30.6（现行行数 + 实测增量逐行） |
| A-TW6 | 验证形态（可复现） | §6.30.7 T-TW1–T-TW13（假 timer / 假到期 / 空转态直驱——零真实等待）；端面按各自既有测法 |
| A-TW7 | 机检零新增 | 仓根 `node scripts/doc-check.mjs`——对比**开工基线**（悬空 48 / 行宽 22）；本批逐档零新增（实施后复测：本批四档零命中——行宽 31 的 +9 全来自他批在途） |

### 6.30.9 边界（本批不做）

1. VSC / 桌面零写入 = **阶段 1 边界**（阶段 2 批已接线——§6.30.10–§6.30.15；端差裁定见 §6.30.1 / D-TW3）。
2. 不做 `/timers` 取消面；不做模型门控；**不新增机械门**（既有系统轮机械面沿用）。
3. 参数 schema 零变（timer 工具参数面）；不触 #442 已收口面；不扩压缩 / traces 等无关机制。
4. headless（`chat` / ACP / 直连 `runAgent`）**自唤醒面零变化**；**核工具面帽为全端共享**——在途 ≤ 8、超限显式拒（§6.30.3 门三件 ②）在 headless / VSC / 桌面 / 子代理同判：第 9 条 `timer` 由成功变抛错。
5. 子代理（depth>0）**显示面**零改（其面板时间面自持）；**工具面帽全端共享**（见边界 4）。

### 6.30.10 阶段 2 · 核件 timer 面（opt-in · 2026-09-28 · 批 timer-wake-phase2）

**问题陈述（as-of 2026-09-28 实读）**：阶段 1 的第三兑现态只落在 CLI 自有驱动（`thincoder-cli/src/tui/suspension-drive.mjs:123-156` / `:297-306`）；核件 `thincoder-core/agent/suspension.mjs` 的 `waitForSettleOrWake`（`:119-141`）仍三态（settle / wake / aborted）。
桌面**直消费核件**（`thincoder-desktop/src/main/suspension-drive.mjs:125`）⇒ 窗内无法兑现到期 timer；VSC 自有驱动同缺（`thincoder-vscode/src/extension/suspension.mjs:181-213`——端面自补，§6.30.11）。

**接口契约（opt-in · 缺省零行为变化——现宿主不传 ⇒ 逐字等价）**：`startSuspension(ctx)` 增读三枚**可选**注入项：

- `ctx.timerFace = { deadline, deliver }`——`deadline()` = 每轮步骤 4 起算前现算（`number|null`；缺省 / `null` ⇒ **零注册**，等待仍三态）；`deliver()` = 到期兑现面（返回布尔——是否已交付；**契约 = 同步 · 严格布尔**：判据 `=== true`——非布尔返值 ⇒ 静默零轮；
  宿主以核三件 `takeExpiredTimers` + `injectTimerReminders`（`thincoder-core/agent/timers.mjs`）实现 ⇒ 核内零文案、零显示、零端名分支）；
- `ctx.timer` / `ctx.clear`——注入缝（缺省 `setTimeout` / `clearTimeout`；先例 = CLI 同形注入缝 ⇒ 用例零真实等待）。

**循环兑现支（步骤 4 后）**：`why === "timer"` ∧ `deliver()` 真 ⇒ `runTurn("", { autoTurn: true, timerTurn: true })` ⇒ 轮后序与消化轮同形（`hooks.reclaim` + `hooks.onCounts`）⇒ `continue`。
池空窗退 ⇒ 交宿主空闲闩（到期件已出列——零重复投递；§6.30.11）。

**轮中止容纳（与消化支对称）**：timer 轮自身的回合级中止（`AbortError` ∧ 会话未停——`!abortSignal?.aborted`）**不是会话停止**——与消化支同判：容纳并重入循环（timer 轮不发 digest 边界 ⇒ 中止路径零边界、不补发轮后序钩子；池空 / pending 空自然退出）；其余（非 `AbortError` ∨ 会话停）照旧上抛——finally 清场同前（会话停 ⇒ 清池不注入）。镜像源 = `thincoder-core/agent/suspension.mjs:234-240`（消化支 catch 块）。

**被否备选**：① 核件内建 timers 依赖（等待原语直读 `pendingTimerDeadline`）——核件对 timer 面硬耦合，且 CLI 自有驱动面不动 ⇒ 同机制两套语义（否决）；② 桌面旁路核件自造第四份驱动——违 KD-34「消费核件」裁定（否决）。

**门三件沿用**（§6.30.3）：唤醒源 = `_pendingTimers` 唯一写点 · 成本闸（合并 / 出列幂等 / 帽 / 撞帽不续跑）· 开关 `agent.timerWake` 默认开（实现 = 端面活读）。
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
- **通道与可见面**：新 `ev:timer { key, text }`（触发落流一行；`text` = 交付原文，显示裁 = ≤3 行 + `…`——CLI 同规）⇒ 白名单 **18**（＝盘面现值——含在途批 `ev:ledger` / `ev:queue`；本批只增自身一位 · 定序同前——只增位）；
  `ev:usage.timers` 沿用（段 12 `⏰N` 源 = `renderer/views/statusline.mjs:167-174`（as-of 2026-09-29）——零改）；渲染 = 流内触发行（归约切片 `state.timerNotice[key]` + `renderer/views/chat.mjs` 行组——与 `ev:digest` 行同族：**生命期照其现行判据同法**——在场 / 退场随 `ev:digest` 行实现（页读整置即失）；实施轮按该行同法落地并在 §5 记明）。
- **新鲜度**：闩到点即开轮 ⇒ 到期不滞留（该轮回合尾读数同点刷新）；到期/已设两态凭 `⏰N` 段（派生式 · 零缓存）。

**VSC（批条目 B1）**：

- **端差消解（#445 —— 裁定见 §6.30.1 / D-TW3）**：`thincoder-vscode/src/agent/agent-state.mjs:30` 删 `agent._pendingTimers = []`（对齐「跨 run 存活」；顶层 agent 单例复用 ⇒ 天然跨 run 载体）；端内联块改调核三件（单源；形态同核 `post-turn.mjs` 改调先例——行为逐字等价）。
  **2026-09-29 parity-b1-vsc-core 收编后现态**：该内联块随主循环取核退场（原坐标 `thincoder-vscode/src/agent.mjs:421-429` 已死——调用点 = 核 `runAgent` 循环）。
- **空闲面**（`thincoder-vscode/src/extension/timer-watch.mjs`）：**核件消费**（B3 批改指 = §6.30.16——闩换源核 `createTimerWatch`；装配 `syncTimerWatch` 单例惰性建 + `getAgent` 活体读不动；火面 = 核策略 + 端两缝）；
  武装点 = `panel-turn-stages.mjs` `finalizeTurn` 尾（忙态归位后）与挂起会话退出 `finally`（`thincoder-vscode/src/extension/suspension.mjs`）；撤闩 = 面板 `dispose`（`extension/chat-panel.mjs`）与切槽销毁点。
- **开关生产者**：`agent.config.agent` 白名单增 `timerWake`（与 `autoThink` 同形）——`thincoder-vscode/src/agent/setup.mjs:153` ∕ `:177` ∕ `:196` → 白名单消费位 `thincoder-vscode/src/agent/agent-state.mjs:100`
  → 读面 = 核 `timerWakeEnabled`（B3 批改指——端壳不再自持判据）⇒ `config.json` `agent.timerWake: false` 端侧关闸生效（与 CLI / 桌面同判）。
- **窗内兑现（2026-09-29 parity-b1-vsc-core 收编后现态）**：核 `startSuspension` 等待面（`timerFace` opt-in + 兑现支——§6.30.13 核增补）；VSC 装配 = `thincoder-vscode/src/extension/suspension.mjs` `timerFace`（`{deadline, deliver}`——现档 291 行；原端自有驱动 `waitForSettleOrWake`（镜像面随取核退场））。
- **窗内容纳**：窗内 timer 轮自身的回合级中止（`AbortError` ∧ 会话未停）⇒ 容纳并重入（§6.30.10 轮中止容纳；与同档消化支同判）；其余（非 `AbortError` ∨ 会话停）照旧上抛——**现态（2026-09-29 parity-b1-vsc-core）**：容纳逻辑住核 `startSuspension` 等待面（端装配 = `thincoder-vscode/src/extension/suspension.mjs`；原端坐标 `:381-393` 已死）。
- **域文本**：`thincoder-vscode/src/agent/turn-domains.mjs` 选择链增 `timerTurn` 支（端侧零自持字面 = `setup-reminders.mjs` re-export 核 `TIMER_TURN_DOMAIN`）；域文本经核 `opts.turnDomainText` 装配（**现态（2026-09-29 parity-b1-vsc-core）**：原端注入点 `thincoder-vscode/src/agent.mjs` 随主循环取核退场——组合点 = `turn-domains.mjs`）。
- **可见面**：状态行 `⏰N` 段（源 = `usage` 载荷增字段 `timers {count, expired}`——`webview/status-bar.js` + `webview/state.js`）+ 触发落流一行（新消息 `timer { status:"fired", text }`——`webview/chat-messages.js` 渲染）+ i18n 键 `status.timer`；协议增量登记 = `docs/vsc/design/WEBVIEW-PROTOCOL.md` §3.2（本批两行）。

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
| T-TW23 | 正常·VSC 空闲自唤醒（**T-TW23b 变体** = 非空闲零动作——busy ⇒ 零交付 ∕ 零开轮 ∕ 在途不动） | panel 桩（idle）+ 假 timer + 假 `runChat` | `runChat` 桩收 `{autoTurn, timerTurn}` 恰一次；交付行恰一条 （机检豁免——用例退场登记） |
| T-TW24 | 正常·VSC 窗内兑现 | `suspensionSession` 直驱（池 live + 在途一项 + 假 timer） | 兑现 ⇒ timer 轮开（桩收 `{ autoTurn: true, timerTurn: true }`）；池空窗退后零重复投递 |
| T-TW25 | 正常·VSC 可见面 | 状态行直驱（在途 2 / 含过期 / 空）· `timer` 消息直驱 | 含 `⏰2`；含过期 ⇒ 警示形态；空 ⇒ 零段；消息 ⇒ 流内一行（原文） |
| T-TW26 | 正常·VSC 域文本 | `timerTurn`（手动档）⇒ 组合点 | 选中核 `TIMER_TURN_DOMAIN`；`upstreamTurn` 优先不回归 |
| T-TW27 | 边界·VSC 开关关 | `agent.timerWake = false` ⇒ 闩面 `sync` | 零注册 / 已注册者撤闩（与桌面 T-TW17 后半同判） |

**用例宿主**：T-TW14–T-TW16 → `thincoder-core/test/suspension.test.mjs`（原址补例；**修正轮补两桩**（非新号）：`clear` 先到先得臂 ∕ timer 轮中止容纳（±两负臂）——源 = 批档 §5.8）；T-TW17–T-TW21 → 新档 `thincoder-desktop/test/timer-wake.test.mjs`（T-TW21 亦落 `test/agent-host.test.mjs` 驱动面）；
T-TW22 → `thincoder-vscode/test/agent-lifecycle-singleton.test.mjs`（原址改例）；T-TW23–T-TW26 → 新档 `thincoder-vscode/test/timer-wake.test.mjs`（T-TW25 状态行面亦落 `test/status-line.test.mjs`；T-TW27 → 同档）；
  **修正轮补三桩**（非新号——随补注登记）：开关真链（`config.json` ⇒ 生产者真链 · 评审 🟡1）· 窗内 timer 轮中止容纳（`AbortError` ∧ 会话未停 ⇒ 容纳并重入 · ±两负臂 · 评审 🟡2）· 触发落流（`timer { status:"fired", text }`——协议 §3.2 行 19）——源 = 批档 §5.15。

### 6.30.13 受影响文件清单（R24a · 行数 = 实施后现盘实读（`wc -l` 口径 · 2026-09-28 收尾轮））

**实施后重锚（2026-09-28 收尾轮 · 现盘实读）**：代码行读数（表 + >300 审视块）= `wc -l` 语义现盘实读；增量 = 轨迹标注；与并行批同片者并注「本批面」与「现盘」两值（并行批增量归其自身批档）。

| 文件 | 现行行数 | 实测增量 | 说明 |
|---|---|---|---|
| `thincoder-core/agent/suspension.mjs` | **280** | +40（240⇒280——含修正轮 +7） | `timerFace` opt-in + 等待第四态 + 兑现支（修正轮：timer 支 `AbortError` 容纳） |
| `thincoder-core/test/suspension.test.mjs` | **336** | +72（264⇒336——修正轮补例两桩后） | T-TW14–T-TW16 + 修正轮补例两桩（`clear` 先到先得 ∕ timer 中止容纳）；**已越 300 ⇒ 登记路**——登记注释 = `thincoder-core/test/core-hygiene.test.mjs:108-115`（拆分方案 ∕ 触发条件在册） |
| `thincoder-desktop/src/main/timer-watch.mjs`（新档） | **79** | 新档（设计估 ~95） | 空闲 deadline 闩（键面 · 注入缝） |
| `thincoder-desktop/src/main/agent-host.mjs` | **341** | 本批（285⇒300 恰线）；现盘含并行批增量 | 两枚注入面（`busyOf` / `takeOver`）+ 透传——装配 ∕ 武装点 ∕ 撤闩落 `thincoder-desktop/src/main/suspension-drive.mjs`（实施期前提修正 · 源 = §5.9） |
| `thincoder-desktop/src/main/suspension-drive.mjs` | **269** | +73（196⇒269） | `timerFace` 装配 + 三武装点 + 撤闩 + 火面包装（轮后链尾接管）+ `driveTurn` 转发 |
| `thincoder-desktop/src/main/turn-face.mjs` | **70** | 本批（52⇒64）；现盘含并行批增量 | `timerTurn` 透传（核 opts 四件 ⇒ 五件） |
| `thincoder-desktop/src/preload/preload.cjs` | **59** | 位 16⇒17（本批——`ev:timer` 末位）；现盘 18 位 | `EVENT_CHANNELS` 白名单（名面同集同序——计数族在册 = `docs/desktop/design/PROJECT.md` §10 BE 行） |
| `thincoder-desktop/renderer/events.mjs` | **497** | 本批（393⇒475）；现盘含并行批增量 | `ev:timer` 归约（`state.timerNotice` 切片） |
| `thincoder-desktop/renderer/views/chat.mjs` | **354** | 本批（338⇒354——设计轮 439 为拆档前值） | 流内触发行（与 `ev:digest` 行同族） |
| `thincoder-desktop/renderer/events-subscribe.mjs` | **77** | 本批（74⇒75）；现盘含并行批增量 | 订阅表随动（现盘 18 位——与桥面同集同序） |
| `thincoder-desktop/renderer/store.mjs` | **328** | 本批（307⇒310）；现盘含并行批增量 | `timerNotice: {}` 初态（越 300 存量——登记面 = `docs/desktop/design/PROJECT.md` §4.2） |
| `thincoder-desktop/test/timer-wake.test.mjs`（新档） | **286** | 新档 | T-TW17–T-TW21 宿主 + 驱动面两例 + 渲染面一组 |
| `thincoder-desktop/test/host-floor.test.mjs` · `thincoder-desktop/test/agent-host.test.mjs`（随动） | **363** · **431** | 计数随动；两档现盘读数含并行批随动 | `host-floor` U76 计数 16⇒17 + `fresh` 入册；`agent-host` = T-TW21 驱动面 |
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
| `thincoder-vscode/test/timer-wake.test.mjs`（新档）等 | **396** | 新档（修正轮三例随补）；改例 `agent-lifecycle-singleton.test.mjs` 409⇒414 · `status-line.test.mjs` **239** | T-TW22–T-TW27 + `protocol-coverage` 面 |
| 文档：本档 §6.30 | **745**（全档实读——2026-09-28 修正轮重锚；口径 = 内容行数 ∕ `wc -l`） | +166（575⇒741——§6.30.10–§6.30.15 + 修正轮 ∕ 收尾轮随动） | §6.30.10–§6.30.15 |
| 文档：`docs/core/design/TOOLS.md` | **1137** | +3（1134⇒1137） | §6.7 timer 行支持面句 |
| 文档：`docs/vsc/design/WEBVIEW-PROTOCOL.md` | **657** | +8（649⇒657） | §3.2 两行 + §6.1 / §6.3 + §12 `timer` 行 + 变更记录 |

**>300 档审视（阶段 2 触及 · 读数 = 现盘实读）**：`thincoder-vscode/src/extension/suspension.mjs`（447 → **483**）：改动 = 既有等待原语增第三兑现态 + 既有状态机 +1 判据支（无新模块职责 / 无新导出族）⇒ **本批不拆**；该档 < 500 硬限，拆分计划登记面 = `docs/vsc/design/VSC-DEBT.md`。
`thincoder-vscode/src/agent.mjs`（456 → **455**——减行）· `thincoder-vscode/src/extension/chat-panel.mjs`（426 → **430**）· `thincoder-desktop/renderer/views/chat.mjs`（439 → **354**）越 300 不可免 ⇒ 越线为存量，登记面 = 各端债务档（桌面 = `docs/desktop/design/PROJECT.md` §4.2 / VSC = `docs/vsc/design/VSC-DEBT.md`）；
桌面另有 `thincoder-desktop/renderer/events.mjs`（393 → **497**）与 `thincoder-desktop/renderer/store.mjs`（307 → **328**）两档越 300 存量（登记面 = `docs/desktop/design/PROJECT.md` §4.2 同拍）；桌面其余本批档（`suspension-drive` / `turn-face` 两档——**269** ∕ **70**）与核档均 ≤300；`agent-host` 档本批恰线 300、现盘 **341**（越 300 = 并行批增量）。

**桌面档面落点（持有面——2026-09-28 收尾轮已落；机制面不动）**：

- `docs/desktop/design/UI.md:116`（段 12 计时行——补触发落流 `ev:timer` 与新鲜度指针）；
- `docs/desktop/design/IPC.md:29`（事件表增 `ev:timer` 行）+ 载荷键集段 + 会话键面 / 订阅面计数（**18**——盘面现值）；
- `docs/desktop/design/RENDERER.md`（流内触发行承载句——现档无 timer 条，补一行）；
- `docs/desktop/design/PROJECT.md` §10 **BE 行**（通道计数随动结算）· §4.2 行数读数；
- `docs/render-core/design/RENDER-CORE.md` §10 F 行（新鲜度句：空闲期到期 ⇒ 闩到点即开轮，读数于该轮回合尾刷新）；
- `docs/desktop/design/E2E-TESTING.md`（D16 真机用例行——**已落**（`T-DSK44`）；真机档 `timer-wake-face.test.mjs` 未落（离线不可产组 ⇒ 人工走查 + 真跑闭合））。

### 6.30.14 验收标准（阶段 2 · 逐条回指）

| # | 验收点 | 判据 |
|---|---|---|
| A-TW8 | 端差裁定（#445 + 分类冲突） | §6.30.1 裁定句 + §6.30.11 消解落点（复位行删除 / 核三件改调）；`docs/batches/2026-09-13-CORE-UNIFICATION.md:2081` 的「run 生命周期」分类行 = 冻结批档历史面（不回改），现态以本档 D-TW3 为准 |
| A-TW9 | 核件 opt-in（零行为变化） | §6.30.10 接口契约逐键在位；T-TW14–T-TW16 全绿（零回归 + 窗内兑现 + 零交付） |
| A-TW10 | 桌面自唤醒 + 可见面 | §6.30.11 桌面块逐条落点（闩 / 装配点 / 火面 / 透传 / `ev:timer`）；T-TW17–T-TW21 全绿；**D16 真机义务在册**（改可见面 ⇒ 真 Electron 使用面用例，验收由父侧真跑闭合——需求档 `docs/desktop/requirements/PROJECT.md:153`） |
| A-TW11 | VSC 自唤醒 + 可见面 | §6.30.11 VSC 块逐条落点；T-TW22–T-TW27 全绿；协议增量登记 = `docs/vsc/design/WEBVIEW-PROTOCOL.md` §3.2（两行） |
| A-TW12 | 口径收正（B3） | §6.30.5 表桌面 / VSC 行 ✅；§6.30.9 边界 1 指向阶段 2；`docs/core/design/TOOLS.md` §6.7 timer 行支持面句；timer 工具描述端限定句 = 父侧逐字定稿（§6.30.3 合同句） |
| A-TW13 | 机检零新增 | 仓根 `node scripts/doc-check.mjs`——对比开工基线（悬空 / 行宽字面随实施轮实测登记）；本批文档逐档零新增 |

### 6.30.15 边界（阶段 2）

1. 阶段 1 面零改（阶段 2 边界）：CLI 闩 / CLI 挂起窗 / 核三件 / 域文本 / 帽 / 开关语义逐字不动——**CLI 闩面随 B3 批改指核件（§6.30.16；机制语义零变）**＋**核件档头注释一行（`timers.mjs:16` 双写窗口句收正——同批）**；余五面仍逐字不动。
2. timer 参数 schema 零改；**不新增机械门**（动作域 = 系统轮既有机械面沿用）。
3. headless（`chat` / ACP / 直连 `runAgent`）自唤醒面零变化（无空转面 ⇒ 零闩）。
4. **不碰在途批文件增量**（`desktop-idle-wake` 收口中 / `desktop-vsc-align-2` / `desktop-vsc-align-3`）——实施方案与在途批同片（桌面 main / renderer · vscode）⇒ **排后串行**；桌面档面落点 = 持有面（§6.30.13 末块），**已落**（2026-09-28 收尾轮）。
5. `/timers` 取消面不做（阶段 1 既有边界沿用）；不接模型门控。
6. 渲染面零定时器纪律沿用（桌面渲染面零 `setTimeout` / `setInterval`——触发面全在主进程闩）。

### 6.30.16 端面收口 · VSC ∕ CLI 改指核件（2026-09-29 · 批 parity-b3-timer · 台账 #569）

**来源**：`docs/batches/2026-09-29-parity-closeout.md` §2 归批表 B3（annex `:52` + 重造③ `:131` + 上提② `:164`）；批任务书 ∕ 删留账 ∕ 实施序 = `docs/batches/2026-09-29-parity-b3-timer.md` §2（单源，本节不复载）。

**现状坐标（as-of 2026-09-29 收编后实测 · 113 内容行）**：核 `thincoder-core/agent/timers.mjs`——`createTimerWatch:79` ∕ `fireTimerWake:105` ∕ `timerWakeEnabled:61` ∕ `deliverExpiredTimers:69`（设计不动；档头 `:16` 双写窗口句随本批收正）。
桌面（对照组 · 已合规）= `thincoder-desktop/src/main/timer-watch.mjs:11-17`（核直取 + 判据 re-export）· `:22`（交付 = 核派发 + `ev:timer` 出词）· `:34-63`（键面表壳包核闩）· `:70-75`（火面 = 核策略 + 端两缝）——代码零触。
VSC 自持点 = `thincoder-vscode/src/extension/timer-watch.mjs:33-35`（判据副本）· `:46-64`（闩副本）· `:94-100`（火序列自持）；CLI 自持点 = `thincoder-cli/src/tui/timer-watch.mjs:24-26`（判据副本）· `:59-76`（闩副本）· `:43-48`（派发序列）· `:93-100`（火序列自持）。

**改指后接线（设计定稿；删 N ⇒ 留 M 明细 = 批档 §2.3）**：

| 端 | 核导入面（增 ∕ 换源） | 留端面（不迁 ∕ 不核包装） |
|---|---|---|
| VSC | `createTimerWatch`（本地闩副本退场）· `fireTimerWake`（火序列改核策略 + 端两缝：`busy` = `turnBusy` 判据 ∕ `openTurn` = `runChat`） | 交付适配（注入目标 = 会话活线 ∕ 活动线 · 空闲路 `_saveLines` 落盘 · `timer{status:"fired",text}` 发射——注入目标 ≠ `agent.history` ⇒ 不核包装；两原语 `takeExpiredTimers` ∕ `injectTimerReminders` 沿用）· 装配 `syncTimerWatch` ∕ 武装 ∕ 撤闩点不动 |
| CLI | `createTimerWatch`（经转口——签名 `{agent,onFire,timer,clear,now}` 零变；`{getAgent: ()=>agent}` 冻结捕获）· `deliverExpiredTimers`（+`onLine` = 显示裁 `pushLine(reminderDisplay(line), C.warn)`）· `fireTimerWake`（火序列改核策略）· `timerWakeEnabled`（re-export 转口） | 判据族（`timerWakeArmed` ∕ `modalOpen`）· 显示裁 `reminderDisplay` · 交付 ∕ 火转口（签名与返回零变——存量批测 `docs/batches/2026-09-28-tech-debt-closeout-r8.test.mjs` 冻结面） |

**零变不变量（核对点）**：① 闩——武装 ∕ 到点自撤 ∕ 重臂撤旧 ∕ `unref` ∕ 开关关零注册；② 交付——出列幂等 → 注入单源逐字 → 落流 ∕ 发帧；
③ 火——非空闲零动作（VSC = `turnBusy` 真 ∥ 无 agent；CLI = `processing ∥ suspended ∥ _suspPending ∥ modalOpen`）+ 零交付零开轮 + 开轮形 `{ autoTurn: true, timerTurn: true }`；④ 端面 API——CLI 导出面逐名零变；VSC 导出面 −1（`createTimerWatch` 退场——实读零消费者），其余签名零变。

**对拍法与用例**（先例 = R4 差分探针 `.thincoder/tmp/r4-diff-probe.mjs` 同法）：OLD 逐字拷贝 × NEW 端模块现值，同假钟同序列 ⇒ 可观察日志逐项相等；**改前先跑绿 → 改后同文件零改直跑仍绿**。用例宿主 = `docs/batches/2026-09-29-parity-b3-timer.test.mjs`（拟新增 · 批内单测随档）：

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
② `docs/vsc/design/WEBVIEW-PROTOCOL.md` §12 `timer` 行 ② 列（`thincoder-vscode/src/extension/timer-watch.mjs:83`——提取器档已随全清令退场，人工读值重锚）；③ §6.30.5 两行 ∕ §6.30.11 两 bullet 的「行数实施后重锚」标记；④ 批档 §2 设计估行数 ⇒ §5 实测；
⑤ `thincoder-core/agent/timers.mjs` 行数 ∕ 面描述（旧读「50 行 · 三件纯函数」= R4 上提前读数——已扩面：闩 ∕ 派发 ∕ 火策略住核 `createTimerWatch:79` ∕ `fireTimerWake:105`；与 §6.30.2 ∕ §6.30.6 同址注同拍——**已落（2026-09-29 · 113 内容行）**）。

**边界（本批不做）**：核件重设计（仅档头 `timers.mjs:16` 双写窗口句收正——本批即其迁移轮）· 桌面代码 ∕ 文件行零笔 · B1 ∕ B2 ∕ B4–B10 各族与 `#564` 在途面 · 挂起窗「窗内起算面未包判据」在册项（行为变更——另轮，见批档 §2.8）· 协议面（**坐标重锚 ≠ 协议语义变更**——`WEBVIEW-PROTOCOL.md` §12 指针重锚在册 = 本 § 重锚清单②）∕ 门三件 ∕ 在途帽 ∕ 域文本 ∕ 开轮形 ∕ 显示裁语义（§6.30.3 合同逐字沿用）。

**验收（端面接线面）**：① 两端档无自持闩体（结构核 = 档内无 `handle` 槽管理 ∕ 无 `unref` 调用）且导入面含核 timers；② 全径用例 + 对拍全绿 + 存量批测 r8 直跑绿；③ 端面 API 零变（CLI 逐名 ∕ VSC 除 `createTimerWatch` 退场外逐名）。批级验收 = 批档 §2.6。

## 变更记录

- 2026-09-29（**tools-carryover 批 · 设计档舱 D · eng-designer**——承批档 `docs/batches/2026-09-29-tools-carryover.md` §2.1.4 · 台账 #9）：§6.10 补 **bg 任务池（第三域）登记行**——`_bgTasks`（照 `_asyncAdvisors` 模式）+ `BG_TASK_MAX = 4` + 取号沿共用命名空间 + settle ∕ 收尾两档沿族口径；
  机制 / 接口契约 / 决策 = `docs/core/design/TOOLS.md` §6.19（D2）。**零新语义**（= §2.1 设计的落位）。

- 2026-09-29（**micros 批 · 档面波（解冻后）· eng-designer**——承 `docs/batches/2026-09-29-desktop-micros.md` §2 P4）：§6.30.10 按届盘实读收残余——镜像源重锚（`thincoder-core/agent/suspension.mjs` **219-226 ⇒ 234-240** · 消化支 catch 块）· 关的射程行闩面指针重锚（旧 CLI 行指针 `:67-68` ⇒ 核闩内判据——`timers.mjs` `createTimerWatch`）；
  端面镜像行按取核后现态收正（CLI 端内联坐标 `:301-315` 随 B1-P3 重写退场 ⇒ 容纳逻辑住核 `startSuspension` 等待面）；「关的射程」主句收正（CLI `:166` ∕ VSC `:236`）= 父侧微收正已载，本笔零重复。零新语义。

- 2026-09-29（**parity-b1-vsc-core 批 · 收口轮 · eng-coder**——承批档 `docs/batches/2026-09-29-parity-b1-vsc-core.md` §2.9）：§6.8 接入面句与步边界 pickup 三端句按**取核后事实**收正——「CLI ∕ VSC 各持端形驱动」⇒「三端皆消费核件 `startSuspension`（端差只在装配面）」；
  VSC pickup 落点 `thincoder-vscode/src/agent.mjs:197`（死坐标）⇒ 核 opts `consumeQueuedInput` 回调（`panel-turn-loop.mjs`——消费点 = 核循环头）。**机制语义零改**。

- 2026-09-29（**微收正（父侧直接执行 · 可 revert）**）：§6.30.10 关的射程行——「CLI 未包判据」残留陈述改「包判据已落」（CLI `:166` ∕ VSC `:236`——micros ∕ B1 收正轮）。零新语义。

- 2026-09-29（**B3 timer 收编批 · 实施后重锚（父侧直接执行 · 可 revert）**——承 `docs/batches/2026-09-29-parity-b3-timer.md` §5.6 收口波读数）：§6.30.2 ∕ §6.30.6 ∕ §6.30.16 现状坐标 ∕ 重锚清单⑤ 四处同拍——`timers.mjs` **113 内容行**；`createTimerWatch:79` ∕ `fireTimerWake:105` ∕ `timerWakeEnabled:61` ∕ `deliverExpiredTimers:69`。零新语义。

- 2026-09-29（**B3 timer 收编批 · 后重锚（父侧直接执行 · 可 revert）**——承 `docs/batches/2026-09-29-parity-b3-timer.md` §5 码面波交付）：§6.30.13 VSC `timer-watch.mjs` 行 **117 ⇒ 74**（收编后实读）+ 交付点 `:83` ⇒ `:39`；§6.30.16 重锚清单 ②（`docs/vsc/design/WEBVIEW-PROTOCOL.md` §12 `timer` 行）同笔落（`:39` + 其变更记录一行）。零新语义。

- 2026-09-29（**批 parity-b3-timer · 设计评审轮 1 修正（fix）· eng-designer**——承 `docs/batches/2026-09-29-parity-b3-timer.md` §3 轮次 1 · 父侧逐条裁定 1–9 全收）：§6.30.2 ∕ §6.30.6 同址注「**R4 上提后已扩面**」（`timers.mjs` 旧读 50 = R4 上提前——闩 ∕ 派发 ∕ 火策略住核 `:77` ∕ `:102`）+ §6.30.16 重锚清单补 **⑤**（该档行数 ∕ 面描述重锚）；
  §6.30.16 边界补「**坐标重锚 ≠ 协议语义变更**」（协议档指针重锚与「协议面零变」区分）；§6.30.15 边界 1 例外注补「**＋核件档头注释一行（`timers.mjs:16`）**」。修正块 = 批档 §2.9（逐号）。**机制语义零改**。

- 2026-09-29（**批 parity-b2-queued · 实施收正轮 · eng-coder**——承 `docs/batches/2026-09-29-parity-b2-queued.md` §2 ∕ §2.10（评审 #61 修正块）· 台账 #566）：§6.8 合并消费条「**双端同名常量**」⇒「**核单源常量**」·「**双端各自实现、语义 / 常量 / 文案同源**」⇒「**核单源 + 两端转口同一绑定（对拍锁 = 批档本地件）**」；
  §6.30.3 门三件② 指针 `thincoder-cli/src/tui/queued-merge.mjs:25` ⇒ `thincoder-core/queued.mjs:25`（核件 `QUEUED_MAX_ITEMS` 行）。**机制语义零改**（VSC ∕ CLI 自持副本退场——核单源转口；行为零变）。

- 2026-09-29（**批 parity-b3-timer · 设计轮 · eng-designer**——承 `docs/batches/2026-09-29-parity-b3-timer.md` §1 · 归批 = closeout §2.5 B3 · 台账 #569）：新增 **§6.30.16**（端面收口 · VSC ∕ CLI 改指核件——现状坐标 ∕ 改指后接线表 ∕ 零变不变量 ∕ 对拍法与用例 T-TW28–T-TW35 ∕ 实施后重锚清单 ∕ 边界 ∕ 验收）；
  §6.30.5 CLI ∕ VSC 两行 + §6.30.11 桌面空闲面 ∕ VSC 空闲面 ∕ VSC 开关读面三 bullet + §6.30.11 尾块按改指口径收正（闩 ∕ 交付 ∕ 火策略 ⇒ 核件消费；桌面 bullet 补记 R4 上提实态，旧「形 = CLI 自持」句随两端口径统一退场）；§6.30.15 边界 1 补 **B3 例外注**（CLI 闩面改指——余五面不动）；核 ∕ CLI ∕ VSC 行数读数并入「实施后重锚」清单。**机制语义零改**（端面实现层收口；门三件 ∕ 帽 ∕ 域文本 ∕ 开轮形逐字沿用）。

- 2026-09-29（**doc-sync-residuals 批 · 设计面残留收正轮 · eng-designer**——承 `docs/batches/2026-09-28-tech-debt-closeout.md` §1.19 收正行 ① + §5 三登记句）：§6.30.10 门三件沿用块补 **#448 两句**（① 模态期抑制 + 关闭后补评估——`modalOpen` 门 + 四关闭点装配；② 异常径重武装 + 会话停 ∕ 显式撤销除外——实落 = 粘滞位 `_timerRearmRevoked`）；
  §6.8 被否候选④补 **#251 转档条件句**（另开批次评估前置 = 用户请裁）。**机制语义零改**（#513 CLI 句 = 文档收正大合并轮 D 组已落——本轮零触）。

- 2026-09-28（**文档回填与卫生轮**（台账 #516 · timer-wake 回填面）· eng-designer）：§6.30.12 用例表 T-TW23 行补 **T-TW23b 变体**容纳（非空闲零动作）+ 用例宿主行补 **VSC 修正轮三桩注**（非新号：开关真链 / 窗内 timer 轮中止容纳 / 触发落流——源 = 批档 §5.15）。 （机检豁免——用例退场登记）
  轮次 1 修正（批档 §3 轮次 1 发现 1 / 7）：§6.8 三端句两处去「（拟新增）」（`thincoder-cli/src/tui/queued-pickup.mjs` ∕ `thincoder-desktop/src/main/queued-input.mjs`——在盘为实）；§6.30.12 ∕ §6.30.13 全档自锚重锚 **745**（实读 2026-09-28）。**零新语义**。

- 2026-09-28（**批 timer-wake-phase2 · VSC 收尾终锚 · eng-designer**——承 `docs/batches/2026-09-28-timer-wake-phase2.md` §5.15）：§6.30.11 VSC 块补**开关生产者句**（白名单增 `timerWake`——与 `autoThink` 同形；三落点链 = `thincoder-vscode/src/agent/setup.mjs`）与**窗内容纳句**（`AbortError` ∧ 会话未停 ⇒ 容纳并重入——同 §6.30.10 句判）；
  §6.30.13 补 `thincoder-vscode/src/agent/setup.mjs` 行 + 全表按现盘实读重锚（`wc -l` 口径——与并行批同片者两值并注）；
  `docs/vsc/design/VSC-DEBT.md` 读数同步（`thincoder-vscode/src/agent/setup.mjs` 421⇒427 · `thincoder-vscode/src/extension/suspension.mjs` 447⇒483 + 测试档越线登记）。**机制语义零改**。

- 2026-09-28（**批 timer-wake-phase2 · B3 落文对齐（父侧直接执行 · 可 revert）**——承 B3 舱 #43 表外报出）：§6.30.3 `:442` 合同句引文按实施落文逐字对齐（语义同判：三端前台 · headless 结构性不支持）；同块 `:387` ∕ `:430` ∕ `:435` ∕ `:440` 四处行指针按现盘重锚（`:59` ∕ `:16-27`）。**机制语义零改**。

- 2026-09-28（**批 timer-wake-phase2 · 核件修正轮后重锚（父侧直接执行 · 可 revert）**——承实施修正轮 #41 交付）：§6.30.13 两行再锚（`thincoder-core/agent/suspension.mjs` 240 ⇒ **280**（+40 · 含修正轮 +7）；
  `thincoder-core/test/suspension.test.mjs` 264 ⇒ **336**（+72 · 补例两桩后越 300 ⇒ 登记路——登记注释 = `thincoder-core/test/core-hygiene.test.mjs:108-115`））；§6.30.12 用例宿主句补「修正轮补两桩」注；核侧登记注释末句随收正。**机制语义零改**。

- 2026-09-28（**批 timer-wake-phase2 · 核件面实施后修正（fix）· eng-designer**——承 `docs/batches/2026-09-28-timer-wake-phase2.md` §5.7「待父侧处置」1–3 + 代码评审 🔵3）：
  §6.30.10 补 **timer 轮中止容纳句**（`AbortError` ∧ 会话未停 ⇒ 与消化支同判——容纳并重入循环；镜像源 = `thincoder-core/agent/suspension.mjs:236-239`）+ **`deliver()` 契约钉句**（同步 · 严格布尔——非布尔返值 ⇒ 静默零轮）；
  §6.30.13 两行实测重锚（`thincoder-core/agent/suspension.mjs` 240 ⇒ **273** · `thincoder-core/test/suspension.test.mjs` 264 ⇒ **300**——该档抵 300 行门，补例须拆档 ∕ 登记）。

- 2026-09-28（**回合中插入批 · 设计评审轮 1 修正（父侧直接执行 · 可 revert）**——承评审 #29 发现 #8）：§6.8「**双端**」⇒「**三端**」（补桌面——宿主单源队 + 步边界注入 + 回合尾续发；附件留队端差；单源 = 批档 KD-40）。明细 = `docs/batches/2026-09-28-desktop-midturn-input.md` §4。

- 2026-09-28（**批 timer-wake-phase2 · 设计评审轮 1 修正（父侧直接执行 · 可 revert）**——承评审 #28 发现 #1–#9 逐条处置）：§6.30.13 三档现行行数补齐（`store.mjs` **307** · `panel-callbacks.mjs` **313** · `state.js` **128**）+ >300 审视块补桌面 `renderer/events.mjs` / `renderer/store.mjs` 两档行；
  计数重锚 **18**（盘面现值——含在途批 `ev:queue`；§6.30.11 / §6.30.13 三处 + 末块同拍）；§6.30.8 A-TW3 / A-TW4 补「阶段 2 已接线」限定句；§6.30.11 触发行生命期 = 照 `ev:digest` 行同族同法（页读整置即失）；
  §6.30.12 补 T-TW27（VSC 开关关）+ 用例宿主同拍；§6.30.14 A-TW9 补点名 T-TW15 / T-TW16、A-TW11 计数随动；§6.30.3 合同句 = **定稿**（+ `TIMER_TURN_DOMAIN` 正文 = 阶段 1 复用句）。**机制语义零改**。
- 2026-09-28（**批 timer-wake-phase2 · 设计收尾轮 · eng-designer**——承 `docs/batches/2026-09-28-timer-wake-phase2.md` §2 · 台账 #446 + #445）：阶段 2 收尾随动——白名单计数重锚（**16 ⇒ 17**——盘面现值 +1；`preload.cjs` 行 / `events-subscribe` 行 / §6.30.11 同拍）·
  §6.30.13 末块「桌面档面落点」**已落**（六处 + VSC 协议登记 + E2E 行拟新增）+ §6.30.15 边界 4 同拍；清项 = 路径全形五处 + 行宽两处。**机制语义零改**。

- 2026-09-28（**批 timer-wake-phase2 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-28-timer-wake-phase2.md` §1 · 台账 #446 + #445 · 用户 13:57 分阶段裁定）：新增 §6.30.10–§6.30.15（阶段 2）——
  核件 timer 面 opt-in（`startSuspension` 三注入项 + 等待第四态 + 兑现支；缺省零行为变化）· 端面接线（桌面 = 空闲 deadline 闩（键面）+ 窗内兑现 + `ev:timer` 触发落流 ∥ VSC = 端差消解 + 空闲闩 + 自有驱动第三兑现态 + 状态行 `⏰N` / 触发落行）·
  用例表 T-TW14–T-TW26 · 受影响文件（含桌面档面持有面清单）· 验收 A-TW8–A-TW13 · 边界；§6.30.3 端限定合同句收正（三端前台 · headless 保留边界投递）· §6.30.5 桌面 / VSC 行 ⇒ ✅（阶段 2）· §6.30.9 边界 1 指向阶段 2。**阶段 1 语义零改**。

- 2026-09-28（**桌面空闲唤醒批 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-28-desktop-idle-wake.md` §1 · 台账 #504）：三处**「桌面无挂起窗」登记收正**（桌面已接驱动——直消费核 `startSuspension`；本批零改核件）：
  §6.8 补**三端接入面**句（「无 suspension 驱动的调用方」集收窄）；§6.30.1 桌面端条收正（挂起窗已落 + 自唤醒面仍不在的理由重列）；§6.30.5 桌面行理由收正（原「无挂起窗」不再成立——剩余 = 无空闲 deadline 闩 + 核件无 timer 第三兑现态 + 可见面白名单随动；消解窗口 = 桌面 timer 自唤醒另批）。**机制语义零改**。

- 2026-09-27（**timer-wake 批 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-27-timer-wake.md` §1 · 台账 #443）：新增 §6.30（timer 到期自唤醒——空闲唤醒面 · 第三开轮源）：
  载体定形（核到期件 + CLI 一次性 deadline 闩 + 挂起窗第三兑现态；四条否决候选）· 投递形态 / 消费入口（auto-turn 第三变体 `timerTurn` + 普通权限面）· 门三件（仅系统类可自唤醒 / 成本闸 / 开关默认开）·
  跨形态行为表（CLI 前台自唤醒 · headless 不支持 · 桌面不接 + 理由 · VSC 端差发现项）· 受影响文件 / 用例表 / 验收回指 / 边界；承载节列表同批登记。

- 2026-09-27（**timer-wake 批 · 设计评审轮 1 修正轮（fix）· eng-designer**——承 `docs/batches/2026-09-27-timer-wake.md` §3 轮次 1 · 父侧逐条裁定 1–8 全收）：§6.30 逐条收正——
  A-TW7 判据改「本批新增闸项 = 0（as-of 2026-09-27 基线读数带字面：悬空 48 / 行宽 22）」；§6.30.3 attention 除外限定（在途 timer ∧ 唤醒会武装 ⇒ 不计 awaiting——单源 = `docs/cli/design/TUI.md` §7.1 / §7.2）+ 描述面收正补**端限定合同形** + 键面派生句同步（已登记 = `docs/core/design/CONFIG.md` §6.2）；
  §6.30.6 补 **>300 档审视结论块**（6 档逐档不拆 + 理由 / 登记面指针）+ 补 `CONFIG.md` 登记行 + `agent-turn.mjs` 行增量收正；§6.30.7 补**用例宿主落点行** + 新例 T-TW13（attention 除外）；A-TW6 计数同改（T-TW1–T-TW13）。**机制语义零改**（除父侧定稿的 attention 除外）。

- 2026-09-27（**timer-wake 批 · 实施后重锚（fix）· eng-designer**——承 `docs/batches/2026-09-27-timer-wake.md` §5 实测读数）：§6.30 实施后重锚——§6.30.6 代码行增量（含新档行数）逐行改**实测** + >300 审视块六档读数同步 + A-TW5 术语同步（实测增量）；
  §6.30.9 边界 4 加限定（核工具面帽全端共享——第 9 条 `timer` 由成功变抛错）；A-TW7 判据改**开工基线**字面（悬空 48 / 行宽 22）；
  **机制语义零改**；文档四行 = 实施零触，保持不动。

- 2026-09-24（**queue-visible 批 · fix 轮（步边界 pickup）· eng-designer**——承 `docs/batches/2026-09-24-busy-queue-visible.md` §1.11 / §1.12 / §1.13 · 用户 03:06 收正）：§6.8 增**步边界 pickup**块——
  「用户 → 主会话」投送通道（选型 = 复用核「回合边界投递」缝 `consumeQueuedInput`；被否候选六项；不中断语义 = 循环头检查点；与 Ctrl+I 逐字区分；三时机时间序；CLI / VSC 双端落点）。**队列容量 / 合并消费 / 挂起状态机 / 池管理零变**。

- 2026-09-24（**queue-visible 批 · 需求裁定升级轮（多槽 + 合并消费）· eng-designer**——承 `docs/batches/2026-09-24-busy-queue-visible.md` §1.10）：§6.8 主会话 busy 提交面由「单槽」改**队列（容量 8 条）**+ 新增**合并消费**条（攒批计划 / 双端同名常量 / 编号形态）；挂起状态机行表三行同步（入队 / 队满 / 合并开回合）；Ctrl+C 中止残余句同步（队列条目按计划转回 `state.queue`）。**状态机其余行 / 池管理 / settle 时序零变**。
- 2026-09-22（**structure-debt 批 · 档面车道 · eng-designer**——承 `docs/batches/2026-09-22-structure-debt.md` §2.5 · 台账 #67）：**建档**——自 `docs/core/design/AGENT-LOOP-SUBAGENT.md` 三分迁出
  §6.8 · §6.10 · §6.11 · §6.18 · §6.19 · §6.20（**段零改动**——逐字搬移、节号沿用；全仓档面指针同批改指本档名）。
- 2026-09-29（**批 b2-collection-correction · 收正轮 · eng-coder**——承台账 #562）：§6.30.2 载体候选行合并计划引用 `thincoder-cli/src/tui/queued-merge.mjs` ⇒ `thincoder-core/queued.mjs`（核单源）。**零新语义**。
- 2026-09-29（**doc-sync-residuals 批 · 修正轮（评审 #202 发现 1 ∕ 3 ∕ 6 ∕ 9）· eng-designer**）：按届盘收正——§6.30.10 模态门坐标 `:80` ∕ `:96` ⇒ `:47-48` ∕ `:60`；关闭点集改述「三装配点 + 两注入位」（计数口径随句）；
  `thincoder-cli/src/tui/timer-watch.mjs` 两处读数 90 ⇒ **64**（B3 收编后）；§6.30.6 登记指针改指 `docs/cli/design/CLI-DEBT.md` §2.1 A16；§6.30.16 重锚清单①打「已落」。**零新语义**。
- 2026-09-29（**core-hygiene 批 · P3 文档收正 · eng-designer**——承批档 `docs/batches/2026-09-29-core-hygiene.md` §2.8 行 5）：循环头投递回调 ∕ `_pendingTimers` 三处 ∕ timer 投递调用点坐标按 **P2 三拆**收正（循环头 = `agent/turn-loop.mjs:87-93`；投递调用点 = `:237`；初值 = `thincoder-core/agent.mjs:73`）；档头补三拆坐标注。机制条文零改。

- 2026-09-30（**跨线清零轮 · 设计档收正 · eng-designer**——承 `docs/batches/2026-09-30-crossline-clearance.md` §2 · 台账 #677）：§6.30.1 端差行收正——VSC 每 run 清空 `_pendingTimers` 旧句（「另批对齐」）退场；现态 = 跨 run timer 两端同存活（消解 = #445 轮——见 §6.30.11）。**零机制改**。
