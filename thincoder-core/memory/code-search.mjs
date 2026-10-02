/**
 * memory/code-search.mjs — 代码检索面（自 `memory/code-sync.mjs` 迁出 · 2026-10-01 core 拆分批 #755 ∥ #786）。
 * 内容 = `CODE_EMBED_BATCH` ∥ `codeSearch`（FTS5(BM25) + 向量余弦，RRF 合并；无 embedder ⇒ 纯 FTS，
 * ftsQuery 空且有 embedder ⇒ 纯向量）∥ `ensureCodeEmbeddings`（并发锁 + `_runEnsureCodeEmbeddings`）
 * ∥ `codeSearchTool`——迁出块逐字；原档 `memory/code-sync.mjs` 经 `export { … } from` 转口保名
 * （消费面 / 批内件 import 面零改）。
 */
import { embed, cosine, toBlob, fromBlob } from "../embedding.mjs"
import { scanVectors, createTopK } from "./scan.mjs"
import { normalizeOrigin } from "./origin.mjs"
import { buildFtsQuery, ensureEmbeddings, EMBED_TEXT_MAX_LEN } from "./core.mjs"
import { safeSliceUTF16 } from "../text-budget.mjs"
import { DESC } from "../tools/shared.mjs" // #15 描述外置：文本单点 = tool-docs/code_search.md

const CODE_EMBED_BATCH = 64

/**
 * Code search: FTS5(BM25) + optional vector cosine, RRF merged.
 * Falls back to pure FTS when no embedder; falls back to pure vector when ftsQuery is empty and embedder is present.
 */
export async function codeSearch(memory, query, { limit = 5 } = {}) {
  const ftsQuery = buildFtsQuery(query)
  if (!ftsQuery && !memory.embedder) return []

  // §6.11 读缝归一（单点取名——函数体内一律用归一值）
  const codeOrigin = normalizeOrigin(memory.codeOrigin)
  const ftsOriginFilter = codeOrigin ? `AND c.origin = ?` : ""
  const vecOriginFilter = codeOrigin ? `AND origin = ?` : ""
  const originParams = codeOrigin ? [codeOrigin] : []

  const ftsList = ftsQuery ? memory.db.prepare(`
    SELECT c.rowid, c.path, c.language, c.symbol_name, c.content, c.line_start, c.line_end, bm25(code_chunks_fts) AS rank
    FROM code_chunks_fts JOIN code_chunks c ON c.rowid = code_chunks_fts.rowid
    WHERE code_chunks_fts MATCH ? ${ftsOriginFilter}
    ORDER BY rank LIMIT ?
  `).all(ftsQuery, ...originParams, Math.max(limit * 4, 20)) : []

  if (!memory.embedder) return ftsList.slice(0, limit)

  let ensured
  try { ensured = await ensureEmbeddings(memory) } catch (e) {
    console.error(`[code] embedding ensure failed, falling back to FTS-only: ${e.message}`)
    return ftsList.slice(0, limit)
  }
  if (ensured?.code) { // §6.14 B7 读面零写：模型键失配 ⇒ 本面向量通道降级 FTS-only（一行可见；失效执行归维护口）
    console.warn("[code] embedding model changed — vector channel degraded to FTS-only (rebuild runs at maintenance: sync tail / reindex)")
    return ftsList.slice(0, limit)
  }
  let qvec
  try { [qvec] = await embed(memory.embedder, [query]) } catch (e) {
    console.error(`[code] query embedding failed, falling back to FTS-only: ${e.message}`)
    return ftsList.slice(0, limit)
  }
  // TUI-OOM-ROOTCAUSE（MEMORY.md §10.3）：分块扫描 + 有界 top-K（原全表 .all()——峰值 = 块 + K）
  // TUI 假死批（§6.10 修法 A1/A2）：游标 = PK 去等值过滤前缀列（有 origin 过滤 ⇒ 2 元组；
  // 无过滤 ⇒ 全 PK）；scanVectors = async（让出）。SELECT 须携键列（游标值源）。
  const cursorKey = codeOrigin ? ["path", "line_start"] : ["origin", "path", "line_start"]
  const keyCols = cursorKey.join(", ")
  const top = createTopK(Math.max(limit * 4, 20))
  await scanVectors(memory.db, `SELECT rowid, ${keyCols}, embedding FROM code_chunks WHERE embedding IS NOT NULL ${vecOriginFilter}`, originParams, {
    cursorKey,
    onRow: (r) => top.push({ id: r.rowid, rowid: r.rowid, score: cosine(qvec, fromBlob(r.embedding)) }),
  })
  const vecList = top.list().map((c) => ({ rowid: c.id, score: c.score }))

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
    // §6.14 B7 读面零写：只判定（返回降级信号——调用方 FTS-only + 一行可见）；失效**执行**
    // （清向量 + 落键）归维护口 `invalidateStaleEmbeddings`（同步尾 ∕ /reindex ∕ 桌面 ∕ VSC）。
    return { mismatch: true }
  }

  const pending = memory.db.prepare(`SELECT rowid, path, symbol_name, content FROM code_chunks WHERE embedding IS NULL LIMIT ${CODE_EMBED_BATCH}`).all()
  if (pending.length === 0) return

  const texts = pending.map((r) => `${r.path}${r.symbol_name ? " :: " + r.symbol_name : ""}\n${safeSliceUTF16(r.content, EMBED_TEXT_MAX_LEN)}`)
  const vecs = await embed(memory.embedder, texts)

  const update = memory.db.prepare(`UPDATE code_chunks SET embedding = ? WHERE rowid = ?`)
  pending.forEach((r, i) => update.run(toBlob(vecs[i]), r.rowid))
}

/** Generate the code_search tool (read-only). */
export function codeSearchTool(memory) {
  return {
    name: "code_search",
    description: DESC("code_search"), // #15 外置：文本单点 = tool-docs/code_search.md
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
