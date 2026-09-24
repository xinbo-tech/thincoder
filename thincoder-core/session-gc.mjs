/**
 * session-gc.mjs — 会话目录残留 GC + 冷 cwd / 存量组报告与回收（SESSION.md §6.12 · §6.17，2026-09-06）。
 *
 * F1 残留 GC（自动）：进程启动时对当前 cwd hash 前缀做一次轻量清理——.corrupted /
 * .unreadable / .manifest.corrupted / .bak-* 保留 30 天，孤儿 .tmp 保留 7 天
 *（mtime < now − retention 才删，等于保留期保留——older-than 边界语义）；**孤儿 sidecar
 * 记录目录 `.d`**（主文件 `{prefix}.{N}` 不存在）保留 30 天（数据现场族口径）⇒ **回收**
 *（rename 进 `sessions-trash`——目录承载记录存储本体，不可直删；D-SE36 同语义）。
 * 安全（N1）：活跃槽（主文件在 + manifest slotSessions[N] 属主活）的现场一律保留；
 * manifest 主文件 / end marker / 数据主文件永不进入候选（后缀预过滤只匹配残留后缀）。
 *
 * F2 冷 cwd（手动——12.2.4 三步，v1 不自动删 manifest）：判定 = manifest mtime 距今 > 90 天
 * 且无任何活跃数据文件（.json.N 不存在或全部属死主）；报告 = `session gc --dry-run`；
 * 回收 = `session gc --confirm <hash|--all>`（整前缀——manifest + end marker + 死主数据 +
 * 裸 v1 `{hash}.json` + 残留；回收前重校验冷态——TOCTOU 防护 T12）。
 *
 * STARTUP-LATENCY 批（2026-09-21 · §6.17）：① 全链异步化（D-SE34——本档零同步扫描：
 * `readdirSync`/`statSync`/`readFileSync`/`unlinkSync`/`rmSync` 一律退场，目录与逐文件面走
 * `node:fs/promises`；同步 fs 只留 `existsSync` 单条目探测）② 存量组面（三合取判据 / 回收 /
 * 清运 / 有界扫——住 `session-stale.mjs`，**启动窗外延迟拍**每进程每前缀一次、总评估 ≤ STALE_SWEEP_LIMIT）
 * ③ 删除改**回收目录**（同卷 rename——判据窗 7 天 + 回收 7 天 ⇒ 不可逆 ≥14 天；D-SE36）
 * ④ 显式命令面候选面自然扩大（冷 cwd ∪ 三合取存量组——零新增旗标）。
 * 触发形态（D-SE39 · 2026-09-21 微修）= 核侧 `setTimeout`（`GC_PASS_DELAY_MS` = 3s，自调度点起
 * ——pass 起点落于启动窗（TTY 门 ≤2s）之外）；**异步非阻塞**、不 unref（保后台排空现状）。
 *
 * 拆分理由（§6.12 review #1）：session-slots.mjs 已在 500 行硬限零余量，GC 是独立决策
 *（"何时清何种残留"），独立成模块；原语（sessionPath / ownerPid）自 session-slots import，
 * 启动钩子（session.mjs resumeSlot 包装）只一行调用。
 *
 * F-MI7（2026-09-18）：判活 = **核探测束**（`process-probe.mjs` `probeOwnersAsync`）+ `ownerState`
 * 三态查表——本档**零逐 pid 探测**；**未知 ⇒ 保留 / 不判冷**（D-MI10 同向）；入口面异步。
 */
import { existsSync } from "node:fs"
import { readdir, readFile, stat, unlink } from "node:fs/promises"
import { join, dirname, basename } from "node:path"
import { configDir } from "./config.mjs"
import { sessionPath, ownerPid } from "./session-slots.mjs"
import { probeOwnersAsync, ownerState } from "./process-probe.mjs"
import { listStaleCwds, deleteStaleCwd, recycleGroup, sweepStale, trashRootFor } from "./session-stale.mjs"
// sidecar 记录目录后缀常量（单源 = `session-segments.mjs:13`——本档经该常量判后缀形态；
// 两处名形匹配式（`classifyResidue` / `sweepOrphanRecordDirs`）按 `{prefix}.{N}` + 后缀内联，不构成第二单源）。
import { RECORD_DIR_SUFFIX } from "./session-segments.mjs"

