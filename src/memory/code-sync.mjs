/**
 * memory/code-sync.mjs — code index sync, retrieval, incremental update
 */
import { readFile, stat } from "node:fs/promises"
import { join, relative } from "node:path"
import { embed, cosine, toBlob, fromBlob } from "../embedding.mjs"
import { CODE_EXTS, DOC_EXTS, SKIP_DIRS, MAX_CODE_FILE_BYTES, MAX_DOC_FILE_BYTES } from "./schema.mjs"
import { buildFtsQuery, ensureEmbeddings, EMBED_TEXT_MAX_LEN } from "./core.mjs"
import { detectLanguage, _upsertCodeFile, _upsertDocFile, yieldTick } from "./code-index.mjs"

const DIFF_FULL_SYNC_THRESHOLD = 200
const CODE_EMBED_BATCH = 64

/**
 * git-driven incremental indexing: use git diff to find files changed since
 * the last index, and only rebuild FTS5 chunks for those files (vectors are untouched).
 * An order of magnitude faster than full mtime scanning.
 * Returns { updated, removed, skipped } or null (git unavailable).
 */
export async function gitSync(memory, dir, { onProgress } = {}) {
  const { execFile: _execFile } = await import("node:child_process")
  const gitRun = (args) => new Promise((resolve, reject) => {
    _execFile("git", args, { cwd: dir, encoding: "utf8", timeout: 10000, windowsHide: true }, (err, stdout) => {
      if (err) reject(err); else resolve(stdout)
    })
  })
  const mergeDiff = (text) => text.trim().split("\n").filter(Boolean)

  let head
  try { head = (await gitRun(["rev-parse", "HEAD"])).trim() } catch { return null }

  const stored = memory.db.prepare(`SELECT value FROM meta WHERE key = 'last_indexed_commit'`).get()?.value
  if (!stored) return null

  let diffOut
  try {
    const committed = mergeDiff(await gitRun(["diff", "--name-only", "--diff-filter=ACMRTD", stored, "HEAD"]))
    const dirty = mergeDiff(await gitRun(["diff", "--name-only", "--diff-filter=ACMRTD"]))
    const lines = [...new Set([...committed, ...dirty])]
    diffOut = lines
  } catch {
    return null
  }

  if (diffOut.length > DIFF_FULL_SYNC_THRESHOLD) {
    // diff too large, incremental is useless — fall back to full sync and update anchor
    await codeSync(memory, dir, { onProgress })
    const { docSync } = await import("./docs.mjs")
    await docSync(memory, dir, { onProgress })
    return { updated: -1, removed: 0, skipped: 0, failed: 0, errors: [], fallback: true }
  }

  let updated = 0, removed = 0, skipped = 0, failed = 0
  const errors = []
  for (let i = 0; i < diffOut.length; i++) {
    const rel = diffOut[i].replaceAll("\\", "/")
    const abs = join(dir, rel)
    const ext = rel.slice(rel.lastIndexOf(".")).toLowerCase()

    const pathDirs = rel.split("/")
    if (pathDirs.some((d) => SKIP_DIRS.has(d) || d.startsWith("."))) continue

    if (!CODE_EXTS.has(ext) && !DOC_EXTS.has(ext)) { skipped++; continue }

    try {
      const text = await readFile(abs, "utf8")
      const lines = text.split("\n")
      if (CODE_EXTS.has(ext)) {
        const lang = detectLanguage(abs)
        let mtimeMs = 0
        try { mtimeMs = Math.floor((await stat(abs)).mtimeMs) } catch { /* new file */ }
        _upsertCodeFile(memory, dir, rel, lines, lang, mtimeMs)
      } else {
        let mtimeMs = 0
        try { mtimeMs = Math.floor((await stat(abs)).mtimeMs) } catch { /* new file */ }
        _upsertDocFile(memory, dir, rel, lines, mtimeMs)
      }
      updated++
    } catch (e) {
      const isDeleted = e.code === "ENOENT"
      if (isDeleted) {
        if (CODE_EXTS.has(ext)) memory.db.prepare(`DELETE FROM code_chunks WHERE origin = ? AND path = ?`).run(dir, rel)
        else memory.db.prepare(`DELETE FROM doc_chunks WHERE origin = ? AND path = ?`).run(dir, rel)
        removed++
      } else {
        failed++
        if (errors.length < 5) errors.push(`${rel}: ${e.message}`)
      }
    }
    await yieldTick()
    if (onProgress && i % 5 === 0) {
      onProgress({ phase: "index", current: i + 1, total: diffOut.length, updated, removed, skipped })
    }
  }

  if (failed === 0) {
    memory.db.prepare(`INSERT INTO meta (key, value) VALUES ('last_indexed_commit', ?)
      ON CONFLICT (key) DO UPDATE SET value = excluded.value`).run(head)
  }

  onProgress?.({ phase: "done", total: diffOut.length, updated, removed, skipped, failed })
  return { updated, removed, skipped, failed, errors }
}

