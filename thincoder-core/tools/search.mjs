import {
  DESC,
  truncate,
  resolveInCwd,
  globToRegex,
  splitGlobPatterns,
  compileGlobMatchers,
  normalizeEOL,
} from "./shared.mjs";
// 排除名单单源（零依赖叶档 `../skip-dirs.mjs`——2026-10-27 四份名单合一）：旧名 `IGNORED_DIRS`
// 退场，本档三处直接引 `SKIP_DIRS`（一词一物）。
import { SKIP_DIRS } from "../skip-dirs.mjs";
// 过程档标记（TOOLS.md §6.28）：命中行的**档**在索引排除集内 ⇒ 行首逐字前缀。只加可读信息，不改命中集。
import { PROCESS_DOC_MARK, isProcessDocPath } from "./process-doc-mark.mjs";
import { readFile, readdir, stat, lstat } from "node:fs/promises";
import { join } from "node:path";

/** Escape a string for literal regex matching (grep literal=true). */
function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

// ---------------------------------------------------------------- glob

export const globTool = {
  name: "glob",
  description: DESC("glob"),
  parameters: {
    type: "object",
    properties: {
      pattern: { type: "string", description: "Glob pattern — supports **, *, ?, [..], {a,b} braces, and space-separated exclusion (\"**/*.js !test/**\")" },
      path: { type: "string", description: "Directory to search in (default cwd)" },
    },
    required: ["pattern"],
  },
  readonly: true,
  async execute(args, ctx) {
    const base = resolveInCwd(ctx, args.path ?? ".")
    // TOOLS.md §6.7 调用侧拆分（评审 #5 职责分层）：空格分隔 include !exclude 多模式在这里拆；
    // globToRegex 只收单个模式（数组由 compileGlobMatchers 收）。
    let match
    try {
      const parts = splitGlobPatterns(args.pattern)
      if (parts.length === 0) return "Error: pattern is required"
      match = compileGlobMatchers(parts).test
    } catch (e) {
      return `glob error: invalid pattern "${args.pattern}": ${e.message}`
    }
    const results = []
    // §2.5 #65 并入（VSC「路径不存在明确报错」）：目标路径缺失不再静默空清单。
    try {
      await stat(base)
    } catch {
      return `glob error: path not found: ${base}`
    }
    for await (const relPath of walkFiles(base)) {
      if (match(relPath)) {
        results.push(relPath)
        if (results.length >= 1000) break
      }
    }
    if (results.length === 0) return "(no matches)"
    return truncate(results.sort().join("\n"))
  },
}

/** Recursively traverse files, yield relative paths (skip SKIP_DIRS) */
async function* walkFiles(dir, rel = "") {
  let entries
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch {
    return
  }
  for (const e of entries) {
    // Skip ignored dirs AND symbolic links (symlinks to directories would cause infinite loops)
    if (e.isSymbolicLink()) continue
    if (e.isDirectory() && SKIP_DIRS.has(e.name)) continue
    const relPath = rel ? `${rel}/${e.name}` : e.name
    if (e.isDirectory()) {
      yield* walkFiles(join(dir, e.name), relPath)
    } else {
      yield relPath
    }
  }
}

// ---------------------------------------------------------------- grep

