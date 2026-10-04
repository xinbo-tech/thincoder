/**
 * composer-wire.mjs — 输入区**写面**出档（2026-09-28 输入逻辑收正轮 · `renderer/mount-composer.mjs` 越 500 硬限前的
 * 在册拆分预案落形 —— 单源 = `test/host-floor.test.mjs` U95 例外面登记「拆分预案 = 写面出档（`post` 映射表 + 逐
 * handler —— 候选面 = `renderer/composer-wire.mjs`）」）：通道往返归一 · 逐类型出站 handler（`msg:send` 直发 ∕
 * 队径 · `msg:interrupt` 停止 ∕ 中断注入 · `at:complete` · `session:prefs` · `session:flags` · footer 三出口 ⇒
 * 本地先行块登记与退流（`noteEcho` ∕ `retractEcho` —— B12 出泡面）· B21 失败态（`failed` 行源 ——
 * 载体 `{ reason, kind }`：`provider-invalid` 回执真因分类 `providerKind` 透传，#840）。
 *
 * 注入面（deps）：`store`（切片读写）· `activeKey()`（现刻活动会话）· `call(channel, payload)`（窄桥往返 ——
 * mount 侧归一失败形）· `push(message)`（核件推送 —— `atResults` 回投）· `panelOf()`（核件面板读数面 ——
 * 直发失败径复位 loading）· `repaint()`（提示行重挂 —— mount 侧 `paintNotices`）· `onLoadingReset()`（忙态派生
 * 缓存复位 —— mount 侧 `lastBusy`）· `suspIdleOf(state, key)`（挂起空闲判据 —— 窗内直发径回执后复位 loading；
 * 缺省 ⇒ 零复位）· `slotFullNotice(message)`（#656 · cap 待答径队满可见形 —— 核件 toast `input.slotFull` +
 * 文本回注输入框，零丢失；回注缝 = 挂载面注入小口；缺省 ⇒ 零动作）· 映射 ∕ 纯动作件（`toImages` 载荷投影 ∕ `degradedCode` 降级码过闸 ∕ `effortOf`
 * 档位写向映射（与 mount 侧读向 `reasoningOf` 同表）∕ `withUserBlock` 用户块单源写（mount 侧同取 —— 出泡不变式）∕
 * `setAttachDegraded` ∕ `applyFlags`）· `openSettings()`（footer 三出口 —— A8 唯一映射点）。
 *
 * 纪律（沿 mount 侧）：零 `node:` / 零裸包（渲染面静态闭包判据）；控制台诊断串非面向用户文案（不经 `t()`）。
 * **#597（发送忙态时机）+ #596（回执超时）**：`sendDirect` 三增 —— ① 失败回执 `started === false`（宿主未受理）⇒
 * `clearRunning` 忙位回收（守卫 = 本尝试仍最新）；② 发送回执超时界（`sendTimeoutMs` 注入缝，缺省 120000）⇒ 清位 ∕
 * 失败行 ∕ 退流；③ 迟到回执自愈（失败行清受最新门 ∕ 用户块补写不受门）。
 * **#613（回声槽竞态）**：`lastEcho` 槽随尝试键控 —— `noteEcho` 落**未认领**登记（`attempt: null`）；`sendDirect`
 * 令牌诞生点**认领**（未认领 ∧ 键同 ⇒ 补本提交令牌）；`retractEcho(key, attempt)` 以认领令牌守卫（槽被后提交覆盖 ∕
 * 未认领 ⇒ 零动作 —— 滞后回执不得错摘后提交块）。
 * **#656（cap 待答径队满可见形 · KD-52 ③）**：`abortTurn` 收 `{ ok:false, reason:"queue-full" }` ⇒ 单点消费注入缝
 * `slotFullNotice(message)`（词键复用 `input.slotFull` —— i18n 零增；文本回注输入框 —— 零丢失）；其余失败因（`idle` ∕
 * `bad-key`）照旧仅诊断一行（既有形零变）。
 * **#841（provider 态回执落写）**：`msg:send` 成功回执 `providerState` ⇒ 切片写（三路同规则：`sendDirect` ∥
 * `sendQueued` ∥ `healLate`——键缺席 ⇒ 零写）；单源 = `docs/desktop/design/IPC.md` §2「provider 态投影注」。
 * **#880（选定写回径回执）**：`session:prefs` 成功回执另携条件性 `providerState`（第四刷新点）⇒ `writePrefs`
 * 同规则切片写（键缺席 ⇒ 零写——`setProviderState` 负向锁；提示带 `paintNotices` 重派生）。
 */
