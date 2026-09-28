/**
 * composer-wire.mjs — 输入区**写面**出档（2026-09-28 输入逻辑收正轮 · `renderer/mount-composer.mjs` 越 500 硬限前的
 * 在册拆分预案落形 —— 单源 = `test/host-floor.test.mjs` U95 例外面登记「拆分预案 = 写面出档（`post` 映射表 + 逐
 * handler —— 候选面 = `renderer/composer-wire.mjs`）」）：通道往返归一 · 逐类型出站 handler（`msg:send` 直发 ∕
 * 队径 · `msg:interrupt` 停止 ∕ 中断注入 · `at:complete` · `session:prefs` · `session:flags` · footer 三出口 ⇒
 * 本地先行块登记与退流（`noteEcho` ∕ `retractEcho` —— B12 出泡面）· B21 失败态（`failed` 行源）。
 *
 * 注入面（deps）：`store`（切片读写）· `activeKey()`（现刻活动会话）· `call(channel, payload)`（窄桥往返 ——
 * mount 侧归一失败形）· `push(message)`（核件推送 —— `atResults` 回投）· `panelOf()`（核件面板读数面 ——
 * 直发失败径复位 loading）· `repaint()`（提示行重挂 —— mount 侧 `paintNotices`）· `onLoadingReset()`（忙态派生
 * 缓存复位 —— mount 侧 `lastBusy`）· 映射 ∕ 纯动作件（`toImages` 载荷投影 ∕ `degradedCode` 降级码过闸 ∕ `effortOf`
 * 档位写向映射（与 mount 侧读向 `reasoningOf` 同表）∕ `withUserBlock` 用户块单源写（mount 侧同取 —— 出泡不变式）∕
 * `setAttachDegraded` ∕ `applyFlags`）· `openSettings()`（footer 三出口 —— A8 唯一映射点）。
 *
 * 纪律（沿 mount 侧）：零 `node:` / 零裸包（渲染面静态闭包判据）；控制台诊断串非面向用户文案（不经 `t()`）。
 */

/** 回执 `reason` 归一（缺 ∕ 非串 ∕ 空串 ⇒ `fallback`）—— 诊断串单源（mount 侧候选面同引）。 */
export function reasonOf(receipt, fallback = "unknown") {
  return typeof receipt?.reason === "string" && receipt.reason !== "" ? receipt.reason : fallback
}

/** 写面工厂：返回 `{ post, noteEcho, retractEcho, failure }` —— `post(type, payload)` = 核件出站归一入口；
 *  `noteEcho(key, block)` = 本地先行块登记（`onUserEcho` 出泡后调用）；`retractEcho(key)` = 本地块退流（正径滞后）；
 *  `failure()` = B21 行源读数（mount 侧 `paintNotices` 取）。 */
