import { ansi, C } from "./ansi.mjs"

/** /skills command: list project skills.
 *  ctx: { agent, pushLine, pushLabel } */
export async function handleSkillsCommand(ctx) {
  const { agent, pushLine, pushLabel } = ctx
  const { loadSkills } = await import("../skills.mjs")
  const skills = await loadSkills(agent.cwd)
  pushLabel(`❯ Skills`, ansi.bold + C.tool)
  if (skills.length === 0) {
    pushLine(" (no project skills — create .md files under .thincoder/skills/ to add some)", C.dim)
  }
  for (const s of skills) {
    pushLine(`  ${s.name}: ${s.description.slice(0, 100)}`, C.dim)
  }
  pushLine("Activate: tell the agent \"load the <name> skill\"", C.dim)
}
