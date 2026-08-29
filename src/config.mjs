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

/**
 * Known model capability spec table (prefix match, longer first).
 * Used for compaction threshold derivation, continuation protocol selection, and capability-aware optimization.
 *
 * context:           context window (tokens)
 * maxOutput:         max output tokens (defaults to context)
 * thinking:          whether thinking/reasoning mode is supported
 * partialMode:       Kimi/Qwen Partial Mode truncation continuation (assistant message with partial:true)
 * prefixMode:        DeepSeek Prefix Completion truncation continuation (uses /beta endpoint, with prefix:true)
 * multimodal:        whether multimodal (image/vision input supported)
 * cacheMode:         context caching mode: "auto"=automatic / "prompt"=needs explicit / "none"=unsupported
 * thinkApi:          thinking API type: "type"=thinking.type field / "effort"=reasoning_effort field
 * thinkEnabledValue: when thinkApi is "type", the value used to enable thinking (default "enabled"; MiniMax uses "adaptive")
 * reasoningEcho:     reasoning_content cross-turn echo strategy: "required"=must echo (error if missing) / "optional"=echo optional (default: don't echo)
 * reasoningEffortEnum: valid reasoning_effort enum values (if undeclared, no validation — passed through as-is)
 * tempRange:         valid temperature range [min, max] (if undeclared, no clamping)
 */
