/**
 * tools/execute.mjs — JavaScript execution tool
 *
 * Gives the model an `execute` tool that runs JS in a child `node
 * --input-type=module --eval` process — NOT the in-process vm sandbox it used
 * to be. The vm route could not support dynamic `import()` (needs the
 * --experimental-vm-modules flag) or await it, which pushed every real JS run
 * back to `bash node -e`. A child node process gives top-level await, dynamic
 * `import()` of the project's own .mjs modules, native `console`/`fetch`, AND a
 * killable timeout (an in-process infinite loop would freeze the CLI; a child
 * process is killed like bash).
 *
 * The child runs PURE node ESM — no helpers are injected (exec-prelude.mjs
 * retired 2026-09-03, TOOLS.md §12: preloaded readFile/writeFile/glob/grep/log
 * helpers made execute look like a file tool, bypassing the dedicated
 * read/ls/glob/grep/write/edit tools). Scripts that need fs/path import the
 * node: modules themselves — same boundary as bash, no fake sandbox.
 *
 * Parameters:
 *   code       — JS to run inline (top-level await and import() supported). Use this OR scriptFile.
 *   scriptFile — run a .mjs/.js file with node (self-contained, imports what it needs). Use this OR code.
 *   nodeArgs   — (scriptFile) extra node flags before the script (e.g. --test, --check); eval-like flags rejected
 *   workdir    — run in this sub-directory (no directory restriction)
 *   filter     — return only output lines matching this regex (case-insensitive)
 *   timeoutMs  — timeout (default 30s, max 600000ms)
 */
import { spawn } from "node:child_process"
import { resolve } from "node:path"
import { DESC } from "./shared.mjs"

const MAX_SCRIPT = 50_000
const MAX_OUTPUT = 50_000
const DEFAULT_TIMEOUT = 30_000

/**
 * 超时错误文本——带重试引导（TOOLS.md §14.1 D14.1.2——"下一跳"）：数字 = 实际生效的
 * timeoutMs（Math.min(t, 600_000) 或默认 30s）——上限 600000 与 schema/头注/execute.md 一致。
 */
const timeoutErrorText = (timeoutMs) =>
  `Error: script timed out after ${timeoutMs}ms — retry with a larger timeoutMs (up to 600000) for long scripts, or use bash (default 120s) for shell commands`

/** Resolve workdir relative to cwd — no boundary assertion
 *  (§10.1 2026-09-02: workspace confinement removed; the child node process is
 *  not directory-limited — same boundary as bash). */
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

/** Spawn node with the given args, capture stdout/stderr, enforce timeout/abort.
 *  Resolves { text, ok } — ok=false on non-zero exit / timeout / abort. */
function runNode(childArgs, baseDir, timeoutMs, signal) {
  return new Promise((resolvePromise) => {
    const child = spawn(process.execPath, childArgs, {
      cwd: baseDir,
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
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
    const armKick = () => { kickTimer = setTimeout(() => settle(mode === "abort" ? "(stopped)" : timeoutErrorText(timeoutMs), false), 3000) }
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
    child.on("error", (e) => settle(`Error: failed to start node: ${e.message}`, false))
    child.on("close", (code) => {
      if (mode === "abort") return settle("(stopped)", false)
      if (mode === "timeout") return settle(timeoutErrorText(timeoutMs), false)
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
  description: DESC("execute"),
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
      // scriptFile mode: run a .mjs/.js file with node [nodeArgs...]. Self-contained —
      // a real node process imports what it needs. No directory restriction.
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
