/**
 * config-presets.mjs — provider preset table (mirrors CLI PROVIDER_PRESETS).
 * CLI (`thincoder/src/config.mjs`) is the authority — keep in sync.
 * Split out of config-io.mjs (500-line hard limit; zero dependencies by design).
 * MODEL-MERGE-SESSION：preset `model` 字段退役 → `models` 种子（[原 model]——渠道至少一候选——
 * 裁定⑦——CLI PROVIDER_PRESETS 镜像——双端逐条同值）。
 */

export const PROVIDER_PRESETS = {
  deepseek: { baseURL: "https://api.deepseek.com", models: ["deepseek-v4-pro"], thinking: { type: "enabled" }, reasoningEffort: "max", maxTokens: 393216, desc: "DeepSeek" },
  kimi:     { baseURL: "https://api.moonshot.cn/v1", models: ["kimi-k3"], thinking: null, reasoningEffort: "max", maxTokens: 131072, desc: "Kimi / Moonshot" },
  "kimi-code": { baseURL: "https://api.kimi.com/coding/v1", models: ["k3"], thinking: null, reasoningEffort: "max", maxTokens: 131072, desc: "Kimi For Coding (platform.kimi.com — sk-kimi- keys; NOT interchangeable with Moonshot)" },
  glm:      { baseURL: "https://open.bigmodel.cn/api/paas/v4", models: ["glm-5.2"], thinking: { type: "enabled" }, reasoningEffort: "max", maxTokens: 128000, desc: "Zhipu GLM" },
  "glm-code": { baseURL: "https://open.bigmodel.cn/api/coding/paas/v4", models: ["glm-5.2"], thinking: { type: "enabled" }, reasoningEffort: "max", maxTokens: 128000, desc: "Zhipu GLM Coding Plan (coding endpoint — same key as GLM; server-forced thinking)" },
  qwen:     { baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1", models: ["qwen3.7-max"], reasoningEffort: "high", maxTokens: 131072, desc: "Qwen / Alibaba" },
  qwenplan: { baseURL: "https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1", models: ["qwen3.7-max"], reasoningEffort: "high", maxTokens: 131072, desc: "Qwen Token Plan (百炼套餐)" },
  mimo:     { baseURL: "https://api.xiaomimimo.com/v1", models: ["mimo-v2.5-pro"], thinking: { type: "enabled" }, maxTokens: 131072, desc: "MiMo (Xiaomi)" },
  mimoplan: { baseURL: "https://token-plan-cn.xiaomimimo.com/v1", models: ["mimo-v2.5-pro"], thinking: { type: "enabled" }, maxTokens: 131072, desc: "MiMo Token Plan (小米套餐 — tp- keys; 与按量付费 sk- 密钥不通用)" },
  minimax:  { baseURL: "https://api.minimaxi.com/v1", models: ["MiniMax-M3"], thinking: { type: "adaptive" }, maxTokens: 128000, chatPath: "/text/chatcompletion_v2", desc: "MiniMax" },
  openai:   { baseURL: "https://api.openai.com/v1", models: ["gpt-4o"], desc: "OpenAI" },
  claude:   { baseURL: "https://api.anthropic.com/v1", models: ["claude-sonnet-4"], format: "anthropic", maxTokens: 8192, desc: "Claude (Anthropic)" },
  gemini:   { baseURL: "https://generativelanguage.googleapis.com/v1beta", models: ["gemini-2.5-flash"], format: "google", maxTokens: 8192, desc: "Gemini (Google)" },
  grok:     { baseURL: "https://api.x.ai/v1", models: ["grok-4.5"], maxTokens: 65536, desc: "Grok (xAI)" },
  mistral:  { baseURL: "https://api.mistral.ai/v1", models: ["mistral-large"], maxTokens: 32768, desc: "Mistral" },
  volcengine: { baseURL: "https://ark.cn-beijing.volces.com/api/v3", models: ["doubao-pro-32k"], maxTokens: 32768, desc: "Volcengine Ark (豆包)" },
  hunyuan:  { baseURL: "https://api.hunyuan.cloud.tencent.com/v1", models: ["hunyuan-pro"], maxTokens: 32768, desc: "Hunyuan (腾讯混元)" },
  siliconflow: { baseURL: "https://api.siliconflow.cn/v1", models: ["deepseek-ai/DeepSeek-V3"], maxTokens: 32768, desc: "SiliconFlow (硅基流动)" },
  openrouter: { baseURL: "https://openrouter.ai/api/v1", models: ["anthropic/claude-sonnet-4"], maxTokens: 32768, desc: "OpenRouter" },
  groq:     { baseURL: "https://api.groq.com/openai/v1", models: ["llama-3.3-70b-versatile"], maxTokens: 32768, desc: "Groq" },
}

/** Build the stored provider entry from a preset — CLI addProviderFlow: strip the display
 *  field, keep the rest. MODEL-MERGE-SESSION：渠道 model 字段退役——只落 models 种子
 *  （preset.models——绝不再写 model 老字段——防迁移反复触发）。 */
export function presetToEntry(name) {
  const preset = PROVIDER_PRESETS[name]
  if (!preset) return null
  const { desc: _, ...entry } = preset
  return { name, ...entry }
}
