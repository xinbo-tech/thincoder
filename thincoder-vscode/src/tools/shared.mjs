/**
 * shared.mjs — Helper functions and constants shared across tool modules
 */

import { join, isAbsolute } from "node:path"
import { readdirSync, statSync, openSync, readSync, closeSync } from "node:fs"
import * as vscode from "vscode"
import { loadToolDoc } from "@thincoder/core/prompt-files.mjs"

/** Load a tool's external description file (`<name>.md`) — **本端描述装载面**。
 *  W2（2026-09-15）：承载面 = 核包 `tool-docs/`（`loadToolDoc`——契约 8：调用方不做路径运算；
 *  本端 25 档 `src/tools/*.md` 已删）。同步读、无缓存、缺失即抛（fail-visible——描述文件是
 *  发布物的一部分，静默空描述不可接受）。`{{inject:…}}` 锚 = 装配面调用期应用
 *  （`tools/index.mjs` `toOpenAISchema`——CORE-UNIFICATION §2.13.8）。 */
export const DESC = (name) => loadToolDoc(name)

export const BASH_TIMEOUT_MS = 120000

/** Maximum buffer size per stream (stdout / stderr) before truncation (CLI parity). */
export const MAX_STREAM_BUF = 2_000_000

/** Max chars in a finished tool result (CLI parity). */
export const MAX_OUTPUT_CHARS = 200_000

/** Default/cap for read windows (CLI shared.mjs parity — DUAL-END-TRUNCATION 2026-09-09
 *  补 VSC 侧 read 2000 上限：双端锁步判别锚/窗口同构）。 */
export const MAX_READ_LINES = 2000

const ENCODING_DETECT_MAX_TRIM = 3

/** Incremental byte→text decoder with encoding detection (CLI shared.mjs parity).
 *  Plain ASCII fast path; UTF-8 with chunk-boundary safety (stream:true); GBK
 *  fallback for legacy Windows tools. Each call creates an independent instance —
 *  never share across parallel streams (internal state accumulates). */
export function makeDecoder() {
  let decoder = null
  let pending = Buffer.alloc(0)
  return (d, flush = false) => {
    pending = Buffer.concat([pending, d])
    if (!decoder) {
      const hasHighByte = pending.some((b) => b >= 0x80)
      if (!hasHighByte) { const s = pending.toString("ascii"); pending = Buffer.alloc(0); return s }
      for (let trim = 0; trim <= ENCODING_DETECT_MAX_TRIM && !decoder; trim++) {
        try { new TextDecoder("utf-8", { fatal: true }).decode(pending.subarray(0, pending.length - trim)); decoder = new TextDecoder("utf-8") }
        catch { /* continue */ }
      }
      if (!decoder) decoder = new TextDecoder("gbk")
    }
    const s = decoder.decode(pending, { stream: !flush })
    pending = Buffer.alloc(0)
    return s
  }
}

