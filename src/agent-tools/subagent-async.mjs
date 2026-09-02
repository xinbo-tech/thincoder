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
 * §19 (AGENT-LOOP.md §19, 2026-09-03): the single-tool four-action merge dispatches to the
 * action HANDLERS in this module — subagentCheck (action:"check" — the retired
 * subagent_check semantics verbatim: read-counter gated, arrival-order fetch,
 * consume-on-read), subagentStatus (action:"status" — non-blocking pool query, never
 * consumes, never touches the read counter), escalateAction (action:"escalate" — the
 * retired escalate.mjs execution verbatim: pool pick, expert run, post-op report;
 * the `sub:escalate <label> #N` relay prefix and all constraints unchanged).
 * mergeChildMutations moved here with the merge (subagent.mjs re-exports it — no consumer
 * changed) so the escalate handler never imports subagent.mjs (module graph cycle-free).
 */
import { escapeXml, offloadToolResult, pushReal } from "../agent/run-helpers.mjs"
import { isAbsolute, relative } from "node:path"
import { buildProvider } from "../extension/presets.mjs"
import { specForModel } from "../specs.mjs"

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
 * action:'check' / 回合收尾）→ 腾槽补位（running settle 一个即启动队列头部——完成即补位，
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
 * 返回形态（JSON 字符串——工具结果契约）：
 * - 不带 id → { overview: { running: [id...], queued: [{id, position}], done: [id...] } }
 * - 带 id   → { id, role, status: "running" | "queued" | "done", position?, note? }
 * - 未知 id → { id, status: "error", error: "unknown async subagent id: <id>" }（与 check 同）
 */
export function subagentStatus({ id }, ctx) {
  const map = ctx.agent._asyncSubagents
  const note = "settled this turn — unconsumed; fetch with action:'check' or it is auto-injected at turn end"
  const idNum = typeof id === "string" && /^\d+$/.test(id) ? Number(id) : id // advisor fix #3（同 check）
  if (idNum != null) {
    if (!map || !map.has(idNum)) {
      return JSON.stringify({ id, status: "error", error: `unknown async subagent id: ${id}` })
    }
    const entry = map.get(idNum)
    if (entry.done) return JSON.stringify({ id, role: entry.role, status: "done", note })
    if (entry.status === "queued") return JSON.stringify({ id, role: entry.role, status: "queued", position: queuePosition(map, entry) })
    return JSON.stringify({ id, role: entry.role, status: "running" })
  }
  const overview = { running: [], queued: [], done: [] }
  for (const entry of map?.values() ?? []) {
    if (entry.done) overview.done.push(entry.id)
    else if (entry.status === "queued") overview.queued.push({ id: entry.id, position: queuePosition(map, entry) })
    else overview.running.push(entry.id)
  }
  return JSON.stringify({ overview })
}

// ─── §19 escalate 动作（AGENT-LOOP.md §19 D-M4/F7——escalate.mjs 退役，执行逻辑 verbatim 并入）───

const escalateLabel = (m) => `${m.provider}:${m.model}`

/**
 * §19 action:'escalate' handler — the retired escalate.mjs execution VERBATIM
 * (飞刀——consultModels 池选强模型 + WRITE 干活 + 术后报告；约束全保留：depth-0 only /
 * 工程模式禁用 / 池空 error / 模型选择校验 / relay 前缀 `sub:escalate <label> #N` 不变
 * ——TUI 区块路由零改动）。调用面：subagent.mjs execute 的 action 分流。
 */
