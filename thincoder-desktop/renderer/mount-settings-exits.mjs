/**
 * mount-settings-exits.mjs — 设置面出口族 + 写路辅助（「桌面处理流 · VSC 对齐」批 R8 · 自
 * `renderer/mount-settings.mjs` 拆出 —— 300 行层拆分，零语义变化）：十一出口（提交 ∕ 校验 ∕ 移除 ∕ agent 存 ∕
 * 具名写 ∕ 采用模型 ∕ 档位 ∕ MCP 增删 ∕ 语言 ∕ 开合 ＋ 索引构建〔R2 · 桌面功能对位批〕）· 形式取值
 * （`rowValue` ∕ `namedOut`）· 泛化兜底变更集（`agentPatch`）· Esc 关闭绑定。
 *
 * 接线沿 `mount-onboarding.mjs` 注入先例：`createExits(deps)` —— `deps = { ask, store, setSettings, report, clearReport, occupies, reads, slot, paintSettings }`
 * （窄桥 ∕ 值面 ∕ 失败面 ∕ 读数供给 ∕ 槽锚 ∕ 重绘归装配面）；返回 `{ handlers, openSettings, closeSettings }`（`handlers` = 视图 `data-action` 同域出口表）。
 * 语义锚（`docs/desktop/design/IPC.md` §2 设置族注）：出站失败 ⇒ **零乐观写**（不摘项、不改段读数）；畸形 JSON ⇒ **零发送**；
 * 写成功 ⇒ 清失败串 + 重读本段。**P14 出值规范化**（数值 ⇒ `Number(v)`〔空 / 非数 ⇒ 零发送〕· 布尔 ⇒ `.checked` · 串 ⇒ 原串；无效值 ⇒ 控件回退现值）· **P15 具名控件即改即存**（十键单键 patch 直发）· **F-Esc 关面板**（Esc ⇒ 既有 `closeSettings` 出口，单一实现 —— 绑定宿主 = `document`）。
 * 纪律：零 `node:` / 零裸包 · 逐通道回执形单源 = IPC.md §2。
 */
import { initDict } from "./i18n.mjs"
import { configuredFlag, patchSettings } from "./store.mjs"
import { presetValue } from "./mount-onboarding.mjs"

/** 表单自取：提交控件 `type="button"`（handlers 直传 ⇒ 监听器 = 本函数，收 **Event**）⇒ `closest("form")`。 */
function formOf(event) {
  const target = event?.currentTarget ?? event?.target ?? null
  if (target === null || typeof target.closest !== "function") return null
  return target.closest("form")
}

/** 列表归一：缺 / 非数组 ⇒ 空表（零节点 —— 禁假数据）。 */
const listOf = (value) => (Array.isArray(value) ? value : [])
/** 失败串归一：回执 `reason` 非空串 ⇒ 直传（核错误串 ∕ 表内码）；缺 ⇒ 端侧形判码（零静默 —— 调用面另记错）。 */
const reasonOf = (receipt) => (typeof receipt?.reason === "string" && receipt.reason !== "" ? receipt.reason : "invalid-shape")

/** agent 段现态读数表（路径 → 值原样；缺 / 非数组 ⇒ 空表）。 */
function currentFields(state) {
  const current = new Map()
  for (const field of listOf(state?.settings?.agent?.fields)) if (typeof field?.path === "string" && field.path !== "") current.set(field.path, field.value)
  return current
}

/** 行出值（P14）：`checkbox` ⇒ `.checked`；`number` ⇒ `Number(v)`；余 ⇒ 原串。**无效数值（空 / 非数）⇒ `undefined`**
 *  —— 父侧裁定（2026-09-28）：真删键经 `settings:agent` 不可达（契约 = `docs/desktop/design/IPC.md` §2「档位控件注」：`patch` 表达不了删键）
 *  ⇒ 落「**零发送**（不写盘 · 零乐观改 · 控件回退现值）」；消解路 = 主侧写链 + 核清除形扩族（另批）。**数值 0 照发**（核类型表只校 `typeof`）。 */
