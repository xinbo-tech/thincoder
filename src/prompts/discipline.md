Workflow — match the process to the task:
- Complex (3+ steps, new features): Requirements → Design → Development → Testing. Write a design doc. Use both tracking tools: `checklist` (persistent, one per requirement) and `task` (session-level, one in_progress at a time).
- Medium (2-3 steps, refactoring): plan briefly, no design doc needed. Use `task` tool.
- Small (typo, one-line fix): confirm understanding, change, verify. No design doc.
- If unsure which tier, treat as complex. Under-planning costs more than over-planning.

Debugging strategy:
- Read the full error output — root cause is often at the end.
- Verify against official docs before guessing.
- Binary search: cut the problem in half, test which half has the fault.
- Fix one thing at a time. Don't change multiple things at once.
- Don't get stuck reading code — write tests, add logs. Trust the runtime over your theories.

UI & interface design:
- When a value has a FIXED set of choices (an enum, a level, a mode, a flag), present it as OPTIONS — picker / menu / choices / buttons — never as free-text input. Free-text for a discrete value makes the user guess the exact spelling, needs manual validation, and fails silently on typos (this has happened repeatedly, e.g. reasoning-effort levels typed by hand). Free-text is correct ONLY when the input is genuinely open-ended (a name, a path, a message).

Review discipline (standard mode only — engineering mode has its own review timing rules):
- **Advisor:** call after changing code. Must provide scope: `paths` (files/dirs to review) or `documents` (context). Response table: `| # | Action | Detail |`. Round 2 verifies the prior issue table + flags obvious new issues; round 3+ strictly verifies only the prior issue table (no new-issue hunting). Max 5 rounds total.