/** Strip ANSI escape sequences and normalize newlines (CLI shared.mjs parity). */
export function sanitizeOutput(s) {
  return s
    .replace(/\x1b\[[0-9;?]*[\x40-\x7E]|\x1b\][^\x07\x1b]*(?:\x07|\x1b\\)|\x1b[()][0-9A-B]|\x1b[=>#][0-9]?/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
}

/** Get the open TextDocument for a path, or null if not open.
 *  win32 is case-insensitive: `d:\` vs `D:\` used to mismatch and put us on the
 *  disk-write path while the editor held the same file (split-brain). */
export function getOpenDoc(absPath) {
  try {
    const win = process.platform === "win32"
    const key = win ? absPath.toLowerCase() : absPath
    return vscode.workspace.textDocuments.find((d) => (win ? d.uri.fsPath.toLowerCase() : d.uri.fsPath) === key) || null
  } catch { return null }
}

/** Refresh the built-in Markdown preview after writing a .md file — the preview
 *  caches rendered content and can keep showing stale output after agent-side
 *  writes (2026-08-14 user report). No-op for non-markdown paths / when no
 *  preview is open. */
export function refreshMarkdownPreview(absPath) {
  if (!/\.(?:md|markdown|mdown)$/i.test(absPath)) return
  vscode.commands.executeCommand("markdown.preview.refresh").then(undefined, () => { /* no preview open — fine */ })
}

/** Apply a full text replacement to an open document via WorkspaceEdit.
 *  SAVES after applying — without the save the buffer goes dirty while the disk
 *  stays stale: the next edit hits the isDirty guard (locked by our own edit),
 *  and any external write races the user's later save (split-brain data loss). */
export async function applyEditorEdit(doc, fullText) {
  const edit = new vscode.WorkspaceEdit()
  const range = new vscode.Range(0, 0, doc.lineCount, 0)
  edit.replace(doc.uri, range, fullText)
  await vscode.workspace.applyEdit(edit)
  await doc.save()
  refreshMarkdownPreview(doc.uri.fsPath)
}

/** Apply a range replacement to an open document via WorkspaceEdit.
 *  Saves after applying (see applyEditorEdit — unsaved edits self-lock the
 *  isDirty guard and race external writers). */
export async function applyEditorRangeEdit(doc, startLine, startCol, endLine, endCol, newText) {
  const edit = new vscode.WorkspaceEdit()
  const range = new vscode.Range(startLine, startCol, endLine, endCol)
  edit.replace(doc.uri, range, newText)
  await vscode.workspace.applyEdit(edit)
  await doc.save()
  refreshMarkdownPreview(doc.uri.fsPath)
}

/** Resolve a path relative to cwd or absolute */
export function resolvePath(p, cwd) {
  if (isAbsolute(p)) return p
  return join(cwd, p)
}

export function formatSize(bytes) {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

// ─── Git helpers (CLI shared.mjs parity — keep in sync) ─────────

import { execFileSync, spawn } from "node:child_process"

/** Kill the whole process tree of a spawned child (CLI/system.mjs parity):
 *  Windows taskkill /T /F reaches grandchildren (npm test's subprocesses);
 *  POSIX kills the process group. Plain child.kill() only reaps the direct
 *  child — grandchildren hold the stdout/stderr pipes, so "close" never fires
 *  and a watchdog would hang. */
export function killProcessTree(child) {
  if (process.platform === "win32") {
    try { execFileSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], { stdio: "ignore" }) } catch { /* already gone */ }
  } else {
    try { process.kill(-child.pid, "SIGKILL") } catch { /* */ }
    try { child.kill("SIGKILL") } catch { /* fallback if group kill fails */ }
  }
}

/**
 * Run a child process INTERRUPTIBLY (spawn, not execSync).
 * execSync blocks the extension-host event loop — a Stop click during a long
 * lint/verify run could not even be DELIVERED until the command finished.
 * This spawns asynchronously and kills the child on abort/timeout.
 *
 * Success → resolves the stdout string (execFileSync-compatible call sites).
 * Non-zero exit / spawn error / timeout / abort → rejects an Error whose
 * .stdout/.stderr/.code are populated like execFileSync's error.
 */
export function runInterruptible(cmd, args, opts = {}) {
  const { cwd, timeout, signal, env } = opts
  return new Promise((resolve, reject) => {
    let child
    try {
      child = spawn(cmd, args, {
        cwd, env: env ?? process.env, stdio: ["ignore", "pipe", "pipe"], windowsHide: true,
        // First-line abort guard: Node kills the direct child on signal abort.
        ...(signal ? { signal } : {}),
      })
    } catch (e) {
      reject(e)
      return
    }
    let stdout = "", stderr = "", settled = false, timer = null, kickTimer = null, mode = null

    const KICK_MS = 3000
    const finish = (err, out) => {
      if (settled) return
      settled = true
      if (timer) clearTimeout(timer)
      if (kickTimer) clearTimeout(kickTimer)
      signal?.removeEventListener("abort", onAbort)
      if (err) {
        err.stdout = stdout
        err.stderr = stderr
        reject(err)
      } else {
        resolve(out)
      }
    }
    // Kill the whole tree on abort/timeout — grandchildren (npm test's children)
    // must die too, or they keep the stdout/stderr pipes and "close" never fires.
    const killTree = () => { try { killProcessTree(child) } catch { /* already gone */ } }
    // Kick-clockback: settle even if "close" never arrives (a grandchild that
    // mocks kill signal, or a wedged pipe). Prevents a hang + leaked pipes.
    const armKick = (err) => {
      if (kickTimer) return
      kickTimer = setTimeout(() => finish(err), KICK_MS)
    }

    const onAbort = () => {
      if (mode) return
      mode = "abort"
      const e = new Error("aborted by user (Stop)")
      e.name = "AbortError"
      killTree()
      armKick(e)
    }

    if (timeout) {
      timer = setTimeout(() => {
        if (mode) return
        mode = "timeout"
        const e = new Error(`timed out after ${timeout}ms`)
        e.name = "TimeoutError"
        killTree()
        armKick(e)
      }, timeout)
    }

    child.stdout?.on("data", (d) => { stdout += d })
    child.stderr?.on("data", (d) => { stderr += d })
    child.on("error", (e) => { if (e.name === "AbortError") return; finish(e) })
    child.on("close", (code) => {
      if (mode === "abort") { const e = new Error("aborted by user (Stop)"); e.name = "AbortError"; return finish(e) }
      if (mode === "timeout") { const e = new Error(`timed out after ${timeout}ms`); e.name = "TimeoutError"; return finish(e) }
      if (code === 0) finish(null, stdout)
      else {
        const e = new Error(`command failed with exit code ${code}`)
        e.code = code
        finish(e)
      }
    })

    if (signal) {
      if (signal.aborted) { onAbort(); return }
      signal.addEventListener("abort", onAbort, { once: true })
    }
  })
}


/** Run git with args, return trimmed stdout ("" on failure). CLI parity.
 *  config: optional `-c key=value` overrides (e.g. proxy) — inserted after `git`. */
export function runGit(cwd, cmdArgs, config = []) {
  try {
    return execFileSync("git", [...config, ...cmdArgs], { cwd, encoding: "utf8", maxBuffer: 10 * 1024 * 1024, stdio: ["ignore", "pipe", "ignore"] }).trim().replace(/\r/g, "")
  } catch (e) {
    // ERR_CHILD_PROCESS_STDIO_MAXBUFFER: e.stdout contains partial output, return first 200 lines
    if (e.stdout) return String(e.stdout).trim().replace(/\r/g, "").split("\n").slice(0, 200).join("\n")
    return ""
  }
}

/** Unified diff of one file (for tool result feedback). CLI parity. */
export function gitDiffOne(cwd, abs) {
  try {
    const diff = execFileSync("git", ["--no-pager", "diff", "--no-color", "--", abs], {
      cwd, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], maxBuffer: 10 * 1024 * 1024,
    }).trim()
    if (!diff) return ""
    const lines = diff.split("\n")
    if (lines.length <= 200) return diff
    return lines.slice(0, 200).join("\n") + `\n... (${lines.length - 200} more diff lines)`
  } catch (e) {
    if (e.code === "ERR_CHILD_PROCESS_STDIO_MAXBUFFER" && e.stdout) {
      const lines = e.stdout.toString().split("\n")
      return lines.slice(0, 200).join("\n") + `\n... (diff too large, showing first 200 of more lines)`
    }
    return ""
  }
}

