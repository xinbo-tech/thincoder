/**
 * report.mjs — 汇表面读（metering/METERING.md §2.3/§3——KD-SV-39）：summary ∥ totals ∥ key 窗 ∥ 成员月累计
 * （读 `usage_daily`——本地日粒度，窗沿取整含端日；API 形零变）+ 查询面共用件（过滤构建 ∥ 日/月键助手——
 * 明细/导出与汇表面**同一过滤面**；`usage.mjs` 复用其过滤构建并原址 re-export 保名面）。
 *
 * 数据源分面：明细 ∥ 导出 = `usage`（真源——毫秒精度零改）∥ summary/totals/key 窗/成员月累计 = 预聚合日表
 * （本地日粒度——窗沿取整含端日）。`model` 过滤 = 对外标识形；解析优先级：`endpoint = embeddings` 在场 ⇒
 * 全串按 `provider = ''`（嵌入命名空间——嵌入名可含斜杠，不切分）∥ 否则含斜杠 ⇒ `(provider, model)` 逐值对 ∥
 * 否则 ⇒ `provider = ''`。对外标识回拼 = `MODEL_REF_SQL`（嵌入行 `provider = ''` ⇒ 单段）。
 */
export const USAGE_SUMMARY_DAYS = 30 // 报表缺省时段（近 30 天——含今日；from 缺省 = 今日起回溯 30 个本地日）
export const KEY_USAGE_WINDOW_DAYS = 30 // key 窗口用量（近 30 天——`keyUsageStats`）

const DAY_MS = 24 * 60 * 60 * 1000

