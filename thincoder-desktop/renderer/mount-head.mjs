/**
 * mount-head.mjs — 会话头接线出档（`docs/desktop/design/UI.md` §1「批 B 注」项 1 —— 候选面 · 写路 · 回执刷行）：
 *   `attachHead({ host, onRepaint })` ⇒ 三出口（`candidates` / `onField` / `sync`）+ 模块私有缓存两张。
 *   ① 候选面 `candidates()`（**同步读** —— 构树期调用）：`providers` = `provider:list` 回执行；
 *      `models` = **现行 provider** 的 `model:list` 元素（形 `{ id, effortEnum, thinkOff }` —— 档位候选面
 *      单源 = `docs/desktop/design/IPC.md` §2 该行「批 B 增」）；模型标识投影单源 = `views/settings-sections.mjs`
 *      `modelIdOf`（本档写面同用 ⇒ **选项值与写值同一投影**）。
 *   ② 写路 `onField(name, value)`：通道 `session:prefs { key, patch }`（`key` = 活动会话键；字段闭集 = 头面三值）；
 *      `provider` 变更**同送 `model`** = 新 provider 首候选（否则核拒 `model-required` 零写 —— IPC.md §2「会话级
 *      偏好注」项 7）；**零乐观写**（store 不动，控件值恒来自 store 现态 ⇒ 失败径即回退）；回执 `meta` ⇒
 *      `store.set({ sessionMeta: { ...表, [key]: meta } })` ⇒ 外壳切片随动 ⇒ **就位刷本行**；`ok` 假 ∥ 抛 ∥
 *      `meta` 缺 ⇒ `onRepaint()`（回退为回执前值）+ `console.error`（零静默）。
 *   ③ 随动 `sync(state)`：渠道候选未入缓存 ⇒ 取；活动 provider 变 ⇒ 重取模型候选；落地后 `onRepaint()`
 *      （候选面后到 ⇒ 选项集不全 ⇒ 就地再刷；幂等）。挂载面 = `renderer/app.mjs`（`paintHead` + 外壳切片订阅处单点调用）。
 *      **P23 忙态写门**（「对齐第三批」）：写路入口先判位标忙态（`renderer/views/chrome.mjs` `busyOf` 单源）——
 *      在飞 ⇒ 零发送 + 回退重绘（控件面已 `disabled`，本闸为键盘 / 程序面兵衛；与构树门双闸）。
 * 纪律：零 `node:` / 零裸包（渲染面静态闭包判据）；控制台诊断串**非面向用户文案**（不经 `t()` —— 同 `renderer/events-subscribe.mjs`）。
 */
import { store } from "./store.mjs"
import { modelIdOf } from "./views/settings-sections.mjs"
import { busyOf, sessionMetaOf } from "./views/chrome.mjs"

/** 头面可写字段闭集（`docs/desktop/design/UI.md` §1「批 B 注」项 1 —— 表外字段零动作）。 */
const PICK_FIELDS = Object.freeze(["provider", "model", "effort"])

