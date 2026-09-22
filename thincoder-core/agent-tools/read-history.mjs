/**
 * agent-tools/read-history.mjs — read_history tool (SESSION.md §6.9 + §6.13 R19 cross-session + §6.19).
 *
 * Query message history — THIS session by default, any session on disk with `path`
 * (SESSION.md §6.13 R19): an explicit session file path deep-queries that file's
 * history line; "cwd:<dir>" discovers the sessions stored for that directory; "all"
 * searches every indexed session across projects (§6.19 D-SE47).
 *
 * Default (no path) — THIS session's full human-readable record (record store when bound
 * — disk-backed, SESSION.md §6.14; agent._fullHistory memory fallback otherwise:
 * NEVER compacted, audit-complete). Use to recall what was said or done earlier:
 * design decisions, tool-call timing, past rulings.
 *
 * Filters AND together: role / keyword (message text) / tool (tool messages by
 * name + assistant messages that declared the call) / since-until (epoch ms
 * window, inclusive-inclusive, matches ONLY messages that carry ts) /
 * limit (default 50, clamped to 200) / direction (oldest/newest — which end of
 * the matched set the limit window is taken from).
 *
 * Returns a JSON array in chronological order. Every message without ts comes
 * back as ts:null and can never match a time window (legacy sessions). Content
 * is truncated to ~500 chars with an explicit marker — full text lives in the
 * session file. assistant tool_calls come back as [{name, arguments}] with the
 * stored argument string capped at 300 chars (matches the stored precision).
 *
 * Cross-session (SESSION.md §6.13 D-R19a + §6.19 D-SE47 — 索引优先 + 主存回落):
 * path = a session file path (absolute, or relative to the project cwd) → when the derived
 * session index covers that session the query runs as SQL (no line-scan / message-count
 * guards ⇒ oversized sessions answer); otherwise the pre-existing JSON path with BOTH
 * guards, verbatim (not a sessions-tree file / index unavailable / no such row). path =
 * "cwd:<dir>" → list every slot stored for that directory (slot number + full file path +
 * title/message count/updatedAt — no dead-slot filtering, v1 decision). path = "all" →
 * cross-session search over every INDEXED session (keyword = FTS words / phrases; rows carry
 * session.file as the follow-up anchor).
 * The index face enters load-time via dynamic import (W8 contract②: node:sqlite must never
 * join the assembly-time static closure) — a host without node:sqlite falls back to the file
 * path silently, and an index write failure never endangers the session files (zero authority).
 *
 * readonly: true — planMode pass / no permission ask. Registered depth-0 only:
 * subagents get their own throwaway history, so querying "the session" from a
 * child would be semantically confusing (SESSION.md §6.9 refinement 1 + §6.13 T-R19.4).
 */

import { openSync, readSync, closeSync, readFileSync, existsSync, statSync } from "node:fs"
import { isAbsolute, resolve } from "node:path"
import { listSlots, slotPath } from "../session-slots.mjs"

const DEFAULT_LIMIT = 50
const MAX_LIMIT = 200
const CONTENT_CAP = 500
const ARG_CAP = 300
const VALID_ROLES = new Set(["user", "assistant", "tool"])
/** 跨会话检索字面量（§6.19 D-SE47——全部**已索引**会话）。 */
const ALL_PATH = "all"

/** 单槽检索行扫护栏（SESSION.md §6.13 D-R19a——评审 #3 定稿：超限不再读全文，返回定稿错误文案）。 */
export const READ_HISTORY_SCAN_MAX = 200_000

/** L24 消息数预算（评审 #2 钉死——双保险第二道）：行扫按物理 \n 行计——JSON 单行槽
 *  行扫不设防——parse 后 history 数组长度超限即拒（同款定稿文案——双端同常量同文案）。 */
export const READ_HISTORY_MAX_MESSAGES = 50_000

