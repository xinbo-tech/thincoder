/**
 * transports/anthropic.mjs — Anthropic Messages API transport (Claude)
 * Endpoint: POST https://api.anthropic.com/v1/messages
 * Docs: https://docs.anthropic.com/en/api/messages
 */

import { specForModel } from "../../specs.mjs"

/** 读侧 idle 看门狗（群 A 批——绝对墙钟废除后的 body 停摆守卫）：连续 READ_IDLE_MS
 *  无 chunk → TimeoutError 判死；测试缝 = parseStream 的 idleMs 参数（生产缺省）。 */
const READ_IDLE_MS = 120_000

const ANTHROPIC_VERSION = "2023-06-01"

/** OpenAI 语义 tool_choice → Anthropic tool_choice（2026-08-31 能力层）。
 *  传入值形态：undefined | "auto" | "required" | "none" | {type:"function",function:{name}} */
function mapToolChoice(choice) {
  if (choice === "auto") return { type: "auto" }
  if (choice === "required") return { type: "any" }
  if (choice === "none") return { type: "none" }
  if (choice && typeof choice === "object" && choice.function?.name) return { type: "tool", name: choice.function.name }
  throw new Error(`Invalid tool_choice for Anthropic format: ${JSON.stringify(choice).slice(0, 120)}`)
}


/** Convert OpenAI-format tools to Anthropic format */
export function normalizeTools(tools) {
  return (tools || []).map((t) => ({
    name: t.function.name,
    description: t.function.description || "",
    input_schema: t.function.parameters || { type: "object", properties: {} },
  }))
}

/** Build the HTTP request for Anthropic Messages API */
export function buildRequest(provider, messages, tools, { toolChoice } = {}) {
  // Extract system message(s) — Anthropic uses a top-level `system` field
  const systemMessages = []
  const chatMessages = []
  for (const m of messages) {
    if (m.role === "system") {
      systemMessages.push(typeof m.content === "string" ? m.content : JSON.stringify(m.content))
    } else {
      chatMessages.push(m)
    }
  }

  const body = {
    model: provider.model,
    messages: chatMessages,
    stream: true,
    max_tokens: provider.maxTokens || 8192,
  }
  if (systemMessages.length > 0) body.system = systemMessages.join("\n\n")
  if (provider.temperature != null) {
    const spec = specForModel(provider.model)
    let t = provider.temperature
    if (spec.tempRange) {
      t = Math.min(spec.tempRange[1], Math.max(spec.tempRange[0], t))
      t = Math.round(t * 100) / 100
    }
    body.temperature = t
  }
  if (tools?.length) body.tools = tools
  // 2026-08-31：tool_choice 能力层映射——OpenAI 语义 → Anthropic tool_choice：
  // auto→{type:"auto"} / required→{type:"any"} / none→{type:"none"} /
  // {type:"function",function:{name}}→{type:"tool",name:…}（Anthropic 只支持单 tool）
  if (toolChoice !== undefined) body.tool_choice = mapToolChoice(toolChoice)

  // Anthropic uses x-api-key header, not Bearer
  return {
    url: `${provider.baseURL}/messages`,
    headers: {
      "Content-Type": "application/json",
      "x-api-key": provider.apiKey,
      "anthropic-version": ANTHROPIC_VERSION,
    },
    body: JSON.stringify(body),
  }
}

/**
 * Parse Anthropic SSE stream (server-sent events).
 * Events: message_start, content_block_start, content_block_delta, content_block_stop, message_delta, message_stop
 */
