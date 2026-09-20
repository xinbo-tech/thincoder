/**
 * config-presets.mjs — provider preset table + entry builder（核内单一预设面）。
 *
 * 来源（#129 融合：自 CLI / VSC 两张逐条同值的预设表取一侧）：
 *  - `PROVIDER_PRESETS` = 取 CLI 侧为单一权威（VSC 侧现经由
 *    `@thincoder/core/config.mjs` 取用，无独立镜像档；本档 = 两表
 *    融合后的唯一定义处）。
 *  - `presetToEntry` = 取 VSC 侧独有导出（CLI 侧对应实现在
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
  volcengine: { baseURL: "https://ark.cn-beijing.volces.com/api/v3", model: "doubao-seed-2-0-code-preview-260215", maxTokens: 131072, desc: "Volcengine Ark (豆包)" },
  hunyuan:  { baseURL: "https://api.hunyuan.cloud.tencent.com/v1", model: "hunyuan-pro", maxTokens: 32768, desc: "Hunyuan (腾讯混元)" },
  // TokenHub = Tencent MaaS 聚合网关（另一主机；`hy3` 在本规格表有行）。`thinking` / `reasoningEffort` /
  // `maxTokens` 一律**不设 = 不发**（两新渠道的 thinking 载荷与 max_tokens 行为未测 —— MODEL-SPECS §9.6 D-13）。
  tokenhub: { baseURL: "https://tokenhub.tencentmaas.com/v1", model: "hy3", desc: "Tencent TokenHub (腾讯混元网关)" },
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
