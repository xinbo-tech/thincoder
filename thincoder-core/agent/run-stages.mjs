/**
 * run-stages.mjs — runAgent 主循环的阶段函数族（CLI，2026-09-05 实践轮：agent.mjs
 * runAgent 383 ≥300 按骨干—细节两层提取——VS Code 端同构文件（双端 parity——拆分
 * 两端同步））。本文件承载：回合压缩检查（runCompactionCheck）、越窗守卫 / 自适应共用原子
 * （enforceContextFit——§6.17 守卫与 §6.17.1 链三共用一个压缩原子）、回合注入组
 * （injectTurnReminders——plan cadence + eng 状态）、回合收尾（finalizeAgentTurn——
 * consult 清理/async 池分流/guard 继承）与其收集器（collectSettledAsync——自
 * agent.mjs 迁入，agent.mjs 内无其他引用）。verbatim 迁移 + 签名化，语义零变。
 */

import { compressIfNeeded, compressFallback, COMPRESS_FAILURE_LIMIT } from "../context.mjs"
// §6.17/D-CC32 溢出守卫（兜底，非主修）：预算面单源 requestBudget ∥ 再估面 contextUsage（与压缩判定同一函数）
import { requestBudget } from "../config.mjs"
import { contextUsage } from "../token-window.mjs"
import { contextOverflowError } from "../provider/errors.mjs"
import { ensureAutoReminder, injectEngineeringReminder, ContinueError, snapshotGuard } from "./helpers.mjs"
import { pushManifestStateReminder } from "./setup-reminders.mjs"
import { cleanupConsultSessions } from "../agent-tools/consult.mjs"
import { logEvent, errText } from "../log.mjs"
// ASYNC-RESULT-CONTAINER.md D1：池 accessor（absorb 双池——advisor 独立池无队列）
import { carrierField, getAsyncPool, releaseSettledEntry } from "../agent-tools/async-settle.mjs"
// §6.31 消化账务（批 digest-accounting · 2026-10-05 · 台账 #930）：见账 pass ∥ 回合分类单点
import { accountDigestRound, isDigestRound } from "./digest-account.mjs"
// 批 4 CLI-ASYNC-DISCARD（AGENT-LOOP-ASYNC-POOL.md §6.20）：中止分支「只清已死」收尾单点
// （#9：+ 后台 bash 任务族——逐条杀树 + 出池 + 墓碑）
import { discardAbortedPool, discardAbortedAdvisors, discardAbortedBgTasks, discardAbortedBrowserTasks, discardAbortedSshSessions } from "../agent-tools/async-discard.mjs"
// R10 L3 (MULTI-INSTANCE-COLLAB §2a.5 D-L3a)：回合末域登记 flush（写工具钩子累积 →
// 整写一次本实例 peers 文件——无写入跳过；失败容忍不抛）
import { flushPeerDomains } from "../peer-domains.mjs"
// 第 30 批 D1（Stop 钩子——AGENT-LOOP.md §6.13）：主会话 run 终止事件（触发块见 finalizeAgentTurn）
import { runHooks } from "../hooks.mjs"

/** 结束信号缺席提醒（§6.31.7 F-DA5——逐字 = 父侧定稿；与「非 stop 异常」同面）。 */
const FINISH_MISSING_REMINDER =
  "[System reminder: the previous turn ended without a finish signal — the provider did not report how generation ended. If the response appears incomplete, continue from where it left off.]"

