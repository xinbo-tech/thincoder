/**
 * advisor-async.mjs — async advisor reviews (AGENT-LOOP.md §11.2 — R13, 2026-09-06).
 *
 * The advisor tool runs reviews in a background pool at depth 0 (default async —
 * ruling ②-3 A): the launch returns an ack, the turn ends naturally, the session
 * suspends, the review settles into _pendingAsyncResults and a digest turn
 * delivers the report (§17 consumption machinery — role-agnostic; entries carry
 * role "advisor" and ride the subagent panel as a pseudo-role, ruling ②-4 A).
 *
 * This module owns:
 *  1. the per-review INSTANCE registry (agent._advisorRuns — ruling ②-5 A:
 *     Map<reviewId, {reviewType, round, priorOutput, stale, open, docSetKey,
 *     designId}>) — the 5-round convergence cap is PER REVIEW (fix #4), no longer
 *     a run-global shared budget (design + code used to share _advisorRound);
 *  2. launch resolution: design reviews continue the instance of the same
 *     document set (reviewId = the designId minted at the instance's first
 *     launch); code reviews continue the newest OPEN code instance (round 2+ of
 *     a fix loop) and CLOSE at normal user-run ends once no review is in flight
 *     (a converged/abandoned thread must not burn the cap of later tasks);
 *  3. the async pool (agent._asyncAdvisors — ADVISOR_POOL_LIMIT = 4 default,
 *     agent.poolLimits.advisor configurable — POOL-CONFIG-UNIFIED; over-limit and
 *     same-scope-running launches are refused at once — never queued (②-6a; F-5);
 *     cancel (ruling ②-6b — directed abort → cancelled settle: no
 *     pending entry, no token, a "评审已取消——token 未签发" reminder);
 *  4. SETTLE accounting (fixes #2/#4 — moved from the tool-result commit): a
 *     review whose targets mutated after launch settles STALE — it marks no
 *     _calledAdvisorThisRun and issues no token (the guard pushes back); a
 *     non-stale code review marks _calledAdvisorThisRun; a passing design review
 *     issues its token under the designId slot at settle time.
 *     2026-09-11 第 11 批拆分：settle 记账 + 变更日志 + 陈旧/冻结判定迁 `advisor-settle.mjs`
 *     （本文件 500 行 = 硬帽在册）；既有 import 面经本文件 re-export 保持不变。
 *
 * The sync path (depth>0 eng-coder self-review / explicit async:false) reuses
 * the same instance resolution (rounds/prior/cap) — its accounting still lands
 * in recordToolResults (agent.mjs run loop), marker-keyed by toolCall id.
 */
import { randomUUID } from "node:crypto"
// design-token 工具组（2026-09-08 自本文件迁至 design-token.mjs——再越 500 行硬限）——
// 既有 import 面（advisor.mjs / 测试）不变：原导出全部经此 re-export 保留。
export {
  buildApprovedSuffix, stripApprovedSuffix, effectiveTokenTtlMs, generateDesignToken,
  validateDesignToken, makeDesignTokenRegex, settleDesignReview,
} from "./design-token.mjs"
// 第 11 批拆分（2026-09-11）：settle 记账 + 变更日志（noteMutations）+ 陈旧判定
// （reviewIsStale）+ 冻结冲突（inflightDesignReviewConflict）迁 advisor-settle.mjs——
// 既有 import 面（dispatch / subagent-async / escalate-async / 测试）经此 re-export 不变。
import { normAbs, mutationSeqOf, settleAdvisorRun } from "./advisor-settle.mjs"
export {
  mutationSeqOf, noteMutations, reviewIsStale, settleAdvisorRun, inflightDesignReviewConflict,
} from "./advisor-settle.mjs"
// 第 33 批（§17.5）：doc-set 键迁 `review-streak.mjs`（护栏与实例续跑同锚单源；原为私有
// ——零 import 面）。本文件继续在实例解析 / 池 entries 上消费它。
import { docSetKey } from "./review-streak.mjs"
import { runAdvisorReview, resolveAdvisorProvider, ADVISOR_THINKING_PLACEHOLDER } from "../advisor/run.mjs"
import { stripEventToken } from "../agent/spawn-child.mjs"
import { logEvent } from "../log.mjs"
import { deathLine } from "../abort-provenance.mjs"
// ASYNC-RESULT-CONTAINER.md D3/D6：settle 公共收尾单点 + child signal 构建单点
import { buildChildSignal, settleAsyncEntry } from "./async-settle.mjs"
import { nextSubagentId } from "./subagent-scheduler.mjs"

