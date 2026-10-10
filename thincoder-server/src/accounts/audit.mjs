/**
 * audit.mjs — 审计事件（accounts/ACCOUNTS.md §2.1 ∥ KD-SV-28；表 = store/STORE.md §2 v3）：
 * 落库（`recordAudit`——调用侧显式传型/主体，HTTP 路由与 CLI 同覆盖） ∥ 列表查询（`queryAudit`——过滤/分页）
 * ∥ 保留窗清理（`pruneAuditEvents`——与用量同窗同清，入口接线）。
 *
 * 名快照：`actor` ∥ `target` = 落库时点名（改名后记录仍可读——列无 FK）；CLI 口径 = `actor = "cli"`（actorId NULL）。
 */
import { HttpError } from "../gateway/errors.mjs"
import { DEFAULT_USAGE_RETENTION_DAYS } from "../ops/config.mjs"

/** 事件目录（十三型——与 `audit_events.type` CHECK 同集；v10 扩 `config_update`——配置控制台批；
 *  v11 扩 `sandbox_rule`（规则增删——detail = { action, rule }）∥ `sandbox_event`（沙盒事件——detail.kind：审批三态/超时 ∥
 *  盒起停拆 ∥ runner 注册/排空/删除 ∥ join 失败 ∥ 快照——server-exec-sandbox 批）；
 *  v14 扩 `agent_event`（管理面 agent 会话——detail.kind：chat_start ∥ chat_call ∥ chat_stop——admin-agent-chat 批 · KD-SV-91）。 */
export const AUDIT_TYPES = Object.freeze([
  "login_success",
  "login_failure",
  "login_locked",
  "key_rotate",
  "key_issue",
  "key_revoke",
  "password_change",
  "password_reset",
  "member_create",
  "config_update",
  "sandbox_rule",
  "sandbox_event",
  "agent_event",
])

export const AUDIT_LIMIT_DEFAULT = 100 // 列表缺省行数（沿用量口径——METERING §3）
export const AUDIT_LIMIT_MAX = 500     // 列表上限（同上）

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * 落一条审计事件（事件目录 = §2.1 十三型——调用侧显式传型/主体）：返回行 id。
 * `{ type, actor, actorId = null, target = "", targetId = null, detail = {}, ts = Date.now() }`。
 */
export function recordAudit(db, { type, actor, actorId = null, target = "", targetId = null, detail = {}, ts = Date.now() } = {}) {
  if (!AUDIT_TYPES.includes(type)) throw new Error(`审计类型非法：${String(type)}（${AUDIT_TYPES.join(" ∥ ")}）`)
  if (typeof actor !== "string") throw new Error("审计缺 actor（行为人名快照——字符串）")
  const info = db
    .prepare(
      `INSERT INTO audit_events (ts, type, actor_id, actor_name, target_id, target_name, detail)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(ts, type, actorId, actor, targetId, target, JSON.stringify(detail))
  return Number(info.lastInsertRowid)
}

/**
 * 列表查询（`GET /api/audit` 数据面——倒序新在前）：过滤 `type`（十三型枚举——非法 ⇒ 400）∥ `memberId`
 * （解析后 = 成员 id——匹配 actor_id ∥ target_id，同 usage 口径）∥ `from`/`to`（unix ms）。
 * `limit` 夹在 1..`AUDIT_LIMIT_MAX`（缺省 100——沿用量口径）。
 */
export function queryAudit(db, { type = null, memberId = null, from = null, to = null, limit = AUDIT_LIMIT_DEFAULT } = {}) {
  if (type !== null && !AUDIT_TYPES.includes(type)) {
    throw new HttpError("invalid_request_error", `审计类型非法：${type}（${AUDIT_TYPES.join(" ∥ ")}）`)
  }
  const where = []
  const args = []
  if (type !== null) {
    where.push("type = ?")
    args.push(type)
  }
  if (memberId !== null) {
    where.push("(actor_id = ? OR target_id = ?)")
    args.push(memberId, memberId)
  }
  if (from !== null) {
    where.push("ts >= ?")
    args.push(from)
  }
  if (to !== null) {
    where.push("ts <= ?")
    args.push(to)
  }
  const capped = Math.min(Math.max(1, Number.isInteger(limit) ? limit : AUDIT_LIMIT_DEFAULT), AUDIT_LIMIT_MAX)
  const rows = db
    .prepare(
      `SELECT id, ts, type, actor_id, actor_name, target_id, target_name, detail FROM audit_events
       ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
       ORDER BY ts DESC, id DESC LIMIT ?`,
    )
    .all(...args, capped)
  return rows.map((row) => ({
    id: row.id,
    ts: row.ts,
    type: row.type,
    actor: row.actor_name,
    actorId: row.actor_id,
    target: row.target_name,
    targetId: row.target_id,
    detail: decodeDetail(row.detail),
  }))
}

/** 保留窗清理（§2.1——与用量同窗同清）：删 `ts < now - 窗` 的行（走 `idx_audit_ts`）；
 *  `retentionDays = null` ⇒ 不限（零删）；返回删除行数。时机 = 启动一次 + 24h 同调度点（入口接线）。 */
export function pruneAuditEvents(db, { now = Date.now(), retentionDays = DEFAULT_USAGE_RETENTION_DAYS } = {}) {
  if (retentionDays === null) return 0
  const cutoff = now - retentionDays * DAY_MS
  return Number(db.prepare("DELETE FROM audit_events WHERE ts < ?").run(cutoff).changes)
}

/** `detail` 解码（JSON 对象；畸形行 ⇒ 空对象——一行坏数据不拖垮列表）。 */
function decodeDetail(text) {
  try {
    const value = JSON.parse(text)
    return value !== null && typeof value === "object" ? value : {}
  } catch {
    return {}
  }
}
