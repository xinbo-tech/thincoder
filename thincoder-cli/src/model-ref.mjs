/**
 * model-ref.mjs — composite model reference parser (MODEL-MERGE-SESSION; v2 2026-09-10).
 * A model is an explicit "provider:model" composite — config.defaultModel (top level,
 * new-session starting point) and session slots both speak this language. 有效域 = **provider 存在
 * + 双段非空**：清单不再人工维护（模型清单由 provider 运行期 `GET /models` 拉取决定——
 * PROVIDER.md §16），候选成员校验**已废除**——显式 `p:m` 一律放行（含多冒号首分割）。
 * providers[].model 是渠道默认模型（单值）——候选清单字段 models[] 已整字段退场。
 *
 * Strict first-colon split — deliberately does NOT reuse resolveChildProvider's loose
 * three-state resolution: ① legacy single-provider configs and ② model-name-only refs
 * are gone with activeProvider/activeModel (F-1), so a bare provider or bare model is
 * invalid everywhere (裁定③——裸 provider 拒——显式 p:m)。
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
  // 首冒号分割——`a:b:c` → provider=a、model=`b:c`（`ollama:llama3:70b` 式模型名可用，M4）
  const sep = ref.indexOf(":")
  if (sep <= 0) {
    return { ok: false, reason: `invalid model reference "${ref}" — expected provider:model (bare provider/model names are not accepted)` }
  }
  const providerName = ref.slice(0, sep)
  const model = ref.slice(sep + 1)
  if (!model) {
    return { ok: false, reason: `invalid model reference "${ref}" — model part is empty (expected provider:model)` }
  }
  const list = Array.isArray(providers) ? providers : []
  const provider = list.find((p) => p?.name === providerName)
  if (!provider) {
    const available = list.map((p) => p.name).join(", ") || "(none)"
    return { ok: false, reason: `unknown provider "${providerName}" in model reference (available: ${available})` }
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
