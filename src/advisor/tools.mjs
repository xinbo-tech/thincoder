/**
 * advisor/tools.mjs — advisor read-only tool set + test override seam.
 * Extracted from advisor/run.mjs (2026-09-08 structure-debt batch 6 — run.mjs 511 >
 * 500 hard cap; module-split precedent citations.mjs). The seam's module-private
 * state lives HERE (with its setter), so run.mjs resolves the effective set via
 * _resolvedAdvisorToolsFor — production path unchanged (override ?? advisorToolsFor).
 */
import { toOpenAISchema } from "../tools/index.mjs"

const { readTool, globTool, grepTool, lsTool } = await import("../tools/index.mjs")
const { lspTool } = await import("../tools/lsp.mjs")
const { codeSearchTool } = await import("../tools/code.mjs")

/**
 * Advisor tool set — ZERO git, read-only ONLY, every round. The change surface
 * comes from the review scope (paths / _touchedFiles injected by the caller),
 * never from git: git output misled reviews (committed fixes never show in
 * `git diff HEAD`, so "no changes" was read as "not fixed") and the user
 * mandate is full decoupling (7d49a52 + d3be613). The reviewer reads files
 * and searches code; it never touches git and never writes.
 * No round parameter — the set is constant across all rounds.
 * @param {Object} _agent — accepted for API compatibility with the CLI
 *   (there the parameter selects the code index); UNUSED in the VS Code port
 *   (code_search reads the workspace index directly).
 */
export function advisorToolsFor(_agent) {
  // VS Code port: code_search reads the workspace index — no agent.memory
  // dependency, so the set is constant (ZERO git, read-only only).
  const tools = [readTool, globTool, grepTool, lsTool, lspTool, codeSearchTool]
  return { schemas: tools.map(toOpenAISchema), byName: new Map(tools.map((t) => [t.name, t])) }
}
// Test seam: the tool set is pure (agent.memory → code_search inclusion).
export { advisorToolsFor as _advisorToolsFor }

// Test seam (AGENT-LOOP.md §18.7 D-TS7, T-TS8/9): the B1 batch-parallelism
// tests mock two slow read-only tools in one LLM reply. Production path is
// unchanged — the override only replaces the RESOLVED set when set.
let _advisorToolSetOverride = null
export function _setAdvisorToolSetForTest(tools) {
  _advisorToolSetOverride = Array.isArray(tools)
    ? { schemas: tools.map(toOpenAISchema), byName: new Map(tools.map((t) => [t.name, t])) }
    : null
}

/** Effective set resolution: test override ?? production set (state lives here). */
export function _resolvedAdvisorToolsFor(agent) {
  return _advisorToolSetOverride ?? advisorToolsFor(agent)
}