/** 超限错误文案（SESSION.md §6.13——逐字定稿——T-R19.7 断言）。 */
const TOO_LARGE_ERROR = JSON.stringify({ error: "session too large — refine keyword or since/until" })

/** 检索/记忆族消歧总纲（SESSION.md §6.13 D-R19b——逐字定稿——read_history 描述尾段——T-R19.5 锚）。 */
const SEARCH_FAMILY_GUIDE =
  "检索/记忆族选哪个：查**本会话**说过/裁定过 → read_history（默认）；查**别的会话/项目**旧对话 → read_history 带 path/cwd 参数；查**本 run 改过哪些文件** → recent_changes；查**跨会话已存知识/约定**（memory）→ memory search；查**项目设计文档** → doc_search；查**代码实现** → code_search；查 git 历史快照 → checkpoint cat/versions。read_history 只查会话消息——文件级改动用 recent_changes——知识与约定用 memory——互相不替代。"

/** Message text for keyword matching + output: strings pass through; multimodal content arrays → text parts joined (never crashes, empty parts skipped, images ignored). */
function messageText(m) {
  if (typeof m?.content === "string") return m.content
  if (Array.isArray(m?.content)) {
    return m.content
      .map((p) => (p && typeof p === "object" && p.type === "text" ? p.text ?? "" : ""))
      .filter((t) => t.length > 0)
      .join(" ")
  }
  return ""
}

/** Truncate long content (~500 chars) with an explicit marker. The cut never splits a UTF-16
 *  surrogate pair (emoji etc.) — a lone high surrogate in tool output would be an eyesore at
 *  minimum; the send layer sanitizes it anyway, but clean output costs nothing (setup.mjs
 *  safeSliceUTF16 same rule). */
function truncateContent(text) {
  const t = String(text ?? "")
  if (t.length <= CONTENT_CAP) return t
  let end = CONTENT_CAP
  if (t.charCodeAt(end - 1) >= 0xd800 && t.charCodeAt(end - 1) <= 0xdbff) end-- // high surrogate at the cut → step back
  return t.slice(0, end) + `\n… (truncated: ${t.length - end} chars — full text is in the session file)`
}

/** Tool name across both stored shapes ({function:{name}} and flat {name}). */
function toolCallName(tc) {
  return tc?.function?.name ?? tc?.name ?? ""
}

/** Assistant tool_calls output shape: [{name, arguments}] — `arguments` = the STORED string
 *  (SESSION.md §6.19 D-SE47: 上限 300 字符 = 存储面同值——不虚构超出存储的精度). */
function toolCallEntries(tcs) {
  return tcs.map((tc) => {
    const name = toolCallName(tc)
    const args = typeof tc?.function?.arguments === "string" ? tc.function.arguments
      : typeof tc?.arguments === "string" ? tc.arguments : null
    const out = { name }
    if (args !== null) out.arguments = args.length <= ARG_CAP ? args : args.slice(0, ARG_CAP) + "…"
    return out
  }).filter((t) => t.name)
}

/** Parse a ts window boundary (epoch ms number; numeric strings tolerated). Returns the number or an error string. */
function parseTs(value, label) {
  if (value === undefined || value === null) return null
  const n = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(n)) return `Error: invalid ${label} "${value}" — must be epoch milliseconds (number)`
  return n
}

/** Map one matched message to its JSON entry shape. */
function toEntry(m) {
  const entry = {
    ts: typeof m.ts === "number" ? m.ts : null,
    role: m.role ?? null,
  }
  if (m.name !== undefined) entry.name = m.name
  if (m.tool_call_id !== undefined) entry.tool_call_id = m.tool_call_id
  entry.content = truncateContent(messageText(m))
  if (Array.isArray(m.tool_calls) && m.tool_calls.length > 0) {
    const calls = toolCallEntries(m.tool_calls)
    if (calls.length > 0) entry.tool_calls = calls
  }
  return entry
}

