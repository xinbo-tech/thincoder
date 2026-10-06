/**
 * session.mjs — 会话面（accounts/ACCOUNTS.md §2 ∥ KD-SV-12）：签发 ∥ 校验 ∥ 吊销 ∥
 * cookie 序列化/解析 ∥ 过期清理。
 *
 * cookie `tc_session`（HttpOnly ∥ SameSite=Strict ∥ Path=/ ∥ Max-Age=604800——7 天绝对过期，不滑动）；
 * 库存 `sha256(令牌)`（无明文）；校验 = 逐请求查库（吊销即时）——同团队 key 纪律（KD-SV-11）。
 */
import { createHash, randomBytes } from "node:crypto"

import { HttpError } from "../gateway/errors.mjs"

export const SESSION_COOKIE = "tc_session"
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 天（绝对——不滑动）

const hashToken = (token) => createHash("sha256").update(token).digest("hex")

/** 签发：登录一行 ⇒ `{ token, expiresAt }`（token 仅此一次进入 Set-Cookie）。 */
export function createSession(db, memberId, { now = Date.now() } = {}) {
  const token = randomBytes(32).toString("base64url") // 43 字符
  const expiresAt = now + SESSION_TTL_MS
  db.prepare("INSERT INTO sessions (token_hash, member_id, created_at, expires_at) VALUES (?, ?, ?, ?)").run(
    hashToken(token),
    memberId,
    now,
    expiresAt,
  )
  return { token, expiresAt }
}

/** 会话 cookie（7 天绝对过期——Max-Age 由 TTL 派生）。 */
export function serializeSessionCookie(token) {
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_TTL_MS / 1000}`
}

/** 清 cookie（登出——值清空 + Max-Age=0）。 */
export function clearSessionCookie() {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`
}

/** cookie 头解析（`a=b; c=d` ⇒ `{ a: "b", c: "d" }`）。 */
export function parseCookies(header) {
  const out = {}
  if (typeof header !== "string") return out
  for (const part of header.split(";")) {
    const eq = part.indexOf("=")
    if (eq < 0) continue
    const key = part.slice(0, eq).trim()
    if (key) out[key] = part.slice(eq + 1).trim()
  }
  return out
}

/** 会话校验（逐请求查库）：命中未过期行 ⇒ `{ member, tokenHash }`；无 ∥ 过期 ⇒ null（不区分）。 */
export function resolveSession(db, req, { now = Date.now() } = {}) {
  const token = parseCookies(req.headers.cookie)[SESSION_COOKIE]
  if (!token) return null
  const tokenHash = hashToken(token)
  const row = db
    .prepare("SELECT m.*, s.expires_at AS session_expires_at FROM sessions s JOIN members m ON m.id = s.member_id WHERE s.token_hash = ?")
    .get(tokenHash)
  if (!row || row.session_expires_at <= now) return null
  return { member: row, tokenHash }
}

/** 销一行（登出——按 token 散列删）。 */
export function deleteSession(db, tokenHash) {
  return Number(db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(tokenHash).changes) > 0
}

/** 吊销某成员会话：`exceptTokenHash` = 保留当前会话（自助改密）；否则全部（admin 重置）。 */
export function revokeMemberSessions(db, memberId, { exceptTokenHash = null } = {}) {
  if (exceptTokenHash) {
    return Number(db.prepare("DELETE FROM sessions WHERE member_id = ? AND token_hash <> ?").run(memberId, exceptTokenHash).changes)
  }
  return Number(db.prepare("DELETE FROM sessions WHERE member_id = ?").run(memberId).changes)
}

/** 过期行清理（登录时顺手清——ACCOUNTS §2）。 */
export function deleteExpiredSessions(db, { now = Date.now() } = {}) {
  return Number(db.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(now).changes)
}

/** 会话门：无 ∥ 过期 ⇒ 401 `unauthorized`（返回 `{ member, tokenHash }`）。 */
export function requireSession(db, req, { now } = {}) {
  const session = resolveSession(db, req, { now })
  if (!session) throw new HttpError("unauthorized", "会话无效或已过期（请重新登录）")
  return session
}

/** 管理门：会话 + `admin` 角色（服务端判定——页面显隐非判据；`user` ⇒ 403 `forbidden`）。 */
export function requireAdmin(db, req, { now } = {}) {
  const session = requireSession(db, req, { now })
  if (session.member.role !== "admin") throw new HttpError("forbidden", "需要管理员权限")
  return session
}
