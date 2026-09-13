/**
 * model-picker.js — model selector (overlay menu) and reasoning-effort
 * dropdown, plus the models-message handler that applies extension-pushed
 * model lists and prefs.
 * Imported for its side effects (registers the model/reasoning button listeners).
 */
import { ctx, vscode } from "./state.js"
import { t } from "./i18n.js"
import { openModelMenu, closeModelMenu } from "./model-menu.js"

ctx.modelBtn.addEventListener("click", (e) => {
    e.stopPropagation()
    openModelMenu({
      anchorEl: ctx.modelBtn,
      models: ctx._models,
      value: { provider: ctx.selectedProvider, model: ctx.selectedModel },
      onPick: ({ provider, model }) => {
        const m = ctx._models.find((x) => x.id === model && (x.provider || "") === provider)
        if (m) selectModel(m)
      },
      footer: [
        { label: t("model.addProvider"), onClick: () => vscode.postMessage({ type: "addProvider" }) },
        { label: t("model.removeProvider"), onClick: () => vscode.postMessage({ type: "removeProvider" }) },
        { label: t("model.setKey"), onClick: () => vscode.postMessage({ type: "setKey" }) },
      ],
      up: true,
    })
  })
ctx.reasoningBtn.addEventListener("click", () => toggleDropdown(ctx.reasoningDropdown, () => buildReasoningDropdown()))

function buildReasoningDropdown() {
  ctx.reasoningDropdown.innerHTML = ""
  const model = ctx._models.find((m) => m.id === ctx.selectedModel)
  const levels = model?.reasoning || []
  if (levels.length === 0) {
    ctx.reasoningDropdown.appendChild(sectionEl(t("model.noReasoning")))
    const item = document.createElement("div")
    item.className = "dropdown-item"
    item.innerHTML = "<span>" + t("model.noReasoningDesc") + "</span>"
    item.style.opacity = "0.5"
    ctx.reasoningDropdown.appendChild(item)
    return
  }
  ctx.reasoningDropdown.appendChild(sectionEl(t("model.reasoning")))
  for (const level of levels) {
    const item = document.createElement("div")
    item.className = "dropdown-item"
    item.tabIndex = 0
    item.setAttribute("role", "option")
    item.setAttribute("aria-selected", String(level === ctx.selectedReasoning))
    const label = reasoningLabel(level)
    item.innerHTML = `<span>${label}</span>${level === ctx.selectedReasoning ? '<span class="check">✓</span>' : ""}`
    item.addEventListener("click", () => {
      ctx.selectedReasoning = level
      ctx.reasoningBtn.textContent = level === "none" ? "off" : label
      ctx.reasoningBtn.classList.toggle("active", level !== "none")
      ctx.reasoningDropdown.style.display = "none"
      vscode.postMessage({ type: "selectReasoning", reasoning: level })
    })
    ctx.reasoningDropdown.appendChild(item)
  }
}

function sectionEl(text) {
  const s = document.createElement("div")
  s.className = "dropdown-section"
  s.textContent = text
  return s
}

function selectModel(m) {
  ctx.selectedModel = m.id; ctx.selectedProvider = m.provider || ""
  ctx.modelBtn.textContent = m.id; closeModelMenu()
  vscode.postMessage({ type: "selectModel", model: m.id, provider: m.provider || "" })
  const levels = m.reasoning || []
  if (levels.length > 0 && !levels.includes(ctx.selectedReasoning)) ctx.selectedReasoning = levels[0]
  const visible = levels.length > 0 ? ctx.selectedReasoning : "off"
  ctx.reasoningBtn.textContent = visible === "none" ? "off" : (reasoningLabel(visible))
  ctx.reasoningBtn.classList.toggle("active", levels.length > 0 && visible !== "off")
}

function toggleDropdown(el, build) {
  const open = el.style.display !== "none"
  // Close all dropdowns first
  closeModelMenu()
  ctx.reasoningDropdown.style.display = "none"
  ctx.sessionDropdown.style.display = "none"
  if (ctx.sessionSelector) ctx.sessionSelector.setAttribute("aria-expanded", "false")
  el.style.display = open ? "none" : "block"
  if (!open) build()
  // Update aria-expanded on the trigger button
  if (el === ctx.reasoningDropdown) ctx.reasoningBtn.setAttribute("aria-expanded", String(!open))
}

/** Get reasoning label from i18n */
function reasoningLabel(level) {
  return t("reasoning." + (level || "none"))
}

/** models message: apply the pushed model list + persisted prefs. */
export function handleModelsMessage(m) {
  ctx._models = m.models || []
  if (ctx._models.length > 0) {
    ctx.modelBtn.style.display = ""
    ctx.reasoningBtn.style.display = ""
    const prefs = m.prefs || {}
    const match = ctx._models.find((x) => x.id === prefs.model && x.provider === prefs.provider)
    if (match) {
      ctx.selectedModel = match.id; ctx.selectedProvider = match.provider
      ctx.modelBtn.textContent = match.id
      ctx.selectedReasoning = prefs.reasoning || "off"
      const levels = match.reasoning || []
      if (levels.length > 0 && !levels.includes(ctx.selectedReasoning)) ctx.selectedReasoning = levels[0]
      ctx.reasoningBtn.textContent = ctx.selectedReasoning === "none" ? "off" : (reasoningLabel(ctx.selectedReasoning))
      ctx.reasoningBtn.classList.toggle("active", levels.length > 0 && ctx.selectedReasoning !== "off")
      vscode.postMessage({ type: "selectModel", model: match.id, provider: match.provider })
      vscode.postMessage({ type: "selectReasoning", reasoning: ctx.selectedReasoning })
    } else if (prefs.model) {
      // M10 MODEL-SELECTION v2 (2026-09-11 scope add-on, user ruling): a prefs composite
      // NOT in the pulled list must never silently write the session slot. Display AND
      // state fall back to the slot composite (turn-echo parity: send.js:47 →
      // turn-model.mjs:22); slot writes stay explicit-click only — zero selectModel /
      // selectReasoning posts (selectModel = the only slot writer; selectReasoning only
      // writes workspaceState). ctx.selectedReasoning stays untouched.
      ctx.selectedModel = prefs.model
      ctx.selectedProvider = prefs.provider
      ctx.modelBtn.textContent = prefs.model
    }
  } else {
    ctx.modelBtn.textContent = ""
    ctx.modelBtn.title = ""
    ctx.modelBtn.style.display = "none"
    ctx.reasoningBtn.style.display = "none"
  }
}
