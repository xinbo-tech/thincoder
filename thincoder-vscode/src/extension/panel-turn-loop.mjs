/**
 * panel-turn-loop.mjs — 回合执行循环面（自 `panel-chat.mjs` 拆出——VSC 四档结构拆分批
 * 2026-09-18 · 设计 `docs/vsc/design/VSC-DEBT.md` §12.2.1）。
 *
 * 迁出段（逐字搬迁 · 既有注释一并随迁）：回合执行循环 `runTurnLoop`（原 `panel-chat.mjs:385-498`
 * ——runOpts 构造 + ContinueError/Ctrl+I 续跑 + 错误/中止持久化分支）+ 回合 controller 工厂
 * `newTurnController`（原 `:43-65`）。
 * 留主档（`panel-chat.mjs`）= 入口守卫段（`ensurePanelAgent` / `ensureMemoryHandle` 同址——
 * 结构机检约束 `test/engine-floor-guard.test.mjs:152-154`）+ 行加载 / 回调装配段 +
 * `runPanelChat` 包装 + `agentSlotMatches` / `ensurePanelAgent`。
 *
 * 缝保持（KD-12 · 承 KD-13）：`newTurnController` 迁出 + 主档 re-export（消费档
 * `chat-panel-messages.test.mjs:24` import 行零改）；`runTurnLoop` 原即模块私有（新档导出、
 * 主档 import——对外缝零变化）。
 * 依赖单向：`panel-chat → panel-turn-loop`（本档零 import 主档、零 import `panel-turn-stages.mjs`）。
 */
import { runAgent, ContinueError } from "../agent.mjs"
import { getMcpServers } from "./settings.mjs"
import { loadSkills } from "./skills.mjs"
import { collectEditorInjection } from "./editor-context.mjs"
import { traceStop } from "./stop-trace.mjs"
import { postDigestCap } from "./panel-callbacks.mjs"
import { pickupQueuedAtStepBoundary } from "./queued-pickup.mjs"

/** AGENT-LOOP-ASYNC-POOL.md §6.8 D-S9 controller 登记（2026-09-02 偏差修复 #3）：池 children 在 spawn 时刻持有当时的
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

/**
 * AGENT-LOOP-ASYNC-POOL.md §6.8 D-S6 guard-carry 主循环（2026-09-05 实践轮——自 runPanelChatImpl 按骨干—细节
 * 两层提取，verbatim + 签名化，语义零变）：runOpts 构造（guard 继承/会话句柄/持久化
 * 载荷）+ ContinueError/Ctrl+I 续跑循环 + 错误/中止持久化分支。回合骨架事件
 * （turn:start）留在调用点（impl 骨干）；本函数只跑 runAgent 续跑循环。
 * deps：阶段产物（text/cwd/p/callbacks/lines/autoTurn/susp/turnSlot）+ tLog
 * 载具（LOGGING 终止原因回传）。
 * §11（2026-09-08）：runOpts 砍 engState/planMode 状态载荷（hydrate 从槽 reconcile）；
 * runOpts 对象跨续跑迭代共用（resume 字段可变）——runAgent 把建好的顶层 agent 写回
 * ro.agent（agent.mjs write-back）——Ctrl+I/ContinueError 续跑与下回合复用同一单例。
 */
