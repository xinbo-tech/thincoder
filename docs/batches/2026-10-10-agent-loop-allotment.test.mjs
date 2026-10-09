/**
 * 2026-10-10-agent-loop-allotment.test.mjs — agent-loop-allotment 批（台账 #1100）批次本地件。
 * 名随批次档 · 住批次目录 · **不进仓套件**；复跑（任意 cwd 可跑——仓根经 import.meta.url 定位）：
 *   node --test docs/batches/2026-10-10-agent-loop-allotment.test.mjs
 *
 * T 表（用例 → 夹具 → 断言 → 回指；期望结果句逐条在断言内）：
 *   T1 无声明源 golden = 夹具 proj（变体 A：manifest 在盘 + `index.publicRepos: []`；变体 B：无 manifest；
 *      变体 C：超长正文 —— preview ≤300 字元上界断言）；
 *      doc 行 = 本仓 origin 6 枚（a–e 含 needle 各 5/4/3/2/1 次 ∥ f 零命中）；
 *      断言 = 注入块逐字节 === golden（6 计数行 + a–e 五行）∥ 两变体等值 ∥ 变体 C：preview = 正文前 300 字元
 *      ∥ SQL spy：恰 1 条 FTS 查询且单 origin 等值形（非 IN）。回指 F-DI2 / F-DI3（preview 口径）/ N1 / N2。
 *   T2 `docSearch` origins 三态格 = 夹具三 origin（proj=A 在盘声明 ∥ docs-repo=B 被声明 ∥ other=C 未声明）；
 *      断言 = ① 缺省（无参）= `searchOrigins` 集（A+B——非 declared 的 C 不出）∥ ② `origins:[B]` = 限定 B
 *      （SQL 单 origin 等值形）∥ ③ `origins:[]` = 不过滤（A+B+C；FTS ∥ 向量扫描 SQL 皆无 origin 谓词）
 *      ∥ ④ `origins:[A,B]` = 多 origin `IN (?, ?)` 形。回指 R1-1 契约（批档 §2:39）。
 *   T3 配额构成 = 夹具 proj（声明 ../docs-repo）+ 本仓 5 枚弱命中（needle×1）× 声明 8 枚强命中（needle×5）；
 *      断言 = 块恰 10 行（本仓 5 在前 = 本仓腿独立 top-5 ∥ 声明 5 补位 = 声明腿结果）∥ 计数行 = 13（全 origin 集）
 *      ∥ SQL spy：恰 2 条 FTS 查询（= 两腿）∥ **负对照**：单调用全局 top-5 不含全部本仓 5 枚（= 病灶本体）。
 *      回指 F-DI1 / N1 / N3。
 *   T4 声明零命中 = 夹具 proj（声明 ../docs-repo）+ 本仓 2 枚命中 × 声明 3 枚零命中（FTS-only 夹具：
 *      无 embedder ⇒ 零命中即零行，矢量分数面不混入）；
 *      期望 = 本仓 ≤5 照常占据；声明侧零命中 ⇒ 零补位（无空行 ∥ 无占位符）；块 = 仅本仓 2 项；
 *      计数行 = 5（全 origin 集）在场。断言 = 块 2 行且皆本仓 ∥ 无 `pub/` 行 ∥ 无空行 ∥ SQL spy：两腿各 1 条
 *      （声明腿照跑、零命中不塌）。回指 F-DI1「有命中即占位」的补集 / N1。
 *   T5 上限 ≤10 = 夹具 proj（声明 ../docs-repo-a ∥ ../docs-repo-b）+ 本仓 6 枚 × A 仓 4 枚 × B 仓 4 枚；
 *      断言 = 块行数 ≤10 且恰 10（两腿皆饱和）∥ 本仓 5 在前 ∥ 声明 5 = **单次**声明腿（两声明仓同集，
 *      SQL `IN (?, ?)`）结果 ∥ 路径零重复。回指 F-DI1 / N3（总块数 ≤10）。
 *   T6 降级腿 = 夹具同 T3 形，`doc_embedding_model` 与 embedder.model **失配** ⇒ 每腿 FTS-only；
 *      断言 = 块仍在（本仓 ∥ 声明各行皆出 = 逐腿 FTS 结果）∥ 一行降级 warn 可见 ∥ SQL spy：零向量扫描查询
 *      （两腿皆未进向量通道）。回指 N2（注入失败静默 = 现状的反面：降级可见且仍出块）。
 *
 * 数据面纪律：只用夹具 ∕ 沙箱（tmpdir）——真库（`~/.thincoder/`）零触碰；embedding 经模块钩子短接
 * 到确定性桩（零网络；同向向量 ⇒ 向量通道全并列分——到达序 = PK 序，确定性判别面）。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { registerHooks } from "node:module"
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const ROOT = fileURLToPath(new URL("../../", import.meta.url)) // 仓根（thincoder/）
const coreUrl = (rel) => pathToFileURL(join(ROOT, "thincoder-core", rel)).href

// ─── embedding 桩（零网络；向量全部同向 ⇒ 全并列分数——PK 定序判别面）─────────────────
const PROBE_DIM = 32
const PROBE_UNIT = 1 / Math.sqrt(PROBE_DIM)
const EMBED_REAL = coreUrl("embedding.mjs")
const EMBED_STUB = "data:text/javascript," + encodeURIComponent(`
export function cosine(a, b) { let s = 0; const n = Math.min(a.length, b.length); for (let i = 0; i < n; i++) s += a[i] * b[i]; return s }
export function toBlob(vec) { return Buffer.from(vec.buffer, vec.byteOffset, vec.byteLength) }
export function fromBlob(buf) { if (buf.byteOffset % 4 !== 0) buf = new Uint8Array(buf); if (buf.byteLength % 4 !== 0) return new Float32Array(0); return new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4) }
export async function embed(embedder, texts) { return texts.map(() => new Float32Array(${PROBE_DIM}).fill(${PROBE_UNIT})) }
export function createEmbedder(config) { return { baseURL: config?.baseURL ?? "stub://", apiKey: "stub", model: config?.model ?? "stub-model" } }
export async function embedTolerant(embedder, texts, opts = {}) { return { vectors: await embed(embedder, texts, opts), skipped: [] } }
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
const codeIndexMod = await import(coreUrl("memory/code-index.mjs"))
const codeSearchMod = await import(coreUrl("memory/code-search.mjs"))
const docsMod = await import(coreUrl("memory/docs.mjs"))
const helpersMod = await import(coreUrl("agent/helpers.mjs"))
const setupMod = await import(coreUrl("agent/setup.mjs"))

const { createMemory } = schemaMod
const { normalizeOrigin } = originMod
const { _upsertDocFile } = codeIndexMod
const { docSearch } = docsMod
const { searchOrigins } = codeSearchMod
const { escapeXml } = helpersMod
const { prepareRun } = setupMod

// ─── 夹具工具 ────────────────────────────────────────────────────────────────
const created = []
const sandbox = (tag) => { const d = mkdtempSync(join(tmpdir(), `ala-${tag}-`)); created.push(d); return d }
const cleanup = () => {
  for (const d of created.splice(0)) {
    try { rmSync(d, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 }) } catch { /* 留 tmp */ }
  }
}
const QUERY = "needle"
/** 固定六词正文：前 k 词 needle、余 filler（词数恒等 ⇒ bm25 次序只由 tf 驱动）。 */
const bodyOf = (k) => Array.from({ length: 6 }, (_, i) => (i < k ? "needle" : "filler")).join(" ")
const putDocs = (memory, origin, files) => {
  for (const [rel, text] of Object.entries(files)) _upsertDocFile(memory, origin, rel, text.split("\n"), 1)
}
const writeManifestFile = (dir, obj) => {
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, "PROJECT-MANIFEST.json"), JSON.stringify(obj, null, 2))
  conventions.clearDeclarationCache() // 声明缓存按数据档路径——夹具改写后必须清（测试缝）
}
/** 新 memory 句柄：origin = 项目根；embedder = 桩 + meta 键对齐（缺省进向量通道；`embedder:false` ⇒ FTS-only 夹具）。 */
const newMemory = (dbPath, codeOrigin, { model = "stub-model", storedModel = "stub-model", embedder = true } = {}) => {
  const mem = createMemory({ dbPath })
  mem.codeOrigin = normalizeOrigin(codeOrigin)
  if (embedder) {
    mem.embedder = { model }
    const put = mem.db.prepare(`INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value`)
    put.run("embedding_model", model) // 记忆检索面同键（免无关降级行）
    put.run("doc_embedding_model", storedModel)
  }
  return mem
}
/** SQL spy（先例 `docs/batches/2026-10-02-public-repo-read.test.mjs:95-105` 形——本档附参数采集）：
 *  捕获每次 prepare 后 all/get/run 的 (SQL, args)（sink 逐条 {sql, args}）。 */
