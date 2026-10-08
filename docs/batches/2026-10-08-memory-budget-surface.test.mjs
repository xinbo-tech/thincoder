/**
 * 2026-10-08-memory-budget-surface.test.mjs — 行预算用户面收正批批内件（批档 §2.5 验收对照逐行 ·
 * 设计档 §6.14 面③ P2 ∥ L-③-5 ①–⑤ · 台账 #1107）。名随批次档 · 住批次目录 · 不进仓套件。
 *
 * 腿（判定句 → 机检形）：
 *   L-③-5 ① 常量：WARN = 100000 ∥ CAP = 300000（schema 直读）。
 *   L-③-5 ② WARN 行（计数桩 · 零真行 + baseOffset）：恰一行 console.warn ∥ 逐字 ∥ n = 真实行数
 *           （非阈值常量兜底 ∥ 非「+」截断形）∥ 无「WARN」∥ 无 declare ∥ prune ∥ sweep 形；
 *           缺省（无 baseOffset）= 实读核计数（零行 ⇒ 零输出）。
 *   L-③-5 ③ CAP 行：计数桩 ≥ CAP ⇒ 一行中性信息 + 一行优雅降级说明（单行输出——`Options:` 段同行）∥
 *           停收新档语义 ∥ 选项式指路双项 ∥ 无「WARN」；集成腿（真 5 文件 + baseOffset 计数偏移）⇒
 *           跳过 = 列序后缀 ∥ 逐 rel 零落行（不记 mtime）∥ 两跑跳过集逐字相等 ∥ 30 万真行不落。
 *   L-③-5 ④ 显示面随动：setup.mjs ∥ repomap.mjs 读常量（「+」界 ∥ B4 文件行上界同源）+ B3 注释
 *           值无关形（零旧值「20000」）+ buildSummary 正常规模出大纲（真实数——非「+」/非越界行）。
 *   L-③-5 ⑤ 零行为变化：over() ∕ add 刻度（WARN-1 +1 ⇒ 越线）∥ 回执 budgetSkipped（生产 codeSync
 *           实跑 · 真 5 文件全落）∥ logEvent 名（index:budget ∥ index:budget-cap）。
 *
 * 跑法（从仓库根 `thincoder/`）：node --test docs/batches/2026-10-08-memory-budget-surface.test.mjs
 *
 * 集成腿形态：注入缝 = `createRowBudget` 第五参 `{ baseOffset }`（设计档 §6.14 P2）；消费两入口
 * （code-sync.mjs ∥ docs.mjs）零改 ⇒ 计数偏移腿由本档按消费协议逐行直驱（发现 → rel 字典序 →
 * note() ∥ over() ⇒ 列序后缀跳过 ∥ 落库 + add 刻度）；生产路径实跑腿 = codeSync 缺省。
 */
import { after, test } from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { pathToFileURL } from "node:url"

const ROOT = process.cwd()
if (!existsSync(resolve(ROOT, "thincoder-core"))) throw new Error(`从仓库根（thincoder/）运行（cwd = ${ROOT}）`)
const mod = (rel) => import(pathToFileURL(resolve(ROOT, rel)).href)
const text = (rel) => readFileSync(resolve(ROOT, rel), "utf8")

const DIRS = []
const mkTmp = (tag) => { const d = mkdtempSync(join(tmpdir(), `mb-${tag}-`)); DIRS.push(d); return d }

