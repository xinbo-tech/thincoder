/**
 * attach.mjs — composer 附件面工厂（核化 VSC `webview/autocomplete.js:122-184` 的采集 ∕ 栅格门 ∕ 芯片条
 * 三面——上提批 `2026-09-28-desktop-input-vsc-align.md` §2.3 ∕ §2.4 P5；工厂化 = 模块级副作用
 * （DOM 查询 ∕ 事件注册）搬进工厂体，语义零变）。
 *
 * 面：
 *  - 栅格门 `RASTER_MIME`（值源 = `autocomplete.js:126` 同式，含非标 `image/jpg`）——
 *    **判据面与桌面 `renderer/attach.mjs` 现物同源合流**：两处现为同一字面；桌面换装轮改指本档（§2.3 attach 行）。
 *  - 文档级 paste 采集（`:127-142` 逐字：栅格受纳 + `preventDefault` 一次；非栅格图项拒即核 toast，非图零吞）。
 *  - `#file-input` ∕ `#attach-btn`（`:144-153` 逐字：点击 ⇒ 文件选取 `accept="image/*" multiple`；change 毕清 `value`）。
 *  - `#paste-bar` ∕ `#paste-badge` 芯片条（`:155-184` 逐字：`📎 image N` + ✕ 按 idx splice 重渲）。
 *
 * 注入面（五项之自足面）：无出站、无 hooks；取词 = 核 `../i18n.mjs`（注册面，端侧 `setStrings` 单点）。
 * 返回 = 调用方装配面（元素引用 + 清面 + 共享图列）。
 *
 * 图列身份：`images` 由调用方给出（本项目 = `panel.mjs`）——`send` 径 `[...images]` 快照 + `length = 0`
 * 保身份（VSC `send.js:74-82` GitHub thincoder#3 注：引用失效 = 首次粘贴后即断）；本档不改身份。
 */
import { t } from "../i18n.mjs"
import { showToast } from "../toast.mjs"

/** 栅格四型判据（值源 = VSC `webview/autocomplete.js:126` 同式）。 */
export const RASTER_MIME = /^(image\/(png|jpeg|jpg|gif|webp))$/

/**
 * 附件面工厂。`deps.images` = 共享图列（缺省 = 新建空列——调用方应给出以保 `send` 侧同引用）。
 * 返回：`{ fileInput, attachBtn, pasteBar, pasteBadge, images, renderPasteBar, clear }`。
 * 元素装配（序 = VSC `index.html`：`#input-row` 内 `#file-input` / `#attach-btn`；`#paste-bar` > `#paste-badge`）
 * 归调用方——本档只造元素 + 接线。
 */
export function createAttachBar(deps = {}) {
  const images = Array.isArray(deps.images) ? deps.images : []

  // ── 结构（照 VSC `index.html:44,46,50-52` 静态形）──
  const fileInput = document.createElement("input")
  fileInput.type = "file"
  fileInput.id = "file-input"
  fileInput.accept = "image/*"
  fileInput.multiple = true
  fileInput.style.display = "none"

  const attachBtn = document.createElement("button")
  attachBtn.id = "attach-btn"
  attachBtn.title = "Attach image"
  attachBtn.setAttribute("aria-label", "Attach image")
  attachBtn.textContent = "Attach"

  const pasteBar = document.createElement("div")
  pasteBar.id = "paste-bar"
  pasteBar.style.display = "none"
  const pasteBadge = document.createElement("span")
  pasteBadge.id = "paste-badge"
  pasteBadge.setAttribute("role", "list")
  pasteBadge.setAttribute("aria-label", "Attached images")
  pasteBar.appendChild(pasteBadge)

  // ── 图像粘贴（`autocomplete.js:127-142` 逐字）──
  // Raster-only gate (GitHub thincoder#3 review #1): the extension's savePastedImages
  // accepts png/jpeg/gif/webp only — accepting other image/* here would render a 📎 chip
  // that silently vanishes on send (no pointer, no error on the model side).
  document.addEventListener("paste", (e) => {
    const items = e.clipboardData?.items
    if (!items) return
    let hasImage = false
    for (const item of items) {
      if (RASTER_MIME.test(item.type)) {
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

  // ── 文件选取（`autocomplete.js:144-153` 逐字；DOM 查询 → 本档元素引用）──
  attachBtn.addEventListener("click", () => fileInput.click())
  fileInput.addEventListener("change", () => {
    for (const file of fileInput.files) {
      if (RASTER_MIME.test(file.type)) readImageFile(file)
      else if (file.type.startsWith("image/")) showToast(t("paste.unsupportedFormat", { type: file.type }))
    }
    fileInput.value = ""
  })

  function readImageFile(file) {
    const reader = new FileReader()
    reader.onload = () => {
      images.push(reader.result)
      renderPasteBar()
    }
    reader.readAsDataURL(file)
  }

  function renderPasteBar() {
    if (images.length === 0) {
      pasteBar.style.display = "none"
      return
    }
    // VSC `:171` 的 `!bar || !badge` 支（fixture DOM 兜底）随工厂化退场——两元素由本档自建，恒在。
    pasteBadge.innerHTML = images.map((_, i) =>
      `<span class="paste-chip">📎 image ${i + 1}<span class="paste-chip-del" data-idx="${i}">✕</span></span>`
    ).join(" ")
    pasteBar.style.display = "flex"
    pasteBadge.querySelectorAll(".paste-chip-del").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation()
        const idx = parseInt(btn.dataset.idx)
        images.splice(idx, 1)
        renderPasteBar()
      })
    })
  }

  /** 提交后清面（VSC `send.js:52-53,81-82` 两行：条隐 + 徽标清空；图列清空归调用方 `length = 0`）。 */
  function clear() {
    pasteBar.style.display = "none"
    pasteBadge.innerHTML = ""
  }

  return { fileInput, attachBtn, pasteBar, pasteBadge, images, renderPasteBar, clear }
}
