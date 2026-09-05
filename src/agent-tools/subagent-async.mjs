/**
 * subagent-async.mjs — async subagent 机械 + 共享 post-spawn 管线 + check/cancel 动作执行器
 * （AGENT-LOOP.md §19：subagent 单工具六动作 spawn/check/status/escalate/cancel/panel——
 * spawn 路径与工具面在 subagent.mjs；check/cancel 动作执行器与机械、管线在本模块）。
 * 内容：resolveChildProvider / async 常量（ASYNC_SUBAGENT_LIMIT/MAX_ASYNC_CHECKS）/
 * executeCheckAction / executeCancelAction + cancelAsyncSubagent（§19.5 D-M6——工具与
 * TUI ⏹ 共用）/ runChildPipeline / injectAsyncResult / buildChildRunOpts / mergeChildMutations。
 * 拆分（2026-09-05——Module Split Policy §20.9——纯迁移零行为变化）：§20 调度器 + 文件域
 * 组 → ./subagent-scheduler.mjs（尾部 re-export 保测试动态 import 面——queueRunnable/
 * describeBlockers）；status/panel/escalate 动作执行器 → ./subagent-actions.mjs。
 */
import {
  runAgent, escapeXml,
  MIN_REPORT_CHARS, REPORT_CONTINUATION, DEFAULT_SUBAGENT_TURNS,
} from "../agent.mjs"
import { runWithContinue, TURN_CAP_MARK } from "../agent/spawn-child.mjs"
import { pushReal } from "../context.mjs"
import { offloadToolResult } from "../agent/helpers.mjs"
import {
  describeBlockers, dependentLabels, detectStall, maybeRefillAsync, refreshQueuedTokens, STALL_NOTE,
} from "./subagent-scheduler.mjs"

// Async subagent limits (AGENT-LOOP.md §15 D-A4): mechanical concurrency cap for
// background spawns + the per-turn check budget (consult-style loop guard).
export const ASYNC_SUBAGENT_LIMIT = 4
export const MAX_ASYNC_CHECKS = 3

/**
 * Resolve the sub-agent's provider from a model override string (shared with the
 * VS Code port). Forms accepted:
 *   "provider:model"  → the named provider with the named model
 *   "provider"        → the named provider's configured model
 *   "model"           → same provider as the parent, different model
 *   "default"         → same as null: the parent's provider unchanged (explicit
 *                       "use the default model" — 2026-09-05 user ruling; matched
 *                       case-insensitively — parser-layer alias guard)
 * null → parent's provider unchanged.
 * API keys come from config.json only (env vars are not a key source).
 */
export function resolveChildProvider(parent, modelArg) {
  if (!modelArg) return { ...parent.provider }
  // "default" alias (2026-09-05 user ruling — ARCHITECTURE.md 子 agent 模型指定):
  // the literal "default", matched case-insensitively, declares "no override →
  // inherit the default model" — equivalent to null/omission (parent provider
  // unchanged). Checked BEFORE the provider-name lookup so the alias is reserved
  // (≡ omission — providers are not consulted) and never falls through to the
  // model-name swap branch. Any other single-segment value keeps the legacy
  // semantics below.
  if (String(modelArg).toLowerCase() === "default") return { ...parent.provider }
  const providers = parent.config?.providersList ?? []
  const withKey = (p) => (p.apiKey?.trim() ? { ...p, apiKey: p.apiKey.trim() } : { ...p })
  if (modelArg.includes(":")) {
    const [pname, mname] = modelArg.split(":")
    const p = providers.find((x) => x.name === pname)
    if (!p) throw new Error(`subagent model: unknown provider "${pname}" (available: ${providers.map((x) => x.name).join(", ") || "none"})`)
    return { ...withKey(p), model: mname || p.model }
  }
  const byName = providers.find((x) => x.name === modelArg)
  if (byName) return withKey(byName)
  return { ...parent.provider, model: modelArg }
}

/** Wait for an async entry to settle (or the parent signal to abort), parked on
 *  the agent's waiter list — the entry settle finally wakes every waiter (same
 *  pattern as consult_check's session waiters). Returns "aborted" on signal. */