/**
 * 响应后置提醒注入（2026-09-05 实践轮——自 runAgent 响应处理链提取，verbatim）：
 * 流规则 warning（warn 动作——流已完成——去重注入，模型下轮可见）+ 异常 finish
 * reason 警告（响应可能不完整/截断——reasonMap 人类化描述注入）+ 结束信号缺席提醒
 * （§6.31.7 F-DA5——clean end 无 finishReason ⇒ 同面提醒 + 留痕）。
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

  // §6.31.7 F-DA5（#929——批 digest-accounting）：结束信号缺席（clean end 且无 finishReason）
  // ⇒ 不得静默当正常——同面异常提醒注入 + `ev:finish-missing` 留痕；partial / interrupted /
  // ruleTriggered 径零触（网络断流既有 `_warnings` 已覆盖；ruleTriggered 在调用点之前分流）。
  if (response.finishReason == null && !response.partial && !response.interrupted) {
    agent.history.push({ role: "user", content: FINISH_MISSING_REMINDER })
    logEvent("ev:finish-missing", { turn: agent._currentTurn ?? 0, auto: agent._inAutoTurn === true, child: agent._logId })
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

// ─── 压缩记账三件（§6.17 阈值面 ∥ 守卫面 ∥ §6.17.1 链三自适应面共用同一段，零复制）───

/** 压缩成功记账：失败计数清零 / 计划提醒 cadence 复位 / 停滞检测计数复位 / 完成事件 / AUTO 提醒重注入。 */
function bookkeepCompaction(agent, ctx) {
  agent._compressFailures = 0
  agent._planReminderAtLen = 0 // After compression history shrinks, reset cadence so reminders resume
  ctx.recentCallSigs.length = 0 // After compression history is rebuilt, reset stall detection counter
  // Completion info (CONTEXT-COMPACTION §7 D-C2): { mode, tokensFreed, elapsedMs } —
  // the TUI panel renders it; callers that ignore the arg keep prior onCompress semantics.
  ctx.callbacks?.onCompress?.(agent._lastCompressInfo ?? {})
  ensureAutoReminder(agent)
}

/** 压缩失败记账——AbortError 必须透传（用户中止不得被当成压缩失败吞掉）。 */
function noteCompressFailure(agent, ctx, compressError) {
  if (compressError?.name === "AbortError" || ctx.signal?.aborted) throw compressError
  agent._compressFailures = (agent._compressFailures ?? 0) + 1
  // Q3 (CONTEXT-COMPACTION §7 D-C1): a failed compression is surfaced to the panel;
  // COMPRESS_FAILURE_LIMIT consecutive failures still degrade to compressFallback.
  ctx.callbacks?.onCompressFail?.(compressError)
}

/** 三连败降级（确定性截断——零网络，§6.5 D6）。 */
function degradeIfCompressExhausted(agent, ctx) {
  if (agent._compressFailures < COMPRESS_FAILURE_LIMIT) return
  agent._compressFailures = 0
  if (compressFallback(agent)) ctx.callbacks?.onCompress?.(agent._lastCompressInfo ?? {})
}

/**
 * 回合压缩检查（2026-09-05 实践轮——自 runAgent 主循环提取）：仅安全点（history 以
 * 完整交换结尾——user/tool 位）。成功：失败计数清零/计划提醒 cadence 复位/停滞检测
 * 计数复位（recentCallSigs——runAgent 回合级局部——经 ctx 传对象引用）/压缩完成事件
 * /AUTO 提醒重注入。失败：AbortError 透传；计数 + Q3 onCompressFail；
 * COMPRESS_FAILURE_LIMIT 连续失败降级 compressFallback（确定性截断——不发 LLM）。
 * 模型主动压缩（`context` 工具）由本点消费（§6.16.2——取用即清槽；no-op 与失败各落一行注记）。
 */
