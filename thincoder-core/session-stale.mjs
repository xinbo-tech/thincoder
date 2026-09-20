/**
 * session-stale.mjs — sessions 存量治理（SESSION.md §6.17 · STARTUP-LATENCY 批，2026-09-21）。
 *
 * 职责 = 分组 / 三合取判据 / 回收（rename 进回收批）/ 清运（超期批）/ 有界逐扫。
 * 全链异步（D-SE34）：本档零同步扫描——目录与逐文件面一律 `node:fs/promises`
 * （同步 fs 面只留单条目 `existsSync`——本档不使用；bounded 单文件面归既有档）。
 *
 * 可清组 ⟺ 三合取（D-SE35；组 = sessions 根下同一 40 位 cwd 哈希前缀的全文件集合）：
 *   ③ 安全窗：组内最新 mtime < now − STALE_SAFETY_WINDOW_MS（7 天——异常现场窗口）；
 *   ① 无活属主：manifest `slotSessions` 全量经入口一次探测束 + `ownerState` 三态——
 *      活 / 未知（探测失败 / 缺行）⇒ 保留；无 manifest ⇒ 无认领面 ⇒ 该条自动满足；
 *   ② 内容面不可达或无内容：**T1** = 组内可读数据文件 `cwd` 全部不存在于磁盘（至少读到一份）；
 *      **T2** = 组内无任何数据文件。数据文件不可读 / 无 `cwd` 字段 ⇒ T1 不成立 ⇒ 保留（fail-safe）。
 * 求值序 = ③ → ① → ②（任一步不通过 ⇒ 保留并短路）；选取顺序 = 组最新 mtime 升序（最旧优先）。
 * 预算（D-SE40）= **过 ③ 进 ① 即耗 1**（含 ① 面 manifest 读）——每 pass 总评估 ≤ `STALE_SWEEP_LIMIT`，
 * 达上限即停、余量下一 pass 继续；③ 短路组零预算（未读盘），① / ② 短路组已耗 1（不退）；
 * 显式面 limit = Infinity（全量）。
 * 90 天冷 cwd 判据**不在本档**（cwd 存活组唯一出口——保持显式命令面；实现住 session-gc.mjs）。
 *
 * 回收（D-SE36）：判据窗 7 天 + 回收保留 7 天 ⇒ 不可逆删除最早 = 最后写入 + 14 天；
 * 回收根 = 当次 sessions 根 `dir` 派生的同级 `sessions-trash/<批次时间戳>/`（sessions 根外——
 * 不参与扫描 / 不入发现面；`dir` 注入缝因此覆盖回收批）；逐文件 rename（同卷元数据操作）——
 * 单文件失败 / 回收根不可写 = 跳过并计数，**不 unlink 兜底**（零误删；部分移动态安全）。
 */
import { readdir, readFile, stat, rename, mkdir, rm } from "node:fs/promises"
import { join, dirname } from "node:path"
import { ownerPid } from "./session-slots-manifest.mjs"
import { probeOwnersAsync, ownerState } from "./process-probe.mjs"

export const STALE_SAFETY_WINDOW_MS = 7 * 24 * 3600 * 1000
export const STALE_SWEEP_LIMIT = 500
export const TRASH_RETENTION_MS = 7 * 24 * 3600 * 1000
export const TRASH_DIR_NAME = "sessions-trash"

/** 测试注入缝（`_traceHooks` 同惯例）：rename / mkdir / rm / stat / readdir 计数与失败注入。
 *  生产永远走真实实现（本对象只在测试内 `Object.assign` + 还原）。 */
export const _staleHooks = {
  readdir: (dir) => readdir(dir),
  readFile: (p) => readFile(p, "utf8"),
  stat: (p) => stat(p),
  rename: (from, to) => rename(from, to),
  mkdir: (dir) => mkdir(dir, { recursive: true }),
  rm: (dir) => rm(dir, { recursive: true, force: true }),
}

const GROUP_RE = /^([0-9a-f]{40})\.json(?:\.|$)/
const DATA_SUFFIX_RE = /^(?:\.\d+)?$/
const STAT_CHUNK = 128

/** 回收根（D-SE36）= 当次 sessions 根的同级 `sessions-trash`。 */
export function trashRootFor(dir) { return join(dirname(dir), TRASH_DIR_NAME) }

