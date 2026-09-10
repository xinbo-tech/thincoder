/**
 * list-models.mjs — provider 模型清单拉取（GET /models，按 provider.format 分派——PROVIDER.md §16 M1）。
 *
 * 2026-09-10 自 core.mjs 迁出（原实现仅 OpenAI 形状）+ 扩 anthropic / google 两分支：
 * - openai（缺省/未知 format——与 chat 分派缺省一致）：`GET {baseURL}/models` + Bearer；解析 `data[].id`
 * - anthropic：`GET {baseURL}/models?limit=1000` + `x-api-key` / `anthropic-version`；`has_more` 时以
 *   `last_id` 作 `after_id` 翻页跟随（≤10 页——防死循环）
 * - google：`GET {baseURL}/models?key=…&pageSize=1000`；剥 `models/` 前缀；`nextPageToken` 翻页跟随（≤10 页）
 *
 * URL 组合 = `{baseURL}` + 相对路径，与 chat 各 transport 同构——baseURL 自带版本段
 * （claude 预设 `…/v1` → `…/v1/models`；gemini 预设 `…/v1beta` → `…/v1beta/models`）。
 * 超时制度沿用原实现（整体 15s + header 15s + body idle 15s；翻页时逐页各自计时；调用方可传
 * `signal` 短路）。HTTP 非 2xx / 网络失败**抛出**（调用方决定降级——与现实现同）；
 * 解析保持防御性（字段缺失即跳过该项）。候选不过滤非对话模型（embedding 等——§16.6 #14）。
 */
import { proxyFetch } from "../proxy.mjs"

const LIST_TIMEOUT_MS = 15_000
/** 翻页上限（cursor loop 防死循环——任一分页失败即整体抛出，不部分返回）。 */
const MAX_PAGES = 10
const ANTHROPIC_VERSION = "2023-06-01"

/** 单页 GET + JSON 解析（非 2xx → throw；畸形 JSON → null——解析侧各自防御）。 */
async function fetchJson(provider, url, headers, signal) {
  const opts = {
    headers,
    signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(LIST_TIMEOUT_MS)]) : AbortSignal.timeout(LIST_TIMEOUT_MS),
    _headerTimeoutMs: LIST_TIMEOUT_MS,
    _bodyIdleMs: LIST_TIMEOUT_MS,
  }
  const response = await (provider.proxyUri ? proxyFetch(url, opts, provider.proxyUri) : fetch(url, opts))
  if (!response.ok) {
    const text = await response.text().catch(() => "")
    throw new Error(`GET /models failed ${response.status}: ${text}`)
  }
  return response.json().catch(() => null)
}

/** 防御性收集：字段缺失/非字符串项跳过。 */
function collect(rows, pick) {
  if (!Array.isArray(rows)) return []
  const out = []
  for (const row of rows) {
    const v = pick(row)
    if (typeof v === "string" && v) out.push(v)
  }
  return out
}

async function listOpenai(provider, signal) {
  const url = `${provider.baseURL}/models`
  const data = await fetchJson(provider, url, { ...(provider.headers ?? {}), Authorization: `Bearer ${provider.apiKey}` }, signal)
  return collect(data?.data, (m) => m?.id)
}

async function listAnthropic(provider, signal) {
  const headers = { ...(provider.headers ?? {}), "x-api-key": provider.apiKey ?? "", "anthropic-version": ANTHROPIC_VERSION }
  const base = `${provider.baseURL}/models?limit=1000`
  const out = []
  let afterId = null
  for (let page = 0; page < MAX_PAGES; page++) {
    const url = afterId ? `${base}&after_id=${encodeURIComponent(afterId)}` : base
    const data = await fetchJson(provider, url, headers, signal)
    out.push(...collect(data?.data, (m) => m?.id))
    if (!data?.has_more) return out
    afterId = typeof data?.last_id === "string" && data.last_id ? data.last_id : null
    if (!afterId) return out // has_more 但无游标——无法继续，避免死循环
  }
  return out
}

async function listGoogle(provider, signal) {
  const headers = { ...(provider.headers ?? {}) }
  const base = `${provider.baseURL}/models?key=${encodeURIComponent(provider.apiKey ?? "")}&pageSize=1000`
  const out = []
  let pageToken = null
  for (let page = 0; page < MAX_PAGES; page++) {
    const url = pageToken ? `${base}&pageToken=${encodeURIComponent(pageToken)}` : base
    const data = await fetchJson(provider, url, headers, signal)
    out.push(...collect(data?.models, (m) => (typeof m?.name === "string" ? m.name.replace(/^models\//, "") : null)))
    if (typeof data?.nextPageToken !== "string" || !data.nextPageToken) return out
    pageToken = data.nextPageToken
  }
  return out
}

/** List available model IDs from the provider's /models endpoint (format 分派——M1)。 */
export async function listModels(provider, { signal } = {}) {
  const format = provider?.format
  if (format === "anthropic") return listAnthropic(provider, signal)
  if (format === "google") return listGoogle(provider, signal)
  return listOpenai(provider, signal)
}
