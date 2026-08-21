/**
 * advisor.mjs — advisor system-prompt selection, follow-up building, session assembly.
 * User-message building lives in advisor/messages.mjs; execution (tool loop, provider
 * resolution, review entry) in advisor/run.mjs; history extraction in advisor/history.mjs.
 * repos.mjs still hosts the doc-file classifier (isDocFile) used by mutation tracking.
 *
 * The advisor runs as a read-only exploration sub-agent with tools
 * (read, glob, grep, ls, lsp, code_search) — ZERO git, every round. The change
 * surface comes from the review scope (paths / _touchedFiles), never from git;
 * verification is `read`-only with quoted-line evidence (7d49a52, d3be613).
 *
 * Config:
 *   { advisor: { enabled: true, provider: "deepseek", model: "deepseek-chat" } }
 *   provider + model are optional — defaults to the main agent's provider/model.
 *
 * Convergence protocol:
 *   Round 1: full review → produces a numbered issue table.
 *   Agent responds with a response table per issue (fix claims).
 *   Round 2: semi-convergence — verifies the prior table + can flag obvious new issues.
 *   Round 3+: strict convergence — only checks the prior issue table.
 *   The prior issue table IS injected into rounds 2+ (decision 2026-08-05,
 *   reversed) — it is the ONLY complete verification list: the agent response
 *   table covers only issues the agent chose to answer, so skipped issues would
 *   silently escape convergence without it. The fix-claim table travels as a
 *   focus reference only. Restatement risk is handled mechanically:
 *   host-verified citations reject references that do not match the current
 *   disk state, and fresh sessions exclude old read data.
 *   Each round replaces the system prompt (ROUND1 → ROUND2 → ROUND3) so the
 *   round-1 full-scope mandate can't bleed into later rounds, plus a mechanical
 *   cap (MAX_ADVISOR_ROUNDS in run.mjs) refuses a 6th review call outright.
 *   Rounds 2+ also declare all earlier diffs STALE and require read-verified
 *   file:line evidence for any unfixed/new finding — see docs/design/ADVISOR-CONVERGENCE.md.
 *
 * Session memory (agent._advisorSession):
 *   RETAINED for initialization compatibility but NEVER read (decision d698434):
 *   every review round builds a fresh [system, user] session — round 2+ must not
 *   reuse round 1's messages, because the old read outputs are the anchoring
 *   source of re-review false reports and a token sink. Convergence data (prior
 *   issue table + agent response table) travels via buildAdvisorFollowUp.
 *   The field is reset by runAgent; the write sites are harmless leftovers.
 *
 * Project customisation: .thincoder/advisor.md in the project root.
 */
import { readFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { extractAgentResponseTable } from "./advisor/history.mjs"
import { buildAdvisorUserMessage, resolveScopeFiles } from "./advisor/messages.mjs"
import { buildConvergenceBody } from "./advisor/convergence.mjs"
import { escapeLiteralEscapes } from "./escape.mjs"
// Re-export for run.mjs and tests (keeps their imports from "../advisor.mjs" stable)
export { ADVISOR_MD_PATH, extractAgentResponseTable, extractConversationBackground } from "./advisor/history.mjs"
export { buildAdvisorUserMessage } from "./advisor/messages.mjs"

const __dirname = dirname(fileURLToPath(import.meta.url))

// ────────────────────────────────────────
// Prompt files — loaded at module init
// ────────────────────────────────────────

function loadPrompt(file, name) {
  try {
    return readFileSync(join(__dirname, "prompts", file), "utf8")
  } catch {
    throw new Error(`${name} missing from the installation (prompts/${file}) — reinstall thincoder or restore the file`)
  }
}

const ADVISOR_ROUND1 = loadPrompt("advisor-round1.md", "advisor-round1.md")
// ROUND2/3 are used whenever a convergence round (round 2+) is being built:
// in-run session continuation replaces the system prompt with them, and a
// rebuilt fresh session (e.g. after a failed review) also selects them via
// buildAdvisorSystemPrompt when _advisorRound > 0.
const ADVISOR_ROUND2 = loadPrompt("advisor-round2.md", "advisor-round2.md")
const ADVISOR_ROUND3 = loadPrompt("advisor-round3.md", "advisor-round3.md")
// Design-review prompt — hard-loaded like the round prompts (decision
// 2026-08-21): a missing file means a broken installation, and silently
// degrading to a lesser in-code prompt would quietly strip the approval-signal
// and citation rules, disabling design approval entirely. loadPrompt throws.
const ADVISOR_DESIGN = loadPrompt("advisor-design.md", "advisor-design.md")

// ────────────────────────────────────────
// System prompt building
// ────────────────────────────────────────

/**
 * Build the system prompt for an advisor review session.
 * @param {Object} agent — the parent agent
 * @param {Object|null} [prior] — prior review output (full text; decision 2026-08-08)
 * @param {string} [reviewType] — "design" for design review, undefined/"code" for code review
 * @returns {string} the system prompt
 */
/** Append local time so the reviewer knows "now" (same grounding as the agent loop). */
function withTime(prompt) {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "local"
  return prompt + `\n\nCurrent time: ${new Date().toLocaleString("sv-SE")} (${timeZone}).`
}

export function buildAdvisorSystemPrompt(agent, prior, reviewType) {
  // Round decision is DETERMINISTIC (decision 2026-08-08): _advisorRound > 0
  // with a stored review output means convergence (round 2+); 0 means round 1.
  // No prior-table parsing, no all-clear phrase matching — the round counter
  // and the stored output are the only inputs. A restarted process has
  // _advisorRound 0 → conservative full re-review.
  const hasPrior = (agent._advisorRound || 0) > 0 && (prior ?? agent._lastAdvisorOutput)
  // Design review: round 1 uses the dedicated design-review prompt (full scope +
  // approval token); rounds 2+ converge like code reviews (verify agent fix claims).
  if (reviewType === "design") {
    if (!hasPrior) {
      return ADVISOR_DESIGN
    }
    const round = (agent._advisorRound || 0) + 1
    if (round === 2) return ADVISOR_ROUND2
    return ADVISOR_ROUND3
  }
  if (!hasPrior) return ADVISOR_ROUND1
  const round = (agent._advisorRound || 0) + 1
  if (round === 2) return ADVISOR_ROUND2
  return ADVISOR_ROUND3
}

// ────────────────────────────────────────
// Follow-up building (round 2+)
// ────────────────────────────────────────

/**
 * Build a follow-up user message for round 2+ — the agent's response table +
 * round-aware instructions, without re-sending the full round-1 context.
 * Deliberately NO git information injected (no diff snapshot, no git context):
 * git output misled re-reviews — committed fixes never show in `git diff HEAD`,
 * so the model read "no changes" as "no fixes". Verification is `read`-only.
 * NOTE: the caller (prepareAdvisorMessages) applies escapeLiteralEscapes to
 * the return value — direct callers must do the same (the prior table and
 * agent response can quote literal "\x"/"\u" sequences).
 * @param {Object} agent — the parent agent (history used for the response table)
 * @param {Object|null} prior — prior issue table (extracted from history when null)
 * @param {string[]|null} [scopeFiles] — review surface for the no-response fallback (cwd-relative)
 * @returns {string} the follow-up user message — or a plain "System reminder: …"
 *   fresh-review fallback (NO brackets — some OpenAI-compatible servers parse
 *   '['-prefixed content as structured data / expand escapes) when no prior
 *   review exists at all (caller misuse; the response-table extraction would
 *   otherwise scan history from index 0 and could match an unrelated stale table)
 */
export function buildAdvisorFollowUp(agent, prior, scopeFiles = null) {
  // Convergence follow-up REQUIRES a prior review record — the full output of
  // the last review, injected VERBATIM (decision 2026-08-08: the model
  // understands the review output; no table/header/phrase parsing). The caller
  // usually passes it; fall back to the stored agent._lastAdvisorOutput.
  const p = prior ?? agent._lastAdvisorOutput
  if (!p) {
    // Plain "System reminder:" prefix (no brackets) — same convention as the
    // round-1 path (some OpenAI-compatible servers parse '['-prefixed content
    // as structured data / expand escapes; see prepareAdvisorMessages).
    return "System reminder: convergence follow-up requested without a prior review — perform a fresh full review."
  }
  // Convergence semantics require round >= 2 (round 1 is the full review, not
  // verification). A direct caller with _advisorRound 0 would otherwise get a
  // meaningless "Round 1 — Strict Verification".
  if ((agent._advisorRound || 0) < 1) {
    return "System reminder: convergence follow-up requested at round 1 — a full review is already in progress; no prior verification exists yet."
  }
  const noResponseFallback = scopeFiles?.length
    ? "(Agent did not provide a response table — perform a fresh review of: " + scopeFiles.slice(0, 10).join(", ") + ")"
    : "(Agent did not provide a response table — perform a fresh full review; the review surface is unknown, ask the user for the file list)"
  const response = extractAgentResponseTable(agent.history) || noResponseFallback
  const round = (agent._advisorRound || 0) + 1
  return buildConvergenceBody(p, response, round, scopeFiles)
}

/**
 * Resolve the review surface for the convergence fallback — moved to
 * messages.mjs so the legacy path shares it (see there).
 */

// escapeLiteralEscapes 已抽到 ./escape.mjs（advisor 与主 agent 发送路径共用），
// 这里 re-export 保持既有 import 稳定。
export { escapeLiteralEscapes }


/**
 * Build the advisor conversation for this run.
 * EVERY call builds a fresh [system, user] session (decision d698434) — no
 * session reuse across rounds: round 1 = full scope (ROUND1 prompt), rounds
 * 2+ = convergence (ROUND2/ROUND3 prompt + fix-claims follow-up).
 * @param {Object} agent — the parent agent
 * @param {string} [reviewType] — "design" or "code" (default)
 * @param {string|null} [designToken] — design-review approval token (design only)
 * @param {string[]|null} [documents] — design review only: explicit list of doc paths to review (passed through to buildAdvisorUserMessage)
 * @param {string[]|null} [paths] — code review only: explicit list of file/dir paths to review
 */
export function prepareAdvisorMessages(agent, reviewType, designToken = null, documents = null, paths = null, priorParam = null) {
  // Deterministic convergence state (decision 2026-08-08): round 2+ requires
  // _advisorRound > 0 AND a stored prior review output. No history parsing.
  // priorParam (direct callers) wins over the stored output — same derivation
  // as buildAdvisorSystemPrompt (single source of truth for round semantics).
  const prior = (agent._advisorRound || 0) > 0 ? (priorParam ?? agent._lastAdvisorOutput) : null

  // Design review round 1: the dedicated full-scope review with the approval
  // token (an independent gate — it runs even when a prior review exists, e.g.
  // after a failed design review). Fresh session.
  if (reviewType === "design" && (agent._advisorRound || 0) === 0) {
    return [
      { role: "system", content: withTime(buildAdvisorSystemPrompt(agent, prior, reviewType)) },
      { role: "user", content: escapeLiteralEscapes(buildAdvisorUserMessage(agent, prior, reviewType, designToken, documents, paths)) },
    ]
  }

  // Every round is a FRESH session (decision d698434): round 2+ must NOT reuse
  // round 1's messages — the old read outputs are the top anchoring source of
  // re-review false reports (the model quoted pre-fix file content instead of
  // re-reading) and a token sink. The agent response table (fix claims) is
  // injected through buildAdvisorFollowUp instead; the system prompt carries
  // the round (ROUND2/ROUND3) via buildAdvisorSystemPrompt.
  // No prior review output: reset ONLY when this run made no code changes (user
  // decision 2026-08-05: any loop that modified code must NOT reset — the
  // advisor guard WILL push back, so the convergence round must keep advancing
  // toward the cap; a run with no mutations has no push-back risk and a reset
  // is safe). Deterministic runtime state (`_mutatedThisRun`) decides — never
  // model output (phrases/table headers drift; three rounds of false reports
  // proved it). Either way the message is a fresh full review (no prior output
  // exists without a completed review) — only the round counter differs.
  if (!prior || (agent._advisorRound || 0) === 0) {
    if (!(agent._mutatedThisRun ?? false)) {
      // New review cycle (first review, all-clear, or no code changes): reset
      // the round so the cycle gets its own 5-round budget.
      agent._advisorRound = 0
    }
    // Mutations exist → KEEP the round (cap keeps advancing through retries).
    const user = buildAdvisorUserMessage(agent, prior, reviewType, designToken, documents, paths)
    return [
      { role: "system", content: withTime(buildAdvisorSystemPrompt(agent, prior, reviewType)) },
      {
        role: "user",
        // NOTE (2026-08-06): the leading prefix is a PLAIN "System reminder:",
        // NOT "[System reminder: ...]" — some OpenAI-compatible servers try to
        // parse content that STARTS with '[' as structured content (or expand
        // escape sequences in it). A literal "\x" inside the conversation
        // background (e.g. the parent agent quoting escape sequences) then
        // fails server-side as "unexpected end of hex escape" → 400. Plain
        // prefix keeps the review message a plain string everywhere.
        // The whole content also passes through escapeLiteralEscapes (below)
        // so literal "\x"/"\u" quoted by the parent agent can never form an
        // invalid escape when the server expands them.
        content: escapeLiteralEscapes(`System reminder: no prior issue table is being carried into this review (first review, app restart, or session clear) — start with a fresh full review.\n\n${user}`),
      },
    ]
  }

  // Convergence rounds (2+): fresh [system(ROUND2/3), user(prior table + fix
  // claims)]. buildAdvisorFollowUp carries BOTH the prior issue table (the
  // only complete verification list — decision 2026-08-05, reversed) and the
  // agent's fix-claim table (focus reference). buildAdvisorSystemPrompt
  // selects ROUND2 for round 2, ROUND3 for rounds 3+ — a failed review retry
  // keeps _advisorRound so the convergence prompt matches the attempt count.
  // scopeFiles gives the fallback (agent gave no response table) a concrete
  // review surface.
  const scopeFiles = resolveScopeFiles(agent, paths)
  return [
    { role: "system", content: withTime(buildAdvisorSystemPrompt(agent, prior, reviewType)) },
    { role: "user", content: escapeLiteralEscapes(buildAdvisorFollowUp(agent, prior, scopeFiles)) },
  ]
}
