/**
 * subagent-async.mjs — async/audit machinery + action handlers of the subagent tool
 * family. Split out of subagent.mjs (2026-09-03, 500-line discipline) — originally a
 * PURE MECHANICAL MOVE (zero behavior change at the time); the §19 merge (below) then
 * added the check/status/escalate action handlers here. subagent.mjs re-exports the
 * public names, so no consumer (agent.mjs, suspension.mjs, index.mjs, setup.mjs,
 * tests) changed.
 *
 * §18 (AGENT-LOOP.md D-E1..E3): eng-coder audit spawns — gateEngCoderSpawn (explore-only +
 * sync-only + the 7th-spawn audit-budget backstop; budget carried on history._engAuditSpawns
 * so it survives runAgent resume), auditTaskBook (D-E2 ③ — the audit child's task book is the
 * eng-coder's OWN spawn task ∪ mechanically tracked touched files, never a self-written list),
 * shouldAutoResume (D-A3 exception — an engineering && AUTO async child auto-resumes at the
 * turn cap: the §18 D-E2 cap fallback for the default-async eng-coder delivery).
 *
 * §15/§17 (D-A1/D-A4/D-S1..S9, CLI D-A1/D-A2/D-A4/D-S3 同规格): the async pool —
 * spawnAsyncSubagent (slot queue: running count < ASYNC_SUBAGENT_LIMIT starts immediately,
 * ≥ limit queues with a position), settleAsyncEntry (settle binds the ENTRY, suspension-aware:
 * settled-while-suspended → history._pendingAsyncResults, aborted → pool discard),
 * collectSettledAsync (turn-end collection), injectAsyncResult (the shared D-S3 injector).
 *
 * §19 (AGENT-LOOP.md §19, 2026-09-03): the single-tool merge dispatches to the action
 * HANDLERS in this module — subagentCheck (action:"check" — the retired subagent_check
 * semantics verbatim), subagentStatus (action:"status" — non-blocking pool query).
 * The escalate handler lives in subagent-escalate.mjs (2026-09-03 advisor round —
 * 500-line hard cap; VERBATIM move, zero behavior change — it imports
 * mergeChildMutations + nextSubagentId from here, one-way, no cycle).
 * §19.5 (AGENT-LOOP.md §19.5, 2026-09-03): control surface — cancelSubagent/cancelSubagentAction
 * (action:"cancel" + UI ⏹ 共用——per-entry AbortController 定向中止, queued 出队),
 * D-M5 status decision fields (model/elapsedSec/turn/maxTurns on pool entries and
 * status output), the cancelled-settle branch (no pending transfer, no collect
 * injection — stopped-freeze notification only).
 * mergeChildMutations lives here (subagent.mjs re-exports it — no consumer
 * changed) — shared by the eng-coder spawn merge and the escalate engine.
 */
import { escapeXml, offloadToolResult, pushReal } from "../agent/run-helpers.mjs"
import { logEvent, errText } from "../log.mjs"

/**
 * §18 D-E3 eng-coder internal-spawn mechanical gate (AGENT-LOOP.md §18 D-E2 round5 #2
 * backstop): inside an eng-coder sub-agent (depth>0 且 _role==="eng-coder") the spawn
 * channel exists solely for the divergence audit — role is explore-only and spawns are
 * forced synchronous; the audit budget = 1 initial audit + ≤5 fix-round re-audits (the
 * 7th audit spawn is refused mechanically — if the 5-round discipline fails, the refusal
 * error IS the stalled signal, never silent). Returns null outside an eng-coder context
 * (no restriction); returns the audit attempt number (1-based) when the spawn passes —
 * the caller augments the audit task book with it (§18 D-E2 ③). The schema-level filter
 * (setup.mjs restricted variant) is the model-facing hint — this function is the
 * mechanical enforcement.
 */
