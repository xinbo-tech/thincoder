/**
 * model-ref.mjs — composite model reference parser (MODEL-MERGE-SESSION).
 * A model is an explicit "provider:model" composite — config.defaultModel (top level,
 * new-session starting point) and session slots both speak this language. providers[].
 * models[] (string array) is the HARD candidate set: a composite is valid only when the
 * provider exists AND the model is a member of that provider's models[].
 *
 * Strict two-segment parse — deliberately does NOT reuse resolveChildProvider's loose
 * three-state resolution: ① legacy single-provider configs and ② model-name-only refs
 * are gone with activeProvider/activeModel (F-1), so a bare provider or bare model is
 * invalid everywhere (裁定③——裸 provider 拒——显式 p:m).
 *
 * Runtime model resolution:
 *   parseModelRef(ref, providers)      → { ok, provider, model } | { ok:false, reason }
 *   resolveRuntimeProvider(providers, defaultModel)
 *                                      → provider object with `.model` set, or {} when
 *                                        defaultModel is null/invalid (D-S1: callers mark
 *                                        _providerInvalid — never throws)
 *   defaultModelReason(providers, defaultModel) → human reason for the D-S1 marker
 *
 * Consumers: config.mjs loadConfig (re-exported as the config hub), make-agent.mjs.
 */
export function parseModelRef(ref, providers) {
  if (typeof ref !== "string" || !ref.trim()) {
    return { ok: false, reason: 'model reference expected as "provider:model" (e.g. deepseek:deepseek-v4-pro)' }
  }
  const sep = ref.indexOf(":")
  if (sep <= 0 || sep === ref.length - 1) {
    return { ok: false, reason: `invalid model reference "${ref}" — expected provider:model (bare provider/model names are not accepted)` }
  }
  const providerName = ref.slice(0, sep)
  const model = ref.slice(sep + 1)
  const list = Array.isArray(providers) ? providers : []
  const provider = list.find((p) => p?.name === providerName)
  if (!provider) {
    const available = list.map((p) => p.name).join(", ") || "(none)"
    return { ok: false, reason: `unknown provider "${providerName}" in model reference (available: ${available})` }
  }
  const models = Array.isArray(provider.models) ? provider.models : []
  if (!models.includes(model)) {
    const shown = models.length ? models.map((m) => `"${m}"`).join(", ") : "(none — no candidates)"
    return { ok: false, reason: `model "${model}" is not in provider "${providerName}" candidates (models[]: ${shown})` }
  }
  return { ok: true, provider, model }
}

/** Resolve the runtime provider object for config.defaultModel: provider clone carrying
 *  `.model` = the parsed concrete model (API/spec consumers read provider.model unchanged).
 *  Invalid/missing defaultModel → {} (D-S1 shape — name/model/baseURL absent so
 *  validateProvider flags it; TUI/headless surface the reason from defaultModelReason). */
export function resolveRuntimeProvider(providers, defaultModel) {
  const r = parseModelRef(defaultModel, providers)
  if (!r.ok) return {}
  return { ...r.provider, model: r.model }
}

/** Human-readable reason behind an invalid/empty runtime resolution (D-S1 原因). */
export function defaultModelReason(providers, defaultModel) {
  const list = Array.isArray(providers) ? providers : []
  if (!defaultModel) {
    return list.length > 0
      ? "defaultModel 未设置（config 顶层 defaultModel — 新会话起点；/config → 默认模型 设置）"
      : "未配置任何 provider"
  }
  return parseModelRef(defaultModel, list).reason ?? `defaultModel "${defaultModel}" 无效`
}

/** First candidate of a provider's models[] — the display/default fallback for surfaces
 *  that used to read providers[].model (the channel default no longer exists; candidates
 *  replace it — the first one is the natural display seed). "" when the channel has no candidates. */
export function firstCandidate(provider) {
  const models = provider?.models
  return Array.isArray(models) && models.length > 0 ? models[0] : ""
}
