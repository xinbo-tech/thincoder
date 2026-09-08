/**
 * chat.js — main orchestration: init wiring, global key handlers, the host
 * message loop, and the startup handshake. Feature behavior lives in the
 * imported modules (state.js owns the shared ctx/S state).
 */
import { ctx, vscode, S } from "./state.js"
import {
  showWelcome, updateWelcomeStatus, showBanner, addUser, addAssistantHistory,
  addTool, addToolHistory, finishTool, showError, maybeScrollDown, escHtml,
} from "./ui.js"
import { setLoading } from "./loading.js"
import { MAX_TOOL_OUTPUT } from "./lib.js"
import { setStrings, t } from "./i18n.js"
import { initAutocomplete } from "./autocomplete.js"
import { initSettings } from "./settings.js"
import { closeModelMenu } from "./model-menu.js"
import { applyI18nToDOM } from "./i18n-dom.js"
import { send } from "./send.js"
import { onToken, onReasoning, onTurnBreak, finish, attachCopyButtons, advisorChunk, subagentChunk } from "./streaming.js"
import { resetActivity } from "./activity.js"
import { renderStatusBar, handleUsageMessage } from "./status-bar.js"
import { handleTaskProgress, handleSubagentMessage, handleGoalMessage, handleSuspensionMessage, handleTurnStateMessage } from "./panels.js"
import { updateSessionTitle, handleProjectMessage } from "./session-bar.js"
import { initOnboarding, showWelcomePanel, maybeShowWelcome } from "./onboarding.js"
import { handleAutoApprove, handleAgentSettings, handlePlanMode } from "./mode-buttons.js"
import { handleModelsMessage } from "./model-picker.js"
import { showQuestion } from "./question.js"
import { showPermissionRequest, showBatchPermissionRequest } from "./permission.js"
// Side-effect imports: these register their DOM listeners on evaluation.
// Order preserves the original chat.js top-to-bottom registration order for
// listeners on the same target (scroll.js's initScrollFollow before history.js's
// messagesEl scroll listener).
import "./search.js"
import "./input.js"
import "./scroll.js"
import { applyHistoryPage } from "./history.js"

// ─── Init ──────────────────────────────────────

showWelcome(ctx)

ctx.sendBtn.addEventListener("click", send)
ctx.abortBtn.addEventListener("click", () => vscode.postMessage({ type: "abort" }))

// ─── @-autocomplete & image paste ──────────────

const _ac = initAutocomplete({
  inputEl: ctx.inputEl,
  atDropdown: document.getElementById("at-dropdown"),
  vscode,
  pastedImages: ctx._pastedImages,
})
const { showAtDropdown } = _ac

// ─── Settings panel (init early so openSettings is available for toolbar binding) ──
const _settings = initSettings({ onClose: () => ctx.inputEl.focus(), getModels: () => ctx._models })
const { openSettings, closeSettings, renderMcpList, updateMcpTools, updateMcpTestResult, updateProviderStatus, updateIndexStatus, updateAgentSettings, notifyAgentSettingsRefreshed, updateWebsearchSettings, updateTestProviderResult, updateShellCandidates, updateProxySettings, updateProxyTestResult, showSettingsError } = _settings

initOnboarding({ openSettings })

// ─── Toolbar buttons ───────────────────────────

document.getElementById("settings-btn").addEventListener("click", openSettings)

// Clickable file paths in tool cards — click / Enter opens the file in the editor.
ctx.messagesEl.addEventListener("click", (e) => {
  const link = e.target.closest(".file-link")
  if (link) vscode.postMessage({ type: "openFile", path: link.dataset.path, line: link.dataset.line ? Number(link.dataset.line) : undefined })
})
ctx.messagesEl.addEventListener("keydown", (e) => {
  if (e.key !== "Enter" && e.key !== " ") return
  const link = e.target.closest(".file-link")
  if (link) { e.preventDefault(); link.click() }
})

// §19.5 D-M7 UI 停止（VS Code）：子代理块标题行 ⏹ 点击 → postMessage cancelSubagent →
// extension 层定向 abort——不经模型回合（失控子代理时模型可能不可靠——直连路径）。
// preventDefault + stopPropagation：⏹ 命中区不触发 details 折叠翻转（T-M22 断言——
// 与 CLI handleMouseClick 的 ⏹ 列级区分同规则）。B1（SESSION-FLOW-B F-B1b）：live 块
// 出生即在 #messages 流内——messagesEl 委托单一绑点（live 有 ⏹；冻结块无——仅保险）。
const onStopClick = (e) => {
  const btn = e.target.closest(".sub-stop-btn")
  if (!btn) return
  e.preventDefault()
  e.stopPropagation()
  vscode.postMessage({ type: "cancelSubagent", id: Number(btn.dataset.subId), role: btn.dataset.subRole })
}
ctx.messagesEl.addEventListener("click", onStopClick)

