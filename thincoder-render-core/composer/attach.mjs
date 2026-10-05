/**
 * attach.mjs — composer 附件面工厂（核化 VSC `webview/autocomplete.js:122-184` 的采集 ∕ 栅格门 ∕ 芯片条
 * 三面——上提批 `2026-09-28-desktop-input-vsc-align.md` §2.3 ∕ §2.4 P5；工厂化 = 模块级副作用
 * （DOM 查询 ∕ 事件注册）搬进工厂体，语义零变）。
 *
 * 面：
 *  - 栅格门 `RASTER_MIME`（值源 = `autocomplete.js:126` 同式，含非标 `image/jpg`）——
 *    **判据面与桌面 `renderer/attach.mjs` 现物同源合流**：两处现为同一字面；桌面换装轮改指本档（§2.3 attach 行）。
 *  - 文档级 paste 采集（`:127-142` 逐字：栅格受纳 + `preventDefault` 一次；非栅格图项拒即核 toast，非图零吞）。
 *  - `#file-input` ∕ `#attach-btn`（`:144-153` 逐字：点击 ⇒ 文件选取；change 毕清 `value`）——**受纳面扩文本/源码族**
 *    （2026-10-05 · §2 KD-RC-13 · 批 `docs/batches/2026-10-05-attach-file-support.md`）：`accept` 同源派生
 *    （`image/*` + `text/*` + `TEXT_EXTS`）；`isTextFile` ⇒ `collectTextFile`（判序 = 档数 → 单档 → 合计；
 *    前 8000 B NUL 扫描 ⇒ UTF-8 解码入列）；非受纳 ⇒ 出声拒（零静默）。
 *  - `#paste-bar` ∕ `#paste-badge` 芯片条（`:155-184` 逐字：`📎 image N` + ✕ 按 idx splice 重渲）——
 *    双族同条（图 `data-kind="image"` ∥ 档 `📎 <名>` 经 HTML 转义；✕ 按 `data-kind` 分列删除）。
 *  - 内联纯函数两件（导出面）：`formatFileBlock` ∥ `withAttachedFiles`（`panel.mjs` `send()` 两径消费）。
 *
 * 注入面（五项之自足面）：无出站、无 hooks；取词 = 核 `../i18n.mjs`（注册面，端侧 `setStrings` 单点）。
 * 返回 = 调用方装配面（元素引用 + 清面 + 共享图列 + 文本档列）。
 *
 * 图列身份：`images` 由调用方给出（本项目 = `panel.mjs`）——`send` 径 `[...images]` 快照 + `length = 0`
 * 保身份（VSC `send.js:74-82` GitHub thincoder#3 注：引用失效 = 首次粘贴后即断）；本档不改身份。
 */
import { t } from "../i18n.mjs"
import { showToast } from "../toast.mjs"

/** 栅格四型判据（值源 = VSC `webview/autocomplete.js:126` 同式）。 */
export const RASTER_MIME = /^(image\/(png|jpeg|jpg|gif|webp))$/

/** 受纳扩展名清单（**79** 项——文本 / 源码族；值源 = 设计 KD-RC-13 逐项枚举）。 */
export const TEXT_EXTS = [
  ".txt", ".md", ".markdown", ".mdx", ".rst", ".log", ".csv", ".tsv",
  ".json", ".jsonc", ".json5", ".yaml", ".yml", ".toml", ".ini", ".cfg",
  ".conf", ".env", ".xml", ".properties", ".html", ".htm", ".css", ".scss",
  ".sass", ".less", ".js", ".mjs", ".cjs", ".jsx", ".ts", ".mts",
  ".cts", ".tsx", ".py", ".pyi", ".rb", ".go", ".rs", ".java",
  ".kt", ".kts", ".scala", ".swift", ".c", ".h", ".cc", ".cpp",
  ".hpp", ".cxx", ".hxx", ".cs", ".php", ".lua", ".pl", ".pm",
  ".r", ".jl", ".dart", ".vue", ".svelte", ".astro", ".sh", ".bash",
  ".zsh", ".fish", ".ps1", ".psm1", ".bat", ".cmd", ".sql", ".graphql",
  ".gql", ".proto", ".gradle", ".groovy", ".tf", ".hcl", ".mk",
]

