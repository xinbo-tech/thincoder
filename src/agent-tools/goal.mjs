/**
 * goal.mjs — goalTool
 * Manage a long-running autonomous goal.
 */
export const goalTool = {
  name: "goal",
  readonly: true,
  description:
    "Manage a long-running autonomous goal. For tracking a list of tasks in the current session use task. action=set: create a goal with a verifiable criterion. " +
    "action=complete: mark achieved. action=cancel: abandon.\n" +
    "Parameters:\n" +
    "- action (required): set | complete | cancel\n" +
    "- objective (for set): What to accomplish\n" +
    "- criteria (for set): How completion is PROVEN",
  parameters: {
    type: "object",
    properties: {
      action: { type: "string", enum: ["set", "complete", "cancel"] },
      objective: { type: "string", description: "Goal description (for set)" },
      criteria: { type: "string", description: "Verification criteria (for set)" },
    },
    required: ["action"],
  },
  async execute({ action, objective, criteria }, ctx) {
    if (action === "set") {
      if (!objective) return "Error: objective is required for action=set"
      const c = criteria || "manual verification"
      ctx.agent._goal = { objective, criteria: c, status: "active", turnsUsed: 0 }
      ctx.callbacks?.onGoal?.({ status: "active", objective, criteria: c })
      return `Goal set: ${objective}\nCriteria: ${c}`
    }
    if (action === "complete") {
      if (!ctx.agent._goal) return "Error: no active goal"
      // G13 verify gate (CLI goal.mjs parity): files mutated this run but verify
      // has not run → refuse completion. False completion is the worst outcome of
      // autonomous work — run the check the criteria names AND verify first.
      if (ctx.agent._mutatedThisRun && !ctx.agent._verifiedThisRun) {
        return "Error: files were modified but verify has not run. Run the check your criteria names AND the verify tool before marking the goal complete — false completion is the worst outcome of autonomous work."
      }
      ctx.agent._goal.status = "completed"
      ctx.callbacks?.onGoal?.({ status: "done", objective: ctx.agent._goal.objective, criteria: ctx.agent._goal.criteria })
      return `Goal completed: ${ctx.agent._goal.objective}`
    }
    if (action === "cancel") {
      if (!ctx.agent._goal) return "Error: no active goal"
      const obj = ctx.agent._goal.objective, crit = ctx.agent._goal.criteria
      ctx.agent._goal = null
      ctx.callbacks?.onGoal?.({ status: "cancelled", objective: obj, criteria: crit })
      return `Goal cancelled: ${obj}`
    }
    return `Error: unknown action "${action}". Use "set", "complete", or "cancel".`
  },
}
