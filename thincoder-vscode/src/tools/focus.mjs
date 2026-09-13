/**
 * tools/focus.mjs — let the agent actively drive the editor: open a file and move
 * the cursor to a line/column. Bidirectional interaction (agent → IDE), so the user
 * can SEE exactly where the agent is working or where a change should land.
 */
import * as vscode from "vscode"
import { existsSync } from "node:fs"
import { resolvePath } from "./shared.mjs"

export const focusTool = {
  name: "focus",
  readonly: true,
  description:
    "Open a file in the editor and move the cursor to a line/column, so the user can SEE where you're " +
    "working or where a change should go. You are in the VS Code side panel — use this to point the user " +
    "at a location: reveal a file you just edited, navigate to a fix site, or show where to type next.\n" +
    "Parameters:\n" +
    "- uri (required): target file path (relative to project root, or absolute)\n" +
    "- line: 1-based line number to place the cursor (optional)\n" +
    "- character: 1-based column to place the cursor (optional)",
  parameters: {
    type: "object",
    properties: {
      uri: { type: "string", description: "Target file path (relative to project root, or absolute)" },
      line: { type: "integer", description: "1-based line number to place the cursor" },
      character: { type: "integer", description: "1-based column to place the cursor" },
    },
    required: ["uri"],
  },

  async execute(args, ctx) {
    if (typeof args.uri !== "string" || !args.uri.trim()) return "focus error: uri required"
    const abs = resolvePath(args.uri.trim(), ctx.cwd)
    if (!existsSync(abs)) return `focus error: file not found: ${args.uri}`

    try {
      const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(abs))
      const ed = await vscode.window.showTextDocument(doc, { preview: true })
      if (args.line) {
        const line = Math.max(1, Number(args.line))
        const col = Math.max(1, Number(args.character ?? 1))
        const pos = new vscode.Position(line - 1, col - 1)
        ed.selection = new vscode.Selection(pos, pos)
        ed.revealRange(new vscode.Range(pos, pos), 2 /* InCenter */)
      }
      return `Opened and focused: ${abs}` + (args.line ? ` @ L${args.line}${args.character ? ":" + args.character : ""}` : "")
    } catch (err) {
      return `focus error: ${err.message}`
    }
  },
}
