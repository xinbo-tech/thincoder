/**
 * provider/anthropic.mjs — Anthropic Messages API (Claude)
 * Endpoint: POST https://api.anthropic.com/v1/messages
 * Docs: https://docs.anthropic.com/en/api/messages
 */

import { specForModel } from "../config.mjs"
import { proxyFetch } from "../proxy.mjs"

const ANTHROPIC_VERSION = "2023-06-01"

/** Convert OpenAI-format tools to Anthropic format */
export function normalizeTools(tools) {
  return (tools || []).map((t) => ({
    name: t.function.name,
    description: t.function.description || "",
    input_schema: t.function.parameters || { type: "object", properties: {} },
  }))
}

/** Build and send an Anthropic chat request. Returns the same shape as core.mjs chat.
 *  2026-08-31 会诊 #6：接入 rateGate/recordRate + 429 Retry-After 单次重试
 *  （原实现完全绕过 TPM/RPM 闸门与记账——用户配了 tpm 以为受控实际不受控）。
 *  注：5xx/网络退避重试未与 OpenAI 格式对齐（三 transport 共用那步工作量大，见报告）。 */
export async function chat(provider, { messages, tools, onToken, onReasoning, onWait, signal }) {
  // Extract system message(s) — Anthropic uses top-level `system` field
  const systemMessages = []
  const chatMessages = []
  for (const m of messages) {
    if (m.role === "system") {
      systemMessages.push(typeof m.content === "string" ? m.content : JSON.stringify(m.content))
    } else {
      chatMessages.push(m)
    }
  }

  const spec = specForModel(provider.model)
  const body = {
    model: provider.model,
    messages: chatMessages,
    stream: true,
    max_tokens: provider.maxTokens || (spec.maxOutput || 8192),
  }
  if (systemMessages.length > 0) body.system = systemMessages.join("\n\n")
  if (tools?.length) body.tools = tools
  if (provider.temperature != null) {
    let t = provider.temperature
    // Anthropic API hard limit is 0-1; models without a declared tempRange still get clamped
    const [tMin, tMax] = spec.tempRange ?? [0, 1]
    t = Math.min(tMax, Math.max(tMin, t))
    t = Math.round(t * 100) / 100
    body.temperature = t
  }

  const FETCH_TIMEOUT_MS = 600_000
  const headers = {
    "Content-Type": "application/json",
    "x-api-key": provider.apiKey,
    "anthropic-version": ANTHROPIC_VERSION,
  }

  // Active signal check
  if (signal?.aborted) throw Object.assign(new DOMException("Aborted", "AbortError"), { reason: signal.reason })

  // 会诊 #6：TPM/RPM 闸门 + 记账（rate.mjs 与 OpenAI 格式共用同一窗口）
  const { rateGate, recordRate } = await import("./rate.mjs")
  const estimated = await (async () => {
    const { estimateRequestTokens } = await import("./rate.mjs")
    return estimateRequestTokens(body)
  })()
  await rateGate(provider, estimated, onWait, signal)

  const response = await proxyFetch(`${provider.baseURL}/messages`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal: signal
      ? AbortSignal.any([signal, AbortSignal.timeout(FETCH_TIMEOUT_MS)])
      : AbortSignal.timeout(FETCH_TIMEOUT_MS),
    _headerTimeoutMs: FETCH_TIMEOUT_MS,
    _bodyIdleMs: 120_000,
  }, provider.proxyUri)

  // 会诊 #6：429 尊重 Retry-After 单次重试（OpenAI 格式是完整退避；这里最小对齐）
  if (response.status === 429) {
    const retryAfter = parseRetryAfterSafe(response.headers.get("retry-after"))
    await sleepSafe(retryAfter, signal)
    const retryResponse = await proxyFetch(`${provider.baseURL}/messages`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: signal
        ? AbortSignal.any([signal, AbortSignal.timeout(FETCH_TIMEOUT_MS)])
        : AbortSignal.timeout(FETCH_TIMEOUT_MS),
      _headerTimeoutMs: FETCH_TIMEOUT_MS,
      _bodyIdleMs: 120_000,
    }, provider.proxyUri)
    if (retryResponse.ok) {
      const retryResult = await parseAnthropicStream(retryResponse, { onToken, onReasoning, signal })
      recordRate(provider, estimated, retryResult.usage)
      return finishAnthropic(retryResult)
    }
    // 重试仍失败：报告第二次的响应（body 未被流解析消耗，text() 可读）
    const text = await retryResponse.text().catch(() => "")
    throw new Error(`Anthropic API error ${retryResponse.status}: ${text}`)
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "")
    throw new Error(`Anthropic API error ${response.status}: ${text}`)
  }

  const result = await parseAnthropicStream(response, { onToken, onReasoning, signal })
  recordRate(provider, estimated, result.usage)
  return finishAnthropic(result)
}

