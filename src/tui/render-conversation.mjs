/**
 * render-conversation.mjs — conversation panel line builder
 * Extracted from render-frame.mjs.
 *
 * 2026-08-30: all six fold sites (frozen/running subagent blocks, frozen/live
 * advisor, long-message, consecutive-dim) delegate their EXPANDED-state
 * rendering to the shared fold-block.mjs component, which caps expansion at
 * 60% of the terminal height so the collapse control always stays reachable
 * (user report: an expanded block could push its own control off-screen).
 * maxRows flows in from every caller; omitted/0 → uncapped (tests, odd envs).
 */
import { ansi, C } from "./ansi.mjs"
import { formatTables, sanitizeDisplay, sliceByWidth, wrapText } from "./render.mjs"
import {
  isExpanded, foldHintLine, blankLine, renderExpandedBlock, renderBlockTimeline,
  renderMathAndMarkdown, foldCapRows, renderFoldedHead, foldTailLines,
} from "./fold-block.mjs"
import { ADVISOR_THINKING_PLACEHOLDER } from "../advisor/run.mjs"


// Test seam (mirrors the _-prefixed seams in run.mjs) — moved to fold-block.mjs.
import { renderMarkdownPreservingWidth as _rmpw } from "./fold-block.mjs"
export { _rmpw as _renderMarkdownPreservingWidth }

let _convCache = { key: "", cols: 0, lines: [] }

export function convCacheKey(state, maxRows) {
  const lastLine = state.lines.length > 0 ? state.lines[state.lines.length - 1] : null
  // expandedBlocks participates: expanding/folding a block must invalidate the cache
  const exp = state.expandedBlocks ? [...state.expandedBlocks].sort().join(",") : ""
  // Content prefix in the signature: same kind+length with different content
  // would otherwise collide (stale render); 8 chars disambiguate in practice.
  const blocksSig = (state._advisorBlocks ?? []).map((b) => `${b.kind}:${b.text?.length ?? 0}:${String(b.text ?? "").slice(0, 8)}`).join(",")
  // Subagent activity blocks (§7.2 D5): O(1) counter-style signature — a running
  // epoch (any block/header change bumps it, subagent-blocks.mjs appendSubBlock /
  // finishSubTask) + per-child totals. Running children also fold in a
  // second-granularity elapsed part (see below). NOT a full text concat: N3
  // forbids O(n) signature cost on every token.
  let subSig = ""
  for (const key in state.subTasks) {
    const s = state.subTasks[key]
    // Running children include a second-granularity elapsed component: the 1s
    // ticker re-renders to tick the header countdown — without this the cache
    // would hit and the "45s" display would freeze during silent stretches
    // (long child tool runs with no chunks). Done children are constant — no
    // per-second invalidation for them.
    const elapsedPart = s.done ? "" : `:${Math.floor((Date.now() - s.started) / 1000)}`
    subSig += `${key}:${s.done ? 1 : 0}${elapsedPart}:${s.turn}/${s.maxTurns}:${s.currentTool ?? ""}:${s.approval ?? ""}:${s.blockEpoch ?? 0}:${s.model ?? ""};`
  }
  // Frozen blocks ride state.lines ({_frozenSubTask}) — the lines.length part of
  // this key covers their existence; expanding/collapsing one flips expandedBlocks
  // (covered by `exp`). One extra: the last frozen payload's header depends on
  // blocks content which never changes post-freeze — nothing more needed.
  // Same single pass also builds the per-line COLOR-CLASS signature: foldability
  // is decided by color class since main output (C.text) never folds while
  // thinking/dim do (2026-08-30) — two states differing only in line color used
  // to collide on this key and serve a stale cached render.
  // Tool-block carriers ({_toolBlock}) contribute their BUFFER SIZE signature:
  // output/result arrays mutate in place (streaming appends, result landing),
  // and carrier text is always "" — without this the cache serves a stale block
  // while a tool runs (and across live→restore with equal line counts).
  let frozenSig = ""
  let colorSig = ""
  let toolSig = ""
  for (const l of state.lines) {
    if (l._frozenSubTask) frozenSig += `${l._frozenSubTask.key};`
    if (l._toolBlock) toolSig += `${l._toolBlock.done ? 1 : 0}:${l._toolBlock.output.length}:${l._toolBlock.result ? l._toolBlock.result.length : 0}:${l._toolBlock.summary ?? ""}:${l._toolBlock.elapsed ?? ""};`
    colorSig += l.color === C.text ? "T" : l.color === C.dim ? "D" : l.color === C.reason ? "R" : "o"
  }
  // Expansion cap participates: a terminal resize changes the cap, which changes
  // the rendered height of every expanded block — the cache must not survive it.
  const capPart = maxRows ? `cap${foldCapRows(maxRows)}` : "cap∞"
  // Search state participates: highlightSearchMatches re-renders the matching
  // lines, but performSearch only mutates state.search/_searchMatches — without
  // this the cache would serve the pre-search rows and highlight would never
  // appear (P0-1, 2026-08-30 consult). query+index covers match navigation.
  const searchPart = state.search?.query ? `${state.search.query}:${state.search.index ?? 0}` : ""
  return `${state.lines.length}|${lastLine?.text.length ?? 0}|${state.streaming.length}|${state.reasoning.length}|${blocksSig}|${subSig}|${frozenSig}|${toolSig}|${colorSig}|${state.foldEnabled !== false ? "f" : "u"}|${exp}|${capPart}|${searchPart}`
}

