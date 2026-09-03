/**
 * agent-tools/read-history.mjs — read_history tool (SESSION.md §9).
 *
 * Query THIS session's message history — the full human-readable record
 * (agent._fullHistory — NEVER compacted, audit-complete). Use to recall what
 * was said or done earlier: design decisions, tool-call timing, past rulings.
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
 * Mirrored 1:1 in thincoder-vscode/src/agent-tools/read-history.mjs.
 */

const DEFAULT_LIMIT = 50
const MAX_LIMIT = 200
const CONTENT_CAP = 500
const VALID_ROLES = new Set(["user", "assistant", "tool"])

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

export const readHistoryTool = {
  name: "read_history",
  description:
    "Query THIS session's message history (the full record — never compacted, audit-complete). " +
    "Use when you need to recall what was said or done earlier: design decisions, tool-call timing, past rulings. " +
    "Filters combine with AND: role / keyword (case-insensitive substring of message text) / " +
    "tool (tool result messages by name AND the assistant messages that declared the call — pair with tool_call_id / ts for timing) / " +
    "since-until (epoch ms time window; only messages with ts can match) / limit (default 50, clamped to 200) / direction (which end of the matches to take). " +
    "Returns a JSON array in chronological order: [{ts, role, name?, tool_call_id?, content (≈500 chars, truncated marker), tool_calls (names only)}]. " +
    "Messages without ts return ts:null. Content is truncated — the full text is in the session file.",
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

    const history = Array.isArray(ctx.agent?._fullHistory) ? ctx.agent._fullHistory : []
    const matched = history.filter((m) => {
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
    const windowed = direction === "oldest" ? matched.slice(0, limit) : matched.slice(-limit)
    return JSON.stringify(windowed.map(toEntry))
  },
}
