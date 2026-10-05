/**
 * subagent-actions-query.mjs — subagent 查询面执行器 + 摘要助手族（2026-09-28 拆分批 · R3——
 * 自 `subagent-actions.mjs`（498/499 贴 500 硬限）外提查询面：status ∕ observe 两执行器 +
 * 留痕文本构造（`touchedSummary` / `shortTouchedPath`）；各函数**逐字迁移**、零行为改）。
 * 原档 re-export `executeStatusAction` / `executeObserveAction` 保 `subagent.mjs` 与各消费档
 * 的既有 import 面（路径与名面不动——subagent-panel 尾部 re-export 先例）。
 * 依赖 = `subagent-scheduler.mjs`（describeBlockers / detectStall / STALL_NOTE）·
 * `async-settle.mjs`（getAsyncPool accessor）· `checkpoint.mjs`（turnCapTrace）——三者均
 * 不回引本档（无环）。
 */
import { isAbsolute, relative } from "node:path"
import { describeBlockers, detectStall, STALL_NOTE } from "./subagent-scheduler.mjs"
// ASYNC-RESULT-CONTAINER.md D1：池 accessor（absorb 双池——advisor 独立池无队列）
import { getAsyncPool } from "./async-settle.mjs"
import { turnCapTrace } from "./checkpoint.mjs"
// §6.31.6 未清算可见面（批 digest-accounting · 2026-10-05 · 台账 #930）：unsettled 段 + 单查续查
import { unsettledRow, unsettledRows } from "../agent/digest-account.mjs"

/**
 * subagent action:"status" (AGENT-LOOP-SUBAGENT.md §6.7 D-M2, new): NON-BLOCKING async-pool query —
 * returns immediately and never consumes a result (results belong to the auto
 * channel — AGENT-LOOP-SUBAGENT.md §6.7.5: no check action any more). Source of truth = the pool
 * (_asyncSubagents): entries moved to _pendingAsyncResults during a suspension
 * (AGENT-LOOP-ASYNC-POOL.md §6.8 D-S3 ② — injected at the next run start) are no longer in the pool and
 * are NOT counted as done-waiting.
 * - id given → { id, role, status, model?, elapsedSec?, turn?, maxTurns?,
 *   touchedFiles?/touchedMore?/touched? ... } for that entry; when the id matches neither pool it
 *   falls through to `_pendingAsyncResults` / `_unsettledDigests` (§6.31.6 — same row shape);
 *   unknown everywhere → error (T12 semantics — unknown async-subagent id error, same wording as the pool).
 * - id omitted → { overview: { running: [...], queued: [...], done: [...],
 *   unsettled: [{id, role, state, attempts, preview?}] } } — live queue positions (index in
 *   _asyncQueue + 1); the unsettled section lists every entry still awaiting settlement
 *   (awaiting-digest / retrying) plus the upgraded ledger (§6.31.6).
 * AGENT-LOOP-SUBAGENT.md §6.7.2: running 条目带 touched files 摘要（touchedFiles 前 5 + touchedMore 超出
 * 计数——相对查询方 cwd；0 改动 → touched 占位）；queued 条目带 touched 占位
 * "—（未启动）"；done/error/取消条目无 touched 字段（round3 #9）。
 * A settled-but-unconsumed entry (settled during a NORMAL turn) reports done
 * with a "not yet consumed" note — the auto channel (turn-end collection / the
 * suspension digest) still delivers it afterwards (AGENT-LOOP-SUBAGENT.md §6.7.5: sole consumption path).
 */
/** AGENT-LOOP-SUBAGENT.md §6.7.2 D-M5 decision-field assembly (F9): running entries report
 *  {id, role, model, elapsedSec, turn, maxTurns} — the data needed to decide
 *  WHO to cancel. Model is recorded at spawn (childProvider), startedAt at
 *  ACTUAL start (queued waits don't count), turn/maxTurns mirrored from the
 *  child's ⟦ev⟧turn events at the callbacks-wrap layer (subagent.mjs tracker).
 *  elapsedSec computed at call time from startedAt. */
