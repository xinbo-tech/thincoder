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
  // 活动区（2026-09-11 活动区回归——WEBVIEW.md §12）：子代理/consult/advisor-async 块
  // 出生即驻留此处（区尾）——live 固定可见（不随会话流滚动丢失）；空区 CSS `:empty`
  // 隐藏零高（零显隐 JS）、32vh 封顶 + 区内自滚。
  activityEl: document.getElementById("subagent-activity"),
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
  _subDescShown: false, // A13：首块活动说明行已示（panel 会话生命周期内一次——不随 resetActivity 复位）
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
  _goalInfo: null,
  // Current live-turn advisor block (in-conversation details element) — advisor
  // output streams here like reasoning instead of the side tool panel.
  _advisorBlock: null,
  // Subagent/consultant activity-stream blocks (ACTIVITY-REWRITE-SIMPLE——簿记 map 删
  // ——单 map 单守卫——键 = 频道名——终态冻结后条目保留作幂等守卫直至 resetActivity)。
  _subBlocks: new Map(),
  // 出生事件诊断痕迹（2026-09-11 第 10 批——WEBVIEW.md §5.1.4 第 7 条——activity.js 单一
  // 写点——环形末 SUB_TRACE_MAX 条）：takeover / late-terminal-stub / drop-unknown-role
  // 三类（范围 = 出生事件面——§5.1.9 声明）——复发时凭痕迹定位（NFR-A2）。
  _subTraceLog: [],
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
  _suspCounts: null, // { running, queued, pending, done } — rendered into the status line
  // C2（SESSION-FLOW-C F-C2a/b）→ F-6（SESSION-ACTIVITY-REVISED 2026-09-09——评审 #1
  // 定论）：host busy-state 单广播镜像——{type:"turnState", state, counts?} → 单一
  // reducer 更新本字段（S._turnState ∈ idle/running/susp——waiting 是 running 修饰态非
  // 互斥——不入枚举）。派生读：Stop 只显（state==="running"——回合/digest/标题窗口/
  // Reload 冷启重推——F-6 收窄：susp 纯池跑不显——无全停——池空自然消化完——子代理停
  // 止靠流内逐块 ⏹）。既有 _suspended 保持 suspension 消息驱动（会话级语义——digest
  // 执行中 state 为 running 时不得翻 false）。
  _turnState: "idle",
  // C2 (F-C2c): thinking 态标记——loading 消息经 setLoading 置位/清除；renderStatusBar
  // （#status-line 唯一 writer）据此绘制 thinking 段——不再 innerHTML 覆写状态行（修 H-E）。
  _phase: null, // null | "thinking"
}

/** 出生事件痕迹环上界（第 10 批 §5.1.4 第 7 条——环形末 50 条）。 */
export const SUB_TRACE_MAX = 50

