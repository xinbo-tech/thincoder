/**
 * agent-turn.mjs — runAgentTurn：一个用户回合的驱动器（submit / 队列递归入口）
 * + §17 挂起会话（suspensionSession：async 子代理后台运行期间主会话可继续对话）。
 *
 * 2026-08-30 拆分（回回 500 行硬限）：回合生命周期（状态复位 → runAgent 循环 →
 * 错误/Continue/中断处理 → finally 收尾 → 队列）留在这里；工具事件 → TUI 状态的
 * 回调装配（onToken/onReasoning/onToolCall/onToolResult/onToolOutput/onTurnEnd 等
 * + flushStream）在 tool-events.mjs buildToolCallbacks；子agent 区块缓冲与完成冻结
 * （routeSub* / finishSubTask / freeze*SubTasks）在 subagent-blocks.mjs；标题生成
 * 在 generate-title.mjs ensureSessionTitle。
 *
 * §17（2026-09-02，AGENT-LOOP.md §17 D-S1..S9）：回合尾后台池非空 → 不阻塞等待，
 * 进入挂起态——输入放开（Enter = 新回合 / digest 中 Enter 排队 pendingInput）、
 * settle 事件驱动 auto-turn 消化（手动档 organize-only / AUTO 档全语义）、池空 + 无
 * 待处理输入 → 补发 done 冻结自然退出。状态机行表见 AGENT-LOOP.md §17 D-S9。
 */
import { runAgent, ContinueError } from "../agent.mjs"
import { saveSession } from "../session.mjs"
import { ansi, C } from "./ansi.mjs"
import { buildToolCallbacks, sweepToolBlocks } from "./tool-events.mjs"
import { freezeAllSubTasks } from "./subagent-blocks.mjs"
import { ensureSessionTitle } from "../generate-title.mjs"

/** Exit-flush bound for the async end-of-run distillation (SEND-STALL-DISTILL §2.5):
 *  wait at most this long for the in-flight distill before the final session save —
 *  never let shutdown hang on the background summary call. */
const DISTILL_FLUSH_TIMEOUT_MS = 5000

/** Execute one agent conversation turn (triggered by submit or queue).
 *  Extracted from index.mjs: agent loop + callback construction + error handling + queue processing.
 *  ctx: { agent, state, pushLine, pushLabel, render, scheduleRender,
 *         ensureAssistantLabel, askPermission, askBatchPermission, askQuestion,
 *         handleSlash, summarize } */
