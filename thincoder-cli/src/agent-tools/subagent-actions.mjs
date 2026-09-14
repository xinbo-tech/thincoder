/**
 * subagent-actions.mjs — subagent 动作执行器（§19/§19.5/§19.6——2026-09-05 自
 * subagent-async.mjs 拆分——Module Split Policy §20.9——纯迁移零行为变化）。
 * 内容：executeStatusAction（§19.5 D-M5——非阻塞池查询——touchedSummary/
 * shortTouchedPath/statusFields 摘要助手随行）/ executeObserveAction + executeSendAction
 * （SUBAGENT-OBSERVE-SEND——observe 只读/send 控制豁免注入）/ executeEscalateAction（§19
 * D-M4——飞刀——touchedFilesNote 随行）。
 * §19.8 check 删除后仅 cancel 动作执行器与共享 post-spawn 管线留在 subagent-async.mjs；
 * §20 调度器 + 文件域组在 ./subagent-scheduler.mjs（describeBlockers 由此导入）。
 * 2026-09-08 二次拆分：§19.6 面板段迁至 ./subagent-panel.mjs（601 > 500 硬限跨档——
 * 尾部 re-export executePanelAction 保 subagent.mjs 既有 import 面）+ ASYNC-RESULT-
 * CONTAINER.md D1 落地（池访问点改 getAsyncPool accessor）。
 */
import { isAbsolute, relative } from "node:path"
import { runAgent, createAgent, DEFAULT_SUBAGENT_TURNS } from "@thincoder/core/agent.mjs"
import {
  runWithContinue, TURN_CAP_MARK, makeRelay, wrapChildCallbacks,
  ensureChildApiKey, clampEffort,
} from "@thincoder/core/agent/spawn-child.mjs"
import { logEvent, errText } from "@thincoder/core/log.mjs"
import { describeBlockers, detectStall, STALL_NOTE } from "./subagent-scheduler.mjs"
import { resolveChildProvider, mergeChildMutations } from "./subagent-async.mjs"
import { launchEscalateAsync } from "@thincoder/core/agent-tools/escalate-async.mjs"
// TUI-OOM-ROOTCAUSE §23.3.1：子代理人读线窗口常量（单源——store 零依赖）。
import { RECORD_WINDOW_MESSAGES } from "@thincoder/core/session-store.mjs"
// ASYNC-RESULT-CONTAINER.md D1：池 accessor（absorb 双池——advisor 独立池无队列）
import { getAsyncPool } from "./async-settle.mjs"

