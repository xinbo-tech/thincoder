/**
 * heartbeat.mjs — 渲染面 **2s 拍**（「对齐第三批」P7 —— **首个渲染面定时器** · 清点纪律；
 * `docs/desktop/design/UI.md` §1「本批注（对齐第三批 · 小修族）」外围 7）：
 *   ① 池面在飞块逐块核件 `refreshBlock`（判据 `isConnected ∧ !frozen` —— 走时词面：秒数逐 2s 走）；
 *   ② 活动会话位标含 `running` ⇒ 状态行重挂（耗时段走时）—— 拍体由装配面（`renderer/app.mjs` **单点**）组。
 * 本档只出**可直测两件**：拍读常数 + 拍体（`refreshLiveBlocks`）+ 定时器生命周期（`createHeartbeat` ——
 * `setInterval` + `stop()` 清点）；装配点 / 卸载清点（`unload`）= `renderer/app.mjs`（单点）。
 * 依赖单向：本档 → 核件（`/rc/subblocks/activity-view.mjs`）；零 `node:` / 零裸包（渲染面静态闭包判据）。
 */

import { refreshBlock } from "/rc/subblocks/activity-view.mjs"

/** 拍读（2s —— 单源；调参面 = 本档一处）。 */
export const HEARTBEAT_MS = 2000

/** 池面在飞块走时刷（纯 · 可注入）：逐 `.sub-block` —— **判据 `isConnected ∧ !frozen`**（已摘 / 已冻结块不刷 ——
 *  走时词面只对活块有意义）；`refresh` 注入面 = 平 node 直测缝（缺省 = 核件 `refreshBlock`）。回值 = 本次刷块数。 */
export function refreshLiveBlocks(root, refresh = refreshBlock) {
  if (!root || typeof root.querySelectorAll !== "function") return 0
  let hits = 0
  for (const block of root.querySelectorAll(".sub-block")) {
    if (block?.isConnected !== true || block?._subMeta?.frozen === true) continue
    refresh(block)
    hits += 1
  }
  return hits
}

/** 定时器生命周期（**清点纪律** —— 单点 `setInterval` 的封装）：`tick` 为函数 ⇒ 每 `intervalMs` 调一次；
 *  `stop()` **清点**（幂等 —— 重复调零动作）；`timers` 注入面 = 平 node 直测缝（缺省 = 全局两函数；
 *  **缺省经箭头闭包转发** —— 原生 `setInterval` 脱离 `window` 接收者即显式抛「Illegal invocation」）。
 *  `tick` 缺 / 非函数 ⇒ 空拍对象（零定时器 —— 装配面漏给不静默起火）。 */
export function createHeartbeat({ tick, intervalMs = HEARTBEAT_MS, timers = {} } = {}) {
  let handle = null
  const startTimer = timers.setInterval ?? ((fn, ms) => setInterval(fn, ms))
  const clearTimer = timers.clearInterval ?? ((id) => clearInterval(id))
  const stop = () => {
    if (handle === null) return
    clearTimer(handle)
    handle = null
  }
  if (typeof tick === "function") handle = startTimer(() => { tick() }, intervalMs)
  return { stop, intervalMs }
}
