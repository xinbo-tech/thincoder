/**
 * 2026-10-02-public-repo-read.test.mjs — 公共仓读取批（台账 #832）批次本地件。
 * 名随批次档 · 住批次目录 · **不进仓套件**；复跑（任意 cwd 可跑——仓根经 import.meta.url 定位）：
 *   node --test docs/batches/2026-10-02-public-repo-read.test.mjs
 *
 * 五组腿（批档 §2.7——回指 §2.4 验收列）：
 *   ① 声明投影（L-6.15-1）= 值形层归一 ∥ 非数组 fail-closed ∥ 缺键补默认 ∥ 解析层绝对根集
 *   ② 同步展开（L-6.15-2）= 两 origin 各有行 ∥ 公共仓单文件增量 ∥ 不递归第三仓 ∥ 缺位整根跳过 + logEvent
 *   ③ 读面集（L-6.15-3）= 三 origin 命中集（含声明 ∥ 不含未声明）∥ 单 origin 快径 SQL 形
 *       ∥ 计划腿（多 origin ⇒ 逐 origin 分趟——趟数 / 单 origin 等值谓词 / 2 元组游标 / 计划读数 / 并列定序）
 *   ④ 引用三态（L-6.15-4）= 核绿 ∥ 未核列报（不入闸——exit 0）∥ 悬空红；
 *      **面界注**：本腿依赖 scripts/doc-check-anchors 的声明源候选（⑥）∥ doc-check.mjs 报告字段（父侧面，
 *      与本批并行落地）——该面未落地时本腿红**如实**（两侧并齐后复跑转绿）。
 *   ⑤ 写门 T46 = 声明源前缀形通过 ∥ 未声明照旧拒 ∥ 声明根缺位拒 ∥ 仓内档零松
 *
 * 数据面纪律：只用夹具 ∕ 沙箱（tmpdir）——真库（~/.thincoder/）零触碰；embedding 经模块钩子短接
 * 到确定性桩（零网络；并列分数 = PK 定序判别面）。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { registerHooks } from "node:module"
import { execFileSync } from "node:child_process"
import { chmodSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, utimesSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const ROOT = fileURLToPath(new URL("../../", import.meta.url)) // 仓根（thincoder/）
const coreUrl = (rel) => pathToFileURL(join(ROOT, "thincoder-core", rel)).href
const scriptUrl = (rel) => pathToFileURL(join(ROOT, "scripts", rel)).href

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
const declarationMod = await import(coreUrl("declaration.mjs"))
const manifestMod = await import(coreUrl("manifest.mjs"))
const codeSyncMod = await import(coreUrl("memory/code-sync.mjs"))
const codeSearchMod = await import(coreUrl("memory/code-search.mjs"))
const docsMod = await import(coreUrl("memory/docs.mjs"))
const ledgerDb = await import(coreUrl("ledger-db.mjs"))
const ledgerCmd = await import(coreUrl("ledger-cmd.mjs"))
const logMod = await import(coreUrl("log.mjs"))
const anchorsMod = await import(scriptUrl("doc-check-anchors.mjs"))
const reportMod = await import(scriptUrl("doc-check.mjs"))

const { createMemory } = schemaMod
const { normalizeOrigin } = originMod

// ─── 夹具工具 ────────────────────────────────────────────────────────────────
const created = []
const sandbox = (tag) => { const d = mkdtempSync(join(tmpdir(), `prr-${tag}-`)); created.push(d); return d }
/** Windows 清理：git 对象档只读 ⇒ 先清只读位再删（顽留 ⇒ 留 OS tmp，不影响断言）。 */
const cleanup = () => {
  for (const d of created.splice(0)) {
    const clearRO = (p) => {
      let st
      try { st = statSync(p) } catch { return }
      if (st.isDirectory()) for (const n of readdirSync(p)) clearRO(join(p, n))
      try { chmodSync(p, 0o666) } catch { /* 忽略 */ }
    }
    try { clearRO(d); rmSync(d, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 }) } catch { /* 留 tmp */ }
  }
}
const mkFile = (dir, rel, text) => {
  const p = join(dir, ...rel.split("/"))
  mkdirSync(dirname(p), { recursive: true })
  writeFileSync(p, text)
  return p
}
const writeManifest = (dir, obj) => {
  writeFileSync(join(dir, "PROJECT-MANIFEST.json"), JSON.stringify(obj, null, 2))
  conventions.clearDeclarationCache() // 声明缓存按数据档路径——夹具改写后必须清（测试缝）
}
const git = (cwd, args) => execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim()
/** 只读 spy：捕获 `db.prepare` 收到的 SQL（返回真实 db 供 EXPLAIN 用）。 */
const spyDb = (memory, sink) => {
  const real = memory.db
  memory.db = new Proxy(real, {
    get(t, k) {
      if (k === "prepare") return (sql, ...rest) => { sink.push(sql); return t.prepare(sql, ...rest) }
      const v = Reflect.get(t, k)
      return typeof v === "function" ? v.bind(t) : v
    },
  })
  return real
}
const insCode = (db, origin, path, text) => {
  db.prepare(`INSERT INTO code_chunks (origin, path, language, chunk_type, symbol_name, content, line_start, line_end, mtime_ms, embedding, seg_content) VALUES (?, ?, 'javascript', 'file', '', ?, 1, 1, 1, NULL, '')`).run(origin, path, text)
}
const rowids = (db, origin, path) => db.prepare(`SELECT rowid FROM code_chunks WHERE origin = ? AND path = ? ORDER BY rowid`).all(origin, path).map((r) => r.rowid)
const out = (label, value) => console.log(`[读数] ${label}: ${value}`)

