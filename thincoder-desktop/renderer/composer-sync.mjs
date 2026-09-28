/**
 * composer-sync.mjs — 输入面板**随动派生面**（自 `renderer/mount-composer.mjs` 拆出——#510 留守拆档 ·
 * 2026-09-29；该档越 300 顾问线，按面续拆）。迁入面 = ④ `state` 读面 + 忙态 ∕ 守卫派生（`syncBusy`）+
 * 模式位推送（`pushFlags`）+ 候选面（投影三助手 + `syncCandidates`）+ 两挂件锚窄刷（`paintNotices`
 * 提示带 ∕ `syncLastCopy` 末条复制控件）+ 随动总入口 `syncPanel`。装配与通道面（槽装配 ∕ 写面 deps ∕
 * 出泡钩 ∕ `submit` ∕ `refresh` ∕ `detach`）留 `mount-composer.mjs`。
 *
 * deps（注入面）：`store`（切片读面）· `activeKey` · `call`（通道往返）· `push`（核件推送）· `pushSubs`
 * （面板订阅表——`state.subscribe` 写入面）· `wire`（写面句柄——取 `failure()`）· `writeText`（复制控件）·
 * `panelOf` ∕ `noticesOf` ∕ `tailOf`（装配期后置位读面——访问器注入）。
 * **档位两向映射**（`effortOf` ∕ `reasoningOf` + `REASONING_NONE`）随迁本档（同批拆分）：写面 deps 注入（`effortOf`）
 * 与本档 `prefsOf` 同源单表。
 * 形态单源 = `docs/desktop/design/UI.md` §1 输入区行 ∕ `docs/desktop/design/IPC.md` §2；纪律同源档：
 * 零 `node:` / 零裸包；零静默（失败必响亮）。
 */
import { degradedCode, degradedNotice } from "./attach.mjs"
import { reasonOf } from "./composer-wire.mjs"
import { build, clear } from "./dom.mjs"
import { t } from "./i18n.mjs"
import { setModelCandidates } from "./store.mjs"
import { busyOf } from "./views/chrome.mjs"
import { lastAssistantText, lastCopyNode } from "./views/chat-copy.mjs"
import { paintPendingOverflow, pendingGroupNode } from "./views/chat-pending.mjs"

/** 核件「关思考」档字面（`reasoning.none` —— 两向映射的锚值）。 */
const REASONING_NONE = "none"

/** 档位两向映射（写 = 核 `reasoning` ⇒ 端 `effort`；读 = 端 ⇒ 核）：`none` ⇄ `"off"`；核中性档 `""` ⇄ 端 `"auto"`
 *  （端写面归一 `null` = 未设 —— 同 `session:prefs` 值域）；余档位原样。两向同表 ⇒ 写后回读恒等（零空写）。
 *  `effortOf` 导出供写面 deps 注入（`mount-composer.mjs` 单点）；`reasoningOf` 供本档 `prefsOf`。 */
export function effortOf(reasoning) {
  if (reasoning === REASONING_NONE) return "off"
  return typeof reasoning === "string" && reasoning !== "" ? reasoning : "auto"
}
function reasoningOf(effort) {
  if (typeof effort !== "string" || effort === "" || effort === "auto") return ""
  return effort === "off" ? REASONING_NONE : effort
}

