/**
 * run-stages.mjs — runAgent 主循环的阶段函数族（CLI，2026-09-05 实践轮：agent.mjs
 * runAgent 383 ≥300 按骨干—细节两层提取——VS Code 端同构文件（双端 parity——拆分
 * 两端同步））。本文件承载：回合压缩检查（runCompactionCheck）、回合注入组
 * （injectTurnReminders——plan cadence + eng 状态）、回合收尾（finalizeAgentTurn——
 * consult 清理/async 池分流/guard 继承）与其收集器（collectSettledAsync——自
 * agent.mjs 迁入，agent.mjs 内无其他引用）。verbatim 迁移 + 签名化，语义零变。
 */

import { compressIfNeeded, compressFallback, COMPRESS_FAILURE_LIMIT } from "../context.mjs"
import { ensureAutoReminder, injectEngineeringReminder, ContinueError } from "./helpers.mjs"
import { cleanupConsultSessions } from "../agent-tools/consult.mjs"
import { logEvent } from "@thincoder/core/log.mjs"
// ASYNC-RESULT-CONTAINER.md D1：池 accessor（absorb 双池——advisor 独立池无队列）
import { getAsyncPool, releaseSettledEntry } from "../agent-tools/async-settle.mjs"
// R10 L3 (MULTI-INSTANCE-COLLAB §2a.5 D-L3a)：回合末域登记 flush（写工具钩子累积 →
// 整写一次本实例 peers 文件——无写入跳过；失败容忍不抛）
import { flushPeerDomains } from "@thincoder/core/peer-domains.mjs"
// 第 30 批 D1（Stop 钩子——AGENT-LOOP.md §21）：主会话 run 终止事件（触发块见 finalizeAgentTurn）
import { runHooks } from "../hooks.mjs"

/**
 * 响应后置提醒注入（2026-09-05 实践轮——自 runAgent 响应处理链提取，verbatim）：
 * 流规则 warning（warn 动作——流已完成——去重注入，模型下轮可见）+ 异常 finish
 * reason 警告（响应可能不完整/截断——reasonMap 人类化描述注入）。
 */
