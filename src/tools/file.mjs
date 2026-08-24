import {
  DESC,
  truncate,
  MAX_READ_LINES,
  gitDiffOne,
  autoSyntaxCheck,
  resolveInCwd,
  resolveExternal,
  normalizeEOL,
} from "./shared.mjs";
import { specForModel } from "../config.mjs";
import { createHash } from "node:crypto";
import { mkdir } from "node:fs/promises";
import { readFile } from "node:fs/promises";
import { stat } from "node:fs/promises";
import { writeFile } from "node:fs/promises";
import { unlink } from "node:fs/promises";
import { join, relative, dirname } from "node:path";

const MAX_FILE_READ_BYTES = 10_000_000
const MAX_IMAGE_BYTES = 15_000_000

// ────────────────────────────────────────
// Dirty-file tracking (read-before-insert guard)
// ────────────────────────────────────────
// insert_after anchors on LINE NUMBERS — the most drift-prone addressing.
// Every write tool marks the file dirty; insert_after refuses to run on a
// dirty file until the agent reads it again (fresh line numbers). This turns
// the "read after edit" discipline into a structural guarantee: a stale
// after_line can never silently land in the wrong place again.
const dirtyPaths = new Set()
export function markDirty(abs) { dirtyPaths.add(abs) }
export function clearDirty(abs) { dirtyPaths.delete(abs) }
export function isDirty(abs) { return dirtyPaths.has(abs) }

export const readTool = {
  name: "read",
  description: DESC("read"),
  parameters: {
    type: "object",
    properties: {
      path: { type: "string", description: "File path (relative to cwd or absolute)" },
      offset: { type: "number", description: "1-based line number to start from" },
      limit: { type: "number", description: `Max lines to return (default ${MAX_READ_LINES})` },
      allowExternal: { type: "boolean", description: "Allow reading files outside the working directory. Only set true when the user explicitly provided an external path — never use this to explore beyond cwd on your own." },
      hashes: { type: "boolean", description: "Include SHA256 line hashes for hash-based editing (default false). Use when you plan to edit the file with hashline_edit." },
    },
    required: ["path"],
  },
  readonly: true,
  async execute(args, ctx) {
    const abs = args.allowExternal ? resolveExternal(ctx, args.path) : resolveInCwd(ctx, args.path)
    // Large file guard: check size first, reject reading entire file if >10MB (offset/limit only affect the returned slice, not buffering)
    const st = await stat(abs).catch(() => null)
    if (st && st.size > MAX_FILE_READ_BYTES) throw new Error(`File too large (${Math.round(st.size / 1_000_000)}MB > 10MB limit). Use bash with head/tail or grep for targeted extraction.`)
    const content = normalizeEOL(await readFile(abs, "utf8"))
    // A read refreshes the agent's view — line numbers are fresh again.
    clearDirty(abs)
    const lines = content.split("\n")
    const offset = Math.max(1, args.offset ?? 1)
    const limit = Math.min(args.limit ?? MAX_READ_LINES, MAX_READ_LINES)
    const slice = lines.slice(offset - 1, offset - 1 + limit)
    const numbered = slice.map((l, i) => {
      const ln = offset + i
      if (args.hashes) {
        const h = createHash("sha256").update(l).digest("hex").slice(0, 12)
        return `${ln}\t[${h}] ${l}`
      }
      return `${ln}\t${l}`
    }).join("\n")
    const suffix = offset - 1 + limit < lines.length ? `\n... (${lines.length} lines total, use offset to continue)` : ""
    return truncate(numbered + suffix)
  },
}

// ---------------------------------------------------------------- read_image

// Raster formats only — every mainstream vision API (Kimi, Anthropic, OpenAI, Gemini)
// rejects svg/bmp. svg is served as text source below; bmp is refused with a hint.
const IMAGE_EXTENSIONS = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif", webp: "image/webp" }
const MAX_SVG_CHARS = 100_000