// ─────────────────────────────────────────────────────────────────────────────
// Review-instance registry (agent._advisorRuns — per-review rounds/prior/cap)
// ─────────────────────────────────────────────────────────────────────────────

export function advisorRuns(agent) {
  if (!(agent._advisorRuns instanceof Map)) agent._advisorRuns = new Map()
  return agent._advisorRuns
}

/** The newest OPEN code instance (the thread a fix-round launch continues), or null. */
export function openCodeRun(agent) {
  const runs = agent?._advisorRuns
  if (!(runs instanceof Map) || runs.size === 0) return null
  for (const r of [...runs.values()].reverse()) {
    if (r.reviewType === "code" && r.open) return r
  }
  return null
}

/** The newest OPEN design instance for the given document set, or null. */
function openDesignRun(agent, key) {
  const runs = agent?._advisorRuns
  if (!(runs instanceof Map) || runs.size === 0) return null
  for (const r of [...runs.values()].reverse()) {
    if (r.reviewType === "design" && r.open && r.docSetKey === key) return r
  }
  return null
}

/**
 * Resolve the review instance a launch continues (§11.2 ③ — per-review
 * rounds/prior; reviewId = designId for design reviews, a random id for code).
 *  - design: continue the OPEN instance of the same document set (fix rounds of
 *    a review thread keep its designId and its round/prior); none → new instance.
 *  - code: continue the newest OPEN code instance (guard-driven fix loops);
 *    none → new instance.
 * The legacy agent._advisorRound/_lastAdvisorOutput fields are SCOPED to the
 * instance before the launch (message building + the run.mjs cap read them) —
 * prior-less continuation degrades to round 1 semantics (fresh full review).
 * @returns {{run: object, isNew: boolean, reviewId: string, designId: string|null}}
 */
export function resolveAdvisorLaunch(agent, reviewType, { documents = null } = {}) {
  const runs = advisorRuns(agent)
  let run = null
  if (reviewType === "design") {
    const key = docSetKey(documents, agent.cwd)
    run = openDesignRun(agent, key)
    if (!run) {
      const reviewId = randomUUID()
      // F2h (§29.1 2026-09-07): a same-scope re-review reuses the session's
      // designId for this doc-set (any prior instance of the scope — open OR
      // closed — the newest wins). A passed re-review overwrites the slot under
      // the same id (no slot residue — T14: the old token is then rejected at
      // the gate); old slots die at TTL only, kept as the fail-safe fallback.
      const prior = [...runs.values()].reverse().find((r) => r.reviewType === "design" && r.docSetKey === key)
      run = {
        reviewId, reviewType, designId: prior?.designId ?? reviewId,
        round: 0, priorOutput: null, stale: false, open: true, docSetKey: key,
      }
      runs.set(reviewId, run)
    }
  } else {
    run = openCodeRun(agent)
    if (!run) {
      const reviewId = randomUUID()
      run = {
        reviewId, reviewType, designId: null,
        round: 0, priorOutput: null, stale: false, open: true, docSetKey: null,
      }
      runs.set(reviewId, run)
    }
  }
  // Scope the legacy mirror fields (message builder + run.mjs cap + displays).
  agent._advisorRound = run.priorOutput ? run.round : 0
  agent._lastAdvisorOutput = run.priorOutput
  return { run, isNew: run.round === 0 && !run.priorOutput, reviewId: run.reviewId, designId: run.designId }
}

