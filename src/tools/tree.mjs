/**
 * tree.mjs — directory tree tool (parity with thinworker `repomap`).
 * Renders a directory tree (default depth 3), skipping dotfiles, build/vendor
 * dirs and binary files, so the model sees the structure without shelling out.
 */
import { readdir, stat } from "node:fs/promises"
import { join, basename, extname } from "node:path"
import { resolvePath, truncate } from "./shared.mjs"

const MAX_ENTRIES = 200
const DEFAULT_DEPTH = 3
const SKIP_DIRS = new Set(["node_modules", "bin", "obj", "dist", "build", "coverage", "turbo", ".git", ".thincoder", ".vs", ".venv", "__pycache__", ".idea"])
const BINARY_EXTS = new Set([".exe", ".dll", ".png", ".jpg", ".jpeg", ".gif", ".pdf", ".docx", ".xlsx", ".pptx", ".zip", ".7z", ".mp3", ".mp4", ".woff", ".woff2", ".ico"])

export const treeTool = {
  name: "tree",
  description:
    "Generate a directory tree of the codebase (default depth 3). Skips dotfiles, .git/node_modules/dist/build/bin/obj and other build/vendor dirs, and binary files. " +
    "Returns the directory tree as text (capped at 200 entries).\n" +
    "Route to tree instead of bash: `tree`/`find .`/`dir /s`.\n" +
    "Parameters:\n" +
    "- path: Root directory (default workspace root)\n" +
    "- depth: Tree depth (default 3, max 6)",
  parameters: {
    type: "object",
    properties: {
      path: { type: "string", description: "Root directory (default workspace root)" },
      depth: { type: "integer", description: `Tree depth (default ${DEFAULT_DEPTH}, max 6)` },
    },
    required: [],
  },
  readonly: true,
  async execute({ path, depth }, ctx) {
    const root = path ? resolvePath(path, ctx.cwd) : ctx.cwd
    let st
    try { st = await stat(root) } catch { return `Error: directory not found: ${path ?? "."}` }
    if (!st.isDirectory()) return `Error: not a directory: ${path ?? "."}`
    const d = Number(depth)
    const maxDepth = Number.isInteger(d) && d > 0 ? Math.min(d, 6) : DEFAULT_DEPTH
    const lines = [basename(root) + "/"]
    const state = { count: 1, capped: false }
    await walk(root, 0, maxDepth, "", lines, state)
    return truncate(lines.join("\n"))
  },
}

async function walk(dir, depth, maxDepth, prefix, lines, state) {
  if (state.capped) return
  let entries
  try { entries = await readdir(dir, { withFileTypes: true }) } catch { return }
  const items = []
  for (const e of entries) {
    if (e.name.startsWith(".")) continue
    const isDir = e.isDirectory()
    if (isDir) { if (SKIP_DIRS.has(e.name)) continue; items.push({ name: e.name, isDir: true }) }
    else if (!BINARY_EXTS.has(extname(e.name).toLowerCase())) items.push({ name: e.name, isDir: false })
  }
  items.sort((a, b) => (a.isDir === b.isDir ? a.name.localeCompare(b.name) : a.isDir ? -1 : 1))

  for (let i = 0; i < items.length; i++) {
    if (state.capped) return
    if (state.count >= MAX_ENTRIES) { state.capped = true; lines.push(prefix + "…（更多项已省略）"); return }
    const { name, isDir } = items[i]
    const isLast = i === items.length - 1
    lines.push(prefix + (isLast ? "└── " : "├── ") + (isDir ? name + "/" : name))
    state.count++
    if (isDir && depth + 1 < maxDepth) {
      await walk(join(dir, name), depth + 1, maxDepth, prefix + (isLast ? "    " : "│   "), lines, state)
    }
  }
}