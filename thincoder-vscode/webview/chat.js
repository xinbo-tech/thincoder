/**
 * chat.js — main orchestration: init wiring, global key handlers, the host
 * message loop, and the startup handshake. Feature behavior lives in the
 * imported modules (state.js owns the shared ctx/S state).
 */
import { ctx, vscode, S } from "./state.js"
import {
  showWelcome, updateWelcomeStatus, showBanner, addUser,
  addTool, finishTool, showError, maybeScrollDown, escHtml, advisorRoundTag,
} from "./ui.js"
import { setLoading } from "./loading.js"
import { MAX_TOOL_OUTPUT } from "./lib.js"
import { setStrings, t } from "./i18n.js"
import { initAutocomplete } from "./autocomplete.js"
import { initSettings } from "./settings.js"
import { closeModelMenu } from "./model-menu.js"
import { applyI18nToDOM } from "./i18n-dom.js"
import { send } from "./send.js"
import { onToken, onReasoning, onTurnBreak, finish, attachCopyButtons, subagentChunk } from "./streaming.js"
import { resetActivity, applySubagentApproval } from "./activity.js"
import { renderStatusBar, handleUsageMessage } from "./status-bar.js"
import { handleTaskProgress, handleSubagentMessage, handleGoalMessage, handleSuspensionMessage, handleTurnStateMessage } from "./panels.js"
import { updateSessionTitle, handleProjectMessage } from "./session-bar.js"
import { initOnboarding, showWelcomePanel, maybeShowWelcome } from "./onboarding.js"
import { handleAutoApprove, handleAgentSettings, handlePlanMode } from "./mode-buttons.js"
import { handleModelsMessage } from "./model-picker.js"
import { showQuestion } from "./question.js"
import { showPermissionRequest, showBatchPermissionRequest } from "./permission.js"
import { addLedgerNotice } from "./ledger-line.js" // LEDGER-SURFACE（§2.30.3.5）：台账行渲染
// Side-effect imports: these register their DOM listeners on evaluation.
// Order preserves the original chat.js top-to-bottom registration order for
// listeners on the same target (scroll.js's initScrollFollow before history.js's
// messagesEl scroll listener).
import "./search.js"
import "./input.js"
import "./scroll.js"
import { applyHistoryPage } from "./history.js"

// ─── Init ──────────────────────────────────────

// 启动加载画面（2026-09-21 用户）：index.html 静态 #loading-screen 首屏即见（骨架裸露 + welcome
// 表单早弹的替代）。移除时机 = 握手落定：providerStatus（provider 态已知 ✗ banner/welcome 语义就绪）
// 是握手四件（turnState/i18n/agentSettings/providerStatus）最后一环，其后接快段 openSessionContent
// ——收到即可安全展示真 UI。兜底 = 3s 超时强移（宿主未响应也不永锁）。
function dismissLoadingScreen() {
  const el = document.getElementById("loading-screen")
  if (!el) return
  el.classList.add("dismiss")
  setTimeout(() => el.remove(), 200) // 淡出后移除（CSS transition 150ms + 余量）
}
let _loadingDismissed = false
function dismissLoadingScreenOnce() {
  if (_loadingDismissed) return
  _loadingDismissed = true
  dismissLoadingScreen()
}
const _loadingTimeout = setTimeout(dismissLoadingScreenOnce, 3000) // 兜底：握手异常不永锁首屏

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

