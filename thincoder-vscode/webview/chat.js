/**
 * chat.js — main orchestration: init wiring, global key handlers, and the startup
 * handshake. Feature behavior lives in the imported modules (state.js owns the
 * shared ctx/S state); the host message loop lives in chat-messages.js and the
 * status / digest display face in chat-status.js（2026-09-22 structure-debt #163）。
 */
import { ctx, vscode } from "./state.js"
import { showWelcome } from "./ui.js"
import { initSettings } from "./settings.js"
import { initOnboarding } from "./onboarding.js"
import { closeModelMenu } from "./model-menu.js"
// Side-effect imports: these register their DOM listeners on evaluation.
// Order preserves the original chat.js top-to-bottom registration order for
// listeners on the same target (scroll.js's initScrollFollow before history.js's
// messagesEl scroll listener).
import "./search.js"
import { composerHooks } from "./input.js" // 输入面板接线（deps 构造 + 核件工厂装配）——注册序不变量见该档头注
import "./scroll.js"
// 消息分发循环迁 chat-messages.js（structure-debt #163）：其静态链携 history.js（messagesEl
// scroll 监听器）——本 import 位置即原 history.js 行（注册顺序不变量）。
import { initMessageLoop } from "./chat-messages.js"

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

// 输入区三面（两钮绑定 ∕ @ 下拉 ∕ 附件采集）随核件内生（`composer/panel.mjs` ∕ `composer/atmenu.mjs`
// ∕ `composer/attach.mjs`）——本档只留装配与跨面注入，逻辑零副本。

// ─── Settings panel (init early so openSettings is available for toolbar binding) ──
const _settings = initSettings({ onClose: () => ctx.inputEl.focus(), getModels: () => ctx._models })
const { openSettings, closeSettings, renderMcpList, updateMcpTools, updateMcpTestResult, updateProviderStatus, updateIndexStatus, updateAgentSettings, notifyAgentSettingsRefreshed, updateWebsearchSettings, updateTestProviderResult, updateShellCandidates, updateProxySettings, updateProxyTestResult, showSettingsError } = _settings

// ⑤ hooks 回填（设置面板初始化之后——`chat.js` 装配点）：控件行第 7 钮出口 ∕ `agentSettings` 设置面板刷新。
composerHooks.openSettings = openSettings
composerHooks.onAgentSettings = updateAgentSettings

initOnboarding({ openSettings })

// ─── Toolbar buttons ───────────────────────────

// `#settings-btn` 绑定随核件（`composer/controls.mjs` 七钮之一——出口 = 上行 `composerHooks.openSettings` 注入）。

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

// AGENT-LOOP-SUBAGENT.md §6.7.2 D-M7 UI 停止（VS Code）：子代理块 ⏹ 点击 → postMessage cancelSubagent →
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

// Close all dropdowns on Escape（端侧旧全局处理：核件已自持 AUTO 确认 ∕ 推理下拉 ∕ 模型菜单三解散面
// ——本段为幂等保留（重复关闭零副作用）；保位理由见核件舱记录 D5。）
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
  // （推理下拉段 = 端侧幂等保留——核件自持同判据；见上行 Escape 段注）
  if (!ctx.reasoningDropdown.contains(e.target) && e.target !== ctx.reasoningBtn) ctx.reasoningDropdown.style.display = "none"
  if (!ctx.sessionDropdown.contains(e.target) && !ctx.sessionSelector.contains(e.target)) {
    ctx.sessionDropdown.style.display = "none"
    ctx.sessionSelector.setAttribute("aria-expanded", "false")
  }
})

// ─── Message handling ──────────────────────────

// 分发循环注册点保持原址（D-C1：非副作用 import——显式调用保 window.addEventListener("message")
// 的注册时刻）。deps = 闭包实需面：settings 解构 13 键 + dismissLoadingScreenOnce + _loadingTimeout；
// 状态面四函数由 chat-messages.js 直接 import chat-status.js（`atResults` 面同改静态 import）。
initMessageLoop({
  renderMcpList, updateMcpTools, updateMcpTestResult, updateIndexStatus, updateProviderStatus,
  updateAgentSettings, notifyAgentSettingsRefreshed, updateWebsearchSettings, updateTestProviderResult,
  updateShellCandidates, updateProxySettings, updateProxyTestResult, showSettingsError,
  dismissLoadingScreenOnce, _loadingTimeout,
})

// ─── Startup handshake: the extension sets webview.html then immediately
// postMessages i18n — but the webview loads ASYNCHRONOUSLY, so that message is
// DROPPED (restart/Reload Window made this race visible: labels showed "msg.user",
// send felt dead). Pull instead: once THIS script runs, the listener is ready,
// so ask the extension to push the initial state.
vscode.postMessage({ type: "webviewReady" })
