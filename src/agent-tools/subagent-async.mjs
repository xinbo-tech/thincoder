/**
 * subagent-async.mjs — async/audit machinery of the subagent tool family
 * Split out of subagent.mjs (2026-09-03, 500-line discipline) — PURE MECHANICAL MOVE,
 * zero behavior change. subagent.mjs re-exports the public names below, so no consumer
 * (agent.mjs, suspension.mjs, index.mjs, setup.mjs, escalate.mjs, tests) changed.
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
 * collectSettledAsync (turn-end collection), injectAsyncResult (the shared D-S3 injector),
 * subagentCheckTool (read-counter gated fetch).
 */
import { escapeXml, offloadToolResult, pushReal } from "../agent/run-helpers.mjs"

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
  }
  entry.settled = new Promise((res) => { entry._resolve = res })
  entry.start = () => {
    entry.status = "running"
    ctx.callbacks?.onSubagent?.({ id: entry.id, role: entry.role, status: "started", startedAt: Date.now(), model: provider.model ?? null })
    runChild().then(
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
    return JSON.stringify({ id, role, status: "running" })
  }
  entry.position = [...parent._asyncSubagents.values()].filter((x) => x.status === "queued").length
  return JSON.stringify({ id, role, status: "queued", position: entry.position })
}

/**
 * §15 D-A1 settle：落 report/error + 解析该 entry 自己的 settled（arrival-order 唤醒
 * subagent_check / 回合收尾）→ 腾槽补位（running settle 一个即启动队列头部——完成即补位，
 * 不消费才补；失败/abort 同样腾槽）。entry.start 绑定创建它的 execute 调用上下文，
 * 因此补位启动的子代理跑的是它自己的 pipeline。
 * §17 D-S3 ②/D-S8（VS Code 对齐）：settle 时若处于挂起态（parent.history._suspended——
 * 共享数组，跨 runAgent 调用存活；读取时刻为准，确定性）→ 延迟冻结：条目移交
 * history._pendingAsyncResults（由下个回合 prepareRun 前注入，D-S3 ② 记账点）并从池
 * 移除；正常回合内 settle 行为不变（留池，回合尾 collectSettledAsync 直注入 ①）。
 * 会话中止（entry.signal aborted）跳过移交并**出池清理**（2026-09-02 偏差修复 #2）——
 * abort 清池不注入陈旧错误，且 done 僵尸条目不得留在池里让 poolLive 恒真。
 */
function settleAsyncEntry(parent, entry, report, error, notifySettle) {
  entry.report = report
  entry.error = error
  entry.done = true
  // 2026-09-02 偏差修复 #2（abort 分支出池清理）：中止的池项 = 丢弃（D-S5——abort 清池
  // 不注入陈旧错误）。先前 aborted 项不移交 pending 也不出池——done 僵尸条目留在共享
  // map，poolLive 恒真（释放窗口竞态后果 (a)：僵尸挂起会话、驱动器 waitForSettleOrWake
  // 空转直到用户手动 Stop）。abort 分支做与挂起移交同构的出池清理：从池移除、不注入。
  if (entry.signal?.aborted) {
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

/** subagent_check 单回合最多读取次数（consult_check 同款防循环，评审 #1 补定义）。 */
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
 * §17 D-S1 turn-end async collection (AGENT-LOOP.md §17 D-S1 — lives here with the
 * async machinery; agent.mjs's finally calls it, 500-line split): inject every entry
 * that SETTLED during this run (shared injector form — XML-escaped, >64K offloaded)
 * and remove it from the pool. Running/queued STAY — no allSettled wait: the
 * suspension session digests them as they settle (D-S2/D-S9). Single ownership:
 * entries settled inside a suspension session were moved to
 * history._pendingAsyncResults by the settle callback, so this only sees
 * non-suspended settles (no double inject — D-S3 ①/②).
 */
export async function collectSettledAsync(agent, { history, fullHistory, cwd }) {
  const map = agent._asyncSubagents
  if (!map || map.size === 0) return
  for (const e of [...map.values()]) {
    if (!e.done) continue // still running — stays in the pool (D-S1)
    await injectAsyncResult(e, { history, fullHistory, cwd })
    map.delete(e.id) // map keys are the spawn-time id (number — subagent-async.mjs async branch)
  }
}

/**
 * subagent_check — fetch results of ASYNC subagents (spawned with async: true).
 * readonly: true（评审 #6——consult_check 先例，planMode 门控需要）。
 * - n（必填）：1-based 递增读数——每回合首调 n=1，之后逐次 +1；乱序/重复 n 拒绝。
 * - 不带 id：按完成顺序（arrival order）返回下一个完成的 async 子代理——先完成先处理。
 * - 带 id：等该特定子代理（含 queued 项——先等它启动再等完成）。
 * - 全部已消费 → { done: true }（consult_check 同款终结语义）。
 * - 错误路径：未知/已消费 id → { id, status:"error", error:"unknown async subagent id: <id>" }。
 */
export const subagentCheckTool = {
  name: "subagent_check",
  readonly: true,
  description:
    "Fetch the result of a previously spawned ASYNC subagent (subagent with async: true). " +
    "Pass n = the 1-based read counter — it must increment by 1 on every call (first call of the turn: n=1). " +
    "Without an id, returns the NEXT completed async subagent in arrival order (fastest first); " +
    "with an id, waits for that specific subagent (including still-queued ones). " +
    "Returns {done: true} when everything is consumed. Unchecked results are automatically " +
    "injected into the session at turn end — you do not need to check every one.",
  parameters: {
    type: "object",
    properties: {
      id: { type: "number", description: "Optional: the subagent id to wait for (as returned by the async spawn). Omit to fetch the next completed one (arrival order)." },
      n: { type: "number", description: "Required: 1-based read counter — increment by 1 on every call (n=1 for the first check of the turn)." },
    },
    required: ["n"],
  },
  async execute({ id, n }, ctx) {
    const parent = ctx.agent
    const map = parent._asyncSubagents
    // 未知/已消费 id 优先报错（评审 #5：即使注册表已空也要明确错误，不悬挂不误报 done）
    if (id != null && (!map || !map.has(id))) {
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
    if (id != null) {
      const entry = map.get(id)
      if (!entry) return JSON.stringify({ id, status: "error", error: `unknown async subagent id: ${id}` })
      await entry.settled
      map.delete(id)
      return entry.error != null
        ? JSON.stringify({ id, status: "error", error: entry.error })
        : JSON.stringify({ id, role: entry.role, status: "done", report: entry.report })
    }
    const pending = [...map.values()]
    if (pending.length === 0) return JSON.stringify({ done: true })
    const entry = await Promise.race(pending.map((e) => e.settled))
    map.delete(entry.id)
    return entry.error != null
      ? JSON.stringify({ id: entry.id, status: "error", error: entry.error })
      : JSON.stringify({ id: entry.id, role: entry.role, status: "done", report: entry.report })
  },
}