/* ── ① 声明投影（L-6.15-1）：值形归一 ∥ fail-closed ∥ 缺键默认 ∥ 解析层根集 ───────── */

test("① 声明投影（L-6.15-1）：值形归一 + 非数组 fail-closed + 缺键补默认 + 解析层绝对根集", () => {
  try {
    // 值形层：夹具 ["./../docs-repo/", "../mods/", "", 7] ⇒ ["../docs-repo","../mods"]
    const dir = sandbox("decl")
    writeManifest(dir, { index: { publicRepos: ["./../docs-repo/", "../mods/", "", 7] } })
    const decl = conventions.loadProjectDeclaration(dir)
    assert.deepEqual([...decl.index.publicRepos], ["../docs-repo", "../mods"], "归一 = ./ 剥离 ∥ 去尾斜杠 ∥ 空/非串剔除 ∥ 去重保序")
    assert.equal(decl.declared, true, "声明位非空 ⇒ declared（值比较——index 族偏离缺省）")
    assert.deepEqual([...conventions.DEFAULT_DECLARATION.index.publicRepos], [], "缺省 []（零行为）")
    assert.equal(conventions.declaredPublicRoots, declarationMod.declaredPublicRoots, "conventions 转口 = 同引用（单点非第二实现）")
    // 解析层：值形层逐项 resolve(decl.root, p) ⇒ 绝对根集（去重保序）
    assert.deepEqual(conventions.declaredPublicRoots(dir), [resolve(dir, "../docs-repo"), resolve(dir, "../mods")], "解析层 = 绝对根集")
    // 缺键档：ok + 补默认 + missingKeys 含 index.publicRepos（AC-37）
    const keyless = sandbox("decl-keyless")
    writeManifest(keyless, { index: { excludePaths: [] } })
    const rm = manifestMod.readManifest(keyless)
    assert.equal(rm.ok, true, "缺键非拒")
    assert.deepEqual([...rm.manifest.index.publicRepos], [], "缺键 ⇒ 补默认 []")
    assert.ok(rm.missingKeys.includes("index.publicRepos"), "missingKeys 含 index.publicRepos")
    // 非数组 ⇒ 档非法（fail-closed——同 index.excludePaths 款）
    const bad = sandbox("decl-bad")
    writeManifest(bad, { index: { publicRepos: "docs-repo" } })
    const rb = manifestMod.readManifest(bad)
    assert.equal(rb.ok, false, "非数组 ⇒ 档非法")
    assert.ok(rb.errors.some((e) => e.includes("index.publicRepos")), "errors 点名 index.publicRepos")
    conventions.clearDeclarationCache()
    assert.deepEqual([...conventions.loadProjectDeclaration(bad).index.publicRepos], [], "档非法 ⇒ 回默认（投影不产出）")
    // 去重保序（异形同项 ⇒ 单项）
    const dup = sandbox("decl-dup")
    writeManifest(dup, { index: { publicRepos: ["a", "./a/", "b", "a"] } })
    assert.deepEqual([...conventions.loadProjectDeclaration(dup).index.publicRepos], ["a", "b"], "去重保序")
    // 无声明目录 ⇒ 根集空（零行为）
    assert.deepEqual(conventions.declaredPublicRoots(sandbox("decl-none")), [], "无声明 ⇒ 零根集")
    out("①", "值形 [../docs-repo, ../mods] ✓ · fail-closed ✓ · 缺键默认 ✓ · 解析层绝对根集 ✓")
  } finally { cleanup() }
})

