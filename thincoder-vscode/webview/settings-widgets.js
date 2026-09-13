/**
 * settings-widgets.js — shared settings-panel control builders (split out of settings.js):
 * key-edit rows, effort dropdowns, save feedback, input error marking.
 */
import { escHtml } from "./ui.js"
import { t } from "./i18n.js"
import { effortEnumFor, defaultEffortFor } from "./settings-state.js"

/** Shared key-edit row (provider/embedding/websearch keys were three copy-paste blocks).
 *  Renders input + Save + Cancel into the row; Enter saves, Escape cancels. */
export function keyRowEdit(row, { label, placeholder, onSave, onCancel }) {
  row.replaceChildren()
  const lbl = document.createElement("span")
  lbl.className = "key-label"
  lbl.textContent = label
  const inp = document.createElement("input")
  inp.type = "password"
  inp.placeholder = placeholder
  inp.autocomplete = "off"
  inp.style.cssText = "flex:1;margin:0 8px;"
  const saveBtn = document.createElement("button")
  saveBtn.className = "key-btn"
  saveBtn.textContent = t("settings.save")
  const cancelBtn = document.createElement("button")
  cancelBtn.className = "key-btn"
  cancelBtn.textContent = t("settings.cancel")
  const doSave = () => {
    const v = inp.value.trim()
    if (!v) { onCancel(); return }
    onSave(v, saveBtn)
  }
  saveBtn.addEventListener("click", doSave)
  cancelBtn.addEventListener("click", onCancel)
  inp.addEventListener("keydown", (e) => {
    if (e.key === "Enter") doSave()
    else if (e.key === "Escape") onCancel()
  })
  row.append(lbl, inp, saveBtn, cancelBtn)
  setTimeout(() => inp.focus(), 50)
}

/** Shared effort dropdown (consult rows / advisor were three copies). Returns null for
 *  non-thinking models (caller hides the control). */
export function buildEffortSelect({ model, current, onChange, className = "consult-effort" }) {
  const enum_ = model ? effortEnumFor(model) : null
  if (!enum_ || enum_.length === 0) return null
  const sel = document.createElement("select")
  sel.className = className
  const value = current || defaultEffortFor(model)
  sel.innerHTML = enum_.map((e) => `<option value="${escHtml(e)}" ${value === e ? "selected" : ""}>${escHtml(e)}</option>`).join("")
  if (onChange) sel.addEventListener("change", () => onChange(sel.value))
  return sel
}

/** Unified save feedback — one form panel-wide (per SETTINGS-REORG P4): the card-level
 *  saved badge. The btn arg is ignored (kept for call-site compatibility). */
export function flashSaved(_btn) {
  const badge = document.getElementById("agent-saved-badge")
  if (!badge) return
  badge.textContent = t("settings.autoSaved")
  badge.classList.add("visible")
  setTimeout(() => badge.classList.remove("visible"), 1200)
}

/** Mark an input as invalid briefly (e.g. malformed JSON headers). */
export function markInputError(el, ms = 2500) {
  if (!el) return
  el.classList.add("input-error")
  setTimeout(() => el.classList.remove("input-error"), ms)
}
