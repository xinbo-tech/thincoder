# 撞轮数墙可继续（TURN-CAP-CONTINUE）· Agent 循环板块

> 板块 = **轮数预算耗尽后的续跑**（撞墙可继续）——统一语义 · 四执行体 · 跨段累计编号。
> 本档 = 该机制的**唯一权威**（续跑语义 / 编号口径 / 双端坐标）。
> 相邻权威 = `docs/core/design/AGENT-LOOP.md`（主循环与子代理机制本体）· `docs/core/design/AGENT-PARAMS.md`（轮数预算默认值族）·
> `docs/core/design/ESCALATE.md`（飞刀）· `docs/core/design/CONSULTATION.md`（会诊）——本档不复制其内容（D2）。
> 需求侧 = `docs/core/requirements/TURN-CAP-CONTINUE.md`（F1–F9 / N1–N6）。

## 1. 统一语义

| # | 条目 | 判据 |
|---|---|---|
| 1 | **撞墙** | `runAgent` 耗尽 `maxTurns` 抛 `ContinueError`（核 `thincoder-core/agent/turn-loop.mjs:316`（抛点）；VSC 端 = 已退役——现盘 `thincoder-vscode/src/agent.mjs:9` 只余 `ContinueError` 再导出（该档 10 行转口），端侧无自有抛点） |
| 2 | **继续** | `resume:true` 重跑**同一执行体**：不重新注入任务文本、保留 history 与改动记录、每次全新轮数预算（核 `thincoder-core/agent.mjs:85`（`runAgent` 入口 + 签名解构——`resume` 经 `opts`）；双端同源） |
| 3 | **拒绝 / headless** | 无 `onQuestion` 或无权限 handler → 返回部分成果 + turn-cap 标记——`TURN_CAP_MARK = "stopped: turn cap reached"`（常量单源 = `thincoder-core/agent/child-marks.mjs`——`agent/spawn-child.mjs:35` 原样再导出；尾部附 "work may be partial"）——报告据此判定「撞墙中断、工作可能不完整」。**触发面**：无 handler / headless ∨ 检查点未获续期（父答停 ∨ 父不可达 ∨ 会话中止——#7） |
| 4 | **用户 Stop 优先** | 中止路径（`AbortError` / `signal.aborted`）恒优先于继续提示——不弹卡、不自动续跑 |
| 5 | **继续提示串行** | 会话级队列消费者 = **会诊（唯一）**（`continueQueue`——`agent-tools/consult.mjs:331`；检查点报请仍串行其上）；**同步子代理**走 `_permQueue`（核 `subagent.mjs:313`）；**同步飞刀 = 直问用户**（无队列）；异步飞刀权限同经 `_permQueue`（核 `escalate-async.mjs:242`）；**depth-0 直弹卡、无会话队列**（CLI `agent-turn.mjs:203-224` / VSC `panel-turn-loop.mjs:142-152`）；**异步族**经上行通道报请（无队列——#7；**会诊除外**——见本行首句）。并行执行体同时撞墙不弹多个卡 |
| 6 | **次数不限** | 无次数帽；防卡死靠用户 Stop（**不设零产出阈值**；该裁定对象 = **续跑决策的自动动作面**——只读角色零产出告警机制另见 `docs/core/design/AGENT-LOOP-UPSTREAM.md` §6.32） |
| 7 | **撞帽检查点（F8）** | 撞帽 ⇒ **不再静默自动续期**：**异步族**（后台子代理 / 异步飞刀 / 会诊）⇒ **报请父代理**（上行 ask：载荷 = 段数 / 跨段累计轮次 + 去向一句话）；父答**续期** ⇒ 同执行体 `resume:true` 重入（#2 不变量）+ 新段预算（会诊同挂 watchdog 重置）；父答**停** ⇒ #3 partial。**同步族**（阻塞子代理 / 同步飞刀）⇒ **用户卡路径保留**（父代理被本次调用阻塞 · 应答不可达；挂起亦不可续——累计 history 随调用返回丢弃）。depth-0 ⇒ 用户卡（digest 无人值守档 ⇒ 收口）。**AUTO 一律不再自动批准续期**——**AUTO × 同步族**：AUTO 档对 `continue` 名不再短路（CLI `interaction.mjs:68` / VSC `panel-callbacks.mjs:279`）⇒ 卡**在场待答**；无人应答（headless / 无人值守）⇒ 落 #3 partial（非静默放行）。**可答判据（机械）** = `child._upstream?.parent` 在场且 `sync !== true` ⇒ **段边界挂起**（不 settle / 不重派——§5 D-TC12）；不可达 ⇒ #3 partial。留痕 = 跨段累计轮次 + 段数（§4）+ 摘要文本面（§3.1） |
| 8 | **载入面自证** | 运行面与仓内面的一致性**可核**——「以为在跑新码」必须可自证：① **启动期诊断**——VSC 激活时记一行 `[thincoder] core face = <core 实体路径> (v<版本>)`（路径经 `import.meta.resolve("@thincoder/core/agent.mjs")` 取实体目录；版本读同目录 `package.json`）——**不比对、不拒载**（只留证据；读取失败 ⇒ 记 `core face = unresolved`，不抛 / 不阻断激活——§3.2 注）；② **打包面机检**——`thincoder-vscode/scripts/check-vsix.mjs` 增断言：vsix 内 `@thincoder/core/agent-tools/checkpoint.mjs` 存在 ∧ `agent-tools/subagent-run.mjs` 含 `registerTurnCapCheckpoint`（接线未进包 ⇒ 机检即红，不靠人眼）。**不动机制语义**；实况触发 = 运行面为安装包冻结旧构建 |

