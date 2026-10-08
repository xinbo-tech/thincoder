/**
 * memory/maintain.mjs — 索引自维护引擎（自愈轮 · MEMORY.md §6.14 面⑤ · 台账 #1096 · 2026-10-08）。
 *
 * 单引擎单入口（D-MEM33）：`maintainMemory` = 自动拍 ∥ 工具同一单点。三动作（执行序 = ⑤-4）：
 *   ① 鬼行 GC（F-S10 · ⑤-1）——全 origin 逐档探针（含停更者）；判亡 = 原样 ∥ 归一形两路径皆
 *      ENOENT（仅 ENOENT——其余保留）；origin 树亡短路（`treeState`）；命中 > 0 才取备份
 *      （`takeBackup`——与 sweep 同判据同命名）；单事务逐档删 + 写后回读（不过 ⇒ 回滚 ⇒ 零写）。
 *   ② 压实（F-S11 · ⑤-2）——`freelist ≥ 64 MiB` ∧ `freelist ∕ db ≥ 20%` 双式联立越阈才 `VACUUM`
 *      （后读 = GC 之后读 freelist）；未越 ⇒ 零动作（N-S9）；忙 ∥ 失败 ⇒ 跳过（fail-safe——不改数据）。
 *   ③ 轮转（F-S12 · ⑤-3）——严格名族 `<basename(dbPath)>.sweep-backup-<14 位戳>` 保最新 N
 *      （`config.memory.maintain.backupKeep`——缺省 2 · 钳 ≥ 1）；非本族文件零触；失败跳过计数不抛。
 *
 * 安全封套（N-S8 · ⑤-6）：同一引擎同一安全口径——备份先行 ∥ ENOENT-only ∥ 干跑读数随行
 * （工具面缺省 = 干跑；自动拍 = 非干跑）∥ 写后回读。低峰不阻塞：鬼行扫描分片让出（`SCAN_YIELD_MS`
 * 口径——探针循环读钟让出）∥ 写面短事务；`VACUUM` 单语句不可让出（已知界——恰一次全库重写；
 * 升级路径 = worker，承面② 判据腿）。
 *
 * 复用（单源 = §6.14 引擎表）：`sweep.mjs` 的 `probeOriginPath` ∥ `treeState` ∥ `takeBackup`
 * （+ `backupPathFor`）∥ `originCounts`。`files` 表不涉（记忆层非项目文件）；§6.11 ∥ §6.13 判据零改。
 *
 * 测试缝（L-⑥ 各腿所需）：阈值参数（`??` 缺省核常量）∥ `vacuumFn` ∥ `probeFn` ∥ `yieldFn`
 * （+ `nowFn` ∥ `yieldMs` ∥ `yieldCheckRows` ∥ `now` ∥ `backupKeep`）；调度缝 =
 * `_setMemoryMaintenanceDelayForTest`。调度（⑤-5）= `scheduleMemoryMaintenance`——每进程一次 ∥
 * 延迟拍（缺省 3 s——先例 `session-index-pass.mjs`）∥ 异步非阻塞 ∥ 失败静默（+ `logEvent`）∥
 * 库不在盘零动作（不建库——读面纪律）。
 */
import { existsSync, readdirSync, statSync, unlinkSync } from "node:fs"
import { basename, dirname, join } from "node:path"
import { loadConfig } from "../config.mjs"
import { errText, logEvent } from "../log.mjs"
import { createMemory } from "./schema.mjs"
import { yieldTick } from "./code-index.mjs"
import { normalizeOrigin } from "./origin.mjs"
import { SCAN_YIELD_CHECK_ROWS, SCAN_YIELD_MS } from "./scan.mjs"
import { backupPathFor, originCounts, probeOriginPath, takeBackup, treeState } from "./sweep.mjs"

// ── 核常量（⑤-2 ∥ ⑤-3——缺省值 = 用户拍 §4 批准：64 MiB ∧ 20% ∥ N = 2；常量不声明面）────────

