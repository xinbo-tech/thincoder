/**
 * run-stages.mjs — runAgent 主循环的阶段函数族（2026-09-05 实践轮：agent.mjs
 * runAgent ≥300 单体按骨干—细节两层提取后，三阶段函数先同文件后移、又因文件总量
 * 超 500 硬限迁入本文件——verbatim，语义零变）：压缩检查（checkAndCompact——回合
 * 循环内安全点压缩）、回合末蒸馏发射（fireEndOfRunDistill）、回合收尾
 * （finalizeAgentTurn——consult 清理/async 池收集/guardCarry 继承——§19.8 2026-09-06：
 * checkN 持久已随 action:'check' 删除退役——步骤枚举同步）。
 * 注：ContinueError 自 ../agent.mjs import 构成函数级静态环（模块求值期无顶层调用——
 * 运行期 instanceof 时 agent.mjs 已完成求值——环安全，session-slots ↔ session.mjs
 * 同款先例）。
 */

import { compactHistory, truncateFallback, COMPRESS_FAILURE_LIMIT, summarizeRunExplorations } from "../compact.mjs"
import { pushReal, reinjectAfterCompaction, MAX_VERIFY_PUSHBACKS, MAX_VERIFY_RETRIES, hasCodeMutations } from "./run-helpers.mjs"
import { MAX_ADVISOR_PUSHBACKS } from "./run-helpers.mjs"
import { MAX_ADVISOR_ROUNDS } from "../advisor/run.mjs"
import { advisorReviewInFlight } from "../agent-tools/advisor-async.mjs"
import { logEvent } from "../log.mjs"
import { ContinueError, INHERITED_GUARD_KEYS } from "../agent.mjs"
import { flushDomains } from "../extension/peer-domains.mjs"
// 2026-09-05 实践轮：maybeGuardPushbacks——收尾前 guard 推回组（自 runAgent 无工具分支）

/**
 * 收尾前 guard 推回组（2026-09-05 实践轮——自 runAgent 无工具分支提取，verbatim + 签名
 * 化）：pending 任务检查（≤1 次/任务表态）→ verify guard（OPT-IN——首次缺验推回 + 失败
 * 重试 ≤MAX_VERIFY_RETRIES + 耗尽诚实声明）→ advisor guard（OPT-IN——非工程模式 + 有
 * 变更 + 未评审 → 推回，受 MAX_ADVISOR_PUSHBACKS/ROUNDS 双帽）。计数经 pb 对象回流
 * （guardPushbacks/advisorPushbacks 是 runAgent 回合级局部——不落 agent 字段防 resume
 * 延续语义变化）。@returns {boolean} push=true 时已注入提醒——调用方 continue 本回合。
 */
