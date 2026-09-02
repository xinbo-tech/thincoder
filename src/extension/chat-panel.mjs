/**
 * chat-panel.mjs — ChatPanel class: webview panel, message routing, session management.
 * Extracted from extension.mjs to keep the entry point lean.
 * Split 2026-08-22 (500-line rule): session/project/index/MCP method implementations
 * live in panel-session.mjs / panel-project.mjs / panel-index.mjs / panel-mcp.mjs;
 * the same-named methods below are thin delegates, so every external caller
 * (panel-messages.mjs, panel-chat.mjs, permission-gate.mjs) is unaffected.
 */
import * as vscode from "vscode"
import { readFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { closeAllMcp } from "../mcp.mjs"
import { setSlotAutoApprove, setSlotPlanMode } from "./session-io.mjs"
import { providerStatus, saveProviderKey, saveCustomProvider, deleteProviderKey, pushStatus, fullStatus, agentSettings, proxySettings, shellCandidates, websearchSettings, saveMcpServer, deleteMcpServer } from "./settings.mjs"
import { loadLocaleStrings } from "../i18n.mjs"
import { handlePanelMessage, _cwd, setProjectFolder, clearProjectOverride } from "./panel-messages.mjs"
import { runPanelChat } from "./panel-chat.mjs"
import { loadRaw } from "../config-io.mjs"
import { initStopTrace } from "./stop-trace.mjs"
import { ensureSlot, activeData, activeHistory, activeLines, saveLines, loadModelPrefs, loadSession, loadOlder, newSession, deleteSession, pushSessions, generateTitle, status as bootstrapStatus } from "./panel-session.mjs"
import { projectInfo, pushProject, applyProjectSwitch, onProjectChanged, pickProject } from "./panel-project.mjs"
import { pushIndexStatus, atComplete, saveEmbeddingConfig, maybePromptIndex, buildIndex } from "./panel-index.mjs"
import { pushMcpStatus, reconnectMcp, editMcp, testMcp } from "./panel-mcp.mjs"

const __dirname = dirname(fileURLToPath(import.meta.url))

export class ChatPanel {
  /** @param {vscode.ExtensionContext} context */
  constructor(context) {
    this._context = context
    this._panel = null

    this._abortController = null
    this._distillController = null  // async distillation abort (SEND-STALL-DISTILL): aborted ONLY on dispose / session switch, never per turn
    this._permissionQueue = []
    // Live autoApprove flag for the current turn — approve-all / the AUTO toolbar
    // button flip it MID-TURN (via _setAutoApprove); the permission gate re-checks
    // it on every invocation because runAgent's startup snapshot cannot change.
    this._autoApprove = false
    this._questionQueue = []  // pending inline question-tool prompts (panel, not native popups)
    this._statusBar = null    // status-bar run indicator (idle/running/waiting)
    this._turnActive = false  // an agent turn is running (drives the status indicator)
    // §17 挂起（suspension.mjs / panel-chat.mjs，2026-09-02）：
    // _susp/_suspWake 由 suspensionSession 建/清（会话句柄 + 单槽唤醒器）；
    // _suspPending/_suspQueue = 释放窗口守卫（偏差修复 #2——回合尾已登记挂起、会话未建立
    // （generateTitle await 窗口）期间 _chat 入队等待会话接管）；
    // _turnControllers = 回合内 controller 重建登记（偏差修复 #3——会话 Stop 统一 abort）。
    this._suspPending = false
    this._suspQueue = null
    this._turnControllers = []
    // The slot number this panel is bound to. Set once when a session is opened/created,
    // then used for ALL reads and writes — we never re-read the shared manifest's active
    // pointer mid-conversation (it can be changed by a concurrently running CLI).
    this._slot = null

    // Follow-active-file project switching (multi-root): when the setting is on and the
    // active editor's folder differs from the current project, switch automatically.
    // Guarded by _turnActive — never yank the cwd out from under a running turn.
    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (!editor) return
      try {
        const follow = vscode.workspace.getConfiguration("thincoder.project").get("followActiveEditor", false)
        if (!follow) return
        const folder = vscode.workspace.getWorkspaceFolder(editor.document.uri)
        if (!folder || folder.uri.fsPath === _cwd() || this._turnActive) return
        const r = setProjectFolder(folder.uri.fsPath)
        if (r.ok) this._onProjectChanged().catch((e) => console.error("[chat-panel] project switch failed:", e.message))
      } catch (e) {
        console.error("[chat-panel] follow-active-file switch failed:", e.message)
      }
    }))

    // If the overridden project folder is removed from the workspace, fall back to
    // workspaceFolders[0] (a stale cwd would point agent runs at a dead directory).
    context.subscriptions.push(vscode.workspace.onDidChangeWorkspaceFolders(() => {
      const folders = vscode.workspace.workspaceFolders ?? []
      const cwd = _cwd()
      if (!cwd || folders.some((f) => f.uri.fsPath === cwd)) return
      clearProjectOverride()
      this._onProjectChanged().catch((e) => console.error("[chat-panel] project fallback failed:", e.message))
    }))
  }

  // ─── WebviewViewProvider ─────────────────────────

  /**
   * Called by VS Code when the sidebar view becomes visible.
   * Sets up the webview HTML, message listener, and initial state.
   * @param {vscode.WebviewView} webviewView
   * @param {vscode.WebviewViewResolveContext} _context
   * @param {vscode.CancellationToken} _token
   */
  resolveWebviewView(webviewView, _context, _token) {
    this._panel = webviewView
    webviewView.webview.options = {
      enableScripts: true,
      retainContextWhenHidden: true,
    }

    webviewView.onDidDispose(() => {
      this._panel = null
      this._abortController?.abort()
      this._distillController?.abort()  // kill any in-flight async distillation — it belongs to the dying view
      closeAllMcp()
    })

    webviewView.webview.html = this._html()
    webviewView.webview.postMessage({ type: "i18n", strings: loadLocaleStrings(vscode.env.language) })
    initStopTrace(this._context, vscode)

    webviewView.webview.onDidReceiveMessage((msg) => {
      handlePanelMessage(this, msg).catch((e) => console.error("[chat-panel] message handler:", e.message))
    })

    this._initStatusBar()
    this._status()
  }

  // ─── Status bar (run-state awareness outside the panel) ───

  _initStatusBar() {
    if (this._statusBar) return
    this._statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100)
    this._statusBar.name = "ThinCoder"
    this._statusBar.tooltip = "ThinCoder — click to open the chat panel"
    this._statusBar.command = "thincoder.openChat"
    this._setStatus("idle")
    this._statusBar.show()
  }

  /** running = agent turn active; waiting = permission/question prompt pending. */
  _setStatus(state) {
    if (!this._statusBar) return
    if (state === "running") {
      this._statusBar.text = "$(sync~spin) ThinCoder"
      this._statusBar.backgroundColor = undefined
    } else if (state === "waiting") {
      this._statusBar.text = "$(warning) ThinCoder: waiting for your input"
      this._statusBar.backgroundColor = new vscode.ThemeColor("statusBarItem.warningBackground")
    } else {
      this._statusBar.text = "$(hubot) ThinCoder"
      this._statusBar.backgroundColor = undefined
    }
  }

  /** Waiting prompts beat running; without pending prompts, fall back to turn state. */
  _refreshStatus() {
    if (this._permissionQueue.length > 0 || this._questionQueue.length > 0) { this._setStatus("waiting"); return }
    this._setStatus(this._turnActive ? "running" : "idle")
  }

  sendMessage(text) {
    if (this._panel) {
      this._panel.webview.postMessage({ type: "userMessage", text })
      this._chat(text)
    } else {
      vscode.window.showWarningMessage("ThinCoder panel is not ready yet — please wait a moment and try again.")
    }
  }

  dispose() {
    closeAllMcp()
    this._abortController?.abort()
    this._distillController?.abort()  // in-flight async distillation belongs to the dying panel (SEND-STALL-DISTILL)
    // §17: a live suspension session dies with the panel — abort the session controller
    // AND the entering turn's full controller set (偏差修复 #3: children spawned under
    // rebuilt controllers would otherwise escape; their settles then no-op on the
    // aborted signal).
    this._susp?.abortControllers?.forEach((c) => c.abort())
    this._susp?.abort?.abort()
    this._statusBar?.dispose()
    this._statusBar = null
    this._panel?.dispose()
  }

  // ─── Session (implementations in panel-session.mjs) ───

  _ensureSlot() { return ensureSlot(this) }
  _activeData() { return activeData(this) }
  _activeHistory() { return activeHistory(this) }
  _activeLines() { return activeLines(this) }
  _saveLines(fullHistory, contextHistory, extra = {}, slotOverride) { return saveLines(this, fullHistory, contextHistory, extra, slotOverride) }
  _loadModelPrefs() { return loadModelPrefs(this) }
  _loadSession() { return loadSession(this) }
  _loadOlder(before) { return loadOlder(this, before) }
  async _newSession() { return newSession(this) }
  async _deleteSession(slot) { return deleteSession(this, slot) }
  _pushSessions() { return pushSessions(this) }
  async _generateTitle(slotOverride) { return generateTitle(this, slotOverride) }
  async _status() { return bootstrapStatus(this) }

  // ─── Project (implementations in panel-project.mjs) ───

  _projectInfo() { return projectInfo(this) }
  _pushProject() { return pushProject(this) }
  async _applyProjectSwitch(fsPath) { return applyProjectSwitch(this, fsPath) }
  async _onProjectChanged() { return onProjectChanged(this) }
  async _pickProject() { return pickProject(this) }

  // ─── MCP (implementations in panel-mcp.mjs) ───

  _pushMcpStatus() { return pushMcpStatus(this) }
  async _reconnectMcp(name) { return reconnectMcp(this, name) }
  _editMcp(name, config) { return editMcp(this, name, config) }
  async _testMcp(name) { return testMcp(this, name) }

  // ─── Settings ─────────────────────────────────

  _providerStatus() { return providerStatus() }
  async _saveProviderKey(name, key) { await saveProviderKey(name, key); this._pushStatus() }
  async _saveCustomProvider(config) { await saveCustomProvider(config); this._pushStatus() }
  async _deleteProviderKey(name) { await deleteProviderKey(name); this._pushStatus() }
  _saveMcpServer(name, config) { return saveMcpServer(name, config) }
  _deleteMcpServer(name) { return deleteMcpServer(name) }

  async _setAutoApprove(value) {
    this._autoApprove = value  // mid-turn source of truth for the permission gate
    // Session-level persistence (CLI parity): autoApprove lives in the slot file shared
    // with the CLI — NOT in VS Code settings.json. Workspace-scope overrides of the old
    // `thincoder.autoApprove` setting are gone with it (the setting is removed).
    try {
      setSlotAutoApprove(_cwd(), this._ensureSlot(), value)
    } catch { /* slot unwritable — the live flag still governs this turn */ }
  }

  /** Toggle plan mode (session-level, like autoApprove). Persists to the slot so the
   *  toolbar button and the model's own plan tool stay in sync across turns. */
  async _setPlanMode(value) {
    try {
      setSlotPlanMode(_cwd(), this._ensureSlot(), value)
    } catch { /* slot unwritable — the flag still governs this turn */ }
    this._panel?.webview.postMessage({ type: "planMode", active: value })
  }

  _pushStatus() {
    pushStatus(this._panel)
  }

  /** Settings snapshot push WITHOUT the provider-model network probe (fullStatus).
   *  Used for save acknowledgements — the panel already shows what the user typed;
   *  a full re-probe would rebuild the settings panel and drop in-progress edits. */
  _pushSettingsLight() {
    // Snapshot-only (no network probe) — but the snapshot must be COMPLETE: providerStatus
    // (per-provider proxy checkboxes revert without it) and shellCandidates WITH current
    // (the webview nulls the shell value when current is missing).
    pushStatus(this._panel)
    this._panel?.webview.postMessage({ type: "agentSettings", settings: agentSettings(this._agentSettingsSession()) })
    this._panel?.webview.postMessage({ type: "proxySettings", settings: proxySettings() })
    this._panel?.webview.postMessage({ type: "websearchSettings", settings: websearchSettings() })
    this._panel?.webview.postMessage({ type: "shellCandidates", candidates: shellCandidates(), current: loadRaw().shell ?? null })
  }

  _pushSettings() {
    fullStatus(this._panel)
    this._panel?.webview.postMessage({ type: "agentSettings", settings: agentSettings(this._agentSettingsSession()) })
    this._panel?.webview.postMessage({ type: "proxySettings", settings: proxySettings() })
    this._panel?.webview.postMessage({ type: "websearchSettings", settings: websearchSettings() })
    this._panel?.webview.postMessage({ type: "shellCandidates", candidates: shellCandidates(), current: loadRaw().shell ?? null })
    this._pushMcpStatus()
    this._pushIndexStatus()
  }

  /** Session reference for the agentSettings snapshot: engineering/advisor.guard are
   *  session-level (slot authority) — the ENG/GUARD buttons must reflect the session,
   *  not global config. Unbound panel (no slot yet) → null → config fallback. */
  _agentSettingsSession() {
    try {
      const slot = this._slot ?? this._ensureSlot()
      return slot != null ? { cwd: _cwd(), slot } : null
    } catch { return null }
  }

  // ─── Index (implementations in panel-index.mjs) ───

  _pushIndexStatus() { return pushIndexStatus(this) }
  async _atComplete(query, cwd) { return atComplete(this, query, cwd) }
  async _saveEmbeddingConfig(config) { return saveEmbeddingConfig(this, config) }
  async _maybePromptIndex() { return maybePromptIndex(this) }
  async _buildIndex() { return buildIndex(this) }

  // ─── Chat ─────────────────────────────────────

  async _chat(text, modelOverride, reasoning, providerName, images) {
    // §17 D-S4/D-S5: while a suspension session is active the message goes to the
    // driver's queue — input during a digest queues (auto-continues after the digest
    // ends), input while waiting wakes the driver for immediate processing. Never
    // launches a concurrent independent turn (it would reload the lines from disk and
    // orphan the background pool).
    const susp = this._susp
    if (susp?.active) {
      susp.pendingInput.push({ text, modelOverride, reasoning, providerName, images })
      // 唤醒走 panel._suspWake 单槽（waitForSettleOrWake 在纯等待期注入；digest/回合执行期
      // 为 null → no-op——排队消息由驱动轮末 pendingInput 检查接走）。susp.wake 曾是死字段
      // （2026-09-02 偏差修复 #4 已从 suspension.mjs 删除——唤醒槽单槽化至 _suspWake，
      // 历史说明见 ARCHITECTURE.md「挂起唤醒断链修复」段）。
      this._suspWake?.()
      return
    }
    // §17 D-S2 释放窗口（2026-09-02 偏差修复 #2）：回合尾已登记挂起（_suspPending）但会话
    // 尚未建立（generateTitle await 窗口，可达秒级）——消息入队等待会话接管，不得开并发
    // 独立回合：新回合从磁盘重载 lines（孤儿化池）+ abort 外回合 controller（池 children
    // 全中止 → 僵尸挂起或结果丢失，AC-S2）。队列由 runPanelChat 回合尾消费（带队列进会话
    // / 无会话则普通回合兜底）——入队消息零丢失。
    if (this._suspPending) {
      (this._suspQueue ??= []).push({ text, modelOverride, reasoning, providerName, images })
      return
    }
    await runPanelChat(this, { text, modelOverride, reasoning, providerName, images })
  }

  // ─── HTML ─────────────────────────────────────

  _html() {
    let html = readFileSync(join(__dirname, "..", "..", "webview", "index.html"), "utf8")
    const csp = this._panel.webview.cspSource
    html = html.replace("__CSP__",
      `default-src 'none'; style-src ${csp} 'unsafe-inline'; script-src ${csp} 'unsafe-inline'; img-src ${csp} https: data:; font-src ${csp}; connect-src ${csp};`)
    html = html.replace("__CSS_BASE_URI__", this._panel.webview.asWebviewUri(vscode.Uri.file(join(__dirname, "..", "..", "webview", "base.css"))).toString())
    html = html.replace("__CSS_CHAT_URI__", this._panel.webview.asWebviewUri(vscode.Uri.file(join(__dirname, "..", "..", "webview", "chat.css"))).toString())
    html = html.replace("__CSS_CONTROLS_URI__", this._panel.webview.asWebviewUri(vscode.Uri.file(join(__dirname, "..", "..", "webview", "controls.css"))).toString())
    html = html.replace("__CSS_SESSION_URI__", this._panel.webview.asWebviewUri(vscode.Uri.file(join(__dirname, "..", "..", "webview", "session.css"))).toString())
    html = html.replace("__CSS_SETTINGS_URI__", this._panel.webview.asWebviewUri(vscode.Uri.file(join(__dirname, "..", "..", "webview", "settings.css"))).toString())
    html = html.replace("__CHAT_URI__", this._panel.webview.asWebviewUri(vscode.Uri.file(join(__dirname, "..", "..", "webview", "chat.js"))).toString())
    return html
  }
}
