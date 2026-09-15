/**
 * agent.mjs — Agent loop for VS Code context (full thincoder feature set: subagents,
 * plan mode, goal tracking, verify guard; setup lives in agent/setup.mjs).
 */
import { chat } from "@thincoder/core/provider/core.mjs"
import { specForModel } from "./specs.mjs"
import { traceStop } from "./extension/stop-trace.mjs"
import {
  MAX_ADVISOR_PUSHBACKS, MAX_VERIFY_PUSHBACKS, MAX_VERIFY_RETRIES, MAX_EMPTY_RETRIES,
  configuredMaxTurns, hasCodeMutations,
  pushReal, agentState, turnFrame,
} from "./agent/run-helpers.mjs"
import { MAX_ADVISOR_ROUNDS } from "./advisor/run.mjs"
import { executeToolBatches } from "./agent/execute-tools.mjs"
import { hydrateRun, setupAgentRun } from "./agent/setup.mjs"
import { AUTO_REMINDER, ENG_OFF_REMINDER, ENG_ON_REMINDER, injectEngineeringReminder } from "./agent/setup-reminders.mjs"
// 主循环阶段函数（压缩检查/蒸馏发射/回合收尾/响应提醒）2026-09-05 实践轮迁 agent/run-stages.mjs
import { checkAndCompact, fireEndOfRunDistill, finalizeAgentTurn, injectResponseReminders, maybeGuardPushbacks } from "./agent/run-stages.mjs"
// D-CI4（VSC-CONTEXT-PARITY §17.3）：plan-mode 节律常量/计数（W9 起 = 核单源 agent-tools/plan.mjs）
import { planReminderForTurn } from "@thincoder/core/agent-tools/plan.mjs"

/** Manual-tier auto-turn digest domain (AGENT-LOOP.md §17 D-S6): organize-only.
 *  Injected per manual auto-turn run — writes/execute/spawns/questions are also
 *  mechanically denied (deny-stub permission/question handlers + the spawn gate in
 *  subagent.mjs); this reminder steers the model before it hits those denials.
 *  §9 D-24b（R13——2026-09-06）：async advisor review 报告同此消化通道——呈递发现与
 *  修复建议（不擅自动手——修正轮由用户裁决后发起）。 */
