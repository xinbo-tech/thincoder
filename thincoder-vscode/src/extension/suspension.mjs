/**
 * suspension.mjs — AGENT-LOOP-ASYNC-POOL.md §6.8 挂起回合会话驱动（VS Code 面——**取核驱动装配**）。
 *
 * B1-P3（2026-09-29 · 批档 `2026-09-29-parity-b1-vsc-core` §2.3 件 3）：状态机本体（步骤 1–4 ∕
 * 退出清场 ∕ 等待三态 ∕ timer 第四态）出核 `@thincoder/core/agent/suspension.mjs` `startSuspension`
 * ——本档 = 装配面（carrier ∕ runTurn ∕ hooks ∕ injectResidual ∕ timerFace）+ 会话外壳（`panel._susp`
 * 投影 ∕ abortControllers 快照 ∕ 退出落盘 ∕ 残输入兜底 ∕ `syncTimerWatch`）。端差面：carrier =
 * depth-0 **history 数组**（池 ∕ pending ∕ `_suspended` 挂共享 history——agent per-run 重建；
 * 附加属性不污染会话文件）；输入面 = **宿主队列同数组**（核增补 C `ctx.inputQueue`——
 * `susp.pendingInput` 同时是核输入队列：`_chat` 直写 ∕ 步边界 pickup（`queued-pickup.mjs`）∕
 * 容量与快照（`busyQueueItems`）与驱动消费同一数组，双队列失配面零；取项 = 合并批
 * （`takeQueuedBatchItem`）+ 消费即清快照）；唤醒面 = `panel._suspWake`（绑定 `handle.wake`）；
 * 退出残输入 = 核 `done.residualInput`（非 Abort 失败径 `done` 拒绝 ⇒ 回落共享数组实况）——以
 * 普通回合续发（不静默丢；面板已死 ⇒ 消息随会话终止）。
 *
 * digest 边界可见面（webview `digest` 帧两发 + `digest:*` 日志）落**本档 runTurn 包装**（不注册核
 * `hooks.onDigest`）：核钩在「非 Abort 失败」与「会话中止」两径不出 `end`（desktop 档头同判「不可
 * 作主取点」），注册钩会丢 end 帧（ok=false）与 `digest:stopped` 日志——迁移前 finally 必发语义，
 * 本包装逐字保形（desktop ∕ CLI 同款先例）。
 *
 * W8 契约②（2026-09-29 · B1 面修单）：核驱动模块（`startSuspension ∕ backgroundCounts ∕ poolLive`）
 * 与核 `parent-channel.mjs` 皆**动态装载**（装载后缓存引用）——静态链 `extension.mjs → … → 本档 →
 * 核 agent/suspension.mjs` 经 `async-settle → subagent-* → agent.mjs → setup.mjs → memory/schema.mjs`
 * 可达 `node:sqlite`（静态链违例）；动态 import 不入静态链（沿本档 `injectResidual` 先例）。
 *
 * F-6（2026-09-09 用户裁定——评审 #1）：`susp.abortControllers` 不再由 Stop 驱动（全停路径废除）
 * ——快照仅供面板销毁（dispose）统一中止；D3（2026-09-08）：不捕获入场 engState 快照（会话内回合
 * 每轮从槽新读）。会话内回合执行 = `entry.runTurn` 闭包（panel-turn-stages 装配；本档零 import
 * `panel-chat`——环安全）。
 */
import { logEvent } from "@thincoder/core/log.mjs"
// #726（2026-10-01 · 跨端消化面恢复批）：留档记录写缝（核口——`pushReal` 双胞；机制单源 = SESSION.md §6.26）。
import { pushRecord } from "@thincoder/core/context.mjs"
// §6.30.11 VSC 面：窗内送达（挂起会话期 timer 轮）+ 挂起退出武装点
import { deliverExpiredTimers, syncTimerWatch } from "./timer-watch.mjs"
// §6.30.11 窗内 deadline：核到期件读面 + 开关判据（最近到期时点；零依赖叶 ⇒ 静态引入安全）
import { pendingTimerDeadline, timerWakeEnabled } from "@thincoder/core/agent/timers.mjs"
// 任务可见性族投递通道（第 10 批 §5.1.4 第 3 条）：环 import（panel-callbacks ↔ 本模块——
// postSubagentEvent 为函数声明（hoist）——只在调用期读——环安全）。
import { postSubagentEvent, queuedInfoOf } from "./panel-callbacks.mjs"
// queue-visible 批（2026-09-24 · 台账 #249）：取项面收编归核（取项单源——本档零本地副本）
import { takeQueuedBatchItem } from "@thincoder/core/queued.mjs"

