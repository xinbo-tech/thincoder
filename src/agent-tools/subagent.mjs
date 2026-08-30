import {
  createAgent, runAgent,
  readonlyToolNames, collectGitContext, escapeXml,
  EXPLORE_OVERLAY, CODER_OVERLAY, PLAN_OVERLAY, ENG_CODER_OVERLAY,
  MIN_REPORT_CHARS, REPORT_CONTINUATION, DEFAULT_SUBAGENT_TURNS,
} from "../agent.mjs"
import { makeRelay, wrapChildCallbacks, runWithContinue, TURN_CAP_MARK } from "../agent/spawn-child.mjs"
import { validateDesignToken } from "./advisor.mjs"

/**
 * subagent tool: spawn a child agent to handle an independent subtask (isolated context, only the report is returned).
 * - role: "explore" — read-only tools, search/read/analyze (suitable for codebase exploration)
 * - role: "coder" — full tool set, self-contained implementation tasks (suitable for isolated coding)
 * - no role specified — invalid by design since the 2026-08-25 fail-closed gate
 *   (role is mandatory; "no role → same tool set as parent" was removed with the
 *   coder-leak fix and the header text above predates it)
 * - parallel subagent calls via the parallel channel (parallel: true)
 * - non-recursive: child agents do not get the subagent tool (depth > 0 is not injected)
 */

/**
 * Effective subagent model override for a role (CLI parity shared with VS Code):
 * priority — subagent tool `model` arg > config.agent.subagentModels[role] > config.agent.subagentModel > null (inherit parent).
 */
export function effectiveSubagentModel(parent, role, modelArg) {
  if (modelArg) return modelArg
  const cfg = parent.config?.agent ?? {}
  return cfg.subagentModels?.[role] ?? cfg.subagentModel ?? null
}

/**
 * Resolve the sub-agent's provider from a model override string (shared with the
 * VS Code port). Forms accepted:
 *   "provider:model"  → the named provider with the named model
 *   "provider"        → the named provider's configured model
 *   "model"           → same provider as the parent, different model
 * null → parent's provider unchanged.
 * API keys come from config.json only (env vars are not a key source).
 */
