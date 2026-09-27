/**
 * mount-settings.mjs — 设置面 / 首启向导 / 项目级信息行接线一族（批档 §2.10 · §2.12–§2.15；向导接线族
 * 批 B 拆入 `mount-onboarding.mjs`，本档注入装配）：一容器两树互斥占槽 + 设置面出口族 + 信息行单入口
 * + 四段读数供给（端侧零算法）。
 *
 * 语义锚（`docs/desktop/design/IPC.md` §2 设置族 / 项目级信息族注）：
 *   ① 占槽裁决（一容器两树互斥）：`configured === false` ∧ 向导未退场 ⇒ 向导树占槽；其余 ⇒ 设置树
 *      （`open` 假 ⇒ 零子节点 —— 退场 = 容器清空，非 `hidden`）；`configured` 未知（畸形档）⇒ 向导不进、设置面可进。
 *      （判据单源 = 向导档 `wizardModel(state).active`，本档零副本。）
 *   ② 值面全经 store 纯动作落值（`patchSettings` / 向导族 `setWizardStep` · `dismissWizard` —— 后者住
 *      `mount-onboarding.mjs`）→ `store.set`；项目级两读数落顶层切片 `projectInfo`（顶层 ⇒ `store.set`，非 `patchSettings`）。
 *      **本档零 DOM 构造**（构树归视图档）。
 *   ③ 写后回读：`provider:*` / `mcp:*` 写成功 ⇒ 重读本段；`settings:agent` 写 ⇒ 回执 `fields` 直落（核已回读）。
 *   ④ 失败面零静默：读 / 写失败 ⇒ `console.error` + 面级失败串（设置面 `{ scope, reason }`、向导面单串）——
 *      核错误串直传、表内码出词归视图 `reasonWord`；出站失败 ⇒ **零乐观写**（不摘项、不改段读数）；畸形 JSON ⇒ **零发送**。
 *   ⑤ 重绘 = 本档自持订阅（触发切片 `SETTINGS_KEYS`）—— 消费面（`app.mjs`）只一行 `attachSettings(host, …)`
 *      （该档 300 行硬线 —— 批档 §2.15）；`config:write` 成功同回带 ⇒ 词表重刷与向导闸随新档态（**免二跳**）。
 *   ⑥ 向导步 3 目录出口走装配面注入的项目面链（`onProjectOpened` = `app.mjs` `openDir`，含刷新 + 「点开即可续」）：
 *      注入点在本档、连线归向导接线族，本档零算法副本；信息行两读数由本档随动复读。
 * 纪律：零 `node:` / 零裸包（静态闭包判据 = `test/guard-closure.test.mjs`）· 逐通道回执形单源 = IPC.md §2。
 */
import { initDict } from "./i18n.mjs"
import { createWizard, presetValue } from "./mount-onboarding.mjs"
import { configuredFlag, patchSettings, store as defaultStore } from "./store.mjs"
import { mountInfo } from "./views/info-row.mjs"
import { mountWizard, wizardModel } from "./views/onboarding.mjs"
import { mountSettings } from "./views/settings.mjs"

/** 设置 / 向导容器锚（**一容器两树互斥** —— 骨架属性住 `index.html`）。 */
export const SETTINGS_SLOT = '[data-slot="settings"]'
/** 项目级信息行容器锚（左列底行 —— 唯一入口 = 设置面开）。 */
export const INFO_SLOT = '[data-slot="info"]'
/** 重挂触发切片：`settings`（设置族全态）/ `locale`（词表切换重挂）/ `projectInfo`（信息行两读数）。 */
export const SETTINGS_KEYS = Object.freeze(["settings", "locale", "projectInfo"])

/** 段名闭集（与视图 `SECTIONS` 同域 —— 失败面段标域；表外 ⇒ `panel`）。 */
const SCOPES = Object.freeze(["providers", "model", "agent", "mcp"])

