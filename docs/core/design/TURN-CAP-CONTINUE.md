# 撞轮数墙可继续（TURN-CAP-CONTINUE）· Agent 循环板块

> 板块 = **轮数预算耗尽后的续跑**（撞墙可继续）——统一语义 · 四执行体 · 跨段累计编号。
> 本档 = 该机制的**唯一权威**（续跑语义 / 编号口径 / 双端坐标）。
> 相邻权威 = `docs/core/design/AGENT-LOOP.md`（主循环与子代理机制本体）· `docs/core/design/AGENT-PARAMS.md`（轮数预算默认值族）·
> `docs/core/design/ESCALATE.md`（飞刀）· `docs/core/design/CONSULTATION.md`（会诊）——本档不复制其内容（D2）。
> 需求侧 = `docs/core/requirements/TURN-CAP-CONTINUE.md`（F1–F9 / N1–N6）。
> 建档：2026-09-15（**B 式迁移轮 · VSC 批 3**——`thincoder-vscode/docs/design/TURN-CAP-CONTINUE.md` 内容重建入基准层；
> 旧档原地一字不改、留作参照历史）。CLI 侧同名档（`thincoder-cli/docs/design/TURN-CAP-CONTINUE.md`）**已并入（2026-09-15 · CLI 尾部真批）**——
> CLI 独有面（`runWithContinue` 骨架 / TUI 继续通道 / CLI 消费链坐标 / D-19 族决策）已入 §1–§5，(d) 类入 §6.1。
> 本档坐标 = **as-of 2026-09-26 实核**（仓根 = `thincoder/`）——§1–§5 全族于实施后修正轮逐点复核（#95 检查点批 · #18 载入面缺口批——行号随动现行代码）。

## 1. 统一语义

| # | 条目 | 判据 |
|---|---|---|
| 1 | **撞墙** | `runAgent` 耗尽 `maxTurns` 抛 `ContinueError`（核 `thincoder-core/agent.mjs:435`（抛点）；VSC `thincoder-vscode/src/agent.mjs:7`（核单类转口导入）/ `:46`（再导出）/ `:441`（抛点）——2026-09-26 实核） |
| 2 | **继续** | `resume:true` 重跑**同一执行体**：不重新注入任务文本、保留 history 与改动记录、每次全新轮数预算（VSC `thincoder-vscode/src/agent.mjs:54`（`runAgent` 入口——`resume` 经 `opts`，复位判 `:170`）；核 `thincoder-core/agent.mjs:101`） |
| 3 | **拒绝 / headless** | 无 `onQuestion` 或无权限 handler → 返回部分成果 + turn-cap 标记——`TURN_CAP_MARK = "stopped: turn cap reached"`（常量单源 = `thincoder-core/agent/child-marks.mjs`——2026-09-20 下沉零依赖叶，`agent/spawn-child.mjs:35` 原样再导出；尾部附 "work may be partial"）——报告据此判定「撞墙中断、工作可能不完整」。**触发面（2026-09-26）**：无 handler / headless ∨ 检查点未获续期（父答停 ∨ 父不可达 ∨ 会话中止——#7） |
| 4 | **用户 Stop 优先** | 中止路径（`AbortError` / `signal.aborted`）恒优先于继续提示——不弹卡、不自动续跑 |
| 5 | **继续提示串行** | 会话级队列消费者 = **会诊（唯一）**（`continueQueue`——`agent-tools/consult.mjs:331`；检查点报请仍串行其上）；**同步子代理**走 `_permQueue`（核 `subagent.mjs:313`）；**同步飞刀 = 直问用户**（无队列）；异步飞刀权限同经 `_permQueue`（核 `escalate-async.mjs:242`）；**depth-0 直弹卡、无会话队列**（CLI `agent-turn.mjs:203-224` / VSC `panel-turn-loop.mjs:142-152`）；**异步族**经上行通道报请（无队列——#7；**会诊除外**——见本行首句）。并行执行体同时撞墙不弹多个卡 |
| 6 | **次数不限** | 无次数帽（`MAX_RESUMES` 形态已从代码面移除——VSC 侧 `src/` 零命中实核）；防卡死靠用户 Stop（**不设零产出阈值**——2026-09-26 裁定） |
| 7 | **撞帽检查点（F8 · 2026-09-26）** | 撞帽 ⇒ **不再静默自动续期**：**异步族**（后台子代理 / 异步飞刀 / 会诊）⇒ **报请父代理**（上行 ask：载荷 = 段数 / 跨段累计轮次 + 去向一句话）；父答**续期** ⇒ 同执行体 `resume:true` 重入（#2 不变量）+ 新段预算（会诊同挂 watchdog 重置）；父答**停** ⇒ #3 partial。**同步族**（阻塞子代理 / 同步飞刀）⇒ **用户卡路径保留**（父代理被本次调用阻塞 · 应答不可达；挂起亦不可续——累计 history 随调用返回丢弃）。depth-0 ⇒ 用户卡（digest 无人值守档 ⇒ 收口，原 AUTO 自续退役）。**AUTO 一律不再自动批准续期**——**AUTO × 同步族**（2026-09-26 明）：AUTO 档对 `continue` 名不再短路（CLI `interaction.mjs:68` / VSC `panel-callbacks.mjs:279`）⇒ 卡**在场待答**；无人应答（headless / 无人值守）⇒ 落 #3 partial（非静默放行）。**可答判据（机械）** = `child._upstream?.parent` 在场且 `sync !== true` ⇒ **段边界挂起**（不 settle / 不重派——§5 D-TC12）；不可达 ⇒ #3 partial。留痕 = 跨段累计轮次 + 段数（§4）+ 摘要文本面（§3.1） |
| 8 | **载入面自证（2026-09-26 新增）** | 运行面与仓内面的一致性**可核**——「以为在跑新码」必须可自证：① **启动期诊断**——VSC 激活时记一行 `[thincoder] core face = <core 实体路径> (v<版本>)`（路径经 `import.meta.resolve("@thincoder/core/agent.mjs")` 取实体目录；版本读同目录 `package.json`）——**不比对、不拒载**（只留证据；读取失败 ⇒ 记 `core face = unresolved`，不抛 / 不阻断激活——§3.2 注）；② **打包面机检**——`thincoder-vscode/scripts/check-vsix.mjs` 增断言：vsix 内 `@thincoder/core/agent-tools/checkpoint.mjs` 存在 ∧ `agent-tools/subagent-run.mjs` 含 `registerTurnCapCheckpoint`（接线未进包 ⇒ 机检即红，不靠人眼）。**不动机制语义**；实况触发 = 运行面为安装包冻结旧构建（`docs/batches/2026-09-26-turn-cap-live-gap.md` §2.2） |

