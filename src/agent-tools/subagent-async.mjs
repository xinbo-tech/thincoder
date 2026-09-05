/**
 * subagent-async.mjs — async subagent 机械 + 共享 post-spawn 管线 + cancel 动作执行器
 * （AGENT-LOOP.md §19：subagent 单工具五动作 spawn/status/escalate/cancel/panel——§19.8
 * check 删除后工具面只剩五动作；spawn 路径与工具面在 subagent.mjs；cancel 动作执行器
 * 与机械、管线在本模块——check 执行器随 §19.8 删除）。
 * 内容：resolveChildProvider / async 常量（ASYNC_SUBAGENT_LIMIT）/ executeCancelAction +
 * cancelAsyncSubagent（§19.5 D-M6——工具与 TUI ⏹ 共用）/ runChildPipeline /
 * injectAsyncResult / buildChildRunOpts / mergeChildMutations。
 * 拆分（2026-09-05——Module Split Policy §20.9——纯迁移零行为变化）：§20 调度器 + 文件域
 * 组 → ./subagent-scheduler.mjs（尾部 re-export 保测试动态 import 面——queueRunnable/
 * describeBlockers）；status/panel/escalate 动作执行器 → ./subagent-actions.mjs。
 */
import {
  runAgent, escapeXml,
  MIN_REPORT_CHARS, REPORT_CONTINUATION, DEFAULT_SUBAGENT_TURNS,
} from "../agent.mjs"
import { runWithContinue, TURN_CAP_MARK } from "../agent/spawn-child.mjs"
import { pushReal } from "../context.mjs"
import { offloadToolResult } from "../agent/helpers.mjs"
import {
  dependentLabels, maybeRefillAsync, refreshQueuedTokens,
} from "./subagent-scheduler.mjs"

// Async subagent limit (AGENT-LOOP.md §15 D-A4): mechanical concurrency cap for
// background spawns. The per-turn check budget was deleted with the check action
// (§19.8 — results arrive only via the auto channel; no loop guard needed).
export const ASYNC_SUBAGENT_LIMIT = 4

/**
 * Resolve the sub-agent's provider from a model override string (shared with the
 * VS Code port). Forms accepted:
 *   "provider:model"  → the named provider with the named model
 *   "provider"        → the named provider's configured model
 *   "model"           → same provider as the parent, different model
 *   "default"         → same as null: the parent's provider unchanged (explicit
 *                       "use the default model" — 2026-09-05 user ruling; matched
 *                       case-insensitively — parser-layer alias guard)
 * null → parent's provider unchanged.
 * API keys come from config.json only (env vars are not a key source).
 */
export function resolveChildProvider(parent, modelArg) {
  if (!modelArg) return { ...parent.provider }
  // "default" alias (2026-09-05 user ruling — ARCHITECTURE.md 子 agent 模型指定):
  // the literal "default", matched case-insensitively, declares "no override →
  // inherit the default model" — equivalent to null/omission (parent provider
  // unchanged). Checked BEFORE the provider-name lookup so the alias is reserved
  // (≡ omission — providers are not consulted) and never falls through to the
  // model-name swap branch. Any other single-segment value keeps the legacy
  // semantics below.
  if (String(modelArg).toLowerCase() === "default") return { ...parent.provider }
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
  return { ...parent.provider, model: modelArg }
}

/**
 * §19.5 D-M6 cancel 核心（工具路径与 TUI ⏹ 共用）：定向中止单个后台子代理，id 必填。
 * - queued 目标（未启动无 controller）：出队 + 后续 position 前移 + settle waiter
 *   → { id, status:"cancelled", was:"queued" }——无 abort（T-M27）
 * - running 目标：置 entry.cancelled + 条目 controller abort（child runAgent signal）
 *   → settle finally 跑 cancelled 分支（⟦ev⟧stopped 冻结 + 模型提醒；不入 pending/
 *   不直注入）→ { id, status:"cancelled" }（T-M19）
 * - 未知/已完成 id → error（T-M20）；重复 cancel 幂等（abort 已在途）
 */
