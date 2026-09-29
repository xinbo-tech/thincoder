/**
 * timer-watch.mjs — timer 空闲唤醒端面壳（VSC：交付适配 + 火缝 + 装配）。
 *
 * 机制单源 = `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.30（§6.30.11 VSC 块 = 本档落点；闩 ∕ 派发 ∕ 火策略住核
 * `thincoder-core/agent/timers.mjs`——B3 批改指 = §6.30.16）。本档零自持闩 ∕ 零判据副本；门三件（§6.30.3 沿用 · 开关读面 = 核 `timerWakeEnabled`）：
 * ① 唤醒源 = 核 `_pendingTimers`（只读、不看 history）；② 成本闸 = 到期批合并 + 出列幂等（核 `takeExpiredTimers`）；③ 开关 `agent.timerWake` 默认开——关 ⇒ 核闩零注册。
 * 可见面（协议 §3.2 行 19）：发 `timer { status:"fired", text }`（交付原文逐字——核注入单源）；显示裁（≤3 行 + `…`）= webview 侧（本档零裁切、零文案）。
 *
 * VSC 两处端面事实（交付适配保留——注入目标 ≠ `agent.history` ⇒ 不核包装）：① 顶层 agent 会话级单例但**可销毁
 * 重建**（切槽 / 面板 dispose）⇒ 核闩经 `getAgent()` 读**活体**，不捕获对象；撤闩三点 = `chat-panel.mjs` `dispose` +
 * 工作区转空支 + `panel-session.mjs` `loadSession`。② 机读线**按回合自盘重建**（`panel-chat.mjs`）⇒ 空闲路送达必须
 * **落盘**（不落盘 = 下一次 run 读不到 = 静默丢）。
 */
import {
  createTimerWatch,
  fireTimerWake as coreFireTimerWake,
  takeExpiredTimers,
  injectTimerReminders,
} from "@thincoder/core/agent/timers.mjs"
import { logEvent, errText } from "@thincoder/core/log.mjs"

/**
 * 到期批送达（两路共用：空闲闩 fire ∥ 挂起窗第三兑现态）——出列（幂等）→ 注入机读线 →
 * （空闲路）落盘 → `timer` 触发落流（协议 §3.2 行 19）。`lines` 给定时 = 会话活线（窗内——注入即在场，
 * 随回合落盘）；缺省 = 活动会话双线（空闲——下一次 run 自盘重建机读线，注入必须落盘）。
 * @param {Function} [opts.now] 注入缝——时钟（默认 `Date.now`；与桌面同形：调用方传**钟**、本档调用取时点 `now()`）
 * @returns {string[]} 送达原文（核注入单源逐字）；零到期 / 无会话载体 ⇒ 空数组（在途不动 = 零静默丢）
 */
export function deliverExpiredTimers(panel, { lines = null, now = Date.now } = {}) {
  const agent = panel?._agent
  if (!agent) return []
  const target = lines ?? (panel._slot != null ? panel._activeLines() : null)
  if (!target) return [] // 空闲路槽未绑定——零动作（在途保持：链尾重同步再试）
  const injected = injectTimerReminders({ history: target.contextHistory ?? target.history }, takeExpiredTimers(agent, now()))
  if (injected.length === 0) return []
  if (!lines) panel._saveLines(target.fullHistory, target.contextHistory)
  // 触发落流（§6.30.11 VSC 可见面 · 协议 §3.2 行 19）：逐条 `{ status:"fired", text }`——`text` = 交付原文逐字
  // （核注入单源）；显示裁（≤3 行 + `…`）= webview 侧（本档零裁切、零文案）。
  for (const text of injected) panel._panel?.webview.postMessage({ type: "timer", status: "fired", text })
  return injected
}

/**
 * 空闲闩触发（§6.30.11 VSC 火面 = 核策略 + 端两缝——B3 改指 §6.30.16）：**非空闲零动作**（无 agent ∥ `turnBusy()` 真——
 * 在飞回合 / 挂起窗由既有路径接管，在途表零触碰，链尾重同步再武装）；空闲 ⇒ 到期批送达（落盘）+ 开 timer 轮
 * （顶层链：`skipSession` 缺省——队列续发 / 挂起入口照常）。@returns {Promise<boolean>} 是否开轮
 */
export async function fireTimerWake(panel, { runChat, now = Date.now } = {}) {
  return coreFireTimerWake({
    busy: !panel?._agent || Boolean(panel.turnBusy?.()),
    deliver: () => deliverExpiredTimers(panel, { now }).length > 0,
    openTurn: async () => {
      const open = runChat ?? (await import("./panel-chat.mjs")).runPanelChat // 动态 import = 零新增静态环
      await open(panel, { text: "", autoTurn: true, timerTurn: true })
    },
  })
}

/** 闩装配 + 同步（单例惰性建 = `panel._timerWatch`；武装点两处共享本函数：回合尾 `finalizeTurn` /
 *  挂起会话退出 `finally`；撤闩 = 面板 `dispose`）。火面异常兜底（CLI `index.mjs` 同形：落账 +
 *  忙态复位 + 重同步）——无人值守的空闲轮报错不得逃逸为 unhandled rejection。 */
export function syncTimerWatch(panel) {
  const watch = panel._timerWatch ?? (panel._timerWatch = createTimerWatch({
    getAgent: () => panel._agent,
    onFire: () => fireTimerWake(panel).catch((e) => {
      logEvent("err:internal", { msg: errText(e, 200), where: "timer-watch" })
      panel._publishTurnState?.("idle")
      panel._refreshStatus?.()
      panel._panel?.webview.postMessage({ type: "error", text: String(e?.message ?? e).split("\n")[0], techInfo: String(e?.stack ?? e) })
      panel._timerWatch?.sync() // 在途仍在 ⇒ 再武装（链尾外兜底）
    }),
  }))
  return watch.sync()
}