export async function runAgentTurn(ctx, text, { autoTurn = false, skipSession = false } = {}) {
  const { agent, state, pushLine, pushLabel, render, scheduleRender, ensureAssistantLabel, askPermission, askBatchPermission, askQuestion, handleSlash } = ctx
  // 可注入覆盖（测试用）；默认走真实实现
  const runAgentImpl = ctx.runAgent ?? runAgent
  const saveSessionImpl = ctx.saveSession ?? saveSession
  // autoTurn（消化轮）：无用户输入——不画 "❯ You:"（系统驱动回合，§17 D-S6）
  if (!autoTurn) {
    pushLabel(`❯ You:`, ansi.bold + C.user)
    pushLine(text, C.text)
  }

  ctx.assistantLabeled = false
  state.processing = true
  state.status = "Processing..."
  state.streaming = ""
  state.reasoning = ""
  state._advisorBlocks = []
  // NOTE (§7.2 D4): state.subTasks is intentionally NOT reset here — subagent
  // activity blocks persist across turns (the user can still expand a finished
  // child's block from a previous turn). Child tool calls never enter the parent
  // history, so the blocks are the only trace of child activity; memory is
  // bounded by the N2 per-child 500-line ring buffer.
  state.currentTool = null
  state.processingStarted = Date.now()
  // §17 偏差修复 #3（会话 abort 全覆盖）：回合链 controller 登记。链头 = 非挂起会话内
  // 且非释放窗口期（suspended/_suspPending 均 false）开启的回合——登记表清零；队列
  // 递归回合（_suspPending 置位期）与会话内回合（suspended=true）继续累积。链条内每次
  // 重建（Ctrl+I 续跑 / ContinueError 续跑 / AUTO 续跑）都登记——挂起会话的 abort 集合
  // （_sessionAbortAll）必须在会话建立时覆盖进入会话以来的全部 controller：只 abort
  // 最后一个会让旧 controller 下 spawn 的 async children 逃逸中止（偏差 #3）。
  // 链头同时清掉上一链条残留的会话句柄（上一链 pool 先 live 后耗尽、未进入会话即结束
  // 时 _sessionAbort 会滞留——不清理则下一链的会话 signal 指向旧 controller，Ctrl+C
  // 中止集合漏掉会话期 spawn 的 children）。
  if (!state.suspended && !state._suspPending) {
    state._turnControllers = []
    agent._sessionAbort = null
    agent._sessionAbortAll = null
  }
  state._turnControllers ??= []
  const makeController = () => {
    const c = new AbortController()
    state._turnControllers.push(c)
    return c
  }
  state.controller = makeController()
  state.interruptPrompt = null
  // Refresh status bar every second during processing; also refresh when any
  // subagent block is still running so its header elapsed ticks (§7.2 D4 —
  // no new timer, the existing ticker carries it). Blocks stay visible after
  // the turn ends, but frozen headers don't need 1s refreshes.
  const subRunning = () => Object.values(state.subTasks ?? {}).some((s) => !s.done)
  const ticker = setInterval(() => {
    if (state.processing || subRunning()) render()
  }, 1000)
  render()

  const { callbacks, flushStream } = buildToolCallbacks({
    agent, state, pushLine, render, scheduleRender, ensureAssistantLabel, askPermission, askBatchPermission, askQuestion, saveSessionImpl,
  })

  // try/finally: every exit path — including an unexpected throw inside the catch
  // block (e.g. the continue-permission UI) — must stop the ticker and reset state,
  // otherwise the 1s render interval leaks and keeps firing forever.
  try {
    for (let resume = false; ; resume = true) {
      try {
        await runAgentImpl(agent, text, callbacks, { signal: state.controller.signal, resume, autoTurn })
        flushStream()
        break // Normal completion, exit loop
      } catch (error) {
        flushStream()
        if (error.name === "AbortError" || state.controller?.signal.aborted) {
          // Ctrl+I inject: the signal was aborted with an interrupt message — the agent loop
          // may have already injected it into history, but the aborted signal prevents retry.
          // Recreate the controller and resume from the same context.
          if (state.controller?.signal?.reason?.interrupt) {
            state.controller = makeController()
            resume = true
            continue
          }
          pushLine("[stopped]", C.warn)
          break
        }
        if (error instanceof ContinueError) {
          if (autoTurn) {
            // §17 digest turn-cap 规则（D-S9 ContinueError 行）：无面板——AUTO 档按
            // §2 统一规则自动 resume（无人值守授权）；手动档静默拒绝（部分消化留在
            // 历史，会话回挂起——结果不丢，只是不再烧轮次）。
            if (agent.autoApprove) {
              pushLine("[auto-turn: continuing past turn cap…]", C.dim)
              state.controller = makeController()
              continue
            }
            pushLine(`[auto-turn stopped at ${error.turn} turns — partial digest; finished reports stay in history]`, C.warn)
            break
          }
          pushLabel(`❯ Continue`, ansi.bold + C.warn)
          pushLine(`Ran ${error.turn} turns (limit ${error.turn}). Continue?`, C.warn)
          // Pause to ask: reuse permission mechanism
          const willContinue = await new Promise((resolve) => {
            state.permission = {
              name: "continue",
              args: { turns: error.turn },
              resolve,
            }
            state.status = `Continue after ${error.turn} turns?`
            render()
          })
          state.permission = null
          if (!willContinue) {
            pushLine("[continue cancelled]", C.warn)
            break
          }
          pushLine("[continuing…]", C.tool)
          // Recreate AbortController: once aborted, resume immediately fails (defensive; current path unreachable but tightly coupled)
          state.controller = makeController()
          continue
        }
        pushLine(`[error] ${error.message}`, C.error)
        break
      }
    }
  } finally {
    clearInterval(ticker)
    state.processing = false
    state._advisorBlocks = []
    // §17 D-S1/D-S8：回合正常结束且后台池仍 live → 挂起会话：子agent 区块保持 live
    // （不冻结——各 settle 事件自行处理），本次回合 controller 交会话层作 abort 句柄
    // （挂起期 Ctrl+C 中止全部后台子代理）；池空 / 中断 / 错误 → 现状 freezeAllSubTasks
    // （中断态块标 interrupted；正常态块已在 settle 时各自冻结）。
    const willSuspend = poolLive(agent)
    if (!willSuspend) {
      // Interrupted runs (Ctrl+C abort / error mid-turn): still-running child blocks
      // would linger as pinned ghosts above the input box — freeze them like normal
      // completions so the trace scrolls away with the conversation (2026-08-30).
      freezeAllSubTasks(state)
    } else if (!agent._sessionAbort) {
      agent._sessionAbort = state.controller // 会话 abort 句柄（children 共享此 signal）
    }
    // §17 偏差修复 #1（回合释放窗口守卫）：willSuspend 判定后、进入任何 await 之前置位
    // 挂起待定标志。suspensionSession 真正启动前还有真实 await（ensureSessionTitle /
    // distill flush ≤5s / saveSession），其间 processing=false 且 suspended 尚未置位——
    // 无此标志 key-handler Enter 会走 submit 并发开第二个 runAgentTurn（双驱动器竞态：
    // 两个 runAgent 循环同时 pushReal 同一 agent.history，工具配对/上下文交错）。标志
    // 有效区间 = 释放窗口（suspensionSession 启动即清除）；会话内回合（skipSession）
    // 由 state.suspended 覆盖；_suspAborted 时挂起会话不会启动（下方会话入口同条件）。
    state._suspPending = willSuspend && !skipSession && !state._suspAborted
    // §17 偏差修复 #3（会话 abort 全覆盖）：abort 集合快照 = 本链条内全部 controller
    // （含 Ctrl+I/ContinueError 重建的旧 controller——其下 spawn 的 async children 持旧
    // signal，Ctrl+C 只 abort 最后一个会让它们跑完整个 turn 预算，正常完成后仍
    // mergeChildMutations 写父 guard 标记，绕过 advisor/verify 门）。会话内回合的 finally
    // 会重复快照（链条累积），幂等。
    if (willSuspend) agent._sessionAbortAll = [...(state._turnControllers ?? [])]
    // Tool-block carriers get the same sweep (P0-2, 2026-08-30 consult): without
    // an onToolResult their header would say "running" forever; ticks are cleared
    // so no stale start time leaks into the next turn.
    sweepToolBlocks(state)
    state.controller = null
    state.status = "Ready"
    // FR1: status bar must recover immediately — the awaits below (title-gen, distill flush,
    // save) may take seconds and the 1s ticker is already stopped, so render NOW or the bar
    // keeps showing the stale "Processing..." until the turn function fully unwinds.
    render()
    // Auto-collapse todo panel when all tasks done (matching kimi-code TUI; agent.tasks are preserved)
    if (state.tasks.length > 0 && state.tasks.every((t) => t.status === "done")) {
      state.tasks = []
    }
    // Auto-generate session title from the first user message (once per session)
    await ensureSessionTitle(agent)
    // Exit flush (SEND-STALL-DISTILL §2.5): the round-end distillation runs async — before
    // the final save, give it a bounded window to land the compressed history on disk.
    // The next turn's runAgent would await it anyway; this covers the real exit path
    // (no next turn). Bounded: never let shutdown wait longer than the timeout.
    // NOTE: the promise is NOT detached (no `agent._pendingDistill = null` here) — a submit
    // during this window starts the next runAgentTurn concurrently, and its runAgent start
    // MUST still see the in-flight distill to await it BEFORE pushing input (N1). If the
    // flush times out, the next runAgent's start-await takes over — safe by construction.
    if (agent._pendingDistill) {
      await Promise.race([agent._pendingDistill, new Promise((r) => setTimeout(r, ctx.distillFlushTimeoutMs ?? DISTILL_FLUSH_TIMEOUT_MS))])
    }
    // Save session after every turn (survives crashes)
    try {
      saveSessionImpl(agent, state.lines)
    } catch {
      // Save failure doesn't interrupt usage
    }
    render()
  }

  // §17 偏差 #1 兜底：释放窗口期 Enter 已入 pendingInput——链条走到此处若池已空
  //（挂起会话不会启动，下方 while 是最后一个消费点）则转正队列照常续发，消息不滞留
  // 不并发。池非空时挂起会话先消费 pendingInput（D-S5 输入优先），无需此处处理。
  if (!skipSession && !state._suspAborted && (state.pendingInput?.length ?? 0) > 0 && !poolLive(agent)) {
    state.queue.push(...state.pendingInput.splice(0).map((t) => ({ text: String(t) })))
  }

  // Queued messages: auto-process next one
  while (state.queue.length > 0 && !state.processing) {
    const next = state.queue.shift()
    // Queued slash commands execute directly — check every item, not just the first
    if (next.text.startsWith("/")) {
      await handleSlash(next.text)
      render()
      continue
    }
    pushLabel(`❯ You: (from queue)`, ansi.bold + C.user)
    await runAgentTurn(ctx, next.text)
    return
  }

  // §17 D-S2: 回合尾后台池非空 → 挂起会话（D-S9 状态机——输入放开、settle 驱动
  // auto-turn 消化、池空自然退出回 idle）。skipSession：会话内回合（消化轮/会话内
  // 用户回合）由 suspensionSession 统一调度，不再递归进入新会话。
  if (!skipSession && poolLive(agent) && !state._suspAborted) {
    await suspensionSession(ctx)
    // §17 round2 偏差 #1（_suspAborted 粘滞，code review round2 #1）：挂起会话退出
    // （自然耗尽或 Ctrl+C 中止）即复位中止标志——中止 unwind 已完成、池已清空/耗尽，
    // 复位不会误触发重入。不清则 _suspPending 守卫与下方会话入口被同一标志永久门控：
    // 中止后用户再 spawn async、回合尾池再 live 时永不再次进入挂起态（suspensionSession
    // 首行复位成死代码）——子代理结果退化到"下个回合尾才注入"、状态行/自动消化/区块
    // 驻留全消失；释放窗口守卫同步失效（Enter 并发开第二个 runAgentTurn——双驱动器
    // 竞态复现）。
    state._suspAborted = false
  }
}

