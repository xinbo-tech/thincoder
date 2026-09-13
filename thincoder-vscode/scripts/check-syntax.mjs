#!/usr/bin/env node
/**
 * scripts/check-syntax.mjs — zero-dependency syntax gate (TOOLS.md §10.2).
 *
 * Replaces the eslint devDependency (removed 2026-09-02): walks every JS file
 * in the repo (src/ + test/ + webview/ + extension.mjs + scripts/ — this file
 * self-included) and runs `node --check` on each. Non-zero exit lists every
 * failing file; zero exit = all files parse.
 *
 * Detection-capability loss (documented in TOOLS.md §10.2): node --check is
 * syntax-only — eslint's unused-vars/no-undef-class rules are no longer run;
 * real-link verification and the test suite cover that ground.
 */
import { spawnSync } from "node:child_process"
import { readdirSync } from "node:fs"
import { join, dirname, relative } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")
const DIRS = ["src", "test", "webview", "scripts"]
const ROOT_FILES = ["extension.mjs"]
const JS_RE = /\.(?:mjs|cjs|js)$/

/** Recursively collect JS files under dir (skips node_modules / dot dirs). */
function collect(dir) {
  const out = []
  let entries
  try { entries = readdirSync(dir, { withFileTypes: true }) } catch { return out }
  for (const e of entries) {
    const p = join(dir, e.name)
    if (e.isDirectory()) {
      if (e.name === "node_modules" || e.name.startsWith(".")) continue
      out.push(...collect(p))
    } else if (JS_RE.test(e.name)) {
      out.push(p)
    }
  }
  return out
}

const files = [
  ...DIRS.flatMap((d) => collect(join(ROOT, d))),
  ...ROOT_FILES.map((f) => join(ROOT, f)),
]

const failed = []
for (const f of files) {
  const r = spawnSync(process.execPath, ["--check", f], { encoding: "utf8", timeout: 30000 })
  if (r.status !== 0) {
    const firstLine = (r.stderr || r.stdout || "unknown error").trim().split("\n")[0]
    failed.push(`${relative(ROOT, f).replace(/\\/g, "/")}: ${firstLine}`)
  }
}

if (failed.length > 0) {
  console.error(`check-syntax: ${failed.length} of ${files.length} file(s) FAILED syntax check:`)
  for (const f of failed) console.error(`  ✗ ${f}`)
  process.exit(1)
}
console.log(`check-syntax: ${files.length} JS files OK`)
