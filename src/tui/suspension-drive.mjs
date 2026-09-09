/**
 * suspension-drive.mjs — §17 挂起会话驱动器（2026-09-05 module-split：agent-turn.mjs
 * 535 > 500 硬限——poolCounts + §17 挂起会话段 verbatim 迁入，语义零变；agent-turn.mjs
 * re-import（runAgentTurn ↔ suspensionSession 函数级静态环——模块求值期无顶层调用，
 * 环安全——session-slots ↔ session.mjs 同款先例）。
 *
 * §17（2026-09-02，AGENT-LOOP.md §9 D-S1..S9）：回合尾后台池非空 → 不阻塞等待，
 * 进入挂起态——挂起空闲输入开放（Enter = 新回合填单槽 + 唤醒）、busy（processing 含
 * digest）输入禁用（INPUT-LOCK-ASYNC C'——提交吞——2026-09-09）、settle 事件驱动
 * auto-turn 消化（手动档 organize-only / AUTO 档全语义）、池空 + 无待处理输入 → 补发
 * done 冻结自然退出。状态机行表见 AGENT-LOOP.md §9.2。
 */

// 函数级静态环（2026-09-05）：drive 的 digestTurn/用户回合经 runAgentTurn 递归进入
// agent-turn；agent-turn 的回合尾经 suspensionSession 进入本文件——互相 import。
import { runAgentTurn } from "./agent-turn.mjs"
import { freezeAllSubTasks, freezeReclaimDigestedBlocks } from "./subagent-blocks.mjs"
import { sweepToolBlocks } from "./tool-events.mjs"
import { logEvent } from "../log.mjs"
import { C } from "./ansi.mjs"
// ASYNC-RESULT-CONTAINER.md D1/D2：池 accessor（双池 absorb）+ pending 单容器停靠
import { getAsyncPool, parkAsyncPending } from "../agent-tools/async-settle.mjs"

// INPUT-LOCK-ASYNC（C'——2026-09-09，本档 docs/design/INPUT-LOCK-ASYNC.md）：R15 排队
// 用户指令合并（§24 D-24c——攒批计划/合并文案/上限常量）整批废弃
// ——busy 提交吞 + pendingInput 单槽化（至多一条待交接——单消息逐发不攒批）。
// 废弃记录见 AGENT-LOOP.md §11.3。

/** 后台池计数（LOGGING susp/digest 事件字段——pendingN/poolN）。
 *  poolN = _asyncSubagents + _asyncAdvisors（§24 D-24b advisor 池同面板计数——queued
 *  条目同样在 map 内——2026-09-03 code review #2：不再 +queue.length 双计）。
 *  R17（§25 D-R17a/b）：pendingN = pending 单容器 `_pendingAsyncResults` 条数（
 *  ASYNC-RESULT-CONTAINER.md D2——四族统一停靠——digest 驱动判据同单容器）。 */
export function poolCounts(agent) {
  const map = agent?._asyncSubagents
  const adv = agent?._asyncAdvisors
  const running = (map ? [...map.values()].filter((e) => e.status === "running").length : 0)
    + (adv ? [...adv.values()].filter((e) => e.status === "running").length : 0)
    + consultRunningChildren(agent)
  return {
    poolN: (map?.size ?? 0) + (adv?.size ?? 0),
    pendingN: pendingFamilyCount(agent),
    runningN: running,
  }
}

/** 运行中 consult children（会诊会话已跨回合——挂起判据/状态行计数同源）。 */
function consultRunningChildren(agent) {
  let n = 0
  for (const s of agent?._consultSessions?.values() ?? []) {
    if (!s.stopped) n += Math.max(0, s.pending ?? 0)
  }
  return n
}

/** pending 单容器条数（§25 D-R17a 消费驱动判据——T-R17j——ASYNC-RESULT-CONTAINER.md
 *  D2：四族统一 `_pendingAsyncResults` +role，不再分族三容器）。 */
export function pendingFamilyCount(agent) {
  return agent?._pendingAsyncResults?.length ?? 0
}

/** pending 单容器非空（digest 触发判据——D-S2/D-S9——§25 D-R17a）。 */
export function pendingFamiliesNonEmpty(agent) {
  return pendingFamilyCount(agent) > 0
}

/** pending 单容器条目（freezeReclaimDigestedBlocks 的归属比对表——四族同容器）。 */
export function allPendingEntries(agent) {
  return [...(agent?._pendingAsyncResults ?? [])]
}

