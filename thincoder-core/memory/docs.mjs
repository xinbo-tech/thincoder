/**
 * memory/docs.mjs — doc index sync (retrieval / tool generation → memory-tool.mjs; 2026-10-01 split)
 */

import { readFile, stat } from "node:fs/promises"
import { embed, embedTolerant, cosine, toBlob, fromBlob } from "../embedding.mjs"
import { scanVectors, createTopK, SCAN_YIELD_MS } from "./scan.mjs"
import { normalizeOrigin } from "./origin.mjs"
import { MAX_DOC_FILE_BYTES } from "./schema.mjs"
import { buildFtsQuery, invalidateStaleEmbeddings, EMBED_TEXT_MAX_LEN } from "./core.mjs"
import { _upsertDocFile, yieldTick } from "./code-index.mjs"
import { markIndexedCommit, listProjectFiles, indexExtensions, declaredRootEntries } from "./code-sync.mjs"
import { searchOrigins } from "./code-search.mjs"
import { createRowBudget, rowCountOfPath, sweepStaleRows } from "./sync-tail.mjs"
import { loadProjectDeclaration } from "../conventions.mjs" // 排除谓词本档不直调（经 `decl` 传 `sweepStaleRows`）
import { logEvent } from "../log.mjs"
import { safeSliceUTF16 } from "../text-budget.mjs"
import { DESC } from "../tools/shared.mjs" // #15 描述外置：文本单点 = tool-docs/*.md（DESC 单解析面，缺档抛错语义不变）

const DOC_EMBED_BATCH = 64

/**
 * §6.15 同步展开（写侧入口）：入口 dir + 声明公共仓逐根（一层不递归）；回执 = 入口根（契约零改）。
 * 单根内胆 = `syncDocRoot`：.md/.mdc/.txt/.rst/.adoc → chunk → doc_chunks（mtime 增量；opts seam =
 * `yieldFn` ∕ `nowFn` ∕ `yieldMs`——stale-loop 让出可确定性断言，同 scan.mjs）。
 */
export async function docSync(memory, dir, opts = {}) {
  const res = await syncDocRoot(memory, dir, opts)
  for (const root of declaredRootEntries(dir)) await syncDocRoot(memory, root, opts)
  return res
}

/** 单根内胆（doc 全扫径）：原 `docSync` 体——零语义改动；导出供 `gitSync` 两条回退支跨档调用（不展开声明根）。 */
export async function syncDocRoot(memory, dir, { onProgress, yieldFn = yieldTick, nowFn = Date.now, yieldMs = SCAN_YIELD_MS } = {}) {
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
  removed = await sweepStaleRows(memory, { table: "doc_chunks", origin, indexed, seen, decl, base: dir, yieldFn, nowFn, yieldMs })

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
 * `origins`（可选覆盖参 · 2026-10-10 #1100）：缺省 `null` ⇒ 现行为（本函数自取 `searchOrigins`）**逐字**；
 * 给定 ⇒ 以其为 origin 集（复用既有单/多 origin SQL 形）；空数组 ⇒ 现「不过滤」语义（本设计调用方不产此形）。
 * 消费方 = `thincoder-core/agent/setup.mjs` 注入块两腿分取（配额策略 = `docs/core/design/AGENT-LOOP.md` §6.3）。
 */
export async function docSearch(memory, query, { limit = 5, origins: originsOverride = null } = {}) {
  const ftsQuery = buildFtsQuery(query)
  if (!ftsQuery && !memory.embedder) return []

  // §6.15 读面 origin 集（项目 ∪ 声明公共仓；单 origin ⇒ 逐字零行为——快径 SQL 形零改）
  // #1100：`origins` 覆盖参在位时以其为集（缺省 `null` ⇒ 原式逐字）
  const origins = originsOverride ?? searchOrigins(memory)
  const ftsOriginFilter = origins.length === 1 ? `AND d.origin = ?` : origins.length > 1 ? `AND d.origin IN (${origins.map(() => "?").join(", ")})` : ""
  const originParams = origins

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
  const cursorKey = origins.length > 0 ? ["path", "line_start"] : ["origin", "path", "line_start"]
  const keyCols = cursorKey.join(", ")
  const top = createTopK(Math.max(limit * 4, 20))
  // §6.15 多 origin ⇒ 逐 origin 分趟（每趟单 origin 等值 + 游标键去等值前缀列——与单 origin 快径同形）
  const vecSql = `SELECT rowid, ${keyCols}, embedding FROM doc_chunks WHERE embedding IS NOT NULL ${origins.length ? "AND origin = ?" : ""}`
  for (const origin of origins.length ? origins : [null]) {
    await scanVectors(memory.db, vecSql, origin ? [origin] : [], {
      cursorKey,
      onRow: (r) => top.push({ id: r.rowid, rowid: r.rowid, score: cosine(qvec, fromBlob(r.embedding)) }),
    })
  }
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
  // #859（MEMORY.md §6.3 ∥ D-MEM31）：400 类毒行逐条隔离——null 行跳过不写（backlog 不堵）+ 一行可见回执
  const { vectors: vecs, skipped } = await embedTolerant(memory.embedder, texts)
  if (skipped.length) console.warn(`[docs] embedding skipped ${skipped.length} row(s, first): ${skipped[0]}`)

  const update = memory.db.prepare(`UPDATE doc_chunks SET embedding = ? WHERE rowid = ?`)
  pending.forEach((r, i) => { if (vecs[i]) update.run(toBlob(vecs[i]), r.rowid) })
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

// ─── 迁出面（2026-10-01 拆分批 · #755 ∥ #786）：memory agent 工具面外提 `memory/memory-tool.mjs`——
// 经本档转口保名（消费链 = `memory.mjs → docs.mjs → memory-tool.mjs`；消费面零改）。──────────────
export { memoryTools } from "./memory-tool.mjs"

