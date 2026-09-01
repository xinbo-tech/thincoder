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
  ContinueError, offloadToolResult,
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
export async function runAgent(agent, input, callbacks = {}, { depth = 0, signal, maxTurns: overrideTurns, resume = false } = {}) {
  // Previous run's async exploration distillation must settle before this run pushes new
  // input (SEND-STALL-DISTILL §2.2, N1): the compressed machine line is this run's starting
  // point — await BEFORE prepareRun, or the history replacement would wipe the new input.
  if (agent._pendingDistill) {
    const p = agent._pendingDistill
    agent._pendingDistill = null
    await p
  }
  const { maxTurns, threshold, tools, toolSchemas, toolByName, systemPrompt } = await prepareRun(
    agent, input, callbacks,
    { depth, signal, overrideTurns, resume, systemPrompt: SYSTEM_PROMPT, disciplineRules: DISCIPLINE_RULES, mainOverlay: MAIN_OVERLAY },
  )

  // End-of-run exploration distillation boundary (CONTEXT-COMPACTION §5): prepareRun has already
  // pushed the user input + injections, so everything appended from here is "this run's" work.
  agent._runStartHistoryLen = agent.history.length

  // Per-run bookkeeping reset. On `resume` (ContinueError continuation) these are
  // PRESERVED: the resumed run must keep mutation tracking so the advisor/verify
  // guards stay active (a guard pushback on the last turn must not silently vanish),
  // and the convergence budget must not be resettable by continuing the session.
  if (!resume) {
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
  // eng-coder authorization is set by subagent.mjs AFTER token validation but BEFORE runAgent —
  // only reset for the top-level agent (depth 0); child runs must keep their granted authorization
  if (depth === 0) agent._engDesignReviewed = false
  // _engDesignToken survives across turns within the same agent (design review → user approval → spawn eng-coder).
  // Lifecycle: invalidated on a failed re-review (advisor.mjs), issued on a passing review.
  let guardPushbacks = 0
  let advisorPushbacks = 0
  let honestReminderInjected = false
  const recentCallSigs = []
  // repeat: "once" stream rules fire at most once per runAgent call (user turn):
  // this set survives across chat() calls (rule abort-retry, tool loop) within the turn.
  const streamRuleFired = new Set()

  // Compaction overhead for the pure-estimation path: system prompt + tools schema are
  // part of every request but not in history — without them the first-turn/restored/just-
  // compacted estimate under-counts and may never trigger compaction. Measured baseline
  // path already includes both (prompt_tokens is the full context), so this only applies
  // when _lastPromptTokens is null.
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
    // D2 (AGENT-LOOP.md §7.2): depth>0 children emit a ⟦ev⟧turn progress token on every
    // turn — a single emit point covering all three spawn tools (natural heartbeat for the
    // TUI subagent block header: "turn N/max"). phase=llm (tool/done progress rides the
    // existing onToolCall/onToolResult prefix relay — no token for those).
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
          // Completion info (CONTEXT-COMPACTION §7 D-C2): { mode: "summary", tokensFreed, elapsedMs }
          // from compressIfNeeded, or { mode: "fallback", tailMessages } from compressFallback below —
          // the TUI panel renders the matching completion state. Existing callers that ignore the
          // argument keep the exact previous onCompress semantics.
          callbacks.onCompress?.(agent._lastCompressInfo ?? {})
          ensureAutoReminder(agent)
        }
      } catch (compressError) {
        // AbortError must not be swallowed: user cancellation must propagate
        if (compressError?.name === "AbortError" || signal?.aborted) throw compressError
        agent._compressFailures = (agent._compressFailures ?? 0) + 1
        // Q3 visibility (CONTEXT-COMPACTION §7 D-C1): a failed compression is no longer silent —
        // the frontend updates the compression panel with the error text (and logs to stderr).
        // Failure STRATEGY is unchanged: COMPRESS_FAILURE_LIMIT consecutive failures still degrade
        // to compressFallback — this only adds observability.
        callbacks?.onCompressFail?.(compressError)
        if (agent._compressFailures >= COMPRESS_FAILURE_LIMIT) {
          agent._compressFailures = 0
          if (compressFallback(agent)) callbacks.onCompress?.(agent._lastCompressInfo ?? {})
        }
      }
    }

    // Plan-mode reminder cadence: re-inject constraint reminders while plan mode is active
    // (sparse every 2 turns, full every 5 turns or when the user sends a new message),
    // so the read-only restriction never fades from context.
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

    // Engineering-mode status injection: every new user message carries a
    // reminder so the model always knows whether it's in design-before-code
    // mode or standard discipline mode.
    if (depth === 0) {
      injectEngineeringReminder(agent)
    }

    const messages = [{ role: "system", content: systemPrompt }, ...agent.history]
    let response

    // Auto-think: classify task difficulty and set reasoning effort before the real prompt.
    // Runs only on turn 0 of user input; failure is silent — falls back to current setting.
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
      // User interrupt (Ctrl+I): controller.abort({ interrupt: true, message: "…" }).
      // Inject the message into history and let the outer loop recreate the controller.
      if (e.name === "AbortError" && signal?.reason?.interrupt) {
        const msg = `[User interrupt: ${signal.reason.message}]`
        // Dedup: if the interrupt was already handled during tool execution (L302-310),
        // don't push a duplicate — the outer loop will still recreate the controller.
        if (agent.history.at(-1)?.content !== msg) {
          agent.history.push({ role: "user", content: msg })
        }
      }
      throw e
    }

    // 内置工具（Responses web_search）结果本地化：服务端已执行——入历史为 tool 消息，
    // 模型下一轮可见；全量回传时 transport 依 tool_call_id 前缀还原 web_search_call item。
    // 注意：服务端 item id 是 msg_xxx 非 web_search_call_ 前缀——必须合成前缀（toItems 识别锚点），
    // 原始 id 存入 content（真机冒烟 2026-08-31：直接用 msg_xxx 会被转成 function_call_output
    // 与服务端不配对，属蒙对）。
    for (const btr of response.builtinToolResults ?? []) {
      if (!btr?.id) continue
      pushReal(agent, {
        role: "tool",
        tool_call_id: `web_search_call_${btr.id}`,
        content: JSON.stringify({ id: btr.id, query: btr.query ?? "", sources: btr.sources ?? [], status: btr.status ?? "completed" }),
      })
    }

    // Stream rule triggered mid-generation (action: "abort"): halt current output,
    // inject rule's message as a reminder, and retry from the same context.
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

    // Stream rule warnings (action: "warn"): the stream completed, but one or more
    // non-interrupting rules matched. Inject warnings after the turn so the model
    // sees them before its next response — without aborting mid-generation.
    if (response._warnings?.length) {
      const deDuplicated = [...new Map(response._warnings.map(w => [w.name || w.pattern, w])).values()]
      agent.history.push({
        role: "user",
        content: `[System reminder — stream rule warnings from your last response:\n${deDuplicated.map(w => `- ${w.name || w.pattern}: ${w.message}`).join("\n")}]`,
      })
    }

    // User interrupted mid-generation (Ctrl+I): the SSE stream was aborted while content
    // was partially generated. Commit partial output + inject user message, then signal
    // the outer loop to recreate the controller and resume.
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

    // Warn on abnormal finish reasons — the model stopped for a reason other than
    // "stop" or "tool_calls", meaning the response may be incomplete or truncated.
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
        // End-of-run exploration distillation (CONTEXT-COMPACTION §5): this run's inline
        // exploration results become one semantic note before the final return. Async
        // (SEND-STALL-DISTILL §2.1): the turn-end signal goes out first — the promise hangs
        // on agent._pendingDistill and settles at the next runAgent's start or the TUI's
        // exit flush. Silent (N3): distillation failure must never block the return or lose
        // history.
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

    // Ctrl+I interrupt during tool execution: skip committing partial results —
    // the tool failure messages would mislead the model. Inject the interrupt and retry.
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
      // The assistant tool_calls were already committed above (L347) — a strict
      // provider 400s on dangling tool_calls, so synthesize placeholder tool
      // results BEFORE the interrupt message (tool result must immediately
      // follow its assistant tool_calls). The retry turn then sees a clean,
      // pairable history (consult P1, 2026-08-30).
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

    // Model is executing tools → doing real work, reset guard pushback counter
    guardPushbacks = 0
    advisorPushbacks = 0

    // Commit tool results (pairing, multimodal deferral, mutation accounting,
    // touched files, reindex) — split into record-results.mjs (consult P2,
    // 2026-08-30).
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
    // Async subagent turn-end collection (AGENT-LOOP.md §15 D-A3). Lifecycle:
    // - Ctrl+C / Ctrl+I (signal aborted): children were aborted with the parent
    //   signal — clear WITHOUT injecting stale errors (user explicitly stopped).
    // - ContinueError (turn cap): no wait, no injection — children keep running
    //   and the RESUME run's turn-end collection takes over.
    // - anything else: refill loop → wait for all → inject reports → clear.
    if (signal?.aborted) {
      agent._asyncSubagents?.clear()
      agent._asyncQueue = []
      agent._asyncCheckLastN = 0
    } else if (thrownError instanceof ContinueError) {
      // keep _asyncSubagents + the check counter — the resumed run continues them
    } else {
      await collectAsyncSubagents(agent, callbacks)
      agent._asyncCheckLastN = 0
    }
  }
}