export function resolveChildProvider(parent, modelArg) {
  if (!modelArg) return { ...parent.provider }
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

export const subagentTool = {
  name: "subagent",
  description:
    "Spawn a sub-agent to handle an independent subtask in an isolated context. The sub-agent returns only its final report. Spawn MULTIPLE subagents in the SAME response for parallel work—they run concurrently.\n" +
    "Why delegate? A sub-agent runs in its own isolated context — its reads, searches, tool calls and edits never enter your history or pollute your window; only its final report comes back. Delegation keeps your working context lean (you see the whole session, not the child's noise) and the child single-mindedly focused on one task. Parallel children run concurrently, saving wall-clock time. Every coder/eng-coder child carries its own verify + advisor self-review discipline — handed-off work is already verified before you read a word of it.\n\n" +
    "Available roles (which roles are exposed depends on the active mode — see Mode filtering below):\n" +
    "- explore — read-only search & analysis. Toolset: the read/search family (grep, read, glob, code_search, doc_search, repo_outline, lsp, tree...). Receives git context auto-injected (branch, recent commits, working-tree state) when the project is a git repo. Its report must list what it searched and what it did NOT find. Fast — specify thoroughness in the task: quick / medium / thorough (default medium).\n" +
    "- plan — read-only implementation planning. Same read/search toolset; NEVER edits files. Returns a step-by-step plan for the parent to execute.\n" +
    "- coder — full implementation. The parent's complete read/write/execute toolset plus verify and advisor for self-review. Its final report must include a delivery transparency table with one row per task requirement (Done / Simplified / Not done — no deferred column).\n" +
    "- eng-coder — engineering-mode coder (available only in engineering mode, replacing coder). Same full toolset as coder plus the design-driven methodology overlay; REQUIRES a valid designToken arg obtained from a passed advisor(type='design') review.\n" +
    "Mode filtering: normal mode exposes explore/plan/coder; engineering mode exposes explore/plan/eng-coder. The schema enum reflects the active mode.\n\n" +
    "Writing the prompt:\n" +
    "- The sub-agent starts with zero context — it has not seen this conversation. Brief it like a colleague who just walked into the room: state the goal, list what you already know, hand over the specifics.\n" +
    "- Put exact paths and commands in the prompt when you know them. The sub-agent should not search for things you already know.\n" +
    "- Do not delegate understanding: if the task hinges on a file path or line number, find it yourself first and write it into the prompt.\n" +
    "- Once a sub-agent is running, leave that scope to it: don't redo its searches in parallel, and don't abandon it midway to finish manually.",
  parameters: {
    type: "object",
    properties: {
      task: { type: "string", description: "Self-contained task description for the sub-agent" },
      context: { type: "string", description: "Optional background the sub-agent needs (it cannot see this conversation)" },
      role: { type: "string", enum: ["explore", "plan", "coder", "eng-coder"], description: "The sub-agent role — see the tool description for the role capability matrix. Exact spelling required." },
      model: { type: "string", description: "Provider/model override for this sub-agent: 'provider:model', a provider name from config, or a model name on the parent's provider. Defaults to the agent.subagentModel config, then the parent's provider. Useful for offloading heavy work to a cheaper model." },
      designToken: { type: "string", description: "Required when role='eng-coder': the token returned by advisor(type='design') after the design review passed. Without a valid token, eng-coder cannot modify files." },
    },
    required: ["task"],
  },
  readonly: false,
  sideEffectExempt: true, // child agent may write files; parent can't introspect its _mutatedThisRun
  parallel: true,
  async execute(args, ctx) {
    const parent = ctx.agent
    const role = args.role

    // Role normalization + whitelist (2026-08-25, coder-leak fix): exact-string gates let
    // variant roles ("Coder", " coder") bypass BOTH mode gates and fall through to
    // full tools / no overlay — a full-write coder without design review. Schema enums are
    // advisory; providers don't enforce them. Fail closed on unknown roles.
    const ROLES = new Set(["explore", "plan", "coder", "eng-coder"])
    if (!ROLES.has(role)) {
      throw new Error(`Unknown subagent role: ${JSON.stringify(role)}. Valid roles: explore, plan, coder, eng-coder (exact spelling).`)
    }
    // Role is mutually exclusive per mode: normal mode → "coder", engineering mode → "eng-coder"
    if (parent.config?.agent?.engineering && role === "coder") {
      throw new Error("Engineering mode: use role='eng-coder' for implementation tasks.")
    }
    if (!parent.config?.agent?.engineering && role === "eng-coder") {
      throw new Error("Engineering mode is not active — use role='coder' for implementation tasks.")
    }

    // Provider/model override: tool `model` arg > subagentModels[role] > subagentModel > parent provider
    const childProvider = resolveChildProvider(parent, effectiveSubagentModel(parent, role, args.model))

    // eng-coder token gate: the design review must have passed and the caller must
    // present the exact token advisor issued — otherwise the child is not authorized to code.
    if (role === "eng-coder") {
      const issued = parent._engDesignToken
      if (!issued || args.designToken !== issued || !validateDesignToken(args.designToken)) {
        throw new Error("Invalid or missing design token — run advisor with type='design' first and pass the returned token as designToken.")
      }
    }

    // Filter tool set by role: explore/plan are read-only (plan is a planning agent, its deliverable is the plan itself)
    let tools
    if (role === "explore" || role === "plan") {
      const allowed = readonlyToolNames(parent.tools)
      tools = parent.tools.filter((t) => allowed.has(t.name))
    } else {
      tools = parent.tools
    }

    // Select prompt overlay by role
    let overlay = ""
    if (role === "explore") overlay = EXPLORE_OVERLAY
    else if (role === "coder") overlay = CODER_OVERLAY
    else if (role === "plan") overlay = PLAN_OVERLAY
    else if (role === "eng-coder") overlay = ENG_CODER_OVERLAY

    // explore/plan: force read-only permission; coder/default: AUTO passes through directly,
    // manual mode queues permission requests for the parent agent's approval UI (human in the loop, child agent is no longer silently rejected)
    let childPermission
    if (role === "explore" || role === "plan") {
      childPermission = async () => false
    } else if (parent.autoApprove) {
      childPermission = async () => true
    } else {
      childPermission = async (name, toolArgs) => {
        if (!ctx.onPermissionRequest) return false
        const ask = () => ctx.onPermissionRequest(`${role ?? "sub"}/${name}`, toolArgs)
        // Queue parallel child agent permission requests to avoid two popups simultaneously overwriting each other (lesson from question tool)
        parent._permQueue = (parent._permQueue ?? Promise.resolve()).then(ask, ask)
        return parent._permQueue
      }
    }

    // eng-coder: force engineering=true on child config so setup.mjs applies engineering prompt
    const childConfig = role === "eng-coder"
      ? { ...parent.config, agent: { ...parent.config.agent, engineering: true } }
      : parent.config

    const child = createAgent({
      provider: childProvider,
      tools,
      config: childConfig,
      cwd: parent.cwd,
      memory: parent.memory,
      overlay,
      role,
    })

    // Token-verified design review → child is authorized to modify files without re-reviewing
    if (role === "eng-coder") child._engDesignReviewed = true

    // explore/plan: inject git context (branch/recent commits/working tree state) — exploration and planning both relate to current repo state (inspired by kimi-code's promptPrefix)
    let input = args.context ? `Context:\n${args.context}\n\nTask:\n${args.task}` : args.task
    if (role === "explore" || role === "plan") {
      const gitCtx = collectGitContext(parent.cwd)
      if (gitCtx) input = `<untrusted_git_context>\n${escapeXml(gitCtx)}\n</untrusted_git_context>\n\n${input}`
    }

    // Relay content/reasoning/tool/output to the parent TUI via the unified spawn-child
    // pipeline (AGENT-LOOP.md §7.2 D3). Prefix includes a unique id: parallel child agents
    // with the same role stay independent and don't overwrite each other.
    // Format: role#id/  →  onToken("coder#2/writing..."), onToolCall("coder#2/read", args)
    const relayPrefix = makeRelay(parent, role ?? "sub", ctx.callbacks?.onToken, childProvider.model ?? "")
    const childOpts = {
      onPermissionRequest: childPermission,
      ...wrapChildCallbacks(relayPrefix, ctx.callbacks),
    }
    const childRunOpts = buildChildRunOpts(ctx)
    let report = ""
    // Turn-cap continue loop (TURN-CAP-CONTINUE.md) via runWithContinue (§7.2 D3):
    // hitting the cap asks the user via the SAME y/n panel the main agent uses —
    // unlimited continues, resume:true keeps the child's history + mutation bookkeeping,
    // fresh budget each run. Prompts queue through parent._permQueue (same as write
    // approval) so parallel children never pop two panels at once. Declined / headless
    // → partial-work return. Non-ContinueError errors still propagate (dispatch.mjs
    // turns them into Error tool results — unchanged behavior).
    const askSubagentContinue = (e) => {
      if (!ctx.onPermissionRequest) return Promise.resolve(false)
      const ask = () => ctx.onPermissionRequest("continue", { turns: e.turn, agent: relayPrefix.slice(0, -1) })
      parent._permQueue = (parent._permQueue ?? Promise.resolve()).then(ask, ask)
      return parent._permQueue
    }
    const declined = { partial: null }
    report = await runWithContinue(
      (child, input, cbs, opts) => runAgent(child, input, cbs, opts), // opts = childRunOpts + resume (managed by the pipeline)
      child, input, childOpts, childRunOpts,
      {
        askContinue: askSubagentContinue,
        onDeclined: (e, output) => {
          if (role === "eng-coder" && child._mutatedThisRun) mergeChildMutations(parent, child)
          // Early return semantics (unchanged from the inline loop): the declined
          // partial-work message is returned WITHOUT the MIN_REPORT_CHARS expansion —
          // re-prompting a capped child for a longer report is wrong.
          // Review #2 fix: use the pipeline-captured output (the `report` variable is
          // still "" at this point — runWithContinue hasn't returned yet).
          declined.partial = `Subagent (${role}) ${TURN_CAP_MARK} (${e.turn} turns) — work may be partial; review recent_changes before deciding next steps.\nPartial output: ${output || ""}`
        },
      },
    )
    if (declined.partial !== null) return declined.partial

    // Report too short = incomplete handoff: send back for expansion once (inspired by kimi-code's summaryPolicy: min 200 chars, retry 1 time).
    // The child agent's history is still intact; the continuation instruction is appended as new input so it can see its own earlier work.
    if (report.length < MIN_REPORT_CHARS) {
      report = await runAgent(child, REPORT_CONTINUATION, childOpts, childRunOpts)
    }

    // Engineering mode mechanical code gate: delegated file changes must not
    // bypass the parent's advisor/verify guards. Merge the child's mutations
    // into the parent so "advisor mandatory at both gates" is enforced, not just
    // promised in the engineering prompt.
    // CRITICAL: Only merge if child actually mutated files (defense-in-depth against
    // runAgent throwing before any writes occurred).
    // Review #8 clarification: eng-coder ONLY is intentional — the mechanical
    // two-gate merge exists for engineering mode; plain `coder` children carry
    // their own verify/advisor self-review discipline (per tool description), and
    // normal mode has no parent advisor/verify gate to feed.
    if (role === "eng-coder" && child._mutatedThisRun) {
      mergeChildMutations(parent, child)
    }

    return report
  },
}

/**
 * Child agent run options — the parent's abort signal MUST propagate to the
 * child: without it, Ctrl+C aborts the parent's controller but the child keeps
 * running its full turn budget (up to subagentTurns) while the parent awaits —
 * the interrupt appears to do nothing.
 */
export function buildChildRunOpts(ctx) {
  return {
    depth: (ctx.depth ?? 0) + 1,
    maxTurns: ctx.agent?.config?.agent?.subagentTurns ?? DEFAULT_SUBAGENT_TURNS,
    signal: ctx.signal ?? null,
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