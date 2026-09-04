/**
 * subagent-async.mjs — async subagent 机械 + 共享 post-spawn 管线 + §19/§19.5/§19.6 合体动作执行器
 * （AGENT-LOOP.md §19：subagent 单工具六动作 spawn/check/status/escalate/cancel/panel——
 * check/escalate 动作执行器并入本模块；subagent.mjs 只承载 spawn 路径与工具面）。
 * 内容：resolveChildProvider / async 常量 / executeCheckAction / executeStatusAction
 * （§19.5 D-M5 可决策字段）/ executeCancelAction + cancelAsyncSubagent（§19.5 D-M6——
 * 工具与 TUI ⏹ 共用）/ executePanelAction（§19.6——面板镜像 view + 门控 freeze）/ executeEscalateAction /
 * runChildPipeline + maybeRefillAsync + injectAsyncResult + buildChildRunOpts + mergeChildMutations。
 */
import { isAbsolute, relative, resolve } from "node:path"
import { existsSync, statSync } from "node:fs"
import {
  runAgent, createAgent, escapeXml, CODER_OVERLAY,
  MIN_REPORT_CHARS, REPORT_CONTINUATION, DEFAULT_SUBAGENT_TURNS,
} from "../agent.mjs"
import {
  runWithContinue, TURN_CAP_MARK, makeRelay, wrapChildCallbacks,
  ensureChildApiKey, clampEffort,
} from "../agent/spawn-child.mjs"
import { pushReal } from "../context.mjs"
import { offloadToolResult } from "../agent/helpers.mjs"
import { logEvent, errText } from "../log.mjs"

// Async subagent limits (AGENT-LOOP.md §15 D-A4): mechanical concurrency cap for
// background spawns + the per-turn check budget (consult-style loop guard).
export const ASYNC_SUBAGENT_LIMIT = 4
export const MAX_ASYNC_CHECKS = 3

/**
 * Resolve the sub-agent's provider from a model override string (shared with the
 * VS Code port). Forms accepted:
 *   "provider:model"  → the named provider with the named model
 *   "provider"        → the named provider's configured model
 *   "model"           → same provider as the parent, different model
 *   "default"         → same as null: the parent's provider unchanged (explicit
 *                       "use the default model" — 2026-09-05 user ruling; matched
 *                       case-insensitively — parser-layer alias guard)
 * null → parent's provider unchanged.
 * API keys come from config.json only (env vars are not a key source).
 */
export function resolveChildProvider(parent, modelArg) {
  if (!modelArg) return { ...parent.provider }
  // "default" alias (2026-09-05 user ruling — ARCHITECTURE.md 子 agent 模型指定):
  // the literal "default", matched case-insensitively, declares "no override →
  // inherit the default model" — equivalent to null/omission (parent provider
  // unchanged). Checked BEFORE the provider-name lookup so the alias is reserved
  // (≡ omission — providers are not consulted) and never falls through to the
  // model-name swap branch. Any other single-segment value keeps the legacy
  // semantics below.
  if (String(modelArg).toLowerCase() === "default") return { ...parent.provider }
  const providers = parent.config?.providersList ?? []
  const withKey = (p) => (p.apiKey?.trim() ? { ...p, apiKey: p.apiKey.trim() } : { ...p })
  if (modelArg.includes(":")) {
    const [pname, mname] = modelArg.split(":")
    const p = providers.find((x) => x.name === pname)
    if (!p) throw new Error(`subagent model: unknown provider "${pname}" (available: ${providers.map((x) => x.name).join(", ") || "none"})`)
    return { ...withKey(p), model: mname || p.model }
  }
  const byName = providers.find((x) => x.name === modelArg)
  if (byName) return withKey(byName)
  return { ...parent.provider, model: modelArg }
}

/** Wait for an async entry to settle (or the parent signal to abort), parked on
 *  the agent's waiter list — the entry settle finally wakes every waiter (same
 *  pattern as consult_check's session waiters). Returns "aborted" on signal. */
function wakeOnAsyncSettle(agent, ctx) {
  return new Promise((resolve) => {
    const cleanup = () => {
      const i = (agent._asyncWaiters ?? []).indexOf(w)
      if (i >= 0) agent._asyncWaiters.splice(i, 1)
      ctx.signal?.removeEventListener("abort", onAbort)
    }
    const w = () => { cleanup(); resolve("settled") }
    const onAbort = () => { cleanup(); resolve("aborted") }
    ;(agent._asyncWaiters ??= []).push(w)
    if (ctx.signal) {
      if (ctx.signal.aborted) { onAbort(); return }
      ctx.signal.addEventListener("abort", onAbort, { once: true })
    }
  })
}

/**
 * subagent action:"check" (§19 — the retired subagent_check's semantics verbatim,
 * AGENT-LOOP.md §15 D-A2): fetch async subagent results.
 * - id omitted → the next completed child in ARRIVAL order (first finished first)
 * - id given → block until THAT child finishes (queued items wait for their start)
 * - n (required) → 1-based read counter, strictly incrementing per run (loop
 *   guard); capped at MAX_ASYNC_CHECKS per turn — beyond that, use the turn-end
 *   auto-wait. Errors never consume results.
 * Consumed entries are deleted from the map — a re-check of the same id is the
 * same "unknown async subagent id" error (T12).
 */
