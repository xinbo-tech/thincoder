import {
  DESC,
  sanitizeOutput,
  truncate,
  makeDecoder,
  BASH_TIMEOUT_MS,
} from "./shared.mjs";
import { spawn, execFileSync } from "node:child_process";

/** Maximum buffer size per stream (stdout / stderr) before truncation */
const MAX_STREAM_BUF = 2_000_000

/** Keep only output lines matching a regex (bash filter, case-insensitive). */
function applyLineFilter(output, filter) {
  let re
  try { re = new RegExp(filter, "i") } catch (e) { return `Error: filter regex invalid: ${e.message}` }
  const lines = output.split("\n").filter((l) => re.test(l))
  if (lines.length === 0) return `(no output lines matched filter "${filter}")`
  return truncate(lines.join("\n"))
}

/** POSIX-only constructs that cmd.exe reads literally (and thus breaks). Detected
 *  so the agent is told IMMEDIATELY instead of chasing a confusing failure — warning
 *  only, never a block (the approval layer is the real gate, same as destructive-command policy). */
function posixSyntaxHint(command) {
  const hits = []
  if (/\$\([^)]*\)/.test(command)) hits.push("$(...)")
  if (command.includes("`")) hits.push("backtick")
  if (/;\s+/.test(command)) hits.push("';' separators (cmd.exe needs && or newline)")
  if (/2>\s*\/dev\/null|>\s*\/dev\/null|&>\s*\/dev\/null/.test(command)) hits.push("/dev/null (use NUL)")
  if (/'.*'/.test(command)) hits.push("single quotes (cmd.exe doesn't group)")
  if (/\$\{[A-Za-z_]/.test(command)) hits.push("${VAR} (use %VAR%)")
  if (!hits.length) return ""
  return "[hint: POSIX-only construct(s) detected — " + hits.join(", ") + ". Current shell is cmd.exe; these will NOT work. Use && / NUL / %VAR%, or use the execute tool (node) for complex logic]"
}


// ====================================================================
// bash — command execution with safety gates
// ====================================================================

/**
 * Build environment for child process.
 * Passes through all parent env vars, with non-interactive overrides (EDITOR/PAGER/TERM).
 * Sets PYTHONIOENCODING on Windows to override GBK default for Python scripts.
 */
function buildBashEnv() {
  const isWindows = process.platform === "win32"
  return {
    ...process.env,
    GIT_EDITOR: "true",
    EDITOR: "true",
    VISUAL: "true",
    GIT_PAGER: "cat",
    PAGER: "cat",
    TERM: "dumb",
    ...(isWindows ? { PYTHONIOENCODING: "utf-8" } : {}),
  }
}

/**
 * Platform-aware process tree kill.
 * POSIX: kill process group (spawned with detached=true).
 * Windows: taskkill /T to reach grandchildren (npm test's subprocesses, etc.).
 */
function killProcessTree(child) {
  if (process.platform === "win32") {
    try { execFileSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], { stdio: "ignore" }) } catch {}
  } else {
    try { process.kill(-child.pid, "SIGKILL") } catch {}
    try { child.kill("SIGKILL") } catch {} // fallback: kill directly if group kill fails
  }
}

/**
 * Detect destructive git commands and auto-snapshot BEFORE execution.
 * The scenario: the model writes uncommitted code, then (after breaking things)
 * runs `git checkout -- .` / `git restore` / `git reset --hard` / `git clean -f` to
 * roll back — which silently DESTROYS all uncommitted work. The pre-task checkpoint
 * cannot help (it was taken before the code was written); only a snapshot taken
 * immediately before the destructive command can.
 *
 * This is the defense-in-depth guard: a WIDE match that snapshots before the command
 * runs — the command itself is NEVER blocked (a determined model bypasses text
 * matching anyway; the real gate is the approval layer). A snapshot alone is not
 * enough: the model may retry a variant that slips through the exact matcher
 * (e.g. `git checkout HEAD -- .`), or run git outside the bash tool. The snapshot
 * taken here survives all of those paths.
 *
 * Matching is intentionally WIDE (false positives are harmless — one extra snapshot;
 * a missed match is a data-loss disaster).
 */
const GIT_DESTRUCTIVE_RE = /\bgit\s+(?:checkout\s+(?:[\w./-]+\s+)?--(?!\w)|checkout\s+\.|restore\s+(?!--help\b)(?!--staged\b(?!.*--worktree))|reset\s+--hard|clean\s+-(?=\S*f)(?!\S*n))/i

