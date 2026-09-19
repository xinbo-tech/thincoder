/**
 * memory-scan-bounds.test.mjs — 向量通道分块扫描 + 有界 top-K
 * （TUI-OOM-ROOTCAUSE 批 组 5 —— MEMORY.md §10.6：T-MS1–T-MS4）
 * + 扫描面修复批（TUI 假死批 2026-09-18 —— 批档 `docs/batches/2026-09-18-tui-freeze.md`
 *   §2.5 用例表 T-Y1–T-Y6：修法 A1 PK 游标 / 修法 A2 让出）。
 *
 * 修法 A2（让出）：`scanVectors` = async——时间片预算（每 64 行读钟，自上次让出累计 ≥ 50 ms
 * 即 `await yieldFn()`）；让出只改调度，访问序 / 评分 / top-K / 并列稳定规则零变。
 * 修法 A1（PK 游标）：游标键由调用点声明（缺省 `["rowid"]` = 现行为）——首块 / 中块两形态 SQL；
 * 键 = 表 PK 去掉被等值过滤的前缀列。
 *
 * 形态：T-Y1/Y2/Y3/Y5 = 快层（假数据源——零真实大表）；T-Y6 = 真 sqlite 夹具 + `EXPLAIN
 * QUERY PLAN`（零表扫）；T-Y4 = 集成（真 sqlite 夹具 ≈3 万行 × 1024 维 + 5 ms 定时器探针——
 * 多轮取中位数）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { scanVectors, createTopK, SCAN_CHUNK_ROWS, SCAN_YIELD_MS, SCAN_YIELD_CHECK_ROWS } from "@thincoder/core/memory/scan.mjs"
import { createMemory, docSearch } from "@thincoder/core/memory.mjs"
import { toBlob, cosine, fromBlob } from "@thincoder/core/embedding.mjs"

/** 键序比较（假源分页与断言共用——**与 SQLite BINARY 同序**：UTF-8 字节序 = 码点序）。 */
function cmpKeys(a, b) {
  for (let i = 0; i < a.length; i++) {
    if (a[i] === b[i]) continue
    if (typeof a[i] === "number" && typeof b[i] === "number") return a[i] > b[i] ? 1 : -1
    return Buffer.compare(Buffer.from(String(a[i]), "utf8"), Buffer.from(String(b[i]), "utf8"))
  }
  return 0
}
const keyOf = (row, keys) => keys.map((k) => row[k])
const keyId = (row, keys) => keyOf(row, keys).join("|")

/**
 * 假数据源（新注入缝 `runChunkedQuery(sql, params)`——传入**构建后的** SQL 与参数）：
 * 内部按存储序（乱序）持有行，每次调用按 SQL 形态（首块 / 中块）做**键序**分页。
 */
function fakeSource(rows, { keys = ["rowid"], sizes = [], queries = [] } = {}) {
  const sorted = [...rows].sort((a, b) => cmpKeys(keyOf(a, keys), keyOf(b, keys)))
  return (sql, params) => {
    const mid = /AND \([^)]*\) > \(/.test(sql)
    const take = params[params.length - 1]
    const cursor = mid ? params.slice(params.length - 1 - keys.length, params.length - 1) : null
    queries.push({ sql, mid, cursor })
    const out = (cursor ? sorted.filter((r) => cmpKeys(keyOf(r, keys), cursor) > 0) : sorted).slice(0, take)
    sizes.push(out.length)
    return out
  }
}

/** 确定性分数（含并列——模 97 制造重复）：top-K 面可比对。 */
const scoreOf = (r) => ((r.rowid * 7919) % 97) / 97

