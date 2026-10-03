/**
 * presets.mjs — provider access layer for the extension（W16：随 config-io 删旧成为 VSC 端
 * provider/config 访问层——核无对位件的端侧读面逐字迁入本档）。
 *
 * Single source of truth is the shared ~/.thincoder/config.json (CLI format:
 * providers[] with a single `model` default per channel + top-level defaultModel composite —
 * MODEL-SELECTION：渠道单值 = 新装种子/槽空兜底/显示回退；provider.model = 运行时解析值；
 * 候选面 = 运行期 `/models` 拉取（非配置字段））。
 * 预设表 = 核单源 `@thincoder/core/config.mjs`（PROVIDER_PRESETS——#129 取一侧）。
 *
 * W16 迁入的端侧面（核无对位件——CORE-UNIFICATION §2.5 #177「UI 壳按端注入」/ #130
 * 「config 三段端侧消费面」）：
 *  - `resolveKey` / `resolveDefaultModel` / `providerFromConfig` / `providerNamesInConfig`
 *    （provider 运行时解析——VSC 面板/视觉通道消费）；
 *    （M9 准入探针目标构造 = 核 `probeTargetOf`——B10 E1 已收编，端侧零自持）；
 *  - `sanitizeConsultModels` / `warnConsultModelsFiltered` / `loadConsultPool`（F-4 会诊池
 *    软失败清洗 + 运行时读面——provider:model 引用面，写面（settings-panel-write）与读面
 *    （agent/setup）共用）。
 */

export { PROVIDER_PRESETS as PRESETS } from "@thincoder/core/config.mjs"
import { PROVIDER_PRESETS, findProvider, normalizeProxy } from "@thincoder/core/config.mjs"
import { resolveChannelModel } from "@thincoder/core/model-ref.mjs"
import { loadRaw, resolveProviders, _configPath, setProviderKey, removeProviderKeyFromConfig } from "@thincoder/core/config-io.mjs"

/** Names of providers configured in config.json (custom providers are regular entries — no synthetic slots). */
export function providerNames() {
  return providerNamesInConfig()
}

/** Check if a provider has a resolvable API key (config.json only — env vars are not a key source). */
export function isProviderConfigured(name) {
  try {
    const { providers } = resolveProviders()
    const entry = providers.find((p) => p.name === name)
    if (!entry) return false
    return !!resolveKey(entry)
  } catch {
    return false
  }
}

/** Store an API key into config.json (kept async for call-site compatibility).
 *  #695：核写结果（`{ok:false,reason:"mtime-conflict"}` → 提示串）穿透返回。 */
export async function storeProviderKey(name, key) {
  if (!key || !key.trim()) return
  return setProviderKey(name, key.trim())
}

/** Remove an API key from config.json (the provider entry itself stays). #695：核写结果穿透返回。 */
export async function removeProviderKey(name) {
  return removeProviderKeyFromConfig(name)
}

/** All configured providers as a name → entry map. */
export function readProviders() {
  try {
    const { providers } = resolveProviders()
    return Object.fromEntries(providers.map((p) => [p.name, p]))
  } catch {
    return {}
  }
}

/**
 * Get API key for a provider (config.json apiKey only — env vars are not a key source).
 * Kept async — call sites await it.
 */
export async function getKey(name) {
  try {
    const { providers } = resolveProviders()
    const entry = providers.find((p) => p.name === name)
    if (!entry) return null
    return resolveKey(entry)
  } catch {
    return null
  }
}

/**
 * Build the runtime provider object for LLM calls: config entry + resolved key/model.
 * null when no key resolvable; throws when `name` is set but not in providers[].
 */
export async function buildProvider(name) {
  return providerFromConfig(name)
}

/** Display label for a provider (preset desc, falling back to the name). */
export function providerLabel(name) {
  return PROVIDER_PRESETS[name]?.desc || name
}

// ─── W16 迁入：provider 运行时解析面（原 config-io.mjs——核无对位件）─────────────

/**
 * API key for a provider entry — config.json only. Env vars are NOT a key source
 * (users configure keys in the settings panel / config file, never in the environment).
 */
export function resolveKey(entry) {
  return entry?.apiKey?.trim() || null
}

