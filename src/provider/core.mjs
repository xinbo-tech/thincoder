/**
 * provider/core.mjs — LLM call core
 * chat / listModels / createProvider / requestWithRetry
 * SSE parsing → provider/sse.mjs
 */

import { specForModel } from "../config.mjs"
import { proxyFetch } from "../proxy.mjs"
import { readSSE } from "./sse.mjs"
export { readSSE } from "./sse.mjs"
import {
  RETRYABLE_STATUS, MAX_RETRIES, MAX_CONTINUATIONS,
  RATE_LIMIT_BACKOFF_MS, _rateHooks,
  estimateRequestTokens, rateGate, recordRate,
} from "./rate.mjs"

const FETCH_TIMEOUT_MS = 600_000

/** Create a validated provider config object from raw config */
export function createProvider(config) {
  if (!config?.baseURL) throw new Error("provider config: baseURL is required — configure providers in ~/.thincoder/config.json")
  if (!config?.apiKey) throw new Error("provider config: apiKey is required — configure it in ~/.thincoder/config.json")
  if (!config?.model) throw new Error("provider config: model is required — configure in ~/.thincoder/config.json")
  return {
    baseURL: config.baseURL.replace(/\/+$/, ""),
    apiKey: config.apiKey,
    model: config.model,
    maxTokens: config.maxTokens,
    temperature: config.temperature,
    thinking: config.thinking,
    reasoningEffort: config.reasoningEffort,
    tpm: config.tpm,
    rpm: config.rpm,
    format: config.format,
    chatPath: config.chatPath,
    proxy: config.proxy,
    proxyUri: config.proxyUri,
  }
}

