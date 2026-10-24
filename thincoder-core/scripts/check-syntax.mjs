/**
 * scripts/check-syntax.mjs — zero-dependency syntax checker (TESTING.md §10.3).
 *
 * The core package has no integration test set (requirement N20), so its publish
 * gate is a syntax gate: walks the package root recursively for *.mjs (dot-entries
 * and node_modules skipped, this file self-included) and runs `node --check` on
 * every file. Exits non-zero listing each failing file so a broken syntax commit
 * is caught without any npm dependency.
 *
 * Usage: node scripts/check-syntax.mjs            — check the default file set
 *        node scripts/check-syntax.mjs <path>...  — check only the given paths
 */
import { spawnSync } from "node:child_process"
import { readdirSync } from "node:fs"
import { dirname, join, relative, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..")

/** Default traversal set — the package root, all *.mjs (walk skips dot-entries and node_modules) */
const DEFAULT_SETS = [
  [".", /\.mjs$/],
]

/** Recursively collect files under dir matching re (skip dot-entries and vendored dirs) */
function walk(dir, re, out) {
  let entries
  try { entries = readdirSync(dir, { withFileTypes: true }) } catch { return }
  for (const e of entries) {
    if (e.name.startsWith(".") || e.name === "node_modules") continue
    const p = join(dir, e.name)
    if (e.isDirectory()) walk(p, re, out)
    else if (re.test(e.name)) out.push(p)
  }
}

const args = process.argv.slice(2)
const files = args.length
  ? args.map((t) => resolve(process.cwd(), t))
  : DEFAULT_SETS.flatMap(([dir, re]) => { const out = []; walk(join(ROOT, dir), re, out); return out })

const failures = []
for (const f of files) {
  const r = spawnSync(process.execPath, ["--check", f], {
    encoding: "utf8",
    timeout: 30_000,
    stdio: ["ignore", "pipe", "pipe"],
  })
  if (r.status !== 0) {
    const detail = (r.stderr || r.stdout || r.error?.message || "").trim().split("\n").slice(0, 4).join("\n")
    failures.push(`${relative(ROOT, f)}\n${detail || "(unknown error)"}`)
  }
}

if (failures.length > 0) {
  console.error(`check-syntax: ${failures.length} file(s) failed node --check:\n\n${failures.join("\n\n")}\n`)
  process.exit(1)
}
console.log(`check-syntax: ${files.length} file(s) OK`)
