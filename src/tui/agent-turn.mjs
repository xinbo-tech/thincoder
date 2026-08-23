import { runAgent, ContinueError } from "../agent.mjs"
import { saveSession } from "../session.mjs"
import { sliceByWidth } from "./render.mjs"
import { ansi, C } from "./ansi.mjs"
import { formatToolSummary } from "./tool-summaries.mjs"
import { ADVISOR_THINKING_PLACEHOLDER, resolveAdvisorProvider } from "../advisor/run.mjs"

/** Tool execution start timestamps (performance.now ms), keyed by tool name. */
const _toolTicks = Object.create(null)

/** Per-tool streaming preview line limits — tools with verbose output get more lines.
 *  NOTE: `advisor` is intentionally NOT pruned by the live-line mechanism: its
 *  streaming returns early (kind-split into _advisorThink/advisorStreaming) and
 *  is rendered full-length in render-conversation. The entry is kept for
 *  symmetry with the map's other tools. */
const LIVE_LINE_LIMITS = {
  bash: 10,
  advisor: 15,
  read: 3,
  grep: 8,
  glob: 8,
  search: 8,
  websearch: 8,
  code_search: 8,
  doc_search: 8,
}

/** Execute one agent conversation turn (triggered by submit or queue).
 *  Extracted from index.mjs: agent loop + callback construction + error handling + queue processing.
 *  ctx: { agent, state, pushLine, pushLabel, render, scheduleRender,
 *         ensureAssistantLabel, askPermission, askQuestion,
 *         handleSlash, summarize } */
