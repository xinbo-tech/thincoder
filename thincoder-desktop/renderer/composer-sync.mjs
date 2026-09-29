/**
 * composer-sync.mjs — 输入面板**随动派生面**（自 `renderer/mount-composer.mjs` 拆出——#510 留守拆档 ·
 * 2026-09-29；该档越 300 顾问线，按面续拆）。迁入面 = ④ `state` 读面 + 忙态 ∕ 守卫派生（`syncBusy`）+
 * 模式位推送（`pushFlags`）+ 候选面（投影三助手 + `syncCandidates`）+ 提示锚窄刷（`paintNotices`
 * 提示带）+ 随动总入口 `syncPanel`。装配与通道面（槽装配 ∕ 写面 deps ∕
 * 出泡钩 ∕ `submit` ∕ `refresh` ∕ `detach`）留 `mount-composer.mjs`。
 *
 * deps（注入面）：`store`（切片读面）· `activeKey` · `call`（通道往返）· `push`（核件推送）· `pushSubs`
 * （面板订阅表——`state.subscribe` 写入面）· `wire`（写面句柄——取 `failure()`）·
 * `panelOf` ∕ `noticesOf`（装配期后置位读面——访问器注入）；**测试缝**（缺省回退 = 生产径）：
 * `retryDelayMs` ∕ `delay(ms)`（重探链步进——同形先例 VSC `_setProbeRetryDelayForTest`）。
 * **候选面（模型菜单全渠扇出批 · 2026-09-29）**：取数 = `model:catalog`（无载荷全渠扇出）+ `seq` 复核 +
 * 重探链（≤2 轮 ∕ 步进延迟 ∕ 改善才再推）+ 会话切换重推缓存（#5）+ 强制刷新口 `refreshCandidates`——
 * 六径 ∕ 在飞竞态逐条 = 批档 §2.5。
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
import { busyOf, suspActiveOf } from "./views/chrome.mjs"
import { paintPendingOverflow, pendingGroupNode } from "./views/chat-pending.mjs"

/** 核件「关思考」档字面（`reasoning.none` —— 两向映射的锚值）。 */
const REASONING_NONE = "none"

/** 重探链轮数上限 ∕ 步进（ms）—— 对位 VSC `PROBE_RETRY_MAX` ∕ `PROBE_RETRY_DELAY_MS`
 *  （`provider-probe-window.mjs`；桌面无宿主忙采样器 ⇒ 无忙让位——端差登记，见批档 §2.3）。 */
const RETRY_MAX = 2
const RETRY_DELAY_MS = 2000

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