/**
 * Runtime model for an entry——#841 核转口（单源 = `@thincoder/core/model-ref.mjs`
 * `resolveChannelModel`——接入面自持解析退场）：① `defaultModel` 复合属本渠道 → 其模型段；
 * ② 渠道默认单值 `entry.model`；③ null。
 *（不再静默回退 models[0]——候选清单字段已退场；空值合法——准入/候选经 /models 拉取）。
 */
export function resolveDefaultModel(entry, raw) {
  return resolveChannelModel(entry, raw?.defaultModel ?? null)
}

/**
 * Build the runtime provider object for LLM calls from config.json.
 * null when the provider has no resolvable API key. Throws on unknown name (findProvider parity).
 */
export function providerFromConfig(name) {
  const { providers, activeProvider } = resolveProviders()
  const target = name ? findProvider(providers, name) : findProvider(providers, activeProvider)
  if (!target) return null
  const apiKey = resolveKey(target)
  if (!apiKey) return null
  const raw = loadRaw()
  const provider = {
    ...target,
    apiKey,
    model: resolveDefaultModel(target, raw),
  }
  if (provider.baseURL) provider.baseURL = provider.baseURL.replace(/\/+$/, "")

  // Proxy: per-provider `proxy: true` AND global config.proxy.model === true (CLI injectProxy parity).
  // Default model requests go direct — proxy.model is opt-in.
  const proxyCfg = normalizeProxy(raw.proxy)
  if (target.proxy === true && proxyCfg?.uri && proxyCfg.model === true) {
    provider.proxyUri = proxyCfg.uri
  }
  return provider
}

/** List provider names present in config.json ([] when none). */
export function providerNamesInConfig() {
  try {
    return resolveProviders().providers.map((p) => p.name)
  } catch {
    return []
  }
}

// ─── W16 迁入：F-4 consultModels 软失败 + 运行时读面（原 config-consult.mjs）──────
/** 软失败清洗（纯）：非数组 → []；形状非法/未知渠道丢弃；超 5 截断。返回 { keep, dropped }。 */
export function sanitizeConsultModels(cm, providerNames) {
  if (cm === undefined || cm === null) return { keep: [], dropped: [] }
  if (!Array.isArray(cm)) {
    return { keep: [], dropped: [`agent.consultModels must be an array of { provider, model } entries (got ${typeof cm})`] }
  }
  const names = providerNames instanceof Set ? providerNames : new Set(providerNames ?? [])
  const keep = []
  const dropped = []
  for (const entry of cm) {
    if (keep.length >= 5) { dropped.push(`over the 5-entry cap — dropped ${JSON.stringify(entry)}`); continue }
    if (!entry || typeof entry !== "object" || typeof entry.provider !== "string" || !entry.provider.trim()
        || typeof entry.model !== "string" || !entry.model.trim()) {
      dropped.push(`invalid entry (expected { provider: string, model: string }) — got ${JSON.stringify(entry)}`)
      continue
    }
    if (!names.has(entry.provider)) {
      dropped.push(`entry "${entry.provider}:${entry.model}" references unknown provider "${entry.provider}" (available: ${[...names].join(", ") || "none"})`)
      continue
    }
    keep.push(entry)
  }
  return { keep, dropped }
}

/** 一次性过滤警告——进程级（VSC 读点高频调用——模块标志去重）。 */
let warnedConsultModels = false
export function warnConsultModelsFiltered(dropped, path = _configPath()) {
  if (warnedConsultModels || dropped.length === 0) return
  warnedConsultModels = true
  console.warn(`[config] agent.consultModels: ${dropped.length} invalid entr${dropped.length === 1 ? "y ignored" : "ies ignored"} (filtered — no crash):\n` +
    dropped.map((d) => `  - ${d}`).join("\n") +
    `\n  Fix: clean agent.consultModels in ${path} (VS Code: Settings → consult pool; CLI: /config).`)
}

/** 运行时读面（setup.mjs withPool/工具注册/hydrate cfgConsultModels 共用）：单读盘 + 清洗 + 警告。 */
export function loadConsultPool() {
  const raw = loadRaw()
  const names = (Array.isArray(raw?.providers) ? raw.providers : []).map((p) => p?.name).filter(Boolean)
  const { keep, dropped } = sanitizeConsultModels(raw?.agent?.consultModels ?? [], names)
  warnConsultModelsFiltered(dropped)
  return keep
}
