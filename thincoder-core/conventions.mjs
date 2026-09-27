/**
 * conventions.mjs — the single authority for code / doc / temp / aux path classification,
 * plus the project declaration surface (the three declaration families of the project's
 * `PROJECT-MANIFEST.json`: `codePaths` / `index.*` / `advisor.*`).
 *
 * Why one module: the write-domain gates and guards (design gate, review-doc gate,
 * mutation accounting, verify fast path) each carried their own copy of the
 * "what counts as product code" predicate — anchored `^src/` regexes, `docs/`
 * prefix checks, component regexes. Each copy drifted, and each hardcoded THIS
 * repository's layout: a project whose code lives outside `src/` slipped through
 * the design gate silently (PORTABILITY FR12 / PO-10). One classifier + one declared
 * carrier = one truth. It is a **shared** classification surface: the gates are consumers,
 * not owners (consumer faces: advisor / agent-tools / both ends).
 *
 * Declaration (2026-09-27 · `.thincoder/conventions.json` retired — single carrier):
 *   the three families live in the project manifest and are projected HERE through
 *   `manifest.mjs` (ONE reader / ONE root resolution — `readManifest` + `manifestFilePath`;
 *   name / shape / defaults are schema-owned by `docs/core/design/MANIFEST.md` §2.2).
 *   Missing manifest → pure defaults (silent); unusable manifest (invalid / read error) →
 *   defaults + console.warn + a log event (never crash, never swallow — PORTABILITY FR10/D16).
 *   A retired `.thincoder/conventions.json` is never read: while present it yields ONE
 *   visible warning per load (existence check only — zero content parsing — KD-M1-34).
 *
 * Classification vocabulary (PORTABILITY design §3.2):
 *   code — inside a declared code segment (default: the path segment `src`), or the
 *          fallback;  doc — documentation extension outside any code segment and not
 *          scratch;  temp — tmp-* name or .tmp/.temp extension;  aux — a default
 *          auxiliary-path segment sequence (test / tests / scripts / .thincoder/tmp —
 *          F9) that matched no code segment and neither doc nor temp.
 * Precedence: code segment → temp → doc → aux → fallback code.
 *
 * Segment matching runs on the PROJECT-ROOT-RELATIVE FACE of a path (D17 · 2026-09-28): the
 * machine layout ABOVE the project root never participates. An absolute path outside the
 * root / an unknown root / a `.`-`..` jump segment ⇒ the face is indeterminate: code segments
 * fall back to the whole path (the interception surface does not shrink), aux sequences do
 * NOT match (the former fail-open edge — an ancestor segment exempted a whole subtree).
 */
import { existsSync } from "node:fs"
import { dirname, join } from "node:path"
import { DEFAULT_MANIFEST, manifestFilePath, readManifest } from "./manifest.mjs"
import { logEvent } from "./log.mjs"

/** Default auxiliary-path segment sequences (data, not logic — F9): the engineering-mode
 *  parent gate's default exemption surface — `test` / `tests` / `scripts` at any depth,
 *  plus the `.thincoder/tmp` scratch space (two-segment sequence). Not declarable — a
 *  project reclaims a sequence by listing it in `codePaths` (code segment wins). */
export const DEFAULT_AUX_PATHS = ["test", "tests", "scripts", ".thincoder/tmp"]

/** Retired declaration carrier (project-root relative). Its EXISTENCE is checked, its
 *  content is never read — the declaration surface = the manifest three families (KD-M1-34). */
const RETIRED_REL_PATH = ".thincoder/conventions.json"

/** Documentation predicate (moved here verbatim from advisor/repos.mjs — one copy). */
const DOC_FILE = /(?:^|[/\\])(?:LICENSE|NOTICE|CHANGELOG|AUTHORS)(?:\.\w+)?$|\.(?:md|markdown|mdx|txt|rst|adoc)$/i

/** Temp/scratch predicate (moved here verbatim from advisor/repos.mjs). */
const TEMP_FILE = /(?:^|[/\\])tmp-[^/\\]+$|\.(?:tmp|temp)$/i

/** True when a path is a throwaway temp file (tmp-* name or .tmp/.temp extension). */
export function isTempPath(p) {
  return TEMP_FILE.test(p ?? "")
}

/** Path → segments (both separators accepted; absolute and relative alike). */
function segmentsOf(p) {
  return String(p ?? "").replace(/\\/g, "/").split("/").filter(Boolean)
}

const lowerSeg = (s) => s.toLowerCase()
const isJumpSeg = (seg) => seg === "." || seg === ".."

/**
 * The segment-matching face of a path — its position INSIDE the project (PORTABILITY design
 * §3.2 · D17「段匹配面 = 项目根相对面」):
 *   · absolute form under the root (separators normalized + per-segment case-insensitive
 *     comparison) ⇒ the REMAINING segments (an EMPTY list when the path IS the root);
 *   · relative form ⇒ its own segments;
 *   · anything else — outside the root / root unknown / a `.` / `..` jump segment ⇒
 *     `null` = indeterminate.
 */
