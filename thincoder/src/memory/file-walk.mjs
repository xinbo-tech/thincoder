/**
 * memory/file-walk.mjs — filesystem walk fallback + the shared file-listing predicates.
 *
 * Why this module (PORTABILITY FR15 / P8): the index was built from `git ls-files`
 * only — on a project that is not a git repository the code and doc indexes came
 * back EMPTY, silently (the reviewer/agent then "searched" an empty index). The
 * fallback traverses the filesystem instead, and the skip predicate lives here so
 * the git path, the walk and the single-file reindex cannot drift apart against
 * each other (they were three copies before).
 */
import { readdir } from "node:fs/promises"
import { join } from "node:path"
import { SKIP_DIRS } from "./schema.mjs"

/** Upper guard for the walk: stop after this many matched files (runaway trees). */
export const MAX_WALK_FILES = 20000

/**
 * Shared skip predicate for project-relative paths: any SKIP_DIRS basename, or any
 * dot-prefixed segment (`.git`, `.cache`, `.thincoder`…). Accepts both separators.
 */
export function isSkippedRelPath(rel) {
  return String(rel ?? "")
    .replace(/\\/g, "/")
    .split("/")
    .some((seg) => seg !== "" && (seg.startsWith(".") || SKIP_DIRS.has(seg)))
}

/** Lower-cased ".ext" of a path, or "" when it has no extension. */
export function extensionOf(p) {
  const s = String(p ?? "")
  const base = s.slice(Math.max(s.lastIndexOf("/"), s.lastIndexOf("\\")) + 1)
  const i = base.lastIndexOf(".")
  return i > 0 ? base.slice(i).toLowerCase() : ""
}

/**
 * Unlisted-extension tally (PORTABILITY PO-9 — visibility): counts files the index
 * will NOT pick up because their extension is in no list, so "my .xyz files are not
 * searchable" stops being invisible. `exts` is a capped sample (the count is the
 * signal; the list is the hint).
 * @param {Set<string>} knownExts — every extension that IS indexed (code ∪ doc ∪ declared)
 */
export function createUnlistedTally(knownExts) {
  const counts = new Map()
  let count = 0
  return {
    note(rel) {
      const ext = extensionOf(rel)
      if (!ext || knownExts.has(ext)) return
      count++
      counts.set(ext, (counts.get(ext) ?? 0) + 1)
    },
    result(limit = 12) {
      const exts = [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([ext, n]) => ({ ext, count: n }))
      return { count, exts }
    },
  }
}

/**
 * Recursive project walk — the no-git listing source. Symlinks are never followed
 * (loop/escape guard); skipped directories are pruned; only files whose extension
 * is in `exts` are returned. Hitting maxFiles is reported as `truncated`, never
 * silently dropped.
 * @param {string} dir — project root
 * @param {Set<string>} exts — extensions to keep (lower-case, leading dot)
 * @param {{maxFiles?: number, knownExts?: Set<string>|null}} [opts]
 *   knownExts → also tally files whose extension is in NO index list
 * @returns {Promise<{files: {abs: string, rel: string}[], truncated: boolean,
 *   unlisted: {count: number, exts: {ext: string, count: number}[]}}>}
 */
export async function walkProjectFiles(dir, exts, { maxFiles = MAX_WALK_FILES, knownExts = null } = {}) {
  const files = []
  const tally = knownExts ? createUnlistedTally(knownExts) : null
  let truncated = false
  const stack = [{ abs: dir, rel: "" }]
  while (stack.length > 0) {
    const cur = stack.pop()
    let entries
    try {
      entries = await readdir(cur.abs, { withFileTypes: true })
    } catch { continue /* unreadable dir — skip, the walk must not fail the sync */ }
    for (const ent of entries) {
      const rel = cur.rel ? `${cur.rel}/${ent.name}` : ent.name
      if (ent.isSymbolicLink()) continue // never follow symlinks
      if (ent.isDirectory()) {
        if (!isSkippedRelPath(rel)) stack.push({ abs: join(cur.abs, ent.name), rel })
        continue
      }
      if (!ent.isFile() || isSkippedRelPath(rel)) continue
      const ext = extensionOf(ent.name)
      if (!ext || !exts.has(ext)) {
        tally?.note(rel)
        continue
      }
      if (files.length >= maxFiles) {
        truncated = true
        break
      }
      files.push({ abs: join(cur.abs, ent.name), rel })
    }
    if (truncated) break
  }
  return { files, truncated, unlisted: tally ? tally.result() : { count: 0, exts: [] } }
}
