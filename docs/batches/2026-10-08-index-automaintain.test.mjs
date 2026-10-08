/**
 * 2026-10-08-index-automaintain.test.mjs — 索引自维护批批内件（批档 §2.5 验收对照逐行 ·
 * 设计档 §6.14 面⑤ · 台账 #1096）。名随批次档 · 住批次目录 · 不进仓套件。
 *
 * 腿（判定句 → 机检形）：
 *   L-⑥-1 F-S10 鬼行 GC：三 origin 夹具（A 树亡 ∥ B 树活且独档被删 ∥ C 树活全档在盘）——
 *          ① 干跑 = 计划含 A 全档 + B 死档 ∧ 零写（行 ∥ 字节 ∥ 无备份）；② confirm ⇒ A ∥ B 死档归零 ∧
 *          C 逐键等前值 ∧ 备份在册（integrity ok）∧ 报告含干跑先行读数；③ 探针错（probeFn ⇒ unknown）该档保留。
 *   L-⑥-2 F-S11 压实：阈值注入 + 沙箱库造 freelist——① 双式全越 ⇒ 执行（注入计数 vacuumFn = 1）∧
 *          freelist 后 < 前；② 单越一式（两向）⇒ 跳过 + 理由；③ 全未越（真常量）⇒ 零执行。
 *   L-⑥-3 F-S12 轮转：干跑零删 + 清单在 ∥ confirm ⇒ 恰余 N ∧ 最老者清 ∧ 干扰档在场 ∧ 失败档
 *          （占用——以目录形态造确定性 unlink 失败）跳过计数不抛；钳制支 N=0 ∥ 负值 ⇒ 恰余 1。
 *   L-⑥-4 F-S13 工具：缺省调用 = 干跑零写 + 逐动作段在场 ∥ confirm ⇒ 执行读数 + 备份在册 ∥
 *          VSC 面动作闭集含 maintain ∧ 未知 action 仍拒（核 ∥ VSC 两端）。
 *   L-⑥-5 N-S8 ∥ N-S9 封套：① 单点结构 + 双胞沙箱两入口读数等值；② 备份判据两腿（命中 > 0 才取 ∥
 *          目标已存在 ⇒ 抛 ⇒ 零写）；③ 零空转（干净夹具 confirm ⇒ 行 ∥ 字节 ∥ 备份集全前值）；
 *          ④ 让出腿（注入计数 yieldFn ⇒ 越阈值让出 ≥ 1）。
 *   L-⑥-6 接线 ∥ 幂等：① 调度器直测（二次调用 false ∧ 延迟缝在场 ∧ 库不在盘零动作不建库）；
 *          ② 落点结构断言（CLI backgroundIndex 尾 ∥ 桌面启动拍邻位 + 惰性转口零静态核 import）；
 *          ③ 并发腿（先后两跑同夹具 ⇒ 后到者逐动作零写 ∥ 跳过）。
 *
 * 跑法（从仓库根 `thincoder/`）：node --test docs/batches/2026-10-08-index-automaintain.test.mjs
 */
import { after, test } from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { pathToFileURL } from "node:url"

// 家目录重定向（安全网：核 config 读写不落真家目录——一切动态 import 之前；win32 = USERPROFILE）
const HOME = mkdtempSync(join(tmpdir(), "am-home-"))
process.env.HOME = HOME
process.env.USERPROFILE = HOME

const ROOT = process.cwd()
if (!existsSync(resolve(ROOT, "thincoder-core"))) throw new Error(`从仓库根（thincoder/）运行（cwd = ${ROOT}）`)
const mod = (rel) => import(pathToFileURL(resolve(ROOT, rel)).href)
const text = (rel) => readFileSync(resolve(ROOT, rel), "utf8")

