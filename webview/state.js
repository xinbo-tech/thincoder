/**
 * state.js — shared webview state.
 *
 * Owns the vscode API handle, the `ctx` DOM/context object, and `S` — the single
 * home for every mutable value that used to be a module-level `let _x` in
 * chat.js. All feature modules import these bindings, so they all see (and
 * mutate) the SAME objects at runtime.
 */

export const vscode = acquireVsCodeApi()
window._vscode = vscode

export const ctx = {
  vscode,
  messagesEl: document.getElementById("messages"),
  inputEl: document.getElementById("input"),
  sendBtn: document.getElementById("send-btn"),
  abortBtn: document.getElementById("abort-btn"),
  modelBtn: document.getElementById("model-btn"),
  reasoningBtn: document.getElementById("reasoning-btn"),
  dropdown: document.getElementById("model-dropdown"),
  reasoningDropdown: document.getElementById("reasoning-dropdown"),
  sessionSelector: document.getElementById("session-selector"),
  sessionTitle: document.getElementById("session-title"),
  sessionDropdown: document.getElementById("session-dropdown"),
  currentBubble: null, currentBlock: null, currentTools: [], currentRaw: "",
  currentReasoning: null, currentReasoningRaw: "",
  isRunning: false, hadToolResult: false,
  _toolRefs: {}, // tool id → ref, for O(1) finishTool lookup
  _models: [],
  _keyOk: null, // provider 配置态（providerStatus 消息置位——欢迎条文案两态：welcome.text/textConfigured）
  selectedModel: "", selectedProvider: "", selectedReasoning: "max",
  _sessions: [], activeSession: 0,
  _pastedImages: [],
  _inputHistory: [], // sent inputs (memory, per panel session — CLI parity)
  _historyIdx: -1,   // -1 = showing the live draft
  _inputDraft: "",   // stashed in-progress text while navigating history
  // Turn-level assistant label guard (CLI ensureAssistantLabel parity): one
  // "❯ ThinCoder:" per TURN, not per LLM-response segment. onToken/onReasoning
  // start a fresh block after each tool batch; without this every segment
  // painted its own label.
  assistantLabeled: false,
  // First-run onboarding panel
  welcomePanel: document.getElementById("welcome-panel"),
  welcomeHeading: document.getElementById("welcome-heading"),
  welcomeText: document.getElementById("welcome-text"),
  welcomeProviderLabel: document.getElementById("welcome-provider-label"),
  welcomeProvider: document.getElementById("welcome-provider"),
  welcomeKeyLabel: document.getElementById("welcome-key-label"),
  welcomeKey: document.getElementById("welcome-key"),
  welcomeSaveBtn: document.getElementById("welcome-save-btn"),
  welcomeSkipBtn: document.getElementById("welcome-skip-btn"),
  welcomeSettingsBtn: document.getElementById("welcome-settings-btn"),
  // Current-project button (multi-root switcher, session bar)
  projectBtn: document.getElementById("project-btn"),
  // 窗口化裁剪 + 懒加载：本地 live 消息 idx 计数 + 是否还有更早历史（live 消息宿主不回发 idx，本地自增）
  _nextIdx: 0,
  _hasOlder: false,
}

/**
 * Mutable cross-module state (formerly chat.js module-level `let _x` variables).
 * Every read/write goes through S.<name> so all modules share one copy.
 * State used by exactly ONE feature module stays module-local there instead.
 */
export const S = {
  _autoApprove: false,
  _taskStatus: null,
  _taskProgress: null,
  _lastUsage: null,
  _lastCtxPct: null,
  _planActive: false,
  _subagentMap: {},
  _goalInfo: null,
  // Current live-turn advisor block (in-conversation details element) — advisor
  // output streams here like reasoning instead of the side tool panel.
  _advisorBlock: null,
  // Subagent/consultant activity-stream blocks (reset per turn together with _advisorBlock).
  _subBlocks: new Map(),
  // Lazy history loading: ctx._hasOlder = more pages exist before the first rendered
  // message; _loadingOlder guards against scroll-triggered double requests.
  _loadingOlder: false,
  // First-run onboarding: shown when no provider is configured; dismissed on skip
  // (stays dismissed for the webview's lifetime, reappears after a reload).
  _welcomeDismissed: false,
  _lastProviderStatus: {}, // cached for re-opening the welcome panel on needsSetup errors
  // Panel preview caps (PANEL_PREVIEW_CHARS / PANEL_BLOCK_MAX retired with the
  // side tool panel — output now renders inline in the tool card / advisor block)
  _currentTool: null,  // name of the tool currently executing (CLI status parity)
  _llmCalls: 0,        // LLM calls this turn (CLI turn-count parity)
  _turnStart: null,    // ms timestamp of the current turn (elapsed parity)
  // Review-guard / Engineering mode quick-switch state (session-bar buttons;
  // the settings panel has the full advisor configuration).
  _advisorOn: false,
  _engOn: false,
  // §17 suspension session (AGENT-LOOP.md D-S2..S9): active while background async
  // subagents run after a turn — the input box stays usable (Enter queues instead of
  // breaking digests), the status line shows the background counts. Never touched by
  // background events beyond these host-driven updates (F3).
  _suspended: false,
  _suspCounts: null, // { running, queued, pending } — rendered into the status line
}

/**
 * 异步子代理池活跃判定（2026-09-05 走查缺陷修复——"子代理执行中主会话可继续使用"）：
 * 有 running/started/queued 条目 = 后台池活跃——此时父回合即使仍在跑（模型可能还
 * 在 status/check 轮询），主输入框也应放开（send 排队不打断——与 CLI 挂起语义对位：
 * CLI 池 live = 输入可用 + Enter 排队）。done/error/cancelled 后 map 条目进入清理期
 * （panels.js linger）——按 status 判定活跃，不依赖条目存在期。
 */
export function poolActive() {
  return Object.values(S._subagentMap ?? {}).some((s) =>
    s.status === "running" || s.status === "started" || s.status === "queued")
}

