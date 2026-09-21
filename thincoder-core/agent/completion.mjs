/**
 * agent/completion.mjs — handle model response with no tool calls
 *
 * Checks: pending tasks, verify guard, advisor guard.
 * Returns { action: 'continue' | 'done', content?, guardPushbacks, honestReminderInjected, advisorPushbacks }
 */
import { hasCodeMutations } from "../advisor/repos.mjs"
import { pushReal } from "../context.mjs"
import { advisorReviewPending, effectiveAdvisorRound } from "../agent-tools/advisor-async.mjs"

const MAX_VERIFY_PUSHBACKS = 2
const MAX_VERIFY_RETRIES = 3
const MAX_ADVISOR_PUSHBACKS = 3
const MAX_EMPTY_RETRIES = 2

/**
 * Handle a model turn with zero tool calls. May push back (verify/advisor/pending tasks)
 * or accept the completion.
 *
 * @param {object} agent
 * @param {object} response - chat response with .content, .toolCalls
 * @param {number} depth - agent nesting depth (0 = top-level)
 * @param {number} turn - current turn index
 * @param {number} guardPushbacks - verify guard pushback count (mutated)
 * @param {boolean} honestReminderInjected - whether exhausted-verify reminder was already sent (mutated)
 * @param {number} advisorPushbacks - advisor guard pushback count (mutated)
 * @param {object} callbacks - { onTurnEnd }
 */
