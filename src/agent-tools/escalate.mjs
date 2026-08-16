/**
 * escalate.mjs — 飞刀 (the "flying knife", docs/design/ESCALATE.md). CLI port.
 *
 * Hand an implementation task to a STRONGER model — like a hospital flying in an
 * outside expert (飞刀): the expert arrives, operates personally (WRITE access),
 * hands back the post-op report, leaves. Complementary to consult (parallel
 * READ-ONLY opinions for judgment calls).
 *
 * Candidate pool = all consultModels rows. The tool is only registered when the
 * pool is non-empty (setup.mjs).
 *
 * CLI adaptation (vs the VS Code plugin): the child runner is CLI's runAgent
 * (runAgent(child, input, callbacks, opts) — an agent object, not provider+cwd);
 * the child is createAgent({ role: "coder", CODER_OVERLAY }); activity streams to
 * the parent TUI via the relay prefix `escalate#<id>/`; mutations merge via the
 * CLI mergeChildMutations(parent, child) (agent object, not a state sink).
 */
import { isAbsolute, relative } from "node:path"
import { createAgent, runAgent, ContinueError, CODER_OVERLAY } from "../agent.mjs"
import { resolveChildProvider, mergeChildMutations } from "./subagent.mjs"

const label = (m) => `${m.provider}:${m.model}`

export const escalateTool = {
  name: "escalate",
  sideEffectExempt: true, // the child's mutations are tracked and reviewed, like subagent
  description:
    "TERMINOLOGY (one word for one thing): 'escalate' is the ONLY name — the tool, and the " +
    "role of the expert sub-agent it spawns, are both called 'escalate'; 飞刀 is the Chinese " +
    "alias. When the user says 飞刀 / escalate / 'fly in <model>', call THIS tool directly — " +
    "never via a script importing this module. " +
    "Hand an implementation task to a stronger model (飞刀 — a flown-in expert). " +
    "It gets WRITE access and does the work itself — reads, edits, runs tests — then returns " +
    "a post-op report (what changed, why, verification). You review the report and report to " +
    "the user. Use it when YOU judge the task calls for stronger hands (complex multi-file " +
    "refactoring, an intractable bug, intricate algorithm work — or work beyond your " +
    "comfortable ability). Early or late, your judgment; the cost is one expert run, " +
    "comparable to doing it yourself. For parallel READ-ONLY opinions use consult_start instead. " +
    "Not available in engineering mode (implementation goes through eng-coder subagents there).\n" +
    "Parameters:\n" +
    "- task (required): the task description — goal, constraints, entry files, acceptance criteria\n" +
    "- model (optional): pick a specific consultant as 'provider:model'; default = the first consult model",
  parameters: {
    type: "object",
    properties: {
      task: { type: "string", description: "Task description with acceptance criteria" },
      model: { type: "string", description: "Candidate 'provider:model' from the consult models (optional)" },
    },
    required: ["task"],
  },
  async execute({ task, model }, ctx) {
    const parent = ctx.agent
    if ((ctx.depth ?? 0) > 0) return "Error: escalate is only available at depth 0 (an escalate's work cannot be delegated again)"
    if (parent?.config?.agent?.engineering) {
      return "Error: engineering mode is ON — escalate is unavailable (it spawns a coder sub-agent, which engineering mode forbids). Use subagent with role='eng-coder' and a designToken from advisor(type='design') instead."
    }
    const pool = parent?.config?.agent?.consultModels ?? []
    if (pool.length === 0) return "Error: no escalate candidates — configure at least one consult model (agent.consultModels)"

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
    if (!provider?.apiKey?.trim() && !process.env.THINCODER_API_KEY) {
      return `Error: provider "${pick.provider}" has no API key — set it in config.json (or THINCODER_API_KEY) before flying it in`
    }
    if (pick.effort) provider.reasoningEffort = pick.effort

    parent._subAgentCounter = (parent._subAgentCounter ?? 0) + 1
    const subId = parent._subAgentCounter
    const tag = label(pick)
    const relayPrefix = `escalate#${subId}/`

    const timeoutMs = parent?.config?.agent?.consultTimeoutMs ?? 600_000
    let timedOut = false
    const ctrl = new AbortController()
    const watchdog = setTimeout(() => {
      timedOut = true
      try { ctrl.abort() } catch { /* already settled */ }
    }, timeoutMs)
    if (ctx.signal) {
      if (ctx.signal.aborted) ctrl.abort()
      else ctx.signal.addEventListener("abort", () => ctrl.abort(), { once: true })
    }

    let output = ""
    const childCallbacks = {
      onToken: ctx.callbacks?.onToken ? (t) => { output += t; ctx.callbacks.onToken(`${relayPrefix}${t}`) } : (t) => { output += t },
      onReasoning: ctx.callbacks?.onReasoning ? (r) => ctx.callbacks.onReasoning(`${relayPrefix}${r}`) : null,
      onToolCall: ctx.callbacks?.onToolCall ? (name, args) => ctx.callbacks.onToolCall(`${relayPrefix}${name}`, args) : null,
    }

    // Declared outside try so the catch can merge mutations even on a partial failure.
    let child = null
    try {
      // Full write path (role "coder"): permission gate via the parent's onPermissionRequest,
      // recent-changes tracking, mutations merge into the parent below.
      child = createAgent({
        provider,
        tools: parent.tools,
        config: parent.config,
        cwd: parent.cwd,
        memory: parent.memory,
        overlay: CODER_OVERLAY,
        role: "coder",
      })
      const runner = ctx.runAgent ?? runAgent
      const report = await runner(child, task, {
        ...childCallbacks,
        onPermissionRequest: ctx.onPermissionRequest ?? null,
      }, {
        depth: 1,
        maxTurns: parent.config?.agent?.subagentTurns ?? 100,
        signal: ctrl.signal,
      })
      // Escalate mutations are the parent's mutations: verify/advisor guards must see them
      mergeChildMutations(parent, child)
      return `escalate (${tag}) post-op report:\n${report || output.slice(0, 4000)}${touchedFilesNote(child, parent.cwd)}`
    } catch (e) {
      // Even a failed surgery may have written files — merge whatever the child touched.
      if (child) mergeChildMutations(parent, child)
      const msg = e?.message ?? String(e)
      if (ctx.signal?.aborted || (!timedOut && e?.name === "AbortError")) throw e
      if (e instanceof ContinueError) {
        return `escalate (${tag}) stopped: turn cap reached (${e.turns} turns) — work may be partial; review recent_changes before deciding next steps.\nPartial output: ${output.slice(0, 2000)}`
      }
      const note = timedOut ? `timed out after ${Math.round(timeoutMs / 60000)}min (agent.consultTimeoutMs)` : msg
      return `escalate (${tag}) error: ${note}\nPartial output: ${output.slice(0, 2000)}`
    } finally {
      clearTimeout(watchdog)
    }
  },
}

/** Relative touched-file list appended to every return (child paths are absolute). */
function touchedFilesNote(child, cwd) {
  const touched = child?._touchedFiles ?? []
  if (touched.length === 0) return ""
  const shown = touched.map((f) => {
    const r = relative(cwd ?? process.cwd(), f)
    return r && !r.startsWith("..") && !isAbsolute(r) ? r : f
  })
  return `\nTouched files: ${shown.join(", ")}`
}