/** 压实下限：`freelist_bytes ≥ 此值`（64 MiB——防小库频压）。 */
export const MAINTAIN_FREELIST_MIN_BYTES = 64 * 1024 * 1024
/** 压实比值：`freelist_bytes ∕ db_bytes ≥ 此值`（20%——防大库小益）。 */
export const MAINTAIN_FREELIST_RATIO = 0.2
/** 轮转缺省保 N（`config.memory.maintain.backupKeep` 缺省值——引擎钳 ≥ 1）。 */
export const MAINTAIN_BACKUP_KEEP_DEFAULT = 2
/** 自动拍延迟缺省（⑤-5——启动窗外 3 s）。 */
export const MEMORY_MAINTENANCE_DELAY_MS = 3000

/** GC 表集（⑤-1）：`code_chunks` ∥ `doc_chunks`——`files` 表不涉（记忆层非项目文件）。 */
const GC_TABLES = [["code_chunks", "code"], ["doc_chunks", "doc"]]
/** 报告面死档明细显示上限（总数仍在读数面）。 */
const GC_DISPLAY_CAP = 20

const groupKey = (origin, path) => `${origin}\u0001${path}`
const step = (action, status, reason, readings) => ({ action, status, reason: reason ?? null, readings })

/** 两路径态（原样 ∥ 归一形——`treeState` 的逐档版）：alive 优先；两路径皆 ENOENT 才判亡；
 *  其余错误 ⇒ unknown（保留——仅 ENOENT 判亡同律）。`probe` = 注入口（缺省 `probeOriginPath`）。 */
function twoPathState(probe, a, b) {
  const sa = probe(a), sb = a === b ? sa : probe(b)
  if (sa === "alive" || sb === "alive") return "alive"
  return sa === "dead" && sb === "dead" ? "dead" : "unknown"
}

/** 鬼行扫描面 census：逐 `(origin, path)` 分组计数（两表并集——`files` 表不涉）。 */
function groupCensus(db) {
  const map = new Map()
  for (const [table, key] of GC_TABLES) {
    for (const r of db.prepare(`SELECT origin, path, COUNT(*) AS n FROM ${table} GROUP BY origin, path`).all()) {
      const k = groupKey(r.origin, r.path)
      const cur = map.get(k) ?? { origin: r.origin, path: r.path, code: 0, doc: 0 }
      cur[key] = Number(r.n)
      map.set(k, cur)
    }
  }
  return map
}

/** 鬼行扫描（零写 · ⑤-1）：逐档探针 + 树亡短路；让出 = `SCAN_YIELD_MS` 口径（每
 *  `yieldCheckRows` 档读钟，过预算让出——「低峰不阻塞」半条）。返回 { groups, dead, keep, unknown, yields }。 */
async function scanGhosts(db, { probeFn, yieldFn, nowFn, yieldMs, yieldCheckRows }) {
  const groups = [...groupCensus(db).values()]
    .sort((a, b) => (a.origin < b.origin ? -1 : a.origin > b.origin ? 1 : a.path < b.path ? -1 : a.path > b.path ? 1 : 0))
  const trees = new Map()
  const dead = [], keep = [], unknown = []
  let checked = 0, yields = 0, lastYieldAt = nowFn()
  for (const g of groups) {
    if (!trees.has(g.origin)) trees.set(g.origin, treeState(g.origin))
    const state = trees.get(g.origin).dead
      ? "dead" // 树亡短路（同一判据免逐档探针——⑤-1）
      : twoPathState(probeFn, join(g.origin, g.path), join(normalizeOrigin(g.origin), g.path))
    if (state === "dead") dead.push(g)
    else if (state === "unknown") unknown.push(g)
    else keep.push(g)
    if (++checked >= yieldCheckRows) {
      checked = 0
      if (nowFn() - lastYieldAt >= yieldMs) { await yieldFn(); yields++; lastYieldAt = nowFn() }
    }
  }
  return { groups, dead, keep, unknown, yields }
}

