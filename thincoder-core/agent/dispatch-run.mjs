/**
 * agent/dispatch-run.mjs — 单条 prepared 项的执行体（2026-09-28 拆分批 · R3——自
 * `agent/dispatch.mjs`（498/499 贴 500 硬限）外提：原 `executeToolCalls` 内闭包 `runOne`
 * 提升为模块级 `runPreparedItem`（**函数体逐字搬运**——闭包自由变量经形参代入，缩进回归
 * 一级）；`executeToolCalls` 两处调用点同批改指（批并行 ∕ escalate 串行分支）。
 * 依赖方向：本档 → `./dispatch-gates.mjs`（logToolError ∕ noteExecutedMutation）；主档 → 本档
 * ——零环。
 */
import { logEvent, errText, headText } from "../log.mjs"
import { offloadToolResult, FILE_MUTATORS } from "./helpers.mjs"
import { runHooks } from "../hooks.mjs"
import { snapshotForUndo } from "../undo-stack.mjs"
import { PEER_WRITE_TOOLS, peerCollabNote, recordPeerWrites, markClaimNoted } from "../peer-domains.mjs"
import { logToolError, noteExecutedMutation } from "./dispatch-gates.mjs"

/** console 回显预算（AGENT-LOOP.md §6.4 · #863）：采集端 cap = 与 helpers.mjs `TOOL_RESULT_OFFLOAD_LIMIT`
 *  同值（65536 字符）——累计到限停收（超出丢弃）；发生丢弃 ⇒ 回显段尾恰一行截断标记（逐字——两路径同款）。 */
const CONSOLE_CAPTURE_LIMIT = 64 * 1024
const CONSOLE_TRUNCATED_MARK = "[console truncated at 65536 chars]"

/** 单条 prepared 项的执行（Phase 2 体——原 `dispatch.mjs` runOne 闭包；自由变量 agent ∕ depth ∕
 *  signal ∕ callbacks 经形参代入，语义逐字保持：console 捕获 ∕ routed 短路 ∕ mutation 记账 ∕
 *  错误收口零改）。 */