/** 对外标识回拼（`provider/model` 无损——两读面同源）：嵌入行 `provider = ''` ⇒ `model` 单段。 */
export const MODEL_REF_SQL = "CASE WHEN u.provider = '' THEN u.model ELSE u.provider || '/' || u.model END"

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
export function dayKey(ts) {
  const d = new Date(ts)
  const pad = (n) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** 本月初日键（`YYYY-MM-01`——成员月累计的日粒度窗沿；与日表 `day` 同空间）。 */
export function monthStartDay(ts = Date.now()) {
  const d = new Date(ts)
  const pad = (n) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-01`
}

/** `model` 过滤解析（METERING §3 优先级）：返回计数/查询两列的逐值对部分。 */
function modelFilterParts(model, endpoint) {
  if (endpoint === "embeddings") return { provider: "", model }
  const cut = model.indexOf("/")
  if (cut > 0 && cut < model.length - 1) return { provider: model.slice(0, cut), model: model.slice(cut + 1) }
  return { provider: "", model }
}

/** 过滤构建器（明细 ∥ 导出 ∥ 汇表面**同源**——METERING §3）：`null` = 不过滤；语义逐值一致。
 *  `daily = true` ⇒ 日表面：时段 `from`/`to`（unix ms）按**本地日取整含端日**折算为 `day` 区间。 */
export function buildUsageWhere({ memberId = null, model = null, endpoint = null, from = null, to = null, daily = false } = {}) {
  const where = []
  const args = []
  if (memberId !== null) {
    where.push("u.member_id = ?")
    args.push(memberId)
  }
  if (model !== null) {
    const parts = modelFilterParts(model, endpoint)
    where.push("u.provider = ?", "u.model = ?")
    args.push(parts.provider, parts.model)
  }
  if (endpoint !== null) {
    where.push("u.endpoint = ?")
    args.push(endpoint)
  }
  if (from !== null) {
    where.push(daily ? "u.day >= ?" : "u.ts >= ?")
    args.push(daily ? dayKey(from) : from)
  }
  if (to !== null) {
    where.push(daily ? "u.day <= ?" : "u.ts <= ?")
    args.push(daily ? dayKey(to) : to)
  }
  return { clause: where.length ? `WHERE ${where.join(" AND ")}` : "", args }
}

/** 窗口合计（总览「今日」与报表 `totals` **同源**——gateway/API.md §2.4 ∥ METERING §3）：`{ requests, totalTokens }`。
 *  读日表：`requests` = 请求数和（含 error/aborted）∥ `totalTokens` = token 和（NULL 计 0）。 */
export function usageTotals(db, { memberId = null, model = null, endpoint = null, from = null, to = null } = {}) {
  const { clause, args } = buildUsageWhere({ memberId, model, endpoint, from, to, daily: true })
  const row = db
    .prepare(`SELECT COALESCE(SUM(u.requests), 0) AS requests, COALESCE(SUM(u.total_tokens), 0) AS total_tokens FROM usage_daily u ${clause}`)
    .get(...args)
  return { requests: Number(row.requests), totalTokens: Number(row.total_tokens) }
}

/** 成员当月 token 累计（读日表——本地日粒度窗含端日；无行 ⇒ 0）。 */
export function monthlyTokensForMember(db, memberId, { now = Date.now() } = {}) {
  const row = db
    .prepare("SELECT COALESCE(SUM(total_tokens), 0) AS used FROM usage_daily WHERE member_id = ? AND day >= ?")
    .get(memberId, monthStartDay(now))
  return Number(row.used)
}

/** 全员当月累计（管理列表 ∥ CLI `member list`——Map memberId → used，避免 N+1；读日表同窗）。 */
export function monthlyTokensByMember(db, { now = Date.now() } = {}) {
  const rows = db
    .prepare("SELECT member_id, COALESCE(SUM(total_tokens), 0) AS used FROM usage_daily WHERE day >= ? GROUP BY member_id")
    .all(monthStartDay(now))
  return new Map(rows.map((row) => [row.member_id, Number(row.used)]))
}

/**
 * 用量报表（METERING §3——`GET /api/usage/summary`）：`{ totals, trend, byModel, byMember }`。
 * 时段缺省 = 近 30 天（`USAGE_SUMMARY_DAYS`——今日起回溯 30 个本地日；显式 `from`/`to` 照用）；
 * `trend` = 按日（服务器本地日界）**零填充全序列**；`byModel`/`byMember` = 降序聚合
 * （totalTokens 降序 ∥ 名称升序平手——聚合与排行同数据面）；`byModel` = provider×model 两列聚合（`model` = 回拼外标）。
 */
export function usageSummary(db, { memberId = null, model = null, endpoint = null, from = null, to = null, now = Date.now() } = {}) {
  const start = from ?? localDayStart(now, -(USAGE_SUMMARY_DAYS - 1))
  const filters = { memberId, model, endpoint, from: start, to }
  const { clause, args } = buildUsageWhere({ ...filters, daily: true })
  const totals = usageTotals(db, filters)
  const byDay = new Map(
    db
      .prepare(
        `SELECT u.day AS day, COALESCE(SUM(u.requests), 0) AS requests, COALESCE(SUM(u.total_tokens), 0) AS total_tokens
         FROM usage_daily u ${clause} GROUP BY u.day ORDER BY u.day`,
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
      `SELECT ${MODEL_REF_SQL} AS model, COALESCE(SUM(u.requests), 0) AS requests, COALESCE(SUM(u.total_tokens), 0) AS total_tokens
       FROM usage_daily u ${clause} GROUP BY u.provider, u.model ORDER BY total_tokens DESC, model ASC`,
    )
    .all(...args)
    .map((row) => ({ model: row.model, requests: Number(row.requests), totalTokens: Number(row.total_tokens) }))
  const byMember = db
    .prepare(
      `SELECT m.name AS member, COALESCE(SUM(u.requests), 0) AS requests, COALESCE(SUM(u.total_tokens), 0) AS total_tokens
       FROM usage_daily u JOIN members m ON m.id = u.member_id ${clause} GROUP BY u.member_id ORDER BY total_tokens DESC, m.name ASC`,
    )
    .all(...args)
    .map((row) => ({ member: row.member, requests: Number(row.requests), totalTokens: Number(row.total_tokens) }))
  return { totals, trend, byModel, byMember }
}

/**
 * key 归因读数（AC-15⑥——`memberView` 消费）：Map keyId → `{ lastUsedAt, windowTokens }`；
 * `lastUsedAt` = `MAX(ts)`（全时段——读 `usage` 真源）∥ `windowTokens` = 近 `KEY_USAGE_WINDOW_DAYS` 天 token 和
 * （日粒度窗——读 `usage_daily`；NULL 计 0）；从未使用 ⇒ 图内无键（消费侧缺省 `null`/`0`）。两张聚合一次取。
 */
export function keyUsageStats(db, { now = Date.now() } = {}) {
  const stats = new Map()
  for (const row of db.prepare("SELECT key_id, MAX(ts) AS last_used FROM usage GROUP BY key_id").all()) {
    stats.set(row.key_id, { lastUsedAt: row.last_used, windowTokens: 0 })
  }
  const windowStart = dayKey(now - KEY_USAGE_WINDOW_DAYS * DAY_MS)
  const windowRows = db
    .prepare("SELECT key_id, COALESCE(SUM(total_tokens), 0) AS tokens FROM usage_daily WHERE day >= ? GROUP BY key_id")
    .all(windowStart)
  for (const row of windowRows) {
    const entry = stats.get(row.key_id)
    if (entry) entry.windowTokens = Number(row.tokens)
    else stats.set(row.key_id, { lastUsedAt: null, windowTokens: Number(row.tokens) })
  }
  return stats
}