export async function runAgentTurn(ctx, text) {
  const { agent, state, pushLine, pushLabel, render, scheduleRender, ensureAssistantLabel, askPermission, askQuestion, handleSlash, summarize } = ctx
  // 可注入覆盖（测试用）；默认走真实实现
  const runAgentImpl = ctx.runAgent ?? runAgent
  const saveSessionImpl = ctx.saveSession ?? saveSession
  // A new user message starts a new turn: auto-expanded completed replies from the
  // previous turn (kept open so the user could read them) collapse now.
  for (const idx of state._autoExpand ?? []) {
    state.expandedBlocks?.delete(`long-${idx}`)
  }
  state._autoExpand = []
  pushLabel(`❯ You:`, ansi.bold + C.user)
  pushLine(text, C.text)

  ctx.assistantLabeled = false
  state.processing = true
  state.status = "Processing..."
  state.streaming = ""
  state.reasoning = ""
  state._advisorBlocks = []
  state.subTasks = {}
  state.currentTool = null
  state.processingStarted = Date.now()
  state.controller = new AbortController()
  state.interruptPrompt = null
  // Refresh status bar every second during processing (elapsed timer)
  const ticker = setInterval(() => {
    if (state.processing) render()
  }, 1000)
  render()

  // NOTE: advisor buffers (_advisorThink/advisorStreaming) are cleared here too.
  // Timing safety: onToolResult flushes _advisorThink into history and empties
  // the buffers BEFORE onTurnEnd can call flushStream (tool result is
  // dispatched inside executeToolCalls; onTurnEnd fires after the turn loop
  // resumes). If a future change calls flushStream mid-advisor-execution the
  // in-progress thinking WOULD be lost — keep the ordering, or flush here too.
  const flushStream = () => {
    if (state.reasoning) {
      const idx = state.lines.length
      pushLine(state.reasoning, C.reason)
      // Completed reasoning stays expanded (user is reading it) until the next turn
      state.expandedBlocks ??= new Set()
      state.expandedBlocks.add(`long-${idx}`)
      state._autoExpand ??= []
      state._autoExpand.push(idx)
      state.reasoning = ""
    }
    if (state.streaming) {
      const idx = state.lines.length
      pushLine(state.streaming, C.text)
      // Completed main output stays expanded (user is reading it) until the next turn
      state.expandedBlocks ??= new Set()
      state.expandedBlocks.add(`long-${idx}`)
      state._autoExpand ??= []
      state._autoExpand.push(idx)
      state.streaming = ""
    }
    state._advisorBlocks = []
  }

  const callbacks = {
    onToken: (t) => {
      // Subagent streaming: prefix format role#id/ → extract id, update subTask streaming text
      const subMatch = t.match(/^([\w-]+)#(\d+)\//)
      if (subMatch) {
        const key = `${subMatch[1]}#${subMatch[2]}`
        const payload = t.slice(subMatch[0].length)
        if (!state.subTasks[key]) {
          state.subTasks[key] = { key, role: subMatch[1], text: "", tool: null, done: false, started: Date.now() }
        }
        // `[model]<name>` metadata token: record the subagent's model (may differ from the
        // parent's) — shown in the subagent header, NOT appended to its content stream.
        // Only treat as metadata when the model isn't set yet (it's always the FIRST token);
        // a child content token that happens to start with "[model]" must not be swallowed.
        if (payload.startsWith("[model]") && state.subTasks[key].model === undefined) {
          state.subTasks[key].model = payload.slice(7)
          scheduleRender()
          return
        }
        state.subTasks[key].text += payload
        if (state.subTasks[key].text.length > 2000) {
          state.subTasks[key].text = state.subTasks[key].text.slice(-2000)
        }
        scheduleRender()
        return
      }
      ensureAssistantLabel()
      state.streaming += t
      scheduleRender()
    },
    onReasoning: (t) => {
      // Subagent reasoning tokens also carry role#id/ prefix, go into subTasks panel
      const subMatch = t.match(/^([\w-]+)#(\d+)\//)
      if (subMatch) {
        const key = `${subMatch[1]}#${subMatch[2]}`
        if (!state.subTasks[key]) {
          state.subTasks[key] = { key, role: subMatch[1], text: "", tool: null, done: false, started: Date.now() }
        }
        scheduleRender()
        return
      }
      ensureAssistantLabel()
      state.reasoning += t
      scheduleRender()
    },
    onToolCall: (name, args) => {
      // Subagent tool call: prefix role#id/toolName → update subTask current tool
      const subMatch = name.match(/^([\w-]+)#(\d+)\//)
      if (subMatch) {
        const key = `${subMatch[1]}#${subMatch[2]}`
        const toolName = name.slice(subMatch[0].length)
        if (!state.subTasks[key]) {
          state.subTasks[key] = { key, role: subMatch[1], text: "", tool: null, done: false, started: Date.now() }
        }
        state.subTasks[key].tool = toolName
        state.subTasks[key].toolArgs = args
        state.subTasks[key].text = ""
        scheduleRender()
        return
      }
      // Redundant with flushStream() below (it clears both buffers) — kept as
      // defense-in-depth so a future flushStream change cannot leak advisor
      // buffers into the next tool's view.
      if (name === "advisor") { state._advisorBlocks = [] }
      flushStream()
      ensureAssistantLabel()
      state.currentTool = name
      // Advisor's effective model (resolved once for the status line + inline title below).
      const advModel = name === "advisor" ? (() => { try { return resolveAdvisorProvider(agent).model } catch { return null } })() : null
      // Update status bar with current tool and key arguments for user visibility
      if (name === "bash" && args.command) {
        const cmd = args.command.replace(/\s+/g, " ").trim()
        state.status = `Running: ${cmd.length > 50 ? cmd.slice(0, 50) + "…" : cmd}`
      } else if ((name === "read" || name === "write" || name === "edit" || name === "grep" || name === "glob") && args.path) {
        state.status = `${name}: ${args.path}`
      } else if (name === "grep" && args.pattern) {
        state.status = `grep: ${args.pattern}`
      } else if (name === "glob" && args.pattern) {
        state.status = `glob: ${args.pattern}`
      } else if (name === "websearch" && args.query) {
        state.status = `search: ${args.query.length > 40 ? args.query.slice(0, 40) + "…" : args.query}`
      } else if (name === "advisor") {
        state.status = `advisor review (round ${(agent._advisorRound || 0) + 1}${advModel ? " · " + advModel : ""})`
      } else {
        state.status = `tool: ${name}`
      }
      // Advisor: tag the round in the tool title — the model's own "第N轮" narration
      // is unreliable (it glues onto the previous line), so the round belongs here.
      // Also show the advisor's effective model (it may differ from the main agent's).
      const roundTag = name === "advisor" ? ` (round ${(agent._advisorRound || 0) + 1}${advModel ? " · " + advModel : ""})` : ""
      const argSummary = summarize(args)
      // Inline block title — panel tools get both the title AND the
      // streaming output panel, complementary display.
      const color = ({ advisor: C.advisor, bash: C.warn, verify: C.tool }[name] ?? C.text)
      pushLine(`❯ ${name}${roundTag}${argSummary ? ` ${argSummary}` : ""}`, color)
      _toolTicks[name] = performance.now()
    },
    onToolResult: (name, result) => {
      state.currentTool = null
      // Subagent complete: mark earliest running subTask as done
      const isSubagent = name === "subagent"
      if (isSubagent) {
        const running = Object.entries(state.subTasks)
          .filter(([, s]) => !s.done)
          .sort(([, a], [, b]) => a.started - b.started)
        if (running.length > 0) {
          const [key] = running[0]
          state.subTasks[key].done = true
          state.subTasks[key].tool = null
        }
        // Subagent report preview (max 8 lines) displayed directly in conversation
        const lines = result.split("\n")
        const preview = lines.slice(0, 8).map((l) => l.slice(0, 120)).join("\n")
        if (preview) pushLine(preview, C.dim)
        if (lines.length > 8) pushLine(`  ... (${lines.length - 8} more lines)`, C.dim)
        // Clear done entries from panel after 3 seconds
        setTimeout(() => {
          for (const key of Object.keys(state.subTasks)) {
            if (state.subTasks[key].done) delete state.subTasks[key]
          }
          if (state.processing) render()
        }, 3000)
      }
      if (!isSubagent && name !== "advisor") {
        // Remove live streaming lines — done line handles the summary.
        for (let i = state.lines.length - 1; i >= 0; i--) {
          if (state.lines[i]._live === name) state.lines.splice(i, 1)
        }
        const summary = formatToolSummary(name, result)
        if (summary) pushLine(`  ${summary}`, C.dim)
      }
      if (name === "advisor") {
        // The review's thinking must survive into the conversation history like
        // the main agent's reasoning (flushStream does for state.reasoning) —
        // discarding it left the thought process visible only mid-review, then
        // gone. Flush BEFORE the done line so the block sits above it.
        // NOTE (rendering): the flushed block has NO "│ " gutter prefix while
        // the live streaming view adds one — same convention as the main
        // agent's reasoning (live gutter, history plain). Intentional.
        const blocks = state._advisorBlocks ?? []
        if (blocks.length > 0) {
          // Flush the ordered blocks in sequence — thinking and tool progress
          // alternate in history exactly as they were emitted. The live
          // "[thinking…]" placeholders are stripped (wait indicators, not
          // review content); literal replaceAll of the shared constant can
          // never drift.
          const text = blocks
            .map((b) => b.text.replaceAll(ADVISOR_THINKING_PLACEHOLDER, ""))
            .join("")
            .replace(/\n{3,}/g, "\n\n")
            .trim()
          if (text) {
            const idx = state.lines.length
            pushLine(text, C.reason)
            // Completed review output stays expanded (user is reading it).
            state.expandedBlocks ??= new Set()
            state.expandedBlocks.add("long-" + idx)
            state._autoExpand ??= []
            state._autoExpand.push(idx)
          }
        }
      }
      // Done line for ALL tools (panel area abolished — inline only).
      if (!isSubagent) {
        const elapsed = _toolTicks[name] ? ` (${Math.round(performance.now() - _toolTicks[name])}ms)` : ""
        const summary = formatToolSummary(name, result)
        const tail = summary ? ` → ${sliceByWidth(summary, 60)}` : ""
        pushLine(`❯ ${name} — done${elapsed}${tail}`, C.dim)
      }
      delete _toolTicks[name]
    },
    onToolOutput: (name, chunk) => {
      // All tools use inline conversation blocks — panel area is abolished.
      // Stream up to 5 preview lines; the full result is in the tool message.
      const part = typeof chunk === "string"
        ? { kind: "text", text: chunk.trimEnd() }
        : { kind: chunk?.kind ?? "text", text: String(chunk?.text ?? "").trimEnd() }
      if (!part.text) return
      if (name === "advisor") {
        // Accumulate to buffer — formatTables + wrapText in render-conversation
        // handles markdown formatting, same as main agent response.
        // NOTE: the advisor tool ALWAYS emits {kind, text} objects (run.mjs's
        // emit() wrapper) — a raw string chunk is never think; if that ever
        // changes, plain-string think would land in advisorStreaming.
        // ORDERED block buffer — preserves the interleaved emission order
        // (think → tool → think → … → final). Two separate buffers (_advisorThink
        // vs advisorStreaming) rendered think-block-then-main-block, which
        // regrouped ALL thinking above ALL tool progress — the alternating
        // timeline was destroyed. Consecutive chunks of the same kind merge
        // into one block; kind flips start a new block; render walks the
        // blocks in order with per-kind colors.
        const isString = typeof chunk === "string"
        const raw = isString ? chunk : String(chunk?.text ?? "")
        const kind = isString ? "text" : (chunk?.kind ?? "text")
        const blocks = state._advisorBlocks ??= []
        const last = blocks.at(-1)
        if (last && last.kind === kind) last.text += raw
        else blocks.push({ kind, text: raw })
        scheduleRender()
        return
      }
      // Rolling output — show latest N lines with fold marker per tool.
      // _live marker per tool enables per-tool pruning without affecting other content.
      const color = ({ think: C.reason, tool: C.tool }[part.kind] ?? C.dim)
      for (const line of part.text.split("\n")) {
        const trimmed = line.trimEnd()
        if (!trimmed) continue
        state.lines.push({ text: `│ ${trimmed}`, color, _live: name })
      }
      // Prune: keep at most N lines + "│ …" fold marker per tool (configurable, tool-specific)
      const configLimit = agent.config?.agent?.streamPreviewLines
      const toolLimit = LIVE_LINE_LIMITS[name]
      const previewLines = configLimit ?? toolLimit ?? 5
      let count = 0
      let hasFold = false
      for (let i = state.lines.length - 1; i >= 0; i--) {
        if (state.lines[i]._live === name) {
          if (++count > previewLines) {
            if (!hasFold) {
              state.lines[i] = { text: "│ …", color: C.dim, _live: name }
              hasFold = true; count = previewLines
            } else {
              state.lines.splice(i, 1)
            }
          }
        }
      }
      scheduleRender()
    },
    onPermissionRequest: (name, args) => askPermission(name, args),
    onQuestion: (text, options) => askQuestion(text, options),
    onCompress: () => {
      pushLine("  [context] Context too long, auto-compacted (early conversation summarized by LLM, task state preserved)", C.warn)
    },
    onUsage: (usage) => {
      state.tokens.prompt += usage.prompt_tokens ?? 0
      state.tokens.completion += usage.completion_tokens ?? 0
      state.tokens.cacheHit += usage.prompt_cache_hit_tokens ?? 0
      state.tokens.cacheMiss += usage.prompt_cache_miss_tokens ?? 0
      state.tokens.reasoningTokens += usage.completion_tokens_details?.reasoning_tokens ?? 0
    },
    // Throttle wait (active gate / 429 backoff): show in status bar so user knows it's not frozen
    onWait: ({ phase, seconds }) => {
      if (phase === "gate") state.status = `TPM throttle wait ~${seconds}s`
      else if (phase === "overloaded") state.status = `Server overloaded, retrying in ${seconds}s`
      else state.status = `Rate-limited 429, retry in ${seconds}s`
      render()
    },
    onTaskUpdate: (items) => {
      state.tasks = items
      const done = items.filter((i) => i.status === "done").length
      // Leave trace with current task title: reviewing history shows what was in progress
      const current = items.find((i) => i.status === "in_progress")
      pushLine(`  [task] ${done}/${items.length}${current ? ` ▶ ${current.title}` : ""}`, C.dim)
      render()
    },
    // Incremental save: flush to disk every 5 tool turns — mid-crash loss window shrinks from an entire round to a few turns
    onTurnEnd: (() => {
      let n = 0
      return () => {
        // Flush pending reasoning/streaming before the next turn starts.
        // Guard pushbacks (verify/advisor) continue the agent loop without
        // returning to the TUI — without flushing, old thinking bleeds into
        // the next turn and the guard reminder is invisible.
        flushStream()
        // Mirror the last system-reminder from agent.history so guard
        // pushback messages appear in the conversation at the right spot.
        const last = agent.history.at(-1)
        if (last?.role === "user" && typeof last.content === "string" && last.content.startsWith("[System reminder:")) {
          // Reminders can embed long prior tables — show only the first lines
          // (the full text is in agent.history); 3 lines + ellipsis.
          const lines = last.content.split("\n")
          const shown = lines.length > 3 ? lines.slice(0, 3).join("\n") + "\n…" : last.content
          pushLine(shown, C.warn)
        }
        if (++n % 5 !== 0) return
        try { saveSessionImpl(agent, state.lines) } catch (e) { console.error(`[session] incremental save failed: ${e.message}`) }
      }
    })(),
  }

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
    state.subTasks = {}
    state._advisorBlocks = []
    state.controller = null
    state.status = "Ready"
    // Auto-collapse todo panel when all tasks done (matching kimi-code TUI; agent.tasks are preserved)
    if (state.tasks.length > 0 && state.tasks.every((t) => t.status === "done")) {
      state.tasks = []
    }
    // Auto-generate session title from the first user message (once per session)
    if (!agent.title) {
      try {
        const { generateTitle } = await import("../generate-title.mjs")
        const firstUser = (agent._fullHistory ?? agent.history).find(
          (m) => m.role === "user" && typeof m.content === "string" && !m.content.startsWith("[System reminder:"),
        )
        if (firstUser) {
          const title = await generateTitle(firstUser.content, agent.provider)
          if (title) agent.title = title
        }
      } catch {
        // Title generation failure is non-fatal
      }
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
