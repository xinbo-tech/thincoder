/**
 * advisor-async.mjs — async advisor reviews (AGENT-LOOP.md §24 D-24b — R13, 2026-09-06).
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
 *  3. the async pool (agent._asyncAdvisors — ADVISOR_POOL_LIMIT = 2, no
 *     queueing: an over-limit launch returns the refusal text immediately,
 *     ruling ②-6a); cancel (ruling ②-6b — directed abort → cancelled settle: no
 *     pending entry, no token, a "评审已取消——token 未签发" reminder);
 *  4. SETTLE accounting (fixes #2/#4 — moved from the tool-result commit): a
 *     review whose targets mutated after launch settles STALE — it marks no
 *     _calledAdvisorThisRun and issues no token (the guard pushes back); a
 *     non-stale code review marks _calledAdvisorThisRun; a passing design review
 *     issues its token under the designId slot at settle time.
 *
 * The sync path (depth>0 eng-coder self-review / explicit async:false) reuses
 * the same instance resolution (rounds/prior/cap) — its accounting still lands
 * in recordToolResults (agent.mjs run loop), marker-keyed by toolCall id.
 */
import { randomUUID } from "node:crypto"
import { join } from "node:path"
import { persistEngTokens } from "../token-ttl.mjs"
import { settleDesignReview, makeDesignTokenRegex, stripApprovedSuffix } from "./design-token.mjs"
// design-token 工具组（2026-09-08 自本文件迁至 design-token.mjs——再越 500 行硬限）——
// 既有 import 面（advisor.mjs / 测试）不变：原导出全部经此 re-export 保留。
export {
  buildApprovedSuffix, stripApprovedSuffix, effectiveTokenTtlMs, generateDesignToken,
  validateDesignToken, makeDesignTokenRegex, settleDesignReview,
} from "./design-token.mjs"
import { runAdvisorReview, resolveAdvisorProvider, ADVISOR_THINKING_PLACEHOLDER, looksLikeReviewOutput } from "../advisor/run.mjs"
import { isDocFile, isTempFile } from "../advisor/repos.mjs"
import { stripEventToken } from "../agent/spawn-child.mjs"
import { pushReal } from "../context.mjs"
import { logEvent, errText } from "../log.mjs"
import { escapeXml } from "../agent/helpers.mjs"

// ─────────────────────────────────────────────────────────────────────────────
// Review-instance registry (agent._advisorRuns — per-review rounds/prior/cap)
// ─────────────────────────────────────────────────────────────────────────────

export function advisorRuns(agent) {
  if (!(agent._advisorRuns instanceof Map)) agent._advisorRuns = new Map()
  return agent._advisorRuns
}

/** Canonical scope key for design reviews — the document multi-set
 *  (order-insensitive, ABS-path normalized — launch 与 continuation 的写法差异
 *  ("./docs/x.md" vs "docs/x.md"、反斜杠) 不误建新实例). */