const spyDb = (memory, sink) => {
  const real = memory.db
  memory.db = new Proxy(real, {
    get(t, k) {
      if (k === "prepare") {
        return (sql, ...rest) => {
          const st = t.prepare(sql, ...rest)
          return new Proxy(st, {
            get(s, k2) {
              const v = Reflect.get(s, k2)
              if (typeof v !== "function") return v
              if (k2 === "all" || k2 === "get" || k2 === "run") return (...args) => { sink.push({ sql, args }); return v.apply(s, args) }
              return v.bind(s)
            },
          })
        }
      }
      const v = Reflect.get(t, k)
      return typeof v === "function" ? v.bind(t) : v
    },
  })
  return real
}
const drive = async (cwd, memory, input = QUERY) => {
  const agent = { cwd, history: [], _pendingReminders: [], config: {}, tools: [], memory }
  await prepareRun(agent, input, {}, { depth: 0 })
  return agent
}
const DOC_PREFIX = "[Relevant documentation"
const blockFrom = (agent) => agent.history.map((m) => m.content).find((c) => typeof c === "string" && c.startsWith(DOC_PREFIX)) ?? null
/** 块体行（去首行头 ∥ 去尾 `]`）。 */
const blockLines = (block) => block.slice(block.indexOf(":\n") + 2, -1).split("\n")
const linePath = (line) => line.replace(/^- /, "").split(" > ")[0]
const pathsOf = (rows) => rows.map((r) => r.path)
const setOf = (arr) => [...new Set(arr)].sort()
const ftsCalls = (calls) => calls.filter((c) => c.sql.includes("doc_chunks_fts MATCH"))
const vecCalls = (calls) => calls.filter((c) => c.sql.includes("embedding IS NOT NULL") && c.sql.includes("doc_chunks"))

