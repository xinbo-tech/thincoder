/**
 * memory/docs.mjs — doc index sync, retrieval, agent tool generation
 */

import { readFile, stat } from "node:fs/promises"
import { isAbsolute, join } from "node:path"
import { embed, cosine, toBlob, fromBlob } from "../embedding.mjs"
import { scanVectors, createTopK, SCAN_YIELD_MS } from "./scan.mjs"
import { normalizeOrigin } from "./origin.mjs"
import { commitAndPush } from "../git/gitmem.mjs"
import { MAX_DOC_FILE_BYTES } from "./schema.mjs"
import { buildFtsQuery, put, search, putMarkdown, clearPersonal, invalidateStaleEmbeddings, EMBED_TEXT_MAX_LEN } from "./core.mjs"
import { deleteByUid, matchMemoryRows, deleteWhere } from "./delete.mjs"
import { _upsertDocFile, yieldTick } from "./code-index.mjs"
import { markIndexedCommit, listProjectFiles, indexExtensions } from "./code-sync.mjs"
import { createRowBudget, rowCountOfPath, sweepStaleRows } from "./sync-tail.mjs"
import { loadProjectDeclaration } from "../conventions.mjs" // 排除谓词本档不直调（经 `decl` 传 `sweepStaleRows`）
import { logEvent } from "../log.mjs"
import { safeSliceUTF16 } from "../text-budget.mjs"
import { DESC } from "../tools/shared.mjs" // #15 描述外置：文本单点 = tool-docs/*.md（DESC 单解析面，缺档抛错语义不变）

const DOC_EMBED_BATCH = 64

/**
 * Sync doc index: scan all .md/.mdc/.txt/.rst/.adoc under dir → chunk → upsert into doc_chunks.
 * Incremental by mtime. opts seam (§6.14 M3): `yieldFn` ∕ `nowFn` ∕ `yieldMs` — stale-loop yield
 * budget injectable for deterministic tests (same seam style as scan.mjs).
 */
