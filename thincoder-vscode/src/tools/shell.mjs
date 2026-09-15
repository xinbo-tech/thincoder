/**
 * shell.mjs — Shell command execution tool: bash
 * Includes the CLI git-destruction protection (parity with the core guard — @thincoder/core/tools/bash.mjs):
 *   1. Layer 1 — WIDE auto-snapshot before destructive git commands (covers variants
 *      the exact matcher misses, e.g. `git checkout HEAD -- .`). Snapshot = FULL-COPY
 *      checkpoint（核实现 `@thincoder/core/git/checkpoint.mjs`——自持镜像已删〔S2 W5〕，CHECKPOINT.md F5
 *      存储统一——不再是 git stash），未提交工作（含 untracked）在执行前落入
 *      ~/.thincoder/checkpoints/{cwdHash12}/，恢复入口：checkpointAction=rewind。
 *   2. Layer 2 — 命令永不拦截（与 CLI 一致：文本拦截是安全剧场，真实防线 = 审批层 + 快照）。
 */

import { exec, execFileSync } from "node:child_process"
import * as vscode from "vscode"
import { DESC, BASH_TIMEOUT_MS, makeDecoder, sanitizeOutput, truncate } from "@thincoder/core/tools/shared.mjs"
import { MAX_STREAM_BUF } from "./shared.mjs" // W14 拆壳薄壳（端壳常量——核内无此值）

// ─── Terminal modes (A: visible / B: inject) ─────────────────

/** Strip ANSI escape sequences from terminal stream data (colors, cursor moves, OSC). */
function stripAnsi(s) {
  return s.replace(/\x1b\[[0-9;?]*[a-zA-Z]|\x1b\][^\x07\x1b]*(?:\x07|\x1b\\)/g, "")
}

/** Keep only output lines matching a regex (bash filter, case-insensitive). */
function applyLineFilter(output, filter) {
  let re
  try { re = new RegExp(filter, "i") } catch (e) { return `Error: filter regex invalid: ${e.message}` }
  const lines = output.split("\n").filter((l) => re.test(l))
  if (lines.length === 0) return `(no output lines matched filter "${filter}")`
  return truncate(lines.join("\n"))
}

/** Mode B — inject: fill the command into the user's terminal WITHOUT running it.
 *  The user reviews and presses Enter. Output is not captured. */
function injectToTerminal(command) {
  const term = vscode.window.activeTerminal ?? vscode.window.createTerminal({ name: "ThinCoder" })
  term.show(true) // preserveFocus — don't yank the user's cursor
  term.sendText(command, false)
  return "(injected into the user's terminal — NOT executed. The user reviews and presses Enter. " +
    "No output was captured — do NOT report a result. If the command should run autonomously, omit the terminal parameter.)"
}

/** Pick a terminal with shell integration: prefer the ACTIVE terminal (carries the
 *  user's shell state), else create/reuse a "ThinCoder" terminal and wait briefly
 *  for shell integration to activate. Returns null when unavailable (caller falls
 *  back to the isolated child process). */
async function ensureIntegratedTerminal() {
  const active = vscode.window.activeTerminal
  if (active?.shellIntegration) return active
  let term = vscode.window.terminals.find((t) => t.name === "ThinCoder" && !t.exitStatus)
  if (!term) term = vscode.window.createTerminal({ name: "ThinCoder" })
  if (term.shellIntegration) return term
  const ok = await new Promise((resolve) => {
    let disp = null
    const timer = setTimeout(() => { disp?.dispose(); resolve(false) }, 5000)
    disp = vscode.window.onDidChangeTerminalShellIntegration((e) => {
      if (e.terminal === term) { clearTimeout(timer); disp.dispose(); resolve(true) }
    })
  })
  return ok ? term : null
}

/** Mode A — visible: execute in the user's terminal via shellIntegration.executeCommand.
 *  The command runs visibly (the user watches it live) and inherits the user's shell
 *  state. Stop/timeout send Ctrl+C to the terminal (no kill API exists for shell-
 *  integration executions). Returns null when shell integration is unavailable. */
