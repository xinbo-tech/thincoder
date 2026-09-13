/**
 * repomap.mjs — repo dependency outline
 * Real-time import/export parsing, generates compact text for LLMs to understand code structure.
 * No index stored — reads and parses files on each call, ~50ms.
 */
import { existsSync } from "node:fs"
import { readFile, stat } from "node:fs/promises"
import { join } from "node:path"
import { normalizeEOL } from "./shared.mjs"

/** Extract JS/TS file import paths (normalize by stripping .ts/.js/.mjs suffixes) */
function parseImports(lines, ext) {
  const imports = []
  const text = lines.join("\n")
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

/** Extract JS/TS file export symbols */
function parseExports(lines, ext) {
  const exports = []
  const text = lines.join("\n")
  // export function/class/const/let/var name
  const namedRe = /export\s+(?:async\s+)?(?:function\s+(\w+)|class\s+(\w+)|(?:const|let|var)\s+(\w+))/g
  let m
  while ((m = namedRe.exec(text))) {
    exports.push(m[1] || m[2] || m[3])
  }
  // export default function/class name / export default expression
  const defaultRe = /export\s+default\s+(?:(?:async\s+)?(?:function\s+(\w+)|class\s+(\w+))|(\w+))/g
  while ((m = defaultRe.exec(text))) {
    const name = m[1] || m[2] || m[3]
    if (name) exports.push(name)
    else if (!exports.some((e) => e === "default")) exports.push("default")
  }
  // export { a, b as c } — prefer the "as" alias as the exported name
  const braceRe = /export\s*\{([^}]+)\}/g
  while ((m = braceRe.exec(text))) {
    for (const name of m[1].split(",")) {
      const parts = name.trim().split(/\s+/)
      // "a as b" → b (exported name), "a" → a
      const exported = parts.length >= 3 ? parts[2] : parts[0]
      if (exported) exports.push(exported)
    }
  }
  // export const { a, b } = ... (destructured export)
  const destructRe = /export\s+(?:const|let|var)\s*\{([^}]+)\}\s*=/g
  while ((m = destructRe.exec(text))) {
    for (const name of m[1].split(",")) {
      const parts = name.trim().split(/\s*:\s*/)
      const n = parts[0].trim()
      if (n) exports.push(n)
    }
  }
  return [...new Set(exports)]
}

/** Extract Python imports and top-level def/class */
function parsePyOutline(lines) {
  const imports = []
  const symbols = []
  for (const line of lines) {
    const fromRe = line.match(/^from\s+(\S+)\s+import\s+(.+)/)
    if (fromRe) {
      const rel = pyRelPath(fromRe[1])
      if (rel) imports.push(rel)
      continue
    }
    const impRe = line.match(/^import\s+(.+)/)
    if (impRe) {
      for (const mod of impRe[1].split(",")) {
        const rel = pyRelPath(mod.trim().split(/\s+/)[0])
        if (rel) imports.push(rel)
      }
      continue
    }
    const defRe = line.match(/^(?:async\s+)?(?:def|class)\s+(\w+)/)
    if (defRe) symbols.push(defRe[1])
  }
  return { imports: [...new Set(imports)], symbols: [...new Set(symbols)] }
}

/**
 * Python relative import → relative file path:
 * Leading n dots mean go up n-1 levels ("." = current package), module dots become path separators.
 * Non-relative imports (not starting with .) or bare package imports ("from . import x") return null.
 */
function pyRelPath(mod) {
  if (!mod?.startsWith(".")) return null
  const dots = mod.match(/^\.+/)[0].length
  const rest = mod.slice(dots).replaceAll(".", "/")
  if (!rest) return null
  return normalizeExt("../".repeat(dots - 1) + rest)
}

function normalizeExt(p) {
  return p.replace(/\.(m?js|jsx|tsx?)$/i, "")
}

/**
 * Internal: scan all files, build forward dependency graph + reverse reference graph.
 * Returns { deps, importers, fileCount } shared by buildOutline / buildSummary.
 */
async function _buildDepGraph(db, cwd) {
  const allFiles = db.prepare(`SELECT DISTINCT path FROM code_chunks ORDER BY path`).all().map((r) => r.path)
  if (allFiles.length === 0) return null

  const deps = new Map()      // path → { imports: Set, exports: Set, size: number, dir: string }
  const importers = new Map() // importee → Set<importer>

  for (let i = 0; i < allFiles.length; i++) {
    const rel = allFiles[i]
    const abs = join(cwd, ...rel.split("/"))
    if (!existsSync(abs)) continue
    // Large file guard: skip files over 10MB to prevent OOM
    const fst = await stat(abs).catch(() => null)
    if (fst && fst.size > 10_000_000) continue
    let text
    try { text = normalizeEOL(await readFile(abs, "utf8")) } catch { continue }
    const lines = text.split("\n")
    const ext = rel.slice(rel.lastIndexOf(".")).toLowerCase()

    let imports, exports
    if (ext === ".py") {
      const py = parsePyOutline(lines)
      imports = py.imports
      exports = py.symbols
    } else {
      imports = parseImports(lines, ext)
      exports = parseExports(lines, ext)
    }

    // Resolve import paths to relative paths (handle ./ ../)
    const resolved = []
    for (let imp of imports) {
      if (imp.startsWith("./")) imp = imp.slice(2)
      const dir = rel.includes("/") ? rel.slice(0, rel.lastIndexOf("/")) : ""
      const parts = imp.split("/")
      if (parts[0] === "..") {
        const up = dir.split("/").filter(Boolean)
        let i = 0
        while (parts[i] === ".." && up.length > 0) { up.pop(); i++ }
        resolved.push([...up, ...parts.slice(i)].join("/"))
      } else {
        resolved.push(dir ? `${dir}/${imp}` : imp)
      }
    }

    const dir = rel.includes("/") ? rel.slice(0, rel.lastIndexOf("/")) : "."
    deps.set(rel, { imports: new Set(resolved), exports: new Set(exports), size: Math.floor(text.length / 1024), dir })

    for (const r of resolved) {
      if (!importers.has(r)) importers.set(r, new Set())
      importers.get(r).add(rel)
    }
    // Yield the event loop every 20 files to prevent TUI freeze
    if (i % 20 === 19) await new Promise(r => setImmediate(r))
  }

  return { deps, importers, fileCount: allFiles.length }
}

