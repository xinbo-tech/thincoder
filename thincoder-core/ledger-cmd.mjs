/**
 * ledger-cmd.mjs — 台账命令族（查询 = 只读全角色 / 写 = 仅主 agent 装配）+ 工具定义
 * （M2 模块拆分件——设计档 docs/core/design/modules/ENGINEERING-MODE-V2-MODULE-LEDGER.md §2.3 拆分计划）。
 *
 * 接线（设计档 §2.2 命令面接线）：查询命令 ← tools/index.mjs（assembleBuiltinTools 全角色面）；
 * 写命令 ← agent/family-tools.mjs（assembleFamilyTools 的 depthOnly 分支）——一律**动态 import** 本模块链
 * （ledger-db.mjs 静态 import node:sqlite ⇒ 消费侧静态 import 会破 W8 契约②）。
 */
import { statSync } from "node:fs"
import { resolve } from "node:path"
import { ALLOWED_MIGRATIONS, nowIso, openLedger, PENDING_STATUSES } from "./ledger-db.mjs"
import { resolveProjectRoot } from "./manifest.mjs"

/** 查询（只读，全角色）：SELECT 行集（status/kind/board 过滤，缺省 = 全部行；id 升序）。库不在 = 空账。 */
export function ledgerQuery({ cwd, status = null, kind = null, board = null } = {}) {
  const db = openLedger(cwd)
  if (!db) return []
  try {
    const where = [], args = []
    if (status) { where.push("status = ?"); args.push(status) }
    if (kind) { where.push("kind = ?"); args.push(kind) }
    if (board) { where.push("board = ?"); args.push(board) }
    return db.prepare(`SELECT * FROM items${where.length ? ` WHERE ${where.join(" AND ")}` : ""} ORDER BY id`).all(...args)
  } finally { db.close() }
}

/** 计数单源（只读，全角色）：COUNT(*) WHERE 未决四态——替代 v1 md 计数面（AC-M2-3）。库不在 = 0。 */
export function ledgerCount({ cwd } = {}) {
  const db = openLedger(cwd)
  if (!db) return 0
  try {
    const row = db.prepare(`SELECT COUNT(*) AS n FROM items WHERE status IN (${PENDING_STATUSES.map(() => "?").join(",")})`).get(...PENDING_STATUSES)
    return Number(row.n)
  } finally { db.close() }
}

/** 路径 = 存在的**档**？（目录 / 缺失 → false——写门存在性判据用）。 */
const isFile = (p) => { try { return statSync(p).isFile() } catch { return false } }

/** 写门·指针存在性（设计档 §6.1 · 台账 #38 · AC-M2-9）：写命令落盘前判**结果行**——`status ∈
 *  {在途, 待核销}` 且 `task_book` 非空 ⇒ 文件部分（首个 `§` 前子串，trim）须经基准 `resolve(base, …)`
 *  指向存在的档；缺文件部分（`§2` / 全空白）⇒ 拒；不在册 / 非文件 ⇒ 拒（throw，行不变）。
 *  判位与迁移表判同层（落盘前）；文案前缀 = 调用函数名（与同函数既有两条文案同款）。
 *  基准 `base` = **与台账库关联键同源**（2026-09-18 fix 轮 · O1 收正）：`resolveProjectRoot(cwd) ??
 *  resolve(cwd ?? ".")`——同表达式见 `ledger-db.mjs` `ledgerDbPath`；容器根会话（锚 cwd 下唯一注册
 *  子仓 P）与子仓会话 ⇒ 库键与指针基准同取 P（同库同基准；原实现 `resolve(cwd, …)` = 原始 cwd 会误拒）。 */
