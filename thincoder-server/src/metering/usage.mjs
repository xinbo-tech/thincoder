/**
 * usage.mjs — 记账（metering/METERING.md §1）：行落库（KD-SV-8——请求终结后单条 INSERT） ∥
 * 明细查询 ∥ 成员月累计 ∥ 保留窗清理（`pruneUsage`——删除式；启动一次 + 24h 周期，入口接线）。
 *
 * 行形 = 一行/请求：成员 × 模型 × 时段（`ts`）× token；token 三列 = 上游 usage 原值（逐值不加工），
 * 上游未回 ⇒ 三列 NULL（status 照记实况）。
 */
import { HttpError } from "../gateway/errors.mjs"
import { DEFAULT_USAGE_RETENTION_DAYS } from "../ops/config.mjs"

export const USAGE_LIMIT_DEFAULT = 100
export const USAGE_LIMIT_MAX = 500
export const USAGE_PRUNE_INTERVAL_MS = 24 * 60 * 60 * 1000 // 保留清理周期（24h——实现常量；入口接线）

const DAY_MS = 24 * 60 * 60 * 1000

const ENDPOINTS = ["chat", "embeddings"]
const STATUSES = ["ok", "error", "aborted"]

/**
 * 落一条 usage 行（D3 消费接口——按形就位）：返回行 id。
 * `{ ts = now, memberId, keyId, endpoint, model, status, stream = false, promptTokens = null,
 *    completionTokens = null, totalTokens = null, durationMs = 0 }`。
 */
export function recordUsage(db, row) {
  const {
    ts = Date.now(),
    memberId,
    keyId,
    endpoint,
    model,
    status,
    stream = false,
    promptTokens = null,
    completionTokens = null,
    totalTokens = null,
    durationMs = 0,
  } = row ?? {}
  if (!ENDPOINTS.includes(endpoint)) throw new Error(`endpoint 非法：${endpoint}（chat ∥ embeddings）`)
  if (!STATUSES.includes(status)) throw new Error(`status 非法：${status}（ok ∥ error ∥ aborted）`)
  const info = db
    .prepare(
      `INSERT INTO usage (ts, member_id, key_id, endpoint, model, status, stream,
         prompt_tokens, completion_tokens, total_tokens, duration_ms)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(ts, memberId, keyId, endpoint, model, status, stream ? 1 : 0, promptTokens, completionTokens, totalTokens, durationMs)
  return Number(info.lastInsertRowid)
}

/** 自然月窗口起点（服务器本地时区——KD-SV-6）。 */
export function monthStart(now = Date.now()) {
  const d = new Date(now)
  return new Date(d.getFullYear(), d.getMonth(), 1).getTime()
}

/** 成员当月 token 累计（`SUM(total_tokens)`——NULL 不计；无行 ⇒ 0）。 */
export function monthlyTokensForMember(db, memberId, { now = Date.now() } = {}) {
  const row = db
    .prepare("SELECT COALESCE(SUM(total_tokens), 0) AS used FROM usage WHERE member_id = ? AND ts >= ?")
    .get(memberId, monthStart(now))
  return Number(row.used)
}

/** 全员当月累计（管理列表 ∥ CLI `member list`——Map memberId → used，避免 N+1）。 */
export function monthlyTokensByMember(db, { now = Date.now() } = {}) {
  const rows = db
    .prepare("SELECT member_id, COALESCE(SUM(total_tokens), 0) AS used FROM usage WHERE ts >= ? GROUP BY member_id")
    .all(monthStart(now))
  return new Map(rows.map((row) => [row.member_id, Number(row.used)]))
}

/**
 * 保留窗清理（METERING §1 ∥ KD-SV-22——删除式）：删 `ts < now - retentionDays 天` 的行（走 `idx_usage_ts`）；
 * `retentionDays = null` ⇒ 不限（零删——显式开）；返回删除行数。
 * 时机 = 启动一次 + 每 24h（`USAGE_PRUNE_INTERVAL_MS`——入口接线）；查询面零改（窗外行自然不在结果）。
 */
export function pruneUsage(db, { now = Date.now(), retentionDays = DEFAULT_USAGE_RETENTION_DAYS } = {}) {
  if (retentionDays === null) return 0
  const cutoff = now - retentionDays * DAY_MS
  return Number(db.prepare("DELETE FROM usage WHERE ts < ?").run(cutoff).changes)
}

/**
 * 明细查询（METERING §3 行形——camelCase；`ts` 原样 unix ms，页面本地化显示）。
 * 过滤：`{ memberId, model, from, to, limit }`（null = 不过滤；limit 夹在 1..USAGE_LIMIT_MAX）；倒序（新在前）。
 */
export function queryUsage(db, { memberId = null, model = null, from = null, to = null, limit = USAGE_LIMIT_DEFAULT } = {}) {
  const where = []
  const args = []
  if (memberId !== null) {
    where.push("u.member_id = ?")
    args.push(memberId)
  }
  if (model !== null) {
    where.push("u.model = ?")
    args.push(model)
  }
  if (from !== null) {
    where.push("u.ts >= ?")
    args.push(from)
  }
  if (to !== null) {
    where.push("u.ts <= ?")
    args.push(to)
  }
  const capped = Math.min(Math.max(1, Number.isInteger(limit) ? limit : USAGE_LIMIT_DEFAULT), USAGE_LIMIT_MAX)
  const rows = db
    .prepare(
      `SELECT u.id, u.ts, u.endpoint, u.model, u.status, u.stream, u.prompt_tokens, u.completion_tokens,
              u.total_tokens, u.duration_ms, m.name AS member_name, k.key_hint
       FROM usage u JOIN members m ON m.id = u.member_id JOIN api_keys k ON k.id = u.key_id
       ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
       ORDER BY u.ts DESC, u.id DESC LIMIT ?`,
    )
    .all(...args, capped)
  return rows.map((row) => ({
    id: row.id,
    ts: row.ts,
    member: row.member_name,
    keyHint: row.key_hint,
    endpoint: row.endpoint,
    model: row.model,
    status: row.status,
    stream: row.stream === 1,
    promptTokens: row.prompt_tokens,
    completionTokens: row.completion_tokens,
    totalTokens: row.total_tokens,
    durationMs: row.duration_ms,
  }))
}

/** 查询参数解析（路由共用）：limit 缺省 100（非正整数 ⇒ 400）；显式上限在 `queryUsage` 夹 500。 */
export function parseUsageLimit(raw) {
  if (raw === null || raw === "") return USAGE_LIMIT_DEFAULT
  const n = Number(raw)
  if (!Number.isInteger(n) || n < 1) throw new HttpError("invalid_request_error", `limit 非法：${raw}（正整数）`)
  return n
}

/** 查询参数解析（路由共用）：from/to = unix ms（缺省不过滤；非数 ⇒ 400）。 */
export function parseUsageTime(raw, label) {
  if (raw === null || raw === "") return null
  const n = Number(raw)
  if (!Number.isFinite(n)) throw new HttpError("invalid_request_error", `${label} 非法：${raw}（unix ms）`)
  return n
}