export const ENG_AUDIT_SPAWN_LIMIT = 6 // 6 audit spawns allowed; the 7th is refused
export function gateEngCoderSpawn(parent, depth, role, asyncArg) {
  if ((depth ?? 0) <= 0 || parent?._role !== "eng-coder") return null
  if (role !== "explore") {
    throw new Error("eng-coder subagents may only spawn role='explore' — internal spawns exist solely for the read-only divergence audit (AGENT-LOOP.md §18 D-E3)")
  }
  if (asyncArg === true) {
    throw new Error("eng-coder internal spawns are sync-only — the audit report must return before the next protocol step; async spawn is only available at the top level (AGENT-LOOP.md §18 D-E3)")
  }
  // §18 audit budget lives per DELIVERY, not per runAgent segment (code review #2):
  // the child agent object is rebuilt on every runAgent call (incl. ContinueError
  // resume via opts.history) — carry the count on the run history array (survives
  // resume; same carrier pattern as §17 _asyncSubagents/_pendingAsyncResults) and
  // fall back to the agent field when no history is present (direct-execute ctx).
  const carrier = parent.history ?? parent
  const attempt = (carrier._engAuditSpawns ?? 0) + 1
  if (attempt > ENG_AUDIT_SPAWN_LIMIT) {
    throw new Error("correction-round limit exceeded — deliver a stalled report (AGENT-LOOP.md §18: max 5 fix rounds; the 7th audit spawn is refused mechanically)")
  }
  carrier._engAuditSpawns = attempt
  return attempt
}

/**
 * §18 D-E2 ③ (round4 #4, T-E13/T-E15): an eng-coder audit spawn's task book is
 * appended MECHANICALLY — the eng-coder's OWN spawn task (docs involved /
 * acceptance criteria / file list, kept verbatim as agent._engTaskInput by its
 * parent spawn) ∪ the mechanically tracked _touchedFiles — NEVER a self-written
 * list (a self-report could omit exactly the out-of-scope file the audit must
 * catch). Caller: subagent.mjs execute — builds the child input of an eng-coder
 * audit (explore) spawn; plain `task` outside an audit context (attempt === null).
 */
export function auditTaskBook(task, agent, engAuditAttempt) {
  let childInput = task
  if (engAuditAttempt !== null) {
    const touched = (agent._touchedFiles ?? []).map((f) => `- ${f}`).join("\n") || "- (none yet)"
    childInput += "\n\n[Audit scope — mechanical context, independent of the eng-coder's self-report:]\n" +
      `Parent spawn task book (Docs involved / file list / acceptance criteria — the eng-coder's own task, verbatim):\n${agent._engTaskInput ?? "(unavailable)"}\n` +
      `Files actually touched by the eng-coder (mechanical union — audit these against the file list):\n${touched}`
  }
  return childInput
}

/**
 * §15 D-A3 exception (2026-09-02 unified rule): in an engineering && AUTO session
 * the async child auto-resumes at the turn cap — the user authorized unattended
 * runs, no one is at the panel. §18 D-E2 relies on this exception as the turn-cap
 * fallback for the default-async eng-coder delivery (the internal delivery protocol
 * does not raise the 100-turn cap). Every other async case auto-declines to the
 * partial-work report (caller's ContinueError branch). VS Code's live-AUTO read is
 * ctx.getAuto (execute-tools wires runAgent's live autoApprove getter into every
 * tool ctx — the per-run VS Code agent has no autoApprove field).
 */
export function shouldAutoResume(asyncFlag, parent, ctx) {
  return asyncFlag && parent.config?.agent?.engineering && (ctx.getAuto?.() ?? false)
}

/**
 * §15 D-A1/D-A4 async spawn branch（extracted verbatim from subagent.mjs execute——
 * 2026-09-03 split）：槽位队列——立即返回，不 await 报告。
 * 上限指标 = running 数（done/queued 不计入）；≥ ASYNC_SUBAGENT_LIMIT → 入队
 * （status:"queued" + position），任一 running settle → 队列头部自动补位启动。
 * 关键结构：settle 逻辑绑定 ENTRY 自身（entry._resolve / entry.start）——不同 execute
 * 调用之间互不串扰（本调用的 finish 不得去解析另一个调用的 entry.settled）。
 * §19.5 (AGENT-LOOP.md §19.5 D-M5/D-M6)：条目级控制面——entry.controller（per-entry
 * AbortController——cancel 定向 abort 只停该条目；childSignal abort 逐链传播——
 * Ctrl+C/Stop 全停语义不变）；entry.cancelled 标记（settle 回调据此走 cancelled 分支：
 * 不入 pending、不参与 collect 直注入、停止冻结通知）；D-M5 可决策字段
 * （model/startedAt/turn/maxTurns——turn 由 runChild 的 onAgentTurn 回调同步，见
 * subagent.mjs——startedAt 记于 entry.start = 实际启动时刻，elapsedSec 以它计算：
 * 队列等待不计入运行时长）；entry._onCancelled = 停止冻结通知（onSubagent
 * status:"cancelled"——spawn 上下文绑定——webview ⟦ev⟧stopped 冻结相位）。
 */
