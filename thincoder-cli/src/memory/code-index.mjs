/**
 * memory/code-index.mjs — code and document chunking, language detection, symbol extraction
 */

import { segmentCJK, CODE_EXTS, DOC_EXTS, SKIP_DIRS, BIG_FILE_LINES } from "./schema.mjs"

/** Infer file language by extension */
export function detectLanguage(filename) {
  const ext = filename.slice(filename.lastIndexOf(".")).toLowerCase()
  const map = {
    ".mjs": "javascript", ".js": "javascript", ".cjs": "javascript", ".jsx": "jsx",
    ".ts": "typescript", ".tsx": "tsx", ".mts": "typescript", ".cts": "typescript",
    ".py": "python", ".rs": "rust", ".go": "go", ".java": "java",
    ".c": "c", ".h": "c", ".cpp": "cpp", ".hpp": "cpp",
    ".rb": "ruby", ".swift": "swift", ".kt": "kotlin", ".dart": "dart", ".lua": "lua",
    ".cs": "csharp", ".fs": "fsharp", ".fsx": "fsharp",
    ".clj": "clojure", ".cljs": "clojure", ".ex": "elixir", ".exs": "elixir",
    ".erl": "erlang", ".hrl": "erlang", ".scala": "scala", ".groovy": "groovy",
    ".pl": "perl", ".pm": "perl", ".r": "r", ".jl": "julia", ".zig": "zig",
    ".ps1": "powershell", ".proto": "protobuf", ".graphql": "graphql", ".tf": "terraform", ".hcl": "hcl",
    ".sh": "bash", ".bash": "bash", ".sql": "sql",
    ".yaml": "yaml", ".yml": "yaml", ".toml": "toml", ".json": "json",
    ".css": "css", ".html": "html", ".vue": "vue", ".svelte": "svelte",
    ".md": "markdown", ".mdc": "markdown", ".mdx": "markdown", ".org": "org", ".wiki": "wiki", ".tex": "tex",
  }
  return map[ext] ?? ext.slice(1)
}

/**
 * Extract top-level symbol declarations (functions, classes, const exports, etc.)
 * from JS/TS files using regex. Returns [{ name, line, kind }].
 */
export function extractSymbols(lines, ext) {
  const jsish = new Set([".mjs", ".js", ".ts", ".jsx", ".tsx"])
  if (!jsish.has(ext)) return []

  const symbols = []
  const text = lines.join("\n")
  const re = /(?:export\s+)?(?:(?:async\s+)?function\s+(\w+)|class\s+(\w+)|(?:export\s+)?(?:const|let|var)\s+(\w+))/gm
  let m
  while ((m = re.exec(text))) {
    const name = m[1] || m[2] || m[3]
    if (!name || name[0] !== name[0].toLowerCase() && name.length < 2) continue
    const line = text.slice(0, m.index).split("\n").length
    symbols.push({ name, line, kind: m[1] ? "function" : m[2] ? "class" : "variable" })
  }
  return symbols
}

/** Extract top-level def/class from Python files. */
export function extractPySymbols(lines) {
  const symbols = []
  const re = /^(?:async\s+)?(?:def|class)\s+(\w+)/gm
  const text = lines.join("\n")
  let m
  while ((m = re.exec(text))) {
    symbols.push({ name: m[1], line: text.slice(0, m.index).split("\n").length, kind: text[m.index] === "c" ? "class" : "function" })
  }
  return symbols
}

/**
 * Split a file into code chunks. Small files become a single chunk;
 * large files are split by symbol, with inter-symbol content merged into the preceding symbol chunk.
 * Each chunk includes the JSDoc/docstring before its symbol to improve search quality.
 */
export function chunkCode(lines, filepath) {
  const ext = filepath.slice(filepath.lastIndexOf(".")).toLowerCase()
  const chunks = []

  if (lines.length <= BIG_FILE_LINES) {
    const doc = extractLeadingDoc(lines, 1, ext)
    const content = (doc ? doc + "\n" : "") + lines.join("\n").trimEnd()
    chunks.push({ name: filepath, line_start: 1, line_end: lines.length, content })
    return chunks
  }

  const symbols = ext === ".py" ? extractPySymbols(lines) : extractSymbols(lines, ext)
  if (symbols.length <= 1) {
    const doc = extractLeadingDoc(lines, 1, ext)
    const content = (doc ? doc + "\n" : "") + lines.join("\n").trimEnd()
    chunks.push({ name: filepath, line_start: 1, line_end: lines.length, content })
    return chunks
  }

  for (let i = 0; i < symbols.length; i++) {
    const sym = symbols[i]
    const start = sym.line
    const end = i + 1 < symbols.length ? symbols[i + 1].line - 1 : lines.length
    if (start > end) continue
    const doc = extractLeadingDoc(lines, start, ext)
    const body = lines.slice(start - 1, end).join("\n").trimEnd()
    const content = (doc ? doc + "\n" : "") + body
    if (!content) continue
    chunks.push({ name: `${filepath}:${sym.name}`, line_start: start, line_end: end, content })
  }
  return chunks
}

