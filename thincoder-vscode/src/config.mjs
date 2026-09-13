/**
 * config.mjs — Model capability specs (self-contained copy)
 * One source per spec row; `specForModel` matches by prefix (case-insensitive).
 *
 * Field reference:
 *   context:               context window size in tokens
 *   maxOutput:             max output tokens
 *   thinking:              model supports thinking mode (true/false)
 *   multimodal:            model supports image inputs
 *   prefixMode:            truncation protocol: uses prefix-based continuation
 *   partialMode:           truncation protocol: partially-available response
 *   cacheMode:             "auto" | "prompt" | "none"
 *   thinkApi:              "type"=thinking.type field | "effort"=reasoning_effort field
 *   thinkEnabledValue:     when thinkApi is "type", the value used to enable thinking (default "enabled"; MiniMax uses "adaptive")
 *   reasoningEcho:         "required"=must echo | "optional"=optional (default: don't echo)
 *   reasoningEffortEnum:   valid reasoning_effort values
 *   reasoningEffortDefault: default reasoning_effort value (preselected in model picker)
 *   tempRange:             [min, max] temperature range
 *   noUsageStream:         true = omit stream_options.include_usage (provider doesn't support usage streaming)
 *   format:                API wire format: "openai" (default) | "anthropic" | "google"
 */
