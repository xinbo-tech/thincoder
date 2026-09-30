/**
 * provider/responses-request.mjs — Responses **请求构造面**出档（2026-09-29 structure-split-2 · 台账 #620）：自
 * `provider/responses.mjs` 全量迁出〔原 `:22-245`〕——host 白名单判定（`isStatefulHost` ∕ `isStoreRequiredHost` ∕
 * `isNonStatefulHost`）· `chainKey` · `builtinToolsFor` · `toItems` / `toTools` / `normalizeUsage` · `buildBody`；
 * **结构拆分零语义**（面不变 ∕ 判据不变，只换宿主档；切点 ∕ 缝单源 = 批档 `docs/batches/2026-09-29-structure-split-2.md` §2.2-B）。
 *
 * 缝 = 同名再出口：宿主 `provider/responses.mjs` 转口 `buildBody` / `isStoreRequiredHost` / `builtinToolsFor` 三名
 * 既有导出（消费者 import 面零改）；`normalizeUsage` 被宿主 `parseStream` 消费 ⇒ 随迁导出（宿主 import）。
 * 零环：本档不引宿主（方向单行）；档外依赖 = `../config.mjs`（`specForModel` ∥ `isBailianHost`）。
 * 链语义（双轨 ∕ 白名单 ∕ store 必开 ∥ 链重置）详述见宿主档头；本档 = 请求侧构造 ∥ 链状态机决策。
 */
import { specForModel, isBailianHost } from "../config.mjs"

/** 白名单：已实证 previous_response_id 的官方端（2026-08-31 真机验证：
 *  百炼 store:true 全链路 ✅；GLM（open.bigmodel.cn/api/v1）store:true 全链路 ✅）。 */
function isStatefulHost(baseURL) {
  try {
    const host = new URL(baseURL).hostname
    return /(^|\.)openai\.com$/.test(host) || isBailianHost(baseURL) || /(^|\.)bigmodel\.cn$/.test(host)
  } catch {
    return false
  }
}

/** store 必开 host（链保留依赖 store:true——真机：百炼 store:false → 链 400；GLM 同）。
 *  OpenAI 官方 store:false 链仍可用，不在内。 */
export function isStoreRequiredHost(baseURL) {
  try {
    const host = new URL(baseURL).hostname
    return isBailianHost(baseURL) || /(^|\.)bigmodel\.cn$/.test(host)
  } catch {
    return false
  }
}

/** 灰名单：格式完整但链未证实/不支持——显式全量 + 一次性 warning（不靠服务端报错）。
 *  2026-08-31 真机后仅剩 DeepSeek（官方明确 previous_response_id 不支持且参数静默忽略）。 */
function isNonStatefulHost(baseURL) {
  try {
    const host = new URL(baseURL).hostname
    return /(^|\.)deepseek\.com$/.test(host)
  } catch {
    return false
  }
}

/** 链 key：system 部分 + 最后一条 user 消息（turn 内不变、跨 turn 变、压缩后变）。 */
function chainKey(messages) {
  let sig = "s:"
  let lastUser = ""
  for (const m of messages ?? []) {
    if (m.role === "system") sig += (typeof m.content === "string" ? m.content : "") + "\u0001"
    else if (m.role === "user") lastUser = typeof m.content === "string" ? m.content : ""
  }
  return sig + "\u0002u:" + lastUser
}

/** 内置工具声明（2026-08-31 用户拍板"内置工具还是要用"，一期 web_search）。
 *  按 host 映射默认集；provider.builtinTools === false 关闭、数组显式覆盖。
 *  注意：内置工具由**服务端执行**——绕过我们的工具权限门/审计（产品决策，用户拍板）。 */
export function builtinToolsFor(baseURL, providerBuiltin) {
  if (providerBuiltin === false) return []
  if (Array.isArray(providerBuiltin)) return providerBuiltin
  try {
    const host = new URL(baseURL).hostname
    if (/(^|\.)openai\.com$/.test(host) || isBailianHost(baseURL) || /(^|\.)deepseek\.com$/.test(host)) {
      return [{ type: "web_search" }]
    }
  } catch { /* fallthrough */ }
  return []
}