## 2. 四执行体（预算 / 通道 / 上限）

| 执行体 | 轮数预算（默认） | 继续通道 | 次数 |
|---|---|---|---|
| 主 agent | `agent.maxTurns`（200） | 用户卡（"Continue / Stop"）；**digest（无人值守）档不再自续**——撞帽即收口（#7） | 不限 |
| 子 agent | `agent.subagentTurns`（100） | 后台 async ⇒ **父代理检查点**（#7——段边界挂起；**答复载具 = `send`（续期 + 文本作新段首条指令）/ `cancel`（停）**）；同步（阻塞）⇒ **用户卡保留**（AUTO 不再自动批准） | 不限 |
| 飞刀 escalate | `agent.subagentTurns`（100） | async ⇒ **父代理检查点**（#7——同池、同载具）；同步 ⇒ **用户卡保留**（直问用户——无 permQueue） | 不限 |
| 会诊 consult | `agent.consultTurns`（40） | **父代理检查点**（#7——答复载具 = `send` / `cancel`）+ `session.continueQueue` 串行（全仓唯一消费者）；续期 = **新段预算 + 墙钟 watchdog 重置**（N3 保持） | 不限 |

预算默认值单源 = `thincoder-core/agent/helpers.mjs`（`DEFAULT_MAX_TURNS = 200` · `DEFAULT_SUBAGENT_TURNS = 100`）；
参数族权威 = `docs/core/design/AGENT-PARAMS.md`（本档只列名，不重述默认值表）。

**CLI 侧继续通道**（与上表 VSC 用户卡对位）：

- 同步子代 = 权限请求 `onPermissionRequest("continue", {turns, agent})`——核单点 `thincoder-core/agent-tools/subagent.mjs:293-314`（`enqueueAsk(parent, "_permQueue", …)` 串行）；卡面渲染 `thincoder-cli/src/tui/render-frame.mjs:329` / `:356`。
- 同步飞刀 = 直问用户（无 permQueue——`thincoder-core/agent-tools/subagent-actions.mjs:455` 注）。
- 主 agent = TUI 权限面板（`thincoder-cli/src/tui/agent-turn.mjs:194` 捕 `ContinueError` → `:203-224` 弹 `name: "continue"` 卡，每次重建 controller 续跑）。
- **AUTO 档**：`thincoder-cli/src/tui/interaction.mjs:68` 的 AUTO 短路对 `continue` 名**取消放行**（不再自动批准续期）。

## 3. 实现坐标（双端）

### 3.1 核 / CLI 面

| 面 | 落点 | 实核 |
|---|---|---|
| `ContinueError` | `thincoder-core/agent.mjs:17`（导入）· `:38`（再导出——编排面随档重排） | 在位 |
| `runAgent` 入口（`resume` 参数） | `thincoder-core/agent.mjs:85` | 在位 |
| 每轮编号帧调用点 | `thincoder-core/agent/turn-loop.mjs:98`（`const frame = turnFrame(++agent._turnSeq, turn, maxTurns)`）· `:99-100`（`_currentTurn` / `_maxTurns` 回填） | 在位 |
| 编号帧纯函数 | `thincoder-core/agent/helpers.mjs`（`export function turnFrame(seq, turn, maxTurns)`） | 在位 |
| 续跑支（子代理） | `thincoder-core/agent-tools/subagent-run.mjs`（`resume` 分支） | 在位（子代理轮帽语义面） |
| 续跑支（会诊） | `thincoder-core/agent-tools/consult.mjs:307-312`（注释：每次 continue = 新回合预算 + 重挂 watchdog）· `:331`（`continueQueue`）· `:334-336`（watchdog 重挂） | 在位 |
| **续跑骨架（三执行体共用）** | `thincoder-core/agent/spawn-child.mjs:233`（`runWithContinue(runner, child, input, callbacks, runOpts, { askContinue, onDeclined })`——`ContinueError → 询问 → resume:true 重跑`循环骨架，差异点经参数注入）· `:35`（再导出 `TURN_CAP_MARK`——唯一定义 = `thincoder-core/agent/child-marks.mjs`） | 在位 |
| 主 agent 续跑（CLI） | `thincoder-cli/src/tui/agent-turn.mjs:194`（`ContinueError` 分支）· `:203-224`（`name: "continue"` 权限卡）· `:132`/`:137`（`makeController` 定义 / 每段重建 controller 登记 abort 集合） | 在位 |
| **撞帽检查点（构造 / 挂起 / 兑现）** | `thincoder-core/agent-tools/checkpoint.mjs`（**新增零依赖叶**——导出集 / 幂等口径 / 兑现调用点见本表表注） | 新增 |
| 检查点判定点（段边界） | `thincoder-core/agent/spawn-child.mjs:253`（`askContinue(e)` 调用点 = 段边界**唯一**判决动作）· `:248`（续跑循环头）· `:255` 起（`onDeclined` 降级分支） | 在位 |
| 撞帽抛点（核） | `thincoder-core/agent/turn-loop.mjs:316`（`throw new ContinueError(maxTurns)`）· `:307`（`injectPostTurn(...)` 调用——回合尾单点） | 在位 |
| 异步族报请面 | `thincoder-core/agent-tools/subagent-run.mjs:174`（async 子代 askContinue——**回调体内登记**）· `agent-tools/escalate-async.mjs:252`（async 飞刀——同形）· `agent-tools/consult.mjs:329-340`（会诊——`session.continueQueue` **闭包内登记**（串行保留）；续期 ⇒ `clearTimeout(watchdog)` + 重挂） | 在位 |
| 裁定通道（答复侧） | `thincoder-core/agent-tools/subagent-actions.mjs:46`（`executeSendAction`——续期 + 文本作新段首条指令；**兑现调用点两处见本表表注**）· `agent-tools/subagent-async.mjs:245`（`executeCancelAction`——停 ⇒ partial；**±0 行**）· 报请入队 / 唤醒 = `agent-tools/parent-channel.mjs`（`pushChildUpstream` + `wakeAsyncWaiters`——复用，零新建） | 在位 |
| 池条目留痕（段数 / 累计轮次） | `thincoder-core/agent-tools/subagent-actions.mjs:36`（status 面——转口 `subagent-actions-query.mjs`）/ `:263`（observe 面）——`{ turnCap: turnCapTrace(entry) }` 入摘要**文本**（桥字段零新增） | 新增行 |
| AUTO 短路排除（CLI） | `thincoder-cli/src/tui/interaction.mjs:68`（AUTO 短路排除 `continue` 名） | 在位 |
| 会诊子代上行通道（补赋） | `thincoder-core/agent-tools/consult.mjs`（`runConsultChild` 装配处补 `child._upstream = { parent: agent, label, sync: false }`——赋点 `:292`；会诊 = 后台族（`consult_start` `:448-450` 发后即返 `{id, models}`）⇒ 父在飞可答）。**副作用登记**：consultant 由此获得 `notify_parent` 上行工具能力（与检查点同源通道） | 新增 |
| 编号镜像层（子代理） | `thincoder-core/agent-tools/subagent-run.mjs:126-141`（`⟦ev⟧turn` 包裹层：保留 onAgentTurn → `entry.turn` / `maxTurns` → status / observe 面） | 在位 |
| 编号镜像层（飞刀） | `thincoder-core/agent-tools/escalate-async.mjs:212-221`（同形解析 → `entry.turn`） | 在位 |
| CLI 消费链 | `thincoder-cli/src/tui/subagent-blocks.mjs:48`（`SUB_EVENT_RE` 块头 `turn n/max`）· `render-frame.mjs:393-394`（主会话状态行读 `_currentTurn` / `_maxTurns`） | 在位 |

