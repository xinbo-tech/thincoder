/** /advisor command: toggle advisor on/off, select model, configure thinking.
 *  Interactive loop UX — stays in menu after each action, Esc to exit.
 *  ctx: { agent, showPicker, pushLine, pushLabel, persistRaw } */
import { ansi, C } from "./ansi.mjs"

export async function handleAdvisorCommand(ctx) {
  const { agent, showPicker, pushLine, pushLabel } = ctx
  const cfg = agent.config.advisor ??= {}

  const persist = async () => {
    if (ctx.persistRaw) {
      await ctx.persistRaw((raw) => {
        raw.agent ??= {}
        raw.agent.advisor = cfg
      })
    }
  }

  // Lazy model cache — fetched once per /advisor session
  let modelCache = null

  // ── State helpers ──
  function advisorStatus() {
    const enabled = cfg.enabled === true
    const curModel = cfg.model || agent.provider.model
    const thinkInfo = cfg.thinking === null ? "off"
      : cfg.thinking?.type === "disabled" ? "off"
      : cfg.reasoningEffort ? `on (${cfg.reasoningEffort})`
      : cfg.thinking ? `on (${cfg.thinking.type})` : "(main)"
    return `Advisor: ${enabled ? "ON" : "OFF"} | Model: ${curModel} | Think: ${thinkInfo}`
  }

  function headerLine() {
    return `    ${advisorStatus()}`.replace(/\|/g, ansi.dim + "|" + ansi.reset)
  }

  // ── Model picker sub-loop ──
  async function modelPicker() {
    if (!modelCache) {
      modelCache = await fetchAdvisorModels(agent)
    }
    let modelIdx = 0
    for (;;) {
      const entries = buildModelEntries(agent, cfg, modelCache)
      const c = await showPicker("Advisor Model", entries, { defaultIndex: modelIdx })
      if (!c) return
      modelIdx = Math.max(0, entries.filter((e) => e.type === "item").indexOf(c))

      if (c.action === "inherit") {
        delete cfg.provider
        delete cfg.model
        await persist()
        pushLabel("❯ Advisor", ansi.bold + C.tool)
        pushLine("Model: using main model", C.tool)
      } else if (c.action === "switch") {
        cfg.provider = c.provider
        cfg.model = c.model
        await persist()
        pushLabel("❯ Advisor", ansi.bold + C.tool)
        pushLine(`Model: ${c.provider}/${c.model}`, C.tool)
      }
    }
  }

  // ── Thinking picker sub-loop ──
  async function thinkingPicker() {
    let thinkIdx = 0
    for (;;) {
      const entries = buildThinkingEntries(agent, cfg)
      const c = await showPicker("Advisor Thinking", entries, { defaultIndex: thinkIdx })
      if (!c) return
      thinkIdx = Math.max(0, entries.filter((e) => e.type === "item").indexOf(c))

      if (c.action === "inherit") {
        delete cfg.thinking
        delete cfg.reasoningEffort
        await persist()
        pushLabel("❯ Advisor", ansi.bold + C.tool)
        pushLine("Thinking: using main model settings", C.tool)
      } else if (c.action === "think_on") {
        const { specForModel } = await import("../config.mjs")
        const spec = specForModel(getEffectiveModel(agent, cfg))
        cfg.thinking = { type: spec.thinkEnabledValue ?? "enabled" }
        if (spec.thinkApi === "effort") delete cfg.thinking
        await persist()
        pushLabel("❯ Advisor", ansi.bold + C.tool)
        pushLine(`Thinking: ON`, C.tool)
      } else if (c.action === "think_off") {
        const { specForModel } = await import("../config.mjs")
        const spec = specForModel(getEffectiveModel(agent, cfg))
        const isCustomThink = (spec.thinkEnabledValue ?? "enabled") !== "enabled"
        cfg.thinking = isCustomThink ? null : { type: "disabled" }
        await persist()
        pushLabel("❯ Advisor", ansi.bold + C.tool)
        pushLine("Thinking: OFF", C.tool)
      } else if (c.action.startsWith("effort_")) {
        cfg.reasoningEffort = c.action.slice(7)
        await persist()
        pushLabel("❯ Advisor", ansi.bold + C.tool)
        pushLine(`Reasoning effort: ${cfg.reasoningEffort}`, C.tool)
      }
    }
  }

  // ── Main loop ──
  let mainIdx = 0
  for (;;) {
    const enabled = cfg.enabled === true
    const curProvider = cfg.provider || "(main)"
    const curModel = cfg.model || agent.provider.model
    const guardInfo = cfg.guard === true ? "on" : "off"

    const entries = [
      { type: "header", text: headerLine() },
      { type: "item", text: `Advisor: ${enabled ? "ON" : "OFF"}`, action: "toggle" },
      { type: "item", text: `Model: ${curModel}`, action: "model", note: `Provider: ${curProvider}` },
      { type: "item", text: `Thinking: ${advisorStatus().split("|")[2]?.trim() || "(main)"}`, action: "thinking" },
      { type: "item", text: `Guard: ${guardInfo}`, action: "guard" },
      { type: "item", text: "View full config", action: "view" },
    ]

    const choice = await showPicker("Advisor", entries, { defaultIndex: mainIdx })
    if (!choice) return // Esc
    mainIdx = Math.max(0, entries.filter((e) => e.type === "item").indexOf(choice))

    if (choice.action === "view") {
      pushLabel("❯ Advisor", ansi.bold + C.tool)
      pushLine(`Status:   ${enabled ? "ON" : "OFF"}`, C.dim)
      pushLine(`Model:    ${curModel} (provider: ${curProvider})`, C.dim)
      pushLine(`Guard:    ${guardInfo}`, C.dim)
      pushLine(`Thinking: ${advisorStatus().split("|")[2]?.trim() || "(main)"}`, C.dim)
      continue
    }

    if (choice.action === "toggle") {
      cfg.enabled = !cfg.enabled
      await persist().catch(err => pushLine(`[error] Advisor toggle: ${err.message}`, C.error))
      pushLabel("❯ Advisor", ansi.bold + C.tool)
      pushLine(`Advisor: ${cfg.enabled ? "ON" : "OFF"}`, C.tool)
      continue
    }

    if (choice.action === "guard") {
      cfg.guard = !(cfg.guard === true)
      await persist().catch(err => pushLine(`[error] ${err.message}`, C.error))
      pushLabel("❯ Advisor", ansi.bold + C.tool)
      pushLine(`Guard: ${cfg.guard === true ? "on" : "off"}`, C.tool)
      continue
    }

    if (choice.action === "model") {
      await modelPicker()
      continue
    }

    if (choice.action === "thinking") {
      await thinkingPicker()
      continue
    }
  }
}

