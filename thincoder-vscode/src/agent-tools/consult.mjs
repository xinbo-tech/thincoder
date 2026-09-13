/**
 * consult.mjs — multi-model consultation ("会诊", AGENT-LOOP.md §25 R17; docs/
 * design/CONSULTATION.md 为历史机制文档——工具面现为 TWO tools: consult_start
 * (non-blocking spawn) / consult_stop (cancel) — consult_check 退役 (§25 决策点 ①:
 * digest 自动注入后无消费对象). Replies arrive AUTOMATICALLY: when every model
 * has settled (all replies/failures in — partial settle never early-injects), the
 * session moves to the pending single-container (history._pendingAsyncResults
 * +role——ASYNC-RESULT-CONTAINER.md D2，2026-09-08——_pendingConsultResults 独立族废弃) and the
 * next run's first-line injection delivers the full digest ("[System reminder:
 * consultation #id finished — N replies: ...]", per-model verbatim). The main
 * agent judges in the digestion turn — the mechanism does ZERO judging.
 *
 * Sessions survive the spawning turn (cross-run carrier = history._consultSessions
 * at depth 0, mirroring the _asyncSubagents pool pattern): the suspension driver
 * counts live sessions, a full settle parks into the pending stream while the
 * user is idle (digest auto-turn), consult_stop/abort discards without parking.
 */
import { buildProvider } from "../extension/presets.mjs"
import { specForModel } from "../specs.mjs"
import { logEvent, errText } from "../log.mjs"
import { escapeXml, offloadToolResult, pushReal } from "../agent/run-helpers.mjs"
import { getAsyncPool, removeFromAsyncPools } from "./subagent-scheduler.mjs"
import { settleAsyncEntry, buildChildSignal } from "./async-settle.mjs"
import { digestBudgetOver, persistOverflowReport } from "./digest-budget.mjs" // B5（群 B 批 §16 D-DG2）：digest 注入预算单源

/** Read-only tool injected into consultation children (via runAgent opts.extraTools).
 *  Lets the consultant pull the main agent's conversation history on demand —
 *  the failure trail is first-class evidence, not a retelling. */
export function makeMainHistoryTool(parentAgent) {
  return {
    name: "main_history",
    readonly: true,
    description:
      "Read the main agent's conversation history — what has been tried, the exact errors, recent context. " +
      "Use it to ground your analysis in the actual failure trail instead of guessing.\n" +
      "Parameters:\n" +
      "- limit: Number of recent messages to return (default 20, max 100)",
    parameters: {
      type: "object",
      properties: { limit: { type: "number", description: "Recent messages (default 20, max 100)" } },
    },
    async execute({ limit }) {
      const n = Math.min(Math.max(limit ?? 20, 1), 100)
      const h = parentAgent?.history ?? []
      const slice = h.slice(-n)
      if (slice.length === 0) return "(empty history)"
      const render = (m) => {
        // Multimodal content: replace base64 image payloads (a pasted screenshot is a
        // 100k-token bomb; meta-review D5) and surface tool_calls (assistant turns with
        // content:null would otherwise render as "null" and hide what the agent ran).
        let content
        if (typeof m.content === "string") content = m.content
        else if (Array.isArray(m.content)) {
          content = m.content.map((part) => {
            if (part?.type === "image_url" || part?.type === "image") return "[image omitted]"
            if (part?.type === "text") return part.text ?? ""
            return JSON.stringify(part)
          }).join("\n")
        } else content = m.content == null ? "" : JSON.stringify(m.content)
        const calls = Array.isArray(m.tool_calls)
          ? m.tool_calls.map((c) => `[tool: ${c.function?.name ?? c.name}(${String(c.function?.arguments ?? c.args ?? "").slice(0, 200)})]`).join("\n")
          : ""
        return `--- [${m.role}] ---\n${content}${calls ? "\n" + calls : ""}`
      }
      // Total byte budget — 100 × 16KB offload-sized tool results would be 1.6MB of context.
      const BUDGET = 60_000
      let out = ""
      for (let i = slice.length - 1; i >= 0; i--) {
        const line = render(slice[i])
        if (out.length + line.length > BUDGET) { out = `(earlier messages trimmed — budget ${BUDGET} chars)\n\n` + out; break }
        out = out ? line + "\n\n" + out : line
      }
      return out
    },
  }
}

function consultLabel(m) {
  return `${m.provider}:${m.model}`
}

