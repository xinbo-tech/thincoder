/**
 * panel-messages.mjs — ChatPanel webview message router (split out of chat-panel.mjs).
 * Every `case` dispatches to a ChatPanel method or a settings/provider helper.
 */
import * as vscode from "vscode"
import { t, loadLocaleStrings } from "../i18n.mjs"
import { saveModelPrefs, switchToSlot, setSlotTitle, setSlotAdvisorGuard, setSlotEngineering, slotOccupancy } from "./session-io.mjs"
import { handleAddProvider, handleRemoveProvider, handleSetProviderProxy, agentSettings, saveAgentSettingsFromPanel, saveProxySettingsFromPanel, testProxyConnection, shellCandidates, saveShellSettingsFromPanel, saveWebsearchKeyFromPanel, deleteWebsearchKeyFromPanel, testProviderConnection } from "./settings.mjs"
import { PRESETS } from "./presets.mjs"
import { addProviderFlow, removeProviderFlow, setKeyFlow } from "./provider-flows.mjs"
import { selectProviderModel, loadRaw, loadMcpServers } from "../config-io.mjs"
import { openDiffPreview } from "./diff-preview.mjs"
import { traceStop } from "./stop-trace.mjs"
import { savePastedImages } from "./image-handler.mjs"

/** Current workspace folder (or process cwd) — shared with chat-panel. */
let _cwdOverride = null
export const _cwd = () => _cwdOverride ?? (vscode.workspace.workspaceFolders?.[0]?.uri?.fsPath || process.cwd())

/**
 * Switch the "current project" (agent cwd) in a multi-root workspace.
 * fsPath must be one of workspaceFolders — anything else is rejected.
 * Returns { ok } or { ok:false, error }.
 */
export function setProjectFolder(fsPath) {
  const folders = vscode.workspace.workspaceFolders ?? []
  if (!folders.some((f) => f.uri.fsPath === fsPath)) {
    return { ok: false, error: `Not a workspace folder: ${fsPath}` }
  }
  _cwdOverride = fsPath
  return { ok: true }
}

/** Drop the override — _cwd() falls back to workspaceFolders[0] again. */
export function clearProjectOverride() {
  _cwdOverride = null
}

/**
 * Handle one webview message. `panel` is the ChatPanel instance — its methods
 * (session mgmt, chat, settings push) stay in the class; this router only switches.
 */
