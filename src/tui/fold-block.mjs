/**
 * fold-block.mjs — 公共可折叠区块渲染组件（2026-08-30，自 render-conversation.mjs 抽出）。
 *
 * 背景（用户报告）：折叠区块展开后长度不受限——超长区块展开时折叠控制行被挤出
 * 屏幕，点不到、收不回。本组件统一所有可折叠区块的「展开态」渲染并施加
 * **屏幕高度 60% 的展开封顶**：封顶时在区块底部渲染第二个折叠控制行——区块
 * 最高占屏 60%，底控件必落在视口内，展开永远可逆。
 *
 * 消费方（render-conversation.mjs 六处折叠点）：
 *   1. 子agent 活动区块（运行中 / 冻结，AGENT-LOOP §7.2 D4）
 *   2. advisor 评审块（运行中 _advisorBlocks / 冻结 _frozenAdvisor）
 *   3. 长消息折叠（long-N）/ 连续 dim 折叠（fold-N）
 *
 * 分工边界：折叠态有两种既有形态（头部+tail3 / 前4+中置▶+末行），由调用方
 * 保留各自语义；本组件统一展开态、封顶、控制行、tail 提取、blocks→行时间线。
 */
import { C } from "./ansi.mjs"
import { formatTables, sanitizeDisplay, sliceByWidth, stringWidth, wrapText } from "./render.mjs"
import { renderMarkdownInline, renderMarkdownHeading } from "./markdown.mjs"
import { renderMathInline, renderMathBlock } from "./math.mjs"

/** Expanded-section height cap: 60% of the terminal's row count (user ruled
 *  2026-08-30 — the collapse control must stay reachable after expanding).
 *  rows unknown (tests / odd environments) → Infinity = uncapped. */
export function foldCapRows(rows) {
  if (!rows) return Infinity
  return Math.max(1, Math.floor(rows * 0.6))
}

/** Fold-state read, single source: foldEnabled===false (unfold-all mode) forces
 *  every block expanded; otherwise the per-block key decides. */
export function isExpanded(state, foldKey) {
  return state.foldEnabled === false || (state.expandedBlocks?.has(foldKey) ?? false)
}

/** Bidirectional toggle (mouse click / future keyboard path share this). */
export function toggleFoldBlock(state, foldKey) {
  state.expandedBlocks ??= new Set()
  if (state.expandedBlocks.has(foldKey)) state.expandedBlocks.delete(foldKey)
  else state.expandedBlocks.add(foldKey)
}

/** 块内滚动：展开态窗口起点（2026-08-31 用户需求——60% 封顶保留、块内可滚动读全文）。
 *  存在 = state._foldScroll: Map<foldKey, offset>（渲染读、点击/滚轮写）。 */
export function foldScrollOffset(state, foldKey) {
  return state._foldScroll?.get(foldKey) ?? 0
}

/** 块内滚动步长：▲/▼ 控制行 = 一整窗（winH）；滚轮 = 3 行（与外部会话滚动节拍一致）。
 *  dir=+1 向下（offset 增）、-1 向上。 */
export function scrollFoldBlock(state, foldKey, dir, step) {
  state._foldScroll ??= new Map()
  const prev = state._foldScroll.get(foldKey) ?? 0
  const next = Math.max(0, prev + dir * Math.max(1, Math.floor(step)))
  state._foldScroll.set(foldKey, next)
  return next
}

/** Fold marker line: bold-cyan icon + "click to …" phrase underlined (clickable affordance).
 *  No indent — flush with the content below it; callers add a blank line BEFORE the
 *  expanded-state control so it stands apart from unrelated content (reported UX). */

/** Extract the last ≤n non-empty lines across the trailing blocks (folded-tail
 *  preview). Shared by subagent/advisor folded forms — was 3 hand-written copies
 *  in render-conversation (P1 收编, 2026-08-30). */
export function foldTailLines(blocks, n = 3, { strip = [] } = {}) {
  const out = []
  for (let bi = blocks.length - 1; bi >= 0 && out.length < n; bi--) {
    let text = sanitizeDisplay(blocks[bi].text ?? "")
    for (const marker of strip) text = text.replaceAll(marker, "")
    const lines = text.split("\n").filter((l) => l.trim())
    for (let li = lines.length - 1; li >= 0 && out.length < n; li--) out.unshift(lines[li])
  }
  return out
}

