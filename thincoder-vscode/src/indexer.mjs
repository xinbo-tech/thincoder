/**
 * indexer.mjs — unified semantic index: code, docs, memory
 *
 * Index storage: .thincoder/index/
 *   manifest.json  — { version, vector_dim, embed_model, indexed_commit, files: { path: { mtime, kind, chunks: [{idx, startLine, endLine}] } } }
 *   vectors.bin    — [4B dim][4B count][count × 4B offsets][all raw Float32 vectors]
 *
 * Chunking:
 *   code   — split at function/class/export boundaries, ≤30 lines, 3-line overlap
 *   doc    — split at ## headers or blank lines, ≤20 lines
 *   memory — one chunk per file
 */

import { readFileSync, writeFileSync, statSync, mkdirSync, existsSync } from "node:fs"
import { join } from "node:path"
import { execSync, spawnSync } from "node:child_process"
import { embed, cosine } from "./embedding.mjs"
import { encodeVectors, decodeVectors } from "./index-bin.mjs"
import { discoverFiles, discoverFilesUnder, kindFor, shouldIndexFile, listMemoryFiles, SKIP_DIRS } from "./index-discover.mjs"
import { loadConventions } from "./conventions.mjs"
import { logEvent } from "@thincoder/core/log.mjs"

const INDEX_DIR = ".thincoder/index"
const CHUNK_LINES_CODE = 30
const CHUNK_LINES_DOC = 20
const CHUNK_OVERLAP = 3
const EMBED_BATCH = 64
const MAX_CHUNK_TEXT = 2000

// ─── Public API ───────────────────────────────────────────────

/**
 * Build or rebuild the full vector index.
 * @param {string} cwd - project root
 * @param {object} embedder - from createEmbedder()
 * @param {{ onProgress?: (p: {phase:string, done:number, total:number}) => void, signal?: AbortSignal }} opts
 */
export async function buildIndex(cwd, embedder, { onProgress, signal } = {}) {
  const indexDir = join(cwd, INDEX_DIR)
  mkdirSync(indexDir, { recursive: true })

  // 1) Discover files — unlisted extensions are TALLIED (VP-9): an extension in no
  //    list is silently skipped by the walk, so the panel would otherwise never learn
  //    that part of the project is not searchable.
  const conv = loadConventions(cwd)
  const { files, unlisted } = discoverFiles(cwd, signal, { collectUnlisted: true })
  onProgress?.({ phase: "scan", done: 0, total: files.length })

  // 2) Chunk them — skip empty-text chunks. Capture each file's mtime BEFORE reading so a
  //    change during the (slow) embed pass still registers as "needs rebuild", not stale.
  const allChunks = [] // [{ fileIdx, startLine, endLine, text }]
  const fileMtimes = new Array(files.length)
  for (let i = 0; i < files.length; i++) {
    signal?.throwIfAborted()
    try { fileMtimes[i] = statSync(join(cwd, files[i])).mtimeMs } catch { /* leave undefined */ }
    const chunks = chunkFile(cwd, files[i], conv)
    for (const c of chunks) {
      if (c.text && c.text.trim()) allChunks.push({ fileIdx: i, ...c })
    }
  }
  onProgress?.({ phase: "chunk", done: 0, total: allChunks.length })

  // 3) Embed in batches
  const texts = allChunks.map((c) => c.text.slice(0, MAX_CHUNK_TEXT))
  const allVectors = []
  for (let i = 0; i < texts.length; i += EMBED_BATCH) {
    signal?.throwIfAborted()
    const batch = texts.slice(i, i + EMBED_BATCH)
    const vecs = await embed(embedder, batch, { signal })
    allVectors.push(...vecs)
    onProgress?.({ phase: "embed", done: Math.min(i + EMBED_BATCH, texts.length), total: texts.length })
  }

  // 4) Build manifest
  const dim = allVectors[0]?.length || 0
  const fileMap = {}
  const chunkIdxByFile = new Map() // fileIdx → [{idx, startLine, endLine}]
  for (let ci = 0; ci < allChunks.length; ci++) {
    const c = allChunks[ci]
    if (!chunkIdxByFile.has(c.fileIdx)) chunkIdxByFile.set(c.fileIdx, [])
    chunkIdxByFile.get(c.fileIdx).push({ idx: ci, startLine: c.startLine, endLine: c.endLine })
  }
  for (let fi = 0; fi < files.length; fi++) {
    fileMap[files[fi]] = {
      mtime: fileMtimes[fi] ?? 0,
      kind: kindFor(files[fi], conv),
      chunks: chunkIdxByFile.get(fi) || [],
    }
  }

  // 5) Get git HEAD
  let commit = null
  try { commit = execSync("git rev-parse HEAD", { cwd, encoding: "utf8", timeout: 5000 }).trim() } catch {}

  const manifest = {
    version: 1,
    vector_dim: dim,
    embed_model: embedder.model,
    indexed_commit: commit,
    files: fileMap,
  }

  // 6) Write files — vectors first, manifest last: the manifest is the commit point, so a
  //    reader that sees a fresh manifest is guaranteed the vectors were fully written.
  writeFileSync(join(indexDir, "vectors.bin"), encodeVectors(dim, allVectors))
  writeFileSync(join(indexDir, "manifest.json"), JSON.stringify(manifest, null, 2), "utf8")

  onProgress?.({ phase: "done", done: allChunks.length, total: allChunks.length })
  // VP-9 可见化：未列入扩展名计数（面板提示行消费 + 事件面）。count 为信号、exts 为提示。
  if (unlisted.count > 0) {
    logEvent("index:unlisted", { count: unlisted.count, exts: unlisted.exts.map((e) => e.ext) })
  }
  return { files: files.length, chunks: allChunks.length, unlistedExts: unlisted }
}

