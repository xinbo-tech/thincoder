/**
 * tool-events.mjs — runAgentTurn 的工具事件回调构造（自 agent-turn.mjs 拆出，2026-08-30，
 * 满足 500 行硬限）。只做「事件 → TUI 状态/对话行」的映射：
 *
 *  - onToken/onReasoning  : 子agent 前缀分流（routeSub*）→ 主流 streaming/reasoning
 *  - onToolCall           : 状态栏 + `❯ name args` 标题行 + 计时 + §19 action 记录
 *  - onToolResult         : 子agent 完成冻结（finishSubTask + freezeDoneSubTasks）、
 *                           工具块结果入块、advisor 评审冻结框
 *  - onToolOutput         : advisor 有序块缓冲 / 工具块输出流
 *  - 其余                 : usage 累计、等待提示、task 面板、回合末增量落盘
 *
 * flushStream 同时返回给调用方（回合循环 / onTurnEnd 共用）。纯回调装配，无终端副作用
 * （除经 deps 注入的 pushLine/render）。§19: subagent_check/escalate 工具退役后，
 * subagent 家族全部调用以工具名 "subagent" + action 到达——完成路由按 onToolCall 时
 * 记录的 action 分流（spawn 区块 / escalate 区块 / check·status 普通工具块）。
 */
import { C } from "./ansi.mjs"
import { formatToolSummary } from "./tool-summaries.mjs"
import { describeToolArgs, toolArgsLines } from "./tool-args.mjs"
import { ADVISOR_THINKING_PLACEHOLDER, resolveAdvisorProvider } from "../advisor/run.mjs"
import {
  SUB_PREFIX_RE, SUBAGENT_ROLES, routeSubToken, routeSubReasoning, routeSubToolCall,
  routeSubToolOutput, finishSubTask, finishSubTaskKey, finishSubTasksByRole, finishSubTaskByModel, freezeDoneSubTasks,
  ensureCompressPanel, markCompressFailed, markCompressDone, markCompressFallback,
} from "./subagent-blocks.mjs"
import { TURN_CAP_MARK } from "../agent/spawn-child.mjs"
// 2026-09-05 module-split：ticks/maps/sweep/slim/settle/探测/find 族迁 tool-display.mjs——
// buildToolCallbacks 内部引用用本地 import；sweepToolBlocks re-export（agent-turn 消费面）
import {
  TOOL_OUTPUT_LINE_CAP, SUBAGENT_PREVIEW_LINES, PREVIEW_LINE_CHARS, REMINDER_CAP, REMINDER_PERSIST_TURNS,
  _toolTicks, _subActions, _subActionQ,
  tickStart, tickTake, settleToolBlock, isAsyncSpawnResult, isSpawnErrorResult,
  findToolBlock, slimToolResultForDisplay, sweepToolBlocks,
} from "./tool-display.mjs"
export { sweepToolBlocks, slimToolResultForDisplay } from "./tool-display.mjs"

/** Build the agent callbacks + the shared flushStream for one turn.
 *          askPermission, askQuestion, saveSessionImpl } */
