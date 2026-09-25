/**
 * panel-chat.mjs — ChatPanel chat turn runner (split out of chat-panel.mjs).
 * Resolves the provider, loads the dual history lines, runs the agent with
 * streaming callbacks, persists the lines on complete.
 * AGENT-LOOP-ASYNC-POOL.md §6.8 (2026-09-02): a turn ending with the async pool
 * still live enters the suspension session (suspension.mjs) — susp-idle input stays
 * usable (fills the single pendingInput slot + wake), busy (running incl. digest) input is
 * queued instead (routeUserTurn splits into the two carriers; cap QUEUED_MAX_ITEMS = 8,
 * 满队 ⇒ 拒发 toast + 文本保留), settles drive auto-turn digests (manual tier organize-only /
 * AUTO full semantics), pool-empty + no queued input exits naturally back to idle.
 * AGENT-LOOP-ASYNC-POOL.md §6.8 偏差修复（2026-09-02 #2/#3）: 挂起入口在 finally 先于任何释放点登记（释放窗口——
 * 关闭 generateTitle 释放窗口的并发新回合）；控制器重建全部登记（_turnControllers →
 * 会话统一 abort）。
 * C2（SESSION-FLOW-C F-C2a——2026-09-09）：_suspPending/_turnActive 布尔退役——忙态单一
 * _turnState 枚举（idle/running/susp）——释放窗口 = state==="susp" 且 panel._susp 空；
 * 队列尾排空等读者改状态机表达（真值表与旧布尔逐位一致）。
 * A2（SESSION-FLOW-A F-A2——2026-09-09 用户裁方案 Y）：标题上移 finally 忙态归位前（running
 * 窗口——修 R3 并发/消化劫持——错误不外抛归位恒执行）；D7（2026-09-21 块标题行对齐批）后
 * 触发判据 = **无标题即尝试**（槽 `title` 空判——`isFirstMessage` 退役；标题链单源 =
 * `docs/core/design/SESSION.md` §6.7）。
 * 四档结构拆分批（2026-09-18 · VSC-DEBT §12.2.1）：回合执行循环 + controller 工厂迁出至
 * `panel-turn-loop.mjs`；回合阶段三段（provider/模型解析 · 收尾落盘 · 挂起接管）迁出至
 * `panel-turn-stages.mjs`——本档留入口守卫段（`ensurePanelAgent` / `ensureMemoryHandle` 同址——
 * 结构机检 `engine-floor-guard.test.mjs:152-154`）与行加载 / 回调装配段。
 */
import * as vscode from "vscode"
import { ensureMemoryHandle } from "../embed-config.mjs"
import { saveModelPrefs } from "./session-io.mjs"
import { ensureSlot, ensureSlotAsync } from "./panel-session.mjs"
import { injectAtRefs } from "./file-refs.mjs"
import { _cwd } from "./panel-messages.mjs"
import { logEvent, errText } from "@thincoder/core/log.mjs"
// 无工作区守卫（2026-09-21 批 · `PROJECT-SWITCHER.md` §4.1）：④ 兜底红线（leaf——无环）
import { blockOnNoWorkspace } from "./workspace-guard.mjs"
// 2026-09-05 实践轮 module-split：回调工厂迁 panel-callbacks.mjs（webview 桥接面独立决策）
import { buildPanelCallbacks, makeAskInPanel } from "./panel-callbacks.mjs"
// 四档拆分批（2026-09-18 · VSC-DEBT §12.2.1）：回合执行循环 + controller 工厂迁 panel-turn-loop.mjs；
// 回合阶段三段（provider/模型解析 · 收尾落盘 · 挂起接管）迁 panel-turn-stages.mjs。
// 两新档均**零 import 主档**（段 B 的 `runPanelChat` 回调 = 注入项 `deps.runChat`——不新增环；
// 机判 = `grep -n 'from "./panel-chat.mjs"' panel-turn-stages.mjs` 零命中）。
import { newTurnController, runTurnLoop } from "./panel-turn-loop.mjs"
import { resolveTurnStage, finalizeTurn, enterSuspensionTurn } from "./panel-turn-stages.mjs"
// 缝保持（KD-12 · 承 KD-13）：`newTurnController` 迁出 + 本档 re-export——消费档 import 行零改。
export { newTurnController } from "./panel-turn-loop.mjs"

/** 绑定判定（纯函数，单测锚点）：agent 仅在其 _engPersist 绑定的
 *  cwd×slot 与当前面板会话一致时可复用（同 cwd 同 slot 第二轮 → 复用不销毁——AC1；换 slot/
 *  换项目 → 不匹配 → 销毁重建——AC4/F4——不跨会话串态）。 */
export function agentSlotMatches(agent, cwd, slot) {
  const p = agent?._engPersist
  return !!(p && p.cwd === cwd && p.slot === slot)
}

