/**
 * code.mjs — Code understanding tools: code_search, doc_search.
 *
 * W8（`docs/batches/2026-09-15-vsc-core-wiring.md` §2 · 2026-09-15）：检索已归一核面
 * （FTS5 + 惰性向量 · `code_chunks` / `doc_chunks`——sqlite）；端壳宿主 regex 回退随文件制
 * 索引（`src/indexer.mjs` 族）删旧**退役**——核面 FTS 回退承接（无 embedder 时非空 query
 * 仍走 BM25，不空回）。描述面 = 核工具同文（语义同源 · 单一契约）。
 * 核面经动态 `import()` 载入（`execute()` 内）——端壳静态闭包不得到达 `node:sqlite`
 * （护栏契约见 `embed-config.mjs` 头注）。
 */

import { loadMemoryFace, memoryFor } from "../embed-config.mjs"

/** Face-off结果（引擎护栏判停用 / 句柄创建失败——零崩，明确可见）。 */
const UNAVAILABLE = "Error: search is unavailable on this host — the memory/index face is disabled (unsupported host runtime)"

/** Run one core search tool (`codeSearchTool` / `docSearchTool`) against the project face. */
async function runCoreSearch(ctx, args, build) {
  const memory = await memoryFor(ctx?.cwd ?? null)
  if (!memory) return UNAVAILABLE
  const face = await loadMemoryFace()
  return await face[build](memory).execute(args)
}

// ─── Tools ─────────────────────────────────────────────────────

export const codeSearchTool = {
  readonly: true,
  name: "code_search",
  description:
    "Search the project's source code for relevant code. Use this to find functions, classes, or code patterns across the codebase. Supports natural language queries and code snippets. Returns matching code chunks with file paths and line numbers. Prefer doc_search for the intended design (design docs, conventions); code_search for the implementation as written. " +
    "For what was said in a session (conversation/chat history), use read_history.",
  parameters: {
    type: "object",
    properties: {
      query: { type: "string", description: "Natural language or code snippet to search for" },
      limit: { type: "number", description: "Max results (default 5)" },
    },
    required: ["query"],
  },
  async execute({ query, limit }, ctx) {
    return runCoreSearch(ctx, { query, limit: limit || 5 }, "codeSearchTool")
  },
}

export const docSearchTool = {
  readonly: true,
  name: "doc_search",
  description:
    "Search the project's documentation (README, design docs, guides, markdown files) for relevant information. Use this to find design decisions, coding conventions, architecture docs, or project rules. Prefer this over code_search when you need to understand the project's intended design rather than existing implementation. " +
    "Returns matching doc chunks: path, heading, line range, relevance score, content excerpt. " +
    "For what was said in sessions (conversation/chat history — decisions, rulings), use read_history.",
  parameters: {
    type: "object",
    properties: {
      query: { type: "string", description: "Natural language search query" },
      limit: { type: "number", description: "Max results (default 5)" },
    },
    required: ["query"],
  },
  async execute({ query, limit }, ctx) {
    return runCoreSearch(ctx, { query, limit: limit || 5 }, "docSearchTool")
  },
}
