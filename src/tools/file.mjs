import {
  DESC,
  truncate,
  MAX_READ_LINES,
  gitDiffOne,
  autoSyntaxCheck,
  resolveInCwd,
  resolveExternal,
  normalizeEOL,
  detectFileEol,
  joinWithEol,
  majorityEol,
  findCandidates,
  FFFD_WARNING,
} from "./shared.mjs";
import { applyEditBatch } from "./edit-batch.mjs";
import { specForModel } from "../config.mjs";
import { createHash } from "node:crypto";
import { mkdir, readFile, stat, writeFile, unlink } from "node:fs/promises";
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

// 2026-08-31 工具顺手度优化（用户批准）：写入工具记录受影响行范围——insert_after
// 精确判定：after_line 在未受影响区（< lastWrite.startLine）→ 行号未漂移 → 允许
// （消掉"我写的文件被当外部修改、必须重 read"的摩擦）；受影响区内 → 拒绝（护栏保留）；
// write 全文重写 → 全文件受影响，任何 after_line 拒绝。
const lastWrites = new Map() // abs → { type: 'write'|'edit'|'insert', startLine, shift }
export function recordWrite(abs, write) {
  lastWrites.set(abs, write)
  dirtyPaths.delete(abs) // 本 session 写入——等效于刚 read 过（快照在 lastWrites）
}
export function lastWriteOf(abs) { return lastWrites.get(abs) }
export function clearLastWrite(abs) { lastWrites.delete(abs) }

/** 2026-08-31 工具顺手度（用户批准"可以啊"）：写入工具返回带上下文窗口——
 *  模型拿到的不只是"inserted at L395"，而是"L395 这行是什么内容"——下次再操作时
 *  能自检"我的行号 vs 实际内容"是否匹配，匹配不上 = 行号漂了，先 read——
 *  死循环就断了（根因：模型对行号锚点的"新鲜度"没有感知——数字本身不携带语义）。
 *  write 全文重写跳过（无行号锚点——模型刚写的知道内容）。
 *  edit-batch.mjs（数组形态）复用——导出仅供内部模块，非公共 API。 */