/* ── ② 同步展开（L-6.15-2）：两 origin 各行 ∥ 增量 ∥ 不递归 ∥ 缺位整根跳过 ──────── */

test("② 同步展开（L-6.15-2）：两 origin 各有行 ∥ 公共仓单文件增量 ∥ 不递归第三仓 ∥ 缺位整根跳过 + logEvent", async () => {
  try {
    const base = sandbox("sync")
    const app = join(base, "app"), pub = join(base, "docs-repo"), third = join(base, "third-repo")
    mkFile(app, "src/a.mjs", "export const a = 1 // alphatoken\n")
    mkFile(app, "docs/d.md", "# d\n\nalphadoc\n")
    mkFile(pub, "lib/p.mjs", "export const p = 2 // betatoken\n")
    mkFile(pub, "lib/q.mjs", "export const q = 3 // quiettoken\n")
    mkFile(pub, "notes/n.md", "# n\n\ngammadoc\n")
    mkFile(third, "t.mjs", "export const t = 4 // omegatoken\n")
    writeManifest(app, { index: { publicRepos: ["../docs-repo"] } })
    writeManifest(pub, { index: { publicRepos: ["../third-repo"] } }) // 公共仓自身声明第三仓（不递归判别面）
    const mem = createMemory({ dbPath: ":memory:" })
    const oApp = normalizeOrigin(app), oPub = normalizeOrigin(pub), oThird = normalizeOrigin(third)
    await codeSyncMod.codeSync(mem, app)
    await docsMod.docSync(mem, app)
    const codeOrigins = new Set(mem.db.prepare(`SELECT DISTINCT origin FROM code_chunks`).all().map((r) => r.origin))
    assert.ok(codeOrigins.has(oApp) && codeOrigins.has(oPub), "两 origin 各有 code 行")
    const docOrigins = new Set(mem.db.prepare(`SELECT DISTINCT origin FROM doc_chunks`).all().map((r) => r.origin))
    assert.ok(docOrigins.has(oApp) && docOrigins.has(oPub), "两 origin 各有 doc 行")
    assert.equal(mem.db.prepare(`SELECT COUNT(*) AS n FROM code_chunks WHERE origin = ?`).get(oThird).n, 0, "第三仓零行（不递归）")
    // 公共仓内单文件改动 + 复跑 ⇒ 增量只动该文件（未改动文件 rowid 稳定 = 未重写）
    const qBefore = rowids(mem.db, oPub, "lib/q.mjs")
    const aBefore = rowids(mem.db, oApp, "src/a.mjs")
    const pAbs = mkFile(pub, "lib/p.mjs", "export const p = 2 // betatoken v2\n")
    utimesSync(pAbs, new Date(), new Date(Date.now() + 3000)) // mtime 可判（同毫秒写回会落增量跳过）
    await codeSyncMod.codeSync(mem, app)
    const pAfter = mem.db.prepare(`SELECT content FROM code_chunks WHERE origin = ? AND path = ?`).all(oPub, "lib/p.mjs")
    assert.ok(pAfter.some((r) => r.content.includes("v2")), "公共仓改动文件已重索引")
    assert.deepEqual(rowids(mem.db, oPub, "lib/q.mjs"), qBefore, "公共仓未改动文件零重写")
    assert.deepEqual(rowids(mem.db, oApp, "src/a.mjs"), aBefore, "入口根未改动文件零重写")
    // 声明根缺位 ⇒ 整根跳过（零错 ∥ 存量行零变 ∥ logEvent 在场）
    const goneBase = sandbox("sync-gone")
    const app2 = join(goneBase, "app")
    mkFile(app2, "src/x.mjs", "export const x = 5\n")
    writeManifest(app2, { index: { publicRepos: ["../gone-repo"] } })
    const oGone = normalizeOrigin(join(goneBase, "gone-repo"))
    insCode(mem.db, oGone, "keep.mjs", "// kept")
    const logDir = sandbox("logs")
    logMod._setLogsDirForTest(logDir)
    try {
      const res2 = await codeSyncMod.codeSync(mem, app2)
      await docsMod.docSync(mem, app2)
      assert.equal(res2?.failed, 0, "缺位根零错（failed 0）")
      const logText = readFileSync(logMod.todayLogPath(), "utf8")
      assert.ok(logText.includes("index:root-missing") && logText.includes(oGone), "logEvent 在场（一行）")
    } finally { logMod._resetLogsDirForTest() }
    assert.equal(mem.db.prepare(`SELECT COUNT(*) AS n FROM code_chunks WHERE origin = ?`).get(oGone).n, 1, "存量行零变（不扫不删）")
    // git 径展开（三入口之一）：入口 gitSync ⇒ 声明公共仓同款覆盖（per-origin 锚）；入口非 git ⇒ null 契约保持
    const gbase = sandbox("sync-git")
    const gapp = join(gbase, "app"), gpub = join(gbase, "docs-repo")
    mkFile(gapp, "src/a.mjs", "export const a = 1 // alphatoken\n")
    mkFile(gpub, "lib/p.mjs", "export const p = 2 // betatoken\n")
    writeManifest(gapp, { index: { publicRepos: ["../docs-repo"] } })
    for (const d of [gapp, gpub]) {
      git(d, ["init", "-q"])
      git(d, ["add", "-A"])
      git(d, ["-c", "user.name=t", "-c", "user.email=t@t", "commit", "-q", "-m", "init"])
    }
    const gmem = createMemory({ dbPath: ":memory:" })
    await codeSyncMod.codeSync(gmem, gapp) // 全量 + per-origin 锚（入口 ∥ 声明仓各落）
    const oGpub = normalizeOrigin(gpub)
    mkFile(gpub, "lib/p.mjs", "export const p = 2 // betatoken v2\n")
    const gres = await codeSyncMod.gitSync(gmem, gapp)
    assert.ok(gres !== null, "入口 git 可用 ⇒ 非 null")
    assert.ok(gmem.db.prepare(`SELECT content FROM code_chunks WHERE origin = ? AND path = ?`).get(oGpub, "lib/p.mjs")?.content.includes("v2"), "gitSync 展开 ⇒ 公共仓改动随增量落库")
    assert.equal(await codeSyncMod.gitSync(gmem, sandbox("sync-git-none")), null, "入口非 git ⇒ null 契约保持")
    // 回退支（两处经跨档内胆调用）：① 声明根无锚（非 git）⇒ 全扫支；② 入口 diff >200 ⇒ 全量回退支
    const fbase = sandbox("sync-git-fall")
    const fapp = join(fbase, "app"), fplain = join(fbase, "plain-docs")
    mkFile(fapp, "src/a.mjs", "export const a = 1\n")
    mkFile(fplain, "notes/old.md", "# old\n")
    writeManifest(fapp, { index: { publicRepos: ["../plain-docs"] } })
    git(fapp, ["init", "-q"]); git(fapp, ["add", "-A"]); git(fapp, ["-c", "user.name=t", "-c", "user.email=t@t", "commit", "-q", "-m", "init"])
    const fmem = createMemory({ dbPath: ":memory:" })
    await codeSyncMod.codeSync(fmem, fapp) // 入口落锚；声明根（非 git）全量入册
    mkFile(fplain, "notes/new.md", "# new\n\nfallbackdoc\n")
    const fres = await codeSyncMod.gitSync(fmem, fapp)
    assert.ok(fres !== null, "声明根无锚 ⇒ 回退支不抛（内胆可达）")
    assert.ok(fmem.db.prepare(`SELECT content FROM doc_chunks WHERE origin = ? AND path = ?`).get(normalizeOrigin(fplain), "notes/new.md")?.content.includes("fallbackdoc"), "回退支全扫声明根（新档入册）")
    const hbase = sandbox("sync-git-heavy")
    const happ = join(hbase, "app")
    mkFile(happ, "src/a.mjs", "export const a = 1\n")
    git(happ, ["init", "-q"]); git(happ, ["add", "-A"]); git(happ, ["-c", "user.name=t", "-c", "user.email=t@t", "commit", "-q", "-m", "init"])
    const hmem = createMemory({ dbPath: ":memory:" })
    await codeSyncMod.codeSync(hmem, happ) // 锚
    for (let i = 0; i < 205; i++) mkFile(happ, `src/f${i}.mjs`, `export const f${i} = ${i}\n`)
    git(happ, ["add", "-A"]); git(happ, ["-c", "user.name=t", "-c", "user.email=t@t", "commit", "-q", "-m", "bulk"])
    const hres = await codeSyncMod.gitSync(hmem, happ)
    assert.equal(hres?.fallback, true, ">200 diff ⇒ 全量回退支（内胆可达——不抛）")
    assert.ok(hmem.db.prepare(`SELECT COUNT(*) AS n FROM code_chunks WHERE origin = ?`).get(normalizeOrigin(happ)).n > 200, "回退支全量入册")
    out("②", "两 origin 各行 ✓ · 增量只动改动文件 ✓ · 不递归 ✓ · 缺位跳过+logEvent ✓ · git 径展开 ✓ · git 回退两支 ✓")
  } finally { cleanup() }
})

