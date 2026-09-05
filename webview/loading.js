/**
 * loading.js — send/abort button + input-box loading state.
 * Split out of ui.js (§17, 2026-09-02): ui.js is a leaf DOM-builder module
 * (imported by diff.js / settings-* / autocomplete.js and their tests) — the
 * suspension-aware loading state needs S (state.js → acquireVsCodeApi at module
 * top), so it lives HERE with the other state.js consumers instead of dragging
 * the bridge dependency into every ui.js importer.
 */
import { S } from "./state.js"

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
  // 2026-09-05 人机并行对齐（CLI state.queue 语义——实践验证模式）：processing 期间
  // 输入框始终可用（发送=排队不打断）；send 常显、abort 仅运行中显。回滚 poolActive
  // 特例（只池活跃解锁是窄化——CLI 任何处理中都可输入排队）。
  ctx.sendBtn.style.display = "flex"
  ctx.abortBtn.style.display = on ? "flex" : "none"
  ctx.inputEl.disabled = false
  if (!on) ctx.inputEl.focus()
  ctx.isRunning = on
}