export async function appendWriteContext(abs, writeLine, baseResult) {
  const content = normalizeEOL(await readFile(abs, "utf8"))
  const lines = content.split("\n")
  const start = Math.max(1, writeLine - 3)
  const end = Math.min(lines.length, writeLine + 3)
  const ctxLines = []
  for (let i = start; i <= end; i++) {
    const marker = i === writeLine ? "→" : " "
    ctxLines.push(`${marker} L${i}\t${lines[i - 1]}`)
  }
  return `${baseResult}\ncontext (L${start}-L${end}):\n${ctxLines.join("\n")}`
}

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
    clearLastWrite(abs) // 2026-08-31：read 同时清写入快照（新视图以 read 为准）
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
    // EOL semantics: overwriting an existing file restores ITS original EOL style (F1);
    // a new file follows the directory's majority style, defaulting to LF (F2).
    const prev = st ? await readFile(abs, "utf8").catch(() => null) : null
    const eol = prev != null ? detectFileEol(prev) : majorityEol(dirname(abs))
    const content = eol === "\r\n" ? normalizeEOL(args.content).replace(/\n/g, "\r\n") : args.content
    await writeFile(abs, content, "utf8")
    recordWrite(abs, { type: "write", startLine: 1, shift: 0 }) // 全文重写——全文件受影响
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
      edits: {
        type: "array",
        description: "2026-08-31 工具顺手度：一次多文件原子替换——任一失败全不写（先全量检查所有替换可执行）。与 path/old_string/new_string 互斥。",
        items: {
          type: "object",
          properties: {
            path: { type: "string" },
            old_string: { type: "string" },
            new_string: { type: "string" },
            replace_all: { type: "boolean" },
          },
          required: ["path", "old_string", "new_string"],
        },
      },
    },
    required: [],
  },
  readonly: false,
  touchedPaths(args) {
    if (args.edits) return args.edits.map((e) => e.path).filter(Boolean)
    return args.path ? [args.path] : []
  },
  async execute(args, ctx) {
    // 2026-08-31 工具顺手度（用户批准）：数组形态——一次多文件原子替换
    // （应用逻辑在 edit-batch.mjs——2026-09-01 拆出，500 行硬限，先例 git-ext.mjs）
    if (args.edits) return applyEditBatch(args, ctx)

    // 单文件（现状路径）
    const abs = resolveInCwd(ctx, args.path)
    if (!args.old_string) {
      throw new Error("old_string must not be empty (empty string matches everywhere and would corrupt the file)")
    }
    // #5（2026-09-01 交付评审尾巴）：new_string 非字符串（含 undefined）在写盘前拒绝——
    // 原缺陷：replace 回调返回 undefined 被字符串化成 "undefined" 写入盘，随后
    // args.new_string.split 才 TypeError——文件已损坏 + 错误信息不知所云。
    if (typeof args.new_string !== "string") {
      throw new Error(
        `new_string must be a string${args.new_string === undefined ? " (missing)" : ` (got ${typeof args.new_string})`} — nothing written`,
      )
    }
    const raw = await readFile(abs, "utf8")
    const content = normalizeEOL(raw)
    const occurrences = content.split(args.old_string).length - 1
    if (occurrences === 0) {
      // Give clues to help the model locate: first-line preview + common causes
      const preview = args.old_string.slice(0, 100).split("\n")[0]
      // Similarity candidates (LCS, line-level, top 3, score ≥ 0.5) — turns the
      // "not found" black box into a pointer at the most likely intended line.
      // Multi-line old_string: only its first line is scored (marked accordingly).
      const cands = findCandidates(content.split("\n"), args.old_string)
      let candText = ""
      if (cands.length > 0) {
        const header = args.old_string.includes("\n")
          ? `  similar lines (old_string line 1: "${args.old_string.split("\n")[0].slice(0, 80)}"):`
          : "  similar lines:"
        candText = "\n" + header + "\n" + cands.map((c) => `    L${c.line}: ${c.preview} (${Math.round(c.score * 100)}%)`).join("\n")
      }
      throw new Error(
        `old_string not found in ${args.path}\n` +
        `  searched: "${preview}${args.old_string.length > 100 ? "…" : ""}"\n` +
        (lastWriteOf(abs)?.type === "write"
          ? `  hints: this file was modified since your last read (write 全文重写后内容全变) — re-read it to refresh your copy of the content, then retry\n`
          : isDirty(abs)
            ? `  hints: this file was modified since your last read (a prior write marked it dirty) — re-read it to refresh your copy of the content, then retry\n`
            : `  hints: whitespace mismatch? file already changed? try reading the file first\n`) +
        candText
      )
    }
    if (occurrences > 1 && !args.replace_all) {
      throw new Error(`old_string matches ${occurrences} times in ${args.path}; provide more context or set replace_all`)
    }
    const updated = args.replace_all
      ? content.split(args.old_string).join(args.new_string)
      // Functional replacement: avoid $-substitution patterns in new_string (match string / backreference) being expanded
      : content.replace(args.old_string, () => args.new_string)
    // Write back in the file's ORIGINAL EOL style (first-newline rule) — a CRLF
    // file must not come back as LF (that rewrites every line in the diff).
    // normalizeEOL first: new_string may carry \r\n (e.g. pasted from a raw CRLF
    // read); without normalizing, split leaves stray \r and CRLF join makes \r\r\n.
    await writeFile(abs, joinWithEol(normalizeEOL(updated).split("\n"), raw), "utf8")
    // 2026-08-31 工具顺手度：记录受影响区（替换首行 + 行数差）——insert_after 精确判定
    const matchIdx = content.indexOf(args.old_string)
    const editStartLine = matchIdx >= 0 ? content.slice(0, matchIdx).split("\n").length : 1
    const lineShift = args.new_string.split("\n").length - args.old_string.split("\n").length
    recordWrite(abs, { type: "edit", startLine: editStartLine, shift: lineShift })
    const diff = gitDiffOne(ctx.cwd, abs)
    const baseResult = `Edited ${args.path}: replaced ${args.replace_all ? occurrences : 1} occurrence(s)${diff ? "\n" + diff : ""}${await autoSyntaxCheck(abs)}`
    return await appendWriteContext(abs, editStartLine, baseResult)
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
    // 2026-08-31 工具顺手度（用户批准）：判定精确化——本 session 写入工具记录受影响区
    // （lastWrite），after_line 在未受影响区（<= startLine）→ 行号未漂移 → 允许
    // （消掉"我写的文件被当外部修改"的摩擦）；受影响区内/write 全文重写 → 拒绝。
    const lw = lastWriteOf(abs)
    if (lw && args.after_line != null) {
      if (lw.type === "write") {
        throw new Error(
          `${args.path} 刚被 write 全文重写（was modified since your last read）——任何行号都可能漂移，必须重 read。`
        )
      }
      if (args.after_line > lw.startLine) {
        throw new Error(
          `${args.path} 的 after_line ${args.after_line} 在上次写入（L${lw.startLine}）之后——` +
          `行号已漂移 ${lw.shift >= 0 ? "+" : ""}${lw.shift}，请用新行号或先 read。`
        )
      }
      // after_line <= startLine → 行号未漂移 → 允许
    } else if (isDirty(abs)) {
      throw new Error(
        `${args.path} was modified since your last read — line numbers may be stale.\n` +
        `Read the file again (read tool) to refresh line numbers, then retry insert_after.`
      )
    }
    const raw = await readFile(abs, "utf8") // original bytes — EOL detection needs the file's real line endings
    const text = normalizeEOL(raw)
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

    lines.splice(targetLine, 0, normalizeEOL(args.content))
    // Write back in the file's ORIGINAL EOL style (review R9#2: same bug class as
    // edit — a CRLF file must not silently become LF here either).
    const updated = joinWithEol(lines, raw)
    await writeFile(abs, updated, "utf8")
    recordWrite(abs, { type: "insert", startLine: targetLine, shift: normalizeEOL(args.content).split("\n").length })
    const diff = gitDiffOne(ctx.cwd, abs)
    const baseResult = `Inserted after line ${targetLine} in ${args.path}${diff ? "\n" + diff : ""}${await autoSyntaxCheck(abs)}`
    return await appendWriteContext(abs, targetLine + 1, baseResult)
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
    const raw = await readFile(abs, "utf8")
    const content = normalizeEOL(raw)
    // Encoding-corruption probe: U+FFFD means the file is not clean UTF-8 — hash
    // addressing may be unreliable. Warn (never block).
    const corrupted = content.includes("\uFFFD")
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
        `The file may have been modified since you last read it. Current hashes (first ${maxShow} lines):\n${hashDump}` +
        (corrupted ? `\n${FFFD_WARNING}` : "")
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
    const newLines = normalizeEOL(args.new_content).split("\n") // normalize: CRLF in new_content would join into \r\r\n
    lines.splice(pos, target.length, ...newLines)
    // Write back in the file's original EOL style (same rule as edit / apply_patch).
    const updated = joinWithEol(lines, raw)
    await writeFile(abs, updated, "utf8")
    recordWrite(abs, { type: "edit", startLine: pos + 1, shift: newLines.length - target.length })
    const diff = gitDiffOne(ctx.cwd, abs)
    const baseResult = `Edited ${args.path}: replaced ${target.length} line(s) at L${pos + 1} with ${newLines.length} line(s)${diff ? "\n" + diff : ""}${await autoSyntaxCheck(abs)}${corrupted ? `\n${FFFD_WARNING}` : ""}`
    return await appendWriteContext(abs, pos + 1, baseResult)
  },
}

