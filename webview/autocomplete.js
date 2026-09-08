/**
 * autocomplete.js — @-autocomplete, image paste, and file upload
 * Exports initAutocomplete(ui) to wire into the chat page.
 */
import { escHtml } from "./ui.js"
import { t } from "./i18n.js"

/**
 * @param {object} ui
 * @param {HTMLTextAreaElement} ui.inputEl
 * @param {HTMLElement} ui.atDropdown
 * @param {object} ui.vscode — VS Code API
 * @param {Array<string>} ui.pastedImages — shared array for pasted images
 */
export function initAutocomplete({ inputEl, atDropdown, vscode, pastedImages }) {
  let _atTimer = null, _atActive = false, _atBase = "", _atSeq = 0

  function handleAtInput() {
    const pos = inputEl.selectionStart
    const text = inputEl.value.slice(0, pos)
    const atIdx = text.lastIndexOf("@")
    if (atIdx < 0) { closeAtDropdown(); return }
    const afterAt = text.slice(atIdx + 1)
    if (/\s/.test(afterAt)) { closeAtDropdown(); return }
    _atBase = text.slice(0, atIdx)
    const query = text.slice(atIdx)
    clearTimeout(_atTimer)
    _atTimer = setTimeout(() => {
      // C1（SESSION-FLOW-C F-C1c——修 H-A）：请求带自增 seq——host 只回显最新（慢 findFiles
      // 迟到返回不覆盖新下拉——防抖已挡连续输入风暴，seq 兜住防抖窗外的乱序返回）。
      _atSeq += 1
      vscode.postMessage({ type: "atComplete", query, cwd: "", seq: _atSeq })
    }, 150)
  }

  function showAtDropdown(matches) {
    if (matches.length === 0) { closeAtDropdown(); return }
    atDropdown.innerHTML = matches.map((m, i) =>
      `<div class="dropdown-item${i === 0 ? " active" : ""}" data-path="${escHtml(m.path)}" tabindex="0" role="option" aria-selected="${i === 0}">
        <span class="at-file-name">${escHtml(m.name)}</span>
        <span class="at-file-path">${escHtml(m.path)}</span>
      </div>`
    ).join("")
    atDropdown.style.display = "block"
    atDropdown.setAttribute("aria-expanded", "true")
    _atActive = true
  }

  function closeAtDropdown() {
    atDropdown.style.display = "none"
    atDropdown.setAttribute("aria-expanded", "false")
    _atActive = false
    atDropdown.innerHTML = ""
    clearTimeout(_atTimer)
  }

  function insertAtRef(path) {
    const pos = inputEl.selectionStart
    const text = inputEl.value
    const before = _atBase + "@" + path
    const after = text.slice(pos)
    inputEl.value = before + " " + after
    inputEl.selectionStart = inputEl.selectionEnd = before.length + 1
    inputEl.focus()
  }

  // ── bind events ──

  inputEl.addEventListener("input", () => {
    if (!_atActive) return
    handleAtInput()
  })

  inputEl.addEventListener("keydown", (e) => {
    if (!_atActive) return
    if (e.key === "Escape") { closeAtDropdown(); e.preventDefault(); return }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault()
      const items = atDropdown.querySelectorAll(".dropdown-item")
      if (items.length === 0) return
      const cur = atDropdown.querySelector(".dropdown-item.active")
      const idx = cur ? Array.from(items).indexOf(cur) : -1
      if (e.key === "ArrowDown") {
        const next = idx + 1 < items.length ? idx + 1 : 0
        items.forEach(i => i.classList.remove("active"))
        items[next].classList.add("active")
        items[next].scrollIntoView({ block: "nearest" })
      } else {
        const prev = idx - 1 >= 0 ? idx - 1 : items.length - 1
        items.forEach(i => i.classList.remove("active"))
        items[prev].classList.add("active")
        items[prev].scrollIntoView({ block: "nearest" })
      }
      return
    }
    if (e.key === "Enter" || e.key === "Tab") {
      const active = atDropdown.querySelector(".dropdown-item.active")
      if (active) {
        e.preventDefault()
        insertAtRef(active.dataset.path)
        closeAtDropdown()
      }
      return
    }
  })

  // Detect @ typing to activate autocomplete. After typing "@", selectionStart
  // is AFTER the @, so the @ is at pos - 1 (the previous pos - 2 checked the
  // character BEFORE the @ — never matched, so the dropdown never activated).
  inputEl.addEventListener("input", (_e) => {
    const pos = inputEl.selectionStart
    const prevChar = inputEl.value[pos - 1]
    if (prevChar === "@") {
      _atActive = true
      handleAtInput()
    }
  })

  // ── image paste ──
  // Raster-only gate (GitHub thincoder#3 review #1): the extension's savePastedImages
  // accepts png/jpeg/gif/webp only — accepting other image/* here would render a 📎 chip
  // that silently vanishes on send (no pointer, no error on the model side).
  const RASTER = /^(image\/(png|jpeg|jpg|gif|webp))$/
  document.addEventListener("paste", (e) => {
    const items = e.clipboardData?.items
    if (!items) return
    let hasImage = false
    for (const item of items) {
      if (RASTER.test(item.type)) {
        if (!hasImage) { e.preventDefault(); hasImage = true }
        readImageFile(item.getAsFile())
      } else if (item.type.startsWith("image/")) {
        // Non-raster image on the clipboard (svg/heic/bmp) — same rejection + feedback
        // as the file-upload entry below; never a silent drop.
        e.preventDefault()
        showToast(t("paste.unsupportedFormat", { type: item.type }))
      }
    }
  })

  // ── file upload ──
  const fileInput = document.getElementById("file-input")
  document.getElementById("attach-btn").addEventListener("click", () => fileInput.click())
  fileInput.addEventListener("change", () => {
    for (const file of fileInput.files) {
      if (RASTER.test(file.type)) readImageFile(file)
      else if (file.type.startsWith("image/")) showToast(t("paste.unsupportedFormat", { type: file.type }))
    }
    fileInput.value = ""
  })

  function readImageFile(file) {
    const reader = new FileReader()
    reader.onload = () => {
      pastedImages.push(reader.result)
      renderPasteBar()
    }
    reader.readAsDataURL(file)
  }

  /** Transient hint for rejected images (auto-fades; zero layout dependency). */
  function showToast(text) {
    let el = document.getElementById("paste-toast")
    if (!el) {
      el = document.createElement("div")
      el.id = "paste-toast"
      el.className = "paste-toast"
      document.body.appendChild(el)
    }
    el.textContent = text
    el.classList.add("visible")
    clearTimeout(showToast._t)
    showToast._t = setTimeout(() => el.classList.remove("visible"), 2600)
  }

  function renderPasteBar() {
    const bar = document.getElementById("paste-bar")
    const badge = document.getElementById("paste-badge")
    if (pastedImages.length === 0) {
      if (bar) bar.style.display = "none"
      return
    }
    if (!bar || !badge) return // fixture/test DOM without the paste bar
    badge.innerHTML = pastedImages.map((_, i) =>
      `<span class="paste-chip">📎 image ${i + 1}<span class="paste-chip-del" data-idx="${i}">✕</span></span>`
    ).join(" ")
    bar.style.display = "flex"
    badge.querySelectorAll(".paste-chip-del").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation()
        const idx = parseInt(btn.dataset.idx)
        pastedImages.splice(idx, 1)
        renderPasteBar()
      })
    })
  }

  // ── expose to message handler ──
  return { showAtDropdown, closeAtDropdown }
}
