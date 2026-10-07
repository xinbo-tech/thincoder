/**
 * keys.mjs — 团队 key 面（accounts/ACCOUNTS.md §1）：签发 ∥ 校验 ∥ 吊销 ∥ 轮转（页面与 CLI 共用）。
 *
 * 形：`sk-tc-` + 32 字节随机（base64url——43 字符）；存储 = `sha256(明文)` hex（单列唯一——库内无明文）；
 * 明文仅签发时回显一次（此后只留提示形 `sk-tc-ab12cd…wxyz`）。
 * 校验 = 逐请求查库（KD-SV-11——无缓存；吊销下一次请求即判）；成员行携 `modelQuotas`（分模型覆盖）
 * 与 `modelDisables`（模型禁用集）——均随鉴权行零查询（KD-SV-38 ∥ KD-SV-42）。
 */
import { createHash, randomBytes } from "node:crypto"

import { parseModelDisables, parseModelQuotas } from "./members.mjs"

export const KEY_PREFIX = "sk-tc-"

/** 签发：新明文（调用方负责一次性回显）。 */
export function generateApiKey() {
  return KEY_PREFIX + randomBytes(32).toString("base64url")
}

/** 提示形（列表/清单用——无明文）。 */
export function keyHint(plain) {
  return `${plain.slice(0, 12)}…${plain.slice(-4)}`
}

/** 存储形：sha256(明文) hex。 */
export function hashKey(plain) {
  return createHash("sha256").update(plain).digest("hex")
}

/** 校验（KD-SV-11）：active 命中 ⇒ `{ keyId, memberId, member }`（成员行携 `modelQuotas` ∥ `modelDisables`——随行）；
 *  未知 ∥ 吊销一律 null（不区分——防信息泄露）。 */
export function verifyKey(db, plain) {
  if (typeof plain !== "string" || !plain.startsWith(KEY_PREFIX)) return null
  const row = db
    .prepare(
      `SELECT k.id AS key_id, k.member_id, m.username, m.name, m.role, m.model_quotas_json, m.model_disabled_json
       FROM api_keys k JOIN members m ON m.id = k.member_id
       WHERE k.key_hash = ? AND k.status = 'active'`,
    )
    .get(hashKey(plain))
  if (!row) return null
  return {
    keyId: row.key_id,
    memberId: row.member_id,
    member: {
      id: row.member_id,
      username: row.username,
      name: row.name,
      role: row.role,
      modelQuotas: parseModelQuotas(row.model_quotas_json),
      modelDisables: parseModelDisables(row.model_disabled_json),
    },
  }
}

/** 签发一行（新行——轮转不复用旧行）：`{ id, plain, hint }`。 */
export function issueKey(db, memberId, { now = Date.now() } = {}) {
  const plain = generateApiKey()
  const hint = keyHint(plain)
  const info = db
    .prepare("INSERT INTO api_keys (member_id, key_hash, key_hint, status, created_at) VALUES (?, ?, ?, 'active', ?)")
    .run(memberId, hashKey(plain), hint, new Date(now).toISOString())
  return { id: Number(info.lastInsertRowid), plain, hint }
}

/** 单 key 读数（含吊销行；无 ⇒ null）。 */
export function getKeyById(db, keyId) {
  if (!Number.isInteger(keyId)) return null
  return db.prepare("SELECT * FROM api_keys WHERE id = ?").get(keyId) ?? null
}

/** 按提示形寻址（CLI `key revoke <hint>`——不唯一 ⇒ 返回多行，由调用方拒）。 */
export function findKeysByHint(db, hint) {
  return db.prepare("SELECT * FROM api_keys WHERE key_hint = ? ORDER BY id").all(hint)
}

/** 成员未吊销 key 清单（提示形 + id——管理列表 ∥ `/api/me` 数据源；KD-SV-16）。 */
export function activeKeysOf(db, memberId) {
  return db.prepare("SELECT id, key_hint, created_at FROM api_keys WHERE member_id = ? AND status = 'active' ORDER BY id").all(memberId)
}

/** key 清单（CLI `key list`——含吊销行 + 成员名）。 */
export function listKeys(db, { memberId = null } = {}) {
  const where = memberId === null ? "" : "WHERE k.member_id = ?"
  const args = memberId === null ? [] : [memberId]
  return db
    .prepare(
      `SELECT k.id, k.key_hint, k.status, k.created_at, k.revoked_at, m.name AS member_name
       FROM api_keys k JOIN members m ON m.id = k.member_id ${where} ORDER BY k.id`,
    )
    .all(...args)
}

/** 吊销（软删——行保留）：已吊销 ∥ 不存在 ⇒ 无变更；返回是否本次变更（调用方按需幂等）。 */
export function revokeKey(db, keyId, { now = Date.now() } = {}) {
  const info = db
    .prepare("UPDATE api_keys SET status = 'revoked', revoked_at = ? WHERE id = ? AND status = 'active'")
    .run(new Date(now).toISOString(), keyId)
  return Number(info.changes) > 0
}

/** 轮转（§1）：吊销该成员全部 active key + 新签一枚（无旧 ⇒ 等同首签）。 */
export function rotateKey(db, memberId, { now = Date.now() } = {}) {
  db.prepare("UPDATE api_keys SET status = 'revoked', revoked_at = ? WHERE member_id = ? AND status = 'active'").run(
    new Date(now).toISOString(),
    memberId,
  )
  return issueKey(db, memberId, { now })
}