/**
 * Turn-end async subagent collection (AGENT-LOOP.md §15 D-A3):
 * 1. refill loop — start queued heads while slots free (each settle already
 *    refills via its finally; this drains the tail), keeping the cap ≤4 serial.
 * 2. wait for every entry to settle (queued entries start through the refill
 *    chain — the drain loop converges when nothing is running and the queue is empty).
 * 3. inject one user-role reminder per entry: the report/error text XML-escaped
 *    (child reports may carry content from files/webpages — reminder discipline),
 *    >64K offloaded to disk with a preview + path.
 * 4. clear the map (and emit ⟦ev⟧done tokens so the TUI freezes the child blocks).
 */
async function collectAsyncSubagents(agent, callbacks) {
  const map = agent._asyncSubagents
  if (!map || map.size === 0) return
  const { maybeRefillAsync } = await import("./agent-tools/subagent.mjs")
  for (;;) {
    maybeRefillAsync(agent)
    const running = [...map.values()].filter((e) => e.status === "running")
    if (running.length === 0) break
    await Promise.allSettled(running.map((e) => e.promise))
  }
  for (const e of [...map.values()]) {
    callbacks.onToken?.(`${e.relayPrefix}⟦ev⟧done\x1e0\x1e0\x1edone\x1e`)
    const body = e.error ?? e.report ?? "(no report)"
    const preview = await offloadToolResult(String(body), `async-subagent-${e.id}`)
    pushReal(agent, {
      role: "user",
      content: `[System reminder: async subagent #${e.id} (${e.role}) finished]\n${escapeXml(preview)}`,
    })
  }
  map.clear()
  agent._asyncQueue = []
}
