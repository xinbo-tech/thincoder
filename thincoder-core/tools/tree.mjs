/**
 * tree.mjs — directory tree tool (parity with thinworker `repomap`).
 * Renders a repo's directory tree (default depth 3), skipping dotfiles,
 * build/vendor dirs and binary files, so the model can see which modules
 * exist without shelling out to `tree`/`find`.
 */
import { DESC, truncate, resolveInCwd } from "./shared.mjs"
import { readdir, stat } from "node:fs/promises"
import { join, basename, extname } from "node:path"
// 排除名单单源（零依赖叶档 `skip-dirs.mjs`——2026-10-27 四份名单合一）：本档不再持本地副本。
// 两项旧值随之退场：`turbo`（无点，笔误——另三份都是 `.turbo`）、`bin`（`thincoder-cli/bin/**`
// 是 CLI 入口、产品代码，不该从任何面上被剪掉）。
import { SKIP_DIRS } from "../skip-dirs.mjs"

const MAX_ENTRIES = 200
const DEFAULT_DEPTH = 3
const BINARY_EXTS = new Set([".exe", ".dll", ".png", ".jpg", ".jpeg", ".gif", ".pdf", ".docx", ".xlsx", ".pptx", ".zip", ".7z", ".mp3", ".mp4", ".woff", ".woff2", ".ico"])

// ─── cwd 归一注入缝（#56——「cwd 归一开关按端注入」，形态参 §2.13.5 注入缝）─────────
/**
 * 根路径解析注入位（**缺省不覆盖** = 核内 `resolveInCwd`——CLI 语义（realpath 归一），
 * 零行为变；端装配层可覆盖为本端归一形态（如 join 式解析）。核内零端名分支（契约 5——
 * 本档只认 `resolve` 函数名）。
 * 契约：`resolve(ctx, p) → string`（p 缺省为 "."）。
 */
let injectedResolve = null
export function configureTreeResolve(impl) {
  injectedResolve = impl && typeof impl.resolve === "function" ? impl.resolve : null
}
/** 撤销注入（测试与端装配生命周期用——缺省态 = 核内 resolveInCwd）。 */
export function resetTreeResolve() { injectedResolve = null }

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
    // cwd 归一开关（#56）：注入面命中 ⇒ 端侧解析；缺省 = 核内 resolveInCwd（CLI 语义）。
    const root = (injectedResolve ?? resolveInCwd)(ctx, args.path ?? ".")
    let st
    try { st = await stat(root) } catch { return `Error: directory not found: ${args.path ?? "."}` }
    if (!st.isDirectory()) return `Error: not a directory: ${args.path ?? "."}`
    const d = Number(args.depth)
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
    if (e.name.startsWith(".")) continue // dotfiles + dotdirs
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