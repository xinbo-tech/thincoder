/**
 * specs.mjs — VSC 端模型规格面（W16 接线：数据源 = 核单一规格表）。
 *
 * 单一来源 = `@thincoder/core/model-specs.mjs`（MODEL_SPECS 表 + 前缀查找 + provider 级
 * context 覆盖），本档只保**端差面**（CORE-UNIFICATION §2.13.4 #143 裁定「端侧自有 ·
 * 非缺位」）：
 *  - `reasoningEffortDefault`（推理强度下拉默认档——CLI 规格行无此字段，端侧扩展；
 *    旧 `src/config.mjs` 规格表随 W16 删旧，该字段的数据面迁入本档覆盖表）；
 *  - `ctxPercentForHistory`（M2 · 显示面消差批：同标签双口径消差——分子改核校准后的历史估算，
 *    与 CLI 状态行同源）。
 */
import { specForModel as coreSpecForModel, providerSpec, assistantToolCallMessage } from "@thincoder/core/model-specs.mjs"
// M2 ∕ context-percent-parity：读数 = 核 `historyReading` 的投影（端侧零自算式；`token-window.mjs` 零顶层副作用，静态引入安全）
import { historyReading } from "@thincoder/core/token-window.mjs"

export { providerSpec, assistantToolCallMessage }

/** 端差字段表（`reasoningEffortDefault`）：前缀匹配、最长优先；未命中且 ID 含 `vendor/` 命名空间
 *  时按末段重试（链式网关可叠多段）（与核 `lookupSpec` 命名空间剥离同法——聚合网关惯例 `vendor/model`）；仍未命中 → undefined
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
  // 非串 model（外端脏载 ∕ 手工档）归一等价空串——与核 `lookupSpec` 同法（#638 查表全性；#1177 收口——清账轮 3 轻通道笔）
  const m = (typeof model === "string" ? model : "").toLowerCase()
  const scan = (s) => {
    let best = null
    for (const [prefix, value] of EFFORT_DEFAULT_PREFIXES) {
      if (s.startsWith(prefix) && (best === null || prefix.length > best[0].length)) best = [prefix, value]
    }
    return best ? best[1] : undefined
  }
  const hit = scan(m)
  if (hit !== undefined) return hit
  // 聚合网关惯例 `vendor/model`：原文未命中 ⇒ 按末段重试（链式网关可叠多段）（与核 `lookupSpec` 剥离同法）
  const slash = m.lastIndexOf("/")
  return slash >= 0 ? scan(m.slice(slash + 1)) : undefined
}

/** 规格查找（核表单源 + 端差字段覆盖——命中端差行时返回拷贝，未命中 = 核返回值原样）。 */
export function specForModel(model) {
  const spec = coreSpecForModel(model)
  const d = effortDefaultFor(model)
  return d === undefined ? spec : { ...spec, reasoningEffortDefault: d }
}

/** Effort 枚举面单源（I7 · #677）：在册枚举 ⇒ 原样；思考开关族（无枚举 ∧ `thinking` 在场）⇒
 *  `["enabled"]` 单档（§16.6-⑴ 零变）；其余（未在册 ∕ 无能力位名）⇒ 回退全档 `["high","max"]`
 *  （对齐 CLI `handleThinkCommand` 托底形——「VSC 档位空」端差消）。 */
export function effortEnumForModel(model) {
  const s = specForModel(model)
  return s.reasoningEffortEnum || (s.thinking ? ["enabled"] : ["high", "max"])
}

/**
 * Context usage pair — CLI-parity ruler (显示面消差批 M2 ∕ I16a ∕ context-percent-parity): both
 * values = one core reading `historyReading` (校准后的历史估算 + 窗口），端侧零自算式——分母/分子不分家
 * 声明。The provider-reported `prompt_tokens` numerator was double-reported once: one
 * session showed two percentages under the same `context X%` label (端差 M2). `pct` = null when the
 * estimate is 0（零值不显示门留在端侧）；`tokens` = 状态行 `Yk` 尾串源（#677 I16a——两值同点产出，
 * 单次估算）。`ratio` = 该 agent 的估算校准比（宿主传 `tokenRatioOf(agent)`）——**无缺省**。
 */
export function ctxUsageForHistory(history, provider, ratio) {
  const { tokens, pct } = historyReading(history, provider, ratio)
  return { tokens, pct: tokens ? pct : null }
}

/** 占比单值形（既有名面——设计档 `WEBVIEW.md` §4.6 派生单点）。 */
export function ctxPercentForHistory(history, provider, ratio) { return ctxUsageForHistory(history, provider, ratio).pct }
