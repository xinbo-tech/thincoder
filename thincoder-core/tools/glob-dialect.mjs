/**
 * glob-dialect.mjs — glob 方言（TOOLS.md §17 — 2026-09-06）单一权威模块（CLI）。
 *
 * `{a,b}` brace expansion is handled BEFORE the sentinel/escape flow (braces must
 * not be literal-escaped — a bare "star-star slash star .{js,txt}" pattern
 * previously escaped to a literal that silently matched nothing). Unsupported
 * extglob dialects (`?(x)`/`@(a|b)`/`+(x)`/`*(x)`/`!(x)`) and malformed braces
 * (empty `{}`, unclosed `{`, nested `{a,{b,c}}`) are EXPLICIT errors — never a
 * silent no-match. Exclude prefixes (`!pattern`) are the CALLER's job: the
 * glob/grep tools whitespace-split the pattern expression (splitGlobPatterns —
 * never inside a brace group) and pass the parts to compileGlobMatchers, which
 * intersects includes and excludes.
 *
 * Extracted from shared.mjs (2026-09-06 advisor #5 — shared.mjs exceeded the
 * 500-line cap after §17); shared.mjs re-exports these symbols so all existing
 * importers (system.mjs / ls filter / tests) keep their import paths.
 */

const BRACE_OPEN = "\u0003", BRACE_SEP = "\u0004", BRACE_CLOSE = "\u0005"
const EXT_GLOB_RE = /[@?+*!]\(/

export const GLOB_EXTGLOB_ERROR =
  "glob syntax error: unsupported extglob syntax — ?(x)/@(a|b)/+(x)/*(x)/!(x) are not supported; use {a,b} brace expansion or multiple space-separated patterns instead"
export const GLOB_EMPTY_BRACE_ERROR =
  'glob syntax error: empty brace group "{}" — put at least one alternative between the braces (e.g. {js,txt})'
export const GLOB_UNCLOSED_BRACE_ERROR =
  'glob syntax error: unclosed brace group — add a matching "}" (e.g. {js,txt})'
export const GLOB_NESTED_BRACE_ERROR =
  "glob syntax error: nested brace groups are not supported (e.g. {a,{b,c}}) — use a flat alternative list (e.g. {a,b,c})"

function assertNoExtglob(pattern) {
  if (EXT_GLOB_RE.test(pattern)) throw new Error(GLOB_EXTGLOB_ERROR)
}

/** Replace every {a,b,c} group with placeholder alternation markers. Runs BEFORE
 *  the sentinel/escape flow so the inserted alternation survives literal escaping. */
function expandBraces(pattern) {
  for (;;) {
    const open = pattern.indexOf("{")
    if (open === -1) return pattern
    let close = -1
    for (let j = open + 1; j < pattern.length; j++) {
      if (pattern[j] === "{") throw new Error(GLOB_NESTED_BRACE_ERROR)
      if (pattern[j] === "}") { close = j; break }
    }
    if (close === -1) throw new Error(GLOB_UNCLOSED_BRACE_ERROR)
    const inner = pattern.slice(open + 1, close)
    if (inner === "") throw new Error(GLOB_EMPTY_BRACE_ERROR)
    const alts = inner.split(",").map((a) => a.trim())
    pattern = pattern.slice(0, open) + BRACE_OPEN + alts.join(BRACE_SEP) + BRACE_CLOSE + pattern.slice(close + 1)
  }
}

/** Convert a single glob pattern to a RegExp (anchored full match). Supports the
 *  recursive "star-star" forms, single-star, "?", "[..]" character classes and
 *  {a,b} brace expansion. Malformed braces and unsupported extglob syntax throw
 *  explicit errors (no silent mismatch). */
export function globToRegex(pattern) {
  pattern = String(pattern)
  assertNoExtglob(pattern)
  pattern = expandBraces(pattern)
  // Sentinel chars: \u0001/\u0002 never appear in real glob patterns (they
  // come from model output or the filesystem) — safe as **/ and ** placeholders.
  const DS = "\u0001", DP = "\u0002"
  const escaped = pattern
    .replace(/\*\*\//g, DS).replace(/\*\*/g, DP)
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, "[^/]*").replace(/\?/g, "[^/]")
    .replace(new RegExp(DS, "g"), "(?:.+/)?")
    .replace(new RegExp(DP, "g"), ".*")
    .replace(new RegExp(BRACE_OPEN, "g"), "(?:")
    .replace(new RegExp(BRACE_SEP, "g"), "|")
    .replace(new RegExp(BRACE_CLOSE, "g"), ")")
  return new RegExp(`^${escaped}$`)
}

/** Whitespace-split a glob expression into parts WITHOUT splitting inside {a,b}
 *  brace groups and WITHOUT splitting literal spaces inside a single pattern
 *  (2026-09-06 audit F1 / advisor #4): a whitespace run is a pattern separator
 *  ONLY when the next non-space token starts an exclusion ("!" — the §17
 *  "include !exclude" form). So a BARE pattern like "docs/my file/*.md" and an
 *  exclude like "!docs/my file/**" each stay ONE part; the standard
 *  "js-pattern 空格 !test-pattern" form still splits into its two parts. */
export function splitGlobPatterns(expr) {
  const s = String(expr ?? "").trim()
  if (!s) return []
  const parts = []
  let depth = 0
  let cur = ""
  for (let i = 0; i < s.length; i++) {
    const ch = s[i]
    if (ch === "{") depth++
    else if (ch === "}") depth = Math.max(0, depth - 1)
    if (/\s/.test(ch) && depth === 0) {
      let j = i
      while (j < s.length && /\s/.test(s[j])) j++
      if (s[j] === "!") {
        if (cur) { parts.push(cur); cur = "" }
        i = j - 1 // next loop iteration continues at the "!"
        continue
      }
      // literal space inside a pattern (or trailing) — keep it in the current part
      cur += ch
      continue
    }
    cur += ch
  }
  if (cur) parts.push(cur)
  return parts
}

/** Compile whitespace-split pattern parts (see splitGlobPatterns) into a matcher:
 *  non-"!" parts are includes, leading-"!" parts are excludes — a rel path matches
 *  when it matches ≥1 include (or there are no includes) and no exclude. Every
 *  part runs the full brace/error dialect through globToRegex (excludes too). */
export function compileGlobMatchers(parts) {
  const includes = []
  const excludes = []
  for (const p of parts) {
    const part = String(p)
    if (part.startsWith("!")) excludes.push(part.slice(1))
    else if (part !== "") includes.push(part)
  }
  const include = includes.map((p) => globToRegex(p))
  const exclude = excludes.map((p) => globToRegex(p))
  const test = (relPath) =>
    (include.length === 0 || include.some((re) => re.test(relPath))) &&
    !exclude.some((re) => re.test(relPath))
  return { include, exclude, test }
}
