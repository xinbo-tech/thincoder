/**
 * memory/code-sync.mjs — code index sync, retrieval, incremental update
 */
import { readFile, stat } from "node:fs/promises"
import { join, relative } from "node:path"
import { embed, cosine, toBlob, fromBlob } from "../embedding.mjs"
import { scanVectors, createTopK, SCAN_YIELD_MS } from "./scan.mjs"
import { normalizeOrigin } from "./origin.mjs"
import { CODE_EXTS, DOC_EXTS, MAX_CODE_FILE_BYTES, MAX_DOC_FILE_BYTES } from "./schema.mjs"
import { buildFtsQuery, ensureEmbeddings, invalidateStaleEmbeddings, EMBED_TEXT_MAX_LEN } from "./core.mjs"
import { detectLanguage, _upsertCodeFile, _upsertDocFile, yieldTick } from "./code-index.mjs"
import { walkProjectFiles, isSkippedRelPath, extensionOf, createUnlistedTally, MAX_WALK_FILES } from "./file-walk.mjs"
import { createRowBudget, rowCountOfPath, sweepStaleRows } from "./sync-tail.mjs"
import { loadProjectDeclaration, isExcludedRelPath } from "../conventions.mjs"
import { logEvent } from "../log.mjs"
import { safeSliceUTF16 } from "../text-budget.mjs"
import { DESC } from "../tools/shared.mjs" // #15 描述外置：文本单点 = tool-docs/code_search.md

const DIFF_FULL_SYNC_THRESHOLD = 200
const CODE_EMBED_BATCH = 64

/** per-origin 锚键（§6.14 M1）：`last_indexed_commit:<归一键>`——多 origin 互不覆盖；
 *  旧单键在而本键缺 ⇒ 视为无锚（该 origin 全扫一次）；旧键清退 = 全部 origin 落锚后（ops）。 */
const anchorKey = (origin) => `last_indexed_commit:${origin}`

/**
 * Index extension sets = built-in tables ∪ project declaration
 * (`PROJECT-MANIFEST.json` → index.codeExtensions / index.docExtensions;
 * PORTABILITY PO-9/§3.7 — a project may declare extensions this product does not
 * ship a default for). Declaration only ADDS (union), never removes.
 */
export function indexExtensions(dir) {
  const conv = loadProjectDeclaration(dir)
  return {
    code: new Set([...CODE_EXTS, ...conv.index.codeExtensions]),
    doc: new Set([...DOC_EXTS, ...conv.index.docExtensions]),
  }
}

/**
 * git-driven incremental indexing: use git diff to find files changed since
 * the last index, and only rebuild FTS5 chunks for those files (vectors are untouched).
 * An order of magnitude faster than full mtime scanning.
 * Returns { updated, removed, skipped } or null (git unavailable).
 */