/* ── ③ 读面集（L-6.15-3）：命中集 ∥ 单 origin 快径 ∥ 计划腿 ───────────────────── */

test("③ 读面集（L-6.15-3）：三 origin 命中集 ∥ 单 origin 快径 SQL 形 ∥ 计划腿（逐 origin 分趟）", async () => {
  try {
    // A. 三 origin 同库（项目 ∥ 声明 ∥ 未声明）——FTS 面命中集
    const base = sandbox("read")
    const app = join(base, "app"), pub = join(base, "docs-repo"), other = join(base, "other-repo")
    mkFile(app, "src/a.mjs", "export const a = 1 // alphatoken\n")
    mkFile(pub, "lib/p.mjs", "export const p = 2 // betatoken\n")
    mkFile(other, "lib/o.mjs", "export const o = 3 // omegatoken\n")
    mkFile(pub, "notes/n.md", "# n\n\ngammadoc\n")
    mkFile(other, "notes/o.md", "# o\n\nomegadoc\n")
    writeManifest(app, { index: { publicRepos: ["../docs-repo"] } })
    const mem = createMemory({ dbPath: ":memory:" })
    await codeSyncMod.codeSync(mem, app) // 展开 ⇒ app + docs-repo
    await codeSyncMod.codeSync(mem, other) // 未声明源（另一入口独立索引——不在声明集）
    await docsMod.docSync(mem, app)
    await docsMod.docSync(mem, other)
    const oApp = normalizeOrigin(app), oPub = normalizeOrigin(pub)
    assert.deepEqual(codeSearchMod.searchOrigins(mem), [], "无 codeOrigin ⇒ 空集（基线无过滤——零行为）")
    mem.codeOrigin = app
    const byBytes = (a, b) => Buffer.compare(Buffer.from(a, "utf8"), Buffer.from(b, "utf8"))
    assert.deepEqual(codeSearchMod.searchOrigins(mem), [oApp, oPub].sort(byBytes), "读面集 = 项目 ∪ 声明（归一 ∥ 去重 ∥ 升序——BINARY 序）")
    assert.ok((await codeSearchMod.codeSearch(mem, "betatoken", { limit: 5 })).some((r) => r.content.includes("betatoken")), "命中含声明源（code）")
    assert.equal((await codeSearchMod.codeSearch(mem, "omegatoken", { limit: 5 })).length, 0, "不含未声明源（code）")
    assert.ok((await docsMod.docSearch(mem, "gammadoc", { limit: 5 })).some((r) => r.content.includes("gammadoc")), "命中含声明源（doc）")
    assert.equal((await docsMod.docSearch(mem, "omegadoc", { limit: 5 })).length, 0, "不含未声明源（doc）")

    // B. 单 origin 快径（SQL 形逐字）+ 计划腿（多 origin 逐趟；并列定序 = PK 元组升序）
    //   目录名钉序：项目 `zw` 字母序在后、声明 `aa` 在前 ⇒ 非升序趟序会在并列分数下现形。
    const vbase = sandbox("read-vec")
    const zw = join(vbase, "zw"), aa = join(vbase, "aa")
    mkFile(zw, "n.mjs", "export const n = 1\n")
    mkFile(aa, "m.mjs", "export const m = 1\n")
    const vmem = createMemory({ dbPath: ":memory:" })
    vmem.embedder = { model: "stub-model" } // 桩（零网络）——同步尾落 meta 模型键 ⇒ 读面走矢量通道
    await codeSyncMod.codeSync(vmem, zw)
    await codeSyncMod.codeSync(vmem, aa)
    vmem.codeOrigin = zw
    const sqls1 = []
    spyDb(vmem, sqls1)
    const r1 = await codeSearchMod.codeSearch(vmem, "zzz-nohit", { limit: 5 })
    const vec1 = sqls1.filter((s) => s.includes("code_chunks") && s.includes("embedding IS NOT NULL"))
    assert.equal(vec1.length, 1, "单 origin ⇒ 单趟（快径）")
    assert.ok(vec1[0].includes("AND origin = ?") && vec1[0].includes("ORDER BY path, line_start LIMIT ?"), "快径 SQL 形 = 单 origin 等值 + 2 元组游标")
    assert.ok(sqls1.some((s) => s.includes("AND c.origin = ?")), "FTS 支 = 单 origin 等值（逐字零行为）")
    assert.deepEqual(r1.map((r) => r.path), ["n.mjs"], "单 origin 命中（项目行）")
    writeManifest(zw, { index: { publicRepos: ["../aa"] } })
    const sqls2 = []
    const realDb = spyDb(vmem, sqls2)
    const r2 = await codeSearchMod.codeSearch(vmem, "zzz-nohit", { limit: 5 })
    const vec2 = sqls2.filter((s) => s.includes("code_chunks") && s.includes("embedding IS NOT NULL"))
    assert.equal(vec2.length, 2, "多 origin ⇒ 趟数 = origin 集大小")
    for (const s of vec2) {
      assert.ok(s.includes("AND origin = ?"), "每趟单 origin 等值谓词")
      assert.ok(s.includes("ORDER BY path, line_start LIMIT ?"), "游标键 = [path,line_start]（等值前缀列不入元组）")
    }
    assert.deepEqual(r2.map((r) => r.path), ["m.mjs", "n.mjs"], "并列定序 = PK 元组升序（声明源 aa 先于项目 zw——与趟序/到达序无关）")
    const baseSql = vec2[0]
    const mid = `${baseSql.replace(/ ORDER BY .*$/, "")} AND (path, line_start) > (?, ?) ORDER BY path, line_start LIMIT ?`
    const plan = realDb.prepare(`EXPLAIN QUERY PLAN ${mid}`).all(normalizeOrigin(aa), "a", 0, 2000)
    const detail = plan.map((r) => r.detail).join("\n")
    assert.ok(/SEARCH/.test(detail), `计划含 SEARCH 行（索引面）：${detail}`)
    assert.ok(!/TEMP B-TREE/i.test(detail), `无 USE TEMP B-TREE FOR ORDER BY：${detail}`)
    out("③", `声明源命中 ✓ · 未声明不命中 ✓ · 快径 1 趟 ✓ · 多 origin 2 趟 ✓ · 计划 ${detail.split("\n")[0].trim()}`)
  } finally { cleanup() }
})

