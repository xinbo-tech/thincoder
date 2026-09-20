/**
 * ledger-executors.mjs — 在途 executor 判活展示（F-LX1 · 设计档 LEDGER.md §7.3.1）。
 *
 * 红线：写径零探测——判活只落显示面。本档从 ledger.mjs 拆出（2026-09-21 executor 判活批，
 * ledger.mjs 307 → ≤300 软线回落），语义零变：`resolveExecutorStates` async 单源 + `executorTail`
 * 三态文案（双端同文——CLI L2 与 VSC tooltip 共此函数）+ TTL 缓存（与 peer-instances 同源口径）。
 */
import { classifyEnd, ownerState, probeOwnersAsync } from "./process-probe.mjs"
import { PEER_PROBE_TTL_MS } from "./peer-instances.mjs"

/** 判活解析 TTL 缓存（模块级——与 peer-instances `PEER_PROBE_TTL_MS` 同源口径；TTL 内重复解析零 exec）。
 *  键 = pid；值 = { probedAt, state, end }。`_setExecutorProbeTtlForTest` = 测试缝（裁定 #8——测试间不串；用后恢复）。 */
const executorProbeCache = new Map()
let _executorProbeTtlOverride = null

/** 测试缝：覆盖 TTL 毫秒数（0 = 禁缓存恒重探）；返回前值，测试 finally 恢复。 */
export function _setExecutorProbeTtlForTest(ms) {
  const prev = _executorProbeTtlOverride
  _executorProbeTtlOverride = ms
  executorProbeCache.clear()
  return prev
}

const executorTtlMs = () => _executorProbeTtlOverride ?? PEER_PROBE_TTL_MS

/** sessionId → pid（首段整数——peer-instances `groupSlotSessions` 同款解析；不可解析 ⇒ null→unknown）。 */
function executorPid(sessionId) {
  const n = Number.parseInt(String(sessionId).split("-")[0], 10)
  return Number.isFinite(n) && n > 0 ? n : null
}

/** 行时间戳 → 距今天数（向下取整；缺 → null——「N 天未动」标注源，零新状态）。 */
function staleDaysOf(ts, now) {
  if (ts == null) return null
  const ms = Date.parse(ts)
  if (!Number.isFinite(ms)) return null
  return Math.floor(Math.max(0, now - ms) / 86400000)
}

/** 在途 executor 判活批量解析（async 单源——LEDGER.md §7.3.1）：收集各 scan 的 `inflightExecutors`
 *  → pid 去重 → **一次 `probeOwnersAsync` 束**（≤1 判活 + ≤1 cmdline——禁止逐行 exec）→ 逐 executor
 *  `ownerState` → 每 scan 挂 `executors: [{executor, pid, end, state, staleDays}]` + `deadExecutors: n`。
 *  `end` = cmdline 可得时的 `classifyEnd` 值；`staleDays` = 该行 `updated_at ?? created_at` 距今天数。
 *  TTL 缓存按 pid（5s 同源口径）；**无在途 executor ⇒ 零 exec 快返**（不探、不缓存）。
 *  写径零探测——本函数仅供显示面调用（§7.3.1 红线）。 */
export async function resolveExecutorStates(scans, { now = Date.now() } = {}) {
  const list = Array.isArray(scans) ? scans : []
  const entries = []
  for (const s of list) {
    for (const e of Array.isArray(s?.inflightExecutors) ? s.inflightExecutors : []) entries.push({ scan: s, ...e })
  }
  // 每 scan 先挂空形（无在途 ⇒ 空数组 + 0——不触缓存不探测）
  for (const s of list) { s.executors = []; s.deadExecutors = 0 }
  if (entries.length === 0) return list

  const pids = new Map() // pid → sessionId（去重——同 pid 多条只探一次）
  for (const e of entries) {
    const pid = executorPid(e.executor)
    if (pid !== null && !pids.has(pid)) pids.set(pid, e.executor)
  }

  // TTL 命中/未命中分流：未命中的 pid 集成一次批量探测
  const ttl = executorTtlMs()
  const need = [...pids.keys()].filter((pid) => {
    const hit = executorProbeCache.get(pid)
    return !hit || now - hit.probedAt >= ttl
  })
  const bundle = need.length > 0 ? await probeOwnersAsync(need) : { aliveSet: null, cmds: null }
  for (const pid of need) {
    const cmdline = typeof bundle?.cmds?.get?.(pid) === "string" ? bundle.cmds.get(pid) : undefined
    executorProbeCache.set(pid, {
      probedAt: now,
      state: ownerState(pid, bundle),
      end: cmdline ? classifyEnd(cmdline) : undefined,
    })
  }
  const deadByScan = new Map()
  for (const e of entries) {
    const pid = executorPid(e.executor)
    const hit = pid !== null ? executorProbeCache.get(pid) : null
    const state = hit ? hit.state : "unknown" // pid 不可解析 ⇒ unknown（不判死——保守）
    const end = hit ? hit.end : undefined
    const staleDays = staleDaysOf(e.updated_at ?? e.created_at, now)
    e.scan.executors.push({ executor: e.executor, pid, end, state, staleDays })
    if (state === "dead") deadByScan.set(e.scan, (deadByScan.get(e.scan) ?? 0) + 1)
  }
  for (const [scan, n] of deadByScan) scan.deadExecutors = n
  return list
}

/** 判活尾段（三态文案单源——LEDGER.md §7.3.1；双端同文——CLI L2 与 VSC tooltip 共此函数）：
 *  dead>0 → `（属主已死 <n>，可接手）`（dead 优先）；死 0 · 在途 executor >0 · 最长 staleDays ≥1 →
 *  `（执行中 <n> · 最长 <d> 天未动）`；死 0 · staleDays <1 或 null → `（执行中 <n>）`；
 *  在途 executor =0 → 空串（既有文案零破）。 */
export function executorTail(scan) {
  const exs = Array.isArray(scan?.executors) ? scan.executors : []
  if (exs.length === 0) return ""
  const dead = exs.filter((x) => x.state === "dead").length
  if (dead > 0) return `（属主已死 ${dead}，可接手）`
  const maxStale = Math.max(...exs.map((x) => (x.staleDays == null ? 0 : x.staleDays)))
  if (maxStale >= 1) return `（执行中 ${exs.length} · 最长 ${maxStale} 天未动）`
  return `（执行中 ${exs.length}）`
}