export async function executeCheckAction(args, ctx) {
  const agent = ctx.agent
  const map = agent._asyncSubagents ?? new Map()
  const { id, n } = args ?? {}
  // Strict 1-based incrementing read counter (D-A2, review #1): out-of-order /
  // repeated n is rejected WITHOUT consuming a result (T14).
  const lastN = agent._asyncCheckLastN ?? 0
  if (!Number.isInteger(n) || n !== lastN + 1) {
    return JSON.stringify({ status: "error", error: "invalid read counter — pass n = lastN+1" })
  }
  if (n > MAX_ASYNC_CHECKS) {
    return JSON.stringify({ status: "error", error: "check limit exceeded — use turn-end auto-wait for the rest" })
  }
  agent._asyncCheckLastN = n

  let target = null
  if (id !== undefined && id !== null && String(id) !== "") {
    target = map.get(String(id))
    // Unknown OR already-consumed ids (consumed entries are deleted) — same error (T12).
    if (!target) return JSON.stringify({ id: String(id), status: "error", error: `unknown async subagent id: ${id}` })
  }

  // Block until the target settles (specific id / next completed in arrival order).
  // §20（advisor code review 🟡 处置）：不可启动的 queued 条目会让阻塞等待永久悬挂
  // （check 是同步工具调用——模型回合被钉死——仅 Ctrl+C 可解）。补位（refill）只由
  // settle/cancel/spawn 事件驱动：**池内无 running 条目 = 无未来 settle 事件 = queued
  // 条目永不启动**（槽满等位的 slot 条目在 running 归零时已被最后一次 settle 的 refill
  // 启动——此时仍 queued 者必为不可启动：depc 锁定或阻塞源本身不可启动）。
  for (;;) {
    if (target) {
      if (target.done) break
      // 守卫 ①（target 级）：queued 目标在无 running 池中不可启动 → 立即返回（无论
      // wait/depc——阻塞源链底为 depc 的 wait 条目同样无 settle 可期）。
      if (target.status === "queued" && !target.cancelled) {
        const blk = describeBlockers(agent, target)
        if (blk.kind === "depc") {
          return JSON.stringify({
            id: String(target.id), status: "queued", waiting: "dependency-cancelled",
            reason: blk.detail,
            note: "check would block forever — this task is locked by a cancelled/failed dependency and will not start on its own; cancel it (action:'cancel') or run an AUTO session to release it (AGENT-LOOP.md §20 round2 #3)",
          })
        }
        if (![...map.values()].some((e) => e.status === "running")) {
          const qi = (agent._asyncQueue ?? []).indexOf(target)
          const out = { id: String(target.id), status: "queued", position: qi >= 0 ? qi + 1 : undefined }
          if (blk.detail) out.reason = blk.detail
          out.note = "check would block indefinitely — this queued task cannot start while the pool has no running task (starts are settle-driven); cancel it (action:'cancel') or make pool progress (AUTO session starts it on the next settle/refill)"
          return JSON.stringify(out)
        }
      }
      const woke = await wakeOnAsyncSettle(agent, ctx)
      if (woke === "aborted") return JSON.stringify({ done: true, stopped: true })
      continue
    }
    const completed = [...map.values()].filter((e) => e.done)
    if (completed.length > 0) {
      target = completed.sort((a, b) => (a._settleSeq ?? 0) - (b._settleSeq ?? 0))[0]
      break
    }
    if (map.size === 0) return JSON.stringify({ done: true })
    // 守卫 ②（arrival-order）：池内无 running（completed 已空 → 无 done）且仍有条目 →
    // 全为 queued 且永不启动 → 立即返回明确错误（防无界悬挂——补 cancel 引导）。
    if (![...map.values()].some((e) => e.status === "running")) {
      const stuck = [...map.values()]
        .map((e) => `${e.role}#${e.id}（${describeBlockers(agent, e).kind === "depc" ? "dependency-cancelled" : "blocked"}）`)
        .join(", ")
      return JSON.stringify({
        status: "error",
        error: `nothing will settle — the pool holds only queued task(s) that cannot start without a running task: ${stuck}; cancel them (action:'cancel') or make pool progress (AUTO session starts them on the next settle/refill)`,
      })
    }
    const woke = await wakeOnAsyncSettle(agent, ctx)
    if (woke === "aborted") return JSON.stringify({ done: true, stopped: true })
  }

  map.delete(String(target.id))
  // §20（advisor code review 🟡 处置）：check 消费与挂起期 settle 的竞态——settle 在挂起
  // 分支先把条目移交 _pendingAsyncResults（本 check 在途等待期间发生——digest 回合）——
  // 消费时若条目已被移入 pending，反向清除（两消费点互斥——防下轮 prepareRun 重复注入
  // ——D-S3"只注入一次"不变式——同一报告双送达违例）。
  const pend = agent._pendingAsyncResults
  if (Array.isArray(pend)) {
    const pendIdx = pend.findIndex((x) => String(x.id) === String(target.id))
    if (pendIdx >= 0) pend.splice(pendIdx, 1)
  }
  // §20 D-SD5 终态墓碑（T-SD14）：消费即终态——dependsOn 引用该 id 的条目视其终态
  // 满足/标注（consumed-ok = 已满足；failed/cancelled = 依赖取消/失败分支）。写于
  // 观察 cancelled/error 之后——取消/失败条目不被误记 consumed。
  if (target.cancelled) {
    const tombstones = (agent._asyncTombstones ??= new Map())
    tombstones.set(String(target.id), { status: "cancelled", role: target.role })
    // Cancelled entries are removed from the pool at their cancel — an in-flight
    // check that held the entry object observes `cancelled` and reports the same
    // unknown-id error a fresh check gets (nothing to consume; §19.5 T-M27).
    return JSON.stringify({ id: String(target.id), status: "error", error: `unknown async subagent id: ${target.id}` })
  }
  const tombstones = (agent._asyncTombstones ??= new Map())
  tombstones.set(String(target.id), { status: target.error ? "failed" : "consumed", role: target.role })
  if (target.error) return JSON.stringify({ id: String(target.id), status: "error", error: target.error })
  return JSON.stringify({ id: String(target.id), role: target.role, status: "done", report: target.report ?? "" })
}

/**
 * subagent action:"status" (§19 D-M2, new): NON-BLOCKING async-pool query —
 * returns immediately, never consumes a result and never touches the check read
 * counter (T-M10). Source of truth = the pool (_asyncSubagents): entries moved
 * to _pendingAsyncResults during a suspension (§17 D-S3 ② — injected at the next
 * run start) are no longer in the pool and are NOT counted as done-waiting.
 * - id given → { id, role, status, model?, elapsedSec?, turn?, maxTurns?,
 *   touchedFiles?/touchedMore?/touched? ... } for that entry; unknown id → error
 *   (same wording as check — T12 semantics)
 * - id omitted → { overview: { running: [{id, role, model, elapsedSec, turn,
 *   maxTurns, touchedFiles?/touched?}], queued: [{id, role, position, touched?}],
 *   done: [{id, role}] } } — live queue positions (index in _asyncQueue + 1).
 * §19.5.6: running 条目带 touched files 摘要（touchedFiles 前 5 + touchedMore 超出
 * 计数——相对查询方 cwd；0 改动 → touched 占位）；queued 条目带 touched 占位
 * "—（未启动）"；done/error/取消条目无 touched 字段（round3 #9）。
 * A settled-but-unconsumed entry (settled during a NORMAL turn) reports done
 * with a "not yet consumed" note — check still retrieves it afterwards.
 */
/** §19.5 D-M5 decision-field assembly (F9): running entries report
 *  {id, role, model, elapsedSec, turn, maxTurns} — the data needed to decide
 *  WHO to cancel. Model is recorded at spawn (childProvider), startedAt at
 *  ACTUAL start (queued waits don't count), turn/maxTurns mirrored from the
 *  child's ⟦ev⟧turn events at the callbacks-wrap layer (subagent.mjs tracker).
 *  elapsedSec computed at call time from startedAt. */
/** §19.5.6 D-SF2/N-SF1 摘要形态：status 调用时实时读 entry.childAgent._touchedFiles
 *  （绝对路径——per-run 记账——§18.12）→ 相对查询方 cwd；cwd 之外保留绝对形态 +
 *  "../" 前缀；>80 字符截尾（不超行）；前 5 个 + 独立截断字段 touchedMore（超出
 *  计数——不混入数组——消费方按类型区分）。占位：running 0 改动 → "—（尚无改动）"
 *  （T-SF2a）；queued 未启动 → "—（未启动）"（T-SF2b）；done/error/取消条目不含
 *  本摘要（round3 #9 明示——本批只做 running/queued）。 */
function touchedSummary(entry, cwd) {
  if (entry.status !== "running") return { touched: "—（未启动）" }
  const files = entry.childAgent?._touchedFiles ?? []
  if (files.length === 0) return { touched: "—（尚无改动）" }
  const shown = files.slice(0, 5).map((f) => shortTouchedPath(f, cwd))
  const out = { touchedFiles: shown }
  if (files.length > 5) out.touchedMore = files.length - 5
  return out
}

/** N-SF1 单路径显示形态：cwd 内 → 相对路径；cwd 外 → "../" + 绝对路径；>80 截尾。 */
function shortTouchedPath(f, cwd) {
  let p = f
  if (cwd) {
    const rel = relative(cwd, f)
    p = rel && !rel.startsWith("..") && !isAbsolute(rel) ? rel : `../${f}`
  }
  return p.length > 80 ? `${p.slice(0, 79)}…` : p
}

