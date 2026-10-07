/**
 * ledger-cmd.mjs — 台账核心函数档（查询 = 只读全角色 / 写 = 仅主 agent 装配）。
 * 工具定义 + 工具层参数守卫 = 拆分件 `thincoder-core/ledger-tools.mjs`（2026-09-28 守卫族微修批 ·
 * 台账 #473——纯搬移、语义零变；拆分触发 = 本档 298 行贴 300 顾问线，本批读面守卫增量必越线）；
 * 核函数（`ledgerQuery` / `ledgerCount` / `ledgerAdd` / `ledgerUpdate` / `ledgerClose`）留本档，
 * 工具档消费之。
 *
 * 接线（设计档 §2.2 命令面接线）：族出口 = `ledger.mjs`（re-export 两源——KD-M2-3）；查询命令 ←
 * tools/index.mjs（assembleBuiltinTools 全角色面）；写命令 ← agent/family-tools.mjs（assembleFamilyTools
 * 的 depthOnly 分支）——一律**动态 import** 本模块链（ledger-db.mjs 静态 import node:sqlite ⇒
 * 消费侧静态 import 会破 W8 契约②）。
 */
import { resolve } from "node:path"
import { ALLOWED_MIGRATIONS, nowIso, openLedger, PENDING_STATUSES, AGING_DAYS } from "./ledger-db.mjs"
import { resolveProjectRoot } from "./manifest.mjs"
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

/** 查询（只读，全角色）：SELECT 行集（status / kind / board / trigger 等值过滤并取，缺省 = 全部行；id 升序）。
 *  库不在 = 空账。只读开库（readOnly 句柄 + 零 DDL/ALTER——read-data-interface 批 FR2③）；库档非台账库 ⇒ 空账。
 *  逐行携计算字段 `aged: boolean`（§13.4——不入库、不入导出白名单 DATA_COLUMNS）；`trigger` 过滤
 *  仅三枚举等值（`NULL` 不过滤——批面未列，§13.2）；`now` = 注入缝（确定性用例面）。 */
export function ledgerQuery({ cwd, status = null, kind = null, board = null, trigger = null, now = Date.now() } = {}) {
  const db = openLedger(cwd, { readOnly: true })
  if (!db) return []
  try {
    const where = [], args = []
    if (status) { where.push("status = ?"); args.push(status) }
    if (kind) { where.push("kind = ?"); args.push(kind) }
    if (board) { where.push("board = ?"); args.push(board) }
    if (trigger) { where.push("trigger = ?"); args.push(trigger) }
    const rows = db.prepare(`SELECT * FROM items${where.length ? ` WHERE ${where.join(" AND ")}` : ""} ORDER BY id`).all(...args)
    return rows.map((r) => ({ ...r, aged: isRowAged(r, now) }))
  } finally { db.close() }
}

/** 计数单源（只读，全角色）：COUNT(*) WHERE 未决四态——替代 v1 md 计数面（AC-M2-3）。库不在 = 0。
 *  只读开库（同 ledgerQuery——零 DDL/ALTER）；库档非台账库 ⇒ 0。 */
export function ledgerCount({ cwd } = {}) {
  const db = openLedger(cwd, { readOnly: true })
  if (!db) return 0
  try {
    const row = db.prepare(`SELECT COUNT(*) AS n FROM items WHERE status IN (${PENDING_STATUSES.map(() => "?").join(",")})`).get(...PENDING_STATUSES)
    return Number(row.n)
  } finally { db.close() }
}

/** 写门·指针存在性（设计档 §6.1 · 台账 #38 · AC-M2-10）：写命令落盘前判**结果行**——`status ∈
 *  {在途, 待核销}` ⇒ 判 `task_book`：`null`（缺指针）⇒ 拒（「必填」文案）；非 `null` ⇒ 文件部分
 *  （首个 `§` 前子串，trim）须经基准 `resolve(base, …)` 指向存在的档；缺文件部分（`§2` / 空串 /
 *  全空白）⇒ 拒；不在册 / 非文件 ⇒ 拒（throw，行不变）。
 *  判位与迁移表判同层（落盘前）；文案前缀 = 调用函数名（与同函数既有两条文案同款）。
 *  基准 `base` = **与台账库关联键同源**（2026-09-18 fix 轮 · O1 收正）：`resolveProjectRoot(cwd) ??
 *  resolve(cwd ?? ".")`——同表达式见 `ledger-db.mjs` `ledgerDbPath`；容器根会话（锚 cwd 下唯一注册
 *  子仓 P）与子仓会话 ⇒ 库键与指针基准同取 P（同库同基准；原实现 `resolve(cwd, …)` = 原始 cwd 会误拒）。
 *  #832 ∥ #834：声明源前缀形同判——判定单源 = `declaration.mjs` `resolveDeclaredRef`（① 仓根解析 →
 *  ② 声明源前缀解析序；同名多仓 ⇒ 声明序首者）——**与迁移旗（`ledger-migrate.mjs` `writeGateFlag`）
 *  同消费**；未声明 ∥ 声明根缺位 ∥ 目标档缺 ⇒ 照旧拒（既有拒绝面零改——判据本体 = §6.1 口径 1–4 逐字）。 */
function assertTaskBookGate(cwd, fnName, status, taskBook) {
  if (status !== "在途" && status !== "待核销") return
  if (taskBook == null) throw new Error(`${fnName}：task_book 必填（在途 / 待核销 须携任务书指针）`)
  const part = String(taskBook).split("§")[0].trim()
  if (!part) throw new Error(`${fnName}：task_book 不可解析（缺文件部分）：${taskBook}`)
  const base = resolveProjectRoot(cwd) ?? resolve(cwd ?? ".")
  const { ok, abs } = resolveDeclaredRef(base, part)
  if (!ok) throw new Error(`${fnName}：task_book 指向的档不存在：${taskBook}（解析 = ${abs}）`)
}