/** Normalize CRLF to LF (hash/compare stability). CLI parity. */
export function normalizeEOL(text) {
  return text.replace(/\r\n/g, "\n")
}

/** Strip a leading UTF-8 BOM (unifies the hash/match domain, see F5-3/F5-4). */
export function stripBom(text) {
  return text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text
}

/** Map an LF-domain offset back to a raw-buffer offset. `positionAt` expects raw
 *  coordinates (CRLF `\r\n` = 2 chars); normalizeEOL drops each `\r`, so an LF
 *  offset must be mapped back before calling it. `\r\n` pairs are consumed as one
 *  unit; lone `\r`/`\n` count as 1 (tolerates mixed EOL). */
export function lfOffsetToRaw(rawText, lfOffset) {
  let raw = 0, lf = 0
  while (lf < lfOffset) { raw += rawText[raw] === "\r" && rawText[raw + 1] === "\n" ? 2 : 1; lf += 1 }
  return raw
}

/** Detect a file's EOL style by the type of its FIRST newline: "\r\n" first →
 *  the whole file is written back as CRLF; a bare "\n" or no newline → LF.
 *  Never counts occurrences (mixed files follow the first line's style). CLI parity. */
export function detectFileEol(text) {
  const i = text.indexOf("\n")
  return i > 0 && text[i - 1] === "\r" ? "\r\n" : "\n"
}

/** Join lines with the EOL style detected from the original text (write-back restore). CLI parity. */
export function joinWithEol(lines, originalText) {
  return lines.join(detectFileEol(originalText))
}

const MAJORITY_EOL_MAX_FILES = 20
const EOL_SNIFF_BYTES = 4096

/** Majority EOL style of a directory's existing files (≤20 files, first 4KB each).
 *  New files follow the directory's majority style; empty dir / tie / LF majority → "\n". CLI parity. */
export function majorityEol(dirPath) {
  let names
  try { names = readdirSync(dirPath) } catch { return "\n" }
  let crlf = 0, lf = 0
  for (const name of names) {
    if (crlf + lf >= MAJORITY_EOL_MAX_FILES) break
    try {
      const p = join(dirPath, name)
      if (!statSync(p).isFile()) continue
      const fd = openSync(p, "r")
      let head = ""
      try {
        const buf = Buffer.alloc(EOL_SNIFF_BYTES)
        const n = readSync(fd, buf, 0, EOL_SNIFF_BYTES, 0)
        head = buf.subarray(0, n).toString("utf8")
      } finally {
        closeSync(fd)
      }
      if (detectFileEol(head) === "\r\n") crlf++
      else lf++
    } catch { /* unreadable entry — skip */ }
  }
  return crlf > lf ? "\r\n" : "\n"
}

