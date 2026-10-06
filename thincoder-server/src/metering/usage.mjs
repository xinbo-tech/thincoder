/**
 * usage.mjs — 记账（metering/METERING.md §1）：行落库（KD-SV-8——请求终结后单条 INSERT） ∥
 * 明细查询 ∥ 成员月累计 ∥ 保留窗清理（`pruneUsage`——删除式；启动一次 + 24h 周期，入口接线） ∥
 * 报表聚合（`usageTotals`/`usageSummary`——趋势零填充） ∥ 导出查询（`exportUsageRows`——行数上限） ∥
 * key 归因（`keyUsageStats`——最后使用 ∥ 近 30 天用量；AC-15⑥）。
 *
 * 行形 = 一行/请求：成员 × 模型 × 时段（`ts`）× token；token 三列 = 上游 usage 原值（逐值不加工），
 * 上游未回 ⇒ 三列 NULL（status 照记实况）。
 * 过滤 = 同一 WHERE 构建器（明细 ∥ 聚合 ∥ 导出**同源**——METERING §3；`endpoint` 四读端点同门）。
 */
import { HttpError } from "../gateway/errors.mjs"
import { DEFAULT_USAGE_RETENTION_DAYS } from "../ops/config.mjs"

export const USAGE_LIMIT_DEFAULT = 100
export const USAGE_LIMIT_MAX = 500
export const USAGE_PRUNE_INTERVAL_MS = 24 * 60 * 60 * 1000 // 保留清理周期（24h——实现常量；入口接线）
export const USAGE_SUMMARY_DAYS = 30 // 报表缺省时段（近 30 天——含今日；from 缺省 = 今日起回溯 30 个本地日）
export const KEY_USAGE_WINDOW_DAYS = 30 // key 窗口用量（近 30 天——`keyUsageStats`）
export const USAGE_EXPORT_MAX = 100000 // 导出行数上限（常量注入口径——超 ⇒ 400）

const DAY_MS = 24 * 60 * 60 * 1000

const ENDPOINTS = ["chat", "embeddings"]
const STATUSES = ["ok", "error", "aborted"]

/** 明细行 SELECT（明细 ∥ 导出共用——行形 = METERING §3）。 */
const ROW_SELECT = `SELECT u.id, u.ts, u.endpoint, u.model, u.status, u.stream, u.prompt_tokens, u.completion_tokens,
       u.total_tokens, u.duration_ms, m.name AS member_name, k.key_hint
FROM usage u JOIN members m ON m.id = u.member_id JOIN api_keys k ON k.id = u.key_id`

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

/** 过滤构建器（明细 ∥ 聚合 ∥ 导出**同源**——METERING §3）：`null` = 不过滤；语义逐值一致。 */
function buildUsageWhere({ memberId = null, model = null, endpoint = null, from = null, to = null } = {}) {
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
  if (endpoint !== null) {
    where.push("u.endpoint = ?")
    args.push(endpoint)
  }
  if (from !== null) {
    where.push("u.ts >= ?")
    args.push(from)
  }
  if (to !== null) {
    where.push("u.ts <= ?")
    args.push(to)
  }
  return { clause: where.length ? `WHERE ${where.join(" AND ")}` : "", args }
}

/** 行形映射（明细 ∥ 导出共用——camelCase；`ts` 原样 unix ms，页面本地化显示）。 */
function mapUsageRow(row) {
  return {
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
  }
}

/**
 * 明细查询（METERING §3 行形；倒序新在前）。
 * 过滤：`{ memberId, model, endpoint, from, to, limit }`（null = 不过滤；limit 夹在 1..USAGE_LIMIT_MAX）。
 */
export function queryUsage(db, { memberId = null, model = null, endpoint = null, from = null, to = null, limit = USAGE_LIMIT_DEFAULT } = {}) {
  const { clause, args } = buildUsageWhere({ memberId, model, endpoint, from, to })
  const capped = Math.min(Math.max(1, Number.isInteger(limit) ? limit : USAGE_LIMIT_DEFAULT), USAGE_LIMIT_MAX)
  const rows = db.prepare(`${ROW_SELECT} ${clause} ORDER BY u.ts DESC, u.id DESC LIMIT ?`).all(...args, capped)
  return rows.map(mapUsageRow)
}

/**
 * 窗口合计（总览「今日」与报表 `totals` **同源**——gateway/API.md §2.4）：`{ requests, totalTokens }`。
 * `requests` = 行数（含 error/aborted）∥ `totalTokens` = `SUM(total_tokens)`（NULL 不计）。
 */
export function usageTotals(db, { memberId = null, model = null, endpoint = null, from = null, to = null } = {}) {
  const { clause, args } = buildUsageWhere({ memberId, model, endpoint, from, to })
  const row = db
    .prepare(`SELECT COUNT(*) AS requests, COALESCE(SUM(u.total_tokens), 0) AS total_tokens FROM usage u ${clause}`)
    .get(...args)
  return { requests: Number(row.requests), totalTokens: Number(row.total_tokens) }
}

/** 本地日界（服务器本地时区——报表按日归并 ∥ 总览今日窗共用）：`ts` 所在自然日 +`days` 的 00:00（ms）；
 *  正午锚 + 进位——时区跳变不跨日。 */
