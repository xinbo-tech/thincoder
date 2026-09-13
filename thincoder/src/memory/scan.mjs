/**
 * memory/scan.mjs — 检索向量通道的分块扫描 + 有界 top-K（TUI-OOM-ROOTCAUSE 批——MEMORY.md §10）。
 *
 * 病灶（§10.1）：三张表的向量通道全表 `.all()` 物化后逐行 cosine + 全量排序——无 SQL LIMIT、
 * 无分块（本机 memory.db ~736MB，embedding BLOB 为体量主源）。本模块把扫描改为
 * **rowid 游标分块**（块 `SCAN_CHUNK_ROWS`）+ **有界 top-K**（升序小顶堆——候选集
 * ≤ max(limit×4, 20) 既有口径）：峰值 = 块 + K；召回语义不变（仍全表评分，D-M1/D-M4）。
 *
 * 对外结构不变：调用方拿到的仍是 `[{id, score}]` 降序候选（RRF 融合输入）——并列分数按
 * 既有排序稳定性规则（先到先留——与「全量稳定 sort + slice(0,K)」等价）。
 *
 * 可测缝（N-M1）：`scanVectors` 接受注入的 `runChunkedQuery`（默认真实 DB 实现——
 * `AND rowid > ? ORDER BY rowid LIMIT ?`）；测试以假数据源直测块大小/top-K/等价性
 * （不建真实大表）。
 */

/** 单块行数（单源——三处共用；D-M2：块内存量级 KB~MB，随维度有界）。 */
export const SCAN_CHUNK_ROWS = 2_000

/**
 * 有界 top-K（升序小顶堆）：`push({id, score})` 摊销 O(log K)；`list()` 返回降序
 * `[{id, score}]`。并列分数先到先留（与全量稳定排序一致）。
 */
export function createTopK(k) {
  const cap = Math.max(1, k)
  const heap = [] // 升序小顶堆（堆顶 = 当前最差）
  let seq = 0

  /** a 比 b 更差？（分低者差；同分 → 迟到者差（seq 大）——堆顶恒为最差） */
  const worse = (a, b) => a.score < b.score || (a.score === b.score && a.seq > b.seq)
  /** a 严格优于 b？（同分不互优——先到先留） */
  const strictlyBetter = (a, b) => a.score > b.score || (a.score === b.score && a.seq < b.seq)
  const siftUp = (i) => {
    while (i > 0) {
      const p = (i - 1) >> 1
      if (worse(heap[i], heap[p])) { const t = heap[i]; heap[i] = heap[p]; heap[p] = t; i = p; continue }
      break
    }
  }
  const siftDown = (i) => {
    for (;;) {
      const l = i * 2 + 1
      const r = l + 1
      let worst = i
      if (l < heap.length && worse(heap[l], heap[worst])) worst = l
      if (r < heap.length && worse(heap[r], heap[worst])) worst = r
      if (worst === i) break
      const t = heap[i]; heap[i] = heap[worst]; heap[worst] = t
      i = worst
    }
  }

  return {
    get size() { return heap.length },
    push(item) {
      const node = { id: item.id, score: item.score, seq: seq++ }
      if (heap.length < cap) { heap.push(node); siftUp(heap.length - 1); return true }
      if (!strictlyBetter(node, heap[0])) return false // 不优于当前最差（含同分迟到）→ 丢弃（先到先留）
      heap[0] = node
      siftDown(0)
      return true
    },
    /** 降序 [{id, score}]（K 上限——与「全量 sort desc + slice(0,K)」逐条等价）。 */
    list() {
      return [...heap]
        .sort((a, b) => (b.score - a.score) || (a.seq - b.seq))
        .map((n) => ({ id: n.id, score: n.score }))
    },
  }
}

/**
 * 分块扫描（rowid 游标）：逐块物化 → 逐行 `onRow` → 块内存随迭代释放。
 * @param {object} db  sqlite 句柄（`.prepare(sql).all(...params)`）
 * @param {string} sql 单表查询（须含 `rowid` 列；不含 LIMIT）
 * @param {Array}  params 绑定参数（`?` 占位——顺序与 SQL 一致）
 * @param {object} opts `{ chunk = SCAN_CHUNK_ROWS, onRow, runChunkedQuery }`
 * @returns {number} 扫描到的行数
 */
export function scanVectors(db, sql, params = [], { chunk = SCAN_CHUNK_ROWS, onRow = null, runChunkedQuery = null } = {}) {
  const run = runChunkedQuery ?? ((after, take) =>
    db.prepare(`${sql} AND rowid > ? ORDER BY rowid LIMIT ?`).all(...params, after, take))
  let after = 0
  let total = 0
  for (;;) {
    const rows = run(after, chunk) ?? []
    if (rows.length === 0) break
    for (const r of rows) { total++; onRow?.(r) }
    const next = rows[rows.length - 1]?.rowid
    if (next === undefined || next === null || !(next > after)) break // 防御：游标不前进即止（不空转）
    after = next
    if (rows.length < chunk) break // 尾块
  }
  return total
}
