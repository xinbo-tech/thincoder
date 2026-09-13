/**
 * onboarding.js — first-run onboarding panel: shown when no provider is
 * configured; dismissed on skip (stays dismissed for the webview's lifetime,
 * reappears after a reload).
 *
 * initOnboarding({ openSettings }) is called once from chat.js after the
 * settings panel is initialized — the "custom provider" / "full settings"
 * paths hand off to it.
 */
import { ctx, vscode, S } from "./state.js"
import { t } from "./i18n.js"
import { escHtml } from "./ui.js"

let _openSettings = null

export function initOnboarding({ openSettings }) {
  _openSettings = openSettings
}

/** Show the onboarding panel, pre-filled with the unadded provider presets. */
export function showWelcomePanel(status) {
  if (S._welcomeDismissed) return
  const presets = (status?.presets || []).map((p) => ({ name: p.name, label: p.desc || p.name, model: p.model }))
  const sel = ctx.welcomeProvider
  sel.innerHTML = presets
    .map((p) => `<option value="${escHtml(p.name)}">${escHtml(p.label)} — ${escHtml(p.model)}</option>`)
    .join("") + `<option value="custom">${escHtml(t("settings.customChoice"))}</option>`
  ctx.welcomeHeading.textContent = t("welcome.heading")
  ctx.welcomeText.textContent = t("welcome.text")
  ctx.welcomeProviderLabel.textContent = t("settings.providersSection")
  ctx.welcomeKeyLabel.textContent = t("settings.providerKey")
  ctx.welcomeSaveBtn.textContent = t("welcome.save")
  ctx.welcomeSkipBtn.textContent = t("welcome.skip")
  ctx.welcomeSettingsBtn.textContent = t("welcome.fullSettings")
  ctx.welcomeKey.value = ""
  ctx.welcomePanel.style.display = "flex"
  ctx.welcomePanel.setAttribute("aria-hidden", "false")
}

function hideWelcomePanel() {
  ctx.welcomePanel.style.display = "none"
  ctx.welcomePanel.setAttribute("aria-hidden", "true")
}

/** providerStatus-driven: show onboarding when NOTHING is configured; close it once a key lands. */
export function maybeShowWelcome(status, keyOk) {
  if (keyOk) {
    hideWelcomePanel()
    return
  }
  showWelcomePanel(status)
}

ctx.welcomeSaveBtn.addEventListener("click", () => {
  const name = ctx.welcomeProvider.value
  const key = ctx.welcomeKey.value.trim()
  if (!key) { ctx.welcomeKey.focus(); return }
  if (name === "custom") {
    // Custom providers need more fields — hand off to the settings panel's add form.
    hideWelcomePanel()
    _openSettings?.()
    window._toggleAddForm?.(true)
    return
  }
  vscode.postMessage({ type: "addProvider", preset: name, key })
  // The panel closes itself when the refreshed providerStatus reports keyOk=true.
})

ctx.welcomeSkipBtn.addEventListener("click", () => {
  S._welcomeDismissed = true
  hideWelcomePanel()
})

ctx.welcomeSettingsBtn.addEventListener("click", () => {
  hideWelcomePanel()
  _openSettings?.()
})

ctx.welcomeKey.addEventListener("keydown", (e) => {
  if (e.key === "Enter") ctx.welcomeSaveBtn.click()
})
