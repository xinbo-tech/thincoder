/**
 * agent/completion.mjs — handle model response with no tool calls
 *
 * Checks: pending tasks, verify guard, advisor guard.
 * Returns { action: 'continue' | 'done', content?, guardPushbacks, honestReminderInjected, advisorPushbacks }
 * 子回合边界（#628）：六推回点各触 `callbacks.onSubTurnBreak?.()` —— 零参可选（缺省 no-op）；`onTurnEnd` 超集语义零改。
 */
import { hasCodeMutations } from "../advisor/repos.mjs"
import { pushReal } from "../context.mjs"
import { advisorReviewPending, effectiveAdvisorRound } from "../agent-tools/advisor-async.mjs"
import { poolLive } from "./suspension.mjs"

const MAX_VERIFY_PUSHBACKS = 2
const MAX_VERIFY_RETRIES = 3
const MAX_ADVISOR_PUSHBACKS = 3
// 层 2（ADVISOR-CONVERGENCE.md §6.4 B）：同一未评审周期的提醒硬上限——续跑与段重启都不回满。
// 取 5 而非 3：进展窗口预算保持原值 3，周期上限再给一次「真改了代码还是漏评审」的宽限。
const MAX_ADVISOR_REMINDERS = 5
const MAX_EMPTY_RETRIES = 2

/**
 * 响应「有实质」判据（单源——判空面与清零面读同一份；AGENT-LOOP.md §6.5① · D-AL28）：有非空正文
 * **或** 有工具调用 ⇒ 实质，两种形都证明「刚才那次空是瞬时的」。此处也是唯一判空式，不另写
 * `.trim() === ""`——两份一漂，判空与清零就不再是同一件事（判空加宽、清零面漏跟）。
 * 「或」不是「且」：带工具调用但正文为空（提供端常见形态）必须判为实质——写成「且」，工具轮就不清零，
 * 空计数跨轮累计，「中间成功过却照样抛」原样留存。
 * @param {object} response - chat response with .content, .toolCalls（同下方 handleCompletion 的既有契约）
 */
export function isSubstantiveResponse(response) {
  return String(response.content ?? "").trim() !== "" || response.toolCalls.length > 0
}

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
 * @param {object} callbacks - { onTurnEnd, onSubTurnBreak }
 */
