import {
  DESC,
  sanitizeOutput,
  truncate,
  makeDecoder,
  BASH_TIMEOUT_MS,
  IGNORED_DIRS,
  resolveInCwd,
  hasFileRedirection,
  globToRegex,
  normalizeEOL,
} from "./shared.mjs";
import { spawn, execFileSync } from "node:child_process";
import { readFile, readdir, stat, lstat } from "node:fs/promises";
import { join } from "node:path";

/** Maximum buffer size per stream (stdout / stderr) before truncation */
const MAX_STREAM_BUF = 2_000_000

/** Escape a string for literal regex matching (grep literal=true). */
function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

/** Keep only output lines matching a regex (bash filter, case-insensitive). */
function applyLineFilter(output, filter) {
  let re
  try { re = new RegExp(filter, "i") } catch (e) { return `Error: filter regex invalid: ${e.message}` }
  const lines = output.split("\n").filter((l) => re.test(l))
  if (lines.length === 0) return `(no output lines matched filter "${filter}")`
  return truncate(lines.join("\n"))
}

// ====================================================================
// bash — command execution with safety gates
// ====================================================================

/**
 * Pre-execution safety checks for bash commands.
 * Layers: file redirection (guides toward structured tools, not a security gate).
 * Destructive commands (rm -rf, DROP TABLE, ...) are deliberately NOT rejected:
 * a determined model bypasses text matching anyway — real security is at the
 * tool approval layer plus snapshot backups (gitGuardSnapshot / checkpoint).
 * Git destructive ops: snapshot-then-proceed, never block.
 */
function checkBashSafety(command, cwd) {
  if (hasFileRedirection(command)) {
    throw new Error("File redirection via bash is not allowed — use the write/edit/insert_after tools instead")
  }
}

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
 * Run a bash command: spawn, stream stdout/stderr with buffering and decoding,
 * enforce timeout and signal abort, return formatted result.
 *
 * Returns a promise that resolves to the formatted output string (stdout + stderr + status + truncation note).
 */

/**
 * Detect destructive git commands and auto-snapshot BEFORE execution.
 * The scenario: the model writes uncommitted code, then (after breaking things)
 * runs `git checkout -- .` / `git restore` / `git reset --hard` / `git clean -f` to
 * roll back — which silently DESTROYS all uncommitted work. The pre-task checkpoint
 * cannot help (it was taken before the code was written); only a snapshot taken
 * immediately before the destructive command can.
 *
 * This is layer 1 (defense in depth): a WIDE match that snapshots before the command
 * runs. Layer 2 (checkBashSafety) then rejects the command when uncommitted changes
 * exist — but a rejection alone is not enough: the model may retry a variant that
 * slips through the exact matcher (e.g. `git checkout HEAD -- .`), or run git outside
 * the bash tool. The snapshot taken here survives all of those paths.
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

function runBash(command, cwd, { timeout, signal, onOutput, shell }) {
  return new Promise((resolve) => {
    // Windows + default cmd: force UTF-8 code page for this child process (each spawn
    // is an independent cmd, so chcp has no side effects on other shells) — otherwise
    // cmd emits GBK bytes that the UTF-8 decoder turns into mojibake, and the model
    // fights encoding errors instead of the actual command (reported UX on win11).
    const effectiveCommand = process.platform === "win32" && !shell
      ? `chcp 65001 >nul && ${command}`
      : command
    const child = spawn(effectiveCommand, {
      cwd,
      shell: shell ?? true,
      windowsHide: true,
      detached: process.platform !== "win32",
      stdio: ["ignore", "pipe", "pipe"],
      env: buildBashEnv(),
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
      resolve(result)
    }

    child.on("error", (error) => {
      finish(truncate(`Command failed: ${error.message}\n[stdout]:\n${outBuf || "(empty)"}`))
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
    checkBashSafety(args.command, ctx.cwd)
    const guard = await gitGuardSnapshot(args.command, ctx.cwd)
    const result = await runBash(args.command, ctx.cwd, {
      timeout: args.timeout ?? BASH_TIMEOUT_MS,
      signal: ctx.signal,
      onOutput: ctx.onOutput,
      shell: ctx.agent?.config?.shell ?? null,
    })
    const filtered = args.filter ? applyLineFilter(result, args.filter) : result
    return guard ? `${guard.notice}\n\n${filtered}` : filtered
  },
}

// ---------------------------------------------------------------- glob

export const globTool = {
  name: "glob",
  description: DESC("glob"),
  parameters: {
    type: "object",
    properties: {
      pattern: { type: "string", description: "Glob pattern" },
      path: { type: "string", description: "Directory to search in (default cwd)" },
    },
    required: ["pattern"],
  },
  readonly: true,
  async execute(args, ctx) {
    const base = resolveInCwd(ctx, args.path ?? ".")
    const regex = globToRegex(args.pattern)
    const results = []
    for await (const relPath of walkFiles(base)) {
      if (regex.test(relPath)) {
        results.push(relPath)
        if (results.length >= 1000) break
      }
    }
    if (results.length === 0) return "(no matches)"
    return truncate(results.sort().join("\n"))
  },
}

/** Recursively traverse files, yield relative paths (skip IGNORED_DIRS) */
async function* walkFiles(dir, rel = "") {
  let entries
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch {
    return
  }
  for (const e of entries) {
    // Skip ignored dirs AND symbolic links (symlinks to directories would cause infinite loops)
    if (e.isSymbolicLink()) continue
    if (e.isDirectory() && IGNORED_DIRS.has(e.name)) continue
    const relPath = rel ? `${rel}/${e.name}` : e.name
    if (e.isDirectory()) {
      yield* walkFiles(join(dir, e.name), relPath)
    } else {
      yield relPath
    }
  }
}