export function buildToolCallbacks(deps) {
  const { agent, state, pushLine, render, scheduleRender, ensureAssistantLabel, askPermission, askBatchPermission, askQuestion, saveSessionImpl } = deps
  // NOTE: advisor buffers (_advisorThink/advisorStreaming) are cleared here too.
  // Timing safety: onToolResult flushes _advisorThink into history and empties
  // the buffers BEFORE onTurnEnd can call flushStream (tool result is
  // dispatched inside executeToolCalls; onTurnEnd fires after the turn loop
  // resumes). If a future change calls flushStream mid-advisor-execution the
  // in-progress thinking WOULD be lost — keep the ordering, or flush here too.
  const flushStream = () => {
    if (state.reasoning) {
      pushLine(state.reasoning, C.reason, "thinking")
      // Reasoning folds IMMEDIATELY on flush (user ruling 2026-08-30): default-folded,
      // named header + tail 3 — same shape as the restore path, zero exceptions.
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
      // Subagent reasoning tokens also carry role#id/ prefix — appended into the block
      // buffer as kind=think (F2: same treatment as the main reasoning stream).
      if (routeSubReasoning(state, t, scheduleRender)) return
      ensureAssistantLabel()
      state.reasoning += t
      scheduleRender()
    },
    onToolCall: (name, args, toolId) => {
      // Subagent tool call: prefix role#id/toolName → open a fresh tool block and
      // set currentTool for the header summary line.
      if (routeSubToolCall(state, name, args, scheduleRender)) return
      // §19: record the action of a merged subagent-family call (spawn is the
      // default — only non-spawn actions need a record for result-time routing).
      if (name === "subagent" && args?.action && args.action !== "spawn") {
        if (toolId !== undefined && toolId !== null) _subActions.set(toolId, args.action)
        else _subActionQ.push(args.action)
      }
      // Redundant with flushStream() below (it clears both buffers) — defense-in-depth
      // so a future flushStream change cannot leak advisor buffers into the next view.
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
      // Readable key-args summary (vscode card-header parity, 2026-08-30) — replaces
      // the raw JSON.stringify-80 slice. Unknown/MCP tools fall back to compact JSON.
      const argSummary = describeToolArgs(name, args)
      // ONE BLOCK PER TOOL CALL (user ruling 2026-08-30): header = name+args+live
      // status, body = args JSON + streaming output + result. buildConvLines renders
      // it via the shared fold-block component; restore emits the SAME carrier.
      state.lines.push({
        text: "", color: C.tool,
        _lineId: (state._lineIdCounter = (state._lineIdCounter ?? 0) + 1),
        _toolBlock: {
          name, roundTag, id: toolId,
          argsSummary: argSummary,
          argsJson: toolArgsLines(args),
          output: [],
          result: null,
          summary: null,
          started: performance.now(),
          done: false,
        },
      })
      tickStart(name, toolId)
    },
    // §7.2.3（方案 e）：dispatch runOne 把工具 ctx 上的 _subagentKey（sync spawn/
    // escalate 成功路径设置——relayPrefix 去尾）作为第 4 参传来——undefined 兼容既有
    // 签名（普通工具/老回调/错误路径不带 key）。
    onToolResult: (name, result, toolId, subKey) => {
      state.currentTool = null
      // §19 merged family: route per the action recorded at onToolCall (no record = default spawn).
      let subAction = null
      if (name === "subagent") {
        subAction = (toolId !== undefined && toolId !== null)
          ? _subActions.get(toolId) ?? null
          : _subActionQ.shift() ?? null
        if (toolId !== undefined && toolId !== null) _subActions.delete(toolId)
      }
      const isSubagent = name === "subagent" && subAction !== "status" && subAction !== "escalate" && subAction !== "cancel" && subAction !== "panel"
      const isEscalate = name === "subagent" && subAction === "escalate"
      // Subagent complete: mark the earliest running child as done — the block
      // persists (✓ frozen elapsed header, expandable) as the ONLY carrier of the
      // child's activity; memory bounded by the N2 line cap.
      // §19.5: cancel 动作排除在 isSubagent 外——ack/错误 JSON 走普通工具块；区块冻结由
      // ⟦ev⟧stopped settle 事件承担（此处 finishSubTask 会误冻最早 running 区块）。
      if (isSubagent) {
        // The dispatch-level tool-block carrier for this call would otherwise
        // never be marked done (its result lands in the subagent block, not the
        // carrier) and the turn sweep would mislabel it "(interrupted)".
        settleToolBlock(state, name, toolId, "completed")
        // Async spawn (§15 D-A1): the result is a status JSON, not a report — the
        // child KEEPS running; skip the freeze (it would tombstone a live block and
        // drop its relay stream). The block freezes on the ⟦ev⟧done settle event.
        if (!isAsyncSpawnResult(result)) {
          // §7.2.3 sync spawn 完成精确冻结：结果按 key 归属三支——
          // ① dispatch 同步成功路径带 subKey（ctx._subagentKey = relayPrefix 去尾）：
          //    finishSubTaskKey 按 key 精确冻——不再落 finishSubTask 的"最早 started"
          //    启发式（async eng-coder 先启动时 explore 完成会误冻其块——7.2.3.1/T-F2）；
          // ② spawn 门拒错误（{status:"error"} JSON——auto-turn digest spawn 拒绝）：
          //    不冻结任何块（round1 #1——错误路径不冻结 running 块——T-F5）；
          // ③ subKey undefined 非错误（老回调/测试直调——成功路径未知工具）→ 启发式
          //    兜底（既有行为不变——面板单块时与精确冻同效——T-F1）。
          const lastError = result.includes(TURN_CAP_MARK) ? "turn cap reached — work may be partial" : null
          const hasSubKey = subKey !== undefined && subKey !== null && subKey !== ""
          if (hasSubKey) {
            finishSubTaskKey(state, String(subKey), lastError)
            freezeDoneSubTasks(state)
          } else if (!isSpawnErrorResult(result)) {
            finishSubTask(state, SUBAGENT_ROLES, lastError)
            freezeDoneSubTasks(state)
          }
          // Subagent report preview (max 8 lines) displayed directly in conversation
          const lines = result.split("\n")
          const preview = lines.slice(0, SUBAGENT_PREVIEW_LINES).map((l) => l.slice(0, PREVIEW_LINE_CHARS)).join("\n")
          if (preview) pushLine(preview, C.dim)
          if (lines.length > SUBAGENT_PREVIEW_LINES) pushLine(`  ... (${lines.length - SUBAGENT_PREVIEW_LINES} more lines)`, C.dim)
        }
      } else if (isEscalate) {
        // 飞刀 post-op report landed under the subagent tool name — freeze the
        // escalate#N activity block (no preview; legacy surface).
        settleToolBlock(state, name, toolId, "completed")
        // §7.2.3（round1 #2）：escalate 成功返回带 subKey（escalate#N）→ 精确冻；
        // 失败/老回调无 subKey → escalate 角色启发式兜底（escalate 串行 + 角色限定——
        // 既有行为）。
        const lastError = result.includes(TURN_CAP_MARK) ? "turn cap reached — work may be partial" : null
        if (subKey !== undefined && subKey !== null && subKey !== "") {
          finishSubTaskKey(state, String(subKey), lastError)
        } else {
          finishSubTask(state, ["escalate"], lastError)
        }
        freezeDoneSubTasks(state)
      } else if (name === "consult_check" || name === "consult_stop") {
        // Consult session-level settle (2026-08-30 consult review): a session spawns
        // N parallel children, so completion must settle ALL of them (single-shot
        // finishSubTask froze only the earliest — N-1 stayed "running" then got
        // mislabeled "interrupted").
        //   - individual reply (done:false): settle precisely by r.model.
        //   - done:true / stopped: settle every remaining consult block.
        try {
          const r = JSON.parse(result)
          if (r?.done || r?.stopped !== undefined) {
            finishSubTasksByRole(state, ["consult"], null)
            freezeDoneSubTasks(state)
          } else if (r?.model) {
            finishSubTaskByModel(state, "consult", r.model)
            freezeDoneSubTasks(state)
          }
        } catch {
          if (name === "consult_stop") {
            finishSubTasksByRole(state, ["consult"], null)
            freezeDoneSubTasks(state)
          }
        } /* non-JSON result — leave blocks as-is */
      }
      if (!isSubagent && !isEscalate && name !== "advisor") {
        // Result lands INSIDE the block (restore parity — the restored carrier
        // carries the same fields). The done line is gone: status/elapsed live
        // in the header now.
        const block = findToolBlock(state, name, toolId)
        if (block) {
          // Multimodal tool results (read_image) embed the FULL base64 image in
          // the result JSON — thousands of rows into the block body = a full
          // screen of garbage (user report 2026-08-30). The model gets the image
          // via the multimodal channel (agent.mjs), the human needs only the
          // text part: strip image parts from the displayed result.
          block.result = slimToolResultForDisplay(result)
          block.summary = formatToolSummary(name, result)
          block.done = true
          const started = tickTake(name, toolId)
          block.elapsed = started !== null ? Math.round(performance.now() - started) : null
        }
      }
      if (name === "advisor") {
        // Same carrier settle as subagent/escalate — the advisor result lives in
        // the frozen box, but the dispatch-level tool carrier must still be
        // marked done (consult P1, 2026-08-30: sweep mislabeled it interrupted).
        settleToolBlock(state, name, toolId, "completed")
        // The review's thinking must survive into the conversation history like the
        // main agent's reasoning — flushed as a COLLAPSIBLE box before the done
        // line (frozen-folded semantics, aligned with subagent blocks; the flat
        // form flooded the conversation). Full text lives in the tool result;
        // _advisorBlocks keep rendering the running view until cleared at turn end.
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
    onToolOutput: (name, chunk, toolId) => {
      // Subagent relays (name "role#id/tool", D1) route RAW — chunks are
      // child-stdout/SSE fragments at arbitrary byte boundaries; trimEnd eats
      // real trailing newlines and routeSubToolOutput's verbatim concat would
      // glue lines (2026-09-03 修复轮; main path keeps the trimmed form below).
      const isSubRelay = SUB_PREFIX_RE.test(name)
      const rawText = typeof chunk === "string" ? chunk : String(chunk?.text ?? "")
      const part = {
        kind: typeof chunk === "string" ? "text" : (chunk?.kind ?? "text"),
        text: isSubRelay ? rawText : rawText.trimEnd(),
      }
      if (!part.text) return
      if (routeSubToolOutput(state, name, part, scheduleRender)) return
      if (name === "advisor") {
        // Accumulate to buffer — formatTables + wrapText in render-conversation
        // handles markdown formatting, same as main agent response.
        // NOTE: the advisor tool ALWAYS emits {kind, text} objects (run.mjs's
        // emit() wrapper) — a raw string chunk is never think; if that ever
        // changes, plain-string think would land in advisorStreaming.
        // ORDERED block buffer — preserves the interleaved emission order (think →
        // tool → think → … → final); consecutive chunks of the same kind merge
        // into one block, kind flips start a new block, render walks them in order.
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
      const block = findToolBlock(state, name, toolId)
      if (block) {
        for (const line of part.text.split("\n")) {
          const trimmed = line.trimEnd()
          if (trimmed) block.output.push(trimmed)
        }
        if (block.output.length > TOOL_OUTPUT_LINE_CAP) {
          block.output.splice(0, block.output.length - TOOL_OUTPUT_LINE_CAP)
        }
      }
      scheduleRender()
    },
    // Manual-tier auto-turn digests (agent-turn.mjs suspension driver) pass null
    // handlers — permission requests then deny WITHOUT a panel (§17 D-S7: no modal
    // during unattended digestion) and question errors out instead of hanging.
    ...(askPermission ? { onPermissionRequest: (name, args) => askPermission(name, args) } : {}),
    // Merged batch ask (§16 D-B1): one confirmation for N non-readonly tools in
    // the same response — "approve all / one by one / deny" (key-handler resolves
    // the verdict string; approveAll is batch-scope only, never the AUTO flag).
    ...(askBatchPermission ? { onBatchPermissionRequest: (req) => askBatchPermission(req) } : {}),
    ...(askQuestion ? { onQuestion: (text, options) => askQuestion(text, options) } : {}),
    // Compression lifecycle (CONTEXT-COMPACTION.md §7 D-C2): the compression session
    // renders as a subagent-style panel block — start → running panel ("Compressing
    // context…" + "summarizing N messages" + elapsed ticker), fail → error text only,
    // success → frozen "Compressed: N tokens freed → summary (Xs)" / fallback →
    // "truncated to N messages". The summary BODY never enters the panel or stream.
    onCompressStart: (info) => {
      ensureCompressPanel(state, info)
      scheduleRender()
    },
    onCompressFail: (error) => {
      // Q3 (CONTEXT-COMPACTION §7 F3): failure is no longer silent — visible on the panel AND
      // logged to stderr so the error is traceable (400/timeout/network).
      console.error("[context] compression failed:", error?.message ?? error)
      markCompressFailed(state, error)
      scheduleRender()
    },
    onCompress: (info) => {
      if (info?.mode === "fallback") markCompressFallback(state, info)
      else markCompressDone(state, info)
      scheduleRender()
    },
    // Async distillation landed (SEND-STALL-DISTILL §2.3): the machine line was replaced by
    // the compressed version — persist it so the session file ends up compressed. Silent:
    // a save failure must never surface after the turn already returned.
    onDistilled: () => {
      try { saveSessionImpl(agent, state.lines) } catch (e) { console.error(`[session] distilled save failed: ${e.message}`) }
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
          const shown = lines.length > REMINDER_CAP ? lines.slice(0, REMINDER_CAP).join("\n") + "\n…" : last.content
          pushLine(shown, C.warn)
        }
        if (++n % REMINDER_PERSIST_TURNS !== 0) return
        try { saveSessionImpl(agent, state.lines) } catch (e) { console.error(`[session] incremental save failed: ${e.message}`) }
      }
    })(),
  }

  return { callbacks, flushStream }
}