/** 保留期（§6.12）：损坏现场（.corrupted/.unreadable/.manifest.corrupted）与并发轮转
 *  备份（.bak-*）30 天；孤儿 .tmp 7 天（崩溃现场恢复窗口）。 */
export const RESIDUE_RETENTION_MS = 30 * 24 * 3600 * 1000
export const ORPHAN_TMP_RETENTION_MS = 7 * 24 * 3600 * 1000
/** 冷 cwd 阈值（§6.12）：manifest mtime 距今 > 90 天（保守——正常开发会频繁触碰）。 */
export const COLD_CWD_RETENTION_MS = 90 * 24 * 3600 * 1000

function sessionsDir() { return join(configDir, "sessions") }

/** 残留分类（§6.12 后缀表）：name 须以 `${prefix}.` 开头（prefix = `${hash}.json`）。
 *  返回 { retention, slot, tmp, dir } 或 null（主文件/end marker/他前缀——不动）。
 *  slot = 关联槽号（`.N.` 段），无则 null（如 .manifest.corrupted）；`dir` = sidecar 记录目录
 *  形（`{prefix}.{N}.d`——孤儿判据反向：**主文件在 ⇒ 跳过**）。 */
function classifyResidue(name, prefix) {
  if (!name.startsWith(prefix + ".")) return null
  const slotMatch = name.slice(prefix.length).match(/^\.(\d+)\./)
  const slot = slotMatch ? Number(slotMatch[1]) : null
  if (name.endsWith(".corrupted") || name.endsWith(".unreadable")) return { retention: RESIDUE_RETENTION_MS, slot, tmp: false }
  if (/\.bak-\d+$/.test(name)) return { retention: RESIDUE_RETENTION_MS, slot, tmp: false }
  if (name.endsWith(".tmp")) return { retention: ORPHAN_TMP_RETENTION_MS, slot, tmp: true }
  if (name.endsWith(RECORD_DIR_SUFFIX) && /\.\d+\.d$/.test(name)) return { retention: RESIDUE_RETENTION_MS, slot, tmp: false, dir: true }
  return null
}

/** 活跃槽集合（§6.12 T3/T12 操作定义）：.json.N 主文件存在 且 manifest slotSessions[N]
 *  属主进程存活。manifest 缺失/损坏 → 空集（不阻碍残留清理）。
 *  探测 = **入口一次异步束**（零逐 pid exec）；三态消费：活 ⇒ 活跃；死 ⇒ 非活跃；
 *  **未知（探测失败 / 缺行）⇒ 计为活跃**（现场保留——D-MI10 同向）。 */
async function liveSlots(dir, prefix, probeFn) {
  const active = new Set()
  let m
  try { m = JSON.parse(await readFile(join(dir, `${prefix}.manifest`), "utf8")) } catch { return active }
  const entries = []
  for (const [n, owner] of Object.entries(m.slotSessions ?? {})) {
    if (!/^\d+$/.test(n) || !owner) continue
    if (!existsSync(join(dir, `${prefix}.${n}`))) continue
    const pid = ownerPid(owner)
    if (pid) entries.push([Number(n), pid])
  }
  if (!entries.length) return active
  const bundle = await probeFn([...new Set(entries.map(([, pid]) => pid))])
  for (const [n, pid] of entries) {
    if (ownerState(pid, bundle) !== "dead") active.add(n)
  }
  return active
}

