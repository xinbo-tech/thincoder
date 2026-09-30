Plan and track a task list for complex multi-step work.
Each call replaces the entire list.
Keep exactly one item in_progress at a time; mark items done as you complete them; never mark done if tests fail or work is partial.
Statuses: pending | in_progress | done — synonyms (completed/finished/complete, todo/open/waiting, active/running/working, …) are accepted and normalized with a warning.
IMPORTANT: title is required and must be a non-empty string — items with empty titles are silently dropped.
For cross-session / project-level tracking, use `/ledger`.
Returns the updated task list (or the new item's ID on add).
