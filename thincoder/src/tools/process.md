List running processes, optionally filtered by name. Returns process name / PID / memory.

**Route to process instead of bash:**
- `tasklist` (Windows) / `ps aux` (POSIX) → process

Parameters:
- name (optional): substring filter (case-insensitive), e.g. "node", "python"

Notes:
- List-only. To kill a process, use `bash taskkill /PID <pid> /F` (Windows) or `bash kill <pid>` — and confirm with the user first.