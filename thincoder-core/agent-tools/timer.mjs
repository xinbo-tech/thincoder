import { TIMER_MAX_PENDING } from "../agent/timers.mjs"

/**
 * timer tool: set a time budget for thinking before the agent insists on action.
 * Call this when starting to analyze code or debug — it gives a bounded
 * thinking window. When the timer fires, a system reminder is injected
 * suggesting the model try running code, adding logs, or otherwise acting
 * instead of continuing to think.
 *
 * Description = parent-side verbatim text（内容权威——AGENT-LOOP-ASYNC-POOL.md §6.30.3 D-TW8）:
 * 契约句保留 + 补投递形态（在飞回合 = 下一步边界 / 空闲 = 自唤醒，携支持面限定）
 * + 在途帽句；参数 schema 零变。
 */
export const timerTool = {
  name: "timer",
  description:
    "Set a timer before you start analyzing code. When the timer fires, " +
    "a system reminder will be injected suggesting you try running code or " +
    "adding debug logs. Use this to enforce a thinking budget: you get " +
    "N seconds to reason, then the timer reminds you to act. " +
    "Returns the set confirmation — the reminder fires at the deadline. " +
    "Delivery: while a turn is running it lands at the next step boundary; " +
    "when the session is idle it is delivered on the spot and starts a turn — " +
    "the idle wake is available on the CLI foreground and suspension window only " +
    "(other ends keep the step-boundary behavior). " +
    "A pending timer survives across runs; at most 8 timers may be pending at once, " +
    "and further timer calls are rejected until some expire.",
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

    // §6.30.3 门三件②（D-TW6）：在途帽 8——超限显式拒（不静默丢 / 不静默清；形态先例 = 队满
    // 「拒 + 提示 + 保留」）。拒点时在途表零变动（本次不推入）。
    const pending = (ctx.agent._pendingTimers = ctx.agent._pendingTimers ?? [])
    if (pending.length >= TIMER_MAX_PENDING) {
      throw new Error(`timer: ${pending.length} timers already pending (max ${TIMER_MAX_PENDING}) — wait for one to fire before setting another`)
    }
    pending.push({ id: Date.now(), expiresAt, message })

    return `Timer set for ${seconds} seconds. A reminder will appear when time is up.`
  },
}