export function spawnAsyncSubagent({ parent, ctx, subId, role, provider, childSignal, runChild }) {
  parent._asyncSubagents = parent._asyncSubagents ?? new Map()
  const id = subId
  const entry = {
    id, role,
    status: "queued", position: 0,
    report: null, error: null, done: false,
    settled: null, _resolve: null,
    // §17: the child's effective signal (session-first) — the settle callback reads it
    // to skip the pending transfer when the session was aborted (abort = discard).
    signal: childSignal,
    // §19.5 D-M5 可决策字段（status 输出 + cancel 决策）——spawn 时装配。
    model: provider.model ?? null,
    maxTurns: parent.config?.agent?.subagentTurns ?? 100,
    turn: 0,
    startedAt: null, // entry.start 时记（实际启动时刻——elapsedSec = 运行时长，队列等待不计入）
    // §19.5 D-M6: 条目级 AbortController + cancelled 标记 + 停止冻结通知器。
    cancelled: false,
    controller: null,
    _onCancelled: null,
  }
  entry.settled = new Promise((res) => { entry._resolve = res })
  // Per-entry controller chained to the shared child signal（D-M6 round2 #2 定稿——
  // session/回合 abort 逐链传播保 Ctrl+C 全停；cancel 只 abort 本条目的 controller）。
  entry.controller = new AbortController()
  if (childSignal?.aborted) entry.controller.abort()
  else childSignal?.addEventListener?.("abort", () => entry.controller.abort(), { once: true })
  // 停止冻结通知：cancelled settle（或 queued 取消）时发给 spawn 上下文（webview 行 +
  // 区块 stopped 冻结相位——不经当前调用者——挂起期 UI ⏹ 直连路径同样靠它渲染）。
  entry._onCancelled = () => ctx.callbacks?.onSubagent?.({ id: entry.id, role: entry.role, status: "cancelled" })
  entry.start = () => {
    entry.status = "running"
    entry.startedAt = Date.now()
    // pool: true —— 异步池条目标记：webview 只有池条目（async spawn）的块挂 ⏹——
    // 同步 spawn 同样发 started 但无池条目（cancel 路由定位不到——防无效 ⏹，审计 F1）
    ctx.callbacks?.onSubagent?.({ id: entry.id, role: entry.role, status: "started", startedAt: entry.startedAt, model: provider.model ?? null, pool: true })
    runChild(entry).then(
      (report) => settleAsyncEntry(parent, entry, report, null, ctx.callbacks?.onAsyncSettled),
      (err) => settleAsyncEntry(parent, entry, null, err?.message ?? String(err), ctx.callbacks?.onAsyncSettled),
    )
  }
  parent._asyncSubagents.set(id, entry)
  const runningCount = [...parent._asyncSubagents.values()].filter((x) => x.status === "running").length
  // §18 code review #1: the spawn result must be a JSON STRING — the agent loop
  // serializes every tool result with String(raw) (execute-tools.mjs), so a plain
  // object would reach the model as "[object Object]" and the id/status/position
  // contract of the tool description and engineering.md step 6 would be lost (CLI
  // parity — the CLI stringifies the same shapes).
  if (runningCount < ASYNC_SUBAGENT_LIMIT) {
    entry.start()
    // LOGGING（LOGGING.md——CLI parity）：child:spawn async（立即启动）
    logEvent("child:spawn", { role, id: `${role}#${id}`, kind: "async", status: "running" })
    return JSON.stringify({ id, role, status: "running" })
  }
  entry.position = [...parent._asyncSubagents.values()].filter((x) => x.status === "queued").length
  // LOGGING（LOGGING.md——CLI parity）：child:spawn async（排队——启动由补位触发）
  logEvent("child:spawn", { role, id: `${role}#${id}`, kind: "async", status: "queued" })
  return JSON.stringify({ id, role, status: "queued", position: entry.position })
}