/** 分组（纯函数）：entries（名串或 {name, mtimeMs}）→ Map<hash, {hash, prefix, files,
 *  dataFiles, newestMtimeMs}>。只认 40 位哈希前缀族（非本族名一律不碰）；数据文件 =
 *  裸 `{hash}.json` 与 `{hash}.json.N`（记录存储 sidecar `.N.d` 与残留随组处理，不计入）。 */
export function groupSessionEntries(entries) {
  const groups = new Map()
  for (const e of entries) {
    const name = typeof e === "string" ? e : e?.name
    if (typeof name !== "string") continue
    const m = GROUP_RE.exec(name)
    if (!m) continue
    const hash = m[1]
    const prefix = `${hash}.json`
    let g = groups.get(hash)
    if (!g) { g = { hash, prefix, files: [], dataFiles: [], newestMtimeMs: 0 }; groups.set(hash, g) }
    g.files.push(name)
    if (DATA_SUFFIX_RE.test(name.slice(prefix.length))) g.dataFiles.push(name)
    if (typeof e !== "string") g.newestMtimeMs = Math.max(g.newestMtimeMs, Number(e?.mtimeMs) || 0)
  }
  return groups
}

/** 三合取判定（**纯函数**——零 IO；入参 = 已取证事实）：
 *  facts = { now, newestMtimeMs, ownerStates, dataFiles: [{readable, cwdExists}] }
 *  → { cleanable, reason }（reason 面：window / live-owner / unknown-owner / no-content /
 *  cwd-gone / cwd-exists / unreadable）。 */
export function judgeStaleGroup(facts) {
  const { now, newestMtimeMs = 0, ownerStates = [], dataFiles = [] } = facts
  if (!(newestMtimeMs < now - STALE_SAFETY_WINDOW_MS)) return { cleanable: false, reason: "window" }
  if (ownerStates.includes("alive")) return { cleanable: false, reason: "live-owner" }
  if (ownerStates.includes("unknown")) return { cleanable: false, reason: "unknown-owner" }
  if (!dataFiles.length) return { cleanable: true, reason: "no-content" } // T2
  for (const f of dataFiles) { // T1：可读数据文件 cwd 全不在盘（至少一份；不可读 ⇒ fail-safe 保留）
    if (!f.readable || f.cwdExists == null) return { cleanable: false, reason: "unreadable" }
    if (f.cwdExists) return { cleanable: false, reason: "cwd-exists" }
  }
  return { cleanable: true, reason: "cwd-gone" }
}

/** 目录快照 → 组集合：本族名逐条目 `stat` 异步（分块——非阻塞、不进启动关键路径）。
 *  names 缺省 = 自行 readdir（dir 注入缝；pass 编排可传共享快照——readdir 恰一次）。
 *  `hashes` 在场 ⇒ **按前缀预筛后再 stat**（单组重校验面：逐组调用不随存量放大——
 *  `--confirm <hash>` / 端侧命令面的逐组重校验成本 = O(该组文件数)）。 */
async function snapshotGroups(dir, names, hashes = null) {
  if (!names) {
    try { names = await _staleHooks.readdir(dir) } catch { return new Map() }
  }
  const want = hashes ? hashes.map((h) => `${h}.json`) : null
  const hit = names.map((n) => (typeof n === "string" ? n : n?.name))
    .filter((n) => typeof n === "string" && GROUP_RE.test(n) && (!want || want.some((p) => n === p || n.startsWith(p + "."))))
  const facts = []
  for (let i = 0; i < hit.length; i += STAT_CHUNK) {
    const chunk = await Promise.all(hit.slice(i, i + STAT_CHUNK).map(async (name) => {
      try { return { name, mtimeMs: (await _staleHooks.stat(join(dir, name))).mtimeMs } } catch { return null }
    }))
    for (const f of chunk) if (f) facts.push(f)
  }
  return groupSessionEntries(facts)
}

/** ① 面入参：manifest `slotSessions` 属主 pid（manifest 缺失 / 损坏 ⇒ 空 ⇒ 该条自动满足）。 */
async function manifestOwners(dir, prefix) {
  let m
  try { m = JSON.parse(await _staleHooks.readFile(join(dir, `${prefix}.manifest`))) } catch { return [] }
  const pids = []
  for (const owner of Object.values(m?.slotSessions ?? {})) {
    const pid = typeof owner === "string" && owner ? ownerPid(owner) : 0
    if (pid) pids.push(pid)
  }
  return pids
}