function docSetKey(documents, cwd) {
  const list = [...new Set((documents ?? [])
    .filter((d) => typeof d === "string" && d.trim())
    .map((d) => normAbs(d, cwd)))]
  return JSON.stringify(list.sort())
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
 * Resolve the review instance a launch continues (§24 D-24b ③ — per-review
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
// Mutation log (stale-review determination — fix #2: FILE_MUTATORS after the
// review launch make the settle stale: no called-mark, no token, guard re-pushes)
// ─────────────────────────────────────────────────────────────────────────────

export function mutationSeqOf(agent) {
  return agent._mutationSeq ?? 0
}

/** Record a file-mutation commit — bounded ring feeding the stale scan. paths = ABSOLUTE.
 *  唯一记账点（§29 fix A）：dispatch runOne 写执行成功即刻调用（取代批后段 + 中断分支——
 *  不双计）；mergeChildMutations（子代理合入）是独立事件面。 */
export function noteMutations(agent, paths) {
  const list = (paths ?? []).filter((p) => typeof p === "string" && p.length > 0)
  if (list.length === 0) return
  agent._mutationSeq = (agent._mutationSeq ?? 0) + 1
  const log = agent._mutLog ??= []
  log.push({ seq: agent._mutationSeq, paths: [...new Set(list)] })
  if (log.length > 200) log.splice(0, log.length - 200)
}

/** A path counts as a CODE mutation (src/ unconditional; temp/doc excluded outside src/). */
function isCodePath(p) {
  return /(?:^|[\\/])src[\\/]/.test(p) || (!isTempFile(p) && !isDocFile(p))
}

function normAbs(p, cwd) {
  const s = String(p)
  return /^[a-zA-Z]:[\\/]/.test(s) || s.startsWith("/") || s.startsWith("\\\\") ? s : join(cwd, s)
}

/** Stale = a mutation committed after the launch touched the review's face:
 *  code reviews judge the CODE face; design reviews judge their OWN documents. */
export function reviewIsStale(agent, entry) {
  const log = agent?._mutLog
  if (!Array.isArray(log) || log.length === 0) return false
  const since = log.filter((m) => m.seq > (entry.launchSeq ?? -1))
  if (since.length === 0) return false
  if (entry.reviewType === "design") {
    const scope = (entry.docAbs ?? []).map((p) => normAbs(p, agent?.cwd))
    if (scope.length === 0) return false // no explicit doc scope — nothing to judge stale
    const set = new Set(scope)
    return since.some((m) => (m.paths ?? []).some((p) => set.has(normAbs(p, agent?.cwd))))
  }
  return since.some((m) => (m.paths ?? []).some((p) => isCodePath(normAbs(p, agent?.cwd))))
}

// ─────────────────────────────────────────────────────────────────────────────
// Async pool (agent._asyncAdvisors — ADVISOR_POOL_LIMIT = 2, launch-and-refuse)
// ─────────────────────────────────────────────────────────────────────────────

export const ADVISOR_POOL_LIMIT = 2

export function runningAdvisorCount(agent) {
  return [...(agent?._asyncAdvisors?.values() ?? [])].filter((e) => e.status === "running").length
}

/** Mechanical-failure prefixes (run.mjs resolves with these — never throws): a
 *  settle carrying one produced no review verdict and must not satisfy the guard. */
const ADVISOR_FAILURE_TEXT = /^Advisor: (?:review failed|review timeout|stopped after|interrupted|context window limit|empty response)/

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
  entry.controller?.abort?.()
  return { id: key, status: "cancelled" }
}

/**
 * Settle accounting (fix #2/#4 — runs when a non-cancelled review settles,
 * BEFORE the pending transfer / digest injection):
 *  1. round++ (attempts count — parity with the legacy _advisorRound++ budget);
 *  2. stale determination — mutated targets since launch → no called-mark, no token;
 *  3. non-stale: code review → _calledAdvisorThisRun = true; design review →
 *     token echo check (settleDesignReview: slot + instance close; single-value
 *     mirror retired per DESIGN-TOKEN-SETTLEMENT D3) + D1 settle-time slot persist
 *     (persistEngTokens — write failure = settle failure: no registration, no
 *     Approved echo, re-review — 评审 #1);
 *  4. §29 fix B — branch-shaped report output (the caller writes it back to
 *     entry.report; digest injects the CLEANED form): pass → stripped +
 *     Approved/designId suffix (sync 参照形态); persist-failed → stripped +
 *     "D1: …token could NOT be durably written…" re-review notice (no Approved
 *     suffix — never an unregistered token); stale → echo stripped +
 *     "评审目标已变更——token 未签发" prefix — never an unregistered token.
 * Cancelled / parent-aborted reviews consume nothing (the user dropped the
 * attempt — the retry must not lose budget).
 * @returns {{cancelled: boolean, stale: boolean, passed: boolean, report: string|null}}
 */
export function settleAdvisorRun(agent, entry) {
  if (entry.cancelled) return { cancelled: true, stale: false, passed: false, report: null }
  const run = entry.run
  if (!run) return { cancelled: false, stale: false, passed: false, report: entry.report ?? null }
  const result = entry.report ?? null
  run.round++
  agent._advisorRound = run.round
  const stale = reviewIsStale(agent, entry)
  run.stale = stale
  let report = result
  let passed = false
  if (!stale) {
    if (run.reviewType === "design" && entry.designToken && result) {
      // settle 前 Map 快照——落盘失败时回滚用（settle 失败 = 结算未发生，不留半结算态：
      // 重评覆盖旧槽的边角（F2h 复用 designId）也原样恢复旧 token——内存与盘一致）。
      const preMap = agent._engDesignTokens instanceof Map
        ? new Map(agent._engDesignTokens)
        : null
      const settled = settleDesignReview(agent, run, entry.designToken, result)
      if (settled.passed) {
        // DESIGN-TOKEN-SETTLEMENT D1（2026-09-08）：settle 是唯一结算点——settle 当场
        // 同步落盘 token 字段到槽文件（persistEngTokens = engTokenSlotFields 序列化 +
        // session 安全写/轮转——勿裸写文件），不等下个回合尾 saveSession（消除"settle→
        // 下个 saveSession"间的重启丢 token 窗口）。
        // 写失败即 settle 失败（评审 #1）：token 不注册（Map 回滚到 settle 前快照）、无
        // Approved 回显、可重评——不静默吞错、不产生"内存有盘上无"态（宁可结算失败
        // 可重评，不留半结算态）。
        let durable = false
        try {
          durable = persistEngTokens(agent)
        } catch (e) {
          logEvent("advisor:error", { id: `advisor#${entry.id}`, err: `engDesignTokens slot persist threw: ${e?.message ?? String(e)}` })
        }
        if (durable) {
          passed = true
          report = settled.output
        } else {
          if (preMap) agent._engDesignTokens = preMap
          else delete agent._engDesignTokens
          run.approvedSuffix = null
          logEvent("advisor:error", { id: `advisor#${entry.id}`, err: "engDesignTokens slot persist failed — settle failed (re-review)" })
          const stripped = String(result)
            .replace(makeDesignTokenRegex(entry.designToken, "g"), "")
            .trim()
          report = `${stripped}\n\nD1: the design review passed but the token could NOT be durably written to the session ledger (slot persist failed) — re-run advisor(type='design') to re-issue; no eng-coder spawn is authorized for this review (评审通过但 token 未能持久化——需重评).`.trim()
        }
      } else {
        report = settled.output
      }
    }
    // A completed review covers the code face ONLY when it actually produced a
    // verdict: a mechanical-failure settle ("Advisor: review failed/timeout/…" —
    // run.mjs resolves with the failure text, it never throws) must not satisfy
    // the guard silently — the digest shows the failure and the guard pushes
    // back for a retry (fix #2 anti-silent-skip intent; attempts still consume
    // the per-review round budget, so repeated failures stay bounded by the
    // cap). An error settle (rejection path — report null with an error) has no
    // verdict either — same exclusion (advisor 复评补边). Design reviews keep
    // the mark on any completed verdict (parity with the sync recordToolResults
    // mark — they have no code face to cover).
    const failureVerdict = run.reviewType !== "design" && (
      ADVISOR_FAILURE_TEXT.test(String(report ?? "")) ||
      (result == null && entry.error != null)
    )
    if (!failureVerdict) {
      agent._calledAdvisorThisRun = true
    }
  } else if (run.reviewType === "design" && entry.designToken && result != null) {
    // §29 fix B（stale 分支）：陈旧评审不签发——digest 不得展示未注册 token——先剥
    // 方括号回显 + 前置 "评审目标已变更——token 未签发"（不变式——两分支都清洗）。
    const stripped = String(result)
      .replace(makeDesignTokenRegex(entry.designToken, "g"), "")
      .trim()
    report = `评审目标已变更——token 未签发 (review target changed after launch — this review judged a stale state; no design token was issued — re-run the review on the current state)\n\n${stripped}`.trim()
  }
  // Prior of round 2+ = the last REVIEW-LOOKING output (mirror of run.mjs's guard).
  // F2e (§29.1): strip the engine-approved suffix FIRST — the prior must never
  // carry the raw token / designId (exact truncation — zero collateral).
  if (report && looksLikeReviewOutput(report)) {
    run.priorOutput = stripApprovedSuffix(report, run.approvedSuffix)
  }
  return { cancelled: false, stale, passed, report }
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
 * @returns {{ok: true, id: string}} — ack; or {{error: string}} — pool full
 *   (ADVISOR_POOL_LIMIT — "另有一评审在跑——逐个发起", never queued) or invalid ctx.
 */
export function launchAsyncAdvisor(parent, ctx, launch) {
  const { reviewType, documents, paths, object, designToken, designId, run } = launch
  if (runningAdvisorCount(parent) >= ADVISOR_POOL_LIMIT) {
    return { error: `Advisor: 另有一评审在跑——逐个发起 — another review is already running in the background pool (${ADVISOR_POOL_LIMIT} reviews at most); launch them one at a time (AGENT-LOOP.md §24 D-24b ruling ②-6a).` }
  }
  parent._asyncAdvisors ??= new Map()
  const id = (parent._subAgentCounter = (parent._subAgentCounter ?? 0) + 1)
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
  const ctrl = new AbortController()
  entry.controller = ctrl
  const baseSignal = parent._sessionSignal ?? ctx?.signal ?? null
  if (baseSignal) {
    if (baseSignal.aborted) ctrl.abort()
    else baseSignal.addEventListener("abort", () => ctrl.abort(), { once: true })
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
      .catch((err) => { entry.error = err?.message ?? String(err) })
      .finally(() => {
        entry.status = "done"
        entry.done = true
        const childLogId = `advisor#${entry.id}`
        const parentAborted = ctx?.signal?.aborted || entry.controller?.signal?.aborted
        // Settle accounting runs for genuinely completed reviews only: a parent-aborted
        // review (Ctrl+C — sync parity) and a cancelled one (②-6b — settleAdvisorRun's
        // own early return) consume no round and set no called-mark.
        if (!parentAborted) {
          const settled = settleAdvisorRun(parent, entry)
          // §29 fix B：settle 分支输出（清洗/未签发提示）写回 entry.report——digest 原样进。
          if (settled.report != null) entry.report = settled.report
        }
        if (entry.cancelled) {
          logEvent("ev:cancelled", { id: childLogId })
        } else if (!parentAborted) {
          const err = entry.error != null ? errText(entry.error, 200) : null
          logEvent("child:done", { role: "advisor", id: childLogId, ms: Date.now() - entry.startedAt, kind: err ? "error" : "ok" })
          if (parent._suspended) logEvent("ev:settled", { id: childLogId, kind: "suspended" })
        }
        // Cancelled settle (②-6b): no pending entry, no token slot, a digest
        // hint reminder ("评审已取消——token 未签发") — subagent-run parity.
        if (entry.cancelled) {
          parent._asyncAdvisors?.delete(String(entry.id))
          const tombstones = (parent._asyncTombstones ??= new Map())
          tombstones.set(String(entry.id), { status: "cancelled", role: "advisor" })
          ctx?.callbacks?.onToken?.(`${entry.relayPrefix}⟦ev⟧stopped\x1e0\x1e0\x1estopped\x1e`)
          pushReal(parent, {
            role: "user",
            content: `[System reminder: async advisor review #${escapeXml(String(entry.id))} cancelled — the review did not settle; token not issued (评审已取消——token 未签发)]`,
          })
        } else if (!ctx?.signal?.aborted) {
          // Settle 分流 (D-S3/D-S8): suspended → pending (digest injects at the
          // next run start); in-run settle → stays pooled until the turn-end
          // collection / the suspension sweep (subagent-run parity).
          if (parent._suspended) {
            parent._pendingAsyncResults ??= []
            parent._pendingAsyncResults.push(entry)
            parent._asyncAdvisors?.delete(String(entry.id))
            ctx?.callbacks?.onToken?.(`${entry.relayPrefix}⟦ev⟧settled\x1e0\x1e0\x1esettled\x1e`)
          } else {
            ctx?.callbacks?.onToken?.(`${entry.relayPrefix}⟦ev⟧done\x1e0\x1e0\x1edone\x1e`)
          }
        }
        entry._settleSeq = (parent._asyncSettleSeq = (parent._asyncSettleSeq ?? 0) + 1)
        entry._settle()
        for (const w of parent._asyncWaiters?.splice(0) ?? []) { try { w() } catch { /* noop */ } }
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
