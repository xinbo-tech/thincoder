/**
 * rules.mjs — stream rule discovery from .thincoder/rules/*.md
 *
 * Rule file format (markdown + YAML frontmatter):
 *   ---
 *   pattern: "console\\.log"
 *   action: abort        # "abort"|"warn" (default: "warn")
 *   repeat: once         # "once"|"always" (default: "always")
 *   ---
 *   Use the project logger instead of console.log.
 *
 * The body becomes the rule message; if empty, falls back to `message` frontmatter.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"
import { parseFrontmatter } from "./markdown.mjs"

/**
 * Scan `.thincoder/rules/` in the project root for `.md` rule files.
 * Returns an array of rule objects compatible with config.streamRules format.
 */
export function discoverRules(projectRoot) {
  const rulesDir = join(projectRoot, ".thincoder", "rules")
  if (!existsSync(rulesDir)) return []

  const rules = []
  let entries
  try { entries = readdirSync(rulesDir) } catch { return rules }

  for (const f of entries) {
    if (!f.endsWith(".md")) continue
    try {
      const text = readFileSync(join(rulesDir, f), "utf8")
      const fm = text.match(/^---\r?\n([\s\S]*?)\r?\n---/)
      if (!fm) continue
      const meta = parseFrontmatter(fm[1])
      const body = text.slice(fm[0].length).trim()
      if (!meta.pattern) continue
      // Strip surrounding quotes from frontmatter values (parseFrontmatter returns raw)
      const pattern = meta.pattern.replace(/^"(.*)"$/s, "$1").replace(/^'(.*)'$/s, "$1")
      const message = (meta.message || "").replace(/^"(.*)"$/s, "$1").replace(/^'(.*)'$/s, "$1")

      rules.push({
        pattern,
        message: body || message || "",
        action: meta.action || "warn",
        repeat: meta.repeat || "always",
        name: f.replace(/\.md$/, ""),
      })
    } catch { /* skip malformed rule files silently */ }
  }
  return rules
}