export async function gitSync(memory, dir, { onProgress } = {}) {
  const origin = normalizeOrigin(dir) // §6.11 写缝归一（git / 文件 I/O 用原样 dir；库面 origin 一律归一值）
  const decl = loadProjectDeclaration(dir)
  const { execFile: _execFile } = await import("node:child_process")
  const { code: codeExts, doc: docExts } = indexExtensions(dir)
  const gitRun = (args) => new Promise((resolve, reject) => {
    _execFile("git", args, { cwd: dir, encoding: "utf8", timeout: 10000, windowsHide: true }, (err, stdout) => {
      if (err) reject(err); else resolve(stdout)
    })
  })
  const mergeDiff = (text) => text.trim().split("\n").filter(Boolean)

  let head
  try { head = (await gitRun(["rev-parse", "HEAD"])).trim() } catch { return null }

  const stored = memory.db.prepare(`SELECT value FROM meta WHERE key = ?`).get(anchorKey(origin))?.value
  if (!stored) return null

  let diffOut
  try {
    // §6.14 M2：`--relative`——diff 表收在 cwd 子树内且路径为 cwd 相对（与索引 path ∕ `codeSync` 同形；
    // 无它则子目录 origin 下 `join(dir, rel)` 错位：真改动入删除支 ∕ 错内容入库 = 静默陈旧）。
    const committed = mergeDiff(await gitRun(["diff", "--name-only", "--relative", "--diff-filter=ACMRTD", stored, "HEAD"]))
    const dirty = mergeDiff(await gitRun(["diff", "--name-only", "--relative", "--diff-filter=ACMRTD"]))
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
    const ext = extensionOf(rel)

    if (isSkippedRelPath(rel) || isExcludedRelPath(rel, decl)) continue

    if (!codeExts.has(ext) && !docExts.has(ext)) { skipped++; continue }

    try {
      const text = await readFile(abs, "utf8")
      const lines = text.split("\n")
      if (codeExts.has(ext)) {
        const lang = detectLanguage(abs)
        let mtimeMs = 0
        try { mtimeMs = Math.floor((await stat(abs)).mtimeMs) } catch { /* new file */ }
        _upsertCodeFile(memory, origin, rel, lines, lang, mtimeMs)
      } else {
        let mtimeMs = 0
        try { mtimeMs = Math.floor((await stat(abs)).mtimeMs) } catch { /* new file */ }
        _upsertDocFile(memory, origin, rel, lines, mtimeMs)
      }
      updated++
    } catch (e) {
      const isDeleted = e.code === "ENOENT"
      if (isDeleted) {
        if (codeExts.has(ext)) memory.db.prepare(`DELETE FROM code_chunks WHERE origin = ? AND path = ?`).run(origin, rel)
        else memory.db.prepare(`DELETE FROM doc_chunks WHERE origin = ? AND path = ?`).run(origin, rel)
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
    memory.db.prepare(`INSERT INTO meta (key, value) VALUES (?, ?)
      ON CONFLICT (key) DO UPDATE SET value = excluded.value`).run(anchorKey(origin), head)
  }

  onProgress?.({ phase: "done", total: diffOut.length, updated, removed, skipped, failed })
  return { updated, removed, skipped, failed, errors }
}

/**
 * List project files matching the given extensions.
 * Preferred source = git (`git ls-files --cached --others --exclude-standard`:
 * tracked + untracked-not-ignored, .gitignore respected). Projects WITHOUT git
 * fall back to a filesystem walk (PORTABILITY FR15/P8) — before, the index was
 * silently empty there. The walk cannot honour .gitignore (no git → no such
 * concept) and skips the shared SKIP_DIRS/dot-directory set instead.
 * Returns { entries, unlisted }: `entries` = { abs, rel } pairs (rel relative to
 * dir); `unlisted` = files whose extension is in NO index list (count + sample),
 * the visible signal behind "my .xyz files are not searchable" (PORTABILITY PO-9).
 * Declared `index.excludePaths` (§6.14 面①) filters BOTH paths — git listing filters the
 * line set; the walk prunes excluded subtrees during traversal (no expansion, no budget).
 * `truncated` = the non-git walk hit its file cap (capped trees are logged, never
 * silently indexed-partial). opts.maxFiles = the walk cap (test seam).
 */
export async function listProjectFiles(dir, exts, { maxFiles } = {}) {
  const { execFile: _execFile } = await import("node:child_process")
  const { join: joinPath } = await import("node:path")
  const { code, doc } = indexExtensions(dir)
  const decl = loadProjectDeclaration(dir)
  const excluded = (rel) => isExcludedRelPath(rel, decl)
  const tally = createUnlistedTally(new Set([...code, ...doc]))

  const files = []
  const finish = (truncated = false) => ({ entries: files, unlisted: tally.result(), truncated })

  // Git listing when available; a non-git project falls through to the walk.
  let gitTop
  try {
    gitTop = (await new Promise((resolve, reject) => {
      _execFile("git", ["rev-parse", "--show-toplevel"], { cwd: dir, encoding: "utf8", timeout: 5000, windowsHide: true },
        (err, stdout) => { if (err) reject(err); else resolve(stdout.trim()) })
    })).replace(/\\/g, "/")
  } catch {
    // Not a git repo → filesystem walk (FR15: the index must still be usable).
    const walked = await walkProjectFiles(dir, exts, { knownExts: new Set([...code, ...doc]), isExcluded: excluded, ...(maxFiles !== undefined ? { maxFiles } : {}) })
    files.push(...walked.files)
    // The walk's cap must stay visible end-to-end (file-walk.mjs: "never silently
    // dropped") — a capped listing says so in the log, not only in a discarded flag.
    if (walked.truncated) {
      logEvent("index:truncated", { dir, files: walked.files.length, maxFiles: maxFiles ?? MAX_WALK_FILES })
    }
    return { entries: files, unlisted: walked.unlisted, truncated: walked.truncated }
  }

  try {
    const raw = await new Promise((resolve, reject) => {
      _execFile("git", ["ls-files", "--cached", "--others", "--exclude-standard"],
        { cwd: dir, encoding: "utf8", timeout: 15000, windowsHide: true, maxBuffer: 10 * 1024 * 1024 },
        (err, stdout) => { if (err) reject(err); else resolve(stdout) })
    })
    for (const line of raw.trim().split("\n")) {
      const p = line.trim()
      if (!p) continue
      const rel = p.replace(/\\/g, "/")
      if (isSkippedRelPath(rel) || excluded(rel)) continue
      const ext = extensionOf(rel)
      if (!ext || !exts.has(ext)) { tally.note(rel); continue }
      files.push({ abs: joinPath(dir, rel), rel })
    }
  } catch { /* ls-files failed */ }

  return finish()
}


/**
 * Sync code index: scan all source files under dir → chunk → upsert into code_chunks.
 * Incremental by mtime — only rebuilds chunks for files that have changed.
 * opts seam (§6.14 M3): `yieldFn` ∕ `nowFn` ∕ `yieldMs` — the stale-loop yield budget is
 * injectable so the yield behaviour is deterministic in tests (same seam style as scan.mjs).
 */
export async function codeSync(memory, dir, { onProgress, yieldFn = yieldTick, nowFn = Date.now, yieldMs = SCAN_YIELD_MS } = {}) {
  const origin = normalizeOrigin(dir) // §6.11 写缝归一（遍历/git I/O 用原样 dir；库面 origin 一律归一值）
  const decl = loadProjectDeclaration(dir)
  const { code: exts } = indexExtensions(dir)
  const { entries, unlisted } = await listProjectFiles(dir, exts)
  const files = [] // { abs, rel, mtimeMs }
  let overSizeSkipped = 0
  for (const { abs, rel } of entries) {
    let st
    try { st = await stat(abs) } catch { continue }
    if (st.size > MAX_CODE_FILE_BYTES) { overSizeSkipped++; continue }
    files.push({ abs, rel, mtimeMs: Math.floor(st.mtimeMs) })
  }
  // §6.14 P2：处理序钉死 = `rel` 字典序（现 walk ∕ git 列序不确定；预算跳过 = 列序后缀）
  files.sort((a, b) => (a.rel < b.rel ? -1 : a.rel > b.rel ? 1 : 0))

  const indexed = new Map(
    memory.db.prepare(`SELECT path, mtime_ms FROM code_chunks WHERE origin = ?`).all(origin).map((r) => [r.path, r.mtime_ms])
  )
  const seen = new Set()

  onProgress?.({ phase: "scan", total: files.length, overSizeSkipped })

  // §6.14 P2 行预算（基准 = 本 origin 库内行数 code+doc，开趟读一次；只停新增——存量行不失效；
  // 跳过 = 不落行 ∕ 不记 mtime ⇒ 下趟重试）。WARN 一行可见（每趟至多一行）+ CAP 起跳过后列文件。
  const budget = createRowBudget(memory, origin, "code", dir)
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
      const before = rowCountOfPath(memory, "code_chunks", origin, rel)
      const text = await readFile(abs, "utf8")
      const lines = text.split("\n")
      const lang = detectLanguage(abs)
      _upsertCodeFile(memory, origin, rel, lines, lang, mtimeMs)
      budget.add(rowCountOfPath(memory, "code_chunks", origin, rel) - before) // 净增行数——预算与「库内行数」同刻度
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
  removed = await sweepStaleRows(memory, { table: "code_chunks", origin, indexed, seen, decl, yieldFn, nowFn, yieldMs })

  onProgress?.({ phase: "done", total: files.length, updated, removed, skipped, failed, overSizeSkipped, budgetSkipped: budgetSkipped.length })
  // §6.14 B7 维护口：模型键失配的失效**执行**（读面只判定降级——执行住同步尾；覆盖 /reindex ∕ 桌面 ∕ VSC 构建）
  if (memory.embedder) { try { invalidateStaleEmbeddings(memory) } catch { /* 非阻塞 */ } }
  await markIndexedCommit(memory, dir) // 锚推进 = 同步完成条件（§6.14 M1——原 fire-and-forget 竞态，T12 ∕ T14 判别面需确定性）
  if (unlisted.count > 0) {
    logEvent("index:unlisted", { dir, kind: "code", count: unlisted.count, exts: unlisted.exts.map((e) => e.ext) })
  }
  return { updated, removed, skipped, failed, errors, total: files.length, overSizeSkipped, budgetSkipped, unlistedExts: unlisted }
}

/** Record current HEAD as the index anchor (§6.14 M1: per-origin key `last_indexed_commit:<归一键>`); silently skip non-git repos */
export async function markIndexedCommit(memory, dir) {
  try {
    const { execFile } = await import("node:child_process")
    const origin = normalizeOrigin(dir)
    const head = await new Promise((resolve, reject) => {
      execFile("git", ["rev-parse", "HEAD"], { cwd: dir, encoding: "utf8", timeout: 5000, windowsHide: true }, (err, stdout) => {
        if (err) reject(err); else resolve(stdout)
      })
    })
    memory.db.prepare(`INSERT INTO meta (key, value) VALUES (?, ?)
      ON CONFLICT (key) DO UPDATE SET value = excluded.value`).run(anchorKey(origin), head.trim())
  } catch { /* not a git repo or git unavailable, skip */ }
}

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

/**
 * Single-file incremental reindex: called after write/edit/delete, only rebuilds this one path.
 */
export async function reindexFile(memory, cwd, absPath) {
  const origin = normalizeOrigin(cwd) // §6.11 写缝归一（文件 I/O 用原样 cwd；库面 origin 一律归一值）
  const ext = extensionOf(absPath)
  const rel = relative(cwd, absPath).replaceAll("\\", "/")
  if (rel === ".." || rel.startsWith("../")) return
  if (isSkippedRelPath(rel)) return
  if (isExcludedRelPath(rel, loadProjectDeclaration(cwd))) return // §6.14 面① 第三起效点（单文件缝零写）
  // Declared extensions count for the single-file path too (union with built-ins).
  const { code: codeExts, doc: docExts } = indexExtensions(cwd)

  // skip oversized files (minified bundles, test fixtures, generated code)
  const maxBytes = codeExts.has(ext) ? MAX_CODE_FILE_BYTES : docExts.has(ext) ? MAX_DOC_FILE_BYTES : 0
  if (maxBytes > 0) {
    try { const st = await stat(absPath); if (st.size > maxBytes) return } catch { /* can't stat, proceed */ }
  }

  let text
  try { text = await readFile(absPath, "utf8") } catch {
    if (codeExts.has(ext)) memory.db.prepare(`DELETE FROM code_chunks WHERE origin = ? AND path = ?`).run(origin, rel)
    else if (docExts.has(ext)) memory.db.prepare(`DELETE FROM doc_chunks WHERE origin = ? AND path = ?`).run(origin, rel)
    return
  }
  const lines = text.split("\n")

  if (codeExts.has(ext)) {
    const lang = detectLanguage(absPath)
    let mtimeMs = 0
    try { mtimeMs = Math.floor((await stat(absPath)).mtimeMs) } catch { /* new file */ }
    _upsertCodeFile(memory, origin, rel, lines, lang, mtimeMs)
  } else if (docExts.has(ext)) {
    let mtimeMs = 0
    try { mtimeMs = Math.floor((await stat(absPath)).mtimeMs) } catch { /* new file */ }
    _upsertDocFile(memory, origin, rel, lines, mtimeMs)
  }
  if (memory.embedder) {
    try { await ensureEmbeddings(memory) } catch { /* embedding failure is non-blocking */ }
  }
}
