/**
 * memory-sweep.test.mjs — origin 级库治理（命令面 + 安全设计 · MEMORY.md §6.13 · 台账 #175）。
 * 批档 = `docs/batches/2026-09-25-misc-four.md` §2.2 + 修正轮 ①/⑧/⑨（验收 ①–⑨）。
 *
 * 三态：变体 ⇒ 折叠 / 亡树 ⇒ 删 / 活树 ⇒ 保留（+ 探针错误 ⇒ fail-safe 保留）；
 * 安全三件：干跑默认零写 / 备份前置（`--confirm` 且命中 > 0）/ 审计形态；写后回读判据 = 折叠唯一行。
 * 夹具：真 tmp 目录（活树 / 亡树 = 建后删）+ 文件型 sqlite（备份与字节读数需要文件库）+ 变体拼写
 * （Windows 盘符大小写 + 反斜杠 + 尾斜杠；POSIX 退化为尾斜杠）。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { createMemory } from "../memory/schema.mjs"
import { normalizeOrigin } from "../memory/origin.mjs"
import { sweepMemory, planSweep, formatSweepReport, probeOriginPath, backupPathFor } from "../memory/sweep.mjs"

/** 同一树的第二种拼写（设计三变换：盘符大小写 ∨ 分隔符反形 ∨ 尾斜杠——POSIX 退化为尾斜杠）。 */
function altSpelling(dir) {
  const lower = normalizeOrigin(dir).replace(/^([A-Za-z]):/, (_m, d) => `${d.toLowerCase()}:`)
  return process.platform === "win32" ? `${lower.replaceAll("/", "\\")}\\` : `${lower}/`
}

/** 夹具：文件型库 + tmp 基目录（活树目录 / 亡树路径）。 */
function fixture(t) {
  const base = mkdtempSync(join(tmpdir(), "sweep-"))
  t.after(() => { try { rmSync(base, { recursive: true, force: true }) } catch { /* Windows 句柄滞后 */ } })
  const dbPath = join(base, "memory.db")
  const live = join(base, "live-tree")
  mkdirSync(live, { recursive: true })
  const gone = join(base, "gone-tree")
  mkdirSync(gone, { recursive: true })
  rmSync(gone, { recursive: true, force: true })
  return { base, dbPath, live, gone, mem: createMemory({ dbPath }) }
}

const SEED = {
  code: (mem, origin, path, line, mtime) => mem.db.prepare(
    "INSERT INTO code_chunks (origin, path, language, chunk_type, symbol_name, content, line_start, line_end, mtime_ms, seg_content) VALUES (?,?,?,?,?,?,?,?,?,?)",
  ).run(origin, path, "javascript", "file", "", "x", line, line, mtime, "x"),
  doc: (mem, origin, path, line, mtime) => mem.db.prepare(
    "INSERT INTO doc_chunks (origin, path, language, heading, content, line_start, line_end, mtime_ms, seg_content) VALUES (?,?,?,?,?,?,?,?,?)",
  ).run(origin, path, "markdown", "h", "x", line, line, mtime, "x"),
  files: (mem, origin, path, mtime, layer = "project") => mem.db.prepare(
    "INSERT INTO files (layer, origin, path, type, title, content, tags, author, mtime_ms, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)",
  ).run(layer, origin, path, "rule", "t", "body", "", "a", mtime, mtime),
}

/** 三表读数指纹（排序拼接——行序无关）。 */
const digest = (mem) => JSON.stringify({
  code: mem.db.prepare("SELECT origin, path, line_start, mtime_ms FROM code_chunks ORDER BY origin, path, line_start").all(),
  doc: mem.db.prepare("SELECT origin, path, line_start, mtime_ms FROM doc_chunks ORDER BY origin, path, line_start").all(),
  files: mem.db.prepare("SELECT layer, origin, path, mtime_ms FROM files ORDER BY layer, origin, path").all(),
})

/** 逐 (表, origin) 计数（=`--origin` 档「非目标零变」的逐键比对面）。 */
function perKey(mem) {
  const out = {}
  for (const t of ["code_chunks", "doc_chunks", "files"]) {
    for (const r of mem.db.prepare(`SELECT origin, COUNT(*) AS n FROM ${t} GROUP BY origin`).all()) out[`${t}:${r.origin}`] = Number(r.n)
  }
  return out
}

const backupsIn = (dir) => readdirSync(dir).filter((n) => n.includes(".sweep-backup-"))

// ─── ① 三态 + fail-safe 保留 ────────────────────────────────────────────────