function wakeOnAsyncSettle(agent, ctx) {
  return new Promise((resolve) => {
    const cleanup = () => {
      const i = (agent._asyncWaiters ?? []).indexOf(w)
      if (i >= 0) agent._asyncWaiters.splice(i, 1)
      ctx.signal?.removeEventListener("abort", onAbort)
    }
    const w = () => { cleanup(); resolve("settled") }
    const onAbort = () => { cleanup(); resolve("aborted") }
    ;(agent._asyncWaiters ??= []).push(w)
    if (ctx.signal) {
      if (ctx.signal.aborted) { onAbort(); return }
      ctx.signal.addEventListener("abort", onAbort, { once: true })
    }
  })
}

/**
 * subagent action:"check" (§19 — the retired subagent_check's semantics verbatim,
 * AGENT-LOOP.md §15 D-A2): fetch async subagent results.
 * - id omitted → the next completed child in ARRIVAL order (first finished first)
 * - id given → block until THAT child finishes (queued items wait for their start)
 * - n (required) → 1-based read counter, strictly incrementing per run (loop
 *   guard); capped at MAX_ASYNC_CHECKS per turn — beyond that, use the turn-end
 *   auto-wait. Errors never consume results.
 * Consumed entries are deleted from the map — a re-check of the same id is the
 * same "unknown async subagent id" error (T12).
 */
