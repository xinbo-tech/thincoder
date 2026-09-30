import { TIMER_MAX_PENDING } from "../agent/timers.mjs"
import { DESC } from "../tools/shared.mjs"

/**
 * timer tool: set a time budget for thinking before the agent insists on action.
 * 描述面 = `tool-docs/timer.md`（DESC() 加载；机制 = AGENT-LOOP-ASYNC-POOL.md §6.30.3 D-TW8）。
 */
export const timerTool = {
  name: "timer",
  description: DESC("timer"),
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
