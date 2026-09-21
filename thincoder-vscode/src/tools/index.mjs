/**
 * index.mjs — Tools module index: imports, re-exports, and tool registry（VSC 装配面）。
 *
 * W14（2026-09-15 · S2 · `docs/batches/2026-09-15-vsc-core-wiring.md` §2 W14）：端侧
 * 自持工具实现面退场——12 同路径镜像档 + 7 M 档删除，工具实现经 `@thincoder/core/tools/*`
 * 单源引用（核内零改动）；本档保留 = VSC 登记表（宿主工具 `ide/focus/shell/code` +
 * 自持 `builtinTools` 清单）+ **两处端壳增量**（同一份登记面，不另立档）：
 *   ① `gitTool` 动作级只读分类装饰（`isReadonlyAction`——端审批面 execute-tools 权限门 /
 *      planMode 门消费；核 git 工具无此概念）；
 *   ② LSP 宿主语言服务桥（`configureLspHost` 供值：VS Code 语言服务直用，零自起进程——
 *      原 `src/tools/lsp.mjs` 端实现随删旧迁入本档）。
 */
import * as vscode from "vscode"
import { existsSync } from "node:fs"
import { join } from "node:path"
import { readTool, writeTool, editTool, hashlineEditTool, insertAfterTool, readImageTool } from "@thincoder/core/tools/file.mjs"
import { globTool, grepTool, lsTool } from "@thincoder/core/tools/search.mjs"
import { applyPatchTool, deleteTool } from "@thincoder/core/tools/patch.mjs"
import { lintTool } from "@thincoder/core/tools/linter.mjs"
import { lspTool, configureLspHost } from "@thincoder/core/tools/lsp.mjs"
import { executeTool } from "@thincoder/core/tools/execute.mjs"
import { questionTool } from "@thincoder/core/tools/question.mjs"
import { gitTool as coreGitTool } from "@thincoder/core/tools/git.mjs"
import { websearchTool, fetchTool } from "@thincoder/core/tools/web.mjs"
import { fileOpsTool, processTool, getCurrentTimeTool, waitForTool } from "@thincoder/core/tools/ops.mjs"
import { treeTool } from "@thincoder/core/tools/tree.mjs"
import { toOpenAISchema } from "@thincoder/core/tools/shared.mjs"
// ── VSC 装配面（保留档）──────────────────────────────────────────────
import { bashTool } from "./shell.mjs"
import { codeSearchTool, docSearchTool } from "./code.mjs"
import { repoOutlineTool } from "../repomap.mjs"
import { memoryTool } from "../memory-tool.mjs"
import { ideTool } from "./ide.mjs"
import { focusTool } from "./focus.mjs"
import { peerInstancesTool } from "../extension/peer-instances.mjs" // R10 L2（MULTI-INSTANCE-COLLAB D-L2b）只读工具

/**
 * git 工具 + 端只读分类装饰（迁自删除档 `src/tools/git.mjs:81-93`，逐字同语义）。
 * 端审批面（`agent/execute-tools.mjs` 权限门 + `agent/tool-gates.mjs` planMode 门）按
 * `tool.isReadonlyAction(args)` 判动作级只读——核 git 工具无该钩子（核内零端名/零端概念），
 * 故端侧以装饰面承载：只读动作免审批免拦，写动作（commit/push/rm/reset…）照常询问。
 */
export const gitTool = {
  ...coreGitTool,
  isReadonlyAction(args) {
    if (!args || typeof args.action !== "string") return false
    if (["diff", "status", "log", "show", "ls-remote", "blame"].includes(args.action)) return true
    // checkpoint list 有 F6 清理副作用（lazyClearIfCommitted 可能删除整个 checkpoint 目录），
    // 但清的是 commit 后已失去意义的过期快照——保留只读分类免审批（CHECKPOINT.md F6/D3 设计意图）
    if (args.action === "checkpoint") return ["list", "cat"].includes(args.checkpointAction)
    if (args.action === "tag") return args.tagAction === "list"
    if (args.action === "branch") return args.branchAction === "list"
    if (args.action === "stash") return args.stashAction === "list"
    if (args.action === "remote") return args.remoteAction === "list"
    if (args.action === "worktree") return args.worktreeAction === "list"
    return false // add/rm/commit/push/fetch/pull/reset/revert/merge/cherry-pick/checkout/restore + tag/branch/stash 写操作
  },
}

// ── LSP 宿主语言服务桥（#66 缝供值；迁自删除档 `src/tools/lsp.mjs`）──────
// 端差异（TOOLS.md §6.11）：语言服务直用 VS Code 原生实现——`executeDefinitionProvider` 等
// 命令 + `languages.getDiagnostics`，**零自起进程**（核内默认径 = 按配置 spawn JSON-RPC server）。
// 契约（§2.13.3）：`handle(args, ctx) → string | null`——null = 未处理 ⇒ 回核内径。

/** Resolve a workspace-relative path to a file URI; returns null when the file is missing. */
function resolveLspUri(cwd, p) {
  if (typeof p !== "string" || !p.trim()) return null
  const abs = p.includes(":") ? p : join(cwd, ...p.split("/"))
  if (!existsSync(abs)) return null
  return vscode.Uri.file(abs)
}

