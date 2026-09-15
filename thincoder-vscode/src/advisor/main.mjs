/**
 * advisor/main.mjs — advisor system-prompt selection, follow-up building, session assembly.
 * VS Code port of thincoder CLI src/advisor.mjs (kept in sync with the CLI).
 * User-message building lives in advisor/messages.mjs; project-context discovery in
 * advisor/project-context.mjs; execution (tool loop, provider resolution, review entry)
 * in advisor/run.mjs; history extraction in advisor/history.mjs.
 * Path classification (code/doc/temp) lives in @thincoder/core/conventions.mjs — the single
 * authority the gates and guards consume (PORTABILITY VSC mirror · VP-10).
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
import { loadAdvisorPrompt } from "@thincoder/core/prompt-files.mjs"
import { extractAgentResponseTable } from "./history.mjs"
import { buildAdvisorUserMessage, resolveScopeFiles, buildDesignApprovalBlock } from "./messages.mjs"
import { buildConvergenceBody } from "./convergence.mjs"
import { escapeLiteralEscapes } from "@thincoder/core/escape.mjs"
// re-export：历史调用方（advisor.test.mjs 等）从本模块 import escapeLiteralEscapes
export { escapeLiteralEscapes }
// Re-exported for callers that import from this module (tests, run.mjs).
export { ADVISOR_MD_PATH, extractAgentResponseTable, extractConversationBackground } from "./history.mjs"
export { buildAdvisorUserMessage } from "./messages.mjs"

// ────────────────────────────────────────
// Prompt files — loaded at module init（W2：加载根 = 核包单一解析面 `loadAdvisorPrompt`；
// 本端 `src/prompts/` 已删——缺档语义不变 = 抛错（契约 9 / D-C13；CLI U2 同法））
// ────────────────────────────────────────

const ADVISOR_ROUND1 = loadAdvisorPrompt("advisor-round1.md")
// ROUND2/3 are used whenever a convergence round (round 2+) is being built:
// in-run session continuation replaces the system prompt with them, and a
// rebuilt fresh session (e.g. after a failed review) also selects them via
// buildAdvisorSystemPrompt when _advisorRound > 0.
const ADVISOR_ROUND2 = loadAdvisorPrompt("advisor-round2.md")
const ADVISOR_ROUND3 = loadAdvisorPrompt("advisor-round3.md")
// Design-review prompt — hard-loaded like the round prompts (decision
// 2026-08-21): a missing file means a broken installation, and silently
// degrading to a lesser in-code prompt would quietly strip the approval-signal
// and citation rules, disabling design approval entirely. loadAdvisorPrompt throws.
const ADVISOR_DESIGN = loadAdvisorPrompt("advisor-design.md")

// ────────────────────────────────────────
// System prompt building
// ────────────────────────────────────────

/**
 * Build the system prompt for an advisor review session.
 * @param {Object} agent — the parent agent
 * @param {Object|null} [prior] — prior review output (full text; decision 2026-08-08)
 * @param {string} [reviewType] — "design" for design review, undefined/"code" for code review
 * @param {Object|null} [rv] — §9 D-24b per-review instance context { round, priorOutput }
 *   （async advisor——2026-09-06）：优先于全局 _advisorRound/_lastAdvisorOutput（多评审并行隔离）
 * @returns {string} the system prompt
 */
export /** Append local time so the reviewer knows "now" (same grounding as the agent loop). */
function withTime(prompt) {
  const now = new Date()
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "local"
  return prompt + `\n\nCurrent time: ${now.toLocaleString("sv-SE")} (${timeZone}).`
}

/** §9 D-24b：本次评审调用的轮次（conv round——同步路径 = 全局已完成数 + 1；
 *  async 实例 = rv.round 即实例已完轮数 + 1——launch 时解析）。 */
function convRound(agent, rv) {
  return rv?.round ?? ((agent._advisorRound || 0) + 1)
}

/** §9 D-24b：评审实例 prior 读数（rv.priorOutput 显式优先——次回落到存储输出）。 */
function rvPrior(agent, rv) {
  if (rv?.priorOutput !== undefined && rv?.priorOutput !== null) return rv.priorOutput
  return ((agent._advisorRound || 0) > 0 ? agent._lastAdvisorOutput : null)
}