/** 派生面工厂（一次装配 —— 会话期常驻；两宿主锚与 `panel` 装配期后置位 ⇒ 访问器读面）。 */
export function createComposerSync({ store, activeKey, call, push, pushSubs, wire, writeText, panelOf, noticesOf, tailOf }) {
  let lastBusy = null // 忙态派生读数（防重派；`null` = 未派生）
  let lastFlags = null // 模式位推送签名（同签名零重推）
  let candidatesFor = null // 候选面相位（已取 provider 名）
  let prefetching = false // 候选面在飞闸（同 provider 零重入）

  /** B21 发送失败行（`composer-notice` 单形 · 行形不动；载体 = 挂件锚）：reason 缺 / 非串 / 空 ⇒ `null`（禁假造）。 */
  function failedNotice(reason) {
    if (typeof reason !== "string" || reason === "") return null
    return { tag: "div", props: { class: "composer-notice", "data-notice": "send-failed" }, children: [t("composer.send.failed", { reason })] }
  }

  /** 候选行投影（端 `model:list` 行 `{ id, effortEnum, thinkOff }` ⇒ 核件面形 —— VSC `provider-probe-window.mjs:64-67`
   *  同形）：`reasoning` 值域 = 端两判据（§2.2 A9）—— `thinkOff` 真 ⇒ 首项 `none`（核件「关闭」档），余项 =
   *  `effortEnum` 去空去重；`effortDefault` 端无读数 ⇒ 键缺席（核件中性档显示「—」，禁假造）；`id` 缺 ⇒ `null`（弃项）。 */
  function modelRowOf(row, provider) {
    const levels = []
    if (row?.thinkOff === true) levels.push(REASONING_NONE)
    for (const member of Array.isArray(row?.effortEnum) ? row.effortEnum : []) {
      if (typeof member !== "string" || member === "" || levels.includes(member)) continue
      levels.push(member)
    }
    const id = typeof row?.id === "string" ? row.id : ""
    if (id === "") return null
    return { id, label: id, provider, group: provider, reasoning: levels }
  }

  /** 活动面 provider 读面（单源 —— 候选面初读 ∕ 在飞竞态复核两处同取）：无活动会话 ∕ provider 缺 ⇒ `null`。 */
  function activeProviderOf(state1) {
    const key = state1?.activeSession ?? null
    const meta = key === null ? null : state1?.sessionMeta?.[key] ?? null
    return typeof meta?.provider === "string" && meta.provider !== "" ? meta.provider : null
  }

  /** 现值供给（核件 `models` 推送的 `prefs` 件）：端会话元 `{ provider, model, effort }` ⇒ 核件形 `{ model, provider,
   *  reasoning }`（缺 ⇒ 空串 —— 核件按空面处理）。 */
  function prefsOf(meta) {
    const text = (value) => (typeof value === "string" ? value : "")
    return { model: text(meta?.model), provider: text(meta?.provider), reasoning: reasoningOf(meta?.effort) }
  }

  const state = {
    /** 忙态（P23 判据单源 = `views/chrome.mjs` `busyOf`）+ **挂起窗**（收正轮 · ③）：位标含 `running` ⇒ `running`；
     *  本键挂起窗活跃（`ev:susp` 置位标）⇒ `susp`；余 ⇒ `idle`。核件忙态门谓词 = 非 `idle` ⇒ `susp` 期两信息钮禁用
     *  （防旧快照覆写 —— VSC `chat-panel.mjs:55-59` `_turnState` 三值同域；`loading.js` 两钮显隐仍只认 `running`）。 */
    turnState: () => {
      const held = store.get()
      const key = held?.activeSession ?? null
      if (busyOf(held, key)) return "running"
      return held?.susp?.[key]?.active === true ? "susp" : "idle"
    },
    /** 队计数（本会话键 —— 权威 = 宿主 `ev:queue` 镜面）。 */
    queue: () => {
      const list = activeKey() === null ? null : store.get()?.pending?.[activeKey()]
      return { count: Array.isArray(list) ? list.length : 0 }
    },
    models: () => store.get()?.modelCandidates?.models ?? [],
    flags: () => {
      const record = activeKey() === null ? null : store.get()?.sessionFlags?.[activeKey()]
      return record !== null && typeof record === "object" ? record : {}
    },
    // 守卫判据 = 端既有（B19：无活动会话 ⇒ 拒发 + 核件 toast + 占位第三态）—— 桌面无「无工作区」态
    workspaceRequired: () => activeKey() === null,
    subscribe: (fn) => { if (typeof fn === "function") pushSubs.push(fn) },
  }

  /** 提示行带重挂（序 = [待发送块?, 降级?, 失败?]；空 ⇒ 零节点）。失败行源 = 写面档 `wire.failure()`（B21）。
   *  **待发送块**（收正轮 B12 新口径 · 参照 CLI）：派生于队镜面（判据 = 非空）—— 本锚贴输入框上沿 ⇒ 与输入面板
   *  **恒定邻接**（任意内容高度 ∕ 任意滚动位置 —— 硬验收：不得浮在会话区上方远处）；非真块（无 `[data-block-kind]`）。 */
  function paintNotices(state1 = store.get()) {
    const noticesAnchor = noticesOf()
    if (noticesAnchor === null) return
    const key = state1?.activeSession ?? null
    const rows = []
    const waiting = pendingGroupNode({ pending: key === null ? [] : state1?.pending?.[key] })
    if (waiting !== null) rows.push(waiting)
    const degraded = key === null ? null : degradedNotice(degradedCode(state1?.attachDegraded?.[key] ?? null))
    if (degraded !== null) rows.push(degraded)
    const failedRow = failedNotice(wire.failure())
    if (failedRow !== null) rows.push(failedRow)
    clear(noticesAnchor)
    for (const node of rows) noticesAnchor.append(build(node))
    paintPendingOverflow(noticesAnchor) // 逐条超限尾标记量面（帧尾 —— 真机才有版式面）
  }

  /** 末条复制控件窄刷（取文源 = 末 `assistant` 块）：文本读数变 ⇒ 只换 / 摘那一枚锚（`null` ⇔ 零控件）；
   *  读数同 ⇒ 零 DOM 写（流式帧只重建无控件的子面）。 */
  let lastCopyText = null
  function syncLastCopy(state1) {
    const blocks = Array.isArray(state1?.blocks) ? state1.blocks : []
    const text = lastAssistantText(blocks)
    if (text === lastCopyText) return
    lastCopyText = text
    const tailAnchor = tailOf()
    if (tailAnchor === null) return
    const current = tailAnchor.querySelector('[data-action="chat:last"]')
    const next = lastCopyNode(blocks, { writeText })
    if (next === null) {
      if (current !== null && current !== undefined) current.remove()
      return
    }
    if (current === null || current === undefined) tailAnchor.append(build(next))
    else current.replaceWith(build(next))
  }

  /** 忙态 ∕ 守卫 ∕ 词面派生落面（**每次切片随动重派生** —— 核件 `applyBusyLock` 单点：占位符三态 + 忙态门；
   *  零滞留：词面注册（boot `initDict`）后到 ⇒ 首次随动即换真词，活动键变 ⇒ 守卫第三态随动；本派生零焦 ∕ 零吞键）；
   *  位标变 ⇒ 两钮显隐 + loading 标记（`setLoading` —— 内含 `applyBusyLock`）。 */
  function syncBusy(state1) {
    const panel = panelOf()
    if (panel === null) return
    panel.applyBusyLock()
    const busy = busyOf(state1, state1?.activeSession ?? null)
    if (busy === lastBusy) return
    lastBusy = busy
    panel.setLoading(busy)
  }

  /** 模式位推送（三形 = VSC `autoApprove` ∕ `planMode` ∕ `agentSettings` 同形）：切片变（`ev:flags` / 回执写）⇒
   *  控件行重绘；同签名 ⇒ 零重推。 */
  function pushFlags(state1) {
    const key = state1?.activeSession ?? null
    const flags = key === null ? {} : state1?.sessionFlags?.[key] ?? {}
    const signature = [key, flags.planMode === true, flags.autoApprove === true, flags.advisorGuard === true, flags.engineering === true].join("|")
    if (signature === lastFlags) return
    lastFlags = signature
    push({ type: "autoApprove", value: flags.autoApprove === true })
    push({ type: "planMode", active: flags.planMode === true })
    push({ type: "agentSettings", settings: { advisor: { guard: flags.advisorGuard === true }, engineering: flags.engineering === true } })
  }

  /** 候选面（两浮层的 ③ 读面源 —— 端既有面：活动 provider 的 `model:list`；provider 变才重取）。
   *  **端差登记**：VSC 的全 provider 后台探测窗口（`provider-probe-window.mjs`）端无对应面 ⇒ 行 = 活动 provider。
   *  **在飞竞态复核**（收正轮 · 行 6）：响应落地先复核活动面 provider 未变才写切片 ∕ 才推送；已变 ⇒ 弃本响应
   *  （零陈旧落树）并 release 后重取新 provider（闸界保位）。 */
  async function syncCandidates(state1 = store.get()) {
    const provider = activeProviderOf(state1)
    if (provider === null || provider === candidatesFor || prefetching) return
    prefetching = true
    const receipt = await call("model:list", { provider })
    if (activeProviderOf(store.get()) !== provider) {
      prefetching = false
      void syncCandidates() // 相位已变 ⇒ 弃本响应 + 重取（递归一次 —— 新相位命中则写）
      return
    }
    prefetching = false
    if (receipt.ok !== true) return void console.error(`[composer] model:list failed: ${reasonOf(receipt)}`)
    const rows = (Array.isArray(receipt.models) ? receipt.models : []).map((row) => modelRowOf(row, provider)).filter((row) => row !== null)
    candidatesFor = provider
    store.set(setModelCandidates(store.get(), provider, rows))
    const held = store.get()
    push({ type: "models", models: rows, prefs: prefsOf(held?.activeSession === null ? null : held?.sessionMeta?.[held.activeSession]) })
  }

  /** 切片随动（本档重绘总入口）：忙态派生 · 模式位推送 · 两挂件锚 · 候选面。 */
  function syncPanel(state1 = store.get()) {
    syncBusy(state1)
    pushFlags(state1)
    paintNotices(state1)
    syncLastCopy(state1)
    void syncCandidates(state1)
  }

  /** 忙态派生缓存首发（装配期面 —— 记读数免 `setLoading` 重派，沿原 `mount` 序）；`resetBusy` = 写面 loading
   *  复位径（`onLoadingReset` 注入面）。 */
  function primeBusy(state1) { lastBusy = busyOf(state1, activeKey()) }
  function resetBusy() { lastBusy = false }

  return { state, primeBusy, resetBusy, paintNotices, syncPanel }
}