/**
 * §15 D-A1 settle：落 report/error + 解析该 entry 自己的 settled（arrival-order 唤醒
 * action:'check' / 回合收尾）→ 腾槽补位（running settle 一个即启动队列头部——完成即补位，
 * 不消费才补；失败/abort 同样腾槽）。entry.start 绑定创建它的 execute 调用上下文，
 * 因此补位启动的子代理跑的是它自己的 pipeline。
 * §17 D-S3 ②/D-S8（VS Code 对齐）：settle 时若处于挂起态（parent.history._suspended——
 * 共享数组，跨 runAgent 调用存活；读取时刻为准，确定性）→ 延迟冻结：条目移交
 * history._pendingAsyncResults（由下个回合 prepareRun 前注入，D-S3 ② 记账点）并从池
 * 移除；正常回合内 settle 行为不变（留池，回合尾 collectSettledAsync 直注入 ①）。
 * §19.5 D-M6 cancelled settle（第一分支）：entry.cancelled（cancel 定向中止）→ 不入
 * pending、不参与 collect 直注入（无错误报告——陈旧结果零注入）——出池清理 + 停止冻结
 * 通知（_onCancelled——webview stopped 相位）——腾槽补位照常。
 * 会话中止（entry.signal aborted）跳过移交并**出池清理**（2026-09-02 偏差修复 #2）——
 * abort 清池不注入陈旧错误，且 done 僵尸条目不得留在池里让 poolLive 恒真。
 */
function settleAsyncEntry(parent, entry, report, error, notifySettle) {
  entry.report = report
  entry.error = error
  entry.done = true
  // LOGGING（LOGGING.md——CLI parity）：settle 分流事件——child:done/child:error（结果）+
  // ev:cancelled/ev:settled（settle 回调分流；正常回合内 settle 由 child:done 覆盖——
  // ev:stopped 见中止清池点）
  const childLogId = `${entry.role}#${entry.id}`
  const childMs = entry.startedAt ? Date.now() - entry.startedAt : 0
  // 中止守卫（2026-09-03 code review #6）：Ctrl+C/会话中止时子代理以 error 形态 settle——
  // 不落 child:error/done/ev:settled（ev:stopped 已在中止清池点表达；同端阻塞路径同款
  // 抑制——"用户停——不落错误事件"）。定向 cancel 走 ev:cancelled。
  if (entry.cancelled) {
    logEvent("ev:cancelled", { id: childLogId })
  } else if (!entry.signal?.aborted && !entry.controller?.signal?.aborted) {
    if (error != null) logEvent("child:error", { role: entry.role, id: childLogId, ms: childMs, err: errText(error, 200) })
    else logEvent("child:done", { role: entry.role, id: childLogId, ms: childMs, kind: String(report ?? "").includes("turn cap reached") ? "partial" : "ok" })
    if (parent.history?._suspended === true) logEvent("ev:settled", { id: childLogId, kind: "suspended" })
  }
  // §19.5 D-M6 cancelled settle（round1 #1 + round2 #2 定稿）：entry.cancelled（cancel
  // 动作 / UI ⏹）→ **不入 _pendingAsyncResults、不参与 collectSettledAsync 直注入**
  // （无错误报告——陈旧结果零注入）——出池清理同 Ctrl+C 全停但只清该条目 + 停止冻结
  // 事件（entry._onCancelled——webview ⟦ev⟧stopped 冻结——"stopped"）。
  if (entry.cancelled) {
    parent.history?._asyncSubagents?.delete(entry.id)
    parent._asyncSubagents?.delete(entry.id) // map keys are the spawn-time id (number)
    entry._onCancelled?.()
  } else if (entry.signal?.aborted) {
    parent.history?._asyncSubagents?.delete(entry.id)
    parent._asyncSubagents?.delete(entry.id) // map keys are the spawn-time id (number)
  } else if (parent.history?._suspended === true) {
    const hist = parent.history
    const pend = (hist._pendingAsyncResults ??= [])
    if (!pend.includes(entry)) pend.push(entry)
    hist._asyncSubagents?.delete(entry.id)
    parent._asyncSubagents?.delete(entry.id) // map keys are the spawn-time id (number)
  }
  entry._resolve?.(entry)
  const queued = [...(parent._asyncSubagents?.values() ?? [])].filter((x) => x.status === "queued")
  if (queued.length > 0) queued[0].start()
  notifySettle?.()
}

