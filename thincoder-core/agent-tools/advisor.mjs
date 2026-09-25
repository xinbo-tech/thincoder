/**
 * agent-tools/advisor.mjs — advisor tool wrapper.
 * The agent calls this explicitly to get an independent review.
 * The top-level `type` is REQUIRED and must be exactly "code" or "design"
 * (F30 fail-closed — no silent default; ADVISOR-GUARDS.md §2.4).
 * AGENT-LOOP-ASYNC-POOL.md §6.10 (R13 — async advisor): at depth 0 the review launches into the
 * background pool by DEFAULT (async:true / omitted; async:false forces the
 * blocking review); depth>0 (eng-coder self-review) stays synchronous always.
 */
import { runAdvisorReview, advisorIncompleteMarker, ADVISOR_LAUNCH_REFUSAL_PREFIX } from "../advisor/run.mjs"
import { resolveBatchDocPath } from "./batch.mjs"
// M6（模块设计 §2.1 F3）：评审对象来源读 manifest docRoot（声明面）——复用 M4 的
// write-gate.mjs 单一权威源（KD-M6-1），替代 v1 的 loadConventions/isDocPath 分类；
// normAbs 同源 re-export（指针非副本）。不 import dispatch.mjs（簇间回边，环风险）。
import { resolveReviewTargetPaths, normAbs } from "../agent/write-gate.mjs"
import { sep } from "node:path"
import {
  generateDesignToken,
  settleDesignReview,
  resolveAdvisorLaunch,
  launchAsyncAdvisor,
  stripApprovedSuffix,
} from "./advisor-async.mjs"
// F30/F31（2026-09-18 顾问面治理批）：类型门判定 / 拒发串 / 对象标识行——单源 `advisor/notice.mjs`
// （文案逐字 = ADVISOR-GUARDS.md §2.4 / §2.5）；零计数载体（计数护栏随撤 cap 整体退场）。
import { typeGateCriterion, buildTypeGateRefusal, scopeSummary, withIdentityLine } from "../advisor/notice.mjs"

// Design-token utilities moved to advisor-async.mjs (the async settle shares
// them — no wrapper↔runner module cycle); validateDesignToken stays exported
// here for the tests' import surface (implementation re-exported).
export { validateDesignToken } from "./advisor-async.mjs"

