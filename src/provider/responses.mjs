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

/** 白名单：已实证 previous_response_id 的官方端（2026-08-31 官方文档核实）。 */
function isStatefulHost(baseURL) {
  try {
    const host = new URL(baseURL).hostname
    return /(^|\.)openai\.com$/.test(host) || isBailianHost(baseURL)
  } catch {
    return false
  }
}

/** 灰名单：格式完整但链未证实/不支持——显式全量 + 一次性 warning（不靠服务端报错）。 */
function isNonStatefulHost(baseURL) {
  try {
    const host = new URL(baseURL).hostname
    return /(^|\.)deepseek\.com$/.test(host) || /(^|\.)bigmodel\.cn$/.test(host)
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

/** OpenAI Chat 消息 → Responses input items。system 提升为 instructions（不进 input）。 */
function toItems(messages, { instructions } = {}) {
  const items = []
  for (const m of messages ?? []) {
    if (m.role === "system") continue
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
    prompt_cache_miss_tokens: usage.input_tokens ?? 0,
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

  if (hostNonStateful && !opts.forceStateful) {
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

  const body = {
    model: provider.model,
    input: items, // 占位：chain 有效时下方替换为增量
    stream: true,
    store: false,
    ...(extracted ? { instructions: extracted } : {}),
    ...(toolsFlat ? { tools: toolsFlat } : {}),
    ...(spec.maxOutput || provider.maxTokens ? { max_output_tokens: provider.maxTokens ?? spec.maxOutput } : {}),
  }
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

  const seal = (finalResponse) => {
    result.toolCalls = order.map((callId) => slots.get(callId)).filter(Boolean)
    if (finalResponse?.usage) result.usage = normalizeUsage(finalResponse.usage)
    if (finalResponse?.id) result.responseId = finalResponse.id
    return result
  }

  await readResponseStream(response, {
    onToken: (t) => { result.content += t; onToken?.(t) },
    onReasoning: (t) => { result.reasoning += t; onReasoning?.(t) },
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
      result.finishReason = "length"
    },
    onFailed: (resp) => {
      const err = resp?.error
      const msg = err?.message ?? JSON.stringify(err ?? {}).slice(0, 500)
      const e = new Error(`responses API failed: ${msg}`)
      e.status = resp?.error?.code
      throw e
    },
  })

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
      const data = frame.split("\n").filter((l) => l.startsWith("data: ")).map((l) => l.slice(6)).join("\n")
      if (!data) continue
      let ev
      try { ev = JSON.parse(data) } catch { continue }
      handleEvent(ev, handlers)
    }
  }
  buffer += decoder.decode()
  const data = buffer.split("\n").filter((l) => l.startsWith("data: ")).map((l) => l.slice(6)).join("\n")
  if (data) { try { handleEvent(JSON.parse(data), handlers) } catch { /* ignore */ } }
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
    case "response.reasoning_text.delta":
      h.onReasoning?.(ev.delta ?? "")
      break
    case "response.function_call_arguments.delta":
      h.onFunctionArgsDelta?.(ev.item_id ?? "", ev.delta ?? "")
      break
    case "response.output_item.done": {
      const item = ev.item ?? {}
      if (item.type === "function_call") h.onFunctionDone?.(item.call_id ?? item.id ?? "", item.arguments ?? "")
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
    // 链失效（404/400）：本地全量重建一次——链只是优化，正确性靠本地历史
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
