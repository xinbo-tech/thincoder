/**
 * agent/suspension.mjs — 挂起 / 唤醒驱动（核内形态——AGENT-LOOP.md §2.3 #184 定案；机制面 = AGENT-LOOP-ASYNC-POOL.md §6.8）。
 *
 * 语义（两端同源，逐字承两端现行挂起驱动——CLI 侧 tui 面 / VSC 侧 extension 面，同语义移植）：
 * 回合尾后台池仍 live → 挂起会话——池项 settle → 入 pending；pending 非空 **或存在未 drain 的
 * 上行 ask**（`upstreamWaiting`——F-UC7 / §6.27.12.4 ①）→ 合并消化轮 / 唤醒轮（auto-turn；旗标
 * `upstreamTurn` 仅供域文本选择）；挂起空闲用户输入优先于消化轮。池空 + pending 空 + 无待处理
 * 输入 → 自然退出（idle）。退出清场：abort = 清池不注入（陈旧结果不注入）；idle = 残余直注入（结果零丢失）。
 *
 * 载体注入（端差面 = 池 / pending / 标志挂谁）：`ctx.carrier` = 字段集按核内异步面
 * 现行口径的对象（`_asyncSubagents` · `_asyncAdvisors` · `_consultSessions` ·
 * `_pendingAsyncResults` · `_suspended`）——CLI 形 = `agent` 对象；VSC 形 = depth-0
 * `history` 数组（附加属性不污染会话文件）。机制对载体零预设（空字段一律 `?.` 读）。
 *
 * 核内零文案、零渲染、零端名分支（契约 5 / 10）：状态行文本 / 提示行 / 消息族全在宿主侧，
 * 本模块只发结构化计数（hooks.onCounts）与消化轮边界（hooks.onDigest）。
 *
 * ctx 接口（注入面）：
 *   - carrier           池 / pending / 标志载体（见上）
 *   - runTurn(text, opts)  回合执行器（digest = `("", { autoTurn: true })`；上行唤醒轮 =
 *                          `("", { autoTurn: true, upstreamTurn: true })`；timer 轮 =
 *                          `("", { autoTurn: true, timerTurn: true })`——旗标仅供域文本选择）
 *   - inputQueue        **opt-in** 宿主既有输入队列数组（增补 C）：驱动就地消费该数组——宿主
 *                       其余入队 ∕ 读取面与驱动同一数组（零同步面）；缺省核内新建（既有宿主零变）
 *   - takeInput(queue)  **opt-in** 取项缝（增补 C）：批次策略（富条目 / 合并批 / 消费回执行）
 *                       归宿主；缺省 `shift`；返回 null/undefined ⇒ 本步零动作、落第 2 步
 *                       （首动作不可消费的防御面——条目不消费留队）。可异步（宿主取项含动态 import）
 *   - abortSignal       会话中止信号（兜底监听 + abort 清场判据）
 *   - hooks.onCounts(counts)      计数变化通知（{ running, queued, pending, done }）
 *   - hooks.onDigest(phase, counts) 消化轮边界（start / end）
 *   - hooks.reclaim(consumed)     消化完成条目逐条回收（不等池空）
 *   - hooks.freezeAll()           退出冻结（兜底残项）
 *   - injectResidual(entry)       残余注入面（idle 退出清场；宿主装配端注入器——CLI =
 *                                 逐族注入分发 / VSC = pending 单容器注入器）
 *   - timerFace        **opt-in** timer 面（§6.30.10）：`{ deadline(), deliver() }`——`deadline()`
 *                      每轮步骤 4 现算（number|null；缺省 / null ⇒ 零注册，等待仍三态）；
 *                      `deliver()` 到期兑现面（返回布尔 = 是否已交付；交付真 ⇒ timer 轮）。
 *                      缺省不传 ⇒ 既有行为逐字等价（现宿主零传）。
 *   - timer / clear    等待原语注入缝（缺省 `setTimeout` / `clearTimeout`——用例零真实等待）
 */

import { parkAsyncPending } from "../agent-tools/async-settle.mjs"
import { upstreamWaiting } from "../agent-tools/parent-channel.mjs"

/** 运行中 consult children（非 stopped 会话的在飞子调用数——挂起活度/计数同源）。 */
function consultRunningChildren(carrier) {
  let n = 0
  for (const s of carrier?._consultSessions?.values() ?? []) {
    if (!s.stopped) n += Math.max(0, s.pending ?? 0)
  }
  return n
}