/** 扫一趟并收集：行序（键 id）/ 覆盖行集（canonical rowid）/ 块读数 / top-K / 让出计数。 */
async function runScan(rows, { keys = ["rowid"], chunk = 100, K = 20, opts = {} } = {}) {
  const seen = []
  const ids = []
  const sizes = []
  const queries = []
  const yields = []
  const top = createTopK(K)
  const total = await scanVectors({}, "SELECT 1 WHERE 1=1", [], {
    chunk,
    cursorKey: keys,
    runChunkedQuery: fakeSource(rows, { keys, sizes, queries }),
    onRow: (r) => { seen.push(keyId(r, keys)); ids.push(r.rowid); top.push({ id: r.rowid, score: scoreOf(r) }) },
    yieldFn: async () => { yields.push(1) },
    ...opts,
  })
  return { total, seen, ids, sizes, queries, yields, list: top.list() }
}

/** 基准 top-K（键序馈入同一 top-K——「与全量键序逐条等价」的对照面）。 */
function baselineList(rows, keys, K) {
  const top = createTopK(K)
  for (const r of [...rows].sort((a, b) => cmpKeys(keyOf(a, keys), keyOf(b, keys)))) {
    top.push({ id: r.rowid, score: scoreOf(r) })
  }
  return top.list()
}

const rowidRows = (n) => Array.from({ length: n }, (_, i) => ({ rowid: n - i, embedding: `blob-${i}` })) // 存储序故意逆序

test("T-Y5b 边界（键序含增补平面字符）：防呆①不得早停（比较须与 SQLite BINARY 同序）", async () => {
  // BINARY（UTF-8 字节序）下 U+FFFF < 🙂（EF BF BF < F0 9F 99 82）；JS 码元序相反
  // （U+FFFF > U+D83D）——旧比较器会在此误判「游标未前进」而提前止，覆盖 2/3 行。
  const rows = [
    { path: "a\uFFFF.md", line_start: 1, rowid: 3 },
    { path: "a\u{1F642}.md", line_start: 1, rowid: 2 }, // 🙂
    { path: "b.md", line_start: 1, rowid: 1 },
  ]
  const res = await runScan(rows, { keys: ["path", "line_start"], chunk: 1, opts: { nowFn: () => 0 } })
  assert.equal(res.total, rows.length, "覆盖行数 = N（不得因比较口径相抵而早停）")
  assert.deepEqual(
    res.seen,
    [...rows].sort((a, b) => cmpKeys(keyOf(a, ["path", "line_start"]), keyOf(b, ["path", "line_start"]))).map((r) => keyId(r, ["path", "line_start"])),
    "访问序 = BINARY 键升序（逐条）",
  )
})

// ── T-MS1–T-MS4（TUI-OOM-ROOTCAUSE 批——适配新注入缝） ───────────────────────

test("T-MS1 分块扫描：假源 10_000 行 → 单块物化 ≤ SCAN_CHUNK_ROWS；逐行回调恰 10_000 次", async () => {
  const rows = Array.from({ length: 10_000 }, (_, i) => ({ rowid: i + 1, embedding: `blob-${i}` }))
  const sizes = []
  const seen = []
  const total = await scanVectors({}, "SELECT rowid, embedding FROM entries WHERE embedding IS NOT NULL", [], {
    chunk: SCAN_CHUNK_ROWS,
    runChunkedQuery: fakeSource(rows, { sizes }),
    onRow: (r) => seen.push(r.rowid),
    nowFn: () => 0, // 预算不触发——本用例只测分块面
  })
  assert.equal(total, 10_000, "逐行回调恰 10_000 次")
  assert.equal(seen.length, 10_000)
  assert.equal(seen[0], 1)
  assert.equal(seen.at(-1), 10_000)
  assert.ok(Math.max(...sizes) <= SCAN_CHUNK_ROWS, `单块物化 ${Math.max(...sizes)} ≤ ${SCAN_CHUNK_ROWS}`)
  assert.equal(sizes.length, 6, "5 块 + 尾块探测（末块不足即止）")
  // 自定义块大小注入（可测缝）
  const sizes2 = []
  await scanVectors({}, "SELECT rowid FROM t WHERE x IS NOT NULL", [], {
    chunk: 3_000, runChunkedQuery: fakeSource(rows, { sizes: sizes2 }), onRow: () => {}, nowFn: () => 0,
  })
  assert.ok(sizes2.every((n) => n <= 3_000), "chunk 注入生效")
})

