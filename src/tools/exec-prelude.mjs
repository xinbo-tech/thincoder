/**
 * exec-prelude.mjs — sandbox API injected into `execute`'s child process.
 *
 * The `execute` tool spawns `node --input-type=module --eval` and `import()`-s
 * this file first, so the user's code gets readFile/writeFile/glob/grep/log/require
 * without hand-writing fs boilerplate. Confines file paths to the workspace root
 * (THINCODER_EXEC_ROOT, default cwd) — an orthopedic guard, NOT a sandbox:
 * require()/process/import()/fetch() are full Node, the same boundary as bash
 * (project philosophy: no fake sandbox; transparency + audit).
 */
import { createRequire } from "node:module"
import { readFileSync, writeFileSync, existsSync, statSync, mkdirSync, readdirSync } from "node:fs"
import { resolve, relative, dirname, join, isAbsolute, sep } from "node:path"

const require = createRequire(join(process.cwd(), "__exec__.js"))
const root = process.env.THINCODER_EXEC_ROOT || process.cwd()

/** Resolve a path against the working dir, asserting it stays within the workspace root. */
function safe(p) {
  if (typeof p !== "string") throw new Error(`Path must be a string, got ${typeof p}`)
  const abs = resolve(process.cwd(), p)
  const rel = relative(root, abs)
  // isAbsolute(rel) covers cross-drive (relative() returns an absolute path then)
  if (isAbsolute(rel) || rel === ".." || rel.startsWith(".." + sep)) {
    throw new Error(`Path traversal denied: ${p}`)
  }
  return abs
}

function globToRegex(pattern) {
  const DS = "\u0001", DP = "\u0002"
  const escaped = pattern
    .replace(/\*\*\//g, DS).replace(/\*\*/g, DP)
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, "[^/]*").replace(/\?/g, "[^/]")
    .replace(new RegExp(DS, "g"), "(?:.+/)?").replace(new RegExp(DP, "g"), ".*")
  return new RegExp(`^${escaped}$`)
}

globalThis.require = require
globalThis.readFile = (p) => {
  const abs = safe(p)
  if (!existsSync(abs)) throw new Error(`File not found: ${p}`)
  if (statSync(abs).size > 5_000_000) throw new Error(`File too large: ${p}`)
  return readFileSync(abs, "utf8").replace(/\r\n/g, "\n")
}
globalThis.writeFile = (p, content) => {
  const abs = safe(p)
  mkdirSync(dirname(abs), { recursive: true })
  writeFileSync(abs, String(content), "utf8")
}
globalThis.glob = (pattern) => {
  if (typeof pattern !== "string") throw new Error("glob pattern must be a string")
  const re = globToRegex(pattern)
  const out = []
  function walk(dir, rel) {
    let entries
    try { entries = readdirSync(dir, { withFileTypes: true }) } catch { return }
    for (const e of entries) {
      if (e.name.startsWith(".") || e.name === "node_modules") continue
      const rp = rel ? `${rel}/${e.name}` : e.name
      if (e.isDirectory()) walk(join(dir, e.name), rp)
      else if (re.test(rp)) out.push(rp)
    }
  }
  walk(process.cwd(), "")
  const capped = out.slice(0, 200)
  if (out.length > 200) capped.push(`... (${out.length - 200} more)`)
  return capped
}
globalThis.grep = (pattern, file) => {
  if (typeof pattern !== "string") throw new Error("grep pattern must be a string")
  if (typeof file !== "string") throw new Error("grep file must be a string")
  const abs = safe(file)
  if (!existsSync(abs)) throw new Error(`File not found: ${file}`)
  const re = new RegExp(pattern)
  const lines = readFileSync(abs, "utf8").replace(/\r\n/g, "\n").split("\n")
  const m = []
  for (let i = 0; i < lines.length; i++) if (re.test(lines[i])) m.push(`${i + 1}: ${lines[i].slice(0, 200)}`)
  const capped = m.slice(0, 100)
  if (m.length > 100) capped.push(`... (${m.length - 100} more)`)
  return capped
}
globalThis.log = (...a) => console.log(a.map((x) => (x && typeof x === "object" ? JSON.stringify(x) : String(x))).join(" "))