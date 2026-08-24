/**
 * ops.mjs — operational tools: file_ops (move/copy/rename), process (list),
 * get_current_time. Each exists so the model reaches for a dedicated tool
 * instead of shelling out to `bash` for the same operation (parity with thinworker).
 */
import { DESC, resolveInCwd, truncate } from "./shared.mjs"
import { cp, rename, rm } from "node:fs/promises"
import { execFileSync } from "node:child_process"

// ─── file_ops ──────────────────────────────────────────────────

export const fileOpsTool = {
  name: "file_ops",
  description: DESC("file_ops"),
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
    const src = resolveInCwd(ctx, source)
    const dst = resolveInCwd(ctx, dest)
    if (src === dst) return "Error: source and dest resolve to the same path"

    if (action === "copy") {
      await cp(src, dst, { recursive: true, force: true })
      return `Copied ${source} → ${dest}`
    }
    // move & rename share the rename syscall; cross-device move falls back to copy+rm.
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
  description: DESC("process"),
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
      rows = process.platform === "win32" ? listWindows() : listPosix()
    } catch (e) {
      return `process listing failed: ${e?.message ?? String(e)}`
    }
    if (filter) rows = rows.filter((r) => r.name.toLowerCase().includes(filter))
    if (rows.length === 0) return filter ? `No running processes match "${name}"` : "(no processes)"
    return truncate(rows.map((r) => `${r.name}\tPID ${r.pid}${r.mem ? `\t${r.mem}` : ""}`).join("\n"))
  },
}

function listWindows() {
  // tasklist /FO CSV /NH → lines: "name.exe","1234","Console","1","12,345 K"
  const out = execFileSync("tasklist", ["/FO", "CSV", "/NH"], { encoding: "utf8", timeout: 10000 })
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

function listPosix() {
  const out = execFileSync("ps", ["-eo", "pid=,comm="], { encoding: "utf8", timeout: 10000 })
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
  description: DESC("get_current_time"),
  parameters: { type: "object", properties: {} },
  readonly: true,
  async execute() {
    const now = new Date()
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "unknown"
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    return `Date: ${now.toISOString()} (UTC)\nTimezone: ${tz}\nWeekday: ${days[now.getDay()]}\nLocal: ${now.toLocaleString()}`
  },
}