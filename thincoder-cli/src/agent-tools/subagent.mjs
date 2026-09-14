/**
 * subagent.mjs — subagent tool（ONE tool, EIGHT actions + spawn 路径驱动器）。
 * 2026-09-07 token 链终消费制：+action: consume-design（ENGINEERING-MODE.md §2.6 F1——
 * 父侧链终核销消费 designId 槽——执行器 executeConsumeDesignAction 在 subagent-spawn.mjs）。
 *
 * 2026-09-03 拆分轮: subagent.mjs 超 500 硬顶——async 常量、共享 post-spawn 管线
 *（runChildPipeline）与队列/注入/并账机械迁至 ./subagent-async.mjs。execute
 *（async 分支 + 阻塞路径）原样保留于本文件；导出面由文末 re-export shim 兜住。
 * 2026-09-03 §19 合体轮: subagent_check/escalate 工具退役——status/escalate
 * 动作执行器并入 ./subagent-async.mjs，本文件只承载工具面（action schema）与
 * spawn 路径 + 动作分流。
 * 2026-09-06 §19.8 删 check 轮: check 动作删除——工具面五动作（spawn/status/
 * escalate/cancel/panel）——async 结果仅自动通道送达。
 * 2026-09-05 拆分轮: status/escalate/panel 动作执行器 → ./subagent-actions.mjs；§20
 * 调度器全套 → ./subagent-scheduler.mjs——本文件 import 源随之改写。
 * 2026-09-05 模块拆分轮（726 > 500 硬限）: spawn 前置 helpers（summarizeEngTaskBook/
 * effectiveSubagentModel/resolveDesignSlot）+ §20 准入（prepareScheduling）+ child
 * 装配（buildSpawnChild）→ ./subagent-spawn.mjs；async 分支（executeAsyncSpawn）
 * → ./subagent-run.mjs——execute 只保留动作分流 + 装配调用 + 阻塞路径。
 */

import { gateEngCoderSpawn, TURN_CAP_MARK, STOPPED_MARK, emitNestedChildEvent } from "@thincoder/core/agent/spawn-child.mjs"
import { logEvent, errText } from "@thincoder/core/log.mjs"
import { abortError, deathLine } from "@thincoder/core/abort-provenance.mjs"
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
 */
