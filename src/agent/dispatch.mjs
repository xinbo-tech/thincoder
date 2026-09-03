/**
 * agent/dispatch.mjs — two-phase tool call execution
 */
import { logEvent, errText, headText } from "../log.mjs"
import { offloadToolResult, FILE_MUTATORS } from "./helpers.mjs"
import { runHooks } from "../hooks.mjs"
import { snapshotForUndo } from "../tui/cmd-undo.mjs"
import { isDocFile } from "../advisor/repos.mjs"
import { writeFileSync, mkdirSync, existsSync } from "node:fs"
import { join } from "node:path"
import { homedir } from "node:os"

const ERRORS_DIR = join(homedir(), ".thincoder", "tool-errors")

/**
 * Persist a tool error to ~/.thincoder/tool-errors/YYYY-MM-DD/HHmmss-toolName.log
 * Only called for actual execution failures and malformed invocations.
 * Skipped for intentional denials (plan mode, user reject).
 */
function logToolError(toolName, args, error) {
  try {
    const now = new Date()
    const ymd = now.toISOString().slice(0, 10)
    const ts = now.toISOString().replace(/:/g, "").replace(/\..+/, "").replace("T", "-")
    const dir = join(ERRORS_DIR, ymd)
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    const file = join(dir, `${ts}-${toolName.replace(/[/\\]/g, "_")}.log`)
    const entry = [
      `time: ${now.toISOString()}`,
      `tool: ${toolName}`,
      `args: ${JSON.stringify(args, null, 2).slice(0, 2000)}${JSON.stringify(args, null, 2).length > 2000 ? "… (truncated)" : ""}`,
      `error: ${error?.message ?? String(error)}`,
      error?.stack ? `stack:\n${error.stack}` : "",
    ].filter(Boolean).join("\n") + "\n"
    writeFileSync(file, entry, "utf8")
  } catch {
    // Log failure itself must not crash the agent
  }
}

/**
 * §19 action-level classification (AGENT-LOOP.md §19 D-M1): the merged subagent
 * tool expresses spawn (side effect) and check/status (read-only queries) through
 * its `action` parameter — the tool-level readonly flag can no longer express both.
 * dispatch Phase-1/Phase-2 classifies per action: check/status behave as readonly
 * (planMode pass / no permission ask / batchable), spawn keeps its non-readonly
 * gates, escalate runs non-readonly AND serially (the retired escalate tool had no
 * parallel flag — zero behavior change under the merged surface).
 * §19.5 cancel (19.5.2b round2 #4): CONTROL-class exemption — cancel only
 * stops, never starts. isSubagentControlAction feeds the SAME two gate sites as
 * readonly (planMode pass / no permission ask — never joins a batch approval
 * group / no handler → not denied — digest 内 cancel 放行).
 */
function isSubagentReadonlyAction(toolName, args) {
  if (toolName !== "subagent" || !args || typeof args !== "object") return false
  const action = args.action
  return action === "check" || action === "status"
}
function isSubagentControlAction(toolName, args) {
  return toolName === "subagent" && args?.action === "cancel"
}
function isSubagentEscalateAction(toolName, args) {
  return toolName === "subagent" && args?.action === "escalate"
}

/**
 * Two-phase execution:
 * Phase 1 (serial): parse args one by one + planMode check + permission confirmation (side-effecting tools)
 * Phase 2 (order-preserving): strictly preserve model call order — consecutive readonly/parallel tools run as concurrent batches,
 * side-effecting tools run serially in their original position (if a batch writes-then-reads the same file, the read must see the post-write content).
 * Returns a results array in call order (each entry has an ok flag indicating success/failure).
 */
