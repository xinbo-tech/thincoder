/**
 * model-menu.js — THE one model picker (design: docs/design/MODEL-PICKER-UNIFY.md).
 *
 * Overlay/modal paradigm — NO CSS positioning wars:
 *   - a full-screen fixed overlay captures outside clicks/scroll (closes the menu)
 *   - the menu panel is position:fixed at the trigger's viewport rect (flip up when no room below)
 *   - the provider flyout is ALSO fixed on the overlay, positioned from the row's rect —
 *     never inside any scrolling/clipping ancestor, so it can never be cut off
 *   - fresh class names (mm-*), zero inheritance from the legacy .dropdown styles
 *
 * Every model selection in the panel (main model button, subagent slots, advisor, consult rows)
 * goes through openModelMenu(). The provider flyout has a live filter box
 * (type-to-narrow, case-insensitive substring — CLI pickers parity, GitHub #4 2026-08-31).
 */
import { t } from "./i18n.js"

/** Short display names for menu rows — the preset desc strings are long annotations
 *  (key-compatibility notes etc.) meant for the add-provider form, not menus. */
const PROVIDER_SHORT = {
  deepseek: "DeepSeek", kimi: "Kimi", "kimi-code": "Kimi Code", glm: "GLM", "glm-code": "GLM Coding",
  qwen: "Qwen", qwenplan: "Qwen Plan", minimax: "MiniMax", openai: "OpenAI",
  claude: "Claude", gemini: "Gemini", grok: "Grok", mistral: "Mistral",
  volcengine: "Volcengine", hunyuan: "Hunyuan", siliconflow: "SiliconFlow",
  openrouter: "OpenRouter", groq: "Groq",
}
function shortName(provider, group) {
  return PROVIDER_SHORT[provider] || (group && group.length > 22 ? provider : group) || provider
}

let _stylesInjected = false
function injectStyles() {
  if (_stylesInjected || typeof document === "undefined") return
  _stylesInjected = true
  const st = document.createElement("style")
  st.textContent = `
.mm-overlay { position: fixed; inset: 0; z-index: 1000; }
.mm-panel {
  position: fixed; z-index: 1001; min-width: 260px; max-width: 420px; max-height: 340px;
  overflow-y: auto; overflow-x: visible;
  background: var(--vscode-dropdown-background, #252526);
  border: 1px solid var(--border, #454545); border-radius: 6px;
  box-shadow: 0 6px 24px rgba(0,0,0,.35); font-size: 12px;
  color: var(--fg, #ccc);
}
.mm-row {
  padding: 6px 12px; cursor: pointer; display: flex; align-items: center;
  justify-content: space-between; gap: 8px; white-space: nowrap;
}
.mm-row:hover { background: var(--vscode-list-hoverBackground, rgba(255,255,255,.06)); }
.mm-row .mm-sub { opacity: .55; font-size: 11px; overflow: hidden; text-overflow: ellipsis; }
.mm-row .mm-arrow { opacity: .5; margin-left: 4px; }
.mm-row[aria-selected="true"] { background: var(--vscode-list-activeSelectionBackground, rgba(0,120,212,.25)); }
.mm-sep { height: 1px; background: var(--border, #454545); opacity: .5; margin: 4px 0; }
.mm-manage { opacity: .75; font-size: 11px; }
.mm-flyout {
  position: fixed; z-index: 1002; min-width: 180px; max-height: 320px; overflow-y: auto;
  background: var(--vscode-dropdown-background, #252526);
  border: 1px solid var(--border, #454545); border-radius: 6px;
  box-shadow: 0 6px 24px rgba(0,0,0,.35); font-size: 12px; color: var(--fg, #ccc);
}
.mm-flyout .mm-row .mm-check { color: var(--accent, #4ec9b0); }
.mm-filter {
  width: calc(100% - 18px); margin: 5px 9px 3px; padding: 4px 6px;
  box-sizing: border-box; min-width: 0;
  background: var(--vscode-input-background, #3c3c3c); color: var(--vscode-input-foreground, #ccc);
  border: 1px solid var(--vscode-input-border, #555); border-radius: 4px; font-size: 12px;
  outline: none;
}
.mm-filter:focus { border-color: var(--vscode-focusBorder, #0078d4); }
.mm-filter-nomatch { padding: 8px 12px; opacity: .6; }
.mm-loading { padding: 8px 12px; opacity: .6; }
`
  document.head.appendChild(st)
}

/** The current open menu's overlay element (or null). */
let _openOverlay = null

