/**
 * agent-turn.mjs — runAgentTurn：一个用户回合的驱动器（submit / 队列递归入口）。
 *
 * 2026-08-30 拆分（回回 500 行硬限）：回合生命周期（状态复位 → runAgent 循环 →
 * 错误/Continue/中断处理 → finally 收尾 → 队列）留在这里；工具事件 → TUI 状态的
 * 回调装配（onToken/onReasoning/onToolCall/onToolResult/onToolOutput/onTurnEnd 等
 * + flushStream）在 tool-events.mjs buildToolCallbacks；子agent 区块缓冲与完成冻结
 * （routeSub* / finishSubTask / freeze*SubTasks）在 subagent-blocks.mjs；标题生成
 * 在 generate-title.mjs ensureSessionTitle。
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
export async function runAgentTurn(ctx, text) {
  const { agent, state, pushLine, pushLabel, render, scheduleRender, ensureAssistantLabel, askPermission, askBatchPermission, askQuestion, handleSlash } = ctx
  // 可注入覆盖（测试用）；默认走真实实现
  const runAgentImpl = ctx.runAgent ?? runAgent
  const saveSessionImpl = ctx.saveSession ?? saveSession
  pushLabel(`❯ You:`, ansi.bold + C.user)
  pushLine(text, C.text)

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
  state.controller = new AbortController()
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
        await runAgentImpl(agent, text, callbacks, { signal: state.controller.signal, resume })
        flushStream()
        break // Normal completion, exit loop
      } catch (error) {
        flushStream()
        if (error.name === "AbortError" || state.controller?.signal.aborted) {
          // Ctrl+I inject: the signal was aborted with an interrupt message — the agent loop
          // may have already injected it into history, but the aborted signal prevents retry.
          // Recreate the controller and resume from the same context.
          if (state.controller?.signal?.reason?.interrupt) {
            state.controller = new AbortController()
            resume = true
            continue
          }
          pushLine("[stopped]", C.warn)
          break
        }
        if (error instanceof ContinueError) {
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
          state.controller = new AbortController()
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
    // Interrupted runs (Ctrl+C abort / error mid-turn): still-running child blocks
    // would linger as pinned ghosts above the input box — freeze them like normal
    // completions so the trace scrolls away with the conversation (2026-08-30).
    freezeAllSubTasks(state)
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
}