## 2. 四执行体（预算 / 通道 / 上限）

| 执行体 | 轮数预算（默认） | 继续通道 | 次数 |
|---|---|---|---|
| 主 agent | `agent.maxTurns`（200） | 用户卡（"Continue / Stop"）；**digest（无人值守）档不再自续**——撞帽即收口（#7） | 不限 |
| 子 agent | `agent.subagentTurns`（100） | 后台 async ⇒ **父代理检查点**（#7——段边界挂起；**答复载具 = `send`（续期 + 文本作新段首条指令）/ `cancel`（停）**）；同步（阻塞）⇒ **用户卡保留**（AUTO 不再自动批准） | 不限 |
| 飞刀 escalate | `agent.subagentTurns`（100） | async ⇒ **父代理检查点**（#7——同池、同载具）；同步 ⇒ **用户卡保留**（直问用户——无 permQueue） | 不限 |
| 会诊 consult | `agent.consultTurns`（40） | **父代理检查点**（#7——答复载具 = `send` / `cancel`）+ `session.continueQueue` 串行（全仓唯一消费者）；续期 = **新段预算 + 墙钟 watchdog 重置**（N3 保持） | 不限 |

预算默认值单源 = `thincoder-core/agent/helpers.mjs:24`（`DEFAULT_MAX_TURNS = 200`）· `:25`（`DEFAULT_SUBAGENT_TURNS = 100`）；
参数族权威 = `docs/core/design/AGENT-PARAMS.md`（本档只列名，不重述默认值表）。

**CLI 侧继续通道**（与上表 VSC 用户卡对位；2026-09-26 实核）：同步子代 = 权限请求 `onPermissionRequest("continue", {turns, agent})`
（核单点 `thincoder-core/agent-tools/subagent.mjs:293-314`——`enqueueAsk(parent, "_permQueue", …)` 串行；卡面渲染 `thincoder-cli/src/tui/render-frame.mjs:329` / `:356`）；
同步飞刀 = 直问用户（无 permQueue——`thincoder-core/agent-tools/subagent-actions.mjs:455` 注）；
主 agent = TUI 权限面板（`thincoder-cli/src/tui/agent-turn.mjs:194` 捕 `ContinueError` → `:203-224` 弹 `name: "continue"` 卡，每次重建 controller 续跑）；
**AUTO 档（2026-09-26 改）**：`thincoder-cli/src/tui/interaction.mjs:68` 的 AUTO 短路对 `continue` 名**取消放行**（不再自动批准续期）；digest 档自续支退役（`agent-turn.mjs:195-201`——`capStop` 停因行 `:199` + `result = "stopped"` `:200` + break `:201`）。

## 3. 实现坐标（双端 · as-of 2026-09-26 实核）

### 3.1 核 / CLI 面

