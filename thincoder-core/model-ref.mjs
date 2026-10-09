/**
 * model-ref.mjs — composite model reference parser (MODEL-MERGE-SESSION; v2 2026-09-10).
 * A model is an explicit "provider:model" composite — config.defaultModel (top level,
 * new-session starting point) and session slots both speak this language. 有效域 = **provider 存在
 * + 双段非空**：清单不再人工维护（模型清单由 provider 运行期 `GET /models` 拉取决定——
 * PROVIDER.md §16），候选成员校验**已废除**——显式 `p:m` 一律放行（含多冒号首分割）。
 * 渠道不携模型——单值 `providers[].model` 与候选清单字段 `models[]` 均已退场（2026-10-09 清除批：
 * 渠道模型面零读写）；模型身份唯二 = 顶层 `defaultModel` 复合串 ∥ 会话槽选定。
 *
 * Strict first-colon split — deliberately does NOT reuse `resolveChildProvider`'s
 * override resolution: ① legacy single-provider configs and ② model-name-only refs
 * are gone with activeProvider/activeModel (F-1) — 本解析面（`defaultModel` ∥ 槽）一律显式
 * `p:m`（裁定③——裸 provider 拒）；子代理覆写面另判（`resolveChildProvider`——裸模型名换型）。
 *
 * Runtime model resolution (#841 单源 = resolveProviderPlan——机制全文 PROVIDER.md §6.22):
 *   parseModelRef(ref, providers)      → { ok, provider, model } | { ok:false, reason }
 *   resolveChannelModel(entry, defaultModel)
 *                                      → 渠道模型面单值：defaultModel 属本渠道 ⇒ 其模型段 ∥
 *                                        null（渠道不携模型——不回退渠道单值；VSC 转口面）
 *   resolveProviderPlan({ providers, defaultModel, slot })
 *                                      → { state, source, channel, model, provider, reason }
 *                                        统一回退解析（纯函数 · 零 I/O——三端消费同一函数）：
 *                                        渠道面回退序三步 + 模型面三步 + 三态 ok ∥ fallback ∥ invalid
 *   resolveRuntimeProvider(providers, defaultModel)
 *                                      → provider object with `.model` set, or {} when
 *                                        defaultModel is null/invalid (D-S1: callers mark
 *                                        _providerInvalid — never throws)
 *   defaultModelReason(providers, defaultModel) → human reason for the D-S1 marker
 *
 * Consumers: config.mjs loadConfig (re-exported as the config hub), make-agent.mjs,
 * session-lifecycle.mjs applySession（槽面）, VSC panel-turn-stages ∥ presets（核转口）。
 */
export function parseModelRef(ref, providers) {
  if (typeof ref !== "string" || !ref.trim()) {
    return { ok: false, reason: 'model reference expected as "provider:model" (e.g. deepseek:deepseek-v4-pro)' }
  }
  // 首冒号分割——`a:b:c` → provider=a、model=`b:c`（`ollama:llama3:70b` 式模型名可用，M4）
  const sep = ref.indexOf(":")
  if (sep <= 0) {
    return { ok: false, reason: `invalid model reference "${ref}" — expected provider:model (bare provider/model names are not accepted)` }
  }
  const providerName = ref.slice(0, sep)
  const model = ref.slice(sep + 1)
  if (!model) {
    return { ok: false, reason: `invalid model reference "${ref}" — model part is empty (expected provider:model)` }
  }
  const list = Array.isArray(providers) ? providers : []
  const provider = list.find((p) => p?.name === providerName)
  if (!provider) {
    const available = list.map((p) => p.name).join(", ") || "(none)"
    return { ok: false, reason: `unknown provider "${providerName}" in model reference (available: ${available})` }
  }
  return { ok: true, provider, model }
}

/** Resolve the runtime provider object for config.defaultModel: provider clone carrying
 *  `.model` = the parsed concrete model (API/spec consumers read provider.model unchanged).
 *  Invalid/missing defaultModel → {} (D-S1 shape — name/model/baseURL absent so
 *  validateProvider flags it; TUI/headless surface the reason from defaultModelReason).
 *  #841 后：运行时取值 = `resolveProviderPlan`（回退序 + 三态）；本函数保留为**严格单发**解析面
 *  （零回退——解析未过即 `{}`），新码勿调。 */
export function resolveRuntimeProvider(providers, defaultModel) {
  const r = parseModelRef(defaultModel, providers)
  if (!r.ok) return {}
  return { ...r.provider, model: r.model }
}

/** Human-readable reason behind an invalid/empty runtime resolution (D-S1 原因). */
export function defaultModelReason(providers, defaultModel) {
  const list = Array.isArray(providers) ? providers : []
  if (!defaultModel) {
    return list.length > 0
      ? "defaultModel 未设置（config 顶层 defaultModel — 新会话起点；/config → 默认模型 设置）"
      : "未配置任何 provider"
  }
  return parseModelRef(defaultModel, list).reason ?? `defaultModel "${defaultModel}" 无效`
}

/** 「持 key」判据（#841——`providers[].apiKey` trim 后非空；env 变量不是密钥源，config.mjs 档头同判）。 */
function hasKey(entry) {
  return typeof entry?.apiKey === "string" && entry.apiKey.trim() !== ""
}