// §19.5 D-M7 UI 停止（VS Code）：子代理块 ⏹ 点击 → postMessage cancelSubagent →
// extension 层定向 abort——不经模型回合（失控子代理时模型可能不可靠——直连路径）。
// preventDefault + stopPropagation：⏹ 命中区不触发 details 折叠翻转（T-M22 断言——
// 与 CLI handleMouseClick 的 ⏹ 列级区分同规则）。2026-09-11 活动区回归（WEBVIEW.md
// §12.3 第 8 条）：块驻留活动区（running + queued 头挂 ⏹——冻结块 ⏹ 已随 freeze 移除）
// ——**单委托点迁区**（空安全绑定：fixture 缺区 id 零抛错——生产行为不变）。
const onStopClick = (e) => {
  const btn = e.target.closest(".sub-stop-btn")
  if (!btn) return
  e.preventDefault()
  e.stopPropagation()
  vscode.postMessage({ type: "cancelSubagent", id: Number(btn.dataset.subId), role: btn.dataset.subRole })
}
ctx.activityEl?.addEventListener("click", onStopClick)

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
    case "token":            clearStatusText(); onToken(m.text); break
    case "reasoning":        clearStatusText(); onReasoning(m.text); break
    case "turnBreak":        onTurnBreak(); break
    // X2（显示面消差批 §2.1）：advisor 卡头携轮次标签 + 状态行字面 = CLI `tool-events.mjs:145`
    // 逐字（`advisor review (round N · model)`）；无 round 字段（非 advisor / 旧载荷）⇒ 逐字节同修前。
    // 注：`round` 仅 advisor 载荷携（宿主 `advisorMeta`）⇒ 以标签非空分派，**不写工具名字面比较**
    // （该形会被 `protocol-coverage` 提取器当消息判别式——§12 表机检）。
    case "toolCall": {
      clearStatusText()
      const roundTag = advisorRoundTag(m.round, m.model)
      S._currentTool = roundTag ? `advisor review ${roundTag}` : m.name
      addTool(ctx, m.name, m.args, m.id, roundTag)
      renderStatusBar()
      break
    }
    // X5（显示面消差批 §2.2）：`truncated` 事实旗标透传（正文/摘要标记见 ui.js finishToolCard）
    case "toolResult":       clearStatusText(); finishTool(ctx, m.name, m.id, m.text, m.links, m.truncated); S._currentTool = null; renderStatusBar(); break
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
    // C2 (SESSION-FLOW-C F-C2c——修 H-E): loading case 不再 innerHTML 覆写 #status-line——
    // setLoading 置 S._phase（thinking 标记）→ renderStatusBar（唯一 writer）同线绘制徽标/
    // 计数/thinking；Stop 可见性 = S._turnState==="running" 派生（F-6——susp 纯池跑不显——
    // 无全停——子代理停止靠流内逐块 ⏹——CLI 对拍）。
    case "loading":          setLoading(ctx, m.loading); break
    // C2 (F-C2b): host 忙态单一广播（{type:"turnState", state, counts?}）→ 单一 reducer
    case "turnState":        handleTurnStateMessage(m); break
    case "complete":         clearStatusText(); finish(); break
    case "aborted":          clearStatusText(); finish(true); break
    case "error":
      clearStatusText()
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
      S._digestBoundary = null; S._statusText = null; S._turnFrame = null; resetActivity()
      ctx._hasOlder = false
      ctx._nextIdx = 0
      S._loadingOlder = false
      renderStatusBar()
      showWelcome(ctx)
      break
    case "historyPage":
      applyHistoryPage(ctx, m)
      break
    // LEDGER-SURFACE（§2.30.3.5）：台账明细 / 变化行（宿主 ledgerNotice——启动行 | 变化行）
    case "ledgerNotice":      addLedgerNotice(ctx, m.lines); break
    case "sessions":
      ctx._sessions = m.sessions || []
      ctx.activeSession = m.active || 0
      updateSessionTitle()
      break
    case "project":          handleProjectMessage(m); break
    case "models":           handleModelsMessage(m); break
    case "providerStatus":
      S._lastProviderStatus = m.status || {}
      updateProviderStatus(S._lastProviderStatus)
      ctx._keyOk = m.keyOk === true
      showBanner(ctx, ctx._keyOk ? t("banner.configured") : t("banner.notConfigured"), ctx._keyOk)
      clearTimeout(_loadingTimeout); dismissLoadingScreenOnce() // 启动加载画面移除（握手四件最后一环到达——2026-09-21）
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
    case "digest":
      showDigestStatus(m)
      break
    case "statusText":       handleStatusText(m); break
    case "turnFrame":        S._turnFrame = { turn: m.turn, maxTurns: m.maxTurns }; renderStatusBar(); break
    case "permissionRequest":
      showPermissionRequest(m)
      break
    // §18 C-6（child permission gate）· F-W13（批卡并入同族）：host 释放（opts.signal /
    // Stop / approve-all 连带 / 孤儿响应回写）→ 移除对应卡。promptId 精确匹配；无 promptId
    // （旧 host）→ 移除全部带 id 的卡（中止即整轮作废——无悬挂卡）。
    // 合并卡自 2026-09-18 批起同携 data-prompt-id ⇒ 与逐项卡零分支共用本选择器。
    case "permissionWithdrawn": {
      const cards = [...document.querySelectorAll(".permission-prompt[data-prompt-id]")]
      for (const c of cards) {
        if (m.promptId == null || String(c.dataset.promptId) === String(m.promptId)) c.remove()
      }
      break
    }
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
    // §18 C-8（child permission gate）：审批态块头通知（tool 非空 = `⏸` + 等待审批；
    // null = 清态）——查块绝不建块（activity.js applySubagentApproval）
    case "subagentApproval":  applySubagentApproval(m); break
    case "goal":             handleGoalMessage(m); break
    case "suspension":       S._digestBoundary = null; handleSuspensionMessage(m); break
    case "toolPanel":
      // Subagent/consultant content streams into an activity-region block
      // (§13/§14 — activity.js ensureBlock). Advisor has no webview consumer
      // (VSC-DEBT D-2: no host emitter — the advisor family merged into the
      // subagent container; src/agent.mjs:79).
      if (m.name?.startsWith("sub:")) subagentChunk(m)
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