export function createComposerWire(deps = {}) {
  const {
    store, activeKey, call, push, panelOf, repaint, onLoadingReset,
    toImages, degradedCode, effortOf, withUserBlock, setAttachDegraded, applyFlags, openSettings,
  } = deps

  let failed = null // B21 行源（回执写 —— 本地闭包量，非切片）
  let lastEcho = null // 最近一次本地先行出的用户块 `{ key, block }`（标记三态落点 —— 按引用定位）
  let atSeq = 0 // @ 面请求 seq（迟到回执丢弃判据 —— VSC `autocomplete.js:29-34` 同式）

  /** 失败态记录（B21）：`reason` 入态 + 记错 + 提示行重挂。 */
  function recordFailure(channel, receipt) {
    failed = reasonOf(receipt)
    console.error(`[composer] ${channel} failed: ${failed}`)
    repaint()
  }

  /** 直发径（D1）：受理 ⇒ 清 B21 + 降级码切片写（回执 `degraded` 浮出，表外码记错）；**回执言队形 ⇒ 本地块退流**
   *  （`retractEcho` —— 消费前流内零真块）；失败 ⇒ B21 行 + 本地 loading 标记复位（宿主未起跑 —— 防 Ctrl+C ∕
   *  中断模态门滞留）。 */
  async function sendDirect(key, payload) {
    if (key === null) return void console.error("[composer] msg:send skipped: no active session")
    const receipt = await call("msg:send", { key, text: String(payload?.text ?? ""), images: toImages(payload?.images) })
    if (receipt.ok !== true) {
      recordFailure("msg:send", receipt)
      panelOf()?.setLoading(false)
      onLoadingReset?.() // 忙态派生读数复位（收正轮 · 行 8）：本径直写 loading 面 ⇒ 缓存须跟（否则同态 sync 被吞）
      return
    }
    if (receipt.queued === true) retractEcho(key) // 忙位读数滞后正径（端判闲 ∕ 宿主已忙）：本地块退流（待发送件归输入区带）
    failed = null
    const code = degradedCode(receipt.degraded)
    if (code === null && receipt.degraded !== undefined && receipt.degraded !== null) {
      console.error(`[composer] msg:send: unknown degraded code: ${String(receipt.degraded)}`)
    }
    store.set(setAttachDegraded(store.get(), key, code))
    repaint()
  }

  /** 忙态径（D1 队径）：宿主任判忙态 ⇒ `{ ok:true, queued:true }`（气泡 ∕ 待发送标归队镜面）；成功径清 B21
   *  （收正轮 · 行 1：两分支 return 前 —— 同直发径式）；**回执兜底出泡**：回执 `ok` 真 ∧ 非队形 ⇒ 宿主按**直发**受理
   *  （忙位读数滞后反径：端判忙 ∕ 宿主已闲 ⇒ 直回合）—— 该径未走本地先行⇒ 此处补写用户块（**出泡不变式**：每受理
   *  消息恰一枚用户块）。 */
  async function sendQueued(key, payload) {
    if (key === null) return void console.error("[composer] queuedUserMessage skipped: no active session")
    const text = String(payload?.text ?? "")
    const receipt = await call("msg:send", { key, text, images: toImages(payload?.images) })
    if (receipt.ok !== true) return recordFailure("queuedUserMessage", receipt)
    failed = null // B21 清（受理径 —— 收正轮 · 行 1）
    if (receipt.queued !== true) {
      const block = { kind: "user", text, ts: Date.now() }
      store.set(withUserBlock(store.get(), key, block))
    }
    repaint()
  }

  /** 停止 ∕ 中断注入（D2 · 收正轮）：**单投** `msg:interrupt { key, message }` —— `abort` 无文本（停回合）；
   *  `interrupt` 携文本 ⇒ 宿主下传核 abort 面 ⇒ 同上下文注入续跑（VSC `panel-messages-turn.mjs:129-138` 同式；
   *  「abort + 另投 `msg:send`」双投形退场 —— 队径送达 ≠ 同上下文续跑）。 */
  async function abortTurn(key, message = "") {
    if (key === null) return void console.error("[composer] msg:interrupt skipped: no active session")
    const receipt = await call("msg:interrupt", { key, message })
    if (receipt.ok !== true) console.error(`[composer] msg:interrupt failed: ${reasonOf(receipt)}`)
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

  /** 会话级偏好写（D3 · 沿 `renderer/mount-head.mjs` `onField` 同判据）：回执 `ok` 真 ∧ `meta` 面 ⇒
   *  `sessionMeta[key]` 写（头面 ∕ 本档候选面两读面随动）；失败 ⇒ 记错零写（零乐观写）。 */
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

  /** 本地先行块登记（`onUserEcho` 出泡后调用 —— 标记三态的按引用锚）。 */
  function noteEcho(key, block) {
    lastEcho = { key, block }
  }

  /** 本地先行块**退流**（收正轮 B12 新口径 ④）：回执言队形（端判闲 ∕ 宿主已忙）⇒ 该条消费前不得占流内位
   *  （不变式 = 消费前流内零块 —— 待发送件住输入区带）；按引用定位摘除 —— 块已不在序列（重挂 ∕ 换页 /
   *  窗口溢出）⇒ 零写（诚实回归，禁假造）。 */
  function retractEcho(key) {
    const target = lastEcho
    if (target === null || target.key !== key) return
    const held = store.get()
    if (held?.activeSession !== key) return
    const blocks = Array.isArray(held.blocks) ? held.blocks : []
    const index = blocks.findIndex((block) => block === target.block)
    if (index < 0) return
    lastEcho = null
    store.set({ blocks: [...blocks.slice(0, index), ...blocks.slice(index + 1)] })
  }

  return { post, noteEcho, retractEcho, failure: () => failed }
}
