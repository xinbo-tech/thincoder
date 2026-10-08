/**
 * agent/dispatch.mjs — two-phase tool call execution
 * 2026-09-28 拆分（Module Split Policy——498/499 贴 500 硬限跨档）：门面谓词 ∕ 记账外提
 * `./dispatch-gates.mjs`（四谓词 + logToolError + noteExecutedMutation）、单条执行体外提
 * `./dispatch-run.mjs`（runPreparedItem——原 runOne 闭包，verbatim + 形参代入）；
 * `executeToolCalls` 签名与对外缝零改（本档导出面零变）。
 */
import { FILE_MUTATORS, toolTouchPaths } from "./helpers.mjs"
import { runHooks } from "../hooks.mjs"
import { isCodePath, declarationForTarget } from "../conventions.mjs"
import { manifestFilePath } from "../manifest.mjs"
import { resolve, relative } from "node:path"
import { anyLiveDesignSlot } from "../token-ttl.mjs"
// M4 写权门禁（模块设计 §2.1#2）：冻结窗口判据组装（被审文件集 = 声明文档集 + 批次档
// 的合流点）落 write-gate.mjs 单一权威源——本档只 import 消费（KD-M4-4 拆分点）。
import { freezeWindowConflict, batchRecordWriteConflict } from "./write-gate.mjs"
// 门面谓词 ∕ 记账（2026-09-28 拆分外提——见头注）：动作级四谓词 + logToolError 住 ./dispatch-gates.mjs。
import {
  logToolError, isSubagentConsumeDesignAction, isSubagentEscalateAction,
  readonlyActionOf, controlActionOf, // E1（§2.5）：工具面动作谓词钩子优先 ∕ 核名面谓词回落
} from "./dispatch-gates.mjs"
// 单条执行体（2026-09-28 拆分外提——见头注）：runPreparedItem（原 runOne 闭包；本档两处调用点改指）。
import { runPreparedItem } from "./dispatch-run.mjs"
// B7 3a：作用域规则 JIT 注入（核单源——`../rules.mjs`；相位一末打点见下方缝注释）。
import { injectScopedRules } from "../rules.mjs"

/**
 * Two-phase execution:
 * Phase 1 (serial): parse args one by one + planMode check + permission confirmation (side-effecting tools)
 * Phase 2 (order-preserving): strictly preserve model call order — consecutive readonly/parallel tools run as concurrent batches,
 * side-effecting tools run serially in their original position (if a batch writes-then-reads the same file, the read must see the post-write content).
 * Returns a results array in call order (each entry has an ok flag indicating success/failure).
 */