/**
 * List project files matching the given extensions.
 * Only indexes git repos — if dir isn't inside a git worktree, returns [].
 * Uses `git ls-files --cached --others --exclude-standard` to get the file list
 * (tracked + untracked-not-ignored, respecting .gitignore).
 * Returns an array of { abs, rel } pairs (abs = full path, rel = path relative to dir).
 */
export async function listProjectFiles(dir, exts) {
  const { execFile: _execFile } = await import("node:child_process")
  const { join: joinPath } = await import("node:path")

  // Only index git repos — if this isn't one, return empty
  let gitTop
  try {
    gitTop = (await new Promise((resolve, reject) => {
      _execFile("git", ["rev-parse", "--show-toplevel"], { cwd: dir, encoding: "utf8", timeout: 5000, windowsHide: true },
        (err, stdout) => { if (err) reject(err); else resolve(stdout.trim()) })
    })).replace(/\\/g, "/")
  } catch {
    return [] // not a git repo → nothing to index
  }

  const files = []
  try {
    const raw = await new Promise((resolve, reject) => {
      _execFile("git", ["ls-files", "--cached", "--others", "--exclude-standard"],
        { cwd: dir, encoding: "utf8", timeout: 15000, windowsHide: true, maxBuffer: 10 * 1024 * 1024 },
        (err, stdout) => { if (err) reject(err); else resolve(stdout) })
    })
    for (const line of raw.trim().split("\n")) {
      const p = line.trim()
      if (!p) continue
      const ext = p.slice(p.lastIndexOf(".")).toLowerCase()
      if (!exts.has(ext)) continue
      const abs = joinPath(dir, p)
      const rel = p.replace(/\\/g, "/")
      if (rel.split("/").some((seg) => SKIP_DIRS.has(seg) || seg.startsWith("."))) continue
      files.push({ abs, rel })
    }
  } catch { /* ls-files failed */ }

  return files
}


/**
 * Sync code index: scan all source files under dir → chunk → upsert into code_chunks.
 * Incremental by mtime — only rebuilds chunks for files that have changed.
 */
export async function codeSync(memory, dir, { onProgress } = {}) {
  const entries = await listProjectFiles(dir, CODE_EXTS)
  const files = [] // { abs, rel, mtimeMs }
  let overSizeSkipped = 0
  for (const { abs, rel } of entries) {
    let st
    try { st = await stat(abs) } catch { continue }
    if (st.size > MAX_CODE_FILE_BYTES) { overSizeSkipped++; continue }
    files.push({ abs, rel, mtimeMs: Math.floor(st.mtimeMs) })
  }

  const indexed = new Map(
    memory.db.prepare(`SELECT path, mtime_ms FROM code_chunks WHERE origin = ?`).all(dir).map((r) => [r.path, r.mtime_ms])
  )
  const seen = new Set()

  onProgress?.({ phase: "scan", total: files.length, overSizeSkipped })

  let updated = 0, removed = 0, skipped = 0, failed = 0
  const errors = []
  for (let i = 0; i < files.length; i++) {
    const { abs, rel, mtimeMs } = files[i]
    seen.add(rel)

    if (indexed.get(rel) === mtimeMs) {
      skipped++
      continue
    }

    try {
      const text = await readFile(abs, "utf8")
      const lines = text.split("\n")
      const lang = detectLanguage(abs)
      _upsertCodeFile(memory, dir, rel, lines, lang, mtimeMs)
      updated++
    } catch (e) {
      failed++
      if (errors.length < 5) errors.push(`${rel}: ${e.message}`)
    }
    await yieldTick()

    if (onProgress && i % 10 === 0) {
      onProgress({ phase: "index", current: i + 1, total: files.length, updated, removed, skipped, failed })
    }
  }

  for (const stale of indexed.keys()) {
    if (!seen.has(stale)) {
      memory.db.prepare(`DELETE FROM code_chunks WHERE origin = ? AND path = ?`).run(dir, stale)
      removed++
    }
  }

  onProgress?.({ phase: "done", total: files.length, updated, removed, skipped, failed, overSizeSkipped })
  markIndexedCommit(memory, dir)
  return { updated, removed, skipped, failed, errors, total: files.length, overSizeSkipped }
}

