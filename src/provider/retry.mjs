/**
 * provider/retry.mjs — 通用请求重试链（2026-08-31）
 * anthropic/google 曾只处理 429 单次重试（google 完全无重试）——5xx/网络错误与
 * OpenAI 格式（core.mjs requestWithRetry）语义割裂：DeepSeek/Claude 排队 503 时
 * OpenAI 格式会自动退避重试，其他两格式直接抛错。
 * 本模块提供与 core 等价的退避链：2^(n-1)s 指数退避、429 Retry-After（秒/HTTP-date、
 * 300s 上限）、RETRYABLE_STATUS、AbortError 透传、cause 解包。
 * 测试钩子走 rate.mjs 的 _rateHooks.sleep（与 core 同一替换点）。 */
import { RETRYABLE_STATUS, MAX_RETRIES } from "./rate.mjs"
// 2026-09-08 ENG-SESSION-PROVIDER-CLEANUP D2.2/D2.3：parseRetryAfter/sleepInterruptible
// 去重为单实现——errors.mjs/core.mjs 保留，本模块单向导入（无循环依赖：core 不依赖 retry）。
import { parseRetryAfter, isNonRetryableError } from "./errors.mjs"
import { sleepInterruptible } from "./core.mjs"

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

    if (response.status === 401 || response.status === 403) {
      const e = new Error(message); e.status = response.status; throw e
    }
    // 4xx 非 429 非可重试：无重试直接抛——带 status 供 responses chat() 的 D6 链失效回退识别（2026-08-31 round2 复验 #1）
    if (response.status >= 400 && response.status < 500 && response.status !== 429 && !RETRYABLE_STATUS.has(response.status)) {
      const e = new Error(message); e.status = response.status; throw e
    }

    if (response.status === 429) {
      // 计费/配额类 429（余额不足/充值、insufficient_quota 等）不是限流：重试只会干等
      // 后报泛化错误——统一走 errors.mjs isNonRetryableError 双判版（文本+JSON err.code
      // 1113/1114 结构判），立即抛错（round3 #4；2026-09-08 D2.4 去重——单实现）。
      if (isNonRetryableError(429, text)) {
        onWait?.({ phase: "quota", message: `quota exhausted: ${text.slice(0, 200)}` })
        const e = new Error(message); e.status = 429; throw e
      }
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
