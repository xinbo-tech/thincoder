/**
 * rate.mjs — TPM/RPM rate-limiting gate for LLM providers
 * OpenAI-compatible. Zero dependencies.
 */

import { specForModel } from "../specs.mjs"

export const RETRYABLE_STATUS = new Set([408, 409, 425, 429, 500, 502, 503, 504])
export const MAX_RETRIES = 3
export const MAX_CONTINUATIONS = 3
export const RATE_LIMIT_BACKOFF_MS = [15_000, 30_000, 60_000]

/**
 * Test hooks: sleep/clock/window length are replaceable.
 * Production code should never call setTimeout/sleep directly — always go through these.
 */
export const _rateHooks = {
  sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  now: () => Date.now(),
  windowMs: 60_000,
}

/** Abort-aware sleep: resolves early (rejecting with AbortError) when the user
 *  presses Stop — retry backoff and rate-limit waits must not hold the turn
 *  hostage for up to 60s after an abort. */
export async function abortableSleep(ms, signal) {
  if (!signal) return _rateHooks.sleep(ms)
  if (signal.aborted) throw new DOMException("Aborted", "AbortError")
  await new Promise((resolve, reject) => {
    const t = setTimeout(() => { signal.removeEventListener("abort", onAbort); resolve() }, ms)
    function onAbort() { clearTimeout(t); reject(new DOMException("Aborted", "AbortError")) }
    signal.addEventListener("abort", onAbort, { once: true })
  })
}

const rateWindows = new Map()

/** Normalize baseURL for consistent rate-key: /beta→/v1, strip trailing slashes, include apiKey */
function rateKey(provider) {
  const base = (provider.baseURL || "").replace(/\/beta$/, "/v1").replace(/\/+$/, "").toLowerCase()
  return `${base}|${provider.apiKey ?? ""}`
}

function ensureWindow(key) {
  if (!rateWindows.has(key)) {
    rateWindows.set(key, { entries: [], reqCount: 0 })
  }
  return rateWindows.get(key)
}

/** Prune entries older than the sliding window */
function pruneWindow(w, now) {
  const cutoff = now - _rateHooks.windowMs
  // Prune entries. Also deduct from reqCount — assume ~1 req per entry (reasonable proxy)
  let removed = 0
  w.entries = w.entries.filter(e => {
    if (e.ts > cutoff) return true
    removed++
    return false
  })
  w.reqCount = Math.max(0, w.reqCount - removed)
}

function tokenSum(w) {
  return w.entries.reduce((s, e) => s + e.tokens, 0)
}

export function estimateText(s) {
  if (!s) return 0
  if (Array.isArray(s)) {
    let tokens = 0
    for (const part of s) {
      if (part.type === "text") tokens += _estimateSingle(part.text)
      else if (part.type === "image_url") tokens += 85
    }
    return tokens
  }
  return _estimateSingle(s)
}

/** CJK-aware token estimation: ASCII ~4 chars/token, non-ASCII ~1 char/token with BPE */
function _estimateSingle(s) {
  let nonAscii = 0
  for (let i = 0; i < s.length; i++) if (s.charCodeAt(i) > 0x7f) nonAscii++
  return Math.ceil((s.length - nonAscii) / 4) + nonAscii
}

export function estimateRequestTokens(body) {
  let tokens = 16
  for (const m of body.messages || []) {
    tokens += 16 + estimateText(m.content || "")
    tokens += estimateText(m.reasoning_content || "")
  }
  if (body.tools) tokens += 128
  if (body.max_tokens) tokens += body.max_tokens
  return Math.ceil(tokens / 100) * 100
}

export async function rateGate(provider, estimated, onWait, signal) {
  const key = rateKey(provider)
  const spec = specForModel(provider.model)

  // Opt-out: no explicit rate limit configured (self-hosted / local providers)
  const tpm = provider.tpm ?? spec.tpm
  const rpm = provider.rpm ?? spec.rpm
  if (tpm == null && rpm == null) return

  const effectiveTpm = tpm ?? 1_000_000
  const effectiveRpm = rpm ?? 500

  // 2026-08-31 会诊 #4（与 CLI 465b9c3 #16 对齐）：单请求估算已超 tpm 时
  // `tokens + estimated > effectiveTpm` 恒真 → 原实现无限空转（sleep 10s 循环永不放行）。
  // 保持放行（睡到窗口再无意义），但明确告警让上层/用户知情。
  if (estimated > effectiveTpm) {
    onWait?.({ phase: "warn", message: `estimated ${estimated} tokens > tpm ${effectiveTpm} — request proceeds and may hit a server 429` })
    const w = ensureWindow(key)
    w.entries.push({ ts: _rateHooks.now(), tokens: estimated })
    w.reqCount++
    return
  }

  const w = ensureWindow(key)
  const now = _rateHooks.now()
  pruneWindow(w, now)

  let tokens = tokenSum(w)
  while (tokens + estimated > effectiveTpm || w.reqCount + 1 > effectiveRpm) {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError")
    const remainMs = _rateHooks.windowMs - (now - w.entries[0]?.ts || now)
    if (remainMs <= 0) {
      pruneWindow(w, _rateHooks.now())
      tokens = tokenSum(w)
      if (tokens + estimated <= effectiveTpm && w.reqCount + 1 <= effectiveRpm) break
    }
    const waitMs = Math.min(Math.max(remainMs + 100, 100), 10_000)
    onWait?.({ phase: "rate", seconds: Math.ceil(waitMs / 1000) })
    await abortableSleep(waitMs, signal)
    pruneWindow(w, _rateHooks.now())
    tokens = tokenSum(w)
  }

  // Pre-book the estimated tokens (adjusted by recordRate when actual usage is known)
  w.entries.push({ ts: _rateHooks.now(), tokens: estimated })
  w.reqCount++
}

export function recordRate(provider, estimated, usage) {
  if (!usage) return
  const key = rateKey(provider)
  const w = rateWindows.get(key)
  if (!w) return
  const actual = usage.total_tokens ?? estimated
  // Replace the last entry's estimated tokens with the actual usage
  const entry = w.entries[w.entries.length - 1]
  if (entry) entry.tokens = actual
}
