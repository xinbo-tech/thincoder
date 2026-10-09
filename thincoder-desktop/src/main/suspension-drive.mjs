/**
 * suspension-drive.mjs — 桌面挂起驱动胶水（**消费核件** `startSuspension` —— `docs/desktop/design/PROJECT.md` §2 KD-34；
 * 机制句 ∕ 对位表 = 批档 `docs/batches/2026-09-28-desktop-idle-wake.md` §2.3）。零宿主依赖 ⇒ 平 node 直测；零文案。
 * 职责：① 会话寄存器（key → 窗 · 同键至多一窗——重入 = 零动作；跨键各自独立）② 入口（回合尾结算后 `poolLive` 判真 ⇒
 * 核件装配 + 会话控制器 + 载体挂 `_sessionAbort` ∕ `_sessionSignal`）③ 端侧钩子（计数 ⇒ `ev:susp`；边界 ⇒ `ev:digest`
 * 〔autoTurn 支**起跑**一发 —— 收尾 `end` 写点前移入 `turn-face.mjs` 结算序，修复轮 3〕；**归档 ⇒ 起跑窗（本批 2026-10-01 复位）**
 * （用户 2026-09-30 18:49 ∥ 2026-10-01 02:08：消化起跑点（`ev:digest start` 发帧点）= 对本轮将消费驻留条目（起跑快照 =
 * 起跑刻 pending 单容器）逐条补发 `ev:subagent { status:"done" }` = **主面**——`settled` 待消化块随起跑归档入流、居消费轮行族之后；
 * `hooks.reclaim` = **兜底幂等**（迟结算面；已冻结块零动作）〔对位 VSC `suspension.mjs:112-119` ∥ CLI `suspension-drive.mjs:182`〕）；
 * 冻结 ⇒ 退出兜底同型）④ 输入 ∕ 关闭路由（`pushInput` + `wake` ∕ `abort`——容量满判先行
 * 〔#625：`pending.length >= QUEUED_MAX_ITEMS` ⇒ 零受理返 `"full"`〕）+ **窗队共镜**（窗输入队投影 = 载体 `entry.pending`——核输入队列同数组，零第二写者 ∥ **六帧**出站；降级窗占位 `suspension-guard.mjs` ∕ 帧面 `window-queue.mjs`）
 * ⑤ 提示面触发（用户回合完成 —— 档①）⑥ **残输入兜底**（出窗残值非空 ⇒ 以普通回合续发——不静默丢）⑦ **留档记录起跑半**
 * （消化面留档批 · #719）：digest `start` 与发帧**同点双动作** ⇒ 人读线记录（`session-io.mjs` `appendRecord`）；
 * 收尾 `end` 同族写点前移入 `turn-face.mjs` 结算序（**修复轮 3** —— 先于槽落盘；本档零发）；
 * **窗内时效面**（timer 面 ∕ 空闲火面 ∕ 中止代次）出档 `suspension-timers.mjs`（本档只持接线 + `reloadSlot` 转口
 * ——#799 修复轮：timer 轮重装前移入该档 `deliver`（先于投递），本档 `driveTurn` 对 timer 轮零重装）。
 * **边界取点** = 窗内单回合包装（`driveTurn` 的 autoTurn 支：起跑读核 `backgroundCounts(agent).pending` = 起跑数，`tier` 随 `upstreamTurn`；
 * 收尾 `end`（发帧 ∥ 记录）随写点前移入 `turn-face.mjs` —— 先于槽落盘 · 成功 ∥ 失败（含 Abort）两径同出 · 修复轮 3）。核件 `hooks.onDigest` 为**备用面**（非 Abort 失败径不出 `end` ⇒ 不可作主取点）：本档不注册该钩 —— **零双帧**。
 * **残输入兜底**（KD-34 —— 取项 ∕ 接管细节见 `resumeResidual`）：核件 `pendingInput` 出窗未及消费项由本档 `entry.pending` 载具承接（**与核输入队列同数组**；富条目 `{ text, ts, images? }`——载具层携图）
 * ⇒ 出窗链以**普通回合**逐批续发（`runTurn` = 宿主既有三径结算提取面，`send` 同源）；会话中止径不续发——消息随会话终止（含**续发期**窗已摘后的中止：`resuming` ∕ 中止墓碑检查点落位——零复活窗）。
 */
