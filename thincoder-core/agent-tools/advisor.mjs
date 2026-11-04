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
import { readFileSync } from "node:fs"
import { countRoundBlocks } from "./batch-skeleton.mjs"
import { resolveBatchDocPath } from "./batch.mjs"
// 设计评审的文档受理面单源 = review-facts.mjs 的 resolveReviewDocPaths（判据正文 =
// docs/core/design/ADVISOR-GUARDS.md §12：相对形按会话项目根 / 绝对形照用 / 受理 = 项目内现存 `.md`）。
import { projectRootView } from "../manifest-discovery.mjs"
import { resolveReviewDocPaths } from "./review-facts.mjs"
import {
  generateDesignToken,
  settleDesignReview,
  resolveAdvisorLaunch,
  launchAsyncAdvisor,
  stripApprovedSuffix,
} from "./advisor-async.mjs"
// F30/F31（2026-09-18 顾问面治理批）：类型门判定 / 拒发串 / 对象标识行——单源 `advisor/notice.mjs`
// （文案逐字 = ADVISOR-GUARDS.md §2.4 / §2.5）；零计数载体（计数护栏随撤 cap 整体退场）。
import { typeGateCriterion, buildTypeGateRefusal, identityLine, scopeSummary, withIdentityLine } from "../advisor/notice.mjs"
// 账链门判据（设计单源 = `docs/core/design/ADVISOR-GUARDS.md` §2 第 7 条）：批档之外还须有未决台账行指着它。
// 判据档零静态仓内依赖（台账链在档内动态 import——W8 契约②），故本档可静态引用。
import { resolveBatchLedgerLink } from "./batch-ledger-link.mjs"
// #15 描述外置：描述文本单点 = tool-docs/advisor.md（DESC 单解析面，缺档抛错语义不变）
import { DESC } from "../tools/shared.mjs"

// Design-token utilities moved to advisor-async.mjs (the async settle shares
// them — no wrapper↔runner module cycle); validateDesignToken stays exported
// here for the tests' import surface (implementation re-exported).
export { validateDesignToken } from "./advisor-async.mjs"

/**
 * §3 点火基线（`docs/core/design/ADVISOR-GUARDS.md` §1.1 判据 1）：绑了批档 ⇒ 记下点火时该档 §3
 * 已有的轮次块数（块计数单源 = `countRoundBlocks`）；未绑 / 读不到 ⇒ `null`——读不到不等于
 * 「没有记录要验」，结算面的 §3 落地门据此判 `batch-unreadable`。每轮发起刷新：同一实例的修轮
 * 是新的一轮，基线随之推进（否则上一轮留下的块会让本轮一字未写也过门）。
 */
function section3BlocksBaseline(batchDocAbs) {
  if (typeof batchDocAbs !== "string" || !batchDocAbs) return null
  try {
    return countRoundBlocks(readFileSync(batchDocAbs, "utf8"), 3)
  } catch {
    return null
  }
}

/** `batchDoc` 缺失形态（缺失 ∥ `null` ∥ 空串 ∥ 纯空白——非字符串不在此判，留给 `resolveBatchDocPath` 的既有文案）。 */
function missingBatchDoc(raw) {
  return raw === undefined || raw === null || (typeof raw === "string" && raw.trim() === "")
}

/**
 * 设计评审准入门拒文（**逐字**——单源 `docs/core/design/ADVISOR-GUARDS.md` §2 第 6 条）：首行 = 稳定前缀
 * `Advisor: launch refused` + 标识行（与类型门同族形态）；其后 Why + 两个期望形 + 可执行的下一步 + 收尾句。
 * 与类型门的唯一形态偏差 = 多一句「没有批档 ⇒ 先建档」：本门判的是「参数在不在」，用户知道怎么传不等于
 * 知道没档时怎么办。
 */
function buildBatchDocRefusal(identity) {
  return [
    `Advisor: launch refused — a design review must carry \`batchDoc\`: the batch record this review belongs to. ${identity}`,
    "Why: the token a design review issues is closed by its batch — closing that record consumes it. A review with no batch mints a token nothing can close: it rides the 7-day TTL and nothing else. Refusing the review at launch is how that token never exists.",
    "Expected form 1 — project-root-relative: docs/batches/<batch>-<topic>.md (resolved against the session project root).",
    "Expected form 2 — absolute: D:\\repo\\docs\\batches\\<batch>-<topic>.md (used as-is).",
    'No batch record in flight: create one first — batch({action:"create", …}) — one command; the record is the premise of the review, not paperwork.',
    "Nothing was sent: no review instance, no round consumed, no design token minted, no LLM call.",
  ].join("\n")
}

/**
 * 账链门拒文（**逐字**——单源 `docs/core/design/ADVISOR-GUARDS.md` §2 第 7 条）：首行 = 稳定前缀
 * `Advisor: launch refused` + 标识行（与准入门同族形态）；其后 Why + `Record:` 读数 + 三条修法 + 收尾句。
 *
 * 偏差（相对准入门）= 判据从「参数在不在」进到「账在不在」，因此多一行 `Record:` 读数值：让下一步可判——
 * 是行丢了（`db: open` ∧ `unsettled: 0`），还是库根本不在盘（`db: not on disk`，Fix 1 无行可改）。
 */
