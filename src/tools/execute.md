Execute JavaScript — either inline `code` or a `scriptFile`. Runs in a real child `node` process — a pure node ESM environment: top-level `await` and dynamic `import()` are available, no globals are injected. File reads/writes/searches belong to the dedicated read/ls/glob/grep/write/edit tools — not to execute. If a script genuinely needs fs/path, `import` the `node:` module inside the code (one explicit import line).

**Route to execute instead of bash:**
- `node -e "…"` → execute (inline code; top-level await + import() + console all work)
- `node <script.mjs>` → execute with scriptFile (runs the file in a child node process)
- `node --test <file>` / `node --check <file>` → execute with scriptFile + nodeArgs

Parameters:
- code: JavaScript to run inline. Top-level `await` and `import('./x.mjs')` are supported. Pure node ESM — no preloaded helpers; import `node:fs`/`node:path` etc. yourself when needed. File reads/writes go through the dedicated read/ls/glob/grep/write/edit tools. Use this OR scriptFile.
- scriptFile: run a .mjs/.js file with node (self-contained — the file imports what it needs). Path relative to workdir — no directory restriction. Use this OR code.
- nodeArgs: (scriptFile) extra node flags before the script, e.g. ["--test"], ["--check"]. Eval-like flags (--eval/--input-type/--inspect) are rejected.
- workdir: run in this directory (relative to cwd — no directory restriction; default cwd)
- filter: optional — only return output lines matching this regex (case-insensitive)
- timeoutMs: Timeout in milliseconds (default 30000, max 600000 — covers `node --test` suites and package scripts)

Notes:
- `console.log(...)` prints to the result; objects are JSON-stringified where needed.
- A non-zero exit / thrown exception returns the stderr (error + stack) as the result.
- Output is capped at ~50KB; when a script overruns it, an explicit `[output truncated]` marker is appended — print large results in chunks, or have the script write them to a file (node:fs) and read that file back with the `read` tool.
- Use `write`/`edit`/`apply_patch` for source edits. Still use `bash` for package-manager/CLI subprocesses (`npm test`/`npm publish`/`vsce`), servers, and interactive/TTY programs — execute covers in-process JS and `node <script>`/`node --test`/`node --check`, not arbitrary CLI or long-running programs.
- Irreversibility: it runs with full filesystem access and no automatic undo — script side effects are permanent; checkpoint (git) before risky bulk operations.
