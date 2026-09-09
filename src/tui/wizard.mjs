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

  /** Candidates for the menu step: existing providers (marked "no key" if missing), unadded presets, custom
   *  MODEL-MERGE-SESSION：渠道默认模型字段已删——显示首候选（models[0]——preset 种子 [原 model]） */
  function wizardProviderItems() {
    const items = []
    for (const p of agent.providers) {
      items.push({ kind: "existing", name: p.name, baseURL: p.baseURL, model: p.models?.[0] ?? "", label: `${p.name} (added${p.apiKey ? "" : ", no key"})` })
    }
    for (const [name, p] of Object.entries(PRESETS)) {
      if (!agent.providers.some((x) => x.name === name)) {
        items.push({
          kind: "preset", name, baseURL: p.baseURL, model: p.models?.[0] ?? "", label: `${name} (${p.desc})`,
          // 预设自身声明的扩展字段随 preset 直达落盘（code review 🟡——与 pickers preset 路径同构；
          // claude/gemini 缺 format、deepseek/glm 缺 thinking/maxTokens 会静默错配）；不新增提问步。
          models: [...(p.models ?? [])],
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
      // preset 直达：models 种子随行（preset.models → 落盘渠道候选）——其余扩展字段照旧
      if (item.models?.length) w.fields.models = item.models
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
    // MODEL-MERGE-SESSION 引导 A（F-6）：有 provider 但 defaultModel 未设时指引 /config 入口
    const hint = (agent.providers?.length ?? 0) > 0 && !agent.config?.defaultModel
      ? "Skipped initial setup. 已配置渠道但 config.defaultModel 未设——新会话无起点：/config → 默认模型 设置一次（或 /model 仅改本会话）。"
      : "Skipped initial setup. Use /model to add providers and configure API keys anytime."
    pushLine(hint, C.dim)
    render()
  }

  /** Wizard complete: write provider (update if exists) with models[] 种子, set config.defaultModel
   *  （裁定⑦——首配模型即写 defaultModel——新会话起点）, then open the session model picker. */
  async function finishWizard() {
    const f = state.wizard.fields
    state.wizard = null
    // D-C2：format 非默认（anthropic/google）时落盘；openai = 默认省略（与 D-C1 picker 路径同构）
    // MODEL-MERGE-SESSION：渠道默认 model 字段退役 → models 种子（preset 自带；custom 单模型入种）
    const providerRec = { name: f.name, baseURL: f.baseURL, models: [...(f.models ?? [f.model])], apiKey: f.key }
    if (f.format && f.format !== "openai") providerRec.format = f.format
    for (const k of ["thinking", "reasoningEffort", "maxTokens", "chatPath"]) {
      if (f[k]) providerRec[k] = f[k]
    }
    // D-F5a（wizard finishWizard——清单外同型写回补正）先盘后存：磁盘 fresh raw 单操作
    // （upsert 目标项 + defaultModel + 清 legacy 字段）——冲突放弃不留下内存 ghost（F5 约定）
    await persistRaw((raw) => {
      raw.providers ??= []
      const existing = raw.providers.find((p) => p?.name === f.name)
      if (existing) Object.assign(existing, providerRec)
      else raw.providers.push(providerRec)
      raw.defaultModel = `${f.name}:${providerRec.models[0] ?? f.model}`
      delete raw.activeProvider
      delete raw.activeModel
      // 渠道老 model 字段清理（wizard 直写路径——不依赖下次 load 迁移）
      if (existing && "model" in existing) delete existing.model
    })
    const existing = agent.providers.find((p) => p.name === f.name)
    if (existing) Object.assign(existing, providerRec)
    else agent.providers.push(providerRec)
    agent.activeProvider = f.name
    agent.activeModel = providerRec.models[0] ?? f.model
    agent.provider = { ...agent.providers.find((p) => p.name === f.name) }
    agent.provider.model = agent.activeModel
    if (agent.config?.agent?.compactThresholdAuto) {
      const { resolveCompactThreshold } = await import("../config.mjs")
      agent.config.agent.compactThreshold = resolveCompactThreshold(null, agent.provider).value
    }
    // agent.config 是 loadConfig merged——无 active* 键可写——defaultModel 随内存 merged 更新
    agent.config.defaultModel = `${f.name}:${agent.activeModel}`
    pushLabel(`❯ Setup`, ansi.bold + C.tool)
    pushLine(`Setup complete: ${f.name} / ${agent.activeModel} (defaultModel 已设——新会话起点)`, C.tool)
    // embedding key: if provided, enable vector search; if not, show how to enable later
    if (f.embedkey) {
      // D-F5b 语义先盘后存（embedding 单键补丁——冲突放弃不留 ghost）
      await persistRaw((raw) => { raw.embedding = { ...(raw.embedding ?? {}), apiKey: f.embedkey } })
      agent.config.embedding ??= {}
      agent.config.embedding.apiKey = f.embedkey
      if (agent.memory && !agent.memory.embedder) {
        const { createEmbedder } = await import("../embedding.mjs")
        agent.memory.embedder = createEmbedder(agent.config.embedding)
      }
      pushLine(`Vector search enabled (${agent.config.embedding.model ?? "BAAI/bge-m3"})`, C.tool)
    } else {
      pushLine(`Vector search disabled (memory falls back to text-only search). Run /config embedkey <key> to enable.`, C.dim)
    }
    pushLine(`Select model (Esc to keep ${agent.activeModel})`, C.dim)
    ctx.openModelPicker().catch((e) => pushLine(`[error] ${e.message}`, C.error))
  }

  return { startWizard, renderWizard, wizardChooseProvider, wizardSubmitText, cancelWizard, finishWizard, wizardProviderItems }
}
