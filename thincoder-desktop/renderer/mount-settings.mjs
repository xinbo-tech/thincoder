/**
 * mount-settings.mjs — 设置面 / 首启向导接线**装配面**（批档 §2.10 · §2.12–§2.15；「桌面处理流 · VSC 对齐」批 R8
 * 三族出档：读数供给 = `mount-settings-reads.mjs` ∕ 项目级读数 = `mount-info.mjs` ∕ 出口 + 写路辅助 =
 * `mount-settings-exits.mjs`——本档留**装配 ∕ 窄桥 ∕ 失败面 ∕ 重绘 ∕ 向导接线**；向导接线族批 B 拆入
 * `mount-onboarding.mjs`）：一容器两树互斥占槽 + 重绘订阅 + 依赖装配（会话模型轮 R13：信息行视图随左列裁撤
 * 退场 —— 本档零信息行挂载面，余 = 设置 / 向导两树）。
 *
 * 语义锚（`docs/desktop/design/IPC.md` §2 设置族 / 项目级信息族注）：
 *   ① 占槽裁决（一容器两树互斥）：`configured === false` ∧ 向导未退场 ⇒ 向导树占槽；其余 ⇒ 设置树
 *      （`open` 假 ⇒ 零子节点 —— 退场 = 容器清空，非 `hidden`）；`configured` 未知（畸形档）⇒ 向导不进、设置面可进。
 *      （判据单源 = 向导档 `wizardModel(state).active`，本档零副本。）
 *   ② 值面全经 store 纯动作落值（`patchSettings` / 向导族 `setWizardStep` · `dismissWizard` —— 后者住
 *      `mount-onboarding.mjs`）→ `store.set`；项目级两读数落顶层切片 `projectInfo`（顶层 ⇒ `store.set`，非 `patchSettings`）。
 *      **本档零 DOM 构造**（构树归视图档）；三族经 `deps` 注入装配（沿 `mount-onboarding.mjs` 先例，单一 owner 在本档）。
 *   ③ 写后回读：`provider:*` / `mcp:*` 写成功 ⇒ 重读本段；`settings:agent` 写 ⇒ 回执 `fields` 直落（核已回读）—— 三处出口随出口族。
 *   ④ 失败面零静默：读 / 写失败 ⇒ `console.error` + 面级失败串（设置面 `{ scope, reason }`、向导面单串）——
 *      核错误串直传、表内码出词归视图 `reasonWord`；本档 = 两落位口（`report` ∕ `clearReport`）单一 owner。
 *   ⑤ 重绘 = 本档自持订阅（触发切片 `SETTINGS_KEYS`）—— 消费面（`app.mjs`）只一行 `attachSettings(host, …)`
 *      （该档 300 行硬线 —— 批档 §2.15）；`config:write` 成功同回带 ⇒ 词表重刷与向导闸随新档态（**免二跳**）。
 *   ⑥ 向导步 3 目录出口走装配面注入的项目面链（`onProjectOpened` = `app.mjs` `openDir`，含刷新 + 「点开即可续」）：
 *      注入点在本档、连线归向导接线族，本档零算法副本；项目级两读数由本档装配随动复读（装配时一次 ∕ 开项目链）。
 *   ⑦ 「对齐第三批」三面（随出口族迁 `mount-settings-exits.mjs`）：P14 出值规范化 ∕ P15 具名控件即改即存 ∕ F-Esc 关面板。
 * 纪律：零 `node:` / 零裸包（静态闭包判据 = `test/guard-closure.test.mjs`）· 逐通道回执形单源 = IPC.md §2。
 */
import { patchSettings, store as defaultStore } from "./store.mjs"
import { captureView, dropDrafts, mergeViewSnaps, restoreView } from "./view-state.mjs"
import { createWizard } from "./mount-onboarding.mjs"
import { createInfoFace } from "./mount-info.mjs"
import { createReads } from "./mount-settings-reads.mjs"
import { createExits } from "./mount-settings-exits.mjs"
import { mountWizard, wizardModel } from "./views/onboarding.mjs"
import { SECTIONS, mountSettings } from "./views/settings.mjs"

/** 设置 / 向导容器锚（**一容器两树互斥** —— 骨架属性住 `index.html`）。 */
export const SETTINGS_SLOT = '[data-slot="settings"]'
/** 重挂触发切片：`settings`（设置族全态）/ `locale`（词表切换重挂）/ `theme`（主题三态 —— 设置面头当前态随动；D33 · 台账 #743）。 */
export const SETTINGS_KEYS = Object.freeze(["settings", "locale", "theme"])

/** 段名闭集（**由视图 `SECTIONS` 派生** —— 同源单份，零双抄；失败面段标域；表外 ⇒ `panel`）。 */
const SCOPES = Object.freeze(SECTIONS.map((section) => section.name))

