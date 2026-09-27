/**
 * agent/timers.mjs — timer 到期件（载体①：在途 timer 的单一权威读面）。
 *
 * 机制单源 = `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.30.2（载体定形 D-TW1）：
 * 读面三件纯函数住本档——最近到期时点 / 到期出列（幂等）/ 历史注入单点。消费面三处共用
 * 同一读点（零第二份过滤语义）：① 回合边界轮询（`agent/post-turn.mjs`——行为零变）；
 * ② CLI 空闲闩 deadline；③ 挂起窗 deadline；显示面（状态行标记 / `/timers`）同读源。
 *
 * 载体仍在 agent 字段 `_pendingTimers`（条目形 `{ id, expiresAt, message }`）——**唯一写点** =
 * timer 工具 `thincoder-core/agent-tools/timer.mjs`；跨 run 存活 = 规范语义（D-TW3，无 per-run 复位）。
 * 本档零调度器（无 setTimeout / 无事件 / 无唤醒句柄）——到点自唤醒的端面闩归 CLI（§6.30.2 载体②）。
 */

/** 在途条数帽（§6.30.3 门三件②成本闸）：超限 ⇒ timer 工具**显式拒**（不静默丢 / 不静默清；
 *  形态先例 = 队满「拒 + 提示 + 保留」）。与 CLI 排队容量 `QUEUED_MAX_ITEMS`（8）同值同形。 */
export const TIMER_MAX_PENDING = 8

/** 最近到期时点（毫秒）或 `null`（空在途）——端闩 / 挂起窗 deadline / 显示面共用同源（每帧活读）。 */
export function pendingTimerDeadline(agent) {
  const timers = agent?._pendingTimers ?? []
  let min = null
  for (const t of timers) {
    const at = t?.expiresAt
    if (typeof at !== "number" || !Number.isFinite(at)) continue
    if (min === null || at < min) min = at
  }
  return min
}

/** 到期出列（**幂等**）：取走 `expiresAt <= now` 的条目并返回（在途表内移除）——二次调用零返
 *  （§6.30.3 成本闸②「到期即消费」——绝不重复投递）。未到期项原序保留。 */
export function takeExpiredTimers(agent, now = Date.now()) {
  const timers = agent?._pendingTimers ?? []
  const expired = timers.filter((t) => t.expiresAt <= now)
  if (expired.length === 0) return []
  agent._pendingTimers = timers.filter((t) => t.expiresAt > now)
  return expired
}

/** 历史注入单点（逐字形态 = 既有注入单源）：逐条 `[System reminder: ⏰ timer — <message>]` 落历史，
 *  返回注入的原文（显示面复用同一串——零第二份字面）。 */
export function injectTimerReminders(agent, entries) {
  const lines = []
  for (const t of entries ?? []) {
    const line = `[System reminder: ⏰ timer — ${t.message}]`
    agent.history.push({ role: "user", content: line })
    lines.push(line)
  }
  return lines
}
