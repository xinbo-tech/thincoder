import {
  createAgent,
  readonlyToolNames, escapeXml,
  EXPLORE_OVERLAY, CODER_OVERLAY, PLAN_OVERLAY, ENG_CODER_OVERLAY,
} from "../agent.mjs"
import { makeRelay, wrapChildCallbacks, gateEngCoderSpawn, TURN_CAP_MARK } from "../agent/spawn-child.mjs"
import { validateDesignToken } from "./advisor.mjs"
import { pushReal } from "../context.mjs"
import { logEvent, errText } from "../log.mjs"
import {
  runChildPipeline, resolveChildProvider, ASYNC_SUBAGENT_LIMIT,
  buildChildRunOpts, maybeRefillAsync,
  executeCheckAction, executeStatusAction, executeEscalateAction, executeCancelAction,
  executePanelAction,
  // §20 调度器（AGENT-LOOP.md §20——D-SD1..SD5）：文件域归一化/等待态派生/环防御/
  // 排队态面板刷新/依赖者标注。
  normalizeFileList, describeBlockers, queueRunnable, refreshQueuedTokens,
  assertNoDepCycle, depInfo, dependentLabels,
} from "./subagent-async.mjs"

// 2026-09-03 拆分轮: subagent.mjs 超 500 硬顶——async 常量、共享 post-spawn 管线
//（runChildPipeline）与队列/注入/并账机械迁至 ./subagent-async.mjs。execute
//（async 分支 + 阻塞路径）原样保留于本文件；导出面由文末 re-export shim 兜住。
// 2026-09-03 §19 合体轮: subagent_check/escalate 工具退役——check/status/escalate
// 动作执行器并入 ./subagent-async.mjs，本文件只承载工具面（action schema）与
// spawn 路径 + 动作分流。

/**
 * §18.7 D-TS5 (A2): mechanically summarize the parent spawn task book for the
 * audit spawn — the three audit-relevant elements VERBATIM (design doc paths /
 * affected-file list / acceptance criteria); verbose context/background is
 * dropped (the auditor can read the design docs themselves — they stay
 * available outside this input). Independence preserved: the input is
 * _engTaskInput (mechanically kept by the parent spawn) — never the
 * eng-coder's self-report. Sections are located by header marker, prioritizing
 * header lines (structured task books: "## 文件清单 …") and falling back to
 * inline markers (flat one-line task books); a section runs to the next header
 * of the SAME OR HIGHER level ("## 文件清单" survives a "### 修改" sub-header).
 * Marker not found → the section is reported as missing (never fabricate).
 */