/** 三限（B = 字节；**KB = 1000 B**——词面同口径）：单档 ≤ 256 000 B ∥ **每回合**（= 每次发送前的未发列表）
 *  ≤ 4 档 ∥ 每回合合计 ≤ 512 000 B。 */
export const TEXT_MAX_BYTES = 256000
export const TEXT_TURN_MAX_FILES = 4
export const TEXT_TURN_MAX_BYTES = 512000

/** 二进制判据窗：前 8000 B NUL 扫描（git `buffer_is_binary` 同窗）。 */
export const BINARY_SCAN_BYTES = 8000

/** 文件名扩展名（含点、小写；无点 ⇒ 空串）——本档内部件（受纳判据 ∥ info string 两处共用）。 */
function fileExt(name) {
  const s = String(name)
  const dot = s.lastIndexOf(".")
  return dot === -1 ? "" : s.slice(dot).toLowerCase()
}

/** 受纳判据：MIME 前缀 `text/` ∨ 扩展名 ∈ `TEXT_EXTS`。 */
export function isTextFile(file) {
  if (file?.type?.startsWith("text/")) return true
  const ext = fileExt(file?.name ?? "")
  return ext !== "" && TEXT_EXTS.includes(ext)
}

/**
 * 附件面工厂。`deps.images` = 共享图列（缺省 = 新建空列——调用方应给出以保 `send` 侧同引用）。
 * 返回：`{ fileInput, attachBtn, pasteBar, pasteBadge, images, files, renderPasteBar, clear }`
 * （`files` = 文本档列，档位形 `{ name, size, text }`；与 `images` 同式由调用方 `length = 0` 清点）。
 * 元素装配（序 = VSC `index.html`：`#input-row` 内 `#file-input` / `#attach-btn`；`#paste-bar` > `#paste-badge`）
 * 归调用方——本档只造元素 + 接线。
 */
