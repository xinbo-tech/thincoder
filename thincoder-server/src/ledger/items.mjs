/**
 * items.mjs — 团队台账域逻辑（`ledger/LEDGER.md` §3/§4/§7 ∥ `gateway/API.md` §2.10；team-ledger 批）。
 *
 * 单源面：入参归一（`normalizeAddress` 域外直引——KD-SV-144）∥ 六态迁移校验（`ALLOWED_MIGRATIONS` 沿本机
 * 台账逐字——KD-SV-141；存储独立、语汇同源）∥ 老化计算（`aged` = 未决四态 ∧ 行龄（`updated_at ?? created_at`）
 * > 30 天；缺 / 不可解析 ⇒ false——零假阳）∥ 可见 / 写权判定（消费 B2 能力矩阵 `can.view` / `can.write`——
 * KD-SV-143；未登记仓 ⇒ 400 人话 ∥ 仓存而无 `can.view` ⇒ 建面 **404 不辨**（不探存在性）∥ 不可见 ⇒ 列表零
 * 出现 ∥ 直取 404 不辨 ∥ 可见无写权 ⇒ 403）∥ 四动作 +
 * 审计行（§7——四 kind：create / edit / close / withdraw；`surface` = console ∥ client）。
 *
 * 两面族（KD-SV-142）：控制台 `/api/ledger*` ∥ 端侧 `/api/client/ledger*`——薄适配 = `routes.mjs` /
 * `client-routes.mjs`（校验 / 判权 / 序列化），语义单源在本档；错误形零新码（400/401/403/404——§2.10）。
 * 零 import 本机台账模块（KD-SV-145/D-TL2——上送 = agent 两步显式动作，零跨账代码路径）。
 */
import { recordAudit } from "../accounts/audit.mjs"
import { capabilitiesOf, listVisibleProjects, normalizeAddress, normalizeUsername } from "../project/projects.mjs"
import { HttpError } from "../gateway/errors.mjs"

/** 六态（§3——沿本机台账语汇；`已核销` / `已废弃` = 归档态）。 */
export const STATUSES = Object.freeze(["待讨论", "待设计", "在途", "待核销", "已核销", "已废弃"])

/** 未决四态（老化判据源——同本机台账 `PENDING_STATUSES`）。 */
export const PENDING_STATUSES = Object.freeze(["待讨论", "待设计", "在途", "待核销"])

/** 归档态（终态——再动 ⇒ 400；§4「终态」）。 */
export const ARCHIVED_STATUSES = Object.freeze(["已核销", "已废弃"])

/** 六态允许迁移表（沿本机台账 `ALLOWED_MIGRATIONS` 逐字——KD-SV-141）。表内「已核销 → 已废弃」被终态门
 *  先行拦下（团队账：归档 = 不再动——撤回须先于归档）。
 */
export const ALLOWED_MIGRATIONS = Object.freeze({
  "待讨论": ["待设计", "已废弃"],
  "待设计": ["在途", "已废弃"],
  "在途": ["待核销", "已废弃"],
  "待核销": ["已核销", "已废弃"],
  "已核销": ["已废弃"],
  "已废弃": [],
})

/** 形上限（§3 列面：标题 ≤200 ∥ 正文 ≤4000）。 */
export const TITLE_MAX = 200
export const DETAIL_MAX = 4000

/** 老化阈值（天——沿本机台账 `AGING_DAYS`）。 */
export const AGING_DAYS = 30

const DAY_MS = 24 * 60 * 60 * 1000

/** 写权人话（403——两面同措辞）。 */
const WRITE_FORBIDDEN_MESSAGE = "写团队账需项目读写权限（can.write）"

/** 「不可见」人话（404 不辨——沿 KD-SV-120 口径；条目不存与无权可见两态同措辞）。 */
const NOT_FOUND_MESSAGE = "条目不存在或不可见"

/** 「项目不可见」人话（404 不辨——措辞同 B2 项目面 `project/projects.mjs`；仓存而无 `can.view` ⇒ 与不存在不辨） */
const PROJECT_NOT_FOUND_MESSAGE = "项目不存在或不可见"

/** 归一站错误 ⇒ 400 人话（`normalizeAddress` / `normalizeUsername` 抛裸 Error——域内统一转 HttpError）。 */
function badRequest(fn) {
  try {
    return fn()
  } catch (e) {
    throw e instanceof HttpError ? e : new HttpError("invalid_request_error", e.message)
  }
}

const normalizeRepo = (raw) => badRequest(() => normalizeAddress(raw))
const normalizeOwner = (raw) => badRequest(() => normalizeUsername(raw))

