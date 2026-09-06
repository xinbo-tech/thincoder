/**
 * subagent-async.mjs — async/audit machinery of the subagent tool family（2026-09-05 模块
 * 拆分轮——超 500 行硬限（AGENTS.md）——§20 调度组 + 文件域组 verbatim 迁至
 * subagent-scheduler.mjs（池/墓碑/文件域归一化与冲突/依赖态/补位判据/行刷新/环防御/
 * ASYNC_SUBAGENT_LIMIT/queuePosition）；§19/§19.5 status/cancel 动作执行器组 verbatim
 * 迁至 subagent-actions.mjs（subagentStatus/cancelSubagent/cancelSubagentAction）——纯
 * 模块迁移零行为变化——本模块 import subagent-scheduler.mjs 单向取调度符号——模块图无环）。
 * subagent.mjs re-exports the public names, so no consumer
 * (agent.mjs, suspension.mjs, index.mjs, setup.mjs, panel-messages.mjs, tests) changed.
 * §19.8（2026-09-06）：action:'check' 删除——check 等待者池唤醒循环（F1）随之退役——
 * 结果仅自动通道（collectSettledAsync 回合尾注入 / 挂起 digest）。
 *
 * 本模块保留：§18 审计机械（ENG_AUDIT_SPAWN_LIMIT/gateEngCoderSpawn/summarizeEngTaskInput/
 * auditTaskBook——audit 子代理任务书机械追加）、shouldAutoResume（§15 D-A3——工程 AUTO
 * 回合帽自动续跑例外）、spawnAsyncSubagent/settleAsyncEntry（§15 槽位队列 + §17 挂起移交 +
 * §19.5 条目级控制字段装配 + cancelled settle 分支 + 墓碑写点）、
 * injectAsyncResult（§17 D-S3 共享注入器——XML 转义 + >64K offload + consumed 墓碑）、
 * collectSettledAsync（§17.5 回合尾收集——suspDriven 留池由挂起会话 digest）、nextSubagentId
 * （跨 runAgent 池内最大 id 续号——subagent-escalate.mjs 单向 import 面不变）、
 * mergeChildMutations（eng-coder spawn merge 与 escalate 引擎共享——重开会话清理）。
 */