/* ── ④ 引用三态（L-6.15-4）：核绿 ∥ 未核列报（不入闸）∥ 悬空红 ─────────────────── */

test("④ 引用三态（L-6.15-4）：声明源在场可核 ∥ 缺位未核列报（不入闸）∥ 未声明悬空红", () => {
  try {
    const base = sandbox("refs")
    const biz = join(base, "biz"), docsRepo = join(base, "docs-repo")
    mkFile(biz, "docs/refs.md", [
      "# 跨仓引用夹具",
      "",
      "引用 A：声明源在场（docs-repo/x.md）。",
      "引用 B：声明源缺位（gone-repo/y.md）。",
      "引用 C：未声明仓（other-repo/z.md）。",
      "",
    ].join("\n"))
    mkFile(docsRepo, "x.md", "# x\n")
    writeManifest(biz, {
      checkConfig: { scanDirs: ["docs"], anchors: { domain: "docs" } },
      index: { publicRepos: ["../docs-repo", "../gone-repo"] },
    })
    const r = anchorsMod.scanDocAnchors(biz, { gate: true })
    const report = reportMod.formatReport(r).join("\n")
    const gating = report.split("\n").filter((l) => l.startsWith("✗") && l.includes("路径/坐标"))
    assert.equal(r.danglingTotal, 1, "悬空 = 1（仅未声明前缀——未核不入闸、在场可核不计）")
    assert.equal(gating.length, 1, "入闸行 = 1")
    assert.ok(gating[0].includes("other-repo/z.md"), "未声明前缀 ⇒ 悬空红")
    assert.ok(!/✗[^\n]*docs-repo\/x\.md/.test(report), "声明源在场 ∧ 目标档在 ⇒ 可解析（核绿）")
    assert.ok(!/✗[^\n]*gone-repo\/y\.md/.test(report), "声明源缺位 ⇒ 不入闸（非悬空）")
    assert.ok(report.includes("未核") && report.includes("声明源缺位"), "缺位声明源 ⇒ 未核列报 + 汇总字段")
    // 未核不入闸：仅含「在场可核 + 缺位未核」两引用的域 ⇒ exit 0
    const biz2 = join(base, "biz2")
    mkFile(biz2, "docs/refs.md", "# 夹具\n\n引用 A：docs-repo/x.md。\n引用 B：gone-repo/y.md。\n")
    writeManifest(biz2, {
      checkConfig: { scanDirs: ["docs"], anchors: { domain: "docs" } },
      index: { publicRepos: ["../docs-repo", "../gone-repo"] },
    })
    assert.equal(reportMod.main(["--root", biz2], { log: () => {} }), 0, "未核列报不入闸（exit 0）")
    out("④", "核绿 ✓ · 未核列报（不入闸）✓ · 悬空红 ✓")
  } finally { cleanup() }
})