// ─── W8 契约②（装载面）：核驱动动态装载 —— 缓存引用保 sync 出口（对外语义零变） ─────────────────
// B1-P3 单源不变：驱动本体 = 核 `agent/suspension.mjs`（三端消费）；本档 = 装配面。`loadSuspensionCore()`
// 的预载点 = `suspensionSession` 入口 + 释放窗口两判据点（`panel-turn-stages` `finalizeTurn` ∕
// `enterSuspensionTurn`——await 后 sync 出口可用）；`backgroundStatus ∕ poolLive` 读缓存引用
// （四会话活跃消费点：panel-turn-stages ∕ panel-callbacks ∕ panel-messages——`panel._susp` ∕ 传入
// `susp` 在场 ⇔ 会话入口已装载）。
let _core = null
let _coreLoad = null
export function loadSuspensionCore() {
  return (_coreLoad ??= import("@thincoder/core/agent/suspension.mjs").then((m) => (_core = m)))
}
/** 后台计数（核 `backgroundCounts` 实参直传——对外语义零变）。 */
export function backgroundStatus(history) {
  return _core.backgroundCounts(history)
}
/** 池存活判据（核 `poolLive`——对外语义零变）。 */
export function poolLive(history) {
  return _core.poolLive(history)
}

/** 后台池计数（LOGGING susp/digest 事件字段——pendingN/poolN，CLI agent-turn parity；
 *  §6.10 D-24b：两池合计——advisor 独立池同口径；D2：pendingN = 单容器长度）。 */
function poolCounts(history) {
  const maps = [history?._asyncSubagents, history?._asyncAdvisors].filter((m) => m instanceof Map)
  const consultSessions = history?._consultSessions instanceof Map ? history._consultSessions.size : 0
  return {
    poolN: maps.reduce((n, m) => n + m.size, 0) + consultSessions,
    pendingN: history?._pendingAsyncResults?.length ?? 0,
    runningN: maps.reduce((n, m) => n + [...m.values()].filter((e) => e.status === "running").length, 0) + consultSessions,
  }
}

/** 存活投影 / 状态再断言（第 10 批 §5.1.4 第 3/4 条）：读 panel._liveLines ?? panel._susp?.lines
 *  的池（与 panel-messages ⏹ 路由**同一来源**）——**只发 live**；queued 行四项与 live 中继面
 *  同形（relay 面缓存；缓存缺省 ⇒ 降级仅 `position`）；投递经 postSubagentEvent。返回重发条数。 */
export function reassertLiveChildren(panel) {
  const lines = panel._liveLines ?? panel._susp?.lines
  const history = lines?.history
  if (!history) return 0
  let n = 0
  for (const key of ["_asyncSubagents", "_asyncAdvisors"]) {
    const map = history[key]
    if (!(map instanceof Map)) continue
    for (const e of map.values()) {
      if (e.status === "running") {
        // X10（显示面消差批 §2.2 · 同形面）：`syncLive` 随载荷——投影只枚举池条目（async）
        // ⇒ 恒 false（sync 子代理不在池内，无第二来源）；字段形态与 relay 出生面同形（D2 单表）。
        postSubagentEvent(panel, { type: "subagent", status: "started", role: e.role, id: e.id, pool: true, model: e.model ?? null, startedAt: e.startedAt, syncLive: false })
        n++
      } else if (e.status === "queued") {
        // #118 R2：四项与 live 中继面同形（relay 面缓存；`kind`/detail 只存在于一次性 token）。
        // 缓存缺省 ⇒ 仅 `position` = 降级态（webview 走 `kind !== "slot"` 支：状态词 sub.waiting）。
        const info = queuedInfoOf(panel, `${e.role}#${e.id}`)
        postSubagentEvent(panel, {
          type: "subagent", status: "queued", id: e.id, role: e.role,
          // 缓存在场 ⇒ 全取自缓存（与 relay 面逐字同形，含 `position` 为 null 的退化情形）；缺省 ⇒ 池条目位置。
          position: info ? (info.position ?? null) : (e.position ?? null),
          ...(info ? { waiting: info.waiting, reason: info.reason, kind: info.kind } : {}),
        })
        n++
      }
    }
  }
  return n
}