**§3.1 表注（检查点兑现接线）**：

- **checkpoint 叶 API（一）**：`registerTurnCapCheckpoint(child, entry, payload) → Promise<boolean>`——登记（子代 / 飞刀 = `entry._turnCapRec`；会诊 = `session._turnCapRec`）+ 上行报请（payload = 段数 / 累计轮次 + 去向一句话）+ 挂起；`signal.abort` ⇒ resolve(false)。
- **checkpoint 叶 API（二）**：`settleTurnCheckpoint(entry)`——**子代 / 飞刀兑现**（含 escalate——同池）：读登记 ⇒ 删登记 ⇒ resolve(true)；**幂等**（二调 = miss false ⇒ 回落既有路径）· `turnCapTrace(entry)`（留痕片段）· `resumedSendResult(key, label)`（send 早返体）。
- **checkpoint 叶 API（三）**：`settleConsultCheckpoint(agent, key, message)`——**会诊兑现**：`agent._consultSessions.get(key)` → `session._turnCapRec`；文本入 `rec.child._injected` ⇒ resolve(true)。
- **send 兑现两处**（`subagent-actions.mjs`）：① `:308-313` 池查找**未命中**分支（advisor 判后、错误返前）——`settleConsultCheckpoint(agent, key, message)`（`:312`）；② `:322-323`（`entry._injected.push` 后）——`settleTurnCheckpoint(entry)`（`:323`）。**`subagent-actions.mjs` = 499 行**（≤ 500 硬限，余量 1 行）。
- **会诊兑现判定序**：池命中优先（`send` 到在池 id ⇒ 既有路径零改）；池未命中且 advisor 未命中 ⇒ 试会诊登记（挂起面）⇒ 命中 = 早返 `resumedSendResult(key, "consult")`；非挂起期会诊 id 的 `send` 仍报 `unknown async subagent id`（登记 miss 回落）。
- **兑现后的消费路径（三执行体同配 · 缺口已闭合）**：文本落 `entry._injected`（子代 / 飞刀）· `rec.child._injected`（会诊）后，须由子 `runAgent` 回合头 `consumeInjected?.()` 消费（核 `thincoder-core/agent/turn-loop.mjs:87`——缺省 null 零开销）。
  提供点三处 = `agent-tools/subagent-run.mjs:157`（子代）· `agent-tools/escalate-async.mjs:231`（飞刀）· `agent-tools/consult.mjs:322`（会诊）——三执行体同配，续期文本不再静默丢弃；闭包定义单源 = `agent-tools/subagent-run.mjs:34`（`drainInjectedQueue`）。
- **cancel 零新增行**：`agent-tools/subagent-async.mjs:174`（停单点）；running 面 `:207` `entry.cancelled = true` · `:209` `entry.controller?.abort?.({ abortTrigger: "cancel", … })` ⇒ 登记信号逃逸（子面 `runOpts.signal = entry.controller.signal`）
  ⇒ `askContinue` = false ⇒ `onDeclined` partial + `TURN_CAP_MARK` ⇒ **`subagent-async.mjs` = ±0**（走既有 abort 信号，非免接线）。
