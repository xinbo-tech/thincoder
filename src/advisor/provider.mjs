/**
 * advisor/provider.mjs — advisor provider resolution.
 * Extracted from advisor/run.mjs (2026-09-08 structure-debt batch 6 — run.mjs
 * 511 > 500 hard cap). config-io imports (resolveProviders/findProvider) moved
 * with the function; run.mjs keeps a re-export shim for import compatibility
 * (advisor.mjs / advisor-async.mjs import resolveAdvisorProvider from run.mjs).
 */
import { resolveProviders, findProvider } from "../config-io.mjs"

/** Resolve the advisor's provider: config advisor.provider/model when set, otherwise the main agent's provider (CLI parity). */
export function resolveAdvisorProvider(agent) {
  const cfg = agent.config?.advisor
  if (cfg?.provider) {
    try {
      const { providers } = resolveProviders()
      const provider = findProvider(providers, cfg.provider)
      const result = cfg.model ? { ...provider, model: cfg.model } : { ...provider }
      if (cfg.thinking === null || cfg.thinking === false) result.thinking = undefined  // explicitly off
      else if (cfg.thinking !== undefined) result.thinking = cfg.thinking
      if (cfg.reasoningEffort !== undefined) result.reasoningEffort = cfg.reasoningEffort
      if (typeof cfg.effort === "string" && cfg.effort) result.reasoningEffort = cfg.effort // panel-persisted effort (MODEL-PICKER-UNIFY §3.3)
      return result
    } catch (e) {
      console.warn(`[advisor] resolveAdvisorProvider: ${e.message}`)
    }
  }
  const provider = { ...agent._provider }
  if (cfg?.model) provider.model = cfg.model
  if (cfg?.thinking === null || cfg?.thinking === false) provider.thinking = undefined
  else if (cfg?.thinking !== undefined) provider.thinking = cfg.thinking
  if (cfg?.reasoningEffort !== undefined) provider.reasoningEffort = cfg.reasoningEffort
  if (typeof cfg?.effort === "string" && cfg.effort) provider.reasoningEffort = cfg.effort
  return provider
}