/** §11 ensurePanelAgent（runPanelChatImpl ensureSlot 后调用）：绑定匹配 → 复用；否则销毁
 *  （panel._agent = null——内存态随对象回收，槽文件仍权威）。销毁后由本回合 runAgent 的
 *  factory 路径新建（首轮/destroy 重建同路径——hydrate 含槽字段回填）。返回当前
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
  // ④ 无工作区守卫（**兜底红线**——函数体首条语句：任何 await / `_publishTurnState("running")`
  // 之前）。一切回合路径（user / auto / digest / 挂起内回合）经此 ⇒ 不建 agent（manifest 建档
  // 钩子 `src/agent/setup.mjs` 不可达 = 零 manifest I/O）。结构锁 = `test/workspace-guard.test.mjs` 用例 4。
  if (blockOnNoWorkspace(panel)) return
  let { text, modelOverride, reasoning, providerName, images, autoTurn = false, upstreamTurn = false, susp = null, skipSession = false } = opts
  if (!panel._panel) { vscode.window.showErrorMessage("_chat: panel is null"); return }

  // C1（SESSION-FLOW-C F-C1b——abort 启动闩——修 H-C）：回合起点（任何 await 之前）清闩 +
  // 清上回合僵尸 controller（abort + 置 null + 清登记）。僵尸清理原在下方 controller 建立
  // 前（原 215 行 if(!susp) 块）——上移等价安全：非 susp 回合只能启动于池空/无会话时（释放
  // 窗口守卫 = state==="susp" 且 _susp 空——偏差修复 #2——池 children 不持有上回合
  // controller）；会话（susp）内回合不动会话句柄（susp.abort = 进入回合 controller——
  // digest Stop 不得杀池）。
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
  // C2（SESSION-FLOW-C F-C2a/b）：回合入口忙态置 running + 广播（任何 await 之前的守卫
  // 行——供路由/切换守卫与 webview 派生）。会话内回合（digest/会话用户回合）同样置
  // running（真实回合执行中——routeUserTurn 据此排队）；回合尾 finally 按会话/池态回
  // susp 或 idle。
  panel._publishTurnState("running")
  // F-MI7：冷路径 null ⇒ awaited 认领（唯一阻塞点：在 `_publishTurnState("running")` 之后、
  // `ensurePanelAgent`/`distillSlot` 之前——切换竞态由 :116 忙态守卫挡；认领失败 ⇒ 抛回，
  // chat-panel F-C1a 兜底复位忙态（:398-413——不变量：回合 promise 永不悬挂）。
  let turnSlot = susp?.turnSlot ?? ensureSlot(panel)
  if (turnSlot == null) turnSlot = await ensureSlotAsync(panel)
  // 会话级顶层 agent 单例（2026-09-08）：ensureSlot 后绑定判定：
  // 存在且 _engPersist cwd×slot 匹配 → 复用（同 panel 连续多回合同一对象——AC1）；否则销毁，
  // 本回合 runAgent 经 opts.agent 缺省路径 factory 新建（首轮/换槽/destroy 重建同路径）。
  ensurePanelAgent(panel, turnSlot)
  // W8 §2「记忆句柄」：装配点惰性建核记忆面（护栏 + 静态闭包零 node:sqlite——见 embed-config.mjs 头注；停用/建败 = null，消费点零崩）
  await ensureMemoryHandle()
  const distillSlot = turnSlot
  const suspLines = susp?.lines ?? null // suspension turns keep the LIVE lines (pool/pending ride them)
  let fullHistory = [] // hoisted: the finally-block save must see them even on early-return paths
  let history = []
  // 四档拆分批：`slotStamp` 同 hoist（原 `const slotStamp` 在 try 内——收尾段参数化后，早退
  // 路径不得在 finally 处读未初始化的 const；早退时 fullHistory 恒空 ⇒ 落盘分支不达——语义等价）。
  let slotStamp = null
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
  // 段 A（迁出至 panel-turn-stages.mjs——契约 A-1：三处早退 = 判别式回传 `{ done: true }` +
  // 调用侧翻译位**必须留在本 try 内**（落 try 外 ⇒ 收尾 finally 不执行 = 语义变更）；
  // 回传面 = providerName / p / slotStamp / slotData（契约 A-2））。
  const stage = await resolveTurnStage({ panel, turnSlot, providerName, modelOverride, reasoning })
  if (stage.done) return
  providerName = stage.providerName
  const p = stage.p
  slotStamp = stage.slotStamp
  const slotData = stage.slotData

  const cwd = _cwd() || process.cwd()

  // Sync the live mid-turn flag from the session slot (CLI parity — autoApprove is a
  // session-level slot field, not a VS Code setting). runAgent receives a GETTER: the
  // agent loop and the permission gate re-read it every iteration, so approve-all /
  // the AUTO button take effect immediately mid-turn. （slotData = 上方槽复合同一次读取——
  // 避免每回合多次 parse 大槽文件）
  panel._autoApprove = slotData?.autoApprove ?? false

  text = injectAtRefs(text, cwd)

  // Load BOTH persisted lines. fullHistory = human line (never-compacted, all real messages —
  // user/assistant text carries BOTH role+type so it feeds the LLM via role AND the UI via type).
  // history = machine line (compaction shrinks it); old sessions fall back to the human line.
  // runAgent appends this turn's real messages (user input, assistant replies, tool results) to
  // both lines via its internal pushReal — chat-panel only supplies the lines and persists them.
  // AGENT-LOOP-ASYNC-POOL.md §6.8: suspension-session turns keep the session's LIVE lines (the pool map, pending results
  // and _suspended flag ride the history array — reloading from disk would orphan the pool).
  const loadedLines = suspLines ?? panel._activeLines(turnSlot)
  fullHistory = loadedLines.fullHistory
  history = loadedLines.contextHistory // activeLines 已处理机读线判定（length>0 + strip 截断 args）
  // AGENT-LOOP-SUBAGENT.md §6.7.2 UI ⏹ cancel 路由锚点（extension 层直连路径——不经模型）：本回合 live lines
  // 常驻面板——池（history._asyncSubagents）与机读线跨 runAgent/挂起期都存活在这同一
  // 数组上；挂起会话期 susp 路径传入的 suspLines 即 panel._susp.lines 同一引用——
  // cancelSubagent 消息据此定位池条目 + 注入模型可见提醒（panel-messages.mjs）。
  panel._liveLines = { history, fullHistory, cwd }
  // Slot snapshot comment: turnSlot/distillSlot are captured at function entry (above, before
  // any await) — see the 交付评审 🔴#1 note at the top of this function.
  // D7（2026-09-21）：`isFirstMessage` 判据退役——标题触发改「无标题即尝试」（槽 title 空判），
  // 源改内存人读线（标题链单源——`finalizeTurn` 内完成）。

  // F2（2026-09-08）：runOpts 不再搬运 engState/planMode 状态载荷
  // ——hydrate（setup.mjs applySlotSessionState）每轮直接从权威槽 reconcile（engineering/
  // advisor.guard/planMode/engDesignTokens——settle 落盘在 run 外，槽读保留）。
  // Persist model selection
  const prefs = { model: modelOverride || p.model, provider: providerName, reasoning: reasoning || "" }
  if (!autoTurn) saveModelPrefs(panel._context.workspaceState, prefs)

  panel._panel?.webview.postMessage({ type: "loading", loading: true })
  panel._setStatus("running")
  // AGENT-LOOP-ASYNC-POOL.md §6.8: suspension-session turns must NOT abort the previous controller — the session
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
  const callbacks = buildPanelCallbacks(panel, { cwd, p, fullHistory, history, providerName, turnSlot, distillSlot, autoTurn, askInPanel, slotStamp })
  // AGENT-LOOP-ASYNC-POOL.md §6.8 D-S7 (manual tier): digest turns must not pop permission/question UI — an
  // unattended digest may neither hang on a panel prompt nor be interrupted by one.
  // The VS Code dispatch executes un-gated when no handler is present (unlike the CLI's
  // "no handler = denied"), so explicit deny stubs replace the panel prompts — the
  // semantic outcome matches the CLI contract: denied without a panel, no hang.
  if (autoTurn && !panel._autoApprove) {
    callbacks.onPermissionRequired = async () => false
    callbacks.onBatchPermissionRequest = async () => "deny"
    callbacks.onQuestion = async () => null
  }

  // AGENT-LOOP-ASYNC-POOL.md §6.8 D-S6 guard-carry bookkeeping: auto-turn end-state guard marks (mutations,
  // verify/advisor flags) accumulate on panel._guardCarry and are inherited by the
  // next USER run (runAgent applies opts.inheritedGuard at its start; consumed once).
  // 2026-09-05 实践轮：主循环（runOpts 构造 + ContinueError/Ctrl+I 续跑 + 错误持久化
  // 分支）提为 runTurnLoop 模块函数（骨干—细节两层——循环细节下移，此处只剩调用）。
  const tLog = opts._logOutcome ?? {}
  tLog.started = true
  logEvent("turn:start", { kind: autoTurn ? "auto" : "user" })
  await runTurnLoop(panel, { text, cwd, p, callbacks, images, history, fullHistory, autoTurn, upstreamTurn, susp, turnSlot, tLog, askInPanel, slotStamp })
  } finally {
    // 收尾段（迁出至 panel-turn-stages.mjs——捕获变量参数化；纪律 = §12.2.1 第 4 步附加纪律）。
    await finalizeTurn(panel, { history, fullHistory, slotStamp, turnSlot, susp, skipSession })
  }

  // 段 B（迁出至 panel-turn-stages.mjs——契约 B-1/B-2：`runTurn` 闭包原直调 `runPanelChat`
  // ⇒ 改注入项 `deps.runChat`——新档零 import 主档，不新增环）。
  await enterSuspensionTurn(panel, { turnSlot, distillSlot, history, fullHistory, skipSession, susp, runChat: runPanelChat })
}