import { clearRunning } from "./badges.mjs"
import { clearTurnTraces, setProviderState, withFlowOp } from "./store.mjs"

/** 回执 `reason` 归一（缺 ∕ 非串 ∕ 空串 ⇒ `fallback`）—— 诊断串单源（mount 侧候选面同引）。 */
export function reasonOf(receipt, fallback = "unknown") {
  return typeof receipt?.reason === "string" && receipt.reason !== "" ? receipt.reason : fallback
}

/** 发送回执超时哨兵（timer 先到 —— 与回执值域无交集）。 */
const SEND_TIMEOUT = Symbol("send-timeout")

/** 忙位读数（本键位标含 `running`）—— 超时清位「位标在场」判据；本档须 node 可装载（直测面）⇒ 不引视图面
 *  向下依赖（同式 = `renderer/views/chrome.mjs` `busyOf`）。 */
const runningOf = (state, key) => Array.isArray(state?.tabBadges?.[key]) && state.tabBadges[key].includes("running")

/** 写面工厂：返回 `{ post, noteEcho, retractEcho, failure }` —— `post(type, payload)` = 核件出站归一入口；
 *  `noteEcho(key, block)` = 本地先行块登记（`onUserEcho` 出泡后调用 —— **未认领**态）；`retractEcho(key, attempt)` = 本地块退流
 *  （正径滞后；`attempt` = 本回执所在尝试令牌 —— #613 槽守卫：槽内认领 ≠ 本令牌 ⇒ 零动作）；
 *  `failure()` = B21 行源读数（mount 侧 `paintNotices` 取）。 */