/**
 * 设置族接线：装配三族（读数供给 / 出口 / 项目级读数）+ 挂载（一挂载面：设置 / 向导两树互斥）+ 向导接线 + 自持重绘订阅。
 * `host` = preload 窄桥（只 `invoke`）；`deps.onProjectOpened` = 装配面项目面链注入（缺 ⇒ 目录出口零动作）；
 * `deps.onProvidersChanged` = provider 写成功随动注入（全渠扇出批 —— 缺 ⇒ 零动作）。
 * 返回 `{ paintSettings, refreshInfo, openSettings, refreshSettings, handlers, wizardHandlers, keys, detach }`（消费面只
 * `attachSettings(host, …)`；`refreshInfo` 出句柄面 = 开项目成功链复读口（#461 —— `renderer/app.mjs` `openDir` 消费 · 幂等）；
 * `refreshSettings` 出句柄面 = config 写盘感知复读口（R8 · `ev:config` 窄口 —— `renderer/app.mjs` `attachEvents` 消费）。 */
export function attachSettings(host, deps = {}) {
  const store = deps.store ?? defaultStore
  const onProjectOpened = typeof deps.onProjectOpened === "function" ? deps.onProjectOpened : null
  const onProvidersChanged = typeof deps.onProvidersChanged === "function" ? deps.onProvidersChanged : null
  const bridgeReady = host !== null && typeof host === "object" && typeof host.invoke === "function"
  if (!bridgeReady) console.error("[renderer] preload bridge missing: settings channels unavailable")

  /** 设置切片补丁（store 纯动作 —— 引用等值 ⇒ 零通知 ⇒ 零重绘）。 */
  const setSettings = (patch) => store.set(patchSettings(store.get(), patch))
  /** 向导补丁（步 / 退场旗归 store 纯动作；**失败串**无专用动作 ⇒ 经 `patchSettings` 落 `wizard.notice`）。 */
  const wizardOf = (state) => state?.settings?.wizard ?? {}
  /** 占槽裁决单源（复用向导档导出 —— 本档零副本）。 */
  const occupies = (state) => wizardModel(state).active === true

  /** 窄桥读（异常归一）：桥缺 / 抛 / 拒绝 / 非对象回执 ⇒ `{ ok:false, reason }`（**零静默降级**）。 */
  async function ask(channel, payload) {
    if (!bridgeReady) return { ok: false, reason: "invalid-shape" }
    try {
      const receipt = payload === undefined ? await host.invoke(channel) : await host.invoke(channel, payload)
      if (receipt === null || typeof receipt !== "object") {
        console.error(`[renderer] ${channel}: malformed receipt`)
        return { ok: false, reason: "invalid-shape" }
      }
      return receipt
    } catch (error) {
      console.error(`[renderer] ${channel} rejected:`, error)
      return { ok: false, reason: String(error?.message ?? error) }
    }
  }

  /** 面级失败串落位（零静默）：向导占槽 ⇒ `wizard.notice`（向导面单槽）；否则 ⇒ `settings.notice = { scope, reason }`。 */
  function report(scope, receipt, channel) {
    const reason = typeof receipt?.reason === "string" && receipt.reason !== "" ? receipt.reason : null
    if (reason === null) console.error(`[renderer] ${channel}: failure receipt without reason`)
    else console.error(`[renderer] ${channel} failed: ${reason}`)
    const state = store.get()
    const landed = reason ?? "invalid-shape"
    if (occupies(state)) setSettings({ wizard: { ...wizardOf(state), notice: landed } })
    else setSettings({ notice: { scope: SCOPES.includes(scope) ? scope : "panel", reason: landed } })
  }

  /** 面级失败串清位（成功面 —— 只在本面已有串时写，免空转重绘）。 */
  function clearReport() {
    const state = store.get()
    if (occupies(state)) {
      const wizard = wizardOf(state)
      if (wizard.notice !== null && wizard.notice !== undefined) setSettings({ wizard: { ...wizard, notice: null } })
      return
    }
    if (state.settings?.notice !== null && state.settings?.notice !== undefined) setSettings({ notice: null })
  }

  /** 读数供给族（出档 `mount-settings-reads.mjs` —— 注入窄桥 ∕ 值面 ∕ 失败面；单一 owner = 本档）。 */
  const reads = createReads({ ask, store, setSettings, report })

  /** **写成功径草稿失效集**（#652 —— 一次性：声明后首次重绘按集过滤草稿，消费即清）。
   *  声明缝 = 出口族注入（`invalidateDrafts(scope)`）；作用域取值面 = 视图档 `[data-draft-scope]`（单源在视图）。 */
  let draftInvalidation = new Set()
  function invalidateDrafts(scope) {
    if (typeof scope === "string" && scope !== "") draftInvalidation.add(scope)
    else console.error("[renderer] invalidateDrafts dropped: missing draft scope")
  }

  /** 出口族 + 写路辅助（出档 `mount-settings-exits.mjs` —— 共享项注入，本档零副本；`paintSettings` 迟绑定穿透）。 */
  const exits = createExits({
    ask, store, setSettings, report, clearReport, occupies, reads, onProvidersChanged, invalidateDrafts,
    slot: SETTINGS_SLOT, paintSettings: (state) => paintSettings(state),
  })
  /** 项目级读数族（出档 `mount-info.mjs` —— 两读数复读；读面消费 = 状态行台账超阈段）。 */
  const infoFace = createInfoFace({ ask, store })

  /** 重绘残件（跨**在途重建**携带 —— 读数落地致段入 `loading` 时树面控件暂缺：残件留待下轮复填；
   *  树已定（零 `loading` 段）⇒ 弃残件（表单身份换 ∕ 用户态变 ⇒ 不留陈值复活窗）。 */
  let viewResidue = null

  /** 在途判定（本树有 `loading` 态段 —— 残件携带窗；非在途 ⇒ 新捕获值可信）。 */
  const inFlight = (root) => typeof root?.querySelector === "function" && root.querySelector('[data-state="loading"]') !== null

  /** 挂载面：占槽裁决 ⇒ 向导树 ∥ 设置树（`SETTINGS_SLOT`；容器缺位 ⇒ 视图档空转）。
   *  **#604 草稿保真总闸**（两树唯一重绘点 —— 挂载前捕获 ∕ 重建后复填）：值 ∕ `checked` ∕ 焦点 ∕
   *  光标区间 ∕ 根 scrollTop 跨重建保真；捕获域 = `[data-draft]` 申报面（零申报 ⇒ 零复填写）；
   *  两树一闸 ⇒ `views/settings.mjs` ∕ `views/onboarding.mjs` 零改（批档 §2.2 落点）。
   *  **写成功径草稿失效**（#652）：出口族经 `invalidateDrafts(scope)` 声明一次性失效集 —— 命中作用域的草稿
   *  不携入快照（该表单写成功 ⇒ 草稿作废，旧值不复活）；失败径零声明（草稿保真）。
   *  调用面三径同门：`paintSettings` 直呼（初绘 ∕ 订阅）· `deps.paintSettings` 迟绑定（出口族）· 段族回注。
   *  在途携带：读 → `loading` → 结两个重绘中，`loading` 面不携表单（段体零行）⇒ 单轮捕获 ∕ 复填
   *  达不了底 —— 未落件（残件）随下轮并合重试（`mergeViewSnaps`），树定型即弃。 */
  function paintSettings(state = store.get()) {
    const root = document.querySelector(SETTINGS_SLOT)
    const fresh = dropDrafts(captureView(root), draftInvalidation)
    const snap = fresh === null ? null : dropDrafts(mergeViewSnaps(viewResidue, fresh, { trust: !inFlight(root) }), draftInvalidation)
    draftInvalidation.clear() // 一次性失效集：本轮消费即清（下轮零声明 ⇒ 零过滤）
    const model = occupies(state) ? mountWizard(root, state, wizardHandlers) : mountSettings(root, state, exits.handlers)
    const rest = restoreView(root, snap)
    viewResidue = inFlight(root) ? rest : null
    return model
  }

  /** 向导出口族（六出口 —— 接线族住 `mount-onboarding.mjs`，共享项注入 ⇒ 本档零副本）。 */
  const { handlers: wizardHandlers } = createWizard({
    store, ask, report, clearReport, loadModels: reads.loadModels,
    submitChannel: exits.handlers.onSubmit, verifyChannel: exits.handlers.onVerify,
    onProjectOpened, refreshInfo: infoFace.refreshInfo,
  })

  /** 重绘订阅（触发切片 `SETTINGS_KEYS`；监听器零写 ⇒ 无回环）。 */
  const detach = store.subscribe((state, changedKeys) => {
    const keys = Array.isArray(changedKeys) ? changedKeys : SETTINGS_KEYS
    if (!keys.some((key) => SETTINGS_KEYS.includes(key))) return
    paintSettings(state)
  })

  paintSettings()
  void reads.loadProviders()
  void infoFace.refreshInfo()

  /** config 写盘感知复读（R8 · `ev:config` 窄口 —— 接线 = `renderer/app.mjs`）：设置 ∕ 向导面**在场** ⇒ 七段读数
   *  复读（providers ∕ agent〔携 models〕 ∕ mcp ∕ env ∕ tools —— 与 `openSettings` 同批同源；R7 随段闭集扩：
   *  `loadIndex` 更名 `loadTools` + 增 `loadEnv`）；关态 ⇒ 零动作（下次开面自读 —— 免空转）。
   *  返回是否复读（读数 ∕ 走查面）。 */
  function refreshSettings() {
    const state = store.get()
    if (!occupies(state) && state?.settings?.open !== true) return false
    void reads.loadProviders()
    void reads.loadAgent()
    void reads.loadMcp()
    void reads.loadEnv()
    void reads.loadTools()
    return true
  }

  return {
    paintSettings, refreshInfo: infoFace.refreshInfo, openSettings: exits.openSettings, refreshSettings,
    handlers: exits.handlers, wizardHandlers, keys: SETTINGS_KEYS, detach,
  }
}
