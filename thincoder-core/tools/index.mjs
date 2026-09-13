// tools/index.mjs — backend-compatible re-export
export { toOpenAISchema } from "./shared.mjs";

import { readTool, writeTool, editTool, insertAfterTool, readImageTool, hashlineEditTool } from "./file.mjs";
import { applyPatchTool, deleteTool } from "./patch.mjs";
import { bashTool } from "./bash.mjs";
import { globTool, grepTool, lsTool } from "./search.mjs";
import { websearchTool, fetchTool } from "./web.mjs";
import { gitTool } from "./git.mjs";
import { questionTool } from "./question.mjs";
import { checklistTool } from "./checklist.mjs";
import { lintTool } from "./linter.mjs";
import { lspTool } from "./lsp.mjs";
import { executeTool } from "./execute.mjs";
import { fileOpsTool, processTool, getCurrentTimeTool, waitForTool } from "./ops.mjs";
import { treeTool } from "./tree.mjs";

export const builtinTools = [
  readTool, writeTool, editTool, insertAfterTool, hashlineEditTool, applyPatchTool,
  readImageTool, bashTool, globTool, grepTool,
  websearchTool, lsTool, fetchTool, deleteTool,
  gitTool, questionTool,
  checklistTool, lintTool, lspTool, executeTool,
  fileOpsTool, processTool, getCurrentTimeTool, waitForTool,
  treeTool,
];

export {
  readTool, writeTool, editTool, insertAfterTool, hashlineEditTool, applyPatchTool,
  readImageTool, bashTool, globTool, grepTool,
  websearchTool, lsTool, fetchTool, deleteTool,
  gitTool, questionTool,
  checklistTool, lintTool, lspTool, executeTool,
  fileOpsTool, processTool, getCurrentTimeTool, waitForTool,
  treeTool,
};