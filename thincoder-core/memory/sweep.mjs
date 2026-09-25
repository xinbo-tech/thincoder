/**
 * memory/sweep.mjs — origin 级库治理（命令面 + 安全设计 · MEMORY.md §6.13 · 台账 #175 · 2026-09-25）。
 *
 * 命令面（CLI 壳 = `thincoder-cli/src/cli/memory-command.mjs`）：`thincoder memory sweep [--origin <o>] [--dry-run|--confirm]`。
 * 两档判据（单源 = §6.13——本档不另立规则）：
 *   · **全扫（缺省）** = 信号 A 折叠（`normalizeOrigin(o) !== o` ⇒ 并入归一形，**不删**）+ 信号 B 删除
 *     （**树亡** = 原样 / 归一形两路径皆 ENOENT ⇒ 可删）；
 *   · **`--origin` 档** = 靶向整档删除（显式点名 ≠ 树亡推断——不以树存活为判据、不走信号 A/B）：
 *     范围 = 三表内 `normalizeOrigin(origin) = normalizeOrigin(<o>)` 的全部行（非归一变体随删；活树亦可整删）。
 * 安全三件（§6.13）：① **备份前置**（`VACUUM INTO <dbPath>.sweep-backup-<UTC yyyymmddHHMMSS>`，
 * 判据 = 存在 ∧ 大小 > 0 ∧ `PRAGMA integrity_check` = ok；目标已存在 / 判据不过 ⇒ **中止零写**）；
 * ② **干跑默认**（`--confirm` 才写；零写判据 = 库字节 / 行数不变）；③ **审计**（逐 origin 动作 + 计数 +
 * 折叠映射 + 备份路径 + 写后回读判据）。
 * **折叠规则单源 = §6.11 步 2**（同归一键内 `(path, line_start)`（`files` = `(layer, path)`）恰一行——
 * 保留 `mtime_ms` 最大者，并列取 `rowid` 最小者；FTS 由既有触发器随行同步）。
 * 探针 fail-safe：**仅 ENOENT 判亡**，其余错误（权限 / 非法路径）⇒ 保留（先例 `session-stale.mjs:124-127`）。
 * 执行分工：真实库写 = 父侧 ops；本档只在传入的库句柄上作业，写闸 = `confirm` 单一入参。
 */
import { existsSync, statSync } from "node:fs"
import { DatabaseSync } from "node:sqlite"
import { normalizeOrigin } from "./origin.mjs"

/** 面表（§6.13 面表）：三表 + 各表折叠唯一键（`files` 无 `line_start`——PK = (layer, origin, path)）。 */
const TABLES = [
  { key: "code", table: "code_chunks", dup: ["path", "line_start"] },
  { key: "doc", table: "doc_chunks", dup: ["path", "line_start"] },
  { key: "files", table: "files", dup: ["layer", "path"] },
]
const KEYS = TABLES.map((t) => t.key)
const emptyCounts = () => ({ code: 0, doc: 0, files: 0 })
const totalOf = (c) => c.code + c.doc + c.files

/** 树存活探针（信号 B 单源）：`statSync` 成功 ⇒ "alive"；**仅 ENOENT** ⇒ "dead"；其余错误 ⇒ "unknown"。 */
export function probeOriginPath(p) {
  try { statSync(p); return "alive" } catch (e) { return e?.code === "ENOENT" ? "dead" : "unknown" }
}

/** 双路径树读数（原样 + 归一形）：alive 优先；两路径皆死才判亡；任一探针错误 ⇒ unknown（保留）。 */
function treeState(o) {
  const a = probeOriginPath(o), b = probeOriginPath(normalizeOrigin(o))
  return { alive: a === "alive" || b === "alive", dead: a === "dead" && b === "dead", unknown: a === "unknown" || b === "unknown" }
}

/** 逐（原样 origin）行数：Map<origin, { code, doc, files }>——三表并集。 */
function originCounts(db) {
  const map = new Map()
  for (const { key, table } of TABLES) {
    for (const r of db.prepare(`SELECT origin, COUNT(*) AS n FROM ${table} GROUP BY origin`).all()) {
      const cur = map.get(r.origin) ?? emptyCounts()
      cur[key] = Number(r.n)
      map.set(r.origin, cur)
    }
  }
  return map
}

