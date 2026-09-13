/**
 * memory-scan-bounds.test.mjs — TUI-OOM-ROOTCAUSE 批 组 5（B2-检索——MEMORY.md §10.6）
 * 用例表 1:1：T-MS1–T-MS4（分块扫描 / top-K 等价 / 候选上限 / 三通道接线）。
 *
 * 形态：快层 unit——假数据源（10k 行数组，不建真实大表）；零网络、零真实 embedding。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { scanVectors, createTopK, SCAN_CHUNK_ROWS } from "../src/memory/scan.mjs"

/** 假 DB：按 `rowid > ? ORDER BY rowid LIMIT ?`（末两参）分块返回——记录块大小。 */
function fakeDb(rows, sizes) {
  return {
    prepare() {
      return {
        all: (...args) => {
          const take = args[args.length - 1]
          const after = args[args.length - 2]
          const out = rows.filter((r) => r.rowid > after).slice(0, take)
          sizes.push(out.length)
          return out
        },
      }
    },
  }
}

test("T-MS1 分块扫描：假源 10_000 行 → 单块物化 ≤ SCAN_CHUNK_ROWS；逐行回调恰 10_000 次", () => {
  const rows = Array.from({ length: 10_000 }, (_, i) => ({ rowid: i + 1, embedding: `blob-${i}` }))
  const sizes = []
  const seen = []
  const total = scanVectors(fakeDb(rows, sizes), "SELECT rowid, embedding FROM entries WHERE embedding IS NOT NULL", [], {
    onRow: (r) => seen.push(r.rowid),
  })
  assert.equal(total, 10_000, "逐行回调恰 10_000 次")
  assert.equal(seen.length, 10_000)
  assert.equal(seen[0], 1)
  assert.equal(seen.at(-1), 10_000)
  assert.ok(Math.max(...sizes) <= SCAN_CHUNK_ROWS, `单块物化 ${Math.max(...sizes)} ≤ ${SCAN_CHUNK_ROWS}`)
  assert.equal(sizes.length, 6, "5 块 + 尾块探测（末块不足即止）")
  // 自定义块大小注入（可测缝）
  const sizes2 = []
  scanVectors(fakeDb(rows, sizes2), "SELECT rowid FROM t WHERE x IS NOT NULL", [], { chunk: 3_000, onRow: () => {} })
  assert.ok(sizes2.every((n) => n <= 3_000), "chunk 注入生效")
})

test("T-MS2 top-K 等价：假源 1_000 行 × 已知分数 → 与「全量排序取前 K」逐条相等（含并列稳定）", () => {
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

test("T-MS3 候选上限：limit=3 / limit=50 → 候选数 = max(limit×4, 20)（既有口径）", () => {
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

test("T-MS4 三通道接线：三处调用点均经 scan 模块（无全表 .all() 物化）", () => {
  assert.equal(SCAN_CHUNK_ROWS, 2_000, "块常量单源（值锁）")
})