/** 标题归一（trim 非空 ∥ ≤200）。 */
function normalizeTitle(raw) {
  const title = typeof raw === "string" ? raw.trim() : ""
  if (title === "") throw new HttpError("invalid_request_error", "标题不可为空（非空字符串）")
  if (title.length > TITLE_MAX) throw new HttpError("invalid_request_error", `标题超长（≤ ${TITLE_MAX} 字符；实长 ${title.length}）`)
  return title
}

/** 正文归一（可空 ∥ ≤4000；缺省 / `null` / 空串 ⇒ `null`——「未提供」与「清空」同判）。 */
function normalizeDetail(raw) {
  if (raw === undefined || raw === null) return null
  const detail = String(raw)
  if (detail.length > DETAIL_MAX) throw new HttpError("invalid_request_error", `正文超长（≤ ${DETAIL_MAX} 字符；实长 ${detail.length}）`)
  return detail === "" ? null : detail
}

/** 负责人归一（trim 非空 ∥ ≤64 ∥ 无 `/`——沿 B2 用户名形；不要求现存账号——KD-SV-116）。 */
function normalizeOwnerOrDefault(raw, member) {
  if (raw === undefined || raw === null || (typeof raw === "string" && raw.trim() === "")) return member.username
  return normalizeOwner(raw)
}

/**
 * 仓 × 能力矩阵（KD-SV-143）：仓 = 现存项目行（`projects.address` 归一同键）；项目缺（已删 ∥ 未登记）⇒
 * admin 恒可见可写（KD-SV-147）∥ 其余不可判（不可见）。出 = `{ project, caps }`（`caps.can` = 唯一消费面）。
 */
function repoCaps(db, member, repo) {
  const project = db.prepare("SELECT * FROM projects WHERE address = ?").get(repo)
  if (project) return { project, caps: capabilitiesOf(db, member, project) }
  const admin = member?.role === "admin"
  return { project: null, caps: { level: null, owner: false, admin, can: { view: admin, write: admin } } }
}

/** 逐行老化判真（§3：未决四态 ∧ 行龄 > 30 天；时间戳缺 / 不可解析 ⇒ false——零假阳，沿本机台账口径）。 */
export function agedOf(status, updatedAt, createdAt, now = Date.now()) {
  if (!PENDING_STATUSES.includes(status)) return false
  const stamp = updatedAt ?? createdAt
  if (stamp == null) return false
  const ms = Date.parse(String(stamp))
  return Number.isFinite(ms) && (now - ms) / DAY_MS > AGING_DAYS
}

/** 行形（§2.10——零 `repoName`：显示名 = 控制台 `repos[]` 回填；端侧展示 = 归地址）。 */
export function itemView(row, { canWrite, now = Date.now() }) {
  return {
    id: row.id,
    repo: row.repo,
    status: row.status,
    title: row.title,
    detail: row.detail,
    owner: row.owner,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    closedAt: row.closed_at,
    aged: agedOf(row.status, row.updated_at, row.created_at, now),
    canWrite: Boolean(canWrite),
  }
}

/** 单行出参（携 `aged` / `canWrite`——写动作回执与列表行同形，两面同源）。 */
export function itemViewOf(db, member, row, { now = Date.now() } = {}) {
  const { caps } = repoCaps(db, member, row.repo)
  return itemView(row, { canWrite: caps.can.write, now })
}

/** 条目取证 + 可见性门（KD-SV-143 / KD-SV-120）：不存 ∥ 不可见 ⇒ **404 不辨**；出 = `{ row, project, caps }`。 */
export function itemOr404(db, member, id) {
  const num = Number(id)
  const row = Number.isInteger(num) ? db.prepare("SELECT * FROM team_ledger_items WHERE id = ?").get(num) : undefined
  if (!row) throw new HttpError("not_found", NOT_FOUND_MESSAGE)
  const { project, caps } = repoCaps(db, member, row.repo)
  if (!caps.can.view) throw new HttpError("not_found", NOT_FOUND_MESSAGE)
  return { row, project, caps }
}

/** 写权门（403 人话——可见而后判写；不可见面已由 404 拦下）。 */
function requireWrite(caps) {
  if (!caps.can.write) throw new HttpError("forbidden", WRITE_FORBIDDEN_MESSAGE)
}

/** 三筛归一（§5）：`repo` 归一后精确匹配（形错 ⇒ 400）∥ `status` 枚举外 ⇒ 400 ∥ `owner` 用户名精确匹配
 *  （trim 后原样——形错零命中，不另判）。缺省 / 空白 ⇒ `null`（不过滤）。 */
export function normalizeFilters({ repo = null, status = null, owner = null } = {}) {
  const repoValue = typeof repo === "string" && repo.trim() !== "" ? normalizeRepo(repo) : null
  let statusValue = null
  if (typeof status === "string" && status.trim() !== "") {
    const text = status.trim()
    if (!STATUSES.includes(text)) throw new HttpError("invalid_request_error", `状态非法：${text}（取值 ∈ ${STATUSES.join(" ∥ ")}）`)
    statusValue = text
  }
  const ownerValue = typeof owner === "string" && owner.trim() !== "" ? owner.trim() : null
  return { repo: repoValue, status: statusValue, owner: ownerValue }
}

