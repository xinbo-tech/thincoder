/**
 * timer-watch.mjs — timer 空闲唤醒端面壳（CLI：判据族 + 显示裁 + 核转口）。
 *
 * 机制单源 = `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.30（闩 ∕ 派发 ∕ 火策略住核
 * `thincoder-core/agent/timers.mjs`——B3 批改指 = §6.30.16；显示形态 = `docs/cli/design/TUI.md` §7.6）。
 * 本档零自持闩 ∕ 零判据副本：`createTimerWatch` ∕ `deliverExpiredTimers` ∕ `fireTimerWake` = 核转口
 * （签名与返回零变——存量批测冻结面）· `timerWakeEnabled` = 核 re-export；注入缝：`timer` / `clear` / `now`（可测性 · 零真实等待）。
 */
import {
  createTimerWatch as coreCreateTimerWatch,
  deliverExpiredTimers as coreDeliverExpiredTimers,
  fireTimerWake as coreFireTimerWake,
  timerWakeEnabled,
} from "@thincoder/core/agent/timers.mjs"
import { C } from "./ansi.mjs"
import { REMINDER_CAP } from "./tool-display.mjs"

export { timerWakeEnabled } // 判据单源转口（§6.30.3 门三件③ D-TW5）：默认开——只有显式 `false` 才关（键 `agent.timerWake`）

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

/** 到期批送达（两路共用：空闲闩 fire ∥ 挂起窗第三兑现态）：核派发（出列幂等 → 注入历史）+ `onLine` 落流（显示裁 `reminderDisplay`）；返回送达条数（0 = 无到期项——零注入零行）。 */
export function deliverExpiredTimers(ctx, now = Date.now()) {
  const { agent, pushLine } = ctx
  return coreDeliverExpiredTimers(agent, { now, onLine: (line) => pushLine(reminderDisplay(line), C.warn) }).length
}

/** 一次性 deadline 闩转口（KD-B3-1 · 签名零变）：`agent` 缝 ⇒ 核 `{getAgent: () => agent}` **冻结捕获**（与改前
 *  逐字同判——`turnCtx.agent` 实读零写点）；闩体全责 = 核 `createTimerWatch`（武装 ∕ 到点自撤 ∕ 重臂撤旧 ∕ 开关关零注册）。 */
export function createTimerWatch({ agent, onFire, timer = setTimeout, clear = clearTimeout, now = Date.now } = {}) {
  return coreCreateTimerWatch({ getAgent: () => agent, onFire, timer, clear, now })
}

/** 用户自发模态判据（#448① · KD-6——单源：火面抑制 ∥「关闭后补评估」两处同谓词）：picker ∕ wizard
 *  在场即真（工具权限 ∕ 提问面板属**在飞回合**面——由 `state.processing` 门承担，不入本判据）。 */
export function modalOpen(state) {
  return state?.picker != null || state?.wizard != null
}

/**
 * 空闲闩触发（§6.30.3 开轮两处① = 核策略 + 端两缝——B3 改指 §6.30.16）：**非空闲零动作**（processing ∥
 * suspended ∥ `_suspPending` ∥ `modalOpen`——在途表零触碰，链尾重同步再武装）；**模态期抑制**（#448① KD-6）：
 * 模态在场 ⇒ 零送达零开轮（兑现交**关闭后补评估**——装配 = `index.mjs` `onModalClose`）；空闲 ⇒ 到期批送达 +
 * 开 timer 轮（顶层链：`skipSession` 缺省）。@returns {Promise<boolean>} 是否开轮
 */
export async function fireTimerWake(ctx, { runTurn, now = Date.now } = {}) {
  const { state } = ctx
  return coreFireTimerWake({
    busy: state.processing || state.suspended || state._suspPending || modalOpen(state),
    deliver: () => deliverExpiredTimers(ctx, now()) > 0,
    openTurn: () => (runTurn ?? ctx.runTurn)("", { autoTurn: true, timerTurn: true }),
  })
}
