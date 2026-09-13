/**
 * editor-context.mjs — inject active editor content into the MACHINE line only.
 * Automatic context (current file) must never pollute the human-readable record
 * or the session restore display — it is a machine-only injection (transient),
 * pushed to history without going through pushReal (CLI parity).
 */

import * as vscode from "vscode"

/** Strip a legacy [Current file: ...] injection appended to a user message (pre-fix sessions). */
const EDITOR_INJECTION_RE = /\n\n\[Current file: [\s\S]*?\]$/
export function stripEditorInjection(content) {
  return content.replace(EDITOR_INJECTION_RE, "")
}

/**
 * Read active editor and build a machine-only injection message.
 * Returns { role: "user", content, transient: true } or null when no editor/file.
 * runAgent pushes it to the machine line BEFORE the user input.
 */
export function collectEditorInjection(cwd) {
  const activeEditor = vscode.window.activeTextEditor
  if (!activeEditor || !activeEditor.document.uri.fsPath.startsWith(cwd)) return null

  const relPath = activeEditor.document.uri.fsPath.slice(cwd.length + 1)
  const selection = activeEditor.selection
  const doc = activeEditor.document
  const hasSelection = !selection.isEmpty
  const contextText = hasSelection
    ? doc.getText(selection).slice(0, 3000)
    : doc.getText().slice(0, 3000)
  if (!contextText) return null

  const rangeInfo = hasSelection
    ? `lines ${selection.start.line + 1}-${selection.end.line + 1}`
    : `full file (first 3000 chars)`
  return {
    role: "user",
    content: `[Current file: ${relPath} (${rangeInfo})\n\`\`\`\n${contextText}\n\`\`\`]`,
    transient: true,
  }
}
