/**
 * suspension-drive.mjs — AGENT-LOOP-ASYNC-POOL.md §6.8 挂起会话驱动器（TUI 面——**取核驱动装配**）。
 *
 * B1-P3（2026-09-29 · 批档 `2026-09-29-parity-b1-vsc-core` §2.4-2）：状态机本体（步骤 1–4 ∕ 退出清场 ∕
 * 等待三态 ∕ timer 第四态）出核 `@thincoder/core/agent/suspension.mjs` `startSuspension`——本档 =
 * 装配面（carrier ∕ runTurn ∕ hooks ∕ injectResidual ∕ timerFace）+ 壳（ticker ∕ `_suspAborted` ∕
 * `_suspWake` ∕ 渲染 ∕ 状态行文本）。端差面：carrier = `agent`（CLI 形——池 ∕ pending ∕ `_suspended`
 * 跨 run 存活）；输入面 = **宿主队列同数组**（核增补 C `ctx.inputQueue`——key-handler 直写 ∕ 步边界
 * pickup ∕ 渲染与驱动消费同一数组；取项 = 合并批 + 消费回执行）；唤醒面 = `state._suspWake`（绑定
 * `handle.wake`）；残输入 = 核 `done.residualInput`（中止径 → `state.queue` 回搬 + 提示行；idle 径 →
 * 回填 `state.pendingInput`——零丢失）。digest 可见面落**本档 runTurn 包装**（不注册核钩——desktop
 * 先例：核钩在非 Abort 失败径不出 `end`）；F-UC7：唤醒轮同走 auto-turn。
 */
// 函数级静态环（2026-09-05）：drive 的回合经 runAgentTurn 递归进入 agent-turn；agent-turn 回合尾
// 经 suspensionSession 进入本文件——互相 import（求值期无顶层调用，环安全）。
import { runAgentTurn } from "./agent-turn.mjs"
import { deliverExpiredTimers, timerWakeEnabled } from "./timer-watch.mjs"
import { freezeAllSubTasks, freezeReclaimDigestedBlocks } from "./subagent-blocks.mjs"
import { sweepToolBlocks } from "./tool-events.mjs"
import { planQueuedInput } from "./queued-merge.mjs"
import { logEvent } from "@thincoder/core/log.mjs"
import { pendingTimerDeadline } from "@thincoder/core/agent/timers.mjs"
import { C } from "./ansi.mjs"
// OOM 释放面（AGENT-LOOP.md §6.15 消费点③）；ask 携参 ∕ 消化行文案 = 核单源
import { releaseSettledEntry } from "@thincoder/core/agent-tools/async-settle.mjs"
import { upstreamAskLabelVars } from "@thincoder/core/agent-tools/parent-channel.mjs"
import { t } from "@thincoder/core/i18n.mjs"
// B1-P3：驱动本体 = 核单源（本档 re-export 保端内 import 面——agent-turn.mjs 零改）
import { poolLive, startSuspension } from "@thincoder/core/agent/suspension.mjs"

export { poolLive }

/** 池快照（susp 日志 ∕ 状态行共用）：两池合计 + consult children（R17）；`queued` = `_asyncQueue`
 *  长度（与核池 `status === "queued"` 同值——入/出队与 status 翻转同点）；`done` = 留池 settled。 */
function poolSnapshot(agent) {
  const entries = []
  for (const key of ["_asyncSubagents", "_asyncAdvisors"]) {
    const map = agent?.[key]
    if (map instanceof Map) entries.push(...map.values())
  }
  let consult = 0
  for (const s of agent?._consultSessions?.values() ?? []) if (!s.stopped) consult += Math.max(0, s.pending ?? 0)
  return {
    poolN: entries.length,
    running: entries.filter((e) => e.status === "running").length + consult,
    queued: agent?._asyncQueue?.length ?? 0,
    pending: pendingFamilyCount(agent),
    done: entries.filter((e) => e.done).length,
  }
}

/** 后台池计数（LOGGING susp/digest 事件字段——pendingN/poolN；D2：pendingN = 单容器条数）。 */
export function poolCounts(agent) {
  const s = poolSnapshot(agent)
  return { poolN: s.poolN, pendingN: s.pending, runningN: s.running }
}

/** pending 单容器条数（CONSULTATION.md §6.2 D-R17a 消费驱动判据——T-R17j；D2 四族统一容器）。 */
export function pendingFamilyCount(agent) {
  return agent?._pendingAsyncResults?.length ?? 0
}

