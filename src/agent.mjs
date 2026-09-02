/**
 * agent.mjs — Agent main loop
 * LLM ↔ tool-call loop, until the task is done.
 */
import { chat } from "./provider/index.mjs"
import { compressIfNeeded, compressFallback, COMPRESS_FAILURE_LIMIT, pushReal, summarizeRunExplorations } from "./context.mjs"
import { specForModel } from "./config.mjs"
import { readFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { executeToolCalls } from "./agent/dispatch.mjs"
import { recordToolResults } from "./agent/record-results.mjs"
import { FILE_MUTATORS } from "./agent/helpers.mjs"
import { prepareRun } from "./agent/setup.mjs"
import { injectPostTurn } from "./agent/post-turn.mjs"
import { handleCompletion } from "./agent/completion.mjs"
import { cleanupConsultSessions } from "./agent-tools/consult.mjs"
import {
  escapeXml, repairHistory, listWorkDir, ensureAutoReminder,
  readonlyToolNames, collectGitContext, loadProjectInstructions,
  ContinueError,
  DEFAULT_MAX_TURNS, DEFAULT_SUBAGENT_TURNS,
  MIN_REPORT_CHARS, REPORT_CONTINUATION,
} from "./agent/helpers.mjs"

// Prompt files (byte-stable, loaded once)
const __dirname = dirname(fileURLToPath(import.meta.url))
const SYSTEM_PROMPT = readFileSync(join(__dirname, "prompts", "system.md"), "utf8")
const DISCIPLINE_RULES = readFileSync(join(__dirname, "prompts", "discipline.md"), "utf8")
const MAIN_OVERLAY = readFileSync(join(__dirname, "prompts", "main.md"), "utf8")
let _EXPLORE, _CODER, _PLAN, _ENG_CODER, _CONSULT_BASE
try { _EXPLORE = readFileSync(join(__dirname, "prompts", "explore.md"), "utf8") } catch { _EXPLORE = "" }
try { _CODER = readFileSync(join(__dirname, "prompts", "coder.md"), "utf8") } catch { _CODER = "" }
try { _PLAN = readFileSync(join(__dirname, "prompts", "plan.md"), "utf8") } catch { _PLAN = "" }
try { _ENG_CODER = readFileSync(join(__dirname, "prompts", "eng-coder.md"), "utf8") } catch { _ENG_CODER = "" }
try { _CONSULT_BASE = readFileSync(join(__dirname, "prompts", "consult-base.md"), "utf8") } catch { _CONSULT_BASE = "" }
export const EXPLORE_OVERLAY = _EXPLORE
export const CODER_OVERLAY = _CODER
export const PLAN_OVERLAY = _PLAN
export const ENG_CODER_OVERLAY = _ENG_CODER
export const CONSULT_BASE = _CONSULT_BASE

// exported for consumption by agent-tools.mjs
export {
  ContinueError,
  listWorkDir, loadProjectInstructions,
  readonlyToolNames, collectGitContext, escapeXml,
  MIN_REPORT_CHARS, REPORT_CONTINUATION, DEFAULT_SUBAGENT_TURNS,
}


// Engineering mode reminder — shared with eng.mjs tool
export const ENG_ON_REMINDER =
  "[System reminder: engineering mode is ON — design-before-code enforced. " +
  "Workflow: Requirements doc → Design doc → advisor(type='design') → " +
  "user approval → eng-coder implementation. Code changes go through eng-coder " +
  "subagents only. Advisor calls are NOT per-turn-mandatory — call only at " +
  "flow nodes or when the user asks.]"

// Re-exported for API compatibility (single source of truth: advisor/repos.mjs)
export { hasCodeMutations } from "./advisor/repos.mjs"

/** Engineering mode OFF reminder — shared with the eng tool and the injector. */
export const ENG_OFF_REMINDER =
  "[System reminder: engineering mode is now OFF — standard discipline applies. " +
  "Changes go through the normal workflow: you may edit files directly, advisor/verify " +
  "guards apply per config.]"

/** Manual-tier auto-turn digest domain (AGENT-LOOP.md §17 D-S6): organize-only.
 *  Injected per manual auto-turn run — writes/execute/spawns/questions are also
 *  mechanically denied (no permission handler + spawn gate); this steers first. */
const AUTO_TURN_DIGEST_DOMAIN =
  "[System reminder: auto-turn — background async subagents finished while there was no user message, and this turn runs automatically to digest their reports (the finished-report reminders above). No one is waiting for this reply, so organize only: 1) summarize each finished report's key points into this conversation for the user to read later; 2) update the task list with the task tool (allowed) to mark finished work done; 3) write decision points with a suggested next step as text — do not execute it. FORBIDDEN this turn (mechanically enforced): modifying files, bash/execute/verify, spawning subagents, asking questions — those need a real user message. End the turn once the summaries are written.]"

/** Engineering-mode status injection — one reminder on EVERY transition (2026-08-25:
 *  OFF is announced too — the model must know the gates lifted; silence after /eng-off
 *  left it guessing. Covers TUI /eng, resume, and any path bypassing the eng tool.) */
function injectEngineeringReminder(agent) {
  const eng = agent.config?.agent?.engineering ?? false
  if (eng !== agent._lastEngState) {
    agent.history.push({ role: "user", content: eng ? ENG_ON_REMINDER : ENG_OFF_REMINDER, transient: true })
  }
  agent._lastEngState = eng
}

/** Create a new agent state object with all fields initialized to defaults */
export function createAgent({
  provider, tools, config, cwd, memory, overlay, role,
  tasks = [], history = [],
  planMode = false, autoApprove = false,
  goal = null, sessionStart = null,
}) {
  return {
    provider, tools, config, cwd, memory, _role: role,
    overlay, tasks, history,
    planMode, autoApprove, goal,
    _mutatedThisRun: false, _verifiedThisRun: false, _verifyPassed: undefined, _calledAdvisorThisRun: false,
    _engDesignReviewed: false, // eng-coder: design review gate passed (hard gate in dispatch.mjs)
    _engDesignToken: null, // issued by advisor(type="design"); required to spawn eng-coder
    _touchedFiles: [], _verifyRetries: 0, _advisorRound: 0, _advisorSession: null,
    _lastAdvisorOutput: null, // full review output from the most recent advisor call (convergence rounds inject it verbatim)
    _lastEngState: false,
    _pendingReminders: [],
    _pendingTimers: [],
    _sessionStart: sessionStart,
    _lastPromptTokens: null, _usageAtLen: null,
    _compressFailures: 0,
    _emptyRetries: 0, // empty-response retry budget (per-run; reset on a fresh user turn)
    _runStartHistoryLen: 0, // machine-line length at the start of the current run — end-of-run exploration distillation slices from here
    _pendingDistill: null, // in-flight end-of-run exploration distillation (SEND-STALL-DISTILL §2.1) — awaited at next run start / TUI exit flush
    _currentTurn: 0, _maxTurns: DEFAULT_MAX_TURNS, // turn counter for status bar display
  }
}

/** Run the agent loop: LLM ↔ tool-call cycle until task completion or turn limit. Returns final text content. */
export async function runAgent(agent, input, callbacks = {}, { depth = 0, signal, maxTurns: overrideTurns, resume = false, autoTurn = false } = {}) {
  // Previous run's async exploration distillation must settle before this run pushes
  // input (SEND-STALL-DISTILL §2.2 N1) — await first, or its history replace wipes it.
  if (agent._pendingDistill) {
    const p = agent._pendingDistill
    agent._pendingDistill = null
    const diagTs = Date.now()
    console.error(`[diag] ${diagTs} runAgent:awaitPendingDistill enter autoTurn=${autoTurn}`)
    await p
    console.error(`[diag] ${Date.now()} runAgent:awaitPendingDistill done elapsedMs=${Date.now() - diagTs}`)
  }
  // §17 D-S3: suspension-settled async results inject before EVERY run's prepareRun
  // (user + auto-turn); spliced = consumed. collectSettledAsync owns a different
  // container, so no double-inject across the two consumption points.
  const pendingAsync = agent._pendingAsyncResults
  if (pendingAsync?.length) {
    const { injectAsyncResult } = await import("./agent-tools/subagent.mjs")
    for (const e of pendingAsync.splice(0)) await injectAsyncResult(agent, e)
  }
  agent._inAutoTurn = autoTurn // spawn gate for manual-tier digests (§17 D-S6/N3)
  const { maxTurns, threshold, tools, toolSchemas, toolByName, systemPrompt } = await prepareRun(
    agent, input, callbacks,
    { depth, signal, overrideTurns, resume: resume || autoTurn, systemPrompt: SYSTEM_PROMPT, disciplineRules: DISCIPLINE_RULES, mainOverlay: MAIN_OVERLAY },
  )

  // Exploration-distillation boundary (CONTEXT-COMPACTION §5): prepareRun already
  // pushed input + injections — appended from here counts as "this run's" work.
  agent._runStartHistoryLen = agent.history.length

  // Per-run bookkeeping reset — PRESERVED on `resume` (ContinueError continuation):
  // mutation/guard continuity and the convergence budget must survive a continuation.
  if (!resume) {
    // §17 D-S6: an auto-turn's guard marks are inherited by the next USER run (not
    // reset) so auto-turn changes never escape the guard silently.
    const g = agent._inheritedGuard
    if (g) {
      for (const k of ["_mutatedThisRun", "_verifiedThisRun", "_verifyPassed", "_calledAdvisorThisRun", "_touchedFiles", "_verifyRetries", "_advisorRound"]) agent[k] = g[k]
      agent._inheritedGuard = null
    } else {
      agent._mutatedThisRun = false
      agent._verifiedThisRun = false
      agent._verifyPassed = undefined
      agent._calledAdvisorThisRun = false
      agent._touchedFiles = []
      agent._verifyRetries = 0
      agent._advisorRound = 0
      agent._advisorSession = null // advisor session is per-run: discard when the task ends, next task starts fresh
      agent._emptyRetries = 0 // empty-response retry budget is per-run: a fresh user turn restarts from zero
      agent._compressFailures = 0 // compaction summary-failure counter is per-run: a fresh user turn restarts from zero
      agent._asyncCheckLastN = 0 // subagent_check read counter is per-run (§15 D-A2): a fresh user turn restarts from 1
    }
  }
  // §17 D-S6 manual tier: digest action-domain reminder (system-driven turn — organize only).
  if (autoTurn && !agent.autoApprove) {
    agent.history.push({ role: "user", content: AUTO_TURN_DIGEST_DOMAIN, transient: true })
  }
  // eng-coder authorization is set by subagent.mjs AFTER token validation but BEFORE
  // runAgent — only reset for the top-level agent (depth 0); child runs keep theirs
  if (depth === 0) agent._engDesignReviewed = false
  // _engDesignToken survives across turns (design review → approval → eng-coder spawn);
  // lifecycle: invalidated on failed re-review (advisor.mjs), issued on a passing one.
  let guardPushbacks = 0
  let advisorPushbacks = 0
  let honestReminderInjected = false
  const recentCallSigs = []
  // "once" stream rules fire at most once per runAgent call; the set survives across
  // chat() calls (rule abort-retry, tool loop) within the turn.
  const streamRuleFired = new Set()

  // Compaction overhead for the pure-estimation path: system prompt + tools schema are
  // in every request but not in history — without them the first-turn/just-compacted
  // estimate under-counts and may never trigger. Measured path already includes both.
  const compactionOverhead = {
    systemPrompt,
    tools: toolSchemas,
  }

  let thrownError = null
  try {
    for (let turn = 0; turn < maxTurns; turn++) {
    // Update turn counter for status bar display
    agent._currentTurn = turn + 1
    agent._maxTurns = maxTurns
    // D2 (AGENT-LOOP.md §7.2): depth>0 children emit a ⟦ev⟧turn progress token each turn —
    // single emit point covering all three spawn tools; phase=llm (tool/done progress rides
    // the onToolCall/onToolResult relay — no token for those).
    if (depth > 0 && callbacks.onToken) {
      callbacks.onToken(`⟦ev⟧turn\x1e${turn + 1}\x1e${maxTurns}\x1ellm\x1e`)
    }

    const lastRole = agent.history.at(-1)?.role
    if (lastRole === "user" || lastRole === "tool") {
      try {
        if (await compressIfNeeded(agent, threshold, callbacks, compactionOverhead, signal)) {
          agent._compressFailures = 0
          agent._planReminderAtLen = 0 // After compression history shrinks, reset cadence so reminders resume
          recentCallSigs.length = 0 // After compression history is rebuilt, reset stall detection counter
          // Completion info (CONTEXT-COMPACTION §7 D-C2): { mode, tokensFreed, elapsedMs } —
          // the TUI panel renders it; callers that ignore the arg keep prior onCompress semantics.
          callbacks.onCompress?.(agent._lastCompressInfo ?? {})
          ensureAutoReminder(agent)
        }
      } catch (compressError) {
        // AbortError must not be swallowed: user cancellation must propagate
        if (compressError?.name === "AbortError" || signal?.aborted) throw compressError
        agent._compressFailures = (agent._compressFailures ?? 0) + 1
        // Q3 (CONTEXT-COMPACTION §7 D-C1): a failed compression is surfaced to the panel;
        // COMPRESS_FAILURE_LIMIT consecutive failures still degrade to compressFallback.
        callbacks?.onCompressFail?.(compressError)
        if (agent._compressFailures >= COMPRESS_FAILURE_LIMIT) {
          agent._compressFailures = 0
          if (compressFallback(agent)) callbacks.onCompress?.(agent._lastCompressInfo ?? {})
        }
      }
    }

    // Plan-mode reminder cadence: re-inject constraint reminders while plan mode is active
    // (sparse every 2 turns, full every 5 / on new user message) so the restriction never fades.
    if (agent.planMode) {
      const lastMsg = agent.history.at(-1)
      const realUserMsg = lastMsg?.role === "user"
        && typeof lastMsg.content === "string"
        && !lastMsg.content.startsWith("[System reminder:")
        && !lastMsg.content.startsWith("[User interrupt:")
      const newUserSince = realUserMsg && agent.history.length > (agent._planReminderAtLen ?? 0)
      const { planReminderForTurn } = await import("./agent-tools/plan.mjs")
      const reminder = planReminderForTurn(agent, newUserSince)
      if (reminder) {
        agent._planReminderAtLen = agent.history.length + 1
        agent.history.push({ role: "user", content: reminder, transient: true })
      }
    }

    // Engineering-mode status injection on every new user message (design-before-code
    // vs standard discipline) — see injectEngineeringReminder.
    if (depth === 0) {
      injectEngineeringReminder(agent)
    }

    const messages = [{ role: "system", content: systemPrompt }, ...agent.history]
    let response

    // Auto-think: classify difficulty and set reasoning effort on turn 0; silent on failure.
    if (agent.config?.agent?.autoThink && turn === 0) {
      const { classifyAndApply } = await import("./auto-think.mjs")
      await classifyAndApply(agent, turn).catch(() => {})
    }

    if (process.env.ADVISOR_DEBUG) console.error("[chat-call]", JSON.stringify({ turn, histLen: agent.history.length, lastRole: agent.history.at(-1)?.role }))
    try {      response = await chat(agent.provider, {
        messages, tools: toolSchemas,
        onToken: callbacks.onToken,
        onReasoning: callbacks.onReasoning,
        onWait: callbacks.onWait,
        signal,
        streamRules: agent.config.agent?.streamRules ?? [],
        firedPatterns: streamRuleFired,
      })
    } catch (e) {
      // User interrupt (Ctrl+I): controller.abort({ interrupt: true, message }).
      // Inject into history; the outer loop recreates the controller and resumes.
      if (e.name === "AbortError" && signal?.reason?.interrupt) {
        const msg = `[User interrupt: ${signal.reason.message}]`
        // Dedup: if already handled during tool execution (interrupt branch below),
        // don't push a duplicate — the outer loop still recreates the controller.
        if (agent.history.at(-1)?.content !== msg) {
          agent.history.push({ role: "user", content: msg })
        }
      }
      throw e
    }

    // 内置工具（Responses web_search）结果本地化：服务端已执行——入历史为 tool 消息；
    // 服务端 item id 是 msg_xxx 非 web_search_call_ 前缀——必须合成前缀（toItems 识别锚点），
    // 原始 id 存入 content（真机冒烟 2026-08-31 验证）。
    for (const btr of response.builtinToolResults ?? []) {
      if (!btr?.id) continue
      pushReal(agent, {
        role: "tool",
        tool_call_id: `web_search_call_${btr.id}`,
        content: JSON.stringify({ id: btr.id, query: btr.query ?? "", sources: btr.sources ?? [], status: btr.status ?? "completed" }),
      })
    }

    // Stream rule triggered mid-generation (action: "abort"): halt, inject the rule's
    // message as a reminder, retry from the same context.
    if (response.ruleTriggered) {
      if (response.content) {
        pushReal(agent, { role: "assistant", content: response.content })
      }
      const label = response.ruleName ? ` — stream rule "${response.ruleName}"` : ""
      agent.history.push({
        role: "user",
        content: `[System reminder${label}: ${response.ruleMessage}]`,
      })
      continue
    }

    // Stream rule warnings (action: "warn"): stream completed; inject de-duplicated
    // warnings so the model sees them before its next response.
    if (response._warnings?.length) {
      const deDuplicated = [...new Map(response._warnings.map(w => [w.name || w.pattern, w])).values()]
      agent.history.push({
        role: "user",
        content: `[System reminder — stream rule warnings from your last response:\n${deDuplicated.map(w => `- ${w.name || w.pattern}: ${w.message}`).join("\n")}]`,
      })
    }

    // User interrupted mid-generation (Ctrl+I): commit partial output + inject the
    // message, then signal the outer loop to recreate the controller and resume.
    if (response.interrupted) {
      if (response.content) {
        pushReal(agent, { role: "assistant", content: response.content })
      }
      agent.history.push({
        role: "user",
        content: `[User interrupt: ${response.interruptMessage}]`,
      })
      throw Object.assign(new Error("User interrupted"), { name: "AbortError" })
    }

    if (response.usage) {
      callbacks.onUsage?.(response.usage)
      if (response.usage.prompt_tokens != null) {
        agent._lastPromptTokens = response.usage.prompt_tokens
        agent._usageAtLen = agent.history.length
      }
    }

    // Warn on abnormal finish reasons — the response may be incomplete/truncated.
    if (response.finishReason && response.finishReason !== "stop" && response.finishReason !== "tool_calls") {
      const reasonMap = {
        length: "output token limit reached after exhausting continuations",
        insufficient_system_resource: "provider inference resources exhausted — consider retrying or switching models",
        content_filter: "response blocked by provider content filtering",
      }
      const detail = reasonMap[response.finishReason] || `unknown reason "${response.finishReason}"`
      agent.history.push({
        role: "user",
        content: `[System reminder: the previous turn ended abnormally — ${detail}. The assistant response that follows may be incomplete.]`,
      })
    }

    if (response.toolCalls.length === 0) {
      const cr = handleCompletion(agent, response, depth, turn, guardPushbacks, honestReminderInjected, advisorPushbacks, callbacks)
      guardPushbacks = cr.guardPushbacks
      honestReminderInjected = cr.honestReminderInjected
      advisorPushbacks = cr.advisorPushbacks
      if (cr.action === "continue") continue
      if (depth === 0) {
        // End-of-run exploration distillation (CONTEXT-COMPACTION §5 + SEND-STALL-DISTILL
        // §2.1): async — the promise hangs on _pendingDistill, settling at the next run's
        // start or the TUI exit flush. Silent (N3): failure never blocks return/history.
        const distill = summarizeRunExplorations(agent, callbacks, signal).catch(() => {})
        agent._pendingDistill = distill
      }
      return cr.content
    }

    // abort after chat completes, before committing history: don't commit a half-finished turn
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError")

    pushReal(agent, {
      role: "assistant",
      content: response.content || null,
      tool_calls: response.toolCalls.map((tc) => ({
        id: tc.id, type: "function",
        function: { name: tc.name, arguments: tc.arguments },
      })),
      ...(response.reasoning && specForModel(agent.provider.model).reasoningEcho === "required"
        ? { reasoning_content: response.reasoning }
        : {}),
    })

    const results = await executeToolCalls(agent, toolByName, response.toolCalls, callbacks, depth, signal)

    // Ctrl+I interrupt during tool execution: skip committing partial results — inject
    // the interrupt and retry (placeholder results keep strict providers pairable).
    if (signal?.reason?.interrupt) {
      // 中断变更记账（2026-08-31 评审 #4）：此分支的工具已全部执行完成（磁盘已变，execute 已完成），
      // 真实结果按语义不进历史（placeholder 替代）——但变更必须记账：否则 guard 看到
      // "本轮未改代码" 放行，评审/verify 门禁被绕过（文件改了却没评审）。
      for (const { toolCall, ok } of results) {
        const tool = toolByName.get(toolCall.name)
        if (!ok || !tool || !FILE_MUTATORS.has(toolCall.name)) continue
        agent._mutatedThisRun = true
        agent._calledAdvisorThisRun = false
        agent._verifiedThisRun = false
        agent._verifyPassed = undefined
        try {
          const args = JSON.parse(toolCall.arguments)
          const paths = tool.touchedPaths ? tool.touchedPaths(args) : [args.path]
          for (const p of paths) {
            const abs = join(agent.cwd, p)
            if (!agent._touchedFiles.includes(abs)) agent._touchedFiles.push(abs)
          }
        } catch { /* 畸形 args 不影响记账（touchedFiles 尽力而为） */ }
      }
      // The assistant tool_calls were committed above — synthesize placeholder tool
      // results BEFORE the interrupt message (strict providers 400 on dangling
      // tool_calls; consult P1, 2026-08-30).
      for (const tc of response.toolCalls) {
        agent.history.push({ role: "tool", tool_call_id: tc.id, content: "[Tool execution interrupted — results discarded]" })
      }
      agent.history.push({
        role: "user",
        content: `[User interrupt: ${signal.reason.message}]`,
      })
      callbacks.onTurnEnd?.(agent, turn)
      continue
    }

    // Model is executing tools → real work: reset guard pushback counters
    guardPushbacks = 0
    advisorPushbacks = 0

    // Commit tool results (pairing, multimodal deferral, mutation accounting, reindex)
    await recordToolResults(agent, toolByName, results)

    injectPostTurn(agent, results, recentCallSigs, callbacks, turn)
    }

    throw new ContinueError(maxTurns)
  } catch (e) {
    thrownError = e
    throw e
  } finally {
    // Turn-end cleanup: abort any leftover consultation children (consult_start spawns
    // fire-and-forget runners; a completed turn must not let them keep burning tokens).
    cleanupConsultSessions(agent)
    // Async subagent turn-end handling (AGENT-LOOP.md §15 D-A3 + §17 D-S1). Lifecycle:
    // - Ctrl+C (plain abort): children were aborted with the parent signal — clear
    //   WITHOUT injecting stale errors (user explicitly stopped). Ctrl+I (interrupt)
    //   keeps the pool: the turn resumes with the interrupt message, children stay
    //   tracked (in a suspension session children hold agent._sessionSignal and a
    //   digest's own Ctrl+I must not orphan them).
    // - ContinueError (turn cap): no wait, no injection — children keep running and
    //   the RESUME run's turn-end collection takes over.
    // - anything else: inject the SETTLED entries only; running/queued stay in the
    //   pool for the suspension session (D-S1 — no allSettled turn-end wait).
    if (signal?.aborted && !signal?.reason?.interrupt) {
      agent._asyncSubagents?.clear()
      agent._asyncQueue = []
      agent._asyncCheckLastN = 0
    } else if (thrownError instanceof ContinueError) {
      // keep _asyncSubagents + the check counter — the resumed run continues them
    } else {
      await collectSettledAsync(agent)
      agent._asyncCheckLastN = 0
    }
    agent._inAutoTurn = false
    // §17 D-S6: auto-turn guard marks survive into the next USER run (restored at its
    // !resume reset above). Normal ends only — abort discards; ContinueError lets the
    // auto-resumed run snapshot at its own end.
    if (autoTurn && !(signal?.aborted && !signal?.reason?.interrupt) && !(thrownError instanceof ContinueError)) {
      agent._inheritedGuard = {
        _mutatedThisRun: agent._mutatedThisRun, _verifiedThisRun: agent._verifiedThisRun,
        _verifyPassed: agent._verifyPassed, _calledAdvisorThisRun: agent._calledAdvisorThisRun,
        _touchedFiles: agent._touchedFiles, _verifyRetries: agent._verifyRetries,
        _advisorRound: agent._advisorRound,
      }
    }
  }
}

/**
 * Turn-end async subagent collection (AGENT-LOOP.md §17 D-S1): inject every entry
 * that SETTLED during this run (XML-escaped report/error — child reports may carry
 * file/webpage content; >64K offloaded with preview + path) and remove it from the
 * pool. Running/queued STAY — no allSettled wait: the suspension loop digests them
 * as they settle (D-S2/D-S9). Refill starts queued heads whose slot freed this run.
 * Single ownership: entries settled inside a suspension session were moved to
 * _pendingAsyncResults by the settle callback, so this only sees user-turn settles
 * (no double inject — D-S3 points ①/②). The ⟦ev⟧done freeze is NOT emitted here —
 * each settle callback emits it (§15 D-A3). */
async function collectSettledAsync(agent) {
  const map = agent._asyncSubagents
  if (!map || map.size === 0) return
  const { maybeRefillAsync, injectAsyncResult } = await import("./agent-tools/subagent.mjs")
  maybeRefillAsync(agent) // start queued heads now that slots may have freed — no waiting
  for (const e of [...map.values()]) {
    if (!e.done) continue // still running — stays in the pool (D-S1)
    await injectAsyncResult(agent, e)
    map.delete(String(e.id))
  }
}
