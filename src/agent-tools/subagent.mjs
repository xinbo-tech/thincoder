import {
  createAgent, runAgent,
  readonlyToolNames, collectGitContext, escapeXml,
  EXPLORE_OVERLAY, CODER_OVERLAY, PLAN_OVERLAY, ENG_CODER_OVERLAY,
  MIN_REPORT_CHARS, REPORT_CONTINUATION, DEFAULT_SUBAGENT_TURNS,
} from "../agent.mjs"
import { makeRelay, wrapChildCallbacks, runWithContinue, TURN_CAP_MARK } from "../agent/spawn-child.mjs"
import { validateDesignToken } from "./advisor.mjs"

// Async subagent limits (AGENT-LOOP.md §15 D-A4): mechanical concurrency cap for
// background spawns + the per-turn check budget (consult-style loop guard).
export const ASYNC_SUBAGENT_LIMIT = 4
export const MAX_ASYNC_CHECKS = 3

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

/**
 * Resolve the design-token slot for an eng-coder spawn (2026-09-01 multi-design, FR3):
 * - designId given → exact slot lookup (no match = explicit error, never a fuzzy guess)
 * - designId omitted → exactly ONE slot must exist (single-design compatibility); with
 *   multiple slots we refuse rather than pick one (T16: never silently aim the wrong design)
 * Returns { token } on success; throws with a parent-actionable message otherwise.
 * The HMAC/TTL check itself stays in validateDesignToken (unchanged).
 */