export function cancelAsyncSubagent(agent, id) {
  const key = String(id)
  const map = agent._asyncSubagents ?? new Map()
  const entry = map.get(key)
  if (!entry) {
    return { id: key, status: "error", error: `unknown async subagent id: ${key}` }
  }
  if (entry.done) {
    return { id: key, status: "error", error: `async subagent #${key} has already finished — nothing to cancel` }
  }
  if (entry.cancelled) return { id: key, status: "cancelled" } // abort already in flight — idempotent
  if (entry.status === "queued") {
    // 出队 + position 释放/前移（§19.5 D-M6——无 abort）
    const queue = agent._asyncQueue ?? []
    const qi = queue.indexOf(entry)
    if (qi >= 0) {
      queue.splice(qi, 1)
      for (let i = 0; i < queue.length; i++) queue[i].position = i + 1
    }
    entry.cancelled = true
    entry.done = true
    entry.status = "done"
    map.delete(key)
    // §20 D-SD5 终态墓碑：queued 取消（无 settle 事件——出队即终态）——依赖者经
    // 墓碑查得 cancelled 分支（round1 #4——cancel 返回时即重估标注）。
    const tombstones = (agent._asyncTombstones ??= new Map())
    tombstones.set(key, { status: "cancelled", role: entry.role })
    entry._settle?.()
    return { id: key, status: "cancelled", was: "queued" }
  }
  // running：标记 + 条目 abort——settle finally 跑 cancelled 分支（移除 + stopped + 提醒）
  entry.cancelled = true
  entry.controller?.abort?.()
  return { id: key, status: "cancelled" }
}

/** subagent action:"cancel" (§19.5 D-M6): depth-0 main-session control only.
 *  §20 D-SD5/round1 #4（queued 依赖取消——无 settle 事件）：出队后**返回即**重估
 *  依赖者——依赖者留 queued 标 dependency cancelled（refreshQueuedTokens 发更新块头
 *  token）+ 工具结果内注依赖者（模型可见——工具结果内——round1 #4 明示通道）+ 补位
 *  （AUTO 档依赖者自动启动/槽位竞态释放）。被取消条目自身发 ⟦ev⟧cancelled 移除等待块。 */
export function executeCancelAction(args, ctx) {
  if ((ctx.depth ?? 0) > 0) {
    return JSON.stringify({ status: "error", error: "cancel is only available at depth 0 — a child agent has no async pool of its own (AGENT-LOOP.md §19.5 D-M6)" })
  }
  const id = args?.id
  if (id === undefined || id === null || String(id) === "") {
    return JSON.stringify({ status: "error", error: "cancel requires the id of the async subagent to stop — omitting it would mean a blanket cancel (Ctrl+C stops everything; AGENT-LOOP.md §19.5 D-M6)" })
  }
  const key = String(id)
  const agent = ctx.agent
  const entry = agent._asyncSubagents?.get(key)
  const wasQueued = entry?.status === "queued"
  // 依赖者快照（出队前——用于 AUTO 分支判定"是否有依赖者被本次取消波及"；note 组装在
  // refill 后按**仍 queued** 的实况重算——防 AUTO 已自动启动后文案称 "stay queued"）
  const hadDependents = entry ? dependentLabels(agent, key).length > 0 : false
  const result = cancelAsyncSubagent(agent, key)
  if (wasQueued && result.status === "cancelled" && result.was === "queued" && entry) {
    // §20 D-SD3b：取消/出队 → 移除等待块（不冻结——TUI routeSubToken cancelled 分支）
    ctx.callbacks?.onToken?.(`${entry.relayPrefix}⟦ev⟧cancelled\x1e`)
    // 依赖者标注 + 位置前移 + AUTO 自动启动（round2 #3：AUTO 档才启动——手动留 queued）
    maybeRefillAsync(agent)
    refreshQueuedTokens(agent, ctx.callbacks?.onToken)
    if (hadDependents) {
      // refill 后重算——AUTO 下依赖者已启动者不再列（文案与实际状态一致——code review 🔵）
      const dependents = dependentLabels(agent, key)
      if (dependents.length > 0) {
        result.dependents = dependents
        result.note = `queued dependents ${dependents.join(", ")} marked "dependency cancelled" — they stay queued until you cancel them (this action again with their id) or an AUTO session starts them (AGENT-LOOP.md §20 D-SD5)`
      } else if (agent.autoApprove) {
        result.note = `dependents of the cancelled task auto-started (AUTO session — round2 #3: an AUTO session starts dependency-cancelled dependents on slot availability)`
      }
    }
  }
  return JSON.stringify(result)
}

