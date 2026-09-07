/**
 * execute-tools.mjs — tool batch execution (split out of agent.mjs for the 500-line limit).
 * Groups tool calls into parallel batches (readonly / subagent), runs them with guards
 * (plan mode, engineering design gates, permission), commits results to both history lines,
 * and tracks mutations / advisor-verify bookkeeping / stall detection.
 */
import { readFileSync, existsSync } from "node:fs"
import { resolve } from "node:path"
import {
  FILE_MUTATORS, STALL_WINDOW, STALL_THRESHOLD, MAX_PARALLEL_SUBAGENTS,
  offloadToolResult, pushReal, runWithLimit,
} from "./run-helpers.mjs"
import { isDocFile } from "../advisor/repos.mjs"
import { logEvent, errText, headText } from "../log.mjs"
import { manifestPath } from "../extension/session-slots.mjs"
import { peerDomains, registerDomains } from "../extension/peer-domains.mjs"
// §24 D-24b：文件变更事件记账（async 评审陈旧判定数据源——跨 run 载体）
import { recordFileMutation } from "../agent-tools/advisor-async.mjs"

// R10 L3（MULTI-INSTANCE-COLLAB.md D-L3a/b——VS Code 接线面）：结构化写工具集 =
// FILE_MUTATORS ∪ file_ops（bash 大通道不可拦——诚实边界：L3 覆盖结构化写工具足迹）。
const L3_WRITE_TOOLS = new Set([...FILE_MUTATORS, "file_ops"])

/** L3 触达路径（绝对）：FILE_MUTATORS 走 tool.touchedPaths（既有收口）；file_ops 按动作
 *  取源/目标（move/rename 动两端；copy 只写目标——源仅读取不算写域）。 */
function l3TouchedPaths(toolName, tool, args, cwd) {
  let rel = []
  if (toolName === "file_ops") {
    rel = args?.action === "copy" ? [args?.dest] : [args?.source, args?.dest]
  } else {
    rel = tool?.touchedPaths ? tool.touchedPaths(args ?? {}) : [args?.path]
  }
  return rel.filter((p) => typeof p === "string" && p).map((p) => resolve(cwd, p))
}

/** L3 冲突软提示文案（决策⑥ A——工具结果附注，不阻止） */
function peerConflictNote(hits) {
  const seen = new Set()
  const parts = []
  for (const h of hits) {
    const k = `${h.file}|${h.pid}`
    if (seen.has(k)) continue
    seen.add(k)
    parts.push(`${h.file} (pid=${h.pid}${h.end ? `, ${h.end}` : ""})`)
  }
  return `[peer conflict notice] another live ThinCoder instance recently wrote the same file(s): ${parts.join("; ")} — coordinate to avoid overlapping edits (soft notice — the write was not blocked).`
}

/**
 * 前置门禁（planMode / 工程设计闸）——单点判定，批扫描与逐项执行共用（§16 D-B1：
 * 被前置门禁拦下的工具不计入批询问）。返回 { blocked, content }。
 */