/** Returns { id, notice } when a snapshot was taken, else null. Never throws. */
async function gitGuardSnapshot(command, cwd) {
  if (!GIT_DESTRUCTIVE_RE.test(command)) return null
  try {
    const { isGitRepo, createCheckpoint } = await import("../git/checkpoint.mjs")
    if (!isGitRepo(cwd)) return null
    const cp = await createCheckpoint(cwd)
    if (!cp) return null
    return {
      id: cp.id,
      notice: `[auto-protection] Destructive git command detected — snapshot ${cp.id} created BEFORE execution (${cp.files} file(s): ${cp.tracked.length} tracked, ${cp.untracked.length} untracked). If this command destroyed uncommitted work, restore it: checkpoint action=checkpoint checkpointAction=rewind checkpointId=${cp.id}`,
    }
  } catch {
    return null // protection is best-effort — never block the command
  }
}

/**
 * Run a bash command: spawn, stream stdout/stderr with buffering and decoding,
 * enforce timeout and signal abort, return formatted result.
 *
 * Returns a promise that resolves to the formatted output string (stdout + stderr + status + truncation note).
 */
function runBash(command, cwd, { timeout, signal, onOutput, shell }) {
  return new Promise((resolve) => {
    // Windows + default cmd: force UTF-8 code page for this child process (each spawn
    // is an independent cmd, so chcp has no side effects on other shells) — otherwise
    // cmd emits GBK bytes that the UTF-8 decoder turns into mojibake, and the model
    // fights encoding errors instead of the actual command (reported UX on win11).
    const effectiveCommand = process.platform === "win32" && !shell
      ? `chcp 65001 >nul && ${command}`
      : command
    // args MUST be an explicit [] — the two-arg spawn(cmd, options) form is
    // DEP0190-deprecated (Node 24): the options object would be misread as args.
    const child = spawn(effectiveCommand, [], {
      cwd,
      shell: shell ?? true,
      windowsHide: true,
      detached: process.platform !== "win32",
      stdio: ["ignore", "pipe", "pipe"],
      env: buildBashEnv(),
      // 双保险（2026-09-05——裸 spawn 无 signal 教训：abort 只靠 killTree 手动杀——taskkill
      // best-effort 可能失败/竞态）——Node signal option = 第一道（abort 时自动杀**直接**子
      // 进程——cmd——语义保证）；killTree 仍是必需兜底（孙进程握管道使 close 不触发——见
      // L191 注释——spawn 级 kill 不达孙进程）
      ...(signal ? { signal } : {}),
    })

    const killTree = () => killProcessTree(child)

    // Separate decoders for stdout / stderr (same encoding in practice, but separate
    // collection is cleaner and lets the model locate errors via stderr quickly)
    const outDecoder = makeDecoder()
    const errDecoder = makeDecoder()
    let outBuf = ""
    let errBuf = ""
    let truncatedNote = ""

    child.stdout.on("data", (d) => {
      const s = sanitizeOutput(outDecoder(d))
      if (s) onOutput?.(s)
      if (outBuf.length < MAX_STREAM_BUF) outBuf += s
      else if (!truncatedNote) truncatedNote =
        "\n[... output exceeded 2MB, remainder discarded — redirect to a file if you need the full output]"
    })

    child.stderr.on("data", (d) => {
      const s = sanitizeOutput(errDecoder(d))
      if (s) onOutput?.(s)
      if (errBuf.length < MAX_STREAM_BUF) errBuf += s
    })

    const timer = setTimeout(killTree, timeout)
    if (signal) signal.addEventListener("abort", killTree, { once: true })

    let settled = false
    let graceTimer = null
    const finish = (result) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      clearTimeout(graceTimer)
      // 2026-09-05（advisor 🟡#2）：收尾移除 abort 监听器——ctx.signal 为长生命周期对象，
      // 残留 once 监听器每次 bash 调用累积（闭包持有 child/输出缓冲直到 abort 才释放）
      if (signal) signal.removeEventListener("abort", killTree)
      resolve(result)
    }

    child.on("error", (error) => {
      // signal 双保险（2026-09-05）：abort 时 Node signal option 杀直接子进程 → 本事件
      // 以 AbortError 先触发——**跳过 finish**（不 settled）——exit 事件随后必到（实证
      // 2ms 内）走 L195 分支带已收集输出收尾（user interrupted——不丢 partial）；
      // 非 abort 的真 spawn 错误（command not found 等）保持原分支
      if (error.name === "AbortError") return
      // spawn 失败形态（2026-09-18 工具失败判据同族残项批）：进程未启动 ⇒ 无退出码（不伪造），
      // 尾附独占状态位 `(spawn failed)`（判据族第三成员——`webview/lib.js toolFailureStatus`）；
      // 诊断行 `Command failed: <errno>` 与 `[stdout]:` 段原样保留（诊断面不入判据）。
      const parts = [
        `Command failed: ${error.message}`,
        `[stdout]:\n${outBuf || "(empty)"}`,
        "(spawn failed)",
      ]
      finish(truncate(parts.join("\n\n")))
    })

    // Shell exited. Normally 'close' follows within milliseconds — but a BACKGROUND
    // child (start /b, &, nohup …) inherits the stdio pipes, so the pipe stays open
    // and 'close' never fires: the tool would hang until the timeout. Resolve after
    // a short grace period instead, returning whatever output was collected.
    child.on("exit", (code, exitSignal) => {
      graceTimer = setTimeout(() => {
        const outFlush = sanitizeOutput(outDecoder(Buffer.alloc(0), true))
        const errFlush = sanitizeOutput(errDecoder(Buffer.alloc(0), true))
        if (outFlush) onOutput?.(outFlush)
        if (errFlush) onOutput?.(errFlush)
        const status = exitSignal ? `killed: ${exitSignal}` : `exit code ${code}`
        const parts = [`[stdout]:\n${(outBuf + outFlush).trim() || "(empty)"}`]
        if ((errBuf + errFlush).trim()) parts.push(`[stderr]:\n${(errBuf + errFlush).trim()}`)
        parts.push(`(${status})`)
        parts.push("[background] the shell exited but a child process still holds the output pipe — output may be incomplete; the process may still be running")
        finish(truncate(parts.join("\n\n") + truncatedNote))
      }, 1500)
    })

    child.on("close", (code, exitSignal) => {
      // Flush decoder tails — also push final bytes to panel
      const outFlush = sanitizeOutput(outDecoder(Buffer.alloc(0), true))
      const errFlush = sanitizeOutput(errDecoder(Buffer.alloc(0), true))
      outBuf += outFlush
      errBuf += errFlush
      if (outFlush) onOutput?.(outFlush)
      if (errFlush) onOutput?.(errFlush)

      // Windows has no POSIX signals — check signal.aborted for user interrupts
      const status = (exitSignal || signal?.aborted)
        ? `killed: ${signal?.aborted ? "user interrupted" : "timeout"}`
        : `exit code ${code}`

      const parts = [`[stdout]:\n${outBuf.trim() || "(empty)"}`]
      if (errBuf.trim()) parts.push(`[stderr]:\n${errBuf.trim()}`)
      parts.push(`(${status})`)
      finish(truncate(parts.join("\n\n") + truncatedNote))
    })
  })
}