function statusFields(entry, cwd) {
  const base = { id: String(entry.id), role: entry.role }
  if (entry.status === "running") {
    base.model = entry.model ?? null
    base.elapsedSec = entry.startedAt ? Math.max(0, Math.floor((Date.now() - entry.startedAt) / 1000)) : 0
    base.turn = entry.turn ?? 0
    base.maxTurns = entry.maxTurns ?? 0
    // §19.5.6：touched files 摘要（T-SF1..4——新字段追加——既有字段零破坏）
    Object.assign(base, touchedSummary(entry, cwd))
  } else if (entry.status === "queued") {
    // §19.5.6 T-SF2b：未启动——确定性占位（不崩；无对象可读）
    base.touched = "—（未启动）"
  }
  return base
}

export function executeStatusAction(args, ctx) {
  const agent = ctx.agent
  const map = agent._asyncSubagents ?? new Map()
  const queue = agent._asyncQueue ?? []
  const queuedPosition = (id) => {
    const i = queue.findIndex((e) => String(e.id) === id)
    return i >= 0 ? i + 1 : undefined
  }
  const { id } = args ?? {}
  if (id !== undefined && id !== null && String(id) !== "") {
    const key = String(id)
    const entry = map.get(key)
    if (!entry) {
      return JSON.stringify({ id: key, status: "error", error: `unknown async subagent id: ${key}` })
    }
    const target = statusFields(entry, agent.cwd)
    if (entry.status === "running") return JSON.stringify({ ...target, status: "running" })
    if (entry.status === "queued") {
      // §20 F-SD4/D-SD3b：waiting 语义对模型可见——排队原因（冲突对象/依赖对象）随
      // status 返回；纯槽满等位（kind slot）无 waiting 字段（position 已足够）。
      const blk = describeBlockers(agent, entry)
      const out = { ...target, status: "queued", position: queuedPosition(key) ?? entry.position }
      if (blk.kind !== "slot") {
        out.waiting = blk.kind === "depc" ? "dependency-cancelled" : "waiting-deps"
        out.reason = blk.detail
      }
      return JSON.stringify(out)
    }
    // done = settled during this turn and not yet consumed — check still retrieves it
    // (§17.5: at a driven turn end it stays pooled → the suspension digest consumes it).
    target.status = "done"
    target.done = true
    if (entry.error) target.error = entry.error
    target.note = "settled, not yet consumed — retrieve via check or the suspension digest injects it"
    return JSON.stringify(target)
  }
  const overview = { running: [], queued: [], done: [] }
  for (const entry of map.values()) {
    if (entry.status === "running") overview.running.push(statusFields(entry, agent.cwd))
    else if (entry.status === "queued") {
      // §20：queued 条目补 waiting/reason（F-SD4——依赖/冲突原因模型可见）；
      // §19.5.6 T-SF2b：未启动占位（确定性——不崩）。
      const blk = describeBlockers(agent, entry)
      const row = statusFields(entry, agent.cwd)
      row.position = queuedPosition(String(entry.id)) ?? entry.position
      if (blk.kind !== "slot") {
        row.waiting = blk.kind === "depc" ? "dependency-cancelled" : "waiting-deps"
        row.reason = blk.detail
      }
      overview.queued.push(row)
    }
    else if (entry.done) overview.done.push({ id: String(entry.id), role: entry.role })
  }
  return JSON.stringify({ overview })
}

/**
 * §19.5 D-M6 cancel 核心（工具路径与 TUI ⏹ 共用）：定向中止单个后台子代理，id 必填。
 * - queued 目标（未启动无 controller）：出队 + 后续 position 前移 + settle waiter
 *   → { id, status:"cancelled", was:"queued" }——无 abort（T-M27）
 * - running 目标：置 entry.cancelled + 条目 controller abort（child runAgent signal）
 *   → settle finally 跑 cancelled 分支（⟦ev⟧stopped 冻结 + 模型提醒；不入 pending/
 *   不直注入）→ { id, status:"cancelled" }（T-M19）
 * - 未知/已完成 id → error（T-M20）；重复 cancel 幂等（abort 已在途）
 */
export function cancelAsyncSubagent(agent, id) {
  const key = String(id)
  const map = agent._asyncSubagents ?? new Map()
  const entry = map.get(key)
  if (!entry) {
    return { id: key, status: "error", error: `unknown async subagent id: ${key}` }
  }
  if (entry.done) {
    return { id: key, status: "error", error: `async subagent #${key} has already finished — nothing to cancel` }
  }
  if (entry.cancelled) return { id: key, status: "cancelled" } // abort already in flight — idempotent
  if (entry.status === "queued") {
    // 出队 + position 释放/前移；settle 使在途 check waiter 终止（观察 cancelled）
    const queue = agent._asyncQueue ?? []
    const qi = queue.indexOf(entry)
    if (qi >= 0) {
      queue.splice(qi, 1)
      for (let i = 0; i < queue.length; i++) queue[i].position = i + 1
    }
    entry.cancelled = true
    entry.done = true
    entry.status = "done"
    map.delete(key)
    // §20 D-SD5 终态墓碑：queued 取消（无 settle 事件——出队即终态）——依赖者经
    // 墓碑查得 cancelled 分支（round1 #4——cancel 返回时即重估标注）。
    const tombstones = (agent._asyncTombstones ??= new Map())
    tombstones.set(key, { status: "cancelled", role: entry.role })
    entry._settle?.()
    for (const w of agent._asyncWaiters?.splice(0) ?? []) { try { w() } catch { /* noop */ } }
    return { id: key, status: "cancelled", was: "queued" }
  }
  // running：标记 + 条目 abort——settle finally 跑 cancelled 分支（移除 + stopped + 提醒）
  entry.cancelled = true
  entry.controller?.abort?.()
  return { id: key, status: "cancelled" }
}

/** subagent action:"cancel" (§19.5 D-M6): depth-0 main-session control only.
 *  §20 D-SD5/round1 #4（queued 依赖取消——无 settle 事件）：出队后**返回即**重估
 *  依赖者——依赖者留 queued 标 dependency cancelled（refreshQueuedTokens 发更新块头
 *  token）+ 工具结果内注依赖者（模型可见——工具结果内——round1 #4 明示通道）+ 补位
 *  （AUTO 档依赖者自动启动/槽位竞态释放）。被取消条目自身发 ⟦ev⟧cancelled 移除等待块。 */
