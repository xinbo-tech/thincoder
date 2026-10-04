/**
 * panel-turn-loop.mjs — 回合执行循环面（自 `panel-chat.mjs` 拆出——VSC 四档结构拆分批
 * 2026-09-18 · 设计 `docs/vsc/design/VSC-DEBT.md` §12.2.1）。
 *
 * 迁出段（逐字搬迁 · 既有注释一并随迁）：回合执行循环 `runTurnLoop`（原 `panel-chat.mjs:385-498`
 * ——runOpts 构造 + ContinueError/Ctrl+I 续跑 + 错误/中止持久化分支）+ 回合 controller 工厂
 * `newTurnController`（原 `:43-65`）。
 * 留主档（`panel-chat.mjs`）= 入口守卫段（`ensurePanelAgent` / `ensureMemoryHandle` 同址——
 * 结构机检约束 = 批件 `docs/batches/2026-09-29-residuals-round2.test.mjs`——W8 契约②判据现载体，单测树重建时回迁端侧单测档）+ 行加载 / 回调装配段 +
 * `runPanelChat` 包装 + `agentSlotMatches` / `ensurePanelAgent`。
 *
 * 缝保持（KD-12 · 承 KD-13）：`newTurnController` 迁出 + 主档 re-export（消费档
 * `chat-panel-messages.test.mjs:24` import 行零改）；`runTurnLoop` 原即模块私有（新档导出、
 * 主档 import——对外缝零变化）。
 * 依赖单向：`panel-chat → panel-turn-loop`（本档零 import 主档、零 import `panel-turn-stages.mjs`）。
 *
 * parity-b1 P4-II（2026-09-29 · 批档 §2.3 件 1 后段 ∕ 件 2 · 父侧 §1.8 携带指令）：主循环本体
 * 归核——本档 = **host 装配（`hydrateRun` ∕ `setupAgentRun`）→ 核 `runAgent(agent, text, callbacks, opts)`
 * → 端壳续跑循环（resume ∕ ContinueError ∕ Ctrl+I 三段保留）**。核 `runAgent` = 动态 import（核 agent
 * 链静态达 `node:sqlite`——W8 契约②；本档静态边经闭包扫描全为净件）。三处 host 适配面：① 载体面
 * `bindCarrierFace`（件 1-⑤⑥——14 字段 `agent[f] ⇄ history[f]` 别名 + `agent.history` 访问器锚）；② 完成面
 * `callbacks.onComplete`（🔴 P4-I 断缝闭证——核 loop 零调用点 ⇒ 干净返回处补调）；③ 工具推送腿
 * `callbacks.onTurnEnd`（件 1「面板推送腿」行——旧循环 `agent.mjs:397-417` 逐字迁入）。
 */
import { continueDecision } from "@thincoder/core/agent/continue-decision.mjs" // #677 · I10 续跑判定单源（#127 ④ 双写退役）
import { hydrateRun, setupAgentRun } from "../agent/setup.mjs"
import { agentState } from "../agent/run-helpers.mjs"
import { syncToolDrivenDisplayState } from "../agent/agent-state.mjs"
import { assemblyMcpServers } from "../config-mcp.mjs" // #701：装配面并项目根 `.mcp.json`（ro 载荷唯一供给点）
import { collectEditorInjection } from "./editor-context.mjs"
import { traceStop } from "./stop-trace.mjs"
import { postDigestCap } from "./panel-callbacks.mjs"
import { pickupQueuedAtStepBoundary } from "./queued-pickup.mjs"

/** AGENT-LOOP-ASYNC-POOL.md §6.8 D-S9 controller 登记（2026-09-02 偏差修复 #3）：池 children 在 spawn 时刻持有当时的
 * turn controller signal——Ctrl+I ∕ 撞帽续跑重建 controller 后，旧
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
 * 导出——chat-panel-messages.test.mjs（面板入口面）桩面板直测闩消费（C1 组③）。 */
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

