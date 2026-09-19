/**
 * agent-turn.mjs — runAgentTurn：一个用户回合的驱动器（submit / 队列递归入口）。
 *
 * 2026-08-30 拆分（回回 500 行硬限）：回合生命周期（状态复位 → runAgent 循环 →
 * 错误/Continue/中断处理 → finally 收尾 → 队列）留在这里；工具事件 → TUI 状态的
 * 回调装配（onToken/onReasoning/onToolCall/onToolResult/onToolOutput/onTurnEnd 等
 * + flushStream）在 tool-events.mjs buildToolCallbacks；子agent 区块缓冲与完成冻结
 * （routeSub* / finishSubTask / freeze*SubTasks）在 subagent-blocks.mjs；标题生成
 * 在 generate-title.mjs ensureSessionTitle。
 *
 * 2026-09-05 module-split：§17 挂起会话段（suspensionSession/digestTurn/poolLive/
 * poolCounts 等——agent-turn.mjs 535 > 500 硬限）verbatim 迁至 suspension-drive.mjs——
 * 本文件回合尾经 suspensionSession 进入驱动器；驱动器内 digest/用户回合经 runAgentTurn
 * 递归回本文件（函数级静态环——模块求值期无顶层调用，环安全——session-slots ↔
 * session.mjs 同款先例）。
 */
import { runAgent, ContinueError } from "@thincoder/core/agent.mjs"
import { saveSession } from "@thincoder/core/session.mjs"
import { ansi, C } from "./ansi.mjs"
import { buildToolCallbacks, sweepToolBlocks } from "./tool-events.mjs"
import { freezeAllSubTasks } from "./subagent-blocks.mjs" // freezeReclaimDigestedBlocks 随 §17 段迁 suspension-drive.mjs
import { ensureSessionTitle } from "@thincoder/core/generate-title.mjs"
import { logEvent, errText } from "@thincoder/core/log.mjs"
import { suspensionSession, poolLive } from "./suspension-drive.mjs"

/** Exit-flush bound for the async end-of-run distillation (SEND-STALL-DISTILL §2.5):
 *  wait at most this long for the in-flight distill before the final session save —
 *  never let shutdown hang on the background summary call. */
const DISTILL_FLUSH_TIMEOUT_MS = 5000

/**
 * 第 33 批（TUI §14.3(d)——纯函数，供测试直驱）：回合链尾「需要用户」谓词——agent 已停
 * 且无自动续跑 ⇒ 置 attention 位。排除项语义（F13）：`skipSession`（digest / 会话内回合
 *  ——由外层链尾统一置位）· 挂起两态 / 池 live / 队列非空（自动续跑中——不由用户接手）·
 *  processing（回合在跑）。
 *  @returns {boolean}
 */
export function userNeededAtTurnEnd(state, agent, skipSession) {
  return !skipSession && !state.suspended && !state._suspPending && !poolLive(agent)
    && state.queue.length === 0 && !state.processing
}

/**
 * LOGGING（docs/design/LOGGING.md）包装：回合骨架事件（turn:start/turn:end——kind
 * user/auto；result ok/stopped/error）。内层经 _logOutcome 载具回传终止原因（中止/
 * turn-cap 拒绝/错误 vs 正常完成）——嵌套回合（队列递归/挂起会话内 digest 轮）各自
 * 新开载具（每次包装调用独立），互不串扰。err:internal = 逃出内层的未分类异常。
 */
export async function runAgentTurn(ctx, text, opts = {}) {
  const kind = opts?.autoTurn ? "auto" : "user"
  const runOpts = { ...(opts ?? {}) }
  delete runOpts._logOutcome
  const carrier = {}
  runOpts._logOutcome = carrier
  const t0 = Date.now()
  logEvent("turn:start", { kind })
  try {
    const result = await runAgentTurnInner(ctx, text, runOpts)
    return result
  } catch (e) {
    carrier.result = "error"
    logEvent("err:internal", { msg: errText(e, 200), where: "runAgentTurn" })
    throw e
  } finally {
    logEvent("turn:end", { kind, ms: Date.now() - t0, result: carrier.result ?? "ok" })
  }
}

