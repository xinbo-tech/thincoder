/**
 * consult.mjs — multi-model consultation ("会诊", docs/design/CONSULTATION.md).
 *
 * Three tools: consult_start (non-blocking spawn) / consult_check (read the next
 * reply as it arrives) / consult_stop (abort the rest). The mechanism does ZERO
 * judging — the main agent reads replies and verifies with its own tools.
 *
 * Sessions live on the agent object (agent._consultSessions) — runAgent creates a
 * fresh agent per turn, so sessions are naturally turn-bound; runAgent's finally
 * aborts leftovers.
 */
import { buildProvider } from "../extension/presets.mjs"
import { specForModel } from "../specs.mjs"
import { logEvent, errText } from "../log.mjs"

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

/** Wake every parked consult_check waiter. */
function wakeWaiters(session) {
  const w = session.waiters.splice(0)
  for (const resolve of w) { try { resolve(false) } catch { /* noop */ } }
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
    // noise the main agent would have to drain; consult_check done still fires via pending--).
    session.terminated = (session.terminated ?? 0) + 1
    ctx.callbacks?.onSubagent?.({ id: `consult-${id}-${label}`, role: "consult", model: label, sessionId: id, status: "terminated", error: payload })
  } else {
    session.failed++
    session.replies.push({ model: label, reply: `(consultation failed: ${payload})`, failed: true })
    ctx.callbacks?.onSubagent?.({ id: `consult-${id}-${label}`, role: "consult", model: label, sessionId: id, status: "failed", error: payload })
  }
  session.pending--
  wakeWaiters(session)
}