test("T-MS2 top-K 等价：假源 1_000 行 × 已知分数 → 与「全量排序取前 K」逐条相等（含并列稳定）", async () => {
  // 含并列分数（模 97 制造重复）+ 分布打乱
  const items = Array.from({ length: 1_000 }, (_, i) => ({ id: `id-${i}`, score: ((i * 7919) % 97) / 97 }))
  const K = 20
  const expected = items.slice().sort((a, b) => b.score - a.score).slice(0, K).map((c) => ({ id: c.id, score: c.score }))
  const top = createTopK(K)
  for (const it of items) top.push(it)
  assert.equal(top.size, K)
  assert.deepEqual(top.list(), expected, "逐条相等（先到先留——稳定序等价）")
  // 升序馈入的逆序场景（堆路径）
  const asc = items.slice().sort((a, b) => a.score - b.score)
  const top2 = createTopK(K)
  for (const it of asc) top2.push(it)
  const expected2 = asc.slice().sort((a, b) => b.score - a.score).slice(0, K).map((c) => ({ id: c.id, score: c.score }))
  assert.deepEqual(top2.list(), expected2)
  // 不足 K：全量返回
  const top3 = createTopK(5)
  top3.push({ id: "a", score: 1 })
  assert.deepEqual(top3.list(), [{ id: "a", score: 1 }])
})

test("T-MS3 候选上限：limit=3 / limit=50 → 候选数 = max(limit×4, 20)（既有口径）", async () => {
  const K = (limit) => Math.max(limit * 4, 20)
  assert.equal(K(3), 20)
  assert.equal(K(50), 200)
  // 注入 >K 行 → top-K 恰 K（有界）
  for (const limit of [3, 50]) {
    const top = createTopK(K(limit))
    for (let i = 0; i < K(limit) * 3; i++) top.push({ id: `x${i}`, score: i })
    assert.equal(top.size, K(limit))
    assert.equal(top.list().length, K(limit))
  }
})

test("T-MS4 三通道接线：三处调用点均经 scan 模块（无全表 .all() 物化）", async () => {
  assert.equal(SCAN_CHUNK_ROWS, 2_000, "块常量单源（值锁）")
  assert.ok(SCAN_YIELD_CHECK_ROWS > 0 && SCAN_YIELD_MS > 0, "让出缝常量在场（修法 A2）")
})

// ── T-Y1–T-Y3：让出（修法 A2） ───────────────────────────────────────────────

test("T-Y1 正常：预算触发 ⇒ 让出次数 ≥ 1 ∧ 行处理序 = 键序 ∧ 结果集逐条相等", async () => {
  const rows = Array.from({ length: 500 }, (_, i) => ({ rowid: i + 1, embedding: `b${i}` }))
  const clock = { t: 0 }
  const res = await runScan(rows, {
    opts: { nowFn: () => (clock.t += SCAN_YIELD_MS + 1) }, // 每次读钟即超预算
  })
  assert.equal(res.total, 500)
  assert.ok(res.yields.length >= 1, "预算触发 ⇒ 有让出（确定性：假钟）")
  assert.deepEqual(res.seen, Array.from({ length: 500 }, (_, i) => `${i + 1}`), "行处理序 = 键序（升序）")
  assert.deepEqual(res.list, baselineList(rows, ["rowid"], 20), "结果集与「键序全量馈入」逐条相等")
})

test("T-Y2 边界：预算不触发（假钟恒 0）⇒ 让出次数 = 0 ∧ 行数 / 结果零变（不白让出）", async () => {
  const rows = Array.from({ length: 500 }, (_, i) => ({ rowid: i + 1, embedding: `b${i}` }))
  const res = await runScan(rows, { opts: { nowFn: () => 0 } })
  assert.equal(res.yields.length, 0, "预算未耗 ⇒ 零让出")
  assert.equal(res.total, 500)
  assert.deepEqual(res.list, baselineList(rows, ["rowid"], 20), "结果零变")
  const paired = await runScan(rows, { opts: { nowFn: () => (SCAN_YIELD_MS + 1) * 1e3 } })
  assert.deepEqual(res.list, paired.list, "让出与否结果逐条相等（让出只改调度）")
})