export function localDayStart(ts, days = 0) {
  const d = new Date(ts)
  d.setHours(12, 0, 0, 0)
  d.setDate(d.getDate() + days)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/** 本地日键（`YYYY-MM-DD`——与 SQL `strftime(…, 'localtime')` 同形；服务器本地时区）。 */
function dayKey(ts) {
  const d = new Date(ts)
  const pad = (n) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/**
 * 用量报表（METERING §3——`GET /api/usage/summary`）：`{ totals, trend, byModel, byMember }`。
 * 时段缺省 = 近 30 天（`USAGE_SUMMARY_DAYS`——今日起回溯 30 个本地日；显式 `from`/`to` 照用）；
 * `trend` = 按日（服务器本地日界）**零填充全序列**；`byModel`/`byMember` = 降序聚合
 * （totalTokens 降序 ∥ 名称升序平手——聚合与排行同数据面）。
 */
export function usageSummary(db, { memberId = null, model = null, endpoint = null, from = null, to = null, now = Date.now() } = {}) {
  const start = from ?? localDayStart(now, -(USAGE_SUMMARY_DAYS - 1))
  const filters = { memberId, model, endpoint, from: start, to }
  const { clause, args } = buildUsageWhere(filters)
  const totals = usageTotals(db, filters)
  const byDay = new Map(
    db
      .prepare(
        `SELECT strftime('%Y-%m-%d', ts / 1000, 'unixepoch', 'localtime') AS day, COUNT(*) AS requests,
                COALESCE(SUM(total_tokens), 0) AS total_tokens
         FROM usage u ${clause} GROUP BY day ORDER BY day`,
      )
      .all(...args)
      .map((row) => [row.day, row]),
  )
  const trend = []
  const lastDay = localDayStart(to ?? now)
  for (let day = localDayStart(start); day <= lastDay; day = localDayStart(day, 1)) {
    const hit = byDay.get(dayKey(day))
    trend.push({ day: dayKey(day), requests: hit ? Number(hit.requests) : 0, totalTokens: hit ? Number(hit.total_tokens) : 0 })
  }
  const byModel = db
    .prepare(
      `SELECT u.model AS model, COUNT(*) AS requests, COALESCE(SUM(u.total_tokens), 0) AS total_tokens
       FROM usage u ${clause} GROUP BY u.model ORDER BY total_tokens DESC, u.model ASC`,
    )
    .all(...args)
    .map((row) => ({ model: row.model, requests: Number(row.requests), totalTokens: Number(row.total_tokens) }))
  const byMember = db
    .prepare(
      `SELECT m.name AS member, COUNT(*) AS requests, COALESCE(SUM(u.total_tokens), 0) AS total_tokens
       FROM usage u JOIN members m ON m.id = u.member_id ${clause} GROUP BY u.member_id ORDER BY total_tokens DESC, m.name ASC`,
    )
    .all(...args)
    .map((row) => ({ member: row.member, requests: Number(row.requests), totalTokens: Number(row.total_tokens) }))
  return { totals, trend, byModel, byMember }
}

/**
 * 导出查询（METERING §3——`GET /api/usage/export` 数据面）：同过滤面、倒序（同明细口径）；
 * 行数 > `max`（缺省 `USAGE_EXPORT_MAX`——常量注入口径）⇒ 400（收窄时段提示）。
 */
export function exportUsageRows(db, { memberId = null, model = null, endpoint = null, from = null, to = null, max = USAGE_EXPORT_MAX } = {}) {
  const { clause, args } = buildUsageWhere({ memberId, model, endpoint, from, to })
  const rows = db.prepare(`${ROW_SELECT} ${clause} ORDER BY u.ts DESC, u.id DESC LIMIT ?`).all(...args, max + 1)
  if (rows.length > max) throw new HttpError("invalid_request_error", `导出行数超过上限（${max}）——请收窄时段`)
  return rows.map(mapUsageRow)
}

/**
 * key 归因读数（AC-15⑥——`memberView` 消费）：Map keyId → `{ lastUsedAt, windowTokens }`；
 * `lastUsedAt` = `MAX(ts)`（全时段）∥ `windowTokens` = 近 `KEY_USAGE_WINDOW_DAYS` 天 `SUM(total_tokens)`（NULL 不计）；
 * 从未使用 ⇒ 图内无键（消费侧缺省 `null`/`0`）。两张聚合一次取——全员装配免 N+1。
 */
export function keyUsageStats(db, { now = Date.now() } = {}) {
  const stats = new Map()
  for (const row of db.prepare("SELECT key_id, MAX(ts) AS last_used FROM usage GROUP BY key_id").all()) {
    stats.set(row.key_id, { lastUsedAt: row.last_used, windowTokens: 0 })
  }
  const windowStart = now - KEY_USAGE_WINDOW_DAYS * DAY_MS
  const windowRows = db
    .prepare("SELECT key_id, COALESCE(SUM(total_tokens), 0) AS tokens FROM usage WHERE ts >= ? GROUP BY key_id")
    .all(windowStart)
  for (const row of windowRows) {
    const entry = stats.get(row.key_id)
    if (entry) entry.windowTokens = Number(row.tokens)
    else stats.set(row.key_id, { lastUsedAt: null, windowTokens: Number(row.tokens) })
  }
  return stats
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

/** 查询参数解析（四读端点同门）：`endpoint` ∈ chat ∥ embeddings（缺省 = 不过滤；非法值 ⇒ 400）。 */
export function parseUsageEndpoint(raw) {
  if (raw === null || raw === "") return null
  if (raw === "chat" || raw === "embeddings") return raw
  throw new HttpError("invalid_request_error", `endpoint 非法：${raw}（chat ∥ embeddings）`)
}
