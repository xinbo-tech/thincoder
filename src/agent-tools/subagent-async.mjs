/**
 * subagent-async.mjs — async subagent 机械 + 共享 post-spawn 管线 + §19 合体动作执行器
 * （AGENT-LOOP.md §19：subagent 单工具四动作 spawn/check/status/escalate——消费侧
 * subagent-check.mjs 与 escalate.mjs 退役，check/status/escalate 动作执行器并入本模块，
 * subagent.mjs 保持 500 行硬限内只承载 spawn 路径与工具面）。
 *
 * 内容：
 * - resolveChildProvider：子代理 provider 解析（原 subagent.mjs——spawn 与 escalate
 *   动作共用，故随 escalate 并入）
 * - async 常量（§15 D-A4）：ASYNC_SUBAGENT_LIMIT（槽位机械上限）与 MAX_ASYNC_CHECKS
 *   （check 动作 per-turn 检查预算）
 * - executeCheckAction：§19 check 动作 = 原 subagent_check 语义原样（arrival order /
 *   指定 id 阻塞 / n 计数 / MAX_ASYNC_CHECKS / 消费后删除——T-M2..M4 迁移回归）
 * - executeStatusAction：§19 status 动作（新增——非阻塞只读池查询，不消费不计数）
 * - executeEscalateAction：§19 escalate 动作 = 原飞刀语义原样（ESCALATE.md——depth-0
 *   only / 工程模式拒 / consultModels 空拒 / relay 前缀 escalate#N/——T-M14..M16 迁移回归）
 * - runChildPipeline / maybeRefillAsync / injectAsyncResult / buildChildRunOpts /
 *   mergeChildMutations：run 管线支撑（导出经 subagent.mjs re-export shim 等价保留）
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
  if (target.error) return JSON.stringify({ id: String(target.id), status: "error", error: target.error })
  return JSON.stringify({ id: String(target.id), role: target.role, status: "done", report: target.report ?? "" })
}

/**
 * subagent action:"status" (§19 D-M2, new): NON-BLOCKING async-pool query —
 * returns immediately, never consumes a result and never touches the check read
 * counter (T-M10). Source of truth = the pool (_asyncSubagents): entries moved
 * to _pendingAsyncResults during a suspension (§17 D-S3 ② — injected at the next
 * run start) are no longer in the pool and are NOT counted as done-waiting.
 * - id given → { id, role, status, ... } for that entry; unknown id → error
 *   (same wording as check — T12 semantics)
 * - id omitted → { overview: { running: [ids], queued: [{id, position}],
 *   done: [ids] } } — live queue positions (index in _asyncQueue + 1).
 * A settled-but-unconsumed entry (settled during a NORMAL turn) reports done
 * with a "not yet consumed" note — check still retrieves it afterwards.
 */
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
    if (entry.status === "running") return JSON.stringify({ id: key, role: entry.role, status: "running" })
    if (entry.status === "queued") {
      return JSON.stringify({ id: key, role: entry.role, status: "queued", position: queuedPosition(key) ?? entry.position })
    }
    // done = settled during this turn and not yet consumed — check still retrieves it.
    const target = { id: key, role: entry.role, status: "done", done: true }
    if (entry.error) target.error = entry.error
    target.note = "settled, not yet consumed — retrieve via check or the turn-end auto-wait injects it"
    return JSON.stringify(target)
  }
  const overview = { running: [], queued: [], done: [] }
  for (const entry of map.values()) {
    if (entry.status === "running") overview.running.push(String(entry.id))
    else if (entry.status === "queued") overview.queued.push({ id: String(entry.id), position: queuedPosition(String(entry.id)) ?? entry.position })
    else if (entry.done) overview.done.push(String(entry.id))
  }
  return JSON.stringify({ overview })
}

