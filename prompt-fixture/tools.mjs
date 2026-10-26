/**
 * tools.mjs — the declared tool face and the deterministic stub executor.
 *
 * The face is four tools: `read` / `write` / `edit` / `subagent`. The first three carry the
 * product's own schemas (imported, not rewritten) — the scenario judges an action choice, and a
 * reworded description would measure a different question. `subagent` is declared here because
 * it is depth-bound in the product and therefore not part of the built-in table; only its spawn
 * face is kept (see the deviation table in the design document).
 *
 * The executor never touches the disk: `write` / `edit` acknowledge without side effects and the
 * sandbox is immutable, so the same parameters always reproduce the same reading.
 */

import { editTool, readTool, toOpenAISchema, writeTool } from "../thincoder-core/tools/index.mjs"
import { TOOL_FACE } from "./data.mjs"

/** `subagent` as the fixture declares it: spawn only, fixture-written description. */
export const subagentTool = {
  name: "subagent",
  description:
    "Spawn a subagent to carry out one self-contained task. Use it when the work belongs to a " +
    "different role instead of being done here. The subagent runs with its own prompt and reports back.",
  parameters: {
    type: "object",
    properties: {
      prompt: { type: "string", description: "The task brief handed to the subagent" },
      role: { type: "string", description: "Subagent role (default: eng-coder)" },
    },
    required: ["prompt"],
  },
}

/** name → declaration. The face is exactly these keys; a scenario may narrow it, never widen it. */
export const DECLARED_TOOLS = {
  read: readTool,
  write: writeTool,
  edit: editTool,
  subagent: subagentTool,
}

export const DECLARED_TOOL_NAMES = [...TOOL_FACE]

/** OpenAI-shaped schemas for the requested names, in the declared order. */
export function schemasFor(names = DECLARED_TOOL_NAMES) {
  for (const name of names) {
    if (!Object.hasOwn(DECLARED_TOOLS, name)) {
      throw new Error(`tool "${name}" is not part of the declared tool face (${DECLARED_TOOL_NAMES.join(" / ")})`)
    }
  }
  return DECLARED_TOOL_NAMES.filter((name) => names.includes(name)).map((name) => toOpenAISchema(DECLARED_TOOLS[name]))
}

/**
 * Stub executor over an immutable sandbox (`path → content`).
 * An undeclared tool name fails loudly and is counted: a model reaching for a tool that was not
 * offered is a reading in its own right, and its result text must not look like a success.
 */
export function createExecutor({ sandbox = {} } = {}) {
  let unknownToolCalls = 0

  function run(name, args = {}) {
    if (!Object.hasOwn(DECLARED_TOOLS, name)) {
      unknownToolCalls += 1
      return { name, content: `unknown tool: ${name}`, unknown: true }
    }
    if (name === "read") {
      const path = args?.path ?? args?.filePath
      if (typeof path === "string" && Object.hasOwn(sandbox, path)) return { name, content: sandbox[path], unknown: false }
      return { name, content: `file not found: ${String(path)}`, unknown: false }
    }
    if (name === "write" || name === "edit") {
      return { name, content: JSON.stringify({ ok: true, sandboxed: true }), unknown: false }
    }
    const role = typeof args?.role === "string" && args.role ? args.role : "eng-coder"
    return { name, content: JSON.stringify({ ok: true, role, status: "spawned" }), unknown: false }
  }

  return { run, unknownToolCalls: () => unknownToolCalls }
}
