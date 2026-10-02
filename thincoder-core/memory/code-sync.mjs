/**
 * memory/code-sync.mjs — code index sync, incremental update (retrieval / tool generation → code-search.mjs; 2026-10-01 split)
 */
import { readFile, stat } from "node:fs/promises"
import { join, relative } from "node:path"
import { SCAN_YIELD_MS } from "./scan.mjs"
import { normalizeOrigin } from "./origin.mjs"
import { MAX_CODE_FILE_BYTES, MAX_DOC_FILE_BYTES } from "./schema.mjs"
import { ensureEmbeddings, invalidateStaleEmbeddings } from "./core.mjs"
import { detectLanguage, _upsertCodeFile, _upsertDocFile, yieldTick } from "./code-index.mjs"
import { isSkippedRelPath, extensionOf } from "./file-walk.mjs"
import { createRowBudget, rowCountOfPath, sweepStaleRows } from "./sync-tail.mjs"
import { loadProjectDeclaration, isExcludedRelPath } from "../conventions.mjs"
import { logEvent } from "../log.mjs"
import { indexExtensions, listProjectFiles } from "./file-list.mjs"

const DIFF_FULL_SYNC_THRESHOLD = 200

/** per-origin 锚键（§6.14 M1）：`last_indexed_commit:<归一键>`——多 origin 互不覆盖；
 *  旧单键在而本键缺 ⇒ 视为无锚（该 origin 全扫一次）；旧键清退 = 全部 origin 落锚后（ops）。 */
const anchorKey = (origin) => `last_indexed_commit:${origin}`

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

    if (isSkippedRelPath(rel) || isExcludedRelPath(rel, decl, dir)) continue

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
  removed = await sweepStaleRows(memory, { table: "code_chunks", origin, indexed, seen, decl, base: dir, yieldFn, nowFn, yieldMs })

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
 * Single-file incremental reindex: called after write/edit/delete, only rebuilds this one path.
 */
export async function reindexFile(memory, cwd, absPath) {
  const origin = normalizeOrigin(cwd) // §6.11 写缝归一（文件 I/O 用原样 cwd；库面 origin 一律归一值）
  const ext = extensionOf(absPath)
  const rel = relative(cwd, absPath).replaceAll("\\", "/")
  if (rel === ".." || rel.startsWith("../")) return
  if (isSkippedRelPath(rel)) return
  if (isExcludedRelPath(rel, loadProjectDeclaration(cwd), cwd)) return // §6.14 面① 第三起效点（单文件缝零写）
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

// ─── 迁出面（2026-10-01 拆分批 · #755 ∥ #786）：检索面 → `memory/code-search.mjs`；清单面 →
// `memory/file-list.mjs`——经本档转口保名（消费面 / 批内件 import 面零改），四起效点调用形零改。──────
export { codeSearch, ensureCodeEmbeddings, codeSearchTool } from "./code-search.mjs"
export { listProjectFiles, indexExtensions } from "./file-list.mjs"
