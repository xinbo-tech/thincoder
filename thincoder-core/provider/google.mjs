/**
 * provider/google.mjs — Google Gemini API transport
 * Endpoint: POST https://generativelanguage.googleapis.com/v1beta/models/{model}:streamGenerateContent
 * Docs: https://ai.google.dev/gemini-api/docs
 */

import { proxyFetch } from "../proxy.mjs"
import { requestWithRetry } from "./retry.mjs"
import { effectiveFetchTimeoutMs } from "./core.mjs"
import { abortError, timeoutError } from "../abort-provenance.mjs"
import { terminateBody } from "../stream-destroy.mjs"

/** OpenAI 语义 tool_choice → Gemini FunctionCallingConfig（2026-08-31 能力层）。 */
function mapFunctionCallingConfig(choice) {
  if (choice === "auto") return { mode: "AUTO" }
  if (choice === "required") return { mode: "ANY" }
  if (choice === "none") return { mode: "NONE" }
  if (choice && typeof choice === "object" && choice.function?.name) return { mode: "ANY", allowedFunctionNames: [choice.function.name] }
  throw new Error(`Invalid tool_choice for Gemini format: ${JSON.stringify(choice).slice(0, 120)}`)
}


/** Convert OpenAI-format tools to Gemini format */
export function normalizeTools(tools) {
  if (!tools?.length) return null
  return [{
    functionDeclarations: tools.map((t) => ({
      name: t.function.name,
      description: t.function.description || "",
      parameters: t.function.parameters || { type: "object", properties: {} },
    })),
  }]
}

/**
 * Convert OpenAI-format messages to Gemini contents array.
 * Gemini: [{ role: "user"|"model", parts: [{ text }] }]
 * system → systemInstruction (top-level in request body)
 */
export function convertMessages(messages) {
  const contents = []
  for (const m of messages) {
    // system messages are hoisted to systemInstruction by the caller — check the
    // ORIGINAL role (the remapped role below can never be "system")
    if (m.role === "system") continue
    const role = m.role === "assistant" ? "model" : "user"

    const parts = []
    if (typeof m.content === "string") {
      parts.push({ text: m.content })
    } else if (Array.isArray(m.content)) {
      for (const part of m.content) {
        if (part.type === "text") parts.push({ text: part.text })
        else if (part.type === "image_url") {
          const url = part.image_url?.url || ""
          const mimeMatch = url.match(/^data:([^;]+);base64,(.+)$/)
          if (mimeMatch) {
            parts.push({ inlineData: { mimeType: mimeMatch[1], data: mimeMatch[2] } })
          }
        }
      }
    }
    if (parts.length === 0) continue

    // Gemini doesn't allow consecutive same-role messages; merge
    const last = contents[contents.length - 1]
    if (last?.role === role) {
      last.parts.push(...parts)
    } else {
      contents.push({ role, parts })
    }
  }
  return contents
}

/** Build and send a Gemini chat request. Returns the same shape as core.mjs chat.
 *  2026-08-31 会诊 #6：接入 rateGate/recordRate（原实现完全绕过 TPM/RPM 闸门）。 */