export function armSyncChildAbort(parent, key, baseSignal) {
  const ctrl = new AbortController()
  if (baseSignal) {
    // §20.3 站点 #10（第 24 批）：hop 逐跳保 reason（下游可判定「谁杀的」）
    if (baseSignal.aborted) ctrl.abort(baseSignal.reason)
    else baseSignal.addEventListener("abort", () => ctrl.abort(baseSignal.reason), { once: true })
  }
  const registry = (parent._syncChildAborts ??= new Map())
  registry.set(key, { ctrl, stopped: false })
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
 * subagent tool — ONE tool, EIGHT actions (AGENT-LOOP.md §19/§19.5/§19.6/§19.8 +
 * SUBAGENT-OBSERVE-SEND): spawn (default) / status (non-blocking pool query) / observe
 * (inspect a running/queued/done async child's recent activity + current tool — §7.2) /
 * send (inject a direction into a RUNNING async child — consumed at its next turn
 * boundary as an ordinary instruction — §7.2) / escalate (飞刀 — hand implementation to
 * a stronger model) / cancel (stop ONE background subagent — §19.5) / panel (view + fix
 * the live subagent panel — §19.6) / consume-design (parent-side chain-terminal token
 * consumption — ENGINEERING-MODE.md §2.6, 2026-09-07). The check
 * action was deleted (§19.8): async results reach the model only via the auto channel.
 * - action:"spawn" roles: "explore" — read-only tools, search/read/analyze
 *   (suitable for codebase exploration); "coder" — full tool set, self-contained
 *   implementation tasks; "plan" — read-only planning; "eng-coder" —
 *   engineering-mode implementation (design-token gated); "eng-designer" —
 *   engineering-mode design writing (requirements + design docs, batchDoc gated).
 * - no role specified — invalid by design since the 2026-08-25 fail-closed gate
 *   (role is mandatory; "no role → same tool set as parent" was removed with the
 *   coder-leak fix and the header text above predates it)
 * - non-recursive: child agents do not get the subagent tool (depth > 0 is not injected)
 */

export const subagentTool = {
  name: "subagent",
  description:
    "ONE tool, EIGHT actions (AGENT-LOOP.md §19/§19.5/§19.6/§19.8 + SUBAGENT-OBSERVE-SEND) — pick by what you need:\n" +
    "- action:'spawn' (DEFAULT): spawn a sub-agent to handle an independent subtask in an isolated context; the sub-agent returns only its final report. Spawn MULTIPLE subagents in the SAME response for parallel work—they run concurrently.\n" +
    "- action:'status': NON-BLOCKING progress query — returns immediately and consumes nothing. Give the spawn's id for one child ({id, role, status: running|queued|done, model, elapsedSec, turn, maxTurns, position?), or omit it for an overview of the whole pool ({overview: {running: [{id, role, model, elapsedSec, turn, maxTurns}], queued: [{id, role, position}], done: [{id, role}]}}). §19.5.6 touched-files summary: running entries also carry touchedFiles (first 5, relative to your cwd), touchedMore (count beyond 5) and, when nothing was touched yet, the placeholder touched (\"—（尚无改动）\"); queued (not yet started) entries carry the placeholder touched (\"—（未启动）\") — see what a running child has changed BEFORE deciding to cancel it. Use THIS to see progress — it never blocks and never consumes a result (async results are delivered to you automatically). Background advisor reviews share this status surface (AGENT-LOOP.md §18): pass a review id and it answers in the same shape with role:'advisor' plus reviewType (design|code) / round / elapsedSec — and the overview lists reviews alongside subagents.\n" +
    "- action:'observe': SEE what a running async subagent is DOING right now (progress vs stuck) — pass the spawn id. Returns {id, role, status, turn, maxTurns, touched…, currentTool? — array of tool name(s) currently executing (read from its dispatch state; omitted when none in flight — present when stuck in a long tool call), recentTurns: [last N one-line turn summaries, newest-first; default 5, parameterizable via recent]}. Readonly — observable on running/queued/done: running shows live activity, queued (not started) returns a placeholder, done (settled, report auto-delivered) returns the activity summary only — NOT the full report (that rides the auto channel; observe stays terse to keep your context lean). Use it to judge whether a long-running child is stuck vs progressing BEFORE deciding to cancel or steer it.\n" +
    "- action:'send': STEER a running async subagent mid-flight — pass the spawn id + message (a direction like \"check X, don't fixate on Y\"). The message queues and the child consumes it at its next turn boundary as an ORDINARY user instruction (non-interrupting — its current tool finishes first; its convergence/audit discipline is unchanged — injection is guidance, not a deviation waiver). Returns {id, status:'delivered', queued}. Only a RUNNING async subagent is targetable — sync (you're waiting on it, no relay), queued (not started), settled or unknown ids error clearly. If the child settles before its next turn boundary, its settle report carries an 'undelivered' note so you don't assume the guidance landed.\n" +
    "- action:'escalate' (飞刀 — a flown-in expert): hand an implementation task to a STRONGER model from your consult models (agent.consultModels). It gets WRITE access and does the work itself — reads, edits, runs tests — then returns a post-op report (what changed, why, verification). Use it when YOU judge the task calls for stronger hands (complex multi-file refactoring, an intractable bug, intricate algorithm work — or work beyond your comfortable ability); escalate EARLY, not after burning attempts. model: pick a candidate as 'provider:model' (default = the first consult model). Not available in engineering mode (implementation goes through eng-coder spawns there). DEFAULT-ASYNC at depth 0 (AGENT-LOOP.md §25 D-R17b): the launch returns an ack {id, role:'escalate', status:'running'} and the flight runs in the background (pooled with the other role-domain spawns) — its post-op report is delivered to you automatically with its mutations merged into your bookkeeping.\n" +
    "- action:'cancel': STOP one background subagent — pass the id from the async spawn return (REQUIRED — omitting it errors; a blanket cancel is unsupported, Ctrl+C stops everything). Running target aborts immediately ({id, status:'cancelled'}); a queued target is removed from the queue ({id, status:'cancelled', was:'queued'} and later queue positions shift forward). Other children and the session keep running — cancellation is targeted. Use it when a background child is going the wrong way (e.g. burning turns) and you must stop it before its report arrives. Cancel is a last resort: verify alarming signals with reliable checks (git/node — not guesses) first; prefer scoped recovery (restore a single affected file) over killing the child — a running child's in-flight work dies with it, partial changes stay unmerged and unaudited. Background advisor reviews are cancelable on this same action (AGENT-LOOP.md §18): pass the review id — its controller aborts, no token is issued for a cancelled review.\n" +
    "- action:'consume-design' (engineering mode, parent side — chain-terminal token consumption): after the delivery is verified and the chain closes out, consume this design's token slot — pass the designId (optional for a single-design session). The slot is consumed; a further spawn for the same designId is mechanically rejected, and any new work (including deviation fixes) requires a fresh design review and token. Idempotent: an unknown designId / already-consumed slot is a no-op notice, never an error. Do NOT call it while the chain is still open — fix rounds reuse the same slot (same designId + designToken).\n" +
    "- action:'panel': DIAGNOSE + fix the subagent panel — the collapsible blocks under the conversation the user sees (CLI TUI panel mirror; headless/VS Code degrade to a 'no panel' pool view). view (default — call it with no params or view:true): returns the live panel blocks [{key, role, status: running|done|awaitingDigest} — running entries also carry elapsedSec; awaitingDigest entries whose report is ALREADY digested carry digested:true (stuck blocks — the freezable ones — explain odd panel states here)] exactly as the user sees them. freeze: pass the block key of a digested-stuck block ({action:'panel', freeze:'role#N'}) to reclaim it into the conversation — the freeze ONLY passes for awaitingDigest blocks with no live pool entry and no pending report (gated); freezing a block whose report is still pending would break the digestion order and is refused with a clear error.\n\n" +
    "Why delegate? A sub-agent runs in its own isolated context — its reads, searches, tool calls and edits never enter your history or pollute your window; only its final report comes back. Delegation keeps your working context lean (you see the whole session, not the child's noise) and the child single-mindedly focused on one task. Parallel children run concurrently, saving wall-clock time. Every coder/eng-coder child carries its own verify + advisor self-review discipline — handed-off work is already verified before you read a word of it.\n\n" +
    "Available roles (which roles are exposed depends on the active mode — see Mode filtering below):\n" +
    "- explore — read-only search & analysis. Toolset: the read/search family (grep, read, glob, code_search, doc_search, repo_outline, lsp, tree...). No git context injected—evidence from read/glob/grep and the task book. Its report must list what it searched and what it did NOT find. Fast — specify thoroughness in the task: quick / medium / thorough (default medium).\n" +
    "- plan — read-only implementation planning. Same read/search toolset; NEVER edits files. Returns a step-by-step plan for the parent to execute.\n" +
    "- coder — full implementation. The parent's complete read/write/execute toolset plus verify and advisor for self-review. Its final report must include a delivery transparency table with one row per task requirement (Done / Simplified / Not done — no deferred column).\n" +
    "- eng-coder — engineering-mode coder (available only in engineering mode, replacing coder). Same full toolset as coder plus the design-driven methodology overlay; REQUIRES a valid designToken arg obtained from a passed advisor(type='design') review. The advisor's Approved reply also echoes a designId — pass it as the designId arg: required to pick between designs when several approved reviews are active, optional for a single design. The delivery report echoes the designId back for the audit fix round. ALSO REQUIRES a batchDoc arg — the batch record path (docs/batches/<batch>-<topic>.md), the batch §2 task book this spawn implements: a spawn without it, or with a path that does not resolve to a readable file, is mechanically refused.\n" +
    "- eng-designer — engineering-mode design writer (available only in engineering mode): the SOLE author of the requirements + design documents and of the batch record §2 (the batch task book) — revisions included. Writes no implementation code, does not edit prompt files, does not fire reviews, and needs NO designToken (its authorization is the confirmed requirements). It surveys on its own, but may only spawn read-only 'explore' children (sync, ≤6 per batch). ALSO REQUIRES a batchDoc arg — the batch record path (docs/batches/<batch>-<topic>.md); the same mechanical gate as eng-coder: a spawn without it, or with a path that does not resolve to a readable file, is mechanically refused.\n" +
    "Mode filtering: normal mode exposes explore/plan/coder; engineering mode exposes explore/plan/eng-designer/eng-coder. The schema enum reflects the active mode.\n\n" +
    "Async spawn (AGENT-LOOP.md §15/§18/§11.1): pass async:true to spawn WITHOUT waiting — returns {id, role, status:\"running\"} immediately so you can keep working in your own turn (read/check files, run other tools) while the child runs in the background. The child's report is delivered to you automatically — there is no fetch action; use action:'status' only to see progress, never to wait for the result. Top-level spawns are ALWAYS async — never pass `async:false` at depth-0 (the report arrives automatically; if your next step needs it, end the turn and let the digest deliver it). Inside subagents (depth>0) spawns are always synchronous (platform rule). Eng-coder's delivery protocol runs fully inside the child (implementation → audit → self-fix → advisor re-review → converged delivery). Async spawns are pooled per role domain (AGENT-LOOP.md §11.1): at most 4 concurrent eng-coders and 4 concurrent other-role spawns by default (agent.poolLimits overrides both) — a full domain queues further spawns with a position while the other domain keeps starting (domains never block each other), and top-level only. After an async spawn the turn winds down normally — nothing expects you to wait for it: the child runs in the background and its report is delivered to you automatically — before your next turn, or digested in the suspension session — so end the turn; do not poll or wait for the result.\n\n" +
    "Task scheduling (AGENT-LOOP.md §20): declare the scheduling metadata to let the SCHEDULER order your spawns — files: the file paths this task will modify, dependsOn: ids from prior async spawn returns whose outcome this task needs. Overlapping-file tasks are serialized and dependent tasks are started in order automatically: a spawn that would conflict, or whose dependencies have not settled, queues instead of running ({id, status:\"queued\", position, reason} — the waiting task auto-starts when the conflict clears / its dependency settles; cancel a queued task to drop it). A spawn whose dependency was cancelled or failed stays queued and marked \"dependency cancelled\" until you decide (cancel it) — in an AUTO session it starts by itself. Referencing an unknown id errors; an id already consumed (auto-delivered by the auto channel) counts as satisfied. Omit both parameters for the plain immediate spawn (no scheduler involvement).\n\n" +
    "Writing the prompt:\n" +
    "- The sub-agent starts with zero context — it has not seen this conversation. Brief it like a colleague who just walked into the room: state the goal, list what you already know, hand over the specifics.\n" +
    "- Put exact paths and commands in the prompt when you know them. The sub-agent should not search for things you already know.\n" +
    "- Do not delegate understanding: if the task hinges on a file path or line number, find it yourself first and write it into the prompt.\n" +
    "- Once a sub-agent is running, leave that scope to it: don't redo its searches in parallel, and don't abandon it midway to finish manually.",
  parameters: {
    type: "object",
    properties: {
      action: { type: "string", enum: ["spawn", "status", "escalate", "cancel", "panel", "consume-design", "observe", "send"], description: "Which subagent-family action — spawn (default), status (non-blocking progress query — never consumes; async results arrive automatically — no fetch action), observe (inspect a running/queued/done async subagent's recent activity — recent turn summaries + current in-flight tool + turn/touched — §7.2), send (inject a direction into a RUNNING async subagent, consumed at its next turn boundary as an ordinary instruction — §7.2), escalate (飞刀 — hand implementation to a stronger consult model), cancel (stop ONE background subagent — pass its id; never omit), panel (view the live subagent panel / freeze a digested-stuck block — §19.6), consume-design (engineering mode, parent side: chain-terminal token consumption — close out a design's token slot after the delivery is verified and the chain closes out — §2.6, 2026-09-07). See the tool description for the full action matrix." },
      view: { type: "boolean", description: "action:'panel' only: true (default) = return the live panel blocks (the mirror of what the user sees). false with no freeze = nothing to do — error. Mutually exclusive with freeze (freeze wins)." },
      freeze: { type: "string", description: "action:'panel' only: block key of a digested-stuck awaitingDigest block (e.g. \"eng-coder#9\") to reclaim into the conversation via the gated done-freeze event. Refused when the block is running/done/unknown or its report is still pending digestion (would break the digestion order). Requires the CLI TUI panel mirror — headless/VS Code report the freeze unavailable." },
      task: { type: "string", description: "Required for action:'spawn' (the self-contained task brief) and action:'escalate' (goal, constraints, entry files, acceptance criteria). Not used by status." },
      context: { type: "string", description: "Optional background the sub-agent needs (it cannot see this conversation); action:'spawn' only." },
      role: { type: "string", enum: ["explore", "plan", "coder", "eng-coder", "eng-designer"], description: "The sub-agent role — see the tool description for the role capability matrix. Exact spelling required. action:'spawn' only (escalate spawns its own expert internally)." },
      model: { type: "string", description: "action:'spawn': provider/model override for this sub-agent ('provider:model', a provider name, or a model name on the parent's provider — defaults to config.agent.subagentModels[role], then config.agent.subagentModel, then the parent's provider). pass \"default\" to explicitly inherit the default model — equivalent to omitting the parameter. action:'escalate': pick a consult candidate as 'provider:model' (default = the first consult model)." },
      designToken: { type: "string", description: "Required when role='eng-coder': the token returned by advisor(type='design') after the design review passed. Without a valid token, eng-coder cannot modify files." },
      designId: { type: "string", description: "Optional when role='eng-coder': the designId echoed with the approved token by advisor(type='design'). Required to pick between designs when several approved reviews are active in the session — each eng-coder carries its own designId+token pair so parallel implementations never overwrite each other. Optional for a single design. action:'consume-design': the design whose slot to close out — optional for a single-design session; required to pick when several approved designs are active (the consume gate refuses to guess)." },
      batchDoc: { type: "string", description: "REQUIRED for role='eng-coder' and role='eng-designer': the batch record path (docs/batches/<batch>-<topic>.md) — the batch §2 task book this spawn implements (or writes). The spawn is mechanically refused without it, and also when the path does not resolve (cwd-relative or absolute) to a readable file; the CONTENT is never validated (the batch record owns that). explore/plan/coder spawns ignore it." },
      async: { type: "boolean", description: "action:'spawn': true = spawn without waiting — returns {id, status:\"running\"} immediately; the report is delivered to you automatically (there is no fetch action). Default: depth-0 → true (async — every role, AGENT-LOOP.md §18 D-E1a); depth>0 → sync (forced). action:'escalate': same semantics (AGENT-LOOP.md §25 D-R17b) — default async at depth 0; async:false keeps the legacy synchronous flight (mechanism parameter — see the Async spawn section for top-level guidance)." },
      files: { type: "array", items: { type: "string" }, description: "action:'spawn' only: the file write-domain this task declares (cwd-relative or absolute paths). files must be file-level paths (one per file you will modify). Directory declarations are NOT supported — they bypass the conflict detector and are rejected with an error. Tasks with overlapping files are serialized automatically — a conflicting spawn queues ({id, status:\"queued\", position, reason}) instead of running concurrently and starts when the conflict clears. Omit to skip conflict detection (plain immediate spawn)." },
      dependsOn: { type: "array", items: { type: "string" }, description: "action:'spawn' only: ids from prior async spawn returns whose outcome this task needs — the task queues ({id, status:\"queued\", position, reason}) until every dependency settles, then starts automatically. Ids already consumed (auto-delivered to the model) count as satisfied; a dependency cancelled or failed leaves the task queued marked 'dependency cancelled' until you decide (cancel it — AUTO sessions auto-start). Unknown ids error." },
      id: { type: "string", description: "action:'status'/'observe'/'send'/'cancel': the subagent id from the async spawn return. status: omit = overview of the whole pool; observe/send/cancel: REQUIRED (observe needs the child to inspect; send needs the target; never omit on cancel — a blanket cancel is unsupported)." },
      message: { type: "string", description: "action:'send' only (REQUIRED there): the direction to inject — the running async subagent consumes it at its next turn boundary as an ordinary user instruction (non-interrupting; its convergence/audit discipline is unchanged — injection is guidance, not a deviation waiver)." },
      recent: { type: "integer", description: "action:'observe' only (optional, default 5): how many recent-turn summaries to return (clamped 1..20 — N2 keeps observe terse)." },
    },
    required: [],
  },
  readonly: false,
  sideEffectExempt: true, // child agent may write files; parent can't introspect its _mutatedThisRun
  parallel: true,
  async execute(args, ctx) {
    // §19 action dispatch: default spawn keeps every legacy call unchanged
    // (no action parameter → the spawn path below, byte-identical semantics).
    const action = args?.action !== undefined && args?.action !== null && String(args.action) !== ""
      ? String(args.action)
      : "spawn"
    if (action !== "spawn") {
      // §19 restricted-variant action gate (round2 #3): the engineering-child channel
      // (depth>0, role eng-coder or eng-designer) is spawn-only — escalate spawns a
      // coder+WRITE child (violates explore-only intent) and status/panel/observe/send
      // have no async pool / panel mirror to query in a child context.
      if ((ctx.depth ?? 0) > 0 && (ctx.agent?._role === "eng-coder" || ctx.agent?._role === "eng-designer")) {
        throw new Error(`only action:'spawn' (sync explore children) is available inside an ${ctx.agent._role} — escalate/status/cancel/panel/consume-design/observe/send are not (AGENT-LOOP.md §19 D-M3)`)
      }
      // §17 N3/D-S6 spawn gate (manual tier): auto-turn digests may not spawn —
      // async OR blocking — the digest must stay organize-only. The escalate
      // action spawns a write child too, so the same mechanical refusal applies
      // (AUTO tier exempt — user authorized unattended continuation).
      if (action === "escalate" && ctx.agent?._inAutoTurn && !ctx.agent?.autoApprove) {
        return JSON.stringify({ status: "error", error: "cannot spawn subagents from a manual auto-turn — wait for user input" })
      }
      if (action === "status") return executeStatusAction(args, ctx)
      if (action === "escalate") return await executeEscalateAction(args, ctx)
      // §19.5 控制类动作：digest 内放行（D-S7 分类——控制/自省；dispatch 控制类
      // 豁免同批生效——19.5.2b round2 #4；escalate 的 digest 拒绝在上一分支）
      if (action === "cancel") return executeCancelAction(args, ctx)
      // 2026-09-07 token 链终消费制（ENGINEERING-MODE.md §2.6 F1）：父侧核销消费——
      // 非只读控制动作——depth-0 + 工程模式限定（本分流已过受限变体门；工程模式门在
      // 执行器内）——planMode 拒绝（dispatch 不豁免）——不入批审批分组（dispatch 免审）。
      if (action === "consume-design") return executeConsumeDesignAction(args, ctx)
      // §19.6 panel 动作：view（readonly 面——digest 内放行——自省类）与 freeze
      // （控制类——同 cancel——digest 内放行）。深度/门控检查在 executePanelAction 内。
      // CLI-ACTIVITY-DEBLOAT F-3（2026-09-10）接线：executePanelAction 经 ctx.state
      // （= agent._tuiState——startTUI 反向挂载）读时现算面板块（computePanelBlocks）——
      // 手工面板镜像已退役。headless/VSC 无挂载 → 现算返 null → 降级照旧。
      if (action === "panel") return executePanelAction(args, { ...ctx, state: ctx.agent?._tuiState })
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
    // §18 D-E3 internal-spawn gate: an eng-coder sub-agent may only spawn sync
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
    if (!parent.config?.agent?.engineering && role === "eng-coder") {
      throw new Error("Engineering mode is not active — use role='coder' for implementation tasks.")
    }
    // Third mode gate (ENGINEERING-MODE.md §2.15 A—— symmetric completion):
    // eng-designer is engineering-mode-only, same family as eng-coder (both carry
    // the engineering discipline overlay + the batchDoc gate).
    if (!parent.config?.agent?.engineering && role === "eng-designer") {
      throw new Error("Engineering mode is not active — role='eng-designer' is engineering-mode only (it writes the requirements/design documents inside the engineering workflow); use role='explore' or role='plan' for read-only work.")
    }

    // §17 N3/D-S6 spawn gate (manual tier): auto-turn digests may not spawn — async
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
        // 解绕折叠"——AGENT-LOOP §7.2 机制文）。abort 恒已在途（stopped 只由
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
    const { ctrl, disarm } = armSyncChildAbort(parent, syncKey, baseSignal)
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
        // §27 R23：外层 abort 传播的中断——内层开块随之外层冻结前先收尾定格
        // （D-R23c1 stopped——T-R23c.2a 生成侧路径；TUI 冻结兜底仍在 freezeSubTaskLines）
        emitNestedChildEvent(ctx, relayPrefix, "stopped")
        throw e // 用户停——不落错误事件
      }
      if (cls === "error") {
        // ③ 其他错误（现状逐字保留——:249-253）：
        // §27 R23 error-run 映射（实现批补一行）：run 错误（非 abort）→ 同样发 stopped
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
      // 幂等无害（重复/迟到 done 由 §27.1 F2 done 子块定格丢弃兜底）。
      ctx.callbacks?.onToken?.(`${relayPrefix}⟦ev⟧stopped\x1e0\x1e0\x1estopped\x1e`)
      emitNestedChildEvent(ctx, relayPrefix, "stopped")
    } finally {
      // R7 防跨回合残留：成功/折叠②/整回合停①/错误③ 四出口统一注销（设计"三路径"
      // 口径 = 成功/折叠/整回合停——错误③ 同样 rethrow 经 finally——同归本注销）
      disarm()
    }
    // §27 R23 D-R23c1（评审 #1 🅰——生成侧补发射）：sync spawn 同步收尾——若本 spawn
    // 处于嵌套上下文（ctx.callbacks 已是嵌套 wrapper——eng-coder 内 explore 审计）→
    // 发内层 ⟦ev⟧done（完整嵌套前缀——wrapper 链自动补外层）→ 主 TUI 路由子块定格
    // （T-R23c.1）。非嵌套（depth-0）零变化——冻结仍由 dispatch subKey 精确冻承接。
    // ② 折叠 = 正常 return（本共用出口：done 补发照设 + ctx._subagentKey 照设——成功
    // 冻结管线复用——迟到 done 对已定格 stopped 块被丢弃——幂等无害）。
    emitNestedChildEvent(ctx, relayPrefix, "done")
    logEvent("child:done", { role, id: child._logId, ms: Date.now() - blockT0, kind: String(pipelineReport).includes(TURN_CAP_MARK) || String(pipelineReport).includes(STOPPED_MARK) ? "partial" : "ok" })
    // §7.2.3 sync spawn 完成精确冻结（方案 e）：execute 返回前 ctx 留子代理 key
    // （relayPrefix 去尾 = `role#N`）——dispatch runOne 读它作 onToolResult 第 4 参 →
    // TUI finishSubTaskKey 按 key 精确冻（async eng-coder 先启动时不再误冻其块——
    // T-F2）。仅成功/折叠路径设置：async 分支不设（round2 #2——ack 带 status:running 由
    // isAsyncSpawnResult 跳过冻结）；base/error 路径到此之前已 throw——ctx 未设
    // ——中止/错误路径不触发冻结（round1 #1——T-F5）。
    ctx._subagentKey = syncKey
    return pipelineReport
  },
}

// Re-export shim (2026-09-03 拆分轮 + §19 合体轮 + 2026-09-05 拆分轮): 机械与动作
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