export function handleCompletion(agent, response, depth, turn, guardPushbacks, honestReminderInjected, advisorPushbacks, callbacks) {
  if (!response.content) {
    // Transient empty response (reasoning exhausted / output truncated): instead of
    // aborting the whole turn, inject a reminder and let the model respond again.
    // Bounded — after MAX_EMPTY_RETRIES consecutive empties, surface the original error.
    const retries = agent._emptyRetries ?? 0
    if (retries < MAX_EMPTY_RETRIES) {
      agent._emptyRetries = retries + 1
      agent.history.push({
        role: "user",
        content: "[System reminder: your last response was empty — the provider returned no content (likely reasoning was exhausted or output was truncated). Respond again, continuing your work from where you left off.]",
      })
      callbacks.onTurnEnd?.(agent, turn)
      return { action: "continue", guardPushbacks, honestReminderInjected, advisorPushbacks }
    }
    throw new Error(
      "LLM returned empty response (likely reasoning exhausted or output truncated). " +
      "Try lowering reasoning effort if this persists (/think in TUI). " +
      `Provider: ${agent.provider.model}`
    )
  }

  // Pending tasks: remind the model ONCE before it declares itself done.
  // Deliberately capped at one pushback (reported pain: unbounded looping when a
  // pending item can't be resolved). After the single reminder the model is free
  // to finish — updating the task list (task tool) resets the budget, so a fresh
  // list state earns one fresh reminder.
  // F10（催更门连带）：工程模式下 task 工具机械停用（装配摘除 + execute 拒）⇒ 不再发指向被拒
  // 工具的提醒（死胡同提醒防线）；列表本体与 `_taskPushbacks` 预算语义零改。
  if (depth === 0 && !agent.config?.agent?.engineering && agent.tasks.some((t) => t.status === "pending") && (agent._taskPushbacks ?? 0) < 1) {
    agent._taskPushbacks = (agent._taskPushbacks ?? 0) + 1
    const pending = agent.tasks.filter((t) => t.status === "pending").map((t) => t.title).join(", ")
    pushReal(agent, { role: "assistant", content: response.content })
    agent.history.push({
      role: "user",
      content: `[System reminder: you still have pending tasks: ${pending}. Update their status with the task tool before finishing — if they're done, mark them done; if they're not applicable, remove them. (This is your only reminder — if you choose not to, finish anyway.)]`,
    })
    callbacks.onTurnEnd?.(agent, turn)
    return { action: "continue", guardPushbacks, honestReminderInjected, advisorPushbacks }
  }

  // --- verify guard: push model to verify mutated files before completion ---
  // OPT-IN ONLY (verifyGuard: true). Engineering mode is excluded because it
  // uses flow-driven review, not per-turn mechanical pushback (ENGINEERING-MODE.md §2.3).
  // Backward compat: also accept root-level verifyGuard
  const verifyGuard = agent.config?.agent?.verifyGuard ?? agent.config?.verifyGuard
  if (depth === 0 && verifyGuard === true && !agent.config?.agent?.engineering) {
    // Not verified yet → pushback to run verify
    if (agent._mutatedThisRun && !agent._verifiedThisRun && hasCodeMutations(agent) && guardPushbacks < MAX_VERIFY_PUSHBACKS) {
      guardPushbacks++
      pushReal(agent, { role: "assistant", content: response.content })
      agent.history.push({
        role: "user",
        content: "[System reminder: you modified files in this run but have not verified the changes. Before finishing: run the project's verification yourself (per its AGENTS.md test method), then call verify declaring the outcome via verification.status. verify mechanically gates on your declaration. If verification is genuinely impossible here, say so explicitly in your reply.]",
      })
      callbacks.onTurnEnd?.(agent, turn)
      return { action: "continue", guardPushbacks, honestReminderInjected, advisorPushbacks }
    }
    // Verified but not passed → pushback to fix/complete (up to MAX_VERIFY_RETRIES).
    // _verifyPassed === false means the declaration was failed, skipped without a
    // reason, or not declared — not necessarily that a test failed.
    if (agent._verifiedThisRun && agent._verifyPassed === false && agent._verifyRetries < MAX_VERIFY_RETRIES) {
      agent._verifyRetries++
      pushReal(agent, { role: "assistant", content: response.content })
      agent.history.push({
        role: "user",
        content: `[System reminder: (retry ${agent._verifyRetries}/${MAX_VERIFY_RETRIES}) verify was not passed — either your verification declared failed, was skipped without a reason, or was not declared. Fix or complete your verification, then call verify again declaring the outcome. If you cannot fix after ${MAX_VERIFY_RETRIES} attempts, explain honestly what's blocking you.]`,
      })
      callbacks.onTurnEnd?.(agent, turn)
      return { action: "continue", guardPushbacks, honestReminderInjected, advisorPushbacks }
    }
    // Exhausted retries — inject honesty reminder once
    if (agent._verifiedThisRun && agent._verifyPassed === false && agent._verifyRetries >= MAX_VERIFY_RETRIES) {
      if (honestReminderInjected) {
        pushReal(agent, { role: "assistant", content: response.content })
        return { action: "done", content: response.content, guardPushbacks, honestReminderInjected, advisorPushbacks }
      }
      honestReminderInjected = true
      pushReal(agent, { role: "assistant", content: response.content })
      agent.history.push({
        role: "user",
        content: `[System reminder: ${MAX_VERIFY_RETRIES} verify attempts exhausted. You have not passed verification. Either state explicitly that your verification could not be completed, or run verify again once it is. If your verification could not be completed, say so explicitly in your reply to the user — state what you tried and what you believe is blocking you, and do not present the work as complete; the user needs to know it is unfinished.]`,
      })
      callbacks.onTurnEnd?.(agent, turn)
      return { action: "continue", guardPushbacks, honestReminderInjected, advisorPushbacks }
    }
  }

  // --- advisor guard: review of mutated files before completion ---
  // OPT-IN ONLY (advisor.guard === true, default OFF — 2026-08-21 semantic
  // refactor), and NEVER in engineering mode. The advisor tool itself is always
  // available; this guard only controls whether completion is pushed back.
  const cfg = agent.config?.advisor
  const advisorReview = cfg?.guard === true
  if (depth === 0 && advisorReview && !agent.config?.agent?.engineering) {
    // §11.2 D-24b (T-24b4 — guard timing): an async review that is still in flight
    // (or queued in the advisor pool) means the review was launched — the guard
    // does NOT push back while it is pending (未决不算未评审); once it settles
    // non-stale it marks _calledAdvisorThisRun, and a STALE settle leaves the
    // mark unset so the guard pushes back here again (fix #2 — no silent skip).
    const pending = advisorReviewPending(agent)
    // rounds 仅作提醒文案显示（撤 cap——轮次不是终止判据；ADVISOR-CONVERGENCE.md §3.1）。
    const rounds = effectiveAdvisorRound(agent)
    if (!pending && agent._mutatedThisRun && !agent._calledAdvisorThisRun && hasCodeMutations(agent)
        && advisorPushbacks < MAX_ADVISOR_PUSHBACKS) {
      advisorPushbacks++
      pushReal(agent, { role: "assistant", content: response.content })
      agent.history.push({
        role: "user",
        content: `[System reminder: you changed code in this run and MUST get an advisor review before finishing (round ${rounds + 1}). Call the \`advisor\` tool now. This is required, not optional — do not skip it even if you believe the changes are trivial — the review will be quick either way. After the review, produce a response table for every issue found (see discipline rules for format).]`,
      })
      callbacks.onTurnEnd?.(agent, turn)
      return { action: "continue", guardPushbacks, honestReminderInjected, advisorPushbacks }
    }
  }

  pushReal(agent, { role: "assistant", content: response.content })
  return { action: "done", content: response.content, guardPushbacks, honestReminderInjected, advisorPushbacks }
}
