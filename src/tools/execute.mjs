/**
 * tools/execute.mjs — JavaScript execution tool (VS Code).
 *
 * Runs JS in a child `node --input-type=module --eval` process (NOT the old
 * in-process vm sandbox). The vm route could not support dynamic `import()` or
 * await it (both need --experimental-vm-modules), which pushed every real JS
 * run back to `bash node -e`. A child node process gives top-level await,
 * dynamic `import()` of the project's own .mjs modules, native console/fetch,
 * AND a killable timeout (an in-process infinite loop would freeze the
 * extension host; a child process is killed).
 *
 * The child runs PURE node ESM — no helpers are injected (exec-prelude.mjs
 * retired 2026-09-03, TOOLS.md §12: preloaded readFile/writeFile/glob/grep/log
 * helpers made execute look like a file tool, bypassing the dedicated
 * read/ls/glob/grep/write/edit tools). Scripts that need fs/path import the
 * node: modules themselves — same boundary as bash, no fake sandbox.
 *
 * Two modes: inline `code` (pure eval) OR `scriptFile` (run a workspace
 * .mjs/.js file with node [nodeArgs...], self-contained — for `node <script>` /
 * `node --test <file>` / `node --check <file>`). Both run as real node child
 * processes — NO directory restrictions (bash parity, TOOLS.md §10.1).
 */
import { spawn } from "node:child_process"
import { resolve } from "node:path"

const MAX_SCRIPT = 50_000
const MAX_OUTPUT = 50_000
const DEFAULT_TIMEOUT = 30_000

// §14.1 D14.1.2 (TOOLS.md — 2026-09-05): timeout errors carry the next-hop retry
// guidance (anchor verbatim, both ends — actual duration is interpolated at the site).
const TIMEOUT_GUIDANCE = " — retry with a larger timeoutMs (up to 600000) for long scripts, or use bash (default 120s) for shell commands"
const timeoutMsg = (timeoutMs) => `Error: script timed out after ${timeoutMs}ms${TIMEOUT_GUIDANCE}`

/** Resolve workdir relative to cwd (no workspace boundary assertion — bash parity,
 *  TOOLS.md §10.1 D-W1: paths are resolved, not restricted). */
function resolveBaseDir(cwd, workdir) {
  if (!workdir || typeof workdir !== "string") return cwd
  return resolve(cwd, workdir)
}

/** Keep only output lines matching a regex (execute filter, case-insensitive). */
function applyFilter(output, filter) {
  try {
    const re = new RegExp(filter, "i")
    const lines = output.split("\n").filter((l) => re.test(l))
    return lines.length ? lines.join("\n") : `(no output lines matched filter "${filter}")`
  } catch (e) {
    return `Error: filter regex invalid: ${e.message}`
  }
}

/** Spawn node, run code, capture stdout/stderr, enforce timeout/abort.
 *  Resolves { text, ok } — ok=false on non-zero exit / timeout / abort. */
