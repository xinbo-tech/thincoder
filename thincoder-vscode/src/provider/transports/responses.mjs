/**
 * provider/transports/responses.mjs — OpenAI Responses API transport（2026-08-31，CLI PROVIDER.md §13 同规格）
 *
 * TRANSPORTS 对象模式：{ normalizeTools, buildRequest, parseStream }。
 * 双轨链（provider._responsesChain 由 provider.mjs chat() 推进）：
 *  - 链模式（stateful，host 白名单驱动）：同一 turn 内工具往返用 previous_response_id
 *    增量（只发未发送的 function_call_output）；跨 turn/压缩/换模型 chainKey 不匹配 → 全量。
 *  - DeepSeek/GLM 等灰名单：显式全量 + 一次性 warning（官方明说不支持参数被静默忽略
 *    ——发链只会丢上下文）。
 * 事件流：流以 response.completed/incomplete/failed 结束，无 "data: [DONE]"。
 */

import { specForModel } from "../../specs.mjs"

/** 读侧 idle 看门狗（群 A 批——绝对墙钟废除后的 body 停摆守卫）：连续 READ_IDLE_MS
 *  无 chunk → TimeoutError 判死；测试缝 = parseStream 的 idleMs 参数（生产缺省）。 */
const READ_IDLE_MS = 120_000

/** 白名单：已实证 previous_response_id 的官方端（2026-08-31 真机验证：
 *  百炼 store:true 全链路 ✅；GLM（open.bigmodel.cn/api/v1）store:true 全链路 ✅）。 */
function isStatefulHost(baseURL) {
  try {
    const host = new URL(baseURL).hostname
    return /(^|\.)openai\.com$/.test(host)
      || host.includes("dashscope.aliyuncs.com") || host.includes(".maas.aliyuncs.com")
      || /(^|\.)bigmodel\.cn$/.test(host)
  } catch {
    return false
  }
}

/** store 必开 host（链保留依赖 store:true——真机：百炼/GLM store:false → 链 400）。 */
function isStoreRequiredHost(baseURL) {
  try {
    const host = new URL(baseURL).hostname
    return /(^|\.)bigmodel\.cn$/.test(host)
      || host.includes("dashscope.aliyuncs.com")
      || host.includes(".maas.aliyuncs.com")
  } catch {
    return false
  }
}

/** 灰名单：链未证实/不支持——仅剩 DeepSeek（官方明说 previous_response_id 不支持且静默忽略）。 */
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

export function normalizeTools(tools) {
  return (tools ?? []).map((t) => ({
    type: "function",
    name: t.function?.name ?? t.name,
    description: t.function?.description ?? t.description,
    parameters: t.function?.parameters ?? t.parameters ?? { type: "object", properties: {} },
  }))
}

/** 内置工具声明（2026-08-31 用户拍板，一期 web_search；CLI 同规格）。
 *  provider.builtinTools === false 关闭、数组显式覆盖；服务端执行（绕过本地权限门/审计）。 */
function builtinToolsFor(baseURL, providerBuiltin) {
  if (providerBuiltin === false) return []
  if (Array.isArray(providerBuiltin)) return providerBuiltin
  try {
    const host = new URL(baseURL).hostname
    if (/(^|\.)openai\.com$/.test(host) || host.includes("dashscope.aliyuncs.com") || host.includes(".maas.aliyuncs.com") || /(^|\.)deepseek\.com$/.test(host)) {
      return [{ type: "web_search" }]
    }
  } catch { /* fallthrough */ }
  return []
}

