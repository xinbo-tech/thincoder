/**
 * agent/run-start.mjs — runAgent 起跑前段（2026-09-29 P2 三拆：agent.mjs runAgent 段 1
 * verbatim 迁入——distill 等待 ∕ pendingAsync 注入 ∕ prepareRun ∕ 复位块 ∕ 域文本 ∕ 授权注释块）。
 * 接口 = beginRun(agent, input, callbacks, opts) → 主循环装配面（`tools` 死绑定去——KD-8）。
 */
import { prepareRun } from "./setup.mjs"
import {
  restoreGuard, // digest D-S6 读侧单点（AGENT-LOOP-ASYNC-POOL.md §6.8；P2 机制层端差批 §2.18——键清单归核）
  AUTO_TURN_DIGEST_DOMAIN,
  AUTO_TURN_DIGEST_DOMAIN_ENG, // §6.15.3（F10 第三面）：工程模式 digest 基座变体（task 指针改批次档 + 台账）
  UPSTREAM_TURN_DOMAIN, // §6.27.12.8：上行唤醒轮域文本（手动档——ask 轮不沿用 digest 域文本）
  TIMER_TURN_DOMAIN, // §6.30.3 D-TW4：timer 唤醒轮域文本（第三变体——到期 timer 自动开轮）
} from "./helpers.mjs"