/**
 * ⑤-1 鬼行 GC：`confirm:false` ⇒ 纯计划（零写 ∥ 零备份）；`confirm:true` ⇒ 命中 > 0 先取备份
 * （目标已存在 ∥ 判据不过 ⇒ 抛 ⇒ **零写**），再单事务逐档删 + 写后回读。
 * 写后回读 = 命中档零行（逐档点查）∧ 其余 origin 逐键等前值（`originCounts` 差量——命中 origin
 * 恰减其实删数；保留 ∥ 探针错档零变含于其中；`files` 表零变），不过 ⇒ 抛 ⇒ 回滚。
 */
async function ghostGcStep(memory, { confirm, dbPath, now, probeFn, yieldFn, nowFn, yieldMs, yieldCheckRows }) {
  const scan = await scanGhosts(memory.db, { probeFn, yieldFn, nowFn, yieldMs, yieldCheckRows })
  const readings = {
    scannedGroups: scan.groups.length,
    deadGroups: scan.dead.length,
    deadRows: scan.dead.reduce((n, g) => n + g.code + g.doc, 0),
    keptGroups: scan.keep.length,
    unknownGroups: scan.unknown.length,
    yields: scan.yields,
    deletedRows: null,
    backupPath: null,
    dead: scan.dead.map((g) => ({ origin: g.origin, path: g.path, code: g.code, doc: g.doc })),
  }
  if (scan.dead.length === 0) return step("gc", "skipped", "no ghost rows (all origins probed — nothing judged dead)", readings)
  if (!confirm) return step("gc", "planned", null, readings)
  if (typeof dbPath !== "string" || !dbPath || dbPath === ":memory:") {
    throw new Error("memory maintain: gc requires a file dbPath (backup naming basis) — write refused without a rollback object")
  }
  readings.backupPath = takeBackup(memory.db, backupPathFor(dbPath, now)) // 命中 > 0 才取；抛 ⇒ 零写
  const db = memory.db
  const del = new Map() // origin → { code, doc }（实删数——回读差量基准）
  db.exec("BEGIN IMMEDIATE")
  try {
    const before = originCounts(db)
    for (const g of scan.dead) {
      for (const [table, key] of GC_TABLES) {
        const n = Number(db.prepare(`DELETE FROM ${table} WHERE origin = ? AND path = ?`).run(g.origin, g.path).changes)
        const cur = del.get(g.origin) ?? { code: 0, doc: 0 }
        cur[key] += n
        del.set(g.origin, cur)
      }
    }
    for (const g of scan.dead) { // ① 命中档零行
      for (const [table] of GC_TABLES) {
        const { n } = db.prepare(`SELECT COUNT(*) AS n FROM ${table} WHERE origin = ? AND path = ?`).get(g.origin, g.path)
        if (Number(n) !== 0) throw new Error(`memory maintain read-back failed: ghost rows remain in ${table} (${g.origin} / ${g.path})`)
      }
    }
    const after = originCounts(db) // ② 其余 origin 逐键等前值（差量 = 实删数）
    for (const o of new Set([...before.keys(), ...after.keys()])) {
      const b = before.get(o) ?? { code: 0, doc: 0, files: 0 }
      const a = after.get(o) ?? { code: 0, doc: 0, files: 0 }
      const d = del.get(o) ?? { code: 0, doc: 0 }
      if (a.code !== b.code - d.code || a.doc !== b.doc - d.doc || a.files !== b.files) {
        throw new Error(`memory maintain read-back failed: origin counts drifted beyond hits (${o})`)
      }
    }
    db.exec("COMMIT")
  } catch (e) {
    try { db.exec("ROLLBACK") } catch { /* 已回滚 ∥ 事务未开 */ }
    throw e
  }
  readings.deletedRows = [...del.values()].reduce((n, c) => n + c.code + c.doc, 0)
  return step("gc", "executed", null, readings)
}