function faceOf(p, root) {
  const s = String(p ?? "").replace(/\\/g, "/")
  const segs = segmentsOf(s)
  if (!/^([A-Za-z]:|\/)/.test(s)) return segs.some(isJumpSeg) ? null : segs.map(lowerSeg)
  if (typeof root !== "string" || root === "") return null
  const rootSegs = segmentsOf(root).map(lowerSeg)
  if (segs.length < rootSegs.length) return null
  for (let i = 0; i < rootSegs.length; i++) {
    if (lowerSeg(segs[i]) !== rootSegs[i]) return null
  }
  const rest = segs.slice(rootSegs.length)
  if (rest.length === 0) return []
  return rest.some(isJumpSeg) ? null : rest.map(lowerSeg)
}

/**
 * True when `segments` contain any of the given segment sequences at any depth.
 * Segment matching (not a prefix anchor) is what closes the nested-layout hole:
 * `packages/foo/src/x.md` matches the sequence ["src"] — product code, not a
 * document. Comparison is case-insensitive — on case-insensitive filesystems
 * `Src/x.mjs` is the same directory, and the gate must not be bypassable by casing.
 */
function hasSequenceIn(segments, sequences) {
  const parts = segments.map(lowerSeg)
  for (const entry of sequences) {
    const want = segmentsOf(entry).map(lowerSeg)
    if (want.length === 0) continue
    for (let i = 0; i + want.length <= parts.length; i++) {
      if (want.every((seg, j) => parts[i + j] === seg)) return true
    }
  }
  return false
}

/**
 * Segment matching on the project-root-relative face (D17). An indeterminate face splits the
 * two callers by design: code segments fall back to the WHOLE path (`fallbackAll` — the
 * interception surface does not shrink), while aux sequences do NOT match (the former
 * fail-open edge: an ancestor segment above the root used to exempt a whole subtree).
 */
function hasSegmentSequence(p, sequences, root, fallbackAll) {
  const face = faceOf(p, root)
  if (face === null) return fallbackAll ? hasSequenceIn(segmentsOf(p), sequences) : false
  return hasSequenceIn(face, sequences)
}

/** True when the path contains a declared code segment sequence (on the face — D17). */
function hasCodeSegment(p, conv) {
  return hasSegmentSequence(p, conv?.codePaths ?? DEFAULT_DECLARATION.codePaths, conv?.root, true)
}

/** True when the path contains a default auxiliary-path segment sequence (F9 · face-bound). */
function hasAuxSegment(p, conv) {
  return hasSegmentSequence(p, DEFAULT_AUX_PATHS, conv?.root, false)
}

/** "code" | "doc" | "temp" | "aux" — the single classification decision.
 *  Precedence: code segment first (src/** stays product code even when the name
 *  looks scratch — the pre-existing unconditional-src rule), then temp, then a
 *  documentation extension, then an auxiliary-path segment sequence (test / tests
 *  / scripts / .thincoder/tmp — F9), else code (anything not doc/temp/aux is product
 *  code). Both segment checks run on the project-root-relative face (D17 — `faceOf`). */
