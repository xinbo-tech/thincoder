/**
 * edit-diff.mjs — LCS edit semantics (TOOLS.md §15 D15.1 + §15.2 分支 0)
 *
 * The edit tool's region judgment + application live HERE: file.mjs only wires
 * the result. old_string is the current content of the region (must match
 * exactly once — handled by the caller); new_string is the desired result.
 *
 * Two layers:
 *   - applyRegion — entry-level judgment entry (§15.2 D15.9.1, CLI
 *     computeEditEntry 分支 0 mirror): old/new each one line (split-based —
 *     a trailing newline is a terminator, not a second line), both non-empty
 *     → the exact old line is REPLACED in place by the new line (line count
 *     unchanged — no zero-overlap insertion for this shape). Multi-match and
 *     replace_all never reach this entry (callers reject/route first).
 *     Every other shape falls through to applyPatchLines untouched.
 *   - applyPatchLines — pure diff layer (D15.1, unchanged — its direct unit
 *     semantics stay: a bare single×single call still inserts). Judgment
 *     order per D15.1:
 *     1. zero overlap (every old line absent from the new line set) → INSERT:
 *        new_string is inserted after old_string's last line, old content stays;
 *     2. general diff (≥1 shared line) → LCS line diff: shared lines are kept
 *        and take their position relative to the shared lines (LCS order);
 *        old-only lines are deleted, new-only lines are inserted;
 *     3. trivial (old and new are line-identical) → no-op, still reported as
 *        success.
 * Errors (nothing is written): empty new_string (a pure deletion intent must
 * keep context lines in BOTH old_string and new_string); empty old_string;
 * region over 1000 lines.
 *
 * Line endings: the judgment and the diff run in the LF domain (normalizeEOL
 * at the entry — EDIT-TOOL-EOL-DESIGN.md authority). The resultText is LF;
 * the caller restores the file's original EOL on write-back.
 */
import { normalizeEOL } from "./shared.mjs"

export const MAX_REGION_LINES = 1000
export const EMPTY_NEW_REASON = "empty new_string — for deletion, keep the context lines you want to preserve in both old_string and new_string"
export const REGION_TOO_LARGE_REASON = "edit region too large — narrow the change"

/** Split into lines; a trailing newline is a terminator, not a line. */
function splitLines(text) {
  const lines = text.split("\n")
  if (text.endsWith("\n")) lines.pop()
  return lines
}

/**
 * LCS replacement: keeps the longest common subsequence (whole-line equality),
 * deletes old-only lines, inserts new-only lines. Ops are collected while
 * backtracking, so they are reversed before emission — the result preserves
 * the LCS order (T15.1a: new-only lines before the first shared line land
 * first). Ties (equally long alternatives) resolve to "add first" —
 * deterministic for identical inputs.
 */
function lcsReplace(oldLines, newLines) {
  const n = oldLines.length
  const m = newLines.length
  const dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1))
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      dp[i][j] = oldLines[i - 1] === newLines[j - 1]
        ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1])
    }
  }
  const ops = []
  let i = n
  let j = m
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      ops.push({ t: "keep", x: newLines[j - 1] })
      i--
      j--
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      ops.push({ t: "add", x: newLines[j - 1] })
      j--
    } else {
      ops.push({ t: "del", x: oldLines[i - 1] })
      i--
    }
  }
  const out = []
  for (let k = ops.length - 1; k >= 0; k--) {
    if (ops[k].t !== "del") out.push(ops[k].x)
  }
  return out
}

/**
 * @param {string} oldText current content of the region (LF or CRLF — normalized internally)
 * @param {string} newText desired result of the region
 * @returns {{ok: true, resultText: string} | {ok: false, reason: string}}
 *          resultText is LF-domain; the caller restores the file's EOL.
 */
export function applyPatchLines(oldText, newText) {
  const oldStr = normalizeEOL(oldText)
  const newStr = normalizeEOL(newText)
  if (newStr === "") return { ok: false, reason: EMPTY_NEW_REASON }
  if (oldStr === "") return { ok: false, reason: "old_string must not be empty" }
  const oldLines = splitLines(oldStr)
  const newLines = splitLines(newStr)
  if (oldLines.length > MAX_REGION_LINES || newLines.length > MAX_REGION_LINES) {
    return { ok: false, reason: REGION_TOO_LARGE_REASON }
  }
  // 判定 1: zero overlap → insert (old preserved, new after old's last line)
  const newSet = new Set(newLines)
  let zeroOverlap = true
  for (const l of oldLines) {
    if (newSet.has(l)) { zeroOverlap = false; break }
  }
  let resultLines
  if (zeroOverlap) {
    resultLines = [...oldLines, ...newLines]
  } else if (oldLines.length === newLines.length && oldLines.every((l, k) => l === newLines[k])) {
    // 判定 3: trivial no-op (old === new at line level)
    resultLines = oldLines
  } else {
    // 判定 2: general LCS diff
    resultLines = lcsReplace(oldLines, newLines)
  }
  // Trailing terminator mirrors old's (both normalized): old "a\nb\n" →
  // "a\nb\n", old "a\nb" → "a\nb" — the diff works on lines, not terminator.
  return { ok: true, resultText: resultLines.join("\n") + (oldStr.endsWith("\n") ? "\n" : "") }
}


/**
 * Entry-level region judgment (§15.2 分支 0 — D15.9.1 — VS Code 同构判定入口;
 * CLI 端该分支在 computeEditEntry 判定序内). The callers (file.mjs single form
 * + batch entries) guarantee whole-file uniqueness BEFORE this entry: a 0-match
 * and a >1-match (non-replace_all) already errored; replace_all routes to its
 * own literal path and never calls here.
 *
 * Single-line old × single-line new — "one line" per the line-split rule (a
 * trailing newline is a terminator, not a second line), both non-empty (an
 * empty new_string errors explicitly first — 评审 #3 ordering; an empty
 * old_string falls through to applyPatchLines' own error — a single-line swap
 * can never become a deletion) → replace that exact line in place: region
 * result = the new line, line count unchanged. Zero-overlap insertion no
 * longer applies to this shape (T15.33 — the「单行换单行」insert pit).
 *
 * Every other shape (either side multi-line) → applyPatchLines unchanged
 * (zero-overlap insert / LCS / trivial — the pure diff layer stays intact;
 * multi-match and replace_all semantics untouched — T15.34/35/36 regressions).
 */
export function applyRegion(oldText, newText) {
  if (oldText !== "" && newText !== "") {
    // split-based single-line check (identical to splitLines below: a trailing
    // newline is a terminator, not a second line — "a\n" is still one line).
    const oldOneLine = !oldText.slice(0, -1).includes("\n")
    const newOneLine = !newText.slice(0, -1).includes("\n")
    if (oldOneLine && newOneLine) {
      const line = newText.endsWith("\n") ? newText.slice(0, -1) : newText
      return { ok: true, resultText: line + (oldText.endsWith("\n") ? "\n" : "") }
    }
  }
  return applyPatchLines(oldText, newText)
}
