/**
 * memory.mjs — File-based memory system for ThinCoder VS Code
 *
 * Entries are Markdown files with YAML frontmatter in .thincoder/memory/.
 * Format matches the CLI (thincoder/src/markdown.mjs):
 *
 *   ---
 *   type: rule
 *   title: My convention
 *   tags: [coding, style]
 *   author: unknown
 *   created: 2026-07-29
 *   ---
 *   Content goes here...
 *
 * Filename: YYYYMMDD-<slug>-<rand4>.md
 *
 * Backward compatible: also reads legacy .json files (written by older VSCode versions).
 *
 * Zero dependencies — uses only node:fs sync APIs.
 */

import { readFileSync, existsSync, readdirSync, mkdirSync } from "node:fs"
import { join } from "node:path"

export const VALID_TYPES = new Set(["rule", "knowledge", "decision", "pattern"])
export const VALID_SCOPES = new Set(["personal", "project"])

/** Storage root: cwd/.thincoder/memory */
export function memoryDir(cwd) {
  return join(cwd, ".thincoder", "memory")
}

/** Storage directory for a scope: memoryDir(cwd)/<scope> — scope validation is directory-based (NF3). */
export function scopeDir(cwd, scope) {
  return join(memoryDir(cwd), scope)
}

export function ensureDir(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
}

// ─── Filename ──────────────────────────────────────────────────

/** Convert title to filename slug: keep alphanumeric + CJK, convert rest to hyphens */
function slugify(title) {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^\w一-鿿]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50) || "untitled"
}

/** Generate entry filename: YYYYMMDD-<slug>-<rand4>.md */
export function entryFilename(title) {
  const ymd = new Date().toISOString().slice(0, 10).replaceAll("-", "")
  const rand = Math.random().toString(36).slice(2, 6)
  return `${ymd}-${slugify(title)}-${rand}.md`
}

// ─── Markdown serialization ─────────────────────────────────────

/** Collapse to single line (prevent frontmatter injection via newlines) */
function oneLine(v) {
  return String(v).replace(/\s*\r?\n\s*/g, " ").trim()
}

/**
 * Serialize entry to markdown with YAML frontmatter.
 * Format identical to thincoder CLI (thincoder/src/markdown.mjs).
 */
export function serializeEntry({ type, title, content, tags }) {
  const tagList = (tags || "").trim().split(/\s+/).filter(Boolean)
  const tagStr = tagList.map(t => oneLine(t).replaceAll(",", " ")).join(", ")
  return [
    "---",
    `type: ${type}`,
    `title: ${oneLine(title)}`,
    `tags: [${tagStr}]`,
    `author: unknown`,
    `created: ${new Date().toISOString().slice(0, 10)}`,
    "---",
    "",
    content.trim(),
    "",
  ].join("\n")
}

// ─── Markdown parsing ───────────────────────────────────────────

/**
 * Minimal YAML frontmatter parser.
 * Only supports `key: value` and `key: [a, b, c]` — our own format,
 * no need for full YAML. Identical to thincoder CLI.
 */
function parseFrontmatter(text) {
  const meta = {}
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^(\w[\w-]*)\s*:\s*(.*)$/)
    if (!m) continue
    const [, key, raw] = m
    const value = raw.trim()
    if (value.startsWith("[") && value.endsWith("]")) {
      meta[key] = value
        .slice(1, -1)
        .split(",")
        .map(s => s.trim())
        .filter(Boolean)
    } else {
      meta[key] = value
    }
  }
  return meta
}

/**
 * Parse a markdown entry. Returns { meta, content } or null on failure.
 */
export function parseEntry(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!match) return null
  const meta = parseFrontmatter(match[1])
  const content = match[2].trim()
  if (!VALID_TYPES.has(meta.type) || !meta.title) return null
  // tags may be array (from parser) or string; normalize to space-separated string
  const tags = Array.isArray(meta.tags) ? meta.tags.join(" ") : (meta.tags || "")
  return {
    type: meta.type,
    title: meta.title,
    content,
    tags,
    created: meta.created || "",
  }
}

// ─── File I/O ────────────────────────────────────────────────────

/** Read all memory entries (both .md and legacy .json). */
export function readAllEntries(dir) {
  if (!existsSync(dir)) return []
  const entries = []
  try {
    for (const file of readdirSync(dir)) {
      try {
        const raw = readFileSync(join(dir, file), "utf8")
        if (file.endsWith(".md")) {
          const parsed = parseEntry(raw)
          if (parsed) entries.push({ ...parsed, _file: file })
        } else if (file.endsWith(".json")) {
          // Legacy JSON format — read for backward compatibility
          const parsed = JSON.parse(raw)
          if (VALID_TYPES.has(parsed.type) && parsed.title) {
            entries.push({
              type: parsed.type,
              title: parsed.title,
              content: parsed.content || "",
              tags: parsed.tags || "",
              created: (parsed.created_at || parsed.updated_at || "").slice(0, 10),
              _file: file,
            })
          }
        }
      } catch { /* skip corrupted files */ }
    }
  } catch { /* skip unreadable dir */ }
  return entries
}