/** cwd 是否在盘（异步单条目）；非 ENOENT（权限 / 网络错）⇒ 不可判 ⇒ 视为存在（保守向）。 */
async function pathExists(p) {
  try { await _staleHooks.stat(p); return true } catch (e) { return e?.code !== "ENOENT" }
}

/** ② 面取证：逐数据文件（可读 ∧ cwd 字段在盘）。不可读 / 无 `cwd` ⇒ readable:false（fail-safe）。 */
async function dataFileFacts(dir, group) {
  const out = []
  for (const name of group.dataFiles) {
    let data = null
    try { data = JSON.parse(await _staleHooks.readFile(join(dir, name))) } catch { data = null }
    const cwd = typeof data?.cwd === "string" && data.cwd ? data.cwd : null
    out.push(cwd ? { readable: true, cwdExists: await pathExists(cwd) } : { readable: false, cwdExists: null })
  }
  return out
}

/**
 * 候选列举（显式面 / 自动面共用）：③（廉价——短路组零预算）→ ①（**过 ③ 进 ① 即耗 1 预算**——
 * 该组 manifest 读与（若过 ① 的）② 内容读均在此预算内）→ ②（内容判据）。
 * 预算闸 = 过 ③ 进 ① 的组数 ≤ `limit`（达上限即停——升序余量下一 pass 继续；显式面传 Infinity）。
 * 返回 { candidates, evaluated, groups }——`evaluated` = 过 ③ 进 ① 的组数（= 预算消耗组数，
 * 含 ① 面 manifest 读——D-SE40）。
 * `hashes` 在场 ⇒ 只判这些 hash（单组重校验面——`deleteStaleCwd` 用）。
 */
export async function listStaleCwds({ dir, entries = null, now = Date.now(), probeFn = probeOwnersAsync, limit = STALE_SWEEP_LIMIT, hashes = null } = {}) {
  const groups = await snapshotGroups(dir, entries, hashes)
  const all = [...groups.values()]
  const wanted = hashes ? all.filter((g) => hashes.includes(g.hash)) : all
  const ordered = wanted.sort((a, b) => a.newestMtimeMs - b.newestMtimeMs || (a.hash < b.hash ? -1 : 1))
  const ownersByHash = new Map()
  const allPids = new Set()
  let evaluated = 0
  for (const g of ordered) {
    if (!(g.newestMtimeMs < now - STALE_SAFETY_WINDOW_MS)) continue // ③ 短路（零预算——未读盘）
    if (evaluated >= limit) break // 预算闸（过 ③ 进 ① 即耗——达上限即停；余量下一 pass 继续）
    evaluated++ // 该组 ① manifest 读 +（若过 ① 的）② 内容读均在此预算内（D-SE40）
    const pids = await manifestOwners(dir, g.prefix)
    ownersByHash.set(g.hash, pids)
    for (const pid of pids) allPids.add(pid)
  }
  const bundle = allPids.size ? await probeFn([...allPids]) : { aliveSet: null, cmds: null }
  const candidates = []
  for (const g of ordered) {
    const pids = ownersByHash.get(g.hash)
    if (!pids) continue // ③ 短路 / 预算外（未进 ①）
    const states = pids.map((pid) => ownerState(pid, bundle))
    if (states.some((s) => s !== "dead")) continue // ① 短路（活 / 未知 ⇒ 保留——预算已耗，不退）
    const verdict = judgeStaleGroup({ now, newestMtimeMs: g.newestMtimeMs, ownerStates: states, dataFiles: await dataFileFacts(dir, g) })
    if (verdict.cleanable) {
      candidates.push({ hash: g.hash, prefix: g.prefix, reason: verdict.reason, dataFiles: g.dataFiles.length, newestMtime: g.newestMtimeMs, files: g.files })
    }
  }
  return { candidates, evaluated, groups: ordered.length }
}