export async function executeCheckAction(args, ctx) {
  const agent = ctx.agent
  const map = agent._asyncSubagents ?? new Map()
  const { id, n } = args ?? {}
  // Strict 1-based incrementing read counter (D-A2, review #1): out-of-order /
  // repeated n is rejected WITHOUT consuming a result (T14).
  const lastN = agent._asyncCheckLastN ?? 0
  if (!Number.isInteger(n) || n !== lastN + 1) {
    return JSON.stringify({ status: "error", error: "invalid read counter — pass n = lastN+1" })
  }
  if (n > MAX_ASYNC_CHECKS) {
    return JSON.stringify({ status: "error", error: "check limit exceeded — use turn-end auto-wait for the rest" })
  }
  agent._asyncCheckLastN = n

  let target = null
  if (id !== undefined && id !== null && String(id) !== "") {
    target = map.get(String(id))
    // Unknown OR already-consumed ids (consumed entries are deleted) — same error (T12).
    if (!target) return JSON.stringify({ id: String(id), status: "error", error: `unknown async subagent id: ${id}` })
  }

  // Block until the target settles (specific id / next completed in arrival order).
  // §20（advisor code review 🟡 处置）：不可启动的 queued 条目会让阻塞等待永久悬挂
  // （check 是同步工具调用——模型回合被钉死——仅 Ctrl+C 可解）。补位（refill）只由
  // settle/cancel/spawn 事件驱动：**池内无 running 条目 = 无未来 settle 事件 = queued
  // 条目永不启动**（槽满等位的 slot 条目在 running 归零时已被最后一次 settle 的 refill
  // 启动——此时仍 queued 者必为不可启动：depc 锁定或阻塞源本身不可启动）。
  for (;;) {
    if (target) {
      if (target.done) break
      // 守卫 ①（target 级）：queued 目标在无 running 池中不可启动 → 立即返回（无论
      // wait/depc——阻塞源链底为 depc 的 wait 条目同样无 settle 可期）。
      if (target.status === "queued" && !target.cancelled) {
        const blk = describeBlockers(agent, target)
        if (blk.kind === "depc") {
          return JSON.stringify({
            id: String(target.id), status: "queued", waiting: "dependency-cancelled",
            reason: blk.detail,
            note: "check would block forever — this task is locked by a cancelled/failed dependency and will not start on its own; cancel it (action:'cancel') or run an AUTO session to release it (AGENT-LOOP.md §20 round2 #3)",
          })
        }
        if (![...map.values()].some((e) => e.status === "running")) {
          const qi = (agent._asyncQueue ?? []).indexOf(target)
          const out = { id: String(target.id), status: "queued", position: qi >= 0 ? qi + 1 : undefined }
          if (blk.detail) out.reason = blk.detail
          // §21.1 P-SL2（D-SL2）：停滞机械检测——目标处于不可自行解除的等待闭包（无
          // running + 每 queued 的 blocker 均闭包内 + 无 depc）→ 明确报错列本任务
          // 阻塞链 + 引导 cancel 破环重派（F-SL2——非静默）；不满足停滞判据的形态
          // （单 queued/depc 滞留/外逃 blocker）维持下方原守卫文本——零行为变化。
          const stall = detectStall(agent)
          if (stall) {
            const chain = stall.chains.find((c) => c.task === target)?.text ?? stall.chains[0]?.text
            out.stall = true
            out.note = `scheduler stall — the queued tasks block each other in a closed wait loop that can never settle on its own:\n${chain}\n${STALL_NOTE}`
          } else {
            out.note = "check would block indefinitely — this queued task cannot start while the pool has no running task (starts are settle-driven); cancel it (action:'cancel') or make pool progress (AUTO session starts it on the next settle/refill)"
          }
          return JSON.stringify(out)
        }
      }
      const woke = await wakeOnAsyncSettle(agent, ctx)
      if (woke === "aborted") return JSON.stringify({ done: true, stopped: true })
      continue
    }
    const completed = [...map.values()].filter((e) => e.done)
    if (completed.length > 0) {
      target = completed.sort((a, b) => (a._settleSeq ?? 0) - (b._settleSeq ?? 0))[0]
      break
    }
    if (map.size === 0) return JSON.stringify({ done: true })
    // 守卫 ②（arrival-order）：池内无 running（completed 已空 → 无 done）且仍有条目 →
    // 全为 queued 且永不启动 → 立即返回明确错误（防无界悬挂——补 cancel 引导）。
    if (![...map.values()].some((e) => e.status === "running")) {
      // §21.1 P-SL2（D-SL2）：停滞机械检测——全 queued 且每 blocker 闭包内（无 depc 等
      // 外部可解形态）→ 明确错误逐条列阻塞链（F-SL2——列链 + 引导 cancel 破环重派）；
      // 不满足停滞判据的形态（单 queued/depc 滞留/外逃 blocker）维持原守卫文本——零变化。
      const stall = detectStall(agent)
      if (stall) {
        return JSON.stringify({
          status: "error",
          error: `scheduler stall — the pool holds only queued tasks that block each other in closed wait loops; nothing can ever settle on its own:\n${stall.chains.map((c) => c.text).join("\n")}\n${STALL_NOTE}`,
        })
      }
      const stuck = [...map.values()]
        .map((e) => `${e.role}#${e.id}（${describeBlockers(agent, e).kind === "depc" ? "dependency-cancelled" : "blocked"}）`)
        .join(", ")
      return JSON.stringify({
        status: "error",
        error: `nothing will settle — the pool holds only queued task(s) that cannot start without a running task: ${stuck}; cancel them (action:'cancel') or make pool progress (AUTO session starts them on the next settle/refill)`,
      })
    }
    const woke = await wakeOnAsyncSettle(agent, ctx)
    if (woke === "aborted") return JSON.stringify({ done: true, stopped: true })
  }

  map.delete(String(target.id))
  // §20（advisor code review 🟡 处置）：check 消费与挂起期 settle 的竞态——settle 在挂起
  // 分支先把条目移交 _pendingAsyncResults（本 check 在途等待期间发生——digest 回合）——
  // 消费时若条目已被移入 pending，反向清除（两消费点互斥——防下轮 prepareRun 重复注入
  // ——D-S3"只注入一次"不变式——同一报告双送达违例）。
  const pend = agent._pendingAsyncResults
  if (Array.isArray(pend)) {
    const pendIdx = pend.findIndex((x) => String(x.id) === String(target.id))
    if (pendIdx >= 0) pend.splice(pendIdx, 1)
  }
  // §20 D-SD5 终态墓碑（T-SD14）：消费即终态——dependsOn 引用该 id 的条目视其终态
  // 满足/标注（consumed-ok = 已满足；failed/cancelled = 依赖取消/失败分支）。写于
  // 观察 cancelled/error 之后——取消/失败条目不被误记 consumed。
  if (target.cancelled) {
    const tombstones = (agent._asyncTombstones ??= new Map())
    tombstones.set(String(target.id), { status: "cancelled", role: target.role })
    // Cancelled entries are removed from the pool at their cancel — an in-flight
    // check that held the entry object observes `cancelled` and reports the same
    // unknown-id error a fresh check gets (nothing to consume; §19.5 T-M27).
    return JSON.stringify({ id: String(target.id), status: "error", error: `unknown async subagent id: ${target.id}` })
  }
  const tombstones = (agent._asyncTombstones ??= new Map())
  tombstones.set(String(target.id), { status: target.error ? "failed" : "consumed", role: target.role })
  if (target.error) return JSON.stringify({ id: String(target.id), status: "error", error: target.error })
  return JSON.stringify({ id: String(target.id), role: target.role, status: "done", report: target.report ?? "" })
}

