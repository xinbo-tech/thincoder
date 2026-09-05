/**
 * subagent.mjs — subagentTool (single tool, five actions — AGENT-LOOP.md §19/§19.5:
 * spawn/check/status/cancel/escalate; no panel action in VS Code — §19.6 AC-P4)
 * Spawn a sub-agent for an independent subtask.
 * Engineering mode: role='eng-coder' requires a valid design token from advisor(type='design').
 * §17 (AGENT-LOOP.md D-S1..S9): suspension-aware settle (settled-while-suspended →
 * history._pendingAsyncResults), manual-tier auto-turn spawn gate, shared injector.
 * §18 (AGENT-LOOP.md D-E1..E3): role-level async default (eng-coder → async),
 * internal delivery protocol; eng-coder children may only spawn synchronous explore
 * audit children (gateEngCoderSpawn — mechanical, incl. the 7th-spawn backstop).
 * §19/§19.5 (AGENT-LOOP.md, 2026-09-03): ONE tool, five actions — spawn/check/status/
 * cancel/escalate; action:"cancel" = control-class gate exemption (isControlAction),
 * status decision fields (D-M5), per-entry AbortController + cancelled settle +
 * model-visible reminder (D-M6), runChild(entry) binding, nested sub-attribution
 * forwarding (D-M8 webview 子标)。description/schema 载荷 verbatim 在 subagent-spec.mjs
 * （2026-09-05 round 2）；动作执行器/§20 调度器/async-audit 在 actions/scheduler/
 * async.mjs（public names re-exported below——500 行纪律拆分轮 2026-09-03/05）；本
 * 文件保留工具入口（dispatch/execute）+ 阻塞 spawn 路径 + 模式助手。
 */
