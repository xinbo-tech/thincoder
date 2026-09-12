# 探索蒸馏异步化 — 设计（VS Code 扩展）

> 板块：轮末探索蒸馏的**时序**（已实现专题，当前生效——现行机制描述）。
> 需求：`docs/requirements/SEND-STALL-DISTILL.md`
> 关联：`README.md`（文档地图）；机制本体（蒸馏替换/静默语义）归 CLI 端 `CONTEXT-COMPACTION（CLI 仓）`（本仓库无此文件，评审 #4）。
> 状态：**已实现**（2026-08-25 实施 + 2026-09-05 模块化；marketplace / Open VSX 0.1.49）。
> 说明：与 CLI 端 `SEND-STALL-DISTILL-TUNING.md` 同源（两端语义一致；各自文件清单独立——文档地图惯例）。

## 1. 问题陈述

- **P1 · 轮末同步阻塞（send 延迟）**：蒸馏原在 `onComplete` **之前**同步 `await summarizeRunExplorations(...)`——位于最终回复 pushReal 之后、`callbacks.onComplete` 之前。send 按钮恢复的唯一信号（`complete` 消息 → `finish()` → `setLoading(false)`）被延迟 10+ 秒；蒸馏静默（compact.mjs "Silent by design (D11)"），UI 无任何反馈。
- **P2 · 替换后不触发保存**：蒸馏用原地替换（`history.length = 0; push(...shrunk)`）把机器行换成压缩版，发生在 `onComplete` 的 `_saveLines` 之前——现状磁盘保存的就是压缩版。异步化后 `onComplete` 提前 → 保存的将是未压缩版；必须蒸馏完成后再保存一次，否则摘要丢失。
- **P3 · 蒸馏 promise 需跨轮存活**：每轮 `runAgent` 重建 agent 对象——挂载点必须在 panel 侧（跨 turn 存活），经 `runOpts` 传入。

## 2. 现行机制（时序）

机制总纲：**`onComplete` 先行 → 蒸馏异步在途（挂 `distillState`）→ 下一轮开头 await → 落位后 `onDistilled` 保存回调**。

### 2.1 轮末：`onComplete` 先行 + 发射蒸馏（FR1）

`src/agent.mjs` 轮末（仅顶层 `depth === 0` 触发）先发 `onComplete` 释放 UI，再把蒸馏 promise 化挂起、**不 await**，立即返回回合内容：

```js
if (depth === 0) {
  callbacks.onComplete?.(response.content, agentState(agent))   // UI 立即释放
  // depth===0 守卫（评审 #2）：子轮（depth>0）不得创建——否则先创建的蒸馏晚 resolve
  // 会 clobber 历史（N1 竞态）。distillSignal 与运行 signal 分离（评审 #1）。
  const distill = fireEndOfRunDistill(agent, history, provider, opts.distillSignal ?? signal, callbacks)
  if (opts.distillState) opts.distillState.pending = distill   // 调用方挂 pending
}
return response.content
```

蒸馏发射函数 `fireEndOfRunDistill`（`src/agent/run-stages.mjs`——2026-09-05 实践轮自 runAgent 提取，verbatim + 签名化）。替换逻辑与原 `if (shrunk)` 块逐字一致，**原地改保持 history 引用**（panel 持有的同一数组，后续保存天然拿到压缩版）：

```js
export function fireEndOfRunDistill(agent, history, provider, signal, callbacks) {
  return summarizeRunExplorations(history, agent._runStartHistoryLen ?? 0, provider, signal)
    .then((shrunk) => {
      if (shrunk) {
        history.length = 0
        history.push(...shrunk)
        agent._lastPromptTokens = null
        agent._usageAtLen = null      // 机器行形状变了——token 基线失效，下次压缩重估
        callbacks.onDistilled?.()     // 压缩已落位 → 调用方应持久化（评审 #5）
      }
      return shrunk
    })
    .catch(() => null)                // 失败静默双保险：防 unhandled rejection
}
```

`summarizeRunExplorations` 本体在 `src/explore-distill.mjs`（`src/compact.mjs:374` re-export 向后兼容）。

### 2.2 下一轮开头 await（N1 / FR2）

`runAgent` 开头、`setupAgentRun`（push 本轮输入）**之前** await 上一轮蒸馏——压缩后的机器行是本轮的起点，先落定再 push，否则新输入被压缩替换清掉：

```js
const prev = opts.distillState?.pending
if (prev) {
  opts.distillState.pending = null
  await prev
}
```

`runPanelChat` 级还有一处同因 await（`src/extension/panel-chat.mjs`）：panel 每轮从磁盘**重建** history 数组——若只在 runAgent 内 await，会缩掉的是上一轮那根**已脱离**的数组、本轮仍从陈旧未压缩行开始（AC6a 竞态）。故 panel 在加载本轮 lines 前先 null 掉 pending 并 await；agent 侧 await 对直接调用方仍生效，两层互不冲突。

await 完成后数组已被原地替换为压缩版，`setupAgentRun` 再 push → 顺序正确。resume 场景（ContinueError 后 continue）重建 runOpts 时 pending 已清，幂等。

### 2.3 保存回调（P2 / FR3）

`src/extension/panel-callbacks.mjs` 的 `buildPanelCallbacks` 提供 `onDistilled`——蒸馏 resolve 且 shrunk 非空时由 `fireEndOfRunDistill` 调用：