/** consult 子块展开（consult 同族收齐批 · 台账 #748）：会话条目本体无 webview 行——按 `childIds`
 *  （= 子块 relay 号）逐子块补发 `{type:"subagent", status:"done"}` ⇒ webview 归档各子块（起跑窗 ∥
 *  `reclaimDigestedBlocks` 兜底两径共用）。返回是否 consult 条目（false ⇒ 调用方按本体 id 补发）。 */
function remitConsultChildBlocks(panel, e) {
  if (e?.role !== "consult") return false
  for (const cid of e.childIds ?? []) panel._panel?.webview.postMessage({ type: "subagent", id: cid, role: "consult", status: "done" })
  return true
}

/** §6.8 消化完成逐条冻结回收（2026-09-03 实测修订——CLI parity）：消化完 pending 条目（run 首行
 *  已注入）后调用——对本轮已消化条目（核 `hooks.reclaim(consumed)` 实参）逐条补发 {type:"subagent",
 *  status:"done"} → webview 把 awaitingDigest 驻留块**归档落流**（块回收与池空解耦；会话退出 freeze
 *  仅兜底未消化残项）。**本批 2026-10-01（台账 #754）**：起跑窗（`driveTurn`）已逐条补发起跑快照
 *  ⇒ 本径 = **兜底幂等**（起跑窗漏口 ∥ 迟结算面）。consult 会话本体无行——按 `childIds` 逐子块展开（#748）。 */
function reclaimDigestedBlocks(panel, history, consumed) {
  const pend = history._pendingAsyncResults ?? [] // D2 pending 单容器
  for (const e of consumed) {
    if (pend.includes(e)) continue // 未消费——留驻等下轮消化（consult 同拍）
    if (remitConsultChildBlocks(panel, e)) continue // #748：consult 本体无行——逐子块展开
    panel._panel?.webview.postMessage({ type: "subagent", id: e.id, role: e.role, status: "done" })
  }
}

/** 挂起态通知（状态行文本由 webview 按 locale 组合——host 发计数 = 核 `backgroundCounts` 实参直传）。
 *  C2（F-C2b/F-C2e——单一广播同点）：suspension 消息之外，忙态单广播 _publishTurnState 同点重发
 *  susp + counts（digest 间计数不陈旧）；两通道同源——幂等一致。 */
function postSuspension(panel, susp, counts) {
  panel._panel?.webview.postMessage({ type: "suspension", active: true, ...counts })
  panel._publishTurnState?.("susp", counts)
}

/** 挂起退出通知：freeze = 补发 done 冻结（驻留的 awaiting-digest 块折叠进流）。C2：先广播 idle
 *  （忙态收敛）再发 suspension 终态。X11（显示面消差批 §2.2）：`interrupted` = 会话中止事实
 *  （判定值 = `susp.abort.signal`）⇒ webview 对**未冻结**块补 `— interrupted` 注记；自然退出 false。 */
function postSuspensionEnd(panel, { freeze, interrupted = false }) {
  panel._publishTurnState?.("idle")
  panel._panel?.webview.postMessage({ type: "suspension", active: false, freeze, interrupted: interrupted === true })
}

/** 留档记录写出（#726 · §6.26 端侧钉定）：活行载体 = `panel._liveLines ?? panel._susp?.lines` 的人读线
 *  对象（`fullHistory` = `saveLines` 所写 `history` 槽字段之源——同引用）；**不绑记录存储**（`_recordStore`
 *  缺省 ⇒ 零窗口驱逐）∥ `history` 弃数组（机器线零触）。载体缺位（无活跃会话）⇒ 零动作 + 日志一行（零抛）。
 *  注：本档导出面（W8 修单装载面——五名）不动——本件 = 模块私有；宿主分派侧同式内联。 */
function pushLiveRecord(panel, record) {
  const lines = panel?._liveLines ?? panel?._susp?.lines
  if (!lines?.fullHistory) { logEvent("ev:recordappend", { ok: false, reason: "no-live-lines" }); return }
  pushRecord({ _fullHistory: lines.fullHistory, history: [] }, record)
}

/** 取项缝（核 `ctx.takeInput`——缺省 `shift`）：合并批取（`takeQueuedBatchItem`——取项单源）+ 消费即清
 *  快照（`pushBusyQueued`；动态 import = 零新增静态边）。空队防御支（首动作恒可消费，恒不触）
 *  ⇒ null 零动作、条目不消费（落核第 2 步）。 */
