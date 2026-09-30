/**
 * 2026-09-30-memory-db-family.test.mjs — 批内件（内存库家族批 · 码面：B1–B9 大库操作面 ∥ 面① 索引范围声明
 * + 谓词 + 存量剪枝档 ∥ 面③ 体积护栏与增量维护）。
 * 跑法（从仓库根 `thincoder/`）：`node --test docs/batches/2026-09-30-memory-db-family.test.mjs`
 * 不入仓套件 · 随批留存归档（批件直跑 = 本批验证面）。腿清单 = 批档 §2.5 T1–T21（一对一行）。
 * 数据面纪律：只用夹具 ∕ 沙箱库 ∕ `:memory:`——真库（`~/.thincoder/memory.db`）零触碰。
 * embedding 桩：`embedding.mjs` 经模块钩子短接到确定性桩（零网络；T8 ∕ T16 判别面）。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { registerHooks } from "node:module"
import { mkdirSync, mkdtempSync, statSync, unlinkSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { execFileSync } from "node:child_process"
import { DatabaseSync } from "node:sqlite"
import { fileURLToPath, pathToFileURL } from "node:url"

const ROOT = fileURLToPath(new URL("../../", import.meta.url)) // 仓根（docs/batches 两层深）
const coreUrl = (rel) => pathToFileURL(join(ROOT, "thincoder-core", rel)).href

// ─── embedding 桩（零网络；向量确定：query 向量 = 单位向量 1/√DIM）────────────────────

const PROBE_DIM = 32
const PROBE_UNIT = 1 / Math.sqrt(PROBE_DIM)
const EMBED_REAL = coreUrl("embedding.mjs")
const EMBED_STUB = "data:text/javascript," + encodeURIComponent(`
export function cosine(a, b) { let s = 0; const n = Math.min(a.length, b.length); for (let i = 0; i < n; i++) s += a[i] * b[i]; return s }
export function toBlob(vec) { return Buffer.from(vec.buffer, vec.byteOffset, vec.byteLength) }
export function fromBlob(buf) { if (buf.byteOffset % 4 !== 0) buf = new Uint8Array(buf); if (buf.byteLength % 4 !== 0) return new Float32Array(0); return new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4) }
export async function embed(embedder, texts) { return texts.map(() => new Float32Array(${PROBE_DIM}).fill(${PROBE_UNIT})) }
export function createEmbedder(config) { return { baseURL: config?.baseURL ?? "stub://", apiKey: "stub", model: config?.model ?? "stub-model" } }
`)
registerHooks({
  resolve(specifier, context, next) {
    const r = next(specifier, context)
    if (r?.url === EMBED_REAL) return { url: EMBED_STUB, shortCircuit: true }
    return r
  },
})

const schemaMod = await import(coreUrl("memory/schema.mjs"))
const originMod = await import(coreUrl("memory/origin.mjs"))
const conventions = await import(coreUrl("conventions.mjs"))
const coreMem = await import(coreUrl("memory/core.mjs"))
const codeSyncMod = await import(coreUrl("memory/code-sync.mjs"))
const docsMod = await import(coreUrl("memory/docs.mjs"))
const sweepMod = await import(coreUrl("memory/sweep.mjs"))
const statusMod = await import(coreUrl("memory-status.mjs"))
const repomap = await import(coreUrl("tools/repomap.mjs"))

const { createMemory } = schemaMod
const { normalizeOrigin } = originMod

// ─── 夹具工具 ────────────────────────────────────────────────────────────────

const sandbox = (tag) => mkdtempSync(join(tmpdir(), `memdb-${tag}-`))
const mkFile = (dir, rel, text) => {
  const p = join(dir, ...rel.split("/"))
  mkdirSync(dirname(p), { recursive: true })
  writeFileSync(p, text)
  return p
}
const writeManifest = (dir, obj) => {
  writeFileSync(join(dir, "PROJECT-MANIFEST.json"), JSON.stringify(obj, null, 2))
  conventions.clearDeclarationCache()
}
const git = (cwd, args) => execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim()
const mkGitRepo = (tag, files) => {
  const dir = sandbox(tag)
  git(dir, ["init", "-q"])
  for (const [rel, text] of Object.entries(files)) mkFile(dir, rel, text)
  git(dir, ["add", "-A"])
  git(dir, ["-c", "user.name=t", "-c", "user.email=t@t", "commit", "-q", "-m", "init"])
  return dir
}
const headOf = (cwd) => git(cwd, ["rev-parse", "HEAD"])
const spyDb = (real, sink) => new Proxy(real, {
  get(target, key) {
    if (key === "prepare") return (sql, ...rest) => { sink.push(sql); return target.prepare(sql, ...rest) }
    const v = Reflect.get(target, key)
    return typeof v === "function" ? v.bind(target) : v
  },
})
const captureWarn = async (fn) => {
  const lines = []
  const orig = console.warn
  console.warn = (...a) => lines.push(a.map(String).join(" "))
  try { return { value: await fn(), lines } } finally { console.warn = orig }
}
const insCode = (db, origin, path, n, { mtime = 1, embedding = null, startAt = 1 } = {}) => {
  const st = db.prepare(`INSERT INTO code_chunks (origin, path, language, chunk_type, symbol_name, content, line_start, line_end, mtime_ms, embedding, seg_content) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
  for (let i = 0; i < n; i++) st.run(origin, path, "javascript", "file", "", `// ${path} #${i + 1}`, startAt + i, startAt + i, mtime, embedding, "")
}
const insDoc = (db, origin, path, n, { mtime = 1, embedding = null, seg = "", content = null } = {}) => {
  const st = db.prepare(`INSERT INTO doc_chunks (origin, path, language, heading, content, line_start, line_end, mtime_ms, embedding, seg_content) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
  for (let i = 0; i < n; i++) st.run(origin, path, "markdown", "", content ?? `# ${path} #${i + 1}`, i + 1, i + 1, mtime, embedding, seg)
}
const rowSet = (db, table) => new Set(db.prepare(`SELECT * FROM ${table}`).all().map((r) => JSON.stringify(r)))
const withTxn = (db, fn) => { db.exec("BEGIN"); try { fn() } finally { db.exec("COMMIT") } }

// ─── T1 ∕ T18：声明投影 ∕ 非数组 fail-closed（L-①-1）────────────────────────────

test("T1 声明投影：夹具 [\"./openclaw/\",\"refs\",\"\"] ⇒ [\"openclaw\",\"refs\"]（L-①-1）", () => {
  const dir = sandbox("t1")
  writeManifest(dir, { index: { excludePaths: ["./openclaw/", "refs", ""] } })
  const decl = conventions.loadProjectDeclaration(dir)
  assert.deepEqual([...decl.index.excludePaths], ["openclaw", "refs"], "归一 = ./ 剥离 ∕ 去尾斜杠 ∕ 空剔除 ∕ 保序")
  assert.deepEqual([...conventions.DEFAULT_DECLARATION.index.excludePaths], [], "缺省 []（零行为变化）")
})

test("T18 非数组形态 ⇒ 档非法（fail-closed）∧ 投影不产出（L-①-1）", async () => {
  const { readManifest } = await import(coreUrl("manifest.mjs"))
  const dir = sandbox("t18")
  writeManifest(dir, { index: { excludePaths: "openclaw" } })
  const r = readManifest(dir)
  assert.equal(r.ok, false, "非数组 ⇒ 档非法（与 index.* 同款）")
  assert.ok((r.errors ?? []).some((e) => e.includes("index.excludePaths")), "errors 点名 index.excludePaths")
  conventions.clearDeclarationCache()
  const decl = conventions.loadProjectDeclaration(dir)
  assert.deepEqual([...decl.index.excludePaths], [], "档非法 ⇒ 三族回默认（投影不产出）")
})

// ─── T2 ∕ T19 ∕ T20 ∕ T21：过滤两径 ∕ walk 剪枝 ∕ 单文件缝 ∕ 收尾保护位（L-①-2）────

test("T2 过滤两径：openclaw/** 零返回 ∧ openclaw-fork/** 照常（git 径 ∥ walk 径）", async () => {
  const tree = {
    "openclaw/x.mjs": "export const x = 1\n",
    "openclaw/sub/y.mjs": "export const y = 1\n",
    "openclaw-fork/z.mjs": "export const z = 1\n",
    "src/w.mjs": "export const w = 1\n",
  }
  const repo = mkGitRepo("t2g", tree)
  writeManifest(repo, { index: { excludePaths: ["openclaw"] } })
  const walkDir = sandbox("t2w")
  for (const [rel, text] of Object.entries(tree)) mkFile(walkDir, rel, text)
  writeManifest(walkDir, { index: { excludePaths: ["openclaw"] } })
  for (const [face, dir] of [["git", repo], ["walk", walkDir]]) {
    const res = await codeSyncMod.listProjectFiles(dir, new Set([".mjs"]))
    const rels = res.entries.map((e) => e.rel)
    assert.ok(!rels.some((r) => r === "openclaw" || r.startsWith("openclaw/")), `${face} 径：openclaw/** 零返回`)
    assert.ok(rels.includes("openclaw-fork/z.mjs") && rels.includes("src/w.mjs"), `${face} 径：非排除照常（openclaw 不吞 openclaw-fork）`)
  }
})

test("T19 walk 径 = 剪枝形：排除子树零展开（truncated=false 判别形）", async () => {
  const dir = sandbox("t19")
  writeManifest(dir, { index: { excludePaths: ["excluded"] } })
  for (let i = 0; i < 5; i++) mkFile(dir, `excluded/f${i}.mjs`, `export const v${i} = ${i}\n`)
  const res = await codeSyncMod.listProjectFiles(dir, new Set([".mjs"]), { maxFiles: 2 })
  assert.deepEqual(res.entries, [], "排除子树零返回")
  assert.equal(res.truncated, false, "剪枝 ⇒ 不触上界（后过滤实现会 truncated=true）")
})

test("T20 reindexFile 对排除路径 = 零写（单文件缝；spy 句柄）", async () => {
  const dir = sandbox("t20")
  writeManifest(dir, { index: { excludePaths: ["openclaw"] } })
  const excludedAbs = mkFile(dir, "openclaw/a.mjs", "export const a = 1\n")
  const plainAbs = mkFile(dir, "src/b.mjs", "export const b = 2\n")
  const memory = createMemory({ dbPath: ":memory:" })
  const sink = []
  const spied = { ...memory, db: spyDb(memory.db, sink) }
  await codeSyncMod.reindexFile(spied, dir, excludedAbs)
  const writes = () => sink.filter((s) => /^\s*(INSERT|UPDATE|DELETE)\b/i.test(s))
  assert.deepEqual(writes(), [], "排除路径：零 INSERT ∕ UPDATE ∕ DELETE")
  await codeSyncMod.reindexFile(spied, dir, plainAbs)
  assert.ok(writes().length > 0, "正控：非排除路径照常落写（spy 有效）")
})

test("T21 收尾保护位：排除路径存量行不因声明删除 ∧ 非排除 stale 照删", async () => {
  const dir = sandbox("t21")
  writeManifest(dir, { index: { excludePaths: ["openclaw"] } })
  mkFile(dir, "src/c.mjs", "export const c = 1\n")
  const memory = createMemory({ dbPath: ":memory:" })
  const origin = normalizeOrigin(dir)
  insCode(memory.db, origin, "openclaw/a.mjs", 5)
  insCode(memory.db, origin, "gone/b.mjs", 2)
  const before = rowSet(memory.db, "code_chunks")
  const protectedRows = [...before].filter((s) => s.includes('"openclaw/a.mjs"'))
  const res = await codeSyncMod.codeSync(memory, dir)
  const after = rowSet(memory.db, "code_chunks")
  for (const row of protectedRows) assert.ok(after.has(row), "排除路径存量行逐键不变")
  assert.ok(![...after].some((s) => s.includes('"gone/b.mjs"')), "非排除 stale 行照删")
  assert.ok([...after].some((s) => s.includes('"src/c.mjs"')), "在盘非排除文件照常入索引")
  assert.ok(res.removed === 1, "removed 记非排除 stale（gone/b.mjs 恰一）")
})

// ─── T5 ∕ T6：B2 v10 部分索引（L-②-1）─────────────────────────────────────────

test("T5 v10 迁移：user_version=10 ∧ 两索引在 ∧ 探针计划含 USING INDEX", () => {
  const sb = sandbox("t5")
  const dbPath = join(sb, "mem.db")
  const m1 = createMemory({ dbPath })
  m1.db.exec(`DROP INDEX IF EXISTS code_chunks_embedding_null; DROP INDEX IF EXISTS doc_chunks_embedding_null;`)
  m1.db.exec(`PRAGMA user_version = 9`) // 模拟 v9 库（无两索引）
  m1.db.close()
  const m2 = createMemory({ dbPath }) // 重开 ⇒ migrate v10（只增索引）
  assert.equal(m2.db.prepare(`PRAGMA user_version`).get().user_version, 10)
  const idx = m2.db.prepare(`SELECT name FROM sqlite_master WHERE type='index' AND name LIKE '%_embedding_null'`).all().map((r) => r.name).sort()
  assert.deepEqual(idx, ["code_chunks_embedding_null", "doc_chunks_embedding_null"], "两枚部分索引在盘")
  const probes = [
    ["code_chunks", "symbol_name", "code_chunks_embedding_null"],
    ["doc_chunks", "heading", "doc_chunks_embedding_null"],
  ]
  for (const [table, col, indexName] of probes) {
    const plan = m2.db.prepare(`EXPLAIN QUERY PLAN SELECT rowid, path, ${col}, content FROM ${table} WHERE embedding IS NULL LIMIT 64`).all()
    const detail = plan.map((p) => p.detail).join(" | ")
    assert.ok(detail.includes(`USING INDEX ${indexName}`), `${table} 探针走索引：${detail}`)
    assert.ok(!detail.includes("SCAN"), `${table} 探针无 SCAN：${detail}`)
  }
})

test("T6 边界：置 NULL 行 100 枚 ⇒ 探针 LIMIT 64 返回恰 64（部分索引不改变计数语义）", () => {
  const memory = createMemory({ dbPath: ":memory:" })
  withTxn(memory.db, () => insCode(memory.db, "D:/fxt/t6", "bulk/f.mjs", 100))
  const rows = memory.db.prepare(`SELECT rowid, path, symbol_name, content FROM code_chunks WHERE embedding IS NULL LIMIT 64`).all()
  assert.equal(rows.length, 64)
})

// ─── T7 ∕ T8：B7 读面零写（L-②-4）──────────────────────────────────────────────

const mismatchFixture = (tag) => {
  const memory = createMemory({ dbPath: `:memory:` })
  const origin = `D:/fxt/${tag}`
  withTxn(memory.db, () => {
    const upsert = memory.db.prepare(`INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value`)
    for (const k of ["embedding_model", "code_embedding_model", "doc_embedding_model"]) upsert.run(k, "old-model")
    insCode(memory.db, origin, "c/a.mjs", 2) // 待回填（embedding NULL）——旧实现会在此 wipe + 回填
    insDoc(memory.db, origin, "d/a.md", 2)
  })
  memory.embedder = { model: "new-model" }
  memory.codeOrigin = origin
  return memory
}

test("T7 读面零写：spy 句柄驱动 search ∥ docSearch ∥ codeSearch 零写（失配 + 待回填夹具）", async () => {
  const memory = mismatchFixture("t7")
  const sink = []
  const spied = { ...memory, db: spyDb(memory.db, sink) }
  const { lines } = await captureWarn(async () => {
    await coreMem.search(spied, "hello", { limit: 3 })
    await docsMod.docSearch(spied, "hello", { limit: 3 })
    await codeSyncMod.codeSearch(spied, "hello", { limit: 3 })
  })
  const writes = sink.filter((s) => /^\s*(INSERT|UPDATE|DELETE)\b/i.test(s))
  // 射程 = **模型失效面**（F-S7 口径）：三面模型键全失配 ⇒ 读面零写；键一致 + 待回填行时懒回填
  // 仍写（D-MEM14「失效向量置空 + 检索懒回填」保留面——非本断言面）
  assert.deepEqual(writes, [], "读面零写（含模型失配面——失效执行归维护口）")
  assert.equal(lines.length, 3, "三调用各一行可见（降级句）")
})

test("T8 模型键失配 ⇒ 结果 = FTS-only（向量零计分）+ 一行可见（L-②-4）", async () => {
  const memory = createMemory({ dbPath: ":memory:" })
  const origin = "D:/fxt/t8"
  const queryVec = new Float32Array(PROBE_DIM).fill(PROBE_UNIT)
  withTxn(memory.db, () => {
    const upsert = memory.db.prepare(`INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value`)
    for (const k of ["embedding_model", "code_embedding_model", "doc_embedding_model"]) upsert.run(k, "old-model")
    // A：FTS 命中（向量 NULL）；B：仅向量命中（cosine=1——无降级时必进结果）
    insCode(memory.db, origin, "a.mjs", 1, { content: "// needle" })
    memory.db.prepare(`UPDATE code_chunks SET seg_content = 'needle' WHERE origin = ? AND path = 'a.mjs'`).run(origin)
    insCode(memory.db, origin, "b.mjs", 1, { embedding: Buffer.from(queryVec.buffer, queryVec.byteOffset, queryVec.byteLength) })
  })
  memory.embedder = { model: "new-model" }
  memory.codeOrigin = origin
  const { value: results, lines } = await captureWarn(() => codeSyncMod.codeSearch(memory, "needle", { limit: 5 }))
  assert.equal(lines.length, 1, "一行可见")
  assert.ok(/degraded to FTS-only/.test(lines[0]), "降级句可见")
  assert.ok(results.some((r) => r.path === "a.mjs"), "FTS 命中保留")
  assert.ok(!results.some((r) => r.path === "b.mjs"), "向量通道零计分（b 不进结果）")
})

// ─── T9：B6 ∕ M3 收尾让出（L-②-3）─────────────────────────────────────────────

test("T9 收尾让出：stale 行 ≥ 阈值（注入计数 yieldFn）⇒ 让出次数 ≥ 1（codeSync ∥ docSync）", async () => {
  const cdir = sandbox("t9c")
  for (let i = 0; i < 200; i++) mkFile(cdir, `f${String(i).padStart(3, "0")}.mjs`, `export const v${i} = ${i}\n`)
  const cmem = createMemory({ dbPath: ":memory:" })
  await codeSyncMod.codeSync(cmem, cdir)
  for (let i = 0; i < 130; i++) unlinkSync(join(cdir, `f${String(i).padStart(3, "0")}.mjs`))
  let cyields = 0, ct = 0
  const cres = await codeSyncMod.codeSync(cmem, cdir, { yieldFn: async () => { cyields++ }, nowFn: () => (ct += 100) })
  assert.equal(cres.removed, 130, "stale 130 行照删")
  assert.ok(cyields >= 1, `收尾循环让出 ≥ 1（实读 ${cyields}）`)

  const ddir = sandbox("t9d")
  for (let i = 0; i < 100; i++) mkFile(ddir, `d${String(i).padStart(3, "0")}.md`, `# t${i}\n\nbody ${i}\n`)
  const dmem = createMemory({ dbPath: ":memory:" })
  await docsMod.docSync(dmem, ddir)
  for (let i = 0; i < 70; i++) unlinkSync(join(ddir, `d${String(i).padStart(3, "0")}.md`))
  let dyields = 0, dt = 0
  const dres = await docsMod.docSync(dmem, ddir, { yieldFn: async () => { dyields++ }, nowFn: () => (dt += 100) })
  assert.equal(dres.removed, 70, "doc stale 70 行照删")
  assert.ok(dyields >= 1, `doc 收尾循环让出 ≥ 1（实读 ${dyields}）`)
})

// ─── T10：P1 读数（L-③-1）────────────────────────────────────────────────────

test("T10 memoryStatus：dbBytes = statSync 实读 ∧ 逐 origin 行数同值（L-③-1）", () => {
  const sb = sandbox("t10")
  const dbPath = join(sb, "mem.db")
  const memory = createMemory({ dbPath })
  withTxn(memory.db, () => {
    insCode(memory.db, "D:/fxt/a", "a/x.mjs", 3)
    insCode(memory.db, "D:/fxt/b", "b/y.mjs", 1)
    insDoc(memory.db, "D:/fxt/a", "a/x.md", 2)
    insDoc(memory.db, "D:/fxt/b", "b/y.md", 4)
  })
  const st = statusMod.memoryStatus(memory)
  assert.equal(st.dbBytes, statSync(dbPath).size, "dbBytes = 库文件 statSync")
  const expected = [
    { origin: "D:/fxt/a", code: 3, doc: 2 },
    { origin: "D:/fxt/b", code: 1, doc: 4 },
  ]
  assert.deepEqual(st.origins, expected, "逐 origin 行数 = 直读聚合同值")
})

// ─── T11：P2 行预算（L-③-2）───────────────────────────────────────────────────

test("T11 行预算：既有行数置于 CAP 邻域 ⇒ budgetSkipped>0 ∧ 跳过零落行 ∧ 两跑跳过集逐字相等 ∧ WARN 恰一", async () => {
  const dir = sandbox("t11")
  const files = []
  for (let i = 1; i <= 5; i++) files.push(mkFile(dir, `f${i}.mjs`, `export const v${i} = ${i}\n`))
  const memory = createMemory({ dbPath: ":memory:" })
  const origin = normalizeOrigin(dir)
  const CAP = schemaMod.INDEX_ORIGIN_ROW_CAP
  const f1mtime = Math.floor(statSync(files[0]).mtimeMs)
  // f1 为「既有行」：CAP-3 行同 path 行（mtime 命中 ⇒ 本趟跳过、不落不删——预算基数）
  withTxn(memory.db, () => insCode(memory.db, origin, "f1.mjs", CAP - 3, { mtime: f1mtime }))
  const baseRows = memory.db.prepare(`SELECT COUNT(*) AS n FROM code_chunks WHERE origin = ?`).get(origin).n
  assert.equal(baseRows, CAP - 3)

  const runOnce = async () => {
    const counted = []
    const orig = console.warn
    console.warn = (...a) => counted.push(a.map(String).join(" "))
    try {
      const res = await codeSyncMod.codeSync(memory, dir)
      const rowsOf = (rel) => memory.db.prepare(`SELECT COUNT(*) AS n FROM code_chunks WHERE origin = ? AND path = ?`).get(origin, rel).n
      return { res, warns: counted.filter((l) => l.includes("≥ WARN")), rowsOf }
    } finally { console.warn = orig }
  }
  const run1 = await runOnce()
  assert.ok(run1.res.budgetSkipped.length > 0, "budgetSkipped > 0")
  assert.deepEqual(run1.res.budgetSkipped, ["f5.mjs"], "跳过 = 列序后缀")
  for (const rel of run1.res.budgetSkipped) assert.equal(run1.rowsOf(rel), 0, `跳过文件零落行：${rel}`)
  assert.equal(run1.warns.length, 1, "WARN 行恰一（每趟至多一行）")
  assert.equal(run1.res.updated, 3, "CAP 前文件照常落库")

  const run2 = await runOnce()
  assert.deepEqual(run2.res.budgetSkipped, run1.res.budgetSkipped, "两跑跳过集逐字相等（处理序确定性）")
  assert.equal(run2.warns.length, 1, "WARN 行恰一")
})

// ─── T12 ∕ T13：M1 per-origin 锚（L-③-3）──────────────────────────────────────

test("T12 per-origin 锚：两仓各自 sync ⇒ 两键互不覆盖 ∧ 旧单键零写（L-③-3）", async () => {
  const repoA = mkGitRepo("t12a", { "a.mjs": "export const a = 1\n" })
  const repoB = mkGitRepo("t12b", { "b.mjs": "export const b = 1\n" })
  const memory = createMemory({ dbPath: ":memory:" })
  await codeSyncMod.codeSync(memory, repoA)
  await codeSyncMod.codeSync(memory, repoB)
  const rows = memory.db.prepare(`SELECT key, value FROM meta WHERE key LIKE 'last_indexed_commit:%'`).all()
  const map = new Map(rows.map((r) => [r.key, r.value]))
  assert.equal(map.get(`last_indexed_commit:${normalizeOrigin(repoA)}`), headOf(repoA), "A 锚 = A HEAD")
  assert.equal(map.get(`last_indexed_commit:${normalizeOrigin(repoB)}`), headOf(repoB), "B 锚 = B HEAD（未被 A 覆盖）")
  assert.equal(memory.db.prepare(`SELECT COUNT(*) AS n FROM meta WHERE key = 'last_indexed_commit'`).get().n, 0, "旧单键零写（清退 = ops）")
})

test("T13 legacy 单键在 ∕ per-origin 键缺 ⇒ gitSync 返 null（全扫一次）", async () => {
  const repo = mkGitRepo("t13", { "a.mjs": "export const a = 1\n" })
  const memory = createMemory({ dbPath: ":memory:" })
  memory.db.prepare(`INSERT INTO meta (key, value) VALUES ('last_indexed_commit', ?)`).run("0000000000000000000000000000000000000000")
  const res = await codeSyncMod.gitSync(memory, repo)
  assert.equal(res, null, "旧键在而 per-origin 键缺 ⇒ 视为无锚")
})

// ─── T14 ∕ T15：M2 gitSync --relative（L-③-4）─────────────────────────────────

test("T14 子目录 origin：touch ⇒ gitSync 重索引（非删除支）∧ path 与 codeSync 同形（L-③-4）", async () => {
  const repo = mkGitRepo("t14", { "sub/a.mjs": "export const a = 1\n", "other.mjs": "export const o = 1\n" })
  const subdir = join(repo, "sub")
  const memory = createMemory({ dbPath: ":memory:" })
  await codeSyncMod.codeSync(memory, subdir)
  const origin = normalizeOrigin(subdir)
  const base = memory.db.prepare(`SELECT path FROM code_chunks WHERE origin = ? ORDER BY path`).all(origin).map((r) => r.path)
  assert.deepEqual([...new Set(base)], ["a.mjs"], "codeSync 落行 = cwd 相对形")
  writeFileSync(join(subdir, "a.mjs"), "export const a = 2 // TOUCHED\n")
  const res = await codeSyncMod.gitSync(memory, subdir)
  assert.ok(res && res.updated === 1 && res.removed === 0, `gitSync 重索引（非删除支）：${JSON.stringify(res)}`)
  const row = memory.db.prepare(`SELECT path, content FROM code_chunks WHERE origin = ?`).get(origin)
  assert.equal(row.path, "a.mjs", "落行 path 与 codeSync 逐字同形")
  assert.ok(row.content.includes("TOUCHED"), "新内容入库")
})

test("T15 仓根他处改动 ⇒ 子目录 origin 不索引（--relative 射程收在子树）", async () => {
  const repo = mkGitRepo("t15", { "sub/a.mjs": "export const a = 1\n", "other.mjs": "export const o = 1\n" })
  const subdir = join(repo, "sub")
  const memory = createMemory({ dbPath: ":memory:" })
  await codeSyncMod.codeSync(memory, subdir)
  const origin = normalizeOrigin(subdir)
  writeFileSync(join(repo, "other.mjs"), "export const o = 2 // ROOT-TOUCHED\n")
  const res = await codeSyncMod.gitSync(memory, subdir)
  assert.ok(res && res.updated === 0 && res.removed === 0, `仓根改动不入本子树：${JSON.stringify(res)}`)
  assert.equal(memory.db.prepare(`SELECT COUNT(*) AS n FROM code_chunks WHERE origin = ? AND path = 'other.mjs'`).get(origin).n, 0, "other.mjs 零落行")
})

// ─── T16：L-②-5 探针（单回合召回墙钟；读数落档）───────────────────────────────

test("T16 探针：缺省工作集基线（1.9 万行）单回合召回墙钟 + CAP 档（10 万行）结构参考读数落档", async () => {
  const memory = createMemory({ dbPath: ":memory:" })
  const queryVec = Buffer.from(new Float32Array(PROBE_DIM).fill(PROBE_UNIT).buffer)
  const otherVec = Buffer.from(new Float32Array(PROBE_DIM).fill(-PROBE_UNIT).buffer)
  const seed = (origin, rows, hitPath) => withTxn(memory.db, () => {
    const st = memory.db.prepare(`INSERT INTO doc_chunks (origin, path, language, heading, content, line_start, line_end, mtime_ms, embedding, seg_content) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    st.run(origin, hitPath, "markdown", "", "# vec-only-hit", 1, 1, 0, queryVec, "")
    for (let i = 0; i < rows - 1; i++) {
      const p = `bulk/g${String(Math.floor(i / 50)).padStart(5, "0")}.md`
      st.run(origin, p, "markdown", "", "filler", (i % 50) + 1, (i % 50) + 1, 0, otherVec, "")
    }
    memory.db.prepare(`INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value`).run("doc_embedding_model", "probe-model")
  })
  const A = "D:/fxt/ws-baseline", B = "D:/fxt/ws-cap"
  seed(A, 19000, "a/vec-only-hit.md") // 0.5 s ≙ ≈1.9 万行（设计换算）——缺省工作集基线量级
  seed(B, 100000, "b/vec-only-hit.md") // CAP 档（10 万行）——结构参考，非触发判别
  memory.embedder = { model: "probe-model" }

  memory.codeOrigin = A
  const t0 = performance.now()
  const hitsA = await docsMod.docSearch(memory, "probe query", { limit: 5 })
  const msBaseline = performance.now() - t0
  memory.codeOrigin = B
  const t1 = performance.now()
  const hitsB = await docsMod.docSearch(memory, "probe query", { limit: 5 })
  const msCap = performance.now() - t1
  assert.ok(hitsA.some((r) => r.path === "a/vec-only-hit.md"), "基线档向量通道实跑（命中行在结果）")
  assert.ok(hitsB.some((r) => r.path === "b/vec-only-hit.md"), "CAP 档向量通道实跑")
  const reading = {
    at: new Date().toISOString(),
    probe: "L-②-5 单回合召回墙钟（docSearch 向量通道——分块扫描 + 有界 top-K；embedding 桩）",
    fixture: {
      baselineDefaultWorkingSet: { origin: A, rows: 19000, recallMs: Number(msBaseline.toFixed(1)) },
      capLevel: { origin: B, rows: 100000, recallMs: Number(msCap.toFixed(1)) },
      embeddingDim: PROBE_DIM,
      note: "夹具 blob = 32 维（128 B ∕ 行）——绝对读数较真库偏轻（真库 bge-m3 1024 维）；判别按设计换算口径（缺省工作集基线档 ≤ 1.9 万行 ⇒ < 0.5 s ⇒ 不触发），真库只读复测 = 复测面",
    },
    triggerLineMs: 500,
    conversion: "26 µs ∕ 行 ⇒ 0.5 s ≙ ≈1.9 万行（设计换算；基线档 ≤ 1.9 万行 ⇒ 读数 < 0.5 s ⇒ 不触发）",
    verdict: msBaseline >= 500
      ? "缺省工作集基线档 ≥ 0.5 s ⇒ 下一轮以 worker 出库（升级触发在册）"
      : "缺省工作集基线档 < 0.5 s ⇒ 不触发（CAP 档读数 = 结构量级参考，不作触发判别）",
  }
  writeFileSync(join(ROOT, "docs/batches/2026-09-30-memory-db-family-readings.json"), JSON.stringify(reading, null, 2))
  console.log(`[T16] 基线档（19,000 行）单回合召回 = ${reading.fixture.baselineDefaultWorkingSet.recallMs} ms；CAP 档（100,000 行）= ${reading.fixture.capLevel.recallMs} ms`)
  assert.ok(Number.isFinite(msBaseline) && Number.isFinite(msCap), "两向读数落档")
})

// ─── T17：B3 ∕ B4 接线（L-②-2）───────────────────────────────────────────────

test("T17 B3 ∕ B4 接线：SQL 含 origin 绑定 + LIMIT 20001 形；越界「+」形 ∕ 提示行", async () => {
  // B4 越界：20,001 条 distinct path ⇒ 提示行 + 跳过大纲构建
  const sbOver = sandbox("t17over")
  const memOver = createMemory({ dbPath: join(sbOver, "mem.db") })
  const overOrigin = "D:/fxt/t17-over"
  withTxn(memOver.db, () => { for (let i = 0; i < 20001; i++) insCode(memOver.db, overOrigin, `bulk/p${String(i).padStart(5, "0")}.mjs`, 1) })
  const sinkB4 = []
  const hint = await repomap.buildSummary(spyDb(memOver.db, sinkB4), overOrigin, { origin: overOrigin })
  assert.ok(hint.includes("> 20000 files"), `越界提示行：${hint}`)
  assert.ok(hint.includes("index.excludePaths") && hint.includes("sweep --origin"), "提示行指路 声明 ∕ 剪枝")
  const b4Sql = sinkB4.find((s) => s.includes("DISTINCT path"))
  assert.ok(b4Sql?.includes("origin = ?") && b4Sql?.includes("LIMIT 20001"), `B4 文件行形：${b4Sql}`)

  // B4 正常档：3 个在盘文件 ⇒ 照常构建大纲
  const dirOk = sandbox("t17ok")
  mkFile(dirOk, "a.mjs", 'import { b } from "./b.mjs"\nexport const a = b\n')
  mkFile(dirOk, "b.mjs", "export const b = 2\n")
  mkFile(dirOk, "c.mjs", "export const c = 3\n")
  const memOk = createMemory({ dbPath: ":memory:" })
  await codeSyncMod.codeSync(memOk, dirOk)
  const summary = await repomap.buildSummary(memOk.db, dirOk, { origin: normalizeOrigin(dirOk) })
  assert.ok(summary.includes("3 source files indexed."), `正常档构建：${summary.slice(0, 120)}`)

  // B3：越界回「20000+」∧ SQL = 计数子查询 LIMIT 20001 形；≤ WARN 回准确数
  const sbB3 = sandbox("t17b3")
  const memB3 = createMemory({ dbPath: join(sbB3, "mem.db") })
  const b3Origin = normalizeOrigin(sbB3)
  withTxn(memB3.db, () => {
    insDoc(memB3.db, b3Origin, "docs/hit.md", 1, { seg: "hello", content: "hello world" })
    for (let i = 0; i < 20000; i++) insDoc(memB3.db, b3Origin, `docs/f${String(i).padStart(5, "0")}.md`, 1, { content: "filler" })
  })
  const sinkB3 = []
  const spied = { ...memB3, db: spyDb(memB3.db, sinkB3), codeOrigin: b3Origin }
  const { prepareRun } = await import(coreUrl("agent/setup.mjs"))
  const agent = { cwd: sbB3, history: [], _pendingReminders: [], config: {}, tools: [], memory: spied }
  await prepareRun(agent, "hello", {}, { depth: 0 })
  const text = agent.history.map((m) => String(m.content ?? "")).join("\n")
  assert.ok(text.includes("20000+ chunks indexed total"), "越界回「+」形")
  const b3Sql = sinkB3.find((s) => s.includes("FROM (SELECT 1 FROM doc_chunks"))
  assert.ok(b3Sql?.includes("origin = ?") && b3Sql?.includes("LIMIT 20001"), `B3 计数子查询形：${b3Sql}`)

  const sbSmall = sandbox("t17small")
  const memSmall = createMemory({ dbPath: join(sbSmall, "mem.db") })
  const smallOrigin = normalizeOrigin(sbSmall)
  withTxn(memSmall.db, () => {
    insDoc(memSmall.db, smallOrigin, "docs/hit.md", 1, { seg: "hello", content: "hello world" })
    for (let i = 0; i < 4; i++) insDoc(memSmall.db, smallOrigin, `docs/x${i}.md`, 1, { content: "filler" })
  })
  const agent2 = { cwd: sbSmall, history: [], _pendingReminders: [], config: {}, tools: [], memory: { ...memSmall, codeOrigin: smallOrigin } }
  await prepareRun(agent2, "hello", {}, { depth: 0 })
  const text2 = agent2.history.map((m) => String(m.content ?? "")).join("\n")
  assert.ok(text2.includes("(5 chunks indexed total"), "≤ WARN 回准确数")
})

// ─── T3 ∕ T4：sweep --path 档（L-①-3）────────────────────────────────────────

const sweepFixture = (tag) => {
  const sb = sandbox(tag)
  const dbPath = join(sb, "mem.db")
  const memory = createMemory({ dbPath })
  const X = "D:/fxt/sweep-x"
  const Y = "D:/fxt/sweep-y"
  withTxn(memory.db, () => {
    insCode(memory.db, X, "openclaw/a.mjs", 2)
    insCode(memory.db, X, "openclaw-fork/b.mjs", 1)
    insCode(memory.db, X, "src/c.mjs", 1)
    insDoc(memory.db, X, "openclaw/d.md", 1)
    insCode(memory.db, Y, "openclaw/e.mjs", 1)
  })
  return { sb, dbPath, memory, X, Y }
}
const hitKeys = (set, origin, prefix) => [...set].filter((s) => s.includes(`"origin":"${origin}"`) && s.includes(`"path":"${prefix}`))

test("T3 零命中：sweep --origin X --path 无匹配 ⇒ 零写、无备份（L-①-3）", () => {
  const { dbPath, memory, X } = sweepFixture("t3")
  const before = [rowSet(memory.db, "code_chunks"), rowSet(memory.db, "doc_chunks")]
  const res = sweepMod.sweepMemory(memory, { origin: X, path: "no-such-subtree", confirm: true, dbPath })
  assert.equal(res.hits, 0, "零命中")
  assert.equal(res.backupPath, null, "零命中 ⇒ 不取备份")
  assert.deepEqual([rowSet(memory.db, "code_chunks"), rowSet(memory.db, "doc_chunks")], before, "零写")
})

test("T4 --confirm（沙箱库）：命中行 0 ∧ 非命中行逐键不变 ∧ 备份 integrity_check ok（L-①-3）", () => {
  const { sb, dbPath, memory, X } = sweepFixture("t4")
  const beforeCode = rowSet(memory.db, "code_chunks")
  const beforeDoc = rowSet(memory.db, "doc_chunks")
  const now = new Date("2026-09-30T00:00:00Z")
  const res = sweepMod.sweepMemory(memory, { origin: X, path: "openclaw", confirm: true, dbPath, now })
  assert.equal(res.hits, 3, "命中 = 2 code + 1 doc（前缀边界不吞 openclaw-fork）")
  const expectBackup = `${dbPath}.sweep-backup-20260930000000`
  assert.equal(res.backupPath, expectBackup, "备份路径 = <dbPath>.sweep-backup-<UTC>")
  const bdb = new DatabaseSync(expectBackup, { readOnly: true })
  try { assert.equal(Object.values(bdb.prepare("PRAGMA integrity_check").get())[0], "ok") } finally { bdb.close() }

  const afterCode = rowSet(memory.db, "code_chunks")
  const afterDoc = rowSet(memory.db, "doc_chunks")
  assert.deepEqual(hitKeys(afterCode, X, "openclaw/"), [], "命中行 0（code）")
  assert.deepEqual(hitKeys(afterDoc, X, "openclaw/"), [], "命中行 0（doc）")
  const removed = [...beforeCode].filter((r) => !afterCode.has(r))
  assert.deepEqual(removed.sort(), hitKeys(beforeCode, X, "openclaw/").sort(), "仅命中行被删")
  for (const r of afterCode) assert.ok(beforeCode.has(r), "非命中行逐键等前值（code）")
  for (const r of afterDoc) assert.ok(beforeDoc.has(r), "非命中行逐键等前值（doc）")
  assert.ok([...afterCode].some((r) => r.includes('"openclaw-fork/b.mjs"')), "前缀边界：openclaw-fork 不吞")
  assert.ok([...afterCode].some((r) => r.includes('"D:/fxt/sweep-y"')), "非目标 origin 零变")
  void sb
})