export function createComposerWire(deps = {}) {
  const {
    store, activeKey, call, push, panelOf, repaint, onLoadingReset, suspIdleOf = null,
    toImages, degradedCode, effortOf, withUserBlock, setAttachDegraded, applyFlags, openSettings,
    slotFullNotice = null, // #656：cap 待答径队满可见形缝（toast + 文本回注 —— 挂载面注入；缺省 ⇒ 零动作）
    sendTimeoutMs = 120000, // 发送回执超时界（#596 并入 —— 工厂注入缝；装配面零传 = 生产缺省）
  } = deps

  let failed = null // B21 行源（回执写 —— 本地闭包量，非切片）
  let lastEcho = null // 最近一次本地先行出的用户块 `{ key, block, attempt }`（标记三态落点 —— 按引用定位；`attempt` = 提交侧认领令牌 —— #613，未认领 ⇒ `null`）
  let atSeq = 0 // @ 面请求 seq（迟到回执丢弃判据 —— VSC `autocomplete.js:29-34` 同式）
  const inFlight = new Map() // 本键最新发送尝试登记（key → 尝试令牌 —— 陈旧回执 ∕ 陈旧超时守卫单点 · #597）

  /** 失败态记录（B21）：`{ reason, kind }` 入态 + 记错 + 提示行重挂。`kind` = `provider-invalid` 回执真因
   *  分类（`providerKind` 键透传 —— 缺 ∕ 非串 ∕ 空 ⇒ `null`；批 #840 —— 渲染面按类出词）；其余失败径
   *  `kind` 恒 `null`（负向锁）。**console 行逐字保持**（`${reason}` —— E2E 锚 `provider-invalid`）。 */
  function recordFailure(channel, receipt) {
    const kind = typeof receipt?.providerKind === "string" && receipt.providerKind !== "" ? receipt.providerKind : null
    failed = { reason: reasonOf(receipt), kind }
    console.error(`[composer] ${channel} failed: ${failed.reason}`)
    repaint()
  }

  /** 直发径（D1；#597 接入）：受理 ⇒ 清 B21 + 降级码切片写（回执 `degraded` 浮出，表外码记错）；**回执言队形 ⇒ 本地块退流**
   *  （`retractEcho` —— 消费前流内零真块）+ **挂起空闲复位**（`suspIdleOf` 真 ⇒ loading 门禁归位 —— 窗内直发径
   *  未起跑，防假中断位）；失败 ⇒ 本地块**退流**（零块 —— KD-23 失败径的本地先行回滚面）+ B21 行 + 本地 loading
   *  标记复位（宿主未起跑 —— 防 Ctrl+C ∕ 中断模态门滞留）；**宿主未受理（`started === false` —— 四清位 ∕ 装配抛 ∕
   *  装配窗中止）⇒ 位标回收**（`clearRunning` 单点；守卫 = 本尝试仍为该键最新登记）；**回执超时界**（timer 先到 ⇒
   *  清位（最新 ∧ 位标在场）∕ 失败行 `timeout` ∕ 退流；`orig` 另挂续延兜迟到值 —— 自愈见 `healLate`）。 */
  async function sendDirect(key, payload) {
    if (key === null) return void console.error("[composer] msg:send skipped: no active session")
    const text = String(payload?.text ?? "")
    const attempt = {} // 尝试令牌（登记 = `inFlight` 最新）
    inFlight.set(key, attempt)
    // #613 提交侧认领：回声先行于上行（核 `composer/panel.mjs` `onUserEcho` 先于 `post`）⇒ 回声时刻 `inFlight` 尚为
    // 上一提交令牌 ⇒ 令牌不得在回声侧读；未认领槽在本提交令牌诞生点认领（回声与上行同同步链相接 ⇒ 认领恒命中
    // 本提交）；`sendQueued` 不认领（该径零本地块 ∕ 零退流调用 —— 现式 `inFlight.set(key, {})` 保留）。
    if (lastEcho !== null && lastEcho.key === key && lastEcho.attempt === null) lastEcho = { key, attempt, block: lastEcho.block }
    store.set(clearTurnTraces(store.get(), key)) // 回合起跑门清点（行痕族消失时机批 · KD-74——发出即清，出站前沿同笔）
    const orig = call("msg:send", { key, text, images: toImages(payload?.images) })
    let settled = false // 单次结算标志（§2.12 条 7）：正常径先到 ⇒ 迟到续延零动作（两径正交）
    let timer = null
    const receipt = await Promise.race([
      orig,
      new Promise((resolve) => { timer = setTimeout(() => resolve(SEND_TIMEOUT), sendTimeoutMs) }),
    ])
    if (receipt === SEND_TIMEOUT) {
      // 超时界（#596 并入）：本尝试仍最新 ∧ 位标在场 ⇒ 清位；失败行 + 退流（宿主未回 —— 视同未受理）
      if (inFlight.get(key) === attempt && runningOf(store.get(), key)) store.set(clearRunning(store.get(), key))
      retractEcho(key, attempt)
      recordFailure("msg:send", { reason: "timeout" })
      panelOf()?.setLoading(false)
      onLoadingReset?.()
    } else {
      settled = true // 正常径先到 ⇒ 迟到续延零动作
      clearTimeout(timer) // 界清点（零残留计时器）
      if (receipt.ok !== true) {
        // 失败径收位（#597 · 2.3(3)）：`started === false`（受理即置的四清位 ∕ 装配抛 ∕ 装配窗中止）⇒ 位标回收（守卫 = 本尝试仍最新）
        if (receipt.started === false && inFlight.get(key) === attempt) store.set(clearRunning(store.get(), key))
        retractEcho(key, attempt) // 失败径退流（挂起窗径批）：本地先行块回滚（KD-23 失败径「稿逐字留 + 零块」的本地块面）
        recordFailure("msg:send", receipt)
        panelOf()?.setLoading(false)
        onLoadingReset?.() // 忙态派生读数复位（收正轮 · 行 8）：本径直写 loading 面 ⇒ 缓存须跟（否则同态 sync 被吞）
        return
      }
      // #841：成功回执 `providerState` 落切片（键缺席/形不合 ⇒ 零写）—— 提示带明示行重派生。失败径零叠加。
      store.set(setProviderState(store.get(), receipt.providerState))
      if (receipt.queued === true) { // 忙位读数滞后正径（端判闲 ∕ 宿主已忙 ∕ 已入挂起窗）
        retractEcho(key, attempt) // 本地块退流（待发送件归输入区带）
        if (suspIdleOf?.(store.get(), key) === true) { // 挂起空闲复位（窗内回合在飞 ⇒ 零复位——真回合门不误关）
          panelOf()?.setLoading(false)
          onLoadingReset?.()
        }
      }
      failed = null
      const code = degradedCode(receipt.degraded)
      if (code === null && receipt.degraded !== undefined && receipt.degraded !== null) {
        console.error(`[composer] msg:send: unknown degraded code: ${String(receipt.degraded)}`)
      }
      store.set(setAttachDegraded(store.get(), key, code))
      repaint()
    }
    // 迟到续延（§2.12 条 7）：挂 `orig` 兜迟到值 —— 超时径（settled 假）⇒ 自愈；正常径 ⇒ 零动作。
    void orig.then((late) => { if (!settled) healLate(key, attempt, late, text) })
  }

  /** 迟到自愈（§2.12 条 6 分治）：`ok` 真 —— **失败行清 = 受最新尝试守卫门**（行槽属后续尝试面——防重发径自身
   *  失败行被陈旧 `ok` 抹掉）；**用户块补写 = 不受门**（「每受理消息恰一枚块」消息级不变式——重发同文双块 =
   *  双受理的如实投影，不合并 ∕ 不去重）；队形 ⇒ 零块补（退流态保持——消费时刻由队径补写）；`ok` 假 ⇒ 零追加。 */
  function healLate(key, attempt, receipt, text) {
    if (receipt?.ok !== true) return
    let touched = false
    // #841：迟到成功回执同携 `providerState` ⇒ 切片写（重派生受 touched 门 —— provider 态 = config 级）
    if (receipt.providerState !== undefined) {
      if (!Object.is(store.get().providerState, receipt.providerState)) touched = true
      store.set(setProviderState(store.get(), receipt.providerState))
    }
    if (inFlight.get(key) === attempt && failed !== null) { failed = null; touched = true }
    if (receipt.queued !== true) {
      store.set(withUserBlock(store.get(), key, { kind: "user", text, ts: Date.now() }))
      touched = true
    }
    if (touched) repaint()
  }

  /** 忙态径（D1 队径）：宿主任判忙态 ⇒ `{ ok:true, queued:true }`（气泡 ∕ 待发送标归队镜面）；成功径清 B21
   *  （收正轮 · 行 1：两分支 return 前 —— 同直发径式）；**回执兜底出泡**：回执 `ok` 真 ∧ 非队形 ⇒ 宿主按**直发**受理
   *  （忙位读数滞后反径：端判忙 ∕ 宿主已闲 ⇒ 直回合）—— 该径未走本地先行⇒ 此处补写用户块（**出泡不变式**：每受理
   *  消息恰一枚用户块）。 */
  async function sendQueued(key, payload) {
    if (key === null) return void console.error("[composer] queuedUserMessage skipped: no active session")
    const text = String(payload?.text ?? "")
    inFlight.set(key, {}) // 重发登记（陈旧守卫：重发一经发起 ⇒ 前次即非最新 · #597）
    store.set(clearTurnTraces(store.get(), key)) // 回合起跑门清点（行痕族消失时机批 · KD-74——发出即清，出站前沿同笔）
    const receipt = await call("msg:send", { key, text, images: toImages(payload?.images) })
    if (receipt.ok !== true) return recordFailure("queuedUserMessage", receipt)
    failed = null // B21 清（受理径 —— 收正轮 · 行 1）
    store.set(setProviderState(store.get(), receipt.providerState)) // #841：成功回执 providerState 落切片（键缺席 ⇒ 零写）
    if (receipt.queued !== true) {
      const block = { kind: "user", text, ts: Date.now() }
      store.set(withUserBlock(store.get(), key, block))
    }
    repaint()
  }

  /** 停止 ∕ 中断注入（D2 · 收正轮）：**单投** `msg:interrupt { key, message }` —— `abort` 无文本（停回合）；
   *  `interrupt` 携文本 ⇒ 宿主下传核 abort 面 ⇒ 同上下文注入续跑（VSC `panel-messages-turn.mjs:129-138` 同式；
   *  「abort + 另投 `msg:send`」双投形退场 —— 队径送达 ≠ 同上下文续跑）。
   *  **#656（KD-52 ③）**：cap 询问待答径队满 ⇒ 宿主回 `queue-full`（**零中止** ∕ 零入队 —— 询问在场）⇒
   *  端侧可见形 = `slotFullNotice(message)`（toast + 文本回注 —— 零丢失；缺省 ⇒ 零动作）；其余失败因照旧诊断。 */
  async function abortTurn(key, message = "") {
    if (key === null) return void console.error("[composer] msg:interrupt skipped: no active session")
    const receipt = await call("msg:interrupt", { key, message })
    if (receipt.ok !== true) {
      const reason = reasonOf(receipt)
      // #656：cap 待答径拒收 ⇒ 可见形单点（toast + 文本回注）；`idle` 等其余因零可见形（既有形零变）。
      if (reason === "queue-full" && typeof slotFullNotice === "function") slotFullNotice(message)
      console.error(`[composer] msg:interrupt failed: ${reason}`)
    }
  }

  /** @ 补全（D5）：回执 `seq` ≠ 现存 seq ⇒ **迟到丢弃**（不下发 ∕ 不覆盖 —— 慢请求不得挤掉新下拉）。 */
  async function askAtComplete(payload) {
    const query = typeof payload?.query === "string" ? payload.query : ""
    atSeq = typeof payload?.seq === "number" ? payload.seq : atSeq + 1
    const receipt = await call("at:complete", { query, seq: atSeq })
    if (receipt.seq !== atSeq) return
    if (receipt.ok !== true) return void console.error(`[composer] at:complete failed: ${reasonOf(receipt)}`)
    push({ type: "atResults", matches: Array.isArray(receipt.matches) ? receipt.matches : [] })
  }

  /** 会话级偏好写（D3 —— 输入区控件行 = 三值唯一居所）：回执 `ok` 真 ∧ `meta` 面 ⇒
   *  `sessionMeta[key]` 写（本档候选面读面随动）；失败 ⇒ 记错零写（零乐观写）。
   *  **#880**：选定写回径成功回执另携条件性 `providerState`（第四刷新点）⇒ 同规则切片写
   *  （键缺席 ⇒ 零写——`setProviderState` 负向锁）⇒ 提示带明示行重派生。 */
  async function writePrefs(key, patch) {
    if (key === null) return void console.error("[composer] session:prefs skipped: no active session")
    const receipt = await call("session:prefs", { key, patch })
    const meta = receipt?.meta
    if (receipt.ok !== true || meta === null || typeof meta !== "object") {
      console.error(`[composer] session:prefs failed: ${reasonOf(receipt, "invalid-shape")}`)
      if (receipt.ok === true) console.error("[composer] session:prefs: success receipt without meta")
      return
    }
    const table = store.get().sessionMeta
    store.set({ sessionMeta: { ...(table !== null && typeof table === "object" ? table : {}), [key]: meta } })
    store.set(setProviderState(store.get(), receipt.providerState)) // #880：键缺席 ⇒ 原引用（零写）
  }

  /** 模式位写（D4）：回执成功径携 `flags` 活值 ⇒ 切片写（`applyFlags` —— 与页读 ∕ 出站两径同点）。 */
  async function writeFlags(key, patch) {
    if (key === null) return void console.error("[composer] session:flags skipped: no active session")
    const receipt = await call("session:flags", { key, patch })
    if (receipt.ok !== true) return void console.error(`[composer] session:flags failed: ${reasonOf(receipt)}`)
    if (receipt.flags !== undefined) store.set(applyFlags(store.get(), key, receipt.flags))
  }

  /** 面板出站归一（核件 `post(type, payload)` 全类型 ⇒ 桌面通道；表外类型记错不静默）。 */
  function post(type, payload = {}) {
    const key = activeKey()
    const flag = (name) => (payload.value === true ? { [name]: true } : { [name]: false })
    switch (type) {
      case "userMessage": return void sendDirect(key, payload)
      case "queuedUserMessage": return void sendQueued(key, payload)
      case "abort": return void abortTurn(key)
      case "interrupt": return void abortTurn(key, typeof payload.message === "string" ? payload.message : "")
      case "atComplete": return void askAtComplete(payload)
      case "selectModel": return void writePrefs(key, { model: String(payload.model ?? ""), provider: String(payload.provider ?? "") })
      case "selectReasoning": return void writePrefs(key, { effort: effortOf(payload.reasoning) })
      case "setAutoApprove": return void writeFlags(key, flag("autoApprove"))
      case "setPlanMode": return void writeFlags(key, flag("planMode"))
      case "setAdvisorGuard": return void writeFlags(key, flag("advisorGuard"))
      case "setEngineeringEnabled": return void writeFlags(key, flag("engineering"))
      // footer 三出口 ⇒ 设置面（A8 唯一映射点）：渠道增 / 删 / 密钥三事皆住设置面（本端零第二实现）
      case "addProvider": case "removeProvider": case "setKey": return void openSettings?.()
      default: return void console.error(`[composer] unknown post type: ${String(type)}`)
    }
  }

  /** 本地先行块登记（`onUserEcho` 出泡后调用 —— 标记三态的按引用锚；**未认领**态 —— 尝试令牌由提交侧
   *  （`sendDirect` 令牌诞生点）认领 —— #613：回声先行，令牌后生，两事同链相接）。 */
  function noteEcho(key, block) {
    lastEcho = { key, block, attempt: null }
  }

  /** 本地先行块**退流**（收正轮 B12 新口径 ④）：回执言队形（端判闲 ∕ 宿主已忙）⇒ 该条消费前不得占流内位
   *  （不变式 = 消费前流内零块 —— 待发送件住输入区带）；按引用定位摘除 —— 块已不在序列（重挂 ∕ 换页 /
   *  窗口溢出）⇒ 零写（诚实回归，禁假造）。
   *  **#613 尝试守卫**：`attempt` = 本回执所在尝试的本地令牌（三调用面全住 `sendDirect`——`attempt` 直取）；
   *  槽内认领 ≠ 本令牌（槽被后提交覆盖 ∕ 未认领）⇒ **零动作**（滞后回执不得错摘后提交块）。
   *  **结构作业（流面作业单）**：摘除同笔带 `cut{index}`（单源 = `docs/desktop/design/RENDERER.md` §1.1）——
   *  结算步据此按位摘块节点（不再依赖逐位配对判定）；**摘至零块**（本即唯一块）⇒ 同笔并 `build` —— 空窗引导面
   *  只归构造径（沿关页同款先例；`cut` = 唯一减块作业 ⇒ 该条件即全覆盖）。 */
  function retractEcho(key, attempt) {
    const target = lastEcho
    if (target === null || target.key !== key) return
    if (target.attempt !== attempt) return
    const held = store.get()
    if (held?.activeSession !== key) return
    const blocks = Array.isArray(held.blocks) ? held.blocks : []
    const index = blocks.findIndex((block) => block === target.block)
    if (index < 0) return
    lastEcho = null
    const next = [...blocks.slice(0, index), ...blocks.slice(index + 1)]
    // 结构作业（流面作业单）：`cut{index}` = 退流摘；**摘至零块**（本即唯一块）⇒ 同笔并 `build` —— 空窗
    // 引导面只归构造径承接（沿关页同款先例；`cut` = 唯一减块作业 ⇒ 该条件即全覆盖）。
    const cut = withFlowOp({ blocks: next }, { kind: "cut", index })
    store.set(next.length === 0 ? withFlowOp(cut, { kind: "build" }) : cut)
  }

  return { post, noteEcho, retractEcho, failure: () => failed }
}
