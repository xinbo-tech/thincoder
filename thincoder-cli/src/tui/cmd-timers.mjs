/**
 * cmd-timers.mjs — `/timers`：在途 timer 只读列表（最薄）。
 *
 * 机制单源 = `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.30；显示形态单源 = `docs/cli/design/TUI.md`
 * §7.6（逐条 dim 行 `⏰<i> · 剩余 <mm:ss> · <message 首行（截断）>`；零在途 ⇒ 一行 `无在途 timer`）。
 * **取消面不做**（取消 = 控制面——门 / 回执 / 持久化语义；停轮 = Ctrl+C，停机制 = `agent.timerWake` 关）。
 * 取值 = `agent._pendingTimers` 活读（每次调用现算——零缓存）；剩余按 `expiresAt - now` 现算。
 */
import { C } from "./ansi.mjs"
import { sanitizeDisplay, sliceByWidth, stringWidth } from "./render.mjs"

/** 剩余 mm:ss（到期未送达 ⇒ 夹到 `00:00`——到期态另由状态行警示色承载，见 TUI.md §7.6）。 */
function remainText(expiresAt, now) {
  const sec = Math.max(0, Math.ceil((expiresAt - now) / 1000))
  return `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`
}

/** message 首行（截断——60 显示列 + `…`，同会话标题段口径）。 */
function headText(message) {
  const head = sanitizeDisplay(String(message ?? "").split("\n")[0])
  return stringWidth(head) > 60 ? sliceByWidth(head, 59) + "…" : head
}

export async function handleTimersCommand(ctx) {
  const { agent, pushLine } = ctx
  const timers = agent?._pendingTimers ?? []
  if (timers.length === 0) {
    pushLine("无在途 timer", C.dim)
    return
  }
  const now = Date.now()
  timers.forEach((t, i) => pushLine(`⏰${i + 1} · 剩余 ${remainText(t.expiresAt, now)} · ${headText(t.message)}`, C.dim))
}