/** 新增（写命令，仅主 agent）：INSERT——入待讨论（六态状态机入口）。 */
export function ledgerAdd({ cwd, row }) {
  const db = openLedger(cwd, { create: true })
  try {
    // 结果行状态 = INSERT 硬编码「待讨论」⇒ 门当下恒不触发（两入口形态统一——为将来「add 带状态」留位）
    assertTaskBookGate(cwd, "ledgerAdd", "待讨论", row.task_book ?? null)
    const now = nowIso()
    const r = db.prepare(`INSERT INTO items (kind, status, title, board, req_doc, task_book, evidence, trigger, created_at, updated_at) VALUES (?, '待讨论', ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(row.kind, row.title, row.board ?? null, row.req_doc ?? null, row.task_book ?? null, row.evidence ?? null, row.trigger ?? null, now, now)
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

/** 更新（写命令，仅主 agent）：UPDATE——状态迁移前判允许迁移表（不在表内 → 拒，行不变）。
 *  executor 目标值随同一 UPDATE 落列（LEDGER.md §3.1）；executorSessionId = 调用会话（函数参数注入——K-LX1
 *  纯函数可测；工具层动态 import getSessionId() 供值，零新静态边）。 */
export function ledgerUpdate({ cwd, id, patch, executorSessionId }) {
  const db = openLedger(cwd, { create: true })
  try {
    const row = db.prepare("SELECT * FROM items WHERE id = ?").get(id)
    if (!row) throw new Error(`ledgerUpdate：行 ${id} 不存在`)
    const to = patch.status ?? row.status
    if (to !== row.status && !(ALLOWED_MIGRATIONS[row.status] ?? []).includes(to)) {
      throw new Error(`ledgerUpdate：迁移 ${row.status} → ${to} 不在允许迁移表`)
    }
    const nextExecutor = resolveExecutorTarget(row, to, patch, executorSessionId) // 判序：迁移表判 → 本语义（算 executor 目标值）
    const nextTaskBook = patch.task_book ?? row.task_book
    assertTaskBookGate(cwd, "ledgerUpdate", to, nextTaskBook) // → 写门 → UPDATE
    const now = nowIso()
    db.prepare(`UPDATE items SET status = ?, title = ?, board = ?, req_doc = ?, task_book = ?, evidence = ?, trigger = ?, executor = ?, updated_at = ? WHERE id = ?`)
      .run(to, patch.title ?? row.title, patch.board ?? row.board, patch.req_doc ?? row.req_doc, nextTaskBook, patch.evidence ?? row.evidence, patch.trigger ?? row.trigger, nextExecutor, now, id)
    return { id }
  } finally { db.close() }
}

/** 收口（写命令，仅主 agent）：核销两源（勾销：待核销 → 已核销；追认核销：待讨论 / 待设计 → 已核销，
 *  行 `evidence` 非空，缺 / 全空白 ⇒ 拒）/ 撤回（任意态 → 已废弃），事务包裹；归档 = 软删除。
 *  判序（同函数体同层）：目标集判 → 行取 → 源态判 → `evidence` 门 → UPDATE（LEDGER.md §3 收口两源）。
 *  可选 `evidence` 参（2026-10-07 批 ledger-tool · §13.1——一跳核销）：`nextEvidence = evidence ?? 行值`，
 *  追认门判**结果值**（缺 / 全空白 ⇒ 拒，文案逐字不变）；勾销 / 撤回路径同携（写值落行，内容不判）。 */
export function ledgerClose({ cwd, id, status, evidence }) {
  if (status !== "已核销" && status !== "已废弃") throw new Error(`ledgerClose：目标态 ${status} ∉ {已核销, 已废弃}`)
  const db = openLedger(cwd, { create: true })
  try {
    db.exec("BEGIN")
    try {
      const row = db.prepare("SELECT * FROM items WHERE id = ?").get(id)
      if (!row) throw new Error(`ledgerClose：行 ${id} 不存在`)
      const nextEvidence = evidence ?? row.evidence
      // 判序：源态判（核销仅三源——在途不可跳）→ 追认口 `evidence` 门（判结果值非空，缺 / 全空白 ⇒ 拒）
      if (status === "已核销" && !["待讨论", "待设计", "待核销"].includes(row.status)) throw new Error(`ledgerClose：核销仅限 待讨论 / 待设计 / 待核销（现态 ${row.status}）`)
      if (status === "已核销" && ["待讨论", "待设计"].includes(row.status) && (nextEvidence == null || String(nextEvidence).trim() === "")) throw new Error(`ledgerClose：追认核销须带 evidence（现态 ${row.status}）`)
      const now = nowIso()
      // 撤回（任意态 → 已废弃——含在途直撤）同步 executor = NULL（LEDGER.md §3.1 ④）；核销两源（勾销 / 追认）executor 零触碰（非在途出边）
      db.prepare("UPDATE items SET status = ?, closed_at = ?, updated_at = ?, executor = ?, evidence = ? WHERE id = ?").run(status, now, now, status === "已废弃" ? null : row.executor, nextEvidence, id)
      db.exec("COMMIT")
      return { id, status }
    } catch (e) { db.exec("ROLLBACK"); throw e }
  } finally { db.close() }
}
