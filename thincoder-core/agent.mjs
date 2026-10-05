/**
 * agent.mjs — Agent main loop
 * LLM ↔ tool-call loop, until the task is done.
 */
// PROMPT-SYSTEM 施工② G1（2026-09-10）：六件槽位常量装载收口 prompt-overlays.mjs
// （与子代理角色常量同源——单一权威锚 D1）；旧三件文件读取随本批退役。
// 槽位常量通过下方 re-export 面（mod: rel — re-export 保 import 面）；本文件自身零直接消费。
// 主循环阶段函数（压缩检查/注入组/回合收尾）2026-09-05 实践轮迁 agent/run-stages.mjs
// 2026-09-29 P2 三拆（#579）：起跑前段 ∕ 回合环 ∕ 模型调用逐字迁 agent/run-start.mjs ∕
// agent/turn-loop.mjs ∕ agent/chat-call.mjs——本档残留 = 编排 + 状态工厂 + 面（re-export 保面）。
import { beginRun } from "./agent/run-start.mjs"
import { runTurnLoop } from "./agent/turn-loop.mjs"
import { finalizeAgentTurn } from "./agent/run-stages.mjs"
import {
  escapeXml, listWorkDir,
  readonlyToolNames, collectGitContext, loadProjectInstructions,
  ContinueError,
  DEFAULT_MAX_TURNS, DEFAULT_SUBAGENT_TURNS,
  MIN_REPORT_CHARS, REPORT_CONTINUATION,
  SUBAGENT_TOOL_EXCLUSIONS, excludeSubagentTools, // TOOLS.md §6.16：子代面按面排除（helpers 单源）
} from "./agent/helpers.mjs"
// ENG 提醒族 + auto-turn domain 2026-09-05 迁 agent/helpers.mjs（agent.mjs 530 > 500 硬限）
// PROMPT-SYSTEM 施工② G1（2026-09-10）：六件槽位常量装载收口 prompt-overlays.mjs
// （与子代理角色常量同源——单一权威锚 D1）；本文件 re-export 保 import 面。
export {
  PERSONA_ENGINEERING, PERSONA_NORMAL, COMMON,
  DISCIPLINE_ENGINEERING, DISCIPLINE_NORMAL,
  CONSULT_BASE,
} from "./prompt-overlays.mjs"
export { ENG_ON_REMINDER, ENG_OFF_REMINDER } from "./agent/helpers.mjs"

// Role → persona slot mapping note（施工② G3）: 子代理人格由 assemblePrompt 场景表按
// role 承载（persona-explore/coder/plan/eng-coder.md——D1 表 = 蓝图 §3.2 1:1）；
// spawn 侧 overlay 概念已退役（prompt-overlays.mjs 不再导出 OVERLAY 别名常量）。

// exported for consumption by agent-tools.mjs
export {
  ContinueError,
  listWorkDir, loadProjectInstructions,
  readonlyToolNames, collectGitContext, escapeXml,
  MIN_REPORT_CHARS, REPORT_CONTINUATION, DEFAULT_SUBAGENT_TURNS,
  SUBAGENT_TOOL_EXCLUSIONS, excludeSubagentTools, // TOOLS.md §6.16（子代装配点从本档取用）
}


// Re-exported for API compatibility (single source of truth: advisor/repos.mjs)
export { hasCodeMutations } from "./advisor/repos.mjs"
// 流式输出门（§2.5 #78）2026-09-29 P2 三拆随 agent/chat-call.mjs 迁出——re-export 保 import 面
export { streamOutputAllowed } from "./agent/chat-call.mjs"

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
    // DESIGN-TOKEN-SETTLEMENT D3 (2026-09-08): single-value `_engDesignToken` mirror retired
    // (AC3 零写) — no field initializer; the multi-slot Map `_engDesignTokens` is the
    // authoritative ledger (hydrated by restoreEngTokens / written by settle).
    _touchedFiles: [], _verifyRetries: 0, _advisorRound: 0, _advisorSession: null,
    _advisorRuns: new Map(), // AGENT-LOOP-ASYNC-POOL.md §6.10 D-24b: per-review convergence instances (rounds/prior/designId)
    _mutationSeq: 0, _mutLog: [], // AGENT-LOOP-ASYNC-POOL.md §6.10 D-24b: mutation log (in-flight review staleness scan)
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
export async function runAgent(agent, input, callbacks = {}, { depth = 0, signal, maxTurns: overrideTurns, resume = false, autoTurn = false, upstreamTurn = false, timerTurn = false, suspDriven = false, consumeInjected = null, consumeQueuedInput = null, streamOutput = false, extraTools = null, injections = null, turnDomainText = null, distillSignal = null, toolDecorate = undefined } = {}) {
  const { maxTurns, threshold, toolSchemas, toolByName, systemPrompt } = await beginRun(agent, input, callbacks, {
    depth, signal, overrideTurns, resume, autoTurn, upstreamTurn, timerTurn, extraTools, injections, turnDomainText, toolDecorate,
  })

  let thrownError = null
  try {
    return await runTurnLoop(agent, {
      maxTurns, threshold, toolSchemas, toolByName, systemPrompt,
      depth, signal, autoTurn, streamOutput, consumeInjected, consumeQueuedInput, callbacks, distillSignal,
    })
  } catch (e) {
    thrownError = e
    throw e
  } finally {
    // 2026-09-05 实践轮：回合收尾（consult 清理/async 池分流/guard 继承——原 425-462
    // 段 + collectSettledAsync 466-494 整体迁 agent/run-stages.mjs finalizeAgentTurn——
    // CLI 对位 VS run-stages——finally 只剩一行调用 + 骨架注释）。
    await finalizeAgentTurn(agent, { signal, autoTurn, upstreamTurn, timerTurn, suspDriven, thrownError, depth })
  }
}
