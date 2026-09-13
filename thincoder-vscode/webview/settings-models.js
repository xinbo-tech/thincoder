/**
 * settings-models.js — model-menu slot mounting + consult-row interactions
 * (split out of settings.js): subagent slots, advisor slot, consult rows.
 */
import { t } from "./i18n.js"
import { openModelMenu } from "./model-menu.js"
import { SS, labelFor } from "./settings-state.js"
import { buildEffortSelect } from "./settings-widgets.js"

/** Read every consult row's live state from the DOM (including half-filled — a rebuild
 *  must re-render them intact instead of dropping the user's in-progress row). */
export function readConsultRowsFromDom() {
  const rows = []
  document.querySelectorAll("#consult-rows .consult-row").forEach((row) => {
    rows.push({
      provider: row.dataset.provider || "",
      model: row.dataset.model || "",
      effort: row.querySelector(".consult-effort")?.value ?? null,
    })
  })
  return rows
}

/** Complete rows for saving (≤5). Half-filled rows are simply not saved yet —
 *  they stay in the DOM and become part of the payload once completed. */
export function collectConsultRows() {
  return readConsultRowsFromDom()
    .filter((r) => r.provider && r.model)
    .slice(0, 5)
}

/** Wire add/remove/cascade for consult rows (idempotent — called after each buildSettings). */
export function mountModelMenus() {
  // subagent slots (stored as "provider:model" — CLI compatible)
  for (const id of ["global", "explore", "plan", "coder", "eng-coder", "eng-designer"]) {
    const slot = document.getElementById("submodel-slot-" + id)
    if (!slot || slot.dataset.mounted === "1") continue
    slot.dataset.mounted = "1"
    const models = SS.getModels?.() || []
    const raw = slot.dataset.value || ""
    const sep = raw.indexOf(":")
    const value = sep > 0 ? { provider: raw.slice(0, sep), model: raw.slice(sep + 1) } : null
    const btn = document.createElement("button")
    btn.type = "button"
    btn.className = "key-btn model-menu-btn"
    btn.textContent = raw || t("settings.inherit")
    btn.addEventListener("click", (e) => {
      e.stopPropagation()
      openModelMenu({
        anchorEl: btn, models, value,
        onPick: (picked) => {
          const v = picked.provider + ":" + picked.model
          slot.dataset.value = v
          btn.textContent = v
          refreshClearBtn(slot)
          fireAgentSave()
        },
      })
    })
    slot.replaceChildren(btn)
    // ✕ next to the trigger — clears back to inherit
    if (raw) {
      const clr = document.createElement("button")
      clr.type = "button"
      clr.className = "model-menu-clear"
      clr.title = t("settings.inherit")
      clr.textContent = "✕"
      clr.addEventListener("click", (e) => {
        e.stopPropagation()
        slot.dataset.value = ""
        btn.textContent = t("settings.inherit")
        refreshClearBtn(slot)
        fireAgentSave()
      })
      slot.appendChild(clr)
    }
  }
  document.querySelectorAll("#consult-rows .consult-row").forEach((row) => {
    mountSlot(row.querySelector(".consult-model-slot"), {
      provider: row.dataset.provider || "",
      model: row.dataset.model || "",
      onPick: ({ provider, model }) => setRowModel(row, provider, model),
    })
  })
  const advSlot = document.getElementById("adv-model-slot")
  if (advSlot) {
    mountSlot(advSlot, {
      provider: advSlot.dataset.provider || "",
      model: advSlot.dataset.model || "",
      onPick: (picked) => {
        advSlot.dataset.provider = picked.provider
        advSlot.dataset.model = picked.model
        advSlot.querySelector(".model-menu-btn").textContent = labelFor(picked.provider) + " · " + picked.model
        refreshAdvisorEffort(picked.model)
        refreshClearBtn(advSlot, picked.provider, picked.model)
        fireAgentSave()
      },
      onClear: () => {
        advSlot.dataset.provider = ""
        advSlot.dataset.model = ""
        advSlot.querySelector(".model-menu-btn").textContent = t("settings.inherit")
        refreshAdvisorEffort(null)
        refreshClearBtn(advSlot)
        fireAgentSave()
      },
    })
  }
}