/** Send a streaming chat completion request with automatic continuation on truncation */
export async function chat(provider, { messages, tools, onToken, onReasoning, onWait, signal, streamRules, firedPatterns }) {
  // Sanitize BEFORE format dispatch — image poisoning bricks anthropic/google sessions
  // the same way it bricks OpenAI-format ones (all raster-only).
  const spec = specForModel(provider.model)
  messages = stripImagesForTextModel(messages, spec)

  // Format dispatch: delegate to non-OpenAI transports
  if (provider.format === "anthropic") {
    const { chat: anthropicChat } = await import("./anthropic.mjs")
    const { normalizeTools } = await import("./anthropic.mjs")
    const result = await anthropicChat(provider, {
      messages,
      tools: tools?.length ? normalizeTools(tools) : null,
      onToken, onReasoning, signal,
    })
    return result
  }
  if (provider.format === "google") {
    const { chat: geminiChat } = await import("./google.mjs")
    const { normalizeTools } = await import("./google.mjs")
    const result = await geminiChat(provider, {
      messages,
      tools: tools?.length ? normalizeTools(tools) : null,
      onToken, onReasoning, signal,
    })
    return result
  }

  messages = normalizeToolPairing(messages)
  // Compile string-pattern rules to RegExp at call time
  const rules = compileStreamRules(streamRules)
  const body = {
    model: provider.model,
    messages,
    stream: true,
  }
  // Skip usage stream for models that don't support it (GLM, MiniMax, Gemini)
  if (!spec.noUsageStream) body.stream_options = { include_usage: true }
  if (provider.maxTokens) body.max_tokens = provider.maxTokens
  if (provider.temperature != null) {
    let t = provider.temperature
    if (spec.tempRange) {
      t = Math.min(spec.tempRange[1], Math.max(spec.tempRange[0], t))
      t = Math.round(t * 100) / 100
    }
    body.temperature = t
  }
  if (provider.thinking) body.thinking = provider.thinking
  // reasoning_effort is a provider-native parameter — routers/proxies (model ID with "/"
  // prefix like kimi/kimi-k3) may misinterpret it, causing empty responses or 400s.
  const isRouter = provider.model.includes("/")
  if (provider.reasoningEffort && !isRouter && provider.format !== "anthropic" && provider.format !== "google") {
    if (spec.reasoningEffortEnum && !spec.reasoningEffortEnum.includes(provider.reasoningEffort)) {
      throw new Error(
        `reasoning_effort "${provider.reasoningEffort}" not supported by model "${provider.model}"; ` +
        `valid values: ${spec.reasoningEffortEnum.join(", ")}`
      )
    }
    body.reasoning_effort = provider.reasoningEffort
  }
  if (tools?.length) body.tools = tools

  const estimated = estimateRequestTokens(body)
  await rateGate(provider, estimated, onWait, signal)

  const response = await requestWithRetry(provider, body, signal, onWait)
  const result = await readSSE(response, { onToken, onReasoning, rules, signal, firedPatterns })
  recordRate(provider, estimated, result.usage)

  // Stream rule triggered or user interrupted mid-generation — return partial result
  if (result.ruleTriggered) return result
  if (result.interrupted) return result

  // Retry on transient server overload (DeepSeek: insufficient_system_resource)
  const MAX_OVERLOAD_RETRIES = 1
  for (let r = 0; result.finishReason === "insufficient_system_resource" && r <= MAX_OVERLOAD_RETRIES; r++) {
    if (r > 0) {
      onWait?.({ phase: "overloaded", seconds: 3 })
      await _rateHooks.sleep(3000)
    }
    const retryResponse = await requestWithRetry(provider, body, signal, onWait)
    const retryResult = await readSSE(retryResponse, { onToken, onReasoning })
    recordRate(provider, estimated, retryResult.usage)
    if (retryResult.finishReason !== "insufficient_system_resource") {
      // Merge any partial content from the failed attempt (streaming already showed it)
      result.content += retryResult.content
      result.reasoning += retryResult.reasoning ?? ""
      for (const tc of retryResult.toolCalls ?? []) {
        const idx = tc.index ?? result.toolCalls.length
        const s = (result.toolCalls[idx] ??= { id: "", name: "", arguments: "" })
        if (tc.id) s.id = tc.id
        s.name += tc.name ?? ""
        s.arguments += tc.arguments ?? ""
      }
      result.finishReason = retryResult.finishReason
      if (retryResult.usage) result.usage = retryResult.usage
      break
    }
    // Retry exhausted — keep the partial result with insufficient_system_resource finish_reason
  }

  if (!spec.partialMode && !spec.prefixMode) return result
  for (let n = 0; result.finishReason === "length" && result.content && n < MAX_CONTINUATIONS; n++) {
    const continued = await chat(spec.prefixMode ? { ...provider, baseURL: betaBaseURL(provider.baseURL) } : provider, {
      messages: [
        ...messages,
        spec.partialMode
          ? {
              role: "assistant",
              content: result.content,
              partial: true,
              ...(result.reasoning ? { reasoning_content: result.reasoning } : {}),
            }
          : { role: "assistant", content: result.content, prefix: true, ...(result.reasoning ? { reasoning_content: result.reasoning } : {}) },
      ],
      tools,
      onToken,
      onReasoning,
      onWait,
      signal,
    })
    result.content += continued.content
    result.reasoning += continued.reasoning ?? ""
    for (const tc of continued.toolCalls ?? []) {
      const idx = tc.index ?? result.toolCalls.length
      const s = (result.toolCalls[idx] ??= { id: "", name: "", arguments: "" })
      if (tc.id) s.id = tc.id
      s.name += tc.name ?? ""
      s.arguments += tc.arguments ?? ""
    }
    result.finishReason = continued.finishReason
    if (continued.usage) {
      const sum = (k) => (result.usage?.[k] ?? 0) + (continued.usage[k] ?? 0)
      result.usage = {
        prompt_tokens: sum("prompt_tokens"),
        completion_tokens: sum("completion_tokens"),
        total_tokens: sum("total_tokens"),
        prompt_cache_hit_tokens: sum("prompt_cache_hit_tokens"),
        prompt_cache_miss_tokens: sum("prompt_cache_miss_tokens"),
      }
    }
  }
  return result
}

/**
 * Replace image parts with text placeholders when they would 400 the request:
 * - the model has no vision support at all (history may carry image_url parts from a
 *   session resumed after switching from a vision model — text-only APIs like DeepSeek
 *   reject the ENTIRE request, bricking the conversation);
 * - the model IS vision-capable but the data URL is not a raster format it can ingest
 *   (Kimi/Anthropic/OpenAI/Gemini are all raster-only — Kimi 400s "unsupported image
 *   format" on EVERY subsequent request once an svg/bmp part sits in history).
 * Sanitize at send time — history itself is left untouched, so switching back to a
 * capable model/format restores the images. Non-data-URL image refs (http) pass through.
 */
const RASTER_IMAGE_URL = /^data:image\/(png|jpe?g|gif|webp);base64,/