export async function handlePanelMessage(panel, msg) {
  switch (msg.type) {
    case "userMessage": {
      const text = msg.text || ""
      // Plan B (GitHub thincoder#3): the webview sends pasted images as base64
      // dataURLs; the EXTENSION saves them to <cwd>/.thincoder/tmp/paste-*.<ext>
      // and passes absolute PATHS downstream. The field stays `images` (wire
      // compat), but from here on it carries paths — setupAgentRun appends the
      // "[Attached images: ...]" pointer and the model views them via read_image.
      const images = Array.isArray(msg.images) && msg.images.length > 0
        ? savePastedImages(msg.images, _cwd())
        : undefined
      panel._chat(text, msg.model, msg.reasoning, msg.provider, images)
      break
    }
    case "selectModel": {
      const prefs = panel._loadModelPrefs()
      prefs.model = msg.model
      prefs.provider = msg.provider || ""
      saveModelPrefs(panel._context.workspaceState, prefs)
      // Persist into the shared config.json too (CLI selectModel semantics): the CLI
      // resumes this session with activeProvider/activeModel, so the selection must
      // survive the panel, not just the workspaceState prefs.
      if (msg.provider && msg.model) {
        try { selectProviderModel(msg.provider, msg.model) } catch {}
      }
      break
    }
    case "selectReasoning": {
      const prefs = panel._loadModelPrefs()
      prefs.reasoning = msg.reasoning
      saveModelPrefs(panel._context.workspaceState, prefs)
      break
    }
    case "newSession":
      // §17: session switch during a suspension session would orphan the background pool
      // (its lines/pool belong to the current session). Stop the session first.
      if (panel._susp?.active) { vscode.window.showWarningMessage("ThinCoder: background subagents are still running — stop them before starting a new session."); break }
      panel._newSession(); break
    case "switchSession": {
      // 会话切换竞态守卫（GitHub #2/#5，2026-08-28）：运行中禁止切换——此前只改 _slot 指针
      // 不 abort，旧 turn 的 stream/complete/标题会灌进新会话视图（"思考串台"）、内容落错槽
      // （"写错会话文件"）。与 applyProjectSwitch（panel-project.mjs）的运行中拒绝同模式。
      // §17：挂起会话（后台子代理 + 待消化结果）同属运行中守卫。
      if (panel._turnActive || panel._susp?.active) {
        vscode.window.showWarningMessage("ThinCoder: a task is running — stop it before switching sessions.")
        break
      }
      // 交付评审 🔵#5：manifest 漂移（槽不存在）时 switchToSlot 返回 null 且不切指针——
      // 此时不得把面板绑到幻影槽（否则渲染出空会话）。
      const target = switchToSlot(_cwd(), msg.slot)  // persists the shared active pointer for CLI interop
      if (target == null) break
      // 2026-09-01 advisor round2 🟡：目标槽被另一活进程（CLI/另一实例）占用时不得钉槽——
      // 面板 _slot 粘性会绕过 activeSlot 的认领决策，双方写同一槽静默互覆盖。占用 →
      // 不钉（_slot 保持 null）+ 提示。注意：loadSession 会在 load 时立即经 ensureSlot
      // 认领新槽（不是"下次保存才 fork"）——文案与实际行为对齐。
      const occ = slotOccupancy(_cwd(), msg.slot)
      if (occ.occupied) {
        vscode.window.showWarningMessage(`ThinCoder: session ${msg.slot} is being used by another live process — a new empty session has been created for you here.`)
        panel._slot = null
      } else {
        panel._slot = msg.slot          // bind this panel to the chosen slot
      }
      await panel._loadSession()
      break
    }
    case "deleteSession": {
      if (panel._susp?.active) { vscode.window.showWarningMessage("ThinCoder: background subagents are still running — stop them before deleting a session."); break }
      await panel._deleteSession(msg.slot); break
    }
    case "renameSession": {
      // Manual rename: prefill the current title; empty input = cancel (keep old title).
      const title = await vscode.window.showInputBox({
        prompt: t("session.renamePrompt"),
        value: msg.currentTitle || "",
        placeHolder: t("session.renamePlaceholder"),
        validateInput: (v) => (v.length > 60 ? t("session.renameTooLong") : null),
      })
      if (!title || !title.trim()) break
      setSlotTitle(_cwd(), msg.slot, title.trim())
      panel._pushSessions()
      break
    }
    case "setProject": {
      // §17: project switch mid-suspension would yank cwd out from under the session —
      // the suspension lines/slot belongs to the old project's session store.
      if (panel._susp?.active) { vscode.window.showWarningMessage("ThinCoder: background subagents are still running — stop them before switching projects."); break }
      // Current-project switcher (multi-root): with fsPath → switch directly;
      // without → show the native folder picker.
      if (msg.fsPath) await panel._applyProjectSwitch(msg.fsPath)
      else await panel._pickProject()
      break
    }
    case "retry": {
      const history = panel._activeHistory()
      const lastUser = [...history].reverse().find((m) => (m.type ?? m.role) === "user")
      if (lastUser) panel._chat(lastUser.content, undefined, undefined, lastUser.provider)
      break
    }
    case "abort":
      panel._stopClickTs = Date.now()
      traceStop("click received — abort() called", panel._stopClickTs)
      // §17 D-S9: Stop during a suspension session aborts the WHOLE background session
      // (CLI Ctrl+C parity — digests' own per-turn controllers only kill the digest):
      // session controller (pool children) + current turn controller + wake the driver.
      // 偏差修复 #3: 统一 abort 进入回合的全部 controller（abortControllers）——Ctrl+I /
      // ContinueError 重建后持旧 controller signal 的池 children 一并中止（否则跑完整个
      // turn 预算 + mergeChildMutations 写父 guard 标记——磁盘被改、advisor/verify 门被绕过）。
      if (panel._susp?.active) {
        panel._susp.aborted = true
        panel._susp.abortControllers?.forEach((c) => c.abort())
        panel._susp.abort?.abort()
        panel._abortController?.abort()
        panel._suspWake?.()
      } else {
        panel._abortController?.abort()
      }
      break
    // Ctrl+I inject (CLI parity): abort with an interrupt reason — the agent loop
    // commits partial output, injects the message, and resumes from the same context.
    case "interrupt": panel._stopClickTs = Date.now(); traceStop("interrupt received", panel._stopClickTs); panel._abortController?.abort({ interrupt: true, message: msg.message }); break
    // Clickable file paths in tool cards — open in the editor, at the line if given.
    case "openFile": {
      try {
        const doc = await vscode.workspace.openTextDocument(msg.path)
        const ed = await vscode.window.showTextDocument(doc, { preview: true })
        if (msg.line) {
          const pos = new vscode.Position(msg.line - 1, 0)
          ed.selection = new vscode.Selection(pos, pos)
          ed.revealRange(new vscode.Range(pos, pos), 2 /* InCenter */)
        }
      } catch (e) { console.error("[openFile] failed:", e.message) }
      break
    }
    // Permission prompt: open a large diff in the editor's native diff viewer.
    case "openDiff": await openDiffPreview(msg.diff); break
    case "loadOlder": panel._loadOlder(msg.before); break
    case "questionResponse": {
      const entry = panel._questionQueue.shift()
      entry?.resolve(msg.answer ?? null)  // null → tool returns "(user cancelled)"
      panel._refreshStatus()
      break
    }
    case "setAutoApprove": await panel._setAutoApprove(!!msg.value); break
    case "atComplete": await panel._atComplete(msg.query, msg.cwd); break
    case "permissionResponse": {
      const entry = panel._permissionQueue.shift()
      if (msg.approved === "approveAll") {
        panel._permissionQueue.forEach((e) => e.resolve(true))
        panel._permissionQueue.length = 0
        await panel._setAutoApprove(true)
        panel._panel?.webview.postMessage({ type: "autoApprove", value: true })
      }
      entry?.resolve(msg.approved === "approveAll" ? true : !!msg.approved)
      panel._refreshStatus()
      break
    }
    case "batchPermissionResponse": {
      // §16 D-B1: merged ask — approveAll / oneByOne / deny (deny → whole batch refused,
      // no second ask; oneByOne → execute-tools falls back to per-item asks).
      const entry = panel._batchPermissionQueue?.shift()
      entry?.resolve(msg.choice === "approveAll" ? "approveAll" : msg.choice === "oneByOne" ? "oneByOne" : "deny")
      panel._refreshStatus()
      break
    }
    case "settings": await panel._pushSettings(); break
    case "saveProviderKey": await panel._saveProviderKey(msg.name, msg.key); break
    case "saveCustomProvider": await panel._saveCustomProvider(msg.config); break
    case "deleteProviderKey": await panel._deleteProviderKey(msg.name); break
    case "saveMcpServer": await panel._saveMcpServer(msg.name, msg.config); panel._pushMcpStatus(); break
    case "deleteMcpServer": await panel._deleteMcpServer(msg.name); panel._pushMcpStatus(); break
    // MCP.md §4 F5/D-4：reconnectMcp（既有死按钮修复——webview 已在发此消息，路由拆分时
    // 丢失）+ edit/test（CLI /mcp edit/test parity，交互随面板惯例）。
    case "reconnectMcp": await panel._reconnectMcp(msg.name); break
    case "editMcp": panel._editMcp(msg.name, msg.config ?? {}); break
    case "testMcp": await panel._testMcp(msg.name); break
    case "addProvider":
      // Payload form (settings panel [+ Add] form): persist directly.
      // No payload (model dropdown shortcut): interactive QuickPick flow.
      if (msg.preset || msg.custom) {
        const err = handleAddProvider({ preset: msg.preset, custom: msg.custom, key: msg.key })
        if (err) {
          panel._panel?.webview.postMessage({ type: "providerError", text: err })
          panel._pushSettings()
          break
        }
        panel._pushSettings()
        // Verify the connection right away — a typo'd baseURL or a bad key must
        // not fail silently. Surfaced as the settings error banner.
        const baseURL = msg.custom?.baseURL || PRESETS[msg.preset]?.baseURL
        if (baseURL) {
          const test = await testProviderConnection({ baseURL, apiKey: msg.key })
          if (!test.ok) {
            panel._panel?.webview.postMessage({ type: "providerError", text: `Saved, but connection check failed: ${test.error} — check the baseURL / API key.` })
          }
        }
      } else {
        await addProviderFlow(() => panel._pushSettings())
      }
      break
    case "removeProvider":
      if (msg.name) {
        const err = handleRemoveProvider(msg.name)
        if (err) panel._panel?.webview.postMessage({ type: "providerError", text: err })
        panel._pushSettings()
      } else {
        await removeProviderFlow(() => panel._pushSettings())
      }
      break
    case "setProviderProxy": {
      handleSetProviderProxy(msg.name, msg.proxy === true)
      panel._pushSettingsLight()
      break
    }
    case "setKey": await setKeyFlow(() => panel._pushSettings()); break
    case "saveEmbeddingConfig": await panel._saveEmbeddingConfig(msg.config); break
    case "saveEmbedKey": await panel._saveEmbeddingConfig({ apiKey: msg.key }); break
    case "deleteEmbedKey": await panel._saveEmbeddingConfig({ apiKey: "" }); break
    case "saveWebsearchKey": saveWebsearchKeyFromPanel(msg.key); panel._pushSettingsLight(); break
    case "deleteWebsearchKey": deleteWebsearchKeyFromPanel(); panel._pushSettingsLight(); break
    case "testProvider": {
      const r = await testProviderConnection({ baseURL: msg.baseURL, apiKey: msg.apiKey })
      panel._panel?.webview.postMessage({ type: "testProviderResult", ...r })
      break
    }
    case "buildIndex": await panel._buildIndex(); break
    case "getMcpStatus": panel._pushMcpStatus(); break
    case "mcpTools": {
      // Probe/expand: connect (idempotent — reuses the live connection) and return the
      // tool list for the settings panel's per-server expander.
      try {
        const { mcpConnect } = await import("../mcp.mjs")
        const servers = loadMcpServers()
        const cfg = servers.find((x) => x.name === msg.name)
        if (!cfg) throw new Error(`no MCP server named "${msg.name}"`)
        const r = await mcpConnect(cfg)
        panel._panel?.webview.postMessage({ type: "mcpTools", name: msg.name, tools: r.tools })
      } catch (e) {
        panel._panel?.webview.postMessage({ type: "mcpTools", name: msg.name, error: e?.message ?? String(e) })
      }
      break
    }
    case "saveAgentSettings": {
      saveAgentSettingsFromPanel(msg.settings ?? {})
      panel._pushSettingsLight()
      break
    }
    case "getAgentSettings": panel._panel?.webview.postMessage({ type: "agentSettings", settings: agentSettings(panel._agentSettingsSession?.() ?? null) }); break
    case "webviewReady": {
      // The webview finished loading — now it's safe to push initial state.
      // resolveWebviewView pushed i18n right after setting webview.html, which
      // races the async load and is DROPPED on Reload Window (labels showed raw
      // keys like "msg.user"). Re-push here, plus the settings the toolbar needs.
      panel._panel?.webview.postMessage({ type: "i18n", strings: loadLocaleStrings(vscode.env.language) })
      panel._panel?.webview.postMessage({ type: "agentSettings", settings: agentSettings(panel._agentSettingsSession?.() ?? null) })
      break
    }
    case "setAdvisorGuard": {
      // Slot first (session-level authority, 2026-08-29), then the config.json mirror
      // (CLI compat). A slot write failure must not block the config write.
      try { setSlotAdvisorGuard(_cwd(), panel._ensureSlot(), !!msg.value) } catch {}
      saveAgentSettingsFromPanel({ advisor: { guard: !!msg.value } })
      panel._pushSettingsLight()
      break
    }
    case "setEngineeringEnabled": {
      // Same dual-write contract as setAdvisorGuard above: slot authority + config mirror.
      try { setSlotEngineering(_cwd(), panel._ensureSlot(), !!msg.value) } catch {}
      saveAgentSettingsFromPanel({ engineering: !!msg.value })
      panel._pushSettingsLight()
      break
    }
    case "setPlanMode": {
      await panel._setPlanMode(!!msg.value)
      break
    }
    case "getShellCandidates": panel._panel?.webview.postMessage({ type: "shellCandidates", candidates: shellCandidates(), current: loadRaw().shell ?? null }); break
    case "saveShellSettings": {
      saveShellSettingsFromPanel(msg.value)
      panel._pushSettingsLight()
      break
    }
    case "saveProxySettings": {
      saveProxySettingsFromPanel(msg.settings ?? {})
      panel._pushSettingsLight()
      break
    }
    case "testProxy": {
      const result = await testProxyConnection(msg.uri)
      panel._panel?.webview.postMessage({ type: "proxyTestResult", result })
      break
    }
  }
}
