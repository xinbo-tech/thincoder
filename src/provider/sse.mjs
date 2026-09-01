/**
 * provider/sse.mjs — SSE stream reader
 * Extracted from core.mjs. Parses Server-Sent Events for LLM chat responses.
 */

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
/** Defensive tool-call merge (PROVIDER.md §10): skip null/malformed elements and count them;
 *  merge slots by index / id / name / tail, accumulate arguments. */
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

/** Finalize tool calls (PROVIDER.md §10): drop nameless slots, synthesize missing ids,
 *  count drops, and surface a machine-line warning via the existing `_warnings` channel. */
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
  if (result.droppedToolCalls > 0) {
    const existing = (result._warnings ??= [])
    if (!existing.some((w) => w.name === "malformed-tool-calls")) {
      existing.push({ name: "malformed-tool-calls", message: `${result.droppedToolCalls} malformed tool_calls dropped from provider response` })
    }
  }
}

export async function readSSE(response, { onToken, onReasoning, rules, signal, firedPatterns: sharedFired }) {
  // Early intercept: non-SSE responses — either error bodies (HTTP >= 400) or
  // valid single-chunk JSON completions (some APIs return JSON despite stream:true).
  const contentType = response.headers.get("content-type") || ""
  if (!contentType.includes("event-stream")) {
    const body = await response.text().catch(() => "")
    if (response.status >= 400) {
      let errorMsg = ""
      try {
        const parsed = JSON.parse(body)
        errorMsg = parsed?.error?.message
          || parsed?.base_resp?.status_msg
          || parsed?.detail
          || parsed?.message
          || parsed?.msg
          || (typeof parsed.error === "string" ? parsed.error : "")
      } catch { /* not JSON */ }
      if (!errorMsg) errorMsg = body.slice(0, 500)
      throw new Error(`API error: HTTP ${response.status} — ${errorMsg}`)
    }
    // HTTP < 400 non-SSE: might be a valid single-chunk JSON response (e.g. proxy
    // stripped SSE framing). Parse `choice.message` (full chat.completion) OR
    // `choice.delta` (chunk shape) — 2026-08-31: gateways downgrading stream:true
    // to a complete completion used to return EMPTY content silently (message-only shape).
    try {
      const parsed = JSON.parse(body)
      const choice = parsed.choices?.[0]
      if (choice) {
        const result = { content: "", reasoning: "", toolCalls: [], droppedToolCalls: 0, usage: normalizeUsageCache(parsed.usage ?? null), finishReason: null }
        const delta = choice.delta ?? choice.message ?? {}
        result.content = delta.content ?? ""
        result.reasoning = delta.reasoning_content ?? delta.reasoning ?? ""
        result.finishReason = choice.finish_reason ?? null
        mergeToolCalls(result, delta)
        if (result.content) onToken?.(result.content)
        if (result.reasoning) onReasoning?.(result.reasoning)
        finalizeToolCalls(result)
        return result
      }
    } catch { /* not parseable JSON */ }
    // Not an error response but not a valid chunk either — unexpected
    throw new Error(`API error: HTTP ${response.status} — unexpected non-SSE response: ${body.slice(0, 200)}`)
  }

  const result = { content: "", reasoning: "", toolCalls: [], droppedToolCalls: 0, usage: null, finishReason: null }
  const decoder = new TextDecoder()
  let buffer = ""
  let hasChoices = false
  const firedPatterns = sharedFired ?? new Set()

  /** Process one complete SSE event (data lines joined with \n per the SSE spec).
   *  2026-08-31: rows are buffered per event (multi-line data: support that the
   *  per-line JSON.parse used to crash on — single-line events behave identically). */
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
    // reasoning 方言：DeepSeek/Kimi/GLM 用 reasoning_content，OpenAI o 系和部分
    // 路由器用 reasoning —— 两个都认（2026-08-31 会诊 #9）
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
        // multi-line data: joins with \n (SSE spec); single-line is the common case
        currentData = currentData ? currentData + "\n" + v : v
        continue
      }
      if (line === "" && currentData) { handleEvent(currentData); currentData = "" }
    }
    if (currentData) handleEvent(currentData)
  }

  if (!response.body) throw new Error("No stream response body")
  // 2026-09-01 读侧 idle 超时（根因修复）：原实现靠 fetch 层的 600s 绝对墙钟兜底——长上下文子代理
  // 单次生成（或上游排队）超 10 分钟即被腰斩（"The operation was aborted due to timeout" 直透）。
  // 现改为：读侧空闲超时——body 只要有数据流动就永不超时，连续 READ_IDLE_MS 无新 chunk 才判死。
  // 直连 fetch 与 proxyFetch 统一走这里（proxy 的 _bodyIdleMs 语义与之等价，双保险）。
  const READ_IDLE_MS = 120_000
  let idleTimer = null
  const armIdle = () => {
    if (idleTimer) clearTimeout(idleTimer)
    idleTimer = setTimeout(() => {
      try { response.body?.destroy(new Error(`SSE idle timeout: no data for ${READ_IDLE_MS / 1000}s`)) } catch { /* already gone */ }
    }, READ_IDLE_MS)
    idleTimer.unref?.()
  }
  armIdle()
  try {
    for await (const chunk of response.body) {
      armIdle()
      if (signal?.aborted) {
        const e = new DOMException("The operation was aborted", "AbortError")
        e.reason = signal.reason
        throw e
      }
      buffer += decoder.decode(chunk, { stream: true })
      // UTF-8 BOM 剥除（2026-08-31 会诊 #12）：某些网关/负载均衡在流首注入 \uFEFF，
      // 首行 "data:" 前缀匹配失败会被静默丢弃（首个事件整体消失）。
      if (buffer.charCodeAt(0) === 0xfeff) buffer = buffer.slice(1)
      const lines = buffer.split("\n")
      buffer = lines.pop()
      processLines(lines)

      if (rules?.length && result.content && !result.toolCalls.length) {
        for (const rule of rules) {
          if (rule.repeat === "once" && firedPatterns.has(rule.pattern)) continue
          if (rule._regex.test(result.content)) {
            if (rule.repeat === "once") firedPatterns.add(rule.pattern)
            if (rule.action === "abort") {
              result.ruleTriggered = true
              result.ruleMessage = rule.message
              result.ruleName = rule.name
              if (idleTimer) clearTimeout(idleTimer)
              return result
            }
            const existing = result._warnings ??= []
            if (!existing.some(w => w.pattern === rule.pattern)) {
              existing.push({ name: rule.name, pattern: rule.pattern, message: rule.message })
            }
          }
        }
      }
    }
    buffer += decoder.decode()
    processLines(buffer.split("\n"))
  } catch (e) {
    if (idleTimer) clearTimeout(idleTimer)
    if (e.name === "AbortError" && signal?.reason?.interrupt) {
      result.interrupted = true
      result.interruptMessage = signal.reason.message
      if (idleTimer) clearTimeout(idleTimer)
      return result
    }
    // 2026-08-31 会诊 #2（流中断丢全部已收内容）：网络级失败（ECONNRESET / 半截 EOF /
    // proxy 断连）时若已解析出内容，把 partial 交回上层而不是整轮报废重试。
    // 标记 partial:true + networkError（上层可决定续写/重试/展示部分结果）。
    if (hasChoices && (result.content || result.toolCalls.length)) {
      finalizeToolCalls(result)
      result.partial = true
      result.networkError = e.message ?? String(e)
      const existing = result._warnings ??= []
      if (!existing.some((w) => w.name === "network-partial")) {
        existing.push({ name: "network-partial", message: `stream interrupted by network error after partial output: ${result.networkError}` })
      }
      return result
    }
    throw e
  }

  if (idleTimer) clearTimeout(idleTimer)

  if (!hasChoices) {
    // Stream started as SSE but no choices were parsed — unusual. Include status for debugging.
    const raw = buffer.trim()
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
    if (!errorMsg) errorMsg = `SSE stream contained no choices (HTTP ${response.status})`
    throw new Error(`API error: ${errorMsg}`)
  }

  finalizeToolCalls(result)
  return result
}
