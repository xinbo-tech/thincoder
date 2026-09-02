/**
 * subagent.mjs — subagentTool (single tool, four actions — AGENT-LOOP.md §19)
 * Spawn a sub-agent for an independent subtask.
 * Engineering mode: role='eng-coder' requires a valid design token from advisor(type='design').
 * §17 (AGENT-LOOP.md D-S1..S9): suspension-aware settle (settled-while-suspended →
 * history._pendingAsyncResults), manual-tier auto-turn spawn gate, shared injector.
 * §18 (AGENT-LOOP.md D-E1..E3): role-level async default (eng-coder → async),
 * internal delivery protocol; eng-coder children may only spawn synchronous explore
 * audit children (gateEngCoderSpawn — mechanical, incl. the 7th-spawn backstop).
 * §19 (AGENT-LOOP.md §19, 2026-09-03): the subagent family merged into ONE tool —
 * action:"spawn" (default) / action:"check" (retired subagent_check — blocking fetch,
 * consume) / action:"status" (new — non-blocking progress query, never consumes) /
 * action:"escalate" (retired escalate.mjs — 飞刀; constraints and the `sub:escalate`
 * relay prefix unchanged). The action HANDLERS (check/status/escalate) + the async/
 * audit machinery — gateEngCoderSpawn, auditTaskBook, shouldAutoResume,
 * spawnAsyncSubagent, settleAsyncEntry, ASYNC_SUBAGENT_LIMIT, MAX_ASYNC_CHECKS,
 * injectAsyncResult, collectSettledAsync, mergeChildMutations — live in
 * subagent-async.mjs (500-line discipline; public names re-exported below). This
 * file keeps the tool entry (description/schema/execute dispatch), the blocking
 * spawn path and the mode helpers.
 */
import { validateDesignToken } from "./advisor.mjs"
import {
  auditTaskBook, gateEngCoderSpawn, shouldAutoResume, spawnAsyncSubagent,
  subagentCheck, subagentStatus, escalateAction, mergeChildMutations, nextSubagentId,
} from "./subagent-async.mjs"
// Re-export shim (2026-09-03 split/merge): the machinery + §19 action handlers moved to
// subagent-async.mjs — its public names stay importable from subagent.mjs so no
// consumer (agent.mjs / suspension.mjs / index.mjs / setup.mjs / tests) changed.
// subagentCheckTool is GONE (§19 T-M11 — the subagent_check tool was retired; its
// semantics are action:"check").
export {
  ASYNC_SUBAGENT_LIMIT, MAX_ASYNC_CHECKS, ENG_AUDIT_SPAWN_LIMIT, gateEngCoderSpawn,
  injectAsyncResult, collectSettledAsync, mergeChildMutations,
} from "./subagent-async.mjs"

/**
 * Mode-dependent subagent role schema field (CLI setup.mjs parity). The role enum is
 * mutually exclusive per mode: normal mode advertises "coder", engineering mode
 * advertises "eng-coder". The schema filter is the FIRST line of defense — the model
 * never sees the disabled role as legal; the runtime throws in execute() stay as the
 * hard gate. Returns { role, suffix }: `role` replaces parameters.properties.role
 * wholesale; `suffix` appends to the tool-level description ("" in normal mode).
 */
export function modeRoleField(engineering) {
  return engineering
    ? {
        role: {
          type: "string",
          enum: ["explore", "plan", "eng-coder"],
          description: "The sub-agent role — see the tool description for the role capability matrix. Exact spelling required.",
        },
        suffix: "In engineering mode, use role='eng-coder' for implementation (coder is disabled).",
      }
    : {
        role: {
          type: "string",
          enum: ["explore", "plan", "coder"],
          description: "The sub-agent role — see the tool description for the role capability matrix. Exact spelling required.",
        },
        suffix: "",
      }
}

/**
 * Effective subagent model override for a role (CLI parity):
 * priority — subagent tool `model` arg > config.agent.subagentModels[role] > config.agent.subagentModel > null (inherit parent).
 */
export function effectiveSubagentModel(parent, role, modelArg) {
  if (modelArg) return modelArg
  const cfg = parent.config?.agent ?? {}
  return cfg.subagentModels?.[role] ?? cfg.subagentModel ?? null
}

/**
 * Resolve the sub-agent's provider from a model override string (CLI parity).
 * "provider:model" → named provider + model; "provider" → named provider;
 * "model" → parent's provider with a different model; null → parent's provider.
 * Keys come from config.json only (env vars are not a key source).
 */