/* ── T1：无声明源 golden（F-DI2 / N1 / N2）──────────────────────────────────── */

test("T1 无声明源 golden：单调用路径逐字节保留（两夹具变体等值）+ 恰一条 FTS 查询", async () => {
  try {
    const base = sandbox("t1")
    const golden = [
      "[Relevant documentation (6 chunks indexed total — call doc_search if you need more):",
      ...["a", "b", "c", "d", "e"].map((n, i) => `- docs/${n}.md > docs/${n}.md: <untrusted_doc_chunk>${escapeXml(bodyOf(5 - i))}</untrusted_doc_chunk>`),
    ].join("\n") + "]"
    const files = { "docs/a.md": bodyOf(5), "docs/b.md": bodyOf(4), "docs/c.md": bodyOf(3), "docs/d.md": bodyOf(2), "docs/e.md": bodyOf(1), "docs/f.md": bodyOf(0) }

    // 变体 A：manifest 在盘 + index.publicRepos 缺省 []
    const projA = join(base, "proj-a")
    writeManifestFile(projA, { index: { publicRepos: [] } })
    const memA = newMemory(join(base, "a.db"), projA)
    putDocs(memA, normalizeOrigin(projA), files)
    const sinkA = []
    spyDb(memA, sinkA)
    const agentA = await drive(projA, memA)
    const blockA = blockFrom(agentA)
    assert.equal(blockA, golden, "无声明源 ⇒ 注入块逐字节 = golden（单调用路径）")
    assert.equal(searchOrigins(memA).length, 1, "origin 集 = 1（无声明源）")
    const ftsA = ftsCalls(sinkA)
    assert.equal(ftsA.length, 1, "单调用路径 ⇒ 恰一条 FTS 查询（非两腿）")
    assert.ok(ftsA[0].sql.includes("AND d.origin = ?"), `单 origin 等值形：${ftsA[0].sql}`)
    assert.ok(!ftsA[0].sql.includes("IN ("), "非多 origin 形")
    assert.equal(vecCalls(sinkA).filter((c) => c.sql.includes("AND origin = ?")).length, 1, "向量腿同单 origin 等值形")

    // 变体 B：无 manifest（缺档 ⇒ 缺省声明——同分支）
    const projB = join(base, "proj-b")
    mkdirSync(projB, { recursive: true })
    const memB = newMemory(join(base, "b.db"), projB)
    putDocs(memB, normalizeOrigin(projB), files)
    const agentB = await drive(projB, memB)
    assert.equal(blockFrom(agentB), golden, "无 manifest 变体亦逐字节等值（零声明源两形同路）")

    // 变体 C：preview 上界（F-DI3——300 字元口径不变）
    const projC = join(base, "proj-c")
    writeManifestFile(projC, { index: { publicRepos: [] } })
    const memC = newMemory(join(base, "c.db"), projC)
    const longBody = "needle " + "x".repeat(420) // 无 XML 特字 ⇒ escapeXml 恒等（上界直接可测）
    putDocs(memC, normalizeOrigin(projC), { "docs/long.md": longBody })
    const lineC = blockLines(blockFrom(await drive(projC, memC)))[0]
    const preview = /<untrusted_doc_chunk>([\s\S]*)<\/untrusted_doc_chunk>/.exec(lineC)[1]
    assert.equal(preview, longBody.slice(0, 300), "preview = 正文前 300 字元（口径不变）")
    assert.equal(preview.length, 300, "preview ≤300 字元（上界断言）")
  } finally { cleanup() }
})