/** 会话头接线（`host` = 窄桥；`onRepaint` = 头面就位刷行句柄 —— 由挂载面注入，零默认重绘）。 */
export function attachHead(options = {}) {
  const host = options.host ?? null
  const onRepaint = typeof options.onRepaint === "function" ? options.onRepaint : () => {}
  let providers = [] // `provider:list` 行缓存（未取 / 取失败 ⇒ 空面 —— 控件退化「仅现值」，禁假造）
  let models = [] // 现行 provider 的 `model:list` 元素缓存
  let modelsFor = null // 上份模型候选所属 provider（`null` = 未取）

  /** 通道往返：窄桥缺位 / 抛 ⇒ `undefined`（此处已记错 ⇒ 调用面零二次日志）；否则回执原样。 */
  async function ask(channel, payload) {
    if (host === null || host === undefined || typeof host.invoke !== "function") {
      console.error(`[renderer] ${channel}: preload bridge missing`)
      return undefined
    }
    try {
      return await host.invoke(channel, payload)
    } catch (error) {
      console.error(`[renderer] ${channel} rejected:`, error)
      return undefined
    }
  }

  /** 失败面（零静默）：`reason` 直传；形意外 ⇒ 明示形不合法（`undefined` = `ask` 已记错 ⇒ 零二次日志）。 */
  function report(channel, receipt) {
    if (receipt === undefined) return
    const reason = typeof receipt?.reason === "string" && receipt.reason !== "" ? receipt.reason : "invalid-shape"
    console.error(`[renderer] ${channel} failed: ${reason}`)
  }

/** 供给里的非空串读数（缺 / 空串 / 非串 ⇒ `null` —— 与视图 `fieldOf` 同判据）。 */
  function pickOf(meta, name) {
    const value = meta?.[name]
    return typeof value === "string" && value !== "" ? value : null
  }

  /** 渠道候选（一次入缓存；失败 ⇒ 空面 + 记错 —— 候选面缺 ≠ 假候选）。 */
  async function loadProviders() {
    const receipt = await ask("provider:list")
    if (receipt?.ok !== true) {
      providers = []
      report("provider:list", receipt)
      return false
    }
    providers = Array.isArray(receipt.providers) ? receipt.providers : []
    return true
  }

  /** 模型候选（逐 provider）；已取同一 provider ⇒ **零请求**直接复用。 */
  async function loadModels(provider) {
    if (typeof provider !== "string" || provider === "") {
      models = []
      modelsFor = null
      return false
    }
    if (modelsFor === provider) return true
    const receipt = await ask("model:list", { provider })
    if (receipt?.ok !== true) {
      models = []
      modelsFor = null
      report("model:list", receipt)
      return false
    }
    models = Array.isArray(receipt.models) ? receipt.models : []
    modelsFor = provider
    return true
  }

  /** 候选面读数（同步 —— 构树期调用；空面 = 控件只出「仅现值」一选项，零假造）。 */
  function candidates() {
    return { providers, models }
  }

  /** 写路（见档头 ②）：三值闭集 ∧ 活动会话在场 ∧ **非忙态**（P23）才发通道；失败径一律回退 + 记错。 */
  async function onField(name, value) {
    const state = store.get()
    const key = state?.activeSession ?? null
    if (key === null || !PICK_FIELDS.includes(name)) {
      console.error(`[renderer] session:prefs skipped: no active session / unknown field: ${String(name)}`)
      onRepaint()
      return
    }
    if (busyOf(state, key)) {
      // P23 忙态写门（构树已 `disabled`；本闸拦键盘 / 程序径）：零发送 + 回退重绘（零乐观写）
      console.error(`[renderer] session:prefs skipped: turn in flight for session ${String(key)}`)
      onRepaint()
      return
    }
    let patch = { [name]: value }
    if (name === "provider") {
      // provider 变更须同送 model（核拒 `model-required` 零写）：候选按新 provider 重取 ⇒ 首候选即写值。
      const loaded = await loadModels(value)
      const first = loaded ? models.map(modelIdOf).find((id) => id !== null) ?? null : null
      if (first === null) {
        console.error("[renderer] session:prefs skipped: no model candidate for provider:", String(value))
        onRepaint()
        return
      }
      patch = { provider: value, model: first }
    }
    const receipt = await ask("session:prefs", { key, patch })
    const meta = receipt?.meta
    if (receipt?.ok !== true || meta === null || typeof meta !== "object") {
      report("session:prefs", receipt)
      if (receipt?.ok === true) console.error("[renderer] session:prefs: success receipt without meta")
      onRepaint()
      return
    }
    const table = store.get().sessionMeta
    const held = table !== null && typeof table === "object" ? table : {}
    store.set({ sessionMeta: { ...held, [key]: meta } })
  }

  /** 随动（见档头 ③）：外壳切片变更处单点调用（候选面后到 ⇒ 就地刷行）。 */
  async function sync(state = store.get()) {
    const meta = sessionMetaOf(state)
    const provider = pickOf(meta, "provider")
    let changed = false
    if (providers.length === 0) {
      await loadProviders()
      changed = true
    }
    if (provider !== null && modelsFor !== provider) {
      await loadModels(provider)
      changed = true
    }
    if (changed) onRepaint()
  }

  return { candidates, onField, sync }
}
