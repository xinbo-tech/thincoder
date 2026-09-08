/**
 * panel-chat.mjs — ChatPanel chat turn runner (split out of chat-panel.mjs).
 * Resolves the provider, loads the dual history lines, runs the agent with
 * streaming callbacks, persists the lines on complete.
 * §17 (2026-09-02，AGENT-LOOP.md §17 D-S1..S9): a turn ending with the async pool
 * still live enters the suspension session (suspension.mjs) — input stays usable,
 * settles drive auto-turn digests (manual tier organize-only / AUTO full semantics),
 * pool-empty + no queued input exits naturally back to idle. Digests are plain
 * runPanelChat turns with autoTurn: true inside the session.
 * §17 偏差修复（2026-09-02 #2/#3）: 挂起入口在 finally 先于任何释放点登记（_suspPending——
 * 关闭 generateTitle 释放窗口的并发新回合）；控制器重建全部登记（_turnControllers →
 * 会话统一 abort）。
 */
import * as vscode from "vscode"
import { resolveProviders } from "../config-io.mjs"
import { providerNames, getKey, buildProvider } from "./presets.mjs"
import { saveModelPrefs } from "./session-io.mjs"
import { ensureSlot } from "./panel-session.mjs"
import { specForModel } from "../specs.mjs"
import { runAgent, ContinueError } from "../agent.mjs"
import { getMcpServers } from "./settings.mjs"
import { loadSkills } from "./skills.mjs"
import { collectEditorInjection } from "./editor-context.mjs"
import { injectAtRefs } from "./file-refs.mjs"
import { traceStop } from "./stop-trace.mjs"
import { resolveReasoningMode } from "./reasoning-mode.mjs"
import { t } from "../i18n.mjs"
import { _cwd } from "./panel-messages.mjs"
import { suspensionSession, poolLive, popQueuedTurn, buildMergedMessage, mergeTransportFor } from "./suspension.mjs"
import { logEvent, errText } from "../log.mjs"
// 2026-09-05 实践轮 module-split：回调工厂迁 panel-callbacks.mjs（webview 桥接面独立决策）
import { buildPanelCallbacks, makeAskInPanel } from "./panel-callbacks.mjs"

/** §17 D-S9 controller 登记（2026-09-02 偏差修复 #3）：池 children 在 spawn 时刻持有当时的
 * turn controller signal——Ctrl+I / ContinueError / AUTO resume 重建 controller 后，旧
 * controller 的 children 仍在跑。每次重建都登记进 panel._turnControllers：会话入口快照为
 * susp.abortControllers，Stop 统一 abort——否则会话中止句柄只取最后一个 controller，旧
 * children 逃逸中止（跑完整个 turn 预算 + mergeChildMutations 写入 guard 标记被下次重建
 * 清掉——用户以为全停但磁盘仍被改写、advisor/verify 门被绕过）。
 * C1（SESSION-FLOW-C F-C1b——abort 启动闩——修 H-C——评审 #1 消费即复位）：Startup 窗口
 * （回合起点后、本 controller 建立前的 await 段——prevDistill/provider 解析可达秒级）内
 * 到达的 abort/interrupt 无活 controller 可交付（router 侧交付无效才置闩）——置位则新建
 * controller 立即 abort 并复位闩（防下次正常回合被误杀）。运行中交付的 abort/interrupt
 * 不置闩（交付即生效）——本消费点对中断续跑重建（runTurnLoop 内 interrupt/ContinueError
 * 路径）恒 no-op，Ctrl+I 续跑不受影响。
 * 导出——chat-panel.test.mjs 桩面板直测闩消费（C1 组③）。 */
export function newTurnController(panel) {
  const c = new AbortController()
  ;(panel._turnControllers ??= []).push(c)
  panel._abortController = c
  if (panel._abortRequested) {
    panel._abortRequested = false
    c.abort()
  }
  return c
}

/** §11 绑定判定（AGENT-LOOP.md §11——纯函数，单测锚点）：agent 仅在其 _engPersist 绑定的
 *  cwd×slot 与当前面板会话一致时可复用（同 cwd 同 slot 第二轮 → 复用不销毁——AC1；换 slot/
 *  换项目 → 不匹配 → 销毁重建——AC4/F4——不跨会话串态）。 */
