/**
 * tree.mjs — directory tree tool (parity with thinworker `repomap`).
 * Renders a repo's directory tree (default depth 3), skipping dotfiles,
 * build/vendor dirs and binary files, so the model can see which modules
 * exist without shelling out to `tree`/`find`.
 */
import { DESC, truncate, resolveInCwd } from "./shared.mjs"
import { readdir } from "node:fs/promises"
import { join, basename, extname } from "node:path"

const MAX_ENTRIES = 200
const DEFAULT_DEPTH = 3
const SKIP_DIRS = new Set(["node_modules", "bin", "obj", "dist", "build", "coverage", "turbo", ".git", ".thincoder", ".vs", ".venv", "__pycache__", ".idea"])
const BINARY_EXTS = new Set([".exe", ".dll", ".png", ".jpg", ".jpeg", ".gif", ".pdf", ".docx", ".xlsx", ".pptx", ".zip", ".7z", ".mp3", ".mp4", ".woff", ".woff2", ".ico"])

export const treeTool = {
  name: "tree",
  description: DESC("tree"),
  parameters: {
    type: "object",
    properties: {
      path: { type: "string", description: "Root directory (default cwd)" },
      depth: { type: "integer", description: `Tree depth (default ${DEFAULT_DEPTH}, max 6)` },
    },
    required: [],
  },
  readonly: true,
  async execute(args, ctx) {
    const root = resolveInCwd(ctx, args.path ?? ".")
    const maxDepth = Math.min(Math.max(1, Math.floor(args.depth ?? DEFAULT_DEPTH)), 6)
    const lines = [basename(root) + "/"]
    const state = { count: 1 }
    await walk(root, 0, maxDepth, "", lines, state)
    return truncate(lines.join("\n"))
  },
}

async function walk(dir, depth, maxDepth, prefix, lines, state) {
  let entries
  try { entries = await readdir(dir, { withFileTypes: true }) } catch { return }
  const items = []
  for (const e of entries) {
    if (e.name.startsWith(".")) continue // dotfiles + dotdirs
    const isDir = e.isDirectory()
    if (isDir) { if (SKIP_DIRS.has(e.name)) continue; items.push({ name: e.name, isDir: true }) }
    else if (!BINARY_EXTS.has(extname(e.name).toLowerCase())) items.push({ name: e.name, isDir: false })
  }
  items.sort((a, b) => (a.isDir === b.isDir ? a.name.localeCompare(b.name) : a.isDir ? -1 : 1))

  for (let i = 0; i < items.length; i++) {
    if (state.count >= MAX_ENTRIES) { lines.push(prefix + "…（更多项已省略）"); return }
    const { name, isDir } = items[i]
    const isLast = i === items.length - 1
    lines.push(prefix + (isLast ? "└── " : "├── ") + (isDir ? name + "/" : name))
    state.count++
    if (isDir && depth + 1 < maxDepth) {
      await walk(join(dir, name), depth + 1, maxDepth, prefix + (isLast ? "    " : "│   "), lines, state)
    }
  }
}