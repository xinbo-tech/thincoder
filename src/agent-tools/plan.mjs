/**
 * plan.mjs — planTool + plan-mode reminder cadence（D-CI4：port CLI agent-tools/plan.mjs
 * 全部件——三常量文案逐字 / SPARSE_INTERVAL=2 / FULL_INTERVAL=5 / 计数语义逐条。
 * 本端字段差异（沿用既有）：plan mode 存 `ctx.agent._planMode`（CLI 用 `agent.planMode`）。
 *
 * Reminder cadence (kimi-code style): while plan mode is active the agent loop
 * re-injects reminders — sparse every 2 turns, full every 5 turns or when the
 * user sends a new message — so the constraint never fades from context.
 */

const PLAN_FULL_REMINDER =
  "[System reminder: plan mode is ON. Workflow: (1) explore/read codebase with read-only tools, " +
  "(2) design a solution considering trade-offs, (3) present your plan by calling plan with action='exit' " +
  "so the user can approve it. Only read-only tools are allowed — do not write, edit, or run mutation commands. " +
  "Your turn must end with either a clarifying question to the user or a call to plan with action='exit'.]"

const PLAN_SPARSE_REMINDER =
  "[System reminder: plan mode still active — read-only tools only (the current plan file exempt). " +
  "Design the solution, then call plan with action='exit' for user approval.]"

const PLAN_EXIT_REMINDER =
  "[System reminder: plan mode is now OFF. Start implementing your plan — edit files, run commands. " +
  "No need for a task list (plan already covered that) or further confirmation.]"

/** Turns between reminder re-injections while plan mode is active */
const SPARSE_INTERVAL = 2
const FULL_INTERVAL = 5

/**
 * Decide which plan-mode reminder (if any) to inject this turn.
 * @param {object} agent — the agent object (mutated: tracks reminder state)
 * @param {boolean} userMessageSince — whether a user message arrived since the last reminder
 * @returns {string|null} reminder text or null
 */
export function planReminderForTurn(agent, userMessageSince) {
  if (!agent._planMode) {
    agent._planTurnsSinceReminder = 0
    agent._planTurnsSinceSparse = 0
    return null
  }
  agent._planTurnsSinceReminder = (agent._planTurnsSinceReminder ?? 0) + 1
  agent._planTurnsSinceSparse = (agent._planTurnsSinceSparse ?? 0) + 1
  if (userMessageSince || agent._planTurnsSinceReminder >= FULL_INTERVAL) {
    agent._planTurnsSinceReminder = 0
    agent._planTurnsSinceSparse = 0
    return PLAN_FULL_REMINDER
  }
  if (agent._planTurnsSinceSparse >= SPARSE_INTERVAL) {
    agent._planTurnsSinceSparse = 0
    return PLAN_SPARSE_REMINDER
  }
  return null
}

export const planTool = {
  readonly: true,
  name: "plan",
  description:
    "Enter or exit plan mode. In plan mode, only read-only tools are allowed. Use before complex multi-step work — explore the codebase and present a plan; exit plan mode to implement (the user approves first).\n" +
    "Parameters:\n" +
    "- action (required): enter | exit",
  parameters: {
    type: "object",
    properties: {
      action: { type: "string", enum: ["enter", "exit"] },
    },
    required: ["action"],
  },
  async execute({ action }, ctx) {
    if (action === "enter") {
      ctx.agent._planMode = true
      ctx.agent._planTurnsSinceReminder = 0
      ctx.agent._pendingReminders = ctx.agent._pendingReminders ?? []
      ctx.agent._pendingReminders.push(PLAN_FULL_REMINDER)
      ctx.callbacks?.onPlanMode?.(true)
      return "Plan mode activated. You are now restricted to READ-ONLY tools. Explore the codebase, understand the architecture, design a solution. Present your plan to the user for approval before writing any code."
    }
    if (action === "exit") {
      ctx.agent._planMode = false
      ctx.agent._planTurnsSinceReminder = 0
      ctx.agent._pendingReminders = ctx.agent._pendingReminders ?? []
      ctx.agent._pendingReminders.push(PLAN_EXIT_REMINDER)
      ctx.callbacks?.onPlanMode?.(false)
      return "Plan mode exited. You may now edit files and run commands."
    }
    return `Error: unknown action "${action}". Use "enter" or "exit".`
  },
}