/**
 * subagent action:"escalate" (§19 D-M4 — the retired escalate tool's semantics
 * verbatim, docs/design/ESCALATE.md): 飞刀 — hand an implementation task to a
 * STRONGER model (a consultModels candidate) which gets WRITE access and does
 * the work itself, then returns a post-op report. All legacy constraints are
 * preserved: depth-0 only, engineering mode fail-closed, empty consultModels
 * error, model pick validation, relay prefix `escalate#N/` (the action name and
 * the legacy prefix match — TUI routing is untouched), NO permQueue (continue
 * prompts go straight to the user), mutations merge into the parent.
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
  // Escalate requires the task brief (schema `required` is advisory in the
  // multi-action schema) — an absent task would otherwise flow downstream as
  // `content: undefined` and surface as an obscure child-run error.
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
    // Out-of-enum effort dropped (see clampEffort): the provider preset default may ALSO be
    // out-of-enum for this override model — e.g. qwenplan preset default "high" is
    // invalid for qwen3.8-max, enum xhigh/medium/low.
    effortNote = ` (effort "${pick.effort}" unsupported by ${pick.model}, dropped)`
  }

  const tag = label(pick)
  const relayPrefix = makeRelay(parent, "escalate", ctx.callbacks?.onToken, provider.model ?? tag)
  // Report the escalated model to the display layer (it may differ from the parent's)
  // — makeRelay already emitted the `[model]` metadata token above.

  // No wall-clock watchdog — turn cap only, exactly like subagent (the verified write
  // path). Rationale (2026-08-16): a fixed wall-clock aborts NORMAL-but-slow surgery —
  // two max-effort consultants hit a 10min wall just READING files. Hang protection is
  // already covered by FETCH_TIMEOUT_MS (per LLM call) and the user's Stop (parent
  // signal propagates directly below). maxTurns is the cost budget; hitting it asks
  // the user whether to continue (main-agent parity), falling back to partial work.

  // No custom onToken here (consult P2, 2026-08-30): wrapChildCallbacks already
  // applies the prefixed relay + D7 sentinel strip for the display path, and
  // runWithContinue owns the capture (stripEventTokensForCapture) for the
  // partial-output return — a hand-rolled duplicate ran the strip twice and
  // maintained a second output buffer.
  const childCallbacks = wrapChildCallbacks(relayPrefix, ctx.callbacks ?? {})

  // Declared outside try so the catch can merge mutations even on a partial failure.
  let child = null
  try {
    // Full write path (role "coder"): permission gate via the parent's onPermissionRequest,
    // recent-changes tracking, mutations merge into the parent below.
    child = createAgent({
      provider,
      tools: parent.tools,
      config: parent.config,
      cwd: parent.cwd,
      memory: parent.memory,
      overlay: CODER_OVERLAY,
      role: "coder",
    })
    const runner = ctx.runAgent ?? runAgent
    const runOpts = {
      depth: 1,
      maxTurns: parent.config?.agent?.subagentTurns ?? DEFAULT_SUBAGENT_TURNS, // review #7: constant, not literal (single source with subagent)
      signal: ctx.signal ?? null,
    }
    // Turn-cap continue via runWithContinue (§7.2 D3), main-agent parity (tui/agent-turn.mjs):
    // when the child hits ContinueError, ask the user through the SAME channel as child
    // write approval (ctx.onPermissionRequest). The name "continue" renders the TUI's
    // dedicated y/n Continue panel. The resumed run passes resume:true, so runAgent does
    // NOT re-inject the task text (setup.mjs skips input on resume) and keeps the child's
    // history + mutation bookkeeping, with a fresh maxTurns budget per run. No permission
    // handler (headless) or a declined prompt falls through to the partial-work return.
    // Continues are UNLIMITED — the user can decline at any prompt.
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
      // Generic run failure (not ContinueError): match the original loop's return shape —
      // error text + partial output, mutations already merged in the runner wrapper.
      if (ctx.signal?.aborted || e?.name === "AbortError") throw e
      return `escalate (${tag}) error: ${e?.message ?? String(e)}\nPartial output: ${(child._capturedOutput ?? "").slice(0, 2000)}`
    })
    // Escalate mutations are the parent's mutations: verify/advisor guards must see them
    mergeChildMutations(parent, child)
    return `escalate (${tag})${effortNote} post-op report:\n${report || (child._capturedOutput ?? "").slice(0, 4000)}${touchedFilesNote(child, parent.cwd)}`
  } catch (e) {
    // Reached only when createAgent itself fails or the continue prompt throws —
    // run failures are handled above (mutations merge inside the runner wrapper).
    if (child) mergeChildMutations(parent, child)
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
 * Shared post-spawn pipeline (blocking AND async — AGENT-LOOP.md §15 D-A1: the
 * async branch reuses the exact same spawn-child pipeline, "全不变"):
 * turn-cap continue loop → declined partial-work return → MIN_REPORT_CHARS
 * expansion → eng-coder mutation merge → designId suffix. Returns the report.
 * onDeclined lives here (identical for both paths) — only askContinue differs:
 * blocking asks the user via the permission panel; async NEVER pops a panel —
 * auto-declines except engineering && AUTO, which auto-resumes (§15 D-A3).
 */
