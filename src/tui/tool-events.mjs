/**
 * tool-events.mjs — runAgentTurn 的工具事件回调构造（自 agent-turn.mjs 拆出，2026-08-30，
 * 满足 500 行硬限）。只做「事件 → TUI 状态/对话行」的映射：
 *
 *  - onToken/onReasoning  : 子agent 前缀分流（routeSub*）→ 主流 streaming/reasoning
 *  - onToolCall           : 状态栏 + `❯ name args` 标题行 + 计时
 *  - onToolResult         : 子agent 完成冻结（finishSubTask + freezeDoneSubTasks）、
 *                           _live 行清理、done 行、advisor 评审冻结框
 *  - onToolOutput         : advisor 有序块缓冲 / `_live` 滚动预览（N 行 + `│ …` 折叠）
 *  - 其余                 : usage 累计、等待提示、task 面板、回合末增量落盘
 *
 * flushStream 同时返回给调用方（回合循环 / onTurnEnd 共用）。纯回调装配，无终端副作用
 * （除经 deps 注入的 pushLine/render）。
 */
import { sliceByWidth } from "./render.mjs"
import { C } from "./ansi.mjs"
import { formatToolSummary } from "./tool-summaries.mjs"
import { describeToolArgs, toolArgsLines } from "./tool-args.mjs"
import { ADVISOR_THINKING_PLACEHOLDER, resolveAdvisorProvider } from "../advisor/run.mjs"
import {
  SUBAGENT_ROLES, routeSubToken, routeSubReasoning, routeSubToolCall,
  routeSubToolOutput, finishSubTask, freezeDoneSubTasks,
} from "./subagent-blocks.mjs"
import { TURN_CAP_MARK } from "../agent/spawn-child.mjs"

/** Tool execution start timestamps (performance.now ms), keyed by tool name.
 *  Per-name FIFO QUEUE (not a single slot): the agent batches parallel same-name
 *  tool calls (e.g. read ×2 in one message) — a single slot let the second
 *  onToolCall overwrite the first's start time (first done line showed the wrong
 *  duration) and its onToolResult delete the tick while the second still ran
 *  (second done line lost its elapsed entirely, 2026-08-30 review). FIFO shift
 *  assumes near-call-order completion; a parallel same-name batch that finishes
 *  out of order swaps durations between siblings — same magnitude, both lines
 *  keep an elapsed (display-level, acceptable). */
const _toolTicks = new Map()

function tickStart(name) {
  const q = _toolTicks.get(name) ?? []
  q.push(performance.now())
  _toolTicks.set(name, q)
}

/** Settle one pending tick for `name` (FIFO): returns the start timestamp or null. */
function tickTake(name) {
  const q = _toolTicks.get(name)
  if (!q || q.length === 0) return null
  const started = q.shift()
  if (q.length === 0) _toolTicks.delete(name)
  return started
}

/** Per-tool streaming preview line limits — tools with verbose output get more lines.
 *  NOTE: `advisor` is intentionally NOT pruned by the live-line mechanism: its
 *  streaming returns early (kind-split into the ordered _advisorBlocks buffer) and
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

/** Build the agent callbacks + the shared flushStream for one turn.
 *  deps: { agent, state, pushLine, render, scheduleRender, ensureAssistantLabel,
 *          askPermission, askQuestion, summarize, saveSessionImpl } */