// ── Model helpers ──

function getEffectiveModel(agent, cfg) {
  const providerForDefaults = cfg.provider
    ? agent.providers?.find(p => p.name === cfg.provider) || agent.provider
    : agent.provider
  return cfg.model || providerForDefaults.model
}

async function fetchAdvisorModels(agent) {
  const { listModels } = await import("../provider/index.mjs")
  const result = new Map()
  await Promise.all((agent.providers || []).map(async (p) => {
    try {
      const models = await listModels({ baseURL: p.baseURL, apiKey: p.apiKey ?? "" }, { signal: AbortSignal.timeout(10000) })
      result.set(p.name, { models, error: null })
    } catch (err) {
      result.set(p.name, { models: [], error: err.message.slice(0, 40) })
    }
  }))
  return result
}

function buildModelEntries(agent, cfg, cache) {
  const entries = []
  entries.push({ type: "item", text: (!cfg.provider ? "● " : "  ") + "Use main model", action: "inherit" })

  for (const p of agent.providers || []) {
    const cached = cache.get(p.name)
    const hasKey = !!p.apiKey
    const noteParts = [p.baseURL]
    if (!hasKey) noteParts.push("(no key)")
    if (agent.activeProvider === p.name) noteParts.push("← active")
    if (cached?.error) noteParts.push(`(fetch failed: ${cached.error})`)
    entries.push({ type: "header", text: p.name, note: noteParts.join(" ") })

    // Default model
    const isDefault = cfg.provider === p.name && cfg.model === p.model
    entries.push({ type: "item", text: `${isDefault ? "● " : "  "}${p.model}`, action: "switch", provider: p.name, model: p.model })

    // Additional models from API, excluding the default model
    if (cached?.models) {
      for (const m of cached.models) {
        if (m === p.model) continue
        const isSelected = cfg.provider === p.name && cfg.model === m
        entries.push({ type: "item", text: `${isSelected ? "● " : "  "}${m}`, action: "switch", provider: p.name, model: m })
      }
    }
  }
  return entries
}

async function buildThinkingEntries(agent, cfg) {
  const { specForModel } = await import("../config.mjs")
  const providerForDefaults = cfg.provider
    ? agent.providers?.find(p => p.name === cfg.provider) || agent.provider
    : agent.provider
  const effectiveModel = cfg.model || providerForDefaults.model
  const spec = specForModel(effectiveModel)
  const thinkOnValue = spec.thinkEnabledValue ?? "enabled"
  const isCustomThink = thinkOnValue !== "enabled"
  const isEffortOnly = spec.thinkApi === "effort"
  const effortLevels = spec.reasoningEffortEnum ?? ["high", "max"]

  const curEffort = cfg.reasoningEffort ?? providerForDefaults.reasoningEffort
  const curThinking = cfg.thinking ?? providerForDefaults.thinking
  const thinkingEnabled = curThinking?.type === thinkOnValue
    || (curThinking?.type === undefined && !isCustomThink)

  const entries = [
    { type: "item", text: "Use main model settings", action: "inherit" },
  ]
  if (!isEffortOnly) {
    entries.push({ type: "header", text: "Thinking mode" })
    entries.push({ type: "item", text: `Enabled  ${thinkingEnabled ? "← current" : ""}`, action: "think_on" })
    entries.push({ type: "item", text: `Disabled ${(curThinking?.type === "disabled" || curThinking === null) ? "← current" : ""}`, action: "think_off" })
  }
  entries.push({ type: "header", text: "Reasoning effort" })
  for (const level of effortLevels) {
    entries.push({ type: "item", text: `${level} ${curEffort === level ? "← current" : ""}`, action: `effort_${level}` })
  }
  return entries
}