export async function executeToolCalls(agent, toolByName, toolCalls, callbacks, depth = 0, signal) {
  // ---- Phase 1: serial preparation ----
  // Pre-gates run per tool (parse/planMode/engineering gates); non-readonly tools
  // that REACH the permission stage are collected into one batch — a single merged
  // ask covers the whole toolCalls array (§16 D-B1, "approve all / one by one /
  // deny"). Tools stopped by a pre-gate never join the batch (review #7).
  const prepared = []
  const permPending = [] // { toolCall, tool, args } — reached the permission stage
  for (const toolCall of toolCalls) {
    const tool = toolByName.get(toolCall.name)
    let args
    try {
      args = JSON.parse(toolCall.arguments || "{}")
    } catch {
      logToolError(toolCall.name, { arguments: toolCall.arguments }, new Error("Invalid JSON arguments"))
      prepared.push({ toolCall, tool: null, error: `Invalid tool arguments JSON: ${toolCall.arguments}` })
      continue
    }

    if (!tool) {
      logToolError(toolCall.name, {}, new Error(`Unknown tool: ${toolCall.name}`))
      prepared.push({ toolCall, tool: null, error: `Unknown tool: ${toolCall.name}` })
      continue
    }

    if (agent.planMode && !tool.readonly && !isSubagentReadonlyAction(toolCall.name, args) && !isSubagentControlAction(toolCall.name, args)) {
      prepared.push({ toolCall, tool, denied: true, reason: "plan mode" })
      continue
    }

    // Engineering coder hard gate: no file modification before the design review passed.
    // The design review is the eng-coder's mandatory pre-coding gate — advisor(type="design")
    // must run (and be accepted) before the first write/edit/apply_patch/hashline_edit/insert_after/delete.
    if (agent._role === "eng-coder" && agent.config?.agent?.engineering
        && !agent._engDesignReviewed && FILE_MUTATORS.has(toolCall.name)) {
      prepared.push({
        toolCall, tool, denied: true,
        reason: "engineering design gate",
        hint: "Call advisor with type='design' to review the design document before any file modification. If the review found issues, report them to the parent agent.",
      })
      continue
    }

    // Engineering mode PARENT gate: the parent agent must not touch code files
    // before the design review passed. Signaled by _engDesignToken — set on
    // design-review approval, survives across turns (_engDesignReviewed is
    // eng-coder-only and reset per run). Exemptions cover ONLY design artifacts
    // (docs/** and root-level docs like METHODOLOGY.md/README.md/AGENTS.md/
    // LICENSE) — writing them IS the design/methodology step. Everything under
    // src/ (incl. src/prompts/*.md) is product code, not documentation, and
    // needs a design token. Mechanically blocks "talk then code".
    if (agent.config?.agent?.engineering && depth === 0 && !agent._engDesignToken
        && FILE_MUTATORS.has(toolCall.name)) {
      const paths = tool.touchedPaths ? tool.touchedPaths(args) : [args.path]
      // Unknown/missing paths (non-string, e.g. no path argument) are treated
      // as code — cannot tell what they touch, so block conservatively.
      const touchesCode = paths.some((p) => typeof p !== "string" || /^src[\\/]/.test(p) || !isDocFile(p))
      if (touchesCode) {
        prepared.push({
          toolCall, tool, denied: true,
          reason: "engineering design gate",
          hint: "Engineering mode: write the design document in docs/ first, then call advisor with type='design' to review it, and wait for user approval. Implementation is done by eng-coder subagents.",
        })
        continue
      }
    }

    // Readonly tools (and autoApprove — the short-circuit, unchanged for the
    // whole batch too) skip the permission stage entirely.
    // §18 D-E3 task-domain authorization (spawn-time): an eng-coder child's
    // tools skip the permission ASK stage exactly like autoApprove — granted by
    // the parent spawn (approved design + task = authorization; subagent.mjs
    // sets _engTaskAuthorized on the child). Everything EARLIER in Phase 1
    // (JSON parse / unknown tool / planMode / design-token gates) ran unchanged
    // — the exemption never widens what reaches this stage (round4 #3, T-E14).
    // PreToolUse hooks still run below. Non-eng-coder children keep the manual
    // parent ask (human in the loop).
    if (tool.readonly || isSubagentReadonlyAction(toolCall.name, args) || isSubagentControlAction(toolCall.name, args) || agent.autoApprove || agent._engTaskAuthorized) {
      if (!(await runHooks("PreToolUse", { agent, toolName: toolCall.name, toolArgs: args }))) {
        prepared.push({ toolCall, tool, denied: true, reason: "blocked by PreToolUse hook" })
        continue
      }
      // Panel area abolished — all tools now stream inline via onToolOutput.
      callbacks.onToolCall?.(toolCall.name, args, toolCall.id)
      prepared.push({ toolCall, tool, args })
      continue
    }
    permPending.push({ toolCall, tool, args })
  }

  // ---- Permission stage: one merged ask for the whole batch (§16 D-B1) ----
  // >1 non-readonly tools in the same toolCalls array → a single
  // onBatchPermissionRequest({ tools, count }) ask; verdicts:
  //   "approveAll" → batch-scope allowance (autoApprove style, NOT persistent)
  //   "deny"       → the whole batch is rejected, no second ask
  //   "oneByOne" (or anything else / no handler) → the existing per-item
  //     onPermissionRequest channel, signature unchanged (NF-B1: ACP bridge /
  //     headless / old versions without the new callback are never harmed).
  if (permPending.length > 0) {
    let batchAllowed = null // true = approveAll, false = deny, null = per-item fallback
    if (permPending.length > 1 && callbacks.onBatchPermissionRequest) {
      const verdict = await callbacks.onBatchPermissionRequest({
        tools: permPending.map((p) => ({ name: p.toolCall.name, args: p.args })),
        count: permPending.length,
      })
      if (verdict === "approveAll") batchAllowed = true
      else if (verdict === "deny") batchAllowed = false
      // anything else (oneByOne/unknown) → fall through to the per-item channel
    }
    for (const p of permPending) {
      let allowed
      if (batchAllowed === true) allowed = true
      else if (batchAllowed === false) allowed = false
      else if (callbacks.onPermissionRequest) {
        allowed = await (async () => {
          // D2 (AGENT-LOOP.md §7.2): announce the wait BEFORE prompting — the TUI
          // subagent block header flips to "等待审批" so a waiting child is visibly
          // different from a stalled one. Depth>0 only (the parent TUI shows its own
          // permission panel). turn n/max = the child's live turn counters.
          if (depth > 0) {
            callbacks.onToken?.(`⟦ev⟧approval\x1e${agent._currentTurn ?? 0}\x1e${agent._maxTurns ?? 0}\x1eapproval\x1e${String(p.toolCall.name).slice(0, 40)}`)
          }
          return await callbacks.onPermissionRequest(p.toolCall.name, p.args)
        })()
      } else allowed = false
      if (!allowed) {
        prepared.push({
          toolCall: p.toolCall, tool: p.tool, denied: true,
          reason: (callbacks.onPermissionRequest || batchAllowed === false) ? "denied by user" : "no permission handler",
        })
        continue
      }

      // PreToolUse hooks: allow user scripts to gate tool execution
      if (!(await runHooks("PreToolUse", { agent, toolName: p.toolCall.name, toolArgs: p.args }))) {
        prepared.push({ toolCall: p.toolCall, tool: p.tool, denied: true, reason: "blocked by PreToolUse hook" })
        continue
      }

      // Panel area abolished — all tools now stream inline via onToolOutput.
      callbacks.onToolCall?.(p.toolCall.name, p.args, p.toolCall.id)
      prepared.push({ toolCall: p.toolCall, tool: p.tool, args: p.args })
    }
  }

  // ---- Phase 2: order-preserving execution ----
  const runOne = async (item) => {
    if (item.error) return { ...item, result: `Error: ${item.error}`, ok: false }
    if (item.denied) {
      const reason = item.reason === "plan mode"
        ? "Error: plan mode is active — only read-only tools are allowed. Exit plan mode first."
        : item.reason === "engineering design gate"
          ? `Error: design review required before any file modification. ${item.hint}`
          : item.reason === "denied by user"
          ? "Error: permission denied by user"
          : item.reason === "blocked by PreToolUse hook"
            ? "Error: blocked by PreToolUse hook"
            : "Error: no permission handler configured — this tool requires user approval but the current context doesn't support interaction (e.g. subagent or non-TUI mode)"
      return { ...item, result: reason, ok: false }
    }
    // 2026-08-31 工具顺手度（用户批准"做吧"）：dispatch 拦截工具执行期间的
    // console.log/console.error——工具的探查/调试输出（原本只到终端、模型看不到）
    // 收集后附在工具结果后回显给模型。bash 工具的输出走子进程回显（onOutput），
    // 不走 dispatch console——拦截安全。嵌套 dispatch（subagent）各自拦截/恢复，
    // 捕获分离（父恢复原始后子的拦截期间父捕获停止、子恢复后父继续）——正确。
    // 声明在 try 之外：catch 块（异常路径）也要访问（报错前的探查输出回显）。
    const capturedConsole = []
    // LOGGING（LOGGING.md）：tool:* 事件——仅真实执行（pre-gate 拦截项在下方早退分支不入事件）。
    // 参数值永不落盘（NF-L3——工具事件不记 args）；child=子代理 id（agent._logId，spawn 时 stamp）。
    const toolT0 = Date.now()
    const toolName = item.toolCall.name
    logEvent("tool:call", { tool: toolName, child: agent?._logId })
    try {
      // Snapshot for undo before side-effect tools (setupOutputPanel already fired in Phase 1)
      if (!item.tool?.readonly && item.args) {
        snapshotForUndo(agent, item.toolCall.name, item.args, agent.cwd)
      }
      // M2 ACP: route fs tools through the client (IDE buffer / diff review).
      // toolRouter returns { handled: true, result } to short-circuit execution.
      if (callbacks.toolRouter) {
        const routed = await callbacks.toolRouter(item.toolCall.name, item.args)
        if (routed?.handled) {
          callbacks.onToolResult?.(item.toolCall.name, routed.result, item.toolCall.id)
          logEvent("tool:done", { tool: toolName, ms: Date.now() - toolT0, head: headText(routed.result, 200), child: agent?._logId })
          return { ...item, result: routed.result, ok: true }
        }
      }
      const origConsoleLog = console.log
      const origConsoleErr = console.error
      console.log = (...a) => capturedConsole.push(a.map(String).join(" "))
      console.error = (...a) => capturedConsole.push("[err] " + a.map(String).join(" "))
      let rawResult
      // ctx 对象提升为变量（§7.2.3）：subagent 阻塞 execute 返回前在 ctx 上留
      // _subagentKey（relayPrefix 去尾）——runOne 在 execute 返回后读它作 onToolResult
      // 第 4 参（普通工具/错误路径无此字段——undefined 兼容既有签名）。每次工具调用
      // 独立 ctx——并行同名工具（批并行 runOne）各自带自己的 key，互不串扰。
      const toolCtx = {
        cwd: agent.cwd,
        agent,
        depth,
        signal,
        callbacks,
        onOutput: (chunk) => callbacks.onToolOutput?.(item.toolCall.name, chunk, item.toolCall.id),
        onQuestion: callbacks.onQuestion,
        onPermissionRequest: callbacks.onPermissionRequest,
      }
      try {
        rawResult = await item.tool.execute(item.args, toolCtx)
      } finally {
        console.log = origConsoleLog
        console.error = origConsoleErr
      }
      if (rawResult === undefined) throw new Error(`Tool "${item.toolCall.name}" returned undefined — all tools must return a string value`)
      const raw = String(rawResult)
      // Multimodal tools keep the raw result (base64 images ride the multimodal
    // channel); everything else offloads oversized text to disk. Flag-driven, not
    // name-driven (consult P3, 2026-08-30).
    const result = item.tool?.multimodal ? raw : await offloadToolResult(raw, item.toolCall.id)
      // 2026-08-31：工具执行期间捕获的 console 输出附在结果后回显（模型视野）
      const resultWithConsole = capturedConsole.length > 0
        ? `${result}\n[console during ${item.toolCall.name}]\n${capturedConsole.join("\n")}`
        : result
      callbacks.onToolResult?.(item.toolCall.name, resultWithConsole, item.toolCall.id, toolCtx._subagentKey)
      // PostToolUse hooks: fire-and-forget (result not awaited on hook failure)
      runHooks("PostToolUse", { agent, toolName: item.toolCall.name, toolArgs: item.args, result: raw }).catch(() => {})
      logEvent("tool:done", { tool: toolName, ms: Date.now() - toolT0, head: headText(resultWithConsole, 200), child: agent?._logId })
      return { ...item, result: resultWithConsole, ok: true }
    } catch (error) {
      // Persist to ~/.thincoder/tool-errors/ for post-mortem; only pass message to the model (stack traces confuse LLMs and may leak paths)
      logToolError(item.toolCall.name, item.args, error)
      // User interrupt (Ctrl+C / Ctrl+I) must propagate, not become a tool error:
      // swallowing it here would make the parent keep looping while the user
      // asked to stop — worst case with subagents, where the child runs its
      // whole turn budget and the interrupt appears to do nothing.
      if (signal?.aborted) throw error
      // LOGGING（2026-09-03 code review #4）：中止先于事件——用户停不落 tool:error
      //（vscode execute-tools parity；阻塞子代理 child:error 同款抑制）
      logEvent("tool:error", { tool: toolName, ms: Date.now() - toolT0, err: errText(error, 200), child: agent?._logId })
      runHooks("PostToolUseFailure", { agent, toolName: item.toolCall.name, toolArgs: item.args, error }).catch(() => {})
      // Build contextual error: tool name + key args so the model can reason about what went wrong
      const ctxParts = []
      if (item.args.path) ctxParts.push(`path=${item.args.path}`)
      if (item.args.pattern) ctxParts.push(`pattern=${item.args.pattern}`)
      if (item.args.command) ctxParts.push(`cmd=${item.args.command.slice(0, 80)}`)
      const ctx = ctxParts.length > 0 ? ` [${ctxParts.join(", ")}]` : ""
      // 2026-08-31：异常路径同样回显捕获的 console（工具报错前的探查输出最有价值）
      const consolePart = capturedConsole.length > 0
        ? `\n[console during ${item.toolCall.name}]\n${capturedConsole.join("\n")}`
        : ""
      return { ...item, result: `Error: ${error.message}${ctx}${consolePart}`, ok: false }
    }
  }

  const results = []
  let batch = []
  const flush = async () => {
    if (batch.length === 0) return
    results.push(...await Promise.all(batch.map(runOne)))
    batch = []
  }
  for (const item of prepared) {
    // escalate action keeps the retired escalate tool's serial placement (no
    // parallel flag): it flushes the batch and runs alone in call order (§19 —
    // spawn stays parallel; check/status classify as readonly and batch freely).
    if (item.tool && !item.tool.readonly
        && (!item.tool.parallel || isSubagentEscalateAction(item.tool.name, item.args))) {
      await flush()
      results.push(await runOne(item))
    } else {
      batch.push(item)
    }
  }
  await flush()
  return results
}