export const readImageTool = {
  name: "read_image",
  description: DESC("read_image"),
  parameters: {
    type: "object",
    properties: {
      path: { type: "string", description: "Path to image file (relative to cwd or absolute). Supports png, jpg, gif, webp. svg files are returned as text source (no vision API accepts svg)." },
    },
    required: ["path"],
  },
  readonly: true,
  multimodal: true, // returns JSON { text, images } — agent loop converts to multimodal user message
  /** Returns JSON: { text, images }, for the agent layer to convert into multimodal user messages */
  async execute(args, ctx) {
    const abs = resolveInCwd(ctx, args.path)
    const ext = abs.slice(abs.lastIndexOf(".") + 1).toLowerCase()

    // SVG is text markup — return the source directly. Works with text-only models too
    // (no vision gate), and never poisons history with an image part the API will 400 on.
    if (ext === "svg") {
      const st = await stat(abs).catch(() => null)
      if (st && st.size > MAX_IMAGE_BYTES) throw new Error(`Image too large: ${Math.round(st.size / 1_000_000)}MB (max 15MB)`)
      const src = normalizeEOL(await readFile(abs, "utf8"))
      return `[read_image: ${args.path} (svg source, ${src.length} chars — no vision API accepts image/svg+xml, showing markup instead)]\n` +
        truncate(src, MAX_SVG_CHARS)
    }

    // Vision capability gate: injecting an image into a text-only model's history poisons the whole
    // conversation (every subsequent request 400s on the image part). Refuse before reading the file.
    const model = ctx.agent?.provider?.model
    if (model && !specForModel(model).multimodal) {
      throw new Error(
        `Model "${model}" does not support image input — read_image is unavailable with this provider. ` +
        `Verify visual output programmatically (file size, dimensions, pixel checks via code) or ask the user to switch to a vision-capable provider.`
      )
    }
    const mime = IMAGE_EXTENSIONS[ext]
    if (!mime) {
      const hint = ext === "bmp" ? " Convert it to PNG first (no mainstream vision API accepts BMP)." : ""
      throw new Error(`Unsupported image format: .${ext}. Supported: ${Object.keys(IMAGE_EXTENSIONS).join(", ")}, svg (as text source).${hint}`)
    }
    // Check size before reading — prevent huge images from blowing up memory (20MB base64 ≈ 15MB raw)
    const imgStat = await stat(abs).catch(() => null)
    if (imgStat && imgStat.size > MAX_IMAGE_BYTES) throw new Error(`Image too large: ${Math.round(imgStat.size / 1_000_000)}MB (max 15MB)`)
    const buf = await readFile(abs) // raw buffer, no encoding
    const b64 = buf.toString("base64")
    const bytes = buf.length
    const result = JSON.stringify({
      text: `[read_image: ${args.path} (${mime}, ${bytes} bytes)]`,
      images: [{ type: "image_url", image_url: { url: `data:${mime};base64,${b64}` } }],
    })
    // Paste-created temp files: delete after use, no litter
    const basename = abs.includes("/") ? abs.slice(abs.lastIndexOf("/") + 1) : abs.slice(abs.lastIndexOf("\\") + 1)
    if (basename.startsWith(".thincoder-paste-")) {
      try { await unlink(abs) } catch { /* can't delete, so be it */ }
    }
    return result
  },
}

// ---------------------------------------------------------------- write

export const writeTool = {
  name: "write",
  description: DESC("write"),
  parameters: {
    type: "object",
    properties: {
      path: { type: "string", description: "File path (relative to cwd or absolute)" },
      content: { type: "string", description: "Full content to write" },
    },
    required: ["path", "content"],
  },
  readonly: false,
  touchedPaths(args) { return args.path ? [args.path] : [] },
  async execute(args, ctx) {
    const abs = resolveInCwd(ctx, args.path)
    await mkdir(dirname(abs), { recursive: true })
    const st = await stat(abs).catch(() => null)
    if (st?.isDirectory()) throw new Error(`Path is a directory: ${args.path}`)
    await writeFile(abs, args.content, "utf8")
    markDirty(abs)
    const diff = gitDiffOne(ctx.cwd, abs)
    return `Wrote ${args.content.length} chars to ${args.path}${diff ? "\n" + diff : ""}${await autoSyntaxCheck(abs)}`
  },
}

// ---------------------------------------------------------------- edit

