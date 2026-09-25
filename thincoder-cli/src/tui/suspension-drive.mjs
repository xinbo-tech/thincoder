/**
 * suspension-drive.mjs — AGENT-LOOP-ASYNC-POOL.md §6.8 挂起会话驱动器（2026-09-05 module-split：agent-turn.mjs
 * 535 > 500 硬限——poolCounts + AGENT-LOOP-ASYNC-POOL.md §6.8 挂起会话段 verbatim 迁入，语义零变；agent-turn.mjs
 * re-import（runAgentTurn ↔ suspensionSession 函数级静态环——模块求值期无顶层调用，
 * 环安全——session-slots ↔ session.mjs 同款先例）。
 *
 * AGENT-LOOP-ASYNC-POOL.md §6.8（2026-09-02）：回合尾后台池非空 → 不阻塞等待，
 * 进入挂起态——挂起空闲输入开放（Enter = 新回合入队列 + 唤醒）、busy（processing 含
 * digest）提交亦入同队列（容量 8——busy-extend 批 2026-09-22 · queue-visible 批 2026-09-24；
 * `TUI-INPUT-BOX.md` §4.1）、settle 事件驱动
 * auto-turn 消化（手动档 organize-only / AUTO 档全语义）、池空 + 无待处理输入 → 补发
 * done 冻结自然退出。状态机行表见 AGENT-LOOP-ASYNC-POOL.md §6.8。
 * F-UC7（2026-09-19 批，AGENT-LOOP-UPSTREAM.md §6.27.12）：第二开轮源 = 未 drain 的上行
 * ask（`upstreamWaiting` 谓词——ask 入队即唤醒本驱动）；唤醒轮同走 auto-turn（旗标
 * `upstreamTurn` 供核域文本选择）。
 * F-UC8（2026-09-21 批，§6.27.12.13）：可见提示面**按因两档**（ask 携「谁 + 啥」——
 * 核单点 `upstreamAskLabelVars` / digest）+ 起跑数行与轮尾收尾行同守 `pend0 > 0`。
 */

// 函数级静态环（2026-09-05）：drive 的 digestTurn/用户回合经 runAgentTurn 递归进入
// agent-turn；agent-turn 的回合尾经 suspensionSession 进入本文件——互相 import。
import { runAgentTurn } from "./agent-turn.mjs"
import { freezeAllSubTasks, freezeReclaimDigestedBlocks } from "./subagent-blocks.mjs"
import { sweepToolBlocks } from "./tool-events.mjs"
import { planQueuedInput } from "./queued-merge.mjs"
import { logEvent } from "@thincoder/core/log.mjs"
import { C } from "./ansi.mjs"
// ASYNC-RESULT-CONTAINER.md D1/D2：池 accessor（双池 absorb）+ pending 单容器停靠
import { getAsyncPool, parkAsyncPending, releaseSettledEntry } from "@thincoder/core/agent-tools/async-settle.mjs"
// F-UC7（AGENT-LOOP-UPSTREAM.md §6.27.12——2026-09-19 批）：上行 ask 开轮谓词单点（核导出）
// F-UC8（§6.27.12.13 ②——2026-09-21 批）：ask 提示行携参单点（同档导出——显示面单源）
import { upstreamAskLabelVars, upstreamWaiting } from "@thincoder/core/agent-tools/parent-channel.mjs"
// X9（2026-09-20 端差·显示面消差批）：消化收尾文案单源 = 核 i18n 容器（禁第三份字面）
import { t } from "@thincoder/core/i18n.mjs"
// 批 4 CLI-ASYNC-DISCARD（AGENT-LOOP-ASYNC-POOL.md §6.20）：中止分支「只清已死」收尾单点
import { discardAbortedPool, discardAbortedAdvisors } from "@thincoder/core/agent-tools/async-discard.mjs"

// queue-visible 批（2026-09-24）：R15 排队用户指令合并**恢复**（攒批计划 / 合并文案 / 上限常量
// ——`queued-merge.mjs` 单源；待发送块 / 状态栏四态 = TUI.md §7.5）；队列容量 8（满队 = 第 9 条
// 拒 + 提示 + 文本保留）；busy 提交入队 = busy-extend 批 2026-09-22 扩面。