/** pending 单容器非空（导出面保留名——核驱动判据已内化，消费面名不变）。 */
export function pendingFamiliesNonEmpty(agent) {
  return pendingFamilyCount(agent) > 0
}

/** pending 单容器条目（freezeReclaimDigestedBlocks 的归属比对表——四族同容器）。 */
export function allPendingEntries(agent) {
  return [...(agent?._pendingAsyncResults ?? [])]
}

/** 后台状态行文本（D-S8）："后台 N 子代理运行中 · M 完成待消化"；文案保形。 */
function backgroundStatusText(agent) {
  const s = poolSnapshot(agent)
  const awaiting = s.pending + s.done
  const active = s.running + s.queued
  return active > 0 || awaiting > 0
    ? `后台 ${active} 子代理运行中${awaiting ? ` · ${awaiting} 完成待消化` : ""}`
    : "后台子代理收尾…"
}

/** 消化轮：系统驱动的 auto-turn（D-S6）。手动档不传权限/问答 handler（D-S7——denied 不弹面板
 *  不悬挂）；F-UC8：标签按因两档、两行同守 `pend0 > 0`、终态 ≠ ok ⇒ aborted。 */
async function digestTurn(ctx, upstream = false) {
  const { agent, pushLine } = ctx
  const manual = !agent.autoApprove
  const pend0 = pendingFamilyCount(agent) // 起跑数前置（起跑行与收尾行同源）
  const ask = upstream ? upstreamAskLabelVars(agent) : null
  pushLine(ask ? t("digest.turnLabelAsk", ask) : t("digest.turnLabel"), C.dim)
  if (pend0 > 0) pushLine(t("digest.start", { n: pend0 }), C.dim)
  const digestCtx = manual
    ? { ...ctx, askPermission: null, askBatchPermission: null, askQuestion: null }
    : ctx
  const d0 = Date.now()
  logEvent("digest:start", { pendingN: pend0, ...(upstream ? { upstream: true } : {}) })
  const outcome = await runAgentTurn(digestCtx, "", { autoTurn: true, upstreamTurn: upstream, skipSession: true })
  logEvent("digest:end", { pendingN: pendingFamilyCount(agent), ms: Date.now() - d0, ...(upstream ? { upstream: true } : {}) })
  const seconds = ((Date.now() - d0) / 1000).toFixed(1)
  if (pend0 > 0) pushLine(t(outcome === "ok" ? "digest.done" : "digest.aborted", { n: pend0, seconds }), C.dim)
}

/** 回合执行器（核 `ctx.runTurn`）：用户回合（取项缝产物 text）/ 消化轮 / 唤醒轮 / timer 轮。
 *  digest ∕ 唤醒两族走 digestTurn；用户/timer 轮直发；失败两径照旧上抛（核 catch 语义）。 */
function driveTurn(ctx, item, opts = {}) {
  const text = typeof item === "string" ? item : String(item?.text ?? "")
  if (opts.autoTurn === true && opts.timerTurn !== true) return digestTurn(ctx, opts.upstreamTurn === true)
  return runAgentTurn(ctx, text, { ...opts, skipSession: true })
}

/** 取项缝（核 `ctx.takeInput`——缺省 shift）：按合并计划取批 + 消费回执行（TUI.md §7.5）；
 *  `/cmd` 首动作 = 不可达支（斜杠 busy 禁发——`key-handler-busy.mjs:24` ∕ `key-handler-edit.mjs:59`
 *  双门禁）⇒ null 零动作（条目不消费，落核第 2 步）。 */
function takeTurnInput(ctx, queue) {
  const action = planQueuedInput(queue)[0]
  if (action.kind !== "turn") return null
  queue.splice(0, action.count)
  ctx.pushLine("[sending queued message]", C.tool)
  return action.text
}

/** 退出残余注入（idle 清场——结果零丢失）：核注入器按 role 分发 + 释放条目持有（OOM 面）。 */
async function injectResidual(agent, item) {
  if (item?.role === "consult") {
    const { injectConsultResult } = await import("@thincoder/core/agent-tools/consult.mjs")
    await injectConsultResult(agent, item)
  } else {
    const { injectAsyncResult } = await import("@thincoder/core/agent-tools/subagent.mjs")
    await injectAsyncResult(agent, item)
  }
  releaseSettledEntry(item)
}