/**
 * Generate a compact architecture summary (replaces the old full-dump injection).
 * Three layers, each with decreasing information density:
 *  1. Directory-level dependencies (meaningful only for multi-directory projects, skipped for single-directory)
 *  2. Hub files Top-12 (most-imported files — architecture skeleton)
 *  3. Entry points (files with no importers — startup/top-level entry points)
 * Output is naturally bounded (~1000-2000 chars), no more OUTLINE_INJECT_MAX hard truncation.
 */
export async function buildSummary(db, cwd) {
  const graph = await _buildDepGraph(db, cwd)
  if (!graph) return "(no indexed source files; run codeSync or /reindex first)"
  const { deps, importers, fileCount } = graph

  const out = []
  out.push(`${fileCount} source files indexed.`)

  // 1) Directory-level dependencies
  const dirDeps = new Map() // dir → Set<imported-dir>
  const dirSet = new Set()
  for (const [rel, d] of deps) {
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

  // 2) Hub files Top-12: sorted by import count descending
  const HUB_LIMIT = 12
  const hubScores = []
  for (const [rel] of deps) {
    const key = rel.replace(/\.(m?js|jsx|tsx?)$/i, "")
    const rev = importers.get(key)
    if (rev?.size) hubScores.push({ path: rel, count: rev.size })
  }
  hubScores.sort((a, b) => b.count - a.count)
  if (hubScores.length > 0) {
    out.push(`Hub files (by inbound dependencies, top ${Math.min(hubScores.length, HUB_LIMIT)}):`)
    for (const h of hubScores.slice(0, HUB_LIMIT)) {
      const d = deps.get(h.path)
      const kb = d?.size ? ` (${d.size} KB)` : ""
      const key = h.path.replace(/\.(m?js|jsx|tsx?)$/i, "")
      const rev = importers.get(key)
      const shortRefs = rev.size <= 5
        ? [...rev].join(", ")
        : [...rev].slice(0, 4).join(", ") + ` +${rev.size - 4} more`
      out.push(`  ${h.path}${kb} — imported by: ${shortRefs}`)
    }
  }

  // 3) Entry points: files not imported by others (leaf/entry)
  const entries = []
  for (const [rel] of deps) {
    const key = rel.replace(/\.(m?js|jsx|tsx?)$/i, "")
    if (!importers.has(key) || importers.get(key).size === 0) {
      entries.push(rel)
    }
  }
  if (entries.length > 0 && entries.length < fileCount) {
    const limit = 8
    const shown = entries.slice(0, limit)
    out.push(`Entry points (not imported by others):`)
    for (const e of shown) out.push(`  ${e}`)
    if (entries.length > limit) out.push(`  ... +${entries.length - limit} more`)
  }

  out.push("For detailed per-file relationships, call repo_outline with a file path.")
  return out.join("\n")
}

/** Get known file list from code_chunks (reuse index), parse by path to generate outline text */
export async function buildOutline(db, cwd, focusPath) {
  const graph = await _buildDepGraph(db, cwd)
  if (!graph) return "(no indexed source files; run codeSync or /reindex first)"
  const { deps, importers } = graph

  const files = focusPath ? [focusPath] : [...deps.keys()]
  const out = []
  const sorted = files.sort()
  for (const rel of sorted) {
    const d = deps.get(rel)
    if (!d) continue
    const parts = []
    // imported by (strip extension when matching, since import paths usually don't include .mjs/.js suffix)
    const key = rel.replace(/\.(m?js|jsx|tsx?)$/i, "")
    const rev = importers.get(key)
    if (rev?.size) parts.push(`← imported by: ${[...rev].join(", ")}`)
    // imports
    if (d.imports.size) parts.push(`→ imports: ${[...d.imports].join(", ")}`)
    // exports
    if (d.exports.size) parts.push(`→ exports: ${[...d.exports].join(", ")}`)

    const kb = d.size > 0 ? ` (${d.size} KB)` : ""
    if (parts.length) {
      out.push(`${rel}${kb}\n  ${parts.join("\n  ")}`)
    } else {
      out.push(`${rel}${kb}`)
    }
  }

  return out.join("\n")
}

/**
 * Build the repo_outline tool (read-only).
 * Requires memory.db (reuses code_chunks file list) and cwd.
 */
export function repoOutlineTool(db, cwd) {
  return {
    name: "repo_outline",
    description:
      "Show the project's file dependency outline: which files import/export from which, and what symbols they export. Use when you need to understand the project structure, find where a function is defined, or see what files depend on a module. Pass a path to focus on a single file's relationships. Find code by keyword or snippet with code_search.",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: "Optional: focus on a specific file path (relative to project root)" },
      },
      required: [],
    },
    readonly: true,
    async execute(args) {
      const outline = await buildOutline(db, cwd, args.path ?? null)
      return outline
    },
  }
}