/** AND-filter one history message (role/keyword/tool/since-until) — shared by the in-memory
 *  default and the cross-session file query (SESSION.md §6.13 D-R19a: 同 filter 面应用). */
function matches(m, { role, kwRe, tool, since, until }) {
  if (!m || typeof m !== "object") return false
  if (role !== undefined && m.role !== role) return false
  if (kwRe) {
    const text = messageText(m)
    if (!kwRe.test(text)) return false
  }
  if (tool) {
    const byName = m.role === "tool" && m.name === tool
    const byDeclaration = m.role === "assistant" && Array.isArray(m.tool_calls) && m.tool_calls.some((tc) => toolCallName(tc) === tool)
    if (!byName && !byDeclaration) return false
  }
  const ts = m.ts
  if (since !== null || until !== null) {
    if (typeof ts !== "number") return false // no ts → no time-window match
    if (since !== null && ts < since) return false
    if (until !== null && ts > until) return false
  }
  return true
}

/** Direction picks the END of the matched set; output stays chronological either way. */
function formatMatches(matched, direction, limit) {
  const windowed = direction === "oldest" ? matched.slice(0, limit) : matched.slice(-limit)
  return JSON.stringify(windowed.map(toEntry))
}

/** Line-scan guard: stream-count physical newlines, bailing the moment the cap is crossed —
 *  an oversized file is refused BEFORE it is read whole ("不再读全文"——SESSION.md §6.13 D-R19a). */
function exceedsScanMax(file) {
  const CHUNK = 64 * 1024
  let fd = null
  try {
    fd = openSync(file, "r")
    const buf = Buffer.alloc(CHUNK)
    let newlines = 0
    for (;;) {
      const n = readSync(fd, buf, 0, CHUNK, null)
      if (n <= 0) break
      for (let i = 0; i < n; i++) {
        if (buf[i] === 0x0a) newlines++
      }
      if (newlines > READ_HISTORY_SCAN_MAX) return true
    }
    return false
  } catch {
    return false // 行扫失败 → 交由后续读取/解析路径给出真实错误
  } finally {
    if (fd !== null) {
      try { closeSync(fd) } catch { /* ignore */ }
    }
  }
}

/** 跨会话深查（回落面）：单个槽文件，同 filter 面（§6.13 D-R19a——两道护栏逐字保留）。 */
function querySessionFile(pathArg, { role, kwRe, tool, since, until, direction, limit }, baseCwd) {
  const file = isAbsolute(pathArg) ? pathArg : resolve(baseCwd ?? process.cwd(), pathArg)
  if (!existsSync(file)) return `Error: session file not found: ${file}`
  if (exceedsScanMax(file)) return TOO_LARGE_ERROR
  let text
  try {
    text = readFileSync(file, "utf8")
  } catch (e) {
    return `Error: failed to read session file ${file}: ${e.message}`
  }
  let data
  try {
    data = JSON.parse(text)
  } catch (e) {
    return `Error: ${file} is not a valid session file (corrupt JSON: ${e.message})`
  }
  if (!data || typeof data !== "object" || !Array.isArray(data.history)) {
    return `Error: ${file} is not a valid session file (no history array)`
  }
  if (data.history.length > READ_HISTORY_MAX_MESSAGES) {
    // L24 消息数第二道（parse 后——行扫按物理行、单行 JSON 槽行扫不设防——超限同款拒绝）。
    return TOO_LARGE_ERROR
  }
  const matched = data.history.filter((m) => matches(m, { role, kwRe, tool, since, until }))
  return formatMatches(matched, direction, limit)
}

/** Discovery surface (path = "cwd:<dir>"): list every slot stored for that directory, one line
 *  per slot — slot number + FULL session file path + title/message count/updatedAt（§6.13 D-R19a
 *  ——评审 #2：摘要必须含寻址字段——模型第二步深查 = 复制行内文件路径重调 path=）。 */