export async function chat(provider, { messages, tools, onToken, onReasoning, onWait, signal, toolChoice }) {
  const systemMessages = messages.filter((m) => m.role === "system")
  const contents = convertMessages(messages)

  const body = {
    contents,
    generationConfig: {
      ...(provider.temperature != null ? { temperature: provider.temperature } : {}),
      ...(provider.maxTokens ? { maxOutputTokens: provider.maxTokens } : {}),
    },
    safetySettings: [
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
    ],
  }
  if (systemMessages.length > 0) {
    body.systemInstruction = {
      parts: [{ text: systemMessages.map((m) => m.content).join("\n\n") }],
    }
  }
  if (tools?.length) body.tools = tools
  // 2026-08-31：tool_choice 能力层 → Gemini toolConfig.functionCallingConfig
  if (toolChoice !== undefined) {
    body.toolConfig = { functionCallingConfig: mapFunctionCallingConfig(toolChoice) }
  }

  // Gemini uses API key as query parameter
  const url = `${provider.baseURL}/models/${provider.model}:streamGenerateContent?alt=sse&key=${encodeURIComponent(provider.apiKey)}`

  if (signal?.aborted) throw abortError(signal, "provider", "transport-google")

  // 会诊 #6：TPM/RPM 闸门 + 记账
  const { rateGate, recordRate, estimateRequestTokens } = await import("./rate.mjs")
  const estimated = estimateRequestTokens({ messages })
  await rateGate(provider, estimated, onWait, signal)

  // 2026-08-31：5xx/网络与 OpenAI 格式统一退避重试链（原完全无重试——Gemini 高峰
  // 503 直接抛错崩溃整个 turn）
  const response = await requestWithRetry(
    () => proxyFetch(url, {
      method: "POST",
      headers: { ...(provider.headers ?? {}), "Content-Type": "application/json" }, // 定制头展开（PROVIDER.md §21）——定制头在前、内置头在后：内置头胜出
      body: JSON.stringify(body),
      // 2026-09-01：同 core.mjs——绝对墙钟废除；响应头阶段 fetchTimeoutMs（600s 默认），body 阶段读侧 idle 管
      signal,
      _headerTimeoutMs: effectiveFetchTimeoutMs(provider),
      _bodyIdleMs: 120_000,
    }, provider.proxyUri),
    { signal, onWait, buildMessage: (status, text) => `Gemini API error ${status}: ${text}` },
  )

  const result = await parseGeminiStream(response, { onToken, onReasoning, signal })
  recordRate(provider, estimated, result.usage)

  const usage = result.usage
  if (usage) {
    return {
      content: result.content,
      reasoning: result.reasoning,
      finishReason: result.finishReason ?? null, // §6.31.7 F-DA5（原三 transport 恒 null——字段值收正）
      usage: {
        prompt_tokens: usage.prompt_tokens ?? 0,
        completion_tokens: usage.completion_tokens ?? 0,
        total_tokens: usage.total_tokens ?? 0,
      },
      toolCalls: result.toolCalls,
    }
  }

  return { content: result.content, reasoning: result.reasoning, finishReason: result.finishReason ?? null, toolCalls: result.toolCalls }
}

/** Gemini `finishReason` ⇒ 核统一 `finishReason`（§6.31.7 F-DA5——归一只喂既有分类；
 *  余者原样透传）。缺席 ⇒ null（缺席支 = agent/run-stages.mjs 同面提醒 + 留痕）。 */
function mapGeminiFinishReason(reason) {
  if (reason === "STOP") return "stop"
  if (reason === "MAX_TOKENS") return "length"
  return reason
}

/**
 * Parse Gemini SSE stream.
 * Format: data: {...}\n\n (each line is a complete JSON object)
 */
