/**
 * edit-diff.mjs — edit 区域判定/应用内核（权威语义 = 本仓 EDIT.md §4/§5——判定序/空串矩阵；
 * 行尾写回 helper = 本仓 EDIT-HELPERS.md——双端同机制各自实现，本仓不引 CLI 章节号）。
 *
 * The edit tool's region judgment + application live HERE: file-edit.mjs only wires
 * the result. old_string is the current content of the region (must match
 * exactly once — handled by the caller); new_string is the desired result.
 *
 * Two layers:
 *   - applyRegion — entry-level judgment entry (EDIT.md §4 分支 0 single-line
 *     in-place replace, mirroring the CLI's computeEditEntry branch 0): old/new
 *     each one line (split-based — a trailing newline is a terminator, not a
 *     second line), both non-empty → the exact old line is REPLACED in place by
 *     the new line (line count unchanged — no zero-overlap insertion for this
 *     shape). Multi-match and replace_all never reach this entry (callers
 *     reject/route first). Every other shape falls through to applyPatchLines
 *     untouched.
 *   - applyPatchLines — pure diff layer. Judgment order per EDIT.md §4
 *     (2026-09-08 D3 — 替换即删):
 *     1. zero overlap (every old line absent from the new line set) → REPLACE:
 *        old_string's lines are replaced by new_string and the old lines are
 *        deleted (替换即删 — no old-line residue);
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
 * at the entry — EDIT-HELPERS.md authority). The resultText is LF;
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
 * the LCS order (new-only lines before the first shared line land first).
 * Ties (equally long alternatives) resolve to "add first" —
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
  // EDIT.md §4（判定序 1——D3 替换即删，2026-09-08）：zero overlap → replace-deletes
  // （old lines are replaced by new lines, no old-line residue; the
  // previous insert-after-old semantics is retired).
  const newSet = new Set(newLines)
  let zeroOverlap = true
  for (const l of oldLines) {
    if (newSet.has(l)) { zeroOverlap = false; break }
  }
  let resultLines
  if (zeroOverlap) {
    resultLines = [...newLines]
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
 * Entry-level region judgment (EDIT.md §4 分支 0 — VS Code 同构判定入口;
 * CLI 端该分支在 computeEditEntry 判定序内). The callers (file-edit.mjs single form
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
 * longer applies to this shape (EDIT.md §4 判定序 1 修正——the「单行换单行」insert pit).
 *
 * Every other shape (either side multi-line) → applyPatchLines unchanged
 * (zero-overlap replace / LCS / trivial — the pure diff layer stays intact;
 * multi-match and replace_all semantics untouched).
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
