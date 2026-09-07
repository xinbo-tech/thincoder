/**
 * eng tool: enter/exit engineering mode (VS Code port, kept in sync with CLI).
 * In engineering mode the agent follows design-before-code methodology.
 * Persistence is DUAL (2026-08-29): the session SLOT is the authority (engPersist channel:
 * setup passes { cwd, slot } via opts → agent._engPersist) and config.json `agent.engineering`
 * stays as a CLI-compat mirror. Top-level runs carry _engPersist; subagents never do.
 */
import { ENG_ON_REMINDER, ENG_OFF_REMINDER } from "../agent.mjs"
import { persistRaw, conflictError, CONFIG_CONFLICT_HINT } from "../config-io.mjs"
import { setSlotEngineering } from "../extension/session-io.mjs"
import { isExpiredDesignToken } from "./advisor.mjs"

/**
 * R16 (2026-09-06 — ENG-TOKEN-BINDING-TUNING.md §5): a design token is a session-bound,
 * TTL-bound REVIEW-PASSED credential — it survives mode toggles. Only TTL expiry clears
 * it, at exactly three timings: restore filter (setup.mjs), eng(enter) sweep (below) and
 * the spawn gate (subagent.mjs). D5 (2026-09-08): 单值镜像 _engDesignToken 已退役——只扫
 * 多槽 Map（镜像字段不再维护）。Returns how many expired slots were dropped.
 */
function sweepExpiredDesignTokens(agent) {
  const slots = agent._engDesignTokens
  let cleared = 0
  if (slots instanceof Map && slots.size > 0) {
    for (const [id, tok] of [...slots]) {
      if (isExpiredDesignToken(tok)) {
        slots.delete(id)
        cleared++
      }
    }
  }
  return cleared
}

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
      // R16 (2026-09-06 — F-R16a): tokens SURVIVE ON→OFF — no clearing here. Previously
      // _engDesignToken/_engDesignTokens were wiped ("token invalidated"); the approved
      // design review is a session credential that a mode toggle must not burn — only
      // TTL expiry clears it (restore filter / enter sweep / spawn gate — D-R16b).
      ctx.agent._engDesignReviewed = false // reset gate state
      ctx.agent._advisorRound = 0          // reset convergence budget
      ctx.agent._touchedFiles = []         // clear mutation tracking
      ctx.agent._mutatedThisRun = false
      ctx.agent._lastEngState = false
      ctx.agent._pendingReminders = ctx.agent._pendingReminders ?? []
      ctx.agent._pendingReminders.push(ENG_OFF_REMINDER)
      const conflicted = persistEngineering(ctx.agent, false)
      return `Engineering mode exited. Standard discipline now applies. You may edit files directly.${conflicted ? ` ${CONFIG_CONFLICT_HINT} — config.json mirror not written (slot state still holds for this session).` : ""}`
    }
    if (args.action === "enter") {
      // Idempotent enter (v2 2026-08-25): already on → pure no-op (standing tokens survive
      // a redundant defensive eng(enter) — no sweep on the no-op branch, D-R16c ②).
      if (ctx.agent.config.agent.engineering) {
        return "Engineering mode already active. Existing design tokens stay valid."
      }
      ctx.agent.config.agent.engineering = true
      // R16 (F-R16a/F-R16b ②): the REAL off→on conversion must NOT burn valid tokens
      // ("OFF→ON 不重评"); the user's "打开工程模式时清理" ruling lands here as an
      // EXPIRED-only sweep (valid tokens stay usable without a fresh review).
      const cleared = sweepExpiredDesignTokens(ctx.agent)
      ctx.agent._lastEngState = true
      ctx.agent._pendingReminders = ctx.agent._pendingReminders ?? []
      ctx.agent._pendingReminders.push(ENG_ON_REMINDER)
      const conflicted = persistEngineering(ctx.agent, true)
      return `Engineering mode activated. Design-before-code enforced: write a design document in docs/, run advisor with type='design', get user approval, then implement via eng-coder subagents.${cleared > 0 ? ` Cleared ${cleared} expired design token${cleared === 1 ? "" : "s"} (TTL cleanup — valid tokens stay valid across mode switches).` : ""}${conflicted ? ` ${CONFIG_CONFLICT_HINT} — config.json mirror not written (slot state still holds for this session).` : ""}`
    }
    return "Invalid action: expected 'enter' or 'exit'"
  },
}

/**
 * Dual persistence (2026-08-29): slot first (session authority), config.json mirror second
 * (CLI compat). A slot write failure must not break the config write — and vice versa the
 * in-memory flag (already flipped by execute) always holds for the rest of this run.
 * Returns true when the config mirror write hit an F5b mtime conflict (abandoned — caller
 * surfaces the retry hint).
 */
function persistEngineering(agent, enabled) {
  try {
    const p = agent._engPersist
    if (p) setSlotEngineering(p.cwd, p.slot, enabled)
  } catch { /* slot unwritable — config mirror still written */ }
  try {
    const r = persistRaw((raw) => {
      raw.agent = raw.agent && typeof raw.agent === "object" ? raw.agent : {}
      raw.agent.engineering = enabled
    })
    return !!conflictError(r) // F5b：config 并发被改 → 放弃镜像写（slot 权威仍持态）
  } catch { /* config unreadable — in-memory state still holds for this run */ }
  return false
}
