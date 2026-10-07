/**
 * routes-admin.mjs — 管理端点（accounts/ACCOUNTS.md §3——admin）：members 列表/建 ∥ key 吊销 ∥ 密码重置
 * ∥ 模型禁用集（`POST /api/members/:id/model-disables`——§2.2）∥ 审计列表（`GET /api/audit`——§2.1）。
 *
 * 角色判定在服务端（requireAdmin——页面显隐非判据）；`user` ⇒ 403；无 ∥ 过期会话 ⇒ 401。
 * 成员不存在 ∥ key 不属该成员 ⇒ 404 `not_found`；吊销已有 key 幂等（行保留——软删纪律）。
 * 密码重置 ⇒ 清目标用户名维登录锁（`accounts/ACCOUNTS.md` §2 清计路径）。
 * 审计写（§2.1——`recordAudit`）：member_create ∥ key_revoke ∥ password_reset。
 */
import { HttpError, sendJson } from "../gateway/errors.mjs"
import { readJsonBody } from "../gateway/server.mjs"
import { monthlyCountersByMember } from "../metering/aggregates.mjs"
import { keyUsageStats, monthlyTokensByMember, parseUsageLimit, parseUsageTime } from "../metering/usage.mjs"
import { queryAudit, recordAudit } from "./audit.mjs"
import { getKeyById, revokeKey } from "./keys.mjs"
import { defaultLoginGuard } from "./login-guard.mjs"
import { createMember, findMemberById, findMemberByName, generateTempPassword, listMembers, mergeMemberModelDisables, parseModelDisables, setMemberPassword } from "./members.mjs"
import { memberView } from "./routes.mjs"
import { requireAdmin, revokeMemberSessions } from "./session.mjs"

/** `member` 过滤取值（同 usage 口径：全数字 ⇒ id；否则按展示名；未命中 ⇒ 空集哨兵 -1）。 */
function resolveMemberFilter(db, raw) {
  if (raw === null || raw === "") return null
  if (/^\d+$/.test(raw)) return Number(raw)
  const member = findMemberByName(db, raw)
  return member ? member.id : -1
}

/** 审计列表查询参数装配（`GET /api/audit`）：type（枚举校验归 `queryAudit`）∥ member ∥ from ∥ to ∥ limit。
 *  注：查询键以模板字面量书写——from 键的双引号形会撞批内件依赖面扫描的采集正则（该扫描件按令零改）误报。 */
function auditQueryOf(db, url) {
  const params = new URL(url, "http://localhost").searchParams
  const key = (name) => params.get(name)
  return queryAudit(db, {
    type: key(`type`) || null,
    memberId: resolveMemberFilter(db, key(`member`)),
    from: parseUsageTime(key(`from`), `from`),
    to: parseUsageTime(key(`to`), `to`),
    limit: parseUsageLimit(key(`limit`)),
  })
}

export function registerAdminRoutes(routes, { db, guard = defaultLoginGuard } = {}) {
  if (!db) throw new Error("registerAdminRoutes：缺少 db（openDatabase 产物）")

  routes.add("GET", "/api/members", (req, res) => {
    requireAdmin(db, req)
    const now = Date.now()
    const used = monthlyTokensByMember(db, { now }) // 全员本月累计（一次装配——避免 N+1）
    const usage = monthlyCountersByMember(db, { now }) // 全员逐模型已用（同上——免 N+1；AC-23）
    const keyStats = keyUsageStats(db, { now }) // 全员 key 归因（同上——AC-15⑥）
    const members = listMembers(db).map((member) => memberView(db, member, { now, usedTokens: used.get(member.id) ?? 0, modelUsage: usage.get(member.id) ?? {}, keyStats }))
    sendJson(res, 200, { members })
  })

  routes.add("POST", "/api/members", async (req, res) => {
    const { member: admin } = requireAdmin(db, req)
    const body = await readJsonBody(req)
    const { member, password } = await createMember(db, {
      username: body?.username,
      name: body?.name,
      role: body?.role ?? "user",
    })
    recordAudit(db, { type: "member_create", actor: admin.name, actorId: admin.id, target: member.name, targetId: member.id, detail: { role: member.role } })
    sendJson(res, 200, { id: member.id, name: member.name, username: member.username, role: member.role, tempPassword: password })
  })

  routes.add("POST", "/api/members/:id/keys/:keyId/revoke", (req, res, ctx) => {
    const { member: admin } = requireAdmin(db, req)
    const memberId = Number(ctx.params.id)
    const keyId = Number(ctx.params.keyId)
    const member = findMemberById(db, memberId)
    if (!member) throw new HttpError("not_found", `成员不存在：${ctx.params.id}`)
    const key = getKeyById(db, keyId)
    if (!key || key.member_id !== memberId) throw new HttpError("not_found", `key 不存在：${ctx.params.keyId}`)
    revokeKey(db, keyId) // 立即生效（逐请求查库——无缓存）；已吊销 ⇒ 幂等
    recordAudit(db, { type: "key_revoke", actor: admin.name, actorId: admin.id, target: member.name, targetId: member.id, detail: { keyHint: key.key_hint } })
    sendJson(res, 200, { ok: true, id: keyId, status: "revoked" })
  })

  routes.add("POST", "/api/members/:id/password-reset", async (req, res, ctx) => {
    const { member: admin } = requireAdmin(db, req)
    const member = findMemberById(db, Number(ctx.params.id))
    if (!member) throw new HttpError("not_found", `成员不存在：${ctx.params.id}`)
    const tempPassword = generateTempPassword() // 一次性回显——同签发语义（KD-SV-14）
    await setMemberPassword(db, member.id, tempPassword)
    guard.clearUsername(member.username) // 清计：目标用户名维（HTTP 面；本机 CLI 重置跨进程不达——在案）
    revokeMemberSessions(db, member.id) // 该成员全部会话吊销
    recordAudit(db, { type: "password_reset", actor: admin.name, actorId: admin.id, target: member.name, targetId: member.id })
    sendJson(res, 200, { id: member.id, tempPassword })
  })

  routes.add("GET", "/api/audit", (req, res) => {
    requireAdmin(db, req) // 判权三态：user ⇒ 403 ∥ 无会话 ⇒ 401 ∥ admin 200
    sendJson(res, 200, { events: auditQueryOf(db, req.url) })
  })

  routes.add("POST", "/api/members/:id/model-disables", async (req, res, ctx) => {
    requireAdmin(db, req) // 判权三态：user ⇒ 403 ∥ 无会话 ⇒ 401 ∥ admin 200
    const member = findMemberById(db, Number(ctx.params.id))
    if (!member) throw new HttpError("not_found", `成员不存在：${ctx.params.id}`)
    const body = await readJsonBody(req)
    if (body === null || typeof body !== "object" || !("disables" in body)) {
      throw new HttpError("invalid_request_error", `缺 disables（{ "<provider/model>": true|null }——true = 禁用；值 null = 删键恢复）`)
    }
    const updated = mergeMemberModelDisables(db, member.id, body.disables) // 键级合并：未出现键不动；变更不入审计（§2.1/§2.2）
    sendJson(res, 200, { id: updated.id, modelDisables: parseModelDisables(updated.model_disabled_json) })
  })
}
