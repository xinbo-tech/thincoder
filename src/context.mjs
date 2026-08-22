/**
 * context.mjs — Context management and compaction
 * When no measured token count is available, use estimation as fallback (ASCII/4 + non-ASCII/1, no tokenizer dependency).
 * When a measured value exists (response usage.prompt_tokens), trust it — estimation underestimates CJK by 3-4x and relying solely on it may never trigger compaction.
 * Compaction strategy: summarize everything before the tail into one LLM note, keep the latest N messages verbatim.
 * NOTE: no dedicated head is kept (KEEP_HEAD = 0) — in multi-task sessions the earliest messages are
 * typically a COMPLETED earlier task; preserving them verbatim anchored the model's attention on stale
 * work after compaction. The earliest messages now go into the summary (which distinguishes completed
 * vs in-progress work), so the post-compaction context anchors on the current task (recent tail) only.
 */

import { chat } from "./provider/index.mjs"
import { estimateText } from "./provider/rate.mjs"
import { specForModel } from "./config.mjs"

const IMAGE_TOKEN_ESTIMATE = 2000 // rough estimate for image content tokens (CLI legacy 256 underestimated real image costs, delaying compaction)

/** Rough token count for a list of messages (body + reasoning + tool_calls params) */
export function estimateTokens(messages) {
  let tokens = 0
  for (const m of messages) {
    if (typeof m.content === "string") tokens += estimateText(m.content)
    else if (Array.isArray(m.content)) {
      for (const part of m.content) {
        if (part.type === "text") tokens += estimateText(part.text)
        else if (part.type === "image_url") tokens += IMAGE_TOKEN_ESTIMATE
      }
    }
    if (typeof m.reasoning_content === "string") tokens += estimateText(m.reasoning_content)
    for (const tc of m.tool_calls ?? []) {
      tokens += estimateText(tc.function?.name ?? "") + estimateText(tc.function?.arguments ?? "")
    }
  }
  return tokens
}

const KEEP_HEAD = 0 // No dedicated head: earliest messages may be a COMPLETED earlier task in multi-task
// sessions — keeping them verbatim anchored attention on stale work. Everything before the tail is
// summarized (the summary itself distinguishes completed vs in-progress work; see SUMMARIZE_PROMPT).
// Tail size scales with the model context window (~30 messages per 100K tokens),
// capped at 40% of history so small histories don't over-reserve. Window-adaptive
// replaces the old fixed 10: on a 1M window, 10 messages is too thin for recent work.
function keepTailSize(provider, historyLen) {
  // provider is guaranteed at every call site (runAgent always builds one); specForModel
  // degrades to DEFAULT_SPEC (128K) only if provider/model is somehow absent — acceptable
  // because the 40% history cap still bounds the tail.
  const ctxWindow = specForModel(provider?.model ?? "").context
  return Math.min(Math.max(10, Math.floor((ctxWindow / 100_000) * 30)), Math.floor(historyLen * 0.4))
}

const SUMMARIZE_PROMPT = `You are a conversation compressor. Summarize the following agent work log into a compact summary for use as context in the ongoing conversation.
Requirements:
- Write in first person, present tense — these are "my" handover notes, continuing my own train of thought
- Most important: preserve design decisions and their reasons — architecture choices, API contracts, naming conventions, trade-off rationale. These are the anchors the subsequent code must not deviate from
- Distinguish COMPLETED vs IN-PROGRESS work: completed tasks get a ONE-LINE recap each (what was done, key outcome); spend the detail budget on unresolved issues, next steps, and the CURRENT task
- The user's most recent request defines the current task — anchor on it. Earlier requests are likely already completed and only need the one-line recap; do NOT preserve them at full fidelity
- Keep: files modified and why, unresolved issues, next steps
- Drop: pleasantries, repetition, fine-grained tool output details
- Honestly mark uncertain items: anything not actually verified must say "unverified"; do not present guesses as facts
- Use bullet-point output; aim for information completeness, not a hard word limit (old 500-char cap is deprecated; in a 1M-context era, err on the long side)

Work log:
`

