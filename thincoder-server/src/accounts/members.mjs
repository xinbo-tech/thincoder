/**
 * members.mjs — 成员面（accounts/ACCOUNTS.md §2）：CRUD ∥ scrypt 散列/校验（KD-SV-13——异步） ∥
 * 角色 ∥ 分模型配额覆盖（`model_quotas_json`——键级合并） ∥ 临时密码 ∥ 首启引导（KD-SV-15——幂等）。
 *
 * 密码规则：最小长度 8（建成员 ∥ 改密 ∥ 重置统一校验——MIN_PASSWORD_LENGTH）；
 * 编码串自描述 `scrypt$N$r$p$salt$hash`；校验 `timingSafeEqual`；
 * 登录失败不区分「用户不存在 ∥ 密码错」——不存在用户照跑哑散列（同参同耗时，防枚举）。
 */
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto"
import { promisify } from "node:util"

import { HttpError } from "../gateway/errors.mjs"
import { MIN_PASSWORD_LENGTH } from "../ops/config.mjs"

const scrypt = promisify(scryptCallback)

/** scrypt 参数（KD-SV-13：N=16384 ∥ r=8 ∥ p=1 ∥ keyLen=32 ∥ salt 16B）。 */
export const SCRYPT_PARAMS = Object.freeze({ N: 16384, r: 8, p: 1 })
const KEY_LENGTH = 32
const SALT_BYTES = 16

/** 哑散列目标（防枚举——不存在用户照跑同参散列；值无意义，只用其成本）。 */
const DUMMY_SALT = Buffer.alloc(SALT_BYTES)
const DUMMY_HASH = Buffer.alloc(KEY_LENGTH)

/** 密码最小长度校验（建成员 ∥ 改密 ∥ 重置统一入口）。 */
export function validatePassword(password) {
  if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
    throw new HttpError("invalid_request_error", `密码少于 ${MIN_PASSWORD_LENGTH} 字符`)
  }
  return password
}

/** 散列（异步——不阻塞事件循环）。 */
export async function hashPassword(password) {
  const salt = randomBytes(SALT_BYTES)
  const hash = await scrypt(validatePassword(password), salt, KEY_LENGTH, { ...SCRYPT_PARAMS })
  return `scrypt$${SCRYPT_PARAMS.N}$${SCRYPT_PARAMS.r}$${SCRYPT_PARAMS.p}$${salt.toString("base64url")}$${hash.toString("base64url")}`
}

/** 校验（timingSafeEqual；编码串缺失 ∥ 畸形 ⇒ 照跑哑散列后 false——耗时面同口径；散列参数越界 ⇒ 同 false 不抛）。 */
export async function verifyPassword(password, encoded) {
  const parsed = parseEncoded(encoded)
  const target = parsed ?? { params: SCRYPT_PARAMS, salt: DUMMY_SALT, hash: DUMMY_HASH }
  let derived
  try {
    derived = await scrypt(typeof password === "string" ? password : "", target.salt, KEY_LENGTH, { ...target.params })
  } catch {
    return false // 畸形行（如 N 非 2 的幂）⇒ 按校验失败——不把登录打成 500
  }
  const match = derived.length === target.hash.length && timingSafeEqual(derived, target.hash)
  return parsed !== null && match
}

/** 编码串解析（`scrypt$N$r$p$salt$hash`——自描述；畸形 ∥ 参数越界 ⇒ null）。 */
function parseEncoded(encoded) {
  if (typeof encoded !== "string") return null
  const parts = encoded.split("$")
  if (parts.length !== 6 || parts[0] !== "scrypt") return null
  const params = { N: Number(parts[1]), r: Number(parts[2]), p: Number(parts[3]) }
  if (!Number.isInteger(params.N) || !Number.isInteger(params.r) || !Number.isInteger(params.p)) return null
  if (params.N < 2 || params.N > 2 ** 20 || (params.N & (params.N - 1)) !== 0) return null // scrypt 要求 N 为 2 的幂
  if (params.r < 1 || params.r > 32 || params.p < 1 || params.p > 16) return null
  const salt = Buffer.from(parts[4], "base64url")
  const hash = Buffer.from(parts[5], "base64url")
  if (salt.length === 0 || hash.length === 0) return null
  return { params, salt, hash }
}

/** 一次性临时密码（服务器生成——回显一次；≥ 最小长度）。 */
export function generateTempPassword() {
  return randomBytes(12).toString("base64url") // 16 字符
}

export function findMemberById(db, id) {
  if (!Number.isInteger(id)) return null
  return db.prepare("SELECT * FROM members WHERE id = ?").get(id) ?? null
}

export function findMemberByUsername(db, username) {
  if (typeof username !== "string" || username === "") return null
  return db.prepare("SELECT * FROM members WHERE username = ?").get(username) ?? null
}

/** 按展示名寻址（CLI 口径——ACCOUNTS §2 寻址表）。 */
export function findMemberByName(db, name) {
  if (typeof name !== "string" || name === "") return null
  return db.prepare("SELECT * FROM members WHERE name = ?").get(name) ?? null
}