function buildBatchNoLedgerRefusal({ batchDocAbs, chain, scope }) {
  const dbText = chain.db === "open"
    ? `open at ${chain.dbFile}`
    : chain.db === "not-on-disk"
      ? `not on disk at ${chain.dbFile}`
      : chain.db === "unreadable"
        ? `unreadable at ${chain.dbFile}`
        : "—" // 无项目根：没有库位可点名（`ledger base: —` 同因）
  return [
    `Advisor: launch refused — a design review needs its batch record to carry an unsettled ledger row. ${identityLine({
      type: "design",
      scope,
      round: "—", // 判定先于实例解析——本次发起无轮次（§2 第 5 条字段行）
      criterion: "batchdoc-no-ledger",
    })}`,
    `Why: the record says the work is in flight, the ledger says whose work it is — and no unsettled row points at this record (reason=${chain.reason}).`,
    `Record: ${batchDocAbs} — ledger base: ${chain.root ?? "—"} · db: ${dbText} · rows whose task_book resolves here: ${chain.rows} (unsettled: ${chain.unsettled}).`,
    'Fix 1 (the row was archived, still recoverable): ledger({action:"update", id:<N>, status:"在途"}) — 待核销 → 在途 是六态唯一的回退边; then ledger({action:"update", id:<N>, task_book:"<仓根相对指针>"}). Row is 已核销 / 已废弃 ⇒ that edge is gone, use Fix 2.',
    'Fix 2 (this record is the right home, no row can come back): start a new record — batch({action:"create", …}) opens its ledger row in the same call — and launch the review under it.',
    "Fix 3 (this record is finished): close it, and launch the review under the record that owns the work.",
    "Nothing was sent: no review instance, no round consumed, no design token minted, no LLM call.",
  ].join("\n")
}

