# 探索蒸馏异步化 — 设计（CLI）

> 状态：待评审（2026-08-25）
> 需求：`docs/design/SEND-STALL-DISTILL-REQUIREMENTS.md`
> 关联：`docs/design/README.md`（文档地图）、`docs/design/CONTEXT-COMPACTION.md`（机制背景，不改动）

## 1. 问题陈述（Problem Statement）

| # | 现状 | 位置 | 后果 |
|---|---|---|---|
| P1 | 轮末蒸馏在回合结束**之前**同步阻塞：`await summarizeRunExplorations(agent, callbacks, signal)` 位于 `handleCompletion` 后、`return cr.content` 前 | `src/agent.mjs:314` | TUI `agent-turn.mjs:381` `await runAgent(...)` 直到蒸馏完成才返回 → `state.processing` 多转 10+ 秒（静默第二次 LLM 调用，无任何 UI 反馈） |
| P2 | 蒸馏完成后替换 `agent.history`（引用替换）但**不触发保存**——现状由 TUI 在 runAgent 返回后统一保存 | `src/context.mjs:430-436`（`agent.history = next`） | 异步化后必须补保存回调，否则磁盘停在上轮未压缩版，摘要丢失 |

## 2. 解决方案（Solution Approach）

### 2.1 时序重构（P1）

`src/agent.mjs` 轮末（`:314` 附近）：

```js
// 现状（阻塞）：
if (depth === 0) { try { await summarizeRunExplorations(agent, callbacks, signal) } catch { /* silent (N3) */ } }
return cr.content

// 改为（异步 + 结束信号先行；depth 守卫保留——仅顶层轮末触发，评审 #2）：
if (depth === 0) {
  const distill = summarizeRunExplorations(agent, callbacks, signal).catch(() => {})
  agent._pendingDistill = distill
}
return cr.content
```

- `summarizeRunExplorations`（context.mjs）内部不变——仍是 `await distillExplorations(...)` + `agent.history = next`；promise 化后由调用方决定等待时机。
- `.catch(() => {})`：防止未处理 rejection（distillExplorations 内部已 catch 返回 null，双保险）。

### 2.2 下一轮开头 await（N1 竞态安全，FR2）

`src/agent.mjs` `runAgent` 开头（`prepareRun` **之前**）：

```js
// 上一轮异步蒸馏必须先落定：压缩后的机器行是本轮的起点（N1：await 必须在
// prepareRun push 用户输入之前，否则新输入会被压缩替换清掉）。
if (agent._pendingDistill) {
  const p = agent._pendingDistill
  agent._pendingDistill = null
  await p
}
```

- agent 对象跨轮存活（`src/cli/make-agent.mjs` 一次创建复用，已验证），promise 挂 `agent._pendingDistill` 天然跨轮。
- await 完成后 `agent.history` 已替换为压缩版，`prepareRun` 再 push 本轮输入 → 顺序正确。

### 2.3 保存回调（P2，FR3）

`summarizeRunExplorations` 完成且实际替换历史后，调用 `callbacks.onDistilled?.()`：

```js
export async function summarizeRunExplorations(agent, callbacks, signal) {
  const next = await distillExplorations(agent.history, agent._runStartHistoryLen ?? 0, agent.provider, signal)
  if (!next) return
  agent.history = next
  agent._lastPromptTokens = null
  agent._usageAtLen = null
  callbacks.onDistilled?.() // 新增：压缩已落位，调用方应持久化
}
```

TUI 侧 `src/tui/agent-turn.mjs` 的 callbacks 增加 `onDistilled` → 复用现有保存逻辑（`saveSessionImpl(agent, state.lines)`），带 try/catch 静默。

### 2.5 退出前 flush 蒸馏（评审 #3，FR3 补强）

