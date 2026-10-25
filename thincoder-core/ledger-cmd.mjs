/**
 * ledger-cmd.mjs — 台账核心函数档（查询 = 只读全角色 / 写 = 仅主 agent 装配）。
 * 工具定义 + 工具层参数守卫 = 拆分件 `thincoder-core/ledger-tools.mjs`（2026-09-28 守卫族微修批 ·
 * 台账 #473——纯搬移、语义零变；拆分触发 = 本档 298 行贴 300 顾问线，本批读面守卫增量必越线）；
 * 核函数（`ledgerQuery` / `ledgerCount` / `ledgerAdd` / `ledgerUpdate` / `ledgerClose` + 批级批量
 *  `ledgerUpdateBatch` / `ledgerCloseBatch`）留本档，工具档消费之。
 *
 * 读数面（逐行携、不入库、不入 `DATA_COLUMNS`——先例 = `aged`）：`evidenceOversize`（§5 P4）∥
 * `overdue`（§3.7 出口态——机判单源 `overdueOf`）∥ `taskBookOnDisk`（§7.1 B——指针在盘读数）。
 * 三枚皆**读数非闸门**（不拒任何写入）。
 * 指针判据重锚面（§6.1 两臂写门 ∥ §6.2 收口重锚 · 台账 #1550）：写门判**本笔写入面**、只判本笔新指名；
 * 「档此刻在不在盘」降为读数——读面导出 `ledgerBatchRows`、收口重锚单源 `ledgerReanchorBatch`。
 * 批量面（§3.3 P1）：选行单源 `resolveBatchRows` + 逐行落笔 `applyRowUpdate` / `applyRowClose`
 * （与单行形共函数——迁移表判 / 写门 / evidence 门逐行照判）。
 * 核销标记门（LIGHT-CHANNEL.md §2.5 · 台账 #1780）：写入 `已核销` 的三径（close 单行 ∥ close 批量 ∥
 *  update 迁移——均经两逐行共函数）判**结果行标题**携 `ROUND_MARKER` ⇒ 拒；判据只认标题标记
 * （不查批档 ∥ 不查评审实跑），撤回（→ 已废弃）不拦。
 *
 * 接线（设计档 §2.2 命令面接线）：族出口 = `ledger.mjs`（re-export 两源——KD-M2-3）；查询命令 ←
 * tools/index.mjs（assembleBuiltinTools 全角色面）；写命令 ← agent/family-tools.mjs（assembleFamilyTools
 * 的 depthOnly 分支）——一律**动态 import** 本模块链（ledger-db.mjs 静态 import node:sqlite ⇒
 * 消费侧静态 import 会破 W8 契约②）。
 */
import { resolve } from "node:path"
import { AGING_DAYS, ALLOWED_MIGRATIONS, EVIDENCE_SOFT_LIMIT, nowIso, openLedger, PENDING_STATUSES, resolveLedgerRoot, ROUND_MARKER } from "./ledger-db.mjs"
import { resolveDeclaredRef } from "./declaration.mjs"

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

/** 指针 ∥ 批档值 → 文件部分（首个 `§` 前子串，trim——设计档 §6.1 口径 1 单源；`task_book` 与
 *  `batch` 同形同口径）。 */
const filePartOf = (v) => (v == null ? "" : String(v).split("§")[0].trim())

/** 解析基准（设计档 §6.1 口径 2 同一子表达式——与台账库键同源）：`resolveLedgerRoot(cwd)?.root
 *  ?? resolve(cwd ?? ".")`。 */
const baseOf = (cwd) => resolveLedgerRoot(cwd)?.root ?? resolve(cwd ?? ".")

/** `evidence` 超限读数（设计档 §5 P4——**读数非闸门**）：缺 / 空 ⇒ false；`query` 逐行携（含归档行——
 *  行值事实）；`count` 的统计集 = 未决四态（§7.1）。 */