/** freelist 读数（⑤-2）：`PRAGMA freelist_count × page_size` ∥ `statSync(dbPath)`（承 §4.10 读数面口径——
 *  freelist = 维护内部读数，不入可见面）。 */
function freelistReading(db, dbPath) {
  const pageSize = Number(db.prepare("PRAGMA page_size").get()?.page_size ?? 0)
  const count = Number(db.prepare("PRAGMA freelist_count").get()?.freelist_count ?? 0)
  let dbBytes = null
  try {
    dbBytes = typeof dbPath === "string" && dbPath && dbPath !== ":memory:" ? statSync(dbPath).size : null
  } catch { dbBytes = null }
  return { freelistBytes: count * pageSize, dbBytes }
}

/**
 * ⑤-2 压实：双式联立越阈（`freelist ≥ 64 MiB` ∧ `freelist ∕ db ≥ 20%`——阈值参数 `??` 缺省核常量）
 * 才 `VACUUM`；未越 ⇒ 零动作零写（N-S9）；干跑 ⇒ 零执行（越阈 = planned）；忙 ∥ 失败 ⇒ 跳过
 * （fail-safe——不改数据）。写后回读 = freelist 回落 ∧ 尺寸 ≤ 前。
 */
async function vacuumStep(memory, { confirm, dbPath, vacuumFn, minBytes, ratio }) {
  const before = freelistReading(memory.db, dbPath)
  const readings = { ...before, minBytes, thresholdRatio: ratio, afterFreelistBytes: null, afterDbBytes: null, readback: null }
  const ratioNow = before.dbBytes > 0 ? before.freelistBytes / before.dbBytes : null
  const over = before.freelistBytes >= minBytes && ratioNow !== null && ratioNow >= ratio
  if (!over) {
    const now = ratioNow === null ? "?" : `${(ratioNow * 100).toFixed(1)}%`
    return step("vacuum", "skipped",
      `freelist ${fmtBytes(before.freelistBytes)} / db ${fmtBytes(before.dbBytes)} (${now}) under the line (${fmtBytes(minBytes)} ∧ ${(ratio * 100).toFixed(0)}%)`,
      readings)
  }
  if (!confirm) return step("vacuum", "planned", null, readings)
  try {
    await vacuumFn(memory.db)
  } catch (e) {
    return step("vacuum", "skipped", `VACUUM failed — skipped (fail-safe, data unchanged): ${errText(e, 120)}`, readings)
  }
  const after = freelistReading(memory.db, dbPath)
  readings.afterFreelistBytes = after.freelistBytes
  readings.afterDbBytes = after.dbBytes
  readings.readback = after.freelistBytes < before.freelistBytes && (after.dbBytes ?? 0) <= (before.dbBytes ?? 0) ? "ok" : "unexpected"
  return step("vacuum", "executed", null, readings)
}

/** 轮转名族判定（⑤-3——严格名匹配，非前缀）：`<basename>.sweep-backup-<14 位戳>`。 */
function familyRe(base) {
  return new RegExp(`^${base.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\.sweep-backup-\\d{14}$`)
}

/**
 * ⑤-3 轮转：族内保最新 N（钳 ≥ 1）枚，余者逐枚 `unlink`（失败跳过计数——不抛）；非本族文件零触。
 * 删除面纪律 = 引擎直落（不经 agent 工具面——分类门辖 agent 写面）；干跑 ⇒ 零删 + 清单在。
 */
