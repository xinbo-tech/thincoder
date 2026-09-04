/**
 * plan.mjs — planTool
 * Enter or exit plan mode for read-only exploration.
 */
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
      ctx.callbacks?.onPlanMode?.(true)
      return "Plan mode activated — read-only tools only. Exit plan mode before making changes."
    }
    if (action === "exit") {
      ctx.agent._planMode = false
      ctx.callbacks?.onPlanMode?.(false)
      return "Plan mode deactivated — all tools available."
    }
    return `Error: unknown action "${action}". Use "enter" or "exit".`
  },
}
