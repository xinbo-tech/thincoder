/**
 * escalate-async.mjs — async 飞刀 runner (AGENT-LOOP.md §25 D-R17b — R17, 2026-09-06).
 *
 * The subagent action:"escalate" is DEFAULT-async at depth 0 (decision ③: the
 * depth-0-only escalate flips to async like every other background family;
 * `async: false` keeps the legacy synchronous flight). An async escalate runs in
 * the SHARED "other" pool domain (decision Q2 🅰 — the entry lives in
 * `_asyncSubagents` with role "escalate"/_pool "other", so it shares the 4-slot
 * other domain with explore/plan/coder spawns — capacity, queueing, refill,
 * status and cancel all come from the generic machinery):
 * - launch → ack {id, role:"escalate", status:"running"|"queued"[, position]};
 *   the turn ends naturally, the session suspends (poolLive counts the entry).
 * - settle THREE-WAY classification (review #4): done → merge-all mutations back
 *   into the parent's bookkeeping + overlap warning appended to the report
 *   (report-level, not a gate — round2 #4); error (child failure / turn cap) →
 *   partial mutations merged ONLY when the parent did not touch overlapping
 *   files since launch (overlap → no merge + differences listed in the report);
 *   cancelled → never reaches the digest stream (D-M6 — no merge, stopped
 *   reminder).
 * - the classified report lands in `_pendingEscalateResults` (independent family
 *   stream — decision ④) when the settle happens in a suspension, or stays
 *   pooled for the turn-end collection otherwise; injectAsyncResult's escalate
 *   role branch delivers the digest ("报告已 merge——可继续处置" — the action
 *   domain still follows the consuming turn's tier — no family exception).
 */
import { relative, isAbsolute } from "node:path"
import { runAgent, createAgent, CODER_OVERLAY, DEFAULT_SUBAGENT_TURNS } from "../agent.mjs"
import { runWithContinue, TURN_CAP_MARK, wrapChildCallbacks } from "../agent/spawn-child.mjs"
import { pushReal } from "../context.mjs"
import { logEvent, errText } from "../log.mjs"
import {
  mergeChildMutations, runningPoolCount, poolDomainOf, poolLimitsFor, ASYNC_POOL_LIMITS,
} from "./subagent-async.mjs"
import { maybeRefillAsync, refreshQueuedTokens } from "./subagent-scheduler.mjs"
import { mutationSeqOf } from "./advisor-async.mjs"

/** Parent-side mutations (absolute paths) committed AFTER the escalate launch —
 *  the overlap scan feeds the settle classification (review #4/round2 #4: the
 *  parent may have edited files while the flight ran). */
function parentMutationsSince(parent, launchSeq) {
  const out = []
  for (const m of parent?._mutLog ?? []) {
    if (m.seq <= (launchSeq ?? -1)) continue
    for (const p of m.paths ?? []) if (!out.includes(p)) out.push(p)
  }
  return out
}

/** Files BOTH sides touched since launch (case-insensitive key on win32 —
 *  filesOverlap precedent). */
function overlapPaths(parent, launchSeq, childTouched) {
  const since = parentMutationsSince(parent, launchSeq)
  if (since.length === 0 || !childTouched?.length) return []
  const key = (p) => (process.platform === "win32" ? String(p).toLowerCase() : String(p))
  const sinceKeys = new Set(since.map(key))
  const hits = childTouched.filter((p) => sinceKeys.has(key(p)))
  // relative display form (touchedFilesNote precedent)
  const cwd = parent?.cwd ?? process.cwd()
  return hits.map((p) => {
    const r = relative(cwd, p)
    return r && !r.startsWith("..") && !isAbsolute(r) ? r : p
  })
}

/** Escalate-side touched files, relative display (or a placeholder). */
function childTouchedDisplay(child, cwd) {
  const touched = child?._touchedFiles ?? []
  if (touched.length === 0) return "(none recorded)"
  const shown = touched.map((f) => {
    const r = relative(cwd ?? process.cwd(), f)
    return r && !r.startsWith("..") && !isAbsolute(r) ? r : f
  })
  return shown.join(", ")
}