const AUTO_TURN_DIGEST_DOMAIN =
  "[System reminder: auto-turn — background async subagents / consultations / escalate reports / advisor reviews finished while there was no user message, and this turn runs automatically to digest their reports (the finished-report reminders above). No one is waiting for this reply, so organize only: 1) summarize each finished report's key points into this conversation for the user to read later (async advisor review reports: present the findings and suggested fixes verbatim — do not apply them; consultation reports: present each reply verbatim with your per-reply adoption judgment as text — do not apply anything; escalate reports: summarize the merged post-op work — further changes need a user message); 2) update the task list with the task tool (allowed) to mark finished work done; 3) write decision points with a suggested next step as text — do not execute it. FORBIDDEN this turn (mechanically enforced): modifying files, bash/execute/verify, spawning subagents, asking questions — those need a real user message. End the turn once the summaries are written.]"

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
  // ASYNC-RESULT-CONTAINER.md D2（2026-09-08）：pending 单容器 +role——四族（subagent/
  // advisor/escalate/consult）统一停靠同一容器（_pendingAdvisorResults/
  // _pendingEscalateResults/_pendingConsultResults 独立族废弃），注入器按 role 分发
  // （injectPendingAsync——async-settle.mjs）。splice 即 consumed——单注入点——注入一次。
  if (depth === 0 && Array.isArray(opts.history?._pendingAsyncResults)) {
    const hist = opts.history
    const pend = hist._pendingAsyncResults
    if (pend.length > 0) {
      const { injectPendingAsync } = await import("./agent-tools/async-settle.mjs")
      for (const e of pend.splice(0)) await injectPendingAsync(e, { history: hist, fullHistory: opts.fullHistory ?? hist, cwd })
    }
  }

  // AGENT-LOOP.md §11（2026-09-08——agent 生命周期对齐 CLI）：顶层 agent 会话级单例复用。
  // opts.agent（仅 depth-0 honored）存在 → hydrateRun 复用同一对象（面板多回合/续跑共享——
  // AC1/F1——resume 迭代传同一 opts.agent）；缺省（首轮/destroy 重建/子代理/直连）→
  // setupAgentRun = factory 新建 + hydrate（restore:true——§11.2.1 槽字段回填）。复用与新建
  // 都走 hydrateRun：其内部先 resetRunState（§11.2 A 清单——顺序纪律：复位在 hydrate 内、
  // 先于下方 inheritedGuard 应用——guard 标记继承到"复位过的"下一 run）。
  const existingAgent = (depth === 0 && opts.agent) || null
  const { agent, history, fullHistory, toolByName, toolSchemas, cfgVerifyGuard, cfgCompactThreshold, systemPrompt } =
    await (existingAgent
      ? hydrateRun(existingAgent, { provider, cwd, input, opts, depth, role, getAuto })
      : setupAgentRun({ provider, cwd, input, opts, depth, role, getAuto }))
  // §11 write-back：把建好的顶层单例写回调用方 opts（panel-chat 的 runOpts 对象跨续跑迭代
  // 存活——下轮 hydrate 复用同一对象；panel._agent 同步是调用方职责——ensurePanelAgent）。
  if (depth === 0) opts.agent = agent

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
  // 数组跨 runAgent 调用存活。
  agent._asyncSubagents = (depth === 0 && history._asyncSubagents instanceof Map) ? history._asyncSubagents : new Map()
  // §9 D-24b（R13）：async advisor 池同款载体（独立池——角色无关消费机制）。
  agent._asyncAdvisors = (depth === 0 && history._asyncAdvisors instanceof Map) ? history._asyncAdvisors : new Map()

  // End-of-run exploration distillation boundary (CONTEXT-COMPACTION §5): setupAgentRun has already
  // pushed the user input + injections, so everything appended from here is "this run's" work.
  agent._runStartHistoryLen = history.length

  // ─── Main loop ─────────────────────────────
  const maxTurns = overrideTurns || configuredMaxTurns()
  // 跨段累计编号（TURN-CAP-CONTINUE §19.3——第 19 批）：_turnSeq = 链内累计序数。
  // 复位点唯一（仅 !resume——无条件复位会使续跑段累计失效）；续跑段的种子经 opts 从消费侧
  // 传入（本端子代理面每段续跑 = 新 agent 对象——载体缺口修正轮修法 A：仅 `_turnSeq == null`
  // 时落种子、非空不覆盖；CLI 面同一 child 对象跨段存活 → 种子零作用）。每轮 ++ 见循环头。
  if (!opts.resume) {
    agent._turnSeq = 0
  } else if (agent._turnSeq == null) {
    agent._turnSeq = opts._turnSeqBase ?? 0
  }
  const recentSigs = []
  let guardPushbacks = 0
  let advisorPushbacks = 0
  let thrownError = null

  try {
  for (let turn = 0; turn < maxTurns; turn++) {
    if (signal?.aborted) { traceStop(`agent loop turn ${turn}: aborted at loop head`) ; throw new DOMException("Aborted", "AbortError") }
    // §19.5 D-M5 per-child turn hook (CLI ⟦ev⟧turn 解析的 VS Code 等价): 每轮迭代通报
    // turn 号——subagent runChild 同步进 async 池条目的 entry.turn（status 决策字段）。
    // §19.3 跨段累计：`++_turnSeq` 每轮无条件递增（与回调存在与否无关）；帧经 turnFrame
    // 唯一计算点得出（累计编号 / 累计预算），回调双参发出（签名扩展——向后兼容）。
    const frame = turnFrame(++agent._turnSeq, turn, maxTurns)
    callbacks.onAgentTurn?.(frame.turn, frame.maxTurns)

    // SUBAGENT-OBSERVE-SEND.md D2（2026-09-08）：父 send 注入队列消费点——子 runAgent 每
    // 回合头清空 turnInput 回调（runChild/escalate 引擎提供——读池条目 entry._injected）取回
    // 待投递消息 → 作普通 user 回合 push 进子 machine 历史 → 本次 LLM 回合视其为用户指令。
    // 延迟语义（评审 #3）：send 落子代理 mid-LLM-await 时不打断——当前工具/回合返回后到此
    // 回合头才消费（非即时）。depth-0/无 turnInput 提供者为 no-op（顶层不走注入）。
    const turnInjected = opts.turnInput?.() ?? null
    if (Array.isArray(turnInjected) && turnInjected.length > 0) {
      for (const m of turnInjected) {
        if (m && typeof m.message === "string" && m.message.trim()) history.push({ role: "user", content: m.message })
      }
    }

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

    // Plan-mode reminder cadence (D-CI4——cli run-stages.mjs:91-108 同序：稀疏 2 轮/满 5 轮/
    // 新用户消息重置——限制不淡化)。位置 = injectEngineeringReminder 之前（CLI 同序）。
    if (agent._planMode) {
      const lastMsg = history.at(-1)
      const realUserMsg = lastMsg?.role === "user"
        && typeof lastMsg.content === "string"
        && !lastMsg.content.startsWith("[System reminder:")
        && !lastMsg.content.startsWith("[User interrupt:")
      const newUserSince = realUserMsg && history.length > (agent._planReminderAtLen ?? 0)
      const reminder = planReminderForTurn(agent, newUserSince)
      if (reminder) {
        agent._planReminderAtLen = history.length + 1
        history.push({ role: "user", content: reminder, transient: true })
      }
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
      // digest autoTurn=true；role/depth = 子代理上下文归属——§11 后顶层 agent 为面板会话级
      // 单例（复用 hydrate），per-run 对象仅子代理/destroy 重建路径）
      // TRACE-STORE-VSC（§18.6 D-TR4 镜像——CLI agent.mjs logCtx 同款）：kind/cwd/session/
      // traces 开关——kind 按 depth/role 分域（consult 孩子 = consult——CLI 同判据）；session =
      // agent._sessionStart（setup hydrate 打点——子代理不经 depth-0 设置——轨迹 session 为
      // null——CLI 同语义）；traces 沿 agent.config.traces.enabled（D-TR6——缺省 OFF 隐私裁定）。
      logCtx: {
        stage: "turn", turn: turn + 1, auto: autoTurn, role, depth,
        kind: depth > 0 ? (role === "consult" ? "consult" : "subagent") : "turn",
        session: agent._sessionStart ?? null,
        cwd,
        traces: agent.config?.traces?.enabled !== false,
      },
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

    // Warnings from this response + abnormal finish-reason reminder (D-CI9——cli
    // agent.mjs:293 同位：interrupt/builtin 处理之后、toolCalls 分支之前)。
    injectResponseReminders(agent, response)

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

    // ─── W9 端差适配（调用期载体镜像——承 W6 run-stages.mjs:174-178 先例；W11/W15 载体归一后退场）───
    // 核 agent-tools 工具族（plan / task / goal / verify）读/写 CLI 载体名
    // （agent.provider / agent.tasks / agent.planMode / agent.goal / agent._onTaskUpdate）；
    // 本端载体 = _provider 语义的显式入参 / _tasks / _planMode / _goal / callbacks.onTaskUpdate
    // ——门禁（tool-gates）/ 槽持久化（run-helpers）/ 面板回调（panel-callbacks）消费面不变。
    agent.provider = provider
    agent.tasks = agent._tasks ?? []
    agent.planMode = agent._planMode === true
    if (agent._goal) agent.goal = agent._goal
    agent._onTaskUpdate = (items) => callbacks.onTaskUpdate?.(items)

    await executeToolBatches(agent, { response, history, fullHistory, toolByName, getAuto, callbacks, signal, sessionSignal: opts.sessionSignal ?? null, cwd, recentSigs, depth })
    traceStop(`turn ${turn}: tool batches complete`)

    // W9 载体镜像回填：工具族的 CLI 名写入 → 本端载体（同值同判；未写则维持本端值）。
    // task：槽持久化 + 待办提醒读 _tasks；plan：门禁/槽/面板读 _planMode（并推 onPlanMode）；
    // goal：goal 面板 + 槽读 _goal（核状态词 complete/blocked → 面板词 done/blocked）。
    if (Array.isArray(agent.tasks) && agent.tasks !== agent._tasks) agent._tasks = agent.tasks
    if (typeof agent.planMode === "boolean" && agent.planMode !== agent._planMode) {
      agent._planMode = agent.planMode
      callbacks.onPlanMode?.(agent.planMode)
    }
    if (agent.goal !== undefined && agent.goal !== agent._goal) {
      agent._goal = agent.goal
      const g = agent.goal
      callbacks.onGoal?.(g
        ? { status: g.status === "active" ? "active" : g.status === "complete" ? "done" : g.status, objective: g.objective, criteria: g.criteria }
        : { status: "cancelled" })
    }

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
    // 2026-09-05 实践轮：回合收尾（consult 清理/async 池收集/guardCarry 继承）为 finalizeAgentTurn 模块函数——finally 只剩一行调用 + 骨架注释。
    // §19.8（2026-09-06）：checkN 持久步骤随 action:'check' 删除退役。
    await finalizeAgentTurn(agent, { signal, history, fullHistory, cwd, depth, thrownError, autoTurn, guardCarry: opts.guardCarry, suspDriven: opts.suspDriven === true })
  }
}

// runAgent 主循环阶段函数（checkAndCompact/fireEndOfRunDistill/finalizeAgentTurn）
// 2026-09-05 实践轮迁 agent/run-stages.mjs（runAgent ≥300 单体分层后文件总量超限——
// 阶段函数族独立成文件——import 面见文件头）

