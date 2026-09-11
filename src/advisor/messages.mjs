/**
 * advisor/messages.mjs — advisor user-message building (buildAdvisorUserMessage).
 * Split out of advisor.mjs to keep it under the 300-line advisory threshold
 * (.thincoder/advisor.md). System prompts live in advisor.mjs / prompts/.
 * Project-context discovery/injection (Project Guide / document map / standards /
 * no-git notice) lives in project-context.mjs (PORTABILITY VSC mirror ·
 * VP-1/VP-2/VP-8/VP-12) — every discovery step is satisfied or degrades VISIBLY.
 */
import { join, relative } from "node:path"
import { findReviewRepos, collectRepoSnapshots, collectChangedFiles } from "./repos.mjs"
import { buildConvergenceBody, buildConvergenceInstructions } from "./convergence.mjs"
import { loadAdvisorMd, extractConversationBackground, extractAgentResponseTable } from "./history.mjs"
import { injectProjectGuide, injectDocumentMap, injectProjectStandards, NO_GIT_NOTICE } from "./project-context.mjs"

/**
 * Build the review-object declaration block (AGENT-LOOP.md §18.8 D-OA2 — ANCHOR-4).
 * MECHANICAL: every value comes verbatim from the caller's `object` parameter
 * {type, target, status, reason, exclude} — nothing is inferred here (F-OA3).
 * Returns null when no object was passed — legacy callers degrade to the
 * pre-declaration behavior unchanged (N-OA3, AC-OA2).
 * @param {Object|null} object — {type, target, status, reason, exclude}
 * @returns {string|null} the declaration block, or null when object is absent
 */
export function buildReviewObjectDeclaration(object) {
  if (!object || typeof object !== "object" || Array.isArray(object)) return null
  const field = (v) => (Array.isArray(v) ? v.join(", ") : String(v ?? ""))
  return [
    "## Review-object declaration (mechanical — do not infer)",
    `Review type: ${field(object.type)} | Target: ${field(object.target)} | Object state: ${field(object.status)} | Trigger: ${field(object.reason)}`,
    `Excluded (not in this review): ${field(object.exclude)}`,
    "Follow this declaration — do not infer the review target from the documents.",
  ].join("\n")
}

/**
 * Prepend the review-object declaration to a built user message. The injection
 * site is run.mjs AFTER prepareAdvisorMessages — ONE mechanical point that
 * covers every round (design r1 / code r1 / convergence rounds 2+), so a
 * re-review stays anchored to the same object (F-OA2: injection every round).
 * Order: declaration → (Document Map) → review content (D-OA1). No object →
 * content returned untouched (legacy degradation, AC-OA2).
 * @param {string} content — the built user-message content
 * @param {Object|null} object — review-object declaration data
 * @returns {string} content with the declaration prepended (or unchanged)
 */
export function injectObjectDeclaration(content, object) {
  const block = buildReviewObjectDeclaration(object)
  if (!block) return content
  return block + "\n\n" + content
}

/**
 * Approval-signal block for design reviews (round 1 and round 2+ — §9 D-24b: an
 * async fix-round continuation must be able to re-approve, so the token is injected
 * into EVERY design round; the reviewer echoes it only on a clean pass). §29.1 F2a
 * (2026-09-07): BOTH values are injected — the token AND the designId (anchor
 * sentence verbatim — Copy BOTH values). designId null (legacy direct callers)
 * degrades to the token-only form.
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
 * 内层构建（分支面——design round1 / code 形态 / legacy 收敛；既有分支语义零改）。
 * 外层 = `buildAdvisorUserMessage`（信号自愈尾包——契约二/F19）——本档导出面。
 * Build the user message for an advisor review session.
 * @param {Object} agent — the parent agent
 * @param {Object|null} [prior] — prior issue table
 * @param {string} [reviewType] — "design" or "code" (default)
 * @param {string|null} [designToken] — token injected into the design-review prompt; the advisor echoes it only on approval
 * @param {string[]|null} [documents] — design review only: explicit list of doc paths to review (requirements + design + referenced docs).
 *   When set, the review input is built from this list ONLY — no git-diff change-set collection.
 *   When absent, the legacy git-diff-based scope is kept (backward compatible).
 * @param {string[]|null} [paths] — code review only: explicit list of file/dir paths to review (deduped; shown under Review Scope)
 * @param {Object|null} [rv] — §9 D-24b 实例上下文（async——round = 本次调用轮次）
 * @param {string|null} [designId] — §29.1 F2a: injected next to the token in the
 *   Approval Signal (both values — Copy BOTH values verbatim); null → token-only
 *   degradation (legacy direct callers).
 * @returns {string} the user message
 */