/** Close the open menu (idempotent). */
export function closeModelMenu() {
  _openOverlay?.remove()
  _openOverlay = null
  document.removeEventListener("keydown", onEsc, true)
  window.removeEventListener("resize", closeModelMenu)
}

function onEsc(e) { if (e.key === "Escape") closeModelMenu() }

/**
 * Open the model menu anchored to a trigger element.
 * @param anchorEl  the trigger (button) — menu positions from its viewport rect
 * @param models    [{ id, provider, group, label, reasoning, ... }]
 * @param value     { provider, model } | null — marks the current row with a check
 * @param onPick    ({ provider, model }) => void — menu closes before the callback
 * @param footer    [{ label, onClick }] — management entries (add/remove provider, set key)
 */
export function openModelMenu({ anchorEl, models, value, onPick, footer = [], up = false }) {
  injectStyles()
  closeModelMenu()

  const overlay = document.createElement("div")
  overlay.className = "mm-overlay"
  const panel = document.createElement("div")
  panel.className = "mm-panel"
  overlay.appendChild(panel)

  // ── content ──
  if (!models || models.length === 0) {
    const d = document.createElement("div")
    d.className = "mm-loading"
    d.textContent = t("model.loading") || "…"
    panel.appendChild(d)
  } else {
    const byProvider = new Map()
    for (const m of models) {
      const key = m.provider || m.group || ""
      if (!byProvider.has(key)) byProvider.set(key, { group: m.group || key, models: [] })
      byProvider.get(key).models.push(m)
    }
    for (const [provider, { group, models: provModels }] of byProvider) {
      panel.appendChild(providerRow(provider, group, provModels, value, onPick, overlay))
    }
  }
  if (footer.length > 0) {
    const sep = document.createElement("div")
    sep.className = "mm-sep"
    panel.appendChild(sep)
    for (const f of footer) {
      const item = document.createElement("div")
      item.className = "mm-row mm-manage"
      item.textContent = f.label
      item.addEventListener("click", (e) => { e.stopPropagation(); closeModelMenu(); f.onClick() })
      panel.appendChild(item)
    }
  }

  // ── positioning: viewport rect, flip up when no room below ──
  const place = () => {
    const r = anchorEl.getBoundingClientRect()
    const ph = Math.min(panel.offsetHeight || 200, 340)
    const below = window.innerHeight - r.bottom - 4
    const openUp = up || below < Math.min(ph, 180)
    panel.style.left = Math.max(4, Math.min(r.left, window.innerWidth - 270)) + "px"
    panel.style.top = openUp ? Math.max(4, r.top - ph - 4) + "px" : (r.bottom + 4) + "px"
  }

  overlay.addEventListener("click", (e) => { if (e.target === overlay) closeModelMenu() })
  // Flyout territory rule (event-driven, no timers): pointer over the open row or the
  // flyout keeps it open; over anything else (another row, the panel, the backdrop) closes
  // it — the row's own mouseenter will open ITS flyout on the same move.
  overlay.addEventListener("mouseover", (e) => {
    const row = overlay.querySelector(".mm-row[data-flyout-open]")
    if (!row) return
    const fly = overlay.querySelector(".mm-flyout")
    if (row.contains(e.target) || (fly && fly.contains(e.target))) return
    for (const f of overlay.querySelectorAll(".mm-flyout")) f.remove()
    delete row.dataset.flyoutOpen
  })
  document.addEventListener("keydown", onEsc, true)
  window.addEventListener("resize", closeModelMenu)

  document.body.appendChild(overlay)
  _openOverlay = overlay
  place()
  // measure after first paint for accurate height, then re-place
  window.requestAnimationFrame(place)
}

