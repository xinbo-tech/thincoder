/**
 * model-picker.mjs — /model two-level picker + provider management + session-slot model
 * selection（MODEL-MERGE-SESSION 拆分产物——/model 两级面自 pickers.mjs 迁出）。
 *
 * 语义（2026-09-10 MODEL-SELECTION v2）：selectModel 写**会话槽**（agent 内存态 + saveSession）；
 * 会话级模型面**实变** ⇒ 同拍写回 config.defaultModel（判据句 6——写面单点 = `config-helpers.mjs`
 * `carryoverDefaultModel`；等值 ∕ 回声零写）。候选 = **运行期拉取**（`GET /models`——M2；
 * 拉到的行直接可选）；显式 `provider:model` 一律放行（M4——仅[空值/裸值/未知 provider]无效）。
 * 切换成功回显规格来源（M6）；渠道条目不携模型（单值 `providers[].model` 退场——2026-10-09 清除批；
 * 渠道行显示回退 = 渠道 note 的 `baseURL`）。
 * 配置写入面（加渠道 / 设 key）探一次 `/models`（M9——探不通标「不可用」+ 明示原因，不阻断保存）。
 * 渠道管理流（add/remove/key/context）是 provider 级 config 写——语义不变；2026-09-29 结构拆分起
 * 四流居 provider-admin.mjs（本档装配 ∥ 尾同名再出口）。F-4 (ISSUE-FIX-BATCH)：removeProviderFlow
 * 级联清理悬挂引用（cascadeRemoveProvider——定义同在 provider-admin.mjs）。
 * ctx: { agent, state, render, ansi, C, pushLine, persistRaw, askQuestion, maskKey, showPicker,
 *      closePicker, renderPickerLines, confirmDelete }（后四者为 pickers.mjs 通用 picker 绑定——闭包入参，环安全）。
 */
import { sliceByWidth } from "./render.mjs"
import { providerSpec, specMatch } from "@thincoder/core/config.mjs"
import { saveSession, loadSlotFile } from "@thincoder/core/session.mjs"
import { carryoverDefaultModel } from "./config-helpers.mjs"
import { getProviderModels, modelListFailureText, dedupeModels } from "./model-catalog.mjs"
import { createProviderAdmin } from "./provider-admin.mjs"

/** createModelPicker(ctx) → { openModelPicker, selectModel, setProviderKey, setContextFlow, pickModelForSlot } */
export function createModelPicker(ctx) {
  const { agent, state, pushLine, persistRaw, askQuestion, maskKey, showPicker, closePicker, renderPickerLines, confirmDelete = () => { throw new Error("ctx.confirmDelete missing — deletion refused (fail-closed)") } } = ctx
  const { ansi, C } = ctx
  // 渠道管理四流 + 级联清理（provider-admin.mjs——structure-split-2 迁出：本档装配 ∥ 尾同名再出口）
  const admin = createProviderAdmin({ agent, pushLine, persistRaw, askQuestion, maskKey, showPicker, confirmDelete, C, fmtContextK })

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
        await admin.addProviderFlow()
      } else if (e.action === "remove") {
        await admin.removeProviderFlow()
      } else if (e.action === "key") {
        await admin.setKeyFlow()
      } else if (e.action === "context") {
        await admin.setContextFlow()
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

  /** Build entries for Level 1: provider list（L1 = 渠道面——session 复合态随行显示）。
   *  2026-10-09 清除批：渠道条目不携模型——模型段只显**会话槽**值（仅当前会话渠道），
   *  其余显示回退 = 行 note 的 `baseURL`。 */
  function buildProviderEntries() {
    const entries = []
    for (const p of agent.providers) {
      const active = p.name === agent.activeProvider
      const shown = active && agent.activeModel ? ` ${agent.activeModel}` : ""
      const marker = active ? "●" : ""
      // A1（第 20 批 §12.5）：渠道警示（(no key) / (不可用)）上移 text——与既有状态标
      // （(ctx …) / ← session）同簇（先例 = provider-admin.mjs setKeyFlow / wizard 的 (added, no key)）：
      // 警示不再位于最先牺牲段。note 收窄为 baseURL（补充信息——超宽随行右截断可接受）。
      const sessionNote = active ? " ← session" : ""
      const keyStatus = p.apiKey ? "" : " (no key)"
      const unavailable = p._unavailable ? " (不可用)" : ""
      const ctxTag = ` (ctx ${fmtContextK(providerSpec(p).context)})`
      entries.push({
        type: "item",
        text: `${p.name.padEnd(12)}${shown}${ctxTag}${keyStatus}${unavailable}${sessionNote}`,
        action: "open-models",
        provider: p.name,
        marker,
        note: p.baseURL,
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

  /** 拉取期占位行——选中该行视为返回上一级（action:"none" → 非 switch/keep → `return false`；
   *  拉取后台继续、缓存照写——通用 picker 无禁用项概念）；拉取落地后由 loader 移除。 */
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

  /** F-3 /model 会话级：写槽（agent 内存态 + saveSession）；选定实变 ⇒ 同拍写回
   *  config.defaultModel（判据句 6——新会话起点随动；等值 ∕ 回声零写；写回失败不反扑会话写、记错零静默）。
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
    // 写前读：槽复合基线（判据句 6 实变单元——档缺 ⇒ null；`_slot` 未钉 ⇒ 无槽面）
    const slotBefore = agent._slot == null ? null : loadSlotFile(agent.cwd, agent._slot)
    // 内存态（agent 会话运行时）——config 写仅经写回单点（下方实变节）
    agent.activeProvider = target.name
    agent.activeModel = item.model
    agent.provider = { ...target }
    agent.provider.model = item.model
    if (agent.config?.agent?.compactThresholdAuto) {
      const { resolveCompactThreshold } = await import("@thincoder/core/config.mjs")
      agent.config.agent.compactThreshold = resolveCompactThreshold(null, agent.provider).value
    }
    // 写会话槽（saveSession——槽双字段恒非空）——写回单点在其后（槽先配置后）
    saveSession(agent)
    // 选定写回（判据句 6——定序槽先配置后；失败不反扑会话写、记错零静默）
    const carried = await carryoverDefaultModel({ provider: target.name, model: item.model, slotBefore })
    if (carried.ok !== true) console.error(`[model] default model carryover failed: ${carried.reason}`)
    else if (carried.written === true && agent.config) agent.config.defaultModel = `${target.name}:${item.model}` // 内存镜像（/config 显示面新鲜——wizard.mjs:210-211 先例）
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
      if (selKey) await admin.setProviderKey(item.provider, selKey)
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
        text: `${p.name.padEnd(12)} ${p.baseURL}`,
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
    const { listModels } = await import("@thincoder/core/provider/index.mjs")
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

  return { openModelPicker, selectModel, setProviderKey: admin.setProviderKey, setContextFlow: admin.setContextFlow, pickModelForSlot }
}

export { cascadeRemoveProvider } from "./provider-admin.mjs"
