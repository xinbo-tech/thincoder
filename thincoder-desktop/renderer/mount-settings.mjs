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
import { createWizard } from "./mount-onboarding.mjs"
import { createInfoFace } from "./mount-info.mjs"
import { createReads } from "./mount-settings-reads.mjs"
import { createExits } from "./mount-settings-exits.mjs"
import { mountWizard, wizardModel } from "./views/onboarding.mjs"
import { mountSettings } from "./views/settings.mjs"

/** 设置 / 向导容器锚（**一容器两树互斥** —— 骨架属性住 `index.html`）。 */
export const SETTINGS_SLOT = '[data-slot="settings"]'
/** 重挂触发切片：`settings`（设置族全态）/ `locale`（词表切换重挂）。 */
export const SETTINGS_KEYS = Object.freeze(["settings", "locale"])

/** 段名闭集（与视图 `SECTIONS` 同域 —— 失败面段标域；表外 ⇒ `panel`）。 */
const SCOPES = Object.freeze(["providers", "model", "agent", "mcp", "tools"])

/**
 * 设置族接线：装配三族（读数供给 / 出口 / 项目级读数）+ 挂载（一挂载面：设置 / 向导两树互斥）+ 向导接线 + 自持重绘订阅。
 * `host` = preload 窄桥（只 `invoke`）；`deps.onProjectOpened` = 装配面项目面链注入（缺 ⇒ 目录出口零动作）。
 * 返回 `{ paintSettings, refreshInfo, openSettings, handlers, wizardHandlers, keys, detach }`（消费面只
 * `attachSettings(host, …)`；`refreshInfo` 出句柄面 = 开项目成功链复读口（#461 —— `renderer/app.mjs` `openDir` 消费 · 幂等）。 */
export function attachSettings(host, deps = {}) {
  const store = deps.store ?? defaultStore
  const onProjectOpened = typeof deps.onProjectOpened === "function" ? deps.onProjectOpened : null
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
  /** 出口族 + 写路辅助（出档 `mount-settings-exits.mjs` —— 共享项注入，本档零副本；`paintSettings` 迟绑定穿透）。 */
  const exits = createExits({
    ask, store, setSettings, report, clearReport, occupies, reads,
    slot: SETTINGS_SLOT, paintSettings: (state) => paintSettings(state),
  })
  /** 项目级读数族（出档 `mount-info.mjs` —— 两读数复读；读面消费 = 状态行台账超阈段）。 */
  const infoFace = createInfoFace({ ask, store })

  /** 挂载面：占槽裁决 ⇒ 向导树 ∥ 设置树（`SETTINGS_SLOT`；容器缺位 ⇒ 视图档空转）。 */
  function paintSettings(state = store.get()) {
    const root = document.querySelector(SETTINGS_SLOT)
    return occupies(state) ? mountWizard(root, state, wizardHandlers) : mountSettings(root, state, exits.handlers)
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

  return {
    paintSettings, refreshInfo: infoFace.refreshInfo, openSettings: exits.openSettings,
    handlers: exits.handlers, wizardHandlers, keys: SETTINGS_KEYS, detach,
  }
}