export function classifyPath(p, conv) {
  const s = String(p ?? "")
  if (hasCodeSegment(s, conv)) return "code"
  if (TEMP_FILE.test(s)) return "temp"
  if (DOC_FILE.test(s)) return "doc"
  if (hasAuxSegment(s, conv)) return "aux"
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

/** True when the path is an auxiliary path (`classifyPath === "aux"`) — the engineering-mode
 *  parent gate's default exemption surface (test / tests / scripts at any depth ·
 *  .thincoder/tmp/** — matched on the project-root-relative face only, D17). Not declarable:
 *  a project reclaims one by listing its sequence in `codePaths`, which then wins (code
 *  segment first). Production faces read aux through classifyPath / isCodePath; this
 *  predicate is the readable form for the test face. */
export function isAuxPath(p, conv) {
  return classifyPath(p, conv) === "aux"
}

// ─────────────────────────────────────────────────────────────────────────────
// Declaration loading — the three families of PROJECT-MANIFEST.json, projected
// through manifest.mjs (ONE reader / ONE root resolution) and cached per DATA-FILE
// PATH (`clearDeclarationCache()` is the test seam; declarations change rarely).
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

/** Declared code paths replace the default (replacement, not union — §3.1). An EMPTY
 *  array is a legal declaration ("no segment-based code face") — only a non-array value
 *  falls back to `null` (⇒ caller keeps the default). */
function normalizeCodePaths(v) {
  if (!Array.isArray(v)) return null
  const out = []
  for (const e of v) {
    if (typeof e !== "string") continue
    const s = e.trim().replace(/\\/g, "/").replace(/^\.\//, "").replace(/\/+$/, "")
    if (!s || out.includes(s)) continue
    out.push(s)
  }
  return out
}

function normalizeString(v) {
  return typeof v === "string" && v.trim() ? v.trim() : ""
}

/** Project the manifest three families into the frozen declaration object.
 *  `declared` = VALUE comparison against the defaults — at least one family deviates
 *  (a key written with its default value still counts as NOT declared; the design-gate
 *  hint reads it to decide whether to point at the manifest, PORTABILITY §3.1).
 *  `root` = the project root this declaration belongs to (`dirname(manifestFilePath(cwd))` —
 *  the segment-matching face's anchor, D18); NOT a declared value (excluded from `declared`);
 *  `null` = unknown root (`DEFAULT_DECLARATION`). */
function buildDeclaration(m, root = null) {
  const codePaths = normalizeCodePaths(m?.codePaths) ?? [...DEFAULT_MANIFEST.codePaths]
  const codeExtensions = normalizeExtensions(m?.index?.codeExtensions)
  const docExtensions = normalizeExtensions(m?.index?.docExtensions)
  const docMap = normalizeString(m?.advisor?.docMap)
  const standardsDoc = normalizeString(m?.advisor?.standardsDoc)
  const defaults = normalizeCodePaths(DEFAULT_MANIFEST.codePaths) ?? []
  const pathsDiffer = codePaths.length !== defaults.length || codePaths.some((p, i) => p !== defaults[i])
  const declared = pathsDiffer || codeExtensions.length > 0 || docExtensions.length > 0 || Boolean(docMap) || Boolean(standardsDoc)
  return Object.freeze({
    declared,
    codePaths: Object.freeze(codePaths),
    index: Object.freeze({
      codeExtensions: Object.freeze(codeExtensions),
      docExtensions: Object.freeze(docExtensions),
    }),
    advisor: Object.freeze({ docMap, standardsDoc }),
    root,
  })
}

/** Full-default declaration (no manifest / unusable manifest) — the fallback every
 *  consumer gets; built from `DEFAULT_MANIFEST` so the default values stay single-source. */
export const DEFAULT_DECLARATION = buildDeclaration(null)

const _cache = new Map()

/** Drop the per-data-file-path cache (test seam — declarations are read once per path). */
export function clearDeclarationCache() {
  _cache.clear()
}

/** Retired-carrier warning (existence check only — zero content parsing, zero fallback). */
function warnRetiredCarrier(root) {
  console.warn(`[declaration] ${RETIRED_REL_PATH} is retired and no longer read — move codePaths / index.*Extensions / advisor.{docMap,standardsDoc} into PROJECT-MANIFEST.json`)
  logEvent("declaration:retired-file", { cwd: root })
}

/**
 * Load (and cache) the normalized project declaration for a project.
 * The data file is located through `manifestFilePath(cwd)` (ONE root resolution — a cwd
 * deeper than the project root still reads the project's manifest) and read through
 * `readManifest` (ONE reader — this module carries no second parse of the manifest).
 * Missing manifest → defaults, silently (the returned `root` is still the project root —
 * `dirname(manifestFilePath(cwd))`, the face's anchor). Unusable manifest (invalid shape /
 * read error) → defaults + `console.warn` + a log event (visible degradation, never a throw).
 * A retired `.thincoder/conventions.json` at the manifest's project root → one warning
 * per cache miss (content zero-parsed, zero effect on the readings — KD-M1-34).
 * @param {string} cwd — project dir / anchor (root resolved by manifest.mjs)
 * @returns {Readonly<{declared: boolean, codePaths: readonly string[],
 *   index: {codeExtensions: string[], docExtensions: string[]},
 *   advisor: {docMap: string, standardsDoc: string}, root: string|null}>}
 */
export function loadProjectDeclaration(cwd) {
  const file = manifestFilePath(cwd) // data-file path (single source — manifest.mjs KD-M1-18)
  const hit = _cache.get(file)
  if (hit) return hit
  const root = dirname(file) // project root the manifest belongs to (cwd may be deeper) — the face's anchor
  if (existsSync(join(root, RETIRED_REL_PATH))) warnRetiredCarrier(root)
  let decl = buildDeclaration(null, root) // missing / unusable manifest → the defaults, root still known
  try {
    const r = readManifest(cwd)
    if (r.ok) {
      decl = buildDeclaration(r.manifest, root)
    } else if (r.reason !== "missing") {
      // Usable-file expectation broken (invalid JSON / wrong shape) → defaults, visible.
      console.warn(`[declaration] ${file} is not a usable declaration (${(r.errors ?? []).join("; ") || r.reason}) — falling back to defaults`)
      logEvent("declaration:error", { path: file, err: `invalid: ${(r.errors ?? []).join("; ")}`.slice(0, 200) })
    }
  } catch (e) {
    // Read error (EACCES …) — same visible degradation, never a throw.
    console.warn(`[declaration] ${file} not readable (${e?.message ?? e}) — falling back to defaults`)
    logEvent("declaration:error", { path: file, err: String(e?.message ?? e).slice(0, 200) })
  }
  _cache.set(file, decl)
  return decl
}
