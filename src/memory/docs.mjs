/**
 * memory/docs.mjs — doc index sync, retrieval, agent tool generation
 */

import { readFile, stat } from "node:fs/promises"
import { join } from "node:path"
import { embed, cosine, toBlob, fromBlob } from "../embedding.mjs"
import { commitAndPush } from "../git/gitmem.mjs"
import { DOC_EXTS, SKIP_DIRS, MAX_DOC_FILE_BYTES } from "./schema.mjs"
import { buildFtsQuery, put, search, putMarkdown, deleteByUid, matchMemoryRows, deleteWhere, clearPersonal, EMBED_TEXT_MAX_LEN } from "./core.mjs"
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
      "Search the project's documentation (README, design docs, guides, markdown files) for relevant information. Use this to find design decisions, coding conventions, architecture docs, or project rules. Prefer this over code_search when you need to understand the project's intended design rather than existing implementation. " +
      "Returns matching doc chunks: path, heading, line range, relevance score, content excerpt.",
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

/** §6 shared tool surface — action enum / parameter shapes / descriptions byte-identical
 *  with thincoder-vscode/src/memory.mjs (MEMORY.md §6 D-M1/F-M6); scope VALUES per end
 *  (VS Code has no team layer and rejects it with CLI guidance). */
const MEMORY_ACTIONS = ["search", "put", "list", "delete", "clear"]
const MEMORY_SCOPES = ["personal", "project", "team"]
const MEMORY_TOOL_DESCRIPTION =
  "Manage long-term memory in ONE tool — the action parameter picks the operation:\n" +
  "- search — find knowledge saved in previous sessions (query, optional scope/limit); results include every entry's id\n" +
  "- put — save a piece of knowledge for future sessions (type: rule = coding standards, knowledge = project facts, decision = architecture decisions, pattern = debugging/workflow patterns; title/content/tags/scope)\n" +
  "- list — inventory what memory holds: optional scope/type/keyword filters, limit default 50; one row per entry: id [type] title (date); a truncated list notes the full count\n" +
  "- delete — SINGLE: {id, scope} deletes one entry by the id shown in put/search/list output. BATCH: {scope + type and/or keyword} deletes every matching entry in that scope — a call without confirm:true is refused and returns the count plus a preview (re-send with confirm:true to execute); scope-wide wipes without filters are refused on every layer\n" +
  "- clear — {scope: \"personal\", confirm: true} wipes ALL personal memory entries. clear is personal-only: a missing scope or a project/team scope is refused (use delete batch filters on shared layers)\n" +
  "Deleting project/team (CLI) entries removes the local markdown file and its index row — team deletion is local only and a later team sync may resurrect the file while the remote still has it.\n" +
  "Save bugs, conventions, and preferences here — they persist across sessions."

function validateTypeFilter(type) {
  if (type === undefined || type === null || type === "") return null
  const t = String(type)
  if (!["rule", "knowledge", "decision", "pattern"].includes(t)) throw new Error(`Invalid memory type "${t}"; expected one of: rule, knowledge, decision, pattern`)
  return t
}

function normalizeLimit(limit, dflt) {
  const n = Number(limit)
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : dflt
}

function fmtDate(ts) {
  return ts ? new Date(ts).toISOString().slice(0, 10) : "?"
}

const listRowLine = (r) => `${r.id} [${r.type}] ${r.title}（${fmtDate(r.ts)}）`

/**
 * Generate the memory agent tool — ONE `memory` tool with five actions (MEMORY.md §6 D-M1).
 * search/list are read-only actions (planMode pass / no permission ask — dispatch classifies
 * them action-level, same as subagent check/status); put keeps its side-effect permission
 * gate; batch delete/clear gate on confirm:true + scope inside the tool (direct-delete
 * ruling — the confirm parameter IS the gate) and stay non-readonly like the retired tools.
 * opts: { cwd, projectDir, author, team: { dir, name } | null }
 */
