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
/** Effort 下拉视图（单一规则源——初渲染（`settings-agent.js`）与换模型重建（`settings-widgets.js`）两径共用）：
 *  `levels` = 「—」+ 枚举（「—」恒首项、不落盘 effort）；`selected` = 已存值 > 注册默认（须 ∈ 枚举）> 「—」。
 *  枚举空 ⇒ `null`（调用方不渲染控件）。占位「—」取代旧「枚举首项兑底」：未注册默认时不再预选枚举首项
 *  （四新档枚举首项 = `"none"` ⇒ 会静默预设关思考）。注册默认 = 模型条目的 `effortDefault`
 *  （spec `reasoningEffortDefault` 直读，来源 `src/extension/provider-probe-window.mjs:67`）。 */
export function effortSelectView(model, current) {
  const levels = model ? effortEnumFor(model) : []
  if (levels.length === 0) return null
  const def = (SS.getModels?.() || []).find((m) => m.id === model)?.effortDefault
  return { levels: ["—", ...levels], selected: current || (def && levels.includes(def) ? def : "—") }
}

/** Effort 载荷归一（落盘前唯一取数口）：「—」（未注册占位）/ `none`（= 关思考）/ 空 ⇒ `null`
 *  ⇒ 调用方删键（不写字面）；其余档原样返回。 */
export function effortPayloadValue(v) {
  const s = typeof v === "string" ? v.trim() : ""
  return s === "" || s === "—" || s === "none" ? null : s
}
/** Provider display label. */
export function labelFor(provider) {
  return SS.providerStatus.labels?.[provider] || PROVIDER_LABELS[provider] || provider
}