function runNode(childArgs, baseDir, timeoutMs, signal) {
  return new Promise((resolvePromise) => {
    const child = spawn(process.execPath, childArgs, {
      cwd: baseDir,
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
      // 双保险（2026-09-05——裸 spawn 无 signal 教训——CLI execute.mjs 同款镜像）：abort 时
      // Node 自动杀直接子进程（第一道）——onAbort 手动 kill 兜底——AbortError 在 error 分支让路
      ...(signal ? { signal } : {}),
    })

    let outBuf = "", errBuf = "", truncated = false, settled = false, mode = null
    let timer = null, kickTimer = null

    const settle = (text, ok) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      clearTimeout(kickTimer)
      if (signal) signal.removeEventListener("abort", onAbort)
      resolvePromise({ text, ok })
    }
    // SIGKILL (not SIGTERM) so a signal-trapping script can't dodge the watchdog.
    const kill = () => { try { child.kill("SIGKILL") } catch { /* already gone */ } }
    // After kill, wait for "close" (child fully reaped) before settling — settling
    // early races the caller deleting the cwd dir while the child still holds it.
    const armKick = () => { kickTimer = setTimeout(() => settle(mode === "abort" ? "(stopped)" : timeoutMsg(timeoutMs), false), 3000) }
    const onAbort = () => { if (mode) return; mode = "abort"; kill(); armKick() }

    timer = setTimeout(() => { if (!mode) { mode = "timeout"; kill(); armKick() } }, timeoutMs)

    if (signal) {
      if (signal.aborted) onAbort()
      else signal.addEventListener("abort", onAbort, { once: true })
    }

    const cap = (buf, d) => {
      if (buf.length < MAX_OUTPUT) return buf + d
      if (!truncated) { truncated = true; return buf + "\n...[output truncated]" }
      return buf
    }
    child.stdout.on("data", (d) => { outBuf = cap(outBuf, d.toString()) })
    child.stderr.on("data", (d) => { errBuf = cap(errBuf, d.toString()) })
    child.on("error", (e) => {
      // signal 双保险（2026-09-05）：abort 时 Node signal option 杀子进程 → AbortError 先触发
      // ——让路（close 必随——mode==="abort" 收尾——不误报启动失败）
      if (e.name === "AbortError") return
      settle(`Error: failed to start node: ${e.message}`, false)
    })
    child.on("close", (code) => {
      if (mode === "abort") return settle("(stopped)", false)
      if (mode === "timeout") return settle(timeoutMsg(timeoutMs), false)
      const out = outBuf.trimEnd()
      const err = errBuf.trim()
      if (code === 0) {
        settle(out || "(no output)", true)
      } else {
        settle(err ? (out ? `${out}\n\n[stderr]:\n${err}` : err) : `${out}\n(exit code ${code})`.trim(), false)
      }
    })
  })
}

/** Validate nodeArgs (extra node flags for scriptFile mode, e.g. --test / --check). Forbids
 *  eval-like flags that would conflict with scriptFile mode or re-open inline injection. */
function validateNodeArgs(nodeArgs) {
  if (!nodeArgs) return []
  const arr = Array.isArray(nodeArgs) ? nodeArgs : String(nodeArgs).split(/\s+/).filter(Boolean)
  const forbidden = /^(--eval|-e|--input-type|--print|-p|--inspect|--inspect-brk)(=|$)/i
  for (const a of arr) {
    if (forbidden.test(a)) throw new Error(`nodeArgs flag not allowed: ${a}`)
  }
  return arr
}

