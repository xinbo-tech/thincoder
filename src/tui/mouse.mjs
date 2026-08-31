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
import { computeLayout, subagentLineIndex } from "./layout.mjs"
import { buildConvLines, convViewport } from "./render-conversation.mjs"
import { toggleFoldBlock, scrollFoldBlock, foldScrollOffset } from "./fold-block.mjs"

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
  // §7.2.1 D4: 固定子agent 面板（conversation 与 todo 之间）——面板行默认穿出
  // 滚会话（F3，与 todo 面板同型）；命中展开区块内容行（_foldBlock 标记）→
  // 块内滚动（现状能力不丢）。
  if (P.subagent && r >= P.subagent.y && r < P.subagent.y + P.subagent.h) {
    // 评审 #4：面板部分压缩（保底截断）后可见行 = 分隔线 + 末尾行——命中映射经
    // subagentLineIndex（与 render-frame 同一几何契约），不再把行内坐标直接当索引用。
    const lineEl = layout.subagentLines[subagentLineIndex(layout.subagentLines, P.subagent.h, r - P.subagent.y)]
    if (!lineEl?._foldBlock || !lineEl._foldTotal) return false
    // 穿出语义与会话区块一致：块内到边界（顶滚上 / 底滚下）→ 交还会话滚动
    const before = foldScrollOffset(state, lineEl._foldBlock)
    const winH = lineEl._foldWindow ?? 1
    const total = lineEl._foldTotal
    if (dir < 0 && before <= 0) return false
    if (dir > 0 && before >= total - winH) return false
    scrollFoldBlock(state, lineEl._foldBlock, dir, 3)
    ctx.render?.()
    return true
  }
  if (r < P.conversation.y || r >= P.conversation.y + P.conversation.h) return false
  const convLines = buildConvLines(state, dims.cols, dims.rows)
  const gIdx = convGlobalIndex(convLines.length, P.conversation.h, state.scroll ?? 0)(r - P.conversation.y)
  if (gIdx === null) return false
  const lineEl = convLines[gIdx]
  if (!lineEl?._foldBlock) return false
  // 2026-08-31 会诊 glm：标记不完整（_foldTotal 缺失=退化路径）不消费——交还会话滚动
  // （total=0 会让下方边界守卫短路 → 卡在块里回归）
  if (!lineEl._foldTotal) return false
  // 2026-08-31 穿出语义：块内已到边界（向上滚在顶 / 向下滚在底）→ 交还会话滚动——
  // 否则滚轮永远被块吃掉，会话顶/懒加载不可达（用户实测路径"经过展开块滚不到顶"）
  const before = foldScrollOffset(state, lineEl._foldBlock)
  const winH = lineEl._foldWindow ?? 1
  const total = lineEl._foldTotal
  if (dir < 0 && before <= 0) return false // 块顶滚上 → 穿出（会话滚动 → 顶部自动加载）
  if (dir > 0 && before >= total - winH) return false // 块底滚下 → 穿出
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
  const { start, pad } = convViewport(convLen, convH, scroll)
  return (localRow) => {
    if (localRow < 0 || localRow >= convH) return null
    if (localRow < pad) return null // 顶部 pad 空行不是内容行（2026-08-31 会诊 kimi 缺陷 1）
    const idx = start + localRow - pad
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

  // ── §7.2.1 D4: 固定子agent 面板（conversation 与 todo 之间）——折叠/展开/翻窗
  // 坐标映射到面板行（与 todo 面板同型；layout.subagentLines = 面板渲染行）。
  if (P.subagent && r >= P.subagent.y && r < P.subagent.y + P.subagent.h) {
    // 评审 #4：保底截断后可见行 ≠ 前 h 行——命中映射与 render-frame 同一几何契约
    // （subagentLineIndex：分隔线 + 末尾区块行优先）。
    const lineEl = layout.subagentLines[subagentLineIndex(layout.subagentLines, P.subagent.h, r - P.subagent.y)]
    if (lineEl?._foldScrollUp || lineEl?._foldScrollDown) {
      // ▲/▼ 控制行点击翻窗（60% 封顶保留、窗口随翻滚动，全文可达）
      scrollFoldBlock(state, lineEl._foldScrollUp ?? lineEl._foldScrollDown,
        lineEl._foldScrollUp ? -1 : 1, lineEl._foldWindow ?? 1,
        typeof lineEl._foldTotal === "number" ? Math.max(0, lineEl._foldTotal - (lineEl._foldWindow ?? 1)) : undefined)
      render()
      return true
    }
    if (!lineEl?._foldToggle) return false
    // 双向切换（fold-block.mjs 单源）：折叠头展开 / ▼ 控制收起
    toggleFoldBlock(state, lineEl._foldToggle)
    render()
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
        lineEl._foldScrollUp ? -1 : 1, lineEl._foldWindow ?? 1,
        typeof lineEl._foldTotal === "number" ? Math.max(0, lineEl._foldTotal - (lineEl._foldWindow ?? 1)) : undefined)
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