/** runAgentTurn 本体（LOGGING 包装之外——见上方包装器）。 */
async function runAgentTurnInner(ctx, text, opts) {
  const { autoTurn = false, skipSession = false, upstreamTurn = false } = opts ?? {} // upstreamTurn：上行 ask 唤醒轮旗标（§6.27.12.5 D/I——透传核 runAgent，仅供域文本选择）
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
  // §17.6（advisor round2 🟡）：回合启动即解除空闲退出武装——exitArmed 只属于空闲态
  // 双确认，跨回合残留会让"停回合后的 armed 落空穿透 + 陈旧 exitArmed"组合把一次
  // 意图为全停/退出的按下变成无二次确认的即时退出（key-handler 落空分支落回空闲
  // 分支时 `!state.exitArmed` 判假即 exit）；计时一并清（key-handler 空闲分支按
  // ctx.exitArmTimer 有无决定是否重建——陈旧 timer 残留会在回合中途复位新武装）。
  state.exitArmed = false
  if (ctx.exitArmTimer) {
    clearTimeout(ctx.exitArmTimer)
    ctx.exitArmTimer = null
  }
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
        await runAgentImpl(agent, text, callbacks, { signal: state.controller.signal, resume, autoTurn, upstreamTurn, suspDriven: true })
        flushStream()
        break // Normal completion, exit loop
      } catch (error) {
        flushStream()
        if (error.name === "AbortError" || state.controller?.signal.aborted) {
          const reason = state.controller?.signal?.reason
          // §17.6 D-C1（round1 #1 区分机制——2026-09-03）：interrupt 两种语义——
          //  有 message（Ctrl+I 注入——key-modes handleInterruptMode）= 重建 controller
          //  续跑（既有语义——agent loop 已把消息注入 history，中止的 signal 不能重试）；
          //  无 message（Ctrl+C 首按停回合——key-handler abort({ interrupt: true })
          //  不带 message——非挂起 processing 态 / 挂起态 digest·会话内回合）
          //  = 停回合不续跑——池保留由 agent.mjs 回合收尾的 !interrupt 清池条件排除
          //  实现（D-C2——agent.mjs 零改动）。
          if (reason?.interrupt && reason?.message) {
            state.controller = makeController()
            resume = true
            continue
          }
          if (reason?.interrupt) {
            // 无 message interrupt 的注入副作用回滚：agent.mjs 中断三段（chat catch /
            // response.interrupted / 工具执行中断）无条件把 "[User interrupt: <msg>]"
            // 落 history，对 message 存在性无守卫——无 message 时成为 "[User interrupt:
            // undefined]" 垃圾上下文（消息注入语义只属于 Ctrl+I 续跑——停回合无注入
            // 消息）。D-C2 agent.mjs 零改动约束下在回合层回滚尾部垃圾（确定性：中断
            // 注入恒为最后一条——break 前 history 不再追加）。partial 部分输出不回滚
            // ——interrupt 家族语义（§2 Ctrl+I 同款"提交部分输出"）——advisor round1
            // 🟡 裁定：回滚需区分工具/子代理路径的既有完整消息（history 层不可靠）。
            const h = agent.history
            while (h?.length > 0 && String(h.at(-1)?.content ?? "") === "[User interrupt: undefined]") h.pop()
          }
          pushLine("[stopped]", C.warn)
          if (opts?._logOutcome) opts._logOutcome.result = "stopped"
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
            if (opts?._logOutcome) opts._logOutcome.result = "stopped"
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
            if (opts?._logOutcome) opts._logOutcome.result = "stopped"
            break
          }
          pushLine("[continuing…]", C.tool)
          // Recreate AbortController: once aborted, resume immediately fails (defensive; current path unreachable but tightly coupled)
          state.controller = makeController()
          continue
        }
        pushLine(`[error] ${error.message}`, C.error)
        if (opts?._logOutcome) opts._logOutcome.result = "error"
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
    // §17.5.5：挂起会话内回合（digest/会话内用户回合——skipSession 且 suspended）的
    // 收尾**不冻结驻留块**——已消化（pinned 且条目已注入）块由 suspensionSession 在
    // run 返回后 freezeReclaimDigestedBlocks 逐条回收（settle 锚点 splice——digest 总览文本
    // 之前——round1 #1 裁定，不等池空）；
    // 未消化残项由会话退出 freezeAllSubTasks 兜底。若无此例外，池空的 digest 回合会在
    // finally 抢先按 settle 锚点冻结（旧池空补发语义）——回收时序被抢占（T-S6）。
    const inSessionTurn = skipSession && state.suspended
    if (!willSuspend && !inSessionTurn) {
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

  // §17 偏差 #1 兜底（INPUT-LOCK 单槽化——2026-09-09）：释放窗口期 Enter 已入
  // pendingInput 单槽——链条走到此处若池已空（挂起会话不会启动，下方 while 是最后一个
  // 消费点）则转正队列照常续发，消息不滞留不并发。池非空时挂起会话先消费 pendingInput
  // （D-S5 输入优先），无需此处处理。单槽语义下残余至多一条。
  if (!skipSession && !state._suspAborted && (state.pendingInput?.length ?? 0) > 0 && !poolLive(agent)) {
    state.queue.push({ text: String(state.pendingInput.shift()) })
  }

  // 交接消息自动续发（INPUT-LOCK 单消息——2026-09-09）：submit 不再排队（busy 提交吞）
  // + R15 攒批删——state.queue 只剩残项单消息（释放窗口兜底/挂起中止残余——零丢失
  // 承诺）——逐条直发；斜杠命令直接执行（保序）；回合后的续发由递归层同循环续取。
  while (state.queue.length > 0 && !state.processing) {
    const head = state.queue.shift()
    // 残项斜杠命令直接执行——保序、绝不合并
    if (head.text.startsWith("/")) {
      await handleSlash(head.text)
      render()
      continue
    }
    await runAgentTurn(ctx, head.text)
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

  // 第 33 批（TUI §14.3(d)）：顶层链尾（队列续发循环与挂起会话退出**之后**）——无人自动
  // 接手 ⇒ 置 attention 位（渲染层实时派生 blocked/awaiting；用户任意输入清位）。D-AT6：
  // 不放在回合末 finally——那之后还有队列续发 / 挂起会话（digest 自动消费），不是「需要用户」。
  if (userNeededAtTurnEnd(state, agent, skipSession)) {
    state.attentionAwaiting = true
    render()
  }
}
