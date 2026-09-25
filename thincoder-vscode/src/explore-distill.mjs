/**
 * explore-distill.mjs — 端壳/适配器（W15 · `docs/batches/2026-09-15-vsc-core-wiring.md` §2 W15）：
 * 轮末探索蒸馏的**机制本体 = 核单源** `@thincoder/core/explore-distill.mjs`
 * （`summarizeRunExplorations`——CONTEXT-COMPACTION §5）；本档只保留
 * **调用期适配**（F7「循环契约位移」——核 re-export 签名异，W6 段已登记）：
 *
 *   核形：`summarizeRunExplorations(agent, callbacks, signal, depth, extras)` —— agent 载体
 *         （读 `agent.history` / `agent._runStartHistoryLen` / `agent.provider`；
 *         收缩落位 = `agent.history = next` **新数组替换**；内部置基线失效 +
 *         `callbacks.onDistilled?.()`）。
 *   端形：`summarizeRunExplorations(history, runStartLen, provider, signal, agent, extras = null)` —— 调用方
 *         **持历史数组引用**（面板/槽持久化持同一数组——数组替换会让面板引用失效）。
 *         `extras` = 会话续写前缀面（`{ systemPrompt, tools }`——发射点透传、与回合请求同源 · 核 §6.15）；
 *         端形追加在第 6 位（核形第 5 位；`agent` 仍居第 5——旧实参序不变）；缺省 ⇒ 核退化面 1（无 system / 无 tools）。
 *
 * 适配两式：① 入参换道（把端形入参绑到 agent 载体字段）；② 出参**原位回收**（核 write-replace
 * 的新数组内容回灌共享数组——面板引用不失效；与 `checkAndCompact` 的共享数组回收同款）。
 * 返回 = 收缩后的共享数组（= 入参 history，已原位更新）或 null（无收缩/失败——原历史保留，N3）。
 * onDistilled 仍由调用方（run-stages `fireEndOfRunDistill`）按落地与否单点触发——本适配器
 * 不代传核回调（防双份持久化）。
 */

import { summarizeRunExplorations as summarizeCore } from "@thincoder/core/explore-distill.mjs"

/**
 * End-of-run exploration distillation（端壳适配形——语义同核：机器行原位替换为一条
 * `[Exploration summary]` 注；人读行不触碰；<3 条探索结果或 LLM 失败 → null、原历史保留）。
 */
export async function summarizeRunExplorations(history, runStartLen, provider, signal, agent = null, extras = null) {
  const carrier = agent ?? {}
  const prevProvider = carrier.provider
  const prevHistory = carrier.history
  const prevRunStart = carrier._runStartHistoryLen
  carrier.history = history
  carrier._runStartHistoryLen = runStartLen ?? 0
  carrier.provider = provider
  let shrank = false
  try {
    await summarizeCore(carrier, {}, signal, carrier._depth ?? 0, extras)
    shrank = carrier.history !== history
  } catch {
    return null // N3 兜底（核内已静默处理 LLM 失败——此处防适配面意外抛）
  } finally {
    carrier.provider = prevProvider
    carrier._runStartHistoryLen = prevRunStart
    if (!shrank) carrier.history = prevHistory // 未收缩 → 载体面零残留
  }
  if (!shrank) return null
  // 原位回收（面板持同一数组引用）：核 copy-on-write 新数组 → 共享数组
  const next = carrier.history
  history.length = 0
  history.push(...next)
  carrier.history = history
  return history
}
