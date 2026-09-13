/**
 * agent/suspension.mjs — §17 挂起 / 唤醒驱动（核内形态——AGENT-LOOP.md §2.3 #184 定案）。
 *
 * 语义（两端同源，逐字承两端现行挂起驱动——CLI 侧 tui 面 / VSC 侧 extension 面，同语义移植）：
 * 回合尾后台池仍 live → 挂起会话——池项 settle → 入 pending；pending 非空 → 合并消化轮
 * （auto-turn）；挂起空闲用户输入优先于消化轮。池空 + pending 空 + 无待处理输入 → 自然退出
 * （idle）。退出清场：abort = 清池不注入（陈旧结果不注入）；idle = 残余直注入（结果零丢失）。
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
 *   - runTurn(text, opts)  回合执行器（digest = `("", { autoTurn: true })`）
 *   - abortSignal       会话中止信号（兜底监听 + abort 清场判据）
 *   - hooks.onCounts(counts)      计数变化通知（{ running, queued, pending, done }）
 *   - hooks.onDigest(phase, counts) 消化轮边界（start / end）
 *   - hooks.reclaim(consumed)     消化完成条目逐条回收（不等池空）
 *   - hooks.freezeAll()           退出冻结（兜底残项）
 *   - injectResidual(entry)       残余注入面（idle 退出清场；宿主装配端注入器——CLI =
 *                                 逐族注入分发 / VSC = pending 单容器注入器）
 */

import { parkAsyncPending } from "../agent-tools/async-settle.mjs"

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
 *  - abort：清池不注入（用户显式停——陈旧结果不回灌）+ 会诊会话清理标记；
 *  - idle：残余直注入（极端竞态残项——结果零丢失；注入器由宿主注入，缺省 no-op 保残项）。
 */
export async function finishSuspension(carrier, { aborted = false, injectResidual = null } = {}) {
  if (aborted) {
    carrier._asyncSubagents?.clear()
    carrier._asyncAdvisors?.clear()
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

/** 等待下一次 settle（池 waiter——核内异步面 settle 尾部唤醒）或宿主唤醒（wake——用户输入）。
 *  双路单次兑现（settle / wake / aborted 三态，先到先得）；cleanup 摘除全部注册。 */
function waitForSettleOrWake(carrier, abortSignal, latch) {
  return new Promise((resolve) => {
    let finished = false
    const cleanup = () => {
      latch.wake = null
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
    ;(carrier._asyncWaiters ??= []).push(onSettle)
    latch.wake = () => finish("wake")
    if (abortSignal?.aborted) { onAbort(); return }
    abortSignal?.addEventListener("abort", onAbort, { once: true })
  })
}

/**
 * 启动挂起会话（同步返回句柄；宿主 `await handle.done` ⇒ `{ reason, residualInput }`）。
 *
 * 状态机行表（承 AGENT-LOOP.md §9/§7 行表）：
 * 1. 用户输入优先（D-S5）：pendingInput 非空 → 以该消息开普通回合（`_suspended=false`）；
 * 2. pending 非空 → 合并消化轮（auto-turn；注入由宿主 runTurn 首行完成——单注入点）；
 * 3. 池空（无 running / queued / 未注入）→ 自然退出；
 * 4. 等下一 settle / 宿主唤醒（handle.wake）。
 * 每轮消化 / 用户回合后：hooks.reclaim(consumed) 逐条回收（不等池空）。
 */
export function startSuspension(ctx) {
  const { carrier, runTurn, abortSignal = null, hooks = {}, injectResidual = null } = ctx
  const pendingInput = []
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
        // 1. 用户输入优先：单槽（至多一条待交接——宿主在 busy 期拒收提交）。
        if (pendingInput.length > 0) {
          const head = String(pendingInput.shift())
          const afterRun = consumedByRun()
          carrier._suspended = false // 用户回合 = 普通回合语义（settle 即冻结 + 回合尾直注入）
          try {
            await runTurn(head)
          } finally {
            carrier._suspended = true
          }
          hooks.reclaim?.(afterRun())
          hooks.onCounts?.(backgroundCounts(carrier))
          continue
        }
        // 2. pending 非空 → 合并消化轮（单注入点由 runTurn 首行完成）。
        if ((carrier._pendingAsyncResults?.length ?? 0) > 0) {
          const afterRun = consumedByRun()
          hooks.onDigest?.("start", backgroundCounts(carrier))
          try {
            await runTurn("", { autoTurn: true })
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
        // 4. 等下一 settle / 宿主唤醒。
        const why = await waitForSettleOrWake(carrier, abortSignal, latch)
        if (why === "aborted") { aborted = true; break }
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
    /** 挂起空闲期入槽（单槽语义：宿主 busy 期拒收；至多一条待交接）。 */
    pushInput(msg) { pendingInput.push(String(msg)) },
    /** 宿主唤醒（用户输入落槽后 / 宿主 settle 回调路径——settle 由池 waiter 另一路唤醒）。 */
    wake() { latch.wake?.() },
    done,
  }
}