// ─── §17 挂起会话（AGENT-LOOP.md §17 D-S2/D-S9 状态机行表）────────────────

/** 后台池存活判据（D-S2/F5 口径）：running/queued 子代理，或已 settle 未注入结果
 *  （_pendingAsyncResults 非空 = D-S3 "未注入"）。回合尾与每次轮末都用它评估退出。 */
function poolLive(agent) {
  const map = agent._asyncSubagents
  return (map && map.size > 0) || (agent._pendingAsyncResults?.length ?? 0) > 0
}

/** D-S3 ③ 记账清扫：回合边界竞态落下的已 settle 项（settle 回调未及移交——发生在
 *  回合刚结束、_suspended 尚未置位的窗口）补入 pending。幂等：回调已移交的条目已
 *  从 map 删除并带 _inPending 标记，不会重复入列。 */
function sweepSettledToPending(agent) {
  const map = agent._asyncSubagents
  if (!map || map.size === 0) return
  agent._pendingAsyncResults ??= []
  for (const e of [...map.values()]) {
    if (e.done && !e._inPending) {
      e._inPending = true
      agent._pendingAsyncResults.push(e)
      map.delete(String(e.id))
    }
  }
}

/** 等待下一次 settle（running 子代理 promise 完成）或用户唤醒（Enter 入队 / Ctrl+C /
 *  会话 abort）。唤醒器经 state._suspWake 单槽注入；abort 监听兜底。 */
