import { loadSkills, readSkill } from "../skills.mjs"
import { escapeXml } from "../agent.mjs"

/**
 * skill tool: load project skill files on demand (.thincoder/skills/*.md).
 * After loading, skill content is injected into the conversation wrapped in <skill-loaded> for subsequent reference.
 * Use action="list" to see all available skills.
 */
export const skillTool = {
  name: "skill",
  description:
    "Load a project skill from .thincoder/skills/. Skills contain reusable instructions, workflows, or reference material. Use this when the user references a skill by name, or when a task matches a known skill's description. Call with action='list' to see available skills; call with action='load' and name=<skill> to activate one.",
  parameters: {
    type: "object",
    properties: {
      action: { type: "string", enum: ["list", "load"], description: "'list' to see available skills, 'load' to activate one" },
      name: { type: "string", description: "Skill name (for 'load' action)" },
    },
    required: ["action"],
  },
  readonly: true,
  async execute(args, ctx) {
    const skills = await loadSkills(ctx.agent.cwd)
    if (args.action === "list") {
      if (skills.length === 0) return "No project skills found in .thincoder/skills/."
      return skills.map((s) => `- ${s.name}: ${s.description}`).join("\n")
    }
    if (!args.name) return "Error: skill name required for 'load' action."
    // Dedup: skip reloading if history already contains an <skill-loaded> block with the same name
    // (history is the ledger; if it got compacted away we naturally won't find it here — correct behavior)
    if (ctx.agent.history?.some((m) => typeof m.content === "string" && m.content.includes(`<skill-loaded name="${args.name}"`))) {
      return `Skill "${args.name}" is already loaded in this conversation — follow the instructions in the existing <skill-loaded> block above. Do not reload it.`
    }
    const content = await readSkill(ctx.agent.cwd, args.name)
    if (!content) {
      const available = skills.map((s) => s.name).join(", ")
      return `Error: skill "${args.name}" not found. Available: ${available || "(none)"}`
    }
    // Inject skill content into history (will appear as the next user message)
    ctx.agent._pendingReminders = ctx.agent._pendingReminders ?? []
    ctx.agent._pendingReminders.push(
      `<skill-loaded name="${args.name}" source=".thincoder/skills/${args.name}.md">\n${escapeXml(content)}\n</skill-loaded>\n\nFollow the skill's instructions above for the current task.`
    )
    return `Skill "${args.name}" loaded. Instructions will appear in the next message.`
  },
}
