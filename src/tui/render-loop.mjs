/**
 * render-loop.mjs — frame scheduler + row-diff rendering
 *
 * Single render path: every frame recomputes the whole screen via renderRows
 * (pure function of state), diffs against the previously written rows, and
 * repaints only changed rows with absolute cursor positioning.
 *
 * This replaces the old dual-path design (full redraw vs per-panel incremental
 * caches) which required fragile manual cache invalidation — the source of
 * repeated "panel renders blank / frozen" bugs. Row content IS the cache key:
 * if a row should look different, it is rewritten; otherwise untouched.
 *
 * Conversation wrapping stays memoized inside render-conversation (convCacheKey),
 * so recomputing the frame each paint is cheap.
 */
import { countConvLines, renderRows } from "./render-frame.mjs"
import { estimateTokens } from "../context.mjs"
import { ansi, C } from "./ansi.mjs"

const MIN_RENDER_INTERVAL_MS = 16

/**
 * Create the render loop closure. Returns { render, scheduleRender }.
 *
 * @param {object} state  — TUI state
 * @param {object} agent  — agent instance
 * @param {object} ctx    — mutable context: { startupDims, SLASH_COMMANDS, showUpdateNotice }
 * @param {Function} pushLine — for error logging
 * @param {Function} [write] — frame output (default process.stdout.write); injectable for tests
 */
export function createRenderLoop(state, agent, ctx, pushLine, write = (s) => process.stdout.write(s)) {
  const { startupDims, SLASH_COMMANDS } = ctx
  let prevRows = []
  let lastCols = 0, lastRows = 0
  let renderRequested = false, renderTimer = null, lastRenderAt = 0

  function scheduleRender() {
    if (renderTimer) return
    const elapsed = performance.now() - lastRenderAt
    const delay = Math.max(0, MIN_RENDER_INTERVAL_MS - elapsed)
    renderTimer = setTimeout(() => {
      renderTimer = null
      if (!renderRequested) return
      renderRequested = false
      lastRenderAt = performance.now()
      doRender()
      if (renderRequested) scheduleRender()
    }, delay)
  }

  function render() {
    if (renderRequested) return
    renderRequested = true
    process.nextTick(() => scheduleRender())
  }

  function doRender() {
    try {
      // Single source (Windows ConPTY instability, 2026-08-30). CACHE ONLY —
      // no per-frame refresh: during heavy streaming output ConPTY reports a
      // STALE buffer size (80) and per-frame sampling let that stale value
      // hijack the cache (streaming content crammed into a left-hand sliver,
      // restored to full width only after flush stopped the output). dims are
      // updated by: startup seed + a delayed re-sample + resize events.
      const dims = state.dims ? state.dims.get() : { cols: process.stdout.columns || startupDims.cols, rows: process.stdout.rows || startupDims.rows }

      // NOTE (§7.2 D6): the old state.outputPanels prune is gone — output panels
      // are abolished; subagent blocks live in the conversation and are never
      // auto-pruned (bounded by the N2 per-child line cap instead).

      const { rows, cursorRow, cursorCol, layout } = renderRows(state, agent,
        { cols: dims.cols, rows: dims.rows, slashCommands: SLASH_COMMANDS })

      // Clamp scroll (bookkeeping for the status-bar hint; renderConversation clamps internally too)
      state.scroll = Math.min(state.scroll, Math.max(0, countConvLines(state, dims.cols, dims.rows) - layout.panels.conversation.h))

      if (state.ctxCache.len !== agent.history.length) {
        state.ctxCache = { len: agent.history.length, tokens: estimateTokens(agent.history) }
      }

      // Deferred upgrade notice — pop when no overlay is active
      if (ctx.pendingNoticeReady(state)) {
        const notice = state.pendingNotice
        state.pendingNotice = null
        ctx.showUpdateNotice(notice).catch((e) => pushLine(`[error] ${e.message}`, C.error))
      }

      // Full repaint on terminal resize (row model no longer matches the physical screen)
      const fullRepaint = dims.cols !== lastCols || dims.rows !== lastRows || rows.length !== prevRows.length
      lastCols = dims.cols; lastRows = dims.rows

      const out = []
      if (fullRepaint) {
        // No trailing newline after the last row — it sits on the terminal's bottom
        // row and a trailing \r\n would scroll the whole screen up by one line.
        out.push(ansi.home, rows.join("\r\n"), ansi.clearToEnd)
      } else {
        for (let i = 0; i < rows.length; i++) {
          if (rows[i] !== prevRows[i]) out.push(`\x1b[${i + 1};1H${rows[i]}`)
        }
      }
      prevRows = rows

      const hasOverlay = state.permission || state.question || state.picker || state.wizard?.step === "provider"
      const cursorSuffix = hasOverlay ? "" : `\x1b[${cursorRow};${cursorCol}H${ansi.hideCursor}`

      if (out.length || cursorSuffix) write(ansi.syncUpdateStart + out.join("") + ansi.syncUpdateEnd + cursorSuffix)
    } catch (e) {
      // Don't let a render error crash the TUI
      if (process.env.THINCODER_DEBUG_RENDER) process.stderr.write(`[render-error] ${e?.stack ?? e}\n`)
    }
  }

  return { render, scheduleRender }
}
