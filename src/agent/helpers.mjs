/**
 * agent/helpers.mjs — Agent utility functions and constants
 */
import { configDir } from "../config.mjs"
import { readFileSync, readdirSync, existsSync } from "node:fs"
import { homedir } from "node:os"
import { writeFile, mkdir, readdir, stat, unlink } from "node:fs/promises"
import { join } from "node:path"
import { execSync } from "node:child_process"

export const DEFAULT_MAX_TURNS = 200
export const DEFAULT_SUBAGENT_TURNS = 100
export const DEFAULT_GOAL_TURNS = 200
export const MIN_REPORT_CHARS = 200
export const REPORT_CONTINUATION =
  "Your report was sent back: too brief to be a complete handoff — the parent agent sees nothing else from your run. " +
  "Rewrite your final message as a checklist:\n" +
  "1. What you changed and why\n" +
  "2. The path of every file you touched\n" +
  "3. How you verified (tests run, commands executed, with results)\n" +
  "4. Anything left undone or worth follow-up"

const TOOL_RESULT_OFFLOAD_LIMIT = 64 * 1024 // 65536 chars — offload only above 64K (2026-08-24)
const TOOL_RESULT_PREVIEW = 64 * 1024 // chars shown inline when offloaded (aligns with CLI/VS Code webview)

/** Offload-dir write-time self-cleanup retention window (2026-08-21): files older than 3 days are deleted on the next offload. */
export const TMP_RETENTION_MS = 3 * 24 * 3600 * 1000

const GIT_TIMEOUT_MS = 5000
const MAX_GIT_CHANGES_DISPLAY = 20

export const OUTLINE_INJECT_PREFIX = "[System reminder: project dependency outline:"
export const FILE_MUTATORS = new Set(["write", "edit", "insert_after", "apply_patch", "delete", "hashline_edit"])

/** Escape XML special characters in a string for safe embedding in XML/HTML */
export function escapeXml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;")
}

/** Canonicalize a tool call signature for stall detection: name + stable JSON args */
export function tryCanonicalize(name, args) {
  try { return name + ":" + JSON.stringify(JSON.parse(args)) } catch { return name + ":" + args }
}

/**
 * Best-effort write-time self-cleanup: delete files in dir whose mtime exceeds TMP_RETENTION_MS.
 * Subdirectories are never touched; every failure is silent — cleanup must not affect offload.
 */
export async function cleanupOldToolResults(dir) {
  const now = Date.now()
  let entries
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch {
    return // dir missing or unreadable → nothing to clean
  }
  for (const entry of entries) {
    if (!entry.isFile()) continue // subdirectories untouched
    try {
      const st = await stat(join(dir, entry.name))
      if (now - st.mtimeMs > TMP_RETENTION_MS) await unlink(join(dir, entry.name))
    } catch {
      /* entry vanished concurrently or I/O error — best effort, keep going */
    }
  }
}

/** Offload oversized tool results (>64K chars) to disk, returning a preview + file path.
 *  Writes trigger write-time self-cleanup of the offload dir first (dir param overridable for tests). */
export async function offloadToolResult(text, callId, dir = join(configDir, "tool-results")) {
  if (text.length <= TOOL_RESULT_OFFLOAD_LIMIT) return text
  try {
    await cleanupOldToolResults(dir)
    await mkdir(dir, { recursive: true })
    const file = join(dir, `${Date.now()}-${String(callId).replace(/[^a-zA-Z0-9_-]/g, "_")}.log`)
    await writeFile(file, text, "utf8")
    return (
      text.slice(0, TOOL_RESULT_PREVIEW) +
      `\n\n[... output too large (${text.length} chars total), full content saved to: ${file}\n` +
      `Page through it with the read tool (offset/limit) or sed -n 'START,ENDp' — do NOT re-run the tool blindly.]`
    )
  } catch {
    return text.slice(0, TOOL_RESULT_OFFLOAD_LIMIT) + `\n\n[... truncated: ${text.length} chars total, offload to disk failed]`
  }
}

/** Collect git branch, recent commits, and working tree status as context text */
export function collectGitContext(cwd) {
  try {
    const opts = { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], timeout: GIT_TIMEOUT_MS }
    const branch = execSync("git branch --show-current", opts).trim()
    const log = execSync("git --no-pager log --oneline -5", opts).trim()
    const status = execSync("git status --short", opts).trim()
    const dirty = status ? status.split("\n").length : 0
    return [
      `Git context: on branch \`${branch || "(detached)"}\`${dirty ? `, ${dirty} uncommitted change(s)` : ", working tree clean"}.`,
      log ? `Recent commits:\n${log}` : "",
      status ? `Uncommitted:\n${status.split("\n").slice(0, MAX_GIT_CHANGES_DISPLAY).join("\n")}${dirty > MAX_GIT_CHANGES_DISPLAY ? `\n… (${dirty - MAX_GIT_CHANGES_DISPLAY} more)` : ""}` : "",
    ].filter(Boolean).join("\n")
  } catch {
    return ""
  }
}