/** Guard round — the OPEN CODE instance only (2026-09-07 §8 F2): the design-written
 *  mirror never gates the code guard — no open code instance → 0. */
export function effectiveAdvisorRound(agent) {
  return openCodeRun(agent)?.round ?? 0
}

// ─────────────────────────────────────────────────────────────────────────────
// Async pool (agent._asyncAdvisors — pool 上限 F-1/F-2:常量 = 运行时回退权威(2 → 4),
// config.mjs DEFAULTS.agent.poolLimits.advisor = config 层镜像——耦合锁 config-pool
// .test.mjs 逐键断言——勿单侧改默认)
// ─────────────────────────────────────────────────────────────────────────────

export const ADVISOR_POOL_LIMIT = 4

/** §11.2 advisor 池生效上限（纯——读 agent.poolLimits.advisor——合法 ≥1 整数生效——
 *  非法/缺省回退 ADVISOR_POOL_LIMIT——与 subagent 域 resolvePoolLimits 独立不共享
 *  （subagent 两键表不含本键——键表语义不同——POOL-CONFIG-UNIFIED F-2））。 */
export function resolveAdvisorPoolLimit(raw) {
  const v = raw?.advisor
  return Number.isInteger(v) && v >= 1 ? v : ADVISOR_POOL_LIMIT
}

/** launch 判定点每次读 agent.config（/config 热应用——变更即生效下个 launch——文案
 *  如实报本值）。 */
export function advisorPoolLimitFor(agent) {
  return resolveAdvisorPoolLimit(agent?.config?.agent?.poolLimits)
}
/** §11.2 同 scope 守卫（F-5——用户裁①）：同 reviewType+scope 有 running 评审 → true
 *  （拒——running 并行多实例歧义放大——settled 续跑语义不变）。design scope = 文档集键
 *  （docSetKey）；code = 单 code 线程（记录不记路径键——与 openCodeRun 语义一致）。
 *  与池容量守卫独立：容量 = 全局 ≤N——scope = 同 scope ≤1——两关都过才启动。 */
export function runningAdvisorOfScope(agent, reviewType, docSetKey) {
  const pool = agent?._asyncAdvisors
  if (!(pool instanceof Map)) return false
  for (const e of pool.values()) {
    if (e.status !== "running" || e.reviewType !== reviewType) continue
    if (reviewType === "design" && e.run?.docSetKey !== docSetKey) continue
    return true
  }
  return false
}

export function runningAdvisorCount(agent) {
  return [...(agent?._asyncAdvisors?.values() ?? [])].filter((e) => e.status === "running").length
}

/** Any in-flight (non-done) async advisor review? — the completion guard skips
 *  its push-back while a review is pending (T-24b4: 未决不算未评审). */
export function advisorReviewPending(agent) {
  return [...(agent?._asyncAdvisors?.values() ?? [])].some((e) => !e.done)
}

/** Directed cancel (ruling ②-6b — ⏹/cancel): abort the running review's
 *  controller (run.mjs signal chain) → the settle callback runs the cancelled
 *  branch (no pending entry / no token / "评审已取消——token 未签发" reminder). */
export function cancelAsyncAdvisor(agent, id) {
  const key = String(id)
  const map = agent?._asyncAdvisors ?? new Map()
  const entry = map.get(key)
  if (!entry) {
    return { id: key, status: "error", error: `unknown async advisor review id: ${key}` }
  }
  if (entry.done) {
    return { id: key, status: "error", error: `async advisor review #${key} has already finished — nothing to cancel` }
  }
  if (entry.cancelled) return { id: key, status: "cancelled" } // abort already in flight — idempotent
  entry.cancelled = true
  // §20.3 站点 #11（第 24 批）：定向中止 = cancel（reason 载荷）
  entry.controller?.abort?.({ abortTrigger: "cancel", abortDetail: "advisor-cancel" })
  return { id: key, status: "cancelled" }
}

/** Relay an advisor onOutput chunk into the subagent block channel (`advisor#N/`
 *  prefix — kind-preserving: think via onReasoning, tool via onToolOutput, text
 *  via onToken; the wait placeholder is stripped — it is a live indicator, not
 *  content, and the sync path strips it at freeze too). */