| 面 | 落点 | 实核 |
|---|---|---|
| `ContinueError` | `thincoder-core/agent.mjs:24`（导入）· `:50`（再导出） | 在位 |
| `runAgent` 入口（`resume` 参数） | `thincoder-core/agent.mjs:101` | 在位 |
| 每轮编号帧调用点 | `thincoder-core/agent.mjs:220`（`const frame = turnFrame(++agent._turnSeq, turn, maxTurns)`）· `:221-222`（`_currentTurn` / `_maxTurns` 回填） | 在位 |
| 编号帧纯函数 | `thincoder-core/agent/helpers.mjs:274`（`export function turnFrame(seq, turn, maxTurns)`） | 在位 |
| 续跑支（子代理） | `thincoder-core/agent-tools/subagent-run.mjs`（`resume` 分支） | 在位（子代理轮帽语义面） |
| 续跑支（会诊） | `thincoder-core/agent-tools/consult.mjs:307-312`（注释：每次 continue = 新回合预算 + 重挂 watchdog）· `:331`（`continueQueue`）· `:334-336`（watchdog 重挂） | 在位 |
| **续跑骨架（三执行体共用）** | `thincoder-core/agent/spawn-child.mjs:233`（`runWithContinue(runner, child, input, callbacks, runOpts, { askContinue, onDeclined })`——`ContinueError → 询问 → resume:true 重跑`循环骨架，差异点经参数注入）· `:35`（再导出 `TURN_CAP_MARK`——唯一定义 = `thincoder-core/agent/child-marks.mjs`） | 在位 |
| 主 agent 续跑（CLI） | `thincoder-cli/src/tui/agent-turn.mjs:194`（`ContinueError` 分支）· `:203-224`（`name: "continue"` 权限卡）· `:132`/`:137`（`makeController` 定义 / 每段重建 controller 登记 abort 集合） | 在位（2026-09-26 实核） |
| **撞帽检查点（构造 / 挂起 / 兑现）** | `thincoder-core/agent-tools/checkpoint.mjs`（**新增零依赖叶**——导出集 / 幂等口径 / 兑现调用点见本表表注） | 新增（2026-09-26） |
| 检查点判定点（段边界） | `thincoder-core/agent/spawn-child.mjs:253`（`askContinue(e)` 调用点 = 段边界**唯一**判决动作）· `:248`（续跑循环头）· `:255` 起（`onDeclined` 降级分支） | 在位 |
| 撞帽抛点（核） | `thincoder-core/agent.mjs:435`（`throw new ContinueError(maxTurns)`）· `:432`（`injectPostTurn(...)` 调用——回合尾单点） | 在位 |
| 异步族报请面 | `thincoder-core/agent-tools/subagent-run.mjs:174`（async 子代 askContinue——**回调体内登记**）· `agent-tools/escalate-async.mjs:252`（async 飞刀——同形）· `agent-tools/consult.mjs:329-340`（会诊——`session.continueQueue` **闭包内登记**（串行保留）；续期 ⇒ `clearTimeout(watchdog)` + 重挂） | 在位 |
| 裁定通道（答复侧） | `thincoder-core/agent-tools/subagent-actions.mjs:293`（`executeSendAction`——续期 + 文本作新段首条指令；**兑现调用点两处见本表表注**）· `agent-tools/subagent-async.mjs:245`（`executeCancelAction`——停 ⇒ partial；**±0 行**）· 报请入队 / 唤醒 = `agent-tools/parent-channel.mjs`（`pushChildUpstream` + `wakeAsyncWaiters`——复用，零新建） | 在位 |
| 池条目留痕（段数 / 累计轮次） | `thincoder-core/agent-tools/subagent-actions.mjs:99`（status 面）/ `:263`（observe 面）——`{ turnCap: turnCapTrace(entry) }` 入摘要**文本**（桥字段零新增） | 新增行（2026-09-26） |
| depth-0 自续退役（CLI） | `thincoder-cli/src/tui/agent-turn.mjs:195-201`（digest AUTO 自续支删 ⇒ 落 `capStop` 停因行 `:199` + break `:201`）· `interaction.mjs:68`（AUTO 短路排除 `continue` 名） | 新增（2026-09-26） |
| 会诊子代上行通道（补赋） | `thincoder-core/agent-tools/consult.mjs`（`runConsultChild` 装配处补 `child._upstream = { parent: agent, label, sync: false }`——赋点 `:292`；会诊 = 后台族（`consult_start` `:448-450` 发后即返 `{id, models}`）⇒ 父在飞可答）。**副作用登记**：consultant 由此获得 `notify_parent` 上行工具能力（与检查点同源通道） | 新增（2026-09-26） |
| 编号镜像层（子代理） | `thincoder-core/agent-tools/subagent-run.mjs:126-141`（`⟦ev⟧turn` 包裹层：保留 onAgentTurn → `entry.turn` / `maxTurns` → status / observe 面） | 在位（2026-09-26 实核） |
| 编号镜像层（飞刀） | `thincoder-core/agent-tools/escalate-async.mjs:212-221`（同形解析 → `entry.turn`） | 在位（2026-09-26 实核） |
| CLI 消费链 | `thincoder-cli/src/tui/subagent-blocks.mjs:48`（`SUB_EVENT_RE` 块头 `turn n/max`）· `render-frame.mjs:381-382`（主会话状态行读 `_currentTurn` / `_maxTurns`） | 在位 |

**§3.1 表注（2026-09-26 · 检查点兑现接线）**：

- **checkpoint 叶 API（一）**：`registerTurnCapCheckpoint(child, entry, payload) → Promise<boolean>`——登记（子代 / 飞刀 = `entry._turnCapRec`；会诊 = `session._turnCapRec`）+ 上行报请（payload = 段数 / 累计轮次 + 去向一句话）+ 挂起；`signal.abort` ⇒ resolve(false)。
- **checkpoint 叶 API（二）**：`settleTurnCheckpoint(entry)`——**子代 / 飞刀兑现**（含 escalate——同池）：读登记 ⇒ 删登记 ⇒ resolve(true)；**幂等**（二调 = miss false ⇒ 回落既有路径）· `turnCapTrace(entry)`（留痕片段）· `resumedSendResult(key, label)`（send 早返体）。
- **checkpoint 叶 API（三）**：`settleConsultCheckpoint(agent, key, message)`——**会诊兑现**：`agent._consultSessions.get(key)` → `session._turnCapRec`；文本入 `rec.child._injected` ⇒ resolve(true)。
- **send 兑现两处**（`subagent-actions.mjs`）：① `:308-313` 池查找**未命中**分支（advisor 判后、错误返前）+1 行——`settleConsultCheckpoint(agent, key, message)`（`:312`）；② `:322-323`（`entry._injected.push` 后）+1 行——`settleTurnCheckpoint(entry)`（`:323`）。+1 import 行 ⇒ **499 行**（≤ 500 硬限，余量 1 行）。
- **会诊兑现判定序**：池命中优先（`send` 到在池 id ⇒ 既有路径零改）；池未命中且 advisor 未命中 ⇒ 试会诊登记（挂起面）⇒ 命中 = 早返 `resumedSendResult(key, "consult")`；非挂起期会诊 id 的 `send` 仍报 `unknown async subagent id`（登记 miss 回落）。
- **兑现后的消费路径（三执行体同配 · 缺口已闭合）**：文本落 `entry._injected`（子代 / 飞刀）· `rec.child._injected`（会诊）后，须由子 `runAgent` 回合头 `consumeInjected?.()` 消费（核 `thincoder-core/agent.mjs:238`——缺省 null 零开销）。
  提供点三处（本批已落）= `agent-tools/subagent-run.mjs:157`（子代）· `agent-tools/escalate-async.mjs:231`（飞刀）· `agent-tools/consult.mjs:322`（会诊）——三执行体同配，续期文本不再静默丢弃；闭包定义单源 = `agent-tools/subagent-run.mjs:34`（`drainInjectedQueue`）。