const ACTION_RANK = { delete: 0, fold: 1, keep: 2 }

/**
 * 干跑计划（**零写**）。row = { origin（归一形）, raws（归入本键的原样键集）, foldFrom（信号 A 的原样键）,
 * alive, unknown, action, code / doc / files / total }。
 * 动作三态：`fold`（信号 A）/ `delete`（信号 B 树亡，或 `--origin` 档显式点名）/ `keep`（其余）。
 */
export function planSweep(memory, { origin = null } = {}) {
  const counts = originCounts(memory.db)
  const rows = []
  if (origin !== null) {
    const target = normalizeOrigin(origin)
    const raws = [...counts.keys()].filter((o) => normalizeOrigin(o) === target)
    const agg = emptyCounts()
    for (const o of raws) for (const k of KEYS) agg[k] += counts.get(o)[k]
    const state = treeState(target)
    rows.push({
      origin: target, raws, foldFrom: null, alive: state.alive, unknown: state.unknown,
      action: totalOf(agg) > 0 ? "delete" : "keep", ...agg, total: totalOf(agg),
    })
  } else {
    for (const [o, c] of counts) {
      const norm = normalizeOrigin(o)
      const state = treeState(o)
      const variant = norm !== o
      rows.push({
        origin: norm, raws: [o], foldFrom: variant ? o : null, alive: state.alive, unknown: state.unknown,
        action: variant ? "fold" : state.dead ? "delete" : "keep", ...c, total: totalOf(c),
      })
    }
    rows.sort((a, b) => ACTION_RANK[a.action] - ACTION_RANK[b.action] || (a.origin < b.origin ? -1 : a.origin > b.origin ? 1 : 0))
  }
  const totals = emptyCounts()
  for (const r of rows) for (const k of KEYS) totals[k] += r[k]
  totals.total = totalOf(totals)
  return { mode: origin !== null ? "origin" : "full", target: origin !== null ? normalizeOrigin(origin) : null, rows, totals }
}

/** 备份路径（§6.13）：`<dbPath>.sweep-backup-<UTC yyyymmddHHMMSS>`（同目录）。 */
export function backupPathFor(dbPath, now = new Date()) {
  const p = (n) => String(n).padStart(2, "0")
  const stamp = `${now.getUTCFullYear()}${p(now.getUTCMonth() + 1)}${p(now.getUTCDate())}${p(now.getUTCHours())}${p(now.getUTCMinutes())}${p(now.getUTCSeconds())}`
  return `${dbPath}.sweep-backup-${stamp}`
}

/**
 * 备份前置（`--confirm` 档且命中 > 0）：`VACUUM INTO` + 判据（存在 ∧ 大小 > 0 ∧ `integrity_check` = ok）。
 * 目标已存在 / 判据不过 ⇒ 抛错（调用方在**任何写之前**收到 ⇒ 零写）。返回备份路径。
 */
function takeBackup(db, path) {
  if (existsSync(path)) throw new Error(`memory sweep: backup target already exists (${path}) — aborted with zero writes`)
  db.exec(`VACUUM INTO '${path.replaceAll("'", "''")}'`)
  if (!existsSync(path) || statSync(path).size <= 0) throw new Error(`memory sweep: backup judgment failed (missing or empty: ${path}) — aborted with zero writes`)
  const bdb = new DatabaseSync(path, { readOnly: true })
  try {
    const row = bdb.prepare("PRAGMA integrity_check").get()
    if (Object.values(row ?? {})[0] !== "ok") throw new Error(`memory sweep: backup judgment failed (integrity_check ≠ ok: ${path}) — aborted with zero writes`)
  } finally { bdb.close() }
  return path
}

/** 单键折叠（§6.11 步 2 逐字口径）：同 (dup) 组恰一行——保留 `mtime_ms` 最大者、并列取 `rowid` 最小者。
 *  先删非胜者、再改胜者 origin（PK 复用无冲突）；返回触碰行数（删除 + 改键）。 */
