Manage the task checklist in .thincoder/checklist.md. Use at these points: after requirements are confirmed — add one entry per requirement point; when starting work — mark in_progress; when verified complete — mark done. Checklist entries map to requirement/design points — project-level tracking across sessions. For in-session subtask breakdown of a single checklist item, use the `task` tool instead. Completed items are auto-archived to .thincoder/checklist-done.md.

Items support tree hierarchy via indentation (2 spaces per level) and auto-assigned IDs (T1, T1.1, T1.2.1). Use the `parent` parameter to add a child under an existing task.

Parameters:
- action: "add" | "mark" | "list"
- id: task ID to mark, e.g. "T3" (with "mark"; preferred — use the ID returned by `add`, or from `list`)
- item: text for new item (with "add")
- index: 1-based index (with "mark"; fallback — use only when you have no ID)
- status: "pending" | "in_progress" | "done" (with "mark")
- parent: parent task ID for hierarchical tasks, e.g. "T1" (with "add")

Note: marking a parent "done" requires all its child tasks already done — otherwise it is rejected (complete the children before marking the parent done).