const MODEL_SPECS = [
  // DeepSeek V4 series
  ["deepseek-v4-pro",   { context: 1_000_000, maxOutput: 384_000, thinking: true,  prefixMode: true,  cacheMode: "auto", thinkApi: "type", reasoningEcho: "required", reasoningEffortEnum: ["low", "high", "max"], tempRange: [0, 2] }],
  ["deepseek-v4-flash", { context: 1_000_000, maxOutput: 384_000, thinking: true,  prefixMode: true,  cacheMode: "auto", thinkApi: "type", reasoningEcho: "required", reasoningEffortEnum: ["low", "high", "max"], tempRange: [0, 2] }],
  // DeepSeek V4 Flash Vision (experimental) — image input on top of the full V4-Flash stack
  ["deepseek-v4-flash-vision-exp", { context: 1_000_000, maxOutput: 384_000, thinking: true,  prefixMode: true,  cacheMode: "auto", thinkApi: "type", reasoningEcho: "required", reasoningEffortEnum: ["low", "high", "max"], tempRange: [0, 2], multimodal: true }],
  // Kimi series
  ["kimi-k3",           { context: 1_000_000, maxOutput: 131_072, thinking: true,  partialMode: true, multimodal: true, cacheMode: "auto",  thinkApi: "effort", reasoningEcho: "required", reasoningEffortEnum: ["low", "high", "max"] }],
  // Qwen router prefixes model IDs with provider namespace: kimi/kimi-k3 → kimi-k3 (IK7K4V)
  ["kimi/kimi-k3",      { context: 1_000_000, maxOutput: 131_072, thinking: true,  partialMode: true, multimodal: true, cacheMode: "auto",  thinkApi: "effort", reasoningEcho: "required", reasoningEffortEnum: ["low", "high", "max"] }],
  // Kimi For Coding endpoint uses the short model ID "k3" (same specs as kimi-k3) — IK5VGJ
  ["k3",                { context: 1_000_000, maxOutput: 131_072, thinking: true,  partialMode: true, multimodal: true, cacheMode: "auto",  thinkApi: "effort", reasoningEcho: "required", reasoningEffortEnum: ["low", "high", "max"] }],
  // GLM series
  // GLM-5.3: thinking always-on (no "disabled"); effort converges to low/high/max — NOT the
  //          7-level glm-5.2 enum (verified vs docs.bigmodel.cn GLM-5.3 page, 2026-08)
  ["glm-5.3",           { context: 1_000_000, maxOutput: 128_000, thinking: true,  cacheMode: "auto", thinkApi: "type", reasoningEcho: "optional", reasoningEffortEnum: ["low", "high", "max"], tempRange: [0, 1], noUsageStream: true }],
  ["glm-5.3-flash",     { context: 1_000_000, maxOutput: 128_000, thinking: true, multimodal: true, cacheMode: "auto", thinkApi: "type", reasoningEcho: "optional", reasoningEffortEnum: ["low", "high", "max"], tempRange: [0, 1], noUsageStream: true }],
  ["glm-5.2",           { context: 1_000_000, maxOutput: 128_000, thinking: true,  cacheMode: "auto", thinkApi: "type", reasoningEcho: "optional", reasoningEffortEnum: ["max", "xhigh", "high", "medium", "low", "minimal", "none"], tempRange: [0, 1], noUsageStream: true }],
  ["glm-5",             { context: 1_000_000, maxOutput: 128_000, thinking: true,  cacheMode: "auto", thinkApi: "type", reasoningEcho: "optional", reasoningEffortEnum: ["max", "xhigh", "high", "medium", "low", "minimal", "none"], tempRange: [0, 1], noUsageStream: true }],
  ["glm-4",             { context: 128_000,   maxOutput: 32_000,  thinking: true,  cacheMode: "auto", thinkApi: "type", reasoningEcho: "optional", tempRange: [0, 1], noUsageStream: true }],
  // GPT series
  ["gpt-5.6-sol",       { context: 1_050_000, maxOutput: 128_000, thinking: false, multimodal: true, cacheMode: "prompt" }],
  ["gpt-5.6",           { context: 1_050_000, maxOutput: 128_000, thinking: false, multimodal: true, cacheMode: "prompt" }],
  ["gpt-4.1",           { context: 1_000_000, maxOutput: 128_000, thinking: false, cacheMode: "prompt" }],
  ["gpt-4o",            { context: 128_000,   maxOutput: 16_000,  thinking: false, multimodal: true, cacheMode: "prompt" }],
  // Qwen series
  ["qwen3.8-max-preview", { context: 1_000_000, maxOutput: 131_072, thinking: true, partialMode: true, multimodal: true, cacheMode: "none", thinkApi: "effort", reasoningEffortEnum: ["xhigh", "medium", "low"], tempRange: [0, 2] }],
  // qwen3.7-max rejects image parts outright (DashScope 400 "Unexpected item type in content") — text-only
  ["qwen3.7-max",       { context: 1_000_000, maxOutput: 131_072, thinking: true, partialMode: true, cacheMode: "none", thinkApi: "effort", reasoningEffortEnum: ["xhigh", "high"], tempRange: [0, 2] }],
  ["qwen3.8-max",       { context: 1_000_000, maxOutput: 131_072, thinking: true, partialMode: true, multimodal: true, cacheMode: "none", thinkApi: "effort", reasoningEffortEnum: ["xhigh", "medium", "low"], tempRange: [0, 2] }],
  ["qwen-max",          { context: 1_000_000, maxOutput: 131_072, thinking: false, partialMode: true, multimodal: true, cacheMode: "none", thinkApi: "effort", tempRange: [0, 2] }],
  ["qwen-plus",         { context: 1_000_000, maxOutput: 131_072,  thinking: false, partialMode: true, multimodal: true, cacheMode: "none", thinkApi: "effort", tempRange: [0, 2] }],
  ["qwen",              { context: 1_000_000, maxOutput: 131_072, thinking: false, partialMode: true, multimodal: true, cacheMode: "none", thinkApi: "effort", tempRange: [0, 2] }],
  // MiniMax series
  ["MiniMax-M3",        { context: 1_000_000, maxOutput: 128_000, thinking: true,  multimodal: true, cacheMode: "auto", thinkApi: "type", thinkEnabledValue: "adaptive", tempRange: [0, 2], noUsageStream: true }],
  // MiMo series (Xiaomi — OpenAI-compatible https://api.xiaomimimo.com/v1;
  // deep thinking via thinking.type, default ON; multi-turn tool calls MUST echo
  // reasoning_content back exactly like DeepSeek V4, else 400 on follow-ups)
  ["mimo-v2.5-pro",     { context: 1_000_000, maxOutput: 128_000, thinking: true,  thinkApi: "type", reasoningEcho: "required", tempRange: [0, 1.5] }],
  ["mimo-v2.5",         { context: 1_000_000, maxOutput: 128_000, thinking: true,  multimodal: true, thinkApi: "type", reasoningEcho: "required", tempRange: [0, 1.5] }],
  ["minimax-m3",        { context: 1_000_000, maxOutput: 128_000, thinking: true,  multimodal: true, cacheMode: "auto", thinkApi: "type", thinkEnabledValue: "adaptive", tempRange: [0, 2], noUsageStream: true }],
  ["minimax-m1",        { context: 256_000,   maxOutput: 128_000, thinking: false, cacheMode: "auto", noUsageStream: true }],
  // Grok series (xAI — OpenAI-compatible)
  // grok-4.x: 500K context per xAI Grok 4.6 spec (corrected 2026-08; earlier entries said 1M)
  ["grok-4.6",          { context: 500_000,   maxOutput: 64_000,  thinking: false, multimodal: true, tempRange: [0, 2] }],
  ["grok-4.5",          { context: 500_000,   maxOutput: 64_000,  thinking: false, multimodal: true, tempRange: [0, 2] }],
  ["grok-4",            { context: 500_000,   maxOutput: 64_000,  thinking: false, multimodal: true, tempRange: [0, 2] }],
  ["grok-4-mini",       { context: 128_000,   maxOutput: 16_000,  thinking: false, tempRange: [0, 2] }],
  // Mistral series (OpenAI-compatible)
  ["mistral-large",     { context: 128_000,   maxOutput: 32_000,  thinking: false, multimodal: true, tempRange: [0, 2] }],
  ["codestral",         { context: 256_000,   maxOutput: 32_000,  thinking: false, tempRange: [0, 2] }],
  // Claude series (Anthropic)
  ["claude-opus-5",     { context: 1_000_000, maxOutput: 128_000, thinking: false, multimodal: true, cacheMode: "none", format: "anthropic" }],
  ["claude-sonnet-5",   { context: 1_000_000, maxOutput: 128_000, thinking: false, multimodal: true, cacheMode: "none", format: "anthropic" }],
  ["claude-opus-4",     { context: 200_000,   maxOutput: 32_000,  thinking: false, multimodal: true, cacheMode: "none", format: "anthropic" }],
  ["claude-sonnet-4",   { context: 200_000,   maxOutput: 32_000,  thinking: false, multimodal: true, cacheMode: "none", format: "anthropic" }],
  ["claude-3.5-haiku",  { context: 200_000,   maxOutput: 8_192,   thinking: false, cacheMode: "none", format: "anthropic" }],
  // Gemini series (Google)
  ["gemini-3-pro",      { context: 1_000_000, maxOutput: 64_000,  thinking: false, multimodal: true, cacheMode: "none", format: "google", noUsageStream: true }],
  ["gemini-2.5-pro",    { context: 2_000_000, maxOutput: 64_000,  thinking: false, multimodal: true, cacheMode: "none", format: "google", noUsageStream: true }],
  ["gemini-2.5-flash",  { context: 1_000_000, maxOutput: 64_000,  thinking: false, multimodal: true, cacheMode: "none", format: "google", noUsageStream: true }],
]
const DEFAULT_SPEC = { context: 128_000, maxOutput: 32_000, cacheMode: "none" }
// Window utilization threshold: compacts at 60% context, reserving 40% headroom
// for injected context (directory tree, git context, outline, project instructions,
// memory/doc search results) which can consume 30-50K tokens each turn.
const COMPACT_RATIO = 0.6

