/**
 * suspension-drive.mjs — 桌面挂起驱动胶水（**消费核件** `startSuspension` —— `docs/desktop/design/PROJECT.md` §2 KD-34；
 * 机制句 ∕ 对位表 = 批档 `docs/batches/2026-09-28-desktop-idle-wake.md` §2.3）。
 * 职责：① 会话寄存器（key → 窗 · 同键至多一窗——重入 = 零动作；跨键各自独立）② 入口（回合尾结算后 `poolLive` 判真 ⇒
 * 核件装配 + 会话控制器 + 载体挂 `_sessionAbort` ∕ `_sessionSignal`）③ 端侧钩子（计数 ⇒ `ev:susp`；边界 ⇒ `ev:digest`
 * 〔autoTurn 支起跑 ∕ 收尾两发〕；回收 ⇒ 消化完成逐条补发 `ev:subagent { status:"done" }`〔`settled` 驻留块归档入流——
 * VSC `reclaimDigestedBlocks` 同形〕；冻结 ⇒ 退出兜底同型）④ 输入 ∕ 关闭路由（`pushInput` + `wake` ∕ `abort`）
 * ⑤ 提示面触发两档（①用户回合完成 ∕ ②消化轮起跑 `pending > 0`）⑥ **残输入兜底**（出窗残值非空 ⇒ 以普通回合续发——
 * 不静默丢；VSC 队列兜底同形 —— 对位表「关闭」行）⑦ **timer 面装配**（timer-wake 阶段 2 —— §6.30.11 桌面块：
 * 空闲 deadline 闩（`timer-watch.mjs` 键面）装配 ∥ 三武装点（回合尾接管未入窗 ⇒ 武装 ∕ 出窗结算后 ⇒ 重武装 ∕
 * 会话清除面 ⇒ 撤闩清点）∥ 窗内 `timerFace` 注入（核件 opt-in，§6.30.10——`deadline` 现算 + `deliver` 交付））。
 * **边界取点** = 窗内单回合包装（`driveTurn` 的 autoTurn 支：起跑读核 `backgroundCounts(agent).pending` = 起跑数，
 * `tier` 随 `upstreamTurn`；收尾在 `finally`——非 Abort 失败径同样出 `end`）。核件 `hooks.onDigest` 为**备用面**
 * （核钩在非 Abort 失败径不出 `end` ⇒ 不可作主取点）：本档不注册该钩 —— **零双帧**。
 * **残输入兜底**（KD-34）：核件 `pendingInput` 出窗未及消费项（两窄径 = 窗退出等待期落槽 ∥ 消化轮非 Abort 失败）由本档
 * `entry.pending` 投影承接（核 `done` 兑现值在非 Abort 失败径不物化——`done` 拒绝 ⇒ 两径同取投影，单一来源），出窗链
 * 读该投影 ⇒ 逐条经 `runTurn`（宿主既有三径结算提取面，`send` 同源）以**普通回合**续发；会话中止径（`abort` = dispose ∕
 * 切项目级联）不续发——会话已亡，消息随会话终止（VSC `panel._panel` 守卫同形，记错一行；含**续发期**窗已摘后的中止，
 * 经 `resuming` ∕ 中止墓碑检查点落位——零复活窗）。
 * 零宿主依赖（`post` ∕ `runTurn` ∕ `reloadSlot` ∕ `notify` ∕ `busyOf` ∕ `takeOver` ∕ 三时钟缝皆注入）⇒ 平 node 直测；零文案（文案面 = 渲染面 ∕ `notify.mjs`）。
 */
import { backgroundCounts, poolLive, startSuspension } from "@thincoder/core/agent/suspension.mjs"
import { upstreamAskLabelVars } from "@thincoder/core/agent-tools/parent-channel.mjs"
import { pendingTimerDeadline } from "@thincoder/core/agent/timers.mjs"
import { createTimerWatch, deliverExpiredTimers, fireTimerWake, timerWakeEnabled } from "./timer-watch.mjs"