function rowValue(input) {
  if (input?.type === "checkbox") return input.checked === true
  const raw = typeof input.value === "string" ? input.value : ""
  if (input?.type !== "number") return raw
  const value = Number(raw)
  return raw.trim() === "" || !Number.isFinite(value) ? undefined : value
}

/**
 * 出口族工厂。`deps.reads = { loadProviders, loadAgent, loadMcp }`（读数供给族注入）；`deps.paintSettings`
 * = 装配面重绘口（无效数值回退现值用）；`deps.slot` = 设置槽锚（表单现选自读 ∕ 泛化兜底行作用域）。
 */
export function createExits(deps = {}) {
  const { ask, store, setSettings, report, clearReport, occupies, slot, paintSettings } = deps
  const { loadProviders, loadAgent, loadMcp, loadIndex } = deps.reads ?? {}

  /** agent 段变更集（**泛化兜底行面**）：DOM `[data-field]` 可写行 × 现态读数 diff ⇒ 只发变更路径；无变更 ∨ 无效数值行 ⇒ 零发送；作用域 = 设置槽（收到槽内即不误取）。 */
  function agentPatch(state) {
    if (typeof document.querySelector !== "function") return { patch: null, skipped: 0 }
    const scope = document.querySelector(slot)
    if (scope === null || typeof scope.querySelectorAll !== "function") return { patch: null, skipped: 0 }
    const current = currentFields(state)
    const patch = {}
    let changed = false, skipped = 0
    for (const row of scope.querySelectorAll("[data-field]")) {
      if (row.getAttribute("data-readonly") !== null) continue // 只读行（敏感 / 非标量）不参与变更集（真 DOM / 假面同径）
      const path = row.getAttribute("data-field")
      const input = row.querySelector("input")
      if (typeof path !== "string" || path === "" || input === null) continue
      const value = rowValue(input)
      if (value === undefined) { console.error(`[renderer] settings:agent skipped: invalid value for ${path}`); skipped += 1; continue }
      const held = current.get(path)
      if (Object.is(value, held) || String(value) === String(held)) continue
      patch[path] = value
      changed = true
    }
    return { patch: changed ? patch : null, skipped }
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
    const target = typeof name === "string" && name !== "" ? name : presetValue(slot)
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
    const { patch, skipped } = agentPatch(store.get())
    if (patch === null) { if (skipped > 0) paintSettings(); return } // 无效行在场 ⇒ 回退现值（与具名径同形 —— 裁定句三）
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

  /** 档位出口（`settings:agent` 写 · 意图级 `{ tier }`；`level` 非串 ⇒ **零发送**）：失败 ⇒ 段级失败面（**零乐观写** ——
   *  控件值随读档面重绘回退回执前值）；成功 ⇒ 重取行面现值（候选面保留）。 */
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

  /** 索引构建出口（`index:build` —— R2 · 桌面功能对位批）：构建期段面置 `building`（钮禁用 + 「构建中…」
   *  —— VSC 钮同拍禁用同律）；**成败皆复读状态**（VSC `buildIndex` 尾 `pushIndexStatus` 同律 —— 两 sync
   *  之一失败的部分成功径也随真值刷新计数）；失败径 ⇒ **复读后**落段级失败面（失败串不被复读清位）；
   *  **零乐观写**（不复用回执造假成功 —— 状态一律经复读真值）。 */
  async function buildIndex() {
    const held = store.get().settings?.tools ?? {}
    setSettings({ tools: { ...held, state: "ready", building: true } })
    const receipt = await ask("index:build")
    await loadIndex()
    if (receipt.ok !== true) {
      report("tools", receipt, "index:build")
      return
    }
    clearReport()
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

  /** 语言出口（`config:write` 键白名单仅 `locale`）：成功回带 `{ locale, dict, configured }` ⇒ 词表重刷 + 向导闸随新档态（**一次写**）。 */
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

  /** 设置面开（**两入口**：信息行 ∕ 输入区控件行第 7 钮 —— 后者经句柄面转口 `renderer/mount-composer.mjs`）：开 + 失败串清位 ⇒ 五段读数随动（段态 `none` → `loading` → `ready`）。 */
  function openSettings() {
    setSettings({ open: true, notice: null })
    void loadProviders()
    void loadAgent()
    void loadMcp()
    void loadIndex()
  }

  /** 设置面关（退场 = 零子节点 —— 订阅面重绘清容器）。 */
  function closeSettings() {
    setSettings({ open: false, notice: null })
  }

  /** 具名控件出值（P14 × P15 单键）：`boolean` ⇒ `.checked`；数值 ⇒ `Number(v)`（× `scale` —— 分钟面回毫秒）；余 ⇒ 原串；
   *  无效数值（同 `rowValue`）/ 目标缺位 ⇒ `undefined`（调用面零发送）。 */
  function namedOut(entry, event) {
    const target = event?.target ?? event?.currentTarget ?? null
    if (target === null) return undefined
    if (entry.kind === "boolean") return target.checked === true
    const raw = typeof target.value === "string" ? target.value : ""
    if (entry.kind !== "number") return raw
    const value = Number(raw)
    if (raw.trim() === "" || !Number.isFinite(value)) return undefined
    return entry.scale === undefined ? value : Math.round(value * entry.scale)
  }

  /** 具名控件写路（P15 即改即存 —— 单键 patch 直发）：回执 ⇒ `fields` 就地刷新（核已回读）；失败 ⇒ 段级失败面（**零乐观写**）；无效出值 ⇒ **零发送**。 */
  async function applyNamedField(entry, event) {
    const value = namedOut(entry, event)
    if (value === undefined) {
      console.error(`[renderer] settings:agent skipped: invalid value for ${entry.path}`)
      paintSettings()
      return
    }
    const receipt = await ask("settings:agent", { patch: { [entry.path]: value } })
    if (receipt.ok !== true) {
      report("agent", receipt, "settings:agent")
      return
    }
    clearReport()
    setSettings({ agent: { state: "ready", fields: listOf(receipt.fields) } })
  }

  /** 设置面出口族（锚名逐字 = 视图 `data-action` 同域；具名控件面 = 十键同路）。 */
  const handlers = {
    onToggleLang: (target) => void toggleLang(target),
    onCloseSettings: () => closeSettings(),
    onSubmit: (event) => void submitChannel(event),
    onVerify: (name) => void verifyChannel(name),
    onRemoveProvider: (name) => void removeProvider(name),
    onSaveAgent: () => void saveAgent(),
    onNamedField: (entry, event) => void applyNamedField(entry, event),
    onUseModel: (provider, name) => void useModel(provider, name),
    onTier: (provider, model, level) => void setTier(provider, model, level),
    onBuildIndex: () => void buildIndex(),
    onAddMcp: (event) => void addMcp(event),
    onRemoveMcp: (name) => void removeMcp(name),
  }

  /** Esc 关闭（F-Esc —— 一律经既有 `closeSettings` 出口，单一实现；向导态不在本项）：**绑定宿主 = `document`**（面板为窗口级覆盖层
   *  ⇒ 绑面板节点收不到本键）；闸取**现刻**态（开 ∧ 非向导占槽）；宿主无 `addEventListener` 面 ⇒ 零绑定。 */
  if (typeof document !== "undefined" && typeof document.addEventListener === "function") {
    document.addEventListener("keydown", (event) => {
      if (event?.key !== "Escape") return
      const state = store.get()
      if (state?.settings?.open !== true || occupies(state)) return
      closeSettings()
    })
  }

  return { handlers, openSettings, closeSettings }
}
