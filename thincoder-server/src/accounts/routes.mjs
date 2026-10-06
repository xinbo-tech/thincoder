/**
 * routes.mjs — 自助端点（accounts/ACCOUNTS.md §3）：login ∥ logout ∥ me ∥ me/password ∥ me/keys/rotate。
 *
 * 判权全在后端（会话 + 角色）；写端点仅收 application/json（分派层统一 400——gateway/server.mjs）。
 * 无 ∥ 过期会话 ⇒ 401 `unauthorized`；`user` 触管理端点 ⇒ 403 `forbidden`（routes-admin.mjs）。
 */
import { HttpError, sendJson } from "../gateway/errors.mjs"
import { readJsonBody } from "../gateway/server.mjs"
import { monthlyTokensForMember } from "../metering/usage.mjs"
import { activeKeysOf, rotateKey } from "./keys.mjs"
import { findMemberByUsername, setMemberPassword, validatePassword, verifyPassword } from "./members.mjs"
import {
  clearSessionCookie,
  createSession,
  deleteExpiredSessions,
  deleteSession,
  requireSession,
  revokeMemberSessions,
  serializeSessionCookie,
} from "./session.mjs"

/** 成员行（页面消费形——ACCOUNTS §3）：`{ id, name, username, role, quotaTokens, usedTokens, keys[{id,hint}] }`。
 *  本人面 ∥ 管理列表同形（KD-SV-16）；`usedTokens` = 本月累计（METERING §2 同口径）。 */
export function memberView(db, member, { now = Date.now(), usedTokens = null } = {}) {
  return {
    id: member.id,
    name: member.name,
    username: member.username,
    role: member.role,
    quotaTokens: member.quota_tokens,
    usedTokens: usedTokens ?? monthlyTokensForMember(db, member.id, { now }),
    keys: activeKeysOf(db, member.id).map((key) => ({ id: key.id, hint: key.key_hint })),
  }
}

export function registerAccountRoutes(routes, { db } = {}) {
  if (!db) throw new Error("registerAccountRoutes：缺少 db（openDatabase 产物）")

  routes.add("POST", "/api/login", async (req, res) => {
    const body = await readJsonBody(req)
    const username = typeof body?.username === "string" ? body.username : ""
    const password = typeof body?.password === "string" ? body.password : ""
    const member = findMemberByUsername(db, username)
    const ok = await verifyPassword(password, member?.password_hash) // 不存在用户照跑哑散列（同措辞同耗时）
    if (!member || !ok) throw new HttpError("invalid_credentials", "用户名或密码错误")
    deleteExpiredSessions(db) // 过期行顺手清（ACCOUNTS §2）
    const { token } = createSession(db, member.id)
    res.setHeader("Set-Cookie", serializeSessionCookie(token))
    sendJson(res, 200, { ok: true, member: { id: member.id, name: member.name, username: member.username, role: member.role } })
  })

  routes.add("POST", "/api/logout", (req, res) => {
    const session = requireSession(db, req)
    deleteSession(db, session.tokenHash)
    res.setHeader("Set-Cookie", clearSessionCookie())
    sendJson(res, 200, { ok: true })
  })

  routes.add("GET", "/api/me", (req, res) => {
    const { member } = requireSession(db, req)
    sendJson(res, 200, memberView(db, member))
  })

  routes.add("POST", "/api/me/password", async (req, res) => {
    const session = requireSession(db, req)
    const body = await readJsonBody(req)
    const oldPassword = typeof body?.oldPassword === "string" ? body.oldPassword : ""
    const ok = await verifyPassword(oldPassword, session.member.password_hash)
    if (!ok) throw new HttpError("invalid_credentials", "原密码错误")
    validatePassword(body?.newPassword) // < 8 ⇒ 400；通过前不落任何变更
    await setMemberPassword(db, session.member.id, body.newPassword)
    revokeMemberSessions(db, session.member.id, { exceptTokenHash: session.tokenHash }) // 本人其他会话吊销——当前保留
    sendJson(res, 200, { ok: true })
  })

  routes.add("POST", "/api/me/keys/rotate", (req, res) => {
    const { member } = requireSession(db, req)
    const issued = rotateKey(db, member.id) // 新签 + 吊销旧；新明文一次性回显
    sendJson(res, 200, { id: issued.id, hint: issued.hint, plain: issued.plain })
  })
}
