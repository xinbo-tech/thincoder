/**
 * execute-tools.mjs — tool batch execution (split out of agent.mjs for the 500-line limit).
 * Groups tool calls into parallel batches (readonly / subagent), runs them with guards
 * (plan mode, engineering design gates, permission), commits results to both history lines,
 * and tracks mutations / advisor-verify bookkeeping / stall detection.
 */
import { readFileSync, existsSync } from "node:fs"
import { join } from "node:path"
import {
  FILE_MUTATORS, STALL_WINDOW, STALL_THRESHOLD, MAX_PARALLEL_SUBAGENTS,
  offloadToolResult, pushReal, runWithLimit,
} from "./run-helpers.mjs"
import { isDocFile } from "../advisor/repos.mjs"
import { logEvent, errText, headText } from "../log.mjs"

/**
 * 前置门禁（planMode / 工程设计闸）——单点判定，批扫描与逐项执行共用（§16 D-B1：
 * 被前置门禁拦下的工具不计入批询问）。返回 { blocked, content }。
 */
function preGateBlocked(agent, { tool, toolName, args, depth }) {
  // Plan mode guard — §19 round2 #2 (AGENT-LOOP.md): readonly classification is
  // ACTION-LEVEL. A tool may declare action-level readonly-ness (isReadonlyAction —
  // e.g. subagent action:'check'/'status'): those pass plan mode like readonly tools,
  // while the same tool's side-effecting actions (subagent spawn/escalate) stay denied.
  // §19.5 D-M6 round2 #4: control actions (isControlAction — subagent action:'cancel')
  // are a separate exemption class: 只停不启（无新副作用）——planMode 放行（取消既有
  // 子代理——spawn 仍拒）、免权限审批、批审批分组不入组、手动档 digest 放行。
  if (agent._planMode && tool && !tool.readonly && !(tool.isReadonlyAction?.(args) ?? false) && !(tool.isControlAction?.(args) ?? false)) {
    return { blocked: true, content: "Error: plan mode active" }
  }
  // Engineering coder hard gate: no file modification before the design review passed (CLI dispatch.mjs parity).
  // §18 D-E3 granularity: this design-token gate runs BEFORE the permission stage — an
  // eng-coder child's spawn-time authorization (engDesignReviewed, subagent.mjs) exempts
  // ONLY the onPermissionRequest ask; it never widens what reaches that stage (T-E14).
  if (agent._role === "eng-coder" && agent.config?.agent?.engineering
      && !agent._engDesignReviewed && FILE_MUTATORS.has(toolName)) {
    return { blocked: true, content: "Error: engineering design gate — call advisor with type='design' to review the design document before any file modification. If the review found issues, report them to the parent agent." }
  }
  // Engineering mode PARENT gate: no code-file writes before the design review passed.
  // Docs/** and root-level docs are exempt (writing them IS the design step); everything
  // under src/ (incl. src/prompts/*.md) is product code and needs a design token.
  if (agent.config?.agent?.engineering && depth === 0 && !agent._engDesignToken
      && FILE_MUTATORS.has(toolName)) {
    const paths = tool.touchedPaths ? tool.touchedPaths(args) : [args.path]
    // Unknown/missing paths are treated as code — block conservatively.
    const touchesCode = paths.some((p) => typeof p !== "string" || /^src[\\/]/.test(p) || !isDocFile(p))
    if (touchesCode) {
      return { blocked: true, content: "Error: engineering design gate — write the design document in docs/ first, then call advisor with type='design' to review it, and wait for user approval. Implementation is done by eng-coder subagents." }
    }
  }
  return { blocked: false }
}

/**
 * §16 D-B1 同批权限合并询问：扫描同一 response.toolCalls 中所有通过前置门禁、到达权限
 * 询问阶段的非只读工具（深度 0 + 手动模式 + 有 onPermissionRequired），≥2 个时一次询问
 * （onBatchPermissionRequest）→ "approveAll"（本批放行）/ "oneByOne"（回退逐项）/
 * "deny"（全批拒绝、无二次询问）。无 handler 或不足 2 个 → 返回 null（逐项通道原样）。
 * autoApprove 短路不变（getAuto 实时读取——扫描时已开则不聚合）。
 */
