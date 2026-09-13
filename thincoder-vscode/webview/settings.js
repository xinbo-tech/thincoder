/**
 * settings.js — settings panel orchestrator: panel open/close, init, and the full
 * build. Split 2026-08-22 (500-line rule): card renderers and bindings live in
 * settings-providers.js / settings-agent.js / settings-tools.js / settings-env.js,
 * shared control builders in settings-widgets.js, model-menu/consult-row wiring in
 * settings-models.js, and shared mutable state in settings-state.js (SS).
 */
import { SS } from "./settings-state.js"
import { installProviderHandlers, providersCardHtml, bindAddProviderForm, updateProviderStatus, updateTestProviderResult } from "./settings-providers.js"
import { agentCardHtml, consultAdvisorCardHtml, bindAgentControls, updateAgentSettings } from "./settings-agent.js"
import { installToolsKeyHandlers, toolsCardHtml, bindToolsControls, renderMcpList, updateMcpTools, updateMcpTestResult, updateWebsearchSettings, updateIndexStatus } from "./settings-tools.js"
import { envCardHtml, bindEnvControls, updateShellCandidates, updateProxySettings, updateProxyTestResult } from "./settings-env.js"

// openSettings refresh (GitHub #3): one-shot callbacks waiting for the next agentSettings
// push, plus their timeout-fallback timers (see openSettings / notifyAgentSettingsRefreshed).
const _agentSettingsWaiters = new Set()
const _agentSettingsWaiterTimers = new Map()

/**
 * Initialize settings panel.
 * @param {{ onClose?: Function, getModels?: Function }} deps
 */
export function initSettings({ onClose, getModels }) {
  SS.getModels = getModels
  // NOTE: settings-btn 的 click 绑定在 chat.js（工具栏统一接线）——这里曾重复绑定导致
  // 每次 openSettings 触发两遍（B1 后变成 2× getAgentSettings + 双 build），已移除。
  document.getElementById("settings-close").addEventListener("click", () => {
    closeSettings()
    if (onClose) onClose()
  })

  // Expose to inline onclick handlers
  installProviderHandlers()
  installToolsKeyHandlers()

  window._mcpServers = {}
  // Request detected shells once (extension caches the detection — CLI /shell parity)
  window._vscode.postMessage({ type: "getShellCandidates" })

  // Single-click delete — these actions are reversible (provider/MCP/key can be re-added).
  window._confirmDelete = function(btn, action) { action() }

  return { openSettings, closeSettings, renderMcpList, updateMcpTools, updateMcpTestResult, updateProviderStatus, updateIndexStatus, updateAgentSettings, notifyAgentSettingsRefreshed, updateWebsearchSettings, updateTestProviderResult, updateShellCandidates, updateProxySettings, updateProxyTestResult, showSettingsError }
}

/** Error banner at the top of the settings panel (extension-side failures). */
export function showSettingsError(text) {
  const panel = document.getElementById("settings-panel")
  const body = document.getElementById("settings-body")
  if (!panel || !body || panel.style.display === "none") return
  document.getElementById("settings-error-banner")?.remove()
  const el = document.createElement("div")
  el.id = "settings-error-banner"
  el.className = "settings-error-banner"
  el.textContent = text
  body.prepend(el)
  setTimeout(() => el.remove(), 6000)
}

function openSettings() {
  const panel = document.getElementById("settings-panel")
  panel.style.display = "flex"
  panel.setAttribute("aria-hidden", "false")
  // Refresh agent settings from disk BEFORE rendering (GitHub #3): the SS snapshot is
  // pushed once at webviewReady, so a CLI-side /advisor write after that was invisible
  // until reload. getAgentSettings → the extension re-reads config.json and pushes the
  // regular agentSettings message → handleAgentSettings updates SS → the waiter fires
  // and buildSettings renders the fresh values (postMessage has no ack, so the only
  // ordering guarantee is a callback invoked by the push handler itself). The panel
  // area is already visible; the build is fast local rendering, not a network call.
  requestAgentSettingsThen(() => buildSettings())
  setTimeout(() => {
    const firstBtn = panel.querySelector("button, input")
    if (firstBtn) firstBtn.focus()
  }, 50)
}

/** One-shot callback invoked when the next agentSettings push lands (after SS is
 *  updated), with a timeout fallback that renders from the current snapshot — a lost
 *  or unanswered message must never leave the panel unrendered. */
function requestAgentSettingsThen(onFresh) {
  const timer = setTimeout(() => {
    _agentSettingsWaiters.delete(onFresh)
    _agentSettingsWaiterTimers.delete(onFresh)
    onFresh()
  }, 250)
  _agentSettingsWaiters.add(onFresh)
  _agentSettingsWaiterTimers.set(onFresh, timer)
  window._vscode.postMessage({ type: "getAgentSettings" })
}

/** Called by chat.js's agentSettings handler AFTER updateAgentSettings refreshed SS. */
export function notifyAgentSettingsRefreshed() {
  for (const waiter of [..._agentSettingsWaiters]) {
    clearTimeout(_agentSettingsWaiterTimers.get(waiter))
    _agentSettingsWaiterTimers.delete(waiter)
    _agentSettingsWaiters.delete(waiter)
    waiter()
  }
}

function closeSettings() {
  const panel = document.getElementById("settings-panel")
  panel.style.display = "none"
  panel.setAttribute("aria-hidden", "true")
  // inputEl.focus() — caller should handle this via the returned closeSettings
}

/** Full panel build: compose every card's HTML in one innerHTML write, then bind.
 *  Binding order matches the pre-split buildSettings exactly. */
function buildSettings() {
  const body = document.getElementById("settings-body")
  body.innerHTML = providersCardHtml() + agentCardHtml() + consultAdvisorCardHtml() + toolsCardHtml() + envCardHtml()

  // Bind Add-provider form controls
  bindAddProviderForm()
  // Agent/Consult/Advisor CHANGE-TO-SAVE bindings + model-menu/consult-row wiring
  bindAgentControls()
  // Proxy CHANGE-TO-SAVE + connection test
  bindEnvControls()
  // MCP form/list, index build, MCP status request
  bindToolsControls()
}
