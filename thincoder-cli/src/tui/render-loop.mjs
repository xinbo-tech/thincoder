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
import { historyReading, tokenRatioOf } from "@thincoder/core/token-window.mjs"
import { providerSpec } from "@thincoder/core/config.mjs"
import { ansi, C } from "./ansi.mjs"
import { isTuiActive } from "./tui-lifecycle.mjs" // F-2 渲染抑制守卫（RESIZE-MOUSE-LEAK-FIX）

const MIN_RENDER_INTERVAL_MS = 16

/**
 * 上下文读数缓存（CONTEXT-COMPACTION.md §6.16.4 单源）：值全部来自核 `historyReading`，本档零自算式。
 * 失效键三项 = `history.length` · `ratio` · 解析后的窗口——只按长度会留陈旧读数：校准比可在长度不变时变
 * （槽样本恢复 / 口径版本切换），窗口可在切模型 ∥ 改人工声明时变。三项全等 ⇒ **原引用**（零重算）；
 * 否则重取核读数。为何不每帧调核：`estimateTokens` 是全史线性扫描，每帧跑一次是渲染热路径的净开销。
 * **三项覆盖不到的一类变化（登记）**：内容变而长度不变——`pruneStaleToolOutputs` 原位换掉 tool 内容
 * （`thincoder-core/context-degrade.mjs:30`-35：数组长度不变、估算骤降）与 `applySession` 整体换机读线
 * （`thincoder-core/session-lifecycle.mjs:119`：长度可与前一会话巧合相等）。这两时刻状态行沿用变化前的
 * 百分比，直到下一次追回消息使 `len` 变；闭这项需要第四个内容版本键（机制变更，不自取）。
 * 首帧：`state.ctxCache` 初值 `{ len: -1, tokens: 0 }`（`tui-state.mjs`）长度恒不等 ⇒ 必落重算支，
 * 由此补齐 `ratio` / `window` / `pct`；未补齐前 `pct` = `undefined` ⇒ 状态行显示门（`ctxPct > 0`）为假，该段不显。
 */
export function ctxCacheOf(agent, prev) {
  const history = agent?.history ?? []
  const ratio = tokenRatioOf(agent)
  const window = providerSpec(agent?.provider).context
  if (prev && prev.len === history.length && prev.ratio === ratio && prev.window === window) return prev
  const { tokens, pct } = historyReading(history, agent?.provider, ratio)
  return { len: history.length, ratio, window, tokens, pct }
}

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
    if (!isTuiActive()) return // F-2 渲染抑制（RESIZE-MOUSE-LEAK-FIX）：cleanup 已清活动态——退出期不再把 TUI 帧重绘到已恢复的主屏
    try {
      // Single source (Windows ConPTY instability, 2026-08-30). CACHE ONLY —
      // no per-frame refresh: during heavy streaming output ConPTY reports a
      // STALE buffer size (80) and per-frame sampling let that stale value
      // hijack the cache (streaming content crammed into a left-hand sliver,
      // restored to full width only after flush stopped the output). dims are
      // updated by: startup seed + a delayed re-sample + resize events.
      const dims = state.dims ? state.dims.get() : { cols: process.stdout.columns || startupDims.cols, rows: process.stdout.rows || startupDims.rows }
      // 2026-08-31 流式跟随（会诊 kimi 简化 + deepseek/glm 锚定）：_followTail 即完整语义——
      // 开 → 渲染前钉底（tool/pushLine 行同样生效，无跟随空洞）；关（用户上滚）→ 锚定补偿：
      // scroll 是距底偏移，暂停期间 convLen 增长会把用户读的行顶走——按增长量补偿。
      const convLen = countConvLines(state, dims.cols, dims.rows)
      if (state._followTail) {
        state.scroll = 0
      } else if (state._pauseAnchorLen != null && convLen > state._pauseAnchorLen) {
        state.scroll += convLen - state._pauseAnchorLen
      }
      state._pauseAnchorLen = convLen

      // NOTE (docs/cli/design/TUI.md §6.8 D6): the old state.outputPanels prune is gone — output panels
      // are abolished; subagent blocks live in the conversation and are never
      // auto-pruned (bounded by the N2 per-child line cap instead).

      const { rows, cursorRow, cursorCol, layout } = renderRows(state, agent,
        { cols: dims.cols, rows: dims.rows, slashCommands: SLASH_COMMANDS })

      // Clamp scroll (bookkeeping for the status-bar hint; renderConversation clamps internally too)
      state.scroll = Math.min(state.scroll, Math.max(0, countConvLines(state, dims.cols, dims.rows) - layout.panels.conversation.h))

      state.ctxCache = ctxCacheOf(agent, state.ctxCache)

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

      // hasOverlay 例外细化（TUI-INPUT-BOX.md §7.2）：question 自由文本态（无 options）
      // 保留硬件定位（cursorSuffix 正常发——与主输入框同路径）；options 态无光标。
      const qOptionsOnly = Boolean(state.question && state.question.options.length > 0)
      const hasOverlay = state.permission || qOptionsOnly || state.picker || state.wizard?.step === "provider"
      const cursorSuffix = hasOverlay ? "" : `\x1b[${cursorRow};${cursorCol}H${ansi.hideCursor}`

      if (out.length || cursorSuffix) write(ansi.wrapOff + ansi.syncUpdateStart + out.join("") + ansi.syncUpdateEnd + cursorSuffix + ansi.wrapOn)
    } catch {
      // Don't let a render error crash the TUI
    }
  }

  return { render, scheduleRender, get lastRenderAt() { return lastRenderAt } }
}
