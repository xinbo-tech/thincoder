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
 * §19.5.6 (AGENT-LOOP.md §19.5.6, 2026-09-04): status touched-files summary — running
 * entries carry touchedFiles (≤5 相对路径 + touchedMore 超出计数) / touched 占位
 * （0 改动）; queued → touched "—（未启动）"; done/error/取消无摘要。数据源 =
 * entry.childAgent._touchedFiles（对象引用——D-SF1——非数组引用——resume 重建不陈旧）。
 * mergeChildMutations lives here (subagent.mjs re-exports it — no consumer
 * changed) — shared by the eng-coder spawn merge and the escalate engine.
 */
import { escapeXml, offloadToolResult, pushReal } from "../agent/run-helpers.mjs"
import { logEvent, errText } from "../log.mjs"
import { resolve, relative, isAbsolute } from "node:path"

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
 * A2 helper (AGENT-LOOP.md §18.7 D-TS5): mechanical summary of the parent spawn
 * task book — keep ONLY the audit-relevant sections (docs involved / affected
 * file list / acceptance criteria), each VERBATIM, and drop the verbose
 * background/context sections (the auditor reads the design documents itself —
 * they remain reachable via read/glob/grep). Sections are delimited by the
 * `## ` headings of the METHODOLOGY Implementation Handoff structure
 * (涉及文档 / 文件清单 / 验收标准 or their English equivalents). Conservative
 * fallback: when the section markers do not resolve, return the task book
 * VERBATIM — never lose information an auditor may need. Independence is
 * unchanged: still built from _engTaskInput (not the eng-coder's self-report).
 */
function summarizeEngTaskInput(taskInput) {
  if (!taskInput) return "(unavailable)"
  const headingRe = /^##[ \t]+(.+)$/gm
  const keepRe = /涉及文档|Docs involved|文件清单|file list|受影响文件|验收标准|acceptance/i
  const heads = [...taskInput.matchAll(headingRe)]
  if (heads.length === 0) return taskInput
  const kept = []
  for (let i = 0; i < heads.length; i++) {
    const start = heads[i].index
    const end = i + 1 < heads.length ? heads[i + 1].index : taskInput.length
    if (keepRe.test(heads[i][1])) kept.push(taskInput.slice(start, end))
  }
  // <2 kept sections → a wrong summary is worse than the verbatim task book.
  if (kept.length < 2) return taskInput
  return kept.join("\n").trim()
}

/**
 * §18 D-E2 ③ (round4 #4, T-E13/T-E15): an eng-coder audit spawn's task book is
 * appended MECHANICALLY — the eng-coder's OWN spawn task (docs involved /
 * acceptance criteria / file list, kept verbatim as agent._engTaskInput by its
 * parent spawn) ∪ the mechanically tracked _touchedFiles — NEVER a self-written
 * list (a self-report could omit exactly the out-of-scope file the audit must
 * catch). Caller: subagent.mjs execute — builds the child input of an eng-coder
 * audit (explore) spawn; plain `task` outside an audit context (attempt === null).
 * §18.5 D-AG3 (2026-09-04): the audit block also carries the ZERO-GIT scope
 * authority declaration — _touchedFiles is the audit scope, this task receives
 * no git context, and workspace changes outside _touchedFiles are unrelated
 * (never an out-of-file-list ground).
 * §18.7 R2 (2026-09-04) — audit task book templates, D-TS4/5/6:
 *   A1 — audit instruction template at the TOP of the block (the four
 *     divergence categories, scope restriction — same-source with the zero-git
 *     authority below, not duplicated — and the finding-row checklist format).
 *   A2 — the parent task book is a mechanical SUMMARY (summarizeEngTaskInput
 *     above) instead of the full verbatim dump: doc-paths + file list +
 *     acceptance criteria verbatim; verbose context dropped.
 *   A3 — audit report format template at the END (three states; the clean
 *     state is the verbatim phrase "四类偏差均未发现"; divergent rows are
 *     fieldized: | 类别 | 文件:行 | 设计引用 | 严重级 | 证据 |).
 */
export function auditTaskBook(task, agent, engAuditAttempt) {
  let childInput = task
  if (engAuditAttempt !== null) {
    const touched = (agent._touchedFiles ?? []).map((f) => `- ${f}`).join("\n") || "- (none yet)"
    const summary = summarizeEngTaskInput(agent._engTaskInput)
    childInput += "\n\n[Audit scope — mechanical context, independent of the eng-coder's self-report:]\n" +
      // A1 — audit instruction template (D-TS4).
      "AUDIT INSTRUCTIONS (AGENT-LOOP.md §18.7 D-TS4) — check the delivery for EXACTLY these four divergence categories:\n" +
      "  1. Partial implementation — an acceptance criterion implemented partially or not at all.\n" +
      "  2. Silent simplification — a 'simpler approximation' of a behavior the design specifies IS a deviation.\n" +
      "  3. Doc drift — a diff that adds/renames/deletes files must update the design doc's module map / affected-files table (the delivery itself NEVER edits design docs — real drift goes into the delivery report).\n" +
      "  4. Out-of-file-list changes — any file touched outside the approved file list below.\n" +
      "SCOPE RESTRICTION: audit ONLY the files confirmed by the parent task book (below) and the _touchedFiles mechanical union — workspace changes NOT listed there are unrelated to this delivery and are NOT grounds for an out-of-file-list finding (zero-git authority below — D-AG3, same source).\n" +
      "EVERY finding row MUST carry: file:line + design reference + severity + evidence (quote exactly what read/glob/grep returned from the CURRENT disk state).\n" +
      // A2 — parent spawn task book, mechanical summary (D-TS5).
      `Parent spawn task book — mechanical summary (docs involved / file list / acceptance criteria, verbatim):\n${summary}\n` +
      `Files actually touched by the eng-coder (mechanical union — audit these against the file list):\n${touched}\n` +
      // §18.5 D-AG3 → the scope authority declaration (also A1's pointer).
      "Zero-git scope authority (§18.5 D-AG3): this audit task receives NO git context — nothing is injected. " +
      "The evidence base is the design documents, the current disk state (read/glob/grep), and the _touchedFiles list above. " +
      "Workspace changes NOT listed in _touchedFiles are unrelated to this delivery — they are NOT grounds for an out-of-file-list finding." +
      // A3 — audit report format template (D-TS6).
      "\n\nAUDIT REPORT FORMAT (AGENT-LOOP.md §18.7 D-TS6) — end your report with EXACTLY one of these states:\n" +
      "- CLEAN: no divergence found — state it verbatim: '四类偏差均未发现'.\n" +
      "- DIVERGENT: findings table, one row per finding: | 类别 | 文件:行 | 设计引用 | 严重级 | 证据 | (类别 = partial implementation / silent simplification / doc drift / out-of-file-list; 严重级 = 🔴 / 🟡 / 🔵; 证据 quotes file:line: content from the current disk state).\n" +
      "- QUESTION: items needing the parent's judgment that are NOT divergence — list them separately."
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
export function spawnAsyncSubagent({ parent, ctx, subId, role, provider, childSignal, runChild, files, dependsOn }) {
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
    // §19.5.6 D-SF1：子代理**对象**引用（非 _touchedFiles 数组引用——per-run 数组在
    // resume 重跑时重建——数组引用会陈旧）；对象在 runAgent setup 后经 onAgentTurn
    // 绑定（subagent.mjs——绑定时刻等价 entry.start 后的第一拍——queued 无对象=未启动）。
    childAgent: null,
    // §19.5 D-M6: 条目级 AbortController + cancelled 标记 + 停止冻结通知器。
    cancelled: false,
    controller: null,
    _onCancelled: null,
  }
  entry.settled = new Promise((res) => { entry._resolve = res })
  // §20 D-SD2 域元数据（AGENT-LOOP.md §20——running ∪ queued 全带）：_files（归一化
  // 绝对路径）/ _dependsOn（依赖 id）——冲突检测与补位判据事实源；无调度参数皆空。
  entry._files = Array.isArray(files) ? files : []
  entry._dependsOn = Array.isArray(dependsOn) ? dependsOn : []
  // §20 D-SD3b 排队行通知器（webview 行通道——CLI ⟦ev⟧queued 的 VS Code 等价）+ AUTO
  // 活读（ctx.getAuto——execute-tools 注入的 live autoApprove getter——settle 无 ctx 路径
  // 经此取每条目 spawn 时刻的 AUTO 语义）。
  entry._queueNotify = (payload) => ctx.callbacks?.onSubagent?.(payload)
  entry._auto = () => ctx.getAuto?.() ?? false
  // §20 D-SD3 准入落点：等待态（依赖未满足/域冲突/depc——准入在 subagent.mjs execute
  // 判过——此处以真实 entry 复算——同步段内池态不变）→ 强制 queued（不占槽——即使槽
  // 空也不启动——补位扫描放行）；纯 slot（可启动）→ 既有槽位检查。
  const auto = entry._auto()
  const blk = entry._files.length > 0 || entry._dependsOn.length > 0
    ? describeBlockers(parent, entry, auto)
    : { kind: "slot", detail: "" }
  entry._waitKind = blk.kind === "slot" ? null : blk.kind
  entry._waitReason = blk.detail
  // Per-entry controller chained to the shared child signal（D-M6 round2 #2 定稿——
  // session/回合 abort 逐链传播保 Ctrl+C 全停；cancel 只 abort 本条目的 controller）。
  entry.controller = new AbortController()
  if (childSignal?.aborted) entry.controller.abort()
  else childSignal?.addEventListener?.("abort", () => entry.controller.abort(), { once: true })
  // 停止冻结通知：cancelled settle（或 queued 取消）时发给 spawn 上下文（webview 行 +
  // 区块 stopped 冻结相位——不经当前调用者——挂起期 UI ⏹ 直连路径同样靠它渲染）。
  // §20：was:"queued" 由调用点传（queued 取消 = 移除行；running 取消 = stopped 冻结）。
  entry._onCancelled = (wasQueued) => ctx.callbacks?.onSubagent?.({ id: entry.id, role: entry.role, status: "cancelled", ...(wasQueued ? { was: "queued" } : {}) })
  entry.start = () => {
    entry.status = "running"
    entry.startedAt = Date.now()
    // §20：启动即清除等待标注（行刷新/状态派生单点）——排队等待不计 elapsed 已由
    // startedAt 语义覆盖；行由 started 消息覆盖为 running。
    entry._waitKind = null
    entry._waitReason = null
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
  if (entry._waitKind == null && runningCount < ASYNC_SUBAGENT_LIMIT) {
    entry.start()
    // LOGGING（LOGGING.md——CLI parity）：child:spawn async（立即启动）
    logEvent("child:spawn", { role, id: `${role}#${id}`, kind: "async", status: "running" })
    return JSON.stringify({ id, role, status: "running" })
  }
  // 队列序 = Map 插入序（queued 过滤计数——queuePosition 先例）；等待态条目即使槽空
  // 也在此排队（_waitKind 非空——启动权交补位扫描）。
  entry.position = [...parent._asyncSubagents.values()].filter((x) => x.status === "queued").length
  // §20 D-SD3b：排队 spawn 返回即发 queued 行通知（webview 等位标注——不等启动）；
  // 位置/等待态后续变化经 refreshQueuedRows 刷新（去重 sig）。
  refreshQueuedRows(parent)
  // LOGGING（LOGGING.md——CLI parity）：child:spawn async（排队——启动由补位触发）
  logEvent("child:spawn", { role, id: `${role}#${id}`, kind: "async", status: "queued" })
  const out = { id, role, status: "queued", position: entry.position }
  if (entry._waitKind != null) {
    out.waiting = entry._waitKind === "depc" ? "dependency-cancelled" : "waiting-deps"
    out.reason = entry._waitReason
  }
  return JSON.stringify(out)
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
  // §20（CLI parity——D-A1 上限口径 "running 数 = 已完成未消费不计入"）：settle 即翻
  // status（既有代码只置 done——status 滞留 running 会把补位/准入的 running 计数与
  // 域冲突集算错——settle 后该条目不再占槽、不再持文件域）。
  entry.status = "done"
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
  // §20 D-SD5：running 依赖取消的 settle 终态点——写终态墓碑（cancelled——依赖者经
  // 它查得取消分支）；依赖者标注/行刷新在 refillPool 段（depc 锁——非 AUTO 不自动启动）。
  if (entry.cancelled) {
    parent.history?._asyncSubagents?.delete(entry.id)
    parent._asyncSubagents?.delete(entry.id) // map keys are the spawn-time id (number)
    writeTombstone(parent, entry.id, "cancelled", entry.role)
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
  // §20 D-SD4 释放点：settle（任何终态——成功/取消/失败）腾槽 + 依赖终态转移 → 最早
  // 可启动补位（waiting 越行不阻塞槽位；多任务同解除按队列序启动到槽满 ≤4）→ 排队行
  // 刷新（等待态标注随依赖终态更新——depc/位置前移）。AUTO 活读按条目 spawn 上下文。
  refillPool(parent, (e) => e._auto?.() ?? false)
  refreshQueuedRows(parent)
  notifySettle?.()
}

// ═══════════════════════════════════════════════════════════════════════════
// §20 子 agent 任务调度器（AGENT-LOOP.md §20 D-SD1..SD5 + 20.4——CLI 同规格镜像）
// ═══════════════════════════════════════════════════════════════════════════
// VS Code 结构差异：池 = history 载体（agent.mjs :115 重建绑定 + :497 回写）——墓碑与
// 域元数据沿 history 存活（parent.history?._asyncTombstones——agent.mjs 重建不丢）；
// 无独立 _asyncQueue——队列序 = 池 Map 插入序（queued 过滤——queuePosition 先例）；
// AUTO 档 = ctx.getAuto 活读（无 autoApprove 字段——execute-tools 注入 live getter——
// 条目 _auto 绑定 spawn 上下文，settle 无 ctx 路径照读）。等待态派生不存储（单点事实）。

/** 池 Map（history 载体优先——跨 runAgent 存活；直接 execute ctx 回落 agent 字段）。 */
export function poolMap(parent) {
  return parent.history?._asyncSubagents instanceof Map
    ? parent.history._asyncSubagents
    : (parent._asyncSubagents ?? new Map())
}

/** 终态墓碑 Map（round1 #8/T-SD14——consumed 视为满足；cancelled/failed 走 D-SD5 分支）。 */
function tombMap(parent, create = false) {
  const holder = parent.history ?? parent
  if (!(holder._asyncTombstones instanceof Map)) {
    if (!create) return new Map()
    holder._asyncTombstones = new Map()
  }
  return holder._asyncTombstones
}

/** 写终态墓碑（holder = 拥有载体的对象——history 数组或 agent——跨 runAgent 存活）。 */
function writeTombstoneTo(holder, id, status, role) {
  if (!holder) return
  if (!(holder._asyncTombstones instanceof Map)) holder._asyncTombstones = new Map()
  holder._asyncTombstones.set(idNum(id), { status, role })
}

/** 写终态墓碑（parent 形态——history 载体优先）。 */
function writeTombstone(parent, id, status, role) {
  writeTombstoneTo(parent.history ?? parent, id, status, role)
}

/** 文件域归一化（round1 #5——相对 cwd 解析绝对 + 去重——冲突比较键 win32 小写）。 */
export function normalizeFileList(files, cwd) {
  const out = []
  for (const f of Array.isArray(files) ? files : []) {
    if (typeof f !== "string" || !f.trim()) continue
    const abs = resolve(cwd ?? process.cwd(), f)
    if (!out.includes(abs)) out.push(abs)
  }
  return out
}

const fileKey = (p) => (process.platform === "win32" ? p.toLowerCase() : p)

/** 两文件域首个共同文件（比较键）——无交集 null。 */
export function filesOverlap(a, b) {
  if (!a?.length || !b?.length) return null
  const keys = new Set(b.map(fileKey))
  return a.map(fileKey).find((k) => keys.has(k)) ?? null
}

function showFile(parent, key) {
  const cwd = parent.cwd ?? process.cwd()
  const rel = relative(cwd, key)
  return rel && !rel.startsWith("..") && !isAbsolute(rel) ? rel : key
}

/** 数字 id 归一（池 map keys 数字——spawn 返回/模型回传可能字符串——advisor fix #3 先例）。 */
const idNum = (id) => (typeof id === "string" && /^\d+$/.test(id) ? Number(id) : id)

/**
 * §20 依赖终态查询（单点事实——池条目 / pending（挂起期 settle 移交——注入前）/
 * 终态墓碑（check/注入消费——consumed；取消/失败——D-SD5 分支））：
 * ok（settle 成功/consumed——T-SD14 视为满足）/ pending（等启动/完成）/
 * failed|cancelled（依赖取消失败——depc 分支）/ unknown（从未存在——spawn 明确错误）。
 */
export function depInfo(parent, id) {
  const key = idNum(id)
  const e = poolMap(parent).get(key)
  if (e) {
    if (e.cancelled) return { state: "cancelled", role: e.role }
    if (e.done) return e.error != null ? { state: "failed", role: e.role } : { state: "ok", role: e.role }
    return { state: "pending", role: e.role }
  }
  const pend = (parent.history?._pendingAsyncResults ?? parent._pendingAsyncResults ?? []).find((x) => String(x.id) === String(key))
  if (pend) return pend.error != null ? { state: "failed", role: pend.role } : { state: "ok", role: pend.role }
  const t = tombMap(parent).get(key)
  if (t) return { state: t.status === "cancelled" || t.status === "failed" ? t.status : "ok", role: t.role }
  return { state: "unknown", role: null }
}

/** §20 等待态派生（kind slot/wait/depc——detail 共享文本——行/status/spawn 返回同源）。
 *  AUTO（auto=true）depc 视为可启动（D-SD5——round2 #3——仅 AUTO/父显式处置才启动）。 */
export function describeBlockers(parent, entry, auto = false) {
  const wait = []
  const depc = []
  for (const depId of entry._dependsOn ?? []) {
    const info = depInfo(parent, depId)
    if (info.state === "pending" || info.state === "unknown") {
      wait.push(`${info.role ?? "sub"}#${depId}（依赖未完成）`)
    } else if (info.state === "cancelled" || info.state === "failed") {
      if (auto) continue
      depc.push(`${info.role ?? "sub"}#${depId}`)
    }
  }
  const myFiles = entry._files ?? []
  if (myFiles.length > 0) {
    for (const e of poolMap(parent).values()) {
      if (e === entry) continue
      if (e.status !== "running" && e.status !== "queued") continue
      const hit = filesOverlap(myFiles, e._files ?? [])
      if (!hit) continue
      wait.push(`${e.role}#${e.id}（域冲突 ${showFile(parent, hit)}）`)
    }
  }
  const cut = (arr) => (arr.length > 3 ? [...arr.slice(0, 3), `…（共 ${arr.length} 项）`] : arr)
  if (depc.length > 0) {
    const body = cut(depc).join("、")
    return { kind: "depc", detail: wait.length > 0 ? `dependency cancelled: ${body}；${cut(wait).join("、")}` : `dependency cancelled: ${body} — waiting for your decision (cancel this task to release, or AUTO starts it)` }
  }
  if (wait.length > 0) return { kind: "wait", detail: `waiting for: ${cut(wait).join("、")}` }
  return { kind: "slot", detail: "" }
}

/** §20 D-SD4 补位判据：依赖全满足（AUTO depc 放行）+ 域无冲突（running ∪ queued
 *  self-excl——队列序保同文件串行：先入者启动后以 running 身份继续挡后入者）。 */
export function queueRunnable(parent, entry, auto = false) {
  for (const depId of entry._dependsOn ?? []) {
    const state = depInfo(parent, depId).state
    if (state === "pending" || state === "unknown") return false
    if ((state === "cancelled" || state === "failed") && !auto) return false
  }
  const myFiles = entry._files ?? []
  if (myFiles.length > 0) {
    for (const e of poolMap(parent).values()) {
      if (e === entry) continue
      if (e.status !== "running" && e.status !== "queued") continue
      if (filesOverlap(myFiles, e._files ?? [])) return false
    }
  }
  return true
}

/** 补位扫描（settle/cancel 释放点共用）：最早可启动（依赖全满足 + 域无冲突）→ 启动到
 *  槽满 ≤4——纯 slot 队列与旧队首语义等价（全部可启动 → 最早 == 队首）。条目留池
 *  （status → running——queued 过滤自然出列）；autoFor：条目级 AUTO 活读器。 */
function refillPool(parent, autoFor = null) {
  const map = poolMap(parent)
  for (;;) {
    const running = [...map.values()].filter((x) => x.status === "running").length
    if (running >= ASYNC_SUBAGENT_LIMIT) return
    let pick = null
    for (const e of map.values()) {
      if (e.status !== "queued") continue
      if (queueRunnable(parent, e, autoFor?.(e) ?? false)) { pick = e; break }
    }
    if (!pick) return
    pick.start()
  }
}

/** §20 D-SD3b 排队行刷新（webview 行通道——CLI ⟦ev⟧queued 等价）：全 queued 条目重算
 *  等待态 + 位置（Map 序——cancel 出列自然前移）——sig 变化才发（去重）。调用点 = 一切
 *  队列突变与等待态变迁（入队/settle 后补位与依赖转移/cancel 出队/check 消费）。 */
export function refreshQueuedRows(parent) {
  const map = poolMap(parent)
  let pos = 0
  for (const e of map.values()) {
    if (e.status !== "queued") continue
    pos++
    const blk = describeBlockers(parent, e, e._auto?.() ?? false)
    const sig = `${blk.kind}\x1e${pos}\x1e${blk.detail}`
    if (e._lastQueuedSig === sig) continue
    e._lastQueuedSig = sig
    const payload = { id: e.id, role: e.role, status: "queued", position: pos }
    if (blk.kind !== "slot") {
      payload.waiting = blk.kind === "depc" ? "dependency-cancelled" : "waiting-deps"
      payload.reason = blk.detail
    }
    e._queueNotify?.(payload)
  }
}

/** 依赖某 id 的 queued 条目标签（D-SD5 提醒/工具结果注记——依赖者列表）。 */
export function dependentLabels(parent, depId) {
  const key = String(depId)
  const out = []
  for (const e of poolMap(parent).values()) {
    if (e.status !== "queued") continue
    if ((e._dependsOn ?? []).some((d) => String(d) === key)) out.push(`${e.role}#${e.id}`)
  }
  return out
}

/** §20 D-SD5 环防御（round2 #5——自然流程不可达（unknown id 拒 + spawn 序天然无环）——
 *  人工注入可达环拒——防御断言——T-SD5）：从新 spawn 依赖集沿池内条目 _dependsOn 边
 *  做路径 DFS——路径重复访问（可达环）→ 明确错误。 */
export function assertNoDepCycle(parent, dependsOn) {
  const edges = new Map()
  for (const e of poolMap(parent).values()) {
    if (e.status === "running" || e.status === "queued") {
      edges.set(String(e.id), (e._dependsOn ?? []).map(String))
    }
  }
  const onPath = new Set()
  const visit = (id) => {
    if (onPath.has(id)) {
      throw new Error(`subagent dependsOn cycle detected: ${[...onPath, id].join(" → ")} — entries in a dependency loop can never start; cancel the dependents and restructure the chain (AGENT-LOOP.md §20 D-SD5)`)
    }
    onPath.add(id)
    for (const dep of edges.get(id) ?? []) visit(dep)
    onPath.delete(id)
  }
  for (const d of dependsOn) visit(String(idNum(d)))
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
  // §20 D-SD5 终态墓碑：注入即消费（调用方随即从容器移除）——dependsOn 引用该 id 的
  // 后续 spawn 视为已满足（T-SD14 同 check 消费语义；error 条目记 failed——依赖取消/
  // 失败分支照旧，不误标成功）。墓碑沿 history 载体（跨 runAgent 存活）。
  writeTombstoneTo(history, entry.id, entry.error != null ? "failed" : "consumed", entry.role)
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
    // §20 depc 锁守卫（advisor code review 🟡——CLI 同款）：queued 且不可启动（depc
    // 锁定，或池内无 running = 无未来 settle/refill 事件 = 永不启动）→ 不阻塞（check
    // 同步工具调用——防模型回合无界悬挂）——立即返回 queued+原因（cancel 处置引导）。
    if (!entry.cancelled && entry.status === "queued") {
      const blk = describeBlockers(parent, entry, entry._auto?.() ?? false)
      if (blk.kind === "depc") {
        return JSON.stringify({
          id, status: "queued", waiting: "dependency-cancelled", reason: blk.detail,
          note: "check would block forever — this task is locked by a cancelled/failed dependency and will not start on its own; cancel it (action:'cancel') or run an AUTO session to release it (AGENT-LOOP.md §20 round2 #3)",
        })
      }
      if (![...map.values()].some((e) => e.status === "running")) {
        const out = { id, status: "queued", position: queuePosition(map, entry) }
        if (blk.detail) out.reason = blk.detail
        out.note = "check would block indefinitely — this queued task cannot start while the pool has no running task (starts are settle-driven); cancel it (action:'cancel') or make pool progress (AUTO session starts it on the next settle/refill)"
        return JSON.stringify(out)
      }
    }
    await entry.settled
    map.delete(idNum)
    // §20（advisor code review 🟡——CLI 同款）：check 消费与挂起期 settle 竞态——消费时
    // 若条目已被挂起分支移交 pending，反向清除（两消费点互斥——防 digest 下轮重复注入）。
    purgePending(parent, entry)
    // §20 D-SD5 终态墓碑（T-SD14）：消费即终态——dependsOn 引用该 id 的条目视其终态
    // 满足/标注（consumed = 已满足；failed/cancelled = 依赖取消/失败分支）。写于终态
    // 判定后——取消条目不误记 consumed（其墓碑已在 cancel 点写）。
    if (!entry.cancelled) writeTombstone(parent, idNum, entry.error != null ? "failed" : "consumed", entry.role)
    if (entry.cancelled) return JSON.stringify({ id, status: "cancelled", note: "cancelled before completion" })
    return entry.error != null
      ? JSON.stringify({ id, status: "error", error: entry.error })
      : JSON.stringify({ id, role: entry.role, status: "done", report: entry.report })
  }
  const pending = [...map.values()]
  if (pending.length === 0) return JSON.stringify({ done: true })
  // §20 守卫（arrival-order）：无 running **且无 done**（done 条目经已 resolve 的 settled
  // 立即被下方 race 消费——不在此列）且仍有条目 → 全为 queued 且永不启动（refill 由
  // settle 驱动——无 running = 无 settle）→ 明确错误。
  if (!pending.some((e) => e.status === "running" || e.done)) {
    const stuck = pending
      .map((e) => `${e.role}#${e.id}（${describeBlockers(parent, e, e._auto?.() ?? false).kind === "depc" ? "dependency-cancelled" : "blocked"}）`)
      .join(", ")
    return JSON.stringify({
      status: "error",
      error: `nothing will settle — the pool holds only queued task(s) that cannot start without a running task: ${stuck}; cancel them (action:'cancel') or make pool progress (AUTO session starts them on the next settle/refill)`,
    })
  }
  const entry = await Promise.race(pending.map((e) => e.settled))
  map.delete(entry.id)
  purgePending(parent, entry)
  if (!entry.cancelled) writeTombstone(parent, entry.id, entry.error != null ? "failed" : "consumed", entry.role)
  if (entry.cancelled) return JSON.stringify({ id: entry.id, status: "cancelled", note: "cancelled before completion" })
  return entry.error != null
    ? JSON.stringify({ id: entry.id, status: "error", error: entry.error })
    : JSON.stringify({ id: entry.id, role: entry.role, status: "done", report: entry.report })
}

/** §20 消费点 pending 反向清除（check 消费 × 挂起移交竞态守卫——两消费点互斥）。 */
function purgePending(parent, entry) {
  const pend = parent.history?._pendingAsyncResults ?? parent._pendingAsyncResults
  if (!Array.isArray(pend)) return
  const i = pend.findIndex((x) => String(x.id) === String(entry.id))
  if (i >= 0) pend.splice(i, 1)
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
 * - 不带 id → { overview: { running: [{id, role, model, elapsedSec, turn, maxTurns, touchedFiles?/touched?}],
 *   queued: [{id, role, position, touched}], done: [{id, role}] } }
 * - 带 id   → { id, role, status: "running"|"queued"|"done", position?/note?, model?/elapsedSec?/turn?/maxTurns?, touchedFiles?/touchedMore?/touched? }
 * - 未知 id → { id, status: "error", error: "unknown async subagent id: <id>" }（与 check 同）
 * §19.5.6 D-SF2 (T-SF——CLI 同语义参考): running 条目带 touched files 摘要——有改动 =
 * touchedFiles（前 5 相对路径）+ touchedMore（仅 >5 时——超出计数）；0 改动 =
 * touched:"—（尚无改动）"（T-SF2a 区分占位）；queued = touched:"—（未启动）"（T-SF2b）；
 * done/error/取消不含摘要（D-SF2 明示本批只做 running/queued）。数据源 =
 * entry.childAgent._touchedFiles（对象引用实时读——D-SF1——绝对路径，查询方 cwd 相对化）。
 */
function statusEntryFields(entry, map, parent, cwd) {
  // §17.5: a driven turn end leaves the entry pooled → the suspension digest consumes it
  if (entry.done) return { id: entry.id, role: entry.role, status: "done", note: "settled this turn — unconsumed; fetch with action:'check' or the suspension digest injects it" }
  if (entry.status === "queued") {
    // §20 F-SD4/D-SD3b：queued 条目带 waiting/reason（依赖/冲突原因模型可见——纯槽满
    // 等位不带——position 已足够）；AUTO 档活读条目 spawn 上下文。
    const blk = describeBlockers(parent, entry, entry._auto?.() ?? false)
    const out = { id: entry.id, role: entry.role, status: "queued", position: queuePosition(map, entry) }
    if (blk.kind !== "slot") {
      out.waiting = blk.kind === "depc" ? "dependency-cancelled" : "waiting-deps"
      out.reason = blk.detail
    }
    // §19.5.6 T-SF2b：未启动——确定性占位（不崩；无对象可读）。
    out.touched = "—（未启动）"
    return out
  }
  const out = {
    id: entry.id, role: entry.role, status: "running",
    model: entry.model ?? null,
    elapsedSec: entry.startedAt ? Math.max(0, Math.round((Date.now() - entry.startedAt) / 1000)) : null,
    turn: entry.turn ?? 0,
    maxTurns: entry.maxTurns ?? 100,
  }
  Object.assign(out, summarizeTouched(entry.childAgent, cwd))
  return out
}

/** §19.5.6 N-SF1/D-SF2 touched-files 摘要（CLI touchedSummary 同语义）：running 0 改动 →
 *  touched "—（尚无改动）"（T-SF2a）；有改动 → touchedFiles 前 5 个（相对查询方 cwd
 *  缩短——cwd 之外保留绝对形态 + "../" 前缀）+ touchedMore（仅 >5 时——超出计数——
 *  不混入数组）；单路径 >80 字符截尾（79 + … = 80 总长——不超行）。数据源 =
 *  child._touchedFiles（绝对路径——对象引用实时读——D-SF1——queued/未绑对象 = 空）。 */
function summarizeTouched(child, cwd) {
  const touched = child?._touchedFiles ?? []
  if (touched.length === 0) return { touched: "—（尚无改动）" }
  const out = { touchedFiles: touched.slice(0, 5).map((f) => shortTouchedPath(f, cwd)) }
  if (touched.length > 5) out.touchedMore = touched.length - 5
  return out
}

/** N-SF1 单路径显示形态：cwd 内 → 相对路径；cwd 外 → "../" + 绝对路径；>80 截尾（79+…）。 */
function shortTouchedPath(f, cwd) {
  const r = relative(cwd ?? process.cwd(), f)
  const p = r && !r.startsWith("..") && !isAbsolute(r) ? r : "../" + f
  return p.length > 80 ? `${p.slice(0, 79)}…` : p
}
export function subagentStatus({ id }, ctx) {
  const map = ctx.agent._asyncSubagents
  const idNum = typeof id === "string" && /^\d+$/.test(id) ? Number(id) : id // advisor fix #3（同 check）
  if (idNum != null) {
    if (!map || !map.has(idNum)) {
      return JSON.stringify({ id, status: "error", error: `unknown async subagent id: ${id}` })
    }
    return JSON.stringify(statusEntryFields(map.get(idNum), map, ctx.agent, ctx.cwd))
  }
  const overview = { running: [], queued: [], done: [] }
  for (const entry of map?.values() ?? []) {
    if (entry.done) overview.done.push({ id: entry.id, role: entry.role })
    else if (entry.status === "queued") {
      // §20：概览 queued 行保既有形态 {id, role, position}（无 status 字段——与 CLI
      // 概览同形）+ 等待态 waiting/reason（纯槽满等位不带——position 已足够）。
      const blk = describeBlockers(ctx.agent, entry, entry._auto?.() ?? false)
      const row = { id: entry.id, role: entry.role, position: queuePosition(map, entry), touched: "—（未启动）" }
      if (blk.kind !== "slot") {
        row.waiting = blk.kind === "depc" ? "dependency-cancelled" : "waiting-deps"
        row.reason = blk.detail
      }
      overview.queued.push(row)
    }
    else overview.running.push(statusEntryFields(entry, map, ctx.agent, ctx.cwd))
  }
  return JSON.stringify({ overview })
}

// ─── §19.5 cancel 动作（AGENT-LOOP.md §19.5 D-M6——定向中止 + 控制面）───

/** §19.5 模型可见取消提醒（D-M6 round2 #3——形态仿 injectAsyncResult：短 user-role
 *  提醒、XML 转义；cancelled settle 不入 pending/不直注入（无错误报告）——取消事实与
 *  半成品警示靠这条注入对模型可见）。注入点 = 机读线（模型通道）；人读线由 UI 冻结相位
 *  （区块 stopped + 面板行）承载。§20 D-SD5：取消目标带 queued 依赖者时提醒扩展注记
 *  （依赖者留 queued 标 dependency cancelled——供模型决策——round1 #4）。AUTO 档文案
 *  与实况一致（依赖者将自动启动——round2 #3——code review 🔵）。 */
function injectCancelReminder(parent, entry, wasQueued) {
  if (!parent?.history) return
  const dependents = dependentLabels(parent, entry.id)
  const auto = entry._auto?.() ?? false
  const depNote = dependents.length > 0
    ? (auto
      ? `; queued dependents ${dependents.join(", ")} marked "dependency cancelled" — AUTO session: they auto-start on slot availability (round2 #3)`
      : `; queued dependents ${dependents.join(", ")} marked "dependency cancelled" — they stay queued until you cancel them or an AUTO session starts them`)
    : ""
  const body = wasQueued
    ? `[System reminder: subagent ${entry.role}#${entry.id} cancelled by user (was queued — never started)${depNote}]`
    : `[System reminder: subagent ${entry.role}#${entry.id} cancelled by user — partial changes not merged/audited${depNote}]`
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
    const hadDependents = dependentLabels(parent, idNum).length > 0
    map.delete(idNum)
    // §20 D-SD5：queued 取消（无 settle 事件）→ 出队即终态——写墓碑（cancelled——依赖者
    // 经它查得取消分支）+ 依赖者重估/行刷新（depc 标注——AUTO 自动启动由补位放行——
    // 模型可见 = 提醒（依赖者注记）+ 工具结果 dependents/note——round1 #4 工具结果内）。
    writeTombstone(parent, idNum, "cancelled", entry.role)
    injectCancelReminder(parent, entry, true)
    entry._resolve?.(entry) // 释放可能的并发等待者（check 挂起——不悬挂）
    entry._onCancelled?.(true)
    refillPool(parent, (e) => e._auto?.() ?? false)
    refreshQueuedRows(parent)
    const out = { id, status: "cancelled", was: "queued" }
    if (hadDependents) {
      // refill 后重算——AUTO 下已自动启动的依赖者不再列（文案与实况一致——code review 🔵）
      const dependents = dependentLabels(parent, idNum)
      if (dependents.length > 0) {
        out.dependents = dependents
        out.note = `queued dependents ${dependents.join(", ")} marked "dependency cancelled" — they stay queued until you cancel them (this action again with their id) or an AUTO session starts them (AGENT-LOOP.md §20 D-SD5)`
      } else if (entry._auto?.()) {
        out.note = `dependents of the cancelled task auto-started (AUTO session — round2 #3: an AUTO session starts dependency-cancelled dependents on slot availability)`
      }
    }
    return JSON.stringify(out)
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
