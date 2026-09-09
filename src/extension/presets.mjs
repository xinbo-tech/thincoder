/**
 * presets.mjs — provider access layer for the extension.
 * Single source of truth is the shared ~/.thincoder/config.json (CLI format:
 * providers[] with models[] candidates + top-level defaultModel composite — MODEL-
 * MERGE-SESSION——会话模型 = 会话槽双字段，provider.model = 运行时解析值).
 * Preset table mirrors CLI PROVIDER_PRESETS (models seeds) — see src/config-io.mjs.
 */

export { PROVIDER_PRESETS as PRESETS } from "../config-io.mjs"
import {
  PROVIDER_PRESETS, resolveProviders, resolveKey,
  providerFromConfig, setProviderKey, removeProviderKeyFromConfig,
} from "../config-io.mjs"

/** Names of providers configured in config.json (custom providers are regular entries — no synthetic slots). */
export function providerNames() {
  try {
    return resolveProviders().providers.map((p) => p.name)
  } catch {
    return []
  }
}

/** Check if a provider has a resolvable API key (config entry → env fallbacks, CLI parity). */
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

/** Store an API key into config.json (kept async for call-site compatibility). */
export async function storeProviderKey(name, key) {
  if (!key || !key.trim()) return
  setProviderKey(name, key.trim())
}

/** Remove an API key from config.json (the provider entry itself stays). */
export async function removeProviderKey(name) {
  removeProviderKeyFromConfig(name)
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
 * Build the runtime provider object for LLM calls: config entry + resolved key/model,
 * env overrides applied (CLI loadConfig parity). null when no key resolvable;
 * throws when `name` is set but not in providers[].
 */
export async function buildProvider(name) {
  return providerFromConfig(name)
}

/** Display label for a provider (preset desc, falling back to the name). */
export function providerLabel(name) {
  return PROVIDER_PRESETS[name]?.desc || name
}