function relayAdvisorOutput(callbacks, prefix, chunk) {
  if (!callbacks) return
  const kind = typeof chunk === "string" ? "text" : (chunk?.kind ?? "text")
  const text = typeof chunk === "string" ? chunk : String(chunk?.text ?? "")
  if (!text) return
  if (kind === "think") {
    callbacks.onReasoning?.(prefix + text.replaceAll(ADVISOR_THINKING_PLACEHOLDER, ""))
  } else if (kind === "tool") {
    callbacks.onToolOutput?.(prefix + "tool", { kind: "tool", text })
  } else {
    callbacks.onToken?.(prefix + stripEventToken(text))
  }
}

/**
 * Launch an async advisor review (pool entry + background runner + settle
 * wiring — mirrors subagent-run.mjs's lifecycle, minus queueing/scheduler).
 * The runner wraps runAdvisorReview (promise → report/error) — the subagent
 * pipeline is untouched (ruling ②-2 A). The entry carries role "advisor" so the
 * digest/panel/freeze consumers route it like any other settled block.
 * @returns {{ok: true, id: string}} — ack; or {{error: string}} — scope guard
 *   (same reviewType+scope running — §11.2 F-5) or pool full (the effective
 *   agent.poolLimits.advisor limit, never queued) or invalid ctx.
 */
