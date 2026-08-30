import { listSlots } from "../session.mjs"
import { ansi, C } from "./ansi.mjs"
import { describeToolArgs, toolArgsLines } from "./tool-args.mjs"
import { slimToolResultForDisplay } from "./tool-events.mjs"

/** Lazy history window (parity with VS Code HISTORY_PAGE_SIZE): first paint loads
 *  the latest INITIAL_HISTORY_MESSAGES, then PgUp-at-top loads HISTORY_PAGE_MESSAGES
 *  more. Rebuilding an 8000-message session eagerly froze startup + first render. */
export const INITIAL_HISTORY_MESSAGES = 200
export const HISTORY_PAGE_MESSAGES = 50

/**
 * Convert history[startIdx, endIdx) into conversation source lines (label lines
 * with a leading blank separator, content lines, tool summaries). `history` is the
 * FULL array so the tool-result lookahead (history[i+1]) works across the page edge.
 */
export function historyToLines(history, startIdx, endIdx) {
  const lines = []
  // Cross-page turn state: if the message BEFORE this page is a tool/assistant,
  // the page starts mid-turn and must NOT emit a fresh "❯ ThinCoder:" label
  // (a turn gets ONE label in the live run; history stores one assistant
  // message per LLM call, so a multi-call turn would otherwise paint a label
  // on every segment — the reported "why so many ❯ ThinCoder:" bug).
  let inTurn = false
  if (startIdx > 0) {
    const prev = history[startIdx - 1]
    inTurn = prev?.role === "assistant" || prev?.role === "tool"
  }
  for (let i = startIdx; i < endIdx; i++) {
    const m = history[i]
    if (m.role === "user") {
      if (typeof m.content === "string" && m.content.startsWith("[System reminder:")) continue
      // Label only when there is something to show: multimodal user messages
      // (content = [text, image] array, injected after read_image) render NO
      // text on restore — the image is invisible to the terminal and the user
      // just saw it live. A label with no content under it is noise (user
      // report 2026-08-30: stray "❯ You:" after the read_image block).
      const userText = typeof m.content === "string"
        ? m.content
        : (Array.isArray(m.content) ? m.content.find((p) => p?.type === "text")?.text ?? "" : "")
      const displayable = typeof m.content === "string" ? !!m.content : !!(userText && userText.trim())
      if (!displayable) continue
      if (lines.length > 0) lines.push({ text: "", color: C.dim })
      lines.push({ text: "❯ You:", color: ansi.bold + C.user })
      if (userText) lines.push({ text: userText, color: C.text, _kind: "text" })
      inTurn = false
    } else if (m.role === "assistant") {
      if (!inTurn) {
        // Turn start — the only place the assistant label is emitted.
        if (lines.length > 0) lines.push({ text: "", color: C.dim })
        lines.push({ text: "❯ ThinCoder:", color: ansi.bold + C.assistant })
      }
      inTurn = true
      // Reasoning restored as ONE C.reason line entry — the exact shape
      // flushStream produces live (single line, full string, no indent), so
      // buildConvLines treats restored thinking IDENTICALLY: >12 wrapped rows
      // fold under the named "▶ thinking" header, short fragments stay visible
      // — same thresholds, same label, both paths. (History: restored thinking
      // used to be split into dim fragments — the consecutive-dim rule's >8
      // threshold never fired on short agentic thinking bursts, so restored
      // sessions showed every fragment unfolded and mislabeled "tool output";
      // user reported thinking "no longer folds" after a restart, 2026-08-30.)
      const reasoning = m.reasoning_content ?? m.reasoning
      if (typeof reasoning === "string" && reasoning.trim()) lines.push({ text: reasoning, color: C.reason, _kind: "thinking" })
      if (typeof m.content === "string" && m.content) lines.push({ text: m.content, color: C.text })
      for (const tc of m.tool_calls ?? []) {
        const toolResult = history[i + 1]
        const hasResult = toolResult?.role === "tool" && toolResult?.tool_call_id === tc.id
        const tcName = tc.function?.name ?? "?"
        // Tool arguments are part of the visible conversation (2026-08-30 user
        // report: restored sessions showed no args at all — the deprecated
        // display snapshot made historyToLines the ONLY restore path, and it
        // never rendered arguments). Header line = readable key-args summary
        // (describeToolArgs, vscode card-header parity); full pretty JSON rides
        // below as dim lines, auto-folded by the consecutive-dim rule exactly
        // like the restored tool result — same convention, same readability.
        let argsSummary = ""
        let argJson = []
        let rawArgs = null
        try {
          const args = JSON.parse(tc.function?.arguments || "{}")
          argsSummary = describeToolArgs(tcName, args)
          argJson = toolArgsLines(args)
        } catch { rawArgs = String(tc.function?.arguments ?? "").slice(0, 120) /* malformed — raw fallback */ }
        // ONE BLOCK PER TOOL CALL — same carrier the live path emits (user
        // ruling 2026-08-30): header=name+args, body=args JSON + result.
        // Same carrier the live path emits — identical fields, so buildConvLines
        // renders both through one code path (line-level parity by construction).
        lines.push({
          text: "", color: C.tool,
          _kind: "tool",
          _toolBlock: {
            name: tcName,
            roundTag: "",
            argsSummary,
            argsJson: rawArgs ? [rawArgs] : argJson,
            output: [],
            result: hasResult ? slimToolResultForDisplay(String(toolResult.content)) : null,
            summary: null,
            started: 0,
            done: true,
            elapsed: null,
          },
        })
      }
    }
  }
  return lines
}