/** #133 次因（首回合盲窗）修：面板 `_agent` 槽与宿主持有件（`runTurnLoop` 的 `ro`）**同槽
 * 活绑定**——get 实读 / set 直写面板字段。宿主在回合内写回新建/hydrate 的顶层单例
 * （`agent.mjs` `opts.agent = agent`）当场落到面板字段（原仅回合末同步，见本档 `runTurnLoop`
 * 尾）⇒ 首回合 run 期（与换槽 / destroy 后首回合）载荷产者（`panel-callbacks.mjs` relay 的
 * `syncLive` 采样）与取消路由（`panel-messages-turn.mjs`）同步可达。面板侧置 null 由直写面板
 * 字段发生（不经本函数）——槽即单源。 */
export function bindPanelAgent(panel, holder) {
  Object.defineProperty(holder, "agent", {
    configurable: true,
    enumerable: true,
    get: () => panel._agent,
    set: (a) => { panel._agent = a },
  })
}

/** 载体字段表（14 款——`docs/core/design/AGENT-LOOP.md` §2.3 绑定不变式：核写侧以父对象字段为入口，只绑
 *  两池会让 settle 的 pending ∕ 墓碑 ∕ 队列 ∕ 唤醒数组落在 per-run agent 上；表源 = 旧端 `agent.mjs:39-43`）。 */
const CARRIER_FIELDS = [
  "_asyncSubagents", "_asyncAdvisors", "_asyncTombstones", "_pendingAsyncResults",
  "_consultSessions", "_engDesignTokens", "_suspended", "_asyncQueue", "_asyncAdvisorQueue",
  "_asyncWaiters", "_advisorRuns", "_mutLog", "_childUpstream", "_childUpstreamSeq",
]

/** 载体面装配（每 run 一次——`hydrateRun` 之后；旧端 `src/agent.mjs:142-159` 逐字同法）：① 六容器先在共享
 *  `history` 侧建齐（核写的是父对象字段，访问器别名下与 `history` 同一容器——端壳读面同源）；② 14 字段
 *  访问器别名（非快照——容器替换两向同步）；③ `agent.history` 访问器锚（KD-3）：核替换点（`context.mjs`
 *  `:219/:227/:242/:426` ∕ `explore-distill.mjs:143` ∕ `agent/setup.mjs:53`）以 `agent.history = <新数组>`
 *  表达 ⇒ setter 原位回收，面板 ∕ 挂起会话持有的数组引用跨替换稳定。 */
function bindCarrierFace(agent, history) {
  if (!(history._asyncSubagents instanceof Map)) history._asyncSubagents = new Map()
  if (!(history._asyncAdvisors instanceof Map)) history._asyncAdvisors = new Map()
  if (!Array.isArray(history._pendingAsyncResults)) history._pendingAsyncResults = []
  if (!Array.isArray(history._asyncWaiters)) history._asyncWaiters = []
  if (!Array.isArray(history._mutLog)) history._mutLog = []
  if (!(history._advisorRuns instanceof Map)) history._advisorRuns = new Map()
  for (const f of CARRIER_FIELDS) {
    Object.defineProperty(agent, f, {
      configurable: true,
      get() { return history[f] },
      set(v) { history[f] = v },
    })
  }
  Object.defineProperty(agent, "history", {
    configurable: true,
    enumerable: true,
    get: () => history,
    set: (v) => {
      if (v === history) return
      history.length = 0
      for (const m of v) history.push(m)
    },
  })
}

/** 工具推送腿（§2.3 件 1「面板推送腿」行——钉缝 = `callbacks.onTurnEnd`；核 `post-turn.mjs:65` 工具
 *  执行轮末主触，工具期中断支 `agent.mjs:439` 同触；另 `completion.mjs:41/66/84/97/112/140` 无工具调用的
 *  续跑支同触 ⇒ **超集调用**，本腿三腿皆变更门控（`!==` 比对 ∕ 读后复位）⇒ 幂等、零用户可见差）。
 *  旧循环 `src/agent.mjs:397-417` 的载体镜像回填 ∕ 比对块逐字迁入：tasks ref 比 ⇒ 回写；planMode
 *  布尔比 ⇒ 回写 + `onPlanMode`；goal 状态词映射（complete/blocked → done/blocked）⇒ `onGoal`。
 *  goal 基准跨批保留（每次回调末更新——批间无 goal 写点 ⇒ 等价旧形「批前快照」）；尾接
 *  `syncToolDrivenDisplayState`（#45 原样调用）。 */
