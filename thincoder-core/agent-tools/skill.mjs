import { loadSkills, readSkill } from "../skills.mjs"
import { escapeXml } from "../agent.mjs"

// ─── skill loader 注入缝（#88——「同步 loader 面按核内结构归一」的端侧覆盖面）──────────
/**
 * skill loader 注入位（**缺省不覆盖** = 核内异步 loader——CLI 语义，零行为变；端装配层
 * 可覆盖为端形态（如核内同步面 `loadSkillsSync` / `readSkillSync` 的绑定）。核内零端名分支
 * （契约 5——本档只认 `loadSkills` / `readSkill` 两函数名）。
 * 契约：两键均可选；给了就用，缺键回核内默认；同步 / 异步返回值均可（内部 await）。
 */
let injectedLoader = null
export function configureSkillLoader(impl) {
  injectedLoader = impl && typeof impl === "object" ? impl : null
}
/** 撤销注入（测试与端装配生命周期用——缺省态 = 核内异步 loader）。 */
export function resetSkillLoader() { injectedLoader = null }

/**
 * skill tool: load project skill files on demand (.thincoder/skills/*.md).
 * After loading, skill content is injected into the conversation wrapped in <skill-loaded> for subsequent reference.
 * Use action="list" to see all available skills.
 */
export const skillTool = {
  name: "skill",
  description:
    "Load a project skill from .thincoder/skills/. Skills contain reusable instructions, workflows, or reference material. Use this when the user references a skill by name, or when a task matches a known skill's description. Call with action='list' to see available skills; call with action='load' and name=<skill> to activate one. " +
    "Returns the skill list ('list'), the load confirmation ('load' — instructions arrive in the next message), or Error: ... with the available skills.",
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
    const loadSkillsFn = typeof injectedLoader?.loadSkills === "function" ? injectedLoader.loadSkills : loadSkills
    const readSkillFn = typeof injectedLoader?.readSkill === "function" ? injectedLoader.readSkill : readSkill
    const skills = await loadSkillsFn(ctx.agent.cwd)
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
    const content = await readSkillFn(ctx.agent.cwd, args.name)
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