/**
 * 残留 GC（§6.12——单 cwd 前缀，不跨 cwd 扫描）：返回 { candidates, deleted }
 * （dryRun 时 candidates 照列、deleted 为空——只列不删，N2 可预览）。
 * 扫描先按后缀预过滤（N4——只 stat 残留候选），再对候选做活跃槽/孤儿/保留期判定；
 * 无残留候选 ⇒ **零探测早退**（不发起探测束）。probeFn = 测试注入缝（缺省核异步束）；
 * `entries` = 共享目录快照（启动 pass 只 readdir 一次——缺省自行读）。
 */
export async function gcResidue({ dir = sessionsDir(), prefix, now = Date.now(), dryRun = false, probeFn = probeOwnersAsync, entries = null } = {}) {
  const result = { candidates: [], deleted: [] }
  let names = entries
  if (!names) {
    try { names = await readdir(dir) } catch { return result }
  }
  const candidates = []
  for (const name of names) {
    const c = classifyResidue(name, prefix)
    if (c) candidates.push({ name, ...c })
  }
  if (!candidates.length) return result
  const active = await liveSlots(dir, prefix, probeFn)
  for (const c of candidates) {
    if (c.slot !== null && active.has(c.slot)) continue // N1：活跃槽现场一律保留（T3）
    const p = join(dir, c.name)
    if (c.tmp && existsSync(p.slice(0, -".tmp".length))) continue // 非孤儿 .tmp（主文件在——写中/回退候选）
    if (c.dir && existsSync(p.slice(0, -RECORD_DIR_SUFFIX.length))) continue // 非孤儿 sidecar（主文件在 ⇒ 记录存储本体——不动；仅孤儿目录入候选）
    let st
    try { st = await stat(p) } catch { continue }
    if (st.mtimeMs >= now - c.retention) continue // 边界：older-than 才删，等于保留期保留（§6.12）
    result.candidates.push(c.name)
    if (dryRun) continue
    if (c.dir) {
      // 目录承载记录存储本体 ⇒ **回收**（rename 进 `sessions-trash/<批次>/`——不 unlink / 不同步 fs；
      // 失败 ⇒ 跳过并计数（candidates − deleted）+ 原目录零删除）
      const r = await recycleGroup({ prefix, files: [c.name] }, { dir, now })
      if (r.moved.length) result.deleted.push(c.name)
      continue
    }
    try { await unlink(p); result.deleted.push(c.name) } catch { /* 占用/竞态——跳过 */ }
  }
  return result
}

/** ② 显式面清运腿（§6.12 / §6.17 补充——存量通路）：全目录孤儿 sidecar 记录目录
 *（`{prefix}.{N}.d`——主文件不存在 ∧ 该槽非活跃）⇒ 逐条**回收**（rename 进 `sessions-trash/<批次>/`，同 ① 语义）。
 *  与 ① 两面之差：① = 自动面（单前缀 / 当前 cwd / **带 30 天保留期**——只治本前缀未来新增）；
 *  本函数 = **用户显式面**（跳前缀遍历全目录 / **不设保留期**——存量孤儿跨多前缀且多为近期孤儿，
 *  自动面望不到；进程入口 = `--dry-run` 先列 / `--confirm --all` 才动，且回收可回退）。
 *  `dryRun` ⇒ 只列不删；目录不可读 ⇒ 空集。失败 ⇒ 跳过（不 unlink 兜底——原目录零删除）。 */
export async function sweepOrphanRecordDirs({ dir = sessionsDir(), now = Date.now(), dryRun = false, probeFn = probeOwnersAsync, entries = null } = {}) {
  const out = { candidates: [], recycled: [] }
  let names = entries
  if (!names) {
    try { names = await readdir(dir) } catch { return out }
  }
  const present = new Set(names)
  const byPrefix = new Map() // prefix → [{ name, slot }]
  for (const name of names) {
    const m = /^(.+\.json)\.(\d+)\.d$/.exec(name)
    if (!m) continue
    if (present.has(`${m[1]}.${m[2]}`)) continue // 主文件在 ⇒ 非孤儿（记录存储本体——不动）
    if (!byPrefix.has(m[1])) byPrefix.set(m[1], [])
    byPrefix.get(m[1]).push({ name, slot: Number(m[2]) })
  }
  for (const [prefix, items] of byPrefix) {
    const active = await liveSlots(dir, prefix, probeFn) // N1：活跃槽现场一律保留
    for (const it of items) {
      if (active.has(it.slot)) continue
      let st
      try { st = await stat(join(dir, it.name)) } catch { continue }
      if (st) out.candidates.push(it.name)
      if (dryRun) continue
      const r = await recycleGroup({ prefix, files: [it.name] }, { dir, now })
      if (r.moved.length) out.recycled.push(it.name)
    }
  }
  return out
}