export function stripImagesForTextModel(messages, spec) {
  let changed = false
  const out = messages.map((m) => {
    if (!Array.isArray(m.content) || !m.content.some((p) => p?.type === "image_url")) return m
    let msgChanged = false
    const parts = m.content.map((p) => {
      if (p?.type !== "image_url") return p
      const url = p.image_url?.url || ""
      if (!url.startsWith("data:")) return p
      if (spec.multimodal && RASTER_IMAGE_URL.test(url)) return p
      msgChanged = true
      const reason = spec.multimodal
        ? `unsupported format ${url.match(/^data:([^;,]+)/)?.[1] || "unknown"}`
        : "this model does not support image input"
      return { type: "text", text: `[image omitted — ${reason}]` }
    })
    if (!msgChanged) return m
    changed = true
    return { ...m, content: parts }
  })
  return changed ? out : messages
}

/**
 * Enforce the OpenAI tool-message protocol on the outgoing payload: every tool message must
 * immediately follow the assistant message declaring its tool_call_id, and every declared
 * tool_call must have a result. Strict providers (DeepSeek) reject the whole request with 400
 * ("Messages with role 'tool' must be a response to a preceding message with 'tool_calls'").
 * History can legitimately violate this — parallel read_image injects a user message between
 * tool results, compaction splits, interrupted sessions leave dangling tool_calls — so sanitize
 * at send time. History itself is left untouched.
 */
export function normalizeToolPairing(messages) {
  // Detach all tool messages; reinsert each right after its owner assistant.
  const toolById = new Map()
  const rest = []
  for (const m of messages) {
    if (m.role === "tool") {
      if (!toolById.has(m.tool_call_id)) toolById.set(m.tool_call_id, m)
    } else {
      rest.push(m)
    }
  }
  if (toolById.size === 0 && !messages.some((m) => m.role === "assistant" && m.tool_calls?.length)) {
    return messages // no tool messages AND no tool_calls declared — nothing to enforce
  }
  const out = []
  for (const m of rest) {
    out.push(m)
    if (m.role !== "assistant" || !m.tool_calls?.length) continue
    for (const tc of m.tool_calls) {
      const t = toolById.get(tc.id)
      if (t) {
        toolById.delete(tc.id)
        out.push(t)
      } else {
        // Declared tool_call with no recorded result (interrupted session / compaction split)
        out.push({
          role: "tool",
          tool_call_id: tc.id,
          content: "[Tool result missing: the call was interrupted or its result was dropped by context compaction]",
        })
      }
    }
  }
  // Leftovers in toolById are orphans (owner assistant compacted away or never recorded) — dropped
  return out
}

/** List available model IDs from the provider's /models endpoint */
export async function listModels(provider, { signal } = {}) {
  const response = await fetch(`${provider.baseURL}/models`, {
    headers: { ...(provider.headers ?? {}), Authorization: `Bearer ${provider.apiKey}` },
    signal,
  })
  if (!response.ok) {
    const text = await response.text().catch(() => "")
    throw new Error(`GET /models failed ${response.status}: ${text}`)
  }
  const data = await response.json()
  return (data.data ?? []).map((m) => m.id).filter(Boolean).sort()
}