/** 后台池计数（LOGGING susp/digest 事件字段——pendingN/poolN）。
 *  poolN = _asyncSubagents + _asyncAdvisors（AGENT-LOOP-ASYNC-POOL.md §6.10 D-24b advisor 池同面板计数——queued
 *  条目同样在 map 内——2026-09-03 code review #2：不再 +queue.length 双计）。
 *  R17（CONSULTATION.md §6.2 D-R17a/b）：pendingN = pending 单容器 `_pendingAsyncResults` 条数（
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

/** pending 单容器条数（CONSULTATION.md §6.2 D-R17a 消费驱动判据——T-R17j——ASYNC-RESULT-CONTAINER.md
 *  D2：四族统一 `_pendingAsyncResults` +role，不再分族三容器）。 */
export function pendingFamilyCount(agent) {
  return agent?._pendingAsyncResults?.length ?? 0
}

/** pending 单容器非空（digest 触发判据——D-S2/D-S9——§6.2 D-R17a）。 */
export function pendingFamiliesNonEmpty(agent) {
  return pendingFamilyCount(agent) > 0
}

/** pending 单容器条目（freezeReclaimDigestedBlocks 的归属比对表——四族同容器）。 */
export function allPendingEntries(agent) {
  return [...(agent?._pendingAsyncResults ?? [])]
}

// ─── 挂起会话（AGENT-LOOP-ASYNC-POOL.md §6.8 D-S2/D-S9 状态机行表）────────────────

/** 后台池存活判据（D-S2/F5 口径）：running/queued 子代理或后台评审，或已 settle 未注入结果
 *  （pending 单容器非空 = D-S3 "未注入"），或 running consult 会话（会诊跨回合——
 *  CONSULTATION.md §6.2 D-R17a 挂起活度钩子——consult 启动回合尾即入挂起态）。回合尾与每次轮末都用它
 *  评估退出。AGENT-LOOP-ASYNC-POOL.md §6.10 D-24b：_asyncAdvisors（后台评审池）与子代理池同判——评审飞行中挂起
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
 *  ——"运行中" = running + queued（含后台评审——§6.10 D-24b 同面板计数）+ running consult
 *  children（R17——会诊跨回合）；"完成待消化" = pending 任一族移交项 + AGENT-LOOP-ASYNC-POOL.md §6.8 回合尾留池
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
    + (adv ? [...adv.values()].filter((e) => e.done).length : 0) // AGENT-LOOP-ASYNC-POOL.md §6.8 留池未消费
  const awaiting = pending + doneInPool
  const active = running + queued
  return active > 0 || awaiting > 0
    ? `后台 ${active} 子代理运行中${awaiting ? ` · ${awaiting} 完成待消化` : ""}`
    : "后台子代理收尾…"
}

/** 消化轮：系统驱动的 auto-turn（D-S6）。手动档不传权限/问答 handler（D-S7 装配
 *  契约——denied 不弹面板、不悬挂）；AUTO 档沿用普通回调（autoApprove 短路自动
 *  执行）。_suspended 保持 true：消化中 settle 延迟冻结 + 移交 pending。R17：pending
 *  计数/消化触发 = 任一 pending 族（T-R17j——consult/escalate 空闲 settle 也触发消化轮）。
 *  F-UC7（§6.27.12.5 D）：`upstream` = 未 drain 的 ask 在场（唤醒轮）——旗标随 auto 轮
 *  贯通到核 `runAgent`（域文本选择面）、`digest:*` 载荷条件携带 `upstream: true`（宿主
 *  日志区分唤醒轮与 digest 轮——两端同规）。
 *  F-UC8（§6.27.12.13 ①–③）：可见提示面**按因两档 × 全档**——标签行 ask 携「谁 + 啥」
 *  （核容器键，CLI 零自持字面）/ digest（manual 与 AUTO 同判——泛句退场）；起跑数行
 *  与轮尾收尾行同守 `pend0 > 0`（ask-only 轮两行皆不出）。 */
