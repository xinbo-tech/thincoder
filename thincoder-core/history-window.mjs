/**
 * history-window.mjs — lazy human-line window (restore / render-facing):
 * historyWindow + tool-call/result pairing + the real-user-message predicate.
 *
 * Pure functions — no fs, no host imports (node --test drives it directly).
 * Window semantics follow the restore contract (turnStart / reminder-skip /
 * reasoning), plus one frame rule: an assistant frame becomes ONE message
 * carrying its tool cards nested (rules below).
 *
 * 承接：会话数据面的「人读线」窗口切分（分段恢复 / 逐页回看）——与磁盘会话档
 * 同源（`{hash}.json.N`），本档只读数组、不触盘。
 */

/** Real user message predicate (shared by the slot metadata digest and the window).
 *  NOTE: returns true for an EMPTY string content — rule 1 layers a trim() check on top.
 *  Null-safe（非对象 / 缺内容 ⇒ false——调用面含批量过滤）。 */
export function isRealUserMsg(m) {
  return m?.role === "user" && typeof m?.content === "string" && !m.content.startsWith("[System reminder:")
}

/** Page size for lazy history loading (initial paint + scroll-back pages).
 *  200 = the first-window size parity with the main line's initial window; loadOlder
 *  scroll-back pages step by the same constant. */
export const HISTORY_PAGE_SIZE = 200

/** Read-side timestamp compat: the real-message writer stamps `ts` (epoch-ms); older
 *  files may carry `timestamp`; even older carry neither → null. Field name on the
 *  wire stays `timestamp` (consumers zero-rename). */
function tsOf(m) {
  const ts = m?.ts ?? m?.timestamp
  return typeof ts === "number" ? ts : null
}

function kindOf(m) {
  return m?.type ?? m?.role
}

function toolCallsOf(m) {
  if (!m || !Array.isArray(m.tool_calls)) return []
  return m.tool_calls.filter((tc) => tc && typeof tc === "object")
}

function reasoningOf(m) {
  const r = m.reasoning_content ?? m.reasoning
  return typeof r === "string" && r.trim() !== "" ? r : null
}

/** Assistant frame text = string content only (multimodal arrays are not renderable). */
function textOf(m) {
  return typeof m.content === "string" ? m.content : null
}

/** Ghost frame (rules 2/6): no visible text ∧ no tool_calls ∧ no reasoning → skip
 *  (everything else is kept — a content-null pure-tool frame renders through its cards). */
function isGhostAssistant(m) {
  const text = textOf(m)
  const hasText = text !== null && text.trim() !== ""
  return !hasText && toolCallsOf(m).length === 0 && reasoningOf(m) === null
}

/**
 * Rules 3/4 — full-history rolling pairing: every tool entry is matched to the most
 * recent assistant frame (before it) that declared its tool_call_id; each tool entry
 * is consumed at most once (parallel batches complete out of order — id matching,
 * declaration order preserved per frame). Orphan determination is against the FULL
 * history: a window-local "orphan" whose frame lives outside the window is still
 * consumed here, so it never renders standalone on a second page (防跨页双显).
 * Returns { frameResults, ownerOf }:
 *  - frameResults: frame idx → Map(callId → tool entry idx) — cards per frame
 *  - ownerOf: tool entry idx → consuming frame idx (absent = true orphan)
 */
function pairToolEntries(history) {
  const total = history.length
  const frameResults = new Map()
  const ownerOf = new Map()
  const pending = [] // unpaired declarations (declaration order) — [{ frame, callId }]
  for (let i = 0; i < total; i++) {
    const m = history[i]
    if (kindOf(m) === "assistant") {
      for (const tc of toolCallsOf(m)) {
        if (tc.id !== undefined && tc.id !== null) pending.push({ frame: i, callId: tc.id })
      }
    } else if (kindOf(m) === "tool" && m.tool_call_id !== undefined && m.tool_call_id !== null) {
      // most-recent declarer first (a normal file has at most one unpaired declaration per id)
      for (let p = pending.length - 1; p >= 0; p--) {
        if (String(pending[p].callId) === String(m.tool_call_id)) {
          const { frame } = pending[p]
          pending.splice(p, 1)
          let map = frameResults.get(frame)
          if (!map) { map = new Map(); frameResults.set(frame, map) }
          map.set(String(m.tool_call_id), i)
          ownerOf.set(i, frame)
          break
        }
      }
    }
  }
  return { frameResults, ownerOf }
}