import { escapeXml, offloadToolResult, pushReal } from "../agent/run-helpers.mjs"
import { logEvent, errText } from "../log.mjs"
import { describeBlockers, effectivePoolLimits, entryDomain, nextSubagentId, refreshQueuedRows, refillPool, runningByDomain, writeTombstone, writeTombstoneTo } from "./subagent-scheduler.mjs"
import { recordFileMutation } from "./advisor-async.mjs"
// 测试 import 面（test/subagent-scheduler.test.mjs——测试文件零改动约束）：§20 调度符号经
// 本模块 re-export 保持可导入——src 侧消费者（subagent.mjs）已改指 subagent-scheduler.mjs 直连。
export { describeBlockers, queueRunnable, nextSubagentId } from "./subagent-scheduler.mjs"

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
      // D-A1.2 (AGENT-LOOP.md §18.13) — audit budget, mechanical scope anchor: appended AFTER the
      // A1/A2 blocks, BEFORE the A3 report template; D-A1.3 keeps the existing scope sentence above untouched.
      "\n[Audit budget — mechanical]: read ONLY the touched files listed above and\n" +
      "the design-doc sections the parent task book names (affected-files table,\n" +
      "acceptance criteria, status line). Do NOT read whole documents. Budget =\n" +
      "10 tool rounds max — if you cannot conclude within it, report PROBLEM\n" +
      "(inconclusive) rather than continuing to explore." +
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
export function spawnAsyncSubagent({ parent, ctx, subId, role, provider, childSignal, runChild, files, dependsOn, settle }) {
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
  if (childSignal?.aborted && !childSignal?.reason?.interrupt) entry.controller.abort()
  else childSignal?.addEventListener?.("abort", () => {
    // F2（2026-09-05——agent.mjs finally "Ctrl+I keeps the pool" 意图对齐）：interrupt
    // （Ctrl+I——中断消息注入后同回合续跑）不是全停——不逐链中止池内子代理（否则静默丢
    // 报告 + webview 行滞留 running——agent.mjs :487 只对非 interrupt 中止清池）。只有
    // 全停（Stop/会话中止——无 interrupt reason）才沿链传播。
    if (childSignal?.reason?.interrupt) return
    entry.controller.abort()
  }, { once: true })
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
    // §25 R17（飞刀 async——subagent-escalate-async.mjs 自定义 settle）：settle 参数
    // 缺省 = settleAsyncEntry（spawn 既有语义零变化）；飞刀传 settleEscalateEntry——
    // 三分类 + merge 决策 + 独立 pending 流（_pendingEscalateResults——D-R17c）。
    const settleFn = settle ?? settleAsyncEntry
    runChild(entry).then(
      (report) => settleFn(parent, entry, report, null, ctx.callbacks?.onAsyncSettled),
      (err) => settleFn(parent, entry, null, err?.message ?? String(err), ctx.callbacks?.onAsyncSettled),
    )
  }
  parent._asyncSubagents.set(id, entry)
  // §24 D-24a（R14——角色分池）：条目带池域字段（_poolDomain——域判定单一事实源在
  // scheduler.entryDomain——缺省/未知角色归 other）；上限判定按域 running 数 vs
  // 该域配置容量（effectivePoolLimits——每次入池判定时读——变更即生效下个 spawn）。
  entry._poolDomain = entryDomain(entry)
  const { limits, warnings } = effectivePoolLimits(parent)
  const runningBy = runningByDomain(parent._asyncSubagents)
  if (entry._waitKind == null && runningBy[entry._poolDomain] < limits[entry._poolDomain]) {
    entry.start()
    // LOGGING（LOGGING.md——CLI parity）：child:spawn async（立即启动）
    logEvent("child:spawn", { role, id: `${role}#${id}`, kind: "async", status: "running", pool: entry._poolDomain })
    const out = { id, role, status: "running" }
    if (warnings.length > 0) out.warning = warnings.join("; ")
    return JSON.stringify(out)
  }
  // 队列序 = Map 插入序（queued 过滤计数——queuePosition 先例）；等待态条目即使槽空
  // 也在此排队（_waitKind 非空——启动权交补位扫描）。
  entry.position = [...parent._asyncSubagents.values()].filter((x) => x.status === "queued").length
  // §20 D-SD3b：排队 spawn 返回即发 queued 行通知（webview 等位标注——不等启动）；
  // 位置/等待态后续变化经 refreshQueuedRows 刷新（去重 sig）。
  refreshQueuedRows(parent)
  // LOGGING（LOGGING.md——CLI parity）：child:spawn async（排队——启动由补位触发）
  logEvent("child:spawn", { role, id: `${role}#${id}`, kind: "async", status: "queued", pool: entry._poolDomain })
  const out = { id, role, status: "queued", position: entry.position }
  if (warnings.length > 0) out.warning = warnings.join("; ")
  if (entry._waitKind != null) {
    out.waiting = entry._waitKind === "depc" ? "dependency-cancelled" : "waiting-deps"
    out.reason = entry._waitReason
  }
  return JSON.stringify(out)
}

/**
 * §15 D-A1 settle：落 report/error + 解析该 entry 自己的 settled（自动通道——回合尾收集/
 * 挂起 digest）→ 腾槽补位（running settle 一个即启动队列头部——完成即补位，
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
  } else if (entry.signal?.aborted && !entry.signal?.reason?.interrupt) {
    // 2026-09-05 复审 🟡#1：interrupt（Ctrl+I）下按 F2 豁免存活的子代理 settle 时不得走此
    // 丢弃分支——否则报告仍被静默丢弃（F2 目标落空——agent.mjs:487 同构豁免：interrupt
    // 不是全停）——interrupt 形态落默认分支留池 done（挂起期由 suspended 分支移交 pending）
    // 供 collect/digest 注入；plain abort/会话中止仍走此分支。
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

// ─── Async subagent machinery（AGENT-LOOP.md §15 + §17，CLI D-A1/D-A2/D-A4/D-S3 同规格）───

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
  // 后续 spawn 视为已满足（自动通道注入即终态——T-SD14 consumed 语义；error 条目记 failed——
  // 依赖取消/失败分支照旧，不误标成功）。墓碑沿 history 载体（跨 runAgent 存活）。
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
 * §24 D-24b（2026-09-06）：子代理磁盘写入同时记入文件变更事件（跨 run 载体——
 * history._fileMutEvents）——async 评审飞行中子代理落盘 → settle 陈旧判定命中。
 */
export function mergeChildMutations(parent, sink) {
  const touched = sink?.touchedFiles ?? []
  if (touched.length === 0) return
  parent._mutatedThisRun = true
  for (const abs of touched) {
    if (!parent._touchedFiles.includes(abs)) parent._touchedFiles.push(abs)
    recordFileMutation(parent, abs)
  }
  if (parent._calledAdvisorThisRun) parent._calledAdvisorThisRun = false
  if (parent._verifiedThisRun) {
    parent._verifiedThisRun = false
    parent._verifyPassed = undefined
  }
  parent._advisorRound = 0
  parent._advisorSession = null
}
