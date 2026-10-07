/**
 * usage.mjs — 记账（metering/METERING.md §1——KD-SV-8：请求终结后**同一事务三写**） ∥ 明细查询 ∥
 * 导出查询（`exportUsageRows`——行数上限） ∥ 保留窗清理（`pruneUsage`——删除式：usage + 派生两表同事务同窗；
 * 启动一次 + 24h 周期，入口接线）。
 *
 * 行形 = 一行/请求：成员 × key × 模型（**`provider` ∥ `model` 两字段**——对外标识 `provider/model` 无损回拼；
 * 嵌入行 `provider = ''`）× 时段（`ts`）× token；token 三列 = 上游 usage 原值（逐值不加工），上游未回 ⇒ 三列 NULL
 * （status 照记实况）。派生两表（`usage_daily` ∥ `quota_counters`）= 同事务 upsert（aggregates.mjs）。
 * 汇表面读（summary/totals/key 窗/成员月累计）∥ 过滤构建 ∥ 时间助手 = `report.mjs`——本址 re-export 保名面（读侧零改）。
 * 过滤 = 同一 WHERE 构建器（明细 ∥ 聚合 ∥ 导出**同源**——METERING §3；`endpoint` 四读端点同门）。
 */
import { HttpError } from "../gateway/errors.mjs"
import { DEFAULT_USAGE_RETENTION_DAYS } from "../ops/config.mjs"
import { bumpDerived, pruneDerived } from "./aggregates.mjs"
import { buildUsageWhere, MODEL_REF_SQL } from "./report.mjs"

export const USAGE_LIMIT_DEFAULT = 100
export const USAGE_LIMIT_MAX = 500
export const USAGE_PRUNE_INTERVAL_MS = 24 * 60 * 60 * 1000 // 保留清理周期（24h——实现常量；入口接线）
export const USAGE_EXPORT_MAX = 100000 // 导出行数上限（常量注入口径——超 ⇒ 400）

// 汇表面读 ∥ 过滤面共用件（report.mjs——原址 re-export 保名面：既有调用方零改；新代码按需直取 report.mjs）
export {
  KEY_USAGE_WINDOW_DAYS,
  USAGE_SUMMARY_DAYS,
  keyUsageStats,
  localDayStart,
  monthlyTokensByMember,
  monthlyTokensForMember,
  usageSummary,
  usageTotals,
} from "./report.mjs"

const DAY_MS = 24 * 60 * 60 * 1000

const ENDPOINTS = ["chat", "embeddings"]
const STATUSES = ["ok", "error", "aborted"]

/** 明细行 SELECT（明细 ∥ 导出共用——行形 = METERING §3；`model` = 对外标识回拼）。 */
const ROW_SELECT = `SELECT u.id, u.ts, u.endpoint, ${MODEL_REF_SQL} AS model, u.status, u.stream, u.prompt_tokens, u.completion_tokens,
       u.total_tokens, u.duration_ms, m.name AS member_name, k.key_hint
FROM usage u JOIN members m ON m.id = u.member_id JOIN api_keys k ON k.id = u.key_id`

/**
 * 落一条 usage 行 + 派生两表（**同事务三写**——METERING §1；任一步失败 ⇒ 整滚，派生面零漂移）：返回行 id。
 * `{ ts = now, memberId, keyId, endpoint, provider = "", model, status, stream = false, promptTokens = null,
 *    completionTokens = null, totalTokens = null, durationMs = 0 }`——`provider`/`model` = 拆列两字段
 * （chat 行 = provider 名 + 上游模型名；嵌入行 = `''` + 引擎模型名）。
 */
export function recordUsage(db, row) {
  const {
    ts = Date.now(),
    memberId,
    keyId,
    endpoint,
    provider = "",
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
  if (typeof provider !== "string" || typeof model !== "string" || model === "") {
    throw new Error(`模型标识非法：provider=${JSON.stringify(provider)} model=${JSON.stringify(model)}（provider 字符串 ∥ model 非空）`)
  }
  db.exec("BEGIN")
  try {
    const info = db
      .prepare(
        `INSERT INTO usage (ts, member_id, key_id, endpoint, provider, model, status, stream,
           prompt_tokens, completion_tokens, total_tokens, duration_ms)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(ts, memberId, keyId, endpoint, provider, model, status, stream ? 1 : 0, promptTokens, completionTokens, totalTokens, durationMs)
    bumpDerived(db, { ts, memberId, keyId, endpoint, provider, model, status, promptTokens, completionTokens, totalTokens, durationMs })
    db.exec("COMMIT")
    return Number(info.lastInsertRowid)
  } catch (e) {
    db.exec("ROLLBACK")
    throw e
  }
}

/**
 * 保留窗清理（METERING §1 ∥ KD-SV-22——删除式）：删 `ts < now - retentionDays 天` 的行（走 `idx_usage_ts`）；
 * 派生两表**同事务同窗**（日表 `day <` 界日 ∥ 计数表 `month <` 界月——aggregates.mjs）；
 * `retentionDays = null` ⇒ 不限（零删——显式开）；返回 usage 删除行数。
 * 时机 = 启动一次 + 每 24h（`USAGE_PRUNE_INTERVAL_MS`——入口接线）；查询面零改（窗外行自然不在结果）。
 */
export function pruneUsage(db, { now = Date.now(), retentionDays = DEFAULT_USAGE_RETENTION_DAYS } = {}) {
  if (retentionDays === null) return 0
  const cutoff = now - retentionDays * DAY_MS
  db.exec("BEGIN")
  try {
    const removed = Number(db.prepare("DELETE FROM usage WHERE ts < ?").run(cutoff).changes)
    pruneDerived(db, { cutoff })
    db.exec("COMMIT")
    return removed
  } catch (e) {
    db.exec("ROLLBACK")
    throw e
  }
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
 * 导出查询（METERING §3——`GET /api/usage/export` 数据面）：同过滤面、倒序（同明细口径）；
 * 行数 > `max`（缺省 `USAGE_EXPORT_MAX`——常量注入口径）⇒ 400（收窄时段提示）。
 */
export function exportUsageRows(db, { memberId = null, model = null, endpoint = null, from = null, to = null, max = USAGE_EXPORT_MAX } = {}) {
  const { clause, args } = buildUsageWhere({ memberId, model, endpoint, from, to })
  const rows = db.prepare(`${ROW_SELECT} ${clause} ORDER BY u.ts DESC, u.id DESC LIMIT ?`).all(...args, max + 1)
  if (rows.length > max) throw new HttpError("invalid_request_error", `导出行数超过上限（${max}）——请收窄时段`)
  return rows.map(mapUsageRow)
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
