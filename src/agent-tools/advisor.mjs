/**
 * agent-tools/advisor.mjs — advisor tool wrapper (VS Code port, kept in sync with CLI).
 * The agent calls this explicitly to get an independent review.
 * type="design" for design doc review, type="code" for code review (default).
 */
import { randomUUID, createHmac } from "node:crypto"
import { runAdvisorReview, resolveAdvisorProvider } from "../advisor/run.mjs"
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

/** Validate design token: check format, expiration, and signature.
 *  ALL fail-closed (v2 2026-08-25): the two legacy fail-open branches (parts!=3, NaN expiry)
 *  were pass-through backdoors — any malformed string bypassed validation. */
export function validateDesignToken(token) {
  if (!token || typeof token !== "string") return false

  const parts = token.split(":")
  if (parts.length !== 3) return false // fail-closed (was: return true, v2 2026-08-25)

  const [uuid, expiresAt, signature] = parts
  const expTime = parseInt(expiresAt, 10)

  if (isNaN(expTime)) return false // fail-closed (was: return true, v2 2026-08-25)

  if (Date.now() > expTime) return false

  const payload = `${uuid}:${expiresAt}`
  const expectedSig = createHmac("sha256", TOKEN_SECRET).update(payload).digest("hex").slice(0, 16)
  return signature === expectedSig
}

/** Extract UUID from signed token for regex matching */
export function extractTokenUUID(token) {
  const parts = token.split(":")
  return parts.length >= 1 ? parts[0] : token
}

/** Build a [DESIGN-TOKEN:...] regex (CLI parity — flexible surrounding context).
 *  Escape the ENTIRE token (uuid:expiresAt:signature) — the advisor echoes the
 *  full signed token, so matching only the UUID segment can never match and the
 *  approval never registers (eng-coder gate then rejects a valid token). */