function attachToolDrivenLegs(agent, callbacks) {
  let goalRef = agent._goal ?? null
  let goalStatus = agent._goal?.status ?? null
  callbacks.onTurnEnd = (turnAgent) => {
    if (Array.isArray(turnAgent.tasks) && turnAgent.tasks !== turnAgent._tasks) turnAgent._tasks = turnAgent.tasks
    if (typeof turnAgent.planMode === "boolean" && turnAgent.planMode !== turnAgent._planMode) {
      turnAgent._planMode = turnAgent.planMode
      callbacks.onPlanMode?.(turnAgent.planMode)
    }
    if (turnAgent.goal !== undefined && turnAgent.goal !== turnAgent._goal) turnAgent._goal = turnAgent.goal
    const goalChanged = turnAgent._goal !== goalRef || (turnAgent._goal?.status ?? null) !== goalStatus
    if (goalChanged) {
      const g = turnAgent._goal
      callbacks.onGoal?.(g
        ? { status: g.status === "active" ? "active" : g.status === "complete" ? "done" : g.status, objective: g.objective, criteria: g.criteria }
        : { status: "cancelled" })
    }
    goalRef = turnAgent._goal ?? null
    goalStatus = turnAgent._goal?.status ?? null
    // #45（WEBVIEW-PROTOCOL.md §3.3）：工具驱动的模式 ∕ 参数变更 → 端显示同步（单点、读后复位；
    // 两回调同指面板 `_pushSettingsLight()`——四快照重推）。
    syncToolDrivenDisplayState(turnAgent, callbacks)
  }
}

/**
 * AGENT-LOOP-ASYNC-POOL.md §6.8 D-S6 guard-carry 主循环（2026-09-05 实践轮——自 runPanelChatImpl 按骨干—细节
 * 两层提取，verbatim + 签名化，语义零变）：host 装配（复用 ∕ 新建）+ ContinueError/Ctrl+I 续跑循环 +
 * 错误/中止持久化分支。回合骨架事件（turn:start）留在调用点（impl 骨干）；本函数只跑核 `runAgent` 续跑循环。
 * deps：阶段产物（text/cwd/p/callbacks/lines/autoTurn/susp/turnSlot）+ tLog 载具（终止原因回传）。
 * §11（2026-09-08）：runOpts 砍 engState/planMode 状态载荷（hydrate 从槽 reconcile）；`ro`（host 装配载荷）
 * 每回合构造一次、跨续跑迭代共用——装配只在**首段**发生（旧端每段重 hydrate 的形态随主循环退役）。
 */
