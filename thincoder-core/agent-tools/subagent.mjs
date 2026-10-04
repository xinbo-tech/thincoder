/**
 * subagent.mjs — subagent tool（ONE tool, EIGHT actions + spawn 路径驱动器）。
 * 2026-09-07 token 链终消费制：+action: consume-design（ENGINEERING-MODE.md §2.6 F1——
 * 父侧链终核销消费 designId 槽——执行器 executeConsumeDesignAction 在 subagent-spawn.mjs）。
 *
 * 2026-09-03 拆分轮: subagent.mjs 超 500 硬顶——async 常量、共享 post-spawn 管线
 *（runChildPipeline）与队列/注入/并账机械迁至 ./subagent-async.mjs。execute
 *（async 分支 + 阻塞路径）原样保留于本文件；导出面由文末 re-export shim 兜住。
 * 2026-09-03 合体轮（AGENT-LOOP-SUBAGENT.md §6.7）: subagent_check/escalate 工具退役——status/escalate
 * 动作执行器并入 ./subagent-async.mjs，本文件只承载工具面（action schema）与
 * spawn 路径 + 动作分流。
 * 2026-09-06 删 check 轮（AGENT-LOOP-SUBAGENT.md §6.7.5）: check 动作删除——工具面五动作（spawn/status/
 * escalate/cancel/panel）——async 结果仅自动通道送达。
 * 2026-09-05 拆分轮: status/escalate/panel 动作执行器 → ./subagent-actions.mjs；§20
 * 调度器全套 → ./subagent-scheduler.mjs——本文件 import 源随之改写。
 * 2026-09-05 模块拆分轮（726 > 500 硬限）: spawn 前置 helpers（summarizeEngTaskBook/
 * effectiveSubagentModel/resolveDesignSlot）+ AGENT-LOOP-SUBAGENT.md §6.9 准入（prepareScheduling）+ child
 * 装配（buildSpawnChild）→ ./subagent-spawn.mjs；async 分支（executeAsyncSpawn）
 * → ./subagent-run.mjs——execute 只保留动作分流 + 装配调用 + 阻塞路径。
 */

import { gateEngCoderSpawn, TURN_CAP_MARK, STOPPED_MARK, emitNestedChildEvent, emitRelayModel } from "../agent/spawn-child.mjs"
import { logEvent, errText } from "../log.mjs"
import { abortError, deathLine } from "../abort-provenance.mjs"
import {
  runChildPipeline, executeCancelAction, enqueueAsk, mergeChildMutations,
} from "./subagent-async.mjs"
// SYNC-CANCEL（L52——2026-09-09）：阻塞路径自属 AbortController 链到会话/回合基信号
// 的单点（async-settle.mjs D6——_sessionSignal ?? ctx.signal——与 async 条目 controller
// 链同一语义——挂起场景 base 命中而 ctx.signal 未 abort——R2）。
import { buildChildSignal } from "./async-settle.mjs"
import { executeStatusAction, executeEscalateAction, executePanelAction, executeObserveAction, executeSendAction } from "./subagent-actions.mjs"
import { prepareScheduling, buildSpawnChild, executeConsumeDesignAction } from "./subagent-spawn.mjs"
import { executeAsyncSpawn } from "./subagent-run.mjs"
import { ROUND_VALUES } from "./spawn-gates.mjs"
// #15 描述外置：描述文本单点 = tool-docs/subagent.md（DESC 单解析面，缺档抛错语义不变）
import { DESC } from "../tools/shared.mjs"

// ─── SYNC-CANCEL 纯函数（可测——无 io）──────────────────────────────────────────

/**
 * SYNC-CANCEL F2 catch 三分支分类（可测纯函数——R3 收紧）：
 * ① "base" 整回合停：ctx.signal 或 baseSignal（= parent._sessionSignal ?? ctx.signal——
 *    buildChildSignal——挂起会话场景 base 命中而 ctx.signal 未 abort——R2）aborted →
 *    现状保留（emitNestedChildEvent stopped + rethrow）；
 * ② "targeted" 定向中止：err 是 AbortError 且自属 ctrl aborted（且非整回合停）→
 *    折叠 stopped partial 报告（父回合继续——merge/STOPPED_MARK/警示）；
 * ③ "error" 其他错误 → 现状保留（child:error + rethrow）。
 * ⚠ 查 baseSignal 非仅 ctx.signal——挂起 digest 场景 child 链 _sessionSignal（R2——
 *    digest 自身 Ctrl+I/Ctrl+C 不误伤；会话 Stop 逐链中止必须归 ①）。
 */
