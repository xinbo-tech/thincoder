/**
 * panel-messages.mjs — ChatPanel webview message router (split out of chat-panel.mjs).
 * Every `case` dispatches to a ChatPanel method or a settings/provider helper.
 */
import * as vscode from "vscode"
import { t, loadLocaleStrings } from "../i18n.mjs"
import { saveModelPrefs, switchToSlot, setSlotTitle, setSlotAdvisorGuard, setSlotEngineering, slotOccupancy, loadSlot } from "./session-io.mjs"
import { handleAddProvider, handleRemoveProvider, handleSetProviderProxy, agentSettings, saveAgentSettingsFromPanel, saveProxySettingsFromPanel, testProxyConnection, shellCandidates, saveShellSettingsFromPanel, saveWebsearchKeyFromPanel, deleteWebsearchKeyFromPanel, testProviderConnection } from "./settings.mjs"
import { loadRaw, loadMcpServers } from "../config-io.mjs"
import { openSessionContent } from "./panel-session.mjs"
// B2（SESSION-FLOW-B——2026-09-09）：panel-messages ↔ panel-session 环 import（panel-session
// 头部 import 本文件 _cwd）——openSessionContent 只在 webviewReady case 函数体内使用（延迟
// 解引用）——环安全（两模块均无顶层跨环读取）。
import { addProviderFlow, removeProviderFlow, setKeyFlow, probeProviderAdmission } from "./provider-flows.mjs"
import { openDiffPreview } from "./diff-preview.mjs"
import { traceStop } from "./stop-trace.mjs"
import { savePastedImages, runVisionReader } from "./image-handler.mjs"
import { specForModel } from "../specs.mjs"
import { backgroundStatus, reassertLiveChildren } from "./suspension.mjs"
// 2026-09-11 第 10 批（§5.1.4 第 1/2 条）：任务可见性族投递通道（队列 flush 拍）
import { flushSubagentOutbox } from "./panel-callbacks.mjs"
// §18 C-5/C-6（2026-09-12）：permissionResponse 按 promptId 路由 + approve-all 连带释放（同一 release helper）
import { releasePermission } from "./permission-gate.mjs"
// LEDGER-SURFACE（§2.30.3.5）：台账启动行投递（webviewReady 时机）
import { pushLedgerStartup } from "./ledger-surface.mjs"

/** Current workspace folder (or process cwd) — shared with chat-panel. */
let _cwdOverride = null
export const _cwd = () => _cwdOverride ?? (vscode.workspace.workspaceFolders?.[0]?.uri?.fsPath || process.cwd())

/**
 * Switch the "current project" (agent cwd) in a multi-root workspace.
 * fsPath must be one of workspaceFolders — anything else is rejected.
 * Returns { ok } or { ok:false, error }.
 */
export function setProjectFolder(fsPath) {
  const folders = vscode.workspace.workspaceFolders ?? []
  if (!folders.some((f) => f.uri.fsPath === fsPath)) {
    return { ok: false, error: `Not a workspace folder: ${fsPath}` }
  }
  _cwdOverride = fsPath
  return { ok: true }
}

/** Drop the override — _cwd() falls back to workspaceFolders[0] again. */
export function clearProjectOverride() {
  _cwdOverride = null
}

/**
 * C1（SESSION-FLOW-C F-C1e——retry 并入 userMessage 同入口——修 H-F 守卫双份）：userMessage
 * 与 retry 共用同一路由——busy 拒收（INPUT-LOCK-ASYNC C'）与挂起分流（_chat 内 susp 守卫）
 * 全走一套判断——retry 不再绕过路由直呼 _chat（并发新回合竞态——AC-S2 同款）。
 * savePastedImages 同步落盘；F-1 降级分支（IMAGE-DOWNGRADE-VISION）在 await 前先置 running
 * （C' 忙锁不变量保持——降级窗口内拒收并发回合）。
 * A1（SESSION-FLOW-A F-A1——修 R6 残留）：sendMessage 命令直发（chat-panel.mjs——sendMessage
 * 宿主）并入同入口——导出供其调用——running→拒收（无回显无排队——回显由宿主先决）。
 */