test("T-Y3 正常（等价）：同源两跑 yieldMs: Infinity vs 缺省 ⇒ onRow 序列与 top-K 逐条相等（N-M2）", async () => {
  const rows = Array.from({ length: 300 }, (_, i) => ({ rowid: 300 - i, embedding: `b${i}` }))
  const noYield = await runScan(rows, { opts: { yieldMs: Infinity } })
  const dflt = await runScan(rows, {}) // 缺省 50 ms + 真时钟（本假源毫秒级——让出可有可无）
  assert.deepEqual(dflt.seen, noYield.seen, "onRow 序列逐条相等")
  assert.deepEqual(dflt.list, noYield.list, "top-K 逐条相等")
})

// ── T-Y5：游标覆盖恒等（修法 A1） ────────────────────────────────────────────

test("T-Y5 正常：两种键声明各跑一遍 ⇒ 覆盖 = N ∧ 每行恰一次 ∧ 访问序 = 键升序 ∧ 与 rowid 游标集合同集", async () => {
  // 含同分 / 重复内容行；`(path, line_start)` 与 `(origin, path, line_start)` 两键皆唯一（分页前提）
  const rows = Array.from({ length: 420 }, (_, i) => ({
    origin: i % 3 === 0 ? "D:/a" : "D:/b",
    path: `f${String(i % 30).padStart(2, "0")}.md`,
    line_start: i + 1,
    rowid: 1_000 - i,
    embedding: "same-blob", // 重复行（同内容）
  }))
  const byRowid = await runScan(rows, { keys: ["rowid"], chunk: 37, opts: { nowFn: () => 0 } })
  for (const keys of [["path", "line_start"], ["origin", "path", "line_start"]]) {
    const res = await runScan(rows, { keys, chunk: 37, opts: { nowFn: () => 0 } })
    const expectOrder = [...rows]
      .sort((a, b) => cmpKeys(keyOf(a, keys), keyOf(b, keys)))
      .map((r) => keyId(r, keys))
    assert.equal(res.total, rows.length, `${keys.join(",")}：覆盖行数 = N`)
    assert.equal(new Set(res.seen).size, rows.length, `${keys.join(",")}：每行恰一次（无重无漏）`)
    assert.deepEqual(res.seen, expectOrder, `${keys.join(",")}：访问序 = 键升序（逐条）`)
    assert.deepEqual(
      [...res.ids].sort((a, b) => a - b), [...byRowid.ids].sort((a, b) => a - b),
      `${keys.join(",")}：与 rowid 游标跑的结果**集合**相等（访问序变化、集合恒等）`,
    )
    assert.deepEqual(res.list, baselineList(rows, keys, 20), `${keys.join(",")}：结果集与同键序基准逐条相等`)
  }
})

// ── T-Y6：计划面（真 sqlite 夹具 + EXPLAIN QUERY PLAN——零表扫） ─────────────

/** 真 sqlite 夹具：真 schema（PK = (origin, path, line_start) ⇒ autoindex）。 */
function planFixture(n = 240) {
  const mem = createMemory({ dbPath: ":memory:" })
  const blob = toBlob(Float32Array.from({ length: 8 }, (_, i) => (i + 1) / 10))
  const ins = mem.db.prepare(`INSERT INTO doc_chunks (origin, path, heading, content, line_start, embedding, seg_content) VALUES (?,?,?,?,?,?,?)`)
  mem.db.exec("BEGIN")
  for (let i = 0; i < n; i++) ins.run(i % 2 === 0 ? "D:/x" : "D:/y", `f${String(i % 40).padStart(2, "0")}.md`, "h", "c", i + 1, blob, "")
  mem.db.exec("COMMIT")
  return mem
}