export const executeTool = {
  name: "execute",
  description:
    "Execute JavaScript — either inline `code` or a `scriptFile`. Runs in a real child `node` process — a pure node ESM environment: top-level `await` and dynamic `import()` are available, no globals are injected. File reads/writes/searches belong to the dedicated read/ls/glob/grep/write/edit tools — not to execute. If a script genuinely needs fs/path, `import` the `node:` module inside the code (one explicit import line).\n" +
    "\n" +
    "**Route to execute instead of bash:**\n" +
    "- `node -e \"…\"` → execute (inline code; top-level await + import() + console all work)\n" +
    "- `node <script.mjs>` → execute with scriptFile (runs the file in a child node process)\n" +
    "- `node --test <file>` / `node --check <file>` → execute with scriptFile + nodeArgs\n" +
    "\n" +
    "Parameters:\n" +
    "- code: JavaScript to run inline. Top-level `await` and `import('./x.mjs')` are supported. Pure node ESM — no preloaded helpers; import `node:fs`/`node:path` etc. yourself when needed. File reads/writes go through the dedicated read/ls/glob/grep/write/edit tools. Use this OR scriptFile.\n" +
    "- scriptFile: run a .mjs/.js file with node (self-contained — the file imports what it needs). Path relative to workdir — no directory restriction. Use this OR code.\n" +
    "- nodeArgs: (scriptFile) extra node flags before the script, e.g. [\"--test\"], [\"--check\"]. Eval-like flags (--eval/--input-type/--inspect) are rejected.\n" +
    "- workdir: run in this directory (relative to cwd — no directory restriction; default cwd)\n" +
    "- filter: optional — only return output lines matching this regex (case-insensitive)\n" +
    "- timeoutMs: Timeout in milliseconds (default 30000, max 600000 — covers `node --test` suites and package scripts)\n" +
    "\n" +
    "Notes:\n" +
    "- `console.log(...)` prints to the result; objects are JSON-stringified where needed.\n" +
    "- A non-zero exit / thrown exception returns the stderr (error + stack) as the result.\n" +
    "- Output is capped at ~50KB; when a script overruns it, an explicit `[output truncated]` marker is appended — print large results in chunks, or have the script write them to a file (node:fs) and read that file back with the `read` tool.\n" +
    "- Use `write`/`edit`/`apply_patch` for source edits. Still use `bash` for package-manager/CLI subprocesses (`npm test`/`npm publish`/`vsce`), servers, and interactive/TTY programs — execute covers in-process JS and `node <script>`/`node --test`/`node --check`, not arbitrary CLI or long-running programs.\n",
  parameters: {
    type: "object",
    properties: {
      code: {
        type: "string",
        description: "JavaScript code to execute (top-level await and dynamic import() supported). Pure node ESM — no preloaded globals; import node: modules (fs/path) yourself when needed. File reads/writes go through the dedicated read/ls/glob/grep/write/edit tools. Use this OR scriptFile.",
      },
      scriptFile: {
        type: "string",
        description: "Run a .mjs/.js file with node (self-contained — the file imports what it needs). Path relative to workdir — no directory restriction. Use this OR code. For `node <script>` / `node --test <file>` / `node --check <file>`.",
      },
      nodeArgs: {
        type: "array",
        items: { type: "string" },
        description: "(scriptFile) Extra node flags before the script, e.g. [\"--test\"], [\"--check\"]. Eval-like flags (--eval/--input-type/--inspect) are rejected.",
      },
      workdir: {
        type: "string",
        description: "Run in this directory (relative to cwd — no directory restriction; default cwd)",
      },
      filter: {
        type: "string",
        description: "Optional: only return output lines matching this regex (case-insensitive)",
      },
      timeoutMs: {
        type: "integer",
        minimum: 1,
        maximum: 600000,
        description: `Timeout in milliseconds (default ${DEFAULT_TIMEOUT}, max 600000)`,
      },
    },
    required: [],
  },
  readonly: false,

  async execute(args, ctx) {
    let baseDir
    try { baseDir = resolveBaseDir(ctx.cwd, args.workdir) }
    catch (e) { return `Error: ${e.message}` }

    const t = Number(args.timeoutMs)
    const timeoutMs = Number.isFinite(t) && t > 0 ? Math.min(t, 600_000) : DEFAULT_TIMEOUT

    let childArgs
    if (args.scriptFile) {
      if (args.code?.trim()) return "Error: pass code OR scriptFile, not both"
      // scriptFile mode: run a workspace .mjs/.js file with node [nodeArgs...]. Self-contained —
      // a real node process imports what it needs. No directory restrictions (bash parity).
      const scriptAbs = resolve(baseDir, args.scriptFile)
      let nodeArgs
      try { nodeArgs = validateNodeArgs(args.nodeArgs) }
      catch (e) { return `Error: ${e.message}` }
      childArgs = [...nodeArgs, scriptAbs]
    } else {
      const code = args.code ?? ""
      if (!code.trim()) return "Error: either code or scriptFile is required"
      if (code.length > MAX_SCRIPT) {
        return `Error: script too large (${code.length} > ${MAX_SCRIPT} bytes). Split into smaller scripts or use individual tools.`
      }
      // inline mode: pure node ESM — no prelude, nothing injected (TOOLS.md §12).
      childArgs = ["--input-type=module", "--eval", code]
    }

    const { text, ok } = await runNode(childArgs, baseDir, timeoutMs, ctx.signal)
    // Only filter successful output — never swallow an error report behind a filter.
    if (!ok) return text
    return args.filter ? applyFilter(text, args.filter) : text
  },
}
