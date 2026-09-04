/** Common synonyms LLMs tend to use — normalize to canonical values */
const STATUS_ALIASES = {
  completed: "done",
  finished: "done",
  complete: "done",
  done: "done",
  pending: "pending",
  todo: "pending",
  open: "pending",
  waiting: "pending",
  in_progress: "in_progress",
  inprogress: "in_progress",
  active: "in_progress",
  running: "in_progress",
  working: "in_progress",
}

function normalizeStatus(raw) {
  if (!raw) return "pending"
  const key = String(raw).toLowerCase().replace(/[\s_-]+/g, "")
  return STATUS_ALIASES[key] ?? STATUS_ALIASES[raw] ?? null
}

/**
 * task tool: multi-step task planning and progress tracking (Claude Code's todo mode).
 * Each call replaces the entire list; only modifies agent internal state (no external world), so readonly.
 * Accesses the caller agent via ctx.agent (injected by runAgent).
 */
export const taskTool = {
  name: "task",
  description:
    "Plan and track a task list for complex multi-step work. Each call replaces the entire list. " +
    "Keep exactly one item in_progress at a time; mark items done as you complete them; never mark done if tests fail or work is partial. " +
    "Statuses: pending | in_progress | done — synonyms (completed/finished/complete, todo/open/waiting, active/running/working, …) are accepted and normalized with a warning. " +
    "IMPORTANT: title is required and must be a non-empty string — items with empty titles are silently dropped. " +
    "For cross-session / project-level tracking, use checklist. " +
    "Returns the updated task list (or the new item's ID on add).",
  parameters: {
    type: "object",
    properties: {
      items: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            status: { type: "string", enum: ["pending", "in_progress", "done"] },
          },
          required: ["title", "status"],
        },
      },
    },
    required: ["items"],
  },
  readonly: true,
  async execute(args, ctx) {
    // Keep only non-done items + the 3 most recently completed (for context reference), max 20 to prevent accumulation
    const warnings = []
    const raw = (args.items ?? []).map((it) => {
      const normalized = normalizeStatus(it.status)
      if (normalized && normalized !== it.status) {
        warnings.push(`status "${it.status}" normalized to "${normalized}"`)
      } else if (!normalized) {
        warnings.push(`"${it.status}" is not valid (use: pending | in_progress | done)`)
      }
      const title = String(it.title ?? "").trim()
      if (!title) {
        warnings.push(`empty title skipped (item was: ${JSON.stringify(it).slice(0, 100)})`)
      }
      return {
        title,
        status: normalized ?? "pending",
      }
    }).filter((t) => t.title.length > 0)
    const pending = raw.filter((t) => t.status !== "done")
    const recentDone = raw.filter((t) => t.status === "done").slice(-3)
    const items = [...pending, ...recentDone].slice(0, 20)
    ctx.agent.tasks = items
    ctx.agent._taskPushbacks = 0 // task list changed — the completion gate earns a fresh reminder
    ctx.agent._onTaskUpdate?.(items)
    const done = items.filter((i) => i.status === "done").length
    const open = items.length - done
    const warningText = warnings.length > 0 ? ` ⚠️ ${warnings.join("; ")}` : ""
    return `Task list updated: ${done}/${items.length} done` +
      (open > 0 ? ` — ${open} item(s) still open.` : " — all done.") + warningText
  },
}
