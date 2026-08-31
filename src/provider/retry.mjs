/**
 * provider/retry.mjs — 通用请求重试链（2026-08-31）
 * anthropic/google 曾只处理 429 单次重试（google 完全无重试）——5xx/网络错误与
 * OpenAI 格式（core.mjs requestWithRetry）语义割裂：DeepSeek/Claude 排队 503 时
 * OpenAI 格式会自动退避重试，其他两格式直接抛错。
 * 本模块提供与 core 等价的退避链：2^(n-1)s 指数退避、429 Retry-After（秒/HTTP-date、
 * 300s 上限）、RETRYABLE_STATUS、AbortError 透传、cause 解包。
 * 测试钩子走 rate.mjs 的 _rateHooks.sleep（与 core 同一替换点）。 */
import { RETRYABLE_STATUS, MAX_RETRIES, RATE_LIMIT_BACKOFF_MS, _rateHooks } from "./rate.mjs"

/** Parse Retry-After: 秒数 or HTTP-date；上限 300s（与 core.mjs parseRetryAfter 同语义，
 *  无 core 依赖复制于此——anthropic/google 引入 core 会造成循环依赖）。 */
export function parseRetryAfter(header, rateLimitHits = 0) {
  const fallback = RATE_LIMIT_BACKOFF_MS[Math.min(rateLimitHits, RATE_LIMIT_BACKOFF_MS.length - 1)]
  if (header == null) return fallback
  let waitMs = 0
  const numeric = Number(header.trim())
  if (Number.isFinite(numeric) && numeric >= 0) waitMs = numeric * 1000
  else {
    const date = Date.parse(header.trim())
    if (Number.isFinite(date)) waitMs = Math.max(0, date - Date.now())
  }
  if (waitMs <= 0) return fallback
  return Math.min(waitMs, 300_000)
}

/** 可中断 sleep（与 core.mjs sleepInterruptible 同语义）。 */
export async function sleepInterruptible(ms, signal) {
  if (!signal) return _rateHooks.sleep(ms)
  if (signal.aborted) throw abortDOM(signal)
  return new Promise((resolve, reject) => {
    const onAbort = () => { signal.removeEventListener("abort", onAbort); reject(abortDOM(signal)) }
    signal.addEventListener("abort", onAbort, { once: true })
    _rateHooks.sleep(ms).then(
      () => { signal.removeEventListener("abort", onAbort); resolve() },
      (e) => { signal.removeEventListener("abort", onAbort); reject(e) },
    )
  })
}

function abortDOM(signal) {
  const e = new DOMException("The operation was aborted", "AbortError")
  e.reason = signal.reason
  return e
}

/**
 * 通用退避重试链。request() 每次尝试建连（返回 Response）；buildMessage(status, text)
 * 由调用方生成错误文案（可含 provider 特有诊断）。
 * 返回 ok 的 Response；重试耗尽抛 Error（文案含 cause 解包，见会诊 #8）。
 */
export async function requestWithRetry(request, {
  signal, onWait, maxAttempts = MAX_RETRIES + 1, buildMessage,
} = {}) {
  let lastError
  let lastStatus = 0
  let lastWas429 = false
  let rateLimitHits = 0

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (attempt > 0 && !lastWas429) await sleepInterruptible(2 ** (attempt - 1) * 1000, signal)
    lastWas429 = false

    let response
    try {
      response = await request()
    } catch (error) {
      if (error.name === "AbortError") throw error
      lastError = error
      continue
    }

    if (response.ok) return response

    const text = await response.text().catch(() => "")
    const message = buildMessage ? buildMessage(response.status, text) : `LLM API error ${response.status}: ${text}`
    lastStatus = response.status

    if (response.status === 401 || response.status === 403) throw new Error(message)
    if (response.status >= 400 && response.status < 500 && response.status !== 429 && !RETRYABLE_STATUS.has(response.status)) throw new Error(message)

    if (response.status === 429) {
      const waitMs = parseRetryAfter(response.headers.get("retry-after"), rateLimitHits)
      rateLimitHits++
      lastError = new Error(message)
      lastWas429 = true
      if (attempt < maxAttempts - 1) {
        onWait?.({ phase: "retry", seconds: Math.ceil(waitMs / 1000) })
        await sleepInterruptible(waitMs, signal)
      }
      continue
    }
    if (RETRYABLE_STATUS.has(response.status)) {
      lastError = new Error(message)
      continue
    }
    throw new Error(message)
  }

  const verb = lastWas429 ? "Rate limit not resolved"
    : lastStatus >= 500 ? "Server error persisted"
    : lastStatus > 0 ? "Request failed"
    : "Network error"
  const causeText = lastError?.cause
    ? ` (${lastError.cause.code ?? lastError.cause.message ?? String(lastError.cause)})`
    : ""
  throw new Error(`${verb} after ${maxAttempts} attempts${lastStatus ? ` (${lastStatus})` : ""}: ${lastError?.message ?? "unknown"}${causeText}`)
}
