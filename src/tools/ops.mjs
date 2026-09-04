/**
 * ops.mjs — operational tools: file_ops (move/copy/rename), process (list),
 * get_current_time. Dedicated tools so the model doesn't shell out to `bash`
 * for the same operation (parity with thinworker's programming tool set).
 */
import { cp, rename, rm } from "node:fs/promises"
import { resolvePath, truncate, runInterruptible } from "./shared.mjs"

// ─── file_ops ──────────────────────────────────────────────────

export const fileOpsTool = {
  name: "file_ops",
  description:
    "Move, copy, or rename a file/directory.\n" +
    "Returns `Copied|Moved|Renamed <source> → <dest>`.\n" +
    "Route to file_ops instead of bash: `mv`→move, `cp`→copy, `ren`→rename.\n" +
    "Parameters:\n" +
    "- action (required): move | copy | rename\n" +
    "- source (required): source path, relative to cwd or absolute\n" +
    "- dest (required): destination path\n" +
    "Notes: paths resolve relative to the workspace root; dest is overwritten if it exists; copy is recursive for directories.",
  parameters: {
    type: "object",
    properties: {
      action: { type: "string", enum: ["move", "copy", "rename"], description: "move | copy | rename" },
      source: { type: "string", description: "Source path, relative to cwd or absolute" },
      dest: { type: "string", description: "Destination path" },
    },
    required: ["action", "source", "dest"],
  },
  readonly: false,
  async execute({ action, source, dest }, ctx) {
    if (typeof source !== "string" || !source) return "Error: source is required"
    if (typeof dest !== "string" || !dest) return "Error: dest is required"
    if (!["move", "copy", "rename"].includes(action)) return `Error: action must be move | copy | rename (got "${action}")`
    const src = resolvePath(source, ctx.cwd)
    const dst = resolvePath(dest, ctx.cwd)
    if (src === dst) return "Error: source and dest resolve to the same path"

    if (action === "copy") {
      await cp(src, dst, { recursive: true, force: true })
      return `Copied ${source} → ${dest}`
    }
    try {
      await rename(src, dst)
    } catch (e) {
      if (e?.code !== "EXDEV") throw e
      await cp(src, dst, { recursive: true, force: true })
      await rm(src, { recursive: true, force: true })
    }
    return `${action === "rename" ? "Renamed" : "Moved"} ${source} → ${dest}`
  },
}

// ─── process ───────────────────────────────────────────────────

export const processTool = {
  name: "process",
  description:
    "List running processes (optionally filtered by name). Returns name / PID / memory.\n" +
    "Route to process instead of bash: `tasklist`/`ps aux` → process.\n" +
    "List-only — to kill a process use bash `taskkill`/`kill` (confirm with the user first).",
  parameters: {
    type: "object",
    properties: {
      name: { type: "string", description: "Optional name substring filter (case-insensitive)" },
    },
  },
  readonly: true,
  async execute({ name }, ctx) {
    const filter = typeof name === "string" && name.trim() ? name.trim().toLowerCase() : null
    let rows
    try {
      rows = process.platform === "win32" ? await listWindows(ctx?.signal) : await listPosix(ctx?.signal)
    } catch (e) {
      return `process listing failed: ${e?.message ?? String(e)}`
    }
    if (filter) rows = rows.filter((r) => r.name.toLowerCase().includes(filter))
    if (rows.length === 0) return filter ? `No running processes match "${name}"` : "(no processes)"
    return truncate(rows.map((r) => `${r.name}\tPID ${r.pid}${r.mem ? `\t${r.mem}` : ""}`).join("\n"))
  },
}

async function listWindows(signal) {
  // non-blocking (runInterruptible) — execFileSync would freeze the extension host
  const out = await runInterruptible("tasklist", ["/FO", "CSV", "/NH"], { timeout: 10000, signal })
  const rows = []
  for (const line of out.split("\n")) {
    const parts = line.split('","')
    if (parts.length < 2) continue
    const name = parts[0].replace(/^"/, "").trim()
    const pid = parts[1].replace(/"/, "").trim()
    const mem = parts[4] ? parts[4].replace(/"/, "").trim() : ""
    if (!name || !pid) continue
    rows.push({ name, pid, mem })
  }
  return rows
}

async function listPosix(signal) {
  const out = await runInterruptible("ps", ["-eo", "pid=,comm="], { timeout: 10000, signal })
  const rows = []
  for (const line of out.split("\n")) {
    const m = line.trim().match(/^(\d+)\s+(.+)$/)
    if (m) rows.push({ name: m[2], pid: m[1], mem: "" })
  }
  return rows
}

// ─── get_current_time ──────────────────────────────────────────

export const getCurrentTimeTool = {
  name: "get_current_time",
  description:
    "Get the current date, time, weekday, and timezone. Use when a task depends on the current time/date. Route to this instead of bash `date`/`time`. Returns the date, time, weekday, and timezone.",
  parameters: { type: "object", properties: {} },
  readonly: true,
  async execute() {
    const now = new Date()
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "unknown"
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    return `Date: ${now.toISOString()} (UTC)\nTimezone: ${tz}\nWeekday: ${days[now.getDay()]}\nLocal: ${now.toLocaleString()}`
  },
}
