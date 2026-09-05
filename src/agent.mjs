/**
 * agent.mjs — Agent loop for VS Code context (full thincoder feature set: subagents,
 * plan mode, goal tracking, verify guard; setup lives in agent/setup.mjs).
 */
import { chat } from "./provider.mjs"
import { specForModel } from "./specs.mjs"
import { traceStop } from "./extension/stop-trace.mjs"
import {
  MAX_ADVISOR_PUSHBACKS, MAX_VERIFY_PUSHBACKS, MAX_VERIFY_RETRIES, MAX_EMPTY_RETRIES,
  configuredMaxTurns, hasCodeMutations,
  pushReal, agentState,
} from "./agent/run-helpers.mjs"
import { MAX_ADVISOR_ROUNDS } from "./advisor/run.mjs"
import { executeToolBatches } from "./agent/execute-tools.mjs"
import { setupAgentRun } from "./agent/setup.mjs"
import { AUTO_REMINDER, ENG_OFF_REMINDER, ENG_ON_REMINDER, injectEngineeringReminder } from "./agent/setup-reminders.mjs"
// 主循环阶段函数（压缩检查/蒸馏发射/回合收尾）2026-09-05 实践轮迁 agent/run-stages.mjs
import { checkAndCompact, fireEndOfRunDistill, finalizeAgentTurn, maybeGuardPushbacks } from "./agent/run-stages.mjs"

/** Manual-tier auto-turn digest domain (AGENT-LOOP.md §17 D-S6): organize-only.
 *  Injected per manual auto-turn run — writes/execute/spawns/questions are also
 *  mechanically denied (deny-stub permission/question handlers + the spawn gate in
 *  subagent.mjs); this reminder steers the model before it hits those denials. */
const AUTO_TURN_DIGEST_DOMAIN =
  "[System reminder: auto-turn — background async subagents finished while there was no user message, and this turn runs automatically to digest their reports (the finished-report reminders above). No one is waiting for this reply, so organize only: 1) summarize each finished report's key points into this conversation for the user to read later; 2) update the task list with the task tool (allowed) to mark finished work done; 3) write decision points with a suggested next step as text — do not execute it. FORBIDDEN this turn (mechanically enforced): modifying files, bash/execute/verify, spawning subagents, asking questions — those need a real user message. End the turn once the summaries are written.]"

/** Guard bookkeeping keys an auto-turn's end state inherits into the next USER run
 *  (§17 D-S6 — auto-turn changes never escape the verify/advisor guards silently). */
export const INHERITED_GUARD_KEYS = ["_mutatedThisRun", "_verifiedThisRun", "_verifyPassed", "_calledAdvisorThisRun", "_touchedFiles", "_verifyRetries", "_advisorRound"]

/** Typed error for turn-limit exhaustion — consumers can detect and offer "Continue?" prompt */
export class ContinueError extends Error {
  constructor(turns) { super(`Agent reached max turns (${turns}).`); this.turns = turns }
}

export { builtinTools } from "./tools.mjs"
// ENG 提醒族 2026-09-05 迁入 agent/setup-reminders.mjs（agent.mjs 519 > 500 硬限）——
// re-export 保 import 面（eng.mjs / 测试从 agent.mjs import）
export { ENG_OFF_REMINDER, ENG_ON_REMINDER } from "./agent/setup-reminders.mjs"

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
    // 2026-09-05 实践轮：压缩判定/重建/降级计数提为 checkAndCompact 模块函数
    // （骨干—细节两层——循环骨架此处只剩检查调用）。
    const lastRole = history.at(-1)?.role
    if (lastRole === "user" || lastRole === "tool") {
      await checkAndCompact(agent, { history, provider, systemPrompt, toolSchemas, cfgCompactThreshold, signal, callbacks, getAuto })
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

      // Pending tasks / verify guard / advisor guard pushbacks（2026-09-05 实践轮——
      // 提为 maybeGuardPushbacks 模块函数，run-stages.mjs——此处只剩调用；push=true
      // 时已注入提醒并 continue 本回合）。
      if (depth === 0) {
        const pb = { guardPushbacks, advisorPushbacks }
        const pushed = await maybeGuardPushbacks(agent, { response, history, fullHistory, callbacks, cfgVerifyGuard, pb })
        guardPushbacks = pb.guardPushbacks
        advisorPushbacks = pb.advisorPushbacks
        if (pushed) continue
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
        // 2026-09-05 实践轮：蒸馏发射（深度守卫/distillSignal 分离/落位回写）提为
        // fireEndOfRunDistill 模块函数——此处只剩 UI 释放 + 发射调用。
        const distill = fireEndOfRunDistill(agent, history, provider, opts.distillSignal ?? signal, callbacks)
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
    // 2026-09-05 实践轮：回合收尾（consult 清理/async 池收集/checkN 持久/guardCarry
    // 继承）提为 finalizeAgentTurn 模块函数——finally 只剩一行调用 + 骨架注释。
    await finalizeAgentTurn(agent, { signal, history, fullHistory, cwd, depth, thrownError, autoTurn, guardCarry: opts.guardCarry, suspDriven: opts.suspDriven === true })
  }
}

// runAgent 主循环阶段函数（checkAndCompact/fireEndOfRunDistill/finalizeAgentTurn）
// 2026-09-05 实践轮迁 agent/run-stages.mjs（runAgent ≥300 单体分层后文件总量超限——
// 阶段函数族独立成文件——import 面见文件头）