/** AGENT-LOOP-SUBAGENT.md §6.7.2 D-SF2/N-SF1 摘要形态：status 调用时实时读 entry.childAgent._touchedFiles
 *  （绝对路径——per-run 记账）→ 相对查询方 cwd；cwd 之外保留绝对形态 +
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
  // AGENT-LOOP-ASYNC-POOL.md §6.11 #1（第 10 批——双池并表）：评审池条目专属字段面——role 区分两池；子代理条目
  // 字段面零变化（NFR-B2）。reviewType(design|code) / round / elapsedSec——与子代理
  // 的 turn/maxTurns 而非（评审无子回合预算语义）。
  if (entry.role === "advisor") {
    const base = { id: String(entry.id), role: entry.role, reviewType: entry.reviewType ?? null, round: entry.round ?? entry.run?.round ?? null }
    if (entry.model != null) base.model = entry.model
    if (entry.startedAt) base.elapsedSec = Math.max(0, Math.round((Date.now() - entry.startedAt) / 1000))
    return base
  }
  const base = { id: String(entry.id), role: entry.role }
  if (entry.status === "running") {
    base.model = entry.model ?? null
    base.elapsedSec = entry.startedAt ? Math.max(0, Math.floor((Date.now() - entry.startedAt) / 1000)) : 0
    base.turn = entry.turn ?? 0
    base.maxTurns = entry.maxTurns ?? 0
    // AGENT-LOOP-SUBAGENT.md §6.7.2：touched files 摘要（T-SF1..4——新字段追加——既有字段零破坏）
    Object.assign(base, touchedSummary(entry, cwd), { turnCap: turnCapTrace(entry) })
  } else if (entry.status === "queued") {
    // AGENT-LOOP-SUBAGENT.md §6.7.2 T-SF2b：未启动——确定性占位（不崩；无对象可读）
    base.touched = "—（未启动）"
  }
  return base
}

export function executeStatusAction(args, ctx) {
  // #46（批 TOOLFACE-FIXES ①——设计 AGENT-LOOP-SUBAGENT.md §6.25 ①）：七动作族 depth 门收口——
  // status 与 observe/send/escalate/cancel/panel freeze 同为 depth-0 专有（子代无自有异步池）；
  // 缺门时子代静默空 overview（把「不可用」读成「无在飞」）。族锚取现行可解析节号（§6.7.2）。
  if ((ctx.depth ?? 0) > 0) {
    return JSON.stringify({ status: "error", error: "status is only available at depth 0 — a child agent has no async pool of its own" })
  }
  const agent = ctx.agent
  const map = getAsyncPool(agent, "subagent") ?? new Map()
  const advisors = getAsyncPool(agent, "advisor") ?? new Map()
  const queue = agent._asyncQueue ?? []
  const queuedPosition = (id) => {
    const i = queue.findIndex((e) => String(e.id) === id)
    return i >= 0 ? i + 1 : undefined
  }
  const { id } = args ?? {}
  if (id !== undefined && id !== null && String(id) !== "") {
    const key = String(id)
    // AGENT-LOOP-ASYNC-POOL.md §6.10 D-24b: by-id queries fall through to the advisor pool (shared counter —
    // ids are unique across both pools; role identifies the kind).
    const entry = map.get(key) ?? advisors.get(key)
    if (!entry) {
      // §6.31.6（消化账务批）：续查 pending / 升级账本同解析——三处皆无 ⇒ 原错误文案不变。
      const row = unsettledRow(agent, key)
      if (row) return JSON.stringify(row)
      // Wording kept exact — locked by subagent-async/tool tests (unknown-id error
      // semantics); an unknown id simply names neither pool (the pools share the
      // id counter, so the message stays unambiguous).
      return JSON.stringify({ id: key, status: "error", error: `unknown async subagent id: ${key}` })
    }
    const target = statusFields(entry, agent.cwd)
    if (entry.status === "running") return JSON.stringify({ ...target, status: "running" })
    if (entry.status === "queued") {
      // AGENT-LOOP-SUBAGENT.md §6.9 F-SD4/D-SD3b：waiting 语义对模型可见——排队原因（冲突对象/依赖对象）随
      // status 返回；纯槽满等位（kind slot）无 waiting 字段（position 已足够）。
      const blk = describeBlockers(agent, entry)
      const out = { ...target, status: "queued", position: queuedPosition(key) ?? entry.position }
      if (blk.kind !== "slot") {
        out.waiting = blk.kind === "depc" ? "dependency-cancelled" : "waiting-deps"
        out.reason = blk.detail
      }
      // §6.9 P-SL2（D-SL2）：停滞机械标记——池停滞时本任务所在闭环阻塞链随 status
      // 返回（F-SL2——status 视图可显示停滞——模型可见——零正常路径字段变化）。
      const stall = detectStall(agent)
      if (stall) {
        const chain = stall.chains.find((c) => c.task === entry)?.text
        if (chain) out.stall = { chain, note: STALL_NOTE }
      }
      return JSON.stringify(out)
    }
    // done = settled during this turn and not yet consumed — the auto channel still
    // delivers it (AGENT-LOOP-SUBAGENT.md §6.7.5: turn-end collection / the suspension digest — no fetch action).
    target.status = "done"
    target.done = true
    if (entry.error) target.error = entry.error
    target.note = "settled, not yet consumed — delivered by the auto channel (turn-end collection or the suspension digest injects it)"
    return JSON.stringify(target)
  }
  const overview = { running: [], queued: [], done: [], unsettled: unsettledRows(agent) }
  const mapEntries = [...map.values(), ...advisors.values()]
  for (const entry of mapEntries) {
    if (entry.status === "running") overview.running.push(statusFields(entry, agent.cwd))
    else if (entry.status === "queued") {
      // §6.9：queued 条目补 waiting/reason（F-SD4——依赖/冲突原因模型可见）；
      // AGENT-LOOP-SUBAGENT.md §6.7.2 T-SF2b：未启动占位（确定性——不崩）。
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
  // §6.9 P-SL2（D-SL2）：停滞机械标记——overview 级标注（可显示停滞——F-SL2）——
  // 链文本随视图返回（逐条——每 queued 条目一行——闭环可破环引导同挂）。
  const stall = detectStall(agent)
  if (stall) {
    overview.stall = {
      chains: stall.chains.map((c) => c.text),
      note: STALL_NOTE,
    }
  }
  return JSON.stringify({ overview })
}

// ═══════════════════════════════════════════════════════════════════════════
// SUBAGENT-OBSERVE-SEND（SUBAGENT-OBSERVE-SEND.md——CLI 端）
// observe（D1——readonly 查询）+ send（D2——控制类豁免注入引导）——动作执行器。
// 目标 = 父自身 spawn 的异步子代理池条目（_asyncSubagents——非 advisor/escalate——
// 后者共享 id 计数但非"读写子代理"，错误路径明示）。
// ═══════════════════════════════════════════════════════════════════════════

/** D1/N2 摘要形态：从子代理 _fullHistory（real 消息——pushReal 累积）倒序收最近 N 个
 *  assistant 回合的一行描述（newest-first；assistant 消息 = 一回合——带 tool_calls =
 *  工具轮、独立 content = 回复首行）。返回纯摘要非全量（N2 隔离——不把子代理噪音灌父）。 */