- **超限缓冲**：`subagent-actions.mjs` 499 行 ⇒ 余量 1 行；若再需行，备选 = `executeObserveAction` 迁出零依赖叶再导出（先例 = `:339` `executePanelAction` re-export）——超限即停并报。
- **新增文案语言 = 英文**（裁定）：检查点批新增文本——检查点 ask 载荷（`thincoder-core/agent-tools/checkpoint.mjs:81-82`）/ send 兑现早返体（`thincoder-core/agent-tools/checkpoint.mjs:115`）——**一律英文**（沿核内报告面既有形态；面向模型与上行通道消费）。

### 3.2 VSC 面

| 面 | 落点 | 实核 |
|---|---|---|
| 类 / 抛点 | 已退役——现盘 `thincoder-vscode/src/agent.mjs:9`（10 行转口：只余 `ContinueError` 再导出）；抛点 = 核 `thincoder-core/agent/turn-loop.mjs:316` | 已退役 |
| 编号复位 | 已在核——`thincoder-core/agent/run-start.mjs:109`（`if (!resume)` 守卫）/ `:113`（`agent._turnSeq = 0`，全档唯一复位点）；端侧零自有复位点 | 在位（核） |
| 编号帧发出 | 已在核——`thincoder-core/agent/turn-loop.mjs:98`（`turnFrame(++agent._turnSeq, turn, maxTurns)`）/ `:99-100`（`_currentTurn` / `_maxTurns` 回填） | 在位（核） |
| 帧纯函数 / 消费 helper | `thincoder-vscode/src/agent/run-helpers.mjs:14`（`turnFrame` 转口）· `:36`（`applyTurnFrame`） | 在位 |
| 子代理续跑环 / 撞墙终态文案 | 现体 = 核 `thincoder-core/agent/spawn-child.mjs:233`（`runWithContinue` 单源，双端共用） | 在位 |
| 飞刀同步续跑 / 飞刀 async 面 | 现体 = 核 `thincoder-core/agent-tools/{subagent-actions,escalate-async}.mjs` | 在位 |
| 会诊续跑 | 现体 = 核 `thincoder-core/agent-tools/consult.mjs:329-340` | 在位 |
| 主 agent 回合循环 | `thincoder-vscode/src/extension/panel-turn-loop.mjs:112` 起（回合循环）· `panel-turn-stages.mjs`（阶段）· `panel-chat.mjs`（会话 / 消息面） | 在位 |
| 回合尾 | 已退役——现盘 = 核 `thincoder-core/agent/turn-loop.mjs:307`（`injectPostTurn(...)` 回合尾单点） | 已退役 |
| AUTO 短路排除（VSC） | `thincoder-vscode/src/extension/panel-callbacks.mjs:279`（live AUTO 短路排除 `continue` 名） | 在位 |
| 载入面自证（启动期诊断） | `thincoder-vscode/extension.mjs:88`（`activate()`——`applyEngineFloorGuard()` `:95` 之后）**+2 行**（读取行 + 输出行——失败面 / 观察通道 / 机检见 §3.2 注） | 新增（D-TC19） |
| 打包面机检（vsix 内含检查点接线） | `thincoder-vscode/scripts/check-vsix.mjs`（解包面 `:39-45`；**断言 E 现盘 = `:60-70`**——与断言 B `:51-58` / 断言 D `:72-82` 同级）——断言：vsix 内 `extension/node_modules/@thincoder/core/agent-tools/checkpoint.mjs` 存在 ∧ 同目录 `agent-tools/subagent-run.mjs` 含 `registerTurnCapCheckpoint` | 新增 |

**§3.2 注（载入面自证 · 实现面）**：

- **实现 = 2 行**：读取行（`import.meta.resolve("@thincoder/core/agent.mjs")` 取实体目录 + 读同目录 `package.json` 的 `version`；
  **单行 `try` 兜底**——先例坐标（单元测试树重建时恢复；形态 = `try { src = readFileSync(file, "utf8") } catch { continue }`））+ 输出行 `console.warn("[thincoder] core face = <路径> (v<版本>)")`。
- **失败面**：读取失败 ⇒ 记 `[thincoder] core face = unresolved`——**不抛、不阻断激活**（只留证据；诊断面非门禁面）。
- **观察通道** = VSC **Extension Host 日志**（`console.warn` 宿主直捕——零新增通道；同档既有先例 `:74`（engine floor）/ `:93`（activate starting））⇒ T7 / 实盘复核按此通道读日志。
- **机检** = T5（activate 源码切片断言含 core 实体路径诊断行）。

## 4. 跨段累计编号（现行机制）

**口径**（双端同源）：**跨段累计**——`turn = 链内累计已跑轮数`；`max = 段前累计 + 本段预算`。

- **编号帧（纯函数）**：`turnFrame(seq, turn, maxTurns) → { turn: seq, maxTurns: seq - turn - 1 + maxTurns }`——差额项 = 本段开始前的链内累计。
  段内帽判定**不读**该帧（循环条件仍只读段内 `turn < maxTurns`）。
