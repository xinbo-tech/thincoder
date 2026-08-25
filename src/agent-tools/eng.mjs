/**
 * eng tool: enter/exit engineering mode.
 * In engineering mode the agent follows design-before-code methodology.
 * Toggled here at session level; persisted by /eng.
 */
import { ENG_ON_REMINDER, ENG_OFF_REMINDER } from "../agent.mjs"

export const engTool = {
  name: "eng",
  description:
    "Enter or exit engineering mode. In engineering mode, follow design-before-code: write a design document, run advisor design review, get user approval, then implement via eng-coder subagents.",
  parameters: {
    type: "object",
    properties: {
      action: { type: "string", enum: ["enter", "exit"], description: "Enter or exit engineering mode" },
    },
    required: ["action"],
  },
  readonly: true,
  async execute(args, ctx) {
    ctx.agent.config.agent ??= {}
    if (args.action === "exit") {
      ctx.agent.config.agent.engineering = false
      ctx.agent._engDesignToken = null   // stale token from prior design review invalidated
      ctx.agent._engDesignReviewed = false // reset gate state
      ctx.agent._advisorRound = 0          // reset convergence budget
      ctx.agent._touchedFiles = []         // clear mutation tracking
      ctx.agent._lastEngState = false
      ctx.agent._pendingReminders = ctx.agent._pendingReminders ?? []
      ctx.agent._pendingReminders.push(ENG_OFF_REMINDER)
      // 持久化工程模式状态到会话
      if (ctx.persistState) {
        await ctx.persistState({
          engineering: false,
          engDesignToken: null,
          engDesignReviewed: false,
          advisorRound: 0,
          touchedFiles: []
        })
      }
      return "Engineering mode exited. Standard discipline now applies. You may edit files directly."
    }
    if (args.action === "enter") {
      // Idempotent enter (v2 2026-08-25): already in engineering mode → no-op. The old
      // unconditional token clear killed standing design tokens on a redundant defensive
      // eng(enter) — only a real off→on transition requires a fresh design review.
      if (ctx.agent.config.agent.engineering) {
        return "Engineering mode already active. Existing design tokens stay valid."
      }
      ctx.agent.config.agent.engineering = true
      ctx.agent._engDesignToken = null   // off→on transition requires a fresh design review
      ctx.agent._lastEngState = true
      ctx.agent._pendingReminders = ctx.agent._pendingReminders ?? []
      ctx.agent._pendingReminders.push(ENG_ON_REMINDER)
      // 持久化工程模式状态到会话
      if (ctx.persistState) {
        await ctx.persistState({
          engineering: true,
          engDesignToken: null,
          engDesignReviewed: false,
          advisorRound: 0,
          touchedFiles: []
        })
      }
      return "Engineering mode activated. Design-before-code enforced: write a design document in docs/, run advisor with type='design', get user approval, then implement via eng-coder subagents."
    }
    return "Invalid action: expected 'enter' or 'exit'"
  },
}
