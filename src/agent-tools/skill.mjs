/**
 * skill.mjs — skillTool（D-CI8：对齐 cli agent-tools/skill.mjs:23-46 注入形态——
 * 去重 → `<skill-loaded>` XML 转义 + `_pendingReminders` 注入（user 消息——下回合可见）
 * + 不截断（旧固定长度截断退役）+ 未命中同形错误句）。
 * Loader 语义（含 name/SKILL.md）与列表格式复用 ../extension/skills.mjs（D-CI3）。
 */
import { loadSkills, readSkill } from "../extension/skills.mjs"
import { escapeXml } from "../agent/run-helpers.mjs"

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
  async execute(args, ctx) {
    const cwd = ctx.cwd ?? ctx.agent?.cwd
    const skills = loadSkills(cwd)
    if (args.action === "list") {
      if (skills.length === 0) return "No project skills found in .thincoder/skills/."
      return skills.map((s) => `- ${s.name}: ${s.description}`).join("\n")
    }
    if (!args.name) return "Error: skill name required for 'load' action."
    // Dedup: skip reloading if history already contains an <skill-loaded> block with the same name
    // (history is the ledger; if it got compacted away we naturally won't find it here — correct behavior)
    if (ctx.agent?.history?.some((m) => typeof m.content === "string" && m.content.includes(`<skill-loaded name="${args.name}"`))) {
      return `Skill "${args.name}" is already loaded in this conversation — follow the instructions in the existing <skill-loaded> block above. Do not reload it.`
    }
    const content = readSkill(cwd, args.name)
    if (!content) {
      const available = skills.map((s) => s.name).join(", ")
      return `Error: skill "${args.name}" not found. Available: ${available || "(none)"}`
    }
    // Inject the skill content into history (it will appear as the next user message) —
    // XML-escaped, no truncation (CLI parity).
    ctx.agent._pendingReminders = ctx.agent._pendingReminders ?? []
    ctx.agent._pendingReminders.push(
      `<skill-loaded name="${args.name}" source=".thincoder/skills/${args.name}.md">\n${escapeXml(content)}\n</skill-loaded>\n\nFollow the skill's instructions above for the current task.`
    )
    return `Skill "${args.name}" loaded. Instructions will appear in the next message.`
  },
}
