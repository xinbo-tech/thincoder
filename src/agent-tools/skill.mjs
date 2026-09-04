/**
 * skill.mjs — skillTool
 * Load a project skill from .thincoder/skills/.
 */
import { readFileSync, readdirSync, existsSync } from "node:fs"
import { join } from "node:path"

export const skillTool = {
  name: "skill",
  readonly: true,
  description:
    "Load a project skill from .thincoder/skills/. Skills contain reusable instructions; use memory (put) to persist conventions and preferences across sessions.\n" +
    "Parameters:\n" +
    "- action: list (show available) | load (activate one by name)\n" +
    "- name: Skill name (for load)",
  parameters: {
    type: "object",
    properties: {
      action: { type: "string", enum: ["list", "load"] },
      name: { type: "string", description: "Skill name (for load)" },
    },
    required: ["action"],
  },
  async execute({ action, name }, ctx) {
    const skillsDir = join(ctx.cwd, ".thincoder", "skills")
    if (!existsSync(skillsDir)) return "(no .thincoder/skills/ directory in this project)"

    if (action === "list") {
      try {
        const files = readdirSync(skillsDir, { recursive: true }).filter((f) => f.endsWith(".md"))
        if (files.length === 0) return "(no skills found)"
        return files.join("\n")
      } catch (e) {
        return `Error listing skills: ${e.message}`
      }
    }

    if (action === "load" && name) {
      const safeName = name.replace(/[^a-zA-Z0-9_-]/g, "_")
      const filePath = join(skillsDir, `${safeName}.md`)
      if (!existsSync(filePath)) return `Skill "${name}" not found at .thincoder/skills/${safeName}.md`
      try {
        const content = readFileSync(filePath, "utf8")
        return `Skill loaded: ${name}\n\n${content.slice(0, 8000)}`
      } catch (e) {
        return `Error loading skill: ${e.message}`
      }
    }

    return "Error: use action=list or action=load with name"
  },
}
