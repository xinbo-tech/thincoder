/**
 * advisor/messages.mjs — advisor user-message building (buildAdvisorUserMessage).
 * Split out of advisor.mjs to keep it under the 300-line advisory threshold
 * (.thincoder/advisor.md). System prompts live in advisor.mjs / prompts/.
 */
import { readFileSync, existsSync } from "node:fs"
import { resolve, join, relative, dirname, sep } from "node:path"
import { providerSpec } from "../config.mjs"
import { findReviewRepos, collectRepoSnapshots, collectChangedFiles } from "./repos.mjs"
import { buildConvergenceBody, buildConvergenceInstructions } from "./convergence.mjs"
import { loadAdvisorMd, extractConversationBackground, extractAgentResponseTable } from "./history.mjs"

/** Project guide (AGENTS.md) injection budget — decision 2026-08-08:
 *  NO fixed truncation; long-context models (1M+) get up to 5% of their context
 *  window for the doc map, small windows still get a floor so the map is always
 *  visible. The map is what tells the reviewer WHERE the requirements docs live
 *  (requirement-fit is judged against those docs, not the conversation only). */
const PROJECT_GUIDE_MIN = 8192 // chars — floor for small-window models
const PROJECT_GUIDE_FRACTION = 0.05 // 5% of the reviewer model's context window

/**
 * Discover the project root for the review — user decision 2026-08-08:
 * the project root is a SUBDIRECTORY of the working directory, never an
 * ancestor above it. Priority:
 *   1. Walk UP from each review-scope file's directory, bounded by cwd —
 *      the NEAREST AGENTS.md inside the workspace wins. In a monorepo this is
 *      the subproject's own doc map even when cwd itself has an AGENTS.md
 *      (a workspace-level meta map must not shadow the subproject guide).
 *   2. No scope files / nothing found → cwd (single project; the walk's
 *      last step naturally lands on cwd's own AGENTS.md when it exists).
 * @param {string} cwd — the agent's working directory (workspace root)
 * @param {string[]} scopeFiles — cwd-relative review-scope paths (may be empty)
 * @returns {string|null} absolute project root with an AGENTS.md, or null
 */
function findProjectRoot(cwd, scopeFiles) {
  // Normalize separators before comparing: input paths may use either
  // convention (join() → "\\" on Windows; tool args / tests → "/"). Mixed
  // styles made isInside(cwd + sep) miss legitimately nested paths.
  const norm = (p) => p.replaceAll("\\", "/")
  const isInside = (dir) => {
    const d = norm(dir)
    const c = norm(cwd)
    return d === c || d.startsWith(c + "/")
  }
  for (const f of scopeFiles) {
    let dir = dirname(resolve(cwd, f))
    while (isInside(dir) && dir !== dirname(dir)) {
      if (existsSync(join(dir, "AGENTS.md"))) return dir
      dir = dirname(dir)
    }
  }
  // No scope files, or none found in the walk — cwd itself (its AGENTS.md is
  // checked as the walk's final step for scope files; for empty scopes, check
  // it explicitly so a bare cwd project still gets its guide).
  if (existsSync(join(cwd, "AGENTS.md"))) return cwd
  return null
}

/**
 * Inject the project guide (AGENTS.md) into the review message. AGENTS.md is the
 * project's doc map — it defines the structure and where requirements/design
 * documents live. The reviewer must see it FIRST: requirement-fit is judged
 * against the documents it points to, with the conversation background as a
 * supplement. Absent AGENTS.md degrades honestly (no pretending there is a map).
 * @param {Object} agent — the parent agent
 * @param {string[]} parts — message parts (mutated)
 * @param {string[]} [scopeFiles] — cwd-relative review-scope paths for project-root discovery
 * @returns {string|null} the discovered project root (abs), or null when no guide
 */
