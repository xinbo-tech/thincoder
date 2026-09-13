/**
 * extension.mjs — ThinCoder VS Code Extension entry point
 * Registers ChatPanel as a WebviewViewProvider (sidebar on the right).
 */
import * as vscode from "vscode"
import { ChatPanel } from "./src/extension/chat-panel.mjs"
import { closeAllMcp } from "./src/mcp.mjs"
import { initLocale } from "./src/i18n.mjs"
import { registerDiffPreviewProvider } from "./src/extension/diff-preview.mjs"
import { startConfigWatch } from "./src/extension/config-watch.mjs"

/** @type {ChatPanel} */
let _panel

export async function activate(context) {
  console.warn("[thincoder] activate starting, globalStorageUri =", context.globalStorageUri?.fsPath)
  initLocale(vscode.env.language)
  _panel = new ChatPanel(context)

  // Status bar item
  const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100)
  statusBar.command = "thincoder.openChat"
  statusBar.text = "$(hubot) ThinCoder"
  statusBar.tooltip = "Focus ThinCoder Chat"
  statusBar.show()
  _panel._statusBar = statusBar
  context.subscriptions.push(statusBar)

  // Register sidebar webview provider
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider("thincoder.chat", _panel, {
      webviewOptions: { retainContextWhenHidden: true },
    }),
  )

  // Virtual documents for the native diff preview (permission prompts)
  registerDiffPreviewProvider(context)

  // External config.json writes (CLI `/advisor`, `settings set`, manual edits) — file-system
  // event → debounce → stat-tuple diff → light settings push (B5 batch 21; SETTINGS.md §2.6).
  // Self-write suppression is wired inside the module (config-io `onConfigSelfWrite`), so a
  // panel save never re-renders the panel under the user's cursor.
  context.subscriptions.push(
    startConfigWatch({ onChange: () => _panel?._pushSettingsLight?.() }),
  )

  // Auto-show sidebar on first activation
  vscode.commands.executeCommand("workbench.view.extension.thincoder").catch(logFireAndForget)

  // Commands
  context.subscriptions.push(
    vscode.commands.registerCommand("thincoder.openChat", () => {
      // Focus the ThinCoder view container (sidebar)
      vscode.commands.executeCommand("workbench.view.extension.thincoder").catch(logFireAndForget)
    }),
    vscode.commands.registerCommand("thincoder.sendMessage", () => {
      vscode.commands.executeCommand("workbench.view.extension.thincoder").catch(logFireAndForget)
      vscode.window.showInputBox({ placeHolder: "Ask ThinCoder..." }).then((text) => {
        if (text) return _panel.sendMessage(text) // return so its rejection joins the chain → caught below (advisory #1)
      }).catch(logFireAndForget)
    }),
    vscode.commands.registerCommand("thincoder.setup", () => {
      vscode.commands.executeCommand("workbench.view.extension.thincoder").catch(logFireAndForget)
      _panel._pushSettings()
    }),
    vscode.commands.registerCommand("thincoder.askSelection", () => {
      const editor = vscode.window.activeTextEditor
      if (!editor) return
      const selection = editor.document.getText(editor.selection)
      if (!selection) return
      vscode.commands.executeCommand("workbench.view.extension.thincoder").catch(logFireAndForget)
      _panel.sendMessage(selection).catch(logFireAndForget)
    }),
    // Internal-only: invoked from the settings webview (build index button); intentionally
    // not in contributes.commands — not a user-facing command-palette entry.
    vscode.commands.registerCommand("thincoder.buildIndex", () => _panel._buildIndex().catch(logFireAndForget)),
  )
}

/** Surface a fire-and-forget rejection instead of letting it float as an
 *  unhandledRejection in the extension host (which the user would only see as a
 *  generic "ERROR:" browser log). This is diagnostics-only — it does not swallow
 *  the error, so the host's own reporting still sees it. */
function logFireAndForget(err) {
  console.error("[thincoder] async command failed:", err)
}

export function deactivate() {
  closeAllMcp()
  _panel?.dispose()
}