/** Relative touched-file list (mirror of the sync path's note). */
function touchedFilesNote(child, cwd) {
  const touched = child?._touchedFiles ?? []
  if (touched.length === 0) return ""
  const shown = touched.map((f) => {
    const r = relative(cwd ?? process.cwd(), f)
    return r && !r.startsWith("..") && !isAbsolute(r) ? r : f
  })
  return `\nTouched files: ${shown.join(", ")}`
}

/**
 * Async escalate settle — three-way classification (§25 D-R17b review #4):
 *  - done: merge ALL mutations (the escalation's changes are the parent's —
 *    verify/advisor guards must see them) + overlap warning into the report
 *    (report-level hint — not a gate — round2 #4);
 *  - error (child failure / turn cap): partial mutations merge ONLY without a
 *    parent-side overlap — overlap → NO merge + differences listed (the report
 *    carries both sides so the model can decide);
 *  - cancelled: nothing merges, never reaches pending (D-M6 — stopped reminder).
 * Runs BEFORE the pending transfer / digest injection. Mutates entry.report /
 * entry.error into the FINAL digest body (the family wording rides
 * injectAsyncResult's escalate branch).
 */
export function classifyEscalateSettle(parent, entry) {
  if (entry.cancelled) return { cancelled: true }
  const child = entry.childAgent
  const touched = child?._touchedFiles ?? []
  const overlap = overlapPaths(parent, entry.launchSeq, touched)
  const hasError = entry.error != null
  const raw = hasError ? entry.error : entry.report
  if (hasError) {
    // error branch (child failure / turn cap — review #4): partial mutations
    // merge ONLY when the parent did not touch overlapping files since launch.
    // childAgent may be null when the flight died before child creation (advisor
    // 复评 🟡2——防御：无 child 即无 partial mutations——不 merge 不崩）。
    const merged = child != null && overlap.length === 0 && mergeChildMutations(parent, child)
    let decision = ""
    if (merged) {
      decision = `\nPartial changes merged into the parent's bookkeeping (no parent-side overlap since launch).`
    } else if (overlap.length > 0) {
      decision = `\nPartial changes NOT merged — the parent changed overlapping files while this escalate ran: ${overlap.join(", ")}. Escalate-side changes: ${childTouchedDisplay(child, parent?.cwd)}. Review the conflict and decide what to keep (report-level — not a gate; AGENT-LOOP.md §25 D-R17b).`
    }
    // (nothing to merge + no overlap → the plain error report stands alone)
    entry.error = `${raw}${decision}`
    entry.report = null
    return { cancelled: false, merged, overlap }
  }
  // done — merge-all + overlap warning into the report (report-level — not a gate)
  const merged = mergeChildMutations(parent, child)
  const overlapNote = overlap.length > 0
    ? `\n⚠ Overlapping writes: the parent changed ${overlap.join(", ")} while this escalate ran — mutations merged all the same; review those files before building on the report (report-level warning — not a gate; AGENT-LOOP.md §25 D-R17b round2 #4).`
    : ""
  entry.report = `${raw}${overlapNote}`
  return { cancelled: false, merged, overlap }
}

/**
 * Launch the async escalate (preflights already passed in executeEscalateAction):
 * pool admission into the shared OTHER domain → entry in `_asyncSubagents`
 * (generic queue/refill/status/cancel machinery) → ack. The flight starts on
 * entry.start() (immediately, or later via maybeRefillAsync when a slot frees).
 */