async function runInVisibleTerminal(command, timeout, ctx) {
  const term = await ensureIntegratedTerminal()
  if (!term) return null
  term.show(true)
  const execution = term.shellIntegration.executeCommand(command)
  const stream = execution.read()
  let out = ""
  return await new Promise((resolve) => {
    let settled = false
    const finish = (text) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      resolve(text)
    }
    const interrupt = () => term.sendText("\x03") // Ctrl+C the foreground process
    const timer = setTimeout(() => {
      interrupt()
      finish(`(killed — timeout ${timeout || BASH_TIMEOUT_MS}ms; interrupted in the terminal)\n[stdout]:\n${out.trim() || "(empty)"}`)
    }, timeout || BASH_TIMEOUT_MS)
    if (ctx.signal) {
      const onAbort = () => { interrupt(); finish(`(stopped)\n[stdout]:\n${out.trim() || "(empty)"}`) }
      if (ctx.signal.aborted) onAbort()
      else ctx.signal.addEventListener("abort", onAbort, { once: true })
    }
    ;(async () => {
      try {
        for await (const chunk of stream) out += stripAnsi(chunk)
        finish(`[stdout]:\n${out.trim() || "(empty)"}\n(exit code unavailable in terminal mode — watch the terminal if it matters)`)
      } catch (e) {
        finish(`Error: terminal execution failed: ${e.message}`)
      }
    })()
  })
}


// Pass all env vars EXCEPT known secret patterns.
// Blacklist approach — whitelisting is too fragile and breaks npm, git SSH, etc.
const SECRET_PATTERNS = /_(?:KEY|TOKEN|SECRET|PASSWORD|PASS|CREDENTIALS?)(?:_|$)|^(?:NPM_TOKEN|GITHUB_TOKEN|GITLAB_TOKEN|AWS_|AZURE_|GCLOUD_)/i
const SAFE_ENV = Object.fromEntries(
  Object.entries(process.env).filter(([k]) => !SECRET_PATTERNS.test(k))
)
// Always override interactive/pager tools
SAFE_ENV.GIT_PAGER = "cat"
SAFE_ENV.PAGER = "cat"

/** Kill the whole process tree of a spawned child (CLI parity): Windows uses
 *  taskkill /T /F (tree + force), POSIX kills the process group. Plain
 *  child.kill() only reaps the direct child — grandchildren (npm test's
 *  subprocesses, etc.) would leak. */
function killProcessTree(child) {
  if (process.platform === "win32") {
    try { execFileSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], { stdio: "ignore" }) } catch { /* already gone */ }
  } else {
    try { process.kill(-child.pid, "SIGKILL") } catch { /* */ }
    try { child.kill("SIGKILL") } catch { /* fallback if group kill fails */ }
  }
}
SAFE_ENV.EDITOR = "true"
SAFE_ENV.TERM = "dumb"
// Windows: force UTF-8 for Python child output (CLI parity — cmd GBK would garble)
if (process.platform === "win32") SAFE_ENV.PYTHONIOENCODING = "utf-8"

// ─── git destructive-command protection (CLI parity) ─────────────

/**
 * WIDE matcher: snapshot before ANY destructive git command. False positives are
 * harmless (one extra snapshot); a missed match is a data-loss disaster.
 * Git commands are NEVER rejected — the model would just find a way around the
 * rejection. Snapshot-then-proceed: every uncommitted file is copied as a FULL-COPY
 * checkpoint（含 untracked）and the command is allowed to run.
 */
const GIT_DESTRUCTIVE_RE = /\bgit\s+(?:checkout\s+(?:[\w./-]+\s+)?--(?!\w)|checkout\s+\.|restore\s+(?!--help\b)(?!--staged\b(?!.*--worktree))|reset\s+--hard|clean\s+-(?=\S*f)(?!\S*n))/i

/**
 * Auto-snapshot current uncommitted work as a FULL-COPY checkpoint — parity with the core
 * gitGuardSnapshot (@thincoder/core/tools/bash.mjs:96，CHECKPOINT.md D4 两端 guard 对齐：
 * 不再是 git stash)。快照覆盖 `git checkout -- .` / `restore` / `reset --hard` / `clean -f`
 * 会毁掉的一切（含 untracked）；恢复入口 = checkpoint 工具 checkpointAction=rewind。
 * Returns { id, notice } or null. Never throws.
 */
