/**
 * model-picker.mjs — /model two-level picker + provider management + session-slot model
 * selection (MODEL-MERGE-SESSION 拆分产物——/model 两级面自 pickers.mjs 迁出——评审 #9
 * 规模注：拆出面 ~370 行——含管理流——迁入后 pickers.mjs ≤450)。
 *
 * 语义（F-3/F-7 裁定）：selectModel 写**会话槽**（agent 内存态 + saveSession）——不写
 * config（/model 不再串扰全局默认——根治）。候选硬约束：二级列表 = providers[].models[]
 * 成员；候选外（含裸 provider 直给、API fetch 建议）一律拒——显式 p:m + models[] 成员。
 * 渠道管理流（add/remove/key/context）是 provider 级 config 写——语义不变。
 * F-4 (ISSUE-FIX-BATCH)：removeProviderFlow 级联清理——删渠道同步清 consultModels/
 * subagentModels/advisor.provider 悬挂引用（cascadeRemoveProvider——文件尾导出）。
 * ctx: { agent, state, render, ansi, C, pushLine, persistRaw, askQuestion, maskKey, showPicker,
 *      closePicker, renderPickerLines }（后三者为 pickers.mjs 通用 picker 绑定——本文件经
 *      闭包入参使用，不反向 import——环安全）。
 */
import { sliceByWidth } from "./render.mjs"
import { PROVIDER_PRESETS as PRESETS, providerSpec, firstCandidate } from "../config.mjs"
import { saveSession } from "../session.mjs"

