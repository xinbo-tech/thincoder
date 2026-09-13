/**
 * index-discover.mjs — file discovery + kind classification for the semantic index
 * (split out of indexer.mjs).
 *
 * PORTABILITY VSC mirror · VP-9 (P9): the extension tables were 14 code + 5 doc
 * entries with no declaration surface — a project in any other mainstream language
 * was invisible AND undeclarable, silently. Now: the tables carry the CLI-aligned
 * additions, `.thincoder/conventions.json` (index.codeExtensions / index.docExtensions)
 * unions in project-specific extensions, and files whose extension is in NO list are
 * TALLIED (`collectUnlisted`) so "my .xyz files are not searchable" stops being
 * invisible (buildIndex → panel hint + a log event).
 */
import { readdirSync } from "node:fs"
import { join, relative } from "node:path"
import { DEFAULT_CONVENTIONS, loadConventions } from "./conventions.mjs"

const CODE_EXTS = new Set([
  ".js", ".mjs", ".cjs", ".jsx", ".ts", ".tsx", ".py", ".rs", ".go", ".java", ".c", ".cpp", ".h", ".hpp",
  // VP-9 additions (CLI-table alignment): languages whose absence made a whole
  // project invisible. Anything still missing is declarable (index.codeExtensions).
  ".mts", ".cts", ".dart", ".lua", ".cs", ".fs", ".fsx", ".clj", ".cljs", ".ex", ".exs", ".erl", ".hrl",
  ".scala", ".pl", ".pm", ".r", ".jl", ".zig", ".groovy", ".ps1", ".proto", ".graphql", ".tf", ".hcl",
])
const DOC_EXTS = new Set([".md", ".markdown", ".txt", ".rst", ".adoc", ".mdx", ".org", ".wiki", ".tex"])
export const SKIP_DIRS = new Set(["node_modules", ".git", "dist", "build", ".turbo", "coverage", "__pycache__", ".next"])

/** Lower-cased ".ext" of a path/name ("" when it has no extension). */
function extensionOf(p) {
  const s = String(p ?? "")
  const base = s.slice(Math.max(s.lastIndexOf("/"), s.lastIndexOf("\\")) + 1)
  const i = base.lastIndexOf(".")
  return i > 0 ? base.slice(i).toLowerCase() : ""
}

/** Effective extension sets for one conventions object: defaults ∪ declared
 *  (declaration is a UNION — §4.1: index.*Extensions APPEND). Cached per frozen
 *  conventions object (the loader hands out stable per-root instances). */
const _knownCache = new WeakMap()
function knownExtensions(conv) {
  const key = conv ?? DEFAULT_CONVENTIONS
  let hit = _knownCache.get(key)
  if (!hit) {
    const code = new Set(CODE_EXTS)
    const doc = new Set(DOC_EXTS)
    for (const e of key.index?.codeExtensions ?? []) code.add(e)
    for (const e of key.index?.docExtensions ?? []) doc.add(e)
    hit = { code, doc, all: new Set([...code, ...doc]) }
    _knownCache.set(key, hit)
  }
  return hit
}

/** Unlisted-extension tally (VP-9 visibility): counts files the index will NOT
 *  pick up because their extension is in no list. `exts` is a capped sample (the
 *  count is the signal; the list is the hint). */
export const UNLISTED_SAMPLE_CAP = 20
function createUnlistedTally() {
  const counts = new Map()
  let count = 0
  return {
    note(ext) {
      if (!ext) return
      count++
      counts.set(ext, (counts.get(ext) ?? 0) + 1)
    },
    result() {
      const exts = [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, UNLISTED_SAMPLE_CAP)
        .map(([ext, n]) => ({ ext, count: n }))
      return { count, exts }
    },
  }
}

/** Shared walker — ONE rule set for whole-tree discovery, the ignored-subtree walk
 *  (needsRebuild B2) and the memory self-check (listMemoryFiles): SKIP_DIRS / dot-dirs are
 *  not entered, .thincoder is entered only for memory/, files are filtered by extension.
 *  Keeping a single implementation is what makes "discovery" and "rebuild decision" unable
 *  to disagree (§4.2 契约六/七). With `collectUnlisted`, files whose extension is in no
 *  list are tallied instead of silently dropped. */