/** 启动**窗外延迟拍** pass（§6.17 编排——点火见 `scheduleSessionGC`）：① 一次**异步目录快照**
 *  （readdir 恰一次——两面共享）② 残留面（gcResidue 既有判据）③ 存量面（总评估有界
 *  ≤ STALE_SWEEP_LIMIT（含 ① 面 manifest 读——D-SE40）+ 超期回收批清运）。
 *  目录缺失 / 不可读 ⇒ 两面各自降级（零副作用）。 */
async function gcPass(dir, prefix) {
  let entries = null
  try { entries = await readdir(dir) } catch { /* 降级：两面各自再试或不做事 */ }
  await gcResidue({ dir, prefix, entries }).catch(() => { /* 清理失败静默——不影响主流程 */ })
  await sweepStale({ dir, entries }).catch(() => { /* 同上 */ })
}

/** 启动窗外延迟拍的延迟（D-SE39）：自调度点起 3s——pass 起点落于启动窗（TTY 门 ≤2s）之外。 */
export const GC_PASS_DELAY_MS = 3000
let gcPassDelayMs = GC_PASS_DELAY_MS

/** 测试缝（`_setSessionsDirForTest` 同款）：用例置 0–短值即可点火（勿真等 3s）；
 *  还原 = `_setSessionGcDelayForTest(GC_PASS_DELAY_MS)`。 */
export function _setSessionGcDelayForTest(ms) { gcPassDelayMs = ms }

const scheduledPrefixes = new Set()

/** 启动钩子（§6.12 review #8——N4；触发形态 = **启动窗外延迟拍**，§6.17 D-SE39）：
 *  GC 延后 `GC_PASS_DELAY_MS`（3s——自调度点起）点火 ⇒ 启动链不因 pass 竞争劣化；
 *  **异步非阻塞**；每进程每前缀一次（Set 去重——resumeSlot 可多次进入）；**不 unref**
 *  （保后台排空现状）。
 *  F-SL1：pass 全链异步（D-SE34——零同步扫描，判据 = 启动路径同步 fs 阻塞 ≤50ms）。 */
export function scheduleSessionGC(cwd) {
  let base
  try { base = sessionPath(cwd) } catch { return }
  if (scheduledPrefixes.has(base)) return
  scheduledPrefixes.add(base)
  setTimeout(() => { gcPass(dirname(base), basename(base)).catch(() => { /* 静默 */ }) }, gcPassDelayMs)
}

/**
 * 冷 cwd 枚举（§6.12 步骤 1/2——跨 cwd 报告面，仅手动命令调用）：候选 =
 * manifest mtime 距今 > 90 天 且 无活跃数据文件（.json.N 主文件不存在或全部属死主进程）。
 * 返回 [{ hash, prefix, manifestMtime, dataFiles, files }]（files = 整前缀全部文件——
 * 含裸 v1 `{hash}.json`，§6.12 D-V1——dataFiles 仅 .json.N，v1 不参与冷态判定）。
 * 探测 = **全部候选前缀一次异步束**（两遍：先筛候选并收 pid，再一次判活 + 三态）；
 * **未知 ⇒ 非冷（保留）**——探测失败不得判冷（D-MI10 同向）。
 * `hashes` = 单组重校验（显式面 `--confirm <hash>`）；`entries` = 共享快照。
 */