/* ── ⑤ 写门 T46：声明源前缀形通过 ∥ 未声明拒 ∥ 声明根缺位拒 ∥ 仓内档零松 ─────────── */

test("⑤ 写门 T46：声明源前缀形 task_book 可核通过 ∥ 未声明照旧拒 ∥ 声明根缺位拒", () => {
  const base = sandbox("ledger")
  ledgerDb._setLedgerDirForTest(join(base, "ledger-db"))
  try {
    const proj = join(base, "proj"), docsRepo = join(base, "docs-repo")
    mkFile(proj, "docs/b.md", "# b\n")
    mkFile(docsRepo, "x.md", "# x\n")
    writeManifest(proj, { index: { publicRepos: ["../docs-repo", "../gone-repo"] } })
    const toInFlight = (id, taskBook) => {
      ledgerCmd.ledgerUpdate({ cwd: proj, id, patch: { status: "待设计" } })
      return ledgerCmd.ledgerUpdate({ cwd: proj, id, patch: { status: "在途", task_book: taskBook } })
    }
    const rowStatus = (id) => {
      const row = ledgerCmd.ledgerQuery({ cwd: proj }).find((r) => r.id === id)
      return row?.status
    }
    // ① 声明源在场 ∧ 目标档在 ⇒ 通过
    const id1 = ledgerCmd.ledgerAdd({ cwd: proj, row: { kind: "tech_todo", title: "t1" } })
    assert.deepEqual(toInFlight(id1, "docs-repo/x.md§2"), { id: id1 }, "声明源前缀形可核 ⇒ 通过")
    // ② 未声明前缀 ⇒ 照旧拒（行不变）
    const id2 = ledgerCmd.ledgerAdd({ cwd: proj, row: { kind: "tech_todo", title: "t2" } })
    assert.throws(() => toInFlight(id2, "other-repo/z.md§1"), /task_book 指向的档不存在/, "未声明前缀照旧拒")
    assert.equal(rowStatus(id2), "待设计", "拒 ⇒ 行不变")
    // ③ 声明根缺位 ⇒ 拒（存在性要求——严）
    const id3 = ledgerCmd.ledgerAdd({ cwd: proj, row: { kind: "tech_todo", title: "t3" } })
    assert.throws(() => toInFlight(id3, "gone-repo/y.md§1"), /task_book 指向的档不存在/, "声明根缺位 ⇒ 拒")
    // ④ 仓内档零松（既有可核面照常）
    const id4 = ledgerCmd.ledgerAdd({ cwd: proj, row: { kind: "tech_todo", title: "t4" } })
    assert.deepEqual(toInFlight(id4, "docs/b.md§3"), { id: id4 }, "仓内档照常通过（零松）")
    out("⑤", "声明源前缀通过 ✓ · 未声明拒 ✓ · 缺位拒 ✓ · 仓内零松 ✓")
  } finally {
    ledgerDb._resetLedgerDirForTest()
    cleanup()
  }
})
