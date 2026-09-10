/**
 * transports/openai.mjs — OpenAI-compatible API transport
 * Used by: DeepSeek, Kimi, GLM, Qwen, MiniMax, OpenAI, custom providers
 */

import { specForModel } from "../../specs.mjs"
import { resolveEnableThinking } from "../../config.mjs"

/**
 * Provider-level pre-flight error (MODEL-400-FIX F-1 — 请求体组装前断言): carries the
 * provider identity so a fail-fast throw is readable ("which provider + what to fix")
 * instead of a wire-time serde 400. CLI parity: CLI side lives in provider/errors.mjs.
 */
export class ProviderError extends Error {
  constructor(provider, message) {
    super(`provider "${provider?.name ?? provider?.model ?? "unknown"}": ${message}`)
    this.name = "ProviderError"
  }
}

/** Convert our tool schemas to OpenAI format */
export function normalizeTools(tools) {
  return tools
}

/** Build the HTTP request */
export function buildRequest(provider, messages, tools, { toolChoice, parallelToolCalls } = {}) {
  // F-1 (MODEL-400-FIX — docs/design/MODEL-400-FIX.md) 根因兜底：渠道裸克隆
  // （`{...渠道}` 未重派生 .model 时 provider.model 为 undefined/null）——JSON.stringify
  // 会丢 undefined 键 → 无 model 请求 → serde 400。fail-fast 报可读错误（带 provider 名 +
  // 修复线索），不发病体。MODEL-SELECTION：渠道单值 `providers[].model` 与新形态兜底链
  // （resolveDefaultModel / 父 provider 兜底）已在克隆点补齐；本 guard 是最后一道防御。
  if (!provider.model) {
    throw new ProviderError(provider, "model is undefined — the provider clone has no model; set providers[].model, the session model, or an explicit provider:model")
  }
  const spec = specForModel(provider.model)
  const body = {
    model: provider.model,
    messages,
    stream: true,
    ...(spec.noUsageStream ? {} : { stream_options: { include_usage: true } }),
  }
  if (provider.maxTokens) body.max_tokens = provider.maxTokens
  if (provider.temperature != null) {
    let t = provider.temperature
    if (spec.tempRange) {
      t = Math.min(spec.tempRange[1], Math.max(spec.tempRange[0], t))
      t = Math.round(t * 100) / 100
    }
    body.temperature = t
  }
  // Spec-driven thinking default: models with thinking:true (GLM/Kimi/…) must get
  // an explicit thinking:{type:"enabled"} even when the provider entry doesn't
  // carry one — without it GLM silently skips deep thinking entirely (reasoning
  // never streams; everything lands in content). Explicit provider.thinking
  // (including null from the panel's "off") always wins.
  if (provider.thinking) body.thinking = provider.thinking
  else if (spec.thinking && provider.thinking === undefined) body.thinking = { type: spec.thinkEnabledValue || "enabled" }
  if (provider.reasoningEffort) body.reasoning_effort = provider.reasoningEffort
  // enable_thinking — Bailian hybrid-thinking switch (CLI parity, PROVIDER.md §12): qwen3.x
  // defaults to thinking ON, so an explicit panel off (thinking:null) must send
  // enable_thinking:false or the server silently keeps thinking.
  const enableThinking = resolveEnableThinking(provider, spec)
  if (enableThinking !== undefined) body.enable_thinking = enableThinking
  if (tools?.length) body.tools = tools
  if (provider.responseFormat) body.response_format = provider.responseFormat
  // 2026-08-31：tool_choice 能力层（"auto"/"required"/"none"/{type:"function",function:{name}}）
  // 直接透传 OpenAI 语义；parallel_tool_calls 仅显式 true 时发送（默认不发=不改变现有行为）
  if (toolChoice !== undefined) body.tool_choice = toolChoice
  if (parallelToolCalls === true) body.parallel_tool_calls = true

  return {
    url: `${provider.baseURL}${provider.chatPath ?? "/chat/completions"}`,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${provider.apiKey}`,
    },
    body: JSON.stringify(body),
  }
}

/**
 * Normalize provider cache fields into DeepSeek-style prompt_cache_hit/miss_tokens.
 * DeepSeek already returns these; OpenAI/Kimi report the cache hit as
 * prompt_tokens_details.cached_tokens; a few providers put cached_tokens at the
 * usage top level. Miss is derived as prompt_tokens - hit when not reported.
 */
export function normalizeUsageCache(u) {
  if (!u || u.prompt_cache_hit_tokens !== undefined) return u
  const cached = u.prompt_tokens_details?.cached_tokens ?? u.cached_tokens
  if (cached === undefined) return u
  u.prompt_cache_hit_tokens = cached
  if (u.prompt_cache_miss_tokens === undefined && typeof u.prompt_tokens === "number") {
    u.prompt_cache_miss_tokens = Math.max(0, u.prompt_tokens - cached)
  }
  return u
}
/** Defensive tool-call merge (parity with CLI PROVIDER.md §10): skip null/malformed and
 *  count, merge slots by index / id / name / tail, accumulate arguments. */
function mergeToolCalls(result, delta) {
  for (const tc of delta.tool_calls ?? []) {
    if (!tc || typeof tc !== "object") { result.droppedToolCalls++; continue }
    let slot
    if (Number.isInteger(tc.index) && tc.index >= 0) {
      slot = (result.toolCalls[tc.index] ??= { id: "", name: "", arguments: "" })
    } else if (tc.id) {
      slot = result.toolCalls.find((s) => s && s.id === tc.id)
      if (!slot) { slot = { id: tc.id, name: "", arguments: "" }; result.toolCalls.push(slot) }
    } else if (tc.function?.name) {
      slot = { id: "", name: "", arguments: "" }
      result.toolCalls.push(slot)
    } else {
      slot = result.toolCalls[result.toolCalls.length - 1]
      if (!slot) { result.droppedToolCalls++; continue }
    }
    if (tc.id && !slot.id) slot.id = tc.id
    if (tc.function?.name && !slot.name) slot.name = tc.function.name
    const arg = tc.function?.arguments
    if (typeof arg === "string") slot.arguments += arg
    else if (arg != null) slot.arguments += JSON.stringify(arg)
  }
}

/** Finalize tool calls: drop nameless slots, synthesize missing ids, count drops.
 *  The machine-line warning is surfaced upstream in agent.mjs (ARCHITECTURE.md §279-313). */
function finalizeToolCalls(result) {
  const entries = result.toolCalls.filter((tc) => tc) // drop sparse holes (rule-1 index jumps)
  const kept = entries.filter((tc) => tc.name) // drop nameless slots
  result.droppedToolCalls = (result.droppedToolCalls ?? 0) + (entries.length - kept.length)
  result.toolCalls = kept
  const used = new Set(kept.map((tc) => tc.id).filter(Boolean))
  let seq = 0
  for (const tc of kept) {
    if (!tc.id) {
      let id
      do { id = `call_${seq++}` } while (used.has(id))
      tc.id = id
      used.add(id)
    }
  }
}

/**
 * Parse OpenAI SSE stream. Returns { content, reasoning, toolCalls, usage, finishReason }.
 * Reads the full response body; calls onToken/onReasoning callbacks per chunk.
 * `signal` (CLI parity, sse.mjs): every chunk checks aborted; additionally the
 * read loop races an abort promise so a Stop interrupts even a SILENT stream
 * (server accepted, no data — the for-await would otherwise hang).
 */
export async function parseStream(response, { onToken, onReasoning, signal }) {
  const result = { content: "", reasoning: "", toolCalls: [], droppedToolCalls: 0, usage: null, finishReason: null }
  const decoder = new TextDecoder()
  let buffer = ""
  let hasChoices = false

  // 2026-08-31 会诊（CLI 465b9c3 #3 对齐）：网关无视 stream:true 返回完整 JSON completion
  // （内容在 choice.message）时，原实现只会抛 "Response is not SSE" 整轮报废。
  // 触发条件收窄：content-type 明确为 JSON/HTML 等非 event-stream 才拦截（部分 mock/网关
  // 不设 content-type 但 body 是 SSE——unknown 类型必须走流路径，否则 body 被消费无法回退）。
  // 注意：此分支消费了 body——要么 return 要么 throw，绝不可回落 readLoop（body 已锁）。
  const contentType = (response.headers.get("content-type") || "").replace(/;.*$/, "").trim().toLowerCase()
  if (contentType && !contentType.includes("event-stream")) {
    const raw = await response.text().catch(() => "")
    if (raw) {
      try {
        const parsed = JSON.parse(raw)
        const choice = parsed.choices?.[0]
        if (choice) {
          const src = choice.delta ?? choice.message ?? {}
          result.content = src.content ?? ""
          result.reasoning = src.reasoning_content ?? src.reasoning ?? ""
          result.finishReason = choice.finish_reason ?? null
          result.usage = normalizeUsageCache(parsed.usage ?? null)
          mergeToolCalls(result, src)
          if (result.content) onToken?.(result.content)
          if (result.reasoning) onReasoning?.(result.reasoning)
          finalizeToolCalls(result)
          return result
        }
      } catch { /* not parseable JSON — error reporting below */ }
    }
    let errorMsg = ""
    try {
      const parsed = raw ? JSON.parse(raw) : null
      errorMsg = parsed?.error?.message
        || parsed?.base_resp?.status_msg
        || parsed?.detail
        || parsed?.message
        || parsed?.msg
        || (typeof parsed.error === "string" ? parsed.error : "")
    } catch { /* not JSON */ }
    if (!errorMsg) errorMsg = `unexpected non-SSE response (${contentType || "unknown"}): ${raw.slice(0, 200)}`
    throw new Error(`API error: ${errorMsg}`)
  }

  const abortError = () => {
    const e = new DOMException("The operation was aborted", "AbortError")
    e.reason = signal?.reason
    return e
  }

  /** 处理一个完整 SSE 事件（data 行以 \n 拼接——2026-08-31 会诊 #8/#9/#7：
   *  多行 data 支持（原逐行 parse 丢后半段）、reasoning 方言（delta.reasoning）、
   *  BOM 剥除在 readLoop 统一做）。单行事件行为与原本一致。 */
  const handleEvent = (data) => {
    if (!data || data === "[DONE]") return
    let json
    try { json = JSON.parse(data) } catch { return }

    if (json.usage) result.usage = normalizeUsageCache(json.usage)
    const choice = json.choices?.[0]
    if (!choice) return
    hasChoices = true
    if (choice.finish_reason) result.finishReason = choice.finish_reason

    const delta = choice.delta ?? choice.message ?? {}
    const rDelta = delta.reasoning_content ?? delta.reasoning
    if (rDelta) {
      result.reasoning += rDelta
      onReasoning?.(rDelta)
    }
    if (delta.content) {
      result.content += delta.content
      onToken?.(delta.content)
    }
    mergeToolCalls(result, delta)
  }

  const processLines = (lines) => {
    let currentData = ""
    for (const line of lines) {
      if (line.startsWith("data:")) {
        const v = line.slice(5).trim()
        if (v === "[DONE]") { currentData = ""; continue }
        currentData = currentData ? currentData + "\n" + v : v
        continue
      }
      if (line === "" && currentData) { handleEvent(currentData); currentData = "" }
    }
    if (currentData) handleEvent(currentData)
  }

  if (!response.body) throw new Error("No stream response body")

  const readLoop = async () => {
    for await (const chunk of response.body) {
      if (signal?.aborted) throw abortError()
      buffer += decoder.decode(chunk, { stream: true })
      // BOM 剥除（2026-08-31 会诊 #7）：首 chunk 可带 \uFEFF，否则首 data 事件被静默丢弃
      if (buffer.charCodeAt(0) === 0xfeff) buffer = buffer.slice(1)
      const lines = buffer.split("\n")
      buffer = lines.pop()
      processLines(lines)
    }
  }

  if (signal) {
    const abortPromise = new Promise((_, reject) => {
      const onAbort = () => reject(abortError())
      signal.addEventListener("abort", onAbort, { once: true })
    })
    try {
      await Promise.race([readLoop(), abortPromise])
    } catch (e) {
      // Interrupt (Ctrl+I, CLI sse.mjs parity): the abort carries reason.interrupt
      // — return the partial result so the agent loop can commit the partial
      // output and inject the user's message, instead of erroring the turn.
      if (e?.name === "AbortError" && signal.reason?.interrupt) {
        result.interrupted = true
        result.interruptMessage = signal.reason.message
        return result
      }
      throw e
    } finally {
      // Abort won the race — release the hanging stream; normal completion is a no-op.
      try { await response.body.cancel() } catch { /* */ }
    }
  } else {
    await readLoop()
  }

  buffer += decoder.decode()
  processLines(buffer.split("\n"))

  if (!hasChoices) {
    const contentType = response.headers.get("content-type") || ""
    let errorMsg = ""
    try {
      const raw = buffer.trim() || ""
      if (raw) {
        const parsed = JSON.parse(raw)
        errorMsg = parsed?.error?.message
          || parsed?.base_resp?.status_msg
          || parsed?.detail
          || parsed?.message
          || parsed?.msg
          || (typeof parsed.error === "string" ? parsed.error : "")
      }
    } catch {}
    if (!errorMsg && !contentType.includes("event-stream")) {
      errorMsg = `Response is not SSE (Content-Type: ${contentType || "unknown"})`
    }
    if (errorMsg) throw new Error(`API error: ${errorMsg}`)
  }

  finalizeToolCalls(result)
  return result
}