export async function docSync(memory, dir, { onProgress, yieldFn = yieldTick, nowFn = Date.now, yieldMs = SCAN_YIELD_MS } = {}) {
  const origin = normalizeOrigin(dir) // §6.11 写缝归一（目录/git I/O 用原样 dir；库面 origin 一律归一值）
  const decl = loadProjectDeclaration(dir)
  const { entries, unlisted } = await listProjectFiles(dir, indexExtensions(dir).doc)
  const files = [] // { abs, rel, mtimeMs }
  let overSizeSkipped = 0
  for (const { abs, rel } of entries) {
    let st
    try { st = await stat(abs) } catch { continue }
    if (st.size > MAX_DOC_FILE_BYTES) { overSizeSkipped++; continue }
    files.push({ abs, rel, mtimeMs: Math.floor(st.mtimeMs) })
  }
  // §6.14 P2：处理序钉死 = `rel` 字典序（现 walk ∕ git 列序不确定；预算跳过 = 列序后缀）
  files.sort((a, b) => (a.rel < b.rel ? -1 : a.rel > b.rel ? 1 : 0))

  const indexed = new Map(
    memory.db.prepare(`SELECT path, mtime_ms FROM doc_chunks WHERE origin = ?`).all(origin).map((r) => [r.path, r.mtime_ms])
  )
  const seen = new Set()

  onProgress?.({ phase: "scan", total: files.length, overSizeSkipped })

  // §6.14 P2 行预算（单源 = createRowBudget：WARN 一行可见 ∕ CAP 跳过后列——只停新增，存量行不失效）
  const budget = createRowBudget(memory, origin, "doc", dir)
  const budgetSkipped = []

  let updated = 0, removed = 0, skipped = 0, failed = 0
  const errors = []
  for (let i = 0; i < files.length; i++) {
    const { abs, rel, mtimeMs } = files[i]
    seen.add(rel)

    if (indexed.get(rel) === mtimeMs) {
      skipped++
      continue
    }
    budget.note()
    if (budget.over()) { budgetSkipped.push(rel); continue }

    try {
      const before = rowCountOfPath(memory, "doc_chunks", origin, rel)
      const text = await readFile(abs, "utf8")
      const lines = text.split("\n")
      _upsertDocFile(memory, origin, rel, lines, mtimeMs)
      budget.add(rowCountOfPath(memory, "doc_chunks", origin, rel) - before) // 净增行数——与「库内行数」同刻度
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

  // §6.14 B6 ∕ M3：收尾 stale 循环（同款让出 + 面① 收尾保护位）——机制单源 = `sync-tail.mjs`
  removed = await sweepStaleRows(memory, { table: "doc_chunks", origin, indexed, seen, decl, yieldFn, nowFn, yieldMs })

  onProgress?.({ phase: "done", total: files.length, updated, removed, skipped, failed, overSizeSkipped, budgetSkipped: budgetSkipped.length })
  // §6.14 B7 维护口：模型键失配的失效**执行**（读面只判定降级——执行住同步尾）
  if (memory.embedder) { try { invalidateStaleEmbeddings(memory) } catch { /* 非阻塞 */ } }
  await markIndexedCommit(memory, dir) // 锚推进 = 同步完成条件（§6.14 M1——原 fire-and-forget 竞态）
  if (unlisted.count > 0) {
    logEvent("index:unlisted", { dir, kind: "doc", count: unlisted.count, exts: unlisted.exts.map((e) => e.ext) })
  }
  return { updated, removed, skipped, failed, errors, total: files.length, overSizeSkipped, budgetSkipped, unlistedExts: unlisted }
}

/**
 * Doc search: FTS5(BM25) + optional vector cosine, RRF merged.
 * Falls back to pure FTS when no embedder; falls back to pure vector when ftsQuery is empty and embedder is present.
 */
export async function docSearch(memory, query, { limit = 5 } = {}) {
  const ftsQuery = buildFtsQuery(query)
  if (!ftsQuery && !memory.embedder) return []

  // §6.11 读缝归一（单点取名——函数体内一律用归一值）
  const codeOrigin = normalizeOrigin(memory.codeOrigin)
  const ftsOriginFilter = codeOrigin ? `AND d.origin = ?` : ""
  const vecOriginFilter = codeOrigin ? `AND origin = ?` : ""
  const originParams = codeOrigin ? [codeOrigin] : []

  const ftsList = ftsQuery ? memory.db.prepare(`
    SELECT d.rowid, d.path, d.language, d.heading, d.content, d.line_start, d.line_end, bm25(doc_chunks_fts) AS rank
    FROM doc_chunks_fts JOIN doc_chunks d ON d.rowid = doc_chunks_fts.rowid
    WHERE doc_chunks_fts MATCH ? ${ftsOriginFilter}
    ORDER BY rank LIMIT ?
  `).all(ftsQuery, ...originParams, Math.max(limit * 4, 20)) : []

  if (!memory.embedder) return ftsList.slice(0, limit)

  let docEnsured
  try { docEnsured = await ensureDocEmbeddings(memory) } catch (e) {
    console.error(`[docs] embedding ensure failed, falling back to FTS-only: ${e.message}`)
    return ftsList.slice(0, limit)
  }
  if (docEnsured?.mismatch) { // §6.14 B7 读面零写：模型键失配 ⇒ 本面向量通道降级 FTS-only（一行可见；失效执行归维护口）
    console.warn("[docs] embedding model changed — vector channel degraded to FTS-only (rebuild runs at maintenance: sync tail / reindex)")
    return ftsList.slice(0, limit)
  }
  let qvec
  try { [qvec] = await embed(memory.embedder, [query]) } catch (e) {
    console.error(`[docs] query embedding failed, falling back to FTS-only: ${e.message}`)
    return ftsList.slice(0, limit)
  }
  // TUI-OOM-ROOTCAUSE（MEMORY.md §10.3）：分块扫描 + 有界 top-K（原全表 .all()——峰值 = 块 + K）
  // TUI 假死批（§6.10 修法 A1/A2）：游标 = PK 去等值过滤前缀列（有 origin 过滤 ⇒ 2 元组；
  // 无过滤 ⇒ 全 PK）；scanVectors = async（让出）。SELECT 须携键列（游标值源）。
  const cursorKey = codeOrigin ? ["path", "line_start"] : ["origin", "path", "line_start"]
  const keyCols = cursorKey.join(", ")
  const top = createTopK(Math.max(limit * 4, 20))
  await scanVectors(memory.db, `SELECT rowid, ${keyCols}, embedding FROM doc_chunks WHERE embedding IS NOT NULL ${vecOriginFilter}`, originParams, {
    cursorKey,
    onRow: (r) => top.push({ id: r.rowid, rowid: r.rowid, score: cosine(qvec, fromBlob(r.embedding)) }),
  })
  const vecList = top.list().map((c) => ({ rowid: c.id, score: c.score }))

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
    // §6.14 B7 读面零写：只判定（返回降级信号）；失效**执行**（清向量 + 落键）归维护口
    // `invalidateStaleEmbeddings`（同步尾 ∕ /reindex ∕ 桌面 ∕ VSC）。
    return { mismatch: true }
  }

  const pending = memory.db.prepare(`SELECT rowid, path, heading, content FROM doc_chunks WHERE embedding IS NULL LIMIT ${DOC_EMBED_BATCH}`).all()
  if (pending.length === 0) return

  const texts = pending.map((r) => `${r.heading || r.path}\n${safeSliceUTF16(r.content, EMBED_TEXT_MAX_LEN)}`)
  const vecs = await embed(memory.embedder, texts)

  const update = memory.db.prepare(`UPDATE doc_chunks SET embedding = ? WHERE rowid = ?`)
  pending.forEach((r, i) => update.run(toBlob(vecs[i]), r.rowid))
}

/** Generate the doc_search tool (read-only). */
export function docSearchTool(memory) {
  return {
    name: "doc_search",
    description: DESC("doc_search"), // #15 外置：文本单点 = tool-docs/doc_search.md
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

/** §6 shared tool surface — action enum / parameter shapes / output contract shared with the
 *  VS Code face (`thincoder-vscode/src/memory-tool.mjs`); the description is a per-end form —
 *  core text lives in `tool-docs/memory.md` (DESC() load; #15 外置). Layer VALUES per end
 *  (VS Code has no team layer and rejects it with CLI guidance). */
const MEMORY_ACTIONS = ["search", "put", "list", "delete", "clear"]
const MEMORY_LAYERS = ["personal", "project", "team"]

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

const listRowLine = (r) => `[${r.layer}] ${r.id} [${r.type}] ${r.title}（${fmtDate(r.ts)}）`

/**
 * Generate the memory agent tool — ONE `memory` tool with five actions (MEMORY.md §6 D-M1).
 * search/list are read-only actions (planMode pass / no permission ask — dispatch classifies
 * them action-level, same as subagent check/status); put keeps its side-effect permission
 * gate; batch delete/clear gate on confirm:true + layer inside the tool (direct-delete
 * ruling — the confirm parameter IS the gate) and stay non-readonly like the retired tools.
 * opts: { cwd, projectDir, author, team: { dir, name } | null }
 */
export function memoryTools(memory, opts = {}) {
  const projectDir = opts.projectDir ? (isAbsolute(opts.projectDir) ? opts.projectDir : join(opts.cwd ?? process.cwd(), opts.projectDir)) : null
  // §6.11：dirs 保持原样（目录 I/O 基准）——归一落在各公共入口内（写缝 syncDir / indexMarkdownFile、
  // 删缝 deleteByUid / matchMemoryRows、读缝 search / fetchEntry）⇒ 逐入口一行，非工具层预归一。
  const dirs = { project: projectDir, team: opts.team?.dir ?? null }
  return [
    {
      name: "memory",
      description: DESC("memory"), // #15 外置：文本单点 = tool-docs/memory.md
      parameters: {
        type: "object",
        properties: {
          action: { type: "string", enum: MEMORY_ACTIONS, description: "Operation to run (required)" },
          layer: { type: "string", enum: MEMORY_LAYERS, description: "The memory layer: personal (private), project (shared via this repo's .thincoder/memory/), team (CLI only). Same concept as the [layer] tag and the id prefix on search/list result rows. put/search/list: optional (put defaults to personal; search/list omit = all layers). single delete: optional (omit = route by id prefix). batch delete/clear: required" },
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
  const layer = args.layer
  if (layer !== undefined && layer !== null && !MEMORY_LAYERS.includes(String(layer))) {
    throw new Error(`memory search: invalid layer "${layer}"`)
  }
  const query = String(args.query ?? "").trim()
  if (!query) return "(no matching memories)" // 空 query 短路——两端同语义（评审 code review #4）
  const limit = normalizeLimit(args.limit, 5)
  let results
  if (!layer) {
    results = await search(memory, query, { limit })
  } else {
    // layer filter: oversample then slice the requested layer (results keep global rank order).
    // 窗口 = max(limit*4, 20) 是召回上限——大库 + 高 limit 时该层结果可能不足 limit（接受的取舍——评审 code review #3）
    const wide = await search(memory, query, { limit: Math.max(limit * 4, 20) })
    results = wide.filter((r) => r.layer === String(layer)).slice(0, limit)
  }
  if (results.length === 0) return "(no matching memories)"
  return results.map((r) => `[${r.layer}][${r.type}] ${r.title} (id=${r.id})\n${r.content}`).join("\n\n")
}

/** action put — the retired put tool surface (side-effect gate, unchanged semantics). */
async function execPut(memory, args, opts, dirs) {
  const layer = String(args.layer ?? "personal")
  if (!MEMORY_LAYERS.includes(layer)) throw new Error(`memory put: invalid layer "${layer}"`)
  if (layer === "personal") {
    const id = await put(memory, { type: args.type, title: args.title, content: args.content, tags: args.tags ?? "" })
    return `Saved to personal memory (id=personal:${id}): [${args.type}] ${args.title}`
  }
  if (layer === "project") {
    if (!dirs.project) throw new Error("project layer unavailable: no project directory configured")
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
    throw new Error("team layer not configured: set memory.team in ~/.thincoder/config.json")
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

/** action list — new inventory action (read-only): layer/type/keyword filters + limit truncation note. */
async function execList(memory, args, dirs) {
  const layer = args.layer ?? null
  if (layer && !MEMORY_LAYERS.includes(String(layer))) throw new Error(`memory list: invalid layer "${layer}"`)
  const rows = await matchMemoryRows(memory, {
    layer: layer ? String(layer) : null,
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

/** action delete — single ({ id, layer? } — MEMORY.md §6.2: layer OPTIONAL, validated when
 *  passed, else the id prefix routes the delete) + batch (layer + type/keyword + confirm). */
async function execDelete(memory, args, dirs) {
  const hasId = args.id !== undefined && args.id !== null && String(args.id) !== ""
  if (hasId) return execDeleteSingle(memory, args, dirs)
  // batch form
  const layer = args.layer
  if (!layer) throw new Error("batch delete requires layer plus type and/or keyword filter")
  if (!MEMORY_LAYERS.includes(String(layer))) throw new Error(`memory delete: invalid layer "${layer}"`)
  const type = validateTypeFilter(args.type)
  const keyword = args.keyword ? String(args.keyword).trim() : null
  if (!type && !keyword) {
    throw new Error("batch delete requires type and/or keyword filter — a layer-wide wipe without filters is refused (personal full wipe is the clear action)")
  }
  if (layer === "project" && !dirs.project) throw new Error("project layer unavailable: no project directory configured")
  if (layer === "team" && !dirs.team) throw new Error("team layer not configured: set memory.team in ~/.thincoder/config.json")
  const filters = { layer: String(layer), type, keyword }
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
  return `Deleted ${n} entries in layer ${layer}`
}

/** Single-entry delete — MEMORY.md §6.2: layer is OPTIONAL. When passed it is validated
 *  against the id prefix (mismatch refused — guards against deleting the wrong entry); when
 *  omitted the delete routes by the id prefix alone, so any id search/list returned is
 *  directly deletable (deleteByUid already resolves the layer from the uid prefix). */
async function execDeleteSingle(memory, args, dirs) {
  const uid = String(args.id)
  const prefix = uid.split(":")[0]
  const uidLayer = prefix === "personal" || prefix === "project" || prefix === "team" ? prefix : /^\d+$/.test(prefix) ? "personal" : null
  if (!uidLayer) throw new Error(`invalid memory id: ${uid}`)
  const layer = args.layer
  if (layer !== undefined && layer !== null && String(layer) !== uidLayer) {
    throw new Error(`id prefix ${prefix}: 与 layer ${layer} 不匹配`)
  }
  const entry = await deleteByUid(memory, uid, { dirs })
  return `Deleted ${entry.id}: ${entry.title}\n${(entry.content ?? "").slice(0, 500)}`
}

/** action clear — personal-only full wipe (layer + confirm:true gates; project/team refused). */
function execClear(memory, args) {
  const layer = args.layer
  if (!layer) throw new Error('clear requires layer "personal" — pass layer: "personal" plus confirm: true')
  if (String(layer) !== "personal") {
    if (!MEMORY_LAYERS.includes(String(layer))) throw new Error(`memory clear: invalid layer "${layer}"`)
    throw new Error("shared layers don't support clear — use delete with type/keyword batch filters instead")
  }
  if (args.confirm !== true) throw new Error("clear requires confirm:true — this wipes ALL personal memory")
  const n = clearPersonal(memory)
  return `Cleared personal memory (${n} entries deleted)`
}
