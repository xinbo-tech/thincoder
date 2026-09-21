/**
 * panel-messages.mjs — ChatPanel webview message router (split out of chat-panel.mjs).
 * Every `case` dispatches to a ChatPanel method or a settings/provider helper.
 */
import * as vscode from "vscode"
import { loadLocaleStrings } from "../i18n.mjs"
import { saveModelPrefs, loadSlot } from "./session-io.mjs"
import { agentSettings } from "./settings.mjs"
import { openSessionContent } from "./panel-session.mjs"
// B2（SESSION-FLOW-B——2026-09-09）：panel-messages ↔ panel-session 环 import（panel-session
// 头部 import 本文件 _cwd）——openSessionContent 只在 webviewReady case 函数体内使用（延迟
// 解引用）——环安全（两模块均无顶层跨环读取）。
// D-3（VSC-DEBT 批 7）：会话族六 case（newSession/switchSession/deleteSession/renameSession/
// setProject/loadOlder）handler 迁出至 panel-messages-session.mjs——分发表仍按同名 case 标签
// 分发（缝保持：本档既有导出与调用点零改）。环 import 同 B2 形态（该档回 import 本档 `_cwd`
// ——仅在该档 handler 体内解引用——两模块均无顶层跨环读取——环安全）。
import { handleNewSession, handleSwitchSession, handleDeleteSession, handleRenameSession, handleSetProject, handleLoadOlder } from "./panel-messages-session.mjs"
// 四档拆分批（2026-09-18 · VSC-DEBT §12.2.2）：回合交互族 10 case / 设置族 28 case 的 handler 迁出
// ——本档分发表按**同名 case 标签**转发行分发（case 标签集合零变化；两新档名带 `panel-messages`
// 前缀以落在 reverse 机检的 `HOST_DISPATCH` 扫描域内）。
import { handleAbort, handleCancelSubagent, handleInterrupt, handleOpenFile, handleOpenDiff, handleQuestionResponse, handleSetAutoApprove, handleAtComplete, handlePermissionResponse, handleBatchPermissionResponse } from "./panel-messages-turn.mjs"
import { handleSaveProviderKey, handleDeleteProviderKey, handleSaveMcpServer, handleDeleteMcpServer, handleReconnectMcp, handleEditMcp, handleTestMcp, handleAddProvider, handleRemoveProvider, handleSetProviderProxy, handleSetKey, handleSaveEmbedKey, handleDeleteEmbedKey, handleSaveWebsearchKey, handleDeleteWebsearchKey, handleTestProvider, handleBuildIndex, handleGetMcpStatus, handleMcpTools, handleSaveAgentSettings, handleGetAgentSettings, handleSetAdvisorGuard, handleSetEngineeringEnabled, handleSetPlanMode, handleGetShellCandidates, handleSaveShellSettings, handleSaveProxySettings, handleTestProxy } from "./panel-messages-settings.mjs"
// C-B2-6 细则⑥（busy-injection 批 fix 轮 2026-09-22）：F-1 降级判决函数已迁 `image-handler.mjs`
// ——本档只留触发（`downgradeNonVisionImages` + `visionReader` per-call 缝）。
import { savePastedImages, downgradeNonVisionImages } from "./image-handler.mjs"
import { logEvent } from "@thincoder/core/log.mjs"
import { backgroundStatus, reassertLiveChildren } from "./suspension.mjs"
// 无工作区守卫（2026-09-21 批 · `PROJECT-SWITCHER.md` §4.1）：② 回合入口守卫（leaf——无环）
import { blockOnNoWorkspace } from "./workspace-guard.mjs"
// 2026-09-11 第 10 批（§5.1.4 第 1/2 条）：任务可见性族投递通道（队列 flush 拍——webviewReady case）
// （W15 事件中继面 + §18 C-5/C-6 permissionResponse 释放面随回合交互族迁出——见 panel-messages-turn.mjs）
import { flushSubagentOutbox } from "./panel-callbacks.mjs"
// LEDGER-SURFACE（§2.30.3.5）：台账启动行投递（webviewReady 时机）
import { pushLedgerStartup } from "./ledger-surface.mjs"

/** Current workspace folder (or process cwd) — shared with chat-panel. */
let _cwdOverride = null
export const _cwd = () => _cwdOverride ?? (vscode.workspace.workspaceFolders?.[0]?.uri?.fsPath || process.cwd())

// ─── 出生自愈心跳（D-W20/D-W21——§5.3）──────────────────────────────
// 拍体 = `reassertLiveChildren` 本体（单一存活投影）；起 = `webviewReady` case；止 = panel dispose。
// 两前置：未就绪不拍（不向队列堆重复出生事件）；空拍零留痕（n 变化即记 + 每 30 拍兜底）。
export const LIVE_HEARTBEAT_MS = 2000
const _heartbeats = new WeakMap() // panel → interval 句柄
const _hbState = new WeakMap() // panel → { beats, last }