export function listMembers(db) {
  return db.prepare("SELECT * FROM members ORDER BY id").all()
}

export function countAdmins(db) {
  return Number(db.prepare("SELECT COUNT(*) AS n FROM members WHERE role = 'admin'").get().n)
}

/** 成员总数（管理总览读数——gateway/API.md §2.4 `GET /api/overview`）。 */
export function countMembers(db) {
  return Number(db.prepare("SELECT COUNT(*) AS n FROM members").get().n)
}

/** 建成员（页面与 CLI 共用）：password 未给 ⇒ 生成一次性临时密码（`generated` 标记）。 */
export async function createMember(db, { username, name = null, role = "user", password = null, now = Date.now() } = {}) {
  if (typeof username !== "string" || username.trim() === "") {
    throw new HttpError("invalid_request_error", "username 须为非空字符串")
  }
  if (role !== "admin" && role !== "user") throw new HttpError("invalid_request_error", `角色非法：${String(role)}（admin ∥ user）`)
  const displayName = typeof name === "string" && name.trim() !== "" ? name.trim() : username.trim()
  const generated = password === null || password === undefined
  const plain = generated ? generateTempPassword() : password
  const passwordHash = await hashPassword(plain) // 含最小长度校验
  let id
  try {
    const info = db
      .prepare("INSERT INTO members (username, name, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)")
      .run(username.trim(), displayName, passwordHash, role, new Date(now).toISOString())
    id = Number(info.lastInsertRowid)
  } catch (e) {
    if (e instanceof Error && e.message.includes("UNIQUE constraint failed")) {
      throw new HttpError("invalid_request_error", `成员已存在（username ∥ name 唯一）：${username.trim()}`)
    }
    throw e
  }
  return { member: findMemberById(db, id), password: plain, generated }
}

/** 改密 ∥ 重置（哈希替换——旧密即失效；会话吊销归调用方）。 */
export async function setMemberPassword(db, memberId, password) {
  const hash = await hashPassword(password)
  const info = db.prepare("UPDATE members SET password_hash = ? WHERE id = ?").run(hash, memberId)
  if (Number(info.changes) === 0) throw new HttpError("not_found", `成员不存在：${memberId}`)
}

/** 分模型覆盖表解析（`model_quotas_json` ⇒ map；缺省 ∥ 畸形 ∥ 非对象 ⇒ `{}`——零覆盖，不抛）。 */
export function parseModelQuotas(json) {
  if (typeof json !== "string" || json === "") return {}
  try {
    const parsed = JSON.parse(json)
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) return {}
    return parsed
  } catch {
    return {}
  }
}

/** 设分模型覆盖（`model_quotas_json`——**键级合并**：出现键 = 整值替换（`null` ⇒ 删键）∥ 未出现键不动）。
 *  校验先行（非法 ⇒ 400 库零变）；返回更新后成员行（404 归本函数）。 */
export function mergeMemberModelQuotas(db, memberId, quotas) {
  if (quotas === null || typeof quotas !== "object" || Array.isArray(quotas)) {
    throw new HttpError("invalid_request_error", `quotas 须为对象（{ "<provider/model>": N|null }）：${JSON.stringify(quotas)}`)
  }
  const member = findMemberById(db, memberId)
  if (!member) throw new HttpError("not_found", `成员不存在：${memberId}`)
  const merged = { ...parseModelQuotas(member.model_quotas_json) }
  for (const [key, value] of Object.entries(quotas)) {
    if (typeof key !== "string" || key.trim() === "") throw new HttpError("invalid_request_error", "覆盖键须为非空字符串（对外标识 provider/model）")
    if (value === null) {
      delete merged[key] // null = 删键
      continue
    }
    if (!Number.isInteger(value) || value < 0) {
      throw new HttpError("invalid_request_error", `覆盖值须为 ≥0 整数或 null（删键）：${key} = ${JSON.stringify(value)}`)
    }
    merged[key] = value
  }
  db.prepare("UPDATE members SET model_quotas_json = ? WHERE id = ?").run(JSON.stringify(merged), memberId)
  return findMemberById(db, memberId)
}

/** 首启引导（KD-SV-15——幂等）：仅零 admin 时依配置建首个 admin；零 admin 且未配置 ⇒ 告警读数。 */
export async function ensureBootstrap(db, bootstrap, { now = Date.now() } = {}) {
  if (countAdmins(db) > 0) return { action: "skipped", reason: "admin_present" } // 已存在不再读取（不重建 ∥ 不改密）
  if (!bootstrap) return { action: "warning", reason: "no_admin_no_bootstrap" }
  try {
    const { member } = await createMember(db, {
      username: bootstrap.username,
      name: bootstrap.username,
      role: "admin",
      password: bootstrap.password,
      now,
    })
    return { action: "created", username: member.username }
  } catch (e) {
    return {
      action: "warning",
      reason: "bootstrap_failed",
      message: `bootstrap 未建成：${e.message}（可用 CLI「member add <name> --role admin」补建）`,
    }
  }
}
