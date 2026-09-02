/**
 * subagent-async.mjs — async subagent 生成侧机械 + 共享 post-spawn run 管线
 * （2026-09-03 拆分轮：subagent.mjs 527 行超 500 硬限——§15/§17/§18 累积）。
 * 与 subagent-check.mjs（消费侧，早已独立）同构的分离：本模块承接生成侧。
 *
 * 内容：
 * - async 常量（AGENT-LOOP.md §15 D-A4）：ASYNC_SUBAGENT_LIMIT（槽位机械上限）与
 *   MAX_ASYNC_CHECKS（subagent_check per-turn 检查预算——消费侧 subagent-check.mjs
 *   从 subagent.mjs 导入，经其 re-export shim 拿到，零消费点改动）
 * - runChildPipeline：阻塞/async 两分支共享的 post-spawn 管线（execute 与两分支的
 *   调用点保留在 subagent.mjs——本模块只承接被调用管线本身；onDeclined 与
 *   askContinue 分流不变）
 * - maybeRefillAsync / injectAsyncResult：槽位队列补位 + 收尾注入器（§17 D-S3 共享
 *   形态——turn-end collectSettledAsync 与 _pendingAsyncResults 两消费点同一注入函数）
 * - buildChildRunOpts / mergeChildMutations：run 管线支撑（父信号传播、eng-coder
 *   机械门 mutation 并账——escalate.mjs / agent.test.mjs 等消费点经 subagent.mjs
 *   shim 不变）
 *
 * 拆分纪律：纯移动零逻辑改动；subagent.mjs 的导出面经文件尾部 re-export shim
 * 等价保留，消费点（agent.mjs / agent-turn.mjs / escalate.mjs / subagent-check.mjs /
 * 测试）零改动。
 */
import {
  runAgent, escapeXml,
  MIN_REPORT_CHARS, REPORT_CONTINUATION, DEFAULT_SUBAGENT_TURNS,
} from "../agent.mjs"
import { runWithContinue, TURN_CAP_MARK } from "../agent/spawn-child.mjs"
import { pushReal } from "../context.mjs"
import { offloadToolResult } from "../agent/helpers.mjs"

// Async subagent limits (AGENT-LOOP.md §15 D-A4): mechanical concurrency cap for
// background spawns + the per-turn check budget (consult-style loop guard).
export const ASYNC_SUBAGENT_LIMIT = 4
export const MAX_ASYNC_CHECKS = 3

/**
 * Shared post-spawn pipeline (blocking AND async — AGENT-LOOP.md §15 D-A1: the
 * async branch reuses the exact same spawn-child pipeline, "全不变"):
 * turn-cap continue loop → declined partial-work return → MIN_REPORT_CHARS
 * expansion → eng-coder mutation merge → designId suffix. Returns the report.
 * onDeclined lives here (identical for both paths) — only askContinue differs:
 * blocking asks the user via the permission panel; async NEVER pops a panel —
 * auto-declines except engineering && AUTO, which auto-resumes (§15 D-A3).
 */
export async function runChildPipeline(child, input, childOpts, childRunOpts, { parent, role, args, askContinue }) {
  const declined = { partial: null }
  let report = await runWithContinue(
    (child, input, cbs, opts) => runAgent(child, input, cbs, opts), // opts = childRunOpts + resume (managed by the pipeline)
    child, input, childOpts, childRunOpts,
    {
      askContinue,
      onDeclined: (e, output) => {
        if (role === "eng-coder" && child._mutatedThisRun) mergeChildMutations(parent, child)
        // Early return semantics (unchanged from the inline loop): the declined
        // partial-work message is returned WITHOUT the MIN_REPORT_CHARS expansion —
        // re-prompting a capped child for a longer report is wrong.
        // Review #2 fix: use the pipeline-captured output (the `report` variable is
        // still "" at this point — runWithContinue hasn't returned yet).
        declined.partial = `Subagent (${role}) ${TURN_CAP_MARK} (${e.turn} turns) — work may be partial; review recent_changes before deciding next steps.\nPartial output: ${output || ""}`
      },
    },
  )
  if (declined.partial !== null) {
    // declined eng-coder delivery still carries its designId — the fix round
    // re-spawns with the same slot (2026-09-01).
    if (role === "eng-coder") declined.partial += `\ndesignId: ${args.designId ?? "(single-design session — designId optional)"} — reuse it (with the same designToken) when re-spawning this eng-coder.`
    return declined.partial
  }

  // Report too short = incomplete handoff: send back for expansion once (inspired by kimi-code's summaryPolicy: min 200 chars, retry 1 time).
  // The child agent's history is still intact; the continuation instruction is appended as new input so it can see its own earlier work.
  if (report.length < MIN_REPORT_CHARS) {
    report = await runAgent(child, REPORT_CONTINUATION, childOpts, childRunOpts)
  }

  // Engineering mode mechanical code gate: delegated file changes must not
  // bypass the parent's advisor/verify guards. Merge the child's mutations
  // into the parent so "advisor mandatory at both gates" is enforced, not just
  // promised in the engineering prompt.
  // CRITICAL: Only merge if child actually mutated files (defense-in-depth against
  // runAgent throwing before any writes occurred).
  // Review #8 clarification: eng-coder ONLY is intentional — the mechanical
  // two-gate merge exists for engineering mode; plain `coder` children carry
  // their own verify/advisor self-review discipline (per tool description), and
  // normal mode has no parent advisor/verify gate to feed.
  if (role === "eng-coder" && child._mutatedThisRun) {
    mergeChildMutations(parent, child)
  }

  // designId rides the delivery report (2026-09-01): the divergence-audit fix round
  // re-spawns with the SAME designId+token — the parent copies it from here, and the
  // prompt tells the model exactly where the matching token came from.
  if (role === "eng-coder") {
    report += `\ndesignId: ${args.designId ?? "(single-design session — designId optional)"} — reuse this designId with the same designToken (from the approved advisor type='design' review) when re-spawning this eng-coder for an audit fix round.`
  }

  return report
}

/** Slot-queue refill (AGENT-LOOP.md §15 D-A1/D-A6): start queue heads while a
 *  running slot is free — called from every settle (completion frees a slot) and
 *  from the turn-end collection's refill loop. Serial by construction: one slot
 *  frees per settle, one head starts per call. */
export function maybeRefillAsync(parent) {
  const queue = parent._asyncQueue ?? []
  while (queue.length > 0) {
    const running = [...(parent._asyncSubagents?.values() ?? [])].filter((e) => e.status === "running").length
    if (running >= ASYNC_SUBAGENT_LIMIT) return
    queue.shift().start()
  }
}

/**
 * Inject one settled async entry into the parent history as a user-role reminder
 * (§17 D-S3 — single shared form for BOTH consumption points: turn-end collection
 * (collectSettledAsync, agent.mjs) and the run-start _pendingAsyncResults injection;
 * the message shape is identical to the §15 collector's). Consumed = the caller
 * removes the entry from its container; no double-inject across the two paths.
 */
export async function injectAsyncResult(agent, entry) {
  const body = entry.error ?? entry.report ?? "(no report)"
  const preview = await offloadToolResult(String(body), `async-subagent-${entry.id}`)
  pushReal(agent, {
    role: "user",
    content: `[System reminder: async subagent #${entry.id} (${entry.role}) finished]\n${escapeXml(preview)}`,
  })
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