/** 列表（§5 读路径）：三筛 + 能力矩阵过滤（非成员零出现——KD-SV-143）；`total` = 过滤后计数（不设分页）。 */
export function listItems(db, { member, repo = null, status = null, owner = null, now = Date.now() } = {}) {
  const where = []
  const args = []
  if (repo !== null) {
    where.push("repo = ?")
    args.push(repo)
  }
  if (status !== null) {
    where.push("status = ?")
    args.push(status)
  }
  if (owner !== null) {
    where.push("owner = ?")
    args.push(owner)
  }
  const rows = db
    .prepare(`SELECT * FROM team_ledger_items ${where.length ? `WHERE ${where.join(" AND ")}` : ""} ORDER BY id`)
    .all(...args)
  const cache = new Map()
  const items = []
  for (const row of rows) {
    if (!cache.has(row.repo)) cache.set(row.repo, repoCaps(db, member, row.repo))
    const { caps } = cache.get(row.repo)
    if (!caps.can.view) continue
    items.push(itemView(row, { canWrite: caps.can.write, now }))
  }
  return { items, total: items.length }
}

/** `repos[]`（控制台渲法源——筛选 / 新建选单 / 行写权的单源）：可见项目 + 写权读数。
 *  可见性沿 B2 单源（`listVisibleProjects`——非成员零出现）；`canWrite` 逐项消费同一能力矩阵判定。 */
export function visibleRepos(db, member) {
  return listVisibleProjects(db, member).map((view) => {
    const project = db.prepare("SELECT * FROM projects WHERE id = ?").get(view.id)
    return { address: view.address, displayName: view.displayName, canWrite: capabilitiesOf(db, member, project).can.write }
  })
}

/**
 * 建（§4 写路径——直写 ∥ 零门槛）：`{ repo, title, detail?, owner? }` ⇒ 行落库（`status` 恒 `待讨论`）。
 * 仓三态（父裁 2026-10-13——沿 KD-SV-143 ∥ B2 §2.9 口径）：仓**不存** ⇒ 400 人话（加仓 = admin 专属，
 * AC-44①）∥ 仓存而**无 `can.view`** ⇒ **404 不辨**（不探存在性——措辞同 B2 项目面）∥ 可见而**无 `can.write`**
 * ⇒ 403。`owner` 缺省 = 创建者（`created_by` / `created_at` 服务端填）。出 = 行（raw——出参视图归调用面）。
 */
export function createItem(db, { member, input = {}, now = Date.now() } = {}) {
  const body = input !== null && typeof input === "object" && !Array.isArray(input) ? input : {}
  if (!Object.hasOwn(body, "repo")) throw new HttpError("invalid_request_error", "建条目须携 repo（仓标记——端侧自动派生 ∥ 控制台选自可见项目）")
  const repo = normalizeRepo(body.repo)
  const project = db.prepare("SELECT * FROM projects WHERE address = ?").get(repo)
  if (!project) throw new HttpError("invalid_request_error", `该仓未登记——请先在控制台登记项目：${repo}`)
  const caps = capabilitiesOf(db, member, project)
  if (!caps.can.view) throw new HttpError("not_found", PROJECT_NOT_FOUND_MESSAGE) // 仓存而无 view ⇒ 404 不辨：措辞同项目面不存态（`project/projects.mjs`——「项目不存在或不可见」）
  if (!caps.can.write) throw new HttpError("forbidden", WRITE_FORBIDDEN_MESSAGE)
  const title = normalizeTitle(body.title)
  const detail = normalizeDetail(body.detail)
  const owner = normalizeOwnerOrDefault(body.owner, member)
  const at = new Date(now).toISOString()
  const info = db
    .prepare(`INSERT INTO team_ledger_items (repo, status, title, detail, owner, created_by, created_at, updated_at, closed_at)
      VALUES (?, '待讨论', ?, ?, ?, ?, ?, ?, NULL)`)
    .run(repo, title, detail, owner, member.username, at, at)
  return db.prepare("SELECT * FROM team_ledger_items WHERE id = ?").get(Number(info.lastInsertRowid))
}

/**
 * 改（§4）：`{ title?, detail?, owner?, status? }` 至少一件；`status` 值域 = 迁移表合法后继（非法 ⇒ 400 人话）；
 * 仓不可改（记账键——§4）；归档行再动 ⇒ 400（终态）；`updated_at` 随写（迁归档态同拍 `closed_at`）。
 * 出 = 行（raw）。
 */
