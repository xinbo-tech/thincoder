/**
 * transports/google.mjs — Google Gemini API transport
 * Endpoint: POST https://generativelanguage.googleapis.com/v1beta/models/{model}:streamGenerateContent
 * Docs: https://ai.google.dev/gemini-api/docs
 */

/** 读侧 idle 看门狗（群 A 批——绝对墙钟废除后的 body 停摆守卫）：连续 READ_IDLE_MS
 *  无 chunk → TimeoutError 判死；测试缝 = parseStream 的 idleMs 参数（生产缺省）。 */
const READ_IDLE_MS = 120_000

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
 * Gemini uses: [{ role: "user"|"model", parts: [{ text: "..." }] }]
 * system messages go into systemInstruction.
 */
function convertMessages(messages) {
  const contents = []
  for (const m of messages) {
    const role = m.role === "assistant" ? "model" : "user"
    if (role === "system") continue // handled separately

    const parts = []
    if (typeof m.content === "string") {
      parts.push({ text: m.content })
    } else if (Array.isArray(m.content)) {
      for (const part of m.content) {
        if (part.type === "text") parts.push({ text: part.text })
        else if (part.type === "image_url") {
          // Convert to Gemini inline_data format
          const url = part.image_url?.url || ""
          const mimeMatch = url.match(/^data:([^;]+);base64,(.+)$/)
          if (mimeMatch) {
            parts.push({ inlineData: { mimeType: mimeMatch[1], data: mimeMatch[2] } })
          }
        }
      }
    }

    // Gemini doesn't allow consecutive same-role messages; merge if needed
    const last = contents[contents.length - 1]
    if (last?.role === role) {
      last.parts.push(...parts)
    } else {
      contents.push({ role, parts })
    }
  }
  return contents
}

/** Build the HTTP request for Gemini API */
export function buildRequest(provider, messages, tools, { toolChoice } = {}) {
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
  // 2026-08-31：tool_choice 能力层 → Gemini toolConfig.functionCallingConfig：
  // auto→AUTO / required→ANY / none→NONE / {type:"function",function:{name}}→ANY+allowedFunctionNames
  if (toolChoice !== undefined) {
    body.toolConfig = { functionCallingConfig: mapFunctionCallingConfig(toolChoice) }
  }

  // Gemini uses API key as query parameter, not header
  const url = `${provider.baseURL}/models/${provider.model}:streamGenerateContent?alt=sse&key=${encodeURIComponent(provider.apiKey)}`

  return {
    url,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }
}

/**
 * Parse Gemini SSE stream.
 * Gemini SSE format: data: {...}\n\n (each line is a complete JSON object)
 * Response shape: { candidates: [{ content: { parts: [{ text }] }, finishReason }], usageMetadata }
 */
export async function parseStream(response, { onToken, onReasoning, signal, idleMs: idleOpt }) {
  const result = { content: "", reasoning: "", toolCalls: [], usage: null, finishReason: null }
  const decoder = new TextDecoder()
  let buffer = ""

  const processData = (data) => {
    let json
    try { json = JSON.parse(data) } catch { return }
    if (!json) return

    // Usage
    if (json.usageMetadata) {
      result.usage = {
        prompt_tokens: json.usageMetadata.promptTokenCount || 0,
        completion_tokens: json.usageMetadata.candidatesTokenCount || 0,
        total_tokens: (json.usageMetadata.totalTokenCount) || 0,
      }
    }

    const candidate = json.candidates?.[0]
    if (!candidate) return

    if (candidate.finishReason && candidate.finishReason !== "STOP") {
      result.finishReason = candidate.finishReason
    }

    const parts = candidate.content?.parts || []
    for (const part of parts) {
      if (part.thought === true && part.text) {
        // Gemini thinking/reasoning — thought flag + text
        result.reasoning += part.text
        onReasoning?.(part.text)
      } else if (part.text) {
        result.content += part.text
        onToken?.(part.text)
      } else if (part.functionCall) {
        // Gemini returns function calls as discrete objects, not deltas
        const existing = result.toolCalls.find((tc) => tc.name === part.functionCall.name)
        if (!existing) {
          result.toolCalls.push({
            id: part.functionCall.name + "_" + result.toolCalls.length,
            name: part.functionCall.name,
            arguments: JSON.stringify(part.functionCall.args || {}),
          })
        }
      }
    }

    if (candidate.finishReason === "STOP" || candidate.finishReason === "MAX_TOKENS") {
      // On final event with stop reason
      if (!result.finishReason) result.finishReason = candidate.finishReason === "MAX_TOKENS" ? "length" : "stop"
    }
  }

  if (!response.body) throw new Error("No stream response body")

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

  /** 逐事件处理（2026-08-31 会诊 #8 多行 data 拼接：按空行分事件，事件内 data 行按 SSE 规范 \n 拼接） */
  const processDataLines = (lines) => {
    let currentData = ""
    for (const line of lines) {
      if (line.startsWith("data:")) {
        const v = line.slice(5).trim()
        if (v === "[DONE]") { currentData = ""; continue }
        currentData = currentData ? currentData + "\n" + v : v
        continue
      }
      if (line === "" && currentData) { processData(currentData); currentData = "" }
    }
    if (currentData) processData(currentData)
  }

  const readLoop = async () => {
    for await (const chunk of response.body) {
      armIdle()
      if (signal?.aborted) throw abortErr()
      buffer += decoder.decode(chunk, { stream: true })
      // BOM 剥除（2026-08-31 会诊 #7）：首 chunk 可带 \uFEFF，否则首个 data 事件被静默丢弃
      if (buffer.charCodeAt(0) === 0xfeff) buffer = buffer.slice(1)
      const lines = buffer.split("\n")
      buffer = lines.pop()
      processDataLines(lines)
    }
  }

  if (signal) {
    // Race against abort — a Stop interrupts even a silent stream (CLI parity +).
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

  buffer += decoder.decode()
  processDataLines(buffer.split("\n"))

  return result
}
