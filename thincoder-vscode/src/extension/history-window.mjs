/**
 * history-window.mjs — lazy-history window over the human line (SESSION-RESTORE-PARITY
 * split, 2026-09-09): historyWindow + tool-call/result pairing + isRealUserMsg moved
 * out of session-io.mjs so the restore chain lives in one module and session-io stays
 * under the 500-line limit. Pure functions — no vscode/fs imports (node --test直驱).
 *
 * Restore semantics = CLI startup.mjs historyToLines (turnStart/reminder-skip/reasoning),
 * plus VSC-specific frame rendering: an assistant frame becomes ONE message carrying its
 * tool cards nested (rules below — see docs/design/SESSION-RESTORE-PARITY.md).
 */

/** Real user message predicate (CLI parity — extractSlotMeta/historyWindow share it).
 *  NOTE: returns true for an EMPTY string content — rule 1 layers a trim() check on top. */
export function isRealUserMsg(m) {
  return m.role === "user" && typeof m.content === "string" && !m.content.startsWith("[System reminder:")
}

/** Page size for lazy history loading (initial paint + scroll-back pages).
 *  200 = CLI INITIAL_HISTORY_MESSAGES parity for the FIRST window (user ruling
 *  2026-09-09 — SESSION-RESTORE-PARITY H); loadOlder scroll-back pages step by the
 *  same constant (VSC deliberately 200, not the CLI's PgUp 20). */
export const HISTORY_PAGE_SIZE = 200

/** Read-side timestamp compat: pushReal stamps `ts` (epoch-ms) on real messages;
 *  older files may carry `timestamp`; even older carry neither → null. Field name
 *  on the wire stays `timestamp` (webview zero-rename, F). */
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

/** 幽灵帧（规则 2/6）：无可见文本 ∧ 无 tool_calls ∧ 无 reasoning → skip（其余全保留——
 *  content null 的纯工具回合帧靠卡渲染，不丢）。 */
function isGhostAssistant(m) {
  const text = textOf(m)
  const hasText = text !== null && text.trim() !== ""
  return !hasText && toolCallsOf(m).length === 0 && reasoningOf(m) === null
}

/**
 * 规则 3/4 — full-history rolling pairing: every tool entry is matched to the most
 *  recent assistant frame (before it) that declared its tool_call_id; each tool entry
 *  is consumed at most once (parallel batches complete out of order — id matching,
 *  declaration order preserved per frame). Orphan determination is against the FULL
 *  history (评审 #4 scope): a window-local "orphan" whose frame lives outside the
 *  window is still consumed here, so it never renders standalone on a second page
 *  (防跨页双显). Returns { frameResults, ownerOf }:
 *  - frameResults: frame idx → Map(callId → tool entry idx) — cards per frame
 *  - ownerOf: tool entry idx → consuming frame idx (absent = true orphan)
 */
function pairToolEntries(history) {
  const total = history.length
  const frameResults = new Map()
  const ownerOf = new Map()
  const pending = [] // 未配调用（声明序）——[{ frame, callId }]
  for (let i = 0; i < total; i++) {
    const m = history[i]
    if (kindOf(m) === "assistant") {
      for (const tc of toolCallsOf(m)) {
        if (tc.id !== undefined && tc.id !== null) pending.push({ frame: i, callId: tc.id })
      }
    } else if (kindOf(m) === "tool" && m.tool_call_id !== undefined && m.tool_call_id !== null) {
      // 最近声明者优先（正常文件每 id 至多一个未配声明——无歧义）
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
 * Window into the human line for lazy history loading (rules 1-6 — see the design
 * doc). `before` = null takes the LAST page (first paint); otherwise the page
 * [s, e) ending just before `before`. Half-open [s, e) keeps loadOlder pages from
 * re-rendering the boundary message. `idx` values are GLOBAL history indexes —
 * pagination never renumbers messages.
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
    if (k === "tool") return !ownerOf.has(i) // 真孤儿（全历史无主）→ 顶层保底渲染
    return false
  }
  for (let i = start; i < end; i++) {
    const m = history[i]
    const kind = kindOf(m)
    if (kind === "user") {
      // 规则 1（C——评审 #4 谓词精确化）：skip = ¬(isRealUserMsg ∧ content.trim() ≠ "")
      if (isRealUserMsg(m) && typeof m.content === "string" && m.content.trim() !== "") {
        messages.push({ kind: "user", text: m.content, timestamp: tsOf(m), idx: i })
      }
    } else if (kind === "assistant") {
      if (isGhostAssistant(m)) continue
      // 规则 5（A）：turnStart = 上一条**可见**消息为 user 或无可见前驱——从 i-1 回扫
      // 跳过条目（reminder/被消费 tool/幽灵帧——skip 不重置回合，CLI inTurn 语义）
      let prevVisibleKind = null
      for (let j = i - 1; j >= 0; j--) {
        if (visible(j)) { prevVisibleKind = kindOf(history[j]); break }
      }
      // 规则 3/4：帧 tools[] = 声明序逐调用配对（结果可跨窗口末界——全历史配对）
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
      // 被消费 tool 条目不独立产消息（随帧渲染）——真孤儿才落顶层保底（规则 3/4）
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