async function takeQueuedInput(panel, queue) {
  const { item, merged } = takeQueuedBatchItem(queue)
  if (!item) return null
  const { pushBusyQueued } = await import("./panel-messages.mjs")
  pushBusyQueued(panel, merged ?? undefined)
  return item
}

/** 回合执行器（核 `ctx.runTurn`）：用户回合（富条目）/ 消化轮 / 上行唤醒轮 / timer 轮。消化 ∕ 上行
 *  两族（`autoTurn ∧ ¬timerTurn`）带可见边界：起止两帧 + `digest:*` 日志 + **留档记录同点追加**（#726——
 *  档头已述：不注册核钩）。**消化账务批（2026-10-05 · 台账 #930 · §6.31.6）**：收尾帧 ∥ 记录携
 *  `unsettled`（非上行轮且 > 0 才携——残余行载荷；判据单源 = 核 `unsettledCount`，复列承接）。 */
async function driveTurn(panel, entry, item, opts = {}) {
  const history = entry.lines.history
  const payload = typeof item === "string" ? { ...opts, text: item } : { ...item, ...opts }
  const boundary = opts.autoTurn === true && opts.timerTurn !== true
  if (!boundary) return entry.runTurn(payload)
  // W8 契约②：核 `parent-channel.mjs` 动态装载（第二条静态边；本调用点在会话内、异步可达——
  // ESM 缓存 ⇒ 重复 import 仅微任务）。先于计时起点 `d0` ⇒ `ms` 读数口径与迁移前同。
  const upstreamAskFn = opts.upstreamTurn === true
    ? (await import("@thincoder/core/agent-tools/parent-channel.mjs")).upstreamAskLabelVars
    : null
  // 消化账务批（§6.31.6 · 2026-10-05 · 台账 #930）：残余行判据件动态装载（W8 契约②——`digest-account`
  // 静态链经 `async-settle` 达 `node:sqlite`，不入端壳静态闭包）；**先于 `try`**（同上游标签件——首载失败
  // 不得顶替本回合错误面），读数点仍住收尾（`ms` 同窗口外）。
  const { unsettledCount } = await import("@thincoder/core/agent/digest-account.mjs")
  const d0 = Date.now()
  const pendingN = history._pendingAsyncResults?.length ?? 0
  const upstream = opts.upstreamTurn === true
  logEvent("digest:start", { pendingN, ...(upstream ? { upstream: true } : {}) })
  // F-UC8（§6.27.12.13 ①–②）：`tier` **按因两档**（ask 因恒优先）——ask 档携参 `from`/`msg`
  // （核单点 `upstreamAskLabelVars`——显示串跨端同源）；M4：起跑即发（`n` 可 0）。
  const ask = upstreamAskFn ? upstreamAskFn(history) : null
  panel._panel?.webview.postMessage({ type: "digest", status: "start", n: pendingN, tier: upstream ? "ask" : "digest", ...(ask ?? {}) })
  // #726 同点双动作（与上帧同行值面）：留档记录入活行载体人读线（形单源 §6.26；机器线零触）。
  pushLiveRecord(panel, { kind: "digest", status: "start", n: pendingN, tier: upstream ? "ask" : "digest", ...(ask ?? {}) })
  // 起跑窗（**本批 2026-10-01 —— 台账 #754 裁 A「两端随正」；主面**）：宿主起跑点对**起跑快照**（起跑刻
  // `_pendingAsyncResults` 单容器）逐条补发 `{type:"subagent", status:"done"}`——**直投不入队**（非出生事件，
  // 属收尾通知）⇒ webview 把 awaitingDigest 驻留块归档落流（居本族文档序末元素之后）；`reclaimDigestedBlocks`
  // = **兜底幂等**（迟结算面——已归档者 `archiveBlock` no-op）。consult 会话本体无行——按 `childIds` 逐子块
  // 展开（#748——与桌面 `reemitDone` 同判）。
  for (const e of history._pendingAsyncResults ?? []) {
    if (!e || e.id === undefined || e.id === null) continue
    if (remitConsultChildBlocks(panel, e)) continue // #748：consult 本体无行——逐子块展开
    panel._panel?.webview.postMessage({ type: "subagent", id: e.id, role: e.role, status: "done" })
  }
  let ok = true
  try {
    await entry.runTurn(payload)
  } catch (e) {
    ok = false
    // C-8（§6.20）：digest 轮被 Stop（回合级 abort）不是会话停止——记 digest:stopped 后上抛（核 catch
    // 语义：AbortError ∧ 会话未停 ⇒ 重入循环；会话停 / 非 Abort ⇒ 上抛）。
    if (e?.name === "AbortError") logEvent("digest:stopped", { pendingN })
    throw e
  } finally {
    const ms = Date.now() - d0
    // 消化账务批（§6.31.6 · 2026-10-05 · 台账 #930）：非上行轮且 > 0 才携 `unsettled`（残余行载荷——
    // 帧 ∥ 记录同源同点；判据单源 = 核 `unsettledCount`；件已于 `try` 前装载——见上）。
    const unsettled = upstream ? 0 : unsettledCount(history)
    const endMsg = { type: "digest", status: "end", ok, ms, ...(unsettled > 0 ? { unsettled } : {}) }
    panel._panel?.webview.postMessage(endMsg)
    // #726 同点双动作：终态记录（`ms` 与上帧同值单算式——`ok` 同源；`unsettled` 随载荷同携——复列承接）。
    pushLiveRecord(panel, { kind: "digest", status: "end", ok, ms, ...(unsettled > 0 ? { unsettled } : {}) })
  }
  const left = history._pendingAsyncResults?.length ?? 0 // D2 单容器
  logEvent("digest:end", { pendingN: left, ms: Date.now() - d0, ...(upstream ? { upstream: true } : {}) })
}