function assertTaskBookGate(cwd, fnName, status, taskBook) {
  if (status !== "在途" && status !== "待核销") return
  if (taskBook == null || taskBook === "") return
  const part = String(taskBook).split("§")[0].trim()
  if (!part) throw new Error(`${fnName}：task_book 不可解析（缺文件部分）：${taskBook}`)
  const base = resolveProjectRoot(cwd) ?? resolve(cwd ?? ".")
  const abs = resolve(base, part)
  if (!isFile(abs)) throw new Error(`${fnName}：task_book 指向的档不存在：${taskBook}（解析 = ${abs}）`)
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
 *  优先级 = patch 显式 > 自动语义（进在途 = executorSessionId / 出在途 = NULL）> 行现值兜底 > NULL。 */
function resolveExecutorTarget(row, to, patch, executorSessionId) {
  if (row.status === "待设计" && to === "在途") {
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
    const nextTaskBook = patch.task_book ?? row.task_book
    assertTaskBookGate(cwd, "ledgerUpdate", to, nextTaskBook) // 判序：迁移表判 → 本门 → UPDATE
    const nextExecutor = resolveExecutorTarget(row, to, patch, executorSessionId)
    const now = nowIso()
    db.prepare(`UPDATE items SET status = ?, title = ?, board = ?, req_doc = ?, task_book = ?, evidence = ?, trigger = ?, executor = ?, updated_at = ? WHERE id = ?`)
      .run(to, patch.title ?? row.title, patch.board ?? row.board, patch.req_doc ?? row.req_doc, nextTaskBook, patch.evidence ?? row.evidence, patch.trigger ?? row.trigger, nextExecutor, now, id)
    return { id }
  } finally { db.close() }
}

/** 收口（写命令，仅主 agent）：勾销（待核销 → 已核销）/ 撤回（任意态 → 已废弃），事务包裹；归档 = 软删除。 */
export function ledgerClose({ cwd, id, status }) {
  if (status !== "已核销" && status !== "已废弃") throw new Error(`ledgerClose：目标态 ${status} ∉ {已核销, 已废弃}`)
  const db = openLedger(cwd, { create: true })
  try {
    db.exec("BEGIN")
    try {
      const row = db.prepare("SELECT * FROM items WHERE id = ?").get(id)
      if (!row) throw new Error(`ledgerClose：行 ${id} 不存在`)
      if (status === "已核销" && row.status !== "待核销") throw new Error(`ledgerClose：勾销仅限待核销（现态 ${row.status}）`)
      const now = nowIso()
      // 撤回（任意态 → 已废弃——含在途直撤）同步 executor = NULL（LEDGER.md §3.1 ④）；勾销路径 executor 已在离场迁移清空，零触碰
      db.prepare("UPDATE items SET status = ?, closed_at = ?, updated_at = ?, executor = ? WHERE id = ?").run(status, now, now, status === "已废弃" ? null : row.executor, id)
      db.exec("COMMIT")
      return { id, status }
    } catch (e) { db.exec("ROLLBACK"); throw e }
  } finally { db.close() }
}

// ── 工具定义（接线：查询 → tools/index.mjs 全角色面；写 → family-tools.mjs depthOnly 分支） ──

/** 工具 cwd 供值面（缺省 → 当前项目根）。 */
const cwdOf = (ctx) => ctx?.agent?.cwd ?? ctx?.cwd ?? process.cwd()

export const ledgerQueryTool = {
  name: "ledger_query",
  description: "台账查询（需求池 / 技术待办）——SQLite 行集，只读、全角色可用。未决四态 = 待讨论 / 待设计 / 在途 / 待核销；已核销 / 已废弃 = 归档态（软删除，行保留）。过滤参数缺省 = 全部行。",
  parameters: {
    type: "object",
    properties: {
      cwd: { type: "string", description: "项目根目录——台账按项目根关联存储于用户数据目录（工作树外、不进 git）。相对路径按当前工作目录解析；查/写别的项目请给绝对路径。缺省 = 当前会话项目根" },
      status: { type: "string", enum: ["待讨论", "待设计", "在途", "待核销", "已核销", "已废弃"], description: "按状态过滤（六态之一，缺省 = 不过滤）" },
      kind: { type: "string", enum: ["requirement", "tech_todo"], description: "按类别过滤" },
      board: { type: "string", description: "按归属板块过滤（需求档文档名）" },
    },
  },
  readonly: true,
  async execute(args, ctx) {
    return JSON.stringify(ledgerQuery({ cwd: args.cwd ?? cwdOf(ctx), status: args.status, kind: args.kind, board: args.board }), null, 2)
  },
}

export const ledgerCountTool = {
  name: "ledger_count",
  description: "台账计数单源：未决四态（待讨论 / 待设计 / 在途 / 待核销）COUNT(*)，只读、全角色可用。",
  parameters: {
    type: "object",
    properties: { cwd: { type: "string", description: "项目根目录——台账按项目根关联存储于用户数据目录（工作树外、不进 git）。相对路径按当前工作目录解析；查/写别的项目请给绝对路径。缺省 = 当前会话项目根" } },
  },
  readonly: true,
  async execute(args, ctx) {
    return JSON.stringify({ count: ledgerCount({ cwd: args.cwd ?? cwdOf(ctx) }) })
  },
}

export const ledgerAddTool = {
  name: "ledger_add",
  description: "台账新增条目（写命令，仅主 agent）——入待讨论（六态状态机入口）。kind = requirement（需求池）/ tech_todo（技术待办）；trigger = 归批 / 条件 / 认账不排期（可空）。",
  parameters: {
    type: "object",
    required: ["kind", "title"],
    properties: {
      cwd: { type: "string", description: "项目根目录——台账按项目根关联存储于用户数据目录（工作树外、不进 git）。相对路径按当前工作目录解析；查/写别的项目请给绝对路径。缺省 = 当前会话项目根" },
      kind: { type: "string", enum: ["requirement", "tech_todo"], description: "类别" },
      title: { type: "string", description: "条目标题" },
      board: { type: "string", description: "归属板块（需求档文档名，可空）" },
      req_doc: { type: "string", description: "需求档指针（可空）" },
      task_book: { type: "string", description: "任务书指针（可空；在途 / 待核销必填——咬合 CHECK）" },
      evidence: { type: "string", description: "最小证据行（可空）" },
      trigger: { type: "string", enum: ["归批", "条件", "认账不排期"], description: "技术待办触发（可空）" },
    },
  },
  readonly: false,
  async execute(args, ctx) {
    const { cwd, ...row } = args
    const id = ledgerAdd({ cwd: cwd ?? cwdOf(ctx), row })
    return JSON.stringify({ id, status: "待讨论" })
  },
}

export const ledgerUpdateTool = {
  name: "ledger_update",
  description: "台账更新条目（写命令，仅主 agent）——状态迁移按六态允许迁移表：待讨论→待设计 / 待设计→在途 / 在途→待核销 / 待核销→已核销 / 任意态→已废弃；表外迁移被拒。status 缺省 = 仅更新字段。",
  parameters: {
    type: "object",
    required: ["id"],
    properties: {
      cwd: { type: "string", description: "项目根目录——台账按项目根关联存储于用户数据目录（工作树外、不进 git）。相对路径按当前工作目录解析；查/写别的项目请给绝对路径。缺省 = 当前会话项目根" },
      id: { type: "number", description: "条目 id" },
      status: { type: "string", description: "目标状态（六态之一，缺省 = 不变）" },
      title: { type: "string", description: "标题（缺省 = 不变）" },
      board: { type: "string", description: "归属板块（缺省 = 不变）" },
      req_doc: { type: "string", description: "需求档指针（缺省 = 不变）" },
      task_book: { type: "string", description: "任务书指针（缺省 = 不变）" },
      evidence: { type: "string", description: "证据（缺省 = 不变）" },
      trigger: { type: "string", enum: ["归批", "条件", "认账不排期"], description: "触发（缺省 = 不变）" },
      executor: { type: "string", description: "执行者 sessionId（可选——接手改写归属用；缺省 = 按状态迁移语义：进在途自动写本会话 / 出在途自动清空 / 其余不变）" },
    },
  },
  readonly: false,
  async execute(args, ctx) {
    const { cwd, id, ...patch } = args
    let executorSessionId
    if (patch.executor === undefined) {
      // 动态 import——零新静态边（K-LX1）；工具层供值，核心函数保持参数注入纯函数
      const { getSessionId } = await import("./session-slots.mjs")
      executorSessionId = getSessionId()
    }
    return JSON.stringify(ledgerUpdate({ cwd: cwd ?? cwdOf(ctx), id, patch, executorSessionId }))
  },
}

export const ledgerCloseTool = {
  name: "ledger_close",
  description: "台账收口（写命令，仅主 agent）——勾销：待核销 → 已核销；撤回：任意态 → 已废弃。归档 = 软删除（写 closed_at，行保留）。",
  parameters: {
    type: "object",
    required: ["id", "status"],
    properties: {
      cwd: { type: "string", description: "项目根目录——台账按项目根关联存储于用户数据目录（工作树外、不进 git）。相对路径按当前工作目录解析；查/写别的项目请给绝对路径。缺省 = 当前会话项目根" },
      id: { type: "number", description: "条目 id" },
      status: { type: "string", enum: ["已核销", "已废弃"], description: "目标态（勾销 / 撤回）" },
    },
  },
  readonly: false,
  async execute(args, ctx) {
    return JSON.stringify(ledgerClose({ cwd: args.cwd ?? cwdOf(ctx), id: args.id, status: args.status }))
  },
}