/** 后台池存活判据（D-S2/F5 口径——CLI 为准）：running/queued 的池条目，或已 settle 未注入
 * （pending 非空 = D-S3「未注入」），或运行中 consult children（会诊跨回合）。回合尾与每次
 * 轮末都评估退出。 */
export function poolLive(carrier) {
  const sub = carrier?._asyncSubagents
  const adv = carrier?._asyncAdvisors
  return (sub && sub.size > 0) || (adv && adv.size > 0)
    || (carrier?._pendingAsyncResults?.length ?? 0) > 0
    || consultRunningChildren(carrier) > 0
}

/** D-S3 ③ 记账清扫：回合边界竞态落下的已 settle 项（settle 回调未及移交——发生在回合刚结束、
 * `_suspended` 尚未置位的窗口）补入 pending。幂等：`parkAsyncPending` 置 `_inPending` 防重复，
 * 键按条目实际 key 删除（两端 key 形态不同——对载体零预设）。 */
export function sweepSettledToPending(carrier) {
  for (const key of ["_asyncSubagents", "_asyncAdvisors"]) {
    const map = carrier?.[key]
    if (!(map instanceof Map) || map.size === 0) continue
    for (const [k, e] of [...map.entries()]) {
      if (e.done && !e._inPending) {
        parkAsyncPending(carrier, e)
        map.delete(k)
      }
    }
  }
}

/** 后台计数（D-S8——宿主状态行 / 消息族的数据面）：{ running, queued, pending, done }。
 *  `done` = 回合尾留池的 settled 未消费项（挂起首轮 sweep 前的可见窗口）。 */
export function backgroundCounts(carrier) {
  const entries = []
  for (const key of ["_asyncSubagents", "_asyncAdvisors"]) {
    const map = carrier?.[key]
    if (map instanceof Map) entries.push(...map.values())
  }
  return {
    running: entries.filter((e) => e.status === "running").length + consultLiveCount(carrier),
    queued: entries.filter((e) => e.status === "queued").length,
    pending: carrier?._pendingAsyncResults?.length ?? 0,
    done: entries.filter((e) => e.done).length,
  }
}

/** running 会诊会话计数（会话级——计数面同 poolLive 口径）。 */
function consultLiveCount(carrier) {
  let n = 0
  for (const s of carrier?._consultSessions?.values() ?? []) {
    if (!s.stopped) n += 1
  }
  return n
}

/**
 * 退出清场（单点——驱动 finally 与单测共用）：
 *  - abort：**只清已死**（§6.20 口径——增补 D：`discardAbortedPool` ∕ `discardAbortedAdvisors`
 *    单点，与核 run-stages 回合尾中止同式；存活 ∕ 已 settle 条目留池——settled 报告沿后续
 *    回合边界注入到达，不静默丢）+ pending 单容器清 + 会诊会话清理标记；
 *  - idle：残余直注入（极端竞态残项——结果零丢失；注入器由宿主注入，缺省 no-op 保残项）。
 */
export async function finishSuspension(carrier, { aborted = false, injectResidual = null } = {}) {
  if (aborted) {
    const { discardAbortedPool, discardAbortedAdvisors } = await import("../agent-tools/async-discard.mjs")
    discardAbortedPool(carrier)
    discardAbortedAdvisors(carrier)
    carrier._pendingAsyncResults = []
    if (carrier._consultSessions instanceof Map) {
      const { cleanupConsultSessions } = await import("../agent-tools/consult.mjs")
      cleanupConsultSessions(carrier)
    }
    return
  }
  const residual = carrier._pendingAsyncResults
  if (residual?.length && typeof injectResidual === "function") {
    for (const e of residual.splice(0)) await injectResidual(e)
  }
}

/** 等待下一次 settle（池 waiter——核内异步面 settle 尾部唤醒）/ 宿主唤醒（wake——用户输入）/
 *  **timer 到期**（opt-in——§6.30.10 等待第四态，与 settle / wake 同槽先到先得）。
 *  `deadline != null` ⇒ 一次性注册（`unref()` 尽力——不阻断宿主退出）；缺省 / null ⇒ 三态逐字等价。
 *  cleanup 摘除全部注册（含未触发句柄——尽力清）；到期兑现交循环支（本原语零交付语义）。 */
