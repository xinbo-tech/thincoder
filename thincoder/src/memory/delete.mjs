/**
 * memory/delete.mjs — file-layer disk-truth row match + deletion family.
 *
 * Split out of core.mjs (2026-09-08 — core.mjs crossed the 500-line hard limit).
 * Owns: the shared §6 list/batch-delete row match (matchMemoryRows/diskFileRows/
 * likePattern — one match surface, MEMORY.md §6), single/batch deletion
 * (deleteByUid/deleteWhere), the legacy personal-only compat shell (remove),
 * file-row fetching and path containment (fetchFileEntry/assertPathInside).
 *
 * Imports CRUD/retrieval/sync primitives from core.mjs (fetchEntry/syncDir) —
 * one direction, no cycle.
 */

import { parseEntry } from "../markdown.mjs"
import { readFile, stat, readdir, unlink } from "node:fs/promises"
import { join, resolve } from "node:path"
import { fetchEntry, syncDir } from "./core.mjs"

/** LIKE pattern from a keyword (wildcards escaped — literal substring match, MEMORY.md §6 keyword filter). */
function likePattern(keyword) {
  return `%${keyword.replace(/[\\%_]/g, (c) => `\\${c}`)}%`
}

/**
 * Shared row query for the §6 list action and the §6 batch delete (one match surface —
 * rows carry { layer, id, type, title, ts }). Filters:
 *   layer: "personal" | "project" | "team" | null (null = all layers)
 *   type / keyword: optional (keyword matches title OR content, substring)
 * Personal rows come from the entries table; project/team rows come from a DISK scan of
 * the managed dir (2026-09-05 fix — disk is the truth): files present on disk but
 * missing from the files index (orphans: external copies / gitmem pull / an earlier
 * index failure) were invisible to list AND immune to batch delete — the old table-only
 * match surface made a layer wipe need repeated delete rounds (deleteWhere→syncDir
 * re-indexed the orphans one round later). Scanning disk keeps list and batch delete
 * consistent with what the user can see and delete. Rows from other projects'/team
 * repos' dirs stay out (the scan only covers the dirs this memory context manages).
 * Malformed files are skipped (parseEntry failure — same semantics as syncDir). Sorted
 * by ts (created/updated, ms) DESC.
 */
export async function matchMemoryRows(memory, { layer = null, type = null, keyword = null, projectDir = null, teamDir = null } = {}) {
  const rows = []
  const wantLayer = (l) => !layer || layer === l
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
    for (const r of await diskFileRows(projectDir, type, keyword)) rows.push({ ...r, layer: "project", id: `project:${projectDir}:${r.path}` })
  }
  if (wantLayer("team") && teamDir) {
    for (const r of await diskFileRows(teamDir, type, keyword)) rows.push({ ...r, layer: "team", id: `team:${teamDir}:${r.path}` })
  }
  rows.sort((a, b) => (b.ts ?? 0) - (a.ts ?? 0))
  return rows
}

/**
 * Disk-truth file scan for the project/team layer (2026-09-05 fix — see matchMemoryRows):
 * readdir + parse every .md entry in dir, filter by type equality and keyword substring
 * on title OR content (case-insensitive — SQLite LIKE parity). ts = file mtime (ms).
 * Rows come back WITHOUT the layer field — the caller stamps layer and builds the uid.
 */
async function diskFileRows(dir, type, keyword) {
  let names
  try {
    names = (await readdir(dir)).filter((n) => n.endsWith(".md"))
  } catch {
    return []
  }
  const kw = keyword ? keyword.toLowerCase() : null
  const out = []
  for (const name of names) {
    try {
      const abs = join(dir, name)
      const { meta, content } = parseEntry(await readFile(abs, "utf8"))
      if (type && meta.type !== type) continue
      if (kw && !(meta.title.toLowerCase().includes(kw) || content.toLowerCase().includes(kw))) continue
      const mtime = Math.floor((await stat(abs)).mtimeMs)
      out.push({ path: name, type: meta.type, title: meta.title, ts: mtime })
    } catch (e) {
      console.error(`[memory] skip ${name}: ${e.message}`)
    }
  }
  out.sort((a, b) => b.ts - a.ts)
  return out
}

/**
 * §6 batch delete (action delete + type/keyword filter, confirm handled by the tool layer):
 * deletes every row matchMemoryRows returns for the layer. Personal rows go straight to the
 * DB (FTS + embedding cleanup via row triggers); project/team rows delete the markdown file
 * (path containment enforced, ENOENT tolerated) then re-sync the layer dir once (index
 * cleanup single source). Match surface = disk scan (2026-09-05 fix — orphans on disk
 * with no index row are matched and deleted in the same pass; the trailing syncDir
 * re-indexes the survivors). Team deletion never touches git — a later gitmem pull may
 * resurrect the file while the remote still has it (same semantics as deleteByUid).
 * Returns the number of deleted rows.
 */
