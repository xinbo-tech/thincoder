/**
 * routes.mjs — 自助端点（accounts/ACCOUNTS.md §3）：login ∥ logout ∥ me ∥ me/password ∥ me/keys/rotate。
 *
 * 判权全在后端（会话 + 角色）；写端点仅收 application/json（分派层统一 400——gateway/server.mjs）。
 * 无 ∥ 过期会话 ⇒ 401 `unauthorized`；`user` 触管理端点 ⇒ 403 `forbidden`（routes-admin.mjs）。
 * login 接线登录守卫（§2 ∥ KD-SV-21）：锁定期 ⇒ 429 `too_many_attempts` + `Retry-After`（不跑散列——
 * 快速拒绝；两维同文案——防枚举面保持）；成功 ⇒ 清计（该用户名 + 该 IP）。
 * 审计写（§2.1——`recordAudit`）：login 成/败 ∥ key_rotate ∥ password_change（锁触发行 = login-guard `onLock` 接线）。
 */
import { HttpError, sendJson } from "../gateway/errors.mjs"
import { readJsonBody } from "../gateway/server.mjs"
import { keyUsageStats, monthlyTokensForMember } from "../metering/usage.mjs"
import { recordAudit } from "./audit.mjs"
import { activeKeysOf, rotateKey } from "./keys.mjs"
import { clientIp, defaultLoginGuard } from "./login-guard.mjs"
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

/** 成员行（页面消费形——ACCOUNTS §3）：`{ id, name, username, role, quotaTokens, usedTokens, keys[{id,hint,lastUsedAt,windowTokens}] }`。
 *  本人面 ∥ 管理列表同形（KD-SV-16）；`usedTokens` = 本月累计（METERING §2 同口径）；
 *  key 行归因（AC-15⑥）单源 = `keyUsageStats`：`lastUsedAt` = MAX(ts) ∥ `windowTokens` = 近 30 天（从未使用 ⇒ null/0）。
 *  `keyStats` 给定 = 调用侧一次装配（`GET /api/members` 全员免 N+1）；缺省 = 就地一次取。 */
export function memberView(db, member, { now = Date.now(), usedTokens = null, keyStats = null } = {}) {
  const stats = keyStats ?? keyUsageStats(db, { now })
  return {
    id: member.id,
    name: member.name,
    username: member.username,
    role: member.role,
    quotaTokens: member.quota_tokens,
    usedTokens: usedTokens ?? monthlyTokensForMember(db, member.id, { now }),
    keys: activeKeysOf(db, member.id).map((key) => ({
      id: key.id,
      hint: key.key_hint,
      lastUsedAt: stats.get(key.id)?.lastUsedAt ?? null,
      windowTokens: stats.get(key.id)?.windowTokens ?? 0,
    })),
  }
}

/** 锁定期文案（两维同文案、与用户名存在性无关——防枚举面保持——ACCOUNTS §2）。 */
export const THROTTLED_MESSAGE = "登录尝试过于频繁（请稍后再试）"

export function registerAccountRoutes(routes, { db, guard = defaultLoginGuard } = {}) {
  if (!db) throw new Error("registerAccountRoutes：缺少 db（openDatabase 产物）")

  routes.add("POST", "/api/login", async (req, res, ctx) => {
    const body = await readJsonBody(req)
    const username = typeof body?.username === "string" ? body.username : ""
    const password = typeof body?.password === "string" ? body.password : ""
    const ip = clientIp(req, { trustProxy: ctx?.config?.trustProxy === true }) // IP 口径（trustProxy——§2）
    const verdict = guard.check({ username, ip })
    if (verdict.locked) {
      res.setHeader("Retry-After", String(verdict.retryAfterS)) // 剩余秒（固定窗——锁期内不延长）
      throw new HttpError("too_many_attempts", THROTTLED_MESSAGE)
    }
    const member = findMemberByUsername(db, username)
    const ok = await verifyPassword(password, member?.password_hash) // 不存在用户照跑哑散列（同措辞同耗时）
    if (!member || !ok) {
      guard.recordFailure({ username, ip }) // 双维计数（锁触发 ⇒ login_throttled 一行——§2）
      recordAudit(db, { type: "login_failure", actor: username, actorId: member?.id ?? null, detail: { ip } }) // §2.1 失败路径（提交用户名）
      throw new HttpError("invalid_credentials", "用户名或密码错误")
    }
    guard.recordSuccess({ username, ip }) // 清计：该用户名 + 该 IP（§2）
    recordAudit(db, { type: "login_success", actor: member.username, actorId: member.id, detail: { ip } }) // §2.1 成功路径（recordSuccess 后）
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
    recordAudit(db, { type: "password_change", actor: session.member.name, actorId: session.member.id }) // §2.1（本人）
    guard.clearUsername(session.member.username) // 清计：自助改密 ⇒ 本人用户名维（§2）
    revokeMemberSessions(db, session.member.id, { exceptTokenHash: session.tokenHash }) // 本人其他会话吊销——当前保留
    sendJson(res, 200, { ok: true })
  })

  routes.add("POST", "/api/me/keys/rotate", (req, res) => {
    const { member } = requireSession(db, req)
    const issued = rotateKey(db, member.id) // 新签 + 吊销旧；新明文一次性回显
    recordAudit(db, { type: "key_rotate", actor: member.name, actorId: member.id, detail: { keyHint: issued.hint } }) // §2.1（本人）
    sendJson(res, 200, { id: issued.id, hint: issued.hint, plain: issued.plain })
  })
}