export function resolveDesignSlot(parent, designIdArg) {
  const slots = parent._engDesignTokens
  const hasSlots = slots instanceof Map && slots.size > 0
  const legacy = parent._engDesignToken
  // eng(exit/enter) resets the single mirror to force a fresh review (eng.mjs) —
  // a non-empty slot map surviving that reset must NOT resurrect stale tokens:
  // mirror cleared + slots present = re-entered engineering mode → re-review.
  if (!legacy && hasSlots) {
    throw new Error("Design tokens were reset (engineering mode was re-entered) — run advisor with type='design' again and spawn with the fresh designId+token pair.")
  }
  if (designIdArg) {
    if (!hasSlots || !slots.has(designIdArg)) {
      throw new Error(`designId not found — no approved design review holds this id. Run advisor with type='design' again and pass the designId echoed with the token. (session holds ${hasSlots ? slots.size : 0} approved design slot(s))`)
    }
    return { token: slots.get(designIdArg) }
  }
  if (hasSlots && slots.size > 1) {
    throw new Error(`Multiple approved designs in this session (${slots.size}) — pass the designId parameter (echoed with each token) to choose which design this eng-coder spawn belongs to.`)
  }
  if (hasSlots && slots.size === 1) return { token: [...slots.values()][0] }
  if (legacy) return { token: legacy } // single-slot mirror fallback (pre-multi-slot sessions)
  throw new Error("Invalid or missing design token — run advisor with type='design' first and pass the returned token as designToken.")
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
    "- eng-coder — engineering-mode coder (available only in engineering mode, replacing coder). Same full toolset as coder plus the design-driven methodology overlay; REQUIRES a valid designToken arg obtained from a passed advisor(type='design') review. The advisor's Approved reply also echoes a designId — pass it as the designId arg: required to pick between designs when several approved reviews are active, optional for a single design. The delivery report echoes the designId back for the audit fix round.\n" +
    "Mode filtering: normal mode exposes explore/plan/coder; engineering mode exposes explore/plan/eng-coder. The schema enum reflects the active mode.\n\n" +
    "Async spawn (AGENT-LOOP.md §15): pass async:true to spawn WITHOUT waiting — returns {id, role, status:\"running\"} immediately so you can keep working in your own turn (read/check files, run other tools) while the child runs in the background. Collect results with subagent_check — multiple async children return in completion (arrival) order, first finished first, so fast results are handled immediately. Use async when your own turn must keep moving; use the default blocking spawn when you must see the report before continuing. Async spawns are capped at 4 concurrent (further spawns queue with a position), and top-level only.\n\n" +
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
      designId: { type: "string", description: "Optional when role='eng-coder': the designId echoed with the approved token by advisor(type='design'). Required to pick between designs when several approved reviews are active in the session — each eng-coder carries its own designId+token pair so parallel implementations never overwrite each other. Optional for a single design." },
      async: { type: "boolean", description: "true = spawn without waiting — returns {id} immediately, fetch results later via subagent_check. Default false (blocking)." },
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
    // 2026-09-01: multi-design slots — the token is located by designId (exact slot,
    // single-slot fallthrough); HMAC/TTL validation itself is unchanged.
    let issuedToken
    if (role === "eng-coder") {
      issuedToken = resolveDesignSlot(parent, args.designId).token
      if (!issuedToken || args.designToken !== issuedToken || !validateDesignToken(args.designToken)) {
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
    // designId+token ride the child bookkeeping: the delivery report carries the designId
    // so the divergence-audit fix round re-spawns with the SAME slot (2026-09-01 FR3).
    if (role === "eng-coder" && issuedToken) {
      child._engDesignId = args.designId ?? null
      child._engDesignToken = issuedToken
    }

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
    // Async id allocation (AGENT-LOOP.md §15 D-A1): reserve the relay counter at
    // spawn time — the returned id must be stable while the item sits in the queue.
    // The [model] token (TUI block creation) is DEFERRED to actual start so queued
    // children don't paint an empty panel block ("queued 态不显示").
    let relayPrefix
    if (args.async === true) {
      parent._subAgentCounter = (parent._subAgentCounter ?? 0) + 1
      relayPrefix = `${role}#${parent._subAgentCounter}/`
    } else {
      relayPrefix = makeRelay(parent, role ?? "sub", ctx.callbacks?.onToken, childProvider.model ?? "")
    }
    const childOpts = {
      onPermissionRequest: childPermission,
      ...wrapChildCallbacks(relayPrefix, ctx.callbacks),
    }
    const childRunOpts = buildChildRunOpts(ctx)
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

    // ── Async branch (AGENT-LOOP.md §15 D-A1/D-A6): spawn without waiting ──
    // The child runs the EXACT blocking pipeline (runChildPipeline below — relay /
    // turn-cap / permission / MIN_REPORT_CHARS / mergeChildMutations all unchanged),
    // but the parent does not await it: the promise is parked in _asyncSubagents and
    // consumed via subagent_check or the turn-end auto-wait. Slot queue: running
    // count < ASYNC_SUBAGENT_LIMIT → start now; ≥ limit → enqueue (status "queued",
    // position = queue index) — never rejected, never requiring the model to batch.
    if (args.async === true) {
      if ((ctx.depth ?? 0) > 0) {
        throw new Error("async spawn only available at the top level")
      }
      parent._asyncSubagents ??= new Map()
      parent._asyncQueue ??= []
      const running = [...parent._asyncSubagents.values()].filter((e) => e.status === "running").length
      const id = parent._subAgentCounter
      const entry = {
        id, role, relayPrefix,
        status: running >= ASYNC_SUBAGENT_LIMIT ? "queued" : "running",
        position: undefined,
        report: null, error: null, done: false,
        promise: null, _settle: null, _settleSeq: 0,
      }
      // The settle signal — resolves when the run chain settles (never rejects).
      entry.promise = new Promise((res) => { entry._settle = res })
      entry.start = () => {
        entry.status = "running"
        entry.position = undefined
        // Deferred [model] emit: the TUI block is created at ACTUAL start.
        ctx.callbacks?.onToken?.(relayPrefix + "[model]" + (childProvider.model ?? ""))
        // Turn-cap on background children NEVER pops the continue panel (D-A3):
        // auto-decline, the partial-work report carries the cap reason.
        runChildPipeline(child, input, childOpts, childRunOpts, {
          parent, role, args,
          askContinue: () => Promise.resolve(false),
        })
          .then((report) => { entry.report = report })
          .catch((err) => { entry.error = err?.message ?? String(err) })
          .finally(() => {
            entry.status = "done" // running 数口径（D-A1/D-A2/T6）：已完成未消费不计入
            entry.done = true
            entry._settleSeq = (parent._asyncSettleSeq = (parent._asyncSettleSeq ?? 0) + 1)
            entry._settle()
            for (const w of parent._asyncWaiters?.splice(0) ?? []) { try { w() } catch { /* noop */ } }
            maybeRefillAsync(parent)
          })
      }
      parent._asyncSubagents.set(String(id), entry)
      if (entry.status === "queued") {
        parent._asyncQueue.push(entry)
        entry.position = parent._asyncQueue.length
        return JSON.stringify({ id: String(id), role, status: "queued", position: entry.position })
      }
      entry.start()
      return JSON.stringify({ id: String(id), role, status: "running" })
    }

    // ── Blocking path (unchanged semantics): await the full pipeline ──
    return await runChildPipeline(child, input, childOpts, childRunOpts, {
      parent, role, args,
      askContinue: askSubagentContinue,
    })
  },
}

/**
 * Shared post-spawn pipeline (blocking AND async — AGENT-LOOP.md §15 D-A1: the
 * async branch reuses the exact same spawn-child pipeline, "全不变"):
 * turn-cap continue loop → declined partial-work return → MIN_REPORT_CHARS
 * expansion → eng-coder mutation merge → designId suffix. Returns the report.
 * onDeclined lives here (identical for both paths) — only askContinue differs:
 * blocking asks the user via the permission panel, async auto-declines.
 */
async function runChildPipeline(child, input, childOpts, childRunOpts, { parent, role, args, askContinue }) {
  const declined = { partial: null }
  let report = await runWithContinue(
    (child, input, cbs, opts) => runAgent(child, input, cbs, opts), // opts = childRunOpts + resume (managed by the pipeline)
    child, input, childOpts, childRunOpts,
    {
      askContinue,
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
  if (declined.partial !== null) {
    // declined eng-coder delivery still carries its designId — the fix round
    // re-spawns with the same slot (2026-09-01).
    if (role === "eng-coder") declined.partial += `\ndesignId: ${args.designId ?? "(single-design session — designId optional)"} — reuse it (with the same designToken) when re-spawning this eng-coder.`
    return declined.partial
  }

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

  // designId rides the delivery report (2026-09-01): the divergence-audit fix round
  // re-spawns with the SAME designId+token — the parent copies it from here, and the
  // prompt tells the model exactly where the matching token came from.
  if (role === "eng-coder") {
    report += `\ndesignId: ${args.designId ?? "(single-design session — designId optional)"} — reuse this designId with the same designToken (from the approved advisor type='design' review) when re-spawning this eng-coder for an audit fix round.`
  }

  return report
}

/** Slot-queue refill (AGENT-LOOP.md §15 D-A1/D-A6): start queue heads while a
 *  running slot is free — called from every settle (completion frees a slot) and
 *  from the turn-end collection's refill loop. Serial by construction: one slot
 *  frees per settle, one head starts per call. */
export function maybeRefillAsync(parent) {
  const queue = parent._asyncQueue ?? []
  while (queue.length > 0) {
    const running = [...(parent._asyncSubagents?.values() ?? [])].filter((e) => e.status === "running").length
    if (running >= ASYNC_SUBAGENT_LIMIT) return
    queue.shift().start()
  }
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