- **唯一新增状态**：`agent._turnSeq`（链内累计序数，agent 级）——复位条件 `!opts.resume` 且**仅此一处**（复位落点 = `thincoder-core/agent/run-start.mjs:109-113`——`!resume` 守卫 `:109` + 编号复位 `:113`）；递增 = 每轮无条件 +1（与回调存在与否无关）。
- **段数留痕**：`agent._continueSegments`（链内段数，agent 级）——`resume` 重入 +1、首段 = 1；复位条件同 `_turnSeq`（`!opts.resume`——承载式赋值 `thincoder-core/agent/run-start.mjs:104`：`resume ? (_continueSegments ?? 1) + 1 : 1`，链起点归 1）。消费面 = 摘要**文本**（§3.1 池条目留痕行）⇒ 桥字段零新增；#7 检查点的载荷与留痕口径同读此值。
- **段间载体（端差面）**：VSC 子代理面每段续跑 = **新 agent 对象** ⇒ `_turnSeq` 不跨段存活 ⇒ 经 `opts._turnSeqBase` 回传
  （仅 `_turnSeq == null` 时落，非空不覆盖）；核侧同一 child 对象跨段 ⇒ `_turnSeq` 非空 ⇒ 种子零作用。
  **同结果、异载体**——语义同源，实现形态各端自持。
- **消费面**：编号经既有回调与终态快照消费——**桥消息字段零新增**、webview 显示文件零改动（值语义改动即生效）；撞帽提示文案直读 `_turnSeq` 本身（§6），同样零新增字段。
- **零改动面**：终态快照、webview 显示文件（`webview/activity.js` / `activity-view.js`）、出生 / queued 事件、段内帽判定与 `ContinueError` 载荷。

## 5. 关键决策记录

| # | 决策 | 理由 |
|---|---|---|
| D-TC1 | **继续次数不设上限**（用户明确要求） | 防卡死靠用户 Stop |
| D-TC2 | 编号口径 = **跨段累计**（非分段显式） | 双端语义一致；改动面 = 生成侧 + 两消费点，桥消息字段零新增 |
| D-TC3 | 累计预算经**回调第二参**传（非消费端读 `sink.agent`） | — |
| D-TC4 | 终态快照与 webview **零改动** | `entry` 已是累计值——快照 / 头部逐字消费 |
| D-TC5 | 段间种子经 **`opts`** 回传（VSC 修法 A） | 生成侧单点保持 |
| D-TC6 | **不建 live 头逐轮跳动**（登记保持开放） | 需桥通道（出生 / queued 事件面）；本项只修**值语义** |
| D-TC7 | 段内帽 / 续跑循环结构 / `ContinueError` 载荷零改动 | 累计只作用于编号值 |
| D-TC8 | **编号帧复用 `_currentTurn` / `_maxTurns`**（approval 事件读同一对字段——CLI `thincoder-core/agent/dispatch.mjs:301` 零改动） | 只改 turn 事件载荷而状态行字段仍段内 ⇒ 同链内两类事件交替驱动块头、显示值来回跳 |
| D-TC9 | **depth 无关**（主会话续跑同构同修） | 同一缺陷结构在主会话续跑（Ctrl+I / AUTO 续跑）同存——只修 depth>0 = 留同构错误。**代价如实披露：主会话状态行编号同样累计**（同源结果） |
| D-TC10 | **撞帽提示 = 本段轮数 + 链内累计轮数，并删掉 `(limit …)` 括注**（四面同一信息集——逐字模板 / 落点 / 断言清单见 §6） | ① 只报本段，用户判不出「已经转了 40 轮」还是「刚转 12 轮」，而继续 / 停的决断正好取决于这个量级（用户 2026-11-01 20:02 裁定）；② `(limit N)` 在撞帽面上恒等于同一个数——`ContinueError(maxTurns)` 于循环跑满后抛出（`thincoder-core/agent/turn-loop.mjs:89` / `:316`），VSC / 桌面更印成无数字的 `(limit)` 断头句；累计上限在撞帽点同样 ≡ 累计已跑，印不出新信息（用户 2026-11-01 20:04「一起改」） |
| D-TC11 | escalate 与子代理**共用 `ctx._subagentKey`**（`thincoder-core/agent-tools/subagent-actions.mjs:475`） | 继续 / 完成的 TUI 冻结与记账语义一致 |
| D-TC12 | 检查点 = **段边界挂起**（不 settle、不重派新 child） | 保留同一 child 对象 ⇒ `resume` 后 history / 记账 / 累计编号全保活（F2「同一执行体」天然满足） |
| D-TC13 | 裁定通道 = **既有 `subagent action:'send'`（续期）/ `'cancel'`（停）**——**零新建** | send 已是「父 → 子注入」单点（`subagent-actions.mjs:293`），自然映射「续期 + 新段首条指令」；cancel 已是既有停面 |
| D-TC14 | **同步族**（阻塞子代理 / 同步飞刀）⇒ **用户卡路径保留**；**异步族**（后台子代理 / 异步飞刀 / 会诊）⇒ 父代理检查点（父侧裁定 B） | 同步族父代理被本次调用阻塞（平台纪律原文：同步子代应答不可达）+ 挂起不可续（history 随调用返回丢弃）⇒ 检查点不适用；`_upstream.sync` 为机械判据 |
| D-TC15 | **AUTO 档一律不再自动批准续期**（CLI `interaction.mjs:68` / VSC `panel-callbacks.mjs:279` 对 `continue` 名取消短路）+ **depth-0 digest 档自续支退役** | 「静默自动续期」= F8 明文禁止——无人值守档无裁定者 ⇒ 停（后果已在需求档 §4 显式化） |
| D-TC18 | **N7 整条撤销**——用户裁定：**不设零产出阈值**，**撞帽检查 = 无条件**（首轮有产出同样检查）⇒ 唯一边界动作 = 段边界 `askContinue`；**F8 检查点保持**。撤销面 = 计数 / 复位 / 常量 / 跳闸判 / 文案 / 用例 / 参数登记**全族**（不留死码——死码会被读者当活工单） | 阈值化行为不可判（第一轮有产出 ⇒ 其后任意长链不跳闸）；判据回到 F8 唯一触发点 = 段预算 |
| D-TC19 | **载入面自证取最小**：① 启动期一行诊断（core 实体路径 + 版本）② 打包面机检（vsix 内 core 含检查点接线）——**不动机制语义**（只加可核面） | 实况触发 = 运行面跑的是安装包内冻结旧构建 ⇒「以为在跑新码」必须可自证 |