// ─── §17 挂起会话（AGENT-LOOP.md §17 D-S2/D-S9 状态机行表）────────────────

/** 后台池存活判据（D-S2/F5 口径）：running/queued 子代理或后台评审，或已 settle 未注入结果
 *  （pending 单容器非空 = D-S3 "未注入"），或 running consult 会话（会诊跨回合——
 *  §25 D-R17a 挂起活度钩子——consult 启动回合尾即入挂起态）。回合尾与每次轮末都用它
 *  评估退出。§24 D-24b：_asyncAdvisors（后台评审池）与子代理池同判——评审飞行中挂起
 *  会话必须存活。 */
export function poolLive(agent) {
  const map = agent._asyncSubagents
  const adv = agent._asyncAdvisors
  return (map && map.size > 0) || (adv && adv.size > 0)
    || pendingFamilyCount(agent) > 0
    || consultRunningChildren(agent) > 0
}

/** D-S3 ③ 记账清扫：回合边界竞态落下的已 settle 项（settle 回调未及移交——发生在
 *  回合刚结束、_suspended 尚未置位的窗口）补入 pending。幂等：回调已移交的条目已从
 *  map 删除并带 _inPending 标记，不会重复入列。
 *  ASYNC-RESULT-CONTAINER.md D2：pending 单容器（parkAsyncPending——四族统一停靠
 *  +role；escalate 不再走独立流）。 */
function sweepSettledToPending(agent) {
  const maps = [getAsyncPool(agent, "subagent"), getAsyncPool(agent, "advisor")].filter((m) => m instanceof Map && m.size > 0)
  if (maps.length === 0) return
  for (const map of maps) {
    for (const e of [...map.values()]) {
      if (e.done && !e._inPending) {
        parkAsyncPending(agent, e)
        map.delete(String(e.id))
      }
    }
  }
}

/** 等待下一次 settle（running 子代理 promise 完成）或用户唤醒（Enter 入队 / Ctrl+C /
 *  会话 abort）。唤醒器经 state._suspWake 单槽注入；abort 监听兜底。 */
function waitForSettleOrWake(agent, state) {
  return new Promise((resolve) => {
    let finished = false
    const cleanup = () => {
      state._suspWake = null
      const i = (agent._asyncWaiters ?? []).indexOf(w)
      if (i >= 0) agent._asyncWaiters.splice(i, 1)
      agent._sessionAbort?.signal.removeEventListener("abort", onAbort)
    }
    const finish = (why) => {
      if (finished) return
      finished = true
      cleanup()
      resolve(why)
    }
    const w = () => finish("settle")
    const wake = () => finish("wake")
    const onAbort = () => finish("aborted")
    ;(agent._asyncWaiters ??= []).push(w)
    state._suspWake = wake
    if (agent._sessionAbort?.signal.aborted) { onAbort(); return }
    agent._sessionAbort?.signal.addEventListener("abort", onAbort, { once: true })
  })
}

/** 后台模式状态行文本（D-S8；17.5.4 #6 顺手对齐）："后台 N 子代理运行中 · M 完成待消化"
 *  ——"运行中" = running + queued（含后台评审——§24 D-24b 同面板计数）+ running consult
 *  children（R17——会诊跨回合）；"完成待消化" = pending 任一族移交项 + §17.5 回合尾留池
 *  的 settled 未消费项（挂起会话 sweep 前的可见窗口）。 */
function backgroundStatusText(agent) {
  const map = agent._asyncSubagents
  const adv = agent._asyncAdvisors
  const running = (map ? [...map.values()].filter((e) => e.status === "running").length : 0)
    + (adv ? [...adv.values()].filter((e) => e.status === "running").length : 0)
    + consultRunningChildren(agent)
  const queued = agent._asyncQueue?.length ?? 0
  const pending = pendingFamilyCount(agent)
  const doneInPool = (map ? [...map.values()].filter((e) => e.done).length : 0)
    + (adv ? [...adv.values()].filter((e) => e.done).length : 0) // §17.5 留池未消费
  const awaiting = pending + doneInPool
  const active = running + queued
  return active > 0 || awaiting > 0
    ? `后台 ${active} 子代理运行中${awaiting ? ` · ${awaiting} 完成待消化` : ""}`
    : "后台子代理收尾…"
}

