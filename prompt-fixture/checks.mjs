/**
 * checks.mjs — the small pure readings the copy layer and the variant layer both need:
 * digests and character counts, the first position where two strings diverge, and the
 * line-multiset view used to make "differs only as declared" readable.
 */

import { createHash } from "node:crypto"

export const sha256 = (buf) => createHash("sha256").update(buf).digest("hex")

/** Character count as `text.length` — the unit the documented master readings are given in. */
export const chars = (text) => text.length

export const textOf = (buf) => buf.toString("utf8")

/** Index of the first differing character, or -1 when the two strings are identical. */
export function firstDifference(a, b) {
  const max = Math.min(a.length, b.length)
  for (let i = 0; i < max; i += 1) if (a[i] !== b[i]) return i
  return a.length === b.length ? -1 : max
}

/** Multiset of lines (line order is irrelevant for this view). */
export function lineCounts(text) {
  const counts = new Map()
  for (const line of text.split("\n")) counts.set(line, (counts.get(line) ?? 0) + 1)
  return counts
}

/** Lines removed / added between two texts, as multisets. */
export function lineDelta(before, after) {
  const removed = new Map()
  const added = new Map()
  const a = lineCounts(before)
  const b = lineCounts(after)
  for (const [line, n] of a) {
    const diff = n - (b.get(line) ?? 0)
    if (diff > 0) removed.set(line, diff)
  }
  for (const [line, n] of b) {
    const diff = n - (a.get(line) ?? 0)
    if (diff > 0) added.set(line, diff)
  }
  return { removed, added }
}

export function addInto(target, source) {
  for (const [line, n] of source) target.set(line, (target.get(line) ?? 0) + n)
  return target
}

/** Lines present in `actual` beyond what `declared` accounts for. */
export function surplus(actual, declared) {
  const extra = []
  for (const [line, n] of actual) {
    const diff = n - (declared.get(line) ?? 0)
    if (diff > 0) extra.push({ line, count: diff })
  }
  return extra
}

export const fmtLines = (rows) => (rows.length ? rows.map((row) => `${JSON.stringify(row.line)}×${row.count}`).join(", ") : "none")