export const grepTool = {
  name: "grep",
  description: DESC("grep"),
  parameters: {
    type: "object",
    properties: {
      pattern: { type: "string", description: "Regular expression, or a literal string when literal=true" },
      path: { type: "string", description: "Directory or file to search (default cwd)" },
      glob: { type: "string", description: "Only search files matching this glob — supports **, *, ?, [..], {a,b} braces and space-separated exclusion (\"**/*.js !test/**\")" },
      ignoreCase: { type: "boolean", description: "Case-insensitive match (default false)" },
      literal: { type: "boolean", description: "Literal string match — no regex interpretation (default false)" },
      before: { type: "integer", description: "Lines of context to show before each match (grep -B). Default 0" },
      after: { type: "integer", description: "Lines of context to show after each match (grep -A). Default 0" },
    },
    required: ["pattern"],
  },
  readonly: true,
  async execute(args, ctx) {
    const base = resolveInCwd(ctx, args.path ?? ".")
    let regex
    try {
      const pat = args.literal ? escapeRegExp(String(args.pattern)) : args.pattern
      regex = new RegExp(pat, args.ignoreCase ? "i" : "")
    } catch (e) {
      throw new Error(`grep pattern /${args.pattern}/ is not a valid regex: ${e.message}`, { cause: e })
    }
    // §2.5 #65 并入（VSC「路径不存在明确报错」）：目标路径缺失不再静默 "(no matches)"。
    try {
      await lstat(base)
    } catch {
      return `grep error: path not found: ${base}`
    }
    // TOOLS.md §6.7 调用侧拆分：glob 参数支持空格分隔 include !exclude 多模式（include/exclude 求交）。
    let fileTest = null
    if (args.glob) {
      try {
        const parts = splitGlobPatterns(args.glob)
        if (parts.length > 0) fileTest = compileGlobMatchers(parts).test
      } catch (e) {
        throw new Error(`grep glob /${args.glob}/ is invalid: ${e.message}`, { cause: e })
      }
    }
    const before = Math.max(0, Math.floor(args.before ?? 0))
    const after = Math.max(0, Math.floor(args.after ?? 0))
    const wantCtx = before > 0 || after > 0
    const hits = [] // { file, line(1-based), text }
    const fileLines = new Map() // file -> string[] (cached only when context lines requested)

    async function search(file) {
      let content
      try {
        // Large file guard: skip files over 10MB to prevent OOM
        const fst = await stat(file)
        if (fst.size > 10_000_000) return
        content = normalizeEOL(await readFile(file, "utf8"))
      } catch {
        return // Skip unreadable files; binary files will be read as UTF-8 and searched (may produce garbled matches)
      }
      const lines = content.split("\n")
      if (wantCtx) fileLines.set(file, lines)
      for (let i = 0; i < lines.length; i++) {
        if (regex.test(lines[i])) {
          hits.push({ file, line: i + 1, text: lines[i] })
          if (hits.length >= 200) return
        }
      }
    }

    async function walk(target, rel) {
      if (hits.length >= 200) return
      // Use lstat to avoid following symlinks — prevents ./evil → /etc from making grep scan the entire system
      let s
      try { s = await lstat(target) } catch { return }
      if (!s.isDirectory()) {
        // rel 为相对搜索基的路径（排除前缀如 !test/** 必须按目录路径作用——不能用裸文件名）；
        // 单文件目标（path 指向文件）时 rel 为空 → 退化为按文件名过滤（既有语义）。
        if (!fileTest || fileTest(rel || target.split(/[\\/]/).pop())) await search(target)
        return
      }
      let entries
      try {
        entries = await readdir(target, { withFileTypes: true })
      } catch {
        return
      }
      for (const e of entries) {
        if (e.isDirectory() && SKIP_DIRS.has(e.name)) continue
        await walk(join(target, e.name), rel ? `${rel}/${e.name}` : e.name)
      }
    }

    await walk(base, "")
    if (hits.length === 0) return "(no matches)"

    // §6.28：一次调用一个档记忆表；命中行与上下文行都在原有文案前镀前缀（判据是**档**不是行——
    // 不标则同一档的上下文行读起来像普通档的内容）。打标在 `truncate` 之前，不新增截断点。
    const markCache = new Map()
    const mark = (f) => (isProcessDocPath(f, markCache) ? `${PROCESS_DOC_MARK} ` : "")

    // No context: keep original path:line: content format
    if (!wantCtx) {
      return truncate(hits.map((h) => `${mark(h.file)}${h.file}:${h.line}: ${h.text}`).join("\n"))
    }

    // With context: matching lines use ':', context lines use '-' (like ripgrep); overlapping ranges in same file are merged and de-duplicated
    const fileMatched = new Map() // file -> Set<line>
    for (const h of hits) {
      if (!fileMatched.has(h.file)) fileMatched.set(h.file, new Set())
      fileMatched.get(h.file).add(h.line)
    }
    const out = []
    for (const [file, matchedLines] of fileMatched) {
      const lines = fileLines.get(file) ?? []
      const lineSet = new Set()
      for (const ml of matchedLines) {
        for (let l = Math.max(1, ml - before); l <= Math.min(lines.length, ml + after); l++) lineSet.add(l)
      }
      for (const l of [...lineSet].sort((a, b) => a - b)) {
        const sep = matchedLines.has(l) ? ":" : "-"
        out.push(`${mark(file)}${file}${sep}${l}${sep} ${lines[l - 1]}`)
      }
    }
    return truncate(out.join("\n"))
  },
}

export const lsTool = {
  name: "ls",
  description: DESC("ls"),
  parameters: {
    type: "object",
    properties: {
      path: { type: "string", description: "Directory path (default cwd)" },
      filter: { type: "string", description: "Only list entries matching this glob (e.g. '*.mjs', '*test*')" },
    },
  },
  readonly: true,
  async execute(args, ctx) {
    const abs = resolveInCwd(ctx, args.path ?? ".")
    const filterRe = args.filter ? globToRegex(args.filter) : null
    let entries
    try {
      entries = await readdir(abs, { withFileTypes: true })
    } catch (e) {
      if (e.code === "ENOENT" || e.code === "ENOTDIR") throw new Error(`ls: ${args.path ?? "."} — ${e.code === "ENOTDIR" ? "not a directory" : "not found"}`, { cause: e })
      throw e
    }
    const rows = await Promise.all(
      entries
        .filter((e) => !filterRe || filterRe.test(e.name))
        .slice(0, 500)
        .map(async (e) => {
        const s = await stat(join(abs, e.name)).catch(() => null)
        const isDir = e.isDirectory()
        return {
          dir: isDir,
          name: e.name + (isDir ? "/" : ""),
          size: s?.size ?? 0,
          mtime: s ? s.mtime.toISOString().slice(0, 16).replace("T", " ") : "?",
        }
      }),
    )
    rows.sort((a, b) => (a.dir === b.dir ? a.name.localeCompare(b.name) : a.dir ? -1 : 1))
    if (rows.length === 0) return "(no entries)"
    const out = rows.map((r) => `${r.dir ? "d" : "-"}  ${r.name.padEnd(40)} ${String(r.size).padStart(10)}  ${r.mtime}`)
    return truncate(out.join("\n"))
  },
}
