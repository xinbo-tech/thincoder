/**
 * advisor/convergence.mjs — shared convergence-round message building (round 2+).
 * SINGLE source for the round-2+ sections used by BOTH the normal flow
 * (buildAdvisorFollowUp in advisor.mjs) and the legacy path (buildAdvisorUserMessage
 * in messages.mjs) — fixes must not be replicated in two places. Lives in its
 * own module to avoid the messages.mjs ↔ advisor.mjs import cycle.
 */

/**
 * Shared convergence-round instructions — single source for BOTH paths
 * (buildAdvisorUserMessage's legacy convergence block and
 * buildAdvisorFollowUp), so the wording cannot diverge.
 * Round 2 may flag obvious new issues; round 3+ is strict verification.
 * @param {number} round — convergence round number (2+)
 * @param {string[]|null} scopeFiles — optional file list for the no-response fallback
 * @returns {string[]} the numbered instruction lines (callers spread them)
 */
export function buildConvergenceInstructions(round, scopeFiles = null) {
  const fileList = scopeFiles?.length
    ? ` The review surface is: ${scopeFiles.slice(0, 10).join(", ")}.`
    : ""
  return [
    `1. IMPORTANT: verify EVERY item of the prior review output against the CURRENT FILE STATE with \`read\` — never decide based on earlier snapshots alone.${fileList}`,
    "2. STALE-CONTEXT WARNING: any diff or file content from earlier messages is a historical snapshot — treat it as expired. Only fresh `read` results describe the current state.",
    "3. You have no git tool; git output in earlier messages is historical and untrustworthy (committed fixes never show in a diff).",
    "4. `read` the files named in the prior review output (or the review surface above) in full — ALWAYS. Batch reads/greps in a single reply.",
    "5. Evidence rule: every 'Unfixed'/'New' finding MUST quote the exact line content from THIS round's `read` output (e.g. `run.mjs:180: timeoutId = setTimeout(...)`). Line numbers alone are NOT evidence — they may be stale or fabricated. Findings without a fresh quoted line are treated as unverified and will not be accepted.",
    "6. Produce your verification table. Do not re-read content you already have.",
    round === 2
      ? "7. You may flag obvious NEW issues introduced by the fixes (crashes, data loss, logic errors — not style)."
      : "7. Do NOT look for new issues.",
  ]
}

/**
 * Shared convergence body — SINGLE source for the round-2+ message sections
 * (decision 2026-08-08): the FULL verbatim prior review output is the only
 * complete verification list; the agent response table is a focus aid only.
 * Used by buildAdvisorFollowUp (the normal flow) and the legacy path in
 * messages.mjs (direct external callers of buildAdvisorUserMessage) — fixes
 * must not be replicated in two places.
 * @param {string} p — full prior review output (verbatim)
 * @param {string} response — agent fix-claims table (or fallback text)
 * @param {number} round — next round number (>= 2)
 * @param {string[]|null} [scopeFiles] — review surface for instructions
 * @returns {string} the convergence message
 */
export function buildConvergenceBody(p, response, round, scopeFiles) {
  const label = round === 2 ? "Verify Prior Table + Flag New Issues" : "Strict Verification"
  const reminder = round === 2
    ? "verify every item in the prior review output and flag only obvious new issues introduced by the fixes"
    : "strictly verify only the prior review output — do NOT look for new issues"
  const parts = [
    `## Round ${round} — ${label}`,
    "",
    `[System reminder: this is round ${round} of the convergence protocol. ` +
      `The system prompt for this round has already narrowed the review scope — follow it: ${reminder}.]`,
    "",
    // Prior review output IS in the context (decision 2026-08-08): the FULL
    // verbatim output of the last review — the only complete verification list.
    // The agent response table covers only issues the agent chose to answer,
    // so issues the agent skipped would silently escape convergence without
    // the prior output. The model understands the review output directly —
    // no table/header/phrase parsing. Restatement risk is handled
    // mechanically: host-verified citations reject references that do not
    // match the CURRENT disk state, and fresh sessions exclude old read data.
    // The agent response table stays as a focus aid ("I fixed X"), not as the
    // to-verify list.
    "## Prior Review Output (verify every item it raises)",
    p,
    "",
    "## Agent Response (fix claims — reference only)",
    response,
    "",
    "## Instructions",
    ...buildConvergenceInstructions(round, scopeFiles),
    "",
  ]
  return parts.join("\n")
}