export function memoryTools(memory, opts = {}) {
  const projectDir = opts.projectDir ? join(opts.cwd ?? process.cwd(), opts.projectDir) : null
  const dirs = { project: projectDir, team: opts.team?.dir ?? null }
  return [
    {
      name: "memory",
      description: MEMORY_TOOL_DESCRIPTION,
      parameters: {
        type: "object",
        properties: {
          action: { type: "string", enum: MEMORY_ACTIONS, description: "Operation to run (required)" },
          scope: { type: "string", enum: MEMORY_SCOPES, description: "Where the memory lives: personal (private), project (shared via this repo's .thincoder/memory/), team (CLI only). put defaults to personal; search/list search every layer when omitted; delete/clear require it" },
          type: { type: "string", enum: ["rule", "knowledge", "decision", "pattern"], description: "Entry type: put = what to save; list/delete batch = filter by type" },
          title: { type: "string", description: "put: short title" },
          content: { type: "string", description: "put: full content to remember" },
          tags: { type: "string", description: "put: space-separated tags" },
          query: { type: "string", description: "search: natural-language query" },
          keyword: { type: "string", description: "list/delete batch: filter matching title/content" },
          id: { type: "string", description: "delete single: the entry id from put/search/list output" },
          limit: { type: "number", description: "Max rows: list 50 by default, search 5 by default" },
          confirm: { type: "boolean", description: "delete batch/clear: must be true — without it the tool refuses" },
        },
        required: ["action"],
      },
      readonly: false,
      async execute(args) {
        const action = String(args?.action ?? "")
        if (!MEMORY_ACTIONS.includes(action)) {
          throw new Error(`memory: unknown action "${action}" — expected one of: ${MEMORY_ACTIONS.join("/")}`)
        }
        switch (action) {
          case "search": return execSearch(memory, args)
          case "put": return execPut(memory, args, opts, dirs)
          case "list": return execList(memory, args, dirs)
          case "delete": return execDelete(memory, args, dirs)
          case "clear": return execClear(memory, args)
        }
      },
    },
  ]
}

/** action search — the retired search tool surface (read-only, same output contract). */
async function execSearch(memory, args) {
  const scope = args.scope
  if (scope !== undefined && scope !== null && !MEMORY_SCOPES.includes(String(scope))) {
    throw new Error(`memory search: invalid scope "${scope}"`)
  }
  const query = String(args.query ?? "").trim()
  if (!query) return "(no matching memories)" // 空 query 短路——两端同语义（评审 code review #4）
  const limit = normalizeLimit(args.limit, 5)
  let results
  if (!scope) {
    results = await search(memory, query, { limit })
  } else {
    // scope filter: oversample then slice the requested layer (results keep global rank order).
    // 窗口 = max(limit*4, 20) 是召回上限——大库 + 高 limit 时该层结果可能不足 limit（接受的取舍——评审 code review #3）
    const wide = await search(memory, query, { limit: Math.max(limit * 4, 20) })
    results = wide.filter((r) => r.layer === String(scope)).slice(0, limit)
  }
  if (results.length === 0) return "(no matching memories)"
  return results.map((r) => `[${r.layer}][${r.type}] ${r.title} (id=${r.id})\n${r.content}`).join("\n\n")
}

/** action put — the retired put tool surface (side-effect gate, unchanged semantics). */
async function execPut(memory, args, opts, dirs) {
  const scope = String(args.scope ?? "personal")
  if (!MEMORY_SCOPES.includes(scope)) throw new Error(`memory put: invalid scope "${scope}"`)
  if (scope === "personal") {
    const id = await put(memory, { type: args.type, title: args.title, content: args.content, tags: args.tags ?? "" })
    return `Saved to personal memory (id=personal:${id}): [${args.type}] ${args.title}`
  }
  if (scope === "project") {
    if (!dirs.project) throw new Error("project scope unavailable: no project directory configured")
    const filename = await putMarkdown(memory, {
      layer: "project",
      dir: dirs.project,
      type: args.type,
      title: args.title,
      content: args.content,
      tags: (args.tags ?? "").split(/\s+/).filter(Boolean),
      author: opts.author ?? "unknown",
    })
    return `Saved to project memory (id=project:${dirs.project}:${filename}): [${args.type}] ${args.title}`
  }
  if (!dirs.team) {
    throw new Error("team scope not configured: set memory.team in ~/.thincoder/config.json")
  }
  const filename = await putMarkdown(memory, {
    layer: "team",
    dir: dirs.team,
    type: args.type,
    title: args.title,
    content: args.content,
    tags: (args.tags ?? "").split(/\s+/).filter(Boolean),
    author: opts.author ?? "unknown",
  })
  await commitAndPush(dirs.team, filename, `memory: [${args.type}] ${args.title}`)
  return `Saved to team memory and pushed (id=team:${dirs.team}:${filename}): [${args.type}] ${args.title}`
}

