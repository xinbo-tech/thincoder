/**
 * timer-watch.mjs — timer 空闲唤醒闩（VSC 端面：一次性 deadline 闩 + 空闲自唤醒火面）。
 *
 * 机制单源 = `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.30（§6.30.11 VSC 块 = 本档落点；
 * §6.30.3 门三件 / §6.30.5 跨形态行为表）。形态**端面独立实现 · 机制同源**（CLI `timer-watch.mjs`
 * 同形）：一次性 deadline 闩——到点自撤 · `unref()` · 单槽武装（重复武装 = 撤旧立新）；
 * **非** interval 轮询、**非**第二执行引擎（开轮一律经既有回合驱动器 `runPanelChat`）。
 *
 * 门三件（§6.30.3 沿用）：① 唤醒源 = 核 `_pendingTimers`（唯一写点 = timer 工具）——本档只读到期件，
 * **不看 history**，零通用「注入即唤醒」通道；② 成本闸 = 到期批合并一轮 + 出列幂等
 * （`takeExpiredTimers`）+ 撞帽不续跑（核既有）；③ 开关 `agent.timerWake`（默认开——显式 false 才关）
 * ⇒ 关 = deadline 恒 null ⇒ 零注册。
 *
 * 可见面（§6.30.11 VSC 块 · 协议 §3.2 行 19）：交付点发 `timer { status:"fired", text }`——`text` = 交付原文
 * 逐字（核注入单源）；显示裁（≤3 行 + `…`）= webview 侧（本档零裁切、零文案）。
 *
 * VSC 两处端面事实（CLI 闩的直译在本端不成立，故本档自有形）：
 * ① 顶层 agent 会话级单例但**可销毁重建**（切槽 / 面板 dispose）⇒ 闩经 `getAgent()` 读**活体**，
 *    不捕获对象——换 agent 后 sync 即对新载体重读；撤闩三点 = `chat-panel.mjs` `dispose` +
 *    工作区转空支 + `panel-session.mjs` `loadSession`（切槽销毁点六路汇合处）。
 * ② 机读线**按回合自盘重建**（`panel-chat.mjs`：`loadedLines = suspLines ?? panel._activeLines(...)`）
 *    ⇒ 空闲路送达必须**落盘**（注内存线不落盘 = 下一次 run 读不到 = 静默丢；CLI 的 agent.history
 *    常驻载体在端侧不存在）。
 *
 * 注入缝（可测性，零真实等待）：`timer` / `clear` / `now`——测试以假实现直驱 `sync()` 与
 * `fireTimerWake`（先例 = CLI `timer-watch.mjs` / `heap-watch.test.mjs`）。
 */
import { pendingTimerDeadline, takeExpiredTimers, injectTimerReminders } from "@thincoder/core/agent/timers.mjs"
import { logEvent, errText } from "@thincoder/core/log.mjs"

/** 开关判据（§6.30.3 门三件③ D-TW5）：默认开——只有显式 `false` 才关（键 `agent.timerWake`；
 *  与 `diagnostics.heapWatch` 同口径）。 */
function timerWakeEnabled(agent) {
  return agent?.config?.agent?.timerWake !== false
}

/**
 * 一次性 deadline 闩（单槽）。`sync()` = 按当前在途最近到期时点（重）武装：无在途 / 开关关 / 无载体 ⇒ 撤旧零注册。
 * @param {Function} p.getAgent 活读主 agent（读 `_pendingTimers` + 开关）
 * @param {Function} p.onFire 到点回调（生产 = `fireTimerWake`；测试 = 假实现）
 * @param {Function} [p.timer] 注入缝——默认 `setTimeout`
 * @param {Function} [p.clear] 注入缝——默认 `clearTimeout`
 * @param {Function} [p.now] 注入缝——默认 `Date.now`
 * @returns {{ sync: Function, disarm: Function }}
 */
export function createTimerWatch({ getAgent, onFire, timer = setTimeout, clear = clearTimeout, now = Date.now } = {}) {
  let handle = null
  const disarm = () => {
    const h = handle
    handle = null
    if (h !== null) { try { clear(h) } catch { /* 已触发 / 不可清——尽力面（同 CLI） */ } }
  }
  const sync = () => {
    const agent = getAgent?.()
    const deadline = timerWakeEnabled(agent) ? pendingTimerDeadline(agent) : null
    if (deadline == null) { disarm(); return null } // 无在途 / 开关关 / 无 agent——撤旧，零注册
    disarm() // 单槽：重复武装 = 撤旧立新（延迟按最近到期重算）
    const delay = Math.max(0, deadline - now())
    handle = timer(() => { handle = null; onFire?.() }, delay)
    try { handle?.unref?.() } catch { /* unref 失败不阻断（一次性闩自然退出） */ }
    return delay
  }
  return { sync, disarm }
}

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
 * 空闲闩触发（§6.30.11 VSC 火面；CLI `fireTimerWake` 对位）：**非空闲零动作**——回合在飞 / 挂起窗
 * 由各自既有路径接管（在飞回合 = 回合边界 post-turn 轮询；挂起窗 = 第三兑现态），在途表零触碰
 * （链尾重同步再武装）。空闲 ⇒ 到期批送达（落盘）+ 开 timer 轮（顶层链：`skipSession` 缺省——
 * 队列续发 / 挂起入口照常）。
 * @returns {Promise<boolean>} 是否开轮
 */
export async function fireTimerWake(panel, { runChat, now = Date.now } = {}) {
  if (!panel?._agent || panel.turnBusy?.()) return false
  if (deliverExpiredTimers(panel, { now }).length === 0) return false
  const open = runChat ?? (await import("./panel-chat.mjs")).runPanelChat // 动态 import = 零新增静态环
  await open(panel, { text: "", autoTurn: true, timerTurn: true })
  return true
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