export async function maybeGuardPushbacks(agent, st) {
  const { response, history, fullHistory, callbacks, cfgVerifyGuard, pb } = st
  // Pending tasks check (top-level only). Pushed back AT MOST ONCE per task-list
  // state (CLI parity): an unbounded loop stranded the model when a pending item
  // could not be resolved. Updating the list via the task tool resets the budget.
  const pending = agent._tasks?.filter((t) => t.status === "pending")
  if (pending?.length && (agent._taskPushbacks ?? 0) < 1) {
    agent._taskPushbacks = (agent._taskPushbacks ?? 0) + 1
    pushReal(history, fullHistory, { role: "assistant", content: response.content })
    history.push({
      role: "user",
      content: `[System reminder: you still have pending tasks: ${pending.map((t) => t.title).join(", ")}. Update their status before finishing — if done, mark done; if not applicable, remove them. (This is your only reminder — if you choose not to, finish anyway.)]`,
    })
    callbacks.onSubTurnBreak?.()
    return true
  }

  // Verify guard — OPT-IN (config agent.verifyGuard === true, CLI parity). When off
  // the agent is not pushed back to verify before finishing.
  if (cfgVerifyGuard && agent._touchedFiles.length > 0 && !agent._verifiedThisRun && hasCodeMutations(agent) && pb.guardPushbacks < MAX_VERIFY_PUSHBACKS) {
    pb.guardPushbacks++
    pushReal(history, fullHistory, { role: "assistant", content: response.content })
    history.push({
      role: "user",
      content: "[System reminder: you modified files in this run but have not verified the changes. Before finishing: run the project's verification yourself (per its AGENTS.md test method), then call verify declaring the outcome via verification.status. verify mechanically gates on your declaration. If verification is genuinely impossible here, say so explicitly in your reply.]",
    })
    callbacks.onSubTurnBreak?.()
    return true
  }
  if (agent._verifiedThisRun && agent._verifyPassed === false) {
    const retries = (agent._verifyRetries ?? 0) + 1
    agent._verifyRetries = retries
    if (retries < MAX_VERIFY_RETRIES) {
      agent._verifyPassed = undefined // reset for next attempt
      pushReal(history, fullHistory, { role: "assistant", content: response.content })
      history.push({
        role: "user",
        content: `[System reminder: (retry ${retries}/${MAX_VERIFY_RETRIES}) verify was not passed — either your verification declared failed, was skipped without a reason, or was not declared. Fix or complete your verification, then call verify again declaring the outcome. If you cannot fix after ${MAX_VERIFY_RETRIES} attempts, explain honestly what's blocking you.]`,
      })
      callbacks.onSubTurnBreak?.()
      return true
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
        content: `[System reminder: ${MAX_VERIFY_RETRIES} verify attempts exhausted. You have not passed verification. Either state explicitly that your verification could not be completed, or run verify again once it is. If your verification could not be completed, say so explicitly in your reply to the user — state what you tried and what you believe is blocking you, and do not present the work as complete; the user needs to know it is unfinished.${consultHint}]`,
      })
      callbacks.onSubTurnBreak?.()
      return true
    }
  }

  // Advisor guard (CLI completion.mjs parity): OPT-IN ONLY
  // (advisor.guard === true, default OFF — 2026-08-21 semantic
  // refactor), NEVER in engineering mode (engineering has its own
  // mandatory gates). The advisor tool itself is always available.
  // Cap sync (CLI b74e413): beyond MAX_ADVISOR_ROUNDS the advisor tool
  // refuses reviews (run.mjs convergence cap) — pushing back further
  // would loop forever (fix → pushback → cap-refused call → fix …).
  // §24 D-24b（R13——④）：async 评审未决（在池 running/queued）不算未评审——不推回
  // （等 settle——settle 后无有效评审/陈旧才推回——陈旧 settle 不置 _calledAdvisorThisRun
  // ——天然落到下一条推回）。
  const advisorCfg = agent.config?.advisor
  const advisorReview = advisorCfg?.guard === true
  if (advisorReview && !agent.config?.agent?.engineering
      && agent._mutatedThisRun && !agent._calledAdvisorThisRun && hasCodeMutations(agent)
      && !advisorReviewInFlight(agent)
      && pb.advisorPushbacks < MAX_ADVISOR_PUSHBACKS
      && (agent._advisorRound || 0) < MAX_ADVISOR_ROUNDS) {
    pb.advisorPushbacks++
    pushReal(history, fullHistory, { role: "assistant", content: response.content })
    history.push({
      role: "user",
      // §24 D-24b（R13）：depth-0 缺省 async——提醒补注后台语义（评审 settle → digest 自动
      // 回来——模型无需阻塞等待；未决评审期间本提醒不再推回——等 settle 判定）
      content: `[System reminder: you changed code in this run and MUST get an advisor review before finishing (round ${agent._advisorRound + 1}). Call the \`advisor\` tool now. This is required, not optional — do not skip it even if you believe the changes are trivial — the review will be quick either way. At the top level the advisor launches the review in the BACKGROUND by default — the call returns an ack, the report arrives automatically when it settles (digest), and the review never blocks your turn; pass async:false only when you must read the result before continuing. After the review, produce a response table for every issue found (see discipline rules for format).]`,
    })
    callbacks.onSubTurnBreak?.()
    return true
  }
  return false
}

/**
 * Context compaction check（2026-09-05 实践轮——自 runAgent 主循环按骨干—细节两层
 * 提取，verbatim + 签名化，语义零变）：仅安全点调用（history 以完整交换结尾——
 * user 或 tool 位，CLI parity D1）。内部：measured-baseline 压缩（CLI parity D3——
 * prompt_tokens 为全上下文实测、追加消息按增量估算；tools schemas 作纯估算开销；
 * signal 在 Stop 时取消在途摘要请求）→ 重建边界/基线失效/任务再注入 → 失败可见化
 * （Q3：onCompressFail）+ COMPRESS_FAILURE_LIMIT 连续失败降级 truncateFallback。
 */
