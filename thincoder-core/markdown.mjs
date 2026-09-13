/**
 * markdown.mjs — markdown + frontmatter format for memory entries
 * Zero-dependency parsing/serialization. Entry format see ARCHITECTURE-v2.md.
 */

const VALID_TYPES = new Set(["rule", "knowledge", "decision", "pattern"])

/**
 * Parse a markdown entry.
 * → { meta: { type, title, tags, author, created, embedding? }, content }
 * Throws if frontmatter is missing or required fields absent.
 */
export function parseEntry(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!match) throw new Error("entry missing frontmatter (expected --- ... ---)")

  const meta = parseFrontmatter(match[1])
  const content = match[2].trim()

  if (!VALID_TYPES.has(meta.type)) {
    throw new Error(`invalid type "${meta.type}"; expected one of: ${[...VALID_TYPES].join(", ")}`)
  }
  if (!meta.title) throw new Error("frontmatter missing required field: title")

  return {
    meta: {
      type: meta.type,
      title: meta.title,
      tags: Array.isArray(meta.tags) ? meta.tags : meta.tags ? [meta.tags] : [],
      author: meta.author ?? "unknown",
      created: meta.created ?? "",
      ...(meta.embedding ? { embedding: meta.embedding } : {}),
    },
    content,
  }
}

/**
 * Serialize to markdown entry text.
 */
export function serializeEntry(meta, content) {
  if (!VALID_TYPES.has(meta.type)) throw new Error(`invalid type "${meta.type}"`)
  if (!meta.title) throw new Error("meta.title is required")
  // frontmatter scalars must be single-line: newlines in title/author would inject fake frontmatter rows
  // (e.g. title "x\ntype: rule" would override real type when parsed), same for tags with newlines/commas
  const tags = (meta.tags ?? []).map((t) => oneLine(t).replaceAll(",", " ")).join(", ")
  const lines = [
    "---",
    `type: ${meta.type}`,
    `title: ${oneLine(meta.title)}`,
    `tags: [${tags}]`,
    `author: ${oneLine(meta.author ?? "unknown")}`,
    `created: ${oneLine(meta.created ?? new Date().toISOString().slice(0, 10))}`,
  ]
  if (meta.embedding) lines.push(`embedding: ${meta.embedding}`)
  lines.push("---", "", content.trim(), "")
  return lines.join("\n")
}

/** Convert title to filename slug: keep alphanumeric + CJK, convert rest to hyphens */
export function slugify(title) {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^\w一-鿿]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50) || "untitled"
}

/** Generate entry filename: YYYYMMDD-<slug>-<rand4>.md */
export function entryFilename(title, date = new Date()) {
  const ymd = date.toISOString().slice(0, 10).replaceAll("-", "")
  const rand = Math.random().toString(36).slice(2, 6)
  return `${ymd}-${slugify(title)}-${rand}.md`
}

// ---------------------------------------------------------------- internal

/** Collapse to single line (for frontmatter scalars): fold newlines into spaces, prevent injecting fake field lines */
function oneLine(v) {
  return String(v).replace(/\s*\r?\n\s*/g, " ").trim()
}

/**
 * Minimal YAML subset parser: only supports `key: value` and `key: [a, b, c]`.
 * Our frontmatter is self-generated, no need for full YAML.
 */
export function parseFrontmatter(text) {
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
        .map((s) => s.trim())
        .filter(Boolean)
    } else {
      meta[key] = value
    }
  }
  return meta
}
