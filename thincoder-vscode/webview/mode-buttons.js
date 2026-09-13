/**
 * mode-buttons.js — Review-guard / Engineering / Plan mode quick switches and
 * the AUTO-approve button (with inline confirmation). These mirror config.json
 * fields; the settings panel has the full configuration.
 * Imported for its side effects (registers the toolbar button listeners).
 */
import { ctx, vscode, S } from "./state.js"
import { t } from "./i18n.js"
import { renderStatusBar } from "./status-bar.js"

const advisorBtn = document.getElementById("advisor-btn")
const engBtn = document.getElementById("eng-btn")
const planBtn = document.getElementById("plan-btn")
const autoBtn = document.getElementById("auto-btn")

export function applyModeButtons() {
  advisorBtn.classList.toggle("active", S._advisorOn)
  advisorBtn.classList.toggle("warning", S._advisorOn)
  engBtn.classList.toggle("active", S._engOn)
  engBtn.classList.toggle("warning", S._engOn)
  planBtn.classList.toggle("active", S._planActive)
  planBtn.classList.toggle("warning", S._planActive)
}

advisorBtn.addEventListener("click", () => {
  S._advisorOn = !S._advisorOn
  applyModeButtons()
  vscode.postMessage({ type: "setAdvisorGuard", value: S._advisorOn })
})
engBtn.addEventListener("click", () => {
  S._engOn = !S._engOn
  applyModeButtons()
  vscode.postMessage({ type: "setEngineeringEnabled", value: S._engOn })
})
planBtn.addEventListener("click", () => {
  S._planActive = !S._planActive
  applyModeButtons()
  vscode.postMessage({ type: "setPlanMode", value: S._planActive })
})

autoBtn.addEventListener("click", () => {
  if (!S._autoApprove) {
    // Show inline confirmation instead of blocked confirm()
    showAutoConfirm()
    return
  }
  // Turning OFF — no confirmation needed
  S._autoApprove = false
  autoBtn.classList.remove("active", "warning")
  autoBtn.textContent = "AUTO"
  vscode.postMessage({ type: "setAutoApprove", value: false })
})

function showAutoConfirm() {
  const existing = document.querySelector(".auto-confirm")
  if (existing) existing.remove()
  // A stale backdrop from a previous invocation would block clicks on the UI.
  document.querySelector(".auto-backdrop")?.remove()

  const backdrop = document.createElement("div")
  backdrop.className = "auto-backdrop"
  backdrop.addEventListener("click", () => {
    backdrop.remove()
    document.querySelector(".auto-confirm")?.remove()
    ctx.inputEl.focus()
  })

  const popover = document.createElement("div")
  popover.className = "auto-confirm"
  popover.setAttribute("role", "alertdialog")
  popover.setAttribute("aria-label", t("toolbar.autoApprove"))
  popover.innerHTML = `<div class="auto-confirm-text">${t("auto.confirmText")}</div>
    <div class="auto-confirm-actions">
      <button class="auto-confirm-yes" aria-label="${t("auto.enable")}">${t("auto.enable")}</button>
      <button class="auto-confirm-no" aria-label="${t("auto.cancel")}">${t("auto.cancel")}</button>
    </div>`

  document.body.appendChild(backdrop)
  document.body.appendChild(popover)
  // Focus the cancel button (safer default)
  setTimeout(() => popover.querySelector(".auto-confirm-no")?.focus(), 50)

  const close = () => { popover.remove(); backdrop.remove(); ctx.inputEl.focus() }
  popover.querySelector(".auto-confirm-yes").addEventListener("click", () => {
    close()
    S._autoApprove = true
    autoBtn.classList.add("active", "warning")
    autoBtn.textContent = "⚠ AUTO"
    vscode.postMessage({ type: "setAutoApprove", value: true })
  })
  popover.querySelector(".auto-confirm-no").addEventListener("click", close)
}

/** autoApprove message: extension pushed the current flag (e.g. on startup). */
export function handleAutoApprove(m) {
  S._autoApprove = m.value
  autoBtn.classList.toggle("active", S._autoApprove)
  autoBtn.classList.toggle("warning", S._autoApprove)
  autoBtn.textContent = S._autoApprove ? "⚠ AUTO" : "AUTO"
}

/**
 * agentSettings message: refresh the settings panel (via updateAgentSettings)
 * and mirror the advisor/engineering flags onto the quick-switch buttons.
 */
export function handleAgentSettings(m, updateAgentSettings) {
  updateAgentSettings(m.settings || {})
  S._advisorOn = !!(m.settings?.advisor?.guard)
  S._engOn = !!(m.settings?.engineering)
  applyModeButtons()
}

/** planMode message: toggle the plan styling, button state, and status bar. */
export function handlePlanMode(m) {
  S._planActive = m.active
  document.getElementById("input-row").classList.toggle("plan-active", S._planActive)
  applyModeButtons()
  renderStatusBar()
}
