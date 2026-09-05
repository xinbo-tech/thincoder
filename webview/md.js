/**
 * md.js — zero-dependency markdown → HTML renderer
 *
 * SECURITY: raw model/user text is NEVER trusted as HTML. The renderer extracts
 * the constructs that legitimately emit their own HTML (fenced code blocks,
 * tables, blockquotes, lists) into placeholders FIRST (their content goes through
 * an escaping inline pass), then HTML-escapes the entire remaining text so that any
 * bare `<tag>` / `<img onerror>` / `<script>` the model emits is rendered as literal
 * text instead of executing. Markdown syntax chars (`*`,`_`,`#`,`-`,`` ` ``, `[`,
 * `]`,`(`,`)`,`|`, `>`, `~`, `\`) are NOT in the escape set, so structure survives;
 * capture groups are re-inserted already-escaped (no double-escape).
 *
 * fenced-code content is escaped by highlight.js; table/blockquote/list text is
 * escaped per-cell/per-line by mdInline. URL schemes are restricted by safeUrl().
 */

import { highlight, normalizeLang } from "./highlight.js"

/** Characters a backslash may escape (mirrors the markdown syntax set). A backslash
 *  followed by one of these becomes the literal char.
 *
 *  Important: by the time inline() runs, the text has already been esc()'d, so a
 *  `\>` has become `\&gt;`, `\<` → `\&lt;`, `\&` → `\&amp;`, `\"` → `\&quot;`. The
 *  regex therefore ALSO matches those escaped forms, so the backslash is still
 *  consumed and the entity (which renders as the literal char) is restored. */
const ESCAPABLE = /\\([*_`~#\\.\-+\\|>[\]()!]|&(?:lt|gt|amp|quot);)/g

/**
 * Inline pass: run markdown inline syntax over already-escaped text `s`, OR over a
 * raw string when `raw=true` (escaping it first). Returns HTML. The input must never
 * contain raw `<`, `>`, `&` — callers either pre-escape or pass `raw` so we escape.
 */
function inline(s) {
  // 1. Protect backslash-escaped chars (\* → *, \| → |, …) with placeholders so the
  //    following regex steps don't reinterpret them. The placeholder survives to the
  //    end and is restored as the literal char.
  const escp = []
  let t = s.replace(ESCAPABLE, (m) => { const i = escp.length; escp.push(m.slice(1)); return `\x00E${i}\x00` })

  // 2. Inline code FIRST (so its content isn't reprocessed by bold/italic/link).
  t = t.replace(/`([^`]+)`/g, (_, m) => `<code>${m}</code>`)

  // 3. Images + links (URL scheme-checked).
  t = t.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, src) => `<img src="${safeUrl(src)}" alt="${alt}">`)
  t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, a, href) => `<a href="${safeUrl(href)}">${a}</a>`)

  // 4. Bold + italic (three-layer nesting before two+one).
  t = t.replace(/\*\*\*(.+?)\*\*\*/g, (_, m) => `<strong><em>${m}</em></strong>`)
  t = t.replace(/\*\*(.+?)\*\*/g, (_, m) => `<strong>${m}</strong>`)
  t = t.replace(/(?<!\*)\*([^*\n]+?)\*(?!\*)/g, (_, m) => `<em>${m}</em>`)

  // 5. Strikethrough.
  t = t.replace(/~~([^~]+)~~/g, (_, m) => `<s>${m}</s>`)

  // 6. Restore backslash-escaped literals.
  t = t.replace(/\x00E(\d+)\x00/g, (_, i) => escp[+i])
  return t
}