export function buildAdvisorSystemPrompt(agent, prior, reviewType, rv = null) {
  // Round decision is DETERMINISTIC (decision 2026-08-08): _advisorRound > 0
  // with a stored review output means convergence (round 2+); 0 means round 1.
  // No prior-table parsing, no all-clear phrase matching — the round counter
  // and the stored output are the only inputs. A restarted process has
  // _advisorRound 0 → conservative full re-review.
  // §9 D-24b：async 实例经 rv 显式携带（并发隔离——不读全局）；rv.round =
  // 本次调用轮次（实例已完轮数 + 1——launch 解析）；rv.priorOutput 仅 2+ 轮携带。
  const round = convRound(agent, rv)
  const effectivePrior = prior ?? rvPrior(agent, rv)
  const hasPrior = round >= 2 && !!effectivePrior
  // Design review: round 1 uses the dedicated design-review prompt (full scope +
  // approval token); rounds 2+ converge like code reviews (verify agent fix claims).
  if (reviewType === "design") {
    if (!hasPrior) return ADVISOR_DESIGN
    if (round === 2) return ADVISOR_ROUND2
    return ADVISOR_ROUND3
  }
  if (!hasPrior) return ADVISOR_ROUND1
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
export function buildAdvisorFollowUp(agent, prior, scopeFiles = null, rv = null) {
  // §9 D-24b：async 实例经 rv 显式携带（并发隔离——不读全局）；轮次 = 本次调用轮次。
  const round = convRound(agent, rv)
  const p = prior ?? rvPrior(agent, rv)
  if (!p) {
    // Plain "System reminder:" prefix (no brackets) — same convention as the
    // round-1 path (some OpenAI-compatible servers parse '['-prefixed content
    // as structured data / expand escapes; see prepareAdvisorMessages).
    return "System reminder: convergence follow-up requested without a prior review — perform a fresh full review."
  }
  // Convergence semantics require round >= 2 (round 1 is the full review, not
  // verification). A direct caller with _advisorRound 0 would otherwise get a
  // meaningless "Round 1 — Strict Verification".
  if (round < 2) {
    return "System reminder: convergence follow-up requested at round 1 — a full review is already in progress; no prior verification exists yet."
  }
  const noResponseFallback = scopeFiles?.length
    ? "(Agent did not provide a response table — perform a fresh review of: " + scopeFiles.slice(0, 10).join(", ") + ")"
    : "(Agent did not provide a response table — perform a fresh full review; the review surface is unknown, ask the user for the file list)"
  const response = extractAgentResponseTable(agent.history) || noResponseFallback
  return buildConvergenceBody(p, response, round, scopeFiles)
}

/**
 * Resolve the review surface for the convergence fallback — moved to
 * messages.mjs so the legacy path shares it (see there).
 */

/**
 * Neutralize literal backslash escape sequences ("\\x", "\\u") that some
 * OpenAI-compatible servers interpret inside message content ("unexpected end
 * of hex escape" → 400 — observed 2026-08-06 when the conversation background
 * quoted "\\x" literals). Only sequences that would be INVALID when expanded
 * are doubled ("\\x" → literal "\\x" after server expansion); well-formed
 * "\\xNN" / "\\uNNNN" pass through untouched (they expand to a byte/codepoint).
 * Implementation lives in @thincoder/core/escape.mjs (CLI parity — the main-agent send path
 * src/provider.mjs applies it via escapeMessages since 2026-08-31).
 */


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
 * @param {string|null} [priorParam] — sync 路径的 prior 显式覆盖（direct callers）
 * @param {Object|null} [rv] — §9 D-24b 实例上下文 { round, priorOutput }（async advisor——
 *   2026-09-06——并发隔离：round = 本次调用轮次 = 实例已完轮数 + 1；rv 给定 → 轮次/prior
 *   全从 rv 解析（不读全局 _advisorRound/_lastAdvisorOutput、不跑 _mutatedThisRun 重置）
 * @param {string|null} [designId] — §29.1 F2a: injected next to the design token in
 *   the Approval Signal (round 1 + round 2+ — both values, verbatim anchor).
 */
export function prepareAdvisorMessages(agent, reviewType, designToken = null, documents = null, paths = null, priorParam = null, rv = null, designId = null) {
  // Deterministic convergence state (decision 2026-08-08): round 2+ requires
  // _advisorRound > 0 AND a stored prior review output. No history parsing.
  // priorParam (direct callers) wins over the stored output — same derivation
  // as buildAdvisorSystemPrompt (single source of truth for round semantics).
  const prior = rv
    ? (rv.round >= 2 ? rv.priorOutput : null)
    : (agent._advisorRound || 0) > 0 ? (priorParam ?? agent._lastAdvisorOutput) : null
  const isRound1 = rv ? rv.round <= 1 : (agent._advisorRound || 0) === 0

  // Design review round 1: the dedicated full-scope review with the approval
  // token (an independent gate — it runs even when a prior table exists, e.g.
  // after a failed design review). Fresh session.
  if (reviewType === "design" && isRound1) {
    return [
      { role: "system", content: withTime(buildAdvisorSystemPrompt(agent, prior, reviewType, rv)) },
      { role: "user", content: escapeLiteralEscapes(buildAdvisorUserMessage(agent, prior, reviewType, designToken, documents, paths, rv, designId)) },
    ]
  }

  // Every round is a FRESH session (decision d698434): round 2+ must NOT reuse
  // round 1's messages — the old read outputs are the top anchoring source of
  // re-review false reports (the model quoted pre-fix file content instead of
  // re-reading) and a token sink. The agent response table (fix claims) is
  // injected through buildAdvisorFollowUp instead; the system prompt carries
  // the round (ROUND2/ROUND3) via buildAdvisorSystemPrompt.
  // Guard matches buildAdvisorSystemPrompt's ROUND1 condition
  // (`!prior || _advisorRound === 0`): a stale prior table with _advisorRound 0
  // (history persists across runAgent calls) must yield a fresh round-1 review —
  // ROUND1 system prompt + full-scope user message, never the convergence
  // follow-up (which would contradict the ROUND1 system prompt). The
  // _advisorRound===0 half was lost in the _mutatedThisRun refactor and is
  // restored here (regression 67ac851 → 6e15a6b window).
  // No prior table: reset ONLY when this run made no code changes (user
  // decision 2026-08-05: any loop that modified code must NOT reset — the
  // advisor guard WILL push back, so the convergence round must keep advancing
  // toward the cap; a run with no mutations has no push-back risk and a reset
  // is safe). Deterministic runtime state (`_mutatedThisRun`) decides — never
  // model output (phrases/table headers drift; three rounds of false reports
  // proved it). Either way the message is a fresh full review (no issue list
  // exists without a prior table) — only the round counter differs.
  // §9 D-24b：async（rv 给定）不经此重置段——实例轮次由 _advisorRuns 记录管理。
  if (!prior || isRound1) {
    if (!rv && !(agent._mutatedThisRun ?? false)) {
      // New review cycle (first review, all-clear, or no code changes): reset
      // the round so the cycle gets its own 5-round budget.
      agent._advisorRound = 0
    }
    // Mutations exist → KEEP the round (cap keeps advancing through retries).
    const user = buildAdvisorUserMessage(agent, prior, reviewType, designToken, documents, paths, rv, designId)
    return [
      { role: "system", content: withTime(buildAdvisorSystemPrompt(agent, prior, reviewType, rv)) },
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
  const followUp = buildAdvisorFollowUp(agent, prior, scopeFiles, rv)
  // §29.1 F2a（2026-09-07——对齐 CLI src/advisor.mjs:266-282）：design round 2+ 注入段——
  // 重锚评审范围 + 注入本轮 token 与 designId 两值——async 修正轮续跑必须能 re-approve
  // （评审员看不到新 token 就永不 re-approve——VS 实测三次 designId not found 的修复面）。
  if (reviewType === "design") {
    const docList = Array.isArray(documents)
      ? documents.filter((d) => typeof d === "string" && d.trim())
      : []
    const scopeBlock = docList.length > 0
      ? `\n\n## Documents to Review\nThe documents below are the review scope. Review ONLY these files — do not scan git diff or read any other files.\n${docList.map((d) => `- ${d} — Read this file in full`).join("\n")}`
      : ""
    const tokenBlock = designToken ? `\n\n${buildDesignApprovalBlock(designToken, designId)}` : ""
    return [
      { role: "system", content: withTime(buildAdvisorSystemPrompt(agent, prior, reviewType, rv)) },
      { role: "user", content: escapeLiteralEscapes(followUp + scopeBlock + tokenBlock) },
    ]
  }
  return [
    { role: "system", content: withTime(buildAdvisorSystemPrompt(agent, prior, reviewType, rv)) },
    { role: "user", content: escapeLiteralEscapes(followUp) },
  ]
}
