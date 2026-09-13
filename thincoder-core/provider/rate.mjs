/**
 * provider/rate.mjs — TPM/RPM proactive throttling gate
 * Sliding-window accounting; pre-check budget before sending requests; sleep until window frees space when over budget.
 */
import { abortError } from "../abort-provenance.mjs"
import { specForModel } from "../model-specs.mjs"

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

/**
 * Abort-aware sleep（§2.5 #114 并入——VSC 侧 `abortableSleep` 归位）：用户按 Stop 时立即
 * 中断（拒绝 AbortError）——重试退避与限流等待不得在中断后再扣住回合最长 60s。
 */
export async function abortableSleep(ms, signal) {
  if (!signal) return _rateHooks.sleep(ms)
  if (signal.aborted) throw new DOMException("Aborted", "AbortError")
  await new Promise((resolve, reject) => {
    const t = setTimeout(() => { signal.removeEventListener("abort", onAbort); resolve() }, ms)
    function onAbort() { clearTimeout(t); reject(new DOMException("Aborted", "AbortError")) }
    signal.addEventListener("abort", onAbort, { once: true })
  })
}

const rateWindows = new Map() // key → { tokens: [{ts, n}], requests: [ts] }

function rateKey(provider) {
  // Normalize: /beta and /v1 are treated as the same account's rate-limit window (DeepSeek prefix continuation switches to /beta endpoint)
  const base = provider.baseURL.replace(/\/beta$/, "/v1")
  return `${base}|${provider.apiKey ?? ""}`
}

/** Rough estimate of text token count.
 *  ASCII ~4 chars/token; non-ASCII (CJK/emoji) ~1 char/token (conservative; measured BPE is 1.5-2.5 chars/token).
 *  §2.5 #114 并入（token 估算取并集）：数组内容按 part 分派——text 走单串估算，
 *  image_url part 计 85 tokens（VSC 侧口径）。 */
export function estimateText(s) {
  if (!s) return 0
  if (Array.isArray(s)) {
    let tokens = 0
    for (const part of s) {
      if (part?.type === "text") tokens += _estimateSingle(String(part.text ?? ""))
      else if (part?.type === "image_url") tokens += 85
    }
    return tokens
  }
  return _estimateSingle(String(s))
}

function _estimateSingle(s) {
  let nonAscii = 0
  for (let i = 0; i < s.length; i++) if (s.charCodeAt(i) > 0x7f) nonAscii++
  return Math.ceil((s.length - nonAscii) / 4) + nonAscii
}

/** Estimated prompt tokens for this request */
export function estimateRequestTokens(body) {
  let tokens = 0
  for (const m of body.messages ?? []) {
    tokens += estimateText(m.content)
    if (typeof m.reasoning_content === "string") tokens += estimateText(m.reasoning_content)
    for (const tc of m.tool_calls ?? []) {
      tokens += estimateText(tc.function?.name ?? "") + estimateText(tc.function?.arguments ?? "")
    }
  }
  if (body.tools) tokens += estimateText(JSON.stringify(body.tools))
  // §2.5 #114 并入（token 估算取并集）：max_tokens（输出预算）计入请求估算（VSC 侧口径）。
  if (body.max_tokens) tokens += body.max_tokens
  return tokens
}

/** Gate: sleep until window frees space when over budget */
export async function rateGate(provider, estimated, onWait, signal) {
  // §2.5 #114 并入（默认限流口径取 VSC 的 spec 回退）：provider 未显式配置 tpm/rpm 时
  // 回退到模型规格表的限流字段（当前表内无 tpm/rpm 字段 ⇒ 回退为未配置，行为不变；
  // 表后续补字段时自动生效）。
  const spec = specForModel(provider.model)
  const configuredTpm = provider.tpm ?? spec?.tpm ?? null
  const configuredRpm = provider.rpm ?? spec?.rpm ?? null
  // 2026-08-31 会诊 #16：单请求估算已超 tpm 时原实现静默放行（必然撞服务端 429）。
  // 保持放行（tpm 置 null 防止 overTokens 恒正值死等），但明确告警让上层/用户知情。
  let warned = false
  if (configuredTpm != null && estimated > configuredTpm) {
    onWait?.({ phase: "warn", message: `estimated ${estimated} tokens > tpm ${configuredTpm} — request proceeds and may hit a server 429` })
    warned = true
  }
  const tpm = configuredTpm != null && estimated <= configuredTpm ? configuredTpm : null
  const rpm = configuredRpm
  if (tpm == null && rpm == null) return
  // §2.5 #114 并入（VSC 默认维度回退——A19 影响面②）：单维度配置时补另一维度默认
  //（只配 rpm 的场景多一层 TPM 闸——限流更早触发；缺省值逐字同 VSC）。
  const effectiveTpm = tpm ?? 1_000_000
  const effectiveRpm = rpm ?? 500
  // §2.5 #114 并入（VSC 防死等守护）：`estimated > effectiveTpm` 时 overTokens 恒真
  //（usedTokens ≥ 0）⇒ 窗口等待循环永不放行（sleep 循环无限空转）——告警 + 记账 +
  //直接放行，不再进窗口等待（VSC 同款提前放行语义）。
  if (estimated > effectiveTpm) {
    if (!warned) onWait?.({ phase: "warn", message: `estimated ${estimated} tokens > tpm ${effectiveTpm} — request proceeds and may hit a server 429` })
    const wOver = rateWindows.get(rateKey(provider)) ?? { tokens: [], requests: [] }
    rateWindows.set(rateKey(provider), wOver)
    const nowOver = _rateHooks.now()
    wOver.tokens.push({ ts: nowOver, n: estimated })
    wOver.requests.push(nowOver)
    return
  }
  const w = rateWindows.get(rateKey(provider)) ?? { tokens: [], requests: [] }
  rateWindows.set(rateKey(provider), w)
  for (;;) {
    const now = _rateHooks.now()
    const cutoff = now - _rateHooks.windowMs
    w.tokens = w.tokens.filter((e) => e.ts > cutoff)
    w.requests = w.requests.filter((ts) => ts > cutoff)
    const usedTokens = w.tokens.reduce((s, e) => s + e.n, 0)
    const overTokens = usedTokens + estimated - effectiveTpm
    const overRequests = w.requests.length + 1 - effectiveRpm
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
    // §2.5 #114 并入：等待改为可中断实现（abortableSleep）——abort 仍走 CLI 溯源标注。
    await abortableSleep(waitMs, signal).catch((e) => {
      if (e?.name === "AbortError") throw abortError(signal, "provider", "rate-gate")
      throw e
    })
    if (signal?.aborted) throw abortError(signal, "provider", "rate-gate")
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
