/**
 * file-links.mjs — extract workspace-real file paths from tool output so the
 * webview can render them as clickable links. Only paths that EXIST on disk
 * (relative to cwd, or absolute) become links — no false positives from URLs /
 * log noise / version numbers (the existence check is the final guard).
 */
import { existsSync, statSync } from "node:fs"
import { resolve, isAbsolute } from "node:path"

// Path token: optional Windows drive prefix, path chars, a dot-extension, and an
// optional :line / :line:col suffix. Group 1 = the path (for fs), group 2 = line.
// The full match (m[0], with the line suffix) is what the webview wraps.
const PATH_TOKEN_RE = /((?:[A-Za-z]:)?[~./\\\w][\w./\\~-]*\.\w{1,10})(?::(\d+)(?::\d+)?)?/g

const MAX_LINKS = 50

/**
 * @returns {{ raw: string, path: string, line: number|null }[]} — deduped,
 *   capped, verified-existing file references found in `text`.
 */
export function extractFileLinks(cwd, text) {
  if (!text || typeof text !== "string") return []
  const links = []
  const seen = new Set()
  for (const m of text.matchAll(PATH_TOKEN_RE)) {
    const pathPart = m[1]
    // Scheme-relative URL residue ("//example.com/a.png") — never a workspace path
    if (pathPart.startsWith("//") || pathPart.startsWith("\\\\")) continue
    const line = m[2] ? Number(m[2]) : null
    const abs = isAbsolute(pathPart) ? pathPart : resolve(cwd, pathPart)
    const key = abs + ":" + (line ?? "")
    if (seen.has(key)) continue
    try {
      if (!existsSync(abs) || !statSync(abs).isFile()) continue
    } catch { continue }
    seen.add(key)
    links.push({ raw: m[0], path: abs, line })
    if (links.length >= MAX_LINKS) break
  }
  return links
}
