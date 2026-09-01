/**
 * agent-tools/advisor.mjs — advisor tool wrapper.
 * The agent calls this explicitly to get an independent review.
 * type="design" for design doc review, type="code" for code review (default).
 */
import { randomUUID, createHmac } from "node:crypto"
import { runAdvisorReview } from "../advisor/run.mjs"
import { isDocFile } from "../advisor/repos.mjs"

const TOKEN_TTL_DEFAULT_MS = 7 * 24 * 3600 * 1000 // 7-day ceiling (v2 2026-08-25): multi-batch delivery must not re-review an unchanged design within a week; agent.engTokenTtlMs overrides
const TOKEN_SECRET = process.env.THINCODER_TOKEN_SECRET || "thincoder-default-secret"

/** Effective token TTL: config override with runtime validation (advisor timeoutMs precedent —
 *  invalid values fall back to the default, never silently disable the ceiling). */
function effectiveTokenTtlMs(agent) {
  const cfg = agent?.config?.agent?.engTokenTtlMs
  return (Number.isFinite(cfg) && cfg > 0) ? cfg : TOKEN_TTL_DEFAULT_MS
}

/** Generate a signed design token with expiration */
function generateDesignToken(agent) {
  const uuid = randomUUID()
  const expiresAt = Date.now() + effectiveTokenTtlMs(agent)
  const payload = `${uuid}:${expiresAt}`
  const signature = createHmac("sha256", TOKEN_SECRET).update(payload).digest("hex").slice(0, 16)
  return `${payload}:${signature}`
}

/** Validate design token: format, expiration, signature — ALL fail-closed (v2 2026-08-25).
 *  The two legacy fail-open branches (parts!=3 → true, NaN expiry → true) were pass-through
 *  backdoors: any malformed string bypassed validation. Only exact signed tokens pass now.
 *  Format must be exactly uuid:expiresAt:hmacSig. */
export function validateDesignToken(token) {
  if (!token || typeof token !== "string") return false

  // New format: uuid:expiresAt:signature (3 parts separated by ':')
  const parts = token.split(":")
  if (parts.length !== 3) return false // fail-closed (was: return true)

  const [uuid, expiresAt, signature] = parts
  const expTime = parseInt(expiresAt, 10)
  if (isNaN(expTime)) return false // fail-closed (was: return true)

  // Check expiration
  if (Date.now() > expTime) return false
  
  // Check signature
  const payload = `${uuid}:${expiresAt}`
  const expectedSig = createHmac("sha256", TOKEN_SECRET).update(payload).digest("hex").slice(0, 16)
  return signature === expectedSig
}

/** Build a [DESIGN-TOKEN:...] regex; escapes special chars as a safety net.
 *  Matches the FULL token (uuid:expiresAt:signature) — prompt tells advisor
 *  to echo the complete token verbatim, not just the UUID segment.
 *  Flexible matching: allows token to be on its own line, in a code block,
 *  or surrounded by whitespace. */
const makeDesignTokenRegex = (token, flags = "") => {
  // Escape the entire token, not just UUID — advisor echoes [DESIGN-TOKEN:uuid:expiresAt:signature]
  const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  return new RegExp(
    `(?:^|\\s|\`|\\*)\\[DESIGN-TOKEN:\\s*${escaped}\\s*\\](?:\\s|$|\`|\\*)`,
    flags + "ms"
  )
}

