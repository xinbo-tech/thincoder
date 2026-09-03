/**
 * bridge.mjs — map runAgent callbacks to ACP session/update notifications
 * and reverse-RPC (M2: tools, permissions, fs routing).
 *
 * Wire shapes verified against the ACP schema v1 + kimi acp-adapter:
 * - agent text   → `agent_message_chunk`  { content: { type: "text", text } }
 * - thinking     → `agent_thought_chunk`  (same content shape)
 * - tool start   → `tool_call`  { toolCallId, title, kind, status: "in_progress", rawInput, content }
 * - tool result  → `tool_call_update`  { toolCallId, status: "completed"|"failed", content } (REPLACE semantics)
 * - usage        → `usage_update` { usage }
 * - permission   → reverse-RPC request `session/request_permission`
 *                  { sessionId, options, toolCall } → client responds with
 *                  { outcome: { outcome: "selected", optionId } | { outcome: "cancelled" } }
 * - fs routing   → reverse-RPC `fs/read_text_file` / `fs/write_text_file`
 *
 * toolCallId is generated per session (t1, t2, …) — thincoder's model-level
 * tool ids are not guaranteed unique across turns, ACP ids must be.
 *
 * End-of-turn is NOT a notification: `session/prompt` resolves with
 * `{ stopReason: "end_turn" }` (kimi session.ts parity).
 */
import { join } from "node:path"
import { detectDanger } from "../tools/shared.mjs"

/** ACP ToolKind inference (schema v1 enum) — best-effort, clients render by kind. */
function inferToolKind(name) {
  const base = name.includes("/") ? name.split("/").pop() : name
  if (["write", "edit", "apply_patch", "insert_after", "hashline_edit"].includes(base)) return "edit"
  if (base === "delete") return "delete"
  if (base === "bash") return "execute"
  if (["read", "glob", "grep", "ls", "code_search", "doc_search", "repo_outline"].includes(base)) return "read"
  if (base === "fetch" || base === "websearch") return "fetch"
  return "other"
}

/** Permission options surfaced to the client (kimi canonical ids, order load-bearing). */
const PERMISSION_OPTIONS = [
  { optionId: "approve_once", name: "Approve once", kind: "allow_once" },
  { optionId: "approve_always", name: "Approve for this session", kind: "allow_always" },
  { optionId: "reject", name: "Reject", kind: "reject_once" },
]

/** Map a client permission response to a boolean (unknown → reject, safety-first). */
function permissionToBoolean(response) {
  const outcome = response?.outcome
  if (!outcome || outcome.outcome === "cancelled") return false
  if (outcome.optionId === "approve_once" || outcome.optionId === "approve" || outcome.optionId === "approve_always" || outcome.optionId === "approve_for_session") return true
  return false
}

/**
 * Build the runAgent callbacks for an ACP session.
 * @param {{ sessionId: string, notify: (m, p) => void, request: (m, p, o?) => Promise<any>, log?: (s) => void }} deps
 */
