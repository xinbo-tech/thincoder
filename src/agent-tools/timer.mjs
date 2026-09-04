/**
 * timer tool: set a time budget for thinking before the agent insists on action.
 * Call this when starting to analyze code or debug — it gives a bounded
 * thinking window. When the timer fires, a system reminder is injected
 * suggesting the model try running code, adding logs, or otherwise acting
 * instead of continuing to think.
 */
export const timerTool = {
  name: "timer",
  description:
    "Set a timer before you start analyzing code. When the timer fires, " +
    "a system reminder will be injected suggesting you try running code or " +
    "adding debug logs. Use this to enforce a thinking budget: you get " +
    "N seconds to reason, then the timer reminds you to act. " +
    "Returns the set confirmation — the reminder fires at the deadline.",
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
    // D15.3#1：默认 180；非法值（非数字/非正数）显式报错——静默 NaN 定时器永不触发的坑
    const seconds = Number(args.seconds ?? 180)
    if (!Number.isFinite(seconds) || seconds <= 0) {
      throw new Error(`timer seconds must be a positive number, got: ${args.seconds}`)
    }
    const expiresAt = Date.now() + seconds * 1000
    const message = args.message || `⏰ Time's up (${seconds}s). Have you tried running the code, adding a console.log, or checking the output? Thinking more without data is guessing.`

    ctx.agent._pendingTimers = ctx.agent._pendingTimers ?? []
    ctx.agent._pendingTimers.push({ id: Date.now(), expiresAt, message })

    return `Timer set for ${seconds} seconds. A reminder will appear when time is up.`
  },
}
