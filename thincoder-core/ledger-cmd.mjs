/**
 * ledger-cmd.mjs — 台账核心函数档（查询 = 只读全角色 / 写 = 仅主 agent 装配）。
 * 工具定义 + 工具层参数守卫 = 拆分件 `thincoder-core/ledger-tools.mjs`（2026-09-28 守卫族微修批 ·
 * 台账 #473——纯搬移、语义零变）；逐行写核 + 两个批级写点 = 拆分件 `thincoder-core/ledger-write-ops.mjs`
 * （2026-10-27 三链统一批——本档收尾 455 行，新增两枚批级写点会越 500 顾问线，故外提；本档反向 import
 * 取用并 re-export，公共面逐字不变）。核函数（`ledgerQuery` / `ledgerCount` / `ledgerAdd` /
 * `ledgerUpdate` / `ledgerClose` + 批级批量 `ledgerUpdateBatch` / `ledgerCloseBatch` + 重锚单源
 * `ledgerReanchorBatch`）留本档，工具档消费之；`ledgerBindBatch` / `ledgerReclaimBatch` 由本档
 * re-export（设计档 §2.4 / §2.13 的公共面落点不变）。
 *
 * 读数面（逐行携、不入库、不入 `DATA_COLUMNS`——先例 = `aged`）：`evidenceTooLong`（§5 P4 文字太长）∥
 * `overdue`（§3.7 出口态——机判单源 `overdueOf`）∥ `taskBookOnDisk`（§7.1 B——指针在盘读数）。
 * 三枚皆**读数非闸门**（不拒任何写入）。
 * 指针判据重锚面（§6.1 两臂写门 ∥ §6.2 收口重锚 · 台账 #1550）：写门判**本笔写入面**、只判本笔新指名；
 * 「档此刻在不在盘」降为读数——读面导出 `ledgerBatchRows`、收口重锚单源 `ledgerReanchorBatch`。
 * 批量面（§3.3 P1）：选行单源 `resolveBatchRows` + 逐行落笔 `applyRowUpdate` / `applyRowClose`
 * （与单行形共函数——迁移表判 / 写门 / evidence 门逐行照判）。
 * 核销机检（F-LX4 · 2026-10-26 批 §2；2026-10-27 改判 ③ = 档面）：同一两逐行共函数在写 `已核销` 前判
 * 三件（批档在盘 ∥ §1 = 已收口 ∥ §3 = 评审通过），缺一即拒、一次报全缺项、行零改；判据只有目标值一条。
 * 本体住拆分件 `ledger-close-proof.mjs`（同 `ledger-tools.mjs` 先例）。
 *
 * 接线（设计档 §2.2 命令面接线）：族出口 = `ledger.mjs`（re-export 两源——KD-M2-3）；查询命令 ←
 * tools/index.mjs（assembleBuiltinTools 全角色面）；写命令 ← agent/family-tools.mjs（assembleFamilyTools
 * 的 depthOnly 分支）——一律**动态 import** 本模块链（ledger-db.mjs 静态 import node:sqlite ⇒
 * 消费侧静态 import 会破 W8 契约②）。
 */
import { AGING_DAYS, EVIDENCE_TOO_LONG_MAX, PENDING_STATUSES, nowIso, openLedger, resolveLedgerRoot } from "./ledger-db.mjs"
import { resolveDeclaredRef } from "./declaration.mjs"
import { filePartOf, namesPointer } from "./ledger-close-proof.mjs"
import {
  applyRowClose, applyRowUpdate, assertBatchArg, assertTaskBookGate, baseOf, evidenceValue, resolveBatchRows,
} from "./ledger-write-ops.mjs"

export { ledgerBindBatch, ledgerReclaimBatch } from "./ledger-write-ops.mjs"

/** 逐行老化判真（LEDGER.md §13.4 · 2026-10-07 批 ledger-tool）：未决四态（`PENDING_STATUSES`）∧
 *  行龄 > `AGING_DAYS` 天；行龄源 = `updated_at ?? created_at`（§5 同源）；时间戳缺 / 不可解析
 *  ⇒ `false`（零假阳降级——与 `buildScan` 行龄口径同源）。 */
function isRowAged(row, now) {
  if (!PENDING_STATUSES.includes(row.status)) return false
  const t = row.updated_at ?? row.created_at
  if (t == null) return false
  const ms = Date.parse(String(t))
  return Number.isFinite(ms) && (now - ms) / 86400000 > AGING_DAYS
}