function mountSlot(slot, { provider, model, onPick, onClear }) {
  if (!slot || slot.dataset.mounted === "1") return
  slot.dataset.mounted = "1"
  const models = SS.getModels?.() || []
  const btn = document.createElement("button")
  btn.type = "button"
  btn.className = "key-btn model-menu-btn"
  btn.textContent = provider && model ? labelFor(provider) + " · " + model : t("settings.pickModel")
  btn.addEventListener("click", (e) => {
    e.stopPropagation()
    openModelMenu({ anchorEl: btn, models, value: provider && model ? { provider, model } : null, onPick })
  })
  slot.replaceChildren(btn)
  // ✕ clears the value back to inherit — plain, visible, always available when set
  if (onClear && provider && model) {
    const clr = document.createElement("button")
    clr.type = "button"
    clr.className = "model-menu-clear"
    clr.title = t("settings.inherit")
    clr.textContent = "✕"
    clr.addEventListener("click", (e) => { e.stopPropagation(); onClear() })
    slot.appendChild(clr)
  }
}

function setRowModel(row, provider, model) {
  row.dataset.provider = provider
  row.dataset.model = model
  const btn = row.querySelector(".consult-model-slot .model-menu-btn")
  if (btn) btn.textContent = labelFor(provider) + " · " + model
  refreshRowEffort(row, model)
  document.getElementById("consult-rows")?.dispatchEvent(new window.Event("consult-rows-changed", { bubbles: true }))
}

function refreshRowEffort(row, model) {
  const old = row.querySelector(".consult-effort")
  const sel = buildEffortSelect({ model, current: old?.value, onChange: () => document.getElementById("consult-rows")?.dispatchEvent(new window.Event("consult-rows-changed", { bubbles: true })) })
  old?.remove()
  if (sel) row.insertBefore(sel, row.querySelector(".consult-del"))
}

function refreshAdvisorEffort(model) {
  const wrap = document.getElementById("adv-effort")?.closest(".key-field")
  if (!wrap) return
  const sel = buildEffortSelect({ model, current: wrap.querySelector("select")?.value, className: "" })
  if (!sel) { wrap.remove(); return }
  sel.id = "adv-effort"
  sel.addEventListener("change", fireAgentSave)
  wrap.querySelector("select")?.replaceWith(sel)
}

/** Show/hide the ✕ clear button next to a submodel trigger based on current value. */
function refreshClearBtn(slot, provider, model) {
  const has = !!(provider !== undefined ? (provider && model) : slot.dataset.value)
  let clr = slot.querySelector(".model-menu-clear")
  if (has && !clr) {
    clr = document.createElement("button")
    clr.type = "button"
    clr.className = "model-menu-clear"
    clr.title = t("settings.inherit")
    clr.textContent = "✕"
    clr.addEventListener("click", (e) => {
      e.stopPropagation()
      slot.dataset.value = ""
      slot.dataset.provider = ""
      slot.dataset.model = ""
      slot.querySelector(".model-menu-btn").textContent = t("settings.inherit")
      // Advisor's effort dropdown follows ONLY the advisor slot — a subagent clear must not touch it
      if (slot.id === "adv-model-slot") refreshAdvisorEffort(null)
      refreshClearBtn(slot)
      fireAgentSave()
    })
    slot.appendChild(clr)
  } else if (!has) clr?.remove()
}

function fireAgentSave() {
  document.getElementById("consult-rows")?.dispatchEvent(new window.Event("consult-rows-changed", { bubbles: true }))
}

export function bindConsultRows() {
  const rows = document.getElementById("consult-rows")
  const addBtn = document.getElementById("consult-add")
  if (!rows || !addBtn) {
    console.error("[consult] container or add button missing — rows:", !!rows, "add:", !!addBtn)
    return
  }
  addBtn.onclick = () => {
    try {
      if (rows.querySelectorAll(".consult-row").length >= 5) return
      const div = document.createElement("div")
      div.className = "key-field consult-row"
      div.innerHTML = '<span class="consult-model-slot"></span><button class="consult-del" title="' + t("settings.consultRemove") + '">✕</button>'
      rows.appendChild(div)
      mountSlot(div.querySelector(".consult-model-slot"), { provider: "", model: "", onPick: ({ provider, model }) => setRowModel(div, provider, model) })
      rows.dispatchEvent(new window.Event("consult-rows-changed", { bubbles: true }))
    } catch (e) {
      console.error("[consult] add row failed:", e)
    }
  }
  for (const row of rows.querySelectorAll(".consult-row")) {
    row.querySelector(".consult-del")?.addEventListener("click", () => { row.remove(); rows.dispatchEvent(new window.Event("consult-rows-changed", { bubbles: true })) })

  }
}