/**
 * §6.8 挂起会话驱动（D-S9 行表；由 runAgentTurn 回合尾进入，池空自然退出）：状态机本体在核
 * `startSuspension`；本档 = 装配 + 壳。`agent._sessionSignal/_sessionAbort` 生命周期留端。
 */
export async function suspensionSession(ctx) {
  const { agent, state, render, pushLine } = ctx
  state.pendingInput ??= []
  state._suspAborted = false
  agent._suspended = true
  agent._sessionSignal = agent._sessionAbort.signal // 会话内 spawn 的 children 共享（subagent.mjs）
  state.suspended = true
  state._suspPending = false // 偏差 #1：进入真正挂起态——标志只在释放窗口期有效
  const suspTick = setInterval(() => {
    if (state.suspended && !state.processing) {
      state.status = backgroundStatusText(agent)
      render()
    }
  }, 1000)
  state.status = backgroundStatusText(agent)
  render()
  const s0 = Date.now()
  logEvent("susp:enter", poolCounts(agent))
  const abortSignal = agent._sessionAbort.signal
  const handle = startSuspension({
    carrier: agent,
    inputQueue: state.pendingInput,
    abortSignal,
    runTurn: (item, opts = {}) => driveTurn(ctx, item, opts),
    takeInput: (queue) => takeTurnInput(ctx, queue),
    injectResidual: (item) => injectResidual(agent, item),
    timerFace: {
      // §6.30.2 载体③：窗内 deadline 现算 + 到期兑现（交付真 ⇒ timer 轮；不等池空）
      // §6.30.10 关的射程：开关关 ⇒ `deadline` 亦 `null`（零注册）——判据包形与桌面 `timerFaceOf` 同形同源
      deadline: () => (timerWakeEnabled(agent) ? pendingTimerDeadline(agent) : null),
      deliver: () => deliverExpiredTimers(ctx) > 0,
    },
    hooks: {
      onCounts: () => { state.status = backgroundStatusText(agent); render() },
      // 回收：比对表 = pending 单容器实况；冻结：退出兜底补发（T-S14）
      reclaim: () => freezeReclaimDigestedBlocks(state, allPendingEntries(agent)),
      freezeAll: () => { freezeAllSubTasks(state); sweepToolBlocks(state); state.status = "Ready"; render() },
    },
    timer: ctx.timer,
    clear: ctx.clear,
  })
  // 唤醒单槽 → 核句柄（key-handler Enter 入队 ∕ Ctrl+C 中止同点调用——核等待期外零动作）。
  state._suspWake = () => handle.wake()
  let exitInput = null // 残输入（成功径 = 核兑现值；失败径 = null ⇒ 回落共享数组实况）
  try {
    const res = await handle.done
    exitInput = Array.isArray(res?.residualInput) ? res.residualInput : []
  } finally {
    clearInterval(suspTick)
    const aborted = state._suspAborted || abortSignal.aborted
    if (aborted && (agent._asyncSubagents?.size ?? 0) > 0) logEvent("ev:stopped", { poolN: agent._asyncSubagents?.size ?? 0, where: "suspension-abort" })
    logEvent("susp:exit", { ...poolCounts(agent), ms: Date.now() - s0, reason: aborted ? "aborted" : "idle" })
    agent._suspended = false
    agent._sessionSignal = null
    agent._sessionAbort = null
    agent._sessionAbortAll = null // 偏差 #3：会话期 controller 集合随句柄一并释放
    state.suspended = false
    state._suspWake = null
    state.suspAbortArmed = false // round2 偏差 #4：会话退出即解除挂起中止武装（防跨会话粘滞）
    if (aborted) {
      // 中止不静默丢弃队列内输入（用户视为已发送）：按合并计划全量转回 state.queue + 提示行明示去向。
      const residual = exitInput ?? state.pendingInput
      if (residual.length > 0) {
        for (const a of planQueuedInput(residual)) state.queue.push({ text: a.text })
        residual.length = 0
        pushLine(`[background work stopped — the message you entered will run as a normal turn]`, C.warn)
      }
    } else if (exitInput?.length > 0) {
      // idle：残项回填宿主队列（既有消费点续接——核 splice 已取出 ⇒ 同值回填、零重复）
      state.pendingInput.push(...exitInput)
    }
    render()
  }
}