- **cancel 零新增行**：`agent-tools/subagent-async.mjs:174`（停单点）；running 面 `:207` `entry.cancelled = true` · `:209` `entry.controller?.abort?.({ abortTrigger: "cancel", … })` ⇒ 登记信号逃逸（子面 `runOpts.signal = entry.controller.signal`）
  ⇒ `askContinue` = false ⇒ `onDeclined` partial + `TURN_CAP_MARK` ⇒ **`subagent-async.mjs` = ±0**（走既有 abort 信号，非免接线）。
- **超限缓冲**：`subagent-actions.mjs` 499 行 ⇒ 余量 1 行；若再需行，备选 = `executeObserveAction` 迁出零依赖叶再导出（先例 = `:339` `executePanelAction` re-export）——超限即停并报。
- **新增文案语言 = 英文**（2026-09-26 裁定）：检查点批新增文本——检查点 ask 载荷（`thincoder-core/agent-tools/checkpoint.mjs:81-82`）/ send 兑现早返体（`thincoder-core/agent-tools/checkpoint.mjs:115`）——**一律英文**（沿核内报告面既有形态；面向模型与上行通道消费）。

### 3.2 VSC 面

| 面 | 落点 | 实核 |
|---|---|---|
| 类 / 抛点 | `thincoder-vscode/src/agent.mjs:7`（核单类转口）/ `:46`（再导出）/ `:441`（抛点） | 在位（2026-09-26 实核） |
| 编号复位 / 段间种子 | `thincoder-vscode/src/agent.mjs:170-174`（`:170` `if (!opts.resume)` ⇒ `_turnSeq = 0`；`:172-173` `_turnSeq == null` → `opts._turnSeqBase ?? 0`） | 在位（唯一复位点；2026-09-26 实核） |
| 编号帧发出 | `thincoder-vscode/src/agent.mjs:190-191`（`turnFrame(++agent._turnSeq, …)` → `callbacks.onAgentTurn?.(frame.turn, frame.maxTurns)`） | 在位（2026-09-26 实核） |
| 帧纯函数 / 消费 helper | `thincoder-vscode/src/agent/run-helpers.mjs:28`（`turnFrame`）· `:36`（`applyTurnFrame`） | 在位 |
| 子代理续跑环 / 撞墙终态文案 | **端档已退役**（2026-09-26 ENOENT 实核——`thincoder-vscode/src/agent-tools/` 现存仅 `async-discard.mjs` / `index.mjs`）⇒ 现体 = 核 `thincoder-core/agent/spawn-child.mjs:233`（`runWithContinue` 单源，双端共用） | 退役（2026-09-26 实核） |
| 飞刀同步续跑 / 飞刀 async 面 | **端档已退役**（同上实核）⇒ 现体 = 核 `thincoder-core/agent-tools/{subagent-actions,escalate-async}.mjs` | 退役（2026-09-26 实核） |
| 会诊续跑 | **端档已退役**（同上实核）⇒ 现体 = 核 `thincoder-core/agent-tools/consult.mjs:329-340` | 退役（2026-09-26 实核） |
| 主 agent 回合循环 | `thincoder-vscode/src/extension/panel-turn-loop.mjs:112` 起（回合循环）· `panel-turn-stages.mjs`（阶段）· `panel-chat.mjs`（会话 / 消息面） | 在位（2026-09-26 实核） |
| 回合尾 | `thincoder-vscode/src/agent.mjs:421-438`（**内联**回合尾——timer / goal 注入；该端**无独立 post-turn 模块**） | 在位（2026-09-26 实核） |
| depth-0 自续退役（VSC） | `thincoder-vscode/src/extension/panel-turn-loop.mjs:128-135`（digest AUTO 自续支删 ⇒ 落 `:133` `postDigestCap(panel, "stop", …)` + `:134` 停因 + break）· `src/extension/panel-callbacks.mjs:279`（live AUTO 短路排除 `continue` 名） | 新增（2026-09-26） |
| 载入面自证（启动期诊断） | `thincoder-vscode/extension.mjs:88`（`activate()`——`applyEngineFloorGuard()` `:95` 之后）**+2 行**（读取行 + 输出行——失败面 / 观察通道 / 机检见 §3.2 注） | 新增（2026-09-26 · D-TC19） |
| 打包面机检（vsix 内含检查点接线） | `thincoder-vscode/scripts/check-vsix.mjs`（解包面 `:39-45`；**断言 E 现盘 = `:60-70`**——与断言 B `:51-58` / 断言 D `:72-82` 同级）——断言：vsix 内 `extension/node_modules/@thincoder/core/agent-tools/checkpoint.mjs` 存在 ∧ 同目录 `agent-tools/subagent-run.mjs` 含 `registerTurnCapCheckpoint` | 新增（2026-09-26 · **工程工具面 ⇒ 父侧直改**） |