// ─── §25 R17 会话跨 run 容器（AGENT-LOOP.md §25 D-R17a——VS Code 镜像）───
// 会话沿共享 depth-0 history 数组存活（_asyncSubagents 池同款载体）：agent 对象
// per-run 重建，而会诊子代理在发起回合结束后仍可能在跑——会话 Map 必须挂在跨 run
// 的载体上。直接 execute ctx（测试/无 history）回落 agent 字段。

/** 会话 Map（D1 accessor——history 载体优先双查询吸收——跨 runAgent 存活）。 */
export function consultSessionsMap(parent) {
  return getAsyncPool(parent, "consult")
}

/** 会话 Map（create=true——history 载体优先——会话创建/清理同读）。 */
function consultSessionsHolder(parent, create = false) {
  const holder = parent?.history ?? parent
  if (!holder || !(holder._consultSessions instanceof Map)) {
    if (!create || !holder) return { holder: null, map: null }
    holder._consultSessions = new Map()
  }
  return { holder, map: holder._consultSessions }
}

/** 跨 run 单调会话 id（agent._consultIdCounter per-run 重建——map 内最大 key 续号，
 *  同型 nextSubagentId——防会话跨 run 后 id 复用覆盖）。 */
function nextConsultId(parent) {
  const map = consultSessionsMap(parent)
  let max = 0
  for (const k of map?.keys() ?? []) {
    const n = Number.parseInt(String(k), 10)
    if (Number.isFinite(n) && n > max) max = n
  }
  const id = String(Math.max(parent?._consultIdCounter ?? 0, max) + 1)
  if (parent) parent._consultIdCounter = Number(id)
  return id
}

/** 会诊 settle 注入（§25 D-R17a——全 settle 一次注入：N replies 全文逐条 + per-model
 *  状态标注（failed 带标）；超长走 offloadToolResult（N1 护栏——T-R17l）。注入即消费
 *  （调用方从容器移除——run-start 单注入点 + 挂起退出残留兜底两消费点共用）。
 *  §16 D-DG2（群 B 批 B5）：raw（replies 正文——标签行不计）计入轮预算（四族共享单源）
 *  ——超限改清单行（全文落盘）；首条豁免保留。 */
export function injectConsultResult(session, { history, fullHistory, cwd }) {
  const n = session?.replies?.length ?? 0
  const failed = session.failed ?? 0
  const total = session.total ?? n
  const parts = (session?.replies ?? []).map((r, i) => {
    const label = r.model ?? `model ${i + 1}`
    const mark = r.failed === true ? " (failed)" : ""
    return `--- ${label}${mark} ---\n${String(r.reply ?? "")}`
  })
  const raw = parts.join("\n\n")
  const saved = digestBudgetOver(history, raw.length) ? persistOverflowReport(raw, { cwd: cwd ?? process.cwd(), tag: `consult#${session?.id ?? "session"}` }) : null
  const body =
    `[System reminder: consultation #${session?.id} finished — ${n} replies received (${failed} failed / ${total} models):\n` +
    `${saved ?? raw}]`
  pushReal(history, fullHistory, {
    role: "user",
    content: escapeXml(offloadToolResult(cwd ?? process.cwd(), body)),
  })
}

/** Narrow the configured consultModels pool to a requested subset.
 *  Each selector is "provider:model", a bare provider name, or a bare model name
 *  (case-insensitive). Returns { models, error } — error set when a selector matches
 *  nothing (surface the typo rather than silently dropping it). Absent/empty selectors
 *  → the full pool. */
function selectConsultModels(pool, selectors) {
  if (selectors == null || (Array.isArray(selectors) && selectors.length === 0)) return { models: pool, error: null }
  const list = Array.isArray(selectors) ? selectors : [selectors] // coerce a bare string → [string]
  const selected = []
  const seen = new Set()
  const unknowns = []
  for (const raw of list) {
    const s = String(raw).trim().toLowerCase()
    const matches = pool.filter((m) =>
      consultLabel(m).toLowerCase() === s ||
      String(m.provider ?? "").toLowerCase() === s ||
      String(m.model ?? "").toLowerCase() === s,
    )
    if (matches.length === 0) unknowns.push(String(raw))
    else for (const m of matches) {
      const key = consultLabel(m)
      if (!seen.has(key)) { seen.add(key); selected.push(m) }
    }
  }
  if (unknowns.length > 0) {
    return { models: null, error: `unknown consult model selector(s): ${unknowns.join(", ")} — choose from: ${pool.map(consultLabel).join(", ")}` }
  }
  return { models: selected, error: null }
}