// ─── Async subagent machinery（AGENT-LOOP.md §15 + §17，CLI D-A1/D-A2/D-A4/D-S3 同规格）───

/** 机械并发上限：running 数 <4 时新 async spawn 立即启动，≥4 入队等待（用户 2026-09-02 拍板）。 */
export const ASYNC_SUBAGENT_LIMIT = 4

/** action:'check' 单回合最多读取次数（consult_check 同款防循环，评审 #1 补定义）。 */
export const MAX_ASYNC_CHECKS = 3

/**
 * §17 D-S3 shared injector: inject one settled async entry into the session as a
 * user-role reminder (XML-escaped — child reports may carry file/web content; >64K
 * offloaded with preview + path). Single shared form for ALL consumption points —
 * the turn-end collection (collectSettledAsync below), the run-start
 * history._pendingAsyncResults injection — plus the suspension-exit residual flush.
 * Consumed = the caller removes the entry from its container; no double inject.
 */
export async function injectAsyncResult(entry, { history, fullHistory, cwd }) {
  const body = entry.error != null
    ? `error: ${escapeXml(entry.error)}`
    : escapeXml(offloadToolResult(cwd, entry.report ?? ""))
  pushReal(history, fullHistory, {
    role: "user",
    content: `[System reminder: async subagent #${entry.id} (${entry.role}) finished]\n\n${body}`,
  })
}

/**
 * §17 D-S1 + §17.5 supersede turn-end async collection (lives here with the async
 * machinery; agent.mjs's finally calls it, 500-line split): two modes by caller
 * driver context (17.5.2/17.5.4 #2):
 * - suspDriven=false (fallback — headless/direct runAgent callers without a
 *   suspension driver): inject every entry that SETTLED during this run (shared
 *   injector form — XML-escaped, >64K offloaded) and remove it from the pool.
 *   Results never lost without a session.
 * - suspDriven=true (panel-chat drives suspensionSession after this run): NO
 *   direct inject — settled entries STAY pooled (settled not consumed) for the
 *   session's first sweepSettledToPending → digest turn (§17.5).
 * Running/queued STAY in both modes — no allSettled wait: the suspension session
 * digests them as they settle (D-S2/D-S9). Single ownership: entries settled
 * inside a suspension session were moved to history._pendingAsyncResults by the
 * settle callback, so this only sees non-suspended settles (no double inject —
 * D-S3 ①/②).
 */
export async function collectSettledAsync(agent, { history, fullHistory, cwd, suspDriven = false }) {
  const map = agent._asyncSubagents
  if (!map || map.size === 0) return
  if (suspDriven) return // §17.5: settled stays pooled — the suspension session digests it
  for (const e of [...map.values()]) {
    if (!e.done) continue // still running — stays in the pool (D-S1)
    await injectAsyncResult(e, { history, fullHistory, cwd })
    map.delete(e.id) // map keys are the spawn-time id (number — subagent-async.mjs async branch)
  }
}

/**
 * Allocate the next subagent id — monotonic ACROSS runAgent calls (advisor fix #1,
 * 2026-09-03): the agent object (and its _subIdCounter) is rebuilt per run, while the
 * async pool survives on history._asyncSubagents. Without the pool-max seed a later
 * run would REUSE a still-running entry's id — spawnAsyncSubagent's map.set(id, entry)
 * would overwrite the old entry: silent report loss (the replaced entry is never
 * collected by collectSettledAsync) and mis-addressed action:'check'/'status'.
 * Shared by the spawn path (subagent.mjs) and the escalate action (this module).
 */
export function nextSubagentId(parent) {
  let poolMax = 0
  const pool = parent._asyncSubagents
  if (pool && pool.size > 0) {
    for (const k of pool.keys()) {
      const n = typeof k === "number" ? k : Number.parseInt(k, 10)
      if (Number.isFinite(n) && n > poolMax) poolMax = n
    }
  }
  const next = Math.max(parent._subIdCounter ?? 0, poolMax) + 1
  parent._subIdCounter = next
  return next
}