export async function parseStream(response, { onToken, onReasoning, signal, idleMs: idleOpt }) {
  const result = { content: "", reasoning: "", toolCalls: [], usage: null, finishReason: null }
  const decoder = new TextDecoder()
  let buffer = ""

  // Map block index → tool call accumulator
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
        if (json.delta?.stop_reason) result.finishReason = json.delta.stop_reason === "end_turn" ? "stop" : json.delta.stop_reason
        break
      case "message_stop":
        // Final event — tool calls are complete
        for (const [, block] of toolBlocks) {
          result.toolCalls.push({
            id: block.id,
            name: block.name,
            arguments: block.arguments,
          })
        }
        break
    }
  }

  if (!response.body) throw new Error("No stream response body")
  let currentEvent = ""
  let currentData = ""

  // 读侧 idle 看门狗（群 A 批）：每 chunk 重置；连续 idleMs 无数据 → TimeoutError。
  // releaseBody 兼容两种 body：Node 流（代理路径 PassThrough——destroy）与 Web 流（直连
  // undici ReadableStream——无 destroy，退 cancel）；race 保证两种形态都以 TimeoutError
  // 终止读循环。idleMs ≤ 0 = 关闭（测试缝）。
  const idleMs = idleOpt ?? READ_IDLE_MS
  const idleError = () => new DOMException(`SSE idle timeout: no data for ${idleMs / 1000}s`, "TimeoutError")
  let idleTimer = null
  let rejectIdle = null
  const idlePromise = new Promise((_, reject) => { rejectIdle = reject })
  const releaseBody = (err) => {
    try {
      if (typeof response.body?.destroy === "function") response.body.destroy(err)
      else response.body?.cancel?.(err).catch(() => {})
    } catch { /* already gone */ }
  }
  const armIdle = () => {
    if (!(idleMs > 0)) return
    if (idleTimer) clearTimeout(idleTimer)
    idleTimer = setTimeout(() => { const err = idleError(); releaseBody(err); rejectIdle(err) }, idleMs)
    idleTimer.unref?.()
  }
  armIdle()

  const abortErr = () => {
    const e = new DOMException("The operation was aborted", "AbortError")
    e.reason = signal?.reason
    return e
  }

  const readLoop = async () => {
    for await (const chunk of response.body) {
      armIdle()
      if (signal?.aborted) throw abortErr()
      buffer += decoder.decode(chunk, { stream: true })
      // BOM 剥除（2026-08-31 会诊 #7）：首 chunk 可带 \uFEFF，否则 message_start 事件
      //（含 usage）被静默丢弃
      if (buffer.charCodeAt(0) === 0xfeff) buffer = buffer.slice(1)
      const lines = buffer.split("\n")
      buffer = lines.pop()

      for (const line of lines) {
        if (line.startsWith("event: ")) {
          // Flush previous event
          if (currentEvent) processEvent(currentEvent, currentData)
          currentEvent = line.slice(7).trim()
          currentData = ""
        } else if (line.startsWith("data: ")) {
          currentData = line.slice(6).trim()
        } else if (line === "" || line === "\r") { // CRLF 空行是 "\r"（2026-08-31 会诊 #12）
          // Empty line = event separator
          if (currentEvent) processEvent(currentEvent, currentData)
          currentEvent = ""
          currentData = ""
        }
      }
    }
  }

  if (signal) {
    // Race the read loop against the abort — a Stop interrupts even a silent
    // stream (no chunks arriving) that the for-await would otherwise hang on.
    const abortPromise = new Promise((_, reject) => {
      const onAbort = () => reject(abortErr())
      signal.addEventListener("abort", onAbort, { once: true })
    })
    try {
      await Promise.race([readLoop(), abortPromise, idlePromise])
    } catch (e) {
      // Interrupt (Ctrl+I): return the partial result so the agent loop commits it
      // and injects the user's message, instead of erroring the turn (CLI parity).
      if (e?.name === "AbortError" && signal.reason?.interrupt) {
        result.interrupted = true
        result.interruptMessage = signal.reason.message
        return result
      }
      throw e
    } finally {
      if (idleTimer) clearTimeout(idleTimer)
      try { await response.body.cancel() } catch { /* normal completion — no-op */ }
    }
  } else {
    try {
      await Promise.race([readLoop(), idlePromise])
    } finally {
      if (idleTimer) clearTimeout(idleTimer)
    }
  }

  // Flush remaining
  buffer += decoder.decode()
  for (const line of buffer.split("\n")) {
    if (line.startsWith("event: ")) {
      if (currentEvent) processEvent(currentEvent, currentData)
      currentEvent = line.slice(7).trim()
      currentData = ""
    } else if (line.startsWith("data: ")) {
      currentData = line.slice(6).trim()
    }
  }
  if (currentEvent) processEvent(currentEvent, currentData)

  return result
}