export function executeCancelAction(args, ctx) {
  if ((ctx.depth ?? 0) > 0) {
    return JSON.stringify({ status: "error", error: "cancel is only available at depth 0 — a child agent has no async pool of its own (AGENT-LOOP.md §19.5 D-M6)" })
  }
  const id = args?.id
  if (id === undefined || id === null || String(id) === "") {
    return JSON.stringify({ status: "error", error: "cancel requires the id of the async subagent to stop — omitting it would mean a blanket cancel (Ctrl+C stops everything; AGENT-LOOP.md §19.5 D-M6)" })
  }
  const key = String(id)
  const agent = ctx.agent
  const entry = agent._asyncSubagents?.get(key)
  const wasQueued = entry?.status === "queued"
  // 依赖者快照（出队前——用于 AUTO 分支判定"是否有依赖者被本次取消波及"；note 组装在
  // refill 后按**仍 queued** 的实况重算——防 AUTO 已自动启动后文案称 "stay queued"）
  const hadDependents = entry ? dependentLabels(agent, key).length > 0 : false
  const result = cancelAsyncSubagent(agent, key)
  if (wasQueued && result.status === "cancelled" && result.was === "queued" && entry) {
    // §20 D-SD3b：取消/出队 → 移除等待块（不冻结——TUI routeSubToken cancelled 分支）
    ctx.callbacks?.onToken?.(`${entry.relayPrefix}⟦ev⟧cancelled\x1e`)
    // 依赖者标注 + 位置前移 + AUTO 自动启动（round2 #3：AUTO 档才启动——手动留 queued）
    maybeRefillAsync(agent)
    refreshQueuedTokens(agent, ctx.callbacks?.onToken)
    if (hadDependents) {
      // refill 后重算——AUTO 下依赖者已启动者不再列（文案与实际状态一致——code review 🔵）
      const dependents = dependentLabels(agent, key)
      if (dependents.length > 0) {
        result.dependents = dependents
        result.note = `queued dependents ${dependents.join(", ")} marked "dependency cancelled" — they stay queued until you cancel them (this action again with their id) or an AUTO session starts them (AGENT-LOOP.md §20 D-SD5)`
      } else if (agent.autoApprove) {
        result.note = `dependents of the cancelled task auto-started (AUTO session — round2 #3: an AUTO session starts dependency-cancelled dependents on slot availability)`
      }
    }
  }
  return JSON.stringify(result)
}

// ═══════════════════════════════════════════════════════════════════════════
// §19.6 subagent panel 检查工具（AGENT-LOOP.md §19.6——F-P1..P3/D-P1..P4）
// ═══════════════════════════════════════════════════════════════════════════

/** 面板块 key（role#N）在池（Map——条目值）/pending（数组）中的归属判定。 */
function blockKeyIn(container, key) {
  const entries = container instanceof Map ? [...container.values()] : (container ?? [])
  return entries.some((e) => `${e.role}#${e.id}` === key)
}

/**
 * §19.6 D-P3 冻结门控（安全）：仅允许冻结 awaitingDigest 且池（_asyncSubagents）
 * 无对应运行条目 + pending（_pendingAsyncResults）无对应条目的块（= 已消化驻留块
 * ——报告已入模型上下文——pending 已消费——状态滞后——补发冻结不破坏任何顺序）。
 * - pending 仍有对应（报告未达模型）→ 拒绝（提前回收破坏消化顺序——T-P3）
 * - 不存在的 key / 仍 running / done 的块 → 拒绝（T-P4——running 块 settle 时自冻）
 * - 无镜像 → 拒绝（headless/VS Code——freeze 不可用——T-P5）
 * 错误信息明确（模型可解释 + 自助修正）。返回 { ok:true } 或 { err }。
 */
function panelFreezeGate(agent, key) {
  const snap = agent._panelSnapshot
  if (!Array.isArray(snap)) {
    return { err: "panel unavailable — no CLI TUI panel mirror in this session (headless / VS Code / subagent contexts — freeze unavailable; panel is CLI-TUI-only, AC-P4)" }
  }
  const block = snap.find((b) => b.key === key)
  if (!block) {
    const live = snap.map((b) => `${b.key}(${b.status})`).join(", ")
    return { err: `unknown panel block key: ${key} — the live panel holds: ${live || "(no blocks)"}` }
  }
  if (block.status !== "awaitingDigest") {
    if (block.status === "done") {
      return { err: `block ${key} is already done — nothing to freeze; it was (or is about to be) reclaimed into the conversation by the freeze sweep at the turn end / settle (only digested-stuck awaitingDigest blocks need a manual freeze)` }
    }
    if (block.status === "running") {
      return { err: `block ${key} is still running — freeze only reclaims awaitingDigest blocks whose report is already digested; a running block freezes on its own settle (or stop it with action:'cancel' if it is a background async child)` }
    }
    return { err: `block ${key} is in state ${block.status} — freeze only reclaims awaitingDigest blocks whose report is already digested` }
  }
  if (blockKeyIn(agent._asyncSubagents, key)) {
    return { err: `block ${key} still has a live pool entry — it is NOT a digested-stuck block (freeze refused; status action shows the pool)` }
  }
  if (blockKeyIn(agent._pendingAsyncResults, key)) {
    return { err: `block ${key} is still genuinely awaiting digestion — its report is still in _pendingAsyncResults and has NOT reached the model yet; freezing now would break the digestion order (wait for the digest run, which reclaims it automatically — §17.5.5)` }
  }
  return { ok: true }
}

/**
 * §19.6 subagent action:"panel"（D-P2——readonly 视图面 + 门控干预面——单动作双参，
 * freeze 优先）：
 * - view（缺省——返回镜像区块列表）：agent._panelSnapshot = TUI 面板镜像（块级
 *   状态变更点由 subagent-blocks syncPanelSnapshot 同步刷新——与用户所见一致——
 *   index.mjs 装配 state._agent）。awaitingDigest 条目**读时交叉**
 *   _pendingAsyncResults/_asyncSubagents 标注 digested（round1 #3——digested:true
 *   = 报告已消化但块仍驻留——异常块——freeze 候选；模型可定位解释 UI 怪相）。
 * - freeze:key（D-P3 门控通过 → 发 key + "/" + ⟦ev⟧done 哨兵字面 token——
 *   onToken——TUI routeSubToken 冻结回收——落位复用 sub._freezeAt settle 锚点
 *   splice，无锚点尾推兜底——§17.5.5 同口径——round1 #2）。
 * 无镜像（headless/VS Code——D-P2 round1 #1：webview 无 state.subTasks 对应物——
 * 7.2.3.2 #8 先例）→ view 恒降级池视图（_asyncSubagents + _pendingAsyncResults
 * 合成）+ no panel 注；freeze 报不可用。CLI-only 完整能力（AC-P4）。
 */