function toItems(messages) {
  const items = []
  for (const m of messages ?? []) {
    if (m.role === "system") continue
    if (typeof m.tool_call_id === "string" && m.tool_call_id.startsWith("web_search_call_") && typeof m.content === "string") {
      // 内置工具结果本地化消息 → 原样 web_search_call item 回传（服务端自动恢复搜索结果）。
      // id 用 content 里的原始服务端 id（msg_xxx），前缀只是本地锚点（2026-08-31 真机修正）。
      let query = ""
      let srcs = []
      let wsId = m.tool_call_id.slice("web_search_call_".length)
      try {
        const parsed = JSON.parse(m.content)
        query = parsed.query ?? ""
        srcs = parsed.sources ?? []
        if (parsed.id) wsId = parsed.id
      } catch { /* 非 JSON 纯展示 → query 缺省 */ }
      items.push({ type: "web_search_call", id: wsId, status: "completed", action: { query, type: "search", sources: srcs } })
      continue
    }
    if (m.role === "user") {
      const content = m.content
      items.push(Array.isArray(content)
        ? {
            role: "user",
            content: content
              .map((p) => (p?.type === "image_url"
                ? { type: "input_image", image_url: p.image_url?.url }
                : p?.type === "text" || typeof p === "string"
                  ? { type: "input_text", text: typeof p === "string" ? p : p.text }
                  : null))
              .filter(Boolean),
          }
        : { role: "user", content: [{ type: "input_text", text: String(content ?? "") }] })
    } else if (m.role === "assistant") {
      items.push({ role: "assistant", content: [{ type: "output_text", text: String(m.content ?? "") }] })
      for (const tc of m.tool_calls ?? []) {
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
  return items
}

/**
 * buildRequest（TRANSPORTS 约定：返回 { url, headers, body }）。
 * 链决策元数据放在返回对象的 _chainMeta（非序列化字段，chat() 读取推进链）。
 */
export function buildRequest(provider, messages, tools, { toolChoice, stateful } = {}) {
  const items = toItems(messages ?? [])
  const spec = specForModel(provider.model)
  const warnings = []
  const wantStateful = provider.stateful !== false && stateful !== false
  const hostStateful = isStatefulHost(provider.baseURL)
  const hostNonStateful = isNonStatefulHost(provider.baseURL)

  let chain = provider._responsesChain ?? null
  const key = chainKey(messages)

  if (!wantStateful) {
    chain = null // stateful:false 显式覆盖：残留链必须作废（与 CLI 同修）
  } else if (hostNonStateful && !stateful) {
    if (wantStateful) warnings.push({ name: "responses-stateful-unsupported", message: "endpoint 未实证支持 previous_response_id；已发送全量上下文" })
    chain = null
  } else if (chain && chain.key !== key) {
    chain = null
  } else if (chain && !hostStateful && !stateful) {
    chain = null
  }

  const body = {
    model: provider.model,
    input: items,
    stream: true,
    // 2026-08-31 真机冒烟实锤（与 CLI 同）：百炼/GLM 开链要求 store:true；OpenAI 官方 store:false 链可用
    store: wantStateful && hostStateful && isStoreRequiredHost(provider.baseURL),
  }
  // 2026-08-31 真机冒烟：百炼/GLM 开链 = 云端留存 7 天——首次知情警告
  if (wantStateful && hostStateful && isStoreRequiredHost(provider.baseURL) && !provider._responsesStoreWarned) {
    provider._responsesStoreWarned = true
    warnings.push({ name: "responses-store-retention", message: "链生效需要 store:true——对话将在云端留存 7 天（provider.stateful=false 可退出）" })
  }
  // 内置工具声明追加（2026-08-31 用户拍板）：web_search 与本地 function 工具共存
  const builtin = builtinToolsFor(provider.baseURL, provider.builtinTools)
  if (builtin.length) body.tools = [...(tools ?? []), ...builtin]
  const instructions = (messages ?? []).find((m) => m.role === "system")?.content
  if (instructions) body.instructions = typeof instructions === "string" ? instructions : JSON.stringify(instructions)
  if (provider.maxTokens) body.max_output_tokens = provider.maxTokens
  else if (spec.maxOutput) body.max_output_tokens = spec.maxOutput
  if (provider.temperature != null) body.temperature = spec.tempRange
    ? Math.min(spec.tempRange[1], Math.max(spec.tempRange[0], provider.temperature))
    : provider.temperature
  if (provider.reasoningEffort) body.reasoning = { effort: provider.reasoningEffort }
  if (toolChoice !== undefined) body.tool_choice = toolChoice

  // 链模式增量：只发未发送的 function_call_output（工具结果）；assistant 的 function_call
  // item 与服务端链输出重复，不发。
  const outputs = items.filter((i) => i.type === "function_call_output")
  let previousResponseId = null
  let chainMeta = null
  if (chain && chain.id) {
    const newOutputs = outputs.slice(chain.outputSent ?? 0)
    if (newOutputs.length > 0) {
      body.input = newOutputs
      previousResponseId = chain.id
    } else {
      body.input = items // 无新增（重复调用/重试）：退化为全量
      previousResponseId = null
    }
  }
  if (wantStateful && (hostStateful || stateful)) {
    chainMeta = chain?.id
      ? { ...chain, key, outputSent: outputs.length }
      : { id: null, key, outputSent: outputs.length }
  }
  return {
    url: `${provider.baseURL}/responses`,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${provider.apiKey}` },
    body: JSON.stringify(body),
    _chainMeta: chainMeta,
    _warnings: warnings,
    _previousResponseId: previousResponseId,
  }
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
    reasoning_tokens: usage.output_tokens_details?.reasoning_tokens ?? 0, // §14 C-12#6
  }
}

/**
 * parseStream（TRANSPORTS 约定：{ content, reasoning, toolCalls, usage, finishReason }）。
 * 额外返回 responseId（completed 事件）——chat() 据此推进链。
 */
export async function parseStream(response, { onToken, onReasoning, signal, idleMs: idleOpt } = {}) {
  const result = { content: "", reasoning: "", toolCalls: [], usage: null, finishReason: null }
  result.builtinToolResults = [] // 内置工具（web_search_call）结果 —— agent 层本地化为 tool 消息
  const slots = new Map() // call_id → { id, name, arguments }
  const itemToCall = new Map() // item_id → call_id
  const order = []

  const seal = (finalResponse) => {
    result.toolCalls = order.map((c) => slots.get(c)).filter(Boolean)
    if (finalResponse?.usage) result.usage = normalizeUsage(finalResponse.usage)
    if (finalResponse?.id) result.responseId = finalResponse.id
    return result
  }

  const decoder = new TextDecoder()
  let buffer = ""
  let sealed = false
  const reader = response.body.getReader()

  // 读侧 idle 看门狗（群 A 批）：每读重置；连续 idleMs 无数据 → TimeoutError（与四 transport
  // 同源消息）。releaseBody 兼容两种 body：Node 流（代理路径 PassThrough——destroy）与
  // Web 流（直连 undici ReadableStream——无 destroy，退 cancel）；race 保证两种形态都以
  // TimeoutError 终止读循环。idleMs ≤ 0 = 关闭（测试缝）。
  const idleMs = idleOpt ?? READ_IDLE_MS
  const idleError = () => new DOMException(`SSE idle timeout: no data for ${idleMs / 1000}s`, "TimeoutError")
  let idleTimer = null
  let rejectIdle = null
  const idlePromise = new Promise((_, reject) => { rejectIdle = reject })
  const releaseBody = (err) => {
    try {
      if (typeof response.body?.destroy === "function") response.body.destroy(err)
      else reader.cancel(err).catch(() => {}) // 本 transport 持显式 reader——locked Web 流释放可达（reader.cancel）
    } catch { /* already gone */ }
  }
  const armIdle = () => {
    if (!(idleMs > 0)) return
    if (idleTimer) clearTimeout(idleTimer)
    idleTimer = setTimeout(() => { const err = idleError(); releaseBody(err); rejectIdle(err) }, idleMs)
    idleTimer.unref?.()
  }
  armIdle()
  try {
    while (true) {
      if (signal?.aborted) throw new DOMException("Aborted", "AbortError")
      armIdle()
      const { done, value } = await Promise.race([reader.read(), idlePromise])
      if (done) break
    buffer += decoder.decode(value, { stream: true })
    let idx
    while ((idx = buffer.indexOf("\n\n")) >= 0) {
      const frame = buffer.slice(0, idx)
      buffer = buffer.slice(idx + 2)
      // 2026-08-31 真机冒烟（与 CLI 同）：百炼帧 data: 无空格 + event:error 帧（HTTP 200 内嵌 400，
      // data 无 type 字段）——必须识别抛错，否则静默空响应
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
      switch (ev.type) {
        case "response.output_item.added": {
          const item = ev.item ?? {}
          if (item.type === "function_call") {
            const callId = item.call_id ?? item.id ?? ""
            if (!slots.has(callId)) { slots.set(callId, { id: callId, name: item.name ?? "", arguments: "" }); order.push(callId) }
            if (item.id) itemToCall.set(item.id, callId)
          }
          break
        }
        case "response.output_text.delta":
          onToken?.(ev.delta ?? "")
          result.content += ev.delta ?? ""
          break
        case "response.content_part.delta": {
          // OpenRouter 变体（2026-08-31）：content_part.delta + part.type 区分 + response.done 收尾
          const part = ev.part ?? {}
          if (part.type === "reasoning_text") { onReasoning?.(ev.delta ?? ""); result.reasoning += ev.delta ?? "" }
          else { onToken?.(ev.delta ?? ""); result.content += ev.delta ?? "" }
          break
        }
        case "response.done":
          seal(ev.response); sealed = true
          break
        case "response.reasoning_text.delta":
          onReasoning?.(ev.delta ?? "")
          result.reasoning += ev.delta ?? ""
          break
        case "response.function_call_arguments.delta": {
          const callId = itemToCall.get(ev.item_id ?? "")
          const slot = callId ? slots.get(callId) : null
          if (slot) slot.arguments += ev.delta ?? ""
          break
        }
        case "response.output_item.done": {
          const item = ev.item ?? {}
          if (item.type === "function_call") {
            const slot = slots.get(item.call_id ?? item.id ?? "")
            if (slot && item.arguments && item.arguments !== slot.arguments) slot.arguments = item.arguments
          } else if (item.type === "web_search_call") {
            result.builtinToolResults.push({
              id: item.id ?? "",
              query: item.action?.query ?? "",
              status: item.status ?? "completed",
              sources: item.action?.sources ?? [],
            })
          }
          break
        }
        case "response.completed":
          seal(ev.response); sealed = true
          break
        case "response.incomplete":
          seal(ev.response); sealed = true
          // 非长度原因（content_filter 等）不能报成 length（与 CLI 同修，评审 #5）
          result.finishReason = ev.response?.incomplete_details?.reason === "content_filter" ? "content_filter" : "length"
          break
        case "response.failed": {
          const err = ev.response?.error
          const e = new Error(`responses API failed: ${err?.message ?? JSON.stringify(err ?? {}).slice(0, 500)}`)
          e.status = err?.code
          throw e
        }
        default:
          break
      }
    }
  }
  } catch (e) {
    // 用户 Ctrl+I 中断：与 CLI/core 同构——提交已生成部分（agent 层 interrupted 分支消费），
    // 不丢已流出的 token；超时/网络错误仍照常抛（评审 #3）
    if (e?.name === "AbortError" && signal?.reason?.interrupt) {
      if (!sealed) seal(null)
      return { ...result, interrupted: true, interruptMessage: signal.reason.message }
    }
    throw e
  } finally {
    if (idleTimer) clearTimeout(idleTimer)
  }
  // 尾部分帧（无 \n\n 定界）：与 CLI 同义——error/failed 帧的错误必须传播，静默吞 = 空内容当回复（评审 #6）
  buffer += decoder.decode()
  const tail = buffer.split("\n").filter((l) => l.startsWith("data:")).map((l) => l.slice(5).trim()).join("\n")
  if (tail) {
    try {
      const evTail = JSON.parse(tail)
      if (evTail.type === "response.failed") {
        const errE = evTail.response?.error
        const e2 = new Error(`responses API failed: ${errE?.message ?? JSON.stringify(errE ?? {}).slice(0, 500)}`)
        e2.status = errE?.code
        throw e2
      }
      switch (evTail.type) {
        case "response.completed":
        case "response.done":
          if (!sealed) { seal(evTail.response ?? evTail); sealed = true }
          break
        case "response.incomplete":
          if (!sealed) { seal(evTail.response ?? evTail); sealed = true }
          result.finishReason = evTail.response?.incomplete_details?.reason === "content_filter" ? "content_filter" : "length"
          break
      }
    } catch (err) {
      if (err?.name === "SyntaxError") { /* 非 JSON 尾碎，忽略 */ }
      else throw err
    }
  }
  if (!sealed) seal(null)
  return result
}
