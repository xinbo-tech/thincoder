/**
 * advisor/messages.mjs — advisor user-message building (buildAdvisorUserMessage).
 * Split out of advisor.mjs to keep it under the 300-line advisory threshold
 * (.thincoder/advisor.md). System prompts live in advisor.mjs / prompts/.
 * Project-context discovery/injection lives in project-context.mjs (the D-1 registration,
 * ENGINEERING-MODE.md §2.26.3); the pre-split surface is re-exported below.
 */
import { join, relative, sep } from "node:path"
import { findReviewRepos, collectRepoSnapshots, collectChangedFiles } from "./repos.mjs"
import { buildConvergenceBody, buildConvergenceInstructions } from "./convergence.mjs"
import { loadAdvisorMd, extractConversationBackground, extractAgentResponseTable } from "./history.mjs"
import { injectProjectGuide, injectDocumentMap, injectProjectStandards, NO_GIT_NOTICE } from "./project-context.mjs"

// Structural split (not an authority migration): the moved helpers stay reachable here.
export { findProjectRoot, injectProjectGuide } from "./project-context.mjs"

/**
 * Build the mechanical review-object declaration block (AGENT-LOOP-ASYNC-POOL.md §6.18
 * — English anchored form). Injected at the START of the review user
 * message every round: round 1 (design + code), the legacy convergence path,
 * and the round-2+ follow-up (see buildAdvisorFollowUp) — the reviewer must
 * not re-derive "who is being reviewed / why" from the documents (T-OA2:
 * every round stays anchored). Absent object → "" (legacy calls degrade to
 * the current behavior — T-OA3).
 * @param {Object|null} [object] — { type, target, status, reason, exclude }
 *   (strings; `exclude` may also be a list — joined with ", ")
 * @returns {string} the declaration block (empty when no object)
 */
export function buildObjectDeclarationBlock(object = null) {
  if (!object || typeof object !== "object" || Array.isArray(object)) return ""
  const field = (v) => (Array.isArray(v) ? v.join(", ") : v == null ? "" : String(v))
  return [
    "## Review-object declaration (mechanical — do not infer)",
    `Review type: ${field(object.type)} | Target: ${field(object.target)} | Object state: ${field(object.status)} | Trigger: ${field(object.reason)}`,
    `Excluded (not in this review): ${field(object.exclude)}`,
    "Follow this declaration — do not infer the review target from the documents.",
    "",
  ].join("\n")
}

/**
 * Approval-signal block for design reviews (round 1 and round 2+ — AGENT-LOOP-ASYNC-POOL.md §6.10 D-24b:
 * an async fix-round continuation must be able to re-approve, so the token is
 * injected into EVERY design round; the reviewer echoes it only on a clean pass).
 * §29.1 F2a (2026-09-07): BOTH values are injected — the token AND the designId
 * (anchor sentence verbatim — Copy BOTH values). designId null (legacy direct
 * callers without a resolved instance) degrades to the token-only form.
 */
export function buildDesignApprovalBlock(designToken, designId) {
  const echo = designId
    ? `If — and ONLY if — your review finds NO 🔴 (Critical) issues, end your reply with this exact token: [DESIGN-TOKEN:${designToken}] and this exact designId: ${designId}. Copy BOTH values verbatim.`
    : `If — and ONLY if — your review finds NO 🔴 (Critical) issues, end your reply with this exact token: [DESIGN-TOKEN:${designToken}]`
  return [
    "## Approval Signal",
    echo,
    "🟡 (Advisory) and 🔵 (Note) findings do NOT block approval — list them if present, but still include the token. If there are any 🔴 issues, do NOT include the token.",
  ].join("\n")
}

/**
 * Build the user message for an advisor review session.
 * @param {Object} agent — the parent agent
 * @param {Object|null} [prior] — prior issue table
 * @param {string} [reviewType] — "design" or "code" (已由工具层类型门定轨——此处无缺省；F30)
 * @param {string|null} [designToken] — token injected into the design-review prompt; the advisor echoes it only on approval
 * @param {string[]|null} [documents] — design review only: explicit list of doc paths to review (requirements + design + referenced docs).
 *   When set, the review input is built from this list ONLY — no git-diff change-set collection.
 *   When absent, the legacy git-diff-based scope is kept (backward compatible).
 * @param {string[]|null} [paths] — code review only: explicit list of file/dir paths to review (deduped; shown under Review Scope)
 * @param {Object|null} [object] — review-object declaration (AGENT-LOOP-ASYNC-POOL.md §6.18 D-OA1/D-OA3):
 *   { type, target, status, reason, exclude } — mechanically injected at the
 *   start of the user message; absent → no injection (legacy calls unchanged).
 * @param {string|null} [designId] — F2a: injected next to the token in the
 *   Approval Signal (both values — the reviewer copies both verbatim); null →
 *   token-only degradation (legacy direct callers).
 * @returns {string} the user message
 */