function waitForSettleOrWake(agent, state) {
  return new Promise((resolve) => {
    let finished = false
    const cleanup = () => {
      state._suspWake = null
      const i = (agent._asyncWaiters ?? []).indexOf(w)
      if (i >= 0) agent._asyncWaiters.splice(i, 1)
      agent._sessionAbort?.signal.removeEventListener("abort", onAbort)
    }
    const finish = (why) => {
      if (finished) return
      finished = true
      cleanup()
      resolve(why)
    }
    const w = () => finish("settle")
    const wake = () => finish("wake")
    const onAbort = () => finish("aborted")
    ;(agent._asyncWaiters ??= []).push(w)
    state._suspWake = wake
    if (agent._sessionAbort?.signal.aborted) { onAbort(); return }
    agent._sessionAbort?.signal.addEventListener("abort", onAbort, { once: true })
  })
}

/** 后台模式状态行文本（D-S8）："后台 N 子代理运行中 · M 待消化"。 */
function backgroundStatusText(agent) {
  const map = agent._asyncSubagents
  const running = map ? [...map.values()].filter((e) => e.status === "running").length : 0
  const queued = agent._asyncQueue?.length ?? 0
  const pending = agent._pendingAsyncResults?.length ?? 0
  const active = running + queued
  return active > 0 || pending > 0
    ? `后台 ${active} 子代理运行中${pending ? ` · ${pending} 待消化` : ""}`
    : "后台子代理收尾…"
}

