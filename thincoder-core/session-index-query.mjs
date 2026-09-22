/**
 * session-index-query.mjs — 索引查询与 FTS 检索（SESSION.md §6.19 D-SE47；查询面）。
 *
 * `session-index.mjs` 的 >300 软线二分产物（设计「跨档线拆分预案」：DDL / 打开与自愈 ∥
 * 查询与 FTS 检索）。路由判据 / 语义分面 = §6.19 查询面路由表：
 *   · 单会话（`path=<文件>` ∈ sessions 根 ∧ 库内有行）——`keyword` = 子串（`LIKE`，既有契约不变）
 *   · 跨会话（`path:"all"`）——`keyword` = FTS 词 / 短语（`buildFtsQuery` 单源）；无词元 ⇒ 退化 `LIKE`
 * 两者过滤面同义对齐 JSON 回落路径（role / tool / since-until / limit / direction）；输出恒时间序。
 * 本档不持 `node:sqlite`（句柄由调用侧传入）——消费侧仍一律动态 import（装配面纪律同族）。
 */
import { buildFtsQuery } from "./fts-text.mjs"
import { DEFAULT_QUERY_LIMIT, MAX_QUERY_LIMIT, capArguments, findSessionByFile } from "./session-index.mjs"

/** `LIKE` 元字符按字面转义（`%` / `_` / `\` + `ESCAPE '\'`——keyword 恒字面匹配）。 */
export function likePattern(keyword) {
  return `%${String(keyword).replace(/[\\%_]/g, (c) => "\\" + c)}%`
}

/** 恒时间序键（`all` 面：无 ts 行恒末尾；`rowid` 末端决胜）；单会话面用会话内序 `idx`
 *  （= JSON 面 `history` 数组序 / 存储面 `iterate` 序——两路逐条相等的地基）。 */
const SESSION_CHRONO = ["m.idx"]
const ALL_CHRONO = ["(m.ts IS NULL)", "m.ts", "m.idx", "m.rowid"]
/** FTS 词元可用性：关键词须含至少一个字母 / 数字（= unicode61 的 token 主体）——否则 FTS 短语
 *  无词元（零命中）而契约要求「按字面 LIKE」（§6.19 边界情形表退化路径）。 */
const FTS_USABLE = /[\p{L}\p{N}]/u

/** AND 过滤面（JSON 面 `matches` 的同义 SQL：role / keyword / tool（名字 ∪ 声明）/ since-until）。 */
function filterClause({ role, like, tool, since, until }) {
  const where = []
  const args = []
  const s = since ?? null
  const u = until ?? null
  if (role !== undefined && role !== null) { where.push("m.role = ?"); args.push(role) }
  if (like) { where.push("m.content LIKE ? ESCAPE '\\'"); args.push(like) }
  if (tool) {
    where.push("((m.role = 'tool' AND m.name = ?) OR (m.role = 'assistant' AND EXISTS (SELECT 1 FROM tool_calls tc WHERE tc.sid = m.sid AND tc.msg_idx = m.idx AND tc.name = ?)))")
    args.push(tool, tool)
  }
  if (s !== null || u !== null) {
    where.push("m.ts IS NOT NULL")
    if (s !== null) { where.push("m.ts >= ?"); args.push(s) }
    if (u !== null) { where.push("m.ts <= ?"); args.push(u) }
  }
  return { where, args }
}

/** 时间序 + direction 取端（newest = 最新端）；返回恒时间序（`formatMatches` 语义零改）。
 *  方向缀逐项展开（`ORDER BY a, b DESC` 只作用末项——按项渲染）。 */
function windowed(db, select, { where, args }, { direction, limit, order }) {
  const cond = where.length ? ` WHERE ${where.join(" AND ")}` : ""
  const desc = direction !== "oldest"
  const dir = desc ? "DESC" : "ASC"
  const n = Number.isFinite(limit) ? Math.min(Math.max(1, Math.floor(limit)), MAX_QUERY_LIMIT) : DEFAULT_QUERY_LIMIT
  const rows = db.prepare(`${select}${cond} ORDER BY ${order.map((c) => `${c} ${dir}`).join(", ")} LIMIT ?`).all(...args, n)
  return attachCalls(db, desc ? rows.reverse() : rows)
}

/** 附声明行（`[{name, arguments}]`——输出上限 300 字符 = 存储面同值；无声明不动形）。 */
function attachCalls(db, rows) {
  for (const r of rows) {
    const calls = toolCallsFor(db, r.sid, r.idx)
    if (calls.length > 0) r.tool_calls = calls
  }
  return rows
}

/** 单会话索引检索（keyword = 子串 `LIKE`——既有契约不变）。返回行数组；**`null` = 库内无此会话**
 *  （调用侧据此回落主存 JSON 路径 + 既有护栏——逐字保留）。 */
export function querySessionRows(db, file, { role, keyword, tool, since, until, limit, direction = "newest" } = {}) {
  const session = findSessionByFile(db, file)
  if (!session) return null
  const { where, args } = filterClause({ role, like: keyword ? likePattern(keyword) : null, tool, since, until })
  return windowed(
    db,
    "SELECT m.rowid AS rowid, m.sid, m.idx, m.ts, m.role, m.name, m.tool_call_id, m.content FROM messages m",
    { where: ["m.sid = ?", ...where], args: [session.id, ...args] },
    { direction, limit, order: SESSION_CHRONO },
  )
}

/** 跨会话检索（`path:"all"`）：`keyword` = FTS 词 / 短语（`buildFtsQuery` 单源）；无 FTS 词元
 *  （纯标点 / 空白）⇒ 退化 `LIKE`（同字面转义）。行携 `file` 回查锚（D-SE47）。 */
export function queryAllRows(db, { keyword, role, tool, since, until, limit, direction = "newest" } = {}) {
  const { where, args } = filterClause({ role, like: null, tool, since, until })
  const fts = keyword && FTS_USABLE.test(keyword) ? buildFtsQuery(keyword) : ""
  let select = "SELECT m.rowid AS rowid, m.sid, m.idx, m.ts, m.role, m.name, m.tool_call_id, m.content, s.slot, s.cwd, s.title, s.file FROM messages m JOIN sessions s ON s.id = m.sid"
  if (fts) {
    select += " JOIN messages_fts f ON f.rowid = m.rowid"
    where.unshift("messages_fts MATCH ?")
    args.unshift(fts)
  } else if (keyword) {
    where.push("m.content LIKE ? ESCAPE '\\'")
    args.push(likePattern(keyword))
  }
  return windowed(db, select, { where, args }, { direction, limit, order: ALL_CHRONO })
}

/** 声明行读面（`[{name, arguments}]`——`arguments` 上限 300 字符，与存储面同值）。 */
export function toolCallsFor(db, sid, msgIdx) {
  const rows = db.prepare("SELECT name, args FROM tool_calls WHERE sid = ? AND msg_idx = ? ORDER BY ord").all(sid, msgIdx)
  return rows.filter((r) => r.name).map((r) => (r.args === null ? { name: r.name } : { name: r.name, arguments: capArguments(r.args) }))
}
