/**
 * explore-distill.mjs — End-of-run exploration distillation (AGENT-LOOP §13 +
 * CONTEXT-COMPACTION §5, 2026-08-23). 2026-09-05 module-split: moved verbatim out of
 * the former compact.mjs (503 > 500 hard limit) — the core mirror lives in
 * thincoder-core/explore-distill.mjs (parity anchors point at the core side; this
 * end's repoint to the core face rides W15).
 *
 * The main agent's machine line is flooded by inline step-by-step exploration (read/grep/...).
 * At run end we distill THIS run's exploration tool-results into one semantic summary note that
 * replaces them in the machine line (history); the human line (fullHistory, a separate array) is
 * never touched. Same semantics as thincoder-cli/src/context.mjs — the VOICE line is the CLI.
 */

import { chat } from "@thincoder/core/provider/core.mjs"
import { safeSliceUTF16 } from "./agent/run-helpers.mjs"

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
 * Core (shared) distillation: replace the pure-exploration pair blocks added since `runStartLen`
 * with a single "[Exploration summary]" note placed where the first block was. Returns a NEW
 * history array, or null when there is nothing to shrink (<3 exploration results / LLM failure).
 * Pairing-safe: whole assistant→tool blocks are removed, so no orphan tool_calls/tool can survive.
 */
async function distillExplorations(history, runStartLen, provider, signal, agent = null) {
  const start = runStartLen ?? 0
  if (!Array.isArray(history) || history.length - start < 2) return null
  const blocks = findExplorationBlocks(history, start)
  const resultCount = blocks.reduce((n, b) => n + b.toolCount, 0)
  if (resultCount < 3) return null

  const serialized = blocks.map((b) => serializeExplorationMessages(b.messages)).join("\n")

  let summary
  try {
    // Silent by design (D11): thinking:null and no stream callbacks — this internal
    // distillation must not reach the frontend. (compactHistory parity: signal rides along.)
    // TRACE-STORE-VSC（§18.6 D-TR4 镜像——CLI explore-distill.mjs logCtx 同款）：kind=
    // distill + agent 元数据透出（role/depth 经 agent 绑定——hydrate 打点 _role/_depth）；
    // session/cwd 供轨迹对回；traces 开关沿 agent.config（D-TR6——缺省 OFF）。agent 经
    // summarizeRunExplorations 尾参线程化（run-stages fireEndOfRunDistill 传入）；cwd 恒为
    // agent.cwd——本调用点不依赖 recordChatTrace 的 process.cwd() 兜底（该兜底仅覆盖无
    // agent 作用域的未来新增调用点；VSC extension host cwd ≠ 工作区——轨迹归属错误）。
    const resp = await chat({ ...provider, thinking: null, reasoningEffort: null }, {
      messages: [{ role: "user", content: EXPLORE_SUMMARY_PROMPT + serialized }],
      signal: signal ?? null,
      logCtx: {
        stage: "distill", kind: "distill",
        role: agent?._role ?? null,
        depth: agent?._depth ?? null,
        session: agent?._sessionStart ?? null,
        cwd: agent?.cwd ?? null,
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
 * End-of-run exploration distillation — ASYNC since 2026-08-25 (SEND-STALL-DISTILL): runAgent
 * fires it AFTER onComplete (never awaited inside the turn); the NEXT runAgent awaits it before
 * pushing its user input, so the summary lands in the machine line before the next LLM call.
 * Shrinks the MACHINE line only — the caller keeps fullHistory untouched. Returns a NEW array,
 * or null when nothing shrank (<3 exploration results or the LLM failed). Mirrors CLI
 * summarizeRunExplorations; only the call shape differs (this end passes the machine line
 * explicitly, like compactHistory).
 */
export async function summarizeRunExplorations(history, runStartLen, provider, signal, agent = null) {
  return distillExplorations(history, runStartLen, provider, signal, agent)
}