async function collectBatchPermission(agent, { response, toolByName, getAuto, callbacks, depth }) {
  if (getAuto() || depth !== 0 || !callbacks.onPermissionRequired || !callbacks.onBatchPermissionRequest) return null
  const list = []
  for (const tc of response.toolCalls) {
    const tool = toolByName.get(tc.name)
    let args
    try { args = JSON.parse(tc.arguments || "{}") } catch { continue } // JSON 解析失败已被逐项路径拦下
    const pre = preGateBlocked(agent, { tool, toolName: tc.name, args, depth })
    if (pre.blocked) continue // 前置门禁拦下的不计入批询问（评审 #7）
    const actionReadonly = tool?.isReadonlyAction?.(args) ?? false
    // §19.5 D-M6 round2 #4: cancel 类控制动作不入批审批组（免询问——只停不启）
    const controlAction = tool?.isControlAction?.(args) ?? false
    if (!tool || tool.readonly || actionReadonly || controlAction) continue
    list.push({ id: tc.id, name: tc.name, args })
  }
  if (list.length < 2) return null
  const choice = await callbacks.onBatchPermissionRequest({
    tools: list.map(({ name, args }) => ({ name, args })),
    count: list.length,
  })
  if (choice === "deny") return { denied: new Set(list.map((x) => x.id)), approved: null }
  if (choice === "approveAll") return { denied: null, approved: new Set(list.map((x) => x.id)) }
  return null // oneByOne / 其他 → 既有逐项通道
}

/**
 * Execute the tool calls of one assistant turn.
 * Batches: consecutive readonly tools run in parallel; consecutive subagent calls also run
 * in parallel (each has its own agent). sideEffectExempt tools (like subagent) don't block
 * readonly merging. Batch order is serial — results are committed in call order.
 */
