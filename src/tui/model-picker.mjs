/**
 * model-picker.mjs — /model two-level picker + provider management + session-slot model
 * selection（MODEL-MERGE-SESSION 拆分产物——/model 两级面自 pickers.mjs 迁出）。
 *
 * 语义（2026-09-10 MODEL-SELECTION v2）：selectModel 写**会话槽**（agent 内存态 + saveSession）——
 * 不写 config（/model 不再串扰全局默认——根治）。候选 = **运行期拉取**（`GET /models`——M2；
 * 拉到的行直接可选）；显式 `provider:model` 一律放行（M4——仅[空值/裸值/未知 provider]无效）。
 * 切换成功回显规格来源（M6）；渠道默认模型 = `providers[].model` 单值（M3——显示回退读取）。
 * 配置写入面（加渠道 / 设 key）探一次 `/models`（M9——探不通标「不可用」+ 明示原因，不阻断保存）。
 * 渠道管理流（add/remove/key/context）是 provider 级 config 写——语义不变。F-4 (ISSUE-FIX-BATCH)：
 * removeProviderFlow 级联清理悬挂引用（cascadeRemoveProvider——文件尾导出）。
 * ctx: { agent, state, render, ansi, C, pushLine, persistRaw, askQuestion, maskKey, showPicker,
 *      closePicker, renderPickerLines }（后三者为 pickers.mjs 通用 picker 绑定——闭包入参，环安全）。
 */
import { sliceByWidth } from "./render.mjs"
import { PROVIDER_PRESETS as PRESETS, providerSpec, specMatch } from "../config.mjs"
import { saveSession } from "../session.mjs"
import { getProviderModels, probeChannelModels, modelListFailureText, dedupeModels } from "./model-catalog.mjs"

