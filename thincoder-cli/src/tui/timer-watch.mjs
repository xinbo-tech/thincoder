/**
 * timer-watch.mjs — timer 空闲唤醒闩（载体②：CLI 空闲面一次性 deadline 闩）。
 *
 * 机制单源 = `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.30（§6.30.2 载体定形 D-TW1 / §6.30.3
 * 门三件 / §6.30.5 跨形态行为表）；显示形态 = `docs/cli/design/TUI.md` §7.6。
 *
 * 形态：**一次性 deadline 闩**——到点自撤 · `unref()` · 单槽武装（重复武装 = 撤旧立新）；
 * **非** interval 轮询、**非**第二执行引擎（开轮一律经既有回合驱动器 `runAgentTurn`）。形态先例 =
 * `thincoder-cli/src/heap-watch.mjs:41-48`（`timer` 参数注入缝 + `unref`）+ `:12-13`（开关默认开 + 显式关键）。
 *
 * 门（§6.30.3）：① 唤醒源 = `_pendingTimers`（唯一写点 = timer 工具）——本档只读到期件，**不看 history**，
 * 零通用「注入即唤醒」通道；② 成本闸 = 到期批合并一轮 + 出列幂等（`takeExpiredTimers`）——本档不新增预算件；
 * ③ 开关 `agent.timerWake`（默认开；关 ⇒ `sync()` 零注册）。
 *
 * 注入缝（可测性，零真实等待）：`timer` / `clear` / `now`——测试以假实现直驱 `sync()` 与
 * `fireTimerWake`（先例 `thincoder-cli/test/heap-watch.test.mjs`）。
 */
import { pendingTimerDeadline, takeExpiredTimers, injectTimerReminders } from "@thincoder/core/agent/timers.mjs"
import { C } from "./ansi.mjs"
import { REMINDER_CAP } from "./tool-display.mjs"

/** 开关判据（§6.30.3 门三件③ D-TW5）：默认开——只有显式 `false` 才关（键 `agent.timerWake`；
 *  与 `diagnostics.heapWatch` 同口径：`!== false`）。 */
export function timerWakeEnabled(agent) {
  return agent?.config?.agent?.timerWake !== false
}

/** 「唤醒会武装」判据（`docs/cli/design/TUI.md` §7.1 awaiting 行除外 / §7.2 置位谓词）：主 agent 在途 timer
 *  非空 ∧ 开关开 ⇒ 自动续跑在途（不计 attention / 闩会在回合链尾武装）。 */
export function timerWakeArmed(agent) {
  return timerWakeEnabled(agent) && (agent?._pendingTimers?.length ?? 0) > 0
}

/** 触发落流形态（TUI.md §7.6）：逐字 = 系统提醒原文；三行 + 省略号上限同既有提醒镜像口径
 *  （`tool-events.mjs:434-441`，`REMINDER_CAP` 单源）。 */
export function reminderDisplay(text) {
  const lines = String(text).split("\n")
  return lines.length > REMINDER_CAP ? lines.slice(0, REMINDER_CAP).join("\n") + "\n…" : text
}

/** 到期批送达（两路共用：空闲闩 fire ∥ 挂起窗第三兑现态）：出列（幂等）→ 注入历史 → 触发落流逐条。
 *  返回送达条数（0 = 无到期项——零注入零行）。`pushLine` 自带渲染（conversation-writer）。 */
export function deliverExpiredTimers(ctx, now = Date.now()) {
  const { agent, pushLine } = ctx
  const lines = injectTimerReminders(agent, takeExpiredTimers(agent, now))
  for (const line of lines) pushLine(reminderDisplay(line), C.warn)
  return lines.length
}

/**
 * 一次性 deadline 闩（单槽）。`sync()` = 按当前在途最近到期时点（重）武装：无在途 / 开关关 ⇒ 撤旧零注册。
 * @param {object} p.agent 主 agent（读 `_pendingTimers` + 开关）
 * @param {Function} p.onFire 到点回调（生产 = `fireTimerWake`；测试 = 假实现）
 * @param {Function} [p.timer] 注入缝——默认 `setTimeout`
 * @param {Function} [p.clear] 注入缝——默认 `clearTimeout`
 * @param {Function} [p.now] 注入缝——默认 `Date.now`
 * @returns {{ sync: Function, disarm: Function }}
 */
export function createTimerWatch({ agent, onFire, timer = setTimeout, clear = clearTimeout, now = Date.now } = {}) {
  let handle = null
  const disarm = () => {
    const h = handle
    handle = null
    if (h !== null) { try { clear(h) } catch { /* 已触发 / 不可清——尽力面（同 heap-watch） */ } }
  }
  const sync = () => {
    const deadline = timerWakeEnabled(agent) ? pendingTimerDeadline(agent) : null
    if (deadline == null) { disarm(); return null } // 无在途 / 开关关——撤旧，零注册
    disarm() // 单槽：重复武装 = 撤旧立新（延迟按最近到期重算）
    const delay = Math.max(0, deadline - now())
    handle = timer(() => { handle = null; onFire?.() }, delay)
    try { handle?.unref?.() } catch { /* unref 失败不阻断（一次性命令自然退出） */ }
    return delay
  }
  return { sync, disarm }
}

/**
 * 空闲闩触发（§6.30.3 开轮两处①）：**非空闲零动作**——回合在飞 / 挂起窗由各自既有路径接管
 * （在飞回合 post-turn 轮询；挂起窗第三兑现态），在途表零触碰（链尾重同步再武装）。
 * 空闲 ⇒ 到期批送达 + 开 timer 轮（顶层链：`skipSession` 缺省——队列续发 / 挂起入口 / attention 照常）。
 * @returns {Promise<boolean>} 是否开轮
 */
export async function fireTimerWake(ctx, { runTurn, now = Date.now } = {}) {
  const { agent, state } = ctx
  if (state.processing || state.suspended || state._suspPending) return false
  if (deliverExpiredTimers(ctx, now()) === 0) return false
  await (runTurn ?? ctx.runTurn)("", { autoTurn: true, timerTurn: true })
  return true
}