// Close all dropdowns on Escape
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeModelMenu()
    ctx.reasoningDropdown.style.display = "none"
    ctx.sessionDropdown.style.display = "none"
    if (ctx.sessionSelector) ctx.sessionSelector.setAttribute("aria-expanded", "false")
    if (document.getElementById("settings-panel").style.display !== "none") {
      closeSettings()
      ctx.inputEl.focus()
    }
    const autoConfirm = document.querySelector(".auto-confirm")
    if (autoConfirm) { autoConfirm.remove(); document.querySelector(".auto-backdrop")?.remove(); ctx.inputEl.focus() }
  }
})

// Enter/Space activates focused custom elements
document.addEventListener("keydown", (e) => {
  if (e.key !== "Enter" && e.key !== " ") return
  if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.tagName === "SELECT" || e.target.tagName === "BUTTON") return
  if (e.target.closest("#input")) return
  e.preventDefault()
  e.target.click()
})

document.addEventListener("click", (e) => {
  // model menu is overlay-managed (self-closing); no legacy dropdown containment needed
  if (!ctx.reasoningDropdown.contains(e.target) && e.target !== ctx.reasoningBtn) ctx.reasoningDropdown.style.display = "none"
  if (!ctx.sessionDropdown.contains(e.target) && !ctx.sessionSelector.contains(e.target)) {
    ctx.sessionDropdown.style.display = "none"
    ctx.sessionSelector.setAttribute("aria-expanded", "false")
  }
})

// ─── Message handling ──────────────────────────

window.addEventListener("message", (e) => {
  const m = e.data
  switch (m.type) {
    case "i18n":           setStrings(m.strings); applyI18nToDOM(); break
    case "userMessage":      addUser(ctx, m.text, m.timestamp, m.idx); break
    case "assistantMessage": addAssistantHistory(ctx, m.text, m.timestamp, m.idx);
      attachCopyButtons(ctx.messagesEl.lastElementChild);
      break
    case "token":            onToken(m.text); break
    case "reasoning":        onReasoning(m.text); break
    case "turnBreak":        onTurnBreak(); break
    case "toolCall":         S._currentTool = m.name; addTool(ctx, m.name, m.args, m.id); renderStatusBar(); break
    case "toolResult":       finishTool(ctx, m.name, m.id, m.text, m.links); S._currentTool = null; renderStatusBar(); break
    case "toolOutput": {
      // Live output streaming (bash etc.): chunks append to the running card's
      // body. Open while streaming so long commands are watchable; finishTool
      // collapses the card again on success.
      const ref = ctx._toolRefs[m.id || m.name]
      if (!ref) break
      if (ref.b.textContent === t("tool.initial")) ref.b.textContent = ""
      if (!ref._capped) {
        ref.b.textContent += m.text
        if (ref.b.textContent.length > MAX_TOOL_OUTPUT) {
          ref.b.textContent = ref.b.textContent.slice(0, MAX_TOOL_OUTPUT) + "…(输出过长已截断)"
          ref._capped = true
        }
      }
      ref.b.classList.add("open")
      ref.h.querySelector(".tool-call-icon")?.classList.add("open")
      ref.h.setAttribute("aria-expanded", "true")
      maybeScrollDown(ctx)
      break
    }
    case "toolHistory":      addToolHistory(ctx, m.name, m.text, m.idx); break
    // C2 (SESSION-FLOW-C F-C2c——修 H-E): loading case 不再 innerHTML 覆写 #status-line——
    // setLoading 置 S._phase（thinking 标记）→ renderStatusBar（唯一 writer）同线绘制徽标/
    // 计数/thinking；Stop 可见性 = S._turnState==="susp" 派生或 loading 驱动（F-C2d）。
    case "loading":          setLoading(ctx, m.loading); break
    // C2 (F-C2b): host 忙态单一广播（{type:"turnState", state, counts?}）→ 单一 reducer
    case "turnState":        handleTurnStateMessage(m); break
    case "complete":         finish(); break
    case "aborted":          finish(true); break
    case "error":
      showError(ctx, m.text, m.techInfo)
      // Send failed because no provider is configured/usable — re-open the
      // welcome configuration panel even if the user previously skipped it.
      if (m.needsSetup) {
        S._welcomeDismissed = false
        showWelcomePanel(S._lastProviderStatus)
      }
      finish()
      break
    case "clearMessages":
      ctx.messagesEl.replaceChildren()
      ctx.currentBubble = null; ctx.currentBlock = null; ctx.currentTools = []; ctx.currentRaw = ""; ctx.currentReasoning = null; ctx.currentReasoningRaw = ""
      S._advisorBlock = null; resetActivity()
      ctx._hasOlder = false
      ctx._nextIdx = 0
      S._loadingOlder = false
      renderStatusBar()
      showWelcome(ctx)
      break
    case "historyPage":
      applyHistoryPage(ctx, m)
      break
    case "sessions":
      ctx._sessions = m.sessions || []
      ctx.activeSession = m.active || 0
      updateSessionTitle()
      break
    case "project":          handleProjectMessage(m); break
    case "messageQueued": { // 2026-09-05：消息已排队（后台子代理执行中——不打断）
      const div = document.createElement("div")
      div.className = "msg-queued"
      div.textContent = t("msg.queued")
      ctx.messagesEl.appendChild(div)
      maybeScrollDown(ctx)
      break
    }
    case "models":           handleModelsMessage(m); break
    case "providerStatus":
      S._lastProviderStatus = m.status || {}
      updateProviderStatus(S._lastProviderStatus)
      ctx._keyOk = m.keyOk === true
      showBanner(ctx, ctx._keyOk ? t("banner.configured") : t("banner.notConfigured"), ctx._keyOk)
      maybeShowWelcome(S._lastProviderStatus, m.keyOk)
      updateWelcomeStatus(ctx) // keyOk 到达可能晚于 showWelcome（初始渲染）——刷新欢迎条文案态
      break
    case "providerError":
      showSettingsError(m.text)
      break
    case "autoApprove":      handleAutoApprove(m); break
    case "agentSettings":    handleAgentSettings(m, updateAgentSettings); notifyAgentSettingsRefreshed(); break
    case "websearchSettings":
      updateWebsearchSettings(m.settings || {})
      break
    case "testProviderResult":
      updateTestProviderResult(m)
      break
    case "shellCandidates":
      updateShellCandidates(m)
      break
    case "proxySettings":
      updateProxySettings(m.settings || {})
      break
    case "proxyTestResult":
      updateProxyTestResult(m.result || {})
      break
    case "question":
      showQuestion(ctx, m.question, m.options, m.promptId)
      break
    case "questionCancelled": {
      // C1（SESSION-FLOW-C F-C1d——修 H-D）：extension 侧中止未答 question（Stop/abort——
      // makeAskInPanel onAbort）——移除对应卡片（卡片带 promptId——answer null 已随
      // questionResponse 自行移除——这里管 extension 主动取消的卡）。promptId 精确匹配；
      // 无 promptId（旧 host）→ 移除全部 question 卡（中止即整轮作废——无悬挂卡）。
      const cards = [...document.querySelectorAll(".question-card")]
      for (const c of cards) {
        if (m.promptId == null || String(c.dataset.promptId) === String(m.promptId)) c.remove()
      }
      break
    }
    case "compress":
      showCompressStatus(m)
      break
    case "permissionRequest":
      showPermissionRequest(m)
      break
    case "batchPermissionRequest":
      showBatchPermissionRequest(m)
      break
    case "atResults":
      showAtDropdown(m.matches || [])
      break
    case "mcpStatus":
      window._mcpServers = m.servers || {}
      renderMcpList()
      break
    case "mcpTools": updateMcpTools(m); break
    case "mcpTestResult": updateMcpTestResult(m); break
    case "indexStatus":
      updateIndexStatus(m.status)
      break
    case "usage":            handleUsageMessage(m); break
    case "taskProgress":     handleTaskProgress(m); break
    case "planMode":         handlePlanMode(m); break
    case "subagent":         handleSubagentMessage(m); break
    case "goal":             handleGoalMessage(m); break
    case "suspension":       handleSuspensionMessage(m); break
    case "toolPanel":
      // Advisor streams into an in-conversation details block (like reasoning),
      // round-tagged and never truncated — NOT a side panel.
      if (m.name === "advisor") advisorChunk(m)
      else if (m.name?.startsWith("sub:")) subagentChunk(m)
      break
  }
})


