/**
 * repomap.mjs — repo dependency outline parser for VS Code
 * Zero dependencies, pure regex. No database required.
 *
 * Ported from thincoder CLI (src/tools/repomap-parse.mjs + repomap.mjs),
 * adapted for VS Code workspace.fs API.
 */

import { workspace } from "vscode"
import { relative as _relPath } from "node:path"

// ─── Parse helpers ──────────────────────────

function normalizeExt(p) {
  return p.replace(/\.(m?js|jsx|tsx?)$/i, "")
}

/** Extract JS/TS import paths (relative only, strip extensions) */
function parseImports(text) {
  const imports = []
  // standard import
  const re = /import\s+(?:{[^}]*}|\*\s+as\s+\w+|\w+\s*,?\s*(?:{[^}]*})?)\s*from\s*['"]([^'"]+)['"]|import\s+['"]([^'"]+)['"]/g
  let m
  while ((m = re.exec(text))) {
    const raw = m[1] || m[2]
    if (!raw || raw.startsWith("node:") || !raw.startsWith(".")) continue
    imports.push(normalizeExt(raw))
  }
  // re-export: export { x } from './module'
  const reExportRe = /export\s*\{[^}]*\}\s*from\s*['"]([^'"]+)['"]/g
  while ((m = reExportRe.exec(text))) {
    const raw = m[1]
    if (!raw || raw.startsWith("node:") || !raw.startsWith(".")) continue
    imports.push(normalizeExt(raw))
  }
  return [...new Set(imports)]
}

/** Extract JS/TS export symbols */
function parseExports(text) {
  const exports = []
  // named: export function/class/const/let/var name
  const namedRe = /export\s+(?:async\s+)?(?:function\s+(\w+)|class\s+(\w+)|(?:const|let|var)\s+(\w+))/g
  let m
  while ((m = namedRe.exec(text))) {
    exports.push(m[1] || m[2] || m[3])
  }
  // export default function/class name
  const defaultRe = /export\s+default\s+(?:(?:async\s+)?(?:function\s+(\w+)|class\s+(\w+))|(\w+))/g
  while ((m = defaultRe.exec(text))) {
    const name = m[1] || m[2] || m[3]
    if (name) exports.push(name)
    else if (!exports.includes("default")) exports.push("default")
  }
  // export { a, b as c }
  const braceRe = /export\s*\{([^}]+)\}/g
  while ((m = braceRe.exec(text))) {
    for (const name of m[1].split(",")) {
      const parts = name.trim().split(/\s+/)
      const exported = parts.length >= 3 ? parts[2] : parts[0]
      if (exported) exports.push(exported)
    }
  }
  // export const { a, b } = ...
  const destructRe = /export\s+(?:const|let|var)\s*\{([^}]+)\}\s*=/g
  while ((m = destructRe.exec(text))) {
    for (const name of m[1].split(",")) {
      const n = name.trim().split(/\s*:\s*/)[0].trim()
      if (n) exports.push(n)
    }
  }
  return [...new Set(exports)]
}

function resolveImport(imp, fromFile) {
  let p = imp
  if (p.startsWith("./")) p = p.slice(2)
  const dir = fromFile.includes("/") ? fromFile.slice(0, fromFile.lastIndexOf("/")) : ""
  const parts = p.split("/")
  if (parts[0] === "..") {
    const up = dir.split("/").filter(Boolean)
    let i = 0
    while (parts[i] === ".." && up.length > 0) { up.pop(); i++ }
    return [...up, ...parts.slice(i)].join("/")
  }
  return dir ? `${dir}/${p}` : p
}

// ─── Build graph ────────────────────────────

async function buildDepGraph(cwd) {
  const files = await workspace.findFiles("**/*.{js,mjs,cjs,jsx,ts,tsx}", "**/node_modules/**", 5000)
  const deps = new Map()
  const importers = new Map()

  for (const uri of files) {
    const rel = uri.fsPath.slice(cwd.length + 1).replace(/\\/g, "/")
    if (rel.includes("node_modules")) continue
    try {
      const raw = await workspace.fs.readFile(uri)
      const text = new TextDecoder().decode(raw)
      const imports = parseImports(text)
      const exports = parseExports(text)
      const resolved = imports.map((imp) => resolveImport(imp, rel))

      const dir = rel.includes("/") ? rel.slice(0, rel.lastIndexOf("/")) : "."
      deps.set(rel, { imports: new Set(resolved), exports: new Set(exports), size: Math.floor(text.length / 1024), dir })

      for (const r of resolved) {
        if (!importers.has(r)) importers.set(r, new Set())
        importers.get(r).add(rel)
      }
    } catch { /* skip unreadable files */ }
  }

  return { deps, importers, fileCount: deps.size }
}