export function buildAcpCallbacks({ sessionId, notify, request, log = () => {} }) {
  const update = (sessionUpdate, extra = {}) =>
    notify("session/update", { sessionId, update: { sessionUpdate, ...extra } })
  let toolSeq = 0
  const toolIds = new Map() // active tool name → current ACP toolCallId (defined before the literal — no expando)

  const toolCallId = () => `t${++toolSeq}`
  const contentBlock = (text) => ({ type: "content", content: { type: "text", text } })
  const pathOf = (args) => {
    const p = args?.path ?? args?.filePath
    return typeof p === "string" && p ? p : null
  }

  const callbacks = {
    onToken: (text) => {
      // Strip the subagent `[model]` metadata token (role#id/[model]<name>) — it's a
      // TUI/webview display signal, not conversation content, and must not reach ACP clients.
      // §19.5 D-M8 (round2 #6): nested prefixes recurse — eng-coder#2/explore#1/[model]…
      if (/^(?:[\w-]+#\d+\/)*\[model\]/.test(text)) return
      // D7 (AGENT-LOOP.md §7.2 + §19.5 round2 #6 + D-M7b): strip ⟦ev⟧ event tokens (bare or
      // any-depth prefixed variants — turn/approval/done/settled/stopped/async — async
      // = §19.5 D-M7b zero-field spawn marker) — they
      // carry RS control characters and are a TUI display signal; structured ACP
      // mapping (tool_call_update) is tracked separately in docs/TODO.md.
      // 有意为之：控制字符协议/转义序列剥离正则（ANSI/⟦ev⟧/SGR/history 双线分隔）
      if (/^(?:[\w-]+#\d+\/)*⟦ev⟧(?:turn|approval|done|settled|stopped|async)\x1e/.test(text)) return
      update("agent_message_chunk", { content: { type: "text", text } })
    },
    onReasoning: (text) => update("agent_thought_chunk", { content: { type: "text", text } }),
    onUsage: (usage) => update("usage_update", { usage }),
    onWait: ({ phase, seconds }) => log(`[rate-limit] ${phase} waiting ~${seconds}s`),
    onCompress: () => log("[context] auto-compacted"),

    onToolCall: (name, args) => {
      const id = toolCallId()
      toolIds.set(name, id)
      update("tool_call", {
        toolCallId: id,
        title: name,
        kind: inferToolKind(name),
        status: "in_progress",
        rawInput: args ?? {},
        content: [contentBlock(JSON.stringify(args ?? {}))],
      })
    },

    onToolResult: (name, result) => {
      const id = toolIds.get(name) ?? toolCallId()
      toolIds.delete(name)
      update("tool_call_update", {
        toolCallId: id,
        status: "completed",
        content: [contentBlock(String(result ?? ""))],
      })
    },

    /**
     * Permission gate (dispatch.mjs onPermissionRequest): reverse-RPC to the
     * client. Any transport failure → reject (safety-first, kimi parity).
     */
    onPermissionRequest: async (name, args) => {
      // 危险命令标注(只提示不拦截):kimi 同款模式,帮助编辑器端用户审批
      const base = name.includes("/") ? name.split("/").pop() : name
      const danger = base === "bash" ? detectDanger(args?.command ?? "") : undefined
      const content = [contentBlock(`Requesting approval to run ${name}`)]
      if (danger) content.push(contentBlock(`⚠️ Dangerous: ${danger}`))
      content.push(contentBlock(JSON.stringify(args ?? {})))
      const toolCall = {
        toolCallId: toolIds.get(name) ?? toolCallId(),
        title: name,
        content,
      }
      try {
        const response = await request("session/request_permission", {
          sessionId,
          options: PERMISSION_OPTIONS,
          toolCall,
        }, { timeoutMs: 300000 }) // user deliberation can take a while; 5 min
        return permissionToBoolean(response)
      } catch (e) {
        log(`[acp] request_permission failed; rejecting: ${e.message}`)
        return false
      }
    },

    /**
     * fs reverse-RPC router (dispatch.mjs toolRouter, M2):
     * - write            → fs/write_text_file (full content, no read-back)
     * - edit              → fs/read_text_file → local single-replacement → fs/write_text_file
     * - apply_patch       → local (unified-diff application is not routed in M2)
     * - delete, reads     → local
     */
    toolRouter: async (name, args) => {
      const base = name.includes("/") ? name.split("/").pop() : name
      const path = pathOf(args)
      if (base === "write" && path) {
        if (typeof args?.content !== "string") {
          return { handled: true, result: `Error: write content must be a string (got ${typeof args?.content})` }
        }
        const content = args.content
        try {
          await request("fs/write_text_file", { sessionId, path, content }, { timeoutMs: 30000 })
          return { handled: true, result: `OK: wrote ${path} via IDE` }
        } catch (e) {
          return { handled: true, result: `Error: fs/write_text_file failed: ${e.message}` }
        }
      }
      if (base === "edit" && path && typeof args?.old_string === "string" && typeof args?.new_string === "string") {
        try {
          const read = await request("fs/read_text_file", { sessionId, path }, { timeoutMs: 30000 })
          const current = read?.text ?? read?.content ?? ""
          const idx = current.indexOf(args.old_string)
          if (idx === -1) {
            return { handled: true, result: `Error: old_string not found in ${path} (read via IDE buffer)` }
          }
          const next = current.slice(0, idx) + args.new_string + current.slice(idx + args.old_string.length)
          await request("fs/write_text_file", { sessionId, path, content: next }, { timeoutMs: 30000 })
          return { handled: true, result: `OK: edited ${path} via IDE (1 replacement)` }
        } catch (e) {
          return { handled: true, result: `Error: edit via IDE failed: ${e.message}` }
        }
      }
      return { handled: false } // read-only tools, delete, apply_patch stay local
    },
  }
  return callbacks
}


/**
 * Replay a stored human-line history as session/update notifications (session/load).
 * role → event mapping (design §4.5):
 *   user      → user_message_chunk
 *   assistant → agent_message_chunk (no tool_calls) | tool_call cards (with tool_calls)
 *   tool      → tool_call_update following its assistant message
 * Machine-only lines ([System reminder:/[User interrupt:, transient) are never stored
 * in the human line (saveSession filters them), so nothing to skip here.
 */
export function replayHistory({ sessionId, notify, history, log = () => {} }) {
  const update = (sessionUpdate, extra = {}) =>
    notify("session/update", { sessionId, update: { sessionUpdate, ...extra } })
  // Shared content extraction: string → single text block; array → text blocks
  // (images skipped with a log). textOf derives from the same source.
  const contentBlocks = (m) => {
    const items = []
    if (typeof m?.content === "string") items.push({ type: "text", text: m.content })
    else if (Array.isArray(m?.content)) {
      for (const b of m.content) {
        if (typeof b === "string") items.push({ type: "text", text: b })
        else if (b?.type === "text") items.push({ type: "text", text: b.text })
        else if (b?.type === "image") log(`[acp] replay: image block skipped (${sessionId})`)
      }
    }
    return items
  }
  const textOf = (m) => contentBlocks(m).map((b) => b.text).join("\n")

  let pendingToolCalls = [] // { id, title, kind } of the current assistant tool_calls batch
  let toolSeq = 0
  for (const m of history ?? []) {
    if (m?.role === "user") {
      pendingToolCalls = []
      for (const b of contentBlocks(m)) update("user_message_chunk", { content: b })
    } else if (m?.role === "assistant") {
      const calls = Array.isArray(m.tool_calls) && m.tool_calls.length > 0 ? m.tool_calls : null
      if (calls) {
        // One tool_call notification PER tool in the batch — clients correlate
        // later tool_call_updates by toolCallId; an orphan update would be ignored.
        pendingToolCalls = calls.map((tc, i) => {
          const id = `t${++toolSeq}`
          const title = tc?.name ?? "tool"
          update("tool_call", {
            toolCallId: id,
            title,
            kind: inferToolKind(title),
            status: "in_progress",
            content: contentBlocks(m).map((b) => ({ type: "content", content: b })),
          })
          return { id, title }
        })
      } else {
        const items = contentBlocks(m)
        for (const b of items) update("agent_message_chunk", { content: b })
        pendingToolCalls = []
      }
    } else if (m?.role === "tool" && pendingToolCalls.length > 0) {
      const call = pendingToolCalls.shift()
      update("tool_call_update", {
        toolCallId: call.id,
        status: "completed",
        content: [{ type: "content", content: { type: "text", text: textOf(m).slice(0, 2000) } }],
      })
    }
  }
}