/** 渠道模型面单值（#841 模型面——VSC `resolveDefaultModel` 转口面 · 纯函数）：
 *  ① `defaultModel` 解析通过 ∧ 其渠道 == `entry` ⇒ 其模型段（首冒号分割 · 双段非空 · name 相等）；
 *  ② `null`——渠道不携模型（2026-10-09 清除批：`entry.model` 读退场，不回退渠道单值）；模型由
 *  运行期 `/models` 候选 ∥ 用户选择 ∥ 顶层 `defaultModel` 决定。
 *  @param {object|null} entry — providers[] 条目（或同形对象）
 *  @param {string|null} defaultModel — 顶层复合串
 *  @returns {string|null} */
export function resolveChannelModel(entry, defaultModel) {
  if (entry?.name) {
    const ref = parseModelRef(defaultModel, [entry])
    if (ref.ok) return ref.model
  }
  return null // ② 档：渠道不携模型（2026-10-09 清除批）——不回退渠道单值
}

/** 运行时渠道/模型统一解析（#841 核单源——机制全文 PROVIDER.md §6.22；纯函数 · 零 I/O）。
 *  三端（CLI ∥ VSC ∥ 桌面）消费同一函数：`loadConfig` 运行时 provider 取值 = 本函数产物（CLI ∥ 桌面
 *  经装配自动同源）；VSC 回合面直调（接入面自建链收正）。
 *
 *  **渠道面回退序**：① 会话槽渠道（`slot.provider` 在场 ∧ 在册 ∧ 持 key ⇒ `source="slot"`）；
 *  ② defaultModel 渠道（解析通过 ∧ 该渠道持 key ⇒ `source="defaultModel"`）；③ 首个持 key 渠道
 *  （按表序 ⇒ `source="registry"`）；④ 无 ⇒ `state="invalid"`（渠表空 ∥ 全表无 key）。
 *  槽无 key ⇒ **跳过**（不把不可运行渠道钉进运行态）。
 *  **模型面**：① 入选来源 = 槽 ∧ 槽带模型 ⇒ 槽模型；② defaultModel 属入选渠道 ⇒ 其模型段；
 *  ③ 无 ⇒ `null`（2026-10-09 清除批：渠道单值退场——不回退渠道单值；消费者沿既有「model 缺失」
 *  处置；明示词形随缺 = 仅渠道名）。
 *  **三态（config 级——KD-841-3：槽改写「谁在跑」，不改「默认模型是否有效」）**：`ok` =
 *  defaultModel 独立成立（解析通过 ∧ 该渠道持 key）⇒ 零明示；`fallback` =「无有效 defaultModel」类
 *   ∧ 全局有可运行渠道 ⇒ 可运行 + 明示必达；`invalid` =「无 provider/key」类 ⇒ 真无效 + 引导配置。
 *  `reason` = state≠ok 的语义源（消费者按 `state` 出词——**禁串嗅探**，非契约）。
 *  @param {{providers?: object[], defaultModel?: string|null, slot?: {provider?: string|null, model?: string|null}|null}} [input]
 *  @returns {{state: "ok"|"fallback"|"invalid", source: "slot"|"defaultModel"|"registry"|null, channel: string|null, model: string|null, provider: object, reason: string|null}} */
export function resolveProviderPlan({ providers, defaultModel, slot } = {}) {
  const list = Array.isArray(providers) ? providers : []
  const slotName = typeof slot?.provider === "string" && slot.provider ? slot.provider : null
  const slotModel = typeof slot?.model === "string" && slot.model ? slot.model : null

  // ── 渠道面回退序（三步）──
  let entry = null
  let source = null
  if (slotName) {
    const hit = list.find((p) => p?.name === slotName)
    if (hit && hasKey(hit)) { entry = hit; source = "slot" } // 槽无 key ⇒ 跳过（落下一档）
  }
  const ref = parseModelRef(defaultModel, list)
  if (!entry && ref.ok && hasKey(ref.provider)) { entry = ref.provider; source = "defaultModel" }
  if (!entry) {
    const first = list.find((p) => hasKey(p))
    if (first) { entry = first; source = "registry" }
  }

  // ── 模型面（三步；无入选渠道 ⇒ null）──
  const model = entry ? (source === "slot" && slotModel ? slotModel : resolveChannelModel(entry, defaultModel)) : null

  // ── 三态（config 级）──
  const dmOk = ref.ok && hasKey(ref.provider)
  const state = !entry ? "invalid" : dmOk ? "ok" : "fallback"

  // ── reason（语义源 · 逐档）──
  let reason = null
  if (state === "invalid") {
    reason = list.length === 0
      ? "未配置任何 provider"
      : "未配置 API 密钥（providers[].apiKey）——请先配置渠道密钥"
  } else if (state === "fallback") {
    reason = ref.ok
      ? `defaultModel 渠道 "${ref.provider.name}" 无 API 密钥——已回退到可用渠道`
      : defaultModelReason(list, defaultModel)
  }

  return {
    state,
    source,
    channel: entry?.name ?? null,
    model,
    provider: entry ? { ...entry, model } : {},
    reason,
  }
}