/* ── T2：`docSearch` origins 三态格（R1-1 契约）────────────────────────────── */

test("T2 origins 三态格：缺省 = searchOrigins ∥ 单元素 = 限定 ∥ 空数组 = 不过滤（+ 多元素 IN 形）", async () => {
  try {
    const base = sandbox("t2")
    const proj = join(base, "proj"), decl = join(base, "docs-repo"), other = join(base, "other")
    writeManifestFile(proj, { index: { publicRepos: ["../docs-repo"] } })
    mkdirSync(decl, { recursive: true })
    mkdirSync(other, { recursive: true })
    const oProj = normalizeOrigin(proj), oDecl = normalizeOrigin(decl), oOther = normalizeOrigin(other)
    const mem = newMemory(join(base, "m.db"), proj)
    putDocs(mem, oProj, { "loc/a1.md": bodyOf(2), "loc/a2.md": bodyOf(1) })
    putDocs(mem, oDecl, { "pub/b1.md": bodyOf(2), "pub/b2.md": bodyOf(1) })
    putDocs(mem, oOther, { "mix/c1.md": bodyOf(2) })
    assert.deepEqual(setOf(searchOrigins(mem)), setOf([oProj, oDecl]), "声明集 = 项目 ∪ 声明（C 不在）")

    const sink = []
    spyDb(mem, sink)
    // ① 缺省（无 origins 参）= searchOrigins（A+B；C 不出）
    const r1 = await docSearch(mem, QUERY, { limit: 10 })
    assert.deepEqual(setOf(pathsOf(r1)), setOf(["loc/a1.md", "loc/a2.md", "pub/b1.md", "pub/b2.md"]), "缺省 = 项目 ∪ 声明（C 排除）")
    assert.ok(ftsCalls(sink).at(-1).sql.includes("AND d.origin IN (?, ?)"), "缺省多 origin ⇒ IN 形")
    // ② 单元素 = 限定
    const r2 = await docSearch(mem, QUERY, { limit: 10, origins: [oDecl] })
    assert.deepEqual(setOf(pathsOf(r2)), setOf(["pub/b1.md", "pub/b2.md"]), "origins:[B] ⇒ 只出 B 行")
    const c2 = ftsCalls(sink).at(-1)
    assert.ok(c2.sql.includes("AND d.origin = ?") && !c2.sql.includes("IN ("), `单元素 ⇒ 等值形：${c2.sql}`)
    assert.deepEqual(c2.args.slice(1, -1), [oDecl], "谓词参数 = 给定单 origin")
    // ③ 空数组 = 不过滤
    const r3 = await docSearch(mem, QUERY, { limit: 10, origins: [] })
    assert.deepEqual(setOf(pathsOf(r3)), setOf(["loc/a1.md", "loc/a2.md", "pub/b1.md", "pub/b2.md", "mix/c1.md"]), "空数组 ⇒ 不过滤（C 亦出）")
    const c3 = ftsCalls(sink).at(-1)
    assert.ok(!c3.sql.includes("d.origin"), `空数组 ⇒ FTS 无 origin 谓词：${c3.sql}`)
    assert.equal(c3.args.length, 2, "FTS 参数 = [查询, limit]（零 origin 绑定）")
    const v3 = vecCalls(sink).at(-1)
    assert.ok(!v3.sql.includes("AND origin = ?"), `空数组 ⇒ 向量扫描无 origin 谓词：${v3.sql}`)
    // ④ 多元素 = IN 形（限定 A+B）
    const r4 = await docSearch(mem, QUERY, { limit: 10, origins: [oProj, oDecl] })
    assert.deepEqual(setOf(pathsOf(r4)), setOf(["loc/a1.md", "loc/a2.md", "pub/b1.md", "pub/b2.md"]), "origins:[A,B] ⇒ A+B 限定")
    const c4 = ftsCalls(sink).at(-1)
    assert.ok(c4.sql.includes("AND d.origin IN (?, ?)"), `多元素 ⇒ IN 形：${c4.sql}`)
    assert.deepEqual(setOf(c4.args.slice(1, 3)), setOf([oProj, oDecl]), "谓词参数 = 给定集")
  } finally { cleanup() }
})