export async function executeToolCalls(agent, toolByName, toolCalls, callbacks, depth = 0, signal) {
  // ---- Phase 1: serial preparation ----
  // Pre-gates run per tool (parse/planMode/engineering gates); non-readonly tools
  // that REACH the permission stage are collected into one batch — a single merged
  // ask covers the whole toolCalls array (D-B1, "approve all / one by one /
  // deny"). Tools stopped by a pre-gate never join the batch (review #7).
  const prepared = []
  const permPending = [] // { toolCall, tool, args } — reached the permission stage
  for (const toolCall of toolCalls) {
    const tool = toolByName.get(toolCall.name)
    let args
    try {
      args = JSON.parse(toolCall.arguments || "{}")
    } catch {
      logToolError(toolCall.name, { arguments: toolCall.arguments }, new Error("Invalid JSON arguments"))
      prepared.push({ toolCall, tool: null, error: `Invalid tool arguments JSON: ${toolCall.arguments}` })
      continue
    }

    if (!tool) {
      logToolError(toolCall.name, {}, new Error(`Unknown tool: ${toolCall.name}`))
      prepared.push({ toolCall, tool: null, error: `Unknown tool: ${toolCall.name}` })
      continue
    }

    if (agent.planMode && !tool.readonly && !readonlyActionOf(tool, toolCall.name, args) && !controlActionOf(tool, toolCall.name, args)) {
      prepared.push({ toolCall, tool, denied: true, reason: "plan mode" })
      continue
    }

    // Engineering coder hard gate: no file modification before the design review passed.
    // The design review is the eng-coder's mandatory pre-coding gate — advisor(type="design")
    // must run (and be accepted) before the first write/edit/apply_patch/hashline_edit/insert_after/delete.
    if (agent._role === "eng-coder" && agent.config?.agent?.engineering
        && !agent._engDesignReviewed && FILE_MUTATORS.has(toolCall.name)) {
      prepared.push({
        toolCall, tool, denied: true,
        reason: "engineering design gate",
        hint: "Call advisor with type='design' to review the design document before any file modification. If the review found issues, report them to the parent agent.",
      })
      continue
    }

    // Engineering mode PARENT gate: the parent agent must not touch code files
    // before the design review passed. Signaled by a live design slot (design-review
    // approval — persists in the session slot, survives across turns; _engDesignReviewed
    // is eng-coder-only and reset per run). Exemptions = the non-code classes of
    // thincoder-core/conventions.mjs (documentation and temp scratch files) — writing a design
    // document IS the design step. Anything inside a declared code segment (default:
    // src — incl. src/prompts/*.md) is product code, not documentation, and needs a
    // design token. The project can declare its own code paths (the manifest's
    // `codePaths`) so a non-src layout is not silently exempted. Mechanically
    // blocks "talk then code".
    // F11（#1104 · PORTABILITY §3.9 / D20）：辖域 = 目标所属项目——逐目标沿祖先链取最近带档
    // 目录（`declarationForTarget`——nearest wins ∥ 纯向上 ∥ 发现梯不参与）；出辖（祖先链无档）
    // ⇒ 放行（门只管 manifest 树以内的内容）。相对形先按会话 cwd 解析（cwd 只是相对基，非声明源）；
    // 在辖目标按所属项目装载声明，项目内判定（code 段 ∥ 兜底 fail-closed ∥ doc·temp·aux·state 豁免）零改。
    // DESIGN-TOKEN-SETTLEMENT D3（2026-09-08）：资格判据 = 权威槽"任一活槽存在"
    // （anyLiveDesignSlot——查内存 Map，miss 回读槽文件——单值镜像 `_engDesignToken`
    // 已退役，门禁不再读镜像——AC4）。
    if (agent.config?.agent?.engineering && depth === 0
        && !anyLiveDesignSlot(agent)
        && FILE_MUTATORS.has(toolCall.name)) {
      const paths = toolTouchPaths(tool, args)
      // Unknown/missing paths (non-string / empty — nothing to judge) block conservatively.
      // Known paths are judged per target: resolve against the session cwd first, then
      // classify on the ABSOLUTE form against the target's OWNING PROJECT declaration
      // (the segment face anchors at that project's root — D17). Out of jurisdiction ⇒ the
      // target passes; non-string / empty targets keep blocking above (nothing to judge).
      let blocked = false
      let noteConv = null // first undeclared-and-blocked target's project (hint pointer — #1102)
      for (const p of paths) {
        if (typeof p !== "string" || p.trim() === "") { blocked = true; continue }
        const abs = resolve(agent.cwd, p)
        const conv = declarationForTarget(abs)
        if (!conv || !isCodePath(abs, conv)) continue
        blocked = true
        if (!noteConv && !conv.declared) noteConv = conv
      }
      if (blocked) {
        // Undeclared project → point at ITS declaration file (§4.3 降级可见契约; #1102).
        const convNote = noteConv
          ? ` — this path was classified as product code by the default conventions (code paths: ${noteConv.codePaths.join(", ")}); declare project conventions in ${manifestFilePath(noteConv.root)} to adjust.`
          : ""
        prepared.push({
          toolCall, tool, denied: true,
          reason: "engineering design gate",
          hint: `Engineering mode: write the design document first（location per your project's document conventions）, then call advisor with type='design' to review it, and wait for user approval. Implementation is done by eng-coder subagents.${convNote}`,
        })
        continue
      }
    }

    // E（第 11 批·F17/ADVISOR-GUARDS.md §5 E-3d）：D5 冻结窗口写前拦截——设计评审在途（点火 → 结算）期间，
    // 父侧对被审文件集（声明文档集 + 批次档）的写入会被拒绝：在途写使本轮结算 stale——pass 轮
    // = token 直接丢失（实证：第 10 批 id=20 整轮作废）。工具面 = FILE_MUTATORS ∪ `file_ops`
    // （E2——冻结腿覆盖面；批次档腿仍 = FILE_MUTATORS：与变更记账同集——不记入日志的写面既不判 stale 也不拦）；判据与 reviewIsStale 同源、单一权威源 =
    // agent/write-gate.mjs 的 freezeWindowConflict（声明文档集腿 = inflightDesignReviewConflict
    // 同 docAbs / 同 normAbs；批次档腿 = run.batchDoc——M4 合流点，仅扫 running 未取消的设计条目）。
    // 位置：只读 / autoApprove 短路之前——审批不得绕过冻结；拒绝 = 可见 denied + 逃生门
    // （先 cancel → 改 → 重发）。
    if (FILE_MUTATORS.has(toolCall.name) || toolCall.name === "file_ops") {
      // #327：单源谓词（同集合内两处消费共用）；#309 批次档写门与 D5 冻结窗同区、共用同一路径集。
      // E2（parity-b1 §2.5——缺省取核形）：外门扩 `file_ops`（冻结窗覆盖面与端壳对齐——`file_ops`
      // 的 move ∕ copy ∕ rename 亦为写面）；**批次档写门判据集不变**（= `FILE_MUTATORS`，file_ops 不入）。
      const absPaths = toolTouchPaths(tool, args)
        .filter((p) => typeof p === "string" && p)
        .map((p) => resolve(agent.cwd, p))
      if (FILE_MUTATORS.has(toolCall.name)) {
        const crossBatch = batchRecordWriteConflict(agent, depth, absPaths)
        if (crossBatch) {
          prepared.push({ toolCall, tool, denied: true, reason: "cross-batch record write", hint: crossBatch.message })
          continue
        }
      }
      const conflict = freezeWindowConflict(agent, absPaths)
      if (conflict) {
        prepared.push({
          toolCall, tool, denied: true,
          reason: "d5 freeze window",
          hint: `write refused — design review #${conflict.id} is in flight over ${relative(agent.cwd, conflict.path)} (D5 freeze window). A write now would settle it stale — no token for a pass (the round is lost). Wait for the report, or cancel the review first (subagent action:'cancel' id:'${conflict.id}') and re-launch after the change.`,
        })
        continue
      }
    }

    // Readonly tools (and autoApprove — the short-circuit, unchanged for the
    // whole batch too) skip the permission stage entirely.
    // AGENT-LOOP-SUBAGENT.md §6.7.6 D-E3 task-domain authorization (spawn-time): an eng-coder child's
    // tools skip the permission ASK stage exactly like autoApprove — granted by
    // the parent spawn (approved design + task = authorization; subagent.mjs
    // sets _engTaskAuthorized on the child). Everything EARLIER in Phase 1
    // (JSON parse / unknown tool / planMode / design-token gates) ran unchanged
    // — the exemption never widens what reaches this stage (round4 #3, T-E14).
    // PreToolUse hooks still run below. Non-eng-coder children keep the manual
    // parent ask (human in the loop).
    if (tool.readonly || readonlyActionOf(tool, toolCall.name, args) || controlActionOf(tool, toolCall.name, args) || isSubagentConsumeDesignAction(toolCall.name, args) || agent.autoApprove || agent._engTaskAuthorized) {
      if (!(await runHooks("PreToolUse", { agent, toolName: toolCall.name, toolArgs: args }))) {
        prepared.push({ toolCall, tool, denied: true, reason: "blocked by PreToolUse hook" })
        continue
      }
      // Panel area abolished — all tools now stream inline via onToolOutput.
      callbacks.onToolCall?.(toolCall.name, args, toolCall.id)
      prepared.push({ toolCall, tool, args })
      continue
    }
    permPending.push({ toolCall, tool, args })
  }

  // ---- Permission stage: one merged ask for the whole batch (D-B1) ----
  // >1 non-readonly tools in the same toolCalls array → a single
  // onBatchPermissionRequest({ tools, count }) ask; verdicts:
  //   "approveAll" → batch-scope allowance (autoApprove style, NOT persistent)
  //   "deny"       → the whole batch is rejected, no second ask
  //   "oneByOne" (or anything else / no handler) → the existing per-item
  //     onPermissionRequest channel, signature unchanged (NF-B1: ACP bridge /
  //     headless / old versions without the new callback are never harmed).
  if (permPending.length > 0) {
    let batchAllowed = null // true = approveAll, false = deny, null = per-item fallback
    if (permPending.length > 1 && callbacks.onBatchPermissionRequest) {
      const verdict = await callbacks.onBatchPermissionRequest({
        tools: permPending.map((p) => ({ name: p.toolCall.name, args: p.args })),
        count: permPending.length,
      })
      if (verdict === "approveAll") batchAllowed = true
      else if (verdict === "deny") batchAllowed = false
      // anything else (oneByOne/unknown) → fall through to the per-item channel
    }
    for (const p of permPending) {
      let allowed
      if (batchAllowed === true) allowed = true
      else if (batchAllowed === false) allowed = false
      else if (callbacks.onPermissionRequest) {
        allowed = await (async () => {
          // D2 (AGENT-LOOP-SUBAGENT.md §6.7.2): announce the wait BEFORE prompting — the TUI
          // subagent block header flips to "等待审批" so a waiting child is visibly
          // different from a stalled one. Depth>0 only (the parent TUI shows its own
          // permission panel). turn n/max = the child's live turn counters.
          if (depth > 0) {
            callbacks.onToken?.(`⟦ev⟧approval\x1e${agent._currentTurn ?? 0}\x1e${agent._maxTurns ?? 0}\x1eapproval\x1e${String(p.toolCall.name).slice(0, 40)}`)
          }
          return await callbacks.onPermissionRequest(p.toolCall.name, p.args)
        })()
      } else allowed = false
      if (!allowed) {
        prepared.push({
          toolCall: p.toolCall, tool: p.tool, denied: true,
          reason: (callbacks.onPermissionRequest || batchAllowed === false) ? "denied by user" : "no permission handler",
        })
        continue
      }

      // PreToolUse hooks: allow user scripts to gate tool execution
      if (!(await runHooks("PreToolUse", { agent, toolName: p.toolCall.name, toolArgs: p.args }))) {
        prepared.push({ toolCall: p.toolCall, tool: p.tool, denied: true, reason: "blocked by PreToolUse hook" })
        continue
      }

      // Panel area abolished — all tools now stream inline via onToolOutput.
      callbacks.onToolCall?.(p.toolCall.name, p.args, p.toolCall.id)
      prepared.push({ toolCall: p.toolCall, tool: p.tool, args: p.args })
    }
  }

  // ---- B7 3a JIT 缝（相位一末 ∕ 相位二前——原 VSC「派发前」语义；`depth === 0` 门）--------
  // 作用域规则注入：打点 = `prepared` 非拒项 `{tool, args}`（即将执行集）；注入源 = 本 run 尾块
  // 读点缓存 `agent._rules.scoped`（核 `prepareRun` 同点写入），去重域 = 会话。子代不注入。
  if (depth === 0) {
    injectScopedRules(agent, agent.history, prepared.filter((p) => p.tool && p.args).map(({ tool, args }) => ({ tool, args })))
  }

  // ---- Phase 2: order-preserving execution ----

  const results = []
  let batch = []
  const flush = async () => {
    if (batch.length === 0) return
    results.push(...await Promise.all(batch.map((item) => runPreparedItem(item, agent, depth, signal, callbacks))))
    batch = []
  }
  for (const item of prepared) {
    // escalate action keeps the retired escalate tool's serial placement (no
    // parallel flag): it flushes the batch and runs alone in call order (AGENT-LOOP-SUBAGENT.md §6.7 —
    // spawn stays parallel; status classifies as readonly and batch freely).
    if (item.tool && !item.tool.readonly
        && (!item.tool.parallel || isSubagentEscalateAction(item.tool.name, item.args))) {
      await flush()
      results.push(await runPreparedItem(item, agent, depth, signal, callbacks))
    } else {
      batch.push(item)
    }
  }
  await flush()
  return results
}