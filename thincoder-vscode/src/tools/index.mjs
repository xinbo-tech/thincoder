/**
 * index.mjs — Tools module index: imports, re-exports, and tool registry
 */

import { readTool, writeTool, editTool, hashlineEditTool } from "./file.mjs"
import { globTool, grepTool } from "./search.mjs"
import { bashTool } from "./shell.mjs"
import { gitTool } from "./git.mjs"
import { websearchTool, fetchTool } from "./web.mjs"
import { insertAfterTool, applyPatchTool, lsTool, deleteTool } from "./more-file.mjs"
import { lintTool } from "./linter.mjs"
import { checklistTool } from "./checklist.mjs"
import { lspTool } from "./lsp.mjs"
import { executeTool } from "./execute.mjs"
import { questionTool } from "./question.mjs"
import { readImageTool } from "./read_image.mjs"
import { codeSearchTool, docSearchTool } from "./code.mjs"
import { repoOutlineTool } from "../repomap.mjs"
import { memoryTool } from "../memory-tool.mjs"
import { contextTool } from "./context.mjs"
import { focusTool } from "./focus.mjs"
import { fileOpsTool, processTool, getCurrentTimeTool } from "./ops.mjs"
import { waitForTool } from "./wait_for.mjs"
import { treeTool } from "./tree.mjs"
import { peerInstancesTool } from "../extension/peer-instances.mjs" // R10 L2（MULTI-INSTANCE-COLLAB D-L2b）只读工具

export { readTool, writeTool, editTool, hashlineEditTool }
export { globTool, grepTool }
export { bashTool }
export { gitTool }
export { websearchTool, fetchTool }
export { insertAfterTool, applyPatchTool, lsTool, deleteTool }
export { lintTool } from "./linter.mjs"
export { checklistTool } from "./checklist.mjs"
export { lspTool } from "./lsp.mjs"
export { executeTool } from "./execute.mjs"
export { questionTool }
export { readImageTool }
export { codeSearchTool, docSearchTool }

export { contextTool } from "./context.mjs"
export { focusTool } from "./focus.mjs"
export { fileOpsTool, processTool, getCurrentTimeTool } from "./ops.mjs"
export { waitForTool } from "./wait_for.mjs"
export { treeTool } from "./tree.mjs"

export { BASH_TIMEOUT_MS, resolvePath, formatSize } from "./shared.mjs"

/** All built-in tools */
export const builtinTools = [
  readTool, writeTool, editTool, insertAfterTool, applyPatchTool, hashlineEditTool,
  lintTool, checklistTool, lsTool, deleteTool,
  globTool, grepTool, bashTool,
  gitTool,
  websearchTool, fetchTool, questionTool,
  repoOutlineTool, codeSearchTool, docSearchTool,
  lspTool, executeTool,
  memoryTool,
  contextTool, focusTool,
  fileOpsTool, processTool, getCurrentTimeTool,
  waitForTool,
  treeTool,
  peerInstancesTool, // R10 L2——只读（纯查询——不认领不写）
]

/** Convert a tool definition to OpenAI function schema */
export function toOpenAISchema(tool) {
  return {
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
  }
}
