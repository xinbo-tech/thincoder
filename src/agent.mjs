/**
 * agent.mjs — Agent main loop
 * LLM ↔ tool-call loop, until the task is done.
 */
import { chat } from "./provider/index.mjs"
import { pushReal, summarizeRunExplorations } from "./context.mjs"
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
// 主循环阶段函数（压缩检查/注入组/回合收尾）2026-09-05 实践轮迁 agent/run-stages.mjs
import { runCompactionCheck, injectTurnReminders, finalizeAgentTurn, injectResponseReminders } from "./agent/run-stages.mjs"
import {
  escapeXml, repairHistory, listWorkDir,
  readonlyToolNames, collectGitContext, loadProjectInstructions,
  ContinueError,
  DEFAULT_MAX_TURNS, DEFAULT_SUBAGENT_TURNS,
  MIN_REPORT_CHARS, REPORT_CONTINUATION,
  AUTO_TURN_DIGEST_DOMAIN,
} from "./agent/helpers.mjs"
// ENG 提醒族 + auto-turn domain 2026-09-05 迁 agent/helpers.mjs（agent.mjs 530 > 500 硬限）
// overlay 载荷（explore/coder/plan/eng-coder/consult）迁 prompt-overlays.mjs——re-export 保面
export {
  EXPLORE_OVERLAY, CODER_OVERLAY, PLAN_OVERLAY, ENG_CODER_OVERLAY, CONSULT_BASE,
} from "./prompt-overlays.mjs"
export { ENG_ON_REMINDER, ENG_OFF_REMINDER } from "./agent/helpers.mjs"

// Prompt files (byte-stable, loaded once)
const __dirname = dirname(fileURLToPath(import.meta.url))
const SYSTEM_PROMPT = readFileSync(join(__dirname, "prompts", "system.md"), "utf8")
const DISCIPLINE_RULES = readFileSync(join(__dirname, "prompts", "discipline.md"), "utf8")
const MAIN_OVERLAY = readFileSync(join(__dirname, "prompts", "main.md"), "utf8")

// exported for consumption by agent-tools.mjs
export {
  ContinueError,
  listWorkDir, loadProjectInstructions,
  readonlyToolNames, collectGitContext, escapeXml,
  MIN_REPORT_CHARS, REPORT_CONTINUATION, DEFAULT_SUBAGENT_TURNS,
}


// Re-exported for API compatibility (single source of truth: advisor/repos.mjs)
export { hasCodeMutations } from "./advisor/repos.mjs"

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
export async function runAgent(agent, input, callbacks = {}, { depth = 0, signal, maxTurns: overrideTurns, resume = false, autoTurn = false, suspDriven = false } = {}) {
  // Previous run's async exploration distillation must settle before this run pushes
  // input (SEND-STALL-DISTILL §2.2 N1) — await first, or its history replace wipes it.
  if (agent._pendingDistill) {
    const p = agent._pendingDistill
    agent._pendingDistill = null
    await p
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
      agent._asyncCheckLastN = 0 // check action read counter is per-run (§15 D-A2): a fresh user turn restarts from 1
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
    // §18.6 D-TR4：compress 轨迹 depth 元数据（runAgent 的 depth 在此作用域——
    // context.mjs compressIfNeeded 经 extras 透出到 logCtx）
    traceDepth: depth,
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
      // 2026-09-05 实践轮：压缩检查/降级计数提为 runCompactionCheck（agent/run-stages.mjs——
      // CLI 对位 VS run-stages）——循环骨架此处只剩检查调用（recentCallSigs 对象引用回流）。
      await runCompactionCheck(agent, { threshold, callbacks, compactionOverhead, signal, recentCallSigs })
    }

    // 2026-09-05 实践轮：plan cadence + eng 状态注入提为 injectTurnReminders（run-stages）
    await injectTurnReminders(agent, { depth })

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
        // LOGGING（LOGGING.md）：llm:* 事件的语义上下文（stage=turn 主循环回合——含
        // digest 消化轮 auto=true；child=子代理 id（spawn 时 stamp 于 child._logId））
        // §18.6 D-TR4：轨迹元数据增补（role/depth/kind/session/cwd——trace-store 只读
        // logCtx，签名不变）；kind：depth>0 = subagent（consult 孩子 = consult）——子代理
        // 对回靠 role+depth+child id（children 无 _sessionStart——不经 depth-0 设置——
        // session 字段对子代理轨迹为 null——见 trace-store/agent.mjs 注释）。
        logCtx: {
          stage: "turn", turn: turn + 1, auto: autoTurn, child: agent._logId,
          role: agent._role ?? null,
          depth,
          kind: depth > 0 ? (agent._role === "consult" ? "consult" : "subagent") : "turn",
          session: agent._sessionStart ?? null,
          cwd: agent.cwd,
          traces: agent.config?.traces?.enabled !== false,
        },
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

    // Stream rule warnings / finish-reason 警告（2026-09-05 实践轮——提为
    // injectResponseReminders，agent/run-stages.mjs——verbatim，语义零变）
    injectResponseReminders(agent, response)

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
    // 2026-09-05 实践轮：finish-reason 注入随流规则警告提为 injectResponseReminders。

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
        // §18.6 D-TR4：depth 透传（distill 轨迹元数据——与 compress 同通道）
        const distill = summarizeRunExplorations(agent, callbacks, signal, depth).catch(() => {})
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
    // 2026-09-05 实践轮：回合收尾（consult 清理/async 池分流/guard 继承——原 425-462
    // 段 + collectSettledAsync 466-494 整体迁 agent/run-stages.mjs finalizeAgentTurn——
    // CLI 对位 VS run-stages——finally 只剩一行调用 + 骨架注释）。
    await finalizeAgentTurn(agent, { signal, autoTurn, suspDriven, thrownError })
  }
}
