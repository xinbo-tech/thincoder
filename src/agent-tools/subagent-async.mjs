/**
 * subagent-async.mjs — async subagent 机械 + 共享 post-spawn 管线 + §19/§19.5 合体动作执行器
 * （AGENT-LOOP.md §19：subagent 单工具五动作 spawn/check/status/escalate/cancel——check/
 * escalate 动作执行器并入本模块；subagent.mjs 只承载 spawn 路径与工具面）。
 * 内容：resolveChildProvider / async 常量 / executeCheckAction / executeStatusAction
 * （§19.5 D-M5 可决策字段）/ executeCancelAction + cancelAsyncSubagent（§19.5 D-M6——
 * 工具与 TUI ⏹ 共用）/ executeEscalateAction / runChildPipeline + maybeRefillAsync +
 * injectAsyncResult + buildChildRunOpts + mergeChildMutations。
 */
import { isAbsolute, relative } from "node:path"
import {
  runAgent, createAgent, escapeXml, CODER_OVERLAY,
  MIN_REPORT_CHARS, REPORT_CONTINUATION, DEFAULT_SUBAGENT_TURNS,
} from "../agent.mjs"
import {
  runWithContinue, TURN_CAP_MARK, makeRelay, wrapChildCallbacks,
  ensureChildApiKey, clampEffort,
} from "../agent/spawn-child.mjs"
import { pushReal } from "../context.mjs"
import { offloadToolResult } from "../agent/helpers.mjs"
import { logEvent, errText } from "../log.mjs"

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
 * null → parent's provider unchanged.
 * API keys come from config.json only (env vars are not a key source).
 */
export function resolveChildProvider(parent, modelArg) {
  if (!modelArg) return { ...parent.provider }
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
  for (;;) {
    if (target) {
      if (target.done) break
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
    const woke = await wakeOnAsyncSettle(agent, ctx)
    if (woke === "aborted") return JSON.stringify({ done: true, stopped: true })
  }

  map.delete(String(target.id))
  // Cancelled entries are removed from the pool at their cancel — an in-flight
  // check that held the entry object observes `cancelled` and reports the same
  // unknown-id error a fresh check gets (nothing to consume; §19.5 T-M27).
  if (target.cancelled) return JSON.stringify({ id: String(target.id), status: "error", error: `unknown async subagent id: ${target.id}` })
  if (target.error) return JSON.stringify({ id: String(target.id), status: "error", error: target.error })
  return JSON.stringify({ id: String(target.id), role: target.role, status: "done", report: target.report ?? "" })
}

/**
 * subagent action:"status" (§19 D-M2, new): NON-BLOCKING async-pool query —
 * returns immediately, never consumes a result and never touches the check read
 * counter (T-M10). Source of truth = the pool (_asyncSubagents): entries moved
 * to _pendingAsyncResults during a suspension (§17 D-S3 ② — injected at the next
 * run start) are no longer in the pool and are NOT counted as done-waiting.
 * - id given → { id, role, status, model?, elapsedSec?, turn?, maxTurns?, ... } for
 *   that entry; unknown id → error (same wording as check — T12 semantics)
 * - id omitted → { overview: { running: [{id, role, model, elapsedSec, turn,
 *   maxTurns}], queued: [{id, role, position}], done: [{id, role}] } } — live
 *   queue positions (index in _asyncQueue + 1).
 * A settled-but-unconsumed entry (settled during a NORMAL turn) reports done
 * with a "not yet consumed" note — check still retrieves it afterwards.
 */
/** §19.5 D-M5 decision-field assembly (F9): running entries report
 *  {id, role, model, elapsedSec, turn, maxTurns} — the data needed to decide
 *  WHO to cancel. Model is recorded at spawn (childProvider), startedAt at
 *  ACTUAL start (queued waits don't count), turn/maxTurns mirrored from the
 *  child's ⟦ev⟧turn events at the callbacks-wrap layer (subagent.mjs tracker).
 *  elapsedSec computed at call time from startedAt. */
function statusFields(entry) {
  const base = { id: String(entry.id), role: entry.role }
  if (entry.status === "running") {
    base.model = entry.model ?? null
    base.elapsedSec = entry.startedAt ? Math.max(0, Math.floor((Date.now() - entry.startedAt) / 1000)) : 0
    base.turn = entry.turn ?? 0
    base.maxTurns = entry.maxTurns ?? 0
  }
  return base
}

export function executeStatusAction(args, ctx) {
  const agent = ctx.agent
  const map = agent._asyncSubagents ?? new Map()
  const queue = agent._asyncQueue ?? []
  const queuedPosition = (id) => {
    const i = queue.findIndex((e) => String(e.id) === id)
    return i >= 0 ? i + 1 : undefined
  }
  const { id } = args ?? {}
  if (id !== undefined && id !== null && String(id) !== "") {
    const key = String(id)
    const entry = map.get(key)
    if (!entry) {
      return JSON.stringify({ id: key, status: "error", error: `unknown async subagent id: ${key}` })
    }
    const target = statusFields(entry)
    if (entry.status === "running") return JSON.stringify({ ...target, status: "running" })
    if (entry.status === "queued") {
      return JSON.stringify({ ...target, status: "queued", position: queuedPosition(key) ?? entry.position })
    }
    // done = settled during this turn and not yet consumed — check still retrieves it
    // (§17.5: at a driven turn end it stays pooled → the suspension digest consumes it).
    target.status = "done"
    target.done = true
    if (entry.error) target.error = entry.error
    target.note = "settled, not yet consumed — retrieve via check or the suspension digest injects it"
    return JSON.stringify(target)
  }
  const overview = { running: [], queued: [], done: [] }
  for (const entry of map.values()) {
    if (entry.status === "running") overview.running.push(statusFields(entry))
    else if (entry.status === "queued") overview.queued.push({ id: String(entry.id), role: entry.role, position: queuedPosition(String(entry.id)) ?? entry.position })
    else if (entry.done) overview.done.push({ id: String(entry.id), role: entry.role })
  }
  return JSON.stringify({ overview })
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
    entry._settle?.()
    for (const w of agent._asyncWaiters?.splice(0) ?? []) { try { w() } catch { /* noop */ } }
    return { id: key, status: "cancelled", was: "queued" }
  }
  // running：标记 + 条目 abort——settle finally 跑 cancelled 分支（移除 + stopped + 提醒）
  entry.cancelled = true
  entry.controller?.abort?.()
  return { id: key, status: "cancelled" }
}