function foldKey(db, key, raws) {
  let touched = 0
  const ph = raws.map(() => "?").join(", ")
  for (const { table, dup } of TABLES) {
    const rows = db.prepare(`SELECT rowid, ${dup.join(", ")}, mtime_ms FROM ${table} WHERE origin IN (${ph})`).all(...raws)
    if (rows.length === 0) continue
    const gk = (r) => dup.map((c) => String(r[c])).join("\u0001")
    const best = new Map()
    for (const r of rows) {
      const cur = best.get(gk(r))
      if (!cur || Number(r.mtime_ms) > Number(cur.mtime_ms) || (Number(r.mtime_ms) === Number(cur.mtime_ms) && r.rowid < cur.rowid)) best.set(gk(r), r)
    }
    const del = db.prepare(`DELETE FROM ${table} WHERE rowid = ?`)
    const upd = db.prepare(`UPDATE ${table} SET origin = ? WHERE rowid = ?`)
    for (const r of rows) if (best.get(gk(r)) !== r) { del.run(r.rowid); touched += 1 }
    for (const r of best.values()) if (r.origin !== key) { upd.run(key, r.rowid); touched += 1 }
  }
  return touched
}

/** 写后回读判据（§6.13「按档分列」，不过 ⇒ 抛 ⇒ 事务回滚 ⇒ 零写）。 */
function readBack(db, { mode, target }, before) {
  const after = originCounts(db)
  const totalBefore = [...before.values()].reduce((n, c) => n + totalOf(c), 0)
  const totalAfter = [...after.values()].reduce((n, c) => n + totalOf(c), 0)
  if (totalAfter > totalBefore) throw new Error(`memory sweep read-back failed: COUNT(*) grew (${totalBefore} → ${totalAfter})`)
  if (mode === "origin") {
    // `--origin` 档：目标归一键三表零命中 ∧ 非目标 origin 零变（逐键等前值）
    for (const [o] of after) if (normalizeOrigin(o) === target) throw new Error(`memory sweep read-back failed: --origin target key still indexed (${o})`)
    for (const [o, c] of before) {
      if (normalizeOrigin(o) === target) continue
      const now = after.get(o) ?? emptyCounts()
      if (KEYS.some((k) => now[k] !== c[k])) throw new Error(`memory sweep read-back failed: non-target origin changed (${o})`)
    }
  } else {
    // 折叠档：归一键集合 = 1（无残留非归一键）∧ 任一 (归一键, path[, line_start]) 恰一行（下循环）
    for (const [o] of after) if (normalizeOrigin(o) !== o) throw new Error(`memory sweep read-back failed: non-normalized origin key remains (${o})`)
  }
  for (const { table, dup } of TABLES) {
    const { n } = db.prepare(`SELECT COUNT(*) AS n FROM (SELECT 1 FROM ${table} GROUP BY origin, ${dup.join(", ")} HAVING COUNT(*) > 1)`).get()
    if (Number(n) !== 0) throw new Error(`memory sweep read-back failed: duplicate rows per (origin, ${dup.join(", ")}) in ${table}`)
  }
}

/** 写面（`--confirm` 档）：单事务 —— ① 折叠（先于删除，死树键的变体行随键级删除一并清掉）② 键级删除
 *  ③ 写后回读判据（不过 ⇒ 回滚 + 抛）。返回实际触碰行数 { folded, deleted }。 */
