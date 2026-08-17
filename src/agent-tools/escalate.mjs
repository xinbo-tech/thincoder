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
import { specForModel } from "../config.mjs"

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
    if (!provider?.apiKey?.trim()) {
      return `Error: provider "${pick.provider}" has no API key — set it in config.json before flying it in`
    }
    let effortNote = ""
    if (pick.effort) {
      // Clamp the pool's effort to the model's reasoningEffortEnum — an out-of-enum
      // value makes provider/core.mjs throw on EVERY chat call (candidate dies on takeoff).
      // Out-of-enum: DROP the effort entirely (the provider preset default may ALSO be
      // out-of-enum for this override model — e.g. qwenplan preset default "high" is
      // invalid for qwen3.8-max, enum xhigh/medium/low).
      const enumList = specForModel(pick.model).reasoningEffortEnum
      if (enumList && !enumList.includes(pick.effort)) {
        effortNote = ` (effort "${pick.effort}" unsupported by ${pick.model}, dropped)`
        delete provider.reasoningEffort
      } else {
        provider.reasoningEffort = pick.effort
      }
    }

    parent._subAgentCounter = (parent._subAgentCounter ?? 0) + 1
    const subId = parent._subAgentCounter
    const tag = label(pick)
    const relayPrefix = `escalate#${subId}/`

    // No wall-clock watchdog — turn cap only, exactly like subagent (the verified write
    // path). Rationale (2026-08-16): a fixed wall-clock aborts NORMAL-but-slow surgery —
    // two max-effort consultants hit a 10min wall just READING files. Hang protection is
    // already covered by FETCH_TIMEOUT_MS (per LLM call) and the user's Stop (parent
    // signal propagates directly below). maxTurns is the cost budget; hitting it asks
    // the user whether to continue (main-agent parity), falling back to partial work.

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
      const runOpts = {
        depth: 1,
        maxTurns: parent.config?.agent?.subagentTurns ?? 100,
        signal: ctx.signal ?? null,
      }
      // Turn-cap continue, main-agent parity (tui/agent-turn.mjs): when the child hits
      // ContinueError, ask the user through the SAME channel as child write approval
      // (ctx.onPermissionRequest). The name "continue" renders the TUI's dedicated y/n
      // Continue panel — the same panel the main agent's turn-cap pause uses. The
      // resumed run passes resume:true, so runAgent does NOT re-inject the task text
      // (setup.mjs skips input on resume) and keeps the child's history + mutation
      // bookkeeping, with a fresh maxTurns budget per run. No permission handler
      // (headless) or a declined prompt falls through to the partial-work return;
      // MAX_RESUMES caps continues so a stuck child cannot loop forever.
      const MAX_RESUMES = 2
      for (let resumes = 0; ; resumes++) {
        try {
          const report = await runner(child, task, {
            ...childCallbacks,
            // AUTO parity with subagent.mjs: parent.autoApprove must reach the child even
            // when no onPermissionRequest exists (ACP/headless embeds) — otherwise every
            // child write burns a turn on "no permission handler" rejections.
            onPermissionRequest: parent.autoApprove ? async () => true : (ctx.onPermissionRequest ?? null),
          }, { ...runOpts, resume: resumes > 0 })
          // Escalate mutations are the parent's mutations: verify/advisor guards must see them
          mergeChildMutations(parent, child)
          return `escalate (${tag})${effortNote} post-op report:\n${report || output.slice(0, 4000)}${touchedFilesNote(child, parent.cwd)}`
        } catch (e) {
          // Even a failed surgery may have written files — merge whatever the child touched.
          mergeChildMutations(parent, child)
          const msg = e?.message ?? String(e)
          if (ctx.signal?.aborted || e?.name === "AbortError") throw e
          if (e instanceof ContinueError) {
            if (resumes < MAX_RESUMES && ctx.onPermissionRequest) {
              const go = await ctx.onPermissionRequest("continue", { turns: e.turn, agent: tag })
              if (go) continue // fresh maxTurns budget; task NOT re-injected (resume:true)
            }
            return `escalate (${tag}) stopped: turn cap reached (${e.turn} turns) — work may be partial; review recent_changes before deciding next steps.\nPartial output: ${output.slice(0, 2000)}`
          }
          return `escalate (${tag}) error: ${msg}\nPartial output: ${output.slice(0, 2000)}`
        }
      }
    } catch (e) {
      // Reached only when createAgent itself fails or the continue prompt throws —
      // run failures are handled inside the loop above.
      if (child) mergeChildMutations(parent, child)
      if (ctx.signal?.aborted || e?.name === "AbortError") throw e
      return `escalate (${tag}) error: ${e?.message ?? String(e)}`
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