/**
 * §6.8 挂起会话驱动（D-S9 行表；由 runPanelChat 回合尾进入，池空自然退出）：状态机本体在核
 * `startSuspension`；本档 = 装配 + 外壳（见档头）。`_suspended` 翻转（核内）：会话期 true
 * （settle 回调据此延迟冻结 + 移交 pending）；会话内用户回合执行期翻 false（普通回合语义）。
 *
 * entry = { turnSlot, distillSlot, lines: { history, fullHistory }, runTurn, pendingInput? }。
 * 会话内回合跳过输入推入 ∕ 携带 skipSession；susp.abort 中止仅剩面板销毁等生命周期路径
 * （chat-panel dispose）——F-6 语义收窄（旧 controller signal 的池 children 随面板死一并停）。
 */
export async function suspensionSession(panel, entry) {
  const { lines } = entry
  const history = lines.history
  // W8 契约②：核驱动装载（自足面——直驱 ∕ 装配入口皆先装载再暴露 `panel._susp`；已装载 ⇒ 微任务
  // 级 ⇒ `susp` 广播与 `_susp` 暴露间的零 macrotask 事件窗口不变量保持）。
  const core = await loadSuspensionCore()
  const susp = (panel._susp = {
    active: true,
    turnSlot: entry.turnSlot,
    distillSlot: entry.distillSlot,
    lines,
    abort: panel._abortController ?? new AbortController(),
    // pendingInput = 挂起空闲 + 会话在飞 busy 消息队列（容量 8——routeUserTurn 两载体分流，会话在飞
    // 此项）：`_chat` 直推本数组——**同时是核驱动输入队列**（增补 C `inputQueue`——同数组）。
    // F16（busy-injection 2026-09-21）：entry.pendingInput 预填优先；缺省空数组（原行为零变）。
    pendingInput: Array.isArray(entry.pendingInput) ? entry.pendingInput : [],
    // abortControllers = 进入回合（含续跑重建）的全部 controller 快照——面板销毁统一中止（dispose）。
    // 快照后清空：会话内回合的 controller 与池无关，由下个顶层回合起点重新登记。F-6：不再被 Stop 消费。
    abortControllers: [...(panel._turnControllers ?? [])],
    aborted: false,
  })
  panel._turnControllers = []
  const abortedNow = () => susp.aborted || susp.abort.signal.aborted
  // 会话输出面：idle 残余注入载体（`{history,_fullHistory}` **稳定化**——核 `injectAsyncResult` 的
  // digest 轮预算按载体键累计；动态 import = 核链可达 node:sqlite（W8 契约②）零新增静态边）。
  const injectCtx = { history, _fullHistory: lines.fullHistory }
  const handle = core.startSuspension({
    carrier: history,
    inputQueue: susp.pendingInput,
    abortSignal: susp.abort.signal,
    runTurn: (item, opts = {}) => driveTurn(panel, entry, item, opts),
    takeInput: (queue) => takeQueuedInput(panel, queue),
    injectResidual: async (e) => {
      if (e.role === "consult") {
        const { injectConsultResult } = await import("@thincoder/core/agent-tools/consult.mjs")
        await injectConsultResult(injectCtx, e)
      } else {
        const { injectAsyncResult } = await import("@thincoder/core/agent-tools/subagent.mjs")
        await injectAsyncResult(injectCtx, e)
      }
    },
    timerFace: {
      // §6.30.11 窗内 deadline：池 live + 在途 timer ⇒ 本窗兑现（不等池空）；开关关（§6.30.10）⇒ `null`（零注册，判据包形同桌面 `timerFaceOf` ∕ CLI）；到期件已出列——零重复投递
      deadline: () => (timerWakeEnabled(panel._agent) ? pendingTimerDeadline(panel._agent) : null),
      deliver: () => deliverExpiredTimers(panel, { lines }).length > 0,
    },
    hooks: {
      onCounts: (counts) => postSuspension(panel, susp, counts),
      // 回收：核 consumed 实参（本 run 消化者）——会话退出 freeze 仅兜底未消化残项
      reclaim: (consumed) => reclaimDigestedBlocks(panel, history, consumed),
      // 冻结：退出兜底同型（X11：中止事实落 `susp.aborted`，供外壳面复用）
      freezeAll: () => {
        susp.aborted = abortedNow()
        postSuspensionEnd(panel, { freeze: true, interrupted: susp.aborted })
      },
    },
    timer: entry.timer,
    clear: entry.clear,
  })
  // 唤醒单槽 → 核句柄（`_chat` 入队 ∕ settle 回执（panel-callbacks onAsyncSettled）同点调用）。
  panel._suspWake = () => handle.wake()
  const s0 = Date.now()
  logEvent("susp:enter", poolCounts(history))
  let exitInput = null // 残输入（成功径 = 核兑现值；失败径 = null ⇒ 回落共享数组实况）
  try {
    const res = await handle.done
    exitInput = Array.isArray(res?.residualInput) ? res.residualInput : []
  } finally {
    // 退出清场（外壳面；核 finally 已完成状态机清场——§6.20 只清已死 ∕ 残余注入 ∕ `_suspended`
    // 复位 ∕ freezeAll 帧）。
    const aborted = abortedNow()
    if (aborted && (history?._asyncSubagents?.size ?? 0) > 0) logEvent("ev:stopped", { poolN: history._asyncSubagents?.size ?? 0, where: "suspension-abort" })
    logEvent("susp:exit", { ...poolCounts(history), ms: Date.now() - s0, reason: aborted ? "aborted" : "idle" })
    // D-S3 ③ 兜底落盘（idle 径；在-memory 双线已改——防会话文件缺最后几条 reminder）
    if (!aborted) {
      try { if (lines.fullHistory.length) panel._saveLines(lines.fullHistory, history, {}, entry.turnSlot) } catch { /* non-fatal */ }
    }
    panel._susp = null
    panel._suspWake = null
    panel._refreshStatus?.()
    // 排队输入兜底（2026-09-02 code review round2 #2 + queue-visible 批 2026-09-24——按合并计划
    // 取批）：会话退出时残项不得静默丢弃（输入框已清空 + 用户气泡已上屏——用户视为已发送）——中止
    // 路径亦以普通回合执行（零丢失 AC-S2）。面板已死（dispose）→ 无渲染目标，消息随会话终止。
    if (panel._panel) {
      const leftover = exitInput ?? susp.pendingInput
      while (leftover.length > 0) {
        const { item, merged } = takeQueuedBatchItem(leftover) // 按合并计划取批（多批 = 多回合）
        if (!item) break // 空队防御支（首动作恒可消费，恒不触）——不消费（防死循环）
        const { pushBusyQueued } = await import("./panel-messages.mjs")
        pushBusyQueued(panel, merged ?? undefined) // 消费即清（待发送标记随实况收敛）
        try { await entry.runTurn(item) } catch { /* surfaced by the turn runner */ }
      }
    }
    // §6.30.11 武装点（挂起退出后同点接管 · CLI agent-turn 回合链尾对位）：窗退 ⇒ 空闲闩按在途
    // （重）武装（无在途 / 开关关 ⇒ 撤旧零注册）；开轮失败不抛（闩侧自兜底）。
    syncTimerWatch(panel)
  }
}
