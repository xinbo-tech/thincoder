/**
 * rules.mjs — load scoped project rules from `.cursor/rules/` (VSC-only face).
 *
 * Face definition (authoritative) = `docs/core/design/WORKSPACE.md` §2.3: `.cursor/rules/*`
 * is the VSC end's SCOPE face; `.thincoder/rules/*` is the STREAM face (both ends — read by
 * the core `thincoder-core/rules.mjs` + consumed via `chat()`). This loader reads the scope
 * face only — never `.thincoder/rules/` (one thread, one semantic).
 *
 * Format: Markdown files (`.md` / `.mdc`) with optional YAML frontmatter.
 *
 *   ---
 *   globs: "src/components/**"
 *   alwaysApply: true
 *   ---
 *   Always use React.memo() for top-level component exports.
 *
 * Three-way classification (ordered, mutually exclusive — single consumer
 * `src/agent/rules-face.mjs`):
 *   ① `alwaysApply: true` ⇒ always-rules (every run — injected into the system prompt tail block)
 *   ② `globs` present ⇒ scoped rules (JIT reminder before a matching-path tool dispatch)
 *   ③ neither `globs` nor `description` ⇒ always-rules
 *   ④ `description` only (Cursor's agent-requested semantic) ⇒ never injected here (registered)
 */

import { readdirSync, readFileSync, existsSync } from "node:fs"
import { join } from "node:path"

/**
 * Load all scoped rules from `.cursor/rules/`.
 * Returns [{ name, content, globs, alwaysApply, description, source }, ...]
 */
export function loadRules(cwd) {
  const dir = join(cwd, ".cursor/rules")
  if (!existsSync(dir)) return []
  const results = []
  let entries
  try { entries = readdirSync(dir, { withFileTypes: true }) } catch { return results }
  for (const e of entries) {
    if (!e.isFile() || e.name.startsWith(".") || (!e.name.endsWith(".md") && !e.name.endsWith(".mdc"))) continue
    try {
      const raw = readFileSync(join(dir, e.name), "utf8").trim()
      if (raw.length === 0) continue
      const { content, meta } = parseFrontmatter(raw)
      results.push({
        name: e.name.replace(/\.(md|mdc)$/, ""),
        content,
        globs: meta.globs ? String(meta.globs).split(/[;\n]/).map(s => s.trim()).filter(Boolean) : null,
        alwaysApply: meta.alwaysApply === "true",
        description: meta.description ? String(meta.description) : null,
        source: ".cursor/rules",
      })
    } catch { /* skip unreadable */ }
  }
  return results
}

/**
 * Split frontmatter block from content.
 * Frontmatter starts and ends with `---` on its own line.
 */
function parseFrontmatter(raw) {
  const m = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/)
  if (!m) return { content: raw, meta: {} }

  const front = m[1]
  const content = raw.slice(m[0].length).trim()
  const meta = {}
  for (const line of front.split("\n")) {
    const kv = line.match(/^(\w[\w-]*)\s*:\s*(.+?)\s*$/)
    if (kv) {
      const key = kv[1]
      let val = kv[2]
      // Strip surrounding quotes
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1)
      }
      meta[key] = val
    }
  }
  return { content, meta }
}

/**
 * Check if a file path matches any of the given glob patterns.
 * Supports simple ** and * wildcards (no full glob library).
 */
export function matchesGlob(filePath, patterns) {
  if (!patterns || patterns.length === 0) return false
  // Normalize to forward slashes
  const normalized = filePath.replace(/\\/g, "/")
  for (const pat of patterns) {
    if (simpleGlobMatch(normalized, pat.replace(/\\/g, "/"))) return true
  }
  return false
}

/** Simple glob match: supports *, **, ? */
function simpleGlobMatch(path, pattern) {
  // Convert glob pattern to regex
  let regexStr = ""
  let i = 0
  while (i < pattern.length) {
    if (pattern[i] === "*" && pattern[i + 1] === "*") {
      // ** matches anything including /
      regexStr += ".*"
      i += 2
      // Skip trailing /
      if (pattern[i] === "/") i++
    } else if (pattern[i] === "*") {
      regexStr += "[^/]*"
      i++
    } else if (pattern[i] === "?") {
      regexStr += "[^/]"
      i++
    } else {
      // Escape regex special chars
      const c = pattern[i]
      if (".+^${}()|[]\\".includes(c)) regexStr += "\\" + c
      else regexStr += c
      i++
    }
  }
  return new RegExp("^" + regexStr + "$").test(path)
}