/** OpenAI Chat 消息 → Responses input items。system 提升为 instructions（不进 input）。
 *  内置工具结果（web_search_call 本地化 tool 消息）→ 原样 web_search_call item 回传。 */
function toItems(messages, { instructions } = {}) {
  const items = []
  for (const m of messages ?? []) {
    if (m.role === "system") continue
    if (typeof m.tool_call_id === "string" && m.tool_call_id.startsWith("web_search_call_") && typeof m.content === "string") {
      // 内置工具结果本地化消息 → 原样回传（DeepSeek 官方：web_search_call 原样回传即可，
      // 服务端自动恢复搜索结果）。id 用 content 里的原始服务端 id（msg_xxx），前缀只是本地锚点。
      let query = ""
      let srcs = []
      let wsId = m.tool_call_id.slice("web_search_call_".length)
      try {
        const parsed = JSON.parse(m.content)
        query = parsed.query ?? ""
        srcs = parsed.sources ?? []
        if (parsed.id) wsId = parsed.id
      } catch { /* content 非 JSON（纯展示）→ query 缺省 */ }
      items.push({ type: "web_search_call", id: wsId, status: "completed", action: { query, type: "search", sources: srcs } })
      continue
    }
    if (m.role === "user") {
      const content = m.content
      if (Array.isArray(content)) {
        items.push({
          role: "user",
          content: content
            .map((p) => (p?.type === "image_url"
              ? { type: "input_image", image_url: p.image_url?.url }
              : p?.type === "text" || typeof p === "string"
                ? { type: "input_text", text: typeof p === "string" ? p : p.text }
                : null))
            .filter(Boolean),
        })
      } else {
        items.push({ role: "user", content: [{ type: "input_text", text: String(content ?? "") }] })
      }
    } else if (m.role === "assistant") {
      const tcList = m.tool_calls ?? []
      items.push({ role: "assistant", content: [{ type: "output_text", text: String(m.content ?? "") }] })
      for (const tc of tcList) {
        items.push({
          type: "function_call",
          call_id: tc.id ?? "",
          name: tc.function?.name ?? "",
          arguments: tc.function?.arguments ?? "{}",
        })
      }
    } else if (m.role === "tool" || m.role === "function") {
      items.push({
        type: "function_call_output",
        call_id: m.tool_call_id ?? m.name ?? "",
        output: typeof m.content === "string" ? m.content : JSON.stringify(m.content ?? ""),
      })
    }
  }
  return { items, instructions: instructions ?? (messages ?? []).find((m) => m.role === "system")?.content ?? "" }
}

/** OpenAI 工具 schema → Responses 扁平 tools。 */
function toTools(tools) {
  return (tools ?? []).map((t) => ({
    type: "function",
    name: t.function?.name ?? t.name,
    description: t.function?.description ?? t.description,
    parameters: t.function?.parameters ?? t.parameters ?? { type: "object", properties: {} },
  }))
}

/** Responses usage → 内部 cache 字段形状。 */
export function normalizeUsage(usage) {
  if (!usage) return null
  return {
    prompt_tokens: usage.input_tokens ?? 0,
    completion_tokens: usage.output_tokens ?? 0,
    total_tokens: usage.total_tokens ?? (usage.input_tokens ?? 0) + (usage.output_tokens ?? 0),
    prompt_cache_hit_tokens: usage.input_tokens_details?.cached_tokens ?? 0,
    prompt_cache_miss_tokens: Math.max(0, (usage.input_tokens ?? 0) - (usage.input_tokens_details?.cached_tokens ?? 0)),
  }
}

/**
 * 组装请求体 + 链状态机决策。
 * @returns {{ body, previousResponseId, warnings, newChain: {id,key}|null }}
 */
