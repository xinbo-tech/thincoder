/**
 * chat-panel.mjs — ChatPanel class: webview panel, message routing, session management.
 * Extracted from extension.mjs to keep the entry point lean.
 * Split 2026-08-22 (500-line rule): session/project/index/MCP method implementations
 * live in panel-session.mjs / panel-project.mjs / panel-index.mjs / panel-mcp.mjs;
 * the same-named methods below are thin delegates, so every external caller
 * (panel-messages.mjs, panel-chat.mjs, permission-gate.mjs) is unaffected.
 */
import * as vscode from "vscode"
import { readFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { setSlotAutoApprove, setSlotPlanMode } from "./session-io.mjs"
import { providerStatus, saveProviderKey, deleteProviderKey, pushStatus, fullStatus, endProbeWindow, agentSettings, proxySettings, shellCandidates, websearchSettings, saveMcpServer, deleteMcpServer } from "./settings.mjs"
import { loadLocaleStrings } from "../i18n.mjs"
import { handlePanelMessage, routeUserTurn, _cwd, setProjectFolder, clearProjectOverride, stopLiveHeartbeat } from "./panel-messages.mjs"
// queue-visible 批（2026-09-24 · 台账 #249）：队容量单源 = `queued-merge.mjs`（会话载体满队守卫）
import { QUEUED_MAX_ITEMS } from "./queued-merge.mjs"
// 无工作区守卫（2026-09-21 批 · `PROJECT-SWITCHER.md` §4.1）：判据单源 + 提示 + 状态推送
import { blockOnNoWorkspace, pushWorkspaceGuard, releaseWorkspaceGuard, hasWorkspaceFolder } from "./workspace-guard.mjs"
import { subagentChannelSummary } from "./panel-subagent-relay.mjs"
import { runPanelChat } from "./panel-chat.mjs"
import { loadRaw } from "@thincoder/core/config-io.mjs"
import { logEvent } from "@thincoder/core/log.mjs"
import { initStopTrace } from "./stop-trace.mjs"
import { ensureSlot, activeData, activeHistory, activeLines, saveLines, loadModelPrefs, loadSession, loadOlder, newSession, deleteSession, pushSessions, generateTitle, status as bootstrapStatus, openSessionContent } from "./panel-session.mjs"
import { projectInfo, pushProject, applyProjectSwitch, onProjectChanged, pickProject, releaseOldCwdClaims } from "./panel-project.mjs"
import { pushIndexStatus, atComplete, saveEmbeddingConfig, maybePromptIndex, buildIndex, maybePromptLegacyIndexRemoval } from "./panel-index.mjs"
import { closeAllMcp, pushMcpStatus, reconnectMcp, editMcp, testMcp } from "./panel-mcp.mjs"
import { initLedgerSurface, dispose as disposeLedgerSurface } from "./ledger-surface.mjs" // LEDGER-SURFACE（§2.30.3.5）

const __dirname = dirname(fileURLToPath(import.meta.url))

export class ChatPanel {
  /** @param {vscode.ExtensionContext} context */
  constructor(context) {
    this._context = context
    this._panel = null

    this._abortController = null
    // C1（SESSION-FLOW-C F-C1a/b）：_turnHandle = 最近回合的 promise（fire 语义——不 await）——
    // 保底 catch 挂它（回合 promise 永不悬挂——H-B）；_abortRequested = abort 启动闩（H-C——
    // Startup 窗口 Stop 被吞）——router 交付无效时置位，newTurnController（panel-chat.mjs）
    // 消费即复位。
    this._turnHandle = null
    this._abortRequested = false
    this._distillController = null  // async distillation abort (SEND-STALL-DISTILL): aborted ONLY on dispose / session switch, never per turn
    this._permissionQueue = []
    // Live autoApprove flag for the current turn — approve-all / the AUTO toolbar
    // button flip it MID-TURN (via _setAutoApprove); the permission gate re-checks
    // it on every invocation because runAgent's startup snapshot cannot change.
    this._autoApprove = false
    this._questionQueue = []  // pending inline question-tool prompts (panel, not native popups)
    this._statusBar = null    // status-bar run indicator (idle/running/waiting)
    // C2（SESSION-FLOW-C F-C2a——忙态单来源）：_turnState 枚举 {idle, running, susp}——
    // running = 回合（含会话内 digest/用户回合）执行中；susp = 挂起会话活跃（或释放窗口
    // 池仍 live）；waiting（权限/question 队列）为 running 修饰态非互斥——只经 _refreshStatus
    // 呈现（"waiting 优先 running"语义保留），不入枚举。读者一律走谓词 turnBusy()（缩小迁移面）。
    this._turnState = "idle"
    // AGENT-LOOP-ASYNC-POOL.md §6.8 挂起（suspension.mjs / panel-chat.mjs，2026-09-02）：
    // _susp/_suspWake 由 suspensionSession 建/清（会话句柄 + 单槽唤醒器）；
    // 入队容器已随排队机制废弃（INPUT-LOCK-ASYNC C'——2026-09-09）⇒ queue-visible 批（2026-09-24）
    // 恢复为队列（容量 8）：busy（running 含 digest/标题窗口）提交入队列——routeUserTurn 两载体分流；挂起空闲消息走
    // susp.pendingInput 同队列（_chat 内分流——busy-extend 批 2026-09-22：会话在飞 busy 同队列）。
    // _turnControllers = 回合内 controller 重建登记（偏差修复 #3——会话 Stop 统一 abort）。
    this._turnControllers = []
    // F16（2026-09-21 busy-injection 批 · `docs/vsc/design/WEBVIEW-INPUT.md` §1 C-B2-6）：
    // 普通回合 busy 期排队输入队列（容量 8）——webview `queuedUserMessage` / 外部入口经 routeUserTurn
    // 分流排队（`_chat` 不并发开回合）；回合尾由 `enterSuspensionTurn` 装载两分支送达。
    this._busyQueued = []
    // The slot number this panel is bound to. Set once when a session is opened/created,
    // then used for ALL reads and writes — we never re-read the shared manifest's active
    // pointer mid-conversation (it can be changed by a concurrently running CLI).
    this._slot = null
    // agent 生命周期对齐 CLI（2026-09-08）：顶层 agent 会话级单例——
    // 首轮 runAgent 经 ensurePanelAgent 建、后续回合复用同一对象（AC1/F1）；会话切换/换项目/
    // dispose 销毁置 null（AC4——六销毁点）——内存态随对象回收，槽文件仍权威。
    this._agent = null

    // Follow-active-file project switching (multi-root): when the setting is on and the
    // active editor's folder differs from the current project, switch automatically.
    // Guarded by turnBusy() — never yank the cwd out from under a running turn OR a
    // live suspension session (C2: susp counts as busy).
    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (!editor) return
      try {
        const follow = vscode.workspace.getConfiguration("thincoder.project").get("followActiveEditor", false)
        if (!follow) return
        const folder = vscode.workspace.getWorkspaceFolder(editor.document.uri)
        if (!folder || folder.uri.fsPath === _cwd() || this.turnBusy()) return
        // F-CR4 跨 cwd 释放（台账 #168② · SESSION.md §6.15 ③ / §6.16）：跟随活动编辑器的**自动**项目
        // 切换与显式切换器同面（同一缺陷族）——切换前记旧 cwd，成功后补一次同语义释放。
        const oldCwd = _cwd()
        const r = setProjectFolder(folder.uri.fsPath)
        if (r.ok) {
          // 销毁点（切换边界守卫在上方 turnBusy() 检查——销毁安全）
          this._agent = null
          releaseOldCwdClaims(oldCwd)
          this._onProjectChanged().catch((e) => console.error("[chat-panel] project switch failed:", e.message))
        }
      } catch (e) {
        console.error("[chat-panel] follow-active-file switch failed:", e.message)
      }
    }))

    // If the overridden project folder is removed from the workspace, fall back to
    // workspaceFolders[0] (a stale cwd would point agent runs at a dead directory).
    // 无工作区守卫（2026-09-21 批 · `PROJECT-SWITCHER.md` §4.1 恢复面）：空 ↔ 非空两向覆盖 +
    // 第三支路（非空 → 非空 = override 失效校验与回落）**逐字保留**。
    context.subscriptions.push(vscode.workspace.onDidChangeWorkspaceFolders(() => {
      const folders = vscode.workspace.workspaceFolders ?? []
      if (!hasWorkspaceFolder()) { // 判据单源（走守卫档——非本地 `folders.length` 形）
        // 转空：清 override + 槽解绑 + 销毁 agent + 推守卫态 + 主动提示——**不再走
        // `_onProjectChanged`**（旧路径会把 cwd 绑到 `process.cwd()` 并落槽 = 违背「不落 session 槽」）。
        // 槽解绑是恢复面「重新认领」的前提：留着旧根的槽号会把转非空后的 boot 钉在
        // 已移出根的会话上（`ensureSlotAsync` 粘性直返）。
        const oldCwd = _cwd() // F-CR4 跨 cwd 释放（#168②——同族第三落点）：转空即换 cwd
        clearProjectOverride()
        this._slot = null
        // 销毁点（工作区转空即换 cwd——agent 不跨项目复用）
        this._agent = null
        releaseOldCwdClaims(oldCwd) // 旧 cwd 认领补一次同语义释放（单点 = panel-project.mjs；同 cwd ⇒ no-op）
        pushWorkspaceGuard(this, true)
        blockOnNoWorkspace(this, { once: true })
        return
      }
      // 转为非空且此前守卫（`_wsGuardNotified` = 空窗实据）：复位去重 + 推放行 + 认领装载
      // ⇒ 面板直接可用（免重载恢复；后续回合走既有权）。
      if (this._wsGuardNotified === true) {
        releaseWorkspaceGuard(this)
        pushWorkspaceGuard(this, false)
        openSessionContent(this).catch((e) => console.error("[chat-panel] workspace guard release failed:", e.message))
        return
      }
      // 第三支路（非空 → 非空）：override 失效校验与回落——逐字保留
      const cwd = _cwd()
      if (!cwd || folders.some((f) => f.uri.fsPath === cwd)) return
      clearProjectOverride()
      // 销毁点（工作区兜底即换 cwd——agent 不跨项目复用）
      this._agent = null
      // F-CR4 跨 cwd 释放（台账 #168②）：失效 override 的旧 cwd 认领同释放（回落即换 cwd）。
      releaseOldCwdClaims(cwd)
      this._onProjectChanged().catch((e) => console.error("[chat-panel] project fallback failed:", e.message))
    }))
  }

  // ─── WebviewViewProvider ─────────────────────────

  /**
   * Called by VS Code when the sidebar view becomes visible.
   * Sets up the webview HTML, message listener, and initial state.
   * @param {vscode.WebviewView} webviewView
   * @param {vscode.WebviewViewResolveContext} _context
   * @param {vscode.CancellationToken} _token
   */
  resolveWebviewView(webviewView, _context, _token) {
    this._panel = webviewView
    // ① 无工作区守卫：面板启用即提示（每空窗**恰一次**——去重，`_wsGuardNotified`）。
    // 面板照常建（webview 要在位才能显示占位符/toast，且工作区变化时靠它投守卫态）——本点只提示。
    blockOnNoWorkspace(this, { once: true })
    webviewView.webview.options = {
      enableScripts: true,
      retainContextWhenHidden: true,
    }

    webviewView.onDidDispose(() => {
      // F-W19（`SETTINGS.md` §2.12 ③）: view 销毁 = 探针窗口终止（撤未发重试；在途结果不再回投）。
      // 必须在 `this._panel = null` 之前捕获 view 对象——窗口键 = 面板对象。
      endProbeWindow(webviewView)
      this._panel = null
      // 2026-09-11 第 10 批（§5.1.4 第 1 条——跨 view 不串味）：view 销毁 → 投递闸门
      // 关闩 + 清空队列（旧 view 的待投事件不得灌进下一个 view——新 view 经 webviewReady
      // 握手重新开闩）。
      this._wvReady = false
      // ⑥（2026-09-19）：清队留痕（`discard-dispose`——禁静默；重建面交心跳 / 就绪再断言——D-W29）
      const discarded = Array.isArray(this._wvOutbox) ? this._wvOutbox : []
      if (discarded.length > 0) logEvent("ev:subdeliver", { action: "discard-dispose", ch: subagentChannelSummary(discarded), n: discarded.length, wvReady: false })
      this._wvOutbox = []
      stopLiveHeartbeat(this) // 出生自愈心跳停拍（D-W20——起于 webviewReady）
      // §11 销毁点：view 销毁 → 会话级 agent 随之销毁（面板重开经 ensurePanelAgent 重建）
      this._agent = null
      this._abortController?.abort()
      this._distillController?.abort()  // kill any in-flight async distillation — it belongs to the dying view
      closeAllMcp()
    })

    webviewView.webview.html = this._html()
    webviewView.webview.postMessage({ type: "i18n", strings: loadLocaleStrings(vscode.env.language) })
    initStopTrace(this._context, vscode)

    webviewView.webview.onDidReceiveMessage((msg) => {
      handlePanelMessage(this, msg).catch((e) => console.error("[chat-panel] message handler:", e.message))
    })

    this._initStatusBar()
    // B2（SESSION-FLOW-B F-B2a/F-B2b——2026-09-09）：resolve 只起慢段（_status() = status()
    // 慢段——migrate/fullStatus/mcpStatus/模型偏好/索引——探测与 webview 加载重叠并行）；
    // 快段 openSessionContent（会话内容 + 槽绑定）移入 webviewReady 握手——resolve 期
    // webview 未加载，此刻发内容即丢（Reload 后对话区空缺陷的静态根因）——不得双跑快段
    // （内容双发/槽重绑）。慢段头部 pushStatus 可能丢——webviewReady _pushStatus 兜底（幂等）。
    this._status()
  }

  // ─── Status bar (run-state awareness outside the panel) ───

  _initStatusBar() {
    initLedgerSurface(this) // LEDGER-SURFACE：台账 item 并立（priority 99）——须先于下方守卫（生产路径 _statusBar 由 extension.mjs 预置）
    if (this._statusBar) return
    this._statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100)
    this._statusBar.name = "ThinCoder"
    this._statusBar.tooltip = "ThinCoder — click to open the chat panel"
    this._statusBar.command = "thincoder.openChat"
    this._setStatus("idle")
    this._statusBar.show()
  }

  /** running = agent turn active; waiting = permission/question prompt pending. */
  _setStatus(state) {
    if (!this._statusBar) return
    if (state === "running") {
      this._statusBar.text = "$(sync~spin) ThinCoder"
      this._statusBar.backgroundColor = undefined
    } else if (state === "waiting") {
      this._statusBar.text = "$(warning) ThinCoder: waiting for your input"
      this._statusBar.backgroundColor = new vscode.ThemeColor("statusBarItem.warningBackground")
    } else {
      this._statusBar.text = "$(hubot) ThinCoder"
      this._statusBar.backgroundColor = undefined
    }
  }

  /**
   * C2（SESSION-FLOW-C F-C2a——忙态单来源）：读者谓词——任何回合执行中 / 挂起会话活跃 /
   * 释放窗口（池仍 live）都算 busy。内部以 _turnState 枚举表达；读者只调本方法
   * （迁移面缩小——6+ 处读者不用各自推导 idle/running/susp）。
   */
  turnBusy() {
    return this._turnState !== "idle"
  }

  /**
   * C2（SESSION-FLOW-C F-C2b——忙态单一广播点）：每次忙态 set/clear 行调用——
   * 发 {type:"turnState", state, counts?} 新消息（webview 单一 reducer 更新 S._turnState；
   * counts 随 susp 计数刷新携带——F-C2e digest 间不陈旧）。状态未变且无 counts → 不重发
   * （幂等——282/300 同态重发只靠 counts 参数驱动）。
   */
  _publishTurnState(state, counts) {
    const changed = state !== this._turnState
    this._turnState = state
    if (changed || counts) {
      this._panel?.webview.postMessage({ type: "turnState", state, ...(counts ? { counts } : {}) })
    }
  }

  /** Waiting prompts beat running; without pending prompts, fall back to turn state.
   *  F-W13（§4.4）：waiting 判据 = 权限 / 批权限 / question 三队列；释放 ⇒ 必刷（单源 = `releasePermission`）。 */
  _refreshStatus() {
    if (this._permissionQueue.length > 0 || this._questionQueue.length > 0 || this._batchPermissionQueue?.length > 0) { this._setStatus("waiting"); return }
    this._setStatus(this.turnBusy() ? "running" : "idle")
  }

  sendMessage(text) {
    if (!this._panel) {
      vscode.window.showWarningMessage("ThinCoder panel is not ready yet — please wait a moment and try again.")
      return
    }
    // ③ 无工作区守卫（先于回显 ⇒ 无假气泡；先于回显也先于 routeUserTurn）
    if (blockOnNoWorkspace(this)) return
    // INPUT-LOCK-ASYNC（C'——F-1/F-3）→ C-B2-6 busy 排队注入（busy-injection 2026-09-21 ·
    // busy-extend 2026-09-22 扩面）：busy（`_turnState === "running"`——回合/digest/标题窗口——
    // 单一判据）一律队列受理（容量 8）——挂起会内 busy 拒收守卫随本批撤销（同面受理：回显先决 + 下方
    // `routeUserTurn` 两载体分流——会话在飞入会话队列 / 无会话入 `_busyQueued`；C-B2-6 细则③）。
    if (this._panel) {
      // Echo FIRST — the quick-input command renders its own user bubble（排队气泡面同款）；
      // F（SESSION-RESTORE-PARITY）：echo 补真实时间戳——气泡时间 = 发出时刻（非回退"现在"）。
      this._panel.webview.postMessage({ type: "userMessage", text, timestamp: Date.now() })
      // A1（SESSION-FLOW-A F-A1——修 R6 残留——sendMessage 曾是唯一绕过 routeUserTurn 的
      // 入口——回合中 Ask ThinCoder/发送命令直呼 _chat 杀当前回合）：命令直发并入
      // userMessage/retry 的单一入口——busy 单槽受理（C-B2-6；susp 两态 D-S5 分流不变）；idle 直发。
      routeUserTurn(this, { text, modelOverride: undefined, reasoning: undefined, providerName: undefined, images: undefined })
    }
  }

  dispose() {
    closeAllMcp()
    // §11 销毁点：面板 dispose → 会话级 agent 随之销毁（扩展重载/关面板后重建走 ensurePanelAgent）
    this._agent = null
    this._abortController?.abort()
    this._distillController?.abort()  // in-flight async distillation belongs to the dying panel (SEND-STALL-DISTILL)
    // AGENT-LOOP-ASYNC-POOL.md §6.8: a live suspension session dies with the panel — abort the session controller
    // AND the entering turn's full controller set (偏差修复 #3: children spawned under
    // rebuilt controllers would otherwise escape; their settles then no-op on the
    // aborted signal).
    this._susp?.abortControllers?.forEach((c) => c.abort())
    this._susp?.abort?.abort()
    this._statusBar?.dispose()
    this._statusBar = null
    disposeLedgerSurface() // LEDGER-SURFACE：台账 item / 周期随面板释放（重载后 init 可重建）
    endProbeWindow(this._panel) // F-W19（§2.12 ③）：面板 dispose = 探针窗口终止（重试链止）
    this._panel?.dispose()
  }

  // ─── Session (implementations in panel-session.mjs) ───

  _ensureSlot() { return ensureSlot(this) }
  _activeData() { return activeData(this) }
  _activeHistory() { return activeHistory(this) }
  _activeLines() { return activeLines(this) }
  _saveLines(fullHistory, contextHistory, extra = {}, slotOverride) { return saveLines(this, fullHistory, contextHistory, extra, slotOverride) }
  _loadModelPrefs() { return loadModelPrefs(this) }
  _loadSession() { return loadSession(this) }
  _loadOlder(before) { return loadOlder(this, before) }
  async _newSession() { return newSession(this) }
  async _deleteSession(slot) { return deleteSession(this, slot) }
  _pushSessions() { return pushSessions(this) }
  async _generateTitle(slotOverride, messages) { return generateTitle(this, slotOverride, messages) }
  async _status() { return bootstrapStatus(this) }

  // ─── Project (implementations in panel-project.mjs) ───

  _projectInfo() { return projectInfo(this) }
  _pushProject() { return pushProject(this) }
  async _applyProjectSwitch(fsPath) { return applyProjectSwitch(this, fsPath) }
  async _onProjectChanged() { return onProjectChanged(this) }
  async _pickProject() { return pickProject(this) }

  // ─── MCP (implementations in panel-mcp.mjs) ───

  _pushMcpStatus() { return pushMcpStatus(this) }
  async _reconnectMcp(name) { return reconnectMcp(this, name) }
  _editMcp(name, config) { return editMcp(this, name, config) }
  async _testMcp(name) { return testMcp(this, name) }

  // ─── Settings ─────────────────────────────────

  _providerStatus() { return providerStatus() }
  async _saveProviderKey(name, key) { await saveProviderKey(name, key); this._pushStatus() }
  async _deleteProviderKey(name) { await deleteProviderKey(name); this._pushStatus() }
  _saveMcpServer(name, config) { return saveMcpServer(name, config) }
  _deleteMcpServer(name) { return deleteMcpServer(name) }

  async _setAutoApprove(value) {
    this._autoApprove = value  // mid-turn source of truth for the permission gate
    // Session-level persistence (CLI parity): autoApprove lives in the slot file shared
    // with the CLI — NOT in VS Code settings.json. Workspace-scope overrides of the old
    // `thincoder.autoApprove` setting are gone with it (the setting is removed).
    try {
      setSlotAutoApprove(_cwd(), this._ensureSlot(), value)
    } catch { /* slot unwritable — the live flag still governs this turn */ }
  }

  /** Toggle plan mode (session-level, like autoApprove). Persists to the slot so the
   *  toolbar button and the model's own plan tool stay in sync across turns.
   *  ENG-PLAN-EXCLUSION（FR31 ② / AC13/T11）：工程模式 ⇒ **开方向拒绝**——不写槽 + 回弹
   *  `{type:"planMode", active:false}`（真值 = 槽权威面 `agentSettings(_agentSettingsSession())`
   *  ——`_agentSettingsSession` 先例同档 `:359-364`；不读 `_agent`，恢复后的工程会话首回合前也不
   *  fail-open）。关方向（value:false）是归零语义（`handleSetEngineeringEnabled` ON 时就地调它），
   *  照常走既有契约（槽写 + 回推）——工程态下它只会把残留半状态清干净。 */
  async _setPlanMode(value) {
    if (value === true && this._engineeringOn()) {
      this._panel?.webview.postMessage({ type: "planMode", active: false })
      return
    }
    try {
      setSlotPlanMode(_cwd(), this._ensureSlot(), value)
    } catch { /* slot unwritable — the flag still governs this turn */ }
    this._panel?.webview.postMessage({ type: "planMode", active: value })
  }

  /** 工程模式真值（槽权威面——`agentSettings` 槽优先/ config 回退；读失败 ⇒ 非工程——不制造假拒）。 */
  _engineeringOn() {
    try { return agentSettings(this._agentSettingsSession()).engineering === true } catch { return false }
  }

  _pushStatus() {
    pushStatus(this._panel)
  }

  /** Settings snapshot push WITHOUT the provider-model network probe (fullStatus).
   *  Used for save acknowledgements — the panel already shows what the user typed;
   *  a full re-probe would rebuild the settings panel and drop in-progress edits.
   *  **序 = 契约**（`SETTINGS.md` §2.8）：`agentSettings` 居末位——它是打开等待器的唯一
   *  触发拍（`webview/settings.js` 的 `requestAgentSettingsThen`），末位才能保证建面时
   *  其余快照已在位。 */
  async _pushSettingsLight() {
    // Snapshot-only (no network probe) — but the snapshot must be COMPLETE: providerStatus
    // (per-provider proxy checkboxes revert without it) and shellCandidates WITH current
    // (the webview nulls the shell value when current is missing).
    // F-W18（`SETTINGS.md` §2.11）：shell 候选面探测 = 异步（`await`，不阻塞宿主事件循环）——
    // **相对序零改**：agentSettings 仍居末位（打开等待器唯一触发拍——W8-1 序契约）。
    pushStatus(this._panel)
    this._panel?.webview.postMessage({ type: "proxySettings", settings: proxySettings() })
    this._panel?.webview.postMessage({ type: "websearchSettings", settings: websearchSettings() })
    this._panel?.webview.postMessage({ type: "shellCandidates", candidates: await shellCandidates(), current: loadRaw().shell ?? null })
    this._panel?.webview.postMessage({ type: "agentSettings", settings: agentSettings(this._agentSettingsSession()) })
  }

  async _pushSettings() {
    fullStatus(this._panel)
    // F-W18（§2.11）：候选面就绪后再发快照族（异步探测——不阻塞事件循环；相对序零改）。
    const candidates = await shellCandidates()
    this._panel?.webview.postMessage({ type: "agentSettings", settings: agentSettings(this._agentSettingsSession()) })
    this._panel?.webview.postMessage({ type: "proxySettings", settings: proxySettings() })
    this._panel?.webview.postMessage({ type: "websearchSettings", settings: websearchSettings() })
    this._panel?.webview.postMessage({ type: "shellCandidates", candidates, current: loadRaw().shell ?? null })
    this._pushMcpStatus()
    this._pushIndexStatus()
  }

  /** Session reference for the agentSettings snapshot: engineering/advisor.guard are
   *  session-level (slot authority) — the ENG/GUARD buttons must reflect the session,
   *  not global config. Unbound panel (no slot yet) → null → config fallback. */
  _agentSettingsSession() {
    try {
      const slot = this._slot ?? this._ensureSlot()
      return slot != null ? { cwd: _cwd(), slot } : null
    } catch { return null }
  }

  // ─── Index (implementations in panel-index.mjs) ───

  /** F-W18（§2.11）：打开拍回批序首拍——async 化供调用侧 `await`（indexStatus 先落，
   *  其后 `_pushSettingsLight` 的候选 / 快照族才发——W8-1 序契约）。 */
  async _pushIndexStatus() { return pushIndexStatus(this) }
  async _atComplete(query, cwd, seq) { return atComplete(this, query, cwd, seq) }
  async _saveEmbeddingConfig(config) { return saveEmbeddingConfig(this, config) }
  async _maybePromptIndex() { return maybePromptIndex(this) }
  async _maybePromptLegacyIndexRemoval() { return maybePromptLegacyIndexRemoval(this) }
  async _buildIndex() { return buildIndex(this) }

  // ─── Chat ─────────────────────────────────────

  async _chat(text, modelOverride, reasoning, providerName, images, fromBusyQueue = false, visionReader = null) {
    // AGENT-LOOP-ASYNC-POOL.md §6.8 D-S4/D-S5（INPUT-LOCK-ASYNC C'——2026-09-09）：挂起会话活跃期消息走 driver 的
    // pendingInput 队列——挂起空闲（driver 纯等待）与会话在飞 busy（busy-extend 2026-09-22：
    // routeUserTurn 同判据入同队列）均填队 + 唤醒即开用户回合；容量 8（queue-visible 批 2026-09-24）
    // ——绝不并发开独立回合（会从磁盘重载 lines 孤儿化后台池）。入队项携来源标记（`fromBusyQueue`
    // + `visionReader`——C-B2-6 细则⑥：送达时过 F-1 判定；纯挂起既有路径零携 ⇒ 零改）。
    const susp = this._susp
    if (susp?.active) {
      // 队列满（第 9 条——queue-visible 批 2026-09-24 容量 8；同事件循环竞态防御——driver 唤醒即消费，
      // 正常不可达）→ 拒收提示不覆盖不丢（主守卫 = routeUserTurn 两载体合计；本支 = 会话载体兜底）
      if (susp.pendingInput.length >= QUEUED_MAX_ITEMS) {
        vscode.window.showWarningMessage("ThinCoder: a task is running — wait for it to finish before sending.")
        return
      }
      susp.pendingInput.push({ text, modelOverride, reasoning, providerName, images, ...(fromBusyQueue ? { fromBusyQueue: true, visionReader } : {}) })
      // 唤醒走 panel._suspWake 单槽（waitForSettleOrWake 在纯等待期注入；digest/回合执行期
      // 为 null → no-op——driver 轮末 pendingInput 检查接走）。susp.wake 曾是死字段
      // （2026-09-02 偏差修复 #4 已从 suspension.mjs 删除——唤醒槽单槽化至 _suspWake，
      // 历史说明见 ARCHITECTURE.md「挂起唤醒断链修复」段）。
      this._suspWake?.()
      return
    }
    // AGENT-LOOP-ASYNC-POOL.md §6.8 D-S2 释放窗口（2026-09-02 偏差修复 #2 + A2 修订 + INPUT-LOCK）：回合尾已登记
    // 挂起（池仍 live——_turnState==="susp" 且会话尚未建立）——A2 后标题移入 finally 归位前
    // （running——路由守卫入队列），会话建立与 susp 广播同同步续段（零事件窗口）——
    // 防御：无会话的 susp 态消息拒收（开并发独立回合 = 从磁盘重载 lines 孤儿化池 + abort
    // 外回合 controller——AC-S2 竞态）。
    if (this._turnState === "susp") {
      vscode.window.showWarningMessage("ThinCoder: a task is running — wait for it to finish before sending.")
      return
    }
    // C1（SESSION-FLOW-C F-C1a——turn 句柄化——修 H-B）：fire 语义不变（不 await——
    // sendMessage/消息路由都不阻塞）；句柄挂 panel._turnHandle。保底 catch：回合 setup 期
    // 异常（impl try 之前的抛点——ensureSlot/agent 绑定等）会跳过 impl 的 finally——UI 卡
    // running——这里兜底 error + loading:false + 复位忙态（不变量：回合 promise 永不悬挂）。
    // catch 内不再抛——派生 promise 恒 resolve——无 unhandled rejection 面。
    const handle = runPanelChat(this, { text, modelOverride, reasoning, providerName, images })
    this._turnHandle = handle
    handle.catch((e) => {
      console.error("[chat-panel] turn failed (F-C1a guard):", e?.message ?? e)
      const rawMsg = (e && (e.message || String(e))) || "unknown turn error"
      const errTextLine = rawMsg.split("\n")[0].replace(/https?:\/\/[^\s,)"']+/g, "[endpoint]")
      this._publishTurnState("idle")
      this._refreshStatus()
      this._panel?.webview.postMessage({ type: "error", text: errTextLine, techInfo: rawMsg })
      this._panel?.webview.postMessage({ type: "loading", loading: false })
    })
  }

  // ─── HTML ─────────────────────────────────────

  _html() {
    let html = readFileSync(join(__dirname, "..", "..", "webview", "index.html"), "utf8")
    const csp = this._panel.webview.cspSource
    html = html.replace("__CSP__",
      `default-src 'none'; style-src ${csp} 'unsafe-inline'; script-src ${csp} 'unsafe-inline'; img-src ${csp} https: data:; font-src ${csp}; connect-src ${csp};`)
    html = html.replace("__CSS_BASE_URI__", this._panel.webview.asWebviewUri(vscode.Uri.file(join(__dirname, "..", "..", "webview", "base.css"))).toString())
    html = html.replace("__CSS_CHAT_URI__", this._panel.webview.asWebviewUri(vscode.Uri.file(join(__dirname, "..", "..", "webview", "chat.css"))).toString())
    html = html.replace("__CSS_CONTROLS_URI__", this._panel.webview.asWebviewUri(vscode.Uri.file(join(__dirname, "..", "..", "webview", "controls.css"))).toString())
    html = html.replace("__CSS_SESSION_URI__", this._panel.webview.asWebviewUri(vscode.Uri.file(join(__dirname, "..", "..", "webview", "session.css"))).toString())
    html = html.replace("__CSS_SETTINGS_URI__", this._panel.webview.asWebviewUri(vscode.Uri.file(join(__dirname, "..", "..", "webview", "settings.css"))).toString())
    html = html.replace("__CHAT_URI__", this._panel.webview.asWebviewUri(vscode.Uri.file(join(__dirname, "..", "..", "webview", "chat.js"))).toString())
    return html
  }
}
