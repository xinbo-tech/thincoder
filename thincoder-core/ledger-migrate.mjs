/**
 * ledger-migrate.mjs — 台账存量收正命令面（M2 · 设计档 docs/core/design/LEDGER.md §2.2 · 台账 #286）。
 * ② `ledger migrate --dry-run | --confirm`：变体键库一次性合并——三件套 = dry-run 零写 / 先备份（拷贝 + 读回同计数）/ 幂等（全字段等值）；
 *   六步 = 备份 → 源就绪与列集判 → 单事务迁入（事务内读回核验）→ 回收源（rename 进 `ledger-trash`，不 unlink）→ 报告 → 汇总。执行主体 = 父侧 ops（KD-LN6）。
 * ③ `ledger audit`：逐 `*.db` 定性（目标库 / 变体源 / 空库 / 不可归因（有行）/ 不可读（坏档）；stat 失败 ⇒ 读取失败态）+ 候选根集合归因；只报告零动作。
 * 铁律：**12 数据列逐字复制（不含 id）+ id 重发**（两库 id 空间重叠）；备份 / 回收目录 = `ledgerDirPath()` 的**兄弟位**（§2.11#6 ⇒ 夹具根外零写）；
 * 迁移走直接 SQL（§6.1 写门不拦迁移本身 ⇒ 风险行出旗不拦截）；本档静态 import node:sqlite ⇒ 消费侧一律动态 import（W8 契约②——同 ledger-db.mjs）。
 */
import { createHash } from "node:crypto"
import { copyFileSync, mkdirSync, readdirSync, renameSync, statSync, writeFileSync } from "node:fs"
import { basename, dirname, join, resolve } from "node:path"
import { DatabaseSync } from "node:sqlite"

import { ledgerDirPath, ledgerKey, openLedger } from "./ledger-db.mjs"
import { resolveProjectRoot } from "./manifest.mjs"

/** 12 数据列（**等值比对列集**——不含 id：id 重发，§2.2 语义保全 / AC-M2-12）。 */
export const DATA_COLUMNS = [
  "kind", "status", "title", "board", "req_doc", "task_book",
  "evidence", "trigger", "executor", "created_at", "updated_at", "closed_at",
]
/** 备份面根 / 回收面根（`ledgerDirPath()` 的**兄弟位**——同派生于可覆盖基，§2.11#6）。 */
export function ledgerBackupRoot() { return join(dirname(ledgerDirPath()), "ledger-backup") }
export function ledgerTrashRoot() { return join(dirname(ledgerDirPath()), "ledger-trash") }

const sha16 = (s) => createHash("sha1").update(s).digest("hex").slice(0, 16)
const isFile = (p) => { try { return statSync(p).isFile() } catch { return false } }
const sig = (values) => JSON.stringify(values)
const byStatus = (rows) => rows.reduce((m, r) => { const s = r.values[1]; m[s] = (m[s] ?? 0) + 1; return m }, {})
const openRead = (file) => new DatabaseSync(file, { readOnly: true }) // 源库 / 备份读回 / 审计一律只读
const itemColumns = (db) => db.prepare("SELECT name FROM pragma_table_info('items')").all().map((r) => r.name)

