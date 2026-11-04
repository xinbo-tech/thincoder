/**
 * index.mjs — Tools module index: imports, re-exports, and tool registry（VSC 装配面）。
 *
 * W14（2026-09-15 · S2 · `docs/batches/2026-09-15-vsc-core-wiring.md` §2 W14）：端侧
 * 自持工具实现面退场——12 同路径镜像档 + 7 M 档删除，工具实现经 `@thincoder/core/tools/*`
 * 单源引用（核内零改动）；本档保留 = VSC 登记表（宿主工具 `ide/focus/shell/code` +
 * 自持 `builtinTools` 清单）+ **一处端壳增量**（同一份登记面，不另立档）：
 *   ① LSP 宿主语言服务桥（`configureLspHost` 供值：VS Code 语言服务直用，零自起进程——
 *      原 `src/tools/lsp.mjs` 端实现随删旧迁入本档）。
 * `gitTool` 的动作级只读分类端覆写已退场（2026-11-03 笔-账绑定批 · 决策 37）：名单落核
 * `thincoder-core/tools/git.mjs` 的 `isReadonlyAction`（单源），端侧不再持第二份拷贝。
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
// SSH 会话工具族（批 ssh-session · 台账 #1436 · 设计单源 = `docs/core/design/TOOLS.md` §6.22）——
// 端装配清单行（零实现副本）：实现在核（`@thincoder/core/tools/ssh.mjs`），凭据窗经
// `ctx.onSecretInput` 缝落本端卡片（`src/extension/panel-callbacks.mjs` `makeAskSecretInPanel`）。
import { sshTool } from "@thincoder/core/tools/ssh.mjs"
import { gitTool as coreGitTool } from "@thincoder/core/tools/git.mjs"
import { websearchTool, fetchTool } from "@thincoder/core/tools/web.mjs"
import { fileOpsTool, processTool, getCurrentTimeTool, waitForTool } from "@thincoder/core/tools/ops.mjs"
import { treeTool } from "@thincoder/core/tools/tree.mjs"
import { browserTool } from "@thincoder/core/tools/browser.mjs"
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
 * git 工具登记行（2026-11-03 笔-账绑定批 · 决策 37：**端覆写已删**）。
 * 改前本档持有一份 `isReadonlyAction` 装饰（六项平铺 + 六条子动作分支）；核 `thincoder-core/tools/git.mjs`
 * 补上同形钩子后，端覆写就是同一份名单的第二份拷贝，而 `tool?.isReadonlyAction?.(args) ?? …` 的优先级
 * 让端覆写吃掉核答案 ⇒ 两份必然漂移。删后 CLI ∥ desktop ∥ vscode 三面同答案，单源 = 核钩子。
 * 仍保留 `...coreGitTool` 展开（登记行留在端装配面，便于宿主侧后续加装饰面）。
 */
export const gitTool = { ...coreGitTool }

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
export { lintTool, lspTool, executeTool, questionTool, sshTool, readImageTool }
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
  websearchTool, fetchTool, questionTool, sshTool,
  repoOutlineTool, codeSearchTool, docSearchTool,
  lspTool, executeTool,
  memoryTool,
  ideTool, focusTool, // D-CC26：宿主 IDE 快照工具自 `context` 改名 `ide`（让名给核 `context` 工具——行为面零改）
  fileOpsTool, processTool, getCurrentTimeTool,
  waitForTool,
  treeTool,
  browserTool,
  peerInstancesTool, // R10 L2——只读（纯查询——不认领不写）
]
