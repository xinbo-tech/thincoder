/**
 * mouse.mjs — SGR mouse support: click parsing + hit-testing.
 *
 * Protocol (enabled at startup via \x1b[?1000h\x1b[?1006h):
 *   press:    \x1b[<b;col;rowM   (b=0 left, 64/65 wheel up/down — wheel handled upstream)
 *   release:  \x1b[<b;col;rowm   (ignored — actions fire on press)
 * Coordinates are 1-based; col comes FIRST in the sequence.
 *
 * Only left-click (button 0) is consumed. Everything else stays stripped
 * upstream (sequence fragments must never leak into the input box).
 *
 * Click actions (deliberately minimal — a line-action menu was removed as
 * over-engineering: terminals already copy via drag-select):
 *   - picker option click = select it
 *   - folded-block hint click = expand it
 */
import { computeLayout } from "./layout.mjs"
import { buildConvLines } from "./render-conversation.mjs"
import { toggleFoldBlock, scrollFoldBlock } from "./fold-block.mjs"

/** 2026-08-31 滚轮事件分派（用户需求"展开块能滚动阅读全文"）：坐标命中展开块内容行 →
 *  块内逐行滚动（scrollFoldBlock ±3）；未命中 → 会话滚动（调用方继续处理）。
 *  ctx: { state, render }；返回 true = 已消费（块内滚动），false = 调用方走会话滚动。 */
export function handleWheel(ctx, button, col, row) {
  const { state } = ctx
  const dir = button === 64 ? -1 : 1 // 64=滚上（offset 减）、65=滚下
  const r = row - 1
  if (r < 0) return false
  const dims = state.dims ? state.dims.get() : { cols: process.stdout.columns || 80, rows: process.stdout.rows || 24 }
  const layout = computeLayout(state, dims)
  const P = layout.panels
  if (r < P.conversation.y || r >= P.conversation.y + P.conversation.h) return false
  const convLines = buildConvLines(state, dims.cols, dims.rows)
  const gIdx = convGlobalIndex(convLines.length, P.conversation.h, state.scroll ?? 0)(r - P.conversation.y)
  if (gIdx === null) return false
  const lineEl = convLines[gIdx]
  if (!lineEl?._foldBlock) return false
  scrollFoldBlock(state, lineEl._foldBlock, dir, 3)
  ctx.render?.()
  return true
}


/** Extract left-click presses from a chunk. Returns [{ col, row }] (1-based). */
export function parseMouseClicks(text) {
  const out = []
  // eslint-disable-next-line no-control-regex -- 有意为之：控制字符协议/转义序列剥离正则（ANSI/⟦ev⟧/SGR/history 双线分隔）
  for (const m of text.matchAll(/\x1b\[<0;(\d+);(\d+)M/g)) {
    out.push({ col: Number(m[1]), row: Number(m[2]) })
  }
  return out
}

/** Map a 0-based screen row to a conversation line index (same math as renderConversation). */
export function convGlobalIndex(convLen, convH, scroll) {
  const maxScroll = Math.max(0, convLen - convH)
  const clamped = Math.min(scroll, maxScroll)
  const end = convLen - clamped
  const start = Math.max(0, end - convH) // content shorter than the panel: rows start at 0
  return (localRow) => {
    if (localRow < 0 || localRow >= convH) return null
    const idx = start + localRow
    return idx >= 0 && idx < convLen ? idx : null
  }
}

/**
 * Handle a left-click at SGR (col, row) — 1-based terminal coordinates.
 * ctx: { state, render, popPicker }
 * Returns true when the click was consumed.
 */
export function handleMouseClick(ctx, col, row) {
  const { state, render } = ctx
  const r = row - 1 // 0-based screen row
  if (r < 0) return false
  // Single source (Windows ConPTY instability, 2026-08-30): the cached dims,
  // never a live read that can flip between stale and fresh values.
  const dims = state.dims ? state.dims.get() : { cols: process.stdout.columns || 80, rows: process.stdout.rows || 24 }
  const layout = computeLayout(state, dims)
  const P = layout.panels

  // ── Picker: click an option = select it (skip the title row) ──
  if (state.picker && P.picker && r >= P.picker.y && r < P.picker.y + P.picker.h) {
    const p = state.picker
    const items = p.filteredItems ?? p.entries.filter((e) => e.type === "item")
    const winH = Math.max(1, P.picker.h - 1)
    const start = Math.max(0, Math.min(p.scroll, Math.max(0, p.lines.length - winH)))
    const localRow = r - P.picker.y - 1
    const lineEl = p.lines[start + localRow]
    if (lineEl && lineEl._row !== undefined && items[lineEl._row]) {
      ctx.popPicker(items[lineEl._row])
    }
    return true
  }

  // ── Conversation: click a fold marker (expand hint or collapse marker) toggles it ──
  if (r >= P.conversation.y && r < P.conversation.y + P.conversation.h) {
    const convLines = buildConvLines(state, dims.cols, dims.rows)
    const gIdx = convGlobalIndex(convLines.length, P.conversation.h, state.scroll ?? 0)(r - P.conversation.y)
    if (gIdx === null) return false
    const lineEl = convLines[gIdx]
    if (lineEl?._foldScrollUp || lineEl?._foldScrollDown) {
      // 2026-08-31 块内滚动：▲/▼ 控制行点击翻窗（60% 封顶保留、窗口随翻滚动，全文可达）
      scrollFoldBlock(state, lineEl._foldScrollUp ?? lineEl._foldScrollDown,
        lineEl._foldScrollUp ? -1 : 1, lineEl._foldWindow ?? 1)
      render()
      return true
    }
    if (!lineEl?._foldToggle) return false
    // Bidirectional toggle — single source in fold-block.mjs (expand a folded
    // block, collapse an expanded one).
    toggleFoldBlock(state, lineEl._foldToggle)
    render()
    return true
  }

  return false
}