/** `evidence` 文字太长读数（设计档 §5 P4——**读数非闸门**）：缺 / 空 ⇒ false；`query` 逐行携（含归档
 *  行——行值事实）；`count` 的统计集 = 未决四态（§7.1）。 */
const isEvidenceTooLong = (row) => row?.evidence != null && String(row.evidence).length > EVIDENCE_TOO_LONG_MAX

/** 本地日界（`YYYY-MM-DD`）——`resume_due` 比较粒度（设计档 §3.7：本地日界，当日锚当日即到期）。 */
const localDay = (ms) => { const d = new Date(ms); const p = (n) => String(n).padStart(2, "0"); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}` }

/** 复启锚判定（设计档 §3.4「锚判定文法」单源）：从左到右取首个 `@` 起始 token——
 *  ① 形合 `^\d{4}-\d{2}-\d{2}$` ∧ 真日历日（回写一致）⇒ 日期锚；② 含 `@` 而非日期锚 ⇒ 事件锚
 *  （fail-safe：机器不判 due，零假阳）；③ 无 `@` token ⇒ `free`。 */
function resumeAnchor(text) {
  const m = /@(\S+)/.exec(String(text ?? "")) // token = 「`@` 后非空白连续串」（零长 `@` 不算 token ⇒ free）
  if (!m) return { kind: "free", day: null }
  const tok = m[1]
  if (/^\d{4}-\d{2}-\d{2}$/.test(tok)) {
    const ms = Date.parse(`${tok}T00:00:00`)
    if (Number.isFinite(ms) && localDay(ms) === tok) return { kind: "date", day: tok }
  }
  return { kind: "event", day: null }
}

/** 指针在盘判（设计档 §7.1 B 判定本体）：`query` 逐行读数键 `taskBookOnDisk` 与出口态 `dangling`
 *  **共用同一判据**——解析成立（= 档在盘）⇒ true；缺指针 / 不可解析 / 档不在盘 ⇒ false。**读数非闸门**。 */
const pointerOnDisk = (row, base) => { const part = filePartOf(row?.task_book); return part !== "" && resolveDeclaredRef(base, part).ok }

/** 出口面机判单源（设计档 §3.7 ①——只由行数据 + 盘面事实判；射程 = 未决四态，归档态恒 `null`）：
 *  四类出口态**首中优先**（序 = `resume_due` → `dangling` → `unlabeled` → `aged`）；返回出口态字串
 *  ∥ `null`。`unlabeled`（`trigger IS NULL` ∧ 超龄）⊆ `aged` ⇒ 必先于 `aged` 判（否则永不返回）。
 *  `resume_due` 比较粒度 = 本地日界（锚日 ≤ 当地日 ⇒ 到期；不按时刻比）。 */
export function overdueOf(row, { now = Date.now(), base } = {}) {
  if (!PENDING_STATUSES.includes(row?.status)) return null
  if (row.trigger === "条件") {
    const anchor = resumeAnchor(row.resume_when)
    if (anchor.day !== null && anchor.day <= localDay(now)) return "resume_due"
  }
  if (row.trigger === "归批" && !pointerOnDisk(row, base)) return "dangling"
  if (row.trigger == null && isRowAged(row, now)) return "unlabeled"
  if (isRowAged(row, now)) return "aged"
  return null
}

/** 查询（只读，全角色）：SELECT 行集（status / kind / board / trigger / task_book 等值过滤并取，缺省 =
 *  全部行；id 升序）。库不在 = 空账。只读开库（readOnly 句柄 + 零 DDL/ALTER——read-data-interface 批
 *  FR2③）；库档非台账库 ⇒ 空账。逐行携计算字段（均不入库、不入导出白名单 `DATA_COLUMNS`）：
 *  `aged`（§13.4）∥ `evidenceTooLong`（§5 P4 文字太长读数）∥ `taskBookOnDisk`（§7.1 B 在盘读数）∥ `overdue`
 *  （§3.7 出口态字串 ∥ null——机判单源 `overdueOf`）；`task_book` = 第 5 枚等值过滤（**原值等值**——列串直比，与 §3.3 选行的
 *  「文件部分解析同址」两径口径不同、各自单源）；`trigger` 过滤仅三枚举等值（`NULL` 不过滤）；
 *  `now` = 注入缝（确定性用例）。 */
export function ledgerQuery({ cwd, boundary, status = null, kind = null, board = null, trigger = null, task_book = null, now = Date.now() } = {}) {
  const db = openLedger(cwd, { readOnly: true, boundary })
  if (!db) return []
  try {
    const where = [], args = []
    if (status) { where.push("status = ?"); args.push(status) }
    if (kind) { where.push("kind = ?"); args.push(kind) }
    if (board) { where.push("board = ?"); args.push(board) }
    if (trigger) { where.push("trigger = ?"); args.push(trigger) }
    if (task_book) { where.push("task_book = ?"); args.push(task_book) }
    const rows = db.prepare(`SELECT * FROM items${where.length ? ` WHERE ${where.join(" AND ")}` : ""} ORDER BY id`).all(...args)
    const base = baseOf(cwd, boundary)
    return rows.map((r) => ({ ...r, aged: isRowAged(r, now), evidenceTooLong: isEvidenceTooLong(r), taskBookOnDisk: pointerOnDisk(r, base), overdue: overdueOf(r, { now, base }) }))
  } finally { db.close() }
}

/** 计数单源（只读，全角色）：回报 `{ count, overdue, evidenceTooLong }`（设计档 §7.1——原裸数出参
 *  改对象形，消费面同批改）。`count` = 未决四态行数；`overdue` = 其中命中出口态的行数（`overdueOf`
 *  机判单源）；`evidenceTooLong` = 其中 `evidence` 文字太长的行数（§5）。**一次 SELECT + 逐行判**——
 *  `evidenceTooLong` 与 `overdue` 同一次遍历（零额外 IO；成本模型 = §7.2）；不设缓存（读数须反映
 *  即时盘面）。库不在 = 三零。 */
export function ledgerCount({ cwd, boundary, task_book = null } = {}) {
  const db = openLedger(cwd, { readOnly: true, boundary })
  if (!db) return { count: 0, overdue: 0, evidenceTooLong: 0 }
  try {
    const where = [`status IN (${PENDING_STATUSES.map(() => "?").join(",")})`], args = [...PENDING_STATUSES]
    if (task_book) { where.push("task_book = ?"); args.push(task_book) }
    const rows = db.prepare(`SELECT * FROM items WHERE ${where.join(" AND ")}`).all(...args)
    const now = Date.now(), base = baseOf(cwd, boundary)
    let overdue = 0, tooLong = 0
    for (const r of rows) {
      if (overdueOf(r, { now, base }) !== null) overdue++
      if (isEvidenceTooLong(r)) tooLong++
    }
    return { count: rows.length, overdue, evidenceTooLong: tooLong }
  } finally { db.close() }
}

/** `evidence` 文字太长的行数（设计档 §7.1 导出面——`count` 回报读数**同一单源**：本函数为其薄委托，
 *  不另立第二判定面）。 */
export function ledgerEvidenceTooLong({ cwd, boundary, task_book = null } = {}) {
  return ledgerCount({ cwd, boundary, task_book }).evidenceTooLong
}

/** 新增（写命令，仅主 agent）：INSERT——入待讨论（六态状态机入口）。`row.resume_when` 可空（§3.4）。 */
export function ledgerAdd({ cwd, row, boundary }) {
  const db = openLedger(cwd, { create: true, boundary })
  try {
    // 结果行状态 = INSERT 硬编码「待讨论」⇒ 臂① 的 `status` 半幅当下不触；`trigger=归批` 半幅与臂② 照判
    assertTaskBookGate(cwd, "ledgerAdd", {
      status: "待讨论",
      trigger: row.trigger ?? null,
      taskBook: row.task_book ?? null,
      wroteTaskBook: namesPointer(row.task_book),
      wroteBatchTrigger: row.trigger === "归批",
    }, boundary)
    const now = nowIso()
    const r = db.prepare(`INSERT INTO items (kind, status, title, board, req_doc, task_book, evidence, trigger, resume_when, created_at, updated_at) VALUES (?, '待讨论', ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(row.kind, row.title, row.board ?? null, row.req_doc ?? null, row.task_book ?? null, row.evidence ?? null, row.trigger ?? null, row.resume_when ?? null, now, now)
    return Number(r.lastInsertRowid)
  } finally { db.close() }
}

