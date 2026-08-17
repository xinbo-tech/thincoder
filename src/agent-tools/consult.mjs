/**
 * consult.mjs — multi-model consultation ("会诊", docs/design/CONSULTATION.md). CLI port.
 *
 * Three tools: consult_start (non-blocking spawn) / consult_check (read the next
 * reply as it arrives) / consult_stop (abort the rest). The mechanism does ZERO
 * judging — the main agent reads replies and verifies with its own tools.
 *
 * CLI adaptation (vs the VS Code plugin): the child runner is CLI's runAgent
 * (runAgent(child, input, callbacks, opts) — an agent object, not provider+cwd);
 * children are built with createAgent({ role: "consult", readonly tools,
 * CONSULT_BASE overlay }); activity streams to the parent TUI via the relay
 * prefix `consult#<id>/` (same channel subagent uses), not onSubagent/onToolPanel.
 */
import { createAgent, runAgent, readonlyToolNames, ContinueError } from "../agent.mjs"
import { resolveChildProvider } from "./subagent.mjs"
import { specForModel } from "../config.mjs"

function consultLabel(m) {
  return `${m.provider}:${m.model}`
}

/** Read-only tool injected into consultation children (via createAgent's tools).
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

/** Wake every parked consult_check waiter. */
function wakeWaiters(session) {
  const w = session.waiters.splice(0)
  for (const resolve of w) { try { resolve(false) } catch { /* noop */ } }
}

function settleChild(session, id, label, ok, payload) {
  if (ok) {
    session.received++
    session.replies.push({ model: label, reply: payload })
  } else if (session.stopped) {
    session.terminated = (session.terminated ?? 0) + 1
  } else {
    session.failed++
    session.replies.push({ model: label, reply: `(consultation failed: ${payload})`, failed: true })
  }
  session.pending--
  wakeWaiters(session)
}

