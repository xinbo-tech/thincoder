/**
 * agent/completion.mjs — handle model response with no tool calls
 *
 * Checks: pending tasks, verify guard, advisor guard.
 * Returns { action: 'continue' | 'done', content?, guardPushbacks, honestReminderInjected, advisorPushbacks }
 */
import { hasCodeMutations } from "../advisor/repos.mjs"
import { pushReal } from "../context.mjs"
import { MAX_ADVISOR_ROUNDS } from "../advisor/run.mjs"

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
  if (depth === 0 && agent.tasks.some((t) => t.status === "pending") && (agent._taskPushbacks ?? 0) < 1) {
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
        content: "[System reminder: you modified files in this run but have not verified the changes. Before finishing: call the verify tool to run syntax checks and tests. If verify reports failures, fix them and run verify again. If verification is genuinely impossible here, say so explicitly in your reply.]",
      })
      callbacks.onTurnEnd?.(agent, turn)
      return { action: "continue", guardPushbacks, honestReminderInjected, advisorPushbacks }
    }
    // Verified but still failing → pushback to fix (up to MAX_VERIFY_RETRIES)
    if (agent._verifiedThisRun && agent._verifyPassed === false && agent._verifyRetries < MAX_VERIFY_RETRIES) {
      agent._verifyRetries++
      pushReal(agent, { role: "assistant", content: response.content })
      agent.history.push({
        role: "user",
        content: `[System reminder: verify reported test failures (retry ${agent._verifyRetries}/${MAX_VERIFY_RETRIES}). Review the failures, fix the issues, then run verify again. If you cannot fix after ${MAX_VERIFY_RETRIES} attempts, explain honestly what's blocking you.]`,
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
        content: `[System reminder: ${MAX_VERIFY_RETRIES} verify attempts exhausted and tests are still failing. In your response to the user, you MUST state explicitly: (1) what tests are still failing, (2) what you tried, (3) what you believe the root cause is. Do not present this as complete — the user needs to know the work is unfinished.]`,
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
    // Cap sync: beyond MAX_ADVISOR_ROUNDS the advisor tool refuses to review
    // (run.mjs convergence cap) — pushing back further would loop forever
    // (fix → pushback → cap-refused call → fix …). The cap message from the
    // last accepted review stands; the user decides manually.
    if (agent._mutatedThisRun && !agent._calledAdvisorThisRun && hasCodeMutations(agent)
        && advisorPushbacks < MAX_ADVISOR_PUSHBACKS
        && (agent._advisorRound || 0) < MAX_ADVISOR_ROUNDS) {
      advisorPushbacks++
      pushReal(agent, { role: "assistant", content: response.content })
      agent.history.push({
        role: "user",
        content: `[System reminder: you changed code in this run and MUST get an advisor review before finishing (round ${agent._advisorRound + 1}). Call the \`advisor\` tool now. This is required, not optional — do not skip it even if you believe the changes are trivial — the review will be quick either way. After the review, produce a response table for every issue found (see discipline rules for format).]`,
      })
      callbacks.onTurnEnd?.(agent, turn)
      return { action: "continue", guardPushbacks, honestReminderInjected, advisorPushbacks }
    }
  }

  pushReal(agent, { role: "assistant", content: response.content })
  return { action: "done", content: response.content, guardPushbacks, honestReminderInjected, advisorPushbacks }
}
