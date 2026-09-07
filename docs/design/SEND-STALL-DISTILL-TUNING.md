# 探索蒸馏异步化 — 设计（VS Code 扩展） > 状态：**已实现**（2026-08-25 评审修订后实施；Open VSX/Marketplace 0.1.49）
> 需求：`docs/design/SEND-STALL-DISTILL-REQUIREMENTS.md`
> 关联：`docs/design/README.md`（文档地图）；机制背景见 CLI 端 `thincoder/docs/design/CONTEXT-COMPACTION.md`（本仓库无此文件，评审 #4）
> 说明：与 CLI 端 `SEND-STALL-DISTILL-TUNING.md` 同源（两端语义一致，各自文件清单独立——文档地图惯例） ## 1. 问题陈述（Problem Statement） | # | 现状 | 位置 | 后果 |
|---|---|---|---|
| P1 | 轮末蒸馏在 `onComplete` **之前**同步阻塞：`const shrunk = await summarizeRunExplorations(...)` 位于最终回复 pushReal 后、`callbacks.onComplete` 前 | `src/agent.mjs:282-293` | send 按钮恢复的唯一信号（`complete` 消息 → `webview/chat.js:153` → `finish()` → `setLoading(false)`）延迟 10+ 秒；蒸馏静默（compact.mjs 注释 "Silent by design (D11)"），UI 无任何反馈 |
| P2 | 蒸馏替换历史（`history.length=0; push(...shrunk)` 原地改）发生在 `onComplete` 的 `_saveLines` **之前**——现状磁盘保存的就是压缩版 | `src/agent.mjs:282-289`、`src/extension/panel-chat.mjs:168-174`（onComplete → _saveLines） | 异步化后 onComplete 提前 → 保存的将是未压缩版；必须蒸馏完成后再保存一次，否则摘要丢失 |
| P3 | 蒸馏 promise 需跨轮存活（每轮 runAgent 重建 agent 对象） | `src/agent/setup.mjs`（agent 每次 runAgent 新建） | 挂载点必须在 panel 侧（跨 turn 存活），经 `runOpts` 传入 | ## 2. 解决方案（Solution Approach） ### 2.1 时序重构（P1） `src/agent.mjs` 轮末（`:282-293`）： ```js
// 现状（阻塞）：onComplete 在蒸馏之后
const shrunk = await summarizeRunExplorations(history, agent._runStartHistoryLen ?? 0, provider, signal)
if (shrunk) { history.length = 0; history.push(...shrunk); agent._lastPromptTokens = null; agent._usageAtLen = null }
if (depth === 0) callbacks.onComplete?.(response.content, agentState(agent)) // 改为（onComplete 先行 + 异步蒸馏）：
if (depth === 0) { callbacks.onComplete?.(response.content, agentState(agent)) // UI 立即释放 // depth 守卫（评审 #2）：仅顶层轮末触发蒸馏；子轮（depth>0）不得创建—— // 否则先创建的蒸馏晚 resolve 会 clobber 历史（N1 竞态）。 // 专用 distillSignal（评审 #1）：与运行 signal 分离——新消息/下一轮 // abort 运行 controller 时蒸馏继续完成；用户 Stop（abort 运行 signal） // 同样不影响蒸馏。panel dispose / 会话切换时 abort distillSignal。 const distill = summarizeRunExplorations(history, agent._runStartHistoryLen ?? 0, provider, opts.distillSignal ?? signal) .then((shrunk) => { if (shrunk) { history.length = 0 history.push(...shrunk) agent._lastPromptTokens = null agent._usageAtLen = null callbacks.onDistilled?.() // 压缩已落位 → 调用方应持久化（评审 #5，见 2.3） } return shrunk }) .catch(() => null) if (opts.distillState) opts.distillState.pending = distill
}
``` - `distillState`：`{ pending: null }`，由 `panel-chat.mjs` 创建（panel 跨 turn 存活），`runOpts` 传入。
- `distillSignal`（评审 #1）：panel 惰性创建 `panel._distillController`（AbortController，panel 生命周期内不复用/不随轮次重置），`runOpts` 传 `distillSignal: panel._distillController?.signal`；`panel.dispose` / 会话切换（newSession/deleteSession/loadSession）时 abort。运行 signal（`panel._abortController`）只用于 abort 运行中的轮次，不再传导到蒸馏。
- 测试补强（评审 #1）：新增 chat-panel 级用例——通过真实 `_chat()` 路径在蒸馏进行中连发第二条消息，断言：①蒸馏 promise 存活并完成（未被新消息 abort）；②第二轮 history 起点是压缩版（摘要 note 在用户输入之前）。
- 替换逻辑与原 `if (shrunk)` 块逐字一致（原地 `length=0; push` 保持 history 引用——panel 持有的同一数组，后续保存天然拿到压缩版）。 ### 2.2 下一轮开头 await（N1 竞态安全，FR2） `src/agent.mjs` `runAgent` 开头（`setupAgentRun` **之前**）： ```js
// 上一轮异步蒸馏必须先落定：压缩后的机器行是本轮的起点（N1：await 必须在
// setupAgentRun push 用户输入之前，否则新输入会被压缩替换清掉）。
const prev = opts.distillState?.pending
if (prev) { opts.distillState.pending = null await prev
}
``` - await 完成后 history 已被原地替换为压缩版，`setupAgentRun` 再 push 本轮输入 → 顺序正确。
- resume 场景（ContinueError 后 continue）：`runOpts(resume)` 重建时 pending 已清，幂等。 ### 2.3 保存回调（P2，FR3） `panel-chat.mjs`：
- panel 惰性初始化 `panel._distillState = { pending: null }`（或在 `runPanelChat` 开头确保存在）。
- `runOpts` 增加 `distillState: panel._distillState`。
- `buildCallbacks` 增加 `onDistilled`： ```js
onDistilled: () => { // 蒸馏完成、history 已压缩——再保存一次（onComplete 保存的是未压缩版）。 // slot 校验：用户若已切换会话，旧 turn 的压缩不写进新 session。 if (panel._slot !== distillSlot) return try { panel._saveLines(fullHistory, history, { activeProvider: providerName, ...agentState }) } catch (e) { console.error("[chat-panel] distill save failed:", e.message) }
},
``` - `distillSlot` 在 `runPanelChat` 开头记录 `panel._slot` 快照。
- `onDistilled` 由 `agent.mjs` 在蒸馏 resolve 且 shrunk 非空时调用（见 2.4）。 ### 2.4 失败路径（FR4/N3） - 蒸馏失败 → `summarizeRunExplorations` 返回 null → then 中 shrunk 为 null 不替换 → **不调 onDistilled**（无变化无需保存）→ 下一轮 await 立即通过。
- 用户 Stop → **运行** signal aborted → 蒸馏（distillSignal 不受影响）继续完成，onDistilled 正常触发（评审 #1 语义，2026-08-25）。
- panel dispose / 会话切换 → **distillSignal** aborted → chat() 抛错被 catch → null → 不替换、不保存。
- `.catch(() => null)` 双保险防 unhandled rejection。 ## 3. 受影响文件（Affected Files） | 文件 | 动作 | 内容 |
|---|---|---|
| `src/agent.mjs` | MODIFY | 轮末 `:282-293` 重构（onComplete 先行 + **depth===0 守卫** + 异步蒸馏 + distillState + **distillSignal**）；`runAgent` 开头（setupAgentRun 前）await 上一轮蒸馏 |
| `src/compact.mjs` | MODIFY | `summarizeRunExplorations`（`:431-432`）注释更新（异步调用语义）；distillExplorations 本身不动 |
| `src/extension/panel-chat.mjs` | MODIFY | panel._distillState 初始化；**panel._distillController 惰性创建 + dispose/会话切换 abort**；runOpts 传 distillState + distillSignal；buildCallbacks 增 onDistilled（含 slot 校验 + _saveLines）；distillSlot 快照 |
| `test/agent.test.mjs` | MODIFY | 新增：①onComplete 先于蒸馏（mock 慢蒸馏，断言 onComplete 在 <1s 触发）；②下一轮 await 蒸馏（第二轮 history 起点是压缩版）；③onDistilled 仅在 shrunk 非空时触发 |
| `test/chat-panel.test.mjs` | MODIFY | onDistilled → _saveLines 调用 + slot 切换跳过用例；**评审 #1 连发用例**（真实 _chat() 路径，蒸馏存活 + 第二轮压缩版） | ## 4. 验收标准（Acceptance Criteria） | # | AC | 验证方式 |
|---|---|---|
| AC1 | `onComplete` 在蒸馏完成**之前**触发：mock 慢蒸馏（如 5s），断言 onComplete <1s 触发，send 按钮信号不等待 | 单元测试 + 计时断言 |
| AC2 | 下一轮开头 await 蒸馏：蒸馏未完成时快速发第二轮，断言第二轮 history 起点是压缩后的机器行（摘要 note 在用户输入之前） | 单元测试 |
| AC3 | 蒸馏完成后 `onDistilled` 触发且仅在实际替换历史时（失败/null 不触发） | 单元测试 |
| AC4 | 蒸馏失败静默：返回 null，历史保持原样，onComplete 正常触发 | 单元测试 |
| AC5 | 磁盘会话最终为压缩版：onDistilled 后 `_saveLines` 被调，contextHistory 含摘要 note | 单元测试 |
| AC6 | slot 切换不串写：蒸馏完成时 panel 已切换 session，不保存 | 单元测试 |
| AC6a | 快速连发不 abort 蒸馏：第二条消息（真实 _chat() 路径）不中断蒸馏，第二轮从压缩版开始（评审 #1） | chat-panel 级测试 |
| AC6b | 子轮（depth>0）不触发蒸馏（评审 #2） | 单元测试：depth=1 轮末断言 distillState.pending 保持 null |
| AC7 | `npm test` 全套通过 | 命令 |
| AC8 | `src/` 无阻塞 `await summarizeRunExplorations` 残留 | grep 验证 |
