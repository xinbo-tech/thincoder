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
  // §6.31 消化账务（批 digest-accounting · 2026-10-05 · 台账 #930）：**投递 ≠ 销账**——
  // 会话态（`_daSession`）投递留容器（覆盖才离容器 / 未见账经消化轮回路重投）；fallback
  // （headless / 直连 runAgent）缺省条逐字沿用取尽语义（先离容后注入 ∥ `releaseSettledEntry` 面；
  // 零账目动作——不销账 / 不重投），已投递未销账条同判据跳过且留容器（§6.31 出口缝② · 父侧裁定 2026-10-05）。
  const pendingAsync = agent._pendingAsyncResults
  const { carrierField, releaseChildHold, releaseSettledEntry } = await import("../agent-tools/async-settle.mjs")
  if (carrierField(agent, "_daSession") === true) {
    const { armAccountRound, isDigestRound, shouldDeliverEntry, digestAccountRequirement } = await import("./digest-account.mjs")
    armAccountRound(agent) // §6.31.5 落痕清位：会话态起跑即清（缺痕 ⇒ 全条未覆盖——安全方向）
    if (pendingAsync?.length) {
      const { injectAsyncResult } = await import("../agent-tools/subagent.mjs")
      const { injectConsultResult } = await import("../agent-tools/consult.mjs")
      const digestRound = isDigestRound({ autoTurn, upstreamTurn, timerTurn })
      // 投递门控两态（§6.31.4）：首投任意回合 ∥ 重投仅消化轮；注入后**留容器**（不 splice）。
      // 注入抛错 ⇒ 未投条目（`_daDelivered` 未置）留容器待下轮——收窄既有「splice 先取尽」的丢失窗。
      for (const e of [...pendingAsync]) {
        if (!shouldDeliverEntry(e, digestRound)) continue
        if (e.role === "consult") await injectConsultResult(agent, e)
        else await injectAsyncResult(agent, e)
        e._daDelivered = true
        e._daRetry = false
        releaseChildHold(e) // 仅释放 `childAgent`——`report` 保留至销账 / 升级（重投需原文）
      }
      // 账目要求行（§6.31.3）：仅会话态消化轮且未销账清单非空时注入（先投递后拼清单——
      // 含本回合首投 / 重投）；两档同发（手动 / AUTO）；transient（机器线独有）。
      if (digestRound) {
        const ids = pendingAsync.filter((e) => e._daDelivered === true).map((e) => e.id)
        if (ids.length > 0) {
          agent.history.push({ role: "user", content: digestAccountRequirement(ids), transient: true })
        }
      }
    }
  } else if (pendingAsync?.length) {
    const { injectAsyncResult } = await import("../agent-tools/subagent.mjs")
    const { injectConsultResult } = await import("../agent-tools/consult.mjs")
    // TUI-OOM-ROOTCAUSE（AGENT-LOOP.md §6.15 消费点②——run 起始 pending 注入）：
    // 注入完成后释放条目对子代理对象的持有（childAgent/report 置空——幂等 helper）。
    // §6.31 出口缝②（#44 披露①扩散面 · 父侧裁定 2026-10-05）：fallback 支同判据延伸——
    // 注入前按投递账分区：已投递未销账条（`_daDelivered === true`——内容已在历史）不注入且
    // 留容器（与 idle 清场同义——防重复 / 条目不离账务面）；`_daDelivered` 缺省条逐字沿用
    // （先离容后注入的取尽窗 ∥ 注入顺序 ∥ `releaseSettledEntry` 面）。
    const taken = []
    let kept = 0
    for (const e of pendingAsync) {
      if (e?._daDelivered === true) pendingAsync[kept++] = e
      else taken.push(e)
    }
    pendingAsync.length = kept
    for (const e of taken) {
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
      // #934（零落笔看门狗——AGENT-LOOP-UPSTREAM.md §6.32.6 载体重置）：streak / 闩与
      // `_touchedFiles = []`（本块）同点复位——链起点；续跑（resume）不执行 ⇒ 「连续」
      // 跨段存活（锚与分支差别注见 §6.32.2 ①）。
      agent._zeroWriteStreak = 0
      agent._zeroWriteAlerted = false
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
