/**
 * subagent.mjs — subagentTool
 * Spawn a sub-agent for an independent subtask.
 * Engineering mode: role='eng-coder' requires a valid design token from advisor(type='design').
 * §17 (AGENT-LOOP.md D-S1..S9): suspension-aware settle (settled-while-suspended →
 * history._pendingAsyncResults), manual-tier auto-turn spawn gate, shared injector.
 */
import { validateDesignToken } from "./advisor.mjs"
import { escapeXml, offloadToolResult, pushReal } from "../agent/run-helpers.mjs"

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
  description:
    "Spawn a sub-agent to handle an independent subtask in an isolated context. The sub-agent returns only its final report. Spawn MULTIPLE subagents in the SAME response for parallel work—they run concurrently.\n" +
    "Why delegate? A sub-agent runs in its own isolated context — its reads, searches, tool calls and edits never enter your history or pollute your window; only its final report comes back. Delegation keeps your working context lean (you see the whole session, not the child's noise) and the child single-mindedly focused on one task. Parallel children run concurrently, saving wall-clock time. Every coder/eng-coder child carries its own verify + advisor self-review discipline — handed-off work is already verified before you read a word of it.\n\n" +
    "Async mode (async: true): spawn WITHOUT waiting — the tool returns {id, role, status} immediately and you can keep working (checking files, running other tools). Fetch results later with the subagent_check tool (arrival order — fastest first); unchecked results are auto-injected into the session at turn end, so nothing is lost. Use async when the main session must keep moving in parallel; use the default blocking spawn when you need the report before continuing.\n\n" +
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
      task: { type: "string", description: "Task description" },
      role: { type: "string", enum: ["explore", "plan", "coder", "eng-coder"], description: "The sub-agent role — see the tool description for the role capability matrix. Exact spelling required." },
      model: { type: "string", description: "Provider/model override for this sub-agent: 'provider:model', a provider name from config, or a model name on the parent's provider. Defaults to the agent.subagentModel config, then the parent's provider. Useful for offloading heavy work to a cheaper model." },
      designToken: { type: "string", description: "Required when role='eng-coder': the token returned by advisor(type='design') after the design review passed. Without a valid token, eng-coder cannot modify files." },
      designId: { type: "string", description: "Optional when role='eng-coder': the designId echoed with the approved token by advisor(type='design'). Required to pick between designs when several approved reviews are active in the session — each eng-coder carries its own designId+token pair so parallel implementations never overwrite each other. Optional for a single design." },
      async: { type: "boolean", description: "true = spawn without waiting — returns {id} immediately, fetch results later via subagent_check. Default false (blocking)." },
    },
    required: ["task", "role"],
  },
  async execute(args, ctx) {
    const { task, role, designToken, designId, model, async: asyncFlag } = args
    const { runAgent } = await import("../agent.mjs")
    const parent = ctx.agent
    const cwd = ctx.cwd

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
    parent._subIdCounter = (parent._subIdCounter ?? 0) + 1
    const subId = parent._subIdCounter

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
        engDesignReviewed: role === "eng-coder", // token verified above → child may write files
        stateSink: sink,
      }
      // Turn-cap continue loop (escalate parity): hitting the cap asks the user through
      // the panel's question card — unlimited continues, each with a fresh budget and the
      // child's own history (resume:true, opts.history=sink.history). Declined / headless
      // (no onQuestion) → partial-work return. ASYNC children auto-decline (§15 D-A3:
      // a background child must never pop a continue panel on the main session).
      for (let resume = false; ; resume = true) {
        try {
          const result = await runAgent(provider, cwd, task, {
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
            if (!asyncFlag && ctx.callbacks?.onQuestion) {
              const go = await ctx.callbacks.onQuestion(
                `Subagent (${role}) reached ${e.turns} turns (limit). Continue from here?`,
                ["Continue", "Stop"],
              )
              if (go === "Continue") continue
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

    // ─── Async branch（§15 D-A1/D-A4）：槽位队列——立即返回，不 await 报告 ───
    // 上限指标 = running 数（done/queued 不计入）；≥ ASYNC_SUBAGENT_LIMIT → 入队
    // （status:"queued" + position），任一 running settle → 队列头部自动补位启动。
    // 关键结构：settle 逻辑绑定 ENTRY 自身（entry._resolve / entry.start）——不同 execute
    // 调用之间互不串扰（本调用的 finish 不得去解析另一个调用的 entry.settled）。
    parent._asyncSubagents = parent._asyncSubagents ?? new Map()
    const id = subId
    const entry = {
      id, role,
      status: "queued", position: 0,
      report: null, error: null, done: false,
      settled: null, _resolve: null,
      // §17: the child's effective signal (session-first) — the settle callback reads it
      // to skip the pending transfer when the session was aborted (abort = discard).
      signal: childSignal,
    }
    entry.settled = new Promise((res) => { entry._resolve = res })
    entry.start = () => {
      entry.status = "running"
      ctx.callbacks?.onSubagent?.({ id: entry.id, role: entry.role, status: "started", startedAt: Date.now(), model: provider.model ?? null })
      runChild().then(
        (report) => settleAsyncEntry(parent, entry, report, null, ctx.callbacks?.onAsyncSettled),
        (err) => settleAsyncEntry(parent, entry, null, err?.message ?? String(err), ctx.callbacks?.onAsyncSettled),
      )
    }
    parent._asyncSubagents.set(id, entry)
    const runningCount = [...parent._asyncSubagents.values()].filter((x) => x.status === "running").length
    if (runningCount < ASYNC_SUBAGENT_LIMIT) {
      entry.start()
      return { id, role, status: "running" }
    }
    entry.position = [...parent._asyncSubagents.values()].filter((x) => x.status === "queued").length
    return { id, role, status: "queued", position: entry.position }
  },
}

/**
 * §15 D-A1 settle：落 report/error + 解析该 entry 自己的 settled（arrival-order 唤醒
 * subagent_check / 回合收尾）→ 腾槽补位（running settle 一个即启动队列头部——完成即补位，
 * 不消费才补；失败/abort 同样腾槽）。entry.start 绑定创建它的 execute 调用上下文，
 * 因此补位启动的子代理跑的是它自己的 pipeline。
 * §17 D-S3 ②/D-S8（VS Code 对齐）：settle 时若处于挂起态（parent.history._suspended——
 * 共享数组，跨 runAgent 调用存活；读取时刻为准，确定性）→ 延迟冻结：条目移交
 * history._pendingAsyncResults（由下个回合 prepareRun 前注入，D-S3 ② 记账点）并从池
 * 移除；正常回合内 settle 行为不变（留池，回合尾 collectSettledAsync 直注入 ①）。
 * 会话中止（entry.signal aborted）跳过移交并**出池清理**（2026-09-02 偏差修复 #2）——
 * abort 清池不注入陈旧错误，且 done 僵尸条目不得留在池里让 poolLive 恒真。
 */
function settleAsyncEntry(parent, entry, report, error, notifySettle) {
  entry.report = report
  entry.error = error
  entry.done = true
  // 2026-09-02 偏差修复 #2（abort 分支出池清理）：中止的池项 = 丢弃（D-S5——abort 清池
  // 不注入陈旧错误）。先前 aborted 项不移交 pending 也不出池——done 僵尸条目留在共享
  // map，poolLive 恒真（释放窗口竞态后果 (a)：僵尸挂起会话、驱动器 waitForSettleOrWake
  // 空转直到用户手动 Stop）。abort 分支做与挂起移交同构的出池清理：从池移除、不注入。
  if (entry.signal?.aborted) {
    parent.history?._asyncSubagents?.delete(entry.id)
    parent._asyncSubagents?.delete(entry.id) // map keys are the spawn-time id (number)
  } else if (parent.history?._suspended === true) {
    const hist = parent.history
    const pend = (hist._pendingAsyncResults ??= [])
    if (!pend.includes(entry)) pend.push(entry)
    hist._asyncSubagents?.delete(entry.id)
    parent._asyncSubagents?.delete(entry.id) // map keys are the spawn-time id (number)
  }
  entry._resolve?.(entry)
  const queued = [...(parent._asyncSubagents?.values() ?? [])].filter((x) => x.status === "queued")
  if (queued.length > 0) queued[0].start()
  notifySettle?.()
}

/**
 * Merge a child's mutations into the parent's bookkeeping
 * (CLI mergeChildMutations parity): the parent's advisor/verify guards must see
 * delegated file changes. Fresh code → fresh convergence budget: a verify/advisor
 * pass earned on the pre-delegation code is stale the moment the child writes.
 * Shared by subagent (eng-coder) and escalate — three-way review
 * 2026-08-16: escalate's local copy skipped the resets, letting surgery bypass
 * the parent's verify/advisor gates.
 */
export function mergeChildMutations(parent, sink) {
  const touched = sink?.touchedFiles ?? []
  if (touched.length === 0) return
  parent._mutatedThisRun = true
  for (const abs of touched) {
    if (!parent._touchedFiles.includes(abs)) parent._touchedFiles.push(abs)
  }
  if (parent._calledAdvisorThisRun) parent._calledAdvisorThisRun = false
  if (parent._verifiedThisRun) {
    parent._verifiedThisRun = false
    parent._verifyPassed = undefined
  }
  parent._advisorRound = 0
  parent._advisorSession = null
}


// ─── Async subagent machinery（AGENT-LOOP.md §15 + §17，CLI D-A1/D-A2/D-A4/D-S3 同规格）───

/** 机械并发上限：running 数 <4 时新 async spawn 立即启动，≥4 入队等待（用户 2026-09-02 拍板）。 */
export const ASYNC_SUBAGENT_LIMIT = 4

/** subagent_check 单回合最多读取次数（consult_check 同款防循环，评审 #1 补定义）。 */
export const MAX_ASYNC_CHECKS = 3

/**
 * §17 D-S3 shared injector: inject one settled async entry into the session as a
 * user-role reminder (XML-escaped — child reports may carry file/web content; >64K
 * offloaded with preview + path). Single shared form for ALL consumption points —
 * the turn-end collection (collectSettledAsync below), the run-start
 * history._pendingAsyncResults injection — plus the suspension-exit residual flush.
 * Consumed = the caller removes the entry from its container; no double inject.
 */
export async function injectAsyncResult(entry, { history, fullHistory, cwd }) {
  const body = entry.error != null
    ? `error: ${escapeXml(entry.error)}`
    : escapeXml(offloadToolResult(cwd, entry.report ?? ""))
  pushReal(history, fullHistory, {
    role: "user",
    content: `[System reminder: async subagent #${entry.id} (${entry.role}) finished]\n\n${body}`,
  })
}

/**
 * §17 D-S1 turn-end async collection (AGENT-LOOP.md §17 D-S1 — lives here with the
 * async machinery; agent.mjs's finally calls it, 500-line split): inject every entry
 * that SETTLED during this run (shared injector form — XML-escaped, >64K offloaded)
 * and remove it from the pool. Running/queued STAY — no allSettled wait: the
 * suspension session digests them as they settle (D-S2/D-S9). Single ownership:
 * entries settled inside a suspension session were moved to
 * history._pendingAsyncResults by the settle callback, so this only sees
 * non-suspended settles (no double inject — D-S3 ①/②).
 */
export async function collectSettledAsync(agent, { history, fullHistory, cwd }) {
  const map = agent._asyncSubagents
  if (!map || map.size === 0) return
  for (const e of [...map.values()]) {
    if (!e.done) continue // still running — stays in the pool (D-S1)
    await injectAsyncResult(e, { history, fullHistory, cwd })
    map.delete(e.id) // map keys are the spawn-time id (number — subagent.mjs async branch)
  }
}

/**
 * subagent_check — fetch results of ASYNC subagents (spawned with async: true).
 * readonly: true（评审 #6——consult_check 先例，planMode 门控需要）。
 * - n（必填）：1-based 递增读数——每回合首调 n=1，之后逐次 +1；乱序/重复 n 拒绝。
 * - 不带 id：按完成顺序（arrival order）返回下一个完成的 async 子代理——先完成先处理。
 * - 带 id：等该特定子代理（含 queued 项——先等它启动再等完成）。
 * - 全部已消费 → { done: true }（consult_check 同款终结语义）。
 * - 错误路径：未知/已消费 id → { id, status:"error", error:"unknown async subagent id: <id>" }。
 */
export const subagentCheckTool = {
  name: "subagent_check",
  readonly: true,
  description:
    "Fetch the result of a previously spawned ASYNC subagent (subagent with async: true). " +
    "Pass n = the 1-based read counter — it must increment by 1 on every call (first call of the turn: n=1). " +
    "Without an id, returns the NEXT completed async subagent in arrival order (fastest first); " +
    "with an id, waits for that specific subagent (including still-queued ones). " +
    "Returns {done: true} when everything is consumed. Unchecked results are automatically " +
    "injected into the session at turn end — you do not need to check every one.",
  parameters: {
    type: "object",
    properties: {
      id: { type: "number", description: "Optional: the subagent id to wait for (as returned by the async spawn). Omit to fetch the next completed one (arrival order)." },
      n: { type: "number", description: "Required: 1-based read counter — increment by 1 on every call (n=1 for the first check of the turn)." },
    },
    required: ["n"],
  },
  async execute({ id, n }, ctx) {
    const parent = ctx.agent
    const map = parent._asyncSubagents
    // 未知/已消费 id 优先报错（评审 #5：即使注册表已空也要明确错误，不悬挂不误报 done）
    if (id != null && (!map || !map.has(id))) {
      return JSON.stringify({ id, status: "error", error: `unknown async subagent id: ${id}` })
    }
    if (!map || map.size === 0) return JSON.stringify({ done: true })
    if (typeof n !== "number" || !Number.isInteger(n) || n < 1) {
      return JSON.stringify({ status: "error", error: "invalid read counter — pass n = lastN+1" })
    }
    if (n > MAX_ASYNC_CHECKS) {
      return JSON.stringify({ status: "error", error: "check limit exceeded — use turn-end auto-wait for the rest" })
    }
    const lastN = parent._asyncCheckN ?? 0
    if (n !== lastN + 1) {
      return JSON.stringify({ status: "error", error: "invalid read counter — pass n = lastN+1" })
    }
    parent._asyncCheckN = n
    if (id != null) {
      const entry = map.get(id)
      if (!entry) return JSON.stringify({ id, status: "error", error: `unknown async subagent id: ${id}` })
      await entry.settled
      map.delete(id)
      return entry.error != null
        ? JSON.stringify({ id, status: "error", error: entry.error })
        : JSON.stringify({ id, role: entry.role, status: "done", report: entry.report })
    }
    const pending = [...map.values()]
    if (pending.length === 0) return JSON.stringify({ done: true })
    const entry = await Promise.race(pending.map((e) => e.settled))
    map.delete(entry.id)
    return entry.error != null
      ? JSON.stringify({ id: entry.id, status: "error", error: entry.error })
      : JSON.stringify({ id: entry.id, role: entry.role, status: "done", report: entry.report })
  },
}