export function foldHintLine(text, foldKey, srcIdx) {
  const withUnderline = text.replace(/(click to (?:expand|collapse))/, "\x1b[4m$1\x1b[24m")
  return { text: withUnderline, color: C.fold, _foldToggle: foldKey, _src: srcIdx }
}

/**
 * FOLDED-state rendering — the unified other half of the interaction (2026-08-30
 * user ruling: EVERY collapsible section folds to "named header + last 3 lines,
 * expands to a 60%-capped view"). Replaces the legacy long-message form
 * [first 4, ▶ at the ellipsis, last 1] whose anonymous "… N more lines" header
 * read as orphaned segments in the scrollback (user report 2026-08-30).
 * header: the caller's control/summary line ({text, color, _foldToggle}) —
 * subagent/advisor keep their bracket identity headers, long-message folds get
 * `▶ <kind> · N lines — click to expand`. Tail rows are dimmed and carry
 * _skipDimFold (never re-enter the consecutive-dim folder).
 */
export function renderFoldedHead({ header, body, tailLines = 3, cols = 80 }) {
  const tail = body
    .filter((l) => l.text && l.text.trim())
    .slice(-tailLines)
    .map((l) => ({
      ...l,
      text: sliceByWidth(`│ ${l.text.replace(/^(?:│ ?| {2}│ ?| {2})/, "")}`, cols - 2),
      color: C.dim,
      _skipDimFold: true,
    }))
  return [header, ...tail]
}

/** Blank separator before a fold control line (uncolored — must not join consecutive-dim folding). */
export function blankLine() {
  return { text: "", color: "" }
}

/**
 * Render markdown markers to ANSI, then pad the line tail back to the pre-render
 * display width (moved from render-conversation.mjs — see that file's history for
 * the formatTables misalignment incident this compensation fixes).
 */
export function renderMarkdownPreservingWidth(text) {
  return text.split("\n").map((line) => {
    const rendered = renderMarkdownInline(renderMarkdownHeading(line))
    const diff = stringWidth(line) - stringWidth(rendered)
    return diff > 0 ? rendered + " ".repeat(diff) : rendered
  }).join("\n")
}

// Math runs BEFORE markdown (TUI.md §9.1D): `$...$`/`$$...$$` are opaque to markdown
// (so `x**2` inside a formula isn't misread as bold), and the Unicode approximation
// is measured by renderMarkdownPreservingWidth's width-compensation math.
export function renderMathAndMarkdown(text) {
  return renderMarkdownPreservingWidth(renderMathInline(renderMathBlock(text)))
}

/**
 * blocks[] → colored, guttered, wrapped timeline lines. Shared by subagent
 * (running + frozen) and advisor (live + frozen) blocks — was 4 near-identical
 * copies across render-conversation. Per-kind contract:
 *   think → raw lines (no markdown), C.reason
 *   text  → math+markdown → formatTables, C.text
 *   tool  → formatTables raw, C.tool
 *   meta  → plain lines (no wrap — marker is short), C.dim
 * opts: { gutter = "│ ", pad = 3, stripPlaceholder = false, headBlank = false }
 *   gutter/pad: frozen advisor renders full-width with no gutter (gutter "", pad 1).
 *   stripPlaceholder: advisor streams embed ADVISOR_THINKING_PLACEHOLDER markers —
 *   stripped in every advisor view (live expanded previously kept them; unified).
 *   headBlank: lead with a blank separator line (renderExpandedBlock default form).
 * All lines carry _skipDimFold: true — the consecutive-dim folder must never
 * nest on top of an expanded block (reported stacking regression).
 */export function renderBlockTimeline(blocks, cols, opts = {}) {
  // strip: array of literal substrings removed from every block text (callers
  // pass advisor-specific markers — the component itself has no advisor deps).
  const { gutter = "│ ", pad = 3, strip = [] } = opts
  const out = []
  for (const block of blocks) {
    const color = { think: C.reason, tool: C.tool, text: C.text, meta: C.dim }[block.kind] ?? C.dim
    let source = sanitizeDisplay(block.text ?? "")
    for (const marker of strip) source = source.replaceAll(marker, "")
    if (block.kind === "meta") {
      for (const line of source.split("\n")) out.push({ text: `${gutter}${line}`, color, _skipDimFold: true })
      continue
    }
    const rows = block.kind === "think"
      ? source.split("\n")
      : formatTables(block.kind === "text" ? renderMathAndMarkdown(source) : source, cols - pad)
    for (const line of rows) {
      for (const wrapped of wrapText(line, cols - pad)) {
        out.push({ text: `${gutter}${wrapped}`, color, _skipDimFold: true })
      }
    }
  }
  return out
}