export function buildBody(provider, messages, tools, opts = {}) {
  const { instructions: extracted, items } = toItems(messages)
  const toolsFlat = tools?.length ? toTools(tools) : undefined
  const spec = specForModel(provider.model)
  const warnings = []
  const wantStateful = provider.stateful !== false && opts.stateful !== false
  const hostStateful = isStatefulHost(provider.baseURL)
  const hostNonStateful = isNonStatefulHost(provider.baseURL)

  let chain = provider._responsesChain ?? null
  const key = chainKey(messages)

  if (!wantStateful) {
    chain = null // stateful:false 显式覆盖：残留链（同 session 开过）必须作废
  } else if (hostNonStateful && !opts.forceStateful) {
    // 灰名单：链不支持/未证实（DeepSeek 静默忽略 → 无声丢上下文）——显式全量 + 一次警告
    if (wantStateful) {
      warnings.push({ name: "responses-stateful-unsupported", message: "endpoint 未实证支持 previous_response_id；已发送全量上下文（可 provider.stateful=false 关闭此消息）" })
    }
    chain = null
  } else if (chain && chain.key !== key) {
    chain = null // 跨 turn/压缩/换模型：链失效，全量重建
  } else if (chain && !hostStateful && !opts.forceStateful) {
    chain = null // 非白名单 host 且无显式 forceStateful：不冒险开链
  }
  // 2026-08-31 真机冒烟：百炼/GLM 开链 = 云端留存 7 天——首次知情警告（不刷屏）
  if (wantStateful && hostStateful && isStoreRequiredHost(provider.baseURL) && !provider._responsesStoreWarned) {
    provider._responsesStoreWarned = true
    warnings.push({ name: "responses-store-retention", message: "链生效需要 store:true——对话将在云端留存 7 天（provider.stateful=false 可退出）" })
  }

  const body = {
    model: provider.model,
    input: items, // 占位：chain 有效时下方替换为增量
    stream: true,
    // 2026-08-31 真机冒烟实锤：百炼/GLM 链要求 R1 store:true（store:false → 链 400
    // Not found）；OpenAI 官方 store:false 链仍可用。开链时 = 对话在云端留存 7 天
    // （警告上报）；灰名单全量 store:false。
    store: wantStateful && hostStateful && isStoreRequiredHost(provider.baseURL),
    ...(extracted ? { instructions: extracted } : {}),
    ...(toolsFlat ? { tools: toolsFlat } : {}),
    ...(spec.maxOutput || provider.maxTokens ? { max_output_tokens: provider.maxTokens ?? spec.maxOutput } : {}),
  }
  // 内置工具声明追加（2026-08-31 用户拍板）：web_search 与本地 function 工具共存
  const builtin = builtinToolsFor(provider.baseURL, provider.builtinTools)
  if (builtin.length) body.tools = [...(toolsFlat ?? []), ...builtin]
  if (provider.temperature != null) {
    let t = provider.temperature
    if (spec.tempRange) {
      t = Math.min(spec.tempRange[1], Math.max(spec.tempRange[0], t))
      t = Math.round(t * 100) / 100 // 与 core.mjs 同语义（round3 #7）
    }
    body.temperature = t
  }
  if (provider.reasoningEffort) body.reasoning = { effort: provider.reasoningEffort }
  if (opts.toolChoice !== undefined) body.tool_choice = opts.toolChoice

  // 链模式：turn 内增量 = 上一链轮未发送的 function_call_output（工具结果）。
  // 注意：assistant 的 function_call item 与服务端链输出重复（服务端自动含上轮 output），
  // 增量只发工具结果即可；新 user 消息/压缩/换模型已由 chainKey 挡掉 → 全量。
  const outputs = items.filter((i) => i.type === "function_call_output")
  let previousResponseId = null
  if (chain && chain.id) {
    const newOutputs = outputs.slice(chain.outputSent ?? 0)
    if (newOutputs.length === 0) {
      chain = null // 无新增（重复调用/异常重试）：退化为全量，正确性优先
    } else {
      body.input = newOutputs
      previousResponseId = chain.id
    }
  } else {
    body.input = items
  }

  const newChain = chain
    ? { ...chain, key, outputSent: outputs.length }
    : (wantStateful && (hostStateful || opts.forceStateful) ? { id: null, key, outputSent: outputs.length } : null)

  return { body, previousResponseId, warnings, newChain }
}
