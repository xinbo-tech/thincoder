/**
 * settings-env.js — environment card (split out of settings.js): proxy settings
 * (CHANGE-TO-SAVE + connection test) and shell selection.
 */
import { escHtml } from "./ui.js"
import { t } from "./i18n.js"
import { SS } from "./settings-state.js"
import { flashSaved } from "./settings-widgets.js"

/** Environment card HTML (proxy + shell). */
export function envCardHtml() {
  let html = ""
  // ─── Environment card (proxy + shell) ───
  const px = SS.proxySettings || {}
  html += `<section class="settings-card"><h4 class="settings-card-title">${t("settings.envSection")}</h4><div class="settings-card-body">`
  html += `<div class="settings-subtitle">${t("settings.proxySection")}</div>`
  html += `<div class="key-field"><label title="${t("settings.proxyUriHelp")}">${t("settings.proxyUri")}</label><input id="px-uri" placeholder="http://127.0.0.1:7890" value="${escHtml(px.uri || "")}"></div>`
  html += `<label class="switch" title="${t("settings.proxyWebHelp")}"><input type="checkbox" id="px-web" ${px.web !== false ? "checked" : ""}> ${t("settings.proxyWeb")}</label>`
  html += `<label class="switch" title="${t("settings.proxyModelHelp")}"><input type="checkbox" id="px-model" ${px.model ? "checked" : ""}> ${t("settings.proxyModel")}</label>`
  html += `<div> <button id="px-test-btn" class="key-btn">${t("settings.proxyTest")}</button></div>`
  html += `<div id="px-test-result" style="font-size:12px;opacity:0.7;padding:4px 0">—</div>`
  html += `<div class="settings-subtitle">${t("settings.shellSection")}</div>`
  html += `${(() => {
    const cands = SS.shellCandidates || []
    const shellIsCustom = SS.shellValue !== null && !cands.some((c) => (c.value ?? null) === SS.shellValue)
    return `
    <div class="key-field"><label title="${t("settings.shellHelp")}">${t("settings.shellSelect")}</label><select id="sh-select">
      ${cands.map((c) => `<option value="${escHtml(c.value || "")}" ${!shellIsCustom && (c.value ?? null) === SS.shellValue ? "selected" : ""}>${escHtml(c.name)}</option>`).join("")}
      <option value="__custom__" ${shellIsCustom ? "selected" : ""}>${t("settings.shellCustom")}</option>
    </select></div>
    <div class="key-field"><label>${t("settings.shellPath")}</label><input id="sh-custom" placeholder="C:\\path\\to\\shell.exe" value="${shellIsCustom ? escHtml(SS.shellValue) : ""}"></div>`
  })()}`
  html += `</div></section>`
  return html
}

/** Bind the proxy controls: CHANGE-TO-SAVE (test button stays — it's an action, not a save). */
export function bindEnvControls() {
  // Proxy settings: CHANGE-TO-SAVE (test button stays — it's an action, not a save)
  const autoSaveProxy = () => {
    const uri = document.getElementById("px-uri")?.value?.trim() ?? ""
    const web = document.getElementById("px-web")?.checked ?? false
    const model = document.getElementById("px-model")?.checked ?? false
    window._vscode.postMessage({ type: "saveProxySettings", settings: { uri, web, model } })
    flashSaved(document.getElementById("px-test-btn"))
  }
  // Explicit per-control binding — NEVER a card/document-wide query. The old
  // `closest(".settings-card") || document` fell through to document (px-save-btn does not
  // exist), binding autoSaveProxy to EVERY input's change in the panel: blurring any field
  // re-posted proxy with whatever was (or wasn't) in px-uri, silently deleting it.
  for (const id of ["px-uri", "px-web", "px-model"]) {
    document.getElementById(id)?.addEventListener("change", autoSaveProxy)
  }

  const pxTest = document.getElementById("px-test-btn")
  if (pxTest) {
    pxTest.addEventListener("click", () => {
      const result = document.getElementById("px-test-result")
      if (result) result.textContent = t("settings.proxyTestRunning")
      const uri = document.getElementById("px-uri")?.value?.trim() || ""
      window._vscode.postMessage({ type: "testProxy", uri })
    })
  }
}

export function updateShellCandidates(payload) {
  SS.shellCandidates = payload?.candidates || []
  SS.shellValue = payload?.current ?? null
}

export function updateProxySettings(settings) {
  SS.proxySettings = settings
}

export function updateProxyTestResult(result) {
  const el = document.getElementById("px-test-result")
  if (!el) return
  if (result?.ok) el.textContent = `✓ OK (HTTP ${result.status})`
  else if (result?.status) el.textContent = `✗ HTTP ${result.status}`
  else el.textContent = `✗ ${result?.error || "unknown error"}`
}
