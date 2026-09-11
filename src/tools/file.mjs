/**
 * file.mjs — File manipulation tools: read, write（edit/hashline_edit 族 2026-09-05
 * module-split 迁至 file-edit.mjs——552 > 500 硬限——verbatim 迁移语义零变；re-export
 * 保 import 面不变。Dual-channel: open files edit via WorkspaceEdit (undo-integrated),
 * closed files edit directly on disk.)
 */

import { readFile, writeFile } from "node:fs/promises"
import { existsSync } from "node:fs"
import { dirname } from "node:path"
import { DESC, resolvePath, getOpenDoc, applyEditorEdit, normalizeEOL, stripBom, detectFileEol, majorityEol, hashLine, refreshMarkdownPreview, MAX_READ_LINES } from "./shared.mjs"

// DUAL-END-TRUNCATION (F-1, C 方案——2026-09-09，CLI file.mjs 逐字同构镜像)：read
// 双端尾行数——窗口截断大文件时返回 头 N 行（N = 请求窗口，默认 MAX_READ_LINES）+ 省略注
// + 尾 M 行（本常量——文件真实尾部——offload 产物尾端结论可见）。M + 窗口 = 整读上限——
// K=0（尾区与窗口相接）时整印剩余、无假省略注。
export const READ_TAIL_LINES = 500

export const readTool = {
  name: "read",
  readonly: true,
  description: DESC("read"),
  parameters: {
    type: "object",
    properties: {
      path: { type: "string", description: "File path (alias: filePath)" },
      filePath: { type: "string", description: "Alias for path" },
      offset: { type: "number", description: "1-based line number to start from" },
      limit: { type: "number", description: `Max lines to return (default ${MAX_READ_LINES})` },
      hashes: { type: "boolean", description: "Include SHA256 line hashes for hash-based editing (default false). Use when you plan to edit the file with hashline_edit." },
    },
    required: ["path"],
  },
  async execute({ path, offset, limit, hashes, filePath }, ctx) {
    path = path || filePath
    if (typeof path !== "string" || !path) return "Error: path (or filePath) is required and must be a string"
    const abs = resolvePath(path, ctx.cwd)
    const doc = getOpenDoc(abs)
    const text = doc ? doc.getText() : await readFile(abs, "utf8")
    // Unify the hash domain with hashline_edit: strip a leading BOM and normalize
    // EOL before splitting — otherwise CRLF lines keep a trailing \r and a BOM
    // sticks to line 1, so every line hash mismatches what hashline_edit computes.
    const lines = normalizeEOL(stripBom(text)).split("\n")
    const start = Math.max(0, (offset || 1) - 1)
    // DUAL-END-TRUNCATION (F-1, C 方案——2026-09-09，CLI file.mjs 同构)：补默认 2000
    // 上限（描述原已声明 default 2000——CLI parity）+ 补 total 尾注 + 大文件窗口截断
    // 返回 头 + 省略注 + 真实尾。判别锚 = 窗口截断且 total > MAX_READ_LINES。
    const lim = Math.min(limit || MAX_READ_LINES, MAX_READ_LINES)
    const windowEnd = start + lim
    const render = (slice, startLn) => slice.map((l, i) => {
      const ln = startLn + i
      if (hashes) return `${String(ln).padStart(6, " ")}${hashLine(l)}  ${l}`
      return `${String(ln).padStart(6, " ")}\t${l}`
    }).join("\n")
    // ≤ 阈值文件任何窗口走旧头向路径（字节零变化——VSC 补 total 尾注：窗口截断时提示
    // 续读）；窗口覆盖全文件也走旧路径。
    if (windowEnd >= lines.length || lines.length <= MAX_READ_LINES) {
      const suffix = windowEnd < lines.length ? `\n... (${lines.length} lines total, use offset to continue)` : ""
      return render(lines.slice(start, windowEnd), start + 1) + suffix
    }
    const head = render(lines.slice(start, windowEnd), start + 1)
    // 尾区 = 文件末 READ_TAIL_LINES 行；尾区起点落在窗口内（重叠）→ 从窗口后开始——
    // 任何行不打印两次；剩余全被覆盖（K=0）→ 整印余段且无假省略注。
    const tailStart = Math.max(windowEnd, lines.length - READ_TAIL_LINES)
    const middle = tailStart - windowEnd
    const tail = render(lines.slice(tailStart), tailStart + 1)
    return middle > 0
      ? `${head}\n…(truncated: ${middle} lines in middle, use offset to continue)\n${tail}`
      : `${head}\n${tail}`
  },
}

export const writeTool = {
  name: "write",
  description: DESC("write"),
  parameters: {
    type: "object",
    properties: {
      path: { type: "string", description: "File path (alias: filePath)" },
      filePath: { type: "string", description: "Alias for path" },
      content: { type: "string", description: "Full content to write" },
    },
    required: ["path", "content"],
  },
  touchedPaths(args) { return args.path || args.filePath ? [args.path || args.filePath] : [] },
  async execute({ path, content, filePath }, ctx) {
    path = path || filePath
    if (typeof path !== "string" || !path) return "Error: path (or filePath) is required and must be a string"
    if (typeof content !== "string") return "Error: content is required and must be a string"
    const abs = resolvePath(path, ctx.cwd)
    const { mkdir } = await import("node:fs/promises")
    await mkdir(dirname(abs), { recursive: true })

    const doc = getOpenDoc(abs)
    if (doc) {
      // Open in editor — apply via WorkspaceEdit (undo-integrated). Overwriting an
      // open file restores ITS original EOL style (F1) — passing LF content straight
      // through silently flipped an open CRLF file to LF.
      if (doc.isDirty) return `Error: File has unsaved changes in the editor: ${abs}. Save or discard before allowing automated edits.`
      const eol = detectFileEol(doc.getText())
      const out = eol === "\r\n" ? normalizeEOL(content).replace(/\n/g, "\r\n") : normalizeEOL(content)
      await applyEditorEdit(doc, out)
      return `Wrote ${content.length} chars to ${path} (via editor)`
    }

    // Not open — write to disk directly. EOL semantics (CLI parity): overwriting
    // an existing file restores ITS original EOL style (F1); a new file follows
    // the directory's majority style, defaulting to LF (F2).
    const prev = existsSync(abs) ? await readFile(abs, "utf8").catch(() => null) : null
    const eol = prev != null ? detectFileEol(prev) : majorityEol(dirname(abs))
    // Normalize first in BOTH branches: CRLF content written to an LF file would
    // otherwise leave bare CRLF (mixed line endings) in the output.
    const out = eol === "\r\n" ? normalizeEOL(content).replace(/\n/g, "\r\n") : normalizeEOL(content)
    await writeFile(abs, out, "utf8")
    refreshMarkdownPreview(abs)
    return `Wrote ${content.length} chars to ${path}`
  },
}

// edit/hashline_edit 族（2026-09-05 module-split——552 > 500 硬限——verbatim 迁至
// file-edit.mjs；消费方 import 面不变）
export { editTool, hashlineEditTool } from "./file-edit.mjs"