/**
 * §19.5 D-M6 cancel 核心（工具路径与 TUI ⏹ 共用）：定向中止单个后台子代理，id 必填。
 * - queued 目标（未启动无 controller）：出队 + 后续 position 前移 + settle waiter
 *   → { id, status:"cancelled", was:"queued" }——无 abort（T-M27）
 * - running 目标：置 entry.cancelled + 条目 controller abort（child runAgent signal）
 *   → settle finally 跑 cancelled 分支（⟦ev⟧stopped 冻结 + 模型提醒；不入 pending/
 *   不直注入）→ { id, status:"cancelled" }（T-M19）
 * - 未知/已完成 id → error（T-M20）；重复 cancel 幂等（abort 已在途）
 */
export function cancelAsyncSubagent(agent, id) {
  const key = String(id)
  const map = agent._asyncSubagents ?? new Map()
  const entry = map.get(key)
  if (!entry) {
    return { id: key, status: "error", error: `unknown async subagent id: ${key}` }
  }
  if (entry.done) {
    return { id: key, status: "error", error: `async subagent #${key} has already finished — nothing to cancel` }
  }
  if (entry.cancelled) return { id: key, status: "cancelled" } // abort already in flight — idempotent
  if (entry.status === "queued") {
    // 出队 + position 释放/前移；settle 使在途 check waiter 终止（观察 cancelled）
    const queue = agent._asyncQueue ?? []
    const qi = queue.indexOf(entry)
    if (qi >= 0) {
      queue.splice(qi, 1)
      for (let i = 0; i < queue.length; i++) queue[i].position = i + 1
    }
    entry.cancelled = true
    entry.done = true
    entry.status = "done"
    map.delete(key)
    // §20 D-SD5 终态墓碑：queued 取消（无 settle 事件——出队即终态）——依赖者经
    // 墓碑查得 cancelled 分支（round1 #4——cancel 返回时即重估标注）。
    const tombstones = (agent._asyncTombstones ??= new Map())
    tombstones.set(key, { status: "cancelled", role: entry.role })
    entry._settle?.()
    for (const w of agent._asyncWaiters?.splice(0) ?? []) { try { w() } catch { /* noop */ } }
    return { id: key, status: "cancelled", was: "queued" }
  }
  // running：标记 + 条目 abort——settle finally 跑 cancelled 分支（移除 + stopped + 提醒）
  entry.cancelled = true
  entry.controller?.abort?.()
  return { id: key, status: "cancelled" }
}

/** subagent action:"cancel" (§19.5 D-M6): depth-0 main-session control only.
 *  §20 D-SD5/round1 #4（queued 依赖取消——无 settle 事件）：出队后**返回即**重估
 *  依赖者——依赖者留 queued 标 dependency cancelled（refreshQueuedTokens 发更新块头
 *  token）+ 工具结果内注依赖者（模型可见——工具结果内——round1 #4 明示通道）+ 补位
 *  （AUTO 档依赖者自动启动/槽位竞态释放）。被取消条目自身发 ⟦ev⟧cancelled 移除等待块。 */