function recentTurnLines(child, limit) {
  const hist = child?._fullHistory
  if (!Array.isArray(hist)) return []
  const out = []
  for (let i = hist.length - 1; i >= 0 && out.length < limit; i--) {
    const m = hist[i]
    if (m?.role !== "assistant") continue
    const tcs = Array.isArray(m.tool_calls)
      ? m.tool_calls.filter((t) => typeof t?.function?.name === "string")
      : []
    if (tcs.length) out.push(`tools: ${tcs.map((t) => t.function.name).join(", ")}`)
    else if (typeof m.content === "string" && m.content.trim()) {
      const first = m.content.trim().split(/\r?\n/).find((l) => l.trim())
      out.push((first ?? m.content.trim()).slice(0, 120))
    } else out.push("(assistant — no content)")
  }
  return out
}

function queuedPositionOf(agent, key) {
  const i = (agent?._asyncQueue ?? []).findIndex((e) => String(e.id) === key)
  return i >= 0 ? i + 1 : undefined
}

/** recent 参数钳制（默认 ~5 条摘要——可参数；钳到 1..20 防超长 N2 失控）。 */
function clampRecent(n) {
  const v = Number.parseInt(n, 10)
  if (!Number.isFinite(v)) return 5
  return Math.max(1, Math.min(20, v))
}