/** Full markdown → HTML */
export function md(raw) {
  if (!raw) return ""

  const blocks = []

  // 1. Fenced code blocks → placeholders (code HTML escaped by highlight()).
  let text = String(raw)
  text = text.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const i = blocks.length
    const norm = normalizeLang(lang)
    const l = lang ? `<span class="code-lang">${esc(lang)}</span>` : ""
    const hl = highlight(code.trimEnd(), norm)
    blocks.push(`<pre class="code-block">${l}<code>${hl}</code></pre>`)
    return `\x00B${i}\x00`
  })

  // 2. Tables → placeholders (cells escaped via inline).
  text = text.replace(/^\|(.+)\|\n\|[-| :]+\|\n((?:\|.+\|\n?)+)/gm, (match) => {
    const i = blocks.length
    blocks.push(renderTable(match))
    return `\x00B${i}\x00`
  })

  // 3. Blockquotes → placeholders (content escaped via inline, line-wrapped).
  text = text.replace(/(?:^> ?[^\n]*(?:\n|$))+/gm, (x) => {
    const i = blocks.length
    blocks.push(renderBlockquote(x))
    return `\x00B${i}\x00`
  })

  // 4. Lists (incl. task lists + nesting) → placeholders (content escaped via inline).
  text = text.replace(/((?:^[ \t]*(?:[-*+]|\d+[.)])\s+(?:\[[ xX]\]\s+)?[^\n]*(?:\n|$)))+/gm, (x) => {
    const i = blocks.length
    blocks.push(renderList(x))
    return `\x00B${i}\x00`
  })

  // 5. HTML-escape everything that remains — bare <script>, event handlers, any tag
  //    the model emitted but no block construct captured. This is the actual XSS guard.
  text = esc(text)

  // 6. Headers (h1–h6).
  text = text.replace(/^###### (.+)$/gm, (_, m) => `<h6>${m}</h6>`)
  text = text.replace(/^##### (.+)$/gm, (_, m) => `<h5>${m}</h5>`)
  text = text.replace(/^#### (.+)$/gm, (_, m) => `<h4>${m}</h4>`)
  text = text.replace(/^### (.+)$/gm, (_, m) => `<h3>${m}</h3>`)
  text = text.replace(/^## (.+)$/gm, (_, m) => `<h2>${m}</h2>`)
  text = text.replace(/^# (.+)$/gm, (_, m) => `<h1>${m}</h1>`)

  // 7. Inline pass over non-block text (esc+bold/italic/strike/code/link/image).
  text = inline(text)

  // 8. Horizontal rules (before the <p> wrapper turns `---` into text).
  text = text.replace(/^---+$/gm, "<hr>")

  // 9. Paragraphs + line breaks.
  text = text.replace(/\n\n+/g, "</p><p>")
  text = "<p>" + text + "</p>"
  text = text.replace(/<p>\s*<\/p>/g, "")

  // 10. Single newline → <br>.
  text = text.replace(/\n/g, "<br>")

  // 11. Restore placeholders (fenced code / table / blockquote / list).
  text = text.replace(/\x00B(\d+)\x00/g, (_, i) => blocks[+i] || "")

  // 12. Empty <p> wrapper around block-level results is noise — strip it so block
  //     constructs (ul/ol/table/blockquote/headings/hr) aren't wrapped in a bare <p>
  //     (a browser implicitly closes <p> before a block element, leaving an empty
  //     <p> with a margin gap). advisory #1.
  text = text
    .replace(/<p>(<(?:ul|ol|table|blockquote|h[1-6]|hr)[^]*?)<\/p>/g, "$1")
    .replace(/<p>\s*&nbsp;\s*<\/p>/g, "")

  return text
}

/** Inline-only render (table cells, user messages). Same guard: escape first, then
 *  build. Input is a single untrusted string. */
export function mdInline(s) {
  return inline(esc(s))
}

/** HTML-escape the five characters that matter in text/attribute context. */
export function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

/** Restrict URL schemes to ones that cannot run script: block javascript:/data:/
 *  vbscript:/file:. Allow http(s), mailto, anchor + relative paths. Used for
 *  `<a href>` and `<img src>` — script-capable schemes must never reach the DOM. */
function safeUrl(url) {
  const u = String(url ?? "").trim()
  if (!u) return ""
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(u)) {
    const scheme = u.slice(0, u.indexOf(":")).toLowerCase()
    if (!["http", "https", "mailto"].includes(scheme)) return "#"
  }
  return u
}

// ─── Block helpers ─────────────────────────────

/** Render a table block to HTML. Cells go through inline() (already escaped), but the
 *  raw table text is unescaped here — so each cell is escaped by inline's raw path.
 *  Caller wraps the result as a placeholder in blocks[]. */
function renderTable(raw) {
  const lines = raw.trim().split("\n")
  if (lines.length < 2) return esc(raw)

  const parseRow = (line) =>
    line
      .replace(/^\||\|$/g, "")
      // Escaped pipe (\| = literal |) must not split the cell — placeholder first.
      .replace(/\\\|/g, "\uE000P\uE000")
      .split("|")
      .map((c) => c.replace(/\uE000P\uE000/g, "|").trim())

  const header = parseRow(lines[0])
  const body = lines.slice(2).map(parseRow)

  let html = "<table>"
  html += "<thead><tr>" + header.map((h) => `<th>${inline(esc(h))}</th>`).join("") + "</tr></thead>"
  html += "<tbody>"
  for (const row of body) {
    html += "<tr>" + row.map((c) => `<td>${inline(esc(c))}</td>`).join("") + "</tr>"
  }
  html += "</tbody></table>"
  return html
}

/** Render a blockquote block: strip leading "> " from each line, join, escape+inline.
 *  Nested "> >" is not supported (thinworker doesn't either) — lines collapse. */
function renderBlockquote(raw) {
  const inner = raw
    .replace(/^> ?/gm, "")
    .replace(/\n+/g, " ")
    .trim()
  return `<blockquote>${inline(esc(inner))}</blockquote>`
}

const LIST_LINE = /^([ \t]*)([-*+]|\d+[.)])\s+(?:\[([ xX])\]\s+)?(.*)$/

/** Render a contiguous list block (top level only — caller passes exactly the lines
 *  that belong to one list). Handles unordered/ordered, task items, and nested lists
 *  via recursion on indentation. Returns raw HTML (caller wraps as a placeholder).
 *  Indentation is measured in spaces (tabs → 2). */
function renderList(block) {
  const rawLines = block.split("\n")
  let i = 0
  // Measure the base indent from the FIRST line that is a list item.
  let base = null
  for (const l of rawLines) {
    const m = l.match(LIST_LINE)
    if (m) { base = indentOf(m[1]); break }
  }
  if (base === null) return esc(block)

  const isOl = /^\s*\d+[.)]\s+/.test(rawLines.find((l) => LIST_LINE.test(l)) ?? "")
  let html = isOl ? "<ol>" : "<ul>"

  while (i < rawLines.length) {
    const m = rawLines[i].match(LIST_LINE)
    if (!m) { i++; continue }
    const cur = indentOf(m[1])
    if (cur < base) break // parent list ended (shouldn't happen — caller scoped it)
    // Nested items belong to a deeper level: collect them recursively.
    if (cur > base) {
      // Should be collected by the parent's sub-pass; defensive skip.
      i++
      continue
    }
    // Compute the sub-list: all following lines indented more than base.
    const sub = []
    let j = i + 1
    while (j < rawLines.length) {
      const sm = rawLines[j].match(LIST_LINE)
      if (!sm) { j++; continue }
      if (indentOf(sm[1]) <= base) break
      sub.push(rawLines[j]); j++
    }
    const isTask = m[3] !== undefined
    const checked = m[3] === "x" || m[3] === "X"
    const text = m[4] ?? ""
    const content = isTask
      ? `<input type="checkbox" disabled${checked ? " checked" : ""} class="task-check">`
      : ""
    html += "<li>" + content + inline(esc(text))
    if (sub.length > 0) html += renderList(sub.join("\n") + "\n")
    html += "</li>"
    i = j
  }
  html += isOl ? "</ol>" : "</ul>"
  return html
}

/** Measure a leading-indent string in spaces (tab = 2). */
function indentOf(indent) {
  return String(indent ?? "").replace(/\t/g, "  ").length
}