// ====================================================================
// tool definitions
// ====================================================================

export const bashTool = {
  name: "bash",
  description: DESC("bash"),
  parameters: {
    type: "object",
    properties: {
      command: { type: "string", description: "Shell command to execute" },
      timeout: { type: "number", description: `Timeout in ms (default ${BASH_TIMEOUT_MS})` },
      filter: { type: "string", description: "Optional: only return output lines matching this regex (case-insensitive)" },
    },
    required: ["command"],
  },
  readonly: false,
  outputPanel: true, // stream stdout/stderr to panel during execution, collapse to summary on completion
  async execute(args, ctx) {
    // Git destructive commands are NEVER rejected — the model would bypass the
    // guard anyway. Instead: snapshot every uncommitted file first, then ALLOW
    // the command. The snapshot makes the rollback reversible (defense in depth:
    // the wide matcher also covers variants like `git checkout HEAD -- .`).
    const guard = await gitGuardSnapshot(args.command, ctx.cwd)
    const result = await runBash(args.command, ctx.cwd, {
      timeout: args.timeout ?? BASH_TIMEOUT_MS,
      signal: ctx.signal,
      onOutput: ctx.onOutput,
      shell: ctx.agent?.config?.shell ?? null,
    })
    const filtered = args.filter ? applyLineFilter(result, args.filter) : result
    const hint = posixSyntaxHint(args.command)
    const body = guard ? `${guard.notice}\n\n${filtered}` : filtered
    return hint ? `${hint}\n${body}` : body
  },
}