const MODEL_SPECS = [
  // DeepSeek V4.1 series (2026-09-11). `deepseek-flash` = DeepSeek-V4.1-Flash (in service):
  // 1M ctx / 384K out, thinking default-on with effort low/high/max, Chat Prefix Completion
  // beta, automatic disk cache, vision. The two legacy names below are RETIRED — still accepted
  // and served by V4.1-Flash today (no switch window), so their rows carry the V4.1-Flash
  // parameters (v4-flash gains multimodal).
  ["deepseek-flash",    { context: 1_000_000, maxOutput: 384_000, thinking: true,  prefixMode: true,  cacheMode: "auto", thinkApi: "type", reasoningEcho: "required", reasoningEffortEnum: ["low", "high", "max"], reasoningEffortDefault: "high", tempRange: [0, 2], multimodal: true }],
  // deepseek-v4-pro (V4-Pro-0813): fields unchanged — vision capability NOT verified, so no
  // multimodal (conservative). From 2026-09-14 12:00 Beijing all requests route to V4.1-Flash.
  ["deepseek-v4-pro",   { context: 1_000_000, maxOutput: 384_000, thinking: true,  prefixMode: true,  cacheMode: "auto", thinkApi: "type", reasoningEcho: "required", reasoningEffortEnum: ["low", "high", "max"], reasoningEffortDefault: "high", tempRange: [0, 2] }],
  // deepseek-v4-flash: RETIRED name — still accepted, served by V4.1-Flash today → aligned row
  ["deepseek-v4-flash", { context: 1_000_000, maxOutput: 384_000, thinking: true,  prefixMode: true,  cacheMode: "auto", thinkApi: "type", reasoningEcho: "required", reasoningEffortEnum: ["low", "high", "max"], reasoningEffortDefault: "high", tempRange: [0, 2], multimodal: true }],
  // deepseek-v4-flash-vision-exp: retired experimental vision name — still accepted (V4.1-Flash)
  ["deepseek-v4-flash-vision-exp", { context: 1_000_000, maxOutput: 384_000, thinking: true,  prefixMode: true,  cacheMode: "auto", thinkApi: "type", reasoningEcho: "required", reasoningEffortEnum: ["low", "high", "max"], reasoningEffortDefault: "high", tempRange: [0, 2], multimodal: true }],
  // Kimi series
  ["kimi-k3",           { context: 1_000_000, maxOutput: 131_072, thinking: true,  partialMode: true, multimodal: true, cacheMode: "auto", thinkApi: "effort", reasoningEcho: "required", reasoningEffortEnum: ["low", "high", "max"], reasoningEffortDefault: "max" }],
  ["kimi/kimi-k3",      { context: 1_000_000, maxOutput: 131_072, thinking: true,  partialMode: true, multimodal: true, cacheMode: "auto", thinkApi: "effort", reasoningEcho: "required", reasoningEffortEnum: ["low", "high", "max"], reasoningEffortDefault: "max" }],
  // Kimi For Coding endpoint uses the short model ID "k3" (same specs as kimi-k3) — IK5VGJ
  ["k3",                { context: 1_000_000, maxOutput: 131_072, thinking: true,  partialMode: true, multimodal: true, cacheMode: "auto", thinkApi: "effort", reasoningEcho: "required", reasoningEffortEnum: ["low", "high", "max"], reasoningEffortDefault: "max" }],
  // GLM series
  // GLM-5.3: thinking always-on (no "disabled"); effort converges to low/high/max — NOT the
  //          7-level glm-5.2 enum (verified vs docs.bigmodel.cn GLM-5.3 page, 2026-08)
  ["glm-5.3",           { context: 1_000_000, maxOutput: 128_000, thinking: true,  cacheMode: "auto", thinkApi: "type", reasoningEcho: "optional", reasoningEffortEnum: ["low", "high", "max"], reasoningEffortDefault: "max", tempRange: [0, 1], noUsageStream: true }],
  ["glm-5.3-flash",     { context: 1_000_000, maxOutput: 128_000, thinking: true, multimodal: true, cacheMode: "auto", thinkApi: "type", reasoningEcho: "optional", reasoningEffortEnum: ["low", "high", "max"], reasoningEffortDefault: "max", tempRange: [0, 1], noUsageStream: true }],
  ["glm-5.2",           { context: 1_000_000, maxOutput: 128_000, thinking: true,  cacheMode: "auto", thinkApi: "type", reasoningEcho: "optional", reasoningEffortEnum: ["max", "xhigh", "high", "medium", "low", "minimal", "none"], reasoningEffortDefault: "max", tempRange: [0, 1], noUsageStream: true }],
  ["glm-5",             { context: 1_000_000, maxOutput: 128_000, thinking: true,  cacheMode: "auto", thinkApi: "type", reasoningEcho: "optional", reasoningEffortEnum: ["max", "xhigh", "high", "medium", "low", "minimal", "none"], reasoningEffortDefault: "max", tempRange: [0, 1], noUsageStream: true }],
  ["glm-4",             { context: 128_000,   maxOutput: 32_000,  thinking: true,  cacheMode: "auto", thinkApi: "type", reasoningEcho: "optional", tempRange: [0, 1], noUsageStream: true }],
  // GPT series
  ["gpt-5.6-sol",       { context: 1_050_000, maxOutput: 128_000, thinking: false, multimodal: true, cacheMode: "prompt" }],
  ["gpt-5.6",           { context: 1_050_000, maxOutput: 128_000, thinking: false, multimodal: true, cacheMode: "prompt" }],
  ["gpt-4.1",           { context: 1_000_000, maxOutput: 128_000, thinking: false, cacheMode: "prompt" }],
  ["gpt-4o",            { context: 128_000,   maxOutput: 16_000,  thinking: false, multimodal: true, cacheMode: "prompt" }],
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
  // Qwen series
  ["qwen3.8-max-preview", { context: 1_000_000, maxOutput: 131_072, thinking: true,  partialMode: true, multimodal: true, cacheMode: "none", thinkApi: "effort", reasoningEffortEnum: ["xhigh", "medium", "low"], reasoningEffortDefault: "xhigh", tempRange: [0, 2] }],
  // qwen3.7-max rejects image parts outright (DashScope 400 "Unexpected item type in content") — text-only.
  // CLI config.mjs marks it WITHOUT multimodal; keep in sync.
  ["qwen3.7-max",       { context: 1_000_000, maxOutput: 131_072, thinking: true,  partialMode: true, cacheMode: "none", thinkApi: "effort", reasoningEffortEnum: ["xhigh", "high"], tempRange: [0, 2] }],
  ["qwen3.8-max",       { context: 1_000_000, maxOutput: 131_072, thinking: true,  partialMode: true, multimodal: true, cacheMode: "none", thinkApi: "effort", reasoningEffortEnum: ["xhigh", "medium", "low"], reasoningEffortDefault: "xhigh", tempRange: [0, 2] }],
  ["qwen-max",          { context: 1_000_000, maxOutput: 131_072, thinking: false, partialMode: true, multimodal: true, cacheMode: "none", thinkApi: "effort", tempRange: [0, 2] }],
  ["qwen-plus",         { context: 1_000_000, maxOutput: 131_072, thinking: false, partialMode: true, multimodal: true, cacheMode: "none", thinkApi: "effort", tempRange: [0, 2] }],
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
]

