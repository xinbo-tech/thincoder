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
import { logEvent, errText, headText } from "@thincoder/core/log.mjs"
// P2 机制层端差批 §2.17：派发面 hooks 四调用点（静态合法——`hooks.mjs` 闭包仅 `node:child_process`）
import { runHooks } from "@thincoder/core/hooks.mjs"
import { manifestPath } from "../extension/session-slots.mjs"
// 认领面（§4.4）与足迹面同档接线：登记 / 落盘 / 命中查询 / 提示合成都在本模块（端侧就地扩）。
import { peerDomains, registerDomains, registerClaims, peerNotes, markPeerNoted } from "../extension/peer-domains.mjs"
// §9 D-24b：文件变更事件记账（async 评审陈旧判定数据源）——W12（2026-09-15）：原端侧
// `advisor-async.mjs` 的 `recordFileMutation`（history._fileMutEvents）随镜像删旧退役，改指核
// `noteMutations`（`advisor-settle.mjs`——写 `agent._mutLog`/`_mutationSeq`，核 `reviewIsStale` /
// `inflightDesignReviewConflict` 同读同一账本；载体 = 顶层 agent（会话级单例））。
import { noteMutations } from "@thincoder/core/agent-tools/advisor-settle.mjs"
// §18 C-11（2026-09-12——500 硬限归位）：前置门禁族 + 批权限扫描自本档 verbatim 迁至 tool-gates
import { l3TouchedPaths, preGateBlocked, isSubagentConsumeDesignAction, collectBatchPermission } from "./tool-gates.mjs"
// #130 B-4：`.cursor/rules` 作用域集 JIT 注入（派发前——判据单源 `rules-face.mjs`）
import { injectScopedRules } from "./rules-face.mjs"

