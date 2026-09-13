/**
 * peer-instances.mjs — R10 多实例协作感知面（MULTI-INSTANCE-COLLAB.md D-L2a——VS Code 镜像）。
 * peerInstances(cwd)：读 manifest slotSessions → 按 sessionId 去重分组（slots 数组）→
 * 一次批量判活（batchAlive——修复 isProcessAlive 每 pid 一次 exec 的成本问题）→
 * 一次批量 cmdline 探测（决策③ A：端字段）→ 条目 [{ pid, end, sessionId, slots, self }]。
 *
 * 惰性：manifest mtime 变了才重查（活实例变化必伴随 manifest 写——仿 saveSessionToSlot
 * slotMtimeCache 先例）；self 排除 = sessionId === getSessionId()（本端进程级单例）。
 * 纯只读（N3——不认领、不写 manifest/peers）；N4 字段白名单 {pid, end, sessionId, slots}。
 *
 * 测试缝：_setAliveProbeForTest/_setCmdlineProbeForTest（伪属主范式——seedFile 直写 +
 * 注入假判活/假 cmdline，无真 spawn）；_resetPeerInstancesForTest 清探针 + 惰性缓存。
 * sessions 目录注入随 session-slots.mjs 既有 _setSessionsDirForTest。
 */

import { statSync, readFileSync } from "node:fs"
import { execSync } from "node:child_process"
import { manifestPath, getSessionId } from "./session-slots.mjs"

// ─── 惰性缓存（manifest mtime 变了才重查）──────────────────
const cache = new Map() // cwd → { mtime, size, entries }

/** 测试缝复位（清缓存 + 探针——测试 afterEach 卫生用） */
export function _resetPeerInstancesForTest() {
  cache.clear()
  aliveProbe = null
  cmdlineProbe = null
}

// ─── 批量判活（一次 exec 拿全部 PID 集合）──────────────────

/** 测试缝：注入判活函数（pids) => Set<number>；null = 真实 tasklist/ps。 */
export function _setAliveProbeForTest(fn) { aliveProbe = fn }
let aliveProbe = null

/** 批量判活——单次 tasklist/ps 全量 PID 集合比对（D-L2a：修复 isProcessAlive
 *  每 pid 一次 execSync 的成本问题）。失败按空集降级（与 isProcessAlive 同语义：
 *  无法判定视为死——存储层先例）。 */
export function batchAlive(pids) {
  const list = [...new Set(pids.filter((p) => Number.isInteger(p) && p > 0))]
  if (list.length === 0) return new Set()
  if (aliveProbe) return aliveProbe(list)
  try {
    const live = new Set()
    if (process.platform === "win32") {
      const out = execSync("tasklist /FO CSV /NH", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], timeout: 10000 })
      for (const line of out.split(/\r?\n/)) {
        const m = line.match(/^"([^"]*)","(\d+)"/)
        if (m) live.add(parseInt(m[2]))
      }
    } else {
      const out = execSync("ps -eo pid=", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], timeout: 10000 })
      for (const line of out.split("\n")) {
        const pid = parseInt(line.trim())
        if (Number.isInteger(pid)) live.add(pid)
      }
    }
    return new Set(list.filter((p) => live.has(p)))
  } catch {
    return new Set() // 判活失败按全死降级（isProcessAlive 同语义）
  }
}

// ─── 端字段（决策③ A——批量 cmdline 探测）──────────────────

/** 测试缝：注入 cmdline 探测（pids) => Map<pid, { name, cmdline }>）；null = 真实探测。 */
export function _setCmdlineProbeForTest(fn) { cmdlineProbe = fn }
let cmdlineProbe = null

/** 端判别（决策③——镜像）：先判扩展宿主标记（评审修正：dev/F5 的
 *  --extensionDevelopmentPath 路径常含 "thincoder"——后判 cli 会把 VS Code 同伴误标 cli）；
 *  再判 thincoder → cli（node .../bin/thincoder.cjs——真实 CLI cmdline 永不携带扩展宿主
 *  标记，不误伤）；其余 null（未知端——字段白名单外不发散）。 */
function classifyEnd({ name, cmdline }) {
  const c = `${cmdline ?? ""}`.toLowerCase()
  const n = `${name ?? ""}`.toLowerCase()
  if (c.includes("type=extensionhost") || c.includes("extensiondevelopmentpath")
      || c.includes("ms-enable-electron-run-as-node") || /code|cursor|windsurf|electron/.test(n)) {
    return "vscode"
  }
  if (c.includes("thincoder")) return "cli"
  return null
}

/** 批量 cmdline 探测——一次 Get-CimInstance/ps 拿全部 pid+name+cmdline（manifest mtime
 *  变了才做一次——~百 ms 级）。失败按空 Map 降级（end 全 null）。测试缝：注入探针后
 *  不走真实 exec（伪属主范式）。 */
