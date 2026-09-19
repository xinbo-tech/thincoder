/**
 * peer-instances.mjs — R10 多实例协作感知面 L1/L2（MULTI-INSTANCE-COLLAB §3）。
 *
 * 目标：让同 cwd 的多个 thincoder 副本在 agent 层互相感知。数据源 = 既有 SESSION.md
 * §6.10 基建（manifest slotSessions / getSessionId——不新建平行存储，N1），纯只读（N3
 * ——不认领、不写 manifest——本模块结构化上没有任何 fs 写调用）。
 *
 * - 探测族（`batchAlive` / `probeCmdlines` / `classifyEnd`）住 `process-probe.mjs`
 *   （批 1 CORE-DEFECT-FIXES 外提——探测与身份判据单源，判据面 = §3.1 F-MI6 / V3）；
 *   `batchAlive` 本档 **re-export**（既有 import 面零破——`peer-domains.mjs` 零改，
 *   其域残留清理保持**纯存在性**语义）。
 * - peerInstances(cwd)：读 manifest slotSessions → 按 sessionId 去重分组 → 一次批量判活
 *   （batchAlive）→ **命令行身份复核**（`isProductProc`——pid 复用不再误报「另有活动实例」；
 *   命令探测失败 / 该 pid 缺行 ⇒ **保守保留**，D-MI10）→ 端字段（决策③ A）；
 *   self = sessionId === getSessionId()。
 * - 惰性：manifest mtime **∨ 快照 TTL**缓存（命中即返——零 exec 零读；TUI 假死批 2026-09-18 收正：
 *   `saveSession` 每回合重写 manifest ⇒ 纯 mtime 判据**每回合自击穿**，探测面改 TTL 下限）。
 *   manifest 缺失 → 空清单（不缓存——stat 一次成本）。
 * - 探测**异步化**（同批）：读面用 `batchAliveAsync` / `probeCmdlinesAsync`（`execFile` promise——
 *   不得用同步 exec 占住事件循环）；清理面（`cleanDeadOwners`）继续同步版（非每回合面，D-MI14）。
 * - 测试注入缝：_setPeerInstancesTestImpl({ aliveFn, cmdlineFn, nowFn })（前两缝均**批量**语义；
 *   `nowFn` = 时钟缝——TTL 两侧可**确定性**断言，免真实 ≥ 5 s 等待）。
 *   default null 生产行为不变；测试 restore in finally。
 * - peerInstancesTool：L2 只读查询工具（schema description 逐字锚——评审修正 #7，
 *   双端照抄）；无参、去 self、字段白名单 {pid, end, sessionId, slots}（N4）。
 */

import { statSync } from "node:fs"
import { manifestPath, loadManifest, getSessionId, END } from "./session-slots.mjs"
import { batchAlive, batchAliveAsync, probeCmdlinesAsync, classifyEnd, isProductProc } from "./process-probe.mjs"

export { batchAlive } // 既有 import 面（peer-domains.mjs）零破——实现已外提 process-probe.mjs

const CACHE_MAX = 64

/** 快照最大存活（毫秒）——mtime 变了但距上次实探不足此值 ⇒ 仍命中缓存（§3.1）。
 *  修因 = `saveSession` 每回合重写 manifest（`session.mjs`）⇒ 纯 mtime 判据每回合自击穿，
 *  每回合重跑 `tasklist` + `Get-CimInstance`（1–3 s **同步 exec**）。TTL 只影响新鲜度
 *  （同伴来去在人类时标），不影响正确性。 */
export const PEER_PROBE_TTL_MS = 5000

// 模块级测试注入缝（default null = 生产实现；测试注入 + finally 恢复——见测试文件）
let _testImpl = null

/** 注入测试实现。aliveFn(pids) → Set<pid>；cmdlineFn(pids) → Map<pid,cmdline>|null；
 *  nowFn() → 毫秒时钟（缺省 `Date.now`——TTL 两侧可确定性断言）。三缝均**批量**语义。
 *  返回前值便于测试保存恢复；**未传的槽置 null**（传 `{}` = 全槽同清，等价 reset）。 */
export function _setPeerInstancesTestImpl({ aliveFn = undefined, cmdlineFn = undefined, nowFn = undefined } = {}) {
  const prev = _testImpl
  _testImpl = { aliveFn: aliveFn ?? null, cmdlineFn: cmdlineFn ?? null, nowFn: nowFn ?? null }
  peerInstanceCache.clear() // 注入即环境变更——缓存必须失效（测试间不串）
  return prev
}