/** Look up spec by model name prefix (case-insensitive), conservative default for unknown models */
const warnedModels = new Set() // warn once per model name — specForModel is a hot path (every request)
// Pre-sorted once at module scope — specForModel runs on every request (agent, provider core,
// context, auto-think, TUI rendering); re-sorting per call was wasteful.
const SORTED_SPECS = [...MODEL_SPECS].sort((a, b) => b[0].length - a[0].length)
export function specForModel(model) {
  const m = (model ?? "").toLowerCase()
  for (const [prefix, spec] of SORTED_SPECS) {
    if (m.startsWith(prefix.toLowerCase())) return spec
  }
  // Unknown model: warn ONCE (not per request) so a typo'd ID or a missing alias surfaces
  // instead of silently degrading to the 128K default (IK5VGJ).
  if (m && !warnedModels.has(m)) {
    warnedModels.add(m)
    console.warn(`[config] model "${model}" not found in MODEL_SPECS — using default spec (128K context, 32K output). Check the model ID or add an alias.`)
  }
  return DEFAULT_SPEC
}

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
  // Inject $schema for editor autocompletion/validation (strip on load) — write a copy,
  // never mutate the caller's object.
  const out = { ...config, $schema: "https://thincoder.dev/schemas/config.json" }
  // 0600: config.json contains API keys, must not be world-readable (POSIX; chmod is best-effort on Windows)
  writeFileSync(configPath, JSON.stringify(out, null, 2) + "\n", { encoding: "utf8", mode: 0o600 })
  try { chmodSync(configPath, 0o600) } catch { /* may fail on Windows, ignore */ }
}
