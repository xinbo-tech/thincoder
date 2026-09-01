/** /eng command: toggle engineering mode.
 *  Requires METHODOLOGY.md in project root. Offers to create one if missing.
 *  ctx: { agent, pushLine, pushLabel, persistRaw, showPicker } */
import { existsSync, copyFileSync, readFileSync, writeFileSync, mkdirSync, renameSync, unlinkSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { ansi, C } from "./ansi.mjs"
import { activeSlot, slotPath } from "../session.mjs"

const templateDir = join(fileURLToPath(import.meta.url), "..", "..", "prompts")
import { ENG_OFF_REMINDER } from "../agent.mjs"

/** Atomic slot write (same shape as session.mjs writeSessionFile — kept local to avoid a
 *  private-import; cmd-advisor's guard toggle shares this helper). */
export function writeSessionFile(p, data) {
  mkdirSync(dirname(p), { recursive: true })
  const tmp = `${p}.tmp`
  writeFileSync(tmp, JSON.stringify(data), "utf8")
  try {
    renameSync(tmp, p)
  } catch {
    try { unlinkSync(p) } catch {}
    try { renameSync(tmp, p) } catch { writeFileSync(p, readFileSync(tmp, "utf8"), "utf8") }
  }
}

export async function handleEngCommand(ctx) {
  const { agent, pushLine, pushLabel, persistRaw, showPicker } = ctx
  agent.config.agent ??= {}
  const methodologyPath = join(agent.cwd, "METHODOLOGY.md")

  // Toggle on: check METHODOLOGY.md exists
  if (!agent.config.agent.engineering) {
    if (!existsSync(methodologyPath)) {
      pushLabel("❯ Eng", ansi.bold + C.tool)
      pushLine("METHODOLOGY.md not found in project root.", C.warn)
      const choice = await showPicker("Create METHODOLOGY.md?", [
        { type: "header", text: "Engineering mode requires a methodology file" },
        { type: "item", text: "Yes, create from template", action: "create" },
        { type: "item", text: "No, cancel", action: "cancel" },
      ])
      if (!choice || choice.action !== "create") return
      const src = join(templateDir, "methodology-template.md")
      copyFileSync(src, methodologyPath)
      pushLine(`Created METHODOLOGY.md (from template) → edit it to fit your project`, C.tool)
    }
  }

  agent.config.agent.engineering = !agent.config.agent.engineering
  if (!agent.config.agent.engineering) {
    agent._engDesignToken = null // invalidate stale token
    agent._engDesignTokens = new Map() // multi-design slots die with the mode (2026-09-01 fix #2)
    // OFF must reach the model too (2026-08-25): /auto pushes a reminder on toggle — the
    // mode flip is invisible to the agent otherwise. (ON needs none here: the injector
    // in agent.mjs already announces ON transitions on the next turn.)
    agent._pendingReminders = agent._pendingReminders ?? []
    agent._pendingReminders.push(ENG_OFF_REMINDER)
  }
  await persistEngineering(ctx, agent)
  pushLabel("❯ Eng", ansi.bold + C.tool)
  pushLine(`Engineering mode: ${agent.config.agent.engineering ? "ON" : "OFF"} (session)`, C.tool)
  if (agent.config.agent.engineering) {
    pushLine(`  → strictly following ${methodologyPath}`, C.dim)
  }
}

/**
 * Dual persistence (2026-08-29 — engineering is session-level): write the flipped flag into
 * the CURRENT session slot first (slot authority — shared with VS Code, per-session), then
 * the config.json mirror (CLI visibility/compat; no longer the cross-session source of truth).
 * The in-memory agent.config.agent.engineering (already flipped) stays the live authority for
 * this process; saveSession also round-trips it on every turn-end write.
 */
async function persistEngineering(ctx, agent) {
  const slot = activeSlot(agent.cwd)
  try {
    const p = slotPath(agent.cwd, slot)
    const data = JSON.parse(readFileSync(p, "utf8"))
    if (data && typeof data === "object" && Array.isArray(data.history)) {
      data.engineering = agent.config.agent.engineering
      writeSessionFile(p, data)
    }
  } catch { /* slot missing/unreadable — config mirror still written */ }
  if (ctx.persistRaw) {
    await ctx.persistRaw((raw) => {
      raw.agent ??= {}
      raw.agent.engineering = agent.config.agent.engineering
    })
  }
}