export function buildAdvisorUserMessage(agent, prior, reviewType, designToken = null, documents = null, paths = null, object = null, designId = null) {
  const body = buildAdvisorUserMessageInner(agent, prior, reviewType, designToken, documents, paths, object, designId)
  // B 构建自愈（F12/§14.4 #1）：design + token 且输出不含逐字信号 ⇒ 尾包补齐 Approval Signal。
  // 覆盖所有出口（含 code 形态分支降级态与 legacy 收敛分支）——既有分支语义零改：已在分支内
  // 注入过的路径因 `[DESIGN-TOKEN:{token}` 逐字在场而不重复追加（幂等）。
  if (reviewType !== "design" || !designToken) return body
  if (body.includes(`[DESIGN-TOKEN:${designToken}`)) return body
  return `${body}\n\n${buildDesignApprovalBlock(designToken, designId)}`
}

/** 内层构建（无自愈尾包）——出口、分支与消息形态与拆分前逐字一致。 */
function buildAdvisorUserMessageInner(agent, prior, reviewType, designToken = null, documents = null, paths = null, object = null, designId = null) {
  // prior = the full prior review output (string) when a convergence round is
  // being built (decision 2026-08-08 — verbatim injection, model understands it).
  // Deterministic: only _advisorRound > 0 with stored output counts.
  const p = prior ?? ((agent._advisorRound || 0) > 0 ? agent._lastAdvisorOutput : null)

  const parts = []
  // Review-object declaration FIRST — D-OA1: at the start of the user message
  // (after the system prompt, before the review content). Covers round 1
  // design/code and the legacy convergence path; the round-2+ normal path
  // prepends it in buildAdvisorFollowUp (T-OA2 — every round stays anchored).
  const declaration = buildObjectDeclarationBlock(object)
  if (declaration) parts.push(declaration)
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
    // FR15/P8: no git → change-set context is unavailable. Say it (never silent).
    if (repos.length === 0) {
      parts.push(NO_GIT_NOTICE)
      parts.push("")
    }
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

    // Engineering mode: the project's DECLARED standards document
    // (advisor.standardsDoc) — undeclared degrades visibly (PO-2).
    if (agent.config?.agent?.engineering) {
      injectProjectStandards(agent, parts, guideRoot)
    }

    // Document map: declared path wins, the built-in fallback probe (docs/README.md
    // → docs/design/README.md) stays; neither → explicit degradation sentence
    // (never the old silent skip).
    injectDocumentMap(agent, parts, guideRoot ?? agent.cwd)

    parts.push("## Instructions")
    if (docList.length > 0) {
      parts.push("1. Read every document in the Documents to Review list in full — review ONLY those files.")
    } else {
      parts.push("1. Read the design document fully.")
    }
    parts.push("2. Review against: completeness (all requirements covered?), feasibility (can this be built?), methodology compliance (does it follow the project's standards as provided?), clarity (specific enough?), acceptance criteria (verifiable?), scope (appropriate?).")
    parts.push("3. If the ## Project Guide (AGENTS.md) section above is present, also check requirement fit: does the design match what the requirements documents it points to actually ask for?")
    parts.push("4. Do NOT run git diff or look for code changes — there are none at this stage.")
    parts.push("5. If you find issues, produce your review table with the format: | # | Category | Severity | Issue | Suggestion |. If the design passes, no table is needed.")
    if (designToken) {
      parts.push("")
      parts.push(buildDesignApprovalBlock(designToken, designId))
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

  // Engineering mode: project standards (declaration-only, same helper as the
  // design path) — undeclared degrades visibly (PO-2).
  if (agent.config?.agent?.engineering) {
    injectProjectStandards(agent, parts, guideRoot)
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

