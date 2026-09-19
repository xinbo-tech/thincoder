/**
 * peer-instances.mjs — R10 多实例协作感知面（MULTI-INSTANCE-COLLAB.md D-L2a——VS Code 镜像）。
 *
 * F-MI7（2026-09-18 · §3.1 端侧收口）——本档 = **端侧薄壳自持聚合**（不委托核 `peerInstances`）：
 *   · 不委托的理由：核实现携带 manifest **mtime 判据**（每次 manifest 写即判据自击穿），
 *     端面纪律 = **TTL 单一新鲜度判据**（§3.1:102「端 TTL = 新鲜度上界，不复刻 mtime 判据」）；
 *   · 判据面**全引核** `process-probe.mjs`：判活 `batchAliveAsync` / 命令行 `probeCmdlinesAsync`
 *     / 身份复核 `isProductProc` / 端标签 `classifyEnd`；TTL 常量单源 = 核 `PEER_PROBE_TTL_MS`；
 *   · 本档只保留**聚合半段**（manifest → 按 sessionId 分组 → self 条 → 排序）——核
 *     `groupSlotSessions` 为核内私有件（未导出）⇒ 镜像 16 行（核 `:84-99` ⇄ 本档 `:78-93`）；
 *     §3.1 删除清单三件 `batchAlive` / `classifyEnd` / `probeCmdlines` 已退场（聚合保留·如实披露）。
 *   · **SWR 读形**（stale-while-revalidate）：同步 `peerInstances(cwd)` = 快照读——新鲜
 *     （age < TTL）直返 / 过期返旧 + 后台刷新 / 无快照返空 + 后台刷新 ⇒ 每回合调用面
 *     （`pushPeerReminder`）**零同步 exec**（N-MI3 / N-MI2）；异步对偶 `peerInstancesAsync(cwd)`
 *     = await 真算（工具面 / 预热面消费）。
 *   · 只读（N3——不认领、不写 manifest/peers）；N4 字段白名单 {pid, end, sessionId, slots}；
 *     self 条 `end` = 本端标签 `END`（"vscode"）——与核同形（核 self 条 `end: "cli"`）。
 *
 * 测试缝：`_setAliveProbeForTest` / `_setCmdlineProbeForTest`（端值**合并后一次**传核
 * `_setProcessProbeTestImpl`——未传槽即清，分两次调用会互清）；`_setNowForTest`（时钟缝——
 * TTL 两侧可确定性断言，免真实等待）；`_resetPeerInstancesForTest`（清 SWR 快照 + 两端缝）。
 * 注入即清端快照（旧快照不得与新探针混用）；核 `peerInstances` 缓存本端不消费 ⇒ 无清理面。
 * sessions 目录注入随既有 `_setSessionsDirForTest`。
 */
import { loadManifest, getSessionId, END } from "./session-slots.mjs"
import {
  batchAlive, batchAliveAsync, probeCmdlinesAsync, isProductProc, classifyEnd,
  _setProcessProbeTestImpl, _resetProcessProbeTestImpl,
} from "@thincoder/core/process-probe.mjs"
import { PEER_PROBE_TTL_MS } from "@thincoder/core/peer-instances.mjs"

// 既有 import 面零破（`peer-domains.mjs:124` 零改）：`batchAlive` 实现单源 = 核 `process-probe`。
// 语义变化披露：核版探测失败 ⇒ **null**（未知，不作死判据——D-MI10），旧端侧副本失败返空集；
// `peer-domains` 的调用点对 null 会抛 TypeError 并被其 try 吞 ⇒ 失败路径**不删**（保守方向）。
export { batchAlive }

const SWR_TTL_MS = PEER_PROBE_TTL_MS // 新鲜度上界（单源 = 核常量——端面零复刻、零自值）
const CACHE_MAX = 64 // 快照上限（同核 `peer-instances` CACHE_MAX——旧条目先出）