function buildAdvisorUserMessageInner(agent, prior, reviewType, designToken = null, documents = null, paths = null, rv = null, designId = null) {
  // prior = the full prior review output (string) when a convergence round is
  // being built (decision 2026-08-08 — verbatim injection, model understands it).
  // Deterministic: only _advisorRound > 0 with stored output counts.
  // §9 D-24b：async 实例经 rv 解析（round = 本次调用轮次——1 = 首轮无 prior）。
  const p = prior ?? (rv
    ? (rv.round >= 2 ? rv.priorOutput : null)
    : (agent._advisorRound || 0) > 0 ? agent._lastAdvisorOutput : null)
  const round = rv ? rv.round : (agent._advisorRound || 0) + 1
  const isRound1 = rv ? rv.round <= 1 : (agent._advisorRound || 0) === 0

  const parts = []
  const docList = Array.isArray(documents) ? documents.filter((d) => typeof d === "string" && d.trim()) : []
  const pathList = Array.isArray(paths) ? [...new Set(paths.filter((p) => typeof p === "string" && p.trim()))] : []

  // Project guide FIRST in EVERY review path (code AND design round 0 — the design
  // branch early-returns below): requirement-fit is judged against the docs it points
  // to. Root discovered from the review scope (code paths AND design-doc paths).
  const guideRoot = injectProjectGuide(agent, parts, [...pathList, ...docList])

  // Design review: simplified message — focus on the design doc, not code
  if (reviewType === "design" && isRound1) {
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

    // Engineering mode: DECLARED standards document only (advisor.standardsDoc).
    if (agent.config?.agent?.engineering) {
      injectProjectStandards(agent, parts, guideRoot)
    }

    // Document map: declared path wins, built-in probe as fallback; neither →
    // explicit degradation sentence (never the old silent skip).
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
  if (p && !isRound1) {
    const scopeFiles = resolveScopeFiles(agent, paths)
    const response = extractAgentResponseTable(agent.history)
      || (scopeFiles?.length
        ? "(Agent did not provide a response table — perform a fresh review of: " + scopeFiles.slice(0, 10).join(", ") + ")"
        : "(Agent did not provide a response table — perform a fresh review of the files named in the system prompt context)")
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
    // Requirement-fit is a first-class dimension when the guide was found.
    parts.push("")
    parts.push("Additional criterion: **requirement fit** — does the implementation match what the requirements documents (referenced by the Project Guide above) actually ask for?")
  }
  parts.push("")

  // Engineering mode: project standards (declaration-only; same helper as design).
  if (agent.config?.agent?.engineering) {
    injectProjectStandards(agent, parts, guideRoot)
  }

  // Instructions — round-aware: re-reviews skip convention discovery entirely
  const isReReview = p && !isRound1
  parts.push("## Instructions")
  parts.push("1. IMPORTANT: the review scope lists the files under review — always verify current file state with `read` before judging. Never decide based on earlier snapshots alone.")
  if (isReReview) {
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

/** 契约二（F19）：构建面**自愈尾包**——design + token 时输出必须携带逐字
 *  `[DESIGN-TOKEN:{token}` 字面；不含 ⇒ 尾包 buildDesignApprovalBlock 补齐（幂等：已含
 *  原样返回，不缺不补不重复）。覆盖全部出口（design round1 分支 / code 形态降级路径 /
 *  legacy 收敛分支）——外层单一机械点，内层分支零改。 */
export function buildAdvisorUserMessage(agent, prior, reviewType, designToken = null, documents = null, paths = null, rv = null, designId = null) {
  const built = buildAdvisorUserMessageInner(agent, prior, reviewType, designToken, documents, paths, rv, designId)
  if (reviewType !== "design" || !designToken) return built
  if (built.includes(`[DESIGN-TOKEN:${designToken}`)) return built
  return `${built}\n\n${buildDesignApprovalBlock(designToken, designId)}`
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
    const abs = p.startsWith(agent.cwd) ? p : join(agent.cwd, p)
    return relative(agent.cwd, abs)
  }
  if (Array.isArray(paths)) return [...new Set(paths.map(normalize))]
  if (agent._touchedFiles?.length) {
    return [...new Set(agent._touchedFiles.map(normalize))]
  }
  return null
}