/** Record current HEAD as the index anchor (gitSync incremental diff baseline); silently skip non-git repos */
export async function markIndexedCommit(memory, dir) {
  try {
    const { execFile } = await import("node:child_process")
    const head = await new Promise((resolve, reject) => {
      execFile("git", ["rev-parse", "HEAD"], { cwd: dir, encoding: "utf8", timeout: 5000, windowsHide: true }, (err, stdout) => {
        if (err) reject(err); else resolve(stdout)
      })
    })
    memory.db.prepare(`INSERT INTO meta (key, value) VALUES ('last_indexed_commit', ?)
      ON CONFLICT (key) DO UPDATE SET value = excluded.value`).run(head.trim())
  } catch { /* not a git repo or git unavailable, skip */ }
}

/**
 * Code search: FTS5(BM25) + optional vector cosine, RRF merged.
 * Falls back to pure FTS when no embedder; falls back to pure vector when ftsQuery is empty and embedder is present.
 */
export async function codeSearch(memory, query, { limit = 5 } = {}) {
  const ftsQuery = buildFtsQuery(query)
  if (!ftsQuery && !memory.embedder) return []

  const ftsOriginFilter = memory.codeOrigin ? `AND c.origin = ?` : ""
  const vecOriginFilter = memory.codeOrigin ? `AND origin = ?` : ""
  const originParams = memory.codeOrigin ? [memory.codeOrigin] : []

  const ftsList = ftsQuery ? memory.db.prepare(`
    SELECT c.rowid, c.path, c.language, c.symbol_name, c.content, c.line_start, c.line_end, bm25(code_chunks_fts) AS rank
    FROM code_chunks_fts JOIN code_chunks c ON c.rowid = code_chunks_fts.rowid
    WHERE code_chunks_fts MATCH ? ${ftsOriginFilter}
    ORDER BY rank LIMIT ?
  `).all(ftsQuery, ...originParams, Math.max(limit * 4, 20)) : []

  if (!memory.embedder) return ftsList.slice(0, limit)

  try { await ensureEmbeddings(memory) } catch (e) {
    console.error(`[code] embedding ensure failed, falling back to FTS-only: ${e.message}`)
    return ftsList.slice(0, limit)
  }
  let qvec
  try { [qvec] = await embed(memory.embedder, [query]) } catch (e) {
    console.error(`[code] query embedding failed, falling back to FTS-only: ${e.message}`)
    return ftsList.slice(0, limit)
  }
  const rows = memory.db.prepare(`SELECT rowid, embedding FROM code_chunks WHERE embedding IS NOT NULL ${vecOriginFilter}`).all(...originParams)
  const vecList = rows
    .map((r) => ({ rowid: r.rowid, score: cosine(qvec, fromBlob(r.embedding)) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(limit * 4, 20))

  const K = 60
  const scores = new Map()
  ftsList.forEach((r, i) => scores.set(r.rowid, (scores.get(r.rowid) ?? 0) + 1 / (K + i + 1)))
  vecList.forEach((r, i) => scores.set(r.rowid, (scores.get(r.rowid) ?? 0) + 1 / (K + i + 1)))

  const fetchChunk = memory.db.prepare(`
    SELECT path, language, symbol_name, content, line_start, line_end FROM code_chunks WHERE rowid = ?
  `)
  const sorted = [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
  return sorted
    .map(([rowid, score]) => {
      const chunk = fetchChunk.get(rowid)
      if (!chunk) return null
      chunk._score = Math.round(score * 100) / 100
      return chunk
    })
    .filter(Boolean)
}

/** Lazily backfill missing vectors for code_chunks. Guarded against concurrent calls. */
let _codeEmbedLock = null
export function ensureCodeEmbeddings(memory) {
  if (_codeEmbedLock) return _codeEmbedLock
  _codeEmbedLock = _runEnsureCodeEmbeddings(memory).finally(() => { _codeEmbedLock = null })
  return _codeEmbedLock
}

async function _runEnsureCodeEmbeddings(memory) {
  if (!memory.embedder) return
  const modelKey = memory.embedder.model
  const stored = memory.db.prepare(`SELECT value FROM meta WHERE key = 'code_embedding_model'`).get()?.value
  if (stored !== modelKey) {
    memory.db.prepare(`UPDATE code_chunks SET embedding = NULL`).run()
    memory.db.prepare(`INSERT INTO meta (key, value) VALUES ('code_embedding_model', ?)
      ON CONFLICT (key) DO UPDATE SET value = excluded.value`).run(modelKey)
  }

  const pending = memory.db.prepare(`SELECT rowid, path, symbol_name, content FROM code_chunks WHERE embedding IS NULL LIMIT ${CODE_EMBED_BATCH}`).all()
  if (pending.length === 0) return

  const texts = pending.map((r) => `${r.path}${r.symbol_name ? " :: " + r.symbol_name : ""}\n${r.content.slice(0, EMBED_TEXT_MAX_LEN)}`)
  const vecs = await embed(memory.embedder, texts)

  const update = memory.db.prepare(`UPDATE code_chunks SET embedding = ? WHERE rowid = ?`)
  pending.forEach((r, i) => update.run(toBlob(vecs[i]), r.rowid))
}

/** Generate the code_search tool (read-only). */
export function codeSearchTool(memory) {
  return {
    name: "code_search",
    description:
      "Search the project's source code for relevant code. Use this to find functions, classes, or code patterns across the codebase. Supports natural language queries and code snippets. Returns matching code chunks with file paths and line numbers. Prefer doc_search for the intended design (design docs, conventions); code_search for the implementation as written.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Natural language or code snippet to search for" },
        limit: { type: "number", description: "Max results (default 5)" },
      },
      required: ["query"],
    },
    readonly: true,
    async execute(args) {
      const results = await codeSearch(memory, args.query, { limit: args.limit ?? 5 })
      if (results.length === 0) return "(no matching code)"
      return results.map((r) =>
        `${r.path}${r.symbol_name ? ` :: ${r.symbol_name}` : ""} (L${r.line_start}-L${r.line_end}, relevance ${r._score?.toFixed(2) ?? "?"}):\n${r.content.slice(0, 2000)}`
      ).join("\n\n---\n\n")
    },
  }
}

