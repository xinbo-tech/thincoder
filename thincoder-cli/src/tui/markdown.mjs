/**
 * markdown.mjs — lightweight inline markdown rendering for the TUI display layer.
 *
 * Zero dependencies, display-only: turns raw markdown markers into ANSI styling so
 * model replies stop showing literal `**`, `##`, backtick markers (IK5VW3).
 *
 * Design constraints:
 * - Display-only rendering. renderMarkdownHeading handles multi-line input
 *   (splits internally); renderMarkdownInline expects single lines (its
 *   regexes use [^*\n]+ — no cross-line matches). Callers pass pre-wrapped
 *   lines so the inserted ANSI never skews width math.
 * - Uses narrow-scope SGR resets (22 = bold off, 24 = underline off, 29 = strikethrough off)
 *   instead of reset(0), so the line's base color (C.text etc.) survives.
 * - Code spans are extracted FIRST: anything inside backticks is styled as code and
 *   its `**`/`__` markers are NOT interpreted (markdown semantics).
 * - Unclosed markers are left as-is (streaming safety: mid-token `**bo` renders literally).
 */

const BOLD = "\x1b[1m"
// NOTE: \x1b[22m resets BOTH bold and faint/dim (SGR 2). Today no C.reason
// (dim) line passes through markdown rendering (reasoning/think blocks skip
// it), so this is latent — if dim text ever gains markdown, bold segments
// would clear the dim effect after them.
const BOLD_OFF = "\x1b[22m"
const UNDERLINE = "\x1b[4m"
const UNDERLINE_OFF = "\x1b[24m"
const STRIKE = "\x1b[9m"
const STRIKE_OFF = "\x1b[29m"

/** Render inline markers on a single text line: `code` spans, **bold**, __bold__, ~~strike~~. */
export function renderMarkdownInline(line) {
  // Single underscore lines (snake_case identifiers) must short-circuit too —
  // __bold__ needs a DOUBLE underscore; a lone "_" would otherwise run the
  // whole split/replace pipeline for nothing.
  if (!line || (line.indexOf("*") === -1 && line.indexOf("`") === -1 && line.indexOf("__") === -1 && line.indexOf("~") === -1)) {
    return line
  }

  // Split on backticks: even indexes are plain text (bold/strike processed),
  // odd indexes are code spans (styled as-is, markers inside untouched).
  const parts = line.split("`")
  let out = ""
  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 1) {
      out += UNDERLINE + parts[i] + UNDERLINE_OFF
    } else {
      out += parts[i]
        .replace(/\*\*([^*\n]+)\*\*/g, `${BOLD}$1${BOLD_OFF}`)
        .replace(/__([^_\n]+)__/g, `${BOLD}$1${BOLD_OFF}`)
        .replace(/~~([^~\n]+)~~/g, `${STRIKE}$1${STRIKE_OFF}`)
    }
  }
  return out
}

/** Render heading markers: strip leading `#` markers and bold the heading.
 *  Inline markers inside the heading are stripped too — the heading is already
 *  fully bold, so `**bold**` inside it would wrap another bold sequence whose
 *  `\x1b[22m` turns bold OFF for the rest of the heading text.
 *  Line-by-line (split on \n): without the m flag, `^`/`$` anchor the whole
 *  string, so a multi-line input never matched and headings stayed raw —
 *  the old call sites passed single wrapped lines and hid the defect.
 *  Returns the original text when no line is a heading. */
export function renderMarkdownHeading(line) {
  return line.split("\n").map((l) => {
    const m = /^\s{0,3}(#{1,6})\s+(.*)$/.exec(l)
    if (!m || !m[2]) return l
    return `${BOLD}${m[2].replace(/\*\*|__|~~/g, "")}${BOLD_OFF}`
  }).join("\n")
}