export async function runTurnLoop(panel, deps) {
  const { text, cwd, p, callbacks, images, history, fullHistory, autoTurn, upstreamTurn, susp, turnSlot, tLog, askInPanel, slotStamp } = deps
  let carryTaken = false
  // §11: guard-carry 只在本回合首个（resume=false）runAgent 应用一次（resume 迭代不重取）
  const inherited = (!autoTurn && !carryTaken) ? (panel._guardCarry ?? null) : undefined
  if (inherited) { carryTaken = true; panel._guardCarry = null }
  const ro = {
    agent: panel._agent, // §11 单例：存在且绑定匹配（ensurePanelAgent）→ runAgent hydrate 复用
    // ↑ 该初值仅保键序/可读：下方 bindPanelAgent 立即把本槽改为 ⇄ panel._agent 访问器（#133）
    mcpServers: getMcpServers(), images, skills: loadSkills(cwd), history, fullHistory, // skills 载荷 = [4] 层 systemPrompt 尾块消费面（D-CI2/D-CI3——死参数消除）
    injections: [collectEditorInjection(cwd)].filter(Boolean), resume: false,
    distillState: panel._distillState, distillSignal: panel._distillController?.signal,
    engPersist: { cwd, slot: turnSlot },
    // AGENT-LOOP-ASYNC-POOL.md §6.8 D-S6/D-S9: digest turns skip the input push (setupAgentRun autoTurn),
    // session children share the session abort signal, guard marks flow per tier.
    // AGENT-LOOP-ASYNC-POOL.md §6.8: the panel is the suspension driver — turn-end collection must NOT
    // drain settled entries (they stay pooled → the session digests them).
    // §6.27.12.12 ③（上行通道批）：`upstreamTurn` 三跳末段（解构 → 本 opts 字面量 → 核 `runAgent`
    // 读点）——仅选域文本基座，不进任何门（autoTurn 维持 auto 轮类语义）。
    autoTurn,
    upstreamTurn,
    suspDriven: true,
    sessionSignal: susp?.abort?.signal ?? null,
    inheritedGuard: inherited,
    guardCarry: autoTurn ? (panel._guardCarry ??= {}) : undefined,
  }
  // #133 次因：`ro.agent` ⇄ `panel._agent` 同槽活绑定——宿主 `opts.agent = agent` 写回当场
  // 落到面板字段（首回合 run 期载荷产者 / 取消路由即可达；下方回合末写回幂等保留）。
  bindPanelAgent(panel, ro)
  // F16 步边界 pickup（queue-visible 批 fix 轮 2026-09-24 · 用户 03:06 收正——C-B2-6 细则② ⓪）：
  // 用户回合在飞 ⇒ 端壳循环头投递回调（非中断——下一步生效）；系统轮（digest / 上行唤醒轮）不传（分流）
  ro.consumeQueuedInput = autoTurn ? null : () => pickupQueuedAtStepBoundary(panel, { history, fullHistory })
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
          // AGENT-LOOP-ASYNC-POOL.md §6.8 D-S9 ContinueError row (digest): NO panel — AUTO auto-resumes (§2 unified rule);
          // manual stops silently (partial digest stays in history — no lost reports).
          if (panel._autoApprove) {
            postDigestCap(panel, "auto", e.turn) // §14 C-10：cap 行（auto——继续推进）
            newTurnController(panel)
            continue
          }
          postDigestCap(panel, "stop", e.turn) // §14 C-10：cap 行（stop——部分消化）
          tLog.result = "stopped"
          break
        }
        // Turn-cap exhaustion: offer to continue from the current context, NOT error
        // (CLI agent-turn.mjs parity — "Ran N turns. Continue?"). Rebuilding the
        // controller + resume re-runs the loop from the SAME history (the user message
        // is already pushed; resume=true skips re-pushing it). Unlimited continues —
        // the user can Stop at any prompt.
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
      // Persist the interrupted/errored turn: the user message and any partial output
      // were already pushed into both lines by runAgent (pushReal). Without this save,
      // an abort/error loses the whole turn from disk (CLI parity: at most half a turn lost).
      // (The finally block below also saves unconditionally — CLI agent-turn.mjs parity —
      // so this catch-block save is now redundant on this path, but harmless.)
      try {
        panel._saveLines(fullHistory, history, slotStamp, turnSlot)
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
  // §11 write-back：runAgent 已把（新建的）顶层单例写回 ro.agent——同槽活绑定下本行即实读
  // 面板字段（#133：ro.agent ⇄ panel._agent 恒同槽；此行为幂等保留），下回合经 ensurePanelAgent
  // 复用同一对象（AC1——_engDesignTokens/_tasks 等回合间携带）。
  if (ro.agent) panel._agent = ro.agent
}