export async function deleteWhere(memory, { layer, type = null, keyword = null } = {}, { dirs = {} } = {}) {
  const rows = await matchMemoryRows(memory, { layer, type, keyword, projectDir: dirs.project ?? null, teamDir: dirs.team ?? null })
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

/** Delete a memory entry by unified id. Returns the deleted entry (F3: { id, layer, type, title, content, tags }).
 *  - personal:<n> (or bare <n>) → DELETE the entries row; FTS syncs via the entries_ad trigger and the
 *    embedding BLOB column goes with the row.
 *  - project:<origin>:<path> / team:<origin>:<path> → delete the markdown file at the uid's ORIGIN dir
 *    (2026-09-08, MEMORY.md §6.2: search rows surfaced from a non-current origin — another project's
 *    memory dir / another team clone — must be deletable where the file actually lives; the caller's
 *    dirs[layer] is only the fallback base for origin-less legacy uids `project::file.md`/`project:file.md`).
 *    Path containment is enforced against that base (assertPathInside — `..`/absolute variants incl.
 *    `..\` are rejected), then syncDir clears the files row (single source of index cleanup). ENOENT on
 *    the file is treated as already-deleted and continues; when the origin dir is missing locally,
 *    syncDir still drops the stale (layer, origin) index rows (readdir of a missing dir yields nothing —
 *    every row of a vanished dir is stale). Team deletion never touches git (git propagation is gitmem's
 *    job; a later gitmem pull may resurrect the file while the remote still has it).
 *  Throws on invalid id / missing entry (NF2) / path escaping the base dir.
 *  2026-09-08 (code review): the orphan-disk fallback below is confined to managed memory dirs —
 *    an unmanaged origin must not make deleteByUid a crafted-id deletion primitive. */
export async function deleteByUid(memory, uid, { dirs = {} } = {}) {
  const norm = /^\d+$/.test(uid) ? `personal:${uid}` : String(uid)
  const [layer, ...rest] = norm.split(":")
  if (layer === "personal") {
    // 畸形尾缀拒绝（2026-09-08 代码正确性批 2.2）：personal:5:extra 不得静默删 id=5
    if (norm.split(":").length > 2) throw new Error(`invalid memory id: ${norm}`)
    const id = rest[0] ?? ""
    if (!/^\d+$/.test(id)) throw new Error(`invalid memory id: ${norm}`)
    const entry = fetchEntry(memory, norm)
    if (!entry) throw new Error(`memory ${norm} not found in layer personal`)
    memory.db.prepare(`DELETE FROM entries WHERE id = ?`).run(Number(id))
    return entry
  }
  if (layer !== "project" && layer !== "team") throw new Error(`invalid memory id: ${norm}`)
  // origin = between the layer prefix and the LAST colon (origins may contain colons — Windows drive
  // letters); path = segment after the last colon. Empty origin = legacy uid (`project::file.md` /
  // `project:file.md`) → dirs[layer] fallback.
  const lastColon = norm.lastIndexOf(":")
  const origin = lastColon > layer.length ? norm.slice(layer.length + 1, lastColon) : ""
  const path = lastColon > layer.length ? norm.slice(lastColon + 1) : norm.slice(layer.length + 1)
  const dir = origin || dirs[layer]
  if (!dir) throw new Error(`${layer} layer unavailable: no ${layer} directory configured for an origin-less id`)
  assertPathInside(dir, path)
  // Entry lookup: exact (layer, origin, path) row for origin-ful uids — the delete target is the uid's
  // own dir, so a path-only fallback row from another origin must not be reported as deleted.
  // Origin-less legacy uids keep the compat fallbacks (fetchFileEntry: current-origin then path-only).
  let entry = null
  if (origin) {
    const r = memory.db.prepare(`SELECT type, title, content, tags, author FROM files WHERE layer = ? AND origin = ? AND path = ?`).get(layer, origin, path)
    if (r) entry = { ...r, layer, id: norm }
  } else {
    entry = fetchFileEntry(memory, layer, norm, path)
  }
  const abs = join(dir, path)
  let fileExists = false
  try { await stat(abs); fileExists = true } catch { /* ENOENT — treat as already deleted */ }
  if (!entry && fileExists) {
    // Origin confinement (2026-09-08 code review): the orphan fallback deletes a file that has NO
    // index row — only allow it when the origin is a managed memory dir (it already has files rows,
    // or it is the caller's current layer dir). A uid naming an unmanaged directory must not delete
    // a memory-shaped .md there.
    if (origin && origin !== dirs[layer]) {
      const known = memory.db.prepare(`SELECT 1 FROM files WHERE layer = ? AND origin = ? LIMIT 1`).get(layer, origin)
      if (!known) throw new Error(`memory ${norm} not found in layer ${layer}: origin is not a managed ${layer} memory dir`)
    }
    try {
      const { meta, content } = parseEntry(await readFile(abs, "utf8"))
      entry = { layer, id: norm, type: meta.type, title: meta.title, content, tags: meta.tags.join(" ") }
    } catch { /* malformed file — keep the DB row (or null → not found below) */ }
  }
  if (!entry) throw new Error(`memory ${norm} not found in layer ${layer}`)
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
 *  Both / and \ count as separators, so Windows-style traversal (..\..\\x) is caught on every platform. */
function assertPathInside(dir, path) {
  if (!path) throw new Error(`invalid memory id: empty path`)
  const base = resolve(dir).replaceAll("\\", "/")
  const abs = resolve(dir, path.replaceAll("\\", "/")).replaceAll("\\", "/")
  if (abs !== base && !abs.startsWith(base + "/")) {
    throw new Error(`invalid memory path "${path}": must stay within ${dir}`)
  }
}
