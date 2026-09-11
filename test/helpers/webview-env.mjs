/**
 * webview-env.mjs — shared happy-dom test harness for webview modules.
 *
 * The webview (chat.js/settings.js/ui.js) is otherwise untestable: it reads
 * global document/window at call time. This registers happy-dom, injects the
 * English locale, and stubs the VS Code bridge so the modules run under node --test.
 *
 * state.js calls `acquireVsCodeApi()` at module top — the real webview gets it
 * from the VS Code API injection; under happy-dom it must be stubbed as a bare
 * global BEFORE importing any state.js-importing module (panels/loading/
 * status-bar/streaming...). Messages are captured into the returned array.
 */
import { GlobalRegistrator } from "@happy-dom/global-registrator"
import { readFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { setStrings } from "../../webview/i18n.js"

const __dirname = dirname(fileURLToPath(import.meta.url))

/** Register happy-dom globals + locale + vscode stub. Call once per test file. */
export function setupWebview() {
  GlobalRegistrator.register()

  const en = JSON.parse(readFileSync(join(__dirname, "../../locales/en.json"), "utf8"))
  setStrings(en)

  // Stub the VS Code webview bridge — tests capture messages via capturedPosts.
  // state.js exports the acquireVsCodeApi() result as its `vscode` handle, so the
  // stub must be the bare global the real webview receives from the extension API.
  const capturedPosts = []
  globalThis.acquireVsCodeApi = () => ({ postMessage: (msg) => capturedPosts.push(msg) })
  window._vscode = { postMessage: (msg) => capturedPosts.push(msg) }

  return {
    capturedPosts,
    cleanup() {
      try { GlobalRegistrator.unregister() } catch { /* already unregistered — no-op */ }
    },
  }
}

/** Minimal DOM fixture matching index.html's settings-panel structure. */
export function installSettingsFixture() {
  document.body.innerHTML = `
    <button id="settings-btn"></button>
    <button id="settings-close"></button>
    <div id="settings-panel" style="display:none">
      <div class="panel-header"><button id="settings-close"></button></div>
      <div class="panel-body" id="settings-body"></div>
    </div>
  `
}

/**
 * Minimal DOM fixture for chat modules (state.js reads ~25 ids at import; the
 * busy-state renderers touch status-line/panels/buttons). Element ids mirror
 * webview/index.html. Call BEFORE importing webview/state.js consumers.
 */
export function installChatFixture() {
  const ids = [
    "messages", "subagent-activity", "input", "send-btn", "abort-btn", "model-btn", "reasoning-btn",
    "model-dropdown", "reasoning-dropdown", "session-selector", "session-title",
    "session-dropdown", "welcome-panel", "welcome-heading", "welcome-text",
    "welcome-provider-label", "welcome-provider", "welcome-key-label", "welcome-key",
    "welcome-save-btn", "welcome-skip-btn", "welcome-settings-btn", "project-btn",
    "status-line", "task-panel", "goal-panel",
  ]
  // 2026-09-11 活动区回归（WEBVIEW.md §12）：#subagent-activity 回归——子代理活动块出生
  // 即驻留区尾（区语义断言的宿主；位置序同 index.html：messages → 活动区 → panels）。
  document.body.innerHTML = ids.map((id) => `<div id="${id}"></div>`).join("")
}

/**
 * Full index.html id fixture — for driving the REAL `webview/chat.js` module graph
 * (its top-level init reads every element id; `installChatFixture` above is the
 * deliberately smaller reducer group). Also applies the index.html default inline
 * styles the input layer depends on (@-dropdown / paste-bar closed).
 */
export function installFullIndexFixture() {
  const ids = ("chat-container session-bar project-btn session-selector session-title session-arrow " +
    "session-dropdown new-session-btn messages panels goal-panel task-panel toolbar status-line at-dropdown " +
    "input-row file-input input attach-btn send-btn abort-btn paste-bar paste-badge controls-row model-btn " +
    "reasoning-btn auto-btn advisor-btn eng-btn plan-btn settings-btn model-dropdown reasoning-dropdown " +
    "settings-panel settings-close settings-body welcome-panel welcome-heading welcome-text " +
    "welcome-provider-label welcome-provider welcome-key-label welcome-key welcome-save-btn welcome-skip-btn " +
    "welcome-settings-btn").split(" ")
  document.body.innerHTML = ids.map((id) => `<div id="${id}"></div>`).join("")
  document.getElementById("at-dropdown").style.display = "none"
  document.getElementById("paste-bar").style.display = "none"
}