export function agentSlotMatches(agent, cwd, slot) {
  const p = agent?._engPersist
  return !!(p && p.cwd === cwd && p.slot === slot)
}

/** §11 ensurePanelAgent（runPanelChatImpl ensureSlot 后调用）：绑定匹配 → 复用；否则销毁
 *  （panel._agent = null——内存态随对象回收，槽文件仍权威）。销毁后由本回合 runAgent 的
 *  factory 路径新建（首轮/destroy 重建同路径——hydrate 含 §11.2.1 槽字段回填）。返回当前
 *  agent（复用对象或 null——供调用方/runOpts 引用）。 */
export function ensurePanelAgent(panel, turnSlot) {
  if (panel._agent && !agentSlotMatches(panel._agent, _cwd(), turnSlot)) panel._agent = null
  return panel._agent
}

/**
 * LOGGING（docs/design/LOGGING.md——CLI agent-turn.mjs parity）包装：回合骨架事件
 * （turn:start/turn:end——kind user/auto；result ok/stopped/error）。turn:start 在
 * provider 解析通过后、执行循环前发射（面板缺失/未配置 provider 等早退路径不产生伪
 * 回合事件）；内层经 opts._logOutcome 载具回传终止原因（Stop/ContinueError 拒绝/错误
 * vs 正常完成）——嵌套回合（digest/挂起会话内回合）各自独立载具。err:internal = 逃出
 * 内层的未分类异常。
 */
export async function runPanelChat(panel, opts = {}) {
  const kind = opts?.autoTurn ? "auto" : "user"
  const runOpts = { ...(opts ?? {}) }
  delete runOpts._logOutcome
  const marker = { started: false }
  runOpts._logOutcome = marker
  const t0 = Date.now()
  try {
    return await runPanelChatImpl(panel, runOpts)
  } catch (e) {
    if (marker.started) marker.result = marker.result ?? "error"
    logEvent("err:internal", { msg: errText(e, 200), where: "runPanelChat" })
    throw e
  } finally {
    if (marker.started) logEvent("turn:end", { kind, ms: Date.now() - t0, result: marker.result ?? "ok" })
  }
}