export async function runChildPipeline(child, input, childOpts, childRunOpts, { parent, role, args, askContinue }) {
  const declined = { partial: null }
  let report = await runWithContinue(
    (child, input, cbs, opts) => runAgent(child, input, cbs, opts), // opts = childRunOpts + resume (managed by the pipeline)
    child, input, childOpts, childRunOpts,
    {
      askContinue,
      onDeclined: (e, output) => {
        if (role === "eng-coder" && child._mutatedThisRun) mergeChildMutations(parent, child)
        // Early return semantics (unchanged from the inline loop): the declined
        // partial-work message is returned WITHOUT the MIN_REPORT_CHARS expansion —
        // re-prompting a capped child for a longer report is wrong.
        // Review #2 fix: use the pipeline-captured output (the `report` variable is
        // still "" at this point — runWithContinue hasn't returned yet).
        declined.partial = `Subagent (${role}) ${TURN_CAP_MARK} (${e.turn} turns) — work may be partial; review recent_changes before deciding next steps.\nPartial output: ${output || ""}`
      },
    },
  )
  if (declined.partial !== null) {
    // declined eng-coder delivery still carries its designId — the fix round
    // re-spawns with the same slot (2026-09-01).
    if (role === "eng-coder") declined.partial += `\ndesignId: ${args.designId ?? "(single-design session — designId optional)"} — reuse it (with the same designToken) when re-spawning this eng-coder.`
    return declined.partial
  }

  // Report too short = incomplete handoff: send back for expansion once (inspired by kimi-code's summaryPolicy: min 200 chars, retry 1 time).
  // The child agent's history is still intact; the continuation instruction is appended as new input so it can see its own earlier work.
  if (report.length < MIN_REPORT_CHARS) {
    report = await runAgent(child, REPORT_CONTINUATION, childOpts, childRunOpts)
  }

  // Engineering mode mechanical code gate: delegated file changes must not
  // bypass the parent's advisor/verify guards. Merge the child's mutations
  // into the parent so "advisor mandatory at both gates" is enforced, not just
  // promised in the engineering prompt.
  // CRITICAL: Only merge if child actually mutated files (defense-in-depth against
  // runAgent throwing before any writes occurred).
  // Review #8 clarification: eng-coder ONLY is intentional — the mechanical
  // two-gate merge exists for engineering mode; plain `coder` children carry
  // their own verify/advisor self-review discipline (per tool description), and
  // normal mode has no parent advisor/verify gate to feed.
  if (role === "eng-coder" && child._mutatedThisRun) {
    mergeChildMutations(parent, child)
  }

  // designId rides the delivery report (2026-09-01): the divergence-audit fix round
  // re-spawns with the SAME designId+token — the parent copies it from here, and the
  // prompt tells the model exactly where the matching token came from.
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
