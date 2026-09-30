Execute JavaScript — either inline `code` or a `scriptFile`. Runs in a real child `node` process — a pure node ESM environment: top-level `await` and dynamic `import()` are available, no globals are injected. File reads/writes/searches belong to the dedicated read/ls/glob/grep/write/edit tools — not to execute. If a script genuinely needs fs/path, `import` the `node:` module inside the code (one explicit import line).

**Route to execute instead of bash:**
- `node -e "…"` → execute (inline code; top-level await + import() + console all work)
- `node <script.mjs>` → execute with scriptFile (runs the file in a child node process)
- `node --test <file>` / `node --check <file>` → execute with scriptFile + nodeArgs (timeoutMs up to 600000 — long suites fit)

Notes:
- `console.log(...)` prints to the result; objects are JSON-stringified where needed.
- A non-zero exit / thrown exception returns the stderr (error + stack) as the result.
- Output is capped at ~50KB; when a script overruns it, an explicit `[output truncated]` marker is appended — print large results in chunks, or have the script write them to a file (node:fs) and read that file back with the `read` tool.
- Use `write`/`edit`/`apply_patch` for source edits. Still use `bash` for package-manager/CLI subprocesses (`npm test`/`npm publish`/`vsce`), servers, and interactive/TTY programs — execute covers in-process JS and `node <script>`/`node --test`/`node --check`, not arbitrary CLI or long-running programs.
- Irreversibility: it runs with full filesystem access and no automatic undo — script side effects are permanent; checkpoint (git) before risky bulk operations.