async function runConsultChild(ctx, session, id, m, problem, ctrl) {
  const agent = ctx.agent
  const timeoutMs = agent?.config?.agent?.consultTimeoutMs ?? 600_000
  let timedOut = false
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
    // Provider resolution: consultModels entries are { provider, model, effort? } — resolve
    // via the subagent's provider resolver ("provider:model" handles cross-provider picks).
    const provider = resolveChildProvider(agent, `${m.provider}:${m.model}`)
    if (!provider?.apiKey?.trim()) {
      // resolveChildProvider may still lack a key; fail loudly like the plugin precheck
      // (settleChild turns this message into a clear failed reply instead of a raw 401)
      throw new Error(`consult model ${label} has no API key — check providers[${m.provider}].apiKey in config.json`)
    }
    // Clamp the pool's effort to the model's reasoningEffortEnum — an out-of-enum
    // value makes provider/core throw on EVERY chat call (candidate dies on takeoff).
    // Symmetric with escalate.mjs; 2026-08-16 a real consult died on qwen3.8-max
    // effort "high" (enum is xhigh/medium/low). Out-of-enum: DROP the effort entirely
    // (the provider preset default may ALSO be out-of-enum for this override model).
    if (m.effort) {
      const enumList = specForModel(m.model).reasoningEffortEnum
      if (enumList && !enumList.includes(m.effort)) {
        delete provider.reasoningEffort
      } else {
        provider.reasoningEffort = m.effort
      }
    }

    // Read-only consultant: filter the parent tool set down to readonly tools + main_history.
    const allowed = readonlyToolNames(agent.tools ?? [])
    const tools = [
      ...(agent.tools ?? []).filter((t) => allowed.has(t.name)),
      makeMainHistoryTool(agent),
    ]

    const child = createAgent({
      provider,
      tools,
      config: agent.config,
      cwd: agent.cwd,
      memory: agent.memory,
      // No overlay: setup.mjs already selects CONSULT_BASE as the base prompt for
      // role "consult" (overlay + base would concatenate it twice).
      role: "consult",
    })

    // Activity relay: `consult#<subId>/` prefix → the parent TUI's subTasks panel
    // (same channel subagent uses — parallel consultants stay independent).
    agent._subAgentCounter = (agent._subAgentCounter ?? 0) + 1
    const subId = agent._subAgentCounter
    const relayPrefix = `consult#${subId}/`
    const childCallbacks = {
      onToken: ctx.callbacks?.onToken ? (t) => ctx.callbacks.onToken(`${relayPrefix}${t}`) : null,
      onReasoning: ctx.callbacks?.onReasoning ? (r) => ctx.callbacks.onReasoning(`${relayPrefix}${r}`) : null,
      onToolCall: ctx.callbacks?.onToolCall ? (name, args) => ctx.callbacks.onToolCall(`${relayPrefix}${name}`, args) : null,
    }

    // Turn-cap continue loop (TURN-CAP-CONTINUE.md): hitting the cap asks the user via
    // the SAME y/n panel the main agent uses (ctx.onPermissionRequest "continue") —
    // unlimited continues, each with a fresh turn budget AND a re-armed wall-clock
    // watchdog (a continue is a fresh budget, the clock restarts too). Parallel
    // consultants serialize their prompts through a session-level queue. Declined /
    // headless → failed reply (partial diagnosis).
    const runner = ctx.runAgent ?? runAgent
    for (let resume = false; ; resume = true) {
      try {
        const result = await runner(child, "# Problem\n" + problem, childCallbacks, {
          depth: 1,
          maxTurns: agent?.config?.agent?.consultTurns ?? 40,
          signal: ctrl.signal,
          resume,
        })
        settleChild(session, id, label, true, String(result ?? ""))
        return
      } catch (e) {
        if (e instanceof ContinueError) {
          let go = false
          if (ctx.onPermissionRequest) {
            const ask = () => ctx.onPermissionRequest("continue", { turns: e.turn, agent: label })
            session.continueQueue = (session.continueQueue ?? Promise.resolve()).then(ask, ask)
            go = await session.continueQueue
          }
          if (go) {
            clearTimeout(watchdog)
            timedOut = false // fresh budget → fresh clock
            watchdog = armWatchdog()
            continue
          }
          settleChild(session, id, label, false, `turn cap reached (${e.turn} turns) — stopped, diagnosis may be partial`)
          return
        }
        const note = timedOut ? `consultation timed out after ${Math.round(timeoutMs / 60000)}min (agent.consultTimeoutMs)` : e?.message ?? String(e)
        settleChild(session, id, label, false, note)
        return
      }
    }
  } catch (e) {
    // Errors BEFORE the runner (provider resolution, createAgent) or a throwing
    // continue-prompt settle as failed replies — the runner's own errors are already
    // handled inside the loop above.
    settleChild(session, id, label, false, e?.message ?? String(e))
  } finally {
    clearTimeout(watchdog)
  }
}

/** Turn-end cleanup (called from runAgent's finally): abort every leftover
 *  consultation controller, wake parked waiters, clear the session map. */
export function cleanupConsultSessions(agent) {
  for (const s of agent._consultSessions?.values() ?? []) {
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
    "Do NOT paste raw error logs; consultants pull the main session history themselves via their main_history tool.",
  parameters: {
    type: "object",
    properties: { problem: { type: "string", description: "Problem brief (symptom + failure trail + entry files)" } },
    required: ["problem"],
  },
  async execute({ problem }, ctx) {
    if (typeof problem !== "string" || !problem.trim()) return "Error: problem is required and must be a non-empty string"
    const agent = ctx.agent
    if (!agent) return "Error: consult requires an agent context"
    const models = agent.config?.agent?.consultModels ?? []
    if (!Array.isArray(models) || models.length === 0)
      return "Consultation is not configured — add agent.consultModels ([{ provider, model }], up to 5) to ~/.thincoder/config.json"
    if (models.length > 5) return `Error: consultModels supports at most 5 models (got ${models.length})`

    agent._consultSessions ??= new Map()
    const id = String((agent._consultIdCounter = (agent._consultIdCounter ?? 0) + 1))
    const session = {
      id, controllers: [], replies: [], pending: 0, waiters: [],
      failed: 0, terminated: 0, stopped: false, received: 0, total: models.length,
      models: models.map(consultLabel),
    }
    agent._consultSessions.set(id, session)

    for (const m of models) {
      session.pending++
      const ctrl = new AbortController()
      session.controllers.push(ctrl)
      if (ctx.signal) {
        if (ctx.signal.aborted) ctrl.abort()
        else ctx.signal.addEventListener("abort", () => ctrl.abort(), { once: true })
      }
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