/**
 * Load just the manifest (skips the vectors decode — cheap existence/status check).
 * Returns null if the index is missing or incomplete.
 */
export function loadIndexManifest(cwd) {
  const indexDir = join(cwd, INDEX_DIR)
  const mfPath = join(indexDir, "manifest.json")
  if (!existsSync(mfPath) || !existsSync(join(indexDir, "vectors.bin"))) return null
  try {
    const m = JSON.parse(readFileSync(mfPath, "utf8"))
    if (!m || m.version !== 1 || typeof m.files !== "object" || m.files === null) return null
    return m
  } catch { return null }
}

/**
 * Load index from disk. Returns null if no index exists.
 */
export function loadIndex(cwd) {
  const manifest = loadIndexManifest(cwd)
  if (!manifest) return null
  try {
    const { dim, vectors } = decodeVectors(readFileSync(join(cwd, INDEX_DIR, "vectors.bin")))
    // 头一致性（B1 — §4.2 契约二）：vector_dim 与文件头同源（buildIndex）——不等即文件被换/损坏，
    // 任何后续打分都不可信 → null（等价损坏索引 → 走重建路径）。
    if (manifest.vector_dim !== dim) return null
    return { manifest, dim, vectors }
  } catch {
    // corrupt/truncated vectors.bin — treat like a missing index (caller rebuilds)
    return null
  }
}

/**
 * Is the stored index comparable with the given embedder? Manifest-only (no vectors decode,
 * no network) — the status/prompt surfaces call it cheaply (B1 — §4.2 契约一). Vectors of
 * different models live in incomparable spaces: a name mismatch makes every hit
 * untrustworthy, even when the dimensions happen to match.
 * @returns {{compatible: true} | {compatible: false, reason: "model-changed", indexModel: string|null, currentModel: string|null}}
 */
export function indexCompat(cwd, embedder) {
  const manifest = loadIndexManifest(cwd)
  if (!manifest) return { compatible: true }
  const indexModel = manifest.embed_model ?? null
  const currentModel = embedder?.model ?? null
  if (indexModel !== currentModel) {
    return { compatible: false, reason: "model-changed", indexModel, currentModel }
  }
  return { compatible: true }
}

/**
 * Check if index needs rebuild (new commit or missing index).
 */