export function executePanelAction(args, ctx) {
  const agent = ctx.agent
  const freezeKey = (args?.freeze !== undefined && args?.freeze !== null && String(args.freeze) !== "")
    ? String(args.freeze)
    : null
  // ── freeze 面（优先——D-P2 单动作双参互斥）──
  if (freezeKey) {
    if ((ctx.depth ?? 0) > 0) {
      return JSON.stringify({ status: "error", error: "panel freeze is only available at depth 0 — a child agent has no panel of its own (AGENT-LOOP.md §19.6 D-P2)" })
    }
    const gate = panelFreezeGate(agent, freezeKey)
    if (gate.err) return JSON.stringify({ status: "error", error: gate.err })
    if (!ctx.callbacks?.onToken) {
      return JSON.stringify({ status: "error", error: `panel mirror present but no token relay in this context — the freeze of ${freezeKey} cannot reach the TUI` })
    }
    // 门控通过 → 发 done 冻结事件（settle 同机制字面格式——TUI routeSubToken done
    // 分支冻结回收——落位 _freezeAt settle 锚点 splice；无锚点（旧会话残留）时
    // freezeSubTaskLines 尾推兜底——注明两种落位，模型不被误导（advisor 🟡1）。
    ctx.callbacks.onToken(`${freezeKey}/⟦ev⟧done\x1e0\x1e0\x1edone\x1e`)
    return JSON.stringify({
      key: freezeKey,
      status: "frozen",
      note: "done freeze event issued — the TUI reclaimed the block into the conversation (spliced at its settle anchor when one is recorded, else appended at the current stream end — §17.5.5 same-rule position)",
    })
  }
  // ── view 面（缺省——readonly）──
  // 双参互斥（D-P2）：freeze 优先；显式 view:false 且无 freeze = 无请求可执行——报错。
  if (args?.view === false) {
    return JSON.stringify({ status: "error", error: "panel has nothing to do — view:false with no freeze key; pass freeze:'role#N' to reclaim a digested-stuck block, or omit view (defaults to true)" })
  }
  const snap = agent._panelSnapshot
  if (!Array.isArray(snap)) {
    // F-P3 降级：无镜像（headless/VS Code/子代理上下文——CLI TUI-only 完整能力）→
    // 池视图（_asyncSubagents 运行/排队条目 + _pendingAsyncResults 待消化条目）
    const blocks = []
    const queue = agent._asyncQueue ?? []
    for (const e of [...(agent._asyncSubagents?.values() ?? [])]) {
      const b = { key: `${e.role}#${e.id}`, role: e.role }
      if (e.status === "running") {
        b.status = "running"
        b.elapsedSec = e.startedAt ? Math.max(0, Math.floor((Date.now() - e.startedAt) / 1000)) : 0
      } else if (e.status === "queued") {
        b.status = "queued"
        const qi = queue.indexOf(e)
        b.position = qi >= 0 ? qi + 1 : (e.position ?? null)
      } else {
        b.status = "done" // 回合内 settle 未取——status action 可查/check 可取回
      }
      blocks.push(b)
    }
    for (const e of agent._pendingAsyncResults ?? []) {
      blocks.push({ key: `${e.role}#${e.id}`, role: e.role, status: "awaitingDigest", note: "report pending — injected at the next run start (§17)" })
    }
    return JSON.stringify({
      degraded: true,
      note: "no panel — this session has no CLI TUI panel mirror (headless / VS Code / subagent context — panel view is CLI-TUI-only, AC-P4); pool-derived view below; action:'status' shows the full pool",
      panel: blocks,
    })
  }
  const panel = snap.map((b) => {
    const out = { key: b.key, role: b.role, status: b.status }
    if (b.status === "running") {
      out.elapsedSec = b.startedAt ? Math.max(0, Math.floor((Date.now() - b.startedAt) / 1000)) : 0
    } else if (b.status === "awaitingDigest") {
      // 读时交叉（round1 #3）：pending/池均无对应 = 报告已消化（注入即从两者移除）——
      // 块驻留 = 状态滞后——digested:true（freeze 候选——模型可定位异常块）。
      out.digested = !blockKeyIn(agent._pendingAsyncResults, b.key) && !blockKeyIn(agent._asyncSubagents, b.key)
    }
    return out
  })
  return JSON.stringify({ panel })
}

/**
 * subagent action:"escalate"（§19 D-M4——退役 escalate 工具语义原样，ESCALATE.md）：
 * 飞刀——交给 consultModels 池里更强模型（WRITE + 术后报告）。约束全保留：depth-0
 * only / 工程模式拒 / consultModels 空拒 / relay 前缀 `escalate#N/`（与既有前缀同名
 * ——TUI 路由零改动）/ 无 permQueue（continue 直达用户）/ mutations merge 回父。
 */
export async function executeEscalateAction(args, ctx) {
  const parent = ctx.agent
  if ((ctx.depth ?? 0) > 0) return "Error: escalate is only available at depth 0 (an escalate's work cannot be delegated again)"
  if (parent?.config?.agent?.engineering) {
    return "Error: engineering mode is ON — escalate is unavailable (it spawns a coder sub-agent, which engineering mode forbids). Use subagent with role='eng-coder' and a designToken from advisor(type='design') instead."
  }
  const pool = parent?.config?.agent?.consultModels ?? []
  if (pool.length === 0) return "Error: no escalate candidates — configure at least one consult model (agent.consultModels)"

  const { task, model } = args ?? {}
  // task 机械必填（多动作 schema 的 required 只是建议——缺 task 会以晦涩 child-run 错浮现）
  if (typeof task !== "string" || !task.trim()) {
    return "Error: escalate requires a task — the task description with goal, constraints, entry files and acceptance criteria"
  }
  const label = (m) => `${m.provider}:${m.model}`
  const wanted = typeof model === "string" ? model.replace(/\s+\([^)]*\)\s*$/, "").trim() : model
  const pick = wanted ? pool.find((m) => label(m) === wanted) : pool[0]
  if (!pick) {
    return `Error: "${model}" is not a consult candidate. Available: ${pool.map(label).join(", ")}`
  }

  let provider
  try {
    provider = resolveChildProvider(parent, `${pick.provider}:${pick.model}`)
  } catch (e) {
    return `Error: ${e.message}`
  }
  if (!ensureChildApiKey(provider)) {
    return `Error: provider "${pick.provider}" has no API key — set it in config.json before flying it in`
  }
  let effortNote = ""
  if (pick.effort && !clampEffort(provider, pick.model, pick.effort)) {
    // enum 外 effort 丢弃（preset 默认也可能对 override model 是 enum 外值）
    effortNote = ` (effort "${pick.effort}" unsupported by ${pick.model}, dropped)`
  }

  const tag = label(pick)
  const relayPrefix = makeRelay(parent, "escalate", ctx.callbacks?.onToken, provider.model ?? tag)

  // 无墙钟 watchdog——turn cap 即成本预算（2026-08-16 rationale：固定墙钟会误杀正常慢速
  // 手术；挂起防护 = FETCH_TIMEOUT_MS + 父 signal 直传）

  // 不自建 onToken（consult P2）：wrapChildCallbacks 已承担前缀 relay + D7 哨兵剥除，
  // runWithContinue 拥有 capture（stripEventTokensForCapture）——手写副本会双剥+双缓冲
  const childCallbacks = wrapChildCallbacks(relayPrefix, ctx.callbacks ?? {})

  // try 外声明：catch 也能在部分失败时 merge mutations
  let child = null
  let escErr = null // LOGGING outcome（string 形态返回 vs 异常——见下方事件点）
  const escId = relayPrefix.slice(0, -1)
  let escT0 = Date.now()
  try {
    // 全写路径（role "coder"）：权限经父 onPermissionRequest，mutations merge 回父
    child = createAgent({
      provider,
      tools: parent.tools,
      config: parent.config,
      cwd: parent.cwd,
      memory: parent.memory,
      overlay: CODER_OVERLAY,
      role: "coder",
    })
    child._logId = escId // LOGGING：子内事件归属（escalate#N）
    escT0 = Date.now()
    logEvent("child:spawn", { role: "escalate", id: escId, kind: "escalate" })
    const runner = ctx.runAgent ?? runAgent
    const runOpts = {
      depth: 1,
      maxTurns: parent.config?.agent?.subagentTurns ?? DEFAULT_SUBAGENT_TURNS, // review #7: constant, not literal (single source with subagent)
      signal: ctx.signal ?? null,
    }
    // Continue 经 runWithContinue（§7.2 D3，主会话同等 y/n 面板）：resume:true 不重注入
    // task 文本（setup 跳 input）且保留 child history + mutation 记账，刷新 turn 预算；
    // 无权限 handler（headless）或拒绝 → 部分工作返回；continue 次数无限（每轮可拒）。
    const report = await runWithContinue(
      async (childAgent, input, cbs, opts) => {
        // Merge mid-run mutations even when the run throws — the outer catch keeps
        // handling createAgent failures; AbortError still propagates (user Stop).
        try {
          return await runner(childAgent, input, cbs, opts)
        } catch (e) {
          mergeChildMutations(parent, childAgent)
          throw e
        }
      },
      child, task, { ...childCallbacks, onPermissionRequest: parent.autoApprove ? async () => true : (ctx.onPermissionRequest ?? null) },
      runOpts,
      {
        // escalate has NO permQueue: prompts go straight to the user (T-L spec).
        askContinue: (e) => (ctx.onPermissionRequest
          ? ctx.onPermissionRequest("continue", { turns: e.turn, agent: tag })
          : Promise.resolve(false)),
        onDeclined: (e, output) => `escalate (${tag}) ${TURN_CAP_MARK} (${e.turn} turns) — work may be partial; review recent_changes before deciding next steps.\nPartial output: ${output.slice(0, 2000)}`,
      },
    ).catch((e) => {
      // 非 ContinueError 运行失败：错误文本 + partial 输出（mutations 已在 runner 包装层 merge）
      if (ctx.signal?.aborted || e?.name === "AbortError") throw e
      escErr = { err: e?.message ?? String(e) } // LOGGING：错误路径（返回形态——不抛）
      return `escalate (${tag}) error: ${e?.message ?? String(e)}\nPartial output: ${(child._capturedOutput ?? "").slice(0, 2000)}`
    })
    // Escalate mutations are the parent's mutations: verify/advisor guards must see them
    mergeChildMutations(parent, child)
    if (escErr) logEvent("child:error", { role: "escalate", id: escId, ms: Date.now() - escT0, err: errText(escErr.err, 200) })
    else logEvent("child:done", { role: "escalate", id: escId, ms: Date.now() - escT0, kind: String(report).includes(TURN_CAP_MARK) ? "partial" : "ok" })
    // §7.2.3（round1 #2）：escalate 与 spawn 同享 ctx._subagentKey——同步完成精确冻
    // （relayPrefix 去尾 = `escalate#N`）。仅成功路径（escErr = 运行中途失败——不设
    // key——TUI 回落 escalate 角色启发式：escalate 串行 + 角色限定，天然精确——legacy
    // 行为不变——错误路径不触发冻结 round1 #1）。
    if (!escErr) ctx._subagentKey = escId
    return `escalate (${tag})${effortNote} post-op report:\n${report || (child._capturedOutput ?? "").slice(0, 4000)}${touchedFilesNote(child, parent.cwd)}`
  } catch (e) {
    // 仅 createAgent 失败/continue 询问抛出才到这（运行失败已在上面 catch 处理）
    if (child) {
      mergeChildMutations(parent, child)
      if (!escErr && !(ctx.signal?.aborted) && e?.name !== "AbortError") {
        logEvent("child:error", { role: "escalate", id: escId, ms: Date.now() - escT0, err: errText(e, 200) })
      }
    }
    if (ctx.signal?.aborted || e?.name === "AbortError") throw e
    return `escalate (${tag}) error: ${e?.message ?? String(e)}`
  }
}