/** action list — new inventory action (read-only): scope/type/keyword filters + limit truncation note. */
async function execList(memory, args, dirs) {
  const scope = args.scope ?? null
  if (scope && !MEMORY_SCOPES.includes(String(scope))) throw new Error(`memory list: invalid scope "${scope}"`)
  const rows = await matchMemoryRows(memory, {
    scope: scope ? String(scope) : null,
    type: validateTypeFilter(args.type),
    keyword: args.keyword ? String(args.keyword).trim() : null,
    projectDir: dirs.project,
    teamDir: dirs.team,
  })
  if (rows.length === 0) return "0 条匹配"
  const limit = normalizeLimit(args.limit, 50)
  const shown = rows.slice(0, limit)
  const lines = shown.map(listRowLine)
  if (rows.length > shown.length) lines.unshift(`${shown.length} 条——截断前 ${rows.length}`)
  return lines.join("\n")
}

/** action delete — single ({ id, scope } — §0.1-era single-delete semantics) + batch (scope + type/keyword + confirm). */
async function execDelete(memory, args, dirs) {
  const hasId = args.id !== undefined && args.id !== null && String(args.id) !== ""
  if (hasId) return execDeleteSingle(memory, args, dirs)
  // batch form
  const scope = args.scope
  if (!scope) throw new Error("batch delete requires scope plus type and/or keyword filter")
  if (!MEMORY_SCOPES.includes(String(scope))) throw new Error(`memory delete: invalid scope "${scope}"`)
  const type = validateTypeFilter(args.type)
  const keyword = args.keyword ? String(args.keyword).trim() : null
  if (!type && !keyword) {
    throw new Error("batch delete requires type and/or keyword filter — a scope-wide wipe without filters is refused (personal full wipe is the clear action)")
  }
  if (scope === "project" && !dirs.project) throw new Error("project scope unavailable: no project directory configured")
  if (scope === "team" && !dirs.team) throw new Error("team scope not configured: set memory.team in ~/.thincoder/config.json")
  const filters = { scope: String(scope), type, keyword }
  const rows = await matchMemoryRows(memory, { ...filters, projectDir: dirs.project, teamDir: dirs.team })
  if (rows.length === 0) return "0 条匹配"
  if (args.confirm !== true) {
    const lines = [rows.length > 5 ? `将删 ${rows.length} 条：前 5 条预览` : `将删 ${rows.length} 条`]
    lines.push(...rows.slice(0, 5).map(listRowLine))
    if (rows.length > 5) lines.push(`5 条——截断前 ${rows.length}`)
    lines.push("confirm:true required — re-send with it to execute the deletion")
    return lines.join("\n")
  }
  const n = await deleteWhere(memory, filters, { dirs })
  return `Deleted ${n} entries in scope ${scope}`
}

/** Single-entry delete — §0.1-era delete semantics (id + scope, NF2/NF3, direct-delete ruling). */
async function execDeleteSingle(memory, args, dirs) {
  if (!args.scope) throw new Error("delete requires id + scope")
  const uid = String(args.id)
  const prefix = uid.split(":")[0]
  const uidScope = prefix === "personal" || prefix === "project" || prefix === "team" ? prefix : /^\d+$/.test(prefix) ? "personal" : null
  if (!uidScope) throw new Error(`invalid memory id: ${uid}`)
  if (uidScope !== args.scope) throw new Error(`id prefix ${prefix}: 与 scope ${args.scope} 不匹配`)
  const entry = await deleteByUid(memory, uid, { dirs })
  return `Deleted ${entry.id}: ${entry.title}\n${(entry.content ?? "").slice(0, 500)}`
}

/** action clear — personal-only full wipe (scope + confirm:true gates; project/team refused). */
function execClear(memory, args) {
  const scope = args.scope
  if (!scope) throw new Error('clear requires scope "personal" — pass scope: "personal" plus confirm: true')
  if (String(scope) !== "personal") {
    if (!MEMORY_SCOPES.includes(String(scope))) throw new Error(`memory clear: invalid scope "${scope}"`)
    throw new Error("shared layers don't support clear — use delete with type/keyword batch filters instead")
  }
  if (args.confirm !== true) throw new Error("clear requires confirm:true — this wipes ALL personal memory")
  const n = clearPersonal(memory)
  return `Cleared personal memory (${n} entries deleted)`
}
