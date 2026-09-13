/**
 * tools/lsp.mjs — LSP code intelligence tool (VS Code native implementation)
 * Uses the VS Code language service API instead of spawning language servers —
 * the editor's own language servers answer definition/references/hover/symbols/diagnostics,
 * so no per-server configuration or process management is needed.
 *
 * Subcommands mirror the CLI lsp tool: definition, references, hover, symbols, diagnostics.
 */
import * as vscode from "vscode"
import { join } from "node:path"
import { existsSync } from "node:fs"
import { DESC } from "./shared.mjs"

/** Resolve a workspace-relative path to a file URI; returns null when the file is missing. */
function resolveUri(cwd, p) {
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

export const lspTool = {
  name: "lsp",
  description: DESC("lsp"),
  parameters: {
    type: "object",
    properties: {
      subcommand: {
        type: "string",
        enum: ["definition", "references", "hover", "symbols", "diagnostics"],
        description: "LSP operation to perform",
      },
      uri: { type: "string", description: "Target file path (relative to project root)" },
      line: { type: "integer", description: "1-based line number (for definition/references/hover)" },
      character: { type: "integer", description: "1-based character offset (for definition/references/hover)" },
    },
    required: ["subcommand", "uri"],
  },
  readonly: true,

  async execute(args, ctx) {
    const cwd = ctx.cwd
    const fileUri = resolveUri(cwd, args.uri)
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
          return `Unknown subcommand: ${args.subcommand}`
      }
    } catch (err) {
      return `lsp error: ${err.message}`
    }
  },
}