- **检查点逃逸三分档**（D-TC12）：① **兑现**——`send` 面两处（§3.1 表注：池直注入 + 会诊未命中分支）；② **中止信号**——Stop / `cancel` / 会话中止 ⇒ 登记 `signal` abort ⇒ resolve(false) ⇒ `onDeclined` partial + `TURN_CAP_MARK`；③ **不可答降级**——`child._upstream?.parent` 缺席 ∨ 同步族 ⇒ **不登记** ⇒ 走既有路径（同步族 = 用户卡面；无 handler = partial）。

## 6. 撞帽提示文案（四面同口径）

**判据**：撞帽提示必须同时给出**本段跑了多少轮**与**链内累计跑了多少轮**。

只报本段，用户判不出「已经转了 40 轮」还是「刚转 12 轮」——而继续 / 停的决断正好取决于这个量级（用户 2026-11-01 20:02 逐字「C15累计进度要啊」；决策 = D-TC10）。

面 = **CLI TUI ∥ CLI 非 TUI 命令面（`thincoder-cli/src/command-interactive.mjs` 的 `[paused]` 行）∥ VSC ∥ 桌面**，四面信息集相等——**面差即缺陷**。

面的判据 = **该行是否就该次撞帽给出续跑去向**：给（提问 ∨ 指路「Run in TUI to continue」）⇒ 撞帽提示，纳入；不给 ⇒ 终态状态行，不纳入（理由见 §6.7 末二条）。

### 6.1 两个数，各自单源

| 量 | 取值 | 单源 |
|---|---|---|
| 本段轮数 `seg` | `ContinueError.turn` | 抛点 `thincoder-core/agent/turn-loop.mjs:316`；`for (let turn = 0; turn < maxTurns; turn++)`（`:89`）跑满后抛 ⇒ `seg` 恒等于本段预算 |
| 链内累计 `total` | `agent._turnSeq` | 每轮无条件 +1（`thincoder-core/agent/turn-loop.mjs:98`）；`!resume` 链起点复位（`thincoder-core/agent/run-start.mjs:109-113`）——§4 的累计计数器本身 |

- **读计数器本身**，不读 `_currentTurn` 显示帧：帧值是同值镜像——**撞帽点两值恒等**（`thincoder-core/agent/turn-loop.mjs:98` 同一行先 `++agent._turnSeq`，`:99` 再回填 `_currentTurn`），但链起点只复位 `_turnSeq`（`run-start.mjs:113`），`_currentTurn` 不复位 ⇒ 链起点到首轮帧之间两值不等；读计数器取的是定义值，少一层镜像。
- **不加兜底**：模板直读 `agent._turnSeq`，不写 `?? 0`——撞帽点上该值必为整数（抛点在 `thincoder-core/agent/turn-loop.mjs:316`，此前 `:98` 已无条件 +1）；取值缺失时印 `0` 会把「未跟踪」读作「零消耗」，正是 `thincoder-core/agent-tools/checkpoint.mjs:24-26` 明文禁止的冒充。
- **先例（取数）** = `thincoder-core/agent-tools/checkpoint.mjs:29` 的 `segments ${child?._continueSegments ?? 1} · accumulated ${child?._turnSeq ?? 0} turns`（#417 / #934 引入的留痕文本，同处注释 `:20-34`）——取值口径与「累计」措辞对齐；`?? 0` 形态不沿用于提示面（理由见上一条）。
- **公开源** = `PROJECT-MANIFEST.json` 的 `index.publicRepos` 为 `[]`（本批实读）⇒ 无外部公共源可比面；仓内规范面已扫（本档 / `docs/core/requirements/TURN-CAP-CONTINUE.md` / `docs/cli/design/TUI-SESSION-VIEW.md`）。

### 6.2 上限不印（删掉 `(limit …)`）

**结论**：三端一律删掉 `(limit …)` 括注，一个上限数都不印。

- **本段上限 ≡ 本段轮数**：`ContinueError(maxTurns)` 在循环跑满后抛出（`thincoder-core/agent/turn-loop.mjs:89` / `:316`）⇒ `Ran N turns (limit N)` 把同一个数说了两遍。
- **累计上限 ≡ 累计轮数**：帧公式 `seq - turn - 1 + maxTurns` 在最后一轮取值恰为 `seq`（`thincoder-core/agent/helpers.mjs` 的 `turnFrame`）⇒ 撞帽点上任何上限都不带新信息。
- **原印无数字的 `(limit)`**：VSC / 桌面两端当初就印成断头句（括注在、数字无），读者无从填——一并删掉，不留半句。
- **`ContinueError` 不加上限字段**：载荷增字段 = 动续跑契约（D-TC7 / 需求 N6 零改动），而值恒等于已示数；四面用 `error.turn` + `agent._turnSeq` 两个既有值即可，面差为零。