function providerRow(provider, group, models, value, onPick, overlay) {
  const current = models.find((m) => m.id === value?.model && (m.provider || "") === (value?.provider || ""))

  const item = document.createElement("div")
  item.className = "mm-row"
  item.setAttribute("role", "option")
  item.setAttribute("aria-selected", String(!!current))
  const name = document.createElement("span")
  name.textContent = shortName(provider, group)
  const arrow = document.createElement("span")
  arrow.className = "mm-arrow"
  arrow.textContent = "›"
  item.append(name, arrow)

  // Flyout open/close is PURELY event-driven — no timers, no grace windows.
  // Close condition: a mouseover bubbles up landing OUTSIDE (row ∪ flyout).
  // A stationary pointer generates no events → nothing closes. Ever.
  let flyout = null
  const pickModel = (m) => { closeModelMenu(); onPick({ provider: m.provider || provider, model: m.id }) }
  const openFlyout = () => {
    // The overlay-level mouseover handler removes flyouts from the DOM WITHOUT touching
    // this closure — a stale `flyout` reference made "hover back onto the same row" a
    // permanent no-op (first open works, every later hover dead). Trust the DOM, not the
    // closure: isConnected === genuinely open.
    if (flyout && flyout.isConnected) return
    flyout = null
    overlay.querySelectorAll(".mm-flyout").forEach((f) => f.remove()) // one flyout at a time
    overlay.querySelectorAll(".mm-row[data-flyout-open]").forEach((r) => delete r.dataset.flyoutOpen)
    flyout = document.createElement("div")
    flyout.className = "mm-flyout"
    item.dataset.flyoutOpen = "1"

    // Filter box (GitHub #4, 2026-08-31): type to narrow by case-insensitive
    // substring, same semantics as the CLI picker. ↑↓ moves a highlight,
    // Enter picks the highlighted (or first) match. Empty query shows all.
    const filter = document.createElement("input")
    filter.className = "mm-filter"
    filter.placeholder = t("model.filterPlaceholder") || "Filter models…"
    filter.addEventListener("click", (e) => e.stopPropagation()) // typing must not bubble to overlay-close
    flyout.appendChild(filter)

    const listBox = document.createElement("div")
    flyout.appendChild(listBox)

    let filtered = models.slice()
    let highlight = 0
    const renderList = () => {
      listBox.textContent = ""
      const q = filter.value.trim().toLowerCase()
      filtered = q ? models.filter((m) => (m.label || m.id).toLowerCase().includes(q)) : models.slice()
      highlight = Math.min(highlight, Math.max(0, filtered.length - 1))
      if (filtered.length === 0) {
        const nm = document.createElement("div")
        nm.className = "mm-filter-nomatch"
        nm.textContent = t("model.noMatch") || "No models match"
        listBox.appendChild(nm)
        return
      }
      filtered.forEach((m, i) => {
        const row = document.createElement("div")
        row.className = "mm-row"
        row.setAttribute("role", "option")
        const sel = m.id === value?.model && (m.provider || "") === (value?.provider || "")
        if (sel) row.setAttribute("aria-selected", "true")
        else if (i === highlight) row.setAttribute("aria-selected", "true")
        if (i === highlight) row.style.outline = "1px solid var(--vscode-focusBorder, #0078d4)"
        const lbl = document.createElement("span")
        lbl.textContent = m.label
        row.appendChild(lbl)
        if (sel) { const c = document.createElement("span"); c.className = "mm-check"; c.textContent = "✓"; row.appendChild(c) }
        row.addEventListener("mousedown", (e) => { e.preventDefault(); e.stopPropagation(); pickModel(m) })
        row.addEventListener("click", (e) => { e.stopPropagation(); pickModel(m) })
        listBox.appendChild(row)
      })
    }
    filter.addEventListener("input", () => { highlight = 0; renderList() })
    filter.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") { e.preventDefault(); highlight = Math.min(highlight + 1, filtered.length - 1); renderList() }
      else if (e.key === "ArrowUp") { e.preventDefault(); highlight = Math.max(highlight - 1, 0); renderList() }
      else if (e.key === "Enter") { e.preventDefault(); const m = filtered[highlight] ?? filtered[0]; if (m) pickModel(m) }
    })

    renderList()
    // Render the container first so the flyout has a measurable height, then focus the filter.
    overlay.appendChild(flyout)
    const rr = item.getBoundingClientRect()
    const fh = Math.min(flyout.offsetHeight || 200, 320)
    // FLUSH against the row's right edge (1px overlap) — no dead zone crossing.
    let left = rr.right - 1
    if (left + 190 > window.innerWidth) left = rr.left - 191 // flip left when no room on the right
    flyout.style.left = Math.max(4, left) + "px"
    flyout.style.top = Math.max(0, Math.min(rr.top - 1, window.innerHeight - fh - 4)) + "px"
    filter.focus()
  }

  item.addEventListener("mouseenter", openFlyout)
  // Leaving the row alone does NOT close — the shared overlay mouseover handler decides
  // based on where the pointer actually lands (row ∪ flyout stays open, anything else closes).
  // Click on the row is a NO-OP toggle fix (GitHub #4): it only ensures the flyout is open —
  // with hover already having opened it, clicking no longer closes it ("clicked, nothing happened").
  item.addEventListener("click", (e) => { e.stopPropagation(); openFlyout() })
  return item
}