/** 挂起驱动工厂：`post(channel, payload)` = 出站面（主进程注入）· `runTurn(key, agent, text, opts)` = 单回合执行面
 *  （宿主既有三径结算提取 —— `send` ∕ 驱动同源）· `reloadSlot(key, agent, cwd)` = 每轮起跑前按本窗键重装槽
 *  （§2.2 会话钉定；缺省 = 零动作）· `notify` = 提示面策略（`thincoder-desktop/src/main/notify.mjs`；缺省 = 零动作）·
 *  `busyOf(key)` = 在飞回合判据（宿主在飞表单向读面——空闲火面用；缺省 ⇒ 恒假）· `takeOver(key, agent)` = 宿主回合尾
 *  接管面（timer 轮后同判——池活 ⇒ 入窗消化；缺省 ⇒ 回落闩重同步）· `timer` ∕ `clear` ∕ `now` = 闩时钟三扇注入缝。 */
export function createSuspensionDrive({ post, runTurn, reloadSlot = null, notify = null, busyOf = () => false, takeOver = null, timer = setTimeout, clear = clearTimeout, now = Date.now } = {}) {
  if (typeof post !== "function") throw new Error("[suspension-drive] post required (out-bound channel)")
  if (typeof runTurn !== "function") throw new Error("[suspension-drive] runTurn required (single-turn face)")
  /** 窗表：key → entry（`entry` = `{ key, agent, cwd, controller, frozen, handle, pending }`；`pending` = 残输入投影）。 */
  const windows = new Map()
  /** 续发期键集（窗已摘、残值续发链在跑——`abort` 的第二落点，免「中止窗口期」盲区）。 */
  const resuming = new Set()
  /** 续发期中止墓碑（键集）：链每轮起跑前 + 接管前查位——命中 ⇒ 停链，余值随会话终止（记错一行）。 */
  const abortTombstones = new Set()
  /** 中止代次（每键 —— #515③）：`abort` ∕ `abortAll` +1；空闲闩的到点回调携**武装刻代次**（`rev` 注入面）
   *  与现值比对 ⇒ 「已点火（回调在队）恰逢中止」的陈旧点火零交付 ∥ 零开轮（中止后交付闸）。 */
  const abortGens = new Map()
  const genOf = (key) => abortGens.get(key) ?? 0
  /** 空闲 deadline 闩（§6.30.11 桌面块 —— 装配住本档：与窗内 `timerFace` 是同一 deadline 的两载体，出窗交接
   *  （池空窗退 ⇒ 交空闲闩）即在本档生命周期内 ⇒ 单点持有；宿主只供两枚注入面（`busyOf` ∕ `takeOver`））。 */
  const watch = createTimerWatch({
    onFire: (key, agent, gen) => {
      if (gen !== genOf(key)) return // 武装后被中止 ⇒ 陈旧点火丢弃（#515③ 中止后交付闸）
      void fireIdle(key, agent).catch((err) => console.error(`[suspension-drive] idle timer wake ${key} failed: ${err?.message ?? err}`))
    },
    rev: genOf,
    timer, clear, now,
  })

  /** 窗内 timer 面（核件 opt-in 三注入项之一 —— §6.30.10）：`deadline()` 每轮现算（开关关 ⇒ `null` ⇒ 零注册）；
   *  `deliver()` = 到期批交付（**严格布尔**——交付真 ⇒ 核件开 timer 轮；交付面同点落 `ev:timer`）。 */
  function timerFaceOf(key, agent) {
    return {
      deadline: () => (timerWakeEnabled(agent) ? pendingTimerDeadline(agent) : null),
      deliver: () => deliverExpiredTimers(agent, key, { post, now }) > 0,
    }
  }

  /** 空闲闩触发（§6.30.11 火面）：非空闲零动作（在飞 ∕ 窗内交既有路径）；**轮后链尾接管**（§6.30.11 装配点①
   *  的回合尾面 —— timer 轮亦为回合：池活 ⇒ 入窗消化 ∥ 池空 ⇒ 闩重武装；与 `send` 径两径同接管同判）；交付未
   *  发生（在飞 ∕ 零到期）⇒ 零动作（免「已到期未出列」0ms 重注册）；轮内抛错同走接管（`finally`）。 */
  async function fireIdle(key, agent) {
    let ran = false
    try {
      return await fireTimerWake(key, {
        agent, post, busy: busyOf(key) === true, inWindow: windows.has(key), now,
        runTurn: (k, a, text, opts) => { ran = true; return runTurn(k, a, text, opts) },
      })
    } finally {
      if (ran) { if (takeOver) takeOver(key, agent); else watch.sync(key, agent) } // 接管面缺省 ⇒ 回落闩重同步（用例面）
    }
  }

  /** 计数帧（`ev:susp` —— 核 `backgroundCounts` 直传：`{ key, active, running, queued, pending, done }`）。 */
  const postSusp = (key, agent, active, counts = null) => post("ev:susp", { key, active, ...(counts ?? backgroundCounts(agent)) })

  /** 驻留条目（回收 ∕ 冻结的补发对象）：两池 + pending 单容器（载体字段面 = 核单源，零第二口径）。 */
  function resident(agent) {
    const out = []
    for (const field of ["_asyncSubagents", "_asyncAdvisors"]) {
      const map = agent?.[field]
      if (map instanceof Map) out.push(...map.values())
    }
    out.push(...(agent?._pendingAsyncResults ?? []))
    return out
  }

  /** 逐条补发 `done`（`settled` 驻留块 ⇒ 归档入流；块回收与池空解耦——不等池空）。载荷形 = VSC 收回面同款。 */
  function reemitDone(key, entries) {
    for (const e of entries) {
      if (!e || e.id === undefined || e.id === null) continue
      post("ev:subagent", { key, role: e.role ?? "subagent", id: e.id, status: "done" })
    }
  }

  /** 退出残余注入（idle 清场 —— 结果零丢失）：核统一注入器按 role 分发（与 `finishSuspension` 的注入面契约同源）。
   *  动态 import（核链重 —— 先例 = 扩展端 `suspension.mjs`；装配期零代价）。 */
  async function injectResidual(agent, item) {
    if (item?.role === "consult") {
      const { injectConsultResult } = await import("@thincoder/core/agent-tools/consult.mjs")
      await injectConsultResult(agent, item)
      return
    }
    const { injectAsyncResult } = await import("@thincoder/core/agent-tools/subagent.mjs")
    await injectAsyncResult(agent, item)
  }

  /** 提示面档①（用户回合完成 —— `!autoTurn` 且成功径）：调用面两处 = 宿主 `send` 成功径（窗内 ⇒ 本档包装收尾）。 */
  function turnDone(key, agent) { return notify?.turnDone?.({ key, agent }) ?? false }

  /** 窗内单回合（用户回合 ∥ 消化轮 ∥ 唤醒轮）：每轮起跑前重装本窗键槽（§2.2）；autoTurn 支两发边界。
   *  失败向核件抛回（核 catch 语义：AbortError ⇒ 回合级重入；非 Abort ⇒ 端侧入口 catch）。
   *  用户回合 = 残输入投影的**消费点**（核件 shift 后同步调用 ⇒ 同点移除——投影恒等于「已受理未消费」）。 */
  async function driveTurn(entry, text, opts = {}) {
    const { key, agent, cwd, controller } = entry
    const autoTurn = opts.autoTurn === true
    const upstreamTurn = opts.upstreamTurn === true
    const timerTurn = opts.timerTurn === true
    // 边界帧面 = 消化 ∕ 上行两族（`ev:digest`）；timer 轮的可见面 = `ev:timer` 落流（CLI 同判——timer 轮不冒充消化边界）
    const boundary = autoTurn && !timerTurn
    if (!autoTurn) { // 消费投影（用户回合）：核件出窗时未及消费者即残值
      const i = entry.pending.indexOf(text)
      if (i >= 0) entry.pending.splice(i, 1)
    }
    const started = Date.now()
    if (boundary) {
      const n = backgroundCounts(agent).pending // 起跑数（run 首行注入之前读 —— 与 VSC 起跑 post 同点）
      const ask = upstreamTurn ? upstreamAskLabelVars(agent) : null
      post("ev:digest", { key, status: "start", n, ...(upstreamTurn ? { tier: "ask", ...(ask ?? {}) } : {}) })
      notify?.digestStart?.({ key, agent, n }) // 档②（`n > 0` 门在策略档 —— 纯 ask 唤醒轮不弹）
    }
    reloadSlot?.(key, agent, cwd) // 会话钉定：回合落槽面 = 本窗键槽（非现刻 activeSession —— 切标签零影响）
    let ok = true
    try {
      await runTurn(key, agent, text, { autoTurn, upstreamTurn, timerTurn, sessionSignal: controller.signal })
    } catch (err) {
      ok = false
      throw err
    } finally {
      if (boundary) post("ev:digest", { key, status: "end", ok, ms: Date.now() - started })
    }
    if (!autoTurn) turnDone(key, agent) // 档①：窗内用户回合完成（成功径——与宿主 `send` 径同一判据）
  }

  /** 残输入兜底（KD-34 —— 出窗残值非空 ⇒ 以**普通回合**续发，不静默丢；VSC 队列兜底同形）：逐条 `runTurn`
   *  （宿主既有三径结算提取面——`send` 同源，零新径）+ 档①（成功径，同 `send` 判据）；续发毕回合尾接管同形
   *  （池仍 live ⇒ 新窗——池内残余自愈链的常规入口）。残值为空 ⇒ 零动作（不接管：池内自愈 = 下一回合尾，同设计失败面）。
   *  **中止检查点**（续发期窗已摘 ⇒ `abort` 经 `resuming` ∕ `abortTombstones` 落位）：每轮起跑前 + 接管前查位——
   *  命中 ⇒ 停链（余值随会话终止——记错一行，非静默）且**不接管**（会话已亡 ⇒ 零复活窗）。 */
  async function resumeResidual(entry) {
    const texts = entry.pending.splice(0)
    if (texts.length === 0) return
    resuming.add(entry.key)
    let ran = 0
    try {
      for (const text of texts) {
        if (abortTombstones.has(entry.key)) break // 续发期中止 ⇒ 停链
        try {
          await runTurn(entry.key, entry.agent, text, {}) // 普通回合（非 autoTurn）
          turnDone(entry.key, entry.agent) // 档①：续发回合完成（成功径）
        } catch (err) {
          console.error(`[suspension-drive] window ${entry.key} residual turn failed: ${err?.message ?? err}`)
        }
        ran += 1
      }
    } finally {
      resuming.delete(entry.key)
    }
    if (abortTombstones.delete(entry.key)) { // 续发期中止（含末轮后落位）：停链 + 零接管
      if (ran < texts.length) console.error(`[suspension-drive] window ${entry.key} aborted mid-resume — ${texts.length - ran} accepted message(s) dropped with the session`)
      return
    }
    start(entry.key, entry.agent, { cwd: entry.cwd })
  }

  // （闩面三武装点住 `start` ∕ `closeWindow` ∕ `abort` 三处 —— 单点持有 ⇒ 与窗状态同刻变更，零跨档同步面。）

  /** 入口（回合尾结算后 —— 终局事件已出 · 在飞表已释）：`poolLive(agent)` 判真 ⇒ 进挂起会话（核件直消费）。
   *  返回是否入窗（同键已有窗 ∥ 池空 ⇒ false——零动作）。 */
  function start(key, agent, { cwd = null } = {}) {
    if (windows.has(key)) return false // 同键已有窗 ⇒ 零动作（窗内 deadline 由 `timerFace` 单持——不另武装）
    if (!poolLive(agent)) { watch.sync(key, agent); return false } // 未入窗 ⇒ 武装空闲闩（§6.30.11 装配点①）
    watch.disarm(key) // 入窗 ⇒ 撤空闲闩（同一 deadline 单持——零双注册）
    const controller = new AbortController()
    const entry = { key, agent, cwd, controller, frozen: null, handle: null, pending: [] }
    windows.set(key, entry)
    agent._sessionAbort = controller // 会话控制器（窗内 spawn 的 children 链 `_sessionSignal` —— 回合级中止不孤儿化）
    agent._sessionSignal = controller.signal
    const handle = startSuspension({
      carrier: agent,
      abortSignal: controller.signal,
      runTurn: (text, opts) => driveTurn(entry, text, opts),
      injectResidual: (item) => injectResidual(agent, item),
      timerFace: timerFaceOf(key, agent), // opt-in timer 面（§6.30.10）：窗内到期 ⇒ 兑现开 timer 轮（不等池空）
      hooks: {
        onCounts: (counts) => postSusp(key, agent, true, counts), // 计数 ⇒ `ev:susp`（核单点直传）
        reclaim: (consumed) => reemitDone(key, consumed), // 回收 ⇒ 消化完成逐条补发 done
        freezeAll: () => { // 冻结 ⇒ 退出兜底同型（残项逐条补发；abort 径用中止前快照）
          const frozen = entry.frozen ?? resident(agent)
          entry.frozen = null
          reemitDone(key, frozen)
        },
      },
    })
    entry.handle = handle
    /** 出窗结算（兑现 ∕ 拒绝两径同点）：摘窗 + 载体复位 + 出窗帧（`ev:susp {active:false}`）⇒ 残输入兜底。 */
    const closeWindow = (failure) => {
      if (failure) console.error(`[suspension-drive] window ${key} failed: ${failure?.message ?? failure}`)
      windows.delete(key)
      if (agent._sessionAbort === controller) { agent._sessionAbort = null; agent._sessionSignal = null }
      postSusp(key, agent, false)
      if (controller.signal.aborted) { // 会话中止径（dispose ∕ 切项目级联）：不续发——消息随会话终止
        if (entry.pending.length > 0) {
          console.error(`[suspension-drive] window ${key} aborted with ${entry.pending.length} accepted message(s) — dropped with the session`)
          entry.pending.length = 0
        }
        return
      }
      watch.sync(key, entry.agent) // 出窗结算后（§6.30.11 装配点②）：窗退且仍有在途 ⇒ 重武装
      resumeResidual(entry).catch((err) => console.error(`[suspension-drive] window ${key} residual resume failed: ${err?.message ?? err}`))
    }
    handle.done.then(() => closeWindow(null), (err) => closeWindow(err))
      .catch((err) => console.error(`[suspension-drive] window ${key} exit chain failed: ${err?.message ?? err}`)) // 出窗链自吞错（帧发射抛不升为未处理拒绝）
    return true
  }

  /** 会话中止（`dispose(key)` ∕ 切项目级联）：清池不注入（陈旧结果不回灌）+ 出窗帧；返回是否命中（窗 ∥ 续发链）。
   *  **中止代次先落**（#515③：先于一切早退——无窗 ∕ 续发期两态同落 ⇒ 已点火回调即失效）；
   *  续发期（`closeWindow` 摘窗之后）窗表无项 ⇒ 落**中止墓碑**（`resumeResidual` 检查点消费——免中止盲区）。 */
  function abort(key) {
    abortGens.set(key, genOf(key) + 1) // #515③ 陈旧点火闸（先于早退——置位与撤闩同刻）
    watch.disarm(key) // 会话清除面（§6.30.11 装配点③）：撤闩清点（无闩 ⇒ 零动作——返回语义不变：窗 ∥ 续发链）
    const entry = windows.get(key)
    if (!entry) {
      if (!resuming.has(key)) return false
      abortTombstones.add(key)
      return true
    }
    entry.frozen ??= resident(entry.agent) // 冻结快照（清池前取 —— freezeAll 兜底补发用；只取一次：二次 abort 不覆写）
    entry.controller.abort()
    return true
  }

  return {
    start,
    turnDone,
    /** 窗内输入路由：窗在场 ⇒ 核件入槽 + 唤醒（用户输入优先序沿核件）；返回是否受理（未入窗 ⇒ false —— 调用方回落既有径）。
     *  残输入投影同点受理（`entry.pending`——出窗兜底面；消费点 = `driveTurn` 用户回合）。 */
    pushInput(key, text) {
      const entry = windows.get(key)
      if (!entry) return false
      const msg = String(text)
      entry.pending.push(msg)
      entry.handle.pushInput(msg)
      entry.handle.wake()
      return true
    },
    /** 窗在场判据（`msg:send` 路由分岔点 —— 键面路由 = `docs/desktop/design/PROJECT.md` §2.2）。 */
    active(key) { return windows.has(key) },
    abort,
    /** 切项目（`project:open` 成功且 cwd 变更）：旧项目**全键**中止（窗 ∥ 续发链——§2.2 键面 ∕ 取值面双错位防护）；返回中止数。 */
    abortAll() {
      let n = 0
      for (const key of new Set([...windows.keys(), ...resuming, ...watch.keys()])) if (abort(key)) n += 1 // 闩键同入（#515③：空闲态键不在窗表 ∕ 续发链——代次同落）
      watch.disarmAll() // 切项目级联 ⇒ 撤闩清点（幂等——逐键 abort 已撤，兜底无闩面）
      return n
    },
    /** 窗数读数（诊断 ∕ 测试面）。 */
    size() { return windows.size },
    /** 闩数读数（诊断 ∕ 测试面 —— 撤闩清点断言；闩表为档内私有面）。 */
    timerLatches() { return watch.size() },
  }
}
