/**
 * settings-state.js — shared settings-panel state (split out of settings.js).
 *
 * SS is the single home for every mutable value that used to be a module-level
 * `let _x` in settings.js. All settings modules read/write through SS.<name>,
 * so they all see (and mutate) the SAME object at runtime (same pattern as state.js).
 */

export const PROVIDER_LABELS = {
  deepseek: "DeepSeek", kimi: "Kimi (Moonshot)", glm: "GLM (Zhipu)",
  qwen: "Qwen (Alibaba)", minimax: "MiniMax", openai: "OpenAI",
  claude: "Claude (Anthropic)", gemini: "Gemini (Google)",
  grok: "Grok (xAI)", mistral: "Mistral",
}

export const SS = {
  /** @type {{ providers?: Record<string,{configured:boolean,masked:string}>, custom?: {baseURL?:string,model?:string}, labels?: Record<string,string>, presets?: object[] }} */
  providerStatus: {},
  /** Model list getter (chat panel's ctx._models) — supplies the advisor model dropdown. */
  getModels: null,
  /** @type {{ hasKey?: boolean }} */
  websearchSettings: {},
  /** @type {{ built?:boolean, files?:number, chunks?:number, hasEmbedder?:boolean } | null} */
  indexStatus: null,
  /** @type {{ maxTurns?:number, subagentTurns?:number, compactThreshold?:number|null, verifyGuard?:boolean, advisor?:object, effortEnums?:object } | null} */
  agentSettings: null,
  /** @type {{ name:string, value:string|null }[] | null} — detected shells (extension sends once) */
  shellCandidates: null,
  /** @type {string|null} — current config.shell value */
  shellValue: null,
  /** @type {{ uri?:string, web?:boolean, model?:boolean } | null} */
  proxySettings: null,
}

/** Effort enum for a model id — the panel's model entries carry spec reasoning arrays. */
export function effortEnumFor(modelId) {
  const entry = (SS.getModels?.() || []).find((m) => m.id === modelId)
  const levels = entry?.reasoning || []
  if (levels.length > 0) return levels.filter((x) => x !== "enabled")
  // Fallback: the agentSettings snapshot carries spec-derived enums — available even
  // before the model-list network probe returns.
  return SS.agentSettings?.effortEnums?.[modelId] || []
}
/** Model-official default effort: spec reasoningEffortDefault (falls back to the highest level). */
export function defaultEffortFor(modelId) {
  const entry = (SS.getModels?.() || []).find((m) => m.id === modelId)
  const levels = effortEnumFor(modelId)
  return (entry && entry.effortDefault) || levels[0] || null
}
/** Provider display label. */
export function labelFor(provider) {
  return SS.providerStatus.labels?.[provider] || PROVIDER_LABELS[provider] || provider
}
