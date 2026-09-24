/**
 * tool-events.mjs — runAgentTurn 的工具事件回调构造（自 agent-turn.mjs 拆出，2026-08-30，
 * 满足 500 行硬限）。只做「事件 → TUI 状态/对话行」的映射：
 *
 *  - onToken/onReasoning  : 子agent 前缀分流（routeSub*）→ 主流 streaming/reasoning
 *  - onToolCall           : 状态栏 + `❯ name args` 标题行 + 计时 + AGENT-LOOP-SUBAGENT.md §6.7 action 记录
 *  - onToolResult         : 子agent 完成冻结（finishSubTaskKey 精确冻 + freezeDoneSubTasks——
 *                           F-2 后 finishSubTask 为 no-op 兼容保留）、
 *                           工具块结果入块、advisor 评审冻结框
 *  - onToolOutput         : advisor 有序块缓冲 / 工具块输出流
 *  - 其余                 : usage 累计、等待提示、task 面板、回合末增量落盘
 *
 * flushStream 同时返回给调用方（回合循环 / onTurnEnd 共用）。纯回调装配，无终端副作用
 * （除经 deps 注入的 pushLine/render）。AGENT-LOOP-SUBAGENT.md §6.7: subagent_check/escalate 工具退役后
 * （AGENT-LOOP-SUBAGENT.md §6.7.5——check 动作已删），subagent 家族全部调用以工具名 "subagent" +
 * action 到达——完成路由按 onToolCall 时记录的 action 分流（spawn 区块 / escalate
 * 区块 / status/observe/send 普通工具块——observe/send 不建子代理区块）。
 */
import { C } from "./ansi.mjs"
import { formatToolSummary } from "./tool-summaries.mjs"
import { describeToolArgs, toolArgsLines } from "./tool-args.mjs"
import { ADVISOR_THINKING_PLACEHOLDER, resolveAdvisorProvider } from "@thincoder/core/advisor/run.mjs"
import {
  SUBAGENT_ROLES, routeSubToken, routeSubReasoning, routeSubToolCall,
  routeSubToolOutput, finishSubTask, finishSubTaskKey, finishSubTasksByRole, freezeDoneSubTasks,
  ensureCompressPanel, markCompressFailed, markCompressDone, markCompressFallback,
  shiftFreezeAnchors,
} from "./subagent-blocks.mjs"
// 第 27 批 §12.3②：前缀正则换名 + import 源改文法模块（纯换名——语义零改）。
import { RELAY_PREFIX_RE } from "@thincoder/core/agent/relay-prefix.mjs"
import { TURN_CAP_MARK, STOPPED_MARK } from "@thincoder/core/agent/spawn-child.mjs"
// 批 1 CORE-DEFECT-FIXES B3：onWait 相位值域 + 文案单源（消费面禁各自枚举——PROVIDER.md §6.20）
import { waitStatusText } from "@thincoder/core/provider/wait-status.mjs"
// 2026-09-05 module-split：ticks/maps/sweep/slim/settle/探测/find 族迁 tool-display.mjs——
// buildToolCallbacks 内部引用用本地 import；sweepToolBlocks re-export（agent-turn 消费面）
import {
  TOOL_OUTPUT_LINE_CAP, REMINDER_CAP, REMINDER_PERSIST_TURNS,
  _toolTicks, _subActions, _subActionQ,
  tickStart, tickTake, settleToolBlock, isAsyncSpawnResult, isSpawnErrorResult,
  findToolBlock, findToolLine, slimToolResultForDisplay, sweepToolBlocks,
} from "./tool-display.mjs"
export { sweepToolBlocks, slimToolResultForDisplay } from "./tool-display.mjs"
// TUI-OOM-ROOTCAUSE（TUI.md §15.3.1/§15.3.3）：显示层额度（行/载体/输出环/评审/流式）。
import {
  capText, capLine, capLines, appendCapped, capAdvisorText, accountLine, syncLineBudget,
  LINE_TRUNC_MARKER, MIDDLE_TRUNC_MARKER, ADVISOR_CAP_OPTS, STREAM_CAP_OPTS,
  TOOL_OUTPUT_ENTRY_MAX_CHARS, TOOL_OUTPUT_TOTAL_MAX_CHARS, ADVISOR_TEXT_MAX_CHARS,
} from "./display-budget.mjs"

/** 输出环字符维总量（§15.3.1 TOOL_OUTPUT_TOTAL_MAX_CHARS——与 200 条目环同款丢最旧）。 */
function trimOutputChars(block) {
  let total = 0
  for (const s of block.output) total += s.length
  while (total > TOOL_OUTPUT_TOTAL_MAX_CHARS && block.output.length > 0) {
    total -= block.output.shift().length
  }
}

/** Build the agent callbacks + the shared flushStream for one turn.
 *          askPermission, askQuestion, saveSessionImpl } */
