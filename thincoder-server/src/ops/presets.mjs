/**
 * presets.mjs — provider 预设表与展开（ops/OPS.md §1「预设形」∥ KD-SV-17）：server 自持静态表（起步 21 家）——
 * 每键只载 `{ baseURL }`（单值 `model` 退场——2026-10-09 清除批：预设只免写 baseURL，模型面走「模型发现」勾选）；
 * `expandProviderEntry` 把预设形条目展开为手写形同形 `{name, baseURL, apiKey, models}`。
 *
 * 快照口径（KD-SV-17）：表 = `thincoder-core/config-presets.mjs` 的 OpenAI 兼容子集（快照日 2026-10-06——
 * 排除 `format`/`chatPath` 面；2026-10-09 本批同步 + `gemini-openai`）；核表更新后由后续版本手工同步（表 ∥ ops/OPS.md 名单行 ∥ 批内漂移件三处同改）；
 * 运行时 import 核表 = 禁（KD-SV-2）——本档零 import 面。
 */

/** 内建 provider 预设（21 家）：值 = 核表 OpenAI 兼容子集抄录（`baseURL` = OpenAI 兼容根；零 `model` 键——2026-10-09 清除批）。 */
export const SERVER_PRESETS = {
  deepseek:    { baseURL: "https://api.deepseek.com" },
  kimi:        { baseURL: "https://api.moonshot.cn/v1" },
  "kimi-code": { baseURL: "https://api.kimi.com/coding/v1" },
  glm:         { baseURL: "https://open.bigmodel.cn/api/paas/v4" },
  "glm-code":  { baseURL: "https://open.bigmodel.cn/api/coding/paas/v4" },
  qwen:        { baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1" },
  qwenplan:    { baseURL: "https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1" },
  mimo:        { baseURL: "https://api.xiaomimimo.com/v1" },
  mimoplan:    { baseURL: "https://token-plan-cn.xiaomimimo.com/v1" },
  openai:      { baseURL: "https://api.openai.com/v1" },
  "gemini-openai": { baseURL: "https://generativelanguage.googleapis.com/v1beta/openai" },
  grok:        { baseURL: "https://api.x.ai/v1" },
  mistral:     { baseURL: "https://api.mistral.ai/v1" },
  volcengine:  { baseURL: "https://ark.cn-beijing.volces.com/api/v3" },
  hunyuan:     { baseURL: "https://api.hunyuan.cloud.tencent.com/v1" },
  tokenhub:    { baseURL: "https://tokenhub.tencentmaas.com/v1" },
  huawei:      { baseURL: "https://api.modelarts-maas.com/openai/v1" },
  siliconflow: { baseURL: "https://api.siliconflow.cn/v1" },
  openrouter:  { baseURL: "https://openrouter.ai/api/v1" },
  groq:        { baseURL: "https://api.groq.com/openai/v1" },
  "opencode-go": { baseURL: "https://opencode.ai/zen/go/v1" },
}

/** 预设形条目展开（ops/OPS.md §1）：`name` 缺省 = 预设名 ∥ `baseURL` 缺省取预设值（`models` 零缺省——条目未自备 ⇒ 空清单，
 *  经「模型发现」面勾选后写入——2026-10-09 清除批）∥ 条目自带者**覆盖**预设值（显式在场者胜——展开面不静默修正；
 *  值校验归 config.mjs 既有判据）；`apiKey` 只住条目（预设表零密钥）。非预设形原样放行；未知预设名 ⇒ 抛（报错列可用名——fail-closed）。 */
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
    models: entry.models !== undefined ? entry.models : [],
  }
}
