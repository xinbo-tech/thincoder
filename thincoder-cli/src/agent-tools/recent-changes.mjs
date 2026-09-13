/**
 * recent_changes tool: list files touched by this agent run (write/edit/insert_after/delete).
 * More precise than git status — only looks at this session's changes, independent of git tracking.
 * Helps the model recall what it already modified during long tasks.
 */
export const recentChangesTool = {
  name: "recent_changes",
  description:
    "Show files modified in this agent run (write/edit/insert_after/delete). " +
    "Use when you need to remember which files you've already touched — during long multi-file tasks, " +
    "it's easy to lose track. This is scoped to the current run, unlike git status which shows all uncommitted changes. " +
    "For session-level history (what was said in a session), use read_history.",
  parameters: {
    type: "object",
    properties: {},
  },
  readonly: true,
  execute(args, ctx) {
    const files = ctx.agent._touchedFiles ?? []
    if (files.length === 0) return "(no files modified in this run yet)"
    const deduped = [...new Set(files)]
    return `Touched ${deduped.length} file(s) this run:\n${deduped.join("\n")}`
  },
}
