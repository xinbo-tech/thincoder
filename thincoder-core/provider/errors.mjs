/**
 * provider/errors.mjs — 错误分类与流规则编译族（2026-09-05 module-split：core.mjs
 * 557 > 500 硬限——parseRetryAfter/isNonRetryableError/betaBaseURL/compileStreamRules
 * verbatim 迁入，语义零变；core.mjs import 回（chat 调用点零改）。
 * 注：retry.mjs（anthropic/google/responses 通道）自 2026-09-08 起导入本文件的
 * parseRetryAfter/isNonRetryableError（ENG-SESSION-PROVIDER-CLEANUP D2.2/D2.4 去重——
 * 单实现；早先的"循环依赖回避"复制已随依赖方向实测消解）。
 */

import { RETRYABLE_STATUS, RATE_LIMIT_BACKOFF_MS } from "./rate.mjs"

/** Parse Retry-After: 秒数 or HTTP-date；上限 300s（会诊 #11）— 异常头不得让 CLI 睡数小时。
 *  header 缺失/非法时退回指数退避表（rateLimitHits 计数取档）。 */
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

/**
 * Detect errors that should NOT be retried — quota, billing, auth, invalid params.
 * Different providers use wildly different error formats. Check body text for known patterns.
 */
export function isNonRetryableError(status, text) {
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

export function betaBaseURL(baseURL) {
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

/**
 * Provider-level pre-flight error (MODEL-400-FIX F-1 — 请求体组装前断言): carries the
 * provider identity so a fail-fast throw is readable ("which provider + what to fix")
 * instead of a wire-time serde 400 or a bare message without context.
 */
export class ProviderError extends Error {
  constructor(provider, message) {
    super(`provider "${provider?.name ?? provider?.model ?? "unknown"}": ${message}`)
    this.name = "ProviderError"
  }
}

/**
 * F-1 (MODEL-400-FIX) 根因兜底——请求体组装前断言：渠道裸克隆（`{...渠道}`——渠道条目不携
 * 模型，克隆链未重派生 `.model` 时）provider.model 为 undefined/null——
 * JSON.stringify 会丢 undefined 键 → 无 model 请求 → serde 400。
 * fail-fast 报可读错误（带 provider 名 + 修复线索），不发病体。core.mjs chatImpl openai body 组装
 * 前调用（单行——core.mjs 500 行硬限）。
 * 2026-10-09 清除批（R3）：指引收正——模型身份唯二 = 顶层 `defaultModel` 复合串 ∥ 会话槽选定
 * （渠道单值模型退场，不再作指引）。
 */
export function assertProviderModel(provider) {
  if (!provider.model) {
    throw new ProviderError(provider, "model is undefined — provider cloned without model re-derivation (set the default model (provider:model) or the session slot model)")
  }
}

/**
 * #907-D8：Responses 流内错误码 → 分类（最小集五码）。宿主 = 本文件（分类族单源——与
 * parseRetryAfter / isNonRetryableError 同族）；消费面 = responses.mjs 流内错误出口
 * （response.failed onFailed ∥ type:"error" 帧处置）。HTTP 级分类（isNonRetryableError）
 * 零改——本函数只服务流内错误面。未列码 → null（不发明分类，服务端消息原样透传）。
 * retryable 是信息位：本批不接自动重试（无流内重试消费面），仅供上层展示/上报。
 */
export function classifyResponsesErrorCode(code) {
  switch (code) {
    case "context_length_exceeded":
      return { kind: "context_overflow", retryable: false, hint: "上下文超限——/compact 压缩历史后重试" }
    case "insufficient_quota":
      return { kind: "quota", retryable: false, hint: "配额/计费不足——检查 provider 余额或套餐额度" }
    case "invalid_prompt":
      return { kind: "invalid_request", retryable: false, hint: null }
    case "server_is_overloaded":
    case "server_error":
      return { kind: "server", retryable: true, hint: null }
    default:
      return null
  }
}
