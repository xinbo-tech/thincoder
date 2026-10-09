/**
 * mount-settings.mjs — 设置面 / 首启向导接线**装配面**（批档 §2.10 · §2.12–§2.15；「桌面处理流 · VSC 对齐」批 R8
 * 两族出档：读数供给 = `mount-settings-reads.mjs` ∕ 出口 + 写路辅助 =
 * `mount-settings-exits.mjs`——本档留**装配 ∕ 窄桥 ∕ 失败面 ∕ 重绘 ∕ 向导接线**；向导接线族批 B 拆入
 * `mount-onboarding.mjs`）：一容器两树互斥占槽 + 重绘订阅 + 依赖装配（会话模型轮 R13：信息行视图随左列裁撤
 * 退场 —— 本档零信息行挂载面，余 = 设置 / 向导两树）。
 *
 * **D39（设置菜单升级批 · #817 ∥ `docs/desktop/design/SETTINGS.md` §1 KD-68）**：组弹窗装配 ——
 * `openSettingsModal` ∥ `closeSettingsModal`（闭集验证 ∥ 占槽拒 ∥ 切片写 + 本组面态复位 + 本组读取链；关 = 切片清
 * + 本组复位 + 子确认同清）；弹窗体 = **第二闸**（卡片根捕获 ∕ 重建 ∥ 复填 + 独立残件 `modalResidue` —— 沿 #604
 * 同形）；宿主三件（建 ∕ 刷 ∥ 关 ∥ 卡根读面）住 `renderer/settings-modal.mjs`，树面住视图档 `settingsModalTree`。
 *
 * 语义锚（`docs/desktop/design/IPC.md` §2 设置族注）：
 *   ① 占槽裁决（一容器两树互斥）：`configured === false` ∧ 向导未退场 ⇒ 向导树占槽；其余 ⇒ 设置树
 *      （`open` 假 ⇒ 零子节点 —— 退场 = 容器清空，非 `hidden`）；`configured` 未知（畸形档）⇒ 向导不进、设置面可进。
 *      （判据单源 = 向导档 `wizardModel(state).active`，本档零副本。）
 *   ② 值面全经 store 纯动作落值（`patchSettings` / 向导族 `setWizardStep` · `dismissWizard` —— 后者住
 *      `mount-onboarding.mjs`）→ `store.set`。
 *      **本档零 DOM 构造**（构树归视图档）；两族经 `deps` 注入装配（沿 `mount-onboarding.mjs` 先例，单一 owner 在本档）。
 *   ③ 写后回读：`provider:*` / `mcp:*` 写成功 ⇒ 重读本段；`settings:agent` 写 ⇒ 回执 `fields` 直落（核已回读）—— 三处出口随出口族。
 *   ④ 失败面零静默：读 / 写失败 ⇒ `console.error` + 面级失败串（设置面 `{ scope, reason }`、向导面单串）——
 *      核错误串直传、表内码出词归视图 `reasonWord`；本档 = 两落位口（`report` ∕ `clearReport`）单一 owner。
 *   ⑤ 重绘 = 本档自持订阅（触发切片 `SETTINGS_KEYS`）—— 消费面（`app.mjs`）只一行 `attachSettings(host, …)`
 *      （该档行预算 —— `docs/desktop/design/PROJECT.md` §4.1 本端文件清单与行数预算）；`config:write` 成功同回带 ⇒ 词表重刷与向导闸随新档态（**免二跳**）。
 *   ⑥ 向导步 3 目录出口走装配面注入的项目面链（`onProjectOpened` = `app.mjs` `openDir`，含刷新 + 「点开即可续」）：
 *      注入点在本档、连线归向导接线族，本档零算法副本。
 *   ⑦ 「对齐第三批」三面（随出口族迁 `mount-settings-exits.mjs`）：P14 出值规范化 ∕ P15 具名控件即改即存 ∕ F-Esc 关面板。
 * 纪律：零 `node:` / 零裸包（静态闭包判据 = `test/guard-closure.test.mjs`）· 逐通道回执形单源 = IPC.md §2。
 */