/** 可中断 sleep（429 重试等待期间 Ctrl+C 立即生效）。 */
async function sleepSafe(ms, signal) {
  if (!signal) return new Promise((r) => setTimeout(r, ms))
  if (signal.aborted) throw Object.assign(new DOMException("Aborted", "AbortError"), { reason: signal.reason })
  return new Promise((resolve, reject) => {
    let t
    const onAbort = () => { clearTimeout(t); reject(Object.assign(new DOMException("Aborted", "AbortError"), { reason: signal.reason })) }
    signal.addEventListener("abort", onAbort, { once: true })
    t = setTimeout(() => { signal.removeEventListener("abort", onAbort); resolve() }, ms)
  })
}

/** Convert the parsed stream to the core.mjs result shape (usage → OpenAI-compatible). */
function finishAnthropic(result) {
  const usage = result.usage
  if (usage) {
    return {
      content: result.content,
      reasoning: result.reasoning,
      usage: {
        prompt_tokens: usage.input_tokens ?? 0,
        completion_tokens: usage.output_tokens ?? 0,
        total_tokens: (usage.input_tokens ?? 0) + (usage.output_tokens ?? 0),
        prompt_cache_hit_tokens: usage.cache_read_input_tokens ?? 0,
        prompt_cache_miss_tokens: usage.cache_creation_input_tokens ?? 0,
      },
      toolCalls: result.toolCalls,
    }
  }
  return { content: result.content, reasoning: result.reasoning, toolCalls: result.toolCalls }
}

/** Retry-After 解析（秒数或 HTTP-date，上限 300s）；异常退回 15s。 */
function parseRetryAfterSafe(header) {
  if (header == null) return 15_000
  const numeric = Number(header.trim())
  let waitMs = 0
  if (Number.isFinite(numeric) && numeric >= 0) waitMs = numeric * 1000
  else {
    const d = Date.parse(header.trim())
    if (Number.isFinite(d)) waitMs = Math.max(0, d - Date.now())
  }
  if (waitMs <= 0) return 15_000
  return Math.min(waitMs, 300_000)
}

/**
 * Parse Anthropic SSE stream.
 * Events: message_start, content_block_start, content_block_delta, content_block_stop, message_delta, message_stop
 */
async function parseAnthropicStream(response, { onToken, onReasoning, signal }) {
  const result = { content: "", reasoning: "", toolCalls: [], usage: null }
  const decoder = new TextDecoder()
  let buffer = ""
  const toolBlocks = new Map()

  const processEvent = (eventType, data) => {
    if (!data) return
    let json
    try { json = JSON.parse(data) } catch { return }

    switch (eventType) {
      case "message_start":
        if (json.message?.usage) result.usage = json.message.usage
        break
      case "content_block_start": {
        const block = json.content_block
        if (block?.type === "tool_use") {
          toolBlocks.set(json.index, { id: block.id, name: block.name, arguments: "" })
        }
        break
      }
      case "content_block_delta": {
        const delta = json.delta
        if (delta?.type === "text_delta" && delta.text) {
          result.content += delta.text
          onToken?.(delta.text)
        } else if (delta?.type === "thinking_delta" && delta.thinking) {
          result.reasoning += delta.thinking
          onReasoning?.(delta.thinking)
        } else if (delta?.type === "input_json_delta" && delta.partial_json) {
          const block = toolBlocks.get(json.index)
          if (block) block.arguments += delta.partial_json
        }
        break
      }
      case "message_delta":
        if (json.usage) result.usage = json.usage
        break
      case "message_stop":
        for (const [, block] of toolBlocks) {
          result.toolCalls.push({ id: block.id, name: block.name, arguments: block.arguments })
        }
        break
    }
  }

  if (!response.body) throw new Error("No stream response body")
  let currentEvent = ""
  let currentData = ""

  for await (const chunk of response.body) {
    if (signal?.aborted) {
      const e = new DOMException("Aborted", "AbortError")
      e.reason = signal.reason
      throw e
    }
    buffer += decoder.decode(chunk, { stream: true })
    // BOM 剥除（会诊 #12）：首个 chunk 可能带 \uFEFF，否则 message_start 事件被静默丢失（含 usage）
    if (buffer.charCodeAt(0) === 0xfeff) buffer = buffer.slice(1)
    const lines = buffer.split("\n")
    buffer = lines.pop()

    for (const line of lines) {
      if (line.startsWith("event: ")) {
        if (currentEvent) processEvent(currentEvent, currentData)
        currentEvent = line.slice(7).trim()
        currentData = ""
      } else if (line.startsWith("data: ")) {
        currentData = line.slice(6).trim()
      } else if (line === "" || line === "\r") { // CRLF 空行是 "\r"（会诊 #13）
        if (currentEvent) processEvent(currentEvent, currentData)
        currentEvent = ""
        currentData = ""
      }
    }
  }
  // Flush remaining
  buffer += decoder.decode()
  for (const line of buffer.split("\n")) {
    if (line.startsWith("event: ")) {
      if (currentEvent) processEvent(currentEvent, currentData)
      currentEvent = line.slice(7)
    } else if (line.startsWith("data: ")) {
      currentData = line.slice(6)
    }
  }
  if (currentEvent) processEvent(currentEvent, currentData)

  return result
}