/** Relative touched-file list appended to every escalate return (child paths are absolute). */
function touchedFilesNote(child, cwd) {
  const touched = child?._touchedFiles ?? []
  if (touched.length === 0) return ""
  const shown = touched.map((f) => {
    const r = relative(cwd ?? process.cwd(), f)
    return r && !r.startsWith("..") && !isAbsolute(r) ? r : f
  })
  return `\nTouched files: ${shown.join(", ")}`
}

/**
 * 共享 post-spawn 管线（阻塞与 async 同一条——§15 D-A1 "全不变"）：turn-cap continue
 * 循环 → 拒绝降级 partial 返回 → MIN_REPORT_CHARS 扩写 → eng-coder mutation merge →
 * designId 后缀。onDeclined 在此（两路同一形态）——只有 askContinue 不同：阻塞经权限
 * 面板询问；async 永不弹面板（自动拒绝；engineering && AUTO 自动 resume——§15 D-A3）。
 */
export async function runChildPipeline(child, input, childOpts, childRunOpts, { parent, role, args, askContinue }) {
  const declined = { partial: null }
  let report = await runWithContinue(
    (child, input, cbs, opts) => runAgent(child, input, cbs, opts), // opts = childRunOpts + resume (由管线管理)
    child, input, childOpts, childRunOpts,
    {
      askContinue,
      onDeclined: (e, output) => {
        if (role === "eng-coder" && child._mutatedThisRun) mergeChildMutations(parent, child)
        // 拒绝 = 早退语义：不带 MIN_REPORT_CHARS 扩写（对已 cap 的 child 追问长报告是错的）；
        // review #2：用管线捕获的 output（此时 report 仍 ""——runWithContinue 未返回）
        declined.partial = `Subagent (${role}) ${TURN_CAP_MARK} (${e.turn} turns) — work may be partial; review recent_changes before deciding next steps.\nPartial output: ${output || ""}`
      },
    },
  )
  if (declined.partial !== null) {
    // 被拒的 eng-coder 交付仍带 designId（fix round 以同 slot 重 spawn——2026-09-01）
    if (role === "eng-coder") declined.partial += `\ndesignId: ${args.designId ?? "(single-design session — designId optional)"} — reuse it (with the same designToken) when re-spawning this eng-coder.`
    return declined.partial
  }

  // 报告过短 = 交接不完整：送回扩写一次（kimi-code summaryPolicy: min 200 chars 同源）
  if (report.length < MIN_REPORT_CHARS) {
    report = await runAgent(child, REPORT_CONTINUATION, childOpts, childRunOpts)
  }

  // 工程模式机械码门：委托的文件改动不得绕过父侧 advisor/verify guard——eng-coder ONLY
  // 有意为之（review #8）：普通 coder 自带自评纪律；normal 模式无父侧 gate 可喂。
  // 只在实际 mutated 时 merge（防 runAgent 写前抛错时传播空 mutation 声明——纵深防御）
  if (role === "eng-coder" && child._mutatedThisRun) {
    mergeChildMutations(parent, child)
  }

  // designId 随交付报告（2026-09-01）：divergence audit fix round 用同一 designId+token 重 spawn
  if (role === "eng-coder") {
    report += `\ndesignId: ${args.designId ?? "(single-design session — designId optional)"} — reuse this designId with the same designToken (from the approved advisor type='design' review) when re-spawning this eng-coder for an audit fix round.`
  }

  return report
}

// ═══════════════════════════════════════════════════════════════════════════
// §20 子 agent 任务调度器（AGENT-LOOP.md §20——D-SD1..SD5 + 20.4 处置注）
// 池条目域元数据（D-SD2：entry._files/_dependsOn——running ∪ queued 全带）、准入
// （D-SD3：域冲突/依赖未满足 → queued 等位）、补位扫描（D-SD4：最早可启动——
// 依赖全满足 + 域无冲突——waiting 越行不阻塞 slot 位）、释放规则（D-SD5——round2
// #3 锁定默认：依赖取消/失败 → 依赖者留 queued 标 dependency cancelled——仅父显式
// 处置或 AUTO 自动启动）、终态墓碑（round1 #8/T-SD14：check/注入消费与取消写墓碑——
// consumed 视为满足；非 consumed unknown id 才拒）。状态全部派生不存储（单点事实）。
// ═══════════════════════════════════════════════════════════════════════════

/** 文件域归一化（round1 #5——路径归一化再交集）：相对 cwd 解析为绝对路径 + 去重；
 *  非字符串/空项静默跳过（声明错误 = false-negative 明示风险——v1 边界）。
 *  §20.8 D-F1.1（2026-09-04）：目录声明检测——fail-closed——尾斜杠形态 / 指向既有目录
 *  → throw（含路径——错误字符串英文定稿）——目录声明静默绕过冲突检测的通道闭合；
 *  调用方（subagent.mjs spawn 入口）catch → 错误即工具结果（模型可见——无静默）。
 *  已知限制（§20.8 未编号段——评审 #4）：不存在的目录声明（无尾斜杠 + 目录未创建）仍通过——不处理。 */
