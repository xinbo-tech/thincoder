/**
 * model-specs.mjs — known model capability table + spec lookup (2026-08-31 extract).
 *
 * Split from config.mjs (which had grown to 358 lines, past the 300 advisory
 * line — TODO #1). config.mjs re-exports specForModel so the 23 existing
 * importers stay untouched. PROVIDER_PRESETS stays in config.mjs (only 23
 * lines; extracting it would churn wizard/pickers/setup-wizard for no gain).
 */

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

/**
 * providerSpec(provider) — spec with a provider-level context override (PROVIDER.md §15, 2026-09-02).
 *
 * providers[].context is configured in K units (128 = 128K = 131072 tokens) and overrides the
 * MODEL_SPECS value for THIS provider only — the same model can have different real context
 * windows on different endpoints (official vs local deployment). The ×1024 conversion happens
 * HERE and nowhere else.
 *
 * Returns a COPY ({ ...spec, context }) — the shared spec object from the SORTED_SPECS lookup
 * must never be mutated, or the override would leak across providers (T-C1).
 *
 * Validation is defensive (pure function): absent/invalid context falls back to the plain spec
 * (config.mjs loadConfig already warns + strips invalid values; this guard covers direct callers
 * and keeps the function total). specForModel stays a pure table lookup — callers without a
 * provider keep using it.
 */
export function providerSpec(provider) {
  const spec = specForModel(provider?.model ?? "")
  const k = Number(provider?.context) // Number() 接受数字字符串（"128"）——两端语义统一（code review #1）
  if (Number.isInteger(k) && k > 0) return { ...spec, context: k * 1024 }
  return spec
}