export function updateItem(db, { member, id, input = {}, now = Date.now() } = {}) {
  const { row, caps } = itemOr404(db, member, id)
  requireWrite(caps)
  if (ARCHIVED_STATUSES.includes(row.status)) throw new HttpError("invalid_request_error", `条目已归档（${row.status}）——不可再改（行保留；撤回须先于归档）`)
  const body = input !== null && typeof input === "object" && !Array.isArray(input) ? input : {}
  if (Object.hasOwn(body, "repo")) throw new HttpError("invalid_request_error", "仓不可改（记账键——确需改 ⇒ 撤回后重建）")
  const editable = ["title", "detail", "owner", "status"]
  const unknown = Object.keys(body).filter((key) => !editable.includes(key))
  if (unknown.length > 0) throw new HttpError("invalid_request_error", `未知字段：${unknown.join(" ∥ ")}（可改 = title ∥ detail ∥ owner ∥ status）`)
  const present = editable.filter((key) => Object.hasOwn(body, key))
  if (present.length === 0) throw new HttpError("invalid_request_error", "无可改项（title ∥ detail ∥ owner ∥ status 至少一件）")
  let nextStatus = row.status
  if (Object.hasOwn(body, "status")) {
    const target = body.status
    if (!STATUSES.includes(target)) throw new HttpError("invalid_request_error", `状态非法：${JSON.stringify(target ?? null)}（取值 ∈ ${STATUSES.join(" ∥ ")}）`)
    if (target !== row.status && !(ALLOWED_MIGRATIONS[row.status] ?? []).includes(target)) {
      throw new HttpError("invalid_request_error", `非法状态迁移：${row.status} → ${target}（不在允许迁移表）`)
    }
    nextStatus = target
  }
  const title = Object.hasOwn(body, "title") ? normalizeTitle(body.title) : row.title
  const detail = Object.hasOwn(body, "detail") ? normalizeDetail(body.detail) : row.detail
  const owner = Object.hasOwn(body, "owner") ? normalizeOwner(body.owner) : row.owner // 改面无「缺省 = 自己」（建面专属）——空 ⇒ 400 人话
  const at = new Date(now).toISOString()
  const closedAt = ARCHIVED_STATUSES.includes(nextStatus) ? row.closed_at ?? at : row.closed_at
  db.prepare("UPDATE team_ledger_items SET status = ?, title = ?, detail = ?, owner = ?, updated_at = ?, closed_at = ? WHERE id = ?").run(
    nextStatus,
    title,
    detail,
    owner,
    at,
    closedAt,
    row.id,
  )
  return db.prepare("SELECT * FROM team_ledger_items WHERE id = ?").get(row.id)
}

/**
 * 收口 / 撤回（§4）：`{ status ∈ 已核销 ∥ 已废弃 }`——`已核销` **只自 `待核销`**（勾销）；其余现态
 * （`待讨论` / `待设计` / `在途`）⇒ 400 人话（点名现态 + 出路句）。本面无 `待讨论 → 在途` 边，故出路统一写作
 * 「先 PATCH 推进到 待核销」——三态都成立，不另造一句。`已废弃` = 任意未归档态（软删除——行保留）。
 * 归档行 ⇒ 400（终态）。出 = 行（raw）。
 */
export function closeItem(db, { member, id, input = {}, now = Date.now() } = {}) {
  const body = input !== null && typeof input === "object" && !Array.isArray(input) ? input : {}
  const target = body.status
  if (target !== "已核销" && target !== "已废弃") {
    throw new HttpError("invalid_request_error", `目标态须为 已核销 ∥ 已废弃（收到 ${JSON.stringify(target ?? null)}）`)
  }
  const { row, caps } = itemOr404(db, member, id)
  requireWrite(caps)
  if (ARCHIVED_STATUSES.includes(row.status)) throw new HttpError("invalid_request_error", `条目已归档（${row.status}）——不可再动（行保留）`)
  if (target === "已核销" && row.status !== "待核销") {
    throw new HttpError("invalid_request_error", `核销仅限 待核销（现态 ${row.status}）：先 PATCH 推进到 待核销，再收口`)
  }
  const at = new Date(now).toISOString()
  db.prepare("UPDATE team_ledger_items SET status = ?, updated_at = ?, closed_at = ? WHERE id = ?").run(target, at, at, row.id)
  return db.prepare("SELECT * FROM team_ledger_items WHERE id = ?").get(row.id)
}

/** 审计行（§7）：型 = `ledger_event`；四 kind = create ∥ edit ∥ close ∥ withdraw；target = `ledger:<id>`
 *  可读形；detail = `{ kind, id, repo, surface }`（`surface` = console ∥ client——两面写入可辨）。 */
export function recordLedgerEvent(db, { member, kind, id, repo, surface }) {
  return recordAudit(db, {
    type: "ledger_event",
    actor: member.name,
    actorId: member.id,
    target: `ledger:${id}`,
    detail: { kind, id, repo, surface },
  })
}
