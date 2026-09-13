/**
 * peer-instances.mjs — R10 多实例协作感知面 L1/L2（MULTI-INSTANCE-COLLAB §2a.4）。
 *
 * 目标：让同 cwd 的多个 thincoder 副本在 agent 层互相感知。数据源 = 既有 SESSION.md
 * §10 基建（manifest slotSessions / getSessionId——不新建平行存储，N1），纯只读（N3
 * ——不认领、不写 manifest——本模块结构化上没有任何 fs 写调用）。
 *
 * - peerInstances(cwd)：读 manifest slotSessions → 按 sessionId 去重分组 → slots；
 *   一次批量判活（batchAlive——修复 isProcessAlive 每 pid 一次 execSync 的成本）；
 *   端字段（决策③ A：批量 cmdline 探测）区分 Code.exe/扩展宿主（vscode）vs
 *   node/thincoder（cli）；self = sessionId === getSessionId()。
 * - 惰性：manifest mtime 缓存（变了才重查——活实例变化必伴随 manifest 写——仿
 *   agent._slotMtime 先例）。manifest 缺失 → 空清单（不缓存——stat 一次成本）。
 * - 测试注入缝：_setPeerInstancesTestImpl({ aliveFn, cmdlineFn })——default null
 *   生产行为不变；测试 restore in finally。
 * - peerInstancesTool：L2 只读查询工具（schema description 逐字锚——评审修正 #7，
 *   双端照抄）；无参、去 self、字段白名单 {pid, end, sessionId, slots}（N4）。
 */

import { execFileSync } from "node:child_process"
import { statSync } from "node:fs"
import { manifestPath, loadManifest, getSessionId, END } from "./session-slots.mjs"

const ALIVE_EXEC_TIMEOUT_MS = 10_000
const CMDLINE_EXEC_TIMEOUT_MS = 15_000
const CACHE_MAX = 64

/** VS Code 扩展宿主判别标记（决策③ A——cmdline 探测）：扩展宿主进程 argv 必带其一
 *  （Windows：Code.exe --type=extensionHost / --extensionDevelopmentPath；Unix 同）。 */
const VSC_END_RE = /--extensionDevelopmentPath|--type=extensionHost|extensionHostProcess/i

// 模块级测试注入缝（default null = 生产实现；测试注入 + finally 恢复——见测试文件）
let _testImpl = null

/** 注入测试实现。aliveFn(pids) → Set<pid>；cmdlineFn(pids) → Map<pid,cmdline>|null。
 *  返回前值便于测试保存恢复；传 {} 只清空对应槽。 */
export function _setPeerInstancesTestImpl({ aliveFn = undefined, cmdlineFn = undefined } = {}) {
  const prev = _testImpl
  _testImpl = { aliveFn: aliveFn ?? null, cmdlineFn: cmdlineFn ?? null }
  peerInstanceCache.clear() // 注入即环境变更——缓存必须失效（测试间不串）
  return prev
}

export function _resetPeerInstancesTestImpl() {
  _testImpl = null
  peerInstanceCache.clear()
}

/** manifest mtime 惰性缓存：cwd → { mtimeMs, peers }。缓存有上限（CACHE_MAX——旧条目
 *  先出）；条目是纯函数结果快照，无锁无句柄——陈旧只影响新鲜度不影响正确性。 */
const peerInstanceCache = new Map()

function statMtimeMs(p) {
  try {
    const st = statSync(p)
    return st.mtimeMs
  } catch {
    return null // 文件缺失/不可读
  }
}

function cachePut(cwd, entry) {
  if (peerInstanceCache.size >= CACHE_MAX) {
    const oldest = peerInstanceCache.keys().next().value
    if (oldest !== undefined) peerInstanceCache.delete(oldest)
  }
  peerInstanceCache.set(cwd, entry)
}

/**
 * 批量判活：单次 tasklist（Windows 全量 CSV）/ ps（Unix）拿全量 PID 集合 → 一次 exec
 * 比对（修复 isProcessAlive 每 pid 一次 execSync 的成本——每回合 N 次 = 贵，探索 §4）。
 * 返回存活 pid 的 Set；exec/解析失败 → null（调用方区分"探测失败"与"全死"——只读面按
 * 无活伴降级；域面（peer-domains 死清理）在 null 时不得执行删除——探测失败 ≠ 死）。
 */
