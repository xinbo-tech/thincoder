/**
 * routes.mjs — 团队台账控制台面四端点（`/api/ledger*`；`ledger/LEDGER.md` §5 ∥ `gateway/API.md` §2.10；
 * team-ledger 批——KD-SV-142 薄适配）。
 *
 * 判权 = 会话（`requireSession`）+ 项目能力矩阵（KD-SV-143——语义单源 = `items.mjs`）：列表携 `repos[]`
 * （可见项目 + `canWrite` 读数——筛选 / 新建选单 / 行写权的渲法源单源）；建面三态（父裁 2026-10-13）= 仓不存
 * 400 人话 ∥ 仓存无 `can.view` 404 不辨 ∥ 可见无 `can.write` 403；直取不可见 ⇒ 404 不辨。审计 = `ledger_event`
 * （四 kind——`surface:"console"`）。错误形零新码（400/401/403/404 沿用）。
 */
import { sendJson } from "../gateway/errors.mjs"
import { readJsonBody } from "../gateway/server.mjs"
import { requireSession } from "../accounts/session.mjs"
import { closeItem, createItem, itemViewOf, listItems, normalizeFilters, recordLedgerEvent, updateItem, visibleRepos } from "./items.mjs"

/** 查询串三筛（缺省 / 空白 ⇒ 不过滤；`status` 枚举外 / `repo` 形错 ⇒ 400——归一单源 = `items.mjs`）。 */
function filtersOf(req) {
  const params = new URL(req.url, "http://localhost").searchParams
  return normalizeFilters({ repo: params.get("repo"), status: params.get("status"), owner: params.get("owner") })
}

/** 注册控制台面四路由（§2.10 前四行）：列表（含 `repos[]`）∥ 新建 ∥ 编辑 ∥ 收口/撤回。 */
export function registerLedgerRoutes(routes, { db } = {}) {
  if (!db) throw new Error("registerLedgerRoutes：缺少 db")

  // 列表（三筛 + 能力矩阵过滤——非成员零出现；`repos[]` = 控制台渲法源单源）
  routes.add("GET", "/api/ledger", (req, res) => {
    const { member } = requireSession(db, req)
    const filters = filtersOf(req)
    const { items, total } = listItems(db, { member, ...filters })
    sendJson(res, 200, { items, repos: visibleRepos(db, member), total })
  })

  // 新建（`status` 恒 待讨论；仓须为可见可写项目——未登记 ⇒ 400 人话）
  routes.add("POST", "/api/ledger", async (req, res) => {
    const { member } = requireSession(db, req)
    const body = await readJsonBody(req)
    const row = createItem(db, { member, input: body })
    recordLedgerEvent(db, { member, kind: "create", id: row.id, repo: row.repo, surface: "console" })
    sendJson(res, 200, { item: itemViewOf(db, member, row) })
  })

  // 编辑（title ∥ detail ∥ owner ∥ status——迁移表合法后继；仓不可改；归档行 ⇒ 400）
  routes.add("PATCH", "/api/ledger/:id", async (req, res, ctx) => {
    const { member } = requireSession(db, req)
    const body = await readJsonBody(req)
    const row = updateItem(db, { member, id: ctx.params.id, input: body })
    recordLedgerEvent(db, { member, kind: "edit", id: row.id, repo: row.repo, surface: "console" })
    sendJson(res, 200, { item: itemViewOf(db, member, row) })
  })

  // 收口 / 撤回（`{ status ∈ 已核销 ∥ 已废弃 }`——核销只自 待核销（源态判在域模块）；审计 kind = close / withdraw）
  routes.add("POST", "/api/ledger/:id/close", async (req, res, ctx) => {
    const { member } = requireSession(db, req)
    const body = await readJsonBody(req)
    const row = closeItem(db, { member, id: ctx.params.id, input: body })
    recordLedgerEvent(db, { member, kind: row.status === "已核销" ? "close" : "withdraw", id: row.id, repo: row.repo, surface: "console" })
    sendJson(res, 200, { item: itemViewOf(db, member, row) })
  })
}