async function digestTurn(ctx, upstream = false) {
  const { agent, pushLine } = ctx
  const manual = !agent.autoApprove
  // 起跑数前置（§6.27.12.13 ③）：起跑行与轮尾收尾行同源（皆 = 起跑口径）
  const pend0 = pendingFamilyCount(agent)
  // 标签两档（§6.27.12.13 ①）：ask 因恒优先——携参单源 = 核 `upstreamAskLabelVars`
  // （队首 ask 的 `from` + 单行归一截断 `msg`）；digest 因沿用既有字面；AUTO 档同判
  // （泛句无生产者——开轮因穷尽；模式可见性另有 `AUTO│` 横幅载体）。
  const ask = upstream ? upstreamAskLabelVars(agent) : null
  pushLine(ask ? t("digest.turnLabelAsk", ask) : t("digest.turnLabel"), C.dim)
  // 起跑数行（对位 VSC `.digest-status` 元素）：`n > 0` 规则——ask-only 轮（`n = 0`）零行
  if (pend0 > 0) pushLine(t("digest.start", { n: pend0 }), C.dim)
  const digestCtx = manual
    ? { ...ctx, askPermission: null, askBatchPermission: null, askQuestion: null }
    : ctx
  // LOGGING：digest:* 事件（D-S9 消化轮边界——LOGGING.md F-L4 挂起态覆盖）
  const d0 = Date.now()
  logEvent("digest:start", { pendingN: pend0, ...(upstream ? { upstream: true } : {}) })
  const outcome = await runAgentTurn(digestCtx, "", { autoTurn: true, upstreamTurn: upstream, skipSession: true })
  logEvent("digest:end", { pendingN: pendingFamilyCount(agent), ms: Date.now() - d0, ...(upstream ? { upstream: true } : {}) })
  // X9（2026-09-20 端差·显示面消差批）：轮尾**可见**收尾行（修前只有 `digest:end` 日志事件——
  // 用户不可见；对位 VSC `webview/chat.js` `showDigestStatus` end 段）。计数口径 = **起跑数**
  // `pend0`（与 VSC `suspension.mjs` 起跑 post 同源）；文案单源 = 核 i18n `digest.done` /
  // `digest.aborted`；终态 ≠ ok（中止/失败）⇒ aborted 形态（VSC ok 旗标同口径）。
  // F-UC8 守卫（§6.27.12.13 ③）：`pend0 = 0`（ask-only 轮）⇒ **零收尾行**——与起跑行
  // 同规则（两行成对）；done / aborted 两形态同判（VSC 零动作守卫先于 ok 判）。
  const seconds = ((Date.now() - d0) / 1000).toFixed(1)
  if (pend0 > 0) pushLine(t(outcome === "ok" ? "digest.done" : "digest.aborted", { n: pend0, seconds }), C.dim)
}

