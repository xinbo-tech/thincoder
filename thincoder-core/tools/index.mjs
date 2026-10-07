// tools/index.mjs — backend-compatible re-export
export { toOpenAISchema } from "./shared.mjs";

import { readTool, writeTool, editTool, insertAfterTool, hashlineEditTool, readImageTool } from "./file.mjs";
import { applyPatchTool, deleteTool } from "./patch.mjs";
import { bashTool } from "./bash.mjs";
import { globTool, grepTool, lsTool } from "./search.mjs";
import { websearchTool, fetchTool } from "./web.mjs";
import { gitTool } from "./git.mjs";
import { questionTool } from "./question.mjs";
import { lintTool } from "./linter.mjs";
import { lspTool } from "./lsp.mjs";
import { executeTool } from "./execute.mjs";
import { fileOpsTool, processTool, getCurrentTimeTool, waitForTool } from "./ops.mjs";
import { treeTool } from "./tree.mjs";
import { browserTool } from "./browser.mjs";

// Instance-independent built-in table. `read_image` is deliberately NOT here:
// its registration is capability-gated per model — see `assembleBuiltinTools`.
export const builtinTools = [
  readTool, writeTool, editTool, insertAfterTool, hashlineEditTool, applyPatchTool,
  bashTool, globTool, grepTool,
  websearchTool, lsTool, fetchTool, deleteTool,
  gitTool, questionTool,
  lintTool, lspTool, executeTool,
  fileOpsTool, processTool, getCurrentTimeTool, waitForTool,
  treeTool,
  browserTool,
];

export {
  readTool, writeTool, editTool, insertAfterTool, hashlineEditTool, applyPatchTool,
  readImageTool, bashTool, globTool, grepTool,
  websearchTool, lsTool, fetchTool, deleteTool,
  gitTool, questionTool,
  lintTool, lspTool, executeTool,
  fileOpsTool, processTool, getCurrentTimeTool, waitForTool,
  treeTool,
  browserTool,
};

// ── Full built-in registry (CORE-UNIFICATION TOOLS #70) ─────────────────────
// The registry owns the COMPLETE built-in tool face for both shells. The VS Code
// index registers the full table in one place; the CLI splits it between this
// index and its consumer assembly (`cli/make-agent.mjs`). That consumer assembly
// face moves here (`assembleBuiltinTools`) so both shells consume one registry:
// `builtinTools` = the instance-independent static table, plus the instance-bound
// faces (memory / code+doc search / repo outline / settings / peer instances)
// whose factories need the shell's memory handle at run time.
//
// Host-only tools (VS Code `ide` / `focus` — TOOLS #179 ④, IDE capabilities)
// are NOT part of the core registry: the VS Code shell adds them itself.
// D-CC26（context-tool 批 2026-09-21）：宿主 IDE 快照工具自 `context` **改名 `ide`**（`tools/ide.mjs`）
// ——让出 `context` 名给核新工具（`agent-tools/context.mjs`；同名撞车 ⇒ provider 逐字 400）。
//
// `read_image` registration follows VS Code (#70): it is registered only when the
// model accepts image input (`specForModel(model).multimodal`) — the conservative
// default spec carries no `multimodal`, so an unknown or absent model does NOT get
// it. The runtime gate in `tools/file.mjs` stays as a second line of defence.
export async function assembleBuiltinTools({ memory, cwd, projectDir = null, author = "unknown", team = null, model = null } = {}) {
  const { specForModel } = await import("../model-specs.mjs");
  const { memoryTools, codeSearchTool, docSearchTool } = await import("../memory.mjs");
  const { repoOutlineTool } = await import("./repomap.mjs");
  const { settingsTool } = await import("../agent-tools/settings.mjs");
  const { peerInstancesTool } = await import("../peer-instances.mjs");
  const imageOk = Boolean(specForModel(model)?.multimodal);
  return [
    ...builtinTools,
    ...(imageOk ? [readImageTool] : []),
    ...memoryTools(memory, { cwd, projectDir, author, team }),
    codeSearchTool(memory),
    docSearchTool(memory),
    // memory 缺位容错：组装期零解引用（memory?.db）；缺位不抛（懒失败留执行期——与 memory ∕ code_search ∕ doc_search 同族，dispatch 收成 Error 回模型）；有 memory 逐字零变
    repoOutlineTool(memory?.db, cwd),
    settingsTool(),
    peerInstancesTool,
    // 台账工具面（统一入口 `ledger`——含读二）随家族段 `agent/family-tools.mjs`（2026-10-05 统一入口批：本基集清零）
  ];
}