test("S1 三态（全扫）：变体 ⇒ 折叠（含与归一键行同 dup 键）∧ 亡树 ⇒ 删 ∧ 活树 ⇒ 保留 ∧ 探针错误 ⇒ fail-safe 保留", async (t) => {
  const { dbPath, live, gone, mem } = fixture(t)
  const key = normalizeOrigin(live)
  const variant = altSpelling(live)
  const bad = "Q:/broken\u0000tree"
  SEED.code(mem, key, "a.mjs", 1, 10)      // 归一键行（归一拼写 · 活树）
  SEED.code(mem, variant, "a.mjs", 1, 20)  // 变体行（同 dup 键 · 更高 mtime ⇒ 胜者）
  SEED.doc(mem, variant, "n.md", 1, 5)
  SEED.files(mem, variant, "n.md", 5)
  SEED.code(mem, normalizeOrigin(gone), "b.mjs", 1, 1) // 亡树
  SEED.code(mem, bad, "c.mjs", 1, 1)                   // 探针错误（NUL 路径 ⇒ 非 ENOENT）

  assert.equal(probeOriginPath(bad), "unknown", "NUL 路径探针 = 非 ENOENT（fail-safe 面）")
  const plan = planSweep(mem)
  const foldRow = plan.rows.find((r) => r.action === "fold")
  assert.equal(foldRow?.foldFrom, variant, "变体 ⇒ 折叠（不删）")
  assert.equal(foldRow?.origin, key, "折叠目标 = 归一形")
  assert.ok(plan.rows.some((r) => r.origin === key && r.action === "keep"), "归一键行（活树）⇒ 保留")
  assert.ok(plan.rows.some((r) => r.origin === normalizeOrigin(gone) && r.action === "delete"), "亡树 ⇒ 删")
  assert.ok(plan.rows.some((r) => r.origin === bad && r.action === "keep"), "探针错误 ⇒ fail-safe 保留")

  const result = sweepMemory(mem, { confirm: true, dbPath })
  assert.equal(result.affected.deleted, 1, "亡树行删除 1 行")
  assert.equal(perKey(mem)[`code_chunks:${normalizeOrigin(gone)}`], undefined, "亡树 origin 三表零命中")
  assert.equal(perKey(mem)[`code_chunks:${bad}`], 1, "探针错误档零动（保留）")
  const origins = mem.db.prepare("SELECT DISTINCT origin FROM code_chunks").all().map((r) => r.origin)
  assert.deepEqual(origins.sort(), [bad, key].sort(), "变体折叠到归一形（原样键退场）")
  const rows = mem.db.prepare("SELECT line_start, mtime_ms FROM code_chunks WHERE origin = ? AND path = 'a.mjs'").all(key)
  assert.equal(rows.length, 1, "同 (path, line_start) 恰一行（§6.11 步 2 唯一行——归一键行与变体行同组取舍）")
  assert.equal(rows[0].mtime_ms, 20, "保留 mtime_ms 最大者")
  assert.deepEqual(mem.db.prepare("SELECT DISTINCT origin FROM doc_chunks").all().map((r) => r.origin), [key], "doc 面折叠到归一形")
  assert.deepEqual(mem.db.prepare("SELECT DISTINCT origin FROM files").all().map((r) => r.origin), [key], "files 面折叠到归一形")
})

test("S1b 折叠并列：mtime 相同 ⇒ 保留 rowid 最小者（§6.11 步 2 逐字 · 两向）", async (t) => {
  const { dbPath, live, mem } = fixture(t)
  const key = normalizeOrigin(live)
  const variant = altSpelling(live)
  const canonicalFirst = SEED.code(mem, key, "same.mjs", 1, 7)      // 归一键行先插 ⇒ rowid 最小
  SEED.code(mem, variant, "same.mjs", 1, 7)                          // 变体行后插（并列）
  const variantFirst = SEED.code(mem, variant, "other.mjs", 1, 1)    // 变体行先插 ⇒ rowid 最小
  SEED.code(mem, key, "other.mjs", 1, 1)                             // 归一键行后插（并列）
  sweepMemory(mem, { confirm: true, dbPath })
  assert.equal(Number(mem.db.prepare("SELECT rowid FROM code_chunks WHERE origin = ? AND path = 'same.mjs'").get(key).rowid), Number(canonicalFirst.lastInsertRowid), "并列取 rowid 最小者（归一键行先插）")
  assert.equal(Number(mem.db.prepare("SELECT rowid FROM code_chunks WHERE origin = ? AND path = 'other.mjs'").get(key).rowid), Number(variantFirst.lastInsertRowid), "并列取 rowid 最小者（变体行先插 ⇒ 变体行胜并改键）")
})

// ─── ② 干跑默认零写 ────────────────────────────────────────────────────────