export function injectResponseReminders(agent, response) {
  // Stream rule warnings (action: "warn"): stream completed; inject de-duplicated
  // warnings so the model sees them before its next response.
  if (response._warnings?.length) {
    const deDuplicated = [...new Map(response._warnings.map(w => [w.name || w.pattern, w])).values()]
    agent.history.push({
      role: "user",
      content: `[System reminder — stream rule warnings from your last response:\n${deDuplicated.map(w => `- ${w.name || w.pattern}: ${w.message}`).join("\n")}]`,
    })
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
}

/**
 * 回合压缩检查（2026-09-05 实践轮——自 runAgent 主循环提取）：仅安全点（history 以
 * 完整交换结尾——user/tool 位）。成功：失败计数清零/计划提醒 cadence 复位/停滞检测
 * 计数复位（recentCallSigs——runAgent 回合级局部——经 ctx 传对象引用）/压缩完成事件
 * /AUTO 提醒重注入。失败：AbortError 透传；计数 + Q3 onCompressFail；
 * COMPRESS_FAILURE_LIMIT 连续失败降级 compressFallback（确定性截断——不发 LLM）。
 */
export async function runCompactionCheck(agent, ctx) {
  const { threshold, callbacks, compactionOverhead, signal, recentCallSigs } = ctx
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

/**
 * 回合注入组（2026-09-05 实践轮——自 runAgent 主循环提取）：plan-mode 提醒 cadence
 * （稀疏 2 轮/满 5 轮/新用户消息重置——限制不淡化）+ 工程模式状态注入（depth-0 每新
 * 用户消息一次——见 injectEngineeringReminder）。verbatim——语义零变。
 */
export async function injectTurnReminders(agent, ctx) {
  const { depth } = ctx
  // Plan-mode reminder cadence: re-inject constraint reminders while plan mode is active
  // (sparse every 2 turns, full every 5 / on new user message) so the restriction never fades.
  if (agent.planMode) {
    const lastMsg = agent.history.at(-1)
    const realUserMsg = lastMsg?.role === "user"
      && typeof lastMsg.content === "string"
      && !lastMsg.content.startsWith("[System reminder:")
      && !lastMsg.content.startsWith("[User interrupt:")
    const newUserSince = realUserMsg && agent.history.length > (agent._planReminderAtLen ?? 0)
    const { planReminderForTurn } = await import("../agent-tools/plan.mjs")
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
}

/**
 * 回合收尾（2026-09-05 实践轮——自 runAgent finally 提取，verbatim + 签名化）：写足迹
 * flush → Stop 钩子（第 30 批 D1——ctx.depth === 0 的主会话 run 终止事件，
 * fire-and-forget）→ consult 清理（无孤儿烧 token 的 consult children）→ async 池回合尾
 * 分流（Ctrl+C 清池不注入 / ContinueError 留池续跑 / 其余 collectSettledAsync）→ auto-turn
 * guard 标记继承（对象字段清单——正常结束才继承；中止丢弃；ContinueError 由续跑快照）。
 */
export async function finalizeAgentTurn(agent, ctx) {
  const { signal, autoTurn, suspDriven, thrownError, depth } = ctx
  // R10 L3（MULTI-INSTANCE-COLLAB §2a.5 D-L3a）：回合末登记 flush——本回合写足迹整写
  // 一次（首行执行：收尾链后续任何异常都不吞登记）；无写入 → 跳过（hot 窗口自然衰减）。
  flushPeerDomains(agent)
  // 第 30 批 D1（Stop 钩子）：主会话 run 终止 → fire-and-forget（非阻塞；失败静默——与 PostToolUse 同语义）。
  // 排除用户中止（Ctrl+C / Ctrl+I——中止后 TUI 重建 controller 续跑或已显式停回合）与 AbortError 展开。
  if (depth === 0 && !signal?.aborted && thrownError?.name !== "AbortError") {
    runHooks("Stop", {
      agent,
      error: thrownError && !(thrownError instanceof ContinueError) ? thrownError : undefined,
      extra: {
        turn: agent._currentTurn ?? 0,
        reason: thrownError instanceof ContinueError ? "maxTurns" : thrownError ? "error" : "done",
      },
    }).catch(() => {})
  }
  // R17（AGENT-LOOP.md §25 D-R17a）: consultation sessions are cross-turn
  // background work now — NO unconditional turn-end cleanup (the old rule aborted
  // leftover consult children at every turn end because check-loop consumption was
  // turn-scoped). Sessions stay alive across normal turn ends (and ContinueError
  // resumes); the Ctrl+C abort branch below is the only path that aborts them
  // (cleanupConsultSessions — marked stopped → no digest), and the suspension
  // driver aborts them on its own abort unwind.
  // Async subagent turn-end handling (AGENT-LOOP.md §15 D-A3 + §17 D-S1). Lifecycle:
  // - Ctrl+C (plain abort): children were aborted with the parent signal — clear
  //   WITHOUT injecting stale errors (user explicitly stopped); consultation
  //   sessions are cross-turn background work since R17 — the abort branch is the
  //   ONLY normal-path place that aborts them (cleanupConsultSessions marks
  //   stopped → their settles never reach the digest stream).
  // - Ctrl+I (interrupt): keeps the pool AND the consult sessions: the turn
  //   resumes with the interrupt message, children stay tracked (in a suspension
  //   session children hold agent._sessionSignal and a digest's own Ctrl+I must
  //   not orphan them).
  // - ContinueError (turn cap): no wait, no injection — children keep running and
  //   the RESUME run's turn-end collection takes over.
  // - anything else: inject the SETTLED entries only; running/queued stay in the
  //   pool for the suspension session (D-S1 — no allSettled turn-end wait).
  if (signal?.aborted && !signal?.reason?.interrupt) {
    const subPool = getAsyncPool(agent, "subagent")
    const advPool = getAsyncPool(agent, "advisor")
    if ((subPool?.size ?? 0) > 0 || (advPool?.size ?? 0) > 0) {
      logEvent("ev:stopped", { poolN: (subPool?.size ?? 0) + (advPool?.size ?? 0), where: "turn-end-abort" })
    }
    subPool?.clear()
    advPool?.clear()
    agent._asyncQueue = []
    // R17: the consult family dies with the user stop (marked stopped — no digest).
    cleanupConsultSessions(agent)
    // ASYNC-RESULT-CONTAINER.md D2：pending 单容器——中止丢弃 consult/escalate 族停靠
    // （原 _pendingConsultResults/_pendingEscalateResults 同口径——VSC 同语义 filter）；
    // subagent/advisor 停靠保留（挂起期 settle 的已完成结果不随中止丢）。
    agent._pendingAsyncResults = (agent._pendingAsyncResults ?? []).filter((e) => e.role !== "consult" && e.role !== "escalate")
  } else if (thrownError instanceof ContinueError) {
    // keep _asyncSubagents/_asyncAdvisors/_consultSessions — the resumed run continues them
  } else {
    const injectedAdvisor = await collectSettledAsync(agent, { suspDriven })
    // §11.2 D-24b: a normally-ended USER run with no review/child activity closes
    // the OPEN code instances — the converged/abandoned thread must not burn the
    // 5-round cap of a later task (the next code review starts a fresh round 1).
    // Digest auto-turns are exempt (their disposition precedes the fix round).
    // A run whose turn-end collection just INJECTED a settled review report
    // (headless, suspDriven=false) must NOT close: the model has not digested
    // the findings yet — the fix round that follows still continues the thread.
    if (!autoTurn && !injectedAdvisor) {
      const { closeOpenCodeAdvisorRuns } = await import("../agent-tools/advisor-async.mjs")
      closeOpenCodeAdvisorRuns(agent)
    }
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

/**
 * Turn-end async subagent collection (AGENT-LOOP.md §17 D-S1 + §17.5 supersede):
 * two modes, selected by the caller's driver context (17.5.2/17.5.4 #2):
 * - suspDriven=false (fallback — headless/direct runAgent callers without a
 *   suspension driver): inject every entry that SETTLED during this run
 *   (XML-escaped report/error — child reports may carry file/webpage content;
 *   >64K offloaded with preview + path) and remove it from the pool. Running/
 *   queued STAY — no allSettled wait. Results never lost without a session.
 * - suspDriven=true (the interaction layer runs suspensionSession after this
 *   run): NO direct inject — settled entries STAY pooled (settled not consumed)
 *   for the session's first sweepSettledToPending → digest turn (§17.5 — done
 *   条目留池等消化轮注入；status 在 sweep 前仍从池读——17.5.2 不变面（§19.8：check 已删——自动通道为唯一消费方）)。
 * maybeRefillAsync runs in both modes (starts queued heads whose slot freed).
 * Single ownership: entries settled inside a suspension session were moved to
 * _pendingAsyncResults by the settle callback, so this only sees user-turn
 * settles (no double inject — D-S3 points ①/②). The ⟦ev⟧done freeze is NOT
 * emitted here — each settle callback emits it (§15 D-A3).
 * 2026-09-05 实践轮：自 agent.mjs 迁入（agent.mjs 内仅 finalize 引用——随收尾同迁）。
 */
async function collectSettledAsync(agent, { suspDriven = false } = {}) {
  const maps = [getAsyncPool(agent, "subagent"), getAsyncPool(agent, "advisor")].filter((m) => m instanceof Map && m.size > 0)
  if (maps.length === 0) return false
  const { maybeRefillAsync, injectAsyncResult } = await import("../agent-tools/subagent.mjs")
  maybeRefillAsync(agent) // start queued heads now that slots may have freed — no waiting
  if (suspDriven) return false // §17.5: settled stays pooled — the suspension session digests it
  let injectedAdvisor = false
  for (const map of maps) {
    for (const e of [...map.values()]) {
      if (!e.done) continue // still running — stays in the pool (D-S1)
      await injectAsyncResult(agent, e)
      if (e.role === "advisor") injectedAdvisor = true
      // TUI-OOM-ROOTCAUSE（§23.3.1 消费点①——回合尾收集）：注入完成 → 释放条目持有
      releaseSettledEntry(e)
      map.delete(String(e.id))
    }
  }
  return injectedAdvisor
}
