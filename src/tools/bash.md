Execute a shell command and return stdout+stderr. Use for running commands, builds, tests.

**Route to a dedicated tool instead of bash:**
- `cat file` / `head` / `tail` → `read`
- `ls` / `dir` → `ls`
- `find` / glob search → `glob`
- `grep` / `rg` → `grep`
- `echo >` / `sed` / `printf >` / `cat << EOF` → `write` / `edit` / `hashline_edit` / `apply_patch` (preferred: write tools handle encoding/EOL correctly)
- `git diff` / `git status` / `git log` → `git` tool

Parameters:
- command (required): Shell command to execute
- timeout: Timeout in milliseconds (default 120000, max ~300000)
- filter: Optional — a regex; only output lines matching it are returned (case-insensitive). Use instead of hand-writing a pipe into `findstr`/`grep`.
- terminal: "visible" runs the command in the user's OWN visible terminal via shell integration — it inherits the user's shell state (current dir, activated venv/conda, env vars) that an isolated child process lacks. "inject" fills the command into the terminal WITHOUT running it — the user reviews and presses Enter (use for commands the user should inspect first). Omit for the default isolated child process.

Output format:
```
[stdout]:
<standard output, or "(empty)">

[stderr]:
<standard error, only present if non-empty>

(exit code N)
```

Notes:
- There is NO TTY in the default child-process mode — editors, pagers (vim, less), and interactive prompts WILL hang (use `terminal: "visible"` when a command genuinely needs a real TTY). Always pass non-interactive flags: `git commit -m`, `git --no-pager`, `-y`/`--yes` where applicable
- The environment sets GIT_PAGER=cat, PAGER=cat, EDITOR=true, TERM=dumb — but still always use non-interactive flags
- Output is capped at ~200K chars; if you need more, redirect to a file and read it. Truncated output ends with a `[... truncated: N chars omitted]` marker — the missing tail may contain errors, so read the saved log file's tail before trusting success. Use `filter` to narrow instead of hand-piping.
- Check `[stderr]` for error messages, warnings, and diagnostic output — it is separated from `[stdout]` so you can quickly identify problems.
- The default isolated child process runs the OS shell (Windows cmd.exe / POSIX /bin/sh): on Windows `&&`/`||` chaining works — use cmd built-ins (`del`, `dir`, `type`, `findstr`, `tasklist`) and `/dev/null`→`NUL`, `2>/dev/null`→`>nul 2>&1`; Bash-isms (`rm -rf`, `cp -r`, `head`, `$(...)`, `${VAR}`, single quotes, `;` separators) FAIL. `terminal: "visible"/"inject"` run in the USER'S terminal, which may be a different shell (e.g. PowerShell 5.1 on Windows — no `&&`/`||`, use `;` to sequence; POSIX users may run fish/nushell) — check the user's shell before assuming cmd semantics. For complex logic prefer the execute tool (node) over shell gymnastics.
- Never use bash to read, copy, or transmit secret files (.env, keys, tokens)
- Do NOT run destructive commands (rm -rf, force-push, drop table) without explicit user confirmation
- After commands that change files (git checkout, npm install, etc.), repo_outline and code_search may be stale — re-run them to get current results.
- Prefer read/glob/grep/ls for file operations inside the project — file tools and bash reach the same paths (no directory restriction).
- NEVER use bash to write or modify files (echo/sed/printf > file, cat << EOF, etc.). Use write/edit/insert_after/apply_patch instead — they handle encoding, escaping, and EOL conventions correctly.
