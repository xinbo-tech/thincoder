/**
 * timer.mjs — thinking-budget timer (ported from CLI thincoder-cli/src/agent-tools/timer.mjs)
 * Sets a time budget for reasoning. When it expires, a system reminder is injected
 * (by the agent main loop's expired-timer check) suggesting the model act instead of
 * continuing to think. Read-only + side-effect-exempt (does not trigger the verify guard).
 */
export const timerTool = {
  name: "timer",
  description:
    "Set a timer before you start analyzing code. When the timer fires, " +
    "a system reminder will be injected suggesting you try running code or " +
    "adding debug logs. Use this to enforce a thinking budget: you get " +
    "N seconds to reason, then the timer reminds you to act.\n" +
    "Parameters:\n" +
    "- seconds: thinking budget in seconds (default 180 — longer for complex reasoning, shorter for simple tasks)\n" +
    "- message: custom reminder message to show when time is up (default: a suggestion to add debug logs or run the code)",
  parameters: {
    type: "object",
    properties: {
      seconds: {
        type: "number",
        description: "Thinking budget in seconds (default 180). Longer for complex reasoning, shorter for simple tasks.",
      },
      message: {
        type: "string",
        description: "Custom reminder message to show when time is up. Default: a suggestion to add debug logs or run the code.",
      },
    },
    required: [],
  },
  readonly: true,
  sideEffectExempt: true,
  execute(args, ctx) {
    const seconds = args.seconds ?? 180
    const expiresAt = Date.now() + seconds * 1000
    const message = args.message || `⏰ Time's up (${seconds}s). Have you tried running the code, adding a console.log, or checking the output? Thinking more without data is guessing.`

    ctx.agent._pendingTimers = ctx.agent._pendingTimers ?? []
    ctx.agent._pendingTimers.push({ id: Date.now(), expiresAt, message })

    return `Timer set for ${seconds} seconds. A reminder will appear when time is up.`
  },
}
