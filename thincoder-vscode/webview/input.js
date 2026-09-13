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
      // C-B2-1：组合期 Enter 归输入法——不 preventDefault、不注入
      if (e.isComposing) return
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
  if (e.key === "Enter" && !e.shiftKey) {
    // C-B2-1：组合期 Enter 归输入法——不 preventDefault、不发送
    if (e.isComposing) return
    e.preventDefault()
    // C-B2-2：@ 下拉打开时让位——Enter 只由 autocomplete 接受建议。让位 = 提前 return 且
    // 保留 preventDefault（防 Enter 默认换行落入输入框；autocomplete 侧仅 active 项存在
    // 时防默认，让位侧自带防默认兜住间隙）。**次序前提**：本监听先于 autocomplete 注册
    // （chat.js `import "./input.js"` 早于 `initAutocomplete()` 调用）——次序反转 = 协调失效。
    if (isAtDropdownOpen()) return
    send()
  }
  // Input history / 多行竖移（A10 群 A 批——判定顺序 C-MA10-1）：
  // ① IME 组合期（isComposing / keyCode 229）→ 不处理不防默认（键归输入法）；
  // ② @ 下拉打开 → 不处理（下拉导航让位）；
  // ③ 历史态（_historyIdx !== -1）→ 恒历史（连续上溯与回落恒可用——与光标/单复数行无关）；
  // ④ 非历史态·单行 → 任意位置触发（↑ 载入最新条目 + 草稿 stash；↓ 吞键 + no-op）；
  // ⑤ 非历史态·多行 → 边界门（首行行首 ↑ / 末行行末 ↓ 触发），其余位置不劫持（原生竖移保留）。
  else if ((e.key === "ArrowUp" || e.key === "ArrowDown") && !e.shiftKey && !e.altKey && !e.metaKey && !e.ctrlKey) {
    if (e.isComposing || e.keyCode === 229) return // ①
    if (isAtDropdownOpen()) return // ②
    const dir = e.key === "ArrowUp" ? -1 : 1
    const el = ctx.inputEl
    if (ctx._historyIdx !== -1) { // ③ 历史态恒历史
      e.preventDefault()
      navigateInputHistory(dir)
    } else if (!el.value.includes("\n")) { // ④ 单行任意位置
      e.preventDefault()
      if (dir < 0) navigateInputHistory(-1) // ↓ = 吞键 + no-op（非历史态无可回落）
    } else { // ⑤ 多行边界门
      const atBoundary = dir < 0 ? el.selectionStart === 0 : el.selectionStart === el.value.length
      if (atBoundary) {
        e.preventDefault()
        navigateInputHistory(dir)
      }
    }
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
  const el = document.getElementById("at-dropdown")
  return !!el && el.style.display !== "none" // C-B2-3：元素缺失 ≠ 打开（原 `undefined !== "none"` 恒真）
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