/** 盘符大小写翻转拼写（仅盘符换形；非盘符打头 ⇒ null——非盘符段不生成变体，§2.1 不做段）。 */
export function flipDriveLetter(root) {
  const m = /^([A-Za-z]):/.exec(root)
  if (!m) return null
  const d = m[1]
  return (d === d.toLowerCase() ? d.toUpperCase() : d.toLowerCase()) + root.slice(1)
}
/** 变体键枚举（单源）：盘符翻转拼写的**原样 `sha1[:16]`**——收正前键式 = 无归一哈希（CLI 大写 / VSC `uri.fsPath` 小写 ⇒ 两键两库；先例 = `session-migrate.mjs`）。 */
export function legacyKeyVariants(root) {
  const flip = flipDriveLetter(root)
  return flip ? [sha16(flip)] : []
}
/** 批次名（`YYYYMMDD-HHmmss` 本地——备份与回收共用同一批名）。 */
function batchStamp(date) {
  const p = (n) => String(n).padStart(2, "0")
  return `${date.getFullYear()}${p(date.getMonth() + 1)}${p(date.getDate())}-${p(date.getHours())}${p(date.getMinutes())}${p(date.getSeconds())}`
}
/** 行集读取（id + 12 数据列；缺失列按 NULL 映射——旧 DDL 源的 `executor` 正常态，KD-LN10）。 */
function readRows(db, missing = []) {
  const cols = DATA_COLUMNS.filter((c) => !missing.includes(c))
  return db.prepare(`SELECT id, ${cols.join(", ")} FROM items ORDER BY id`).all()
    .map((r) => ({ id: Number(r.id), values: DATA_COLUMNS.map((c) => (missing.includes(c) ? null : r[c] ?? null)) }))
}
/** 源描述（dry-run / 步 2 / 备份读回 / 审计共用的只读面；失败收为 `error` 而非抛）。`refusal` = 就绪判：不可读 / 无 items 表 / 缺 `executor` 以外数据列 ⇒ 拒；仅缺 `executor`（旧 DDL 正常态）⇒ NULL 映射照迁（§2.2 步 2 / KD-LN10）。 */
function describeSource(file) {
  let db
  try { db = openRead(file) } catch (e) { return { error: e.message, refusal: `不可读（${e.message}）` } }
  try {
    const cols = itemColumns(db)
    if (!cols.length) return { rows: 0, missing: [], refusal: "不可开为台账库（无 items 表）" }
    const missing = DATA_COLUMNS.filter((c) => !cols.includes(c))
    const bad = missing.filter((c) => c !== "executor")
    const rows = readRows(db, missing)
    return { rows: rows.length, missing, dist: byStatus(rows), refusal: bad.length ? `缺数据列（列集不可归因）：${bad.join(" / ")}` : null }
  } catch (e) { return { error: e.message, refusal: `不可读（${e.message}）` } } finally { db.close() }
}
/** 单次读行（计划 / 迁入面共用）。 */
function readRowsOf(file, missing = []) {
  const db = openRead(file)
  try { return readRows(db, missing) } finally { db.close() }
}
/** 写门风险旗（§2.2 表）：迁入行属 `在途 / 待核销` 且 `task_book` 不可解析 / 指向档不存在 ⇒ 该行后续更新将拒于 §6.1 写门；只出旗，不拦截。 */
function writeGateFlag(values, projectRoot) {
  const tb = values[5]
  if ((values[1] !== "在途" && values[1] !== "待核销") || tb == null || tb === "") return null
  const part = String(tb).split("§")[0].trim()
  if (!part) return `task_book 不可解析（缺文件部分）：${tb}`
  const abs = resolve(projectRoot, part)
  return isFile(abs) ? null : `task_book 指向的档不存在：${tb}（解析 = ${abs}）`
}
/** `--from` 指名键 = **补充源**：键形非 16 位小写十六进制 / 无对应库 / 不可开 ⇒ 拒跑（fail-closed，零写——显式指名不静默跳过；键形判防路径形 / 越目录形取值 join 出台账目录外）。 */
function fromKeyRefusal(fromKeys, dir) {
  for (const k of fromKeys) {
    if (!/^[0-9a-f]{16}$/.test(k)) return `--from ${JSON.stringify(k)} 取值非键形（应 = 16 位小写十六进制 /^[0-9a-f]{16}$/；路径形 / 越目录形一律拒）。Nothing was written.`
    const p = join(dir, `${k}.db`)
    if (!isFile(p)) return `--from ${k} 指名的源键无对应库：${p}（显式指名不静默跳过——fail-closed）。Nothing was written.`
    try { openRead(p).close() } catch (e) { return `--from ${k} 指名的源库不可开：${e.message}。Nothing was written.` }
  }
  return null
}