/** 更新（写命令，仅主 agent）：UPDATE——状态迁移前判允许迁移表（不在表内 → 拒，行不变）。
 *  executor 目标值随同一 UPDATE 落列（LEDGER.md §3.1）；executorSessionId = 调用会话（函数参数注入——K-LX1
 *  纯函数可测；工具层动态 import getSessionId() 供值，零新静态边）。
 *  `evidence` 传值 = 追加缺省、`patch.evidenceReplace` = 布尔覆盖旗（§13.9——值计算 / 两拒面 = `evidenceValue`
 *  / `assertEvidenceValue`；判位 = 本语义段，随 executor 目标值同拍）。**单行形**（`id`）——逐行落笔 =
 *  `applyRowUpdate`（自开事务：半途抛 ⇒ 行零改）。 */
export function ledgerUpdate({ cwd, id, patch, executorSessionId, boundary, agent }) {
  const db = openLedger(cwd, { create: true, boundary })
  try {
    const row = db.prepare("SELECT * FROM items WHERE id = ?").get(id)
    if (!row) throw new Error(`ledgerUpdate：行 ${id} 不存在`)
    const { id: rowId } = applyRowUpdate(db, cwd, row, patch, executorSessionId, boundary, { agent, base: baseOf(cwd, boundary) })
    return { id: rowId }
  } finally { db.close() }
}