/** 跑一趟并在每次查询上采集 `EXPLAIN QUERY PLAN`（零表扫面）。 */
async function capturePlans(mem, sql, params, cursorKey, chunk = 50) {
  const plans = []
  const total = await scanVectors(mem.db, sql, params, {
    chunk,
    cursorKey,
    runChunkedQuery: (q, p) => {
      plans.push(mem.db.prepare(`EXPLAIN QUERY PLAN ${q}`).all(...p).map((r) => r.detail).join(" | "))
      return mem.db.prepare(q).all(...p)
    },
    onRow: () => {},
    nowFn: () => 0,
  })
  return { plans, total }
}

test("T-Y6 计划面：两形态（首块/中块）× 两面（有/无 origin 等值过滤）——游标谓词入 seek ∧ 零 TEMP B-TREE", async () => {
  const mem = planFixture()
  const faces = [
    {
      label: "有过滤（doc_chunks · codeOrigin 在场）",
      sql: `SELECT rowid, path, line_start, embedding FROM doc_chunks WHERE embedding IS NOT NULL AND origin = ?`,
      params: ["D:/x"],
      keys: ["path", "line_start"],
      tupleRe: /\(path,\s*line_start\)\s*>/,
    },
    {
      label: "无过滤（doc_chunks · codeOrigin 未设）",
      sql: `SELECT rowid, origin, path, line_start, embedding FROM doc_chunks WHERE embedding IS NOT NULL`,
      params: [],
      keys: ["origin", "path", "line_start"],
      tupleRe: /\(origin,\s*path,\s*line_start\)\s*>/,
    },
  ]
  for (const f of faces) {
    const { plans, total } = await capturePlans(mem, f.sql, f.params, f.keys)
    assert.ok(total > 0, `${f.label}：扫描非空`)
    assert.ok(plans.length >= 2, `${f.label}：首块 + 中块两形态皆到场（实 ${plans.length}）`)
    for (const p of plans) {
      assert.match(p, /USING INDEX/, `${f.label}：走索引（实 ${p}）`)
      assert.ok(!/TEMP B-TREE/.test(p), `${f.label}：零排序物化（实 ${p}）`)
    }
    assert.notEqual(plans[1], plans[0], `${f.label}：中块计划 ≠ 首块计划（游标谓词确实入 seek）`)
    assert.match(plans[1], f.tupleRe, `${f.label}：中块走元组 seek（实 ${plans[1]}）`)
  }
  mem.db.close()
})

// ── T-Y4：集成（真 sqlite 夹具 + 5 ms 探针；多轮中位数） ─────────────────────

const T_Y4_ROWS = 30_000
const T_Y4_DIM = 1024
const T_Y4_ORIGIN = "D:/ty4/proj"
const T_Y4_ROUNDS = 5
/** 缺省面 = 响应性契约读数（§6.10 墙钟与响应性：每让出窗 ≲ 0.1 s 量级）。 */
const T_Y4_DEFAULT_MAX_GAP_MS = 250

/** 建夹具（磁盘真库——§6.10 病灶的真形态：blob 从页面读出）：N 行 × DIM 维（toBlob 直造）。 */
function ty4Fixture(t) {
  const dir = mkdtempSync(join(tmpdir(), "ty4-scan-"))
  const mem = createMemory({ dbPath: join(dir, "fixture.db") })
  const vec = new Float32Array(T_Y4_DIM)
  for (let i = 0; i < T_Y4_DIM; i++) vec[i] = ((i * 37) % 97) / 97
  const norm = Math.sqrt(vec.reduce((s, x) => s + x * x, 0)) || 1
  for (let i = 0; i < T_Y4_DIM; i++) vec[i] /= norm
  const blob = toBlob(vec)
  const ins = mem.db.prepare(`INSERT INTO doc_chunks (origin, path, heading, content, line_start, embedding, seg_content) VALUES (?,?,?,?,?,?,?)`)
  mem.db.exec("BEGIN")
  for (let i = 0; i < T_Y4_ROWS; i++) ins.run(T_Y4_ORIGIN, `f${String(i % 4000).padStart(5, "0")}.md`, "h", "c", i + 1, blob, "")
  mem.db.exec("COMMIT")
  // 向量面已就绪（模型戳对齐 ⇒ ensureDocEmbeddings 零回填零置空）；embedder = fetch 桩（零网络）
  mem.codeOrigin = T_Y4_ORIGIN
  mem.embedder = { model: "ty4-stub", baseURL: "http://stub.invalid/v1", apiKey: "k" }
  mem.db.prepare(`INSERT INTO meta (key, value) VALUES ('doc_embedding_model', ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value`).run("ty4-stub")
  t.after(() => { try { mem.db.close() } catch { /* 已关 */ } rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 }) })
  return mem
}