/**
 * EXPANDED-state rendering of one collapsible section — the unified half of the
 * interaction. Layout:
 *   foldEnabled=false → raw body only (hints would lie: toggling is a no-op;
 *                       the 60% cap equally does not apply to unfold-all mode)
 *   body ≤ cap        → [blank] + ▼ control + all body
 *   body > cap        → [blank] + ▼ control + first (cap-4) lines + cap marker +
 *                       ▼ control AT THE BOTTOM (the reachable one — the whole
 *                       point of the cap; the top control may sit above the
 *                       viewport when the block starts off-screen)
 * opts: { body, foldKey, state, maxRows, label, headBlank = true }
 *   body: pre-rendered body lines ({text, color, ...}); label: header phrase
 *   used in both control lines (e.g. "subagent activity", "12 lines");
 *   headBlank=false (tool-args blocks): no leading blank — the args block
 *   belongs tightly to its ❯ title line.
 *
 * LEFT RULE LINE (2026-08-30 user request): every body row gets a `│ ` gutter
 * prefix so the block's content reads as one bordered region, distinct from
 * surrounding conversation. renderExpandedBlock OWNS the gutter: body callers
 * pass RAW rows (no leading `│ `/indent of their own) — double gutters are
 * stripped defensively.
 */
export function renderExpandedBlock({ body, foldKey, state, maxRows, label, cols = 80 }) {
  if (state.foldEnabled === false) return body.slice()
  // Strip caller-side gutters/indents, then apply the single owned gutter.
  // HARD WIDTH BOUND: caller rows may already be cols-1 wide (wrapped at
  // cols-1 upstream); adding the 2-char gutter would overflow by one column —
  // the exact "one char past the border" bug (user report 2026-08-30). The
  // component owns the final width: every row is sliced to cols-2 AFTER the
  // gutter, so the frame never sees an overwide row.
  const lined = body.map((l) => {
    // Empty rows keep the rule line unbroken: a bare "│" (no trailing space)
    // paints the same column without introducing trailing whitespace.
    if (!l.text || !l.text.trim()) return { ...l, text: "│", _skipDimFold: true }
    const raw = l.text.replace(/^(?:│ ?| {2}│ ?| {2})/, "")
    return { ...l, text: sliceByWidth(`│ ${raw}`, cols - 2) }
  })
  const out = [blankLine(), foldHintLine(`▼ … ${label} — click to collapse`, foldKey)]
  const cap = foldCapRows(maxRows)
  if (lined.length <= cap - 5) {
    // 2026-08-31 用户需求：整块（含控制行）≤ 60% 屏时全量显示
    out.push(...lined)
    return out
  }
  // 块高 60% 封顶保留（用户 2026-08-30 拍板），正文改窗口显示（2026-08-31）：
  // 窗口 = cap 内可读行数（扣除 blank+顶部控制+▲+▼+底部收起 = 5 行开销）；
  // ▲/▼ 控制行点击翻窗（_foldScrollUp/_foldScrollDown 标记，mouse.mjs 分派）——
  // 滚动读全文、收起控制行永远在块尾。
  const winH = Math.max(1, cap - 5)
  const total = lined.length
  const offset = Math.min(Math.max(0, foldScrollOffset(state, foldKey)), Math.max(0, total - winH))
  const window = lined.slice(offset, offset + winH).map((l) => ({
    ...l,
    _foldBlock: foldKey, // 2026-08-31 滚轮命中标记：每行自描述所属块（mouse handleWheel 用——无需区间簿记）
  }))
  if (offset > 0) {
    out.push({
      text: `▲ 上方还有 ${offset} 行（点击向上翻窗）`,
      color: C.dim, _skipDimFold: true, _foldScrollUp: foldKey, _foldWindow: winH,
    })
  }
  out.push(...window)
  if (offset + winH < total) {
    out.push({
      text: `▼ 下方还有 ${total - offset - winH} 行（点击向下翻窗）`,
      color: C.dim, _skipDimFold: true, _foldScrollDown: foldKey, _foldWindow: winH,
    })
  }
  out.push(foldHintLine(`▼ … ${label} — click to collapse`, foldKey))
  return out
}