/** 消化轮：系统驱动的 auto-turn（D-S6）。手动档不传权限/问答 handler（D-S7 装配
 *  契约——denied 不弹面板、不悬挂）；AUTO 档沿用普通回调（autoApprove 短路自动
 *  执行）。_suspended 保持 true：消化中 settle 延迟冻结 + 移交 pending。 */
async function digestTurn(ctx) {
  const { agent, pushLine } = ctx
  const manual = !agent.autoApprove
  const diagTs = Date.now()
  console.error(`[diag] ${diagTs} digestTurn:enter manual=${manual}`)
  pushLine(manual
    ? "[auto-turn: digesting finished subagent reports…]"
    : "[auto-turn: continuing background work…]", C.dim)
  const digestCtx = manual
    ? { ...ctx, askPermission: null, askBatchPermission: null, askQuestion: null }
    : ctx
  try {
    await runAgentTurn(digestCtx, "", { autoTurn: true, skipSession: true })
  } finally {
    console.error(`[diag] ${Date.now()} digestTurn:exit elapsedMs=${Date.now() - diagTs}`)
  }
}

/**
 * §17 挂起会话驱动（D-S9 行表；由 runAgentTurn 回合尾进入，池空自然退出）：
 * - suspension：池项 settle → 入 pending → 开 auto-turn（合并消化近邻 settle）；
 *   用户 Enter → pendingInput（digest 运行中排队，D-S5）——用户输入优先于 digest；
 * - auto-turn：消化中 settle 不并发开新轮（单 runAgent 循环），轮末按 pending/池态
 *   续开合并消化轮或回挂起；pendingInput 非空 → 以该消息开新回合（不触发新 digest）；
 * - 退出：池空 + pending 空 + 无待处理输入 → 补发 done 冻结（freezeAllSubTasks）→ idle。
 * _suspended 翻转：会话期 true（settle 回调据此延迟冻结 + 移交 pending）；会话内
 * 用户回合执行期翻 false（普通回合语义：settle 即冻结 + 回合尾直注入 ①）。
 */
