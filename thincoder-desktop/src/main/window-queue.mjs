/**
 * window-queue.mjs — 挂起窗输入队**投影面 ∕ 帧构造面**（自 `suspension-drive.mjs` 出档 ——「挂起窗径批 ∥ 窗队列批」
 * 合并实施轮：该档触 300 行顾问线，按在册拆分预案「窗队 ∕ 帧构造面出档」落形；批档 =
 * `docs/batches/2026-09-29-desktop-susp-queue.md` §2.9 发现 10 ∕ `docs/batches/2026-09-29-desktop-window-queue-parity.md`
 * §2.9 发现 4（档名实施批定 ⇒ 本档）。
 *
 * 四面（单源 = `docs/desktop/design/PROJECT.md` §2 **KD-40 ⑥** ∕ **KD-34**；形 ∕ 推送点 = `docs/desktop/design/IPC.md`
 * §1 `ev:queue` 行）：
 *   ① 条目形 = 富条目 `{ text, ts, images? }`（与忙态队条目同形 —— `queued-input.mjs`）；**图不入快照**（投影恰形
 *      `{ text, ts }` —— `dataURL` 不回传渲染面，两端同形）。
 *   ② 窗队投影 = 每窗一表（载体 = 窗条目 `entry.pending`；本档只操作不持有）：受理入队 · 步边界取批（`stepPickup`）·
 *      残值倾出 · 窗中止清队；取项 = 核件 `takeQueuedBatchItem`（**取项单源——本档零第二判据**）。
 *   ③ 六帧（推送点 = 窗内受理 ∕ 步边界消费 ∕ 窗内消费 ∕ 残输入续发 ∕ 窗中止清队 ∕ **残值弃件链尾**）：
 *      受理 ∕ 清队 ∥ 链尾 ⇒ 状态形（快照整置 · 幂等）；消费 ∕ 残续发 ∕ 步边界消费 ⇒ 消费回执形（`delivered = { text, ts?, degraded? }`）。
 *      链尾状态帧 = 弃件径收口（#912）——**帧类记一，物理站点两**（墓碑出口 ∥ `!stillHeld` 断点——均住 `suspension-drive.mjs` `resumeResidual`）。
 *      帧出站经注入 `postQueue`（= 链
 *      `postQueue` —— **帧构造单点保位 `turn-chain.mjs`**，本档只定点不造形）。
 *   ④ 送达面（携图径 —— 与 `turn-chain.mjs` **同判据**）：`prepare` 判决 ⇒ `degrade` 定局（非视觉读图：成功 = 描述
 *      注文 ∕ 失败 = 原文 + 说明行），`delivered.degraded` 取定局后判决码（零弃 ⇒ 键缺席）。
 *
 * 零宿主依赖（`postQueue` ∕ `prepare` ∕ `degrade` 三注入，缺省 ⇒ 零出站 ∕ 无附件径）⇒ 平 node 直测。
 */
import { planQueuedInput, takeQueuedBatchItem } from "@thincoder/core/queued.mjs"
import { entryTimeOf, textOf } from "./queued-input.mjs"

/** 受理条目投影（`{ text, ts }` 逐字 ∕ 入队现刻 ms；`images` 非空数组才携 —— 与忙态队条目同形，缺 ⇒ 无附件径）。 */
function entryOf(text, images) {
  const entry = { text: String(text), ts: Date.now() }
  if (Array.isArray(images) && images.length > 0) entry.images = images
  return entry
}

/** 贴图判定（步边界让位 —— 图片随条目元数据走降级面，不静默丢）。 */
const hasImages = (q) => Array.isArray(q?.images) && q.images.length > 0

/** 窗队工厂：`postQueue(key, delivered?)` = `ev:queue` 出站（链 `postQueue` 注入 —— 快照源 = 两源合并读面）·
 *  `prepare(text, images, agent)` = 送达面附件装配转口（`prepareTurnAttachments`）· `degrade(attached, agent, signal)`
 *  = 非视觉降级转口（`degradeTurnAttachments` —— 两件皆与 `turn-chain.mjs` 同源单点，缺省 ⇒ 无附件径）。
 *  返回 `{ accept, stepPickup, drain, consume, clear, emitState, snapshot }`。 */