export function classifySyncAbort(ctxSignal, baseSignal, ctrlSignal, err) {
  if (ctxSignal?.aborted || baseSignal?.aborted) return "base"
  if (err?.name === "AbortError" && ctrlSignal?.aborted) return "targeted"
  return "error"
}

/**
 * SYNC-CANCEL F1/F5 中止控制器装配（可测）：sync 阻塞 spawn 建**自属** AbortController
 * （childRunOpts.signal 覆写为 ctrl.signal——照抄 async 分支 subagent-run.mjs 覆写模式）
 * ——ctrl 链到基信号：baseSignal aborted → ctrl.abort()；否则 addEventListener("abort",
 * → ctrl.abort(), { once:true })——Ctrl+C/I 整回合停语义不变（base abort 逐链传播——
 * AC2）；嵌套 sync spawn 递归可中止（内层链外层 ctrl.signal——逐层自属——AC4）。
 * 注册 `parent._syncChildAborts`（key = relayPrefix 去尾——{ ctrl, stopped:false }——
 * TUI ⏹ 门控 live 判据 + cancelSyncChild 定向中止目标——与 async 条目 controller 存池
 * 分层一致）。返回 { ctrl, disarm }——disarm 注销 registry（调用方 try/finally 三路径
 * 共用——R7 防跨回合残留）。
 * **序即契约（#133）**：第 4 参 `announce`（可选）在 registry 写入**之后**当场调用——sync
 * 出生声明（`[model]`）与登记同函数、序不被调用方拆散；先宣告后登记会使载荷产者（VSC
 * `panel-subagent-relay.mjs` `syncLiveOf` 采样该 registry）必空 ⇒ sync 块 ⏹ 运行期不可达。
 * 同序先例 = async 支（池登记 `subagent-run.mjs` 先于 `[model]` 发射）。
 */
export function armSyncChildAbort(parent, key, baseSignal, announce = null) {
  const ctrl = new AbortController()
  if (baseSignal) {
    // AGENT-LOOP-SUBAGENT.md §6.12 站点 #10（第 24 批）：hop 逐跳保 reason（下游可判定「谁杀的」）
    if (baseSignal.aborted) ctrl.abort(baseSignal.reason)
    else baseSignal.addEventListener("abort", () => ctrl.abort(baseSignal.reason), { once: true })
  }
  const registry = (parent._syncChildAborts ??= new Map())
  // #133：序即契约——登记完成之后才宣告出生（见 doc；不得上移）。宣告抛错（announce 链
  // 经显示面 onToken）时自清该键再上抛：登记/注销配对不因异常破坏（改序前的发射在装配面、
  // 无 registry 可残留；改序后本函数自持该不变式——否则条目永久残留）。
  registry.set(key, { ctrl, stopped: false })
  try { announce?.() } catch (e) { registry.delete(key); throw e }
  const disarm = () => { registry.delete(key) }
  return { ctrl, disarm }
}

/**
 * SYNC-CANCEL ② 折叠报告构建（可测纯函数——仿 runChildPipeline onDeclined partial 形态，
 * subagent-async.mjs onDeclined：STOPPED_MARK + partial 警示 + 捕获输出 + eng-coder
 * designId 后缀——AC3）。capturedOutput = child._capturedOutput（spawn-child.mjs
 * runWithContinue capture 累积——子代理已流式输出的剥哨兵文本）。
 */
export function buildSyncStoppedReport(role, capturedOutput, designId) {
  let report = `Subagent (${role}) ${STOPPED_MARK} — work may be partial; review recent_changes before deciding next steps.\nPartial output: ${capturedOutput || ""}`
  if (role === "eng-coder") {
    report += `\ndesignId: ${designId ?? "(single-design session — designId optional)"} — reuse it (with the same designToken) when re-spawning this eng-coder.`
  }
  return report
}