export class ContinueError extends Error {
  constructor(turn) {
    super(`Agent paused after ${turn} turns. Continue?`)
    this.name = "ContinueError"
    this.turn = turn
  }
}

/** Repair malformed conversation history: remove orphan tool messages and fill missing tool results */
export function repairHistory(history) {
  const out = []
  let dirty = false
  const knownIds = new Set() // tool_call ids declared by assistant so far
  for (let i = 0; i < history.length; i++) {
    const m = history[i]
    // empty assistant message: no content and no tool_calls, discard
    if (m.role === "assistant" && !m.tool_calls?.length && !m.content) {
      dirty = true
      continue
    }
    // orphan tool message: no matching assistant tool_calls declaration, discard
    if (m.role === "tool" && !knownIds.has(m.tool_call_id)) {
      dirty = true
      continue
    }
    out.push(m)
    if (m.role !== "assistant" || !m.tool_calls?.length) continue

    for (const tc of m.tool_calls) knownIds.add(tc.id)
    // collect tool result ids that immediately follow (before the next non-tool message)
    const answered = new Set()
    let j = i + 1
    while (j < history.length && history[j].role === "tool") {
      if (knownIds.has(history[j].tool_call_id)) {
        answered.add(history[j].tool_call_id)
        out.push(history[j])
      } else {
        dirty = true // orphan tool result, discard
      }
      j++
    }
    i = j - 1 // outer for will increment again

    for (const tc of m.tool_calls) {
      if (!answered.has(tc.id)) {
        dirty = true
        out.push({
          role: "tool",
          tool_call_id: tc.id,
          content: "[Tool execution was interrupted: session ended before the result was recorded]",
        })
      }
    }
  }
  return dirty ? out : history
}

/** List working directory contents as a tree (directories expanded up to subMax entries each) */
export function listWorkDir(cwd, { rootMax = 30, subMax = 10 } = {}) {
  const SKIP = new Set([".git", "node_modules"])
  let entries
  try {
    entries = readdirSync(cwd, { withFileTypes: true })
  } catch {
    return ""
  }
  const visible = entries.filter((e) => !e.name.startsWith("."))
  const hiddenCount = entries.length - visible.length
  const byName = (a, b) => a.name.localeCompare(b.name)
  const dirs = visible.filter((e) => e.isDirectory() && !SKIP.has(e.name)).sort(byName)
  const files = visible.filter((e) => !e.isDirectory()).sort(byName)
  const ordered = [...dirs, ...files]
  const lines = []
  for (const e of ordered.slice(0, rootMax)) {
    if (!e.isDirectory()) {
      lines.push(e.name)
      continue
    }
    lines.push(`${e.name}/`)
    let children
    try {
      children = readdirSync(join(cwd, e.name)).filter((n) => !n.startsWith(".")).sort()
    } catch {
      continue
    }
    if (children.length <= subMax) {
      for (const c of children) lines.push(`  ${c}`)
    } else {
      for (const c of children.slice(0, subMax)) lines.push(`  ${c}`)
      lines.push(`  (${children.length - subMax} more entries omitted)`)
    }
  }
  if (ordered.length > rootMax) lines.push(`(${ordered.length - rootMax} more entries omitted)`)
  if (hiddenCount > 0) lines.push(`(${hiddenCount} hidden entries omitted)`)
  return lines.join("\n")
}

/** Return the set of tool names that are marked as read-only */
export function readonlyToolNames(tools) {
  return new Set(tools.filter((t) => t.readonly).map((t) => t.name))
}

const MAX_INSTRUCTION_CHARS = 32_000

/** Load AGENTS.md / project_rules.md from user home and project root.
 *  User-level (~/.thincoder/AGENTS.md) loaded first (lower priority).
 *  Project-level overrides take precedence. */
export async function loadProjectInstructions(cwd) {
  const parts = []
  // 1. User-level: global preferences across all projects
  try {
    const userPath = join(homedir(), ".thincoder", "AGENTS.md")
    const content = readFileSync(userPath, "utf8").trim()
    if (content) parts.push(`<!-- From: ${userPath} -->\n${content}`)
  } catch { /* file does not exist */ }
  // 2. Project-level: project-specific conventions
  for (const name of ["AGENTS.md", "project_rules.md"]) {
    try {
      const content = readFileSync(join(cwd, name), "utf8").trim()
      if (!content) continue
      parts.push(`<!-- From: ${join(cwd, name)} -->\n${content}`)
    } catch { /* file does not exist */ }
  }
  const merged = parts.join("\n\n")
  if (!merged) return ""
  if (merged.length <= MAX_INSTRUCTION_CHARS) return merged
  return (
    `<!-- WARNING: project instructions total ${merged.length} chars, exceeding the ${MAX_INSTRUCTION_CHARS} soft limit. ` +
    `They are included in full, but consider shortening them — long instructions dilute attention. -->\n\n` +
    merged
  )
}