export function needsRebuild(cwd) {
  const manifest = loadIndexManifest(cwd)
  if (!manifest) return { needed: true, reason: "no-index" }

  let head = null
  try { head = execSync("git rev-parse HEAD", { cwd, encoding: "utf8", timeout: 5000 }).trim() } catch {}
  if (head && manifest.indexed_commit !== head) {
    return { needed: true, reason: "new-commits", head, indexed: manifest.indexed_commit }
  }

  const indexed = new Set(Object.keys(manifest.files ?? {}))

  // Uncommitted changes: `git status --porcelain --ignored=traditional` is index-cached (one
  // subprocess) and far cheaper than a full synchronous tree walk + per-file stat on the host
  // thread. The same call also returns the ignored set (B2 — `!!` lines), so gitignored but
  // indexable files trigger a rebuild exactly like tracked ones. Fall back to a walk + mtime
  // only when git is unavailable.
  let dirty = null
  let ignored = null
  try {
    const lines = execSync("git status --porcelain --ignored=traditional", { cwd, encoding: "utf8", timeout: 5000 })
      .split("\n").filter(Boolean)
    dirty = new Set()
    ignored = []
    for (const l of lines) {
      // "XY path" (2-char code + space) or "XY old -> new" (rename → take the new side)
      let p = l.slice(3)
      if (p.includes(" -> ")) p = p.slice(p.lastIndexOf(" -> ") + 4)
      p = p.replace(/^"|"$/g, "").replaceAll("\\", "/")
      // `!!` = ignored — never a "changed file": it feeds the ignored set (B2), which has no
      // rename form of its own.
      if (l.startsWith("!!")) ignored.push(p)
      else dirty.add(p)
    }
  } catch { dirty = null; ignored = null }

  if (dirty) {
    const conv = loadConventions(cwd)
    for (const rel of dirty) {
      if (indexed.has(rel)) {
        // "dirty" means "differs from HEAD", which stays true across a rebuild — the correct
        // baseline is the manifest mtime. A vanished file → file-removed.
        let cur = -1
        try { cur = Math.trunc(statSync(join(cwd, rel)).mtimeMs) } catch {}
        if (cur < 0) return { needed: true, reason: "file-removed", file: rel }
        if (cur !== Math.trunc(manifest.files[rel]?.mtime)) return { needed: true, reason: "file-changed", file: rel }
        continue
      }
      // Not in the manifest: a genuinely new file (only if it still exists and is indexable —
      // otherwise it's a deleted/renamed-away path that must not read as "added").
      if (shouldIndexFile(rel, conv) && existsSync(join(cwd, rel))) return { needed: true, reason: "file-added", file: rel }
    }
    // B2 (契约五): the ignored side — git reports these paths only as top-level `!!` entries,
    // so they need their own walk + four-state decision + deletion scan.
    const ignoredHit = checkIgnored(cwd, manifest, indexed, ignored ?? [], conv)
    if (ignoredHit) return ignoredHit
    // Memory files under .thincoder/memory/ may be gitignored, so `git status` never reports
    // them — check that one (small) directory directly so they still trigger a rebuild.
    const mem = new Set(listMemoryFiles(cwd))
    for (const f of mem) if (!indexed.has(f)) return { needed: true, reason: "file-added", file: f }
    for (const f of indexed) {
      if (!f.startsWith(".thincoder/memory/")) continue
      if (!mem.has(f)) return { needed: true, reason: "file-removed", file: f }
      let cur = -1
      try { cur = Math.trunc(statSync(join(cwd, f)).mtimeMs) } catch {}
      if (cur < 0) return { needed: true, reason: "file-missing", file: f }
      if (cur !== Math.trunc(manifest.files[f].mtime)) return { needed: true, reason: "file-changed", file: f }
    }
    return { needed: false, reason: "up-to-date" }
  }

  // No git — full discovery + per-file mtime fallback (discoverFiles loads the
  // project conventions itself, so a declared extension is honored on BOTH the
  // discovery and the rebuild-decision side — 契约六/七).
  const discovered = new Set(discoverFiles(cwd))
  for (const f of discovered) if (!indexed.has(f)) return { needed: true, reason: "file-added", file: f }
  for (const f of indexed) if (!discovered.has(f)) return { needed: true, reason: "file-removed", file: f }
  for (const relPath of indexed) {
    const info = manifest.files[relPath]
    try {
      if (Math.trunc(statSync(join(cwd, relPath)).mtimeMs) !== Math.trunc(info.mtime)) {
        return { needed: true, reason: "file-changed", file: relPath }
      }
    } catch {
      // deleted/unreadable since discovery — treat as changed so the index rebuilds
      return { needed: true, reason: "file-missing", file: relPath }
    }
  }
  return { needed: false, reason: "up-to-date" }
}

// ─── Internal: ignored-set helpers (B2 — §4.2 契约五) ──────────

/** 走查根过滤：与 discoverFiles 进入规则同源（SKIP_DIRS / 点目录；.thincoder 仅进 memory）。
 *  `rel` 可为目录条目（尾 "/"——全组件按目录判）或文件路径（末组件不计——同 shouldIndexFile）。 */
