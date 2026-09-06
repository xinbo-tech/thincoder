/**
 * recent_changes.mjs — recentChangesTool
 * Show files modified in this agent run.
 */
export const recentChangesTool = {
  name: "recent_changes",
  readonly: true,
  description: "Show files modified in this agent run. Use verify to re-check them. 会话级历史用 read_history。", 
  parameters: { type: "object", properties: {} },
  async execute(_args, ctx) {
    const files = ctx.agent._touchedFiles || []
    if (files.length === 0) return "(no files modified)"
    return files.map((f, i) => `${i + 1}. ${f}`).join("\n")
  },
}