/**
 * Extract the JSDoc/docstring comment preceding a given line.
 * JS/TS: scan backwards for JSDoc block comments or consecutive // comment lines
 * Python: look for a """...""" docstring on the line after the symbol definition
 */
export function extractLeadingDoc(lines, lineNum, ext) {
  if (ext === ".py") {
    if (lineNum >= lines.length) return ""
    const next = lines[lineNum]
    const m = next?.match(/^\s*"""(.+?)"""\s*$/)
    if (m) return m[1].trim()
    if (/^\s*"""\s*$/.test(next)) {
      const parts = []
      for (let i = lineNum + 1; i < lines.length && i < lineNum + 8; i++) {
        if (/^\s*"""\s*$/.test(lines[i])) break
        parts.push(lines[i].trim())
      }
      const text = parts.join(" ").trim()
      return text.length > 0 && text.length < 300 ? text : ""
    }
    return ""
  }

  const jsish = new Set([".mjs", ".js", ".ts", ".jsx", ".tsx"])
  if (!jsish.has(ext)) return ""

  const parts = []
  let i = lineNum - 2
  if (i >= 0 && /^\s*\*\/\s*$/.test(lines[i])) {
    while (i >= 0) {
      const line = lines[i].trim()
      if (/^\s*\/\*\*/.test(line)) {
        parts.unshift(line.replace(/^\s*\/\*\*\s*/, "").replace(/\s*\*\/\s*$/, "").trim())
        break
      }
      parts.unshift(line.replace(/^\s*\*\s?/, "").trim())
      i--
    }
  } else {
    while (i >= 0 && /^\s*\/\//.test(lines[i])) {
      parts.unshift(lines[i].replace(/^\s*\/\/\s*/, "").trim())
      i--
    }
  }

  const text = parts.join(" ").trim()
  return text.length > 0 && text.length < 300 ? text : ""
}

/** Yield control to the event loop for one tick (allows keyboard input to be processed). Uses setImmediate for lower latency than setTimeout(0). */
export function yieldTick() {
  return new Promise((r) => setImmediate(r))
}

/** Index a single file: delete old chunks → chunk → insert new chunks */
export function _upsertCodeFile(memory, origin, rel, lines, lang, mtimeMs) {
  const chunks = chunkCode(lines, rel)
  memory.db.exec("BEGIN")
  try {
    memory.db.prepare(`DELETE FROM code_chunks WHERE origin = ? AND path = ?`).run(origin, rel)
    const insert = memory.db.prepare(`
      INSERT INTO code_chunks (origin, path, language, chunk_type, symbol_name, content, line_start, line_end, mtime_ms, seg_content)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    for (const c of chunks) {
      const isFile = c.name === rel
      insert.run(origin, rel, lang, isFile ? "file" : "symbol", isFile ? "" : c.name.slice(rel.length + 1), c.content, c.line_start, c.line_end, mtimeMs, segmentCJK(c.content))
    }
    memory.db.exec("COMMIT")
  } catch (e) {
    memory.db.exec("ROLLBACK")
    throw e
  }
}

/**
 * Split a markdown file by ## headings. Each ## section is indexed independently,
 * with the heading path as the heading label (e.g. "README.md > Deployment > Docker") for easy retrieval.
 */
export function chunkMarkdown(lines, filepath) {
  const chunks = []
  let start = 1
  let heading = filepath

  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^(#{1,4})\s+(.+)/)
    if (m) {
      if (i > start) {
        chunks.push({ heading, line_start: start, line_end: i, content: lines.slice(start - 1, i).join("\n").trimEnd() })
      }
      heading = `${filepath} > ${m[2].trim()}`
      start = i + 1
    }
  }
  if (start <= lines.length) {
    chunks.push({ heading, line_start: start, line_end: lines.length, content: lines.slice(start - 1).join("\n").trimEnd() })
  }
  return chunks.filter((c) => c.content)
}

/** Upsert a documentation file's chunks into the doc_chunks table within a transaction */
export function _upsertDocFile(memory, origin, rel, lines, mtimeMs) {
  const chunks = chunkMarkdown(lines, rel)
  const lang = rel.endsWith(".rst") ? "rst" : rel.endsWith(".adoc") ? "asciidoc" : rel.endsWith(".txt") ? "text" : "markdown"
  memory.db.exec("BEGIN")
  try {
    memory.db.prepare(`DELETE FROM doc_chunks WHERE origin = ? AND path = ?`).run(origin, rel)
    const insert = memory.db.prepare(`
      INSERT INTO doc_chunks (origin, path, language, heading, content, line_start, line_end, mtime_ms, seg_content)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    for (const c of chunks) {
      insert.run(origin, rel, lang, c.heading, c.content, c.line_start, c.line_end, mtimeMs, segmentCJK(c.content))
    }
    memory.db.exec("COMMIT")
  } catch (e) {
    memory.db.exec("ROLLBACK")
    throw e
  }
}