import { patchSettings, store as defaultStore } from "./store.mjs"
import { captureView, dropDrafts, mergeViewSnaps, restoreView } from "./view-state.mjs"
import { createWizard } from "./mount-onboarding.mjs"
import { createReads } from "./mount-settings-reads.mjs"
import { createExits } from "./mount-settings-exits.mjs"
import { renderSettingsModal, settingsModalNode } from "./settings-modal.mjs"
import { closeSettingsConfirm } from "./settings-confirm.mjs"
import { mountWizard, wizardModel } from "./views/onboarding.mjs"
import { SECTIONS, ADD_MODAL_GROUP, CONSULT_ADD_MODAL_GROUP, MCP_FORM_MODAL_GROUP, mountSettings, settingsModalTree } from "./views/settings.mjs"

/** 设置 / 向导容器锚（**一容器两树互斥** —— 骨架属性住 `index.html`）。 */
export const SETTINGS_SLOT = '[data-slot="settings"]'
/** 重挂触发切片：`settings`（设置族全态）/ `locale`（词表切换重挂）/ `theme`（主题三态 —— 设置面头当前态随动；D33 · 台账 #743）。 */
export const SETTINGS_KEYS = Object.freeze(["settings", "locale", "theme"])

/** 段名闭集（**由视图 `SECTIONS` 派生** —— 同源单份，零双抄；失败面段标域；表外 ⇒ `panel`）。
 *  **三端对齐批（KD-75 ①②）**：七 ⇒ 八 —— 增添加弹窗组名 `ADD_MODAL_GROUP`（`providerAdd`——非段名，
 *  名单单源 = 视图档导出，本档 ∥ `MODAL_READS` ∥ 开径出口三面同领）。
 *  **添加入口弹窗统一批（KD-77 ①②）**：八 ⇒ **十** —— 增 `MCP_FORM_MODAL_GROUP` ∥ `CONSULT_ADD_MODAL_GROUP`（同径同领）。 */
const SCOPES = Object.freeze([...SECTIONS.map((section) => section.name), ADD_MODAL_GROUP, MCP_FORM_MODAL_GROUP, CONSULT_ADD_MODAL_GROUP])

/** 弹窗读取链（KD-68 ③ 逐组指名表：`model` 随渠道面（含模型候选随动）∥ `models` 随 agent 面（models 块 —— R7 同拍）；
 *  **添加弹窗**（KD-75 ②）随 `providers` 面 —— 体 = 单表，预设 ∥ 候选项两源皆 `provider:list` 回执；
 *  **两新组**（KD-77 ①②）：`mcpForm` 随 `mcp` 面（表单预填取行 `config` —— `mcp:list` 回执）∥ `consultAdd` 随 agent 面
 *  （models 块 —— 两 picker 与行族同源）。 */
const MODAL_READS = Object.freeze({
  providers: "loadProviders",
  model: "loadProviders",
  agent: "loadAgent",
  mcp: "loadMcp",
  env: "loadEnv",
  tools: "loadTools",
  models: "loadAgent",
  [ADD_MODAL_GROUP]: "loadProviders",
  [MCP_FORM_MODAL_GROUP]: "loadMcp",
  [CONSULT_ADD_MODAL_GROUP]: "loadAgent",
})

