/**
 * config-presets.mjs — provider preset table + entry builder（核内单一预设面）。
 *
 * 来源（§2.5 #129「融合：取一侧（逐条同值）」）：
 *  - `PROVIDER_PRESETS` = CLI `thincoder-cli/src/config.mjs` 的表（VSC
 *    `config-presets.mjs` 头注自述「mirrors CLI PROVIDER_PRESETS…双端逐条同值」⇒ 逐条同值，
 *    取 CLI 侧为单一权威）。
 *  - `presetToEntry` = VSC `config-presets.mjs` 的薄构造器（VSC 侧独有导出；CLI 侧对应实现在
 *    `cli/setup-wizard.mjs`，同字节语义）。
 *
 * 预先声明（MODEL-SELECTION v2，2026-09-10）：每个预设恰好携带一个默认模型（`model` ——
 * 新装启动种子 / 槽位空兜底；候选清单字段不再预置——运行期从 provider 拉取）。
 */

/** Built-in provider presets: shared by /provider add <preset> and first-run wizard. */
export const PROVIDER_PRESETS = {
  deepseek: { baseURL: "https://api.deepseek.com", model: "deepseek-flash", thinking: { type: "enabled" }, reasoningEffort: "max", maxTokens: 393216, desc: "DeepSeek" },
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

/** Build the stored provider entry from a preset — strip the display field, keep the rest
 *  （含单值 `model`——候选清单不再由预设播种）。 */
export function presetToEntry(name) {
  const preset = PROVIDER_PRESETS[name]
  if (!preset) return null
  const { desc: _, ...entry } = preset
  return { name, ...entry }
}