function preGateBlocked(agent, { tool, toolName, args, depth }) {
  // Plan mode guard — §19 round2 #2 (AGENT-LOOP.md): readonly classification is
  // ACTION-LEVEL. A tool may declare action-level readonly-ness (isReadonlyAction —
  // e.g. subagent action:'status'): those pass plan mode like readonly tools,
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
 * §2.6 token 链终消费制（2026-09-07——评审 #7d dispatch 分类——CLI dispatch.mjs 同构）：
 * consume-design = 非只读控制动作——planMode 拒绝（不入 readonly/control 豁免——
 * 与其他非只读动作同门）、免权限审批、不入批审批分组（无文件写——控制类直行）。
 * 与 cancel 的不同：cancel 是控制类豁免（planMode 放行），consume-design 按设计
 * planMode 拒绝——故不并入 isControlAction 钩子，单独谓词只接权限豁免位（批扫描 +
 * 逐项询问两处）。
 */
function isSubagentConsumeDesignAction(toolName, args) {
  return toolName === "subagent" && args?.action === "consume-design"
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
    // §19.5 D-M6 round2 #4: cancel 类控制动作不入批审批组（免询问——只停不启）；
    // consume-design 同款免审直行（§2.6——无文件写）
    const controlAction = tool?.isControlAction?.(args) ?? false
    if (!tool || tool.readonly || actionReadonly || controlAction || isSubagentConsumeDesignAction(tc.name, args)) continue
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
  // action:'status' calls merge into the readonly parallel batch like the
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
      if (!getAuto() && tool && !tool.readonly && !actionReadonly && !controlAction && !isSubagentConsumeDesignAction(toolName, args) && depth === 0 && callbacks.onPermissionRequired) {
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
              // R-bug join→resolve 同族（AGENT-LOOP.md §24 尾修复注——2026-09-06）：预览读
              // 用绝对 args.path 时 join(cwd, ·) 同样双前缀 → 读错位路径、展示错误 diff——
              // resolve 相对/绝对均正（与记账点/ l3TouchedPaths 同语义）。
              const abs = resolve(cwd, args.path)
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

      // R10 L3（MULTI-INSTANCE-COLLAB.md D-L3b）：结构化写工具执行前查冲突（软提示数据源——
      // 纯读 + 缓存命中零扫描——N3）。门控：本 cwd 无会话 manifest（无头测试/未绑定面板的
      // 回合）不参与 L3——测试卫生（不向真实 ~/.thincoder/peers 写任何东西）。
      let l3Paths = []
      let l3Hits = []
      if (L3_WRITE_TOOLS.has(toolName)) {
        l3Paths = l3TouchedPaths(toolName, tool, args, cwd)
        if (l3Paths.length > 0 && existsSync(manifestPath(cwd))) {
          try { l3Hits = peerDomains(cwd).conflicts(l3Paths) } catch { l3Hits = [] }
        }
      }

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

          // R10 L3（D-L3a 累积 + 决策⑥ 软提示——D-L3b 工具结果附注，不阻止）：
          // 写成功（无 Error 返回）→ 记入本回合域集合（回合末 flushDomains 整写——
          // run-stages finalizeAgentTurn）；写前查到的他实例 hot 域命中 → 结果附提示。
          if (l3Paths.length > 0 && !result.startsWith("Error")) {
            registerDomains(l3Paths)
            if (l3Hits.length > 0) result += "\n\n" + peerConflictNote(l3Hits)
          }
          // §29 fix A（AGENT-LOOP.md §29——2026-09-07——唯一记账点）：FILE_MUTATORS
          // 执行成功即刻记文件变更事件——取代批后提交循环的 recordFileMutation（不双计）——
          // 同批 launch 前的写在 eventsAtLaunch 之前落地 → async 评审 settle 不误判陈旧；
          // 中断批（commit 循环被跳过）不再丢事件（中断分支不另行记账——seq 单计）。
          if (FILE_MUTATORS.has(toolName) && !result.startsWith("Error:") && l3Paths.length > 0) {
            for (const abs of l3Paths) recordFileMutation(agent, abs)
          }

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
          // §29 fix A（2026-09-07）：文件变更事件（recordFileMutation）已移到 runOne 执行
          // 成功即刻（唯一记账点）——此处仅剩 guard 标志 + touchedFiles（不双计）。
          agent._mutatedThisRun = true
          agent._calledAdvisorThisRun = false
          agent._verifiedThisRun = false
          agent._verifyPassed = undefined
          const paths = tool.touchedPaths ? tool.touchedPaths(args) : [args?.path]
          for (const p of paths) {
            if (typeof p !== "string") continue
            // R-bug join→resolve 双前缀（AGENT-LOOP.md §24 尾修复注——2026-09-06——CLI 同修）：
            // p 为绝对路径时 join(cwd, p) 双前缀（node path.join 遇绝对段不重置——resolve
            // 才重置）→ _touchedFiles 记错路径（verify 关联面）。
            const abs = resolve(cwd, p)
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
        // §24 D-24b（R13——2026-09-06）：async advisor 工具返回 = ack（评审后台跑）——
        // 不在工具结果时点记账（settle 时点统一执行——token/guard 标记/实例轮次）；
        // sync（async:false / depth>0 缺省）走既有记账。
        const advisorAsync = toolName === "advisor" && (args.async ?? depth === 0)
        if (toolName === "advisor" && !advisorAsync) {
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

      // Stall detection (stable serialization). §25 R17: consult_check 退役——免检分支
      // 随删（自动 digest 后无 check 循环——无设计用法需豁免）。
      try {
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
      } catch { /* */ }
    }
  }
}