/** 消化轮：系统驱动的 auto-turn（D-S6）。手动档不传权限/问答 handler（D-S7 装配
 *  契约——denied 不弹面板、不悬挂）；AUTO 档沿用普通回调（autoApprove 短路自动
 *  执行）。_suspended 保持 true：消化中 settle 延迟冻结 + 移交 pending。R17：pending
 *  计数/消化触发 = 任一 pending 族（T-R17j——consult/escalate 空闲 settle 也触发消化轮）。 */
async function digestTurn(ctx) {
  const { agent, pushLine } = ctx
  const manual = !agent.autoApprove
  pushLine(manual
    ? "[auto-turn: digesting finished subagent reports…]"
    : "[auto-turn: continuing background work…]", C.dim)
  const digestCtx = manual
    ? { ...ctx, askPermission: null, askBatchPermission: null, askQuestion: null }
    : ctx
  // LOGGING：digest:* 事件（D-S9 消化轮边界——LOGGING.md F-L4 挂起态覆盖）
  const d0 = Date.now()
  const pend0 = pendingFamilyCount(agent)
  logEvent("digest:start", { pendingN: pend0 })
  await runAgentTurn(digestCtx, "", { autoTurn: true, skipSession: true })
  logEvent("digest:end", { pendingN: pendingFamilyCount(agent), ms: Date.now() - d0 })
}

/**
 * §17 挂起会话驱动（D-S9 行表；由 runAgentTurn 回合尾进入，池空自然退出）：
 * - suspension：池项 settle → 入 pending → 开 auto-turn（合并消化近邻 settle）；
 *   挂起空闲用户 Enter → pendingInput 单槽（busy 含 digest 提交吞——INPUT-LOCK-ASYNC）
 *   ——用户输入优先于 digest；
 * - auto-turn：消化中 settle 不并发开新轮（单 runAgent 循环），轮末按 pending/池态
 *   续开合并消化轮或回挂起；pendingInput 非空 → 以该消息开新回合（不触发新 digest）；
 * - §17.5.5：每次消化/会话内用户回合消费 pending 后 → freezeReclaimDigestedBlocks
 *   逐条冻结回收（消化完成块不滞留面板——不等池空；settle 锚点 splice——digest 总览
 *   文本之前——round1 #1 裁定）；
 * - 退出：池空 + pending 空 + 无待处理输入 → freezeAllSubTasks 补发冻结（仅兜底
 *   未消化残项——17.5.5 块回收与池空解耦）→ idle。
 * _suspended 翻转：会话期 true（settle 回调据此延迟冻结 + 移交 pending）；会话内
 * 用户回合执行期翻 false（普通回合语义：settle 即冻结 + 回合尾直注入 ①）。
 */