### 6.3 逐字模板

| 端 | 逐字 |
|---|---|
| CLI | `Ran ${seg} turns — ${total} turns total. Continue?` |
| VSC | `Agent reached ${seg} turns — ${total} turns total. Continue from here?` |
| 桌面 | `Agent reached ${seg} turns — ${total} turns total. Continue from here?`（与 VSC 逐字同句） |

CLI 待答状态行（同一张卡的第二行）：`Continue after ${seg} turns (${total} total)?`——信息集与上一行相同，不留「只报本段」的第二处。

CLI 非 TUI 命令面（`[paused]` 行）：`[paused] Agent stopped after ${seg} turns — ${total} turns total. Run in TUI to continue.`

**三问式（逐串作答）**：

- CLI TUI 提示串 = 本批被改件：`existing: thincoder-cli/src/tui/agent-turn.mjs:242 · name: "Ran ${error.turn} turns (limit ${error.turn}). Continue?" · consumers: CLI TUI 用户（撞帽卡第一行）`——新串 = 该串换数 + 删括注，句形沿用。
- VSC ∥ 桌面：`existing: thincoder-vscode/src/extension/panel-turn-loop.mjs:262 ∥ thincoder-desktop/src/main/turn-driver.mjs:103 · name: "Agent reached ${turn} turns (limit). Continue from here?" · consumers: 面板用户`——同上。
- 累计数的既有措辞：`existing: thincoder-core/agent-tools/checkpoint.mjs:29 · name: "accumulated ${child?._turnSeq ?? 0} turns" · consumers: 检查点 ask 载荷 / 池条目留痕文本`——**读数复用、句子不复用**：那是文本片段（记录面），提示面要的是成句 + 问句。
- `[paused]` 行：`existing: thincoder-cli/src/command-interactive.mjs:111 · name: "[paused] Agent stopped after ${error.turn} turns. Run in TUI to continue." · consumers: 非 TUI 命令面用户`——插同一个累计数，其余逐字不动。
- 新增构句 = `none found: 三端源码 ∥ 本档 §4 ∥ 需求档（本批实扫）`——仅「— ${total} turns total」这一截为新增，故按上面四条既有串就地改写，不另起句式。

### 6.4 落点

| 端 | 落点 | 改法 |
|---|---|---|
| CLI | `thincoder-cli/src/tui/agent-turn.mjs:242`（`pushLine` 文案）· `:250`（`state.status`） | 分支头取一次 `const total = agent._turnSeq`，两行同用 |
| CLI 非 TUI 命令面 | `thincoder-cli/src/command-interactive.mjs:111`（`[paused]` 行） | `agent` 在本函数域（`:100` `agent.autoApprove` 同域）⇒ 同处拼串，取 `agent._turnSeq` |
| VSC | `thincoder-vscode/src/extension/panel-turn-loop.mjs:262` | `agent` 在本函数域声明（`:199`），catch 内直达 |
| 桌面 | `thincoder-desktop/src/main/turn-face.mjs:68`（`consentOf` 转口）· `:150`（调用点，`agent` 在域）· `thincoder-desktop/src/main/turn-driver.mjs:103`（注入面 `askContinue`） | 注入面签名扩一参 `askContinue(key, turn, total)`，调用点传 `agent._turnSeq`；两处注释（`turn-face.mjs:57` / `turn-driver.mjs:99-100`）同改 |

`state.permission.args`（CLI `:247`，`{ turns: error.turn }`）**零改**——权限载荷不是提示面。

### 6.5 断言连带（锁定串清单）

本批实扫：**全仓无测试用例断言这两句**——要改的只有源码面与规范面。

| 面 | 坐标 | 改法 |
|---|---|---|
| CLI 文案 | `thincoder-cli/src/tui/agent-turn.mjs:242` | 换 §6.3 模板 |
| CLI 状态行 | `thincoder-cli/src/tui/agent-turn.mjs:250` | 换 §6.3 第二行 |
| VSC 文案 | `thincoder-vscode/src/extension/panel-turn-loop.mjs:262` | 换 §6.3 模板 |
| 桌面文案 | `thincoder-desktop/src/main/turn-driver.mjs:103` | 换 §6.3 模板 + 签名 |
| 桌面转口 / 调用点 | `thincoder-desktop/src/main/turn-face.mjs:68` / `:150` | 传累计值 |
| CLI 非 TUI `[paused]` 行 | `thincoder-cli/src/command-interactive.mjs:111` | 换 §6.3 `[paused]` 模板 |

- 检索串 = `turns \(limit` ∥ `Continue from here` ∥ `Ran \d` ∥ `Continue after` ∥ `Stopped after .* turns`（本批新增，扫 `[paused]` 类串）；命中面 = 四处源码 + 本档 + 归档档（需求档实扫零命中——本裁定口径已替换旧串），**测试档零命中**。
- 锁定串断言现盘零处：全仓测试档今天没有一条断言这几句 ⇒ 本批落盘后新增的断言只有 §6.6 的单测档（实施轮写、收口删），不转成常驻。
- 归档档（各端 `docs/_archive/*`）不追改——历史面。
- **不新增机检**（设计侧判断：要改的是提示串与其断言，现有门不查串内容；再加一条只是把同一批串抄第二遍，不给新信息）。

