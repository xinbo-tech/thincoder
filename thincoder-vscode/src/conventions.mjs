/**
 * conventions.mjs — the single authority for code / doc / temp path classification,
 * plus the project convention declaration surface (`.thincoder/conventions.json`).
 *
 * Why one module (PORTABILITY VSC mirror · VP-10 ← PO-10/FR12): engineering-mode
 * gates and guards (design gate, review-doc gate, mutation accounting, verify fast
 * path) each carried their own copy of the "what counts as product code" predicate
 * — anchored `^src/` regexes, `docs/` prefix checks, component regexes. Each copy
 * drifted, and each hardcoded THIS repository's layout: a project whose code lives
 * outside `src/` slipped through the design gate silently. One classifier + one
 * declaration file = one truth.
 *
 * Defaults are DATA (`DEFAULT_CODE_PATHS`) — overridable per project through the
 * declaration file. Missing file → pure defaults (no noise); corrupt/unreadable
 * file → defaults + console.warn + a log event (never crash, never swallow).
 *
 * Classification vocabulary:
 *   code — inside a declared code segment (default: the path segment `src`), or
 *          not a documentation extension;  doc — documentation extension outside
 *          any code segment;  temp — tmp-* name or .tmp/.temp extension.
 *
 * Semantics are shared with the CLI authority (thincoder-cli/src/conventions.mjs) —
 * two independent implementations, one vocabulary (双端镜像纪律：各端独立实现、
 * 语义同源；不做 byte-identical).
 */
import { readFileSync } from "node:fs"
import { join, resolve } from "node:path"
import { logEvent } from "@thincoder/core/log.mjs"

/** Default code-path segments (data, not logic — a project may replace them). */
export const DEFAULT_CODE_PATHS = ["src"]

/** Project declaration file, relative to the project root. */
export const CONVENTIONS_REL_PATH = ".thincoder/conventions.json"

/** Documentation predicate (moved here verbatim from advisor/repos.mjs — one copy). */
const DOC_FILE = /(?:^|[/\\])(?:LICENSE|NOTICE|CHANGELOG|AUTHORS)(?:\.\w+)?$|\.(?:md|markdown|mdx|txt|rst|adoc)$/i

/** Temp/scratch predicate (moved here verbatim from advisor/repos.mjs). */
const TEMP_FILE = /(?:^|[/\\])tmp-[^/\\]+$|\.(?:tmp|temp)$/i

/** True when a path is a throwaway temp file (tmp-* name or .tmp/.temp ext). */
export function isTempPath(p) {
  return TEMP_FILE.test(p ?? "")
}

/** Path → segments (both separators accepted; absolute and relative alike). */
function segmentsOf(p) {
  return String(p ?? "").replace(/\\/g, "/").split("/").filter(Boolean)
}

/**
 * True when the path contains a declared code segment sequence at any depth.
 * Segment matching (not a prefix anchor) is what closes the nested-layout hole:
 * `packages/foo/src/x.md` is product code, not a document. Comparison is
 * case-insensitive — on case-insensitive filesystems `Src/x.mjs` is the same
 * directory, and the gate must not be bypassable by casing.
 */
function hasCodeSegment(p, conv) {
  const parts = segmentsOf(p).map((s) => s.toLowerCase())
  const wanted = conv?.codePaths ?? DEFAULT_CODE_PATHS
  for (const entry of wanted) {
    const want = segmentsOf(entry).map((s) => s.toLowerCase())
    if (want.length === 0) continue
    for (let i = 0; i + want.length <= parts.length; i++) {
      if (want.every((seg, j) => parts[i + j] === seg)) return true
    }
  }
  return false
}

/** "code" | "doc" | "temp" — the single classification decision.
 *  Precedence: code segment first (src/** stays product code even when the name
 *  looks scratch — the pre-existing unconditional-src rule), then temp, then a
 *  documentation extension, else code (anything not doc/temp is product code). */
export function classifyPath(p, conv) {
  const s = String(p ?? "")
  if (hasCodeSegment(s, conv)) return "code"
  if (TEMP_FILE.test(s)) return "temp"
  if (DOC_FILE.test(s)) return "doc"
  return "code"
}

/** True when the path is product code (see classifyPath for the precedence). */
export function isCodePath(p, conv) {
  return classifyPath(p, conv) === "code"
}

/** True when the path is a documentation file — a doc extension that does NOT
 *  live inside a declared code segment (src/prompts/*.md is product code). */
export function isDocPath(p, conv) {
  const s = String(p ?? "")
  return DOC_FILE.test(s) && !hasCodeSegment(s, conv)
}

// ─────────────────────────────────────────────────────────────────────────────
// Declaration loading (cached per project root — `clearConventionsCache()` is
// the test seam; declaration files change rarely and only at session scope).
// ─────────────────────────────────────────────────────────────────────────────

function normalizeExtensions(v) {
  if (!Array.isArray(v)) return []
  const out = []
  for (const e of v) {
    if (typeof e !== "string") continue
    const t = e.trim().toLowerCase()
    if (!t) continue
    const ext = t.startsWith(".") ? t : `.${t}`
    if (!out.includes(ext)) out.push(ext)
  }
  return out
}

