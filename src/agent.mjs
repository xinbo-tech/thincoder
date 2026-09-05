/**
 * agent.mjs — Agent loop for VS Code context (full thincoder feature set: subagents,
 * plan mode, goal tracking, verify guard; setup lives in agent/setup.mjs).
 */
import { chat } from "./provider.mjs"
import { specForModel } from "./specs.mjs"
import { compactHistory, truncateFallback, COMPRESS_FAILURE_LIMIT, summarizeRunExplorations } from "./compact.mjs"
import { cleanupConsultSessions } from "./agent-tools/consult.mjs"
import { traceStop } from "./extension/stop-trace.mjs"
import {
  MAX_ADVISOR_PUSHBACKS, MAX_VERIFY_PUSHBACKS, MAX_VERIFY_RETRIES, MAX_EMPTY_RETRIES,
  configuredMaxTurns, hasCodeMutations,
  pushReal, agentState, reinjectAfterCompaction,
} from "./agent/run-helpers.mjs"
import { MAX_ADVISOR_ROUNDS } from "./advisor/run.mjs"
import { executeToolBatches } from "./agent/execute-tools.mjs"
import { setupAgentRun } from "./agent/setup.mjs"
import { AUTO_REMINDER } from "./agent/setup-reminders.mjs"
import { logEvent } from "./log.mjs"

/** Engineering mode OFF reminder (CLI parity — cmd-eng / injector transitions). */
export const ENG_OFF_REMINDER =
  "[System reminder: engineering mode is now OFF — standard discipline applies. " +
  "Changes go through the normal workflow: you may edit files directly, advisor/verify " +
  "guards apply per config.]"

/** Manual-tier auto-turn digest domain (AGENT-LOOP.md §17 D-S6): organize-only.
 *  Injected per manual auto-turn run — writes/execute/spawns/questions are also
 *  mechanically denied (deny-stub permission/question handlers + the spawn gate in
 *  subagent.mjs); this reminder steers the model before it hits those denials. */
const AUTO_TURN_DIGEST_DOMAIN =
  "[System reminder: auto-turn — background async subagents finished while there was no user message, and this turn runs automatically to digest their reports (the finished-report reminders above). No one is waiting for this reply, so organize only: 1) summarize each finished report's key points into this conversation for the user to read later; 2) update the task list with the task tool (allowed) to mark finished work done; 3) write decision points with a suggested next step as text — do not execute it. FORBIDDEN this turn (mechanically enforced): modifying files, bash/execute/verify, spawning subagents, asking questions — those need a real user message. End the turn once the summaries are written.]"

/** Guard bookkeeping keys an auto-turn's end state inherits into the next USER run
 *  (§17 D-S6 — auto-turn changes never escape the verify/advisor guards silently). */
export const INHERITED_GUARD_KEYS = ["_mutatedThisRun", "_verifiedThisRun", "_verifyPassed", "_calledAdvisorThisRun", "_touchedFiles", "_verifyRetries", "_advisorRound"]

/** Engineering-mode status injection (CLI parity, agent.mjs injectEngineeringReminder):
 *  one reminder on EVERY transition (ON and OFF) — the model must always know the mode
 *  flipped, including after a session resume (vscode setup.mjs seeds _lastEngState=false
 *  so a resumed engineering session re-notifies on the first turn). */
function injectEngineeringReminder(agent) {
  const eng = agent.config?.agent?.engineering ?? false
  if (eng !== agent._lastEngState) {
    agent.history.push({ role: "user", content: eng ? ENG_ON_REMINDER : ENG_OFF_REMINDER, transient: true })
  }
  agent._lastEngState = eng
}

/** Engineering mode reminders — shared with the eng tool (CLI parity). */
export const ENG_ON_REMINDER =
  "[System reminder: engineering mode is ON — design-before-code enforced. " +
  "Workflow: Requirements doc → Design doc → advisor(type='design') → " +
  "user approval → eng-coder implementation. Code changes go through eng-coder " +
  "subagents only. Advisor calls are NOT per-turn-mandatory — call only at " +
  "flow nodes or when the user asks.]"

/** Typed error for turn-limit exhaustion — consumers can detect and offer "Continue?" prompt */
export class ContinueError extends Error {
  constructor(turns) { super(`Agent reached max turns (${turns}).`); this.turns = turns }
}

