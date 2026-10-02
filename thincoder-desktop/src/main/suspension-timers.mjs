/**
 * suspension-timers.mjs — 窗内时效面出档（自 `suspension-drive.mjs` 拆分 —— 消化面留档批 · #719 实施轮；
 * 拆分单源 = `docs/desktop/design/PROJECT.md` §4.1 越层段 ∥ §2 KD-34 ∕ 核 `AGENT-LOOP-ASYNC-POOL.md` §6.30.11 桌面块）。
 * 三件 + 一代次面：① 空闲 deadline 闩装配（`timer-watch.mjs` 键面 —— 与窗内 `timerFace` 是同一 deadline 的两载体，
 * 出窗交接由宿主调用面触发）② 窗内 `timerFace` 注入（核件 opt-in，§6.30.10 —— `deadline` 现算 + `deliver` 交付）
 * ③ 空闲火面（`fireTimerWake` 触发 + 轮后链尾接管）；**中止代次**（#515③ 陈旧点火闸）同持：武装刻代次 ↔ 现状比对，
 * `bump` 由宿主 `abort` ∕ `abortAll` 落位 ⇒ 「已点火（回调在队）恰逢中止」零交付 ∥ 零开轮。
 * 宿主供五枚读缝（`post` 出站 ∥ `runTurn` 单回合 ∥ `busyOf` 在飞判据 ∥ `inWindow` 窗表判据 ∥ `takeOver` 回合尾接管）
 * + 时钟三扇（`timer` ∕ `clear` ∥ `now`）——零宿主依赖 ⇒ 平 node 直测；零文案。
 * **槽重装缝**（`reloadSlot` —— #799 修复轮）：窗内 `deliver` 内**重装先于投递**（整换 `agent.history` ⇒ 序反吞行——明细 = 核 `AGENT-LOOP-ASYNC-POOL.md` §6.30.17）。
 */
import { pendingTimerDeadline } from "@thincoder/core/agent/timers.mjs"
import { createTimerWatch, deliverExpiredTimers, fireTimerWake, timerWakeEnabled } from "./timer-watch.mjs"

/** 时效面工厂：`post(channel, payload)` = 出站面 · `runTurn(key, agent, text, opts)` = 单回合执行面 ·
 *  `busyOf(key)` = 在飞回合判据（缺省 ⇒ 恒假）· `inWindow(key)` = 窗在场判据（缺省 ⇒ 恒假）·
 *  `takeOver(key, agent)` = 回合尾接管面（缺省 ⇒ 回落闩重同步）· `reloadSlot(key, agent, cwd)` = 本窗键槽重装（同源缝 = `createSuspensionDrive` 转口；先于投递调用——**须同步**；缺省 `null` ⇒ 零动作）·
 *  `timer` ∕ `clear` ∕ `now` = 闩时钟三扇注入缝。
 *  返回 `{ faceOf, bump, sync, disarm, disarmAll, size, keys }`（键面五件 = 闩表武装 ∕ 撤清 ∕ 读数——撤闩编排归宿主）。 */
export function createSuspensionTimers({ post, runTurn, busyOf = () => false, inWindow = () => false, takeOver = null, reloadSlot = null, timer = setTimeout, clear = clearTimeout, now = Date.now } = {}) {
  /** 中止代次（每键 —— #515③）：`bump` 由宿主中止面调用；到点回调携**武装刻代次**与现值比对 ⇒ 陈旧点火丢弃。 */
  const gens = new Map()
  const genOf = (key) => gens.get(key) ?? 0
  /** 空闲 deadline 闩（§6.30.11 桌面块 —— 与窗内 `timerFace` 是同一 deadline 的两载体，出窗交接即宿主生命周期内 ⇒
   *  单点持有；宿主只供读缝（`busyOf` ∕ `inWindow` ∕ `takeOver`））。 */
  const watch = createTimerWatch({
    onFire: (key, agent, gen) => {
      if (gen !== genOf(key)) return // 武装后被中止 ⇒ 陈旧点火丢弃（#515③ 中止后交付闸）
      void fireIdle(key, agent).catch((err) => console.error(`[suspension-drive] idle timer wake ${key} failed: ${err?.message ?? err}`))
    },
    rev: genOf,
    timer, clear, now,
  })

  /** 窗内 timer 面（核件 opt-in 三注入项之一 —— §6.30.10 ∥ #799 修复轮）：`deadline()` 每轮现算（开关关 ⇒ `null` ⇒ 零注册）；
   *  `deliver()` = 到期批交付（**严格布尔**——交付真 ⇒ 核件开 timer 轮；交付面同点落 `ev:timer`）：**零在途早退**
   *  （`pendingTimerDeadline === null` ⇒ 直接返 `false`——零重装 ∥ 零投递）；否则**先**重装本窗键槽**再**投递（投递行落重装后机读线 = 该轮将读数组；序反 = 整换吞行）。 */
  function faceOf(key, agent, cwd) {
    return {
      deadline: () => (timerWakeEnabled(agent) ? pendingTimerDeadline(agent) : null),
      deliver: () => {
        if (pendingTimerDeadline(agent) === null) return false // 零在途早退（零重装 ∥ 零投递）
        reloadSlot?.(key, agent, cwd) // 同步缝（本面契约同 `deliver`）——重装先于投递
        return deliverExpiredTimers(agent, key, { post, now }) > 0
      },
    }
  }

  /** 空闲闩触发（§6.30.11 火面）：非空闲零动作（在飞 ∕ 窗内交既有路径）；**轮后链尾接管**（§6.30.11 装配点①
   *  的回合尾面 —— timer 轮亦为回合：池活 ⇒ 入窗消化 ∥ 池空 ⇒ 闩重武装；与 `send` 径两径同接管同判）；交付未
   *  发生（在飞 ∕ 零到期）⇒ 零动作（免「已到期未出列」0ms 重注册）；轮内抛错同走接管（`finally`）。 */
  async function fireIdle(key, agent) {
    let ran = false
    try {
      return await fireTimerWake(key, {
        agent, post, busy: busyOf(key) === true, inWindow: inWindow(key), now,
        runTurn: (k, a, text, opts) => { ran = true; return runTurn(k, a, text, opts) },
      })
    } finally {
      if (ran) { if (takeOver) takeOver(key, agent); else watch.sync(key, agent) } // 接管面缺省 ⇒ 回落闩重同步（用例面）
    }
  }

  return {
    faceOf,
    /** 中止代次落位（#515③ 先于一切早退 —— 无窗 ∕ 续发期两态同落 ⇒ 已点火回调即失效）。 */
    bump: (key) => { gens.set(key, genOf(key) + 1) },
    /** 闩面三武装点（§6.30.11）：回合尾接管未入窗 ⇒ `sync` 武装 ∕ 出窗结算后 ⇒ 重武装 ∕ 会话清除面 ⇒ `disarm` 清点。 */
    sync: (key, agent) => watch.sync(key, agent),
    disarm: (key) => watch.disarm(key),
    disarmAll: () => watch.disarmAll(),
    size: () => watch.size(),
    keys: () => watch.keys(),
  }
}