/** Declared code paths REPLACE the default (replacement, not union). */
function normalizeCodePaths(v) {
  if (!Array.isArray(v)) return null
  const out = []
  for (const e of v) {
    if (typeof e !== "string") continue
    const s = e.trim().replace(/\\/g, "/").replace(/^\.\//, "").replace(/\/+$/, "")
    if (!s || out.includes(s)) continue
    out.push(s)
  }
  return out.length > 0 ? out : null
}

function normalizeString(v) {
  return typeof v === "string" && v.trim() ? v.trim() : ""
}

/** Per-key type check for recognized keys (present but wrong type). A type error
 *  degrades WITH a warning — never silently (the fallback semantics stay per-key;
 *  only the visibility is added here). */
function typeErrorsOf(raw) {
  const isObj = (v) => v !== undefined && v !== null && typeof v === "object" && !Array.isArray(v)
  const strArray = (v) => Array.isArray(v) && v.every((x) => typeof x === "string")
  const errs = []
  if (raw.codePaths !== undefined && !strArray(raw.codePaths)) errs.push("codePaths must be an array of strings")
  const idx = raw.index
  if (idx !== undefined && !isObj(idx)) errs.push("index must be an object")
  else if (isObj(idx)) {
    for (const k of ["codeExtensions", "docExtensions"]) {
      if (idx[k] !== undefined && !strArray(idx[k])) errs.push(`index.${k} must be an array of strings`)
    }
  }
  const adv = raw.advisor
  if (adv !== undefined && !isObj(adv)) errs.push("advisor must be an object")
  else if (isObj(adv)) {
    for (const k of ["docMap", "standardsDoc"]) {
      if (adv[k] !== undefined && typeof adv[k] !== "string") errs.push(`advisor.${k} must be a string`)
    }
  }
  return errs
}

function buildConventions(raw) {
  const codePaths = normalizeCodePaths(raw?.codePaths)
  const codeExtensions = normalizeExtensions(raw?.index?.codeExtensions)
  const docExtensions = normalizeExtensions(raw?.index?.docExtensions)
  const docMap = normalizeString(raw?.advisor?.docMap)
  const standardsDoc = normalizeString(raw?.advisor?.standardsDoc)
  // `declared` = the declaration actually took effect (at least one recognized key
  // honored) — the design-gate hint reads it to decide whether to point at the
  // declaration file ("declare project conventions … to adjust").
  const declared = Boolean(codePaths || codeExtensions.length || docExtensions.length || docMap || standardsDoc)
  return Object.freeze({
    declared,
    codePaths: Object.freeze(codePaths ?? [...DEFAULT_CODE_PATHS]),
    index: Object.freeze({
      codeExtensions: Object.freeze(codeExtensions),
      docExtensions: Object.freeze(docExtensions),
    }),
    advisor: Object.freeze({ docMap, standardsDoc }),
  })
}

/** Full-default conventions (no declaration) — the fallback every consumer gets. */
export const DEFAULT_CONVENTIONS = buildConventions(null)

const _cache = new Map()

/** Drop the per-root cache (test seam — declaration files are read once per root). */
export function clearConventionsCache() {
  _cache.clear()
}

/**
 * Load (and cache) the normalized conventions for a project root.
 * @param {string} cwd — project root (declaration lives at .thincoder/conventions.json)
 * @returns {Readonly<{declared: boolean, codePaths: readonly string[],
 *   index: {codeExtensions: string[], docExtensions: string[]},
 *   advisor: {docMap: string, standardsDoc: string}}>}
 */
export function loadConventions(cwd) {
  const root = resolve(cwd ?? process.cwd())
  const hit = _cache.get(root)
  if (hit) return hit
  let conv = DEFAULT_CONVENTIONS
  try {
    const text = readFileSync(join(root, CONVENTIONS_REL_PATH), "utf8")
    try {
      const raw = JSON.parse(text)
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("top level must be a JSON object")
      conv = buildConventions(raw)
      const typeErrs = typeErrorsOf(raw)
      if (typeErrs.length > 0) {
        // Wrong-typed keys fall back per-key — but the user must SEE that their
        // declaration did not take effect (never silently swallowed).
        console.warn(`[conventions] ${CONVENTIONS_REL_PATH} has invalid value types (${typeErrs.join("; ")}) — those keys fall back to defaults`)
        logEvent("conventions:error", { cwd: root, err: `type errors: ${typeErrs.join("; ").slice(0, 160)}` })
      }
    } catch (e) {
      // Corrupt file / wrong shape → defaults, visible: warn + event (never silent).
      console.warn(`[conventions] ${CONVENTIONS_REL_PATH} unreadable (${e?.message ?? e}) — falling back to defaults`)
      logEvent("conventions:error", { cwd: root, err: String(e?.message ?? e).slice(0, 200) })
    }
  } catch (e) {
    if (e?.code !== "ENOENT") {
      // File exists but cannot be read (EACCES etc.) — same visible degradation.
      console.warn(`[conventions] ${CONVENTIONS_REL_PATH} not readable (${e?.message ?? e}) — falling back to defaults`)
      logEvent("conventions:error", { cwd: root, err: String(e?.message ?? e).slice(0, 200) })
    }
  }
  _cache.set(root, conv)
  return conv
}