**§3.2 注（载入面自证 · 实现面 · 2026-09-26 修复轮）**：

- **实现 = 2 行**：读取行（`import.meta.resolve("@thincoder/core/agent.mjs")` 取实体目录 + 读同目录 `package.json` 的 `version`；
  **单行 `try` 兜底**——先例 `thincoder-vscode/test/engine-floor-guard.test.mjs:126`（`try { src = readFileSync(file, "utf8") } catch { continue }`））+ 输出行 `console.warn("[thincoder] core face = <路径> (v<版本>)")`。
- **失败面**：读取失败 ⇒ 记 `[thincoder] core face = unresolved`——**不抛、不阻断激活**（只留证据；诊断面非门禁面）。
- **观察通道** = VSC **Extension Host 日志**（`console.warn` 宿主直捕——零新增通道；同档既有先例 `:74`（engine floor）/ `:93`（activate starting））⇒ T7 / 实盘复核按此通道读日志。
- **机检** = T5（`engine-floor-guard.test.mjs` +1 用例：activate 源码切片断言含 core 实体路径诊断行——沿该档 `:88` 先例）。

## 4. 跨段累计编号（现行机制 · 已落）

**问题**：续跑链内每次重进 `runAgent` 段内 `turn` 从 0 重起 —— 多段任务在池条目 / 冻结身份头上显示**最后一段**计数（如真实 130 轮显 `30/100`），终值失真。

**口径**（双端同源）：**跨段累计**——`turn = 链内累计已跑轮数`；`max = 段前累计 + 本段预算`。

- **编号帧（纯函数）**：`turnFrame(seq, turn, maxTurns) → { turn: seq, maxTurns: seq - turn - 1 + maxTurns }`——差额项 = 本段开始前的链内累计。
  段内帽判定**不读**该帧（循环条件仍只读段内 `turn < maxTurns`）。
- **唯一新增状态**：`agent._turnSeq`（链内累计序数，agent 级）——复位条件 `!opts.resume` 且**仅此一处**（复位落点 = `thincoder-core/agent.mjs:146-150`——`!resume` 守卫 `:146` + 编号复位 `:150`）；递增 = 每轮无条件 +1（与回调存在与否无关）。
- **段数留痕（2026-09-26 新增）**：`agent._continueSegments`（链内段数，agent 级）——`resume` 重入 +1、首段 = 1；复位条件同 `_turnSeq`（`!opts.resume`——复位落点 `thincoder-core/agent.mjs:146-150`；`_continueSegments` 承载式赋值 `:145`）。消费面 = 摘要**文本**（§3.1 池条目留痕行）⇒ 桥字段零新增；#7 检查点的载荷与留痕口径同读此值。
- **段间载体（端差面）**：VSC 子代理面每段续跑 = **新 agent 对象** ⇒ `_turnSeq` 不跨段存活 ⇒ 经 `opts._turnSeqBase` 回传
  （仅 `_turnSeq == null` 时落，非空不覆盖）；核侧同一 child 对象跨段 ⇒ `_turnSeq` 非空 ⇒ 种子零作用。
  **同结果、异载体**——语义同源，实现形态各端自持。
- **消费面零改动**：编号经既有回调与终态快照消费——**桥消息字段零新增**、webview 显示文件零改动（值语义改动即生效）。
- **零改动面**：终态快照、webview 显示文件（`webview/activity.js` / `activity-view.js`）、出生 / queued 事件、段内帽判定与 `ContinueError` 载荷。

## 5. 关键决策记录（含否决备选）