function discoverCwd(raw, baseCwd) {
  const dir = resolve(baseCwd ?? process.cwd(), raw)
  let st = null
  try {
    st = statSync(dir)
  } catch { /* fallthrough to the explicit error below */ }
  if (st === null || !st.isDirectory()) {
    return `Error: unknown cwd "${raw}" — no session directory for this cwd (directory not found: ${dir})`
  }
  const slots = listSlots(dir) // 时间序（updatedAt 降序）——含 manifest 记录的全部槽（v1 不做死槽过滤）
  if (slots.length === 0) {
    return `(no session slots found for cwd: ${dir} — no sessions started there yet)`
  }
  const lines = slots.map((s) => {
    const title = s.title ? `"${s.title}"` : "(untitled)"
    return `slot ${s.slot}: ${slotPath(dir, s.slot)} — title: ${title}, messages: ${s.messageCount}, updatedAt: ${s.updatedAt}`
  })
  return `Session slots for cwd: ${dir} (newest first):\n${lines.join("\n")}`
}

// ── 索引面（§6.19 D-SE47：索引优先 + 主存回落；动态装载——W8 契约②）─────────────────

/** 索引面模块（动态 import：node:sqlite 不进装配期静态闭包）；宿主不具备（无 node:sqlite / 装配失败）⇒ null。 */
async function loadIndexFace() {
  try {
    const [idx, query, build] = await Promise.all([
      import("../session-index.mjs"),
      import("../session-index-query.mjs"),
      import("../session-index-build.mjs"),
    ])
    return { idx, query, build }
  } catch { return null }
}

/** 索引行 → 输出条目（与 JSON 面 `toEntry` 同形——两条路径结果逐条相等，T-11 等价面）。 */
function indexEntry(r) {
  const entry = { ts: typeof r.ts === "number" ? r.ts : null, role: r.role ?? null }
  if (r.name !== undefined && r.name !== null) entry.name = r.name
  if (r.tool_call_id !== undefined && r.tool_call_id !== null) entry.tool_call_id = r.tool_call_id
  entry.content = truncateContent(r.content ?? "")
  if (Array.isArray(r.tool_calls) && r.tool_calls.length > 0) entry.tool_calls = r.tool_calls
  return entry
}

/** 单会话：索引命中 ⇒ SQL 检索结果；未命中（非 sessions 树 / 库不可用 / 库内无此会话）⇒ `null` = 回落。
 *  懒保证射程 = 有段档（`src=sidecar`——`session-index-build` 内判；`src=json` 档免 ensure）。 */
async function queryIndexedSession(file, filters) {
  const face = await loadIndexFace()
  if (!face) return null
  let db = null
  try {
    db = face.idx.openSessionIndex()
    if (!db) return null
    try { face.build.ensureSessionIndexed(db, file) } catch { /* 懒保证失败 ⇒ 用现有行判命中（回落路径兜住） */ }
    const rows = face.query.querySessionRows(db, file, filters)
    return rows === null ? null : JSON.stringify(rows.map(indexEntry))
  } catch { return null } finally { if (db) db.close() }
}

/** 当前会话槽文件（`all` 面懒保证目标——触发点①：`SESSION.md` §6.19「查询前对目标会话（`path=<文件>`）/
 *  当前会话（`all`）`ensure`」；射程仍 = 有段档 ⇒ `src=json` 档零动作；无绑定 / 无槽 ⇒ null）。 */
function currentSessionFile(ctx) {
  const cwd = ctx.agent?.cwd
  const slot = ctx.agent?._slot
  if (!cwd || !Number.isInteger(slot) || slot < 1) return null
  try { return slotPath(cwd, slot) } catch { return null }
}