/** Fold marker line: bold-cyan icon + "click to …" phrase underlined (clickable affordance).
 *  No indent — flush with the content below it; the caller adds a blank line BEFORE it
 *  so the control line stands apart from unrelated content (reported UX). */
// foldHintLine/blankLine moved to fold-block.mjs (shared with the component).

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

/** Render a FROZEN child activity block carried on a state.lines entry
 *  (subagent-blocks.mjs freezeSubTaskLines pushes {_frozenSubTask: sub}). Identical
 *  interaction to the running tail section: folded = `[✓ coder#1 · glm-5.3 ·
 *  done 45s · turn 12/100] … click to expand` header + tail 3 block lines;
 *  expanded = blank + ▼ control + full timeline (60% screen cap via the shared
 *  component — capped view ends in a reachable collapse control). Toggle key
 *  `sub-${key}` — the SAME key the live section uses, so fold state carries
 *  across the freeze boundary seamlessly (user ruled 2026-08-30: frozen stays
 *  clickable — full design interaction, not a dim-lines fallback). */
function frozenSubTaskLines(state, sub, cols, maxRows) {
  const foldKey = `sub-${sub.key}`
  const elapsed = Math.floor(((sub.doneAt ?? Date.now()) - sub.started) / 1000)
  const modelPart = sub.model ? ` · ${sub.model}` : ""
  const turnPart = sub.maxTurns > 0 ? ` · turn ${sub.turn}/${sub.maxTurns}` : ""
  const errPart = sub.lastError ? ` — ${sub.lastError}` : ""
  const icon = sub.approval ? "⏸" : "✓"
  const header = `[${icon} ${sub.key}${modelPart} · done ${elapsed}s${turnPart}${errPart}]`
  const out = []
  if (isExpanded(state, foldKey)) {
    // Expanded: shared component renders blank + ▼ control + full timeline,
    // capped at 60% of the screen with a bottom collapse control.
    const body = renderBlockTimeline(sub.blocks, cols)
    out.push(...renderExpandedBlock({ body, foldKey, state, maxRows, cols, label: "subagent activity" }))
  } else {
    // Folded: the header line itself is the control (▶ affordance), then tail 3.
    out.push({
      text: `▶ ${header} … subagent activity — click to expand`,
      color: C.dim,
      _foldToggle: foldKey,
    })
    for (const line of foldTailLines(sub.blocks)) {
      out.push({ text: `│ ${sliceByWidth(line, cols - 4)}`, color: C.dim, _skipDimFold: true })
    }
  }
  return out
}

/**
 * Build the conversation lines for the given state.
 * maxRows: terminal rows for the 60% expansion cap (undefined → uncapped —
 * unit tests and callers without a terminal rely on that).
 * NOTE: module-level _convCache is read/written as a side effect (keyed by
 * convCacheKey + cols) — the function is pure w.r.t. its input except for
 * that cache; direct callers outside renderConversation/countConvLines
 * should be aware the cache persists across calls.
 */