// ─── Status-line text segment (WEBVIEW §14 C-12#1 / C-15) ──────
// host 发结构化 statusText（kind 判别——限流/过载/配额/索引）；webview 按 locale 渲染
// （M3——locale 单源；文案在 status-bar.js）。**活动恢复即清**（token/reasoning/toolCall/
// toolResult/complete/aborted/error——C-15——无 TTL）。
function clearStatusText() {
  if (S._statusText == null) return
  S._statusText = null
  renderStatusBar()
}
/** index 进度 done 相位 = 状态段清除（索引进度结束）；其余原样存（渲染时按 kind 取文案）。 */
function handleStatusText(m) {
  S._statusText = m.kind === "index" && m.phase === "done" ? null : m
  renderStatusBar()
}


// ─── Digest round visibility (B6 — WEBVIEW.md §7.4 + §14 C-9/C-10) ─────
// 消化轮可见面（**每轮独立元素**——跨轮漂移消除）：`digest start` → 追加 `.digest-turn` 标签
// 行（CLI 起跑 dim 行对位）+ 本轮独立 `.digest-status` 元素（`id="digest-status"` 退役）+ 记
// 本轮边界 `S._digestBoundary`（归档落点——C-4）+ `assistantLabeled` 复位（本轮 assistant
// 输出带一次回合标签——C-9③）；`digest end` → **本轮**元素原地更新（ok 旗标语义不变）；
// `digest cap` → `.digest-cap` 行（auto dim / stop warn——CLI agent-turn.mjs:188/:192 对位）。
let _digestRoundEl = null
function showDigestStatus(m) {
  const messagesEl = ctx.messagesEl
  if (m.status === "start") {
    const label = document.createElement("div")
    label.className = "digest-turn"
    // M4（显示面消差批 §2.1）+ F-UC8（2026-09-21 信号提示行批 · §6.27.12.13 ①–②）：起跑标签 **两档**
    // （`tier === "ask"` 携参 `{ from, msg }` / 其余含缺省档 ⇒ 既有键——后向兼容）；字面单源 = 核
    // i18n 容器（本地档不重复定义）。AUTO 档同判（`auto` 泛句退场——无生产者）。
    label.textContent = t(m.tier === "ask" ? "digest.turnLabelAsk" : "digest.turnLabel",
      m.tier === "ask" ? { from: m.from ?? "?", msg: m.msg ?? "…" } : {})
    messagesEl.appendChild(label)
    _digestRoundEl = null
    // 计数元素规则 = `n > 0`（D-SL2——两档同规；`n = 0` 的 ask-only 轮零元素：幻影行禁出）
    if ((m.n ?? 0) > 0) {
      const el = document.createElement("div")
      el.className = "digest-status"
      el.dataset.n = String(m.n)
      el.textContent = t("digest.start", { n: el.dataset.n })
      messagesEl.appendChild(el)
      _digestRoundEl = el
    }
    // 零计数元素轮（`n = 0`——起跑即发）：只打标签行；本轮 `_digestRoundEl` 置空 ⇒ end 零动作
    // （禁兜底建元素——不得造 `dataset.n = "?"` 幻影行）。
    S._digestBoundary = label // C-4：本轮边界 = 本轮首元素（标签行）
    ctx.assistantLabeled = false // C-9③：本轮 assistant 输出带一次回合标签
    maybeScrollDown(ctx)
    return
  }
  if (m.status === "cap") {
    const cap = document.createElement("div")
    cap.className = m.mode === "stop" ? "digest-cap digest-cap-stop" : "digest-cap"
    cap.textContent = m.mode === "stop"
      ? t("digest.capStop", { turns: m.turns ?? "?" })
      : t("digest.capAuto")
    messagesEl.appendChild(cap)
    maybeScrollDown(ctx)
    return
  }
  // end：本轮元素原地更新（start 连发亦各成独立元素——end 更新其前最近未结本轮元素）；
  // 本轮无计数元素（`n = 0` 轮——`_digestRoundEl` 置空）⇒ **零动作**（M4：禁兜底建元素——
  // 旧兜底行会造 `dataset.n = "?"` 幻影计数行）。
  const el = _digestRoundEl?.isConnected ? _digestRoundEl : null
  if (!el) return
  el.classList.remove("digest-done", "digest-failed")
  const seconds = ((m.ms ?? 0) / 1000).toFixed(1)
  if (m.ok !== false) {
    el.textContent = t("digest.done", { n: el.dataset.n ?? "?", seconds })
    el.classList.add("digest-done")
  } else {
    el.textContent = t("digest.aborted", { seconds })
    el.classList.add("digest-failed")
  }
  maybeScrollDown(ctx)
}


// ─── Startup handshake: the extension sets webview.html then immediately
// postMessages i18n — but the webview loads ASYNCHRONOUSLY, so that message is
// DROPPED (restart/Reload Window made this race visible: labels showed "msg.user",
// send felt dead). Pull instead: once THIS script runs, the listener is ready,
// so ask the extension to push the initial state.
vscode.postMessage({ type: "webviewReady" })
