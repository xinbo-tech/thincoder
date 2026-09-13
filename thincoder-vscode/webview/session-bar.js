/**
 * session-bar.js — session selector dropdown (switch / rename / delete with
 * inline confirmation), the new-session button, and the current-project button.
 * Imported for its side effects (registers the session-bar listeners).
 */
import { ctx, vscode } from "./state.js"
import { t } from "./i18n.js"
import { escHtml } from "./ui.js"

document.getElementById("new-session-btn").addEventListener("click", () => vscode.postMessage({ type: "newSession" }))

ctx.sessionSelector.addEventListener("click", (e) => {
  e.stopPropagation()
  const open = ctx.sessionDropdown.style.display !== "none"
  ctx.sessionDropdown.style.display = open ? "none" : "block"
  ctx.sessionSelector.setAttribute("aria-expanded", String(!open))
  if (!open) buildSessionDropdown()
})

ctx.sessionSelector.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault()
    ctx.sessionSelector.click()
  }
})

ctx.sessionDropdown.addEventListener("click", (e) => {
  e.stopPropagation() // prevent closing when clicking inside dropdown
})

function buildSessionDropdown() {
  ctx.sessionDropdown.innerHTML = ""
  for (const s of ctx._sessions) {
    const item = document.createElement("div")
    item.className = "session-item"
    item.tabIndex = 0
    item.setAttribute("role", "option")
    item.setAttribute("aria-selected", String(!!s.active))
    if (s.active) item.classList.add("active")
    item.innerHTML = `<span class="session-item-title">${escHtml(s.title)}</span>
      <span class="session-item-meta">${s.provider ? escHtml(s.provider) + " · " : ""}${s.count}msgs${s.updated ? " · " + fmtDate(s.updated) : ""}</span>`
    item.innerHTML += `<button class="session-rename" title="${t("session.rename")}" aria-label="${t("session.rename")} ${escHtml(s.title)}">✎</button>`
    if (ctx._sessions.length > 1) {
      item.innerHTML += `<button class="session-delete" title="${t("session.delete")}" aria-label="${t("session.delete")} ${escHtml(s.title)}">✕</button>`
    }
    item.addEventListener("click", (e) => {
      if (e.target.closest(".session-delete") || e.target.closest(".session-rename")) return
      vscode.postMessage({ type: "switchSession", slot: s.slot })
      ctx.sessionDropdown.style.display = "none"
    })
    const renBtn = item.querySelector(".session-rename")
    if (renBtn) renBtn.addEventListener("click", (e) => {
      e.stopPropagation()
      vscode.postMessage({ type: "renameSession", slot: s.slot, currentTitle: s.title })
    })
    const delBtn = item.querySelector(".session-delete")
    if (delBtn) delBtn.addEventListener("click", (e) => {
      e.stopPropagation()
      // Deleting a whole session is irreversible — inline confirmation (a native
      // window.confirm does not work inside the webview sandbox).
      showSessionDeleteConfirm(s.slot, s.title)
    })
    ctx.sessionDropdown.appendChild(item)
  }
  if (ctx._sessions.length === 0) {
    const empty = document.createElement("div")
    empty.className = "session-item"
    empty.textContent = t("session.empty")
    empty.style.opacity = "0.5"
    ctx.sessionDropdown.appendChild(empty)
  }
}

/** Inline confirmation popover for session deletion (reuses the AUTO popover style). */
function showSessionDeleteConfirm(slot, title) {
  document.querySelector(".auto-confirm")?.remove()
  document.querySelector(".auto-backdrop")?.remove()

  const backdrop = document.createElement("div")
  backdrop.className = "auto-backdrop"
  backdrop.addEventListener("click", () => {
    backdrop.remove()
    document.querySelector(".auto-confirm")?.remove()
  })

  const popover = document.createElement("div")
  popover.className = "auto-confirm"
  popover.setAttribute("role", "alertdialog")
  popover.setAttribute("aria-label", t("session.delete"))
  // escHtml the title BEFORE interpolation — it lands inside innerHTML.
  popover.innerHTML = `<div class="auto-confirm-text">${t("session.deleteConfirm", { title: escHtml(title) })}</div>
    <div class="auto-confirm-actions">
      <button class="auto-confirm-yes" aria-label="${t("session.delete")}">${t("session.delete")}</button>
      <button class="auto-confirm-no" aria-label="${t("question.cancel")}">${t("question.cancel")}</button>
    </div>`

  document.body.appendChild(backdrop)
  document.body.appendChild(popover)
  setTimeout(() => popover.querySelector(".auto-confirm-no")?.focus(), 50) // safer default

  const close = () => { popover.remove(); backdrop.remove() }
  popover.querySelector(".auto-confirm-yes").addEventListener("click", () => {
    close()
    vscode.postMessage({ type: "deleteSession", slot })
  })
  popover.querySelector(".auto-confirm-no").addEventListener("click", close)
}

export function updateSessionTitle() {
  const active = ctx._sessions.find((s) => s.active)
  ctx.sessionTitle.textContent = active ? active.title : t("session.title")
}

function fmtDate(ts) {
  const d = new Date(ts)
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) +
    " " + d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
}

// Current-project button (multi-root): native picker on the extension side.
ctx.projectBtn?.addEventListener("click", () => vscode.postMessage({ type: "setProject" }))

/** project message: show/hide the multi-root switcher button. */
export function handleProjectMessage(m) {
  const btn = ctx.projectBtn
  if (!btn) return
  if (m.multi) {
    btn.style.display = ""
    const name = (m.folders || []).find((f) => f.path === m.current)?.name
      || String(m.current || "").split(/[\\/]/).pop()
    btn.textContent = "📁 " + name
    btn.title = m.followActive
      ? `${m.current} · ${t("project.followActiveOn")}`
      : m.current
  } else {
    btn.style.display = "none"
  }
}