async function requestWithRetry(provider, body, signal, onWait) {
  let lastError
  let lastStatus = 0
  let lastWas429 = false
  let rateLimitHits = 0
  const totalAttempts = MAX_RETRIES + 1
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0 && !lastWas429) await _rateHooks.sleep(2 ** (attempt - 1) * 1000)
    lastWas429 = false

    let response
    try {
      const url = `${provider.baseURL}${provider.chatPath ?? "/chat/completions"}`
      const opts = {
        method: "POST",
        headers: {
          ...(provider.headers ?? {}), // custom per-provider headers (desktop proposal ④: X-Device-Id etc.)
          "Content-Type": "application/json",
          Authorization: `Bearer ${provider.apiKey}`,
        },
        body: JSON.stringify(body),
        signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(FETCH_TIMEOUT_MS)]) : AbortSignal.timeout(FETCH_TIMEOUT_MS),
      }
      response = provider.proxyUri
        ? await proxyFetch(url, opts, provider.proxyUri)
        : await fetch(url, opts)
    } catch (error) {
      if (error.name === "AbortError") throw error
      lastError = error
      continue
    }

    if (response.ok) return response

    const text = await response.text().catch(() => "")
    let message = `LLM API error ${response.status}: ${text}`
    // Kimi has TWO separate platforms with non-interchangeable keys (IK5VGJ):
    // Moonshot (api.moonshot.cn, sk-...) vs Kimi For Coding (api.kimi.com/coding/v1, sk-kimi-...).
    // A 401 on either endpoint is usually a wrong-platform key — say so instead of a bare 401.
    if (response.status === 401) {
      const key = String(provider.apiKey ?? "").trim()
      const base = String(provider.baseURL ?? "").toLowerCase()
      const kimiCodeKey = /^sk-kimi-/i.test(key)
      const kimiCodeUrl = base.includes("api.kimi.com")
      if (kimiCodeKey || kimiCodeUrl) {
        message += " — tip: Kimi has two separate platforms with NON-interchangeable API keys: Moonshot (api.moonshot.cn/v1, sk-...) and Kimi For Coding (api.kimi.com/coding/v1, sk-kimi-...). Your key or baseURL looks mismatched — check which platform issued it."
      }
    }
    lastStatus = response.status
    if (isNonRetryableError(response.status, text)) throw new Error(message)
    if (response.status === 429) {
      const retryAfter = Number(response.headers.get("retry-after"))
      const waitMs =
        Number.isFinite(retryAfter) && retryAfter > 0
          ? retryAfter * 1000
          : RATE_LIMIT_BACKOFF_MS[Math.min(rateLimitHits++, RATE_LIMIT_BACKOFF_MS.length - 1)]
      lastError = new Error(message)
      lastWas429 = true
      if (attempt < MAX_RETRIES) {
        onWait?.({ phase: "retry", seconds: Math.ceil(waitMs / 1000) })
        await _rateHooks.sleep(waitMs)
      }
      continue
    }
    if (RETRYABLE_STATUS.has(response.status)) {
      lastError = new Error(message)
      continue
    }
    throw new Error(message)
  }
  // All retries exhausted — build a descriptive error
  const verb = lastWas429 ? "Rate limit not resolved"
    : lastStatus >= 500 ? "Server error persisted"
    : lastStatus > 0 ? "Request failed"
    : "Network error"
  throw new Error(`${verb} after ${totalAttempts} attempts${lastStatus ? ` (${lastStatus})` : ""}: ${lastError?.message ?? "unknown"}`)
}

/**
 * Detect errors that should NOT be retried — quota, billing, auth, invalid params.
 * Different providers use wildly different error formats. Check body text for known patterns.
 */
function isNonRetryableError(status, text) {
  // Auth errors: never retry
  if (status === 401 || status === 403) return true
  // 400-level non-429: usually invalid params
  if (status >= 400 && status < 500 && status !== 429 && !RETRYABLE_STATUS.has(status)) return true
  // For 429, check if it's actually a billing/quota error (not rate limit)
  if (status === 429) {
    const lower = text.toLowerCase()
    // Chinese providers often return 429 for billing issues
    if (lower.includes("余额不足") || lower.includes("余额") || lower.includes("充值")) return true
    if (lower.includes("insufficient") && (lower.includes("balance") || lower.includes("quota") || lower.includes("credit"))) return true
    if (lower.includes("quota") && (lower.includes("exceeded") || lower.includes("insufficient"))) return true
    // Standard OpenAI billing error (error.type === "insufficient_quota" or similar)
    try {
      const j = JSON.parse(text)
      const errType = j?.error?.type || ""
      if (typeof errType === "string" && (errType.includes("quota") || errType.includes("billing") || errType.includes("insufficient") || errType.includes("balance"))) return true
      const errCode = j?.error?.code || ""
      if (typeof errCode === "string" && (errCode === "1113" || errCode === "1114")) return true // GLM billing codes
    } catch {}
  }
  return false
}

function betaBaseURL(baseURL) {
  // DeepSeek prefix continuation uses /beta endpoint; only handle /v1 suffix, append /beta when /v1 is missing
  if (/\/v1$/.test(baseURL)) return baseURL.replace(/\/v1$/, "/beta")
  return baseURL.endsWith("/") ? baseURL + "beta" : baseURL + "/beta"
}

/**
 * Compile stream rules from config format (string patterns) to executable RegExp objects.
 * Rules format: { pattern: "regex source", message: "reminder text", action: "abort"|"warn" }
 */
export function compileStreamRules(rules) {
  if (!rules?.length) return null
  return rules.map((r) => {
    try {
      return { ...r, _regex: new RegExp(r.pattern, r.flags ?? "") }
    } catch {
      // Invalid regex — skip silently so one bad rule doesn't break the whole pipeline
      return null
    }
  }).filter(Boolean)
}