function canWalkRoot(rel) {
  const p = String(rel ?? "").replaceAll("\\", "/")
  const bare = p.replace(/\/+$/, "")
  if (!bare) return false
  if (bare === ".thincoder/memory" || bare.startsWith(".thincoder/memory/")) return true
  const parts = bare.split("/")
  const dirs = p.endsWith("/") ? parts : parts.slice(0, -1)
  for (const d of dirs) if (SKIP_DIRS.has(d) || d.startsWith(".")) return false
  return true
}

/** 单候选四态判定（与 dirty 循环同规则）：在册 + mtime 异 → file-changed；在册 + stat 失败 →
 *  file-missing；不在册但可索引且存在 → file-added。命中返回对象，否则 null。 */
function fileStateHit(cwd, manifest, indexed, rel, conv) {
  if (indexed.has(rel)) {
    let cur = -1
    try { cur = Math.trunc(statSync(join(cwd, rel)).mtimeMs) } catch {}
    if (cur < 0) return { needed: true, reason: "file-missing", file: rel }
    if (cur !== Math.trunc(manifest.files[rel]?.mtime)) return { needed: true, reason: "file-changed", file: rel }
    return null
  }
  if (shouldIndexFile(rel, conv) && existsSync(join(cwd, rel))) return { needed: true, reason: "file-added", file: rel }
  return null
}

/** ignored 集处理（B2 — 契约五）：目录条目按发现规则走查（文件走四态判定 + 该根下在册但已消失
 *  的条目）；文件条目经 shouldIndexFile 过滤后同判。被忽略文件删除后在 `git status` 零踪迹，
 *  故存在性扫描最后跑——与 `!!` 处理重叠时同向幂等（reason 一致）。 */
function checkIgnored(cwd, manifest, indexed, ignored, conv) {
  for (const rel of ignored) {
    if (rel.endsWith("/")) {
      if (!canWalkRoot(rel)) continue
      const root = rel.replace(/\/+$/, "")
      for (const f of discoverFilesUnder(cwd, root)) {
        const hit = fileStateHit(cwd, manifest, indexed, f, conv)
        if (hit) return hit
      }
      // Manifest entries under this root that no longer exist: invisible to `git status`
      // (deleted inside an ignored dir — the dir entry itself survives).
      const prefix = root + "/"
      for (const f of indexed) {
        if (!f.startsWith(prefix)) continue
        if (!existsSync(join(cwd, f))) return { needed: true, reason: "file-removed", file: f }
      }
    } else {
      if (!shouldIndexFile(rel, conv)) continue
      const hit = fileStateHit(cwd, manifest, indexed, rel, conv)
      if (hit) return hit
    }
  }
  return checkIgnoredDeletions(cwd, indexed)
}

/** 被忽略文件删除后从 `git status` 与 `!!` 双双消失（git 对零踪迹路径天然不可见）——模式匹配
 *  不依赖存在性，故以 `git check-ignore --stdin -z` 圈定在册路径中仍匹配忽略规则的子集，逐条
 *  存在性检查：缺失 → file-removed。git 不可用/报错 → 跳过（降级 = 现状行为——契约五）。 */
function checkIgnoredDeletions(cwd, indexed) {
  const candidates = [...indexed].filter((f) => canWalkRoot(f))
  if (candidates.length === 0) return null
  const r = spawnSync("git", ["check-ignore", "--stdin", "-z"], {
    cwd,
    input: candidates.join("\0") + "\0",
    encoding: "utf8",
    timeout: 5000,
    windowsHide: true,
  })
  // status 0 = some paths are ignored, 1 = none — both normal. Anything else (or a spawn
  // failure) means git cannot answer → degrade by skipping the scan.
  if (r.error || (r.status !== 0 && r.status !== 1)) return null
  for (const f of String(r.stdout ?? "").split("\0")) {
    if (!f || !indexed.has(f)) continue
    if (!existsSync(join(cwd, f))) return { needed: true, reason: "file-removed", file: f }
  }
  return null
}

/**
 * Search the index with a query. Returns [{ file, kind, startLine, endLine, score }].
 * @param {string} cwd
 * @param {object} embedder
 * @param {string} query
 * @param {{ kind?: "code"|"doc"|"memory", limit?: number, signal?: AbortSignal }} opts
 */
