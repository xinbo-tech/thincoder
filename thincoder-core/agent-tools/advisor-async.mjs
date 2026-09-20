/**
 * advisor-async.mjs — async advisor reviews (AGENT-LOOP-SUBAGENT.md §6.10 — R13, 2026-09-06).
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
 *     designId}>) — rounds/prior are PER REVIEW (fix #4), no longer a run-global
 *     shared counter (design + code used to share _advisorRound);
 *  2. launch resolution: design reviews continue the instance of the same
 *     document set (reviewId = the designId minted at the instance's first
 *     launch); code reviews continue the newest OPEN code instance (round 2+ of
 *     a fix loop) and CLOSE at normal user-run ends once no review is in flight
 *     (a converged/abandoned thread must not burn the cap of later tasks);
 *  3. the async pool (agent._asyncAdvisors — ADVISOR_POOL_LIMIT = 4 default,
 *     agent.poolLimits.advisor configurable — POOL-CONFIG-UNIFIED; same-scope
 *     running launches are refused at once — never queued (F-5); over-limit +
 *     DIFFERENT scope launches QUEUE (ED-4 2026-09-16 — AGENT-LOOP-SUBAGENT.md §6.10:
 *     agent._asyncAdvisorQueue, ack {queued, position}, slot release auto-start,
 *     queued cancel dequeue+renumber — the former over-limit refusal ②-6a is
 *     retired); cancel (ruling ②-6b — directed abort → cancelled settle: no
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
// 第 33 批（§17.5）：doc-set 键迁事实面档（实例续跑与陈旧判定同锚单源；原为私有——零 import 面）。
// 本文件继续在实例解析 / 池 entries 上消费它。
import { docSetKey } from "./review-facts.mjs"
// F31（2026-09-18 顾问面治理批）：拒回文案对象标识行单源。
import { withIdentityLine, scopeSummary } from "../advisor/notice.mjs"
import { runAdvisorReview, resolveAdvisorProvider, ADVISOR_THINKING_PLACEHOLDER } from "../advisor/run.mjs"
import { stripEventToken } from "../agent/spawn-child.mjs"
import { escapeXml } from "../agent/helpers.mjs"
import { pushReal } from "../context.mjs"
import { logEvent } from "../log.mjs"
import { deathLine } from "../abort-provenance.mjs"
// ASYNC-RESULT-CONTAINER.md D3/D6：settle 公共收尾单点 + child signal 构建单点
import { bindChildController, buildChildSignal, carrierField, getAsyncPool, settleAsyncEntry, tombstoneOf, writeTombstone } from "./async-settle.mjs"
import { nextSubagentId, consumeSubagentToken, assertPoolKeyFree, entryTerminal } from "./subagent-scheduler.mjs"

// ─────────────────────────────────────────────────────────────────────────────
// Review-instance registry (_advisorRuns — per-review rounds/prior/cap)
// ─────────────────────────────────────────────────────────────────────────────

/** 载体吸收后的只读读取（不创建）：父对象字段优先、缺字段回退跨 run 载体
 *  （`history` 数组——agent 逐 run 重建的形态靠它跨 run 存活）。无 ⇒ null。 */
function advisorRunsRead(agent) {
  const m = carrierField(agent, "_advisorRuns")
  return m instanceof Map ? m : null
}

export function advisorRuns(agent) {
  // 实例注册表读取吸收（与 #94 载体口径同源）：既有形态（字段挂 agent）零变；
  // 注册表已挂跨 run 载体的形态直接沿用（不另建分叉）。
  const existing = advisorRunsRead(agent)
  if (existing) return existing
  // 缺省创建：落在跨 run 载体上（有 history 时）——与其余载体字段同口径。
  const holder = agent?.history ?? agent
  if (!holder) return new Map()
  if (!(holder._advisorRuns instanceof Map)) holder._advisorRuns = new Map()
  return holder._advisorRuns
}