| # | 决策 | 理由 / 否决备选 |
|---|---|---|
| D-TC1 | **继续次数不设上限**（用户明确要求） | 防卡死靠用户 Stop；否决次数帽（`MAX_RESUMES` 形态已移除） |
| D-TC2 | 编号口径 = **跨段累计**（非分段显式） | 双端语义一致；改动面 = 生成侧 + 两消费点，桥消息字段零新增。否决「段号 + 段内号」（需扩展桥消息 + webview 头部改）·否决「不动」（冻结头终值失真） |
| D-TC3 | 累计预算经**回调第二参**传（非消费端读 `sink.agent`） | 否决「消费端读 agent 字段」（间接、依赖绑定时机）·否决「新桥消息」（桥面不擅建） |
| D-TC4 | 终态快照与 webview **零改动** | `entry` 已是累计值——快照 / 头部逐字消费 |
| D-TC5 | 段间种子经 **`opts`** 回传（VSC 修法 A） | 生成侧单点保持。否决「消费侧偏移」（累计公式在消费侧再写一遍 + 削弱生成侧单点） |
| D-TC6 | **不建 live 头逐轮跳动**（登记保持开放） | 需桥通道（出生 / queued 事件面）；本项只修**值语义** |
| D-TC7 | 段内帽 / 续跑循环结构 / `ContinueError` 载荷零改动 | 累计只作用于编号值 |
| D-TC8 | **编号帧复用 `_currentTurn` / `_maxTurns`**（approval 事件读同一对字段——CLI `thincoder-core/agent/dispatch.mjs:301` 零改动） | 只改 turn 事件载荷而状态行字段仍段内 ⇒ 同链内两类事件交替驱动块头、显示值来回跳。否决「只改 turn 事件载荷」 |
| D-TC9 | **depth 无关**（主会话续跑同构同修） | 同一缺陷结构在主会话续跑（Ctrl+I / AUTO 续跑）同存——只修 depth>0 = 留同构错误。**代价如实披露：主会话状态行编号同样累计**（同源结果） |
| D-TC10 | **继续提示文案不动**（`Ran ${error.turn} turns (limit …)` 描述**本段**撞墙事件） | 改文案 = 动锁定串 / 提示面——`open`：是否补「累计进度」口径留待用户 / 后续批 |
| D-TC11 | escalate 与子代理**共用 `ctx._subagentKey`**（`thincoder-core/agent-tools/subagent-actions.mjs:475`） | 继续 / 完成的 TUI 冻结与记账语义一致 |
| D-TC12 | 检查点 = **段边界挂起**（不 settle、不重派新 child） | 保留同一 child 对象 ⇒ `resume` 后 history / 记账 / 累计编号全保活（F2「同一执行体」天然满足）。否决「settle 后由父重派」（history 丢 + 违 F2）·否决「settle 后由父 resume」（条目已收口 ⇒ 重开 = 新链，段数留痕失真） |
| D-TC13 | 裁定通道 = **既有 `subagent action:'send'`（续期）/ `'cancel'`（停）**——**零新建** | send 已是「父 → 子注入」单点（`subagent-actions.mjs:293`），自然映射「续期 + 新段首条指令」；cancel 已是既有停面。否决「新动作 `action:'resume'`」（工具面 + 提示词面 + 双端渲染面三处新增）·否决「自由文本判意」（机器不可核） |
| D-TC14 | **同步族**（阻塞子代理 / 同步飞刀）⇒ **用户卡路径保留**；**异步族**（后台子代理 / 异步飞刀 / 会诊）⇒ 父代理检查点（2026-09-26 父侧裁定 B） | 同步族父代理被本次调用阻塞（平台纪律原文：同步子代应答不可达）+ 挂起不可续（history 随调用返回丢弃）⇒ 检查点不适用；`_upstream.sync` 为机械判据。否决「同步族一律 partial」（丢可就地续跑的既有能力 + N3 会诊续期 → 死条） |
| D-TC15 | **AUTO 档一律不再自动批准续期**（CLI `interaction.mjs:68` / VSC `panel-callbacks.mjs:279` 对 `continue` 名取消短路）+ **depth-0 digest 档自续支退役** | 「静默自动续期」= F8 明文禁止——无人值守档无裁定者 ⇒ 停（后果已在需求档 §4 显式化）。否决「保留 AUTO 自续」（= #83 同类静默路径） |
| D-TC18 | **N7 整条撤销**——用户 2026-09-26 14:50 裁定：**不设零产出阈值**，**撞帽检查 = 无条件**（首轮有产出同样检查）⇒ 唯一边界动作 = 段边界 `askContinue`；**F8 检查点保持**。撤销面 = 计数 / 复位 / 常量 / 跳闸判 / 文案 / 用例 / 参数登记**全族**（不留死码——死码会被读者当活工单） | 阈值化行为不可判（第一轮有产出 ⇒ 其后任意长链不跳闸）；判据面回到 F8 唯一触发点 = 段预算。**否决**「只调大 / 调小 K」（仍留静默面 + 违裁定）·「保留代码只删文档」（死码）·「留 `agent.barrenTurnLimit` 空转键」（无效键误导配置面） |
| D-TC19 | **载入面自证取最小**（2026-09-26 新增）：① 启动期一行诊断（core 实体路径 + 版本）② 打包面机检（vsix 内 core 含检查点接线）——**不动机制语义**（只加可核面） | 实况触发 = 运行面跑的是安装包内冻结旧构建（`docs/batches/2026-09-26-turn-cap-live-gap.md` §2.2）⇒「以为在跑新码」必须可自证。**否决**「版本号比对强校验」（版本号不随内容变——同版本不同内容抓不住）·「启动自检失败即拒载」（用户面收益 < 风险）·「常驻轮询」（无必要开销） |

- **检查点逃逸三分档**（D-TC12 · 2026-09-26）：① **兑现**——`send` 面两处（§3.1 表注：池直注入 + 会诊未命中分支）；② **中止信号**——Stop / `cancel` / 会话中止 ⇒ 登记 `signal` abort ⇒ resolve(false) ⇒ `onDeclined` partial + `TURN_CAP_MARK`；③ **不可答降级**——`child._upstream?.parent` 缺席 ∨ 同步族 ⇒ **不登记** ⇒ 走既有路径（同步族 = 用户卡面；无 handler = partial）。

## 6. 不并项与历史沿革

### 6.1 历史沿革（(d) 类——**不并**）

> 来源档 `thincoder-vscode/docs/design/TURN-CAP-CONTINUE.md`（VSC 产品档）——**原地保留作参照历史**（保留 ≠ 维护）。下列内容不并入本档：