/**
 * §19 action:'check' handler — the retired subagent_check semantics VERBATIM
 * (AGENT-LOOP.md §19 F3/T-M2..M4: arrival order / specified id / n counting /
 * MAX_ASYNC_CHECKS / consume-on-read). subagent.mjs execute dispatches here.
 * - n（必填）：1-based 递增读数——每回合首调 n=1，之后逐次 +1；乱序/重复 n 拒绝。
 * - 不带 id：按完成顺序（arrival order）返回下一个完成的 async 子代理——先完成先处理。
 * - 带 id：等该特定子代理（含 queued 项——先等它启动再等完成）。
 * - 全部已消费 → { done: true }（consult_check 同款终结语义）。
 * - 错误路径：未知/已消费 id → { id, status:"error", error:"unknown async subagent id: <id>" }。
 */
export async function subagentCheck({ id, n }, ctx) {
  const parent = ctx.agent
  const map = parent._asyncSubagents
  // advisor fix #3：容错数值字符串 id（schema 声明 number，但 provider 不强制——模型可能
  // 把工具返回的 id 原样以字符串回传）——数字键查找前归一化；错误消息回显原值。
  const idNum = typeof id === "string" && /^\d+$/.test(id) ? Number(id) : id
  // 未知/已消费 id 优先报错（评审 #5：即使注册表已空也要明确错误，不悬挂不误报 done）
  if (idNum != null && (!map || !map.has(idNum))) {
    return JSON.stringify({ id, status: "error", error: `unknown async subagent id: ${id}` })
  }
  if (!map || map.size === 0) return JSON.stringify({ done: true })
  if (typeof n !== "number" || !Number.isInteger(n) || n < 1) {
    return JSON.stringify({ status: "error", error: "invalid read counter — pass n = lastN+1" })
  }
  if (n > MAX_ASYNC_CHECKS) {
    return JSON.stringify({ status: "error", error: "check limit exceeded — use turn-end auto-wait for the rest" })
  }
  const lastN = parent._asyncCheckN ?? 0
  if (n !== lastN + 1) {
    return JSON.stringify({ status: "error", error: "invalid read counter — pass n = lastN+1" })
  }
  parent._asyncCheckN = n
  if (idNum != null) {
    const entry = map.get(idNum)
    if (!entry) return JSON.stringify({ id, status: "error", error: `unknown async subagent id: ${id}` })
    await entry.settled
    map.delete(idNum)
    if (entry.cancelled) return JSON.stringify({ id, status: "cancelled", note: "cancelled before completion" })
    return entry.error != null
      ? JSON.stringify({ id, status: "error", error: entry.error })
      : JSON.stringify({ id, role: entry.role, status: "done", report: entry.report })
  }
  const pending = [...map.values()]
  if (pending.length === 0) return JSON.stringify({ done: true })
  const entry = await Promise.race(pending.map((e) => e.settled))
  map.delete(entry.id)
  if (entry.cancelled) return JSON.stringify({ id: entry.id, status: "cancelled", note: "cancelled before completion" })
  return entry.error != null
    ? JSON.stringify({ id: entry.id, status: "error", error: entry.error })
    : JSON.stringify({ id: entry.id, role: entry.role, status: "done", report: entry.report })
}

/** Current 1-based queue position of a queued entry (map insertion order == FIFO queue order). */
function queuePosition(map, target) {
  let pos = 0
  for (const entry of map.values()) {
    if (entry.status !== "queued") continue
    pos++
    if (entry === target) return pos
  }
  return pos
}

