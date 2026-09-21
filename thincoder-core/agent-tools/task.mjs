// F-CC4（CONTEXT-COMPACTION.md §6.16.5）：task 列表变更 ⇒ 方向转换轻推（本档只调用；文案/去重单源 = agent-tools/context.mjs）
import { pushContextNudge } from "./context.mjs"

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
    "For cross-session / project-level tracking, use `/ledger`. " +
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
    // F10（工程模式机械停用——双层门的 **execute 层兜底**；先例 = escalate `subagent-actions.mjs:349`）：
    // 前置位 = 本行以下全部副作用之前（alias 归一 / `_taskPushbacks` 归零 / `_onTaskUpdate` / 轻推）
    // ⇒ 零副作用（列表不变）；装配层已摘（`agent/family-tools.mjs` 工程分支不入表，KD8）。
    // 普通模式（engineering 非真）逐字走原路径。
    if (ctx?.agent?.config?.agent?.engineering) {
      return "Error: engineering mode is ON — task is unavailable (the batch record + the ledger are the tracking authority in engineering mode). Update progress in the batch record (§5/§6) or the ledger (`/ledger`); task lists go stale in this mode's parallel structure."
    }
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
    if (ctx.depth === 0) pushContextNudge(ctx.agent) // F-CC4 轻推（§6.16.5——depth-0 门：子代理拿不到 context 工具）
    const done = items.filter((i) => i.status === "done").length
    const open = items.length - done
    const warningText = warnings.length > 0 ? ` ⚠️ ${warnings.join("; ")}` : ""
    return `Task list updated: ${done}/${items.length} done` +
      (open > 0 ? ` — ${open} item(s) still open.` : " — all done.") + warningText
  },
}