/** 单拍（返回本拍重发条数——测试直驱面）。 */
export function liveHeartbeatBeat(panel) {
  if (panel._wvReady !== true) return 0 // 未就绪：就绪拍已覆盖该窗口——不堆事件
  const n = reassertLiveChildren(panel)
  const s = _hbState.get(panel) ?? { beats: 0, last: -1 }
  _hbState.set(panel, s)
  s.beats += 1
  if ((n > 0 && n !== s.last) || s.beats % 30 === 0) logEvent("ev:subreassert", { n, beats: s.beats })
  s.last = n
  return n
}

/** 起拍（幂等：同面板单拍）/ 停拍（panel dispose）。 */
export function startLiveHeartbeat(panel) {
  if (_heartbeats.has(panel)) return _heartbeats.get(panel)
  const timer = setInterval(() => liveHeartbeatBeat(panel), LIVE_HEARTBEAT_MS)
  timer.unref?.() // 不阻进程退出
  _heartbeats.set(panel, timer)
  return timer
}

export function stopLiveHeartbeat(panel) {
  const timer = _heartbeats.get(panel)
  if (!timer) return
  clearInterval(timer)
  _heartbeats.delete(panel)
}

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
 * C-B2-6 细则①（busy-injection 批 fix 轮 2026-09-22）：busy 排队单槽未消费态镜像推送——
 * webview 二次提交守卫判据源（`busyQueued { pending }`；判据 = host 单槽实际占用，权威面）。
 * 推送点 = 入槽 / 忙分支判决 / 消费两分支（`panel-turn-stages.mjs` 装载①②）/ `webviewReady`
 * 握手重推（Reload 冷启重同步）。`{ pending }` 值恒 = 单槽实况（非事件——重推幂等）。
 */