/** The newest OPEN code instance (the thread a fix-round launch continues), or null. */
export function openCodeRun(agent) {
  const runs = advisorRunsRead(agent)
  if (!(runs instanceof Map) || runs.size === 0) return null
  for (const r of [...runs.values()].reverse()) {
    if (r.reviewType === "code" && r.open) return r
  }
  return null
}

/** The newest OPEN design instance for the given document set, or null. */
function openDesignRun(agent, key) {
  const runs = advisorRunsRead(agent)
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
  const pool = getAsyncPool(agent, "advisor")
  if (!(pool instanceof Map)) return false
  for (const e of pool.values()) {
    if (e.status !== "running" || e.reviewType !== reviewType) continue
    if (reviewType === "design" && e.run?.docSetKey !== docSetKey) continue
    return true
  }
  return false
}

export function runningAdvisorCount(agent) {
  return [...(getAsyncPool(agent, "advisor")?.values() ?? [])].filter((e) => e.status === "running").length
}

/** Any in-flight (non-done) async advisor review? — the completion guard skips
 *  its push-back while a review is pending (T-24b4: 未决不算未评审). */
export function advisorReviewPending(agent) {
  return [...(getAsyncPool(agent, "advisor")?.values() ?? [])].some((e) => !e.done)
}

/** Directed cancel (ruling ②-6b — ⏹/cancel): abort the running review's
 *  controller (run.mjs signal chain) → the settle callback runs the cancelled
 *  branch (no pending entry / no token / "评审已取消——token 未签发" reminder).
 *  queued 目标（af 批 §6.11 第 3 条）：出队 + 余位重编号 + 终态 cancelled + 机读线提醒
 *  + `⟦ev⟧cancelled`（唯一发射点——经调用方通道 `onToken`）+ `ev:cancelled` 日志；
 *  无 abort（从未 start）⇒ 无 `⟦ev⟧stopped`。`onToken` 缺省 ⇒ 不发射（不另发）。
 *  终态确认面（af 批 fix 轮）：出队后 tombstone 在册 ⇒ 重复取消返回同一确认
 *  （`{id, status:"cancelled"}`——零重复注入 / 发射 / 日志）；在册 `done` / 未知 id 文案不变。 */