export async function runPreparedItem(item, agent, depth, signal, callbacks) {
  if (item.error) return { ...item, result: `Error: ${item.error}`, ok: false }
  if (item.denied) {
    const reason = item.reason === "plan mode"
      ? "Error: plan mode is active — only read-only tools are allowed. Exit plan mode first."
      : item.reason === "engineering design gate"
        ? `Error: design review required before any file modification. ${item.hint}`
        : item.reason === "d5 freeze window" || item.reason === "cross-batch record write"
        ? `Error: ${item.hint}`
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
  // 采集端有界（#863）：累计达限停收——超出丢弃并置截断位（段尾恰一行标记的判据；采集端单点）。
  let capturedChars = 0
  let capturedTruncated = false
  const capturedPush = (t) => {
    const room = CONSOLE_CAPTURE_LIMIT - capturedChars
    if (room <= 0) { capturedTruncated = true; return }
    if (t.length + 1 > room) { t = t.slice(0, room - 1); capturedTruncated = true }
    capturedChars += t.length + 1
    capturedConsole.push(t)
  }
  // LOGGING（LOGGING.md）：tool:* 事件——仅真实执行（pre-gate 拦截项在下方早退分支不入事件）。
  // 参数值永不落盘（NF-L3——工具事件不记 args）；child=子代理 id（agent._logId，spawn 时 stamp）。
  const toolT0 = Date.now()
  const toolName = item.toolCall.name
  logEvent("tool:call", { tool: toolName, child: agent?._logId })
  try {
    // R10 L3 (MULTI-INSTANCE-COLLAB §2a.5 D-L3b / §4.4.4)：结构化写工具执行前查冲突与认领
    // 命中（软提示——决策⑥ A 不阻止；一次目录 stat——N3 度量）；足迹累积（D-L3a——"检测+
    // 记录一次完成"）与认领登记延后到执行成功（实际写过的文件）。
    const isPeerWriteTool = PEER_WRITE_TOOLS.has(toolName)
    const peerNote = isPeerWriteTool ? peerCollabNote(agent, item.tool, item.args) : null
    // Snapshot for undo before side-effect tools (setupOutputPanel already fired in Phase 1)
    if (!item.tool?.readonly && item.args) {
      snapshotForUndo(agent, item.toolCall.name, item.args, agent.cwd)
    }
    // M2 ACP: route fs tools through the client (IDE buffer / diff review).
    // toolRouter returns { handled: true, result } to short-circuit execution.
    if (callbacks.toolRouter) {
      const routed = await callbacks.toolRouter(item.toolCall.name, item.args)
      if (routed?.handled) {
        const routedOk = !String(routed.result).startsWith("Error:")
        const routedResult = peerNote && routedOk ? `${routed.result}\n${peerNote.text}` : routed.result
        if (peerNote && routedOk) markClaimNoted(agent, peerNote.keys) // 提示已附加 ⇒ 落去重标记
        if (isPeerWriteTool && routedOk) recordPeerWrites(agent, item.tool, item.args)
        // fix A：routed 写成功（客户端执行）同样执行期即刻记账（唯一记账点）
        if (routedOk && FILE_MUTATORS.has(toolName)) noteExecutedMutation(agent, item.tool, item.args)
        callbacks.onToolResult?.(item.toolCall.name, routedResult, item.toolCall.id)
        logEvent("tool:done", { tool: toolName, ms: Date.now() - toolT0, head: headText(routedResult, 200), child: agent?._logId })
        return { ...item, result: routedResult, ok: true }
      }
    }
    const origConsoleLog = console.log
    const origConsoleErr = console.error
    console.log = (...a) => capturedPush(a.map(String).join(" "))
    console.error = (...a) => capturedPush("[err] " + a.map(String).join(" "))
    let rawResult
    // ctx 对象提升为变量（docs/cli/design/TUI.md §6.8）：subagent 阻塞 execute 返回前在 ctx 上留
    // _subagentKey（relayPrefix 去尾）——runOne 在 execute 返回后读它作 onToolResult
    // 第 4 参（普通工具/错误路径无此字段——undefined 兼容既有签名）。每次工具调用
    // 独立 ctx——并行同名工具（批并行 runOne）各自带自己的 key，互不串扰。
    const toolCtx = {
      cwd: agent.cwd,
      agent,
      depth,
      signal,
      callbacks,
      // AGENT-LOOP-ASYNC-POOL.md §6.10 D-24b: per-call id — the advisor tool marker-keys its launch so
      // recordToolResults can split async-ack accounting from sync settles.
      _toolCallId: item.toolCall.id,
      onOutput: (chunk) => callbacks.onToolOutput?.(item.toolCall.name, chunk, item.toolCall.id),
      onQuestion: callbacks.onQuestion,
      onPermissionRequest: callbacks.onPermissionRequest,
    }
    try {
      // SUBAGENT-OBSERVE-SEND D1（评审 #1）：in-flight 当前工具记账——工具执行期间在
      // agent 上留 _inflightTools Set（子代理 observe 从 dispatch 状态读——卡在长工具
      // 调用时 history 无新回合、恰需此信号）；finally 清除。批并行工具同入 Set（observe
      // 如实返回多个在跑工具）。主会话同样记账——无害（无人读）。
      const inflight = agent._inflightTools ?? (agent._inflightTools = new Set())
      inflight.add(toolName)
      try {
        rawResult = await item.tool.execute(item.args, toolCtx)
      } finally {
        inflight.delete(toolName)
      }
    } finally {
      console.log = origConsoleLog
      console.error = origConsoleErr
    }
    if (rawResult === undefined) throw new Error(`Tool "${item.toolCall.name}" returned undefined — all tools must return a string value`)
    const raw = String(rawResult)
    // 写成功（非 "Error:" 字符串结果）→ 足迹计入本回合集合（flush 在 finalizeAgentTurn）
    if (isPeerWriteTool && !raw.startsWith("Error:")) {
      recordPeerWrites(agent, item.tool, item.args)
    }
    // fix A：FILE_MUTATORS 执行成功即刻记账（唯一记账点——取代 record-results 批后
    // 段 + agent.mjs 中断分支——不双计）——同批 launch 前的写在 launchSeq 之前落地 →
    // async advisor settle 不误判 stale（同批 launch 后写仍保守 stale——T-A2/T-24b9）。
    if (FILE_MUTATORS.has(toolName) && !raw.startsWith("Error:")) {
      noteExecutedMutation(agent, item.tool, item.args)
    }
    // 2026-08-31 工具输出回显 ∥ #863：console 段 ∥ 结果本体拼接先于 offload——并入 64K 判定
    // （超限 ⇒ 落盘 + 预览）；采集端发生过丢弃 ⇒ 段尾恰一行截断标记（逐字——错误路径同款）。
    const consoleSegment = capturedConsole.length > 0
      ? `\n[console during ${item.toolCall.name}]\n${capturedConsole.join("\n")}${capturedTruncated ? `\n${CONSOLE_TRUNCATED_MARK}` : ""}`
      : ""
    const spliced = raw + consoleSegment
    // Multimodal tools keep the raw result (base64 images ride the multimodal
    // channel); everything else offloads oversized text to disk. Flag-driven, not
    // name-driven (consult P3, 2026-08-30).
    const result = item.tool?.multimodal ? spliced : await offloadToolResult(spliced, item.toolCall.id)
    // R10 L3：冲突 / 认领软提示附在工具结果末尾（模型可见——不阻止写；提示附加成功才落去重标记）
    const notedOk = Boolean(peerNote) && !raw.startsWith("Error:")
    if (notedOk) markClaimNoted(agent, peerNote.keys)
    const resultForModel = notedOk
      ? `${result}\n${peerNote.text}`
      : result
    callbacks.onToolResult?.(item.toolCall.name, resultForModel, item.toolCall.id, toolCtx._subagentKey)
    // PostToolUse hooks: fire-and-forget (result not awaited on hook failure)
    runHooks("PostToolUse", { agent, toolName: item.toolCall.name, toolArgs: item.args, result: raw }).catch(() => {})
    logEvent("tool:done", { tool: toolName, ms: Date.now() - toolT0, head: headText(resultForModel, 200), child: agent?._logId })
    return { ...item, result: resultForModel, ok: true }
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
    // Build contextual error: tool name + key args — #327 same family: no raw args deref (`arguments:"null"` reachable)
    const a = item.args ?? {}
    const ctxParts = []
    if (a.path) ctxParts.push(`path=${a.path}`)
    if (a.pattern) ctxParts.push(`pattern=${a.pattern}`)
    if (a.command) ctxParts.push(`cmd=${String(a.command).slice(0, 80)}`)
    const ctx = ctxParts.length > 0 ? ` [${ctxParts.join(", ")}]` : ""
    // 2026-08-31：异常路径同样回显捕获的 console（工具报错前的探查输出最有价值）
    const consolePart = capturedConsole.length > 0
      ? `\n[console during ${item.toolCall.name}]\n${capturedConsole.join("\n")}${capturedTruncated ? `\n${CONSOLE_TRUNCATED_MARK}` : ""}`
      : ""
    return { ...item, result: `Error: ${error.message}${ctx}${consolePart}`, ok: false }
  }
}