/** createModelPicker(ctx) → { openModelPicker, selectModel, setProviderKey, setContextFlow, pickModelForSlot } */
export function createModelPicker(ctx) {
  const { agent, state, pushLine, persistRaw, askQuestion, maskKey, showPicker, closePicker, renderPickerLines } = ctx
  const { ansi, C } = ctx

  /** Strip known version/date suffixes to get the "series" name of a model.
   *  e.g. "qwen-max-latest" → "qwen-max", "qwen-max-2024-09-19" → "qwen-max" */
  function modelSeries(name) {
    return name
      .replace(/-latest$/, "")
      .replace(/-\d{4}-\d{2}-\d{2}$/, "") // date suffix like -2024-09-19
      .replace(/-\d{8}$/, "")              // date suffix like -20240919
  }

  /** Dedupe model list: group by series, keep shortest name per group. */
  function dedupeModels(models) {
    const groups = new Map()
    for (const m of models) {
      const series = modelSeries(m)
      const existing = groups.get(series)
      if (!existing || m.length < existing.length) groups.set(series, m)
    }
    return [...groups.values()].sort()
  }

  /** entry 唯一标识：异步更新 entries 后按它恢复选中项 */
  function entryKey(e) {
    if (!e) return null
    return e.action === "switch" ? `switch:${e.provider}:${e.model}` : `action:${e.action}`
  }

  /** 模型信息显示的 context 窗口（PROVIDER.md §15 D-C5）：K 单位形态跟随覆盖值。 */
  function fmtContextK(tokens) {
    if (tokens >= 1_000_000) return `${Math.round(tokens / 1_048_576)}M`
    return `${Math.round(tokens / 1024)}K`
  }

  /** Get API key for a provider (config.json only — env vars are not a key source) */
  function getApiKey(providerConfig) {
    return providerConfig.apiKey
  }

  /** 渠道候选显示值：无候选渠道显 "(no candidates)" */
  function candidatesLabel(p) {
    const n = p?.models?.length ?? 0
    return n === 0 ? "(no candidates)" : firstCandidate(p)
  }

  /** Level 1: provider list（/model 入口——session 复合两级面）。 */
  async function openModelPicker() {
    for (;;) {
      const entries = buildProviderEntries()
      const items = entries.filter((e) => e.type === "item")
      const current = items.findIndex(
        (e) => e.action === "open-models" && e.provider === agent.activeProvider)
      const picked = showPicker("Models & Providers", entries, { defaultIndex: Math.max(0, current) })
      const e = await picked
      if (!e) return
      if (e.action === "open-models") {
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

  /** Level 2: model list for a specific provider. Returns true if a model was selected. */
  async function openModelListForProvider(providerName) {
    const providerConfig = agent.providers.find((p) => p.name === providerName)
    if (!providerConfig) return false

    const entries = buildModelEntriesForProvider(providerName, providerConfig)
    const items = entries.filter((e) => e.type === "item")
    const sessionProvider = providerName === agent.activeProvider
    const currentModel = sessionProvider ? agent.activeModel : null
    const current = currentModel ? items.findIndex((e) => e.model === currentModel) : -1
    const picked = showPicker(`${providerName} models`, entries, { defaultIndex: Math.max(0, current) })

    // Async fetch models in background — 仅作候选建议辅助（加入候选需显式落 config——F-7）
    fetchSuggestions(providerName, providerConfig, entries).catch((err) => {
      pushLine(`[model] fetch models failed: ${err.message}`, C.error)
    })

    const e = await picked
    if (!e) return false // Esc → back to provider list
    if (e.action === "switch") {
      await selectModel(e).catch((err) => pushLine(`[error] ${err.message}`, C.error))
      return true
    }
    if (e.action === "keep") return true // 当前会话模型行——保持（无写）
    if (e.action === "suggest") {
      // 候选外拒（fetch 建议——models[] 外——显式落 config 才能成为候选）
      pushLine(`"${e.model}" 不在 ${providerName} 的候选 models[] 中——候选加入需显式落 config（编辑 ${providerConfig.name} 的 models[] 或经 /config 全量查看）`, C.error)
      return false // 留在 L1（未选——可再进 L2）
    }
    return false
  }

  /** Build entries for Level 1: provider list（L1 = 渠道面——session 复合态随行显示） */
  function buildProviderEntries() {
    const entries = []
    for (const p of agent.providers) {
      const active = p.name === agent.activeProvider
      const shown = active ? (agent.activeModel ?? candidatesLabel(p)) : candidatesLabel(p)
      const marker = active ? "●" : ""
      const note = active ? " ← session" : ""
      const keyStatus = p.apiKey ? "" : " (no key)"
      const ctxTag = ` (ctx ${fmtContextK(providerSpec({ ...p, model: firstCandidate(p) }).context)})`
      entries.push({
        type: "item",
        text: `${p.name.padEnd(12)} ${shown}${ctxTag}${note}`,
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

  /** Level 2 entries（/model 会话面——候选硬约束）：models[] 候选 + 建议位（fetch——候选外拒）。 */
  function buildModelEntriesForProvider(providerName, providerConfig) {
    const entries = []
    const sessionProvider = providerName === agent.activeProvider
    const sessionModel = sessionProvider ? agent.activeModel : null
    if (sessionModel) {
      entries.push({ type: "header", text: `Current (session): ${sessionModel}` })
      entries.push({ type: "item", text: `${sessionModel}  ← keep`, action: "keep", provider: providerName, model: sessionModel })
    }
    const models = Array.isArray(providerConfig.models) ? providerConfig.models : []
    entries.push({ type: "header", text: `Candidates (config models[] — ${models.length})` })
    if (models.length === 0) {
      entries.push({ type: "item", text: "(no candidates — models[] 为空；加入候选需显式落 config)", action: "none" })
    }
    for (const m of models) {
      if (m === sessionModel) continue // current row above 已列
      entries.push({ type: "item", text: m, action: "switch", provider: providerName, model: m })
    }
    entries.push({ type: "header", text: "Suggestions (API fetch — models[] 外需先落 config)" })
    return entries
  }

  /** Level 2 entries（槽位面——/submodel + /config consult 池——advisor/subagent 覆盖语义
   *  独立不受 models[] 约束——红线零改）：当前复合行 + fetch 建议可直接选（写 agent.* 自由串）。 */
  function buildSlotEntriesForProvider(providerName, providerConfig) {
    const entries = []
    const sessionProvider = providerName === agent.activeProvider
    const currentModel = sessionProvider ? (agent.activeModel || (providerConfig.models?.[0] ?? "")) : (providerConfig.models?.[0] ?? "")
    entries.push({ type: "header", text: "Current model" })
    if (currentModel) {
      entries.push({ type: "item", text: currentModel, action: "switch", provider: providerName, model: currentModel })
    }
    entries.push({ type: "header", text: "Available models (loading…)" })
    return entries
  }

  /** Async fetch: append fetched models NOT in models[] as non-selectable suggestion rows */
  async function fetchSuggestions(providerName, providerConfig, entries) {
    const { listModels } = await import("../provider/index.mjs")
    let selKey = null
    try {
      const models = await listModels(
        { baseURL: providerConfig.baseURL, apiKey: getApiKey(providerConfig) ?? "" },
        { signal: AbortSignal.timeout(10000) }
      )
      if (state.picker?.entries !== entries) return // picker closed or changed
      const itemRows = entries.filter((e) => e.type === "item")
      selKey = itemRows[state.picker.index] ? entryKey(itemRows[state.picker.index]) : null
      const candidates = new Set(Array.isArray(providerConfig.models) ? providerConfig.models : [])
      const suggestions = dedupeModels(models).filter((m) => !candidates.has(m))
      const headerIdx = entries.findIndex((e) => e.type === "header" && e.text.startsWith("Suggestions"))
      if (headerIdx >= 0) {
        entries[headerIdx].text = suggestions.length
          ? `Suggestions (API — ${suggestions.length}；models[] 外——选择会被拒——先落 config 为候选)`
          : `Suggestions (API — all fetched models already in candidates)`
        entries.splice(headerIdx + 1, 0, ...suggestions.map((m) => ({
          type: "item", text: m, action: "suggest", provider: providerName, model: m,
        })))
      }
    } catch (error) {
      if (state.picker?.entries !== entries) return
      const headerIdx = entries.findIndex((e) => e.type === "header" && e.text.startsWith("Suggestions"))
      if (headerIdx >= 0) {
        entries[headerIdx].text = `Suggestions (fetch failed: ${sliceByWidth(error.message, 30)})`
      }
    }
    // Restore selection (index 按 entries 重算——rebuild 内会再按 filter 收敛)
    const pk = state.picker
    if (pk) {
      const itemRows = entries.filter((e) => e.type === "item")
      const restored = selKey ? itemRows.findIndex((e) => entryKey(e) === selKey) : -1
      pk.index = restored >= 0 ? restored : Math.min(pk.index, Math.max(0, itemRows.length - 1))
    }
    renderPickerLines()
  }

  /** F-3 /model 纯会话级：写槽（agent 内存态 + saveSession）——绝不写 config。
   *  候选硬约束（F-1）：model 必须是该 provider models[] 成员——裸 provider/候选外 → throw（显式 p:m）。 */
  async function selectModel(item) {
    closePicker()
    const target = agent.providers.find((pp) => pp.name === item.provider)
    if (!target) {
      throw new Error(`Unknown provider: ${item.provider}`)
    }
    const models = Array.isArray(target.models) ? target.models : []
    if (!models.includes(item.model)) {
      const shown = models.length ? `(models[]: ${models.join(", ")})` : "(models[] 为空——渠道无候选)"
      throw new Error(`"${item.model}" 不在 ${item.provider} 的候选 ${shown} 中——/model 只接受 provider:model 且 model ∈ models[]（候选外拒——F-1）；加入候选需显式落 config`)
    }
    // 内存态（agent 会话运行时）——不触碰 config
    agent.activeProvider = target.name
    agent.activeModel = item.model
    agent.provider = { ...target }
    agent.provider.model = item.model
    if (agent.config?.agent?.compactThresholdAuto) {
      const { resolveCompactThreshold } = await import("../config.mjs")
      agent.config.agent.compactThreshold = resolveCompactThreshold(null, agent.provider).value
    }
    // 写会话槽（saveSession——槽双字段恒非空）——config 文件零写
    saveSession(agent)
    if (!agent.provider.apiKey) {
      const selKey = await askQuestion(`Enter API key for ${item.provider} (leave empty to skip):`)
      if (selKey) await setProviderKey(item.provider, selKey)
    }
  }

  /** Slot-bound picker: two-level provider → model selection that RETURNS { provider, model }
  /** Slot-bound picker（/submodel + consult 池——红线：subagent/advisor 覆盖语义独立不受候选
   *  约束）：两级 provider → model——fetch 建议可直接选（写 agent.* 自由串——provider:model
   *  或自由值——与 subagent 工具 model 参数同语义）。返回 { provider, model } 或 null。 */
  async function pickModelForSlot() {
    for (;;) {
      const providers = agent.providers
      if (!providers.length) return null
      const e = await showPicker("Select provider", providers.map((p) => ({
        type: "item",
        text: `${p.name.padEnd(12)} ${candidatesLabel(p)}`,
        action: "open-models",
        provider: p.name,
      })))
      if (!e?.provider) return null
      const providerConfig = providers.find((p) => p.name === e.provider)
      if (!providerConfig) return null
      const entries = buildSlotEntriesForProvider(e.provider, providerConfig)
      fetchSlotModels(e.provider, providerConfig, entries).catch((err) => {
        pushLine(`[model] fetch models failed: ${err.message}`, C.error)
      })
      const me = await showPicker(`${e.provider} models`, entries)
      if (!me?.model) continue // Esc from model list → back to provider list
      return { provider: e.provider, model: me.model }
    }
  }

  /** Slot 面 fetch：模型建议直接并入可选行（旧 pickModelForSlot 语义——自由面）。 */
  async function fetchSlotModels(providerName, providerConfig, entries) {
    const { listModels } = await import("../provider/index.mjs")
    let selKey = null
    try {
      const models = await listModels(
        { baseURL: providerConfig.baseURL, apiKey: getApiKey(providerConfig) ?? "" },
        { signal: AbortSignal.timeout(10000) }
      )
      if (state.picker?.entries !== entries) return
      const itemRows = entries.filter((e) => e.type === "item")
      selKey = itemRows[state.picker.index] ? entryKey(itemRows[state.picker.index]) : null
      const deduped = dedupeModels(models).filter((m) => !entries.some((en) => en.type === "item" && en.model === m))
      const headerIdx = entries.findIndex((e) => e.type === "header" && e.text.startsWith("Available models"))
      if (headerIdx >= 0) {
        entries[headerIdx].text = `Available models (${deduped.length} — type to filter)`
        entries.splice(headerIdx + 1, 0, ...deduped.map((m) => ({
          type: "item", text: m, action: "switch", provider: providerName, model: m,
        })))
      }
    } catch (error) {
      if (state.picker?.entries !== entries) return
      const headerIdx = entries.findIndex((e) => e.type === "header" && e.text.startsWith("Available models"))
      if (headerIdx >= 0) entries[headerIdx].text = `Available models (fetch failed: ${sliceByWidth(error.message, 30)})`
    }
    const pk = state.picker
    if (pk) {
      const itemRows = entries.filter((e) => e.type === "item")
      const restored = selKey ? itemRows.findIndex((e) => entryKey(e) === selKey) : -1
      pk.index = restored >= 0 ? restored : Math.min(pk.index, Math.max(0, itemRows.length - 1))
    }
    renderPickerLines()
  }

  // ═══ 渠道管理流（provider 级 config 写——语义不变——与 /model 会话选择分离）═══

  async function addProviderFlow() {
    const entries = [
      { type: "header", text: "Select a preset provider" },
      ...Object.entries(PRESETS).filter(([name]) => !agent.providers.some((p) => p.name === name))
        .map(([name, p]) => ({ type: "item", text: `${name.padEnd(10)} ${p.desc ?? ""} (${firstCandidate(p)})`, name, kind: "preset" })),
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
      const format = await showPicker("API format", [
        { type: "item", text: "openai", name: "openai" },
        { type: "item", text: "anthropic", name: "anthropic" },
        { type: "item", text: "google", name: "google" },
      ])
      if (!format) return // Esc/取消 → 中止流程
      const cfg = { name, baseURL, models: [model] }
      if (format.name === "anthropic" || format.name === "google") cfg.format = format.name
      else if (format.name !== "openai") return // 防御：未知格式（理论不可达——picker 枚举）
      await persistRaw((raw) => { raw.providers ??= []; raw.providers.push(cfg) }) // D-F5a 先盘后存
      agent.providers.push(cfg)
      const key = await askQuestion(`Enter API key for ${name} (skip if none):`)
      if (key) await setProviderKey(name, key)
      return
    }
    const preset = PRESETS[se.name]
    if (!preset || agent.providers.some((p) => p.name === se.name)) return
    const cfg = { name: se.name, baseURL: preset.baseURL, models: [...(preset.models ?? [])] }
    if (preset.thinking) cfg.thinking = preset.thinking
    if (preset.reasoningEffort) cfg.reasoningEffort = preset.reasoningEffort
    if (preset.maxTokens) cfg.maxTokens = preset.maxTokens
    if (preset.chatPath) cfg.chatPath = preset.chatPath
    if (preset.format) cfg.format = preset.format
    await persistRaw((raw) => { raw.providers ??= []; raw.providers.push(cfg) }) // D-F5a 先盘后存
    agent.providers.push(cfg)
    const key = await askQuestion(`Enter API key for ${se.name} (skip if none):`)
    if (key) await setProviderKey(se.name, key)
  }

  async function removeProviderFlow() {
    const candidates = agent.providers.filter((p) => p.name !== agent.activeProvider)
    if (!candidates.length) return
    const se = await showPicker("Remove Provider", [
      { type: "header", text: "Select provider to remove" },
      ...candidates.map((p) => ({ type: "item", text: `${p.name} (${candidatesLabel(p)})`, name: p.name })),
    ])
    if (!se) return
    await persistRaw((raw) => {
      raw.providers ??= []
      const idx = raw.providers.findIndex((p) => p?.name === se.name)
      if (idx !== -1) raw.providers.splice(idx, 1)
      // F-4 级联（IKCDMR——AC-4）：同盘清 consultModels/subagentModels/advisor.provider 悬挂引用
      cascadeRemoveProvider(raw, se.name)
    })
    agent.providers.splice(agent.providers.findIndex((p) => p.name === se.name), 1)
    // 会话内存镜像同清（agent.config = loadConfig 产物——consult/escalate 同会话读
    // agent.config.agent.*；merged.advisor 为 agent.advisor 的提升拷贝——双处清理）
    if (agent.config) {
      cascadeRemoveProvider(agent.config, se.name)
      if (agent.config.advisor?.provider === se.name) delete agent.config.advisor.provider
    }
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
    await persistRaw((raw) => {
      raw.providers ??= []
      const t = raw.providers.find((p) => p?.name === name)
      if (t) t.apiKey = key
    })
    target.apiKey = key
    if (name === agent.activeProvider) agent.provider.apiKey = key
  }

  /** /model provider 管理：context 窗口字段（K 单位）——picker 选 provider + 表单输入。 */
  async function setContextFlow() {
    const se = await showPicker("Set Context Window", [
      { type: "header", text: "Select provider" },
      ...agent.providers.map((p) => ({
        type: "item",
        text: `${p.name} (ctx ${fmtContextK(providerSpec({ ...p, model: firstCandidate(p) }).context)})`,
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
    let newCtx // undefined = 清空（回 spec 值）
    if (val !== "") {
      const n = Number(val)
      if (!Number.isInteger(n) || n <= 0) {
        pushLine(`Invalid context: "${val}" — must be a positive integer in K units (e.g. 128 = 128K)`, C.error)
        return
      }
      newCtx = n
    }
    await persistRaw((raw) => {
      raw.providers ??= []
      const t = raw.providers.find((p) => p?.name === se.name)
      if (!t) return
      if (newCtx === undefined) delete t.context
      else t.context = newCtx
    })
    if (newCtx === undefined) delete target.context
    else target.context = newCtx
    if (se.name === agent.activeProvider) {
      if (newCtx === undefined) delete agent.provider.context
      else agent.provider.context = newCtx
      if (agent.config?.agent?.compactThresholdAuto) {
        const { resolveCompactThreshold } = await import("../config.mjs")
        agent.config.agent.compactThreshold = resolveCompactThreshold(null, agent.provider).value
      }
    }
    pushLine(target.context !== undefined
      ? `ctx = ${target.context}K (${target.context * 1024} tokens)`
      : `context cleared — using model spec (${fmtContextK(providerSpec(target).context)})`, C.tool)
  }

  return { openModelPicker, selectModel, setProviderKey, setContextFlow, pickModelForSlot }
}

/** F-4 (IKCDMR) 级联清理（删渠道共享写点）：raw/merged config 移除 name 渠道后清悬挂引用——
 *  agent.consultModels 条目 / agent.subagentModels 角色值（=== name 或 "name:…" 前缀——
 *  角色值是 "provider:model" | 裸渠道名 | 裸模型名）/ agent.advisor.provider。
 *  纯 mutate（removeProviderFlow persistRaw 的 D-F5 新鲜 raw 上调用；agent.config 内存镜像
 *  子树与 raw.agent 同构可复用）。空数组/空对象键删除（规范形态）。 */
export function cascadeRemoveProvider(raw, name) {
  const a = raw?.agent
  if (!a || typeof a !== "object" || Array.isArray(a)) return
  if (Array.isArray(a.consultModels)) {
    const keep = a.consultModels.filter((m) => m?.provider !== name)
    if (keep.length) a.consultModels = keep
    else delete a.consultModels
  }
  if (a.subagentModels && typeof a.subagentModels === "object" && !Array.isArray(a.subagentModels)) {
    for (const role of Object.keys(a.subagentModels)) {
      const v = a.subagentModels[role]
      if (typeof v === "string" && (v === name || v.startsWith(`${name}:`))) delete a.subagentModels[role]
    }
    if (Object.keys(a.subagentModels).length === 0) delete a.subagentModels
  }
  if (a.advisor && typeof a.advisor === "object" && !Array.isArray(a.advisor) && a.advisor.provider === name) {
    delete a.advisor.provider
  }
}