function applySweep(db, plan) {
  const before = originCounts(db)
  const foldGroups = new Map()
  for (const r of plan.rows) {
    if (r.action !== "fold") continue
    // 折叠候选集 = 归一键**自身** + 其全部变体拼写（设计口径 = 同归一键内恰一行——
    // 归一键行亦入组，否则胜者改键会与已在归一键上的同 dup 行撞 PK，整批回滚）
    if (!foldGroups.has(r.origin)) foldGroups.set(r.origin, new Set([r.origin]))
    for (const o of r.raws) foldGroups.get(r.origin).add(o)
  }
  const deleteKeys = plan.rows.filter((r) => r.action === "delete").map((r) => [...new Set([r.origin, ...r.raws])])
  const affected = { folded: 0, deleted: 0 }
  db.exec("BEGIN IMMEDIATE")
  try {
    for (const [key, raws] of foldGroups) affected.folded += foldKey(db, key, [...raws])
    for (const raws of deleteKeys) {
      const ph = raws.map(() => "?").join(", ")
      for (const { table } of TABLES) affected.deleted += Number(db.prepare(`DELETE FROM ${table} WHERE origin IN (${ph})`).run(...raws).changes)
    }
    readBack(db, plan, before)
    db.exec("COMMIT")
  } catch (e) {
    try { db.exec("ROLLBACK") } catch { /* 已回滚 / 事务未开 */ }
    throw e
  }
  return affected
}

/**
 * sweep 主入口。`confirm: false`（缺省）⇒ 纯干跑（零写、零备份）；`confirm: true` ⇒ 命中 > 0 时先取备份
 * （判据不过即抛 ⇒ 零写），再单事务执行折叠 / 删除并跑写后回读判据。
 * 返回：{ mode, target, dryRun, rows, totals, hits, backupPath, affected }。
 */
export function sweepMemory(memory, { origin = null, confirm = false, dbPath = null, now = new Date() } = {}) {
  const plan = planSweep(memory, { origin })
  const hits = plan.rows.reduce((n, r) => n + (r.action === "keep" ? 0 : r.total), 0)
  const result = { mode: plan.mode, target: plan.target, dryRun: !confirm, rows: plan.rows, totals: plan.totals, hits, backupPath: null, affected: null }
  if (!confirm) return result
  if (hits > 0) {
    if (typeof dbPath !== "string" || !dbPath || dbPath === ":memory:") {
      throw new Error("memory sweep: `--confirm` 需要文件型 dbPath（备份前置的命名依据）——拒绝无回退对象的写入")
    }
    result.backupPath = takeBackup(memory.db, backupPathFor(dbPath, now))
  }
  result.affected = applySweep(memory.db, plan)
  return result
}

/** 审计输出形态（§6.13）：逐 origin 一行 `origin=<归一形> · 树存活=<是|否> · code / doc / files / 合计`
 *  （活树附警示行）+ 折叠映射行 + 删除行数 + 末行合计 + 备份路径（`--confirm` 档）/ 实写读数。 */
export function formatSweepReport(result) {
  const mode = result.mode === "origin" ? `--origin ${result.target}` : "全扫"
  const lines = [`memory sweep ${mode} · ${result.dryRun ? "dry-run（零写）" : "confirm（写档）"}`]
  for (const r of result.rows) {
    lines.push(`origin=${r.origin} · 树存活=${r.alive ? "是" : "否"} · code=${r.code} / doc=${r.doc} / files=${r.files} / 合计=${r.total}`)
    if (r.foldFrom) lines.push(`  折叠: ${r.foldFrom} → ${r.origin}（并入归一键）`)
    if (r.unknown) lines.push("  ⚠ 探针错误——fail-safe 保留（仅 ENOENT 判亡）")
    if (r.alive) lines.push(`  ⚠ 树存活——${result.mode === "origin" ? "显式点名整档删除（不以树存活为判据）" : "保留（全扫档仅删树亡 origin）"}`)
    if (r.action === "delete") lines.push(`  删除: code=${r.code} / doc=${r.doc} / files=${r.files}（${r.total} 行）`)
  }
  const sum = (act) => result.rows.filter((r) => r.action === act).reduce((n, r) => n + r.total, 0)
  const t = result.totals
  lines.push(`合计: code=${t.code} / doc=${t.doc} / files=${t.files} / 合计=${t.total} · 删除 ${sum("delete")} 行 / 折叠 ${sum("fold")} 行 / 保留 ${sum("keep")} 行`)
  if (result.affected) lines.push(`实写: 删除 ${result.affected.deleted} 行 / 折叠 ${result.affected.folded} 行`)
  if (result.backupPath) lines.push(`备份: ${result.backupPath}`)
  return lines
}