export const advisorTool = {
  name: "advisor",
  description:
    "Run an independent review on your work. " +
    "type is REQUIRED — exactly one of the two legal values: type='design' reviews design / requirement documents before implementation (pass documents=[...] with the explicit list of doc paths; plus batchDoc when a batch record is in flight); type='code' reviews the code you changed after implementation (pass paths=[...] to scope files/directories — documents=[...] adds acceptance-criteria context). " +
    "A call without a type (or with a conflicting object.type) is refused — there is no default and no silent fallback. " +
    "The advisor is an independent read-only sub-agent that explores the codebase, " +
    "reads files, and traces callers via grep/lsp. " +
    "For code review: round 1 does a full review, round 2 verifies the agent's fix claims, " +
    "round 3+ strictly checks only the fix claims — convergence, not divergence. " +
    "For design review: single-pass review against methodology and requirements. " +
    "Review criteria come from .thincoder/advisor.md (if present) or sensible defaults. " +
    "After the review, you MUST produce a response table (see discipline rules for format). " +
    "If advisor says all clear, call verify. " +
    "Optionally pass object={type,target,status,reason,exclude} to anchor the review target " +
    " (the review-object declaration is mechanically injected into the review message); " +
    "absent → legacy behavior (no injection). " +
    "ASYNC: at depth 0 the review runs in the BACKGROUND by default " +
    "(async:true or omitted) — the call returns an ack immediately, the turn ends, and the report " +
    "arrives automatically in a digest turn when the review finishes; background reviews share one pool — " +
    "at most agent.poolLimits.advisor concurrent reviews (default 4 — configurable via /config 并发池 or " +
    "config.json; pool-full and same-scope refusals state the current limit) — launch reviews one at a time. " +
    "Inside a child (depth>0 — eng-coder self-review) " +
    "reviews are always synchronous; async:true is rejected there. " +
    "Returns the review report — the advisor's findings verdict: all-clear (call verify) or a findings list to fix.",
  parameters: {
    type: "object",
    properties: {
      type: { type: "string", enum: ["code", "design"], description: "Review type (required): 'design' for design doc review, 'code' for code review. Omitting it is refused — there is no default." },
      async: {
        type: "boolean",
        description: "Background review: default at depth 0 = true (async — ack now, report via digest); async:false forces the blocking review (mechanism parameter — top-level launches are async by default). depth>0 → always sync (async:true rejected).",
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
        description: "Review-object declaration: mechanically injected at the start of the review user message so the advisor does not re-derive the review target. Absent → no injection (legacy behavior).",
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
      batchDoc: {
        type: "string",
        description: "Design review only: path to the batch record currently in flight. Validated WHENEVER passed (any review type) — a value that is not a readable file is refused with an error rather than ignored; for design reviews the reviewer then ALSO gets the `batch` write channel (transition alias `batch_segment`) to record its findings table + VERDICT + counts into §3. Omit when no batch record is in flight — the review then runs unchanged with no write channel (zero regression).",
      },
    },
    required: ["type"],
  },
  readonly: true,
  sideEffectExempt: true,
  outputPanel: true,
  async execute(args, ctx) {
    const agent = ctx.agent
    // Review-object declaration (AGENT-LOOP-ASYNC-POOL.md §6.18 D-OA3): the PARENT constructs it and the
    // advisor tool passes it through — mechanical anchoring, not model inference.
    // Any non-object value (string/array/primitive, possibly from a malformed
    // tool call) degrades to null = no injection (legacy calls unchanged).
    const reviewObject = args.object && typeof args.object === "object" && !Array.isArray(args.object)
      ? args.object
      : null
    // F30 类型门（**最早判定**——先于范围判定 / 实例解析 / 一切拒发族）：顶层 `type` 必须逐字
    // ∈ {"code","design"}——缺失 / 空串 / 非法值 / 非字符串 / 与 `object.type` 声明冲突 ⇒ 拒发
    // （前缀 `Advisor: launch refused` + Why + 两个合法值行 + 标识行），登记 `_advisorRefusals`；
    // **零实例 / 零 token / 零 LLM**（不静默降级——用户 2026-09-18 裁定）。
    const gateCriterion = typeGateCriterion(args.type, reviewObject?.type)
    if (gateCriterion) {
      if (ctx._toolCallId !== undefined) (agent._advisorRefusals ??= new Set()).add(ctx._toolCallId)
      return buildTypeGateRefusal({
        criterion: gateCriterion, received: args.type, declared: reviewObject?.type ?? null,
        scope: scopeSummary(args.documents?.length ? args.documents : args.paths),
      })
    }
    const reviewType = args.type
    const documents = args.documents || null
    // Scope fallback: the runtime mutation record (zero git) covers guard-triggered
    // reviews where the model did not pass explicit paths.
    const paths = args.paths || (agent._touchedFiles?.length ? [...agent._touchedFiles] : null)

    // Code review must have a scope — no implicit fallback.
    if (reviewType !== "design" && !paths && !documents) {
      if (ctx._toolCallId !== undefined) (agent._advisorRefusals ??= new Set()).add(ctx._toolCallId)
      // F31：既有稳定前缀逐字（行首）+ 标识块尾随（单源 notice.mjs）。
      return withIdentityLine(
        "Advisor: no review scope specified. Provide paths (files/directories to review) or documents (acceptance criteria context).",
        { type: reviewType, scope: "none", round: "—", criterion: "scope-missing" },
      )
    }

    // Design review: the review scope must be documentation files. Classification
    // comes from the manifest-declared review-target roots (M4 write-gate.mjs single
    // authority — FR12: no directory-name hardcoding; a project whose docs live
    // elsewhere declares them in PROJECT-MANIFEST.json docRoot).
    if (reviewType === "design" && documents) {
      const roots = resolveReviewTargetPaths(agent).map((r) => r.replace(/[\\/]/g, sep))
      const invalidDocs = documents.filter((doc) => {
        const n = normAbs(doc, agent.cwd).replace(/[\\/]/g, sep)
        return !roots.some((r) => n === r || n.startsWith(r + sep))
      })
      if (invalidDocs.length > 0) {
        if (ctx._toolCallId !== undefined) (agent._advisorRefusals ??= new Set()).add(ctx._toolCallId)
        return withIdentityLine(
          `Advisor: design review documents must be documentation files (per the project's conventions). Invalid: ${invalidDocs.join(", ")}`,
          { type: reviewType, scope: scopeSummary(documents), round: "—", criterion: "scope-not-doc" },
        )
      }
    }

    // §6.10 (R13 — ruling ②-3 A): async gate. Depth-0 defaults to the
    // background pool; depth>0 (eng-coder internal self-review) is ALWAYS sync —
    // an explicit async:true there is rejected, the default never flips.
    // depth 显式校验（归一形态——判定单点：`depth` 取一次 + `asyncRequested` 显式布尔，
    // 判定表与原逐值等价）：
    //   depth 0 + 未传/true ⇒ 异步（本层默认）/ depth 0 + false ⇒ 同步；
    //   depth>0（或直调方无 depth） + 显式 true ⇒ 拒；其余 ⇒ 同步。
    // 「无 depth」= 无 dispatch 上下文的直调方（测试/legacy）——按同步处理。
    const depth = ctx?.depth ?? null
    const asyncRequested = args.async === true
    if (asyncRequested && depth !== 0) {
      // 拒发登记（与 cap/池满拒同款）：评审未跑——不置 called/不耗轮次（record-results
      // 的 REFUSED 契约——advisor 评审发现 #1：拒发不得静默满足 guard）。
      if (ctx._toolCallId !== undefined) (agent._advisorRefusals ??= new Set()).add(ctx._toolCallId)
      return "Advisor: async reviews are only available at depth 0 — the top-level session owns the background pool; inside a child (eng-coder self-review) reviews run synchronously. Call advisor again without async:true (or with async:false)."
    }
    const isAsync = asyncRequested || (depth === 0 && args.async !== false)

    // Per-review instance resolution (§6.10 ③ — ruling ②-5 A): fix rounds
    // continue the same reviewId (design = the doc-set instance's designId —
    // slot/spawn continuity; code = the newest OPEN instance). The resolution
    // scopes agent._advisorRound/_lastAdvisorOutput so the message builder and
    // the run.mjs cap read THIS instance's round/prior (multi-review isolation).
    const resolved = resolveAdvisorLaunch(agent, reviewType, { documents })
    // BATCH-RECORD.md §4.2 评审侧批次档门禁 + 实例键绑定（batch_segment 的唯一路径来源）：
    // 口径 = **「若传则须可读」**（空/不可读 → throw；不强制必传——无批次档的在途设计评审
    // 零回归，N5）；绑定落在 resolved.run（评审实例键，与 reviewType/round/designId 同族）——
    // 并发设计评审各绑各档，不用单值会话态（BATCH-RECORD.md §4.7 #6）。
    if (args.batchDoc !== undefined && args.batchDoc !== null) {
      resolved.run.batchDoc = resolveBatchDocPath(agent.cwd, args.batchDoc)
    }
    // Design token minted for EVERY design round — the reviewer echoes it only on
    // a clean pass; on pass it is slotted under the instance's designId at settle
    // (sync: right here; async: the settle callback — fix #2). A NEW instance
    // gets a fresh designId; a continued fix round keeps the original one — and a
    // same-scope re-review after a pass REUSES the session's id (F2h).
    const designToken = reviewType === "design" ? generateDesignToken(agent) : null
    const designId = reviewType === "design" ? resolved.designId : null

    // 撤 cap 预检 / 撤停止预检（2026-09-18 用户裁定——ADVISOR-CONVERGENCE.md §3.1）：本工具层
    // **无任何按计数拒发**——第 6 次及以后的发起照常受理（轮次仅作提示词衰减与显示）；失败路径
    // 的出口 = 结算出口的失败结论块（F28/F29——两轨共用，ADVISOR-GUARDS.md §7）。

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
      // E（F17/ADVISOR-GUARDS.md §5 E-3c）：设计评审点火回执追加冻结句（代码评审 ack 零改）——窗口下界以
      // 可观察信号表达：报告送达 / 取消前，被审文档（含批次档）零写入。
      const freezeNote = reviewType === "design"
        ? "；D5 冻结窗口：被审文档（含批次档）在报告送达前零写入——在途写入会被拒绝，写入将使本轮结算为陈旧 (pass 不发 token)"
        : ""
      if (ack.queued) {
        // ED-4（2026-09-16 · AGENT-LOOP-ASYNC-POOL.md §6.10）：排队 ack——模型可见状态如实 queued +
        // position（评审槽空自动启动——不误导模型等待即刻 digest）。
        return JSON.stringify({
          id: ack.id, kind: "advisor", status: "queued", position: ack.position,
          reviewId: resolved.reviewId,
          note: `评审已排队（第 ${ack.position} 位）——评审槽空自动启动，完成自动回来 (review queued at position ${ack.position} — it starts automatically when a pool slot frees; the report arrives in a digest turn automatically; pass this id to cancel if needed)` + freezeNote,
        })
      }
      return JSON.stringify({
        id: ack.id, kind: "advisor", status: "running",
        reviewId: resolved.reviewId,
        note: "评审已后台启动——完成自动回来 (review started in the background — the report arrives in a digest turn automatically; pass this id to cancel if needed)" + freezeNote,
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
      // 同步路径的实例绑定传递（异步路径由池条目 run.batchDoc 取——run.mjs 自行解析）。
      batchDoc: resolved.run.batchDoc ?? null,
    }, designToken, documents, paths, reviewObject, designId)

    // B 启动拒绝（稳定前缀）：拒发登记（同池满 / cap 款——不置 called、不耗轮次），
    // 可见报错照常返回（record-results 的 REFUSED 契约）。第 33 批：判定单点——同时供设计
    // 失败分类复用（launchRefused ⇒ neutral——无尝试发生；`ADVISOR-GUARDS.md` §7 失败结算表行 1）。
    const launchRefused = String(result).startsWith(ADVISOR_LAUNCH_REFUSAL_PREFIX)
    if (launchRefused && ctx._toolCallId !== undefined) {
      (agent._advisorRefusals ??= new Set()).add(ctx._toolCallId)
    }

    if (reviewType === "design") {
      // Design pass/fail settlement — token echo IS the verdict (prompt-enforced);
      // no findings-table heuristics: a design with issues never carries the token.
      // (session cleanup for design reviews is owned by runAdvisorReview)
      // Multi-design slots (2026-09-01): store under this review's designId.
      // DESIGN-TOKEN-SETTLEMENT D3 (2026-09-08): the single `_engDesignToken` mirror is
      // retired — no mirror write here; the dispatch/spawn gates read the authoritative
      // multi-slot Map (+ slot-file re-read). Slotting moved into settleDesignReview
      // (shared with the async settle — fix #2).
      const incomplete = advisorIncompleteMarker(result)
      const settled = settleDesignReview(agent, resolved.run, designToken, result, { incomplete })
      // 撤计数（2026-09-18 用户裁定）：原同步面“分类落账”随会话级计数器整体退场（零载体——F28③）；
      // 失败结论块由**结算出口**产出（异步结算 `settleAdvisorRun`——两轨共用，ADVISOR-GUARDS.md §7）。
      // F2e: the sync prior mirror must not carry the raw echo the runner
      // stored — overwrite with the clean settled form (exact-suffix truncation).
      if (settled.passed) {
        agent._lastAdvisorOutput = stripApprovedSuffix(settled.output, resolved.run.approvedSuffix)
      } else if (incomplete) {
        // 未完成 ⇒ 同步 prior 镜像覆写为清洗后输出（防未注册 token 进 prior——ADVISOR-GUARDS.md §1）。
        agent._lastAdvisorOutput = settled.output
      }
      return settled.output
    }
    return result
  },
}