function waitForSettleOrWake(carrier, abortSignal, latch, { deadline = null, timer = setTimeout, clear = clearTimeout } = {}) {
  return new Promise((resolve) => {
    let finished = false
    let handle = null
    const cleanup = () => {
      latch.wake = null
      const h = handle
      handle = null
      if (h !== null) { try { clear(h) } catch { /* 已触发 / 不可清——尽力面 */ } }
      const i = (carrier._asyncWaiters ?? []).indexOf(onSettle)
      if (i >= 0) carrier._asyncWaiters.splice(i, 1)
      abortSignal?.removeEventListener("abort", onAbort)
    }
    const finish = (why) => {
      if (finished) return
      finished = true
      cleanup()
      resolve(why)
    }
    const onSettle = () => finish("settle")
    const onAbort = () => finish("aborted")
    const onTimer = () => finish("timer")
    ;(carrier._asyncWaiters ??= []).push(onSettle)
    latch.wake = () => finish("wake")
    // opt-in deadline（§6.30.10 等待第四态）：无在途 / 未传 ⇒ 零注册（等待仍三态）。宿主不变式 = 到期即出列 / 关即 null（否则「已到期 ∧ 交付假」会 0ms 反复重注册）。
    if (deadline != null) {
      handle = timer(onTimer, Math.max(0, deadline - Date.now()))
      try { handle?.unref?.() } catch { /* unref 失败不阻断 */ }
    }
    if (abortSignal?.aborted) { onAbort(); return }
    abortSignal?.addEventListener("abort", onAbort, { once: true })
  })
}

/**
 * 启动挂起会话（同步返回句柄；宿主 `await handle.done` ⇒ `{ reason, residualInput }`）。
 *
 * 状态机行表（承 AGENT-LOOP-ASYNC-POOL.md §6.8 行表）：
 * 1. 用户输入优先（D-S5）：pendingInput 非空 → 以该消息开普通回合（`_suspended=false`）；
 * 2. pending 非空 或 存在未 drain 的 ask（`upstreamWaiting`）→ 合并消化轮 / 唤醒轮（auto-turn；
 *    注入由宿主 runTurn 首行完成——单注入点）；
 * 3. 池空（无 running / queued / 未注入）→ 自然退出；
 * 4. 等下一 settle / 宿主唤醒（handle.wake）/ timer 到期（opt-in——兑现真 ⇒ timer 轮）。
 * 每轮消化 / 用户回合后：hooks.reclaim(consumed) 逐条回收（不等池空）。
 */