export function normalizeFileList(files, cwd) {
  const out = []
  for (const f of Array.isArray(files) ? files : []) {
    if (typeof f !== "string" || !f.trim()) continue
    if (f.endsWith("/") || f.endsWith("\\")) {
      throw new Error(`files must be file-level paths — directory declarations are not supported: ${f}`)
    }
    const abs = resolve(cwd ?? process.cwd(), f)
    if (existsSync(abs) && statSync(abs).isDirectory()) {
      throw new Error(`files must be file-level paths — directory declarations are not supported: ${f}`)
    }
    if (!out.includes(abs)) out.push(abs)
  }
  return out
}

/** 文件域相等比较键：Windows 大小写不敏感（vs Uri.fsPath 小写盘符差异同族——
 *  normalizeCwd 先例）——src/x vs ./src/X 在 win32 是同一文件。 */
const fileKey = (p) => (process.platform === "win32" ? p.toLowerCase() : p)

/** 两文件域首个共同文件（比较键）——无交集 null。 */
export function filesOverlap(a, b) {
  if (!a?.length || !b?.length) return null
  const keys = new Set(b.map(fileKey))
  const hit = a.map(fileKey).find((k) => keys.has(k))
  return hit ?? null
}

/** 冲突文件的显示形态（优先相对 cwd——面板/返回文本可读）。 */
function showFile(parent, key) {
  const cwd = parent.cwd ?? process.cwd()
  const rel = relative(cwd, key)
  return rel && !rel.startsWith("..") && !isAbsolute(rel) ? rel : key
}

/**
 * §20 依赖终态查询（单点事实——池条目 / pending（挂起期 settle 移交——注入前）/
 * 终态墓碑（check/注入消费——consumed；取消/失败——D-SD5 分支））：
 * - ok      = settle 成功（报告已产出）/ consumed（check/注入消费——T-SD14 视为满足）
 * - pending = running/queued 未终态（等启动/等完成）
 * - failed / cancelled = 终态但非成功——依赖者走 dependency cancelled 分支（round2 #3）
 * - unknown = 从未存在（spawn 时明确错误——非 consumed 的 unknown 拒——T-SD10）
 */
export function depInfo(parent, id) {
  const key = String(id)
  const e = parent._asyncSubagents?.get(key)
  if (e) {
    if (e.cancelled) return { state: "cancelled", role: e.role }
    if (e.done) return e.error != null ? { state: "failed", role: e.role } : { state: "ok", role: e.role }
    return { state: "pending", role: e.role }
  }
  const pend = (parent._pendingAsyncResults ?? []).find((x) => String(x.id) === key)
  if (pend) return pend.error != null ? { state: "failed", role: pend.role } : { state: "ok", role: pend.role }
  const t = parent._asyncTombstones?.get(key)
  if (t) return { state: t.status === "cancelled" || t.status === "failed" ? t.status : "ok", role: t.role }
  return { state: "unknown", role: null }
}

/** §20 等待态派生（无存储——refill/status/面板/spawn 返回同一事实源）。kind：
 *  - slot = 无阻塞（依赖全满足 + 域无冲突）——纯槽满等位（可启动——等 slot）
 *  - wait = 依赖未完成 / 域冲突（running ∪ queued——D-SD3 同界——self 除外）
 *  - depc = 依赖取消/失败（round2 #3——非 AUTO 锁住——需父显式处置；AUTO 视为可启动）
 *  detail 为状态行共享文本（面板 waiting for 标注 / status reason / spawn reason）。 */
export function describeBlockers(parent, entry) {
  const wait = []
  const depc = []
  for (const depId of entry._dependsOn ?? []) {
    const info = depInfo(parent, String(depId))
    if (info.state === "pending" || info.state === "unknown") {
      wait.push(`${info.role ?? "sub"}#${depId}（依赖未完成）`)
    } else if (info.state === "cancelled" || info.state === "failed") {
      if (parent.autoApprove) continue // AUTO 档自动启动（D-SD5——父不在场由 digest 决策）
      depc.push(`${info.role ?? "sub"}#${depId}`)
    }
  }
  const myFiles = entry._files ?? []
  if (myFiles.length > 0) {
    for (const e of parent._asyncSubagents?.values() ?? []) {
      if (e === entry) continue
      if (e.status !== "running" && e.status !== "queued") continue
      const hit = filesOverlap(myFiles, e._files ?? [])
      if (!hit) continue
      // §21.1 D-SL1.2（环形死锁修正——与 queueRunnable 同界——展示一致）：后入
      // 者（spawn 序晚于我——数字 id 比较）不列——只列"会真正阻断我的"（running
      // 任意序 + 先入 queued）；列后入者 = 误导"等一个其实等不到的人"。
      if (e.status === "queued" && Number(e.id) > Number(entry.id)) continue
      wait.push(`${e.role}#${e.id}（域冲突 ${showFile(parent, hit)}）`)
    }
  }
  // 长列表裁剪（块头宽度预算——细节 status 可查全量）
  const cut = (arr) => (arr.length > 3 ? [...arr.slice(0, 3), `…（共 ${arr.length} 项）`] : arr)
  if (depc.length > 0) {
    const body = cut(depc).join("、")
    return { kind: "depc", detail: wait.length > 0 ? `dependency cancelled: ${body}；${cut(wait).join("、")}` : `dependency cancelled: ${body} — waiting for your decision (cancel this task to release, or AUTO starts it)` }
  }
  if (wait.length > 0) return { kind: "wait", detail: `waiting for: ${cut(wait).join("、")}` }
  return { kind: "slot", detail: "" }
}

/** §20 D-SD4 补位判据：依赖全满足（AUTO 下 depc 放行）+ 域无冲突（running 任意序 +
 *  queued 先入者——§21.1 D-SL1.1 序判定：同文件串行 = 先入者先启动、后入者等先入者
 *  ——不自锁；先入者启动后以 running 身份继续挡住后入者——self 除外）。
 *  已知限制（§21.1 评审 #4——与 §20 NF-SD 同语义——滞留有意义不静默）：先入者被
 *  depc 锁定时（依赖取消/失败且非 AUTO——永不自动启动），后入者滞留等它——cancel
 *  先入者即释放（父显式可清；AUTO 档 depc 视为可启动——不滞留）。 */
export function queueRunnable(parent, entry) {
  for (const depId of entry._dependsOn ?? []) {
    const state = depInfo(parent, String(depId)).state
    if (state === "pending" || state === "unknown") return false
    if ((state === "cancelled" || state === "failed") && !parent.autoApprove) return false
  }
  const myFiles = entry._files ?? []
  if (myFiles.length > 0) {
    for (const e of parent._asyncSubagents?.values() ?? []) {
      if (e === entry) continue
      if (e.status !== "running" && e.status !== "queued") continue
      if (!filesOverlap(myFiles, e._files ?? [])) continue
      // §21.1 D-SL1.1 序判定：queued 仅"先入者"（spawn 序早于我——数字 id 比较）阻断；
      // 后入者不阻断——先入者先启动——两个 queued 同文件不再互等（环形死锁修正）。
      // 防御（评审 #3——id 形态）：池条目 id 为数字递增（_subAgentCounter——已核实）；
      // 异常形态 Number() 得 NaN → 比较 false → 不跳过 → 保守阻断（宁可多等——
      // 不冒险并发——防 NaN 误放行）。
      if (e.status === "queued" && Number(e.id) > Number(entry.id)) continue // 后入者不阻断——先入者先启动
      return false
    }
  }
  return true
}