function rotateStep({ confirm, dbPath, backupKeep }) {
  const readings = { dir: null, keep: backupKeep, family: 0, kept: [], drop: [], deleted: [], skipped: [] }
  if (typeof dbPath !== "string" || !dbPath || dbPath === ":memory:") {
    return step("rotate", "skipped", "no file dbPath (the backup family has no naming basis)", readings)
  }
  const dir = dirname(dbPath)
  readings.dir = dir
  let names
  try { names = readdirSync(dir) } catch (e) {
    return step("rotate", "skipped", `directory unreadable: ${errText(e, 80)}`, readings)
  }
  const re = familyRe(basename(dbPath))
  const family = names.filter((n) => re.test(n)).sort() // 同宽 14 位戳 ⇒ 字典序 = 时序
  readings.family = family.length
  readings.kept = family.slice(-backupKeep).reverse() // 最新在前
  const drop = family.slice(0, Math.max(0, family.length - backupKeep))
  readings.drop = [...drop]
  if (drop.length === 0) return step("rotate", "skipped", `${family.length} backup(s) in family ≤ keep ${backupKeep}`, readings)
  if (!confirm) return step("rotate", "planned", null, readings)
  for (const n of drop) {
    try { unlinkSync(join(dir, n)); readings.deleted.push(n) }
    catch (e) { readings.skipped.push({ name: n, error: errText(e, 80) }) }
  }
  return step("rotate", "executed", null, readings)
}

/** 保 N 归一（钳 ≥ 1——F-S12 下限护栏）；非有限值 ⇒ 缺省。 */
function normalizeBackupKeep(v) {
  const n = Number(v)
  if (!Number.isFinite(n)) return MAINTAIN_BACKUP_KEEP_DEFAULT
  return Math.max(1, Math.floor(n))
}

/** `config.memory.maintain.backupKeep` 现读（读抛 ∥ 缺位 ⇒ 缺省 2——引擎侧单点）。 */
function configuredBackupKeep() {
  try { return loadConfig()?.memory?.maintain?.backupKeep ?? MAINTAIN_BACKUP_KEEP_DEFAULT }
  catch { return MAINTAIN_BACKUP_KEEP_DEFAULT }
}

/**
 * 自维护单入口（自动拍 ∥ 工具同一单点——D-MEM33）。返回逐动作段报告：
 * `{ dryRun, backupKeep, elapsedMs, steps: [{ action, status: executed|planned|skipped, reason, readings }] }`。
 * `confirm:false`（缺省）= 干跑（零写——计划 + 读数）；`confirm:true` = 执行（备份先行 ∥ 写后回读）。
 */
export async function maintainMemory(memory, {
  confirm = false,
  dbPath = null,
  backupKeep = null,
  now = new Date(),
  probeFn = probeOriginPath,
  vacuumFn = null, // 缺省 = `exec` 形 `VACUUM`（执行观测 = 注入计数）
  yieldFn = yieldTick,
  nowFn = Date.now,
  yieldMs = SCAN_YIELD_MS,
  yieldCheckRows = SCAN_YIELD_CHECK_ROWS,
  freelistMinBytes = null, // `??` 缺省核常量（⑤-2 测试缝）
  freelistRatio = null,
} = {}) {
  const t0 = nowFn()
  const keep = normalizeBackupKeep(backupKeep ?? configuredBackupKeep())
  const minBytes = freelistMinBytes ?? MAINTAIN_FREELIST_MIN_BYTES
  const ratio = freelistRatio ?? MAINTAIN_FREELIST_RATIO
  const file = typeof dbPath === "string" && dbPath ? dbPath : (typeof memory?.dbPath === "string" ? memory.dbPath : null)
  const runVacuum = vacuumFn ?? ((db) => db.exec("VACUUM"))
  const steps = [
    await ghostGcStep(memory, { confirm, dbPath: file, now, probeFn, yieldFn, nowFn, yieldMs, yieldCheckRows }),
    await vacuumStep(memory, { confirm, dbPath: file, vacuumFn: runVacuum, minBytes, ratio }),
    rotateStep({ confirm, dbPath: file, backupKeep: keep }),
  ]
  return { dryRun: !confirm, backupKeep: keep, elapsedMs: nowFn() - t0, steps }
}