/** 表单自取：提交控件 `type="button"`（handlers 直传 ⇒ 监听器 = 本函数，收 **Event**）⇒ `closest("form")`。 */
function formOf(event) {
  const target = event?.currentTarget ?? event?.target ?? null
  if (target === null || typeof target.closest !== "function") return null
  return target.closest("form")
}

/** 列表归一：缺 / 非数组 ⇒ 空表（零节点 —— 禁假数据）。 */
const listOf = (value) => (Array.isArray(value) ? value : [])

/** 失败串归一：回执 `reason` 非空串 ⇒ 直传（核错误串 / 表内码）；缺 ⇒ 端侧形判码（零静默 —— 调用面另记错）。 */
const reasonOf = (receipt) => (typeof receipt?.reason === "string" && receipt.reason !== "" ? receipt.reason : "invalid-shape")

/** agent 段变更集：DOM `[data-field]` 可写行 × 现态读数 diff ⇒ 只发变更路径；无变更 ⇒ `null`（零发送）。 */
function agentPatch(state) {
  const current = new Map()
  for (const field of listOf(state?.settings?.agent?.fields)) {
    if (typeof field?.path === "string" && field.path !== "") current.set(field.path, String(field.value ?? ""))
  }
  const patch = {}
  let changed = false
  for (const row of document.querySelectorAll('[data-section="agent"] .settings-field-row[data-field]')) {
    if (typeof row.hasAttribute !== "function" || row.hasAttribute("data-readonly")) continue
    const path = row.getAttribute("data-field")
    const input = row.querySelector("input")
    if (typeof path !== "string" || path === "" || input === null) continue
    if (input.value === current.get(path)) continue
    patch[path] = input.value
    changed = true
  }
  return changed ? patch : null
}