export const advisorTool = {
  name: "advisor",
  description:
    "Run an independent review on your work. " +
    "Use type='design' to review design documents before implementation — pass documents=[...] with the explicit list of doc paths to review; use documents in code review too (the task's Docs involved list). " +
    "Use type='code' (default) to review code changes after implementation — pass paths=[...] to specify which files or directories to review, or documents=[...] for acceptance criteria context. " +
    "The advisor is an independent read-only sub-agent that explores the codebase, " +
    "reads files, and traces callers via grep/lsp. " +
    "For code review: round 1 does a full review, round 2 verifies the agent's fix claims, " +
    "round 3+ strictly checks only the fix claims — convergence, not divergence. " +
    "For design review: single-pass review against methodology and requirements. " +
    "Review criteria come from .thincoder/advisor.md (if present) or sensible defaults. " +
    "After the review, you MUST produce a response table (see discipline rules for format). " +
    "If advisor says all clear, call verify.",
  parameters: {
    type: "object",
    properties: {
      type: { type: "string", enum: ["code", "design"], description: "Review type: 'design' for design doc review, 'code' for code review (default)" },
      paths: {
        type: "array",
        items: { type: "string" },
        description: "Code files or directories to review (for code review). Required unless documents is provided. The advisor reads the files/directories listed here — it has no git tool and never inspects diffs.",
      },
      documents: {
        type: "array",
        items: { type: "string" },
        description: "Explicit list of doc paths to review (design docs, requirements docs, referenced docs). The advisor reviews ONLY these — it does NOT scan git diff. Use for both design review and code review to pass the task's Docs involved list.",
      },
    },
  },
  readonly: true,
  sideEffectExempt: true,
  outputPanel: true,
  async execute(args, ctx) {
    const agent = ctx.agent
    const reviewType = args.type || "code"
    const documents = args.documents || null
    // Scope fallback: the runtime mutation record (zero git) covers guard-triggered
    // reviews where the model did not pass explicit paths.
    const paths = args.paths || (agent._touchedFiles?.length ? [...agent._touchedFiles] : null)

    // Code review must have a scope — no implicit fallback.
    if (reviewType !== "design" && !paths && !documents) {
      return "Advisor: no review scope specified. Provide paths (files/directories to review) or documents (acceptance criteria context)."
    }

    // Design review: validate that documents are in docs/ or are recognized doc files
    if (reviewType === "design" && documents) {
      const invalidDocs = documents.filter((doc) => {
        // Allow docs/ directory and recognized doc files (METHODOLOGY.md, README.md, etc.)
        if (doc.startsWith("docs/") || doc.startsWith("docs\\")) return false
        return !isDocFile(doc)
      })
      if (invalidDocs.length > 0) {
        return `Advisor: design review documents must be in docs/ directory or be recognized doc files. Invalid: ${invalidDocs.join(", ")}`
      }
    }

    // Design review: NO round reset — design reviews share the 5-round convergence
    // budget with code reviews (round advances in agent.mjs; cap in run.mjs).
    // Session reset also removed: design rounds 2+ continue the advisor session
    // like code reviews (fix claims + round-aware prompts).

    // Generate the design token BEFORE the review and inject it into the advisor's prompt.
    // The advisor (LLM) decides pass/fail itself and echoes the token only on approval —
    // the gate is a mechanical string match, not fragile semantics parsing.
    // A random designId is minted for EVERY design-review call (2026-09-01 multi-design
    // slots): on pass the token is stored in parent._engDesignTokens keyed by this id and
    // the id is echoed to the parent; on failure the id is dropped — never stored, so it
    // cannot clobber any other design's slot. Not a document anchor (rejected 2026-08-31).
    const designToken = reviewType === "design" ? generateDesignToken(agent) : null
    const designId = reviewType === "design" ? randomUUID() : null
    const result = await runAdvisorReview(agent, reviewType, {
      onOutput: ctx.onOutput,
      signal: ctx.signal,
    }, designToken, documents, paths)

    if (reviewType === "design") {
      // Whitespace-tolerant match (LLM may add spaces or wrap in fences).
      // The token IS the verdict — the advisor echoes it only on approval (prompt-enforced);
      // no findings-table heuristics: a design with issues never carries the token.
      const tokenPattern = makeDesignTokenRegex(designToken)
      if (designToken && result && tokenPattern.test(result)) {
        // Advisor echoed the token → review passed. Issue it to the parent for eng-coder.
        // (session cleanup for design reviews is owned by runAdvisorReview)
        // Multi-design slots (2026-09-01): store under this review's designId; the single
        // `_engDesignToken` mirror stays for the legacy boolean gates (dispatch "has token",
        // session persistence) — key decision ② of ENGINEERING-MODE.md §7 2026-09-01.
        agent._engDesignTokens ??= new Map()
        agent._engDesignTokens.set(designId, designToken)
        agent._engDesignToken = designToken
        // Unlock the dispatch design gate (dispatch.mjs) for eng-coder SELF-review:
        // an eng-coder whose own design review passed may write files without the
        // parent spawn-time authorization. NOTE: unreachable today — eng-coder.md
        // tells the child not to re-run the design review, and spawn already sets
        // _engDesignReviewed (subagent.mjs). Kept as defense-in-depth for a future
        // eng-coder autonomous design-revision entry. Parent agents (role undefined)
        // don't use this flag — their runAgent resets it anyway; they are trusted
        // via the engineering prompt.
        if (agent._role === "eng-coder") agent._engDesignReviewed = true
        // Strip the bracketed token so only ONE unambiguous format (plain UUID) reaches the main agent
        const cleanResult = result.replace(makeDesignTokenRegex(designToken, "g"), "").trim()
        // designId rides the Approved block (review #1): the parent needs it to aim the FIRST
        // eng-coder spawn when several designs live in the same session.
        return `${cleanResult}\n\nApproved. Pass this exact token to eng-coder (designToken parameter): ${designToken}\ndesignId: ${designId} (pass as the designId parameter when spawning eng-coder; optional while this session holds a single design)`
      }
      // Review failed (or advisor chose not to pass) → do NOT touch ANY slot (方案 ②, review #2:
      // a failed RE-review leaves the previously approved token alive until TTL; the failed call's
      // own designId was never stored, so there is nothing to clear). Isolation (2026-08-30,
      // extended to the multi-slot Map 2026-09-01): a network glitch must not clear / other
      // designs' slots must not be affected — only a COMPLETED non-passing review lands here,
      // and it revokes nothing.
      // Strip every dead token occurrence from the raw output so the main agent can't grab an invalid one
      if (result) {
        const stripped = result.replace(makeDesignTokenRegex(designToken, "g"), "").trim()
        return stripped || "Advisor: design review did not pass."
      }
    }
    return result
  },
}
