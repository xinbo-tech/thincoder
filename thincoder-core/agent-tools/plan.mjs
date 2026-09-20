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
 * ENG-PLAN-EXCLUSION（FR31 ② · 设计 `docs/core/design/ENGINEERING-MODE-V2.md` §2.3 E7）：
 * 工程模式下 plan 面的**拒绝文案**——TUI `/plan`（`thincoder-cli/src/tui/cmd-plan.mjs`）与
 * ACP `session/set_mode` / `session/set_config_option`（`thincoder-cli/src/acp/handlers-session.mjs`）
 * 两面**共用一条**（D2 单源；VSC 面板面提示 = webview i18n 键 `toolbar.planDisabled`）。
 */
export const PLAN_ENGINEERING_REFUSED =
  "plan mode is disabled in engineering mode — engineering mode already runs design-before-code (design → review → approval → implementation)."

/** ENG-PLAN-EXCLUSION（FR31 ③ · KD10）：未注入 plan 提示语判据 = 三条 reminder 常量逐字组成员。 */
const isPlanReminder = (r) => r === PLAN_FULL_REMINDER || r === PLAN_SPARSE_REMINDER || r === PLAN_EXIT_REMINDER

/**
 * ENG-PLAN-EXCLUSION（FR31 ③ / KD10——单点复用）：工程模式 ⇒ `planMode` 恒 false。
 * 清 `planMode` + 两 reminder 计数 + **未注入的 plan 提示语**（`_pendingReminders` 中的三条
 * plan 提醒——否则排队的 `PLAN_EXIT_REMINDER`「Start implementing your plan …」会在模式翻转后
 * 落地，与工程链条打架）。五个挂点复用本函数：三翻转（核 `eng` 工具 / CLI `/eng` / VSC 面板开关）
 * + 两恢复（CLI `applySession` / VSC `applySlotSessionState`）。
 * @param {object} agent — 会话 agent（就地改写）
 * @returns {boolean} 是否清掉了实况（planMode 曾为 true / 有排队 plan 提示语）——调用方按需提示
 */
export function clearPlanMode(agent) {
  if (!agent) return false
  const queued = Array.isArray(agent._pendingReminders) ? agent._pendingReminders.filter(isPlanReminder).length : 0
  const had = agent.planMode === true || queued > 0
  agent.planMode = false
  agent._planTurnsSinceReminder = 0
  agent._planTurnsSinceSparse = 0
  if (Array.isArray(agent._pendingReminders)) {
    agent._pendingReminders = agent._pendingReminders.filter((r) => !isPlanReminder(r))
  }
  return had
}

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
    // §2.5 #85（已裁 · 以 VSC 为准）：未知 action 明确报错——旧行为（非 exit 一律进 plan
    // 模式）把拼错的 action 当成 enter，静默改写会话状态。
    if (args.action === "exit") {
      ctx.agent.planMode = false
      ctx.agent._planTurnsSinceReminder = 0
      ctx.agent._pendingReminders = ctx.agent._pendingReminders ?? []
      ctx.agent._pendingReminders.push(PLAN_EXIT_REMINDER)
      return "Plan mode exited. You may now edit files and run commands."
    }
    if (args.action !== "enter") {
      return `Error: unknown action "${args.action}". Use "enter" or "exit".`
    }
    ctx.agent.planMode = true
    ctx.agent._planTurnsSinceReminder = 0
    ctx.agent._pendingReminders = ctx.agent._pendingReminders ?? []
    ctx.agent._pendingReminders.push(PLAN_FULL_REMINDER)
    return "Plan mode activated. You are now restricted to READ-ONLY tools. Explore the codebase, understand the architecture, design a solution. Present your plan to the user for approval before writing any code."
  },
}