export function buildToolCallbacks(deps) {
  const { agent, state, pushLine, render, scheduleRender, ensureAssistantLabel, askPermission, askBatchPermission, askQuestion, saveSessionImpl } = deps
  // 行集总量对账便捷式（§15.3.3——冻结锚点平移交 subagent 族函数）
  const budgetSync = () => syncLineBudget(state, { onTrim: (st, n) => shiftFreezeAnchors(st, n) })
  /** Advisor 有序块累积 + 额度（§15.3.1 ADVISOR_TEXT_MAX_CHARS——头 32K/尾 96K/中段标记）。 */
  const pushAdvisorChunk = (raw, kind) => {
    const blocks = state._advisorBlocks ??= []
    const last = blocks.at(-1)
    if (last && last.kind === kind) last.text = appendCapped(last.text, raw, ADVISOR_CAP_OPTS)
    else blocks.push({ kind, text: appendCapped("", raw, ADVISOR_CAP_OPTS) })
    // 多块总量：丢最旧块直至 ≤ 额度（裁决尾部优先）
    let total = 0
    for (const b of blocks) total += b.text.length
    while (total > ADVISOR_TEXT_MAX_CHARS && blocks.length > 1) total -= blocks.shift().text.length
  }
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
      state.streaming = appendCapped(state.streaming, t, STREAM_CAP_OPTS) // §15.3.1 STREAM_MAX_CHARS
      scheduleRender()
    },
    onReasoning: (t) => {
      // Subagent reasoning tokens also carry role#id/ prefix — appended into the block
      // buffer as kind=think (F2: same treatment as the main reasoning stream).
      if (routeSubReasoning(state, t, scheduleRender)) return
      ensureAssistantLabel()
      state.reasoning = appendCapped(state.reasoning, t, STREAM_CAP_OPTS) // §15.3.1 STREAM_MAX_CHARS
      scheduleRender()
    },
    onToolCall: (name, args, toolId) => {
      // Subagent tool call: prefix role#id/toolName → open a fresh tool block and
      // set currentTool for the header summary line.
      if (routeSubToolCall(state, name, args, scheduleRender)) return
      // AGENT-LOOP-SUBAGENT.md §6.7: record the action of a merged subagent-family call (spawn is the
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
      accountLine(state, state.lines[state.lines.length - 1]) // 载体入总量账（§15.3.4）
      budgetSync()
      tickStart(name, toolId)
    },
    // §7.2.3（方案 e）：dispatch runOne 把工具 ctx 上的 _subagentKey（sync spawn/
    // escalate 成功路径设置——relayPrefix 去尾）作为第 4 参传来——undefined 兼容既有
    // 签名（普通工具/老回调/错误路径不带 key）。
    onToolResult: (name, result, toolId, subKey) => {
      state.currentTool = null
      // AGENT-LOOP-SUBAGENT.md §6.7 merged family: route per the action recorded at onToolCall (no record = default spawn).
      let subAction = null
      if (name === "subagent") {
        subAction = (toolId !== undefined && toolId !== null)
          ? _subActions.get(toolId) ?? null
          : _subActionQ.shift() ?? null
        if (toolId !== undefined && toolId !== null) _subActions.delete(toolId)
      }
      const isSubagent = name === "subagent" && subAction !== "status" && subAction !== "escalate" && subAction !== "cancel" && subAction !== "panel" && subAction !== "observe" && subAction !== "send"
      const isEscalate = name === "subagent" && subAction === "escalate"
      // Subagent complete: mark the earliest running child as done — the block
      // persists (✓ frozen elapsed header, expandable) as the ONLY carrier of the
      // child's activity; memory bounded by the N2 line cap.
      // AGENT-LOOP-SUBAGENT.md §6.7.2: cancel 动作排除在 isSubagent 外——ack/错误 JSON 走普通工具块；区块冻结由
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
          // ③ subKey undefined 非错误（老回调/测试直调——成功路径未知工具）→ 不冻结
          //    任何块（CLI-ACTIVITY-DEBLOAT F-2 收窄：finishSubTask 恒 no-op——无 key
          //    无从精确归属，宁可 no-op 不误冻；块由回合尾 freezeAllSubTasks 兜底清场）。
          // SYNC-CANCEL（R6）：⏹ 折叠报告带 STOPPED_MARK——块冻结标 stopped 而非 done
          // （lastError 注记 + 事件定格——兜底竞态窗口的 dispatch 精确冻路径）
          const lastError = result.includes(TURN_CAP_MARK) ? "turn cap reached — work may be partial" : result.includes(STOPPED_MARK) ? "stopped by user — work may be partial" : null
          const hasSubKey = subKey !== undefined && subKey !== null && subKey !== ""
          if (hasSubKey) {
            finishSubTaskKey(state, String(subKey), lastError)
            freezeDoneSubTasks(state)
          } else if (!isSpawnErrorResult(result)) {
            finishSubTask(state, SUBAGENT_ROLES, lastError)
            freezeDoneSubTasks(state)
          }
          // CLI-ACTIVITY-DEBLOAT F-1 (2026-09-10): the conversation-stream report
          // preview (max 8 dim lines) is deleted — the frozen block is the ONLY
          // carrier of the child's report (full text also lives in history for the
          // model; escalate#N keeps its no-preview surface unchanged).
        }
      } else if (isEscalate) {
        // 飞刀 post-op report landed under the subagent tool name — freeze the
        // escalate#N activity block (no preview; legacy surface).
        settleToolBlock(state, name, toolId, "completed")
        // §25 D-R17b (R17): async escalate ack ({id, role:"escalate", status:
        // running|queued}) — the child KEEPS running — skip the freeze like the
        // async spawn path (the block freezes on the ⟦ev⟧done/stopped settle
        // event at flight end). Sync results (async:false) freeze below.
        if (!isAsyncSpawnResult(result)) {
          // §7.2.3（round1 #2）：escalate 成功返回带 subKey（escalate#N）→ 精确冻；
          // 失败/老回调无 subKey → 不冻结任何块（F-2 收窄——finishSubTask 恒 no-op，
          // 块由回合尾 freezeAllSubTasks 兜底清场）。
          // SYNC-CANCEL（R6）：同上——escalate 路径同款扩展（sync escalate 无 registry——
          // 恒不折叠——扩展仅口径一致——零行为变化）
          const lastError = result.includes(TURN_CAP_MARK) ? "turn cap reached — work may be partial" : result.includes(STOPPED_MARK) ? "stopped by user — work may be partial" : null
          if (subKey !== undefined && subKey !== null && subKey !== "") {
            finishSubTaskKey(state, String(subKey), lastError)
          } else {
            finishSubTask(state, ["escalate"], lastError)
          }
          freezeDoneSubTasks(state)
        }
      } else if (name === "consult_stop") {
        // R17（§25 D-R17a——check 已删）：consult_stop = 取消指定会诊会话。被 abort 的
        // children 各自 settle（settleChild）时发 ⟦ev⟧done 冻结自己的卡——此处**不做按
        // 角色整组清扫**（会诊会话可并发——按角色会误冻其他仍在运行的会话的卡，冻结即
        // 截断其活动流——tool-events advisor 复评 🟡1 修正）；取消的即时可见性由 abort
        // settle 事件承担（abort 解绕通常在同回合内完成——卡片在其 child settle 即冻结）。
        // 仅结果本身落本工具调用自己的载体块（下方通用分支）。
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
          block.result = slimToolResultForDisplay(result) // §15.3.1 RESULT 额度（行 400 + 字符 64K 双维）
          block.summary = formatToolSummary(name, result)
          block.done = true
          const started = tickTake(name, toolId)
          block.elapsed = started !== null ? Math.round(performance.now() - started) : null
          accountLine(state, findToolLine(state, name, toolId)) // 载体原地变更 → 重新入账
          budgetSync()
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
          // 冻结文本额度（§15.3.1：头 32K + 尾 96K 保裁决尾部 + 中段标记——非静默截断，
          // 代码评审 #3：capLines(...)[0] 会丢标记且截尾）
          const text = capAdvisorText(blocks
            .map((b) => b.text.replaceAll(ADVISOR_THINKING_PLACEHOLDER, ""))
            .join("")
            .replace(/\n{3,}/g, "\n\n")
            .trim())
          if (text) {
            const line = {
              text: "advisor review",
              color: C.dim,
              _frozenAdvisor: text,
            }
            state.lines.push(line)
            accountLine(state, line)
            budgetSync()
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
      const isSubRelay = RELAY_PREFIX_RE.test(name)
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
        pushAdvisorChunk(raw, kind) // §15.3.1 累积额度（多块丢最旧）
        scheduleRender()
        return
      }
      // Append into the CURRENT tool block's output buffer (the block is the
      // display; no _live scroll lines anymore). N2-style cap keeps memory
      // bounded: keep the LAST 200 output lines per call; 字符维双维
      // （§15.3.1：单条目 ≤ TOOL_OUTPUT_ENTRY_MAX_CHARS、总量 ≤ TOOL_OUTPUT_TOTAL_MAX_CHARS 丢最旧）。
      const block = findToolBlock(state, name, toolId)
      if (block) {
        for (const line of part.text.split("\n")) {
          const trimmed = line.trimEnd()
          if (trimmed) block.output.push(capText(trimmed, { max: TOOL_OUTPUT_ENTRY_MAX_CHARS, keepHead: 6_000, keepTail: 2_000, marker: MIDDLE_TRUNC_MARKER }))
        }
        if (block.output.length > TOOL_OUTPUT_LINE_CAP) {
          block.output.splice(0, block.output.length - TOOL_OUTPUT_LINE_CAP)
        }
        trimOutputChars(block)
        accountLine(state, findToolLine(state, name, toolId))
        budgetSync()
      }
      scheduleRender()
    },
    // Manual-tier auto-turn digests (agent-turn.mjs suspension driver) pass null
    // handlers — permission requests then deny WITHOUT a panel (AGENT-LOOP-ASYNC-POOL.md §6.8 D-S7: no modal
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
    // Throttle wait (active gate / 429 backoff): show in status bar so user knows it's not frozen.
    // 相位值域/文案取自核单源（wait-status.mjs）——未知相位与 warn 前置告警不显示（不落兜底误标）。
    onWait: (ev) => {
      const s = waitStatusText(ev)
      if (!s) return
      state.status = s
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
