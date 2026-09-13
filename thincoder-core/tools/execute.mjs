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
import { spawn, execFileSync } from "node:child_process"
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

/** Platform-aware process tree kill — mirror of system.mjs/verify.mjs killProcessTree.
 *  Timeout/abort must reach grandchildren: a script that spawned children keeps the
 *  pipes open otherwise — "close" never fires and the tool stalls until the 3s kick
 *  while the orphan keeps running (2026-09-05 advisor 🟡#4). */
function killProcessTree(child) {
  if (process.platform === "win32") {
    try { execFileSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], { stdio: "ignore" }) } catch {}
  } else {
    try { process.kill(-child.pid, "SIGKILL") } catch {}
    try { child.kill("SIGKILL") } catch {}
  }
}
export { killProcessTree }

// ─── 树杀注入缝（#57——「树杀实现按端注入」，形态参 §2.13.5 注入缝）───────────────
/**
 * 超时 / abort 树杀注入位（**缺省不覆盖** = 核内 `killProcessTree`——CLI 语义，零行为变；
 * 端装配层可覆盖为本端树杀实现）。核内零端名分支（契约 5——本档只认 `killTree` 函数名）。
 * 契约：`killTree(child) → void`（尽力而为——调用点已包 try/catch，抛错不阻断收尾）。
 */
let injectedKill = null
export function configureProcessTreeKill(impl) {
  injectedKill = impl && typeof impl.killTree === "function" ? impl.killTree : null
}
/** 撤销注入（测试与端装配生命周期用——缺省态 = 核内 killProcessTree）。 */
export function resetProcessTreeKill() { injectedKill = null }

/** Spawn node with the given args, capture stdout/stderr, enforce timeout/abort.
 *  Resolves { text, ok } — ok=false on non-zero exit / timeout / abort. */
function runNode(childArgs, baseDir, timeoutMs, signal) {
  return new Promise((resolvePromise) => {
    const child = spawn(process.execPath, childArgs, {
      cwd: baseDir,
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
      // POSIX detached → 子进程为组首——killProcessTree 的 -pid 组杀可达孙进程（win 用
      // taskkill /T 不需 detached）——2026-09-05 advisor 🟡#4
      detached: process.platform !== "win32",
      // 双保险（2026-09-05——裸 spawn 无 signal 教训——system.mjs 同款）：abort 时
      // Node 自动杀直接子进程（第一道）——onAbort 手动 kill 兜底（SIGKILL 防信号陷阱
      // 脚本——见 kill 注释）——AbortError 在 error 分支让路（close 必随——走 mode 收尾）
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
    // Tree kill（SIGKILL/taskkill /T——signal-trapping 脚本躲不开 watchdog；孙进程持管道
    // 时直接 kill 不达——close 不触发拖到 kick——2026-09-05 advisor 🟡#4 对齐 bash/verify）。
    // #57：树杀实现按端注入（缺省 = 核内 killProcessTree）；注入实现抛错不阻断收尾（尽力而为）。
    const kill = () => { try { (injectedKill ?? killProcessTree)(child) } catch { /* kill is best-effort */ } }
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
    child.on("error", (e) => {
      // signal 双保险（2026-09-05）：abort 时 Node signal option 杀子进程 → 本事件以
      // AbortError 先触发——让路（close 必随——close 分支 mode==="abort" →
      // settle("(stopped)")）——不把中止误报为启动失败
      if (e.name === "AbortError") return
      settle(`Error: failed to start node: ${e.message}`, false)
    })
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