/** 静态 import / export-from 说明符提取（行注释先剔——闭包判据用；先例 = 2026-09-29-residuals-round2.test.mjs）。 */
function staticSpecs(src) {
  const noBlock = src.replace(/\/\*[\s\S]*?\*\//g, "")
  const t = noBlock.split("\n").map((l) => l.replace(/(^|[^:])\/\/.*$/, "$1")).join("\n")
  const specs = []
  for (const m of t.matchAll(/^[ \t]*(?:import|export)\s+(?:(?![;=])[\s\S])*?\bfrom\s*["']([^"']+)["']/gm)) specs.push(m[1])
  for (const m of t.matchAll(/^[ \t]*import\s*["']([^"']+)["']/gm)) specs.push(m[1])
  return specs
}

const DIRS = []
const mkTmp = (tag) => { const d = mkdtempSync(join(tmpdir(), `am-${tag}-`)); DIRS.push(d); return d }
after(() => { for (const d of [...DIRS, HOME]) { try { rmSync(d, { recursive: true, force: true, maxRetries: 3 }) } catch { /* 尽力清理 */ } } })

/** 确定性备份戳（逐跑错开——同戳撞名 = fail-closed 抛，见 L-⑥-5 ②）。 */
const AT = (s) => new Date(Date.UTC(2026, 9, 8, 0, 0, s))
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
/** 族内实档（严格名族 `<basename>.sweep-backup-<14 位戳>`——目录形不入）。 */
const familyFiles = (dir) => readdirSync(dir, { withFileTypes: true })
  .filter((e) => e.isFile() && /^memory\.db\.sweep-backup-\d{14}$/.test(e.name)).map((e) => e.name).sort()

const insCode = (db, origin, path, content = `// ${path}`) => db.prepare(`INSERT INTO code_chunks (origin, path, language, chunk_type, symbol_name, content, line_start, line_end, mtime_ms, seg_content) VALUES (?, ?, 'javascript', 'file', '', ?, 0, 0, 1, '')`).run(origin, path, content)
const insDoc = (db, origin, path, content = `# ${path}`) => db.prepare(`INSERT INTO doc_chunks (origin, path, language, heading, content, line_start, line_end, mtime_ms, seg_content) VALUES (?, ?, 'markdown', '', ?, 0, 0, 1, '')`).run(origin, path, content)
const rowsOf = (db, table) => db.prepare(`SELECT origin, path, line_start, content, mtime_ms FROM ${table} ORDER BY origin, path, line_start`).all()
  .map((r) => ({ origin: r.origin, path: r.path, line_start: r.line_start, content: r.content, mtime_ms: r.mtime_ms }))

/** L-⑥-1 夹具：A 树亡（3 行 3 档）∥ B 树活独档被删（1 行，另 1 档在盘）∥ C 树活全档在盘（2 行 2 档）。 */
async function gcFixture(tag) {
  const { createMemory } = await mod("thincoder-core/memory/schema.mjs")
  const { normalizeOrigin } = await mod("thincoder-core/memory/origin.mjs")
  const base = mkTmp(tag)
  const dbPath = join(base, "memory.db")
  const memory = createMemory({ dbPath })
  const dirs = { a: join(base, "origin-a"), b: join(base, "origin-b"), c: join(base, "origin-c") }
  for (const d of Object.values(dirs)) mkdirSync(d, { recursive: true })
  writeFileSync(join(dirs.b, "stay.mjs"), "export const stay = 1\n")
  writeFileSync(join(dirs.b, "gone.mjs"), "export const gone = 1\n")
  writeFileSync(join(dirs.c, "keep.mjs"), "export const keep = 1\n")
  writeFileSync(join(dirs.c, "keep.md"), "# keep\n")
  const O = { a: normalizeOrigin(dirs.a), b: normalizeOrigin(dirs.b), c: normalizeOrigin(dirs.c) }
  insCode(memory.db, O.a, "a/one.mjs"); insCode(memory.db, O.a, "a/two.mjs"); insDoc(memory.db, O.a, "a/readme.md")
  insCode(memory.db, O.b, "stay.mjs"); insCode(memory.db, O.b, "gone.mjs")
  insCode(memory.db, O.c, "keep.mjs")
  rmSync(dirs.a, { recursive: true, force: true }) // A 树亡
  rmSync(join(dirs.b, "gone.mjs")) // B 独档被删
  return { base, dbPath, memory, O }
}

// ─────────────────────────────── L-⑥-1 · F-S10 鬼行 GC ───────────────────────────────

test("L-⑥-1 F-S10 鬼行 GC：干跑计划零写 ∥ confirm 死档归零 + 备份在册 + 先行读数 ∥ 探针错保留", async () => {
  const { maintainMemory, formatMaintainReport } = await mod("thincoder-core/memory/maintain.mjs")
  const { DatabaseSync } = await import("node:sqlite")
  const f = await gcFixture("gc")
  try {
    const codeBefore = rowsOf(f.memory.db, "code_chunks")
    const docBefore = rowsOf(f.memory.db, "doc_chunks")

    // ① 干跑：计划含 A 全档 + B 死档 ∧ 零写（行 ∥ 字节不变、无备份）
    const sizeBefore = statSync(f.dbPath).size
    const dry = await maintainMemory(f.memory, { confirm: false, dbPath: f.dbPath, now: AT(1) })
    const gc = dry.steps.find((s) => s.action === "gc")
    assert.equal(dry.dryRun, true, "干跑默认面")
    assert.equal(gc.status, "planned", "命中 > 0 ⇒ 计划段")
    assert.equal(gc.readings.deadGroups, 4, "死档 = A 三档 + B 一档")
    assert.equal(gc.readings.deadRows, 4, "死行 = A code 2 + doc 1 ∥ B code 1")
    assert.equal(gc.readings.keptGroups, 2, "保留 = B stay.mjs ∥ C keep.mjs")
    for (const [o, p] of [[f.O.a, "a/one.mjs"], [f.O.a, "a/two.mjs"], [f.O.a, "a/readme.md"], [f.O.b, "gone.mjs"]]) {
      assert.ok(gc.readings.dead.some((d) => d.origin === o && d.path === p), `计划含死档：${p}`)
    }
    assert.deepEqual(rowsOf(f.memory.db, "code_chunks"), codeBefore, "干跑零写（code 逐键不变）")
    assert.deepEqual(rowsOf(f.memory.db, "doc_chunks"), docBefore, "干跑零写（doc 逐键不变）")
    assert.equal(statSync(f.dbPath).size, sizeBefore, "干跑零写（字节不变）")
    assert.deepEqual(familyFiles(f.base), [], "干跑零备份")

    // ② confirm：A ∥ B 死档归零 ∧ C 逐键等前值 ∧ 备份在册（integrity ok）∧ 报告含干跑先行读数
    const cBefore = rowsOf(f.memory.db, "code_chunks").filter((r) => r.origin === f.O.c)
    const conf = await maintainMemory(f.memory, { confirm: true, dbPath: f.dbPath, now: AT(3) })
    const cgc = conf.steps.find((s) => s.action === "gc")
    assert.equal(cgc.status, "executed", "confirm ⇒ 执行段")
    assert.equal(cgc.readings.deletedRows, 4, "实删 = 4 行（A 3 + B 1）")
    for (const t of ["code_chunks", "doc_chunks"]) {
      assert.equal(Number(f.memory.db.prepare(`SELECT COUNT(*) AS n FROM ${t} WHERE origin = ?`).get(f.O.a).n), 0, `A 死档归零（${t}）`)
    }
    assert.equal(Number(f.memory.db.prepare(`SELECT COUNT(*) AS n FROM code_chunks WHERE origin = ? AND path = 'gone.mjs'`).get(f.O.b).n), 0, "B 死档归零")
    assert.deepEqual(rowsOf(f.memory.db, "code_chunks").filter((r) => r.origin === f.O.c), cBefore, "C 逐键等前值")
    assert.ok(cgc.readings.backupPath && existsSync(cgc.readings.backupPath) && statSync(cgc.readings.backupPath).size > 0, "备份在册（存在 ∧ 大小 > 0）")
    const bdb = new DatabaseSync(cgc.readings.backupPath, { readOnly: true })
    try { assert.equal(Object.values(bdb.prepare("PRAGMA integrity_check").get() ?? {})[0], "ok", "备份 integrity_check = ok") } finally { bdb.close() }
    const report = formatMaintainReport(conf)
    assert.match(report, /dead 4 group\(s\) \/ 4 row\(s\)/, "报告含干跑先行读数（判亡计划面）")
    assert.match(report, /- gc: executed/)
  } finally { f.memory.db.close() }

  // ③ 探针错腿：probeFn ⇒ unknown ⇒ 该档保留（树亡短路不受注入影响——A 照删）
  const p = await gcFixture("gc-probe")
  try {
    const res = await maintainMemory(p.memory, { confirm: true, dbPath: p.dbPath, now: AT(2), probeFn: () => "unknown" })
    const pgc = res.steps.find((s) => s.action === "gc")
    assert.ok(pgc.readings.unknownGroups >= 1, `探针错档在读数（实 = ${pgc.readings.unknownGroups}）`)
    assert.equal(Number(p.memory.db.prepare(`SELECT COUNT(*) AS n FROM code_chunks WHERE origin = ? AND path = 'gone.mjs'`).get(p.O.b).n), 1, "探针错档保留（B gone.mjs 在）")
    assert.equal(Number(p.memory.db.prepare(`SELECT COUNT(*) AS n FROM code_chunks WHERE origin = ?`).get(p.O.a).n), 0, "树亡短路照删（A 归零）")
  } finally { p.memory.db.close() }
})

// ─────────────────────────────── L-⑥-2 · F-S11 压实 ───────────────────────────────

test("L-⑥-2 F-S11 压实：双式全越 ⇒ 执行 + freelist 回落 ∥ 单越一式跳过 ∥ 全未越零执行", async () => {
  const { maintainMemory, formatMaintainReport, maintainLine } = await mod("thincoder-core/memory/maintain.mjs")
  const { createMemory } = await mod("thincoder-core/memory/schema.mjs")
  const base = mkTmp("vac")
  const dbPath = join(base, "memory.db")
  const memory = createMemory({ dbPath })
  try {
    // 沙箱库造 freelist（大块行插入 + 删除——真 VACUUM 可回落）
    const ins = memory.db.prepare(`INSERT INTO code_chunks (origin, path, language, chunk_type, symbol_name, content, line_start, line_end, mtime_ms, seg_content) VALUES ('D:/fx/void', ?, 'javascript', 'file', '', ?, 0, 0, 1, '')`)
    memory.db.exec("BEGIN IMMEDIATE")
    for (let i = 0; i < 800; i++) ins.run(`big-${i}.mjs`, "x".repeat(2000) + i)
    memory.db.exec("COMMIT")
    memory.db.prepare("DELETE FROM code_chunks").run()
    const fl = () => {
      const pageSize = Number(memory.db.prepare("PRAGMA page_size").get().page_size)
      const n = Number(memory.db.prepare("PRAGMA freelist_count").get().freelist_count)
      return { n, bytes: n * pageSize, dbBytes: statSync(dbPath).size }
    }
    const before = fl()
    assert.ok(before.n > 0, `夹具前置：freelist > 0（实 = ${before.n}）`)
    const vstep = (r) => r.steps.find((s) => s.action === "vacuum")

    // ② 单越一式（两向）⇒ 跳过 + 理由 ∧ 零执行
    let calls = 0
    const onlyRatio = vstep(await maintainMemory(memory, { confirm: true, dbPath, vacuumFn: () => { calls++ }, freelistMinBytes: 1, freelistRatio: (before.bytes / before.dbBytes) * 2 }))
    assert.equal(onlyRatio.status, "skipped", "下限越、比值未越 ⇒ 跳过")
    assert.match(onlyRatio.reason, /under the line/)
    const onlyMin = vstep(await maintainMemory(memory, { confirm: true, dbPath, vacuumFn: () => { calls++ }, freelistMinBytes: Number.MAX_SAFE_INTEGER, freelistRatio: 0 }))
    assert.equal(onlyMin.status, "skipped", "比值越、下限未越 ⇒ 跳过")
    assert.match(onlyMin.reason, /under the line/)
    assert.equal(calls, 0, "单越 ⇒ 零执行（vacuumFn 零调用）")

    // ③ 全未越（真常量）⇒ 零执行
    const none = vstep(await maintainMemory(memory, { confirm: true, dbPath, vacuumFn: () => { calls++ } }))
    assert.equal(none.status, "skipped", "真阈未越 ⇒ 跳过（N-S9 零空转）")
    assert.equal(calls, 0, "全未越 ⇒ 零执行")

    // ① 双式全越 ⇒ 执行（注入计数 = 1）∧ freelist 后 < 前 ∧ 读数在
    const full = await maintainMemory(memory, { confirm: true, dbPath, vacuumFn: (db) => { calls++; db.exec("VACUUM") }, freelistMinBytes: 1, freelistRatio: 0 })
    const done = vstep(full)
    assert.equal(done.status, "executed", "双式全越 ⇒ 执行")
    assert.equal(calls, 1, "注入计数 vacuumFn = 1")
    const after = fl()
    assert.ok(after.n < before.n, `freelist 回落（${before.n} → ${after.n}）`)
    assert.equal(done.readings.readback, "ok", "写后回读 = freelist 回落且尺寸 ≤ 前")
    assert.equal(done.readings.afterFreelistBytes, after.bytes, "读数在（after 实读）")
    assert.match(formatMaintainReport(full), /freelist .* → /, "工具报告面含 freelist 读数（⑤-4 逐动作段读数）")
    // ⑤-6「freelist = 维护内部读数，不入可见面」：可见面枚举（CLI 行 ∥ logEvent 摘要）不含 freelist 数值
    const line = maintainLine(full)
    assert.match(line, /vacuum executed/, "可见面行含动作面")
    assert.ok(!/MiB|KiB/.test(line), `可见面行零 freelist 数值（实 = ${line}）`)
  } finally { memory.db.close() }
})

// ─────────────────────────────── L-⑥-3 · F-S12 轮转 ───────────────────────────────

test("L-⑥-3 F-S12 轮转：干跑零删 + 清单 ∥ confirm 恰余 N + 最老清 + 干扰档在场 ∥ 失败档跳过不抛 ∥ 钳制支", async () => {
  const { maintainMemory } = await mod("thincoder-core/memory/maintain.mjs")
  const { createMemory } = await mod("thincoder-core/memory/schema.mjs")
  const base = mkTmp("rot")
  const dbPath = join(base, "memory.db")
  const memory = createMemory({ dbPath })
  try {
    const fam = (s) => `memory.db.sweep-backup-${s}`
    const FIVE = ["20261008010101", "20261008010202", "20261008010303", "20261008010404", "20261008010505"]
    for (const s of FIVE) writeFileSync(join(base, fam(s)), "b")
    const INTERFERENCE = [
      fam("20261008"), // 8 位戳（非 14）
      fam("2026100801010"), // 13 位戳
      "db-other.sweep-backup-20261008010101", // 异 basename
      `${fam("20261008010101")}.bak`, // 后缀形
      "memory.db.keepme", // 无关名
    ]
    for (const n of INTERFERENCE) writeFileSync(join(base, n), "x")
    const rstep = (r) => r.steps.find((s) => s.action === "rotate")

    // 干跑：零删 + 清单在
    const dry = rstep(await maintainMemory(memory, { confirm: false, dbPath }))
    assert.equal(dry.status, "planned")
    assert.deepEqual(dry.readings.drop, [fam(FIVE[0]), fam(FIVE[1]), fam(FIVE[2])], "drop = 最老 3 枚（升序清单）")
    for (const s of FIVE) assert.ok(existsSync(join(base, fam(s))), `干跑零删：${s}`)

    // confirm（N = 缺省 2——经 config 缺省路径）⇒ 恰余 N ∧ 最老者清 ∧ 干扰档在场
    const conf = rstep(await maintainMemory(memory, { confirm: true, dbPath }))
    assert.equal(conf.status, "executed")
    assert.equal(conf.readings.keep, 2, "N = 缺省 2（config.memory.maintain.backupKeep）")
    assert.deepEqual(familyFiles(base), [fam(FIVE[3]), fam(FIVE[4])].sort(), "恰余最新 2 枚")
    assert.deepEqual(conf.readings.deleted.sort(), [fam(FIVE[0]), fam(FIVE[1]), fam(FIVE[2])].sort(), "清 3 枚（最老）")
    for (const n of INTERFERENCE) assert.ok(existsSync(join(base, n)), `非本族零触：${n}`)

    // 失败档（占用——以目录形态造确定性 unlink 失败）跳过计数不抛 + 其余照删
    writeFileSync(join(base, fam("20261008010606")), "b")
    writeFileSync(join(base, fam("20261008010707")), "b")
    mkdirSync(join(base, fam("20261008000001")))
    const f2 = rstep(await maintainMemory(memory, { confirm: true, dbPath }))
    assert.equal(f2.status, "executed")
    assert.equal(f2.readings.skipped.length, 1, "失败档跳过计数")
    assert.equal(f2.readings.skipped[0].name, fam("20261008000001"))
    assert.ok(existsSync(join(base, fam("20261008000001"))), "失败档留在原地")
    assert.deepEqual(f2.readings.deleted.sort(), [fam(FIVE[3]), fam(FIVE[4])].sort(), "其余照删")
    assert.deepEqual(familyFiles(base), [fam("20261008010606"), fam("20261008010707")].sort(), "恰余最新 2 枚")
    for (const n of INTERFERENCE) assert.ok(existsSync(join(base, n)), `非本族零触（失败腿后）：${n}`)

    // 钳制支：N=0 ∥ 负值 ⇒ 引擎钳 1 ⇒ 恰余 1
    const c0 = rstep(await maintainMemory(memory, { confirm: true, dbPath, backupKeep: 0 }))
    assert.equal(c0.readings.keep, 1, "N=0 ⇒ 钳 1")
    const cNeg = rstep(await maintainMemory(memory, { confirm: true, dbPath, backupKeep: -3 }))
    assert.equal(cNeg.readings.keep, 1, "N 负值 ⇒ 钳 1")
    assert.deepEqual(familyFiles(base), [fam("20261008010707")], "恰余 1 枚（最新）")
  } finally { memory.db.close() }
})

// ─────────────────────────────── L-⑥-4 · F-S13 工具 ───────────────────────────────

test("L-⑥-4 F-S13 工具：缺省干跑零写 + 三段齐 ∥ confirm 执行读数 + 备份在册 ∥ VSC 闭集含 maintain ∧ 未知 action 仍拒", async () => {
  const { memoryTools } = await mod("thincoder-core/memory/memory-tool.mjs")
  const f = await gcFixture("tool")
  try {
    const tool = memoryTools(f.memory, { cwd: f.base, projectDir: null, author: "am-test", team: null })[0]
    assert.deepEqual(tool.parameters.properties.action.enum, ["search", "put", "list", "delete", "clear", "maintain"], "动作枚举 = 六")

    // ① 缺省调用 = 干跑零写 + 逐动作段（执行 ∥ 跳过 + 理由）在场
    const codeBefore = rowsOf(f.memory.db, "code_chunks")
    const docBefore = rowsOf(f.memory.db, "doc_chunks")
    const out = await tool.execute({ action: "maintain" })
    assert.match(out, /dry-run \(no writes\)/, "缺省 = 干跑")
    assert.match(out, /- gc: planned/, "gc 段在场（计划）")
    assert.match(out, /- vacuum: skipped — /, "vacuum 段在场（跳过 + 理由）")
    assert.match(out, /- rotate: skipped — /, "rotate 段在场（跳过 + 理由）")
    assert.deepEqual(rowsOf(f.memory.db, "code_chunks"), codeBefore, "干跑零写（code）")
    assert.deepEqual(rowsOf(f.memory.db, "doc_chunks"), docBefore, "干跑零写（doc）")
    assert.deepEqual(familyFiles(f.base), [], "干跑零备份")

    // ② confirm:true（沙箱）⇒ 执行读数 + 备份在册
    const conf = await tool.execute({ action: "maintain", confirm: true })
    assert.match(conf, /- gc: executed/, "confirm ⇒ 执行段")
    assert.match(conf, /deleted 4 row\(s\)/, "执行读数在场")
    assert.match(conf, /backup: /, "备份路径在读数面")
    assert.equal(Number(f.memory.db.prepare(`SELECT COUNT(*) AS n FROM code_chunks WHERE origin = ?`).get(f.O.a).n), 0, "A 归零")
    assert.equal(familyFiles(f.base).length, 1, "备份在册（恰 1 枚）")

    // ④ 未知 action 仍拒（核端）
    await assert.rejects(() => tool.execute({ action: "bogus" }), /unknown action/, "核端拒未知 action")

    // ③ VSC 面动作闭集含 maintain（端零自持算法——执行委托核面）
    const vscSrc = text("thincoder-vscode/src/memory-tool.mjs")
    assert.match(vscSrc, /const MEMORY_ACTIONS = \["search", "put", "list", "delete", "clear", "maintain"\]/, "VSC 动作清单含 maintain")
    const vsc = await import(pathToFileURL(resolve(ROOT, "thincoder-vscode/src/memory-tool.mjs")).href)
    const rejected = await vsc.memoryTool.execute({ action: "bogus" }, {})
    assert.match(rejected, /^Error: memory: unknown action/, "VSC 拒未知 action")
    const accepted = await vsc.memoryTool.execute({ action: "maintain" }, {})
    assert.ok(!/unknown action/.test(accepted), "VSC 闭集含 maintain（过守卫）")
  } finally { f.memory.db.close() }
})

// ─────────────────────────────── L-⑥-5 · N-S8 ∥ N-S9 封套 ───────────────────────────────

test("L-⑥-5 N-S8 ∥ N-S9 封套：单点 + 两入口读数等值 ∥ 备份判据两腿 ∥ 零空转 ∥ 让出腿", async () => {
  const { maintainMemory } = await mod("thincoder-core/memory/maintain.mjs")
  const { memoryTools } = await mod("thincoder-core/memory/memory-tool.mjs")
  const { createMemory } = await mod("thincoder-core/memory/schema.mjs")
  const { normalizeOrigin } = await mod("thincoder-core/memory/origin.mjs")

  // ① 单点结构断言——自动 ∥ 工具两入口皆经 maintainMemory
  assert.match(text("thincoder-core/memory/memory-tool.mjs"), /maintainMemory\(memory, \{/, "工具入口直调 maintainMemory")
  assert.match(text("thincoder-core/memory/maintain.mjs"), /await maintainMemory\(memory, \{ confirm: true, dbPath: file \}\)/, "自动拍入口直调 maintainMemory（同一单点）")

  // ① 同夹具两入口读数等值（双胞沙箱——逐项读数比对）
  const t1 = await gcFixture("twin-tool"), t2 = await gcFixture("twin-auto")
  try {
    const tool = memoryTools(t1.memory, { cwd: t1.base, projectDir: null, author: "am", team: null })[0]
    const out = await tool.execute({ action: "maintain", confirm: true })
    const r2 = await maintainMemory(t2.memory, { confirm: true, dbPath: t2.dbPath, now: AT(4) })
    const g2 = r2.steps.find((s) => s.action === "gc"), v2 = r2.steps.find((s) => s.action === "vacuum"), t2r = r2.steps.find((s) => s.action === "rotate")
    assert.equal(g2.readings.deadGroups, 4); assert.equal(g2.readings.deadRows, 4); assert.equal(g2.readings.deletedRows, 4)
    assert.match(out, /dead 4 group\(s\) \/ 4 row\(s\)/, "工具入口读数 = 自动入口读数（判亡面）")
    assert.match(out, /deleted 4 row\(s\)/, "工具入口读数 = 自动入口读数（实删面）")
    assert.equal(v2.status, "skipped"); assert.match(out, /- vacuum: skipped/)
    assert.equal(t2r.status, "skipped"); assert.match(out, /- rotate: skipped/)
  } finally { t1.memory.db.close(); t2.memory.db.close() }

  // ② 备份判据两腿——命中 = 0 不取 ∥ 目标已存在 ⇒ 抛 ⇒ 零写
  const idle = mkTmp("backup-zero")
  const idlePath = join(idle, "memory.db")
  const idleMem = createMemory({ dbPath: idlePath })
  try {
    const clean = await maintainMemory(idleMem, { confirm: true, dbPath: idlePath })
    assert.equal(clean.steps.find((s) => s.action === "gc").status, "skipped", "命中 = 0 ⇒ 跳过")
    assert.deepEqual(familyFiles(idle), [], "命中 = 0 不取备份")
  } finally { idleMem.db.close() }

  const clash = await gcFixture("backup-clash")
  try {
    const clashName = "memory.db.sweep-backup-20261008000009"
    writeFileSync(join(clash.base, clashName), "pre-existing")
    const codeB = rowsOf(clash.memory.db, "code_chunks")
    await assert.rejects(() => maintainMemory(clash.memory, { confirm: true, dbPath: clash.dbPath, now: AT(9) }), /already exists/, "目标已存在 ⇒ 抛")
    assert.deepEqual(rowsOf(clash.memory.db, "code_chunks"), codeB, "抛 ⇒ 零写（行不变）")
    assert.deepEqual(familyFiles(clash.base), [clashName], "抛 ⇒ 零写（无新备份）")
  } finally { clash.memory.db.close() }

  // ③ 零空转：干净夹具（零鬼行 ∧ 未越阈 ∧ 备份 ≤ N）confirm ⇒ 行 ∥ 字节 ∥ 备份集全前值
  const z = mkTmp("idle")
  const zPath = join(z, "memory.db")
  const zMem = createMemory({ dbPath: zPath })
  try {
    const liveDir = join(z, "proj"); mkdirSync(liveDir, { recursive: true }); writeFileSync(join(liveDir, "a.mjs"), "x")
    insCode(zMem.db, normalizeOrigin(liveDir), "a.mjs")
    writeFileSync(join(z, "memory.db.sweep-backup-20261008020101"), "b")
    writeFileSync(join(z, "memory.db.sweep-backup-20261008020202"), "b")
    const rowsBefore = rowsOf(zMem.db, "code_chunks")
    const bytesBefore = statSync(zPath).size
    const famBefore = familyFiles(z)
    const res = await maintainMemory(zMem, { confirm: true, dbPath: zPath })
    assert.equal(res.steps.find((s) => s.action === "gc").status, "skipped", "零鬼行 ⇒ 跳过")
    assert.equal(res.steps.find((s) => s.action === "vacuum").status, "skipped", "未越阈 ⇒ 跳过")
    assert.equal(res.steps.find((s) => s.action === "rotate").status, "skipped", "备份 ≤ N ⇒ 跳过")
    assert.deepEqual(rowsOf(zMem.db, "code_chunks"), rowsBefore, "零空转（行前值）")
    assert.equal(statSync(zPath).size, bytesBefore, "零空转（字节前值）")
    assert.deepEqual(familyFiles(z), famBefore, "零空转（备份集前值）")
  } finally { zMem.db.close() }

  // ④ 让出腿：注入计数 yieldFn ⇒ 鬼行扫描越阈值（70 档 > 64）让出 ≥ 1（承 L-②-3 形）
  const y = mkTmp("yield")
  const yPath = join(y, "memory.db")
  const yMem = createMemory({ dbPath: yPath })
  try {
    const yDir = join(y, "proj"); mkdirSync(yDir, { recursive: true })
    const yOrigin = normalizeOrigin(yDir)
    for (let i = 0; i < 70; i++) {
      const p = `f${String(i).padStart(3, "0")}.mjs`
      writeFileSync(join(yDir, p), "x")
      insCode(yMem.db, yOrigin, p)
    }
    let yields = 0, t = 0
    const yRes = await maintainMemory(yMem, { confirm: false, dbPath: yPath, yieldFn: async () => { yields++ }, nowFn: () => (t += 100) })
    assert.ok(yRes.steps.find((s) => s.action === "gc").readings.yields >= 1, `让出 ≥ 1（实 = ${yields}）`)
  } finally { yMem.db.close() }
})

// ─────────────────────────────── L-⑥-6 · 接线 ∥ 幂等 ───────────────────────────────

test("L-⑥-6 接线 ∥ 幂等：调度器直测 ∥ 落点结构断言 ∥ 并发腿", async () => {
  const engine = await mod("thincoder-core/memory/maintain.mjs")
  const { createMemory } = await mod("thincoder-core/memory/schema.mjs")

  // ① 调度器直测——二次调用返 false ∧ 延迟缝在场 ∧ 库不在盘 ⇒ 零动作且不建库
  assert.equal(engine.MEMORY_MAINTENANCE_DELAY_MS, 3000, "缺省延迟 = 3 s")
  assert.equal(typeof engine._setMemoryMaintenanceDelayForTest, "function", "延迟缝在场")
  engine._resetMemoryMaintenanceScheduleForTest()
  engine._setMemoryMaintenanceDelayForTest(5)
  const missing = join(mkTmp("sched"), "memory.db")
  assert.equal(engine.scheduleMemoryMaintenance({ dbPath: missing }), true, "首拍 = true")
  assert.equal(engine.scheduleMemoryMaintenance({ dbPath: missing }), false, "二次调用 = false（每进程一次）")
  await sleep(80)
  assert.equal(existsSync(missing), false, "库不在盘 ⇒ 零动作且不建库")

  // 延迟缝点火：真库 ⇒ 报告到达（dryRun = false——自动拍写姿态 = 非干跑）
  engine._resetMemoryMaintenanceScheduleForTest()
  const sBase = mkTmp("sched2")
  const sPath = join(sBase, "memory.db")
  const sMem = createMemory({ dbPath: sPath }); sMem.db.close()
  const rep = await new Promise((resolveReport) => {
    const timer = setTimeout(() => resolveReport(null), 3000)
    assert.equal(engine.scheduleMemoryMaintenance({ dbPath: sPath, onReport: (r) => { clearTimeout(timer); resolveReport(r) } }), true, "真库点火 = true")
  })
  assert.ok(rep, "延迟缝点火：报告到达")
  assert.equal(rep.dryRun, false, "自动拍 = 非干跑（⑤-5 写姿态）")

  // ② 落点结构断言——CLI backgroundIndex 尾 ∥ 桌面启动拍邻位 + 惰性转口（新边零静态核 import）
  //    （全闭包形态不作断言：桌面 main.mjs 静态闭包经 `agent-host → 核 memory.mjs → schema.mjs`
  //     **既有** node:sqlite 边——本批零改，非本批射程；本批判据 = 新边（维护链）零静态可达。）
  const cli = text("thincoder-cli/src/tui/startup.mjs")
  assert.ok(cli.indexOf("scheduleMemoryMaintenance(") > cli.indexOf("Ready — idx code"), "CLI 落点 = Ready 置后")
  assert.ok(cli.indexOf("scheduleMemoryMaintenance(") > cli.indexOf("isHomeDir(cwd)"), "CLI 落点在 home 跳过档（早退）之后")
  assert.match(cli, /onReport: \(report\) => \{ if \(maintainActionCount\(report\) > 0\) pushLine/, "可见面席位（有动作 ⇒ 一行）")
  const desktop = text("thincoder-desktop/src/main/main.mjs")
  assert.match(desktop, /import \{ scheduleMemoryMaintenance \} from "\.\/memory-maintenance\.mjs"/, "桌面走新档惰性转口")
  assert.ok(desktop.indexOf("scheduleMemoryMaintenance(") > desktop.indexOf("scheduleSessionMaintenancePasses("), "落点 = 启动拍邻位")
  assert.ok(!staticSpecs(desktop).includes("@thincoder/core/memory/maintain.mjs"), "main.mjs 零静态核维护链 import（只经转口）")
  const relay = text("thincoder-desktop/src/main/memory-maintenance.mjs")
  assert.deepEqual(staticSpecs(relay), [], "惰性转口零静态 import（node:sqlite 不入新边）")
  assert.match(relay, /await import\("@thincoder\/core\/memory\/maintain\.mjs"\)/, "核维护链 = 动态 import")
  assert.match(text("thincoder-core/memory/maintain.mjs"), /from "\.\/schema\.mjs"/, "核维护链静态引 schema（转口惰性的理由）")

  // ③ 并发腿——先后两跑同夹具 ⇒ 后到者逐动作零写 ∥ 跳过
  const f = await gcFixture("idem")
  try {
    await engine.maintainMemory(f.memory, { confirm: true, dbPath: f.dbPath, now: AT(5) })
    const rowsAfterFirst = rowsOf(f.memory.db, "code_chunks"), docAfterFirst = rowsOf(f.memory.db, "doc_chunks")
    const famAfterFirst = familyFiles(f.base)
    assert.equal(famAfterFirst.length, 1, "前跑：备份恰 1 枚")
    const second = await engine.maintainMemory(f.memory, { confirm: true, dbPath: f.dbPath, now: AT(6) })
    assert.equal(second.steps.find((s) => s.action === "gc").status, "skipped", "后到者 gc 跳过（零鬼行）")
    assert.equal(second.steps.find((s) => s.action === "vacuum").status, "skipped", "后到者 vacuum 跳过")
    assert.equal(second.steps.find((s) => s.action === "rotate").status, "skipped", "后到者 rotate 跳过（族内 ≤ N）")
    assert.deepEqual(rowsOf(f.memory.db, "code_chunks"), rowsAfterFirst, "后到者零写（code 行）")
    assert.deepEqual(rowsOf(f.memory.db, "doc_chunks"), docAfterFirst, "后到者零写（doc 行）")
    assert.deepEqual(familyFiles(f.base), famAfterFirst, "后到者零写（备份集）")
  } finally { f.memory.db.close() }
})