export function resolveChildProvider(parent, modelArg) {
  if (!modelArg) return { ...parent._provider }
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
  return { ...parent._provider, model: modelArg }
}

/**
 * Resolve the design-token slot for an eng-coder spawn (2026-09-01 multi-design, FR3,
 * CLI parity): designId given → exact slot; omitted → exactly ONE slot must exist
 * (multiple slots refuse rather than guess — T16). The HMAC/TTL check itself stays in
 * validateDesignToken (unchanged). Mirror-cleared + slots present = engineering mode
 * re-entered (eng.mjs reset) → stale slots must not resurrect tokens.
 */
export function resolveDesignSlot(parent, designIdArg) {
  const slots = parent._engDesignTokens
  const hasSlots = slots instanceof Map && slots.size > 0
  const legacy = parent._engDesignToken
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
  sideEffectExempt: true, // subagent mutations are tracked by the child, not the parent
  // §19 (2026-09-03): action-level readonly classification — check/status are readonly
  // actions (plan mode passes them, no approval, readonly-parallel batches — §15 D-A2
  // readonly:true heritage); spawn (the default) and escalate are side-effecting.
  // Used by execute-tools.mjs preGateBlocked / batch grouping / permission stage.
  isReadonlyAction(args) {
    const action = args?.action
    return action === "check" || action === "status"
  },
  description:
    "Spawn a sub-agent to handle an independent subtask in an isolated context. The sub-agent returns only its final report. Spawn MULTIPLE subagents in the SAME response for parallel work—they run concurrently.\n" +
    "One tool, FOUR actions — the action parameter picks (default: \"spawn\" — omit action to spawn):\n" +
    "- spawn — run a sub-agent (task + role required; optionally model, designToken/designId for eng-coder, async). Blocking by default — returns the final report; with async:true it returns {id, role, status} immediately (see Async mode below).\n" +
    "- check — fetch the result of a previously spawned ASYNC subagent: pass n = a 1-based read counter that must increment by 1 on every call (first check of the turn: n=1); without an id it returns the NEXT completed one in arrival order (fastest first); with an id it waits for that specific subagent (including still-queued ones). Returns {done:true} once everything is consumed; unchecked results are auto-injected at turn end. WARNING: check BLOCKS until the target finishes — to look at progress without blocking use action:'status'.\n" +
    "- status — NON-BLOCKING progress query: without an id returns {overview:{running, queued, done}} over the async pool; with an id returns that subagent's status immediately. Never waits and never consumes — a finished entry stays fetchable by action:'check'. Query progress with status; only fetch with check.\n" +
    "- escalate — fly in a stronger model for hard implementation (task required; optional model = 'provider:model' from the consult models pool, default the first): the expert gets WRITE access and does the work itself — reads, edits, runs tests — then returns a post-op report (what changed, why, verification) that you review and relay. Terminology: escalate is the ONLY name — the action and the expert role are both 'escalate'; 飞刀 is the Chinese alias. When the user says 飞刀 / escalate / 'fly in <model>', call action:'escalate' directly — never via a script importing the module. Not available in engineering mode (implementation goes through eng-coder subagents). For parallel READ-ONLY opinions use consult_start instead.\n\n" +
    "Why delegate? A sub-agent runs in its own isolated context — its reads, searches, tool calls and edits never enter your history or pollute your window; only its final report comes back. Delegation keeps your working context lean (you see the whole session, not the child's noise) and the child single-mindedly focused on one task. Parallel children run concurrently, saving wall-clock time. Every coder/eng-coder child carries its own verify + advisor self-review discipline — handed-off work is already verified before you read a word of it.\n\n" +
    "Async mode (async: true): spawn WITHOUT waiting — the tool returns {id, role, status} immediately and you can keep working (checking files, running other tools). Fetch results later with action:'check' (arrival order — fastest first); to check progress WITHOUT blocking your turn use action:'status' — action:'check' blocks until the target finishes; unchecked results are auto-injected into the session at turn end, so nothing is lost. Role-based default (§18): role='eng-coder' spawns ASYNC by default — its internal delivery protocol (implementation → explore divergence audit → self-fix → advisor re-review → converged delivery) runs fully inside the child and settles in the background; pass async:false to force the blocking spawn when you must handle the report in this same turn. Every other role defaults to the blocking spawn. Use async when the main session must keep moving in parallel; use the default blocking spawn when you need the report before continuing.\n\n" +
    "Available roles (which roles are exposed depends on the active mode — see Mode filtering below):\n" +
    "- explore — read-only search & analysis. Toolset: the read/search family (grep, read, glob, code_search, doc_search, repo_outline, lsp, tree...). Receives git context auto-injected (branch, recent commits, working-tree state) when the project is a git repo. Its report must list what it searched and what it did NOT find. Fast — specify thoroughness in the task: quick / medium / thorough (default medium).\n" +
    "- plan — read-only implementation planning. Same read/search toolset; NEVER edits files. Returns a step-by-step plan for the parent to execute.\n" +
    "- coder — full implementation. The parent's complete read/write/execute toolset plus verify and advisor for self-review. Its final report must include a delivery transparency table with one row per task requirement (Done / Simplified / Not done — no deferred column).\n" +
    "- eng-coder — engineering-mode coder (available only in engineering mode, replacing coder). Same full toolset as coder plus the design-driven methodology overlay; REQUIRES a valid designToken arg obtained from a passed advisor(type='design') review. The advisor's Approved reply also echoes a designId — pass it as the designId arg: required to pick between designs when several approved reviews are active, optional for a single design. The delivery report echoes the designId back for the audit fix round.\n" +
    "Mode filtering: normal mode exposes explore/plan/coder; engineering mode exposes explore/plan/eng-coder. The schema enum reflects the active mode.\n\n" +
    "Writing the prompt:\n" +
    "- The sub-agent starts with zero context — it has not seen this conversation. Brief it like a colleague who just walked into the room: state the goal, list what you already know, hand over the specifics.\n" +
    "- Put exact paths and commands in the prompt when you know them. The sub-agent should not search for things you already know.\n" +
    "- Do not delegate understanding: if the task hinges on a file path or line number, find it yourself first and write it into the prompt.\n" +
    "- Once a sub-agent is running, leave that scope to it: don't redo its searches in parallel, and don't abandon it midway to finish manually.",
  parameters: {
    type: "object",
    properties: {
      action: { type: "string", enum: ["spawn", "check", "status", "escalate"], description: "Which action of the subagent tool family to run (default: spawn). spawn = run a new sub-agent; check = fetch an async result (BLOCKS until the target settles; n = 1-based read counter required, id optional); status = non-blocking progress query (id optional); escalate = fly in a stronger model for hard implementation (task required, model optional)." },
      task: { type: "string", description: "Task description (required for spawn and escalate). For spawn: self-contained — the sub-agent has no conversation context. For escalate: goal, constraints, entry files, acceptance criteria." },
      role: { type: "string", enum: ["explore", "plan", "coder", "eng-coder"], description: "The sub-agent role (action:'spawn' only) — see the tool description for the role capability matrix. Exact spelling required." },
      model: { type: "string", description: "(spawn) Provider/model override for this sub-agent: 'provider:model', a provider name from config, or a model name on the parent's provider. Defaults to the agent.subagentModel config, then the parent's provider. Useful for offloading heavy work to a cheaper model. (escalate) The consult candidate to fly in as 'provider:model' — default = the first consult model." },
      designToken: { type: "string", description: "Required when role='eng-coder' (spawn): the token returned by advisor(type='design') after the design review passed. Without a valid token, eng-coder cannot modify files." },
      designId: { type: "string", description: "Optional when role='eng-coder' (spawn): the designId echoed with the approved token by advisor(type='design'). Required to pick between designs when several approved reviews are active in the session — each eng-coder carries its own designId+token pair so parallel implementations never overwrite each other. Optional for a single design." },
      async: { type: "boolean", description: "(spawn) true = spawn without waiting — returns {id, status} immediately, fetch results later via action:'check' (peek without blocking via action:'status'). Default is role-level: role='eng-coder' → true (async — its internal delivery protocol runs in the background; pass async:false to force the blocking spawn when you must process the report before continuing); every other role → false (blocking)." },
      id: { type: "number", description: "(check/status) The subagent id to address, as returned by an async spawn. For check: waits for that specific subagent (including still-queued ones); omit to fetch the next completed one (arrival order). For status: returns that subagent's status without waiting or consuming; omit for the full overview." },
      n: { type: "number", description: "(check — required) 1-based read counter — must increment by 1 on every check call (n=1 for the first check of the turn); out-of-order/duplicate n is rejected. Not used by status." },
    },
  },
  async execute(args, ctx) {
    // §19 action dispatch（AGENT-LOOP.md §19 D-M1）：缺省 spawn——既有调用零迁移。
    const action = args?.action ?? "spawn"
    const parent = ctx.agent
    if (!["spawn", "check", "status", "escalate"].includes(action)) {
      throw new Error(`Unknown subagent action: ${JSON.stringify(action)}. Valid actions: spawn (default), check, status, escalate.`)
    }
    // §19 round2 #3 restricted-variant action gate（机械层——schema 层提示在 setup.mjs
    // engAuditSubagentTool）：eng-coder 子代理的受限通道仅 spawn（sync explore 审计）——
    // escalate 会内部 spawn coder+WRITE（违 explore-only 意图）；check/status 无意义
    // （子代理上下文无 async 池）。镜像 T-E4/E5 的 action 维度。
    if ((ctx.depth ?? 0) > 0 && parent?._role === "eng-coder" && action !== "spawn") {
      throw new Error(`action:'${action}' is unavailable inside an eng-coder subagent — the restricted subagent channel is spawn-only (sync role='explore' audits, AGENT-LOOP.md §18 D-E3)`)
    }
    if (action === "check") return await subagentCheck(args, ctx)
    if (action === "status") return subagentStatus(args, ctx)
    if (action === "escalate") return await escalateAction(args, ctx)
    // ── spawn（缺省 action）——既有 execute 原样 ──
    const { task, role, designToken, designId, model, async: asyncArg } = args
    const { runAgent } = await import("../agent.mjs")
    const cwd = ctx.cwd
    // §18 F1/D-E1 role-level async default (AGENT-LOOP.md §18 D-E1): an eng-coder
    // spawn is ASYNC unless the caller explicitly passes async:false — its internal
    // delivery protocol settles in the background; every other role stays blocking.
    const asyncFlag = asyncArg ?? role === "eng-coder"

    // §17 N3/D-S6 spawn gate (manual tier): auto-turn digests may not spawn — async
    // OR blocking — the digest must stay organize-only. AUTO tier (ctx.getAuto) is
    // exempt (推进型 — the user authorized unattended continuation). Mechanical
    // refusal so the digest never pops a permission panel or chains background work.
    if (parent._inAutoTurn && !(ctx.getAuto?.() ?? false)) {
      return JSON.stringify({ status: "error", error: "cannot spawn subagents from a manual auto-turn — wait for user input" })
    }
    // §17 D-S9: during a suspension session children share the SESSION signal
    // (ctx.sessionSignal) — a digest's own Stop/interrupt must not abort the pool;
    // the session abort controller stops everything. Outside a session children ride
    // the spawning turn's controller (existing semantics).
    const childSignal = ctx.sessionSignal ?? ctx.signal ?? null

    // Role normalization + whitelist (2026-08-25, coder-leak fix): the runtime gates below
    // used exact string comparison — a variant role ("Coder", " coder") bypassed BOTH gates
    // and fell through to full-tool/no-overlay (a full-write coder without design review).
    // Schema enums are advisory; providers don't enforce them. Fail closed on anything that
    // isn't an exact known role.
    const ROLES = new Set(["explore", "plan", "coder", "eng-coder"])
    if (!ROLES.has(role)) {
      throw new Error(`Unknown subagent role: ${JSON.stringify(role)}. Valid roles: explore, plan, coder, eng-coder (exact spelling).`)
    }
    // §18 D-E3 internal-spawn mechanical gate: an eng-coder sub-agent may only spawn
    // SYNC explore (audit) children — non-explore roles and async spawns are refused,
    // and the audit budget is enforced (the 7th audit spawn is refused — the stalled
    // signal of the 5-fix-round cap). Runs BEFORE the mode gates so the eng-coder-
    // specific error (not the generic engineering-mode one) surfaces. Returns the
    // audit attempt number — the mechanical audit-scope augmentation below uses it —
    // or null outside an eng-coder context.
    const engAuditAttempt = gateEngCoderSpawn(ctx.agent, ctx.depth, role, asyncArg)
    // Role is mutually exclusive per mode: normal mode → "coder", engineering mode → "eng-coder" (CLI parity)
    if (parent.config?.agent?.engineering && role === "coder") {
      throw new Error("Engineering mode: use role='eng-coder' for implementation tasks.")
    }
    if (!parent.config?.agent?.engineering && role === "eng-coder") {
      throw new Error("Engineering mode is not active — use role='coder' for implementation tasks.")
    }
    // §15 D-A3: async spawn is a depth-0 main-session capability — a subagent trying to
    // async-spawn its own children would create an unbounded background tree. Reject loud.
    if (asyncFlag && (ctx.depth ?? 0) > 0) {
      throw new Error("async spawn only available at the top level")
    }

    // Provider/model override: tool `model` arg > subagentModels[role] > subagentModel > parent provider (CLI parity)
    const provider = resolveChildProvider(parent, effectiveSubagentModel(parent, role, model))

    // eng-coder token gate: the design review must have passed and the caller must
    // present the exact token advisor issued — otherwise the child is not authorized to code.
    // 2026-09-01: multi-design slots — the token is located by designId (exact slot,
    // single-slot fallthrough); HMAC/TTL validation itself is unchanged (CLI parity).
    let issuedToken
    if (role === "eng-coder") {
      issuedToken = resolveDesignSlot(parent, designId).token
      if (!issuedToken || designToken !== issuedToken || !validateDesignToken(designToken)) {
        throw new Error("Invalid or missing design token — run advisor with type='design' first and pass the returned token as designToken.")
      }
    }

    // Turn cap from shared config (CLI parity)
    const maxTurns = parent.config?.agent?.subagentTurns ?? 100
    // advisor fix #1：id 分配跨 runAgent 单调（池沿 history 存活——agent._subIdCounter
    // per-run 重建，重复 id 会覆盖池条目——nextSubagentId 以池内最大 id 续号）。
    const subId = nextSubagentId(parent)

    // §18 D-E2 ③: the audit spawn's task book is appended MECHANICALLY — the eng-coder's
    // OWN spawn task (verbatim _engTaskInput) ∪ mechanically tracked _touchedFiles, never a
    // self-written list (mechanism lives in subagent-async.mjs auditTaskBook).
    const childInput = auditTaskBook(task, ctx.agent, engAuditAttempt)

    // Subagent runs without MAIN-CONVERSATION callbacks — results are captured.
    // onQuestion: the child's question tool must surface in the panel like the parent's.
    // onToolCall/onToolResult/onToken/onReasoning: forwarded to the toolPanel channel as a
    // live activity stream (subagent visibility — the user watches WHAT the child
    // reads/runs/thinks/says, not just a dot). The channel name carries #subId so each
    // invocation gets its OWN block (webview _subBlocks keys by name). subId is fixed
    // before the turn-cap continue loop below — a resume reuses it, so continuation
    // chunks keep streaming into the SAME block instead of opening a new one.
    // stateSink receives the child's live mutation state (runAgent fills it every turn).
    // The whole pipeline is one async function so the SYNC path can await it and the
    // ASYNC path (§15 D-A1) can fire it in the background with the same semantics.
    const runChild = async () => {
      let output = ""
      const sink = {}
      const panel = (chunk) => ctx.callbacks?.onToolPanel?.(`sub:${role}#${subId}`, chunk)
      const agentMod = await import("../agent.mjs")
      // §17 D-S8 冻结门控: an ASYNC child that settles while the suspension session is
      // active reports "settled" (block stays live as "done · awaiting digestion");
      // the pool-drain freeze at session exit later reports the terminal collapse.
      // SYNC children settle inline inside their turn — the caller consumes the result
      // directly, so their terminal notification stays "done" regardless of suspension.
      const terminalStatus = () => (asyncFlag && parent.history?._suspended === true ? "settled" : "done")
      const baseOpts = {
        depth: 1, role, maxTurns,
        streamOutput: true, // exempt from the agent.mjs onToken depth gate (escalate parity)
        engState: { enabled: parent.config?.agent?.engineering ?? false, engDesignToken: parent._engDesignToken },
        // §18 D-E3 task-domain authorization (spawn-time): the design token was
        // verified above — approved design + spawn task = authorization for the
        // child's writes. The exemption granularity is ONLY the permission/approval
        // stage (autoApprove equivalent — the child never pops a per-write panel):
        // JSON parse / unknown tool / planMode / design-token gates run BEFORE the
        // permission stage in execute-tools and stay fully effective (T-E14).
        engDesignReviewed: role === "eng-coder", // token verified above → child may write files
        // §18 D-E2 ③: the eng-coder's own spawn task rides the child as the verbatim
        // source for its audit task book (mechanical — never self-written).
        ...(role === "eng-coder" ? { engTaskInput: task } : {}),
        stateSink: sink,
      }
      // Turn-cap continue loop (escalate parity): hitting the cap asks the user through
      // the panel's question card — unlimited continues, each with a fresh budget and the
      // child's own history (resume:true, opts.history=sink.history). Declined / headless
      // (no onQuestion) → partial-work return. ASYNC children never pop a continue panel
      // (§15 D-A3): auto-decline, except engineering && AUTO, which auto-resumes — see the
      // ContinueError branch below (§18 D-E2 cap fallback for the default-async eng-coder).
      for (let resume = false; ; resume = true) {
        try {
          const result = await runAgent(provider, cwd, childInput, {
            onToken: (t) => { output += t; panel({ kind: "text", text: t }) },
            onReasoning: (r) => panel({ kind: "think", text: r }),
            onToolCall: (name, args) => panel({ kind: "tool", text: name + " " + (JSON.stringify(args) || "").slice(0, 120) }),
            onToolResult: (name, text) => panel({ kind: "tool", text: "→ " + String(text ?? "").slice(0, 80).replace(/\n/g, " ") }),
            onComplete: () => {},
            onQuestion: ctx.callbacks?.onQuestion ?? null,
          }, childSignal, true, { ...baseOpts, resume, ...(resume ? { history: sink.history } : {}) })

          mergeChildMutations(parent, sink)

          ctx.callbacks?.onSubagent?.({ id: subId, role, status: terminalStatus() })
          // designId rides the delivery report (2026-09-01, CLI parity): the audit fix
          // round re-spawns with the SAME designId+token — the parent copies it from here.
          const designIdNote = role === "eng-coder"
            ? `\ndesignId: ${designId ?? "(single-design session — designId optional)"} — reuse this designId with the same designToken (from the approved advisor type='design' review) when re-spawning this eng-coder for an audit fix round.`
            : ""
          return `Subagent (${role}) completed:\n${result || output.slice(0, 4000)}${designIdNote}`
        } catch (e) {
          // Max-turns exhaustion may still have written files — merge whatever the child touched
          if (role === "eng-coder") mergeChildMutations(parent, sink)
          if (e instanceof agentMod.ContinueError) {
            // Blocking children ask the user through the panel question card below.
            // §15 D-A3 (2026-09-02 unified rule, CLI parity — CLI async askContinue:
            // () => Promise.resolve(Boolean(config.agent.engineering && autoApprove));
            // the VS Code live-AUTO equivalent is ctx.getAuto — execute-tools wires
            // runAgent's live autoApprove getter into every tool ctx, the per-run
            // VS Code agent has no autoApprove field): a background (async) child
            // NEVER pops a continue panel.
            if (!asyncFlag && ctx.callbacks?.onQuestion) {
              const go = await ctx.callbacks.onQuestion(
                `Subagent (${role}) reached ${e.turns} turns (limit). Continue from here?`,
                ["Continue", "Stop"],
              )
              if (go === "Continue") continue
            }
            // §15 D-A3 exception / §18 D-E2 cap fallback: engineering && AUTO → the async
            // child auto-resumes (mechanical check lives in subagent-async.mjs shouldAutoResume).
            if (shouldAutoResume(asyncFlag, parent, ctx)) {
              continue // AUTO 自动续跑：resume:true + 子代理自身 history、fresh budget（与用户 Continue 同路径）
            }
            ctx.callbacks?.onSubagent?.({ id: subId, role, status: "error", error: `turn cap reached (${e.turns} turns) — work may be partial` })
            // declined eng-coder delivery still carries its designId — the fix round
            // re-spawns with the same slot (2026-09-01, CLI parity).
            const capNote = role === "eng-coder" ? `\ndesignId: ${designId ?? "(single-design session — designId optional)"} — reuse it (with the same designToken) when re-spawning this eng-coder.` : ""
            return `Subagent (${role}) stopped: turn cap reached (${e.turns} turns) — work may be partial; review recent_changes before deciding next steps.\nPartial output: ${output.slice(0, 2000)}${capNote}`
          }
          ctx.callbacks?.onSubagent?.({ id: subId, role, status: "error", error: e.message })
          return `Subagent (${role}) error: ${e.message}\nPartial output: ${output.slice(0, 2000)}`
        }
      }
    }

    if (!asyncFlag) {
      ctx.callbacks?.onSubagent?.({ id: subId, role, status: "started", startedAt: Date.now(), model: provider.model ?? null })
      return await runChild()
    }

    // Async branch (moved to subagent-async.mjs spawnAsyncSubagent — 2026-09-03 split):
    // slot queue — returns immediately, does not await the report.
    return spawnAsyncSubagent({ parent, ctx, subId, role, provider, childSignal, runChild })
  },
}