async function runConsultChild(ctx, session, id, m, problem, ctrl) {
  // Wall-clock ceiling: turn limits count LLM responses, not wall time — a child stuck in
  // a slow tool/provider must not hold consult_check for hours (design review D2).
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
          onToolCall: (name, args) => panel({ kind: "tool", text: name + " " + (JSON.stringify(args) || "").slice(0, 120) }),
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
          if (ctx.callbacks?.onQuestion) {
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

/** Turn-end cleanup (called from runAgent's finally): abort every leftover
 *  consultation controller, wake parked waiters, clear the session map. */
export function cleanupConsultSessions(agent) {
  for (const s of agent._consultSessions?.values() ?? []) {
    // User Stop (panel abort) is an INTENTIONAL stop, not a child failure — mark stopped
    // BEFORE aborting so the children settle as TERMINATED (clean grey card) instead of
    // FAILED (red error). Without this the user reads "failed" as "it didn't stop".
    s.stopped = true
    for (const c of s.controllers ?? []) { try { c.abort() } catch { /* already settled */ } }
    for (const w of s.waiters?.splice(0) ?? []) { try { w() } catch { /* noop */ } }
  }
  agent._consultSessions?.clear()
}

export const consultStartTool = {
  name: "consult_start",
  readonly: false,
  sideEffectExempt: true,
  description:
    "Start a parallel multi-model consultation (会诊) for a hard problem you are stuck on (repeated failures, no headway). " +
    "Call it directly when the user asks for 会诊 / consult — an explicit user request applies even if you are not 'stuck'. " +
    "Several configured models (agent.consultModels) analyze the same problem INDEPENDENTLY and in parallel. " +
    "Non-blocking: returns immediately with a consult id. Then call consult_check(id) to read each reply as it " +
    "arrives, judge/verify it yourself with your own tools, and call consult_stop(id) once a reply is good enough.\n" +
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
    const pool = agent.config?.agent?.consultModels ?? []
    if (!Array.isArray(pool) || pool.length === 0)
      return "Consultation is not configured — add agent.consultModels ([{ provider, model }], up to 5) to ~/.thincoder/config.json"
    if (pool.length > 5) return `Error: consultModels supports at most 5 models (got ${pool.length})`

    // `models` (optional) narrows the pool to a subset; absent/empty → run the whole pool.
    const picked = selectConsultModels(pool, models)
    if (picked.error) return picked.error
    const run = picked.models

    agent._consultSessions ??= new Map()
    const id = String((agent._consultIdCounter = (agent._consultIdCounter ?? 0) + 1))
    const session = {
      id, controllers: [], replies: [], pending: 0, waiters: [],
      failed: 0, terminated: 0, stopped: false, received: 0, total: run.length,
      models: run.map(consultLabel),
    }
    agent._consultSessions.set(id, session)

    for (const m of run) {
      session.pending++
      const ctrl = new AbortController()
      session.controllers.push(ctrl)
      if (ctx.signal) {
        if (ctx.signal.aborted) ctrl.abort()
        else ctx.signal.addEventListener("abort", () => ctrl.abort(), { once: true })
      }
      const label = consultLabel(m)
      ctx.callbacks?.onSubagent?.({ id: `consult-${id}-${label}`, role: "consult", model: label, sessionId: id, status: "started", startedAt: Date.now() })
      // Fire and forget — each child settles itself into the session queue.
      runConsultChild(ctx, session, id, m, problem, ctrl)
    }
    return JSON.stringify({ id, models: session.models })
  },
}

export const consultCheckTool = {
  name: "consult_check",
  readonly: true,
  description:
    "Read the NEXT consultation reply (whichever model answered first). Blocks until a reply arrives or all models " +
    "have settled. The reply is raw and unjudged — verify/adopt it with your own tools. When done is true, no more " +
    "replies are coming.\n" +
    "Call it ALONE in a turn — do NOT batch it with calls that depend on its reply (readonly tools run in parallel).\n" +
    "Parameters:\n" +
    "- id (required): the consult id from consult_start",
  parameters: {
    type: "object",
    properties: { id: { type: "string", description: "Consult id" } },
    required: ["id"],
  },
  async execute({ id }, ctx) {
    const s = ctx.agent?._consultSessions?.get(String(id))
    if (!s) return JSON.stringify({ error: "unknown consult id" })
    const abortAll = () => { for (const c of s.controllers) { try { c.abort() } catch { /* noop */ } } }
    if (ctx.signal?.aborted) abortAll()

    for (;;) {
      if (s.replies.length > 0) {
        const r = s.replies.shift()
        return JSON.stringify({
          reply: r.reply, model: r.model, failedReply: r.failed === true,
          received: s.received,
      failed: s.failed,
      terminated: s.terminated ?? 0, total: s.total,
          done: s.replies.length === 0 && s.pending === 0,
        })
      }
      if (s.pending === 0) {
        return JSON.stringify({ done: true, received: s.received, failed: s.failed, total: s.total })
      }
      const stopped = await new Promise((resolve) => {
        function cleanup() {
          const i = s.waiters.indexOf(w)
          if (i >= 0) s.waiters.splice(i, 1)
          ctx.signal?.removeEventListener("abort", onAbort)
        }
        function w() { cleanup(); resolve(false) }
        function onAbort() { cleanup(); abortAll(); resolve(true) }
        s.waiters.push(w)
        if (ctx.signal) {
          if (ctx.signal.aborted) { onAbort(); return }
          ctx.signal.addEventListener("abort", onAbort, { once: true })
        }
      })
      if (stopped) return JSON.stringify({ done: true, stopped: true, received: s.received, failed: s.failed, total: s.total })
    }
  },
}

export const consultStopTool = {
  name: "consult_stop",
  readonly: false,
  sideEffectExempt: true,
  description:
    "Terminate the still-running consultations of a session once a reply is good enough — saves tokens and time. " +
    "Already-answered replies stay available for consult_check.\n" +
    "Parameters:\n" +
    "- id (required): the consult id from consult_start",
  parameters: {
    type: "object",
    properties: { id: { type: "string", description: "Consult id" } },
    required: ["id"],
  },
  async execute({ id }, ctx) {
    const s = ctx.agent?._consultSessions?.get(String(id))
    if (!s) return JSON.stringify({ error: "unknown consult id" })
    const n = s.pending
    s.stopped = true
    for (const c of s.controllers) { try { c.abort() } catch { /* already settled */ } }
    return JSON.stringify({ stopped: n })
  },
}
