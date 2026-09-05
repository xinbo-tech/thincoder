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
import { detectDanger, normalizeEOL, joinWithEol } from "../tools/shared.mjs"
import { computeEditEntry, validateEditEntry, assertEditArgsExclusive } from "../tools/edit-diff.mjs"

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
  // D15.8（TOOLS.md §15.1）：tool id FIFO 队列——并行同名工具按 call 序配对（dispatch B1
  // 已测：并行结果回调顺序 = call 顺序——T-TS8/T-TS9）。取代旧 Map 按名覆盖（后写覆盖先写
  // → tool_call_update 与 tool_call id 错配）。条目 { name, id, toolId }——toolId = 模型级
  // toolCall.id（dispatch 在 onToolCall/onToolResult 均传第 3 参——同一 item 恒相同）。
  // 拒绝/中断路径：dispatch 在 onToolCall 之前拒绝（被拒工具从未入队——无孤儿可滞）；
  // 中断/异常路径（onToolResult 永不回调——dispatch.mjs catch 分支——T-F5 契约）留下的
  // 孤儿靠 onToolCall 的「同名同 toolId 先弹出」隔离（见 onToolCall）——模型级 id 跨轮
  // 可重复（sse.mjs 每轮从 call_0 重置）——弹出保证精确配对恒命中最新条目。
  const toolQueue = [] // FIFO of pending { name, id, toolId }

  const toolCallId = () => `t${++toolSeq}`
  /** D15.8：peek 同名最早项 id——权限面板展示用——不消费（result 仍要与自己的条目配对）。 */
  const peekToolId = (name) => {
    for (const e of toolQueue) if (e.name === name) return e.id
    return null
  }
  /** D15.8：消费——①模型级 toolId 精确配对（中断孤儿隔离）②无 id/未命中 → 名称 FIFO 回退
   *  （B1 保序）③均未命中 → null（调用方回退新 id——防御）。 */
  const takeToolId = (name, toolId) => {
    if (toolId != null) {
      const i = toolQueue.findIndex((e) => e.name === name && e.toolId === toolId)
      if (i >= 0) return toolQueue.splice(i, 1)[0].id
    }
    for (let i = 0; i < toolQueue.length; i++) {
      if (toolQueue[i].name === name) return toolQueue.splice(i, 1)[0].id
    }
    return null
  }

  const contentBlock = (text) => ({ type: "content", content: { type: "text", text } })
  const pathOf = (args) => {
    const p = args?.path ?? args?.filePath
    return typeof p === "string" && p ? p : null
  }

  // §15.1（TOOLS.md）D15.7 委派：edit 判定/应用单一权威 = 本地 computeEditEntry
  // （edit-diff.mjs——校验→判定序→应用：行级 LCS、零重叠→插入、replace_all 字面替换全部）。
  // 桥只留「读 IDE 缓冲 → computeEditEntry → 写回 IDE 缓冲」——错误文本经抛错原样透传
  // ——与本地通道逐字一致（NF15.6b / AC15.10：not found / occurrences / 空 old / 空 new）。
  const EDIT_ABORT_PREFIX = "edit aborted (atomic — no files written): "

  const readBuffer = async (p) => {
    try {
      const read = await request("fs/read_text_file", { sessionId, path: p }, { timeoutMs: 30000 })
      return read?.text ?? read?.content ?? ""
    } catch (e) {
      throw new Error(`fs/read_text_file failed: ${e.message}`)
    }
  }
  const writeBuffer = async (p, content) => {
    try {
      await request("fs/write_text_file", { sessionId, path: p, content }, { timeoutMs: 30000 })
    } catch (e) {
      throw new Error(`fs/write_text_file failed: ${e.message}`)
    }
  }
  /** 单形态：读 IDE 缓冲 → computeEditEntry（rich——无 abortPrefix——同本地 runSingleEdit）
   *  → 写回。EOL 权威（F1）：判定/应用在 normalizeEOL 后的 LF 域；写回 joinWithEol 按原文
   *  首换行恢复（LF 域判定——CRLF 域写回——与本地 edit 工具同判同恢复）。 */
  const editSingle = async (p, args) => {
    const raw = await readBuffer(p)
    const content = normalizeEOL(raw)
    const out = computeEditEntry(content, args, { path: p })
    await writeBuffer(p, joinWithEol(normalizeEOL(out.updated).split("\n"), raw))
    return `OK: edited ${p} via IDE (${out.occurrences} occurrence(s))${out.note ? ` — ${out.note}` : ""}`
  }
  /** 数组形态（D15.7）：条目校验（path——顶层默认自 args.path ?? args.filePath（pathOf）——
   *  2026-09-05 用户裁定 CLI parity——/validateEditEntry/互斥（只对顶层 old/new）——同本地 edit-batch 措辞）→
   *  读全部涉及文件缓冲（同文件去重——一次读）→ 逐条 computeEditEntry（abortPrefix——批量
   *  原子前缀；同文件条目按数组序串行累积——第二条基于第一条结果）→ 全部通过 → 逐文件写回
   *  一次（判失败 → 零写；写失败 → 同本地 edit-batch 既有原子语义）。 */
  const editBatch = async (args) => {
    const edits = args.edits
    if (!Array.isArray(edits) || edits.length === 0) {
      throw new Error("edits must be a non-empty array of {path, old_string, new_string}")
    }
    assertEditArgsExclusive(args)
    const groups = new Map() // path → { path, raw, content, edits }
    for (const e of edits) {
      // 2026-09-05 用户裁定（CLI parity——本地 edit-batch 同句）：条目自带 path 优先；
      // 缺省回退顶层 path（pathOf——path/filePath 别名同单形态）
      const p = e.path ?? pathOf(args)
      if (!p) throw new Error("each edit must have a path — give each entry its own path or pass a top-level path")
      validateEditEntry(e, { label: `edit for ${p}: `, rich: false })
      let g = groups.get(p)
      if (!g) {
        g = { path: p, raw: "", content: "", edits: [] }
        groups.set(p, g)
      }
      g.edits.push(e)
    }
    for (const g of groups.values()) {
      g.raw = await readBuffer(g.path)
      g.content = normalizeEOL(g.raw)
    }
    const outcomes = []
    for (const g of groups.values()) {
      for (const e of g.edits) {
        const out = computeEditEntry(g.content, e, { path: g.path, abortPrefix: EDIT_ABORT_PREFIX })
        outcomes.push({ g, out })
        g.content = out.updated // 同文件串行累积
      }
    }
    for (const g of groups.values()) {
      await writeBuffer(g.path, joinWithEol(normalizeEOL(g.content).split("\n"), g.raw))
    }
    return outcomes.map((o) => `OK: edited ${o.g.path} via IDE (${o.out.occurrences} occurrence(s))${o.out.note ? ` — ${o.out.note}` : ""}`).join("\n")
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

    onToolCall: (name, args, toolId) => {
      const id = toolCallId()
      // D15.8（advisor 🔴#1 修复）：模型级 id 每轮重置（sse.mjs finalizeToolCalls 内
      // seq=0——call_0 call_1… 跨轮/跨消息可重复——设计自注「跨 turn 不保证唯一」）。
      // 因此 push 前若队列已有同名同 toolId 条目，它必是结果永不回调的陈旧孤儿
      // （dispatch 失败/中断路径不调 onToolResult——T-F5 契约）——先弹出再入队——
      // 精确配对恒命中最新——"下个同名结果永不配到旧项"（设计目标，无需动 dispatch）。
      if (toolId != null) {
        for (let i = toolQueue.length - 1; i >= 0; i--) {
          if (toolQueue[i].name === name && toolQueue[i].toolId === toolId) toolQueue.splice(i, 1)
        }
      }
      toolQueue.push({ name, id, toolId: toolId ?? null })
      update("tool_call", {
        toolCallId: id,
        title: name,
        kind: inferToolKind(name),
        status: "in_progress",
        rawInput: args ?? {},
        content: [contentBlock(JSON.stringify(args ?? {}))],
      })
    },

    onToolResult: (name, result, toolId) => {
      const id = takeToolId(name, toolId) ?? toolCallId()
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
        toolCallId: peekToolId(name) ?? toolCallId(), // D15.8：peek 不消费——result 仍要与自己的条目配对
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
     * - edit              → fs/read_text_file → computeEditEntry（本地权威——单/数组形态）→ fs/write_text_file
     *                      （§15.1 D15.7 委派——双通道同语义；数组=原子批量——逐条目串行累积）
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
      if (base === "edit" && (Array.isArray(args?.edits) || (path && typeof args?.old_string === "string" && typeof args?.new_string === "string"))) {
        try {
          const text = Array.isArray(args?.edits) ? await editBatch(args) : await editSingle(path, args)
          return { handled: true, result: text }
        } catch (e) {
          return { handled: true, result: `Error: ${e.message}` }
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