export function batchAlive(pids) {
  const uniq = [...new Set(pids.map(Number).filter((n) => Number.isInteger(n) && n > 0))]
  if (uniq.length === 0) return new Set()
  try {
    if (process.platform === "win32") {
      const output = execFileSync("tasklist", ["/FO", "CSV", "/NH"], {
        encoding: "utf8", timeout: ALIVE_EXEC_TIMEOUT_MS, stdio: ["ignore", "pipe", "ignore"],
      })
      const alive = new Set()
      for (const line of output.split(/\r?\n/)) {
        const m = line.match(/^"([^"]*)","(\d+)"/)
        if (m) alive.add(Number(m[2]))
      }
      return new Set(uniq.filter((pid) => alive.has(pid)))
    }
    const output = execFileSync("ps", ["-eo", "pid="], {
      encoding: "utf8", timeout: ALIVE_EXEC_TIMEOUT_MS, stdio: ["ignore", "pipe", "ignore"],
    })
    const alive = new Set(output.split(/\r?\n/).map((l) => Number(l.trim())).filter((n) => Number.isInteger(n)))
    return new Set(uniq.filter((pid) => alive.has(pid)))
  } catch {
    return null // 探测失败（区别于全死）——调用方不得据此执行删除/判死副作用
  }
}

/**
 * 批量 cmdline 探测（决策③ A——一次 exec 拿全部 pid+cmdline）：返回 Map<pid, cmdline>
 * 或 null（exec 失败/解析失败）。Windows = 一次 Get-CimInstance（PowerShell）；Unix =
 * 一次 ps。仅在 manifest mtime 变化后跑一次（~百 ms 级——设计已接受）。
 */
export function probeCmdlines(pids) {
  const uniq = [...new Set(pids.map(Number).filter((n) => Number.isInteger(n) && n > 0))]
  if (uniq.length === 0) return new Map()
  try {
    let out
    if (process.platform === "win32") {
      // 一次 Get-CimInstance 拿全表 → node 侧过滤目标 pid（避免 shell 引号注入面）
      out = execFileSync("powershell.exe",
        ["-NoProfile", "-NonInteractive", "-Command",
          "Get-CimInstance Win32_Process | Select-Object ProcessId,CommandLine | ConvertTo-Json -Compress"],
        { encoding: "utf8", timeout: CMDLINE_EXEC_TIMEOUT_MS, stdio: ["ignore", "pipe", "ignore"] })
      const rows = JSON.parse(out.trim())
      const map = new Map()
      for (const r of Array.isArray(rows) ? rows : [rows]) {
        if (r && Number.isInteger(r.ProcessId) && typeof r.CommandLine === "string") {
          map.set(Number(r.ProcessId), r.CommandLine)
        }
      }
      return map
    }
    out = execFileSync("ps", ["-eo", "pid=,args="], {
      encoding: "utf8", timeout: CMDLINE_EXEC_TIMEOUT_MS, stdio: ["ignore", "pipe", "ignore"],
    })
    const map = new Map()
    for (const line of out.split(/\r?\n/)) {
      const m = line.match(/^\s*(\d+)\s+(.*)$/)
      if (m) map.set(Number(m[1]), m[2])
    }
    return map
  } catch {
    return null // 探测失败 → 端字段缺省（调用方降级）
  }
}

/** cmdline → 端标签：扩展宿主标记 → vscode；其余（node/thincoder CLI）→ cli。 */
function classifyEnd(cmdline) {
  if (typeof cmdline !== "string" || cmdline.length === 0) return undefined
  return VSC_END_RE.test(cmdline) ? "vscode" : "cli"
}

/** manifest slotSessions → 按 sessionId 去重分组 [{ sessionId, pid, slots }]。
 *  sessionId 形如 "{pid}-{ts}-{rand}"（进程级——可去重分组，探索 §4）；pid 不可解析
 *  的条目跳过（存量清理归 saveManifest 的 cleanDeadOwners——本模块纯只读不写）。 */