export function cancelAsyncAdvisor(agent, id, onToken) {
  const key = String(id)
  const map = getAsyncPool(agent, "advisor") ?? new Map()
  const entry = map.get(key)
  if (!entry) {
    // af 批 fix 轮（T-AF2 终态确认面——§6.11 第 3 条「幂等与池面」）：queued 取消出队即出池
    // ⇒ 重复取消经 cancelled 墓碑返回同一确认（本分支全早退——零重复注入 / 发射 / 日志）。
    // 非取消墓碑（consumed / failed / discarded）与无墓碑 ⇒ 既有 unknown-id 文案不变；
    // role 守卫：本条只答评审族（子代理族墓碑不在本面）。
    const tomb = tombstoneOf(agent, key)
    if (tomb?.status === "cancelled" && tomb.role === "advisor") return { id: key, status: "cancelled" }
    return { id: key, status: "error", error: `unknown async advisor review id: ${key}` }
  }
  if (entry.done) {
    return { id: key, status: "error", error: `async advisor review #${key} has already finished — nothing to cancel` }
  }
  if (entry.cancelled) return { id: key, status: "cancelled" } // abort already in flight — idempotent
  // ED-4（§6.10 取消路由）：queued 取消 = 出队 + 余位 position 重编号 + 终态 cancelled
  // （无 abort——从未 start；was 记 queued 供 TUI 排队块移除——subagent 取消同式
  //   subagent-async.mjs）。排队条目取消不释放槽——不做补位（槽从未被占）。
  // af 批收尾三面同址单点：机读线提醒（逐字同 running 面模板）/ 块面事件（唯一发射点）/ 日志面（queued 不经 settle ⇒ 出队点直记）。
  if (entry.status === "queued") {
    dequeueAdvisor(agent, entry)
    entry.cancelled = true
    entry.done = true
    entry.status = "done"
    map.delete(key)
    writeTombstone(agent, key, "cancelled", "advisor")
    pushReal(agent, {
      role: "user",
      content: `[System reminder: async advisor review #${escapeXml(String(entry.id))} cancelled — the review did not settle; token not issued (评审已取消——token 未签发)]`,
    })
    // 块面事件（零字段；relay 前缀 advisor#<id>/）——不发 ⟦ev⟧stopped（非 settle 通道）
    try { onToken?.(`${entry.relayPrefix}⟦ev⟧cancelled\x1e`) } catch { /* relay 失败不影响池状态 */ }
    logEvent("ev:cancelled", { id: `advisor#${key}` }) // 与 running 面同形（写点互斥 ⇒ 恰一条）
    entry._settle?.()
    return { id: key, status: "cancelled", was: "queued" }
  }
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

// ─── ED-4（2026-09-16 · AGENT-LOOP-SUBAGENT.md §6.10）：评审池排队（槽释放自动起跑）────────

/** 排队出队单点（ED-4）：`_asyncAdvisorQueue` 剔除目标条目 + 余项 position 按 `1..n`
 *  重编号；读面经**载体吸收**（`carrierField`——#21⑤b）：部分 parent（只携池 + `history`）
 *  下不再 no-op（原直读 ⇒ 已取消评审被补位重启）。 */
function dequeueAdvisor(parent, entry) {
  const queue = carrierField(parent, "_asyncAdvisorQueue")
  if (!Array.isArray(queue)) return
  const qi = queue.indexOf(entry)
  if (qi < 0) return
  queue.splice(qi, 1)
  for (let i = 0; i < queue.length; i++) queue[i].position = i + 1
}

/** 排队块刷新（⟦ev⟧queued——slot 面：advisor 队列仅容量/scope 排队，无 dep/wait 面）——
 *  `_lastQueuedSig` 幂等去重；读面经**载体吸收**（部分 parent 不得 no-op——调用点含 VSC
 *  ⏹ → `executeCancelAction` 的合成 parent）。 */
export function refreshAdvisorQueuedTokens(parent, onToken) {
  if (typeof onToken !== "function") return
  const queue = carrierField(parent, "_asyncAdvisorQueue")
  if (!Array.isArray(queue)) return
  for (let i = 0; i < queue.length; i++) {
    const e = queue[i]
    const sig = `slot\x1e${i + 1}\x1e`
    if (e._lastQueuedSig === sig) continue
    e._lastQueuedSig = sig
    try { onToken(`${e.relayPrefix}⟦ev⟧queued\x1eslot\x1e${i + 1}\x1equeued\x1e`) } catch { /* relay 失败不影响池状态 */ }
  }
}

/**
 * ED-4（§6.10）：评审池排队补位单点——槽释放（任意族 settle 公共尾部）即按队首序补位
 * 启动（出队复检同 scope 守卫——启动时刻同 scope 已被占 ⇒ 跳过留队）。与 subagent 队列
 * 的先入者序不同：advisor 队列的阻塞仅来自 scope——被挡者不锁后入者（后入异 scope
 * 排队者可越过被挡者先启动）。启动后余项 position 重编号 + ⟦ev⟧queued 刷新。
 */
export function refillAdvisorQueue(parent, onToken) {
  // 读面经**载体吸收**（`carrierField`——§6.10 ④「出队 / 补位 / 排队刷新三读面」同式）：
  // 部分 parent（只携池 + `history`）与出队 / 排队刷新读同一容器，不 no-op。
  const queue = carrierField(parent, "_asyncAdvisorQueue")
  if (!Array.isArray(queue) || queue.length === 0) return
  const limit = advisorPoolLimitFor(parent)
  let moved = false
  for (;;) {
    let pick = -1
    for (let i = 0; i < queue.length; i++) {
      const e = queue[i]
      // §6.9 终态守卫（c1——谓词单点 entryTerminal）：终态条目永不启动（幻影唯一燃料封死）
      if (entryTerminal(e)) continue
      // 出队复检（§6.10 交互）：启动时刻同 scope 已被占 ⇒ 跳过留队（不等不排的反面面——
      // 排队者从未占过 scope；scope 占用以 running 为准）。
      if (runningAdvisorOfScope(parent, e.reviewType, e.run?.docSetKey ?? null)) continue
      pick = i
      break
    }
    if (pick < 0 || runningAdvisorCount(parent) >= limit) break
    queue.splice(pick, 1)[0].start()
    moved = true
  }
  if (!moved) return
  for (let i = 0; i < queue.length; i++) queue[i].position = i + 1
  refreshAdvisorQueuedTokens(parent, onToken)
}

/**
 * Launch an async advisor review (pool entry + background runner + settle
 * wiring — mirrors subagent-run.mjs's lifecycle, plus the ED-4 queue).
 * The runner wraps runAdvisorReview (promise → report/error) — the subagent
 * pipeline is untouched (ruling ②-2 A). The entry carries role "advisor" so the
 * digest/panel/freeze consumers route it like any other settled block.
 * @returns {{ok: true, id: string}} — ack; or {{ok: true, id: string, queued: true,
 *   position: number}} — ED-4 排队 ack（池满 + 异 scope——slot 释放自动起跑）; or
 *   {{error: string}} — scope guard (same reviewType+scope running — §11.2 F-5)
 *   or invalid ctx.
 */
export function launchAsyncAdvisor(parent, ctx, launch) {
  const { reviewType, documents, paths, object, designToken, designId, run } = launch
  const limit = advisorPoolLimitFor(parent)
  // §11.2 same-scope guard（F-5——用户裁①）：同 type+scope 有 running → 拒——与池容量
  // 守卫独立两关都过才启动——同 scope 不等不排（settled 续跑不变；排队仅异 scope 面）。
  if (runningAdvisorOfScope(parent, reviewType, run?.docSetKey ?? null)) {
    const scopeNote = reviewType === "design"
      ? "a design review of this document set is still running"
      : "a code review is still running (code reviews are a single thread — launch the next one after it settles)"
    // F31：既有稳定前缀逐字（行首）+ 标识块尾随（单源 notice.mjs）；round = 本次发起将使用的轮次号。
    const idFields = { type: reviewType, scope: scopeSummary(documents?.length ? documents : paths), round: `${(run?.round ?? 0) + 1}/uncapped`, criterion: "scope-in-flight" }
    return { error: withIdentityLine(`Advisor: 此 scope 已有评审在跑——settle 后逐个发起 — ${scopeNote}; round/prior continuation would be ambiguous while it is in flight — wait for it to settle, then launch the next review (AGENT-LOOP.md §11.2).`, idFields) }
  }
  // ED-4（AGENT-LOOP-SUBAGENT.md §6.10）：池满 + 异 scope ⇒ 排队（非拒）——ack 含 queued +
  // position；running 计数只算 running 条目（排队不占槽）。原 ②-6a 拒发退役。
  const queued = runningAdvisorCount(parent) >= limit
  parent._asyncAdvisors ??= new Map()
  // SUBAGENT-ID-COUNTER-AGENT（2026-09-09）：取号统一走 nextSubagentId——池活续号兜底 + 跨池共号（§11.2）。
  const id = nextSubagentId(parent)
  // ED-5（AGENT-LOOP-SUBAGENT.md §6.21）一次性取号令牌消费（同步配对——本函数内取号 →
  // 消费无 await 间隙）；断言通过即置 undefined（防同一令牌跨站点复用）。
  consumeSubagentToken(parent, id, "advisor launch", "advisor")
  const entry = {
    id, role: "advisor", reviewType, run,
    reviewId: run.reviewId, designId, designToken, documents, paths, object,
    launchSeq: mutationSeqOf(parent),
    docAbs: reviewType === "design" && Array.isArray(documents)
      ? documents.filter((d) => typeof d === "string").map((d) => normAbs(d, parent.cwd))
      : [],
    relayPrefix: `advisor#${id}/`,
    status: queued ? "queued" : "running", position: undefined,
    report: null, error: null, done: false, cancelled: false,
    promise: null, _settle: null,
    model: (() => { try { return resolveAdvisorProvider(parent).model ?? null } catch { return null } })(),
    startedAt: queued ? null : Date.now(), turn: 0, maxTurns: 0,
    controller: null,
  }
  // Entry controller chained to the session/run base signal (subagent-run parity):
  // Ctrl+C / session abort propagates into the review's chat; a digest's own
  // Ctrl+I must not orphan it (children hold the session signal while suspended).
  // D6 buildChildSignal 单点（ASYNC-RESULT-CONTAINER.md）。
  const ctrl = new AbortController()
  entry.controller = ctrl
  // §20.3 站点 #10（第 24 批）：hop 逐跳保 reason；#98 链结单点（interrupt 豁免面——
  // Ctrl+I 不逐链中止飞行评审）。
  bindChildController(ctrl, buildChildSignal(parent, ctx))
  entry.promise = new Promise((res) => { entry._settle = res })
  entry.start = () => {
    // ED-4（§6.10）：补位启动锚点——queued → running（position 清位）；async mark +
    // [model] 在此后发出（入队不 paint async 块——启动才 paint）。
    entry.status = "running"
    entry.position = undefined
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
  // ED-5（§6.21）入池键守卫：同 id 二次入池 = 覆写（静默丢报告 + status/cancel 错址）⇒ 抛错。
  assertPoolKeyFree(parent._asyncAdvisors, id, "advisor")
  parent._asyncAdvisors.set(String(id), entry)
  if (queued) {
    // ED-4（§6.10 排队面）：独立评审队列入队 + 排队块 token（⟦ev⟧queued——slot 面）——
    // 锚点 = 实际启动（入队不 paint async 块）；ack 如实带 queued + position。
    (parent._asyncAdvisorQueue ??= []).push(entry)
    entry.position = parent._asyncAdvisorQueue.length
    refreshAdvisorQueuedTokens(parent, ctx?.callbacks?.onToken)
    logEvent("child:spawn", { role: "advisor", id: `advisor#${id}`, kind: "async", status: "queued", ms: 0 })
    return { ok: true, id: String(id), queued: true, position: entry.position }
  }
  logEvent("child:spawn", { role: "advisor", id: `advisor#${id}`, kind: "async", status: "running", ms: 0 })
  entry.start()
  return { ok: true, id: String(id) }
}

/**
 * Close every OPEN code instance at a normal non-auto run end (finalizeAgentTurn)
 * when no review/child activity remains: a code thread that settled and whose
 * digest was consumed must not burn the convergence budget of a later task — the
 * next code review starts a fresh full review (round 1). Runs that END with a review
 * or an eng-coder child in flight keep the thread open (fix-round continuation).
 * @returns {boolean} whether any instance was closed
 */
export function closeOpenCodeAdvisorRuns(agent) {
  const advisors = getAsyncPool(agent, "advisor")
  // Any pooled advisor entry — running OR settled-not-consumed — keeps the
  // thread open: an in-run settle whose report has not reached the model (the
  // suspension sweep / digest consumes it next) must still be continuable by
  // the fix round that follows the disposition.
  if ((advisors?.size ?? 0) > 0) return false
  if ((getAsyncPool(agent, "subagent")?.size ?? 0) > 0) return false
  if ((carrierField(agent, "_pendingAsyncResults") ?? []).some((e) => e.role === "advisor")) return false
  let closed = false
  const runs = advisorRunsRead(agent)
  if (runs instanceof Map) {
    for (const r of runs.values()) {
      if (r.reviewType === "code" && r.open) { r.open = false; closed = true }
    }
  }
  return closed
}