export async function runCompactionCheck(agent, ctx) {
  const { threshold, callbacks, compactionOverhead, signal } = ctx
  // F-CC2（CONTEXT-COMPACTION.md §6.16.2）：模型主动压缩（`context` 工具）在**本安全点**消费——
  // 取用即清槽（失败不重放；重发由模型再调）；`force` 只跳过阈值早退（模型判定优先于阈值），
  // 其余全同（同 splitHistory / 同尾部预算 / 同摘要链 / 同回注 / 同基线失效）。
  const pending = agent._pendingCompact
  agent._pendingCompact = null
  try {
    let compacted = await compressIfNeeded(
      agent, threshold, callbacks,
      pending ? { ...compactionOverhead, force: true, focus: pending.focus } : compactionOverhead,
      signal,
    )
    if (!compacted && pending) {
      // 强制面无可压（短历史无中段）⇒ 记 no-op 注记后**照常**跑阈值面（阈值面不因模型请求让位）
      const { compactNoopNote } = await import("../agent-tools/context.mjs")
      agent.history.push({ role: "user", content: compactNoopNote(), transient: true })
      compacted = await compressIfNeeded(agent, threshold, callbacks, compactionOverhead, signal)
    }
    if (compacted) bookkeepCompaction(agent, ctx)
  } catch (compressError) {
    noteCompressFailure(agent, ctx, compressError)
    if (pending) {
      // 失败注记（§6.16.2 回执面②）：模型面告知缺口——既有失败链 / 面板面零改，仅补一行机器注记
      const { compactFailureNote } = await import("../agent-tools/context.mjs")
      agent.history.push({ role: "user", content: compactFailureNote(errText(compressError), agent._compressFailures), transient: true })
    }
    degradeIfCompressExhausted(agent, ctx)
  }

  // 溢出守卫（CONTEXT-COMPACTION.md §6.17 / D-CC32——兜底，非主修；本缝 = catch 闭合后、返回前）。
  // 判据 / 强压 / 再判 / 抛三实数 全住 `enforceContextFit`——与 §6.17.1 链三的自适应面**同一个原子**（零复制）。
  await enforceContextFit(agent, ctx)
}

/**
 * 越窗守卫 / 自适应共用原子（CONTEXT-COMPACTION.md §6.17 守卫 ∥ §6.17.1 链三自适应）：
 * `requestBudget` 判 → 强压一次（`force`）→ 再判 → 抛三实数（不截断、不静默削输出）。
 *
 * `opts.forceCompact`（链三面）：**跳过前置估算判据**、直接强压——服务端已判越窗时估算准不准不再作门
 * （本批要治的就是估算低估：死锁现场估 491K < limit 606,784，按估算开门会压 0 次、重试同一请求再吃 400）。
 * 压后仍超的再判两面同判（压后仍越线说明压缩解不了，再压只是重复付费）。
 * 返回是否走到了再判通过（守卫面估算未越线 ⇒ false、零动作；压后仍超⇒抛，不到达返回值）。
 */
export async function enforceContextFit(agent, ctx, { forceCompact = false } = {}) {
  const { threshold, callbacks, compactionOverhead, signal } = ctx
  // 判据 = prompt 估算 > `budget.limit`（**无档次门**——absent 档 limit 取地板 max(window − reserve, threshold)，
  // 恒为正数、恒可判）。**判据不用 maxTokens**：未发时为 undefined ⇒ NaN ⇒ 守卫静默失效（§6.17）。
  const budget = requestBudget(agent.provider)
  let usage = contextUsage(agent, compactionOverhead)
  if (!forceCompact && !(usage.total > budget.limit)) return false
  // 强压一次：失败走与阈值面同一条记账 / 降级链（不把摘要错误当回合错误直抛——
  // 记账后仍按「压后仍超」判：降级截断可能已把上下文压到线下）。
  try {
    const compacted = await compressIfNeeded(
      agent, threshold, callbacks, { ...compactionOverhead, force: true }, signal,
    )
    if (compacted) bookkeepCompaction(agent, ctx)
  } catch (compressError) {
    noteCompressFailure(agent, ctx, compressError)
    degradeIfCompressExhausted(agent, ctx)
  }
  usage = contextUsage(agent, compactionOverhead)
  if (usage.total > budget.limit) {
    const remedy = budget.limit < 0
      ? `max_tokens ${budget.maxTokens} alone exceeds the window — lower provider.maxTokens or switch to a larger-window model`
      : "forced compaction ran but the prompt still exceeds the window; reduce the conversation (/compact or prune) before retrying"
    throw contextOverflowError(agent.provider, usage.total, budget, remedy)
  }
  return true
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
    pushManifestStateReminder(agent, { depth }) // M1 情境行（MANIFEST.md §2.6——同序组，eng 之后）
  }
}