// ── 报告面（工具输出 = 逐动作段：执行 ∥ 跳过 + 理由 + 读数——§6.6.1 maintain 输出契约）────────────

/** 字节人类形（报告面）。 */
function fmtBytes(n) {
  if (n === null || n === undefined) return "?"
  if (Math.abs(n) >= 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MiB`
  if (Math.abs(n) >= 1024) return `${(n / 1024).toFixed(1)} KiB`
  return `${n} B`
}

const statusTag = (s) => `${s.action}: ${s.status}${s.reason ? ` — ${s.reason}` : ""}`

function gcSection(s) {
  const g = s.readings
  const bits = [`scanned ${g.scannedGroups} group(s)`, `dead ${g.deadGroups} group(s) / ${g.deadRows} row(s)`, `kept ${g.keptGroups} group(s)`]
  if (g.unknownGroups) bits.push(`probe-error kept ${g.unknownGroups}`)
  if (g.deletedRows !== null) bits.push(`deleted ${g.deletedRows} row(s)`)
  if (g.yields) bits.push(`yields ${g.yields}`)
  const out = [`- ${statusTag(s)} · ${bits.join(" · ")}`]
  for (const d of g.dead.slice(0, GC_DISPLAY_CAP)) out.push(`    - ${d.origin} / ${d.path} — code=${d.code} doc=${d.doc}`)
  if (g.dead.length > GC_DISPLAY_CAP) out.push(`    - … ${g.dead.length - GC_DISPLAY_CAP} more dead group(s)`)
  if (g.backupPath) out.push(`    backup: ${g.backupPath}`)
  return out
}

function vacuumSection(s) {
  const out = [`- ${statusTag(s)}`]
  const r = s.readings
  if (s.status === "executed") {
    out.push(`    freelist ${fmtBytes(r.freelistBytes)} → ${fmtBytes(r.afterFreelistBytes)} · db ${fmtBytes(r.dbBytes)} → ${fmtBytes(r.afterDbBytes)} · read-back ${r.readback}`)
  } else if (s.status === "planned") {
    out.push(`    freelist ${fmtBytes(r.freelistBytes)} / db ${fmtBytes(r.dbBytes)} — over the line (${fmtBytes(r.minBytes)} ∧ ${(r.thresholdRatio * 100).toFixed(0)}%)`)
  }
  return out
}

function rotateSection(s) {
  const r = s.readings
  const bits = [`family ${r.family} backup(s)`, `keep ${r.keep}`]
  if (r.deleted.length) bits.push(`deleted ${r.deleted.length}`)
  if (r.skipped.length) bits.push(`skipped ${r.skipped.length}`)
  const out = [`- ${statusTag(s)} · ${bits.join(" · ")}`]
  if (s.status === "planned") {
    out.push(`    would delete: ${r.drop.slice(0, GC_DISPLAY_CAP).join(", ")}${r.drop.length > GC_DISPLAY_CAP ? ` … (+${r.drop.length - GC_DISPLAY_CAP})` : ""}`)
  }
  for (const k of r.skipped) out.push(`    skipped: ${k.name} — ${k.error}`)
  return out
}

/** 人读报告（工具输出面）：三动作段恒定在场（执行 ∥ 计划 ∥ 跳过 + 理由 + 读数）。 */
export function formatMaintainReport(report) {
  const find = (a) => report.steps.find((s) => s.action === a)
  return [
    `memory maintain · ${report.dryRun ? "dry-run (no writes)" : "confirm (writes)"} · backupKeep=${report.backupKeep}`,
    ...gcSection(find("gc")),
    ...vacuumSection(find("vacuum")),
    ...rotateSection(find("rotate")),
  ].join("\n")
}

/** 有动作段数（可见面门——「有动作时一行」：planned ∥ executed 皆算）。 */
export function maintainActionCount(report) {
  return report.steps.filter((s) => s.status === "planned" || s.status === "executed").length
}

/** 单行摘要（CLI 可见面 ∥ `logEvent` 摘要；零动作 ⇒ "no actions"）。
 *  freelist 数值不入本行——⑤-6「freelist = 维护内部读数，不入可见面」的可见面枚举 = 本行 ∥ logEvent；
 *  维护读数完整面 = 工具报告（⑤-4 ∥ §6.6.1 逐动作段读数）。 */
export function maintainLine(report) {
  const find = (a) => report.steps.find((s) => s.action === a)
  const gc = find("gc"), vacuum = find("vacuum"), rotate = find("rotate")
  const bits = []
  if (gc.status === "executed") bits.push(`gc -${gc.readings.deletedRows} row(s)`)
  else if (gc.status === "planned") bits.push(`gc would delete ${gc.readings.deadRows} row(s)`)
  if (vacuum.status === "executed") bits.push("vacuum executed")
  else if (vacuum.status === "planned") bits.push("vacuum planned")
  if (rotate.status === "executed") bits.push(`backups -${rotate.readings.deleted.length}`)
  else if (rotate.status === "planned") bits.push(`backups would delete ${rotate.readings.drop.length}`)
  return bits.length ? `[maintain] ${report.dryRun ? "dry-run · " : ""}${bits.join(" · ")}` : "[maintain] no actions"
}

// ── 调度（⑤-5：启动后延迟拍——每进程一次 ∥ 异步非阻塞 ∥ 失败静默 + logEvent）────────────────────

let maintenanceDelayMs = MEMORY_MAINTENANCE_DELAY_MS
let maintenanceScheduled = false

/** 测试缝（`_setSessionIndexPassDelayForTest` 同款）：用例置短值即可点火（勿真等 3 s）。 */
export function _setMemoryMaintenanceDelayForTest(ms) { maintenanceDelayMs = ms }
/** 测试缝：一次性旗标复位（用例可重复点火）。 */
export function _resetMemoryMaintenanceScheduleForTest() { maintenanceScheduled = false }

/** `dbPath` 缺省现读（`config.memory.dbPath`——读抛 ∥ 缺位 ⇒ null ⇒ 拍零动作）。 */
function configuredDbPath() {
  try {
    const p = loadConfig()?.memory?.dbPath
    return typeof p === "string" && p ? p : null
  } catch { return null }
}

/**
 * 启动后延迟拍（⑤-5）：每进程一次 ∥ 延迟 `delayMs`（缺省 3 s——启动窗外）∥ 异步非阻塞 ∥
 * 不 unref ∥ 失败静默（+ `logEvent`）；**库不在盘 ⇒ 零动作**（不建库——读面纪律）。
 * 自动拍写姿态 = **非干跑**（计划随行后执行 ∥ 备份先行）。`onReport` = 端侧可见面缝
 * （CLI：有动作 ⇒ 一行；缺省零行——端面板零改）。返回 false = 此前已调度（每进程一次）。
 */
export function scheduleMemoryMaintenance({ dbPath = null, delayMs = maintenanceDelayMs, onReport = null } = {}) {
  if (maintenanceScheduled) return false
  maintenanceScheduled = true
  setTimeout(async () => {
    let memory = null
    try {
      const file = typeof dbPath === "string" && dbPath ? dbPath : configuredDbPath()
      if (!file || !existsSync(file)) return
      memory = createMemory({ dbPath: file })
      const report = await maintainMemory(memory, { confirm: true, dbPath: file })
      logEvent("memory:maintain", { summary: maintainLine(report), ms: report.elapsedMs })
      onReport?.(report)
    } catch (error) {
      logEvent("memory:maintain", { error: errText(error) }) // 失败静默（stderr 零输出）
    } finally {
      try { memory?.db?.close() } catch { /* 已关 ∥ 未开 */ }
    }
  }, delayMs)
  return true
}
