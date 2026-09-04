/**
 * search.mjs — File search tools: glob, grep
 */

import * as vscode from "vscode"
import { readFile } from "node:fs/promises"
import { resolvePath } from "./shared.mjs"

/** Escape a string for literal regex matching (grep literal=true). */
function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

export const globTool = {
  name: "glob",
  readonly: true,
  description:
    "Find files by glob pattern. Returns matching paths. Supports ** for recursive matching. Use this to discover file structure; use grep to search file contents.\n" +
    "Parameters:\n" +
    "- pattern (required): Glob pattern\n" +
    "- path: Directory to search in (default workspace root)",
  parameters: {
    type: "object",
    properties: {
      pattern: { type: "string", description: "Glob pattern" },
      path: { type: "string", description: "Directory to search in" },
    },
    required: ["pattern"],
  },
  async execute({ pattern, path: dir }, ctx) {
    const base = dir ? resolvePath(dir, ctx.cwd) : ctx.cwd
    const uris = await vscode.workspace.findFiles(
      new vscode.RelativePattern(base, pattern),
      "**/node_modules/**"
    )
    if (uris.length === 0) return "(no matches)"
    return uris.slice(0, 200).map((u) => vscode.workspace.asRelativePath(u)).join("\n")
  },
}

export const grepTool = {
  name: "grep",
  readonly: true,
  description:
    "Search file contents with a regex. Returns matching lines.\n" +
    "Route to grep instead of bash: `findstr /c:\"pat\" file` / `grep -rn pat .` → grep. Searching file contents is a read — never shell out for it.\n" +
    "Parameters:\n" +
    "- pattern (required): JavaScript regular expression, or a literal string when literal=true\n" +
    "- path: Directory or file to search (default workspace root)\n" +
    "- glob: Only search files matching this glob\n" +
    "- ignoreCase: Case-insensitive match (default false)\n" +
    "- literal: Literal string match — no regex interpretation (default false)\n" +
    "Use this to find usages, definitions, patterns; use glob to find files by name.",
  parameters: {
    type: "object",
    properties: {
      pattern: { type: "string", description: "Regular expression, or a literal string when literal=true" },
      path: { type: "string", description: "Directory or file to search" },
      glob: { type: "string", description: "File glob filter" },
      ignoreCase: { type: "boolean", description: "Case-insensitive match (default false)" },
      literal: { type: "boolean", description: "Literal string match — no regex interpretation (default false)" },
    },
    required: ["pattern"],
  },
  async execute({ pattern, path: dir, glob: fileGlob, ignoreCase, literal }, ctx) {
    const base = dir ? resolvePath(dir, ctx.cwd) : ctx.cwd
    try {
      const flags = (ignoreCase ? "i" : "") + "g"
      const re = new RegExp(literal ? escapeRegExp(String(pattern)) : pattern, flags)
      // Use ripgrep via child_process for speed if available, otherwise fallback
      const files = fileGlob
        ? await vscode.workspace.findFiles(new vscode.RelativePattern(base, fileGlob), "**/node_modules/**")
        : await vscode.workspace.findFiles(new vscode.RelativePattern(base, "**/*"), "**/node_modules/**")

      const results = []
      for (const uri of files.slice(0, 500)) {
        try {
          const text = await readFile(uri.fsPath, "utf8")
          const lines = text.split("\n")
          for (let i = 0; i < lines.length; i++) {
            re.lastIndex = 0
            if (re.test(lines[i])) {
              results.push(`${vscode.workspace.asRelativePath(uri)}:${i + 1}: ${lines[i].trim()}`)
            }
          }
        } catch { /* skip binary/unreadable */ }
      }
      if (results.length === 0) return "(no matches)"
      if (results.length > 200) return results.slice(0, 200).join("\n") + `\n\n[... ${results.length - 200} more matches truncated]`
      return results.join("\n")
    } catch (e) {
      return `grep error: ${e.message}`
    }
  },
}