const makeDesignTokenRegex = (token, flags = "") => {
  const escaped = String(token).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
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
    "For code review: round 1 does a full review, round 2 verifies the prior table, " +
    "round 3+ strictly checks only the prior table — convergence, not divergence. " +
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
      object: {
        type: "object",
        description:
          "Review-object declaration (mechanical — do not infer; AGENT-LOOP.md §18.8). Pass {type, target, status, reason, exclude}: review type, review target (docs + section, or files), object state (pending review / approved / implemented), why it is reviewed (user-initiated / delivery verification), and the exclude list (approved/implemented items — explicitly NOT in this review). Injected verbatim at the head of the review user message every round. Optional — legacy calls without it behave unchanged.",
        properties: {
          type: { type: "string", enum: ["code", "design"], description: "Review type (mirrors the top-level type)" },
          target: { type: "string", description: "Review target: docs + section, or files/directories" },
          status: { type: "string", description: "Object state: pending review / approved / implemented" },
          reason: { type: "string", description: "Why this review: user-initiated / delivery verification" },
          exclude: { type: "array", items: { type: "string" }, description: "Excluded items — approved/implemented, NOT in this review" },
        },
      },
    },
  },
  readonly: true,
  sideEffectExempt: true,
  async execute(args, ctx) {
    const agent = ctx.agent
    const reviewType = args.type || "code"
    const documents = args.documents || null
    // Review-object declaration (AGENT-LOOP.md §18.8 N-OA1): the parameter is a
    // JSON object; a string form (LLM serialization) is normalized defensively.
    // Non-object / unparseable → null → legacy degradation (AC-OA2).
    let object = args.object ?? null
    if (typeof object === "string") {
      try { object = JSON.parse(object) } catch { object = null }
    }
    if (object !== null && (typeof object !== "object" || Array.isArray(object))) object = null
    // Scope fallback: the runtime mutation record (zero git) covers guard-triggered
    // reviews where the model did not pass explicit paths (CLI parity).
    const paths = args.paths || (agent._touchedFiles?.length ? [...agent._touchedFiles] : null)

    // Code review must have a scope — no implicit fallback.
    if (reviewType !== "design" && !paths && !documents) {
      return "Advisor: no review scope specified. Provide paths (files/directories to review) or documents (acceptance criteria for code review)."
    }

    // Design review: validate that documents are in docs/ or are recognized doc files
    if (reviewType === "design" && documents) {
      const invalidDocs = documents.filter((doc) => {
        if (doc.startsWith("docs/") || doc.startsWith("docs\\")) return false
        return !isDocFile(doc)
      })
      if (invalidDocs.length > 0) {
        return `Advisor: design review documents must be in docs/ directory or be recognized doc files. Invalid: ${invalidDocs.join(", ")}`
      }
    }

    // Design review: NO round reset — design reviews share the 5-round convergence
    // budget with code reviews (round advances in agent.mjs; cap in run.mjs).
    // Session reset also removed: design rounds 2+ continue the convergence
    // protocol like code reviews (CLI parity).

    // Generate the design token BEFORE the review and inject it into the advisor's prompt.
    // A random designId is minted for EVERY design-review call (2026-09-01 multi-design
    // slots, CLI parity): on pass the token is stored in parent._engDesignTokens keyed by
    // this id and the id is echoed to the parent; on failure the id is dropped — never
    // stored, so it cannot clobber any other design's slot. Not a document anchor.
    const designToken = reviewType === "design" ? generateDesignToken(agent) : null
    const designId = reviewType === "design" ? randomUUID() : null
    // Progress chunks ({kind, text}) stream into the webview — same emission
    // contract as the CLI TUI (think / tool / text kinds). A "start" chunk first
    // opens the in-conversation advisor block tagged with the round number.
    const round = (agent._advisorRound || 0) + 1
    // Show the advisor's effective model in the block title (it may differ from the main agent's).
    const advModel = (() => { try { return resolveAdvisorProvider(agent).model } catch { return null } })()
    ctx.callbacks?.onToolPanel?.("advisor", { kind: "start", text: "", round, model: advModel })
    const result = await runAdvisorReview(agent, reviewType, {
      onOutput: (chunk) => ctx.callbacks?.onToolPanel?.("advisor", chunk),
      signal: ctx.signal,
    }, designToken, documents, paths, object)

    if (reviewType === "design") {
      const tokenPattern = makeDesignTokenRegex(designToken)
      if (designToken && result && tokenPattern.test(result)) {
        // Advisor echoed the token → review passed. Issue it to the parent for eng-coder.
        // Multi-design slots (2026-09-01, CLI parity): store under this review's designId;
        // the single `_engDesignToken` mirror stays for the legacy boolean gates.
        agent._engDesignTokens ??= new Map()
        agent._engDesignTokens.set(designId, designToken)
        agent._engDesignToken = designToken
        if (agent._role === "eng-coder") agent._engDesignReviewed = true
        const cleanResult = result.replace(makeDesignTokenRegex(designToken, "g"), "").trim()
        // designId rides the Approved block (review #1): the parent needs it to aim the
        // FIRST eng-coder spawn when several designs live in the same session.
        return `${cleanResult}\n\nApproved. Pass this exact token to eng-coder (designToken parameter): ${designToken}\ndesignId: ${designId} (pass as the designId parameter when spawning eng-coder; optional while this session holds a single design)`
      }
      // Review failed (or advisor chose not to pass) → do NOT touch ANY slot (方案 ②, review #2:
      // a failed RE-review leaves the previously approved token alive until TTL; the failed
      // call's own designId was never stored, so there is nothing to clear). Isolation
      // (2026-08-30, extended to the multi-slot Map 2026-09-01, CLI parity): a network
      // glitch must not clear / other designs' slots must not be affected — only a COMPLETED
      // non-passing review lands here, and it revokes nothing.
      if (result) {
        const stripped = result.replace(makeDesignTokenRegex(designToken, "g"), "").trim()
        return stripped || "Advisor: design review did not pass."
      }
    }
    return result
  },
}