export async function suspensionSession(ctx) {
  const { agent, state, render, pushLine } = ctx
  state.pendingInput ??= []
  state._suspAborted = false
  agent._suspended = true
  agent._sessionSignal = agent._sessionAbort.signal // 会话内 spawn 的 children 共享（subagent.mjs）
  state.suspended = true
  state._suspPending = false // 偏差 #1：进入真正挂起态——标志只在释放窗口期有效（此后由 state.suspended 分流）
  const suspTick = setInterval(() => {
    if (state.suspended && !state.processing) {
      state.status = backgroundStatusText(agent)
      render()
    }
  }, 1000)
  state.status = backgroundStatusText(agent)
  render()
  // LOGGING：susp:* 事件（挂起态进入/退出——F-L4；挂起期输入事件 v1 不记——refinement #1）
  const s0 = Date.now()
  logEvent("susp:enter", poolCounts(agent))
  try {
    while (!state._suspAborted && !agent._sessionAbort.signal.aborted) {
      sweepSettledToPending(agent)
      // 1. 用户输入优先（D-S5）：pendingInput 单槽（INPUT-LOCK-ASYNC C'——busy（processing
      //    含 digest）提交吞——Enter 只可能落在挂起空闲/释放窗口——至多一条待交接——driver
      //    消费清槽即开新回合）。R15 攒批/queue 双源已随排队机制废弃收敛（2026-09-09——
      //    单消息交接——无合并无 /cmd 分流——key-handler 只收非斜杠文本——单消息逐发）。
      if ((state.pendingInput?.length ?? 0) > 0) {
        const head = String(state.pendingInput.shift())
        agent._suspended = false // 用户回合 = 普通回合语义（① 直注入 + settle 即冻结）
        await runAgentTurn(ctx, head, { skipSession: true })
        agent._suspended = true
        // §17.5.5：该回合消化完 pending（run 首行注入）→ 逐条冻结回收驻留块
        // （不等池空——settle 锚点 splice——digest 总览文本之前；与 digest 回收同规则）
        // R17：回收比对 = pending 单容器（四族统一——ASYNC-RESULT-CONTAINER.md D2）
        freezeReclaimDigestedBlocks(state, allPendingEntries(agent))
        state.status = backgroundStatusText(agent)
        continue
      }
      // 2. pending 任一族非空 → 合并消化轮（注入由 runAgent 首行统一完成——D-S3 单注入点；
      //    R17 判据推广——consult/escalate 族同样触发——T-R17j）
      if (pendingFamiliesNonEmpty(agent)) {
        await digestTurn(ctx)
        // §17.5.5 实测修订（2026-09-03）：digest 消化完成（pending 条目已注入）→ 逐条补发
        // done 冻结回收——不等池空——块从面板移除进流（settle 锚点 splice 落位——digest
        // 总览文本之前——round1 #1 裁定）；池空 freeze-out 仅兜底未消化残项（挂起会话
        // 结束统一清场）——块回收与池空解耦（T-H7/AC-H5）。
        // 归属不变式：会话内任何 run 开始前 pinned 块（awaitingDigest）的条目必在 pending
        // 任一族——run 消费后不在 pending 的 pinned 块即本 run 消化者（无需快照即精确归属）。
        freezeReclaimDigestedBlocks(state, allPendingEntries(agent))
        state.status = backgroundStatusText(agent)
        continue
      }
      // 3. 池空（无 running/queued/未注入）→ 自然退出回 idle（补发冻结在 finally）
      if (!poolLive(agent)) break
      // 4. 等下一 settle / 用户唤醒（Enter 入队、Ctrl+C）
      await waitForSettleOrWake(agent, state)
    }
  } finally {
    clearInterval(suspTick)
    const aborted = state._suspAborted || agent._sessionAbort.signal.aborted
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
      // §15 abort 语义：清池不注入（用户显式停——不注入陈旧错误）
      agent._asyncSubagents?.clear()
      agent._asyncAdvisors?.clear()
      agent._asyncQueue = []
      // ASYNC-RESULT-CONTAINER.md D2：pending 单容器——中止清容器不注入陈旧结果（四族
      // 统一一处清；consult 会话标记 stopped——settle 不入 digest 流——T-R17c）+
      // children abort。
      agent._pendingAsyncResults = []
      const { cleanupConsultSessions } = await import("../agent-tools/consult.mjs")
      cleanupConsultSessions(agent)
      // §17 round2 偏差 #2-CLI（code review round2 #2-CLI）+ INPUT-LOCK 单槽化：中止时
      // 不静默丢弃挂起期输入——Enter 已清空输入框并入 pendingInput（用户视为已发送）——
      // 单槽语义下残余至多一条——转回 state.queue（{text} 单条目，下个普通回合的队列
      // 循环续发——零丢失）+ 提示行明示去向（不静默丢）。
      if ((state.pendingInput?.length ?? 0) > 0) {
        state.queue.push({ text: String(state.pendingInput.shift()) })
        pushLine(`[background work stopped — the message you entered will run as a normal turn]`, C.warn)
      }
    } else {
      // D-S3 ③ 兜底：退出前残余（极端竞态）直注入再退——结果零丢失（AC-S2；
      // ASYNC-RESULT-CONTAINER.md D2：pending 单容器一处清——注入器按 role 分发
      // （consult → injectConsultResult；其余 → injectAsyncResult——四族同容器）。
      const { injectAsyncResult } = await import("../agent-tools/subagent.mjs")
      const { injectConsultResult } = await import("../agent-tools/consult.mjs")
      const residual = agent._pendingAsyncResults
      if (residual?.length) {
        for (const e of residual.splice(0)) {
          if (e.role === "consult") await injectConsultResult(agent, e)
          else await injectAsyncResult(agent, e)
        }
      }
    }
    // 补发 done 冻结：驻留面板的 awaiting-digest 块随池空冻结进流（T-S14）
    freezeAllSubTasks(state)
    sweepToolBlocks(state)
    state.status = "Ready"
    render()
  }
}