/** Context prefix after compaction, informing the agent what happened */
const COMPACTION_PREFIX =
  "[Context was automatically compacted. Below is a summary of earlier work. " +
  "Treat it as notes, not proof — trust its conclusions (don't redo what it reports as done) " +
  "but re-verify transient state with tools. Check memory_search for any missing decisions.]\n\n"

/** After this many consecutive compaction summary failures, degrade to deterministic truncation (losing info is better than task-killing 400 errors) */
export const COMPRESS_FAILURE_LIMIT = 3

/** Task re-injection reminder prefix (after compaction, clear old versions from history first for a single source of truth) */
const TASK_REINJECT_PREFIX = "[System reminder: your current task list after compaction:"

/** Truncation fallback note (used when the summary LLM fails repeatedly; no LLM call) */
const FALLBACK_NOTE =
  "[Context was truncated after repeated summarization failures. " +
  "The middle portion of earlier work was dropped WITHOUT a summary. " +
  "Re-verify any state you need with tools before relying on it.]\n\n"

/**
 * Split history into head / middle (to be summarized) / tail; return null if no middle to compress.
 * head is normally empty (KEEP_HEAD = 0 — earliest messages go into the summary); the
 * tool_calls-extension logic below is defensive for future KEEP_HEAD > 0.
 * The tail boundary must include any assistant whose tool results are in the tail — if the assistant is in the middle,
 * the summary swallows it, leaving orphan tool results → protocol 400.
 */
function splitHistory(history, keepTail) {
  if (history.length <= KEEP_HEAD + keepTail + 1) return null
  let headEnd = KEEP_HEAD
  // head must not end with dangling tool_calls: when assistant declares tool_calls, all its tool results must stay in head.
  // Parallel calls: one assistant followed by multiple tool messages — accepting only one still causes 400, must collect all
  if (history[headEnd - 1]?.role === "assistant" && history[headEnd - 1].tool_calls?.length) {
    while (headEnd < history.length && history[headEnd].role === "tool") headEnd++
  }
  let tailStart = history.length - keepTail

  // Tool messages in the tail region whose assistant tool_calls are in the middle: the summary would swallow the assistant,
  // leaving orphan tool results → protocol 400. Collect tool_call_ids from the tail, find their owner assistants and pull them into tail
  const tailToolIds = new Set()
  for (let i = tailStart; i < history.length; i++) {
    if (history[i].role === "tool") tailToolIds.add(history[i].tool_call_id)
  }
  for (let i = tailStart - 1; i > headEnd; i--) {
    const m = history[i]
    if (m.role === "assistant" && m.tool_calls?.some((tc) => tailToolIds.has(tc.id))) {
      tailStart = i
      break
    }
  }

  // skip orphan tool messages at the new tail boundary (tool whose assistant was pulled in above)
  // NOTE: single-assistant assumption — the backwards scan pulls the nearest owner only; in
  // practice a tail spans at most one assistant→tools cycle (parallel calls share one assistant).
  // Bounds-guarded so an all-tool tail cannot push tailStart past history.length.
  while (tailStart < history.length && tailStart > headEnd && history[tailStart].role === "tool") {
    tailStart++
  }
  if (tailStart <= headEnd) return null
  return { headEnd, tailStart }
}

/**
 * pushReal — the single entry point for REAL conversation messages.
 * A real message (user input, assistant reply, tool result, multimodal image) is appended to BOTH:
 *   agent.history      — the machine context (compaction shrinks this)
 *   agent._fullHistory — the NEVER-COMPACTED human-readable record (persistence source)
 * Machine-only messages ([System reminder:...], compaction notes, task/plan/checkpoint re-injections)
 * are pushed directly to agent.history WITHOUT going through here, so they never enter _fullHistory.
 * The two lines are written independently at the source — no after-the-fact delta sync.
 */
