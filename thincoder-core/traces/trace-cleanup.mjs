/**
 * trace-cleanup.mjs — 轨迹清理执行面（TRACES.md §6.4 · STARTUP-LATENCY 批，2026-09-21）。
 *
 * 判据 = **目录级三段梯**（D-TR11）：设 `D` = 日目录（`YYYY-MM-DD`——本地时区，与
 * `localDateStr` 同口径）、`retention` = `traces.retentionHours`：
 *   ① `dayEnd(D) + retention ≤ now` **且目录内全部条目为 `.jsonl`** ⇒ **整目录删**
 *      （递归 rm，零逐文件 stat）；
 *   ② `dayStart(D) + retention > now` ⇒ **整目录跳过**（正常写入下目录内无可过期文件）；
 *   ③ 其余（含非 `.jsonl` 条目的目录；非日期名目录——日期解析 NaN ⇒ ①② 两条件恒假 ⇒ 自然落 ③）
 *      ⇒ 逐文件 `stat` 判定 + unlink（现行语义；非 `.jsonl` 一律不碰）。
 *   空日目录在任何分支后按现法移除。
 *
 * 计数口径（D-TR11）：整删支的 `removed` = 该批内 `.jsonl` 条目数（与 ③ 支逐文件计入同口径；
 * 非 `.jsonl` 不计数）——既有断言面保持。
 * 语义 delta（登记）：整删不逐文件核 mtime（人为回拨 mtime 的文件随目录清理——正常写入
 * mtime ∈ 目录日 ⇒ 无差异）；② 支跳过时人为前拨（超期）文件暂留（宽容向）——保留期主粒度
 * 改为**目录日**（与 §6.1 的 24h 保留期并读）。
 *
 * 本体**无状态**（手动面 / 每写节流面直调——启动面经 `scheduleTraceCleanup`）；每写节流住
 * `trace-store.mjs`（`maybePruneTraces`——D-TR12：10 分钟窗 + 在飞合并）。启动面 = **启动窗外
 * 延迟拍**（D-TR13）：`scheduleTraceCleanup` + `TRACE_CLEANUP_DELAY_MS`（3s）住本档、由 CLI
 * 直引（白名单 / 闸位住调用面）；`_setTraceCleanupDelayForTest` = 延迟测试缝。
 * `_cleanupHooks` = 测试注入缝（`_traceHooks` 同惯例——stat 计数 / 失败注入；生产永远走真实实现）。
 */
import { readdir, stat, unlink, rmdir, rm } from "node:fs/promises"
import { join } from "node:path"

export const _cleanupHooks = {
  readdir: (dir) => readdir(dir),
  stat: (p) => stat(p),
  unlink: (p) => unlink(p),
  rmdir: (d) => rmdir(d),
  rm: (d) => rm(d, { recursive: true, force: true }),
}

const DAY_RE = /^(\d{4})-(\d{2})-(\d{2})$/

/** 日目录边界（本地时区——`localDateStr` 同口径）；非日期名 / 非法日（如 2026-02-31）
 *  ⇒ null（⇒ ①② 两条件恒假 ⇒ 落 ③ 逐文件支）。 */
export function dayBounds(name) {
  const m = DAY_RE.exec(name)
  if (!m) return null
  const y = Number(m[1])
  const mo = Number(m[2])
  const d = Number(m[3])
  const start = new Date(y, mo - 1, d).getTime()
  if (Number.isNaN(start) || new Date(start).getDate() !== d) return null // 2026-02-31 归一为 03-03 ⇒ 非日期名
  return { start, end: new Date(y, mo - 1, d, 23, 59, 59, 999).getTime() }
}

/**
 * D-TR10 保留期语义 + D-TR11 目录级判据：删除 traces 根下 mtime 超过保留期的轨迹文件
 * （保留期 = config.traces.retentionHours，默认 24h）；删空的日期目录（YYYY-MM-DD）。
 * 目录里非 .jsonl 文件不碰。返回删除文件数（整删支 = 批内 `.jsonl` 条目数）。
 */
export async function cleanupTraces({ dir, retentionHours = 24 } = {}) {
  const now = Date.now()
  const cutoff = now - retentionHours * 3_600_000
  const window = retentionHours * 3_600_000
  let days
  try { days = await _cleanupHooks.readdir(dir) } catch { return 0 } // 目录不存在/不可读 → 无事可做
  let removed = 0
  for (const day of days) {
    const dayDir = join(dir, day)
    let names
    try { names = await _cleanupHooks.readdir(dayDir) } catch { continue } // 非目录 / 不可读 → 跳过
    const bounds = dayBounds(day)
    if (bounds && bounds.end + window <= now && names.every((n) => n.endsWith(".jsonl"))) {
      // ① 整目录删（纯 .jsonl 且全目录过期——零逐文件 stat；批内条目全计入）
      try { await _cleanupHooks.rm(dayDir); removed += names.length } catch { /* 占用/竞态——跳过 */ }
      continue
    }
    if (bounds && bounds.start + window > now) {
      // ② 整目录跳过（未到期——空日目录仍按现法移除）
      try { if (!names.length) await _cleanupHooks.rmdir(dayDir) } catch { /* 跳过 */ }
      continue
    }
    // ③ 逐文件（现行语义——非 .jsonl 一律不碰）
    for (const n of names) {
      if (!n.endsWith(".jsonl")) continue
      try {
        if ((await _cleanupHooks.stat(join(dayDir, n))).mtimeMs < cutoff) { await _cleanupHooks.unlink(join(dayDir, n)); removed++ }
      } catch { /* 单个文件失败不影响其余 */ }
    }
    try { if ((await _cleanupHooks.readdir(dayDir)).length === 0) await _cleanupHooks.rmdir(dayDir) } catch { /* 跳过 */ }
  }
  return removed
}

// ─── 启动窗外延迟拍（D-TR13 · 2026-09-21 收口前机制微修 2）────────────────────────────────

/** 延迟（自**调度点**起）：与 D-SE39 的 `GC_PASS_DELAY_MS` 同值同形态——3s ⇒ 清理起点落于
 *  启动窗（TTY 门 ≤2s）之外，启动链不因本清理的 fs 爆发与自身争同一事件循环。 */
export const TRACE_CLEANUP_DELAY_MS = 3000
let traceCleanupDelayMs = TRACE_CLEANUP_DELAY_MS

/** 测试缝（`_setSessionGcDelayForTest` 同款）：用例置 0–短值即可点火（勿真等 3s）；
 *  还原 = `_setTraceCleanupDelayForTest(TRACE_CLEANUP_DELAY_MS)`。 */
export function _setTraceCleanupDelayForTest(ms) { traceCleanupDelayMs = ms }

/** 启动面调度器（CLI 会话型命令白名单闸内直引——`thincoder-cli/bin/thincoder.mjs`）：
 *  `dir` / `retentionHours` 由**调度点**捕获（调用面取 `tracesRoot()`）；延迟
 *  `TRACE_CLEANUP_DELAY_MS` 后点火。失败静默（`.catch` 在此——fire-and-forget 语义不变）；
 *  **不 unref**（保后台排空现状——同 D-SE39）。**无去重闸**：白名单 / 闸位 / 每进程一次语义
 *  住调用面（启动面恰一处调用）；进程早退（显式 `process.exit`）未及拍 ⇒ 本次不执行
 *  （幂等——下次会话型命令照常清理）。 */
export function scheduleTraceCleanup({ dir, retentionHours = 24 } = {}) {
  setTimeout(() => { cleanupTraces({ dir, retentionHours }).catch(() => { /* 失败静默——同上 */ }) }, traceCleanupDelayMs)
}