function summarizeEngTaskBook(taskInput) {
  if (!taskInput) return "(unavailable)"
  const SECTIONS = [
    { name: "Design docs involved", markers: [/Docs? involved/i, /涉及文档/] },
    { name: "Affected-file list", markers: [/Files? (?:list|to (?:modify|change)|modified)/i, /受影响文件/, /文件清单/, /涉及文件/] },
    { name: "Acceptance criteria", markers: [/Acceptance(?: criteria)?/i, /验收标准/] },
  ]
  const lines = taskInput.split("\n")
  const headerLevel = (l) => {
    const m = l.match(/^\s*(#{1,6})\s/)
    return m ? m[1].length : 0
  }
  const headerIdx = lines.map((l, i) => (headerLevel(l) > 0 ? i : -1)).filter((i) => i >= 0)
  const boundsFor = (from, level) => {
    for (const j of headerIdx) {
      if (j > from && (level === 0 || headerLevel(lines[j]) <= level)) return j
    }
    return lines.length
  }
  const out = []
  for (const { name, markers } of SECTIONS) {
    let from = -1
    let level = 0
    for (const i of headerIdx) {
      if (markers.some((m) => m.test(lines[i]))) { from = i; level = headerLevel(lines[i]); break }
    }
    if (from === -1) {
      for (let i = 0; i < lines.length; i++) {
        if (markers.some((m) => m.test(lines[i]))) { from = i; level = 0; break }
      }
    }
    if (from === -1) { out.push(`${name}: (not found in the parent task book)`); continue }
    const body = lines.slice(from, boundsFor(from, level)).join("\n").trim()
    out.push(body || `${name}: (empty section)`)
  }
  return out.join("\n\n")
}

/**
 * subagent tool — ONE tool, SIX actions (AGENT-LOOP.md §19/§19.5/§19.6): spawn
 * (default) / check (fetch async results, blocking + consuming) / status
 * (non-blocking pool query) / escalate (飞刀 — hand implementation to a
 * stronger model) / cancel (stop ONE background subagent — §19.5) / panel
 * (view + fix the live subagent panel — §19.6).
 * - action:"spawn" roles: "explore" — read-only tools, search/read/analyze
 *   (suitable for codebase exploration); "coder" — full tool set, self-contained
 *   implementation tasks; "plan" — read-only planning; "eng-coder" —
 *   engineering-mode implementation (design-token gated).
 * - no role specified — invalid by design since the 2026-08-25 fail-closed gate
 *   (role is mandatory; "no role → same tool set as parent" was removed with the
 *   coder-leak fix and the header text above predates it)
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
    "ONE tool, SIX actions (AGENT-LOOP.md §19/§19.5/§19.6) — pick by what you need:\n" +
    "- action:'spawn' (DEFAULT): spawn a sub-agent to handle an independent subtask in an isolated context; the sub-agent returns only its final report. Spawn MULTIPLE subagents in the SAME response for parallel work—they run concurrently.\n" +
    "- action:'check': fetch the report of an async spawn (async:true). BLOCKS until the target finishes — this is the explicit consuming fetch, NOT a progress query. Multiple async children return in completion (arrival) order, first finished first. Pass n = 1 on the first check of the turn, 2 on the next... (loop guard; at most 3 per turn — the rest arrive at turn end).\n" +
    "- action:'status': NON-BLOCKING progress query — returns immediately and consumes nothing. Give the spawn's id for one child ({id, role, status: running|queued|done, model, elapsedSec, turn, maxTurns, position?), or omit it for an overview of the whole pool ({overview: {running: [{id, role, model, elapsedSec, turn, maxTurns}], queued: [{id, role, position}], done: [{id, role}]}}). §19.5.6 touched-files summary: running entries also carry touchedFiles (first 5, relative to your cwd), touchedMore (count beyond 5) and, when nothing was touched yet, the placeholder touched (\"—（尚无改动）\"); queued (not yet started) entries carry the placeholder touched (\"—（未启动）\") — see what a running child has changed BEFORE deciding to cancel it. Use THIS to check progress — action:'check' blocks until the target finishes (checking progress with check is what hangs a parallel turn).\n" +
    "- action:'escalate' (飞刀 — a flown-in expert): hand an implementation task to a STRONGER model from your consult models (agent.consultModels). It gets WRITE access and does the work itself — reads, edits, runs tests — then returns a post-op report (what changed, why, verification). Use it when YOU judge the task calls for stronger hands (complex multi-file refactoring, an intractable bug, intricate algorithm work — or work beyond your comfortable ability); escalate EARLY, not after burning attempts. model: pick a candidate as 'provider:model' (default = the first consult model). Not available in engineering mode (implementation goes through eng-coder spawns there).\n" +
    "- action:'cancel': STOP one background subagent — pass the id from the async spawn return (REQUIRED — omitting it errors; a blanket cancel is unsupported, Ctrl+C stops everything). Running target aborts immediately ({id, status:'cancelled'}); a queued target is removed from the queue ({id, status:'cancelled', was:'queued'} and later queue positions shift forward). Other children and the session keep running — cancellation is targeted. Use it when a background child is going the wrong way (e.g. burning turns) and you must stop it before its report arrives. Cancel is a last resort: verify alarming signals with reliable checks (git/node — not guesses) first; prefer scoped recovery (restore a single affected file) over killing the child — a running child's in-flight work dies with it, partial changes stay unmerged and unaudited.\n" +
    "- action:'panel': DIAGNOSE + fix the subagent panel — the collapsible blocks under the conversation the user sees (CLI TUI panel mirror; headless/VS Code degrade to a 'no panel' pool view). view (default — call it with no params or view:true): returns the live panel blocks [{key, role, status: running|done|awaitingDigest} — running entries also carry elapsedSec; awaitingDigest entries whose report is ALREADY digested carry digested:true (stuck blocks — the freezable ones — explain odd panel states here)] exactly as the user sees them. freeze: pass the block key of a digested-stuck block ({action:'panel', freeze:'role#N'}) to reclaim it into the conversation — the freeze ONLY passes for awaitingDigest blocks with no live pool entry and no pending report (gated); freezing a block whose report is still pending would break the digestion order and is refused with a clear error.\n\n" +
    "Why delegate? A sub-agent runs in its own isolated context — its reads, searches, tool calls and edits never enter your history or pollute your window; only its final report comes back. Delegation keeps your working context lean (you see the whole session, not the child's noise) and the child single-mindedly focused on one task. Parallel children run concurrently, saving wall-clock time. Every coder/eng-coder child carries its own verify + advisor self-review discipline — handed-off work is already verified before you read a word of it.\n\n" +
    "Available roles (which roles are exposed depends on the active mode — see Mode filtering below):\n" +
    "- explore — read-only search & analysis. Toolset: the read/search family (grep, read, glob, code_search, doc_search, repo_outline, lsp, tree...). No git context injected—evidence from read/glob/grep and the task book. Its report must list what it searched and what it did NOT find. Fast — specify thoroughness in the task: quick / medium / thorough (default medium).\n" +
    "- plan — read-only implementation planning. Same read/search toolset; NEVER edits files. Returns a step-by-step plan for the parent to execute.\n" +
    "- coder — full implementation. The parent's complete read/write/execute toolset plus verify and advisor for self-review. Its final report must include a delivery transparency table with one row per task requirement (Done / Simplified / Not done — no deferred column).\n" +
    "- eng-coder — engineering-mode coder (available only in engineering mode, replacing coder). Same full toolset as coder plus the design-driven methodology overlay; REQUIRES a valid designToken arg obtained from a passed advisor(type='design') review. The advisor's Approved reply also echoes a designId — pass it as the designId arg: required to pick between designs when several approved reviews are active, optional for a single design. The delivery report echoes the designId back for the audit fix round.\n" +
    "Mode filtering: normal mode exposes explore/plan/coder; engineering mode exposes explore/plan/eng-coder. The schema enum reflects the active mode.\n\n" +
    "Async spawn (AGENT-LOOP.md §15/§18): pass async:true to spawn WITHOUT waiting — returns {id, role, status:\"running\"} immediately so you can keep working in your own turn (read/check files, run other tools) while the child runs in the background. Fetch the report later with action:'check' — multiple async children return in completion (arrival) order, first finished first, so fast results are handled immediately. Query progress with action:'status' (non-blocking) — action:'check' BLOCKS until the target finishes. The DEFAULT is role-level: role='eng-coder' spawns async (its delivery protocol runs fully inside the child — implementation → audit → self-fix → advisor re-review → converged delivery; pass async:false only when you must handle the report synchronously); every other role defaults to blocking. Use async when your own turn must keep moving; use a blocking spawn when you must see the report before continuing. Async spawns are capped at 4 concurrent (further spawns queue with a position), and top-level only.\n\n" +
    "Task scheduling (AGENT-LOOP.md §20): declare the scheduling metadata to let the SCHEDULER order your spawns — files: the file paths this task will modify, dependsOn: ids from prior async spawn returns whose outcome this task needs. Overlapping-file tasks are serialized and dependent tasks are started in order automatically: a spawn that would conflict, or whose dependencies have not settled, queues instead of running ({id, status:\"queued\", position, reason} — the waiting task auto-starts when the conflict clears / its dependency settles; cancel a queued task to drop it). A spawn whose dependency was cancelled or failed stays queued and marked \"dependency cancelled\" until you decide (cancel it) — in an AUTO session it starts by itself. Referencing an unknown id errors; an id already consumed by check counts as satisfied. Omit both parameters for the plain immediate spawn (no scheduler involvement).\n\n" +
    "Writing the prompt:\n" +
    "- The sub-agent starts with zero context — it has not seen this conversation. Brief it like a colleague who just walked into the room: state the goal, list what you already know, hand over the specifics.\n" +
    "- Put exact paths and commands in the prompt when you know them. The sub-agent should not search for things you already know.\n" +
    "- Do not delegate understanding: if the task hinges on a file path or line number, find it yourself first and write it into the prompt.\n" +
    "- Once a sub-agent is running, leave that scope to it: don't redo its searches in parallel, and don't abandon it midway to finish manually.",
  parameters: {
    type: "object",
    properties: {
      action: { type: "string", enum: ["spawn", "check", "status", "escalate", "cancel", "panel"], description: "Which subagent-family action — spawn (default), check (fetch async results — BLOCKS until the target finishes and consumes the report), status (non-blocking progress query — never consumes), escalate (飞刀 — hand implementation to a stronger consult model), cancel (stop ONE background subagent — pass its id; never omit), panel (view the live subagent panel / freeze a digested-stuck block — §19.6). See the tool description for the full action matrix." },
      view: { type: "boolean", description: "action:'panel' only: true (default) = return the live panel blocks (the mirror of what the user sees). false with no freeze = nothing to do — error. Mutually exclusive with freeze (freeze wins)." },
      freeze: { type: "string", description: "action:'panel' only: block key of a digested-stuck awaitingDigest block (e.g. \"eng-coder#9\") to reclaim into the conversation via the gated done-freeze event. Refused when the block is running/done/unknown or its report is still pending digestion (would break the digestion order). Requires the CLI TUI panel mirror — headless/VS Code report the freeze unavailable." },
      task: { type: "string", description: "Required for action:'spawn' (the self-contained task brief) and action:'escalate' (goal, constraints, entry files, acceptance criteria). Not used by check/status." },
      context: { type: "string", description: "Optional background the sub-agent needs (it cannot see this conversation); action:'spawn' only." },
      role: { type: "string", enum: ["explore", "plan", "coder", "eng-coder"], description: "The sub-agent role — see the tool description for the role capability matrix. Exact spelling required. action:'spawn' only (escalate spawns its own expert internally)." },
      model: { type: "string", description: "action:'spawn': provider/model override for this sub-agent ('provider:model', a provider name, or a model name on the parent's provider — defaults to agent.subagentModel then the parent's provider). action:'escalate': pick a consult candidate as 'provider:model' (default = the first consult model)." },
      designToken: { type: "string", description: "Required when role='eng-coder': the token returned by advisor(type='design') after the design review passed. Without a valid token, eng-coder cannot modify files." },
      designId: { type: "string", description: "Optional when role='eng-coder': the designId echoed with the approved token by advisor(type='design'). Required to pick between designs when several approved reviews are active in the session — each eng-coder carries its own designId+token pair so parallel implementations never overwrite each other. Optional for a single design." },
      async: { type: "boolean", description: "true = spawn without waiting — returns {id, status:\"running\"} immediately, fetch results later via action:'check'. Default is role-level: role='eng-coder' → true (async; its internal delivery protocol runs in the background — pass async:false to force the blocking spawn when you must process the report before continuing); all other roles → false (blocking)." },
      files: { type: "array", items: { type: "string" }, description: "action:'spawn' only: the file write-domain this task declares (cwd-relative or absolute paths). files must be file-level paths (one per file you will modify). Directory declarations are NOT supported — they bypass the conflict detector and are rejected with an error. Tasks with overlapping files are serialized automatically — a conflicting spawn queues ({id, status:\"queued\", position, reason}) instead of running concurrently and starts when the conflict clears. Omit to skip conflict detection (plain immediate spawn)." },
      dependsOn: { type: "array", items: { type: "string" }, description: "action:'spawn' only: ids from prior async spawn returns whose outcome this task needs — the task queues ({id, status:\"queued\", position, reason}) until every dependency settles, then starts automatically. Ids consumed by action:'check' count as satisfied; a dependency cancelled or failed leaves the task queued marked 'dependency cancelled' until you decide (cancel it — AUTO sessions auto-start). Unknown ids error." },
      id: { type: "string", description: "action:'check'/'status'/'cancel': the subagent id from the async spawn return. check: omit = the next completed child (arrival order); status: omit = overview of the whole pool; cancel: REQUIRED (never omit — a blanket cancel is unsupported)." },
      n: { type: "number", description: "action:'check' (required): 1-based read counter — 1 for the first check of the turn, incrementing with each subsequent check (loop detector — consecutive checks must be distinct tool calls)." },
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
      // §19 restricted-variant action gate (round2 #3): the eng-coder audit
      // channel (depth>0, role eng-coder) is spawn-only — escalate spawns a
      // coder+WRITE child (violates explore-only intent) and check/status/panel
      // have no async pool / panel mirror to query in a child context.
      if ((ctx.depth ?? 0) > 0 && ctx.agent?._role === "eng-coder") {
        throw new Error(`only action:'spawn' (sync explore audits) is available inside an eng-coder — escalate/check/status/cancel/panel are not (AGENT-LOOP.md §19 D-M3)`)
      }
      // §17 N3/D-S6 spawn gate (manual tier): auto-turn digests may not spawn —
      // async OR blocking — the digest must stay organize-only. The escalate
      // action spawns a write child too, so the same mechanical refusal applies
      // (AUTO tier exempt — user authorized unattended continuation).
      if (action === "escalate" && ctx.agent?._inAutoTurn && !ctx.agent?.autoApprove) {
        return JSON.stringify({ status: "error", error: "cannot spawn subagents from a manual auto-turn — wait for user input" })
      }
      if (action === "check") return await executeCheckAction(args, ctx)
      if (action === "status") return executeStatusAction(args, ctx)
      if (action === "escalate") return await executeEscalateAction(args, ctx)
      // §19.5 控制类动作：digest 内放行（D-S7 分类——控制/自省；dispatch 控制类
      // 豁免同批生效——19.5.2b round2 #4；escalate 的 digest 拒绝在上一分支）
      if (action === "cancel") return executeCancelAction(args, ctx)
      // §19.6 panel 动作：view（readonly 面——digest 内放行——自省类）与 freeze
      // （控制类——同 cancel——digest 内放行）。深度/门控检查在 executePanelAction 内。
      if (action === "panel") return executePanelAction(args, ctx)
      throw new Error(`Unknown subagent action: ${JSON.stringify(action)}. Valid actions: spawn, check, status, escalate, cancel, panel.`)
    }

    const parent = ctx.agent
    const role = args.role
    // Spawn requires a task brief — schema `required` is advisory (multi-action
    // schema), so the mechanical check lives here: an absent task would otherwise
    // flow downstream as `content: undefined` and surface as an obscure error.
    if (typeof args.task !== "string" || !args.task.trim()) {
      throw new Error("subagent action:'spawn' requires a task (the self-contained task brief).")
    }
    // §18 F1/D-E1 role-level async default: eng-coder spawns async unless the
    // caller explicitly passes async:false; every other role stays blocking.
    const wantAsync = args.async ?? role === "eng-coder"

    // Role normalization + whitelist (2026-08-25, coder-leak fix): exact-string gates let
    // variant roles ("Coder", " coder") bypass BOTH mode gates and fall through to
    // full tools / no overlay — a full-write coder without design review. Schema enums are
    // advisory; providers don't enforce them. Fail closed on unknown roles.
    const ROLES = new Set(["explore", "plan", "coder", "eng-coder"])
    if (!ROLES.has(role)) {
      throw new Error(`Unknown subagent role: ${JSON.stringify(role)}. Valid roles: explore, plan, coder, eng-coder (exact spelling).`)
    }
    // §18 D-E3 internal-spawn gate: an eng-coder sub-agent may only spawn sync
    // explore (audit) children — non-explore roles and async are refused here
    // (mechanical), the audit budget is enforced (7th audit spawn refused), and
    // the returned attempt number marks this spawn as an audit for the task-book
    // augmentation below. Runs BEFORE the mode gates so the eng-coder-specific
    // error (not the generic engineering-mode one) surfaces.
    const engAuditAttempt = gateEngCoderSpawn(ctx.agent, ctx.depth, role, args.async)
    // Role is mutually exclusive per mode: normal mode → "coder", engineering mode → "eng-coder"
    if (parent.config?.agent?.engineering && role === "coder") {
      throw new Error("Engineering mode: use role='eng-coder' for implementation tasks.")
    }
    if (!parent.config?.agent?.engineering && role === "eng-coder") {
      throw new Error("Engineering mode is not active — use role='coder' for implementation tasks.")
    }

    // §17 N3/D-S6 spawn gate (manual tier): auto-turn digests may not spawn — async
    // OR blocking — the digest must stay organize-only. AUTO tier (autoApprove) is
    // exempt (推进型 — user authorized unattended continuation). Mechanical refusal
    // so the digest never pops a permission panel or chains new background work.
    // （escalate 动作的同类拒绝在 action 分流处——本检查只管 spawn 路径。）
    if (parent._inAutoTurn && !parent.autoApprove) {
      return JSON.stringify({ status: "error", error: "cannot spawn subagents from a manual auto-turn — wait for user input" })
    }

    // ── §20 spawn 调度参数准入（AGENT-LOOP.md §20 D-SD1/D-SD3 + 20.4 round2 #5/#7）──
    // files/dependsOn 声明即契约（v1：不做任务书文本自动解析——不可靠）。缺省（两者皆
    // 缺）= 既有语义零改动（不参与冲突检测/无校验——legacy spawn 零开销直通）。
    // 校验序：参数形态 → 依赖 unknown id（非 consumed 墓碑——T-SD10）→ 依赖环可达
    // （T-SD5——防御断言：自然流程不可达）→ 等待态判定。判定结果：wait/depc 阻塞 →
    // async 入 queued 等位（spawn 返回带 reason——D-SD3b）；**sync spawn（async:false）
    // 命中阻塞 → 明确错误——不队列化 sync——sync 语义零变更（round2 #7——T-SD13）**。
    const filesRaw = args.files
    const dependsRaw = args.dependsOn
    // §20.8 D-F1.1：目录声明 fail-closed——检测器 throw → catch → 错误即工具结果
    // （模型可见"文件级明细"提示——不加静默——目录绕过冲突检测的通道闭合）。
    let files = []
    if (filesRaw !== undefined && filesRaw !== null) {
      try {
        files = normalizeFileList(filesRaw, parent.cwd)
      } catch (e) {
        return JSON.stringify({ status: "error", error: e.message })
      }
    }
    if (filesRaw !== undefined && filesRaw !== null && !Array.isArray(filesRaw)) {
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
      for (const d of dependsOn) {
        if (depInfo(parent, d).state === "unknown") {
          throw new Error(`subagent dependsOn: unknown async subagent id: ${d} — dependsOn references ids from prior async spawn returns; an id already consumed by action:'check' (or auto-injected) counts as satisfied, anything else is a mistake (AGENT-LOOP.md §20 D-SD5)`)
        }
      }
      assertNoDepCycle(parent, dependsOn)
      const block = describeBlockers(parent, { _files: files, _dependsOn: dependsOn })
      if (!wantAsync && block.kind !== "slot") {
        throw new Error(`sync spawn (async:false) cannot queue behind a scheduling conflict: ${block.detail} — pass async:true to queue the task (the scheduler starts it when the blockers clear), or wait for them to finish first (AGENT-LOOP.md §20 round2 #7)`)
      }
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
    // §18 D-E3 task-domain authorization: approved design + spawn task = authorization.
    // The child's OWN tools skip ONLY the onPermissionRequest ask (autoApprove
    // equivalent — dispatch.mjs permission stage); every other gate (JSON parse /
    // unknown tool / planMode / design-token) still applies (T-E14). Non-eng-coder
    // children keep the manual per-write parent approval (human in the loop).
    if (role === "eng-coder") child._engTaskAuthorized = true
    // designId+token ride the child bookkeeping: the delivery report carries the designId
    // so the divergence-audit fix round re-spawns with the SAME slot (2026-09-01 FR3).
    if (role === "eng-coder" && issuedToken) {
      child._engDesignId = args.designId ?? null
      child._engDesignToken = issuedToken
    }

    // §18.5 子代理零 git（D-AG1——2026-09-04 用户裁定）：explore/plan 一律不注入
    // git 上下文——子代理证据链 = 任务书 ∪ 磁盘当前状态（read/glob/grep）∪（审计时）
    // _touchedFiles，无一项来自 git；注入的全工作区脏状态快照与任务域无关，会误导
    // 审计/探索（"status 里这个文件算不算超清单？"）。注入分支整体删除（B 方案
    // git 只读变体亦随裁定废弃——D-AG5）。顶层主 agent 注入保留（§3 prepareRun——
    // setup.mjs depth===0——D-AG7 范围边界）。
    let input = args.context ? `Context:\n${args.context}\n\nTask:\n${args.task}` : args.task
    // §18 D-E2 ③ (round4 #4, T-E13/T-E15): an eng-coder audit spawn's task book is
    // the eng-coder's OWN spawn task — mechanically kept as _engTaskInput by the
    // parent spawn and injected as the D-TS5 A2 mechanical summary (design docs /
    // affected-file list / acceptance criteria verbatim, verbose context dropped)
    // — ∪ the mechanically tracked _touchedFiles — NEVER the eng-coder's
    // self-written list: a self-report could omit exactly the out-of-scope file
    // the audit must catch.
    if (engAuditAttempt !== null) {
      const touched = (ctx.agent._touchedFiles ?? []).map((f) => `- ${f}`).join("\n") || "- (none yet)"
      input += `\n\n[Audit scope — mechanical context, independent of the eng-coder's self-report:]\n` +
        // §18.7 D-TS4 A1：审计指令模板（四类偏差 + 范围限制 + 校验清单格式）——审计语义
        // 不再靠模型自悟；范围限制是 §18.5 D-AG3 声明（下方 Zero-git scope authority）
        // 的同源一句指注，不重复声明。
        `[Audit instructions — mechanical template (AGENT-LOOP.md §18.7 D-TS4 A1):]\n` +
        `You are auditing an eng-coder delivery against its approved design — audit for EXACTLY these four deviation categories:\n` +
        `- PARTIAL: an acceptance criterion implemented partially or not at all;\n` +
        `- SILENT-SIMPLIFICATION: a "simpler approximation" of a specified behavior substituted for the spec;\n` +
        `- DOC-DRIFT: code changed without the owning design-doc section (module map / affected-files table) updated in the same delivery;\n` +
        `- OUT-OF-LIST: changes outside the approved file list.\n` +
        `Audit scope = _touchedFiles above UNION the files confirmed by the parent task book (single source — the Zero-git scope authority note below, AGENT-LOOP.md §18.5 D-AG3; NOT a second copy): ` +
        `workspace changes not listed there are unrelated to this delivery and are NOT grounds for an out-of-list finding.\n` +
        `Scope discipline (F-TS6 A1): read ONLY the audited files and the design-doc sections relevant to this delivery — do NOT re-read whole documents.\n` +
        `Every deviation item MUST be fieldized: file:line + design reference (doc path + section/AC id) + severity + evidence (quoted code or doc text).\n` +
        // §18.7 D-TS5 A2：任务书从全量 verbatim 改机械摘要块（三要素逐字——排除冗长上下文）。
        `[Parent spawn task book — mechanical summary (AGENT-LOOP.md §18.7 D-TS5 A2): design docs + affected-file list + acceptance criteria verbatim; verbose context/background dropped — the design docs are still available for reading outside this input:]\n` +
        `${summarizeEngTaskBook(ctx.agent._engTaskInput)}\n` +
        `Files actually touched by the eng-coder (mechanical union — audit these against the file list):\n${touched}\n` +
        // §18.5 D-AG3（2026-09-04）：审计零 git 范围权威声明——本审计任务零 git（不注入
        // git 上下文——§18.5 全角色零 git）；_touchedFiles 为审计范围；工作区未列于
        // _touchedFiles 的改动与本任务无关，不作超清单依据（VS Code auditTaskBook 同款措辞）。
        "Zero-git scope authority (AGENT-LOOP.md §18.5 D-AG3): this audit task receives NO git context — nothing is injected. " +
        "The evidence base is the design documents, the current disk state (read/glob/grep), and the _touchedFiles list above. " +
        "Workspace changes NOT listed in _touchedFiles are unrelated to this delivery — they are NOT grounds for an out-of-file-list finding." +
        // §18.13 D-A1.2：审计预算句——A1 指令模板 + A2 摘要块之后、A3 报告模板之前（定序——评审 #7）。
        // 逐字设计锚（D-A1.2 代码块）：只读该读的——10 轮机械预算——超时报 PROBLEM 下结论。
        // 前导 \n 与 A3 同款块分隔约定（上一句 Zero-git 句末无换行——不触碰既有句）。
        `\n[Audit budget — mechanical]: read ONLY the touched files listed above and the design-doc sections the parent task book names (affected-files table, acceptance criteria, status line). Do NOT read whole documents. Budget = 10 tool rounds max — if you cannot conclude within it, report PROBLEM (inconclusive) rather than continuing to explore.\n` +
        // §18.7 D-TS6 A3：审计输出报告格式模板（三态——字段化行——不让模型自由发挥）。
        `\n[Audit report format — mechanical template (AGENT-LOOP.md §18.7 D-TS6 A3):]\n` +
        `Report EXACTLY one of three states:\n` +
        `- CLEAN — no deviation across the four categories: reply the line "Four deviation categories: none found." (四类偏差均未发现);\n` +
        `- DEVIATIONS — one row per deviation, every row fieldized: | category | file:line | design reference | severity | evidence |;\n` +
        `- PROBLEM — the audit itself could not run / inconclusive: state what blocked it.\n`
    }
    // The child's own task input rides the child object: an eng-coder's audit
    // spawns reuse it as the task-book SOURCE — injected as the D-TS5 A2
    // mechanical summary, not verbatim (see above).
    if (role === "eng-coder") child._engTaskInput = input

    // Relay content/reasoning/tool/output to the parent TUI via the unified spawn-child
    // pipeline (AGENT-LOOP.md §7.2 D3). Prefix includes a unique id: parallel child agents
    // with the same role stay independent and don't overwrite each other.
    // Format: role#id/  →  onToken("coder#2/writing..."), onToolCall("coder#2/read", args)
    // Async id allocation (AGENT-LOOP.md §15 D-A1): reserve the relay counter at
    // spawn time — the returned id must be stable while the item sits in the queue.
    // The [model] token (TUI block creation) is DEFERRED to actual start so queued
    // children don't paint an empty panel block ("queued 态不显示").
    let relayPrefix
    if (wantAsync) {
      parent._subAgentCounter = (parent._subAgentCounter ?? 0) + 1
      relayPrefix = `${role}#${parent._subAgentCounter}/`
    } else {
      relayPrefix = makeRelay(parent, role ?? "sub", ctx.callbacks?.onToken, childProvider.model ?? "")
    }
    // LOGGING（LOGGING.md）：子代理内部事件（子内 llm:*/tool:*）以 childId 归属——
    // agent._logId 随 runAgent 的 logCtx 透出（主文件单文件全记、按 childId grep）。
    child._logId = relayPrefix.slice(0, -1)
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
    // consumed via action:'check' or the turn-end auto-wait. Slot queue: running
    // count < ASYNC_SUBAGENT_LIMIT → start now; ≥ limit → enqueue (status "queued",
    // position = queue index) — never rejected, never requiring the model to batch.
    if (wantAsync) {
      if ((ctx.depth ?? 0) > 0) {
        throw new Error("async spawn only available at the top level")
      }
      parent._asyncSubagents ??= new Map()
      parent._asyncQueue ??= []
      const running = [...parent._asyncSubagents.values()].filter((e) => e.status === "running").length
      const id = parent._subAgentCounter
      const entry = {
        id, role, relayPrefix,
        status: "queued", // 下面按等待态/槽位重定（避免两处判断漂移）
        position: undefined,
        report: null, error: null, done: false, cancelled: false,
        promise: null, _settle: null, _settleSeq: 0,
        // §19.5 D-M5 可决策字段（status 数据装配锚点）：model 在 spawn 时记录；
        // startedAt 在 ACTUAL start（queued 等待不计 elapsed）；turn/maxTurns 由
        // 下方 onToken 拦截层从子代理 ⟦ev⟧turn 事件镜像（T-M18 正确性断言）。
        model: childProvider?.model ?? null,
        startedAt: null,
        turn: 0, maxTurns: 0,
        // §19.5 D-M6 (round2 #2)：条目级 AbortController——cancel 定向 abort 本
        // 条目（runAgent signal 链）；Ctrl+C 全停语义不变（基信号 abort 逐链传播）。
        controller: null,
        // §20 D-SD2 域元数据（AGENT-LOOP.md §20）：running ∪ queued 条目全带——
        // _files（归一化绝对路径）/ _dependsOn（字符串 id）——冲突检测与补位判据
        // 的事实源；无调度参数 spawn 两字段皆空（legacy——不参与冲突检测——零改动）。
        _files: files,
        _dependsOn: dependsOn,
        _lastQueuedSig: null, // ⟦ev⟧queued 去重 sig（refreshQueuedTokens）
      }
      // §20 D-SD3 准入落点：等待态（依赖未满足/域冲突/depc）→ queued（waiting-deps——
      // 不占槽不启动——即使槽空）；纯槽满（kind slot）→ queued（等位）；否则立即启动。
      // 派生实时计算（describeBlockers——池状态在 spawn 同步段内不变——与前面准入一致）。
      const blockers = describeBlockers(parent, entry)
      if (blockers.kind === "slot") {
        entry.status = running >= ASYNC_SUBAGENT_LIMIT ? "queued" : "running"
      } else {
        entry.status = "queued" // waiting-deps / dependency-cancelled——slot 空也不启动
      }
      // The settle signal — resolves when the run chain settles (never rejects).
      entry.promise = new Promise((res) => { entry._settle = res })
      // §19.5 D-M6：条目 controller 链到会话/回合基信号（_sessionSignal 优先——
      // §17 挂起会话内 children 持会话 signal，digest 自身 Ctrl+C 不误伤）。
      const ctrl = new AbortController()
      entry.controller = ctrl
      const baseSignal = parent._sessionSignal ?? ctx.signal ?? null
      if (baseSignal) {
        if (baseSignal.aborted) ctrl.abort()
        else baseSignal.addEventListener("abort", () => ctrl.abort(), { once: true })
      }
      // §19.5 D-M5：turn 镜像拦截层（callbacks 包装层——选改动最小方案：在既有
      // wrapChildCallbacks 之外再包一层，只解析 ⟦ev⟧turn 更新条目，其余原样转发）。
      const trackOpts = { ...childOpts }
      const parentOnToken = trackOpts.onToken
      if (parentOnToken) {
        trackOpts.onToken = (t) => {
          const ev = String(t).match(/^⟦ev⟧turn\x1e(\d+)\x1e(\d+)\x1e/)
          if (ev) {
            entry.turn = Number(ev[1]) || 0
            entry.maxTurns = Number(ev[2]) || 0
          }
          return parentOnToken(t)
        }
      }
      entry.start = () => {
        entry.status = "running"
        entry.position = undefined
        entry.startedAt = Date.now()
        // §19.5.6 D-SF1（round3 #1）：绑定子代理对象引用——绑定时刻 = 实际启动时
        // （queued 条目 spawn-ack 时刻尚无子代理对象——§20 D-SD3b）；绑定对象 = 子代理
        // 对象（不是 _touchedFiles 数组引用——per-run 记账在 prepareRun 重置——数组
        // 引用会陈旧——对象引用保证 status 查询时实时读——杀前一刻最新）。
        entry.childAgent = child
        // §19.5 D-M7b ①: async 标记事件——零字段 ⟦ev⟧async token（sync 不发）。
        // 锚点 = 实际启动（与 [model] 同步——queued 入队不 paint，补位启动才发）；
        // 先于 [model] 发出——区块创建即知 sub.async（routeSubToken 解析——
        // ⏹ 门控与头标 async 的判定源）。父级直接 emit（depth-0 专属路径——
        // 不经子代理文本 strip 白名单——与 ⟦ev⟧stopped/settled 同族）。
        ctx.callbacks?.onToken?.(relayPrefix + "⟦ev⟧async\x1e")
        // Deferred [model] emit: the TUI block is created at ACTUAL start.
        ctx.callbacks?.onToken?.(relayPrefix + "[model]" + (childProvider.model ?? ""))
        // Turn-cap on background children NEVER pops the continue panel (D-A3):
        // §15 D-A3 exception (2026-09-02 unified rule, AGENT-LOOP.md §2): in an
        // engineering && AUTO session the child auto-resumes — the user authorized
        // unattended runs, no one is at the panel. Every other tier auto-declines
        // and the partial-work report carries the cap reason. §18 D-E2 relies on
        // this exception as the turn-cap fallback for the default-async eng-coder
        // delivery (the internal protocol does not raise the 100-turn cap).
        runChildPipeline(child, input, trackOpts, { ...childRunOpts, signal: entry.controller.signal }, {
          parent, role, args,
          askContinue: () => Promise.resolve(Boolean(parent.config?.agent?.engineering && parent.autoApprove)),
        })
          .then((report) => { entry.report = report })
          .catch((err) => { entry.error = err?.message ?? String(err) })
          .finally(() => {
            entry.status = "done" // running 数口径（D-A1/D-A2/T6）：已完成未消费不计入
            entry.done = true
            // LOGGING（LOGGING.md）：settle 分流事件——child:done/child:error（结果）+
            // ev:cancelled/ev:settled（settle 回调分流——取消/挂起移交；正常回合内 settle
            // 由 child:done 覆盖不另发 ev——ev:stopped 见中止清池点）
            const childLogId = `${entry.role}#${entry.id}`
            const childMs = entry.startedAt ? Date.now() - entry.startedAt : 0
            // 中止守卫（2026-09-03 code review #5）：Ctrl+C/会话中止时子代理以 error 形态
            // settle——不落 child:error/done/ev:settled（ev:stopped 已在中止清池点表达；
            // 同文件阻塞路径同款抑制——"用户停——不落错误事件"）。定向 cancel 走 ev:cancelled。
            const parentAborted = ctx.signal?.aborted || entry.controller?.signal?.aborted
            if (entry.cancelled) {
              logEvent("ev:cancelled", { id: childLogId })
            } else if (!parentAborted) {
              if (entry.error != null) logEvent("child:error", { role: entry.role, id: childLogId, ms: childMs, err: errText(entry.error, 200) })
              else logEvent("child:done", { role: entry.role, id: childLogId, ms: childMs, kind: String(entry.report ?? "").includes(TURN_CAP_MARK) ? "partial" : "ok" })
              if (parent._suspended) logEvent("ev:settled", { id: childLogId, kind: "suspended" })
            }
            // §19.5 cancelled settle 分支（D-M6 round1 #1 + round2 #3）：cancel 定向
            // 中止的条目——不入 _pendingAsyncResults、不参与 collectSettledAsync 直注入
            // （清池规则同 Ctrl+C 全停但只清该条目——陈旧错误零注入）；发 ⟦ev⟧stopped
            // 冻结事件（TUI 区块 interrupted 语义冻结——标题 "stopped"）；取消事实与半成品
            // 警示对模型可见（user-role 提醒——形态仿 injectAsyncResult、XML 转义——防基于
            // 半成品树继续：mergeChildMutations 不覆盖 abort 路径）。
            // §20 D-SD5：running 依赖取消的 settle 终态点——写终态墓碑（running 取消无
            // 出队事件——出池在 settle）；queued 依赖者随之标注 dependency cancelled
            // （refreshQueuedTokens——settle 后统一段）；提醒文本列出依赖者（供模型决策）。
            if (entry.cancelled) {
              parent._asyncSubagents?.delete(String(entry.id))
              const tombstones = (parent._asyncTombstones ??= new Map())
              tombstones.set(String(entry.id), { status: "cancelled", role: entry.role })
              ctx.callbacks?.onToken?.(`${entry.relayPrefix}⟦ev⟧stopped\x1e0\x1e0\x1estopped\x1e`)
              const dependents = dependentLabels(parent, String(entry.id))
              const autoNote = parent.autoApprove
                ? " — AUTO session: they auto-start on slot availability (round2 #3)"
                : " — they stay queued until you cancel them or an AUTO session starts them"
              pushReal(parent, {
                role: "user",
                content: `[System reminder: subagent ${escapeXml(entry.role)}#${entry.id} cancelled by user — partial changes not merged/audited${dependents.length > 0 ? `; queued dependents ${dependents.join(", ")} marked "dependency cancelled"${autoNote}` : ""}]`,
              })
            } else if (!ctx.signal?.aborted) {
              // 完成信号按会话态分流（§17 D-S8 冻结门控 + D-S3 记账——以读取时刻为准，确定性）：
              // - 非挂起态（普通回合内 settle）：照发 ⟦ev⟧done —— TUI 立即冻结区块，冻结位置 =
              //   完成时刻的流位置（§15 D-A3 2026-09-02 用户实证修正：收尾统一发会把块堆在结论之后）。
              //   §17.5 supersede：回合尾 collectSettledAsync（suspDriven）不再直注入——条目留池
              //   由挂起会话首轮 sweep → digest 消化（17.5.2 方案 B——块已冻结不受影响）。
              // - 挂起态（_suspended：回合已结束或 auto-turn 消化中）：冻结延迟——改发 ⟦ev⟧settled
              //   （区块显示 "done · awaiting digestion" 驻留面板），条目移交 _pendingAsyncResults
              //   由下个回合 prepareRun 前注入（D-S3 ②；注入即从池/pending 移除，无重复）；
              //   §17.5.5：注入完成后 freezeReclaimDigestedBlocks 逐条回收冻结（不等池空）。
              // 父会话 abort 两种都不发：TUI 已按 interrupted 冻结，晚到 token 经 tombstone 丢弃。
              if (parent._suspended) {
                parent._pendingAsyncResults ??= []
                parent._pendingAsyncResults.push(entry)
                parent._asyncSubagents?.delete(String(entry.id))
                ctx.callbacks?.onToken?.(`${entry.relayPrefix}⟦ev⟧settled\x1e0\x1e0\x1esettled\x1e`)
              } else {
                ctx.callbacks?.onToken?.(`${entry.relayPrefix}⟦ev⟧done\x1e0\x1e0\x1edone\x1e`)
              }
            }
            entry._settleSeq = (parent._asyncSettleSeq = (parent._asyncSettleSeq ?? 0) + 1)
            entry._settle()
            for (const w of parent._asyncWaiters?.splice(0) ?? []) { try { w() } catch { /* noop */ } }
            // §20 D-SD4 释放点：settle 腾槽 + 依赖终态转移 → 补位（依赖满足者/域冲突
            // 解除者自动启动——槽 ≤4）→ 排队态面板刷新（等待块头标注随终态更新——
            // dependency cancelled / 位置前移）。
            maybeRefillAsync(parent)
            refreshQueuedTokens(parent, ctx.callbacks?.onToken)
          })
      }
      parent._asyncSubagents.set(String(id), entry)
      // LOGGING（LOGGING.md）：child:spawn（async——注册即事件；status 记 queued/running 分流；
      // 实际启动由补位 start() 触发——运行中由子内 llm/tool 事件可见）
      logEvent("child:spawn", { role, id: `${role}#${id}`, kind: "async", status: entry.status, ms: 0 })
      if (entry.status === "queued") {
        parent._asyncQueue.push(entry)
        entry.position = parent._asyncQueue.length
        // §20 D-SD3b：排队 spawn 返回即建面板 waiting 块（⟦ev⟧queued 事件——spawn 侧
        // 发——TUI routeSubToken 消费建块/更新头；启动后 ⟦ev⟧async 转 running——同 key
        // 不重建）。refreshQueuedTokens 同时校正既有排队条目的位置/等待态头。
        refreshQueuedTokens(parent, ctx.callbacks?.onToken)
        const blk = describeBlockers(parent, entry)
        const out = { id: String(id), role, status: "queued", position: entry.position }
        if (blk.kind !== "slot") {
          out.waiting = blk.kind === "depc" ? "dependency-cancelled" : "waiting-deps"
          out.reason = blk.detail
        }
        return JSON.stringify(out)
      }
      entry.start()
      return JSON.stringify({ id: String(id), role, status: "running" })
    }

    // ── Blocking path (unchanged semantics): await the full pipeline ──
    // LOGGING（LOGGING.md）：child:*（阻塞 spawn——runChildPipeline 前后；declined
    // partial 由 TURN_CAP_MARK 检出；错误原样上抛（dispatch 转 tool:error））
    const blockT0 = Date.now()
    logEvent("child:spawn", { role, id: child._logId, kind: "blocking" })
    try {
      const pipelineReport = await runChildPipeline(child, input, childOpts, childRunOpts, {
        parent, role, args,
        askContinue: askSubagentContinue,
      })
      logEvent("child:done", { role, id: child._logId, ms: Date.now() - blockT0, kind: String(pipelineReport).includes(TURN_CAP_MARK) ? "partial" : "ok" })
      // §7.2.3 sync spawn 完成精确冻结（方案 e）：execute 返回前 ctx 留子代理 key
      // （relayPrefix 去尾 = `role#N`）——dispatch runOne 读它作 onToolResult 第 4 参 →
      // TUI finishSubTaskKey 按 key 精确冻（async eng-coder 先启动时不再误冻其块——
      // T-F2）。仅成功路径设置：async 分支不设（round2 #2——ack 带 status:running 由
      // isAsyncSpawnResult 跳过冻结）；错误/拒绝路径到此之前已 throw/return——ctx 未设
      // ——错误路径不触发冻结（round1 #1——T-F5）。
      ctx._subagentKey = relayPrefix.slice(0, -1)
      return pipelineReport
    } catch (e) {
      if (ctx.signal?.aborted || e?.name === "AbortError") throw e // 用户停——不落错误事件
      logEvent("child:error", { role, id: child._logId, ms: Date.now() - blockT0, err: errText(e, 200) })
      throw e
    }
  },
}

// Re-export shim (2026-09-03 拆分轮 + §19 合体轮): 机械与合体动作执行器迁至
// ./subagent-async.mjs——保留本文件导出面，消费点（agent.mjs / agent-turn.mjs /
// consult.mjs / 测试）导入路径零改动。execute 仍直接使用 ASYNC_SUBAGENT_LIMIT /
// maybeRefillAsync / buildChildRunOpts / runChildPipeline（文件头部 import）。
export {
  ASYNC_SUBAGENT_LIMIT,
  MAX_ASYNC_CHECKS,
  resolveChildProvider,
  maybeRefillAsync,
  injectAsyncResult,
  buildChildRunOpts,
  mergeChildMutations,
} from "./subagent-async.mjs"