/** §20 D-SD5 环防御（round2 #5——自然流程不可达：unknown id 拒 + spawn 序天然无环——
 *  仅人工向池注入可构造——防御断言定位）：从新 spawn 的依赖集出发沿池内条目
 *  _dependsOn 边做路径 DFS——路径上重复访问（可达环）→ 拒绝（A→B→A 永不自启——
 *  错误明确——T-SD5）。运行/排队条目皆可成环节点；池小（≤4 槽 + 有限队列）深度有限。 */
export function assertNoDepCycle(parent, dependsOn) {
  const edges = new Map()
  for (const e of parent._asyncSubagents?.values() ?? []) {
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
  for (const d of dependsOn) visit(String(d))
}

/** 依赖某 id 的 queued 条目显示标签（D-SD5 提醒/标注——依赖者列表）。 */
export function dependentLabels(parent, depId) {
  const key = String(depId)
  const out = []
  for (const e of parent._asyncQueue ?? []) {
    if ((e._dependsOn ?? []).some((d) => String(d) === key)) out.push(`${e.role}#${e.id}`)
  }
  return out
}

/** §20 D-SD3b 排队态面板刷新（⟦ev⟧queued 事件族——TUI routeSubToken 消费）：对全部
 *  queued 条目重算等待态并发射变化（去重 sig——kind/position/detail 全变才发）——
 *  调用点 = 一切队列突变与等待态变迁（spawn 入队 / settle 后补位与依赖转移 / cancel
 *  出队 / check 消费）。position = 队列序（D-A1 既有——cancel 前移同源）。 */
export function refreshQueuedTokens(parent, onToken) {
  if (typeof onToken !== "function") return
  const queue = parent._asyncQueue ?? []
  for (let i = 0; i < queue.length; i++) {
    const e = queue[i]
    const blk = describeBlockers(parent, e)
    const sig = `${blk.kind}\x1e${i + 1}\x1e${blk.detail}`
    if (e._lastQueuedSig === sig) continue
    e._lastQueuedSig = sig
    try {
      onToken(`${e.relayPrefix}⟦ev⟧queued\x1e${blk.kind}\x1e${i + 1}\x1equeued\x1e${blk.detail}`)
    } catch { /* relay 失败不影响池状态 */ }
  }
}

/**
 * Slot-queue refill (AGENT-LOOP.md §15 D-A1/D-A6 + §20 D-SD4): start queue heads
 * while a running slot is free — called from every settle (completion frees a slot)
 * and from the turn-end collection's refill loop. §20：队列现可混合 waiting-deps 与
 * slot-queued——扫描选"依赖全满足 + 域无冲突"的最早条目启动（waiting 越行不阻塞
 * 槽位；多任务同时解除按 queued 序逐个启动到槽满——上限 4 不变）。纯 slot 队列的
 * 行为与旧 shift 完全一致（全部条目可启动 → 最早 == 队首）。
 */
export function maybeRefillAsync(parent) {
  const queue = parent._asyncQueue ?? []
  for (;;) {
    const running = [...(parent._asyncSubagents?.values() ?? [])].filter((e) => e.status === "running").length
    if (running >= ASYNC_SUBAGENT_LIMIT) return
    let pick = -1
    for (let i = 0; i < queue.length; i++) {
      if (queueRunnable(parent, queue[i])) { pick = i; break }
    }
    if (pick < 0) return
    queue.splice(pick, 1)[0].start()
  }
}

/**
 * Inject one settled async entry into the parent history as a user-role reminder
 * (§17 D-S3 — single shared form for BOTH consumption points: turn-end collection
 * (collectSettledAsync, agent.mjs) and the run-start _pendingAsyncResults injection;
 * the message shape is identical to the §15 collector's). Consumed = the caller
 * removes the entry from its container; no double-inject across the two paths.
 */
export async function injectAsyncResult(agent, entry) {
  const body = entry.error ?? entry.report ?? "(no report)"
  const preview = await offloadToolResult(String(body), `async-subagent-${entry.id}`)
  pushReal(agent, {
    role: "user",
    content: `[System reminder: async subagent #${entry.id} (${entry.role}) finished]\n${escapeXml(preview)}`,
  })
  // §20 D-SD5 终态墓碑：本函数是全部自动注入路径的共享形态（回合尾 collect + 挂起
  // digest 首行注入）——注入即消费（调用方随即从容器移除）——dependsOn 引用该 id 的
  // 后续 spawn 视为已满足（T-SD14 同 check 消费语义；error 条目记 failed——依赖取消/
  // 失败分支照旧，不误标成功）。
  const tombstones = (agent._asyncTombstones ??= new Map())
  tombstones.set(String(entry.id), { status: entry.error != null ? "failed" : "consumed", role: entry.role })
}

/**
 * Child agent run options — the parent's abort signal MUST propagate to the
 * child: without it, Ctrl+C aborts the parent's controller but the child keeps
 * running its full turn budget (up to subagentTurns) while the parent awaits —
 * the interrupt appears to do nothing.
 * §17 D-S9: during a suspension session children share the SESSION signal instead
 * (agent._sessionSignal) — a digest's own Ctrl+I/Ctrl+C must not abort the whole
 * pool; the session driver aborts the session controller to stop everything.
 */
export function buildChildRunOpts(ctx) {
  return {
    depth: (ctx.depth ?? 0) + 1,
    maxTurns: ctx.agent?.config?.agent?.subagentTurns ?? DEFAULT_SUBAGENT_TURNS,
    signal: ctx.agent?._sessionSignal ?? ctx.signal ?? null,
  }
}

/**
 * Merge an eng-coder child's mutations into the parent agent's bookkeeping.
 * The parent must stay aware of delegated file changes: `_touchedFiles` enables
 * the advisor guard (completion.mjs) to detect that code was modified and
 * pushback for review. Prior verify/advisor state is invalidated because it
 * judged an older state.
 *
 * `_advisorRound` is NOT reset: merged code enters the CURRENT convergence
 * cycle. Resetting here would break the review→fix→re-review loop (the parent
 * reviews, spawns an eng-coder to fix, merges, reviews again — every merge
 * would restart at round 1 and the 5-round cap could never be reached).
 * `_calledAdvisorThisRun` IS cleared so the merged code triggers a fresh
 * advisor call (the guard demands review of new mutations).
 *
 * Returns true when mutations were merged (kept for future caller checks).
 */
export function mergeChildMutations(parent, child) {
  // A child claiming mutations without any touched file is a misbehaving
  // child (or a bookkeeping bug) — do not propagate an empty mutation claim
  // to the parent's guard state.
  if (!child._mutatedThisRun || !(child._touchedFiles?.length)) return false
  parent._mutatedThisRun = true
  for (const abs of child._touchedFiles ?? []) {
    if (!parent._touchedFiles.includes(abs)) parent._touchedFiles.push(abs)
  }
  if (parent._calledAdvisorThisRun) parent._calledAdvisorThisRun = false
  if (parent._verifiedThisRun) {
    parent._verifiedThisRun = false
    parent._verifyPassed = undefined
  }
  // Stale session cleanup only — the round counter survives (see above).
  parent._advisorSession = null
  return true
}