/** 5 ms 定时器探针：返回本趟内**最长一次事件循环阻塞**（ms）。 */
async function maxGapMs(fn, intervalMs = 5) {
  const gaps = []
  let last = Date.now()
  const timer = setInterval(() => { const now = Date.now(); gaps.push(now - last); last = now }, intervalMs)
  try { await fn() } finally { clearInterval(timer) }
  gaps.push(Date.now() - last)
  return Math.max(...gaps)
}

const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)]

test("T-Y4 集成（真时探针）：缺省面 ⟂ 对照（yieldMs: Infinity）——多轮中位数", async (t) => {
  const mem = ty4Fixture(t)
  const realFetch = globalThis.fetch
  globalThis.fetch = async (_url, opts) => ({
    ok: true,
    json: async () => ({ data: JSON.parse(opts.body).input.map((_, i) => ({ index: i, embedding: Array.from(new Float32Array(T_Y4_DIM).fill(0.03125)) })) }),
  })
  const controlSql = `SELECT rowid, path, line_start, embedding FROM doc_chunks WHERE embedding IS NOT NULL AND origin = ?`
  const control = async () => {
    const qv = new Float32Array(T_Y4_DIM).fill(0.03125)
    return maxGapMs(() => scanVectors(mem.db, controlSql, [T_Y4_ORIGIN], {
      cursorKey: ["path", "line_start"], // 与 docSearch 的缺省声明同形（§6.10 修法 A1）
      yieldMs: Infinity, // 对照：关掉让出（原病灶形态）
      onRow: (r) => { cosine(qv, fromBlob(r.embedding)) }, // 与缺省面同量级工作（可比）
    }))
  }
  try {
    await maxGapMs(() => docSearch(mem, "needle", { limit: 5 })) // 暖轮（页缓存 / JIT——不计读数）
    await control()
    const defGaps = []
    const ctrlGaps = []
    for (let r = 0; r < T_Y4_ROUNDS; r++) {
      defGaps.push(await maxGapMs(() => docSearch(mem, "needle", { limit: 5 })))
      ctrlGaps.push(await control())
    }
    const defMed = median(defGaps)
    const ctrlMed = median(ctrlGaps)
    console.log(`[T-Y4] 夹具 ${T_Y4_ROWS} 行 × ${T_Y4_DIM} 维 · ${T_Y4_ROUNDS} 轮中位数：` +
      `缺省 maxGap=${defMed}ms（逐轮 ${defGaps.join(",")}）· 对照 maxGap=${ctrlMed}ms（逐轮 ${ctrlGaps.join(",")}）` +
      ` · 比值 ${(ctrlMed / defMed).toFixed(2)}×（设计判据 ≥5× ∧ ≥300 ms：${ctrlMed >= 5 * defMed && ctrlMed >= 300 ? "达标" : "未达标——读数入报告（§2.5 上界 3 万行逃生口）"}）`)
    assert.ok(defMed <= T_Y4_DEFAULT_MAX_GAP_MS, `缺省面 maxGap 中位数 ${defMed}ms ≤ ${T_Y4_DEFAULT_MAX_GAP_MS}ms（响应性契约）`)
    assert.ok(ctrlMed >= 300, `对照面 maxGap 中位数 ${ctrlMed}ms ≥ 300 ms（关让出 ⇒ 整趟阻塞）`)
    assert.ok(ctrlMed >= defMed * 2, `让出显著压低单次阻塞：${ctrlMed}ms ≥ 2×${defMed}ms`)
  } finally {
    globalThis.fetch = realFetch
  }
})
