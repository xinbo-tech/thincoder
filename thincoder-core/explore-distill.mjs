/**
 * explore-distill.mjs — End-of-run exploration distillation (AGENT-LOOP §13 +
 * CONTEXT-COMPACTION §5, 2026-08-23). 2026-09-05 module-split: moved verbatim out of
 * context.mjs (524 > 500 hard limit). The main agent's machine line is flooded by inline
 * step-by-step exploration (read/grep/...). At run end we distill THIS run's exploration
 * tool-results into one semantic summary note that replaces them in the machine line,
 * while agent._fullHistory (the human line) stays untouched. VS Code compact.mjs
 * distillation mirrors this module (same-name file in thincoder-vscode/src, cross-repo
 * parity anchors point here).
 */

import { chat } from "./provider/index.mjs"
import { safeSliceUTF16 } from "./text-budget.mjs"

/** Read-only knowledge tools counted as "exploration" (execute writes files → never exploration). */
export const EXPLORE_TOOLS = new Set([
  "read", "grep", "glob", "ls", "code_search", "doc_search", "repo_outline",
])

/** Summary prompt for turning a burst of exploration results into a semantic summary. */
export const EXPLORE_SUMMARY_PROMPT = `You are distilling exploration tool results. Summarize the following read-only codebase exploration into a compact semantic summary for the main agent's own context.

Requirements:
- Capture WHAT was discovered, WHERE (which files / directories / symbols), and the KEY CONCLUSIONS — do not list tool calls mechanically
- Keep actionable facts the main agent needs to continue: code locations, function names, file paths, structure, and open questions the exploration raised
- Drop raw tool-output noise, repeated lines, and verbatim file dumps — keep only what must be remembered
- Be honest: mark anything not actually verified as "unverified"; do not present guesses as facts
- Use bullet points; aim for information completeness, not a hard word limit

Exploration log:
`

/** tool_calls name across both stored shapes ({function:{name}} and flat {name}). */
function toolCallName(tc) {
  return tc?.function?.name ?? tc?.name ?? ""
}

/** Tool that produced a tool-result message (falls back to its owner assistant's tool_call). */
function toolResultName(msg, ownerToolCalls) {
  if (typeof msg?.name === "string" && msg.name) return msg.name
  const owner = (ownerToolCalls ?? []).find((tc) => tc.id === msg?.tool_call_id)
  return owner ? toolCallName(owner) : ""
}

/**
 * Find the pure-exploration "assistant(tool_calls)→tool…" pair blocks added since `start`.
 * A block is explorable only when EVERY tool call AND every tool result in it is an exploration
 * tool — mixed blocks (read + edit in one turn) stay untouched, or we'd orphan the edit pairing.
 */
function findExplorationBlocks(history, start) {
  const blocks = []
  let i = start
  while (i < history.length) {
    const m = history[i]
    if (m?.role === "assistant" && Array.isArray(m.tool_calls) && m.tool_calls.length > 0) {
      let j = i + 1
      while (j < history.length && history[j]?.role === "tool") j++
      const toolMsgs = history.slice(i + 1, j)
      const allCallsExplore = m.tool_calls.every((tc) => EXPLORE_TOOLS.has(toolCallName(tc)))
      const allResultsExplore = toolMsgs.length > 0 && toolMsgs.every((t) => EXPLORE_TOOLS.has(toolResultName(t, m.tool_calls)))
      if (allCallsExplore && allResultsExplore) {
        blocks.push({ start: i, end: j, messages: history.slice(i, j), toolCount: toolMsgs.length })
      }
      i = j
    } else {
      i++
    }
  }
  return blocks
}

/** Serialize a batch of exploration messages for the summary LLM (same shape as compaction serialization). */
function serializeExplorationMessages(messages) {
  const cap = 8000 // exploration results ARE the signal to distill — generous cap (quality-first, N1)
  return messages
    .map((m) => {
      const toolNote = m.tool_calls ? ` [called tools: ${m.tool_calls.map(toolCallName).join(", ")}]` : ""
      let text = ""
      if (typeof m.content === "string") text = m.content
      else if (Array.isArray(m.content)) text = m.content.filter((p) => p?.type === "text").map((p) => p.text ?? "").join(" ")
      return `[${m.role}]${toolNote} ${safeSliceUTF16(text, cap)}`
    })
    .join("\n")
}

/**
 * Core (shared) distillation: replace this run's pure-exploration pair blocks with a single
 * "[Exploration summary]" note placed where the first block was. Returns a NEW history array,
 * or null when there is nothing to shrink (<3 exploration results / LLM failure). Pairing-safe:
 * whole assistant→tool blocks are removed, so no orphan tool_calls/tool can survive.
 */
async function distillExplorations(history, start, provider, signal, agent, depth) {
  if (!Array.isArray(history) || history.length - start < 2) return null
  const blocks = findExplorationBlocks(history, start)
  const resultCount = blocks.reduce((n, b) => n + b.toolCount, 0)
  if (resultCount < 3) return null

  const serialized = blocks.map((b) => serializeExplorationMessages(b.messages)).join("\n")

  let summary
  try {
    // Silent by design (D11): thinking:null and no onToken/onReasoning — this internal
    // distillation must not stream to the frontend. signal propagates user cancellation.
    const resp = await chat({ ...provider, thinking: null, reasoningEffort: null }, {
      messages: [{ role: "user", content: EXPLORE_SUMMARY_PROMPT + serialized }],
      signal,
      // §18.6 D-TR4：轨迹元数据增补——kind=distill（探索蒸馏面——agent 元数据透出；
      // depth 经 summarizeRunExplorations 参数透传——agent.mjs 主作用域传入）
      logCtx: {
        stage: "distill", child: agent?._logId ?? null, kind: "distill",
        role: agent?._role ?? null, depth: depth ?? null,
        session: agent?._sessionStart ?? null, cwd: agent?.cwd ?? process.cwd(),
        traces: agent?.config?.traces?.enabled !== false,
      },
    })
    summary = resp?.content
  } catch {
    return null // N3: never block the run's return or lose history — original results stay
  }
  if (!summary) return null

  const drop = new Set()
  for (const b of blocks) for (let k = b.start; k < b.end; k++) drop.add(k)
  const note = { role: "user", content: "[Exploration summary]\n" + summary }
  const next = []
  let inserted = false
  for (let k = 0; k < history.length; k++) {
    if (drop.has(k)) {
      if (!inserted) { next.push(note); inserted = true }
      continue
    }
    next.push(history[k])
  }
  return next
}

/**
 * End-of-run exploration distillation (runAgent's final return). Shrinks the MACHINE line
 * (agent.history) only; agent._fullHistory is never touched. Triggers when this run added ≥3
 * exploration tool results; on LLM failure it silently keeps the original history (N3).
 * The distillation itself is silent and never streams (D11); `callbacks.onDistilled` fires
 * ONLY after the replacement actually lands (never on no-op/failure) — callers persist the
 * compressed session (SEND-STALL-DISTILL §2.3).
 */
export async function summarizeRunExplorations(agent, callbacks, signal, depth = 0) {
  const next = await distillExplorations(agent.history, agent._runStartHistoryLen ?? 0, agent.provider, signal, agent, depth)
  if (!next) return
  agent.history = next
  // The machine line changed shape — the measured token baseline was for the pre-shrink context.
  // Invalidate so the next compaction check re-estimates instead of over-counting stale history.
  agent._lastPromptTokens = null
  agent._usageAtLen = null
  // The compressed machine line must reach the disk: the run's own save already happened,
  // so without this hook the async distill would leave the session un-compressed on exit.
  callbacks.onDistilled?.()
}
