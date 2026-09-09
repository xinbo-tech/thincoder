/**
 * agent-tools/read-history.mjs — read_history tool (SESSION.md §9 + §13 R19).
 *
 * Default: query THIS session's message history — the full human-readable record
 * (agent._fullHistory — the NEVER-compacted line passed in by the chat panel,
 * audit-complete). Use to recall what was said or done earlier: design
 * decisions, tool-call timing, past rulings.
 *
 * Cross-session (§13 R19 — path parameter, default = this session, zero change):
 *   - path=<full session-file path> → read that session file's history line and
 *     apply the SAME filter surface (role / keyword / tool / since-until / limit /
 *     direction). Read-only: the target file is never renamed / rewritten; a file
 *     over 50,000 messages (READ_HISTORY_MAX_MESSAGES) or 200,000 lines
 *     (READ_HISTORY_SCAN_MAX) is refused with the "session too large" error
 *     (L24 双保险：行扫第一道 + parse 后消息数第二道——双端同常量同文案).
 *   - path="cwd:<directory>" → discovery listing of that cwd's session slots
 *     (session files live at ~/.thincoder/sessions/<sha1(cwd)>.json.<N> — shared
 *     with the CLI): one summary line per slot with the slot number, the FULL
 *     file path, title, message count and updatedAt, newest first — then re-call
 *     with path=<that full path> for the deep query (two-step interaction, like
 *     memory search).
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
 * readonly: true — planMode pass / no permission ask. Registered depth-0 only:
 * subagents get their own throwaway history, so querying "the session" from a
 * child would be semantically confusing (SESSION.md §9.5 refinement 1).
 * §9 baseline mirrored from thincoder/src/agent-tools/read-history.mjs;
 * §13 R19 path/cwd extension mirrored per SESSION.md §13 (double-end isomorphic —
 * no cross-end byte test).
 */

import { existsSync, readFileSync, openSync, readSync, closeSync } from "node:fs"
import { listCwdSessions } from "./read-history-discovery.mjs"

const DEFAULT_LIMIT = 50
const MAX_LIMIT = 200
const CONTENT_CAP = 500
const VALID_ROLES = new Set(["user", "assistant", "tool"])
/** §13 D-R19a guardrail (评审 #3 — 具体化): per-slot line-scan cap for cross-session reads.
 *  A file over the cap errors with the design-finalized message BEFORE full parse. */
const READ_HISTORY_SCAN_MAX = 200_000

/** L24 消息数预算（评审 #2 钉死——双保险第二道）：行扫按物理 \n 行计——JSON 单行槽
 *  行扫不设防——parse 后 history 数组长度超限即拒（同款定稿文案）。 */
const READ_HISTORY_MAX_MESSAGES = 50_000