/**
 * 设置族接线：挂载（两挂载面）+ 出口族（设置面十出口 / 向导六出口经 `mount-onboarding.mjs` 装配 / 信息行
 * 单入口）+ 供给面（四段读数）。
 * `host` = preload 窄桥（只 `invoke`）；`deps.onProjectOpened` = 装配面项目面链注入（缺 ⇒ 目录出口零动作）。
 * 返回 `{ paintSettings, paintInfo, handlers, wizardHandlers, keys, detach }`（消费面只 `attachSettings(host, …)`）。
 */
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

  /** 激活渠道读数（`provider:list` 投影）：激活名 + 该行 `model` ⇒ 复合串；缺 ⇒ 两者 `null`（**未知不造串**）。 */
  function activeModel(receipt) {
    const name = typeof receipt.active === "string" && receipt.active !== "" ? receipt.active : null
    if (name === null) return { provider: null, current: null }
    const row = listOf(receipt.providers).find((p) => p?.name === name)
    const model = typeof row?.model === "string" && row.model !== "" ? row.model : null
    return { provider: name, current: model === null ? null : `${name}:${model}` }
  }

  /** 渠道段读数（`provider:list`：预置表 + 已配行 + 激活渠道三项直取）⇒ 模型段随动（激活渠道候选面）。
   *  `options.models` 假 ⇒ **保留同渠道候选面**（只刷行面 `effort` 现值 —— 档位写后刷新用，零候选清空）。 */
  async function loadProviders(options = {}) {
    setSettings({ providers: { ...store.get().settings?.providers, state: "loading" } })
    const receipt = await ask("provider:list")
    if (receipt.ok !== true) {
      setSettings({ providers: { state: "none", presets: [], providers: [] } })
      report("providers", receipt, "provider:list")
      return null
    }
    const { provider, current } = activeModel(receipt)
    const held = store.get().settings?.model ?? {}
    const kept = options.models === false && held.provider === provider
    setSettings({
      notice: null,
      defaultModel: current,
      providers: { state: "ready", presets: listOf(receipt.presets), providers: listOf(receipt.providers) },
      model: { state: held.state ?? "none", provider, current, models: kept ? listOf(held.models) : [] },
    })
    if (!kept) await loadModels(provider)
    return provider
  }

  /** 模型段候选面（`model:list`）：无激活渠道 ⇒ 段归 `none` 且**零请求**（禁假造候选）。 */
  async function loadModels(provider) {
    const held = store.get().settings?.model ?? {}
    if (typeof provider !== "string" || provider === "") {
      setSettings({ model: { state: "none", provider: null, current: held.current ?? null, models: [] } })
      return
    }
    setSettings({ model: { state: "loading", provider, current: held.current ?? null, models: [] } })
    const receipt = await ask("model:list", { provider })
    const current = store.get().settings?.model?.current ?? null
    if (receipt.ok !== true) {
      setSettings({ model: { state: "none", provider, current, models: [] } })
      report("model", receipt, "model:list")
      return
    }
    setSettings({ notice: null, model: { state: "ready", provider, current, models: listOf(receipt.models) } })
  }

  /** agent 段读数（`settings:agent` 读 = `{}`）：`fields` 直落（值 + 敏感只读判据归视图/核）。 */
  async function loadAgent() {
    setSettings({ agent: { ...store.get().settings?.agent, state: "loading" } })
    const receipt = await ask("settings:agent", {})
    if (receipt.ok !== true) {
      setSettings({ agent: { state: "none", fields: [] } })
      report("agent", receipt, "settings:agent")
      return
    }
    setSettings({ notice: null, agent: { state: "ready", fields: listOf(receipt.fields) } })
  }

  /** MCP 段读数（`mcp:list`：只列已配，不连接）。 */
  async function loadMcp() {
    setSettings({ mcp: { ...store.get().settings?.mcp, state: "loading" } })
    const receipt = await ask("mcp:list")
    if (receipt.ok !== true) {
      setSettings({ mcp: { state: "none", servers: [] } })
      report("mcp", receipt, "mcp:list")
      return
    }
    setSettings({ notice: null, mcp: { state: "ready", servers: listOf(receipt.servers) } })
  }

  /** 项目级两读数（`ledger:read` + `batch:status`，缺省 cwd = 当前项目）：一读失败**不遮蔽**另一读（分键落 ——
   *  失败串落 `projectInfo.notice`，非设置面失败面：信息行自有失败面）。 */
  async function refreshInfo() {
    const [ledger, batch] = await Promise.all([ask("ledger:read"), ask("batch:status")])
    const next = { counts: null, thresholdReached: null, phase: null, notice: null }
    if (ledger.ok === true) {
      next.counts = ledger.counts ?? null
      next.thresholdReached = typeof ledger.thresholdReached === "boolean" ? ledger.thresholdReached : null
    } else {
      console.error(`[renderer] ledger:read failed: ${reasonOf(ledger)}`)
      next.notice = reasonOf(ledger)
    }
    if (batch.ok === true) next.phase = typeof batch.phase === "string" ? batch.phase : null
    else {
      console.error(`[renderer] batch:status failed: ${reasonOf(batch)}`)
      if (next.notice === null) next.notice = reasonOf(batch)
    }
    store.set({ projectInfo: next })
  }

  /** 渠道表单提交（两形同一路）：载荷按形直取（表内 `name` = 载荷键）—— 空名 ⇒ 端侧形判 `invalid-shape` 零发送。 */
  async function submitChannel(event) {
    const form = formOf(event)
    if (form === null) return
    const data = new FormData(form)
    const shape = String(data.get("shape") ?? "")
    const name = String(data.get("name") ?? "")
    const key = String(data.get("key") ?? "")
    if (name === "") {
      console.error("[renderer] provider:save: empty name")
      report("providers", { reason: "invalid-shape" }, "provider:save")
      return
    }
    const payload = shape === "custom"
      ? { name, shape, baseURL: String(data.get("baseURL") ?? ""), model: String(data.get("model") ?? ""), format: String(data.get("format") ?? ""), active: data.get("active") !== null, ...(key === "" ? {} : { key }) }
      : { name, shape: "preset", preset: name, active: data.get("active") !== null, ...(key === "" ? {} : { key }) }
    const receipt = await ask("provider:save", payload)
    if (receipt.ok !== true) {
      report("providers", receipt, "provider:save")
      return
    }
    clearReport()
    setSettings({ verify: null })
    await loadProviders()
  }

  /** 校验出口（`provider:verify`）：`name` 缺（向导步 1）⇒ 自读表单现选；探不通**仍可保存**（只出读数，不拦写）。 */
  async function verifyChannel(name) {
    const target = typeof name === "string" && name !== "" ? name : presetValue(SETTINGS_SLOT)
    if (target === null) {
      console.error("[renderer] provider:verify: no channel selected")
      report("providers", { reason: "invalid-shape" }, "provider:verify")
      return
    }
    setSettings({ verify: null })
    const receipt = await ask("provider:verify", { name: target })
    if (receipt.ok === true) {
      clearReport()
      setSettings({ verify: { kind: "ok", count: listOf(receipt.models).length, reason: null } })
      return
    }
    setSettings({ verify: { kind: "fail", count: null, reason: reasonOf(receipt) } })
  }

  /** 渠道移除出口：失败（含激活渠道保护）⇒ 核文案直传 ⇒ **零乐观摘项**（列表不动 + 失败面）。 */
  async function removeProvider(name) {
    const receipt = await ask("provider:remove", { name })
    if (receipt.ok !== true) {
      report("providers", receipt, "provider:remove")
      return
    }
    clearReport()
    setSettings({ verify: null })
    await loadProviders()
  }

  /** agent 段提交（`settings:agent` 写）：只发变更路径；无变更 / 无可写行 ⇒ **零发送**。 */
  async function saveAgent() {
    const patch = agentPatch(store.get())
    if (patch === null) return
    const receipt = await ask("settings:agent", { patch })
    if (receipt.ok !== true) {
      report("agent", receipt, "settings:agent")
      return
    }
    clearReport()
    setSettings({ agent: { state: "ready", fields: listOf(receipt.fields) } })
  }

  /** 模型采用出口：写 `defaultModel` 复合串（键面与形态判归核 —— `settings:agent` 写通道）⇒ 写后回读两段。 */
  async function useModel(provider, name) {
    if (typeof provider !== "string" || provider === "" || typeof name !== "string" || name === "") return
    const composite = `${provider}:${name}`
    const receipt = await ask("settings:agent", { patch: { defaultModel: composite } })
    if (receipt.ok !== true) {
      report("model", receipt, "settings:agent")
      return
    }
    clearReport()
    setSettings({ defaultModel: composite, agent: { state: "ready", fields: listOf(receipt.fields) } })
    await loadProviders()
  }

  /** 档位出口（`settings:agent` 写 · 意图级 `{ tier }` —— 写形与 `{ patch }` 二择一；`level` 非串 ⇒ **零发送**）：
   *  失败 ⇒ 段级失败面（**零乐观写** —— 控件值随读档面重绘回退回执前值）；成功 ⇒ 重取行面现值（候选面保留）。 */
  async function setTier(provider, model, level) {
    if (typeof level !== "string") return
    const receipt = await ask("settings:agent", { tier: { provider, model, level } })
    if (receipt.ok !== true) {
      report("model", receipt, "settings:agent")
      return
    }
    clearReport()
    setSettings({ agent: { state: "ready", fields: listOf(receipt.fields) } })
    await loadProviders({ models: false })
  }

  /** MCP 新增出口：`config` **JSON 解析归提交端** —— 解析失败 / 空名 ⇒ **零发送** + 段级失败面。 */
  async function addMcp(event) {
    const form = formOf(event)
    if (form === null) return
    const data = new FormData(form)
    const name = String(data.get("name") ?? "")
    const raw = String(data.get("config") ?? "")
    if (name === "") {
      console.error("[renderer] mcp:save: empty name")
      report("mcp", { reason: "invalid-shape" }, "mcp:save")
      return
    }
    let config = null
    try {
      config = JSON.parse(raw)
    } catch (error) {
      console.error("[renderer] mcp:save: config is not JSON:", error?.message ?? error)
      report("mcp", { reason: "invalid-shape" }, "mcp:save")
      return
    }
    const receipt = await ask("mcp:save", { name, config })
    if (receipt.ok !== true) {
      report("mcp", receipt, "mcp:save")
      return
    }
    clearReport()
    await loadMcp()
  }

  /** MCP 移除出口：失败 ⇒ 零乐观摘项。 */
  async function removeMcp(name) {
    const receipt = await ask("mcp:remove", { name })
    if (receipt.ok !== true) {
      report("mcp", receipt, "mcp:remove")
      return
    }
    clearReport()
    await loadMcp()
  }

  /** 语言出口（`config:write` 键白名单仅 `locale`）：成功回带 `{ locale, dict, configured }` ⇒ 词表重刷 +
   *  向导闸随新档态（**一次写** —— 免二跳）。 */
  async function toggleLang(target) {
    const receipt = await ask("config:write", { patch: { locale: target } })
    if (receipt.ok !== true) {
      report("panel", receipt, "config:write")
      return
    }
    clearReport()
    const locale = initDict(receipt)
    store.set({ ...patchSettings(store.get(), { configured: configuredFlag(receipt.configured), notice: null }), locale })
  }

  /** 设置面开（信息行唯一入口）：开 + 失败串清位 ⇒ 四段读数随动（段态 `none` → `loading` → `ready`）。 */
  function openSettings() {
    setSettings({ open: true, notice: null })
    void loadProviders()
    void loadAgent()
    void loadMcp()
  }

  /** 设置面关（退场 = 零子节点 —— 订阅面重绘清容器）。 */
  function closeSettings() {
    setSettings({ open: false, notice: null })
  }

  /** 设置面出口族（锚名逐字 = 视图 `data-action` 同域）。 */
  const handlers = {
    onToggleLang: (target) => void toggleLang(target),
    onCloseSettings: () => closeSettings(),
    onSubmit: (event) => void submitChannel(event),
    onVerify: (name) => void verifyChannel(name),
    onRemoveProvider: (name) => void removeProvider(name),
    onSaveAgent: () => void saveAgent(),
    onUseModel: (provider, name) => void useModel(provider, name),
    onTier: (provider, model, level) => void setTier(provider, model, level),
    onAddMcp: (event) => void addMcp(event),
    onRemoveMcp: (name) => void removeMcp(name),
  }

  /** 向导出口族（六出口 —— 接线族住 `mount-onboarding.mjs`，共享三项注入 ⇒ 本档零副本）。 */
  const { handlers: wizardHandlers } = createWizard({
    store, ask, report, clearReport, loadModels, submitChannel, verifyChannel, onProjectOpened, refreshInfo,
  })

  /** 挂载面：占槽裁决 ⇒ 向导树 ∥ 设置树（`SETTINGS_SLOT`）+ 信息行（`INFO_SLOT`；容器缺位 ⇒ 视图档空转）。 */
  const paintSettings = (state = store.get()) => {
    const root = document.querySelector(SETTINGS_SLOT)
    return occupies(state) ? mountWizard(root, state, wizardHandlers) : mountSettings(root, state, handlers)
  }
  const paintInfo = (state = store.get()) => mountInfo(document.querySelector(INFO_SLOT), state, { onOpenSettings: openSettings })

  /** 重绘订阅（触发切片 `SETTINGS_KEYS`；监听器零写 ⇒ 无回环）。 */
  const detach = store.subscribe((state, changedKeys) => {
    const keys = Array.isArray(changedKeys) ? changedKeys : SETTINGS_KEYS
    if (!keys.some((key) => SETTINGS_KEYS.includes(key))) return
    paintSettings(state)
    paintInfo(state)
  })

  paintSettings()
  paintInfo()
  void loadProviders()
  void refreshInfo()

  return { paintSettings, paintInfo, handlers, wizardHandlers, keys: SETTINGS_KEYS, detach }
}
