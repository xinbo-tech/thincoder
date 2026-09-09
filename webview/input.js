/**
 * input.js — input box behavior: interrupt mode (Ctrl+I inject, CLI parity),
 * key handling (send / history navigation / CLI-ish Ctrl chords), and
 * auto-height with IME-composition awareness.
 * Imported for its side effects (registers the inputEl listeners).
 */
import { ctx, vscode } from "./state.js"
import { t } from "./i18n.js"
import { send } from "./send.js"
import { applyBusyLock } from "./loading.js"

// ─── Interrupt mode (Ctrl+I inject, CLI parity) ──
// Interrupt mode: the input box switches to "inject a message" — Enter aborts
// the turn and injects it, Esc cancels.
// INPUT-LOCK-ASYNC（C'）+ INPUT-LOCK-BEHAVIOR-REVISED（2026-09-09）：中断模态 = 注入通道
// （红线——Ctrl+I 门禁前不误伤）——readOnly 锁已移除（busy 不禁录入）——ctx._interruptMode
// 让 applyBusyLock 让出占位符（归本模态管理）；退出（Enter/Esc）applyBusyLock 重派生回
// busy/默认占位符。
let _interruptMode = false

function enterInterruptMode() {
  _interruptMode = true
  ctx._interruptMode = true
  ctx.inputEl.placeholder = t("input.interruptPlaceholder")
  ctx.inputEl.classList.add("interrupt-mode")
  ctx.inputEl.focus()
}
function exitInterruptMode() {
  _interruptMode = false
  ctx._interruptMode = false
  ctx.inputEl.classList.remove("interrupt-mode")
  ctx.inputEl.value = ""
  ctx.inputEl.style.height = "auto"
  applyBusyLock() // 重派生占位符：busy → busy 文案；空闲 → 默认
}

ctx.inputEl.addEventListener("keydown", (e) => {
  // Interrupt mode swallows keys: Enter injects the message, Esc cancels.
  if (_interruptMode) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      const msg = ctx.inputEl.value.trim()
      exitInterruptMode()
      if (msg) vscode.postMessage({ type: "interrupt", message: msg })
    } else if (e.key === "Escape") {
      exitInterruptMode()
    }
    return
  }
  // Ctrl+C with NO selection while running → Stop (CLI parity). A selection
  // still copies (default browser behavior).
  if (e.key === "c" && e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey) {
    const hasSelection = ctx.inputEl.selectionStart !== ctx.inputEl.selectionEnd
    if (!hasSelection && ctx.isRunning) {
      e.preventDefault()
      vscode.postMessage({ type: "abort" })
    }
    return
  }
  // Ctrl+I while running → interrupt + inject (CLI parity)
  if (e.key === "i" && e.ctrlKey && !e.altKey && !e.metaKey && ctx.isRunning) {
    e.preventDefault()
    enterInterruptMode()
    return
  }
  // Ctrl+U clears the input line (CLI parity)
  if (e.key === "u" && e.ctrlKey && !e.altKey && !e.metaKey) {
    e.preventDefault()
    ctx.inputEl.value = ""
    ctx.inputEl.style.height = "auto"
    return
  }
  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send() }
  // Input history navigation (CLI parity): ↑ on the first line recalls previous
  // inputs; ↓ walks back down; the in-progress draft is stashed and restored.
  else if (e.key === "ArrowUp" && !e.shiftKey && !e.altKey && !e.metaKey && !e.ctrlKey &&
           ctx.inputEl.selectionStart === 0 && !isAtDropdownOpen()) {
    e.preventDefault()
    navigateInputHistory(-1)
  } else if (e.key === "ArrowDown" && !e.shiftKey && !e.altKey && !e.metaKey && !e.ctrlKey &&
           ctx.inputEl.selectionStart === ctx.inputEl.value.length && !isAtDropdownOpen()) {
    e.preventDefault()
    navigateInputHistory(1)
  }
})
// 高度自适应：rAF 节流 + IME 组合期间跳过 + 缓存高度（不变则跳过），避免每次击键 write→read 强制全文档 reflow
let _composing = false
let _heightRaf = 0
let _lastInputHeight = 0
function adjustInputHeight() {
  if (_heightRaf) return
  _heightRaf = requestAnimationFrame(() => {
    _heightRaf = 0
    const target = Math.min(ctx.inputEl.scrollHeight, 150)
    if (target === _lastInputHeight) return // 高度未变，跳过本次，避免每键都写 height
    _lastInputHeight = target
    ctx.inputEl.style.height = "auto"
    ctx.inputEl.style.height = target + "px"
  })
}
ctx.inputEl.addEventListener("compositionstart", () => { _composing = true })
ctx.inputEl.addEventListener("compositionend", () => { _composing = false; adjustInputHeight() })
ctx.inputEl.addEventListener("input", () => {
  if (_composing) return
  adjustInputHeight()
})

/** Whether the @-autocomplete dropdown is open (input-history keys must not fight it). */
function isAtDropdownOpen() {
  return document.getElementById("at-dropdown")?.style.display !== "none"
}

/** ↑/↓ input history with draft protection (CLI parity). */
function navigateInputHistory(dir) {
  const h = ctx._inputHistory
  if (h.length === 0) return
  if (dir < 0) {
    // ↑ — draft → newest entry, then walk older (CLI key-handler parity).
    if (ctx._historyIdx === -1) ctx._inputDraft = ctx.inputEl.value
    ctx._historyIdx = ctx._historyIdx === -1 ? h.length - 1 : Math.max(0, ctx._historyIdx - 1)
  } else {
    // ↓ — walk newer; past the newest returns to the stashed draft.
    if (ctx._historyIdx === -1) return
    ctx._historyIdx++
    if (ctx._historyIdx >= h.length) ctx._historyIdx = -1
  }
  ctx.inputEl.value = ctx._historyIdx === -1 ? ctx._inputDraft : h[ctx._historyIdx]
  const len = ctx.inputEl.value.length
  ctx.inputEl.setSelectionRange(len, len)
  ctx.inputEl.style.height = "auto"
  ctx.inputEl.style.height = Math.min(ctx.inputEl.scrollHeight, 150) + "px"
}
