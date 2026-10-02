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
 *   the three families live in the project manifest and are projected through `manifest.mjs`
 *   → `declaration.mjs` (declaration loading split out of this file 2026-10-01 — this file keeps the
 *   classification adjudication; ONE reader / ONE root resolution — `readManifest` + `manifestFilePath`;
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
import { DEFAULT_DECLARATION } from "./declaration.mjs"

/** Default auxiliary-path segment sequences (data, not logic — F9): the engineering-mode
 *  parent gate's default exemption surface — `test` / `tests` / `scripts` at any depth,
 *  plus the `.thincoder/tmp` scratch space (two-segment sequence). Not declarable — a
 *  project reclaims a sequence by listing it in `codePaths` (code segment wins). */
export const DEFAULT_AUX_PATHS = ["test", "tests", "scripts", ".thincoder/tmp"]

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
// 迁出面（2026-10-01 拆分批 · #755 ∥ #786）：声明装载面外提 `declaration.mjs`——本档经
// 转口保名（消费面 / 批内件 import 面零改；`DEFAULT_DECLARATION` 另供本档分类裁判缺省取用）。
// ─────────────────────────────────────────────────────────────────────────────
export { loadProjectDeclaration, DEFAULT_DECLARATION, isExcludedRelPath, declaredPublicRoots, clearDeclarationCache } from "./declaration.mjs"