```js
onDistilled: () => {
  // 蒸馏完成、history 已压缩——再保存一次（onComplete 保存的是未压缩版）。
  // slot 校验：用户已切换会话时，旧 turn 的压缩不写进新 session（AC6）。
  if (panel._slot !== distillSlot) return
  try { panel._saveLines(fullHistory, history, { activeProvider: providerName, ...lastAgentState }, distillSlot) }
  catch (e) { console.error("[chat-panel] distill save failed:", e.message) }   // N3 静默
},
```

- `distillSlot`：`runPanelChat` 开头、任何 await 之前捕获的 `panel._slot` 快照（`turnSlot`；经 `ensureSlot` 而非裸读——首次 turn 可先于 status() 解析，裸读会把 null 冻进 distillSlot、使槽守卫恒拒绝——AC5 回归，2026-08-28 交付评审 🔴#1）。
- `lastAgentState`：`onComplete` 时捕获，供异步的 onDistilled 保存复用（agent 已返回，工程字段随闭包携带）。

### 2.4 distillSignal 中止（N3）

`src/extension/panel-chat.mjs`：

- `panel._distillState ??= { pending: null }`——蒸馏挂载点，跨 turn 存活。
- `panel._distillController`——**每个 panel 生命周期一个 AbortController，不复用/不随轮次重置**：快速连发第二条消息必须不取消上一条在途蒸馏（AC6a）；仅当已被 abort 时惰性重建。`runOpts` 传 `distillState: panel._distillState` + `distillSignal: panel._distillController?.signal`。

abort 点（运行 signal 之外的独立中止）：

- `src/extension/chat-panel.mjs`——panel dispose / 视图销毁：`panel._distillController?.abort()`（在途蒸馏属于将死视图）。
- `src/extension/panel-session.mjs`——会话切换（newSession/deleteSession/loadSession）：`panel._distillController?.abort()`。

运行 signal（`_abortController`）只用于 abort 运行中的轮次，**不再传导到蒸馏**——用户 Stop 不影响蒸馏。

### 2.5 失败路径（FR4）

- 蒸馏失败 → `summarizeRunExplorations` 返回 null → `fireEndOfRunDistill` then 中 shrunk 为 null 不替换 → **不调 onDistilled**（无变化无需保存）→ 下一轮 await 立即通过。行为与现状一致。
- 用户 Stop → **运行** signal aborted → 蒸馏（distillSignal 不受影响）继续完成，onDistilled 正常触发（评审 #1 语义）。
- panel dispose / 会话切换 → **distillSignal** aborted → distill promise reject 被 `.catch(() => null)` 吞掉 → 不替换、不保存。
- `.catch(() => null)` 双保险防 unhandled rejection。

## 3. 实现落点（核销参考）

- `src/agent.mjs`：轮末 `depth===0`（onComplete 先行 + `fireEndOfRunDistill` 发射 + `distillState` 挂 pending）；`runAgent` 开头 await 上一轮蒸馏。
- `src/agent/run-stages.mjs`：`fireEndOfRunDistill`（发射/落位回写/onDistilled/失败静默）。
- `src/explore-distill.mjs`：`summarizeRunExplorations`（蒸馏本体）；`src/compact.mjs` re-export。
- `src/extension/panel-chat.mjs`：`panel._distillState` 初始化；`panel._distillController` 惰性创建；distillSlot 快照；runOpts 传 distillState + distillSignal；runPanelChat 级 await 上一轮蒸馏。
- `src/extension/chat-panel.mjs`：panel dispose / 视图销毁 abort distillSignal。
- `src/extension/panel-session.mjs`：会话切换 abort distillSignal。
- `src/extension/panel-callbacks.mjs`：`onDistilled`（slot 校验 + `_saveLines` 静默）。

## 4. 验收标准（核销参考）

- AC1 `onComplete` 在蒸馏完成**之前**触发：mock 慢蒸馏（如 5s），断言 onComplete <1s 触发，send 按钮信号不等待。
- AC2 下一轮开头 await 蒸馏：蒸馏未完成时快速发第二轮，断言第二轮 history 起点是压缩后的机器行（摘要 note 在用户输入之前）。
- AC3 蒸馏完成后 `onDistilled` 触发且**仅在实际替换历史时**（失败 / null 不触发）。
- AC4 蒸馏失败静默：返回 null，历史保持原样，onComplete 正常触发。
- AC5 磁盘会话最终为压缩版：onDistilled 后 `_saveLines` 被调，contextHistory 含摘要 note。
- AC6 slot 切换不串写：蒸馏完成时 panel 已切换 session，不保存。
- AC6a 快速连发不 abort 蒸馏：第二条消息（真实 `_chat()` 路径）不中断蒸馏，第二轮从压缩版开始（评审 #1）。
- AC6b 子轮（depth>0）不触发蒸馏（评审 #2）：depth=1 轮末断言 `distillState.pending` 保持 null。
- AC7 `npm test` 全套通过。
- AC8 `src/` 无阻塞 `await summarizeRunExplorations` 残留（grep 验证）。

## 变更记录

- 2026-08-25：立项并实施（评审 #1 专用 distillSignal + chat-panel 连发用例；评审 #2 depth 守卫）。marketplace / Open VSX 0.1.49。
- 2026-09-05：蒸馏发射提为 `fireEndOfRunDistill` 模块函数（run-stages.mjs，verbatim + 签名化）；蒸馏本体随模块拆分迁 `src/explore-distill.mjs`。
- 2026-09-08：文档重写为人类可读当前态（批 V3b）——时序与决策值不变，正文模块落点更新至现行拆分结构。
