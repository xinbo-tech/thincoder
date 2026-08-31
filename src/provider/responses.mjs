/**
 * provider/responses.mjs — OpenAI Responses API transport（2026-08-31，PROVIDER.md §13）
 *
 * format: "responses"。双轨设计：
 *  - 本地消息历史仍由 agent 层全量提供（事实源不变）；本 transport 只决定"怎么发"。
 *  - 链模式（stateful）：同一 turn 内工具往返使用 previous_response_id 增量发送，
 *    跨 turn / 压缩 / 换模型自动重置（chainKey 不匹配即全量）——正确性不依赖服务端状态。
 *  - host 白名单：只有已实证支持 previous_response_id 的端点才开链（DeepSeek 官方明说
 *    不支持参数被静默忽略——链发出去被忽略 = 只剩增量 input = 无声丢上下文，必须防）。
 *
 * 事件流规范：流以 response.completed / response.incomplete / response.failed 结束，
 * 没有 "data: [DONE]"。
 */
import { specForModel, isBailianHost } from "../config.mjs"
import { proxyFetch } from "../proxy.mjs"
import { requestWithRetry } from "./retry.mjs"
import { rateGate, recordRate, estimateRequestTokens } from "./rate.mjs"

const FETCH_TIMEOUT_MS = 600_000

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
function isStoreRequiredHost(baseURL) {
  return isBailianHost(baseURL) || /(^|\.)bigmodel\.cn$/.test(baseURL ?? "")
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
function normalizeUsage(usage) {
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
    warnings.push({ name: "responses-store-retention", message: "链生效需要 store:true——对话将在云端留存 7 天（PROVIDER.md §13.3 D10；provider.stateful=false 可退出）" })
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
  if (provider.temperature != null) body.temperature = spec.tempRange
    ? Math.min(spec.tempRange[1], Math.max(spec.tempRange[0], provider.temperature))
    : provider.temperature
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

/** 链失效回退：404/无效 id → 返回 null 表示"应全量重发"；其他失败抛错。 */
export function isChainInvalidError(status) {
  return status === 404 || status === 400
}

/**
 * Responses 事件流解析（事件状态机）。输出与 chat completions 同形：
 * { content, reasoning, toolCalls, usage, finishReason, interrupted? }
 */
export async function parseStream(response, { onToken, onReasoning, signal }) {
  const result = { content: "", reasoning: "", toolCalls: [], usage: null, finishReason: null }
  const slots = new Map() // call_id → { id, name, arguments }
  const itemToCall = new Map() // item_id → call_id（delta 事件用 item_id 定位）
  const order = [] // 槽顺序（output_index 稳定输出）
  result.builtinToolResults = [] // 内置工具（web_search_call）结果 —— agent 层本地化为 tool 消息

  const seal = (finalResponse) => {
    result.toolCalls = order.map((callId) => slots.get(callId)).filter(Boolean)
    if (finalResponse?.usage) result.usage = normalizeUsage(finalResponse.usage)
    if (finalResponse?.id) result.responseId = finalResponse.id
    return result
  }

  try {
    await readResponseStream(response, {
      onToken: (t) => { result.content += t; onToken?.(t) },
    onReasoning: (t) => { result.reasoning += t; onReasoning?.(t) },
    onBuiltinWebSearch: (r) => { result.builtinToolResults.push(r) },
    onFunctionCall: (callId, name, itemId) => {
      if (!slots.has(callId)) {
        slots.set(callId, { id: callId, name, arguments: "" })
        order.push(callId)
      }
      if (itemId) itemToCall.set(itemId, callId)
    },
    onFunctionArgsDelta: (itemId, delta) => {
      const callId = itemToCall.get(itemId)
      const slot = callId ? slots.get(callId) : null
      if (slot) slot.arguments += delta
    },
    onFunctionDone: (callId, fullArgs) => {
      const slot = slots.get(callId)
      if (!slot) return
      if (fullArgs && fullArgs !== slot.arguments) slot.arguments = fullArgs
    },
    onCompleted: seal,
    onIncomplete: (resp) => {
      seal(resp)
      // 非长度原因（content_filter 等）不能报成 "length"——agent 层 322 行按原因给用户提示
      result.finishReason = resp?.incomplete_details?.reason === "content_filter" ? "content_filter" : "length"
    },
    onFailed: (resp) => {
      const err = resp?.error
      const msg = err?.message ?? JSON.stringify(err ?? {}).slice(0, 500)
      const e = new Error(`responses API failed: ${msg}`)
      e.status = resp?.error?.code
      throw e
    },
  })
  } catch (e) {
    // 用户 Ctrl+I 中断：与 core 同构——提交已生成部分（agent 层 interrupted 分支消费）——
    // 不丢已流出的 token；超时/网络错误仍照常抛（不应伪装成 interrupted）
    if (e?.name === "AbortError" && signal?.aborted && signal?.reason?.interrupt) {
      seal(null)
      return { ...result, interrupted: true, interruptMessage: signal.reason.message }
    }
    throw e
  }

  // 无显式 finished 事件（流异常结束）时也收尾
  if (result.toolCalls.length === 0 && order.length === 0) seal(null)
  return result
}

/** 事件流核心循环（SSE data: 帧，event 序列由 data 内 type 字段标识）。 */
async function readResponseStream(response, handlers) {
  const decoder = new TextDecoder()
  let buffer = ""
  for await (const chunk of response.body) {
    buffer += decoder.decode(chunk, { stream: true })
    let idx
    while ((idx = buffer.indexOf("\n\n")) >= 0) {
      const frame = buffer.slice(0, idx)
      buffer = buffer.slice(idx + 2)
      // 2026-08-31 真机冒烟：①百炼 SSE 帧为 `data:{…}` 无空格（OpenAI/DeepSeek 带空格）——
      // slice(5).trim() 兼容；②帧 event: 头行（百炼 `event:error` 形态：data 无 type 字段，
      // HTTP 200 内嵌业务 400——原实现静默吞掉 = 空内容当回复，必须识别后抛错）。
      const eventHeader = frame.split("\n").find((l) => l.startsWith("event:"))?.slice(6).trim() ?? ""
      const data = frame.split("\n").filter((l) => l.startsWith("data:")).map((l) => l.slice(5).trim()).join("\n")
      if (!data) continue
      let ev
      try { ev = JSON.parse(data) } catch {
        if (eventHeader === "error") throw new Error(`responses API error frame: ${data.slice(0, 300)}`)
        continue
      }
      if (eventHeader === "error" && !ev.type) {
        const e = new Error(`responses API error ${ev.code ?? ev.status ?? ""}: ${ev.message ?? JSON.stringify(ev).slice(0, 300)}`)
        e.status = 400
        throw e
      }
      handleEvent(ev, handlers)
    }
  }
  buffer += decoder.decode()
  const data = buffer.split("\n").filter((l) => l.startsWith("data:")).map((l) => l.slice(5).trim()).join("\n")
  if (data) {
    let ev
    try { ev = JSON.parse(data) } catch { return }
    // 残余帧（无 \n\n 定界）同样走完整事件语义：error/failed 帧的错误必须传播——
    // 静默吞 = 空内容当回复（2026-08-31 真机冒烟同类别缺陷，尾部边界版本）
    handleEvent(ev, handlers)
  }
}

function handleEvent(ev, h) {
  switch (ev.type) {
    case "response.output_item.added": {
      const item = ev.item ?? {}
      if (item.type === "function_call") h.onFunctionCall(item.call_id ?? item.id ?? "", item.name ?? "", item.id ?? "")
      break
    }
    case "response.output_text.delta":
      h.onToken?.(ev.delta ?? "")
      break
    case "response.content_part.delta": {
      // OpenRouter 变体（2026-08-31 官方文档核实）：事件名 content_part.delta，part.type 区分
      // output_text / reasoning_text；另以 response.done + data:[DONE] 收尾
      const part = ev.part ?? {}
      if (part.type === "reasoning_text") h.onReasoning?.(ev.delta ?? "")
      else h.onToken?.(ev.delta ?? "")
      break
    }
    case "response.done":
      h.onCompleted?.(ev.response)
      break
    case "response.reasoning_text.delta":
      h.onReasoning?.(ev.delta ?? "")
      break
    case "response.function_call_arguments.delta":
      h.onFunctionArgsDelta?.(ev.item_id ?? "", ev.delta ?? "")
      break
    case "response.output_item.done": {
      const item = ev.item ?? {}
      if (item.type === "function_call") h.onFunctionDone?.(item.call_id ?? item.id ?? "", item.arguments ?? "")
      else if (item.type === "web_search_call") {
        h.onBuiltinWebSearch?.({
          id: item.id ?? "",
          query: item.action?.query ?? "",
          status: item.status ?? "completed",
          sources: item.action?.sources ?? [],
        })
      }
      break
    }
    case "response.completed":
      h.onCompleted?.(ev.response)
      break
    case "response.incomplete":
      h.onIncomplete?.(ev.response)
      break
    case "response.failed":
      h.onFailed?.(ev.response)
      break
    default:
      break
  }
}

/** 主入口：请求 + 链状态推进（与 core.mjs 的 chat 同形返回）。 */
export async function chat(provider, { messages, tools, onToken, onReasoning, onWait, signal, toolChoice, stateful }) {
  const { body: reqBody, previousResponseId, warnings, newChain } = buildBody(provider, messages, tools, { toolChoice, stateful })
  const body = { ...reqBody, ...(previousResponseId ? { previous_response_id: previousResponseId } : {}) }

  // rateGate/recordRate 对齐 core（responses body 无 messages 键——按本地全量 messages 估算）
  const estimated = estimateRequestTokens({ messages })
  await rateGate(provider, estimated, onWait, signal)

  const response = await requestWithRetry(
    () => proxyFetch(`${provider.baseURL}/responses`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${provider.apiKey}` },
      body: JSON.stringify(body),
      signal: signal
        ? AbortSignal.any([signal, AbortSignal.timeout(FETCH_TIMEOUT_MS)])
        : AbortSignal.timeout(FETCH_TIMEOUT_MS),
      _headerTimeoutMs: FETCH_TIMEOUT_MS,
      _bodyIdleMs: 120_000,
    }, provider.proxyUri),
    { signal, onWait, buildMessage: (status, text) => `Responses API error ${status}: ${text}` },
  )

  if (isChainInvalidError(response.status)) {
    // 链失效（404/400）：先清残留链再重建——D6 语义是真·全量重发（body.input=items）。
    // 不清链会走 buildBody 217-224 的增量分支：body.input = 裸 function_call_output 且
    // previousResponseId 未随 fullBody 带走 → 服务端 call_id 无归属 → 二次 400（2026-08-31 评审 #1）
    provider._responsesChain = null
    const fresh = buildBody(provider, messages, tools, { toolChoice, stateful, forceStateful: true })
    const fullBody = { ...fresh.body }
    const retry = await requestWithRetry(
      () => proxyFetch(`${provider.baseURL}/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${provider.apiKey}` },
        body: JSON.stringify(fullBody),
        signal: signal
          ? AbortSignal.any([signal, AbortSignal.timeout(FETCH_TIMEOUT_MS)])
          : AbortSignal.timeout(FETCH_TIMEOUT_MS),
        _headerTimeoutMs: FETCH_TIMEOUT_MS,
        _bodyIdleMs: 120_000,
      }, provider.proxyUri),
      { signal, onWait, buildMessage: (status, text) => `Responses API error ${status}: ${text}` },
    )
    return finish(provider, retry, { onToken, onReasoning, signal, newChain: fresh.newChain, warnings })
  }

  return finish(provider, response, { onToken, onReasoning, signal, newChain, warnings, estimated })
}

async function finish(provider, response, { onToken, onReasoning, signal, newChain, warnings, estimated }) {
  const result = await parseStream(response, { onToken, onReasoning, signal })
  recordRate(provider, estimated, result.usage)
  // 链状态推进：completed 事件里 response.id 供同一 turn 后续增量；
  // 截断/失败/无 id（部分端点不回传）→ 链作废（后续全量，正确性优先）。
  if (newChain && result.finishReason !== "length" && result.responseId) {
    provider._responsesChain = { ...newChain, id: result.responseId }
  } else {
    provider._responsesChain = null
  }
  result._warnings = warnings
  return result
}