/**
 * subagent tool — ONE tool, EIGHT actions (AGENT-LOOP-SUBAGENT.md §6.7 +
 * SUBAGENT-OBSERVE-SEND): spawn (default) / status (non-blocking pool query) / observe
 * (inspect a running/queued/done async child's recent activity + current tool — docs/cli/design/TUI.md §6.8) /
 * send (inject a direction into a RUNNING async child — consumed at its next turn
 * boundary as an ordinary instruction — §6.8) / escalate (飞刀 — hand implementation to
 * a stronger model) / cancel (stop ONE background subagent — AGENT-LOOP-SUBAGENT.md §6.7.2) / panel (view + fix
 * the live subagent panel — AGENT-LOOP-SUBAGENT.md §6.7.2) / consume-design (parent-side chain-terminal token
 * consumption — ENGINEERING-MODE.md §2.6, 2026-09-07). The check
 * action was deleted (AGENT-LOOP-SUBAGENT.md §6.7.5): async results reach the model only via the auto channel.
 * - action:"spawn" roles: "explore" — read-only tools, search/read/analyze
 *   (suitable for codebase exploration); "coder" — full tool set, self-contained
 *   implementation tasks; "plan" — read-only planning; "eng-coder" —
 *   engineering-mode implementation (design-token gated); "eng-designer" —
 *   engineering-mode design writing (requirements + design docs, batchDoc gated).
 * - no role specified — invalid by design since the 2026-08-25 fail-closed gate
 *   (role is mandatory; "no role → same tool set as parent" was removed with the
 *   coder-leak fix and the header text above predates it)
 * - non-recursive for non-eng children: child agents do not get the subagent tool (depth > 0 is not
 *   injected); eng-coder / eng-designer children get a spawn-only variant (`agent/family-tools.mjs`)
 * - 描述文本单点 = `thincoder-core/tool-docs/subagent.md`（模型可见文本不在此复述——本块只留实现注记）
 */