/**
 * Window into the human line for lazy history loading (rules 1-6). `before` = null
 * takes the LAST page (first paint); otherwise the page [s, e) ending just before
 * `before`. Half-open [s, e) keeps loadOlder pages from re-rendering the boundary
 * message. `idx` values are GLOBAL history indexes — pagination never renumbers.
 */
export function historyWindow(history, before, pageSize = HISTORY_PAGE_SIZE) {
  const total = Array.isArray(history) ? history.length : 0
  if (total === 0) return { messages: [], hasOlder: false }
  const { frameResults, ownerOf } = pairToolEntries(history)
  const end = before == null ? total : Math.max(0, Math.min(before, total))
  const start = Math.max(0, end - pageSize)
  const messages = []
  const visible = (i) => {
    const k = kindOf(history[i])
    if (k === "user") {
      const m = history[i]
      return isRealUserMsg(m) && typeof m.content === "string" && m.content.trim() !== ""
    }
    if (k === "assistant") return !isGhostAssistant(history[i])
    if (k === "tool") return !ownerOf.has(i) // true orphan (unowned across the whole history) → top-level fallback
    return false
  }
  for (let i = start; i < end; i++) {
    const m = history[i]
    const kind = kindOf(m)
    if (kind === "user") {
      // Rule 1: skip = ¬(isRealUserMsg ∧ content.trim() ≠ "")
      if (isRealUserMsg(m) && typeof m.content === "string" && m.content.trim() !== "") {
        messages.push({ kind: "user", text: m.content, timestamp: tsOf(m), idx: i })
      }
    } else if (kind === "assistant") {
      if (isGhostAssistant(m)) continue
      // Rule 5: turnStart = the previous VISIBLE message is a user or there is none —
      // scan back past skipped entries (reminder / consumed tool / ghost frame — a skip
      // never resets the turn, matching the main line's in-turn semantics)
      let prevVisibleKind = null
      for (let j = i - 1; j >= 0; j--) {
        if (visible(j)) { prevVisibleKind = kindOf(history[j]); break }
      }
      // Rules 3/4: frame tools[] = one card per declared call, declaration order (a result
      // may sit past the window's end — pairing is against the full history)
      const matched = frameResults.get(i)
      const tools = []
      for (const tc of toolCallsOf(m)) {
        const toolIdx = matched?.get(String(tc.id))
        const toolMsg = toolIdx !== undefined ? history[toolIdx] : null
        tools.push({
          id: tc.id ?? null,
          name: tc.function?.name ?? null,
          args: typeof tc.function?.arguments === "string" ? tc.function.arguments : null,
          result: toolMsg && typeof toolMsg.content === "string" ? toolMsg.content : null,
        })
      }
      messages.push({
        kind: "assistant",
        text: textOf(m),
        reasoning: reasoningOf(m),
        timestamp: tsOf(m),
        idx: i,
        turnStart: prevVisibleKind === null || prevVisibleKind === "user",
        tools,
      })
    } else if (kind === "tool") {
      // A consumed tool entry produces no message of its own (rendered with its frame) —
      // only a true orphan falls back to the top level (rules 3/4)
      if (!ownerOf.has(i)) {
        messages.push({
          kind: "tool",
          name: typeof m.name === "string" ? m.name : null,
          text: typeof m.content === "string" ? m.content : null,
          timestamp: tsOf(m),
          idx: i,
        })
      }
    }
  }
  return { messages, hasOlder: start > 0 }
}