/** subagent action:"cancel" (§19.5 D-M6): depth-0 main-session control only. */
export function executeCancelAction(args, ctx) {
  if ((ctx.depth ?? 0) > 0) {
    return JSON.stringify({ status: "error", error: "cancel is only available at depth 0 — a child agent has no async pool of its own (AGENT-LOOP.md §19.5 D-M6)" })
  }
  const id = args?.id
  if (id === undefined || id === null || String(id) === "") {
    return JSON.stringify({ status: "error", error: "cancel requires the id of the async subagent to stop — omitting it would mean a blanket cancel (Ctrl+C stops everything; AGENT-LOOP.md §19.5 D-M6)" })
  }
  return JSON.stringify(cancelAsyncSubagent(ctx.agent, String(id)))
}

/**
 * subagent action:"escalate"（§19 D-M4——退役 escalate 工具语义原样，ESCALATE.md）：
 * 飞刀——交给 consultModels 池里更强模型（WRITE + 术后报告）。约束全保留：depth-0
 * only / 工程模式拒 / consultModels 空拒 / relay 前缀 `escalate#N/`（与既有前缀同名
 * ——TUI 路由零改动）/ 无 permQueue（continue 直达用户）/ mutations merge 回父。
 */
export async function executeEscalateAction(args, ctx) {
  const parent = ctx.agent
  if ((ctx.depth ?? 0) > 0) return "Error: escalate is only available at depth 0 (an escalate's work cannot be delegated again)"
  if (parent?.config?.agent?.engineering) {
    return "Error: engineering mode is ON — escalate is unavailable (it spawns a coder sub-agent, which engineering mode forbids). Use subagent with role='eng-coder' and a designToken from advisor(type='design') instead."
  }
  const pool = parent?.config?.agent?.consultModels ?? []
  if (pool.length === 0) return "Error: no escalate candidates — configure at least one consult model (agent.consultModels)"

  const { task, model } = args ?? {}
  // task 机械必填（多动作 schema 的 required 只是建议——缺 task 会以晦涩 child-run 错浮现）
  if (typeof task !== "string" || !task.trim()) {
    return "Error: escalate requires a task — the task description with goal, constraints, entry files and acceptance criteria"
  }
  const label = (m) => `${m.provider}:${m.model}`
  const wanted = typeof model === "string" ? model.replace(/\s+\([^)]*\)\s*$/, "").trim() : model
  const pick = wanted ? pool.find((m) => label(m) === wanted) : pool[0]
  if (!pick) {
    return `Error: "${model}" is not a consult candidate. Available: ${pool.map(label).join(", ")}`
  }

  let provider
  try {
    provider = resolveChildProvider(parent, `${pick.provider}:${pick.model}`)
  } catch (e) {
    return `Error: ${e.message}`
  }
  if (!ensureChildApiKey(provider)) {
    return `Error: provider "${pick.provider}" has no API key — set it in config.json before flying it in`
  }
  let effortNote = ""
  if (pick.effort && !clampEffort(provider, pick.model, pick.effort)) {
    // enum 外 effort 丢弃（preset 默认也可能对 override model 是 enum 外值）
    effortNote = ` (effort "${pick.effort}" unsupported by ${pick.model}, dropped)`
  }

  const tag = label(pick)
  const relayPrefix = makeRelay(parent, "escalate", ctx.callbacks?.onToken, provider.model ?? tag)

  // 无墙钟 watchdog——turn cap 即成本预算（2026-08-16 rationale：固定墙钟会误杀正常慢速
  // 手术；挂起防护 = FETCH_TIMEOUT_MS + 父 signal 直传）

  // 不自建 onToken（consult P2）：wrapChildCallbacks 已承担前缀 relay + D7 哨兵剥除，
  // runWithContinue 拥有 capture（stripEventTokensForCapture）——手写副本会双剥+双缓冲
  const childCallbacks = wrapChildCallbacks(relayPrefix, ctx.callbacks ?? {})

  // try 外声明：catch 也能在部分失败时 merge mutations
  let child = null
  let escErr = null // LOGGING outcome（string 形态返回 vs 异常——见下方事件点）
  const escId = relayPrefix.slice(0, -1)
  let escT0 = Date.now()
  try {
    // 全写路径（role "coder"）：权限经父 onPermissionRequest，mutations merge 回父
    child = createAgent({
      provider,
      tools: parent.tools,
      config: parent.config,
      cwd: parent.cwd,
      memory: parent.memory,
      overlay: CODER_OVERLAY,
      role: "coder",
    })
    child._logId = escId // LOGGING：子内事件归属（escalate#N）
    escT0 = Date.now()
    logEvent("child:spawn", { role: "escalate", id: escId, kind: "escalate" })
    const runner = ctx.runAgent ?? runAgent
    const runOpts = {
      depth: 1,
      maxTurns: parent.config?.agent?.subagentTurns ?? DEFAULT_SUBAGENT_TURNS, // review #7: constant, not literal (single source with subagent)
      signal: ctx.signal ?? null,
    }
    // Continue 经 runWithContinue（§7.2 D3，主会话同等 y/n 面板）：resume:true 不重注入
    // task 文本（setup 跳 input）且保留 child history + mutation 记账，刷新 turn 预算；
    // 无权限 handler（headless）或拒绝 → 部分工作返回；continue 次数无限（每轮可拒）。
    const report = await runWithContinue(
      async (childAgent, input, cbs, opts) => {
        // Merge mid-run mutations even when the run throws — the outer catch keeps
        // handling createAgent failures; AbortError still propagates (user Stop).
        try {
          return await runner(childAgent, input, cbs, opts)
        } catch (e) {
          mergeChildMutations(parent, childAgent)
          throw e
        }
      },
      child, task, { ...childCallbacks, onPermissionRequest: parent.autoApprove ? async () => true : (ctx.onPermissionRequest ?? null) },
      runOpts,
      {
        // escalate has NO permQueue: prompts go straight to the user (T-L spec).
        askContinue: (e) => (ctx.onPermissionRequest
          ? ctx.onPermissionRequest("continue", { turns: e.turn, agent: tag })
          : Promise.resolve(false)),
        onDeclined: (e, output) => `escalate (${tag}) ${TURN_CAP_MARK} (${e.turn} turns) — work may be partial; review recent_changes before deciding next steps.\nPartial output: ${output.slice(0, 2000)}`,
      },
    ).catch((e) => {
      // 非 ContinueError 运行失败：错误文本 + partial 输出（mutations 已在 runner 包装层 merge）
      if (ctx.signal?.aborted || e?.name === "AbortError") throw e
      escErr = { err: e?.message ?? String(e) } // LOGGING：错误路径（返回形态——不抛）
      return `escalate (${tag}) error: ${e?.message ?? String(e)}\nPartial output: ${(child._capturedOutput ?? "").slice(0, 2000)}`
    })
    // Escalate mutations are the parent's mutations: verify/advisor guards must see them
    mergeChildMutations(parent, child)
    if (escErr) logEvent("child:error", { role: "escalate", id: escId, ms: Date.now() - escT0, err: errText(escErr.err, 200) })
    else logEvent("child:done", { role: "escalate", id: escId, ms: Date.now() - escT0, kind: String(report).includes(TURN_CAP_MARK) ? "partial" : "ok" })
    return `escalate (${tag})${effortNote} post-op report:\n${report || (child._capturedOutput ?? "").slice(0, 4000)}${touchedFilesNote(child, parent.cwd)}`
  } catch (e) {
    // 仅 createAgent 失败/continue 询问抛出才到这（运行失败已在上面 catch 处理）
    if (child) {
      mergeChildMutations(parent, child)
      if (!escErr && !(ctx.signal?.aborted) && e?.name !== "AbortError") {
        logEvent("child:error", { role: "escalate", id: escId, ms: Date.now() - escT0, err: errText(e, 200) })
      }
    }
    if (ctx.signal?.aborted || e?.name === "AbortError") throw e
    return `escalate (${tag}) error: ${e?.message ?? String(e)}`
  }
}

/** Relative touched-file list appended to every escalate return (child paths are absolute). */
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

/** Slot-queue refill (AGENT-LOOP.md §15 D-A1/D-A6): start queue heads while a
 *  running slot is free — called from every settle (completion frees a slot) and
 *  from the turn-end collection's refill loop. Serial by construction: one slot
 *  frees per settle, one head starts per call. */
export function maybeRefillAsync(parent) {
  const queue = parent._asyncQueue ?? []
  while (queue.length > 0) {
    const running = [...(parent._asyncSubagents?.values() ?? [])].filter((e) => e.status === "running").length
    if (running >= ASYNC_SUBAGENT_LIMIT) return
    queue.shift().start()
  }
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