export const subagentTool = {
  name: "subagent",
  description: DESC("subagent"),
  parameters: {
    type: "object",
    properties: {
      action: { type: "string", enum: ["spawn", "status", "escalate", "cancel", "panel", "consume-design", "observe", "send"], description: "Which action — spawn (default) / status / observe / send / escalate / cancel / panel / consume-design; semantics per action in the tool description." },
      view: { type: "boolean", description: "action:'panel' only: true (default) = the live panel blocks as the user sees them; false without freeze = error. Mutually exclusive with freeze (freeze wins)." },
      freeze: { type: "string", description: "action:'panel' only: block key of a digested-stuck block — reclaims it into the conversation; refused for running/done/unknown blocks or a still-pending report; works on the CLI TUI panel and on the desktop renderer panel (live readback of the blocks as the user sees them)." },
      task: { type: "string", description: "Required for action:'spawn' (the self-contained task brief) and action:'escalate' (goal, constraints, entry files, acceptance criteria)." },
      context: { type: "string", description: "Optional background the sub-agent needs (it cannot see this conversation); action:'spawn' only." },
      role: { type: "string", enum: ["explore", "plan", "coder", "eng-coder", "eng-designer"], description: "The sub-agent role — see the role matrix in the tool description. Exact spelling required. action:'spawn' only (escalate spawns its own expert internally)." },
      model: { type: "string", description: "action:'spawn': provider/model override ('provider:model', a provider, or a model name on the parent's provider) — defaults config.agent.subagentModels[role] → config.agent.subagentModel → the parent's provider; \"default\" inherits. action:'escalate': a consult candidate (default = the first)." },
      designToken: { type: "string", description: "Required when role='eng-coder': the token from advisor(type='design') after the review passed — without it, eng-coder cannot modify files." },
      designId: { type: "string", description: "role='eng-coder': the designId echoed with the approved token — required to pick between concurrent designs (optional for one). action:'consume-design': the slot to close out (required to pick between several; the gate refuses to guess)." },
      batchDoc: { type: "string", description: "REQUIRED for role='eng-coder'/'eng-designer': the batch record path (e.g. <repo>/docs/batches/<batch>-<topic>.md; relative paths resolve against the session cwd first, then candidate project roots — or absolute) — the task book this spawn implements/writes. Refused when absent or when the path does not resolve to a readable file; the content is never validated." },
      round: { type: "string", enum: ROUND_VALUES, description: "REQUIRED for role='eng-coder'/'eng-designer': initial (first round for this design) or fix (a correction round reusing the same designId+designToken; docs FIRST). No default — missing = refused." },
      async: { type: "boolean", description: "action:'spawn'/'escalate': default at depth 0 = true (async; the report arrives automatically); depth>0 always sync. async:false forces the blocking flight." },
      files: { type: "array", items: { type: "string" }, description: "action:'spawn' only: the file write-domain this task declares — file-level paths only (cwd-relative or absolute; directories rejected — they bypass the conflict detector). Overlapping-file tasks serialize automatically. Omit = no conflict detection." },
      dependsOn: { type: "array", items: { type: "string" }, description: "action:'spawn' only: ids from prior async returns whose outcome this task needs — queues until every dependency settles, then starts. Consumed ids count as satisfied; a cancelled/failed dependency stays queued marked 'dependency cancelled' until you decide (AUTO sessions auto-start). Unknown ids error." },
      id: { type: "string", description: "action:'status'/'observe'/'send'/'cancel': the subagent id from the spawn return. status: omit = pool overview; observe/send/cancel: REQUIRED." },
      message: { type: "string", description: "action:'send' only (REQUIRED there): the direction to inject — consumed by the running child at its next turn boundary as an ordinary instruction (non-interrupting)." },
      recent: { type: "integer", description: "action:'observe' only (optional, default 5): how many recent-turn summaries (1..20)." },
    },
    required: [],
  },
  readonly: false,
  sideEffectExempt: true, // child agent may write files; parent can't introspect its _mutatedThisRun
  parallel: true,
  async execute(args, ctx) {
    // AGENT-LOOP-SUBAGENT.md §6.7 action dispatch: default spawn keeps every legacy call unchanged
    // (no action parameter → the spawn path below, byte-identical semantics).
    const action = args?.action !== undefined && args?.action !== null && String(args.action) !== ""
      ? String(args.action)
      : "spawn"
    if (action !== "spawn") {
      // AGENT-LOOP-SUBAGENT.md §6.7 restricted-variant action gate (round2 #3): the engineering-child channel
      // (depth>0, role eng-coder or eng-designer) is spawn-only — escalate spawns a
      // coder+WRITE child (violates explore-only intent) and status/panel/observe/send
      // have no async pool / panel mirror to query in a child context.
      if ((ctx.depth ?? 0) > 0 && (ctx.agent?._role === "eng-coder" || ctx.agent?._role === "eng-designer")) {
        throw new Error(`only action:'spawn' (sync explore children) is available inside an ${ctx.agent._role} — escalate/status/cancel/panel/consume-design/observe/send are not`)
      }
      // AGENT-LOOP-ASYNC-POOL.md §6.8 N3/D-S6 spawn gate (manual tier): auto-turn digests may not spawn —
      // async OR blocking — the digest must stay organize-only. The escalate
      // action spawns a write child too, so the same mechanical refusal applies
      // (AUTO tier exempt — user authorized unattended continuation).
      if (action === "escalate" && ctx.agent?._inAutoTurn && !ctx.agent?.autoApprove) {
        return JSON.stringify({ status: "error", error: "cannot spawn subagents from a manual auto-turn — wait for user input" })
      }
      if (action === "status") return executeStatusAction(args, ctx)
      if (action === "escalate") return await executeEscalateAction(args, ctx)
      // AGENT-LOOP-SUBAGENT.md §6.7.2 控制类动作：digest 内放行（D-S7 分类——控制/自省；dispatch 控制类
      // 豁免同批生效——19.5.2b round2 #4；escalate 的 digest 拒绝在上一分支）
      if (action === "cancel") return executeCancelAction(args, ctx)
      // 2026-09-07 token 链终消费制（ENGINEERING-MODE.md §2.6 F1）：父侧核销消费——
      // 非只读控制动作——depth-0 + 工程模式限定（本分流已过受限变体门；工程模式门在
      // 执行器内）——planMode 拒绝（dispatch 不豁免）——不入批审批分组（dispatch 免审）。
      if (action === "consume-design") return executeConsumeDesignAction(args, ctx)
      // AGENT-LOOP-SUBAGENT.md §6.7.2 panel 动作：view（readonly 面——digest 内放行——自省类）与 freeze
      // （控制类——同 cancel——digest 内放行）。深度/门控检查在 executePanelAction 内。
      // CLI-ACTIVITY-DEBLOAT F-3（2026-09-10）接线：executePanelAction 经 ctx.state
      // （= agent._tuiState——startTUI 反向挂载）读时现算面板块（computePanelBlocks）——
      // 手工面板镜像已退役。headless/VSC 无挂载 → 现算返 null → 降级照旧。
      // 子代理面板批（2026-10-04）：另携 ctx.readout（= agent._panelReadout——桌面渲染面实况回读
      // 上报缓存读面；agent-host 装配挂）——核内读源链 readout → state → 降级（PANEL-READBACK.md §2.1）。
      if (action === "panel") return executePanelAction(args, { ...ctx, state: ctx.agent?._tuiState, readout: ctx.agent?._panelReadout })
      // SUBAGENT-OBSERVE-SEND：observe = readonly 查询（同 status——digest/planMode 放行）；
      // send = 控制类豁免（同 cancel——父回合内显式调用即授权）。深度门在各自执行器内。
      if (action === "observe") return executeObserveAction(args, ctx)
      if (action === "send") return executeSendAction(args, ctx)
      throw new Error(`Unknown subagent action: ${JSON.stringify(action)}. Valid actions: spawn, status, escalate, cancel, panel, consume-design, observe, send.`)
    }

    const parent = ctx.agent
    const role = args.role
    // Spawn requires a task brief — schema `required` is advisory (multi-action
    // schema), so the mechanical check lives here: an absent task would otherwise
    // flow downstream as `content: undefined` and surface as an obscure error.
    if (typeof args.task !== "string" || !args.task.trim()) {
      throw new Error("subagent action:'spawn' requires a task (the self-contained task brief).")
    }
    // §18 D-E1a depth-gated async default (2026-09-06 需求池 R12): depth-0 spawns
    // default to async for EVERY role (the old role-level default — eng-coder only —
    // is superseded); depth>0 spawns default to sync (子代理内部强制同步现状保留).
    // async:false remains the explicit escape hatch; async:true at depth>0 is
    // refused downstream (executeAsyncSpawn top-level gate).
    const wantAsync = args.async ?? ((ctx.depth ?? 0) === 0)

    // Role normalization + whitelist (2026-08-25, coder-leak fix): exact-string gates let
    // variant roles ("Coder", " coder") bypass BOTH mode gates and fall through to
    // full tools / no overlay — a full-write coder without design review. Schema enums are
    // advisory; providers don't enforce them. Fail closed on unknown roles.
    const ROLES = new Set(["explore", "plan", "coder", "eng-coder", "eng-designer"])
    if (!ROLES.has(role)) {
      throw new Error(`Unknown subagent role: ${JSON.stringify(role)}. Valid roles: explore, plan, coder, eng-coder, eng-designer (exact spelling).`)
    }
    // AGENT-LOOP-SUBAGENT.md §6.7.6 D-E3 internal-spawn gate: an eng-coder sub-agent may only spawn sync
    // explore (audit) children — non-explore roles and async are refused here
    // (mechanical), the audit budget is enforced (7th audit spawn refused), and
    // the returned attempt number marks this spawn as an audit for the task-book
    // augmentation below. Runs BEFORE the mode gates so the eng-coder-specific
    // error (not the generic engineering-mode one) surfaces.
    const engAuditAttempt = gateEngCoderSpawn(ctx.agent, ctx.depth, role, args.async)
    // Role is mutually exclusive per mode: normal mode → "coder", engineering mode → "eng-coder"/"eng-designer"
  if (parent.config?.agent?.engineering && role === "coder") {
    throw new Error("Engineering mode: role='coder' is disabled — use role='eng-coder' for implementation tasks (or role='eng-designer' for design writing).")
  }
  if (parent.config?.agent?.engineering && role === "plan") {
    throw new Error("Engineering mode: role='plan' is disabled — the engineering-mode enum is explore / eng-designer / eng-coder (plan is a normal-mode role).")
  }
    if (!parent.config?.agent?.engineering && role === "eng-coder") {
      throw new Error("Engineering mode is not active — use role='coder' for implementation tasks.")
    }
    // Third mode gate (ENGINEERING-MODE.md §2.15 A—— symmetric completion):
    // eng-designer is engineering-mode-only, same family as eng-coder (both carry
    // the engineering discipline overlay + the batchDoc gate).
    if (!parent.config?.agent?.engineering && role === "eng-designer") {
      throw new Error("Engineering mode is not active — role='eng-designer' is engineering-mode only (it writes the requirements/design documents inside the engineering workflow); use role='explore' or role='plan' for read-only work.")
    }

    // AGENT-LOOP-ASYNC-POOL.md §6.8 N3/D-S6 spawn gate (manual tier): auto-turn digests may not spawn — async
    // OR blocking — the digest must stay organize-only. AUTO tier (autoApprove) is
    // exempt (推进型 — user authorized unattended continuation). Mechanical refusal
    // so the digest never pops a permission panel or chains new background work.
    // （escalate 动作的同类拒绝在 action 分流处——本检查只管 spawn 路径。）
    if (parent._inAutoTurn && !parent.autoApprove) {
      return JSON.stringify({ status: "error", error: "cannot spawn subagents from a manual auto-turn — wait for user input" })
    }

    // §20 准入（2026-09-05 module-split——prepareScheduling verbatim 迁
    // subagent-spawn.mjs：参数形态/unknown id/依赖环/阻塞 sync 判定；files 目录声明
    // fail-closed——检测器错误即工具结果 JSON）
    const prep = prepareScheduling(parent, args.files, args.dependsOn, wantAsync)
    if (prep.errorJson) return prep.errorJson

    // child 装配（2026-09-05 module-split——buildSpawnChild verbatim 迁
    // subagent-spawn.mjs：provider/model 覆盖、角色门、design-token 门、工具集/
    // overlay/permission 装配、审计任务书注入、relay 前缀分配、childOpts/runOpts）
    const built = buildSpawnChild(parent, ctx, args, role, wantAsync, prep.files, prep.dependsOn, engAuditAttempt)
    const { child, input, childOpts, childRunOpts, relayPrefix } = built
    // Turn-cap continue loop (TURN-CAP-CONTINUE.md) via runWithContinue (§7.2 D3):
    // hitting the cap asks the user via the SAME y/n panel the main agent uses —
    // unlimited continues, resume:true keeps the child's history + mutation bookkeeping,
    // fresh budget each run. Prompts queue through parent._permQueue (same as write
    // approval) so parallel children never pop two panels at once. Declined / headless
    // → partial-work return. Non-ContinueError errors still propagate (dispatch.mjs
    // turns them into Error tool results — unchanged behavior).
    const askSubagentContinue = (e) => {
      if (!ctx.onPermissionRequest) return Promise.resolve(false)
      const key = relayPrefix.slice(0, -1)
      const ask = async () => {
        // SYNC-CANCEL v2（模态 deny——用户裁）：⏹ 后 entry.stopped——不再弹模态。
        // ⚠ 不能直接 resolve(false) 走 onDeclined 降级（TURN_CAP partial——child 已撞
        // cap——runWithContinue 的 decline 是正常 return——永远到不了 abort 检出点——
        // stopped 折叠语义丢失：无 ⟦ev⟧stopped/无 STOPPED_MARK——块冻结标 done 而非
        // stopped——评审 🟡#2）。stopped 分支改抛 AbortError——runWithContinue 只捕
        // ContinueError——原样上抛 → 阻塞 catch 三分支②折叠（"child 随即在 abort 检出点
        // 解绕折叠"——AGENT-LOOP-SUBAGENT.md §6.7.2 机制文）。abort 恒已在途（stopped 只由
        // cancelSyncChild 与 ctrl.abort 同时置位）——信号语义真实。
        if (parent._syncChildAborts?.get(key)?.stopped) throw abortError(ctrl.signal, "settle", "sync-stopped")
        const go = await ctx.onPermissionRequest("continue", { turns: e.turn, agent: key })
        // ⏹ deny（denyModalForOwner resolve(false)）与用户按 n 同形——旗标区分：
        // stopped → 同上抛（折叠——abort 先于 deny 已在途）；普通 n → false 走 decline
        // （现状——cap partial 报告）。
        if (parent._syncChildAborts?.get(key)?.stopped) throw abortError(ctrl.signal, "settle", "sync-stopped")
        return go
      }
      return enqueueAsk(parent, "_permQueue", ask)
    }

    // ── Async branch（2026-09-05 module-split——executeAsyncSpawn verbatim 迁
    // subagent-run.mjs：条目构建/等位/启动/controller 链/turn 镜像/补位释放）──
    if (wantAsync) {
      return executeAsyncSpawn(parent, ctx, role, args, child, input, childOpts, childRunOpts, relayPrefix, built.childProvider, prep.files, prep.dependsOn)
    }

    // ── Blocking path (unchanged semantics + SYNC-CANCEL targeted stop) ──
    // SYNC-CANCEL F1/F5（2026-09-09）：自属 AbortController（armSyncChildAbort——
    // childRunOpts.signal 覆写 ctrl.signal——照抄 async 分支 subagent-run.mjs 的
    // 覆写模式——buildChildRunOpts 不改——escalate/consult 零触碰）——⏹ 定向中止
    // （cancelSyncChild → ctrl.abort）与整回合停（base abort 逐链传播）解耦；registry
    // 注册/注销（try/finally 三路径——R7 防跨回合残留）。LOGGING（LOGGING.md）：
    // child:*（阻塞 spawn——runChildPipeline 前后；declined partial 由 TURN_CAP_MARK
    // 检出；⏹ 折叠由 STOPPED_MARK 检出——kind partial；错误原样上抛（dispatch 转
    // tool:error））
    const blockT0 = Date.now()
    logEvent("child:spawn", { role, id: child._logId, kind: "blocking" })
    const syncKey = relayPrefix.slice(0, -1)
    // baseSignal 一次性快照（spawn 时刻）——catch 分类复用同一信号对象（会话收尾把
    // _sessionSignal 置 null 的窗口内重读会漂移——快照防误判）
    const baseSignal = buildChildSignal(parent, ctx)
    // #133 sync 出生序：`[model]` 出生声明由 arm 单点在 registry 写入**之后**宣告（不早于登记；
    // 生产形 = 第 4 参 announce 闭包，模型取自 built.childProvider——T-S1e 结构机检锚）。
    const { ctrl, disarm } = armSyncChildAbort(parent, syncKey, baseSignal, () => emitRelayModel(ctx.callbacks?.onToken, relayPrefix, built.childProvider?.model ?? ""))
    let pipelineReport
    try {
      pipelineReport = await runChildPipeline(child, input, childOpts, { ...childRunOpts, signal: ctrl.signal }, {
        parent, role, args,
        askContinue: askSubagentContinue,
      })
    } catch (e) {
      // SYNC-CANCEL F2 三分支（classifySyncAbort 纯函数）：
      const cls = classifySyncAbort(ctx.signal, baseSignal, ctrl.signal, e)
      if (cls === "base") {
        // ① 整回合停（现状逐字保留——挂起场景 base 命中而 ctx.signal 未 abort——R2）：
        // docs/cli/design/TUI.md §6.8.2 R23：外层 abort 传播的中断——内层开块随之外层冻结前先收尾定格
        // （D-R23c1 stopped——T-R23c.2a 生成侧路径；TUI 冻结兜底仍在 freezeSubTaskLines）
        emitNestedChildEvent(ctx, relayPrefix, "stopped")
        throw e // 用户停——不落错误事件
      }
      if (cls === "error") {
        // ③ 其他错误（现状逐字保留——:249-253）：
        // §6.8.2 R23 error-run 映射（实现批补一行）：run 错误（非 abort）→ 同样发 stopped
        // ——内层子块定格不悬空（T-R23a.3——工具错/运行错误路径）。
        emitNestedChildEvent(ctx, relayPrefix, "stopped")
        logEvent("child:error", { role, id: child._logId, ms: Date.now() - blockT0, err: errText(deathLine(e, ctrl?.signal), 200) })
        throw e
      }
      // ② targeted 折叠（err AbortError && 自属 ctrl aborted && 非整回合停）：merge +
      // stopped partial 报告（父回合继续拿报告——AC1/AC3）。merge 镜像 escalate sync
      // runner 先例（subagent-actions.mjs runner 包装层——guard 在 mergeChildMutations
      // 内——见子代理已写文件才传播）。
      if (role === "eng-coder" && child._mutatedThisRun) mergeChildMutations(parent, child)
      pipelineReport = buildSyncStoppedReport(role, child._capturedOutput ?? "", args?.designId)
      // 块冻结标 stopped（R6——非 done）：⏹ 定向中止的 TUI 顶层块立即定格 stopped
      // （async settle cancelled 分支同款直发——async-settle.mjs settleAsyncEntry）；
      // 嵌套（eng-coder 内 explore 审计）经 emitNestedChildEvent 定格子块——stopped
      // 幂等无害（重复/迟到 done 由 docs/cli/design/TUI.md §6.8.2 F2 done 子块定格丢弃兜底）。
      ctx.callbacks?.onToken?.(`${relayPrefix}⟦ev⟧stopped\x1e0\x1e0\x1estopped\x1e`)
      emitNestedChildEvent(ctx, relayPrefix, "stopped")
    } finally {
      // R7 防跨回合残留：成功/折叠②/整回合停①/错误③ 四出口统一注销（设计"三路径"
      // 口径 = 成功/折叠/整回合停——错误③ 同样 rethrow 经 finally——同归本注销）
      disarm()
    }
    // §6.8.2 R23 D-R23c1（评审 #1 🅰——生成侧补发射）：sync spawn 同步收尾——若本 spawn
    // 处于嵌套上下文（ctx.callbacks 已是嵌套 wrapper——eng-coder 内 explore 审计）→
    // 发内层 ⟦ev⟧done（完整嵌套前缀——wrapper 链自动补外层）→ 主 TUI 路由子块定格
    // （T-R23c.1）。非嵌套（depth-0）零变化——冻结仍由 dispatch subKey 精确冻承接。
    // ② 折叠 = 正常 return（本共用出口：done 补发照设 + ctx._subagentKey 照设——成功
    // 冻结管线复用——迟到 done 对已定格 stopped 块被丢弃——幂等无害）。
    emitNestedChildEvent(ctx, relayPrefix, "done")
    logEvent("child:done", { role, id: child._logId, ms: Date.now() - blockT0, kind: String(pipelineReport).includes(TURN_CAP_MARK) || String(pipelineReport).includes(STOPPED_MARK) ? "partial" : "ok" })
    // docs/cli/design/TUI.md §6.8 sync spawn 完成精确冻结（方案 e）：execute 返回前 ctx 留子代理 key
    // （relayPrefix 去尾 = `role#N`）——dispatch runOne 读它作 onToolResult 第 4 参 →
    // TUI finishSubTaskKey 按 key 精确冻（async eng-coder 先启动时不再误冻其块——
    // T-F2）。仅成功/折叠路径设置：async 分支不设（round2 #2——ack 带 status:running 由
    // isAsyncSpawnResult 跳过冻结）；base/error 路径到此之前已 throw——ctx 未设
    // ——中止/错误路径不触发冻结（round1 #1——T-F5）。
    ctx._subagentKey = syncKey
    return pipelineReport
  },
}