/** runPanelChat 本体（LOGGING 包装之外——见上方 runPanelChat 包装器）。 */
async function runPanelChatImpl(panel, opts = {}) {
  let { text, modelOverride, reasoning, providerName, images, autoTurn = false, susp = null, skipSession = false } = opts
  if (!panel._panel) { vscode.window.showErrorMessage("_chat: panel is null"); return }

  // C1（SESSION-FLOW-C F-C1b——abort 启动闩——修 H-C）：回合起点（任何 await 之前）清闩 +
  // 清上回合僵尸 controller（abort + 置 null + 清登记）。僵尸清理原在下方 controller 建立
  // 前（原 215 行 if(!susp) 块）——上移等价安全：非 susp 回合只能启动于池空/无会话时（释放
  // 窗口守卫 _suspPending——偏差修复 #2——池 children 不持有上回合 controller）；会话
  // （susp）内回合不动会话句柄（susp.abort = 进入回合 controller——digest Stop 不得杀池）。
  // 清理后启动窗口内 router 的 abort/interrupt 无活 controller 可交付 → 记闩
  // _abortRequested → 下方 newTurnController 消费（立即 abort 新建 controller + 复位闩）。
  // 陈旧闩（空闲/双击竞态等交付过活 controller 后又置位的边缘）随本行清——防误杀下次
  // 正常回合（回归：Startup 窗口 abort 后下次正常回合干净启动）。
  if (!susp) {
    panel._abortController?.abort()
    panel._abortController = null
    panel._turnControllers = []
  }
  panel._abortRequested = false

  // 交付评审 🔴#1（2026-08-28）：turn 启动的守卫标志与槽绑定必须发生在任何 await 之前——
  // 否则启动窗口内（provider 解析 / await prevDistill，可达秒级）的会话切换会绕过守卫、
  // turnSlot 捕获切换后的槽，"内容落错槽"仍可复现。finally 统一清标志（覆盖全部提前 return）。
  // ensureSlot（而非裸读 _slot）：首次 turn 可能先于 status() 解析（面板命令直呼 _chat），
  // 裸读会把 null 冻进 distillSlot、使 onDistilled 的槽守卫恒拒绝（AC5 回归）。
  panel._turnActive = true
  const turnSlot = susp?.turnSlot ?? ensureSlot(panel)
  // §11（AGENT-LOOP.md §11——2026-09-08）：会话级顶层 agent 单例——ensureSlot 后绑定判定：
  // 存在且 _engPersist cwd×slot 匹配 → 复用（同 panel 连续多回合同一对象——AC1）；否则销毁，
  // 本回合 runAgent 经 opts.agent 缺省路径 factory 新建（首轮/换槽/destroy 重建同路径）。
  ensurePanelAgent(panel, turnSlot)
  const distillSlot = turnSlot
  const suspLines = susp?.lines ?? null // suspension turns keep the LIVE lines (pool/pending ride them)
  let isFirstMessage // assigned inside the try (needs the loaded lines); read after finally
  let fullHistory = [] // hoisted: the finally-block save must see them even on early-return paths
  let history = []
  try {

  // Async distillation mount point (SEND-STALL-DISTILL): the distill promise survives across
  // turns on the panel (the runAgent-side pending carrier is panel-owned — §11 后 agent 单例
  // 复用，蒸馏与 agent 生命周期无关，跨回合照常挂载). `pending` is the
  // previous turn's in-flight distill — the next runAgent awaits it before pushing its input.
  panel._distillState ??= { pending: null }
  // One AbortController per panel lifetime — NOT recreated per turn: a rapid second message
  // must not cancel the previous turn's in-flight distill (AC6a). Only panel dispose / session
  // switch aborts it (review #1); the next turn then lazily creates a fresh one.
  if (!panel._distillController || panel._distillController.signal.aborted) {
    panel._distillController = new AbortController()
  }

  // Previous turn's async distillation must land BEFORE this turn loads the lines from disk:
  // runPanelChat rebuilds the history array per turn (activeLines → JSON.parse of the slot),
  // so awaiting inside runAgent alone would shrink the DETACHED previous array and this turn
  // would start from the stale uncompressed line (AC6a race). The runAgent-side await (N1)
  // stays for direct callers; here pending is nulled so runAgent sees a no-op.
  const prevDistill = panel._distillState.pending
  if (prevDistill) {
    panel._distillState.pending = null
    await prevDistill
  }
  if (!providerName) {
    // Default provider: activeProvider first (CLI parity) — the settings-panel radio
    // sets this pointer; fall back to the first provider that has a key.
    try {
      const { activeProvider } = resolveProviders()
      if (activeProvider && await getKey(activeProvider)) providerName = activeProvider
    } catch {}
    if (!providerName) {
      for (const n of providerNames()) {
        try { if (await getKey(n)) { providerName = n; break } } catch {}
      }
    }
  }
  // needsSetup tells the webview to re-open the welcome panel (even if the user
  // previously skipped it) — a send with no configured provider should land the
  // user on the configuration form, not just an error banner.
  if (!providerName) { panel._panel?.webview.postMessage({ type: "error", text: t("error.provider"), needsSetup: true }); return }
  let p
  try {
    p = await buildProvider(providerName)
  } catch (e) {
    console.error("[chat-panel] buildProvider failed:", e.message)
    panel._panel?.webview.postMessage({ type: "error", text: t("error.failedProvider", { name: providerName }), needsSetup: true })
    return
  }
  if (!p) { panel._panel?.webview.postMessage({ type: "error", text: t("error.failedProvider", { name: providerName }), needsSetup: true }); return }
  if (modelOverride) p = { ...p, model: modelOverride }
  // Reasoning selector → provider fields. "off" AND "none" (the effort enum's lowest
  // level, labeled "off" in the UI) are a true thinking toggle — previously "none"
  // fell into the effort branch and left thinking:enabled untouched, so the button
  // never actually disabled thinking. (Endpoints that force thinking server-side —
  // e.g. the Zhipu coding plan — will still emit reasoning regardless.)
  if (reasoning) p = { ...p, ...resolveReasoningMode(reasoning, p.model, specForModel) }

  const cwd = _cwd() || process.cwd()

  // Sync the live mid-turn flag from the session slot (CLI parity — autoApprove is a
  // session-level slot field, not a VS Code setting). runAgent receives a GETTER: the
  // agent loop and the permission gate re-read it every iteration, so approve-all /
  // the AUTO button take effect immediately mid-turn.
  panel._autoApprove = panel._activeData(turnSlot)?.autoApprove ?? false

  text = injectAtRefs(text, cwd)

  // Load BOTH persisted lines. fullHistory = human line (never-compacted, all real messages —
  // user/assistant text carries BOTH role+type so it feeds the LLM via role AND the UI via type).
  // history = machine line (compaction shrinks it); old sessions fall back to the human line.
  // runAgent appends this turn's real messages (user input, assistant replies, tool results) to
  // both lines via its internal pushReal — chat-panel only supplies the lines and persists them.
  // §17: suspension-session turns keep the session's LIVE lines (the pool map, pending results
  // and _suspended flag ride the history array — reloading from disk would orphan the pool).
  const loadedLines = suspLines ?? panel._activeLines(turnSlot)
  fullHistory = loadedLines.fullHistory
  history = loadedLines.contextHistory // activeLines 已处理机读线判定（length>0 + strip 截断 args）
  // §19.5 UI ⏹ cancel 路由锚点（extension 层直连路径——不经模型）：本回合 live lines
  // 常驻面板——池（history._asyncSubagents）与机读线跨 runAgent/挂起期都存活在这同一
  // 数组上；挂起会话期 susp 路径传入的 suspLines 即 panel._susp.lines 同一引用——
  // cancelSubagent 消息据此定位池条目 + 注入模型可见提醒（panel-messages.mjs）。
  panel._liveLines = { history, fullHistory, cwd }
  // Slot snapshot comment: turnSlot/distillSlot are captured at function entry (above, before
  // any await) — see the 交付评审 🔴#1 note at the top of this function.
  const isFirstMessageNow = !suspLines && fullHistory.filter((m) => (m.type ?? m.role) === "user").length === 0
  isFirstMessage = isFirstMessageNow

  // §11（AGENT-LOOP.md §11.1③/F2——2026-09-08）：runOpts 不再搬运 engState/planMode 状态载荷
  // ——hydrate（setup.mjs applySlotSessionState）每轮直接从权威槽 reconcile（engineering/
  // advisor.guard/planMode/engDesignTokens——settle 落盘在 run 外，槽读保留）。
  // Persist model selection
  const prefs = { model: modelOverride || p.model, provider: providerName, reasoning: reasoning || "" }
  if (!autoTurn) saveModelPrefs(panel._context.workspaceState, prefs)

  panel._panel?.webview.postMessage({ type: "loading", loading: true })
  panel._turnActive = true
  panel._setStatus("running")
  // §17: suspension-session turns must NOT abort the previous controller — the session
  // handle (susp.abort = the entering turn's controller) is what pool children hold; a
  // digest's Stop must not kill the pool. Per-turn controllers only exist for the turn.
  // 顶层回合起点的僵尸清理已上移至函数入口（C1 F-C1b——见上方注释——任何 await 之前清闩 +
  // 清上回合 controller）；此处每回合（含会话内回合）建立自己的 controller——newTurnController
  // 内部消费启动闩（置位则立即 abort + 复位——修 H-C Startup 窗口 Stop 被吞）。
  newTurnController(panel)

  const askInPanel = makeAskInPanel(panel)
  // Callbacks shared by the initial run and the interrupt-resume run (extracted so
  // they can't drift apart). 2026-09-05 实践轮 module-split：回调工厂（webview 桥接
  // 面——token/reasoning/tool 流/压缩生命周期/落盘/权限/问答 25 个 onX）verbatim 迁
  // panel-callbacks.mjs buildPanelCallbacks——总用量累计与 lastAgentState 随工厂闭包。
  const callbacks = buildPanelCallbacks(panel, { cwd, p, fullHistory, history, providerName, turnSlot, distillSlot, autoTurn, askInPanel })
  // §17 D-S7 (manual tier): digest turns must not pop permission/question UI — an
  // unattended digest may neither hang on a panel prompt nor be interrupted by one.
  // The VS Code dispatch executes un-gated when no handler is present (unlike the CLI's
  // "no handler = denied"), so explicit deny stubs replace the panel prompts — the
  // semantic outcome matches the CLI contract: denied without a panel, no hang.
  if (autoTurn && !panel._autoApprove) {
    callbacks.onPermissionRequired = async () => false
    callbacks.onBatchPermissionRequest = async () => "deny"
    callbacks.onQuestion = async () => null
  }

  // §17 D-S6 guard-carry bookkeeping: auto-turn end-state guard marks (mutations,
  // verify/advisor flags) accumulate on panel._guardCarry and are inherited by the
  // next USER run (runAgent applies opts.inheritedGuard at its start; consumed once).
  // 2026-09-05 实践轮：主循环（runOpts 构造 + ContinueError/Ctrl+I 续跑 + 错误持久化
  // 分支）提为 runTurnLoop 模块函数（骨干—细节两层——循环细节下移，此处只剩调用）。
  const tLog = opts._logOutcome ?? {}
  tLog.started = true
  logEvent("turn:start", { kind: autoTurn ? "auto" : "user" })
  await runTurnLoop(panel, { text, cwd, p, callbacks, images, history, fullHistory, autoTurn, susp, turnSlot, tLog, askInPanel })
  } finally {
    traceStop("finally: turn complete — UI released", panel._stopClickTs)
    panel._stopClickTs = null
    // §17 D-S2 释放窗口守卫（2026-09-02 偏差修复 #2）：挂起决策先于任何释放点登记。
    // finally → generateTitle（可达秒级 LLM 调用）的窗口内用户消息若只走 susp?.active 分流
    // 会不命中而直接新开回合——新回合从磁盘重载 lines（新 history 数组与池所在数组分离）
    // + abort 外回合 controller → 池 children 全中止 → 僵尸挂起（aborted settle 不出池 →
    // poolLive 恒真）或池结果随旧数组静默丢弃（AC-S2 双违）。_suspPending 置位期间 _chat
    // 把消息入队 panel._suspQueue，由下面回合尾的会话入口消费（带队列进会话 / 无会话则
    // 普通回合兜底——零丢失）。
    if (!skipSession && !susp && !panel._susp && panel._panel && poolLive(history)) {
      panel._suspPending = true
    }
    panel._turnActive = false
    panel._refreshStatus()
    panel._panel?.webview.postMessage({ type: "loading", loading: false })
    // Persist on EVERY exit path (CLI agent-turn.mjs finally parity — "Save session after
    // every turn (survives crashes)"): the ContinueError→Stop `break` above skips the
    // catch-block save, which stranded the whole turn (user input + N turns of work) in
    // memory only — lost on session switch/reload.
    try {
      if (fullHistory?.length) panel._saveLines(fullHistory, history, { activeProvider: providerName }, turnSlot)
    } catch (saveErr) {
      console.error("[chat-panel] save in finally failed:", saveErr.message)
    }
  }
  // Generate session title from first message (after agent completes)
  if (isFirstMessage) await panel._generateTitle(turnSlot)

  // §17 D-S2 释放窗口接管（2026-09-02 偏差修复 #2）：finally 已登记 panel._suspPending——
  // generateTitle await 窗口期经 _chat 入队的消息（panel._suspQueue）在这里消费：池仍
  // live 且会话 controller 未被中止 → 带队列进挂起会话（用户输入优先于 digest，D-S5）；
  // 池已空 / Stop 已中止 / 面板消失 → 队列消息以普通回合兜底执行——入队消息零丢失（AC-S2）。
  if (panel._suspPending) {
    panel._suspPending = false
    const queued = (panel._suspQueue ?? []).splice(0)
    const enter = !skipSession && !susp && !panel._susp && panel._panel
      && poolLive(history) && !panel._abortController?.signal.aborted
    if (enter) {
      const cwd = _cwd() || process.cwd()
      const runTurn = async ({ text: tText, modelOverride: tModel, reasoning: tReasoning, providerName: tProvider, images: tImages, autoTurn: tAuto }) => {
        await runPanelChat(panel, { text: tText, modelOverride: tModel, reasoning: tReasoning, providerName: tProvider, images: tImages, autoTurn: tAuto === true, susp: panel._susp, skipSession: true })
      }
      await suspensionSession(panel, {
        turnSlot, distillSlot,
        // lines 双键形：driver 用 lines.history/lines.fullHistory；会话内回合（runPanelChat
        // susp 路径）按 activeLines 契约读 loadedLines.contextHistory——缺键会让 in-session
        // 回合的 history=undefined（onComplete 落盘崩 + run-start pending 注入不消费 →
        // digest 死循环；T-S18 全路径回归实证，2026-09-02 偏差修复轮补正）。
        lines: { history, fullHistory, contextHistory: history },
        // D3 (2026-09-08): 不再把入场 engState 快照传入挂起会话——会话内回合每轮从槽新读
        //（settle 落盘后 digest 可见）。suspension.mjs 不再存 susp.engState。
        cwd,
        runTurn,
        pendingInput: queued,
      })
    } else if (queued.length > 0 && panel._panel) {
      // §24 D-24c（R15）：释放窗口队列兜底同样攒批合并（回合空闲——≥2 可合批段合成一条）
      while (queued.length > 0 && !panel._susp && panel._panel) {
        const next = popQueuedTurn(queued)
        const q = next.items ? { text: buildMergedMessage(next.items), ...mergeTransportFor(next.items) } : next.item
        await runPanelChat(panel, { ...q })
      }
    }
  }

  // 2026-09-05 人机并行对齐（CLI agent-turn 尾 state.queue 消费——实践验证模式）：
  // processing 期间排队的消息（panel-messages userMessage → _suspQueue——任何回合中
  // 都可输入排队）在此回合尾顺序消费；池 live 时上方挂起入口已领走队列（pendingInput
  // 由挂起会话调度——D-S5 用户输入优先），此处兜底池空/无会话路径——零滞留零丢失。
  // 与 _suspPending 块互斥（上方挂起块消费后队列已空；释放窗口期 _chat 排队项也在
  // 上方 queued splice 中——本循环只接消费后新增/未处理项）。
  while ((panel._suspQueue?.length ?? 0) > 0 && !panel._turnActive && !panel._suspPending) {
    const next = popQueuedTurn(panel._suspQueue)
    const q = next.items ? { text: buildMergedMessage(next.items), ...mergeTransportFor(next.items) } : next.item
    await runPanelChat(panel, { ...q })
  }
}