let nowProbe = null // 时钟缝（TTL 两侧确定性断言）
let aliveProbe = null // 判活缝（端值）
let cmdlineProbe = null // 命令行缝（端值）
const snapshots = new Map() // cwd → { at, entries }（纯值快照——陈旧只影响新鲜度）
const inflight = new Map() // cwd → Promise（单飞——并发读不双探）

const now = () => (nowProbe ?? Date.now)()

// ─── 测试缝（端值 + 核缝双向同步）──────────────────────────

/** 端值合并后**一次**传核（核语义：未传槽置 null ⇒ 分两次调用会互清另一槽）。 */
function syncProbeSeams() {
  _setProcessProbeTestImpl({ aliveFn: aliveProbe, cmdlineFn: cmdlineProbe })
}

/** 测试缝：注入判活函数 `(pids) => Set<number>`；null = 真实 tasklist/ps（核实现）。 */
export function _setAliveProbeForTest(fn) { aliveProbe = fn ?? null; syncProbeSeams(); snapshots.clear() }
/** 测试缝：注入命令行探测 `(pids) => Map<pid, string>`（F-MI7 值语义 = cmdline 字符串——
 *  核 `classifyEnd(cmdline)` / `isProductProc(cmdline)` 同面）；null = 真实探测。 */
export function _setCmdlineProbeForTest(fn) { cmdlineProbe = fn ?? null; syncProbeSeams(); snapshots.clear() }
/** 测试缝：时钟（缺省 `Date.now`）——注入即清快照（同两探针缝纪律：既有 `at` 打点作废）。 */
export function _setNowForTest(fn) { nowProbe = fn ?? null; snapshots.clear() }

/** 测试缝复位（清快照 + 单飞 + 两端缝——测试 afterEach 卫生用）。 */
export function _resetPeerInstancesForTest() {
  snapshots.clear()
  inflight.clear()
  nowProbe = null
  aliveProbe = null
  cmdlineProbe = null
  _resetProcessProbeTestImpl() // 核缝（双清：端 + 核）
}

// ─── 聚合（核 `groupSlotSessions` 逐字镜像——核内私有件未导出）──────────────────

/** manifest slotSessions → 按 sessionId 去重分组 [{ sessionId, pid, slots }]。
 *  sessionId 形如 "{pid}-{ts}-{rand}"（进程级——可去重分组）；pid 不可解析的条目 pid:null
 *  （调用面跳过——存量清理归 saveManifest 的 cleanDeadOwners；本模块纯只读不写）。 */
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

/** 快照写入（上限 CACHE_MAX——旧条目先出）。 */
function putSnapshot(cwd, entries) {
  if (!snapshots.has(cwd) && snapshots.size >= CACHE_MAX) {
    const oldest = snapshots.keys().next().value
    snapshots.delete(oldest)
  }
  snapshots.set(cwd, { at: now(), entries })
}

/**
 * 真算（异步）：manifest → 分组 → 去 self → ≤1 批量判活 → ≤1 批量 cmdline（仅活同伴）→
 * 身份复核（明确非本产品 ⇒ 剔除——D-MI11；探测失败 / 缺行 ⇒ **保守保留**，D-MI10）→
 * self 条 + 排序（pid 升序、self 优先——核同排序）。
 * 探测失败（`batchAliveAsync` → null）⇒ 按"无活伴"降级（只读面不显示幽灵同伴）。
 */
async function computePeers(cwd) {
  const m = loadManifest(cwd) // 损坏 → 空 manifest——按缺失降级（只读面不抛）
  const groups = groupSlotSessions(m)
  const myId = getSessionId()
  const others = groups.filter((g) => g.sessionId !== myId && g.pid != null)
  const othersAlive = others.length > 0 ? await batchAliveAsync([...new Set(others.map((g) => g.pid))]) : new Set()
  const aliveSet = othersAlive instanceof Set ? othersAlive : new Set()
  const liveOthers = others.filter((g) => aliveSet.has(g.pid))
  let cmdlines = null
  if (liveOthers.length > 0) cmdlines = await probeCmdlinesAsync([...new Set(liveOthers.map((g) => g.pid))])
  const known = cmdlines instanceof Map
  const peerGroups = liveOthers.filter((g) => {
    const cmd = known ? cmdlines.get(g.pid) : undefined
    return cmd == null || cmd === "" || isProductProc(cmd) // 缺行 / 探测失败 ⇒ 保守保留
  })
  const entries = []
  const selfGroup = groups.find((g) => g.sessionId === myId)
  if (selfGroup) {
    entries.push({ pid: selfGroup.pid ?? process.pid, sessionId: myId, slots: selfGroup.slots, end: END, self: true })
  }
  for (const g of peerGroups) {
    entries.push({
      pid: g.pid, sessionId: g.sessionId, slots: g.slots, self: false,
      end: known ? classifyEnd(cmdlines.get(g.pid)) : undefined,
    })
  }
  entries.sort((a, b) => a.pid - b.pid || (a.self === b.self ? 0 : a.self ? -1 : 1))
  return entries
}