/**
 * 共享 post-spawn 管线（阻塞与 async 同一条——§15 D-A1 "全不变"）：turn-cap continue
 * 循环 → 拒绝降级 partial 返回 → MIN_REPORT_CHARS 扩写 → eng-coder mutation merge →
 * designId 后缀。onDeclined 在此（两路同一形态）——只有 askContinue 不同：阻塞经权限
 * 面板询问；async 永不弹面板（自动拒绝；engineering && AUTO 自动 resume——§15 D-A3）。
 */
export async function runChildPipeline(child, input, childOpts, childRunOpts, { parent, role, args, askContinue }) {
  const declined = { partial: null }
  let report = await runWithContinue(
    (child, input, cbs, opts) => runAgent(child, input, cbs, opts), // opts = childRunOpts + resume (由管线管理)
    child, input, childOpts, childRunOpts,
    {
      askContinue,
      onDeclined: (e, output) => {
        if (role === "eng-coder" && child._mutatedThisRun) mergeChildMutations(parent, child)
        // 拒绝 = 早退语义：不带 MIN_REPORT_CHARS 扩写（对已 cap 的 child 追问长报告是错的）；
        // review #2：用管线捕获的 output（此时 report 仍 ""——runWithContinue 未返回）
        declined.partial = `Subagent (${role}) ${TURN_CAP_MARK} (${e.turn} turns) — work may be partial; review recent_changes before deciding next steps.\nPartial output: ${output || ""}`
      },
    },
  )
  if (declined.partial !== null) {
    // 被拒的 eng-coder 交付仍带 designId（fix round 以同 slot 重 spawn——2026-09-01）
    if (role === "eng-coder") declined.partial += `\ndesignId: ${args.designId ?? "(single-design session — designId optional)"} — reuse it (with the same designToken) when re-spawning this eng-coder.`
    return declined.partial
  }

  // 报告过短 = 交接不完整：送回扩写一次（kimi-code summaryPolicy: min 200 chars 同源）
  if (report.length < MIN_REPORT_CHARS) {
    report = await runAgent(child, REPORT_CONTINUATION, childOpts, childRunOpts)
  }

  // 工程模式机械码门：委托的文件改动不得绕过父侧 advisor/verify guard——eng-coder ONLY
  // 有意为之（review #8）：普通 coder 自带自评纪律；normal 模式无父侧 gate 可喂。
  // 只在实际 mutated 时 merge（防 runAgent 写前抛错时传播空 mutation 声明——纵深防御）
  if (role === "eng-coder" && child._mutatedThisRun) {
    mergeChildMutations(parent, child)
  }

  // designId 随交付报告（2026-09-01）：divergence audit fix round 用同一 designId+token 重 spawn
  if (role === "eng-coder") {
    report += `\ndesignId: ${args.designId ?? "(single-design session — designId optional)"} — reuse this designId with the same designToken (from the approved advisor type='design' review) when re-spawning this eng-coder for an audit fix round.`
  }

  return report
}

/**
 * Inject one settled async entry into the parent history as a user-role reminder
 * (§17 D-S3 — the auto channel, sole consumption path since §19.8: turn-end
 * collection (collectSettledAsync, agent.mjs) and the run-start _pendingAsyncResults
 * injection; the message shape is identical to the §15 collector's). Consumed =
 * the caller removes the entry from its container; no double-inject across the
 * two paths (D-S3 "inject once" invariant).
 */
