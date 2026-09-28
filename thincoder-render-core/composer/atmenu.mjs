/**
 * atmenu.mjs — @ 补全下拉工厂（核化 VSC `webview/autocomplete.js:10-121` 的 @ 面——上提批
 * `2026-09-28-desktop-input-vsc-align.md` §2.3 ∕ §2.4 P5；拆面 = @ 归本档、采集∕栅格门∕芯片条归 `attach.mjs`）。
 *
 * 面（逐字搬移，模块级状态 → 工厂体）：
 *  - `#at-dropdown` 结构（照 VSC `index.html:42` 静态形：`class="dropdown"` ∕ `role="listbox"` ∕ 默认隐）；
 *  - 句柄（`:19-35`）：`@` 定位（`lastIndexOf("@")` + 空白门）· `_atBase` 记位 · 150ms 防抖 ·
 *    自增 `seq` 请求（`:29-34` C1 注：host 只回显最新——迟到返回不覆盖新下拉）；
 *  - 建议渲染（`:37-48`）：两列（`.at-file-name` ∕ `.at-file-path`），`escHtml` = 核 `../md.mjs` `esc`（先例 `diff.mjs:6`）；
 *  - 键盘导航（`:75-108`）：Esc 关 ∕ ↑↓ 高亮环转 + `scrollIntoView` ∕ Enter·Tab 接受（组合期归输入法）；
 *  - 接受插入（`:58-66`）：`_atBase + "@" + path + " "` + 光标定于 `path` 后一位。
 *
 * 注册序不变量（VSC `input.js:79-83` 序注）：本档 `inputEl` 监听器**须晚于** `panel.mjs` 键位监听器注册——
 * Enter 让位 = panel 侧 `isOpen()` 判定（本档接受面只在 active 项在场时 `preventDefault`，让位侧自带防默认兜住间隙）。
 *
 * 注入面（五项之局部）：② `post`（`atComplete` 出站——`:33`）。推送入口：`atResults`（经 ③ `state.subscribe`
 * → 调用方转 `showAtDropdown`）。取词：无（本档零文案）。
 */
import { esc as escHtml } from "../md.mjs"

/**
 * @ 面工厂。`inputEl` = 输入框元素（键位 ∕ 输入监听宿主）；`post(type, payload)` = 出站归一
 * （`atComplete` 载荷 = `{ query, cwd: "", seq }`——VSC `autocomplete.js:33` 逐字，`cwd: ""` 保留）。
 * 返回：`{ el, showAtDropdown, closeAtDropdown, isOpen, handleAtInput }`——`el` 由调用方装配（VSC 序：`#at-dropdown` 在 `#input-row` 之前）。
 */
export function createAtMenu({ post, inputEl } = {}) {
  const dropdown = document.createElement("div")
  dropdown.id = "at-dropdown"
  dropdown.className = "dropdown"
  dropdown.setAttribute("role", "listbox")
  dropdown.setAttribute("aria-label", "File suggestions")
  dropdown.style.display = "none"

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
      post("atComplete", { query, cwd: "", seq: _atSeq })
    }, 150)
  }

  function showAtDropdown(matches) {
    if (matches.length === 0) { closeAtDropdown(); return }
    dropdown.innerHTML = matches.map((m, i) =>
      `<div class="dropdown-item${i === 0 ? " active" : ""}" data-path="${escHtml(m.path)}" tabindex="0" role="option" aria-selected="${i === 0}">
        <span class="at-file-name">${escHtml(m.name)}</span>
        <span class="at-file-path">${escHtml(m.path)}</span>
      </div>`
    ).join("")
    dropdown.style.display = "block"
    dropdown.setAttribute("aria-expanded", "true")
    _atActive = true
  }

  function closeAtDropdown() {
    dropdown.style.display = "none"
    dropdown.setAttribute("aria-expanded", "false")
    _atActive = false
    dropdown.innerHTML = ""
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

  /** 下拉是否打开（panel 键位让位判据——VSC `input.js:135-138` 同式；C-B2-3 的缺元素支随工厂化退场：元素恒在）。 */
  function isOpen() {
    return dropdown.style.display !== "none"
  }

  // ── bind events（注册序：晚于 panel 键位面——见头注）──

  inputEl.addEventListener("input", () => {
    if (!_atActive) return
    handleAtInput()
  })

  inputEl.addEventListener("keydown", (e) => {
    if (!_atActive) return
    if (e.key === "Escape") { closeAtDropdown(); e.preventDefault(); return }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault()
      const items = dropdown.querySelectorAll(".dropdown-item")
      if (items.length === 0) return
      const cur = dropdown.querySelector(".dropdown-item.active")
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
      // C-B2-1：组合期 Enter 归输入法（不接受建议、不 preventDefault——键归输入法）
      if (e.key === "Enter" && e.isComposing) return
      const active = dropdown.querySelector(".dropdown-item.active")
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

  return { el: dropdown, showAtDropdown, closeAtDropdown, isOpen, handleAtInput }
}
