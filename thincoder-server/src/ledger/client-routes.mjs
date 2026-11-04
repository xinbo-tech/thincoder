/**
 * client-routes.mjs — 团队台账端侧面四端点（`/api/client/ledger*`；`ledger/LEDGER.md` §5 ∥ `gateway/API.md`
 * §2.10 端侧四行；team-ledger 批——KD-SV-142 薄适配）。
 *
 * 判权 = 登录 token（Bearer——复用 `requireApiKey`，与 `/v1` 同校验单源）+ 项目能力矩阵（同一域模块
 * `items.mjs`）；`repo` 收**端侧原文**（`git@host:org/repo.git` 等）——服务端归一（KD-SV-144 单源）。
 * 列表**无 `repos[]`**（端侧仓标记自动派生——§2.10）；审计同型（`surface:"client"`）。
 * 错误形零新码——401 `invalid_api_key`（无 / 无效 token 三态不区分）＋ 400/403/404 沿用。
 */
import { sendJson } from "../gateway/errors.mjs"
import { readJsonBody } from "../gateway/server.mjs"
import { requireApiKey } from "../gateway/routes.mjs"
import { closeItem, createItem, itemViewOf, listItems, normalizeFilters, recordLedgerEvent, updateItem } from "./items.mjs"

/** 查询串三筛（`repo` = 原文——归一同源 = `items.mjs`；缺省 / 空白 ⇒ 不过滤）。 */
function filtersOf(req) {
  const params = new URL(req.url, "http://localhost").searchParams
  return normalizeFilters({ repo: params.get("repo"), status: params.get("status"), owner: params.get("owner") })
}

/** 注册端侧面四路由（§2.10 后四行）：列表（无 `repos[]`）∥ 新建 ∥ 编辑 ∥ 收口/撤回。 */
export function registerClientLedgerRoutes(routes, { db } = {}) {
  if (!db) throw new Error("registerClientLedgerRoutes：缺少 db")

  // 列表（端侧 `scope` 缺省 = 当前仓——工具面派生 `repo` 参；不带参 = 全队跨仓）
  routes.add("GET", "/api/client/ledger", (req, res) => {
    const { member } = requireApiKey(db, req)
    const filters = filtersOf(req)
    const { items, total } = listItems(db, { member, ...filters })
    sendJson(res, 200, { items, total })
  })

  // 新建（`repo` = 端侧 origin 原文——服务端归一；三态：仓不存 ⇒ 400 人话 ∥ 存而无 `can.view` ⇒ 404 不辨 ∥ 可见无 `can.write` ⇒ 403——沿 `routes.mjs` 口径）
  routes.add("POST", "/api/client/ledger", async (req, res) => {
    const { member } = requireApiKey(db, req)
    const body = await readJsonBody(req)
    const row = createItem(db, { member, input: body })
    recordLedgerEvent(db, { member, kind: "create", id: row.id, repo: row.repo, surface: "client" })
    sendJson(res, 200, { item: itemViewOf(db, member, row) })
  })

  // 编辑（title ∥ detail ∥ owner ∥ status——迁移表合法后继；仓不可改；归档行 ⇒ 400）
  routes.add("PATCH", "/api/client/ledger/:id", async (req, res, ctx) => {
    const { member } = requireApiKey(db, req)
    const body = await readJsonBody(req)
    const row = updateItem(db, { member, id: ctx.params.id, input: body })
    recordLedgerEvent(db, { member, kind: "edit", id: row.id, repo: row.repo, surface: "client" })
    sendJson(res, 200, { item: itemViewOf(db, member, row) })
  })

  // 收口 / 撤回（`{ status ∈ 已核销 ∥ 已废弃 }`——核销只自 待核销（源态判在域模块）；审计 kind = close / withdraw）
  routes.add("POST", "/api/client/ledger/:id/close", async (req, res, ctx) => {
    const { member } = requireApiKey(db, req)
    const body = await readJsonBody(req)
    const row = closeItem(db, { member, id: ctx.params.id, input: body })
    recordLedgerEvent(db, { member, kind: row.status === "已核销" ? "close" : "withdraw", id: row.id, repo: row.repo, surface: "client" })
    sendJson(res, 200, { item: itemViewOf(db, member, row) })
  })
}
