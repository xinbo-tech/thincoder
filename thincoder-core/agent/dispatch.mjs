/**
 * agent/dispatch.mjs — two-phase tool call execution
 */
import { logEvent, errText, headText } from "../log.mjs"
import { offloadToolResult, FILE_MUTATORS } from "./helpers.mjs"
import { runHooks } from "../hooks.mjs"
import { snapshotForUndo } from "../undo-stack.mjs"
import { isCodePath, loadConventions } from "../conventions.mjs"
// R10 L3 (MULTI-INSTANCE-COLLAB §2a.5 D-L3b)：写工具钩子——peerCollabNote（执行前冲突
// 检测——软提示不阻止）+ recordPeerWrites（成功后累积本回合写足迹——回合末 flush）。
import { PEER_WRITE_TOOLS, peerCollabNote, recordPeerWrites } from "../peer-domains.mjs"
import { writeFileSync, mkdirSync, existsSync } from "node:fs"
import { join, resolve, relative } from "node:path"
import { homedir } from "node:os"
// §29 fix A（AGENT-LOOP.md §29——2026-09-07）：FILE_MUTATORS 的 mutation-seq 记账从
// 批后提交（record-results noteMutations）移到执行成功即刻——唯一记账点（取代批后段
// + agent.mjs 中断分支记账——不双计）——同消息 [写 + async advisor launch] 时 launch 前
// 完成的写在 launchSeq 之前落地 → settle 不再误判 stale（§29 症状根因）。
import { noteMutations, inflightDesignReviewConflict } from "../agent-tools/advisor-async.mjs"
import { anyLiveDesignSlot } from "../token-ttl.mjs"

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
 * tool expresses spawn (side effect) and status (read-only query) through
 * its `action` parameter — the tool-level readonly flag can no longer express both.
 * dispatch Phase-1/Phase-2 classifies per action: status behaves as readonly
 * (planMode pass / no permission ask / batchable), spawn keeps its non-readonly
 * gates, escalate runs non-readonly AND serially (the retired escalate tool had no
 * parallel flag — zero behavior change under the merged surface).
 * §19.5 cancel (19.5.2b round2 #4): CONTROL-class exemption — cancel only
 * stops, never starts. isSubagentControlAction feeds the SAME two gate sites as
 * readonly (planMode pass / no permission ask — never joins a batch approval
 * group / no handler → not denied — digest 内 cancel 放行).
 * §19.6 panel (round1 #5): view 面归只读类（同 status——planMode 放行、免
 * 审批、可批并行）；freeze 面归控制类（同 cancel——planMode 放行、免权限审批、
 * 批审批不入组、digest 内放行）。freeze 存在（非空 key）即控制类——否则只读类。
 */
function isSubagentReadonlyAction(toolName, args) {
  // §6 memory 工具面重构（MEMORY.md §6 D-M5）：memory search/list 是只读动作——与
  // subagent status 同分类（planMode 放行/免审批——Phase-2 批并行只认工具级
  // readonly/parallel，memory 无 parallel → 按非只读串行，见 MEMORY.md §6.4 实现注）。
  // 动作级判定——不能按工具名（同一 memory 工具的 put/delete/clear 保持侧效门）。
  if (toolName === "memory") {
    const action = args?.action
    return action === "search" || action === "list"
  }
  // SETTINGS-TOOL.md（2026-09-05）：settings list/get 是只读动作（memory search/list 同分类——
  // planMode 放行/免审批）；set 保持侧效门。
  if (toolName === "settings") {
    const action = args?.action
    return action === "list" || action === "get"
  }
  if (toolName !== "subagent" || !args || typeof args !== "object") return false
  const action = args.action
  // §19.8: check 动作已删除——只读面仅剩 status（planMode 放行/免权限审批/可批并行）
  if (action === "status") return true
  // SUBAGENT-OBSERVE-SEND：observe = readonly 查询（同 status——digest/planMode 放行）
  if (action === "observe") return true
  // §19.6 panel view 面（freeze 缺省/空 = 视图请求——readonly；非空 freeze 归控制类）
  if (action === "panel" && (args.freeze === undefined || args.freeze === null || String(args.freeze) === "")) return true
  return false
}
function isSubagentControlAction(toolName, args) {
  if (toolName !== "subagent") return false
  if (args?.action === "cancel") return true
  // SUBAGENT-OBSERVE-SEND：send = 控制类豁免（同 cancel——父回合内显式调用即授权——
  // 写子输入队列属父对子轻量引导，非产品代码写——免审批、planMode 放行、digest 内放行）
  if (args?.action === "send") return true
  // §19.6 panel freeze 面（D-P3 门控在 executor——只读/控制分类在此）
  if (args?.action === "panel" && args.freeze !== undefined && args.freeze !== null && String(args.freeze) !== "") return true
  return false
}
/**
 * §2.6 token 链终消费制（2026-09-07——评审 #7d dispatch 分类）：consume-design =
 * 非只读控制动作——planMode 拒绝（不入 readonly/control 豁免——与其他非只读动作同门）、
 * 免权限审批、不入批审批分组（无文件写——控制类直行——只停既有状态不起新副作用）。
 * 与 cancel 的不同：cancel 是控制类豁免（planMode 放行），consume-design 按设计
 * planMode 拒绝——故不并入 isSubagentControlAction，单独谓词只接权限豁免位。
 */
function isSubagentConsumeDesignAction(toolName, args) {
  return toolName === "subagent" && args?.action === "consume-design"
}
function isSubagentEscalateAction(toolName, args) {
  return toolName === "subagent" && args?.action === "escalate"
}

/**
 * §29 fix A — 唯一记账点：FILE_MUTATORS 工具执行成功即刻记 mutation seq（abs 路径）。
 * 取代 record-results 批后段 + agent.mjs 中断分支的 noteMutations（不双计——中断+同批
 * launch 场景 seq 单计，AGENT-LOOP.md §29 T-A1i）。调用时机 = 写执行成功（非 Error 前缀
 * 结果——recordPeerWrites 同款门）；routed（M2 ACP 客户端执行）成功同样记账。
 */
function noteExecutedMutation(agent, tool, args) { 
  let paths
  try {
    paths = tool.touchedPaths ? tool.touchedPaths(args ?? {}) : [args?.path]
  } catch { return }
  const abs = (paths ?? [])
    .filter((p) => typeof p === "string" && p)
    .map((p) => resolve(agent.cwd, p))
  if (abs.length > 0) noteMutations(agent, abs)
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
    // before the design review passed. Signaled by a live design slot (design-review
    // approval — persists in the session slot, survives across turns; _engDesignReviewed
    // is eng-coder-only and reset per run). Exemptions = the non-code classes of
    // src/conventions.mjs (documentation and temp scratch files) — writing a design
    // document IS the design step. Anything inside a declared code segment (default:
    // src — incl. src/prompts/*.md) is product code, not documentation, and needs a
    // design token. The project can declare its own code paths (.thincoder/
    // conventions.json) so a non-src layout is not silently exempted. Mechanically
    // blocks "talk then code".
    // DESIGN-TOKEN-SETTLEMENT D3（2026-09-08）：资格判据 = 权威槽"任一活槽存在"
    // （anyLiveDesignSlot——查内存 Map，miss 回读槽文件——单值镜像 `_engDesignToken`
    // 已退役，门禁不再读镜像——AC4）。
    if (agent.config?.agent?.engineering && depth === 0
        && !anyLiveDesignSlot(agent)
        && FILE_MUTATORS.has(toolCall.name)) {
      const paths = tool.touchedPaths ? tool.touchedPaths(args) : [args.path]
      const conv = loadConventions(agent.cwd)
      // Unknown/missing paths (non-string, e.g. no path argument) are treated
      // as code — cannot tell what they touch, so block conservatively. Known
      // paths go through the single shared classifier: a declared code segment
      // (default: "src") at ANY depth, else anything that is not documentation.
      const touchesCode = paths.some((p) => typeof p !== "string" || isCodePath(p, conv))
      if (touchesCode) {
        // Undeclared project → point at the declaration file (§4.3 降级可见契约).
        const convNote = conv.declared
          ? ""
          : ` — this path was classified as product code by the default conventions (code paths: ${conv.codePaths.join(", ")}); declare project conventions in .thincoder/conventions.json to adjust.`
        prepared.push({
          toolCall, tool, denied: true,
          reason: "engineering design gate",
          hint: `Engineering mode: write the design document first（location per your project's document conventions）, then call advisor with type='design' to review it, and wait for user approval. Implementation is done by eng-coder subagents.${convNote}`,
        })
        continue
      }
    }

    // E（第 11 批·F17/§14.14 E-3d）：D5 冻结窗口写前拦截——设计评审在途（点火 → 结算）期间，
    // 父侧对被审文件集（声明文档集 + 批次档）的写入会被拒绝：在途写使本轮结算 stale——pass 轮
    // = token 直接丢失（实证：第 10 批 id=20 整轮作废）。工具面 = FILE_MUTATORS（与变更记账
    // 同集——不记入日志的写面既不判 stale 也不拦）；判据与 reviewIsStale 同源
    // （inflightDesignReviewConflict——同 docAbs / 同 normAbs；仅扫 running 未取消的设计条目）。
    // 位置：只读 / autoApprove 短路之前——审批不得绕过冻结；拒绝 = 可见 denied + 逃生门
    // （先 cancel → 改 → 重发）。
    if (FILE_MUTATORS.has(toolCall.name)) {
      let touched = []
      try { touched = tool.touchedPaths ? tool.touchedPaths(args) : [args.path] } catch { touched = [] }
      const absPaths = (touched ?? [])
        .filter((p) => typeof p === "string" && p)
        .map((p) => resolve(agent.cwd, p))
      const conflict = inflightDesignReviewConflict(agent, absPaths)
      if (conflict) {
        prepared.push({
          toolCall, tool, denied: true,
          reason: "d5 freeze window",
          hint: `write refused — design review #${conflict.id} is in flight over ${relative(agent.cwd, conflict.path)} (D5 freeze window). A write now would settle it stale — no token for a pass (the round is lost). Wait for the report, or cancel the review first (subagent action:'cancel' id:'${conflict.id}') and re-launch after the change.`,
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
    if (tool.readonly || isSubagentReadonlyAction(toolCall.name, args) || isSubagentControlAction(toolCall.name, args) || isSubagentConsumeDesignAction(toolCall.name, args) || agent.autoApprove || agent._engTaskAuthorized) {
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
          : item.reason === "d5 freeze window"
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
    // LOGGING（LOGGING.md）：tool:* 事件——仅真实执行（pre-gate 拦截项在下方早退分支不入事件）。
    // 参数值永不落盘（NF-L3——工具事件不记 args）；child=子代理 id（agent._logId，spawn 时 stamp）。
    const toolT0 = Date.now()
    const toolName = item.toolCall.name
    logEvent("tool:call", { tool: toolName, child: agent?._logId })
    try {
      // R10 L3 (MULTI-INSTANCE-COLLAB §2a.5 D-L3b)：结构化写工具执行前查 conflicts
      // （命中他实例 hot 域 → 结果附软提示——决策⑥ A 不阻止；一次目录 stat——N3 度量）；
      // 足迹累积（D-L3a——"检测+记录一次完成"）延后到执行成功（实际写过的文件）。
      const isPeerWriteTool = PEER_WRITE_TOOLS.has(toolName)
      const peerNote = isPeerWriteTool ? peerCollabNote(agent.cwd, item.tool, item.args) : null
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
          const routedResult = peerNote && routedOk ? `${routed.result}\n${peerNote}` : routed.result
          if (isPeerWriteTool && routedOk) recordPeerWrites(agent, item.tool, item.args)
          // §29 fix A：routed 写成功（客户端执行）同样执行期即刻记账（唯一记账点）
          if (routedOk && FILE_MUTATORS.has(toolName)) noteExecutedMutation(agent, item.tool, item.args)
          callbacks.onToolResult?.(item.toolCall.name, routedResult, item.toolCall.id)
          logEvent("tool:done", { tool: toolName, ms: Date.now() - toolT0, head: headText(routedResult, 200), child: agent?._logId })
          return { ...item, result: routedResult, ok: true }
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
        // §11.2 D-24b: per-call id — the advisor tool marker-keys its launch so
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
      // §29 fix A：FILE_MUTATORS 执行成功即刻记账（唯一记账点——取代 record-results 批后
      // 段 + agent.mjs 中断分支——不双计）——同批 launch 前的写在 launchSeq 之前落地 →
      // async advisor settle 不误判 stale（同批 launch 后写仍保守 stale——T-A2/T-24b9）。
      if (FILE_MUTATORS.has(toolName) && !raw.startsWith("Error:")) {
        noteExecutedMutation(agent, item.tool, item.args)
      }
      // Multimodal tools keep the raw result (base64 images ride the multimodal
    // channel); everything else offloads oversized text to disk. Flag-driven, not
    // name-driven (consult P3, 2026-08-30).
    const result = item.tool?.multimodal ? raw : await offloadToolResult(raw, item.toolCall.id)
      // 2026-08-31：工具执行期间捕获的 console 输出附在结果后回显（模型视野）
      const resultWithConsole = capturedConsole.length > 0
        ? `${result}\n[console during ${item.toolCall.name}]\n${capturedConsole.join("\n")}`
        : result
      // R10 L3：冲突软提示附在工具结果末尾（模型可见——不阻止写）
      const resultForModel = peerNote && !raw.startsWith("Error:")
        ? `${resultWithConsole}\n${peerNote}`
        : resultWithConsole
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
    // spawn stays parallel; status classifies as readonly and batch freely).
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
