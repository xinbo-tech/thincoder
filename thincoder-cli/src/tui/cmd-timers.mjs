/**
 * cmd-timers.mjs — `/timers`：在途 timer 只读列表（最薄）。
 *
 * 机制单源 = `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.30；显示形态单源 = `docs/cli/design/TUI.md`
 * §7.6（逐条 dim 行 `timer <i> · <kind> · 剩余 <dur> · <message 首行（截断）>`；零在途 ⇒ 一行 `无在途 timer`）。
 * **取消 = 模型工具 `timer` 的 `cancel` 动作**（§6.30.18——四端同得；`/timers` 保持只读；停轮 = Ctrl+C，
 * 停机制 = `agent.timerWake` 关）；不设端专属取消 UI。
 * 取值 = `agent._pendingTimers` 活读（每次调用现算——零缓存）；剩余按 `expiresAt - now` 现算。
 * 取时单点 = `ctx.now ?? Date.now()`（毫秒数可选读——与核工具缝逐字同形；生产 ctx（`index.mjs` 装配 ∥ `slash-commands.mjs` 转发）
 * 不携 `now` ⇒ 缺省回落 = 现行为零变；单元测试档以假 ctx 直驱——§6.30.18）。
 * kind 段仅非一次性项插入（`每 <N>m` 整分 ∕ `每 <N>s` 非整分 ∥ `每天 <HH:MM>` ∥ `于 <YYYY-MM-DD HH:MM>`）；
 * `<dur>` = `<mm:ss>`（< 1h）∥ `<h:mm:ss>`（≥ 1h——与模型 `list` 的 `next` 同形）。§6.30.18。
 */
import { C } from "./ansi.mjs"
import { sanitizeDisplay, sliceByWidth, stringWidth } from "./render.mjs"

/** 日历式 `HH:MM` 形判据（与核同形——显示面只判形）。 */
const DAILY_RE = /^(?:[01]\d|2[0-3]):[0-5]\d$/

/** 剩余 `<mm:ss>`（< 1h）∥ `<h:mm:ss>`（≥ 1h——h 不补零）；到期未送达 ⇒ 夹到零，非有限 `expiresAt`
 *  ⇒ 同走夹零（`00:00`——与核 `list` 对同一输入的自判同向：`nextText` 非有限 ⇒ `due now`）
 *（到期态另由状态行警示色承载，见 TUI.md §7.6；与模型 `list` 的 `next <dur>` 同判——§6.30.18）。 */
function remainText(expiresAt, now) {
  const sec = Number.isFinite(expiresAt) ? Math.max(0, Math.ceil((expiresAt - now) / 1000)) : 0
  const h = Math.floor(sec / 3600)
  const mm = String(Math.floor((sec % 3600) / 60)).padStart(2, "0")
  const ss = String(sec % 60).padStart(2, "0")
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}

/** 本地刻 `YYYY-MM-DD HH:MM`（`于 <...>` 段——宿主本地时区）。 */
function stampText(ms) {
  const d = new Date(ms)
  const p = (n) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

/** kind 段（非一次性项——§6.30.18 ∥ TUI.md §7.6）：`每 <N>m`（整分）∥ `每 <N>s`（非整分）∥
 *  `每天 <HH:MM>` ∥ `于 <YYYY-MM-DD HH:MM>`（`at: true` 来源标记位——父侧裁定 2026-10-12；`于` 段另须
 *  `Number.isFinite(expiresAt)`——非有限 ⇒ 段不插，不吐 `NaN-NaN-NaN NaN:NaN` 假刻）；
 *  一次性（三标识皆不在场）⇒ `null`（段不插——行逐字零变）。 */
function kindText(t) {
  const everyMs = t?.everyMs
  if (typeof everyMs === "number" && Number.isFinite(everyMs) && everyMs > 0) {
    return everyMs % 60000 === 0 ? `每 ${everyMs / 60000}m` : `每 ${everyMs / 1000}s`
  }
  if (typeof t?.daily === "string" && DAILY_RE.test(t.daily)) return `每天 ${t.daily}`
  if (t?.at === true && Number.isFinite(t.expiresAt)) return `于 ${stampText(t.expiresAt)}`
  return null
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
  const now = ctx.now ?? Date.now() // 时钟缝单点（§6.30.18）——生产 ctx 不携 now ⇒ 缺省回落 = 现行为零变
  timers.forEach((t, i) => {
    const kind = kindText(t)
    pushLine(`timer ${i + 1}${kind === null ? "" : ` · ${kind}`} · 剩余 ${remainText(t.expiresAt, now)} · ${headText(t.message)}`, C.dim)
  })
}
