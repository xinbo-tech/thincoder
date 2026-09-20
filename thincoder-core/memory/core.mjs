/**
 * memory/core.mjs — memory CRUD, hybrid retrieval, embedding management.
 * The disk-truth row-match + deletion family (matchMemoryRows/deleteWhere/deleteByUid/remove/
 * assertPathInside) lives in delete.mjs — this module imports nothing from it (delete.mjs
 * imports fetchEntry/syncDir from here).
 */

import { parseEntry, serializeEntry, entryFilename } from "../markdown.mjs"
import { embed, cosine, toBlob, fromBlob } from "../embedding.mjs"
import { scanVectors, createTopK } from "./scan.mjs"
import { normalizeOrigin } from "./origin.mjs"
import { readFile, stat, readdir, writeFile, mkdir } from "node:fs/promises"
import { join } from "node:path"
import { segmentCJK, VALID_TYPES, SCHEMA_VERSION } from "./schema.mjs"
import { safeSliceUTF16 } from "../text-budget.mjs"

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
  // §6.11 读缝归一（单点取名——函数体内一律用归一值）
  const projectOrigin = normalizeOrigin(memory.projectOrigin)
  const vecFilter = projectOrigin ? `AND (layer = 'team' OR origin = ?)` : ""
  const vecParams = projectOrigin ? [projectOrigin] : []
  // TUI-OOM-ROOTCAUSE（MEMORY.md §6.8）：分块扫描 + 有界 top-K（原全表 .all() 物化 +
  // 全量排序——峰值 = 块 + K；召回语义不变）。两表各自游标扫描、共享同一 top-K。
  // TUI 假死批（§6.10）：scanVectors = async（让出）——游标键缺省 rowid（= 本表 PK 别名，零改）。
  const top = createTopK(Math.max(limit * 4, 20))
  const onRow = (r) => top.push({ id: r.uid, score: cosine(qvec, fromBlob(r.embedding)) })
  await scanVectors(memory.db, `SELECT rowid, 'personal:' || id AS uid, embedding FROM entries WHERE embedding IS NOT NULL`, [], { onRow })
  await scanVectors(memory.db, `SELECT rowid, layer || ':' || COALESCE(origin, '') || ':' || path AS uid, embedding FROM files WHERE embedding IS NOT NULL ${vecFilter}`, vecParams, { onRow })
  const vecList = top.list()

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

  const projectOrigin = normalizeOrigin(memory.projectOrigin) // §6.11 读缝归一
  const originFilter = projectOrigin ? `AND (f.layer = 'team' OR f.origin = ?)` : ""
  const originParams = projectOrigin ? [ftsQuery, projectOrigin, limit] : [ftsQuery, limit]
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
  const projectOrigin = normalizeOrigin(memory.projectOrigin) // §6.11 读缝归一（uid 解析面零改——`:131` 余量兜底仍在）
  if (layer === "project" && projectOrigin) {
    const r = memory.db.prepare(`SELECT type, title, content, tags, author FROM files WHERE layer = ? AND origin = ? AND path = ?`).get(layer, origin || projectOrigin, path)
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
  const texts = items.map((r) => `${r.title}\n${safeSliceUTF16(r.content, EMBED_TEXT_MAX_LEN)}`)
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
  const origin = normalizeOrigin(dir) // §6.11 写缝归一（目录 I/O 用原样 dir；与库面比较一律用归一值）
  let names
  try {
    names = (await readdir(dir)).filter((n) => n.endsWith(".md"))
  } catch {
    names = []
  }

  const indexed = new Map(
    memory.db.prepare(`SELECT path, mtime_ms FROM files WHERE layer = ? AND origin = ?`).all(layer, origin).map((r) => [r.path, r.mtime_ms]),
  )

  let added = 0, updated = 0, skipped = 0
  for (const filename of names) {
    let mtimeMs
    // 档在 readdir 与 stat 之间消失 / 不可读 ⇒ 跳过本行（**不**移出 stale 候选：该文件已无
    // 盘面依据，交由下方清理移除其索引行——避免 stat 抛出打断整趟 sync，调用面
    // `deleteByUid` 先 unlink 后 syncDir，抛出即「删除已成功却报失败」）
    try { mtimeMs = Math.floor((await stat(join(dir, filename))).mtimeMs) } catch { continue }
    const old = indexed.get(filename)
    const isNew = old === undefined
    if (!isNew && old === mtimeMs) {
      // 已见且未变：行完好——**必须**移出 stale 候选（既有缺陷修复：原 `continue` 不带
      // delete ⇒ 未变文件被下方清理误删，索引在两次 sync 间 1→0→1 翻覆；T-O1 暴露）
      skipped++
      indexed.delete(filename)
      continue
    }
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
    memory.db.prepare(`DELETE FROM files WHERE layer = ? AND origin = ? AND path = ?`).run(layer, origin, stale)
    removed++
  }
  return { added, updated, removed, skipped }
}

/** Parse a single .md and upsert into the files table */
export async function indexMarkdownFile(memory, { layer, dir, filename, mtimeMs }) {
  const origin = normalizeOrigin(dir) // §6.11 写缝归一（文件 I/O 用原样 dir；origin 列用归一值）
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
    layer, origin, filename, meta.type, meta.title, content, tags, meta.author, mtime,
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

/** §6 clear action: wipe ALL personal entries (pure DB rows — files are project/team only).
 *  FTS + embedding go with the row triggers. Returns the number of deleted rows. */
export function clearPersonal(memory) {
  const { changes } = memory.db.prepare(`DELETE FROM entries`).run()
  return changes
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