/**
 * subagent action:"observe"（D1——READONLY 查询，父回合内）：按 id 拉运行中异步子代理的
 * 最近活动快照——从 entry.childAgent（subagent-run.mjs start() 绑定）读**已落回合**摘要
 * （_fullHistory 最近 N 条）+ _touchedFiles + turn/maxTurns + status + **in-flight 当前
 * 工具**（评审 #1——从 dispatch runOne 维护的 child._inflightTools 读——非只读已落
 * history：卡在长工具调用时 history 无新回合、恰是 observe 要检测的卡死态）。返摘要非
 * 全量（N2）。observe = readonly——running/queued/done 均可查（done 终报 / queued 占位）。
 */
export function executeObserveAction(args, ctx) {
  if ((ctx.depth ?? 0) > 0) {
    return JSON.stringify({ status: "error", error: "observe is only available at depth 0 — a child agent has no async pool of its own" })
  }
  const agent = ctx.agent
  const id = args?.id
  if (id === undefined || id === null || String(id) === "") {
    return JSON.stringify({ status: "error", error: "observe requires the id of the async subagent to inspect (from the async spawn return) — pass the id; omitting it observes nothing" })
  }
  const key = String(id)
  const entry = getAsyncPool(agent, "subagent")?.get(key)
  if (!entry) {
    if (getAsyncPool(agent, "advisor")?.has(key)) {
      return JSON.stringify({ status: "error", error: `id ${key} is an async ADVISOR review — observe is for async subagents (read/edit children); track an advisor with action:'status' or wait for its auto-delivered report` })
    }
    return JSON.stringify({ status: "error", error: `unknown async subagent id: ${key}` })
  }
  const child = entry.childAgent
  const out = { id: key, role: entry.role, status: entry.status }
  if (entry.status === "running") {
    out.turn = entry.turn ?? 0
    out.maxTurns = entry.maxTurns ?? 0
    Object.assign(out, touchedSummary(entry, agent.cwd), { turnCap: turnCapTrace(entry) })
    // in-flight 当前工具（评审 #1）：child._inflightTools Set——dispatch runOne 在工具
    // 执行前后维护——LLM 生成/工具间空隙为空；子代理 await 长工具调用时父回合可见它。
    const inflight = child?._inflightTools
    if (inflight instanceof Set && inflight.size > 0) out.currentTool = [...inflight]
    const n = clampRecent(args?.recent)
    out.recentTurns = recentTurnLines(child, n)
    out.note = `observing running ${entry.role}#${key} — recentTurns newest-first (cap ${n}); currentTool shown only while a tool is executing (stuck detection); sent directions consume at the next turn boundary`
  } else if (entry.status === "queued") {
    out.position = queuedPositionOf(agent, key) ?? entry.position ?? null
    out.note = "queued — not started yet; no activity to observe (starts when the slot frees / dependencies clear; action:'send' targets running only)"
  } else {
    // done = settled this turn, not yet consumed — final report rides the auto channel.
    out.done = true
    out.turn = entry.turn ?? 0
    out.maxTurns = entry.maxTurns ?? 0
    out.recentTurns = child ? recentTurnLines(child, clampRecent(args?.recent)) : []
    out.note = "settled — the final report is delivered by the auto channel (turn-end collection or the suspension digest); observe returns the activity summary, not the full report (N2)"
  }
  return JSON.stringify(out)
}