// R10 L3（MULTI-INSTANCE-COLLAB.md D-L3a/b——VS Code 接线面）：结构化写工具集 =
// FILE_MUTATORS ∪ file_ops（bash 大通道不可拦——诚实边界：L3 覆盖结构化写工具足迹）。
const L3_WRITE_TOOLS = new Set([...FILE_MUTATORS, "file_ops"])


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
  // AGENT-LOOP-SUBAGENT.md §6.7 round2 #2: action-level readonly classification joins the grouping — subagent
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

  // #130 B-4（`.cursor/rules` 作用域集）：派发前注入——本批触达路径命中未注入规则 ⇒ 规则
  // 先入上下文（模型下一轮可见）。只读 `agent._rules` 缓存（每 run 读盘一次——装配期）；
  // 去重 = 会话级（`agent._rulesInjected`）。
  const ruleCalls = []
  for (const tc of response.toolCalls) {
    try { ruleCalls.push({ tool: toolByName.get(tc.name), args: JSON.parse(tc.arguments || "{}") }) } catch { /* 逐项解析错误归 runOne */ }
  }
  injectScopedRules(agent, history, ruleCalls)

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

      // Permission gate: non-readonly tools ask only when the LIVE AUTO read is off.
      // getAuto() is the live flag (CLI parity) — approve-all / the AUTO button can flip it
      // mid-turn, so re-read it per tool call; the gate itself is always present and reads
      // the same live value at ask time (permission-gate.mjs——同判据单源，ED-2 2026-09-16)。
      // §18 C-1（child permission gate——2026-09-12）：`depth === 0` 已从条件移除——深度不再是
      // 权限门。手动档下带权限通道的 child（coder/eng-designer——child-permission.mjs 经父面板
      // 弹卡，第 4 参携 owner/signal）**抵达**本阶段；eng-coder child 仍不达（spawn 时授权 = C-3
      // 的 live autoApprove=true getter 整段跳过——KD-2）；explore/plan 无通道（只读工具集）；
      // headless/无 handler 无回调——三者静默直通（T-CP10/T-CP11/T-CP15）。JSON 解析、未知工具、
      // planMode、design-token 门全部先行（preGateBlocked）且原样生效（T-E14）。
      // Tools may declare action-level readonly-ness (e.g. git diff/status/log/show) —
      // those skip approval while write actions (git commit/push/rm) still prompt.
      // AGENT-LOOP-SUBAGENT.md §6.7.2 D-M6 round2 #4: control actions (cancel) skip approval the same way —
      // 只停不启（无新副作用）——控制类豁免（无 permission handler 也不拒）。
      const actionReadonly = tool?.isReadonlyAction?.(args) ?? false
      const controlAction = tool?.isControlAction?.(args) ?? false
      if (!getAuto() && tool && !tool.readonly && !actionReadonly && !controlAction && !isSubagentConsumeDesignAction(toolName, args) && callbacks.onPermissionRequired) {
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
              // R-bug join→resolve 同族（2026-09-06）：预览读
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

      // PreToolUse hooks（核 `dispatch.mjs:258/314` 两端点在此合流 · P2 批 §2.17）：用户脚本
      // 可拦截工具执行；阻断 ⇒ 工具不执行 + 模型可见结果**逐字**同核（`dispatch.mjs:337-338`）。
      // 未知工具（下方 `!tool` 路径）与前置门禁早退保持零钩子（核同——那两路在 Phase 1 更前）。
      if (tool && !(await runHooks("PreToolUse", { agent, toolName, toolArgs: args }))) {
        return { tool_call_id: tc.id, toolName, content: "Error: blocked by PreToolUse hook", meta: null }
      }

      callbacks.onToolCall?.(toolName, args, tc.id) // subagents forward to the activity stream (depth guard removed)

      // R10 L3（MULTI-INSTANCE-COLLAB.md D-L3b / §4.4.4）：结构化写工具执行前查冲突与认领
      // 命中（软提示数据源——纯读 + 缓存命中零扫描——N3；两查共用同一聚合）。门控：本 cwd
      // 无会话 manifest（无头测试/未绑定面板的回合）不参与 L3——测试卫生（不向真实
      // ~/.thincoder/peers 写任何东西）。
      let l3Paths = []
      let l3Hits = []
      let l3Claims = []
      if (L3_WRITE_TOOLS.has(toolName)) {
        l3Paths = l3TouchedPaths(toolName, tool, args, cwd)
        if (l3Paths.length > 0 && existsSync(manifestPath(cwd))) {
          try {
            const pd = peerDomains(cwd)
            l3Hits = pd.conflicts(l3Paths)
            l3Claims = pd.claimConflicts(l3Paths)
          } catch { l3Hits = []; l3Claims = [] }
        }
      }

      let result
      let toolErrored = false // LOGGING：catch 记 tool:error 后不再落 tool:done（CLI dispatch parity——单事件）
      let toolCtx = null // A6（群 A 批）：per-call 调用上下文（try 内建——返 meta 供记账块读）
      if (!tool) {
        result = `Error: unknown tool "${toolName}"`
      } else {
        // LOGGING（LOGGING.md——CLI dispatch parity）：tool:* 事件——参数值永不落盘；
        // 前置门禁（planMode/权限拒绝/未知工具）不入事件（与 CLI 语义一致）
        const toolT0 = Date.now()
        logEvent("tool:call", { tool: toolName })
        try {
          // A6（群 A 批）：调用上下文提升为具名对象（ctx 字面量 → `const toolCtx`）——工具可
          // 在其上置拒绝标记（`_advisorRefused`），记账块同对象读取（per-call 载体；拒绝 = 未跑）。
          toolCtx = {
            cwd, agent, callbacks, signal, depth,
            // A6（群 A 批）+ W13 收口：调用 id 随 ctx 下发——核工具（advisor 等）的拒绝/收发
            // 登记面 (`agent._advisorRefusals` / `_advisorAsyncAcks` / `_advisorSyncCalls`) 恒
            // 以 `ctx._toolCallId` 为键（核 `advisor.mjs:109` 等 10 处）；缺失 ⇒ 核侧登记空转 +
            // 端侧记账错记（显式 async:false 拒绝被误计 called/round——评审 🔴）。
            _toolCallId: tc.id,
            // tool-ctx 透传账（F2 收正——2026-09-16）：旧注曾把 spawn 门写成读 `getAuto`、子代 signal
            // 写成共享 `sessionSignal` 字段——两说均与实现不符、旧句已删（收正不得保留旧句——批次档 §2.15）。现行实态：
            // ① 核消费面 = `onPermissionRequest`（下行 F1 新供给——缝表 `CORE-UNIFICATION（核仓·设计）` §2.13.3）；
            // ② `getAuto` / `sessionSignal` 两透传 = 历史残留、核侧零消费者（核树 grep 零命中）——核
            // spawn 门读**父对象字段** `parent.autoApprove`（`subagent-spawn.mjs:305`）；会话 signal 达核
            // 经 `agent._sessionSignal`（`subagent-async.mjs:388`）——零回归保留（消解路径 = 报告项，另案清理）。
            getAuto,
            sessionSignal,
            // F1（2026-09-16 缺陷修复——承 `docs/batches/2026-09-16-vsc-autoapprove-misalign.md` §2 F1）：
            // child 权限通道透传（核同范式 = `thincoder-core/agent/dispatch.mjs:395`）——手动档子代写
            // 询问（`subagent-spawn.mjs:319` `${key}/${tool}`）经此达端装配层供给面（`panel-callbacks.mjs`
            // ——owner 归属 + `⏸` 态）；缺失（headless / 无 gate）⇒ 核分支静默 `return false`
            // （`subagent-spawn.mjs:308-309`）。
            onPermissionRequest: callbacks.onPermissionRequest,
            // W14（2026-09-15）：question 工具面——核 `tools/question.mjs` 读 `ctx.onQuestion`
            //（§2.13.3）；端侧通道 = callbacks.onQuestion（面板卡片）。取消/Stop（askInPanel
            // resolve null）归一为旧端文案 "(user cancelled)"（承删除档 question.mjs:29-31 语义）；
            // 无通道（headless）⇒ undefined ⇒ 核内抛 "not supported in this context"。
            onQuestion: callbacks.onQuestion
              ? async (q, o) => (await callbacks.onQuestion(q, o)) ?? "(user cancelled)"
              : undefined,
            // Live output streaming (bash etc.) — mirrors CLI dispatch's onOutput;
            // the id lets the webview route chunks to the right tool card.
            onOutput: (chunk) => callbacks.onToolOutput?.(toolName, chunk, tc.id),
          }
          const raw = await tool.execute(args, toolCtx)
          // C-7（AGENT-LOOP（VSC 仓）§12.3）工具结果类型守卫：非字符串 → throw（catch 转
          // "Error: …" 可见结果）；禁静默 String(raw) 成 "[object Object]"（issue ① 病征类）。
          if (typeof raw !== "string") throw new Error(`${toolName} must return a string value — got ${raw === null ? "null" : typeof raw}`)
          result = raw

          // R10 L3（D-L3a 累积 + §4.4.3 认领登记 + 决策⑥ 软提示——D-L3b 工具结果附注，不阻止）：
          // 写成功（无 Error 返回）→ 记入本回合域集合（回合末 flushDomains 整写——run-stages
          // finalizeAgentTurn）+ 认领登记（新目标即刻落盘 / 续约节流）；命中提示 = 认领行逐 target
          // + 足迹聚合行过滤已覆盖 target（§4.4.4——零双报）；提示已附加 ⇒ 落去重标记。
          if (l3Paths.length > 0 && !result.startsWith("Error")) {
            registerDomains(l3Paths)
            registerClaims(l3Paths, cwd)
            const peerNote = peerNotes(agent, { claimHits: l3Claims, footHits: l3Hits })
            if (peerNote) {
              result += "\n\n" + peerNote.text
              markPeerNoted(agent, peerNote.keys)
            }
          }
          // §29 fix A（AGENT-LOOP.md §29——2026-09-07——唯一记账点）：FILE_MUTATORS 执行成功
          // 即刻记文件变更事件——取代批后提交循环的 recordFileMutation（不双计）——同批 launch
          // 前的写在 eventsAtLaunch 之前落地 → async 评审 settle 不误判陈旧；中断批（commit
          // 循环被跳过）不再丢事件（中断分支不另行记账——seq 单计）。
          // B3 契约 2（群 B 批 E-扩 2——F31(b)）：键同扩 file_ops + 同点把 l3Paths 逐项
          // 记入 _touchedFiles（includes 去重守卫——子代理合入载体；评审实例面未挂数组 → 零记账）。
          if ((FILE_MUTATORS.has(toolName) || toolName === "file_ops") && !result.startsWith("Error:") && l3Paths.length > 0) {
            // W12：核 `noteMutations` 单点记账（一次提交一笔 seq——paths 数组）；原逐路径
            // `recordFileMutation` 随端侧 advisor-async 退役。
            noteMutations(agent, l3Paths)
            for (const abs of l3Paths) {
              if (Array.isArray(agent._touchedFiles) && !agent._touchedFiles.includes(abs)) agent._touchedFiles.push(abs)
            }
          }
          // PostToolUse hooks（核 `dispatch.mjs:443` 同语义——fire-and-forget；载荷 result =
          // 原始结果（非 offload 后文本）。位序：核在本轮 onToolResult 之后、端在之前（同成功路径内））
          runHooks("PostToolUse", { agent, toolName, toolArgs: args, result: raw }).catch(() => {})

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
          // 失败事件钩子（核 `dispatch.mjs:456-457` 同序——中止先于事件、中止不落钩子）
          runHooks("PostToolUseFailure", { agent, toolName, toolArgs: args, error: e }).catch(() => {})
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
        meta: { args, tool, tc, toolCtx },
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
        const { args, tool, toolCtx } = meta
        if (FILE_MUTATORS.has(toolName)) {
          // Direct file edit — code was changed. The prior advisor review and
          // verify are stale: a review that ran before the edit no longer
          // covers the current file state (user decision 2026-08-08: the review
          // is triggered by CODE MUTATIONS only).
          // §29 fix A（2026-09-07）：文件变更事件（核 noteMutations）已移到 runOne 执行
          // 成功即刻（唯一记账点）——此处仅剩 guard 标志 + touchedFiles（不双计）。
          agent._mutatedThisRun = true
          agent._calledAdvisorThisRun = false
          agent._verifiedThisRun = false
          agent._verifyPassed = undefined
          const paths = tool.touchedPaths ? tool.touchedPaths(args) : [args?.path]
          for (const p of paths) {
            if (typeof p !== "string") continue
            // R-bug join→resolve 双前缀（2026-09-06——CLI 同修）：
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
        // §9 D-24b（R13——2026-09-06）：async advisor 工具返回 = ack（评审后台跑）——
        // 不在工具结果时点记账（settle 时点统一执行——token/guard 标记/实例轮次）；
        // sync（async:false / depth>0 缺省）走既有记账。
        const advisorAsync = toolName === "advisor" && (args.async ?? depth === 0)
        if (toolName === "advisor" && !advisorAsync) {
          // A6（群 A 批）+ W13 收口：拒绝登记——读面双源：① 端档遗留直置标记
          // `toolCtx._advisorRefused`（向后兼容——旧端工具面）；② 核工具面真源
          // `agent._advisorRefusals`（Set<toolCallId>——核 `advisor.mjs` 拒绝分支写入）。
          // 任一命中 = 未跑 ⇒ 不置 called / 不推轮次（拒绝 = 无评审产出）。零回归：未置位走既有记账。
          const refused = toolCtx?._advisorRefused === true
            || (toolCtx?._toolCallId !== undefined && agent._advisorRefusals?.has(toolCtx._toolCallId) === true)
          if (!refused) {
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