/** 跨会话检索（`path:"all"`——全部已索引会话）：行携 `session.file` 回查锚 + `idx`。 */
async function queryAllSessions(filters, current = null) {
  const face = await loadIndexFace()
  if (!face) return "Error: session index unavailable — this host has no node:sqlite; query one session with path=<file> instead"
  let db = null
  try {
    db = face.idx.openSessionIndex()
    if (!db) return "Error: session index unavailable — the derived index could not be opened; query one session with path=<file> instead"
    if (current !== null) { try { face.build.ensureSessionIndexed(db, current) } catch { /* 懒保证失败 ⇒ 用现有行（回落面零影响） */ } }
    const rows = face.query.queryAllRows(db, filters)
    return JSON.stringify(rows.map((r) => ({
      session: { slot: r.slot, cwd: r.cwd ?? null, file: r.file, title: r.title ?? null },
      idx: r.idx,
      ...indexEntry(r),
    })))
  } catch (e) {
    return `Error: session index query failed — ${e.message}`
  } finally { if (db) db.close() }
}

export const readHistoryTool = {
  name: "read_history",
  description:
    "Query message history — THIS session by default, any session on disk with `path`. " +
    "Default (no path): THIS session's full record (never compacted, audit-complete) — recall what " +
    "was said or done earlier: design decisions, tool-call timing, past rulings. " +
    "Filters combine with AND: role / keyword (case-insensitive substring of message text) / " +
    "tool (tool result messages by name AND the assistant messages that declared the call — pair with tool_call_id / ts for timing) / " +
    "since-until (epoch ms time window; only messages with ts can match) / limit (default 50, clamped to 200) / direction (which end of the matches to take). " +
    "Returns a JSON array in chronological order: [{ts, role, name?, tool_call_id?, content (≈500 chars, truncated marker), tool_calls ([{name, arguments}] — arguments capped at 300 chars)}]. " +
    "Messages without ts return ts:null. Content is truncated — the full text is in the session file. " +
    "Cross-session (path, optional): a session file path deep-queries THAT session's history with the same filters " +
    "(relative paths resolve against the project cwd) — answered from the derived session index when it covers that session, " +
    "otherwise from the session file itself (a file over 50,000 messages or 200,000 lines is refused as \"session too large\"). " +
    "\"cwd:<dir>\" lists every session slot stored for that directory — one line per slot: slot number + full session file path + " +
    "title + message count + updatedAt; copy a listed file path into path= to deep-query it. " +
    "\"all\" searches EVERY INDEXED session at once (cross-project; keyword = FTS words / phrases; each row carries session.file for the follow-up deep query) — " +
    "`all` covers the derived index only: sessions never indexed yet are invisible there (query them with path=<file>, or index everything first with the CLI `thincoder session index --rebuild`).\n" +
    SEARCH_FAMILY_GUIDE,
  parameters: {
    type: "object",
    properties: {
      role: { type: "string", enum: ["user", "assistant", "tool"], description: "Only messages with this role." },
      keyword: { type: "string", description: "Case-insensitive substring of the message text (multimodal messages match on their text parts); with path=\"all\" it is matched as FTS words / phrases over the indexed text." },
      tool: { type: "string", description: "Only messages for this tool: role=tool messages with name=tool, plus assistant messages that declared a call to it." },
      since: { type: "integer", description: "Earliest ts to match, epoch ms, INCLUSIVE. Messages without ts never match a time window." },
      until: { type: "integer", description: "Latest ts to match, epoch ms, INCLUSIVE. since > until yields an empty result." },
      limit: { type: "integer", description: "Maximum messages to return (default 50; larger values are clamped to 200)." },
      direction: { type: "string", enum: ["oldest", "newest"], description: "Take the limit window from the oldest or newest end of the matched set (default newest)." },
      path: { type: "string", description: "Optional — query another session instead of this one: a session file path (as listed by a \"cwd:<dir>\" call) deep-queries that session; \"cwd:<dir>\" lists that directory's session slots (slot number + full file path + title + message count + updatedAt); \"all\" searches every indexed session across projects (FTS words / phrases; rows carry session.file)." },
    },
  },
  readonly: true,
  // 返回类型 = `string`（本会话缺省 / `cwd:` 发现面——与修前逐字同形）∥ `Promise<string>`（索引面：
  // `path=<文件>` 索引优先 / `path:"all"`——需动态装载核索引面）。装配面一律 `await`（dispatch.js 同款）。
  execute(args, ctx) {
    const a = args ?? {}
    if (a.path !== undefined && (typeof a.path !== "string" || a.path.trim().length === 0)) {
      return `Error: invalid path "${a.path}" — must be a session file path or "cwd:<dir>"`
    }
    const role = a.role
    if (role !== undefined && (typeof role !== "string" || !VALID_ROLES.has(role))) {
      return `Error: invalid role "${role}" — valid roles: user, assistant, tool`
    }
    const direction = a.direction ?? "newest"
    if (direction !== "oldest" && direction !== "newest") {
      return `Error: invalid direction "${direction}" — valid values: oldest, newest`
    }
    const since = parseTs(a.since, "since")
    if (typeof since === "string") return since
    const until = parseTs(a.until, "until")
    if (typeof until === "string") return until
    let limit = DEFAULT_LIMIT
    if (a.limit !== undefined) {
      limit = Math.floor(Number(a.limit))
      if (!Number.isFinite(limit)) return `Error: invalid limit "${a.limit}" — must be a number`
      limit = Math.min(Math.max(1, limit), MAX_LIMIT)
    }
    const keyword = typeof a.keyword === "string" && a.keyword.length > 0 ? a.keyword : null
    // Case-insensitive substring WITHOUT copying the full message text: the human line is
    // never compacted (绑定态存储行 = slimForDisplay 产物——匹配基准 delta 见 SESSION.md
    // §6.14 / T-RS8b) — single tool results can be hundreds of KB to MBs. Lowercase the
    // needle once and run a regex-i test over the haystack (escaping regex metachars so the
    // keyword stays a literal substring).
    const kwRe = keyword ? new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") : null
    const tool = typeof a.tool === "string" && a.tool.length > 0 ? a.tool : null
    const baseCwd = ctx.agent?.cwd ?? process.cwd()

    const pathArg = typeof a.path === "string" && a.path.trim().length > 0 ? a.path.trim() : null
    if (pathArg !== null) {
      if (pathArg.startsWith("cwd:")) return discoverCwd(pathArg.slice("cwd:".length), baseCwd)
      const filters = { keyword, role, tool, since, until, limit, direction }
      if (pathArg === ALL_PATH) return queryAllSessions(filters, currentSessionFile(ctx))
      const file = isAbsolute(pathArg) ? pathArg : resolve(baseCwd, pathArg)
      // 索引优先（命中 ⇒ SQL 检索）；未命中 ⇒ 既有 JSON 路径 + 两道护栏（逐字保留——回落面）
      return queryIndexedSession(file, filters)
        .then((indexed) => (indexed !== null ? indexed : querySessionFile(pathArg, { role, kwRe, tool, since, until, direction, limit }, baseCwd)))
    }

    // 本会话（无 path）：绑定记录存储 → 方向流式迭代（磁盘为准——全量可见、内存窗口外
    // 可命中；§6.14）；未绑定（测试 / 模式 F）→ 内存 _fullHistory 既有过滤路径（回退保留）。
    // 方向语义不变：newest 自尾向前取满 limit → 反转回时间序（输出恒时间序）。
    const store = ctx.agent?._recordStore
    if (store?.iterate) {
      const taken = []
      for (const m of store.iterate(direction)) {
        if (!matches(m, { role, kwRe, tool, since, until })) continue
        taken.push(m)
        if (taken.length >= limit) break
      }
      return formatMatches(direction === "newest" ? taken.reverse() : taken, "oldest", limit)
    }
    const history = Array.isArray(ctx.agent?._fullHistory) ? ctx.agent._fullHistory : []
    const matched = history.filter((m) => matches(m, { role, kwRe, tool, since, until }))
    return formatMatches(matched, direction, limit)
  },
}