/**
 * §25 D-R17a session settle: the LAST child of a session settling (pending → 0)
 * parks the WHOLE session into the pending single-container (history._pendingAsyncResults
 * +role——ASYNC-RESULT-CONTAINER.md D2，2026-09-08——_pendingConsultResults 独立族废弃)
 * — injected at the next run start (full digest, one-shot). Cancelled (stopped /
 * session abort) sessions are DISCARDED — nothing parks, replies stay unreachable
 * (T-R17c). The parked session leaves the live sessions map (map = running only).
 * D3：公共收尾统一走 settleAsyncEntry 共享 helper（四族同机制）——consult 族参数：
 * log:null（per-model 日志已在子代理 settle 记录）/ refill:false（会话池不占 subagent
 * 槽位）/ park:"always"（全 settle 即停靠——挂起与否同一流）。会话升格完整 entry
 * （role/done/report/error 字段——D2——注入器按 role 分发 injectConsultResult）。
 */
function sessionSettled(ctx, session) {
  const parent = ctx?.agent
  if (session.stopped) {
    // consult_stop / abort — discard, no digest (T-R17c)；出池（map = running only）
    removeFromAsyncPools(parent, "consult", session.id)
    return
  }
  settleAsyncEntry(parent, session, {
    pool: "consult",
    log: null, // per-model child:done/child:error 已在 consSettle 记录——会话级不重复
    refill: false, // 会诊会话池独立（不占 subagent 槽位——无补位）
    park: "always", // §25：全 settle 一次停靠（部分 settle 不提前——T-R17k）
    // Wake a parked suspension driver — a settle during idle must trigger the digest
    // round (T-R17j — 消费驱动判据推广：pending 单容器非空即消化).
    notifySettle: () => ctx?.callbacks?.onAsyncSettled?.(),
  })
}

function settleChild(ctx, session, id, label, ok, payload) {
  if (ok) {
    session.received++
    session.replies.push({ model: label, reply: payload })
    // Panel visibility (review D10): the user sees WHAT each consultant concluded, not just
    // a status dot — first ~8KB of the reply travels with the answered event.
    ctx.callbacks?.onSubagent?.({ id: `consult-${id}-${label}`, role: "consult", model: label, sessionId: id, status: "answered", replyPreview: String(payload ?? "").slice(0, 8000) })
  } else if (session.stopped) {
    // consult_stop already ran: an aborted child settles as TERMINATED — counted, never
    // enqueued (a "(consultation failed: Aborted)" note after an intentional stop is pure
    // noise the main agent would have to drain; pending-- below still fires the session end).
    session.terminated = (session.terminated ?? 0) + 1
    ctx.callbacks?.onSubagent?.({ id: `consult-${id}-${label}`, role: "consult", model: label, sessionId: id, status: "terminated", error: payload })
  } else {
    session.failed++
    session.replies.push({ model: label, reply: `(consultation failed: ${payload})`, failed: true })
    ctx.callbacks?.onSubagent?.({ id: `consult-${id}-${label}`, role: "consult", model: label, sessionId: id, status: "failed", error: payload })
  }
  session.pending--
  if (session.pending <= 0) sessionSettled(ctx, session) // §25: 全 settle 一次注入（部分 settle 不提前——T-R17k）
}

