/**
 * send.js — the send path: input history bookkeeping, turn-start state, panel
 * reset, and the userMessage post.
 */
import { ctx, vscode, S } from "./state.js"
import { t } from "./i18n.js"
import { addUser } from "./ui.js"
import { setLoading } from "./loading.js"
import { clearPanels } from "./panels.js"

export function send() {
  const text = ctx.inputEl.value.trim()
  // INPUT-LOCK-ASYNC（C'——2026-09-09）：busy（S._turnState==="running"——回合/digest/
  // 标题窗口——与 loading.js 锁同判据）send 出口守卫——拒发（文本保留不吞——readOnly
  // 输入框内容原样——忙完可重按）。webview 输入框 busy 期只读（Enter 不可达）——本守卫
  // 兜 send 按钮点击/竞态窗口（输入框解锁瞬间的陈旧按键）。模态（question/permission——
  // 独立控件）不受影响（AC-6）。
  if (!text) return
  if (S._turnState === "running") {
    ctx.inputEl.placeholder = t("input.busyPlaceholder")
    return
  }
  const h = ctx._inputHistory
  if (h[h.length - 1] !== text) h.push(text) // dedupe consecutive repeats
  ctx._historyIdx = -1
  ctx._inputDraft = ""
  S._turnStart = Date.now()
  S._llmCalls = 0
  const w = ctx.messagesEl.querySelector(".welcome")
  if (w) w.remove()
  ctx.inputEl.value = ""
  ctx.inputEl.style.height = "auto"
  setLoading(ctx, true)
  ctx.hadToolResult = false
  // §17: panel reset happens per NORMAL turn only — a send during the suspension
  // session belongs to the running session (its subagent rows/blocks stay live).
  if (!S._suspended) clearPanels()
  addUser(ctx, text, Date.now()) // F（SESSION-RESTORE-PARITY）：本地气泡补真实时间戳——无 ts 不显示的配套
  // Snapshot + clear IN PLACE (GitHub thincoder#3): autocomplete.js holds this array
  // BY REFERENCE (chat.js passes ctx._pastedImages into initAutocomplete). Reassigning
  // ctx._pastedImages = [] orphanized the shared array — the paste bar kept rendering
  // the old one, send() read the new empty one, so only the first paste+send ever
  // carried images. length=0 preserves the identity; chips and ✕-delete keep working.
  const images = [...ctx._pastedImages]
  ctx._pastedImages.length = 0
  document.getElementById("paste-bar").style.display = "none"
  document.getElementById("paste-badge").innerHTML = ""
  vscode.postMessage({ type: "userMessage", text, model: ctx.selectedModel, reasoning: ctx.selectedReasoning, provider: ctx.selectedProvider, images })
  // If session title is auto-generated (Session N), show a hint that a better title is coming
  if (/^Session \d+$/.test(ctx.sessionTitle.textContent)) {
    ctx.sessionTitle.textContent = ctx.sessionTitle.textContent + " — " + t("session.generatingTitle")
  }
}
