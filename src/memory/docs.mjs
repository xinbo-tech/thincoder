/**
 * memory/docs.mjs — doc index sync, retrieval, agent tool generation
 */

import { readFile, stat } from "node:fs/promises"
import { join } from "node:path"
import { embed, cosine, toBlob, fromBlob } from "../embedding.mjs"
import { commitAndPush } from "../git/gitmem.mjs"
import { DOC_EXTS, SKIP_DIRS, MAX_DOC_FILE_BYTES } from "./schema.mjs"
import { buildFtsQuery, put, search, putMarkdown, deleteByUid, EMBED_TEXT_MAX_LEN } from "./core.mjs"
import { _upsertDocFile, yieldTick } from "./code-index.mjs"
import { markIndexedCommit, listProjectFiles } from "./code-sync.mjs"

const DOC_EMBED_BATCH = 64

/**
 * Sync doc index: scan all .md/.mdc/.txt/.rst/.adoc under dir → chunk → upsert into doc_chunks.
 * Incremental by mtime.
 */
export async function docSync(memory, dir, { onProgress } = {}) {
  const entries = await listProjectFiles(dir, DOC_EXTS)
  const files = [] // { abs, rel, mtimeMs }
  let overSizeSkipped = 0
  for (const { abs, rel } of entries) {
    let st
    try { st = await stat(abs) } catch { continue }
    if (st.size > MAX_DOC_FILE_BYTES) { overSizeSkipped++; continue }
    files.push({ abs, rel, mtimeMs: Math.floor(st.mtimeMs) })
  }

  const indexed = new Map(
    memory.db.prepare(`SELECT path, mtime_ms FROM doc_chunks WHERE origin = ?`).all(dir).map((r) => [r.path, r.mtime_ms])
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
      _upsertDocFile(memory, dir, rel, lines, mtimeMs)
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
      memory.db.prepare(`DELETE FROM doc_chunks WHERE origin = ? AND path = ?`).run(dir, stale)
      removed++
    }
  }

  onProgress?.({ phase: "done", total: files.length, updated, removed, skipped, failed, overSizeSkipped })
  markIndexedCommit(memory, dir)
  return { updated, removed, skipped, failed, errors, total: files.length, overSizeSkipped }
}

/**
 * Doc search: FTS5(BM25) + optional vector cosine, RRF merged.
 * Falls back to pure FTS when no embedder; falls back to pure vector when ftsQuery is empty and embedder is present.
 */
