/** /eng command: toggle engineering mode.
 *  Requires METHODOLOGY.md in project root. Offers to create one if missing.
 *  ctx: { agent, pushLine, pushLabel, persistRaw, showPicker } */
import { existsSync, copyFileSync } from "node:fs"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { ansi, C } from "./ansi.mjs"

const templateDir = join(fileURLToPath(import.meta.url), "..", "..", "prompts")
import { ENG_OFF_REMINDER } from "../agent.mjs"

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
    // OFF must reach the model too (2026-08-25): /auto pushes a reminder on toggle — the
    // mode flip is invisible to the agent otherwise. (ON needs none here: the injector
    // in agent.mjs already announces ON transitions on the next turn.)
    agent._pendingReminders = agent._pendingReminders ?? []
    agent._pendingReminders.push(ENG_OFF_REMINDER)
  }
  await persistRaw((raw) => {
    raw.agent ??= {}
    raw.agent.engineering = agent.config.agent.engineering
  })
  pushLabel("❯ Eng", ansi.bold + C.tool)
  pushLine(`Engineering mode: ${agent.config.agent.engineering ? "ON" : "OFF"}`, C.tool)
  if (agent.config.agent.engineering) {
    pushLine(`  → strictly following ${methodologyPath}`, C.dim)
  }
}
