/**
 * web-deepseek.mjs — DeepSeek Search / Fetch backend for the `websearch` & `fetch` tools
 * (design = `docs/core/design/TOOLS.md` §6.23 · ledger #1605).
 *
 * Key source = the first `providers[]` entry whose baseURL host is the official
 * `api.deepseek.com` and whose apiKey resolves non-empty (`${env:VAR}` resolved at use
 * time — an unresolved reference makes that entry ineligible, never throws). Zero new
 * config: a configured DeepSeek provider is enough.
 *
 * The tools never fail because of this backend: every export returns a pure value
 * (`{ status: "ok" | "empty" | "failed" | "unavailable" }`) and never throws.
 * 401/402/403 trip a per-agent breaker for `BREAKER_TTL_MS` (10 min — auto-unseals, no restart);
 * 404 does NOT trip (the target page is missing — not a credential failure, D-WB3); 408/429/5xx
 * retry once (500 ms); everything else falls back to the caller's existing chain.
 */
import { URL } from "node:url"
import { truncate, isPrivateHost } from "./shared.mjs"
import { resolveProviderSecrets } from "../env-ref.mjs"
import { proxyFetch } from "../proxy.mjs"
import { logEvent } from "../log.mjs"

// D-WB2: endpoints are fixed constants — `baseURL` only decides eligibility (a user's
// `/v1` suffix or prefix must not build a doubled path, and the key only goes to the
// official host).
const SEARCH_URL = "https://api.deepseek.com/v1/tools/search"
const FETCH_URL = "https://api.deepseek.com/v1/tools/fetch"
const DEEPSEEK_HOST = "api.deepseek.com"
const TIMEOUT_MS = 15_000
const RETRY_DELAY_MS = 500 // D-WB5: fixed single backoff (no Retry-After parsing)
const COST_PER_CALL = 0.00075 // $0.75 / 1000 successful requests — `count` does not change the price
const TRIP_STATUS = new Set([401, 402, 403]) // 404 = 目标页面的状态，不是凭据失效（D-WB3）
const BREAKER_TTL_MS = 600_000 // 熔断限时 10 分钟——到期自动放行（改完 key 无需重启会话）
const RETRY_STATUS = (() => {
  const codes = new Set([408, 429])
  for (let code = 500; code <= 599; code++) codes.add(code)
  return codes
})()

let _transport = proxyFetch
let _now = Date.now
let _breaker = new WeakMap() // agent → expiresAtMs（单域——search ∥ fetch 共享，D-WB3）

/** Test seam (CONFIG.md §6.2 ③ — paired): swap the transport ∥ the clock; reset also clears the breaker. */
export function _setDeepseekTransportForTest(fn) { _transport = typeof fn === "function" ? fn : proxyFetch }
export function _setDeepseekClockForTest(fn) { _now = typeof fn === "function" ? fn : Date.now }
export function _resetDeepseekTransportForTest() { _transport = proxyFetch; _now = Date.now; _breaker = new WeakMap() }

/** 熔断名单只读面（用例断言 404 零命中——D-WB3）。 */
export const _TRIP_STATUS_FOR_TEST = Object.freeze([...TRIP_STATUS])

/** `local` skips the DeepSeek backend; anything else (missing ∥ misspelled ∥ non-string) = `auto` (fail-open). */
export function backendMode(cfg, key) {
  return cfg?.[key]?.backend === "local" ? "local" : "auto"
}

/** First qualifying channel in stored order → `{ apiKey }` | null. Never throws. */
function deepseekChannel(cfg) {
  const list = Array.isArray(cfg?.providersList) ? cfg.providersList
    : Array.isArray(cfg?.providers) ? cfg.providers : []
  for (const entry of list) {
    if (entry === null || typeof entry !== "object") continue
    let url
    try { url = new URL(String(entry.baseURL ?? "")) } catch { continue }
    if (url.protocol !== "https:") continue
    const host = url.hostname.toLowerCase().replace(/\.$/, "") // trailing-dot host still official
    if (host !== DEEPSEEK_HOST) continue // subdomains never qualify (x.api.deepseek.com)
    if (url.port !== "" && url.port !== "443") continue // non-standard port could impersonate
    let apiKey
    try { apiKey = resolveProviderSecrets(entry).apiKey } catch { continue } // unset env ref ⇒ ineligible
    if (typeof apiKey !== "string" || apiKey.trim() === "") continue
    return { apiKey: apiKey.trim() }
  }
  return null
}

/** 熔断未到期？到期 ⇒ 删条目并放行（判活读时钟——改完 key 不必重启会话）。 */
function tripped(agent) {
  if (agent === null || typeof agent !== "object") return false
  const expiresAt = _breaker.get(agent)
  if (typeof expiresAt !== "number") return false
  if (expiresAt > _now()) return true
  _breaker.delete(agent)
  return false
}

/** Break the backend for this agent identity for `BREAKER_TTL_MS` (single domain — search ∥ fetch share it, D-WB3). */
function trip(agent) {
  if (agent !== null && typeof agent === "object") _breaker.set(agent, _now() + BREAKER_TTL_MS)
}