/**
 * Lazy-restore a session into state.lines: materialize only the latest
 * INITIAL_HISTORY_MESSAGES, set the _history* counters the loadOlder closure
 * reads, and prepend the "… N more earlier messages" placeholder. Shared by
 * startup restore and /session switching (the display snapshot is deprecated).
 */
export function restoreLines(state, history) {
  const total = Array.isArray(history) ? history.length : 0
  if (total === 0) return
  const start = Math.max(0, total - INITIAL_HISTORY_MESSAGES)
  state._lineIdCounter = state._lineIdCounter ?? 0
  const fresh = historyToLines(history, start, total)
  // Stable per-line ids (P1, 2026-08-30): fold keys for tool blocks derive from
  // _lineId so loadOlder's head-unshift cannot re-bind an expanded block to a
  // different tool (positional tool-{i} keys drift under unshift).
  for (const l of fresh) l._lineId = ++state._lineIdCounter
  state.lines.push(...fresh)
  state._historyLoaded = total - start
  state._historyTotal = total
  state._hasOlder = start > 0
  if (state._hasOlder) {
    state.lines.unshift({ text: `… ${start} more earlier messages (PgUp at top to load)`, color: C.dim })
  }
}
/** Startup screen + session recovery + background indexing.
 *  Extracted from index.mjs.
 *  ctx: { agent, state, opts, pushLine, pushLabel, render, startWizard } */
export function showStartup(ctx) {
  const { agent, state, opts, pushLine, pushLabel, render, startWizard } = ctx

  // Startup screen
  if (!agent.provider.apiKey) {
    pushLabel(`Welcome to ThinCoder!`, ansi.bold + C.tool)
    pushLine("No API key configured yet — entering initial setup (Esc to skip anytime)", C.text)
    startWizard()
  } else {
    pushLine(`Welcome to ThinCoder. Provider: ${agent.activeProvider} / ${agent.provider.model}`, C.dim)
  }
  pushLine(`Tools: ${agent.tools.map((t) => t.name).join(", ")}`, C.dim)

  // Recover previous session: rebuild from history (lazy — display snapshot is
  // deprecated; it drifted out of sync with history on VS Code writes).
  if (opts.restored?.history?.length) {
    restoreLines(state, opts.restored.history)
    pushLabel(`── Restored previous session (${opts.restored.history.length} messages); /new for a fresh session ──`, C.warn)
  }

  // Hint when multiple sessions exist
  const allSlots = listSlots(agent.cwd)
  if (allSlots.length > 1) {
    pushLine(`Tip: ${allSlots.length} sessions — /session to view/switch`, C.dim)
  }
  render()
}

/** Background indexing (runs after startup screen, non-blocking); progress shown in status bar, not conversation.
 *   Prefers git diff incremental (fast); falls back to full scan when git is unavailable or on first run. */
export async function backgroundIndex(ctx) {
  const { agent, state, render } = ctx
  const { codeSync, docSync, gitSync } = await import("../memory.mjs")
  const cwd = agent.cwd
  let codeFiles = 0, docFiles = 0

  state.status = "Indexing..."
  render()

  const gitRes = await gitSync(agent.memory, cwd, {
    onProgress: (p) => {
      if (p.phase === "index" && p.current % 5 === 0) {
        state.status = `Indexing... ${p.current}/${p.total}`
        render()
      }
    }
  })

  if (gitRes !== null) {
    // Git incremental succeeded, count directly
    codeFiles = agent.memory.db.prepare(`SELECT COUNT(DISTINCT path) AS n FROM code_chunks`).get()?.n ?? 0
    docFiles = agent.memory.db.prepare(`SELECT COUNT(DISTINCT path) AS n FROM doc_chunks`).get()?.n ?? 0
  } else {
    // Fall back to full scan (codeSync and docSync in parallel — read/write different tables, SQLite WAL supports this natively)
    const [codeRes, docRes] = await Promise.allSettled([
      codeSync(agent.memory, cwd, {
        onProgress: (p) => {
          if (p.phase === "index" && p.current % 30 === 0) {
            state.status = `Indexing code... ${p.current}/${p.total}`
            render()
          }
        }
      }),
      docSync(agent.memory, cwd, {
        onProgress: (p) => {
          if (p.phase === "index" && p.current % 10 === 0) {
            state.status = `Indexing docs... ${p.current}/${p.total}`
            render()
          }
        }
      }),
    ])
    if (codeRes.status === "fulfilled") {
      codeFiles = agent.memory.db.prepare(`SELECT COUNT(DISTINCT path) AS n FROM code_chunks`).get()?.n ?? 0
    }
    if (docRes.status === "fulfilled") {
      docFiles = agent.memory.db.prepare(`SELECT COUNT(DISTINCT path) AS n FROM doc_chunks`).get()?.n ?? 0
    }
  }

  state.status = codeFiles || docFiles
    ? `Ready — idx code ${codeFiles} doc ${docFiles}`
    : "Ready"
  render()
}