// ─── Compression status line (CONTEXT-COMPACTION §7 D-C3) ─────
// Lifecycle-only visibility: "Compressing context…" → "Compressed: N tokens freed
// (Xs)" / "failed: <error>" / 3-failure degradation note. One element in the messages
// stream, updated in place (session view clears recreate it via replaceChildren).
function showCompressStatus(m) {
  let el = document.getElementById("compress-status")
  if (!el) {
    el = document.createElement("div")
    el.id = "compress-status"
    el.className = "compress-status"
    document.getElementById("messages").appendChild(el)
  }
  el.classList.remove("compress-done", "compress-failed")
  let text
  if (m.status === "start") {
    text = m.messages != null ? t("compress.start", { n: m.messages }) : t("compress.starting")
  } else if (m.status === "done") {
    text = t("compress.done", {
      tokens: m.tokensFreed != null ? String(m.tokensFreed) : "?",
      seconds: ((m.elapsedMs ?? 0) / 1000).toFixed(1),
    })
    el.classList.add("compress-done")
  } else if (m.status === "fallback") {
    text = t("compress.fallback", { n: m.tailMessages != null ? String(m.tailMessages) : "?" })
    el.classList.add("compress-failed")
  } else {
    text = t("compress.failed", { error: escHtml(m.error ?? "") })
    el.classList.add("compress-failed")
  }
  el.innerHTML = text
  maybeScrollDown(ctx)
}


// ─── Startup handshake: the extension sets webview.html then immediately
// postMessages i18n — but the webview loads ASYNCHRONOUSLY, so that message is
// DROPPED (restart/Reload Window made this race visible: labels showed "msg.user",
// send felt dead). Pull instead: once THIS script runs, the listener is ready,
// so ask the extension to push the initial state.
vscode.postMessage({ type: "webviewReady" })