/** 迁移计划（dry-run / confirm 共用）。cwd 口径 = 写门口径 2 同一子表达式（`resolveProjectRoot` ∨ 兜底）。 */
export function planLedgerMigration(cwd, { fromKeys = [] } = {}) {
  const projectRoot = resolveProjectRoot(cwd) ?? resolve(cwd ?? ".")
  const dir = ledgerDirPath()
  const targetKey = ledgerKey(projectRoot)
  const targetPath = join(dir, `${targetKey}.db`)
  const refusal = fromKeyRefusal(fromKeys, dir)
  if (refusal) return { refusal }
  const keys = [...new Set([...legacyKeyVariants(projectRoot), ...fromKeys])].filter((k) => k && k !== targetKey)
  const sources = keys.map((k) => ({ key: k, path: join(dir, `${k}.db`) })).filter((s) => isFile(s.path))
    .map((s) => { const desc = describeSource(s.path); return { ...s, mtime: statSync(s.path).mtime.toISOString(), desc, refusal: desc.refusal } })
  const targetDesc = isFile(targetPath) ? describeSource(targetPath) : { rows: 0, missing: [], absent: true }
  const flags = []
  for (const s of sources) {
    if (s.refusal) continue
    for (const r of readRowsOf(s.path, s.desc.missing)) {
      const f = writeGateFlag(r.values, projectRoot)
      if (f) flags.push({ source: s.key, id: r.id, flag: f })
    }
  }
  const migrate = sources.reduce((n, s) => n + (s.refusal ? 0 : s.desc.rows ?? 0), 0)
  return { projectRoot, targetKey, targetPath, targetDesc, sources, flags, migrate }
}

/** dry-run 计划行（零写报告：目标 / 变体源候选 / 计划动作 / 写门风险旗）。 */
function printPlan(plan, out) {
  const t = plan.targetDesc
  const dist = (d) => (d.dist ? Object.entries(d.dist).map(([k, v]) => `${k} ${v}`).join(" · ") : `unreadable: ${d.error}`)
  out([
    "Ledger migrate dry-run — no file will be created, moved or modified.",
    `Target: ${plan.targetKey}  ${plan.targetPath}`,
    t.absent ? "  ⚠ 拟建（0 行）——目标键库不存在，迁入步建库建表" : t.error ? `  ⚠ 目标不可读（${t.error}）——confirm 面将拒跑（fail-closed）` : `  rows ${t.rows}`,
    `Variant sources (${plan.sources.length}):${plan.sources.length ? "" : " none（无待迁源）"}`,
    ...plan.sources.map((s) => `  ${s.key}  ${s.path}  rows ${s.desc.rows ?? "?"}  mtime ${s.mtime}\n    ${dist(s.desc)}${s.refusal ? `  ⚠ ${s.refusal}（confirm 面将拒跑）` : ""}`),
    `Plan: backup → ${join(ledgerBackupRoot(), "<批次>")}/ ; migrate ${plan.migrate} rows → target (post-migration count = ${t.error ? "?" : (t.rows ?? 0) + plan.migrate})`,
    `Write-gate risk flags: ${plan.flags.length}${plan.flags.length ? "（不拦截——迁入后在途 / 待核销行的后续更新仍受写入时门约束）" : ""}`,
    ...plan.flags.map((f) => `  ⚠ ${f.source} #${f.id}: ${f.flag}`),
    'Run "thincoder ledger migrate --confirm" to execute (backup first, then single-transaction import, then sources are recycled into ledger-trash).',
  ].join("\n"))
}

/** 事务内读回核验（§2.2 步 3）：逐插入行按新 id 回读 12 数据列与源等值 ∧ 目标既有行零动；不等 ⇒ throw（ROLLBACK ⇒ 目标零行变、源零动——新建档可能残留）。 */
function verifyImported(db, inserted, existingById) {
  const get = db.prepare(`SELECT ${DATA_COLUMNS.join(", ")} FROM items WHERE id = ?`)
  for (const { key, id, values } of inserted) {
    const got = get.get(id)
    if (!got) throw new Error(`读回核验失败：目标缺行 id=${id}（源键 ${key}）`)
    for (let i = 0; i < DATA_COLUMNS.length; i++) {
      const a = values[i] ?? null
      const b = got[DATA_COLUMNS[i]] ?? null
      if (a !== b) throw new Error(`读回核验失败：id=${id} 列 ${DATA_COLUMNS[i]} 不等（源 ${JSON.stringify(a)} / 目标 ${JSON.stringify(b)}）`)
    }
  }
  const now = new Map(readRows(db).map((r) => [r.id, sig(r.values)]))
  for (const [id, before] of existingById) {
    if (now.get(id) !== before) throw new Error(`读回核验失败：目标既有行 id=${id} 被动过`)
  }
}