export function startSuspension(ctx) {
  const {
    carrier, runTurn, abortSignal = null, hooks = {}, injectResidual = null,
    timerFace = null, timer = setTimeout, clear = clearTimeout,
    inputQueue = null, takeInput = null,
  } = ctx
  // 输入队列（增补 C）：宿主既有数组（VSC ∕ CLI 形——宿主其余读者与驱动同一数组）优先；
  // 缺省核内新建（desktop 形——经 `pushInput` 入槽）。
  const pendingInput = Array.isArray(inputQueue) ? inputQueue : []
  const latch = { wake: null }
  let finished = false

  const consumedByRun = () => {
    const before = [...(carrier._pendingAsyncResults ?? [])]
    return () => {
      const after = new Set(carrier._pendingAsyncResults ?? [])
      return before.filter((e) => !after.has(e))
    }
  }

  const done = (async () => {
    carrier._suspended = true
    hooks.onCounts?.(backgroundCounts(carrier))
    let aborted = false
    try {
      while (true) {
        if (abortSignal?.aborted) { aborted = true; break }
        sweepSettledToPending(carrier)
        // 1. 用户输入优先（D-S5）：队列非空 → 取项缝（增补 C——缺省 `shift`；富条目 ∕ 合并批
        //    由宿主 `takeInput` 实现）开普通回合（`_suspended=false`）；首动作不可消费
        //    （`takeInput ⇒ null`）⇒ 本步零动作、条目不消费，落第 2 步。
        if (pendingInput.length > 0) {
          const item = takeInput ? await takeInput(pendingInput) : pendingInput.shift()
          if (item != null) {
            const afterRun = consumedByRun()
            carrier._suspended = false // 用户回合 = 普通回合语义（settle 即冻结 + 回合尾直注入）
            try {
              await runTurn(item)
            } finally {
              carrier._suspended = true
            }
            hooks.reclaim?.(afterRun())
            hooks.onCounts?.(backgroundCounts(carrier))
            continue
          }
        }
        // 2. pending 非空 或 未 drain 的 ask → 合并消化轮 / 上行唤醒轮（单注入点由 runTurn
        //    首行完成：pending 经 run 起始注入器，ask 经回合头 `drainChildUpstream`）。
        const upstream = upstreamWaiting(carrier) // §6.27.12.4 ①：第二开轮源（谓词必须先于第 3 步退出判）
        if ((carrier._pendingAsyncResults?.length ?? 0) > 0 || upstream) {
          const afterRun = consumedByRun()
          hooks.onDigest?.("start", backgroundCounts(carrier))
          try {
            await runTurn("", { autoTurn: true, upstreamTurn: upstream })
          } catch (e) {
            // 消化轮自身的回合级中止不是会话停止——记边界后重入循环（池空 / pending 空自然退出）。
            if (e?.name === "AbortError" && !abortSignal?.aborted) {
              hooks.onDigest?.("end", backgroundCounts(carrier))
              continue
            }
            throw e
          }
          hooks.onDigest?.("end", backgroundCounts(carrier))
          hooks.reclaim?.(afterRun())
          hooks.onCounts?.(backgroundCounts(carrier))
          continue
        }
        // 3. 池空 → 自然退出。
        if (!poolLive(carrier)) break
        // 4. 等下一 settle / 宿主唤醒 / timer 到期（opt-in——§6.30.10 等待第四态；deadline 每轮现算）。
        const why = await waitForSettleOrWake(carrier, abortSignal, latch, {
          deadline: timerFace?.deadline?.() ?? null, timer, clear,
        })
        if (why === "aborted") { aborted = true; break }
        // 4b. 窗内到期兑现（§6.30.10 循环兑现支）：交付真 ⇒ timer 轮（轮后序同消化轮形 = reclaim +
        //     onCounts 两钩，不发 digest 边界）；交付面契约 = 同步 · 严格布尔（`=== true`——非布尔返值
        //     即静默零轮）；池空窗退交宿主空闲闩（到期件已出列——零重复投递）；交付假 ⇒ 循环重入。
        if (why === "timer" && timerFace?.deliver?.() === true) {
          const afterRun = consumedByRun()
          try {
            await runTurn("", { autoTurn: true, timerTurn: true })
          } catch (e) {
            // timer 轮自身的回合级中止不是会话停止——容纳并重入循环（timer 轮不发 digest 边界 ⇒
            // 中止路径零边界、不补发轮后序钩子；池空 / pending 空自然退出——与消化支同判，§6.30.10）。
            if (e?.name === "AbortError" && !abortSignal?.aborted) continue
            throw e
          }
          hooks.reclaim?.(afterRun())
          hooks.onCounts?.(backgroundCounts(carrier))
          continue
        }
      }
    } finally {
      if (!finished) {
        finished = true
        carrier._suspended = false
        latch.wake = null
        // §2.3 退出清场：abort 判定与实时信号合并（两端同式——Stop 落在 runTurn 内时
        // abort 以 AbortError 抛出、循环顶检查不会再执行——不合并会把清场误走 idle 注入）。
        const abortedNow = aborted || Boolean(abortSignal?.aborted)
        aborted = abortedNow
        await finishSuspension(carrier, { aborted: abortedNow, injectResidual })
        hooks.freezeAll?.()
      }
    }
    return { reason: aborted ? "aborted" : "idle", residualInput: pendingInput.splice(0) }
  })()

  return {
    /** 挂起空闲期入槽（宿主 busy 期拒收——条数策略归宿主）。**保留原值**（增补 C：富条目
     *  ——VSC ∕ CLI 载体对象；消费面 = 宿主 `takeInput`；`String()` 化归宿主需要时自做）。 */
    pushInput(msg) { pendingInput.push(msg) },
    /** 宿主唤醒（用户输入落槽后 / 宿主 settle 回调路径——settle 由池 waiter 另一路唤醒）。 */
    wake() { latch.wake?.() },
    done,
  }
}
