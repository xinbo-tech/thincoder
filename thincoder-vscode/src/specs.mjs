/**
 * specs.mjs — VSC 端模型规格面（W16 接线：数据源 = 核单一规格表）。
 *
 * 单一来源 = `@thincoder/core/model-specs.mjs`（MODEL_SPECS 表 + 前缀查找 + provider 级
 * context 覆盖），本档只保**端差面**（CORE-UNIFICATION §2.13.4 #143 裁定「端侧自有 ·
 * 非缺位」）：
 *  - `reasoningEffortDefault`（推理强度下拉默认档——CLI 规格行无此字段，端侧扩展；
 *    旧 `src/config.mjs` 规格表随 W16 删旧，该字段的数据面迁入本档覆盖表）；
 *  - `ctxPercentForModel`（面板上下文占比派生——面板消费面，随 config 面收拢入驻）。
 */
import { specForModel as coreSpecForModel, providerSpec } from "@thincoder/core/model-specs.mjs"

export { providerSpec }

/** 端差字段表（`reasoningEffortDefault`）：前缀匹配、最长优先；未命中且 ID 含 `vendor/` 命名空间
 *  时按裸模型段重试（与核 `lookupSpec` 命名空间剥离同法——聚合网关惯例 `vendor/model`）；仍未命中 → undefined
 *  （webview 侧取枚举**首项**兑底——`webview/settings-state.js:48`）。行为 = 旧 VSC 规格表逐行同值。 */
const EFFORT_DEFAULT_PREFIXES = [
  ["deepseek-v4-flash-vision-exp", "high"],
  ["deepseek-v4-flash", "high"],
  ["deepseek-flash", "high"],
  ["deepseek-v4-pro", "high"],
  ["kimi", "max"],
  ["k3", "max"],
  ["glm-5", "max"],
  ["qwen3.8-max", "xhigh"],
]

function effortDefaultFor(model) {
  const m = (model ?? "").toLowerCase()
  const scan = (s) => {
    let best = null
    for (const [prefix, value] of EFFORT_DEFAULT_PREFIXES) {
      if (s.startsWith(prefix) && (best === null || prefix.length > best[0].length)) best = [prefix, value]
    }
    return best ? best[1] : undefined
  }
  const hit = scan(m)
  if (hit !== undefined) return hit
  // 聚合网关惯例 `vendor/model`：原文未命中 ⇒ 按裸模型段重试（与核 `lookupSpec` 剥离同法）
  const slash = m.indexOf("/")
  return slash >= 0 ? scan(m.slice(slash + 1)) : undefined
}

/** 规格查找（核表单源 + 端差字段覆盖——命中端差行时返回拷贝，未命中 = 核返回值原样）。 */
export function specForModel(model) {
  const spec = coreSpecForModel(model)
  const d = effortDefaultFor(model)
  return d === undefined ? spec : { ...spec, reasoningEffortDefault: d }
}

/**
 * Context utilization percentage: provider-reported prompt tokens vs the provider-aware
 * context window (spec context, overridden by providers[].context). Null when there is
 * no token data. (Panel face — moved here with the W16 config-face consolidation.)
 */
export function ctxPercentForModel(promptTokens, provider) {
  if (!promptTokens) return null
  return Math.round((promptTokens / providerSpec(provider).context) * 100)
}
