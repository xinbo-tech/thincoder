/**
 * routes.mjs — 客户端接入面（`/api/client/*`——client/CLIENT.md §1/§2；KD-SV-62）：login ∥ logout ∥ me 三处理。
 *
 * login = 端侧直登（公开）：登录守卫（复用 login-guard——双维锁；锁定期 ⇒ 429 `too_many_attempts` +
 * `Retry-After`，不跑散列）→ 散列校验（复用 members——同措辞同耗时，防枚举）→ 签发一枚**具名**
 * 成员 key（端标签落 `name`；名称校验单源 = `normalizeKeyName`；**不判 20 上限**——KD-SV-61「轮转 ∥ CLI
 * 不受限」先例）→ 审计 `login_success` + `key_issue`（detail 携 `surface:"client"`）。
 * logout ∥ me = 登录 token 鉴权（`requireApiKey`——与 /v1 同校验单源；无 ∥ 无效 ⇒ 401 `invalid_api_key`，
 * 三态不区分）；logout = 吊销当枚（软删——`revokeKey`；逐请求查库 ⇒ 下一请求即 401；已吊销再调 ⇒ 401——
 * 端侧视同「已失效」）。
 * 零新错误码（error 全码复用）；`sessions` 表零涉（客户端 token 落 `api_keys`）；零迁移（结构版本保持 v10）。
 */
import { recordAudit } from "../accounts/audit.mjs"
import { getKeyById, issueKey, normalizeKeyName, revokeKey } from "../accounts/keys.mjs"
import { clientIp, defaultLoginGuard } from "../accounts/login-guard.mjs"
import { findMemberByUsername, verifyPassword } from "../accounts/members.mjs"
import { THROTTLED_MESSAGE } from "../accounts/routes.mjs"
import { HttpError, sendJson } from "../gateway/errors.mjs"
import { requireApiKey } from "../gateway/routes.mjs"
import { readJsonBody } from "../gateway/server.mjs"

/** 成员投影（login 响应 ∥ me 读数共用形——CLIENT.md §2）。 */
function memberShape(member) {
  return { id: member.id, name: member.name, username: member.username, role: member.role }
}

/** 注册客户端接入面（G1 注册行制）：`db` = openDatabase 产物；`guard` = 登录守卫（装配面与账号面共用同一实例）。 */
export function registerClientRoutes(routes, { db, guard = defaultLoginGuard } = {}) {
  if (!db) throw new Error("registerClientRoutes：缺少 db（openDatabase 产物）")

  routes.add("POST", "/api/client/login", async (req, res, ctx) => {
    const body = await readJsonBody(req) // 非 JSON 体 ⇒ 400（分派层 JSON 型门 ∥ 本读）
    if (typeof body?.username !== "string" || body.username === "" || typeof body?.password !== "string" || body.password === "") {
      throw new HttpError("invalid_request_error", "客户端登录须携 username ∥ password（非空字符串）")
    }
    const label = normalizeKeyName(body.label) // 名称口径单源：非字符串 ∥ trim 后 >40 字符 ⇒ 400（库零变）；空 ⇒ null 落默认名
    const username = body.username
    const ip = clientIp(req, { trustProxy: ctx?.config?.trustProxy === true })
    const verdict = guard.check({ username, ip })
    if (verdict.locked) {
      throw new HttpError("too_many_attempts", THROTTLED_MESSAGE, { headers: { "Retry-After": String(verdict.retryAfterS) } })
    }
    const member = findMemberByUsername(db, username)
    const ok = await verifyPassword(body.password, member?.password_hash) // 不存在用户照跑哑散列（同措辞同耗时）
    if (!member || !ok) {
      guard.recordFailure({ username, ip })
      recordAudit(db, { type: "login_failure", actor: username, actorId: member?.id ?? null, detail: { ip, surface: "client" } })
      throw new HttpError("invalid_credentials", "用户名或密码错误")
    }
    guard.recordSuccess({ username, ip })
    recordAudit(db, { type: "login_success", actor: member.username, actorId: member.id, detail: { ip, surface: "client" } })
    const issued = issueKey(db, member.id, { name: label }) // 具名签发（不设过期天然；免 20 上限——本面不计数——KD-SV-61）
    recordAudit(db, { type: "key_issue", actor: member.name, actorId: member.id, detail: { keyHint: issued.hint, surface: "client" } })
    sendJson(res, 200, { ok: true, token: issued.plain, member: memberShape(member) }) // 明文一次性（同签发语义）
  })

  routes.add("POST", "/api/client/logout", (req, res) => {
    const { keyId, member } = requireApiKey(db, req) // 无 ∥ 无效（含已吊销）⇒ 401（端侧照清本地）
    const key = getKeyById(db, keyId)
    revokeKey(db, keyId) // 软删（行保留）；逐请求查库 ⇒ 下一请求即 401
    recordAudit(db, {
      type: "key_revoke",
      actor: member.name,
      actorId: member.id,
      target: member.name,
      targetId: member.id,
      detail: { keyHint: key?.key_hint ?? "", surface: "client" },
    })
    sendJson(res, 200, { ok: true })
  })

  routes.add("GET", "/api/client/me", (req, res) => {
    const { keyId, member } = requireApiKey(db, req) // 当前登录读数（供端侧校验 token 仍有效 ∥ 当前态显示）
    const key = getKeyById(db, keyId)
    sendJson(res, 200, { member: memberShape(member), token: { label: key?.name ?? null, createdAt: key?.created_at ?? null } })
  })
}