export async function injectAsyncResult(agent, entry) {
  const body = entry.error ?? entry.report ?? "(no report)"
  const preview = await offloadToolResult(String(body), `async-subagent-${entry.id}`)
  pushReal(agent, {
    role: "user",
    content: `[System reminder: async subagent #${entry.id} (${entry.role}) finished]\n${escapeXml(preview)}`,
  })
  // §20 D-SD5 终态墓碑：本函数是全部自动注入路径的共享形态（回合尾 collect + 挂起
  // digest 首行注入）——注入即消费（调用方随即从容器移除）——dependsOn 引用该 id 的
  // 后续 spawn 视为已满足（T-SD14 消费终态语义——§19.8 后 check 消费路径删除，本自动
  // 通道为唯一消费方；error 条目记 failed——依赖取消/失败分支照旧，不误标成功）。
  const tombstones = (agent._asyncTombstones ??= new Map())
  tombstones.set(String(entry.id), { status: entry.error != null ? "failed" : "consumed", role: entry.role })
}

/**
 * Child agent run options — the parent's abort signal MUST propagate to the
 * child: without it, Ctrl+C aborts the parent's controller but the child keeps
 * running its full turn budget (up to subagentTurns) while the parent awaits —
 * the interrupt appears to do nothing.
 * §17 D-S9: during a suspension session children share the SESSION signal instead
 * (agent._sessionSignal) — a digest's own Ctrl+I/Ctrl+C must not abort the whole
 * pool; the session driver aborts the session controller to stop everything.
 */
export function buildChildRunOpts(ctx) {
  return {
    depth: (ctx.depth ?? 0) + 1,
    maxTurns: ctx.agent?.config?.agent?.subagentTurns ?? DEFAULT_SUBAGENT_TURNS,
    signal: ctx.agent?._sessionSignal ?? ctx.signal ?? null,
  }
}

/**
 * Merge an eng-coder child's mutations into the parent agent's bookkeeping.
 * The parent must stay aware of delegated file changes: `_touchedFiles` enables
 * the advisor guard (completion.mjs) to detect that code was modified and
 * pushback for review. Prior verify/advisor state is invalidated because it
 * judged an older state.
 *
 * `_advisorRound` is NOT reset: merged code enters the CURRENT convergence
 * cycle. Resetting here would break the review→fix→re-review loop (the parent
 * reviews, spawns an eng-coder to fix, merges, reviews again — every merge
 * would restart at round 1 and the 5-round cap could never be reached).
 * `_calledAdvisorThisRun` IS cleared so the merged code triggers a fresh
 * advisor call (the guard demands review of new mutations).
 *
 * Returns true when mutations were merged (kept for future caller checks).
 */
export function mergeChildMutations(parent, child) {
  // A child claiming mutations without any touched file is a misbehaving
  // child (or a bookkeeping bug) — do not propagate an empty mutation claim
  // to the parent's guard state.
  if (!child._mutatedThisRun || !(child._touchedFiles?.length)) return false
  parent._mutatedThisRun = true
  for (const abs of child._touchedFiles ?? []) {
    if (!parent._touchedFiles.includes(abs)) parent._touchedFiles.push(abs)
  }
  if (parent._calledAdvisorThisRun) parent._calledAdvisorThisRun = false
  if (parent._verifiedThisRun) {
    parent._verifiedThisRun = false
    parent._verifyPassed = undefined
  }
  // Stale session cleanup only — the round counter survives (see above).
  parent._advisorSession = null
  return true
}

// Re-export shim (2026-09-05 拆分轮): §20 调度符号迁至 ./subagent-scheduler.mjs——本面
// 保留供 test/subagent-scheduler.test.mjs 动态 import（测试零改动——freeze.mjs 同款转发链）。
export { queueRunnable, describeBlockers } from "./subagent-scheduler.mjs"