进程退出（TUI 关闭/Ctrl+C 二次确认退出）前，await `agent._pendingDistill`（带短超时，如 5s）再执行最终保存。实现注（评审 #3，2026-08-25）：flush 位于 `runAgentTurn` 的 finally，**每轮**最终保存前都会执行（退出场景自然覆盖）——UI 已先行恢复（render 在 flush 之前），每轮最多多等 5s；flush **不摘除** `_pendingDistill`（在途蒸馏留给下一轮 runAgent 开头 await，N1）——否则用户在蒸馏窗口内退出会丢摘要（现状 runAgent 返回前已保存压缩版，异步化后此保证需显式补回）：

```js
// TUI 退出路径（runAgentTurn finally / 应用关闭钩子）：
if (agent._pendingDistill) {
  const p = agent._pendingDistill
  agent._pendingDistill = null
  await Promise.race([p, new Promise((r) => setTimeout(r, 5000))]) // 5s 上限，不拖慢退出
}
try { saveSessionImpl(agent, state.lines) } catch { /* 静默 */ }
```

### 2.4 失败路径（FR4/N3）

- 蒸馏失败 → `distillExplorations` 返回 null → `summarizeRunExplorations` 直接 return（不调 onDistilled，历史保持原样）→ 下一轮 await 立即通过。行为与现状一致。
- 用户 Stop → signal aborted → chat() 抛错被 catch → null。行为与现状一致。

## 3. 受影响文件（Affected Files）

| 文件 | 动作 | 内容 |
|---|---|---|
| `src/agent.mjs` | MODIFY | 轮末 `:314` 阻塞 await → promise 挂 `agent._pendingDistill`；`runAgent` 开头（prepareRun 前）await 上一轮蒸馏 |
| `src/context.mjs` | MODIFY | `summarizeRunExplorations`（`:430-436`）替换历史后调 `callbacks.onDistilled?.()`；注释更新 |
| `src/tui/agent-turn.mjs` | MODIFY | callbacks 增加 `onDistilled` → `saveSessionImpl`（静默）；现有 `onTurnEnd` 的 5 轮增量保存逻辑不动 |
| `test/agent.test.mjs` | MODIFY | 新增：①蒸馏失败不阻塞返回（mock 失败，断言 runAgent 快速返回）；②下一轮 await 蒸馏（mock 慢蒸馏，断言第二轮 history 开头是压缩版）；③onDistilled 触发（mock 回调断言被调用） |
| `test/context.test.mjs`（如存在） | MODIFY | 蒸馏替换历史 + onDistilled 回调断言（先 grep 确认测试文件名） |
| 退出 flush 用例 | MODIFY | TUI 退出路径 await pendingDistill 后保存（mock 慢蒸馏 + 短超时，断言保存发生且含摘要） |

## 4. 验收标准（Acceptance Criteria）

| # | AC | 验证方式 |
|---|---|---|
| AC1 | 轮末 runAgent 返回**不等待**蒸馏：mock 慢蒸馏（如 5s），断言 runAgent 在 <1s 返回 | 单元测试 + 计时断言 |
| AC2 | 下一轮开头 await 蒸馏：蒸馏未完成时发第二轮，断言第二轮 history 起点是压缩后的机器行（摘要 note 在用户输入之前） | 单元测试 |
| AC3 | 蒸馏完成后触发 `onDistilled`，且仅在**实际替换**历史时（失败/null 不触发） | 单元测试 |
| AC4 | 蒸馏失败静默：返回 null，历史保持原样，runAgent 正常返回 | 单元测试 |
| AC5 | 磁盘会话最终为压缩版：onDistilled 保存后，session 文件的 contextHistory 含摘要 note | 单元测试（mock session 保存） |
| AC6 | `node --test test/*.test.mjs` 全套通过 | 命令 |
| AC7 | 无 `await summarizeRunExplorations` 残留（轮末阻塞点） | grep 验证 |
| AC8 | 退出前 flush：蒸馏未完成时退出，等待（≤5s）后保存压缩版（评审 #3） | 单元测试 |
