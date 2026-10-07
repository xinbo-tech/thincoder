/**
 * routes.mjs — 自助端点（accounts/ACCOUNTS.md §3）：login ∥ logout ∥ me ∥ me/password ∥ me/keys/rotate
 * ∥ me/keys/issue（自助签发——多把并存） ∥ me/keys/:keyId/revoke（自助逐把吊销）。
 *
 * 判权全在后端（会话 + 角色）；写端点仅收 application/json（分派层统一 400——gateway/server.mjs）。
 * 无 ∥ 过期会话 ⇒ 401 `unauthorized`；`user` 触管理端点 ⇒ 403 `forbidden`（routes-admin.mjs）。
 * login 接线登录守卫（§2 ∥ KD-SV-21）：锁定期 ⇒ 429 `too_many_attempts` + `Retry-After`（不跑散列——
 * 快速拒绝；两维同文案——防枚举面保持）；成功 ⇒ 清计（该用户名 + 该 IP）。
 * 审计写（§2.1——`recordAudit`）：login 成/败 ∥ key_rotate ∥ key_issue ∥ key_revoke ∥ password_change
 * （锁触发行 = login-guard `onLock` 接线）。
 */
import { HttpError, sendJson } from "../gateway/errors.mjs"
import { readJsonBody } from "../gateway/server.mjs"
import { monthlyCountersByMember } from "../metering/aggregates.mjs"
import { keyUsageStats, monthlyTokensForMember } from "../metering/usage.mjs"
import { recordAudit } from "./audit.mjs"
import { activeKeysOf, countActiveKeys, getKeyById, issueKey, MAX_ACTIVE_KEYS, normalizeKeyName, revokeKey, rotateKey } from "./keys.mjs"
import { clientIp, defaultLoginGuard } from "./login-guard.mjs"
import { findMemberByUsername, parseModelDisables, parseModelQuotas, setMemberPassword, validatePassword, verifyPassword } from "./members.mjs"
import {
  clearSessionCookie,
  createSession,
  deleteExpiredSessions,
  deleteSession,
  requireSession,
  revokeMemberSessions,
  serializeSessionCookie,
} from "./session.mjs"

/** 成员行（页面消费形——ACCOUNTS §3）：`{ id, name, username, role, modelQuotas, modelUsage, modelDisables, usedTokens, keys[{id,name,hint,createdAt,lastUsedAt,windowTokens}] }`。
 *  本人面 ∥ 管理列表同形（KD-SV-16）；`modelQuotas` = 分模型覆盖 map（键 = 对外标识；未设 = 用平台——METERING §2）；
 *  `modelUsage` = 当月逐模型已用 map（键 = 对外标识——`monthlyCountersByMember`；METERING §2.3）∥ `modelDisables` = 模型禁用集 map（ACCOUNTS §2.2）；
 *  `usedTokens` = 本月累计（日表口径——METERING §3）；
 *  key 行归因（AC-15⑥）单源 = `keyUsageStats`：`lastUsedAt` = MAX(ts) ∥ `windowTokens` = 近 30 天（从未使用 ⇒ null/0）；
 *  key 行名称/签发时间（§1.1——me-keys 批）：`name`（默认名落库——显示稳定） ∥ `createdAt`。
 *  `keyStats` 给定 = 调用侧一次装配（`GET /api/members` 全员免 N+1）；缺省 = 就地一次取；
 *  `modelUsage` 同口径（`memberId` 给定 ⇒ 唯一键前缀点查；缺省 = 就地一次取）。 */
export function memberView(db, member, { now = Date.now(), usedTokens = null, modelUsage = null, keyStats = null } = {}) {
  const stats = keyStats ?? keyUsageStats(db, { now })
  return {
    id: member.id,
    name: member.name,
    username: member.username,
    role: member.role,
    modelQuotas: parseModelQuotas(member.model_quotas_json),
    modelUsage: modelUsage ?? (monthlyCountersByMember(db, { memberId: member.id, now }).get(member.id) ?? {}),
    modelDisables: parseModelDisables(member.model_disabled_json),
    usedTokens: usedTokens ?? monthlyTokensForMember(db, member.id, { now }),
    keys: activeKeysOf(db, member.id).map((key) => ({
      id: key.id,
      name: key.name,
      hint: key.key_hint,
      createdAt: key.created_at,
      lastUsedAt: stats.get(key.id)?.lastUsedAt ?? null,
      windowTokens: stats.get(key.id)?.windowTokens ?? 0,
    })),
  }
}

/** 锁定期文案（两维同文案、与用户名存在性无关——防枚举面保持——ACCOUNTS §2）。 */
export const THROTTLED_MESSAGE = "登录尝试过于频繁（请稍后再试）"

/** 读可空 JSON 体（`POST /api/me/keys/issue`——`{name?}`）：零字节体 ⇒ `{}`（§7 N32「空体」——不携名）；
 *  其余照常读（非法 JSON ⇒ 400——gateway/server.mjs `readJsonBody`）。 */
async function readOptionalJsonBody(req) {
  if (Number(req.headers["content-length"]) === 0) return {}
  return await readJsonBody(req)
}

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
    const issued = rotateKey(db, member.id) // 新签 + 吊销旧；新明文一次性回显（新签名 = 默认名助手——请求/响应形零改）
    recordAudit(db, { type: "key_rotate", actor: member.name, actorId: member.id, detail: { keyHint: issued.hint } }) // §2.1（本人）
    sendJson(res, 200, { id: issued.id, hint: issued.hint, plain: issued.plain })
  })

  routes.add("POST", "/api/me/keys/issue", async (req, res) => {
    const { member } = requireSession(db, req)
    const body = await readOptionalJsonBody(req) // 空体 ⇒ {}（不携名——N32）
    const name = normalizeKeyName(body?.name) // 校验先行：非字符串 ∥ trim 后 >40 字符 ⇒ 400（库零变）
    if (countActiveKeys(db, member.id) >= MAX_ACTIVE_KEYS) {
      throw new HttpError("invalid_request_error", `active key 已达上限（${MAX_ACTIVE_KEYS} 把）——请先吊销不再使用的 key`)
    }
    const issued = issueKey(db, member.id, { name }) // 空名 ⇒ 默认名 key-N；计数与 INSERT 同同步段（§1.1——无竞态面）
    recordAudit(db, { type: "key_issue", actor: member.name, actorId: member.id, detail: { keyHint: issued.hint } }) // §2.1（本人）
    sendJson(res, 200, { id: issued.id, name: issued.name, hint: issued.hint, plain: issued.plain }) // 明文一次性（§1 语义）
  })

  routes.add("POST", "/api/me/keys/:keyId/revoke", (req, res, ctx) => {
    const { member } = requireSession(db, req)
    const key = getKeyById(db, Number(ctx.params.keyId)) // 非数字 ⇒ getKeyById null ⇒ 404
    if (!key || key.member_id !== member.id) throw new HttpError("not_found", `key 不存在：${ctx.params.keyId}`) // 他人 ∥ 不存在不区分（防枚举——沿 admin 先例）
    revokeKey(db, key.id) // 立即生效（逐请求查库——KD-SV-11）；已吊销 ⇒ 幂等（行保留——软删纪律）
    recordAudit(db, { type: "key_revoke", actor: member.name, actorId: member.id, target: member.name, targetId: member.id, detail: { keyHint: key.key_hint } }) // §2.1（本人——对象 = key 失主）
    sendJson(res, 200, { ok: true, id: key.id, status: "revoked" })
  })
}