import { validateDesignToken } from "./advisor.mjs"
import { logEvent, errText } from "../log.mjs"
import { auditTaskBook, gateEngCoderSpawn, shouldAutoResume, spawnAsyncSubagent, mergeChildMutations, nextSubagentId } from "./subagent-async.mjs"
import { subagentCheck, subagentStatus, cancelSubagentAction } from "./subagent-actions.mjs" // §19/§19.5 动作执行器（2026-09-05 拆分轮迁出）
import { normalizeFileList, depInfo, describeBlockers, assertNoDepCycle } from "./subagent-scheduler.mjs" // §20 调度器（2026-09-05 拆分轮迁出）
import { escalateAction } from "./subagent-escalate.mjs" // §19 escalate 引擎（2026-09-03 拆出——500 行纪律——verbatim 迁移）
import { subagentSpec } from "./subagent-spec.mjs" // description/schema 载荷（2026-09-05 module-split round 2——546 > 500 拆出）
// Re-export shim (2026-09-03 split/merge + 2026-09-05 模块拆分轮): the machinery + §19 action
// handlers live outside subagent.mjs — subagent-async.mjs (主体) / subagent-actions.mjs /
// subagent-scheduler.mjs — their public names stay importable from subagent.mjs so no
// consumer (agent.mjs / suspension.mjs / index.mjs / setup.mjs / panel-messages.mjs /
// tests) changed. subagentCheckTool is GONE (§19 T-M11); cancelSubagent joins the shim
// (§19.5 — the extension's UI ⏹ router reaches the pool-level cancel through it).
export { cancelSubagent, MAX_ASYNC_CHECKS } from "./subagent-actions.mjs"
export { ASYNC_SUBAGENT_LIMIT } from "./subagent-scheduler.mjs"
export { ENG_AUDIT_SPAWN_LIMIT, gateEngCoderSpawn, injectAsyncResult, collectSettledAsync, mergeChildMutations } from "./subagent-async.mjs"

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
 * `default` alias (2026-09-05 — ARCHITECTURE.md L241): a literal "default" at the
 * ARGUMENT level (matched after toLowerCase — "DEFAULT"/"Default" alike) means
 * "parameter-level not specified" — equivalent to omitting the parameter or
 * passing "" — so the default priority chain applies (type-level > global >
 * inherit parent). Other single-segment values pass through unchanged. Chain
 * values holding the literal are returned as-is from their chain position here;
 * resolveChildProvider maps a final literal to the parent provider (chain's end).
 */
export function effectiveSubagentModel(parent, role, modelArg) {
  if (modelArg && String(modelArg).toLowerCase() !== "default") return modelArg
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
  // `default` alias (2026-09-05 — ARCHITECTURE.md L241): a literal "default"
  // (case-insensitive) reaching the resolver — the tool arg, or a config chain
  // value (subagentModels[role] / subagentModel) holding the literal — resolves
  // to the parent provider (the chain's last level). A literal never becomes a
  // model name, so specForModel is never called with "default". Deliberate
  // layering asymmetry: the ARG-level literal falls through the priority chain
  // (effectiveSubagentModel — type-level > global > inherit parent), but a
  // CHAIN-LEVEL literal returned as the chain's result ends the chain here —
  // e.g. subagentModels[role]="default" with a real global model still yields
  // the parent provider (no fall-through to the global level).
  if (!modelArg || String(modelArg).toLowerCase() === "default") return { ...parent._provider }
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
  // §19.5 (AGENT-LOOP.md §19.5 D-M6 round2 #4): cancel = 控制类豁免动作——只停不启
  // （无新副作用）——planMode 放行、免权限审批、批审批分组不入组、手动档 digest 放行。
  // Used by execute-tools.mjs preGateBlocked / collectBatchPermission / permission stage.
  isControlAction(args) {
    return args?.action === "cancel"
  },
  description: subagentSpec.description, // description/schema 载荷 verbatim 在 subagent-spec.mjs（2026-09-05 module-split round 2——546 > 500 拆出）
  parameters: subagentSpec.parameters,
  async execute(args, ctx) {
    // §19 action dispatch（AGENT-LOOP.md §19 D-M1）：缺省 spawn——既有调用零迁移。
    const action = args?.action ?? "spawn"
    const parent = ctx.agent
    if (!["spawn", "check", "status", "cancel", "escalate"].includes(action)) {
      throw new Error(`Unknown subagent action: ${JSON.stringify(action)}. Valid actions: spawn (default), check, status, cancel, escalate.`)
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
    if (action === "cancel") return cancelSubagentAction(args, ctx)
    if (action === "escalate") return await escalateAction(args, ctx)
    // ── spawn（缺省 action）——既有 execute 原样 ──
    const { task, role, designToken, designId, model, async: asyncArg } = args
    // §19 required 移出 schema → execute 内校验（T-M11/advisor round 2 #5）：spawn 的
    // task 缺失/空串 → 干净的工具错误——不带残缺输入进子代理（auditTaskBook 会生成
    // 残缺审计书、setup 会把 content: undefined 送 provider）。
    if (typeof task !== "string" || !task.trim()) {
      throw new Error("subagent spawn requires a task description (task) — brief the sub-agent like a colleague who just walked in")
    }
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

    // ── §20 spawn 调度参数准入（AGENT-LOOP.md §20 D-SD1/D-SD3 + 20.4 round2 #5/#7——
    // CLI 同规格镜像）── files/dependsOn 声明即契约（v1：不做任务书文本自动解析）。
    // 缺省（两者皆缺）= 既有语义零改动（不参与冲突检测/无校验——legacy spawn 零开销）。
    // 校验序：参数形态 → 依赖 unknown id（非 consumed 墓碑——T-SD10）→ 依赖环可达
    // （T-SD5——防御断言）→ 等待态判定（spawnAsyncSubagent 内复算落点）。等待态命中 →
    // async 入 queued 等位（返回带 waiting/reason）；**sync spawn（async:false）命中 →
    // 明确错误——不队列化 sync——sync 语义零变更（T-SD13）**。
    const filesArg = args.files
    const dependsRaw = args.dependsOn
    // §20.8 D-F1.1：目录声明 fail-closed——检测器 throw → catch → 错误即工具结果
    // （模型可见"文件级明细"提示——不加静默——目录绕过冲突检测的通道闭合）。
    let files = []
    if (filesArg !== undefined && filesArg !== null) {
      try {
        files = normalizeFileList(filesArg, cwd)
      } catch (e) {
        return JSON.stringify({ status: "error", error: e.message })
      }
    }
    if (filesArg !== undefined && filesArg !== null && !Array.isArray(filesArg)) {
      throw new Error("subagent files must be an array of file paths (the write domain this task declares)")
    }
    const dependsOn = []
    if (dependsRaw !== undefined && dependsRaw !== null) {
      if (!Array.isArray(dependsRaw)) throw new Error("subagent dependsOn must be an array of async subagent ids (from prior spawn returns)")
      for (const d of dependsRaw) {
        if (typeof d !== "string" && typeof d !== "number") {
          throw new Error(`subagent dependsOn entries must be async subagent ids — got ${JSON.stringify(d)}`)
        }
        dependsOn.push(String(d))
      }
    }
    if (files.length > 0 || dependsOn.length > 0) {
      const auto = ctx.getAuto?.() ?? false
      for (const d of dependsOn) {
        if (depInfo(parent, d).state === "unknown") {
          throw new Error(`subagent dependsOn: unknown async subagent id: ${d} — dependsOn references ids from prior async spawn returns; an id already consumed by action:'check' (or auto-injected) counts as satisfied, anything else is a mistake (AGENT-LOOP.md §20 D-SD5)`)
        }
      }
      assertNoDepCycle(parent, dependsOn)
      const block = describeBlockers(parent, { _files: files, _dependsOn: dependsOn }, auto)
      if (!asyncFlag && block.kind !== "slot") {
        throw new Error(`sync spawn (async:false) cannot queue behind a scheduling conflict: ${block.detail} — pass async:true to queue the task (the scheduler starts it when the blockers clear), or wait for them to finish first (AGENT-LOOP.md §20 round2 #7)`)
      }
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
    // OWN spawn task (mechanical SUMMARY of _engTaskInput — auditTaskBook keeps the
    // docs-involved / file-list / acceptance sections VERBATIM via summarizeEngTaskInput;
    // full verbatim only when the task book lacks section headings — never a self-written
    // list) ∪ mechanically tracked _touchedFiles (mechanism lives in subagent-async.mjs).
    const childInput = auditTaskBook(task, ctx.agent, engAuditAttempt)

    // Subagent runs without MAIN-CONVERSATION callbacks — results are captured.
    // onQuestion: the child's question tool must surface in the panel like the parent's.
    // onToolCall/onToolResult/onToken/onReasoning: forwarded to the toolPanel channel as a
    // live activity stream (subagent visibility — the user watches WHAT the child
    // reads/runs/thinks/says, not just a dot). The channel name carries #subId so each
    // invocation gets its OWN block (webview _subBlocks keys by name). subId is fixed
    // before the turn-cap continue loop below — a resume reuses it, so continuation
    // chunks keep streaming into the SAME block instead of opening a new one.
    // onToolPanel (2026-09-03): the child's OWN tool-panel emissions (advisor review
    // stream, nested-spawn activity) forward into the same channel — see the callback
    // entry below.
    // stateSink receives the child's live mutation state (runAgent fills it every turn).
    // The whole pipeline is one async function so the SYNC path can await it and the
    // ASYNC path (§15 D-A1) can fire it in the background with the same semantics.
    const runChild = async (entry = null) => {
      let output = ""
      const sink = {}
      const panel = (chunk) => ctx.callbacks?.onToolPanel?.(`sub:${role}#${subId}`, chunk)
      // §19.5 D-M8 nested sub-attribution（webview 子标同构）：本箭头 = 子代理 ctx 的
      // onToolPanel 转发点——内层频道名若又是嵌套 spawn 频道（"sub:explore#N"——eng-coder
      // 内审计 explore 的 runChild panel 绑定）则附加到 chunk（chunk.sub = 去 "sub:" 的
      // 段标，如 "explore#1"）→ webview 渲染块内行首 dim 子标 span；事件类内层名（advisor
      // 等）不附加——按既有语义折叠进本子代理块（§18 T-E18 不变）。字符串 chunk（legacy
      // 形态）归一化为对象。
      const forward = (name, chunk) => {
        if (typeof name === "string" && name.startsWith("sub:")) {
          const c = typeof chunk === "string" ? { kind: "text", text: chunk } : { ...chunk }
          // 单跳归属（审计 F3 注）：当前嵌套深度上限 = 2（main → eng-coder → explore——
          // explore 无 subagent 工具）——chunk.sub 只承载一跳。若未来开放更深嵌套，
          // 此处在既有 c.sub 上叠加段路径（"explore#1/…"）而非覆盖。
          c.sub = name.slice(4)
          panel(c)
        } else {
          panel(chunk)
        }
      }
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
          // §19.5 D-M6: async 条目持条目级 controller signal（cancel 定向 abort——只停该
          // 条目）；sync 路径（无 entry）保持共享 signal（childSignal）原样（既有语义）。
          const childSig = entry ? (entry.controller?.signal ?? childSignal) : childSignal
          const result = await runAgent(provider, cwd, childInput, {
            onToken: (t) => { output += t; panel({ kind: "text", text: t }) },
            onReasoning: (r) => panel({ kind: "think", text: r }),
            onToolCall: (name, args) => panel({ kind: "tool", text: name + " " + (JSON.stringify(args) || "").slice(0, 120) }),
            onToolResult: (name, text) => panel({ kind: "tool", text: "→ " + String(text ?? "").slice(0, 80).replace(/\n/g, " ") }),
            // §18 visibility (2026-09-03 可见性补齐, CLI parity — 两边都修): the child's
            // ctx.callbacks.onToolPanel (advisor long-form stream, advisor.mjs:142-144;
            // nested-spawn activity) was empty here — runChild forwarded only
            // onToken/onReasoning/onToolCall/onToolResult, so the §18 in-child advisor
            // review was silently dropped (user saw just the advisor tool line + the
            // 80-char result line). Forward VERBATIM into the child's OWN sub-block
            // channel: chunk kinds (think/tool/text/start) and the same-kind merge
            // semantics pass through untouched (webview appendAdvisorChunk) — never the
            // CLI TUI's per-chunk line breaks.
            // §19.5 D-M8: nested spawn channels (sub:*) additionally ride a sub-label
            // (see forward above) — inner-child activity rows become distinguishable
            // inside the outer block.
            onToolPanel: forward,
            // §19.5 D-M5 turn sync: per-child per-turn hook — the pool entry's turn count
            // (status decision field) tracks the child's progress live (CLI ⟦ev⟧turn
            // 解析的 VS Code 等价——agent.mjs 每轮迭代调 callbacks.onAgentTurn)。
            // §19.5.6 D-SF1: bind the child AGENT object reference (setup.mjs puts it on
            // stateSink once runAgent's setup finishes — earliest live moment). Status
            // re-reads childAgent._touchedFiles real-time; a resume re-runs setup and the
            // sink.agent re-assignment re-binds the CURRENT run's object here (per-run
            // arrays reset — the object reference never goes stale).
            onAgentTurn: (t) => {
              if (entry) {
                entry.turn = t
                entry.childAgent = sink.agent ?? entry.childAgent
              }
            },
            onComplete: () => {},
            onQuestion: ctx.callbacks?.onQuestion ?? null,
          }, childSig, true, { ...baseOpts, resume, ...(resume ? { history: sink.history } : {}) })

          // §19.5 D-M6 (advisor round 2 #4): cancel 与完成竞态的统一终态——runAgent 返回后
          // 若条目已被 cancel（完成瞬间点击/模型 cancel 竞态），走 cancelled 分支：不 merge
          // （partial changes NOT merged/audited——与提醒文案/设计一致）、不发 done/settled、
          // 报告不入池——settle 的 cancelled 分支统一收尾（无「done 后 frozen stopped」双终态）。
          if (entry?.cancelled) return `Subagent (${role}) cancelled`

          mergeChildMutations(parent, sink)

          ctx.callbacks?.onSubagent?.({ id: subId, role, status: terminalStatus() })
          // designId rides the delivery report (2026-09-01, CLI parity): the audit fix
          // round re-spawns with the SAME designId+token — the parent copies it from here.
          const designIdNote = role === "eng-coder"
            ? `\ndesignId: ${designId ?? "(single-design session — designId optional)"} — reuse this designId with the same designToken (from the approved advisor type='design' review) when re-spawning this eng-coder for an audit fix round.`
            : ""
          return `Subagent (${role}) completed:\n${result || output.slice(0, 4000)}${designIdNote}`
        } catch (e) {
          // §19.5 D-M6 (advisor round 2 #4): cancel 定向中止的 AbortError 不是错误——
          // **先于 merge 判定**：取消路径不 mergeChildMutations（partial changes NOT
          // merged/audited——与提醒文案/设计一致——磁盘半成品不入父 guard 记账，不触发
          // verify/advisor 推回）；settle 的 cancelled 分支负责出池清理 + 停止冻结通知
          // （cancelled settle 无错误报告——T-M19 断言）。
          if (entry?.cancelled) return `Subagent (${role}) cancelled`
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
      // LOGGING（LOGGING.md——CLI parity）：child:* 阻塞 spawn——runChild 前后；
      // partial = turn-cap 拒绝（TURN_CAP_MARK 检出）；cancel 非阻塞路径不适用。
      const childLogId = `${role}#${subId}`
      const cT0 = Date.now()
      logEvent("child:spawn", { role, id: childLogId, kind: "blocking" })
      try {
        const report = await runChild()
        const r = String(report)
        const ms = Date.now() - cT0
        if (r.startsWith(`Subagent (${role}) error:`)) logEvent("child:error", { role, id: childLogId, ms, err: errText(r.split("\n")[0].replace(/^Subagent \([^)]*\) error: /, ""), 200) })
        else logEvent("child:done", { role, id: childLogId, ms, kind: r.includes("turn cap reached") ? "partial" : "ok" })
        return report
      } catch (e) {
        if (ctx.signal?.aborted || e?.name === "AbortError") throw e // 用户停——不落错误事件
        logEvent("child:error", { role, id: childLogId, ms: Date.now() - cT0, err: errText(e, 200) })
        throw e
      }
    }

    // Async branch (moved to subagent-async.mjs spawnAsyncSubagent — 2026-09-03 split):
    // slot queue — returns immediately, does not await the report.
    // §20：files/dependsOn 域元数据随 spawn 传入（entry _files/_dependsOn——D-SD2——
    // 等待态准入落点在 spawnAsyncSubagent 内复算：非 slot → 强制 queued 不占槽）。
    return spawnAsyncSubagent({ parent, ctx, subId, role, provider, childSignal, runChild, files, dependsOn })
  },
}