test("S2 干跑默认：无 `--confirm` ⇒ 库零变（行 / 字节）+ 零备份 + 审计形态在位", async (t) => {
  const { base, dbPath, live, gone, mem } = fixture(t)
  SEED.code(mem, altSpelling(live), "a.mjs", 1, 10)
  SEED.code(mem, normalizeOrigin(gone), "b.mjs", 1, 1)
  const before = digest(mem)
  const bytes = statSync(dbPath).size

  const result = sweepMemory(mem, { dbPath })
  assert.equal(result.dryRun, true, "缺省 = 干跑")
  assert.deepEqual(digest(mem), before, "零写（行集不变）")
  assert.equal(statSync(dbPath).size, bytes, "零写（库字节不变）")
  assert.deepEqual(backupsIn(base), [], "干跑零备份")
  const lines = formatSweepReport(result)
  assert.match(lines[0], /dry-run（零写）/, "档位标注")
  assert.ok(lines.some((l) => /^origin=.* · 树存活=[是否] · code=\d+ \/ doc=\d+ \/ files=\d+ \/ 合计=\d+$/.test(l)), "逐 origin 行形态（§6.13 输出形态）")
  assert.ok(lines.some((l) => /^合计: code=\d+ \/ doc=\d+ \/ files=\d+ \/ 合计=\d+/.test(l)), "末行合计")
  assert.equal(result.backupPath, null, "干跑无备份路径")
})

// ─── ④⑨ 备份面 ─────────────────────────────────────────────────────────────

test("S3 备份面（`--confirm` 且命中 > 0 必取）：路径 = `<dbPath>.sweep-backup-<UTC yyyymmddHHMMSS>` 同目录 + 审计含路径", async (t) => {
  const { base, dbPath, live, mem } = fixture(t)
  SEED.code(mem, altSpelling(live), "a.mjs", 1, 10)
  const now = new Date("2026-09-25T06:07:08Z")
  const expected = `${dbPath}.sweep-backup-20260925060708`
  const result = sweepMemory(mem, { confirm: true, dbPath, now })
  assert.equal(result.backupPath, expected, "备份命名 = <dbPath>.sweep-backup-<UTC yyyymmddHHMMSS>")
  assert.equal(backupPathFor(dbPath, now), expected)
  assert.ok(existsSync(expected) && statSync(expected).size > 0, "备份在位且非空")
  assert.deepEqual(backupsIn(base), ["memory.db.sweep-backup-20260925060708"], "备份落同目录")
  assert.ok(formatSweepReport(result).some((l) => l === `备份: ${expected}`), "审计输出含备份路径")
  assert.equal(result.affected.folded, 1, "实写读数（折叠 1 行）")
})

test("S4 备份判据失败（目标已存在）⇒ 中止零写；零命中 / 干跑档零备份", async (t) => {
  const { base, dbPath, live, mem } = fixture(t)
  SEED.code(mem, altSpelling(live), "a.mjs", 1, 10)
  const now = new Date("2026-09-25T06:07:08Z")
  const taken = `${dbPath}.sweep-backup-20260925060708`
  writeFileSync(taken, "sentinel")
  const before = digest(mem)
  assert.throws(() => sweepMemory(mem, { confirm: true, dbPath, now }), /backup target already exists/, "目标已存在 ⇒ 抛（fail-closed）")
  assert.deepEqual(digest(mem), before, "中止零写（库零变）")
  assert.equal(statSync(taken).size, 8, "既有同名档未被覆盖")
  assert.deepEqual(backupsIn(base), ["memory.db.sweep-backup-20260925060708"], "中止面零新备份")

  // 零命中档（全活树无变体 ⇒ hits = 0）⇒ 不取备份
  const clean = fixture(t)
  SEED.code(clean.mem, normalizeOrigin(clean.live), "a.mjs", 1, 1)
  const zero = sweepMemory(clean.mem, { confirm: true, dbPath: clean.dbPath, now })
  assert.equal(zero.hits, 0, "零命中")
  assert.equal(zero.backupPath, null, "零命中档零备份（无回退对象）")
  assert.deepEqual(backupsIn(clean.base), [], "零命中档零备份（磁盘面）")

  // 无 dbPath（无命名依据）⇒ 拒绝写（备份前置不可省）——命中 > 0 的档才需回退对象
  assert.throws(() => sweepMemory(mem, { confirm: true }), /dbPath/, "无 dbPath ⇒ 拒绝无回退对象的写入")
})

// ─── ⑦⑧ `--origin` 档（靶向整档删除）────────────────────────────────────────