export const editTool = {
  name: "edit",
  description: DESC("edit"),
  parameters: {
    type: "object",
    properties: {
      path: { type: "string", description: "File path" },
      old_string: { type: "string", description: "Exact text to replace" },
      new_string: { type: "string", description: "Replacement text" },
      replace_all: { type: "boolean", description: "Replace all occurrences (default false)" },
    },
    required: ["path", "old_string", "new_string"],
  },
  readonly: false,
  touchedPaths(args) { return args.path ? [args.path] : [] },
  async execute(args, ctx) {
    const abs = resolveInCwd(ctx, args.path)
    if (!args.old_string) {
      throw new Error("old_string must not be empty (empty string matches everywhere and would corrupt the file)")
    }
    const content = normalizeEOL(await readFile(abs, "utf8"))
    const occurrences = content.split(args.old_string).length - 1
    if (occurrences === 0) {
      // Give clues to help the model locate: first-line preview + common causes
      const preview = args.old_string.slice(0, 100).split("\n")[0]
      throw new Error(
        `old_string not found in ${args.path}\n` +
        `  searched: "${preview}${args.old_string.length > 100 ? "…" : ""}"\n` +
        `  hints: whitespace mismatch? file already changed? try reading the file first`
      )
    }
    if (occurrences > 1 && !args.replace_all) {
      throw new Error(`old_string matches ${occurrences} times in ${args.path}; provide more context or set replace_all`)
    }
    const updated = args.replace_all
      ? content.split(args.old_string).join(args.new_string)
      // Functional replacement: avoid $-substitution patterns in new_string (match string / backreference) being expanded
      : content.replace(args.old_string, () => args.new_string)
    await writeFile(abs, updated, "utf8")
    markDirty(abs)
    const diff = gitDiffOne(ctx.cwd, abs)
    return `Edited ${args.path}: replaced ${args.replace_all ? occurrences : 1} occurrence(s)${diff ? "\n" + diff : ""}${await autoSyntaxCheck(abs)}`
  },
}

// ---------------------------------------------------------------- insert_after

export const insertAfterTool = {
  name: "insert_after",
  description: DESC("insert_after"),
  parameters: {
    type: "object",
    properties: {
      path: { type: "string", description: "File path" },
      after_line: { type: "number", description: "Line number to insert after (1-based). Takes priority over after_regex." },
      after_regex: { type: "string", description: "JavaScript regex to find the line to insert after (must match exactly one line)" },
      content: { type: "string", description: "Text to insert (with leading newline if you need a blank line)" },
    },
    required: ["path", "content"],
  },
  readonly: false,
  touchedPaths(args) { return args.path ? [args.path] : [] },
  async execute(args, ctx) {
    const abs = resolveInCwd(ctx, args.path)
    // Read-before-insert guard: after_line anchors are line numbers, and any
    // write since the last read made them stale. Refuse instead of silently
    // inserting at a drifted position (the failure mode that corrupted test
    // structure repeatedly). after_regex callers get the same gate — a stale
    // target line is just as wrong, and the rule is simpler to reason about.
    if (isDirty(abs)) {
      throw new Error(
        `${args.path} was modified since your last read — line numbers may be stale.\n` +
        `Read the file again (read tool) to refresh line numbers, then retry insert_after.`
      )
    }
    const text = normalizeEOL(await readFile(abs, "utf8"))
    const lines = text.split("\n")

    let targetLine
    if (args.after_line != null) {
      targetLine = args.after_line
      if (!Number.isInteger(targetLine)) {
        throw new Error(`after_line must be an integer, got: ${args.after_line}`)
      }
      if (targetLine < 1 || targetLine > lines.length) {
        throw new Error(`after_line ${targetLine} out of range (file has ${lines.length} lines)`)
      }
    } else if (args.after_regex) {
      let regex
      try {
        regex = new RegExp(args.after_regex)
      } catch (e) {
        throw new Error(`after_regex /${args.after_regex}/ is not a valid JavaScript regex: ${e.message}`, { cause: e })
      }
      const matches = []
      for (let i = 0; i < lines.length; i++) {
        if (regex.test(lines[i])) matches.push(i + 1)
      }
      if (matches.length === 0) throw new Error(`after_regex /${args.after_regex}/ matched no lines in ${args.path}`)
      if (matches.length > 1) throw new Error(`after_regex /${args.after_regex}/ matched ${matches.length} lines (${matches.slice(0, 5).join(", ")}${matches.length > 5 ? "…" : ""}); use a more specific pattern or after_line instead`)
      targetLine = matches[0]
    } else {
      throw new Error("Either after_line or after_regex is required")
    }

    lines.splice(targetLine, 0, args.content)
    const updated = lines.join("\n")
    await writeFile(abs, updated, "utf8")
    markDirty(abs)
    const diff = gitDiffOne(ctx.cwd, abs)
    return `Inserted after line ${targetLine} in ${args.path}${diff ? "\n" + diff : ""}${await autoSyntaxCheck(abs)}`
  },
}

