/**
 * memory/scan.mjs — 检索向量通道的分块扫描 + 有界 top-K。
 * （TUI-OOM-ROOTCAUSE 批——MEMORY.md §10；扫描面修复批——§6.10 修法 A1/A2，2026-09-18。）
 *
 * 病灶一（调度面 · §6.10）：块循环**零 `await`** ⇒ 独占事件循环（TUI 假死：滚轮 / 键盘 /
 * 渲染与 agent 同一条事件循环）。
 * 病灶二（访问序面 · §6.10）：游标 = rowid 序，而两张大表索引序 = PK `(origin, path,
 * line_start)` ⇒ 每块 `USE TEMP B-TREE FOR ORDER BY`（重排**整个过滤集**，SELECT 含
 * `embedding` ⇒ 排序物化带 blob；真库实测单表 29.4 s）。
 *
 * 修法 A2（让出 · 只改调度）：块内每 `SCAN_YIELD_CHECK_ROWS` 行读一次钟，自上次让出累计
 * ≥ `SCAN_YIELD_MS` 即 `await yieldFn()`；**块边界同判**（同一预算——预算未耗不白让出）。
 * 访问序 / 评分 / top-K 候选集 / 并列稳定规则**零变**。
 * 修法 A1（PK 游标 · 只改访问序）：游标列由调用点声明（`cursorKey`，缺省 `["rowid"]` =
 * 现行为）；键 = **表 PK 去掉「被等值过滤的前缀列」**——SQLite 只把与索引列序对齐的元组
 * 比较用作 seek；被等值约束的前导列留在元组里则整条谓词退化为**残余过滤**（每块从头扫起 =
 * 静默二次方，且无 `TEMP B-TREE`、无报错——§6.10 否决形）。
 *
 * 对外结构不变：调用方拿到的仍是 `[{id, score}]` 降序候选（RRF 融合输入）——并列分数按
 * 既有稳定规则（先到先留——与「全量稳定 sort + slice(0,K)」等价）。
 *
 * 可测缝（N-M1 · §6.10）：`cursorKey` · `runChunkedQuery(sql, params)`（传入**构建后的**
 * SQL 与参数——计划面与分页行为皆可机判）· `yieldFn`（缺省 `yieldTick`）· `nowFn`
 * （缺省 `Date.now`）· `yieldMs`（缺省常量）——让出行为可**确定性**断言，不依赖真实时钟。
 */

import { yieldTick } from "./code-index.mjs"

/** 单块行数（单源——三处共用；D-M2：块内存量级 KB~MB，随维度有界）。 */
export const SCAN_CHUNK_ROWS = 2_000

/** 让出检查间隔（行）——每处理这么多行读一次时钟（§6.10 修法 A2）。 */
export const SCAN_YIELD_CHECK_ROWS = 64

/** 让出预算（毫秒）——自上次让出累计达此值即让出（§6.10 修法 A2；D-MEM17）。 */
export const SCAN_YIELD_MS = 50

/** 缺省游标键 = rowid（**即现行为**——`entries` / `files` 两调用点零改，§6.10 逐调用点表）。 */
const DEFAULT_CURSOR_KEY = ["rowid"]

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

/** 末行键值元组：任一键列缺失（`undefined` / `null`）⇒ `null`（防呆①：等价现 `:90`）。 */
function cursorValues(keys, row) {
  if (!row) return null
  const out = []
  for (const k of keys) {
    const v = row[k]
    if (v === undefined || v === null) return null
    out.push(v)
  }
  return out
}

/** 文本键比较（`-1` / `0` / `1`）：**与 SQLite BINARY 同序**（UTF-8 字节序 = 码点序）。
 *  JS 字符串 `<`/`>` 是 UTF-16 码元序——键含增补平面字符（emoji 等 U+10000+）且相邻处有
 *  U+E000–U+FFFF 字符时与 BINARY 相抵 ⇒ 防呆①会误判「游标未前进」而**提前止**（静默少覆盖）。 */
function compareText(x, y) {
  const c = Buffer.compare(Buffer.from(x, "utf8"), Buffer.from(y, "utf8"))
  return c === 0 ? 0 : c > 0 ? 1 : -1
}

/** 键元组序比较：数值按数值、其余按 BINARY 同序文本（`-1` / `0` / `1`）。 */
function compareKeyTuples(a, b) {
  for (let i = 0; i < a.length; i++) {
    const x = a[i], y = b[i]
    if (x === y) continue
    if (typeof x === "number" && typeof y === "number") return x > y ? 1 : -1
    return compareText(String(x), String(y))
  }
  return 0
}

/**
 * 分块扫描（键序游标——§6.10 修法 A1）+ 时间片让出（修法 A2）：逐块物化 → 逐行 `onRow`
 * → 块内存随迭代释放。
 * @param {object} db  sqlite 句柄（`.prepare(sql).all(...params)`）
 * @param {string} sql 单表查询（须含键列【见 `cursorKey`】；不含 ORDER BY / LIMIT）
 * @param {Array}  params 绑定参数（`?` 占位——顺序与 SQL 一致）
 * @param {object} opts `{ chunk, onRow, runChunkedQuery, cursorKey, yieldFn, nowFn, yieldMs }`
 * @returns {Promise<number>} 扫描到的行数
 */
export async function scanVectors(db, sql, params = [], {
  chunk = SCAN_CHUNK_ROWS,
  onRow = null,
  runChunkedQuery = null,
  cursorKey = DEFAULT_CURSOR_KEY,
  yieldFn = yieldTick,
  nowFn = Date.now,
  yieldMs = SCAN_YIELD_MS,
} = {}) {
  const run = runChunkedQuery ?? ((q, p) => db.prepare(q).all(...p))
  const keys = Array.isArray(cursorKey) && cursorKey.length > 0 ? cursorKey : DEFAULT_CURSOR_KEY
  const keyList = keys.join(", ")
  const orderBy = `ORDER BY ${keyList}`
  // 首块不带游标谓词（否决哨兵值——哨兵须假设列域下界）；中块 = 与索引列序对齐的元组比较
  const firstSql = `${sql} ${orderBy} LIMIT ?`
  const midSql = `${sql} AND (${keyList}) > (${keys.map(() => "?").join(", ")}) ${orderBy} LIMIT ?`

  let cursor = null
  let total = 0
  let checked = 0
  let lastYieldAt = nowFn()
  /** 时间片预算：自上次让出累计 ≥ `yieldMs` ⇒ 让出（`yieldMs: Infinity` = 不让出）。 */
  const mightYield = async () => {
    if (nowFn() - lastYieldAt >= yieldMs) { await yieldFn(); lastYieldAt = nowFn() }
  }

  for (;;) {
    const rows = (cursor === null
      ? run(firstSql, [...params, chunk])
      : run(midSql, [...params, ...cursor, chunk])) ?? []
    if (rows.length === 0) break
    for (const r of rows) {
      total++
      onRow?.(r)
      if (++checked >= SCAN_YIELD_CHECK_ROWS) { checked = 0; await mightYield() }
    }
    const next = cursorValues(keys, rows[rows.length - 1])
    // 防呆①：键值缺失 ∨ 末键元组未严格大于上一游标键 ⇒ 止（游标不前进即止——防异常行序空转）
    if (!next || (cursor !== null && compareKeyTuples(next, cursor) <= 0)) break
    cursor = next
    if (rows.length < chunk) break // 防呆②：尾块（末块读尽——不再多打一次空查询）
    await mightYield() // 块边界同判（同一预算）
  }
  return total
}
