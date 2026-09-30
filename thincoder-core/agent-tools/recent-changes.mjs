/**
 * recent_changes tool: list files touched by this agent run (write/edit/insert_after/delete).
 * More precise than git status — only looks at this session's changes, independent of git tracking.
 * Helps the model recall what it already modified during long tasks.
 */
// 描述面 = `tool-docs/recent_changes.md`（#15 描述外置统一——DESC 单一解析面，与内置工具族同径）
import { DESC } from "../tools/shared.mjs"

export const recentChangesTool = {
  name: "recent_changes",
  description: DESC("recent_changes"),
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