export function executeCancelAction(args, ctx) {
  if ((ctx.depth ?? 0) > 0) {
    return JSON.stringify({ status: "error", error: "cancel is only available at depth 0 — a child agent has no async pool of its own (AGENT-LOOP.md §19.5 D-M6)" })
  }
  const id = args?.id
  if (id === undefined || id === null || String(id) === "") {
    return JSON.stringify({ status: "error", error: "cancel requires the id of the async subagent to stop — omitting it would mean a blanket cancel (Ctrl+C stops everything; AGENT-LOOP.md §19.5 D-M6)" })
  }
  const key = String(id)
  const agent = ctx.agent
  const entry = agent._asyncSubagents?.get(key)
  const wasQueued = entry?.status === "queued"
  // 依赖者快照（出队前——用于 AUTO 分支判定"是否有依赖者被本次取消波及"；note 组装在
  // refill 后按**仍 queued** 的实况重算——防 AUTO 已自动启动后文案称 "stay queued"）
  const hadDependents = entry ? dependentLabels(agent, key).length > 0 : false
  const result = cancelAsyncSubagent(agent, key)
  if (wasQueued && result.status === "cancelled" && result.was === "queued" && entry) {
    // §20 D-SD3b：取消/出队 → 移除等待块（不冻结——TUI routeSubToken cancelled 分支）
    ctx.callbacks?.onToken?.(`${entry.relayPrefix}⟦ev⟧cancelled\x1e`)
    // 依赖者标注 + 位置前移 + AUTO 自动启动（round2 #3：AUTO 档才启动——手动留 queued）
    maybeRefillAsync(agent)
    refreshQueuedTokens(agent, ctx.callbacks?.onToken)
    if (hadDependents) {
      // refill 后重算——AUTO 下依赖者已启动者不再列（文案与实际状态一致——code review 🔵）
      const dependents = dependentLabels(agent, key)
      if (dependents.length > 0) {
        result.dependents = dependents
        result.note = `queued dependents ${dependents.join(", ")} marked "dependency cancelled" — they stay queued until you cancel them (this action again with their id) or an AUTO session starts them (AGENT-LOOP.md §20 D-SD5)`
      } else if (agent.autoApprove) {
        result.note = `dependents of the cancelled task auto-started (AUTO session — round2 #3: an AUTO session starts dependency-cancelled dependents on slot availability)`
      }
    }
  }
  return JSON.stringify(result)
}

/**
 * 共享 post-spawn 管线（阻塞与 async 同一条——§15 D-A1 "全不变"）：turn-cap continue
 * 循环 → 拒绝降级 partial 返回 → MIN_REPORT_CHARS 扩写 → eng-coder mutation merge →
 * designId 后缀。onDeclined 在此（两路同一形态）——只有 askContinue 不同：阻塞经权限
 * 面板询问；async 永不弹面板（自动拒绝；engineering && AUTO 自动 resume——§15 D-A3）。
 */
export async function runChildPipeline(child, input, childOpts, childRunOpts, { parent, role, args, askContinue }) {
  const declined = { partial: null }
  let report = await runWithContinue(
    (child, input, cbs, opts) => runAgent(child, input, cbs, opts), // opts = childRunOpts + resume (由管线管理)
    child, input, childOpts, childRunOpts,
    {
      askContinue,
      onDeclined: (e, output) => {
        if (role === "eng-coder" && child._mutatedThisRun) mergeChildMutations(parent, child)
        // 拒绝 = 早退语义：不带 MIN_REPORT_CHARS 扩写（对已 cap 的 child 追问长报告是错的）；
        // review #2：用管线捕获的 output（此时 report 仍 ""——runWithContinue 未返回）
        declined.partial = `Subagent (${role}) ${TURN_CAP_MARK} (${e.turn} turns) — work may be partial; review recent_changes before deciding next steps.\nPartial output: ${output || ""}`
      },
    },
  )
  if (declined.partial !== null) {
    // 被拒的 eng-coder 交付仍带 designId（fix round 以同 slot 重 spawn——2026-09-01）
    if (role === "eng-coder") declined.partial += `\ndesignId: ${args.designId ?? "(single-design session — designId optional)"} — reuse it (with the same designToken) when re-spawning this eng-coder.`
    return declined.partial
  }

  // 报告过短 = 交接不完整：送回扩写一次（kimi-code summaryPolicy: min 200 chars 同源）
  if (report.length < MIN_REPORT_CHARS) {
    report = await runAgent(child, REPORT_CONTINUATION, childOpts, childRunOpts)
  }

  // 工程模式机械码门：委托的文件改动不得绕过父侧 advisor/verify guard——eng-coder ONLY
  // 有意为之（review #8）：普通 coder 自带自评纪律；normal 模式无父侧 gate 可喂。
  // 只在实际 mutated 时 merge（防 runAgent 写前抛错时传播空 mutation 声明——纵深防御）
  if (role === "eng-coder" && child._mutatedThisRun) {
    mergeChildMutations(parent, child)
  }

  // designId 随交付报告（2026-09-01）：divergence audit fix round 用同一 designId+token 重 spawn
  if (role === "eng-coder") {
    report += `\ndesignId: ${args.designId ?? "(single-design session — designId optional)"} — reuse this designId with the same designToken (from the approved advisor type='design' review) when re-spawning this eng-coder for an audit fix round.`
  }

  return report
}