// ─── repo_outline tool ──────────────────────

export const repoOutlineTool = {
  name: "repo_outline",
  readonly: true,
  description:
    "Show the project's file dependency outline: which files import/export from which, and what symbols they export. " +
    "Use when you need to understand the project structure, find where a function is defined, or see what files depend on a module. " +
    "Pass a path to focus on a single file's relationships. " +
    "For symbol-level lookups use code_search or lsp.",
  parameters: {
    type: "object",
    properties: {
      path: { type: "string", description: "Optional: focus on a specific file path (relative to project root)" },
    },
  },
  async execute({ path: focusPath }, ctx) {
    const cwd = ctx.cwd
    if (!cwd) return "No workspace folder open."

    const graph = await buildDepGraph(cwd)
    if (!graph || graph.fileCount === 0) return "No source files found in workspace."

    const { deps, importers, fileCount } = graph

    const out = []
    out.push(`${fileCount} source files indexed.`)

    // 1) Directory-level dependencies (only for multi-directory projects)
    const dirDeps = new Map()
    const dirSet = new Set()
    for (const [_rel, d] of deps) {
      dirSet.add(d.dir)
      if (!dirDeps.has(d.dir)) dirDeps.set(d.dir, new Set())
      for (const imp of d.imports) {
        const targetDir = imp.includes("/") ? imp.slice(0, imp.lastIndexOf("/")) : "."
        if (targetDir !== d.dir) dirDeps.get(d.dir).add(targetDir)
      }
    }
    if (dirSet.size > 1) {
      out.push("Directory dependencies:")
      for (const dir of [...dirSet].sort()) {
        const targets = dirDeps.get(dir)
        if (targets?.size) {
          out.push(`  ${dir}/ → ${[...targets].sort().join(", ")}/`)
        } else {
          out.push(`  ${dir}/ (leaf)`)
        }
      }
    }

    // 2) Hub files Top-12: most imported
    const HUB_LIMIT = 12
    const hubScores = []
    for (const [rel] of deps) {
      const key = normalizeExt(rel)
      const rev = importers.get(key)
      if (rev?.size) hubScores.push({ path: rel, count: rev.size })
    }
    hubScores.sort((a, b) => b.count - a.count)
    if (hubScores.length > 0) {
      out.push(`Hub files (by inbound dependencies, top ${Math.min(hubScores.length, HUB_LIMIT)}):`)
      for (const h of hubScores.slice(0, HUB_LIMIT)) {
        const d = deps.get(h.path)
        const kb = d?.size ? ` (${d.size} KB)` : ""
        const key = normalizeExt(h.path)
        const rev = importers.get(key)
        const shortRefs = rev.size <= 5 ? [...rev].join(", ") : [...rev].slice(0, 4).join(", ") + ` +${rev.size - 4} more`
        out.push(`  ${h.path}${kb} — imported by: ${shortRefs}`)
      }
    }

    // 3) Entry points
    const entries = []
    for (const [rel] of deps) {
      const key = normalizeExt(rel)
      if (!importers.has(key) || importers.get(key).size === 0) entries.push(rel)
    }
    if (entries.length > 0 && entries.length < fileCount) {
      const limit = 8
      const shown = entries.slice(0, limit)
      out.push("Entry points (not imported by others):")
      for (const e of shown) out.push(`  ${e}`)
      if (entries.length > limit) out.push(`  ... +${entries.length - limit} more`)
    }

    // 4) If focus path, show detailed per-file view
    if (focusPath) {
      const d = deps.get(focusPath)
      if (!d) {
        out.push(`\nFile not indexed: ${focusPath}`)
      } else {
        out.push(`\n${focusPath}${d.size ? ` (${d.size} KB)` : ""}`)
        const key = normalizeExt(focusPath)
        const rev = importers.get(key)
        if (rev?.size) out.push(`  ← imported by: ${[...rev].join(", ")}`)
        if (d.imports.size) out.push(`  → imports: ${[...d.imports].join(", ")}`)
        if (d.exports.size) out.push(`  → exports: ${[...d.exports].join(", ")}`)
      }
    } else {
      out.push("For detailed per-file relationships, call repo_outline with a file path.")
    }

    return out.join("\n")
  },
}