import { backgroundCounts, poolLive, startSuspension } from "@thincoder/core/agent/suspension.mjs"
import { upstreamAskLabelVars } from "@thincoder/core/agent-tools/parent-channel.mjs"
import { pushReal } from "@thincoder/core/context.mjs"
import { QUEUED_MAX_ITEMS, takeQueuedBatchItem } from "@thincoder/core/queued.mjs"
import { cleanupTurn } from "./attachments.mjs"
import { panelLive } from "./panel-live.mjs" // 自愈扫读面（2026-10-06——#76 残块事故；同单例，禁第二副本）
import { appendRecord } from "./session-io.mjs"
import { guardedDeliver } from "./suspension-guard.mjs"
import { createSuspensionTimers } from "./suspension-timers.mjs"
import { createWindowQueue } from "./window-queue.mjs"

/** 挂起驱动工厂（注入面）：`post(channel, payload)` = 出站面 · `runTurn(key, agent, text, opts)` = 单回合执行面（宿主既有三径结算提取
 *  —— `send` ∕ 驱动同源）· `reloadSlot(key, agent, cwd)` = 每轮起跑前按本窗键重装槽（§2.2 会话钉定；缺省 = 零动作）· `notify` = 提示面策略（缺省 = 零动作）·
 *  `busyOf(key)` ∕ `takeOver(key, agent)` = 空闲火面两注入面（在飞判据 ∕ 回合尾接管；缺省 ⇒ 恒假 ∕ 回落闩重同步）· `postQueue` ∕ `prepare` ∕ `degrade` = 窗队列三转口
 *  （缺省 ⇒ 零出站 ∕ 无附件径）· `hold(key)` = 降级窗占位（`suspension-guard.mjs`；缺省 ⇒ 零占位）· `timer` ∕ `clear` ∕ `now` = 闩时钟三扇注入缝。 */