export { builtinTools } from "./tools.mjs"

/** Run the agent loop: opts — { depth, role, maxTurns, autoTurn (§17 digest), … }. */
export async function runAgent(provider, cwd, input, callbacks = {}, signal, autoApprove = true, opts = {}) {
  const depth = opts.depth ?? 0
  const role = opts.role ?? null
  const overrideTurns = opts.maxTurns
  const autoTurn = opts.autoTurn === true // §17 D-S6: system-driven digest turn (no user input)

  // Live autoApprove read (CLI parity): the panel passes a getter — approve-all / the
  // AUTO toolbar button flip the flag MID-TURN; the gate + AUTO reminder re-read it.
  const getAuto = typeof autoApprove === "function" ? autoApprove : () => autoApprove

  // Previous turn's async exploration distillation must land FIRST: the compressed machine
  // line is this run's starting context. Awaited BEFORE setupAgentRun (N1) — setupAgentRun
  // pushes this run's user input, and the shrink would clobber it if it ran after.
  const prev = opts.distillState?.pending
  if (prev) {
    opts.distillState.pending = null
    await prev
  }

  // §17 D-S3 ② run-start injection: suspension-settled entries parked on
  // history._pendingAsyncResults are consumed BEFORE setupAgentRun pushes this run's
  // input (spliced = consumed — single injection point; turn-end pool entries are ①).
  if (depth === 0 && Array.isArray(opts.history?._pendingAsyncResults)) {
    const hist = opts.history
    const pend = hist._pendingAsyncResults
    if (pend.length > 0) {
      const { injectAsyncResult } = await import("./agent-tools/subagent.mjs")
      for (const e of pend.splice(0)) await injectAsyncResult(e, { history: hist, fullHistory: opts.fullHistory ?? hist, cwd })
    }
  }

  const { agent, history, fullHistory, toolByName, toolSchemas, cfgVerifyGuard, cfgCompactThreshold, systemPrompt } =
    await setupAgentRun({ provider, cwd, input, opts, depth, role, getAuto })

  // §17 per-run flags: _inAutoTurn = manual-tier digest spawn gate; _sessionSignal =
  // suspension-session abort signal — digest's own Stop/interrupt never kills the pool.
  agent._inAutoTurn = autoTurn
  agent._sessionSignal = opts.sessionSignal ?? null
  // §17 D-S6: an auto-turn's guard marks are inherited by the next USER run (not reset).
  if (!opts.resume && opts.inheritedGuard) {
    for (const k of INHERITED_GUARD_KEYS) if (k in opts.inheritedGuard) agent[k] = opts.inheritedGuard[k]
  }
  // §17 D-S6 manual tier: digest action-domain reminder (system-driven turn — organize only).
  if (autoTurn && !getAuto()) {
    history.push({ role: "user", content: AUTO_TURN_DIGEST_DOMAIN, transient: true })
  }

  // §15 D-A3（VS Code 对齐）：async 注册表挂 agent 上；depth-0 的 map 沿共享 history
  // 数组跨 runAgent 调用存活。n 读数 resume 携带（2026-09-05 复审 #5）：续跑从
  // history._asyncCheckN 播种——模型上下文连续，check 的 n 序列不被打断。
  agent._asyncSubagents = (depth === 0 && history._asyncSubagents instanceof Map) ? history._asyncSubagents : new Map()
  if (opts.resume && typeof history._asyncCheckN === "number") agent._asyncCheckN = history._asyncCheckN
  else if (!opts.resume) agent._asyncCheckN = 0

  // End-of-run exploration distillation boundary (CONTEXT-COMPACTION §5): setupAgentRun has already
  // pushed the user input + injections, so everything appended from here is "this run's" work.
  agent._runStartHistoryLen = history.length

  // ─── Main loop ─────────────────────────────
  const maxTurns = overrideTurns || configuredMaxTurns()
  const recentSigs = []
  let guardPushbacks = 0
  let advisorPushbacks = 0
  let thrownError = null

  try {
  for (let turn = 0; turn < maxTurns; turn++) {
    if (signal?.aborted) { traceStop(`agent loop turn ${turn}: aborted at loop head`) ; throw new DOMException("Aborted", "AbortError") }
    // §19.5 D-M5 per-child turn hook (CLI ⟦ev⟧turn 解析的 VS Code 等价): 每轮迭代通报
    // turn 号——subagent runChild 同步进 async 池条目的 entry.turn（status 决策字段）。
    callbacks.onAgentTurn?.(turn + 1)

    // Context compaction check — only at safe points: history ends with a complete
    // exchange (user input or tool result), never mid-assistant (CLI parity D1).
    const lastRole = history.at(-1)?.role
    if (lastRole === "user" || lastRole === "tool") {
      try {
        // Measured baseline path (CLI parity D3): the last response's prompt_tokens is the
        // true full-context cost; messages appended since are estimated as increments.
        // tools schemas ride along for the pure-estimation overhead; the signal cancels
        // the in-flight summary request on Stop (CLI parity).
        const compacted = await compactHistory(history, systemPrompt, provider, cfgCompactThreshold, {
          lastPromptTokens: agent._lastPromptTokens,
          usageAtLen: agent._usageAtLen,
        }, toolSchemas, signal, callbacks, agent)
        if (compacted) {
          // Only reset the end-of-run distillation boundary when the machine line was REBUILT —
          // a rebuild inserts a summary note + "Understood" placeholder and collapses the middle,
          // so the array SHRINKS; the shrink path (shrinkOversized) keeps the SAME length (it only
          // truncates bodies in place), so a same-length result means the boundary is still valid
          // and must NOT be reset. Reset to 2 = the verbatim tail start ([head(empty), note,
          // "Understood", ...tail] → tail begins after the two inserted messages).
          const rebuilt = compacted.length !== history.length
          history.length = 0
          history.push(...compacted)
          if (rebuilt) agent._runStartHistoryLen = 2
          // Measured baseline is invalidated along with old history — fall back to estimation
          agent._lastPromptTokens = null
          agent._usageAtLen = null
          agent._compressFailures = 0
          reinjectAfterCompaction(history, agent, getAuto)
          // Completion info (CONTEXT-COMPACTION §7 D-C1): { mode: "summary", tokensFreed,
          // elapsedMs } from compactHistory — the webview renders "Compressed: N tokens
          // freed (Xs)". Existing callers that ignore onCompress keep the old semantics.
          callbacks.onCompress?.(agent._lastCompressInfo ?? {})
        }
      } catch (e) {
        // AbortError must not be swallowed: user cancellation must propagate
        if (e?.name === "AbortError" || signal?.aborted) throw e
        // Q3 visibility (CONTEXT-COMPACTION §7 D-C1): a failed compression is no longer silent —
        // console.error + onCompressFail let the webview render the error text. Failure
        // STRATEGY is unchanged: COMPRESS_FAILURE_LIMIT consecutive failures still degrade
        // to truncateFallback — this only adds observability.
        console.error("[context] compression failed:", e)
        callbacks?.onCompressFail?.(e)
        // Summary LLM failed — count consecutive failures; after the limit degrade to
        // deterministic truncation (no network) so the task can continue (CLI parity D6).
        agent._compressFailures = (agent._compressFailures ?? 0) + 1
        if (agent._compressFailures >= COMPRESS_FAILURE_LIMIT) {
          agent._compressFailures = 0
          const truncated = truncateFallback(history, provider)
          if (truncated) {
            history.length = 0
            history.push(...truncated)
            // Same boundary reset as the compacted path: truncateFallback returns the same
            // [head(empty), note, "Understood", ...verbatim tail] shape — tail starts at index 2.
            agent._runStartHistoryLen = 2
            agent._lastPromptTokens = null
            agent._usageAtLen = null
            reinjectAfterCompaction(history, agent, getAuto)
            // Fallback completion info (D-C2/D-C3): mode marks the deterministic-truncation
            // path — the status line shows the degradation note ("truncated to N messages")
            // ONLY after 3 consecutive failures (the caller reached this branch).
            agent._lastCompressInfo = { mode: "fallback", tailMessages: Math.max(0, truncated.length - 2) }
            callbacks.onCompress?.(agent._lastCompressInfo)
          }
        }
      }
    }

    // Live AUTO reminder (CLI parity, agent.mjs:158): approve-all / the AUTO button can
    // flip the flag mid-turn, and compaction can drop the earlier reminder. Re-read the
    // live flag every iteration — the model must know AUTO turned on without waiting
    // for the next user message.
    if (getAuto() && !history.some((m) => m.content === AUTO_REMINDER)) {
      history.push({ role: "user", content: AUTO_REMINDER })
    }

    // Engineering-mode transition reminder (CLI parity): covers TUI/panel toggles and
    // session resume — paths that bypass the eng tool's own _pendingReminders push.
    injectEngineeringReminder(agent)

    // Flush pending reminders queued by meta-tools (eng enter/exit, etc.)
    if (agent._pendingReminders.length > 0) {
      for (const reminder of agent._pendingReminders) history.push({ role: "user", content: reminder })
      agent._pendingReminders = []
    }

    const messages = [{ role: "system", content: systemPrompt }, ...history]
    traceStop(`turn ${turn}: calling LLM (history ${history.length} msgs)`)
    const response = await chat(provider, {
      messages,
      tools: toolSchemas,
      // onToken gate: depth 0 always; consult children are exempt so their OUTPUT streams
      // into the consultation panel (consult-UI review 2026-08-15). Escalates opt
      // in via opts.streamOutput (three-way review 2026-08-16 — a long surgery is silent
      // without it). Other subagents never pass onToken, so their behavior is unchanged.
      onToken: depth === 0 || role === "consult" || opts.streamOutput === true ? callbacks.onToken : null,
      onReasoning: callbacks.onReasoning,
      onWait: callbacks.onWait,
      signal,
      // LOGGING（LOGGING.md——CLI parity）：llm:* 语义上下文（stage=turn 主循环回合——
      // digest autoTurn=true；role/depth = 子代理上下文归属——vscode agent 对象 per-run 重建）
      logCtx: { stage: "turn", turn: turn + 1, auto: autoTurn, role, depth },
    })
    traceStop(`turn ${turn}: LLM stream ended`)

    // 内置工具（Responses web_search）结果本地化：服务端已执行——入历史为 tool 消息，
    // 模型下一轮可见；全量回传时 transport 依 tool_call_id 前缀还原 web_search_call item。
    // 服务端 item id 是 msg_xxx 非 web_search_call_ 前缀——必须合成前缀（toItems 识别锚点），
    // 原始 id 存入 content（真机冒烟 2026-08-31，与 CLI 同修）。
    for (const btr of response.builtinToolResults ?? []) {
      if (!btr?.id) continue
      pushReal(history, fullHistory, {
        role: "tool",
        tool_call_id: `web_search_call_${btr.id}`,
        content: JSON.stringify({ id: btr.id, query: btr.query ?? "", sources: btr.sources ?? [], status: btr.status ?? "completed" }),
      })
    }

    // Interrupt (Ctrl+I, CLI agent.mjs parity): the SSE stream returned the
    // partial result — commit the partial assistant output, inject the user's
    // message, and throw so the outer loop rebuilds the controller and resumes.
    if (response.interrupted) {
      if (response.content) pushReal(history, fullHistory, { role: "assistant", content: response.content })
      history.push({ role: "user", content: `[User interrupt: ${response.interruptMessage}]` })
      const err = new DOMException("Aborted", "AbortError")
      err.reason = { interrupt: true, message: response.interruptMessage }
      throw err
    }

    if (response.usage && depth === 0) {
      callbacks.onUsage?.(response.usage)
      // Measured compaction baseline (CLI parity D3): the full-context prompt_tokens from
      // this response anchors the next compaction check; appended messages count as increments.
      if (response.usage.prompt_tokens != null) {
        agent._lastPromptTokens = response.usage.prompt_tokens
        agent._usageAtLen = history.length
      }
    }

    // ─── No tool calls ──────────────────────
    if (response.toolCalls.length === 0) {
      if (!response.content) {
        if (response.reasoning) {
          // Model output only reasoning (thinking) — treat as content
          response.content = response.reasoning
        } else {
          // Transient empty response (reasoning exhausted / output truncated): instead of
          // aborting the whole turn, inject a reminder and let the model respond again.
          // Bounded — after MAX_EMPTY_RETRIES consecutive empties, surface the error (CLI parity, IK60QP).
          const retries = agent._emptyRetries ?? 0
          if (retries < MAX_EMPTY_RETRIES) {
            agent._emptyRetries = retries + 1
            history.push({
              role: "user",
              content: "[System reminder: your last response was empty — the provider returned no content (likely reasoning was exhausted or output was truncated). Respond again, continuing your work from where you left off.]",
            })
            callbacks.onSubTurnBreak?.()
            continue
          }
          throw new Error("LLM returned empty response (likely reasoning exhausted or output truncated). Try lowering reasoning effort if this persists.")
        }
      }

      // Pending tasks check (top-level only). Pushed back AT MOST ONCE per task-list
      // state (CLI parity): an unbounded loop stranded the model when a pending item
      // could not be resolved. Updating the list via the task tool resets the budget.
      if (depth === 0) {
        const pending = agent._tasks?.filter((t) => t.status === "pending")
        if (pending?.length && (agent._taskPushbacks ?? 0) < 1) {
          agent._taskPushbacks = (agent._taskPushbacks ?? 0) + 1
          pushReal(history, fullHistory, { role: "assistant", content: response.content })
          history.push({
            role: "user",
            content: `[System reminder: you still have pending tasks: ${pending.map((t) => t.title).join(", ")}. Update their status before finishing — if done, mark done; if not applicable, remove them. (This is your only reminder — if you choose not to, finish anyway.)]`,
          })
          callbacks.onSubTurnBreak?.()
          continue
        }

        // Verify guard — OPT-IN (config agent.verifyGuard === true, CLI parity). When off
        // the agent is not pushed back to verify before finishing.
        if (cfgVerifyGuard && agent._touchedFiles.length > 0 && !agent._verifiedThisRun && guardPushbacks < MAX_VERIFY_PUSHBACKS) {
          guardPushbacks++
          pushReal(history, fullHistory, { role: "assistant", content: response.content })
          history.push({
            role: "user",
            content: "[System reminder: you modified files in this run but have not verified the changes. Before finishing: call the verify tool to run syntax checks and tests. If verify reports failures, fix them and run verify again. If verification is genuinely impossible here, say so explicitly in your reply.]",
          })
          callbacks.onSubTurnBreak?.()
          continue
        }
        if (agent._verifiedThisRun && agent._verifyPassed === false) {
          const retries = (agent._verifyRetries ?? 0) + 1
          agent._verifyRetries = retries
          if (retries < MAX_VERIFY_RETRIES) {
            agent._verifyPassed = undefined // reset for next attempt
            pushReal(history, fullHistory, { role: "assistant", content: response.content })
            history.push({
              role: "user",
              content: `[System reminder: verify reported failures (retry ${retries}/${MAX_VERIFY_RETRIES}). Review the failures, fix the issues, then run verify again. If you cannot fix after ${MAX_VERIFY_RETRIES} attempts, explain honestly what's blocking you.]`,
            })
            callbacks.onSubTurnBreak?.()
            continue
          }
          // Exhausted retries — inject honest-declaration reminder
          if (!agent._honestReminderInjected) {
            agent._honestReminderInjected = true
            pushReal(history, fullHistory, { role: "assistant", content: response.content })
            const consultHint = agent?.config?.agent?.consultModels?.length
              ? " If you suspect the root-cause hypothesis itself may be wrong, consider consult_start for independent diagnoses before more retries."
              : ""
            history.push({
              role: "user",
              content: `[System reminder: ${MAX_VERIFY_RETRIES} verify attempts exhausted and tests are still failing. In your response to the user, you MUST state explicitly: (1) what tests are still failing, (2) what you tried, (3) what you believe the root cause is. Do not present this as complete — the user needs to know the work is unfinished.${consultHint}]`,
            })
            callbacks.onSubTurnBreak?.()
            continue
          }
        }

        // Advisor guard (CLI completion.mjs parity): OPT-IN ONLY
        // (advisor.guard === true, default OFF — 2026-08-21 semantic
        // refactor), NEVER in engineering mode (engineering has its own
        // mandatory gates). The advisor tool itself is always available.
        // Cap sync (CLI b74e413): beyond MAX_ADVISOR_ROUNDS the advisor tool
        // refuses reviews (run.mjs convergence cap) — pushing back further
        // would loop forever (fix → pushback → cap-refused call → fix …).
        const advisorCfg = agent.config?.advisor
        const advisorReview = advisorCfg?.guard === true
        if (advisorReview && !agent.config?.agent?.engineering
            && agent._mutatedThisRun && !agent._calledAdvisorThisRun && hasCodeMutations(agent)
            && advisorPushbacks < MAX_ADVISOR_PUSHBACKS
            && (agent._advisorRound || 0) < MAX_ADVISOR_ROUNDS) {
          advisorPushbacks++
          pushReal(history, fullHistory, { role: "assistant", content: response.content })
          history.push({
            role: "user",
            content: `[System reminder: you changed code in this run and MUST get an advisor review before finishing (round ${agent._advisorRound + 1}). Call the \`advisor\` tool now. This is required, not optional — do not skip it even if you believe the changes are trivial — the review will be quick either way. After the review, produce a response table for every issue found (see discipline rules for format).]`,
          })
          callbacks.onSubTurnBreak?.()
          continue
        }
      }

      pushReal(history, fullHistory, { role: "assistant", content: response.content })
      if (depth === 0) {
        // End-of-run exploration distillation (CONTEXT-COMPACTION §5): shrink this run's inline
        // exploration results into one semantic note AFTER onComplete — the send button (webview
        // `complete` message) must not wait for this second silent LLM call (SEND-STALL-DISTILL).
        // The next runAgent awaits the pending distill before pushing its user input (N1), so
        // the summary is always in place before the next LLM call. Silent (N3): failure must
        // never block the return or lose history.
        callbacks.onComplete?.(response.content, agentState(agent))   // UI 立即释放
        // depth 守卫（评审 #2）：仅顶层轮末触发蒸馏；子轮（depth>0）不得创建——
        // 否则先创建的蒸馏晚 resolve 会 clobber 历史（N1 竞态）。
        // 专用 distillSignal（评审 #1）：与运行 signal 分离——新消息/下一轮 abort 运行
        // controller 时蒸馏继续完成；用户 Stop（abort 运行 signal）同样不影响蒸馏。
        // panel dispose / 会话切换时 abort distillSignal。
        const distill = summarizeRunExplorations(history, agent._runStartHistoryLen ?? 0, provider, opts.distillSignal ?? signal)
          .then((shrunk) => {
            if (shrunk) {
              history.length = 0
              history.push(...shrunk)
              // The machine line changed shape — the measured token baseline was for the pre-shrink
              // context, so invalidate it (next compaction check falls back to re-estimation).
              agent._lastPromptTokens = null
              agent._usageAtLen = null
              callbacks.onDistilled?.()   // 压缩已落位 → 调用方应持久化（评审 #5）
            }
            return shrunk
          })
          .catch(() => null)
        if (opts.distillState) opts.distillState.pending = distill
      }
      return response.content
    }

    // ─── Tool calls ─────────────────────────
    pushReal(history, fullHistory, {
      role: "assistant",
      content: response.content || null,
      tool_calls: response.toolCalls.map((tc) => ({
        id: tc.id, type: "function",
        function: { name: tc.name, arguments: tc.arguments },
      })),
      ...(response.reasoning && specForModel(provider.model).reasoningEcho === "required"
        ? { reasoning_content: response.reasoning }
        : {}),
    })

    // Machine-line warning (ARCHITECTURE.md §285-287): tell the model some of its tool
    // calls were dropped (non-standard provider format) so it does not assume they ran.
    if (response.droppedToolCalls > 0) {
      history.push({
        role: "user",
        content: `[System reminder: ${response.droppedToolCalls} malformed tool_calls from the provider response were dropped (non-standard provider format).]`,
      })
    }

    await executeToolBatches(agent, { response, history, fullHistory, toolByName, getAuto, callbacks, signal, sessionSignal: opts.sessionSignal ?? null, cwd, recentSigs, depth })
    traceStop(`turn ${turn}: tool batches complete`)

    // Ctrl+I interrupt during tool execution (CLI agent.mjs parity): skip committing
    // partial tool results — they'd mislead the model. Inject the interrupt and retry.
    if (signal?.reason?.interrupt) {
      history.push({ role: "user", content: `[User interrupt: ${signal.reason.message}]` })
      continue
    }
    // Expired timers — inject reminders when the thinking budget is up (ported from CLI post-turn)
    if (agent._pendingTimers.length > 0) {
      const now = Date.now()
      const expired = agent._pendingTimers.filter((t) => t.expiresAt <= now)
      agent._pendingTimers = agent._pendingTimers.filter((t) => t.expiresAt > now)
      for (const t of expired) {
        history.push({ role: "user", content: `[System reminder: ⏰ timer — ${t.message}]` })
      }
    }

    // Goal injection
    if (agent._goal?.status === "active") {
      agent._goal.turnsUsed = (agent._goal.turnsUsed ?? 0) + 1
      history.push({
        role: "user",
        content: `[System reminder: goal active — "${agent._goal.objective}". Turns used: ${agent._goal.turnsUsed}. Complete with the goal tool when criteria are met.]`,
      })
    }
  }

  throw new ContinueError(maxTurns)
  } catch (e) {
    // Track the exit cause — the finally below must distinguish a ContinueError
    // (pool kept for the resumed run, no collection) from other exits.
    thrownError = e
    throw e
  } finally {
    // Turn-bound cleanup (CONSULTATION.md): abort any leftover consultation sessions
    // started during this turn — no orphan sub-agents past the turn's end.
    cleanupConsultSessions(agent)
    // Async subagent turn-end handling (AGENT-LOOP.md §15 D-A3 + §17 D-S1 + §17.5
    // supersede; the collector lives in agent-tools/subagent-async.mjs with the async
    // machinery — 500-line split):
    // Stop (plain abort) → clear WITHOUT injecting stale errors (Ctrl+I keeps the pool);
    // ContinueError → no wait/no injection; else → collect SETTLED entries (D-S3 ①) —
    // running/queued STAY (no allSettled wait) — the suspension session digests them (D-S2).
    // §17.5: a suspension-driven run (opts.suspDriven — the panel-chat layer runs
    // suspensionSession after this run) NO LONGER drains settled entries at turn end —
    // they stay pooled (settled not consumed) so the session's first sweep → digest
    // turn digests them (17.5.2 方案 B). Undriven callers keep the direct turn-end
    // injection (17.5.4 #2 兜底 — results never lost without a session).
    const asyncMap = agent._asyncSubagents
    if (asyncMap && asyncMap.size > 0) {
      if (signal?.aborted && !signal?.reason?.interrupt) {
        logEvent("ev:stopped", { poolN: asyncMap.size, where: "turn-end-abort" })
        asyncMap.clear()
      } else if (!(thrownError instanceof ContinueError)) {
        const { collectSettledAsync } = await import("./agent-tools/subagent.mjs")
        await collectSettledAsync(agent, { history, fullHistory, cwd, suspDriven: opts.suspDriven === true })
      }
    }
    // The pool rides the shared depth-0 history array across runAgent calls (the agent
    // object itself is per-run) — attach while entries remain, drop when drained.
    if (depth === 0) history._asyncSubagents = (asyncMap && asyncMap.size > 0) ? asyncMap : undefined
    // _asyncCheckN 随续跑/池持久化（2026-09-05 复审 #5）：续跑（Ctrl+I/ContinueError——
    // 模型上下文连续须续号，即使池已空）或池仍有时写下读数；普通终局丢弃（新上下文重置 0）。
    if (depth === 0) {
      const willContinue = (thrownError instanceof ContinueError) || (signal?.aborted && !!signal?.reason?.interrupt)
      if (willContinue || (asyncMap && asyncMap.size > 0)) history._asyncCheckN = agent._asyncCheckN ?? 0
      else history._asyncCheckN = undefined
    }
    agent._inAutoTurn = false
    // §17 D-S6: an auto-turn's end-state guard marks carry into the next USER run via
    // opts.guardCarry (restored at its start above). Normal ends only — Stop discards
    // (user cancelled the work); ContinueError lets the auto-resumed run snapshot at
    // its own end (CLI parity).
    if (autoTurn && !(signal?.aborted && !signal?.reason?.interrupt) && !(thrownError instanceof ContinueError)) {
      const carry = opts.guardCarry
      if (carry) {
        for (const k of INHERITED_GUARD_KEYS) carry[k] = agent[k]
      }
    }
  }
}