| 旧档位置 | 内容 | 何故不并 |
|---|---|---|
| 旧档状态行（「机制已实现并在现行代码生效」） | 时点状态行 | 批次语境——现行态已入 §1–§4 |
| 旧档 §19.1–§19.8（「第 19 批」节标题与批序） | 单批施工叙述（现场复核 / 选型 / 契约稿 / 受影响文件表 / 用例表 T1–T11 / AC1′–AC6′） | 一次性批次材料——现行约束已入 §3–§5 |
| 旧档 §19.5 受影响文件表 | 单次改动的文件 × 行数 | 一次性材料——现行坐标入 §3 |
| 旧档 §19.7 验收标准 AC1′–AC6′ | 单批验收清单（含已退场源码锚） | 批次材料——行为面由现行测试族覆盖 |
| 旧档「显式引例（CLI 仓用例编号）」注 | 跨仓引例编号 | 跨仓指针（P3 自持纪律）——不并 |
| 旧档变更记录（2026-08-17 起逐批流水） | 历史叙述 | 本档自有变更记录 |

> **CLI 侧来源档** `thincoder-cli/docs/design/TURN-CAP-CONTINUE.md`（2026-09-15 CLI 尾部真批对账并入）——原地保留作参照历史。下列内容不并入本档：

| 旧档位置 | 内容 | 何故不并 |
|---|---|---|
| 旧档头部状态行与权威源清单 | 时点状态行 | 批次语境——现行坐标已入 §3 |
| 旧档 §19.1–§19.8（「第 19 批」节：现场复核 / 注①测试面分类 / §19.5 受影响文件 as-of 表 / §19.6 用例 T1–T8 / §19.7 AC1–AC9） | 单批施工叙述与一次性清单 | 批次材料——现行机制与口径已入 §3–§5；用例 / AC 由现行测试族覆盖 |
| 旧档 §19.8 相邻登记两行（VSC 仓 `docs/design/AGENT-LOOP` / `ARCHITECTURE` 行号指针） | 跨仓登记行指针 | 跨仓指针（P3 自持纪律）——不并；「live 头逐轮跳动缺」登记保持开放（§6.2 已有行） |
| 旧档变更记录（2026-08-17 起逐批流水） | 历史叙述 | 本档自有变更记录 |

### 6.2 不并项登记（跨板块 / 一次性材料——**不并**，逐项登记）

| 旧档面 | 内容 | 何故不并（去向 / 触发） |
|---|---|---|
| 旧档「需求面随 CLI 仓 requirements 档」注 | 需求层承载指针 | 需求层已自持——见 `docs/core/requirements/TURN-CAP-CONTINUE.md` |
| 登记行「live 头逐轮跳动缺」 | 未决登记（需桥通道） | **保持开放**——非本机制欠账；触发 = 桥通道批次 |
| `AGENT-PARAMS` explore 30 硬帽沿革 | 邻板块参数沿革 | 归 `docs/core/design/AGENT-PARAMS.md` |
| CLI 侧同名档未迁面（CLI 台账列为后续批） | CLI 产品档正文 | **已并入（2026-09-15 CLI 尾部真批）**——CLI 独有面入 §1–§5，(d) 类入 §6.1 |

## 变更记录

- 2026-09-26（**载入面缺口批 · eng-designer · 实施后收正轮 #18**——承 `docs/batches/2026-09-26-turn-cap-live-gap.md` §1.14：**全族坐标现盘收正**——§1 #1 / #3 · §3.1 六行 + 表注 ·
  §3.2 退役行 / 打包机检行 / 注先例行 · §4 两句；#6 与本批设计轮两条「实施后修正轮现读收正」预告 = 本轮兑现；去「行号随撤销面随动」死注 3 处；档头 as-of 行补轮次记法（#95 · #18）。）

- 2026-09-26（**载入面缺口批 · 设计评审修复轮 #6**——承 `docs/batches/2026-09-26-turn-cap-live-gap.md` §3 轮次 1（🔴0 / 🟡5 / 🔵4；本轮处置 1–7 + 9，第 8 条父侧已改））：档头需求侧计数 ⇒ **`F1–F9 / N1–N6`**（F9 = 载入面自证）；§1 #8 补读取失败兜底（记 `unresolved`——不抛 / 不阻断激活）；
  §3.2 载入面自证行 **+1 ⇒ +2 行**（读取行含单行 `try` 兜底 + 输出行）+ 新增 §3.2 注（实现 2 行 / 失败面 / 观察通道 = Extension Host 日志 / 机检 = T5）；
  §4 复位落点两处坐标收正 = `thincoder-core/agent.mjs:146-150`（守卫 `:146` + 编号复位 `:150`；`:145` 承载式赋值不变）。坐标行号随撤销面随动，实施后修正轮现读收正。

- 2026-09-26（**载入面缺口批 · eng-designer**——承 `docs/batches/2026-09-26-turn-cap-live-gap.md` §1 用户 14:50 裁定 + 父侧 15:00 裁定）：**N7 整条撤销**——
  §1 #8 行整替为「**载入面自证**」（启动期诊断 + 打包面机检 · D-TC19）· #3 触发面去零进展护栏跳闸 · #6 防卡死句去零产出护栏 · #7 载荷去零进展轮数 · 删「N7 口径与射程」注块；
  §3.1 删 N7 计数单点行、判定点行去跳闸判、池留痕面去零进展、表注（一）载荷去零进展、文案语言条去 N7 硬停一档；
  §3.2 回合尾行去 N7 计数对位 + **新增 2 行**（载入面自证 / 打包面机检）；§4 段数留痕行的 barren 复位句删；
  §5 **删 D-TC16 / D-TC17** ⇒ 新增 **D-TC18**（N7 整条撤销 · 撞帽无条件 · F8 保持）与 **D-TC19**（载入面自证 = 最小 · 不动机制语义）。
  坐标行号随撤销面随动，实施后修正轮现读收正。