/**
 * Inject one settled async entry into the parent history as a user-role reminder
 * (§17 D-S3 — single shared form for BOTH consumption points: turn-end collection
 * (collectSettledAsync, agent.mjs) and the run-start _pendingAsyncResults injection;
 * the message shape is identical to the §15 collector's). Consumed = the caller
 * removes the entry from its container; no double-inject across the two paths.
 */
export async function injectAsyncResult(agent, entry) {
  const body = entry.error ?? entry.report ?? "(no report)"
  const preview = await offloadToolResult(String(body), `async-subagent-${entry.id}`)
  pushReal(agent, {
    role: "user",
    content: `[System reminder: async subagent #${entry.id} (${entry.role}) finished]\n${escapeXml(preview)}`,
  })
  // §20 D-SD5 终态墓碑：本函数是全部自动注入路径的共享形态（回合尾 collect + 挂起
  // digest 首行注入）——注入即消费（调用方随即从容器移除）——dependsOn 引用该 id 的
  // 后续 spawn 视为已满足（T-SD14 同 check 消费语义；error 条目记 failed——依赖取消/
  // 失败分支照旧，不误标成功）。
  const tombstones = (agent._asyncTombstones ??= new Map())
  tombstones.set(String(entry.id), { status: entry.error != null ? "failed" : "consumed", role: entry.role })
}

/**
 * Child agent run options — the parent's abort signal MUST propagate to the
 * child: without it, Ctrl+C aborts the parent's controller but the child keeps
 * running its full turn budget (up to subagentTurns) while the parent awaits —
 * the interrupt appears to do nothing.
 * §17 D-S9: during a suspension session children share the SESSION signal instead
 * (agent._sessionSignal) — a digest's own Ctrl+I/Ctrl+C must not abort the whole
 * pool; the session driver aborts the session controller to stop everything.
 */
export function buildChildRunOpts(ctx) {
  return {
    depth: (ctx.depth ?? 0) + 1,
    maxTurns: ctx.agent?.config?.agent?.subagentTurns ?? DEFAULT_SUBAGENT_TURNS,
    signal: ctx.agent?._sessionSignal ?? ctx.signal ?? null,
  }
}

/**
 * Merge an eng-coder child's mutations into the parent agent's bookkeeping.
 * The parent must stay aware of delegated file changes: `_touchedFiles` enables
 * the advisor guard (completion.mjs) to detect that code was modified and
 * pushback for review. Prior verify/advisor state is invalidated because it
 * judged an older state.
 *
 * `_advisorRound` is NOT reset: merged code enters the CURRENT convergence
 * cycle. Resetting here would break the review→fix→re-review loop (the parent
 * reviews, spawns an eng-coder to fix, merges, reviews again — every merge
 * would restart at round 1 and the 5-round cap could never be reached).
 * `_calledAdvisorThisRun` IS cleared so the merged code triggers a fresh
 * advisor call (the guard demands review of new mutations).
 *
 * Returns true when mutations were merged (kept for future caller checks).
 */
export function mergeChildMutations(parent, child) {
  // A child claiming mutations without any touched file is a misbehaving
  // child (or a bookkeeping bug) — do not propagate an empty mutation claim
  // to the parent's guard state.
  if (!child._mutatedThisRun || !(child._touchedFiles?.length)) return false
  parent._mutatedThisRun = true
  for (const abs of child._touchedFiles ?? []) {
    if (!parent._touchedFiles.includes(abs)) parent._touchedFiles.push(abs)
  }
  if (parent._calledAdvisorThisRun) parent._calledAdvisorThisRun = false
  if (parent._verifiedThisRun) {
    parent._verifiedThisRun = false
    parent._verifyPassed = undefined
  }
  // Stale session cleanup only — the round counter survives (see above).
  parent._advisorSession = null
  return true
}

// Re-export shim (2026-09-05 拆分轮): §20 调度符号迁至 ./subagent-scheduler.mjs——本面
// 保留供 test/subagent-scheduler.test.mjs 动态 import（测试零改动——freeze.mjs 同款转发链）。
export { queueRunnable, describeBlockers } from "./subagent-scheduler.mjs"