function collectFiles(rootDir, cwd, inThincoder, signal, conv, collectUnlisted) {
  const { all } = knownExtensions(conv)
  const tally = collectUnlisted ? createUnlistedTally() : null
  const files = []
  function walk(dir, insideThincoder) {
    let entries
    try { entries = readdirSync(dir, { withFileTypes: true }) } catch { return }
    for (const e of entries) {
      signal?.throwIfAborted()
      // Inside .thincoder keep ONLY memory/ (skip index/, sessions/, checklist.md, …)
      if (insideThincoder && e.name !== "memory") continue
      if (e.isDirectory()) {
        // Enter .thincoder at the project root (and its memory/ subdir); skip other dot-dirs.
        if (SKIP_DIRS.has(e.name)) continue
        if (e.name.startsWith(".") && e.name !== ".thincoder") continue
        walk(join(dir, e.name), e.name === ".thincoder")
      } else if (e.isFile()) {
        if (isIndexableName(e.name, all)) {
          files.push(relative(cwd, join(dir, e.name)).replaceAll("\\", "/"))
        } else {
          tally?.note(extensionOf(e.name))
        }
      }
    }
  }
  walk(rootDir, inThincoder)
  return { files, unlisted: tally ? tally.result() : { count: 0, exts: [] } }
}

function isIndexableName(name, allExts) {
  const ext = extensionOf(name)
  return ext !== "" && allExts.has(ext)
}

/**
 * Discover indexable files under the project root.
 * @param {string} cwd — project root
 * @param {AbortSignal} [signal]
 * @param {{collectUnlisted?: boolean}} [opts] — collectUnlisted: ALSO tally files whose
 *   extension is in no list; the return becomes `{ files, unlisted }` where
 *   `unlisted = { count, exts: [{ext, count}] }` (sample capped). Default: the plain
 *   files array (backward-compatible with needsRebuild / the memory self-check).
 */
export function discoverFiles(cwd, signal, { collectUnlisted = false } = {}) {
  const res = collectFiles(cwd, cwd, false, signal, loadConventions(cwd), collectUnlisted)
  return collectUnlisted ? res : res.files
}

/** Indexable files under one subtree, relative to `cwd` — same walk rules as discoverFiles
 *  (used by needsRebuild to walk an ignored directory entry: §4.2 契约六). */
export function discoverFilesUnder(cwd, subdir, { collectUnlisted = false } = {}) {
  const base = String(subdir ?? "").replaceAll("\\", "/").replace(/\/+$/, "")
  if (!base) return collectUnlisted ? { files: [], unlisted: { count: 0, exts: [] } } : []
  const res = collectFiles(join(cwd, base), cwd, false, undefined, loadConventions(cwd), collectUnlisted)
  return collectUnlisted ? res : res.files
}

/** Extension-level predicate (defaults ∪ declared). */
export function isIndexableFile(filePath, conv) {
  return isIndexableName(String(filePath ?? ""), knownExtensions(conv).all)
}

/** Full predicate: is this relative path a file the index tracks? (extension + the same
 *  directory exclusions discoverFiles applies — SKIP_DIRS and hidden dirs, except the
 *  .thincoder/memory/ special case). Used by needsRebuild so "discovery" and "rebuild
 *  decision" can never disagree. */
export function shouldIndexFile(relPath, conv) {
  const p = relPath.replaceAll("\\", "/")
  if (p.startsWith(".thincoder/memory/")) return isIndexableFile(p, conv)
  for (const d of p.split("/").slice(0, -1)) {
    if (SKIP_DIRS.has(d) || d.startsWith(".")) return false
  }
  return isIndexableFile(p, conv)
}

export function kindFor(filePath, conv) {
  // memory files live in .thincoder/memory/ — check FIRST: they're .md, DOC_EXTS would
  // otherwise classify them as docs.
  if (filePath.startsWith(".thincoder/memory/")) return "memory"
  const { code, doc } = knownExtensions(conv)
  const ext = extensionOf(filePath)
  if (code.has(ext)) return "code"
  if (doc.has(ext)) return "doc"
  return "doc"
}

/** Memory files the index tracks — recursive, through the SAME walk as discovery
 *  (§4.2 契约七: the old flat readdirSync missed nested files, so they were indexed and
 *  then judged file-removed on every needsRebuild — an endless rebuild loop). */
export function listMemoryFiles(cwd) {
  return discoverFilesUnder(cwd, ".thincoder/memory")
}