/**
 * §19 action:'status' handler — NON-BLOCKING pool query（AGENT-LOOP.md §19 D-M2：
 * 立即返回、不消费、不动 _asyncCheckN——主回合查进度不挂的根治工具）。
 * 事实源 = 池（_asyncSubagents）：挂起期 settle 项已移 history._pendingAsyncResults
 * （§17 D-S3 ②——注入即消）不在池中——不计入概览，按 id 查为 unknown（与 check 同语义，
 * T12）。池内 done 条目 = 本回合内 settle 未取——带"未取"注记（check 取回或回合尾自动
 * 注入——措辞对齐 §17 D-S1）。不消费：status 后接 check 无 n 冲突（不动 lastN）。
 * advisor fix #2：queued position 查询时实时计算（entry.position 是入队瞬间快照——
 * settle 腾槽补位后变陈旧；FIFO 队列顺序 == map 插入顺序）。
 * §19.5 D-M5 status 全览增强（决定中止谁时看得清）：running 条目从裸 id 改结构化对象
 * { id, role, model, elapsedSec, turn, maxTurns }——elapsedSec 计算于查询时
 * （(now - entry.startedAt)/1000——startedAt 记于实际启动时刻）；queued 条目补 role；
 * done 条目 { id, role }。单查（id）形态不变 + running 同字段。
 * 返回形态（JSON 字符串——工具结果契约）：
 * - 不带 id → { overview: { running: [{id, role, model, elapsedSec, turn, maxTurns}],
 *   queued: [{id, role, position}], done: [{id, role}] } }
 * - 带 id   → { id, role, status: "running"|"queued"|"done", position?/note?, model?/elapsedSec?/turn?/maxTurns? }
 * - 未知 id → { id, status: "error", error: "unknown async subagent id: <id>" }（与 check 同）
 */
function statusEntryFields(entry, map) {
  // §17.5: a driven turn end leaves the entry pooled → the suspension digest consumes it
  if (entry.done) return { id: entry.id, role: entry.role, status: "done", note: "settled this turn — unconsumed; fetch with action:'check' or the suspension digest injects it" }
  if (entry.status === "queued") return { id: entry.id, role: entry.role, status: "queued", position: queuePosition(map, entry) }
  return {
    id: entry.id, role: entry.role, status: "running",
    model: entry.model ?? null,
    elapsedSec: entry.startedAt ? Math.max(0, Math.round((Date.now() - entry.startedAt) / 1000)) : null,
    turn: entry.turn ?? 0,
    maxTurns: entry.maxTurns ?? 100,
  }
}
export function subagentStatus({ id }, ctx) {
  const map = ctx.agent._asyncSubagents
  const idNum = typeof id === "string" && /^\d+$/.test(id) ? Number(id) : id // advisor fix #3（同 check）
  if (idNum != null) {
    if (!map || !map.has(idNum)) {
      return JSON.stringify({ id, status: "error", error: `unknown async subagent id: ${id}` })
    }
    return JSON.stringify(statusEntryFields(map.get(idNum), map))
  }
  const overview = { running: [], queued: [], done: [] }
  for (const entry of map?.values() ?? []) {
    if (entry.done) overview.done.push({ id: entry.id, role: entry.role })
    else if (entry.status === "queued") overview.queued.push({ id: entry.id, role: entry.role, position: queuePosition(map, entry) })
    else overview.running.push(statusEntryFields(entry, map))
  }
  return JSON.stringify({ overview })
}

// ─── §19.5 cancel 动作（AGENT-LOOP.md §19.5 D-M6——定向中止 + 控制面）───

/** §19.5 模型可见取消提醒（D-M6 round2 #3——形态仿 injectAsyncResult：短 user-role
 *  提醒、XML 转义；cancelled settle 不入 pending/不直注入（无错误报告）——取消事实与
 *  半成品警示靠这条注入对模型可见）。注入点 = 机读线（模型通道）；人读线由 UI 冻结相位
 *  （区块 stopped + 面板行）承载。 */
function injectCancelReminder(parent, entry, wasQueued) {
  if (!parent?.history) return
  const body = wasQueued
    ? `[System reminder: subagent ${entry.role}#${entry.id} cancelled by user (was queued — never started)]`
    : `[System reminder: subagent ${entry.role}#${entry.id} cancelled by user — partial changes not merged/audited]`
  parent.history.push({ role: "user", content: escapeXml(body) })
}