export async function listColdCwds({ dir = sessionsDir(), now = Date.now(), probeFn = probeOwnersAsync, hashes = null, entries = null } = {}) {
  let names = entries
  if (!names) {
    try { names = await readdir(dir) } catch { return [] }
  }
  const cands = []
  for (const name of names) {
    if (!name.endsWith(".json.manifest")) continue // end marker（.manifest.cli/.vscode）与 .manifest.corrupted 天然排除
    const prefix = name.slice(0, -".manifest".length) // `${hash}.json`
    if (hashes && !hashes.includes(prefix.slice(0, -".json".length))) continue
    let st
    try { st = await stat(join(dir, name)) } catch { continue }
    if (st.mtimeMs >= now - COLD_CWD_RETENTION_MS) continue // 近期活跃（<90 天阈值——T10）
    let m
    try { m = JSON.parse(await readFile(join(dir, name), "utf8")) } catch { continue } // 损坏 manifest 不判冷（.corrupted 归残留 GC）
    const dataFiles = names.filter((e) => e.startsWith(prefix + ".") && /^\d+$/.test(e.slice(prefix.length + 1)))
    const owners = dataFiles.map((e) => {
      const slotName = e.slice(prefix.length + 1)
      const pid = ownerPid(m.slotSessions?.[slotName] ?? "")
      return pid || 0
    })
    cands.push({ prefix, manifestMtime: st.mtimeMs, dataFilesLen: dataFiles.length, owners })
  }
  if (!cands.length) return []
  const pids = [...new Set(cands.flatMap((c) => c.owners).filter(Boolean))]
  const bundle = await probeFn(pids) // 空清单 ⇒ 探测面零 exec 早退
  const cold = []
  for (const c of cands) {
    // 死主数据文件判定：三态——活 / 未知 ⇒ 非冷（保守保留）；无非自身属主 ⇒ 无活跃数据文件
    const hasLive = c.owners.some((pid) => pid && ownerState(pid, bundle) !== "dead")
    if (hasLive) continue // 有活跃数据文件 → 非冷（T12）；探测失败 ⇒ 未知 ⇒ 同向保留
    cold.push({
      hash: c.prefix.slice(0, -".json".length),
      prefix: c.prefix,
      manifestMtime: c.manifestMtime,
      dataFiles: c.dataFilesLen,
      files: names.filter((e) => e.startsWith(c.prefix + ".") || e === c.prefix), // 整前缀清空含裸 v1 {hash}.json（§6.12 D-V1）
    })
  }
  return cold
}

/**
 * 回收指定可清组（§6.12 步骤 3 + §6.17 D-SE36）：冷 cwd 面（90 天）优先——**2026-09-21 起经
 * 回收目录**（逐文件 rename 进 `sessions-trash/<批次时间戳>/`；不可逆删除最早 = 最后写入 + 14 天，
 * 恢复 = 移回原目录）；非冷 ⇒ 三合取存量组面（同判据单组重校验）。两面前均重校验（TOCTOU——
 * 期间变活 / 出窗 ⇒ 拒绝 `{ok:false, reason:"not-cold"}`，零删除）。`entries` = 目录名快照
 *（可选——命令面循环传同一快照免逐组全目录 readdir；① 面 manifest 读与探测束仍逐组新鲜）。
 */
export async function deleteColdCwd(hash, { dir = sessionsDir(), now = Date.now(), probeFn = probeOwnersAsync, entries = null } = {}) {
  const target = (await listColdCwds({ dir, now, probeFn, hashes: [hash], entries })).find((c) => c.hash === hash)
  if (target) {
    const r = await recycleGroup(target, { dir, now })
    if (!r.moved.length) return { ok: false, reason: "recycle-failed", deleted: [], skipped: r.skipped }
    return { ok: true, reason: "cold-90d", deleted: r.moved, skipped: r.skipped, batch: r.batch }
  }
  return deleteStaleCwd(hash, { dir, now, probeFn, entries }) // 三合取面（含 TOCTOU 重校验；不中 ⇒ not-cold）
}

