/**
 * routes.mjs — 计量端点（metering/METERING.md §3）：`/api/me/usage` ∥ `/api/me/usage/summary`（本人报表——KD-SV-50）
 * ∥ `/api/usage` ∥ `/api/usage/summary` ∥ `/api/usage/export` ∥ `/api/members/:id/model-quotas`（分模型覆盖——键级合并）。
 *
 * 鉴权：本人用量（明细 ∥ 报表）= 会话（成员固定本人）；全队用量 ∥ 报表 ∥ 导出 ∥ 设覆盖 = admin（服务端判定）。
 * 行形 = METERING §3；过滤：member ∥ model ∥ endpoint ∥ from ∥ to ∥ limit（缺省 100 ∥ 上限 500——四读端点同门）；
 * 报表/导出与明细同源（同一过滤构建器——usage.mjs）；导出 = 服务端 CSV（英文表头 ∥ ISO ts ∥ RFC 4180 ∥ BOM）。
 */
import { HttpError, sendJson } from "../gateway/errors.mjs"
import { readJsonBody } from "../gateway/server.mjs"
import { findMemberById, findMemberByName, mergeMemberModelQuotas, parseModelQuotas } from "../accounts/members.mjs"
import { requireAdmin, requireSession } from "../accounts/session.mjs"
import { exportUsageRows, parseUsageEndpoint, parseUsageLimit, parseUsageTime, queryUsage, usageSummary } from "./usage.mjs"
import { memberUsageSummary } from "./report.mjs"

/** `member` 过滤取值：全数字 ⇒ id；否则按展示名（未命中 ⇒ 空集哨兵 -1）。 */
function resolveMemberFilter(db, raw) {
  if (raw === null || raw === "") return null
  if (/^\d+$/.test(raw)) return Number(raw)
  const member = findMemberByName(db, raw)
  return member ? member.id : -1
}

/** 查询参数表（URL → searchParams）。 */
function paramsOf(url) {
  return new URL(url, "http://localhost").searchParams
}

/** 过滤参数装配（四读端点共用；`memberId` 给定 = 固定成员——本人面）。
 *  注：查询键以模板字面量书写——from 键的双引号形会撞批内件依赖面扫描的采集正则（该扫描件按令零改）误报。 */
function usageFiltersOf(db, params, { memberId = null } = {}) {
  return {
    memberId: memberId ?? resolveMemberFilter(db, params.get(`member`)),
    model: params.get(`model`),
    endpoint: parseUsageEndpoint(params.get(`endpoint`)),
    from: parseUsageTime(params.get(`from`), `from`),
    to: parseUsageTime(params.get(`to`), `to`),
  }
}

/** CSV 列（机器面英文表头——METERING §3；NULL token = 空单元格；`ts` = ISO 8601（UTC）∥ `stream` = 1/0）。 */
const CSV_HEADER = ["ts", "member", "key_hint", "endpoint", "model", "status", "stream", "prompt_tokens", "completion_tokens", "total_tokens", "duration_ms"]

/** CSV 单元（RFC 4180：含 `,`/引号/换行的值加引号 + 双引号转义）。 */
function csvCell(value) {
  if (value === null || value === undefined) return ""
  const text = String(value)
  return /[",\r\n]/.test(text) ? `"${text.replaceAll(`"`, `""`)}"` : text
}

/** CSV 序列化（RFC 4180 行尾 CRLF ∥ UTF-8 BOM——Excel 中文兼容；空集 ⇒ 仅表头）。 */
function toCsv(rows) {
  const lines = [CSV_HEADER.join(",")]
  for (const row of rows) {
    lines.push(
      [
        new Date(row.ts).toISOString(),
        row.member,
        row.keyHint,
        row.endpoint,
        row.model,
        row.status,
        row.stream ? 1 : 0,
        row.promptTokens,
        row.completionTokens,
        row.totalTokens,
        row.durationMs,
      ].map(csvCell).join(","),
    )
  }
  return `\uFEFF${lines.join("\r\n")}\r\n`
}

export function registerMeteringRoutes(routes, { db } = {}) {
  if (!db) throw new Error("registerMeteringRoutes：缺少 db（openDatabase 产物）")

  routes.add("GET", "/api/me/usage", (req, res) => {
    const { member } = requireSession(db, req)
    const params = paramsOf(req.url)
    sendJson(res, 200, { rows: queryUsage(db, { ...usageFiltersOf(db, params, { memberId: member.id }), limit: parseUsageLimit(params.get(`limit`)) }) })
  })

  routes.add("GET", "/api/me/usage/summary", (req, res) => {
    const { member } = requireSession(db, req) // 会话鉴权（本人固定——无会话 ⇒ 401；user ∥ admin 同门——KD-SV-50）
    sendJson(res, 200, memberUsageSummary(db, usageFiltersOf(db, paramsOf(req.url), { memberId: member.id })))
  })

  routes.add("GET", "/api/usage", (req, res) => {
    requireAdmin(db, req)
    const params = paramsOf(req.url)
    sendJson(res, 200, { rows: queryUsage(db, { ...usageFiltersOf(db, params), limit: parseUsageLimit(params.get(`limit`)) }) })
  })

  routes.add("GET", "/api/usage/summary", (req, res) => {
    requireAdmin(db, req)
    sendJson(res, 200, usageSummary(db, usageFiltersOf(db, paramsOf(req.url))))
  })

  routes.add("GET", "/api/usage/export", (req, res) => {
    requireAdmin(db, req)
    const rows = exportUsageRows(db, usageFiltersOf(db, paramsOf(req.url)))
    res.writeHead(200, { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="usage.csv"` })
    res.end(toCsv(rows))
  })

  routes.add("POST", "/api/members/:id/model-quotas", async (req, res, ctx) => {
    requireAdmin(db, req)
    const member = findMemberById(db, Number(ctx.params.id))
    if (!member) throw new HttpError("not_found", `成员不存在：${ctx.params.id}`)
    const body = await readJsonBody(req)
    if (body === null || typeof body !== "object" || !("quotas" in body)) {
      throw new HttpError("invalid_request_error", `缺 quotas（{ "<对外标识（别名（裸名） ∥ provider/model 前缀形）>": N|null }——值 null = 删键）`)
    }
    const updated = mergeMemberModelQuotas(db, member.id, body.quotas) // 键级合并：未出现键不动
    sendJson(res, 200, { id: updated.id, modelQuotas: parseModelQuotas(updated.model_quotas_json) })
  })
}