export function buildToolCallbacks(deps) {
  const { agent, state, pushLine, render, scheduleRender, ensureAssistantLabel, askPermission, askQuestion, summarize, saveSessionImpl } = deps

  // NOTE: advisor buffers (_advisorThink/advisorStreaming) are cleared here too.
  // Timing safety: onToolResult flushes _advisorThink into history and empties
  // the buffers BEFORE onTurnEnd can call flushStream (tool result is
  // dispatched inside executeToolCalls; onTurnEnd fires after the turn loop
  // resumes). If a future change calls flushStream mid-advisor-execution the
  // in-progress thinking WOULD be lost — keep the ordering, or flush here too.
  const flushStream = () => {
    if (state.reasoning) {
      pushLine(state.reasoning, C.reason, "thinking")
      // Reasoning folds IMMEDIATELY on flush (user ruling 2026-08-30: the old
      // "stay expanded until next turn" auto-expand was a leftover of the
      // rejected pre-fold plan — thinking must be DEFAULT FOLDED in the exact
      // unified form: named header + tail 3, expand ≤60%, click back). Same
      // shape as the restore path — zero exceptions on either path.
      state.reasoning = ""
    }
    if (state.streaming) {
      pushLine(state.streaming, C.text, "text")
      state.streaming = ""
    }
    state._advisorBlocks = []
  }

  const callbacks = {
    onToken: (t) => {
      // Subagent streaming: prefix format role#id/ → route into the child's activity
      // block (D4). Event tokens (⟦ev⟧…) update ONLY the header state — never the
      // block content, never the main stream (D1). Routing details in subagent-blocks.
      if (routeSubToken(state, t, scheduleRender)) return
      ensureAssistantLabel()
      state.streaming += t
      scheduleRender()
    },
    onReasoning: (t) => {
      // Subagent reasoning tokens also carry role#id/ prefix — appended into the
      // block buffer as kind=think (F2: same treatment as the main reasoning stream;
      // previously the token only created the entry and the content was discarded).
      if (routeSubReasoning(state, t, scheduleRender)) return
      ensureAssistantLabel()
      state.reasoning += t
      scheduleRender()
    },
    onToolCall: (name, args) => {
      // Subagent tool call: prefix role#id/toolName → open a fresh tool block and
      // set currentTool for the header summary line.
      if (routeSubToolCall(state, name, args, scheduleRender)) return
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
      // Readable key-args summary (vscode card-header parity, 2026-08-30) —
      // replaces the raw JSON.stringify-80 slice: long paths landed mid-string,
      // and the crucial argument was often past the cut. Unknown/MCP tools
      // fall back to compact JSON inside describeToolArgs.
      const argSummary = describeToolArgs(name, args)
      // ONE BLOCK PER TOOL CALL (user ruling 2026-08-30: "为什么不把名称和参数行
      // 直接作为流式输出 block 的 title" — the four-piece ❯ title / _live scroll /
      // done-line arrangement was pre-fold-era residue). The carrier line holds
      // the whole call: header = name+args+live status, body = args JSON +
      // streaming output + result. buildConvLines renders it via the shared
      // fold-block component; restore (historyToLines) emits the SAME carrier.
      state.lines.push({
        text: "", color: C.tool,
        _toolBlock: {
          name, roundTag,
          argsSummary: argSummary,
          argsJson: toolArgsLines(args),
          output: [],
          result: null,
          summary: null,
          started: performance.now(),
          done: false,
        },
      })
      tickStart(name)
    },
    onToolResult: (name, result) => {
      state.currentTool = null
      // Subagent complete: mark the earliest running child as done — the block
      // persists (✓ frozen elapsed header, expandable) as the ONLY carrier of the
      // child's activity (D4: no 3-second cleanup anymore). The report preview
      // (max 8 lines) still enters the conversation via the existing path below.
      // Block buffers survive the turn (no wipe in runAgentTurn start/finally):
      // child tool calls never enter the parent's history, so the block is the
      // only trace of what the child did — memory bounded by the N2 line cap.
      const isSubagent = name === "subagent"
      if (isSubagent) {
        finishSubTask(state, SUBAGENT_ROLES, result.includes(TURN_CAP_MARK) ? "turn cap reached — work may be partial" : null)
        // Freeze the finished blocks into the conversation stream (user report
        // 2026-08-30): a pinned tail section left every ✓ block stuck above the
        // input box forever. As lines they scroll away, stay expandable via the
        // dim auto-fold, and subTasks releases the entry.
        freezeDoneSubTasks(state)
        // Subagent report preview (max 8 lines) displayed directly in conversation
        const lines = result.split("\n")
        const preview = lines.slice(0, 8).map((l) => l.slice(0, 120)).join("\n")
        if (preview) pushLine(preview, C.dim)
        if (lines.length > 8) pushLine(`  ... (${lines.length - 8} more lines)`, C.dim)
      } else if (name === "escalate") {
        // 飞刀 post-op report landed → freeze its block into the conversation too.
        finishSubTask(state, ["escalate"], result.includes(TURN_CAP_MARK) ? "turn cap reached — work may be partial" : null)
        freezeDoneSubTasks(state)
      } else if (name === "consult_check" || name === "consult_stop") {
        // Individual consultants settle invisibly to onToolResult (fire-and-forget
        // children); the check/stop result JSON announces session completion —
        // freeze every running consult block when it does.
        try {
          const r = JSON.parse(result)
          if (r?.done || r?.stopped !== undefined) {
            finishSubTask(state, ["consult"], null)
            freezeDoneSubTasks(state)
          }
        } catch { /* non-JSON result — leave blocks as-is */ }
      }
      if (!isSubagent && name !== "advisor") {
        // Result lands INSIDE the block (restore parity — the restored carrier
        // carries the same fields). The done line is gone: status/elapsed live
        // in the header now.
        const block = [...state.lines].reverse().find((l) => l._toolBlock && l._toolBlock.name === name && !l._toolBlock.done)
        if (block) {
          // Multimodal tool results (read_image) embed the FULL base64 image in
          // the result JSON — thousands of rows into the block body = a full
          // screen of garbage (user report 2026-08-30). The model gets the image
          // via the multimodal channel (agent.mjs), the human needs only the
          // text part: strip image parts from the displayed result.
          let displayResult = result
          try {
            const parsed = JSON.parse(result)
            if (parsed?.images?.length) displayResult = parsed.text ?? result
          } catch { /* not JSON — show as-is */ }
          const rows = String(displayResult).split("\n").filter((l) => l.trim())
          // Body-size guard: any tool result beyond 400 rows is truncated in the
          // block (full text always lives in history for the model).
          block._toolBlock.result = rows.length > 400
            ? [...rows.slice(0, 400), "… (result truncated at 400 rows — full text in history)"]
            : rows
          block._toolBlock.summary = formatToolSummary(name, result)
          block._toolBlock.done = true
          const started = tickTake(name)
          block._toolBlock.elapsed = started !== null ? Math.round(performance.now() - started) : null
        }
      }
      if (name === "advisor") {
        // The review's thinking must survive into the conversation history like
        // the main agent's reasoning (flushStream does for state.reasoning) —
        // discarding it left the thought process visible only mid-review, then
        // gone. Flush BEFORE the done line so the block sits above it.
        // 2026-08-30: flushed as a COLLAPSIBLE box (frozen-folded semantics,
        // aligned with subagent blocks) instead of a flat auto-expanded line —
        // the flat form flooded the conversation. Full text still lives in the
        // tool result message; the box is the reviewable record. Live
        // _advisorBlocks keep rendering the running view until cleared in the
        // turn finally.
        const blocks = state._advisorBlocks ?? []
        if (blocks.length > 0) {
          const text = blocks
            .map((b) => b.text.replaceAll(ADVISOR_THINKING_PLACEHOLDER, ""))
            .join("")
            .replace(/\n{3,}/g, "\n\n")
            .trim()
          if (text) {
            state.lines.push({
              text: "advisor review",
              color: C.dim,
              _frozenAdvisor: text,
            })
          }
        }
      }
      if (isSubagent) {
        tickTake(name) // subagent: no per-call block — settle the tick
      }
    },
    onToolOutput: (name, chunk) => {
      // All tools use inline conversation blocks — panel area is abolished.
      // Stream up to N preview lines (config ?? per-tool ?? 5); the full result
      // is in the tool message.
      const part = typeof chunk === "string"
        ? { kind: "text", text: chunk.trimEnd() }
        : { kind: chunk?.kind ?? "text", text: String(chunk?.text ?? "").trimEnd() }
      if (!part.text) return
      // Subagent tool output (D1: childCallbacks.onToolOutput relays under the
      // prefixed name "role#id/toolName") → append into the CURRENT tool block of
      // that child's activity buffer. Render throttled at 250ms (N1); the data
      // append itself is never delayed.
      if (routeSubToolOutput(state, name, part, scheduleRender)) return
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
      // Append into the CURRENT tool block's output buffer (the block is the
      // display; no _live scroll lines anymore). N2-style cap keeps memory
      // bounded: keep the LAST 200 output lines per call.
      const block = [...state.lines].reverse().find((l) => l._toolBlock && l._toolBlock.name === name && !l._toolBlock.done)
      if (block) {
        for (const line of part.text.split("\n")) {
          const trimmed = line.trimEnd()
          if (trimmed) block._toolBlock.output.push(trimmed)
        }
        if (block._toolBlock.output.length > 200) {
          block._toolBlock.output.splice(0, block._toolBlock.output.length - 200)
        }
      }
      scheduleRender()
    },
    onPermissionRequest: (name, args) => askPermission(name, args),
    onQuestion: (text, options) => askQuestion(text, options),
    onCompress: () => {
      pushLine("  [context] Context too long, auto-compacted (early conversation summarized by LLM, task state preserved)", C.warn)
    },
    // Async distillation landed (SEND-STALL-DISTILL §2.3): the machine line was replaced by
    // the compressed version — persist it so the session file ends up compressed. Silent:
    // a save failure must never surface after the turn already returned.
    onDistilled: () => {
      try { saveSessionImpl(agent, state.lines) } catch { /* 静默 */ }
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

  return { callbacks, flushStream }
}