function groupSlotSessions(m) {
  const byId = new Map()
  for (const [slot, sessionId] of Object.entries(m.slotSessions ?? {})) {
    if (typeof sessionId !== "string" || sessionId.length === 0) continue
    let g = byId.get(sessionId)
    if (!g) {
      const pid = Number.parseInt(sessionId.split("-")[0], 10)
      g = { sessionId, pid: Number.isInteger(pid) ? pid : null, slots: [] }
      byId.set(sessionId, g)
    }
    if (/^\d+$/.test(slot)) g.slots.push(Number(slot))
  }
  const groups = [...byId.values()]
  for (const g of groups) g.slots.sort((a, b) => a - b)
  return groups
}

/**
 * 汇总当前 cwd 的活 thincoder 实例（含 self——由调用方过滤；self = 本进程 sessionId）。
 * 返回 [{ pid, sessionId, slots, self, end? }]——end 仅在批量 cmdline 探测成功时给出
 * （N4 白名单键之外零附加字段）。纯只读（N3）；manifest 缺失/损坏 → []（按缺失降级）。
 */
export function peerInstances(cwd) {
  // 惰性：manifest mtime 未变 → 直接返回缓存快照（零 exec/零读——T-L1c）
  const mp = manifestPath(cwd)
  const mtime = statMtimeMs(mp)
  if (mtime == null) {
    peerInstanceCache.delete(cwd) // manifest 尚未诞生/被删——不缓存空结果（stat 一次成本）
    return []
  }
  const hit = peerInstanceCache.get(cwd)
  if (hit && hit.mtimeMs === mtime) return hit.peers

  const m = loadManifest(cwd) // 损坏 → {slots:{}, sessionId:null}——按缺失降级
  const groups = groupSlotSessions(m)
  const myId = getSessionId()
  const others = groups.filter((g) => g.sessionId !== myId && g.pid != null)
  // 活判定：其余实例的 pid 去重后一次批量（self 恒活不查；无同伴 → 零 exec）
  // 探测失败（batchAlive → null）→ 按"无活伴"降级——只读面不显示幽灵同伴
  const aliveFn = _testImpl?.aliveFn ?? batchAlive
  const othersAlive = others.length > 0 ? aliveFn([...new Set(others.map((g) => g.pid))]) : new Set()
  const aliveSet = othersAlive instanceof Set ? othersAlive : new Set()
  const liveOthers = others.filter((g) => aliveSet.has(g.pid))
  // 端字段：一次批量 cmdline 探测（仅活同伴——决策③ A；探测失败 → end 缺省）
  let cmdlines = null
  if (liveOthers.length > 0) {
    const probe = _testImpl?.cmdlineFn ?? probeCmdlines
    cmdlines = probe([...new Set(liveOthers.map((g) => g.pid))])
  }
  const peers = []
  const selfGroup = groups.find((g) => g.sessionId === myId)
  if (selfGroup) {
    peers.push({ pid: selfGroup.pid ?? process.pid, sessionId: myId, slots: selfGroup.slots, end: END, self: true })
  }
  for (const g of liveOthers) {
    const end = cmdlines instanceof Map ? classifyEnd(cmdlines.get(g.pid)) : undefined
    peers.push({ pid: g.pid, sessionId: g.sessionId, slots: g.slots, self: false, end })
  }
  peers.sort((a, b) => a.pid - b.pid || (a.self === b.self ? 0 : a.self ? -1 : 1))
  cachePut(cwd, { mtimeMs: mtime, peers })
  return peers
}

/**
 * L2 只读查询工具（MULTI-INSTANCE-COLLAB §2a.4 D-L2b）——挂本模块导出。schema
 * description 逐字锚（评审修正 #7——2026-09-06 定稿，双端照抄——禁止自行解释）：
 * "peer_instances — read-only: list other live ThinCoder instances sharing this
 * workspace cwd. Returns [{ pid, end, sessionId, slots }]; never includes self;
 * pure read — writes nothing."
 */
export const peerInstancesTool = {
  name: "peer_instances",
  description:
    "peer_instances — read-only: list other live ThinCoder instances sharing this workspace cwd. Returns [{ pid, end, sessionId, slots }]; never includes self; pure read — writes nothing.",
  parameters: { type: "object", properties: {} },
  readonly: true,
  async execute(args, ctx) {
    const list = peerInstances(ctx.cwd)
      .filter((p) => !p.self)
      .map((p) => ({ pid: p.pid, end: p.end, sessionId: p.sessionId, slots: p.slots }))
    return JSON.stringify(list, null, 2)
  },
}