/** 收口（写命令，仅主 agent）：核销（**只有一条边**——`待核销 → 已核销`：其余现态一律拒，拒文点名现态 + 该现态
 *  的出路句）/ 撤回（任意态 → 已废弃），事务包裹；归档 = 软删除。
 *  可选 `evidence` 参：传值 = 追加缺省（§13.9——旧空直写 / 旧非空拼 `旧｜新`）、`evidenceReplace: true`
 *  同传 = 整段替换；核销 / 撤回两径同携（写值落行，内容不判）；两拒面（旗独传 @值计算 ∥
 *  新值空白 @值计算后）见 `evidenceValue` / `assertEvidenceValue`。
 *  判序（同函数体同层，§13.9）：目标集判 → 行取 → 源态判 → **核销机检**（`已核销` 才触）→ 值计算 →
 *  拒面②（新值空白）→ UPDATE（LEDGER.md §3 核销只有一条边）。**单行形**（`id`）——逐行落笔 = `applyRowClose`。 */
export function ledgerClose({ cwd, id, status, evidence, evidenceReplace, boundary, agent }) {
  if (status !== "已核销" && status !== "已废弃") throw new Error(`ledgerClose：目标态 ${status} ∉ {已核销, 已废弃}`)
  const db = openLedger(cwd, { create: true, boundary })
  try {
    db.exec("BEGIN")
    try {
      const row = db.prepare("SELECT * FROM items WHERE id = ?").get(id)
      if (!row) throw new Error(`ledgerClose：行 ${id} 不存在`)
      const out = applyRowClose(db, row, status, evidence, evidenceReplace, { agent, base: baseOf(cwd, boundary) })
      db.exec("COMMIT")
      return out
    } catch (e) { db.exec("ROLLBACK"); throw e }
  } finally { db.close() }
}

// ── 批级批量迁移与结算（设计档 §3.3 · P1 · AC-M2-26 ∥ AC-M2-27）────────────────

/** 批级批量迁移（设计档 §3.3）：`patch.status` 在场 ⇒ 逐行按既有迁移表重判；不在场 ⇒ **纯字段补丁**
 *  （`status` 零写、迁移表不判、`executor` 普通补丁语义——回执 `status` 键 = `null`）。
 *  **门拒 ≠ 事务失败**：逐行门（迁移表 / §6.1 写门 / evidence 门）抛错 ⇒ 本行捕获计入 `skipped`
 *  （`why` = 该门拒因文案原文），其余行照落；**事务级失败**（取写锁 / `COMMIT` 层）⇒ 整批 `ROLLBACK`
 *  并抛（零行改）——故「部分落地」只由逐行门拒产生，「中途失败」不留半批。
 *  `BEGIN IMMEDIATE`：写锁一次先把（逐行不升级锁 ⇒ 事务级失败在首行之前即失败）。
 *  核销机检 ③ 自 2026-10-27 起读档面（不看 token 槽），本径不再预读归属并集——逐行照判、不缺不省。
 *  @returns {{batch: string, status: string|null, applied: number[], skipped: {id: number, from: string, why: string}[]}} */
