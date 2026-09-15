/**
 * extension.mjs — ThinCoder VS Code Extension entry point
 * Registers ChatPanel as a WebviewViewProvider (sidebar on the right).
 */
import * as vscode from "vscode"
import { configurePromptInjections } from "@thincoder/core/prompt-files.mjs"
import { ChatPanel } from "./src/extension/chat-panel.mjs"
import { closeAllMcp } from "./src/mcp.mjs"
import { initLocale } from "./src/i18n.mjs"
import { registerDiffPreviewProvider } from "./src/extension/diff-preview.mjs"
import { startConfigWatch } from "./src/extension/config-watch.mjs"
import { VSC_PROMPT_INJECTIONS } from "./src/prompt-injections.mjs"

/** @type {ChatPanel} */
let _panel

// ─── Engine-floor guard (W8 pre-pen · ruling 2026-09-15: engines.vscode ^1.104.0) ───
// The core memory face speaks node:sqlite (Node.js >= 22.13); below the floor the
// extension reports it and turns the memory face off — no downgrade path (A13).

/** Node.js floor [major, minor] — node:sqlite is unflagged since 22.13 / 23.4. */
const NODE_FLOOR = [22, 13]

let _memoryFaceEnabled = false // fail-closed until applyEngineFloorGuard() lands the real state

/** true when `version` (default: the running Node.js) meets the 22.13 floor. */
export function nodeFloorMet(version = process.versions.node) {
  const [major, minor] = String(version).split(".").map(Number)
  return major > NODE_FLOOR[0] || (major === NODE_FLOOR[0] && minor >= NODE_FLOOR[1])
}

/** Runtime floor check: version gate + `node:sqlite` loadable; never throws.
 *  `loadSqlite` = probe seam (tests inject a failing probe for the Electron-without-sqlite case). */
export async function engineFloorMet({ version = process.versions.node, loadSqlite = () => import("node:sqlite") } = {}) {
  if (!nodeFloorMet(version)) return false
  try {
    await loadSqlite()
    return true
  } catch {
    return false
  }
}

/** Memory-face switch — W8's memory wiring reads this before creating the memory handle
 *  (and before loading any core module that statically imports node:sqlite). */
export function isMemoryFaceEnabled() {
  return _memoryFaceEnabled
}

/** activate() first-step guard. Below the floor: clear notice + memory face off; never
 *  throws — the rest of the extension keeps working. Returns the floor state. */
export async function applyEngineFloorGuard(options) {
  try {
    _memoryFaceEnabled = await engineFloorMet(options)
  } catch {
    _memoryFaceEnabled = false // unknown host state → treat as below floor; activation must not fail
  }
  if (_memoryFaceEnabled) return true

  const version = options?.version ?? process.versions.node
  console.warn(`[thincoder] engine floor not met (Node.js ${version}) — memory face disabled`)
  try {
    vscode.window
      .showErrorMessage(
        `ThinCoder: unsupported host runtime — VS Code 1.104+ (Node.js 22.13+ with node:sqlite) is required; this host runs Node.js ${version}. ` +
          "Memory features are disabled; the rest of ThinCoder keeps working.",
      )
      .then(undefined, logFireAndForget)
  } catch {
    /* the notice is best-effort — activation itself must never fail */
  }
  return false
}

export async function activate(context) {
  // W2 入口注入接线（CORE-UNIFICATION §2.13.2「VSC 列」· §2.13.8（六））：任何装配之前注册
  // 本端 13 名锚取值表——替换在四装配面**调用期**应用（§2.13.8）⇒ 此为唯一顺序要求；
  // 未注册 ⇒ 锚字面静默进模型（fail-loud 只在已注册而缺键时生效）。
  configurePromptInjections(VSC_PROMPT_INJECTIONS)
  console.warn("[thincoder] activate starting, globalStorageUri =", context.globalStorageUri?.fsPath)
  // W8 pre-pen engine-floor guard (A8 ruling 2026-09-15) — first step; never throws.
  await applyEngineFloorGuard()
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