/**
 * 回合收尾（2026-09-05 实践轮——自 runAgent finally 提取，verbatim + 签名化）：写足迹
 * flush → Stop 钩子（第 30 批 D1——ctx.depth === 0 的主会话 run 终止事件，
 * fire-and-forget）→ consult 清理（无孤儿烧 token 的 consult children）→ async 池回合尾
 * 分流（Ctrl+C 清池不注入 / ContinueError 留池续跑 / 其余 collectSettledAsync）→
 * **见账 pass（§6.31.5——消化轮收尾逐条机检账目覆盖；消化账务批）** → auto-turn
 * guard 标记继承（对象字段清单——正常结束才继承；中止丢弃；ContinueError 由续跑快照）。
 */
export async function finalizeAgentTurn(agent, ctx) {
  const { signal, autoTurn, upstreamTurn, timerTurn, suspDriven, thrownError, depth } = ctx
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
  // R17（CONSULTATION.md §6.2）: consultation sessions are cross-turn
  // background work now — NO unconditional turn-end cleanup (the old rule aborted
  // leftover consult children at every turn end because check-loop consumption was
  // turn-scoped). Sessions stay alive across normal turn ends (and ContinueError
  // resumes); the Ctrl+C abort branch below is the only path that aborts them
  // (cleanupConsultSessions — marked stopped → no digest), and the suspension
  // driver aborts them on its own abort unwind.
  // Async subagent turn-end handling (AGENT-LOOP-SUBAGENT.md §6.7.3 D-A3 + AGENT-LOOP-ASYNC-POOL.md §6.8 D-S1). Lifecycle:
  // - Ctrl+C (plain abort): children were aborted with the parent signal — discard dead
  //   entries (tombstone/out-of-pool/notice — AGENT-LOOP-ASYNC-POOL.md §6.20; no stale
  //   errors injected — user explicitly stopped); consultation sessions are cross-turn
  //   background work since R17 — the abort branch is the ONLY normal-path place that
  //   aborts them (cleanupConsultSessions marks stopped → they never reach the digest).
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
    const bgPool = getAsyncPool(agent, "bg") // #9：后台 bash 任务池（第三域）
    const brPool = getAsyncPool(agent, "browser") // 批 browser-async-fix：后台浏览器动作池（第四域）
    if ((subPool?.size ?? 0) > 0 || (advPool?.size ?? 0) > 0 || (bgPool?.size ?? 0) > 0 || (brPool?.size ?? 0) > 0) {
      logEvent("ev:stopped", { poolN: (subPool?.size ?? 0) + (advPool?.size ?? 0) + (bgPool?.size ?? 0) + (brPool?.size ?? 0), where: "turn-end-abort" })
    }
    // §6.20：只清已死条目（存活/已 settle 留池——收尾见 async-discard.mjs；原无条件清池已弃）；
    // #9：后台 bash 任务同面（杀 ⟺ 控制器已中止——逐条杀树 + 出池 + 墓碑）。
    discardAbortedPool(agent)
    discardAbortedAdvisors(agent)
    discardAbortedBgTasks(agent)
    discardAbortedBrowserTasks(agent) // 批 browser-async-fix：后台浏览器动作同面（不杀浏览器）
    discardAbortedSshSessions(agent) // 批 ssh-session：SSH 会话同面（逐条杀树——远端连接该断）
    // R17: the consult family dies with the user stop (marked stopped — no digest).
    cleanupConsultSessions(agent)
    // ASYNC-RESULT-CONTAINER.md D2：pending 单容器——中止丢弃 consult/escalate 族停靠
    // （原 _pendingConsultResults/_pendingEscalateResults 同口径——VSC 同语义 filter）；
    // subagent/advisor 停靠保留（挂起期 settle 的已完成结果不随中止丢）。
    agent._pendingAsyncResults = (agent._pendingAsyncResults ?? []).filter((e) => e.role !== "consult" && e.role !== "escalate")
    agent._unsettledDigests = [] // §6.31.5 清账面：会话中止 ⇒ 升级账本随 pending 一并清（用户全停 = 旧账不续）
  } else if (thrownError instanceof ContinueError) {
    // keep _asyncSubagents/_asyncAdvisors/_consultSessions — the resumed run continues them
  } else {
    const injectedAdvisor = await collectSettledAsync(agent, { suspDriven })
    // AGENT-LOOP-ASYNC-POOL.md §6.10 D-24b: a normally-ended USER run with no review/child activity closes
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
  // §6.31.5 见账面（消化轮收尾——finalize 单点；消化账务批 · 2026-10-05 · 台账 #930）：
  // 恒达窗 = 正常 ∥ Abort-continue ∥ 异常抛三径同达；会话停止径不判（清场语义归 finishSuspension）。
  if (isDigestRound({ autoTurn, upstreamTurn, timerTurn }) && carrierField(agent, "_daSession") === true
      && !(signal?.aborted && !signal?.reason?.interrupt)) {
    await accountDigestRound(agent) // async（§6.31.5 升级支 ④ 终局披露复用注入器）
  }
  agent._inAutoTurn = false
  // AGENT-LOOP-ASYNC-POOL.md §6.8 D-S6: auto-turn guard marks survive into the next USER run (restored at its
  // !resume reset above). Normal ends only — abort discards; ContinueError lets the
  // auto-resumed run snapshot at its own end.
  if (autoTurn && !(signal?.aborted && !signal?.reason?.interrupt) && !(thrownError instanceof ContinueError)) {
    // 键清单/快照形态单源 = helpers.mjs（P2 机制层端差批 §2.18——端侧经同一 helper 取同清单）
    agent._inheritedGuard = snapshotGuard(agent)
  }
}