/**
 * Single-file incremental reindex: called after write/edit/delete, only rebuilds this one path.
 */
export async function reindexFile(memory, cwd, absPath) {
  const ext = absPath.slice(absPath.lastIndexOf(".")).toLowerCase()
  const rel = relative(cwd, absPath).replaceAll("\\", "/")
  if (rel === ".." || rel.startsWith("../")) return
  const dirs = rel.split("/").slice(0, -1)
  if (dirs.some((d) => SKIP_DIRS.has(d) || d.startsWith("."))) return

  // skip oversized files (minified bundles, test fixtures, generated code)
  const maxBytes = CODE_EXTS.has(ext) ? MAX_CODE_FILE_BYTES : DOC_EXTS.has(ext) ? MAX_DOC_FILE_BYTES : 0
  if (maxBytes > 0) {
    try { const st = await stat(absPath); if (st.size > maxBytes) return } catch { /* can't stat, proceed */ }
  }

  let text
  try { text = await readFile(absPath, "utf8") } catch {
    if (CODE_EXTS.has(ext)) memory.db.prepare(`DELETE FROM code_chunks WHERE origin = ? AND path = ?`).run(cwd, rel)
    else if (DOC_EXTS.has(ext)) memory.db.prepare(`DELETE FROM doc_chunks WHERE origin = ? AND path = ?`).run(cwd, rel)
    return
  }
  const lines = text.split("\n")

  if (CODE_EXTS.has(ext)) {
    const lang = detectLanguage(absPath)
    let mtimeMs = 0
    try { mtimeMs = Math.floor((await stat(absPath)).mtimeMs) } catch { /* new file */ }
    _upsertCodeFile(memory, cwd, rel, lines, lang, mtimeMs)
  } else if (DOC_EXTS.has(ext)) {
    let mtimeMs = 0
    try { mtimeMs = Math.floor((await stat(absPath)).mtimeMs) } catch { /* new file */ }
    _upsertDocFile(memory, cwd, rel, lines, mtimeMs)
  }
  if (memory.embedder) {
    try { await ensureEmbeddings(memory) } catch { /* embedding failure is non-blocking */ }
  }
}
