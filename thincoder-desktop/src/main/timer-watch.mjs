/**
 * timer-watch.mjs — 桌面 timer 空闲唤醒闩 + 到期触发面（**消费核件**三件 —— 机制单源 =
 * `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.30.11 桌面块；核件 opt-in 契约 = 同档 §6.30.10 ／ 门三件 = §6.30.3）。
 *
 * 职责两面：① **空闲 deadline 闩**（一次性——到点自撤 · `unref()` · **键面 = 会话键**：键 ⇒ 闩；同键至多一闩、
 * 跨键独立；`timer` / `clear` / `now` 注入缝 ⇒ 用例零真实等待）② **到期触发面 `fireTimerWake`**（CLI 对位：
 * 非空闲零动作；空闲 ⇒ 交付（核三件 + `ev:timer` 落流）+ 开 timer 轮）。形 = CLI `thincoder-cli/src/tui/timer-watch.mjs`
 * （端面独立实现 · 机制同源——桌面多会话 ⇒ 闩表按会话键分槽；本档**非**第二执行引擎，开轮一律经宿主注入面）。
 *
 * 门（§6.30.3）：① 唤醒源 = 核 `_pendingTimers`（唯一写点 = timer 工具）——本档只读到期件、**不看 history**，
 * 零通用「注入即唤醒」通道；② 成本闸 = 到期批合并一轮 + 出列幂等（核 `takeExpiredTimers`）——本档不新增预算件；
 * ③ 开关 `agent.timerWake`（默认开；关 ⇒ `sync()` 零注册并撤旧 —— 端面活读）。
 *
 * 零宿主依赖（`post` / `runTurn` / `timer` 皆注入）⇒ 平 node 直测。
 */
import { injectTimerReminders, pendingTimerDeadline, takeExpiredTimers } from "@thincoder/core/agent/timers.mjs"

/** 开关判据（§6.30.3 门三件③ D-TW5）：默认开——只有显式 `false` 才关（键 `agent.timerWake`；与 CLI 同口径
 *  `!== false`）。关 ⇒ 闩零注册、窗内 `deadline()` 恒 `null` ⇒ 回仅回合边界投递（既有语义）。 */
export function timerWakeEnabled(agent) {
  return agent?.config?.agent?.timerWake !== false
}

/** 到期批交付（**两路共用**：空闲闩 fire ∥ 挂起窗 `timerFace.deliver`）：出列（幂等——绝不重复投递）→
 *  历史注入（核三件第三件）→ `ev:timer` 逐条落流。返回交付条数（0 = 无到期项——零注入零行）。
 *  `text` = 交付原文（`[System reminder: ⏰ timer — …]` 逐字）；显示裁 = 渲染面（≤3 行 + `…` —— §6.30.11）。
 *  `now` = 注入缝（默认 `Date.now`）。 */
export function deliverExpiredTimers(agent, key, { post, now = Date.now } = {}) {
  const lines = injectTimerReminders(agent, takeExpiredTimers(agent, now()))
  for (const line of lines) post("ev:timer", { key, text: line })
  return lines.length
}

/**
 * 一次性 deadline 闩（**键面** —— 同键至多一闩；跨键独立）。`sync(key, agent)` = 按该键在途最近到期时点
 * （重）武装：无在途 / 开关关 ⇒ **撤旧 · 零注册**；延迟 = 最近到期差（负 ⇒ 夹 0）。
 * `disarm(key)` / `disarmAll()` = 撤闩清点（会话清除面 ∥ 切项目级联）。
 * @param {object} p
 * @param {Function} [p.onFire] 到点回调（生产 = 宿主空闲火面；测试 = 假实现）——收 `(key, agent)`
 * @param {Function} [p.timer] 注入缝——默认 `setTimeout`
 * @param {Function} [p.clear] 注入缝——默认 `clearTimeout`
 * @param {Function} [p.now] 注入缝——默认 `Date.now`
 * @returns {{ sync: Function, disarm: Function, disarmAll: Function, size: Function }}
 */
export function createTimerWatch({ onFire = null, timer = setTimeout, clear = clearTimeout, now = Date.now } = {}) {
  /** 闩表：会话键 → 句柄（**同键至多一闩**——重武装 = 撤旧立新）。 */
  const handles = new Map()
  const disarm = (key) => {
    const handle = handles.get(key)
    if (handle === undefined) return false
    handles.delete(key)
    try { clear(handle) } catch { /* 已触发 / 不可清——尽力面（同 CLI 同构） */ }
    return true
  }
  const disarmAll = () => { for (const key of [...handles.keys()]) disarm(key) }
  const sync = (key, agent) => {
    const deadline = timerWakeEnabled(agent) ? pendingTimerDeadline(agent) : null
    if (deadline == null) { disarm(key); return null } // 无在途 / 开关关——撤旧，零注册
    disarm(key) // 单槽（同键）：重复武装 = 撤旧立新（延迟按最近到期重算）
    const delay = Math.max(0, deadline - now())
    const handle = timer(() => { handles.delete(key); void onFire?.(key, agent) }, delay)
    handles.set(key, handle)
    try { handle?.unref?.() } catch { /* unref 失败不阻断（一次性闩——同 CLI） */ }
    return delay
  }
  return { sync, disarm, disarmAll, size: () => handles.size }
}

/** 空闲闩触发（§6.30.3 开轮两处①）：**非空闲零动作**——在飞回合（`busy`）∥ 挂起窗（`inWindow`）由既有路径接管
 *  （在飞回合 = post-turn 轮询；窗内 = 核件 `timerFace` 兑现），**在途表零触碰**（链尾重同步再武装）。
 *  空闲 ⇒ 到期批交付（核三件 + `ev:timer` 落流）+ 开 timer 轮（`{ autoTurn: true, timerTurn: true }`）；轮后链尾接管
 *  （池活 ⇒ 入窗消化 ∥ 池空 ⇒ 闩重武装）由调用面（挂起驱动档）承担 —— 与 `send` 径同判（本档只开轮，不接管）。
 *  @returns {Promise<boolean>} 是否开轮（未交付 ⇒ false——调用面据以决定是否重武装） */
export async function fireTimerWake(key, { agent, post, runTurn, busy = false, inWindow = false, now = Date.now } = {}) {
  if (busy || inWindow) return false
  if (deliverExpiredTimers(agent, key, { post, now }) === 0) return false
  await runTurn(key, agent, "", { autoTurn: true, timerTurn: true })
  return true
}