// ---------------------------------------------------------------- hashline_edit

/**
 * Compute a 12-char hex SHA256 hash for a line (exact content, no trimming).
 * Used by both read (hashes=true) and hashline_edit for hash-based matching.
 */
export function hashLine(content) {
  return createHash("sha256").update(content).digest("hex").slice(0, 12)
}

export const hashlineEditTool = {
  name: "hashline_edit",
  description: DESC("hashline_edit"),
  parameters: {
    type: "object",
    properties: {
      path: { type: "string", description: "File path" },
      old_hashes: { type: "array", items: { type: "string" }, description: "SHA256 hashes (12 chars) of the lines to replace. Read the file with hashes=true first to obtain these hashes. Single line: pass 1 hash; multiple lines: pass the exact sequence of hashes." },
      new_content: { type: "string", description: "Replacement text (can span multiple lines)" },
    },
    required: ["path", "old_hashes", "new_content"],
  },
  readonly: false,
  touchedPaths(args) { return args.path ? [args.path] : [] },
  async execute(args, ctx) {
    const abs = resolveInCwd(ctx, args.path)
    if (!args.old_hashes?.length) throw new Error("old_hashes must not be empty — read the file with hashes=true to get line hashes")
    const content = normalizeEOL(await readFile(abs, "utf8"))
    const lines = content.split("\n")
    const fileHashes = lines.map((l) => hashLine(l))
    const target = args.old_hashes

    // Sliding-window match: find all occurrences of the hash sequence.
    // When multiple matches are found (e.g. empty lines), report positions so the
    // model can include more context lines (adjacent lines with unique hashes).
    const matches = []
    for (let i = 0; i <= fileHashes.length - target.length; i++) {
      let match = true
      for (let j = 0; j < target.length; j++) {
        if (fileHashes[i + j] !== target[j]) { match = false; break }
      }
      if (match) matches.push(i)
    }

    if (matches.length === 0) {
      // Help the model recover: show the current file hashes for context
      const maxShow = Math.min(fileHashes.length, 50)
      const hashDump = fileHashes.slice(0, maxShow).map((h, i) => `${h}  L${i + 1}: ${lines[i].slice(0, 80)}`).join("\n")
      const preview = target.join(" ")
      throw new Error(
        `Hash sequence not found in ${args.path}: ${preview}\n` +
        `The file may have been modified since you last read it. Current hashes (first ${maxShow} lines):\n${hashDump}`
      )
    }

    if (matches.length > 1) {
      const ctx = 2 // lines of surrounding context
      const detail = matches.map((m) => {
        const start = Math.max(0, m - ctx)
        const end = Math.min(lines.length, m + target.length + ctx)
        const preview = lines.slice(start, end).map((l, i) => {
          const ln = start + i + 1
          const marker = m <= ln - 1 && ln - 1 < m + target.length ? ">" : " "
          return `${marker} L${ln}: ${l.slice(0, 80)}`
        }).join("\n")
        return `  Match at line ${m + 1} (${target.length} line(s)):\n${preview}`
      }).join("\n\n")
      throw new Error(
        `Hash sequence matches ${matches.length} positions in ${args.path} — ambiguous.\n` +
        `Include more surrounding lines (unique-hash lines before/after the target) to disambiguate.\n\n` +
        `All matches with surrounding context:\n\n${detail}`
      )
    }

    const pos = matches[0]
    // Replace: remove old lines, insert new lines at the same position
    const newLines = args.new_content.split("\n")
    lines.splice(pos, target.length, ...newLines)
    const updated = lines.join("\n")
    await writeFile(abs, updated, "utf8")
    markDirty(abs)
    const diff = gitDiffOne(ctx.cwd, abs)
    return `Edited ${args.path}: replaced ${target.length} line(s) at L${pos + 1} with ${newLines.length} line(s)${diff ? "\n" + diff : ""}${await autoSyntaxCheck(abs)}`
  },
}

