# 探索蒸馏异步化 — 设计（CLI）

> 状态：**已实现**（2026-08-25 实施；npm 0.12.43）——当前生效的现行机制描述。
> 需求：`SEND-STALL-DISTILL-REQUIREMENTS.md`
> 关联：`CONTEXT-COMPACTION.md`（蒸馏机制本体，不改动）、`docs/README.md`（总地图）。

## 1. 问题陈述

- **P1 · 轮末同步阻塞**：蒸馏在回合结束信号**之前**同步 `await summarizeRunExplorations(...)`（位于 `handleCompletion` 之后、`return cr.content` 之前）。TUI `await runAgent(...)` 直到蒸馏完成才返回 → `state.processing` 多转 10+ 秒（一次静默的第二次 LLM 调用，无任何 UI 反馈）。
- **P2 · 替换后不触发保存**：蒸馏完成用引用替换 `agent.history = next` 但**不触发保存**——现状由 TUI 在 runAgent 返回后统一保存。异步化后蒸馏跑到回合外，必须补保存回调，否则磁盘停在上轮未压缩版、摘要丢失。

## 2. 现行机制（时序）

机制总纲：**结束信号先行 → 蒸馏异步在途 → 下一轮开头/退出时 await → 替换后保存回调**。agent 对象跨轮存活（`src/cli/make-agent.mjs` 一次创建复用），promise 挂 `agent._pendingDistill` 天然跨轮。

### 2.1 轮末：结束信号先行（FR1）

轮末（仅顶层 `depth === 0` 触发——depth 守卫保留）把蒸馏 promise 化挂起，**立即返回回合内容**，UI 不再等蒸馏：

```js
// src/agent.mjs 轮末（handleCompletion 之后、return cr.content 之前）
if (depth === 0) {
  const distill = summarizeRunExplorations(agent, callbacks, signal, depth).catch(() => {})
  agent._pendingDistill = distill
}
return cr.content
```

- `.catch(() => {})` 防未处理 rejection（蒸馏内部已 catch 返回 null，双保险）。
- `agent._pendingDistill` 由 runAgent 轮末写入，起点在 agent 对象初始化处（`_pendingDistill: null`）。

### 2.2 下一轮开头 await（N1 / FR2）

`runAgent` 开头、`prepareRun`（push 用户输入）**之前** await 上一轮蒸馏——压缩后的机器行是本轮的起点，先落定再 push，否则新输入被压缩替换清掉：

```js
if (agent._pendingDistill) {
  const p = agent._pendingDistill
  agent._pendingDistill = null
  await p
}
```

await 完成后 `agent.history` 已替换为压缩版，`prepareRun` 再 push 本轮输入 → 顺序正确。

### 2.3 保存回调（P2 / FR3）

`summarizeRunExplorations`（现行位于 `src/explore-distill.mjs`——2026-09-05 模块拆分自 `context.mjs` 迁出）替换历史后，**仅在实际替换成功时**调 `onDistilled`：

```js
export async function summarizeRunExplorations(agent, callbacks, signal, depth = 0) {
  const next = await distillExplorations(agent.history, agent._runStartHistoryLen ?? 0, agent.provider, signal, agent, depth)
  if (!next) return                       // 失败/no-op：历史保持原样，不触发回调
  agent.history = next
  agent._lastPromptTokens = null
  agent._usageAtLen = null                // 机器行形状变了——token 基线失效，下次压缩重估
  callbacks.onDistilled?.()               // 压缩已落位，调用方应持久化
}
```

TUI 侧 callbacks（`src/tui/tool-events.mjs` 的 `buildToolCallbacks`）提供 `onDistilled` → 复用现有保存逻辑 `saveSessionImpl`，带 try/catch 静默（agent-turn.mjs 只把该 callbacks 传入 runAgent）。

### 2.4 退出前 flush 蒸馏（FR3 补强）

进程退出（TUI 关闭 / Ctrl+C 二次确认退出）前，给在途蒸馏一个**有界等待窗口**（窗口值 = `ctx.distillFlushTimeoutMs ?? DISTILL_FLUSH_TIMEOUT_MS`，默认 5s）再执行最终保存：

```js
// src/tui/agent-turn.mjs 每轮 runAgentTurn 的 finally——render 已先行，退出场景自然覆盖
if (agent._pendingDistill) {
  await Promise.race([
    agent._pendingDistill,
    new Promise((r) => setTimeout(r, ctx.distillFlushTimeoutMs ?? DISTILL_FLUSH_TIMEOUT_MS)), // 5000
  ])
}
try { saveSessionImpl(agent, state.lines) } catch { /* 静默 */ }
```

关键点：flush **不摘除** `_pendingDistill`——蒸馏窗口内新一轮提交/退出，下一轮 `runAgent` 开头的 await 仍能看到在途蒸馏并先 await（N1）；否则用户在蒸馏窗口内退出会丢摘要。

### 2.5 失败路径（FR4 / N3）

- 蒸馏失败 → `distillExplorations` 返回 null → `summarizeRunExplorations` 直接 return（不调 onDistilled，历史保持原样）→ 下一轮 await 立即通过。行为与现状一致。
- 用户 Stop → signal aborted → chat() 抛错被 catch → null。Stop 只中断回合本身，不再声称可中断已在途的异步蒸馏。

## 3. 实现落点（核销参考）

- `src/agent.mjs`：轮末挂 `agent._pendingDistill`（`summarizeRunExplorations` 异步化）；`runAgent` 开头 prepareRun 前 await 上一轮蒸馏。
- `src/explore-distill.mjs`：`summarizeRunExplorations` 替换历史后调 `callbacks.onDistilled?.()`。
- `src/tui/agent-turn.mjs`：callbacks 增加 `onDistilled` → 保存（静默）；退出 flush（≤5s 上限）。
- `src/tui/tool-events.mjs`：callbacks（`buildToolCallbacks`）提供 `onDistilled` → `saveSessionImpl` 保存（静默）。
- `src/tui/agent-turn.mjs`：把 callbacks 传入 runAgent；每轮退出 flush（≤5s 上限）后保存。
- 验收：轮末 runAgent 不等待蒸馏（<1s 返回）；下一轮开头蒸馏已落定（第二轮 history 起点是摘要 note）；onDistilled 仅在实际替换时触发；失败静默返回；退出 flush 有界等待后保存压缩版。全套测试通过。

## 变更记录

- 2026-08-25：立项并实施（评审 #2 N3；#3 退出 flush）。npm 0.12.43。
- 2026-09-05：`summarizeRunExplorations` 随模块拆分迁至 `src/explore-distill.mjs`（正文 §2.3 已更新落点）。
- 2026-09-07：文档重写为人类可读当前态（批 A）——时序与决策值不变。
