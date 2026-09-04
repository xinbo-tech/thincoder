/**
 * task.mjs — taskTool
 * Plan and track a task list for complex multi-step work.
 */

/** Common synonyms LLMs tend to use — normalize to canonical values (CLI parity). */
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

export const taskTool = {
  name: "task",
  readonly: true,
  description:
    "Plan and track a task list for complex multi-step work. Each call replaces the entire list. " +
    "Keep exactly one item in_progress at a time. Statuses: pending | in_progress | done — accepts aliases (completed/finished/…) normalized with a warning. " +
    "For cross-session / project-level tracking, use checklist.\n" +
    "Parameters:\n" +
    "- items (required): Array of { title: string, status: pending|in_progress|done }",
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
  async execute({ items }, ctx) {
    // Status alias normalization (CLI STATUS_ALIASES mirror, D15.3#4): aliases
    // like completed/finished/active are accepted and normalized with a warning
    // instead of being rejected or silently passed through.
    const warnings = []
    const normalized = (items ?? []).map((it) => {
      const st = normalizeStatus(it.status)
      if (st && st !== it.status) warnings.push(`status "${it.status}" normalized to "${st}"`)
      else if (!st && it.status != null) warnings.push(`"${it.status}" is not valid (use: pending | in_progress | done)`)
      return { title: it.title, status: st ?? "pending" }
    })
    ctx.agent._tasks = normalized
    ctx.agent._taskPushbacks = 0 // task list changed — the completion gate earns a fresh reminder (CLI parity)
    ctx.callbacks?.onTaskUpdate?.(normalized)
    const done = normalized.filter((t) => t.status === "done").length
    const total = normalized.length
    const inProgress = normalized.find((t) => t.status === "in_progress")
    return [
      `Task list: ${done}/${total} done`,
      inProgress ? `In progress: ${inProgress.title}` : "",
      normalized.filter((t) => t.status === "pending").length > 0
        ? `Pending: ${normalized.filter((t) => t.status === "pending").map((t) => t.title).join(", ")}`
        : "",
      warnings.length > 0 ? ` ⚠️ ${warnings.join("; ")}` : "",
    ].filter(Boolean).join("\n")
  },
}