export async function executeToolBatches(agent, { response, history, fullHistory, toolByName, getAuto, callbacks, signal, sessionSignal = null, cwd, recentSigs, depth }) {
  // §16 D-B1：同批（同一 toolCalls 数组）权限合并询问——执行前一次聚合，deny/approveAll
  // 以 tc.id 标记，逐项执行时套用；oneByOne/无 handler 走既有逐项通道。
  const batchPerm = await collectBatchPermission(agent, { response, toolByName, getAuto, callbacks, depth })
  // Group tool calls into batches — consecutive readonly tools run in parallel,
  // consecutive subagent calls also run in parallel (each has its own agent).
  // sideEffectExempt tools (like subagent) don't block readonly merging.
  // §19 round2 #2: action-level readonly classification joins the grouping — subagent
  // action:'check'/'status' calls merge into the readonly parallel batch like the
  // retired readonly subagent_check tool did; spawn/escalate keep the subagent path.
  const batches = []
  let pendingReadonly = []
  for (const tc of response.toolCalls) {
    const tool = toolByName.get(tc.name)
    let args
    try { args = JSON.parse(tc.arguments || "{}") } catch { args = {} } // grouping-only read — per-call parse errors are handled in runOne below
    const actionReadonly = tool?.isReadonlyAction?.(args) ?? false
    if (tool?.readonly || actionReadonly) {
      pendingReadonly.push({ tc, tool })
    } else {
      // Flush pending readonly batch before this mutation
      if (pendingReadonly.length > 0) { batches.push(pendingReadonly); pendingReadonly = [] }
      if (tool?.name === "subagent") {
        // Subagents run in parallel with each other
        const last = batches[batches.length - 1]
        if (last?.length > 0 && last[0]?.tool?.name === "subagent") {
          last.push({ tc, tool })
        } else {
          batches.push([{ tc, tool }])
        }
      } else {
        batches.push([{ tc, tool }])
      }
    }
  }
  if (pendingReadonly.length > 0) batches.push(pendingReadonly)

  // Execute batches in order (parallel within batch, serial between batches)
  for (const batch of batches) {
    const runOne = async ({ tc, tool }) => {
      // Stop already requested — don't even start the tool (tools that block
      // synchronously would otherwise delay the abort until they finish).
      if (signal?.aborted) throw new DOMException("Aborted", "AbortError")
      const toolName = tc.name
      let args
      try { args = JSON.parse(tc.arguments || "{}") } catch {
        return { tool_call_id: tc.id, toolName, content: "Error: invalid JSON", meta: null }
      }

      // 前置门禁（planMode / 工程设计闸）——与批扫描同一判定（单点）
      const pre = preGateBlocked(agent, { tool, toolName, args, depth })
      if (pre.blocked) {
        return { tool_call_id: tc.id, toolName, content: pre.content, meta: null }
      }

      // Permission gate: any non-readonly tool at depth 0 in manual mode. getAuto() is the
      // LIVE flag (CLI parity) — approve-all / the AUTO button can flip it mid-turn, so
      // re-read it per tool call instead of using the startup snapshot.
      // §18 D-E3: eng-coder children never reach this stage — their writes are authorized
      // at spawn time (approved design + task = authorization; runChild passes the child
      // autoApprove=true), so no per-write panel ever pops for them. The exemption is
      // stage-limited by construction: JSON parse, unknown-tool, planMode and design-token
      // gates all run earlier (preGateBlocked) and stay fully effective (T-E14). Non-eng-
      // coder children keep the pre-existing semantics unchanged.
      // Tools may declare action-level readonly-ness (e.g. git diff/status/log/show) —
      // those skip approval while write actions (git commit/push/rm) still prompt.
      // §19.5 D-M6 round2 #4: control actions (cancel) skip approval the same way —
      // 只停不启（无新副作用）——控制类豁免（无 permission handler 也不拒）。
      const actionReadonly = tool?.isReadonlyAction?.(args) ?? false
      const controlAction = tool?.isControlAction?.(args) ?? false
      if (!getAuto() && tool && !tool.readonly && !actionReadonly && !controlAction && depth === 0 && callbacks.onPermissionRequired) {
        // §16 D-B1 批确认结果套用：deny → 全批拒绝（无二次询问）；approveAll → 本批放行
        if (batchPerm?.denied?.has(tc.id)) {
          return { tool_call_id: tc.id, toolName, content: "Denied by user (permission mode).", meta: null }
        }
        if (batchPerm?.approved?.has(tc.id)) {
          // 本批已合并批准——跳过逐项询问直接执行
        } else {
          // Compute diff preview for file-based tools
          let diffInfo = null
          if (toolName !== "bash" && args.path) {
            try {
              const abs = join(cwd, args.path)
              const oldContent = existsSync(abs) ? readFileSync(abs, "utf8") : ""
              let newContent = ""
              if (toolName === "write") {
                newContent = args.content || ""
              } else if (toolName === "edit") {
                if (args.replace_all) {
                  newContent = oldContent.replaceAll(args.old_string, args.new_string)
                } else {
                  newContent = oldContent.replace(args.old_string, args.new_string)
                }
              } else if (toolName === "insert_after") {
                const lines = oldContent.split("\n")
                let target = (args.after_line != null) ? args.after_line : lines.length
                if (target < 0) target = 0
                if (target > lines.length) target = lines.length
                lines.splice(target, 0, args.content || "")
                newContent = lines.join("\n")
              } else if (toolName === "delete") {
                newContent = "" // deletion — show all as removed
              } else if (toolName === "apply_patch") {
                // Unified diff is human-readable as-is — show the raw patch with
                // +/- coloring in the panel (per-file old/new reconstruction would
                // need full hunk parsing; the approval goal is visibility, met).
                diffInfo = { patch: args.patch || "" }
              }
              if (newContent !== oldContent) {
                diffInfo = { old: oldContent, new: newContent, path: args.path }
              }
            } catch { /* best-effort — permission still works without diff */ }
          }
          const approved = await callbacks.onPermissionRequired(toolName, args, diffInfo)
          if (!approved) return { tool_call_id: tc.id, toolName, content: "Denied by user (permission mode).", meta: null }
        }
      }

      callbacks.onToolCall?.(toolName, args, tc.id) // subagents forward to the activity stream (depth guard removed)

      let result
      let toolErrored = false // LOGGING：catch 记 tool:error 后不再落 tool:done（CLI dispatch parity——单事件）
      if (!tool) {
        result = `Error: unknown tool "${toolName}"`
      } else {
        // LOGGING（LOGGING.md——CLI dispatch parity）：tool:* 事件——参数值永不落盘；
        // 前置门禁（planMode/权限拒绝/未知工具）不入事件（与 CLI 语义一致）
        const toolT0 = Date.now()
        logEvent("tool:call", { tool: toolName })
        try {
          const raw = await tool.execute(args, {
            cwd, agent, callbacks, signal, depth,
            // §17 D-S7/D-S9 tool-context passthrough: the subagent tool's manual-tier
            // spawn gate reads the LIVE autoApprove (ctx.getAuto), and children spawned
            // during a suspension session share the session signal (ctx.sessionSignal).
            getAuto,
            sessionSignal,
            // Live output streaming (bash etc.) — mirrors CLI dispatch's onOutput;
            // the id lets the webview route chunks to the right tool card.
            onOutput: (chunk) => callbacks.onToolOutput?.(toolName, chunk, tc.id),
          })
          result = String(raw)

          // Multimodal tools
          if (tool.multimodal) {
            try {
              const parsed = JSON.parse(result)
              if (parsed.images?.length) {
                logEvent("tool:done", { tool: toolName, ms: Date.now() - toolT0, head: headText(parsed.text, 200) })
                return { tool_call_id: tc.id, toolName, content: parsed.text, multimodal: { text: parsed.text, images: parsed.images } }
              }
            } catch { /* fall through */ }
          }
        } catch (e) {
          // User interrupt (Stop) must propagate, not become a tool error — swallowing
          // the AbortError keeps the loop running after the user asked to stop (CLI
          // dispatch.mjs parity: rethrow when aborted).
          if (e?.name === "AbortError" || signal?.aborted) throw e
          toolErrored = true
          logEvent("tool:error", { tool: toolName, ms: Date.now() - toolT0, err: errText(e, 200) })
          // A tool may reject with a non-Error value (string/null) — .message would be
          // undefined and the model would see "Error: undefined", losing the cause.
          result = `Error: ${e instanceof Error ? e.message : String(e)}`
        }
        if (!toolErrored) logEvent("tool:done", { tool: toolName, ms: Date.now() - toolT0, head: headText(result, 200) })
      }

      // Truncate large results: save to disk so agent can read with read tool
      result = offloadToolResult(cwd, result)

      return {
        tool_call_id: tc.id, toolName, content: result,
        meta: { args, tool, tc },
      }
    }

    // Concurrency limit for subagent batches
    const isSubagentBatch = batch.length > 0 && batch[0]?.tool?.name === "subagent"
    const results = isSubagentBatch
      ? await runWithLimit(batch, runOne, MAX_PARALLEL_SUBAGENTS)
      : await Promise.all(batch.map(runOne))

    for (const r of results) {
      const { tool_call_id, toolName, content, multimodal, meta } = r

      // name rides along so restored history cards show the tool name
      // (history-window emits m.name; without it restored cards render "tool").
      if (multimodal) {
        pushReal(history, fullHistory, { role: "tool", tool_call_id, name: toolName, content: multimodal.text })
        pushReal(history, fullHistory, { role: "user", content: [{ type: "text", text: multimodal.text }, ...multimodal.images] })
        callbacks.onToolResult?.(toolName, multimodal.text, tool_call_id)
      } else {
        pushReal(history, fullHistory, { role: "tool", tool_call_id, name: toolName, content })
        callbacks.onToolResult?.(toolName, content, tool_call_id)
      }

      // Track mutations + advisor/verify bookkeeping (CLI parity)
      if (meta) {
        const { args, tool } = meta
        if (FILE_MUTATORS.has(toolName)) {
          // Direct file edit — code was changed. The prior advisor review and
          // verify are stale: a review that ran before the edit no longer
          // covers the current file state (user decision 2026-08-08: the review
          // is triggered by CODE MUTATIONS only).
          agent._mutatedThisRun = true
          agent._calledAdvisorThisRun = false
          agent._verifiedThisRun = false
          agent._verifyPassed = undefined
          const paths = tool.touchedPaths ? tool.touchedPaths(args) : [args?.path]
          for (const p of paths) {
            if (typeof p !== "string") continue
            const abs = join(cwd, p)
            if (!agent._touchedFiles.includes(abs)) agent._touchedFiles.push(abs)
          }
        } else if (tool && !tool.readonly && !tool.sideEffectExempt) {
          // Non-mutating side-effect tools (bash, git): do NOT invalidate the
          // advisor review — a review is triggered by code mutations only
          // (user decision 2026-08-08; bash is barred from writing files, so
          // it cannot change the reviewed code). Verify IS invalidated: its
          // state snapshot (git diff, file list) may be stale.
          if (agent._verifiedThisRun) {
            agent._verifiedThisRun = false
            agent._verifyPassed = undefined
          }
        }
        if (toolName === "verify") agent._verifiedThisRun = true
        if (toolName === "advisor") {
          agent._calledAdvisorThisRun = true
          // Design reviews are a separate gate with no convergence protocol —
          // they must not consume code-review rounds. A failed/interrupted review
          // still counts as an attempt (next retry uses the next round's prompt).
          try {
            if (args.type !== "design") agent._advisorRound++
          } catch {
            agent._advisorRound++
          }
        }
      }

      // Stall detection (stable serialization). consult_check is exempt: a check loop
      // parked on replies is the DESIGNED consult usage, not a stall (design review D4).
      try {
        if (toolName === "consult_check") { recentSigs.length = 0 } else {
        const sig = `${toolName}:${meta?.args ? JSON.stringify(meta.args, Object.keys(meta.args).sort()) : ""}`
        recentSigs.push(sig)
        if (recentSigs.length > STALL_WINDOW) recentSigs.shift()
        if (recentSigs.length >= STALL_THRESHOLD) {
          const tail = recentSigs.slice(-STALL_THRESHOLD)
          if (tail[0] === tail[1] && tail[1] === tail[2]) {
            const consultHint = agent?.config?.agent?.consultModels?.length
              ? " Consider consult_start for independent parallel diagnoses."
              : ""
            history.push({
              role: "user",
              content: `[System reminder: identical call (${sig.slice(0, 100)}) 3× in a row — you may be stuck. Change approach.${consultHint}]`,
            })
            recentSigs.length = 0
          }
        }
        }
      } catch { /* */ }
    }
  }
}