const isEvidenceOversize = (row) => row?.evidence != null && String(row.evidence).length > EVIDENCE_SOFT_LIMIT

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
export function overdueOf(row, { now = Date.now(), base = process.cwd() } = {}) {
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
 *  `aged`（§13.4）∥ `evidenceOversize`（§5 P4 超限读数）∥ `taskBookOnDisk`（§7.1 B 在盘读数）∥ `overdue`
 *  （§3.7 出口态字串 ∥ null——机判单源 `overdueOf`）；`task_book` = 第 5 枚等值过滤（**原值等值**——列串直比，与 §3.3 选行的
 *  「文件部分解析同址」两径口径不同、各自单源）；`trigger` 过滤仅三枚举等值（`NULL` 不过滤）；
 *  `now` = 注入缝（确定性用例）。 */
export function ledgerQuery({ cwd, status = null, kind = null, board = null, trigger = null, task_book = null, now = Date.now() } = {}) {
  const db = openLedger(cwd, { readOnly: true })
  if (!db) return []
  try {
    const where = [], args = []
    if (status) { where.push("status = ?"); args.push(status) }
    if (kind) { where.push("kind = ?"); args.push(kind) }
    if (board) { where.push("board = ?"); args.push(board) }
    if (trigger) { where.push("trigger = ?"); args.push(trigger) }
    if (task_book) { where.push("task_book = ?"); args.push(task_book) }
    const rows = db.prepare(`SELECT * FROM items${where.length ? ` WHERE ${where.join(" AND ")}` : ""} ORDER BY id`).all(...args)
    const base = baseOf(cwd)
    return rows.map((r) => ({ ...r, aged: isRowAged(r, now), evidenceOversize: isEvidenceOversize(r), taskBookOnDisk: pointerOnDisk(r, base), overdue: overdueOf(r, { now, base }) }))
  } finally { db.close() }
}

/** 计数单源（只读，全角色）：回报 `{ count, overdue, evidenceOversize }`（设计档 §7.1——原裸数出参
 *  改对象形，消费面同批改）。`count` = 未决四态行数；`overdue` = 其中命中出口态的行数（`overdueOf`
 *  机判单源）；`evidenceOversize` = 其中 `evidence` 超限行数（§5）。**一次 SELECT + 逐行判**——
 *  `evidenceOversize` 与 `overdue` 同一次遍历（零额外 IO；成本模型 = §7.2）；不设缓存（读数须反映
 *  即时盘面）。库不在 = 三零。 */
export function ledgerCount({ cwd, task_book = null } = {}) {
  const db = openLedger(cwd, { readOnly: true })
  if (!db) return { count: 0, overdue: 0, evidenceOversize: 0 }
  try {
    const where = [`status IN (${PENDING_STATUSES.map(() => "?").join(",")})`], args = [...PENDING_STATUSES]
    if (task_book) { where.push("task_book = ?"); args.push(task_book) }
    const rows = db.prepare(`SELECT * FROM items WHERE ${where.join(" AND ")}`).all(...args)
    const now = Date.now(), base = baseOf(cwd)
    let overdue = 0, oversize = 0
    for (const r of rows) {
      if (overdueOf(r, { now, base }) !== null) overdue++
      if (isEvidenceOversize(r)) oversize++
    }
    return { count: rows.length, overdue, evidenceOversize: oversize }
  } finally { db.close() }
}

/** `evidence` 超限行数（设计档 §7.1 导出面——`count` 回报读数**同一单源**：本函数为其薄委托，
 *  不另立第二判定面）。 */
export function ledgerEvidenceOversize({ cwd, task_book = null } = {}) {
  return ledgerCount({ cwd, task_book }).evidenceOversize
}

/** 本笔指名谓词（设计档 §6.1 口径 3）：显式空值（`null` / 空串 / 全空白） ≡ **未指名**——臂② 不触。 */
const namesPointer = (v) => v != null && String(v).trim() !== ""

/** 写门·指针点名（设计档 §6.1 两臂 · AC-M2-10 ∥ AC-M2-29）：判**本笔写入面**——两臂之外零判。
 *  臂①（点名非空）：结果行 `status ∈ {在途, 待核销}` ∨ 结果行 `trigger = 归批` ⇒ `task_book` 非空
 *  （缺 / 空串 / 全空白 ⇒ 拒「必填」）；**不判在盘**（列值事实，不随盘面翻转——DDL 咬合 CHECK 为该半幅防线）。
 *  臂②（本笔新指名）：本笔新写 `task_book`（非空值）∥ 本笔新写 `trigger = 归批` ⇒ 绑定指针非空 ∧ 文件部分
 *  可解析 ∧ 解析出的档**在盘**（判定单源 = `resolveDeclaredRef`，零二写）。
 *  **「档此刻在不在盘」不入臂①**：批档可随时整体清理 ⇒ 当结果行判据则合法账务被拒、而出路正是被拒字段
 *  （死锁）；存量指针失效只体现为读数 `taskBookOnDisk = false`（§7.1）。
 *  判位 = 与迁移表判同层（落盘前）；文案前缀 = 调用函数名；基准 = §6.1 口径 2（根推导单源同子表达式）。
 *  @param {{status:string, trigger:string|null, taskBook:string|null, wroteTaskBook:boolean, wroteBatchTrigger:boolean}} face 本笔写入面
 */
function assertTaskBookGate(cwd, fnName, face) {
  const { status, trigger, taskBook, wroteTaskBook, wroteBatchTrigger } = face
  if ((status === "在途" || status === "待核销" || trigger === "归批") && !namesPointer(taskBook)) {
    throw new Error(`${fnName}：task_book 必填（在途 / 待核销 / 归批 须携任务书指针）`)
  }
  if (!wroteTaskBook && !wroteBatchTrigger) return // 臂② 之外零判：旧指针所指档已清不阻任何此类写入
  const part = filePartOf(taskBook)
  if (!part) throw new Error(`${fnName}：task_book 不可解析（缺文件部分）：${taskBook}`)
  const base = baseOf(cwd) // §6.1 口径 2 同一子表达式（单源 = 本档 `baseOf`）
  const { ok, abs } = resolveDeclaredRef(base, part)
  if (!ok) throw new Error(`${fnName}：task_book 指向的档不存在：${taskBook}（解析 = ${abs}）`)
}

/** 新增（写命令，仅主 agent）：INSERT——入待讨论（六态状态机入口）。`row.resume_when` 可空（§3.4）。 */
export function ledgerAdd({ cwd, row }) {
  const db = openLedger(cwd, { create: true })
  try {
    // 结果行状态 = INSERT 硬编码「待讨论」⇒ 臂① 的 `status` 半幅当下不触；`trigger=归批` 半幅与臂② 照判
    assertTaskBookGate(cwd, "ledgerAdd", {
      status: "待讨论",
      trigger: row.trigger ?? null,
      taskBook: row.task_book ?? null,
      wroteTaskBook: namesPointer(row.task_book),
      wroteBatchTrigger: row.trigger === "归批",
    })
    const now = nowIso()
    const r = db.prepare(`INSERT INTO items (kind, status, title, board, req_doc, task_book, evidence, trigger, resume_when, created_at, updated_at) VALUES (?, '待讨论', ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(row.kind, row.title, row.board ?? null, row.req_doc ?? null, row.task_book ?? null, row.evidence ?? null, row.trigger ?? null, row.resume_when ?? null, now, now)
    return Number(r.lastInsertRowid)
  } finally { db.close() }
}

/** executor 目标值计算（设计档 docs/core/design/LEDGER.md §3.1——判位在 ledgerUpdate 体内：迁移表判 → 本语义 → 写门 → UPDATE）。
 *  优先级 = patch 显式 > 自动语义（进边 = executorSessionId / 出边 = NULL）> 行现值兜底 > NULL。
 *  进边集（2026-10-07 批 ledger-tool 扩面——§13.3 / KD-LT1）：`待讨论 → 待设计`（批点火边）∥
 *  `待设计 → 在途`（实施入边）——两枚同式。 */
function resolveExecutorTarget(row, to, patch, executorSessionId) {
  if ((row.status === "待讨论" && to === "待设计") || (row.status === "待设计" && to === "在途")) {
    return patch.executor ?? executorSessionId ?? row.executor ?? null
  }
  if (row.status === "在途" && (to === "待核销" || to === "已废弃")) {
    return null // 出边自动语义压 patch——显式传 executor 也不复活
  }
  return patch.executor ?? row.executor ?? null
}

/** `evidence` 值计算（设计档 LEDGER.md §13.9——update / close 两函数同源一处落）：追加缺省（旧值非空 ⇒
 *  `旧 + "｜" + 新`——「｜」两侧零空格直接相接；旧空（`null` ∥ 空串 ∥ 全空白）⇒ 直写，零分隔符残留）；
 *  `evidenceReplace === true` 与值同传 ⇒ 整段替换（旧文零保留）；`evidence` 缺 / `null` ≡ 略去（零变）。
 *  拒面①（旗独传——无新文可算）判于本阶段（close 侧先于追认门）；核内旗判只认 `=== true`（类型严判在
 *  工具层）。两值逐字落行（不裁 / 不判内容）。 */
function evidenceValue(fnName, oldValue, evidence, evidenceReplace) {
  if (evidenceReplace === true && evidence == null) throw new Error(`${fnName}：evidenceReplace 须与 evidence 同传（缺新文）`)
  if (evidence == null) return oldValue
  const old = oldValue == null || String(oldValue).trim() === "" ? "" : String(oldValue)
  return evidenceReplace === true || old === "" ? evidence : `${old}｜${evidence}`
}

/** 拒面②（新值全空白——追加 ∥ 覆盖两径同判）判点（§13.9 判序）：update 随值计算同拍 ∥ close 落
 *  追认门之后；`evidence` 未传（`null` / 略去）⇒ 不判。 */
function assertEvidenceValue(fnName, evidence) {
  if (evidence != null && String(evidence).trim() === "") throw new Error(`${fnName}：evidence 为空（非空字符串）`)
}

/** 单行落笔·update（**单行形 ∥ 批量形共函数**——设计档 §3.3「逐行语义单源」）：迁移表判 → 核销标记门
 *  （目标 = `已核销` ∧ 结果标题携标记 ⇒ 拒——判序 = LIGHT-CHANNEL.md §2.5）→ executor / evidence 值计算
 *  （含两拒面）→ 写门 → UPDATE（判序 = §13.9 逐字未变）。`to` = `patch.status ?? 行现态`
 *  ——批量形纯字段补丁（不携 `status`）时 `to === row.status` ⇒ 迁移表不判、`status` 零写（§3.3）。
 *  `resume_when` = 普通可空字段补丁（`patch.resume_when ?? 行值`——§3.4）。 */
function applyRowUpdate(db, cwd, row, patch, executorSessionId) {
  const to = patch.status ?? row.status
  if (to !== row.status && !(ALLOWED_MIGRATIONS[row.status] ?? []).includes(to)) {
    throw new Error(`ledgerUpdate：迁移 ${row.status} → ${to} 不在允许迁移表`)
  }
  // 核销标记门（LIGHT-CHANNEL.md §2.5）：判**结果标题**——一笔同携清标记 title + status=已核销 ⇒ 放行
  if (to === "已核销" && String(patch.title ?? row.title ?? "").includes(ROUND_MARKER)) {
    throw new Error(`ledgerUpdate：行标题仍携「${ROUND_MARKER}」——收尾链未跑完，不许核销（先跑收尾全链，再由父侧清标记）`)
  }
  const nextExecutor = resolveExecutorTarget(row, to, patch, executorSessionId)
  const nextEvidence = evidenceValue("ledgerUpdate", row.evidence, patch.evidence, patch.evidenceReplace)
  assertEvidenceValue("ledgerUpdate", patch.evidence)
  const nextTaskBook = patch.task_book ?? row.task_book
  assertTaskBookGate(cwd, "ledgerUpdate", {
    status: to,
    trigger: patch.trigger ?? row.trigger,
    taskBook: nextTaskBook,
    wroteTaskBook: namesPointer(patch.task_book),
    wroteBatchTrigger: patch.trigger === "归批",
  }) // → 写门 → UPDATE
  const now = nowIso()
  db.prepare(`UPDATE items SET status = ?, title = ?, board = ?, req_doc = ?, task_book = ?, evidence = ?, trigger = ?, resume_when = ?, executor = ?, updated_at = ? WHERE id = ?`)
    .run(to, patch.title ?? row.title, patch.board ?? row.board, patch.req_doc ?? row.req_doc, nextTaskBook, nextEvidence, patch.trigger ?? row.trigger, patch.resume_when ?? row.resume_when, nextExecutor, now, row.id)
  return { id: Number(row.id), status: to }
}

/** 更新（写命令，仅主 agent）：UPDATE——状态迁移前判允许迁移表（不在表内 → 拒，行不变）。
 *  executor 目标值随同一 UPDATE 落列（LEDGER.md §3.1）；executorSessionId = 调用会话（函数参数注入——K-LX1
 *  纯函数可测；工具层动态 import getSessionId() 供值，零新静态边）。
 *  `evidence` 传值 = 追加缺省、`patch.evidenceReplace` = 布尔覆盖旗（§13.9——值计算 / 两拒面 = `evidenceValue`
 *  / `assertEvidenceValue`；判位 = 本语义段，随 executor 目标值同拍）。**单行形**（`id`）——逐行落笔 = `applyRowUpdate`。 */
export function ledgerUpdate({ cwd, id, patch, executorSessionId }) {
  const db = openLedger(cwd, { create: true })
  try {
    const row = db.prepare("SELECT * FROM items WHERE id = ?").get(id)
    if (!row) throw new Error(`ledgerUpdate：行 ${id} 不存在`)
    const { id: rowId } = applyRowUpdate(db, cwd, row, patch, executorSessionId)
    return { id: rowId }
  } finally { db.close() }
}

/** 单行落笔·close（**单行形 ∥ 批量形共函数**——设计档 §3.3「逐行语义单源」）：源态判（核销仅三源——
 *  在途不可跳）→ 核销标记门（LIGHT-CHANNEL.md §2.5——`已核销` ∧ 标题携标记 ⇒ 拒；撤回不拦）→
 *  值计算（拒面① 旗独传判于此）→ 追认口 `evidence` 门 → 拒面② → UPDATE。
 *  撤回（任意态 → 已废弃——含在途直撤）同步 `executor = NULL`（LEDGER.md §3.1 ④）；核销两源（勾销 /
 *  追认）`executor` 零触碰（非在途出边）。 */
function applyRowClose(db, row, status, evidence, evidenceReplace) {
  if (status === "已核销" && !["待讨论", "待设计", "待核销"].includes(row.status)) throw new Error(`ledgerClose：核销仅限 待讨论 / 待设计 / 待核销（现态 ${row.status}）`)
  // 核销标记门（LIGHT-CHANNEL.md §2.5）：勾销 ∥ 追认同判；撤回（→ 已废弃）不入本门
  if (status === "已核销" && String(row.title ?? "").includes(ROUND_MARKER)) {
    throw new Error(`ledgerClose：行标题仍携「${ROUND_MARKER}」——收尾链未跑完，不许核销（先跑收尾全链，再由父侧清标记）`)
  }
  const nextEvidence = evidenceValue("ledgerClose", row.evidence, evidence, evidenceReplace)
  if (status === "已核销" && ["待讨论", "待设计"].includes(row.status) && (nextEvidence == null || String(nextEvidence).trim() === "")) throw new Error(`ledgerClose：追认核销须带 evidence（现态 ${row.status}）`)
  assertEvidenceValue("ledgerClose", evidence) // 判序：拒面②（新值空白）落追认门之后 → UPDATE
  const now = nowIso()
  db.prepare("UPDATE items SET status = ?, closed_at = ?, updated_at = ?, executor = ?, evidence = ? WHERE id = ?").run(status, now, now, status === "已废弃" ? null : row.executor, nextEvidence, row.id)
  return { id: Number(row.id), status }
}

/** 收口（写命令，仅主 agent）：核销两源（勾销：待核销 → 已核销；追认核销：待讨论 / 待设计 → 已核销，
 *  行 `evidence` 非空，缺 / 全空白 ⇒ 拒）/ 撤回（任意态 → 已废弃），事务包裹；归档 = 软删除。
 *  可选 `evidence` 参：传值 = 追加缺省（§13.9——旧空直写 / 旧非空拼 `旧｜新`）、`evidenceReplace: true`
 *  同传 = 整段替换；勾销 / 追认 / 撤回三径同携（写值落行，内容不判）；两拒面（旗独传 @值计算 ∥
 *  新值空白 @追认门后）见 `evidenceValue` / `assertEvidenceValue`。
 *  判序（同函数体同层，§13.9）：目标集判 → 行取 → 源态判 → 值计算 → 追认门（原样——判**结果值**缺 /
 *  全空白 ⇒ 拒，文案逐字不变）→ 拒面②（新值空白）→ UPDATE（LEDGER.md §3 收口两源）。**单行形**
 *  （`id`）——逐行落笔 = `applyRowClose`。 */
export function ledgerClose({ cwd, id, status, evidence, evidenceReplace }) {
  if (status !== "已核销" && status !== "已废弃") throw new Error(`ledgerClose：目标态 ${status} ∉ {已核销, 已废弃}`)
  const db = openLedger(cwd, { create: true })
  try {
    db.exec("BEGIN")
    try {
      const row = db.prepare("SELECT * FROM items WHERE id = ?").get(id)
      if (!row) throw new Error(`ledgerClose：行 ${id} 不存在`)
      const out = applyRowClose(db, row, status, evidence, evidenceReplace)
      db.exec("COMMIT")
      return out
    } catch (e) { db.exec("ROLLBACK"); throw e }
  } finally { db.close() }
}

// ── 批级批量迁移与结算（设计档 §3.3 · P1 · AC-M2-26 ∥ AC-M2-27）────────────────

/** `batch` 入参自身门（设计档 §3.3 · fail-closed）：值自身须**可解析**（含非空文件部分）∧ 解析后批档
 *  **在盘** ⇒ 否则拒（零写）。判的是**本笔指名**的那一笔——与 §6.1 臂② 同一律、不同字段（§6.2 归批
 *  门判结果行存在性 + 本笔新指名，本门判 `batch` 入参自身）。无匹配行 ⇒ 不拒（`applied = []`）。
 *  @returns {string} 批档绝对路径（解析基准 = `base`）
 */
function assertBatchArg(fnName, base, batch) {
  const part = filePartOf(batch)
  const hit = part === "" ? { ok: false, abs: "" } : resolveDeclaredRef(base, part)
  if (!hit.ok) throw new Error(`${fnName}：batch 不可解析或不在盘（${batch}）`)
  return hit.abs
}

/** 批 → 行集（选行**单源** · 设计档 §3.3）：`task_book` 文件部分经 `resolveDeclaredRef` 解析为与批档
 *  **同一绝对路径**的行（任意状态、含归档态）。判据 = 解析同址而非串等值（同批档三种指针写法并存——
 *  无后缀 / `§2` / `§1.5（括注）`，串等值会漏行）。 */
function resolveBatchRows(db, base, abs) {
  return db.prepare("SELECT * FROM items ORDER BY id").all()
    .filter((r) => { const part = filePartOf(r.task_book); return part !== "" && resolveDeclaredRef(base, part).abs === abs })
}

/** 批级批量迁移（设计档 §3.3）：`patch.status` 在场 ⇒ 逐行按既有迁移表重判；不在场 ⇒ **纯字段补丁**
 *  （`status` 零写、迁移表不判、`executor` 普通补丁语义——回执 `status` 键 = `null`）。
 *  **门拒 ≠ 事务失败**：逐行门（迁移表 / §6.1 写门 / evidence 门）抛错 ⇒ 本行捕获计入 `skipped`
 *  （`why` = 该门拒因文案原文），其余行照落；**事务级失败**（取写锁 / `COMMIT` 层）⇒ 整批 `ROLLBACK`
 *  并抛（零行改）——故「部分落地」只由逐行门拒产生，「中途失败」不留半批。
 *  `BEGIN IMMEDIATE`：写锁一次先把（逐行不升级锁 ⇒ 事务级失败在首行之前即失败）。
 *  @returns {{batch: string, status: string|null, applied: number[], skipped: {id: number, from: string, why: string}[]}} */
export function ledgerUpdateBatch({ cwd, batch, patch = {}, executorSessionId }) {
  const db = openLedger(cwd, { create: true })
  try {
    const base = baseOf(cwd)
    const abs = assertBatchArg("ledgerUpdate", base, batch)
    db.exec("BEGIN IMMEDIATE")
    try {
      const applied = [], skipped = []
      for (const row of resolveBatchRows(db, base, abs)) {
        try { applied.push(applyRowUpdate(db, cwd, row, patch, executorSessionId).id) }
        catch (e) { skipped.push({ id: Number(row.id), from: row.status, why: String(e?.message ?? e) }) }
      }
      db.exec("COMMIT")
      return { batch, status: patch.status ?? null, applied, skipped }
    } catch (e) { db.exec("ROLLBACK"); throw e }
  } finally { db.close() }
}

/** 批级批量结算（设计档 §3.3）：**只销已到 `待核销` 的行**（勾销径）；`待讨论` / `待设计` ⇒ `skipped`
 *  逐行点名（**追认核销不入批量面**——追认须逐行结账依据，统一文本会造假账；转单行面），`在途` ⇒
 *  `skipped` 逐行点名（不可跳）。**归档态（`已核销` / `已废弃`）行 ⇒ 静默不计**（不入 `applied`、
 *  不入 `skipped`——归档行本非结算对象，点名会让每批重跑刷屏）。`evidence` 逐行追加同一文本
 *  （`evidenceValue` 同源）。回执 `status` 恒 `已核销`（批量形缺省 = 勾销单值；携则守卫已收窄为
 *  `{已核销}`——§3.2 `whenPresent`）。事务语义同 `ledgerUpdateBatch`。
 *  @returns {{batch: string, status: string, applied: number[], skipped: {id: number, from: string, why: string}[]}} */
export function ledgerCloseBatch({ cwd, batch, evidence, evidenceReplace }) {
  const status = "已核销"
  const db = openLedger(cwd, { create: true })
  try {
    const base = baseOf(cwd)
    const abs = assertBatchArg("ledgerClose", base, batch)
    db.exec("BEGIN IMMEDIATE")
    try {
      const applied = [], skipped = []
      for (const row of resolveBatchRows(db, base, abs)) {
        if (row.status === "已核销" || row.status === "已废弃") continue // 归档态静默不计
        if (row.status !== "待核销") {
          const why = row.status === "在途" ? "ledgerClose：在途不可跳（须先 待核销）" : "ledgerClose：追认核销不入批量面（转单行 close）"
          skipped.push({ id: Number(row.id), from: row.status, why })
          continue
        }
        try { applied.push(applyRowClose(db, row, status, evidence, evidenceReplace).id) }
        catch (e) { skipped.push({ id: Number(row.id), from: row.status, why: String(e?.message ?? e) }) }
      }
      db.exec("COMMIT")
      return { batch, status, applied, skipped }
    } catch (e) { db.exec("ROLLBACK"); throw e }
  } finally { db.close() }
}

// ── 指针判据重锚面（设计档 §7.1 · B 读数 ∥ C 收口重锚 · 台账 #1550）────────────────

/** 重锚取行集（设计档 §6.2——`待核销` 属已落只待结账，不取：对它写「须另起批次接手」失实，且核销零触指针）。 */
const REANCHOR_STATUSES = ["待讨论", "待设计", "在途"]

/** 本批行集（只读，任意状态——设计档 §7.1）：批身份单源 = `resolveBatchRows` 解析同址（零二写）；
 *  逐行携读数 `taskBookOnDisk`（不入库、不入 `DATA_COLUMNS`）。`batch` 不可解析 ∥ 无根 ⇒ 抛（同族
 *  `assertBatchArg` 形）；库不在 ⇒ 空集。`cwd` 口径 = 批档所属项目根（§6.2 `cwd` 基准——不用会话锚）。 */
export function ledgerBatchRows({ cwd, batch } = {}) {
  const derived = cwd == null ? null : resolveLedgerRoot(cwd)
  if (!derived) throw new Error(`ledgerBatchRows：批档所属项目根不可推导（${cwd ?? "（缺 cwd）"}）`)
  const base = derived.root
  const abs = assertBatchArg("ledgerBatchRows", base, batch) // 失败语义先于「库不在 ⇒ 空集」（不可解析就是不可解析）
  const db = openLedger(base, { readOnly: true })
  if (!db) return []
  try {
    return resolveBatchRows(db, base, abs).map((r) => ({ ...r, taskBookOnDisk: pointerOnDisk(r, base) }))
  } finally { db.close() }
}

/** 收口重锚单源（写命令，主 agent 面——设计档 §6.2 · C · AC-M2-30）：取本批未落行（`REANCHOR_STATUSES`）→
 *  现值已 `条件` ⇒ 零写跳过（幂等）；`认账不排期` 零触（政策判断归行主人）→ 逐行改 `trigger = 条件` + 复启句
 *  （`原批 <批名> 已收口，须另起批次接手`）落 `resume_when`；该列现值非空（行主条件句在册）⇒ **不覆盖**、
 *  复句追加 `evidence`。单事务：任一步失败 ⇒ 整集 `ROLLBACK`（零行改）。**不抛**——失败经返回形 `failed`
 *  报出（`null` 常态）；`cwd` 无根 ⇒ 不取行、不重锚（**不落兜底基准**——落了就是静默零命中）。
 *  `updated_at` 零触（机器重锚不是人工推进的痕迹——行龄读数照旧）。
 *  @returns {{batch:string, reanchored:{id:number,status:string,title:string,sentenceTo:"resume_when"|"evidence"}[], alreadyAnchored:{id:number,status:string,title:string}[], failed:string|null}} */
export function ledgerReanchorBatch({ cwd, batch } = {}) {
  const failedResult = (why) => ({ batch, reanchored: [], alreadyAnchored: [], failed: why })
  const derived = cwd == null ? null : resolveLedgerRoot(cwd)
  if (!derived) return failedResult("批档所属项目根不可推导")
  const base = derived.root
  let db
  try { db = openLedger(base) } catch (e) { return failedResult(String(e?.message ?? e)) } // 库不可开 ⇒ 零写报因
  if (!db) return { batch, reanchored: [], alreadyAnchored: [], failed: null } // 库不在 ⇒ 零行可锚
  try {
    let abs
    try { abs = assertBatchArg("ledgerReanchorBatch", base, batch) } catch (e) { return failedResult(String(e?.message ?? e)) }
    const sentence = `原批 ${filePartOf(batch)} 已收口，须另起批次接手`
    try {
      db.exec("BEGIN IMMEDIATE")
      const reanchored = [], alreadyAnchored = []
      for (const row of resolveBatchRows(db, base, abs)) {
        if (!REANCHOR_STATUSES.includes(row.status)) continue
        if (row.trigger === "认账不排期") continue
        const face = { id: Number(row.id), status: row.status, title: row.title }
        if (row.trigger === "条件") { alreadyAnchored.push(face); continue }
        const kept = row.resume_when != null && String(row.resume_when).trim() !== ""
        const nextEvidence = kept ? evidenceValue("ledgerReanchorBatch", row.evidence, sentence, false) : row.evidence
        db.prepare("UPDATE items SET trigger = ?, resume_when = ?, evidence = ? WHERE id = ?")
          .run("条件", kept ? row.resume_when : sentence, nextEvidence, row.id)
        reanchored.push({ ...face, sentenceTo: kept ? "evidence" : "resume_when" })
      }
      db.exec("COMMIT")
      return { batch, reanchored, alreadyAnchored, failed: null }
    } catch (e) {
      try { db.exec("ROLLBACK") } catch { /* 事务未开 / 已结 */ }
      return failedResult(String(e?.message ?? e))
    }
  } finally { db.close() }
}