/** Glob to regex: **\/ matches zero or more directory levels, ** crosses directories, * within segment, ? single char within segment */

// ---------------------------------------------------------------- grep

export const grepTool = {
  name: "grep",
  description: DESC("grep"),
  parameters: {
    type: "object",
    properties: {
      pattern: { type: "string", description: "Regular expression, or a literal string when literal=true" },
      path: { type: "string", description: "Directory or file to search (default cwd)" },
      glob: { type: "string", description: "Only search files matching this glob (e.g. '*.mjs')" },
      ignoreCase: { type: "boolean", description: "Case-insensitive match (default false)" },
      literal: { type: "boolean", description: "Literal string match — no regex interpretation (default false)" },
      before: { type: "integer", description: "Lines of context to show before each match (grep -B). Default 0" },
      after: { type: "integer", description: "Lines of context to show after each match (grep -A). Default 0" },
    },
    required: ["pattern"],
  },
  readonly: true,
  async execute(args, ctx) {
    const base = resolveInCwd(ctx, args.path ?? ".")
    let regex
    try {
      const pat = args.literal ? escapeRegExp(String(args.pattern)) : args.pattern
      regex = new RegExp(pat, args.ignoreCase ? "i" : "")
    } catch (e) {
      throw new Error(`grep pattern /${args.pattern}/ is not a valid regex: ${e.message}`)
    }
    const fileFilter = args.glob ? globToRegex(args.glob) : null
    const before = Math.max(0, Math.floor(args.before ?? 0))
    const after = Math.max(0, Math.floor(args.after ?? 0))
    const wantCtx = before > 0 || after > 0
    const hits = [] // { file, line(1-based), text }
    const fileLines = new Map() // file -> string[] (cached only when context lines requested)

    async function search(file) {
      let content
      try {
        // Large file guard: skip files over 10MB to prevent OOM
        const fst = await stat(file)
        if (fst.size > 10_000_000) return
        content = normalizeEOL(await readFile(file, "utf8"))
      } catch {
        return // Skip unreadable files; binary files will be read as UTF-8 and searched (may produce garbled matches)
      }
      const lines = content.split("\n")
      if (wantCtx) fileLines.set(file, lines)
      for (let i = 0; i < lines.length; i++) {
        if (regex.test(lines[i])) {
          hits.push({ file, line: i + 1, text: lines[i] })
          if (hits.length >= 200) return
        }
      }
    }

    async function walk(target) {
      if (hits.length >= 200) return
      // Use lstat to avoid following symlinks — prevents ./evil → /etc from making grep scan the entire system
      let s
      try { s = await lstat(target) } catch { return }
      if (!s.isDirectory()) {
        if (!fileFilter || fileFilter.test(target.split(/[\\/]/).pop())) await search(target)
        return
      }
      let entries
      try {
        entries = await readdir(target, { withFileTypes: true })
      } catch {
        return
      }
      for (const e of entries) {
        if (e.isDirectory() && IGNORED_DIRS.has(e.name)) continue
        await walk(join(target, e.name))
      }
    }

    await walk(base)
    if (hits.length === 0) return "(no matches)"

    // No context: keep original path:line: content format
    if (!wantCtx) {
      return truncate(hits.map((h) => `${h.file}:${h.line}: ${h.text}`).join("\n"))
    }

    // With context: matching lines use ':', context lines use '-' (like ripgrep); overlapping ranges in same file are merged and de-duplicated
    const fileMatched = new Map() // file -> Set<line>
    for (const h of hits) {
      if (!fileMatched.has(h.file)) fileMatched.set(h.file, new Set())
      fileMatched.get(h.file).add(h.line)
    }
    const out = []
    for (const [file, matchedLines] of fileMatched) {
      const lines = fileLines.get(file) ?? []
      const lineSet = new Set()
      for (const ml of matchedLines) {
        for (let l = Math.max(1, ml - before); l <= Math.min(lines.length, ml + after); l++) lineSet.add(l)
      }
      for (const l of [...lineSet].sort((a, b) => a - b)) {
        const sep = matchedLines.has(l) ? ":" : "-"
        out.push(`${file}${sep}${l}${sep} ${lines[l - 1]}`)
      }
    }
    return truncate(out.join("\n"))
  },
}

