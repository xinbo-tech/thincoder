/**
 * presets.mjs — provider 预设表与展开（ops/OPS.md §1「预设形」∥ KD-SV-17）：server 自持静态表（起步 20 家）——
 * 每键只载 `{ baseURL, model }`；`expandProviderEntry` 把预设形条目展开为手写形同形 `{name, baseURL, apiKey, models}`。
 *
 * 快照口径（KD-SV-17）：表 = `thincoder-core/config-presets.mjs` 的 OpenAI 兼容子集（快照日 2026-10-06——
 * 排除 `format`/`chatPath` 面）；核表更新后由后续版本手工同步（表 ∥ ops/OPS.md 名单行 ∥ 批内漂移件三处同改）；
 * 运行时 import 核表 = 禁（KD-SV-2）——本档零 import 面。
 */

/** 内建 provider 预设（20 家）：值 = 核表 OpenAI 兼容子集抄录（`baseURL` = OpenAI 兼容根；`model` = 默认模型）。 */
export const SERVER_PRESETS = {
  deepseek:    { baseURL: "https://api.deepseek.com", model: "deepseek-flash" },
  kimi:        { baseURL: "https://api.moonshot.cn/v1", model: "kimi-k3" },
  "kimi-code": { baseURL: "https://api.kimi.com/coding/v1", model: "k3" },
  glm:         { baseURL: "https://open.bigmodel.cn/api/paas/v4", model: "glm-5.2" },
  "glm-code":  { baseURL: "https://open.bigmodel.cn/api/coding/paas/v4", model: "glm-5.2" },
  qwen:        { baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1", model: "qwen3.7-max" },
  qwenplan:    { baseURL: "https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1", model: "qwen3.7-max" },
  mimo:        { baseURL: "https://api.xiaomimimo.com/v1", model: "mimo-v2.6-pro" },
  mimoplan:    { baseURL: "https://token-plan-cn.xiaomimimo.com/v1", model: "mimo-v2.6-pro" },
  openai:      { baseURL: "https://api.openai.com/v1", model: "gpt-4o" },
  grok:        { baseURL: "https://api.x.ai/v1", model: "grok-4.5" },
  mistral:     { baseURL: "https://api.mistral.ai/v1", model: "mistral-large" },
  volcengine:  { baseURL: "https://ark.cn-beijing.volces.com/api/v3", model: "doubao-seed-2-0-code-preview-260215" },
  hunyuan:     { baseURL: "https://api.hunyuan.cloud.tencent.com/v1", model: "hunyuan-pro" },
  tokenhub:    { baseURL: "https://tokenhub.tencentmaas.com/v1", model: "hy3" },
  huawei:      { baseURL: "https://api.modelarts-maas.com/openai/v1", model: "glm-5.3" },
  siliconflow: { baseURL: "https://api.siliconflow.cn/v1", model: "deepseek-ai/DeepSeek-V3" },
  openrouter:  { baseURL: "https://openrouter.ai/api/v1", model: "anthropic/claude-sonnet-4" },
  groq:        { baseURL: "https://api.groq.com/openai/v1", model: "llama-3.3-70b-versatile" },
  "opencode-go": { baseURL: "https://opencode.ai/zen/go/v1", model: "glm-5.2" },
}

/** 预设形条目展开（ops/OPS.md §1）：`name` 缺省 = 预设名 ∥ `baseURL`/`models` 缺省取预设值（`models` = `[model]`）∥
 *  条目自带者**覆盖**预设值（显式在场者胜——展开面不静默修正；值校验归 config.mjs 既有判据）∥ `apiKey` 只住条目（预设表零密钥）。
 *  非预设形（无 `preset` 字段）原样放行；未知预设名 ⇒ 抛（报错列可用名——fail-closed）。 */
export function expandProviderEntry(entry, where = "providers[i]") {
  if (entry === null || typeof entry !== "object" || Array.isArray(entry)) return entry // 形判归校验面
  if (entry.preset === undefined) return entry
  if (!Object.hasOwn(SERVER_PRESETS, entry.preset)) {
    throw new Error(`未知预设名：${JSON.stringify(entry.preset)}（${where}.preset——可用预设：${Object.keys(SERVER_PRESETS).join(" ∥ ")}；拒启）`)
  }
  const preset = SERVER_PRESETS[entry.preset]
  return {
    name: entry.name !== undefined ? entry.name : entry.preset,
    baseURL: entry.baseURL !== undefined ? entry.baseURL : preset.baseURL,
    apiKey: entry.apiKey,
    models: entry.models !== undefined ? entry.models : [preset.model],
  }
}
