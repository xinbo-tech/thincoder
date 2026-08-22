Execute JavaScript code with full Node access. Runs in a real `node` process with top-level `await` and dynamic `import()` — so you can load and call the project's own `.mjs` modules directly. Use this to compose multiple operations into one call — read, write, glob, grep, log, import, or require() — without shelling out to `bash node -e`.

**Route to execute instead of bash:**
- `node -e "…"` → execute (top-level await + import() + console all work)

Parameters:
- code (required): JavaScript to run. Top-level `await` and `import('./x.mjs')` are supported. Globals: readFile(path), writeFile(path, content), glob(pattern), grep(pattern, file), log(...args) — plus native require/process/console/fetch/import.
- workdir: run in this directory (relative to cwd, confined to the workspace; default cwd)
- filter: optional — only return output lines matching this regex (case-insensitive)
- timeoutMs: Timeout in milliseconds (default 30000, max 60000)

Notes:
- `console.log(...)` and `log(...)` both print to the result; objects are JSON-stringified by `log`.
- File paths are confined to the workspace root (`..` traversal is denied) — but `require`/`process`/`import()` are full Node, same boundary as bash.
- A non-zero exit / thrown exception returns the stderr (error + stack) as the result.
- Output capped at ~50KB; use `writeFile` to a file if you need more.
- Use `write`/`edit`/`apply_patch` for source edits and `bash` for subprocess/CLI runs (`npm test`, `node --test`, servers) — execute is for in-process JS, not spawning programs.