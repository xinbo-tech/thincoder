/**
 * config.mjs — configuration loading and saving
 * Multi-provider structure: providers[] + activeProvider
 * Config file: ~/.thincoder/config.json
 * API key can fall back to environment variables (when not configured in providers).
 */

import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"

export const configDir = join(homedir(), ".thincoder")
export const configPath = join(configDir, "config.json")

/** Built-in provider presets: shared by /provider add <preset> and first-run wizard */
export const PROVIDER_PRESETS = {
  deepseek: { baseURL: "https://api.deepseek.com", model: "deepseek-v4-pro", thinking: { type: "enabled" }, reasoningEffort: "max", maxTokens: 393216, desc: "DeepSeek" },
  kimi:     { baseURL: "https://api.moonshot.cn/v1", model: "kimi-k3", thinking: null, reasoningEffort: "max", maxTokens: 131072, desc: "Kimi / Moonshot" },
  "kimi-code": { baseURL: "https://api.kimi.com/coding/v1", model: "k3", thinking: null, reasoningEffort: "max", maxTokens: 131072, desc: "Kimi For Coding (platform.kimi.com — sk-kimi- keys; NOT interchangeable with Moonshot)" },
  glm:      { baseURL: "https://open.bigmodel.cn/api/paas/v4", model: "glm-5.2", thinking: { type: "enabled" }, reasoningEffort: "max", maxTokens: 128000, desc: "Zhipu GLM" },
  "glm-code": { baseURL: "https://open.bigmodel.cn/api/coding/paas/v4", model: "glm-5.2", thinking: { type: "enabled" }, reasoningEffort: "max", maxTokens: 128000, desc: "Zhipu GLM Coding Plan (coding endpoint — same key as GLM; server-forced thinking)" },
  qwen:     { baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1", model: "qwen3.7-max", reasoningEffort: "high", maxTokens: 131072, desc: "Qwen / Alibaba" },
  qwenplan: { baseURL: "https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1", model: "qwen3.7-max", reasoningEffort: "high", maxTokens: 131072, desc: "Qwen Token Plan (百炼套餐)" },
  mimo:     { baseURL: "https://api.xiaomimimo.com/v1", model: "mimo-v2.5-pro", thinking: { type: "enabled" }, maxTokens: 131072, desc: "MiMo (Xiaomi)" },
  mimoplan: { baseURL: "https://token-plan-cn.xiaomimimo.com/v1", model: "mimo-v2.5-pro", thinking: { type: "enabled" }, maxTokens: 131072, desc: "MiMo Token Plan (小米套餐 — tp- keys; 与按量付费 sk- 密钥不通用)" },
  minimax:  { baseURL: "https://api.minimaxi.com/v1", model: "MiniMax-M3", thinking: { type: "adaptive" }, maxTokens: 128000, chatPath: "/text/chatcompletion_v2", desc: "MiniMax" },
  openai:   { baseURL: "https://api.openai.com/v1", model: "gpt-4o", desc: "OpenAI" },
  claude:   { baseURL: "https://api.anthropic.com/v1", model: "claude-sonnet-4", format: "anthropic", maxTokens: 8192, desc: "Claude (Anthropic)" },
  gemini:   { baseURL: "https://generativelanguage.googleapis.com/v1beta", model: "gemini-2.5-flash", format: "google", maxTokens: 8192, desc: "Gemini (Google)" },
  grok:     { baseURL: "https://api.x.ai/v1", model: "grok-4.5", maxTokens: 65536, desc: "Grok (xAI)" },
  mistral:  { baseURL: "https://api.mistral.ai/v1", model: "mistral-large", maxTokens: 32768, desc: "Mistral" },
  volcengine: { baseURL: "https://ark.cn-beijing.volces.com/api/v3", model: "doubao-pro-32k", maxTokens: 32768, desc: "Volcengine Ark (豆包)" },
  hunyuan:  { baseURL: "https://api.hunyuan.cloud.tencent.com/v1", model: "hunyuan-pro", maxTokens: 32768, desc: "Hunyuan (腾讯混元)" },
  siliconflow: { baseURL: "https://api.siliconflow.cn/v1", model: "deepseek-ai/DeepSeek-V3", maxTokens: 32768, desc: "SiliconFlow (硅基流动)" },
  openrouter: { baseURL: "https://openrouter.ai/api/v1", model: "anthropic/claude-sonnet-4", maxTokens: 32768, desc: "OpenRouter" },
  groq:     { baseURL: "https://api.groq.com/openai/v1", model: "llama-3.3-70b-versatile", maxTokens: 32768, desc: "Groq" },
}

export const DEFAULTS = {
  activeModel: null,  // optional: override provider.model (set via /model picker or /model provider:model)
  agent: {
    maxTurns: 200,
    subagentTurns: 100,
    subagentModel: null,  // default subagent model: "provider:model" | provider name | model name (parent provider); null = inherit parent provider
    subagentModels: {},   // per-type override: { explore, plan, coder, "eng-coder" } — priority: subagent tool model arg > this[role] > subagentModel > parent provider
    goalTurns: 200,
    compactThreshold: 100000,
    verifyGuard: false,  // push model back to verify when files were mutated but verify not run (opt-in)
    // Multi-model consultation ("会诊") + escalate ("飞刀") — CLI parity with the VS Code plugin.
    // consultModels: candidate pool for BOTH consult and escalate ({ provider, model, effort? }, up to 5).
    consultModels: [],
    consultTurns: 40,      // per-consultant tool-turn budget (diagnosis tasks)
    consultTimeoutMs: 600000, // wall-clock ceiling per consultant (10min)
    streamRules: [],      // time-traveling stream rules: [{ pattern: "regex", message: "reminder", action: "abort"|"warn", repeat: "always"|"once" }]
    advisor: { guard: false },  // code review is always available; guard: true pushes completion back until reviewed (opt-in). Also accepts provider/model/thinking/reasoningEffort/timeoutMs overrides. Deprecated: enabled (2026-08-21)
    autoThink: false,     // auto-classify task difficulty and set reasoning effort per-turn
    engineering: false,   // strict methodology enforcement — read METHODOLOGY.md, design-before-code
  },
  memory: {
    dbPath: join(configDir, "memory.db"),
    projectDir: ".thincoder/memory",
    team: null,
  },
  shell: null,            // bash tool shell executable (e.g. "C:\\Program Files\\Git\\bin\\bash.exe" or "pwsh"); null = system default (cmd on Windows, /bin/sh elsewhere)
  embedding: {
    baseURL: "https://api.siliconflow.cn/v1",
    model: "BAAI/bge-m3",
  },
  mcp: {
    servers: [],
  },
  websearch: {
    provider: "tavily",  // structured search API; empty apiKey → fall back to Bing HTML scraping
    apiKey: "",          // Tavily key (tvly-...) — optional
  },
}

// Model capability table + spec lookup live in model-specs.mjs (2026-08-31
// extract — config.mjs had grown past the 300-line advisory). Re-exported here
// so the 23 existing importers keep their import paths.
import { specForModel } from "./model-specs.mjs"
export { specForModel }


// Window utilization threshold: compacts at 60% context, reserving 40% headroom
// for injected context (directory tree, git context, outline, project instructions,
// memory/doc search results) which can consume 30-50K tokens each turn.
const COMPACT_RATIO = 0.6

/** Derive compaction threshold; explicit is the value explicitly set in config file (takes priority), otherwise auto-computed from model */
export function resolveCompactThreshold(explicit, model) {
  if (explicit != null) return { value: explicit, auto: false }
  const spec = specForModel(model)
  const value = Math.floor(spec.context * COMPACT_RATIO)
  return { value, auto: true }
}

/**
 * Bailian (阿里云百炼) host check — enable_thinking is a Bailian-only extension parameter;
 * sending it to other endpoints (kimi/glm/custom proxies) would pollute the request.
 */
export function isBailianHost(baseURL) {
  return typeof baseURL === "string"
    && (baseURL.includes("dashscope.aliyuncs.com") || baseURL.includes(".maas.aliyuncs.com"))
}

/**
 * Resolve the Bailian `enable_thinking` switch for qwen hybrid-thinking models (PROVIDER.md §12).
 * qwen3.x on Bailian defaults to thinking ON, so an explicit off must send enable_thinking:false
 * or the server silently keeps thinking. Whitelist: model name starts with "qwen" (excluding the
 * non-thinking qwen3-coder line) AND the provider points at a Bailian host.
 *   provider.thinking === null → false     (explicit off: /think off, panel off — NF1 convention)
 *   provider.reasoningEffort   → true      (effort tier implies thinking on; rides with reasoning_effort)
 *   otherwise                  → undefined (field omitted — server default stays, no behavior change)
 * NOTE: spec carries no model field today — the name comes from provider.model (spec?.model is
 * a forward-compatible fallback). Keep the body byte-aligned with thincoder-vscode config.mjs
 * (cross-repo parity test compares them).
 */
export function resolveEnableThinking(provider, spec) {
  const model = (provider?.model ?? spec?.model ?? "").toLowerCase()
  if (!model.startsWith("qwen") || model.startsWith("qwen3-coder")) return undefined
  if (!isBailianHost(provider?.baseURL)) return undefined
  if (provider.thinking === null) return false
  if (provider.reasoningEffort) return true
  return undefined
}

/**
 * Find provider by name in providers[].
 * Throws if name is non-empty but not found — a typo in activeProvider silently falling to the first provider would use the wrong key on the wrong endpoint.
 * Returns the first provider when name is empty.
 */
export function findProvider(providers, name) {
  if (name) {
    const found = providers.find((p) => p.name === name)
    if (found) return found
    const available = providers.map((p) => p.name).join(", ") || "(empty)"
    throw new Error(`activeProvider "${name}" not in providers list (available: ${available}); check for a typo in: ${configPath}`)
  }
  return providers[0] ?? { name: "default", baseURL: "", model: "" }
}

/** Normalize proxy config to { uri, web, model } or undefined (uri/url both accepted; invalid types dropped) */
export function normalizeProxy(proxy) {
  if (typeof proxy === "string") return proxy ? { uri: proxy, web: true, model: false } : undefined
  if (!proxy || typeof proxy !== "object" || Array.isArray(proxy)) return undefined
  const uri = proxy.uri || proxy.url || ""
  if (typeof uri !== "string" || !uri) return undefined
  return { uri, web: proxy.web !== false, model: proxy.model === true }
}

/**
 * Load configuration.
 * No env-var overrides — config.json is the single source of truth
 * (API keys, baseURL, model, activeProvider all come from the file).
 */
/** Keep only { header: "string value" } pairs from a provider's headers field — anything
 *  else (null, arrays, nested objects) is dropped so it can never reach a fetch call.
 *  Authorization is built-in and cannot be overridden from headers (core.mjs spreads first). */
function sanitizeProviderHeaders(p) {
  if (p.headers == null || typeof p.headers !== "object" || Array.isArray(p.headers)) { delete p.headers; return p }
  const clean = {}
  for (const [k, v] of Object.entries(p.headers)) {
    if (typeof v === "string" && k.toLowerCase() !== "authorization") clean[k] = v
  }
  if (Object.keys(clean).length > 0) p.headers = clean
  else delete p.headers
  return p
}

export function loadConfig() {
  let config = {}
  if (existsSync(configPath)) {
    try {
      config = JSON.parse(readFileSync(configPath, "utf8"))
    } catch (error) {
      throw new Error(`Config file is not valid JSON, check or delete it: ${configPath}\n  ${error.message}`, { cause: error })
    }
  }

  const merged = {
    ...DEFAULTS,
    ...config,
    providers: Array.isArray(config.providers)
      ? config.providers.map((p) => sanitizeProviderHeaders({ ...p }))
      : [],
    activeProvider: config.activeProvider ?? "",
    agent: { ...DEFAULTS.agent, ...config.agent },
    memory: { ...DEFAULTS.memory, ...config.memory },
    embedding: { ...DEFAULTS.embedding, ...config.embedding },
  }

  // Consult/escalate pool validation (CLI parity with the plugin): up to 5 candidates.
  const cm = merged.agent.consultModels
  if (cm !== undefined && !Array.isArray(cm)) {
    throw new Error(`agent.consultModels must be an array of { provider, model } entries (got ${typeof cm})`)
  }
  if (Array.isArray(cm) && cm.length > 5) {
    throw new Error(`agent.consultModels supports at most 5 models (got ${cm.length})`)
  }
  if (Array.isArray(cm)) {
    // Fail fast at load: a pool entry whose provider doesn't exist in providers[] fails
    // every consult/escalate call at runtime with a quiet error string (eats a turn).
    const providerNames = merged.providers.map((p) => p.name)
    for (const entry of cm) {
      if (!entry || typeof entry !== "object" || typeof entry.provider !== "string" || typeof entry.model !== "string") {
        throw new Error(`agent.consultModels entries must be { provider: string, model: string } objects (got ${JSON.stringify(entry)})`)
      }
      if (!providerNames.includes(entry.provider)) {
        throw new Error(`agent.consultModels entry "${entry.provider}:${entry.model}" references unknown provider "${entry.provider}" (available: ${providerNames.join(", ") || "none"})`)
      }
    }
  }

  // Backward compatibility: promote root-level config fields to agent sub-object
  if (config.verifyGuard !== undefined) {
    merged.agent.verifyGuard = config.verifyGuard
  }

  // Normalize baseURL trailing slash (prevents //chat/completions)
  for (const p of merged.providers) {
    if (p.baseURL) p.baseURL = p.baseURL.replace(/\/+$/, "")
  }

  // Normalize proxy: string → { uri, web:true, model:false }; object 补默认值；非法类型丢弃。
  // 保证 agent.config.proxy 永远是规范形态或 undefined
  merged.proxy = normalizeProxy(merged.proxy)

  // Get the currently active provider
  const active = findProvider(merged.providers, merged.activeProvider)

  // Build runtime provider object (for agent.provider usage)
  const runtimeProvider = { ...active }

  // activeModel overrides provider's default model (config only)
  if (merged.activeModel) runtimeProvider.model = merged.activeModel
  merged.activeModel = merged.activeModel || null  // normalize for agent.activeModel

  // Compaction threshold follows the model
  const explicitThreshold = config.agent?.compactThreshold
  const { value, auto } = resolveCompactThreshold(explicitThreshold, runtimeProvider.model)
  merged.agent.compactThreshold = value
  merged.agent.compactThresholdAuto = auto

  // Write back to merged for convenient access by upper layers
  merged.provider = runtimeProvider
  merged.providersList = merged.providers
  merged.advisor = { ...merged.agent.advisor }  // promote for consistent access (decoupled copy)

  return merged
}

/**
 * Save configuration. Preserves providers list structure and activeProvider pointer.
 * providers[i].apiKey is only written when explicitly passed in (does not overwrite env-var-fallback keys).
 */
export function saveConfig(config) {
  mkdirSync(configDir, { recursive: true })
  // 0600: config.json contains API keys, must not be world-readable (POSIX; chmod is best-effort on Windows)
  writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n", { encoding: "utf8", mode: 0o600 })
  try { chmodSync(configPath, 0o600) } catch { /* may fail on Windows, ignore */ }
}
