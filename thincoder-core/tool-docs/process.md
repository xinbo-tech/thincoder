List running processes, optionally filtered by name — or kill a process tree / a background bash task. List returns process name / PID / memory; kill returns a one-line confirmation.

**Route to process instead of bash:**
- `tasklist` (Windows) / `ps aux` (POSIX) → process

Parameters:
- action (optional, default 'list'): list — show running processes; kill — terminate a process tree (target: pid) or a background bash task (target: id)
- name: (list) substring filter (case-insensitive), e.g. "node", "python"
- pid: (kill) process id — the whole tree is terminated (taskkill /T /F on win32; POSIX group kill)
- id: (kill) background bash task id — the `bash#N` from the bash async ack; its process tree is terminated, the entry leaves the pool, and no digest will arrive (the log so far stays readable)

Notes:
- kill is destructive: pass exactly one target (pid or id — never both), and it goes through the same approval gate as other destructive actions — confirm before killing.
- Repeating a kill is idempotent (same confirmation, no double kill); an unknown or already-finished bash task id comes back as `Error: ...`.
