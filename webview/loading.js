/**
 * loading.js — send/abort button + input-box loading state.
 * Split out of ui.js (§17, 2026-09-02): ui.js is a leaf DOM-builder module
 * (imported by diff.js / settings-* / autocomplete.js and their tests) — the
 * suspension-aware loading state needs S (state.js → acquireVsCodeApi at module
 * top), so it lives HERE with the other state.js consumers instead of dragging
 * the bridge dependency into every ui.js importer.
 */
import { S } from "./state.js"
import { poolActive } from "./state.js"

/**
 * Loading state: send/abort button swap + input lock.
 * §17 suspension: while the suspension session is active the input box NEVER locks
 * (digest turns run in the background — Enter queues the message, F7) and both the
 * send and the Stop button stay available (Stop aborts the whole background session).
 * Explicit assignment (not conditional): entering suspension must RE-ENABLE an input
 * disabled by the previous loading state — no dependence on caller ordering (F7).
 */
export function setLoading(ctx, on) {
  const susp = S._suspended
  // 2026-09-05 走查缺陷修复：异步子代理执行中（后台池活跃）主输入框同样放开——
  // 与挂起会话同语义（send 排队不打断——CLI 对位）；池空后回到原锁定逻辑。
  const subActive = poolActive()
  ctx.sendBtn.style.display = (!on || susp || subActive) ? "flex" : "none"
  ctx.abortBtn.style.display = (on || susp) ? "flex" : "none"
  ctx.inputEl.disabled = on && !susp && !subActive
  if (!on) ctx.inputEl.focus()
  ctx.isRunning = on
}