/**
 * ④ 端差段 · 显式执行面（§6.12 / §6.17 D-SE38）——命令行壳 `thincoder session gc` 与
 * 端侧命令（`thincoder.sessionGc`——经数据面 API，不消费本函数）共同的数据面；
 * 本段**核内零消费方**（结构机检③）：核内保存实现（取一侧），命令接线属壳侧（S2）。
 *
 * 候选面（§6.17）= 冷 cwd（90 天冷判据——cwd 存活组唯一出口）∪ 三合取存量组（**全量面**——
 * 显式面无 STALE_SWEEP_LIMIT 闸：② 面滞留的兜底）。删除 = 回收（可回退）。
 *   --dry-run          报告当前 cwd 残留候选 + 全部可清组候选（reason + 文件数；只列不删，N2 预览）
 *   --confirm <hash>   回收指定组整前缀（警告 + 文件清单 + TOCTOU 重校验）
 *   --confirm --all    逐候选同型回收
 * 返回进程退出码（0/1）。dir/prefix/now/out/err/probeFn 为测试注入缝（默认生产行为）。
 *
 * #178（hygiene-sweep 批）：显式面进度 / 预估——**只增显示行，零触判据与删除集**（口径 = 台账
 * #178 真机实测 ≈6ms/候选（6,887 候选 ≈41.6s），仅用于预估显示）。
 */