/** 超限错误文案（SESSION.md §13——定稿逐字——行扫/消息数两道共用——CLI TOO_LARGE_ERROR 同文案）。 */
const TOO_LARGE_ERROR = JSON.stringify({ error: "session too large — refine keyword or since/until" })

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
 *  minimum; the send layer sanitizes it anyway, but clean output costs nothing (setup-reminders
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

/** Filter + window the matched set, output stays chronological either way. Shared by the
 *  current-session path and the cross-session file path (§13 — same filter surface). */
function queryMessages(messages, { role, kwRe, tool, since, until, limit, direction }) {
  const matched = messages.filter((m) => {
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
  })
  // Direction picks the END of the matched set; output stays chronological either way.
  return direction === "oldest" ? matched.slice(0, limit) : matched.slice(-limit)
}

/** §13 line-scan guard — count physical lines WITHOUT loading the whole file (streamed,
 *  fixed-size chunks). Stops as soon as the cap is provably exceeded — an over-cap file is
 *  never read in full ("不再读全文"). `over` = true when lines > READ_HISTORY_SCAN_MAX. */
function scanLinesSync(filePath) {
  const fd = openSync(filePath, "r")
  try {
    const buf = Buffer.alloc(64 * 1024)
    let lf = 0
    let last = -1
    for (let pos = 0; ; ) {
      const n = readSync(fd, buf, 0, buf.length, pos)
      if (n <= 0) break
      for (let i = 0; i < n; i++) {
        const b = buf[i]
        if (b === 10) {
          lf++
          if (lf > READ_HISTORY_SCAN_MAX) return { over: true } // ≥ cap+1 newlines — over no matter the tail
        }
        last = b
      }
      pos += n
    }
    const lines = last < 0 ? 0 : lf + (last === 10 ? 0 : 1) // empty file = 0 lines; trailing newline does not open an extra line
    return { over: lines > READ_HISTORY_SCAN_MAX }
  } finally {
    closeSync(fd)
  }
}

/** Cross-session single-slot query (§13 D-R19a): validate the target file, enforce the
 *  line-scan cap, parse, then hand back the history line. Errors are returned as strings
 *  (never thrown, never crash — T-R19.3d); the target file is only ever READ. */
function loadSessionHistory(filePath) {
  if (!existsSync(filePath)) return `Error: session file not found: "${filePath}"`
  let scan
  try {
    scan = scanLinesSync(filePath)
  } catch (e) {
    return `Error: cannot read session file "${filePath}": ${e.message}`
  }
  if (scan.over) {
    return TOO_LARGE_ERROR
  }
  let data
  try {
    data = JSON.parse(readFileSync(filePath, "utf8"))
  } catch (e) {
    return `Error: cannot parse session file "${filePath}": ${e.message}`
  }
  if (!data || typeof data !== "object" || (data.version !== 1 && data.version !== 2) || !Array.isArray(data.history)) {
    return `Error: not a session history file: "${filePath}"`
  }
  if (data.history.length > READ_HISTORY_MAX_MESSAGES) {
    // L24 消息数第二道（parse 后——行扫按物理行、单行 JSON 槽行扫不设防——超限同款拒绝）。
    return TOO_LARGE_ERROR
  }
  return data.history
}

export const readHistoryTool = {
  name: "read_history",
  description:
    "Query THIS session's message history (the full record — never compacted, audit-complete). " +
    "Use when you need to recall what was said or done earlier: design decisions, tool-call timing, past rulings. " +
    "Cross-session: set path to a full session-file path (from a cwd: listing below) to run the same filters against that session's history; " +
    "or set path to \"cwd:<directory>\" to list that directory's sessions — every summary line carries the slot number, the full session-file path, title, message count and updatedAt — then re-call with path=<that full path> for the messages. " +
    "A session file over 50,000 messages or 200,000 lines is refused (\"session too large\") instead of being read whole. " +
    "Filters combine with AND: role / keyword (case-insensitive substring of message text) / " +
    "tool (tool result messages by name AND the assistant messages that declared the call — pair with tool_call_id / ts for timing) / " +
    "since-until (epoch ms time window; only messages with ts can match) / limit (default 50, clamped to 200) / direction (which end of the matches to take). " +
    "Returns a JSON array in chronological order: [{ts, role, name?, tool_call_id?, content (≈500 chars, truncated marker), tool_calls (names only)}]. " +
    "Messages without ts return ts:null. Content is truncated — the full text is in the session file. " +
    "\n检索/记忆族选哪个：查**本会话**说过/裁定过 → read_history（默认）；查**别的会话/项目**旧对话 → read_history 带 path/cwd 参数；查**本 run 改过哪些文件** → recent_changes；查**跨会话已存知识/约定**（memory）→ memory search；查**项目设计文档** → doc_search；查**代码实现** → code_search；查 git 历史快照 → checkpoint cat/versions。read_history 只查会话消息——文件级改动用 recent_changes——知识与约定用 memory——互相不替代。",
  parameters: {
    type: "object",
    properties: {
      path: { type: "string", description: "Target session file (absolute path) to search instead of THIS session; or \"cwd:<directory>\" to list that directory's sessions first (each summary carries the full file path for a follow-up path=<file> call). Omit to query THIS session (default — zero change)." },
      role: { type: "string", enum: ["user", "assistant", "tool"], description: "Only messages with this role." },
      keyword: { type: "string", description: "Case-insensitive substring of the message text (multimodal messages match on their text parts)." },
      tool: { type: "string", description: "Only messages for this tool: role=tool messages with name=tool, plus assistant messages that declared a call to it." },
      since: { type: "integer", description: "Earliest ts to match, epoch ms, INCLUSIVE. Messages without ts never match a time window." },
      until: { type: "integer", description: "Latest ts to match, epoch ms, INCLUSIVE. since > until yields an empty result." },
      limit: { type: "integer", description: "Maximum messages to return (default 50; larger values are clamped to 200)." },
      direction: { type: "string", enum: ["oldest", "newest"], description: "Take the limit window from the oldest or newest end of the matched set (default newest)." },
    },
  },
  readonly: true,
  execute(args, ctx) {
    const a = args ?? {}
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
    // never compacted — single tool results can be hundreds of KB to MBs. Lowercase the
    // needle once and run a regex-i test over the haystack (escaping regex metachars so the
    // keyword stays a literal substring).
    const kwRe = keyword ? new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") : null
    const tool = typeof a.tool === "string" && a.tool.length > 0 ? a.tool : null

    // §13 target selection: no path → THIS session (zero behavior change, T-R19.1);
    // path=file / path=cwd:… → cross-session (T-R19.2/3.x).
    const pathArg = typeof a.path === "string" && a.path.trim().length > 0 ? a.path.trim() : null
    let messages
    if (pathArg === null) {
      messages = Array.isArray(ctx.agent?._fullHistory) ? ctx.agent._fullHistory : []
    } else if (pathArg.startsWith("cwd:")) {
      return listCwdSessions(pathArg.slice(4)) // discovery text (rows + follow-up hint) — no filter application on a listing
    } else {
      const loaded = loadSessionHistory(pathArg)
      if (typeof loaded === "string") return loaded
      messages = loaded
    }
    const windowed = queryMessages(messages, { role, kwRe, tool, since, until, limit, direction })
    return JSON.stringify(windowed.map(toEntry))
  },
}