function injectProjectGuide(agent, parts, scopeFiles = []) {
  parts.push("## Project Guide (AGENTS.md)")
  const root = findProjectRoot(agent.cwd, scopeFiles)
  const path = root ? join(root, "AGENTS.md") : null
  let text
  if (!path) {
    parts.push("(No AGENTS.md found — neither at the working directory root nor in any review-scope subdirectory. Judge the user's requirements from the conversation background, and say so explicitly if the requirements are unclear.)")
    parts.push("")
    return null // no guide — requirement-fit falls back to the conversation
  }
  try {
    text = readFileSync(path, "utf8")
  } catch (e) {
    if (e.code !== "ENOENT") {
      // File exists but is unreadable (EACCES etc.) — log, don't masquerade as "not found".
      console.warn(`[advisor] AGENTS.md unreadable at ${path}: ${e.message}`)
    }
    parts.push("(No AGENTS.md found — neither at the working directory root nor in any review-scope subdirectory. Judge the user's requirements from the conversation background, and say so explicitly if the requirements are unclear.)")
    parts.push("")
    return null // no guide — requirement-fit falls back to the conversation
  }
  // readFileSync succeeded — compute the budget OUTSIDE the try so a spec
  // lookup failure can never masquerade as "no AGENTS.md".
  // providerSpec: the project-guide budget follows the provider-level context
  // override (PROVIDER.md §15 — advisor messages budget is context-based).
  const ctx = providerSpec(agent.provider).context
  const cap = Math.max(PROJECT_GUIDE_MIN, Math.floor(ctx * PROJECT_GUIDE_FRACTION))
  const shown = text.length <= cap
    ? text
    : [...text].slice(0, cap).join("") + `\n\n…(truncated at ${cap} chars — read the full file if you need more)` // codepoint-safe slice: no broken surrogate pairs at the boundary
  parts.push(`<!-- Project root: ${relative(agent.cwd, path).split(sep).join("/")} (inferred from the review scope under ${agent.cwd}) -->`)
  parts.push("This file defines the project's structure and where its requirements/design documents live. Read the documents it points to — the user's requirements live THERE, not only in the conversation background.")
  parts.push("")
  parts.push(shown)
  parts.push("")
  return root // guide injected — requirement-fit criteria apply (truthy root)
}

/**
 * Build the user message for an advisor review session.
 * @param {Object} agent — the parent agent
 * @param {Object|null} [prior] — prior issue table
 * @param {string} [reviewType] — "design" or "code" (default)
 * @param {string|null} [designToken] — token injected into the design-review prompt; the advisor echoes it only on approval
 * @param {string[]|null} [documents] — design review only: explicit list of doc paths to review (requirements + design + referenced docs).
 *   When set, the review input is built from this list ONLY — no git-diff change-set collection.
 *   When absent, the legacy git-diff-based scope is kept (backward compatible).
 * @param {string[]|null} [paths] — code review only: explicit list of file/dir paths to review (deduped; shown under Review Scope)
 * @returns {string} the user message
 */