/**
 * 设置族接线：装配两族（读数供给 / 出口）+ 挂载（一挂载面：设置 / 向导两树互斥）+ 向导接线 + 自持重绘订阅。
 * `host` = preload 窄桥（只 `invoke`）；`deps.onProjectOpened` = 装配面项目面链注入（缺 ⇒ 目录出口零动作）；
 * `deps.onProvidersChanged` = provider 写成功随动注入（全渠扇出批 —— 缺 ⇒ 零动作）。
 * 返回 `{ paintSettings, openSettings, openSettingsModal, closeSettingsModal, refreshSettings, handlers,
 * wizardHandlers, keys, detach, setTheme }`（消费面只 `attachSettings(host, …)`；`refreshSettings` 出句柄面 =
 * config 写盘感知复读口（R8 · `ev:config` 窄口 —— `renderer/app.mjs` `attachEvents` 消费）；`setTheme` = 菜单
 * 「主题▸」出口（D36 —— `exits.handlers.onSetTheme` 转名暴露，零第二实现）；`openSettingsModal` = 菜单「组弹窗」出口
 * （D39 —— 消费面 = `renderer/app.mjs` `menuActions` 注入，零第二实现））。
 */
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

  /** 出口族 + 写路辅助（出档 `mount-settings-exits.mjs` —— 共享项注入，本档零副本；`paintSettings` 迟绑定穿透）。
   *  **开 ∕ 关双向注入**（函数声明提升 ⇒ 注入先于定义安全）：`openModal` = 添加弹窗开径（`settings:addProvider`
   *  出口 —— KD-75 ②，沿 `paintSettings` 迟绑定先例）；`closeModal` = 保存成功径宿主关（KD-75 ⑥——§2.4 行 6
   *  「提交 ⇒ 宿主关（KD-68 关径）」）。 */
  const exits = createExits({
    ask, store, setSettings, report, clearReport, occupies, reads, onProvidersChanged, invalidateDrafts,
    slot: SETTINGS_SLOT, paintSettings: (state) => paintSettings(state),
    openModal: (group) => openSettingsModal(group), closeModal: () => closeSettingsModal(),
  })

  /** 弹窗出口面（KD-68 ③⑥ —— 出口链 = **同一 `exits.handlers` 全表**（零第二份）+ 关三路（✕ ∥ 背板 ∥ 卡内 Esc）
   *  同引 `onCloseModal`；函数声明提升 —— 常量求值先于装配体调用）。 */
  const modalHandlers = { ...exits.handlers, onCloseModal: closeSettingsModal }

  /** 组弹窗开（KD-68 ④）：`SCOPES` 闭集验证（表外 ⇒ 记错零动作）+ 向导占槽期拒（记错）⇒ 切片写 + 失败串清 +
   *  本组面态复位 + 本组读取链；拒 ⇒ `false`（菜单分派面「no-op」记错面 —— 零静默）。 */
  function openSettingsModal(group) {
    const state = store.get()
    if (!SCOPES.includes(group)) {
      console.error(`[renderer] settings modal refused: unknown group ${String(group)}`)
      return false
    }
    if (occupies(state)) {
      console.error("[renderer] settings modal refused: wizard occupies the slot")
      return false
    }
    setSettings({ modal: group, notice: null, ...exits.resetFacets(state, group) })
    void reads[MODAL_READS[group]]()
    return true
  }

  /** 组弹窗关（KD-68 ④）：切片清 + 本组面态复位 + 子确认同清（沿 `closeSettings` 同形）。 */
  function closeSettingsModal() {
    const state = store.get()
    const group = state.settings?.modal ?? null
    setSettings({ modal: null, ...(group === null ? {} : exits.resetFacets(state, group)) })
    closeSettingsConfirm()
  }

  /** 弹窗在场渲染（第二闸重建 ∥ 退场清件）：切片组名 ⇒ 树 + 宿主建 ∕ 刷（返回卡根供复填）；`null` ⇒ 宿主清件。 */
  function renderModal(state) {
    const group = state?.settings?.modal ?? null
    if (group === null) return renderSettingsModal(null)
    return renderSettingsModal(settingsModalTree(state, group, modalHandlers))
  }

  /** 重绘残件（跨**在途重建**携带 —— 读数落地致段入 `loading` 时树面控件暂缺：残件留待下轮复填；
   *  树已定（零 `loading` 段）⇒ 弃残件（表单身份换 ∕ 用户态变 ⇒ 不留陈值复活窗）。 */
  let viewResidue = null
  /** 弹窗残件（D39 —— 第二闸独立残件，与页残件同形分槽；弹窗退场 ⇒ 弃）。 */
  let modalResidue = null

  /** 在途判定（本树有 `loading` 态段 —— 残件携带窗；非在途 ⇒ 新捕获值可信）：页树 = 段壳 `[data-state]`；
   *  弹窗体 = `settings-modal-body` 同锚（`data-state` = 组段态 —— 同判据跨两树同源）。 */
  const inFlight = (root) => typeof root?.querySelector === "function" && root.querySelector('[data-state="loading"]') !== null

  /** 挂载面：占槽裁决 ⇒ 向导树 ∥ 设置树（`SETTINGS_SLOT`；容器缺位 ⇒ 视图档空转）。
   *  **#604 草稿保真总闸**（两树唯一重绘点 —— 挂载前捕获 ∕ 重建后复填）：值 ∕ `checked` ∕ 焦点 ∕
   *  光标区间 ∕ 根 scrollTop 跨重建保真；捕获域 = `[data-draft]` 申报面（零申报 ⇒ 零复填写）；
   *  两树一闸 ⇒ `views/settings.mjs` ∕ `views/onboarding.mjs` 零改（批档 §2.2 落点）。
   *  **写成功径草稿失效**（#652）：出口族经 `invalidateDrafts(scope)` 声明一次性失效集 —— 命中作用域的草稿
   *  不携入快照（该表单写成功 ⇒ 草稿作废，旧值不复活）；失败径零声明（草稿保真）。
   *  **第二闸（D39 ∥ KD-68 ⑤）**：弹窗卡根同轮捕获 ∕ 重建 ∥ 复填（独立残件 `modalResidue`；失效集一次性同滤两捕获）。
   *  调用面三径同门：`paintSettings` 直呼（初绘 ∕ 订阅）· `deps.paintSettings` 迟绑定（出口族）· 段族回注。
   *  在途携带：读 → `loading` → 结两个重绘中，`loading` 面不携表单（段体零行）⇒ 单轮捕获 ∕ 复填
   *  达不了底 —— 未落件（残件）随下轮并合重试（`mergeViewSnaps`），树定型即弃。 */
  function paintSettings(state = store.get()) {
    const root = document.querySelector(SETTINGS_SLOT)
    const fresh = dropDrafts(captureView(root), draftInvalidation)
    const snap = fresh === null ? null : dropDrafts(mergeViewSnaps(viewResidue, fresh, { trust: !inFlight(root) }), draftInvalidation)
    const modalPrev = settingsModalNode()
    const modalFresh = dropDrafts(captureView(modalPrev), draftInvalidation)
    const modalSnap = modalFresh === null ? null : dropDrafts(mergeViewSnaps(modalResidue, modalFresh, { trust: !inFlight(modalPrev) }), draftInvalidation)
    draftInvalidation.clear() // 一次性失效集：两捕获同轮消费即清（下轮零声明 ⇒ 零过滤）
    const model = occupies(state) ? mountWizard(root, state, wizardHandlers) : mountSettings(root, state, exits.handlers)
    const modal = renderModal(state)
    const rest = restoreView(root, snap)
    viewResidue = inFlight(root) ? rest : null
    const modalRest = restoreView(modal, modalSnap)
    modalResidue = modal !== null && inFlight(modal) ? modalRest : null
    return model
  }

  /** 向导出口族（六出口 —— 接线族住 `mount-onboarding.mjs`，共享项注入 ⇒ 本档零副本；**B③**：模型步
   *  「采用」接线随注入 —— 单一实现 = 出口族 `onUseModel`（同一引用，零第二实现））。 */
  const { handlers: wizardHandlers } = createWizard({
    store, ask, report, clearReport, loadModels: reads.loadModels,
    submitChannel: exits.handlers.onSubmit, verifyChannel: exits.handlers.onVerify,
    useModel: exits.handlers.onUseModel,
    onProjectOpened,
  })

  /** 重绘订阅（触发切片 `SETTINGS_KEYS`；监听器零写 ⇒ 无回环）。 */
  const detach = store.subscribe((state, changedKeys) => {
    const keys = Array.isArray(changedKeys) ? changedKeys : SETTINGS_KEYS
    if (!keys.some((key) => SETTINGS_KEYS.includes(key))) return
    paintSettings(state)
  })

  paintSettings()
  void reads.loadProviders()

  /** config 写盘感知复读（R8 · `ev:config` 窄口 —— 接线 = `renderer/app.mjs`）：设置 ∕ 向导面**在场** ⇒ 七段读数
   *  复读（providers ∕ agent〔携 models〕 ∕ mcp ∕ env ∕ tools —— 与 `openSettings` 同批同源；R7 随段闭集扩：
   *  `loadIndex` 更名 `loadTools` + 增 `loadEnv`）；**D39：组弹窗在场（`modal != null`）同复读**；关态 ⇒ 零动作
   *  （下次开面自读 —— 免空转）。返回是否复读（读数 ∕ 走查面）。 */
  function refreshSettings() {
    const state = store.get()
    if (!occupies(state) && state?.settings?.open !== true && state?.settings?.modal == null) return false
    void reads.loadProviders()
    void reads.loadAgent()
    void reads.loadMcp()
    void reads.loadEnv()
    void reads.loadTools()
    return true
  }

  return {
    paintSettings, openSettings: exits.openSettings, refreshSettings,
    openSettingsModal, closeSettingsModal, // D39：菜单「组弹窗」开 ∥ 关出口（face 返回 —— 消费面 = `renderer/app.mjs` 注入）
    handlers: exits.handlers, wizardHandlers, keys: SETTINGS_KEYS, detach,
    setTheme: exits.handlers.onSetTheme, // D36：菜单「主题▸」出口（转名暴露——零第二实现）
  }
}