export async function searchIndex(cwd, embedder, query, { kind, limit = 10, signal } = {}) {
  const idx = loadIndex(cwd)
  if (!idx || idx.vectors.length === 0) return []
  // B1 第二道闸（契约三）：异模型索引不可比——在 embed 之前返回 []，失配绝不进打分段。消费方
  // 把空数组当回退信号（tools/code.mjs / memory-tool.mjs）——零改动。无此闸时旧代码把 top-K
  // score=0 条目当结果返回（"给错"而非"搜不到"）。
  if (!indexCompat(cwd, embedder).compatible) return []

  // Embed query
  const [qvec] = await embed(embedder, [query.slice(0, MAX_CHUNK_TEXT)], { signal })
  if (!qvec) return []
  // B1 第三道闸（契约三）：同名模型而实际维度变了（provider 换底层模型）——cosine() 逐对返 0
  // 仍会排序返回。
  if (qvec.length !== idx.dim) return []

  // Score all chunks of matching kind
  const scored = []
  for (const [path, info] of Object.entries(idx.manifest.files)) {
    if (kind && info.kind !== kind) continue
    for (const chunk of info.chunks) {
      if (chunk.idx >= idx.vectors.length) continue
      const score = cosine(qvec, idx.vectors[chunk.idx])
      scored.push({ file: path, kind: info.kind, startLine: chunk.startLine, endLine: chunk.endLine, score })
    }
  }

  // Top-K
  scored.sort((a, b) => b.score - a.score)
  const results = scored.slice(0, limit)

  // Read actual text from files
  for (const r of results) {
    try {
      const text = readFileSync(join(cwd, r.file), "utf8")
      const lines = text.split("\n")
      const start = Math.max(0, r.startLine - 1)
      const end = Math.min(lines.length, r.endLine)
      r.snippet = lines.slice(start, end).map((l, j) => `${start + j + 1}: ${l}`).join("\n")
    } catch {
      r.snippet = "(unreadable)"
    }
  }

  return results
}

// ─── Internal: chunking ────────────────────────────────────────

function chunkFile(cwd, relPath, conv) {
  const abs = join(cwd, relPath)
  let text
  try { text = readFileSync(abs, "utf8") } catch { return [] }
  const lines = text.split("\n")
  const kind = kindFor(relPath, conv)

  if (kind === "memory") {
    // Memory files are single-chunk (they're short markdown)
    return [{ startLine: 1, endLine: lines.length, text: text.slice(0, MAX_CHUNK_TEXT) }]
  }

  return kind === "code" ? chunkCode(lines) : chunkDoc(lines)
}

function chunkCode(lines) {
  const chunks = []
  let i = 0
  while (i < lines.length) {
    // Try to find a natural boundary: function/class/export keyword
    let end = Math.min(i + CHUNK_LINES_CODE, lines.length)
    // Look for a better boundary near end (within last 5 lines of the chunk)
    for (let j = end - 1; j >= Math.max(i, end - 5); j--) {
      const trimmed = lines[j].trim()
      if (/^(export\s+)?(async\s+)?function\s|^class\s|^(export\s+)?const\s|^\/\*\*|^import\s|^export\s/.test(trimmed)) {
        end = j
        break
      }
    }
    // A boundary keyword exactly at the window start (near EOF) would otherwise drop that
    // line — force at least one line into the chunk.
    if (end <= i) end = i + 1
    const chunkLines = lines.slice(i, end)
    chunks.push({ startLine: i + 1, endLine: end, text: chunkLines.join("\n") })
    i = end >= lines.length ? lines.length : Math.max(i + 1, end - CHUNK_OVERLAP)
  }
  return chunks
}

function chunkDoc(lines) {
  const chunks = []
  let start = 0
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim()
    // Split at ## headers
    if (/^##\s/.test(trimmed) && i > start) {
      chunks.push({ startLine: start + 1, endLine: i, text: lines.slice(start, i).join("\n") })
      start = i
    }
    // Split at blank lines when chunk gets too long
    if (i - start >= CHUNK_LINES_DOC && trimmed === "") {
      chunks.push({ startLine: start + 1, endLine: i, text: lines.slice(start, i).join("\n") })
      start = i + 1
    }
  }
  // Remainder
  if (start < lines.length) {
    chunks.push({ startLine: start + 1, endLine: lines.length, text: lines.slice(start).join("\n") })
  }
  return chunks
}