export async function escalateAction({ task, model }, ctx) {
  const parent = ctx.agent
  if (!task || typeof task !== "string") {
    return "Error: escalate requires a task description with acceptance criteria"
  }
  // Depth guard: an escalate must not fly in another escalate (ESCALATE.md §1.3 US-F5)
  if ((ctx.depth ?? 0) > 0) return "Error: escalate is only available at depth 0 (an escalate's work cannot be delegated again)"
  // Engineering-mode backdoor guard (three-way review 2026-08-16): an escalate IS a
  // coder sub-agent — subagent.mjs forbids role='coder' in engineering mode, and an
  // unconditional coder escalate would bypass the design-token discipline. Fail closed
  // and point at the engineering path, same as subagent does.
  if (parent?.config?.agent?.engineering) {
    return "Error: engineering mode is ON — escalate is unavailable (it spawns a coder sub-agent, which engineering mode forbids). Use subagent with role='eng-coder' and a designToken from advisor(type='design') instead."
  }
  // All consult models are escalate candidates (decision 2026-08-16: the 飞刀 hook checkbox
  // was removed — every configured consultant can fly in; fewer knobs, less mental load).
  const pool = parent?.config?.agent?.consultModels ?? []
  if (pool.length === 0) return "Error: no escalate candidates — configure at least one consult model (agent.consultModels)"

  // Model-pick tolerance: withPool lists candidates as "provider:model (effort)" —
  // a model that copies the listing verbatim must still match (strip the suffix).
  const wanted = typeof model === "string" ? model.replace(/\s+\([^)]*\)\s*$/, "").trim() : model
  const pick = wanted
    ? pool.find((m) => escalateLabel(m) === wanted)
    : pool[0]
  if (!pick) {
    return `Error: "${model}" is not a consult candidate. Available: ${pool.map(escalateLabel).join(", ")}`
  }

  const build = ctx.buildProvider ?? buildProvider // test-injectable (consult.mjs parity)
  const provider = await build(pick.provider)
  if (!provider) return `Error: provider "${pick.provider}" not configured`
  // Key precheck: fail BEFORE the child spawns, not at its first chat call — an
  // auth failure there would surface as an escalate crash, misdiagnosing the cause.
  if (!provider.apiKey?.trim()) {
    return `Error: provider "${pick.provider}" has no API key — set it in Settings before flying it in`
  }
  let effortNote = ""
  const withEffort = pick.effort
    ? (() => {
        // Clamp the pool's effort to the model's reasoningEffortEnum — an out-of-enum
        // value makes provider/core throw on EVERY chat call (candidate dies on takeoff).
        // Out-of-enum: DROP the effort entirely (the preset default may ALSO be out-of-enum
        // for this override model).
        const enumList = specForModel(pick.model).reasoningEffortEnum
        if (enumList && !enumList.includes(pick.effort)) {
          effortNote = ` (effort "${pick.effort}" unsupported by ${pick.model}, dropped)`
          const { reasoningEffort: _drop, ...rest } = provider
          return rest
        }
        return { ...provider, reasoningEffort: pick.effort }
      })()
    : provider
  const agentMod = await import("../agent.mjs")
  const runner = ctx.runAgent ?? agentMod.runAgent

  // advisor fix #1：与 spawn 共用跨 run 单调的 id 分配器（子代理 id 空间一致——escalate
  // 的 onSubagent/panel 事件与 async 池不冲突）。
  const subId = nextSubagentId(parent)
  const tag = escalateLabel(pick)
  ctx.callbacks?.onSubagent?.({ id: subId, role: "escalate", status: "started", startedAt: Date.now(), model: tag })

  let output = ""
  const sink = {}
  const panel = (chunk) => ctx.callbacks?.onToolPanel?.(`sub:escalate ${tag} #${subId}`, chunk)

  // No wall-clock watchdog — turn cap only (CLI parity, 2026-08-16): a fixed wall-clock
  // aborts NORMAL-but-slow surgery (two max-effort consultants hit a 10min wall just
  // READING files). Hang protection = FETCH_TIMEOUT (per LLM call) + user Stop (signal
  // propagates directly). Turn-cap continue reuses the panel's onQuestion channel —
  // the SAME y/n card the main agent's question tool uses; continues are UNLIMITED
  // (each gives a fresh budget; Stop is always an option at the prompt).
  const runOpts = (resume) => ({
    depth: 1, role: "coder", // full write path: permission gate, recent-changes tracking
    streamOutput: true, // exempt from the agent.mjs onToken depth gate (consult role parity)
    maxTurns: parent.config?.agent?.subagentTurns ?? 100,
    stateSink: sink,
    resume,
    // Resume hands the child its own conversation back — subagent history is otherwise
    // throwaway per runAgent call (agent.mjs). sink.history is the LIVE array reference.
    ...(resume ? { history: sink.history } : {}),
  })
  for (let resumes = 0; ; resumes++) {
    try {
      const report = await runner({ ...withEffort, model: pick.model }, ctx.cwd, task, {
        // Full reasoning + output stream (consult-UI parity): a long surgery is silent
        // without it — the panel shows WHAT the expert is thinking, not just tool calls.
        onToken: (t) => { output += t; panel({ kind: "text", text: String(t ?? "") }) },
        onReasoning: (r) => panel({ kind: "think", text: String(r ?? "") }),
        onToolCall: (name, args) => panel({ kind: "tool", text: name + " " + (JSON.stringify(args) || "").slice(0, 120) }),
        onToolResult: (name, text) => panel({ kind: "tool", text: "→ " + String(text ?? "").slice(0, 80).replace(/\n/g, " ") }),
        onComplete: () => {},
        onQuestion: ctx.callbacks?.onQuestion ?? null,
      }, ctx.signal ?? null, true, runOpts(resumes > 0))
      // Escalate mutations are the parent's mutations: verify/advisor guards must see them
      mergeChildMutations(parent, sink)
      ctx.callbacks?.onSubagent?.({ id: subId, role: "escalate", status: "done", model: tag })
      return `escalate (${tag})${effortNote} post-op report:\n${report || output.slice(0, 4000)}${touchedFilesNote(sink, ctx.cwd)}`
    } catch (e) {
      // Even a failed surgery may have written files — merge whatever the child touched.
      mergeChildMutations(parent, sink)
      const msg = e?.message ?? String(e)
      // User Stop must propagate (execute-tools.mjs rethrows AbortError — swallowing
      // it keeps the parent running after the user asked to stop).
      if (ctx.signal?.aborted || e?.name === "AbortError") {
        ctx.callbacks?.onSubagent?.({ id: subId, role: "escalate", status: "error", error: msg, model: tag })
        throw e
      }
      // Turn-cap exhaustion is not a crash: offer to continue from the current context
      // (main-agent panel-chat parity — "reached N turns. Continue?"), resuming with
      // resume:true + the child's own history. No onQuestion (headless) or declined →
      // partial-work return. Unlimited continues — the user can Stop at any prompt.
      if (e instanceof agentMod.ContinueError) {
        if (ctx.callbacks?.onQuestion) {
          const go = await ctx.callbacks.onQuestion(
            `飞刀 ${tag} reached ${e.turns} turns (limit). Continue from here?`,
            ["Continue", "Stop"],
          )
          if (go === "Continue") continue
        }
        return `escalate (${tag}) stopped: turn cap reached (${e.turns} turns) — work may be partial; review recent_changes before deciding next steps.\nPartial output: ${output.slice(0, 2000)}${touchedFilesNote(sink, ctx.cwd)}`
      }
      ctx.callbacks?.onSubagent?.({ id: subId, role: "escalate", status: "error", error: msg, model: tag })
      return `escalate (${tag}) error: ${msg}\nPartial output: ${output.slice(0, 2000)}${touchedFilesNote(sink, ctx.cwd)}`
    }
  }
}

/** Relative touched-file list appended to every escalate return (sink paths are absolute). */
function touchedFilesNote(sink, cwd) {
  const touched = sink?.touchedFiles ?? []
  if (touched.length === 0) return ""
  const shown = touched.map((f) => {
    const r = relative(cwd ?? process.cwd(), f)
    return r && !r.startsWith("..") && !isAbsolute(r) ? r : f
  })
  return `\nTouched files: ${shown.join(", ")}`
}

/**
 * Merge a child's mutations into the parent's bookkeeping
 * (CLI mergeChildMutations parity): the parent's advisor/verify guards must see
 * delegated file changes. Fresh code → fresh convergence budget: a verify/advisor
 * pass earned on the pre-delegation code is stale the moment the child writes.
 * Shared by subagent (eng-coder spawn) and the escalate action — three-way review
 * 2026-08-16: escalate's local copy skipped the resets, letting surgery bypass
 * the parent's verify/advisor gates. Moved here in the §19 merge (2026-09-03):
 * the escalate action handler lives in this module — defining the merger here
 * keeps the module graph cycle-free (subagent.mjs re-exports it; no consumer
 * changed).
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
