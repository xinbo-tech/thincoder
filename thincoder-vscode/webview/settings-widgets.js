/**
 * settings-widgets.js — shared settings-panel control builders (split out of settings.js):
 * key-edit rows, effort dropdowns, save feedback, input error marking.
 */
import { escHtml } from "./ui.js"
import { t } from "./i18n.js"
import { effortSelectView } from "./settings-state.js"

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
 *  non-thinking models (caller hides the control — `view === null` = 旧「空枚举返 null」语义）。
 *  同一规则源 = `effortSelectView`（首项「—」占位 + 预选 = 已存值 > 注册默认∈枚举 > 「—」）
 *  ——与初渲染径（`settings-agent.js` 内联 HTML 串）共判据。 */
export function buildEffortSelect({ model, current, onChange, className = "consult-effort" }) {
  const view = effortSelectView(model, current)
  if (!view) return null
  const sel = document.createElement("select")
  sel.className = className
  sel.innerHTML = view.levels.map((e) => `<option value="${escHtml(e)}" ${view.selected === e ? "selected" : ""}>${escHtml(e)}</option>`).join("")
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

/** Confirm popover for irreversible actions (F-W17 — `SETTINGS.md` §2.10)。复用既有
 *  `.auto-confirm` / `.auto-backdrop` 件（零新增 CSS）；挂 `document.body` ⇒ 键行重绘不打断
 *  在位态。`onConfirm` = **开框时捕获**的载荷闭包（不读确认时的 DOM）⇒ 确认期间的行重绘
 *  不改删除目标、不吞确认。 */
export function showConfirmPopover({ text, yesLabel, noLabel, onConfirm }) {
  closeConfirmPopover() // 单例：开框前清既有（全局同名——与 session-bar / mode-buttons 两处同规）
  const backdrop = document.createElement("div")
  backdrop.className = "auto-backdrop"
  backdrop.addEventListener("click", closeConfirmPopover)
  const popover = document.createElement("div")
  popover.className = "auto-confirm"
  popover.setAttribute("role", "alertdialog")
  popover.setAttribute("aria-label", yesLabel)
  popover.innerHTML = `<div class="auto-confirm-text">${escHtml(text)}</div>
    <div class="auto-confirm-actions">
      <button class="auto-confirm-yes" aria-label="${escHtml(yesLabel)}">${escHtml(yesLabel)}</button>
      <button class="auto-confirm-no" aria-label="${escHtml(noLabel)}">${escHtml(noLabel)}</button>
    </div>`
  popover.querySelector(".auto-confirm-yes").addEventListener("click", (e) => {
    if (e.detail > 1) return // 连点护栏：双击第二击（detail > 1）不得误确认
    closeConfirmPopover()
    onConfirm()
  })
  popover.querySelector(".auto-confirm-no").addEventListener("click", closeConfirmPopover)
  // 框内 Escape：拦截冒泡 ⇒ 不连带执行 chat.js 的「关设置面板」分支（面板保持打开）
  popover.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return
    e.stopPropagation()
    closeConfirmPopover()
  })
  document.body.append(backdrop, popover)
  setTimeout(() => popover.querySelector(".auto-confirm-no")?.focus(), 50) // 安全默认：焦点落「取消」
}

/** 弹框清除入口（弹框 DOM 触点收敛为 1）：开框前单例清理 · 框内三条取消 · `closeSettings()` 同清。 */
export function closeConfirmPopover() {
  document.querySelectorAll(".auto-confirm, .auto-backdrop").forEach((el) => el.remove())
}