/**
 * subagent action:"status" (§19 D-M2, new): NON-BLOCKING async-pool query —
 * returns immediately and never consumes a result (results belong to the auto
 * channel — §19.8: no check action any more). Source of truth = the pool
 * (_asyncSubagents): entries moved to _pendingAsyncResults during a suspension
 * (§17 D-S3 ② — injected at the next run start) are no longer in the pool and
 * are NOT counted as done-waiting.
 * - id given → { id, role, status, model?, elapsedSec?, turn?, maxTurns?,
 *   touchedFiles?/touchedMore?/touched? ... } for that entry; unknown id → error
 *   (T12 semantics — unknown async-subagent id error, same wording as the pool).
 * - id omitted → { overview: { running: [{id, role, model, elapsedSec, turn,
 *   maxTurns, touchedFiles?/touched?}], queued: [{id, role, position, touched?}],
 *   done: [{id, role}] } } — live queue positions (index in _asyncQueue + 1).
 * §19.5.6: running 条目带 touched files 摘要（touchedFiles 前 5 + touchedMore 超出
 * 计数——相对查询方 cwd；0 改动 → touched 占位）；queued 条目带 touched 占位
 * "—（未启动）"；done/error/取消条目无 touched 字段（round3 #9）。
 * A settled-but-unconsumed entry (settled during a NORMAL turn) reports done
 * with a "not yet consumed" note — the auto channel (turn-end collection / the
 * suspension digest) still delivers it afterwards (§19.8: sole consumption path).
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
  // §18.3 #1（第 10 批——双池并表）：评审池条目专属字段面——role 区分两池；子代理条目
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
    // §11.2 D-24b: by-id queries fall through to the advisor pool (shared counter —
    // ids are unique across both pools; role identifies the kind).
    const entry = map.get(key) ?? advisors.get(key)
    if (!entry) {
      // Wording kept exact — locked by subagent-async/tool tests (unknown-id error
      // semantics); an unknown id simply names neither pool (the pools share the
      // id counter, so the message stays unambiguous).
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
      // §21.1 P-SL2（D-SL2）：停滞机械标记——池停滞时本任务所在闭环阻塞链随 status
      // 返回（F-SL2——status 视图可显示停滞——模型可见——零正常路径字段变化）。
      const stall = detectStall(agent)
      if (stall) {
        const chain = stall.chains.find((c) => c.task === entry)?.text
        if (chain) out.stall = { chain, note: STALL_NOTE }
      }
      return JSON.stringify(out)
    }
    // done = settled during this turn and not yet consumed — the auto channel still
    // delivers it (§19.8: turn-end collection / the suspension digest — no fetch action).
    target.status = "done"
    target.done = true
    if (entry.error) target.error = entry.error
    target.note = "settled, not yet consumed — delivered by the auto channel (turn-end collection or the suspension digest injects it)"
    return JSON.stringify(target)
  }
  const overview = { running: [], queued: [], done: [] }
  const mapEntries = [...map.values(), ...advisors.values()]
  for (const entry of mapEntries) {
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
  // §21.1 P-SL2（D-SL2）：停滞机械标记——overview 级标注（可显示停滞——F-SL2）——
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
    return JSON.stringify({ status: "error", error: "observe is only available at depth 0 — a child agent has no async pool of its own (AGENT-LOOP.md §7.2)" })
  }
  const agent = ctx.agent
  const id = args?.id
  if (id === undefined || id === null || String(id) === "") {
    return JSON.stringify({ status: "error", error: "observe requires the id of the async subagent to inspect (from the async spawn return) — pass the id; omitting it observes nothing (SUBAGENT-OBSERVE-SEND)" })
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
    Object.assign(out, touchedSummary(entry, agent.cwd))
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

/**
 * subagent action:"send"（D2——控制类豁免，同 cancel/panel-freeze——父回合内显式调用即
 * 授权）：按 id 向运行中异步子代理注入一条引导消息——push 进 entry._injected（仅 running
 * 异步可 send）；子回合边界经 consumeInjected 回调消费 → pushReal 成 user 回合进子历史
 * → 当作普通指令处理（注入不等同偏离豁免——子收敛/审计纪律不变）。settle/cancel/unknown
 * /queued → 明确错误。send→settle 竞态：入队后子未及下回合边界即 settle → 消息未投递
 * → settle 收尾附报告提示（不在此报错——send 返回时无法预知）。
 */