### 6.6 用例（实施轮自测口径）

| # | 输入 | 期望 |
|---|---|---|
| C1 | 首段 `maxTurns: 3` 跑满 | `seg = 3` · `total = 3` |
| C2 | 段 1 跑满后续跑一次（段 2，`maxTurns: 3`）跑满 | `seg = 3` · `total = 6` |
| C3 | 新链（`resume: false`）首段跑满 | `total` = 本段轮数（不继承上一链） |
| C4 | 四处提示面源码切片（CLI ∥ CLI `[paused]` ∥ VSC ∥ 桌面） | 每处逐字含 §6.3 模板（`${seg}` 位 ∥ `${total}` 位各一处）；四处均零 `(limit` |
| C5 | CLI 非 TUI 命令面撞帽 | `[paused]` 行同时含本段数与累计数两个数；`Run in TUI to continue.` 逐字保留 |

**落点与命令**：单测档 = `docs/batches/2026-11-01-turncap-cumulative-progress.test.mjs`（与批档同目录、同批名——单元档用毕即删），命令 `node --test docs/batches/2026-11-01-turncap-cumulative-progress.test.mjs`。

**断言形态**：C1–C3 = 行为断言（跑 `turnFrame` ∥ 读 `_turnSeq` 的实数）；C4–C5 = 源码切片断言（读四处文件的对应行比模板串 ∥ 判 `(limit` 零命中）——提示串没有可跑的行为面，切片是这里唯一可机检的形态。

### 6.7 边界

- 不改撞帽判定 / 续跑结构 / 段预算（D-TC1 · D-TC7），`ContinueError` 载荷零改。
- **D-TC7 零改动面的口径**：段内帽（`thincoder-core/agent/turn-loop.mjs:89`）· 续跑循环骨架（`thincoder-core/agent/spawn-child.mjs:233`）· `ContinueError` 载荷（`thincoder-core/agent/helpers.mjs`）三面零改；端侧注入缝扩一参（`thincoder-desktop/src/main/turn-face.mjs:68` 的 `askContinue(key, turn, total)`）是**已披露的唯一相邻改动**，不属上述三面。
- 卡标题 `thincoder-cli/src/tui/render-frame.mjs:304`（` Continue? (y/n) `）零改。
- `ContinueError` 自身 message（`thincoder-core/agent/helpers.mjs`）零改——那是错误路径回显，不是提示面，且抛点取不到 agent 的累计值。
- 检查点载荷 / 池条目留痕文案 / 后端帧零改。
- **不纳入 `thincoder-server/deploy/sandbox/member-shell/core-run.mjs:423`**（逐字 `message = "本回合已超出预算（模型调用轮数上限）"`）：该行是终态状态行——沙箱成员壳撞帽即收口，不给续跑去向（无卡、无 `resume` 路径），用户不据此做「继续 / 停」的决断；两个数的用处不存在，纳进来只是多印一行。判据 = §6 首段的面判据。
- **桌面端验收前须重打包**：用户跑的是安装包内的 `app.asar`，冻结的旧构建仍印旧串（`thincoder-desktop/dist-r{3,4}/…/app.asar:70392`），而 `thincoder-desktop/.gitignore:9` 的 `dist-*/` 让它不在检索面内 ⇒ 验法二选一：重打包后验，或以源码起跑验。

### 6.8 集成用例设计（RTM 增量）

**先读面** = `test/RTM.md`（本批实读）：CLI 端 24 个业务故事，VSC ∥ 桌面两端各写「集成层尚未建立」；全表无撞帽提示故事。

**① 被破坏的既有行 = 零行**。本批改的是提示串；实扫 `test/integration/**` 对三串（`turns (limit` ∥ `Continue from here` ∥ `Continue after`）零命中，RTM 24 个故事也无一断言撞帽提示 ⇒ 没有既有行需要改写。

**② 冗余行 = 无**。

**③ 缺的行 = 1 个故事 / 1 行用例**：CLI 端故事 25「撞帽了，用户看得见自己转了多久」，用例 `25-1`（编号已先在 `test/RTM.md` 定死，用例标题照抄该号）。

| 项 | 值 |
|---|---|
| 交互组件 | 核回合环（`thincoder-core/agent/turn-loop.mjs` 每轮 `++agent._turnSeq` ∥ `:316` 抛 `ContinueError`）⟷ CLI 撞帽分支（`thincoder-cli/src/tui/agent-turn.mjs:240-252` 的询问行 ∥ 待答状态行） |
| 业务可观察结果 | 撞帽卡上同时出现「本段轮数」与「链内累计轮数」两个数——第二段跑满时用户读到的是 6，不是 3 |
| 服务的需求 | 撞帽提示条目（`docs/core/requirements/TURN-CAP-CONTINUE.md:43`；用户 2026-11-01 20:02 逐字「C15累计进度要啊」） |
| 用户入口 | CLI 会话里让一个任务连撞两次轮帽（`agent.maxTurns` 调小），读第二次的卡面 |

**这行为什么成立**（两条入口至少一条）：产品真需要的场景——撞帽后「继续还是停」是用户当下就在做的决断，而它取决于量级；本批之前的提示只有本段数，缺的是**业务可观察结果**，不是内部实现细节。

**VSC ∥ 桌面不设行**：两端集成层尚未建立（`test/RTM.md` 两端节明写「尚无集成用例」），本批不为它新建一层；端面一致性由 §6.6 的 C4 切片断言守住。
