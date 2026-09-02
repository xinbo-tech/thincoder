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
  // §17 F7: during a suspension session the input NEVER locks — Enter while a digest
  // runs does not break it (F3: the background never touches the input box); the host
  // queues the message and auto-continues after the digest. isRunning is only a gate
  // in the normal (non-suspended) mode.
  if (!text || (ctx.isRunning && !S._suspended)) return
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
  addUser(ctx, text)
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