/**
 * AGENT-LOOP-ASYNC-POOL.md §6.8 挂起会话驱动（D-S9 行表；由 runAgentTurn 回合尾进入，池空自然退出）：
 * - suspension：池项 settle → 入 pending → 开 auto-turn（合并消化近邻 settle）；
 *   上行 ask 入队 → 唤醒 + 谓词 → 开唤醒轮（F-UC7——谓词先于池空退出判，见第 2 步）；
 *   挂起空闲用户 Enter、会话内 busy Enter → pendingInput 队列（容量 8——busy-extend
 *   2026-09-22 同判据；queue-visible 批 2026-09-24 按合并计划取批）
 *   ——用户输入优先于 digest；
 * - auto-turn：消化中 settle 不并发开新轮（单 runAgent 循环），轮末按 pending/池态
 *   续开合并消化轮或回挂起；pendingInput 非空 → 以本批合并消息开新回合（不触发新 digest）；
 * - AGENT-LOOP-ASYNC-POOL.md §6.8：每次消化/会话内用户回合消费 pending 后 → freezeReclaimDigestedBlocks
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
      // 1. 用户输入优先（D-S5）：pendingInput 队列（容量 8——INPUT-LOCK-ASYNC C'；busy
      //    （processing 含 digest）提交亦入本队列——TUI-INPUT-BOX.md §4.1；queue-visible 批
      //    2026-09-24：按合并计划取批（R15 恢复）——本批合并消息开新回合，先于 digest 合并）。
      if ((state.pendingInput?.length ?? 0) > 0) {
        const action = planQueuedInput(state.pendingInput)[0] // 按合并计划取批（首动作 = 本批）
        // /cmd 首动作 = 入队门禁不可达的防御面（斜杠 busy 禁发——§4.1 条件 3）⇒ 不消费
        if (action.kind === "turn") {
          state.pendingInput.splice(0, action.count)
          pushLine("[sending queued message]", C.tool) // F16 消费回执（TUI.md §7.5——driver 消费点）
          agent._suspended = false // 用户回合 = 普通回合语义（① 直注入 + settle 即冻结）
          await runAgentTurn(ctx, action.text, { skipSession: true })
          agent._suspended = true
          // AGENT-LOOP-ASYNC-POOL.md §6.8：该回合消化完 pending（run 首行注入）→ 逐条冻结回收驻留块
          // （不等池空——settle 锚点 splice——digest 总览文本之前；与 digest 回收同规则）
          // R17：回收比对 = pending 单容器（四族统一——ASYNC-RESULT-CONTAINER.md D2）
          freezeReclaimDigestedBlocks(state, allPendingEntries(agent))
          state.status = backgroundStatusText(agent)
          continue
        }
      }
      // 2. pending 任一族非空**或存在未 drain 的 ask** → 合并消化轮 / 唤醒轮（注入由 runAgent
      //    首行 + 循环头统一完成——D-S3 单注入点；R17 判据推广——consult/escalate 族同样触发
      //    ——T-R17j。F-UC7（§6.27.12.5 D）：谓词**必须先于第 3 步池空退出判**——「池空 +
      //    队列留 ask」（子代理已 settle 且报告已消化）仍须开一轮把它 drain 出来）
      const upstream = upstreamWaiting(agent)
      if (pendingFamiliesNonEmpty(agent) || upstream) {
        await digestTurn(ctx, upstream)
        // AGENT-LOOP-ASYNC-POOL.md §6.8 实测修订（2026-09-03）：digest 消化完成（pending 条目已注入）→ 逐条补发
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
      // abort 语义：只清已死条目（AGENT-LOOP-ASYNC-POOL.md §6.20——墓碑/出池/队列剔除/
      // 整批一次提醒；存活与已 settle 者留池消化——不注入陈旧错误）。
      discardAbortedPool(agent)
      discardAbortedAdvisors(agent)
      // ASYNC-RESULT-CONTAINER.md D2：pending 单容器——中止清容器不注入陈旧结果（四族
      // 统一一处清；consult 会话标记 stopped——settle 不入 digest 流——T-R17c）+
      // children abort。
      agent._pendingAsyncResults = []
      const { cleanupConsultSessions } = await import("@thincoder/core/agent-tools/consult.mjs")
      cleanupConsultSessions(agent)
      // AGENT-LOOP-ASYNC-POOL.md §6.8 round2 偏差 #2-CLI（code review round2 #2-CLI）+ INPUT-LOCK + queue-visible 批
      // （2026-09-24）：中止时不静默丢弃队列内输入——Enter 已清空输入框并入 pendingInput
      // （用户视为已发送）——按合并计划全量转回 state.queue（{text} 逐动作条目——多批 = 多回合
      // 续发，零丢失；不渲染待发送块——TUI.md §7.5 边界）+ 提示行明示去向（不静默丢）。
      if ((state.pendingInput?.length ?? 0) > 0) {
        for (const a of planQueuedInput(state.pendingInput)) state.queue.push({ text: a.text })
        state.pendingInput.length = 0
        pushLine(`[background work stopped — the message you entered will run as a normal turn]`, C.warn)
      }
    } else {
      // D-S3 ③ 兜底：退出前残余（极端竞态）直注入再退——结果零丢失（AC-S2；
      // ASYNC-RESULT-CONTAINER.md D2：pending 单容器一处清——注入器按 role 分发
      // （consult → injectConsultResult；其余 → injectAsyncResult——四族同容器）。
      const { injectAsyncResult } = await import("@thincoder/core/agent-tools/subagent.mjs")
      const { injectConsultResult } = await import("@thincoder/core/agent-tools/consult.mjs")
      const residual = agent._pendingAsyncResults
      if (residual?.length) {
        for (const e of residual.splice(0)) {
          if (e.role === "consult") await injectConsultResult(agent, e)
          else await injectAsyncResult(agent, e)
          // TUI-OOM-ROOTCAUSE（AGENT-LOOP.md §6.15 消费点③——挂起残差注入）：注入完成 → 释放条目持有
          releaseSettledEntry(e)
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