export function pushReal(agent, msg) {
  if (!Array.isArray(agent._fullHistory)) agent._fullHistory = []
  agent._fullHistory.push(msg)
  agent.history.push(msg)
}

/** Replace middle with a note, then re-inject task/plan state (shared by LLM summary and truncation fallback) */
function applyCompression(agent, headEnd, tailStart, note) {
  // _fullHistory already holds every real message (written at the source via pushReal),
  // so compaction only shrinks the machine line — nothing to preserve here.
  // head is normally empty (KEEP_HEAD = 0) — the summary note becomes the first message,
  // which is exactly the intent: post-compaction context anchors on the current task, not on
  // possibly-completed earlier requests.
  const head = agent.history.slice(0, headEnd)
  const tail = agent.history.slice(tailStart)
  agent.history = [
    ...head,
    { role: "user", content: note },
    { role: "assistant", content: "Understood. I'll continue from these notes, re-verifying anything transient." },
    ...tail,
  ]
  // Measured token baseline is invalidated along with old history (prompt_tokens were for pre-compaction context), fall back to estimation until next response
  agent._lastPromptTokens = null
  agent._usageAtLen = null

  // After compaction, re-inject the task list (the agent needs to know what it was doing).
  // Single source of truth: first remove any stale re-injections from the tail, then inject the latest version —
  // no longer embedded in the summary body (would duplicate and grow stale)
  agent.history = agent.history.filter(
    (m) => !(m.role === "user" && typeof m.content === "string" && m.content.startsWith(TASK_REINJECT_PREFIX))
  )
  if (agent.tasks.length > 0) {
    const taskSummary = agent.tasks.map((t) => `- [${t.status}] ${t.title}`).join("\n")
    agent.history.push({
      role: "user",
      content: `${TASK_REINJECT_PREFIX}\n${taskSummary}\nContinue from where you left off.]`,
    })
  }

  // Plan mode compaction: re-inject plan mode guidance
  if (agent.planMode) {
    agent.history.push({
      role: "user",
      content: "[System reminder: plan mode is active. Explore the codebase read-only, design your solution, then call plan with action='exit' to present it for user approval.]",
    })
  }
}

/**
 * If history exceeds threshold, compact it. Returns whether compaction happened.
 * Only called at safe points in the loop (history ends with user or tool message — a complete exchange boundary).
 * Automatically re-injects task list state after compaction.
 * @param {object} agent
 * @param {number} threshold - compaction threshold in tokens
 * @param {object} callbacks - { onToken, onReasoning, onCompress } — summary generation is SILENT
 *   (never forwards onToken/onReasoning: the compaction process is an internal mechanism, not a model reply)
 * @param {object} extras - { systemPrompt?, tools? } — estimated overhead for the pure-estimation
 *   path (no measured baseline); the measured path already includes system+tools in prompt_tokens.
 */