export async function routeUserTurn(panel, { text, modelOverride, reasoning, providerName, images, visionReader = null }) {
  // INPUT-LOCK-ASYNC（C'——2026-09-09——F-1/F-3）：busy（_turnState==="running"——回合含
  // digest/标题窗口——单一判据）输入禁用——消息一律拒收不排队（排队机制与排队回执 UI
  // 消息类型全删）——webview 输入框已由 loading.js 锁（正常发送到不了这里——本守卫
  // 兜外部入口：Ask ThinCoder 命令/retry/竞态窗口）——提示明示（不静默丢）。susp 等待态
  // （纯后台池跑——主空闲）→ _chat 上游分流（pendingInput 单槽——D-S5 唤醒）；idle 直发。
  if (panel._turnState === "running") {
    vscode.window.showWarningMessage("ThinCoder: a task is running — wait for it to finish before sending.")
    return
  }
  // Plan B (GitHub thincoder#3): the webview sends pasted images as base64
  // dataURLs; the EXTENSION saves them to <cwd>/.thincoder/tmp/paste-*.<ext>
  // and passes absolute PATHS downstream. The field stays `images` (wire
  // compat), but from here on it carries paths — setupAgentRun appends the
  // "[Attached images: ...]" pointer and the model views them via read_image.
  // F-1（IMAGE-DOWNGRADE-VISION——2026-09-09——评审 #1 定稿 appendImagePointer 零动）：本入口 =
  // depth-0 主回合面——非视觉主模型贴图（specForModel(modelOverride).multimodal 假——webview
  // echo）→ 先置 running（C' 忙锁——await 窗口拒并发回合）→ 视觉渠道一次性子代理读图
  // （visionReader ?? runVisionReader——评审 #6 seam：参数注入 mock、缺省回落生产）——成功：描述
  // 注入 text（[图片 <路径> 描述: <描述>]）+ images 清空（throw 路径不再到达）；无渠道/spawn
  // 失败/超时/空返/异常 → 原样下发（主回合 setup 现报错文案——可读不静默丢）。susp 等待态
  // 不降级（排队回合走现路径——depth>0 子代理无此入口——边界明示）。
  let saved = Array.isArray(images) && images.length > 0
    ? savePastedImages(images, _cwd())
    : undefined
  // A12（群 A 批）：降级窗（下段 await）的外部取消载体——窗生命周期临时字段
  // （panel._visionAbort——唯一新字段；零新布尔状态）；finally 幂等清理。
  let visionAbort = null
  if (saved?.length && modelOverride && panel._turnState !== "susp" && !specForModel(modelOverride).multimodal) {
    panel._publishTurnState?.("running")
    visionAbort = new AbortController()
    panel._visionAbort = visionAbort
    let out = null
    try { out = await (visionReader ?? runVisionReader)({ paths: saved, providerName, cwd: _cwd(), signal: visionAbort.signal }) } catch { out = null }
    finally { if (panel._visionAbort === visionAbort) panel._visionAbort = null }
    if (out?.ok && typeof out.description === "string" && out.description.trim()) {
      const marker = `[图片 ${saved.join("、")} 描述: ${out.description.trim()}]`
      text = text?.trim() ? `${text}\n\n${marker}` : marker
      saved = undefined
    }
  }
  panel._chat(text, modelOverride, reasoning, providerName, saved)
  // C-MA12-4（停止语义 = 启动即中止）：窗内被 Stop → 用户消息照常入 history（at-most-half-
  // a-turn）但回合建立即 abort——置位序必须在 _chat 调用**之后**（其入口清陈旧闩，置前
  // 会被清掉）；newTurnController 消费。
  if (visionAbort?.signal.aborted) panel._abortRequested = true
}

/**
 * Handle one webview message. `panel` is the ChatPanel instance — its methods
 * (session mgmt, chat, settings push) stay in the class; this router only switches.
 */
