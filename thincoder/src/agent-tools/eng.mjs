/**
 * eng tool: enter/exit engineering mode.
 * In engineering mode the agent follows design-before-code methodology.
 * Toggled here at session level (in-memory flag; the session slot is the sole authority —
 * saveSession round-trips it at turn end; /eng writes the slot directly). The old ctx
 * state-persist hook was removed 2026-09-08 (ENG-SESSION-PROVIDER-CLEANUP D1.2): no
 * provider existed and its legacy payload keys were never read by applySession.
 * R16 (2026-09-06): design tokens are session-level flow credentials — mode toggles
 * do NOT clear them (ON→OFF keeps, OFF→ON does not require a fresh review); only TTL
 * expiry cleans tokens, at three points: restore filtering (session.mjs applySession) /
 * eng enter expired cleanup (below + cmd-eng ON) / spawn-gate expired rejection
 * (subagent-spawn.mjs). See docs/design/ENG-TOKEN-BINDING-TUNING.md §5/§5.1 (F-R16).
 */
import { ENG_ON_REMINDER, ENG_OFF_REMINDER } from "../agent.mjs"
import { purgeExpiredDesignTokens } from "../token-ttl.mjs"

export const engTool = {
  name: "eng",
  description:
    "Enter or exit engineering mode. In engineering mode, follow design-before-code: write a design document, run advisor design review, get user approval, then implement via eng-coder subagents. " +
    "Returns the mode state — 'Engineering mode activated/exited' (an already-active state is acknowledged).",
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
      // R16 (F-R16a): OFF 不清 token——有效 token 跨模式存活（设计评审过的产物不因
      // 开关重复烧）。过期清理跑在另外三处（恢复过滤 / 开模式 / spawn 门禁拒）。
      ctx.agent._advisorRound = 0          // reset convergence budget
      ctx.agent._advisorRuns = new Map()   // §11.2 D-24b: per-review instances die with the mode (fresh cycles)
      ctx.agent._touchedFiles = []         // clear mutation tracking
      ctx.agent._lastEngState = false
      ctx.agent._pendingReminders = ctx.agent._pendingReminders ?? []
      ctx.agent._pendingReminders.push(ENG_OFF_REMINDER)
      return "Engineering mode exited. Standard discipline now applies. You may edit files directly."
    }
    if (args.action === "enter") {
      // Idempotent enter (v2 2026-08-25): already in engineering mode → pure no-op
      // (cleanup only runs on a real off→on transition — T-R16c precondition: first
      // exit/OFF, then enter; an already-on enter must not touch tokens at all).
      if (ctx.agent.config.agent.engineering) {
        return "Engineering mode already active. Existing design tokens stay valid."
      }
      ctx.agent.config.agent.engineering = true
      // R16 (F-R16b ②): off→on 不重评——只清过期 token（用户裁定"打开工程模式时
      // 应该清理"），有效 token 原样保留——遍历 Map 删过期，返回文案含清理个数。
      const cleared = purgeExpiredDesignTokens(ctx.agent)
      ctx.agent._advisorRuns = new Map() // §11.2 D-24b: per-review instances die with the mode (fresh cycles)
      ctx.agent._lastEngState = true
      ctx.agent._pendingReminders = ctx.agent._pendingReminders ?? []
      ctx.agent._pendingReminders.push(ENG_ON_REMINDER)
      let msg = "Engineering mode activated. Design-before-code enforced: write a design document first (location per your project's document conventions), run advisor with type='design', get user approval, then implement via eng-coder subagents."
      if (cleared > 0) {
        msg += ` Cleared ${cleared} expired design token${cleared === 1 ? "" : "s"} — 清 ${cleared} 个过期 token，有效 token 保留（TTL 内不重评）。`
      }
      return msg
    }
    return "Invalid action: expected 'enter' or 'exit'"
  },
}