export function _resetPeerInstancesTestImpl() {
  _testImpl = null
  peerInstanceCache.clear()
}

/** manifest mtime ∨ 快照 TTL 惰性缓存：cwd → { mtimeMs, probedAt, peers }。缓存有上限
 * （CACHE_MAX——旧条目先出）；条目是纯函数结果快照，无锁无句柄——陈旧只影响新鲜度不影响正确性。 */
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

/** manifest slotSessions → 按 sessionId 去重分组 [{ sessionId, pid, slots }]。
 *  sessionId 形如 "{pid}-{ts}-{rand}"（进程级——可去重分组，MULTI-INSTANCE-COLLAB §3.1）；pid 不可解析
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
 *
 * 身份复核（批 1 F-MI6）：pid 存在性 × 命令行命中本产品标记族才算活同伴。命令**明确可得
 * 且不命中** ⇒ 不列为同伴（pid 被他进程复用 ⇒ 消假阳性）；探测失败（null）/ 缺行 ⇒
 * 保守保留（D-MI10——探测失败 ≠ 死；只读面宁留噪音不隐藏真同伴）。
 *
 * **async**（TUI 假死批）：内部经异步对偶探测（`execFile` promise）——每回合调用面不得同步 exec。
 */
export async function peerInstances(cwd) {
  // 惰性：manifest mtime 未变 **∨ 快照年龄 < TTL** → 直接返回缓存快照（零 exec/零读——T-L1c）
  const nowFn = _testImpl?.nowFn ?? Date.now
  const mp = manifestPath(cwd)
  const mtime = statMtimeMs(mp)
  if (mtime == null) {
    peerInstanceCache.delete(cwd) // manifest 尚未诞生/被删——不缓存空结果（stat 一次成本）
    return []
  }
  const hit = peerInstanceCache.get(cwd)
  if (hit && (hit.mtimeMs === mtime || nowFn() - hit.probedAt < PEER_PROBE_TTL_MS)) return hit.peers

  const m = loadManifest(cwd) // 损坏 → {slots:{}, sessionId:null}——按缺失降级
  const groups = groupSlotSessions(m)
  const myId = getSessionId()
  const others = groups.filter((g) => g.sessionId !== myId && g.pid != null)
  // 活判定：其余实例的 pid 去重后一次批量（self 恒活不查；无同伴 → 零 exec）
  // 探测失败（batchAliveAsync → null）→ 按"无活伴"降级——只读面不显示幽灵同伴
  const aliveFn = _testImpl?.aliveFn ?? batchAliveAsync
  const othersAlive = others.length > 0 ? await aliveFn([...new Set(others.map((g) => g.pid))]) : new Set()
  const aliveSet = othersAlive instanceof Set ? othersAlive : new Set()
  const liveOthers = others.filter((g) => aliveSet.has(g.pid))
  // 身份复核 + 端字段：一次批量 cmdline 探测（仅活同伴——决策③ A；探测失败 → end 缺省）
  let cmdlines = null
  if (liveOthers.length > 0) {
    const probe = _testImpl?.cmdlineFn ?? probeCmdlinesAsync
    cmdlines = await probe([...new Set(liveOthers.map((g) => g.pid))])
  }
  const known = cmdlines instanceof Map
  const peerGroups = liveOthers.filter((g) => {
    const cmd = known ? cmdlines.get(g.pid) : undefined
    return cmd == null || cmd === "" || isProductProc(cmd) // 缺行/探测失败 ⇒ 保守保留
  })
  const peers = []
  const selfGroup = groups.find((g) => g.sessionId === myId)
  if (selfGroup) {
    peers.push({ pid: selfGroup.pid ?? process.pid, sessionId: myId, slots: selfGroup.slots, end: END, self: true })
  }
  for (const g of peerGroups) {
    const end = known ? classifyEnd(cmdlines.get(g.pid)) : undefined
    peers.push({ pid: g.pid, sessionId: g.sessionId, slots: g.slots, self: false, end })
  }
  peers.sort((a, b) => a.pid - b.pid || (a.self === b.self ? 0 : a.self ? -1 : 1))
  cachePut(cwd, { mtimeMs: mtime, probedAt: nowFn(), peers })
  return peers
}

/**
 * L2 只读查询工具（MULTI-INSTANCE-COLLAB §3.3）——挂本模块导出。schema
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
    const list = (await peerInstances(ctx.cwd))
      .filter((p) => !p.self)
      .map((p) => ({ pid: p.pid, end: p.end, sessionId: p.sessionId, slots: p.slots }))
    return JSON.stringify(list, null, 2)
  },
}
