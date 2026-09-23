/**
 * chat-messages.js — host → webview 消息分发循环（2026-09-22 structure-debt §2.4 · #163）：
 * 自 chat.js 迁出 `window.addEventListener("message", …)` 整块（switch 分发单表）——块体逐字
 * 搬移（仅缩进）；**注册仍在 chat.js 现址**（D-C1：本档零副作用注册——只导出 initMessageLoop，
 * 由 chat.js 在原址显式调用以保注册时刻与顺序）。
 * deps = 闭包实需面（settings 解构 13 键 + showAtDropdown + dismissLoadingScreenOnce +
 * _loadingTimeout）；其余协作面（ui / streaming / panels / … 与 chat-status 四函数）本档直接 import。
 */
import { ctx, S } from "./state.js"
import {
  showWelcome, updateWelcomeStatus, showBanner, addUser,
  addTool, finishTool, showError, maybeScrollDown, advisorRoundTag,
} from "./ui.js"
import { setLoading, applyBusyLock } from "./loading.js"
import { MAX_TOOL_OUTPUT } from "./lib.js"
import { setStrings, t } from "./i18n.js"
import { applyI18nToDOM } from "./i18n-dom.js"
import { onToken, onReasoning, onTurnBreak, finish, subagentChunk } from "./streaming.js"
import { resetActivity, applySubagentApproval } from "./activity.js"
import { renderStatusBar, handleUsageMessage } from "./status-bar.js"
import { handleTaskProgress, handleSubagentMessage, handleGoalMessage, handleSuspensionMessage, handleTurnStateMessage } from "./panels.js"
import { updateSessionTitle, handleProjectMessage } from "./session-bar.js"
import { showWelcomePanel, maybeShowWelcome } from "./onboarding.js"
import { handleAutoApprove, handleAgentSettings, handlePlanMode } from "./mode-buttons.js"
import { handleModelsMessage } from "./model-picker.js"
import { showQuestion } from "./question.js"
import { showPermissionRequest, showBatchPermissionRequest } from "./permission.js"
import { addLedgerNotice } from "./ledger-line.js"
import { applyHistoryPage } from "./history.js"
import { clearStatusText, handleStatusText, showCompressStatus, showDigestStatus } from "./chat-status.js"
// C-B2-6 细则⑦（queue-visible 批 2026-09-24）：排队「待发送」标记面（逐条标记 / 消费即清 / 多批合泡）
import { applyBusyQueued } from "./queued-mark.js"

/** host → webview 分发循环（分发单表 = 本函数体——协议机检提取对象，D-C2 不拆族）。
 *  @param {{ renderMcpList: Function, updateMcpTools: Function, updateMcpTestResult: Function,
 *            updateIndexStatus: Function, updateProviderStatus: Function, updateAgentSettings: Function,
 *            notifyAgentSettingsRefreshed: Function, updateWebsearchSettings: Function,
 *            updateTestProviderResult: Function, updateShellCandidates: Function,
 *            updateProxySettings: Function, updateProxyTestResult: Function, showSettingsError: Function,
 *            showAtDropdown: Function, dismissLoadingScreenOnce: Function, _loadingTimeout: any }} deps */
export function initMessageLoop(deps) {
  const {
    renderMcpList, updateMcpTools, updateMcpTestResult, updateIndexStatus, updateProviderStatus,
    updateAgentSettings, notifyAgentSettingsRefreshed, updateWebsearchSettings, updateTestProviderResult,
    updateShellCandidates, updateProxySettings, updateProxyTestResult, showSettingsError,
    showAtDropdown, dismissLoadingScreenOnce, _loadingTimeout,
  } = deps
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
      // 无工作区守卫（2026-09-21 批 · `PROJECT-SWITCHER.md` §4.1）：host 守卫态镜像 ⇒
      // 占位符第三态（拒发出口守卫单源 = send.js）
      case "workspaceGuard":   S._workspaceRequired = m.active === true; applyBusyLock(); break
      // C-B2-6 细则①⑦（busy-injection fix 轮 2026-09-22 · queue-visible 批 2026-09-24）：host 队列快照
      // （`busyQueued { pending, count, items, text, merged }`）⇒ 镜像（守卫判据源）+「待发送」气泡面
      case "busyQueued":       applyBusyQueued(ctx, S, m); break
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
}