/** 回收序（§6.17 落地顺序）：残留 / 端标记 → manifest → 数据文件。 */
function recycleRank(name, prefix) {
  const rest = name.slice(prefix.length)
  if (rest === ".manifest") return 1
  if (rest === "" || /^\.\d+$/.test(rest) || /^\.\d+\.d$/.test(rest)) return 2
  return 0
}

/** 逐组回收（组粒度——非事务）：逐文件 rename 进回收批。单文件失败 / 回收根不可写 = 跳过并计数，
 *  不 unlink 兜底（原文件零删除）；返回 { moved, skipped, batch }（零移动 ⇒ batch:null）。 */
export async function recycleGroup(group, { dir, now = Date.now() } = {}) {
  const batch = join(trashRootFor(dir), String(now))
  const out = { moved: [], skipped: [], batch: null }
  const ordered = [...group.files].sort((a, b) => recycleRank(a, group.prefix) - recycleRank(b, group.prefix))
  for (const name of ordered) {
    try {
      if (!out.batch) { await _staleHooks.mkdir(batch); out.batch = batch }
      await _staleHooks.rename(join(dir, name), join(batch, name))
      out.moved.push(name)
    } catch { out.skipped.push(name) }
  }
  if (!out.moved.length) out.batch = null
  return out
}

/** 单组回收（显式命令面 / 端侧命令面）：重校验（TOCTOU——单组重判三合取）→ 回收。
 *  `entries` = 目录名快照（可选——命令面循环可传同一快照免逐组全目录 readdir；
 *  mtime 事实同自动面 pass 模型，**① 面 manifest 读与探测束仍逐组新鲜**——变活组由 ① 拦截）。 */
export async function deleteStaleCwd(hash, { dir, now = Date.now(), probeFn = probeOwnersAsync, entries = null } = {}) {
  const { candidates } = await listStaleCwds({ dir, now, probeFn, limit: Infinity, hashes: [hash], entries })
  const target = candidates.find((c) => c.hash === hash)
  if (!target) return { ok: false, reason: "not-cold", deleted: [] } // 期间变活 / 出窗 ⇒ 拒绝（零删除）
  const r = await recycleGroup(target, { dir, now })
  if (!r.moved.length) return { ok: false, reason: "recycle-failed", deleted: [], skipped: r.skipped }
  return { ok: true, reason: target.reason, deleted: r.moved, skipped: r.skipped, batch: r.batch }
}

/** 清运（D-SE36）：超期回收批整删（批名 = 批次时间戳，13 位 epoch ms ⇒ 到期可比）。失败静默跳过
 *  （不误删在期批）；后续 pass 重试。非批次名（外来目录）一律不碰。 */
export async function purgeTrash({ dir, now = Date.now(), retentionMs = TRASH_RETENTION_MS } = {}) {
  const root = trashRootFor(dir)
  const out = { purged: [], failed: [] }
  let batches
  try { batches = await _staleHooks.readdir(root) } catch { return out } // 无回收根 ⇒ 无事可做
  for (const batch of batches) {
    if (!/^\d{13}$/.test(batch)) continue // 批名形态锁（本档写入口 = String(Date.now())）——外来目录不碰
    const ts = Number(batch)
    if (!(ts + retentionMs <= now)) continue
    try { await _staleHooks.rm(join(root, batch)); out.purged.push(batch) } catch { out.failed.push(batch) }
  }
  return out
}

/** 有界清立面 pass（**自动面**——绑启动**窗外延迟拍**（`scheduleSessionGC`），每进程一次）：
 *  候选（**过 ③ 进 ① ≤ `limit`**——含 ① 面 manifest 读）→ 逐组回收 → 超期批清运。
 *  全链异步；失败由调用面静默（本函数不抛——逐文件失败已计数）。 */
export async function sweepStale({ dir, entries = null, now = Date.now(), probeFn = probeOwnersAsync, limit = STALE_SWEEP_LIMIT } = {}) {
  const { candidates, evaluated, groups } = await listStaleCwds({ dir, entries, now, probeFn, limit })
  let moved = 0
  let skipped = 0
  for (const c of candidates) {
    const r = await recycleGroup(c, { dir, now })
    moved += r.moved.length
    skipped += r.skipped.length
  }
  const purged = await purgeTrash({ dir, now })
  return { groups, evaluated, candidates: candidates.length, moved, skipped, purged: purged.purged.length, purgeFailed: purged.failed.length }
}