export function pushBusyQueued(panel) {
  panel._panel?.webview.postMessage({ type: "busyQueued", pending: (panel._busyQueued?.length ?? 0) > 0 })
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
  // ② 无工作区守卫（**先于** busy 与 `savePastedImages`——图片不落 `<cwd>/.thincoder/tmp/`）：
  // webview 发消息 / retry 共用本入口 ⇒ 无文件夹窗口里一律拒（提示明示——不静默丢）。
  if (blockOnNoWorkspace(panel)) return
  // INPUT-LOCK-ASYNC（C'——2026-09-09——F-1/F-3）→ C-B2-6 busy 排队注入（busy-injection
  // 2026-09-21）：busy（`_turnState === "running"`——回合含 digest/标题窗口——单一判据）分流两态——
  //   ① 挂起会话内 busy（`panel._susp` 在场——digest / 会话内用户回合）：拒收不排队
  //      （C-B2-4 收窄后仅存面）——提示明示（不静默丢）；
  //   ② 普通回合 busy 面（无会话）：入 `_busyQueued` 单槽（C-B2-6；槽满 = 拒收 + 提示，
  //      槽内既有不被覆盖）——回合尾由 `enterSuspensionTurn` 装载两分支送达。
  // susp 等待态（纯后台池跑——主空闲）→ _chat 上游分流（pendingInput 单槽——D-S5 唤醒）；idle 直发。
  if (panel._turnState === "running") {
    if (panel._susp || (panel._busyQueued?.length ?? 0) > 0) {
      pushBusyQueued(panel) // C-B2-6 细则①：判决后推实际占用（拒收 ⇒ 槽内实况——webview 镜像权威收敛）
      vscode.window.showWarningMessage("ThinCoder: a task is running — wait for it to finish before sending.")
      return
    }
    const busySaved = Array.isArray(images) && images.length > 0 ? savePastedImages(images, _cwd()) : undefined
    // 入槽项携来源标记（`fromBusyQueue`——装载① `runTurn` 闭包据此只对排队支降级，纯挂起既有
    // 路径零改）与 `visionReader` per-call 缝（C-B2-6 细则⑥：送达侧判决与 idle 面同判定同注入形态）。
    ;(panel._busyQueued ??= []).push({ text, modelOverride, reasoning, providerName, images: busySaved, fromBusyQueue: true, visionReader })
    pushBusyQueued(panel) // 入槽 ⇒ pending:true（受理即反馈——webview 二次提交守卫判据源）
    return
  }
  // Plan B (GitHub thincoder#3): the webview sends pasted images as base64
  // dataURLs; the EXTENSION saves them to <cwd>/.thincoder/tmp/paste-*.<ext>
  // and passes absolute PATHS downstream. The field stays `images` (wire
  // compat), but from here on it carries paths — setupAgentRun appends the
  // "[Attached images: ...]" pointer and the model views them via read_image.
  // F-1（IMAGE-DOWNGRADE-VISION——2026-09-09——评审 #1 定稿 appendImagePointer 零动）：本入口 =
  // depth-0 主回合面——非视觉主模型贴图（webview echo）→ 视觉渠道一次性子代理读图（成功：描述
  // 注入 text（[图片 <路径> 描述: <描述>]）+ images 清空；无渠道/spawn 失败/超时/空返/异常 → 原样
  // 下发（主回合 setup 现报错文案——可读不静默丢）。susp 等待态不降级（排队回合走现路径——
  // depth>0 子代理无此入口——边界明示）。
  // C-B2-6 细则⑥（2026-09-22 fix 轮）：判决 / 读图 / 忙锁（await 窗前先置 running）已抽入
  // `image-handler.mjs` 的 `downgradeNonVisionImages`（三调用点共用同一判定——本调用点保留
  // `_turnState !== "susp"` 门）。
  let saved = Array.isArray(images) && images.length > 0
    ? savePastedImages(images, _cwd())
    : undefined
  let visionAbort = null
  if (saved?.length && modelOverride && panel._turnState !== "susp") {
    const d = await downgradeNonVisionImages(panel, { text, images: saved, providerName, modelOverride, cwd: _cwd(), visionReader })
    text = d.text
    saved = d.images
    visionAbort = d.visionAbort
  }
  // C-B2-6 细则①（fix 轮收敛补全——判据源不变式「host 推送权威收敛」不留死角）：归位受理
  // 路径同推槽内实况（幂等——正常槽空 ⇒ `pending:false`；有残项 ⇒ `true`）。补因：webview
  // 镜像在提交受理时本地先行置位，若该消息落归位路径（镜像仍 running 而 host 已归位）则
  // 入库路零推送 ⇒ 镜像黏滞 true——后续 busy 期提交被守卫误拒至 Reload（窄竞态）。
  pushBusyQueued(panel)
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
    case "queuedUserMessage":
      // C-B2-6（busy-injection 2026-09-21）：普通回合 busy 面排队上行——同入口同判据同槽
      // （webview 本地气泡已先行上屏；此处只做 host 侧单槽装载——送达由回合尾装载两分支）。
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
          // F-MI7 空槽短路（§6.15 零探测冷路径）：未解析窗口 ⇒ 跳过槽写——prefs 已写 ✓，
          // 会话槽的 activeProvider/activeModel 播种随下次 ensureSlot 收敛后经 saveLines 落盘。
          if (slot == null) break
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
    // 会话族（D-3 迁出——handler 住 panel-messages-session.mjs；case 标签与分发零改——缝保持）
    case "newSession": await handleNewSession(panel); break
    case "switchSession": await handleSwitchSession(panel, msg); break
    case "deleteSession": await handleDeleteSession(panel, msg); break
    case "renameSession": await handleRenameSession(panel, msg); break
    case "setProject": await handleSetProject(panel, msg); break
    case "retry": {
      // C1（F-C1e——H-F）+ INPUT-LOCK（C'）：retry 与 userMessage 同入口（routeUserTurn）——
      // 回合中（running）retry 不再直开并发回合（拒收提示——禁排队）；idle/susp 直发。
      const history = panel._activeHistory()
      const lastUser = [...history].reverse().find((m) => (m.type ?? m.role) === "user")
      if (lastUser) routeUserTurn(panel, { text: lastUser.content, modelOverride: undefined, reasoning: undefined, providerName: lastUser.provider })
      break
    }
    // 回合交互族（本批迁出——handler 住 panel-messages-turn.mjs；case 标签与分发零改——缝保持）
    case "abort": handleAbort(panel); break
    case "cancelSubagent": await handleCancelSubagent(panel, msg); break
    case "interrupt": handleInterrupt(panel, msg); break
    case "openFile": await handleOpenFile(panel, msg); break
    case "openDiff": await handleOpenDiff(panel, msg); break
    case "loadOlder": await handleLoadOlder(panel, msg); break
    case "questionResponse": handleQuestionResponse(panel, msg); break
    case "setAutoApprove": await handleSetAutoApprove(panel, msg); break
    case "atComplete": await handleAtComplete(panel, msg); break
    case "permissionResponse": await handlePermissionResponse(panel, msg); break
    case "batchPermissionResponse": handleBatchPermissionResponse(panel, msg); break
    // 设置族（本批迁出——handler 住 panel-messages-settings.mjs；case 标签与分发零改——缝保持）
    case "saveProviderKey": await handleSaveProviderKey(panel, msg); break
    case "deleteProviderKey": await handleDeleteProviderKey(panel, msg); break
    case "saveMcpServer": await handleSaveMcpServer(panel, msg); break
    case "deleteMcpServer": await handleDeleteMcpServer(panel, msg); break
    case "reconnectMcp": await handleReconnectMcp(panel, msg); break
    case "editMcp": handleEditMcp(panel, msg); break
    case "testMcp": await handleTestMcp(panel, msg); break
    case "addProvider": await handleAddProvider(panel, msg); break
    case "removeProvider": await handleRemoveProvider(panel, msg); break
    case "setProviderProxy": handleSetProviderProxy(panel, msg); break
    case "setKey": await handleSetKey(panel); break
    case "saveEmbedKey": await handleSaveEmbedKey(panel, msg); break
    case "deleteEmbedKey": await handleDeleteEmbedKey(panel); break
    case "saveWebsearchKey": handleSaveWebsearchKey(panel, msg); break
    case "deleteWebsearchKey": handleDeleteWebsearchKey(panel); break
    case "testProvider": await handleTestProvider(panel, msg); break
    case "buildIndex": await handleBuildIndex(panel); break
    case "getMcpStatus": handleGetMcpStatus(panel); break
    case "mcpTools": await handleMcpTools(panel, msg); break
    case "saveAgentSettings": handleSaveAgentSettings(panel, msg); break
    case "getAgentSettings": await handleGetAgentSettings(panel); break
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
      pushBusyQueued(panel) // C-B2-6 细则①：Reload 冷启握手重同步（单槽未消费态镜像——对位 workspaceGuard 先例；排四件握手之后——交握序列零改）
      // B2（SESSION-FLOW-B F-B2a/F-B2b——2026-09-09）：握手后接快段 openSessionContent——
      // 会话打开**单向 boot**：内容（pushProject → loadSession 内部序 autoApprove → planMode
      // → clearMessages → historyPage → sessions）只在 webviewReady 后落定——resolve 期
      // webview 未加载，此刻发内容即丢（Reload 后对话区空缺陷的静态根因）。sessions 同
      // tick 恰一次（N2——loadSession 尾单发——F-B2c——异步第三发在 status() 慢段 fullStatus
      // cb——不同 tick 保留）。槽绑定随之顺延至此——webviewReady 前无 slot 读者（安全）。
      // F-MI7：快段 = async（认领束 awaited——本 case 已 async ✓）
      await openSessionContent(panel)
      // 2026-09-11 第 10 批（§5.1.4 第 2 条——两拍，排在 openSessionContent 之后）：
      // ① flush 暗窗口队列（保持入队序）→ ② 再断言存活（存活投影——只发 running/queued）。
      // 后置理由：openSessionContent 内部含 clearMessages（抹块 + resetActivity 清簿记）——
      // 先投的出生事件必被清屏抹掉；两拍后块恒落流尾。序固定：flush 终态先落，再补活着——
      // 投影本不含已终态者，故不重复。
      flushSubagentOutbox(panel)
      reassertLiveChildren(panel)
      startLiveHeartbeat(panel) // 出生自愈心跳起拍（D-W20——止于 panel dispose）
      pushLedgerStartup(panel) // LEDGER-SURFACE：启动行（会话内容落定后——不被 clearMessages 抹掉；不可动作零 post）
      break
    }
    case "panelDiag": {
      // §3.2 行 8（webview → host 诊断上行）：痕迹批 → 主侧日志一行（`ev:subtrace`——NFR-A2：与
      // `ev:subdeliver` 合读「host 投了没 × webview 收了做什么」）。
      const entries = Array.isArray(msg.entries) ? msg.entries : []
      logEvent("ev:subtrace", {
        kind: msg.kind ?? null,
        n: entries.length,
        kinds: [...new Set(entries.map((e) => e?.kind).filter(Boolean))].join(","),
        ch: entries.map((e) => e?.channel).filter(Boolean).slice(-3).join(","),
      })
      break
    }
    case "setAdvisorGuard": handleSetAdvisorGuard(panel, msg); break
    case "setEngineeringEnabled": handleSetEngineeringEnabled(panel, msg); break
    case "setPlanMode": await handleSetPlanMode(panel, msg); break
    case "getShellCandidates": await handleGetShellCandidates(panel); break
    case "saveShellSettings": handleSaveShellSettings(panel, msg); break
    case "saveProxySettings": handleSaveProxySettings(panel, msg); break
    case "testProxy": await handleTestProxy(panel, msg); break
  }
}