const DEFAULT_SPEC = { context: 128_000, maxOutput: 32_000, cacheMode: "none" }

/** Warn once per unknown model name — specForModel is a hot path (every request). IK5VGJ */
const warnedModels = new Set()

/** Look up spec by model name prefix (case-insensitive), conservative default for unknown models.
 *
 * Vendor-namespace prefix stripping (2026-09-04)：第三方 token 市场（roapi/new-api/one-api/
 * aiproxy 聚合网关）惯例在模型名前加厂商前缀（zhipu/glm-5.3、openai/gpt-4o）。完整名未命中且含
 * "/" 时，剥掉第一个 "/" 前的 namespace 再按前缀匹配一次——ZHIPU/GLM-5.3 → glm-5.3 命中真实
 * 规格，不再降级 128K 默认。与 CLI src/model-specs.mjs 的查找语义对齐，但非逐行等价：本端
 * MODEL_SPECS 每行多一个 reasoningEffortDefault 字段（推理强度下拉的默认档——CLI 无此字段），
 * 且每次调用临时 .sort()（CLI 在模块级预排序 SORTED_SPECS——语义等价、调用更少）。改动规格两端需同步。 */
export function specForModel(model) {
  const m = (model ?? "").toLowerCase()
  for (const [prefix, spec] of [...MODEL_SPECS].sort((a, b) => b[0].length - a[0].length)) {
    if (m.startsWith(prefix.toLowerCase())) return spec
  }
  // Vendor-namespace strip: vendor/model — retry the prefix match on the bare model part.
  const slash = m.indexOf("/")
  if (slash > 0) {
    const bare = m.slice(slash + 1)
    for (const [prefix, spec] of [...MODEL_SPECS].sort((a, b) => b[0].length - a[0].length)) {
      if (bare.startsWith(prefix.toLowerCase())) return spec
    }
  }
  // Unknown model: warn ONCE (not per request) so a typo'd ID or a missing alias surfaces
  // instead of silently degrading to the 128K default (IK5VGJ).
  if (m && !warnedModels.has(m)) {
    warnedModels.add(m)
    console.warn(`[config] model "${model}" not found in MODEL_SPECS — using default spec (128K context, 32K output). Check the model ID or add an alias.`)
  }
  return DEFAULT_SPEC
}

/** Return the context window size for a given model name */
export function contextWindowForModel(model) {
  return specForModel(model).context
}

/**
 * Provider-aware spec (PROVIDER.md §15 D-C2): `providers[].context` (K units —
 * 128 = 128K) overrides the MODEL_SPECS context for that provider. Copy-override
 * ({ ...spec, context }) — the shared spec object is never mutated, so different
 * providers can't leak values into each other. Invalid values (0/negative/non-
 * integer) are ignored defensively here; the disk-level validation in
 * config-io.mjs resolveProviders warns once per provider (D-C1).
 * specForModel stays pure — model-level lookups are untouched.
 */
export function providerSpec(provider) {
  const spec = specForModel(provider?.model)
  const c = provider?.context
  if (c == null) return spec
  const n = Number(c)
  if (!Number.isInteger(n) || n <= 0) return spec
  return { ...spec, context: n * 1024 }
}

/**
 * Context utilization percentage: provider-reported prompt tokens vs the provider-aware
 * context window (specForModel context, overridden by providers[].context — PROVIDER.md §15).
 * Null when there is no token data. (The spec field is `context` — a `contextWindow`
 * read would silently fall back to 128K and show absurd percentages on 1M-context models.)
 */
export function ctxPercentForModel(promptTokens, provider) {
  if (!promptTokens) return null
  return Math.round((promptTokens / providerSpec(provider).context) * 100)
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
 * a forward-compatible fallback). Keep the body byte-aligned with thincoder CLI config.mjs
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