// ---------------------------------------------------------------- websearch

export const lsTool = {
  name: "ls",
  description: DESC("ls"),
  parameters: {
    type: "object",
    properties: {
      path: { type: "string", description: "Directory path (default cwd)" },
      filter: { type: "string", description: "Only list entries matching this glob (e.g. '*.mjs', '*test*')" },
    },
  },
  readonly: true,
  async execute(args, ctx) {
    const abs = resolveInCwd(ctx, args.path ?? ".")
    const filterRe = args.filter ? globToRegex(args.filter) : null
    let entries
    try {
      entries = await readdir(abs, { withFileTypes: true })
    } catch (e) {
      if (e.code === "ENOENT" || e.code === "ENOTDIR") throw new Error(`ls: ${args.path ?? "."} — ${e.code === "ENOTDIR" ? "not a directory" : "not found"}`)
      throw e
    }
    const rows = await Promise.all(
      entries
        .filter((e) => !filterRe || filterRe.test(e.name))
        .slice(0, 500)
        .map(async (e) => {
        const s = await stat(join(abs, e.name)).catch(() => null)
        const isDir = e.isDirectory()
        return {
          dir: isDir,
          name: e.name + (isDir ? "/" : ""),
          size: s?.size ?? 0,
          mtime: s ? s.mtime.toISOString().slice(0, 16).replace("T", " ") : "?",
        }
      }),
    )
    rows.sort((a, b) => (a.dir === b.dir ? a.name.localeCompare(b.name) : a.dir ? -1 : 1))
    if (rows.length === 0) return "(no entries)"
    const out = rows.map((r) => `${r.dir ? "d" : "-"}  ${r.name.padEnd(40)} ${String(r.size).padStart(10)}  ${r.mtime}`)
    return truncate(out.join("\n"))
  },
}

// ---------------------------------------------------------------- fetch