- 2026-09-26（**撞帽续期检查点批 · eng-designer · 实施后修正轮 #95**——承 `docs/batches/2026-09-26-turn-cap-checkpoint.md` §1.12 六项 + §4:312 🟡12 派发，**全族坐标复核收正**：§1 #1/#2/#3/#5/#7/#8 · §2 CLI 段 · §3.1 表与表注 · §3.2 · §4 · §5 D-TC8 / D-TC11 / D-TC13 / D-TC15，逐点现盘实核）：
  - 关键坐标定值：`thincoder-core/agent.mjs:439`（抛点）· `:436`（注入计数单点）· `:101`（`consumeInjected` 形参）· `:146-155`（复位块）· `:242`（消费点）；`thincoder-core/agent/spawn-child.mjs:250`（骨架）· `:272-273`（判定点）；`thincoder-core/agent/post-turn.mjs:54-60`（计数体）。
  - 兑现与收正面：`thincoder-core/agent-tools/subagent-actions.mjs:312` / `:323`（send 兑现两处）；异步报请面 / CLI / VSC 端坐标全数收正（逐对见批档 §2.8）。
  - 语义条文：§1 #8 计数口径**错档指针收正**（"Model is executing tools" 实在 `thincoder-core/agent.mjs:429`）· §1 #7 补 **AUTO × 同步族落卡**句 · §1 #5 收窄「同步子代理」+ 会诊例外汇注（🟡12 兑现）· §3.1 表注补「新增文案语言 = 英文」条。

- 2026-09-26（**撞帽续期检查点批 · eng-designer · 修复轮 #88**——承 `docs/batches/2026-09-26-turn-cap-checkpoint.md` §3 轮次 1 余 9 条）：§1 #3 叶坐标 `:35` · #5 队列语义重写（消费者 = 会诊唯一；同步族 `_permQueue`；depth-0 直弹卡；异步族报请）· #8 N7 口径 / 射程 / 基线注 3 行；§2 行补答复载具（`send` / `cancel`）；
  §3.1 锚点实核 6 处（骨架 `:233` · 镜像层 `:123-139` / `:212-216` · CLI `:132`/`:137`）+ 表注 7 行（checkpoint 叶 API / send 兑现两处 496 → 499 / 会诊判定序 / cancel ±0 / 超限缓冲）；§3.2 复位位 `:170-174` · 帧 `:190-191` + 实核化 6 处；§4 复位落点 `:143-147`；§5 D-TC11 `:472` + 逃逸三分档注；删迁移期漂移注（沿革入本记录）。

- 2026-09-26（**撞帽续期检查点批 · eng-designer**——承 `docs/batches/2026-09-26-turn-cap-checkpoint.md`）：§1 新增 **#7 撞帽检查点（F8）** / **#8 零产出护栏（N7）**，随动收正 #1 双端坐标、#3 触发面、#5 队列主体、#6 防卡死面；§2 四执行体「继续通道」列改写（异步族 ⇒ 检查点 / 同步族 ⇒ 用户卡 / AUTO 不自动批准）+ CLI 段按现盘实核改写；
  §3.1 新增 9 行坐标（checkpoint 叶 · 判定点 · 抛点 · N7 单点 · 报请面 · 裁定通道 · 池留痕 · CLI 退役点 · 会诊上行补赋）+ 主 agent 续跑行实核；
  §3.2 实核类 / 抛点坐标、**退役档登记**（端 `agent-tools/*` ENOENT 实核）、回合尾与 VSC 退役点两行、主 agent 回合循环档名实核；§4 补段数留痕 `_continueSegments`；§5 补 D-TC12–D-TC17。

- 2026-09-20（**显示面消差批 · 批 4 收口轮 · eng-designer**——承 `docs/batches/2026-09-20-display-parity-batch.md` §5.13 批 2 实施记录）：§1 #3 + §3.1 的 `TURN_CAP_MARK` **常量单源指针收正**——定义已下沉零依赖叶 `thincoder-core/agent/child-marks.mjs`（先例 `agent/relay-prefix.mjs`），`agent/spawn-child.mjs:33` 原样再导出（既有 import 面零改）。

- 2026-09-15（**CLI 尾部真批 · 并入既有 · eng-designer**）：`thincoder-cli/docs/design/TURN-CAP-CONTINUE.md` 逐节对账并入——
  CLI 独有面入档：`TURN_CAP_MARK` 常量单源（§1 #3）· CLI 继续通道对位段（§2）· §3.1 新增 6 行坐标（`runWithContinue` 骨架 /
  主 agent 续跑 / 编号镜像层 ×2 / CLI 消费链）· 决策补 D-TC8–D-TC11（§5）；(d) 类（§19 批次材料 / 状态行 / 跨仓登记行指针 / 逐批流水）入 §6.1。
  旧档原地一字不改。
- 2026-09-15（**B 式迁移轮 · VSC 批 3**）：建档——`thincoder-vscode/docs/design/TURN-CAP-CONTINUE.md` 内容重建入基准层
  （旧档一字未改、原地作参照历史）；坐标改写为现状路径并实核（`thincoder-core/agent.mjs` · `thincoder-core/agent/helpers.mjs` · `agent-tools/{subagent-run,consult}.mjs`；
  `thincoder-vscode/src/{agent.mjs,agent/run-helpers.mjs,agent-tools/*,extension/panel-chat.mjs}`）；源档漂移已按现状实核改写；
  批次材料 / 状态行 / 逐批流水不并（§6）。
