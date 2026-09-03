import { sliceByWidth } from "./render.mjs"
import { PROVIDER_PRESETS as PRESETS, providerSpec } from "../config.mjs"
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
      winH = Math.max(1, (computeLayout(state, { cols: (state.dims?.get() ?? {}).cols ?? (process.stdout.columns || 80), rows: (state.dims?.get() ?? {}).rows ?? (process.stdout.rows || 24) }).panels.picker?.h ?? lines.length + 1) - 1)
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

  /** 模型信息显示的 context 窗口（PROVIDER.md §15 D-C5）：K 单位形态跟随覆盖值
   *  （config K 是二进制 K：128 → 128×1024 = 131072 → 显示 "128K"）；≥1M tokens 用 M 形态
   *  （1_000_000 → "1M"），与 spec 值的大窗口惯例一致。 */
  function fmtContextK(tokens) {
    if (tokens >= 1_000_000) return `${Math.round(tokens / 1_048_576)}M`
    return `${Math.round(tokens / 1024)}K`
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
      } else if (e.action === "context") {
        await setContextFlow()
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
      // context 窗口显示（PROVIDER.md §15 D-C5/T-C6）：跟随 providers[].context 覆盖
      const ctxTag = ` (ctx ${fmtContextK(providerSpec(p).context)})`
      entries.push({
        type: "item",
        text: `${p.name.padEnd(12)} ${currentModel}${ctxTag}${note}`,
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
    entries.push({ type: "item", text: "Set context window (K units)…", action: "context" })
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
      // provider 对象（非 model 字符串）——阈值跟随 providers[].context 覆盖（PROVIDER.md §15 T-C2）
      agent.config.agent.compactThreshold = resolveCompactThreshold(null, target).value
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
      // D-C1（TUI.md §10.6D）：API format 改 picker 选择（openai/anthropic/google——默认 index=0
      // openai）——固定枚举不再手输；Esc/取消 = 中止整个 Add Provider 流程（cfg 尚未落盘——
      // 无半配置，与旧手输非法 abort 同语义）。与 preset 选择器同形态——零新机制。
      const format = await showPicker("API format", [
        { type: "item", text: "openai", name: "openai" },
        { type: "item", text: "anthropic", name: "anthropic" },
        { type: "item", text: "google", name: "google" },
      ])
      if (!format) return // Esc/取消 → 中止流程
      const cfg = { name, baseURL, model }
      if (format.name === "anthropic" || format.name === "google") cfg.format = format.name
      else if (format.name !== "openai") return // 防御：未知格式（理论不可达——picker 枚举）
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

  /** /model provider 管理：context 窗口字段（K 单位，PROVIDER.md §15 D-C4/D-C5）——
   *  picker 选 provider + 表单输入（复用 syncProviderField 的落盘模式：改 agent.providers 目标项
   *  → persistRaw 全量写盘）；空输入清空（回 spec 值）；非法输入报错不落盘（D-C1 语义同 loadConfig）。 */
  async function setContextFlow() {
    const se = await showPicker("Set Context Window", [
      { type: "header", text: "Select provider" },
      ...agent.providers.map((p) => ({
        type: "item",
        text: `${p.name} (ctx ${fmtContextK(providerSpec(p).context)})`,
        name: p.name,
      })),
    ])
    if (!se?.name) return // Esc
    const target = agent.providers.find((p) => p.name === se.name)
    if (!target) return
    const current = Number.isInteger(target.context) && target.context > 0 ? target.context : null
    const val = (await askQuestion(
      `Context window for ${se.name} in K units (current: ${current ? `${current}K` : "spec default"} — e.g. 128 = 128K; empty to clear):`
    ))?.trim() ?? ""
    if (val === "") {
      delete target.context
    } else {
      const n = Number(val)
      if (!Number.isInteger(n) || n <= 0) {
        pushLine(`Invalid context: "${val}" — must be a positive integer in K units (e.g. 128 = 128K)`, C.error)
        return
      }
      target.context = n
    }
    if (se.name === agent.activeProvider) {
      // 运行时 provider 同步（同 setProviderKey 先例：只补 context，不重建对象以免丢 activeModel 覆盖）
      if (target.context === undefined) delete agent.provider.context
      else agent.provider.context = target.context
      if (agent.config?.agent?.compactThresholdAuto) {
        const { resolveCompactThreshold } = await import("../config.mjs")
        agent.config.agent.compactThreshold = resolveCompactThreshold(null, agent.provider).value
      }
    }
    await persistRaw((raw) => { raw.providers = agent.providers })
    pushLine(target.context !== undefined
      ? `ctx = ${target.context}K (${target.context * 1024} tokens)`
      : `context cleared — using model spec (${fmtContextK(providerSpec(target).context)})`, C.tool)
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

  return { showPicker, closePicker, popPicker, renderPickerLines, openModelPicker, selectModel, setProviderKey, setContextFlow, pickModelForSlot }
}