export function ledgerUpdateBatch({ cwd, batch, patch = {}, executorSessionId, boundary, agent }) {
  const db = openLedger(cwd, { create: true, boundary })
  try {
    const base = baseOf(cwd, boundary)
    const abs = assertBatchArg("ledgerUpdate", base, batch)
    const proof = { agent, base }
    db.exec("BEGIN IMMEDIATE")
    try {
      const applied = [], skipped = []
      for (const row of resolveBatchRows(db, base, abs)) {
        try { applied.push(applyRowUpdate(db, cwd, row, patch, executorSessionId, boundary, proof, true).id) }
        catch (e) { skipped.push({ id: Number(row.id), from: row.status, why: String(e?.message ?? e) }) }
      }
      db.exec("COMMIT")
      return { batch, status: patch.status ?? null, applied, skipped }
    } catch (e) { db.exec("ROLLBACK"); throw e }
  } finally { db.close() }
}

/** 批级批量结算（设计档 §3.3）：**只销已到 `待核销` 的行**（勾销径）；`待讨论` / `待设计` ⇒ `skipped`
 *  逐行点名（**须先 `update` 到 `在途` 认领**——无核销边可走，统一文本会造假账），`在途` ⇒
 *  `skipped` 逐行点名（不可跳）。**归档态（`已核销` / `已废弃`）行 ⇒ 静默不计**（不入 `applied`、
 *  不入 `skipped`——归档行本非结算对象，点名会让每批重跑刷屏）。`evidence` 逐行追加同一文本
 *  （`evidenceValue` 同源）。回执 `status` 恒 `已核销`（批量形缺省 = 勾销单值；携则守卫已收窄为
 *  `{已核销}`——§3.2 `whenPresent`）。事务语义同 `ledgerUpdateBatch`。
 *  @returns {{batch: string, status: string, applied: number[], skipped: {id: number, from: string, why: string}[]}} */
export function ledgerCloseBatch({ cwd, batch, evidence, evidenceReplace, boundary, agent }) {
  const status = "已核销"
  const db = openLedger(cwd, { create: true, boundary })
  try {
    const base = baseOf(cwd, boundary)
    const abs = assertBatchArg("ledgerClose", base, batch)
    const proof = { agent, base } // ③ 读档面（2026-10-27 起不再预读 token 槽归属）
    db.exec("BEGIN IMMEDIATE")
    try {
      const applied = [], skipped = []
      for (const row of resolveBatchRows(db, base, abs)) {
        if (row.status === "已核销" || row.status === "已废弃") continue // 归档态静默不计
        if (row.status !== "待核销") {
          const why = row.status === "在途" ? "ledgerClose：在途不可跳（须先 待核销）" : "ledgerClose：待认领不可核销（须先 update 到 在途）"
          skipped.push({ id: Number(row.id), from: row.status, why })
          continue
        }
        try { applied.push(applyRowClose(db, row, status, evidence, evidenceReplace, proof).id) }
        catch (e) { skipped.push({ id: Number(row.id), from: row.status, why: String(e?.message ?? e) }) }
      }
      db.exec("COMMIT")
      return { batch, status, applied, skipped }
    } catch (e) { db.exec("ROLLBACK"); throw e }
  } finally { db.close() }
}

// ── 指针判据重锚面（设计档 §7.1 · B 读数 ∥ C 收口重锚 · 台账 #1550）────────────────

/** 本批行集（只读，任意状态——设计档 §7.1）：批身份单源 = `resolveBatchRows` 解析同址（零二写）；
 *  逐行携读数 `taskBookOnDisk`（不入库、不入 `DATA_COLUMNS`）。`batch` 不可解析 ∥ 无根 ⇒ 抛（同族
 *  `assertBatchArg` 形）；库不在 ⇒ 空集。`cwd` 口径 = 批档所属项目根（§6.2 `cwd` 基准——不用会话锚）；
 *  `boundary` = 上溯上界（会话锚——与工具面同一枚界；缺省 = 进程 cwd）。 */
export function ledgerBatchRows({ cwd, batch, boundary } = {}) {
  const derived = cwd == null ? null : resolveLedgerRoot(cwd, boundary)
  if (!derived) throw new Error(`ledgerBatchRows：批档所属项目根不可推导（${cwd ?? "（缺 cwd）"}）`)
  const base = derived.root
  const abs = assertBatchArg("ledgerBatchRows", base, batch) // 失败语义先于「库不在 ⇒ 空集」（不可解析就是不可解析）
  const db = openLedger(base, { readOnly: true, boundary })
  if (!db) return []
  try {
    return resolveBatchRows(db, base, abs).map((r) => ({ ...r, taskBookOnDisk: pointerOnDisk(r, base) }))
  } finally { db.close() }
}