export function handleCompletion(agent, response, depth, turn, guardPushbacks, honestReminderInjected, advisorPushbacks, callbacks) {
  if (!isSubstantiveResponse(response)) {
    // Transient empty response (reasoning exhausted / output truncated): instead of
    // aborting the whole turn, inject a reminder and let the model respond again.
    // Bounded — after MAX_EMPTY_RETRIES consecutive empties, surface the original error.
    // §6.31.8 F-DA6（#929 同族 · 批 digest-accounting）：空判加宽为**空白判**（纯空白内容
    // 原过判 truthy ⇒ 静默当正常收尾）；既有重试（≤2）/ 抛错骨架零改。
    const retries = agent._emptyRetries ?? 0
    if (retries < MAX_EMPTY_RETRIES) {
      agent._emptyRetries = retries + 1
      agent.history.push({
        role: "user",
        content: "[System reminder: your last response was empty — the provider returned no content (likely reasoning was exhausted or output was truncated). Respond again, continuing your work from where you left off.]",
      })
      callbacks.onSubTurnBreak?.()
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
  // TIMEOUT-DIGEST.md §2.3（#29）：后台池 live 时不推回——池在飞时回合本就还会被 settle 唤醒，
  // 此时催 task 只会拖回合；判据复用 `poolLive`（与挂起尾巴同一口径，不立第二处）。
  if (depth === 0 && !agent.config?.agent?.engineering && !poolLive(agent) && agent.tasks.some((t) => t.status === "pending") && (agent._taskPushbacks ?? 0) < 1) {
    agent._taskPushbacks = (agent._taskPushbacks ?? 0) + 1
    const pending = agent.tasks.filter((t) => t.status === "pending").map((t) => t.title).join(", ")
    pushReal(agent, { role: "assistant", content: response.content })
    agent.history.push({
      role: "user",
      content: `[System reminder: you still have pending tasks: ${pending}. Update their status with the task tool before finishing — if they're done, mark them done; if they're not applicable, remove them. (This is your only reminder — if you choose not to, finish anyway.)]`,
    })
    callbacks.onSubTurnBreak?.()
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
      callbacks.onSubTurnBreak?.()
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
      callbacks.onSubTurnBreak?.()
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
      callbacks.onSubTurnBreak?.()
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
    // AGENT-LOOP-ASYNC-POOL.md §6.10 D-24b (T-24b4 — guard timing): an async review that is still in flight
    // (or queued in the advisor pool) means the review was launched — the guard
    // does NOT push back while it is pending (未决不算未评审); once it settles
    // non-stale it marks _calledAdvisorThisRun, and a STALE settle leaves the
    // mark unset so the guard pushes back here again (fix #2 — no silent skip).
    const pending = advisorReviewPending(agent)
    // rounds 仅作提醒文案显示（撤 cap——轮次不是终止判据；ADVISOR-CONVERGENCE.md §3.1）。
    const rounds = effectiveAdvisorRound(agent)
    // 「未评审即收尾」的四项合取（既有判据逐字零改）+ 两支出口（推回一条 ∥ 任一层停推后的到顶诚实提醒，§6.4 A/B）。
    // `!pending` 同属两支的一部分：异步评审在飞 = 未决，不是未评审——此时推「未经评审」的诚实声明
    // 会与正在跑的评审自相矛盾。
    const unreviewed = !pending && agent._mutatedThisRun && !agent._calledAdvisorThisRun && hasCodeMutations(agent)
    // 层 1（进展窗口，§6.4 A）+ 层 2（未评审周期，§6.4 B）都还有余量 ⇒ 推一条。
    // 计数落 agent：回合环那个 `advisorPushbacks` 是 `runAgent` 局部量，续跑重进即归零（上限形同没设）。
    if (unreviewed && (agent._advisorReminders ?? 0) < MAX_ADVISOR_REMINDERS && advisorPushbacks < MAX_ADVISOR_PUSHBACKS) {
      agent._advisorReminders = (agent._advisorReminders ?? 0) + 1
      advisorPushbacks++
      pushReal(agent, { role: "assistant", content: response.content })
      agent.history.push({
        role: "user",
        content: `[System reminder: you changed code in this run and MUST get an advisor review before finishing (round ${rounds + 1}). Call the \`advisor\` tool now. This is required, not optional — do not skip it even if you believe the changes are trivial — the review will be quick either way. After the review, produce a response table for every issue found (see discipline rules for format).${
          agent._advisorReminders >= MAX_ADVISOR_REMINDERS
            ? ` This is reminder ${MAX_ADVISOR_REMINDERS} of ${MAX_ADVISOR_REMINDERS} — the last one. If you deliver without an advisor review, state explicitly in your reply to the user that this code has not been reviewed.`
            : ""
        }]`,
      })
      callbacks.onSubTurnBreak?.()
      callbacks.onTurnEnd?.(agent, turn)
      return { action: "continue", guardPushbacks, honestReminderInjected, advisorPushbacks }
    }
    // **任一层停推**（层 1 或层 2 耗尽 ⇒ 本轮推不成）⇒ 推**一条**诚实提醒，其后本轮放行收尾。
    // 判据不写成「推满 5 条」：层 1 的预算只在真写了文件时回满（§6.4 A），所以「改过一次代码后只读不写」
    // 是最常见形态——层 1 停在 3 条时只认 5 条的到顶条件永不成真，两支都不进 ⇒ 直接 `done`、零诚实提醒，
    // 正是本机制要挡的「未评审即交付且静默」。
    // 到顶静默放行 = 把「未评审即交付」这条业务失败做成静默成功，而这道 guard 存在的目的就是挡它：
    // 形态照 verify 面到顶（本档上方 `// Exhausted retries — inject honesty reminder once`）——同形、
    // 只换主语，不新增用户可见标记 / 字段 / 配置键。
    // 一次性位的复位口径（§1 20:39 裁定）：位**随新进展复位**——与推回预算同一处（`turn-loop.mjs` 的写序推进
    // 点，两行手拉手），另在本周期两处复位点（新用户回合起点 ∥ 评审覆盖成立处）一并归假。故口径是
    // 「每次停推且仍未评审的收尾恰得一条诚实提醒」——不存在「发过一条之后本周期彻底静默」的第二条静默途径，
    // 而「本轮发过就再也不发」会让「诚实提醒 → 又改代码 → 再收尾」整段不吭声（正是本批要堵的形状）。
    // 文案只陈述事实（几条已发 ∥ 代码未评审 ∥ 二选一），**不**许诺「不再推」——层 1 先耗尽的形态下，
    // 后续有新进展仍会再推提醒（§1 20:39 裁定第二条）。条数取 `?? 0`：复位点 2 清零后层 1 耗尽可达，别读出 undefined。
    if (
      unreviewed
      && ((agent._advisorReminders ?? 0) >= MAX_ADVISOR_REMINDERS || advisorPushbacks >= MAX_ADVISOR_PUSHBACKS)
      && !agent._advisorHonestySent
    ) {
      agent._advisorHonestySent = true
      pushReal(agent, { role: "assistant", content: response.content })
      agent.history.push({
        role: "user",
        content: `[System reminder: ${agent._advisorReminders ?? 0} advisor reminders sent. You have not had this code reviewed. Either call the \`advisor\` tool now, or state explicitly in your reply that this code has not been reviewed — do not present the work as reviewed. The user needs to know it is unreviewed.]`,
      })
      callbacks.onSubTurnBreak?.()
      callbacks.onTurnEnd?.(agent, turn)
      return { action: "continue", guardPushbacks, honestReminderInjected, advisorPushbacks }
    }
  }

  pushReal(agent, { role: "assistant", content: response.content })
  return { action: "done", content: response.content, guardPushbacks, honestReminderInjected, advisorPushbacks }
}