function formatLocation(loc) {
  const uri = loc.uri ?? loc.targetUri
  const range = loc.range ?? loc.targetSelectionRange ?? loc.targetRange
  const line = (range?.start?.line ?? 0) + 1
  const col = (range?.start?.character ?? 0) + 1
  return `${uri.fsPath}:${line}:${col}`
}

/** Render a vscode.DocumentSymbol (hierarchical) or SymbolInformation (flat) list. */
function renderSymbols(nodes, depth = 0) {
  const lines = []
  for (const n of nodes) {
    const kindName = vscode.SymbolKind[n.kind] ?? `kind-${n.kind}`
    const line = (n.range?.start?.line ?? 0) + 1
    lines.push(`${"  ".repeat(depth)}${n.name} [${kindName}] — L${line}`)
    if (n.children?.length) lines.push(...renderSymbols(n.children, depth + 1))
    // SymbolInformation has no children but may carry a containerName
    if (!n.children && n.location) {
      const l = (n.location.range?.start?.line ?? 0) + 1
      lines[lines.length - 1] = `${"  ".repeat(depth)}${n.containerName ? n.containerName + "." : ""}${n.name} [${kindName}] — L${l}`
    }
  }
  return lines
}

export async function lspHostHandle(args, ctx) {
  const fileUri = resolveLspUri(ctx.cwd, args.uri)
  if (!fileUri) return `lsp error: file not found: ${args.uri}`
  try {
    switch (args.subcommand) {
      case "definition": {
        if (!args.line || !args.character) return "Error: line and character required for definition"
        const pos = new vscode.Position(args.line - 1, args.character - 1)
        const res = await vscode.commands.executeCommand("vscode.executeDefinitionProvider", fileUri, pos)
        if (!res?.length) return "(no definition found)"
        return res.map(formatLocation).join("\n")
      }

      case "references": {
        if (!args.line || !args.character) return "Error: line and character required for references"
        const pos = new vscode.Position(args.line - 1, args.character - 1)
        const res = await vscode.commands.executeCommand("vscode.executeReferenceProvider", fileUri, pos)
        if (!res?.length) return "(no references found)"
        return res.slice(0, 50).map(formatLocation).join("\n")
          + (res.length > 50 ? `\n... and ${res.length - 50} more` : "")
      }

      case "hover": {
        if (!args.line || !args.character) return "Error: line and character required for hover"
        const pos = new vscode.Position(args.line - 1, args.character - 1)
        const res = await vscode.commands.executeCommand("vscode.executeHoverProvider", fileUri, pos)
        if (!res?.length) return "(no hover info)"
        const parts = []
        for (const h of res) {
          for (const c of h.contents ?? []) {
            if (typeof c === "string") parts.push(c)
            else if (c?.value) parts.push(c.value)
          }
        }
        return parts.join("\n") || "(no hover info)"
      }

      case "symbols": {
        const res = await vscode.commands.executeCommand("vscode.executeDocumentSymbolProvider", fileUri)
        if (!res?.length) return "(no symbols found)"
        return renderSymbols(res).join("\n")
      }

      case "diagnostics": {
        const diags = vscode.languages.getDiagnostics(fileUri)
        if (!diags?.length) return "(no diagnostics)"
        const sev = { 0: "ERROR", 1: "WARN", 2: "INFO", 3: "HINT" }
        return diags.slice(0, 30).map((d) =>
          `L${d.range.start.line + 1}: ${sev[d.severity] ?? "?"}: ${d.message}${d.code ? ` [${typeof d.code === "object" ? d.code.value : d.code}]` : ""}`
        ).join("\n") + (diags.length > 30 ? `\n... and ${diags.length - 30} more` : "")
      }

      default:
        return null // 未处理 ⇒ 回核内径（schema 枚举外形态）
    }
  } catch (err) {
    return `lsp error: ${err.message}`
  }
}
configureLspHost({ handle: lspHostHandle })

export { readTool, writeTool, editTool, hashlineEditTool }
export { globTool, grepTool }
export { bashTool }
export { websearchTool, fetchTool }
export { insertAfterTool, applyPatchTool, lsTool, deleteTool }
export { lintTool, lspTool, executeTool, questionTool, readImageTool }
export { codeSearchTool, docSearchTool }
export { ideTool, focusTool, fileOpsTool, processTool, getCurrentTimeTool, waitForTool, treeTool }
export { toOpenAISchema }
export { BASH_TIMEOUT_MS } from "@thincoder/core/tools/shared.mjs"
export { resolvePath } from "./shared.mjs"

/** All built-in tools */
export const builtinTools = [
  readTool, writeTool, editTool, insertAfterTool, applyPatchTool, hashlineEditTool,
  lintTool, lsTool, deleteTool,
  globTool, grepTool, bashTool,
  gitTool,
  websearchTool, fetchTool, questionTool,
  repoOutlineTool, codeSearchTool, docSearchTool,
  lspTool, executeTool,
  memoryTool,
  ideTool, focusTool, // D-CC26：宿主 IDE 快照工具自 `context` 改名 `ide`（让名给核 `context` 工具——行为面零改）
  fileOpsTool, processTool, getCurrentTimeTool,
  waitForTool,
  treeTool,
  peerInstancesTool, // R10 L2——只读（纯查询——不认领不写）
]