async function suspensionSession(ctx) {
  const { agent, state, render, pushLine } = ctx
  state.pendingInput ??= []
  state._suspAborted = false
  agent._suspended = true
  agent._sessionSignal = agent._sessionAbort.signal // 会话内 spawn 的 children 共享（subagent.mjs）
  state.suspended = true
  state._suspPending = false // 偏差 #1：进入真正挂起态——标志只在释放窗口期有效（此后由 state.suspended 分流）
  const suspTick = setInterval(() => {
    if (state.suspended && !state.processing) {
      state.status = backgroundStatusText(agent)
      render()
    }
  }, 1000)
  state.status = backgroundStatusText(agent)
  render()
  try {
    while (!state._suspAborted && !agent._sessionAbort.signal.aborted) {
      sweepSettledToPending(agent)
      console.error(`[diag] ${Date.now()} suspensionSession:iter pending=${agent._pendingAsyncResults?.length ?? 0} pool=${agent._asyncSubagents?.size ?? 0} subQueue=${agent._asyncQueue?.length ?? 0} userQ=${state.pendingInput.length}/${state.queue.length} suspended=${agent._suspended}`)
      // 1. 用户输入优先（D-S5）：pendingInput 队列 + 消化期排队的 slash 命令
      const queuedText = state.pendingInput.length > 0 ? state.pendingInput.shift()
        : state.queue.length > 0 ? state.queue.shift().text : null
      if (queuedText) {
        if (String(queuedText).startsWith("/")) {
          await ctx.handleSlash?.(queuedText)
          render()
          continue
        }
        agent._suspended = false // 用户回合 = 普通回合语义（① 直注入 + settle 即冻结）
        await runAgentTurn(ctx, String(queuedText), { skipSession: true })
        agent._suspended = true
        state.status = backgroundStatusText(agent)
        continue
      }
      // 2. pending 非空 → 合并消化轮（注入由 runAgent 首行统一完成——D-S3 单注入点）
      if ((agent._pendingAsyncResults?.length ?? 0) > 0) {
        await digestTurn(ctx)
        state.status = backgroundStatusText(agent)
        continue
      }
      // 3. 池空（无 running/queued/未注入）→ 自然退出回 idle（补发冻结在 finally）
      if (!poolLive(agent)) break
      // 4. 等下一 settle / 用户唤醒（Enter 入队、Ctrl+C）
      console.error(`[diag] ${Date.now()} suspensionSession:wait enter`)
      const diagWhy = await waitForSettleOrWake(agent, state)
      console.error(`[diag] ${Date.now()} suspensionSession:wait exit why=${diagWhy}`)
    }
  } finally {
    clearInterval(suspTick)
    const aborted = state._suspAborted || agent._sessionAbort.signal.aborted
    agent._suspended = false
    agent._sessionSignal = null
    agent._sessionAbort = null
    agent._sessionAbortAll = null // 偏差 #3：会话期 controller 集合随句柄一并释放
    state.suspended = false
    state._suspWake = null
    state.suspAbortArmed = false // round2 偏差 #4：会话退出即解除挂起中止武装（防跨会话粘滞）
    if (aborted) {
      // §15 abort 语义：清池不注入（用户显式停——不注入陈旧错误）
      agent._asyncSubagents?.clear()
      agent._asyncQueue = []
      agent._pendingAsyncResults = []
      // §17 round2 偏差 #2-CLI（code review round2 #2-CLI）：中止时不静默丢弃挂起期
      // 排队的用户消息——Enter 已清空输入框并入 pendingInput（用户视为已发送），
      // 残余转回 state.queue（{text} 条目，下个普通回合的队列循环续发——零丢失）
      // + 提示行明示去向（不静默丢）。
      const queuedN = state.pendingInput?.length ?? 0
      if (queuedN > 0) {
        state.queue.push(...state.pendingInput.splice(0).map((t) => ({ text: String(t) })))
        pushLine(`[background work stopped — ${queuedN} queued message${queuedN > 1 ? "s" : ""} will run as a normal turn]`, C.warn)
      }
    } else {
      // D-S3 ③ 兜底：退出前残余（极端竞态）直注入再退——结果零丢失（AC-S2）
      const residual = agent._pendingAsyncResults
      if (residual?.length) {
        const { injectAsyncResult } = await import("../agent-tools/subagent.mjs")
        for (const e of residual.splice(0)) await injectAsyncResult(agent, e)
      }
    }
    // 补发 done 冻结：驻留面板的 awaiting-digest 块随池空冻结进流（T-S14）
    freezeAllSubTasks(state)
    sweepToolBlocks(state)
    state.status = "Ready"
    render()
  }
}