export async function runTurnLoop(panel, deps) {
  const { text, cwd, p, callbacks, images, history, fullHistory, autoTurn, upstreamTurn, susp, timerTurn, turnSlot, tLog, askInPanel, slotStamp } = deps
  // §11: guard-carry 只在本回合首个（resume=false）runAgent 应用一次（resume 迭代不重取）
  const inherited = autoTurn ? null : (panel._guardCarry ?? null)
  if (inherited) panel._guardCarry = null
  // host 装配载荷（§2.3 件 1「ro 分流」）：`hydrateRun` 消费 mcpServers/images/history/fullHistory/
  // engPersist/三段旗标并写回 `opts.turnDomainText` ∕ `opts.toolDecorate`（A3 ∕ 裁定①——B7 3b：
  // 尾块键退役）；`sessionSignal` → `agent._sessionSignal`（装配后落）；其余三键（distillSignal ∕ injections ∕
  // consumeQueuedInput）→ 核 opts 摘取键（见 `coreOpts`）；`distillState` ∕ `guardCarry` = 本函数自身面。
  const ro = {
    agent: panel._agent, // §11 单例：存在且绑定匹配（ensurePanelAgent）→ hydrateRun 复用同一对象
    // ↑ 该初值仅保键序/可读：下方 bindPanelAgent 立即把本槽改为 ⇄ panel._agent 访问器（#133）
    mcpServers: await assemblyMcpServers(cwd), images, history, fullHistory,
    injections: [collectEditorInjection(cwd)].filter(Boolean), // A1 序位 = env → peer → injections → time（核 prepareRun）
    distillSignal: panel._distillController?.signal,
    engPersist: { cwd, slot: turnSlot },
    autoTurn,
    upstreamTurn,
    timerTurn,
    sessionSignal: susp?.abort?.signal ?? null,
  }
  // #133 次因：`ro.agent` ⇄ `panel._agent` 同槽活绑定——宿主写回当场落到面板字段（首回合 run
  // 期载荷产者 / 取消路由即可达；下方回合末写回幂等保留）。
  bindPanelAgent(panel, ro)
  // F16 步边界 pickup（queue-visible 批 fix 轮 2026-09-24 · 用户 03:06 收正——C-B2-6 细则② ⓪）：
  // 用户回合在飞 ⇒ 端壳循环头投递回调（非中断——下一步生效）；系统轮（digest / 上行唤醒轮）不传（分流）
  ro.consumeQueuedInput = autoTurn ? null : () => pickupQueuedAtStepBoundary(panel, { history, fullHistory })
  // 核 opts（§2.3 件 1「ro 分流」＋ §2.5 端 adapter 键）：`resume` ∕ `signal` 逐段取（见循环头）；
  // A3 ∕ 裁定① 两键由首段装配写回（B7 3b：尾块键退役——核自持）。
  const coreOpts = {
    signal: null, // 逐段填（循环头）
    resume: false,
    autoTurn,
    upstreamTurn,
    timerTurn,
    suspDriven: true,
    consumeQueuedInput: ro.consumeQueuedInput,
    injections: ro.injections, // A1
    turnDomainText: null, // A3（装配写回）
    distillSignal: ro.distillSignal, // B
    toolDecorate: undefined, // 裁定①（装配写回）
  }
  const hydrateCtx = { provider: p, cwd, input: text, opts: ro, depth: 0, role: null, getAuto: () => panel._autoApprove }
  let agent = null // 首段装配产物（resume 迭代复用——核 `opts.agent` 通道即面板单例）
  let turnInput = text // 贴图指引施用后的最终输入串（hydrate 返回面）
  let runAgent = null // 核 loop（动态 import——W8 契约②）
  // Turn-cap continue loop (CLI agent-turn.mjs parity): each ContinueError offers
  // "Continue" — unlimited, resume:true keeps history, fresh budget per run. The loop
  // also folds in the Ctrl+I interrupt resume (same rebuild-controller semantics).
  // (The entry try at the top of this function owns the guard-flag finally; exceptions
  // from the loop propagate through it and up to the message handler.)
  for (let resume = false; ; resume = true) {
    // 逐段重读（旧端调用点在循环内同义）：`resume` 与 `signal` 均逐段取——controller 重建
    // （Ctrl+I / ContinueError）后核必须拿到**新** controller 的 signal（旧 signal 已 abort）。
    coreOpts.resume = resume
    coreOpts.signal = panel._abortController.signal
    try {
      traceStop("runAgent: turn starting (no pending click)", panel._stopClickTs)
      if (!agent) {
        // ── host 装配（首段——件 1 目标形第 1 段）：复用（`panel._agent` 在场）∕ 新建
        // （`setupAgentRun` = factory + restore——首轮与 destroy 重建同路径）──
        const h = panel._agent ? await hydrateRun(panel._agent, hydrateCtx) : await setupAgentRun(hydrateCtx)
        agent = h.agent
        turnInput = h.input
        ro.agent = agent // write-back（同槽活绑定下即写面板字段——#133 首回合窗语义保留）
        bindCarrierFace(agent, history) // 件 1-⑤⑥ 载体面（装配期绑定，每 run 一次）
        agent._sessionSignal = ro.sessionSignal ?? null // 挂起会话 signal（核 D6 单点读 `_sessionSignal`）
        if (inherited) agent._inheritedGuard = inherited // 核 `!resume` 段 restoreGuard 消费（D-S6；一次性）
        attachToolDrivenLegs(agent, callbacks) // 件 1「面板推送腿」——核 `onTurnEnd` 缝
        // §2.5 A3 ∕ 裁定①：装配写回的两键转交核 opts（写回面 = `hydrateRun` ∕ `buildToolTable`）
        coreOpts.turnDomainText = ro.turnDomainText
        coreOpts.toolDecorate = ro.toolDecorate
        runAgent = (await import("@thincoder/core/agent.mjs")).runAgent // 动态 import（核 agent 链静态达 node:sqlite——W8 契约②）
      }
      const content = await runAgent(agent, turnInput, callbacks, coreOpts)
      traceStop("runAgent: turn ended normally", panel._stopClickTs)
      // 完成面（P4-I 断缝闭证）：核 loop 干净返回处补调（旧端 `agent.mjs:354` 同点同参）——干净回合槽回写
      // （`agentState`）+ webview `complete` 帧 + 会话列表刷新 +（非 digest）完成通知。
      callbacks.onComplete?.(content, agentState(agent))
      break
    } catch (e) {
      traceStop(`runAgent: threw ${e?.name} — unwinding`, panel._stopClickTs)
      // 续跑判定 = 核单源（#677 · I10——continueDecision；本端零第二分支——#127 ④ 双写退役）。
      // reason = 回合 controller 的 `signal.reason`（单源——与 CLI 同式 · #677 修正轮对齐；异信号窄边归一为 CLI 形，实证命中 ⇒ 二端同改另轮）。
      const abortReason = panel._abortController?.signal?.reason
      const decision = continueDecision(e, { autoTurn, autoApprove: panel._autoApprove, reason: abortReason })
      if (decision === "resume") {
        // Ctrl+I interrupt: the abort carries reason.interrupt — rebuild the controller and RESUME the
        // same turn (the interrupt message is already in history; the model continues from there).
        newTurnController(panel)
        continue
      }
      if (decision === "cap-stop") {
        // TURN-CAP-CONTINUE.md §1 #7 / D-TC15 (2026-09-26): the digest path no longer self-resumes —
        // an unattended tier has no one to answer, so the cap settles the turn (a partial digest
        // stays in history — no lost reports).
        postDigestCap(panel, "stop", e.turn) // §14 C-10：cap 行（stop——部分消化）
        tLog.result = "stopped"
        break
      }
      if (decision === "ask") {
        // Turn-cap exhaustion: offer to continue from the current context, NOT error
        // (CLI agent-turn.mjs parity — "Ran N turns. Continue?"). Rebuilding the controller +
        // resume re-runs the loop from the SAME history (the user message is already pushed;
        // resume=true skips re-pushing it). Unlimited continues — the user can Stop at any prompt.
        const willContinue = await askInPanel(
          `Agent reached ${e.turn} turns (limit). Continue from here?`,
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
      // "stop" ∕ "error" 两格：先持久化本回合（interrupted/errored turn —— finally 亦恒落盘，此存幂等）；`seed` 印章（2026-10-04 解锁批 · R4——槽三键在场零改写 ∥ 缺播种）。
      try {
        panel._saveLines(fullHistory, history, { seed: slotStamp }, turnSlot)
      } catch (saveErr) {
        console.error("[chat-panel] save after abort/error failed:", saveErr.message)
      }
      if (decision === "stop") {
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
  // §11 write-back：装配已把（新建的）顶层单例写回 ro.agent——同槽活绑定下本行即实读
  // 面板字段（#133：ro.agent ⇄ panel._agent 恒同槽；此行为幂等保留），下回合经 ensurePanelAgent
  // 复用同一对象（AC1——_engDesignTokens/_tasks 等回合间携带）。
  if (ro.agent) panel._agent = ro.agent
  // 件 1「sessionSignal ∕ inheritedGuard ∕ guardCarry ∕ distillState」行：autoTurn 后取回核 `_inheritedGuard`
  // 快照 → 面板 guard-carry 载体（下次用户回合 `inherited` 取出应用——D-S6）。`agent` 缺席（首段装配
  // 抛错）⇒ 两回填均跳过（不得掩盖原错）。
  if (autoTurn && agent?._inheritedGuard) panel._guardCarry = agent._inheritedGuard
  // 蒸馏载具回填（SEND-STALL-DISTILL §2.2 N1 / AC6a）：核承载体 = `agent._pendingDistill` ⇒ 回填
  // 面板 `pending` 槽（`panel-chat` 在本回合行加载**之前** await 它——机读线重载与压缩落地同步）。
  if (agent?._pendingDistill) (panel._distillState ??= { pending: null }).pending = agent._pendingDistill
}
