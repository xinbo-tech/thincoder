// tools/index.mjs — backend-compatible re-export
export { toOpenAISchema } from "./shared.mjs";

import { readTool, writeTool, editTool, insertAfterTool, readImageTool, hashlineEditTool } from "./file.mjs";
import { applyPatchTool, deleteTool } from "./patch.mjs";
import { bashTool, globTool, grepTool, lsTool } from "./system.mjs";
import { websearchTool, fetchTool } from "./web.mjs";
import { gitTool, questionTool } from "./git.mjs";
import { checklistTool } from "./checklist.mjs";
import { lintTool } from "./linter.mjs";
import { lspTool } from "./lsp.mjs";
import { executeTool } from "./execute.mjs";
import { fileOpsTool, processTool, getCurrentTimeTool } from "./ops.mjs";
import { treeTool } from "./tree.mjs";

export const builtinTools = [
  readTool, writeTool, editTool, insertAfterTool, hashlineEditTool, applyPatchTool,
  readImageTool, bashTool, globTool, grepTool,
  websearchTool, lsTool, fetchTool, deleteTool,
  gitTool, questionTool,
  checklistTool, lintTool, lspTool, executeTool,
  fileOpsTool, processTool, getCurrentTimeTool,
  treeTool,
];

export {
  readTool, writeTool, editTool, insertAfterTool, hashlineEditTool, applyPatchTool,
  readImageTool, bashTool, globTool, grepTool,
  websearchTool, lsTool, fetchTool, deleteTool,
  gitTool, questionTool,
  checklistTool, lintTool, lspTool, executeTool,
  fileOpsTool, processTool, getCurrentTimeTool,
  treeTool,
};