/**
 * agent/turn-loop.mjs — runAgent 回合环（2026-09-29 P2 三拆：agent.mjs runAgent 段 2 ∕ 3 ∕ 5 ∕ 6
 * verbatim 迁入——循环局部 ∕ `_ctxBasis` ∕ drainChildUpstream ∕ for 循环本体 ∕ 零落盘结账 +
 * ContinueError；模型调用段经 callModelTurn 外提 agent/chat-call.mjs）。
 * 接口 = runTurnLoop(agent, ctx)；控制流零转换（`continue` ∕ `return cr.content` ∕ `throw` 全留环内）。
 */
import { resolve } from "node:path"
import { pushReal, summarizeRunExplorations } from "../context.mjs"
import { abortError, annotateAbort } from "../abort-provenance.mjs"
import { specForModel, assistantToolCallMessage } from "../config.mjs"
import { executeToolCalls } from "./dispatch.mjs"
import { recordToolResults } from "./record-results.mjs"
import { injectPostTurn } from "./post-turn.mjs"
import { handleCompletion, isSubstantiveResponse } from "./completion.mjs"
import { runCompactionCheck, enforceContextFit, injectTurnReminders, injectResponseReminders } from "./run-stages.mjs"
import { recordTokenSample } from "../token-window.mjs"
import { callModelTurn } from "./chat-call.mjs"
import {
  turnFrame, // 第 19 批（TURN-ACROSS-SEGMENTS）：跨段累计编号帧（设计 TURN-CAP-CONTINUE.md §4）
  ContinueError,
  FILE_MUTATORS, toolTouchPaths,
  wroteSince, // #934（§6.32.2 ① 判据式）：写序是否推进——轮顶 ∥ 撞帽收尾两处判据点共用
} from "./helpers.mjs"

