/**
 * hashline-edit.mjs — hashline_edit 工具（2026-09-08 module-split：file-edit.mjs 500 行
 * 硬限——editTool 阶段 2（EDIT.md §8——批量行号/删行形态/描述扩写）跨帽后 verbatim 迁出
 * hashlineEditTool——语义零变；file.mjs re-export（消费方 import 面不变）。
 * 权威语义 = HASHLINE-EDIT.md——滑窗 hash 匹配/BOM 处理/编辑器路径（本仓文档，不引 CLI）。
 */

import { readFile, writeFile } from "node:fs/promises"
import { resolvePath, getOpenDoc, applyEditorEdit, normalizeEOL, stripBom, joinWithEol, FFFD_WARNING, gitDiffOne, hashLine, refreshMarkdownPreview } from "./shared.mjs"

export const hashlineEditTool = {
  name: "hashline_edit",
  readonly: false,
  description:
    "Edit a file using content-hash addressing instead of string matching. More reliable than edit when whitespace or encoding varies — hashes are computed from exact line bytes on disk.\n" +
    "Parameters:\n" +
    "- path (required): File path\n" +
    "- old_hashes (required): Array of SHA256 hashes (12-char hex) identifying lines to replace. Read the file with hashes=true first to obtain these hashes. For a single line, pass [hash]; for a contiguous block, pass [hash1, hash2, ...] in order.\n" +
    "- new_content (required): Replacement text (multi-line ok, \\n separated)\n\n" +
    "Notes:\n" +
    "- The hash of each line is computed as SHA256(line_content).slice(0, 12) — the same algorithm used by read(hashes=true)\n" +
    "- Hashes are position-independent: they identify lines by content, not by line number (which changes after edits)\n" +
    "- If the hash sequence isn't found, the error will include the current file's hashes so you can retry with corrected values\n" +
    "- Prefer this over edit when: 1) the file may have mixed whitespace/encoding, 2) you want to edit a block of lines with a single call\n" +
    "- use the most recent read of the file as the source of old_string / line numbers / hashes — re-read after the file changed\n" +
    "Replacement text replaces the lines identified by the hashes — content not present in new_content is deleted. For a new line after a known line, use insert_after. For a single simple string swap, use edit.",
  parameters: {
    type: "object",
    properties: {
      path: { type: "string", description: "File path" },
      old_hashes: { type: "array", items: { type: "string" }, description: "SHA256 hashes (12 chars) of the lines to replace. Read the file with hashes=true first to obtain these hashes. Single line: pass 1 hash; multiple lines: pass the exact sequence of hashes." },
      new_content: { type: "string", description: "Replacement text (can span multiple lines)" },
    },
    required: ["path", "old_hashes", "new_content"],
  },
  touchedPaths(args) { return args.path ? [args.path] : [] },
  async execute({ path, old_hashes, new_content }, ctx) {
    const abs = resolvePath(path, ctx.cwd)
    if (!old_hashes?.length) throw new Error("old_hashes must not be empty — read the file with hashes=true to get line hashes")
    const raw = await readFile(abs, "utf8")
    // Strip the BOM for the hash domain (hashLine never sees it) but remember it —
    // the disk write-back must restore it, while the editor path passes BOM-less
    // text (VS Code re-adds the BOM on save per its file encoding).
    const hadBom = raw.charCodeAt(0) === 0xFEFF
    const text = normalizeEOL(stripBom(raw))
    // Encoding-corruption probe (CLI parity): U+FFFD means the file is not clean
    // UTF-8 — hash addressing may be unreliable. Warn (never block).
    const corrupted = text.includes("\uFFFD")
    const lines = text.split("\n")
    const fileHashes = lines.map((l) => hashLine(l))
    const target = old_hashes

    // Sliding-window match: find all occurrences of the hash sequence.
    const matches = []
    for (let i = 0; i <= fileHashes.length - target.length; i++) {
      let match = true
      for (let j = 0; j < target.length; j++) {
        if (fileHashes[i + j] !== target[j]) { match = false; break }
      }
      if (match) matches.push(i)
    }

    if (matches.length === 0) {
      const maxShow = Math.min(fileHashes.length, 50)
      const hashDump = fileHashes.slice(0, maxShow).map((h, i) => `${h}  L${i + 1}: ${lines[i].slice(0, 80)}`).join("\n")
      const preview = target.join(" ")
      throw new Error(
        `Hash sequence not found in ${path}: ${preview}\n` +
        `The file may have been modified since you last read it. Current hashes (first ${maxShow} lines):\n${hashDump}` +
        `\nfor fresh hashes, re-read the file with hashes=true` +
        (corrupted ? `\n${FFFD_WARNING}` : "")
      )
    }

    if (matches.length > 1) {
      const c = 2
      const detail = matches.map((m) => {
        const start = Math.max(0, m - c)
        const end = Math.min(lines.length, m + target.length + c)
        const preview = lines.slice(start, end).map((l, i) => {
          const ln = start + i + 1
          const marker = m <= ln - 1 && ln - 1 < m + target.length ? ">" : " "
          return `${marker} L${ln}: ${l.slice(0, 80)}`
        }).join("\n")
        return `  Match at line ${m + 1} (${target.length} line(s)):\n${preview}`
      }).join("\n\n")
      throw new Error(
        `Hash sequence matches ${matches.length} positions in ${path} — ambiguous.\n` +
        `Include more surrounding lines (unique-hash lines before/after the target) to disambiguate.\n\n` +
        `All matches with surrounding context:\n\n${detail}`
      )
    }

    const pos = matches[0]
    const newLines = normalizeEOL(new_content).split("\n") // normalize: CRLF in new_content would join into \r\r\n
    lines.splice(pos, target.length, ...newLines)
    // Write back in the file's original EOL style (same rule as edit / apply_patch).
    const updated = joinWithEol(lines, raw)

    // Open in editor → WorkspaceEdit; otherwise write to disk
    const doc = getOpenDoc(abs)
    if (doc) {
      if (doc.isDirty) return `Error: File has unsaved changes in the editor: ${abs}. Save or discard before allowing automated edits.`
      // BOM-less text: the editor re-adds the BOM on save — passing it would double it.
      await applyEditorEdit(doc, updated)
    } else {
      await writeFile(abs, (hadBom ? "\uFEFF" : "") + updated, "utf8")
      refreshMarkdownPreview(abs)
    }
    const diff = gitDiffOne(ctx.cwd, abs)
    return `Edited ${path}: replaced ${target.length} line(s) at L${pos + 1} with ${newLines.length} line(s)${diff ? "\n" + diff : ""}${corrupted ? `\n${FFFD_WARNING}` : ""}`
  },
}
