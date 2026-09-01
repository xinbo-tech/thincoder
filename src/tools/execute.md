Execute JavaScript — either inline `code` or a `scriptFile`. Runs in a real `node` process with top-level `await` and dynamic `import()`. Use inline `code` to compose multiple operations into one call — read, write, glob, grep, log, import, or require() — without shelling out to `bash node -e`.

**Route to execute instead of bash:**
- `node -e "…"` → execute (inline code; top-level await + import() + console all work)
- `node <script.mjs>` → execute with scriptFile (runs the file in a child node process)
- `node --test <file>` / `node --check <file>` → execute with scriptFile + nodeArgs

Parameters:
- code: JavaScript to run inline. Top-level `await` and `import('./x.mjs')` are supported. Globals: readFile(path), writeFile(path, content), glob(pattern), grep(pattern, file), log(...args) — plus native require/process/console/fetch/import. Use this OR scriptFile.
- scriptFile: run a .mjs/.js file with node (self-contained — no prelude; the file imports what it needs). Path relative to workdir — no directory restriction. Use this OR code.
- nodeArgs: (scriptFile) extra node flags before the script, e.g. ["--test"], ["--check"]. Eval-like flags (--eval/--input-type/--inspect) are rejected.
- workdir: run in this directory (relative to cwd — no directory restriction; default cwd)
- filter: optional — only return output lines matching this regex (case-insensitive)
- timeoutMs: Timeout in milliseconds (default 30000, max 600000 — covers slow `node --test` suites and long package scripts)

Notes:
- `console.log(...)` and `log(...)` both print to the result; objects are JSON-stringified by `log`.
- The prelude's readFile/writeFile/glob/grep helpers resolve paths against the working directory (helper-only guard — `require`/`process`/`import()` are full Node, same boundary as bash).
- A non-zero exit / thrown exception returns the stderr (error + stack) as the result.
- Output capped at ~50KB; use `writeFile` to a file if you need more.
- Use `write`/`edit`/`apply_patch` for source edits. Still use `bash` for package-manager/CLI subprocesses (`npm test`/`npm publish`/`vsce`), servers, and interactive/TTY programs — execute covers in-process JS and `node <script>`/`node --test`/`node --check`, not arbitrary CLI or long-running programs.
