/**
 * render-conversation.mjs — conversation panel line builder
 * Extracted from render-frame.mjs.
 */
import { ansi, C } from "./ansi.mjs"
import { formatTables, sanitizeDisplay, stringWidth, wrapText } from "./render.mjs"
import { renderMarkdownInline, renderMarkdownHeading } from "./markdown.mjs"
import { renderMathInline, renderMathBlock } from "./math.mjs"

let _convCache = { key: "", cols: 0, lines: [] }

/**
 * Render markdown markers to ANSI, then pad the line tail back to the pre-render
 * display width. Markers (`` ` ``, `**`, `~~`) vanish on render — without the
 * compensation, table rows containing them display shorter than the column widths
 * computed by formatTables and the borders misalign (reported regression).
 * @param {string} text — plain text line (no ANSI yet), already wrapped
 * @returns {string} ANSI-rendered line whose display width equals stringWidth(text)
 */
function renderMarkdownPreservingWidth(text) {
  // Line-by-line: render + compensate per line. The per-line padding serves
  // NON-table text (so `**bold** text` next to plain text keeps its width).
  // Table alignment is NOT provided by the padding — formatTables strips cell
  // padding during trim and recomputes widths from the RENDERED text (that is
  // the render-before-measure contract).
  return text.split("\n").map((line) => {
    const rendered = renderMarkdownInline(renderMarkdownHeading(line))
    const diff = stringWidth(line) - stringWidth(rendered)
    return diff > 0 ? rendered + " ".repeat(diff) : rendered
  }).join("\n")
}

// Math runs BEFORE markdown (TUI.md §9.1D): `$...$`/`$$...$$` are opaque to markdown
// (so `x**2` inside a formula isn't misread as bold), and the Unicode approximation
// is measured by renderMarkdownPreservingWidth's width-compensation math.
function renderMathAndMarkdown(text) {
  return renderMarkdownPreservingWidth(renderMathInline(renderMathBlock(text)))
}
// Test seam (mirrors the _-prefixed seams in run.mjs).
export { renderMarkdownPreservingWidth as _renderMarkdownPreservingWidth }


export function convCacheKey(state) {
  const lastLine = state.lines.length > 0 ? state.lines[state.lines.length - 1] : null
  // expandedBlocks participates: expanding/folding a block must invalidate the cache
  const exp = state.expandedBlocks ? [...state.expandedBlocks].sort().join(",") : ""
  // Content prefix in the signature: same kind+length with different content
  // would otherwise collide (stale render); 8 chars disambiguate in practice.
  const blocksSig = (state._advisorBlocks ?? []).map((b) => `${b.kind}:${b.text?.length ?? 0}:${String(b.text ?? "").slice(0, 8)}`).join(",")
  return `${state.lines.length}|${lastLine?.text.length ?? 0}|${state.streaming.length}|${state.reasoning.length}|${blocksSig}|${state.foldEnabled !== false ? "f" : "u"}|${exp}`
}

/** Fold marker line: bold-cyan icon + "click to …" phrase underlined (clickable affordance).
 *  No indent — flush with the content below it; the caller adds a blank line BEFORE it
 *  so the control line stands apart from unrelated content (reported UX). */
function foldHintLine(text, foldKey, srcIdx) {
  // Underline just the actionable phrase — link/button convention
  const withUnderline = text.replace(/(click to (?:expand|collapse))/, "\x1b[4m$1\x1b[24m")
  return { text: withUnderline, color: C.fold, _foldToggle: foldKey, _src: srcIdx }
}

/** Blank separator before a fold control line (uncolored — must not join consecutive-dim folding).
 *  Only the EXPANDED state uses it (▼ sits at the block head); the folded state's ▶
 *  control line sits mid-block where the ellipsis used to be, so no separator needed. */
function blankLine() {
  return { text: "", color: "" }
}

function highlightSearchMatches(text, query, matchesInLine, globalCurrentIndex, allMatches, lineIndex) {
  if (!matchesInLine || matchesInLine.length === 0 || !query) return text

  let result = ""
  let lastEnd = 0
  for (const startIdx of matchesInLine) {
    result += text.substring(lastEnd, startIdx)
    const endIdx = startIdx + query.length
    const matchedText = text.substring(startIdx, endIdx)

    // Find global index of this match
    const gIdx = allMatches.findIndex(m => m.lineIndex === lineIndex && m.charIndex === startIdx)

    if (gIdx === globalCurrentIndex) {
      result += `\x1b[7m${matchedText}\x1b[27m` // Reverse video for current
    } else {
      result += `\x1b[33m\x1b[4m${matchedText}\x1b[24m\x1b[39m` // Yellow underline for others
    }
    lastEnd = endIdx
  }
  result += text.substring(lastEnd)
  return result
}