async function parseGeminiStream(response, { onToken, onReasoning, signal }) {
  const result = { content: "", reasoning: "", toolCalls: [], usage: null, finishReason: null }
  const decoder = new TextDecoder()
  let buffer = ""

  const processData = (data) => {
    let json
    try { json = JSON.parse(data) } catch { return }
    if (!json) return

    if (json.usageMetadata) {
      result.usage = {
        prompt_tokens: json.usageMetadata.promptTokenCount || 0,
        completion_tokens: json.usageMetadata.candidatesTokenCount || 0,
        total_tokens: json.usageMetadata.totalTokenCount || 0,
      }
    }

    const candidate = json.candidates?.[0]
    if (!candidate) return
    // §6.31.7 F-DA5（#929 · 批 digest-accounting）：`candidate.finishReason` 捕获——缺席 ⇒ 留 null（窄口）
    if (candidate.finishReason) result.finishReason = mapGeminiFinishReason(candidate.finishReason)

    const parts = candidate.content?.parts || []
    for (const part of parts) {
      if (part.thought === true && part.text) {
        result.reasoning += part.text
        onReasoning?.(part.text)
      } else if (part.text) {
        result.content += part.text
        onToken?.(part.text)
      } else if (part.functionCall) {
        let slot = result.toolCalls.find((tc) => tc.name === part.functionCall.name)
        if (!slot) {
          slot = { id: part.functionCall.name + "_" + result.toolCalls.length, name: part.functionCall.name, arguments: JSON.stringify(part.functionCall.args || {}) }
          result.toolCalls.push(slot)
        }
        // §6.24 原生路签名捕获（字段名 `thoughtSignature`——官方口径 unverified；在场才建 ⇒ 字段名不符零副作用）
        if (typeof part.thoughtSignature === "string" && part.thoughtSignature) {
          slot.extra_content = { google: { thought_signature: part.thoughtSignature } }
        }
      }
    }
  }

  if (!response.body) throw new Error("No stream response body")
  // 2026-09-01 读侧 idle 超时（同 sse.mjs）：body 有数据流动即不超时；连续 120s 无新 chunk 判死
  const READ_IDLE_MS = 120_000
  let idleTimer = null
  let idleError = null
  const armIdle = () => {
    if (idleTimer) clearTimeout(idleTimer)
    idleTimer = setTimeout(() => {
      // #878：断流单点分流——直连 fetch（web 流）走 `IDLE_ABORT` 内部 abort 通道；
      // proxy 形回落 destroyBody（原契约）。相位串 = 本腿专属 google-sse-idle。
      idleError = timeoutError(`SSE idle timeout: no data for ${READ_IDLE_MS / 1000}s`, "provider", "google-sse-idle")
      try { terminateBody(response, idleError) } catch { /* already gone */ }
    }, READ_IDLE_MS)
    idleTimer.unref?.()
  }
  armIdle()
  try {
    for await (const chunk of response.body) {
      armIdle()
      if (signal?.aborted) {
        throw abortError(signal, "provider", "transport-google")
      }
      buffer += decoder.decode(chunk, { stream: true })
      // BOM 剥除（会诊 #12）：首个 chunk 可能带 \uFEFF，否则首个 data 事件静默丢失
      if (buffer.charCodeAt(0) === 0xfeff) buffer = buffer.slice(1)
      const lines = buffer.split("\n")
      buffer = lines.pop()

      for (const line of lines) {
        if (!line.startsWith("data:")) continue
        const data = line.slice(5).trim()
        if (!data || data === "[DONE]") continue
        processData(data)
      }
    }
    buffer += decoder.decode()
    for (const line of buffer.split("\n")) {
      if (!line.startsWith("data:")) continue
      const data = line.slice(5).trim()
      if (!data || data === "[DONE]") continue
      processData(data)
    }
  } catch (e) {
    if (idleTimer) clearTimeout(idleTimer)
    if (e.name === "AbortError" && signal?.reason?.interrupt) {
      result.interrupted = true
      result.interruptMessage = signal.reason.message
      return result
    }
    // #878：看门狗终结两径归一（idleFired）——无内容 ⇒ idle 超时错误；有内容 ⇒ partial
    //（已流出内容保留，不整轮报废）。非 idle 错误照旧走下方 hasPartial 径（原语义零变）。
    if (idleError) {
      if (result.content || result.reasoning || result.toolCalls.length) {
        result.partial = true
        result.networkError = idleError.message ?? String(idleError)
        return result
      }
      throw idleError
    }
    if (hasPartial(e)) {
      result.partial = true
      result.networkError = e.message ?? String(e)
      return result
    }
    throw e
  } finally {
    if (idleTimer) clearTimeout(idleTimer)
  }

  return result
}

/** google.mjs 无 hasChoices 追踪——非 idle 网络错误按文案判 partial（同 sse.mjs 语义的简化版）；
 *  idle 径两分（有内容 ⇒ partial ∥ 无内容 ⇒ 超时错误）归 catch（#878）。 */
function hasPartial(e) {
  return /ECONNRESET|terminated|idle timeout|network/i.test(e?.message ?? "")
}