function buildConvLines(state, cols, maxRows) {
  const key = convCacheKey(state, maxRows)
  if (_convCache.key === key && _convCache.cols === cols) return _convCache.lines

  const convLines = []
  // Folding constants (function scope)
  const LONG_FOLD_LINES = 12
  let blankAfter = false
  // THINKING ALWAYS FOLDS (user ruling 2026-08-30, final): no threshold of any
  // kind — row thresholds died twice on the user's real screen (12 never met on
  // narrow, 3 never met on wide), a char threshold missed typical sentences.
  // Thinking is process content: it renders as the named "▶ thinking" block,
  // expand ≤60%, click back. No exceptions, streaming included.
  for (let i = 0; i < state.lines.length; i++) {
    const l = state.lines[i]
    // Main-output breathing room (user request 2026-08-30): a blank line before
    // and after each main-output segment (assistant replies / user text — the
    // C.text rows) so the conversation body stands apart from thinking / tool /
    // subagent blocks. Blank lines are RENDER-only (never written to
    // state.lines) — convCacheKey is unaffected, and adjacent segments share
    // one blank line (the trailing blank of segment N and the leading blank of
    // segment N+1 must not stack into a double row).
    const isMain = l._kind === "text" || (l._kind === undefined && l.color === C.text)
    const pushBlank = () => {
      if (convLines.at(-1)?.text !== "") convLines.push({ text: "", color: C.text })
    }
    if (isMain) {
      const prev = i > 0 ? state.lines[i - 1] : null
      const next = state.lines[i + 1]
      const prevMain = prev && (prev._kind === "text" || (prev._kind === undefined && prev.color === C.text))
      const nextMain = next && (next._kind === "text" || (next._kind === undefined && next.color === C.text))
      if (!prevMain) pushBlank()
      blankAfter = !nextMain
    }
    // Frozen subagent activity block (§7.2 D4, 2026-08-30): rendered as its own
    // collapsible section — clickable expand/collapse like the running block.
    if (l._frozenSubTask) {
      convLines.push(...frozenSubTaskLines(state, l._frozenSubTask, cols, maxRows))
      continue
    }
    // ONE BLOCK PER TOOL CALL (2026-08-30 user ruling): header = name+args+
    // live status, body = args JSON + streaming output + result. Folded =
    // ▶ name args · status/summary; expanded = 60%-capped body (shared component).
    if (l._toolBlock) {
      const b = l._toolBlock
      // Stable key from the line's own id (P1 2026-08-30): the line may shift
      // index when loadOlder unshifts older pages — positional tool-${i} would
      // re-bind the expand state to a different tool block.
      const foldKey = `tool-${l._lineId ?? i}`
      const status = !b.done
        ? "running"
        : `${b.elapsed !== null ? b.elapsed + "ms" : ""}${b.summary ? (b.elapsed !== null ? " · " : "") + sliceByWidth(b.summary, 50) : ""}`.trim() || "done"
      if (isExpanded(state, foldKey)) {
        const body = []
        const pushWrapped = (raw, color) => {
          for (const w of wrapText(raw, cols - 4)) body.push({ text: "  " + w, color, _skipDimFold: true })
        }
        for (const jl of b.argsJson) pushWrapped(jl, C.dim)
        for (const ol of b.output) pushWrapped(ol, C.tool)
        if (b.result) for (const rl of b.result) pushWrapped(rl, C.dim)
        convLines.push(...renderExpandedBlock({ body, foldKey, state, maxRows, label: `${b.name}${b.roundTag || ""} ${b.argsSummary}`.trim() }))
      } else {
        // Head MUST be width-bounded: argsSummary for unknown/MCP tools is a
      // JSON.stringify dump that can be thousands of chars — an overwide header
      // row makes the terminal soft-wrap mid-frame, shifting every panel below
      // (the "code breaks the input box border" report, 2026-08-30).
      const headText = sliceByWidth(
        `❯ ${b.name}${b.roundTag || ""}${b.argsSummary ? " " + b.argsSummary : ""}  · ${status}`,
        Math.max(20, cols - 2),
      )
        const body = []
        for (const jl of b.argsJson) for (const w of wrapText(jl, cols - 4)) body.push({ text: w, color: C.dim, _skipDimFold: true })
        for (const ol of b.output.slice(-3)) for (const w of wrapText(ol, cols - 4)) body.push({ text: w, color: C.dim, _skipDimFold: true })
        // Result lines join the tail pool too — restore carrier has no output
        // rows, so without this its folded tail showed only args JSON and the
        // result vanished from the folded view (parity bug, 2026-08-30).
        if (b.result) for (const rl of b.result) for (const w of wrapText(rl, cols - 4)) body.push({ text: w, color: C.dim, _skipDimFold: true })
        convLines.push(...renderFoldedHead({ header: { text: headText, color: C.tool, _foldToggle: foldKey }, body }))
      }
      continue
    }
    // Frozen advisor review (2026-08-30): same collapsible-box treatment —
    // folded = one control line; expanded = the full review text (markdown
    // rendered, no gutter — review history convention kept from the flat era),
    // 60% cap via the shared component.
    if (l._frozenAdvisor) {
      const frozenAdvKey = `advisor-done-${i}`
      if (isExpanded(state, frozenAdvKey)) {
        const body = []
        const rendered = renderMathAndMarkdown(sanitizeDisplay(l._frozenAdvisor))
        for (const line of formatTables(rendered, cols - 1)) {
          for (const wrapped of wrapText(line, cols - 1)) {
            body.push({ text: wrapped, color: C.reason, _skipDimFold: true })
          }
        }
        convLines.push(...renderExpandedBlock({ body, foldKey: frozenAdvKey, state, maxRows, cols, label: "[advisor · review done]" }))
      } else {
        convLines.push({
          text: `▶ [advisor · review done] … click to expand`,
          color: C.fold,
          _foldToggle: frozenAdvKey,
        })
      }
      continue
    }
    let text = l.text

    // Apply search highlighting
    if (state.search && state.search.query && l._searchMatches) {
      text = highlightSearchMatches(text, state.search.query, l._searchMatches, state.search.index, state.search.matches, i)
    }

    // Long-message folding (2026-08-30 user ruling): MAIN OUTPUT / user messages
    // (C.text) NEVER fold — primary conversation content is read by scrolling,
    // not by expanding; a folded core answer hid the actual result behind a
    // click. Foldable subjects narrow to THINKING (C.reason) and dim tool
    // summaries — the auxiliary streams. (This re-enacts the pre-0.12.7 rule
    // for main output only; the 0.12.7 "revert" had reopened folding for it.)
    // Keyed by the source-line index (`long-${i}`) so the toggle survives
    // re-renders.
    const longKey = `long-${i}`
    // Single source of truth: the producer stamps _kind ("thinking" / "text" /
    // "tool") — buildConvLines READS the stamp instead of GUESSING from color.
    // Three producers (live flushStream / restored historyToLines / injected
    // lines) now emit the identical grammar; the renderer is one place.
    // Fallback: unstamped lines keep the legacy color-based inference (defensive
    // for any path this refactor missed — empty until proven otherwise).
    const isReasoning = l._kind === "thinking" || (l._kind === undefined && l.color === C.reason)
    // Foldable classes: thinking (ALWAYS — threshold 0) and dim auxiliaries.
    // "text" (main output / user messages) NEVER folds.
    const foldable = isReasoning || (l._kind === "tool" || (l._kind === undefined && l.color === C.dim) || (l._kind === undefined && l.color !== C.text && l.color !== C.reason))
    const threshold = isReasoning ? 0 : LONG_FOLD_LINES
    const folded = foldable && state.foldEnabled !== false && !state.expandedBlocks?.has(longKey)
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
    if (folded && block.length > threshold) {
      // FOLDED — unified form (fold-block.mjs renderFoldedHead, 2026-08-30 user
      // ruling): named identity header + last 3 lines. Replaces the legacy
      // [first 4, anonymous ▶ at the ellipsis, last] whose orphaned-looking
      // "… N more lines" segment confused the scrollback.
      const kind = l.color === C.reason ? "thinking" : l.color === C.dim ? "tool output" : "message"
      convLines.push(...renderFoldedHead({
        header: foldHintLine(`▶ ${kind} · ${block.length} lines — click to expand`, longKey, i),
        body: block, cols,
      }))
    } else if (foldable && block.length > threshold) {
      if (state.foldEnabled === false) {
        // Folding fully off — content already fully visible; a "click to
        // collapse" hint would be misleading (toggling has no effect).
        convLines.push(...block)
      } else {
        // EXPANDED thinking/dim long block via the shared component: blank + ▼
        // control at the HEAD, content, 60% cap with a bottom collapse control.
        // DIM blocks must not re-trigger the consecutive-dim folding below
        // (folding stacked on folding — reported regression).
        if (l.color === C.dim) {
          for (const line of block) line._skipDimFold = true
        }
        convLines.push(...renderExpandedBlock({ body: block, foldKey: longKey, state, maxRows, cols, label: `${block.length} lines` }))
      }
    } else {
      convLines.push(...block)
    }
    // Trailing blank after a main-output segment (user request 2026-08-30) —
    // landed after the segment's rendered content.
    if (blankAfter) {
      pushBlank()
      blankAfter = false
    }
  }
  // ── Subagent activity blocks (§7.2 D4) — RUNNING blocks only ──────────────
  // Rendered BEFORE the advisor blocks section. A child's block lives here only
  // while it runs: on completion onToolResult freezes the block into state.lines
  // (subagent-blocks.mjs freezeSubTaskLines) so it scrolls away with the conversation
  // instead of staying pinned above the input box ("ghost" report 2026-08-30).
  // Default folded = header summary line (▶ role#id · model · elapsed · turn
  // n/max | current state) + tail 3 block lines; expanded = shared component
  // (full timeline, 60% screen cap).
  const subEntries = Object.values(state.subTasks ?? {})
  if (subEntries.length > 0) {
    for (const sub of subEntries) {
      // Done blocks are frozen into state.lines by subagent-blocks.mjs (freezeSubTaskLines)
      // and removed from subTasks; a done entry reaching this loop is a leftover
      // (e.g. restored from an old session) — never render it pinned at the tail.
      if (sub.done) continue
      const foldKey = `sub-${sub.key}`
      // Header summary: `[▶ coder#1 · glm-5.3 · 45s · turn 12/100] bash — npm test`
      const icon = sub.approval ? "⏸" : "▶"
      const elapsed = Math.floor(((sub.done ? sub.doneAt : Date.now()) - sub.started) / 1000)
      const modelPart = sub.model ? ` · ${sub.model}` : ""
      const turnPart = sub.maxTurns > 0 ? ` · turn ${sub.turn}/${sub.maxTurns}` : ""
      let statePart
      if (sub.approval) statePart = `等待审批: ${sub.approval}`
      else if (sub.done) {
        statePart = `done ${elapsed}s${sub.lastError ? ` — ${sub.lastError}` : ""}`
      } else if (sub.currentTool) statePart = sub.currentTool
      else statePart = "thinking..."
      const argSummary = sub.currentTool && sub.toolArgs?.command
        ? ` — ${String(sub.toolArgs.command).replace(/\s+/g, " ").trim().slice(0, 60)}`
        : ""
      convLines.push({
        text: `[${icon} ${sub.key}${modelPart} · ${elapsed}s${turnPart}] ${sliceByWidth(statePart + argSummary, Math.max(20, cols - 30))}`,
        color: sub.done ? C.dim : C.tool,
        _foldToggle: foldKey,
      })
      if (isExpanded(state, foldKey)) {
        // Full activity timeline via the shared component (per-kind colors,
        // 60% screen cap — the header control may sit above the viewport once
        // expanded, the capped bottom control stays reachable).
        const body = renderBlockTimeline(sub.blocks, cols)
        convLines.push(...renderExpandedBlock({ body, foldKey, state, maxRows, cols, label: "subagent activity" }))
      } else {
        // Folded: tail 3 non-empty block lines (most recent activity), dim.
        for (const line of foldTailLines(sub.blocks)) {
          convLines.push({ text: `│ ${sliceByWidth(line, cols - 4)}`, color: C.dim })
        }
      }
    }
  }
  if (state.reasoning) {
    // Live thinking streams INSIDE the unified box (user ruling 2026-08-30:
    // "思考过程中为什么不是直接进这个框" — the flat tail render was a
    // pre-fold-era leftover). Same folded form as flushed blocks: named header
    // + tail 3, click expands to the 60%-capped live view. The buffer grows
    // per token; convCacheKey already includes state.reasoning.length so the
    // box updates live. Single instance key — one live stream at a time; on
    // flush the block re-keys to `long-{idx}` with the identical form (seamless).
    const liveKey = "thinking-live"
    const body = []
    for (const wrapped of wrapText(sanitizeDisplay(state.reasoning), cols - 1)) {
      body.push({ text: wrapped, color: C.reason, _skipDimFold: true })
    }
    const expanded = isExpanded(state, liveKey)
    if (expanded) {
      convLines.push(...renderExpandedBlock({ body, foldKey: liveKey, state, maxRows, cols, label: "thinking (streaming)" }))
    } else {
      convLines.push(...renderFoldedHead({
        header: foldHintLine(`▶ thinking · ${body.length} lines — click to expand`, liveKey),
        body,
      }))
    }
  }
  const advisorBlocks = state._advisorBlocks ?? []
  if (advisorBlocks.length > 0) {
    // ── Advisor review block (2026-08-30): collapsible in-conversation box ──
    // The live stream used to render flat into the conversation and flooded it
    // (user report). Same interaction as subagent blocks: default FOLDED =
    // header (running/done + total line count) + tail 3 block lines; expanded =
    // shared component (▼ control + ordered per-kind timeline — think/tool/text
    // colors kept, T-F regression; placeholder markers stripped in every view —
    // unified with the folded tail which always stripped them). Toggle key
    // `advisor-blocks` (single instance — one advisor runs at a time).
    const advKey = "advisor-blocks"
    // Total rendered line count of the timeline (cheap: rough split, no wrap math)
    const advLineCount = advisorBlocks.reduce((n, b) => n + sanitizeDisplay(b.text).split("\n").filter((l) => l.trim()).length, 0)
    const advHeader = `[advisor · review] ${advLineCount} lines`
    if (isExpanded(state, advKey)) {
      const body = renderBlockTimeline(advisorBlocks, cols, { strip: [ADVISOR_THINKING_PLACEHOLDER] })
      convLines.push(...renderExpandedBlock({ body, foldKey: advKey, state, maxRows, cols, label: advHeader }))
    } else {
      // Folded: header control line + tail 3 non-empty lines from the tail
      // blocks (most recent activity), dim — mirrors the subagent block fold.
      convLines.push({
        text: `▶ ${advHeader} — click to expand`,
        color: C.fold,
        _foldToggle: advKey,
      })
      for (const line of foldTailLines(advisorBlocks, 3, { strip: [ADVISOR_THINKING_PLACEHOLDER] })) {
        convLines.push({ text: `│ ${sliceByWidth(line, cols - 4)}`, color: C.dim, _skipDimFold: true })
      }
    }
  }
  if (state.streaming) {
    // Main-output breathing room (2026-08-30): the streaming path renders OUTSIDE
    // the line loop (the reply is still in its buffer, not yet in state.lines),
    // so the loop's leading blank never applied — a streamed reply showed no
    // blank until flush landed it in lines and a later frame re-rendered. Apply
    // the same leading blank here (the trailing blank belongs to the line path
    // once flushed — mid-stream there is still content to come).
    if (convLines.at(-1)?.text !== "") convLines.push({ text: "", color: C.text })
    // Rendered BEFORE formatTables — see fold-block.mjs for the width contract.
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
          // FOLDED — unified named-header + last-3 form (same ruling as the
          // long-message fold above).
          folded.push(...renderFoldedHead({
            header: foldHintLine(`▶ tool output · ${blockLen} lines — click to expand`, foldKey),
            body: convLines.slice(i, j), cols,
          }))
          i = j
          continue
        }
        // EXPANDED consecutive-dim block via the shared component: blank + ▼ at
        // the HEAD, then every line, 60% cap with a bottom collapse control.
        // foldEnabled=false → raw block, no hint (toggling would be a no-op).
        if (state.foldEnabled === false) {
          for (let k = i; k < j; k++) folded.push(convLines[k])
        } else {
          folded.push(...renderExpandedBlock({ body: convLines.slice(i, j), foldKey, state, maxRows, cols, label: `${blockLen} lines` }))
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

export function countConvLines(state, cols, maxRows) {
  return buildConvLines(state, cols, maxRows).length
}

export { buildConvLines }

export function renderConversation(state, cols, visibleH, scroll, maxRows) {
  const convLines = buildConvLines(state, cols, maxRows)
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
