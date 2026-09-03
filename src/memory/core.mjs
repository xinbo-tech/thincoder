/**
 * memory/core.mjs — memory CRUD, hybrid retrieval, embedding management
 */

import { parseEntry, serializeEntry, entryFilename } from "../markdown.mjs"
import { embed, cosine, toBlob, fromBlob } from "../embedding.mjs"
import { readFile, stat, readdir, writeFile, mkdir, unlink } from "node:fs/promises"
import { join, resolve } from "node:path"
import { segmentCJK, VALID_TYPES, SCHEMA_VERSION } from "./schema.mjs"

const EMBED_BATCH_SIZE = 256
export const EMBED_TEXT_MAX_LEN = 2000
const FTS_TOKEN_MAX = 16
const DEFAULT_LIST_LIMIT = 50

/**
 * Write a memory entry. entry: { type, title, content, tags? }
 * Returns the new entry id.
 */
export async function put(memory, { type, title, content, tags = "" }) {
  if (!VALID_TYPES.has(type)) {
    throw new Error(`Invalid memory type "${type}"; expected one of: ${[...VALID_TYPES].join(", ")}`)
  }
  if (!title || !content) throw new Error("memory entry requires title and content")
  const now = Date.now()
  const stmt = memory.db.prepare(
    `INSERT INTO entries (type, title, content, tags, seg_title, seg_content, seg_tags, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
  const info = stmt.run(type, title, content, tags, segmentCJK(title), segmentCJK(content), segmentCJK(tags), now, now)
  return Number(info.lastInsertRowid)
}

/**
 * Hybrid retrieval: FTS5(BM25) + vector cosine, RRF(k=60) merged ranking.
 * Falls back to pure FTS when no embedder. Results include layer label.
 * Returns [{ id, layer, type, title, content, tags, rank }]
 */
export async function search(memory, query, { limit = 5 } = {}) {
  const ftsQuery = buildFtsQuery(query)
  const ftsList = ftsQuery ? ftsSearch(memory, ftsQuery, Math.max(limit * 4, 20)) : []

  if (!memory.embedder) return ftsList.slice(0, limit)

  // ---- vector channel ----
  try { await ensureEmbeddings(memory) } catch (e) {
    console.error(`[memory] embedding ensure failed, falling back to FTS-only: ${e.message}`)
    return ftsList.slice(0, limit)
  }
  let qvec
  try { [qvec] = await embed(memory.embedder, [query]) } catch (e) {
    console.error(`[memory] query embedding failed, falling back to FTS-only: ${e.message}`)
    return ftsList.slice(0, limit)
  }
  const vecFilter = memory.projectOrigin ? `AND (layer = 'team' OR origin = ?)` : ""
  const vecParams = memory.projectOrigin ? [memory.projectOrigin] : []
  const rows = memory.db.prepare(`
    SELECT 'personal:' || id AS uid, embedding FROM entries WHERE embedding IS NOT NULL
    UNION ALL
    SELECT layer || ':' || COALESCE(origin, '') || ':' || path AS uid, embedding FROM files WHERE embedding IS NOT NULL ${vecFilter}
  `).all(...vecParams)
  const vecList = rows
    .map((r) => ({ id: r.uid, score: cosine(qvec, fromBlob(r.embedding)) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(limit * 4, 20))

  // ---- RRF merge ----
  const K = 60
  const scores = new Map()
  ftsList.forEach((r, i) => scores.set(r.id, (scores.get(r.id) ?? 0) + 1 / (K + i + 1)))
  vecList.forEach((r, i) => scores.set(r.id, (scores.get(r.id) ?? 0) + 1 / (K + i + 1)))

  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id, score]) => {
      const entry = fetchEntry(memory, id)
      return entry ? { ...entry, rrf: score } : null
    })
    .filter(Boolean)
}

/** Pure FTS search (two-table merge, sorted by bm25), used as the positional input for RRF */
export function ftsSearch(memory, ftsQuery, limit) {
  const personal = memory.db.prepare(`
    SELECT e.id, e.type, e.title, e.content, e.tags, bm25(entries_fts) AS rank
    FROM entries_fts JOIN entries e ON e.id = entries_fts.rowid
    WHERE entries_fts MATCH ?
    ORDER BY rank LIMIT ?
  `).all(ftsQuery, limit).map((r) => ({ ...r, layer: "personal", id: `personal:${r.id}` }))

  const originFilter = memory.projectOrigin ? `AND (f.layer = 'team' OR f.origin = ?)` : ""
  const originParams = memory.projectOrigin ? [ftsQuery, memory.projectOrigin, limit] : [ftsQuery, limit]
  const files = memory.db.prepare(`
    SELECT f.layer, f.origin, f.path, f.type, f.title, f.content, f.tags, f.author, bm25(files_fts) AS rank
    FROM files_fts JOIN files f ON f.rowid = files_fts.rowid
    WHERE files_fts MATCH ? ${originFilter}
    ORDER BY rank LIMIT ?
  `).all(...originParams).map((r) => ({ ...r, id: `${r.layer}:${r.origin}:${r.path}` }))

  return [...personal, ...files].sort((a, b) => a.rank - b.rank).slice(0, limit)
}

/** Fetch a full entry by unified id (personal:<n> / project:<origin>:<path> / team:<origin>:<path>)
 *  Note: since v9 the files table PK is (layer, origin, path); the same layer+path may span multiple origins.
 *  For project layer, prefers the row matching projectOrigin; for team layer, returns any row (first match when multiple team repos share a path). */
export function fetchEntry(memory, uid) {
  const [layer, ...rest] = uid.split(":")
  if (layer === "personal") {
    const r = memory.db.prepare(`SELECT id, type, title, content, tags FROM entries WHERE id = ?`).get(Number(rest[0]))
    return r ? { ...r, layer, id: uid } : null
  }
  // Files branch: origins may contain colons (Windows drive letters, e.g. project:C:\dir:file.md),
  // so the LAST colon is always the origin/path separator — same parsing as deleteByUid.
  // origin may be empty (compat with the old `project::file.md` format).
  const lastColon = uid.lastIndexOf(":")
  const origin = lastColon > layer.length ? uid.slice(layer.length + 1, lastColon) : ""
  const path = lastColon > layer.length ? uid.slice(lastColon + 1) : uid.slice(layer.length + 1)
  if (layer === "project" && memory.projectOrigin) {
    const r = memory.db.prepare(`SELECT type, title, content, tags, author FROM files WHERE layer = ? AND origin = ? AND path = ?`).get(layer, origin || memory.projectOrigin, path)
    if (r) return { ...r, layer, id: uid }
  }
  // team layer or project fallback: query by origin+path; when origin is empty, degrade to path-only (compat with old UID)
  if (origin) {
    const r = memory.db.prepare(`SELECT type, title, content, tags, author FROM files WHERE layer = ? AND origin = ? AND path = ?`).get(layer, origin, path)
    if (r) return { ...r, layer, id: uid }
  }
  const r = memory.db.prepare(`SELECT type, title, content, tags, author FROM files WHERE layer = ? AND path = ?`).get(layer, path || rest.join(":"))
  return r ? { ...r, layer, id: uid } : null
}

/**
 * Lazy embedding: batch-compute vectors for entries that don't have them yet (slow first time, zero cost thereafter).
 * When the embedding model changes, clear all vectors and rebuild.
 * Guarded by a module-level lock — concurrent fire-and-forget callers share the same promise,
 * so embedding API calls are never duplicated.
 */
let _embedLock = null
export function ensureEmbeddings(memory) {
  if (_embedLock) return _embedLock
  _embedLock = _runEnsureEmbeddings(memory).finally(() => { _embedLock = null })
  return _embedLock
}

async function _runEnsureEmbeddings(memory) {
  const modelKey = memory.embedder.model
  const stored = memory.db.prepare(`SELECT value FROM meta WHERE key = 'embedding_model'`).get()?.value
  if (stored !== modelKey) {
    // Invalidate all three tables + three meta keys in one go, to prevent stale vectors from dimension mismatch
    memory.db.prepare(`UPDATE entries SET embedding = NULL`).run()
    memory.db.prepare(`UPDATE files SET embedding = NULL`).run()
    memory.db.prepare(`UPDATE code_chunks SET embedding = NULL`).run()
    memory.db.prepare(`UPDATE doc_chunks SET embedding = NULL`).run()
    const upsert = memory.db.prepare(`INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value`)
    upsert.run("embedding_model", modelKey)
    upsert.run("code_embedding_model", modelKey)
    upsert.run("doc_embedding_model", modelKey)
  }

  const pendingEntries = memory.db.prepare(`SELECT id, title, content FROM entries WHERE embedding IS NULL LIMIT ${EMBED_BATCH_SIZE}`).all()
  const pendingFiles = memory.db.prepare(`SELECT rowid, title, content FROM files WHERE embedding IS NULL LIMIT ${EMBED_BATCH_SIZE}`).all()
  if (pendingEntries.length + pendingFiles.length === 0) {
    // No pending memory entries — also backfill code and doc chunk vectors
    await (await import("./code-sync.mjs")).ensureCodeEmbeddings(memory)
    await (await import("./docs.mjs")).ensureDocEmbeddings(memory)
    return
  }

  const items = [...pendingEntries, ...pendingFiles]
  const texts = items.map((r) => `${r.title}\n${r.content.slice(0, EMBED_TEXT_MAX_LEN)}`)
  const vecs = await embed(memory.embedder, texts)

  const updateEntry = memory.db.prepare(`UPDATE entries SET embedding = ? WHERE id = ?`)
  pendingEntries.forEach((r, i) => updateEntry.run(toBlob(vecs[i]), r.id))
  const updateFile = memory.db.prepare(`UPDATE files SET embedding = ? WHERE rowid = ?`)
  pendingFiles.forEach((r, i) => updateFile.run(toBlob(vecs[pendingEntries.length + i]), r.rowid))

  // After each batch of embeddings, also backfill code and doc chunks
  await (await import("./code-sync.mjs")).ensureCodeEmbeddings(memory)
  await (await import("./docs.mjs")).ensureDocEmbeddings(memory)
}

/**
 * Write a markdown memory entry to the specified layer directory (project/team) and index it immediately.
 * Writes the file only — the project layer never performs git operations on the user's project repo;
 * team layer commit+push is handled by gitmem.mjs.
 * Returns the filename.
 */
export async function putMarkdown(memory, { layer, dir, type, title, content, tags = [], author = "unknown" }) {
  if (layer !== "project" && layer !== "team") throw new Error(`invalid markdown layer: ${layer}`)
  const filename = entryFilename(title)
  const markdown = serializeEntry({ type, title, tags, author }, content)
  await mkdir(dir, { recursive: true })
  await writeFile(join(dir, filename), markdown, "utf8")
  await indexMarkdownFile(memory, { layer, dir, filename })
  return filename
}

/**
 * Sync a markdown directory to the index: new/changed (by mtime) entries are re-indexed,
 * vanished entries are removed from the index.
 */
export async function syncDir(memory, { layer, dir }) {
  let names
  try {
    names = (await readdir(dir)).filter((n) => n.endsWith(".md"))
  } catch {
    names = []
  }

  const indexed = new Map(
    memory.db.prepare(`SELECT path, mtime_ms FROM files WHERE layer = ? AND origin = ?`).all(layer, dir).map((r) => [r.path, r.mtime_ms]),
  )

  let added = 0, updated = 0, skipped = 0
  for (const filename of names) {
    const mtimeMs = Math.floor((await stat(join(dir, filename))).mtimeMs)
    const old = indexed.get(filename)
    const isNew = old === undefined
    if (!isNew && old === mtimeMs) continue
    try {
      await indexMarkdownFile(memory, { layer, dir, filename, mtimeMs })
    } catch (e) {
      console.error(`[memory] skip ${layer}/${filename}: ${e.message}`)
      skipped++
      indexed.delete(filename)
      continue
    }
    if (isNew) added++
    else updated++
    indexed.delete(filename)
  }

  let removed = 0
  for (const stale of indexed.keys()) {
    memory.db.prepare(`DELETE FROM files WHERE layer = ? AND origin = ? AND path = ?`).run(layer, dir, stale)
    removed++
  }
  return { added, updated, removed, skipped }
}

/** Parse a single .md and upsert into the files table */
export async function indexMarkdownFile(memory, { layer, dir, filename, mtimeMs }) {
  const abs = join(dir, filename)
  const mtime = mtimeMs ?? Math.floor((await stat(abs)).mtimeMs)
  const { meta, content } = parseEntry(await readFile(abs, "utf8"))
  const tags = meta.tags.join(" ")
  memory.db.prepare(`
    INSERT INTO files (layer, origin, path, type, title, content, tags, author, mtime_ms, seg_title, seg_content, seg_tags, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(layer, origin, path) DO UPDATE SET
      type=excluded.type, title=excluded.title, content=excluded.content, tags=excluded.tags,
      author=excluded.author, mtime_ms=excluded.mtime_ms, origin=excluded.origin,
      seg_title=excluded.seg_title, seg_content=excluded.seg_content, seg_tags=excluded.seg_tags,
      updated_at=excluded.updated_at
  `).run(
    layer, dir, filename, meta.type, meta.title, content, tags, meta.author, mtime,
    segmentCJK(meta.title), segmentCJK(content), segmentCJK(tags), Date.now(),
  )
}

/** List entries, optionally filtered by type */
export async function list(memory, { type, limit = DEFAULT_LIST_LIMIT } = {}) {
  if (type) {
    if (!VALID_TYPES.has(type)) throw new Error(`Invalid memory type "${type}"`)
    return memory.db
      .prepare(`SELECT id, type, title, content, tags, updated_at FROM entries WHERE type = ? ORDER BY updated_at DESC LIMIT ?`)
      .all(type, limit)
  }
  return memory.db
    .prepare(`SELECT id, type, title, content, tags, updated_at FROM entries ORDER BY updated_at DESC LIMIT ?`)
    .all(limit)
}

/** LIKE pattern from a keyword (wildcards escaped — literal substring match, MEMORY.md §6 keyword filter). */
function likePattern(keyword) {
  return `%${keyword.replace(/[\\%_]/g, (c) => `\\${c}`)}%`
}

/**
 * Shared row query for the §6 list action and the §6 batch delete (one match surface —
 * rows carry { layer, id, type, title, ts }). Filters:
 *   scope: "personal" | "project" | "team" | null (null = all layers)
 *   type / keyword: optional (keyword matches title OR content, LIKE)
 * File-layer rows are restricted to the dirs this memory context manages (origin = the
 * passed dir — search parity): project rows to projectDir, team rows to teamDir. Rows
 * from other projects'/team repos' origins stay out of list AND batch delete — the tool
 * can only act on files it can locate. Sorted by ts (created/updated, ms) DESC.
 */
export function matchMemoryRows(memory, { scope = null, type = null, keyword = null, projectDir = null, teamDir = null } = {}) {
  const rows = []
  const wantLayer = (l) => !scope || scope === l
  if (wantLayer("personal")) {
    let sql = `SELECT id, type, title, created_at AS ts FROM entries`
    const cond = []
    const params = []
    if (type) { cond.push("type = ?"); params.push(type) }
    if (keyword) { cond.push("(title LIKE ? ESCAPE '\\' OR content LIKE ? ESCAPE '\\')"); const p = likePattern(keyword); params.push(p, p) }
    if (cond.length) sql += " WHERE " + cond.join(" AND ")
    sql += " ORDER BY created_at DESC"
    for (const r of memory.db.prepare(sql).all(...params)) {
      rows.push({ layer: "personal", id: `personal:${r.id}`, uid: `personal:${r.id}`, type: r.type, title: r.title, ts: r.ts })
    }
  }
  if (wantLayer("project") && projectDir) {
    for (const r of fileRows(memory, "project", projectDir, type, keyword)) rows.push({ ...r, id: `project:${projectDir}:${r.path}` })
  }
  if (wantLayer("team") && teamDir) {
    for (const r of fileRows(memory, "team", teamDir, type, keyword)) rows.push({ ...r, id: `team:${teamDir}:${r.path}` })
  }
  rows.sort((a, b) => (b.ts ?? 0) - (a.ts ?? 0))
  return rows
}

function fileRows(memory, layer, dir, type, keyword) {
  let sql = `SELECT path, type, title, updated_at AS ts FROM files WHERE layer = ? AND origin = ?`
  const cond = []
  const params = [layer, dir]
  if (type) { cond.push("type = ?"); params.push(type) }
  if (keyword) { cond.push("(title LIKE ? ESCAPE '\\' OR content LIKE ? ESCAPE '\\')"); const p = likePattern(keyword); params.push(p, p) }
  if (cond.length) sql += " AND " + cond.join(" AND ")
  sql += " ORDER BY updated_at DESC"
  return memory.db.prepare(sql).all(...params).map((r) => ({ layer, path: r.path, type: r.type, title: r.title, ts: r.ts }))
}

/**
 * §6 batch delete (action delete + type/keyword filter, confirm handled by the tool layer):
 * deletes every row matchMemoryRows returns for the scope. Personal rows go straight to the
 * DB (FTS + embedding cleanup via row triggers); project/team rows delete the markdown file
 * (path containment enforced, ENOENT tolerated) then re-sync the layer dir once (index
 * cleanup single source). Team deletion never touches git — a later gitmem pull may
 * resurrect the file while the remote still has it (same semantics as deleteByUid).
 * Returns the number of deleted rows.
 */
export async function deleteWhere(memory, { scope, type = null, keyword = null } = {}, { dirs = {} } = {}) {
  const rows = matchMemoryRows(memory, { scope, type, keyword, projectDir: dirs.project ?? null, teamDir: dirs.team ?? null })
  if (rows.length === 0) return 0
  const personalIds = []
  const byDir = new Map() // "layer\x00dir" → { layer, dir, paths: [] }
  for (const r of rows) {
    if (r.layer === "personal") {
      const id = Number(String(r.uid).split(":")[1])
      if (Number.isInteger(id)) personalIds.push(id)
      continue
    }
    const dir = r.layer === "project" ? dirs.project : dirs.team
    if (!dir) continue
    const key = `${r.layer}\x00${dir}`
    let group = byDir.get(key)
    if (!group) { group = { layer: r.layer, dir, paths: [] }; byDir.set(key, group) }
    group.paths.push(r.path)
  }
  const del = memory.db.prepare(`DELETE FROM entries WHERE id = ?`)
  for (const id of personalIds) del.run(id)
  for (const group of byDir.values()) {
    for (const path of group.paths) {
      assertPathInside(group.dir, path)
      const abs = join(group.dir, path)
      await unlink(abs).catch((e) => { if (e.code !== "ENOENT") throw e })
    }
    await syncDir(memory, { layer: group.layer, dir: group.dir })
  }
  return rows.length
}

/** §6 clear action: wipe ALL personal entries (pure DB rows — files are project/team only).
 *  FTS + embedding go with the row triggers. Returns the number of deleted rows. */
export function clearPersonal(memory) {
  const { changes } = memory.db.prepare(`DELETE FROM entries`).run()
  return changes
}

/** Delete a memory entry by unified id. Returns the deleted entry (F3: { id, layer, type, title, content, tags }).
 *  - personal:<n> (or bare <n>) → DELETE the entries row; FTS syncs via the entries_ad trigger and the
 *    embedding BLOB column goes with the row.
 *  - project:<origin>:<path> / team:<origin>:<path> → delete the markdown file (path must resolve inside
 *    the layer dir — dirs[layer], passed by the caller — `..`/absolute variants (incl. `..\`) are rejected),
 *    then syncDir clears the files row (single source of index cleanup). ENOENT on the file is treated as
 *    already-deleted and continues. Team deletion never touches git (git propagation is gitmem's job; a
 *    later gitmem pull may resurrect the file while the remote still has it).
 *  Throws on invalid id / missing entry (NF2) / path escaping the layer dir. */
export async function deleteByUid(memory, uid, { dirs = {} } = {}) {
  const norm = /^\d+$/.test(uid) ? `personal:${uid}` : String(uid)
  const [layer, ...rest] = norm.split(":")
  if (layer === "personal") {
    const id = rest[0] ?? ""
    if (!/^\d+$/.test(id)) throw new Error(`invalid memory id: ${norm}`)
    const entry = fetchEntry(memory, norm)
    if (!entry) throw new Error(`memory ${norm} not found in scope personal`)
    memory.db.prepare(`DELETE FROM entries WHERE id = ?`).run(Number(id))
    return entry
  }
  if (layer !== "project" && layer !== "team") throw new Error(`invalid memory id: ${norm}`)
  const dir = dirs[layer]
  if (!dir) throw new Error(`${layer} scope unavailable: no ${layer} directory configured`)
  // path = segment after the LAST colon — origins may contain colons (Windows drive letters)
  const lastColon = norm.lastIndexOf(":")
  const path = lastColon > layer.length ? norm.slice(lastColon + 1) : norm.slice(layer.length + 1)
  assertPathInside(dir, path)
  let entry = fetchFileEntry(memory, layer, norm, path)
  const abs = join(dir, path)
  let fileExists = false
  try { await stat(abs); fileExists = true } catch { /* ENOENT — treat as already deleted */ }
  if (!entry && fileExists) {
    try {
      const { meta, content } = parseEntry(await readFile(abs, "utf8"))
      entry = { layer, id: norm, type: meta.type, title: meta.title, content, tags: meta.tags.join(" ") }
    } catch { /* malformed file — keep the DB row (or null → not found below) */ }
  }
  if (!entry) throw new Error(`memory ${norm} not found in scope ${layer}`)
  if (fileExists) await unlink(abs).catch((e) => { if (e.code !== "ENOENT") throw e })
  await syncDir(memory, { layer, dir })
  return entry
}

/** Legacy personal-only delete (bare numeric id) — kept as the compat surface over deleteByUid. */
export async function remove(memory, id) {
  const uid = /^\d+$/.test(String(id)) ? `personal:${id}` : String(id)
  if (!fetchEntry(memory, uid)) return false
  await deleteByUid(memory, uid, {})
  return true
}

/** Fetch a project/team file row for deletion: fetchEntry first, then a path-only fallback
 *  (origins with Windows drive letters, e.g. project:C:\dir:file.md, break naive ":" splitting). */
function fetchFileEntry(memory, layer, uid, path) {
  const entry = fetchEntry(memory, uid)
  if (entry) return entry
  const r = memory.db.prepare(`SELECT type, title, content, tags, author FROM files WHERE layer = ? AND path = ?`).get(layer, path)
  return r ? { ...r, layer, id: uid } : null
}

/** Separator-agnostic containment check: the resolved path must stay inside dir.
 *  Both / and \ count as separators, so Windows-style traversal (..\..\x) is caught on every platform. */
function assertPathInside(dir, path) {
  if (!path) throw new Error(`invalid memory id: empty path`)
  const base = resolve(dir).replaceAll("\\", "/")
  const abs = resolve(dir, path.replaceAll("\\", "/")).replaceAll("\\", "/")
  if (abs !== base && !abs.startsWith(base + "/")) {
    throw new Error(`invalid memory path "${path}": must stay within ${dir}`)
  }
}

/**
 * Build an FTS5 query: first split by whitespace/punctuation into tokens,
 * then apply CJK character segmentation to each token.
 * This keeps multi-character CJK words as FTS5 phrases ("分号" → "分 号" → phrase query, exact adjacency match),
 * while different tokens are joined with OR ("命名 规范" → "命 名" OR "规 范", each phrase requires its own adjacency).
 */
export function buildFtsQuery(query) {
  const terms = query
    .split(/[\s,，。、;；!！?？()（）"`]+/)
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, FTS_TOKEN_MAX)
    .map((t) => segmentCJK(t))
  if (terms.length === 0) return ""
  return terms.map((t) => `"${t.replaceAll('"', '""')}"`).join(" OR ")
}