export function buildAdvisorUserMessage(agent, prior, reviewType, designToken = null, documents = null, paths = null) {
  // prior = the full prior review output (string) when a convergence round is
  // being built (decision 2026-08-08 — verbatim injection, model understands it).
  // Deterministic: only _advisorRound > 0 with stored output counts.
  const p = prior ?? ((agent._advisorRound || 0) > 0 ? agent._lastAdvisorOutput : null)

  const parts = []
  const docList = Array.isArray(documents) ? documents.filter((d) => typeof d === "string" && d.trim()) : []
  const pathList = Array.isArray(paths) ? [...new Set(paths.filter((p) => typeof p === "string" && p.trim()))] : []

  // Project guide FIRST in EVERY review path (code AND design round 0): the map
  // to the requirements docs is needed for design reviews too (design must fit
  // the requirements, not just the methodology). Design round 0 early-returns
  // below — the guide must be injected before that return. Project root is
  // discovered from the review scope (code paths AND design-doc paths, so a
  // documents-only design review still finds the subproject guide).
  const guideRoot = injectProjectGuide(agent, parts, [...pathList, ...docList])

  // Design review: simplified message — focus on the design doc, not code
  if (reviewType === "design" && (agent._advisorRound || 0) === 0) {
    const repos = findReviewRepos(agent)
    parts.push("## Design Review")
    if (docList.length > 0) {
      // Explicit review scope (engineering mode, FR2): the caller hands over the
      // doc list — the advisor reviews ONLY these. No git-diff change-set
      // collection: diff-based discovery reviewed unrelated files, and untracked
      // design docs were invisible to git diff anyway (ENGINEERING-MODE.md §2.4).
      parts.push("The documents below are the review scope. Review ONLY these files — do not scan git diff or read any other files.")
      parts.push("")
      parts.push("## Documents to Review")
      parts.push(docList.map((d) => `- ${d} — Read this file in full`).join("\n"))
      parts.push("")
    } else {
      // Backward-compatible fallback (no documents): discover docs via git status/diff.
      parts.push("The following changes are a design document. Review it against the project's methodology.")
      parts.push("")

      // List changed file paths explicitly — new design docs are untracked,
      // so git diff HEAD won't show their content; the advisor must read the file itself
      const changedFiles = collectChangedFiles(repos, agent.cwd)
      if (changedFiles.length > 0) {
        parts.push("## Changed Files")
        parts.push(changedFiles.map((f) => `- ${f}`).join("\n"))
        parts.push("")
        parts.push("Read each changed file in full — untracked files are not shown in the diff below.")
        parts.push("")
      }

      // Pre-collected changes — the design doc diff.
      const snapshots = collectRepoSnapshots(repos, agent.cwd)
      if (snapshots.length > 0) {
        parts.push("## Design Document (git diff)")
        parts.push(...snapshots)
        parts.push("")
      }
    }

    // Engineering mode: inject project methodology (resolved from the
    // DISCOVERED project root — in a monorepo that is the subproject, not cwd)
    if (agent.config?.agent?.engineering) {
      try {
        const mpath = resolve(guideRoot ?? agent.cwd, "METHODOLOGY.md")
        const methodology = readFileSync(mpath, "utf8")
        parts.push("## Project Methodology")
        parts.push("Evaluate the design against this methodology:")
        parts.push(methodology)
        parts.push("")
      } catch { /* file doesn't exist — skip */ }
    }

    // Document map (docs/design/README.md) — inject when the discovered
    // project root has one: the reviewer checks document ownership against it
    // (a change for an existing section must amend that section's document,
    // not spawn a new file for it). Absent map → skip (nothing to check against).
    try {
      const mapPath = resolve(guideRoot ?? agent.cwd, "docs", "design", "README.md")
      if (existsSync(mapPath)) {
        parts.push("## Document Map")
        parts.push("The document map below registers which document files exist per section. Use it for the Document ownership criterion: a change for an existing section must amend that section's document, not create a new file.")
        parts.push(readFileSync(mapPath, "utf8"))
        parts.push("")
      }
    } catch { /* file doesn't exist or is unreadable — skip */ }

    parts.push("## Instructions")
    if (docList.length > 0) {
      parts.push("1. Read every document in the Documents to Review list in full — review ONLY those files. Read METHODOLOGY.md to understand the project's standards.")
    } else {
      parts.push("1. Read the design document fully. Read METHODOLOGY.md to understand the project's standards.")
    }
    parts.push("2. Review against: completeness (all requirements covered?), feasibility (can this be built?), methodology compliance (does it follow the project's METHODOLOGY.md?), clarity (specific enough?), acceptance criteria (verifiable?), scope (appropriate?).")
    parts.push("3. If the ## Project Guide (AGENTS.md) section above is present, also check requirement fit: does the design match what the requirements documents it points to actually ask for?")
    parts.push("4. Do NOT run git diff or look for code changes — there are none at this stage.")
    parts.push("5. If you find issues, produce your review table with the format: | # | Category | Severity | Issue | Suggestion |. If the design passes, no table is needed.")
    if (designToken) {
      parts.push("")
      parts.push("## Approval Signal")
      parts.push(`If — and ONLY if — your review finds NO 🔴 (Critical) issues, end your reply with this exact token: [DESIGN-TOKEN:${designToken}]`)
      parts.push("🟡 (Advisory) and 🔵 (Note) findings do NOT block approval — list them if present, but still include the token. If there are any 🔴 issues, do NOT include the token.")
    }
    return parts.join("\n")
  }

  // Convergence data (round 2+). LEGACY COMPATIBILITY PATH: the normal advisor
  // flow routes convergence rounds through buildAdvisorFollowUp (fresh session,
  // decision d698434); this block only fires for direct external callers of
  // buildAdvisorUserMessage with a stored prior review output. Kept to avoid
  // breaking those. Same rule as buildAdvisorFollowUp: the FULL prior review
  // output is injected verbatim (decision 2026-08-08 — the model understands it;
  // no table/header/phrase parsing).
  // NOTE: this legacy path does NOT apply escapeLiteralEscapes (that lives in
  // advisor.mjs and importing it here would create a top-level module cycle).
  // Direct callers must escape the injected output themselves if the parent
  // conversation can quote literal "\x"/"\u" sequences (server 400 risk).
  if (p && (agent._advisorRound || 0) > 0) {
    const scopeFiles = resolveScopeFiles(agent, paths)
    const response = extractAgentResponseTable(agent.history)
      || (scopeFiles?.length
        ? "(Agent did not provide a response table — perform a fresh review of: " + scopeFiles.slice(0, 10).join(", ") + ")"
        : "(Agent did not provide a response table — perform a fresh review of the files named in the system prompt context)")
    const round = (agent._advisorRound || 0) + 1
    parts.push(buildConvergenceBody(p, response, round, scopeFiles))
    parts.push("")
    parts.push("---")
    parts.push("")
  }

  if (pathList.length > 0 || docList.length > 0) {
    parts.push("## Review Scope")
  }
  if (pathList.length > 0) {
    parts.push("Review these code files/directories — read them in full for context:")
    parts.push("")
    parts.push(pathList.map((p) => `- ${p}`).join("\n"))
    parts.push("")
  }
  if (docList.length > 0) {
    if (reviewType === "design") {
      parts.push("The documents below are the review scope. Review ONLY these files — do NOT scan git diff or read any other files.")
    } else {
      parts.push("The documents below define acceptance criteria and review context. Read them for context, then read the code files specified in the review scope. Judge the implementation against these documents.")
    }
    parts.push("")
    parts.push("## Documents to Review")
    parts.push(docList.map((d) => `- ${d} — Read this file in full`).join("\n"))
    parts.push("")
  }

  // Conversation background — recent user↔assistant exchanges for intent context
  const background = extractConversationBackground(agent.history)
  if (background) {
    parts.push("## Conversation Background (recent turns)")
    parts.push(background)
    parts.push("")
  }

  // Review criteria
  const criteria = loadAdvisorMd(agent.cwd)
  parts.push("## Review Criteria")
  parts.push(criteria)
  if (guideRoot) {
    // Requirement-fit is a first-class dimension when the project guide was
    // found — the criteria file (advisor.md) may not mention it (legacy).
    parts.push("")
    parts.push("Additional criterion: **requirement fit** — does the implementation match what the requirements documents (referenced by the Project Guide above) actually ask for?")
  }
  parts.push("")

  // Engineering mode: inject project methodology so advisor knows the rules
  // (resolved from the DISCOVERED project root — subproject in a monorepo)
  if (agent.config?.agent?.engineering) {
    try {
      const mpath = resolve(guideRoot ?? agent.cwd, "METHODOLOGY.md")
      const methodology = readFileSync(mpath, "utf8")
      parts.push("## Project Methodology (Engineering Mode)")
      parts.push("The project follows this methodology. Evaluate the changes against it:")
      parts.push(methodology)
      parts.push("")
    } catch { /* file doesn't exist — skip */ }
  }

  // Instructions — round-aware: re-reviews skip convention discovery entirely.
  // These are SUPPLEMENTARY reminders to the system prompt's numbered workflow —
  // deliberately not renumbered as a competing sequence.
  const isReReview = p && (agent._advisorRound || 0) > 0
  parts.push("## Instructions")
  parts.push("1. IMPORTANT: the review scope lists the files under review — always verify current file state with `read` before judging. Never decide based on earlier snapshots alone.")
  if (isReReview) {
    const round = (agent._advisorRound || 0) + 1
    parts.push(...buildConvergenceInstructions(round, pathList))
  } else {
    parts.push("2. " + (guideRoot
      ? "The `## Project Guide (AGENTS.md)` section above maps the project — read the requirements/design documents it points to (they are the primary reference for requirement-fit). Use `read` to load those documents."
      : "No AGENTS.md was found at the project root — rely on the conversation background for the user's requirements. If the requirements are unclear, state so explicitly."))
    parts.push("3. `read` the files in the Review Scope in full — they define exactly what to inspect. Batch independent reads/greps in a single reply instead of one call per round-trip.")
    parts.push("4. Use `grep` or `lsp` to trace callers, imports, and dependencies — only where the diff leaves genuine doubt.")
    parts.push("5. Produce your review table based on the review criteria above. Do not re-read content you already have.")
    parts.push("6. You may also flag other issues: crashes, data loss, logic errors — anything obvious. This is the convergence protocol: round 1 is the full review, later rounds only re-verify.")
  }
  parts.push("")
  parts.push("Return your review as a markdown table (or a clear statement that everything is fine).")

  return parts.join("\n")
}

/**
 * Resolve the review surface for the convergence fallback: explicit `paths`
 * win; otherwise the runtime mutation record (_touchedFiles, ABSOLUTE) is
 * normalized to cwd-relative so the fallback list matches the relative-path
 * norm the reviewer sees everywhere else. Paths outside cwd are relativized
 * with path.relative — never a mixed absolute/relative list.
 */
export function resolveScopeFiles(agent, paths) {
  const normalize = (p) => {
    // sep-guarded prefix check — /proj vs /project-other must not collide
    const abs = p === agent.cwd || p.startsWith(agent.cwd + sep) ? p : join(agent.cwd, p)
    return relative(agent.cwd, abs)
  }
  if (Array.isArray(paths)) return [...new Set(paths.map(normalize))]
  if (agent._touchedFiles?.length) {
    return [...new Set(agent._touchedFiles.map(normalize))]
  }
  return null
}

