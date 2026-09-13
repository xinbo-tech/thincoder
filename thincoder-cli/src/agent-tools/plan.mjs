/**
 * plan tool: enter/exit plan mode.
 * In plan mode only read-only tools are allowed — explore code, design solutions, no code writing.
 * After the user approves the plan, exit plan mode and start implementing.
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
  if (!agent.planMode) {
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
  name: "plan",
  description:
    "Enter or exit plan mode. In plan mode you are restricted to READ-ONLY tools: read files, search code, run read-only shell commands. Use plan mode before complex multi-step tasks — explore the codebase, design the architecture, present a plan to the user. When the user approves, exit plan mode and implement. For simple single-file edits, skip plan mode and just make the change.",
  parameters: {
    type: "object",
    properties: {
      action: { type: "string", enum: ["enter", "exit"], description: "Enter or exit plan mode" },
    },
    required: ["action"],
  },
  readonly: true,
  async execute(args, ctx) {
    if (args.action === "exit") {
      ctx.agent.planMode = false
      ctx.agent._planTurnsSinceReminder = 0
      ctx.agent._pendingReminders = ctx.agent._pendingReminders ?? []
      ctx.agent._pendingReminders.push(PLAN_EXIT_REMINDER)
      return "Plan mode exited. You may now edit files and run commands."
    }
    ctx.agent.planMode = true
    ctx.agent._planTurnsSinceReminder = 0
    ctx.agent._pendingReminders = ctx.agent._pendingReminders ?? []
    ctx.agent._pendingReminders.push(PLAN_FULL_REMINDER)
    return "Plan mode activated. You are now restricted to READ-ONLY tools. Explore the codebase, understand the architecture, design a solution. Present your plan to the user for approval before writing any code."
  },
}
