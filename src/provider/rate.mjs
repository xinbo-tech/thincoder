/**
 * provider/rate.mjs — TPM/RPM proactive throttling gate
 * Sliding-window accounting; pre-check budget before sending requests; sleep until window frees space when over budget.
 */

import { specForModel } from "../config.mjs"

export const RETRYABLE_STATUS = new Set([408, 409, 425, 429, 500, 502, 503, 504])
export const MAX_RETRIES = 3
export const MAX_CONTINUATIONS = 3
export const RATE_LIMIT_BACKOFF_MS = [15_000, 30_000, 60_000]

/**
 * Test hooks: sleep/clock/window length are replaceable (offline tests can't really wait 60s).
 * Production code should never call setTimeout/sleep directly — always go through these.
 */
export const _rateHooks = {
  sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  now: () => Date.now(),
  windowMs: 60_000,
}

const rateWindows = new Map() // key → { tokens: [{ts, n}], requests: [ts] }

function rateKey(provider) {
  // Normalize: /beta and /v1 are treated as the same account's rate-limit window (DeepSeek prefix continuation switches to /beta endpoint)
  const base = provider.baseURL.replace(/\/beta$/, "/v1")
  return `${base}|${provider.apiKey ?? ""}`
}

/** Rough estimate of text token count.
 *  ASCII ~4 chars/token; non-ASCII (CJK/emoji) ~1 char/token (conservative; measured BPE is 1.5-2.5 chars/token). */
export function estimateText(s) {
  let nonAscii = 0
  for (let i = 0; i < s.length; i++) if (s.charCodeAt(i) > 0x7f) nonAscii++
  return Math.ceil((s.length - nonAscii) / 4) + nonAscii
}

/** Estimated prompt tokens for this request */
export function estimateRequestTokens(body) {
  let tokens = 0
  for (const m of body.messages ?? []) {
    if (typeof m.content === "string") tokens += estimateText(m.content)
    if (typeof m.reasoning_content === "string") tokens += estimateText(m.reasoning_content)
    for (const tc of m.tool_calls ?? []) {
      tokens += estimateText(tc.function?.name ?? "") + estimateText(tc.function?.arguments ?? "")
    }
  }
  if (body.tools) tokens += estimateText(JSON.stringify(body.tools))
  return tokens
}

/** Gate: sleep until window frees space when over budget */
export async function rateGate(provider, estimated, onWait, signal) {
  // 2026-08-31 会诊 #16：单请求估算已超 tpm 时原实现静默放行（必然撞服务端 429）。
  // 保持放行（tpm 置 null 防止 overTokens 恒正值死等），但明确告警让上层/用户知情。
  if (provider.tpm != null && estimated > provider.tpm) {
    onWait?.({ phase: "warn", message: `estimated ${estimated} tokens > tpm ${provider.tpm} — request proceeds and may hit a server 429` })
  }
  const tpm = provider.tpm != null && estimated <= provider.tpm ? provider.tpm : null
  const rpm = provider.rpm ?? null
  if (tpm == null && rpm == null) return
  const w = rateWindows.get(rateKey(provider)) ?? { tokens: [], requests: [] }
  rateWindows.set(rateKey(provider), w)
  for (;;) {
    const now = _rateHooks.now()
    const cutoff = now - _rateHooks.windowMs
    w.tokens = w.tokens.filter((e) => e.ts > cutoff)
    w.requests = w.requests.filter((ts) => ts > cutoff)
    const usedTokens = w.tokens.reduce((s, e) => s + e.n, 0)
    const overTokens = tpm != null ? usedTokens + estimated - tpm : 0
    const overRequests = rpm != null ? w.requests.length + 1 - rpm : 0
    if (overTokens <= 0 && overRequests <= 0) break
    let waitMs = _rateHooks.windowMs
    if (overTokens > 0) {
      let freed = 0
      for (const e of w.tokens) {
        freed += e.n
        if (freed >= overTokens) {
          waitMs = Math.min(waitMs, e.ts + _rateHooks.windowMs - now)
          break
        }
      }
    }
    if (overRequests > 0) {
      waitMs = Math.min(waitMs, w.requests[overRequests - 1] + _rateHooks.windowMs - now)
    }
    waitMs = Math.max(waitMs, 50)
    onWait?.({ phase: "gate", seconds: Math.ceil(waitMs / 1000) })
    await _rateHooks.sleep(waitMs)
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError")
  }
}

/** Accounting: record measured usage after response returns */
export function recordRate(provider, estimated, usage) {
  if (provider.tpm == null && provider.rpm == null) return
  const key = rateKey(provider)
  const w = rateWindows.get(key) ?? { tokens: [], requests: [] }
  const now = _rateHooks.now()
  const cutoff = now - _rateHooks.windowMs
  w.tokens = w.tokens.filter((e) => e.ts > cutoff)
  w.requests = w.requests.filter((ts) => ts > cutoff)
  w.requests.push(now)
  w.tokens.push({ ts: now, n: usage ? (usage.prompt_tokens ?? estimated) + (usage.completion_tokens ?? 0) : estimated })
  // Delete entry when window is empty, preventing unbounded Map growth across long-running provider configs
  if (w.tokens.length === 0 && w.requests.length === 0) rateWindows.delete(key)
  else rateWindows.set(key, w)
}