export async function handlePanelMessage(panel, msg) {
  switch (msg.type) {
    case "userMessage":
      routeUserTurn(panel, { text: msg.text || "", modelOverride: msg.model, reasoning: msg.reasoning, providerName: msg.provider, images: msg.images })
      break
    case "selectModel": {
      // MODEL-SELECTION：模型选择 = 会话级——workspaceState prefs 保留 UI 态 + 写当前
      // 会话槽（saveLines 通道带 activeModel——槽播种——CLI resume/下回合恢复读槽——F-4）；
      // selectProviderModel（config 写路径）已退役——选择不再串扰 config 全局。会话槽模型
      // 双端自由（applySession 槽值权威）；候选行 = 运行期 `/models` 拉取（settings.mjs
      // fullStatus——无静态候选；显式 p:m 一律放行——R4）。
      const prefs = panel._loadModelPrefs()
      prefs.model = msg.model
      prefs.provider = msg.provider || ""
      saveModelPrefs(panel._context.workspaceState, prefs)
      if (msg.provider && msg.model) {
        try {
          const slot = panel._ensureSlot()
          const cwd = _cwd()
          const data = loadSlot(cwd, slot) ?? { history: [], contextHistory: [] }
          // 全量保存通道（saveLines——existing 往返字段保全）——只翻 activeProvider/activeModel
          panel._saveLines(data.history ?? [], data.contextHistory ?? [], { activeProvider: msg.provider, activeModel: msg.model }, slot)
          panel._pushSessions() // 会话列表摘要（p:m）随选随新
        } catch (e) {
          console.error("[chat-panel] selectModel slot write failed:", e.message)
        }
      }
      break
    }
    case "selectReasoning": {
      const prefs = panel._loadModelPrefs()
      prefs.reasoning = msg.reasoning
      saveModelPrefs(panel._context.workspaceState, prefs)
      break
    }
    case "newSession":
      // §17: session switch during a suspension session would orphan the background pool
      // (its lines/pool belong to the current session). Stop the session first.
      if (panel._susp?.active) { vscode.window.showWarningMessage("ThinCoder: background subagents are still running — stop them before starting a new session."); break }
      panel._newSession(); break
    case "switchSession": {
      // 会话切换竞态守卫（GitHub #2/#5，2026-08-28）：运行中禁止切换——此前只改 _slot 指针
      // 不 abort，旧 turn 的 stream/complete/标题会灌进新会话视图（"思考串台"）、内容落错槽
      // （"写错会话文件"）。与 applyProjectSwitch（panel-project.mjs）的运行中拒绝同模式。
      // C2（F-C2a）：守卫改谓词 turnBusy()——running 或 susp（含 digest 间等待）一律拒绝
      // （旧 _turnActive || _susp?.active 双读合一）。
      if (panel.turnBusy()) {
        vscode.window.showWarningMessage("ThinCoder: a task is running — stop it before switching sessions.")
        break
      }
      // 交付评审 🔵#5：manifest 漂移（槽不存在）时 switchToSlot 返回 null 且不切指针——
      // 此时不得把面板绑到幻影槽（否则渲染出空会话）。
      const target = switchToSlot(_cwd(), msg.slot)  // persists the shared active pointer for CLI interop
      if (target == null) break
      // 2026-09-01 advisor round2 🟡：目标槽被另一活进程（CLI/另一实例）占用时不得钉槽——
      // 面板 _slot 粘性会绕过 activeSlot 的认领决策，双方写同一槽静默互覆盖。占用 →
      // 不钉（_slot 保持 null）+ 提示。注意：loadSession 会在 load 时立即经 ensureSlot
      // 认领新槽（不是"下次保存才 fork"）——文案与实际行为对齐。
      const occ = slotOccupancy(_cwd(), msg.slot)
      if (occ.occupied) {
        vscode.window.showWarningMessage(`ThinCoder: session ${msg.slot} is being used by another live process — a new empty session has been created for you here.`)
        panel._slot = null
      } else {
        panel._slot = msg.slot          // bind this panel to the chosen slot
      }
      await panel._loadSession()
      break
    }
    case "deleteSession": {
      if (panel._susp?.active) { vscode.window.showWarningMessage("ThinCoder: background subagents are still running — stop them before deleting a session."); break }
      await panel._deleteSession(msg.slot); break
    }
    case "renameSession": {
      // Manual rename: prefill the current title; empty input = cancel (keep old title).
      const title = await vscode.window.showInputBox({
        prompt: t("session.renamePrompt"),
        value: msg.currentTitle || "",
        placeHolder: t("session.renamePlaceholder"),
        validateInput: (v) => (v.length > 60 ? t("session.renameTooLong") : null),
      })
      if (!title || !title.trim()) break
      const r = setSlotTitle(_cwd(), msg.slot, title.trim())
      if (!r.ok) vscode.window.showWarningMessage(`ThinCoder: session rename failed (${r.reason})`) // §12 F3：标题写失败可见
      panel._pushSessions()
      break
    }
    case "setProject": {
      // §17: project switch mid-suspension would yank cwd out from under the session —
      // the suspension lines/slot belongs to the old project's session store.
      if (panel._susp?.active) { vscode.window.showWarningMessage("ThinCoder: background subagents are still running — stop them before switching projects."); break }
      // Current-project switcher (multi-root): with fsPath → switch directly;
      // without → show the native folder picker.
      if (msg.fsPath) await panel._applyProjectSwitch(msg.fsPath)
      else await panel._pickProject()
      break
    }
    case "retry": {
      // C1（F-C1e——H-F）+ INPUT-LOCK（C'）：retry 与 userMessage 同入口（routeUserTurn）——
      // 回合中（running）retry 不再直开并发回合（拒收提示——禁排队）；idle/susp 直发。
      const history = panel._activeHistory()
      const lastUser = [...history].reverse().find((m) => (m.type ?? m.role) === "user")
      if (lastUser) routeUserTurn(panel, { text: lastUser.content, modelOverride: undefined, reasoning: undefined, providerName: lastUser.provider })
      break
    }
    case "abort":
      panel._stopClickTs = Date.now()
      traceStop("click received — abort() called", panel._stopClickTs)
      // C1（SESSION-FLOW-C F-C1b——abort 启动闩——修 H-C）：Startup 窗口（回合起点后、本回合
      // controller 建立前的 await 段——prevDistill/provider 解析可达秒级）无活 controller 可
      // 交付——abort 只能命中上回合僵尸 controller（交付无效）。此时记闩——newTurnController
      // 消费（新建 controller 立即 abort + 复位闩）。有活 controller（运行中）→ 交付即生效——
      // 不置闩（置了会被中断续跑重建消费——误杀 Ctrl+I/Continue 续跑）。
      // F-6（SESSION-ACTIVITY-REVISED——2026-09-09 用户裁定——评审 #1——废除 D-S9 susp
      // 全停）：Stop 只在主会话 running（回合/digest）显示与生效——只停当前主会话 controller
      // （_abortController = newTurnController 每回合新建——digest 轮 controller 或用户回合
      // controller——池 children 持会话 signal 不受影响——susp 等待期本无 digest 可停）。
      // 挂起等待期（susp——纯后台池跑）陈旧/竞态 Stop 点击 no-op——不再 _susp.aborted /
      // _susp.abortControllers 全链 abort / _susp.abort / _suspWake 唤醒（全停路径删除——
      // 无全停按钮——池空自然消化完——CLI 对拍）；子代理停止靠活动区每块 ⏹
      // （cancelSubagent 定向 abort——running+pool 块挂停 ⏹——queued/waiting 等待头挂取消 ⏹
      // （F-2——QUEUED-VISIBILITY——2026-09-09——覆盖 F-6 旧“queued/waiting 不挂”定论）。
      if (panel._turnState === "running") {
        // A12（群 A 批）：降级窗（视觉读图 await 段）优先——窗 controller 活且未 aborted →
        // 定向 abort + break（交付有效）。否则旧两路皆静默无效：命中上回合僵尸 controller /
        // 入口清闩丢失。
        if (panel._visionAbort && !panel._visionAbort.signal.aborted) {
          panel._visionAbort.abort()
          break
        }
        if (!panel._abortController || panel._abortController.signal.aborted) panel._abortRequested = true
        panel._abortController?.abort()
      }
      break
    // §19.5 D-M7 UI 停止（VS Code ⏹——不经模型回合——直连 extension 层定向 abort）：
    // webview 子块标题行 ⏹ 点击 → cancelSubagent 消息 → 定位 live lines 的池条目 →
    // 条目级 abort（cancelSubagent——与工具 action:'cancel' 同实现路径——D-M6）。
    // live lines 锚点 = panel._liveLines（runPanelChat 每回合登记——挂起期与
    // susp.lines 同一数组）。未知 id（陈旧按钮/池已清）→ no-op（无虚构状态）。
    // §9 D-24b（R13）：role="advisor" 伪角色条目在独立评审池（_asyncAdvisors）——
    // ⏹ 路由到 cancelAdvisorReview（②-6b——controller abort——取消不入 pending/不签发 token）。
    case "cancelSubagent": {
      const lines = panel._liveLines ?? panel._susp?.lines
      const id = Number(msg.id)
      const entry = lines?.history?._asyncSubagents?.get(id) ?? lines?.history?._asyncAdvisors?.get(id)
      // advisor round 2 #6：role 交叉校验——陈旧按钮命中同 id 异 role 的极端情况防御
      // （webview ⏹ 携带 block 的 role——消息契约不设死参数）
      if (!lines || !entry || entry.role !== msg.role) {
        console.warn(`[chat-panel] cancelSubagent: no live pool entry for id ${msg.id} role ${msg.role}`)
        break
      }
      if (entry.role === "advisor") {
        // W12（2026-09-15）：原端侧 `cancelAdvisorReview`（advisor-async.mjs）退役——改指核
        // `cancelAsyncAdvisor`（`@thincoder/core/agent-tools/advisor-async.mjs`——同一池
        // `_asyncAdvisors` 的核条目；cancelled settle 不入 pending、不签发 token）。
        const { cancelAsyncAdvisor } = await import("@thincoder/core/agent-tools/advisor-async.mjs")
        cancelAsyncAdvisor({ _asyncAdvisors: lines.history._asyncAdvisors, history: lines.history }, id)
        break
      }
      const { cancelSubagent } = await import("../agent-tools/subagent.mjs")
      cancelSubagent({ _asyncSubagents: lines.history._asyncSubagents, history: lines.history }, id)
      break
    }
    // Ctrl+I inject (CLI parity): abort with an interrupt reason — the agent loop
    // commits partial output, injects the message, and resumes from the same context.
    case "interrupt":
      panel._stopClickTs = Date.now(); traceStop("interrupt received", panel._stopClickTs)
      // C1（F-C1b）：同 abort——启动窗口 interrupt 无活 controller → 记闩（回合起点消费；
      // 窗口内 interrupt 无法注入续跑——降级为停止）。运行中 → 交付（interrupt 续跑重建消费
      // 点恒 no-op——不置闩）。
      if (!panel._abortController || panel._abortController.signal.aborted) panel._abortRequested = true
      panel._abortController?.abort({ interrupt: true, message: msg.message })
      break
    // Clickable file paths in tool cards — open in the editor, at the line if given.
    case "openFile": {
      try {
        const doc = await vscode.workspace.openTextDocument(msg.path)
        const ed = await vscode.window.showTextDocument(doc, { preview: true })
        if (msg.line) {
          const pos = new vscode.Position(msg.line - 1, 0)
          ed.selection = new vscode.Selection(pos, pos)
          ed.revealRange(new vscode.Range(pos, pos), 2 /* InCenter */)
        }
      } catch (e) { console.error("[openFile] failed:", e.message) }
      break
    }
    // Permission prompt: open a large diff in the editor's native diff viewer.
    case "openDiff": await openDiffPreview(msg.diff); break
    case "loadOlder": panel._loadOlder(msg.before); break
    case "questionResponse": {
      // C1（SESSION-FLOW-C F-C1d——修 H-D）：按 promptId 精确匹配队列条目——不再无条件 shift
      // （旧卡片/乱序响应会错 resolve 队头——新 question 被旧卡答案吞）。无 promptId（旧
      // webview）→ 回退队头（历史语义）；找不到 → no-op（陈旧卡——不虚构 resolve——不 resolve
      // 错队头）。
      const entry = msg.promptId != null
        ? panel._questionQueue.find((e) => e.id === msg.promptId) ?? null
        : (panel._questionQueue[0] ?? null)
      if (entry == null) break
      const i = panel._questionQueue.indexOf(entry)
      if (i >= 0) panel._questionQueue.splice(i, 1)
      entry.resolve(msg.answer ?? null)  // null → tool returns "(user cancelled)"
      panel._refreshStatus()
      break
    }
    case "setAutoApprove": await panel._setAutoApprove(!!msg.value); break
    case "atComplete": await panel._atComplete(msg.query, msg.cwd, msg.seq); break
    case "permissionResponse": {
      // §18 C-5（child permission gate）：promptId 精确匹配（question F-C1d 同构）；无 id（旧 webview）
      // → 回退队头；未知 → no-op（陈旧卡不误 resolve）。
      const entry = msg.promptId != null
        ? panel._permissionQueue.find((e) => e.id === msg.promptId) ?? null
        : (panel._permissionQueue[0] ?? null)
      if (entry == null) break
      const pi = panel._permissionQueue.indexOf(entry)
      if (pi >= 0) panel._permissionQueue.splice(pi, 1)
      if (msg.approved === "approveAll") {
        entry.resolve(true)
        // §18 C-6 ③：approve-all 连带——其余 pending 逐个 release（permissionWithdrawn）；AUTO 置位（零改）
        for (const e of [...panel._permissionQueue]) releasePermission(panel, e, true)
        await panel._setAutoApprove(true)
        panel._panel?.webview.postMessage({ type: "autoApprove", value: true })
      } else {
        entry.resolve(!!msg.approved)
      }
      panel._refreshStatus()
      break
    }
    case "batchPermissionResponse": {
      // §16 D-B1: merged ask — approveAll / oneByOne / deny (deny → whole batch refused,
      // no second ask; oneByOne → execute-tools falls back to per-item asks).
      const entry = panel._batchPermissionQueue?.shift()
      entry?.resolve(msg.choice === "approveAll" ? "approveAll" : msg.choice === "oneByOne" ? "oneByOne" : "deny")
      panel._refreshStatus()
      break
    }
    case "settings": await panel._pushSettings(); break
    case "saveProviderKey": await panel._saveProviderKey(msg.name, msg.key); break
    case "saveCustomProvider": await panel._saveCustomProvider(msg.config); break
    case "deleteProviderKey": await panel._deleteProviderKey(msg.name); break
    case "saveMcpServer": await panel._saveMcpServer(msg.name, msg.config); panel._pushMcpStatus(); break
    case "deleteMcpServer": await panel._deleteMcpServer(msg.name); panel._pushMcpStatus(); break
    // MCP.md §4 F5/D-4：reconnectMcp（既有死按钮修复——webview 已在发此消息，路由拆分时
    // 丢失）+ edit/test（CLI /mcp edit/test parity，交互随面板惯例）。
    case "reconnectMcp": await panel._reconnectMcp(msg.name); break
    case "editMcp": panel._editMcp(msg.name, msg.config ?? {}); break
    case "testMcp": await panel._testMcp(msg.name); break
    case "addProvider":
      // Payload form (settings panel [+ Add] form): persist directly.
      // No payload (model dropdown shortcut): interactive QuickPick flow.
      if (msg.preset || msg.custom) {
        const err = handleAddProvider({ preset: msg.preset, custom: msg.custom, key: msg.key })
        if (err) {
          panel._panel?.webview.postMessage({ type: "providerError", text: err })
          panel._pushSettings()
          break
        }
        panel._pushSettings()
        // M9 渠道准入（配置写入面）：加渠道后探一次 GET /models——探通则候选可用；探不通
        // 界面明示失败消息（消息本体逐字长句）+ 行内标「不可用」（**不阻断保存**——条目已
        // 落盘；探针失败不缓存，下次配置动作重探）。
        const name = msg.custom?.name || msg.preset
        if (name) {
          const probe = await probeProviderAdmission(name)
          if (!probe.ok) {
            panel._panel?.webview.postMessage({ type: "providerError", text: probe.error })
            panel._pushStatus() // 准入展示态刚更新——状态行重推（行内标 `不可用`）
          }
        }
      } else {
        await addProviderFlow(() => panel._pushSettings())
      }
      break
    case "removeProvider":
      if (msg.name) {
        const err = handleRemoveProvider(msg.name)
        if (err) panel._panel?.webview.postMessage({ type: "providerError", text: err })
        panel._pushSettings()
      } else {
        await removeProviderFlow(() => panel._pushSettings())
      }
      break
    case "setProviderProxy": {
      handleSetProviderProxy(msg.name, msg.proxy === true)
      panel._pushSettingsLight()
      break
    }
    case "setKey": await setKeyFlow(() => panel._pushSettings()); break
    case "saveEmbeddingConfig": await panel._saveEmbeddingConfig(msg.config); break
    case "saveEmbedKey": await panel._saveEmbeddingConfig({ apiKey: msg.key }); break
    case "deleteEmbedKey": await panel._saveEmbeddingConfig({ apiKey: "" }); break
    case "saveWebsearchKey": saveWebsearchKeyFromPanel(msg.key); panel._pushSettingsLight(); break
    case "deleteWebsearchKey": deleteWebsearchKeyFromPanel(); panel._pushSettingsLight(); break
    case "testProvider": {
      // M1 三 format 分派：format 随表单透传（anthropic/google 与 openai 端点/头不同）
      const r = await testProviderConnection({ baseURL: msg.baseURL, apiKey: msg.apiKey, format: msg.format })
      panel._panel?.webview.postMessage({ type: "testProviderResult", ...r })
      break
    }
    case "buildIndex": await panel._buildIndex(); break
    case "getMcpStatus": panel._pushMcpStatus(); break
    case "mcpTools": {
      // Probe/expand: connect (idempotent — reuses the live connection) and return the
      // tool list for the settings panel's per-server expander.
      try {
        const { mcpConnect } = await import("./panel-mcp.mjs")
        const servers = loadMcpServers()
        const cfg = servers.find((x) => x.name === msg.name)
        if (!cfg) throw new Error(`no MCP server named "${msg.name}"`)
        const r = await mcpConnect(cfg)
        panel._panel?.webview.postMessage({ type: "mcpTools", name: msg.name, tools: r.tools })
      } catch (e) {
        panel._panel?.webview.postMessage({ type: "mcpTools", name: msg.name, error: e?.message ?? String(e) })
      }
      break
    }
    case "saveAgentSettings": {
      saveAgentSettingsFromPanel(msg.settings ?? {})
      panel._pushSettingsLight()
      break
    }
    case "getAgentSettings": panel._panel?.webview.postMessage({ type: "agentSettings", settings: agentSettings(panel._agentSettingsSession?.() ?? null) }); break
    case "webviewReady": {
      // The webview finished loading — now it's safe to push initial state.
      // resolveWebviewView pushed i18n right after setting webview.html, which
      // races the async load and is DROPPED on Reload Window (labels showed raw
      // keys like "msg.user"). Re-push here, plus the settings the toolbar needs.
      // providerStatus rides along (2026-09-05 真机走查：它同样经 async status()
      // 推送——Reload Window 竞态会丢——欢迎条两态文案/配置横幅随之失配——
      // webviewReady 是唯一可靠握手点——i18n 同机制）。
      // C2（F-C2b）：忙态随握手重推（Reload Window 后 webview 冷启为 idle——正在执行的
      // 回合/挂起会话的派生态（Stop/thinking）需以此恢复——单一广播的幂等直发）。
      // 2026-09-11 第 10 批（§5.1.4 第 1 条）：_wvReady 开闩——任务可见性族消息自此直投
      // （此前投递入队——暗窗口零丢失）。
      panel._wvReady = true
      panel._panel?.webview.postMessage({ type: "turnState", state: panel._turnState ?? "idle", ...(panel._susp ? { counts: backgroundStatus(panel._susp.lines.history) } : {}) })
      panel._panel?.webview.postMessage({ type: "i18n", strings: loadLocaleStrings(vscode.env.language) })
      panel._panel?.webview.postMessage({ type: "agentSettings", settings: agentSettings(panel._agentSettingsSession?.() ?? null) })
      panel._pushStatus()
      // B2（SESSION-FLOW-B F-B2a/F-B2b——2026-09-09）：握手后接快段 openSessionContent——
      // 会话打开**单向 boot**：内容（pushProject → loadSession 内部序 autoApprove → planMode
      // → clearMessages → historyPage → sessions）只在 webviewReady 后落定——resolve 期
      // webview 未加载，此刻发内容即丢（Reload 后对话区空缺陷的静态根因）。sessions 同
      // tick 恰一次（N2——loadSession 尾单发——F-B2c——异步第三发在 status() 慢段 fullStatus
      // cb——不同 tick 保留）。槽绑定随之顺延至此——webviewReady 前无 slot 读者（安全）。
      openSessionContent(panel)
      // 2026-09-11 第 10 批（§5.1.4 第 2 条——两拍，排在 openSessionContent 之后）：
      // ① flush 暗窗口队列（保持入队序）→ ② 再断言存活（存活投影——只发 running/queued）。
      // 后置理由：openSessionContent 内部含 clearMessages（抹块 + resetActivity 清簿记）——
      // 先投的出生事件必被清屏抹掉；两拍后块恒落流尾。序固定：flush 终态先落，再补活着——
      // 投影本不含已终态者，故不重复。
      flushSubagentOutbox(panel)
      reassertLiveChildren(panel)
      pushLedgerStartup(panel) // LEDGER-SURFACE：启动行（会话内容落定后——不被 clearMessages 抹掉；不可动作零 post）
      break
    }
    case "setAdvisorGuard": {
      // Slot first (session-level authority, 2026-08-29), then the config.json mirror
      // (CLI compat). A slot write failure must not block the config write.
      try { setSlotAdvisorGuard(_cwd(), panel._ensureSlot(), !!msg.value) } catch {}
      saveAgentSettingsFromPanel({ advisor: { guard: !!msg.value } })
      panel._pushSettingsLight()
      break
    }
    case "setEngineeringEnabled": {
      // Same dual-write contract as setAdvisorGuard above: slot authority + config mirror.
      try { setSlotEngineering(_cwd(), panel._ensureSlot(), !!msg.value) } catch {}
      saveAgentSettingsFromPanel({ engineering: !!msg.value })
      panel._pushSettingsLight()
      break
    }
    case "setPlanMode": {
      await panel._setPlanMode(!!msg.value)
      break
    }
    case "getShellCandidates": panel._panel?.webview.postMessage({ type: "shellCandidates", candidates: shellCandidates(), current: loadRaw().shell ?? null }); break
    case "saveShellSettings": {
      saveShellSettingsFromPanel(msg.value)
      panel._pushSettingsLight()
      break
    }
    case "saveProxySettings": {
      saveProxySettingsFromPanel(msg.settings ?? {})
      panel._pushSettingsLight()
      break
    }
    case "testProxy": {
      const result = await testProxyConnection(msg.uri)
      panel._panel?.webview.postMessage({ type: "proxyTestResult", result })
      break
    }
  }
}