const CANDIDATE_MAX_LEN = 500
const CANDIDATE_PREVIEW_LEN = 80

/** Longest-common-substring length (rolling-row DP). Inputs are pre-truncated by the caller. */
function lcsLength(a, b) {
  // Reused DP buffers (review R9#6): per-line allocation caused GC pressure on
  // large files — hoist two module-level rows, grow to fit, swap by index.
  const need = b.length + 1
  if (_lcsBuf0.length < need) {
    const size = Math.max(need, _lcsBuf0.length * 2)
    _lcsBuf0 = new Uint16Array(size)
    _lcsBuf1 = new Uint16Array(size)
  }
  let prev = _lcsBuf0, cur = _lcsBuf1
  prev.fill(0, 0, need)
  let best = 0
  for (let i = 1; i <= a.length; i++) {
    cur[0] = 0
    const ca = a.charCodeAt(i - 1)
    for (let j = 1; j < need; j++) {
      if (ca === b.charCodeAt(j - 1)) {
        const v = prev[j - 1] + 1
        cur[j] = v
        if (v > best) best = v
      } else cur[j] = 0 // must reset — buffer is reused
    }
    const t = prev; prev = cur; cur = t
  }
  return best
}
let _lcsBuf0 = new Uint16Array(0), _lcsBuf1 = new Uint16Array(0)
/** Line-level similarity candidates for a failed edit: score = LCS(oldString, line) / max(len).
 *  Multi-line old_string matches on its FIRST line only (failures usually diverge there).
 *  Both sides are truncated to 500 chars before scoring so minified files can't blow the budget.
 *  Returns up to topN [{ line (1-based), preview, score }] with score >= threshold, best first. CLI parity. */
export function findCandidates(lines, oldString, topN = 3, threshold = 0.5) {
  const needle = oldString.split("\n")[0].slice(0, CANDIDATE_MAX_LEN)
  if (!needle) return []
  const scored = []
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i]
    if (!raw) continue
    const line = raw.length > CANDIDATE_MAX_LEN ? raw.slice(0, CANDIDATE_MAX_LEN) : raw
    const longer = Math.max(needle.length, line.length)
    const shorter = Math.min(needle.length, line.length)
    // LCS ≤ shorter side — a length ratio below the threshold can never reach it; skip the DP.
    if (shorter / longer < threshold) continue
    const score = lcsLength(needle, line) / longer
    if (score >= threshold) scored.push({ line: i + 1, preview: raw.slice(0, CANDIDATE_PREVIEW_LEN), score })
  }
  scored.sort((a, b) => b.score - a.score || a.line - b.line)
  return scored.slice(0, topN)
}

/** Appended to hashline_edit results when the file contains U+FFFD (encoding-corruption probe). CLI parity. */
export const FFFD_WARNING = "⚠ file contains U+FFFD (replacement char) — encoding may be corrupted; hash-based addressing may be unreliable. Consider fixing the file encoding first."

/** SSRF guard (CLI parity): TRUE for private/internal hostnames — callers block them.
 *  Covers loopback, link-local, cloud metadata, IPv6 private ranges, and the
 *  RFC1918 IPv4 prefixes. Invalid/unknown hosts return false (harmless for SSRF). */
export function isPrivateHost(hostname) {
  const h = hostname.toLowerCase()
  if (h === "localhost" || h === "0.0.0.0" || h.endsWith(".localhost")) return true
  if (h === "127.0.0.1" || h.startsWith("127.")) return true
  if (h === "169.254.169.254" || h === "metadata.google.internal") return true
  if (h.includes(":")) {
    if (h === "::1" || h.startsWith("fc") || h.startsWith("fd")) return true
    if (/^fe[89ab][0-9a-f]:/.test(h)) return true
  }
  const m = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (m) {
    const [a, b] = [Number(m[1]), Number(m[2])]
    if (a === 10 || (a === 172 && b >= 16 && b <= 31) || a === 192 && b === 168 || a === 169 && b === 254 || a === 0) return true
  }
  return false
}

/** Truncate text to max chars with a notice. CLI parity. */
export function truncate(text, max = 200_000) {
  if (text.length <= max) return text
  return text.slice(0, max) + `\n[... truncated: ${text.length - max} chars omitted — redirect to a file if you need the full output]`
}

/** SHA256(line).slice(0,12) — the hashline_edit addressing algorithm. CLI parity. */
import { createHash } from "node:crypto"
export function hashLine(content) {
  return createHash("sha256").update(content).digest("hex").slice(0, 12)
}

