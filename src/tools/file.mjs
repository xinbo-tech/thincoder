/**
 * file.mjs — File manipulation tools: read, write（edit/hashline_edit 族 2026-09-05
 * module-split 迁至 file-edit.mjs——552 > 500 硬限——verbatim 迁移语义零变；re-export
 * 保 import 面不变。Dual-channel: open files edit via WorkspaceEdit (undo-integrated),
 * closed files edit directly on disk.)
 */

import { readFile, writeFile } from "node:fs/promises"
import { existsSync } from "node:fs"
import { dirname } from "node:path"
import { resolvePath, getOpenDoc, applyEditorEdit, normalizeEOL, stripBom, detectFileEol, majorityEol, hashLine, refreshMarkdownPreview } from "./shared.mjs"

export const readTool = {
  name: "read",
  readonly: true,
  description:
    "Read a text file. Returns numbered lines. Use offset/limit to page large files.\n" +
    "Route to read instead of bash: `cat file` / `type file` / `node -e \"fs.readFileSync(...)\"` → read. Reading a file is a read — never shell out for it.\n" +
    "Parameters:\n" +
    "- path (required): File path, relative to cwd or absolute (alias: filePath)\n" +
    "- offset: 1-based line number to start reading from\n" +
    "- limit: Max lines to return (default 2000)\n" +
    "- hashes: Include SHA256 line hashes (for hashline_edit)",
  parameters: {
    type: "object",
    properties: {
      path: { type: "string", description: "File path (alias: filePath)" },
      filePath: { type: "string", description: "Alias for path" },
      offset: { type: "number", description: "1-based line number to start from" },
      limit: { type: "number", description: "Max lines to return" },
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
    const end = limit ? start + limit : lines.length
    const chunk = lines.slice(start, end)
    if (hashes) {
      // Parity with CLI read (review R9#3): hashline_edit is unusable without a way
      // to obtain line hashes — read is that way on the CLI side; mirror it here.
      return chunk.map((l, i) => `${String(start + i + 1).padStart(6, " ")}${hashLine(l)}  ${l}`).join("\n")
    }
    return chunk.map((l, i) => `${String(start + i + 1).padStart(6, " ")}\t${l}`).join("\n")
  },
}

export const writeTool = {
  name: "write",
  description:
    "Write content to a file. Creates parent directories; overwrites existing file. " +
    "write replaces the WHOLE file — read it first and confirm you intend to rewrite it entirely; for a small change use edit / insert_after. " +
    "The file is atomic: it either writes completely or fails. Returns `Wrote <n> chars to <path>`.\n" +
    "Parameters:\n" +
    "- path (required): File path, relative to cwd or absolute (alias: filePath)\n" +
    "- content (required): Full content to write",
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
