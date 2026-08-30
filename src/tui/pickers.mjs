import { sliceByWidth } from "./render.mjs"
import { PROVIDER_PRESETS as PRESETS } from "../config.mjs"
import { computeLayout } from "./layout.mjs"

/** Generic list picker + model/provider management.
 *  单一 Promise API：showPicker(title, entries, { defaultIndex }) → Promise<entry|null>。
 *  picker 栈：state.pickerStack，state.picker 始终指向栈顶（layout/render/key-handler 都只读 state.picker）。
 *  选中即关闭（Enter = resolve + pop）；Esc = pop 当前层并 resolve(null)。菜单循环由调用方 while 重开。 */
export function createPickers(ctx) {
  const { agent, state, render, ansi, C, pushLine, persistRaw, askQuestion, maskKey } = ctx

  state.pickerStack ??= []

  /** 当前 picker 过滤后的 item 列表（filter 大小写不敏感子串匹配，header 不参与） */
  function pickerItems(p) {
    const f = (p.filter ?? "").toLowerCase()
    return p.entries.filter((e) => e.type === "item" && (!f || e.text.toLowerCase().includes(f)))
  }

  /** 弹出栈顶 picker 并 resolve 其 Promise。返回是否有 picker 被弹出。 */
  function popPicker(value) {
    const p = state.pickerStack.pop()
    if (!p) return false
    state.picker = state.pickerStack.at(-1) ?? null
    if (state.picker) rebuildLines()
    else render()
    p.resolve(value)
    return true
  }

  /** 关闭所有 picker：清空栈，挂起者全部 resolve(null)。 */
  function closePicker() {
    while (state.pickerStack.length) popPicker(null)
  }

  /** 打开 picker，返回选中 entry（Esc/取消 → null）。
   *  互斥保护：入栈前把现有挂起 picker 全部 resolve(null)，消除 Promise 悬挂。
   *  （正常嵌套是先 await 上一层返回再开新的，栈深通常为 1。） */
  function showPicker(title, entries, { defaultIndex = 0 } = {}) {
    closePicker()
    return new Promise((resolve) => {
      const itemCount = entries.filter((e) => e.type === "item").length
      // No selectable items — resolve immediately instead of showing an empty picker
      if (itemCount === 0) { resolve(null); return }
      const index = Math.max(0, Math.min(defaultIndex, Math.max(0, itemCount - 1)))
      state.picker = { title, entries, lines: [], index, scroll: 0, selectedLine: 0, filter: "", resolve }
      state.pickerStack.push(state.picker)
      rebuildLines()
    })
  }

  function rebuildLines() {
    const p = state.picker
    if (!p) return
    const items = pickerItems(p)
    p.filteredItems = items
    if (p.index >= items.length) p.index = Math.max(0, items.length - 1)
    const lines = []
    let row = 0, selLine = 0
    for (const e of p.entries) {
      if (e.type === "header") {
        lines.push({ text: ` ${e.text}${e.note ? `  ${e.note}` : ""}`, color: ansi.bold + C.tool })
      } else {
        if (!items.includes(e)) continue // 被 filter 滤掉
        const sel = row === p.index
        if (sel) selLine = lines.length
        const marker = e.marker ? `  ${e.marker}` : ""
        lines.push({ text: `${sel ? " ▸ " : "   "}${e.text}${marker}`, color: sel ? ansi.bold + C.text : C.dim, _row: row })
        row++
      }
    }
    if (p.filter && items.length === 0) lines.push({ text: "   (no match)", color: C.dim })
    p.lines = lines
    p.selectedLine = selLine

    // Auto-scroll: keep selectedLine within the visible window.
    // Fallback to a reasonable default when computeLayout can't run (e.g. test mocks without full state)
    let winH
    try {
      winH = Math.max(1, (computeLayout(state, { cols: (state.dims?.get() ?? {}).cols ?? (process.stdout.columns || 80), rows: (state.dims?.refresh() ?? {}).rows ?? (process.stdout.rows || 24) }).panels.picker?.h ?? lines.length + 1) - 1)
    } catch {
      winH = 8 // safe fallback for test mocks
    }
    if (p.selectedLine < p.scroll) p.scroll = p.selectedLine
    if (p.selectedLine >= p.scroll + winH) p.scroll = p.selectedLine - winH + 1
    p.scroll = Math.max(0, Math.min(p.scroll, Math.max(0, lines.length - winH)))

    render()
  }

  function renderPickerLines() { rebuildLines() }

  // === two-level model picker ===

  /** Strip known version/date suffixes to get the "series" name of a model.
   *  e.g. "qwen-max-latest" → "qwen-max", "qwen-max-2024-09-19" → "qwen-max" */
  function modelSeries(name) {
    return name
      .replace(/-latest$/, "")
      .replace(/-\d{4}-\d{2}-\d{2}$/, "") // date suffix like -2024-09-19
      .replace(/-\d{8}$/, "")              // date suffix like -20240919
  }

  /** Dedupe model list: group by series, keep shortest name per group.
   *  Reduces "qwen-max, qwen-max-latest, qwen-max-2024-09-19" to just "qwen-max". */
  function dedupeModels(models) {
    const groups = new Map()
    for (const m of models) {
      const series = modelSeries(m)
      const existing = groups.get(series)
      if (!existing || m.length < existing.length) {
        groups.set(series, m)
      }
    }
    return [...groups.values()].sort()
  }

  /** entry 唯一标识：异步更新 entries 后按它恢复选中项 */
  function entryKey(e) {
    if (!e) return null
    return e.action === "switch" ? `switch:${e.provider}:${e.model}` : `action:${e.action}`
  }

  /** Get API key for a provider (config.json only — env vars are not a key source) */
  function getApiKey(providerName, providerConfig) {
    return providerConfig.apiKey
  }

  /** Level 1: Show provider list. Selecting a provider opens Level 2 (model list). */
  async function openModelPicker() {
    // 菜单循环：选中即关闭，子流程结束后重开主菜单；Esc 退出
    for (;;) {
      const entries = buildProviderEntries()
      const items = entries.filter((e) => e.type === "item")
      const current = items.findIndex(
        (e) => e.action === "open-models" && e.provider === agent.activeProvider)
      const picked = showPicker("Models & Providers", entries, { defaultIndex: Math.max(0, current) })
      const e = await picked
      if (!e) return
      if (e.action === "open-models") {
        // Level 2: open model list for this provider
        const modelSelected = await openModelListForProvider(e.provider)
        if (modelSelected) return // model selected, close picker
        // Esc from model list → return to provider list
      } else if (e.action === "add") {
        await addProviderFlow()
      } else if (e.action === "remove") {
        await removeProviderFlow()
      } else if (e.action === "key") {
        await setKeyFlow()
      }
    }
  }

  /** Level 2: Show model list for a specific provider. Returns true if a model was selected. */
  async function openModelListForProvider(providerName) {
    const providerConfig = agent.providers.find((p) => p.name === providerName)
    if (!providerConfig) return false

    const entries = buildModelEntriesForProvider(providerName, providerConfig)
    const items = entries.filter((e) => e.type === "item")
    const currentModel = providerName === agent.activeProvider
      ? (agent.activeModel || providerConfig.model)
      : providerConfig.model
    const current = items.findIndex((e) => e.model === currentModel)
    const picked = showPicker(`${providerName} models`, entries, { defaultIndex: Math.max(0, current) })

    // Async fetch models in background
    fetchModelsForProvider(providerName, entries).catch((err) => {
      pushLine(`[model] fetch models failed: ${err.message}`, C.error)
    })

    const e = await picked
    if (!e) return false // Esc → back to provider list
    if (e.action === "switch") {
      await selectModel(e).catch((err) => pushLine(`[error] ${err.message}`, C.error))
      return true
    }
    return false
  }

  /** Build entries for Level 1: provider list */
  function buildProviderEntries() {
    const entries = []
    for (const p of agent.providers) {
      const active = p.name === agent.activeProvider
      const currentModel = active ? (agent.activeModel || p.model) : p.model
      const marker = active ? "●" : ""
      const note = active ? " ← current" : ""
      const keyStatus = p.apiKey ? "" : " (no key)"
      entries.push({
        type: "item",
        text: `${p.name.padEnd(12)} ${currentModel}${note}`,
        action: "open-models",
        provider: p.name,
        marker,
        note: `${p.baseURL}${keyStatus}`,
      })
    }
    entries.push({ type: "header", text: "Management" })
    entries.push({ type: "item", text: "Add provider…", action: "add" })
    if (agent.providers.length > 1) entries.push({ type: "item", text: "Remove provider…", action: "remove" })
    entries.push({ type: "item", text: "Set / change API key…", action: "key" })
    return entries
  }

  /** Build entries for Level 2: model list for a specific provider */
  function buildModelEntriesForProvider(providerName, providerConfig) {
    const entries = []
    const active = providerName === agent.activeProvider
    const currentModel = active ? (agent.activeModel || providerConfig.model) : providerConfig.model
    const isDefaultModel = currentModel === providerConfig.model

    entries.push({ type: "header", text: "Current model" })
    entries.push({
      type: "item",
      text: currentModel,
      action: "switch",
      provider: providerName,
      model: currentModel,
      marker: active && isDefaultModel ? "●" : "",
    })

    entries.push({ type: "header", text: "Available models (loading…)" })
    return entries
  }

  /** Async fetch and splice models for a specific provider */
  async function fetchModelsForProvider(providerName, entries) {
    const { listModels } = await import("../provider/index.mjs")
    const providerConfig = agent.providers.find((p) => p.name === providerName)
    if (!providerConfig) return

    let selKey = null
    try {
      const apiKey = getApiKey(providerName, providerConfig)
      const models = await listModels(
        { baseURL: providerConfig.baseURL, apiKey: apiKey ?? "" },
        { signal: AbortSignal.timeout(10000) }
      )
      if (state.picker?.entries !== entries) return // picker closed or changed
      selKey = entryKey(pickerItems(state.picker)[state.picker.index])

      // Dedupe and filter
      const deduped = dedupeModels(models)
      const currentModel = providerName === agent.activeProvider
        ? (agent.activeModel || providerConfig.model)
        : providerConfig.model

      // Find the "Available models" header and splice after it
      const headerIdx = entries.findIndex((e) => e.type === "header" && e.text.startsWith("Available models"))
      if (headerIdx >= 0) {
        // Update header with count info
        const hint = deduped.length < models.length
          ? ` (${models.length} total, ${deduped.length} shown — type to filter)`
          : ` (${deduped.length})`
        entries[headerIdx].text = `Available models${hint}`

        // Splice models after header (skip current model)
        const newModels = deduped.filter((m) => m !== currentModel)
        entries.splice(headerIdx + 1, 0, ...newModels.map((m) => ({
          type: "item",
          text: m,
          action: "switch",
          provider: providerName,
          model: m,
        })))
      }
    } catch (error) {
      if (state.picker?.entries !== entries) return
      const headerIdx = entries.findIndex((e) => e.type === "header" && e.text.startsWith("Available models"))
      if (headerIdx >= 0) {
        entries[headerIdx].text = `Available models (fetch failed: ${sliceByWidth(error.message, 30)})`
      }
    }

    // Restore selection
    const pk = state.picker
    const items = pickerItems(pk)
    const restored = selKey ? items.findIndex((e) => entryKey(e) === selKey) : -1
    pk.index = restored >= 0 ? restored : Math.min(pk.index, Math.max(0, items.length - 1))
    rebuildLines()
  }

  async function selectModel(item) {
    closePicker()
    const target = agent.providers.find((pp) => pp.name === item.provider)
    if (!target) return
    const providerDefault = target.model
    target.model = item.model
    agent.activeProvider = item.provider
    // If selecting the provider's default model, clear activeModel; otherwise set it
    agent.activeModel = item.model !== providerDefault ? item.model : null
    agent.provider = { ...target }
    if (agent.config?.agent?.compactThresholdAuto) {
      const { resolveCompactThreshold } = await import("../config.mjs")
      agent.config.agent.compactThreshold = resolveCompactThreshold(null, item.model).value
    }
    await persistRaw((raw) => {
      // 落盘前剥离运行时注入的 proxyUri（由 loadConfig + injectProxy 在加载时重建）
      raw.providers = agent.providers.map(({ proxyUri: _, ...p }) => p)
      raw.activeProvider = item.provider
      raw.activeModel = agent.activeModel || undefined  // null → omit from config
    })
    agent.config.activeProvider = item.provider
    agent.config.activeModel = agent.activeModel
    if (!agent.provider.apiKey) {
      const selKey = await askQuestion(`Enter API key for ${item.provider} (leave empty to skip):`)
      if (selKey) await setProviderKey(item.provider, selKey)
    }
  }

  async function addProviderFlow() {
    const entries = [
      { type: "header", text: "Select a preset provider" },
      ...Object.entries(PRESETS).filter(([name]) => !agent.providers.some((p) => p.name === name))
        .map(([name, p]) => ({ type: "item", text: `${name.padEnd(10)} ${p.desc ?? ""} (${p.model})`, name, kind: "preset" })),
      { type: "header", text: "Other" },
      { type: "item", text: "Custom (manual config)", name: "__custom__", kind: "custom" },
    ]
    const se = await showPicker("Add Provider", entries)
    if (!se) return // Esc → 返回上级（openModelPicker 循环会重开主菜单）
    if (se.kind === "custom") {
      const name = await askQuestion("Enter provider name:")
      if (!name) return
      if (agent.providers.some((p) => p.name === name)) return
      const baseURL = (await askQuestion("Enter baseURL:")).replace(/\/+$/, "")
      if (!baseURL) return
      const model = await askQuestion("Enter model name:")
      if (!model) return
      const format = (await askQuestion("API format [openai/anthropic/google] (default: openai):")).trim().toLowerCase()
      const cfg = { name, baseURL, model }
      if (format === "anthropic" || format === "google") cfg.format = format
      else if (format && format !== "openai") return // unknown format → abort
      agent.providers.push(cfg)
      await persistRaw((raw) => { raw.providers = agent.providers })
      const key = await askQuestion(`Enter API key for ${name} (skip if none):`)
      if (key) await setProviderKey(name, key)
      return
    }
    const preset = PRESETS[se.name]
    if (!preset || agent.providers.some((p) => p.name === se.name)) return
    const cfg = { name: se.name, baseURL: preset.baseURL, model: preset.model }
    if (preset.thinking) cfg.thinking = preset.thinking
    if (preset.reasoningEffort) cfg.reasoningEffort = preset.reasoningEffort
    if (preset.maxTokens) cfg.maxTokens = preset.maxTokens
    if (preset.chatPath) cfg.chatPath = preset.chatPath
    if (preset.format) cfg.format = preset.format
    agent.providers.push(cfg)
    await persistRaw((raw) => { raw.providers = agent.providers })
    const key = await askQuestion(`Enter API key for ${se.name} (skip if none):`)
    if (key) await setProviderKey(se.name, key)
  }

  async function removeProviderFlow() {
    const candidates = agent.providers.filter((p) => p.name !== agent.activeProvider)
    if (!candidates.length) return
    const se = await showPicker("Remove Provider", [
      { type: "header", text: "Select provider to remove" },
      ...candidates.map((p) => ({ type: "item", text: `${p.name} (${p.model})`, name: p.name })),
    ])
    if (!se) return
    agent.providers.splice(agent.providers.findIndex((p) => p.name === se.name), 1)
    await persistRaw((raw) => { raw.providers = agent.providers })
  }

  async function setKeyFlow() {
    const se = await showPicker("Configure API Key", [
      { type: "header", text: "Select provider" },
      ...agent.providers.map((p) => ({ type: "item", text: `${p.name} ${p.apiKey ? `(has key: ${maskKey(p.apiKey)})` : "(no key)"}`, name: p.name })),
    ])
    if (!se) return
    const key = await askQuestion(`Enter API key for ${se.name}:`)
    if (key) await setProviderKey(se.name, key)
  }

  async function setProviderKey(name, key) {
    const target = agent.providers.find((p) => p.name === name)
    if (!target) return
    target.apiKey = key
    if (name === agent.activeProvider) agent.provider.apiKey = key
    await persistRaw((raw) => { raw.providers = agent.providers })
  }


  /** Slot-bound model picker: two-level provider → model selection that RETURNS
   *  { provider, model } instead of writing main-session state — used by /submodel
   *  to write into a subagent slot (global or per-role). Esc from the model list
   *  returns to the provider list (openModelPicker parity); Esc from the provider
   *  list exits → null. */
  async function pickModelForSlot() {
    for (;;) {
      const providers = agent.providers
      if (!providers.length) return null
      const e = await showPicker("Select provider", providers.map((p) => ({
        type: "item",
        text: `${p.name.padEnd(12)} ${p.model}`,
        action: "open-models",
        provider: p.name,
      })))
      if (!e?.provider) return null
      const providerConfig = providers.find((p) => p.name === e.provider)
      if (!providerConfig) return null
      const entries = buildModelEntriesForProvider(e.provider, providerConfig)
      fetchModelsForProvider(e.provider, entries).catch((err) => {
        pushLine(`[model] fetch models failed: ${err.message}`, C.error)
      })
      const me = await showPicker(`${e.provider} models`, entries)
      if (!me?.model) continue // Esc from model list → back to provider list
      return { provider: e.provider, model: me.model }
    }
  }

  return { showPicker, closePicker, popPicker, renderPickerLines, openModelPicker, selectModel, setProviderKey, pickModelForSlot }
}