/* ── T3：配额构成（F-DI1 / N1 / N3）───────────────────────────────────────── */

test("T3 配额构成：本仓 5 零减 + 声明 5 补位（恰 10 行）+ 计数行 = 全 origin 集 + 全局单调用负对照", async () => {
  try {
    const base = sandbox("t3")
    const proj = join(base, "proj"), decl = join(base, "docs-repo")
    writeManifestFile(proj, { index: { publicRepos: ["../docs-repo"] } })
    mkdirSync(decl, { recursive: true })
    const oProj = normalizeOrigin(proj), oDecl = normalizeOrigin(decl)
    const mem = newMemory(join(base, "m.db"), proj)
    const localFiles = Object.fromEntries(Array.from({ length: 5 }, (_, i) => [`loc/p${i + 1}.md`, bodyOf(1)]))
    const declFiles = Object.fromEntries(Array.from({ length: 8 }, (_, i) => [`pub/d${i + 1}.md`, bodyOf(5)]))
    putDocs(mem, oProj, localFiles)
    putDocs(mem, oDecl, declFiles)

    const sink = []
    spyDb(mem, sink)
    const agent = await drive(proj, mem)
    const driveCalls = sink.splice(0) // 只取注入窗口（期望调用在窗口外）
    const block = blockFrom(agent)
    assert.ok(block, "声明源会话仍出块")
    const lines = blockLines(block)
    assert.equal(lines.length, 10, "块 = 10 行（本仓 ≤5 + 声明 ≤5）")
    const linePaths = lines.map(linePath)
    assert.equal(new Set(linePaths).size, linePaths.length, "路径零重复（两腿 origin 集互斥）")

    // 两腿各取直接调用作期望（同库同夹具 ⇒ 确定性等值）
    const expLocal = pathsOf(await docSearch(mem, QUERY, { limit: 5, origins: [oProj] }))
    const expDecl = pathsOf(await docSearch(mem, QUERY, { limit: 5, origins: [oDecl] }))
    assert.deepEqual(linePaths.slice(0, 5), expLocal, "前 5 = 本仓腿独立 top-5（本仓零减）")
    assert.deepEqual(linePaths.slice(5), expDecl, "后 5 = 声明腿补位")
    assert.ok(linePaths.slice(0, 5).every((p) => p.startsWith("loc/")), "本仓项在前")
    assert.ok(block.includes("(13 chunks indexed total — call doc_search if you need more)"), "计数行 = 全 origin 集 13（5+8）")

    assert.equal(ftsCalls(driveCalls).length, 2, "两腿 = 恰两条 FTS 查询")
    const legParams = ftsCalls(driveCalls).map((c) => c.args.slice(1, -1).join("|"))
    assert.deepEqual(setOf(legParams), setOf([oProj, oDecl]), "两腿各限其 origin 集（每腿单 origin）")

    // 负对照：单调用全局 top-5（= 改前形）不含全部本仓 5 枚（池全被声明侧占据——病灶本体）
    const global = pathsOf(await docSearch(mem, QUERY, { limit: 5 }))
    const localKept = expLocal.filter((p) => global.includes(p)).length
    assert.ok(localKept < 5, `全局 top-5 丢本仓项（保有 ${localKept}/5）——腿分取正是修复面`)
  } finally { cleanup() }
})