// logEvent 捕获（零真家目录写入：测试缝 = 临时目录）
const logMod = await mod("thincoder-core/log.mjs")
const LOG_DIR = mkTmp("logs")
logMod._setLogsDirForTest(LOG_DIR)
const logEvents = () => {
  const p = logMod.todayLogPath()
  if (!existsSync(p)) return []
  return readFileSync(p, "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l))
}

after(() => {
  logMod._resetLogsDirForTest()
  for (const d of DIRS) { try { rmSync(d, { recursive: true, force: true, maxRetries: 3 }) } catch { /* 尽力清理 */ } }
})

/** console.warn 捕获（先例 = 2026-09-30-memory-db-family 批内件同款）。 */
const captureWarn = async (fn) => {
  const lines = []
  const orig = console.warn
  console.warn = (...a) => lines.push(a.map(String).join(" "))
  try { return { value: await fn(), lines } } finally { console.warn = orig }
}

const SCHEMA = "thincoder-core/memory/schema.mjs"
const TAIL = "thincoder-core/memory/sync-tail.mjs"
const { INDEX_ORIGIN_ROW_WARN, INDEX_ORIGIN_ROW_CAP } = await mod(SCHEMA)

// ─────────────────────────────── L-③-5 ① · 常量 ───────────────────────────────

test("L-③-5 ① 常量直读：WARN = 100000 ∥ CAP = 300000", async () => {
  assert.equal(INDEX_ORIGIN_ROW_WARN, 100000, "WARN = 10 万（用户裁定 2026-10-08）")
  assert.equal(INDEX_ORIGIN_ROW_CAP, 300000, "CAP = 30 万（用户裁定 2026-10-08）")
  assert.ok(INDEX_ORIGIN_ROW_CAP > INDEX_ORIGIN_ROW_WARN, "CAP > WARN")
})

// ─────────────────────────────── L-③-5 ② · WARN 行（计数桩）───────────────────────────────

test("L-③-5 ② WARN 行：计数桩（零真行）⇒ 恰一行 ∥ 逐字 ∥ 真数 ∥ 无「WARN」∥ 无指令形；缺省 = 实读核计数", async () => {
  const { createRowBudget } = await mod(TAIL)
  const { createMemory } = await mod(SCHEMA)
  const memory = createMemory({ dbPath: ":memory:" }) // 零真行——差额全由 baseOffset 注入
  const O = "D:/fx/mb-leg-warn"
  try {
    // 缺省（无 baseOffset）= 实读核计数：零行 ⇒ 零输出 ∥ over() false
    const plain = createRowBudget(memory, O, "code", O)
    const p = await captureWarn(() => { plain.note(); plain.note() })
    assert.equal(p.lines.length, 0, "缺省 = 实读核计数（零真行 ⇒ 零输出）")
    assert.equal(plain.over(), false, "零行 < CAP ⇒ over() false")

    // baseOffset = 123456（≥ WARN ∧ < CAP；非阈值常量——「真数非兜底」判别面）
    const b = createRowBudget(memory, O, "code", O, { baseOffset: 123456 })
    const c = await captureWarn(() => { b.note(); b.note(); b.note() })
    assert.equal(c.lines.length, 1, "恰一行 console.warn（每 origin 每趟至多一行）")
    assert.equal(c.lines[0], `[memory] index origin=${O} rows≈123456 (code + doc)`, "逐字（设计档 §6.14 P2 WARN 行）")
    assert.ok(!/WARN/.test(c.lines[0]), "无「WARN」字样")
    assert.ok(!/\d\+/.test(c.lines[0]), "非「+」截断形（「123456+」类）")
    assert.ok(!/declare|prune|sweep/.test(c.lines[0]), "无 declare ∕ prune ∕ sweep 形")
    assert.equal(b.over(), false, "123456 < CAP ⇒ over() false")

    // logEvent 名逐字（零改面）
    const evs = logEvents().filter((e) => e.dir === O)
    assert.equal(evs.length, 1, "恰一事件")
    assert.equal(evs[0].ev, "index:budget", "logEvent 名 = index:budget")
    assert.deepEqual(
      { kind: evs[0].kind, rows: evs[0].rows, warn: evs[0].warn },
      { kind: "code", rows: 123456, warn: 100000 },
      "logEvent 字段面（零改）",
    )
  } finally { memory.db.close() }
})

// ─────────────────────────────── L-③-5 ③ · CAP 行（计数桩）───────────────────────────────

test("L-③-5 ③ CAP 行：计数桩 ≥ CAP ⇒ 单行输出逐字（Options 段同行）∥ 停收新档 ∥ 选项式指路 ∥ 无「WARN」", async () => {
  const { createRowBudget } = await mod(TAIL)
  const { createMemory } = await mod(SCHEMA)
  const memory = createMemory({ dbPath: ":memory:" })
  const O = "D:/fx/mb-leg-cap"
  try {
    const b = createRowBudget(memory, O, "code", O, { baseOffset: 345678 })
    const c = await captureWarn(() => { b.note(); b.note() })
    assert.equal(c.lines.length, 2, "越 CAP 必先越 WARN：一行中性信息 + 一行优雅降级说明")
    assert.equal(c.lines[0], `[memory] index origin=${O} rows≈345678 (code + doc)`, "WARN 中性行同前（真实行数）")
    const capLine =
      `[memory] index origin=${O} rows≈345678 — index is at its size limit: ` +
      `new files are not being indexed for now (existing rows are kept and remain searchable). ` +
      `Options: exclude paths from indexing (index.excludePaths in PROJECT-MANIFEST.json), or remove old rows ` +
      `(thincoder memory sweep --origin "${O}" --path <sub>)`
    assert.equal(c.lines[1], capLine, "CAP 行逐字（设计档 §6.14 P2——单行输出）")
    assert.ok(capLine.includes("new files are not being indexed for now"), "停收新档语义")
    assert.ok(capLine.includes("Options:") && capLine.includes("index.excludePaths") && capLine.includes("memory sweep"), "选项式指路双项")
    assert.ok(!capLine.includes("WARN"), "无「WARN」")
    assert.equal(b.over(), true, "≥ CAP ⇒ over() true")

    const evs = logEvents().filter((e) => e.dir === O)
    const capEv = evs.find((e) => e.ev === "index:budget-cap")
    assert.ok(capEv, "logEvent 名 = index:budget-cap")
    assert.deepEqual({ kind: capEv.kind, rows: capEv.rows, cap: capEv.cap }, { kind: "code", rows: 345678, cap: 300000 }, "logEvent 字段面（零改）")
  } finally { memory.db.close() }
})

// ─────────────────────────────── L-③-5 ⑤ · 刻度（边界）───────────────────────────────

test("L-③-5 ⑤ 刻度：over() = rows ≥ CAP（CAP-1 未越 + add(1) 越）∥ add 推 WARN 越线（WARN-1 +1）", async () => {
  const { createRowBudget } = await mod(TAIL)
  const { createMemory } = await mod(SCHEMA)
  const memory = createMemory({ dbPath: ":memory:" })
  const O = "D:/fx/mb-leg-scale"
  try {
    // over() 刻度 = `>= CAP`（与 add 同刻度）
    const a = createRowBudget(memory, O, "code", O, { baseOffset: INDEX_ORIGIN_ROW_CAP - 1 })
    assert.equal(a.over(), false, "CAP-1 未越")
    a.add(1)
    assert.equal(a.over(), true, "add(1) ⇒ rows = CAP ⇒ 越")

    // add 推 WARN 越线（`>=` 边界）+ 越线行数 = 文本真数
    const b = createRowBudget(memory, O, "code", O, { baseOffset: INDEX_ORIGIN_ROW_WARN - 1 })
    const before = await captureWarn(() => b.note())
    assert.equal(before.lines.length, 0, "WARN-1 未越 ⇒ 零输出")
    b.add(1)
    const after = await captureWarn(() => b.note())
    assert.equal(after.lines.length, 1, "add(1) ⇒ rows = WARN ⇒ 越线")
    assert.equal(after.lines[0], `[memory] index origin=${O} rows≈${INDEX_ORIGIN_ROW_WARN} (code + doc)`, "add 后行数 = 文本真数（非阈值常量兜底）")
  } finally { memory.db.close() }
})

// ─────────────────────────────── L-③-5 ③⑤ · 集成腿（真 5 文件）───────────────────────────────

/**
 * 消费者协议直驱（消费两入口零改 ⇒ 计数偏移腿按 code-sync.mjs:191-200 ∥ docs.mjs:70-78 同款逐行驱）：
 * 发现（listProjectFiles）→ rel 字典序 → 逐档 `budget.note()` ∥ `budget.over()` ⇒ 列序后缀跳过
 * （不落行 ∕ 不记 mtime）∥ 落库（`_upsertCodeFile`）+ `budget.add(净增)`。
 */
async function budgetRun(dir, opts) {
  const { createRowBudget, rowCountOfPath } = await mod(TAIL)
  const { createMemory } = await mod(SCHEMA)
  const { normalizeOrigin } = await mod("thincoder-core/memory/origin.mjs")
  const { listProjectFiles, indexExtensions } = await mod("thincoder-core/memory/file-list.mjs")
  const { detectLanguage, _upsertCodeFile } = await mod("thincoder-core/memory/code-index.mjs")

  const origin = normalizeOrigin(dir)
  const memory = createMemory({ dbPath: ":memory:" })
  const { entries } = await listProjectFiles(dir, indexExtensions(dir).code)
  const files = entries.slice().sort((a, b) => (a.rel < b.rel ? -1 : a.rel > b.rel ? 1 : 0))
  const budget = createRowBudget(memory, origin, "code", dir, opts)
  const budgetSkipped = []
  const cap = await captureWarn(async () => {
    for (const { abs, rel } of files) {
      budget.note()
      if (budget.over()) { budgetSkipped.push(rel); continue }
      const before = rowCountOfPath(memory, "code_chunks", origin, rel)
      const lines = readFileSync(abs, "utf8").split("\n")
      _upsertCodeFile(memory, origin, rel, lines, detectLanguage(abs), Math.floor(statSync(abs).mtimeMs))
      budget.add(rowCountOfPath(memory, "code_chunks", origin, rel) - before)
    }
  })
  const rowsOf = (rel) => Number(memory.db.prepare(`SELECT COUNT(*) AS n FROM code_chunks WHERE origin = ? AND path = ?`).get(origin, rel)?.n ?? 0)
  const total = Number(memory.db.prepare(`SELECT COUNT(*) AS n FROM code_chunks WHERE origin = ?`).get(origin)?.n ?? 0)
  return { memory, files, budgetSkipped, warns: cap.lines, rowsOf, total }
}

test("L-③-5 ③⑤ 集成腿（真 5 文件）：缺省全落 + 回执 ∥ 计数偏移 ⇒ 跳过 = 列序后缀 ∥ 零落行 ∥ 两跑逐字相等 ∥ 30 万真行不落", async () => {
  const dir = mkTmp("int")
  const rels = ["f1.mjs", "f2.mjs", "f3.mjs", "f4.mjs", "f5.mjs"]
  for (const [i, rel] of rels.entries()) writeFileSync(join(dir, rel), `export const v${i + 1} = ${i + 1}\n`)

  // ⓪ 复刻保真：消费协议两处仍在（漂移即红——复刻面与本档耦合的明示）
  for (const f of ["thincoder-core/memory/code-sync.mjs", "thincoder-core/memory/docs.mjs"]) {
    const src = text(f)
    assert.ok(src.includes("budget.note()") && src.includes("budget.over()") && src.includes("budgetSkipped.push(rel)"), `消费协议在位：${f}`)
  }

  // ① 生产路径实跑（缺省——消费入口零改）：真 5 文件全落 ∥ 回执 budgetSkipped 空列 ∥ 零警告
  const { codeSync } = await mod("thincoder-core/memory/code-sync.mjs")
  const { normalizeOrigin } = await mod("thincoder-core/memory/origin.mjs")
  const { createMemory } = await mod(SCHEMA)
  const mem = createMemory({ dbPath: ":memory:" })
  try {
    const { value: res, lines: warns } = await captureWarn(() => codeSync(mem, dir))
    assert.equal(res.updated, 5, "全落（真 5 文件）")
    assert.ok(Array.isArray(res.budgetSkipped) && res.budgetSkipped.length === 0, "回执 budgetSkipped = 空列（未越线）")
    assert.equal(warns.length, 0, "零警告（真实计数 ≪ WARN）")
    const origin = normalizeOrigin(dir)
    for (const rel of rels) {
      const n = Number(mem.db.prepare(`SELECT COUNT(*) AS n FROM code_chunks WHERE origin = ? AND path = ?`).get(origin, rel)?.n ?? 0)
      assert.ok(n > 0, `行在：${rel}`)
    }
  } finally { mem.db.close() }

  // ② 计数偏移 = CAP - 1：f1 落（CAP-1 < CAP；越 WARN 出中性行）⇒ 其后列序后缀全跳过
  const r1 = await budgetRun(dir, { baseOffset: INDEX_ORIGIN_ROW_CAP - 1 })
  try {
    assert.deepEqual(r1.files.map((f) => f.rel), rels, "真 5 文件全在列（rel 字典序）")
    assert.deepEqual(r1.budgetSkipped, ["f2.mjs", "f3.mjs", "f4.mjs", "f5.mjs"], "跳过 = 列序后缀")
    for (const rel of r1.budgetSkipped) assert.equal(r1.rowsOf(rel), 0, `跳过零落行（不记 mtime）：${rel}`)
    assert.ok(r1.rowsOf("f1.mjs") > 0, "CAP 前文件照落")
    assert.equal(r1.warns.length, 2, "一行中性信息 + 一行优雅降级说明")
    assert.equal(r1.total, r1.rowsOf("f1.mjs"), "落库 = CAP 前文件行数（列序后缀零落）")
    assert.ok(r1.total < 50, "30 万真行不落（计数偏移承担差额）")
  } finally { r1.memory.db.close() }

  // ③ 两跑（两独立实计会话）跳过集逐字相等
  const r2 = await budgetRun(dir, { baseOffset: INDEX_ORIGIN_ROW_CAP - 1 })
  try {
    assert.deepEqual(r2.budgetSkipped, r1.budgetSkipped, "两跑跳过集逐字相等（处理序确定性）")
    assert.equal(JSON.stringify(r2.budgetSkipped), JSON.stringify(r1.budgetSkipped), "逐字形")
  } finally { r2.memory.db.close() }
})

// ─────────────────────────────── L-③-5 ④ · 显示面随动 ───────────────────────────────

test("L-③-5 ④ 显示面随动：setup ∥ repomap 读常量（B3 注释值无关形）∥ B4 界随常量（零改）∥ 正常规模出大纲", async () => {
  const setup = text("thincoder-core/agent/setup.mjs")
  assert.ok(setup.includes("const bound = INDEX_ORIGIN_ROW_WARN + 1"), "B3 界 = WARN+1（随常量）")
  assert.ok(setup.includes("`${INDEX_ORIGIN_ROW_WARN}+`"), "「+」形 = WARN 线随动（现值 ⇒ 100000+）")
  const b3Comment = setup.split("\n").find((l) => l.includes("§6.14 B3"))
  assert.ok(b3Comment, "B3 注释在位")
  assert.ok(!b3Comment.includes("20000"), "注释值面收正（零旧值「20000」）")
  assert.ok(!/\d{4,}/.test(b3Comment), "值无关形（零 4 位以上数值）")

  const repo = text("thincoder-core/tools/repomap.mjs")
  assert.ok(repo.includes("const limit = INDEX_ORIGIN_ROW_WARN + 1"), "B4 文件行上界同源（LIMIT = WARN+1——零改）")
  assert.ok(repo.includes("> ${INDEX_ORIGIN_ROW_WARN} files"), "B4 越界提示行数值随常量（现值 ⇒ > 100000 files——零改）")

  // 行为：正常规模（2 档 ≪ WARN）⇒ buildSummary 出大纲（真实数——非「+」截断 / 非越界行）
  const { buildSummary } = await mod("thincoder-core/tools/repomap.mjs")
  const { createMemory } = await mod(SCHEMA)
  const { normalizeOrigin } = await mod("thincoder-core/memory/origin.mjs")
  const { _upsertCodeFile } = await mod("thincoder-core/memory/code-index.mjs")
  const dir = mkTmp("b4")
  mkdirSync(join(dir, "src"), { recursive: true })
  writeFileSync(join(dir, "src", "a.mjs"), "export const a = 1\n")
  writeFileSync(join(dir, "src", "b.mjs"), "import { a } from './a.mjs'\nexport const b = a\n")
  const memory = createMemory({ dbPath: ":memory:" })
  try {
    const origin = normalizeOrigin(dir)
    for (const rel of ["src/a.mjs", "src/b.mjs"]) {
      const abs = join(dir, ...rel.split("/"))
      _upsertCodeFile(memory, origin, rel, readFileSync(abs, "utf8").split("\n"), "javascript", Math.floor(statSync(abs).mtimeMs))
    }
    const summary = await buildSummary(memory.db, dir, { origin })
    assert.match(summary, /^2 source files indexed\./, "正常规模 = 真实文件数（非「+」形）")
    assert.ok(!summary.startsWith("(code index too large"), "未越界 ⇒ 非越界行")
  } finally { memory.db.close() }
})
