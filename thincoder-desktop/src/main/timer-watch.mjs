/**
 * timer-watch.mjs — 桌面 timer 空闲唤醒闩 + 到期触发面（**消费核件** —— 机制单源 =
 * `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.30.11 桌面块；核件契约 = 同档 §6.30.10 ／ 门三件 = §6.30.3）。
 * 2026-09-28 流程批 R4 上提后：闩 ∕ 派发 ∕ 火策略住核 `thincoder-core/agent/timers.mjs`（单源——本档零自持闩实现），
 * 本档只留端面两件（+ 开关判据 re-export）：① **键面表壳**（键 ⇒ 核闩；同键至多一闩、跨键独立——桌面多会话宿主属性）② **`ev:timer` 出词**
 * + `runTurn` 触发面（形 = CLI ∕ VSC 同档——端面表壳 · 机制同源；两端自持副本随其迁移轮退场）。
 * 门（§6.30.3）：① 唤醒源 = 核 `_pendingTimers`（唯一写点 = timer 工具）——只读到期件、**不看 history**；
 * ② 成本闸 = 到期批合并一轮 + 出列幂等（核 `takeExpiredTimers`）；③ 开关 `agent.timerWake`（默认开；关 ⇒ `sync()` 零注册并撤旧）。
 * 零宿主依赖（`post` / `runTurn` / `timer` / `clear` / `now` 皆注入）⇒ 平 node 直测。
 */
import {
  createTimerWatch as coreTimerWatch,
  deliverExpiredTimers as coreDeliverExpiredTimers,
  fireTimerWake as coreFireTimerWake,
} from "@thincoder/core/agent/timers.mjs"

export { timerWakeEnabled } from "@thincoder/core/agent/timers.mjs"

/** 到期批交付（**两路共用**：空闲闩 fire ∥ 挂起窗 `timerFace.deliver`）：核派发（出列幂等 → 注入单点）+ `ev:timer`
 *  逐条落流。返回交付条数（0 = 无到期项——零注入零行）。`text` = 交付原文逐字（`[System reminder: ⏰ timer — …]`）；
 *  显示裁 = 渲染面（≤3 行 + `…`——§6.30.11）。`now` = 注入缝（默认 `Date.now`）。 */
export function deliverExpiredTimers(agent, key, { post, now = Date.now } = {}) {
  return coreDeliverExpiredTimers(agent, { now: now(), onLine: (text) => post("ev:timer", { key, status: "fired", text }) }).length
}

/** 空闲 deadline 闩表（**键面** —— 同键至多一闩；跨键独立）：键 ⇒ 核件一次性闩（闩体 = 核 `createTimerWatch`——
 * `sync(key, agent)` = 按该键在途最近到期时点（重）武装：无在途 ∕ 开关关
 *  ⇒ **撤旧 · 零注册**；载体换新（同键新 agent）⇒ 撤旧立新。`disarm(key)` ∕ `disarmAll()` = 撤闩清点；
 *  `size()` = 在场闩数（诊断 ∕ 用例面）；`keys()` = 键面读数（切项目级联逐键中止编排——#515③）。
 *  **武装刻代次捕获（#515③）**：`rev(key)` 在场 ⇒ 每闩槽记武装刻代次，到点回调携值（`onFire(key, agent, rev)`）
 *  ——「已点火（回调在队）恰逢中止」的陈旧点火由调用面据代次比对丢弃（中止后不投递）。
 *  @param {Function} [p.onFire] 到点回调（收 `(key, agent, rev)`——生产 = 宿主空闲火面；测试 = 假实现）
 *  @param {Function} [p.rev] 武装刻代次读面（收 `(key)` ⇒ number；缺省 ⇒ 恒 `0`（代次面惰性）） */
export function createTimerWatch({ onFire = null, timer = setTimeout, clear = clearTimeout, now = Date.now, rev = null } = {}) {
  /** 闩表：会话键 → `{ agent, rev, latch }`（**武装中才有项**——与核闩零注册态同构）。 */
  const slots = new Map()
  const slotFor = (key, agent) => {
    const slot = { agent, rev: rev === null ? 0 : rev(key), latch: null }
    slot.latch = coreTimerWatch({
      getAgent: () => slot.agent,
      onFire: () => { slots.delete(key); void onFire?.(key, slot.agent, slot.rev) },
      timer, clear, now,
    })
    return slot
  }
  const disarm = (key) => {
    const slot = slots.get(key)
    if (slot === undefined) return false
    slots.delete(key)
    slot.latch.disarm()
    return true
  }
  const disarmAll = () => { for (const key of [...slots.keys()]) disarm(key) }
  const sync = (key, agent) => {
    let slot = slots.get(key)
    if (slot !== undefined && slot.agent !== agent) { slots.delete(key); slot.latch.disarm(); slot = undefined }
    slot ??= slotFor(key, agent)
    const delay = slot.latch.sync()
    if (delay === null) { slots.delete(key); return null } // 未武装（无在途 / 开关关）⇒ 零留项
    slots.set(key, slot)
    return delay
  }
  return { sync, disarm, disarmAll, size: () => slots.size, keys: () => [...slots.keys()] }
}

/** 空闲闩触发（核火策略 + 端两缝）：非空闲零动作（在飞回合 ∥ 窗内由既有路径接管——在途表零触碰）；空闲 ⇒
 *  到期批交付（核派发 + `ev:timer` 落流）+ 开 timer 轮（`{ autoTurn: true, timerTurn: true }`）；轮后链尾接管
 *  （池活 ⇒ 入窗消化 ∥ 池空 ⇒ 闩重武装）由调用面（挂起驱动档）承担——与 `send` 径同判（本档只开轮，不接管）。
 *  @returns {Promise<boolean>} 是否开轮（未交付 ⇒ false——调用面据以决定是否重武装） */
export async function fireTimerWake(key, { agent, post, runTurn, busy = false, inWindow = false, now = Date.now } = {}) {
  return coreFireTimerWake({
    busy: busy || inWindow,
    deliver: () => deliverExpiredTimers(agent, key, { post, now }) > 0,
    openTurn: () => runTurn(key, agent, "", { autoTurn: true, timerTurn: true }),
  })
}