export function createAttachBar(deps = {}) {
  const images = Array.isArray(deps.images) ? deps.images : []
  // 文本/源码档列（档位形 = `{ name, size, text }`——`send` 径 `[...files]` 快照 + `length = 0` 保身份，照 images 式）。
  const files = []

  // ── 结构（照 VSC `index.html:44,46,50-52` 静态形）──
  const fileInput = document.createElement("input")
  fileInput.type = "file"
  fileInput.id = "file-input"
  fileInput.accept = ["image/*", "text/*", ...TEXT_EXTS].join(",")
  fileInput.multiple = true
  fileInput.style.display = "none"

  const attachBtn = document.createElement("button")
  attachBtn.id = "attach-btn"
  attachBtn.title = "Attach file"
  attachBtn.setAttribute("aria-label", "Attach file")
  attachBtn.textContent = "Attach"

  const pasteBar = document.createElement("div")
  pasteBar.id = "paste-bar"
  pasteBar.style.display = "none"
  const pasteBadge = document.createElement("span")
  pasteBadge.id = "paste-badge"
  pasteBadge.setAttribute("role", "list")
  pasteBadge.setAttribute("aria-label", "Attached files")
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
      else if (isTextFile(file)) collectTextFile(file)
      // 兜底（本批）：非受纳类型一律出声——修前为零反馈静默丢弃面。
      else showToast(t("composer.attach.unsupported", { name: file.name }))
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

  /** 在飞（已受理、未落列）档记账——判据读面 = `files` + 在飞档：同一 `change` 事件多选时逐档递推，
   *  受理即入账（读取完成才落 `files`；失败 ∥ 二进制拒则销账——零入列）。 */
  let pendingCount = 0
  let pendingBytes = 0

  /** 文本档采集（判序 = 档数 → 单档 → 合计——先到先拒，各拒一支 toast；零静默）。读 = `readAsArrayBuffer`
   *  ⇒ 前 `BINARY_SCAN_BYTES` B NUL 扫描（二进制判据）⇒ UTF-8 解码入列 + 重渲芯片；读失败
   *  （`error` / `abort`）⇒ 出声拒（`composer.attach.readFailed`——零入列 ∥ 零芯片）。 */
  function collectTextFile(file) {
    const name = file.name
    if (files.length + pendingCount >= TEXT_TURN_MAX_FILES) { showToast(t("composer.attach.tooMany", { name })); return }
    if (file.size > TEXT_MAX_BYTES) { showToast(t("composer.attach.tooLarge", { name })); return }
    if (totalBytes() + pendingBytes + file.size > TEXT_TURN_MAX_BYTES) { showToast(t("composer.attach.totalLimit", { name })); return }
    pendingCount += 1
    pendingBytes += file.size
    const settle = () => { pendingCount -= 1; pendingBytes -= file.size }
    const reader = new FileReader()
    const fail = () => { settle(); showToast(t("composer.attach.readFailed", { name })) }
    reader.onload = () => {
      settle()
      const bytes = new Uint8Array(reader.result)
      if (bytes.subarray(0, BINARY_SCAN_BYTES).includes(0)) { showToast(t("composer.attach.binary", { name })); return }
      files.push({ name, size: file.size, text: new TextDecoder().decode(bytes) })
      renderPasteBar()
    }
    reader.onerror = fail
    reader.onabort = fail
    reader.readAsArrayBuffer(file)
  }

  /** 已落列档位字节合计（合计限读面之一——另一个 = 在飞档 `pendingBytes`）。 */
  function totalBytes() {
    return files.reduce((n, f) => n + f.size, 0)
  }

  function renderPasteBar() {
    if (images.length === 0 && files.length === 0) {
      pasteBar.style.display = "none"
      return
    }
    // VSC `:171` 的 `!bar || !badge` 支（fixture DOM 兜底）随工厂化退场——两元素由本档自建，恒在。
    // 双族同条：图芯片 `📎 image N`（文本锁不动——仅 +`data-kind` 属性级）∥ 档芯片 `📎 <名>`（名经 HTML 转义）。
    pasteBadge.innerHTML = [
      ...images.map((_, i) =>
        `<span class="paste-chip">📎 image ${i + 1}<span class="paste-chip-del" data-kind="image" data-idx="${i}">✕</span></span>`
      ),
      ...files.map((f, i) =>
        `<span class="paste-chip">📎 ${escapeHtml(f.name)}<span class="paste-chip-del" data-kind="file" data-idx="${i}">✕</span></span>`
      ),
    ].join(" ")
    pasteBar.style.display = "flex"
    pasteBadge.querySelectorAll(".paste-chip-del").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation()
        const idx = parseInt(btn.dataset.idx)
        if (btn.dataset.kind === "file") files.splice(idx, 1)
        else images.splice(idx, 1)
        renderPasteBar()
      })
    })
  }

  /** 提交后清面（VSC `send.js:52-53,81-82` 两行：条隐 + 徽标清空；图列清空归调用方 `length = 0`）。 */
  function clear() {
    pasteBar.style.display = "none"
    pasteBadge.innerHTML = ""
  }

  return { fileInput, attachBtn, pasteBar, pasteBadge, images, files, renderPasteBar, clear }
}

/** 芯片文件名 HTML 转义（`& < > "` 四替换——零注入）。 */
function escapeHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

/** 单档内联块（纯函数）= 头行 `[Attached file: <名>]` + `\n` + fenced 段（`\n` + 内容 + `\n` + 围栏）。
 *  围栏 = 反引号 × `max(3, 内容最长反引号串 + 1)`（防内容提前闭合）；info string = 扩展名去点小写，无扩展名 ⇒ 略。 */
export function formatFileBlock({ name, text }) {
  const content = String(text ?? "")
  const info = fileExt(name).slice(1)
  let longest = 0
  for (const run of content.match(/`+/g) ?? []) if (run.length > longest) longest = run.length
  const fence = "`".repeat(Math.max(3, longest + 1))
  return `[Attached file: ${name}]\n${fence}${info}\n${content}\n${fence}`
}

/** 内联形成（纯函数）：`text` + `"\n\n"` + 逐档块（`"\n\n"` 分隔；空列 ⇒ 原文零改）。 */
export function withAttachedFiles(text, files) {
  if (!Array.isArray(files) || files.length === 0) return text
  return text + "\n\n" + files.map(formatFileBlock).join("\n\n")
}