/** createModelPicker(ctx) → { openModelPicker, selectModel, setProviderKey, setContextFlow, pickModelForSlot } */
export function createModelPicker(ctx) {
  const { agent, state, pushLine, persistRaw, askQuestion, maskKey, showPicker, closePicker, renderPickerLines } = ctx
  const { ansi, C } = ctx

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

  /** 渠道默认模型显示值（M3③：无默认模型显 "(no default model)"——替代旧 "(no candidates)"）。 */
  function defaultModelLabel(p) {
    return p?.model ? p.model : "(no default model)"
  }

  /** 异步更新 entries 后的选中项恢复（selKey 命中则回原位，否则钳位）。 */
  function restoreSelection(entries, selKey) {
    const pk = state.picker
    if (!pk) return
    const itemRows = entries.filter((e) => e.type === "item")
    const restored = selKey ? itemRows.findIndex((e) => entryKey(e) === selKey) : -1
    pk.index = restored >= 0 ? restored : Math.min(pk.index, Math.max(0, itemRows.length - 1))
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

  /** Level 2: model list for a specific provider（M2——候选 = 运行期拉取）。返回 true = 已选定模型。 */
  async function openModelListForProvider(providerName) {
    const providerConfig = agent.providers.find((p) => p.name === providerName)
    if (!providerConfig) return false

    const entries = buildModelEntriesForProvider(providerName, providerConfig)
    const items = entries.filter((e) => e.type === "item")
    const sessionProvider = providerName === agent.activeProvider
    const currentModel = sessionProvider ? agent.activeModel : null
    const current = currentModel ? items.findIndex((e) => e.model === currentModel) : -1
    const picked = showPicker(`${providerName} models`, entries, { defaultIndex: Math.max(0, current) })

    // 进入 L2 即触发拉取（会话缓存 TTL 60s——失败不缓存；失败态在 header + 提示行展示）
    loadSessionModels(providerName, providerConfig, entries)
      .catch((err) => pushLine(`[model] fetch models failed: ${err.message}`, C.error))

    const e = await picked
    if (!e) return false // Esc → back to provider list
    if (e.action === "switch") {
      await selectModel(e).catch((err) => pushLine(`[error] ${err.message}`, C.error))
      return true
    }
    if (e.action === "keep") return true // 当前会话模型行——保持（无写）
    return false
  }

  /** Build entries for Level 1: provider list（L1 = 渠道面——session 复合态随行显示） */
  function buildProviderEntries() {
    const entries = []
    for (const p of agent.providers) {
      const active = p.name === agent.activeProvider
      const shown = active ? (agent.activeModel ?? defaultModelLabel(p)) : defaultModelLabel(p)
      const marker = active ? "●" : ""
      const note = active ? " ← session" : ""
      const keyStatus = p.apiKey ? "" : " (no key)"
      const unavailable = p._unavailable ? " (不可用)" : ""
      const ctxTag = ` (ctx ${fmtContextK(providerSpec(p).context)})`
      entries.push({
        type: "item",
        text: `${p.name.padEnd(12)} ${shown}${ctxTag}${note}`,
        action: "open-models",
        provider: p.name,
        marker,
        note: `${p.baseURL}${keyStatus}${unavailable}`,
      })
    }
    entries.push({ type: "header", text: "Management" })
    entries.push({ type: "item", text: "Add provider…", action: "add" })
    if (agent.providers.length > 1) entries.push({ type: "item", text: "Remove provider…", action: "remove" })
    entries.push({ type: "item", text: "Set / change API key…", action: "key" })
    entries.push({ type: "item", text: "Set context window (K units)…", action: "context" })
    return entries
  }

  /** Level 2 entries（/model 会话面——候选运行期拉取）：当前会话行 + 候选区（拉取填充）。
   *  占位行必须存在：showPicker 对 0 item **立即 resolve(null)**（picker 不打开、entries 不可达）——
   *  非会话渠道/空槽渠道的候选区在拉取落地前不能是空的。 */
  function buildModelEntriesForProvider(providerName, providerConfig) {
    const entries = []
    const sessionProvider = providerName === agent.activeProvider
    const sessionModel = sessionProvider ? agent.activeModel : null
    if (sessionModel) {
      entries.push({ type: "header", text: `Current (session): ${sessionModel}` })
      entries.push({ type: "item", text: `${sessionModel}  ← keep`, action: "keep", provider: providerName, model: sessionModel })
    }
    entries.push({ type: "header", text: "Available models (loading…)" })
    entries.push(loadingRow())
    return entries
  }

  /** 拉取期占位行（不可选）；拉取落地后由 loader 移除。 */
  function loadingRow() {
    return { type: "item", text: "(loading…)", action: "none", placeholder: true }
  }

  /** 清占位行 + 在 `Available models` header 后填行（空结果/失败也给一条不可选行——
   *  picker 已打开，0 item 列表不可交互）。 */
  function fillAvailableModels(entries, rows, emptyText) {
    const phIdx = entries.findIndex((e) => e.placeholder)
    if (phIdx >= 0) entries.splice(phIdx, 1)
    const headerIdx = entries.findIndex((e) => e.type === "header" && e.text.startsWith("Available models"))
    if (headerIdx < 0) return
    entries[headerIdx].text = rows.length ? `Available models (${rows.length} — type to filter)` : "Available models (none)"
    if (rows.length) entries.splice(headerIdx + 1, 0, ...rows)
    else entries.splice(headerIdx + 1, 0, { type: "item", text: emptyText, action: "none" })
  }

  /** 会话面拉取（M2）：候选 = 拉取结果直接可选（会话面提升到槽位面语义）；归并后并入。
   *  失败：header 标 `(fetch failed: …)` + 一行失败消息本体（M8 长句——该渠道不可选）。 */
  async function loadSessionModels(providerName, providerConfig, entries) {
    let selKey = null
    try {
      const models = await getProviderModels(providerConfig)
      if (state.picker?.entries !== entries) return // picker closed or changed
      const itemRows = entries.filter((e) => e.type === "item" && !e.placeholder)
      selKey = itemRows[state.picker.index] ? entryKey(itemRows[state.picker.index]) : null
      const listed = new Set(itemRows.map((e) => e.model).filter(Boolean))
      const rows = dedupeModels(models).filter((m) => !listed.has(m))
      fillAvailableModels(entries, rows.map((m) => ({
        type: "item", text: m, action: "switch", provider: providerName, model: m,
      })), "(no models)")
    } catch (error) {
      if (state.picker?.entries !== entries) return
      const phIdx = entries.findIndex((e) => e.placeholder)
      if (phIdx >= 0) entries.splice(phIdx, 1)
      const headerIdx = entries.findIndex((e) => e.type === "header" && e.text.startsWith("Available models"))
      if (headerIdx >= 0) entries[headerIdx].text = `Available models (fetch failed: ${sliceByWidth(error.message, 30)})`
      entries.splice(headerIdx + 1, 0, { type: "item", text: "(no models — 该渠道不可用)", action: "none" })
      pushLine(modelListFailureText(error), C.error)
    }
    restoreSelection(entries, selKey)
    renderPickerLines()
  }

  /** Level 2 entries（槽位面——/submodel + /config consult 池——advisor/subagent 覆盖语义
   *  独立不受清单约束——红线零改）：当前行 + 拉取建议可直接选（写 agent.* 自由串）。
   *  占位行同会话面：候选区在拉取落地前不能为空（showPicker 0 item = 不打开）。 */
  function buildSlotEntriesForProvider(providerName, providerConfig) {
    const entries = []
    const sessionProvider = providerName === agent.activeProvider
    const fallback = providerConfig.model ?? ""
    const currentModel = sessionProvider ? (agent.activeModel || fallback) : fallback
    entries.push({ type: "header", text: "Current model" })
    if (currentModel) {
      entries.push({ type: "item", text: currentModel, action: "switch", provider: providerName, model: currentModel })
    }
    entries.push({ type: "header", text: "Available models (loading…)" })
    entries.push(loadingRow())
    return entries
  }

  /** F-3 /model 纯会话级：写槽（agent 内存态 + saveSession）——绝不写 config。
   *  放行语义（M4）：仅未知 provider 拒——显式 p:m 一律放行（候选外/多冒号不再拒）。 */
  async function selectModel(item) {
    closePicker()
    const target = agent.providers.find((pp) => pp.name === item.provider)
    if (!target) {
      throw new Error(`Unknown provider: ${item.provider}`)
    }
    if (!item.model) {
      throw new Error(`Missing model name for provider: ${item.provider}`)
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
    // M6 切换回显：规格来源一行（DEFAULT 兜底 → 警示色 + /config 提示）
    const { matched } = specMatch(agent.provider.model)
    const spec = providerSpec(agent.provider)
    pushLine(
      matched
        ? `Model: ${item.provider}:${item.model} — spec found (ctx ${fmtContextK(spec.context)} / out ${fmtContextK(spec.maxOutput)})`
        : `Model: ${item.provider}:${item.model} — spec not found in MODEL_SPECS — default 128K ctx / 32K out; set context in /config to override`,
      matched ? C.tool : C.error,
    )
    if (!agent.provider.apiKey) {
      const selKey = await askQuestion(`Enter API key for ${item.provider} (leave empty to skip):`)
      if (selKey) await setProviderKey(item.provider, selKey)
    }
  }

  /** Slot-bound picker（/submodel + consult 池——红线：subagent/advisor 覆盖语义独立不受清单
   *  约束）：两级 provider → model——fetch 建议可直接选（写 agent.* 自由串——provider:model
   *  或自由值——与 subagent 工具 model 参数同语义）。返回 { provider, model } 或 null。 */
  async function pickModelForSlot() {
    for (;;) {
      const providers = agent.providers
      if (!providers.length) return null
      const e = await showPicker("Select provider", providers.map((p) => ({
        type: "item",
        text: `${p.name.padEnd(12)} ${defaultModelLabel(p)}`,
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

  /** Slot 面 fetch：模型直接并入可选行（旧 pickModelForSlot 语义——自由面；槽位面零改——
   *  仅随 M1 获得三 format 支持 + 占位行（同会话面：0 item 的 picker 不会打开））。 */
  async function fetchSlotModels(providerName, providerConfig, entries) {
    const { listModels } = await import("../provider/index.mjs")
    let selKey = null
    try {
      const models = await listModels(
        { baseURL: providerConfig.baseURL, apiKey: getApiKey(providerConfig) ?? "", format: providerConfig.format },
        { signal: AbortSignal.timeout(10000) }
      )
      if (state.picker?.entries !== entries) return
      const itemRows = entries.filter((e) => e.type === "item" && !e.placeholder)
      selKey = itemRows[state.picker.index] ? entryKey(itemRows[state.picker.index]) : null
      const deduped = dedupeModels(models).filter((m) => !itemRows.some((en) => en.model === m))
      fillAvailableModels(entries, deduped.map((m) => ({
        type: "item", text: m, action: "switch", provider: providerName, model: m,
      })), "(no models)")
    } catch (error) {
      if (state.picker?.entries !== entries) return
      const phIdx = entries.findIndex((e) => e.placeholder)
      if (phIdx >= 0) entries.splice(phIdx, 1)
      const headerIdx = entries.findIndex((e) => e.type === "header" && e.text.startsWith("Available models"))
      if (headerIdx >= 0) entries[headerIdx].text = `Available models (fetch failed: ${sliceByWidth(error.message, 30)})`
      entries.splice(headerIdx + 1, 0, { type: "item", text: "(no models)", action: "none" })
    }
    restoreSelection(entries, selKey)
    renderPickerLines()
  }

  // ═══ 渠道管理流（provider 级 config 写——语义不变——与 /model 会话选择分离）═══

  /** M9 配置阶段准入探：探通 → 清标记；探不通 → 会话内存标「不可用」+ 明示原因（绝不落 config；
   *  不阻断保存——条目已保存，仅标注）。 */
  async function probeChannelFlow(cfg, label) {
    const r = await probeChannelModels(cfg)
    if (r.ok) {
      delete cfg._unavailable
      pushLine(`${label}: /models 可用（${r.list.length} 个模型可候选）`, C.tool)
    } else {
      cfg._unavailable = true
      pushLine(`${label} 不可用 — ${r.message}`, C.error)
    }
    return r
  }

  async function addProviderFlow() {
    const entries = [
      { type: "header", text: "Select a preset provider" },
      ...Object.entries(PRESETS).filter(([name]) => !agent.providers.some((p) => p.name === name))
        .map(([name, p]) => ({ type: "item", text: `${name.padEnd(10)} ${p.desc ?? ""} (${p.model ?? ""})`, name, kind: "preset" })),
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
      const cfg = { name, baseURL, model }
      if (format.name === "anthropic" || format.name === "google") cfg.format = format.name
      else if (format.name !== "openai") return // 防御：未知格式（理论不可达——picker 枚举）
      await persistRaw((raw) => { raw.providers ??= []; raw.providers.push(cfg) }) // D-F5a 先盘后存
      agent.providers.push(cfg)
      const key = await askQuestion(`Enter API key for ${name} (skip if none):`)
      if (key) await setProviderKey(name, key, { probe: false }) // 探统一在流尾（M9——精确一次）
      await probeChannelFlow(cfg, name) // M9 准入探（加渠道配置写入面；保存已落——不阻断）
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
    await persistRaw((raw) => { raw.providers ??= []; raw.providers.push(cfg) }) // D-F5a 先盘后存
    agent.providers.push(cfg)
    const key = await askQuestion(`Enter API key for ${se.name} (skip if none):`)
    if (key) await setProviderKey(se.name, key, { probe: false }) // 探统一在流尾（M9——精确一次）
    await probeChannelFlow(cfg, se.name) // M9 准入探（加渠道配置写入面；保存已落——不阻断）
  }

  async function removeProviderFlow() {
    const candidates = agent.providers.filter((p) => p.name !== agent.activeProvider)
    if (!candidates.length) return
    const se = await showPicker("Remove Provider", [
      { type: "header", text: "Select provider to remove" },
      ...candidates.map((p) => ({ type: "item", text: `${p.name} (${defaultModelLabel(p)})`, name: p.name })),
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

  /** 设 API key（可以来自渠道管理流 / 加渠道流内的 key 步）：写盘 + 内存镜像；
   *  M9：设 key 属配置写入面——默认探一次 `/models`（不阻断——key 已保存）；
   *  加渠道流内调用传 `{ probe: false }`（探由该流尾部统一执行——精确一次）。 */
  async function setProviderKey(name, key, { probe = true } = {}) {
    const target = agent.providers.find((p) => p.name === name)
    if (!target) return
    await persistRaw((raw) => {
      raw.providers ??= []
      const t = raw.providers.find((p) => p?.name === name)
      if (t) t.apiKey = key
    })
    target.apiKey = key
    if (name === agent.activeProvider) agent.provider.apiKey = key
    if (probe) await probeChannelFlow(target, name)
  }

  /** /model provider 管理：context 窗口字段（K 单位）——picker 选 provider + 表单输入。 */
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