/**
 * §19.5 action:'cancel' handler + UI ⏹ 共用核心（D-M6）——定向中止单个后台 async 子代理：
 * - id 必填（防误全停——省略/未知/已完成 → error JSON——全停走 Ctrl+C / Stop）；
 * - queued 目标（未启动——无 abort）：**出队移除 + position 释放**（queuePosition 实时
 *   计算——后续条目自动前移）+ 返回 {id, status:"cancelled", was:"queued"}——无 abort；
 * - running 目标：置 entry.cancelled + abort 条目级 controller（entry.controller——
 *   round2 #2 定稿）→ 子代理 runAgent signal → settle 回调的 cancelled 分支完成出池
 *   清理 + 停止冻结通知（_onCancelled）+ 槽位补位（settle 公共段——T-M21）——其余
 *   子代理/挂起会话不受影响（只动本条目）；
 * - 取消事实 + 半成品警示 = 机读线 user-role 提醒注入（injectCancelReminder——模型可见）。
 * 调用面：subagent.mjs execute（action:"cancel"——ctx.agent 即 parent）与 extension 层
 * UI ⏹ 路由（panel-messages.mjs——以 live lines 的池 map + history 构造 parent）。
 */
export function cancelSubagent(parent, id) {
  const map = parent._asyncSubagents
  const idNum = typeof id === "string" && /^\d+$/.test(id) ? Number(id) : id // advisor fix #3（同 check/status）
  if (idNum == null) {
    return JSON.stringify({ status: "error", error: "cancel requires an id — pass the target subagent's id (no id = no-op; Ctrl+C / the Stop button stop everything)" })
  }
  if (!map || !map.has(idNum)) {
    return JSON.stringify({ id, status: "error", error: `unknown async subagent id: ${id}` })
  }
  const entry = map.get(idNum)
  if (entry.done) {
    return JSON.stringify({ id, status: "error", error: `async subagent id ${id} has already finished — nothing to cancel; fetch its report with action:'check'` })
  }
  if (entry.status === "queued") {
    entry.cancelled = true
    map.delete(idNum)
    injectCancelReminder(parent, entry, true)
    entry._resolve?.(entry) // 释放可能的并发等待者（check 挂起——不悬挂）
    entry._onCancelled?.()
    return JSON.stringify({ id, status: "cancelled", was: "queued" })
  }
  // running 目标：幂等（审计 F2——settle 前重复 cancel/UI ⏹ 双击不重复注入提醒——
  // abort 本身幂等——二次取消仅返回确认）。
  if (!entry.cancelled) {
    entry.cancelled = true
    entry.controller?.abort()
    injectCancelReminder(parent, entry, false)
  }
  return JSON.stringify({ id, status: "cancelled" })
}

/**
 * §19.5 action:'cancel' execute 分支——depth-0 only（子代理上下文无 async 池——
 * cancel 无意义；受限 eng-coder 变体已被 §19 的 spawn-only 门先行拒绝）。
 */
export function cancelSubagentAction({ id }, ctx) {
  if ((ctx.depth ?? 0) > 0) {
    return JSON.stringify({ status: "error", error: "cancel is only available at the top level — subagent contexts have no async pool (AGENT-LOOP.md §19.5 D-M6)" })
  }
  return cancelSubagent(ctx.agent, id)
}

/**
 * Merge a child's mutations into the parent's bookkeeping
 * (CLI mergeChildMutations parity): the parent's advisor/verify guards must see
 * delegated file changes. Fresh code → fresh convergence budget: a verify/advisor
 * pass earned on the pre-delegation code is stale the moment the child writes.
 * Shared by the eng-coder spawn merge (subagent.mjs runChild) and the escalate
 * engine (subagent-escalate.mjs) — three-way review 2026-08-16: escalate's local
 * copy skipped the resets, letting surgery bypass the parent's verify/advisor
 * gates. Defined here so subagent.mjs re-exports it (no consumer changed) and
 * subagent-escalate.mjs imports it one-way (module graph cycle-free).
 * §19.5 (AGENT-LOOP.md D-M6 round2 #3): the CANCEL path never reaches this
 * function — runChild checks entry.cancelled BEFORE merging (partial changes are
 * NOT merged into the parent guards; the cancel reminder says so).
 */
export function mergeChildMutations(parent, sink) {
  const touched = sink?.touchedFiles ?? []
  if (touched.length === 0) return
  parent._mutatedThisRun = true
  for (const abs of touched) {
    if (!parent._touchedFiles.includes(abs)) parent._touchedFiles.push(abs)
  }
  if (parent._calledAdvisorThisRun) parent._calledAdvisorThisRun = false
  if (parent._verifiedThisRun) {
    parent._verifiedThisRun = false
    parent._verifyPassed = undefined
  }
  parent._advisorRound = 0
  parent._advisorSession = null
}