// Re-export shim (2026-09-03 拆分轮 + 合体轮 + 2026-09-05 拆分轮): 机械与动作
// 执行器迁至 ./subagent-async.mjs、./subagent-actions.mjs、./subagent-scheduler.mjs
// ——本文件保留导出面，消费点（agent.mjs / agent-turn.mjs / consult.mjs / 测试）导入
// 路径零改动；池逻辑/准入见 subagent-run.mjs（executeAsyncSpawn）与 subagent-scheduler.mjs
// （maybeRefillAsync——execute 不再直接使用池常量）。
// 2026-09-05 拆分轮: maybeRefillAsync 随 §20 调度器独立（./subagent-scheduler.mjs）——
// 再导出源改写，消费面（agent.mjs 动态 import 等）不变。
// 2026-09-06 §11.1 拆分轮: ASYNC_SUBAGENT_LIMIT 导出 → ASYNC_POOL_LIMITS（分域常量——
// 定义在 subagent-async.mjs——re-export 面同步）。
export {
  ASYNC_POOL_LIMITS,
  resolveChildProvider,
  injectAsyncResult,
  buildChildRunOpts,
  mergeChildMutations,
} from "./subagent-async.mjs"
export { maybeRefillAsync } from "./subagent-scheduler.mjs"
// 2026-09-05 module-split：spawn 装配 helpers 迁 subagent-spawn.mjs——re-export 保测试
// import 面（subagent-core.test.mjs 从本文件动态 import）
export { effectiveSubagentModel, resolveDesignSlot } from "./subagent-spawn.mjs"
