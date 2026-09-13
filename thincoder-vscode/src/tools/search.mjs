/**
 * search.mjs — File search tools: glob, grep
 *
 * 2026-09-06: grep + glob made self-contained (pure Node fs walk) — they previously used
 * `vscode.workspace.findFiles`, whose VS Code extension-host backend spawns the bundled
 * ripgrep binary; on this dev machine that spawn intermittently fails with `ENOENT` even
 * though rg.exe exists (asar.unpacked path resolution under the extension host). Pure Node
 * walk has zero VS Code search-API dependency (same approach as the CLI's system.mjs).
 */

import { readFile, readdir, stat } from "node:fs/promises"
import { join, isAbsolute } from "node:path"
import { DESC } from "./shared.mjs"

/** Resolve a user-supplied path against the working directory (absolute wins). */
function resolvePath(p, cwd) {
  if (isAbsolute(p)) return p
  return join(cwd, p)
}

/** Normalize CRLF to LF so line matching is consistent across platforms. */
function normalizeEOL(text) {
  return text.replace(/\r\n/g, "\n")
}

/** Cap output length (matches the CLI's shared truncate shape). */
function truncate(text, max = 200_000) {
  if (text.length <= max) return text
  return text.slice(0, max) + `\n[... truncated: ${text.length - max} chars omitted — redirect to a file if you need the full output]`
}

/** Directories never descended into (glob + grep + any recursive walk). */
const IGNORED_DIRS = new Set(["node_modules", ".git", "dist", "build", ".turbo", "coverage"])

/** Escape a string for literal regex matching (grep literal=true). */
function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

/** Glob dialect (TOOLS.md §17 — 2026-09-06, CLI shared.mjs parity): `{a,b}` brace
 *  expansion is handled BEFORE the sentinel/escape flow (braces must not be
 *  literal-escaped — a bare "star-star slash star .{js,txt}" pattern previously
 *  escaped to a literal that silently matched nothing). Unsupported extglob
 *  dialects (`?(x)`/`@(a|b)`/`+(x)`/`*(x)`/`!(x)`) and malformed braces (empty
 *  `{}`, unclosed `{`, nested `{a,{b,c}}`) are EXPLICIT errors — never a silent
 *  no-match. Exclude prefixes (`!pattern`) are the CALLER's job: the glob/grep
 *  tools whitespace-split the pattern expression (splitGlobPatterns — never inside
 *  a brace group) and pass the parts to compileGlobMatchers (include∩!exclude). */
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

/** Recursively yield files under a dir (skip IGNORED_DIRS and symlinks — symlinked dirs
 *  would infinite-loop). rel is the slash-separated path relative to the walk root. */
async function* walkFiles(target, rel = "") {
  let entries
  try {
    entries = await readdir(target, { withFileTypes: true })
  } catch {
    return
  }
  for (const e of entries) {
    if (e.isSymbolicLink()) continue
    if (e.isDirectory() && IGNORED_DIRS.has(e.name)) continue
    const relPath = rel ? `${rel}/${e.name}` : e.name
    if (e.isDirectory()) {
      yield* walkFiles(join(target, e.name), relPath)
    } else {
      yield { abs: join(target, e.name), rel: relPath }
    }
  }
}

export const globTool = {
  name: "glob",
  readonly: true,
  description: DESC("glob"),
  parameters: {
    type: "object",
    properties: {
      pattern: { type: "string", description: "Glob pattern — supports **, *, ?, [..], {a,b} braces, and space-separated exclusion (\"**/*.js !test/**\")" },
      path: { type: "string", description: "Directory to search in" },
    },
    required: ["pattern"],
  },
  async execute({ pattern, path: dir }, ctx) {
    const base = dir ? resolvePath(dir, ctx.cwd) : ctx.cwd
    let match
    try {
      const parts = splitGlobPatterns(pattern)
      if (parts.length === 0) return "Error: pattern is required"
      match = compileGlobMatchers(parts).test
    } catch (e) {
      return `glob error: invalid pattern /${pattern}/: ${e.message}`
    }
    const results = []
    // If the base is a file, match it directly; else walk.
    try {
      const s = await stat(base)
      if (!s.isDirectory()) {
        const name = base.split(/[\\/]/).pop()
        if (match(name)) return truncate([name].join("\n"))
        return "(no matches)"
      }
    } catch {
      return `glob error: path not found: ${base}`
    }
    for await (const { rel } of walkFiles(base)) {
      if (match(rel)) {
        results.push(rel)
        if (results.length >= 1000) break
      }
    }
    if (results.length === 0) return "(no matches)"
    return truncate(results.sort().join("\n"))
  },
}

export const grepTool = {
  name: "grep",
  readonly: true,
  description: DESC("grep"),
  parameters: {
    type: "object",
    properties: {
      pattern: { type: "string", description: "Regular expression, or a literal string when literal=true" },
      path: { type: "string", description: "Directory or file to search" },
      glob: { type: "string", description: "File glob filter — supports **, *, ?, [..], {a,b} braces and space-separated exclusion (\"**/*.js !test/**\")" },
      ignoreCase: { type: "boolean", description: "Case-insensitive match (default false)" },
      literal: { type: "boolean", description: "Literal string match — no regex interpretation (default false)" },
    },
    required: ["pattern"],
  },
  async execute(args, ctx) {
    const { pattern, path: dir, glob: fileGlob, ignoreCase, literal } = args
    const base = dir ? resolvePath(dir, ctx.cwd) : ctx.cwd
    let regex
    try {
      const pat = literal ? escapeRegExp(String(pattern)) : pattern
      regex = new RegExp(pat, ignoreCase ? "i" : "")
    } catch (e) {
      return `grep error: invalid pattern /${pattern}/: ${e.message}`
    }
    let fileTest = null
    if (fileGlob) {
      try {
        const parts = splitGlobPatterns(fileGlob)
        if (parts.length > 0) fileTest = compileGlobMatchers(parts).test
      } catch (e) {
        return `grep error: invalid glob /${fileGlob}/: ${e.message}`
      }
    }
    const hits = []
    async function search(abs) {
      try {
        const fst = await stat(abs)
        if (fst.size > 10_000_000) return // large-file guard: prevent OOM
        const text = normalizeEOL(await readFile(abs, "utf8"))
        const lines = text.split("\n")
        for (let i = 0; i < lines.length; i++) {
          if (regex.test(lines[i])) {
            hits.push(`${abs}:${i + 1}: ${lines[i]}`)
            if (hits.length >= 200) return
          }
        }
      } catch {
        /* skip unreadable/binary */
      }
    }
    // File target: search it directly. Dir target: walk.
    let rootStat = null
    try { rootStat = await stat(base) } catch { return `grep error: path not found: ${base}` }
    if (rootStat.isDirectory()) {
      for await (const { abs, rel } of walkFiles(base)) {
        if (fileTest && !fileTest(rel)) continue
        await search(abs)
        if (hits.length >= 200) break
      }
    } else {
      if (!fileTest || fileTest(base.split(/[\\/]/).pop())) {
        await search(base)
      }
    }
    if (hits.length === 0) return "(no matches)"
    if (hits.length > 200) return hits.slice(0, 200).join("\n") + `\n\n[... ${hits.length - 200} more matches truncated]`
    return hits.join("\n")
  },
}
