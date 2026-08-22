/**
 * tools/codemode.mjs — CodeMode: JavaScript execution tool
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
 * The child `import()`-s exec-prelude.mjs first for readFile/writeFile/glob/grep/
 * log/require (paths confined to the workspace root). Full Node via require()/
 * process/import() is available — same boundary as bash, no fake sandbox.
 *
 * Parameters:
 *   code       — JS to run (top-level await and import() supported)
 *   workdir    — run in this sub-directory (confined to the workspace)
 *   filter     — return only output lines matching this regex (case-insensitive)
 *   timeoutMs  — timeout (default 30s, max 60s)
 */
import { spawn } from "node:child_process"
import { dirname, resolve, relative } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { DESC } from "./shared.mjs"

const MAX_SCRIPT = 50_000
const MAX_OUTPUT = 50_000
const DEFAULT_TIMEOUT = 30_000

const __dirname = dirname(fileURLToPath(import.meta.url))
const PRELUDE_URL = pathToFileURL(resolve(__dirname, "exec-prelude.mjs")).href

/** Resolve workdir relative to cwd, asserting it stays within the workspace. */
function resolveBaseDir(cwd, workdir) {
  if (!workdir || typeof workdir !== "string") return cwd
  const abs = resolve(cwd, workdir)
  const rel = relative(cwd, abs)
  if (rel.startsWith("..")) throw new Error(`workdir escapes the workspace: ${workdir}`)
  return abs
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

/** Spawn node, run code + prelude, capture stdout/stderr, enforce timeout/abort. */
function runNodeEval(code, baseDir, root, timeoutMs, signal) {
  return new Promise((resolvePromise) => {
    const src = `await import(${JSON.stringify(PRELUDE_URL)});\n${code}`
    const child = spawn(process.execPath, ["--input-type=module", "--eval", src], {
      cwd: baseDir,
      env: { ...process.env, THINCODER_EXEC_ROOT: root },
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    })

    let outBuf = "", errBuf = "", truncated = false, settled = false, mode = null
    let timer = null, kickTimer = null

    const settle = (result) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      clearTimeout(kickTimer)
      if (signal) signal.removeEventListener("abort", onAbort)
      resolvePromise(result)
    }
    const kill = () => { try { child.kill() } catch { /* already gone */ } }
    // After kill, wait for "close" (child fully reaped) before settling — settling
    // early races the caller deleting the cwd dir while the child still holds it.
    const armKick = () => { kickTimer = setTimeout(() => settle(mode === "abort" ? "(stopped)" : `Error: script timed out after ${timeoutMs}ms`), 3000) }
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
    child.on("error", (e) => settle(`Error: failed to start node: ${e.message}`))
    child.on("close", (code) => {
      if (mode === "abort") return settle("(stopped)")
      if (mode === "timeout") return settle(`Error: script timed out after ${timeoutMs}ms`)
      const out = outBuf.trimEnd()
      const err = errBuf.trim()
      if (code === 0) {
        settle(out || "(no output)")
      } else {
        settle(err ? (out ? `${out}\n\n[stderr]:\n${err}` : err) : `${out}\n(exit code ${code})`.trim())
      }
    })
  })
}

export const codeModeTool = {
  name: "execute",
  description: DESC("execute"),
  parameters: {
    type: "object",
    properties: {
      code: {
        type: "string",
        description: "JavaScript code to execute (top-level await and dynamic import() supported). Use provided globals: readFile/writeFile/glob/grep/log, plus native require/process/console/fetch/import.",
      },
      workdir: {
        type: "string",
        description: "Run in this directory (relative to cwd, confined to the workspace; default cwd)",
      },
      filter: {
        type: "string",
        description: "Optional: only return output lines matching this regex (case-insensitive)",
      },
      timeoutMs: {
        type: "integer",
        description: `Timeout in milliseconds (default ${DEFAULT_TIMEOUT}, max 60000)`,
      },
    },
    required: ["code"],
  },
  readonly: false,

  async execute(args, ctx) {
    const code = args.code ?? ""
    if (code.length > MAX_SCRIPT) {
      return `Error: script too large (${code.length} > ${MAX_SCRIPT} bytes). Split into smaller scripts or use individual tools.`
    }
    let baseDir
    try { baseDir = resolveBaseDir(ctx.cwd, args.workdir) }
    catch (e) { return `Error: ${e.message}` }
    const timeoutMs = Math.min(args.timeoutMs ?? DEFAULT_TIMEOUT, 60_000)
    const result = await runNodeEval(code, baseDir, ctx.cwd, timeoutMs, ctx.signal)
    return args.filter ? applyFilter(result, args.filter) : result
  },
}