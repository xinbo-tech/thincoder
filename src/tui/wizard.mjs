/**
 * wizard.mjs — first-launch config wizard
 * Extracted from index.mjs: provider select → step-by-step input (name/baseURL/model/format/key/embedkey)
 * → persist → then model picker. Custom 分支含 API format 步（D-C2，TUI.md §10.6D）。
 * Accesses shared state and UI functions from the startTUI closure via ctx object.
 * ctx: { agent, state, pushLine, pushLabel, render, persistRaw, openModelPicker }
 */

import { PROVIDER_PRESETS as PRESETS } from "../config.mjs"
import { ansi, C } from "./ansi.mjs"

/**
 * Creates the wizard controller.
 * Returns { startWizard, renderWizard, wizardChooseProvider, wizardSubmitText, cancelWizard, finishWizard }
 */
export function createWizard(ctx) {
  const { agent, state, pushLine, pushLabel, render, persistRaw } = ctx

  /** Candidates for the menu step: existing providers (marked "no key" if missing), unadded presets, custom */
  function wizardProviderItems() {
    const items = []
    for (const p of agent.providers) {
      items.push({ kind: "existing", name: p.name, baseURL: p.baseURL, model: p.model, label: `${p.name} (added${p.apiKey ? "" : ", no key"})` })
    }
    for (const [name, p] of Object.entries(PRESETS)) {
      if (!agent.providers.some((x) => x.name === name)) {
        items.push({
          kind: "preset", name, baseURL: p.baseURL, model: p.model, label: `${name} (${p.desc})`,
          // 预设自身声明的扩展字段随 preset 直达落盘（code review 🟡——与 pickers preset 路径同构；
          // claude/gemini 缺 format、deepseek/glm 缺 thinking/maxTokens 会静默错配）；不新增提问步。
          format: p.format, thinking: p.thinking, reasoningEffort: p.reasoningEffort,
          maxTokens: p.maxTokens, chatPath: p.chatPath,
        })
      }
    }
    items.push({ kind: "custom", name: null, label: "Custom endpoint…" })
    return items
  }

  /** Text step definitions: prompt + validation (returns true if valid, otherwise error message) */
  const WIZARD_STEPS = {
    name: {
      prompt: "Name this provider (alphanumeric/-/_ e.g. my-openai)",
      validate: (v) =>
        (/^[\w-]+$/.test(v) && !agent.providers.some((p) => p.name === v)) || "Name must be alphanumeric/-/_ and unique",
    },
    baseURL: {
      prompt: "Enter baseURL (e.g. https://api.openai.com/v1)",
      validate: (v) => /^https?:\/\/.+/.test(v) || "baseURL must start with http(s)://",
    },
    model: {
      prompt: "Enter model name (e.g. gpt-4o)",
      validate: (v) => v.length > 0 || "Model name required",
    },
    // D-C2（TUI.md §10.6D）：Custom 分支的 API format 步（endpoint 后 key 前——与 Add Provider
    // picker 路径两入口一致；默认 openai）。空输入 = openai 直过（Enter 即默认——同 D-C1 index=0）；
    // Esc 在该步沿用 wizard 既有“Esc 随时跳过”语义（取消整个向导——无半配置落盘）。
    format: {
      prompt: "API format [openai/anthropic/google] (Enter = openai default)",
      // 大小写不敏感（旧手输口径——输入统一 toLowerCase 后落盘）；空输入 = openai 默认
      validate: (v) => !v || /^(openai|anthropic|google)$/i.test(v) || "API format must be one of: openai, anthropic, google",
    },
    key: {
      prompt: "Enter API key",
      validate: (v) => v.length > 0 || "Key must not be empty",
    },
    embedkey: {
      prompt: "Optional: embedding API key (SiliconFlow, for memory vector search; press Enter to skip)",
      validate: () => true, // skippable
    },
  }
  const WIZARD_NEXT = { name: "baseURL", baseURL: "model", model: "format", format: "key", key: "embedkey", embedkey: null }

  function startWizard() {
    state.wizard = { step: "provider", index: 0, scroll: 0, selectedLine: 0, fields: {}, error: null, lines: [] }
    renderWizard()
  }

  function renderWizard() {
    const w = state.wizard
    if (!w) return
    const lines = []
    if (w.step === "provider") {
      lines.push({ text: " Choose a model provider:", color: C.text })
      wizardProviderItems().forEach((it, i) => {
        if (i === w.index) w.selectedLine = lines.length
        lines.push({
          text: `${i === w.index ? " ▸ " : "   "}${it.label}`,
          color: i === w.index ? ansi.bold + C.text : C.dim,
        })
      })
    } else {
      const f = w.fields
      if (f.name) lines.push({ text: ` Provider:  ${f.name}`, color: C.dim })
      if (f.baseURL) lines.push({ text: ` baseURL: ${f.baseURL}`, color: C.dim })
      if (f.model) lines.push({ text: ` Model:   ${f.model}`, color: C.dim })
      lines.push({ text: ` ❯ ${WIZARD_STEPS[w.step].prompt}`, color: ansi.bold + C.text })
      lines.push({ text: " (type in input box below)", color: C.dim })
      w.selectedLine = 0
    }
    if (w.error) lines.push({ text: ` ${w.error}`, color: C.error })
    w.lines = lines
    render()
  }

  function wizardChooseProvider(item) {
    const w = state.wizard
    if (item.kind === "custom") {
      w.step = "name"
    } else {
      w.fields = { name: item.name, baseURL: item.baseURL, model: item.model }
      // preset 直达：预设声明的扩展字段（format/thinking/maxTokens/chatPath…）直接带进 fields——
      // 无 format 提问步（T-C4）但落盘不丢字段（code review 🟡——picker preset 路径同款复制）。
      for (const k of ["format", "thinking", "reasoningEffort", "maxTokens", "chatPath"]) {
        if (item[k]) w.fields[k] = item[k]
      }
      w.step = "key"
    }
    renderWizard()
  }

  function wizardSubmitText() {
    const w = state.wizard
    const value = state.input.join("").trim()
    const ok = WIZARD_STEPS[w.step].validate(value)
    if (ok !== true) {
      w.error = ok
      renderWizard()
      return
    }
    w.error = null
    state.input = []
    state.cursor = 0
    w.fields[w.step === "key" ? "key" : w.step] = w.step === "baseURL" ? value.replace(/\/+$/, "")
      : w.step === "format" ? (value.toLowerCase() || "openai") // 空输入 = openai 默认（D-C2）
      : value
    const next = WIZARD_NEXT[w.step]
    if (next) {
      w.step = next
      renderWizard()
    } else {
      finishWizard().catch((e) => pushLine(`[error] ${e.message}`, C.error))
    }
  }

  function cancelWizard() {
    state.wizard = null
    pushLine("Skipped initial setup. Use /model to add providers and configure API keys anytime.", C.dim)
    render()
  }

  /** Wizard complete: write provider (update if exists), set active, persist, then open model picker */
  async function finishWizard() {
    const f = state.wizard.fields
    state.wizard = null
    // D-C2：format 非默认（anthropic/google）时落盘；openai = 默认省略（与 D-C1 picker 路径同构）
    const providerRec = { name: f.name, baseURL: f.baseURL, model: f.model, apiKey: f.key }
    if (f.format && f.format !== "openai") providerRec.format = f.format
    // code review 🟡：preset 直达带来的扩展字段一并落盘（truthy 语义与 pickers preset 分支一致——
    // thinking: null 不落；Custom 路径无这些字段不受影响）
    for (const k of ["thinking", "reasoningEffort", "maxTokens", "chatPath"]) {
      if (f[k]) providerRec[k] = f[k]
    }
    const existing = agent.providers.find((p) => p.name === f.name)
    if (existing) Object.assign(existing, providerRec)
    else agent.providers.push(providerRec)
    agent.activeProvider = f.name
    agent.activeModel = null
    agent.provider = { ...agent.providers.find((p) => p.name === f.name) }
    if (agent.config?.agent?.compactThresholdAuto) {
      const { resolveCompactThreshold } = await import("../config.mjs")
      agent.config.agent.compactThreshold = resolveCompactThreshold(null, f.model).value
    }
    await persistRaw((raw) => {
      raw.providers = agent.providers
      raw.activeProvider = f.name
      raw.activeModel = undefined  // reset to default model
    })
    agent.config.activeProvider = f.name
    agent.config.activeModel = null
    pushLabel(`❯ Setup`, ansi.bold + C.tool)
    pushLine(`Setup complete: ${f.name} / ${f.model} (saved to config)`, C.tool)
    // embedding key: if provided, enable vector search; if not, show how to enable later
    if (f.embedkey) {
      agent.config.embedding ??= {}
      agent.config.embedding.apiKey = f.embedkey
      await persistRaw((raw) => { raw.embedding = { ...(raw.embedding ?? {}), apiKey: f.embedkey } })
      if (agent.memory && !agent.memory.embedder) {
        const { createEmbedder } = await import("../embedding.mjs")
        agent.memory.embedder = createEmbedder(agent.config.embedding)
      }
      pushLine(`Vector search enabled (${agent.config.embedding.model ?? "BAAI/bge-m3"})`, C.tool)
    } else {
      pushLine(`Vector search disabled (memory falls back to text-only search). Run /config embedkey <key> to enable.`, C.dim)
    }
    pushLine(`Select model (Esc to keep ${f.model})`, C.dim)
    ctx.openModelPicker().catch((e) => pushLine(`[error] ${e.message}`, C.error))
  }

  return { startWizard, renderWizard, wizardChooseProvider, wizardSubmitText, cancelWizard, finishWizard, wizardProviderItems }
}