export function createWindowQueue({ postQueue = null, prepare = null, degrade = null } = {}) {
  /** 帧出站（`delivered` 缺 ⇒ 状态形；帧形构造单点住链 —— 本档只定点）。 */
  const emit = (key, delivered = null) => { if (typeof postQueue === "function") postQueue(key, delivered) }

  /** 消费回执载荷（`delivered` 形单源 = `docs/desktop/design/IPC.md` §1）：`text` = 该条文本逐字 · `ts` = 入队
   *  现刻（非有限数 ⇒ 键缺席 —— 禁假造）· `degraded` = 送达面判决码（非串 ∕ 空串 ⇒ 键缺席）。 */
  function deliveredOf(entry, attached) {
    const delivered = { text: textOf(entry), ts: entryTimeOf(entry) }
    if (delivered.ts === null) delete delivered.ts
    if (typeof attached?.degraded === "string" && attached.degraded !== "") delivered.degraded = attached.degraded
    return delivered
  }

  /** 送达面（携图径 —— 载具层携图）：富条目携图 ⇒ `prepare` 判决（落盘 ∕ 降级码；出口零抛契约同源档）；
   *  无图 ∕ 缺注入 ⇒ `null`（零动作径）。 */
  function attachmentsOf(entry, agent) {
    const images = Array.isArray(entry?.images) ? entry.images : []
    return prepare === null || images.length === 0 ? null : prepare(textOf(entry), images, agent)
  }

  return {
    /** 窗内受理：富条目入队 + 状态帧（受理即推）；`images` = 渲染面 `toImages` 投影原样。 */
    accept(key, pending, text, images) {
      pending.push(entryOf(text, images))
      emit(key)
    },
    /** 步边界取批（**纯件** —— 同步缝；`turn-driver` 组合线「窗优先」消费）：计划首动作即消费（`slash` ⇒ 单条
     *  同判）；批内含图 ⇒ **整批让位**（同步缝不可降级 —— 留给送达径）；返回待注入 `{ text, ts } | null`
     *  （空队 ∕ 让位 ⇒ `null` —— 零消费零帧）。`text` = 注入文本（合并批 = 合并格式 ∕ 单条 = 原文）。 */
    stepPickup(pending) {
      const list = Array.isArray(pending) ? pending : []
      if (list.length === 0) return null
      const action = planQueuedInput(list.map(textOf))[0]
      const count = action.kind === "turn" ? action.count : 1
      if (list.slice(0, count).some(hasImages)) return null // 批内含图 ⇒ 整批让位（与链径同判据）
      const { item, merged } = takeQueuedBatchItem(list) // 核件取项（就地消费 —— 单源）
      return item === null ? null : { text: merged, ts: entryTimeOf(item) }
    },
    /** 残输入倾出（出窗残值续发链 —— 倾出后按核件取项分批路由，逐批消费帧）。 */
    drain(pending) { return pending.splice(0) },
    /** 消费（窗内消费 ∕ 残续发两同点）：送达面（`prepare` 判决 ⇒ `degrade` 定局）⇒ 消费帧（`delivered` 单写者
     *  入流恰一枚的宿主半）；返回回合入参 `{ text, attached }`（`text` = 送达文本——无附件径 ∕ 送达面违约（非串）
     *  ⇒ 该条文本逐字；判据与链径 `turn-chain.mjs:94` 同式）。
     *  **时序面（占位 ∕ 中断语义）**：`signal` = 调用方占位信号（`hold.signal`——缺缝 ∥ 零占位 ⇒ `null`，沿链径缺省式）；
     *  窗内 `msg:interrupt` 命中占位 ⇒ 降级信号 abort（读图 fail-fast）——起窗 ∕ 查位 ∕ `release` 与窗后零起跑
     *  判据住守卫件 `suspension-guard.mjs`（两调用点 `driveTurn` ∕ `resumeResidual` 经其守卫）。 */
    async consume(key, entry, agent, signal = null) {
      const prepared = attachmentsOf(entry, agent)
      const attached = prepared === null || degrade === null ? prepared : await degrade(prepared, agent, signal)
      emit(key, deliveredOf(entry, attached))
      return { text: typeof attached?.text === "string" ? attached.text : textOf(entry), attached }
    },
    /** 窗中止清队：清非空 ⇒ 状态帧（窗半归空 ⇒ 带退场）；返回清出条数（零条 ⇒ 零帧 —— 零动作径）。 */
    clear(key, pending) {
      const n = pending.length
      if (n === 0) return 0
      pending.length = 0
      emit(key)
      return n
    },
    /** 链尾状态帧（弃件径收口 · #912）：把当前投影再置一次（快照整置 · 幂等）——`emit` 的公开面（帧形
     *  零第二构造）。消费侧：`resumeResidual` 两弃件出口（墓碑 ∥ `!stillHeld`）各补一帧 ⇒ 镜面恒收口为实况。 */
    emitState(key) { emit(key) },
    /** 投影读面（并源读面窗半 —— 图不入快照，恰形 `{ text, ts }`）。 */
    snapshot(pending) {
      return (Array.isArray(pending) ? pending : []).map((entry) => ({ text: textOf(entry), ts: entryTimeOf(entry) }))
    },
  }
}