export function launchAsyncAdvisor(parent, ctx, launch) {
  const { reviewType, documents, paths, object, designToken, designId, run } = launch
  const limit = advisorPoolLimitFor(parent)
  // §11.2 same-scope guard（F-5——用户裁①）：同 type+scope 有 running → 拒——与池容量
  // 守卫独立两关都过才启动——不等不排（②-6a 无排队语义保持——settled 续跑不变）。
  if (runningAdvisorOfScope(parent, reviewType, run?.docSetKey ?? null)) {
    const scopeNote = reviewType === "design"
      ? "a design review of this document set is still running"
      : "a code review is still running (code reviews are a single thread — launch the next one after it settles)"
    return { error: `Advisor: 此 scope 已有评审在跑——settle 后逐个发起 — ${scopeNote}; round/prior continuation would be ambiguous while it is in flight — wait for it to settle, then launch the next review (AGENT-LOOP.md §11.2).` }
  }
  if (runningAdvisorCount(parent) >= limit) {
    return { error: `Advisor: 另有一评审在跑——逐个发起 — another review is already running in the background pool (${limit} reviews at most — agent.poolLimits.advisor, default ${ADVISOR_POOL_LIMIT}); launch them one at a time (AGENT-LOOP.md §11.2 ruling ②-6a).` }
  }
  parent._asyncAdvisors ??= new Map()
  // SUBAGENT-ID-COUNTER-AGENT（2026-09-09）：取号统一走 nextSubagentId——池活续号兜底 + 跨池共号（§11.2）。
  const id = nextSubagentId(parent)
  const entry = {
    id, role: "advisor", reviewType, run,
    reviewId: run.reviewId, designId, designToken, documents, paths, object,
    launchSeq: mutationSeqOf(parent),
    docAbs: reviewType === "design" && Array.isArray(documents)
      ? documents.filter((d) => typeof d === "string").map((d) => normAbs(d, parent.cwd))
      : [],
    relayPrefix: `advisor#${id}/`,
    status: "running", position: undefined,
    report: null, error: null, done: false, cancelled: false,
    promise: null, _settle: null,
    model: (() => { try { return resolveAdvisorProvider(parent).model ?? null } catch { return null } })(),
    startedAt: Date.now(), turn: 0, maxTurns: 0,
    controller: null,
  }
  // Entry controller chained to the session/run base signal (subagent-run parity):
  // Ctrl+C / session abort propagates into the review's chat; a digest's own
  // Ctrl+I must not orphan it (children hold the session signal while suspended).
  // D6 buildChildSignal 单点（ASYNC-RESULT-CONTAINER.md）。
  const ctrl = new AbortController()
  entry.controller = ctrl
  const baseSignal = buildChildSignal(parent, ctx)
  if (baseSignal) {
    // §20.3 站点 #10（第 24 批）：hop 逐跳保 reason
    if (baseSignal.aborted) ctrl.abort(baseSignal.reason)
    else baseSignal.addEventListener("abort", () => ctrl.abort(baseSignal.reason), { once: true })
  }
  entry.promise = new Promise((res) => { entry._settle = res })
  entry.start = () => {
    entry.startedAt = Date.now()
    // Async mark + [model] — the TUI block opens at ACTUAL start (⏹ gating reads it).
    ctx?.callbacks?.onToken?.(entry.relayPrefix + "⟦ev⟧async\x1e")
    ctx?.callbacks?.onToken?.(entry.relayPrefix + "[model]" + (entry.model ?? ""))
    runAdvisorReview(parent, reviewType, {
      onOutput: (chunk) => relayAdvisorOutput(ctx?.callbacks, entry.relayPrefix, chunk),
      signal: entry.controller.signal,
    }, designToken, documents, paths, object, designId)
      .then((report) => { entry.report = report })
      // §20.3 第 3 条合成器（第 24 批）：原 message 前缀逐字保留 + 来源后缀
      .catch((err) => { entry.error = deathLine(err, entry.controller?.signal) })
      .finally(() => {
        // settle 公共收尾单点（ASYNC-RESULT-CONTAINER.md D3——settleAsyncEntry）：日志三连
        // /cancelled 分支（出池+墓碑+⟦ev⟧stopped+"评审已取消——token 未签发"提醒）/挂起分流
        // （pending 单容器+出池——统一守卫 !parentAborted——D4）/公共尾部（settleSeq/_settle/
        // 唤醒 waiter）统一走共享 helper。族特有 hook = settleAdvisorRun 记账（fix #2/#4——
        // 陈旧判定/轮次/token D1 落盘——settle 分支输出写回 entry.report，digest 原样进）；
        // cancelled/parent-aborted 不调（不消费预算——settleAdvisorRun 自己的早退语义等价）。
        settleAsyncEntry(parent, entry, {
          pool: parent._asyncAdvisors,
          ctx,
          onAccounting: () => {
            const settled = settleAdvisorRun(parent, entry)
            // §29 fix B：settle 分支输出（清洗/未签发提示）写回 entry.report——digest 原样进。
            if (settled.report != null) entry.report = settled.report
          },
        })
      })
  }
  parent._asyncAdvisors.set(String(id), entry)
  logEvent("child:spawn", { role: "advisor", id: `advisor#${id}`, kind: "async", status: "running", ms: 0 })
  entry.start()
  return { ok: true, id: String(id) }
}

/**
 * Close every OPEN code instance at a normal non-auto run end (finalizeAgentTurn)
 * when no review/child activity remains: a code thread that settled and whose
 * digest was consumed must not burn the 5-round cap of a later task — the next
 * code review starts a fresh full review (round 1). Runs that END with a review
 * or an eng-coder child in flight keep the thread open (fix-round continuation).
 * @returns {boolean} whether any instance was closed
 */
export function closeOpenCodeAdvisorRuns(agent) {
  const advisors = agent?._asyncAdvisors
  // Any pooled advisor entry — running OR settled-not-consumed — keeps the
  // thread open: an in-run settle whose report has not reached the model (the
  // suspension sweep / digest consumes it next) must still be continuable by
  // the fix round that follows the disposition.
  if ((advisors?.size ?? 0) > 0) return false
  if ((agent?._asyncSubagents?.size ?? 0) > 0) return false
  if ((agent?._pendingAsyncResults ?? []).some((e) => e.role === "advisor")) return false
  let closed = false
  const runs = agent?._advisorRuns
  if (runs instanceof Map) {
    for (const r of runs.values()) {
      if (r.reviewType === "code" && r.open) { r.open = false; closed = true }
    }
  }
  return closed
}
