/**
 * session-index-pass.mjs — 有界趟 / 全量重建 / 源消失清行 / 延迟拍（SESSION.md §6.19 D-SE45/D-SE46）。
 *
 * `session-index-build.mjs` 的 >300 软线二分产物（设计「跨档线拆分预案」：枚举与水位增量 ∥
 * 重建 / 拍 / 清行）。触发三点（均不触主存档）：
 *   ① 懒保证（`session-index-build.mjs` `ensureSessionIndexed`——射程 = 有段档）
 *   ② 启动窗外延迟拍（`scheduleSessionIndexPass`——端壳挂点，核会话档零改）
 *   ③ 显式命令（`runSessionIndex --rebuild`——住 `session-index-cmd.mjs`）
 */
import { statSync } from "node:fs"
import { INDEX_PASS_BUDGET_MS, INDEX_PASS_MAX_SESSIONS, deleteSessionRows, openSessionIndex } from "./session-index.mjs"
import { bumpMeta, indexSession, listSessionFiles, readManifestDigest, sessionsRoot } from "./session-index-build.mjs"

/** 延迟拍延迟（`GC_PASS_DELAY_MS` 同款：自调度点起 3s——启动窗外）。 */
export const INDEX_PASS_DELAY_MS = 3000
let passDelayMs = INDEX_PASS_DELAY_MS
export function _setSessionIndexPassDelayForTest(ms) { passDelayMs = ms }

/** 源消失 ⇒ 级联清（`deleteSlot` / `session gc` 连带面；清运无锁、幂等）。 */
export function pruneMissingSessions(db, { now = Date.now() } = {}) {
  let rows = []
  try { rows = db.prepare("SELECT id, file FROM sessions").all() } catch { return { pruned: 0 } }
  let pruned = 0
  db.exec("BEGIN IMMEDIATE")
  try {
    for (const r of rows) {
      let alive = true
      try { statSync(r.file) } catch { alive = false }
      if (alive) continue
      deleteSessionRows(db, r.id, { fromIdx: null })
      pruned++
    }
    if (pruned > 0) bumpMeta(db, now)
    db.exec("COMMIT")
  } catch (e) {
    try { db.exec("ROLLBACK") } catch { /* ignore */ }
    return { pruned: 0, error: e.message }
  }
  return { pruned }
}

/** 每 cwd manifest 一次读（拍 / 重建共用——覆盖该 cwd 全槽）。 */
function digestFor(cache, f) {
  if (!cache.has(f.cwdKey)) cache.set(f.cwdKey, readManifestDigest(f.file, f.cwdKey))
  return cache.get(f.cwdKey)
}

/** 有界趟（触发点②）：按源 mtime 降序、≤ `limit` 会话 且 ≤ `budgetMs`；水位保证可续跑。 */
export function syncSessions(db, { dir = sessionsRoot(), limit = INDEX_PASS_MAX_SESSIONS, budgetMs = INDEX_PASS_BUDGET_MS, force = false, now = Date.now() } = {}) {
  const t0 = Date.now()
  const cache = new Map()
  const result = { scanned: 0, changed: 0, skipped: 0 }
  for (const f of listSessionFiles({ dir }).slice(0, limit)) {
    if (Date.now() - t0 > budgetMs) break
    const r = indexSession(db, f.file, { force, cwdKey: f.cwdKey, slot: f.slot, digest: digestFor(cache, f), now })
    result.scanned++
    if (r.changed) result.changed++
    else if (r.skipped || r.error) result.skipped++
  }
  const p = pruneMissingSessions(db, { now })
  return { ...result, pruned: p.pruned ?? 0, elapsedMs: Date.now() - t0 }
}

/** `--rebuild` 面（③ 显式命令——存量首建 / 运维兜底）：逐会话全量重扫（水位忽略）。 */
export function rebuildAllSessions(db, { dir = sessionsRoot(), now = Date.now() } = {}) {
  const files = listSessionFiles({ dir })
  const cache = new Map()
  let changed = 0
  for (const f of files) {
    if (indexSession(db, f.file, { force: true, cwdKey: f.cwdKey, slot: f.slot, digest: digestFor(cache, f), now }).changed) changed++
  }
  return { sessions: files.length, changed }
}

// ── 延迟拍（触发点②：端壳挂点——核会话档零改）────────────────────────────────

let passScheduled = false

/** 启动窗外延迟拍：`delayMs` 后点火一趟有界 pass（异步非阻塞 / 失败静默 / 不 unref；
 *  每进程一次——`scheduleSessionGC` 同款）。 */
export function scheduleSessionIndexPass({ delayMs = passDelayMs, dir = sessionsRoot(), limit = INDEX_PASS_MAX_SESSIONS, budgetMs = INDEX_PASS_BUDGET_MS } = {}) {
  if (passScheduled) return false
  passScheduled = true
  setTimeout(() => {
    try {
      const db = openSessionIndex()
      if (!db) return
      try { syncSessions(db, { dir, limit, budgetMs }) } finally { db.close() }
    } catch { /* 拍失败静默——索引 = 派生品，主存零险 */ }
  }, delayMs)
  return true
}

/** 测试缝（延迟拍一次性旗标复位——用例可重复点火）。 */
export function _resetSessionIndexPassScheduleForTest() { passScheduled = false }