/**
 * Build the conversation lines for the given state.
 * NOTE: module-level _convCache is read/written as a side effect (keyed by
 * convCacheKey + cols) — the function is pure w.r.t. its input except for
 * that cache; direct callers outside renderConversation/countConvLines
 * should be aware the cache persists across calls.
 */
function buildConvLines(state, cols) {
  const key = convCacheKey(state)
  if (_convCache.key === key && _convCache.cols === cols) return _convCache.lines

  const convLines = []
  // Folding constants (function scope — used by both the long-message fold below
  // and the consecutive-dim fold at the bottom)
  const LONG_FOLD_LINES = 12
  const FOLD_KEEP = 5 // content lines kept in the folded state (first 4 + last 1)
  for (let i = 0; i < state.lines.length; i++) {
    const l = state.lines[i]
    let text = l.text

    // Apply search highlighting
    if (state.search && state.search.query && l._searchMatches) {
      text = highlightSearchMatches(text, state.search.query, l._searchMatches, state.search.index, state.search.matches, i)
    }

    // Long-message folding: ANY single line (main output C.text, thinking C.reason,
    // tool summaries C.dim — whatever wraps beyond LONG_FOLD_LINES display rows)
    // collapses to [first 4, ▶, last]; expanded long blocks render as
    // [blank, ▼, every line]. Main output and thinking are the REAL long
    // content; bidirectional folding (collapse markers + click toggle) keeps
    // them readable — the 0.12.7 dim-only restriction was a temporary fix for
    // the single-direction era and is now reverted. Keyed by the source-line
    // index (`long-${i}`) so the toggle survives re-renders.
    const longKey = `long-${i}`
    const folded = state.foldEnabled !== false && !state.expandedBlocks?.has(longKey)
    const block = []
    // Lightweight markdown display (IK5VW3): render BEFORE measuring — the
    // table column math (formatTables) and wrapping must see the RENDERED
    // text (ANSI consumes zero display width; the width functions are
    // ANSI-aware). Rendering after wrapping measured raw markdown
    // (`**bold**` = 8) against displayed text (4) and sliced markers
    // mid-sequence — the table misalignment the user kept reporting.
    const renderedText = renderMathAndMarkdown(sanitizeDisplay(text))
    for (const line of formatTables(renderedText, cols - 1)) {
      for (const wrapped of wrapText(line, cols - 1)) {
        block.push({ text: wrapped, color: l.color, _foldId: l._foldId, _src: i })
      }
    }
    if (folded && block.length > LONG_FOLD_LINES) {
      // Folded state: first 4 content lines, then the ▶ control line where the
      // ellipsis used to be (the marker itself reads "… N more lines" — ellipsis
      // semantics built in), then the last line. No leading blank line needed:
      // the block starts with real content now.
      convLines.push(...block.slice(0, FOLD_KEEP - 1))
      convLines.push(foldHintLine(`▶ … ${block.length - FOLD_KEEP} more lines — click to expand`, longKey, i))
      convLines.push(block[block.length - 1])
    } else if (block.length > LONG_FOLD_LINES) {
      if (state.foldEnabled === false) {
        // Folding fully off — content already fully visible; a "click to
        // collapse" hint would be misleading (toggling has no effect).
        convLines.push(...block)
      } else {
        // EXPANDED long block: blank line + ▼ control line at the HEAD, directly
        // before the content. DIM blocks must not re-trigger the consecutive-dim
        // folding below (folding stacked on folding — reported regression).
        if (l.color === C.dim) {
          for (const line of block) line._skipDimFold = true
        }
        convLines.push(blankLine())
        convLines.push(foldHintLine(`▼ … ${block.length} lines — click to collapse`, longKey, i))
        convLines.push(...block)
      }
    } else {
      convLines.push(...block)
    }
  }
  if (state.reasoning) {
    for (const wrapped of wrapText(sanitizeDisplay(state.reasoning), cols - 1)) {
      convLines.push({ text: wrapped, color: C.reason })
    }
  }
  const advisorBlocks = state._advisorBlocks ?? []
  if (advisorBlocks.length > 0) {
    // ORDERED block display — the blocks preserve the emission order
    // (think → tool → think → … → final) and render as one interleaved
    // stream: thinking in reasoning color, tool progress/final in text color.
    // Full-length, no preview truncation; long content scrolls via the
    // conversation window like everything else.
    // NOTE: formatTables returns an ARRAY of lines (not a string) — calling
    // .split on it crashed the whole render (tools/final never displayed).
    for (const block of advisorBlocks) {
      const color = { think: C.reason, tool: C.tool, text: C.text }[block.kind] ?? C.text
      const source = sanitizeDisplay(block.text)
      // kind:"text" (the final review prose) gets the same lightweight markdown
      // styling as the main agent response. Rendered BEFORE measuring: the
      // width math (formatTables / wrapText) must see the RENDERED text —
      // measuring raw markdown (`**bold**` = 8) against displayed text (4)
      // misaligned table columns; wrapping raw markdown sliced markers
      // mid-sequence (`**bo` + `ld**`) so the renderer never saw complete ones.
      const rows = block.kind === "think"
        ? source.split("\n")
        : formatTables(block.kind === "text" ? renderMathAndMarkdown(source) : source, cols - 3)
      for (const line of rows) {
        for (const wrapped of wrapText(line, cols - 3)) {
          convLines.push({ text: `│ ${wrapped}`, color })
        }
      }
    }
  }
  if (state.streaming) {
    // Rendered BEFORE formatTables — see the advisor-block comment above.
    const rendered = renderMathAndMarkdown(sanitizeDisplay(state.streaming))
    for (const line of formatTables(rendered, cols - 1)) {
      for (const wrapped of wrapText(line, cols - 1)) {
        convLines.push({ text: wrapped, color: C.text })
      }
    }
  }
  // Fold long blocks (> 8 consecutive dim lines)
  const FOLD_LINES = 8
  let foldCounter = 0
  const folded = []
  let i = 0
  while (i < convLines.length) {
    const line = convLines[i]
    if (line.color === C.dim) {
      let j = i
      while (j < convLines.length && convLines[j].color === C.dim) j++
      const blockLen = j - i
      // Expanded long-fold blocks are exempt — otherwise folding stacks on folding
      const hasExpandedLong = convLines.slice(i, j).some((l) => l._skipDimFold)
      if (blockLen > FOLD_LINES && !hasExpandedLong) {
        const foldKey = `fold-${foldCounter++}`
        if (state.foldEnabled !== false && !state.expandedBlocks?.has(foldKey)) {
          // First 4 lines, then the ▶ control line (ellipsis position), then the last line
          folded.push(...convLines.slice(i, i + FOLD_KEEP - 1))
          folded.push(foldHintLine(`▶ … ${blockLen - FOLD_KEEP} more lines — click to expand`, foldKey))
          folded.push(convLines[j - 1])
          i = j
          continue
        }
        // EXPANDED consecutive-dim block: blank + ▼ at the HEAD, then every line.
        // foldEnabled=false → raw block, no hint (toggling would be a no-op).
        if (state.foldEnabled === false) {
          for (let k = i; k < j; k++) folded.push(convLines[k])
        } else {
          folded.push(blankLine())
          folded.push(foldHintLine(`▼ … ${blockLen} lines — click to collapse`, foldKey))
          for (let k = i; k < j; k++) folded.push(convLines[k])
        }
        i = j
        continue
      }
    }
    folded.push(line)
    i++
  }

  _convCache = { key, cols, lines: folded }
  return folded
}

export function countConvLines(state, cols) {
  return buildConvLines(state, cols).length
}

export { buildConvLines }

export function renderConversation(state, cols, visibleH, scroll) {
  const convLines = buildConvLines(state, cols)
  const maxScroll = Math.max(0, convLines.length - visibleH)
  const clamped = Math.min(scroll, maxScroll)
  const end = convLines.length - clamped
  const visible = convLines.slice(Math.max(0, end - visibleH), end)
  const pad = visibleH - visible.length
  const out = []
  for (let p = 0; p < pad; p++) out.push("")
  for (const l of visible) out.push(`${l.color ?? ""}${l.text}${ansi.reset}`)
  return out
}