/* ── T4：声明零命中（F-DI1 补集 / N1）─────────────────────────────────────── */

test("T4 声明零命中：本仓照常占据 ∥ 声明零补位（无空行/无占位符）∥ 两侧腿照跑", async () => {
  try {
    const base = sandbox("t4")
    const proj = join(base, "proj"), decl = join(base, "docs-repo")
    writeManifestFile(proj, { index: { publicRepos: ["../docs-repo"] } })
    mkdirSync(decl, { recursive: true })
    const oProj = normalizeOrigin(proj), oDecl = normalizeOrigin(decl)
    const mem = newMemory(join(base, "m.db"), proj, { embedder: false }) // FTS-only 夹具：零命中即零行（矢量分不混入）
    putDocs(mem, oProj, { "loc/p1.md": bodyOf(2), "loc/p2.md": bodyOf(1) })
    putDocs(mem, oDecl, { "pub/d1.md": bodyOf(0), "pub/d2.md": bodyOf(0), "pub/d3.md": bodyOf(0) })

    const sink = []
    spyDb(mem, sink)
    const agent = await drive(proj, mem)
    const driveCalls = sink.splice(0)
    const block = blockFrom(agent)
    assert.ok(block, "本仓有命中 ⇒ 照常出块")
    const lines = blockLines(block)
    assert.equal(lines.length, 2, "声明侧零命中 ⇒ 零补位（无空行 ∥ 无占位符）")
    assert.ok(lines.every((l) => l.startsWith("- ")), "每行皆文档项（零空行 ∥ 零占位符）")
    assert.deepEqual(setOf(lines.map(linePath)), setOf(["loc/p1.md", "loc/p2.md"]), "块 = 仅本仓项")
    assert.ok(!block.includes("pub/"), "零命中声明源不出行")
    assert.ok(block.includes("(5 chunks indexed total — call doc_search if you need more)"), "计数行 = 全 origin 集 5（2+3）")
    assert.equal(ftsCalls(driveCalls).length, 2, "声明腿照跑（零命中不塌）——两腿各一条")
    const legParams = ftsCalls(driveCalls).flatMap((c) => c.args.slice(1, -1))
    assert.deepEqual(setOf(legParams), setOf([oProj, oDecl]), "两腿各以其 origin 集为参数")
  } finally { cleanup() }
})

/* ── T5：上限 ≤10（F-DI1 / N3）────────────────────────────────────────────── */

