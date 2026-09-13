/**
 * diff-preview.mjs — open a permission-prompt diff in the editor's NATIVE diff
 * viewer (syntax highlighted, scrollable, reviewable) instead of the cramped
 * in-card line preview. Proposed content is served from a virtual document
 * provider; the real file is never touched.
 */
import * as vscode from "vscode"

const store = new Map()
let seq = 0

/** Register the thincoder-diff: content provider. Call once from activate(). */
export function registerDiffPreviewProvider(context) {
  context.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider("thincoder-diff", {
    provideTextDocumentContent: (uri) => store.get(uri.toString()) ?? "",
  }))
}

/** Open the diff (from a permissionRequest's diffInfo) in the native diff editor. */
export async function openDiffPreview(diff) {
  if (!diff) return
  // apply_patch payloads: the unified patch IS the readable form — open as a diff doc.
  if (diff.patch != null) {
    const doc = await vscode.workspace.openTextDocument({ language: "diff", content: diff.patch })
    await vscode.window.showTextDocument(doc, { preview: true })
    return
  }
  const id = ++seq
  const label = String(diff.path || "file").split(/[\\/]/).pop()
  // Side is path-encoded (not query) — Uri normalization can drop query strings.
  const oldUri = vscode.Uri.parse(`thincoder-diff:/${id}/old/${label}`)
  const newUri = vscode.Uri.parse(`thincoder-diff:/${id}/new/${label}`)
  store.set(oldUri.toString(), diff.old ?? "")
  store.set(newUri.toString(), diff.new ?? "")
  await vscode.commands.executeCommand("vscode.diff", oldUri, newUri, `${label} (proposed change)`)
}