function probeCmdlines(pids) {
  const list = [...new Set(pids.filter((p) => Number.isInteger(p) && p > 0))]
  const out = new Map()
  if (list.length === 0) return out
  if (cmdlineProbe) return cmdlineProbe(list)
  try {
    if (process.platform === "win32") {
      const script = "Get-CimInstance Win32_Process | ForEach-Object { \"$($_.ProcessId)`t$($_.Name)`t$($_.CommandLine)\" }"
      const raw = execSync(`powershell -NoProfile -Command "${script}"`, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], timeout: 15000 })
      for (const line of raw.split(/\r?\n/)) {
        const t1 = line.indexOf("\t")
        if (t1 < 0) continue
        const t2 = line.indexOf("\t", t1 + 1)
        const pid = parseInt(line.slice(0, t1))
        if (!Number.isInteger(pid)) continue
        out.set(pid, { name: t2 < 0 ? line.slice(t1 + 1) : line.slice(t1 + 1, t2), cmdline: t2 < 0 ? "" : line.slice(t2 + 1) })
      }
    } else {
      const raw = execSync("ps -eo pid=,comm=,args=", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], timeout: 10000 })
      for (const line of raw.split("\n")) {
        const m = line.trim().match(/^(\d+)\s+(\S+)\s+(.*)$/)
        if (m) out.set(parseInt(m[1]), { name: m[2], cmdline: m[3] ?? "" })
      }
    }
    return out
  } catch {
    return out // 探测失败按空降级（end 字段 null——不阻塞）
  }
}

// ─── 汇总 ──────────────────────────────────────────────────

/**
 * 本 cwd 的活 thincoder 实例清单（含 self:true 条目——调用方自行排除：
 *  pushPeerReminder 过滤 !self；peer_instances 工具去 self + 去 self 键）。
 *  manifest 缺失/损坏 → []（降级——无会话即无同伴）。端探测结果惰性缓存。
 */
export function peerInstances(cwd) {
  const mp = manifestPath(cwd)
  let mtime = null
  let size = 0
  try {
    const s = statSync(mp)
    mtime = s.mtimeMs
    size = s.size
  } catch { mtime = null }
  if (mtime === null) return [] // 无 manifest（本 cwd 无会话）——不缓存（manifest 可能出现）
  const cached = cache.get(cwd)
  if (cached && cached.mtime === mtime && cached.size === size) return cached.entries

  let m = null
  try { m = JSON.parse(readFileSync(mp, "utf8")) } catch { /* 损坏按空降级 */ }
  const bySession = new Map() // sessionId → slots[]
  if (m && typeof m.slotSessions === "object" && m.slotSessions !== null) {
    for (const [slot, sid] of Object.entries(m.slotSessions)) {
      if (!/^\d+$/.test(slot) || typeof sid !== "string" || !sid) continue
      const arr = bySession.get(sid) ?? []
      arr.push(parseInt(slot))
      bySession.set(sid, arr)
    }
  }
  const sessions = [...bySession.entries()]
    .map(([sid, slots]) => ({ sessionId: sid, pid: parseInt(sid.split("-")[0]), slots: slots.sort((a, b) => a - b) }))
    .filter((e) => Number.isInteger(e.pid) && e.pid > 0)
  if (sessions.length === 0) {
    cache.set(cwd, { mtime, size, entries: [] })
    return []
  }
  const alive = batchAlive(sessions.map((e) => e.pid))
  const live = sessions.filter((e) => alive.has(e.pid))
  const cmds = probeCmdlines(live.map((e) => e.pid))
  const selfSid = getSessionId()
  const entries = live
    .map((e) => {
      const c = cmds.get(e.pid)
      return { pid: e.pid, end: c ? classifyEnd(c) : null, sessionId: e.sessionId, slots: e.slots, self: e.sessionId === selfSid }
    })
    .sort((a, b) => a.pid - b.pid)
  cache.set(cwd, { mtime, size, entries })
  return entries
}

// ─── L2 只读查询工具（registry 注册面——tools/index.mjs builtinTools）──────

/** 只读工具 peer_instances——schema description 逐字锚（MULTI-INSTANCE-COLLAB.md
 *  D-L2b 评审修正 #7——2026-09-06 定稿，双端照抄，不得改写）。 */
export const peerInstancesTool = {
  name: "peer_instances",
  description:
    "peer_instances — read-only: list other live ThinCoder instances sharing this workspace cwd. " +
    "Returns [{ pid, end, sessionId, slots }]; never includes self; pure read — writes nothing.",
  parameters: { type: "object", properties: {} },
  readonly: true,
  execute(args, ctx) {
    let peers = []
    try {
      peers = peerInstances(ctx?.cwd).filter((p) => !p.self)
    } catch { /* 降级——探测失败按空返回 */ }
    if (peers.length === 0) return "(no other live ThinCoder instances sharing this cwd)"
    // 字段白名单精确输出：{pid, end, sessionId, slots}——self 键/任何其他键不进结果（N4）
    return peers.map((p) => JSON.stringify({ pid: p.pid, end: p.end, sessionId: p.sessionId, slots: p.slots })).join("\n")
  },
}
