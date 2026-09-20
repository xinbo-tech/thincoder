/**
 * agent-tools/read-history.mjs — read_history tool (SESSION.md §6.9 + §6.13 R19 cross-session).
 *
 * Query message history — THIS session by default, any session on disk with `path`
 * (SESSION.md §6.13 R19): an explicit session file path deep-queries that file's
 * history line; "cwd:<dir>" discovers the sessions stored for that directory.
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
 * session file. assistant tool_calls are summarized to a name list (arguments
 * never expanded).
 *
 * Cross-session (SESSION.md §6.13 D-R19a): path = a session file path (absolute, or
 * relative to the project cwd) → read that file's history line and apply the SAME
 * filter surface; path = "cwd:<dir>" → list every slot stored for that directory
 * (slot number + full file path + title/message count/updatedAt — no dead-slot
 * filtering, v1 decision). Single-file retrieval is guarded by a line-scan cap
 * (READ_HISTORY_SCAN_MAX — an oversized file is refused before it is read whole)
 * plus a message-count cap (READ_HISTORY_MAX_MESSAGES = 50,000 — L24 双保险第二道).
 *
 * readonly: true — planMode pass / no permission ask. Registered depth-0 only:
 * subagents get their own throwaway history, so querying "the session" from a
 * child would be semantically confusing (SESSION.md §6.9 refinement 1 + §6.13 T-R19.4).
 * §13 R19 extension mirrored per SESSION.md §6.13 — double-end isomorphic, no
 * cross-end byte test (thincoder-vscode/src/agent-tools/read-history.mjs).
 */

import { openSync, readSync, closeSync, readFileSync, existsSync, statSync } from "node:fs"
import { isAbsolute, resolve } from "node:path"
import { listSlots, slotPath } from "../session-slots.mjs"

const DEFAULT_LIMIT = 50
const MAX_LIMIT = 200
const CONTENT_CAP = 500
const VALID_ROLES = new Set(["user", "assistant", "tool"])

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
    entry.tool_calls = m.tool_calls.map(toolCallName).filter(Boolean)
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

/** Cross-session deep query: one session file, same filter surface (§13 D-R19a). */
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
 *  per slot — slot number + FULL session file path + title/message count/updatedAt（§13 D-R19a
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

export const readHistoryTool = {
  name: "read_history",
  description:
    "Query message history — THIS session by default, any session on disk with `path`. " +
    "Default (no path): THIS session's full record (never compacted, audit-complete) — recall what " +
    "was said or done earlier: design decisions, tool-call timing, past rulings. " +
    "Filters combine with AND: role / keyword (case-insensitive substring of message text) / " +
    "tool (tool result messages by name AND the assistant messages that declared the call — pair with tool_call_id / ts for timing) / " +
    "since-until (epoch ms time window; only messages with ts can match) / limit (default 50, clamped to 200) / direction (which end of the matches to take). " +
    "Returns a JSON array in chronological order: [{ts, role, name?, tool_call_id?, content (≈500 chars, truncated marker), tool_calls (names only)}]. " +
    "Messages without ts return ts:null. Content is truncated — the full text is in the session file. " +
    "Cross-session (path, optional): a session file path deep-queries THAT session's history with the same filters " +
    "(relative paths resolve against the project cwd); \"cwd:<dir>\" lists every session slot stored for that directory — " +
    "one line per slot: slot number + full session file path + title + message count + updatedAt; copy a listed file path into path= to deep-query it. " +
    "A session file over 50,000 messages or 200,000 lines is refused (\"session too large\") instead of being read whole.\n" +
    SEARCH_FAMILY_GUIDE,
  parameters: {
    type: "object",
    properties: {
      role: { type: "string", enum: ["user", "assistant", "tool"], description: "Only messages with this role." },
      keyword: { type: "string", description: "Case-insensitive substring of the message text (multimodal messages match on their text parts)." },
      tool: { type: "string", description: "Only messages for this tool: role=tool messages with name=tool, plus assistant messages that declared a call to it." },
      since: { type: "integer", description: "Earliest ts to match, epoch ms, INCLUSIVE. Messages without ts never match a time window." },
      until: { type: "integer", description: "Latest ts to match, epoch ms, INCLUSIVE. since > until yields an empty result." },
      limit: { type: "integer", description: "Maximum messages to return (default 50; larger values are clamped to 200)." },
      direction: { type: "string", enum: ["oldest", "newest"], description: "Take the limit window from the oldest or newest end of the matched set (default newest)." },
      path: { type: "string", description: "Optional — query another session instead of this one: a session file path (as listed by a \"cwd:<dir>\" call) deep-queries that session; \"cwd:<dir>\" lists that directory's session slots (slot number + full file path + title + message count + updatedAt)." },
    },
  },
  readonly: true,
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
      return pathArg.startsWith("cwd:")
        ? discoverCwd(pathArg.slice("cwd:".length), baseCwd)
        : querySessionFile(pathArg, { role, kwRe, tool, since, until, direction, limit }, baseCwd)
    }

    // 本会话（无 path）：绑定记录存储 → 方向流式迭代（磁盘为准——全量可见、内存窗口外
    // 可命中；§14.3.7）；未绑定（测试 / 模式 F）→ 内存 _fullHistory 既有过滤路径（回退保留）。
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