/** 单飞真算 + 快照落盘（失败 ⇒ 保留旧快照 / 空——只读面不隐藏已知同伴）。 */
function refresh(cwd) {
  const running = inflight.get(cwd)
  if (running) return running
  const p = (async () => {
    try {
      const entries = await computePeers(cwd)
      putSnapshot(cwd, entries)
      return entries
    } catch {
      return snapshots.get(cwd)?.entries ?? []
    } finally {
      inflight.delete(cwd)
    }
  })()
  inflight.set(cwd, p)
  return p
}

// ─── 读面（SWR 同步壳 + 异步对偶）──────────────────────────

/**
 * 本 cwd 的活 thincoder 实例清单（含 self:true 条目——调用方自行排除：`pushPeerReminder`
 * 过滤 !self；`peer_instances` 工具去 self + 去 self 键）。**同步 SWR 读**（N-MI3：每回合
 * 调用面零同步 exec）：新鲜 ⇒ 直返快照；过期 ⇒ 返旧 + 后台刷新；无快照 ⇒ [] + 后台刷新。
 * manifest 缺失/损坏 → 空结果（降级——无会话即无同伴）。
 */
export function peerInstances(cwd) {
  const snap = snapshots.get(cwd)
  if (snap && now() - snap.at < SWR_TTL_MS) return snap.entries
  void refresh(cwd)
  return snap?.entries ?? []
}

/** 异步对偶（工具面 / 预热面）：await 真算结果（并发合并——同一 cwd 单飞）。 */
export function peerInstancesAsync(cwd) { return refresh(cwd) }

/** 预热（panel resolve 慢段调用）：先算一次落快照 ⇒ 首个回合读面命中快照（零 exec 直返）；
 *  已在飞 / 新鲜 ⇒ 单飞合并，不重复探测。 */
export function prewarmPeerInstances(cwd) { void refresh(cwd) }

// ─── L2 只读查询工具（registry 注册面——tools/index.mjs builtinTools）──────

/** 只读工具 peer_instances——schema description 逐字锚（MULTI-INSTANCE-COLLAB.md
 *  D-L2b 评审修正 #7——2026-09-06 定稿，双端照抄，不得改写）。
 *  F-MI7：execute → **async**；输出形 = 核同形（二空格缩进 JSON 数组——CLI 侧同面）；
 *  空结果 = `[]`（旧端侧兜底串 `"(no other live ThinCoder instances…)"` 退场——行为变更
 *  随批披露）。 */
export const peerInstancesTool = {
  name: "peer_instances",
  description:
    "peer_instances — read-only: list other live ThinCoder instances sharing this workspace cwd. " +
    "Returns [{ pid, end, sessionId, slots }]; never includes self; pure read — writes nothing.",
  parameters: { type: "object", properties: {} },
  readonly: true,
  async execute(args, ctx) {
    // 字段白名单精确输出：{pid, end, sessionId, slots}——self 键/任何其他键不进结果（N4）
    const list = (await peerInstancesAsync(ctx?.cwd)).filter((p) => !p.self)
      .map((p) => ({ pid: p.pid, end: p.end, sessionId: p.sessionId, slots: p.slots }))
    return JSON.stringify(list, null, 2)
  },
}