/** 派生面工厂（一次装配 —— 会话期常驻；宿主锚与 `panel` 装配期后置位 ⇒ 访问器读面）。 */
export function createComposerSync({ store, activeKey, call, push, pushSubs, wire, panelOf, noticesOf, retryDelayMs: retryDelayIn, delay: delayIn }) {
  let lastBusy = null // 忙态派生读数（防重派；`null` = 未派生）
  let lastFlags = null // 模式位推送签名（同签名零重推）
  // 候选面状态（全渠扇出批：单飞 + 尾随一轮 —— 在飞期新触发只记位标）：
  let attempted = false // 首次取数已发起（#1 装配首跑恰一次闸；显式刷新口不受此闸）
  let seq = 0 // 单调取数序号（响应落地复核 —— 陈旧响应零写零推）
  let inflight = null // 在飞取数（单飞闸）
  let trailing = false // 在飞期新触发 ⇒ 落定后补一轮（尾随一轮）
  let cacheModels = null // 最近一次**有效推送**候选行（#5 重推缓存；null = 尚无有效推送）
  let pushedSignature = null // 最近一次推送的 prefs 签名（#5 变位判据）
  let lastCounts = null // 最近一次落定计数（#4 重探链「改善才再推」判据）
  let chainToken = 0 // 重探链终止令牌（新取数 ∕ 强制刷新 ⇒ ++）
  let retryChain = null // 在飞重探链（不叠：至多一条**有效**链）
  let retryChainToken = null // 有效链令牌（≠ chainToken ⇒ 旧链失效——新链可起）
  const retryDelayMs = Number.isFinite(retryDelayIn) ? retryDelayIn : RETRY_DELAY_MS // 重探步进（测试缝；缺省回退 = 生产径）
  const wait = typeof delayIn === "function" ? delayIn : (ms) => new Promise((resolve) => setTimeout(resolve, ms)) // 等待缝

  /** B21 发送失败行（`composer-notice` 单形 · 行形不动；载体 = 挂件锚）：reason 缺 / 非串 / 空 ⇒ `null`（禁假造）。 */
  function failedNotice(reason) {
    if (typeof reason !== "string" || reason === "") return null
    return { tag: "div", props: { class: "composer-notice", "data-notice": "send-failed" }, children: [t("composer.send.failed", { reason })] }
  }

  /** 候选行投影（全渠扇出行 `{ provider, id, effortEnum, thinkOff }` ⇒ 核件面形 —— VSC `provider-probe-window.mjs:64-67`
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
      return suspActiveOf(held, key) ? "susp" : "idle" // 判据单源 = `views/chrome.mjs`（零行为变）
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

  // ─── 候选面（全渠扇出 · 六径 —— 批档 §2.5）───────────────────────────────────────────────
  // 取数 = `model:catalog`（无载荷全渠扇出；显式重取归 `refreshCandidates` —— #2 ∕ #3 接线）；
  // #4 失败渠有界重探链 ∕ #5 会话切换重推缓存（零取数）∕ #6 两键皆空零推送（菜单保持现状）。

  /** 候选面相位签名（#5 判据：活动会话键 × 会话元 provider ∕ model ∕ effort —— 变位才重推）。 */
  function prefsSignature(state1) {
    const key = state1?.activeSession ?? null
    const meta = key === null ? null : state1?.sessionMeta?.[key] ?? null
    return [key ?? "", meta?.provider ?? "", meta?.model ?? "", meta?.effort ?? ""].join("|")
  }

  /** 核件 `models` 推送单点（落地 ∕ #5 重推 ∕ 重探链改善三径同此）：`prefs` 取**现态**活动会话元。 */
  function pushModels(rows) {
    const held = store.get()
    const key = held?.activeSession ?? null
    push({ type: "models", models: rows, prefs: prefsOf(key === null ? null : held?.sessionMeta?.[key]) })
    cacheModels = rows // #5 重推缓存 = 最近一次**有效推送**行（#6 零推送落定不覆写 —— 菜单旧行驻留）
    pushedSignature = prefsSignature(held)
  }

  /** 落定（投影 + 判据）：`ok` 假 ⇒ 记错零写零推；#6 两键皆空 ⇒ 零推送判据；重探链轮次改善判据同点。 */
  function land(receipt) {
    if (receipt?.ok !== true) {
      console.error(`[composer] model:catalog failed: ${reasonOf(receipt)}`)
      return null
    }
    const rows = []
    for (const row of Array.isArray(receipt.models) ? receipt.models : []) {
      const mapped = modelRowOf(row, typeof row?.provider === "string" ? row.provider : "")
      if (mapped !== null) rows.push(mapped)
    }
    const unavailable = Array.isArray(receipt.unavailable) ? receipt.unavailable : []
    const counts = { models: rows.length, unavailable: unavailable.length }
    const improved = lastCounts === null || counts.unavailable < lastCounts.unavailable || counts.models > lastCounts.models
    lastCounts = counts
    return { rows, unavailable, counts, improved, empty: counts.models === 0 && counts.unavailable === 0 }
  }

  /** 取数一轮（单飞 + 尾随一轮；`chain` = 重探链轮次 —— 链内轮次不终止自身链）：
   *  新取数 ∕ 强制刷新 ⇒ 旧链终止（令牌 ++）；`seq` 落地复核 ⇒ 陈旧响应零写零推。 */
  async function fetchCatalog({ chain = false } = {}) {
    if (!chain) chainToken += 1
    if (inflight !== null) {
      if (!chain) trailing = true // 在飞期新触发 = 位标（落定后补一轮）
      return null
    }
    const mySeq = ++seq
    attempted = true
    const request = call("model:catalog")
    inflight = request
    let receipt
    try {
      receipt = await request
    } catch (error) {
      receipt = { ok: false, reason: String(error?.message ?? error) }
    } finally {
      if (inflight === request) inflight = null
    }
    if (mySeq !== seq) return null // 陈旧（另起新取数）⇒ 丢弃 —— 零写零推
    const landed = land(receipt)
    if (landed === null) return null
    if (!landed.empty && (chain ? landed.improved : true)) pushModels(landed.rows) // #6 零推送（两键皆空）
    store.set(setModelCandidates(store.get(), landed.rows, landed.unavailable))
    if (trailing) { trailing = false; void fetchCatalog() } // 尾随一轮（链 ∕ 非链同拍）
    else if (!chain && landed.unavailable.length > 0) startRetryChain() // #4
    return landed
  }

  /** #4 重探链：`unavailable` 非空 ⇒ ≤`RETRY_MAX` 轮**整渠**重取（步进延迟；链不叠；新取数 ∕ 强制刷新 ⇒ 旧链终止）。 */
  function startRetryChain() {
    if (retryChain !== null && retryChainToken === chainToken) return // 链不叠（有效链在场）
    const token = chainToken
    const chain = (async () => {
      let rounds = 0
      while (rounds < RETRY_MAX) {
        if (token !== chainToken) return
        await wait(retryDelayMs)
        if (token !== chainToken) return
        rounds += 1
        const landed = await fetchCatalog({ chain: true })
        if (landed === null) return // 取数失败 ∕ 单飞让位 ⇒ 链止
        if (landed.unavailable.length === 0) return // 已无失败渠 ⇒ 链止
      }
    })().finally(() => {
      if (retryChain === chain) { retryChain = null; retryChainToken = null }
    })
    retryChain = chain
    retryChainToken = token
  }

  /** 候选面随动（#1 ∕ #5 收口）：首跑恰一取；#5 会话切换 ∕ 活动 meta 变 ⇒ 重推缓存 + 新 prefs（零取数）；
   *  显式重取归 `refreshCandidates`（#2 ∕ #3 接线）。 */
  function syncCandidates(state1 = store.get()) {
    if (!attempted) return void fetchCatalog() // #1 装配首跑恰一次
    if (cacheModels === null) return // 尚无有效推送（首取在飞 ∕ #6 零推送态）⇒ 零动作
    if (prefsSignature(state1) !== pushedSignature) pushModels(cacheModels) // #5（缓存 = 最近有效推送行）
  }

  /** 强制刷新口（#2 `ev:config` ∕ #3 provider 写成功接线 —— `mount-composer.mjs` 透传导出）：
   *  在飞期调用 = 位标（单飞 + 尾随一轮）；非链轮次 ⇒ 旧重探链终止。 */
  function refreshCandidates() {
    void fetchCatalog()
  }

  /** 切片随动（本档重绘总入口）：忙态派生 · 模式位推送 · 提示锚 · 候选面。 */
  function syncPanel(state1 = store.get()) {
    syncBusy(state1)
    pushFlags(state1)
    paintNotices(state1)
    void syncCandidates(state1)
  }

  /** 忙态派生缓存首发（装配期面 —— 记读数免 `setLoading` 重派，沿原 `mount` 序）；`resetBusy` = 写面 loading
   *  复位径（`onLoadingReset` 注入面）。 */
  function primeBusy(state1) { lastBusy = busyOf(state1, activeKey()) }
  function resetBusy() { lastBusy = false }

  return { state, primeBusy, resetBusy, paintNotices, syncPanel, refreshCandidates }
}
