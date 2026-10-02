/**
 * memory/sync-tail.mjs — 同步收尾族（§6.14 面② B6 ∕ M3 收尾让出 + 面③ P2 行预算——**单源**）。
 *
 * 两个同步入口（`codeSync` ∕ `docSync`）共用的收尾机制都住本档（拆分点 = 批档 §2.12 补块 3 缝
 * 「code-sync〔预算判定 + stale 收尾块〕」）：
 *   · **P2 行预算**（`createRowBudget`）：基准 = 本 origin 库内行数（code+doc，开趟读一次）；过
 *     `INDEX_ORIGIN_ROW_WARN` 出一行可见警示（每趟至多一行）＋ `logEvent`；过 `INDEX_ORIGIN_ROW_CAP`
 *     由调用方跳过列序后缀（**只停新增**——存量行不失效；跳过 = 不落行 ∕ 不记 mtime ⇒ 下趟重试）。
 *   · **stale 收尾循环**（`sweepStaleRows`）：同款时间片让出（§6.10 A2 口径——每 `SCAN_YIELD_CHECK_ROWS`
 *     行读钟，累计 ≥ `yieldMs` 即让出）＋ 面① **收尾保护位**（`isExcludedRelPath` 命中路径短路——
 *     被排除但存在的路径存量行不因声明删除，收敛仅经 `sweep --path`；缺省 `[]` ⇒ 恒不命中）。
 *
 * 零环：只引 `log.mjs` ∕ `conventions.mjs`（谓词）∕ `schema.mjs`（常量）∕ `scan.mjs`（预算常量）∕
 * `code-index.mjs`（`yieldTick`）——不引 `code-sync.mjs` ∕ `docs.mjs`。作业皆经传入句柄，档内零状态。
 */
import { logEvent } from "../log.mjs"
import { isExcludedRelPath } from "../conventions.mjs"
import { INDEX_ORIGIN_ROW_WARN, INDEX_ORIGIN_ROW_CAP } from "./schema.mjs"
import { SCAN_YIELD_CHECK_ROWS, SCAN_YIELD_MS } from "./scan.mjs"
import { yieldTick } from "./code-index.mjs"

/** 本 origin 库内行数（`code_chunks` + `doc_chunks` 合计——§6.14 P2 预算基准；开趟读一次）。 */
export function originRowCount(memory, origin) {
  const n = (t) => Number(memory.db.prepare(`SELECT COUNT(*) AS n FROM ${t} WHERE origin = ?`).get(origin)?.n ?? 0)
  return n("code_chunks") + n("doc_chunks")
}

/** 单路径行数（预算差量用——PK 前缀范围扫描）。 */
export function rowCountOfPath(memory, table, origin, rel) {
  return Number(memory.db.prepare(`SELECT COUNT(*) AS n FROM ${table} WHERE origin = ? AND path = ?`).get(origin, rel)?.n ?? 0)
}

/** §6.14 P2 行预算（单源——codeSync ∕ docSync 同用）：`note()` 每趟至多一行 WARN 警示；`over()` =
 *  已到 CAP（调用方跳过后列文件）；`add(delta)` = 本趟净增行数（新入 − 被替换——与「库内行数」同刻度）。 */
export function createRowBudget(memory, origin, kind, dir) {
  const base = originRowCount(memory, origin)
  let landed = 0, warned = false, capped = false
  const rows = () => base + landed
  const pruneHint = `declare index.excludePaths in PROJECT-MANIFEST.json, or prune: thincoder memory sweep --origin "${origin}" --path <sub>`
  return {
    add: (delta) => { landed += delta },
    over: () => rows() >= INDEX_ORIGIN_ROW_CAP,
    note() {
      if (!warned && rows() >= INDEX_ORIGIN_ROW_WARN) {
        warned = true
        console.warn(`[memory] index origin=${origin} rows≈${rows()} ≥ WARN ${INDEX_ORIGIN_ROW_WARN} — ${pruneHint}`)
        logEvent("index:budget", { dir, kind, rows: rows(), warn: INDEX_ORIGIN_ROW_WARN })
      }
      if (!capped && rows() >= INDEX_ORIGIN_ROW_CAP) {
        capped = true
        console.warn(`[memory] index origin=${origin} rows≈${rows()} ≥ CAP ${INDEX_ORIGIN_ROW_CAP} — skipping remaining files this pass (existing rows are kept)`)
        logEvent("index:budget-cap", { dir, kind, rows: rows(), cap: INDEX_ORIGIN_ROW_CAP })
      }
    },
  }
}

/**
 * §6.14 B6 ∕ M3：收尾 stale 删除循环（同款让出 + 收尾保护位）。返回删除行数（文件级）。
 * @param {object} memory 句柄
 * @param {{table: string, origin: string, indexed: Map<string, number>, seen: Set<string>, decl: object,
 *   base?: string|null, yieldFn?: Function, nowFn?: Function, yieldMs?: number}} opts
 *   `indexed` = 库内 path→mtime（开趟读）；`seen` = 本趟列文件；`decl` = `loadProjectDeclaration()` 回执；
 *   `base` = `indexed`/`seen` 里 `rel` 的相对基（调用面 dir——#700 等价换算；缺省 = 根相对）
 */
export async function sweepStaleRows(memory, { table, origin, indexed, seen, decl, base = null, yieldFn = yieldTick, nowFn = Date.now, yieldMs = SCAN_YIELD_MS }) {
  let removed = 0
  let checked = 0
  let lastYieldAt = nowFn()
  for (const stale of indexed.keys()) {
    if (!seen.has(stale) && !isExcludedRelPath(stale, decl, base)) {
      memory.db.prepare(`DELETE FROM ${table} WHERE origin = ? AND path = ?`).run(origin, stale)
      removed++
    }
    if (++checked >= SCAN_YIELD_CHECK_ROWS) {
      checked = 0
      if (nowFn() - lastYieldAt >= yieldMs) { await yieldFn(); lastYieldAt = nowFn() }
    }
  }
  return removed
}