/**
 * 收口重锚单源（写命令，主 agent 面——设计档 §6.2 · C · AC-M2-30；2026-10-27 按行状态分流 · §2.7）：
 * 取本批行集 → **先行排除** `trigger = 认账不排期`（零触、不点名——政策判断归行主人）→ 按**行状态**分流：
 *   · `在途`（本批的工作行，父侧没在收口前处置）⇒ `待核销`（做完待结账）+ `executor = NULL`（出边的自动
 *     语义——同 §3.1），回执点名；
 *   · `待讨论` / `待设计`（本批没动的行）⇒ `条件` + 复启句（`原批 <批名> 已收口，须另起批次接手`）落
 *     `resume_when`；该列现值非空（行主条件句在册）⇒ **不覆盖**、复句追加 `evidence`；回执点名；
 *   · `条件`（已在锚位）⇒ 零写跳过（幂等）；`待核销` / 归档态 ⇒ 不动、不点名（`alreadyAnchored` 承载
 *     幂等跳过面，回执不噪）。
 * 单事务：任一步失败 ⇒ 整集 `ROLLBACK`（零行改）。**不抛**——失败经返回形 `failed` 报出（`null` 常态）；
 * `cwd` 无根 ⇒ 不取行、不重锚（**不落兜底基准**——落了就是静默零命中）。
 * `updated_at` 零触（机器重锚不是人工推进的痕迹——行龄读数照旧）。
 * `boundary` = 上溯上界（会话锚——与工具面 / `ledgerBatchRows` 同一枚界；缺省 = 进程 cwd）。
 * @returns {{batch:string, reanchored:{id:number,status:string,title:string,to:"待核销"|"条件",sentenceTo?:"resume_when"|"evidence"}[], alreadyAnchored:{id:number,status:string,title:string}[], failed:string|null}}
 */
export function ledgerReanchorBatch({ cwd, batch, boundary } = {}) {
  const failedResult = (why) => ({ batch, reanchored: [], alreadyAnchored: [], failed: why })
  const derived = cwd == null ? null : resolveLedgerRoot(cwd, boundary)
  if (!derived) return failedResult("批档所属项目根不可推导")
  const base = derived.root
  let db
  try { db = openLedger(base, { boundary }) } catch (e) { return failedResult(String(e?.message ?? e)) } // 库不可开 ⇒ 零写报因
  if (!db) return { batch, reanchored: [], alreadyAnchored: [], failed: null } // 库不在 ⇒ 零行可锚
  try {
    let abs
    try { abs = assertBatchArg("ledgerReanchorBatch", base, batch) } catch (e) { return failedResult(String(e?.message ?? e)) }
    const sentence = `原批 ${filePartOf(batch)} 已收口，须另起批次接手`
    try {
      db.exec("BEGIN IMMEDIATE")
      const reanchored = [], alreadyAnchored = []
      for (const row of resolveBatchRows(db, base, abs)) {
        if (row.trigger === "认账不排期") continue // 先行排除：零触、不点名（§2.7）
        const face = { id: Number(row.id), status: row.status, title: row.title }
        if (row.status === "在途") {
          // 本批的工作行：做完待结账（出边自动语义——executor 清零，行离工作位）
          db.prepare("UPDATE items SET status = ?, executor = NULL WHERE id = ?").run("待核销", row.id)
          reanchored.push({ ...face, to: "待核销" })
          continue
        }
        if (row.status !== "待讨论" && row.status !== "待设计") continue // 待核销 / 归档态：不动、不点名
        if (row.trigger === "条件") { alreadyAnchored.push(face); continue } // 幂等零写
        const kept = row.resume_when != null && String(row.resume_when).trim() !== ""
        const nextEvidence = kept ? evidenceValue("ledgerReanchorBatch", row.evidence, sentence, false) : row.evidence
        db.prepare("UPDATE items SET trigger = ?, resume_when = ?, evidence = ? WHERE id = ?")
          .run("条件", kept ? row.resume_when : sentence, nextEvidence, row.id)
        reanchored.push({ ...face, to: "条件", sentenceTo: kept ? "evidence" : "resume_when" })
      }
      db.exec("COMMIT")
      return { batch, reanchored, alreadyAnchored, failed: null }
    } catch (e) {
      try { db.exec("ROLLBACK") } catch { /* 事务未开 / 已结 */ }
      return failedResult(String(e?.message ?? e))
    }
  } finally { db.close() }
}
