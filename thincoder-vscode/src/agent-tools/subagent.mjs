/**
 * subagent.mjs — subagentTool (single tool, seven actions — AGENT-LOOP.md §19/§19.5:
 * spawn/status/observe/send/cancel/escalate/consume-design; no panel action in VS Code — §19.6 AC-P4; §19.8 2026-09-06: action:'check' 删除——结果仅自动通道；§2.6 2026-09-07: +action:'consume-design'
 * 链终消费制——父侧核销消费 designId 槽——执行器在 subagent-spawn-gate.mjs; SUBAGENT-OBSERVE-SEND.md 2026-09-08: +action:'observe'/'send' 父侧观察/注入运行中异步子代理——执行器在 subagent-actions.mjs)
 * Spawn a sub-agent for an independent subtask.
 * Engineering mode: role='eng-coder' requires a valid design token from advisor(type='design').
 * §17 (AGENT-LOOP.md D-S1..S9): suspension-aware settle (settled-while-suspended →
 * history._pendingAsyncResults), manual-tier auto-turn spawn gate, shared injector.
 * §18 (AGENT-LOOP.md D-E1..E3 + D-E1a R12 2026-09-06): depth-gated async default
 * (depth-0 → async, every role; depth>0 → sync — D-E1 role-level 缺省已 supersede),
 * internal delivery protocol; eng-coder children may only spawn synchronous explore
 * audit children (gateEngCoderSpawn — mechanical, incl. the 7th-spawn backstop).
 * §19/§19.5 (AGENT-LOOP.md, 2026-09-03): ONE tool, seven actions — spawn/status/observe/send/
 * cancel/escalate/consume-design（§19.8 2026-09-06：action:'check' 删除——结果仅自动通道）; action:"cancel" = control-class gate exemption (isControlAction),
 * status decision fields (D-M5), per-entry AbortController + cancelled settle +
 * model-visible reminder (D-M6), runChild(entry) binding, nested sub-attribution
 * forwarding (D-M8 webview 子标)。description/schema 载荷 verbatim 在 subagent-spec.mjs
 * （2026-09-05 round 2）；动作执行器/§20 调度器/async-audit 在 actions/scheduler/
 * async.mjs（public names re-exported below——500 行纪律拆分轮 2026-09-03/05）；本
 * 文件保留工具入口（dispatch/execute）+ 阻塞 spawn 路径 + 模式助手。2026-09-08 结构债
 * 批 6：runChild 巨型闭包（子代理执行闭环本体）→ ./subagent-run.mjs（CLI 同名对齐——
 * 自由变量收编参数对象——verbatim 迁移零行为变化——原私有非导出——消费面零影响）。
 */
import { logEvent, errText } from "@thincoder/core/log.mjs"
import { auditTaskBook, gateEngCoderSpawn, spawnAsyncSubagent, nextSubagentId } from "./subagent-async.mjs"
import { buildChildSignal } from "./async-settle.mjs"
import { subagentStatus, cancelSubagentAction, subagentObserve, subagentSend } from "./subagent-actions.mjs" // §19/§19.5 动作执行器（2026-09-05 拆分轮迁出；§19.8 删 check——subagentCheck 退役；2026-09-08 SUBAGENT-OBSERVE-SEND：+observe/send 执行器）
// Eng-coder spawn design-token gate — resolveDesignSlot / dropExpiredTokenSlot /
// authorizeEngCoderDesignToken moved to subagent-spawn-gate.mjs on 2026-09-06 (module
// split: this file crossed the >500-line hard cap). resolveDesignSlot re-exported below
// for the existing test import paths.
import { authorizeEngCoderDesignToken, executeConsumeDesignAction, resolveBatchDoc, NEEDS_BATCH_DOC } from "./subagent-spawn-gate.mjs"
export { resolveDesignSlot } from "./subagent-spawn-gate.mjs"
import { normalizeFileList, depInfo, describeBlockers, assertNoDepCycle } from "./subagent-scheduler.mjs" // §20 调度器（2026-09-05 拆分轮迁出）
import { escalateAction } from "./subagent-escalate.mjs" // §19 escalate 引擎（2026-09-03 拆出——500 行纪律——verbatim 迁移）
import { subagentSpec } from "./subagent-spec.mjs" // description/schema 载荷（2026-09-05 module-split round 2——546 > 500 拆出）
import { runChild } from "./subagent-run.mjs" // runChild 闭环（2026-09-08 结构债批 6——500 硬限拆——本体迁出——CLI 同名对齐）
// Re-export shim (2026-09-03 split/merge + 2026-09-05 模块拆分轮): the machinery + §19 action
// handlers live outside subagent.mjs — subagent-async.mjs (主体) / subagent-actions.mjs /
// subagent-scheduler.mjs — their public names stay importable from subagent.mjs so no
// consumer (agent.mjs / suspension.mjs / index.mjs / setup.mjs / panel-messages.mjs /
// tests) changed. subagentCheckTool is GONE (§19 T-M11); cancelSubagent joins the shim
// (§19.5 — the extension's UI ⏹ router reaches the pool-level cancel through it).
export { cancelSubagent } from "./subagent-actions.mjs"
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
          enum: ["explore", "plan", "eng-coder", "eng-designer"],
          description: "The sub-agent role — see the tool description for the role capability matrix. Exact spelling required.",
        },
        suffix: "In engineering mode, use role='eng-coder' for implementation (coder is disabled) and role='eng-designer' for design writing.",
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
  // F-1 (QUICKFIX-BATCH-2——CLI F-2c 镜像)：裸渠道名克隆须重派生 model——MODEL-SELECTION
  // M3④：渠道默认单值 `byName.model` 优先；渠道无默认模型 → 父 provider 兜底保留（尾部兜底链
  // 不动——同渠道家族）；两者皆无 → model 缺失交 chat 前 guard fail-fast。
  if (byName) return { ...withKey(byName), model: byName.model ?? parent._provider?.model }
  return { ...parent._provider, model: modelArg }
}