export function launchEscalateAsync(parent, ctx, launch) {
  const { task, provider, tag, effortNote } = launch
  parent._asyncSubagents ??= new Map()
  parent._asyncQueue ??= []
  // Async id allocation (AGENT-LOOP.md §15 D-A1 precedent): reserve the relay
  // counter at launch — the returned id stays stable while the entry sits queued.
  // The [model] token (TUI block creation) is DEFERRED to actual start so queued
  // flights don't paint an empty panel block (subagent-parity).
  parent._subAgentCounter = (parent._subAgentCounter ?? 0) + 1
  const relayPrefix = `escalate#${parent._subAgentCounter}/`
  const id = parent._subAgentCounter
  const entry = {
    id, role: "escalate", relayPrefix,
    _pool: poolDomainOf("escalate"), // other — shares the domain with explore/plan/coder (§24 D-24a)
    status: "queued",
    position: undefined,
    report: null, error: null, done: false, cancelled: false,
    promise: null, _settle: null, _settleSeq: 0,
    model: provider.model ?? null,
    startedAt: null,
    turn: 0, maxTurns: 0,
    controller: null,
    _files: undefined, _dependsOn: undefined,
    childAgent: null,
    tag, effortNote, launchSeq: mutationSeqOf(parent),
  }
  const limits = poolLimitsFor(parent)
  entry.status = runningPoolCount(parent, entry._pool) >= (limits[entry._pool] ?? ASYNC_POOL_LIMITS[entry._pool])
    ? "queued" : "running"
  entry.promise = new Promise((res) => { entry._settle = res })
  const ctrl = new AbortController()
  entry.controller = ctrl
  const baseSignal = parent._sessionSignal ?? ctx.signal ?? null
  if (baseSignal) {
    if (baseSignal.aborted) ctrl.abort()
    else baseSignal.addEventListener("abort", () => ctrl.abort(), { once: true })
  }
  // Turn mirror (⟦ev⟧turn from the child runAgent → entry.turn/maxTurns — status parity).
  const flight = async () => {
    entry.status = "running"
    entry.position = undefined
    entry.startedAt = Date.now()
    ctx.callbacks?.onToken?.(relayPrefix + "⟦ev⟧async\x1e")
    ctx.callbacks?.onToken?.(relayPrefix + "[model]" + (provider.model ?? ""))
    const child = createAgent({
      provider,
      tools: parent.tools,
      config: parent.config,
      cwd: parent.cwd,
      memory: parent.memory,
      overlay: CODER_OVERLAY,
      role: "coder",
    })
    entry.childAgent = child // settle 分类/status touched 摘要绑定（start 时刻）
    child._logId = relayPrefix.slice(0, -1)
    logEvent("child:spawn", { role: "escalate", id: child._logId, kind: "async", status: "running", ms: 0 })
    const childCallbacks = wrapChildCallbacks(relayPrefix, ctx.callbacks ?? {})
    const relayOnToken = childCallbacks.onToken
    if (relayOnToken) {
      childCallbacks.onToken = (t) => {
        const ev = String(t).match(/^⟦ev⟧turn\x1e(\d+)\x1e(\d+)\x1e/)
        if (ev) {
          entry.turn = Number(ev[1]) || 0
          entry.maxTurns = Number(ev[2]) || 0
        }
        return relayOnToken(t)
      }
    }
    const runner = ctx.runAgent ?? runAgent
    const runOpts = {
      depth: 1,
      maxTurns: parent.config?.agent?.subagentTurns ?? DEFAULT_SUBAGENT_TURNS,
      signal: entry.controller.signal,
    }
    // 权限按 async 子代理同款装配：AUTO 直放行；手动档经父 _permQueue（并行子代理
    // 审批不叠弹窗）——背景飞行撞门时无 handler → denied 不悬挂（D-S7 同规则）。
    const childPermission = parent.autoApprove
      ? async () => true
      : async (name, toolArgs) => {
          if (!ctx.onPermissionRequest) return false
          const ask = () => ctx.onPermissionRequest(`escalate/${name}`, toolArgs)
          parent._permQueue = (parent._permQueue ?? Promise.resolve()).then(ask, ask)
          return parent._permQueue
        }
    const report = await runWithContinue(
      (childAgent, input, cbs, opts) => runner(childAgent, input, cbs, opts),
      child, task,
      { ...childCallbacks, onPermissionRequest: childPermission },
      runOpts,
      {
        // 后台飞行不弹 continue 面板（D-A3 §15 例外同款）：AUTO && engineering 自动
        // resume——escalate 只在 normal 模式可用（engineering 拒）——恒自动拒 → partial。
        askContinue: () => Promise.resolve(Boolean(parent.config?.agent?.engineering && parent.autoApprove)),
        onDeclined: (e, output) => `escalate (${tag})${entry.effortNote} ${TURN_CAP_MARK} (${e.turn} turns) — work may be partial; review recent_changes before deciding next steps.\nPartial output: ${output.slice(0, 2000)}`,
      },
    )
    // done: compose the post-op body (the settle classification appends the
    // overlap warning / merge notes afterwards)
    return `escalate (${tag})${entry.effortNote} post-op report:\n${report || (child._capturedOutput ?? "").slice(0, 4000)}${touchedFilesNote(child, parent.cwd)}`
  }
  entry.start = () => {
    flight()
      .then((report) => {
        // Turn-cap partial (runWithContinue auto-declined) classifies as the ERROR
        // branch (design: 撞 turn cap = error — partial-merge decision applies):
        // move it to entry.error so the classification + error digest wording fire.
        if (String(report).includes(TURN_CAP_MARK)) entry.error = report
        else entry.report = report
      })
      .catch((e) => {
        // 运行失败/中止：错误文本落 entry.error（子代理同款——cancel 分支忽略它；
        // Ctrl+I 中止的残条目由收尾消化带错误文本——不落空 "(no report)" digest）。
        const child = entry.childAgent
        entry.error = `escalate (${tag}) error: ${e?.message ?? String(e)}\nPartial output: ${(child?._capturedOutput ?? "").slice(0, 2000)}`
      })
      .finally(() => {
        entry.status = "done"
        entry.done = true
        const childLogId = `${entry.role}#${entry.id}`
        const childMs = entry.startedAt ? Date.now() - entry.startedAt : 0
        const parentAborted = ctx.signal?.aborted || entry.controller?.signal?.aborted
        const capPartial = String(entry.error ?? entry.report ?? "").includes(TURN_CAP_MARK)
        if (entry.cancelled) {
          logEvent("ev:cancelled", { id: childLogId })
        } else if (!parentAborted) {
          if (entry.error != null && !capPartial) logEvent("child:error", { role: "escalate", id: childLogId, ms: childMs, err: errText(entry.error, 200) })
          else logEvent("child:done", { role: "escalate", id: childLogId, ms: childMs, kind: capPartial ? "partial" : "ok" })
          if (parent._suspended) logEvent("ev:settled", { id: childLogId, kind: "suspended" })
        }
        // Three-way settle classification (done/error/cancelled — review #4):
        // cancelled → D-M6 branch below (no pending, no merge, stopped reminder).
        if (entry.cancelled) {
          parent._asyncSubagents?.delete(String(entry.id))
          const tombstones = (parent._asyncTombstones ??= new Map())
          tombstones.set(String(entry.id), { status: "cancelled", role: "escalate" })
          ctx.callbacks?.onToken?.(`${entry.relayPrefix}⟦ev⟧stopped\x1e0\x1e0\x1estopped\x1e`)
          pushReal(parent, {
            role: "user",
            content: `[System reminder: async escalate #${entry.id} (${entry.tag}) cancelled by user — partial changes not merged/audited]`,
          })
        } else if (!parentAborted) {
          const classified = classifyEscalateSettle(parent, entry)
          // 完成信号按会话态分流（§17 D-S8 同规则）：挂起 → 移交 _pendingEscalateResults
          // （独立流——决策点 ④）+ ⟦ev⟧settled 驻留；回合内 → ⟦ev⟧done 立即冻结（条目
          // 留池——回合尾 collectSettledAsync 注入）。
          if (parent._suspended) {
            parent._pendingEscalateResults ??= []
            parent._pendingEscalateResults.push(entry)
            parent._asyncSubagents?.delete(String(entry.id))
            ctx.callbacks?.onToken?.(`${entry.relayPrefix}⟦ev⟧settled\x1e0\x1e0\x1esettled\x1e`)
          } else {
            ctx.callbacks?.onToken?.(`${entry.relayPrefix}⟦ev⟧done\x1e0\x1e0\x1edone\x1e`)
          }
          void classified
        }
        entry._settleSeq = (parent._asyncSettleSeq = (parent._asyncSettleSeq ?? 0) + 1)
        entry._settle()
        for (const w of parent._asyncWaiters?.splice(0) ?? []) { try { w() } catch { /* noop */ } }
        maybeRefillAsync(parent)
        refreshQueuedTokens(parent, ctx.callbacks?.onToken)
      })
  }
  parent._asyncSubagents.set(String(id), entry)
  logEvent("child:spawn", { role: "escalate", id: `escalate#${id}`, kind: "async", status: entry.status, ms: 0 })
  if (entry.status === "queued") {
    parent._asyncQueue.push(entry)
    entry.position = parent._asyncQueue.length
    refreshQueuedTokens(parent, ctx.callbacks?.onToken)
    return JSON.stringify({ id: String(id), role: "escalate", status: "queued", position: entry.position })
  }
  entry.start()
  return JSON.stringify({ id: String(id), role: "escalate", status: "running" })
}