test("S5 `--origin` 档：目标三表归零（含变体）∧ 非目标 origin 零变 ∧ 活树亦可整删", async (t) => {
  const { base, dbPath, live, gone, mem } = fixture(t)
  const variant = altSpelling(live)
  const key = normalizeOrigin(live)
  const other = normalizeOrigin(gone)
  SEED.code(mem, live, "a.mjs", 1, 1)
  SEED.code(mem, variant, "a.mjs", 2, 1)
  SEED.doc(mem, variant, "d.md", 1, 1)
  SEED.files(mem, live, "f.md", 1)
  SEED.code(mem, other, "keep.mjs", 1, 1)

  const before = digest(mem)
  const dry = sweepMemory(mem, { origin: variant, dbPath })
  assert.equal(dry.rows.length, 1, "--origin 档逐行 = 目标一行")
  assert.equal(dry.rows[0].origin, key, "行 = 归一形（靶向键）")
  assert.equal(dry.rows[0].action, "delete")
  assert.equal(dry.rows[0].alive, true, "树存活读数在位（活树亦可整删）")
  assert.equal(dry.rows[0].total, 4, "范围含变体（4 行）")
  const lines = formatSweepReport(dry)
  assert.match(lines[0], /^memory sweep --origin .* · dry-run/, "档位行（--origin 靶向）")
  assert.ok(lines.some((l) => /^origin=.* · 树存活=是 · code=2 \/ doc=1 \/ files=1 \/ 合计=4$/.test(l)), "输出形态逐行（⑧）")
  assert.ok(lines.some((l) => /⚠ 树存活——显式点名整档删除/.test(l)), "活树附警示行（⑧）")
  assert.deepEqual(digest(mem), before, "`--origin` 干跑零写（⑧）")

  const keysBefore = perKey(mem)
  const result = sweepMemory(mem, { origin: variant, confirm: true, dbPath })
  const strip = (m) => Object.fromEntries(Object.entries(m).filter(([k]) => normalizeOrigin(k.slice(k.indexOf(":") + 1)) !== key))
  assert.deepEqual(strip(perKey(mem)), strip(keysBefore), "非目标 origin 零变（逐键等前值）")
  const leftover = []
  for (const t2 of ["code_chunks", "doc_chunks", "files"]) {
    for (const r of mem.db.prepare(`SELECT DISTINCT origin FROM ${t2}`).all()) if (normalizeOrigin(r.origin) === key) leftover.push(`${t2}:${r.origin}`)
  }
  assert.deepEqual(leftover, [], "目标归一键三表零命中（含变体）")
  assert.equal(result.affected.deleted, 4, "实写删除读数覆盖变体（4 行）")
  assert.equal(backupsIn(base).length, 1, "confirm 档取备份")
})

// ─── ⑤ 折叠单源唯一行（写后态）─────────────────────────────────────────────

test("S6 折叠唯一行断言：三表 (归一键, path[, line_start]) 恰一行（`files` 键 = (layer, path)）", async (t) => {
  const { dbPath, live, mem } = fixture(t)
  const variant = altSpelling(live)
  const key = normalizeOrigin(live)
  SEED.code(mem, key, "a.mjs", 1, 1); SEED.code(mem, variant, "a.mjs", 1, 9)
  SEED.doc(mem, variant, "d.md", 3, 1); SEED.doc(mem, key, "d.md", 3, 4)
  SEED.files(mem, variant, "f.md", 2); SEED.files(mem, key, "f.md", 1)
  sweepMemory(mem, { confirm: true, dbPath })
  for (const [t2, dup] of [["code_chunks", "path, line_start"], ["doc_chunks", "path, line_start"], ["files", "layer, path"]]) {
    const dupRows = mem.db.prepare(`SELECT COUNT(*) AS n FROM (SELECT 1 FROM ${t2} GROUP BY origin, ${dup} HAVING COUNT(*) > 1)`).get().n
    assert.equal(Number(dupRows), 0, `${t2}: 任一 (归一键, ${dup}) 恰一行`)
    const raw = mem.db.prepare(`SELECT COUNT(*) AS n FROM ${t2} WHERE origin <> ?`).get(key).n
    assert.equal(Number(raw), 0, `${t2}: 归一键集合 = 1（零残留原样键）`)
  }
  assert.equal(mem.db.prepare("SELECT mtime_ms FROM code_chunks").get().mtime_ms, 9, "折叠留 mtime 最大者")
  assert.ok(Number(mem.db.prepare("SELECT COUNT(*) AS n FROM code_chunks_fts WHERE code_chunks_fts MATCH 'x'").get().n) > 0, "FTS 随触发器同步（折叠后仍在索引）")
})