export async function checkAndCompact(agent, ctx) {
  const { history, provider, systemPrompt, toolSchemas, cfgCompactThreshold, signal, callbacks, getAuto } = ctx
  try {
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

/**
 * End-of-run exploration distillation 发射（2026-09-05 实践轮——自 runAgent 提取，
 * verbatim + 签名化）：仅顶层轮末调用（深度守卫——子轮创建会晚 resolve clobber 历史，
 * N1 竞态）。专用 distillSignal（与运行 signal 分离——新消息/下一轮 abort 运行
 * controller 时蒸馏继续完成；用户 Stop 同样不影响；panel dispose/会话切换才 abort）。
 * 落位后失效 token 基线 + onDistilled（调用方应持久化——评审 #5）。失败静默（N3）——
 * 原历史保留，永不阻塞返回。@returns {Promise} 蒸馏 promise（调用方挂 distillState）。
 */
export function fireEndOfRunDistill(agent, history, provider, signal, callbacks) {
  return summarizeRunExplorations(history, agent._runStartHistoryLen ?? 0, provider, signal)
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
}

/**
 * 回合收尾（2026-09-05 实践轮——自 runAgent finally 提取，verbatim + 签名化）：
 * consult 清理（无孤儿子代理）→ async 池回合尾处理（Stop 清池不注入陈旧错误 /
 * ContinueError 不等待不注入 / 其余收集 settled——running/queued 留池由挂起会话消化；
 * suspDriven 不排干——17.5.2 方案 B）→ 池挂 history 数组跨 runAgent 存活 →
 * _inAutoTurn 复位 → auto-turn guard 标记继承。
 */
export async function finalizeAgentTurn(agent, ctx) {
  const { signal, history, fullHistory, cwd, depth, thrownError, autoTurn, guardCarry, suspDriven } = ctx
  // §25 R17（2026-09-06——会诊/飞刀完全异步化）：consult 会话不再 turn-bound——普通收尾
  // 不清不 abort（会话沿 history._consultSessions 跨 run 存活——挂起会话驱动消化——
  // 与 async 池同语义）；**全停（plain abort）**才清理：abort 会话子代理 + 清会话 Map +
  // 清会诊/飞刀 park 容器（停 = 弃——不注入陈旧结果——子代理池同款）。ContinueError →
  // 全保留（自动续跑的 run-start 注入容器）。
  if (signal?.aborted && !signal?.reason?.interrupt) {
    // Turn-bound abort (CONSULTATION.md semantics kept for STOP only): mark stopped
    // (children settle as TERMINATED — grey card) + abort all leftover session
    // controllers + clear the session map — no orphan consultants past an abort.
    const { cleanupConsultSessions } = await import("../agent-tools/consult.mjs")
    cleanupConsultSessions(agent)
    if (history) {
      history._pendingConsultResults = []
      history._pendingEscalateResults = []
    }
  }
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
      const { collectSettledAsync } = await import("../agent-tools/subagent.mjs")
      await collectSettledAsync(agent, { history, fullHistory, cwd, suspDriven: suspDriven === true })
    }
  }
  // §24 D-24b（R13——2026-09-06）：async advisor 池同款回合尾处理（独立池——
  // 停/ContinueError 不注入陈旧结果；settled 留池由挂起会话 sweep → digest 消化）。
  const advMap = agent._asyncAdvisors
  if (advMap && advMap.size > 0) {
    if (signal?.aborted && !signal?.reason?.interrupt) {
      logEvent("ev:stopped", { poolN: advMap.size, where: "turn-end-abort-advisor" })
      advMap.clear()
    } else if (!(thrownError instanceof ContinueError)) {
      const { collectSettledAdvisors } = await import("../agent-tools/advisor-async.mjs")
      await collectSettledAdvisors(agent, { history, fullHistory, cwd, suspDriven: suspDriven === true })
    }
  }
  // The pool rides the shared depth-0 history array across runAgent calls (the agent
  // object itself is per-run) — attach while entries remain, drop when drained.
  if (depth === 0) history._asyncSubagents = (asyncMap && asyncMap.size > 0) ? asyncMap : undefined
  if (depth === 0) history._asyncAdvisors = (advMap && advMap.size > 0) ? advMap : undefined
  agent._inAutoTurn = false
  // §17 D-S6: an auto-turn's end-state guard marks carry into the next USER run via
  // opts.guardCarry (restored at its start above). Normal ends only — Stop discards
  // (user cancelled the work); ContinueError lets the auto-resumed run snapshot at
  // its own end (CLI parity).
  if (autoTurn && !(signal?.aborted && !signal?.reason?.interrupt) && !(thrownError instanceof ContinueError)) {
    if (guardCarry) {
      for (const k of INHERITED_GUARD_KEYS) guardCarry[k] = agent[k]
    }
  }
  // R10 L3（MULTI-INSTANCE-COLLAB.md D-L3a——VS Code 回合收尾）：回合级登记 flush——
  // 顶层回合末整写一次本实例 peers 文件（无写入回合跳过——hot 窗口自然老化；子代理写入
  // 累积在本回合集合内一并落盘；失败容忍 NF2——不影响回合主流程）。
  if (depth === 0) {
    try { flushDomains(cwd) } catch { /* NF2：登记失败不影响回合 */ }
  }
}