/** One POST. Returns `{ kind: "ok", data }` | `{ kind: "http", status }` | `{ kind: "net", timeout }` | `{ kind: "json" }`. */
async function postOnce(url, body, apiKey, proxyUri) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  try {
    const res = await _transport(url, {
      method: "POST",
      // Same header shape as the Tavily leg (`web.mjs` bearer precedent).
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    }, proxyUri)
    if (!res || res.ok !== true) {
      try { await res?.body?.cancel?.() } catch { /* body already closed */ }
      return { kind: "http", status: Number(res?.status ?? 0) }
    }
    try { return { kind: "ok", data: await res.json() } } catch { return { kind: "json" } }
  } catch (e) {
    return { kind: "net", timeout: e?.name === "AbortError" }
  } finally { clearTimeout(timer) }
}

/** One logical call: retry once (408/429/5xx), trip on 401/402/403, otherwise fall back. */
async function request(url, body, apiKey, proxyUri, tool, agent) {
  const started = Date.now()
  let r = await postOnce(url, body, apiKey, proxyUri)
  if (r.kind === "http" && RETRY_STATUS.has(r.status)) {
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS))
    r = await postOnce(url, body, apiKey, proxyUri)
  }
  if (r.kind === "ok") return { ok: true, data: r.data }
  if (r.kind === "http" && TRIP_STATUS.has(r.status) && agent !== null && typeof agent === "object") {
    trip(agent)
    // Tripping line only (transient fallbacks stay quiet — ⑤).
    logEvent("web:deepseek", { tool, status: r.status, tripped: true, ttlMs: BREAKER_TTL_MS, ms: Date.now() - started })
  }
  const reason = r.kind === "http" ? `http ${r.status}`
    : r.kind === "net" ? (r.timeout ? "timeout" : "network")
      : "malformed json"
  return { ok: false, reason }
}

/** Response → tool text: `[deepseek]` block per result, same numbered shape as the Tavily ∥ Bing legs. */
function renderSearch(data, limit) {
  const list = Array.isArray(data?.results) ? data.results : []
  const results = list.slice(0, limit)
  if (results.length === 0) return { n: 0, text: "" }
  const blocks = results.map((r, i) => {
    const meta = []
    if (typeof r?.date === "string" && r.date.trim() !== "") meta.push(r.date)
    if (Number.isFinite(r?.authority) && r.authority >= 0) meta.push(`authority ${r.authority}`) // -1 = unknown ⇒ omitted
    if (Number.isFinite(r?.rerank_score)) meta.push(`rerank ${r.rerank_score}`)
    const summary = typeof r?.summary === "string" && r.summary.trim() !== ""
      ? r.summary
      : (typeof r?.snippet === "string" ? r.snippet : "")
    const lines = [`${i + 1}. [deepseek] ${r?.title ?? ""}`, `   ${r?.url ?? ""}`]
    if (meta.length > 0) lines.push(`   ${meta.join(" · ")}`)
    if (summary !== "") lines.push(`   ${summary}`)
    return lines.join("\n")
  })
  return { n: results.length, text: truncate(blocks.join("\n\n")) }
}

/** search — `count` = the tool-face limit (`web.mjs` already clamps it to 20); `< 1` ⇒ 1. Never throws. */
export async function deepseekSearch({ cfg, query, limit = 8, proxy = null, agent = null } = {}) {
  const channel = deepseekChannel(cfg)
  if (channel === null) return { status: "unavailable" }
  if (tripped(agent)) return { status: "failed", reason: "breaker open" }
  const count = Math.min(50, Math.max(1, Number.isFinite(limit) ? Math.floor(limit) : 8))
  const started = Date.now()
  const r = await request(SEARCH_URL, { query, count, need_content: false }, channel.apiKey, proxy, "search", agent)
  if (!r.ok) return { status: "failed", reason: r.reason }
  const { n, text } = renderSearch(r.data, count)
  logEvent("web:deepseek", { tool: "search", n, ms: Date.now() - started, cost: n > 0 ? COST_PER_CALL : 0 })
  return n > 0 ? { status: "ok", text, n } : { status: "empty" }
}

/** fetch — title + Markdown; empty `content` ⇒ `empty` (caller falls back to the local fetch). Never throws. */
export async function deepseekFetch({ cfg, url, proxy = null, agent = null } = {}) {
  const channel = deepseekChannel(cfg)
  if (channel === null) return { status: "unavailable" }
  if (tripped(agent)) return { status: "failed", reason: "breaker open" }
  // `web.mjs` runs the SSRF gate before calling; keep a second one here so a direct
  // caller can never send a private/metadata URL to a third party either.
  let target
  try { target = new URL(url) } catch { return { status: "failed", reason: "invalid url" } }
  if (isPrivateHost(target.hostname)) return { status: "failed", reason: "private url" }
  const started = Date.now()
  const r = await request(FETCH_URL, { url }, channel.apiKey, proxy, "fetch", agent)
  if (!r.ok) return { status: "failed", reason: r.reason }
  const title = typeof r.data?.title === "string" ? r.data.title : ""
  const content = typeof r.data?.content === "string" ? r.data.content : ""
  const n = content.trim() === "" ? 0 : content.length
  logEvent("web:deepseek", { tool: "fetch", n, ms: Date.now() - started, cost: n > 0 ? COST_PER_CALL : 0 })
  if (n === 0) return { status: "empty" }
  return { status: "ok", text: truncate(`[deepseek] ${title}\n\n${content}`), n }
}