/**
 * §17 D-S6 guard-carry 主循环（2026-09-05 实践轮——自 runPanelChatImpl 按骨干—细节
 * 两层提取，verbatim + 签名化，语义零变）：runOpts 构造（guard 继承/会话句柄/持久化
 * 载荷）+ ContinueError/Ctrl+I 续跑循环 + 错误/中止持久化分支。回合骨架事件
 * （turn:start）留在调用点（impl 骨干）；本函数只跑 runAgent 续跑循环。
 * deps：阶段产物（text/cwd/p/callbacks/lines/autoTurn/susp/turnSlot）+ tLog
 * 载具（LOGGING 终止原因回传）。
 * §11（2026-09-08）：runOpts 砍 engState/planMode 状态载荷（hydrate 从槽 reconcile）；
 * runOpts 对象跨续跑迭代共用（resume 字段可变）——runAgent 把建好的顶层 agent 写回
 * ro.agent（agent.mjs write-back）——Ctrl+I/ContinueError 续跑与下回合复用同一单例。
 */
async function runTurnLoop(panel, deps) {
  const { text, cwd, p, callbacks, images, history, fullHistory, autoTurn, susp, turnSlot, tLog, askInPanel } = deps
  let carryTaken = false
  // §11: guard-carry 只在本回合首个（resume=false）runAgent 应用一次（resume 迭代不重取）
  const inherited = (!autoTurn && !carryTaken) ? (panel._guardCarry ?? null) : undefined
  if (inherited) { carryTaken = true; panel._guardCarry = null }
  const ro = {
    agent: panel._agent, // §11 单例：存在且绑定匹配（ensurePanelAgent）→ runAgent hydrate 复用
    mcpServers: getMcpServers(), images, skills: loadSkills(cwd), history, fullHistory,
    injections: [collectEditorInjection(cwd)].filter(Boolean), resume: false,
    distillState: panel._distillState, distillSignal: panel._distillController?.signal,
    engPersist: { cwd, slot: turnSlot },
    // §17 D-S6/D-S9: digest turns skip the input push (setupAgentRun autoTurn),
    // session children share the session abort signal, guard marks flow per tier.
    // §17.5: the panel is the suspension driver — turn-end collection must NOT
    // drain settled entries (they stay pooled → the session digests them).
    autoTurn,
    suspDriven: true,
    sessionSignal: susp?.abort?.signal ?? null,
    inheritedGuard: inherited,
    guardCarry: autoTurn ? (panel._guardCarry ??= {}) : undefined,
  }
  // Turn-cap continue loop (CLI agent-turn.mjs parity): each ContinueError offers
  // "Continue" — unlimited, resume:true keeps history, fresh budget per run. The loop
  // also folds in the Ctrl+I interrupt resume (same rebuild-controller semantics).
  // (The entry try at the top of this function owns the guard-flag finally; exceptions
  // from the loop propagate through it and up to the message handler.)
  for (let resume = false; ; resume = true) {
    ro.resume = resume
    try {
      traceStop("runAgent: turn starting (no pending click)", panel._stopClickTs)
      await runAgent(p, cwd, text, callbacks, panel._abortController.signal, () => panel._autoApprove, ro)
      traceStop("runAgent: turn ended normally", panel._stopClickTs)
      break
    } catch (e) {
      traceStop(`runAgent: threw ${e?.name} — unwinding`, panel._stopClickTs)
      // Ctrl+I interrupt: the abort carries reason.interrupt — rebuild the
      // controller and RESUME the same turn (the interrupt message is already in
      // history; the model continues from there). CLI agent-turn.mjs parity.
      if (e?.name === "AbortError" && e.reason?.interrupt) {
        newTurnController(panel)
        continue
      }
      if (e instanceof ContinueError) {
        if (autoTurn) {
          // §17 D-S9 ContinueError row (digest): NO panel — AUTO auto-resumes (the
          // user authorized unattended operation, §2 unified rule), manual silently
          // stops (the partial digest stays in history — finished reports are not
          // lost, we just stop burning turns unattended).
          if (panel._autoApprove) {
            newTurnController(panel)
            continue
          }
          tLog.result = "stopped"
          break
        }
        // Turn-cap exhaustion: offer to continue from the current context, NOT error
        // (CLI agent-turn.mjs parity — "Ran N turns. Continue?"). Rebuilding the
        // controller + resume re-runs the loop from the SAME history (the user message
        // is already pushed; resume=true skips re-pushing it). Unlimited continues —
        // the user can Stop at any prompt.
        const willContinue = await askInPanel(
          `Agent reached ${e.turns} turns (limit). Continue from here?`,
          ["Continue", "Stop"],
        )
        if (willContinue === "Continue") {
          newTurnController(panel)
          continue
        }
        panel._panel?.webview.postMessage({ type: "aborted" })
        tLog.result = "stopped"
        break
      }
      // Persist the interrupted/errored turn: the user message and any partial output
      // were already pushed into both lines by runAgent (pushReal). Without this save,
      // an abort/error loses the whole turn from disk (CLI parity: at most half a turn lost).
      // (The finally block below also saves unconditionally — CLI agent-turn.mjs parity —
      // so this catch-block save is now redundant on this path, but harmless.)
      try {
        panel._saveLines(fullHistory, history, { activeProvider: providerName }, turnSlot)
      } catch (saveErr) {
        console.error("[chat-panel] save after abort/error failed:", saveErr.message)
      }
      if (e.name === "AbortError") {
        panel._panel?.webview.postMessage({ type: "aborted" })
        tLog.result = "stopped"
      } else {
        console.error("[chat-panel] runAgent failed:", e.message, "provider:", p.baseURL, "model:", p.model)
        // Friendly surface: first line only, URLs stripped (provider errors leak
        // the baseURL into the message). Full detail + provider/model folds away.
        const rawMsg = e.message || String(e)
        const errTextLine = rawMsg.split("\n")[0].replace(/https?:\/\/[^\s,)"]+/g, "[endpoint]")
        const techInfo = [rawMsg, `→ Provider: ${p.baseURL}`, `→ Model: ${p.model}`].join("\n")
        panel._panel?.webview.postMessage({ type: "error", text: errTextLine, techInfo })
        tLog.result = "error"
      }
      break
    }
  }
  // §11 write-back：runAgent 已把（新建的）顶层单例写回 ro.agent——同步到 panel._agent，
  // 下回合经 ensurePanelAgent 复用同一对象（AC1——_engDesignTokens/_tasks 等回合间携带）。
  if (ro.agent) panel._agent = ro.agent
}


// toolPanelPayload 2026-09-05 迁 panel-toolpanel.mjs（512 > 500 硬限）——re-export 保面（chat-panel.test.mjs）
export { toolPanelPayload } from "./panel-toolpanel.mjs"