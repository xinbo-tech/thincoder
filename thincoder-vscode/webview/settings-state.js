/**
 * settings-state.js — shared settings-panel state (split out of settings.js).
 *
 * SS is the single home for every mutable value that used to be a module-level
 * `let _x` in settings.js. All settings modules read/write through SS.<name>,
 * so they all see (and mutate) the SAME object at runtime (same pattern as state.js).
 */

export const PROVIDER_LABELS = {
  deepseek: "DeepSeek", kimi: "Kimi (Moonshot)", glm: "GLM (Zhipu)",
  qwen: "Qwen (Alibaba)", minimax: "MiniMax", openai: "OpenAI",
  claude: "Claude (Anthropic)", gemini: "Gemini (Google)",
  grok: "Grok (xAI)", mistral: "Mistral",
}

export const SS = {
  /** @type {{ providers?: Record<string,{configured:boolean,masked:string}>, custom?: {baseURL?:string,model?:string}, labels?: Record<string,string>, presets?: object[] }} */
  providerStatus: {},
  /** Model list getter (chat panel's ctx._models) — supplies the advisor model dropdown. */
  getModels: null,
  /** @type {{ hasKey?: boolean }} */
  websearchSettings: {},
  /** @type {{ built?:boolean, files?:number, chunks?:number, hasEmbedder?:boolean } | null} */
  indexStatus: null,
  /** @type {{ maxTurns?:number, subagentTurns?:number, compactThreshold?:number|null, verifyGuard?:boolean, advisor?:object, effortEnums?:object } | null} */
  agentSettings: null,
  /** @type {{ name:string, value:string|null }[] | null} — detected shells (extension sends once) */
  shellCandidates: null,
  /** @type {string|null} — current config.shell value */
  shellValue: null,
  /** @type {{ uri?:string, web?:boolean, model?:boolean } | null} */
  proxySettings: null,
}

/** Effort enum for a model id — the panel's model entries carry spec reasoning arrays. */
export function effortEnumFor(modelId) {
  const entry = (SS.getModels?.() || []).find((m) => m.id === modelId)
  const levels = entry?.reasoning || []
  if (levels.length > 0) return levels.filter((x) => x !== "enabled")
  // Fallback: the agentSettings snapshot carries spec-derived enums — available even
  // before the model-list network probe returns.
  return SS.agentSettings?.effortEnums?.[modelId] || []
}
/** 归一链单源（§15.4-1——设置面板 / 聊天面板 picker / advisor 读面三面共用同一个 value）：
 *  ① 已存值 ∈ 枚举 ⇒ 取之；② 否则注册默认（**须 ∈ 枚举**）⇒ 取之；③ 否则 ⇒ `null`（中性档）。
 *  「已存值 ∉ 枚举」= 按枚举**显式判成员**（不再由浏览器「无匹配 option ⇒ value 落空」的代发行为承载结果）；
 *  中性档语义 = **不写 effort 载荷**（服务端默认与渠道条目原值照旧生效）。 */
export function effortSelection(levels, current, registeredDefault) {
  const list = Array.isArray(levels) ? levels : []
  if (list.includes(current)) return current
  if (list.includes(registeredDefault)) return registeredDefault
  return null
}

/** Effort 下拉视图（两渲染径共用——初渲染（`settings-agent.js`）/ 换模型重建（`settings-widgets.js`））：
 *  `levels` = 「—」+ 枚举（「—」恒首项、不落盘 effort）；`selected` = `effortSelection` 三支结果
 *  （非成员 / 无注册默认 ⇒ 中性档「—」——不再取枚举首项：四新档首项 = `"none"` ⇒ 会静默关思考）。
 *  枚举空 ⇒ `null`（调用方不渲染控件）。注册默认 = 模型条目的 `effortDefault`
 *  （spec `reasoningEffortDefault` 直读，来源 `src/extension/provider-probe-window.mjs:67`）。 */
export function effortSelectView(model, current) {
  const levels = model ? effortEnumFor(model) : []
  if (levels.length === 0) return null
  const def = (SS.getModels?.() || []).find((m) => m.id === model)?.effortDefault
  return { levels: ["—", ...levels], selected: effortSelection(levels, current, def) ?? "—" }
}

/** Advisor effort 读面（面板预选取值——§15.4-4）：`thinking` 为 off 形（`null` / `{type:"disabled"}`）
 *  ⇒ 字面 `"none"`（**优先于**档位键——与 CLI `/advisor` 状态行同序）；否则 `advisor.reasoningEffort`；
 *  再缺席 ⇒ legacy `advisor.effort`（日值兜底，保存即删旧键）。返回值仍经 `effortSelection` 判成员
 *  （非成员 ⇒ 中性档「—」，不落列表外值）。 */
export function advisorEffortCurrent(adv) {
  const a = adv ?? {}
  if (a.thinking === null || a.thinking?.type === "disabled") return "none"
  return a.reasoningEffort ?? a.effort ?? null
}

/** Effort 载荷归一（落盘前唯一取数口）：「—」（未注册占位）/ `none`（= 关思考）/ 空 ⇒ `null`
 *  ⇒ 调用方删键（不写字面）；其余档原样返回。 */
export function effortPayloadValue(v) {
  const s = typeof v === "string" ? v.trim() : ""
  return s === "" || s === "—" || s === "none" ? null : s
}

/** Advisor effort 载荷归一（§15.4-2 / `SETTINGS.md` §2.13）：「—」（未注册占位）/ 空 ⇒ `null`（调用方删键）；
 *  `none` **原样上送**（= 关思考意图——写面据此按族取 off 形）；其余档位原样返回。
 *  与 `effortPayloadValue`（consult 面：`none` 也归一 `null`）的差口 = `none` 一档（advisor 面无 off 形接线）
 *  ——勿合流。 */
export function advisorEffortPayloadValue(v) {
  const s = typeof v === "string" ? v.trim() : ""
  return s === "" || s === "—" ? null : s
}
/** Provider display label. */
export function labelFor(provider) {
  return SS.providerStatus.labels?.[provider] || PROVIDER_LABELS[provider] || provider
}
