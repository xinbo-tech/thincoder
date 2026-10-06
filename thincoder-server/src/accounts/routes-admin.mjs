/**
 * routes-admin.mjs — 管理端点（accounts/ACCOUNTS.md §3——admin）：members 列表/建 ∥ key 吊销 ∥ 密码重置。
 *
 * 角色判定在服务端（requireAdmin——页面显隐非判据）；`user` ⇒ 403；无 ∥ 过期会话 ⇒ 401。
 * 成员不存在 ∥ key 不属该成员 ⇒ 404 `not_found`；吊销已有 key 幂等（行保留——软删纪律）。
 * 密码重置 ⇒ 清目标用户名维登录锁（`accounts/ACCOUNTS.md` §2 清计路径）。
 */
import { HttpError, sendJson } from "../gateway/errors.mjs"
import { readJsonBody } from "../gateway/server.mjs"
import { monthlyTokensByMember } from "../metering/usage.mjs"
import { getKeyById, revokeKey } from "./keys.mjs"
import { defaultLoginGuard } from "./login-guard.mjs"
import { createMember, findMemberById, generateTempPassword, listMembers, setMemberPassword } from "./members.mjs"
import { memberView } from "./routes.mjs"
import { requireAdmin, revokeMemberSessions } from "./session.mjs"

export function registerAdminRoutes(routes, { db, guard = defaultLoginGuard } = {}) {
  if (!db) throw new Error("registerAdminRoutes：缺少 db（openDatabase 产物）")

  routes.add("GET", "/api/members", (req, res) => {
    requireAdmin(db, req)
    const now = Date.now()
    const used = monthlyTokensByMember(db, { now }) // 全员本月累计（一次装配——避免 N+1）
    const members = listMembers(db).map((member) => memberView(db, member, { now, usedTokens: used.get(member.id) ?? 0 }))
    sendJson(res, 200, { members })
  })

  routes.add("POST", "/api/members", async (req, res) => {
    requireAdmin(db, req)
    const body = await readJsonBody(req)
    const { member, password } = await createMember(db, {
      username: body?.username,
      name: body?.name,
      role: body?.role ?? "user",
    })
    sendJson(res, 200, { id: member.id, name: member.name, username: member.username, role: member.role, tempPassword: password })
  })

  routes.add("POST", "/api/members/:id/keys/:keyId/revoke", (req, res, ctx) => {
    requireAdmin(db, req)
    const memberId = Number(ctx.params.id)
    const keyId = Number(ctx.params.keyId)
    const member = findMemberById(db, memberId)
    if (!member) throw new HttpError("not_found", `成员不存在：${ctx.params.id}`)
    const key = getKeyById(db, keyId)
    if (!key || key.member_id !== memberId) throw new HttpError("not_found", `key 不存在：${ctx.params.keyId}`)
    revokeKey(db, keyId) // 立即生效（逐请求查库——无缓存）；已吊销 ⇒ 幂等
    sendJson(res, 200, { ok: true, id: keyId, status: "revoked" })
  })

  routes.add("POST", "/api/members/:id/password-reset", async (req, res, ctx) => {
    requireAdmin(db, req)
    const member = findMemberById(db, Number(ctx.params.id))
    if (!member) throw new HttpError("not_found", `成员不存在：${ctx.params.id}`)
    const tempPassword = generateTempPassword() // 一次性回显——同签发语义（KD-SV-14）
    await setMemberPassword(db, member.id, tempPassword)
    guard.clearUsername(member.username) // 清计：目标用户名维（HTTP 面；本机 CLI 重置跨进程不达——在案）
    revokeMemberSessions(db, member.id) // 该成员全部会话吊销
    sendJson(res, 200, { id: member.id, tempPassword })
  })
}
