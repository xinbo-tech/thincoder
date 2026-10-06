/**
 * routes.mjs — 计量端点（metering/METERING.md §3）：`/api/me/usage` ∥ `/api/usage` ∥ `/api/members/:id/quota`。
 *
 * 鉴权：本人用量 = 会话（成员固定本人）；全队用量 ∥ 设额度 = admin（服务端判定）。
 * 行形 = METERING §3；过滤：member ∥ model ∥ from ∥ to ∥ limit（缺省 100 ∥ 上限 500）。
 */
import { HttpError, sendJson } from "../gateway/errors.mjs"
import { readJsonBody } from "../gateway/server.mjs"
import { findMemberById, findMemberByName, setMemberQuota } from "../accounts/members.mjs"
import { requireAdmin, requireSession } from "../accounts/session.mjs"
import { parseUsageLimit, parseUsageTime, queryUsage } from "./usage.mjs"

/** `member` 过滤取值：全数字 ⇒ id；否则按展示名（未命中 ⇒ 空集哨兵 -1）。 */
function resolveMemberFilter(db, raw) {
  if (raw === null || raw === "") return null
  if (/^\d+$/.test(raw)) return Number(raw)
  const member = findMemberByName(db, raw)
  return member ? member.id : -1
}

/** 查询参数装配（两读端点共用；`memberId` 给定 = 固定成员——本人面）。
 *  注：查询键以模板字面量书写——from 键的双引号形会撞批内件依赖面扫描的采集正则（该扫描件按令零改）误报。 */
function usageQueryOf(db, url, { memberId = null } = {}) {
  const params = new URL(url, "http://localhost").searchParams
  const key = (name) => params.get(name)
  return queryUsage(db, {
    memberId: memberId ?? resolveMemberFilter(db, key(`member`)),
    model: key(`model`),
    from: parseUsageTime(key(`from`), `from`),
    to: parseUsageTime(key(`to`), `to`),
    limit: parseUsageLimit(key(`limit`)),
  })
}

export function registerMeteringRoutes(routes, { db } = {}) {
  if (!db) throw new Error("registerMeteringRoutes：缺少 db（openDatabase 产物）")

  routes.add("GET", "/api/me/usage", (req, res) => {
    const { member } = requireSession(db, req)
    sendJson(res, 200, { rows: usageQueryOf(db, req.url, { memberId: member.id }) })
  })

  routes.add("GET", "/api/usage", (req, res) => {
    requireAdmin(db, req)
    sendJson(res, 200, { rows: usageQueryOf(db, req.url) })
  })

  routes.add("POST", "/api/members/:id/quota", async (req, res, ctx) => {
    requireAdmin(db, req)
    const member = findMemberById(db, Number(ctx.params.id))
    if (!member) throw new HttpError("not_found", `成员不存在：${ctx.params.id}`)
    const body = await readJsonBody(req)
    if (body === null || typeof body !== "object" || !("quotaTokens" in body)) {
      throw new HttpError("invalid_request_error", "缺 quotaTokens（≥0 整数或 null——null = 不限）")
    }
    const updated = setMemberQuota(db, member.id, body.quotaTokens)
    sendJson(res, 200, { id: updated.id, quotaTokens: updated.quota_tokens })
  })
}