/** 步 1 备份（不可省）：目标 + 全部源文件拷贝进 `ledger-backup/<批次>/`；读回 = 逐档可开 ∧ COUNT 同源。 */
function backupStep(files, backupDir) {
  mkdirSync(backupDir, { recursive: true })
  for (const f of files) copyFileSync(f, join(backupDir, basename(f)))
  for (const f of files) {
    const a = describeSource(f)
    const b = describeSource(join(backupDir, basename(f)))
    if (a.error || b.error || a.rows !== b.rows) throw new Error(`备份读回核验失败：${basename(f)}（原 ${a.rows ?? a.error} / 副本 ${b.rows ?? b.error}）`)
  }
}

/** ② 迁移执行（§2.2 六步）。返回进程退出码（0 成功 / 1 拒跑或失败）。 */
export function runLedgerMigrate(args, { cwd = process.cwd(), out = console.log, err = console.error, now = new Date(), busyMs = 3000 } = {}) {
  const dryRun = args.includes("--dry-run")
  const confirm = args.includes("--confirm")
  if (dryRun === confirm) { err("Usage: thincoder ledger migrate --dry-run | --confirm [--from <key>]"); return 1 }
  const fromKeys = []
  for (let i = 0; i < args.length; i++) if (args[i] === "--from") fromKeys.push(String(args[i + 1] ?? ""))
  const plan = planLedgerMigration(cwd, { fromKeys })
  if (plan.refusal) { err(`Refused: ${plan.refusal}`); return 1 }
  if (dryRun) { printPlan(plan, out); return 0 }
  if (!plan.sources.length) { out("Ledger migrate: no sources to migrate（无待迁源——源已回收 / 无变体键库）。Nothing to do."); return 0 }
  const batch = batchStamp(now)
  const backupDir = join(ledgerBackupRoot(), batch)
  const targetExists = !plan.targetDesc.absent
  try { backupStep([...(targetExists ? [plan.targetPath] : []), ...plan.sources.map((s) => s.path)], backupDir) } catch (e) { err(`Refused: 备份失败（${e.message}）——迁入零启动，目标与源零变。`); return 1 }
  // 步 2 源就绪与列集判（`-wal` / `-shm` 伴生档 ⇒ 拒：单档回收会丢未 checkpoint 数据）。
  for (const s of plan.sources) {
    if (isFile(`${s.path}-wal`) || isFile(`${s.path}-shm`)) {
      err(`Refused: 源库带 -wal / -shm 伴生档：${basename(s.path)}——单档回收会丢未 checkpoint 数据（fail-closed）。先打开并关闭该库令其 checkpoint 后重试。`)
      return 1
    }
    if (s.refusal) { err(`Refused: 源库不就绪 —— ${basename(s.path)}：${s.refusal}。`); return 1 }
  }
  // 步 3 单事务迁入：BEGIN → 逐行 INSERT（重发新 id）→ 事务内读回核验 → COMMIT；失败 ⇒ ROLLBACK。
  const report = { version: 1, batch, at: now.toISOString(), projectRoot: plan.projectRoot, targetKey: plan.targetKey, targetPath: plan.targetPath, targetCreated: !targetExists, sources: [], skippedRows: [], flags: plan.flags, recycled: [], kept: [] }
  let db
  try { db = openLedger(plan.projectRoot, { create: true }) } catch (e) { err(`Refused: 目标库不可开（${e.message}）。`); return 1 }
  try {
    db.exec(`PRAGMA busy_timeout = ${Math.max(0, Math.floor(busyMs))}`)
    const existing = readRows(db)
    const seen = new Set(existing.map((r) => sig(r.values)))
    const existingById = new Map(existing.map((r) => [r.id, sig(r.values)]))
    const inserted = []
    db.exec("BEGIN")
    try {
      const insert = db.prepare(`INSERT INTO items (${DATA_COLUMNS.join(", ")}) VALUES (${DATA_COLUMNS.map(() => "?").join(", ")})`)
      for (const s of plan.sources) {
        const entry = { key: s.key, path: s.path, rows: s.desc.rows, migrated: 0, skipped: 0, idMap: {}, missingColumns: s.desc.missing }
        for (const row of readRowsOf(s.path, s.desc.missing)) {
          const s0 = sig(row.values)
          if (seen.has(s0)) { entry.skipped++; report.skippedRows.push({ source: s.key, id: row.id }); continue }
          const newId = Number(insert.run(...row.values).lastInsertRowid)
          entry.idMap[String(row.id)] = newId
          entry.migrated++
          seen.add(s0)
          inserted.push({ key: s.key, id: newId, values: row.values })
        }
        report.sources.push(entry)
      }
      verifyImported(db, inserted, existingById)
      db.exec("COMMIT")
    } catch (e) { db.exec("ROLLBACK"); throw e }
    report.rowsBefore = existing.length
    report.rowsAfter = existing.length + inserted.length
  } catch (e) {
    db.close()
    // 措辞收正：目标档为本次新建时 ROLLBACK 后残留 0 行空库档——「目标零变」不足以覆盖，如实写明
    const note = targetExists ? "目标零变、源零动。" : "目标零行变、源零动（目标档为本次新建——ROLLBACK 后 0 行空库档残留在原路径）。"
    err(/busy|locked/i.test(e?.message ?? "")
      ? `Refused: 目标台账库被另一实例占用（持写锁；busy_timeout ${busyMs}ms 用尽）——${note}待对方空闲后重试。`
      : `Refused: 迁移失败（${e.message}）——已 ROLLBACK，${note}`)
    return 1
  }
  db.close()
  // 步 4 回收源：rename 进 `ledger-trash/<批次>/`（不 unlink——先例 = session-gc `sessions-trash`）。
  const trashDir = join(ledgerTrashRoot(), batch)
  for (const s of plan.sources) {
    try { mkdirSync(trashDir, { recursive: true }); renameSync(s.path, join(trashDir, basename(s.path))); report.recycled.push(s.key) }
    catch (e) { report.kept.push({ key: s.key, reason: e.message }) }
  }
  // 步 5 报告（`ledger-backup/<批次>/migrate-report.json`）：计数 / 逐源逐行 id 映射 / 跳过行 / 旗标。
  const reportPath = join(backupDir, "migrate-report.json")
  try { writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n") } catch (e) { err(`⚠ 报告写入失败（迁入已 COMMIT——数据无损）：${e.message}`) }
  // 步 6 汇总（迁入行数 / 跳过数 / 迁移后计数 / 备份与回收路径）。
  const migrated = report.sources.reduce((n, s) => n + s.migrated, 0)
  out(`Ledger migrate done — migrated ${migrated} row(s) into ${plan.targetKey} (rows now ${report.rowsAfter}${report.targetCreated ? ", 库为本次新建" : ""}).`)
  if (report.skippedRows.length) out(`  skipped ${report.skippedRows.length} row(s) — 全字段等值护栏（幂等：重跑不重复）。`)
  out(`  backup: ${backupDir}  (report: ${basename(reportPath)})`)
  out(`  recycled sources → ${trashDir}${report.recycled.length ? ` (${report.recycled.join(", ")})` : ""}`)
  if (report.kept.length) {
    err(`⚠ 回收失败（数据已迁入，源库留在原位）：${report.kept.map((k) => `${k.key}（${k.reason}）`).join(" · ")}`)
    return 1
  }
  return 0
}

/** ③ 审计（只读——零删改）：逐 `*.db` 出 `{键, 文件, 大小, mtime, 行数, 状态分布, 定性}`；归因 = **候选根集合**（锚项目 + `--root`）的变体键匹配（sha1 不可逆——只做候选生成）。 */
export function auditLedgerDir({ cwd = process.cwd(), roots = [], dir = ledgerDirPath() } = {}) {
  let names = []
  try { names = readdirSync(dir).filter((n) => n.endsWith(".db")).sort() } catch { /* 不可读 ⇒ 空报告 */ }
  const anchorKeys = new Set()
  const variantKeys = new Set()
  for (const a of [cwd, ...roots]) {
    const root = resolveProjectRoot(a) ?? resolve(a ?? ".")
    anchorKeys.add(ledgerKey(root))
    for (const v of legacyKeyVariants(root)) variantKeys.add(v)
  }
  const entries = names.map((name) => {
    const file = join(dir, name)
    const key = name.replace(/\.db$/, "")
    let st = null; try { st = statSync(file) } catch { /* 并发删除 / 不可 stat ⇒ 读取失败态（按档报，不抛） */ }
    if (!st) return { key, file, size: null, mtime: null, rows: null, dist: {}, kind: "不可归因（读取失败）" }
    const desc = describeSource(file)
    const rows = desc.error ? null : desc.rows ?? 0
    const kind = desc.error ? "不可读（坏档）"
      : anchorKeys.has(key) ? "目标库" : variantKeys.has(key) ? "变体源" : rows === 0 ? "空库" : "不可归因（有行）"
    return { key, file, size: st.size, mtime: st.mtime.toISOString(), rows, dist: desc.dist ?? {}, kind }
  })
  const counts = {}
  for (const e of entries) counts[e.kind] = (counts[e.kind] ?? 0) + 1
  return { dir, entries, counts }
}

/** 处置建议（本批**只报告零动作**——删除不可逆 ⇒ 回收而非删；非目标 / 非源者保持原位）。 */
const AUDIT_SUGGESTION = {
  "目标库": "保留（迁移目标）", "变体源": "迁移（`thincoder ledger migrate --confirm`）",
  "空库": "建议回收（`ledger-trash`，可回退）——本批零动作",
  "不可归因（有行）": "保持原位（非目标 / 非源）——本批零动作", "不可读（坏档）": "保持原位（人工处置；本批零动作）",
}
const READ_FAIL_SUGGESTION = "保持原位（读取失败态——并发删除 / 不可 stat；本批零动作）"
/** ③ 显式命令面（壳侧接线 = `case "ledger"`）：只读分类报告。 */
export function runLedgerAudit(args, { cwd = process.cwd(), out = console.log } = {}) {
  const roots = []
  for (let i = 0; i < args.length; i++) if (args[i] === "--root" && args[i + 1]) roots.push(String(args[i + 1]))
  const { dir, entries, counts } = auditLedgerDir({ cwd, roots })
  const kinds = [...new Set([...Object.keys(AUDIT_SUGGESTION), ...entries.map((e) => e.kind)])] // 读取失败态随现随列（计数与枚举同列）
  out([
    "Ledger audit — read-only: no ledger file is created, moved or deleted.",
    `Dir: ${dir}  (candidate roots: ${1 + roots.length})`,
    ...entries.map((e) => `  ${e.key}.db  ${e.size != null ? `${e.size}B` : "—"}  mtime ${e.mtime ?? "—"}  rows ${e.rows ?? "?"}  ${e.kind}${Object.keys(e.dist).length ? `  (${Object.entries(e.dist).map(([k, v]) => `${k} ${v}`).join(" · ")})` : ""}`),
    `Summary: ${kinds.map((k) => `${k} ${counts[k] ?? 0}`).join(" · ")}`,
    ...kinds.map((k) => `  ${k} ⇒ ${AUDIT_SUGGESTION[k] ?? READ_FAIL_SUGGESTION}`),
    `Total ${entries.length} ledger file(s) under ${dir}（只报告零动作——删除不可逆）。`,
  ].join("\n"))
  return 0
}