const GC_MS_PER_CANDIDATE = 6
const fmtGcEstimate = (n) => `~${Math.max(1, Math.round((n * GC_MS_PER_CANDIDATE) / 1000))}s`
const GC_PROGRESS_MIN = 2 // 候选数 ≥ 本值 ⇒ 出预估 / 逐组进度行（单组面输出逐字零变）
export async function runSessionGc(args, { dir = sessionsDir(), prefix = null, cwd = process.cwd(), now = Date.now(), out = console.log, err = console.error, probeFn = probeOwnersAsync } = {}) {
  const dryRun = args.includes("--dry-run")
  const confirmIdx = args.indexOf("--confirm")
  const hasConfirm = confirmIdx >= 0
  const confirmTarget = hasConfirm ? args[confirmIdx + 1] : null
  // --dry-run 与 --confirm 互斥（review 🔵#4——同给时不得静默忽略 confirm；无值 --confirm 同为用法错误）
  if (args[0] !== "gc" || (!dryRun && !hasConfirm) || (dryRun && hasConfirm) || (hasConfirm && !confirmTarget)) {
    err("Usage: thincoder session gc --dry-run | --confirm <hash> | --confirm --all")
    return 1
  }

  // 单组面（`--confirm <hash>`）：候选面收窄到该 hash（免全量 ② 评估）；`--all` / `--dry-run` = 全量面
  const hashFilter = dryRun || confirmTarget === "--all" ? null : [confirmTarget]
  const cold = await listColdCwds({ dir, now, probeFn, hashes: hashFilter })
  const stale = (await listStaleCwds({ dir, now, probeFn, limit: Infinity, hashes: hashFilter })).candidates
  const coldHashes = new Set(cold.map((c) => c.hash)) // 冷面命中的组不重复列（并集——同一组两判据可达）
  const candidates = [
    ...cold.map((c) => ({ ...c, reason: "cold-90d" })),
    ...stale.filter((c) => !coldHashes.has(c.hash)),
  ]

  if (dryRun) {
    out("Session GC dry-run — no files will be deleted.")
    // 当前 cwd 残留（§6.12 删除面——自动 GC 的预览）
    let p = prefix
    if (!p) { try { p = basename(sessionPath(cwd)) } catch { p = null } }
    const residue = p ? await gcResidue({ dir, prefix: p, now, dryRun: true, probeFn }) : { candidates: [] }
    out(`Residue candidates for current project (${p ?? "unknown"}): ${residue.candidates.length}`)
    for (const name of residue.candidates) out(`  ${name}`)
    // 孤儿 sidecar 记录目录（② 存量面——全目录；主文件不在 + 该槽非活跃——不设保留期）
    const orphanDirs = await sweepOrphanRecordDirs({ dir, now, dryRun: true, probeFn })
    out(`Orphan record-dir (.d) candidates (main file gone; explicit face — no retention): ${orphanDirs.candidates.length}`)
    for (const name of orphanDirs.candidates) out(`  ${name}`)
    out(`Cold/stale project candidates (cold = manifest idle > 90 days; stale = no live owner + cwd unreachable/empty + 7-day window): ${candidates.length}`)
    for (const c of candidates) out(`  ${c.hash}  reason ${c.reason}  files ${c.files.length}`)
    if (candidates.length >= GC_PROGRESS_MIN) out(`Estimate: ${fmtGcEstimate(candidates.length)} to scan ${candidates.length} candidates (measured ≈${GC_MS_PER_CANDIDATE}ms/candidate).`)
    if (candidates.length) out('Run "thincoder session gc --confirm <hash>" (or --confirm --all) to move a project prefix into the recycle bin (recoverable: sessions-trash/<timestamp>/, 7 days).')
    return 0
  }

  // --confirm：回收前警告（N2 可逆——文件清单 + 回收提示）；deleteColdCwd 内部重校验（TOCTOU）。
  // 一次性目录快照（逐组重校验复用——同自动面 pass 模型；① 面 manifest 读与探测束仍逐组新鲜）。
  let loopEntries = null
  if (confirmTarget === "--all") {
    try { loopEntries = await readdir(dir) } catch { loopEntries = null }
  }
  const targets = confirmTarget === "--all" ? candidates : candidates.filter((c) => c.hash === confirmTarget)
  // ② 面候选预列（孤儿 sidecar 记录目录——存量通路；只列不删——实回收在组循环后）
  const orphanDirs = confirmTarget === "--all" ? await sweepOrphanRecordDirs({ dir, now, dryRun: true, probeFn, entries: loopEntries }) : { candidates: [] }
  if (!targets.length && !orphanDirs.candidates.length) {
    err(`Refused: ${confirmTarget} is not a cold/stale project (active, recent, or unknown) — nothing deleted.`)
    return 1
  }
  let i = 0
  if (targets.length >= GC_PROGRESS_MIN) out(`${targets.length} groups to recycle — estimate ${fmtGcEstimate(targets.length)} (progress per group below).`)
  for (const t of targets) {
    i++
    if (targets.length >= GC_PROGRESS_MIN) out(`[${i}/${targets.length}] ${t.hash} — ${t.files.length} files`)
    out(`WARNING: 此操作将回收该 cwd 的全部会话历史 (hash ${t.hash}, ${t.files.length} files) → ${trashRootFor(dir)}:`)
    for (const name of t.files) out(`  ${name}`)
    const r = await deleteColdCwd(t.hash, { dir, now, probeFn, entries: loopEntries })
    if (!r.ok) {
      err(r.reason === "recycle-failed"
        ? `Recycle failed for ${t.hash} — skipped (files kept in place).`
        : `Refused: ${t.hash} is no longer cold (became active) — skipped.`)
      continue
    }
    out(`Moved ${r.deleted.length} files for ${t.hash} into the recycle bin (${r.batch})${r.skipped?.length ? ` — skipped ${r.skipped.length} (locked/racing, kept in place)` : ""}.`)
  }
  // ② 显式面清运腿（孤儿 sidecar 记录目录——存量通路；与 ① 同语义：rename 进回收批）
  if (confirmTarget === "--all" && orphanDirs.candidates.length) {
    const moved = await sweepOrphanRecordDirs({ dir, now, probeFn, entries: loopEntries })
    out(`Orphan record dirs (.d): moved ${moved.recycled.length}/${moved.candidates.length} into the recycle bin (${trashRootFor(dir)}).`)
  }
  return 0
}