export function executeSendAction(args, ctx) {
  if ((ctx.depth ?? 0) > 0) {
    return JSON.stringify({ status: "error", error: "send is only available at depth 0 — a child agent has no async pool of its own (AGENT-LOOP.md §7.2)" })
  }
  const agent = ctx.agent
  const id = args?.id
  if (id === undefined || id === null || String(id) === "") {
    return JSON.stringify({ status: "error", error: "send requires the id of the running async subagent to direct (from the async spawn return) — omitting it means an unspecified target (SUBAGENT-OBSERVE-SEND)" })
  }
  const message = args?.message
  if (typeof message !== "string" || !message.trim()) {
    return JSON.stringify({ status: "error", error: "send requires the message to inject — the direction the running subagent should treat as an ordinary user instruction at its next turn boundary" })
  }
  const key = String(id)
  const entry = getAsyncPool(agent, "subagent")?.get(key)
  if (!entry) {
    if (getAsyncPool(agent, "advisor")?.has(key)) {
      return JSON.stringify({ status: "error", error: `id ${key} is an async ADVISOR review — send is for async subagents; you cannot inject direction into a running review (AGENT-LOOP.md §7.2) — track it with action:'status' (role:"advisor") or wait for its report to arrive automatically` })
    }
    return JSON.stringify({ status: "error", error: `unknown async subagent id: ${key}` })
  }
  if (entry.done || entry.cancelled) {
    return JSON.stringify({ status: "error", error: `async subagent #${key} has ${entry.cancelled ? "been cancelled" : "already settled"} — nothing to send (you cannot inject into a finished subagent; re-spawn with the direction instead)` })
  }
  if (entry.status !== "running") {
    return JSON.stringify({ status: "error", error: `async subagent #${key} is ${entry.status} (not running) — send only targets a RUNNING async subagent; a queued one has not started its turn loop yet` })
  }
  entry._injected ??= []
  entry._injected.push(String(message).trim())
  return JSON.stringify({
    id: key,
    status: "delivered",
    queued: entry._injected.length,
    note: `message queued for ${entry.role}#${key} — consumed as an ordinary user instruction at its next turn boundary (after its current tool finishes — non-interrupting). If it settles first, its report carries an "undelivered" note.`,
  })
}

// ═══════════════════════════════════════════════════════════════════════════
// §19.6 subagent panel 检查工具（AGENT-LOOP.md §19.6——F-P1..P3/D-P1..P4）
// ═══════════════════════════════════════════════════════════════════════════
// 2026-09-08 拆分（Module Split Policy——601 > 500 硬限跨档）：§19.6 面板段迁至
// @thincoder/core/agent-tools/subagent-panel.mjs（2026-09-14 S2 U12 迁核；
// executePanelAction/panelFreezeGate/blockKeyIn——verbatim + ASYNC-RESULT-CONTAINER
// D1/D2 落地）；本面保留 re-export 保 subagent.mjs 既有 import 面（subagent-async
// 尾部 re-export 先例）。
export { executePanelAction } from "@thincoder/core/agent-tools/subagent-panel.mjs"

/**
 * subagent action:"escalate"（§19 D-M4——退役 escalate 工具语义原样，ESCALATE.md；
 * §25 D-R17b——R17：缺省 async——后台飞刀 + settle 三分类 digest——async:false 保
 * 同步旧路径）。飞刀——交给 consultModels 池里更强模型（WRITE + 术后报告）。约束全
 * 保留：depth-0 only / 工程模式拒 / consultModels 空拒 / relay 前缀 `escalate#N/`
 * （与既有前缀同名——TUI 路由零改动）/ mutations merge 回父（async 路径在 settle 分类）。
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

  // §25 D-R17b (R17 — 决策点 ③): escalate 缺省 async — the launch returns an ack
  // {id, role:"escalate", status:"running"|"queued"} and the flight runs in the
  // background (shared other pool; settle 三分类 → pending 单容器 digest——
  // ASYNC-RESULT-CONTAINER.md D2)。
  // `async: false` keeps the legacy synchronous flight below (backward compat).
  if (args?.async !== false) {
    return launchEscalateAsync(parent, ctx, { task: String(task), provider, tag, effortNote })
  }

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
    // G3（施工②）：overlay 摘除——coder 人格槽由 assemblePrompt 场景表承载（G3 映射）。
    child = createAgent({
      provider,
      tools: parent.tools,
      config: parent.config,
      cwd: parent.cwd,
      memory: parent.memory,
      role: "coder",
    })
    child._historyWindow = RECORD_WINDOW_MESSAGES // TUI-OOM-ROOTCAUSE §23.3.1：子代理人读线窗口（四处创建点同置）
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
        // sync escalate has NO permQueue——async 飞行权限走 _permQueue（escalate-async.mjs）: prompts go straight to the user (T-L spec).
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