async function runConsultChild(ctx, session, id, m, problem, ctrl) {
  // Wall-clock ceiling: turn limits count LLM responses, not wall time — a child stuck in
  // a slow tool/provider must not hold the session open for hours (design review D2).
  const timeoutMs = ctx.agent?.config?.agent?.consultTimeoutMs ?? 600_000
  let timedOut = false // watchdog kills settle as TIMEOUT, not a provider failure (review D-GLM)
  const armWatchdog = () => {
    const t = setTimeout(() => {
      timedOut = true
      try { ctrl.abort() } catch { /* already settled */ }
    }, timeoutMs)
    t.unref?.()
    return t
  }
  let watchdog = armWatchdog()
  const label = consultLabel(m)
  try {
    const build = ctx.buildProvider ?? buildProvider // test-injectable (like ctx.runAgent)
    const provider = await build(m.provider)
    if (!provider) throw new Error(`provider "${m.provider}" not configured`)
    // Effort level from the consult entry (MODEL-PICKER-UNIFY §3.3): explicit, model-official
    // default filled by the panel at pick time. Non-thinking models carry effort:null.
    // Clamp to reasoningEffortEnum — out-of-enum makes provider/core throw on EVERY chat
    // call (candidate dies on takeoff). Out-of-enum: DROP the effort entirely (the preset
    // default may ALSO be out-of-enum for this override model).
    const withEffort = m.effort
      ? (() => {
          const enumList = specForModel(m.model).reasoningEffortEnum
          if (enumList && !enumList.includes(m.effort)) {
            const { reasoningEffort: _drop, ...rest } = provider
            return rest
          }
          return { ...provider, reasoningEffort: m.effort }
        })()
      : provider
    const agentMod = await import("../agent.mjs")
    const runner = ctx.runAgent ?? agentMod.runAgent
    // Activity stream: the consultant's tool calls stream to the panel under its own
    // label (subagent visibility — same channel the subagent tool uses).
    const panel = (chunk) => ctx.callbacks?.onToolPanel?.(`sub:consult ${label} #${id}`, chunk)
    const sink = {}
    // LOGGING（LOGGING.md——CLI consult parity）：child:*（consult——spawn 于 provider
    // 解析通过后；settle 分流 = 下方 consSettle——ok / partial（turn-cap 拒绝）/
    // error（运行失败/超时））
    const consId = `consult#${id}-${label}`
    const cT0 = Date.now()
    logEvent("child:spawn", { role: "consult", id: consId, kind: "consult" })
    let consDone = false
    const consSettle = (kind, payload) => {
      if (consDone) return
      consDone = true
      const ms = Date.now() - cT0
      if (kind === "error") logEvent("child:error", { role: "consult", id: consId, ms, err: errText(payload, 200) })
      else logEvent("child:done", { role: "consult", id: consId, ms, kind: kind === "partial" ? "partial" : "ok" })
    }
    // Turn-cap continue loop (TURN-CAP-CONTINUE.md): hitting the cap asks the user through
    // the panel's question card — unlimited continues, each with a fresh turn budget AND a
    // re-armed wall-clock watchdog (a continue is a fresh budget, the clock restarts too).
    // Parallel consultants serialize their continue prompts through a session-level queue
    // (one question card at a time). Declined / headless → failed reply (partial diagnosis).
    for (let resume = false; ; resume = true) {
      try {
        const result = await runner({ ...withEffort, model: m.model }, ctx.cwd, "# Problem\n" + problem, {
          // §14 C-11①：结构化 tool/cmd（webview 块头 `${tool} — ${cmd ≤60}`；无 cmd 仅 tool）
          onToolCall: (name, args) => panel({ kind: "tool", text: name + " " + (JSON.stringify(args) || "").slice(0, 120), tool: name, cmd: typeof args?.command === "string" ? args.command : undefined }),
          onToolResult: (name, text) => panel({ kind: "tool", text: "→ " + String(text ?? "").slice(0, 80).replace(/\n/g, " ") }),
          // 完整思考过程 + 输出文本流 (consult-UI review 2026-08-15): onReasoning has no depth
          // gate; onToken needs the consult exemption in agent.mjs — both stream as advisor-kind
          // chunks (think = dimmed, text = merged) so the panel shows the FULL reasoning, not
          // just tool calls.
          onReasoning: (r) => panel({ kind: "think", text: String(r ?? "") }),
          onToken: (t) => panel({ kind: "text", text: String(t ?? "") }),
          onQuestion: ctx.callbacks?.onQuestion ?? null,
        }, ctrl.signal, true, {
          // role "consult": lean consult-base.md system prompt, read-only tools, small turn budget.
          // Consultations are diagnosis tasks — 40 tool turns is enough to read the relevant files
          // (15 was too tight: consultants died mid-file-read at "reached max turns").
          depth: 1, role: "consult",
          maxTurns: ctx.agent?.config?.agent?.consultTurns ?? 40,
          extraTools: [makeMainHistoryTool(ctx.agent)],
          stateSink: sink,
          resume,
          ...(resume ? { history: sink.history } : {}),
        })
        settleChild(ctx, session, id, label, true, String(result ?? ""))
        consSettle("ok")
        return
      } catch (e) {
        if (e instanceof agentMod.ContinueError) {
          let go = null
          // §25 R17：挂起期（后台）consult 撞 turn 帽不再弹继续卡——无人在面板前值守，
          // 自动降级 partial（消化轮处置）；前台回合内（发起回合仍在跑）保留继续询问。
          if (ctx.callbacks?.onQuestion && ctx.agent?.history?._suspended !== true) {
            const ask = () => ctx.callbacks.onQuestion(
              `consult ${label} reached ${e.turns} turns (limit). Continue from here?`,
              ["Continue", "Stop"],
            )
            session.continueQueue = (session.continueQueue ?? Promise.resolve()).then(ask, ask)
            go = await session.continueQueue
          }
          if (go === "Continue") {
            clearTimeout(watchdog)
            timedOut = false // fresh budget → fresh clock
            watchdog = armWatchdog()
            continue
          }
          settleChild(ctx, session, id, label, false, `turn cap reached (${e.turns} turns) — stopped, diagnosis may be partial`)
          consSettle("partial")
          return
        }
        // Timeout reads as timeout — "(consultation failed: aborted)" would read as a provider crash
        const note = timedOut ? `consultation timed out after ${Math.round(timeoutMs / 60000)}min (agent.consultTimeoutMs)` : e?.message ?? String(e)
        settleChild(ctx, session, id, label, false, note)
        consSettle("error", note)
        return
      }
    }
  } finally {
    clearTimeout(watchdog)
  }
}