export function createSuspensionDrive({ post, runTurn, reloadSlot = null, notify = null, busyOf = () => false, takeOver = null, postQueue = null, prepare = null, degrade = null, hold = null, timer = setTimeout, clear = clearTimeout, now = Date.now } = {}) {
  if (typeof post !== "function") throw new Error("[suspension-drive] post required (out-bound channel)")
  if (typeof runTurn !== "function") throw new Error("[suspension-drive] runTurn required (single-turn face)")
  /** 窗表：key → entry（`entry` = `{ key, agent, cwd, controller, frozen, handle, pending }`；`pending` = 残输入投影（富条目 `{ text, ts, images? }`——与忙态队同形））。 */
  const windows = new Map()
  /** 窗队投影 ∕ 帧构造面（出档 `window-queue.mjs` —— 受理 ∕ 步边界取批 ∕ 残倾出 ∕ 清队 + 六帧定点出站）。 */
  const queue = createWindowQueue({ postQueue, prepare, degrade })
  /** 续发期键集（窗已摘、残值续发链在跑——`abort` 的第二落点，免「中止窗口期」盲区）。 */
  const resuming = new Set()
  /** 续发期中止墓碑（键集）：链每轮起跑前 + 接管前查位——命中 ⇒ 停链，余值随会话终止（记错一行）。 */
  const abortTombstones = new Set()
  /** 窗内时效面（timer 面 ∕ 空闲火面 ∕ 中止代次 —— 出档 `suspension-timers.mjs`）：宿主供读缝（`inWindow` =
   *  窗表判据 ∥ `busyOf` ∥ `takeOver`）+ **槽重装缝**（`reloadSlot` —— #799 窗内投递存活）+ 时钟三扇；
   *  闩面三武装点接线住本档（`start` ∕ `closeWindow` ∕ `abort`）。 */
  const timers = createSuspensionTimers({
    post, runTurn, busyOf, inWindow: (key) => windows.has(key), takeOver, reloadSlot, timer, clear, now,
  }) // `reloadSlot` 同源缝转口（#799：窗内 `deliver` 内先于投递重装——timer 轮重装单点）

  /** 计数帧（`ev:susp` —— 核 `backgroundCounts` 直传：`{ key, active, running, queued, pending, done }`）。 */
  const postSusp = (key, agent, active, counts = null) => post("ev:susp", { key, active, ...(counts ?? backgroundCounts(agent)) })

  /** 出窗帧（`ev:susp {active:false}` —— 计数直传同 `postSusp`）：**`interrupted` 键恒在场**（#554①：会话中止事实——判定值 = 会话控制器信号；自然退出 `false` —— 布尔形不伪造）。
   *  对位 VSC `suspension.mjs` `postSuspensionEnd`；消费面 = 渲染面出窗归档注记（`subagent-reduce.mjs` `freezeAllSubBlocks` —— `ev.interrupted === true`）。 */
  const postSuspEnd = (key, agent, interrupted) => post("ev:susp", { key, active: false, interrupted: interrupted === true, ...backgroundCounts(agent) })

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

  /** 已消化驻留块自动回收（2026-10-06——#76 digested-stuck 事故；形状 = 手动 freeze 谓词（`subagent-panel.mjs:117-155`）
   *  的 beat 级自动化）：渲染面报块中 `awaitingDigest ∧ frozen ∧ 非 consult` ∧ 核侧不在驻留（两池 + pending 皆无）
   *  ⇒ 判定「已消化驻留」（done 帧曾丢——帧面零持久痕为该事故的读面缺口）⇒ 补发 done（幂等：重复发射由渲染面归档闸消化）。
   *  谓词逐 beat 现算 = 零新存储（符「位置零存储」裁）；效果 = 分钟级自愈，不再等池空 freezeAll ∥ 手动 freeze。 */
  function sweepDigestedStuck(key, agent) {
    const blocks = panelLive.get(key)?.blocks
    if (!Array.isArray(blocks)) return
    const live = resident(agent)
    const hits = []
    for (const b of blocks) {
      if (!b || b.awaitingDigest !== true || b.frozen !== true || b.role === "consult") continue
      const m = /^sub:([A-Za-z][\w-]*)#(\d+)$/.exec(String(b.key ?? ""))
      if (!m) continue
      const role = m[1]
      const id = Number(m[2])
      if (live.some((e) => e && e.role === role && e.id === id)) continue // 仍在池 ∥ 报告未达 ⇒ 不动（手动 freeze 同判）
      hits.push({ role, id })
    }
    if (hits.length > 0) {
      console.error(`[suspension-drive] sweep-digested-stuck ${key} → ${hits.map((h) => `${h.role}#${h.id}`).join(",")}`)
      reemitDone(key, hits)
    }
  }

  /** 逐条补发 `done`（`settled` 等待消化块 ⇒ 归档入流；块回收与池空解耦——不等池空）。载荷形 = VSC 收回面同款。
   *  **会话本体零渲染行（consult）——不跳过**：按会话条目 `childIds` 逐子块补发（块键形 `consult#<N>`，
   *  consult 同族收齐批 · 台账 #748——三路径同件：起跑支 ∥ `reclaim` ∥ `freezeAll`；VSC 对位物 `remitConsultChildBlocks`（两径共用）同判）。
   *  「仍在 pending」在 reclaim 径由 `consumed` 差集**结构性满足**（回收到者 = 已离容器者）。 */
  function reemitDone(key, entries) {
    for (const e of entries) {
      if (!e || e.id === undefined || e.id === null) continue
      console.error(`[suspension-drive] reemit-done ${key} ${e.role ?? "subagent"}#${e.id}`) // 诊断痕（2026-10-06——#76 digested-stuck 事故；起跑补发∥reclaim∥freezeAll∥自愈扫 四径共用本点）
      if (e.role === "consult") {
        // #748：会话本体无行——逐子块展开（无块子块不入表 ⇒ 表空 = 零发）；本体 id 零补发
        for (const cid of e.childIds ?? []) post("ev:subagent", { key, role: "consult", id: cid, status: "done" })
        continue
      }
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

  /** 窗取项缝（核 `ctx.takeInput`——缺省 `shift`）：核件取项（合并批 ∕ 携图退化逐条——与尾径 ∕ 残值同一
   *  取项单源）；返回富条目（`null` ⇒ 本步零动作、条目留队——落核第 2 步）。送达面 ∕ 消费帧由 `driveTurn`
   *  用户回合支完成（零二次取）。 */
  function takeQueuedInput(list) { return takeQueuedBatchItem(list).item }

  /** 窗步边界取批（步边界缝读面窗半——`turn-driver` 组合为「窗优先」）：计划首动作即消费（`slash` 同判——
   *  统一语义）+ 携图批整批让位（同步缝不可降级——与链径同判据）+ `pushReal` + 消费回执行（消费即帧——快照整置）；
   *  返回是否注入（未入窗 ∕ 空队 ∕ 让位 ⇒ false——零动作零帧）。 */
  function stepBoundaryPickup(key, agent) {
    const entry = windows.get(key)
    if (!entry) return false
    const picked = queue.stepPickup(entry.pending)
    if (picked === null) return false
    pushReal(agent, { role: "user", content: picked.text }) // 下一步生效（非中断通道）
    postQueue(key, { text: picked.text, ts: picked.ts }) // 消费回执行（消费即帧——快照整置）
    return true
  }

/** 起跑快照（本批 2026-10-01 —— 起跑窗**主面**）：起跑刻 pending 单容器（= 本轮将消费的驻留条目；
 *  D2 核单源 `_pendingAsyncResults`）——浅拷快照（补发期间容器可能被回合注入器消费）。 */
function pendingSnapshot(agent) {
  return Array.isArray(agent?._pendingAsyncResults) ? [...agent._pendingAsyncResults] : []
}

/** 窗内单回合（用户回合 ∥ 消化轮 ∥ 唤醒轮）：每轮起跑前重装本窗键槽（§2.2）；autoTurn 支**起跑**一发边界（`start` 记录同点双动作 —— #719；**归档 = 起跑窗** —— 本批 2026-10-01 复位：起跑支对起跑快照逐条补发 `done` = 主面 ∥ `hooks.reclaim` = 兜底幂等）。收尾 `end` 写点前移入 `turn-face.mjs`。
   *  失败向核件抛回（核 catch 语义：AbortError ⇒ 回合级重入；非 Abort ⇒ 端侧入口 catch）。
   *  用户回合 = 核件取项（`takeInput` 缝——零二次取）后的**送达点**（起窗（`hold` 占位）⇒ 送达面（携图径，判决随 `delivered.degraded`）⇒ 消费帧——`delivered` 单写者）；
   *  窗后占位被摘 ⇒ 零起跑 + 本径落盘件自清 ∧ 不重投（裁定 (i) 同不变量 —— 判据同链径）。 */
  async function driveTurn(entry, item, opts = {}) {
    const { key, agent, cwd, controller } = entry
    const autoTurn = opts.autoTurn === true
    const upstreamTurn = opts.upstreamTurn === true
    const timerTurn = opts.timerTurn === true
    // 边界帧面 = 消化 ∕ 上行两族（`ev:digest`）；timer 轮的可见面 = `ev:timer` 落流（CLI 同判——timer 轮不冒充消化边界）
    const boundary = autoTurn && !timerTurn
    let body = typeof item === "string" ? item : ""
    let attached = null
    if (!autoTurn) { // 用户回合（取项已由 `takeInput` 缝完成——核件取项，零二次取）：送达面 ⇒ 消费帧
      const { stillHeld, consumed } = await guardedDeliver(key, hold, (signal) => queue.consume(key, item, agent, signal))
      if (!stillHeld) { // 窗后零起跑判据：零起跑 ∧ 不重投（条目已摘——不复位；消费帧已出——不追回）
        cleanupTurn(consumed?.attached?.paths ?? []) // 本径落盘件自清（回合尾清理面不达）
        return
      }
      body = consumed.text
      attached = consumed.attached
    }
    if (boundary) {
      const n = backgroundCounts(agent).pending // 起跑数（run 首行注入之前读 —— 与 VSC 起跑 post 同点）
      const ask = upstreamTurn ? upstreamAskLabelVars(agent) : null
      const start = { status: "start", n, ...(upstreamTurn ? { tier: "ask", ...(ask ?? {}) } : {}) } // 记录 ∥ 帧同源形
      post("ev:digest", { key, ...start }) // 边界帧（同点双动作 —— 发帧 ∥ 记录）
      appendRecord(agent, { kind: "digest", ...start }) // 留档记录（#719 —— 人读线半，机器线零触）
      // 起跑窗复位（本批 2026-10-01 裁 A —— **主面**）：起跑刻 pending 快照逐条补发 `done` ⇒ `settled`
      // 待消化块随起跑归档入流（居消费轮行族之后）；`hooks.reclaim` = 兜底幂等。
      reemitDone(key, pendingSnapshot(agent))
      sweepDigestedStuck(key, agent) // 已消化驻留块自愈（2026-10-06——#76 残块事故；三拍之一）
    }
    if (!timerTurn) reloadSlot?.(key, agent, cwd) // 会话钉定：回合落槽面 = 本窗键槽（非现刻 activeSession —— 切会话零影响）；
    // timer 轮零重装（#799）：该轮重装已前移入 `suspension-timers.mjs` `deliver`（先于投递）——二次重装会再吞一行。
    // 收尾边界 `end`（发帧 ∥ 记录）随写点前移入 `turn-face.mjs` 结算序（修复轮 3 —— 先于槽落盘 ⇒
    // 「收束后即时重载末轮痕缺」消解）；失败径同出（抛出直达调用面 —— 本档零 catch 包裹，净简化）。
    await runTurn(key, agent, body, { autoTurn, upstreamTurn, timerTurn, sessionSignal: controller.signal, attached })
    if (!autoTurn) turnDone(key, agent) // 档①：窗内用户回合完成（成功径——与宿主 `send` 径同一判据）
  }

  /** 残输入兜底（KD-34 —— 出窗残值非空 ⇒ 以**普通回合**续发，不静默丢；VSC 队列兜底同形）：**按核件取项分批**
   *  （合并批 ∕ 携图退化逐条——同一取项循环）⇒ 送达面 ⇒ 消费帧 ⇒ `runTurn`（宿主既有三径结算提取面——`send` 同源，
   *  零新径）+ 档①（成功径，同 `send` 判据）；续发毕回合尾接管同形（池仍 live ⇒ 新窗——池内残余自愈链的常规入口）。
   *  残值为空 ⇒ 零动作（不接管：池内自愈 = 下一回合尾，同设计失败面）。
   *  **降级窗占位**（`hold`——两调用点同判，守卫序列 `guardedDeliver`）：逐批起窗 ∕ 查位 ∕ `release`；窗后占位被摘 ⇒ 零起跑 + 本径落盘件自清 ∧ 不重投。
   *  **中止检查点**（续发期窗已摘 ⇒ `abort` 经 `resuming` ∕ `abortTombstones` 落位）：每批起跑前 + 接管前查位——命中 ⇒ 停链（余值随会话终止——记错一行，非静默）且**不接管**（会话已亡 ⇒ 零复活窗）。
   *  **弃件链尾帧（#912）**：两弃件出口（墓碑 `return` 前 ∥ `!stillHeld` 断点）各补一次 `queue.emitState` —— 弃余件零帧漏点消（倾出后未消费即弃 ⇒ 镜面亦恒收口；快照整置 · 幂等）；**全消费正常径零增帧**（逐条消费帧已收口）。
   *  **弃余计数（#912）**：`!stillHeld` 腿 = **取批前**余量（含本批已取未达件）；墓碑腿 = 倾出后未被取余量。 */
  async function resumeResidual(entry) {
    const items = queue.drain(entry.pending) // 残值倾出（倾出后按核件取项分批）
    if (items.length === 0) return
    resuming.add(entry.key)
    let dropped = 0
    try {
      for (;;) {
        if (abortTombstones.has(entry.key)) { dropped = items.length; break } // 续发期中止 ⇒ 停链
        const before = items.length // 取批前余量（弃件计数口径 —— 含本批已取未达件）
        const { item } = takeQueuedBatchItem(items) // 核件取项（合并批 ∕ 携图退化逐条——同一取项单源）
        if (item === null) break
        const { stillHeld, consumed } = await guardedDeliver(entry.key, hold, (signal) => queue.consume(entry.key, item, entry.agent, signal))
        if (!stillHeld) { // 窗后零起跑判据：零起跑 ∧ 不重投（条目已摘——不复位；消费帧已出——不追回）
          cleanupTurn(consumed?.attached?.paths ?? []) // 本径落盘件自清（回合尾清理面不达）
          dropped = before // 弃余计数 = 取批前余量（含已取未达批 —— #912 收正）
          queue.emitState(entry.key) // 弃件出口①：链尾状态帧（镜面收口为实况 —— #912）
          break // 停链（占位被摘 ⇒ 零起跑——链径现式）
        }
        try {
          await runTurn(entry.key, entry.agent, consumed.text, { attached: consumed.attached }) // 普通回合（非 autoTurn）
          turnDone(entry.key, entry.agent) // 档①：续发回合完成（成功径）
        } catch (err) {
          console.error(`[suspension-drive] window ${entry.key} residual turn failed: ${err?.message ?? err}`)
        }
      }
    } finally {
      resuming.delete(entry.key)
    }
    if (abortTombstones.delete(entry.key)) { // 续发期中止（含末轮后落位）：停链 + 零接管
      if (dropped > 0) console.error(`[suspension-drive] window ${entry.key} aborted mid-resume — ${dropped} accepted message(s) dropped with the session`)
      queue.emitState(entry.key) // 弃件出口②：链尾状态帧（墓碑径 —— 含末轮后落位；幂等）
      return
    }
    start(entry.key, entry.agent, { cwd: entry.cwd })
  }

  // （闩面三武装点接线住 `start` ∕ `closeWindow` ∕ `abort` 三处 —— 闩体持有 = `suspension-timers.mjs`；与窗状态同刻变更，零跨档同步面。）

  /** 入口（回合尾结算后 —— 终局事件已出 · 在飞表已释）：`poolLive(agent)` 判真 ⇒ 进挂起会话（核件直消费）。
   *  返回是否入窗（同键已有窗 ∥ 池空 ⇒ false——零动作）。 */
  function start(key, agent, { cwd = null } = {}) {
    if (windows.has(key)) return false // 同键已有窗 ⇒ 零动作（窗内 deadline 由 `timerFace` 单持——不另武装）
    if (!poolLive(agent)) { timers.sync(key, agent); return false } // 未入窗 ⇒ 武装空闲闩（§6.30.11 装配点①）
    timers.disarm(key) // 入窗 ⇒ 撤空闲闩（同一 deadline 单持——零双注册）
    const controller = new AbortController()
    const entry = { key, agent, cwd, controller, frozen: null, handle: null, pending: [] }
    windows.set(key, entry)
    agent._sessionAbort = controller // 会话控制器（窗内 spawn 的 children 链 `_sessionSignal` —— 回合级中止不孤儿化）
    agent._sessionSignal = controller.signal
    const handle = startSuspension({
      carrier: agent,
      inputQueue: entry.pending, // 载体数组单一（受理 ∕ 消费 ∕ 残值 ∕ 清队同数组——零第二写者）
      abortSignal: controller.signal,
      runTurn: (text, opts) => driveTurn(entry, text, opts),
      takeInput: (list) => takeQueuedInput(list), // 取项缝（核件取项——合并批 ∕ 携图退化逐条）
      injectResidual: (item) => injectResidual(agent, item),
      timerFace: timers.faceOf(key, agent, cwd), // opt-in timer 面（§6.30.10）：窗内到期 ⇒ 兑现开 timer 轮（不等池空；#799：`deliver` 内先重装后投递）
      hooks: {
        onCounts: (counts) => { postSusp(key, agent, true, counts); sweepDigestedStuck(key, agent) }, // 计数 ⇒ `ev:susp`（核单点直传）+ 自愈扫拍
        reclaim: (consumed) => { reemitDone(key, consumed); sweepDigestedStuck(key, agent) }, // 回收 ⇒ 兜底幂等（起跑窗漏口 ∥ 迟结算面——本批 2026-10-01）+ 自愈扫拍
        freezeAll: () => { // 冻结 ⇒ 退出兜底同型（残项逐条补发；abort 径用中止前快照）
          const frozen = entry.frozen ?? resident(agent)
          entry.frozen = null
          reemitDone(key, frozen)
        },
      },
    })
    entry.handle = handle
    /** 出窗结算（兑现 ∕ 拒绝两径同点）：摘窗 + 载体复位 + 出窗帧（`ev:susp {active:false}`——携 `interrupted`：会话中止事实）⇒ 残输入兜底。 */
    const closeWindow = (failure) => {
      if (failure) console.error(`[suspension-drive] window ${key} failed: ${failure?.message ?? failure}`)
      windows.delete(key)
      if (agent._sessionAbort === controller) { agent._sessionAbort = null; agent._sessionSignal = null }
      postSuspEnd(key, agent, controller.signal.aborted)
      if (controller.signal.aborted) { // 会话中止径（dispose ∕ 切项目级联）：不续发——消息随会话终止
        const dropped = queue.clear(key, entry.pending) // 清队 + 状态帧（窗半归空 ⇒ 带退场——零残留）
        if (dropped > 0) console.error(`[suspension-drive] window ${key} aborted with ${dropped} accepted message(s) — dropped with the session`)
        return
      }
      timers.sync(key, entry.agent) // 出窗结算后（§6.30.11 装配点②）：窗退且仍有在途 ⇒ 重武装
      resumeResidual(entry).catch((err) => console.error(`[suspension-drive] window ${key} residual resume failed: ${err?.message ?? err}`))
    }
    handle.done.then(() => closeWindow(null), (err) => closeWindow(err))
      .catch((err) => console.error(`[suspension-drive] window ${key} exit chain failed: ${err?.message ?? err}`)) // 出窗链自吞错（帧发射抛不升为未处理拒绝）
    return true
  }

  /** 会话中止（`dispose(key)` ∕ 切项目级联）：清池不注入（陈旧结果不回灌）+ 出窗帧；返回是否命中（窗 ∥ 续发链）。
   *  **中止代次先落**（#515③ —— `timers.bump`：先于一切早退；无窗 ∕ 续发期两态同落 ⇒ 已点火回调即失效）；
   *  续发期（`closeWindow` 摘窗之后）窗表无项 ⇒ 落**中止墓碑**（`resumeResidual` 检查点消费——免中止盲区）。 */
  function abort(key) {
    timers.bump(key) // #515③ 陈旧点火闸（先于早退——置位与撤闩同刻）
    timers.disarm(key) // 会话清除面（§6.30.11 装配点③）：撤闩清点（无闩 ⇒ 零动作——返回语义不变：窗 ∥ 续发链）
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
    stepBoundaryPickup, // 步边界取批（窗面——`turn-driver` 组合线「窗优先」消费）
    /** 窗内输入路由：窗在场 ⇒ 核件入槽 + 唤醒（用户输入优先序沿核件）；返回受理三态——`true` = 受理 ∕ `"full"`
     *  = 容量拒（#625：满判先行——零受理 ∕ 零投影 ∕ 零帧 ∕ 零唤醒）∕ `false` = 未入窗（调用方回落既有径）。
     *  载体同数组受理（`entry.pending`——核输入队列；消费点 = 核件取项缝 ∕ 步边界窗面）⇒ **受理帧**；
     *  **载具层携图**：`images`（渲染面 `toImages` 投影原样）随条目——核件输入面 = 文本单形不变。 */
    pushInput(key, text, images) {
      const entry = windows.get(key)
      if (!entry) return false
      if (entry.pending.length >= QUEUED_MAX_ITEMS) return "full" // 容量判满（对齐 VSC ≥MAX 拒——核零改）
      const msg = String(text)
      queue.accept(key, entry.pending, msg, images) // 受理（富条目——与核输入队列同数组）+ 受理帧
      entry.handle.wake() // 核件唤醒（新条目已在同数组——零第二写者）
      return true
    },
    /** 窗在场判据（`msg:send` 路由分岔点 —— 键面路由 = `docs/desktop/design/PROJECT.md` §2.2）。 */
    active(key) { return windows.has(key) },
    /** 窗输入队投影读面（并源读面窗半 —— 宿主 `queueView` 懒取；未入窗 ∕ 空队 ⇒ `[]`；图不入快照）。 */
    inputSnapshot(key) { return queue.snapshot(windows.get(key)?.pending) },
    abort,
    /** 切项目（`project:open` 成功且 cwd 变更）：旧项目**全键**中止（窗 ∥ 续发链——§2.2 键面 ∕ 取值面双错位防护）；返回中止数。 */
    abortAll() {
      let n = 0
      for (const key of new Set([...windows.keys(), ...resuming, ...timers.keys()])) if (abort(key)) n += 1 // 闩键同入（#515③：空闲态键不在窗表 ∕ 续发链——代次同落）
      timers.disarmAll() // 切项目级联 ⇒ 撤闩清点（幂等——逐键 abort 已撤，兜底无闩面）
      return n
    },
    /** 窗数读数（诊断 ∕ 测试面）。 */
    size() { return windows.size },
    /** 闩数读数（诊断 ∕ 测试面 —— 撤闩清点断言；闩表为档内私有面）。 */
    timerLatches() { return timers.size() },
  }
}