export async function docSearch(memory, query, { limit = 5 } = {}) {
  const ftsQuery = buildFtsQuery(query)
  if (!ftsQuery && !memory.embedder) return []

  const ftsOriginFilter = memory.codeOrigin ? `AND d.origin = ?` : ""
  const vecOriginFilter = memory.codeOrigin ? `AND origin = ?` : ""
  const originParams = memory.codeOrigin ? [memory.codeOrigin] : []

  const ftsList = ftsQuery ? memory.db.prepare(`
    SELECT d.rowid, d.path, d.language, d.heading, d.content, d.line_start, d.line_end, bm25(doc_chunks_fts) AS rank
    FROM doc_chunks_fts JOIN doc_chunks d ON d.rowid = doc_chunks_fts.rowid
    WHERE doc_chunks_fts MATCH ? ${ftsOriginFilter}
    ORDER BY rank LIMIT ?
  `).all(ftsQuery, ...originParams, Math.max(limit * 4, 20)) : []

  if (!memory.embedder) return ftsList.slice(0, limit)

  try { await ensureDocEmbeddings(memory) } catch (e) {
    console.error(`[docs] embedding ensure failed, falling back to FTS-only: ${e.message}`)
    return ftsList.slice(0, limit)
  }
  let qvec
  try { [qvec] = await embed(memory.embedder, [query]) } catch (e) {
    console.error(`[docs] query embedding failed, falling back to FTS-only: ${e.message}`)
    return ftsList.slice(0, limit)
  }
  const rows = memory.db.prepare(`SELECT rowid, embedding FROM doc_chunks WHERE embedding IS NOT NULL ${vecOriginFilter}`).all(...originParams)
  const vecList = rows
    .map((r) => ({ rowid: r.rowid, score: cosine(qvec, fromBlob(r.embedding)) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(limit * 4, 20))

  const K = 60
  const scores = new Map()
  ftsList.forEach((r, i) => scores.set(r.rowid, (scores.get(r.rowid) ?? 0) + 1 / (K + i + 1)))
  vecList.forEach((r, i) => scores.set(r.rowid, (scores.get(r.rowid) ?? 0) + 1 / (K + i + 1)))

  const fetchChunk = memory.db.prepare(`
    SELECT path, language, heading, content, line_start, line_end FROM doc_chunks WHERE rowid = ?
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

/** Lazily backfill missing vectors for doc_chunks. Guarded against concurrent calls. */
let _docEmbedLock = null
export function ensureDocEmbeddings(memory) {
  if (_docEmbedLock) return _docEmbedLock
  _docEmbedLock = _runEnsureDocEmbeddings(memory).finally(() => { _docEmbedLock = null })
  return _docEmbedLock
}

async function _runEnsureDocEmbeddings(memory) {
  if (!memory.embedder) return
  const modelKey = memory.embedder.model
  const stored = memory.db.prepare(`SELECT value FROM meta WHERE key = 'doc_embedding_model'`).get()?.value
  if (stored !== modelKey) {
    memory.db.prepare(`UPDATE doc_chunks SET embedding = NULL`).run()
    memory.db.prepare(`INSERT INTO meta (key, value) VALUES ('doc_embedding_model', ?)
      ON CONFLICT (key) DO UPDATE SET value = excluded.value`).run(modelKey)
  }

  const pending = memory.db.prepare(`SELECT rowid, path, heading, content FROM doc_chunks WHERE embedding IS NULL LIMIT ${DOC_EMBED_BATCH}`).all()
  if (pending.length === 0) return

  const texts = pending.map((r) => `${r.heading || r.path}\n${r.content.slice(0, EMBED_TEXT_MAX_LEN)}`)
  const vecs = await embed(memory.embedder, texts)

  const update = memory.db.prepare(`UPDATE doc_chunks SET embedding = ? WHERE rowid = ?`)
  pending.forEach((r, i) => update.run(toBlob(vecs[i]), r.rowid))
}

/** Generate the doc_search tool (read-only). */
export function docSearchTool(memory) {
  return {
    name: "doc_search",
    description:
      "Search the project's documentation (README, design docs, guides, markdown files) for relevant information. Use this to find design decisions, coding conventions, architecture docs, or project rules. Prefer this over code_search when you need to understand the project's intended design rather than existing implementation.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Natural language search query" },
        limit: { type: "number", description: "Max results (default 5)" },
      },
      required: ["query"],
    },
    readonly: true,
    async execute(args) {
      const results = await docSearch(memory, args.query, { limit: args.limit ?? 5 })
      if (results.length === 0) return "(no matching documentation)"
      return results.map((r) =>
        `${r.path}${r.heading ? ` > ${r.heading}` : ""} (L${r.line_start}-L${r.line_end}, relevance ${r._score?.toFixed(2) ?? "?"}):\n${r.content.slice(0, 2000)}`
      ).join("\n\n---\n\n")
    },
  }
}

// ---------------------------------------------------------------- agent tools

/**
 * Generate the three memory-related agent tools (following the tools.mjs tool shape).
 * memory_put and memory_delete are side-effecting (need permission confirmation), memory_search is read-only.
 * opts: { cwd, projectDir, author, team: { dir, name } | null }
 */
export function memoryTools(memory, opts = {}) {
  const projectDir = opts.projectDir ? join(opts.cwd ?? process.cwd(), opts.projectDir) : null
  const dirs = { project: projectDir, team: opts.team?.dir ?? null }
  return [
    {
      name: "memory_put",
      description:
        "Save a piece of knowledge to long-term memory. Use when you learn something worth remembering across sessions: a project convention, a debugging insight, an architecture decision. Types: rule (coding standards), knowledge (project facts), decision (architecture decisions), pattern (debugging/workflow patterns). Scopes: personal (default, private to you), project (shared via this repo's .thincoder/memory/), team (org-wide team repo, if configured).",
      parameters: {
        type: "object",
        properties: {
          type: { type: "string", enum: ["rule", "knowledge", "decision", "pattern"] },
          title: { type: "string", description: "Short title" },
          content: { type: "string", description: "Full content to remember" },
          tags: { type: "string", description: "Space-separated tags" },
          scope: { type: "string", enum: ["personal", "project", "team"], description: "Where to save (default personal)" },
        },
        required: ["type", "title", "content"],
      },
      readonly: false,
      async execute(args) {
        const scope = args.scope ?? "personal"
        if (scope === "personal") {
          const id = await put(memory, args)
          return `Saved to personal memory (id=personal:${id}): [${args.type}] ${args.title}`
        }
        if (scope === "project") {
          if (!projectDir) throw new Error("project scope unavailable: no project directory configured")
          const filename = await putMarkdown(memory, {
            layer: "project",
            dir: projectDir,
            type: args.type,
            title: args.title,
            content: args.content,
            tags: (args.tags ?? "").split(/\s+/).filter(Boolean),
            author: opts.author ?? "unknown",
          })
          return `Saved to project memory (id=project:${projectDir}:${filename}): [${args.type}] ${args.title}`
        }
        if (!opts.team?.dir) {
          throw new Error("team scope not configured: set memory.team in ~/.thincoder/config.json")
        }
        const filename = await putMarkdown(memory, {
          layer: "team",
          dir: opts.team.dir,
          type: args.type,
          title: args.title,
          content: args.content,
          tags: (args.tags ?? "").split(/\s+/).filter(Boolean),
          author: opts.author ?? "unknown",
        })
        await commitAndPush(opts.team.dir, filename, `memory: [${args.type}] ${args.title}`)
        return `Saved to team memory and pushed (id=team:${opts.team.dir}:${filename}): [${args.type}] ${args.title}`
      },
    },
    {
      name: "memory_search",
      description:
        "Search long-term memory across all layers (personal/project/team) for relevant knowledge saved in previous sessions. Use the same language as the memories being searched.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Natural language search query" },
          limit: { type: "number", description: "Max results (default 5)" },
        },
        required: ["query"],
      },
      readonly: true,
      async execute(args) {
        const results = await search(memory, args.query, { limit: args.limit ?? 5 })
        if (results.length === 0) return "(no matching memories)"
        return results.map((r) => `[${r.layer}][${r.type}] ${r.title} (id=${r.id})\n${r.content}`).join("\n\n")
      },
    },
    {
      name: "memory_delete",
      description:
        "Delete a memory entry by its id (as returned by memory_put / memory_search) and scope. " +
        "Scope is required and must match the id prefix — this prevents accidental deletion in another scope. " +
        "Returns the deleted entry's title and content so the deletion is auditable and recoverable.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string", description: "Entry id: personal:<n> / project:<origin>:<path> / team:<origin>:<path>" },
          scope: { type: "string", enum: ["personal", "project", "team"], description: "Scope of the entry to delete (required)" },
        },
        required: ["id", "scope"],
      },
      readonly: false,
      async execute(args) {
        const uid = String(args.id)
        const prefix = uid.split(":")[0]
        const uidScope = prefix === "personal" || prefix === "project" || prefix === "team" ? prefix : /^\d+$/.test(prefix) ? "personal" : null
        if (!uidScope) throw new Error(`invalid memory id: ${uid}`)
        if (uidScope !== args.scope) throw new Error(`id prefix ${prefix}: 与 scope ${args.scope} 不匹配`)
        const entry = await deleteByUid(memory, uid, { dirs })
        return `Deleted ${entry.id}: ${entry.title}\n${(entry.content ?? "").slice(0, 500)}`
      },
    },
  ]
}
