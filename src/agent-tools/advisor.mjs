/**
 * agent-tools/advisor.mjs — advisor tool wrapper.
 * The agent calls this explicitly to get an independent review.
 * type="design" for design doc review, type="code" for code review (default).
 * §24 D-24b (R13 — async advisor): at depth 0 the review launches into the
 * background pool by DEFAULT (async:true / omitted; async:false forces the
 * blocking review); depth>0 (eng-coder self-review) stays synchronous always.
 */
import { runAdvisorReview, MAX_ADVISOR_ROUNDS, buildCapMessage } from "../advisor/run.mjs"
import { isDocFile } from "../advisor/repos.mjs"
import {
  generateDesignToken,
  settleDesignReview,
  resolveAdvisorLaunch,
  launchAsyncAdvisor,
  stripApprovedSuffix,
} from "./advisor-async.mjs"

// Design-token utilities moved to advisor-async.mjs (the async settle shares
// them — no wrapper↔runner module cycle); validateDesignToken stays exported
// here for the tests' import surface (implementation re-exported).
export { validateDesignToken } from "./advisor-async.mjs"

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
    "If advisor says all clear, call verify. " +
    "Optionally pass object={type,target,status,reason,exclude} to anchor the review target " +
    "(AGENT-LOOP.md §18.8 — the review-object declaration is mechanically injected into the review message); " +
    "absent → legacy behavior (no injection). " +
    "ASYNC (AGENT-LOOP.md §24 D-24b): at depth 0 the review runs in the BACKGROUND by default " +
    "(async:true or omitted) — the call returns an ack immediately, the turn ends, and the report " +
    "arrives automatically in a digest turn when the review finishes; at most 2 reviews run in " +
    "parallel (excess launches are refused — launch one at a time). Inside a child (depth>0 — eng-coder self-review) " +
    "reviews are always synchronous; async:true is rejected there. " +
    "Returns the review report — the advisor's findings verdict: all-clear (call verify) or a findings list to fix.",
  parameters: {
    type: "object",
    properties: {
      type: { type: "string", enum: ["code", "design"], description: "Review type: 'design' for design doc review, 'code' for code review (default)" },
      async: {
        type: "boolean",
        description: "Background review: default at depth 0 = true (async — ack now, report via digest); async:false forces the blocking review. depth>0 → always sync (async:true rejected).",
      },
      object: {
        type: "object",
        properties: {
          type: { type: "string", description: "Review type as declared by the caller (design/code)" },
          target: { type: "string", description: "Review target — document + section, or file(s)" },
          status: { type: "string", description: "Object state: 待评审 / 已批准 / 已实现 (pending-review / approved / implemented)" },
          reason: { type: "string", description: "Why this review runs: user-initiated / delivery verification" },
          exclude: { type: "string", description: "Explicit exclusion list — approved/implemented items NOT in this review" },
        },
        description: "Review-object declaration (§18.8): mechanically injected at the start of the review user message so the advisor does not re-derive the review target. Absent → no injection (legacy behavior).",
      },
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
    // Review-object declaration (§18.8 D-OA3): the PARENT constructs it and the
    // advisor tool passes it through — mechanical anchoring, not model inference.
    // Any non-object value (string/array/primitive, possibly from a malformed
    // tool call) degrades to null = no injection (legacy calls unchanged).
    const reviewObject = args.object && typeof args.object === "object" && !Array.isArray(args.object)
      ? args.object
      : null
    // Scope fallback: the runtime mutation record (zero git) covers guard-triggered
    // reviews where the model did not pass explicit paths.
    const paths = args.paths || (agent._touchedFiles?.length ? [...agent._touchedFiles] : null)

    // Code review must have a scope — no implicit fallback.
    if (reviewType !== "design" && !paths && !documents) {
      if (ctx._toolCallId !== undefined) (agent._advisorRefusals ??= new Set()).add(ctx._toolCallId)
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
        if (ctx._toolCallId !== undefined) (agent._advisorRefusals ??= new Set()).add(ctx._toolCallId)
        return `Advisor: design review documents must be in docs/ directory or be recognized doc files. Invalid: ${invalidDocs.join(", ")}`
      }
    }

    // §24 D-24b (R13 — ruling ②-3 A): async gate. Depth-0 defaults to the
    // background pool; depth>0 (eng-coder internal self-review) is ALWAYS sync —
    // an explicit async:true there is rejected, the default never flips.
    const depth = ctx?.depth
    if (args.async === true && depth !== 0) {
      // 拒发登记（与 cap/池满拒同款）：评审未跑——不置 called/不耗轮次（record-results
      // 的 REFUSED 契约——advisor 评审发现 #1：拒发不得静默满足 guard）。
      if (ctx._toolCallId !== undefined) (agent._advisorRefusals ??= new Set()).add(ctx._toolCallId)
      return "Advisor: async reviews are only available at depth 0 — the top-level session owns the background pool (AGENT-LOOP.md §24 D-24b); inside a child (eng-coder self-review) reviews run synchronously. Call advisor again without async:true (or with async:false)."
    }
    const isAsync = args.async === true || (depth === 0 && args.async !== false)
    // (ctx.depth undefined = direct callers/tests without a dispatch context —
    // legacy sync semantics.)

    // Per-review instance resolution (§24 D-24b ③ — ruling ②-5 A): fix rounds
    // continue the same reviewId (design = the doc-set instance's designId —
    // slot/spawn continuity; code = the newest OPEN instance). The resolution
    // scopes agent._advisorRound/_lastAdvisorOutput so the message builder and
    // the run.mjs cap read THIS instance's round/prior (multi-review isolation).
    const resolved = resolveAdvisorLaunch(agent, reviewType, { documents })
    // Design token minted for EVERY design round — the reviewer echoes it only on
    // a clean pass; on pass it is slotted under the instance's designId at settle
    // (sync: right here; async: the settle callback — fix #2). A NEW instance
    // gets a fresh designId; a continued fix round keeps the original one — and a
    // same-scope re-review after a pass REUSES the session's id (F2h §29.1).
    const designToken = reviewType === "design" ? generateDesignToken(agent) : null
    const designId = reviewType === "design" ? resolved.designId : null

    // Cap pre-check (T-24b11 — per-review ≤5 rounds, CODE REVIEWS ONLY): a 6th
    // launch of a capped CODE instance is refused synchronously — the review
    // never starts (sync and async alike; runAdvisorReview's own cap check stays
    // for legacy direct callers). DESIGN reviews are EXEMPT (2026-09-07 §8
    // ruling): their rounds keep advancing (ROUND2/3 convergence prompts + TUI
    // round display) but the cap never refuses them. The refusal marks no
    // called/round state (guard keeps pushing only while a review can still run
    // — at the cap the round check stops it).
    if (resolved.run.reviewType !== "design" && resolved.run.round >= MAX_ADVISOR_ROUNDS) {
      if (ctx._toolCallId !== undefined) (agent._advisorRefusals ??= new Set()).add(ctx._toolCallId)
      return buildCapMessage(agent)
    }

    if (isAsync) {
      const ack = launchAsyncAdvisor(agent, ctx, {
        reviewType, documents, paths, object: reviewObject,
        designToken, designId, run: resolved.run,
      })
      if (ack.error) {
        // Pool-full refusal (②-6a — no queueing): the review did NOT launch — the
        // model must not count it as "advisor called" (the guard keeps pushing).
        if (ctx._toolCallId !== undefined) (agent._advisorRefusals ??= new Set()).add(ctx._toolCallId)
        return ack.error
      }
      // Async-ack marker: recordToolResults must NOT do the launch-time
      // accounting (called/round) for this call — the settle owns it.
      if (ctx._toolCallId !== undefined) {
        (agent._advisorAsyncAcks ??= new Set()).add(ctx._toolCallId)
      }
      return JSON.stringify({
        id: ack.id, kind: "advisor", status: "running",
        reviewId: resolved.reviewId,
        note: "评审已后台启动——完成自动回来 (review started in the background — the report arrives in a digest turn automatically; pass this id to cancel if needed)",
      })
    }

    // Sync path (depth>0 / explicit async:false / direct callers without depth):
    // legacy blocking review. The design token/echo handling runs below; the
    // instance accounting (round++ per completed attempt) lands in
    // recordToolResults, marker-keyed by this tool call's id.
    if (ctx._toolCallId !== undefined) {
      (agent._advisorSyncCalls ??= new Map()).set(ctx._toolCallId, resolved.reviewId)
    }
    const result = await runAdvisorReview(agent, reviewType, {
      onOutput: ctx.onOutput,
      signal: ctx.signal,
    }, designToken, documents, paths, reviewObject, designId)

    if (reviewType === "design") {
      // Design pass/fail settlement — token echo IS the verdict (prompt-enforced);
      // no findings-table heuristics: a design with issues never carries the token.
      // (session cleanup for design reviews is owned by runAdvisorReview)
      // Multi-design slots (2026-09-01): store under this review's designId.
      // DESIGN-TOKEN-SETTLEMENT D3 (2026-09-08): the single `_engDesignToken` mirror is
      // retired — no mirror write here; the dispatch/spawn gates read the authoritative
      // multi-slot Map (+ slot-file re-read). Slotting moved into settleDesignReview
      // (shared with the async settle — fix #2).
      const settled = settleDesignReview(agent, resolved.run, designToken, result)
      // F2e (§29.1): the sync prior mirror must not carry the raw echo the runner
      // stored — overwrite with the clean settled form (exact-suffix truncation).
      if (settled.passed) {
        agent._lastAdvisorOutput = stripApprovedSuffix(settled.output, resolved.run.approvedSuffix)
      }
      return settled.output
    }
    return result
  },
}