async function gitGuardSnapshot(command, cwd) {
  if (!GIT_DESTRUCTIVE_RE.test(command)) return null
  try {
    const { isGitRepo, createCheckpoint } = await import("@thincoder/core/git/checkpoint.mjs")
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
// ─── bash tool ───────────────────────────────────────────────────

// Description is platform-aware: the isolated child runs cmd.exe on Windows and /bin/sh
// elsewhere; the terminal modes run in the USER'S shell (often PowerShell 5.1, which does
// NOT support &&). Models trained on bash otherwise emit broken commands for both paths.
const isWin = process.platform === "win32"
const SHELL_NOTES = isWin
  ? "The default isolated child process runs Windows cmd.exe: && and || chaining WORK, use cmd built-ins (del, dir, type, findstr, tasklist) and forward-or-backslash paths. Bash-isms (rm -rf, cp -r, head, 2>/dev/null, $(...)) FAIL — use del /s /q, copy -r, node -e, >nul 2>&1 instead. For complex logic prefer node -e over shell gymnastics.\\n" +
    "- terminal: \"visible\"/\"inject\" run in the USER'S terminal, which may be PowerShell 5.1 — PS 5.1 does NOT support && or || (use ; to sequence, or separate calls) and aliases differ (Remove-Item, Copy-Item). Check the user's shell before assuming cmd semantics."
  : "The default isolated child process runs /bin/sh (POSIX). \"visible\"/\"inject\" terminal modes run in the user's OWN terminal — it may be a different shell (fish, nushell); prefer portable constructs there."

export const bashTool = {
  name: "bash",
  description: DESC("bash"),
  parameters: {
    type: "object",
    properties: {
      command: { type: "string", description: "Shell command" },
      timeout: { type: "number", description: "Timeout in ms" },
      filter: { type: "string", description: "Optional — only return output lines matching this regex (case-insensitive)" },
      terminal: { type: "string", enum: ["visible", "inject"], description: "Run in / inject into the user's terminal" },
    },
    required: ["command"],
  },
  async execute({ command, timeout, terminal, filter }, ctx) {
    // inject: hand the command to the user's terminal WITHOUT running it — the
    // user reviews and presses Enter. No guard snapshot (nothing executes yet;
    // the user's review IS the guard).
    if (terminal === "inject") return injectToTerminal(command)

    // Git destructive commands are NEVER rejected (the model would just find a
    // way around the rejection). Snapshot-then-proceed (CLI parity): every
    // uncommitted file is checkpointed (full-copy mirror) before the command runs
    // — rollback becomes reversible instead of a data-loss event.
    const guard = await gitGuardSnapshot(command, ctx.cwd)

    // visible: run in the user's own terminal via shell integration (inherits
    // the user's shell state). Falls back to the isolated child process when
    // shell integration is unavailable.
    if (terminal === "visible") {
      const out = await runInVisibleTerminal(command, timeout, ctx)
      if (out != null) {
        const final = filter ? applyLineFilter(out, filter) : out
        return guard ? `${guard.notice}\n\n${final}` : final
      }
      // null = shell integration unavailable → fall through to child process
    }

    return new Promise((resolve) => {
      let settled = false
      const finish = (out) => {
        if (settled) return
        settled = true
        // Output shows in the in-conversation tool card (finishTool auto-expands
        // it) — NOT the side tool panel (that duplication read as an intrusive
        // overlay; reported as jarring).
        const final = filter ? applyLineFilter(out, filter) : out
        resolve(guard ? `${guard.notice}\n\n${final}` : final)
      }
      // Shell override from config (CLI parity). Windows + default cmd: force UTF-8
      // code page for this child — cmd emits GBK bytes otherwise, which the UTF-8
      // capture turns into mojibake (reported win11 encoding pain).
      const shell = ctx.agent?.config?.shell ?? null
      const effectiveCommand = process.platform === "win32" && !shell
        ? `chcp 65001 >nul && ${command}`
        : command
      const child = exec(effectiveCommand, {
        cwd: ctx.cwd,
        timeout: timeout || BASH_TIMEOUT_MS,
        env: SAFE_ENV,
        maxBuffer: 2 * 1024 * 1024,
        ...(shell ? { shell } : {}),
        // 双保险（2026-09-05——裸 exec 无 signal 教训）：Node signal option = 第一道
        // （abort 自动杀**直接**子进程——语义保证）；killProcessTree 兜底保留（孙进程
        // 握管道 → close 不触发 → 下方立即 resolve 路径——见 abort handler 注释）。
        // ⚠ 时序实证：AbortError 回调先于 onAbort 到达（实验 callback@3501 vs onAbort@
        // 3502）——两处都带 collectedResult（不丢 partial）——settled 保护先到者赢。
        ...(ctx.signal ? { signal: ctx.signal } : {}),
      }, (error, stdout, stderr) => {
        if (error && error.name === "AbortError") {
          // signal 双保险回归实证（2026-09-05）：signal option 下 Node 内部 handler 先杀
          // 进程 → 本回调**先于**下方 onAbort 到达（实验：callback@3501 vs onAbort@3502）
          // ——必须同带已收集输出（否则 partial 丢——裸 "(stopped)" 回归）——与 onAbort
          // 的 collectedResult 语义一致；进程已死——outBuf 已含全部已到数据
          finish(outBuf.trim() || errBuf.trim() ? collectedResult("stopped") : "(stopped)")
          return
        }
        if (error && error.killed) {
          finish(`(killed — timeout ${timeout || BASH_TIMEOUT_MS}ms)`)
          return
        }
        const out = [
          stdout ? `[stdout]:\n${stdout}` : "",
          stderr ? `[stderr]:\n${stderr}` : "",
          `(exit code ${error ? error.code ?? 1 : 0})`,
        ].filter(Boolean).join("\n")
        finish(out)
      })
      // Incremental capture (CLI parity): decode bytes with chunk-boundary safety
      // (multi-byte UTF-8 split across chunks would mojibake with per-chunk
      // toString), sanitize, stream live via onOutput, and cap each stream's buffer
      // — the exit-grace and abort paths report REAL collected output.
      const outDecoder = makeDecoder()
      const errDecoder = makeDecoder()
      let outBuf = "", errBuf = "", truncatedNote = ""
      child.stdout?.on("data", (d) => {
        const s = sanitizeOutput(outDecoder(Buffer.isBuffer(d) ? d : Buffer.from(d)))
        if (s) ctx.onOutput?.(s)
        if (outBuf.length < MAX_STREAM_BUF) outBuf += s
        else if (!truncatedNote) truncatedNote =
          "\n[... output exceeded 2MB, remainder discarded — redirect to a file if you need the full output]"
      })
      child.stderr?.on("data", (d) => {
        const s = sanitizeOutput(errDecoder(Buffer.isBuffer(d) ? d : Buffer.from(d)))
        if (s) ctx.onOutput?.(s)
        if (errBuf.length < MAX_STREAM_BUF) errBuf += s
      })
      const flushDecoders = () => {
        outBuf += sanitizeOutput(outDecoder(Buffer.alloc(0), true))
        errBuf += sanitizeOutput(errDecoder(Buffer.alloc(0), true))
      }
      const collectedResult = (status) => {
        flushDecoders()
        const parts = [`[stdout]:\n${outBuf.trim() || "(empty)"}`]
        if (errBuf.trim()) parts.push(`[stderr]:\n${errBuf.trim()}`)
        parts.push(`(${status})`)
        return truncate(parts.join("\n")) + truncatedNote
      }
      // Stop: resolve IMMEDIATELY on abort (don't wait for stdio pipes to close —
      // exec's callback hangs when a grandchild survives the kill). Kill the WHOLE
      // process tree (CLI killProcessTree parity: Windows taskkill /T /F, POSIX
      // group-kill) so grandchildren (npm test's subprocesses, etc.) don't leak.
      if (ctx.signal) {
        const onAbort = () => {
          killProcessTree(child)
          const collected = collectedResult("stopped")
          finish(outBuf.trim() || errBuf.trim() ? collected : "(stopped)")
        }
        if (ctx.signal.aborted) onAbort()
        else ctx.signal.addEventListener("abort", onAbort, { once: true })
      }
      // exec's callback waits for the stdio pipes to close. A BACKGROUND child
      // (start /b, &, …) inherits them, so the callback never fires and the tool
      // hangs until the timeout — resolve after a grace period instead, reporting
      // whatever output was collected (CLI parity).
      child.once("exit", (code, exitSignal) => {
        setTimeout(() => {
          const status = exitSignal ? `killed: ${exitSignal}` : `exit code ${code ?? 0}`
          finish(collectedResult(status) + "\n[background] the shell exited but a child process still holds the output pipe — output may be incomplete; the process may still be running")
        }, 1500)
      })
    })
  },
  outputPanel: true,
}