export async function compressIfNeeded(agent, threshold, callbacks, extras = {}, signal) {
  const history = agent.history
  // Prefer the real baseline: the last response's prompt_tokens is the measured value for the full context (system+tools+history).
  // Subsequent appended messages use estimation as increment; when no measured value exists (first turn / after restore / right after compaction), fall back to pure estimation
  const overhead =
    (extras.systemPrompt ? estimateText(extras.systemPrompt) : 0) +
    (extras.tools ? estimateText(JSON.stringify(extras.tools)) : 0)
  const tokens =
    agent._lastPromptTokens != null
      ? agent._lastPromptTokens + estimateTokens(history.slice(agent._usageAtLen ?? history.length))
      : estimateTokens(history) + overhead
  if (tokens <= threshold) return false

  const keepTail = keepTailSize(agent.provider, history.length)
  const split = splitHistory(history, keepTail)
  if (!split) {
    // History is too short (≤KEEP_HEAD+keepTail+1 messages) to find a middle section, but tokens exceed threshold — typically a single giant message
    // (large paste / huge injection). When summarization has no room, degrade to deterministic shrinking to ensure context always reduces
    return shrinkOversized(agent)
  }

  const middle = history.slice(split.headEnd, split.tailStart)
  const serialized = middle
    .map((m) => {
      const toolNote = m.tool_calls ? ` [called tools: ${m.tool_calls.map((t) => t.function?.name).join(", ")}]` : ""
      // user messages get a wider cap (8000): cutting off a long user-pasted requirement loses original intent; tool/assistant capped at 2000 is enough
      const cap = m.role === "user" ? 8000 : 2000
      // Multimodal messages (array content): extract the TEXT parts — the image itself can't be
      // summarized, but any accompanying text (e.g. "看这张图" + image) must not be silently lost
      let text = ""
      if (typeof m.content === "string") text = m.content
      else if (Array.isArray(m.content)) text = m.content.filter((p) => p?.type === "text").map((p) => p.text ?? "").join(" ")
      return `[${m.role}]${toolNote} ${text.slice(0, cap)}`
    })
    .join("\n")

  // The summary is a plain-text task, no reasoning needed — passing thinking to the compaction provider wastes tokens.
  // Silent by design (D11): no onToken/onReasoning — the compaction process must not stream to the frontend.
  // signal propagates user cancellation (Ctrl+C) to the in-flight summary call.
  const summary = await chat({ ...agent.provider, thinking: null, reasoningEffort: null }, {
    messages: [{ role: "user", content: SUMMARIZE_PROMPT + serialized }],
    signal,
  })

  applyCompression(agent, split.headEnd, split.tailStart, COMPACTION_PREFIX + summary.content)

  return true
}

/**
 * Deterministic truncation fallback: called when the summary LLM fails repeatedly, no network call.
 * Drops the middle so the task can continue. Returns whether truncation happened.
 */
export function compressFallback(agent) {
  const keepTail = keepTailSize(agent.provider, agent.history.length)
  const split = splitHistory(agent.history, keepTail)
  if (!split) return false
  applyCompression(agent, split.headEnd, split.tailStart, FALLBACK_NOTE)
  return true
}

/** Hard truncation limit for a single message body: when exceeded and the splitter can't find a middle section, truncate to a stub (prevents one giant message from blocking compaction) */
const OVERSIZE_CONTENT_LIMIT = 8_000

/**
 * Deterministic shrinking: last resort when splitHistory can't find a middle section (history too short) but threshold is exceeded. No LLM call.
 * Truncates user/tool message bodies exceeding OVERSIZE_CONTENT_LIMIT to a stub (keeps head + tail);
 * does not touch reasoning_content (DeepSeek/Kimi echo protocol) or tool_calls pairing structure — no protocol 400 risk.
 * Only called after compressIfNeeded determines threshold is exceeded. Returns whether any message was truncated.
 */
function shrinkOversized(agent, limit = OVERSIZE_CONTENT_LIMIT) {
  let shrunk = false
  for (const m of agent.history) {
    if ((m.role !== "user" && m.role !== "tool") || typeof m.content !== "string") continue
    if (m.content.length <= limit) continue
    // Truncate keeping head + tail, insert stub in between; keepHead/keepTail proportional but not exceeding 50%/25% of limit
    const keepHead = Math.min(Math.floor(limit * 0.5), 4000)
    const keepTail = Math.min(Math.floor(limit * 0.25), 2000)
    m.content =
      m.content.slice(0, keepHead) +
      `\n[... ${m.content.length - keepHead - keepTail} chars truncated — single message too large for context window ...]\n` +
      m.content.slice(-keepTail)
    shrunk = true
  }
  if (shrunk) {
    // Same as compaction: measured token baseline is invalidated by the changed history, fall back to estimation until next response
    agent._lastPromptTokens = null
    agent._usageAtLen = null
  }
  return shrunk
}
