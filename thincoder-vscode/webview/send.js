/**
 * send.js — the send path: input history bookkeeping, turn-start state, panel
 * reset, and the userMessage post.
 */
import { ctx, vscode, S } from "./state.js"
import { t } from "./i18n.js"
import { addUser } from "./ui.js"
import { setLoading } from "./loading.js"
import { clearPanels } from "./panels.js"
import { showToast } from "./toast.js"

export function send() {
  const text = ctx.inputEl.value.trim()
  // INPUT-LOCK-ASYNC（C'——2026-09-09）→ INPUT-LOCK-BEHAVIOR-REVISED（2026-09-09）：busy
  // （S._turnState==="running"——回合/digest/标题窗口——与 loading.js 同判据）send 出口
  // 守卫——拒发（文本保留不吞——忙完可重按）。busy 期输入框不禁（readOnly 锁已移除——
  // 打字回显）——Enter（input.js keydown）与发送按钮都经此拒。模态不受影响（AC-6）。
  if (!text) return
  // 无工作区守卫（2026-09-21 批 · `PROJECT-SWITCHER.md` §4.1）：出口守卫先于 busy 与
  // echo/addUser —— 拒发（文本保留不吞——开文件夹后可重按）+ toast 逐字；无假气泡、无悬挂
  // loading。占位符不在此直写（单点派生 = `loading.js` `applyBusyLock` 第三态）。
  if (S._workspaceRequired) {
    showToast(t("workspace.required"))
    return
  }
  if (S._turnState === "running") {
    ctx.inputEl.placeholder = t("input.busyPlaceholder")
    // C-B2-4（§9.2——AC-B2-3）：拒发可见提示——复用既有 toast 机制（文案 = 既有 busy 串，
    // 零新增 locale 键）；占位符设置保留（既有测试锁零伤）。
    showToast(t("input.busyPlaceholder"))
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