export const subagentTool = {
  name: "subagent",
  sideEffectExempt: true, // subagent mutations are tracked by the child, not the parent
  // §19 (2026-09-03): action-level readonly classification — status is the readonly
  // query action (plan mode passes it, no approval, readonly-parallel batches — §15
  // D-A2 readonly:true heritage); spawn (the default) and escalate are side-effecting.
  // §19.8 (2026-09-06): action:'check' deleted — no polling/blocking action remains.
  // Used by execute-tools.mjs preGateBlocked / batch grouping / permission stage.
  isReadonlyAction(args) {
    const action = args?.action
    // observe（SUBAGENT-OBSERVE-SEND.md D1——2026-09-08）= readonly 查询动作——与 status
    // 同分类：plan mode 放行、零消耗、readonly 批不审批。
    return action === "status" || action === "observe"
  },
  // §19.5 (AGENT-LOOP.md §19.5 D-M6 round2 #4): cancel = 控制类豁免动作——只停不启
  // （无新副作用）——planMode 放行、免权限审批、批审批分组不入组、手动档 digest 放行。
  // Used by execute-tools.mjs preGateBlocked / collectBatchPermission / permission stage.
  // send（SUBAGENT-OBSERVE-SEND.md D2——2026-09-08）同 control 类（评审 #4 采纳）：只入
  // 注入队列不落盘/不改文件——planMode 放行、免权限审批（给运行中子代理引导不视为文件写）。
  isControlAction(args) {
    return args?.action === "cancel" || args?.action === "send"
  },
  // ⑤ 第 10 批（§18.3 #5——CLI 同源句）：status/cancel 面补评审池（同 id 命名空间——advisor id
  // 同面可查/可取消）。本仓描述载荷在 subagent-spec.mjs（subagentSpec.description 本体不动）——
  // 本文件是**工具对象组装点**，句尾追加可达意。
  description: subagentSpec.description
    + " Background advisor reviews share this status/cancel surface (same id space): pass a review id to status it (role:'advisor' + reviewType/round/elapsedSec) or to cancel it — a cancelled review issues no token.",
  // §2.22.3 参数面：batchDoc（spawn schema 属性——否则参数无处传入；受限变体的 delete 清单
  // 需有该键可删）。本仓 schema 载荷在 subagent-spec.mjs——此处单键扩展，不动 spec 载荷。
  parameters: {
    ...subagentSpec.parameters,
    properties: {
      ...subagentSpec.parameters.properties,
      batchDoc: { type: "string", description: "REQUIRED for role='eng-coder' and role='eng-designer': the batch record path (docs/batches/<batch>-<topic>.md) — the batch §2 task book this spawn implements (or writes). The spawn is mechanically refused without it, and also when the path does not resolve (cwd-relative or absolute) to a readable file; the CONTENT is never validated (the batch record owns that). explore/plan/coder spawns ignore it (ENGINEERING-MODE.md §2.12/§2.22.3)." },
    },
  },
  async execute(args, ctx) {
    // §19 action dispatch（AGENT-LOOP.md §19 D-M1）：缺省 spawn——既有调用零迁移。
    const action = args?.action ?? "spawn"
    const parent = ctx.agent
    if (!["spawn", "status", "cancel", "escalate", "consume-design", "observe", "send"].includes(action)) {
      throw new Error(`Unknown subagent action: ${JSON.stringify(action)}. Valid actions: spawn (default), status, cancel, escalate, consume-design, observe, send.`)
    }
    // §19 round2 #3 restricted-variant action gate（机械层——schema 层提示在 setup.mjs
    // engAuditSubagentTool）：eng-coder 子代理的受限通道仅 spawn（sync explore 审计）——
    // escalate 会内部 spawn coder+WRITE（违 explore-only 意图）；status/observe/send 无意义
    // （子代理上下文无 async 池）。镜像 T-E4/E5 的 action 维度。
    if ((ctx.depth ?? 0) > 0 && (parent?._role === "eng-coder" || parent?._role === "eng-designer") && action !== "spawn") {
      throw new Error(`action:'${action}' is unavailable inside an ${parent._role} subagent — the restricted subagent channel is spawn-only (sync role='explore' children, AGENT-LOOP.md §18 D-E3 / ENGINEERING-MODE.md §2.15 D)`)
    }
    if (action === "status") return subagentStatus(args, ctx)
    if (action === "observe") return subagentObserve(args, ctx)
    if (action === "send") return subagentSend(args, ctx)
    if (action === "cancel") return cancelSubagentAction(args, ctx)
    // §2.6 token 链终消费制（2026-09-07——ENGINEERING-MODE.md F1）：父侧核销消费——
    // 非只读控制动作——depth-0 + 工程模式限定（本分流已过受限变体门；工程模式门在
    // 执行器内）——planMode 拒绝（execute-tools 不豁免）——不入批审批分组（免审直行）。
    if (action === "consume-design") return executeConsumeDesignAction(args, ctx)
    if (action === "escalate") return await escalateAction(args, ctx)
    // ── spawn（缺省 action）——既有 execute 原样 ──
    const { task, role, designToken, designId, model, async: asyncArg } = args
    // §19 required 移出 schema → execute 内校验（T-M11/advisor round 2 #5）：spawn 的
    // task 缺失/空串 → 干净的工具错误——不带残缺输入进子代理（auditTaskBook 会生成
    // 残缺审计书、setup 会把 content: undefined 送 provider）。
    if (typeof task !== "string" || !task.trim()) {
      throw new Error("subagent spawn requires a task description (task) — brief the sub-agent like a colleague who just walked in")
    }
    const agentMod = await import("../agent.mjs")
    // 测试缝（escalate-async 同形 `ctx.runAgent ??` 先例）：缺省 = 生产 runAgent；仅测试注入。
    const runAgent = ctx.runAgent ?? agentMod.runAgent
    const cwd = ctx.cwd
    // §18 D-E1a depth-gated async default (2026-09-06 需求池 R12——CLI parity):
    // depth-0 spawns default to async for EVERY role (the old role-level default —
    // eng-coder only — is superseded); depth>0 spawns default to sync (子代理内部
    // 强制同步现状保留——下方深度门仍拒 async:true).
    const asyncFlag = asyncArg ?? ((ctx.depth ?? 0) === 0)

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
          throw new Error(`subagent dependsOn: unknown async subagent id: ${d} — dependsOn references ids from prior async spawn returns; an id already delivered automatically (auto-injected at turn end or consumed by the suspension digest) counts as satisfied, anything else is a mistake (AGENT-LOOP.md §20 D-SD5)`)
        }
      }
      assertNoDepCycle(parent, dependsOn)
      const block = describeBlockers(parent, { _files: files, _dependsOn: dependsOn }, auto)
      if (!asyncFlag && block.kind !== "slot") {
        throw new Error(`sync spawn (async:false) cannot queue behind a scheduling conflict: ${block.detail} — pass async:true to queue the task (the scheduler starts it when the blockers clear), or wait for them to finish first (AGENT-LOOP.md §20 round2 #7)`)
      }
    }
    // §17 D-S9: during a suspension session children share the SESSION signal
    // (ctx.sessionSignal ?? agent._sessionSignal) — a digest's own Stop/interrupt must not
    // abort the pool; the session abort controller stops everything. Outside a session
    // children ride the spawning turn's controller (existing semantics).
    // D6 buildChildSignal 单点（ASYNC-RESULT-CONTAINER.md——4 处兜底抄统一）。
    const childSignal = buildChildSignal(ctx)

    // Role normalization + whitelist (2026-08-25, coder-leak fix): the runtime gates below
    // used exact string comparison — a variant role ("Coder", " coder") bypassed BOTH gates
    // and fell through to full-tool/no-overlay (a full-write coder without design review).
    // Schema enums are advisory; providers don't enforce them. Fail closed on anything that
    // isn't an exact known role.
    const ROLES = new Set(["explore", "plan", "coder", "eng-coder", "eng-designer"])
    if (!ROLES.has(role)) {
      throw new Error(`Unknown subagent role: ${JSON.stringify(role)}. Valid roles: explore, plan, coder, eng-coder, eng-designer (exact spelling).`)
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
    // 第三门（§2.22.4 ②）：eng-designer 工程模式限定（同族文案，不撞 generic engineering-mode 文案）。
    if (!parent.config?.agent?.engineering && role === "eng-designer") {
      throw new Error("Engineering mode is not active — role='eng-designer' is engineering-mode only (it writes the requirements/design documents inside the engineering workflow); use role='explore' or role='plan' for read-only work.")
    }
    // §15 D-A3: async spawn is a depth-0 main-session capability — a subagent trying to
    // async-spawn its own children would create an unbounded background tree. Reject loud.
    if (asyncFlag && (ctx.depth ?? 0) > 0) {
      throw new Error("async spawn only available at the top level")
    }

    // Provider/model override: tool `model` arg > subagentModels[role] > subagentModel > parent provider (CLI parity)
    const provider = resolveChildProvider(parent, effectiveSubagentModel(parent, role, model))

    // eng-coder token gate: the design review must have passed and the caller must
    // present the exact token advisor issued — lives in subagent-spawn-gate.mjs
    // (authorizeEngCoderDesignToken — module split 2026-09-06): resolves the slot,
    // format+TTL fail-closed validates, and on an EXPIRED presentation deletes the dead
    // slot (R16 ③ — mirror synced); mismatch / malformed reject without deletion.
    if (role === "eng-coder") {
      authorizeEngCoderDesignToken(parent, designId, designToken)
    }

    // Turn cap from shared config (CLI parity)
    const maxTurns = parent.config?.agent?.subagentTurns ?? 100
    // advisor fix #1：id 分配跨 runAgent 单调（池沿 history 存活——agent._subIdCounter
    // per-run 重建，重复 id 会覆盖池条目——nextSubagentId 以池内最大 id 续号）。
    const subId = nextSubagentId(parent)

    // §18 D-E2 ③: the audit spawn's task book is appended MECHANICALLY — the eng-coder's
    // OWN spawn task (mechanical SUMMARY of _engTaskInput — auditTaskBook keeps the
    // docs-involved / file-list / acceptance sections VERBATIM via summarizeEngTaskInput
    // (CLI-isomorphic, A2-SUMMARY-PARITY): header-first with an inline-marker fallback
    // for flat books without "## " headings — markers not found are reported
    // "(not found in the parent task book)", never fabricated — there is NO whole-book
    // verbatim fallback; never a self-written list) ∪ mechanically tracked _touchedFiles
    // (mechanism lives in subagent-async.mjs).
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
    // runChild 闭环（2026-09-08 结构债批 6——subagent.mjs 508 > 500 硬限——本体迁
    // ./subagent-run.mjs——CLI 同名对齐（名对齐非内容镜像）：原闭包自由变量收编参数对象
    //（parent/ctx/cwd/runAgent/role/subId/maxTurns/childInput/provider/designId/task/
    // asyncFlag/childSignal）——verbatim 迁移零行为变化；runChild 原文件内私有（非导出）
    // ——消费面零影响。runChildFor 保持原调用形态（sync 路径 await 无 entry / async 池
    // 条目由 spawnAsyncSubagent 以 entry 调用同一包装）。
    const runChildOpts = { parent, ctx, cwd, runAgent, role, subId, maxTurns, childInput, provider, designId, task, asyncFlag, childSignal }
    // §2.22.3 绑定下发（两路共用出口）：abs → runChild → setup 的 `agent._batchDoc`（batch_segment 取用）+ 任务文本行。
    const runChildFor = (entry = null, batchDocAbs = null) => {
      const abs = batchDocAbs ?? entry?._batchDoc ?? null
      return runChild(entry, abs
        ? { ...runChildOpts, batchDoc: abs, childInput: `${childInput}\n\nBatch record (batchDoc): ${abs}` }
        : runChildOpts)
    }

    if (!asyncFlag) {
      // §2.22.3 门调用点①（阻塞路）：目标角色缺参/不可读 → throw（共享 resolveBatchDoc，与异步路同函数）；非目标角色 → null 零变更。
      const batchDocAbs = NEEDS_BATCH_DOC.has(role) ? resolveBatchDoc(parent, args.batchDoc) : null
      ctx.callbacks?.onSubagent?.({ id: subId, role, status: "started", startedAt: Date.now(), model: provider.model ?? null })
      // LOGGING（LOGGING.md——CLI parity）：child:* 阻塞 spawn——runChild 前后；
      // partial = turn-cap 拒绝（TURN_CAP_MARK 检出）；cancel 非阻塞路径不适用。
      const childLogId = `${role}#${subId}`
      const cT0 = Date.now()
      logEvent("child:spawn", { role, id: childLogId, kind: "blocking" })
      try {
        const report = await runChildFor(null, batchDocAbs)
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
    return spawnAsyncSubagent({ parent, ctx, subId, role, provider, childSignal, runChild: runChildFor, files, dependsOn, batchDoc: args.batchDoc })
  },
}