export async function runTurnLoop(agent, {
  maxTurns, threshold, toolSchemas, toolByName, systemPrompt,
  depth, signal, autoTurn, suspDriven, streamOutput,
  consumeInjected, consumeQueuedInput, callbacks, distillSignal,
}) {
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
    // TRACES.md §6.1 D-TR4：compress 轨迹 depth 元数据（runAgent 的 depth 在此作用域——
    // context.mjs compressIfNeeded 经 extras 透出到 logCtx）
    traceDepth: depth,
  }
  // F-CC1（§6.16.4 阈值单源接线）：本回合压缩判定所用的阈值 + 固定开销面暂存——
  // `context` 工具的 stats 报**同一口径**（不自行重算第二口径；VSC checkAndCompact 同款暂存）。
  agent._ctxBasis = { threshold, overhead: compactionOverhead }

  // §6.17.1 链三（越窗 400 自适应）：单回合调用外包一层 catch——服务端说越窗 ⇒ 强制压一次 + 重试同一回合一次。
  // 排除面：`stage ∈ {compress, distill}` 的请求**不经本函数**（压缩机与蒸馏各自直调 `chat`，续写子请求的
  // 失败已在 `provider/core.mjs` 折进 `_warnings`）⇒ 本 catch 只接回合请求的 typed 越窗，不存在「已流出再重放」。
  const callTurn = async (turnCtx) => {
    try {
      return await callModelTurn(agent, turnCtx)
    } catch (e) {
      if (e?.kind !== "context_overflow") throw e
      // 死循环守卫（批档 D6）：额度 = run 级一次（`agent/setup.mjs` 每 run 复位）——已用过 ⇒ 原 typed 错误透传
      // （三实数 + `/compact` 提示已在报文体里）；同一 run 内第二次独立越窗不再自愈，用户 `/compact` 后可继续。
      if (agent._overflowRetried) throw e
      agent._overflowRetried = true
      // 越窗 typed 错误有两个出口（同 kind，§6.17）：HTTP 400 分类 ∥ 本地发送面净判——两面都归本链处理，
      // 故估算不再作门（估算恰恰低估才有本链），整压一次；压后仍超 ⇒ 抛三实数、不再压。
      await enforceContextFit(
        agent, { threshold, callbacks, compactionOverhead, recentCallSigs, signal }, { forceCompact: true },
      )
      // 重试恰一次：此行不在 try 内——二次越窗的 typed 错误原样上抛（不截断、不静默）
      return await callModelTurn(agent, turnCtx)
    }
  }

  // SUBAGENT-UPSTREAM-CHANNEL（AGENT-LOOP-UPSTREAM.md §6.27.4 消费点）：子 → 父在飞消息的
  // 回合边界注入单点取用一次（模块缓存 ⇒ 每 run 一次代价）；动态 import = 零新增静态边
  // （同款先例 = `run-start.mjs` 的 `injectAsyncResult` 动态 import）。
  const { drainChildUpstream } = await import("../agent-tools/parent-channel.mjs")
  // #934（零落笔看门狗——AGENT-LOOP-UPSTREAM.md §6.32）：连续零写越阈 ⇒ 自动上行提醒（只推——
  // 不杀 / 不转向）；单源叶 = zero-write-watch.mjs，动态 import 沿上条同款（零新增静态边）。
  const { maybeZeroWriteAlert } = await import("../agent-tools/zero-write-watch.mjs")
  // §6.31.5 落痕写点门（#939）：载体吸收经 `carrierField` 单点（§6.31.4 同式）；动态 import = 零新增静态边（沿上方两条同款）。
  const { carrierField } = await import("../agent-tools/async-settle.mjs")

  // #417（撞帽载荷「本段零落盘轮数」——只报数：零阈值 / 零自动动作）∥ #934（零落笔看门狗）：计数基线——
  // 判据物 = 写序（每次写事件 +1，不去重）；`_touchedFiles` 是去重路径集，同档重写长度不变 ⇒ 旧判据在
  // 此读成零落笔（本收正要消除的误报方向）。环内逐轮结账、撞帽收尾轮在环外单结（同一谓词）。
  agent._mutSeqMark = agent._mutationSeq

  for (let turn = 0; turn < maxTurns; turn++) {
    // #793（核面小修批——AGENT-LOOP.md §6.2 环边界中止前置 ∥ 需求 F5）：环头检查点——中止恒以
    // AbortError 收束、不开启新轮（环头注入族 / 压缩 / 模型调用零触）。
    if (signal?.aborted) throw abortError(signal, "agent", "turn-head")
    // 第 19 批（TURN-ACROSS-SEGMENTS——设计 TURN-CAP-CONTINUE.md §4）：编号帧——
    // `_turnSeq` 每轮 +1（跨段累计，仅 `!resume` 链起点复位）；面向消费面的两字段
    // （状态行 + ⟦ev⟧turn / ⟦ev⟧approval 事件共用）在此同点赋值（编号唯一权威；帧
    // 公式 = helpers.mjs turnFrame）。段内帽判定不读帧（下行循环条件只读段内
    // turn / maxTurns——N6）。
    const frame = turnFrame(++agent._turnSeq, turn, maxTurns)
    agent._currentTurn = frame.turn
    agent._maxTurns = frame.maxTurns
    // #934 B 面读数分母（§6.32.4）：本段轮数逐轮 +1——段起点复位见 run-start.mjs（与零落笔计数同点）。
    agent._segmentTurns = (agent._segmentTurns ?? 0) + 1
    // #417（撞帽载荷「本段零落盘轮数」——采集点与 `_turnSeq` 同源面）：上一轮至今写序未推进
    // ⇒ 上一轮零落笔，计数 +1；写序标每轮前移（撞帽收尾轮在环外结账——见下方 ContinueError 前）。
    // #934（零落笔看门狗——§6.32.2 ① 单点采集）：streak 与越阈判定同点——上轮零落笔 ⇒ +1 并判越阈；
    // 有落笔 ⇒ streak 归零 + 清闩（写后重臂——每连续零落笔段恰一条）。#417 计数与 streak 同源同谓词。
    if (turn > 0) {
      if (!wroteSince(agent, agent._mutSeqMark)) {
        agent._zeroWriteTurns += 1
        agent._zeroWriteStreak += 1
        maybeZeroWriteAlert(agent) // #934：连续零落笔越阈 ⇒ 自动上行提醒（只推——§6.32）
      } else {
        agent._zeroWriteStreak = 0
        agent._zeroWriteAlerted = false // 写后重臂
      }
    }
    agent._mutSeqMark = agent._mutationSeq
    // D2 (AGENT-LOOP-SUBAGENT.md §6.7.2): depth>0 children emit a ⟦ev⟧turn progress token each turn —
    // single emit point covering all three spawn tools; phase=llm (tool/done progress rides
    // the onToolCall/onToolResult relay — no token for those). 第 19 批：载荷取上方帧值
    // （agent._currentTurn / _maxTurns——字段形态 / 字段数 / phase 零变化，N5）。
    if (depth > 0 && callbacks.onToken) {
      callbacks.onToken(`⟦ev⟧turn\x1e${agent._currentTurn}\x1e${agent._maxTurns}\x1ellm\x1e`)
    }
    // §2.5 #78 并入（VSC 帧回调）：每轮帧另经结构化回调发出（池条目 entry.turn 的
    // VSC 等价通道——⟦ev⟧turn token 解析的宿主面随时可用；签名扩展向后兼容）。
    callbacks.onAgentTurn?.(frame.turn, frame.maxTurns)

    // SUBAGENT-OBSERVE-SEND D2: 子代理回合边界消费点——每轮开头把父侧经 subagent
    // action:'send' 注入队列（entry._injected）的消息按普通 user 回合推入子历史
    // （pushReal → 下一轮 chat 即含该指令）。由 executeAsyncSpawn 经 childRunOpts 贯通的
    // consumeInjected 回调承载（异步子代理专属——缺省 null：主会话/阻塞子代理零开销）。
    consumeInjected?.(agent)
    // 子代理在飞消息（子 → 父；§6.27）：空队列 no-op；非空 ⇒ 恰一条合并 user 消息注入。
    // 批 async-delivery-formalize（§6.34.2 行 2）：驱动面收窄「交付轮轮首」（`turn === 0` ∧ `autoTurn`——
    // 用户回合零 drain）；回退面（`!suspDriven`）逐字保持（每轮每步）。
    if (!suspDriven || (turn === 0 && autoTurn === true)) drainChildUpstream(agent)
    // ③ 用户 → 主会话投递（步边界 pickup——queue-visible 批 fix 轮 2026-09-24 · F16）：循环头
    // 回合边界缝（核只给缝、不给策略——取批 / pushReal / 呈现归端侧闭包）；缺省 null，系统轮不传
    // （`AGENT-LOOP-ASYNC-POOL.md` §6.8「步边界 pickup」· 适用面 = 用户回合）。
    consumeQueuedInput?.(agent)

    const lastRole = agent.history.at(-1)?.role
    if (lastRole === "user" || lastRole === "tool") {
      // 2026-09-05 实践轮：压缩检查/降级计数提为 runCompactionCheck（agent/run-stages.mjs——
      // CLI 对位 VS run-stages）——循环骨架此处只剩检查调用（recentCallSigs 对象引用回流）。
      await runCompactionCheck(agent, { threshold, callbacks, compactionOverhead, signal, recentCallSigs })
    }

    // 2026-09-05 实践轮：plan cadence + eng 状态注入提为 injectTurnReminders（run-stages）
    await injectTurnReminders(agent, { depth })

    const response = await callTurn({
      systemPrompt, toolSchemas, streamOutput, callbacks, signal, streamRuleFired, autoTurn, depth, turn,
    })

    // 空响应预算复位（AGENT-LOOP.md §6.5① · D-AL28）：本轮响应**有实质** ⇒ 计数清 0（实质 = 有正文
    // 或带工具调用；判据单源 = completion.mjs `isSubstantiveResponse`）。落位 = 本轮响应存在的第一处、
    // 也是四支路（下方流规则 abort ∥ 用户中断 ∥ 工具批 ∥ 零工具）发散前的最后一处——落进任一分支都会漏其余三支。
    // 与下方 `guardPushbacks = 0`（工具批执行处）分工：那处复位的是 verify ∥ advisor 推回预算、只看「有工具批」；
    // 本处复位空响应预算、看「有实质」——正文本身已是实质，不必等工具批。
    if (isSubstantiveResponse(response)) agent._emptyRetries = 0

    // §6.31.5 落痕（消化账务批 · 2026-10-05 · 台账 #930 ∥ #939 收正）：本 run 内**逐轮追加**——
    // 每模型轮返回即写（会话态）；首轮签收不为收口轮覆盖（见账取件读累积痕）。
    // 落父字段（抗 `history` 整体替换——`context.mjs` `applyCompression`）；非会话零动作。
    if (carrierField(agent, "_daSession") === true && response.content) {
      agent._lastRunOutput = `${agent._lastRunOutput ?? ""}${response.content}\n`
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
      // AGENT-LOOP-SUBAGENT.md §6.12 站点 #8（第 24 批）：错误对象已自带 name/message——只补来源标注（缺 abortInfo 才补）
      throw annotateAbort(Object.assign(new Error("User interrupted"), { name: "AbortError" }), signal, "agent", "interrupted-response")
    }

    if (response.usage) {
      callbacks.onUsage?.(response.usage)
      // Core-side cumulative cache tally (batch 2026-10-18-context-cache-visibility):
      // every agent (parent or child) keeps its own hit/miss so `context` can report
      // cache efficiency instead of the terminal faces being the only tally holders.
      agent._cacheHitTokens = (agent._cacheHitTokens ?? 0) + (response.usage.prompt_cache_hit_tokens ?? 0)
      agent._cacheMissTokens = (agent._cacheMissTokens ?? 0) + (response.usage.prompt_cache_miss_tokens ?? 0)
      agent._usageTurns = (agent._usageTurns ?? 0) + 1
      if (response.usage.prompt_tokens != null) {
        agent._lastPromptTokens = response.usage.prompt_tokens
        agent._usageAtLen = agent.history.length
      }
      // §6.17 估算自校准：服务端真值 ÷ 输入侧估算（`estimated` = 发送面净判同一个 estPrompt）
      recordTokenSample(agent, agent.provider, response.estimated, response.usage)
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
        // TRACES.md §6.1 D-TR4：depth 透传（distill 轨迹元数据——与 compress 同通道）；extras = 会话续写前缀面（§6.15）
        // §2.5-B（P4-I）：端壳经 `opts.distillSignal` 供蒸馏专用中止信号（与运行 signal 分离——
        // 运行 controller 重建不杀蒸馏）；缺省（null）⇒ `signal` 逐字零变。
        const distill = summarizeRunExplorations(agent, callbacks, distillSignal ?? signal, depth,
          { systemPrompt, tools: toolSchemas }).catch(() => {}) // 与回合请求同源（无第二构造点）
        agent._pendingDistill = distill
      }
      return cr.content
    }

    // abort after chat completes, before committing history: don't commit a half-finished turn
    if (signal?.aborted) throw abortError(signal, "agent", "post-chat")

    pushReal(agent, assistantToolCallMessage(response, specForModel(agent.provider.model)))

    const results = await executeToolCalls(agent, toolByName, response.toolCalls, callbacks, depth, signal)

    // Ctrl+I interrupt during tool execution: skip committing partial results — inject
    // the interrupt and retry (placeholder results keep strict providers pairable).
    if (signal?.reason?.interrupt) {
      // 中断变更记账（2026-08-31 评审 #4）：此分支的工具已全部执行完成（磁盘已变，execute 已完成），
      // 真实结果按语义不进历史（placeholder 替代）——但变更必须记账：否则 guard 看到
      // "本轮未改代码" 放行，评审/verify 门禁被绕过（文件改了却没评审）。
      // §29 fix A（2026-09-07）：mutation-seq 记账已收敛到 dispatch runOne 执行成功即刻
      // （唯一记账点——本分支不再 noteMutations——不双计——中断+同批 launch seq 单计
      // 回归断言见 §29 T-A1i）；此处仅剩 guard 标志 + touchedFiles 记账。
      for (const { toolCall, ok } of results) {
        const tool = toolByName.get(toolCall.name)
        if (!ok || !tool || !FILE_MUTATORS.has(toolCall.name)) continue
        agent._mutatedThisRun = true
        agent._calledAdvisorThisRun = false
        agent._verifiedThisRun = false
        agent._verifyPassed = undefined
        try {
          const args = JSON.parse(toolCall.arguments)
          const paths = toolTouchPaths(tool, args)
          for (const p of paths) {
            const abs = resolve(agent.cwd, p)
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

    injectPostTurn(agent, results, recentCallSigs, callbacks, turn, { suspDriven })
  }

  // #417（撞帽载荷「本段零落盘轮数」）：收尾轮（撞帽轮）单结——与环内同一谓词（不另作 alert ∥ streak
  // 判定，链尾无下一轮可推报）；轮顶计数只覆盖到倒数第二轮（maxTurns ≤ 0 时环未跑，不虚计）。
  if (maxTurns > 0 && !wroteSince(agent, agent._mutSeqMark)) agent._zeroWriteTurns += 1
  // #793（核面小修批——AGENT-LOOP.md §6.2 环边界中止前置 ∥ 需求 F5）：环尾检查点——中止恒以
  // AbortError 收束（不落 ContinueError——用户 Stop 优先于继续提示；消费契约 = 外层按 reason 判定）。
  if (signal?.aborted) throw abortError(signal, "agent", "turn-tail")
  throw new ContinueError(maxTurns)
}
