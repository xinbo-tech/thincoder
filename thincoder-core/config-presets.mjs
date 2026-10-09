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
 * 预先声明（2026-10-09 清除批：渠道单值 `model` 退场——PROVIDER.md §6.16 M3）：预置**不携带**
 * 默认模型（新装种子 = 零播种）；模型身份唯二 = 顶层 `defaultModel` 复合串 ∥ 会话槽选定；
 * 候选清单字段亦不预置——运行期从 provider 拉取（`GET /models`）。
 */

/** Built-in provider presets: shared by /provider add <preset> and first-run wizard. */
export const PROVIDER_PRESETS = {
  deepseek: { baseURL: "https://api.deepseek.com", thinking: { type: "enabled" }, reasoningEffort: "max", maxTokens: 384_000, desc: "DeepSeek" },
  kimi:     { baseURL: "https://api.moonshot.cn/v1", thinking: null, reasoningEffort: "max", maxTokens: 131072, desc: "Kimi / Moonshot" },
  "kimi-code": { baseURL: "https://api.kimi.com/coding/v1", thinking: null, reasoningEffort: "max", maxTokens: 131072, desc: "Kimi For Coding (platform.kimi.com — sk-kimi- keys; NOT interchangeable with Moonshot)" },
  glm:      { baseURL: "https://open.bigmodel.cn/api/paas/v4", thinking: { type: "enabled" }, reasoningEffort: "max", maxTokens: 128000, desc: "Zhipu GLM" },
  "glm-code": { baseURL: "https://open.bigmodel.cn/api/coding/paas/v4", thinking: { type: "enabled" }, reasoningEffort: "max", maxTokens: 128000, desc: "Zhipu GLM Coding Plan (coding endpoint — same key as GLM; server-forced thinking)" },
  qwen:     { baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1", reasoningEffort: "high", maxTokens: 131072, desc: "Qwen / Alibaba" },
  qwenplan: { baseURL: "https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1", reasoningEffort: "high", maxTokens: 131072, desc: "Qwen Token Plan (百炼套餐)" },
  mimo:     { baseURL: "https://api.xiaomimimo.com/v1", thinking: { type: "enabled" }, maxTokens: 131072, desc: "MiMo (Xiaomi)" },
  mimoplan: { baseURL: "https://token-plan-cn.xiaomimimo.com/v1", thinking: { type: "enabled" }, maxTokens: 131072, desc: "MiMo Token Plan (小米套餐 — tp- keys; 与按量付费 sk- 密钥不通用)" },
  minimax:  { baseURL: "https://api.minimaxi.com/v1", thinking: { type: "adaptive" }, maxTokens: 128000, chatPath: "/text/chatcompletion_v2", desc: "MiniMax" },
  openai:   { baseURL: "https://api.openai.com/v1", desc: "OpenAI" },
  claude:   { baseURL: "https://api.anthropic.com/v1", format: "anthropic", maxTokens: 8192, desc: "Claude (Anthropic)" },
  gemini:   { baseURL: "https://generativelanguage.googleapis.com/v1beta", format: "google", maxTokens: 8192, desc: "Gemini (Google)" },
  // Gemini OpenAI 兼容端点（Google 官方——2026-10-09 server 预设批 · 台账 #1128）：与 `gemini`（原生
  // `format:"google"`）同 key、两形态并存——本键 = OpenAI `/chat/completions` 侧（PROVIDER.md §6.11）。
  // **待验（无 key——未实拉 `/models`；接入后按实拉复核）**；`thinking` / `reasoningEffort` / `maxTokens` 不设 = 不发（载荷面未测——D-13）。
  "gemini-openai": { baseURL: "https://generativelanguage.googleapis.com/v1beta/openai", desc: "Gemini (Google) — OpenAI-compatible side (same key as gemini)" },
  grok:     { baseURL: "https://api.x.ai/v1", maxTokens: 64_000, desc: "Grok (xAI)" },
  mistral:  { baseURL: "https://api.mistral.ai/v1", maxTokens: 32_000, desc: "Mistral" },
  volcengine: { baseURL: "https://ark.cn-beijing.volces.com/api/v3", maxTokens: 131072, desc: "Volcengine Ark (豆包)" },
  hunyuan:  { baseURL: "https://api.hunyuan.cloud.tencent.com/v1", maxTokens: 32_000, desc: "Hunyuan (腾讯混元)" },
  // TokenHub = Tencent MaaS 聚合网关（另一主机；`hy3` 在本规格表有行）。`thinking` / `reasoningEffort` /
  // `maxTokens` 一律**不设 = 不发**（两新渠道的 thinking 载荷与 max_tokens 行为未测 —— MODEL-SPECS §9.6 D-13）。
  tokenhub: { baseURL: "https://tokenhub.tencentmaas.com/v1", desc: "Tencent TokenHub (腾讯混元网关)" },
  // Huawei Cloud MaaS（ModelArts Studio）——OpenAI 兼容 `…/openai/v1`（区域端点变体走自定义渠道
  // 自助路径——PROVIDER.md §6.21）。**待验（无 key——未实拉 /models；接入后按实拉取值复核）**；
  // `thinking` / `reasoningEffort` / `maxTokens` 不设 = 不发（载荷面未测——D-13）。
  huawei: { baseURL: "https://api.modelarts-maas.com/openai/v1", desc: "Huawei Cloud ModelArts Studio (华为云 MaaS)" },
  siliconflow: { baseURL: "https://api.siliconflow.cn/v1", maxTokens: 32_000, desc: "SiliconFlow (硅基流动)" },
  openrouter: { baseURL: "https://openrouter.ai/api/v1", maxTokens: 32_000, desc: "OpenRouter" },
  groq:     { baseURL: "https://api.groq.com/openai/v1", maxTokens: 32_000, desc: "Groq" },
  // OpenCode Go 订阅网关（opencode.ai/zen 取 sk- key ∥ 无 OAuth）——官方档（go.mdx）双协议混装 ⇒ 拆双预设
  // （PROVIDER.md §6.11）：本键 = OpenAI 兼容 `/chat/completions` 侧；`opencode-go-anthropic` = Anthropic
  // `/messages` 侧（同 key——模型按侧选）。字段集 = 最小面：`thinking` / `reasoningEffort` 不设 = 不发
  // （D-13 同口径）；`maxTokens` 仅 anthropic 侧设 `65536`（该 transport `max_tokens` 必发——不设即落规格
  // 行值 131072，超渠道口径）。**待验（无 key——未实拉 `/models` ∕ 载荷未实测；接入后按实拉复核）**；
  // `x-opencode-session` 头 = 可选遥测——**不发**（亦不动 `providers[].headers` 面）。
  "opencode-go": { baseURL: "https://opencode.ai/zen/go/v1", desc: "OpenCode Go subscription (sk- key from opencode.ai/zen; OpenAI-compatible models — MiniMax/Qwen via opencode-go-anthropic)" },
  "opencode-go-anthropic": { baseURL: "https://opencode.ai/zen/go/v1", format: "anthropic", maxTokens: 65536, desc: "OpenCode Go — Anthropic Messages side (same sk- key as opencode-go; MiniMax/Qwen models)" },
}

/** Build the stored provider entry from a preset — strip the display field, keep the rest
 *  （2026-10-09 清除批：不产 `model` 键——渠道不携模型；候选清单不再由预设播种）。 */
export function presetToEntry(name) {
  const preset = PROVIDER_PRESETS[name]
  if (!preset) return null
  const { desc: _, ...entry } = preset
  return { name, ...entry }
}