/** Read all memory entries: legacy root plus every scope subdirectory (search surface).
 *  Entries are tagged _scope ("root" | "personal" | "project") so scope-filtered
 *  actions (list/delete batch) can restrict without re-reading. */
export function readAllScopeEntries(cwd) {
  const out = []
  for (const e of readAllEntries(memoryDir(cwd))) out.push({ ...e, _scope: "root" })
  for (const scope of VALID_SCOPES) {
    for (const e of readAllEntries(scopeDir(cwd, scope))) out.push({ ...e, _scope: scope })
  }
  return out
}

// ─── Tokenization & scoring ─────────────────────────────────────

function tokenizeQuery(query) {
  const stopwords = new Set([
    "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "can", "shall", "to", "of", "in", "for",
    "on", "with", "at", "by", "from", "as", "into", "through", "during",
    "before", "after", "above", "below", "between", "and", "but", "or",
    "nor", "not", "so", "yet", "both", "either", "neither", "each",
    "every", "all", "any", "few", "more", "most", "other", "some",
    "such", "no", "only", "own", "same", "than", "too", "very",
    "just", "about", "also", "it", "its", "this", "that", "these",
    "those", "i", "me", "my", "we", "our", "you", "your", "he",
    "she", "him", "her", "they", "them", "their", "what", "which",
    "who", "whom", "when", "where", "why", "how",
    // Chinese stopwords
    "的", "了", "是", "在", "我", "有", "和", "就", "不", "人", "都", "一",
    "一个", "这", "那", "也", "要", "会", "可", "没", "到", "说", "去",
    "你", "他", "她", "它", "们", "吗", "吧", "呢", "啊", "哦", "嗯",
  ])
  const tokens = query
    .toLowerCase()
    .split(/[\s,.;:()[\]{}"'`!@#$%^&*+=|\\<>?/~]+/)
    .filter(w => w.length > 1 && !stopwords.has(w))

  // De-duplicate
  const result = [...new Set(tokens)]

  // CJK fallback: if query has CJK chars but tokenization produced ≤ 2 tokens,
  // also include CJK bigrams and individual chars for better matching
  const hasCJK = /[\u4e00-\u9fff\u3400-\u4dbf]/u
  if (result.length <= 2 && hasCJK.test(query)) {
    const chars = query.replace(/[^\u4e00-\u9fff\u3400-\u4dbf]/gu, "")
    for (let i = 0; i < chars.length; i++) {
      result.push(chars[i])
      if (i < chars.length - 1) result.push(chars[i] + chars[i + 1])
    }
  }

  return [...new Set(result.filter(w => w.length > 1 || hasCJK.test(w)))]
}

/**
 * Score an entry against keywords.
 * title match = 3pts, tag match = 2pts, content match = 1pt
 */
function scoreEntry(entry, keywords) {
  if (!keywords.length) return 0
  const title = (entry.title || "").toLowerCase()
  const content = (entry.content || "").toLowerCase()
  const tags = (entry.tags || "").toLowerCase()
  let score = 0
  for (const kw of keywords) {
    if (title.includes(kw)) score += 3
    if (tags.includes(kw)) score += 2
    if (content.includes(kw)) score += 1
  }
  return score
}
export { tokenizeQuery, scoreEntry }

/**
 * Search memory entries. Returns [{ type, title, content, tags, score }] sorted by relevance.
 * Used by both the memory tool search action and automatic context injection.
 * scope (optional): restrict to one scope's directory (personal/project).
 */
export function search(cwd, query, { limit = 5, scope = null } = {}) {
  if (!existsSync(memoryDir(cwd))) return []

  const entries = scope
    ? readAllEntries(scopeDir(cwd, scope)).map((e) => ({ ...e, _scope: scope }))
    : readAllScopeEntries(cwd)
  if (entries.length === 0) return []

  const keywords = tokenizeQuery(query)
  if (keywords.length === 0) {
    const raw = query.toLowerCase().split(/[\s,.;:()[\]{}"'`!@#$%^&*+=|\\<>?/~]+/).filter(w => w.length > 1)
    if (raw.length === 0) {
      entries.sort((a, b) => (b.created || "").localeCompare(a.created || ""))
      return entries.slice(0, limit)
    }
    keywords.push(...raw.slice(0, 6))
  }

  const scored = entries.map(e => ({
    ...e,
    score: scoreEntry(e, keywords),
  }))
  scored.sort((a, b) => b.score - a.score)
  return scored.filter(s => s.score > 0).slice(0, limit)
}
