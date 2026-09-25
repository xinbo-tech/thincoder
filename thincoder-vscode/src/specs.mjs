/**
 * specs.mjs — VSC 端模型规格面（W16 接线：数据源 = 核单一规格表）。
 *
 * 单一来源 = `@thincoder/core/model-specs.mjs`（MODEL_SPECS 表 + 前缀查找 + provider 级
 * context 覆盖），本档只保**端差面**（CORE-UNIFICATION §2.13.4 #143 裁定「端侧自有 ·
 * 非缺位」）：
 *  - `reasoningEffortDefault`（推理强度下拉默认档——CLI 规格行无此字段，端侧扩展；
 *    旧 `src/config.mjs` 规格表随 W16 删旧，该字段的数据面迁入本档覆盖表）；
 *  - `ctxPercentForModel`（面板上下文占比派生——面板消费面，随 config 面收拢入驻）；
 *  - `ctxPercentForHistory`（M2 · 显示面消差批：同标签双口径消差——分子改核 `estimateTokens(history)`，
 *    与 CLI 状态行同源；`ctxPercentForModel` 保留给 provider 报告值消费面）。
 */
import { specForModel as coreSpecForModel, providerSpec, assistantToolCallMessage } from "@thincoder/core/model-specs.mjs"
// M2（显示面消差批）：分子 = 核 `estimateTokens`——与 CLI 状态行**同源同式**（零依赖纯函数，静态引入安全）
import { estimateTokens } from "@thincoder/core/context.mjs"

export { providerSpec, assistantToolCallMessage }

/** 端差字段表（`reasoningEffortDefault`）：前缀匹配、最长优先；未命中且 ID 含 `vendor/` 命名空间
 *  时按裸模型段重试（与核 `lookupSpec` 命名空间剥离同法——聚合网关惯例 `vendor/model`）；仍未命中 → undefined
 *  （webview 侧 `effortSelectView` 落占位「—」——`webview/settings-state.js`，不再取枚举首项回落）。行为 = 旧 VSC 规格表逐行同值。 */
const EFFORT_DEFAULT_PREFIXES = [
  ["deepseek-v4-flash-vision-exp", "high"],
  ["deepseek-v4-flash", "high"],
  ["deepseek-flash", "high"],
  ["deepseek-v4-pro", "high"],
  ["kimi", "max"],
  ["k3-256k", "high"],
  ["k3", "max"],
  ["glm-5", "max"],
  ["qwen3.7-max", "xhigh"],
  ["qwen3.8-max", "xhigh"],
  ["qwen3.7-flash", "high"],
  ["qwen3.8-flash", "high"],
  ["qwen3.8-omni-flash", "high"],
  ["qwen3.8-27b", "high"],
  ["qwen3.6-flash", "high"],
  ["qwen3.6-plus", "high"],
  ["qwen3.6-max-preview", "high"],
  ["qwen3.6-27b", "high"],
  ["qwen3.6-35b-a3b", "high"],
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

/**
 * Context utilization percentage — CLI-parity ruler (显示面消差批 M2): numerator = core
 * `estimateTokens(history)`, the SAME estimate the CLI status line renders (`thincoder-cli/src/tui/
 * render-frame.mjs:388-389` over the `render-loop.mjs:89-91` ctxCache —— 分子分母两端同源),
 * denominator = the provider-aware window (`providerSpec(provider).context`). The provider-reported
 * `prompt_tokens` numerator (ctxPercentForModel above) double-reported: one session showed two
 * percentages under the same `context X%` label (端差 M2). Null when the estimate is 0.
 */
export function ctxPercentForHistory(history, provider) {
  const tokens = estimateTokens(history ?? [])
  if (!tokens) return null
  return Math.round((tokens / providerSpec(provider).context) * 100)
}