export async function beginRun(agent, input, callbacks, {
  depth = 0, signal, overrideTurns, resume = false, autoTurn = false, upstreamTurn = false, timerTurn = false,
  extraTools = null, injections = null, turnDomainText = null, toolDecorate = undefined,
} = {}) {
  // Previous run's async exploration distillation must settle before this run pushes
  // input (SEND-STALL-DISTILL §2.2 N1) — await first, or its history replace wipes it.
  if (agent._pendingDistill) {
    const p = agent._pendingDistill
    agent._pendingDistill = null
    await p
  }
  // AGENT-LOOP-ASYNC-POOL.md §6.8 D-S3: suspension-settled async results inject before EVERY run's prepareRun
  // (user + auto-turn); spliced = consumed. collectSettledAsync owns a different
  // container, so no double-inject across the two consumption points.
  // ASYNC-RESULT-CONTAINER.md D2 (2026-09-08)：pending 单容器 `_pendingAsyncResults`
  // +role——四族（subagent/advisor/escalate/consult）统一停靠；注入器按 role 分发
  // （consult → injectConsultResult；其余 → injectAsyncResult——族分支同 CONSULTATION.md §6.2 D-R17a/b）
  // ——单容器一处清，不再逐族三段。
  const pendingAsync = agent._pendingAsyncResults
  if (pendingAsync?.length) {
    const { injectAsyncResult } = await import("../agent-tools/subagent.mjs")
    const { injectConsultResult } = await import("../agent-tools/consult.mjs")
    // TUI-OOM-ROOTCAUSE（AGENT-LOOP.md §6.15 消费点②——run 起始 pending 注入）：
    // 注入完成后释放条目对子代理对象的持有（childAgent/report 置空——幂等 helper）。
    const { releaseSettledEntry } = await import("../agent-tools/async-settle.mjs")
    for (const e of pendingAsync.splice(0)) {
      if (e.role === "consult") await injectConsultResult(agent, e)
      else await injectAsyncResult(agent, e)
      releaseSettledEntry(e)
    }
  }
  agent._inAutoTurn = autoTurn // spawn gate for manual-tier digests (AGENT-LOOP-ASYNC-POOL.md §6.8 D-S6/N3；上行唤醒轮同持 autoTurn——§6.27.12.4 ①)
  const { maxTurns, threshold, toolSchemas, toolByName, systemPrompt } = await prepareRun(
    // G1/G2（施工②）：prompt 装配收口 prepareRun 内部（assemblePrompt——prompt-overlays.mjs
    // 槽位常量，与子代理角色常量同源——单一权威锚 D1）；本调用不再携带 prompt 常量。
    agent, input, callbacks,
    { depth, signal, overrideTurns, resume: resume || autoTurn, extraTools, injections, toolDecorate },
  )

  // Exploration-distillation boundary (CONTEXT-COMPACTION §5): prepareRun already
  // pushed input + injections — appended from here counts as "this run's" work.
  agent._runStartHistoryLen = agent.history.length

  // Per-run bookkeeping reset — PRESERVED on `resume` (ContinueError continuation):
  // mutation/guard continuity and the convergence budget must survive a continuation.
  // §2.3 链内段数（TURN-CAP-CONTINUE.md §4）：首段 1、每次续跑 +1——复位条件同 `_turnSeq`
  // （链起点复位、续跑不回退）；消费面 = 检查点 ask 载荷 / 池条目留痕二元。
  agent._continueSegments = resume ? (agent._continueSegments ?? 1) + 1 : 1
  // #417（撞帽载荷「本段零落盘轮数」——只报数：零阈值常量 / 零自动动作）：段起点复位（首段 /
  // 续跑新段——与 `_continueSegments` 同点）；段内累加，采集点在回合环（与 `_turnSeq` 同源面）。
  agent._zeroWriteTurns = 0
  if (!resume) {
    // 第 19 批（TURN-ACROSS-SEGMENTS——设计 TURN-CAP-CONTINUE.md §4）：链内累计编号
    // 只在链起点复位——续跑（resume:true）不重置、不回退（编号帧公式见 helpers.mjs
    // turnFrame）。与下方 mutation/guard 复位同条件同点（全档唯一复位点）。
    agent._turnSeq = 0
    // AGENT-LOOP-ASYNC-POOL.md §6.8 D-S6: an auto-turn's guard marks are inherited by the next USER run (not
    // reset) so auto-turn changes never escape the guard silently.
    const g = agent._inheritedGuard
    if (g) {
      restoreGuard(agent, g)
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
      // F-CC2（§6.16.2）：模型主动压缩的排队槽也是回合级——上一回合末尾未被安全点消费的请求不得跨回合生效
      agent._pendingCompact = null
    }
  }
  // digest D-S6 manual tier（AGENT-LOOP-ASYNC-POOL.md §6.8）: action-domain reminder (system-driven turn — organize only).
  // §6.27.12.4 ②: an up-stream wake turn answers a RUNNING subagent waiting for the reply — it
  // must not reuse the digest text ("no one is waiting" is the opposite of the truth).
  // §6.30.3 D-TW4: timer wake turn (third auto-turn variant) — 到期 timer 自动开轮，仅作域文本选择
  // （`upstreamTurn` 优先不回归：ask 轮是「有人在等回复」，比 timer 轮更紧）。
  if ((autoTurn || upstreamTurn) && !agent.autoApprove) {
    // §2.5-A3（P4-I）：端壳经 `opts.turnDomainText` 供「核基座 + 端 overlay」组合串（组合点 =
    // 端 `turn-domains.mjs` composeTurnDomain）；缺省（null）⇒ 核基座逐字零变（选择序不变）。
    const domainBase = upstreamTurn ? UPSTREAM_TURN_DOMAIN : timerTurn ? TIMER_TURN_DOMAIN : (agent.config?.agent?.engineering === true ? AUTO_TURN_DIGEST_DOMAIN_ENG : AUTO_TURN_DIGEST_DOMAIN)
    agent.history.push({ role: "user", content: turnDomainText ?? domainBase, transient: true })
  }
  // eng-coder authorization (_engDesignReviewed) is eng-coder-only: set by subagent-spawn.mjs
  // (spawn gate) / design-token.mjs (design review pass) BEFORE the child runAgent — the
  // depth-0 parent never reads or writes it (the parent gate reads anyLiveDesignSlot; the
  // depth-0 per-turn reset was removed 2026-09-08, ENG-SESSION-PROVIDER-CLEANUP D1.3).
  // Design slots (_engDesignTokens Map) survive across turns (design review → approval →
  // eng-coder spawn) — persisted to the session slot at settle time (DESIGN-TOKEN-
  // SETTLEMENT D1); lifecycle: issued on a passing review, consumed by consume-design / TTL.
  return { maxTurns, threshold, toolSchemas, toolByName, systemPrompt }
}
