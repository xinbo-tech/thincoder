/**
 * advisor/history.mjs — advisor history extraction: agent response table and conversation background.
 */
import { readFileSync } from "node:fs"
import { join } from "node:path"

export const ADVISOR_MD_PATH = ".thincoder/advisor.md"
const AGENT_RESPONSE_HEADER = "| # | Action | Detail |"

const DEFAULT_CRITERIA = `Review the code changes, focusing on:
1. Correctness: logic errors, edge cases, off-by-one, incomplete modifications
2. Security: unhandled exceptions, null references, resource leaks, race conditions
3. Consistency: alignment with existing project patterns and conventions
4. Completeness: missing callers, imports, or follow-up changes
5. Maintainability: vague naming, missing comments, overly complex logic`

/**
 * Extract the agent's response table (| # | Action | Detail |) — the fix-claims
 * reference for convergence rounds.
 * Semantics (decision 2026-08-08): without sinceIdx, scan BACKWARD for the
 * MOST RECENT response table (no prior-table index is carried anymore — the
 * agent response is a focus aid only; format drift falls back to the
 * no-response text and never drives control flow). With sinceIdx, scan
 * FORWARD from it (legacy callers/tests).
 * @param {Array} history — message history
 * @param {number} [sinceIdx] — legacy: start scanning forward from this index
 * @returns {string|null} the response table content, or null
 */
export function extractAgentResponseTable(history, sinceIdx) {
  const entries = Array.isArray(history) ? history : []
  if (sinceIdx !== undefined) {
    for (let i = sinceIdx; i < entries.length; i++) {
      const m = entries[i]
      if (m.role !== "assistant" || typeof m.content !== "string") continue
      if (m.content.includes(AGENT_RESPONSE_HEADER)) return m.content
    }
    return null
  }
  for (let i = entries.length - 1; i >= 0; i--) {
    const m = entries[i]
    if (m.role !== "assistant" || typeof m.content !== "string") continue
    if (m.content.includes(AGENT_RESPONSE_HEADER)) return m.content
  }
  return null
}

/**
 * Load review criteria: project .thincoder/advisor.md if present,
 * otherwise the built-in defaults.
 */
export function loadAdvisorMd(cwd) {
  try {
    return readFileSync(join(cwd, ADVISOR_MD_PATH), "utf8")
  } catch {
    return DEFAULT_CRITERIA
  }
}

/** Extract recent user↔assistant exchanges (up to maxTurns) for intent context. */
export function extractConversationBackground(history, maxTurns = 3) {
  const entries = Array.isArray(history) ? history : []
  const lines = []
  let turns = 0
  for (let i = entries.length - 1; i >= 0 && turns < maxTurns; i--) {
    const m = entries[i]
    if (m.role === "tool" || m.role === "system") continue
    if (typeof m.content !== "string") continue
    if (m.content.startsWith("[System reminder:") || m.content.startsWith("[System mode:") || m.content.startsWith("[Relevant memories")) continue
    // ^ [System mode:] is not currently generated anywhere — kept as forward-looking
    // defensive filtering in case convergence messages ever adopt a different prefix.
    if (m.role === "user" || m.role === "assistant") {
      lines.unshift(`${m.role === "user" ? "User" : "Assistant"}: ${m.content.slice(0, 400)}`)
      if (m.role === "user") turns++
    }
  }
  return lines.length > 0 ? lines.join("\n\n") : null
}