export const advisorTool = {
  name: "advisor",
  description: DESC("advisor"),
  parameters: {
    type: "object",
    properties: {
      type: { type: "string", enum: ["code", "design"], description: "Review type (required): 'design' for design doc review, 'code' for code review. Omitting it is refused — there is no default." },
      async: {
        type: "boolean",
        description: "Background review: default at depth 0 = true (ack now, report via digest); async:false forces the blocking review. depth>0 → always sync.",
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
        description: "Review-object declaration — mechanically injected at the start of the review message. Absent → no injection (legacy behavior).",
      },
      paths: {
        type: "array",
        items: { type: "string" },
        description: "Code files or directories to review (for code review). Required unless documents is provided. The advisor reads exactly these — it has no git tool and never inspects diffs.",
      },
      documents: {
        type: "array",
        items: { type: "string" },
        description: "Doc paths to review (design / requirements / referenced docs). One rule: a relative path resolves against the session project root (e.g. docs/core/design/ADVISOR-GUARDS.md); an absolute path is used as-is. Accepted = an existing .md file anywhere inside a project (a repo-root doc such as METHODOLOGY.md counts); anything else is refused with the resolved path, the reason, and the two expected forms. The advisor reviews ONLY these — no git diff scan. Use for both review types to pass the task's docs list.",
      },
      batchDoc: {
        type: "string",
        description: "Design review only, REQUIRED: the batch record this review belongs to — the reviewer then also gets the `batch` write channel to record its findings + verdict. A design review without it is refused at launch (a token with no batch has no closer); a path that does not resolve to a readable file is refused. Relative paths resolve against the session cwd first, then candidate project roots (project-root-relative e.g. <repo>/docs/batches/…, or absolute). Code reviews do not pass it.",
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
    // 准入门：`type="design"` 且 `batchDoc` 缺失 / 空 ⇒ 拒发（判据与拒文 = `docs/core/design/ADVISOR-GUARDS.md`
    // §2 第 6 条）；「携了须可读」那半幅随账链门（下段）一并判——判据与文案仍单源 `resolveBatchDocPath`。
    // 绑定落 `resolved.run`（评审实例键）。
    // 理由：设计评审签出的 token 由关档收口，而关档只认批归属——批外签发的授权没有第二个关闭者
    // （spawn 只校验不消费、关档消费对无归属槽不适用，只剩 7 天 TTL）⇒ 堵法是让这种授权根本发不出去。
    // 位置 = 类型门之后、文档范围解析之前：类型诊断与「参数在不在」都先于范围诊断（真因不被次要报错掩盖），
    // 且二者都先于实例解析 / 签发 / LLM（零实例 / 零 token / 零槽 / 零 LLM）。
    if (reviewType === "design" && missingBatchDoc(args.batchDoc)) {
      if (ctx._toolCallId !== undefined) (agent._advisorRefusals ??= new Set()).add(ctx._toolCallId)
      return buildBatchDocRefusal(identityLine({
        type: reviewType,
        scope: scopeSummary(args.documents?.length ? args.documents : args.paths),
        round: "—", // 判定先于实例解析——本次发起无轮次（§2 第 5 条字段行）
        criterion: "batchdoc-missing",
      }))
    }
    // 账链门（`docs/core/design/ADVISOR-GUARDS.md` §2 第 7 条）：`type="design"` ∧ `batchDoc` 已解析为绝对路径且
    // 可读 ⇒ 点火拍查一次账——本档还有没有 ≥1 行未决台账行（`PENDING_STATUSES` 四态）的 `task_book` 指着它；
    // 查不出「有」⇒ 拒发（`criterion=batchdoc-no-ledger`，reason 三值），登记 `_advisorRefusals`。
    // 理由：第 6 条只要求「参数在 + 路径可读」，账侧从头到尾不问——行被撤回 ∥ 被结 ∥ 被改挂之后，
    // 评审照发、token 照签，收口时重锚不到任何行。
    // 批档绝对路径在本门就要用 ⇒ `resolveBatchDocPath` 从绑定行提前到此处调一次（绑定行复用同值，不二次解析）；
    // 携了不可读 ⇒ 走其既有 throw（顺序表第 3 行：可读是账链的前提，前提坏先报前提）。
    // 代码评审不走本门（绑定行对 `type="code"` 仍走原解析——行为零变）。
    let designBatchDocAbs = null
    if (reviewType === "design") {
      designBatchDocAbs = resolveBatchDocPath(agent.cwd, args.batchDoc)
      const chain = await resolveBatchLedgerLink({ batchDocAbs: designBatchDocAbs, anchor: agent.cwd })
      if (!chain.ok) {
        if (ctx._toolCallId !== undefined) (agent._advisorRefusals ??= new Set()).add(ctx._toolCallId)
        return buildBatchNoLedgerRefusal({
          batchDocAbs: designBatchDocAbs,
          chain,
          scope: scopeSummary(args.documents?.length ? args.documents : args.paths),
        })
      }
    }
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

    // 设计评审：受理面 = 项目内现存 `.md`——相对形按会话项目根解析（越根 ⇒ 拒）· 绝对形照用 · 解析不出 ⇒ 拒并说清期望形；零试探、零歧义归一。
    if (reviewType === "design" && documents) {
      const { invalid } = resolveReviewDocPaths(documents, agent.cwd)
      if (invalid.length > 0) {
        if (ctx._toolCallId !== undefined) (agent._advisorRefusals ??= new Set()).add(ctx._toolCallId)
        // 拒发文案：既有稳定前缀逐字（行首）+ 逐文档「输入 → 解析后绝对路径 ∥ 拒因」+ 锚态（仅无唯一基根）+ 候选全列 + 期望形两句。
        const lines = invalid.map((v) => `- ${v.doc} → ${v.resolved ?? "(no base)"} ∥ reason=${v.reason}${Array.isArray(v.sameName) && v.sameName.length > 0 ? `（盘上同名：${v.sameName.join(" ∥ ")}）` : ""}`)
        if (invalid.some((v) => v.reason === "ambiguous-path" || v.reason === "dangling-path")) {
          const view = projectRootView(agent.cwd)
          const where = view.state === "workspace" ? `workspace (${view.candidates.join(", ")})` : "none (no PROJECT-MANIFEST.json here or above)"
          lines.push(`Session anchor is ${where} — no single project root, so a relative path has no base to resolve against.`)
          const cands = [...new Set(invalid.flatMap((v) => v.candidates ?? []))]
          if (cands.length > 0) lines.push(`Candidates: ${cands.join(" ∥ ")} — pass one explicitly (an absolute path is the surest form).`)
        }
        lines.push("Expected form 1 — project-root-relative: docs/core/design/ADVISOR-GUARDS.md (resolved against the session project root).", "Expected form 2 — absolute: D:\\repo\\docs\\core\\design\\ADVISOR-GUARDS.md (used as-is).")
        return withIdentityLine(
          `Advisor: design review documents must be documentation files (per the project's conventions). Invalid:\n${lines.join("\n")}`,
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
    // BATCH-RECORD.md §4.2 评审侧批次档绑定（评审实例的唯一路径来源）：准入面与账链门已保证设计评审的
    // `batchDoc`（判据 = `docs/core/design/ADVISOR-GUARDS.md` §2 第 6 ∥ 7 条），本段只剩绑定落 `resolved.run`
    // （评审实例键，与 reviewType/round/designId 同族）——并发设计评审各绑各档，不用单值会话态
    // （BATCH-RECORD.md §4.7 #6）。
    if (args.batchDoc !== undefined && args.batchDoc !== null) {
      // 设计评审的绝对路径由账链门那一段算好（`designBatchDocAbs`——不二次解析）；代码评审仍走原解析。
      resolved.run.batchDoc = designBatchDocAbs ?? resolveBatchDocPath(agent.cwd, args.batchDoc)
    }
    // §3 点火基线（ADVISOR-GUARDS.md §1.1 判据 1）：结算面判「§3 已被本轮写过」需要「本轮之前有几块」
    // 这个点——只在点火拍可得（结算时再读只能得到「现在有几块」）。两轨同源（`run` 由池条目透传）。
    resolved.run.section3BlocksAtStart = section3BlocksBaseline(resolved.run.batchDoc)
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
