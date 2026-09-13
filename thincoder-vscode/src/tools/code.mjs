/**
 * code.mjs — Code understanding tools: code_search, doc_search
 * Supports vector search when .thincoder/index/ and embedding config exist,
 * falling back to keyword-based regex matching.
 */

import * as vscode from "vscode"
import { relative } from "node:path"
import { getEmbedder } from "../embed-config.mjs"
import { searchIndex, loadIndexManifest } from "../indexer.mjs"
import { safeSliceUTF16 } from "../agent/run-helpers.mjs"

// ─── Vector search helper ──────────────────────────────────────

async function vectorSearch(cwd, query, kind, limit) {
  const embedder = getEmbedder()
  if (!embedder) return null

  try {
    // Quick check: index exists? (manifest-only — avoids decoding vectors twice)
    if (!loadIndexManifest(cwd)) return null

    const results = await searchIndex(cwd, embedder, query, { kind, limit })
    if (results.length === 0) return null

    return results.map((r) =>
      `${r.file}:${r.startLine}-${r.endLine} (score:${r.score.toFixed(3)})\n${r.snippet}`
    ).join("\n\n")
  } catch {
    return null // fall back to keyword search on any error
  }
}

// ─── Tools ─────────────────────────────────────────────────────

export const codeSearchTool = {
  readonly: true,
  name: "code_search",
  description:
    "Search the project's source code. Uses vector semantic search when available, falling back to keyword-based regex matching. " +
    "Use natural language queries for vector search; use short specific terms (function names, class names) for keyword search. " +
    "Returns matching code chunks with file paths and line numbers. When you need the intended design rather than the implemented code, use doc_search. 查设计决策用 doc_search——查实现用 code_search——查会话用 read_history。", 
  parameters: {
    type: "object",
    properties: {
      query: { type: "string", description: "Search query (natural language for vector search, keywords for regex)" },
      limit: { type: "number", description: "Max results (default 5)" },
    },
    required: ["query"],
  },
  async execute({ query, limit }, ctx) {
    const maxResults = limit || 5

    // Try vector search first
    const vecResult = await vectorSearch(ctx.cwd, query, "code", maxResults)
    if (vecResult) return vecResult

    // Fallback: keyword-based regex search
    const keywords = query
      .split(/[\s,.;:()[\]{}"'`!@#$%^&*+=|\\<>?/~]+/)
      .filter((w) => w.length > 1)
      .slice(0, 6)

    if (keywords.length === 0) keywords.push(query.slice(0, 30))

    const pattern = keywords.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")
    const filePattern = "**/*.{js,mjs,cjs,jsx,ts,tsx,py,rs,go,java,c,cpp,h,hpp}"
    const excludePattern = "**/node_modules/**,**/.git/**,**/dist/**,**/build/**,**/.turbo/**"

    try {
      const results = []
      const uris = await vscode.workspace.findFiles(filePattern, excludePattern, 2000)

      for (const uri of uris) {
        if (results.length >= maxResults) break
        const relPath = relative(ctx.cwd, uri.fsPath).replace(/\\/g, "/")
        try {
          const raw = await vscode.workspace.fs.readFile(uri)
          const text = new TextDecoder().decode(raw)
          const lines = text.split("\n")
          for (let i = 0; i < lines.length && results.length < maxResults; i++) {
            if (new RegExp(pattern, "i").test(lines[i])) {
              const start = Math.max(0, i - 2)
              const end = Math.min(lines.length, i + 3)
              const snippet = lines.slice(start, end)
                .map((l, j) => `${start + j + 1}: ${l}`)
                .join("\n")
              results.push({ path: relPath, line: i + 1, snippet })
              i += 2
            }
          }
        } catch { /* skip unreadable */ }
      }

      if (results.length === 0) return "No matches found."
      return results.map((r) => `${r.path}:${r.line}:\n${r.snippet}`).join("\n\n")
    } catch (e) {
      return `Search error: ${e.message}`
    }
  },
}

export const docSearchTool = {
  readonly: true,
  name: "doc_search",
  description:
    "Search the project's documentation (README, design docs, guides, markdown files). Uses vector semantic search when available, falling back to keyword-based regex matching. " +
    "Use natural language queries for vector search; use specific terms for keyword search. " +
    "Prefer this over code_search when you need to understand the project's intended design rather than existing implementation. " +
    "Returns matching document sections with their file paths. 查设计决策用 doc_search——查实现用 code_search——查会话用 read_history。", 
  parameters: {
    type: "object",
    properties: {
      query: { type: "string", description: "Search query (natural language for vector search, keywords for regex)" },
      limit: { type: "number", description: "Max results (default 5)" },
    },
    required: ["query"],
  },
  async execute({ query, limit }, ctx) {
    const maxResults = limit || 5

    // Try vector search first
    const vecResult = await vectorSearch(ctx.cwd, query, "doc", maxResults)
    if (vecResult) return vecResult

    // Fallback: keyword-based regex search
    const keywords = query
      .split(/[\s,.;:()[\]{}"'`!@#$%^&*+=|\\<>?/~]+/)
      .filter((w) => w.length > 1)
      .slice(0, 6)

    if (keywords.length === 0) keywords.push(query.slice(0, 30))

    const pattern = keywords.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")
    const filePattern = "**/*.{md,markdown,txt}"
    const excludePattern = "**/node_modules/**"

    try {
      const results = []
      const uris = await vscode.workspace.findFiles(filePattern, excludePattern, 1000)

      for (const uri of uris) {
        if (results.length >= maxResults) break
        const relPath = relative(ctx.cwd, uri.fsPath).replace(/\\/g, "/")
        try {
          const raw = await vscode.workspace.fs.readFile(uri)
          const text = new TextDecoder().decode(raw)
          const chunks = text.split(/\n(?=#{1,3}\s)/)
          for (const chunk of chunks) {
            if (results.length >= maxResults) break
            if (new RegExp(pattern, "i").test(chunk)) {
              const cleaned = safeSliceUTF16(chunk.trim(), 800)
              results.push(`${relPath}:\n${cleaned}`)
            }
          }
        } catch { /* skip unreadable */ }
      }

      if (results.length === 0) return "No documentation matches found."
      return results.join("\n\n---\n\n")
    } catch (e) {
      return `Search error: ${e.message}`
    }
  },
}