/**
 * Turn-end async subagent collection (AGENT-LOOP-ASYNC-POOL.md §6.8 — D-S1 + suspension supersede):
 * two modes, selected by the caller's driver context (17.5.2/17.5.4 #2):
 * - suspDriven=false (fallback — headless/direct runAgent callers without a
 *   suspension driver): inject every entry that SETTLED during this run
 *   (XML-escaped report/error — child reports may carry file/webpage content;
 *   >64K offloaded with preview + path) and remove it from the pool. Running/
 *   queued STAY — no allSettled wait. Results never lost without a session.
 * - suspDriven=true (the interaction layer runs suspensionSession after this
 *   run): NO direct inject — settled entries STAY pooled (settled not consumed)
 *   for the session's first sweepSettledToPending → digest turn (AGENT-LOOP-ASYNC-POOL.md §6.8 — done
 *   条目留池等消化轮注入；status 在 sweep 前仍从池读——17.5.2 不变面（AGENT-LOOP-SUBAGENT.md §6.7.5：check 已删——自动通道为唯一消费方）)。
 * maybeRefillAsync runs in both modes (starts queued heads whose slot freed).
 * Single ownership: entries settled inside a suspension session were moved to
 * _pendingAsyncResults by the settle callback, so this only sees user-turn
 * settles (no double inject — D-S3 points ①/②). settle 回调只发 ⟦ev⟧settled；
 * ⟦ev⟧done 冻结落消费窗（#746 · ASYNC-POOL §6.8）。
 * 2026-09-05 实践轮：自 agent.mjs 迁入（agent.mjs 内仅 finalize 引用——随收尾同迁）。
 */
async function collectSettledAsync(agent, { suspDriven = false } = {}) {
  const maps = [getAsyncPool(agent, "subagent"), getAsyncPool(agent, "advisor")].filter((m) => m instanceof Map && m.size > 0)
  if (maps.length === 0) return false
  const { maybeRefillAsync, injectAsyncResult } = await import("../agent-tools/subagent.mjs")
  maybeRefillAsync(agent) // start queued heads now that slots may have freed — no waiting
  if (suspDriven) return false // AGENT-LOOP-ASYNC-POOL.md §6.8: settled stays pooled — the suspension session digests it
  let injectedAdvisor = false
  for (const map of maps) {
    for (const e of [...map.values()]) {
      if (!e.done) continue // still running — stays in the pool (D-S1)
      await injectAsyncResult(agent, e)
      if (e.role === "advisor") injectedAdvisor = true
      // TUI-OOM-ROOTCAUSE（AGENT-LOOP.md §6.15 消费点①——回合尾收集）：注入完成 → 释放条目持有
      releaseSettledEntry(e)
      map.delete(String(e.id))
    }
  }
  return injectedAdvisor
}
