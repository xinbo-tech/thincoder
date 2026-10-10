/**
 * settings.js — settings panel orchestrator: panel open/close, init, and the full
 * build. Split 2026-08-22 (500-line rule): card renderers and bindings live in
 * settings-providers.js / settings-agent.js / settings-tools.js / settings-env.js,
 * shared control builders in settings-widgets.js, model-menu/consult-row wiring in
 * settings-models.js, and shared mutable state in settings-state.js (SS).
 */
import { SS } from "./settings-state.js"
import { t } from "./i18n.js"
import { showConfirmPopover, closeConfirmPopover } from "./settings-widgets.js"
import { installProviderHandlers, providersCardHtml, bindAddProviderForm, updateProviderStatus } from "./settings-providers.js"
import { installProviderDialogHandlers, closeAddProviderDialog, updateTestProviderResult } from "./settings-provider-dialog.js"
import { closeMcpDialog } from "./settings-mcp-dialog.js"
import { closeConsultDialog } from "./settings-consult-dialog.js"
import { agentCardHtml, consultAdvisorCardHtml, bindAgentControls, updateAgentSettings } from "./settings-agent.js"
import { installToolsKeyHandlers, toolsCardHtml, bindToolsControls, updateWebsearchSettings, updateIndexStatus } from "./settings-tools.js"
import { renderMcpList, updateMcpTools, updateMcpTestResult } from "./settings-mcp.js"
import { envCardHtml, bindEnvControls, updateShellCandidates, updateProxySettings, updateProxyTestResult } from "./settings-env.js"
import { teamCardHtml } from "./settings-team.js"

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
  // 添加弹窗（#1029）：开框单例 ∥ 保存直呼面（表单族 = `settings-provider-dialog.js`）
  installProviderDialogHandlers()
  installToolsKeyHandlers()

  window._mcpServers = {}
  // Request detected shells once (extension caches the detection — CLI /shell parity)
  window._vscode.postMessage({ type: "getShellCandidates" })

  // Single-click delete — the re-fillable class only (no live call sites: every delete entry
  // goes through _confirmSecretDelete below — SETTINGS.md §2.10).
  window._confirmDelete = function(btn, action) { action() }
  // Unrecoverable class (credential originals vanish with the entry — keys / tokens / headers /
  // provider rows / MCP server rows; the rows show no original (only the edit form's fields do),
  // so it can only be reconfigured or re-issued): one explicit confirmation
  // (F-W17 — class criterion = SETTINGS.md §2.10).
  // btn is kept for call-site symmetry with _confirmDelete; the popover is centered, not anchored.
  window._confirmSecretDelete = function(btn, action) {
    showConfirmPopover({
      text: t("settings.secretDeleteConfirm"),
      yesLabel: t("session.delete"),
      noLabel: t("question.cancel"),
      onConfirm: action,
    })
  }

  return { openSettings, closeSettings, renderMcpList, updateMcpTools, updateMcpTestResult, updateProviderStatus, updateIndexStatus, updateAgentSettings, notifyAgentSettingsRefreshed, updateWebsearchSettings, updateTestProviderResult, updateShellCandidates, updateProxySettings, updateProxyTestResult, showSettingsError }
}

/** 失败面段名词表（`providerError.scope` 闭集 → 既有段名词键；`panel` ∕ 闭集外 ⇒ 零段标——沿桌面判）。 */
const SCOPE_WORD = Object.freeze({
  providers: "settings.providersSection",
  mcp: "settings.mcpSection",
  agent: "settings.agentSection",
  consultAdvisor: "settings.consultAdvisorSection",
  tools: "settings.toolsSection",
  env: "settings.envSection",
})

/** 失败码词表（码 → 词键）：表内出词、表外原样直传（桌面 `REASON_WORD` 同式；v1 = 恰可达集
 *  ——现仅写冲突一类可判码，表随新码产者一行扩张）。 */
const REASON_WORD = Object.freeze({
  "mtime-conflict": "settings.reason.mtimeConflict",
})

