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
  // LEDGER-RELIABILITY（§6.25 判据句 4 · VSC 接线）：账本异常 ⇒ 首行警示注记——**非可点条目**
  // （裸 `div`：零 role / 零 tabindex / 零 handler）；缺席 ⇒ **零节点**（异常清 ⇒ 注记消失——零历史态）。
  // 文案 = `ledgerNoticeText`（主句 + `scene === true` 条件附句——两键合成；修正轮 · `WEBVIEW-PROTOCOL.md` §6.3）。
  if (ctx._ledger) {
    const notice = document.createElement("div")
    notice.className = "session-ledger-notice"
    notice.setAttribute("data-ledger-notice", "")
    notice.style.padding = "6px 10px"
    notice.style.opacity = "0.7"
    notice.textContent = ledgerNoticeText(ctx._ledger)
    ctx.sessionDropdown.appendChild(notice)
  }
  for (const s of ctx._sessions) {
    const item = document.createElement("div")
    item.className = "session-item"
    item.tabIndex = 0
    item.setAttribute("role", "option")
    item.setAttribute("aria-selected", String(!!s.active))
    if (s.active) item.classList.add("active")
    // LEDGER-RELIABILITY（§6.25 判据句 4）：计数不可得（`null`）⇒ 「—msgs」占位（禁显示 0 / 裸 null）
    const msgs = s.count == null ? "—msgs" : `${s.count}msgs`
    item.innerHTML = `<span class="session-item-title">${escHtml(s.title)}</span>
      <span class="session-item-meta">${s.provider ? escHtml(s.provider) + " · " : ""}${msgs}${s.updated ? " · " + fmtDate(s.updated) : ""}</span>`
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

/**
 * 账本警示注记文案（修正轮 · 承 `WEBVIEW-PROTOCOL.md` §6.3）：主句 + **`scene === true` 时条件附句**
 * （两键合成；`scene` 缺 / false ⇒ 仅主句——与 CLI 条件附句同口径）。
 * 分隔符随语种：zh「；」/ en「; 」——webview 无 locale 标识（i18n 面只投已解析字串），
 * 故取主句**模板**字面自判（含汉字 ⇒ zh——判据与 `${reason}` 取值无关）。
 */
function ledgerNoticeText(ledger) {
  const main = t("session.ledgerNotice", { reason: ledger.reason })
  if (ledger.scene !== true) return main
  const sep = /[\u4E00-\u9FFF]/.test(t("session.ledgerNotice")) ? "；" : "; "
  return main + sep + t("session.ledgerNotice.scene")
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
    // #1101㈠ (a)（2026-10-10 vsc-consistency 批 · `PROJECT-SWITCHER.md` §3.1）：「没选过不猜」——
    // 未选定（`chosen` 缺 ∥ false）⇒ 名后附标记（文本 ∥ title 同携）；已选 ∥ 单根零变。
    const notChosen = m.chosen ? "" : ` · ${t("project.notChosen")}`
    btn.textContent = "📁 " + name + notChosen
    const title = m.followActive
      ? `${m.current} · ${t("project.followActiveOn")}`
      : m.current
    btn.title = title + notChosen
  } else {
    btn.style.display = "none"
  }
}