/** Abort-and-clear（只在全停语义下调用——run-stages 回合收尾 plain-abort 分支 / 挂起
 *  会话中止分支）：标记 stopped（子代理 settle 为 TERMINATED 而非 FAILED——用户停不是
 *  崩溃）+ abort 全部子代理 controller + 清会话 Map（停 = 弃——不入 pending——T-R17c）。
 *  §25 R17：普通回合收尾不再调用（会话跨 run 存活——挂起会话消化）——会话 Map 沿
 *  history._consultSessions 载体（跨 runAgent 存活——_asyncSubagents 同型）。 */
export function cleanupConsultSessions(agent) {
  const map = consultSessionsMap(agent)
  if (!map) return
  for (const s of map.values()) {
    s.stopped = true
    for (const c of s.controllers ?? []) { try { c.abort() } catch { /* already settled */ } }
  }
  map.clear()
}

export const consultStartTool = {
  name: "consult_start",
  readonly: false,
  sideEffectExempt: true,
  description:
    "Start a parallel multi-model consultation (会诊) for a hard problem you are stuck on (repeated failures, no headway). " +
    "Call it directly when the user asks for 会诊 / consult — an explicit user request applies even if you are not 'stuck'. " +
    "Several configured models (agent.consultModels) analyze the same problem INDEPENDENTLY and in parallel. " +
    "Non-blocking: returns immediately with a consult id. The replies come back AUTOMATICALLY — when every model has " +
    "settled (replies and failures alike), a digest of all replies is injected into your next turn (or digested in the " +
    "suspension session while the user is idle) — you judge each reply then, with your own tools. Do NOT poll for " +
    "replies and do NOT wait in the turn: consult_stop(id) cancels a running consultation you no longer need (its " +
    "replies are then discarded — no digest). If a reply arrives and you need to stop the rest before all models " +
    "finish, call consult_stop — already-finished replies are included in the digest only if the session runs to " +
    "completion. \n" +
    "Parameters:\n" +
    "- problem (required): a brief — the symptom, what you already tried (failure trail), and entry-point files. " +
    "Do NOT paste raw error logs; consultants pull the main session history themselves via their main_history tool.\n" +
    "- models (optional): subset of agent.consultModels to run — an array of \"provider:model\", bare provider, or bare model names (case-insensitive). Omit to run all.",
  parameters: {
    type: "object",
    properties: {
      problem: { type: "string", description: "Problem brief (symptom + failure trail + entry files)" },
      models: { type: "array", items: { type: "string" }, description: 'Optional subset of agent.consultModels to run (default: all). Each entry is "provider:model", a bare provider name, or a bare model name (case-insensitive).' },
    },
    required: ["problem"],
  },
  async execute({ problem, models }, ctx) {
    if (typeof problem !== "string" || !problem.trim()) return "Error: problem is required and must be a non-empty string"
    const agent = ctx.agent
    if (!agent) return "Error: consult requires an agent context"
    // §17 N3/D-S6 spawn gate（manual tier——会诊 = 另起 N 个并行子代理——与 subagent
    // spawn 同义——digest 动作域零例外 T-R17p——review 修复轮 #1）：手动档 auto-turn
    // digest 禁启会诊；AUTO tier（ctx.getAuto）豁免（推进型）。机械拒绝——digest 不链
    // 后台活。consult_stop 保留放行（控制类——cancel 同型）。
    if (agent._inAutoTurn && !(ctx.getAuto?.() ?? false)) {
      return JSON.stringify({ status: "error", error: "cannot start consultations from a manual auto-turn — wait for user input" })
    }
    const pool = agent.config?.agent?.consultModels ?? []
    if (!Array.isArray(pool) || pool.length === 0)
      return "Consultation is not configured — add agent.consultModels ([{ provider, model }], up to 5) to ~/.thincoder/config.json"
    if (pool.length > 5) return `Error: consultModels supports at most 5 models (got ${pool.length})`

    // `models` (optional) narrows the pool to a subset; absent/empty → run the whole pool.
    const picked = selectConsultModels(pool, models)
    if (picked.error) return picked.error
    const run = picked.models

    // §25 R17：会话 Map 挂跨 run 载体（history 优先——会诊跨回合存活；直接 execute ctx
    // 回落 agent 字段）。id 跨 run 单调（map 内最大 key 续号——防跨 run 复用覆盖）。
    const { map } = consultSessionsHolder(agent, true)
    const id = nextConsultId(agent)
    const session = {
      id, controllers: [], replies: [], pending: 0,
      failed: 0, terminated: 0, stopped: false, received: 0, total: run.length,
      models: run.map(consultLabel),
      // D2 升格完整 entry 形态（同 subagent/advisor/escalate——pending 单容器条目带
      // role；注入器按 role 分发）。settle 时 helper 置 done/report/error。
      role: "consult", done: false, report: null, error: null,
    }
    map.set(id, session)

    // §15 同款信号选择（D6 buildChildSignal 单点——D5 consult 补 _sessionSignal 兜底）：
    // 挂起会话内的回合（digest/用户回合）子代理持会话 signal（ctx.sessionSignal ??
    // agent._sessionSignal）——会话 Stop 逐链中止；回合级 ctx.signal 兜底。
    const childSignal = buildChildSignal(ctx)
    for (const m of run) {
      session.pending++
      const ctrl = new AbortController()
      session.controllers.push(ctrl)
      if (childSignal) {
        // F2 同款豁免（subagent-async.mjs 同型——review 修复轮 #2）：interrupt（Ctrl+I——
        // 停回合续跑）不是全停——不逐链中止在飞会诊子代理（否则意见丢为失败注记 + 噪音
        // digest）；仅全停（Stop/会话中止——无 interrupt reason）沿链传播。
        if (childSignal.aborted && !childSignal.reason?.interrupt) ctrl.abort()
        else childSignal.addEventListener?.("abort", () => {
          if (childSignal.reason?.interrupt) return
          ctrl.abort()
        }, { once: true })
      }
      const label = consultLabel(m)
      ctx.callbacks?.onSubagent?.({ id: `consult-${id}-${label}`, role: "consult", model: label, sessionId: id, status: "started", startedAt: Date.now() })
      // Fire and forget — each child settles into the session bookkeeping (full-settle → pending stream).
      runConsultChild(ctx, session, id, m, problem, ctrl)
    }
    return JSON.stringify({ id, models: session.models })
  },
}

export const consultStopTool = {
  name: "consult_stop",
  readonly: false,
  sideEffectExempt: true,
  description:
    "Cancel a still-running consultation (会诊) you no longer need — aborts its running models and saves tokens. " +
    "Cancellation discards the session: its replies are NOT digested (already-finished replies become unreachable — " +
    "they were never read individually). Use it when the consultation outlived its purpose (user cancelled it, the " +
    "problem changed, you solved it yourself). The full-set digest arrives automatically otherwise — do not stop a " +
    "consultation to 'collect' partial replies.\n" +
    "Returns JSON: { stopped: <number of running models aborted>, cancelled: true }.\n" +
    "Parameters:\n" +
    "- id (required): the consult id from consult_start",
  parameters: {
    type: "object",
    properties: { id: { type: "string", description: "Consult id" } },
    required: ["id"],
  },
  async execute({ id }, ctx) {
    const s = consultSessionsMap(ctx.agent)?.get(String(id))
    if (!s) return JSON.stringify({ error: "unknown consult id" })
    const n = s.pending
    s.stopped = true
    for (const c of s.controllers) { try { c.abort() } catch { /* already settled */ } }
    return JSON.stringify({ stopped: n, cancelled: true })
  },
}