test("T5 上限 ≤10：两声明仓同一腿（IN 形）∥ 块恰 10 行 ∥ 路径零重复", async () => {
  try {
    const base = sandbox("t5")
    const proj = join(base, "proj"), repoA = join(base, "docs-repo-a"), repoB = join(base, "docs-repo-b")
    writeManifestFile(proj, { index: { publicRepos: ["../docs-repo-a", "../docs-repo-b"] } })
    mkdirSync(repoA, { recursive: true })
    mkdirSync(repoB, { recursive: true })
    const oProj = normalizeOrigin(proj), oA = normalizeOrigin(repoA), oB = normalizeOrigin(repoB)
    const mem = newMemory(join(base, "m.db"), proj)
    putDocs(mem, oProj, Object.fromEntries(Array.from({ length: 6 }, (_, i) => [`loc/p${i + 1}.md`, bodyOf(1)])))
    putDocs(mem, oA, Object.fromEntries(Array.from({ length: 4 }, (_, i) => [`pa/d${i + 1}.md`, bodyOf(5)])))
    putDocs(mem, oB, Object.fromEntries(Array.from({ length: 4 }, (_, i) => [`pb/d${i + 1}.md`, bodyOf(5)])))

    const sink = []
    spyDb(mem, sink)
    const agent = await drive(proj, mem)
    const driveCalls = sink.splice(0)
    const block = blockFrom(agent)
    const lines = blockLines(block)
    assert.ok(lines.length <= 10, `总块数 ≤10（实读 ${lines.length}）`)
    assert.equal(lines.length, 10, "两腿皆饱和 = 10")
    const linePaths = lines.map(linePath)
    assert.equal(new Set(linePaths).size, linePaths.length, "路径零重复（两腿 origin 集互斥）")
    const expLocal = pathsOf(await docSearch(mem, QUERY, { limit: 5, origins: [oProj] }))
    const expDecl = pathsOf(await docSearch(mem, QUERY, { limit: 5, origins: [oA, oB] }))
    assert.deepEqual(linePaths.slice(0, 5), expLocal, "前 5 = 本仓腿")
    assert.deepEqual(linePaths.slice(5), expDecl, "后 5 = 声明腿（两仓同集单次调用）")

    const fts = ftsCalls(driveCalls)
    assert.equal(fts.length, 2, "两腿 = 恰两条（声明侧两仓单次 IN 调用，非逐仓两腿）")
    const inCall = fts.find((c) => c.sql.includes("IN (?, ?)"))
    const eqCall = fts.find((c) => c.sql.includes("= ?") && !c.sql.includes("IN ("))
    assert.ok(inCall && eqCall, "一腿等值（本仓）∥ 一腿 IN（声明集）")
    assert.deepEqual(setOf(inCall.args.slice(1, 3)), setOf([oA, oB]), "声明腿参数 = 两声明仓（同集）")
    assert.deepEqual(eqCall.args.slice(1, -1), [oProj], "本仓腿参数 = 项目 origin")
  } finally { cleanup() }
})

/* ── T6：降级腿（N2）──────────────────────────────────────────────────────── */

test("T6 降级（embed 失配）：每腿 FTS-only 仍出块 + 降级一行可见 + 零向量扫描", async () => {
  try {
    const base = sandbox("t6")
    const proj = join(base, "proj"), decl = join(base, "docs-repo")
    writeManifestFile(proj, { index: { publicRepos: ["../docs-repo"] } })
    mkdirSync(decl, { recursive: true })
    const oProj = normalizeOrigin(proj), oDecl = normalizeOrigin(decl)
    const mem = newMemory(join(base, "m.db"), proj, { model: "stub-model", storedModel: "other-model" }) // 失配
    putDocs(mem, oProj, { "loc/p1.md": bodyOf(2), "loc/p2.md": bodyOf(1), "loc/p3.md": bodyOf(1) })
    putDocs(mem, oDecl, { "pub/d1.md": bodyOf(2), "pub/d2.md": bodyOf(1) })

    const warns = []
    const origWarn = console.warn
    const sink = []
    spyDb(mem, sink)
    console.warn = (...a) => { warns.push(a.map(String).join(" ")) }
    let agent
    try {
      agent = await drive(proj, mem)
    } finally {
      console.warn = origWarn
    }
    const block = blockFrom(agent)
    assert.ok(block, "失配降级 ⇒ 每腿 FTS-only 仍出块")
    const driveCalls = sink.splice(0)
    assert.equal(vecCalls(driveCalls).length, 0, "两腿皆未进向量通道（零向量扫描查询）")
    assert.ok(warns.some((w) => w.includes("vector channel degraded to FTS-only")), "降级一行可见")
    const expLocal = pathsOf(await docSearch(mem, QUERY, { limit: 5, origins: [oProj] }))
    const expDecl = pathsOf(await docSearch(mem, QUERY, { limit: 5, origins: [oDecl] }))
    assert.deepEqual(blockLines(block).map(linePath), [...expLocal, ...expDecl], "块 = 逐腿 FTS 结果（本仓在前）")
    assert.ok(blockLines(block).some((l) => linePath(l).startsWith("pub/")), "声明腿亦出块")
  } finally { cleanup() }
})