/** 码 → 词：表内出词；表外（含站内原生错误串）原样直传；缺 ∕ 空 ⇒ `null`（零节点）。 */
function reasonWord(reason) {
  if (reason === null || reason === undefined || reason === "") return null
  const key = Object.hasOwn(REASON_WORD, reason) ? REASON_WORD[reason] : null
  return key === null ? String(reason) : t(key)
}

/** 失败面单槽（#640）：消息面瞬态状态（非面板字段状态——不触 §1 单一状态源原则）。最后一条胜；
 *  面板关时到达 ⇒ 落槽待显（关面板不丢）；`closeSettings()` ⇒ 清槽（关 = 销账）。 */
let _lastFailure = null

/** 失败面渲染：单实例 banner（段标 + 文本两子节点，携 `data-scope`）；面板关 ∕ 空 reason ⇒ 零节点。 */
function renderSettingsError() {
  document.getElementById("settings-error-banner")?.remove()
  const text = reasonWord(_lastFailure?.reason)
  const panel = document.getElementById("settings-panel")
  const body = document.getElementById("settings-body")
  if (text === null || !panel || !body || panel.style.display === "none") return
  const el = document.createElement("div")
  el.id = "settings-error-banner"
  el.className = "settings-error-banner"
  el.setAttribute("data-scope", _lastFailure.scope ?? "")
  if (Object.hasOwn(SCOPE_WORD, _lastFailure.scope)) {
    const scopeEl = document.createElement("span")
    scopeEl.className = "settings-error-scope"
    scopeEl.textContent = t(SCOPE_WORD[_lastFailure.scope])
    el.appendChild(scopeEl)
  }
  const textEl = document.createElement("span")
  textEl.className = "settings-error-text"
  textEl.textContent = text
  el.appendChild(textEl)
  body.prepend(el)
}

/** Extension-side failure banner at the top of the settings panel（#640 载荷 v2 = `{scope, reason}`）：
 *  段标（闭集出词）+ 文本（词化码 ∕ 原样串）两子节点；面板开时驻留（无 6s 自散——替换 ∕ 关面板止）；
 *  面板关时到达 ⇒ 落槽，`buildSettings()` 尾补渲（关面板不丢）。 */
export function showSettingsError(scope, reason) {
  _lastFailure = { scope, reason }
  renderSettingsError()
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
  closeConfirmPopover() // 取消路径 #4：关面板同清确认弹框 + 遮罩（零发值）
  closeAddProviderDialog() // #1029 关五路 #5：关面板同清添加弹窗（卡 ∥ 幕两件——同拍）
  closeMcpDialog() // #1054 关五路 #5：MCP 弹窗同清（两新档三清同拍）
  closeConsultDialog() // #1054 关五路 #5：会诊弹窗同清（同带浮层）
  // #640 失败面销账：关 = 清槽（关后重开不复现——与「关面板不丢」互补）
  _lastFailure = null
  document.getElementById("settings-error-banner")?.remove()
  // inputEl.focus() — caller should handle this via the returned closeSettings
}

/** Full panel build: compose every card's HTML in one innerHTML write, then bind.
 *  Binding order matches the pre-split buildSettings exactly. */
function buildSettings() {
  const body = document.getElementById("settings-body")
  // 第 6 卡「团队」（B1 批——序尾追加，不重排前五卡；`SETTINGS.md` §1 六卡）
  body.innerHTML = providersCardHtml() + agentCardHtml() + consultAdvisorCardHtml() + toolsCardHtml() + envCardHtml() + teamCardHtml()

  // Card-row bindings: default-model menu button + provider-row ✕ delete buttons
  bindAddProviderForm()
  // Agent/Consult/Advisor CHANGE-TO-SAVE bindings + model-menu/consult-row wiring
  bindAgentControls()
  // Proxy CHANGE-TO-SAVE + connection test
  bindEnvControls()
  // MCP form/list, index build, MCP status request
  bindToolsControls()
  // 团队卡 = 管理面（登录面补全批：卡内零登/退控件——登/退 = 首启板团队卡 ∥ 状态栏 item + 命令
  // `thincoder.team`）；卡面重绘由 `updateTeamStatus` 推送驱动（无控件可绑）
  // #640：失败面补渲（关面板时落槽的一条在开面板建面后补显）
  renderSettingsError()
}
